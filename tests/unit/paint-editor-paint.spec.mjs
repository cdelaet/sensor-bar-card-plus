import { expect, it } from 'vitest';
import { normalizeBarConfig } from '../../src/config/normalize.js';
import { getPathValue } from '../../src/editor/shared/editor-config.js';
import { getBarPaintEditorState } from '../../src/editor/sections/bar-appearance.js';
import { resolvePaintEditorPaint } from '../../src/editor/shared/paint-editor-paint.js';
import { compilePaint } from '../../src/view-model/paint-compiler.js';

for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
  it(`resolves omitted ${fill_style} palettes identically with and without section values`, () => {
    const config = { bar: { paint: { fill_style, opacity: 63 } } };
    const saved = structuredClone(config);
    const normalized = normalizeBarConfig(config, null, { isCardScope: true }).paint;
    const resolved = resolvePaintEditorPaint(normalized);
    const context = { read: (_scope, path) => getPathValue(config, path), hass: { states: {} } };
    const state = getBarPaintEditorState(context, { type: 'card' }, null);

    expect(resolved.segments).toHaveLength(['bands', 'soft_bands', 'band_gradient'].includes(fill_style) ? 3 : 0);
    expect(resolved.gradient_stops).toEqual([
      { pos: 0, color: '#4CAF50' }, { pos: 50, color: '#FF9800' }, { pos: 100, color: '#F44336' },
    ]);
    expect(state.paint.segments).toEqual(resolved.segments);
    expect(state.paint.gradient_stops).toEqual(resolved.gradient_stops);
    expect(compilePaint(resolved).gradient).toBeTruthy();
    expect(normalized.segments).toBeNull();
    expect(normalized.gradient_stops).toBeNull();
    expect(config).toEqual(saved);
  });
}

it('preserves normalized authored palettes and explicit empty palettes', () => {
  for (const segments of [[], [{ from: '0%', to: '100%', color: '#abcdef' }]]) {
    const paint = normalizeBarConfig({ bar: { paint: { fill_style: 'bands', segments, gradient_stops: [] } } }).paint;
    const resolved = resolvePaintEditorPaint(paint);
    expect(resolved.segments).toBe(paint.segments);
    expect(resolved.gradient_stops).toBe(paint.gradient_stops);
    expect(resolved.segments).toHaveLength(segments.length);
    expect(resolved.gradient_stops).toEqual([]);
  }
});

it('uses section-supplied palette values without materializing them in normalized paint', () => {
  const paint = normalizeBarConfig({ bar: { paint: { fill_style: 'bands' } } }).paint;
  const gradient_stops = [{ pos: 20, color: '#123456' }];
  const resolved = resolvePaintEditorPaint(paint, {
    segments: [{ from: '10%', to: '40%', color: '#abcdef' }], gradient_stops,
  });
  expect(resolved.segments).toMatchObject([{ from: { percent: 10 }, to: { percent: 40 }, color: '#abcdef' }]);
  expect(resolved.gradient_stops).toBe(gradient_stops);
  expect(paint.segments).toBeNull();
  expect(paint.gradient_stops).toBeNull();
  expect(resolvePaintEditorPaint(paint).gradient_stops[0].color).toBe('#4CAF50');
});
