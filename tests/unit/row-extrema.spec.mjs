import { describe, it, expect } from 'vitest';
import { createCard, createEditor } from '../support/load-card-class.cjs';

const both = { peak: { enabled: true }, floor: { enabled: true } };
const row = (name, options = {}) => ({ entity: 'sensor.power', name, ...options });
function fixture(rows) {
  const card = createCard();
  card._render = () => {};
  card._logDiagnostics = () => {};
  card.setConfig({ entities: rows });
  return card;
}
function sample(card, value, time = Date.UTC(2026, 0, 1, 10), sources = {}) {
  const state = { state: String(value), last_updated: new Date(time).toISOString(), attributes: { unit_of_measurement: 'W' } };
  card._hass = { states: { 'sensor.power': state, 'sensor.min': { state: '0' }, 'sensor.max': { state: '200' }, 'sensor.other_max': { state: '400' }, ...sources } };
  for (const config of card._config.entities) card._updateExtrema(config, config, state);
  return card._config.entities.map(config => card._buildRowViewModel(config, config, state));
}
const values = (models) => models.map(model => [model.peak, model.floor]);
function sequence(card, offsets = [0, 1000, 2000, 3000], start = Date.UTC(2026, 0, 1, 10)) {
  let models;
  [50, 90, 20, 70].forEach((value, i) => { models = sample(card, value, start + offsets[i]); });
  return models;
}
describe('row-owned extrema', () => {
  const combinations = [
    [{ peak: { enabled: true } }, {}, [[90, null], [null, null]]],
    [{}, { peak: { enabled: true } }, [[null, null], [90, null]]],
    [{ floor: { enabled: true } }, {}, [[null, 20], [null, null]]],
    [{}, { floor: { enabled: true } }, [[null, null], [null, 20]]],
    [both, {}, [[90, 20], [null, null]]],
    [{}, both, [[null, null], [90, 20]]],
    [both, both, [[90, 20], [90, 20]]],
    [{ peak: { enabled: true } }, { floor: { enabled: true } }, [[90, null], [null, 20]]],
  ];
  it.each(combinations)('isolates duplicate enablement %#', (a, b, expected) => {
    expect(values(sequence(fixture([row('A', a), row('B', b)])))).toEqual(expected);
  });
  it('isolates duration windows', () => {
    const config = reset => ({ peak: { enabled: true, reset }, floor: { enabled: true, reset } });
    expect(values(sequence(fixture([row('Short', config('1m')), row('Long', config('2m'))]), [0, 15000, 30000, 90000]))).toEqual([[70, 70], [90, 20]]);
  });
  it('isolates calendar windows', () => {
    const config = reset => ({ peak: { enabled: true, reset }, floor: { enabled: true, reset } });
    const start = new Date(2026, 0, 1, 10, 59).getTime();
    expect(values(sequence(fixture([row('Hourly', config('hourly')), row('Daily', config('daily'))]), [0, 15000, 30000, 60000], start))).toEqual([[70, 70], [90, 20]]);
  });
  it('retains histories through reorder, title edit, removal and addition', () => {
    const a = row('Peak', { peak: { enabled: true } });
    const b = row('Floor', { floor: { enabled: true } });
    const card = fixture([a, b]); sequence(card);
    card.setConfig({ title: 'Changed', entities: [b, a] });
    expect(values(sample(card, 70))).toEqual([[null, 20], [90, null]]);
    card.setConfig({ entities: [a] });
    expect(values(sample(card, 70))).toEqual([[90, null]]);
    card.setConfig({ entities: [a, b] });
    expect(values(sample(card, 70))).toEqual([[90, null], [null, 70]]);
    card.setConfig({ entities: [b] });
    expect(values(sample(card, 70))).toEqual([[null, 70]]);
  });
  it('changes only one duplicate policy and keeps the other tracker', () => {
    const a = row('A', both), b = row('B', both);
    const card = fixture([a, b]); sequence(card);
    card.setConfig({ entities: [{ ...a, peak: { enabled: true, reset: '1m' } }, b] });
    expect(values(sample(card, 70))).toEqual([[70, 20], [90, 20]]);
  });
  it('freshens ambiguous unmatched duplicates instead of guessing', () => {
    const card = fixture([row('A', both), row('B', both)]); sequence(card);
    card.setConfig({ entities: [row('C', both), row('D', both)] });
    expect(values(sample(card, 70))).toEqual([[70, 70], [70, 70]]);
  });
  it('copies retained mutable trackers into new row ownership', () => {
    const card = fixture([row('A', both), row('B', both)]); sequence(card);
    const oldRows = card._config.entities;
    expect(Object.prototype.toString.call(card._extrema)).toBe('[object WeakMap]');
    const before = oldRows.map(r => card._extrema.get(r));
    card.setConfig({ title: 'Title only', entities: [row('A', both), row('B', both)] });
    card._config.entities.forEach((r, i) => {
      expect(card._extrema.get(r)).toEqual(before[i]);
      expect(card._extrema.get(r).peak).not.toBe(before[i].peak);
      expect(card._extrema.has(oldRows[i])).toBe(false);
    });
    expect(card._extrema.get(card._config.entities[0]).peak).not.toBe(card._extrema.get(card._config.entities[1]).peak);
  });
  it.each([
    ['same fixed', { min: 0, max: 100 }, { min: 0, max: 100 }, [[90, 20], [90, 20]]],
    ['different fixed', { min: 0, max: 100 }, { min: 0, max: 200 }, [[90, 20], [45, 10]]],
    ['same dynamic', { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, [[45, 10], [45, 10]]],
    ['different dynamic', { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.other_max' } }, [[45, 10], [22.5, 5]]],
    ['fixed and dynamic', { min: 0, max: 100 }, { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, [[90, 20], [45, 10]]],
  ])('stores absolute samples with %s Scales', (_, a, b, expected) => {
    const card = fixture([row('A', { ...both, scale: a }), row('B', { ...both, scale: b })]);
    const models = sequence(card);
    expect(values(models)).toEqual([[90, 20], [90, 20]]);
    expect(models.map(m => [m.peakPercent, m.floorPercent])).toEqual(expected);
    expect(card._rowScales.get(card._config.entities[0])).not.toBe(card._rowScales.get(card._config.entities[1]));
  });
  it('does not transfer history to two newly changed duplicates from a unique row', () => {
    const card = fixture([row('Original', both)]); sequence(card);
    card.setConfig({ entities: [row('New A', both), row('New B', both)] });
    expect(values(sample(card, 70))).toEqual([[70, 70], [70, 70]]);
  });
  it('preserves unique row history after visual changes and seeds newly enabled trackers', () => {
    const card = fixture([row('Original', { peak: { enabled: true } })]); sequence(card);
    card.setConfig({ entities: [row('Renamed', both)] });
    expect(values(sample(card, 70))).toEqual([[90, 70]]);
  });
  it('keeps implicit and explicit Scale fallback owners through unique-to-duplicate reorder', () => {
    const config = { scale: { min: 'sensor.min', max: { entity: 'sensor.max', fixed: 400 } }, ...both };
    const a = { entity: 'sensor.power' };
    const b = { entity: 'sensor.power', scale: { min: { entity: 'sensor.min', fixed: 0 } } };
    const card = fixture([a]);
    card.setConfig({ ...config, entities: [a] });
    const feed = (value, unavailable = false) => sample(card, value, undefined, {
      'sensor.max': { state: unavailable ? 'unavailable' : '400' },
      'sensor.min': { state: unavailable ? 'unavailable' : '0' },
    });
    [50, 90, 20, 70].forEach(value => feed(value));
    card.setConfig({ ...config, entities: [a, b] });
    expect(values(feed(70))).toEqual([[90, 20], [70, 70]]);
    expect(card._config.entities.map(row => row.scale.min.fixed_explicit)).toEqual([false, true]);
    card.setConfig({ ...config, entities: [b, a] });
    const reordered = feed(70, true);
    expect(reordered.map(model => [model.min, model.max])).toEqual([[0, 400], [0, 100]]);
    expect(values(reordered)).toEqual([[70, 70], [90, 20]]);
    card.setConfig({ ...config, entities: [a] });
    expect(values(feed(70, true))).toEqual([[90, 20]]);
  });
  it('retains named duplicate histories across real editor cleanup, later updates and reorder', () => {
    const config = { scale: { min: '0', max: '100' }, ...both, entities: [row('A'), row('B')] };
    const card = fixture(config.entities);
    card.setConfig(config);
    expect(values(sequence(card))).toEqual([[90, 20], [90, 20]]);
    const editor = createEditor();
    let emitted;
    editor.dispatchEvent = event => { emitted = event.detail.config; return true; };
    editor.setConfig(config);
    editor._handleInput({ target: { value: 'Title only', dataset: { field: 'title' } } });
    expect(emitted.title).toBe('Title only');
    expect(emitted.scale).toEqual({ min: { fixed: 0 }, max: { fixed: 100 } });
    card.setConfig(emitted);
    expect(card._config.entities.map(row => row.name)).toEqual(['A', 'B']);
    expect(values(sample(card, 70))).toEqual([[90, 20], [90, 20]]);
    const [a, b] = card._config.entities;
    expect(card._extrema.get(a).peak).not.toBe(card._extrema.get(b).peak);
    const edited = { ...emitted, entities: [{ ...emitted.entities[0], peak: { enabled: true, reset: '1m' } }, emitted.entities[1]] };
    card.setConfig(edited);
    expect(values(sample(card, 80))).toEqual([[80, 20], [90, 20]]);
    card.setConfig({ ...edited, entities: edited.entities.slice().reverse() });
    expect(card._config.entities.map(row => row.name)).toEqual(['B', 'A']);
    expect(values(sample(card, 70))).toEqual([[90, 20], [80, 20]]);
  });
  it('reproduces the Visual Examples duplicate-row ownership pattern', () => {
    const card = fixture([row('Target + Peak / Floor', { ...both, target: { at: { entity: 'sensor.limit', fixed: 65 } } }), row('Generic references', { markers: [{ at: '75%' }] })]);
    expect(values(sequence(card))).toEqual([[90, 20], [null, null]]);
  });
});
