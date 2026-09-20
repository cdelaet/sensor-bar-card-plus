import { describe, expect, it } from 'vitest';
import {
  createNumericPresentation,
  createTextPresentation,
  formatNumericDisplay,
} from '../../src/utils/format.js';

describe('numeric presentation formatting', () => {
  it('preserves the current trimmed decimal behavior', () => {
    expect(formatNumericDisplay(42, 2)).toBe('42');
    expect(formatNumericDisplay(42.5, 2)).toBe('42.5');
    expect(formatNumericDisplay(42.567, 2)).toMatch(/^42[.,]57$/);
  });

  it('delegates unrounded locale/grouping behavior to the platform', () => {
    expect(formatNumericDisplay(1234567.5)).toBe((1234567.5).toLocaleString());
  });

  it('keeps numeric values, numbers, and units separate', () => {
    expect(createNumericPresentation(42, 'W', 2)).toEqual({
      value: 42,
      number: '42',
      unit: 'W',
      text: '42 W',
    });
    expect(createNumericPresentation(43, 's', null).text).toBe('43s');
  });

  it('keeps textual states unitless', () => {
    expect(createTextPresentation('unavailable')).toEqual({
      value: null,
      number: 'unavailable',
      unit: '',
      text: 'unavailable',
    });
  });
});
