import { describe, expect, it, vi } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { renderMarker, patchMarker, renderHistoryStatus } from '../../src/render/bar-renderer.js';
import { historicalMarkerConsumers, historicalMarkerId } from '../../src/history/marker-consumers.js';
import { resolveTimeWindow } from '../../src/history/time-window.js';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { loadCardClass } from '../support/load-card-class.cjs';

const entity = 'sensor.temperature';
const row = (marker, result, state = '40') => {
  const config = normalizeCardConfig({ entity, peak: { enabled: true }, floor: { enabled: true } }).entities[0];
  return buildRowViewModel({ entityConfig: config, entityState: { state, attributes: { unit_of_measurement: '°C' } },
    historicalExtrema: { [marker]: result } });
};

function fixture() {
  const listeners = new Map();
  const connection = { connected: true,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
    subscribeMessage: vi.fn(async () => () => {}),
  };
  const now = Date.now();
  const callWS = vi.fn(async (request) => Object.fromEntries(request.entity_ids.map(id => [id, [
    { s: '10', lu: (now - 30000) / 1000 }, { s: '90', lu: (now - 20000) / 1000 },
    { s: '20', lu: (now - 10000) / 1000 },
  ]])));
  const hass = { connection, callWS, connected: true, config: { time_zone: 'UTC' }, locale: { language: 'nl-BE' },
    states: { [entity]: { state: '40', attributes: {}, last_updated: new Date(now - 5000).toISOString() } } };
  const { card: Card, feature: Feature } = loadCardClass();
  const card = new Card(); card._render = () => {}; card._update = vi.fn(); card._logDiagnostics = () => {};
  card._setupResizeObserver = () => {}; card._schedulePostLayoutDensityPass = () => {}; card._attachRowActionHandlers = () => {};
  const feature = new Feature(); feature._render = () => {};
  return { card, feature, hass, callWS, connection, Card };
}

describe('historical Peak/Floor', () => {
  it('normalizes defaults and legacy resets without mutating input', () => {
    const input = { entity, peak: { enabled: true, reset: 'never', color: 'red' }, floor: { enabled: true, reset: '26m' } };
    const before = JSON.stringify(input); const config = normalizeCardConfig(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(config.peak_marker.window).toBe('today');
    expect(config.floor_marker.window).toBe('26m');
    expect(config.peak_marker.window_spec).toEqual({ kind: 'calendar', period: 'day' });
    expect(config.floor_marker.window_spec).toEqual({ kind: 'rolling', duration: { amount: 26, unit: 'minute' } });
    expect(config.peak).toEqual({ enabled: true, color: 'red', window: 'today' });
    expect(config.floor).not.toHaveProperty('reset');
    expect(config.entities[0].peak_marker).not.toHaveProperty('reset');
    expect(normalizeCardConfig({ entity }).peak_marker.window).toBe('today');
  });

  it('maps legacy and canonical windows and rejects unsupported input without fallback', () => {
    const cases = [
      ['quarterly', 'quarterly', 'quarter_hour'], ['hourly', 'hourly', 'hour'], ['daily', 'today', 'day'],
      ['weekly', 'this_week', 'week'], ['monthly', 'this_month', 'month'], ['yearly', 'this_year', 'year'],
    ];
    for (const [reset, canonical, period] of cases) {
      const normalized = normalizeCardConfig({ entity, peak: { reset } });
      expect(normalized.peak_marker.window).toBe(canonical);
      expect(normalized.peak_marker.window_spec).toEqual({ kind: 'calendar', period });
    }
    for (const [window, unit] of [['1m', 'minute'], ['1h', 'hour'], ['24h', 'hour'], ['7d', 'day']]) {
      expect(normalizeCardConfig({ entity, peak: { window } }).peak_marker.window_spec.duration.unit).toBe(unit);
    }
    for (const [window, canonical, kind, period] of [
      ['yesterday', 'yesterday', 'shifted_calendar', 'day'], ['last_week', 'previous_week', 'shifted_calendar', 'week'],
      ['last_month', 'previous_month', 'shifted_calendar', 'month'], ['last_year', 'previous_year', 'shifted_calendar', 'year'],
      ['yearly', 'this_year', 'calendar', 'year'],
    ]) {
      const normalized = normalizeCardConfig({ entity, peak: { window } });
      expect(normalized.peak_marker.window_spec).toMatchObject({ kind, period });
      expect(normalized.peak_marker.window).toBe(canonical);
    }
    const selected = normalizeCardConfig({ entity, peak: { window: 'last_week', reset: 'yearly' } });
    expect(selected.peak_marker.window).toBe('previous_week'); expect(selected.peak.window).toBe('previous_week');
    expect(selected.peak).not.toHaveProperty('reset'); expect(selected.peak_marker.window_invalid).toBeUndefined();
    const entityAlias = normalizeCardConfig({ entity, entities: [{ entity, peak: { window: 'last_month' }, floor: { reset: 'yearly' } }] });
    expect(entityAlias.entities[0].peak_marker.window).toBe('previous_month');
    expect(entityAlias.entities[0].peak.window).toBe('previous_month');
    expect(entityAlias.entities[0].floor_marker.window).toBe('this_year');
    expect(entityAlias.entities[0].floor.window).toBe('this_year');
    const validCanonical = normalizeCardConfig({ entity, peak: { window: 'previous_week' }, floor: { window: 'previous_month' } });
    expect(validateNormalizedConfig(validCanonical).warnings.map(w => w.code)).not.toContain('peak_marker.invalid_window');
    expect(validateNormalizedConfig(validCanonical).warnings.map(w => w.code)).not.toContain('floor_marker.invalid_window');
    const invalid = normalizeCardConfig({ entity, peak: { enabled: true, reset: '24h' } });
    expect(invalid.peak_marker.window_invalid).toBe(true);
    expect(invalid.entities[0].peak_marker.window_invalid).toBe(true);
    expect(historicalMarkerConsumers(invalid.entities)).toHaveLength(0);
    expect(validateNormalizedConfig(invalid).warnings.some(w => w.code === 'peak_marker.invalid_window')).toBe(true);
    expect(normalizeCardConfig({ entity, floor: { window: 'never' } }).floor_marker.window_invalid).toBe(true);
    expect(normalizeCardConfig({ entity, peak: { window: '__proto__' } }).peak_marker.window_invalid).toBe(true);
  });

  it('retains correct status and never substitutes the live reading', () => {
    for (const status of ['pending', 'invalid', 'unavailable']) {
      const result = row('peak', { value: null, status }, '99');
      expect(result.peak).toBeNull(); expect(result.peakVisible).toBe(false);
      expect(result.markerLaneOccupancy.above).toBe(true);
    }
    const partial = row('peak', { value: 80, status: 'partial' }, '99');
    expect(partial.peak).toBe(80); expect(partial.peakStatus).toBe('partial');
    expect(renderMarker(partial.markers.find(m => m.type === 'peak'))).toContain('Partial history');
    const stale = row('floor', { value: 20, status: 'stale' }, '1');
    expect(stale.floor).toBe(20); expect(stale.floorStatus).toBe('stale');
    expect(renderMarker(stale.markers.find(m => m.type === 'floor'))).toContain('Stale history');
    expect(row('peak', { value: 70, status: 'available' }).peak).toBe(70);
  });

  it('exposes partial and stale marker descriptions as keyboard tooltip triggers and clears them on recovery', () => {
    for (const [type, status, text] of [['peak', 'partial', 'Partial history'], ['floor', 'stale', 'Stale history']]) {
      const marker = row(type, { value: 20, status }).markers.find(item => item.type === type);
      const html = renderMarker(marker);
      expect(html).toContain(`aria-label="${type === 'peak' ? 'Peak' : 'Floor'}: ${text}`);
      expect(html).toContain(`data-sbcp-tooltip="${text}`);
      expect(html).toContain('tabindex="0"');
      expect(html).not.toContain('title=');
      const attributes = {}; const element = { dataset: {}, style: { setProperty() {}, removeProperty() {} },
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: name => { delete attributes[name]; }, querySelector: () => null };
      const indicator = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; } };
      element.querySelector = () => indicator;
      patchMarker(element, marker);
      expect(indicator.attributes['aria-label']).toContain(text);
      expect(indicator.attributes['data-sbcp-tooltip']).toContain(text);
      patchMarker(element, { ...marker, historyStatus: 'available' });
      expect(indicator.attributes['aria-label']).toBeUndefined();
      expect(indicator.attributes.role).toBeUndefined();
      expect(indicator.attributes['data-sbcp-tooltip']).toBeUndefined();
    }
  });

  it('renders one safe explanation when unavailable markers have different reasons', () => {
    const config = normalizeCardConfig({ entity, peak: { enabled: true }, floor: { enabled: true } }).entities[0];
    const model = buildRowViewModel({ entityConfig: config, entityState: { state: '40', attributes: {} },
      historicalExtrema: {
        peak: { status: 'unavailable', value: null, provenance: { coverage: { reason: 'Statistics metadata is unavailable' } } },
        floor: { status: 'unavailable', value: null, provenance: { coverage: { reason: 'Statistics and entity units are incompatible' } } },
      } });
    expect(model.peakVisible).toBe(false); expect(model.floorVisible).toBe(false);
    expect(model.historyStatusSummary.text).toContain('Peak: Long-term statistics');
    expect(model.historyStatusSummary.text).toContain('Floor: Statistics and Recorder units are incompatible');
    expect(renderHistoryStatus(model.historyStatusSummary)).toContain(`data-sbcp-tooltip="${model.historyStatusSummary.text}`);
    expect(model.markers.find(item => item.type === 'peak').position).toBeNull();
  });

  it('renders ordinary Recorder results without a partial badge while preserving unknown coverage', async () => {
    const now = Date.parse('2026-05-13T12:00:00Z');
    const hass = { config: { time_zone: 'UTC' }, callWS: vi.fn(async () => ({ [entity]: [
      { s: '10', lu: Date.parse('2026-05-13T10:00:00Z') / 1000 },
      { s: '90', lu: Date.parse('2026-05-13T11:00:00Z') / 1000 },
    ] })) };
    const resolver = new HistoricalValueResolver({ now: () => now, serviceOptions: { now: () => now } });
    for (const [marker, calculation, value] of [['peak', 'max', 90], ['floor', 'min', 10]]) {
      const result = await resolver.resolve({ source: { entityId: entity }, calculation,
        window: { kind: 'calendar', period: 'day' } }, { hass });
      expect(result).toMatchObject({ value, status: 'available', provenance: { coverage: { complete: false, kind: 'unknown' } } });
      const html = renderMarker(row(marker, result).markers.find(m => m.type === marker));
      expect(html).not.toContain('data-history-status="partial"');
      expect(html).not.toContain('Partial history');
    }
  });

  it('renders a partial badge for explicitly incomplete coverage', async () => {
    const now = Date.parse('2026-05-13T12:00:00Z');
    const provider = async (_hass, sources, window) => new Map([[`${entity}\u0000`, {
      source: sources[0], observations: [{ timestamp: window.start + 1000, value: 80 }],
      retrievedAt: now, coverage: { complete: false, kind: 'incomplete', reason: 'Missing interval' },
    }]]);
    const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider, now: () => now }), now: () => now });
    const result = await resolver.resolve({ source: { entityId: entity }, calculation: 'max',
      window: { kind: 'calendar', period: 'day' } }, { hass: { config: { time_zone: 'UTC' } } });
    expect(result).toMatchObject({ value: 80, status: 'partial' });
    const html = renderMarker(row('peak', result).markers.find(m => m.type === 'peak'));
    expect(html).toContain('data-history-status="partial"');
    expect(html).toContain('Partial history');
  });

  it('registers shared historical max and min for card and feature and preserves them across recreation', async () => {
    const { card, feature, hass, callWS, Card } = fixture();
    const config = { entity, peak: { enabled: true }, floor: { enabled: true }, scale: { direction: 'reverse' } };
    card.setConfig(config); card.hass = hass; card.connectedCallback();
    feature.setConfig(config); feature.hass = hass; feature.connectedCallback();
    const peakId = historicalMarkerId(card._config.entities[0], 'peak');
    const floorId = historicalMarkerId(card._config.entities[0], 'floor');
    await vi.waitFor(() => expect(card._historicalRuntime.getResult(peakId)?.value).toBe(90));
    await vi.waitFor(() => expect(feature._historicalRuntime.getResult(floorId)?.value).toBe(10));
    await vi.waitFor(() => expect(feature._row?.floor).toBe(10));
    expect(feature._row.peak).toBe(90);
    expect(feature._row.floorStatus).toBe('available');
    const model = card._buildRowViewModel(card._config.entities[0], card._config.entities[0], hass.states[entity]);
    expect(model.peak).toBe(90); expect(model.floor).toBe(10);
    expect(model.markers.find(m => m.type === 'peak').position).toBeCloseTo(10);
    expect(model.markers.find(m => m.type === 'floor').position).toBeCloseTo(90);
    expect(card._historicalRuntime.hub).toBe(feature._historicalRuntime.hub);
    expect(card._historicalRuntime.hub.service.families.size).toBe(1);
    expect(card._historicalRuntime.hub.service.sourceHistories.size).toBe(1);
    expect(callWS).toHaveBeenCalledTimes(1);
    card.disconnectedCallback(); card.connectedCallback();
    await vi.waitFor(() => expect(card._historicalRuntime.getResult(peakId)?.value).toBe(90));
    card.disconnectedCallback();
    const recreated = new Card(); recreated._render = () => {}; recreated._update = () => {}; recreated._logDiagnostics = () => {};
    recreated._setupResizeObserver = () => {}; recreated._schedulePostLayoutDensityPass = () => {}; recreated._attachRowActionHandlers = () => {};
    recreated.setConfig(config); recreated.hass = hass; recreated.connectedCallback();
    await vi.waitFor(() => expect(recreated._historicalRuntime.getResult(peakId)?.value).toBe(90));
    expect(recreated._historicalRuntime.hub).toBe(feature._historicalRuntime.hub);
    recreated.disconnectedCallback(); feature.disconnectedCallback();
  });

  it('registers only configured markers and updates consumers on config changes', async () => {
    const { card, hass, callWS } = fixture();
    card.setConfig({ entity }); card.hass = hass; card.connectedCallback();
    await Promise.resolve(); expect(callWS).not.toHaveBeenCalled();
    card.setConfig({ entity, peak: { enabled: true, window: 'today' } });
    let peakId = historicalMarkerId(card._config.entities[0], 'peak');
    await vi.waitFor(() => expect(card._historicalRuntime.getResult(peakId)?.value).toBe(90));
    const entry = card._historicalRuntime.entries.get(peakId);
    card.hass = { ...hass }; card.hass = { ...hass };
    expect(card._historicalRuntime.entries.get(peakId)).toBe(entry);
    card.setConfig({ entity, peak: { enabled: true, window: '24h' }, floor: { enabled: true } });
    const newPeakId = historicalMarkerId(card._config.entities[0], 'peak');
    const floorId = historicalMarkerId(card._config.entities[0], 'floor');
    expect(card._historicalRuntime.entries.get(newPeakId)).not.toBe(entry);
    expect(card._historicalRuntime.entries.has(floorId)).toBe(true);
    card.setConfig({ entity, floor: { enabled: true } });
    expect(card._historicalRuntime.entries.has(newPeakId)).toBe(false);
    card.disconnectedCallback();
  });

  it('schedules rollover for shifted calendar windows', () => {
    const now = Date.parse('2026-05-13T12:00:00Z');
    const marker = normalizeCardConfig({ entity, peak: { window: 'yesterday' } }).peak_marker;
    expect(resolveTimeWindow(marker.window_spec, { now, timeZone: 'UTC' }).semantics.rolloverAt)
      .toBe(Date.parse('2026-05-14T00:00:00Z'));
  });

  it('refreshes a yesterday watcher when the current calendar day changes', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-05-13T23:59:58Z'));
      const sourceKey = `${entity}\u0000`;
      const provider = vi.fn(async (_hass, sources, window) => new Map([[sourceKey, {
        source: sources[0], observations: [], statisticsWindow: { start: window.start, end: window.end },
        statistics: { buckets: Array.from({ length: (window.end - window.start) / 3600000 }, (_, index) => ({
          start: window.start + index * 3600000, end: window.start + (index + 1) * 3600000,
          min: new Date(window.start).getUTCDate(), max: new Date(window.start).getUTCDate(),
        })) },
        coverage: { complete: false }, retrievedAt: Date.now(),
      }]]));
      const service = new SharedObservationService({ provider });
      const resolver = new HistoricalValueResolver({ service });
      const results = [];
      const marker = normalizeCardConfig({ entity, peak: { window: 'yesterday' } }).peak_marker;
      const stop = resolver.watch({ source: { entityId: entity }, calculation: 'max', window: marker.window_spec },
        { hass: { config: { time_zone: 'UTC' } } }, result => results.push(result));
      await vi.waitFor(() => expect(results.at(-1)?.value).toBe(12));
      await vi.advanceTimersByTimeAsync(Date.parse('2026-05-14T00:00:00.010Z') - Date.now());
      await vi.waitFor(() => expect(results.at(-1)?.value).toBe(13));
      expect(provider).toHaveBeenCalledTimes(2);
      stop();
    } finally { vi.useRealTimers(); }
  });

  it('keeps source identities stable across row reorder and shares identical markers', () => {
    const first = normalizeCardConfig({ entities: [
      { entity: 'sensor.a', peak: { enabled: true } }, { entity: 'sensor.b', floor: { enabled: true } },
      { entity: 'sensor.a', peak: { enabled: true } },
    ] }).entities;
    const reordered = [first[1], first[2], first[0]];
    const before = historicalMarkerConsumers(first); const after = historicalMarkerConsumers(reordered);
    expect(before).toHaveLength(2);
    expect(new Set(before.map(item => item.id))).toEqual(new Set(after.map(item => item.id)));
  });
});
