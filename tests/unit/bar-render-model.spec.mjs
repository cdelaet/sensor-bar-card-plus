import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel, getBandsGradientCss, getRevealTransitionDuration } from '../../src/view-model/bar-render-model.js';
import { renderBar } from '../../src/render/bar-renderer.js';

const entity = 'sensor.power';
const state = value => ({ state: String(value), attributes: {} });

function resolvedRow(appearance, value, options = {}) {
  return buildRowViewModel({ entityConfig: appearance, entityState: state(value), ...options });
}

describe('shared bar presentation without a card instance', () => {
  it.each([
    ['single segment from zero', [{ from: 0, to: 50, color: '#123456' }], 'linear-gradient(to right, #123456 0%, #123456 50%, #4a9eff 50%, #4a9eff 100%)'],
    ['single segment with leading and trailing gaps', [{ from: 20, to: 80, color: '#123456' }], 'linear-gradient(to right, #4a9eff 0%, #4a9eff 20%, #123456 20%, #123456 80%, #4a9eff 80%, #4a9eff 100%)'],
    ['separated segments', [{ from: 0, to: 20, color: '#123456' }, { from: 40, to: 60, color: '#abcdef' }], 'linear-gradient(to right, #123456 0%, #123456 20%, #4a9eff 20%, #4a9eff 40%, #abcdef 40%, #abcdef 60%, #4a9eff 60%, #4a9eff 100%)'],
    ['adjacent segments', [{ from: 0, to: 50, color: '#123456' }, { from: 50, to: 100, color: '#abcdef' }], 'linear-gradient(to right, #123456 0%, #123456 50%, #abcdef 50%, #abcdef 100%)'],
    ['full-range segment', [{ from: 0, to: 100, color: '#123456' }], 'linear-gradient(to right, #123456 0%, #123456 100%)'],
  ])('fills uncovered ranges with the bar color for %s', (_name, bands, expected) => {
    expect(getBandsGradientCss(bands, '#4a9eff')).toBe(expected);
  });

  it('paints uncovered runtime band ranges with the effective bar color', () => {
    const appearance = normalizeCardConfig({
      entity,
      bar: {
        fill_style: 'bands',
        color: '#4a9eff',
        segments: [{ from: '0%', to: '50%', color: '#123456' }],
      },
    });
    const model = buildBarRenderModel(resolvedRow(appearance, 75), appearance, { height: 28 });

    expect(model.fill.paintLayers[0].paintStyle).toContain(
      'background-image:linear-gradient(to right, #123456 0%, #123456 50%, #4a9eff 50%, #4a9eff 100%);',
    );
  });

  it.each(['solid', 'bands', 'soft_bands', 'gradient', 'band_gradient'])('%s uses resolved rows without changing input or retaining previous values', fillStyle => {
    const appearance = normalizeCardConfig({ entities: [{
      entity,
      scale: { min: -20, max: 20 },
      baseline: { at: 0 },
      bar: { fill_style: fillStyle, segments: [
        { from: -20, to: 0, color: '#ff0000' },
        { from: 0, to: 20, color: '#0000ff' },
      ] },
    }] }).entities[0];
    const row = resolvedRow(appearance, 10);
    const before = JSON.stringify({ row, appearance });
    const model = buildBarRenderModel(row, appearance, { height: 28 });
    expect(model.baseline).toEqual({ configured: true, percent: 50, positionPercent: 50, scalePercent: 50 });
    expect(model.fill.geometry).toMatchObject({ start: 50, end: 75 });
    expect(model.fill.revealStyle).toContain('height:28px');
    const html = renderBar(model);
    expect(html).toContain('class="bar-track"');
    expect(html).toContain('class="baseline-indicator"');
    expect(html).not.toContain('value-label');
    expect(html).not.toContain('ha-card');
    buildBarRenderModel(resolvedRow(appearance, -10), appearance, { height: 42 });
    expect(buildBarRenderModel(row, appearance, { height: 28 })).toEqual(model);
    expect(JSON.stringify({ row, appearance })).toBe(before);
  });

  it('uses adapter-owned scale history and extrema without inventing a fallback history', () => {
    const appearance = normalizeCardConfig({ entities: [{
      entity,
      scale: { min: { entity: 'sensor.minimum' }, max: { entity: 'sensor.maximum' } },
      peak: { enabled: true }, floor: { enabled: true },
      bar: { needle: true },
    }] }).entities[0];
    const row = resolvedRow(appearance, 10, {
      hass: { states: { 'sensor.minimum': state(20), 'sensor.maximum': state(-20) } },
      previousScale: { min: -20, max: 20 },
      extrema: { peak: { value: 15 }, floor: { value: -15 } },
    });
    const model = buildBarRenderModel(row, appearance, { height: 'var(--sbcp-row-height)' });
    expect(row).toMatchObject({ min: -20, max: 20 });
    expect(model.needle).toMatchObject({ configured: true, show: true, pct: 75 });
    expect(model.markers.find(marker => marker.type === 'peak').position).toBe(87.5);
    expect(model.markers.find(marker => marker.type === 'floor').position).toBe(12.5);
    expect(resolvedRow(appearance, 10)).toMatchObject({ min: 0, max: 100 });
  });

  it.each([
    ['green', 'orange', 'red'],
    ['#008000', 'rgb(255, 165, 0)', 'var(--segment-high)'],
  ])('preserves CSS colors in band-gradient paint for %j', (...colors) => {
    const appearance = normalizeCardConfig({ entities: [{
      entity,
      scale: { min: { fixed: 0 }, max: { fixed: 100 } },
      bar: { fill_style: 'band_gradient', segments: [
        { from: 0, to: 30, color: colors[0] },
        { from: 30, to: 70, color: colors[1] },
        { from: 70, to: 100, color: colors[2] },
      ] },
    }] }).entities[0];
    const model = buildBarRenderModel(resolvedRow(appearance, 42.7), appearance, { height: 42 });
    const firstColor = colors[0] === '#008000' ? 'rgb(0,128,0)' : colors[0];
    expect(model.fill.paintLayers[0].paintStyle).toContain(
      `background-image:linear-gradient(to right,${firstColor} 0%,${colors[1]} 50%,${colors[2]} 100%);`,
    );
    expect(model.fill.geometry).toMatchObject({ start: 0, end: 42.7, hidden: false });
    expect(model.fill.revealStyle).toContain('57.3%');
    expect(renderBar(model)).toContain('background-image:linear-gradient');
  });

  it('calculates transition timing solely from adapter-supplied geometry', () => {
    expect(getRevealTransitionDuration({ valuePercent: 40, baselinePercent: 50 }, { valuePercent: 60, baselinePercent: 50 })).toBe(300);
    expect(getRevealTransitionDuration(null, { valuePercent: 60, baselinePercent: 50 })).toBe(600);
    expect(getRevealTransitionDuration({ valuePercent: 60, baselinePercent: 50 }, { valuePercent: 61, baselinePercent: 50 })).toBe(600);
  });
});
