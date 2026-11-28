import { describe, it, expect } from 'vitest';
import { normalizeCardConfig, BAR_PAINT_DIAGNOSTICS, PAINT_PROPERTY_SOURCES } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { resolveTargetAbovePaint } from '../../src/view-model/target-above-paint-resolver.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel } from '../../src/view-model/bar-render-model.js';
import { compilePaint } from '../../src/view-model/paint-compiler.js';
import { TARGET_ABOVE_PAINT } from '../../src/view-model/paint-destinations.js';
import { setDestinationEnabled, setDestinationProperty, resetDestinationPaint } from '../../src/editor/shared/paint-destination.js';
import { loadCardClass } from '../support/load-card-class.cjs';

const entity = 'sensor.power';
const registry = { status: 'ready', presets: { warm: { fill_style: 'gradient', opacity: 35,
  gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] } } };
function model(config, value = 80, states = {}, presets = registry) {
  const card = normalizeCardConfig({ entities: [{ entity }], ...config });
  const appearance = { ...card.entities[0], target_above: resolveTargetAbovePaint(card.entities[0].target_above, card.target_above, presets) };
  const state = { state: String(value), attributes: {} };
  const row = buildRowViewModel({ entityConfig: appearance, entityState: state, hass: { states: { [entity]: state, ...states } } });
  const bar = buildBarRenderModel(row, appearance, { height: 30 });
  return { card, appearance, row, bar, layer: bar.fill.paintLayers.find(layer => layer.id === 'above-target') };
}

describe('Above Target Stage 1 normalization and compatibility', () => {
  for (const color of ['', false, 0]) it(`preserves released falsy legacy color suppression: ${JSON.stringify(color)}`, () => {
    expect(model({ target: { at: 60 }, above_target_color: color }).layer.visible).toBe(false);
    expect(model({ target: { at: 60 }, above_target_color: 'red', entities: [{ entity, above_target_color: color }] }).layer.visible).toBe(false);
  });
  it('keeps absent, null and empty state distinct without adding a threshold or marker', () => {
    const absent = model({ target: { at: 60 } });
    expect(absent.appearance.target_above.paint).toBeUndefined();
    expect(absent.layer.visible).toBe(false);
    const enabled = model({ target: { at: 60, when_above: { paint: {} } } });
    expect(enabled.appearance.target_above).toMatchObject({ legacy: false, paint: { fill_style: 'solid', opacity: 100 } });
    expect(enabled.appearance.target_above.paint.color).toBe('var(--accent-color, #4a9eff)');
    expect(enabled.card.entities[0].target_above.paint[PAINT_PROPERTY_SOURCES]).toBeDefined();
    expect(enabled.row.markers.filter(marker => marker.type === 'target')).toHaveLength(1);
    expect(enabled.bar.fill.paintLayers.map(layer => layer.id)).toEqual(['base', 'baseline-above', 'baseline-below', 'above-target', 'below-target']);
  });

  for (const legacy of [
    { target: { at: 60, when_exceeded: { fill_color: 'red' } } },
    { target: { at: 60 }, above_target_color: 'red' },
  ]) it(`canonical null suppresses all legacy fill paths: ${JSON.stringify(legacy)}`, () => {
    const config = { ...legacy, target: { ...legacy.target, when_above: { paint: null } } };
    const result = model(config);
    expect(result.appearance.target_above.paint).toBeNull();
    expect(result.layer.visible).toBe(false);
    expect(result.layer.paintStyle).not.toContain('red');
    expect(result.row.markers.find(marker => marker.type === 'target').visible).toBe(true);
    const inherited = model({ ...legacy, entities: [{ entity, target: { when_above: { paint: null } } }] });
    expect(inherited.appearance.target_above.paint).toBeNull();
    expect(inherited.layer.visible).toBe(false);
  });

  it('retains legacy alias precedence and the Baseline-crossing exception without leaking it into canonical entity overrides', () => {
    const config = { baseline: { at: 90 }, target: { at: 60, when_exceeded: { fill_color: 'red' } }, above_target_color: 'blue' };
    const legacy = model(config, 40);
    expect(legacy.appearance.target_above).toMatchObject({ legacy: true, paint: { color: 'red' } });
    expect(legacy.layer.visible).toBe(true);
    const canonical = model({ ...config, entities: [{ entity, target: { when_above: { paint: { color: 'green' } } } }] }, 40);
    expect(canonical.appearance.target_above).toMatchObject({ legacy: false, paint: { color: 'green' } });
    expect(canonical.layer.visible).toBe(false);
    const localAlias = model({ ...config, entities: [{ entity, above_target_color: 'purple' }] }, 40);
    expect(localAlias.appearance.target_above.paint.color).toBe('purple');
    expect(localAlias.layer.visible).toBe(true);
  });

  it('applies canonical properties over same-scope aliases while aliases supply omissions', () => {
    const result = model({ target: { at: 60, when_exceeded: { fill_color: 'red' }, when_above: { paint: { opacity: 40 } } } });
    expect(result.appearance.target_above).toMatchObject({ legacy: false, paint: { color: 'red', opacity: 40 } });
    expect(model({ target: { at: 60, when_exceeded: { fill_color: 'red' }, when_above: { paint: { color: 'blue' } } } })
      .appearance.target_above.paint.color).toBe('blue');
  });

  it('retains normalized entity diagnostic metadata and recovers properties independently', () => {
    const result = model({ entities: [{ entity, target: { at: 60, when_exceeded: { fill_color: 'red' },
      when_above: { paint: { color: 'blue', opacity: -1, fill_style: 'gradient', gradient_stops: registry.presets.warm.gradient_stops } } } }] });
    expect(result.card.entities[0].target_above[BAR_PAINT_DIAGNOSTICS]).toContainEqual(expect.objectContaining({ kind: 'invalid', property: 'opacity' }));
    expect(result.appearance.target_above.paint).toMatchObject({ opacity: 100, color: 'blue', fill_style: 'gradient' });
    const warnings = validateNormalizedConfig(result.card).warnings;
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'paint.invalid_value', entity, path: expect.stringContaining('target.when_above.paint.opacity') }));
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'paint.legacy_conflict', entity, message: expect.stringContaining('target.when_exceeded.fill_color') }));
  });

  it('resolves same-destination presets and opacity and recovers without stale preset paint', () => {
    const config = { target: { at: 60, when_above: { paint: { preset: 'warm' } } },
      entities: [{ entity, target: { when_above: { paint: { opacity: 0 } } } }] };
    const ready = model(config);
    expect(ready.appearance.target_above.paint).toMatchObject({ fill_style: 'gradient', opacity: 0 });
    const missing = model(config, 80, {}, { status: 'ready', presets: {} });
    expect(missing.appearance.target_above.paint).toMatchObject({ fill_style: 'solid', opacity: 0 });
    expect(missing.appearance.target_above.diagnostics).not.toHaveLength(0);
    expect(missing.layer.paintStyle).not.toContain('#ffffff');
  });
});

describe('Above Target Stage 1 geometry', () => {
  const paint = { ...registry.presets.warm, opacity: 40 };
  for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
    it(`keeps full-Scale Paint and semantic clipping: Scale ${scaleDirection}, Bar ${barDirection}`, () => {
      const result = model({ scale: { direction: scaleDirection }, bar: { direction: barDirection },
        target: { at: 60, when_above: { paint } } });
      expect(result.layer.visible).toBe(true);
      expect(result.layer.paintStyle).toContain(compilePaint(result.appearance.target_above.paint,
        { minValue: 0, maxValue: 100, scaleDirection, samplePercent: 80 }).gradient);
      expect(result.layer.paintStyle).toContain('background-size:100% 100%');
      expect(result.layer.paintStyle).toContain('opacity:0.4');
      expect(result.layer.revealStyle).toContain(scaleDirection === 'normal' ? 'inset(0 0% 0 60%' : 'inset(0 60% 0 0%');
      expect(result.bar.fill.paintLayers[0].paintStyle).not.toContain('opacity:0.4');
    });
  }

  it('activates Needle Paint only above the threshold and clips it to the current value', () => {
    const target = { at: 60, when_above: { paint } };
    for (const value of [40, 60]) expect(model({ target, baseline: { at: 90 } }, value).layer.visible).toBe(false);
    const low = model({ target, bar: { needle: true } }, 20);
    const equal = model({ target, bar: { needle: true } }, 60);
    const high = model({ target, bar: { needle: true } }, 80);
    expect(low.layer.visible).toBe(false); expect(equal.layer.visible).toBe(false);
    expect(high.layer.visible).toBe(true);
    expect(high.layer.revealStyle).toContain('inset(0 20% 0 60%');
    expect(low.row.needle.pct).not.toBe(high.row.needle.pct);
  });

  it.each([
    ['normal', 80, 'inset(0 20% 0 60%'],
    ['reverse', 80, 'inset(0 60% 0 20%'],
  ])('clips Needle violations to threshold/value on %s Scale and preserves legacy inputs', (scaleDirection, value, clip) => {
    const canonical = model({ scale: { direction: scaleDirection }, bar: { needle: true },
      target: { at: 60, when_above: { paint } } }, value);
    expect(canonical.layer.visible).toBe(true);
    expect(canonical.layer.revealStyle).toContain(clip);

    const legacy = model({ scale: { direction: scaleDirection }, bar: { needle: true },
      target: { at: 60, when_exceeded: { fill_color: 'red' } } }, value);
    expect(legacy.layer.visible).toBe(true);
    expect(legacy.layer.revealStyle).toContain(clip);
    expect(legacy.layer.paintStyle).toContain('red');
    const legacyColor = model({ scale: { direction: scaleDirection }, bar: { needle: true },
      target: { at: 60 }, above_target_color: 'purple' }, value);
    expect(legacyColor.layer.visible).toBe(true);
    expect(legacyColor.layer.revealStyle).toContain(clip);
    expect(legacyColor.layer.paintStyle).toContain('purple');
    expect(model({ bar: { needle: true }, target: { at: 60, when_exceeded: { fill_color: 'red' } } }, 60).layer.visible).toBe(false);
    expect(model({ bar: { needle: true }, target: { at: 60 }, above_target_color: 'purple' }, 60).layer.visible).toBe(false);
  });

  it('retains legacy Baseline-crossing compatibility only for Fill mode', () => {
    const target = { at: 60, when_exceeded: { fill_color: 'red' } };
    expect(model({ baseline: { at: 90 }, target }, 40).layer.visible).toBe(true);
    expect(model({ target, bar: { needle: true } }, 40).layer.visible).toBe(false);
  });

  it('samples solid fill from Target Paint at the semantic value, independent of Scale direction', () => {
    for (const direction of ['normal', 'reverse']) {
      const result = model({ scale: { direction }, target: { at: 60, when_above: { paint: { ...paint, solid_fill: true } } } });
      expect(result.layer.paintStyle).toContain('rgb(204,204,204)');
    }
  });

  it('keeps canonical paint independent of marker visibility and preserves legacy disabled-marker behavior', () => {
    const canonical = model({ target: { enabled: false, at: 60, when_above: { paint } } });
    expect(canonical.layer.visible).toBe(true);
    expect(canonical.row.markers.find(marker => marker.type === 'target').visible).toBe(false);
    expect(model({ target: { enabled: false, at: 60, when_exceeded: { fill_color: 'red' } } }).layer.visible).toBe(false);
    const mixed = model({ target: { enabled: false, at: 60, when_exceeded: { fill_color: 'red' },
      when_below: { paint: { color: 'blue' } } } }, 20);
    expect(mixed.layer.visible).toBe(false);
    expect(mixed.bar.fill.paintLayers.find(layer => layer.id === 'below-target').visible).toBe(true);
  });

  it('uses only the shared source and its own fallbacks, clearing unavailable paint and recovering', () => {
    const config = { target: { at: { entity: { id: 'sensor.goal', attribute: 'limit' }, fixed: 60 }, when_above: { paint } } };
    expect(model(config).layer.visible).toBe(true);
    expect(model(config, 80, { 'sensor.goal': { state: '10', attributes: { limit: 90 } } }).layer.visible).toBe(false);
    const unavailable = { target: { at: { entity: 'sensor.goal' }, when_above: { paint } } };
    expect(model(unavailable).layer.visible).toBe(false);
    expect(model(unavailable, 80, { 'sensor.goal': { state: '60', attributes: {} } }).layer.visible).toBe(true);
  });
});

for (const source of ['src', 'dist']) for (const host of ['editor', 'featureEditor']) {
  it(`${host}/${source} promotes released Target companions and edits only destination-local Paint`, () => {
    const Editor = loadCardClass({ source })[host], editor = new Editor();
    editor.setConfig({ entity, target: 50, target_entity: 'sensor.goal', above_target_color: 'red', future: true });
    const context = editor._createSectionContext(), scope = { type: 'card' };
    setDestinationProperty(context, scope, TARGET_ABOVE_PAINT, 'color', '#123456');
    const config = () => editor._draftConfig ?? editor._config;
    expect(config().target).toEqual({ at: { fixed: 50, entity: 'sensor.goal' }, when_above: { paint: { color: '#123456' } } });
    expect(config().above_target_color).toBeUndefined();
    setDestinationEnabled(context, scope, TARGET_ABOVE_PAINT, false);
    expect(config().target.when_above.paint).toBeNull();
    resetDestinationPaint(context, scope, TARGET_ABOVE_PAINT);
    expect(config().target).toEqual({ at: { fixed: 50, entity: 'sensor.goal' } });
    expect(config().future).toBe(true);
  });
}
