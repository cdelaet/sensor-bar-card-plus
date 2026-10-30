import { getFiniteNumber } from '../config/normalize.js';
import { fetchRecorderHistory, historySourceKey } from './history-provider.js';

function normalizeSource(source) {
  const entityId = typeof source === 'string' ? source : source?.entityId ?? source?.entity;
  const attribute = typeof source === 'object' && source ? source.attribute ?? null : null;
  if (typeof entityId !== 'string' || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId.trim())) {
    throw new TypeError(`Invalid history entity ID: ${entityId}`);
  }
  if (attribute !== null && (typeof attribute !== 'string' || !attribute.trim())) {
    throw new TypeError('History source attribute must be a non-empty string');
  }
  return { entityId: entityId.trim(), attribute: attribute?.trim() ?? null };
}

function cloneRecord(record, extra = {}) {
  return {
    ...record,
    observations: (record.observations ?? []).map((observation) => ({ ...observation })),
    coverage: { ...(record.coverage ?? {}) },
    requestedWindow: record.requestedWindow ? { ...record.requestedWindow } : null,
    acquiredWindow: record.acquiredWindow ? { ...record.acquiredWindow } : null,
    ...extra,
  };
}

function timestampFromState(state) {
  const raw = state?.last_updated ?? state?.last_changed;
  const timestamp = raw instanceof Date ? raw.getTime() : Date.parse(String(raw ?? ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function liveValue(state, attribute) {
  if (!state || ['unknown', 'unavailable'].includes(String(state.state ?? '').trim().toLowerCase())) return null;
  return attribute
    ? getFiniteNumber(state.attributes?.[attribute])
    : getFiniteNumber(state.state);
}

function compareObservations(a, b) {
  return a.timestamp - b.timestamp || a.order - b.order;
}

function mergeObservations(...lists) {
  const merged = new Map();
  for (const observation of lists.flat()) {
    // Recorder order identifies a row within a response. Live sequence identifies
    // a delivered event. Never collapse distinct transitions with equal values.
    const key = observation.origin === 'live'
      ? `live:${observation.order}`
      : `recorder:${observation.orderDomain ?? ''}:${observation.timestamp}:${observation.order}:${String(observation.value)}:${String(observation.state)}`;
    if (!merged.has(key)) merged.set(key, observation);
  }
  return [...merged.values()].sort(compareObservations);
}

export class SharedObservationService {
  constructor({ provider = fetchRecorderHistory, now = Date.now, ttlMs = 30000, maxEntries = 128,
    maxObservations = 50000, maxConsumerObservations = 10000, maxConsumers = 256,
    requestTimeoutMs = 30000 } = {}) {
    if (typeof provider !== 'function') throw new TypeError('provider must be a function');
    this.provider = provider;
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.maxObservations = maxObservations;
    this.maxConsumerObservations = maxConsumerObservations;
    this.maxConsumers = maxConsumers;
    this.requestTimeoutMs = requestTimeoutMs;
    this.cache = new Map();
    this.inflight = new Map();
    this.generations = new Map();
    this.queue = [];
    this.flushScheduled = false;
    this.consumers = new Map();
    this.journals = new Map();
    this.acceptedFlights = new Map();
    this.nextFlightId = 0;
    this.nextConsumerId = 0;
    this.liveSequence = 0;
  }

  request({ hass, sources, window, force = false }) {
    if (!window || typeof window.cacheKey !== 'string' || !Number.isFinite(window.start)
      || !Number.isFinite(window.end) || window.end <= window.start) {
      throw new TypeError('A resolved positive-duration time window is required');
    }
    if (!Array.isArray(sources)) throw new TypeError('History sources must be an array');
    const normalized = [...new Map(sources.map((source) => {
      const item = normalizeSource(source);
      return [historySourceKey(item), item];
    })).values()];
    const promises = normalized.map((source) => this._requestSource(hass, source, window, force));
    return Promise.all(promises).then((records) => new Map(records.map((record, index) => [
      historySourceKey(normalized[index]), this._decorateForActiveConsumers(normalized[index], window, record),
    ])));
  }

  _cacheKey(source, window) {
    return `${historySourceKey(source)}\u0001${window.cacheKey}`;
  }

  _covers(record, window) {
    const acquired = record?.acquiredWindow;
    if (!acquired || acquired.start > window.start) return false;
    return acquired.end >= window.end;
  }

  _requestSource(hass, source, window, force) {
    const cacheKey = this._cacheKey(source, window);
    const cached = this._touch(cacheKey);
    if (!force && cached && !cached.stale && this.now() - cached.fetchedAt < this.ttlMs && this._covers(cached, window)) {
      return Promise.resolve(cloneRecord(cached, { cache: 'hit', stale: false,
        requestedWindow: { start: window.start, end: window.end } }));
    }

    const generation = this.generations.get(cacheKey) ?? 0;
    const sourceKey = historySourceKey(source);
    const queued = this.queue.find((item) => item.cacheKey === cacheKey && item.generation === generation
      && historySourceKey(item.source) === sourceKey);
    if (queued) {
      queued.window = {
        ...queued.window,
        start: Math.min(queued.window.start, window.start),
        end: Math.max(queued.window.end, window.end),
      };
      return queued.promise.then((record) => cloneRecord(record, { requestedWindow: { start: window.start, end: window.end } }));
    }

    const existing = [...this.inflight.values()].find((flight) => flight.cacheKey === cacheKey
      && flight.generation === generation && flight.sourceKey === sourceKey
      && flight.window.start <= window.start && flight.window.end >= window.end);
    if (existing) return existing.promise.then((record) => cloneRecord(record,
      { requestedWindow: { start: window.start, end: window.end } }));

    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    const flight = {
      id: ++this.nextFlightId, hass, source, sourceKey, window: { ...window }, requestedWindow: { start: window.start, end: window.end },
      cacheKey, generation, resolve, promise, startedAt: this.now(),
    };
    this.inflight.set(flight.id, flight);
    this.queue.push(flight);
    this._scheduleFlush();
    return promise.then((record) => cloneRecord(record, { requestedWindow: { start: window.start, end: window.end } }));
  }

  _scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    Promise.resolve().then(() => this._flush());
  }

  async _flush() {
    this.flushScheduled = false;
    const pending = this.queue.splice(0);
    const groups = new Map();
    for (const item of pending) {
      const groupKey = `${item.window.cacheKey}\u0000${item.window.timeZone}`;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(item);
    }

    await Promise.all([...groups.values()].map(async (items) => {
      const queryWindow = {
        ...items[0].window,
        start: Math.min(...items.map((item) => item.window.start)),
        end: Math.max(...items.map((item) => item.window.end)),
      };
      const sources = [...new Map(items.map((item) => [item.sourceKey, item.source])).values()];
      let fetched;
      let failure = null;
      try {
        const request = this.provider(items[0].hass, sources, queryWindow, this.now);
        if (Number.isFinite(this.requestTimeoutMs) && this.requestTimeoutMs > 0) {
          let timer;
          try {
            fetched = await Promise.race([request, new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error('Recorder history request timed out')), this.requestTimeoutMs);
            })]);
          } finally {
            clearTimeout(timer);
          }
        } else {
          fetched = await request;
        }
      } catch (error) {
        failure = error;
      }

      for (const item of items) {
        const currentGeneration = this.generations.get(item.cacheKey) ?? 0;
        const accepted = this.acceptedFlights.get(item.cacheKey);
        const superseded = item.id < (accepted?.id ?? 0);
        const response = fetched?.get(item.sourceKey);
        const journal = this.journals.get(item.cacheKey);
        const previous = this.cache.get(item.cacheKey) ?? (journal?.recordMetadata
          ? { ...journal.recordMetadata, observations: journal.observations } : null);
        let record;
        if (superseded) {
          record = accepted?.record ? cloneRecord(accepted.record, { cache: 'superseded' }) : {
            source: item.source, observations: [], status: 'stale', stale: true,
            coverage: { complete: false, kind: 'unknown', reason: 'Superseded acquisition' },
          };
        } else if (failure && currentGeneration === item.generation) {
          record = previous
            ? cloneRecord(previous, { status: 'stale', stale: true, error: failure, cache: 'stale' })
            : {
              source: item.source, observations: [], status: 'unavailable', stale: false,
              retrievedAt: this.now(), observedThrough: null,
              requestedWindow: item.requestedWindow,
              acquiredWindow: null,
              error: failure,
              coverage: { complete: false, kind: 'unknown', reason: 'History provider request failed',
                requested: item.requestedWindow },
            };
          if (previous && this.cache.has(item.cacheKey)) this.cache.set(item.cacheKey, record);
        } else if (currentGeneration !== item.generation) {
          record = previous
            ? cloneRecord(previous, { stale: true, cache: 'superseded' })
            : response
              ? { ...response, status: 'stale', stale: true,
                coverage: { ...response.coverage, reason: 'Superseded by an invalidation' } }
              : { source: item.source, observations: [], status: 'stale', stale: true,
                retrievedAt: this.now(), observedThrough: null, requestedWindow: item.requestedWindow,
                acquiredWindow: { start: queryWindow.start, end: queryWindow.end },
                coverage: { complete: false, kind: 'unknown', reason: 'Superseded by an invalidation' } };
        } else if (!response) {
          record = { source: item.source, observations: [], status: 'unavailable', stale: false,
            retrievedAt: this.now(), observedThrough: null, requestedWindow: item.requestedWindow,
            acquiredWindow: null,
            coverage: { complete: false, kind: 'unknown', reason: 'History response omitted the requested source',
              requested: item.requestedWindow } };
        } else {
          const activeLive = [...this.journals.entries()]
            .filter(([key]) => key.startsWith(`${item.sourceKey}\u0001`))
            .flatMap(([, journal]) => journal.observations.filter((observation) => observation.origin === 'live'));
          const cachedLive = previous?.observations.filter((observation) => observation.origin === 'live') ?? [];
          const recorder = (response.observations ?? []).map((observation) => ({
            ...observation, orderDomain: `recorder:${item.id}`,
          }));
          const observations = mergeObservations(recorder, cachedLive, activeLive)
            .map((observation) => ({
              ...observation,
              boundaryEffective: observation.timestamp < item.requestedWindow.start,
              transitionInWindow: observation.timestamp >= item.requestedWindow.start
                && observation.timestamp < item.requestedWindow.end,
            }));
          const boundary = observations.filter((observation) => observation.timestamp <= item.requestedWindow.start).at(-1) ?? null;
          const lastTimestamp = observations.at(-1)?.timestamp ?? null;
          const liveThrough = observations.filter((observation) => observation.origin === 'live')
            .reduce((latest, observation) => Math.max(latest, observation.timestamp), -Infinity);
          record = {
            ...response,
            observations,
            requestedWindow: item.requestedWindow,
            acquiredWindow: { start: queryWindow.start, end: Math.min(queryWindow.end, this.now()) },
            fetchedAt: this.now(),
            requestStartedAt: item.startedAt,
            acquisitionId: item.id,
            liveThrough: Number.isFinite(liveThrough) ? liveThrough : null,
            observedThrough: lastTimestamp,
            coverage: { ...response.coverage,
              recorderObserved: { ...(response.coverage?.observed ?? {}) },
              requested: { ...item.requestedWindow },
              acquisitionRequest: { start: queryWindow.start, end: queryWindow.end },
              observed: { ...(response.coverage?.observed ?? {}) },
              liveObserved: Number.isFinite(liveThrough) ? { firstTimestamp: observations
                .filter((observation) => observation.origin === 'live')
                .reduce((first, observation) => Math.min(first, observation.timestamp), Infinity),
              lastTimestamp: liveThrough } : { firstTimestamp: null, lastTimestamp: null },
              boundaryState: { requested: true, found: boundary !== null, timestamp: boundary?.timestamp ?? null,
                origin: boundary?.origin ?? null },
              futureInterval: item.requestedWindow.end > this.now(),
              ...(Number.isFinite(liveThrough) ? { liveObservedThrough: liveThrough } : {}) },
            cache: 'miss', stale: false,
          };
          this._store(item.cacheKey, record);
        }
        if (!superseded && currentGeneration === item.generation) {
          this.acceptedFlights.set(item.cacheKey, { id: item.id, record });
        }
        item.resolve(cloneRecord(record));
        this.inflight.delete(item.id);
        if (![...this.inflight.values()].some((flight) => flight.cacheKey === item.cacheKey)) {
          this.generations.delete(item.cacheKey);
          this.acceptedFlights.delete(item.cacheKey);
        }
        if (!superseded && currentGeneration === item.generation) this._notify(item.cacheKey, record);
      }
    }));
  }

  _touch(key) {
    const record = this.cache.get(key);
    if (!record) return null;
    this.cache.delete(key);
    this.cache.set(key, record);
    return record;
  }

  _store(key, record) {
    const count = record.observations.length;
    if (count > this.maxObservations) {
      this.cache.delete(key);
      return;
    }
    const previous = this.cache.get(key);
    if (previous) {
      const previousEnd = previous.requestedWindow?.end ?? previous.acquiredWindow?.end ?? -Infinity;
      const nextEnd = record.requestedWindow?.end ?? record.acquiredWindow?.end ?? -Infinity;
      if (previousEnd > nextEnd) return;
      if (previousEnd === nextEnd && Number.isFinite(previous.requestStartedAt)
        && Number.isFinite(record.requestStartedAt) && previous.requestStartedAt > record.requestStartedAt) return;
    }
    this.cache.delete(key);
    this.cache.set(key, record);
    while (this.cache.size > this.maxEntries || this._observationCount() > this.maxObservations) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }

  _observationCount() {
    let count = 0;
    for (const record of this.cache.values()) count += record.observations.length;
    return count;
  }

  _consumerRecord(consumer, record, merge = true) {
    let incoming = record.observations ?? [];
    if (record.acquiredWindow) {
      const acquired = record.acquiredWindow;
      const windows = [...this.consumers.values()].filter((item) => item.journal === consumer.journal)
        .map((item) => item.window);
      const older = Number.isFinite(record.acquisitionId) && Number.isFinite(consumer.recordMetadata?.acquisitionId)
        && record.acquisitionId < consumer.recordMetadata.acquisitionId;
      if (older) {
        incoming = incoming.filter((observation) => observation.origin === 'live');
        record = { ...record, ...consumer.recordMetadata, requestedWindow: record.requestedWindow };
      } else if (!record.stale && !record.error) {
        const boundaryTime = incoming.filter((sample) => sample.origin !== 'live' && sample.timestamp < acquired.start)
          .reduce((latest, sample) => Math.max(latest, sample.timestamp), -Infinity);
        const canReplaceBoundary = windows.every((window) => window.start >= acquired.start);
        consumer.observations = consumer.observations.filter((sample) => sample.origin === 'live'
          || !((sample.timestamp >= acquired.start && sample.timestamp < acquired.end)
            || (canReplaceBoundary && sample.timestamp === boundaryTime)));
        if (windows.every((window) => acquired.start <= window.start && acquired.end >= window.end)
          && incoming.length <= this.maxConsumerObservations) consumer.overflow = false;
      }
      if (!older) consumer.recordMetadata = {
        ...record, observations: [], coverage: { ...(record.coverage ?? {}) },
      };
    }
    if (merge) this._mergeIntoConsumer(consumer, incoming);
    const observations = consumer.observations.map((observation) => ({ ...observation }));
    const liveThrough = observations.filter((observation) => observation.origin === 'live')
      .reduce((latest, observation) => Math.max(latest, observation.timestamp), -Infinity);
    const base = consumer.recordMetadata ?? {};
    return cloneRecord({
      ...base,
      ...record,
      acquiredWindow: record.acquiredWindow ?? base.acquiredWindow ?? null,
      fetchedAt: record.fetchedAt ?? base.fetchedAt ?? null,
      retrievedAt: record.retrievedAt ?? base.retrievedAt ?? null,
      coverage: { ...(base.coverage ?? {}), ...(record.coverage ?? {}) },
    }, {
      observations,
      liveThrough: Number.isFinite(liveThrough) ? liveThrough : null,
      observedThrough: Number.isFinite(record.observedThrough) && Number.isFinite(liveThrough)
        ? Math.max(record.observedThrough, liveThrough)
        : (Number.isFinite(liveThrough) ? liveThrough : record.observedThrough ?? null),
      coverage: { ...record.coverage,
        boundaryState: (() => {
          const boundary = observations.filter((observation) => observation.timestamp <= consumer.window.start).at(-1) ?? null;
          return { requested: true, found: boundary !== null, timestamp: boundary?.timestamp ?? null,
            origin: boundary?.origin ?? null };
        })(),
        liveOverflow: consumer.overflow,
        liveObservedThrough: Number.isFinite(liveThrough) ? liveThrough : null,
        ...(consumer.overflow ? { reason: 'Active observation buffer limit reached; extrema are incomplete' } : {}) },
    });
  }

  _mergeIntoConsumer(consumer, incoming) {
    consumer.observations = mergeObservations(consumer.observations, incoming);
    const starts = [...this.consumers.values()].filter((item) => item.journal === consumer.journal)
      .map((item) => item.window.start);
    const earliest = Math.min(consumer.window.start, ...starts);
    const before = consumer.observations.filter((sample) => sample.timestamp < earliest);
    const inOrAfter = consumer.observations.filter((sample) => sample.timestamp >= earliest);
    const boundaryTime = before.at(-1)?.timestamp;
    const boundary = before.filter((sample) => sample.timestamp === boundaryTime);
    consumer.observations = [...boundary, ...inOrAfter];
    if (consumer.observations.length > this.maxConsumerObservations) {
      const keptBoundary = this.maxConsumerObservations > 0 ? boundary.slice(-this.maxConsumerObservations) : [];
      const remaining = Math.max(0, this.maxConsumerObservations - keptBoundary.length);
      consumer.observations = [...keptBoundary, ...(remaining ? inOrAfter.slice(-remaining) : [])];
      consumer.overflow = true;
    }
  }

  _decorateForActiveConsumers(source, window, record) {
    const adjusted = cloneRecord(record, {
      requestedWindow: { start: window.start, end: window.end },
      coverage: { ...record.coverage,
        requested: { start: window.start, end: window.end },
        acquisitionRequest: record.acquiredWindow ? { ...record.acquiredWindow } : null },
    });
    const sourceKey = historySourceKey(source);
    const consumer = [...this.consumers.values()].find((consumer) => consumer.sourceKey === sourceKey
      && consumer.window.cacheKey === window.cacheKey);
    return consumer ? this._consumerRecord(consumer, adjusted) : adjusted;
  }

  subscribe(source, window, callback) {
    if (typeof callback !== 'function') throw new TypeError('A consumer callback is required');
    if (this.consumers.size >= this.maxConsumers) throw new RangeError('Active history consumer limit reached');
    const normalized = normalizeSource(source);
    const journalKey = this._cacheKey(normalized, window);
    let journal = this.journals.get(journalKey);
    if (!journal) {
      journal = { observations: [], overflow: false, recordMetadata: null, refs: 0 };
      this.journals.set(journalKey, journal);
    }
    journal.refs += 1;
    const consumer = {
      id: ++this.nextConsumerId,
      source: normalized,
      sourceKey: historySourceKey(normalized),
      window,
      callback,
      journalKey, journal,
      get observations() { return this.journal.observations; },
      set observations(value) { this.journal.observations = value; },
      get overflow() { return this.journal.overflow; },
      set overflow(value) { this.journal.overflow = value; },
      get recordMetadata() { return this.journal.recordMetadata; },
      set recordMetadata(value) { this.journal.recordMetadata = value; },
    };
    const cacheKey = this._cacheKey(normalized, window);
    const cached = this.cache.get(cacheKey);
    if (cached && (!journal.recordMetadata || (cached.acquisitionId ?? 0) > (journal.recordMetadata.acquisitionId ?? 0))) {
      this._consumerRecord(consumer, cached);
    }
    this.consumers.set(consumer.id, consumer);
    const releaseJournal = () => {
      if (--consumer.journal.refs === 0) this.journals.delete(consumer.journalKey);
    };
    const dispose = () => {
      if (this.consumers.delete(consumer.id)) releaseJournal();
    };
    dispose.updateWindow = (nextWindow) => {
      const nextKey = this._cacheKey(normalized, nextWindow);
      if (nextKey !== consumer.journalKey) {
        releaseJournal();
        let nextJournal = this.journals.get(nextKey);
        if (!nextJournal) {
          nextJournal = { observations: [], overflow: false, recordMetadata: null, refs: 0 };
          this.journals.set(nextKey, nextJournal);
        }
        nextJournal.refs += 1;
        consumer.journalKey = nextKey;
        consumer.journal = nextJournal;
      }
      consumer.window = nextWindow;
      const nextCached = this.cache.get(this._cacheKey(normalized, nextWindow));
      if (nextCached && (!consumer.recordMetadata
        || (nextCached.acquisitionId ?? 0) > (consumer.recordMetadata.acquisitionId ?? 0))) {
        this._consumerRecord(consumer, nextCached);
      }
    };
    dispose.merge = (record) => this._consumerRecord(consumer, record);
    return dispose;
  }

  _notify(cacheKey, record) {
    const [sourceKey, familyKey] = cacheKey.split('\u0001');
    for (const consumer of this.consumers.values()) {
      if (consumer.sourceKey !== sourceKey || consumer.window.cacheKey !== familyKey) continue;
      try { consumer.callback(this._consumerRecord(consumer, record)); } catch { /* Isolate consumer failures. */ }
    }
  }

  ingestLiveState({ source, state, timestamp = null }) {
    const normalized = normalizeSource(source);
    const observedAt = Number.isFinite(timestamp) ? timestamp : timestampFromState(state);
    if (!Number.isFinite(observedAt) || observedAt > this.now()) return 0;
    const value = liveValue(state, normalized.attribute);
    const observation = {
      entityId: normalized.entityId,
      attribute: normalized.attribute,
      timestamp: observedAt,
      value,
      state: state?.state ?? null,
      boundaryEffective: false,
      transitionInWindow: false,
      order: 1_000_000_000_000 + ++this.liveSequence,
      orderKnown: true,
      orderDomain: 'live',
      origin: 'live',
    };
    let updated = 0;
    const updatedJournals = new Set();
    for (const consumer of this.consumers.values()) {
      if (consumer.sourceKey !== historySourceKey(normalized)) continue;
      if (!updatedJournals.has(consumer.journal)) {
        this._mergeIntoConsumer(consumer, [observation]);
        updatedJournals.add(consumer.journal);
      }
      try { consumer.callback(this._consumerRecord(consumer, { source: normalized,
        observations: consumer.observations, status: 'partial',
        stale: consumer.recordMetadata?.stale === true, error: consumer.recordMetadata?.error ?? null,
        retrievedAt: consumer.recordMetadata?.retrievedAt ?? null, observedThrough: observedAt,
        requestedWindow: { start: consumer.window.start, end: consumer.window.end },
        coverage: { complete: false, kind: 'unknown', reason: 'Live samples are reconciled with Recorder asynchronously' } }, false)); }
      catch { /* Isolate consumer failures. */ }
      updated += 1;
    }

    for (const record of this.cache.values()) {
      if (historySourceKey(record.source) !== historySourceKey(normalized)) continue;
      record.observations = mergeObservations(record.observations, [observation]);
      record.liveThrough = Math.max(record.liveThrough ?? -Infinity, observedAt);
      record.observedThrough = Math.max(record.observedThrough ?? -Infinity, observedAt);
      record.coverage = { ...record.coverage, liveObservedThrough: record.liveThrough };
    }
    while (this._observationCount() > this.maxObservations && this.cache.size) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return updated;
  }

  invalidate({ sources = null, windowKey = null } = {}) {
    const sourceKeys = sources ? new Set(sources.map((source) => historySourceKey(normalizeSource(source)))) : null;
    const keys = new Set([
      ...this.cache.keys(),
      ...this.journals.keys(),
      ...[...this.inflight.values()].map((flight) => flight.cacheKey),
    ]);
    for (const key of keys) {
      const [sourceKey, familyKey] = key.split('\u0001');
      if (sourceKeys && !sourceKeys.has(sourceKey)) continue;
      if (windowKey && familyKey !== windowKey) continue;
      this.cache.delete(key);
      const journal = this.journals.get(key);
      if (journal?.recordMetadata) {
        journal.recordMetadata = { ...journal.recordMetadata, stale: true, status: 'stale',
          coverage: { ...journal.recordMetadata.coverage, complete: false,
            reason: 'History invalidated; Recorder revalidation is required' } };
        this._notify(key, { ...journal.recordMetadata, observations: journal.observations });
      }
      if ([...this.inflight.values()].some((flight) => flight.cacheKey === key)) {
        this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
      } else {
        this.generations.delete(key);
      }
    }
  }

  clear() {
    this.invalidate();
    this.cache.clear();
    this.consumers.clear();
    this.journals.clear();
    this.acceptedFlights.clear();
  }
}

const servicesByConnection = new WeakMap();

export function getSharedObservationService(hass, options = {}) {
  const connection = hass?.connection && typeof hass.connection === 'object' ? hass.connection : hass;
  if (!connection || typeof connection !== 'object') throw new TypeError('A Home Assistant connection is required');
  if (!servicesByConnection.has(connection)) servicesByConnection.set(connection, new SharedObservationService(options));
  return servicesByConnection.get(connection);
}
