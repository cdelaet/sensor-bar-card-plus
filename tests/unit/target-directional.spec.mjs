import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel } from '../../src/view-model/bar-render-model.js';
import { createMarkerLabelPresentation } from '../../src/utils/format.js';
import { getTargetSourceEntities } from '../../src/config/directional-targets.js';

const entity = 'sensor.power';
function fixture(target = {}, local, states = {}, options = {}) {
  const config = normalizeCardConfig({ entities: [{ entity, ...(local ? { target: local } : {}) }], target, ...options });
  const state = { state: '90', attributes: { unit_of_measurement: 'W' } };
  const appearance = config.entities[0];
  const hass = { states: { [entity]: state, ...states } };
  const row = buildRowViewModel({ entityConfig: appearance, entityState: state, hass });
  return { config, appearance, row, bar: buildBarRenderModel(row, appearance, { height: 30 }) };
}

describe('Stage 3 directional source contract', () => {
  it.each(['above', 'below'])('selects all four precedence levels for %s', side => {
    const key = `when_${side}`;
    const target = { at: 11, [key]: { at: 22 } };
    expect(fixture({ at: 11 }).appearance.target_directions[side].source.fixed).toBe(11);
    expect(fixture(target).appearance.target_directions[side].source.fixed).toBe(22);
    expect(fixture(target, { at: 33 }).appearance.target_directions[side].source.fixed).toBe(33);
    expect(fixture(target, { at: 33, [key]: { at: 44 } }).appearance.target_directions[side].source.fixed).toBe(44);
    expect(fixture(target, { [key]: { at: null } }).appearance.target_directions[side].source).toEqual({ fixed: null, entity: null });
  });

  it.each(['above', 'below'])('replaces whole sources and uses only the selected %s fallbacks', side => {
    const key = `when_${side}`;
    const target = { at: 70, [key]: { at: { entity: 'sensor.parent', fixed: 60, percent: 50 } } };
    const local = { [key]: { at: 'sensor.local' } };
    const unavailable = fixture(target, local);
    expect(unavailable.appearance.target_directions[side].source).toEqual({ fixed: null, entity: 'sensor.local' });
    expect(unavailable.row.markers.find(marker => marker.id === (side === 'above' ? 'target' : 'target-below')).visible).toBe(false);
    expect(getTargetSourceEntities(unavailable.appearance)).toContain('sensor.local');
    expect(getTargetSourceEntities(unavailable.appearance)).not.toContain('sensor.parent');
    for (const [at, expected] of [[{ entity: 'sensor.missing', fixed: 25, percent: 50 }, 25],
      [{ entity: 'sensor.missing', percent: 25 }, 25], ['25%', 25],
      [{ entity: { id: 'sensor.local', attribute: 'limit' }, fixed: 55 }, 80]]) {
      const result = fixture({}, { [key]: { at } }, { 'sensor.local': { state: '10', attributes: { limit: 80 } } });
      expect(result.row.markers.find(marker => marker.type === 'target').value).toBe(expected);
    }
  });

  it('replaces a Card source with Entity shared source without retaining any fallback', () => {
    const result = fixture({ at: { entity: 'sensor.parent', fixed: 80 } }, { at: 'sensor.local' });
    expect(result.appearance.target_directions.above.source).toEqual({ entity: 'sensor.local', fixed: null });
    expect(result.row.markers[0].visible).toBe(false);
    expect(result.row.markerLaneOccupancy.below).toBe(true);
  });

  it('inherits marker properties independently and formats the independent labels', () => {
    const { row } = fixture({ at: 50, color: 'red', label: { show: true, text: 'Shared', precision: 1 },
      when_above: { at: 80, marker: { color: 'blue', shape: 'triangle', label: { text: 'Upper' } } },
      when_below: { at: 20, marker: { label: { text: 'Lower', show_unit: false } } } },
    { color: 'green', when_below: { marker: { label: { precision: 2 } } } });
    expect(row.markers[0]).toMatchObject({ color: 'green', shape: 'triangle', label: { text: createMarkerLabelPresentation(80, 'W', 1, { text: 'Upper' }).text } });
    expect(row.markers[1]).toMatchObject({ color: 'green', label: { text: createMarkerLabelPresentation(20, 'W', 2, { text: 'Lower', showUnit: false }).text } });
    expect(row.markerLaneOccupancy.below).toBe(true);
    expect(row.markerLabelLaneOccupancy.below).toBe(true);
  });

  it('prefers upper on coincidence and lower if upper is disabled', () => {
    const target = { when_above: { at: 50, marker: { color: 'red', label: { show: true, text: 'Upper' } } },
      when_below: { at: { fixed: 50 }, marker: { color: 'blue' } } };
    expect(fixture(target).row.markers.filter(marker => marker.type === 'target')).toMatchObject([{ id: 'target', color: 'red' }]);
    target.when_above.marker.enabled = false;
    expect(fixture(target).row.markers.filter(marker => marker.type === 'target')).toMatchObject([{ id: 'target-below', color: 'blue' }]);
  });

  it('reserves directional-only and unresolved label lanes independently of Paint', () => {
    const result = fixture({ when_below: { at: 'sensor.missing', marker: { label: { show: true, text: 'Low' } }, paint: null } });
    expect(result.row.markers[0]).toMatchObject({ id: 'target-below', visible: false, labelVisible: true });
    expect(result.row.markerLaneOccupancy).toEqual({ above: false, below: true });
    expect(result.row.markerLabelLaneOccupancy).toEqual({ above: false, below: true });
    const disabled = fixture({ when_below: { at: 20, marker: { enabled: false, label: { show: true } } } });
    expect(disabled.row.markerLaneOccupancy.below).toBe(false);
    expect(disabled.row.markerLabelLaneOccupancy.below).toBe(false);
  });

  it('retains the existing generic-marker capacity with two configured Targets', () => {
    const { appearance } = fixture({ when_above: { at: 80 }, when_below: { at: 20 } }, null, {},
      { markers: [10, 30, 50].map(at => ({ at, lane: 'below' })) });
    expect(appearance.generic_markers.map(marker => marker.accepted)).toEqual([true, true, false]);
  });

  it('diagnoses directional sources, marker labels and directions at canonical paths', () => {
    const { config } = fixture({ when_below: { at: { entity: { id: 'bad' } },
      marker: { direction: 'up', label: { precision: -1, text: 3 } } } });
    const warnings = validateNormalizedConfig(config).warnings;
    expect(warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'source.invalid_entity_source', path: 'card.target.when_below.at' }),
      expect.objectContaining({ code: 'target_marker.invalid_direction', path: 'card.target.when_below.marker.direction' }),
      expect.objectContaining({ code: 'markers.invalid_label_precision', path: 'card.target.when_below.marker.label.precision' }),
    ]));
  });
});

for (const needle of [false, true]) for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
  it(`suppresses both paints for semantic inversion and recovers (${needle}, ${scaleDirection}, ${barDirection})`, () => {
    const target = { when_above: { at: { entity: 'sensor.high', fixed: 80 }, paint: { color: 'red' } },
      when_below: { at: { entity: 'sensor.low', fixed: 20 }, paint: { color: 'blue' } } };
    const options = { bar: { needle, direction: barDirection }, scale: { direction: scaleDirection } };
    const invalid = fixture(target, null, { 'sensor.high': { state: '-30' }, 'sensor.low': { state: '-20' } }, options);
    expect(invalid.row.targetOrderingInvalid).toBe(true); // Both project to the same Scale boundary.
    expect(invalid.row.targetDiagnostics).toMatchObject([{ code: 'target.invalid_ordering', above: -30, below: -20 }]);
    expect(invalid.row.markers.filter(marker => marker.type === 'target' && marker.visible)).toHaveLength(2);
    expect(invalid.bar.fill.paintLayers.filter(layer => layer.id.endsWith('target')).every(layer => !layer.visible)).toBe(true);
    const recovered = fixture(target, null, {}, options);
    expect(recovered.row.targetDiagnostics).toEqual([]);
    expect(recovered.bar.fill.paintLayers.find(layer => layer.id === 'above-target').visible).toBe(true);
  });
}
