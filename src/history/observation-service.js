import { getFiniteNumber } from '../config/normalize.js';
import { fetchPlannedHistory, fetchRecorderStatistics, historySourceKey } from './history-provider.js';
import { HISTORY_DEBUG_TRACE, historyDebugEnabled, historyDebugId, historyDebugLog, historyDebugTime } from './history-debug.js';

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
    observations: record.observations ?? [],
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

function boundaryObservation(observations, start) {
  let low = 0, high = observations.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (observations[middle].timestamp <= start) low = middle + 1;
    else high = middle;
  }
  return low ? observations[low - 1] : null;
}

function retainedRawStart(window, record) {
  if ((window.acquisition?.mode ?? 'raw') !== 'statistics') return window.start;
  return Math.min(window.acquisition.raw?.start ?? window.acquisition.statistics?.end ?? record?.rawWindow?.start ?? window.start,
    record?.retainedRawStart ?? Infinity);
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
  constructor({ provider = fetchPlannedHistory, now = Date.now, ttlMs = 30000, maxEntries = 128,
    maxConsumers = 256,
    requestTimeoutMs = 30000 } = {}) {
    if (typeof provider !== 'function') throw new TypeError('provider must be a function');
    this.provider = provider;
    this.now = now;
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.maxConsumers = maxConsumers;
    this.requestTimeoutMs = requestTimeoutMs;
    this.cache = new Map();
    this.inflight = new Map();
    this.statisticsRetries = new Map();
    this.generations = new Map();
    this.sourceEpochs = new Map();
    this.queue = [];
    this.flushScheduled = false;
    this.consumers = new Map();
    this.families = new Map();
    this.sourceHistories = new Map();
    this.acceptedFlights = new Map();
    this.acceptedSources = new Map();
    this.nextFlightId = 0;
    this.nextConsumerId = 0;
    this.liveSequence = 0;
    this.activeBatches = 0;
    this.batchWaiters = [];
    this.batchGeneration = 0;
    this.retiredBatches = 0;
    this.batchLeases = new Set();
    this.cacheExpiryTimer = null;
  }

  request({ hass, sources, window, force = false, debugResolutionId = null }) {
    if (!window || typeof window.cacheKey !== 'string' || !Number.isFinite(window.start)
      || !Number.isFinite(window.end) || window.end <= window.start) {
      throw new TypeError('A resolved positive-duration time window is required');
    }
    if (!Array.isArray(sources)) throw new TypeError('History sources must be an array');
    const normalized = [...new Map(sources.map((source) => {
      const item = normalizeSource(source);
      return [historySourceKey(item), item];
    })).values()];
    const promises = normalized.map((source) => this._requestSource(hass, source, window, force, debugResolutionId));
    return Promise.all(promises).then((records) => new Map(records.map((record, index) => {
      const started = debugResolutionId ? historyDebugTime() : 0;
      const decorated = this._decorateForActiveConsumers(normalized[index], window, record);
      if (debugResolutionId) historyDebugLog('journal.merge', { resolutionId: debugResolutionId,
        acquisitionId: record.acquisitionId ?? null, source: normalized[index], elapsedMs: historyDebugTime() - started,
        observations: decorated.observations.length });
      return [historySourceKey(normalized[index]), decorated];
    })));
  }

  _cacheKey(source, window) {
    return `${historySourceKey(source)}\u0001${window.cacheKey}`;
  }

  _historyKey(sourceKey, window) {
    return `${sourceKey}\u0002${window.acquisition?.mode ?? 'raw'}`;
  }

  _pruneSourceEpoch(sourceKey) {
    if ([...this.sourceHistories.keys()].some(key => key.startsWith(`${sourceKey}\u0002`))
      || [...this.cache.values()].some(record => historySourceKey(record.source) === sourceKey)
      || [...this.inflight.values()].some(flight => flight.sourceKey === sourceKey)
      || [...this.statisticsRetries.keys()].some(key => key.startsWith(`${sourceKey}\u0001`))) return;
    this.sourceEpochs.delete(sourceKey);
  }

  retryRecentStatistics({ hass, source, window, record }) {
    const normalized = normalizeSource(source);
    const end = record?.statisticsWindow?.end;
    const start = end - 3600000;
    if (!Number.isFinite(end) || this.now() - end > 2 * 3600000 || this.now() < end
      || record.statistics?.buckets?.some(bucket => bucket.start === start)) return Promise.resolve(null);
    const key = this._cacheKey(normalized, window);
    const retryKey = `${key}\u0002${start}`;
    if (this.statisticsRetries.has(retryKey)) return this.statisticsRetries.get(retryKey);
    const generation = this.generations.get(key) ?? 0;
    const sourceEpoch = this.sourceEpochs.get(historySourceKey(normalized)) ?? 0;
    const acquisitionId = record.acquisitionId;
    const request = this._runBatch(async lease => {
      if (lease.queueTimeout) throw new Error('Statistics retry acquisition queue timed out');
      const pending = fetchRecorderStatistics(hass, [normalized], { mode: 'statistics', statistics: { start, end } }, this.now);
      lease.request = pending;
      let timer;
      try {
        const races = [pending, lease.retired.then(() => { throw new Error('Connection disconnected'); })];
        if (Number.isFinite(this.requestTimeoutMs) && this.requestTimeoutMs > 0) races.push(new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Statistics retry timed out')), this.requestTimeoutMs);
        }));
        return await Promise.race(races);
      } finally { clearTimeout(timer); }
    });
    const promise = request
      .then(records => {
        const bucket = records.get(historySourceKey(normalized))?.statistics?.buckets?.[0];
        if (!bucket || (this.generations.get(key) ?? 0) !== generation
          || (this.sourceEpochs.get(historySourceKey(normalized)) ?? 0) !== sourceEpoch) return null;
        const family = this.families.get(key);
        const latest = this.cache.get(key) ?? family?.recordMetadata;
        if (!latest || latest.acquisitionId !== acquisitionId) return null;
        if (latest.statistics?.buckets?.some(item => item.start === start)) return null;
        const missingBuckets = Math.max(0, (latest.statistics.missingBuckets ?? 1) - 1);
        const statisticsCoverage = latest.coverage?.statistics;
        const resolved = missingBuckets === 0 && statisticsCoverage?.kind === 'incomplete' && !statisticsCoverage?.otherInvalid;
        const rawUnavailable = latest.coverage?.rawAvailable === false;
        const coverage = { ...latest.coverage,
          ...(resolved && !rawUnavailable ? { kind: 'unknown', reason: null } : {}),
          ...(resolved && rawUnavailable ? { kind: 'incomplete', reason: 'Current-hour Recorder history is unavailable' } : {}),
          statistics: resolved ? { ...statisticsCoverage, kind: 'unknown', reason: null } : statisticsCoverage };
        const updated = { ...latest, statistics: { ...latest.statistics, missingBuckets,
          buckets: [...latest.statistics.buckets, bucket].sort((a, b) => a.start - b.start) }, coverage };
        if (updated.retainedRawStart === start) delete updated.retainedRawStart;
        if (this.cache.has(key)) this.cache.set(key, updated);
        if (family) family.recordMetadata = { ...updated, observations: [] };
        this._notify(key, updated, false);
        return updated;
      }).catch(() => null).finally(() => {
        this.statisticsRetries.delete(retryKey);
        this._pruneSourceEpoch(historySourceKey(normalized));
      });
    this.statisticsRetries.set(retryKey, promise);
    return promise;
  }

  _covers(record, window) {
    const acquired = record?.acquiredWindow;
    if (!acquired || acquired.start > window.start) return false;
    return acquired.end >= window.end;
  }

  _requestSource(hass, source, window, force, debugResolutionId = null) {
    const cacheKey = this._cacheKey(source, window);
    const sourceKey = historySourceKey(source);
    const sourceEpoch = this.sourceEpochs.get(sourceKey) ?? 0;
    let cached = this._touch(cacheKey);
    const acquisitionMode = window.acquisition?.mode ?? 'raw';
    if (!force && (!cached || !this._covers(cached, window))) {
      const compatible = [...this.cache.entries()].find(([, record]) =>
        historySourceKey(record.source) === historySourceKey(source)
        && (record.acquisitionMode ?? 'raw') === acquisitionMode
        && (record.sourceEpoch ?? 0) === sourceEpoch
        && !record.stale && this.now() - record.fetchedAt < this.ttlMs && this._covers(record, window));
      if (compatible) cached = this._touch(compatible[0]);
    }
    const cacheFresh = !force && cached && !cached.stale && (cached.sourceEpoch ?? 0) === sourceEpoch
      && this.now() - cached.fetchedAt < this.ttlMs;
    const cacheCovered = cacheFresh ? this._covers(cached, window) : false;
    if (debugResolutionId) historyDebugLog('cache.check', { resolutionId: debugResolutionId, source, force,
      found: Boolean(cached), fresh: force ? null : Boolean(cacheFresh),
      coversRequested: cached ? (cacheFresh ? cacheCovered : this._covers(cached, window)) : false, acquiredWindow: cached?.acquiredWindow ?? null,
      requestedWindow: { start: window.start, end: window.end } });
    if (cacheFresh && cacheCovered) {
      if (debugResolutionId) historyDebugLog('cache.hit', { resolutionId: debugResolutionId, source });
      return Promise.resolve(cloneRecord(cached, { cache: 'hit', stale: false,
        requestedWindow: { start: window.start, end: window.end } }));
    }
    if (debugResolutionId) historyDebugLog('cache.miss', { resolutionId: debugResolutionId, source, force });

    const generation = this.generations.get(cacheKey) ?? 0;
    const queued = this.queue.find((item) => item.sourceKey === sourceKey && item.sourceEpoch === sourceEpoch
      && item.generation === (this.generations.get(item.cacheKey) ?? 0)
      && (item.cacheKey === cacheKey || (acquisitionMode === 'raw' && (item.window.acquisition?.mode ?? 'raw') === 'raw')));
    if (queued) {
      if (debugResolutionId) historyDebugLog('acquisition.join_queued', { resolutionId: debugResolutionId, acquisitionId: queued.id, source });
      queued.window = {
        ...queued.window,
        start: Math.min(queued.window.start, window.start),
        end: Math.max(queued.window.end, window.end),
      };
      return queued.promise.then((record) => cloneRecord(record, { requestedWindow: { start: window.start, end: window.end } }));
    }

    const existing = [...this.inflight.values()].find((flight) => flight.sourceKey === sourceKey
      && (flight.window.acquisition?.mode ?? 'raw') === acquisitionMode
      && flight.generation === (this.generations.get(flight.cacheKey) ?? 0)
      && flight.sourceEpoch === sourceEpoch
      && flight.window.start <= window.start && flight.window.end >= window.end);
    if (existing) {
      if (debugResolutionId) historyDebugLog('acquisition.join_inflight', { resolutionId: debugResolutionId, acquisitionId: existing.id, source });
      return existing.promise.then((record) => cloneRecord(record,
        { requestedWindow: { start: window.start, end: window.end } }));
    }

    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    const flight = {
      id: ++this.nextFlightId, hass, source, sourceKey, window: { ...window }, requestedWindow: { start: window.start, end: window.end },
      cacheKey, generation, resolve, promise, startedAt: this.now(),
      sourceEpoch,
    };
    this.inflight.set(flight.id, flight);
    if (debugResolutionId) historyDebugLog('acquisition.queued', { resolutionId: debugResolutionId, acquisitionId: flight.id, source });
    this.queue.push(flight);
    this._scheduleFlush();
    return promise.then((record) => cloneRecord(record, { requestedWindow: { start: window.start, end: window.end } }));
  }

  _scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    Promise.resolve().then(() => this._flush());
  }

  async _runBatch(task) {
    const generation = this.batchGeneration;
    let acquired = true;
    if (this.activeBatches >= 3) {
      acquired = await new Promise(resolve => {
        const waiter = { resolve, timer: null };
        if (Number.isFinite(this.requestTimeoutMs) && this.requestTimeoutMs > 0) {
          waiter.timer = setTimeout(() => {
            const index = this.batchWaiters.indexOf(waiter);
            if (index >= 0) this.batchWaiters.splice(index, 1);
            resolve(false);
          }, this.requestTimeoutMs);
        }
        this.batchWaiters.push(waiter);
      });
    } else this.activeBatches += 1;
    if (!acquired) return task({ queueTimeout: true });
    if (generation !== this.batchGeneration) {
      this.retiredBatches -= 1;
      return task({ queueTimeout: true });
    }
    let retire;
    const retired = new Promise(resolve => { retire = resolve; });
    const lease = { request: null, generation, retired, retire };
    this.batchLeases.add(lease);
    const release = () => {
      this.batchLeases.delete(lease);
      if (generation !== this.batchGeneration) { this.retiredBatches -= 1; return; }
      const next = this.batchWaiters.shift();
      if (next) { clearTimeout(next.timer); next.resolve(true); }
      else this.activeBatches -= 1;
    };
    try { return await task(lease); } finally {
      if (lease.request) Promise.resolve(lease.request).then(release, release);
      else release();
    }
  }

  retireConnection() {
    this.retiredBatches += this.activeBatches;
    this.activeBatches = 0;
    this.batchGeneration += 1;
    for (const lease of this.batchLeases) lease.retire();
    for (const waiter of this.batchWaiters.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.resolve(false);
    }
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

    const batches = [];
    for (const items of groups.values()) {
      const bySource = new Map();
      for (const item of items) {
        if (!bySource.has(item.sourceKey)) bySource.set(item.sourceKey, []);
        bySource.get(item.sourceKey).push(item);
      }
      const sources = [...bySource.values()];
      for (let index = 0; index < sources.length; index += 4) batches.push(sources.slice(index, index + 4).flat());
    }
    await Promise.all(batches.map((items) => this._runBatch(async (lease) => {
      const queryWindow = {
        ...items[0].window,
        start: Math.min(...items.map((item) => item.window.start)),
        end: Math.max(...items.map((item) => item.window.end)),
      };
      const sources = [...new Map(items.map((item) => [item.sourceKey, item.source])).values()];
      if ((queryWindow.acquisition?.mode ?? 'raw') === 'raw') {
        const requestedSources = new Set(items.map(item => item.sourceKey));
        const earliestRecent = Math.floor(this.now() / 60000) * 60000 - 24 * 60 * 60000;
        const compatible = [...this.consumers.values()].filter(consumer => requestedSources.has(consumer.sourceKey)
          && consumer.window.cacheKey !== queryWindow.cacheKey
          && consumer.window.start >= earliestRecent
          && (consumer.window.acquisition?.mode ?? 'raw') === 'raw');
        for (const consumer of compatible) {
          queryWindow.start = Math.min(queryWindow.start, consumer.window.start);
          queryWindow.end = Math.max(queryWindow.end, consumer.window.end);
        }
      }
      const debug = historyDebugEnabled();
      const trace = debug ? { batchId: historyDebugId('batch'), acquisitionIds: items.map(item => item.id) } : null;
      const batchStarted = debug ? historyDebugTime() : 0;
      if (trace) {
        Object.defineProperty(queryWindow, HISTORY_DEBUG_TRACE, { value: trace });
        historyDebugLog('acquisition.batch.start', { ...trace, sources, requestedWindow: { start: queryWindow.start, end: queryWindow.end }, timeZone: queryWindow.timeZone });
      }
      let fetched;
      let failure = null;
      try {
        if (lease.queueTimeout) throw new Error('Recorder history acquisition queue timed out');
        const request = this.provider(items[0].hass, sources, queryWindow, this.now);
        lease.request = request;
        let timer;
        try {
          const races = [request, lease.retired.then(() => { throw new Error('Connection disconnected'); })];
          if (Number.isFinite(this.requestTimeoutMs) && this.requestTimeoutMs > 0) races.push(new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Recorder history request timed out')), this.requestTimeoutMs);
          }));
          fetched = await Promise.race(races);
        } finally { clearTimeout(timer); }
      } catch (error) {
        failure = error;
      }
      if (trace) historyDebugLog(failure ? 'acquisition.batch.error' : 'acquisition.batch.response', {
        ...trace, elapsedMs: historyDebugTime() - batchStarted, timeoutMs: this.requestTimeoutMs,
        error: failure ? String(failure) : null,
      });

      for (const item of items) {
        const mergeStarted = trace ? historyDebugTime() : 0;
        if (trace) historyDebugLog('acquisition.source.merge.start', { ...trace, acquisitionId: item.id, source: item.source });
        const currentGeneration = this.generations.get(item.cacheKey) ?? 0;
        const epochCurrent = (this.sourceEpochs.get(item.sourceKey) ?? 0) === item.sourceEpoch;
        const accepted = this.acceptedFlights.get(item.cacheKey);
        const sourceAcceptedKey = `${item.sourceKey}\u0002${item.window.acquisition?.mode ?? 'raw'}`;
        const sourceAccepted = this.acceptedSources.get(sourceAcceptedKey);
        const superseded = item.id < Math.max(accepted?.id ?? 0, sourceAccepted?.id ?? 0);
        const response = fetched?.get(item.sourceKey);
        const family = this.families.get(item.cacheKey);
        const previous = this.cache.get(item.cacheKey) ?? (family?.recordMetadata
          ? { ...family.recordMetadata, observations: family.history.observations } : null);
        let record;
        if (superseded) {
          const newest = (accepted?.id ?? 0) >= (sourceAccepted?.id ?? 0) ? accepted : sourceAccepted;
          record = newest?.record ? cloneRecord(newest.record, { cache: 'superseded' }) : {
            source: item.source, observations: [], status: 'stale', stale: true,
            coverage: { complete: false, kind: 'unknown', reason: 'Superseded acquisition' },
          };
        } else if (failure && currentGeneration === item.generation && epochCurrent) {
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
        } else if (currentGeneration !== item.generation || !epochCurrent) {
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
          const activeLive = (this.sourceHistories.get(this._historyKey(item.sourceKey, item.window))?.observations ?? [])
            .filter((observation) => observation.origin === 'live');
          const cachedLive = previous?.observations.filter((observation) => observation.origin === 'live') ?? [];
          const recorder = (response.observations ?? []).map((observation, index) => ({
            timestamp: observation.timestamp, value: observation.value, state: observation.state,
            order: observation.order ?? index, orderKnown: observation.orderKnown === true,
            origin: observation.origin, orderDomain: `recorder:${item.id}`,
            ...(observation.ambiguous ? { ambiguous: true } : {}),
          }));
          const previousHour = Math.min(...[previous?.rawWindow?.start, previous?.retainedRawStart]
            .filter((hour) => Number.isFinite(hour) && response.statisticsWindow && hour < response.statisticsWindow.end
              && !response.statistics?.buckets?.some((bucket) => bucket.start === hour)));
          const previousBoundary = previous?.observations?.filter((observation) => observation.origin === 'recorder'
            && observation.timestamp < previousHour).at(-1)?.timestamp;
          const retainedRecorder = Number.isFinite(previousHour)
            ? previous.observations.filter((observation) => observation.origin === 'recorder'
              && (observation.timestamp >= previousHour || observation.timestamp === previousBoundary)
              && observation.timestamp < response.statisticsWindow.end)
            : [];
          const observations = this.provider === fetchPlannedHistory && !retainedRecorder.length && !cachedLive.length && !activeLive.length
            ? recorder : mergeObservations(recorder, retainedRecorder, cachedLive, activeLive);
          const boundary = observations.filter((observation) => observation.timestamp <= item.requestedWindow.start).at(-1) ?? null;
          const lastTimestamp = observations.at(-1)?.timestamp ?? null;
          const liveThrough = observations.filter((observation) => observation.origin === 'live')
            .reduce((latest, observation) => Math.max(latest, observation.timestamp), -Infinity);
          record = {
            ...response,
            observations,
            observationsOrdered: true,
            acquisitionMode: queryWindow.acquisition?.mode ?? 'raw',
            sourceEpoch: item.sourceEpoch,
            ...(retainedRecorder.length ? { retainedRawStart: previousHour } : {}),
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
          for (const [key, cached] of this.cache) {
            if (key === item.cacheKey || historySourceKey(cached.source) !== item.sourceKey
              || (cached.acquisitionMode ?? 'raw') !== record.acquisitionMode) continue;
            if (cached.acquiredWindow && this._covers(record, cached.acquiredWindow)) {
              this.cache.set(key, cloneRecord(record, { requestedWindow: cached.requestedWindow }));
            } else if (!cached.acquiredWindow || !record.acquiredWindow
              || (cached.acquiredWindow.start < record.acquiredWindow.end
                && record.acquiredWindow.start < cached.acquiredWindow.end)) this.cache.delete(key);
          }
          this._store(item.cacheKey, record);
        }
        if (!superseded && currentGeneration === item.generation && epochCurrent) {
          this.acceptedFlights.set(item.cacheKey, { id: item.id, record });
          this.acceptedSources.set(sourceAcceptedKey, { id: item.id, record });
        }
        if (trace) historyDebugLog('acquisition.source.result', { ...trace, acquisitionId: item.id, source: item.source,
          mergeMs: historyDebugTime() - mergeStarted, observations: record.observations?.length ?? 0,
          status: record.status, stale: record.stale, acquiredWindow: record.acquiredWindow ?? null,
          coverage: record.coverage, error: record.error ? String(record.error) : null,
          superseded: superseded || currentGeneration !== item.generation });
        item.resolve(cloneRecord(record));
        this.inflight.delete(item.id);
        if (![...this.inflight.values()].some((flight) => flight.sourceKey === item.sourceKey
          && (flight.window.acquisition?.mode ?? 'raw') === (item.window.acquisition?.mode ?? 'raw'))) {
          this.acceptedSources.delete(sourceAcceptedKey);
        }
        this._pruneSourceEpoch(item.sourceKey);
        if (![...this.inflight.values()].some((flight) => flight.cacheKey === item.cacheKey)) {
          this.generations.delete(item.cacheKey);
          this.acceptedFlights.delete(item.cacheKey);
        }
        if (!superseded && currentGeneration === item.generation && epochCurrent) {
          const notifyStarted = trace ? historyDebugTime() : 0;
          this._notify(item.cacheKey, record);
          if (!record.stale && !record.error && record.acquisitionMode === 'raw' && record.acquiredWindow) {
            for (const [key, target] of this.families) {
              if (key === item.cacheKey || !key.startsWith(`${item.sourceKey}\u0001`)) continue;
              const subscribers = [...this.consumers.values()].filter(consumer => consumer.familyKey === key);
              if (!subscribers.length || subscribers.some(consumer => (consumer.window.acquisition?.mode ?? 'raw') !== 'raw'
                || !this._covers(record, consumer.window))) continue;
              if ((target.recordMetadata?.acquisitionId ?? 0) > item.id
                || [...this.inflight.values()].some(flight => flight.cacheKey === key && flight.id > item.id)) continue;
              const cached = this.cache.get(key);
              if (cached) this.cache.set(key, cloneRecord(record, { requestedWindow: cached.requestedWindow }));
              this._notify(key, record);
            }
          }
          if (trace) historyDebugLog('journal.notify', { ...trace, acquisitionId: item.id, source: item.source,
            elapsedMs: historyDebugTime() - notifyStarted });
        }
      }
    })));
  }

  _touch(key) {
    const record = this.cache.get(key);
    if (!record) return null;
    this.cache.delete(key);
    this.cache.set(key, record);
    return record;
  }

  _store(key, record) {
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
    while (this.cache.size > this.maxEntries) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this._scheduleCacheExpiry();
  }

  _scheduleCacheExpiry() {
    if (this.cacheExpiryTimer !== null) clearTimeout(this.cacheExpiryTimer);
    this.cacheExpiryTimer = null;
    const active = new Set([...this.consumers.values()].map(consumer => consumer.familyKey));
    const now = this.now();
    let next = Infinity;
    for (const [key, record] of this.cache) {
      if (active.has(key)) continue;
      const expires = (record.fetchedAt ?? now) + Math.max(0, this.ttlMs);
      if (expires <= now) this.cache.delete(key);
      else next = Math.min(next, expires);
    }
    if (Number.isFinite(next)) this.cacheExpiryTimer = setTimeout(() => {
      this.cacheExpiryTimer = null;
      this._scheduleCacheExpiry();
    }, Math.max(1, Math.min(next - now, 2147483647)));
    this.cacheExpiryTimer?.unref?.();
  }

  _consumerRecord(consumer, record, merge = true) {
    let incoming = record.observations ?? [];
    if (merge && record.acquiredWindow) {
      // A statistics refresh only replaces Recorder rows in its raw tail.
      // Retain the previous hour's rows for the statistics handoff.
      const acquired = record.statisticsWindow ? (record.rawWindow ?? { start: Infinity, end: Infinity }) : record.acquiredWindow;
      const windows = [...this.consumers.values()].filter((item) => item.family.history === consumer.family.history)
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
        const liveOrders = new Set(incoming.filter(sample => sample.origin === 'live').map(sample => sample.order));
        if (consumer.observations.every(sample => sample.origin === 'live' && liveOrders.has(sample.order))
          && windows.every((window) =>
          record.acquiredWindow.start <= window.start && record.acquiredWindow.end >= window.end)) {
          consumer.observations = incoming;
          merge = false;
        }
      }
      if (!older) consumer.recordMetadata = {
        ...record, observations: [], coverage: { ...(record.coverage ?? {}) },
      };
      if (!older && Number.isFinite(record.liveThrough)) {
        consumer.family.history.liveThrough = Math.max(consumer.family.history.liveThrough ?? -Infinity, record.liveThrough);
      }
    }
    if (merge) this._mergeIntoHistory(consumer, incoming);
    const observations = consumer.observations;
    const liveThrough = consumer.family.history.liveThrough ?? -Infinity;
    const historyStarts = [...this.consumers.values()]
      .filter(item => item.family.history === consumer.family.history)
      .map(item => retainedRawStart(item.window, item.recordMetadata));
    const historyStart = Math.min(retainedRawStart(consumer.window, consumer.recordMetadata), ...historyStarts);
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
      observationsOrdered: true,
      historyStart,
      liveThrough: Number.isFinite(liveThrough) ? liveThrough : null,
      observedThrough: Number.isFinite(record.observedThrough) && Number.isFinite(liveThrough)
        ? Math.max(record.observedThrough, liveThrough)
        : (Number.isFinite(liveThrough) ? liveThrough : record.observedThrough ?? null),
      coverage: { ...record.coverage,
        boundaryState: (() => {
          const boundary = boundaryObservation(observations, consumer.window.start);
          return { requested: true, found: boundary !== null, timestamp: boundary?.timestamp ?? null,
            origin: boundary?.origin ?? null };
        })(),
        liveObservedThrough: Number.isFinite(liveThrough) ? liveThrough : null,
      },
    });
  }

  _mergeIntoHistory(consumer, incoming) {
    const original = consumer.observations;
    const starts = [...this.consumers.values()].filter((item) => item.observations === original)
      .map((item) => retainedRawStart(item.window, item.recordMetadata));
    const cachedStarts = [...this.cache.values()].filter(record => record.observations === original)
      .map(record => record.statisticsWindow ? Math.min(record.rawWindow?.start ?? record.statisticsWindow.end,
        record.retainedRawStart ?? Infinity) : record.acquiredWindow?.start).filter(Number.isFinite);
    const earliest = Math.min(retainedRawStart(consumer.window, consumer.recordMetadata), ...starts, ...cachedStarts);
    // Keep the array identity stable across ordinary minute rollovers so shared
    // minute summaries can advance incrementally. Prune at most once an hour;
    // this retains at most one additional hour of transitions.
    const owner = consumer.family.history;
    const pruneHour = Math.floor(earliest / 3600000);
    if (!Number.isFinite(owner.pruneHour)) owner.pruneHour = pruneHour;
    const last = original.at(-1);
    if (incoming.length === 1 && incoming[0].origin === 'live' && last
      && incoming[0].timestamp > last.timestamp) {
      let history = original;
      if (pruneHour > owner.pruneHour && original.length > 1 && original[1].timestamp < earliest) {
        let low = 0, high = original.length;
        while (low < high) {
          const middle = (low + high) >>> 1;
          if (original[middle].timestamp < earliest) low = middle + 1;
          else high = middle;
        }
        let boundary = Math.max(0, low - 1);
        while (boundary > 0 && original[boundary - 1].timestamp === original[boundary].timestamp) boundary -= 1;
        history = original.slice(boundary);
        consumer.observations = history;
        owner.pruneHour = pruneHour;
      }
      history.push(incoming[0]);
      return;
    }
    const merged = mergeObservations(original, incoming);
    const before = merged.filter((sample) => sample.timestamp < earliest);
    const inOrAfter = merged.filter((sample) => sample.timestamp >= earliest);
    const boundaryTime = before.at(-1)?.timestamp;
    const boundary = before.filter((sample) => sample.timestamp === boundaryTime);
    consumer.observations = [...boundary, ...inOrAfter];
  }

  _decorateForActiveConsumers(source, window, record) {
    const observations = record.observations ?? [];
    const boundary = record.observationsOrdered ? boundaryObservation(observations, window.start)
      : observations.reduce((latest, sample) => sample.timestamp <= window.start
        && (!latest || sample.timestamp >= latest.timestamp) ? sample : latest, null);
    const adjusted = cloneRecord(record, {
      requestedWindow: { start: window.start, end: window.end },
      coverage: { ...record.coverage,
        requested: { start: window.start, end: window.end },
        boundaryState: { requested: true, found: boundary !== null, timestamp: boundary?.timestamp ?? null,
          origin: boundary?.origin ?? null },
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
    const sourceKey = historySourceKey(normalized);
    const historyKey = this._historyKey(sourceKey, window);
    const familyKey = this._cacheKey(normalized, window);
    let family = this.families.get(familyKey);
    if (!family) {
      let history = this.sourceHistories.get(historyKey);
      if (!history) {
        history = { key: historyKey, observations: [], refs: 0 };
        this.sourceHistories.set(historyKey, history);
      }
      history.refs += 1;
      family = { history, recordMetadata: null, refs: 0 };
      this.families.set(familyKey, family);
    }
    family.refs += 1;
    const consumer = {
      id: ++this.nextConsumerId,
      source: normalized,
      sourceKey,
      window,
      callback,
      familyKey, family,
      get observations() { return this.family.history.observations; },
      set observations(value) { this.family.history.observations = value; },
      get recordMetadata() { return this.family.recordMetadata; },
      set recordMetadata(value) { this.family.recordMetadata = value; },
    };
    const cacheKey = this._cacheKey(normalized, window);
    const cached = this.cache.get(cacheKey);
    if (cached && (!family.recordMetadata || (cached.acquisitionId ?? 0) > (family.recordMetadata.acquisitionId ?? 0))) {
      this._consumerRecord(consumer, cached);
    }
    this.consumers.set(consumer.id, consumer);
    this._scheduleCacheExpiry();
    const releaseFamily = () => {
      if (--consumer.family.refs === 0) {
        this.families.delete(consumer.familyKey);
        if (--consumer.family.history.refs === 0) this.sourceHistories.delete(consumer.family.history.key);
        this._pruneSourceEpoch(sourceKey);
      }
    };
    const dispose = () => {
      if (this.consumers.delete(consumer.id)) {
        releaseFamily();
        this._scheduleCacheExpiry();
      }
    };
    dispose.updateWindow = (nextWindow) => {
      const nextKey = this._cacheKey(normalized, nextWindow);
      if (nextKey !== consumer.familyKey) {
        const previousHistory = consumer.family.history;
        releaseFamily();
        let nextFamily = this.families.get(nextKey);
        if (!nextFamily) {
          const nextHistoryKey = this._historyKey(sourceKey, nextWindow);
          let history = this.sourceHistories.get(nextHistoryKey);
          if (!history) {
            history = previousHistory.key === nextHistoryKey ? previousHistory : { key: nextHistoryKey, observations: [], refs: 0 };
            this.sourceHistories.set(nextHistoryKey, history);
          }
          history.refs += 1;
          nextFamily = { history, recordMetadata: null, refs: 0 };
          this.families.set(nextKey, nextFamily);
        }
        nextFamily.refs += 1;
        consumer.familyKey = nextKey;
        consumer.family = nextFamily;
      }
      consumer.window = nextWindow;
      const nextCached = this.cache.get(this._cacheKey(normalized, nextWindow));
      if (nextCached && (!consumer.recordMetadata
        || (nextCached.acquisitionId ?? 0) > (consumer.recordMetadata.acquisitionId ?? 0))) {
        this._consumerRecord(consumer, nextCached);
      }
      this._scheduleCacheExpiry();
    };
    dispose.merge = (record) => this._consumerRecord(consumer, record);
    return dispose;
  }

  _notify(cacheKey, record, merge = true) {
    const [sourceKey, familyKey] = cacheKey.split('\u0001');
    const updatedFamilies = new Set();
    for (const consumer of this.consumers.values()) {
      if (consumer.sourceKey !== sourceKey || consumer.window.cacheKey !== familyKey) continue;
      try {
        const result = this._consumerRecord(consumer, record, merge && !updatedFamilies.has(consumer.family));
        updatedFamilies.add(consumer.family);
        consumer.callback(result);
      } catch { /* Isolate consumer failures. */ }
    }
  }

  ingestLiveState({ source, state, timestamp = null }) {
    const normalized = normalizeSource(source);
    const observedAt = Number.isFinite(timestamp) ? timestamp : timestampFromState(state);
    if (!Number.isFinite(observedAt) || observedAt > this.now()) return 0;
    const value = liveValue(state, normalized.attribute);
    const sourceKey = historySourceKey(normalized);
    const activeKeys = new Set([...this.consumers.values()].map(consumer => consumer.familyKey));
    const activeHistories = new Set([...this.consumers.values()].map(consumer => consumer.observations));
    for (const [key, record] of this.cache) {
      if (historySourceKey(record.source) !== sourceKey || activeKeys.has(key)) continue;
      // An omitted transition can change an effective state anywhere before
      // the interval end, including the state at its beginning.
      if (!record.acquiredWindow || observedAt < record.acquiredWindow.end
        || this.now() - record.fetchedAt >= this.ttlMs) this.cache.delete(key);
      else if (activeHistories.has(record.observations)) record.observations = record.observations.slice();
    }
    this._scheduleCacheExpiry();
    const observation = {
      timestamp: observedAt,
      value,
      state: state?.state ?? null,
      order: 1_000_000_000_000 + ++this.liveSequence,
      orderKnown: true,
      orderDomain: 'live',
      origin: 'live',
    };
    let updated = 0;
    const updatedFamilies = new Set();
    const updatedHistories = new Map();
    for (const consumer of this.consumers.values()) {
      if (consumer.sourceKey !== historySourceKey(normalized)) continue;
      if (!updatedFamilies.has(consumer.family.history)) {
        const previous = consumer.observations;
        if (updatedHistories.has(previous)) consumer.observations = updatedHistories.get(previous);
        else {
          this._mergeIntoHistory(consumer, [observation]);
          updatedHistories.set(previous, consumer.observations);
        }
        updatedFamilies.add(consumer.family.history);
        consumer.family.history.liveThrough = Math.max(consumer.family.history.liveThrough ?? -Infinity, observedAt);
      }
      try { consumer.callback(this._consumerRecord(consumer, { source: normalized,
        observations: consumer.observations, status: 'partial',
        stale: consumer.recordMetadata?.stale === true, error: consumer.recordMetadata?.error ?? null,
        retrievedAt: consumer.recordMetadata?.retrievedAt ?? null, observedThrough: observedAt,
        requestedWindow: { start: consumer.window.start, end: consumer.window.end },
        coverage: consumer.recordMetadata?.coverage
          ?? { complete: false, kind: 'unknown', reason: 'Live samples are reconciled with Recorder asynchronously' } }, false)); }
      catch { /* Isolate consumer failures. */ }
      updated += 1;
    }

    for (const [key, record] of this.cache) {
      if (historySourceKey(record.source) !== sourceKey || !activeKeys.has(key)) continue;
      const previous = record.observations;
      if (!updatedHistories.has(previous)) updatedHistories.set(previous, mergeObservations(previous, [observation]));
      record.observations = updatedHistories.get(previous);
      record.liveThrough = Math.max(record.liveThrough ?? -Infinity, observedAt);
      record.observedThrough = Math.max(record.observedThrough ?? -Infinity, observedAt);
      record.coverage = { ...record.coverage, liveObservedThrough: record.liveThrough };
    }
    return updated;
  }

  invalidate({ sources = null, windowKey = null } = {}) {
    const sourceKeys = sources ? new Set(sources.map((source) => historySourceKey(normalizeSource(source)))) : null;
    const keys = new Set([
      ...this.cache.keys(),
      ...this.families.keys(),
      ...[...this.inflight.values()].map((flight) => flight.cacheKey),
    ]);
    const invalidatedSources = new Set();
    for (const key of keys) {
      const [sourceKey, familyKey] = key.split('\u0001');
      if (sourceKeys && !sourceKeys.has(sourceKey)) continue;
      if (windowKey && familyKey !== windowKey) continue;
      invalidatedSources.add(sourceKey);
      this.cache.delete(key);
      const family = this.families.get(key);
      if (family?.recordMetadata) {
        family.recordMetadata = { ...family.recordMetadata, stale: true, status: 'stale',
          coverage: { ...family.recordMetadata.coverage, complete: false,
            reason: 'History invalidated; Recorder revalidation is required' } };
        this._notify(key, { ...family.recordMetadata, observations: family.history.observations }, false);
      }
      if ([...this.inflight.values()].some((flight) => flight.cacheKey === key)) {
        this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
      } else {
        this.generations.delete(key);
      }
    }
    for (const sourceKey of invalidatedSources) {
      this.sourceEpochs.set(sourceKey, (this.sourceEpochs.get(sourceKey) ?? 0) + 1);
      this._pruneSourceEpoch(sourceKey);
    }
    this._scheduleCacheExpiry();
  }

  clear() {
    this.invalidate();
    this.cache.clear();
    if (this.cacheExpiryTimer !== null) clearTimeout(this.cacheExpiryTimer);
    this.cacheExpiryTimer = null;
    this.consumers.clear();
    this.families.clear();
    this.sourceHistories.clear();
    this.acceptedFlights.clear();
    this.acceptedSources.clear();
    this.sourceEpochs.clear();
  }
}

const servicesByConnection = new WeakMap();

export function getSharedObservationService(hass, options = {}) {
  const connection = hass?.connection && typeof hass.connection === 'object' ? hass.connection : hass;
  if (!connection || typeof connection !== 'object') throw new TypeError('A Home Assistant connection is required');
  if (!servicesByConnection.has(connection)) servicesByConnection.set(connection, new SharedObservationService(options));
  return servicesByConnection.get(connection);
}
