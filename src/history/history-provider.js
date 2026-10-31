import { getFiniteNumber } from '../config/normalize.js';
import { HISTORY_DEBUG_TRACE, historyDebugLog, historyDebugTime } from './history-debug.js';

function epochFromState(state) {
  const timestamp = state?.lu ?? state?.last_updated ?? state?.lc ?? state?.last_changed;
  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    return timestamp > 1e12 ? timestamp : timestamp * 1000;
  }
  const parsed = Date.parse(String(timestamp ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function stateText(state) {
  return state?.s ?? state?.state;
}

function stateAttributes(state) {
  return state?.a ?? state?.attributes ?? null;
}

function stateValue(state, attribute) {
  const text = String(stateText(state) ?? '').trim();
  if (text.toLowerCase() === 'unknown' || text.toLowerCase() === 'unavailable') return null;
  if (!attribute) return getFiniteNumber(stateText(state));
  const attributes = stateAttributes(state);
  if (!attributes || !Object.prototype.hasOwnProperty.call(attributes, attribute)) return null;
  return getFiniteNumber(attributes[attribute]);
}

function normalizeSources(sources) {
  if (!Array.isArray(sources) || !sources.length) throw new TypeError('At least one history source is required');
  return sources.map((source) => {
    const entityId = typeof source === 'string' ? source : source?.entityId ?? source?.entity;
    const attribute = typeof source === 'object' && source ? source.attribute ?? null : null;
    if (typeof entityId !== 'string' || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId)) {
      throw new TypeError(`Invalid history entity ID: ${entityId}`);
    }
    if (attribute !== null && (typeof attribute !== 'string' || !attribute.trim())) {
      throw new TypeError('History source attribute must be a non-empty string');
    }
    return { entityId: entityId.trim(), attribute: attribute?.trim() ?? null };
  });
}

export function normalizeHistoryResponse(response, sources, window, retrievedAt = Date.now()) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new TypeError('Home Assistant returned an invalid history response');
  }
  const normalizedSources = normalizeSources(sources);
  const result = new Map();
  for (const source of normalizedSources) {
    const states = response[source.entityId];
    if (states !== undefined && !Array.isArray(states)) {
      throw new TypeError(`Home Assistant returned an invalid history list for ${source.entityId}`);
    }
    const observations = (states ?? []).map((state, index) => {
      const timestamp = epochFromState(state);
      if (timestamp === null || timestamp >= window.end || timestamp > retrievedAt) return null;
      return {
        entityId: source.entityId,
        attribute: source.attribute,
        timestamp,
        value: stateValue(state, source.attribute),
        state: stateText(state) ?? null,
        boundaryEffective: timestamp < window.start,
        transitionInWindow: timestamp >= window.start && timestamp < window.end,
        order: index,
        orderKnown: true,
        origin: 'recorder',
      };
    }).filter(Boolean).sort((a, b) => a.timestamp - b.timestamp || a.order - b.order);
    const boundaryObservation = observations.filter((sample) => sample.timestamp <= window.start).at(-1) ?? null;
    const firstTimestamp = observations[0]?.timestamp ?? null;
    const lastTimestamp = observations.at(-1)?.timestamp ?? null;
    const key = historySourceKey(source);
    result.set(key, {
      source,
      observations,
      status: observations.some((sample) => Number.isFinite(sample.value)) ? 'available' : 'unavailable',
      retrievedAt,
      observedThrough: lastTimestamp,
      requestedWindow: { start: window.start, end: window.end },
      coverage: {
        complete: false,
        kind: 'unknown',
        reason: 'Recorder history does not report retention or interval completeness',
        requested: { start: window.start, end: window.end },
        observed: { firstTimestamp, lastTimestamp },
        boundaryState: {
          requested: true,
          found: boundaryObservation !== null,
          timestamp: boundaryObservation?.timestamp ?? null,
        },
        futureInterval: window.end > retrievedAt,
      },
    });
  }
  return result;
}

export function historySourceKey(source) {
  return `${source.entityId}\u0000${source.attribute ?? ''}`;
}

// Statistics are interval extrema, not state transitions. Keep them separate
// from Recorder observations so the resolver cannot assign a false timestamp.
export async function fetchRecorderStatistics(hass, sources, plan, now = Date.now) {
  if (typeof hass?.callWS !== 'function') throw new TypeError('Home Assistant callWS is required');
  if (plan?.mode !== 'statistics' || !plan.statistics) throw new TypeError('A statistics acquisition plan is required');
  const normalized = normalizeSources(sources);
  const ids = [...new Set(normalized.filter(source => !source.attribute).map(source => source.entityId))].sort();
  const metadata = ids.length ? await hass.callWS({ type: 'recorder/get_statistics_metadata', statistic_ids: ids }) : [];
  if (!Array.isArray(metadata)) throw new TypeError('Home Assistant returned invalid statistics metadata');
  const byId = new Map(metadata.filter(item => item && typeof item.statistic_id === 'string').map(item => [item.statistic_id, item]));
  const result = new Map(normalized.map(source => {
    const meta = byId.get(source.entityId);
    const unit = hass.states?.[source.entityId]?.attributes?.unit_of_measurement ?? null;
    const displayUnit = meta?.display_unit_of_measurement ?? null;
    const reason = source.attribute ? 'Long-term statistics are not available for entity attributes'
      : !meta ? 'Statistics metadata is unavailable'
        : meta.mean_type === 2 || (meta.has_mean !== true && meta.mean_type !== 1) ? 'Statistics do not provide min/max'
          : unit !== displayUnit ? 'Statistics and entity units are incompatible' : null;
    return [historySourceKey(source), { source, observations: [], statistics: { buckets: [], unit: displayUnit },
      status: 'unavailable', retrievedAt: now(), coverage: { complete: false, kind: reason ? 'incomplete' : 'unknown',
        reason, requested: { ...plan.statistics } } }];
  }));
  const eligible = ids.filter(id => !result.get(historySourceKey({ entityId: id, attribute: null }))?.coverage.reason);
  const chunkMs = 31 * 24 * 60 * 60 * 1000;
  for (let start = plan.statistics.start; eligible.length && start < plan.statistics.end;) {
    const end = Math.min(plan.statistics.end, start + chunkMs);
    const trace = plan.trace;
    const started = trace ? historyDebugTime() : 0;
    if (trace) historyDebugLog('statistics.websocket.start', { ...trace, entities: eligible,
      start: new Date(start).toISOString(), end: new Date(end).toISOString() });
    const response = await hass.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(), statistic_ids: eligible, period: 'hour', types: ['min', 'max'] });
    if (trace) historyDebugLog('statistics.websocket.end', { ...trace, elapsedMs: historyDebugTime() - started,
      responseCounts: Object.fromEntries(eligible.map(id => [id, Array.isArray(response?.[id]) ? response[id].length : null])) });
    if (!response || typeof response !== 'object' || Array.isArray(response)) throw new TypeError('Home Assistant returned invalid statistics');
    for (const id of eligible) {
      const record = result.get(historySourceKey({ entityId: id, attribute: null }));
      const rows = response[id];
      if (!Array.isArray(rows)) {
        record.coverage = { ...record.coverage, kind: 'incomplete', reason: 'Statistics are missing for the requested period' };
        continue;
      }
      const sorted = [...rows].sort((a, b) => (a?.start ?? Infinity) - (b?.start ?? Infinity));
      let expected = start;
      for (const row of sorted) {
        if (!Number.isFinite(row?.start) || row.start < expected || row.start < start || row.start % 3600000 !== 0
          || row.end !== row.start + 3600000 || row.end > end || !Number.isFinite(row.min)
          || !Number.isFinite(row.max) || row.min > row.max) {
          record.coverage = { ...record.coverage, kind: 'incomplete', reason: 'Statistics contain missing or malformed hourly buckets',
            ...(row?.start !== plan.statistics.end - 3600000 || row.start < expected ? { otherInvalid: true } : {}) };
          continue;
        }
        if (row.start !== expected) record.coverage = { ...record.coverage, kind: 'incomplete', reason: 'Statistics contain missing or malformed hourly buckets' };
        record.statistics.buckets.push({ start: row.start, end: row.end, min: row.min, max: row.max });
        expected = row.end;
      }
      if (expected !== end) record.coverage = { ...record.coverage, kind: 'incomplete', reason: 'Statistics contain missing or malformed hourly buckets' };
    }
    start = end;
  }
  for (const record of result.values()) if (record.statistics.buckets.length) record.status = 'available';
  for (const record of result.values()) {
    record.statistics.missingBuckets = Math.max(0, (plan.statistics.end - plan.statistics.start) / 3600000 - record.statistics.buckets.length);
  }
  return result;
}

// Both data types travel through the same shared service, but remain separate:
// bucket extrema are interval values and must never be treated as transitions.
export async function fetchPlannedHistory(hass, sources, window, now = Date.now) {
  if (window.acquisition?.mode !== 'statistics') return fetchRecorderHistory(hass, sources, window, now);
  const endOfHours = Math.floor(window.end / 3600000) * 3600000;
  const plan = { mode: 'statistics', statistics: { start: window.start, end: endOfHours }, trace: window[HISTORY_DEBUG_TRACE] };
  const rawWindow = window.end > endOfHours ? { ...window, start: endOfHours } : null;
  if (rawWindow && plan.trace) Object.defineProperty(rawWindow, HISTORY_DEBUG_TRACE, { value: plan.trace });
  const [statisticsResult, rawResult] = await Promise.allSettled([
    fetchRecorderStatistics(hass, sources, plan, now),
    rawWindow ? fetchRecorderHistory(hass, sources, rawWindow, now) : Promise.resolve(null),
  ]);
  if (statisticsResult.status === 'rejected') throw statisticsResult.reason;
  if (rawResult.status === 'rejected') throw rawResult.reason;
  const statistics = statisticsResult.value;
  const raw = rawResult.value;
  for (const [key, record] of statistics) {
    const tail = raw?.get(key);
    record.observations = tail?.observations ?? [];
    record.rawWindow = rawWindow ? { start: rawWindow.start, end: rawWindow.end } : null;
    record.statisticsWindow = { ...plan.statistics };
    record.coverage = { ...record.coverage, raw: tail?.coverage ?? null, rawAvailable: rawWindow ? tail?.status === 'available' : null,
      statistics: { ...record.coverage }, requested: { start: window.start, end: window.end } };
    if (rawWindow && (!tail || tail.status !== 'available')) {
      record.coverage = { ...record.coverage, kind: 'incomplete',
        reason: record.coverage.reason ?? 'Current-hour Recorder history is unavailable' };
    }
  }
  return statistics;
}

export async function fetchRecorderHistory(hass, sources, window, now = Date.now) {
  if (typeof hass?.callWS !== 'function') throw new TypeError('Home Assistant callWS is required');
  const normalizedSources = normalizeSources(sources);
  const entityIds = [...new Set(normalizedSources.map((source) => source.entityId))].sort();
  const trace = window[HISTORY_DEBUG_TRACE];
  const started = trace ? historyDebugTime() : 0;
  if (trace) historyDebugLog('recorder.websocket.start', { ...trace, entities: entityIds,
    start: new Date(window.start).toISOString(), end: new Date(window.end).toISOString(), timeZone: window.timeZone });
  let response;
  try { response = await hass.callWS({
    type: 'history/history_during_period',
    start_time: new Date(window.start).toISOString(),
    end_time: new Date(window.end).toISOString(),
    entity_ids: entityIds,
    include_start_time_state: true,
    significant_changes_only: false,
    minimal_response: normalizedSources.every((source) => !source.attribute),
    no_attributes: normalizedSources.every((source) => !source.attribute),
  }); } catch (error) {
    if (trace) historyDebugLog('recorder.websocket.error', { ...trace, elapsedMs: historyDebugTime() - started, error: String(error) });
    throw error;
  }
  if (trace) historyDebugLog('recorder.websocket.end', { ...trace, elapsedMs: historyDebugTime() - started,
    responseCounts: response && typeof response === 'object' && !Array.isArray(response)
      ? Object.fromEntries(entityIds.map(id => [id, Array.isArray(response[id]) ? response[id].length : null])) : null });
  const normalizeStart = trace ? historyDebugTime() : 0;
  if (trace) historyDebugLog('recorder.normalization.start', trace);
  try {
    const result = normalizeHistoryResponse(response, normalizedSources, window, now());
    if (trace) historyDebugLog('recorder.normalized', { ...trace, elapsedMs: historyDebugTime() - normalizeStart,
      observations: [...result.values()].map(record => ({ source: record.source, count: record.observations.length })) });
    return result;
  } catch (error) {
    if (trace) historyDebugLog('recorder.normalization.error', { ...trace, elapsedMs: historyDebugTime() - normalizeStart, error: String(error) });
    throw error;
  }
}
