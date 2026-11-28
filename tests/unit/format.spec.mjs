import { describe, expect, it } from 'vitest';
import {
  createNumericPresentation,
  createTextPresentation,
  formatNumericDisplay,
} from '../../src/utils/format.js';
import testLocale from '../support/test-locale.cjs';

describe('numeric presentation formatting', () => {
  it('uses the canonical test locale', () => {
    expect(new Intl.NumberFormat().resolvedOptions().locale).toBe(testLocale.testLocale);
  });

  it('formats explicit decimals with fixed trailing zeroes', () => {
    expect(formatNumericDisplay(42, 2)).toBe('42,00');
    expect(formatNumericDisplay(100.8, 2)).toBe('100,80');
    expect(formatNumericDisplay(35.01, 2)).toBe('35,01');
  });

  it('rounds explicit decimals for negative values and zero', () => {
    expect(formatNumericDisplay(42.567, 2)).toBe('42,57');
    expect(formatNumericDisplay(-42.567, 2)).toBe('-42,57');
    expect(formatNumericDisplay(0, 2)).toBe('0,00');
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

  it('honors each Home Assistant number format', () => {
    const number = -1234567.89;
    const cases = [
      [{ language: 'nl-BE', number_format: 'comma_decimal' }, 'en-US'],
      [{ language: 'en-US', number_format: 'decimal_comma' }, 'de'],
      [{ language: 'en-US', number_format: 'space_comma' }, 'fr'],
      [{ language: 'en-US', number_format: 'quote_decimal' }, 'de-CH'],
      [{ language: 'en-US', number_format: 'none' }, 'en-US'],
      [{ language: 'fr-FR', number_format: 'language' }, 'fr-FR'],
    ];
    for (const [locale, intlLocale] of cases) {
      const options = { maximumFractionDigits: 2, ...(locale.number_format === 'none' ? { useGrouping: false } : {}) };
      expect(formatNumericDisplay(number, null, locale)).toBe(number.toLocaleString(intlLocale, options));
    }
    expect(formatNumericDisplay(number, 1, { number_format: 'decimal_comma' })).toBe('-1.234.567,9');
    expect(formatNumericDisplay(0, 2, { number_format: 'decimal_comma' })).toBe('0,00');
    expect(formatNumericDisplay(Number.NaN, 2, { number_format: 'none' })).toBe('NaN');
    expect(formatNumericDisplay('user text', null, { number_format: 'decimal_comma' })).toBe('user text');
  });

  it('uses system locale and language fallback when Home Assistant selects them', () => {
    expect(formatNumericDisplay(1234.5, null, { language: 'fr-FR', number_format: 'language' }))
      .toBe((1234.5).toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
    expect(formatNumericDisplay(1234.5, null, { language: 'fr-FR', number_format: 'system' }))
      .toBe((1234.5).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  });

  it('keeps numeric values, numbers, and units separate', () => {
    expect(createNumericPresentation(42, 'W', 2)).toEqual({
      value: 42,
      number: '42,00',
      unit: 'W',
      text: '42,00 W',
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
