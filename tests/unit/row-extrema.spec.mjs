import { afterEach, describe, it, expect, vi } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { historicalMarkerId } from '../../src/history/marker-consumers.js';
import { calculateObservationValue } from '../support/history-observation-oracle.mjs';
import { resolveTimeWindow } from '../../src/history/time-window.js';

const both = { peak: { enabled: true }, floor: { enabled: true } };
const row = (name, options = {}) => ({ entity: 'sensor.power', name, ...options });
const cards = [];
function fixture(rows, extra = {}) {
  const card = createCard(); cards.push(card);
  card._render = () => {}; card._update = () => {}; card._logDiagnostics = () => {};
  card._setupResizeObserver = () => {}; card._schedulePostLayoutDensityPass = () => {}; card._attachRowActionHandlers = () => {};
  const connection = { connected: true, addEventListener() {}, removeEventListener() {}, subscribeMessage: async () => () => {} };
  const now = Date.now();
  const callWS = vi.fn(async request => Object.fromEntries(request.entity_ids.map(id => [id, [
    { s: '50', lu: (now - 40000) / 1000 }, { s: '90', lu: (now - 30000) / 1000 },
    { s: '20', lu: (now - 20000) / 1000 }, { s: '70', lu: (now - 10000) / 1000 },
  ]])));
  const state = value => ({ state: String(value), attributes: { unit_of_measurement: 'W' } });
  card.setConfig({ entities: rows, ...extra });
  card.hass = { connection, callWS, config: { time_zone: 'UTC' }, locale: { language: 'nl-BE' },
    states: { 'sensor.power': state(70), 'sensor.min': state(0), 'sensor.max': state(200), 'sensor.other_max': state(400) } };
  card.connectedCallback();
  return { card, callWS };
}
async function ready(card) {
  await vi.waitFor(() => {
    for (const [id] of card._historicalRuntime.entries) expect(Number.isFinite(card._historicalRuntime.getResult(id)?.value)).toBe(true);
  });
}
function models(card) {
  return card._config.entities.map(config => card._buildRowViewModel(config, config, card._hass.states[config.entity]));
}
const values = rows => rows.map(item => [item.peak, item.floor]);
afterEach(() => { for (const card of cards.splice(0)) card.disconnectedCallback(); });

describe('shared historical extrema for rows', () => {
  const combinations = [
    [{ peak: { enabled: true } }, {}, [[90, null], [null, null]]],
    [{}, { peak: { enabled: true } }, [[null, null], [90, null]]],
    [{ floor: { enabled: true } }, {}, [[null, 20], [null, null]]],
    [{}, { floor: { enabled: true } }, [[null, null], [null, 20]]],
    [both, {}, [[90, 20], [null, null]]], [{}, both, [[null, null], [90, 20]]],
    [both, both, [[90, 20], [90, 20]]],
    [{ peak: { enabled: true } }, { floor: { enabled: true } }, [[90, null], [null, 20]]],
  ];
  it.each(combinations)('resolves duplicate-row marker enablement %#', async (a, b, expected) => {
    const { card, callWS } = fixture([row('A', a), row('B', b)]); await ready(card);
    expect(values(models(card))).toEqual(expected);
    expect(callWS).toHaveBeenCalledTimes(1);
    expect(card._historicalRuntime.hub.service.families.size).toBe(1);
  });

  it.each([
    ['same fixed', { min: 0, max: 100 }, { min: 0, max: 100 }, [[90, 20], [90, 20]]],
    ['different fixed', { min: 0, max: 100 }, { min: 0, max: 200 }, [[90, 20], [45, 10]]],
    ['same dynamic', { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, [[45, 10], [45, 10]]],
    ['different dynamic', { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.other_max' } }, [[45, 10], [22.5, 5]]],
    ['fixed and dynamic', { min: 0, max: 100 }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, [[90, 20], [45, 10]]],
  ])('projects shared absolute results through %s scales', async (_name, scaleA, scaleB, expected) => {
    const { card } = fixture([row('A', { ...both, scale: scaleA }), row('B', { ...both, scale: scaleB })]); await ready(card);
    expect(values(models(card))).toEqual([[90, 20], [90, 20]]);
    expect(models(card).map(item => [item.peakPercent, item.floorPercent])).toEqual(expected);
  });

  it('retains consumer identities and results when rows are reordered or presentation changes', async () => {
    const a = row('A', both); const b = row('B', both); const { card, callWS } = fixture([a, b]); await ready(card);
    const peakId = historicalMarkerId(card._config.entities[0], 'peak');
    const original = card._historicalRuntime.entries.get(peakId);
    card.setConfig({ title: 'Changed', entities: [b, a] });
    expect(card._historicalRuntime.entries.get(peakId)).toBe(original);
    expect(values(models(card))).toEqual([[90, 20], [90, 20]]);
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  it('keeps identical consumers when adding or removing duplicate rows', async () => {
    const a = row('A', both); const b = row('B', both); const { card } = fixture([a]); await ready(card);
    const ids = [...card._historicalRuntime.entries.keys()];
    card.setConfig({ entities: [a, b] }); expect([...card._historicalRuntime.entries.keys()]).toEqual(ids);
    card.setConfig({ entities: [b] }); expect([...card._historicalRuntime.entries.keys()]).toEqual(ids);
    expect(values(models(card))).toEqual([[90, 20]]);
  });

  it('replaces only the marker whose window changes', async () => {
    const { card } = fixture([row('A', both)]); await ready(card);
    const oldRow = card._config.entities[0]; const oldPeak = historicalMarkerId(oldRow, 'peak');
    const floor = historicalMarkerId(oldRow, 'floor'); const floorEntry = card._historicalRuntime.entries.get(floor);
    card.setConfig({ entities: [row('A', { peak: { enabled: true, window: '1h' }, floor: { enabled: true } })] });
    expect(card._historicalRuntime.entries.has(oldPeak)).toBe(false);
    expect(card._historicalRuntime.entries.get(floor)).toBe(floorEntry);
    await ready(card); expect(values(models(card))).toEqual([[90, 20]]);
  });

  it('does not swap maximum and minimum on a reversed scale', async () => {
    const { card } = fixture([row('A', { ...both, scale: { min: 0, max: 100, direction: 'reverse' } })]); await ready(card);
    const model = models(card)[0];
    expect([model.peak, model.floor]).toEqual([90, 20]);
    expect(model.markers.find(item => item.type === 'peak').position).toBeCloseTo(10);
    expect(model.markers.find(item => item.type === 'floor').position).toBeCloseTo(80);
  });

  it('shares entity history while keeping rows with different windows distinct', async () => {
    const { card } = fixture([row('Short', { peak: { enabled: true, window: '1m' } }),
      row('Long', { peak: { enabled: true, window: '24h' } })]); await ready(card);
    expect(values(models(card))).toEqual([[90, null], [90, null]]);
    expect(card._historicalRuntime.entries.size).toBe(2);
    expect(card._historicalRuntime.hub.service.families.size).toBe(2);
  });

  it('keeps effective boundary states and handles unavailable transitions', () => {
    const samples = [{ timestamp: 90, value: 90 }, { timestamp: 110, value: null }, { timestamp: 130, value: 20 }];
    expect(calculateObservationValue(samples, 'max', { start: 100, end: 120 }).value).toBe(90);
    expect(calculateObservationValue(samples, 'max', { start: 120, end: 125 }).value).toBeNull();
    expect(calculateObservationValue(samples, 'min', { start: 120, end: 140 }).value).toBe(20);
  });

  it.each([
    ['1m', { kind: 'rolling', duration: { amount: 1, unit: 'minute' } }],
    ['quarterly', { kind: 'calendar', period: 'quarter_hour' }],
    ['daily', { kind: 'calendar', period: 'day' }],
    ['weekly', { kind: 'calendar', period: 'week' }],
  ])('uses the expected %s historical window', (_input, spec) => {
    const now = Date.parse('2026-05-13T10:22:00Z');
    const resolved = resolveTimeWindow(spec, { now, timeZone: 'UTC', locale: 'nl-BE' });
    expect(resolved.end).toBe(now);
    expect(resolved.start).toBeLessThan(now);
    expect(resolved.interval).toBe('[start,end)');
  });
});
