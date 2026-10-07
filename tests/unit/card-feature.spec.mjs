import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { loadCardClass } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';

const entity = 'sensor.power';
const sensor = (value, attributes = {}, last_updated) => ({ state: String(value), attributes, last_updated });
const hass = (value, others = {}) => ({ states: { [entity]: sensor(value), ...others } });
function feature(config = { type: 'custom:sensor-bar-card-plus-feature' }) {
  const { feature: Feature } = loadCardClass();
  const element = new Feature();
  // Unit tests exercise reconciliation; the real shadow DOM is covered in Playwright.
  vi.spyOn(element, '_render').mockImplementation(() => {});
  if (config) element.setConfig(config);
  return element;
}
async function update(element, value, others = {}) {
  element.hass = hass(value, others);
  await element.updateComplete;
}

describe('native feature registration', () => {
  it('registers all elements and discovery entries, with an inherited stub and no editor', () => {
    const classes = loadCardClass();
    expect(classes.card).toBeTypeOf('function');
    expect(classes.editor).toBeTypeOf('function');
    expect(classes.feature).toBeTypeOf('function');
    expect(classes.feature.getStubConfig()).toEqual({ type: 'custom:sensor-bar-card-plus-feature' });
    expect(classes.feature.getConfigElement).toBeUndefined();
    expect(classes.customCardFeatures).toHaveLength(1);
    expect(classes.customCardFeatures[0]).toMatchObject({ type: 'sensor-bar-card-plus-feature', name: 'Sensor Bar Card Plus' });
    expect(classes.customCardFeatures[0].configurable).not.toBe(true);
  });
  it('allows numeric or nonnumeric parents and area context without validating the eventual entity', () => {
    const supported = loadCardClass().customCardFeatures[0].isSupported;
    expect(supported(hass(42), { entity_id: entity })).toBe(true);
    expect(supported({ states: { 'switch.pump': sensor('on') } }, { entity_id: 'switch.pump' })).toBe(true);
    expect(supported({}, { area_id: 'kitchen' })).toBe(true);
    expect(supported({}, {})).toBe(false);
    expect(supported({}, undefined)).toBe(false);
  });
  it('can evaluate source and dist twice without replacing elements or duplicating discovery', () => {
    execFileSync('node', ['tools/build-dist.cjs'], { stdio: 'pipe' });
    for (const source of ['src', 'dist']) {
      const classes = loadCardClass({ source });
      expect(() => classes.reload()).not.toThrow();
      expect(classes.customCards).toHaveLength(1);
      expect(classes.customCardFeatures).toHaveLength(1);
    }
  });
});

describe('independent input reconciliation', () => {
  for (const order of [
    ['config', 'hass', 'context'], ['config', 'context', 'hass'],
    ['hass', 'config', 'context'], ['hass', 'context', 'config'],
    ['context', 'config', 'hass'], ['context', 'hass', 'config'],
  ]) {
    it(`accepts inputs in order ${order.join(' → ')}`, async () => {
      const element = feature(null);
      for (const input of order) {
        if (input === 'config') element.setConfig({ type: 'custom:sensor-bar-card-plus-feature' });
        if (input === 'hass') element.hass = hass(42);
        if (input === 'context') element.context = { entity_id: entity };
        await element.updateComplete;
      }
      expect(element._status).toBeNull();
      expect(element._row).toMatchObject({ entityId: entity, numericValue: 42, percent: 42 });
      expect(element._config.entity).toBeUndefined();
    });
  }
  it('coalesces all independent setters and tolerates repeated assignments', async () => {
    const element = feature();
    element.context = { entity_id: entity };
    element.hass = hass(42);
    element.color = '#ff0000';
    element.position = 'inline';
    await element.updateComplete;
    expect(element._render).toHaveBeenCalledTimes(1);
    expect(element.color).toBe('#ff0000');
    expect(element.position).toBe('inline');
    element.hass = element.hass;
    element.context = element.context;
    element.color = element.color;
    element.position = element.position;
    await element.updateComplete;
    expect(element._render).toHaveBeenCalledTimes(2);
    expect(element._row.percent).toBe(42);
  });
  it('waits for config, context, and hass without inventing area aggregation', async () => {
    const element = feature(null);
    element.hass = hass(42);
    await element.updateComplete;
    expect(element._status).toBe('Not configured');
    element.setConfig({});
    element.context = { area_id: 'kitchen' };
    await element.updateComplete;
    expect(element._status).toBe('Configure an entity');
    element.setConfig({ entity });
    await element.updateComplete;
    expect(element._row.numericValue).toBe(42);
    element.hass = undefined;
    await element.updateComplete;
    expect(element._status).toBe('Waiting for Home Assistant');
  });
  it('uses an explicit override on a nonnumeric parent and keeps it independent of context', async () => {
    const element = feature({ entity });
    element.context = { entity_id: 'switch.pump' };
    await update(element, 42, { 'switch.pump': sensor('on') });
    expect(element._row.entityId).toBe(entity);
    element.context = { entity_id: 'sensor.other' };
    await element.updateComplete;
    expect(element._row.entityId).toBe(entity);
  });
  it('rejects malformed configs and multiple entities', () => {
    const element = feature(null);
    for (const config of [null, false, [], { entity: 3 }, { entity: 'bad' }, { entities: [entity] }]) {
      expect(() => element.setConfig(config)).toThrow();
    }
  });
  it('reuses normalized canonical and legacy config without mutating the input', async () => {
    const raw = {
      scale: { min: { fixed: -20 }, max: { fixed: 20 } },
      bar: { fill_style: 'soft_bands', segments: [{ from: -20, to: 20, color: '#abcdef' }] },
      baseline: { at: { fixed: 0 } }, target: { at: '75%' },
      peak: { enabled: true, reset: '1h' }, floor: { enabled: true },
      markers: [{ at: '25%', shape: 'pin' }], formatting: { decimal: 1, unit: 'W' },
    };
    for (const config of [raw, { min: -20, max: 20, color_mode: 'single', color: '#abcdef', show_peak: true, target: 15 }]) {
      const before = JSON.stringify(config);
      const element = feature(config);
      element.context = { entity_id: entity };
      await update(element, 10);
      const expected = normalizeCardConfig({ ...config, type: 'custom:sensor-bar-card-plus', entities: [{ entity }] });
      expect(JSON.parse(JSON.stringify(element._normalized.entities[0]))).toEqual(JSON.parse(JSON.stringify(expected.entities[0])));
      expect(JSON.stringify(config)).toBe(before);
    }
  });
  it('retains shared diagnostics for configuration fallbacks', async () => {
    const element = feature({ entity, scale: { min: 50, max: 10 }, peak: { enabled: true, reset: 'invalid' } });
    await update(element, 42);
    expect(element._diagnostics.warnings.map(warning => warning.code)).toContain('scale.min_gt_max');
    expect(element._diagnostics.warnings.map(warning => warning.code)).toContain('peak_marker.invalid_reset');
  });
});

describe('unavailable states and recovery', () => {
  it.each(['unknown', 'unavailable', 'on', '', 'NaN', 'Infinity'])('does not render %s as zero', async value => {
    const element = feature({ entity });
    await update(element, value);
    expect(element._status).not.toBeNull();
    expect(element._previousRow).toBeNull();
    await update(element, 0);
    expect(element._status).toBeNull();
    expect(element._row.numericValue).toBe(0);
    await update(element, 42);
    expect(element._row.percent).toBe(42);
  });
  it('handles missing overrides and context replacement, then recovers', async () => {
    const element = feature({ entity });
    element.hass = { states: {} };
    await element.updateComplete;
    expect(element._status).toBe('Entity not found');
    await update(element, 42);
    expect(element._status).toBeNull();
    element.setConfig({});
    element.context = { entity_id: 'sensor.other' };
    await element.updateComplete;
    expect(element._status).toBe('Entity not found');
    element.hass = hass(42, { 'sensor.other': sensor(70) });
    await element.updateComplete;
    expect(element._row).toMatchObject({ entityId: 'sensor.other', percent: 70 });
  });
});

describe('per-instance history', () => {
  const extremaConfig = { entity, peak: { enabled: true }, floor: { enabled: true } };
  it('keeps same-entity Peak/Floor independent, including repeated config and unavailable recovery', async () => {
    const a = feature(extremaConfig);
    const b = feature(extremaConfig);
    await update(a, 80);
    await update(a, 20);
    await update(b, 30);
    a.setConfig({ ...extremaConfig });
    await update(a, 'unavailable');
    await update(a, 50);
    expect(a._extrema).toMatchObject({ peak: { value: 80 }, floor: { value: 20 } });
    expect(b._extrema).toMatchObject({ peak: { value: 30 }, floor: { value: 30 } });
  });
  it.each(['duration', 'calendar'])('reuses %s reset policies on the next sample', async kind => {
    const element = feature({ entity, peak: { enabled: true, reset: kind === 'duration' ? '1h' : 'daily' } });
    element.hass = { states: { [entity]: sensor(80, {}, '2026-10-06T12:00:00Z') } };
    await element.updateComplete;
    element.hass = { states: { [entity]: sensor(20, {}, '2026-10-07T12:00:00Z') } };
    await element.updateComplete;
    expect(element._extrema.peak.value).toBe(20);
  });
  it('resets extrema and scale on effective-entity or config replacement', async () => {
    const element = feature({ peak: { enabled: true }, floor: { enabled: true } });
    element.context = { entity_id: entity };
    await update(element, 80, { 'sensor.other': sensor(30) });
    element.context = { entity_id: 'sensor.other' };
    await element.updateComplete;
    expect(element._extrema.peak.value).toBe(30);
    element.setConfig({ entity, ...extremaConfig, scale: { max: 200 } });
    await update(element, 10);
    expect(element._extrema.peak.value).toBe(10);
    expect(element._row.max).toBe(200);
    element.setConfig({ ...extremaConfig, entity: 'sensor.other' });
    await update(element, 80, { 'sensor.other': sensor(20) });
    expect(element._extrema).toMatchObject({ peak: { value: 20 }, floor: { value: 20 } });
  });
  it('isolates transient dynamic-scale history and uses shared missing-source fallbacks', async () => {
    const config = { entity, scale: { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } } };
    const a = feature(config);
    const b = feature(config);
    await update(a, 40, { 'sensor.min': sensor(20), 'sensor.max': sensor(80) });
    await update(b, 40, { 'sensor.min': sensor(-20), 'sensor.max': sensor(60) });
    const inverted = { 'sensor.min': sensor(90), 'sensor.max': sensor(10) };
    await update(a, 40, inverted);
    await update(b, 40, inverted);
    expect(a._row).toMatchObject({ min: 20, max: 80 });
    expect(b._row).toMatchObject({ min: -20, max: 60 });
    await update(a, 40);
    expect(a._row).toMatchObject({ min: 0, max: 100 });
    expect(b._scaleHistory).toEqual({ min: -20, max: 60 });
    a.setConfig({ ...config, bar: { animated: false } });
    await update(a, 40, inverted);
    expect(a._row).toMatchObject({ min: 0, max: 100 });
  });
});
