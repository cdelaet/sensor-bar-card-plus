import { describe, expect, it } from 'vitest';
import { compilePaint, getSegmentsForRendering } from '../../src/view-model/paint-compiler.js';
import { resolvePaintPreset } from '../../src/view-model/paint-preset-resolver.js';

const registryWith = presets => ({ presets });

const inherited = Object.freeze({
  fill_style: 'bands', color: '#112233', solid_fill: false, opacity: 40,
  segments: Object.freeze([Object.freeze({ from: 0, to: 100, color: '#112233' })]),
});

describe('pure dashboard paint preset resolution', () => {
  it('resolves a named preset into canonical paint without carrying the reference', () => {
    const definition = Object.freeze({
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: Object.freeze([
        Object.freeze({ pos: 0, color: '#000000' }), Object.freeze({ pos: 100, color: '#ffffff' }),
      ]),
    });
    const result = resolvePaintPreset({ paint: { preset: 'thermal' }, registry: registryWith({ thermal: definition }) });

    expect(result).toMatchObject({ source: 'preset', diagnostics: [] });
    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#112233', opacity: 100 });
    expect(result.paint).not.toHaveProperty('preset');
    expect(compilePaint(result.paint, { samplePercent: 25 }).gradient)
      .toBe('linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)');
  });

  it('applies explicit local fields over a preset while preserving the other paint properties', () => {
    const definition = {
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 100, color: '#abcdef' }],
    };
    const result = resolvePaintPreset({
      paint: { preset: 'thermal', color: '#ff0000', opacity: 0 }, registry: registryWith({ thermal: definition }),
    });

    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#ff0000', opacity: 0 });
    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toMatchObject([{ from: { fixed: 0, entity: null }, to: { fixed: 100, entity: null },
      color: '#abcdef', label: null }]);
    expect(compilePaint(result.paint, { samplePercent: 25 }).gradient)
      .toBe('linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)');
  });

  it('keeps inherited opacity when a preset replaces inherited fill paint', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'plain' }, registry: registryWith({ plain: { fill_style: 'solid', color: '#abcdef' } }),
      inheritedPaint: inherited,
    });
    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#abcdef', opacity: 40 });
  });

  it('merges ordinary local paint fields property by property over inherited paint', () => {
    const result = resolvePaintPreset({ paint: { color: '#ff0000', opacity: 65 }, inheritedPaint: inherited });
    expect(result).toMatchObject({ source: 'inherited', diagnostics: [] });
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#ff0000', opacity: 65 });
    expect(result.paint.segments).toMatchObject([{ from: { fixed: 0 }, to: { fixed: 100 }, color: '#112233' }]);
  });

  it.each([
    ['solid', '#112233', 'linear-gradient(to right,#112233 0%,#112233 100%)'],
    ['gradient', 'rgb(64,64,64)', 'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)'],
    ['bands', '#000000', 'linear-gradient(to right, #000000 0%, #000000 50%, #ffffff 50%, #ffffff 100%)'],
    ['soft_bands', 'rgb(0,0,0)', 'linear-gradient(to right, #000000 0%, #000000 49.25%, #ffffff 50.75%, #ffffff 100%)'],
    ['band_gradient', 'rgb(64,64,64)', 'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)'],
  ])('preserves and compiles %s preset properties using its effective style', (fill_style, color, gradient) => {
    const definition = {
      fill_style, color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 50, color: '#000000' }, { from: 50, to: 100, color: '#ffffff' }],
    };
    const result = resolvePaintPreset({ paint: { preset: 'paint' }, registry: registryWith({ paint: definition }) });

    expect(result.paint.fill_style).toBe(fill_style);
    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toHaveLength(2);
    expect(compilePaint(result.paint, { samplePercent: 25 })).toEqual({ color, gradient });
  });

  it('preserves both preset collections when switching styles and compiles only the selected style', () => {
    const definition = {
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 100, color: '#abcdef' }],
    };
    const result = resolvePaintPreset({
      paint: { preset: 'paint', fill_style: 'solid', color: '#ff0000' }, registry: registryWith({ paint: definition }),
    });

    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toHaveLength(1);
    expect(compilePaint(result.paint, { samplePercent: 50 })).toEqual({
      color: '#ff0000', gradient: 'linear-gradient(to right,#ff0000 0%,#ff0000 100%)',
    });
  });

  it('retains full-Scale fixed and percentage anchors through resolution', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'anchored' },
      registry: registryWith({ anchored: {
        fill_style: 'bands', color: '#112233',
        segments: [
          { from: { fixed: 100 }, to: { fixed: 200 }, color: 'red' },
          { from: { percent: 60 }, to: { percent: 90 }, color: 'blue' },
        ],
      } }),
    });

    expect(getSegmentsForRendering(result.paint, 0, 400)).toEqual([
      { from: 25, to: 50, color: 'red', label: null },
      { from: 60, to: 90, color: 'blue', label: null },
    ]);
    expect(compilePaint(result.paint, { minValue: 0, maxValue: 400, samplePercent: 35, scaleDirection: 'reverse' })).toEqual({
      color: 'red', gradient: 'linear-gradient(to right, blue 10%, blue 40%, red 50%, red 75%)',
    });
  });

  it('falls back to valid inherited paint for a missing preset and identifies the reference', () => {
    const result = resolvePaintPreset({ paint: { preset: 'absent' }, registry: registryWith({}), inheritedPaint: inherited });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 40 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_missing', path: 'paint.preset', reference: 'absent', fallback: 'inherited',
    }));
  });

  it.each([
    ['not an object', 'paint_preset_invalid'],
    [{ opacity: 30, color: '#123456' }, 'paint_preset_invalid'],
    [{ fill_style: 'unknown', color: '#123456' }, 'paint_preset_invalid'],
  ])('uses inherited paint and diagnoses invalid preset definitions: %j', (definition, code) => {
    const result = resolvePaintPreset({ paint: { preset: 'broken' }, registry: registryWith({ broken: definition }), inheritedPaint: inherited });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 40 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code, path: 'paint.preset', reference: 'broken', fallback: 'inherited',
    }));
  });

  it('falls back from a malformed local override while keeping independent opacity', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'valid', fill_style: 'unknown', opacity: 0 },
      registry: registryWith({ valid: { fill_style: 'solid', color: '#abcdef' } }),
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 0 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_definition_invalid', path: 'paint.preset', reference: 'valid', fallback: 'inherited',
    }));
  });

  it('uses the theme-accent default when neither the preset nor inherited paint is valid', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'missing' }, registry: registryWith({}), inheritedPaint: { fill_style: 'bad' },
      themeAccent: 'var(--accent-color)',
    });
    expect(result.source).toBe('default');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: 'var(--accent-color)', opacity: 100 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_missing', reference: 'missing', fallback: 'default',
    }));
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'inherited_paint_invalid', fallback: 'default',
    }));
  });

  it('re-resolves changed registry definitions without retaining stale paint', () => {
    const paint = { preset: 'active' };
    const first = resolvePaintPreset({ paint, registry: registryWith({ active: { fill_style: 'solid', color: 'red' } }) });
    const second = resolvePaintPreset({ paint, registry: registryWith({ active: { fill_style: 'solid', color: 'blue' } }) });
    expect(first.paint.color).toBe('red');
    expect(second.paint.color).toBe('blue');
  });

  it('does not mutate frozen local, inherited, or registry definitions', () => {
    const definition = Object.freeze({
      fill_style: 'gradient', color: '#112233',
      gradient_stops: Object.freeze([
        Object.freeze({ pos: 0, color: '#000000' }), Object.freeze({ pos: 100, color: '#ffffff' }),
      ]),
    });
    const definitions = Object.freeze({ named: definition });
    const localPaint = Object.freeze({ preset: 'named', opacity: 0 });
    const inheritedPaint = Object.freeze({ ...inherited });
    const before = JSON.stringify({ definition, localPaint, inheritedPaint });

    const result = resolvePaintPreset({ paint: localPaint, registry: Object.freeze({ presets: definitions }), inheritedPaint });

    expect(result.paint.opacity).toBe(0);
    expect(JSON.stringify({ definition, localPaint, inheritedPaint })).toBe(before);
  });
});
