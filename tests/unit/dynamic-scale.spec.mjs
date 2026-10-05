import { describe, expect, it, vi } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';

const state = (value) => ({ state: String(value), attributes: { unit_of_measurement: 'W' } });
const dynamicScale = { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } };
const snapshot = (value, min, max, baseline = 25) => ({ states: {
  'sensor.value': state(value),
  'sensor.min': state(min),
  'sensor.max': state(max),
  'sensor.baseline': state(baseline),
} });

function element(dataset = {}) {
  return {
    dataset,
    style: { cssText: '', setProperty(key, value) { this[key] = value; } },
    querySelector: () => null,
  };
}

// Keep the real setter, update, row construction and patching; replace only DOM
// and layout measurement, which the unit harness does not implement.
function setup(config = {}, initial = snapshot(50, 0, 100)) {
  const card = createCard();
  card._logDiagnostics = () => {}; // Configuration warnings are covered separately.
  card._render = () => card._update();
  const configure = (overrides) => {
    card.setConfig({ scale: dynamicScale, entity: 'sensor.value', ...overrides });
  };
  configure(config);
  const rows = card._config.entities.map((_, index) => {
    const elements = Object.fromEntries([
      '.bar-fill-reveal', '.baseline-indicator', '.target-marker', '.peak-marker',
      '.floor-marker', '.needle-marker', '.value-right', '.target-value-label',
    ].map((selector) => [selector, element()]));
    const generic = element({ markerId: 'generic-0' });
    return {
      dataset: { rowIndex: String(index) },
      elements,
      generic,
      querySelector: (selector) => elements[selector] ?? null,
      querySelectorAll: (selector) => selector === '.generic-marker[data-marker-id]' ? [generic] : [],
      addEventListener: () => {},
    };
  });
  const rowsEl = { innerHTML: '', querySelectorAll: () => rows };
  card.shadowRoot.querySelector = (selector) => selector === '.rows' ? rowsEl : null;
  card._runPostLayoutPasses = () => {};
  const models = new Map();
  const build = card._buildRowViewModel.bind(card);
  vi.spyOn(card, '_buildRowViewModel').mockImplementation((entityCfg, ecfg, stateObj) => {
    const model = build(entityCfg, ecfg, stateObj);
    models.set(entityCfg, model);
    return model;
  });
  const update = vi.spyOn(card, '_update');
  card.hass = initial;
  const model = (index = 0) => models.get(card._config.entities[index]);
  return { card, configure, rows, rowsEl, model, update };
}

function expectGeometry(model, row) {
  expect(model.min).toBeLessThan(model.max);
  for (const pct of [model.percent, model.baselinePercent, model.targetPercent,
    model.peakPercent, model.floorPercent, model.needle.percent,
    ...model.markers.map((marker) => marker.position)]) {
    if (pct === null) continue;
    expect(Number.isFinite(pct)).toBe(true);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  }
  expect(row.elements['.bar-fill-reveal'].style.cssText).not.toMatch(/NaN|Infinity/);
}

describe('dynamic scale through the card update path', () => {
  it.each([
    ['minimum', { 'sensor.min': state(-100) }, -100, 100],
    ['maximum', { 'sensor.max': state(200) }, 0, 200],
    ['both bounds', { 'sensor.min': state(-100), 'sensor.max': state(200) }, -100, 200],
  ])('updates when only %s changes and skips an unchanged snapshot', (_, changed, min, max) => {
    const { card, model, update } = setup();
    update.mockClear();
    card.hass = { states: { ...card._hass.states } };
    expect(update).not.toHaveBeenCalled();
    card.hass = { states: { ...card._hass.states, ...changed } };
    expect(update).toHaveBeenCalledTimes(1);
    expect(model()).toMatchObject({ min, max, numericValue: 50 });
  });

  it('projects simultaneous value, min, max and Baseline from the new snapshot', () => {
    const { card, model, rows } = setup({ baseline: { at: { entity: 'sensor.baseline' } } });
    card.hass = snapshot(140, 100, 300, 220);
    expect(model()).toMatchObject({ min: 100, max: 300, numericValue: 140, percent: 20,
      baseline: 220, baselinePercent: 60 });
    expect(rows[0].elements['.baseline-indicator'].style.left).toBe('60%');
    expect(rows[0].elements['.bar-fill-reveal'].style.cssText)
      .toContain('inset(0 40% 0 20% round 6px 0 0 6px)');
    expectGeometry(model(), rows[0]);
  });

  it('expands and contracts value, Target, generic marker and Needle positions without changing displayed values', () => {
    const { card, model, rows } = setup({
      target: { at: { fixed: 80 }, label: { show: true } },
      markers: [{ at: { fixed: 60 } }],
      bar: { needle: { show: true } },
    }, snapshot(90, 0, 100));
    card.hass = snapshot(90, 0, 200);
    expect(model()).toMatchObject({ percent: 45, target: 80, targetPercent: 40 });
    expect(rows[0].elements['.needle-marker'].style.left).toBe('45%');
    expect(rows[0].elements['.target-marker'].style.left).toBe('40%');
    expect(rows[0].generic.style.left).toBe('30%');
    card.hass = snapshot(90, 20, 70);
    expect(model()).toMatchObject({ numericValue: 90, percent: 100, target: 80, targetPercent: 100 });
    expect(model().primaryPresentation.text).toBe('90 W');
    expect(model().targetPresentation.text).toBe('80 W');
    expect(rows[0].elements['.needle-marker'].style.left).toBe('100%');
    expect(rows[0].elements['.target-marker'].style.left).toBe('100%');
    expect(rows[0].generic.style.left).toBe('80%');
    expectGeometry(model(), rows[0]);
  });

  it('crosses Baseline in both directions while the scale moves', () => {
    const { card, model, rows } = setup({ baseline: { at: { entity: 'sensor.baseline' } } });
    card.hass = snapshot(140, 100, 300, 220);
    expect(card._getNormalizedPercent(model().percent, model().baselinePercent))
      .toMatchObject({ start: 20, end: 60, positive: false });
    expectGeometry(model(), rows[0]);
    card.hass = snapshot(100, -100, 300, 0);
    expect(model()).toMatchObject({ percent: 50, baselinePercent: 25 });
    expect(rows[0].elements['.bar-fill-reveal'].style.cssText)
      .toContain('inset(0 50% 0 25% round 0 6px 6px 0)');
    expectGeometry(model(), rows[0]);
  });

  it('stores absolute Peak/Floor history and reprojects it, including simultaneous new samples', () => {
    const { card, model, rows } = setup({ peak: { enabled: true }, floor: { enabled: true } }, snapshot(80, 0, 100));
    card.hass = snapshot(20, 0, 100);
    card.hass = snapshot(50, 0, 200);
    expect(card._extrema.get(card._config.entities[0])).toMatchObject({ peak: { value: 80 }, floor: { value: 20 } });
    expect(model()).toMatchObject({ peak: 80, peakPercent: 40, floor: 20, floorPercent: 10 });
    expect(rows[0].elements['.peak-marker'].style.left).toBe('40%');
    expect(rows[0].elements['.floor-marker'].style.left).toBe('10%');
    card.hass = snapshot(50, 30, 70);
    expect(model()).toMatchObject({ peak: 80, peakPercent: 100, floor: 20, floorPercent: 0 });
    card.hass = snapshot(160, 0, 200);
    expect(card._extrema.get(card._config.entities[0])).toMatchObject({ peak: { value: 160 }, floor: { value: 20 } });
    expect(model()).toMatchObject({ peak: 160, peakPercent: 80, floor: 20, floorPercent: 10 });
    expectGeometry(model(), rows[0]);
  });

  it('holds equal and reversed bounds, keeps live values moving, and recovers without looping', () => {
    const { card, model, rows, update } = setup({ baseline: { at: { entity: 'sensor.baseline' } } });
    update.mockClear();
    card.hass = snapshot(60, 100, 100, 40);
    expect(model()).toMatchObject({ min: 0, max: 100, percent: 60, baselinePercent: 40 });
    expectGeometry(model(), rows[0]);
    card.hass = snapshot(70, 200, 100, 50);
    expect(model()).toMatchObject({ min: 0, max: 100, percent: 70, baselinePercent: 50 });
    expectGeometry(model(), rows[0]);
    card.hass = snapshot(260, 200, 500, 350);
    expect(model()).toMatchObject({ min: 200, max: 500, percent: 20, baselinePercent: 50 });
    expectGeometry(model(), rows[0]);
    card.hass = { states: { ...card._hass.states } };
    expect(update).toHaveBeenCalledTimes(3);
  });

  it.each([[100, 100], [200, 100], ['unavailable', 'unknown']])(
    'uses a safe scale on first render with bounds %s..%s', (min, max) => {
      const { model, rows, rowsEl } = setup({}, snapshot(50, min, max));
      expect(model()).toMatchObject({ min: 0, max: 100, percent: 50 });
      expect(rowsEl.innerHTML).not.toMatch(/NaN|Infinity/);
      expectGeometry(model(), rows[0]);
    },
  );

  it('uses valid configured fixed bounds on an invalid first render', () => {
    const { model } = setup({ scale: {
      min: { entity: 'sensor.min', fixed: -100 }, max: { entity: 'sensor.max', fixed: 300 },
    } }, snapshot(100, 200, 100));
    expect(model()).toMatchObject({ min: -100, max: 300, percent: 50 });
  });

  it('uses the normal default for an unavailable single dynamic bound without a fixed fallback', () => {
    const { card, model } = setup({ scale: { min: { fixed: 0 }, max: { entity: 'sensor.max' } } }, snapshot(50, 0, 200));
    card.hass = snapshot(60, 0, 'unavailable');
    expect(model()).toMatchObject({ min: 0, max: 100, percent: 60 });
    const states = { ...card._hass.states };
    delete states['sensor.max'];
    card.hass = { states };
    expect(model()).toMatchObject({ min: 0, max: 100 });
    card.hass = snapshot(60, 0, 100);
    expect(model()).toMatchObject({ max: 100, percent: 60 });
  });

  it('honors a valid explicit fixed fallback when a dynamic entity is unavailable', () => {
    const { card, model } = setup({ scale: { min: { fixed: 0 }, max: { entity: 'sensor.max', fixed: 100 } } }, snapshot(50, 0, 200));
    card.hass = snapshot(50, 0, 'unknown');
    expect(model()).toMatchObject({ min: 0, max: 100, percent: 50 });
    card.hass = snapshot(50, 0, 300);
    expect(model()).toMatchObject({ max: 300 });
  });

  it('resets scale history when configuration, sources, or row identity changes', () => {
    const { card, configure, model } = setup({}, snapshot(50, -100, 300));
    card.hass = snapshot(50, 200, 100);
    expect(model()).toMatchObject({ min: -100, max: 300 });
    configure({});
    card.hass = snapshot(50, 200, 100);
    expect(model()).toMatchObject({ min: 0, max: 100 });
    configure({ entity: 'sensor.other', scale: { min: { fixed: -50 }, max: { entity: 'sensor.other_max', fixed: 150 } } });
    card.hass = { states: { 'sensor.other': state(50), 'sensor.other_max': state(-50) } };
    expect(model()).toMatchObject({ entityId: 'sensor.other', min: -50, max: 150 });
  });

  it('keeps independent histories even for two configured rows of the same entity and resets after reorder/removal', () => {
    const configs = [
      { entity: 'sensor.value' },
      { entity: 'sensor.value', scale: { min: { entity: 'sensor.other_min' }, max: { entity: 'sensor.other_max' } } },
    ];
    const initial = snapshot(50, -100, 100);
    initial.states['sensor.other_max'] = state(200);
    initial.states['sensor.other_min'] = state(0);
    const { card, configure, model } = setup({ entities: configs }, initial);
    card.hass = { states: { ...snapshot(50, 200, 100).states, 'sensor.other_min': state(200), 'sensor.other_max': state(0) } };
    expect(model(0)).toMatchObject({ min: -100, max: 100 });
    expect(model(1)).toMatchObject({ min: 0, max: 200 });
    configure({ entities: [...configs].reverse() });
    card.hass = { states: { ...card._hass.states } };
    expect(model(0)).toMatchObject({ min: 0, max: 100 });
    expect(model(1)).toMatchObject({ min: 0, max: 100 });
    configure({ entities: [configs[0]] });
    card.hass = snapshot(50, 0, 400);
    expect(model()).toMatchObject({ min: 0, max: 400 });
    configure({ entities: configs });
    card.hass = { states: { ...snapshot(50, 200, 100).states, 'sensor.other_max': state(0) } };
    expect(model(0)).toMatchObject({ min: 0, max: 400 });
    expect(model(1)).toMatchObject({ min: 0, max: 100 });
  });

  it('calculates recovery transition duration using the previously retained scale', () => {
    const { card, rows } = setup({}, snapshot(50, 0, 200));
    card.hass = snapshot(50, 200, 100);
    card.hass = snapshot(50, 0, 100);
    expect(rows[0].elements['.bar-fill-reveal'].style.cssText).toContain('--sbcp-reveal-duration:300ms');
  });

  it.each([
    ['complete fallback, min unavailable', 500, 1000, 'unavailable', 1200, 500, 1000],
    ['complete fallback, max unavailable', 500, 1000, 700, 'unknown', 500, 1000],
    ['complete fallback, both unavailable', 500, 1000, 'unknown', 'unavailable', 500, 1000],
    ['min-only fallback, min unavailable', 500, null, 'unavailable', 1200, 0, 100],
    ['min-only fallback, max unavailable', 500, null, 700, 'unknown', 0, 100],
    ['max-only fallback, min unavailable', null, 1000, 'unavailable', 1200, 0, 100],
    ['max-only fallback, max unavailable', null, 1000, 700, 'unknown', 0, 100],
    ['no fallbacks', null, null, 'unavailable', 1200, 0, 100],
    ['invalid fallback pair', 1000, 500, 700, 'unavailable', 0, 100],
    ['non-finite member', 500, 1000, 700, 'Infinity', 500, 1000],
  ])('abandons the entire unavailable dynamic pair: %s', (_, fixedMin, fixedMax, liveMin, liveMax, min, max) => {
    const { card, model, rows } = setup({ scale: {
      min: { entity: 'sensor.min', fixed: fixedMin },
      max: { entity: 'sensor.max', fixed: fixedMax },
    } }, snapshot(900, 600, 1400));
    expect(model()).toMatchObject({ min: 600, max: 1400 });
    card.hass = snapshot(900, liveMin, liveMax);
    expect(model()).toMatchObject({ min, max });
    expectGeometry(model(), rows[0]);
    card.hass = snapshot(900, 500, 1200);
    expect(model()).toMatchObject({ min: 500, max: 1200 });
    expectGeometry(model(), rows[0]);
  });

  it.each([
    ['equal, complete fixed pair', 700, 700, 500, 1000, 500, 1000],
    ['reversed, complete fixed pair', 1200, 700, 500, 1000, 500, 1000],
    ['equal, lone min fallback', 700, 700, 500, null, 0, 100],
    ['reversed, lone max fallback', 1200, 700, null, 1000, 0, 100],
    ['equal, invalid fixed pair', 700, 700, 1000, 500, 0, 100],
  ])('handles first-render numeric invalid pairs: %s', (_, liveMin, liveMax, fixedMin, fixedMax, min, max) => {
    const { model, rows } = setup({ scale: {
      min: { entity: 'sensor.min', fixed: fixedMin },
      max: { entity: 'sensor.max', fixed: fixedMax },
    } }, snapshot(900, liveMin, liveMax));
    expect(model()).toMatchObject({ min, max });
    expectGeometry(model(), rows[0]);
  });

  it('retains history ahead of complete fixed fallbacks only for numeric invalid pairs', () => {
    const { card, model } = setup({ scale: {
      min: { entity: 'sensor.min', fixed: 500 }, max: { entity: 'sensor.max', fixed: 1000 },
    } }, snapshot(900, 600, 1400));
    card.hass = snapshot(900, 1400, 1400);
    expect(model()).toMatchObject({ min: 600, max: 1400 });
    card.hass = snapshot(900, 1500, 1400);
    expect(model()).toMatchObject({ min: 600, max: 1400 });
    card.hass = snapshot(900, 'unavailable', 1400);
    expect(model()).toMatchObject({ min: 500, max: 1000 });
    card.hass = snapshot(900, 1400, 1400);
    expect(model()).toMatchObject({ min: 500, max: 1000 });
  });

  it.each([
    ['default min', { max: { entity: 'sensor.max', fixed: 1000 } }, 0, 800, 0, 'unavailable', 0, 800, 0, 1000],
    ['default max', { min: { entity: 'sensor.min', fixed: -500 } }, -200, 100, 'unavailable', 100, -200, 100, -500, 100],
    ['fixed min', { min: { fixed: 200 }, max: { entity: 'sensor.max', fixed: 1000 } }, 0, 800, 0, 'unavailable', 200, 800, 200, 1000],
    ['fixed max', { min: { entity: 'sensor.min', fixed: -500 }, max: { fixed: 500 } }, -200, 100, 'unavailable', 100, -200, 500, -500, 500],
  ])('preserves deliberately mixed bounds: %s', (_, scale, liveMin, liveMax, failedMin, failedMax, min, max, fallbackMin, fallbackMax) => {
    const { card, model, rows } = setup({ scale }, snapshot(50, liveMin, liveMax));
    expect(model()).toMatchObject({ min, max });
    card.hass = snapshot(50, failedMin, failedMax);
    expect(model()).toMatchObject({ min: fallbackMin, max: fallbackMax });
    expectGeometry(model(), rows[0]);
  });

  it.each([
    [{ min: { fixed: 0 }, max: { entity: 'sensor.max', fixed: 1000 } }, 0, -100, 0, 1000],
    [{ min: { entity: 'sensor.min', fixed: -500 } }, 200, 100, -500, 100],
    [{ min: { fixed: 200 }, max: { entity: 'sensor.max', fixed: 100 } }, 0, 100, 0, 100],
  ])('makes an invalid mixed pair safe without retaining dynamic history', (scale, liveMin, liveMax, min, max) => {
    const { card, model, rows } = setup({ scale }, snapshot(50, -200, 800));
    card.hass = snapshot(50, liveMin, liveMax);
    expect(model()).toMatchObject({ min, max });
    expectGeometry(model(), rows[0]);
  });

  it.each([
    { scale: { min: 'sensor.min', max: 'sensor.max' }, min: 500 },
    { min_entity: 'sensor.min', max_entity: 'sensor.max', min: 500 },
    { scale: { min: 'sensor.min', max: { entity: 'sensor.max', fixed: 1000 } } },
    { min_entity: 'sensor.min', max_entity: 'sensor.max', max: 1000 },
  ])('does not mistake implicit defaults for an explicit complete fallback pair', (config) => {
    const { card, model } = setup({ ...config, scale: config.scale ?? undefined }, snapshot(900, 600, 1400));
    card.hass = snapshot(900, 'unavailable', 1400);
    expect(model()).toMatchObject({ min: 0, max: 100 });
  });
});
