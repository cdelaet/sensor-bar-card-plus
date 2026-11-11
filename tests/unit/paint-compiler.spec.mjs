import { describe, expect, it } from 'vitest';
import {
  compilePaint, getGradientInterpolationStops, getSegmentsForRendering,
} from '../../src/view-model/paint-compiler.js';
import * as barModel from '../../src/view-model/bar-render-model.js';

// Exact outputs captured from the existing bar calculations before extraction.
const styles = [
  ['solid', '#112233', '#112233',
    'linear-gradient(to right,#112233 0%,#112233 100%)',
    'linear-gradient(to right,#112233 0%,#112233 100%)'],
  ['gradient', 'rgb(64,64,64)', 'rgb(191,191,191)',
    'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)',
    'linear-gradient(to right,rgb(255,255,255) 0%,rgb(0,0,0) 100%)'],
  ['bands', '#000000', '#ffffff',
    'linear-gradient(to right, #000000 0%, #000000 50%, #ffffff 50%, #ffffff 100%)',
    'linear-gradient(to right, #ffffff 0%, #ffffff 50%, #000000 50%, #000000 100%)'],
  ['soft_bands', 'rgb(0,0,0)', 'rgb(255,255,255)',
    'linear-gradient(to right, #000000 0%, #000000 49.25%, #ffffff 50.75%, #ffffff 100%)',
    'linear-gradient(to right, #ffffff 0%, #ffffff 49.25%, #000000 50.75%, #000000 100%)'],
  ['band_gradient', 'rgb(64,64,64)', 'rgb(191,191,191)',
    'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)',
    'linear-gradient(to right,rgb(255,255,255) 0%,rgb(0,0,0) 100%)'],
];

function paintDefinition(fill_style, solid_fill = false) {
  return Object.freeze({
    fill_style, solid_fill, color: '#112233',
    gradient_stops: Object.freeze([
      Object.freeze({ pos: 0, color: '#000' }),
      Object.freeze({ pos: 100, color: '#fff' }),
    ]),
    segments: Object.freeze([
      Object.freeze({ from: 0, to: 50, color: '#000000' }),
      Object.freeze({ from: 50, to: 100, color: '#ffffff' }),
    ]),
  });
}

describe('paint compilation without a containing bar or host', () => {
  it.each(styles)('preserves %s outputs, semantic sampling and Scale projection', (style, color, _highColor, normal, reverse) => {
    const paint = paintDefinition(style);
    for (const [scaleDirection, gradient] of [['normal', normal], ['reverse', reverse]]) {
      const compiled = compilePaint(paint, { samplePercent: 25, scaleDirection });
      expect(compiled).toEqual({ color, gradient });
      expect(barModel.getColor(25, { bar: paint })).toBe(color);
      expect(barModel.getBasePaintGradient(color, { bar: paint }, 0, 100, scaleDirection)).toBe(gradient);
      expect(barModel.getFullScalePaintStyle({ bar: paint }, color, null, null, 0, 100, scaleDirection))
        .toBe(`display:block;inset:0;background-image:${gradient};background-repeat:no-repeat;background-size:100% 100%;`);
    }
    expect(getGradientInterpolationStops(paint)).toEqual(barModel.getGradientInterpolationStops({ bar: paint }));
  });

  it.each(styles)('samples %s solid_fill at the supplied semantic position without retaining state', (style, lowColor, highColor) => {
    const paint = paintDefinition(style, true);
    const first = compilePaint(paint, { samplePercent: 25 });
    for (const scaleDirection of ['normal', 'reverse']) {
      for (const [samplePercent, color] of [[25, lowColor], [75, highColor]]) {
        expect(compilePaint(paint, { samplePercent, scaleDirection })).toEqual({
          color, gradient: `linear-gradient(to right,${color} 0%,${color} 100%)`,
        });
      }
    }
    expect(compilePaint(paint, { samplePercent: 25 })).toEqual(first);
  });

  it('resolves fixed and percentage segment anchors against changing bounds on every call', () => {
    const paint = Object.freeze({
      fill_style: 'bands', color: '#112233',
      segments: Object.freeze([
        Object.freeze({ from: Object.freeze({ fixed: '120' }), to: Object.freeze({ fixed: 160 }), color: 'red' }),
        Object.freeze({ from: Object.freeze({ percent: 60 }), to: Object.freeze({ percent: 90 }), color: 'blue' }),
      ]),
    });
    for (const [minValue, maxValue, from, to, color] of [[100, 300, 10, 30, '#112233'], [0, 400, 30, 40, 'red']]) {
      expect(getSegmentsForRendering(paint, minValue, maxValue)).toEqual([
        { from, to, color: 'red', label: null },
        { from: 60, to: 90, color: 'blue', label: null },
      ]);
      expect(compilePaint(paint, { minValue, maxValue, samplePercent: 35 })).toEqual({
        color,
        gradient: `linear-gradient(to right, red ${from}%, red ${to}%, blue 60%, blue 90%)`,
      });
      expect(compilePaint(paint, { minValue, maxValue, samplePercent: 35, scaleDirection: 'reverse' })).toEqual({
        color,
        gradient: `linear-gradient(to right, blue 10%, blue 40%, red ${100 - to}%, red ${100 - from}%)`,
      });
    }
    expect(compilePaint(paint, { minValue: 100, maxValue: 300, samplePercent: 35 }).color).toBe('#112233');
  });

  it('keeps interpolated CSS gaps and edge extension separate from sampled fallback colors', () => {
    const paint = { fill_style: 'bands', color: 'var(--fallback)', segments: [
      { from: 10, to: 20, color: 'red' }, { from: 40, to: 60, color: 'blue' },
    ] };
    expect(compilePaint(paint, { samplePercent: 30 })).toEqual({
      color: 'var(--fallback)', gradient: 'linear-gradient(to right, red 10%, red 20%, blue 40%, blue 60%)',
    });
    expect(compilePaint(paint, { samplePercent: 5 }).color).toBe('var(--fallback)');
    expect(compilePaint(paint, { samplePercent: 80 }).color).toBe('var(--fallback)');
    expect(compilePaint({ ...paint, solid_fill: true }, { samplePercent: 30 }).gradient)
      .toBe('linear-gradient(to right,var(--fallback) 0%,var(--fallback) 100%)');
  });

  it('retains segment end inference, invalid-boundary filtering and legacy Scale coordinates', () => {
    const paint = { fill_style: 'bands', segment_space: 'scale', color: 'red', segments: [
      { from: 120, color: 'red' }, { from: 200, color: 'blue' },
      { from: 140, to: 180, color: 'green', invalidBoundary: 'malformed' },
    ] };
    expect(getSegmentsForRendering(paint, 100, 300)).toEqual([
      { from: 10, to: 50, color: 'red', label: null },
      { from: 50, to: 100, color: 'blue', label: null },
    ]);
    expect(getSegmentsForRendering(paint, 100, 300)).toEqual(barModel.getSegmentsForRendering({ bar: paint }, 100, 300));
  });

  it('suppresses mixed-coordinate segments when dynamic bounds make the endpoints cross', () => {
    const paint = { fill_style: 'bands', color: 'red', segments: [
      { from: { percent: 30 }, to: { fixed: 50 }, color: 'blue' },
    ] };
    expect(getSegmentsForRendering(paint, 0, 100)).toEqual([{ from: 30, to: 50, color: 'blue', label: null }]);
    expect(compilePaint(paint, { maxValue: 200 })).toEqual({ color: 'red', gradient: null });
  });

  it.each(['bands', 'soft_bands', 'band_gradient'])('retains CSS colors in %s paint and its existing sampling fallback', fill_style => {
    const paint = { fill_style, color: '#112233', segments: [
      { from: 0, to: 50, color: 'var(--low)' }, { from: 50, to: 100, color: 'rebeccapurple' },
    ] };
    const compiled = compilePaint(paint, { samplePercent: 25 });
    expect(compiled.gradient).toContain('var(--low) 0%');
    expect(compiled.gradient).toContain('rebeccapurple 100%');
    expect(compiled.color).toBe(fill_style === 'bands' ? 'var(--low)' : '#112233');
  });

  it('preserves overlap precedence before reflecting CSS stops', () => {
    const paint = { fill_style: 'bands', color: '#112233', segments: [
      { from: 0, to: 70, color: 'red' }, { from: 30, to: 100, color: 'blue' },
    ] };
    expect(compilePaint(paint, { samplePercent: 50, scaleDirection: 'reverse' })).toEqual({
      color: 'red', gradient: 'linear-gradient(to right, blue 0%, blue 30%, red 30%, red 100%)',
    });
  });

  it('retains exterior gradient positions and duplicate hard stops', () => {
    const paint = { fill_style: 'gradient', color: '#112233', gradient_stops: [
      { pos: -100, color: '#000' }, { pos: 50, color: '#000' },
      { pos: 50, color: '#fff' }, { pos: 200, color: '#fff' },
    ] };
    expect(compilePaint(paint, { samplePercent: 25 }).gradient)
      .toBe('linear-gradient(to right,rgb(0,0,0) -100%,rgb(0,0,0) 50%,rgb(255,255,255) 50%,rgb(255,255,255) 200%)');
    expect(compilePaint(paint, { samplePercent: 75, scaleDirection: 'reverse' })).toEqual({
      color: 'rgb(255,255,255)',
      gradient: 'linear-gradient(to right,rgb(255,255,255) -100%,rgb(255,255,255) 50%,rgb(0,0,0) 50%,rgb(0,0,0) 200%)',
    });
  });

  it.each(['bands', 'soft_bands', 'band_gradient'])('preserves empty %s paint behavior', fill_style => {
    expect(compilePaint({ fill_style, color: '#112233' })).toEqual({
      color: '#112233', gradient: fill_style === 'band_gradient' ? undefined : null,
    });
  });

  it('keeps the existing default gradient and legacy mode aliases', () => {
    expect(compilePaint({ fill_style: 'gradient', color: '#112233' }, { samplePercent: 25 })).toEqual({
      color: 'rgb(166,164,40)',
      gradient: 'linear-gradient(to right,rgb(76,175,80) 0%,rgb(255,152,0) 50%,rgb(244,67,54) 100%)',
    });
    for (const [color_mode, fill_style] of [['single', 'solid'], ['gradient', 'gradient'], ['severity', 'bands'], ['severity_gradient', 'band_gradient']]) {
      const { fill_style: _style, ...paint } = paintDefinition(fill_style);
      expect(compilePaint({ ...paint, color_mode }, { samplePercent: 25 }))
        .toEqual(compilePaint(paintDefinition(fill_style), { samplePercent: 25 }));
    }
  });
});
