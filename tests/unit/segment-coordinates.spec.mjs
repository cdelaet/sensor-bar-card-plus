import { describe, it, expect } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { normalizeBarConfig, normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';

const entity = 'sensor.sbcp_playground_negative';
const negativeSegments = [
  { from: -20, to: -5, color: '#ff2600' },
  { from: -5, to: 5, color: '#000000' },
  { from: 5, to: 20, color: '#0433ff' },
];
const negativeRanges = [[0, 37.5], [37.5, 62.5], [62.5, 100]];
const ranges = (card, row, min, max) => card._getSegmentsForRendering(row, min, max)
  .map(segment => [segment.from, segment.to]);
const negativeConfig = (bar = {}) => ({
  type: 'custom:sensor-bar-card-plus',
  entities: [{
    entity,
    scale: { min: -20, max: 20 },
    bar: { fill_style: 'band_gradient', needle: true, segments: negativeSegments, ...bar },
  }],
});

describe('replacement Segment coordinate semantics (issue #29)', () => {
  it('keeps numeric row Segments on the resolved Scale and preserves the Needle position', () => {
    const card = createCard();
    const row = normalizeCardConfig(negativeConfig()).entities[0];
    expect(row.bar.segments).toEqual(negativeSegments.map(segment => ({
      ...segment,
      from: { fixed: segment.from, entity: null },
      to: { fixed: segment.to, entity: null },
      label: null,
    })));
    expect(ranges(card, row, -20, 20)).toEqual(negativeRanges);
    expect(card._getSeverityInterpolationStops(row, -20, 20)).toEqual([
      { p: 0, r: 255, g: 38, b: 0 },
      { p: 50, r: 0, g: 0, b: 0 },
      { p: 100, r: 4, g: 51, b: 255 },
    ]);
    const entityState = { state: '-19', attributes: {} };
    const model = buildRowViewModel({ entityConfig: row, entityState, hass: { states: { [entity]: entityState } } });
    expect(model).toMatchObject({ min: -20, max: 20, percent: 2.5, needle: { show: true, pct: 2.5 } });
    const explicit = normalizeCardConfig(negativeConfig({ segment_space: 'scale' })).entities[0];
    expect(row.bar.segments).toEqual(explicit.bar.segments);
    expect(card._getBasePaintGradient('#ffffff', row, -20, 20))
      .toBe(card._getBasePaintGradient('#ffffff', explicit, -20, 20));
  });

  for (const [min, max, segments] of [
    [-20, 20, negativeSegments],
    [0, 5000, [
      { from: 0, to: 1875, color: '#ff2600' },
      { from: 1875, to: 3125, color: '#000000' },
      { from: 3125, to: 5000, color: '#0433ff' },
    ]],
  ]) {
    for (const scope of ['card', 'entity']) {
      it.each(['bands', 'soft_bands', 'band_gradient'])(`%s resolves replacement row values on ${scope} Scale ${min}..${max}`, fillStyle => {
        const card = createCard();
        const config = {
          ...(scope === 'card' ? { scale: { min, max } } : {}),
          entities: [{
            entity,
            ...(scope === 'entity' ? { scale: { min, max } } : {}),
            bar: { fill_style: fillStyle, segments },
          }],
        };
        const row = normalizeCardConfig(config).entities[0];
        expect(ranges(card, row, min, max)).toEqual(negativeRanges);
        const explicit = normalizeCardConfig({
          ...config,
          entities: [{ ...config.entities[0], bar: { ...config.entities[0].bar, segment_space: 'scale' } }],
        }).entities[0];
        expect(card._getBasePaintGradient('#ffffff', row, min, max))
          .toBe(card._getBasePaintGradient('#ffffff', explicit, min, max));
      });
    }
  }

  it.each([
    ['default', undefined],
    ['explicit', [{ from: 0, to: 100, color: '#ffffff' }]],
  ])('does not inherit percentage mode from %s severity', (_source, severity) => {
    const card = createCard();
    const config = normalizeCardConfig({ ...negativeConfig(), ...(severity ? { severity } : {}) });
    expect(config.bar.segment_space).toBe('percent');
    expect(ranges(card, config.entities[0], -20, 20)).toEqual(negativeRanges);
  });

  it.each([
    ['percentages', [{ from: '0%', to: '50%', color: '#ff2600' }, { from: '50%', to: '100%', color: '#0433ff' }]],
    ['mixed coordinates', [{ from: -20, to: '50%', color: '#ff2600' }, { from: '50%', to: 20, color: '#0433ff' }]],
  ])('preserves %s in replacement row Segments', (_name, segments) => {
    const card = createCard();
    const row = normalizeCardConfig(negativeConfig({ segments })).entities[0];
    expect(ranges(card, row, -20, 20)).toEqual([[0, 50], [50, 100]]);
  });

  for (const mode of ['percent', 'scale']) {
    const expected = mode === 'percent' ? [[25, 75]] : [[12.5, 37.5]];
    const segments = [{ from: 25, to: 75, color: '#ff2600' }];
    it.each([undefined, mode === 'percent' ? 'scale' : 'percent'])(`preserves explicit local legacy ${mode} mode over inherited %s mode`, inherited => {
      const card = createCard();
      const row = normalizeCardConfig({
        scale: { min: 0, max: 200 },
        ...(inherited ? { bar: { segment_space: inherited } } : {}),
        entities: [{ entity, bar: { segment_space: mode, segments } }],
      }).entities[0];
      expect(ranges(card, row, 0, 200)).toEqual(expected);
    });
    it.each(['default severity', 'explicit severity', 'modern Segments'])(`inherits explicit legacy ${mode} mode from %s`, source => {
      const card = createCard();
      const config = normalizeCardConfig({
        scale: { min: 0, max: 200 },
        ...(source === 'explicit severity' ? { severity: [{ from: 0, to: 100, color: '#ffffff' }] } : {}),
        bar: { segment_space: mode, ...(source === 'modern Segments' ? { segments } : {}) },
        entities: [{ entity, bar: { segments } }],
      });
      expect(ranges(card, config.entities[0], 0, 200)).toEqual(expected);
      // Direct callers with a raw card config must retain the same compatibility mode.
      expect(ranges(card, { bar: normalizeBarConfig({ bar: { segments } }, { bar: { segment_space: mode } }) }, 0, 200))
        .toEqual(expected);
    });
  }

  it('retains inherited card Segments, entity Scale overrides and the row top-level alias', () => {
    const card = createCard();
    const config = normalizeCardConfig({
      scale: { min: 0, max: 100 },
      bar: { segments: negativeSegments },
      entities: [{ entity, scale: { min: -20, max: 20 } }],
    });
    expect(ranges(card, config.entities[0], -20, 20)).toEqual(negativeRanges);
    const alias = normalizeCardConfig({ entities: [{ entity, scale: { min: -20, max: 20 }, segments: negativeSegments }] });
    expect(ranges(card, alias.entities[0], -20, 20)).toEqual(negativeRanges);
  });

  it('keeps default and legacy severity percentage-based even with an explicit scale mode', () => {
    const card = createCard();
    const defaults = normalizeCardConfig({ entity, scale: { min: -20, max: 20 }, bar: { segment_space: 'scale' } });
    expect(ranges(card, defaults.entities[0], -20, 20)).toEqual([[0, 33], [33, 75], [75, 100]]);
    const legacy = normalizeCardConfig({
      scale: { min: -20, max: 20 },
      bar: { segment_space: 'scale' },
      entities: [{ entity, severity: [{ from: 0, to: 50, color: '#ff2600' }, { from: 50, to: 100, color: '#0433ff' }] }],
    });
    expect(ranges(card, legacy.entities[0], -20, 20)).toEqual([[0, 50], [50, 100]]);
  });
});
