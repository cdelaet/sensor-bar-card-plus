import { calculateObservationValue } from './calculations.js';
import { getSharedObservationService } from './observation-service.js';
import { resolveTimeWindow } from './time-window.js';

const PROVIDER = 'recorder_history';
const CALCULATIONS = new Set(['max', 'min']);

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
    else if (record?.coverage?.liveOverflow || calculation?.orderingAmbiguous
      || calculation?.requestedBoundsCovered === false) resolvedStatus = 'partial';
    else if (!Number.isFinite(value)) resolvedStatus = 'unavailable';
    else if (record?.coverage?.complete === true) resolvedStatus = 'available';
    else resolvedStatus = 'partial';
  }
  return {
    value: Number.isFinite(value) && !record?.coverage?.liveOverflow && !calculation?.orderingAmbiguous ? value : null,
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
    const window = resolveTimeWindow(spec.window, {
      now: context?.now ?? this.now(),
      timeZone,
      locale,
      firstWeekday: context?.firstWeekday ?? hass.locale?.first_weekday,
      weekStartsOn: context?.weekStartsOn,
    });
    const service = this.service ?? getSharedObservationService(hass, this.serviceOptions);
    return { hass, window, service, now: context?.now ?? this.now() };
  }

  pending(spec) {
    const normalized = normalizeValueSpec(spec);
    return makeResult({ status: 'pending', spec: normalized, now: this.now() });
  }

  async resolve(spec, context = {}) {
    let normalized;
    try {
      normalized = normalizeValueSpec(spec);
      const { hass, window, service, now } = this._context(normalized, context);
      const records = await service.request({ hass, sources: [normalized.source], window });
      const record = records.get(`${normalized.source.entityId}\u0000${normalized.source.attribute ?? ''}`);
      const calculation = record
        ? calculateObservationValue(record.observations, normalized.calculation, window,
          { acquiredWindow: record.acquiredWindow, liveThrough: record.liveThrough })
        : { value: null, status: 'unavailable', sampleCount: 0, boundaryIncluded: false };
      return makeResult({ value: calculation.value, spec: normalized, window, record, calculation, now });
    } catch (error) {
      const fallback = normalized ?? { provider: PROVIDER, source: { entityId: '', attribute: null }, calculation: spec?.calculation ?? null };
      return makeResult({ status: 'invalid', spec: fallback, now: this.now(), record: { error, coverage: null } });
    }
  }

  watch(spec, context, callback) {
    if (typeof callback !== 'function') throw new TypeError('A value update callback is required');
    let normalized;
    let resolved;
    try {
      normalized = normalizeValueSpec(spec);
      resolved = this._context(normalized, context);
    } catch (error) {
      callback(makeResult({ status: 'invalid', spec: normalized ?? {
        provider: PROVIDER, source: { entityId: '', attribute: null }, calculation: spec?.calculation ?? null,
      }, now: this.now(), record: { error } }));
      return () => {};
    }

    let active = true;
    let requestGeneration = 0;
    let unsubscribe = null;
    let rolloverTimer = null;
    let currentWindow = resolved.window;
    let currentContext = resolved;
    let latestRecord = null;

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
      currentContext = currentResolutionContext();
      currentWindow = currentContext.window;
      unsubscribe?.updateWindow(currentWindow);
      latestRecord = record;
      const calculation = calculateObservationValue(latestRecord.observations, normalized.calculation,
        currentWindow, { acquiredWindow: latestRecord.acquiredWindow, liveThrough: latestRecord.liveThrough });
      const overflow = latestRecord.coverage?.liveOverflow === true;
      const value = overflow || calculation.orderingAmbiguous ? null : calculation.value;
      const status = latestRecord.stale ? 'stale'
        : overflow || calculation.orderingAmbiguous || !calculation.requestedBoundsCovered ? 'partial' : undefined;
      callback(makeResult({ value, status, spec: normalized, window: currentWindow,
        record: latestRecord, calculation, now: this.now() }));
      scheduleRollover(latestRecord);
    };

    const scheduleRollover = (record = latestRecord) => {
      clearTimer();
      if (!['calendar', 'rolling'].includes(currentWindow.semantics.kind)) return;
      const now = this.now();
      const boundaries = [Math.floor(now / 60000) * 60000 + 60000];
      if ((record?.observations ?? []).some((observation) => observation.origin === 'live'
        && observation.timestamp === currentWindow.end && observation.timestamp <= now)) boundaries.push(now + 1);
      if (currentWindow.semantics.kind === 'calendar') {
        const rolloverAt = currentWindow.semantics.rolloverAt;
        if (Number.isFinite(rolloverAt) && rolloverAt > now) boundaries.push(rolloverAt + 1);
      }
      if (currentWindow.semantics.kind === 'rolling') {
        const nextTransition = (record?.observations ?? [])
          .filter((observation) => observation.timestamp > currentWindow.start && observation.timestamp < currentWindow.end)
          .reduce((next, observation) => Math.min(next, observation.timestamp), Infinity);
        if (Number.isFinite(nextTransition)) {
          boundaries.push(nextTransition + currentWindow.semantics.durationMs + 1);
        }
      }
      const nextAt = Math.min(...boundaries.filter((boundary) => boundary > now));
      if (!Number.isFinite(nextAt) || nextAt <= now) return;
      rolloverTimer = setTimeout(() => {
        if (!active) return;
        const previousKey = currentWindow.cacheKey;
        const updatedContext = currentResolutionContext();
        if (updatedContext.window.cacheKey !== previousKey
          && updatedContext.window.semantics.kind === 'calendar') {
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
      currentContext = currentResolutionContext();
      currentWindow = currentContext.window;
      const generation = ++requestGeneration;
      if (!unsubscribe) {
        try {
          unsubscribe = currentContext.service.subscribe(normalized.source, currentWindow,
            (record) => publish(record));
        } catch (error) {
          callback(makeResult({ status: 'unavailable', spec: normalized, window: currentWindow,
            record: { error, observations: [], coverage: { complete: false, kind: 'unknown' } }, now: this.now() }));
          return Promise.resolve(null);
        }
      } else {
        unsubscribe.updateWindow(currentWindow);
      }
      callback(makeResult({ status: 'pending', spec: normalized, window: currentWindow, now: this.now() }));
      scheduleRollover(latestRecord);
      return currentContext.service.request({ hass: currentContext.hass, sources: [normalized.source],
        window: currentWindow, force })
        .then((records) => {
          const record = records.get(`${normalized.source.entityId}\u0000${normalized.source.attribute ?? ''}`);
          if (generation === requestGeneration) publish(record, generation);
          return record ?? null;
        })
        .catch((error) => {
          if (active && generation === requestGeneration) callback(makeResult({ status: 'unavailable', spec: normalized,
            window: currentWindow, record: { error, observations: [], coverage: { complete: false, kind: 'unknown' } }, now: this.now() }));
          return null;
        });
    };

    const dispose = () => {
      if (!active) return;
      active = false;
      requestGeneration += 1;
      clearTimer();
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
