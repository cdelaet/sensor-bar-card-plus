import { describe, expect, it } from 'vitest';
import { normalizeCardConfig, PAINT_PROPERTY_SOURCES } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { getFillPaintLayers } from '../../src/view-model/bar-render-model.js';
import { resolveTargetPaints } from '../../src/view-model/target-paint-resolver.js';
import { createCard } from '../support/load-card-class.cjs';

const hass = states => ({ states });

describe('directional Target source and marker semantics', () => {
  it('preserves Paint ownership and omitted, null, empty, and legacy scalar Target states through normalization', () => {
    const omitted = normalizeCardConfig({ target: { at: 50 }, entities: [{ entity: 'sensor.omitted' }] });
    const disabled = normalizeCardConfig({ target: { at: 50, when_above: { paint: null } }, entities: [{ entity: 'sensor.disabled' }] });
    const empty = normalizeCardConfig({ target: { at: 50, when_above: { paint: {} } }, entities: [{ entity: 'sensor.empty' }] });
    const directional = normalizeCardConfig({ target: { at: 60, when_above: { paint: { preset: 'warm' } } }, entities: [
      { entity: 'sensor.local', target: { when_above: { at: 75, paint: { opacity: 60 } } } },
    ] });

    expect(omitted.target_directions.above).not.toHaveProperty('paint');
    expect(disabled.target_directions.above.paint).toBe(null);
    expect(empty.target_directions.above.paint).toMatchObject({ fill_style: 'solid', opacity: 100 });
    expect(empty.target_directions.above.paint[PAINT_PROPERTY_SOURCES]).toBeDefined();
    expect(directional.entities[0].target).toBe(60);
    expect(directional.entities[0].target_directions.above).toMatchObject({
      source: { fixed: 75 }, paint: { preset: 'warm', opacity: 60 },
    });
    const resolved = resolveTargetPaints(directional.entities[0], directional, { status: 'ready', presets: {
      warm: { fill_style: 'gradient', color: '#112233', opacity: 35 },
    } });
    expect(resolved.paints.above).toMatchObject({ fill_style: 'gradient', color: '#112233', opacity: 60 });
  });

  it('selects directional, local shared, card directional, then card shared sources without merging', () => {
    const card = normalizeCardConfig({ target: { at: 40, when_above: { at: 80 }, when_below: { at: 10 } }, entities: [
      { entity: 'sensor.a' },
      { entity: 'sensor.b', target: { at: 50 } },
      { entity: 'sensor.c', target: { when_above: { at: { entity: 'sensor.limit', fixed: 30 } } } },
    ] });
    expect(card.entities[0].target_directions.above.source.fixed).toBe(80);
    expect(card.entities[0].target_directions.below.source.fixed).toBe(10);
    expect(card.entities[1].target_directions.above.source.fixed).toBe(50);
    expect(card.entities[1].target_directions.below.source.fixed).toBe(50);
    expect(card.entities[2].target_directions.above.source).toMatchObject({ entity: 'sensor.limit', fixed: 30 });
    expect(card.entities[2].target_directions.below.source.fixed).toBe(10);
  });

  it('keeps unavailable selected sources on their own fixed and percentage fallbacks', () => {
    const normalized = normalizeCardConfig({ target: { at: 50,
      when_above: { at: { entity: 'sensor.missing', fixed: 70, percent: 25 } } }, entities: [{ entity: 'sensor.a' }] });
    const vm = buildRowViewModel({ hass: hass({ 'sensor.a': { state: '80', attributes: {} } }),
      entityConfig: normalized.entities[0], entityState: { state: '80', attributes: {} } });
    expect(vm.targetAboveValue).toBe(70);
    expect(vm.targetBelowValue).toBe(50);
  });

  it('uses independent directional markers and collapses a shared threshold to one marker', () => {
    const shared = normalizeCardConfig({ target: { at: 50, when_above: { marker: { color: 'red' } },
      when_below: { marker: { color: 'blue' } } }, entities: [{ entity: 'sensor.a' }] });
    const sharedVm = buildRowViewModel({ hass: hass({ 'sensor.a': { state: '80', attributes: {} } }),
      entityConfig: shared.entities[0], entityState: { state: '80', attributes: {} } });
    expect(sharedVm.markers.filter(marker => marker.type === 'target')).toHaveLength(1);
    expect(sharedVm.markers.find(marker => marker.type === 'target').color).toBe('red');

    const distinct = normalizeCardConfig({ target: { when_above: { at: 80, marker: { color: 'red' } },
      when_below: { at: 20, marker: { color: 'blue' } } }, entities: [{ entity: 'sensor.a' }] });
    const distinctVm = buildRowViewModel({ hass: hass({ 'sensor.a': { state: '50', attributes: {} } }),
      entityConfig: distinct.entities[0], entityState: { state: '50', attributes: {} } });
    expect(distinctVm.markers.filter(marker => marker.type === 'target').map(marker => [marker.id, marker.color]))
      .toEqual([['target-above', 'red'], ['target-below', 'blue']]);
  });

  it('flags invalid lower/upper ordering while retaining both markers', () => {
    const normalized = normalizeCardConfig({ target: { when_above: { at: 20 }, when_below: { at: 70 } }, entities: [{ entity: 'sensor.a' }] });
    const vm = buildRowViewModel({ hass: hass({ 'sensor.a': { state: '50', attributes: {} } }),
      entityConfig: normalized.entities[0], entityState: { state: '50', attributes: {} } });
    expect(vm.targetOrderingInvalid).toBe(true);
    expect(vm.markers.filter(marker => marker.type === 'target')).toHaveLength(2);
  });

  it('emits a structured ordering warning and clears it when the thresholds recover', () => {
    const card = createCard();
    const hassState = { state: '50', attributes: {} };
    card._hass.states['sensor.a'] = hassState;
    card._baseDiagnostics = { warnings: [], errors: [] };
    card._logDiagnostics = () => {};
    card._config = normalizeCardConfig({ target: { when_above: { at: 20 }, when_below: { at: 70 } },
      entities: [{ entity: 'sensor.a' }] });

    let entity = card._config.entities[0];
    expect(card._buildRowViewModel(entity, card._resolve(entity), hassState).targetOrderingInvalid).toBe(true);
    expect(card._diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'target.invalid_ordering', path: 'entities.sensor.a.target', entity: 'sensor.a',
    }));

    card._config = normalizeCardConfig({ target: { when_above: { at: 80 }, when_below: { at: 20 } },
      entities: [{ entity: 'sensor.a' }] });
    entity = card._config.entities[0];
    expect(card._buildRowViewModel(entity, card._resolve(entity), hassState).targetOrderingInvalid).toBe(false);
    expect(card._diagnostics.warnings).not.toContainEqual(expect.objectContaining({ code: 'target.invalid_ordering' }));
  });
});

describe('Target paint geometry', () => {
  const paint = { bar: { paint: { fill_style: 'solid', color: '#000000' } }, target_paints: {
    above: { fill_style: 'solid', color: '#ff0000', opacity: 50 },
    below: { fill_style: 'solid', color: '#0000ff', opacity: 40 },
  } };

  it('gates Fill layers by numerical violation and clips them to occupied fill under reverse Scale', () => {
    const layers = getFillPaintLayers({ start: 20, end: 80, hidden: false }, 30, paint, '#000000', null, null,
      0, 100, 'reverse', 70, { above: 60, below: 30 });
    expect(layers.find(layer => layer.id === 'target-above')).toMatchObject({ visible: true, zIndex: 2 });
    expect(layers.find(layer => layer.id === 'target-above').revealStyle).toContain('inset(0 60% 0 20%');
    expect(layers.find(layer => layer.id === 'target-below').visible).toBe(false);
    const below = getFillPaintLayers({ start: 20, end: 80, hidden: false }, 30, paint, '#000000', null, null,
      0, 100, 'normal', 20, { above: 60, below: 30 }).find(layer => layer.id === 'target-below');
    expect(below.visible).toBe(true);
    expect(below.revealStyle).toContain('inset(0 70% 0 20%');
  });

  it('keeps Needle regions permanent, suppresses both on invalid ordering, and clips full Scale paint at each destination', () => {
    const layers = getFillPaintLayers({ start: 0, end: 100, hidden: false }, 30, paint, '#000000', null, null,
      0, 100, 'normal', 40, { above: 60, below: 30 }, true);
    expect(layers.find(layer => layer.id === 'target-above').visible).toBe(true);
    expect(layers.find(layer => layer.id === 'target-below').visible).toBe(true);
    expect(layers.find(layer => layer.id === 'target-above').paintStyle).toContain('background-size:100% 100%');
    const invalid = getFillPaintLayers({ start: 0, end: 100, hidden: false }, 30, paint, '#000000', null, null,
      0, 100, 'normal', 40, { above: 20, below: 70, orderingInvalid: true }, true);
    expect(invalid.find(layer => layer.id === 'target-above').visible).toBe(false);
    expect(invalid.find(layer => layer.id === 'target-below').visible).toBe(false);
    expect(invalid.find(layer => layer.id === 'base').visible).toBe(true);
  });

  it('preserves the released legacy upper overlay without a current-value violation gate', () => {
    const legacy = { ...paint, target_paints: { above: paint.target_paints.above }, target_paints_legacy_above: true,
      bar: { above_target_color: 'red' } };
    const layer = getFillPaintLayers({ start: 0, end: 40, hidden: false }, 30, legacy, '#000000', 60, null,
      0, 100, 'normal', 40, { above: 60 }) .find(item => item.id === 'target-above');
    expect(layer.visible).toBe(true);
    expect(layer.revealStyle).toContain('inset(0 0% 0 60%');
  });

  it('resolves matching Target destinations and legacy upper aliases without Bar Paint fallback', () => {
    const config = { above_target_color: '#ff0000', bar: { paint: { color: '#0000ff' } } };
    const result = resolveTargetPaints(config, null, { status: 'ready', presets: {} });
    expect(result.paints.above.color).toBe('#ff0000');
    expect(result.paints).not.toHaveProperty('below');
    expect(result.legacyUpper).toBe(true);
    const preset = resolveTargetPaints({ target: { when_above: { paint: { preset: 'cool' } } } }, null,
      { status: 'ready', presets: { cool: { fill_style: 'solid', color: '#123456' } } });
    expect(preset.paints.above.color).toBe('#123456');
  });
});
