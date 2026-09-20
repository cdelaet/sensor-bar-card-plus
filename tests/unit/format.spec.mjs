import { describe, expect, it } from 'vitest';
import {
  createNumericPresentation,
  createTextPresentation,
  formatNumericDisplay,
} from '../../src/utils/format.js';

describe('numeric presentation formatting', () => {
  it('formats explicit decimals with fixed trailing zeroes', () => {
    expect(formatNumericDisplay(42, 2)).toBe('42.00');
    expect(formatNumericDisplay(100.8, 2)).toBe('100.80');
    expect(formatNumericDisplay(35.01, 2)).toBe('35.01');
  });

  it('rounds explicit decimals for negative values and zero', () => {
    expect(formatNumericDisplay(42.567, 2)).toBe('42.57');
    expect(formatNumericDisplay(-42.567, 2)).toBe('-42.57');
    expect(formatNumericDisplay(0, 2)).toBe('0.00');
    expect(formatNumericDisplay(42.6, 0)).toBe('43');
  });

  it('delegates unrounded locale/grouping behavior to the platform', () => {
    expect(formatNumericDisplay(1234567.5)).toBe((1234567.5).toLocaleString());
  });

  it('keeps explicit precision locale-aware for large values', () => {
    const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    expect(formatNumericDisplay(1234567.5, 2)).toBe(
      (1234567.5).toLocaleString(undefined, options)
    );
  });

  it('keeps numeric values, numbers, and units separate', () => {
    expect(createNumericPresentation(42, 'W', 2)).toEqual({
      value: 42,
      number: '42.00',
      unit: 'W',
      text: '42.00 W',
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
