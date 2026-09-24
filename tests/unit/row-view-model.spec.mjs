import { describe, expect, it } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { formatNumericDisplay } from '../../src/utils/format.js';

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
    expect(row.primaryPresentation).toEqual({
      value: 42.5,
      number: row.displayValue,
      unit: 'W',
      text: '42.5 W',
    });
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
    expect(row.primaryPresentation).toEqual({
      value: null,
      number: 'unavailable',
      unit: '',
      text: 'unavailable',
    });
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

  it('keeps tracked Peak and Floor units through unavailable states and recovery', () => {
    const card = createCard();
    const config = card.normalizeCardConfig({
      formatting: { unit: 'W' },
      entities: [{
        entity: 'sensor.power',
        peak: { enabled: true, label: { show: true } },
        floor: { enabled: true, label: { show: true } },
      }],
    });
    const entityConfig = config.entities[0];
    const state = {
      state: '80',
      last_updated: '2026-01-01T10:07:00.000Z',
      attributes: { unit_of_measurement: 'W' },
    };
    card._updateExtrema(entityConfig, entityConfig, state);
    state.state = '20';
    state.last_updated = '2026-01-01T10:08:00.000Z';
    card._updateExtrema(entityConfig, entityConfig, state);

    for (const unavailableState of ['unavailable', 'unknown']) {
      state.state = unavailableState;
      state.last_updated = unavailableState === 'unavailable'
        ? '2026-01-01T10:09:00.000Z'
        : '2026-01-01T10:10:00.000Z';
      const row = buildRowViewModel({
        hass: { states: { 'sensor.power': state } },
        cardConfig: config,
        entityConfig,
        entityState: state,
        extrema: card._extrema['sensor.power'],
      });

      expect(row.primaryPresentation.text).toBe(unavailableState);
      expect(row.primaryPresentation.unit).toBe('');
      expect(row.peakPresentation.text).toBe('80 W');
      expect(row.floorPresentation.text).toBe('20 W');
    }

    state.state = '42';
    state.last_updated = '2026-01-01T10:11:00.000Z';
    card._updateExtrema(entityConfig, entityConfig, state);
    const recoveredRow = buildRowViewModel({
      hass: { states: { 'sensor.power': state } },
      cardConfig: config,
      entityConfig,
      entityState: state,
      extrema: card._extrema['sensor.power'],
    });
    expect(recoveredRow.primaryPresentation.text).toBe('42 W');
    expect(recoveredRow.peakPresentation.text).toBe('80 W');
    expect(recoveredRow.floorPresentation.text).toBe('20 W');
  });

  it('retains the effective row unit for generic labels while the primary state is unavailable or unknown', () => {
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 0 },
      markers: [{ at: { entity: 'sensor.limit' }, label: { show: true } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const limit = sensor(35, { unit_of_measurement: 'MW' });

    for (const primaryState of ['unavailable', 'unknown']) {
      const primary = sensor(primaryState, { unit_of_measurement: 'W' });
      const hass = { states: { 'sensor.power': primary, 'sensor.limit': limit } };
      const row = buildRowViewModel({
        hass,
        cardConfig: null,
        entityConfig,
        entityState: primary,
      });

      expect(row.primaryPresentation.text).toBe(primaryState);
      expect(row.primaryPresentation.unit).toBe('');
      expect(row.markers.find((marker) => marker.id === 'generic-0')).toMatchObject({
        visible: true,
        value: 35,
        label: { text: '35 W' },
      });
    }
  });

  it('resolves fixed target values and formats target display with decimals and unit', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42.5, { unit_of_measurement: 'kW' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      min: 0,
      max: 100,
      target: { at: { fixed: 55.25 }, label: { show: true, decimal: 1 } },
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
    expect(normalizeDecimalString(row.displayValue)).toBe('42.50');
    expect(normalizeDecimalString(row.targetDisplay)).toBe('55.3 kW');
    expect(row.targetPresentation).toEqual({
      value: 55.25,
      number: formatNumericDisplay(row.target, 1),
      unit: 'kW',
      text: row.targetDisplay,
    });
  });

  it('inherits primary precision for target and peak presentations when no override is set', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42, { unit_of_measurement: 'kW' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      min: 0,
      max: 100,
      target: { at: { fixed: 55 }, label: { show: true } },
      peak: { enabled: true },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: { 'sensor.power': 48 },
    });

    expect(row.primaryPresentation.text).toBe('42.00 kW');
    expect(row.targetPresentation.text).toBe('55.00 kW');
    expect(row.peakPresentation.text).toBe('48.00 kW');
  });

  it('builds shared target and peak marker models with canonical lanes', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42, { unit_of_measurement: 'kW' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      target: { at: { fixed: 55 }, label: { show: true } },
      peak: { enabled: true, color: '#123456' },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: { 'sensor.power': 48 },
    });

    const targetMarker = row.markers.find((marker) => marker.type === 'target');
    const peakMarker = row.markers.find((marker) => marker.type === 'peak');
    expect(targetMarker).toEqual(expect.objectContaining({
      id: 'target',
      lane: 'below',
      value: 55,
      visible: true,
      label: row.targetLabelPresentation,
      labelVisible: true,
      shape: 'diamond',
    }));
    expect(targetMarker.position).toBeCloseTo(55);
    expect(peakMarker).toEqual(expect.objectContaining({
      id: 'peak',
      lane: 'above',
      value: 48,
      position: 48,
      visible: true,
      color: '#123456',
      shape: 'triangle',
    }));
    expect(row.markerLaneOccupancy).toEqual({ above: true, below: true });
  });

  it('resolves generic percentages against the effective scale and formats resolved values', () => {
    const hass = { states: { 'sensor.power': sensor(180) } };
    const config = {
      scale: { min: { fixed: 100 }, max: { fixed: 300 } },
      formatting: { decimal: 1 },
      markers: [
        { at: '0%', label: { show: true } },
        { at: '35%', lane: 'above', label: { show: true, precision: 0, show_unit: true } },
        { at: '100%', lane: 'above', label: { show: true, show_unit: false } },
      ],
      entities: [{ entity: 'sensor.power' }],
    };
    const entityConfig = createNormalizedEntity(config);
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
    });
    const markers = row.markers.filter((marker) => marker.type === 'generic');

    expect(markers.map(({ value, position }) => ({ value, position }))).toEqual([
      { value: 100, position: 0 },
      { value: 170, position: 35 },
      { value: 300, position: 100 },
    ]);
    expect(markers.map((marker) => marker.label?.text)).toEqual(['100.0 W', '170 W', '300.0']);

    const changedScaleConfig = createNormalizedEntity({
      ...config,
      scale: { min: { fixed: 0 }, max: { fixed: 400 } },
    });
    const changedScaleRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: changedScaleConfig,
      entityState: hass.states['sensor.power'],
    });
    expect(changedScaleRow.markers.find((marker) => marker.id === 'generic-1')).toMatchObject({
      value: 140,
      position: 35,
      label: { text: '140 W' },
    });
  });

  it('composes marker label text, value, and unit independently with defaults and precision', () => {
    const hass = { states: { 'sensor.power': sensor(42, { unit_of_measurement: 'W' }) } };
    const cases = [
      [{ show: true }, '8.8 W'],
      [{ show: true, text: 'Max', precision: 1 }, 'Max 8.8 W'],
      [{ show: true, text: 'Trigger', show_unit: false }, 'Trigger 8.8'],
      [{ show: true, text: 'Low', show_value: false }, 'Low W'],
      [{ show: true, text: 'Prediction', show_value: false, show_unit: false }, 'Prediction'],
      [{ show: true, show_unit: false, precision: 3 }, '8.765'],
      [{ show: true, show_value: false, text: '', show_unit: true }, 'W'],
      [{ show: true, show_value: false, show_unit: false }, ''],
    ];

    for (const [label, expected] of cases) {
      const entityConfig = createNormalizedEntity({
        scale: { min: { fixed: 0 }, max: { fixed: 100 } },
        formatting: { decimal: 1 },
        markers: [{ at: { fixed: 8.765 }, label }],
        entities: [{ entity: 'sensor.power' }],
      });
      const row = buildRowViewModel({ hass, entityConfig, entityState: hass.states['sensor.power'] });
      const marker = row.markers.find((entry) => entry.id === 'generic-0');
      expect(marker.label?.text).toBe(expected);
      expect(marker.labelVisible).toBe(expected !== '');
    }
  });

  it('composes Target, Peak, and Floor labels and inherits independent label options', () => {
    const hass = { states: { 'sensor.power': sensor(42, { unit_of_measurement: 'kW' }) } };
    const config = {
      scale: { min: { fixed: 0 }, max: { fixed: 100 } },
      formatting: { decimal: 2 },
      target: { at: { fixed: 34.567 }, label: { show: true, text: 'Target', precision: 1 } },
      peak: { enabled: true, label: { show: true, text: 'Max', precision: 0 } },
      floor: { enabled: true, label: { show: true, text: 'Min', show_value: false } },
      entities: [{ entity: 'sensor.power' }],
    };
    const entityConfig = createNormalizedEntity(config);
    const row = buildRowViewModel({
      hass,
      entityConfig,
      entityState: hass.states['sensor.power'],
      extrema: { peak: { value: 80 }, floor: { value: 12 } },
    });
    expect(row.markers.find((marker) => marker.type === 'target').label.text).toBe('Target 34.6 kW');
    expect(row.markers.find((marker) => marker.type === 'peak').label.text).toBe('Max 80 kW');
    expect(row.markers.find((marker) => marker.type === 'floor').label.text).toBe('Min kW');

    const inheritedConfig = createNormalizedEntity({
      target: { at: 30, label: { show: true, text: 'Goal', show_unit: true, precision: 1 } },
      peak: { enabled: true, label: { show: true, text: 'High', show_value: true } },
      entities: [{ entity: 'sensor.power', target: { label: { show_value: false } }, peak: { label: { show_unit: false } } }],
    });
    const inheritedRow = buildRowViewModel({
      hass,
      entityConfig: inheritedConfig,
      entityState: hass.states['sensor.power'],
      extrema: { peak: { value: 80 } },
    });
    expect(inheritedRow.markers.find((marker) => marker.type === 'target').label.text).toBe('Goal kW');
    expect(inheritedRow.markers.find((marker) => marker.type === 'peak').label.text).toBe('High 80');

    const emptyConfig = createNormalizedEntity({
      target: { at: 30, label: { show: true, show_value: false, show_unit: false } },
      peak: { enabled: true, label: { show: true, show_value: false, show_unit: false } },
      floor: { enabled: true, label: { show: true, show_value: false, show_unit: false } },
      markers: [{ at: 15, label: { show: true, show_value: false, show_unit: false } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const emptyRow = buildRowViewModel({
      hass,
      entityConfig: emptyConfig,
      entityState: hass.states['sensor.power'],
      extrema: { peak: { value: 80 }, floor: { value: 12 } },
    });
    expect(emptyRow.markers.map((marker) => marker.labelVisible)).toEqual([false, false, false, false]);
    expect(emptyRow.markerLabelLaneOccupancy).toEqual({ above: false, below: false });
  });

  it('does not treat the removed generic label unit key as an alias for show_unit', () => {
    const hass = { states: { 'sensor.power': sensor(20, { unit_of_measurement: 'W' }) } };
    const entityConfig = createNormalizedEntity({
      markers: [{ at: 10, label: { show: true, unit: false } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({ hass, entityConfig, entityState: hass.states['sensor.power'] });
    expect(row.markers.find((marker) => marker.type === 'generic').label.text).toBe('10 W');
  });

  it('uses row units for dynamic values and fallbacks while clamping only off-scale positions', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42, { unit_of_measurement: 'W' }),
        'sensor.threshold': sensor(25, { unit_of_measurement: 'MW' }),
        'sensor.low': sensor(-20, { unit_of_measurement: 'MW' }),
        'sensor.high': sensor(140, { unit_of_measurement: 'MW' }),
      },
    };
    const config = createNormalizedEntity({
      scale: { min: { fixed: 0 }, max: { fixed: 100 } },
      formatting: { decimal: 1, unit: 'kW' },
      markers: [
        { at: { entity: 'sensor.low' }, lane: 'above', label: { show: true } },
        { at: { entity: 'sensor.high' }, lane: 'above', label: { show: true } },
        { at: { entity: 'sensor.threshold', fixed: 75 }, label: { show: true } },
      ],
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: config,
      entityState: hass.states['sensor.power'],
    });
    const markers = row.markers.filter((marker) => marker.type === 'generic');

    expect(markers.map(({ value, position, label }) => ({ value, position, label: label?.text }))).toEqual([
      { value: -20, position: 0, label: '-20.0 kW' },
      { value: 140, position: 100, label: '140.0 kW' },
      { value: 25, position: 25, label: '25.0 kW' },
    ]);

    const fallbackHass = {
      ...hass,
      states: { ...hass.states, 'sensor.threshold': sensor('unavailable', { unit_of_measurement: 'MW' }) },
    };
    const fallbackRow = buildRowViewModel({
      hass: fallbackHass,
      cardConfig: null,
      entityConfig: config,
      entityState: fallbackHass.states['sensor.power'],
    });
    expect(fallbackRow.markers.find((marker) => marker.id === 'generic-2')).toMatchObject({
      value: 75,
      position: 75,
      label: { text: '75.0 kW' },
    });
  });

  it('prefers finite dynamic values, falls back when unavailable, and recovers without changing units', () => {
    const config = createNormalizedEntity({
      scale: { min: { fixed: 0 }, max: { fixed: 100 } },
      formatting: { unit: 'W', decimal: 0 },
      markers: [
        { at: { entity: 'sensor.dynamic', fixed: 50 }, label: { show: true, show_unit: false } },
        { at: { entity: 'sensor.unresolved' }, lane: 'above', label: { show: true } },
      ],
      entities: [{ entity: 'sensor.power' }],
    });
    const makeRow = (dynamicState, unresolvedState) => {
      const hass = {
        states: {
          'sensor.power': sensor(20),
          'sensor.dynamic': sensor(dynamicState, { unit_of_measurement: 'kW' }),
          'sensor.unresolved': sensor(unresolvedState),
        },
      };
      return buildRowViewModel({
        hass,
        cardConfig: null,
        entityConfig: config,
        entityState: hass.states['sensor.power'],
      });
    };

    const dynamicRow = makeRow(65, 'unavailable');
    expect(dynamicRow.markers.find((marker) => marker.id === 'generic-0')).toMatchObject({
      value: 65,
      position: 65,
      label: { text: '65' },
    });
    expect(dynamicRow.markerLaneOccupancy.above).toBe(true);

    const fallbackRow = makeRow('unavailable', 'unknown');
    expect(fallbackRow.markers.find((marker) => marker.id === 'generic-0')).toMatchObject({
      value: 50,
      position: 50,
      label: { text: '50' },
    });
    expect(fallbackRow.markers.find((marker) => marker.id === 'generic-1')).toMatchObject({
      visible: false,
      value: null,
      label: { text: 'W' },
    });

    const recoveredRow = makeRow(72, '35');
    expect(recoveredRow.markers.find((marker) => marker.id === 'generic-0').value).toBe(72);
    expect(recoveredRow.markers.find((marker) => marker.id === 'generic-1')).toMatchObject({
      visible: true,
      value: 35,
      label: { text: '35 W' },
    });
  });

  it('keeps unresolved generic markers hidden while reserving their configured lanes', () => {
    const hass = { states: { 'sensor.power': sensor(42), 'sensor.limit': sensor('unknown') } };
    const entityConfig = createNormalizedEntity({
      markers: [{ at: { entity: 'sensor.limit' }, lane: 'above', label: { show: true } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
    });
    expect(row.markers.find((marker) => marker.id === 'generic-0')).toMatchObject({
      value: null,
      position: null,
      visible: false,
      labelVisible: true,
    });
    expect(row.markerLaneOccupancy).toEqual({ above: true, below: false });
  });

  it('keeps configured marker lanes occupied while runtime values are unresolved', () => {
    const entityConfig = createNormalizedEntity({
      target: { at: { entity: 'sensor.target' }, label: { show: true } },
      peak: { enabled: true },
      entities: [{ entity: 'sensor.power' }],
    });
    const unavailableHass = {
      states: {
        'sensor.power': sensor('unavailable'),
        'sensor.target': sensor('unavailable'),
      },
    };
    const recoveredHass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.target': sensor(55),
      },
    };

    const unavailableRow = buildRowViewModel({
      hass: unavailableHass,
      cardConfig: null,
      entityConfig,
      entityState: unavailableHass.states['sensor.power'],
      peaks: {},
    });
    const recoveredRow = buildRowViewModel({
      hass: recoveredHass,
      cardConfig: null,
      entityConfig,
      entityState: recoveredHass.states['sensor.power'],
      peaks: {},
    });

    expect(unavailableRow.markers.find((marker) => marker.type === 'target').visible).toBe(false);
    expect(unavailableRow.markers.find((marker) => marker.type === 'peak').visible).toBe(false);
    expect(unavailableRow.markerLaneOccupancy).toEqual({ above: true, below: true });
    expect(recoveredRow.markerLaneOccupancy).toEqual(unavailableRow.markerLaneOccupancy);
  });

  it('tracks configured label lanes independently of glyph lanes and acceptance', () => {
    const hass = { states: { 'sensor.power': sensor(42), 'sensor.limit': sensor('unknown') } };
    const entityConfig = createNormalizedEntity({
      target: { at: { fixed: 55 } },
      peak: { enabled: true },
      floor: { enabled: true, label: { show: true } },
      markers: [
        { at: 35, lane: 'above' },
        { at: 45, lane: 'above' },
        { at: 55, lane: 'above', label: { show: true } },
        { at: 65, lane: 'below', label: { show: true } },
        { at: 75, lane: 'below', label: { show: true } },
      ],
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
    });

    expect(row.markerLaneOccupancy).toEqual({ above: true, below: true });
    expect(row.markerLabelLaneOccupancy).toEqual({ above: false, below: true });

    const malformedConfig = createNormalizedEntity({
      markers: [{ at: null, lane: 'above', label: { show: true } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const malformedRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig: malformedConfig,
      entityState: hass.states['sensor.power'],
    });
    expect(malformedRow.markerLabelLaneOccupancy).toEqual({ above: false, below: false });
  });

  it('keeps configured generic label-lane occupancy when its source is unresolved', () => {
    const hass = { states: { 'sensor.power': sensor(42), 'sensor.limit': sensor('unavailable') } };
    const entityConfig = createNormalizedEntity({
      markers: [{ at: { entity: 'sensor.limit' }, lane: 'above', label: { show: true } }],
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
    });

    expect(row.markers.find((marker) => marker.id === 'generic-0').visible).toBe(false);
    expect(row.markerLabelLaneOccupancy).toEqual({ above: true, below: false });
  });

  it('resolves dynamic target entities', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.target': sensor(75.6),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      formatting: { decimal: 1 },
      target: { at: { entity: 'sensor.target' }, label: { decimal: 0 } },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBe(75.6);
    expect(row.targetPercent).toBe(75.6);
    expect(row.targetVisible).toBe(true);
    expect(row.displayValue).toBe('42.0');
    expect(row.targetDisplay).toBe('76 W');
  });

  it('keeps percentage target calculations unchanged by target label precision', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      min: 0,
      max: 100,
      target: { at: '55.25%', label: { decimal: 1 } },
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
    expect(row.targetDisplay).toBe('55.3 W');
  });

  it.each([
    [-42.567, '-42.57 W'],
    [0, '0.00 W'],
  ])('formats %s target labels with the explicit fixed precision', (target, expectedDisplay) => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      min: -100,
      max: 100,
      target: { at: { fixed: target }, label: { decimal: 2 } },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBe(target);
    expect(row.targetDisplay).toBe(expectedDisplay);
  });

  it('preserves unavailable dynamic targets without changing primary presentation', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
        'sensor.target': sensor('unavailable'),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      target: { at: { entity: 'sensor.target' }, label: { decimal: 1 } },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBeNull();
    expect(row.targetPresentation).toBeNull();
    expect(row.primaryPresentation.text).toBe('42.00 W');
  });

  it('applies fixed precision consistently to primary, target, and peak presentations', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42, { unit_of_measurement: 'W' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      decimal: 2,
      unit: 'kWh',
      min: 0,
      max: 100,
      target: { at: { fixed: 55.25 }, label: { show: true } },
      show_peak: true,
      entities: [{ entity: 'sensor.power' }],
    });
    const peaks = { 'sensor.power': 42.5 };

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks,
    });

    expect(row.primaryPresentation).toEqual({
      value: 42,
      number: '42.00',
      unit: 'kWh',
      text: '42.00 kWh',
    });
    expect(row.targetPresentation).toEqual({
      value: 55.25,
      number: '55.25',
      unit: 'kWh',
      text: '55.25 kWh',
    });
    expect(row.peakPresentation).toEqual({
      value: 42.5,
      number: '42.50',
      unit: 'kWh',
      text: '42.50 kWh',
    });
  });

  it('allows an entity target-label precision override to inherit the card target', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 2 },
      target: { at: { fixed: 55 }, label: { show: true } },
      entities: [{
        entity: 'sensor.power',
        target: { label: { decimal: 1 } },
      }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.target).toBe(55);
    expect(row.targetPercent).toBeCloseTo(55);
    expect(row.primaryPresentation.text).toBe('42.00 W');
    expect(row.targetPresentation.text).toBe('55.0 W');
  });

  it('applies fixed precision through structured card and entity formatting inheritance', () => {
    const hass = {
      states: {
        'sensor.power': sensor(100.8),
      },
    };
    const entityConfig = createNormalizedEntity({
      formatting: { decimal: 1, unit: 'W' },
      entities: [{
        entity: 'sensor.power',
        formatting: { decimal: 2, unit: 'kW' },
      }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks: {},
    });

    expect(row.primaryPresentation).toEqual({
      value: 100.8,
      number: '100.80',
      unit: 'kW',
      text: '100.80 kW',
    });
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
    expect(row.peakPresentation).toEqual({
      value: 60,
      number: formatNumericDisplay(row.peak, null),
      unit: 'W',
      text: '60 W',
    });
    expect(peaks).toEqual({ 'sensor.power': 60 });
  });

  it('keeps initial and update presentation data equivalent after peak caching', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42.5, { unit_of_measurement: 'kW' }),
        'sensor.target': sensor(55.25, { unit_of_measurement: 'kW' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      decimal: 1,
      min: 0,
      max: 100,
      target_entity: 'sensor.target',
      show_peak: true,
      entities: [{ entity: 'sensor.power' }],
    });
    const peaks = {};

    const initialRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks,
    });
    peaks['sensor.power'] = initialRow.peak;
    const updatedRow = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      peaks,
    });

    expect(updatedRow.primaryPresentation).toEqual(initialRow.primaryPresentation);
    expect(updatedRow.targetPresentation).toEqual(initialRow.targetPresentation);
    expect(updatedRow.peakPresentation).toEqual(initialRow.peakPresentation);
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

  it('builds independent Peak and Floor markers with shared below occupancy', () => {
    const hass = {
      states: {
        'sensor.power': sensor(42, { unit_of_measurement: 'W' }),
      },
    };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      peak: { enabled: true, label: { show: true, decimal: 0 } },
      floor: { enabled: true, label: { show: true, decimal: 1 } },
      target: { at: { fixed: 60 } },
      entities: [{ entity: 'sensor.power' }],
    });

    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      extrema: {
        peak: { value: 80, startedAtMs: null, windowKey: null },
        floor: { value: 20, startedAtMs: null, windowKey: null },
      },
    });

    expect(row.peak).toBe(80);
    expect(row.floor).toBe(20);
    expect(row.peakPresentation.text).toBe('80 W');
    expect(row.floorPresentation.text).toBe('20.0 W');
    expect(row.markers.find((marker) => marker.type === 'peak')).toMatchObject({
      lane: 'above',
      labelVisible: true,
    });
    expect(row.markers.find((marker) => marker.type === 'floor')).toMatchObject({
      lane: 'below',
      labelVisible: true,
    });
    expect(row.markerLaneOccupancy).toEqual({ above: true, below: true });
  });

  it('preserves raw extrema values while clamping marker positions', () => {
    const hass = { states: { 'sensor.power': sensor(42) } };
    const entityConfig = createNormalizedEntity({
      min: 0,
      max: 100,
      floor: { enabled: true, label: { show: true } },
      entities: [{ entity: 'sensor.power' }],
    });
    const row = buildRowViewModel({
      hass,
      cardConfig: null,
      entityConfig,
      entityState: hass.states['sensor.power'],
      extrema: { floor: { value: -20, startedAtMs: null, windowKey: null } },
    });

    expect(row.floor).toBe(-20);
    expect(row.floorPercent).toBe(0);
    expect(row.floorPresentation.text).toBe('-20 W');
  });
});
