import { describe, expect, it } from 'vitest';
import { INVALID_PAINT_OPACITY, normalizePaintOpacity } from '../../src/config/normalize.js';

describe('pure paint opacity normalization', () => {
  it.each([{}, { opacity: undefined }])('defaults omitted opacity without invalid metadata: %j', paint => {
    const normalized = normalizePaintOpacity(paint);
    expect(normalized.opacity).toBe(100);
    expect(Object.prototype.hasOwnProperty.call(normalized, INVALID_PAINT_OPACITY)).toBe(false);
    expect(normalized).not.toBe(paint);
  });

  it.each([0, 100, 50, 0.25, 99.75])('preserves numeric opacity %s', opacity => {
    const normalized = normalizePaintOpacity({ opacity });
    expect(normalized.opacity).toBe(opacity);
    expect(Object.prototype.hasOwnProperty.call(normalized, INVALID_PAINT_OPACITY)).toBe(false);
  });

  it.each([null, false, true, '', '50', '50%', NaN, Infinity, -Infinity, -0.1, 100.1, [], {}, new Number(50)])(
    'recovers invalid opacity %j independently and records the raw input', opacity => {
      const normalized = normalizePaintOpacity({ color: '#123456', opacity });
      expect(normalized.opacity).toBe(100);
      expect(normalized.color).toBe('#123456');
      expect(Object.prototype.hasOwnProperty.call(normalized, INVALID_PAINT_OPACITY)).toBe(true);
      expect(normalized[INVALID_PAINT_OPACITY]).toBe(opacity);
      expect(Object.getOwnPropertyDescriptor(normalized, INVALID_PAINT_OPACITY).enumerable).toBe(false);
      expect(JSON.stringify(normalized)).toBe('{"color":"#123456","opacity":100}');
    },
  );

  it('preserves a frozen gradient and every other paint property when opacity is invalid', () => {
    const gradient_stops = Object.freeze([
      Object.freeze({ pos: 0, color: '#123456' }),
      Object.freeze({ pos: 100, color: '#abcdef' }),
    ]);
    const paint = Object.freeze({
      fill_style: 'gradient',
      color: 'var(--primary-color)',
      solid_fill: false,
      gradient_stops,
      segments: Object.freeze([Object.freeze({ from: '0%', to: '100%', color: 'red' })]),
      preset: 'example',
      extra: Object.freeze({ keep: true }),
      opacity: 'invalid',
    });

    const normalized = normalizePaintOpacity(paint);

    expect(normalized).toEqual({ ...paint, opacity: 100 });
    for (const key of Object.keys(paint).filter(key => key !== 'opacity')) {
      expect(normalized[key]).toBe(paint[key]);
    }
    expect(paint.opacity).toBe('invalid');
    expect(Object.prototype.hasOwnProperty.call(paint, INVALID_PAINT_OPACITY)).toBe(false);
    expect(normalized).not.toBe(paint);
    expect(normalizePaintOpacity(paint)).toEqual(normalized);
  });
});
