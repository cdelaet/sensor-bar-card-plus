import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { getNumericValue } from '../../src/config/resolve.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';

const state = (value) => ({ state: String(value), attributes: { friendly_name: 'Power', unit_of_measurement: 'W', icon: 'mdi:flash' } });
function canonicalMeaning(value, key = '') {
  if (Array.isArray(value)) return value.map(v => canonicalMeaning(v));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([k]) => !['label_precision_key'].includes(k)).map(([k, v]) => [k, canonicalMeaning(v, k)]));
  if (key === 'fixed') return getNumericValue(null, value);
  if (/color/i.test(key) && typeof value === 'string' && /^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).split('').map(c => c + c).join('')}`.toLowerCase();
  return value;
}
function semantics(raw) {
  const config = normalizeCardConfig(raw);
  return canonicalMeaning([true, false].map((available) => {
    const hass = { states: { 'sensor.power': state(40), 'sensor.source': state(available ? 30 : 'unavailable') } };
    return config.entities.map((row) => ({
      layout: row.layout, bar: row.bar, baseline: row.baseline, formatting: row.formatting,
      target: row.target_marker, peak: row.peak_marker, floor: row.floor_marker,
      presentation: buildRowViewModel({ hass, cardConfig: config, entityConfig: row, entityState: hass.states[row.entity] }),
    }));
  }));
}
function titleRoundTrip(config) {
  const editor = createEditor();
  const events = [];
  editor.dispatchEvent = (event) => { events.push(event); return true; };
  editor.setConfig(config);
  editor._handleInput({ target: { id: 'title', value: 'Edited title', dataset: { field: 'title' } } });
  expect(events).toHaveLength(1);
  expect(events[0].detail.config.title).toBe('Edited title');
  return events[0].detail.config;
}
const forms = [12, '12', 'sensor.source', { fixed: 12 }, { entity: 'sensor.source' },
  { entity: 'sensor.source', fixed: 12 }, { value: 12 }, { entity: 'sensor.source', value: 12 }, null, {}];
const percentForms = ['25%', { percent: 25 }, { entity: 'sensor.source', fixed: 12, percent: 25 }, { entity: 'sensor.source', value: 12, percent: 25 }];
describe('editor semantic preservation', () => {
  for (const feature of ['scale', 'baseline', 'target', 'markers']) {
    const supported = feature === 'scale' ? forms : feature === 'markers' ? [...forms, '25%'] : [...forms, ...percentForms];
    supported.forEach((source, index) => {
      it(`${feature} source ${index} survives an unrelated title edit`, () => {
        const config = { type: 'custom:sensor-bar-card-plus', entities: [{ entity: 'sensor.power' }] };
        if (feature === 'scale') config.scale = { min: source, max: { fixed: 100 } };
        else if (feature === 'markers') config.markers = [{ at: source, label: { show: true } }];
        else config[feature] = { at: source };
        expect(semantics(titleRoundTrip(config))).toEqual(semantics(config));
      });
    });
  }
  const cases = [
    ['solid false', { bar: { solid_fill: true } }, { bar: { solid_fill: false } }],
    ['default blue override', { bar: { color: 'red' } }, { bar: { color: '#4a9eff' } }],
    ['explicit blue selects solid', { bar: { color: '#4a9eff' } }, {}],
    ['white Needle override', { bar: { needle: { show: true, color: 'red' } } }, { bar: { needle: { show: true, color: '#ffffff' } } }],
    ['boolean Needle', { bar: { needle: { show: true, color: 'red' } } }, { bar: { needle: true } }],
    ...['target', 'peak', 'floor'].map((key) => [`${key} default color`, { [key]: { enabled: true, at: 60, color: 'red' } }, { [key]: { color: '#888888' } }]),
    ['segment palette', { bar: { segments: [{ from: '0%', to: '100%', color: 'red' }] } }, { bar: { segments: [{ from: '0%', to: '100%', color: 'blue' }] } }],
    ['empty segments', { bar: { segments: [{ from: '0%', to: '100%', color: 'red' }] } }, { bar: { segments: [] } }],
    ['gradient palette', { bar: { fill_style: 'gradient', gradient_stops: [{ pos: 0, color: 'red' }, { pos: 100, color: 'blue' }] } }, { bar: { gradient_stops: [{ pos: '0%', color: '#4CAF50' }, { pos: '100%', color: '#F44336' }] } }],
    ['empty gradient', { bar: { gradient_stops: [{ pos: 0, color: 'red' }, { pos: 100, color: 'blue' }] } }, { bar: { gradient_stops: [] } }],
    ['Baseline clearing', { baseline: { at: 50, above: { color: 'red' }, below: { color: 'blue' } } }, { baseline: { above: { color: null }, below: { color: '' } } }],
    ['Target exceeded clearing', { target: { at: 50, when_exceeded: { fill_color: 'red' } } }, { target: { when_exceeded: { fill_color: null } } }],
    ['label clearing', { target: { at: 50, label: { show: true, precision: 2 } }, peak: { enabled: true, label: { show: true, precision: 2 } } }, { target: { label: { show: false, precision: null } }, peak: { label: { show: false, precision: null } } }],
    ['empty unit', { formatting: { unit: 'kW' } }, { formatting: { unit: '' } }],
    ['explicit clamped height', {}, { layout: { height: 12 } }],
    ['empty name', {}, { name: '' }],
    ...['scale', 'baseline', 'target'].flatMap((key) => [null, {}].map((value) => [`${key} replacement ${JSON.stringify(value)}`, { [key]: key === 'scale' ? { min: { fixed: 10 }, max: { fixed: 100 } } : { at: 60 } }, { [key]: key === 'scale' ? { min: value } : { at: value } }])),
  ];
  it.each(cases)('%s preserves effective inheritance', (_name, inherited, local) => {
    const config = { type: 'custom:sensor-bar-card-plus', ...inherited, entities: [{ entity: 'sensor.power', ...local }] };
    expect(semantics(titleRoundTrip(config))).toEqual(semantics(config));
  });
  it.each(['0x10', '0b10'])('Target %s keeps runtime parsing after a real title-only edit', literal => {
    const config = { entity: 'sensor.power', target: { at: literal } };
    const resolveTarget = raw => {
      const normalized = normalizeCardConfig(raw);
      return buildRowViewModel({
        hass: { states: { 'sensor.power': state(40) } }, cardConfig: normalized,
        entityConfig: normalized.entities[0], entityState: state(40),
      }).target;
    };
    expect(resolveTarget(config)).toBe(0);
    expect(resolveTarget(titleRoundTrip(config))).toBe(0);
  });
  it('distinguishes successive external percentage configurations', () => {
    const editor = createEditor();
    editor.setConfig({ entity: 'sensor.power', baseline: { at: '25%' } });
    editor.setConfig({ entity: 'sensor.power', baseline: { at: '75%' } });
    expect(editor._draftConfig.baseline.at).toBe('75%');
  });
  it('does not mistake a later external configuration for a stale emission echo', () => {
    const editor = createEditor();
    let emitted;
    editor.dispatchEvent = event => { emitted = event.detail.config; return true; };
    editor.setConfig({ entity: 'sensor.power', baseline: { at: '25%' } });
    editor._setTitle('Edited');
    editor.setConfig({ ...emitted, baseline: { at: '75%' } });
    expect(editor._draftConfig.baseline.at).toBe('75%');
    editor.setConfig(emitted);
    expect(editor._draftConfig.baseline.at).toBe('25%');
  });
  it('interprets advanced sources and Gradient percentages without creating a Scale percent API', () => {
    const editor = createEditor();
    expect(editor._getResolvablePartsFromTarget({ target: { at: 'sensor.source' } }, 'target', { canonicalBasePath: ['target', 'at'] }).entity).toBe('sensor.source');
    expect(editor._getResolvablePartsFromTarget({ baseline: { at: { entity: 'sensor.source', value: 12, percent: 25 } } }, 'baseline', { canonicalBasePath: ['baseline', 'at'] })).toMatchObject({ entity: 'sensor.source', fixed: 12, percent: 25 });
    expect(editor._normalizeGradientStopPosValue('0%')).toBe(0);
    expect(editor._normalizeGradientStopPosValue('100%')).toBe(100);
  });
});
