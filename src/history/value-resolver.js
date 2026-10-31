import { advanceMinuteBuckets, aggregateMinuteBuckets, calculateMinuteExtrema, collapseEqualTimestamps } from './calculations.js';
import { getSharedObservationService } from './observation-service.js';
import { planHistoricalAcquisition, resolveTimeWindow } from './time-window.js';
import { historyDebugEnabled, historyDebugId, historyDebugLog, historyDebugTime } from './history-debug.js';

const PROVIDER = 'recorder_history';
const CALCULATIONS = new Set(['max', 'min']);
const minuteBucketCache = new WeakMap();
const minuteResultCache = new WeakMap();

function minuteResult(buckets, calculation, window, acquiredWindow) {
  const cached = minuteResultCache.get(buckets);
  const acquiredStart = acquiredWindow?.start ?? null, acquiredEnd = acquiredWindow?.end ?? null;
  if (cached && cached.start === window.start && cached.end === window.end
    && cached.acquiredStart === acquiredStart && cached.acquiredEnd === acquiredEnd) return cached.results[calculation];
  const results = calculateMinuteExtrema(buckets, window, acquiredWindow);
  minuteResultCache.set(buckets, { start: window.start, end: window.end, acquiredStart, acquiredEnd, results });
  return results[calculation];
}

function minuteBuckets(observations, window, ordered) {
  let cached = minuteBucketCache.get(observations);
  if (cached?.start === window.start && cached.end === window.end && cached.ordered === ordered
    && cached.length === observations.length) return cached.buckets;
  if (ordered && cached?.ordered && cached.start <= window.start && cached.buckets.length
    && cached.length <= observations.length && cached.end <= window.end) {
    let index = cached.processed;
    while (index < observations.length && observations[index].timestamp < window.end) index += 1;
    const additions = observations.slice(cached.processed, index);
    if (!additions.some(observation => observation.timestamp < cached.end)) {
      const buckets = advanceMinuteBuckets(cached.buckets, collapseEqualTimestamps(additions), window);
      minuteBucketCache.set(observations, { start: window.start, end: window.end, buckets,
        ordered, length: observations.length, processed: index });
      return buckets;
    }
  }
  const buckets = aggregateMinuteBuckets(observations, window, { ordered });
  let processed = observations.length;
  if (ordered) {
    let low = 0, high = observations.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (observations[middle].timestamp < window.end) low = middle + 1;
      else high = middle;
    }
    processed = low;
  }
  cached = { start: window.start, end: window.end, buckets, ordered, length: observations.length, processed };
  minuteBucketCache.set(observations, cached);
  return buckets;
}

function calculateRecord(record, calculation, window) {
  if (window.acquisition?.mode !== 'statistics') {
    const historyWindow = { start: Math.min(window.start, record.historyStart ?? window.start), end: window.end };
    return minuteResult(minuteBuckets(record.observations, historyWindow, record.observationsOrdered === true), calculation, window, record.acquiredWindow);
  }
  if (!record.statisticsWindow || !record.statistics) return {
    value: null, sampleCount: 0, selectedObservation: null, boundaryIncluded: false,
    orderingAmbiguous: false, requestedBoundsCovered: false,
  };
  const statsEnd = record.statisticsWindow.end;
  const rawStart = Math.max(window.start, Number.isFinite(record.retainedRawStart)
    ? Math.min(statsEnd, record.retainedRawStart) : statsEnd);
  const rawWindow = { start: rawStart, end: window.end };
  const historyWindow = { start: Math.min(rawStart, record.historyStart ?? rawStart), end: window.end };
  const raw = window.end > rawStart ? minuteResult(minuteBuckets(record.observations, historyWindow, record.observationsOrdered === true),
    calculation, rawWindow, record.acquiredWindow)
    : { value: null, sampleCount: 0, selectedObservation: null, boundaryIncluded: false, orderingAmbiguous: false };
  const buckets = record.statistics.buckets.filter(bucket => bucket.start >= window.start && bucket.end <= Math.min(statsEnd, window.end));
  const value = buckets.reduce((best, bucket) => {
    const candidate = bucket[calculation];
    return best === null || (calculation === 'max' ? candidate > best : candidate < best) ? candidate : best;
  }, null);
  const chooseStats = value !== null && (raw.value === null || (calculation === 'max' ? value >= raw.value : value <= raw.value));
  return { ...raw, value: chooseStats ? value : raw.value,
    selectedObservation: chooseStats ? null : raw.selectedObservation,
    sampleCount: buckets.length + raw.sampleCount,
    requestedBoundsCovered: record.acquiredWindow?.start <= window.start && record.acquiredWindow?.end >= window.end };
}

function normalizeValueSpec(spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError('A historical value specification is required');
  const provider = spec.provider ?? PROVIDER;
  if (provider !== PROVIDER) throw new TypeError(`Unsupported historical provider: ${provider}`);
  const source = spec.source ?? { entityId: spec.entityId, attribute: spec.attribute };
  const entityId = source?.entityId ?? source?.entity;
  const attribute = source?.attribute ?? null;
  if (typeof entityId !== 'string' || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId.trim())) {
    throw new TypeError(`Invalid historical source entity ID: ${entityId}`);
  }
  if (attribute !== null && (typeof attribute !== 'string' || !attribute.trim())) {
    throw new TypeError('Historical source attribute must be a non-empty string');
  }
  const calculation = spec.calculation;
  if (!CALCULATIONS.has(calculation)) throw new TypeError(`Unsupported historical calculation: ${calculation}`);
  if (!spec.window || typeof spec.window !== 'object') throw new TypeError('A time-window specification is required');
  return {
    provider,
    source: { entityId: entityId.trim(), attribute: attribute?.trim() ?? null },
    calculation,
    window: spec.window,
  };
}

function makeResult({ value = null, status, spec, window = null, record = null, calculation = null, now }) {
  const selected = calculation?.selectedObservation ?? null;
  const providerStatus = record?.status ?? null;
  let resolvedStatus = status;
  if (!status) {
    if (record?.stale) resolvedStatus = 'stale';
    else if (!Number.isFinite(value) && record?.status === 'unavailable') resolvedStatus = 'unavailable';
    else if (calculation?.orderingAmbiguous
      || calculation?.requestedBoundsCovered === false) resolvedStatus = 'partial';
    else if (!Number.isFinite(value)) resolvedStatus = 'unavailable';
    else if (record?.coverage?.kind === 'incomplete') resolvedStatus = 'partial';
    else resolvedStatus = 'available';
  }
  return {
    value: Number.isFinite(value) && !calculation?.orderingAmbiguous ? value : null,
    status: resolvedStatus,
    source: { provider: spec.provider, ...spec.source },
    calculation: spec.calculation,
    window: window ? {
      start: window.start,
      end: window.end,
      timeZone: window.timeZone,
      interval: window.interval,
      semantics: { ...window.semantics },
    } : null,
    freshness: {
      retrievedAt: record?.retrievedAt ?? null,
      ageMs: Number.isFinite(record?.retrievedAt) ? Math.max(0, now - record.retrievedAt) : null,
      observedThrough: record?.observedThrough ?? null,
      stale: record?.stale === true,
      cache: record?.cache ?? null,
    },
    provenance: {
      sampleCount: calculation?.sampleCount ?? 0,
      selectedTimestamp: selected?.timestamp ?? null,
      boundaryIncluded: calculation?.boundaryIncluded ?? false,
      coverage: record?.coverage ? { ...record.coverage } : null,
      providerStatus,
      error: record?.error ?? null,
    },
  };
}

export class HistoricalValueResolver {
  constructor({ service = null, serviceOptions = {}, now = Date.now } = {}) {
    this.service = service;
    this.serviceOptions = serviceOptions;
    this.now = now;
  }

  _context(spec, context) {
    const hass = context?.hass;
    if (!hass) throw new TypeError('Home Assistant context is required');
    const timeZone = context?.timeZone ?? hass.config?.time_zone;
    const locale = context?.locale ?? hass.locale?.language;
    const now = context?.now ?? this.now();
    const resolvedWindow = resolveTimeWindow(spec.window, {
      now,
      timeZone,
      locale,
      firstWeekday: context?.firstWeekday ?? hass.locale?.first_weekday,
      weekStartsOn: context?.weekStartsOn,
    });
    const plan = planHistoricalAcquisition(resolvedWindow, now);
    if (plan.mode === 'invalid') throw Object.assign(new RangeError(plan.reason), { historyUnavailable: true });
    const window = plan.window;
    const service = this.service ?? getSharedObservationService(hass, this.serviceOptions);
    return { hass, window, service, now: context?.now ?? this.now() };
  }

  pending(spec) {
    const normalized = normalizeValueSpec(spec);
    return makeResult({ status: 'pending', spec: normalized, now: this.now() });
  }

  async resolve(spec, context = {}) {
    let normalized;
    const trace = historyDebugEnabled() ? { resolutionId: historyDebugId('resolution'), started: historyDebugTime() } : null;
    try {
      normalized = normalizeValueSpec(spec);
      const { hass, window, service, now } = this._context(normalized, context);
      if (trace) historyDebugLog('resolution.start', { resolutionId: trace.resolutionId, source: normalized.source,
        calculation: normalized.calculation, windowSpec: normalized.window, window,
        resolvedStart: new Date(window.start).toISOString(), resolvedEnd: new Date(window.end).toISOString() });
      const records = await service.request({ hass, sources: [normalized.source], window,
        ...(trace ? { debugResolutionId: trace.resolutionId } : {}) });
      const record = records.get(`${normalized.source.entityId}\u0000${normalized.source.attribute ?? ''}`);
      const calculationStart = trace ? historyDebugTime() : 0;
      const calculation = record
        ? calculateRecord(record, normalized.calculation, window)
        : { value: null, status: 'unavailable', sampleCount: 0, boundaryIncluded: false };
      const result = makeResult({ value: calculation.value, spec: normalized, window, record, calculation, now });
      if (trace) historyDebugLog('resolution.end', { resolutionId: trace.resolutionId, status: result.status,
        hasValue: Number.isFinite(result.value), observations: record?.observations?.length ?? 0,
        calculationMs: historyDebugTime() - calculationStart, elapsedMs: historyDebugTime() - trace.started,
        acquiredWindow: record?.acquiredWindow ?? null, requestedBoundsCovered: calculation.requestedBoundsCovered,
        coverage: result.provenance.coverage, error: result.provenance.error ? String(result.provenance.error) : null });
      return result;
    } catch (error) {
      if (trace) historyDebugLog('resolution.error', { resolutionId: trace.resolutionId, elapsedMs: historyDebugTime() - trace.started, error: String(error) });
      const fallback = normalized ?? { provider: PROVIDER, source: { entityId: '', attribute: null }, calculation: spec?.calculation ?? null };
      return makeResult({ status: error?.historyUnavailable ? 'unavailable' : 'invalid', spec: fallback, now: this.now(), record: { error, coverage: null } });
    }
  }

  watch(spec, context, callback) {
    if (typeof callback !== 'function') throw new TypeError('A value update callback is required');
    const watcherId = historyDebugEnabled() ? historyDebugId('watcher') : null;
    if (watcherId) historyDebugLog('watcher.start', { watcherId, spec });
    let normalized;
    let resolved;
    try {
      normalized = normalizeValueSpec(spec);
      resolved = this._context(normalized, context);
    } catch (error) {
      if (watcherId) historyDebugLog('watcher.invalid', { watcherId, error: String(error) });
      callback(makeResult({ status: error?.historyUnavailable ? 'unavailable' : 'invalid', spec: normalized ?? {
        provider: PROVIDER, source: { entityId: '', attribute: null }, calculation: spec?.calculation ?? null,
      }, now: this.now(), record: { error } }));
      return () => {};
    }

    let active = true;
    let requestGeneration = 0;
    let unsubscribe = null;
    let rolloverTimer = null;
    let retryTimer = null;
    let retryHour = null;
    let retryDelay = 5000;
    let currentWindow = resolved.window;
    let currentContext = resolved;
    let latestRecord = null;
    let trace = null;

    const currentResolutionContext = () => this._context(normalized, {
      ...context,
      now: context?.now ?? this.now(),
    });

    const clearTimer = () => {
      if (rolloverTimer !== null) clearTimeout(rolloverTimer);
      rolloverTimer = null;
    };

    const publish = (record, expectedGeneration = null) => {
      if (!active || !record || (expectedGeneration !== null && expectedGeneration !== requestGeneration)) return;
      try { currentContext = currentResolutionContext(); } catch (error) {
        clearTimer();
        callback(makeResult({ status: error?.historyUnavailable ? 'unavailable' : 'invalid', spec: normalized, record: { error }, now: this.now() }));
        return;
      }
      currentWindow = currentContext.window;
      unsubscribe?.updateWindow(currentWindow);
      latestRecord = record;
      const calculationKey = record.error ? `error:${record.acquisitionId ?? 'none'}` : record.acquisitionId;
      const logCalculation = trace && !trace.done && calculationKey != null && calculationKey !== trace.lastCalculationKey;
      const calculationStart = logCalculation ? historyDebugTime() : 0;
      if (logCalculation) { trace.lastCalculationKey = calculationKey; historyDebugLog('resolution.calculate.start', { resolutionId: trace.resolutionId,
        acquisitionId: record.acquisitionId ?? null, observations: record.observations?.length ?? 0 });
      }
      let calculation = calculateRecord(latestRecord, normalized.calculation, currentWindow);
      const liveStart = context?.liveCoverageStart?.();
      const acquired = latestRecord.acquiredWindow;
      if (!calculation.requestedBoundsCovered && Number.isFinite(liveStart)
        && Number.isFinite(acquired?.start) && acquired.start <= currentWindow.start
        && Number.isFinite(acquired.end) && acquired.end >= liveStart
        && currentWindow.end >= liveStart && currentWindow.end <= this.now()) {
        calculation = { ...calculation, requestedBoundsCovered: true };
      }
      const value = calculation.orderingAmbiguous ? null : calculation.value;
      const status = latestRecord.stale ? 'stale'
        : !Number.isFinite(value) && latestRecord.status === 'unavailable' ? 'unavailable'
        : calculation.orderingAmbiguous || !calculation.requestedBoundsCovered ? 'partial' : undefined;
      const result = makeResult({ value, status, spec: normalized, window: currentWindow,
        record: latestRecord, calculation, now: this.now() });
      if (trace && !trace.done) {
        trace.lastResult = result;
        if (logCalculation) historyDebugLog('resolution.calculate.end', { resolutionId: trace.resolutionId, calculationMs: historyDebugTime() - calculationStart,
          status: result.status, hasValue: Number.isFinite(result.value), requestedBoundsCovered: calculation.requestedBoundsCovered,
          orderingAmbiguous: calculation.orderingAmbiguous === true,
          providerStatus: result.provenance.providerStatus, stale: result.freshness.stale,
          error: result.provenance.error ? String(result.provenance.error) : null,
          acquiredWindow: acquired ?? null, liveCoverageStart: liveStart ?? null, coverage: result.provenance.coverage });
      }
      callback(result);
      scheduleRollover(latestRecord);
      scheduleStatisticsRetry();
    };

    const scheduleStatisticsRetry = () => {
      const end = latestRecord?.statisticsWindow?.end;
      const reason = latestRecord?.coverage?.statistics?.reason ?? '';
      const missing = Number.isFinite(end) && !latestRecord?.stale
        && (reason.startsWith('Statistics contain missing') || reason.startsWith('Statistics are missing'))
        && this.now() >= end && this.now() - end <= 2 * 3600000
        && !latestRecord.statistics?.buckets?.some(bucket => bucket.start === end - 3600000);
      if (!missing) {
        if (retryTimer !== null) clearTimeout(retryTimer);
        retryTimer = null; retryHour = null; retryDelay = 5000;
        return;
      }
      if (retryHour !== end) {
        if (retryTimer !== null) clearTimeout(retryTimer);
        retryTimer = null; retryHour = end; retryDelay = 5000;
      }
      if (retryTimer !== null) return;
      retryTimer = setTimeout(async () => {
        retryTimer = null;
        if (!active || retryHour !== end) return;
        await currentContext.service.retryRecentStatistics({ hass: currentContext.hass, source: normalized.source,
          window: currentWindow, record: latestRecord });
        retryDelay = Math.min(retryDelay * 2, 60000);
        if (active && retryHour === end) scheduleStatisticsRetry();
      }, retryDelay);
    };

    const scheduleRollover = (record = latestRecord) => {
      clearTimer();
      if (!['calendar', 'shifted_calendar', 'rolling'].includes(currentWindow.semantics.kind)) return;
      const now = this.now();
      const boundaries = [Math.floor(now / 60000) * 60000 + 60000];
      if ((record?.observations ?? []).some((observation) => observation.origin === 'live'
        && observation.timestamp === currentWindow.end && observation.timestamp <= now)) boundaries.push(now + 1);
      if (['calendar', 'shifted_calendar'].includes(currentWindow.semantics.kind)) {
        const rolloverAt = currentWindow.semantics.rolloverAt;
        if (Number.isFinite(rolloverAt) && rolloverAt > now) boundaries.push(rolloverAt + 1);
      }
      const nextAt = Math.min(...boundaries.filter((boundary) => boundary > now));
      if (!Number.isFinite(nextAt) || nextAt <= now) return;
      rolloverTimer = setTimeout(() => {
        if (!active) return;
        const previousKey = currentWindow.cacheKey;
        let updatedContext;
        try { updatedContext = currentResolutionContext(); } catch (error) {
          callback(makeResult({ status: error?.historyUnavailable ? 'unavailable' : 'invalid', spec: normalized, record: { error }, now: this.now() }));
          return;
        }
        if (updatedContext.window.cacheKey !== previousKey
          || (updatedContext.window.acquisition?.mode === 'statistics'
            && latestRecord?.statisticsWindow?.end !== updatedContext.window.acquisition.statistics.end)) {
          if (latestRecord && updatedContext.window.cacheKey === previousKey
            && updatedContext.window.acquisition?.mode === 'statistics') publish(latestRecord);
          refresh(false);
          return;
        }
        currentContext = updatedContext;
        currentWindow = updatedContext.window;
        unsubscribe?.updateWindow(currentWindow);
        if (latestRecord) publish(latestRecord);
        else scheduleRollover(null);
      }, Math.min(nextAt - now + 1, 2147483647));
    };

    const refresh = (force = false) => {
      if (!active) return Promise.resolve(null);
      if (trace && !trace.done) {
        trace.done = true;
        historyDebugLog('resolution.superseded', { resolutionId: trace.resolutionId, elapsedMs: historyDebugTime() - trace.started });
      }
      try { currentContext = currentResolutionContext(); } catch (error) {
        clearTimer();
        callback(makeResult({ status: error?.historyUnavailable ? 'unavailable' : 'invalid', spec: normalized, record: { error }, now: this.now() }));
        return Promise.resolve(null);
      }
      currentWindow = currentContext.window;
      const generation = ++requestGeneration;
      trace = historyDebugEnabled() ? { resolutionId: historyDebugId('resolution'), started: historyDebugTime(), done: false } : null;
      const requestTrace = trace;
      if (trace) historyDebugLog('resolution.start', { watcherId, resolutionId: trace.resolutionId, source: normalized.source,
        calculation: normalized.calculation, windowSpec: normalized.window, window: currentWindow, force,
        resolvedStart: new Date(currentWindow.start).toISOString(), resolvedEnd: new Date(currentWindow.end).toISOString(),
        subscription: { liveCoverageStart: context?.liveCoverageStart?.() ?? null } });
      if (!unsubscribe) {
        try {
          unsubscribe = currentContext.service.subscribe(normalized.source, currentWindow,
            (record) => publish(record));
        } catch (error) {
          if (trace) { trace.done = true; historyDebugLog('resolution.error', { resolutionId: trace.resolutionId, stage: 'journal.subscribe', error: String(error), elapsedMs: historyDebugTime() - trace.started }); }
          callback(makeResult({ status: 'unavailable', spec: normalized, window: currentWindow,
            record: { error, observations: [], coverage: { complete: false, kind: 'unknown' } }, now: this.now() }));
          return Promise.resolve(null);
        }
      } else {
        unsubscribe.updateWindow(currentWindow);
      }
      if (!latestRecord?.stale && !latestRecord?.error
        && !(latestRecord && currentWindow.acquisition?.mode === 'statistics')) {
        callback(makeResult({ status: 'pending', spec: normalized, window: currentWindow, now: this.now() }));
      }
      scheduleRollover(latestRecord);
      return currentContext.service.request({ hass: currentContext.hass, sources: [normalized.source],
        window: currentWindow, force, ...(requestTrace ? { debugResolutionId: requestTrace.resolutionId } : {}) })
        .then((records) => {
          const record = records.get(`${normalized.source.entityId}\u0000${normalized.source.attribute ?? ''}`);
          if (generation === requestGeneration) publish(record, generation);
          if (requestTrace && !requestTrace.done) {
            requestTrace.done = true;
            historyDebugLog('resolution.end', { resolutionId: requestTrace.resolutionId, source: normalized.source,
              status: requestTrace.lastResult?.status ?? 'no_result', hasValue: Number.isFinite(requestTrace.lastResult?.value),
              observations: record?.observations?.length ?? 0, acquisitionId: record?.acquisitionId ?? null,
              cache: record?.cache ?? null, acquiredWindow: record?.acquiredWindow ?? null,
              coverage: requestTrace.lastResult?.provenance?.coverage ?? record?.coverage ?? null,
              error: record?.error ? String(record.error) : null, elapsedMs: historyDebugTime() - requestTrace.started });
          }
          return record ?? null;
        })
        .catch((error) => {
          if (requestTrace && !requestTrace.done) { requestTrace.done = true; historyDebugLog('resolution.error', {
            resolutionId: requestTrace.resolutionId, elapsedMs: historyDebugTime() - requestTrace.started, error: String(error) }); }
          if (active && generation === requestGeneration) callback(makeResult({ status: 'unavailable', spec: normalized,
            window: currentWindow, record: { error, observations: [], coverage: { complete: false, kind: 'unknown' } }, now: this.now() }));
          return null;
        });
    };

    const dispose = () => {
      if (!active) return;
      if (trace && !trace.done) { trace.done = true; historyDebugLog('resolution.cancelled', {
        resolutionId: trace.resolutionId, elapsedMs: historyDebugTime() - trace.started }); }
      if (watcherId) historyDebugLog('watcher.disposed', { watcherId, source: normalized.source });
      active = false;
      requestGeneration += 1;
      clearTimer();
      if (retryTimer !== null) clearTimeout(retryTimer);
      retryTimer = null;
      unsubscribe?.();
      unsubscribe = null;
      latestRecord = null;
    };
    dispose.refresh = () => refresh(true);
    refresh(false);
    return dispose;
  }

  ingestLiveState(hass, source, state, timestamp = null) {
    const service = this.service ?? getSharedObservationService(hass, this.serviceOptions);
    return service.ingestLiveState({ source, state, timestamp });
  }
}

export { normalizeValueSpec };
