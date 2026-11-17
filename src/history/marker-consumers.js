import { canonicalizeHistoricalWindow, isEligibleHistoricalWindow, parseHistoricalWindow } from './time-window.js';

// Equivalent markers in a host share an identity even if rows are reordered.
export function historicalMarkerId(row, marker, windowSpec = row?.[`${marker}_marker`]?.window_spec) {
  return JSON.stringify([row.entity, row.attribute ?? null, marker, windowSpec]);
}

export function resolveHistoricalMarkerWindow(row, marker, hass = null) {
  const config = row?.[`${marker}_marker`];
  const helper = config?.window_entity;
  if (!helper) return { window: config?.window, windowSpec: config?.window_spec ?? null, helperIssue: null };

  const state = hass?.states?.[helper];
  const option = typeof state?.state === 'string' ? state.state.trim() : '';
  if (!state || !option || ['unknown', 'unavailable'].includes(option.toLowerCase())) {
    return { window: config.window, windowSpec: config.window_spec ?? null,
      helperIssue: { helper, fallback: config.window, reason: 'unavailable', option: option || null } };
  }

  const window = canonicalizeHistoricalWindow(option.toLowerCase());
  const windowSpec = isEligibleHistoricalWindow(window) ? parseHistoricalWindow(window) : null;
  if (!windowSpec) {
    return { window: config.window, windowSpec: config.window_spec ?? null,
      helperIssue: { helper, fallback: config.window, reason: 'invalid', option } };
  }
  return { window, windowSpec, helperIssue: null };
}

export function historicalMarkerConsumers(rows, hass = null) {
  const consumers = rows.flatMap((row) => ['peak', 'floor'].flatMap((marker) => {
    const config = row?.[`${marker}_marker`];
    const selection = resolveHistoricalMarkerWindow(row, marker, hass);
    if (!config?.show || !selection.windowSpec
      || typeof row.entity !== 'string' || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(row.entity)) return [];
    return [{ id: historicalMarkerId(row, marker, selection.windowSpec), spec: {
      source: { entityId: row.entity, attribute: row.attribute ?? null },
      calculation: marker === 'peak' ? 'max' : 'min', window: selection.windowSpec,
    } }];
  }));
  return [...new Map(consumers.map((consumer) => [consumer.id, consumer])).values()];
}

export function historicalMarkerResults(runtime, row, hass = null) {
  return Object.fromEntries(['peak', 'floor'].map((marker) => {
    const selection = resolveHistoricalMarkerWindow(row, marker, hass);
    const result = selection.windowSpec
      ? runtime.getResult(historicalMarkerId(row, marker, selection.windowSpec)) ?? { value: null, status: 'pending' }
      : { value: null, status: 'invalid' };
    return [marker, { ...result, configuredWindow: selection.window,
      ...(selection.helperIssue ? { windowHelperIssue: selection.helperIssue } : {}) }];
  }));
}
