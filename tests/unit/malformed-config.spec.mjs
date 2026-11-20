import { describe, expect, it, vi } from 'vitest';
import { createCard, loadCardClass } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { buildBarRenderModel, getColor } from '../../src/view-model/bar-render-model.js';
import { formatNumericDisplay } from '../../src/utils/format.js';

const sensor = { state: '42', attributes: { friendly_name: 'Power', unit_of_measurement: 'W' } };

function cardWith(config) {
  const card = createCard();
  card._hass.states['sensor.power'] = sensor;
  return { card, config: card.normalizeCardConfig(config) };
}

describe('malformed configuration recovery', () => {
  it('ignores null legacy Gradient Stops and keeps a safe sampled color', () => {
    const { card, config } = cardWith({
      entity: 'sensor.power',
      color_mode: 'gradient',
      gradient_stops: [null, { pos: 100, color: '#ffffff' }],
    });
    const row = config.entities[0];

    expect(() => getColor(50, row, 0, 100)).not.toThrow();
    expect(getColor(50, row, 0, 100)).toBe('rgb(255,255,255)');
    expect(() => card._buildRow(row, '42', 'W', 42, '#4a9eff', null, null, null, null, '#888', '#888', 0, 100)).not.toThrow();
    expect(validateNormalizedConfig(config).warnings.map(item => item.code)).toContain('gradient_stops.invalid_stop');
  });

  it('falls back to the configured color when every legacy Gradient Stop is unusable', () => {
    const { config } = cardWith({
      entity: 'sensor.power',
      color_mode: 'gradient',
      color: '#123456',
      gradient_stops: [null, { pos: 100, color: '' }],
    });
    expect(getColor(50, config.entities[0], 0, 100)).toBe('#123456');
  });

  it('accepts only safe decimal precision and keeps valid precision unchanged', () => {
    const { card, config } = cardWith({ entities: [{ entity: 'sensor.power', decimal: 'x' }] });
    const row = config.entities[0];

    expect(row.formatting.decimal).toBeNull();
    expect(row.decimal_invalid).toBe(true);
    expect(validateNormalizedConfig(config).warnings.map(item => item.code)).toContain('formatting.invalid_decimal');
    expect(() => card._buildRow(row, '42', 'W', 42, '#4a9eff', null, null, null, null, '#888', '#888', 0, 100)).not.toThrow();
    expect(formatNumericDisplay(42, 'x')).toBe((42).toLocaleString());
    expect(formatNumericDisplay(42, 2)).toBe((42).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    const valid = cardWith({ entity: 'sensor.power', decimal: 2 }).config;
    expect(valid.entities[0].formatting.decimal).toBe(2);
    expect(valid.entities[0].decimal_invalid).toBeUndefined();

    const cardInvalid = cardWith({ decimal: 'x', entities: [{ entity: 'sensor.power' }] }).config;
    expect(cardInvalid.decimal_invalid).toBe(true);
    expect(cardInvalid.entities[0].formatting.decimal).toBeNull();
    expect(validateNormalizedConfig(cardInvalid).warnings.map(item => item.code)).toContain('formatting.invalid_decimal');
  });

  it('normalizes malformed entity containers without throwing', () => {
    const card = createCard();
    const config = card.normalizeCardConfig({ entities: {} });

    expect(config.entities).toEqual([]);
    expect(config.entities_invalid).toBe(true);
    expect(validateNormalizedConfig(config).warnings.map(item => item.code)).toContain('entities.invalid_structure');
    const setConfigCard = createCard();
    setConfigCard._render = () => {};
    expect(() => setConfigCard.setConfig({ entities: {} })).not.toThrow();
    expect(setConfigCard._config.entities).toEqual([]);
  });

  it('normalizes malformed entity entries without throwing', () => {
    const card = createCard();
    const config = card.normalizeCardConfig({ entities: [null, 42, { entity: '__proto__' }] });

    expect(config.entities).toHaveLength(3);
    expect(config.entities[2].entity_invalid).toBe(true);
    expect(validateNormalizedConfig(config).warnings.map(item => item.code)).toContain('entities.missing_entity');
  });

  it('reports invalid Feature decimal precision without changing valid formatting', async () => {
    const { feature: Feature } = loadCardClass();
    const element = new Feature();
    vi.spyOn(element, '_render').mockImplementation(() => {});
    element.setConfig({
      type: 'custom:sensor-bar-card-plus-feature',
      entity: 'sensor.power',
      formatting: { decimal: 'x' },
    });
    element.hass = { states: { 'sensor.power': sensor } };
    await element.updateComplete;

    expect(element._baseDiagnostics.warnings.map(item => item.code)).toContain('formatting.invalid_decimal');
    expect(element._resolvedAppearance.formatting.decimal).toBeNull();
    expect(() => buildBarRenderModel({ numericValue: 42, percent: 42, min: 0, max: 100, markers: [], needle: { show: false }, baselinePercent: null },
      element._resolvedAppearance, { height: 30 })).not.toThrow();

    element.setConfig({ type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.power', formatting: { decimal: 2 } });
    element.hass = { states: { 'sensor.power': sensor } };
    await element.updateComplete;
    expect(element._resolvedAppearance.formatting.decimal).toBe(2);
  });

  it('keeps valid normalized formatting unchanged', () => {
    const config = normalizeCardConfig({ entities: [{ entity: 'sensor.power', formatting: { decimal: 0, unit: 'kW' } }] });
    expect(config.entities[0].formatting).toEqual({ decimal: 0, unit: 'kW' });
  });
});
