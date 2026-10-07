import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel, getRevealTransitionDuration } from '../../src/view-model/bar-render-model.js';
import { renderBar } from '../../src/render/bar-renderer.js';

const entity = 'sensor.power';
const state = value => ({ state: String(value), attributes: {} });

function resolvedRow(appearance, value, options = {}) {
  return buildRowViewModel({ entityConfig: appearance, entityState: state(value), ...options });
}

describe('shared bar presentation without a card instance', () => {
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
    expect(model.baseline).toEqual({ configured: true, percent: 50 });
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

  it('calculates transition timing solely from adapter-supplied geometry', () => {
    expect(getRevealTransitionDuration({ valuePercent: 40, baselinePercent: 50 }, { valuePercent: 60, baselinePercent: 50 })).toBe(300);
    expect(getRevealTransitionDuration(null, { valuePercent: 60, baselinePercent: 50 })).toBe(600);
    expect(getRevealTransitionDuration({ valuePercent: 60, baselinePercent: 50 }, { valuePercent: 61, baselinePercent: 50 })).toBe(600);
  });
});
