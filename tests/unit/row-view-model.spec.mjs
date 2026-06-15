import { describe, expect, it } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';

function sensor(state, attrs = {}) {
  return {
    state: String(state),
    attributes: {
      friendly_name: attrs.friendly_name ?? 'Sensor',
      icon: attrs.icon ?? 'mdi:flash',
      unit_of_measurement: attrs.unit_of_measurement ?? 'W',
      ...attrs,
    },
  };
}

function createNormalizedEntity(rawConfig, index = 0) {
  const card = createCard();
  const config = card.normalizeCardConfig(rawConfig);
  return config.entities[index];
}

function normalizeDecimalString(value) {
  return String(value).replace(',', '.');
}

describe('buildRowViewModel', () => {
  it('builds basic runtime row state from a normalized entity config', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42.5, {
          friendly_name: 'Grid Power',
          icon: 'mdi:transmission-tower',
        }),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      decimal: 1,
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.entityId).toBe('sensor.power');
    expect(row.name).toBe('Grid Power');
    expect(row.icon).toBe('mdi:transmission-tower');
    expect(row.state).toBe('42.5');
    expect(row.numericValue).toBe(42.5);
    expect(row.min).toBe(0);
    expect(row.max).toBe(100);
    expect(row.percent).toBe(42.5);
    expect(normalizeDecimalString(row.displayValue)).toBe('42.5');
    expect(row.rawUnit).toBe('W');
    expect(row.displayUnit).toBe('W');
    expect(row.unit).toBe('W');
    expect(row.attributes.entity).toBe('sensor.power');
  });

  it('preserves non-numeric states the same way the card does', () => {
    const hass = {
      states: {
        'sensor.status': sensor('unavailable', {
          friendly_name: 'Status',
          unit_of_measurement: 'W',
        }),
      },
    };
    const entityConfig = createNormalizedEntity({
      entities: [{ entity: 'sensor.status' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.status'],
      peaks: {},
    });

    expect(row.numericValue).toBeNull();
    expect(row.percent).toBe(0);
    expect(row.displayValue).toBe('unavailable');
    expect(row.rawUnit).toBe('W');
    expect(row.displayUnit).toBe('');
    expect(row.unit).toBe('');
    expect(row.targetVisible).toBe(false);
    expect(row.baselineVisible).toBe(false);
    expect(row.needle.show).toBe(false);
  });

  it('preserves rawUnit while displayUnit follows rendered numeric unit behavior', () => {
    const hass = {
      states: {
        'sensor.duration': sensor(15, {
          friendly_name: 'Duration',
          unit_of_measurement: 'min',
        }),
        'sensor.textual': sensor('idle', {
          friendly_name: 'Textual',
          unit_of_measurement: 'kWh',
        }),
      },
    };
    const numericEntityConfig = createNormalizedEntity({
      formatting: { unit: 'h' },
      entities: [{ entity: 'sensor.duration' }],
    });
    const textualEntityConfig = createNormalizedEntity({
      formatting: { unit: 'MWh' },
      entities: [{ entity: 'sensor.textual' }],
    });

    const numericRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: numericEntityConfig,
      entityState: hass.states['sensor.duration'],
      peaks: {},
    });
    const textualRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: textualEntityConfig,
      entityState: hass.states['sensor.textual'],
      peaks: {},
    });

    expect(numericRow.rawUnit).toBe('min');
    expect(numericRow.displayUnit).toBe('h');
    expect(numericRow.unit).toBe('h');
    expect(textualRow.rawUnit).toBe('kWh');
    expect(textualRow.displayUnit).toBe('');
    expect(textualRow.unit).toBe('');
  });

  it('resolves fixed target values and formats target display with decimals and unit', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42.5, { unit_of_measurement: 'kW' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      decimal: 1,
      min: 0,
      max: 100,
      target: { at: { fixed: 55.25 }, label: { show: true } },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBe(55.25);
    expect(row.targetPercent).toBe(55.25);
    expect(row.targetVisible).toBe(true);
    expect(normalizeDecimalString(row.targetDisplay)).toBe('55.3 kW');
  });

  it('resolves dynamic target entities', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.target': sensor(75),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      target_entity: 'sensor.target',
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBe(75);
    expect(row.targetPercent).toBe(75);
    expect(row.targetVisible).toBe(true);
  });

  it('resolves fixed and dynamic baseline values', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.baseline': sensor(10),
      },
    };
    const fixedEntityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      baseline: 25,
      entities: [{ entity: 'sensor.power' }],
    });
    const dynamicEntityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      baseline: 'sensor.baseline',
      entities: [{ entity: 'sensor.power' }],
    });

    const fixedRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: fixedEntityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });
    const dynamicRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: dynamicEntityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(fixedRow.baseline).toBe(25);
    expect(fixedRow.baselinePercent).toBe(25);
    expect(fixedRow.baselineVisible).toBe(true);
    expect(dynamicRow.baseline).toBe(10);
    expect(dynamicRow.baselinePercent).toBe(10);
    expect(dynamicRow.baselineVisible).toBe(true);
  });

  it('derives visible peak state from the provided peak cache without mutating it', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
      },
    };
    const peaks = { 'sensor.power': 60 };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      show_peak: true,
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks,
    });

    expect(row.peak).toBe(60);
    expect(row.peakPercent).toBe(60);
    expect(row.peakVisible).toBe(true);
    expect(row.peakDisplay).toBe('60');
    expect(peaks).toEqual({ 'sensor.power': 60 });
  });

  it('reflects normalized per-entity overrides in the derived row state', () => {
    const hass = {
      states: {
        'sensor.power': sensor(4.25, {
          friendly_name: 'Grid',
          unit_of_measurement: 'W',
        }),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 1, unit: 'W' },
      bar: { color: '#111111', fill_style: 'soft_bands' },
      entities: [{
        entity: 'sensor.power',
        name: 'Grid Import',
        icon: 'mdi:home-lightning-bolt',
        formatting: { decimal: 2, unit: 'kW' },
        bar: {
          color: '#222222',
          fill_style: 'gradient',
          gradient_stops: [
            { pos: 0, color: '#111111' },
            { pos: 100, color: '#eeeeee' },
          ],
        },
      }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.name).toBe('Grid Import');
    expect(row.icon).toBe('mdi:home-lightning-bolt');
    expect(normalizeDecimalString(row.displayValue)).toBe('4.25');
    expect(row.unit).toBe('kW');
    expect(row.barColor).toBe('#222222');
    expect(row.fillStyle).toBe('gradient');
    expect(row.gradientStops).toEqual([
      { pos: 0, color: '#111111' },
      { pos: 100, color: '#eeeeee' },
    ]);
  });

  it('exposes normalized segment config when present', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
      },
    };
    const entityConfig = createNormalizedEntity({
      entities: [{
        entity: 'sensor.power',
      }],
      bar: {
        fill_style: 'bands',
        segments: [
          { from: '0%', to: '20%', color: '#00ff00' },
          { from: '20%', to: '100%', color: '#ff0000' },
        ],
      },
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.fillStyle).toBe('bands');
    expect(row.segments).toEqual(entityConfig.bar.segments);
  });

  it('computes enabled needle patch fields from the resolved scale position', () => {
    const card = createCard();
    const hass = {
      states: {
        'sensor.power': sensor(25),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.power',
        bar: {
          needle: {
            show: true,
            color: '#ffffff',
          },
        },
      }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.needle.show).toBe(true);
    expect(row.needle.percent).toBe(25);
    expect(row.needle.pct).toBe(25);
    expect(row.needle.borderColor).toBe(card._getNeedleBorderColor('#ffffff'));
    expect(row.needle.edge).toBe('middle');
  });

  it('computes needle edge states at the left and right bounds', () => {
    const leftHass = {
      states: {
        'sensor.left': sensor(0),
      },
    };
    const rightHass = {
      states: {
        'sensor.right': sensor(100),
      },
    };
    const leftEntityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.left',
        bar: {
          needle: {
            show: true,
            color: '#ff9800',
          },
        },
      }],
    });
    const rightEntityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.right',
        bar: {
          needle: {
            show: true,
            color: '#111111',
          },
        },
      }],
    });

    const leftRow = buildRowViewModel({
      hass: leftHass,
      cardConfig: null,
      entityConfig: leftEntityConfig,
      entityState: leftHass.states['sensor.left'],
      peaks: {},
    });
    const rightRow = buildRowViewModel({
      hass: rightHass,
      cardConfig: null,
      entityConfig: rightEntityConfig,
      entityState: rightHass.states['sensor.right'],
      peaks: {},
    });

    expect(leftRow.needle.show).toBe(true);
    expect(leftRow.needle.pct).toBe(0);
    expect(leftRow.needle.edge).toBe('left');
    expect(rightRow.needle.show).toBe(true);
    expect(rightRow.needle.pct).toBe(100);
    expect(rightRow.needle.edge).toBe('right');
  });

  it('keeps needle patch fields stable when needle rendering is disabled', () => {
    const card = createCard();
    const hass = {
      states: {
        'sensor.power': sensor(40),
      },
    };
    const baselineEntityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      baseline: 20,
      entities: [{
        entity: 'sensor.power',
        bar: {
          needle: {
            show: true,
            color: '#000000',
          },
        },
      }],
    });
    const hiddenEntityConfig = createNormalizedEntity({
      entities: [{
        entity: 'sensor.power',
        bar: {
          needle: {
            show: false,
            color: '#ffffff',
          },
        },
      }],
    });

    const baselineRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: baselineEntityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });
    const hiddenRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: hiddenEntityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(baselineRow.needle.show).toBe(false);
    expect(baselineRow.needle.pct).toBeNull();
    expect(baselineRow.needle.edge).toBe('middle');
    expect(baselineRow.needle.borderColor).toBe(card._getNeedleBorderColor('#000000'));
    expect(hiddenRow.needle.show).toBe(false);
    expect(hiddenRow.needle.pct).toBeNull();
    expect(hiddenRow.needle.edge).toBe('middle');
    expect(hiddenRow.needle.borderColor).toBe(card._getNeedleBorderColor('#ffffff'));
  });

  it('does not mutate the provided inputs', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.target': sensor(55),
      },
    };
    const cardConfig = {
      formatting: { decimal: 1 },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 1 },
      target_entity: 'sensor.target',
      entities: [{ entity: 'sensor.power' }],
    });
    const entityState = hass.states['sensor.power'];
    const peaks = { 'sensor.power': 48 };

    const before = JSON.stringify({
      cardConfig,
      entityConfig,
      entityState,
      peaks,
    });

    buildRowViewModel({
      hass,
      cardConfig,
      entityConfig,
      entityState,
      peaks,
    });

    expect(JSON.stringify({
      cardConfig,
      entityConfig,
      entityState,
      peaks,
    })).toBe(before);
  });
});
