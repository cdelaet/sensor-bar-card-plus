import { describe, expect, it } from 'vitest';
import { resolveEntitySource, getEntityNumericValue, getNormalizedResolvableNumericValue } from '../../src/config/resolve.js';

describe('resolveEntitySource', () => {
  const hass = { states: {
    'sensor.example': { state: '42', attributes: { amount: 12, amount_text: 'Ready', amount_null: null } },
    'sensor.unavailable': { state: 'unavailable', attributes: { amount: 99 } },
    'sensor.unknown': { state: 'unknown', attributes: {} },
  } };

  it('returns the raw entity state or top-level attribute without coercion', () => {
    expect(resolveEntitySource(hass, 'sensor.example')).toMatchObject({
      value: '42', found: true, available: true, attributeFound: true,
    });
    expect(resolveEntitySource(hass, 'sensor.example', 'amount')).toMatchObject({
      value: 12, found: true, available: true, attributeFound: true,
    });
    expect(resolveEntitySource(hass, 'sensor.example', 'amount_text')).toMatchObject({
      value: 'Ready', attributeFound: true,
    });
  });

  it('distinguishes a missing attribute from one present with null', () => {
    expect(resolveEntitySource(hass, 'sensor.example', 'missing')).toMatchObject({
      value: undefined, found: true, available: true, attributeFound: false,
    });
    expect(resolveEntitySource(hass, 'sensor.example', 'amount_null')).toMatchObject({
      value: null, found: true, available: true, attributeFound: true,
    });
  });

  it('reports missing and unavailable sources without exposing stale attributes as available', () => {
    expect(resolveEntitySource(hass, 'sensor.absent')).toMatchObject({
      stateObj: null, found: false, available: false, attributeFound: false,
    });
    expect(resolveEntitySource(hass, 'sensor.unavailable', 'amount')).toMatchObject({
      value: 99, found: true, available: false, attributeFound: true,
    });
    expect(resolveEntitySource(hass, 'sensor.unknown', 'amount')).toMatchObject({
      found: true, available: false, attributeFound: false,
    });
    expect(getEntityNumericValue(hass, 'sensor.unavailable', 'amount')).toBeNull();
  });

  it('keeps numeric coercion in the existing numeric wrapper', () => {
    const numericText = { states: { 'sensor.text': { state: 'state', attributes: { value: '12.5' } } } };
    expect(resolveEntitySource(numericText, 'sensor.text', 'value').value).toBe('12.5');
    expect(getEntityNumericValue(numericText, 'sensor.text', 'value')).toBe(12.5);
  });

  it('treats an attribute value of zero as present and applies fixed only to unusable values', () => {
    const sources = { states: {
      'sensor.zero': { state: 'ready', attributes: { value: 0 } },
      'sensor.text': { state: 'unavailable', attributes: { value: 'not numeric' } },
    } };
    const resolvable = { entity: 'sensor.zero', attribute: 'value', fixed: 20 };
    expect(getNormalizedResolvableNumericValue(sources, resolvable)).toBe(0);
    expect(getNormalizedResolvableNumericValue(sources, { ...resolvable, entity: 'sensor.text' })).toBe(20);
    expect(getNormalizedResolvableNumericValue(sources, { ...resolvable, entity: 'sensor.missing' })).toBe(20);
  });
});
