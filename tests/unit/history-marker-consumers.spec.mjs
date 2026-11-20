import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { historicalMarkerConsumers, historicalMarkerResults } from '../../src/history/marker-consumers.js';
import { parseHistoricalWindow } from '../../src/history/time-window.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { historyDiagnostics } from '../../src/history/history-status.js';

const helper = name => `input_select.${name}`;
const hassWith = states => ({ states });
const state = value => ({ state: value, attributes: {} });

function rows(markers) {
  return normalizeCardConfig({ entity: 'sensor.temperature', ...markers }).entities;
}

function windows(consumers) {
  return Object.fromEntries(consumers.map(({ id, spec }) => [JSON.parse(id)[2], spec.window]));
}

describe('dynamic historical marker windows', () => {
  it('resolves a Peak-only helper and leaves Floor on its configured static window', () => {
    const config = rows({ peak: { enabled: true, window: 'today', window_entity: helper('peak_window') },
      floor: { enabled: true, window: 'yesterday' } });
    const consumers = historicalMarkerConsumers(config, hassWith({ [helper('peak_window')]: state('15m') }));

    expect(windows(consumers)).toEqual({
      peak: parseHistoricalWindow('15m'),
      floor: parseHistoricalWindow('yesterday'),
    });
  });

  it('resolves a Floor-only helper independently', () => {
    const config = rows({ peak: { enabled: true, window: 'this_week' },
      floor: { enabled: true, window: 'today', window_entity: helper('floor_window') } });
    const consumers = historicalMarkerConsumers(config, hassWith({ [helper('floor_window')]: state('48h') }));

    expect(windows(consumers)).toEqual({
      peak: parseHistoricalWindow('this_week'),
      floor: parseHistoricalWindow('48h'),
    });
  });

  it('lets both markers follow the same helper without coupling their calculations', () => {
    const config = rows({ peak: { enabled: true, window: 'today', window_entity: helper('history_window') },
      floor: { enabled: true, window: 'yesterday', window_entity: helper('history_window') } });
    const consumers = historicalMarkerConsumers(config, hassWith({ [helper('history_window')]: state('this_month') }));

    expect(consumers).toHaveLength(2);
    expect(consumers.map(({ spec }) => [spec.calculation, spec.window])).toEqual([
      ['max', parseHistoricalWindow('this_month')],
      ['min', parseHistoricalWindow('this_month')],
    ]);
    expect(new Set(consumers.map(({ id }) => id)).size).toBe(2);
  });

  it('supports different helpers and switches between Recorder and statistics windows', () => {
    const config = rows({ peak: { enabled: true, window: 'today', window_entity: helper('peak_window') },
      floor: { enabled: true, window: 'today', window_entity: helper('floor_window') } });
    const consumers = historicalMarkerConsumers(config, hassWith({
      [helper('peak_window')]: state('1h'), [helper('floor_window')]: state('48h'),
    }));

    expect(windows(consumers)).toEqual({ peak: parseHistoricalWindow('1h'), floor: parseHistoricalWindow('48h') });
    expect(consumers.map(({ spec }) => spec.window.kind)).toEqual(['rolling', 'rolling']);
    expect(consumers.map(({ spec }) => spec.window.duration.amount)).toEqual([1, 48]);
  });

  it('derives a fresh consumer identity for rapid successive helper selections', () => {
    const config = rows({ peak: { enabled: true, window: 'today', window_entity: helper('history_window') } });
    const selections = ['15m', '48h', '2h'].map(option => historicalMarkerConsumers(config,
      hassWith({ [helper('history_window')]: state(option) }))[0]);

    expect(selections.map(({ spec }) => spec.window)).toEqual([
      parseHistoricalWindow('15m'), parseHistoricalWindow('48h'), parseHistoricalWindow('2h'),
    ]);
    expect(new Set(selections.map(({ id }) => id)).size).toBe(3);
  });

  it.each([
    ['missing', undefined],
    ['unavailable', state('unavailable')],
    ['unknown', state('unknown')],
    ['invalid option', state('fortnight')],
    ['ineligible duration', state('1441m')],
    ['over-limit duration', state('9999w')],
  ])('falls back to the static window and reports a %s helper state', (label, helperState) => {
    const config = rows({ peak: { enabled: true, window: 'yesterday', window_entity: helper('history_window') } });
    const helperStates = helperState ? { [helper('history_window')]: helperState } : {};
    const consumers = historicalMarkerConsumers(config, hassWith(helperStates));
    const results = historicalMarkerResults({ getResult: () => ({ value: 7, status: 'available' }) }, config[0], hassWith(helperStates));

    expect(windows(consumers)).toEqual({ peak: parseHistoricalWindow('yesterday') });
    expect(results.peak).toMatchObject({ status: 'available', configuredWindow: 'yesterday',
      windowHelperIssue: { helper: helper('history_window'), fallback: 'yesterday' } });
    expect(results.peak.windowHelperIssue.reason).toMatch(label === 'invalid option' || label === 'ineligible duration' || label === 'over-limit duration' ? 'invalid' : 'unavailable');
  });

  it('recovers from fallback when the selected helper option becomes valid', () => {
    const config = rows({ peak: { enabled: true, window: 'today', window_entity: helper('history_window') } });
    const fallback = historicalMarkerResults({ getResult: () => null }, config[0], hassWith({
      [helper('history_window')]: state('unavailable'),
    }));
    const recovered = historicalMarkerConsumers(config, hassWith({ [helper('history_window')]: state('7d') }));

    expect(fallback.peak.windowHelperIssue).toBeTruthy();
    expect(windows(recovered)).toEqual({ peak: parseHistoricalWindow('7d') });
  });

  it('preserves legacy static windows when no helper is configured', () => {
    const config = rows({ peak: { enabled: true, window: 'today' }, floor: { enabled: true, window: '48h' } });
    expect(windows(historicalMarkerConsumers(config, hassWith({})))).toEqual({
      peak: parseHistoricalWindow('today'), floor: parseHistoricalWindow('48h'),
    });
  });

  it('inherits a card helper for entity rows and accepts an independent row override', () => {
    const config = normalizeCardConfig({
      peak: { enabled: true, window: 'today', window_entity: helper('card_window') },
      entities: [
        { entity: 'sensor.inherited', peak: { enabled: true, window: 'yesterday' } },
        { entity: 'sensor.overridden', peak: { enabled: true, window_entity: helper('row_window') } },
      ],
    });
    const inherited = config.entities[0].peak_marker;
    const overridden = config.entities[1].peak_marker;

    expect(inherited).toMatchObject({ window: 'yesterday', window_entity: helper('card_window') });
    expect(overridden.window_entity).toBe(helper('row_window'));
    expect(historicalMarkerConsumers(config.entities, hassWith({
      [helper('card_window')]: state('15m'), [helper('row_window')]: state('48h'),
    })).map(({ spec }) => spec.window)).toEqual([parseHistoricalWindow('15m'), parseHistoricalWindow('48h')]);
  });

  it('rejects a non-input_select helper, retains static history and reports the config issue', () => {
    const normalized = normalizeCardConfig({ entity: 'sensor.temperature',
      peak: { enabled: true, window: 'today', window_entity: 'sensor.not_a_dropdown' },
    });
    const row = normalized.entities[0];

    expect(row.peak_marker).toMatchObject({ window: 'today', window_spec: parseHistoricalWindow('today'), window_entity_invalid: true });
    expect(historicalMarkerConsumers([row], hassWith({}))).toHaveLength(1);
    expect(validateNormalizedConfig(normalized).warnings).toContainEqual(expect.objectContaining({
      code: 'peak_marker.invalid_window_entity', path: 'card.peak.window_entity',
    }));
  });

  it('continues validating the static window retained as the helper fallback', () => {
    const normalized = normalizeCardConfig({ entity: 'sensor.temperature',
      peak: { enabled: true, window: '1441m', window_entity: helper('history_window') },
    });

    expect(normalized.peak_marker).toMatchObject({ window_invalid: true, window_entity: helper('history_window') });
    expect(validateNormalizedConfig(normalized).errors).toContainEqual(expect.objectContaining({
      code: 'peak_marker.invalid_window', path: 'card.peak_marker.window',
    }));
  });

  it('reports helper fallback warnings through the history diagnostic contract', () => {
    const config = rows({ peak: { enabled: true, window: 'yesterday', window_entity: helper('history_window') } });
    const results = historicalMarkerResults({ getResult: () => ({ value: 7, status: 'available' }) }, config[0], hassWith({}));
    const diagnostics = historyDiagnostics('sensor.temperature', {
      enabled: true, status: results.peak.status, visible: true, window: results.peak.configuredWindow,
      windowHelperIssue: results.peak.windowHelperIssue,
    }, { enabled: false });

    expect(diagnostics).toContainEqual(expect.objectContaining({
      code: 'history.window_helper.unavailable', severity: 'warning',
      path: 'history.peak.window_entity', entity: 'sensor.temperature',
    }));
  });
});
