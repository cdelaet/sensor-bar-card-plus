import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import {
  buildBarRenderModel,
  getBandsGradientCss,
  getColor,
  getSoftBandGradientStops,
} from '../../src/view-model/bar-render-model.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { projectScalePercent } from '../../src/view-model/scale-projection.js';

const entity = 'sensor.direction';
const state = (value) => ({ state: String(value), attributes: {} });

function resolved(config, value = 30) {
  const normalized = normalizeCardConfig({
    ...config,
    entities: [{ entity, ...(config.entities?.[0] ?? {}) }],
  });
  const appearance = normalized.entities[0];
  const row = buildRowViewModel({ entityConfig: appearance, entityState: state(value) });
  return { normalized, appearance, row, model: buildBarRenderModel(row, appearance, { height: 30 }) };
}

describe('Scale Direction and Bar Direction', () => {
  it('projects semantic percentages to physical positions', () => {
    expect([0, 30, 50, 100].map(value => projectScalePercent(value, 'normal')))
      .toEqual([0, 30, 50, 100]);
    expect([0, 30, 50, 100].map(value => projectScalePercent(value, 'reverse')))
      .toEqual([100, 70, 50, 0]);
  });

  it('normalizes defaults, inheritance, overrides, and invalid values without changing existing bar syntax', () => {
    const defaults = normalizeCardConfig({ entities: [{ entity: 'sensor.default' }] });
    expect(defaults.scale.direction).toBe('normal');
    expect(defaults.bar.direction).toBe('normal');
    expect(defaults.entities[0].scale.direction).toBe('normal');
    expect(defaults.entities[0].bar.direction).toBe('normal');

    const inherited = normalizeCardConfig({
      scale: { direction: 'reverse' },
      bar: { direction: 'reverse', fill_style: 'bands', solid_fill: false, color: '#4a9eff', animated: true, needle: false },
      entities: [
        { entity: 'sensor.inherit' },
        { entity: 'sensor.normal', scale: { direction: 'normal' }, bar: { direction: 'normal' } },
        { entity: 'sensor.reverse', scale: { direction: 'reverse' }, bar: { direction: 'reverse' } },
      ],
    });
    expect(inherited.scale.direction).toBe('reverse');
    expect(inherited.bar).toMatchObject({ direction: 'reverse', fill_style: 'bands', solid_fill: false, color: '#4a9eff', animated: true, needle: { show: false } });
    expect(inherited.entities.map(row => [row.scale.direction, row.bar.direction])).toEqual([
      ['reverse', 'reverse'], ['normal', 'normal'], ['reverse', 'reverse'],
    ]);

    const invalid = normalizeCardConfig({
      scale: { direction: 'sideways' },
      bar: { direction: 'left' },
      entities: [{ entity: 'sensor.one', scale: { direction: 'sideways' }, bar: { direction: 'left' } }],
    });
    expect(invalid.scale.direction).toBe('normal');
    expect(invalid.bar.direction).toBe('normal');
    expect(invalid.entities[0].scale.direction).toBe('normal');
    expect(invalid.entities[0].bar.direction).toBe('normal');
    expect(validateNormalizedConfig(invalid).warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'scale.invalid_direction', path: 'card.scale.direction' }),
      expect.objectContaining({ code: 'bar.invalid_direction', path: 'card.bar.direction' }),
      expect.objectContaining({ code: 'scale.invalid_direction', path: 'entities[0].scale.direction' }),
      expect.objectContaining({ code: 'bar.invalid_direction', path: 'entities[0].bar.direction' }),
    ]));

    const inheritedInvalid = normalizeCardConfig({
      scale: { direction: 'reverse' },
      bar: { direction: 'reverse' },
      entities: [{ entity: 'sensor.invalid', scale: { direction: 'sideways' }, bar: { direction: 'left' } }],
    });
    expect(inheritedInvalid.entities[0]).toMatchObject({
      scale: { direction: 'reverse' },
      bar: { direction: 'reverse' },
    });

    expect(normalizeCardConfig({ entities: [{ entity }], bar: { fill_style: 'bands', solid_fill: false } }).bar)
      .toMatchObject({ fill_style: 'bands', solid_fill: false });
  });

  it.each([
    ['normal', 'normal', 30, 0, 30],
    ['reverse', 'normal', 70, 0, 70],
    ['normal', 'reverse', 30, 30, 100],
    ['reverse', 'reverse', 70, 70, 100],
  ])('uses %s Scale and %s Bar projection', (scaleDirection, barDirection, position, start, end) => {
    const { row, model } = resolved({
      scale: { min: 0, max: 100, direction: scaleDirection },
      bar: { direction: barDirection },
    });
    expect(row.percent).toBe(30);
    expect(row.positionPercent).toBe(position);
    expect(model.fill.geometry).toMatchObject({ start, end });
  });

  it('keeps Paint unchanged when only the physical Bar direction changes', () => {
    const config = {
      scale: { min: 0, max: 100 },
      bar: {
        fill_style: 'bands',
        segments: [
          { from: '0%', to: '50%', color: '#00ff00' },
          { from: '50%', to: '100%', color: '#ff0000' },
        ],
      },
    };
    const normal = resolved(config);
    const reverse = resolved({ ...config, bar: { ...config.bar, direction: 'reverse' } });
    expect(reverse.model.fill.paintLayers[0].paintStyle).toBe(normal.model.fill.paintLayers[0].paintStyle);
    expect(reverse.model.fill.geometry).toMatchObject({ start: 30, end: 100 });
  });

  it('projects historical bands stops through a reversed Scale without changing their semantic colors', () => {
    const config = { scale: { min: 0, max: 100 }, bar: { fill_style: 'bands', color: '#aaaaaa', segments: [
      { from: '30%', to: '50%', color: '#0000ff' },
      { from: '60%', to: '80%', color: '#00ff00' },
    ] } };
    const normal = resolved(config).model.fill.paintLayers[0].paintStyle;
    const reverse = resolved({ ...config, scale: { ...config.scale, direction: 'reverse' }, bar: { ...config.bar, direction: 'reverse' } }).model.fill.paintLayers[0].paintStyle;
    expect(normal).toContain('linear-gradient(to right, #0000ff 30%, #0000ff 50%, #00ff00 60%, #00ff00 80%)');
    expect(reverse).toContain('linear-gradient(to right, #00ff00 20%, #00ff00 40%, #0000ff 50%, #0000ff 70%)');
  });

  it('preserves overlapping band precedence in semantic space before reverse projection', () => {
    const config = {
      scale: { min: 0, max: 100 },
      bar: { fill_style: 'bands', segments: [
        { from: '0%', to: '70%', color: '#00ff00' },
        { from: '30%', to: '100%', color: '#ff0000' },
      ] },
    };
    const normal = resolved(config, 50);
    const reversed = resolved({ ...config, scale: { ...config.scale, direction: 'reverse' } }, 50);

    expect(normal.model.fill.paintLayers[0].paintStyle)
      .toContain('linear-gradient(to right, #00ff00 0%, #00ff00 70%, #ff0000 30%, #ff0000 100%)');
    expect(reversed.model.fill.paintLayers[0].paintStyle)
      .toContain('linear-gradient(to right, #ff0000 0%, #ff0000 30%, #00ff00 30%, #00ff00 100%)');
    expect(getColor(50, normal.appearance, 0, 100)).toBe('#00ff00');
    expect(getColor(50, reversed.appearance, 0, 100)).toBe('#00ff00');

    const softConfig = {
      bar: { fill_style: 'soft_bands', segments: [
        { from: 0, to: 80, color: '#00ff00' },
        { from: 50, to: 60, color: '#ff0000' },
        { from: 70, to: 100, color: '#0000ff' },
      ] },
    };
    const semanticStops = getSoftBandGradientStops(normalizeCardConfig({ entities: [{ entity }], ...softConfig }));
    const softNormal = resolved(softConfig).model.fill.paintLayers[0].paintStyle;
    const softReverse = resolved({ ...softConfig, scale: { direction: 'reverse' } }).model.fill.paintLayers[0].paintStyle;
    expect(softNormal).toContain(semanticStops.map(stop => `${stop.color} ${stop.p}%`).join(', '));
    expect(softReverse).toContain(
      'linear-gradient(to right, #0000ff 0%, #0000ff 20.75%, #ff0000 20.75%, #ff0000 20.75%, #00ff00 20.75%, #00ff00 100%)',
    );
    const softAppearance = normalizeCardConfig({ entities: [{ entity }], ...softConfig });
    expect(getColor(70, softAppearance, 0, 100)).toBe('rgb(0,255,0)');
  });

  it('preserves exterior Gradient Stop coordinates without clamping', () => {
    const config = { bar: { fill_style: 'gradient', gradient_stops: [
      { pos: -100, color: '#00ff00' },
      { pos: 200, color: '#ff0000' },
    ] } };
    const normal = resolved(config).model.fill.paintLayers[0].paintStyle;
    const reverse = resolved({ ...config, scale: { direction: 'reverse' } }).model.fill.paintLayers[0].paintStyle;
    expect(normal).toContain('rgb(0,255,0) -100%,rgb(255,0,0) 200%');
    expect(reverse).toContain('rgb(255,0,0) -100%,rgb(0,255,0) 200%');
  });

  it('keeps nonnumeric rows hidden when Scale direction is reversed', () => {
    const { row, model } = resolved({ scale: { direction: 'reverse' } }, 'unavailable');
    expect(row.percent).toBe(0);
    expect(row.positionPercent).toBeNull();
    expect(model.fill.geometry.hidden).toBe(true);
    expect(model.fill.revealStyle).toContain('display:none');
  });

  it('preserves the unavailable-value Baseline fallback under normal and reversed Scale', () => {
    const normal = resolved({ scale: { min: 0, max: 100 }, baseline: { at: 50 } }, 'unavailable');
    const reverse = resolved({ scale: { min: 0, max: 100, direction: 'reverse' }, baseline: { at: 50 } }, 'unavailable');
    expect(normal.row.numericValue).toBeNull();
    expect(normal.model.fill.geometry).toMatchObject({ usesBaseline: true, start: 0, end: 50, hidden: false });
    expect(normal.model.fill.revealStyle).toContain('round 6px 0 0 6px');
    expect(reverse.model.fill.geometry).toMatchObject({ usesBaseline: true, start: 50, end: 100, hidden: false });
    expect(reverse.model.fill.revealStyle).toContain('round 0 6px 6px 0');
  });

  it('projects Baseline geometry through Scale and makes Baseline the reveal origin', () => {
    const normal = resolved({ scale: { min: 0, max: 100 }, baseline: { at: 100 }, bar: { direction: 'normal' } });
    const reverse = resolved({ scale: { min: 0, max: 100, direction: 'reverse' }, baseline: { at: 100 }, bar: { direction: 'reverse' } });
    const reverseBar = resolved({ scale: { min: 0, max: 100, direction: 'reverse' }, bar: { direction: 'reverse' } });
    expect(normal.model.fill.geometry).toMatchObject({ usesBaseline: true, start: 30, end: 100 });
    expect(reverse.row.baselinePositionPercent).toBe(0);
    expect(reverse.model.fill.geometry).toMatchObject({ usesBaseline: true, start: 0, end: 70 });
    expect(reverseBar.model.fill.geometry).toMatchObject({ usesBaseline: false, start: 70, end: 100 });
  });

  it('projects asymmetric Baseline intervals and endpoint corners under reversed Scale', () => {
    for (const [value, start, end, endpoints, corners] of [
      [10, 75, 90, { left: 'baseline', right: 'value' }, '0 6px 6px 0'],
      [40, 60, 75, { left: 'value', right: 'baseline' }, '6px 0 0 6px'],
    ]) {
      const common = { scale: { min: 0, max: 100, direction: 'reverse' }, baseline: { at: 25 } };
      const normalBar = resolved({ ...common, bar: { direction: 'normal' } }, value);
      const reverseBar = resolved({ ...common, bar: { direction: 'reverse' } }, value);
      expect(normalBar.model.fill.geometry).toMatchObject({ start, end, endpointSemantics: endpoints });
      expect(reverseBar.model.fill.geometry).toEqual(normalBar.model.fill.geometry);
      expect(normalBar.model.fill.revealStyle).toContain(`round ${corners}`);
      expect(reverseBar.model.fill.revealStyle).toBe(normalBar.model.fill.revealStyle);
    }
  });

  it('projects retained dynamic extrema and numeric Segments using resolved reversed bounds', () => {
    const appearance = normalizeCardConfig({
      scale: { min: { entity: 'sensor.minimum' }, max: { entity: 'sensor.maximum' }, direction: 'reverse' },
      peak: { enabled: true }, floor: { enabled: true },
      bar: { fill_style: 'bands', segments: [
        { from: 120, to: 220, color: '#00ff00' },
      ] },
      entities: [{ entity }],
    }).entities[0];
    const row = buildRowViewModel({
      entityConfig: appearance,
      entityState: state(160),
      hass: { states: { 'sensor.minimum': state(100), 'sensor.maximum': state(300) } },
      extrema: { peak: { value: 260 }, floor: { value: 120 } },
    });
    const model = buildBarRenderModel(row, appearance, { height: 30 });
    expect(row).toMatchObject({ min: 100, max: 300, percent: 30, positionPercent: 70, peakPercent: 80, floorPercent: 10 });
    expect(row.markers.find(marker => marker.type === 'peak').position).toBe(20);
    expect(row.markers.find(marker => marker.type === 'floor').position).toBe(90);
    expect(model.fill.paintLayers[0].paintStyle)
      .toContain('linear-gradient(to right, #00ff00 40%, #00ff00 90%)');
  });

  it('projects marker and Needle positions, while keeping Needle reveal full and Paint semantic', () => {
    const { appearance, row, model } = resolved({
      scale: { min: 0, max: 100, direction: 'reverse' },
      target: { at: 25 },
      peak: { enabled: true },
      floor: { enabled: true },
      markers: [{ at: 40, id: 'reference' }],
      bar: {
        direction: 'reverse',
        fill_style: 'bands',
        solid_fill: true,
        segments: [
          { from: '0%', to: '50%', color: '#00ff00' },
          { from: '50%', to: '100%', color: '#ff0000' },
        ],
        needle: true,
      },
    }, 30);
    expect(row.needle).toMatchObject({ show: true, percent: 30, pct: 70 });
    expect(model.needle.pct).toBe(70);
    expect(model.fill.geometry).toMatchObject({ start: 0, end: 100 });
    expect(row.markers.find(marker => marker.type === 'target').position).toBe(75);
    expect(row.markers.find(marker => marker.type === 'generic').position).toBe(60);
    expect(getColor(row.percent, appearance, row.min, row.max)).toBe('#00ff00');
    expect(model.fill.paintLayers[0].paintStyle)
      .toContain('linear-gradient(to right,#00ff00 0%,#00ff00 100%)');
  });

  it('projects percentage Paint, Gradient Stops, Baseline sides, and Target-above semantically', () => {
    const segments = resolved({
      scale: { min: 0, max: 100, direction: 'reverse' },
      baseline: { at: 50, below: { color: '#0000ff' }, above: { color: '#ff0000' } },
      target: { at: 50 },
      above_target_color: '#ffff00',
      bar: {
        fill_style: 'bands',
        segments: [
          { from: '0%', to: '50%', color: '#00ff00' },
          { from: '50%', to: '100%', color: '#ff0000' },
        ],
      },
    });
    const paint = segments.model.fill.paintLayers[0].paintStyle;
    expect(paint).toContain('linear-gradient(to right, #ff0000 0%, #ff0000 50%, #00ff00 50%, #00ff00 100%)');
    expect(paint).toContain('#ff0000 0%,#ff0000 50%');
    expect(paint).toContain('#0000ff 50%,#0000ff 100%');
    expect(segments.model.fill.paintLayers[1].revealStyle).toContain('inset(0 50% 0 0');

    const gradient = resolved({
      scale: { min: 0, max: 100, direction: 'reverse' },
      bar: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#00ff00' }, { pos: 100, color: '#ff0000' },
      ] },
    });
    expect(gradient.model.fill.paintLayers[0].paintStyle)
      .toContain('linear-gradient(to right,rgb(255,0,0) 0%,rgb(0,255,0) 100%)');

    const hardStopGradient = resolved({
      scale: { min: 0, max: 100, direction: 'reverse' },
      bar: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#00ff00' },
        { pos: 50, color: '#00ff00' },
        { pos: 50, color: '#ff0000' },
        { pos: 100, color: '#ff0000' },
      ] },
    }).model.fill.paintLayers[0].paintStyle;
    expect(hardStopGradient)
      .toContain('linear-gradient(to right,rgb(255,0,0) 0%,rgb(255,0,0) 50%,rgb(0,255,0) 50%,rgb(0,255,0) 100%)');

    for (const fill_style of ['soft_bands', 'band_gradient']) {
      const mappedPaint = resolved({
        scale: { min: 0, max: 100, direction: 'reverse' },
        bar: {
          fill_style,
          segments: [
            { from: '0%', to: '50%', color: '#00ff00' },
            { from: '50%', to: '100%', color: '#ff0000' },
          ],
        },
      }).model.fill.paintLayers[0].paintStyle;
      const redAtMin = fill_style === 'band_gradient' ? 'rgb(255,0,0) 0%' : '#ff0000 0%';
      const greenAtMax = fill_style === 'band_gradient' ? 'rgb(0,255,0) 100%' : '#00ff00 100%';
      expect(mappedPaint).toContain(redAtMin);
      expect(mappedPaint).toContain(greenAtMax);
    }
  });
});
