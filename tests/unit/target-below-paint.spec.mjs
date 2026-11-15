import { describe, expect, it } from 'vitest';
import { normalizeCardConfig, PAINT_PROPERTY_SOURCES, BAR_PAINT_DIAGNOSTICS } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel } from '../../src/view-model/bar-render-model.js';
import { TARGET_BELOW_PAINT, resolveConfiguredDestination } from '../../src/view-model/paint-destinations.js';
import { compilePaint } from '../../src/view-model/paint-compiler.js';

const entity = 'sensor.power';
const registry = { status: 'ready', presets: { warm: { fill_style: 'gradient', opacity: 35,
  gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] } } };

function model(config, value = 20, presets = registry) {
  const card = normalizeCardConfig({ entities: [{ entity }], ...config });
  const appearance = { ...card.entities[0], target_below: resolveConfiguredDestination(card.entities[0], card, TARGET_BELOW_PAINT, presets) };
  const state = { state: String(value), attributes: {} };
  const row = buildRowViewModel({ entityConfig: appearance, entityState: state, hass: { states: { [entity]: state } } });
  const bar = buildBarRenderModel(row, appearance, { height: 30 });
  return { card, appearance, row, bar, layer: bar.fill.paintLayers.find(layer => layer.id === 'below-target') };
}

describe('Below Target Stage 2 destination and runtime', () => {
  it('keeps absence, disable, empty enable, same-destination inheritance and marker count distinct', () => {
    const absent = model({ target: { at: 40 } });
    expect(absent.appearance.target_below.paint).toBeUndefined();
    expect(absent.layer.visible).toBe(false);
    const enabled = model({ target: { at: 40, when_below: { paint: {} } } });
    expect(enabled.appearance.target_below.paint).toMatchObject({ fill_style: 'solid', opacity: 100 });
    expect(enabled.appearance.target_below.paint.color).toBe('var(--accent-color, #4a9eff)');
    expect(enabled.card.entities[0].target_below.paint[PAINT_PROPERTY_SOURCES]).toBeDefined();
    expect(enabled.row.markers.filter(marker => marker.type === 'target')).toHaveLength(1);
    expect(model({ target: { at: 40, when_below: { paint: null } } }).layer.visible).toBe(false);
    const inherited = model({ target: { at: 40, when_below: { paint: { color: 'red' } } },
      entities: [{ entity, target: { when_below: { paint: { opacity: 25 } } } }] });
    expect(inherited.appearance.target_below.paint).toMatchObject({ color: 'red', opacity: 25 });
  });

  it('uses only Below Paint and resolves presets with independent opacity', () => {
    const card = normalizeCardConfig({ target: { at: 40, when_above: { paint: { color: 'blue' } },
      when_below: { paint: { preset: 'warm' } } }, entities: [{ entity }] });
    const below = resolveConfiguredDestination(card.entities[0], card, TARGET_BELOW_PAINT, registry).paint;
    expect(below).toMatchObject({ fill_style: 'gradient', opacity: 35 });
    const local = normalizeCardConfig({ target: { at: 40, when_below: { paint: { preset: 'warm' } } },
      entities: [{ entity, target: { when_below: { paint: { opacity: 0 } } } }] });
    const resolved = resolveConfiguredDestination(local.entities[0], local, TARGET_BELOW_PAINT, registry).paint;
    expect(resolved).toMatchObject({ fill_style: 'gradient', opacity: 0 });
    expect(resolved.color).not.toBe('blue');
  });

  it('value-gates Fill below the shared threshold and clips to the lower numerical region', () => {
    const config = { target: { at: 40, when_below: { paint: { fill_style: 'gradient', opacity: 40,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] } } } };
    const below = model(config, 20);
    expect(below.layer.visible).toBe(true);
    expect(below.layer.revealStyle).toContain('inset(0 60% 0 0%');
    expect(below.layer.paintStyle).toContain(compilePaint(below.appearance.target_below.paint,
      { minValue: 0, maxValue: 100, samplePercent: 20 }).gradient);
    expect(below.layer.paintStyle).toContain('background-size:100% 100%');
    expect(below.layer.paintStyle).toContain('opacity:0.4');
    expect(model(config, 40).layer.visible).toBe(false);
    expect(model(config, 70).layer.visible).toBe(false);
  });

  it('keeps the numerical lower interval permanent in Needle mode, even when the marker is hidden', () => {
    const config = { bar: { needle: true }, target: { enabled: false, at: 40,
      when_below: { paint: { fill_style: 'gradient', gradient_stops: [{ pos: 0, color: 'black' }, { pos: 100, color: 'white' }] } } } };
    const low = model(config, 10), high = model(config, 90);
    expect(low.layer.visible).toBe(true);
    expect(high.layer.visible).toBe(true);
    expect(low.layer.revealStyle).toBe(high.layer.revealStyle);
    expect(low.layer.revealStyle).toContain('inset(0 60% 0 0%');
    expect(low.row.markers.find(marker => marker.type === 'target').visible).toBe(false);
  });

  it('projects lower Scale intervals in reversed direction and keeps the shared threshold', () => {
    const config = { scale: { direction: 'reverse' }, target: { at: 40, when_below: { paint: { color: 'red' } } } };
    const result = model(config, 20);
    expect(result.layer.visible).toBe(true);
    expect(result.layer.revealStyle).toContain('inset(0 0% 0 60%');
    expect(result.row.markers.filter(marker => marker.type === 'target')).toHaveLength(1);
  });

  it('retains property recovery diagnostics on the Below destination', () => {
    const card = normalizeCardConfig({ target: { at: 40, when_below: { paint: { color: 'red', opacity: 140 } } },
      entities: [{ entity }] });
    expect(card.target_below[BAR_PAINT_DIAGNOSTICS]).toContainEqual(expect.objectContaining({ kind: 'invalid', property: 'opacity' }));
    expect(validateNormalizedConfig(card).warnings).toContainEqual(expect.objectContaining({
      code: 'paint.invalid_value', path: expect.stringContaining('target.when_below.paint.opacity'),
    }));
    expect(card.entities[0].target_below.paint.opacity).toBe(100);
  });
});
