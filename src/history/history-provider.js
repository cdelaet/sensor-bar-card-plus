import { getFiniteNumber } from '../config/normalize.js';

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

export async function fetchRecorderHistory(hass, sources, window, now = Date.now) {
  if (typeof hass?.callWS !== 'function') throw new TypeError('Home Assistant callWS is required');
  const normalizedSources = normalizeSources(sources);
  const entityIds = [...new Set(normalizedSources.map((source) => source.entityId))].sort();
  const response = await hass.callWS({
    type: 'history/history_during_period',
    start_time: new Date(window.start).toISOString(),
    end_time: new Date(window.end).toISOString(),
    entity_ids: entityIds,
    include_start_time_state: true,
    significant_changes_only: false,
    minimal_response: normalizedSources.every((source) => !source.attribute),
    no_attributes: normalizedSources.every((source) => !source.attribute),
  });
  return normalizeHistoryResponse(response, normalizedSources, window, now());
}
