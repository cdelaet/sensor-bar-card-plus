import { describe, expect, it } from 'vitest';
import { getFeatureLabelGeometry, layoutFeatureMarkerLabels } from '../../src/feature/marker-label-layout.js';
import { createMarkerLabelPresentation } from '../../src/utils/format.js';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';

const measure = text => Array.from(text).reduce((width, character) => width + (character === 'W' ? 7 : 4), 0);
const marker = (id, position, label = createMarkerLabelPresentation(25, 'W', 1, { text: 'Low' }), extra = {}) => ({
  id, position, lane: 'above', visible: true, labelVisible: true, label, ...extra,
});
const layout = (markers, width) => layoutFeatureMarkerLabels(markers, width, measure);

describe('fixed feature label geometry', () => {
  for (const height of [42, 36]) {
    for (const occupancy of [{}, { above: true }, { below: true }, { above: true, below: true }]) {
      it(`${height}px with lanes ${JSON.stringify(occupancy)}`, () => {
        const result = getFeatureLabelGeometry(height, occupancy);
        const above = occupancy.above ? 10 : 0;
        const below = occupancy.below ? 10 : 0;
        expect(result).toEqual({ above, below, railHeight: height - above - below,
          aboveY: 0, belowY: height - 9, compactGlyphs: Boolean(occupancy.above && occupancy.below) });
      });
    }
  }
  it('reserves configured lanes through unavailable independent label content', () => {
    const entityConfig = normalizeCardConfig({ entity: 'sensor.power', markers: [
      { at: 25, lane: 'above', label: { show: true, entity: 'sensor.label' } },
      { at: 75, lane: 'below', label: { show: true, entity: 'sensor.label' } },
    ] }).entities[0];
    for (const value of ['unknown', 'unavailable', '99.9']) {
      const hass = { states: { 'sensor.power': { state: '50', attributes: {} }, 'sensor.label': { state: value, attributes: {} } } };
      const row = buildRowViewModel({ hass, entityConfig, entityState: hass.states['sensor.power'] });
      expect(getFeatureLabelGeometry(36, row.markerLabelLaneOccupancy).railHeight).toBe(16);
      expect(layout(row.markers, 200)).toHaveLength(value === '99.9' ? 2 : 0);
    }
  });
});

describe('compact horizontal slots', () => {
  it('ignores hidden, unresolved, empty and unconfigured labels', () => {
    expect(layout([
      marker('invisible', 50, undefined, { visible: false }),
      marker('unresolved', null), marker('disabled', 50, undefined, { labelVisible: false }),
      marker('empty', 50, createMarkerLabelPresentation(null, '', null)),
    ], 200)).toEqual([]);
  });
  it('clamps endpoints without changing anchors and accepts label-only markers', () => {
    const markers = [marker('left', 0, undefined, { showMarker: false }), marker('right', 100)];
    const labels = layout(markers, 200);
    expect(labels[0].left).toBe(0);
    expect(labels[1].left + labels[1].width).toBe(200);
    expect(markers.map(item => item.position)).toEqual([0, 100]);
    expect(labels.every(item => item.mode === 'full')).toBe(true);
  });
  it('uses midpoint slots, a 4px separation, stable physical ordering and independent lanes', () => {
    const labels = layout([marker('right', 75), marker('left', 25), marker('below', 25, undefined, { lane: 'below' })], 120);
    expect(labels.map(item => item.id)).toEqual(['left', 'right', 'below']);
    expect(labels[0].left + labels[0].width).toBeLessThanOrEqual(58);
    expect(labels[1].left).toBeGreaterThanOrEqual(62);
    expect(labels[2].mode).toBe('full');
  });
  it('suppresses crowded coincident and clustered labels deterministically', () => {
    const markers = [marker('a', 50), marker('b', 50), marker('c', 50), marker('d', 51)];
    const labels = layout(markers, 100);
    expect(labels.map(item => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(labels.slice(1, 3).map(item => item.mode)).toEqual(['hidden', 'hidden']);
    const visible = labels.filter(item => item.mode !== 'hidden');
    for (let index = 1; index < visible.length; index++) {
      expect(visible[index].left).toBeGreaterThanOrEqual(visible[index - 1].left + visible[index - 1].width + 4);
    }
    expect(layout(markers, 100)).toEqual(labels);
  });
  it('degrades full → configured value/unit → hidden without rounding or losing units', () => {
    const label = createMarkerLabelPresentation(99.9, 'W', 2, { text: 'Energy Target' });
    const size = measure(label.number + ' W') + 4;
    expect(layout([marker('a', 50, label)], 200)[0]).toMatchObject({ mode: 'full', text: label.text });
    expect(layout([marker('a', 50, label)], size)[0]).toMatchObject({ mode: 'value', text: `${label.number} W` });
    expect(layout([marker('a', 50, label)], size - 1)[0].mode).toBe('hidden');
    expect(layout([marker('a', 50, label)], 0)[0].mode).toBe('hidden');
  });
  it.each([
    { showValue: false, showUnit: true, expected: 'W' },
    { showValue: true, showUnit: false, expected: '25.0' },
    { showValue: false, showUnit: false, expected: 'Ene…' },
  ])('does not invent disabled components: %j', ({ showValue, showUnit, expected }) => {
    const label = createMarkerLabelPresentation(25, 'W', 1, { text: 'Energy', showValue, showUnit });
    const result = layout([marker('a', 50, label)], measure(expected) + 4)[0];
    expect(result.text).toBe(expected.replace('25.0', label.number));
    expect(result.mode).toBe(showValue || showUnit ? 'value' : 'text');
  });
  it('ellipsizes text-only labels only when a useful measured prefix fits', () => {
    const label = createMarkerLabelPresentation(null, '', null, { text: 'Target', showValue: false, showUnit: false });
    expect(layout([marker('a', 50, label)], 20)[0]).toMatchObject({ mode: 'text', text: 'Tar…' });
    expect(layout([marker('a', 50, label)], 19)[0].mode).toBe('hidden');
  });
  it('uses supplied measurement, including different widths for equally long strings', () => {
    const labels = ['WWW', 'iii'].map(text => marker(text, 50, createMarkerLabelPresentation(null, '', null, { text })));
    expect(layout([labels[0]], 20)[0].mode).toBe('hidden');
    expect(layout([labels[1]], 20)[0].mode).toBe('full');
  });
  it('reuses independent numeric/text values and units without changing anchor semantics', () => {
    const entityConfig = normalizeCardConfig({ entity: 'sensor.power', markers: [
      { at: 25, show_marker: false, label: { show: true, entity: 'sensor.label', text: 'Energy', precision: 2 } },
    ] }).entities[0];
    for (const value of ['99.9', 'Charging']) {
      const hass = { states: { 'sensor.power': { state: '50', attributes: { unit_of_measurement: 'W' } },
        'sensor.label': { state: value, attributes: { unit_of_measurement: 'kWh' } } } };
      const row = buildRowViewModel({ hass, entityConfig, entityState: hass.states['sensor.power'] });
      const reference = row.markers.find(item => item.type === 'generic');
      expect(reference).toMatchObject({ value: 25, position: 25, showMarker: false });
      const result = layout(row.markers, 200)[0];
      expect(result.text).toBe(reference.label.text);
      expect(result.text).toContain('kWh');
      expect(result.text).toContain(value === 'Charging' ? value : reference.label.number);
    }
  });
});
