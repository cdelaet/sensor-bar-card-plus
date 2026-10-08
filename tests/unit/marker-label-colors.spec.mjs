import { describe, expect, it } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { getEffectiveMarkerColor } from '../../src/view-model/bar-render-model.js';
import { renderMarker } from '../../src/render/bar-renderer.js';

for (const source of ['src', 'dist']) describe(`marker label effective color (${source})`, () => {
  for (const color of [undefined, 'red', '#ff8800', 'rgb(10, 120, 200)', 'var(--some-theme-color)']) it(`uses the same normalized marker model for labels and glyphs: ${color ?? 'default'}`, () => {
    const paint = color === undefined ? {} : { color };
    const label = { show: true, text: 'Label' };
    const entityConfig = normalizeCardConfig({ entities: ['sensor.power'], target: { at: 20, ...paint, label },
      peak: { enabled: true, ...paint, label }, floor: { enabled: true, ...paint, label },
      markers: [{ at: 80, lane: 'above', show_marker: false, ...paint, label }] }).entities[0];
    const row = buildRowViewModel({ entityConfig, entityState: { state: '50', attributes: { unit_of_measurement: 'W' } },
      extrema: { peak: { value: 75 }, floor: { value: 25 } } });
    const classes = loadCardClass({ source }), card = new classes.card(), feature = new classes.feature();
    feature._labels = { hidden: false };
    for (const marker of row.markers) feature._labelNodes.set(marker.id, { dataset: {}, style: {} });
    feature._syncLabels(row, null);
    for (const marker of row.markers) {
      const expected = getEffectiveMarkerColor(marker);
      expect(feature._labelNodes.get(marker.id).style['--marker-color']).toBe(expected);
      expect(card._getMarkerLabelColorStyle(marker)).toContain(`--marker-color:${expected};`);
      expect(renderMarker(marker)).toContain(`--marker-color:${expected};`);
      if (color !== undefined) expect(expected).toBe(color);
    }
  });
  it('uses the shared null-color fallback even for a label-only marker', () => {
    const classes = loadCardClass({ source }), feature = new classes.feature(), card = new classes.card();
    const marker = { id: 'generic-0', type: 'generic', color: null, labelVisible: true, showMarker: false, lane: 'below' };
    feature._labels = { hidden: false };
    feature._labelNodes.set(marker.id, { dataset: {}, style: {} });
    feature._syncLabels({ markers: [marker], markerLabelLaneOccupancy: { below: true } }, null);
    expect(feature._labelNodes.get(marker.id).style['--marker-color']).toBe(card._getEffectiveMarkerColor(marker));
  });
});
