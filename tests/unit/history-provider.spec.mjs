import { describe, expect, it, vi } from 'vitest';
import { fetchPlannedHistory, fetchRecorderHistory, fetchRecorderStatistics, normalizeHistoryResponse } from '../../src/history/history-provider.js';

const window = { start: Date.parse('2026-01-01T00:00:00Z'), end: Date.parse('2026-01-01T01:00:00Z') };

describe('Recorder history provider', () => {
  it('fetches only the unfinished hour from raw history alongside statistics', async () => {
    const end = window.end + 1200000;
    const callWS = vi.fn(async request => {
      if (request.type === 'recorder/get_statistics_metadata') return [{ statistic_id: 'sensor.one', has_mean: true }];
      if (request.type === 'recorder/statistics_during_period') return { 'sensor.one': [{ ...window, min: 1, max: 99 }] };
      return { 'sensor.one': [{ s: '10', lu: window.end / 1000 }] };
    });
    const record = (await fetchPlannedHistory({ callWS }, ['sensor.one'], { ...window, end,
      acquisition: { mode: 'statistics', statistics: window } }, () => end)).get('sensor.one\u0000');
    expect(callWS.mock.calls.find(([request]) => request.type === 'history/history_during_period')[0]).toMatchObject({
      start_time: new Date(window.end).toISOString(), end_time: new Date(end).toISOString(),
    });
    expect(record.statistics.buckets[0]).toMatchObject({ min: 1, max: 99 });
    expect(record.observations.map(item => item.value)).toEqual([10]);
    expect(record.coverage.statistics.kind).toBe('unknown');
  });

  it('chunks long statistics requests without truncating buckets', async () => {
    const start = window.start;
    const end = start + 32 * 24 * 3600000;
    const callWS = vi.fn(async request => {
      if (request.type === 'recorder/get_statistics_metadata') return [{ statistic_id: 'sensor.one', has_mean: true }];
      const first = Date.parse(request.start_time), last = Date.parse(request.end_time);
      return { 'sensor.one': Array.from({ length: (last - first) / 3600000 }, (_, index) => ({
        start: first + index * 3600000, end: first + (index + 1) * 3600000, min: index, max: index + 1,
      })) };
    });
    const records = await fetchRecorderStatistics({ callWS }, ['sensor.one'],
      { mode: 'statistics', statistics: { start, end } }, () => end);
    expect(callWS).toHaveBeenCalledTimes(3);
    expect(records.get('sensor.one\u0000').statistics.buckets).toHaveLength(32 * 24);
    expect(records.get('sensor.one\u0000').coverage.kind).toBe('unknown');
  });

  it('does not fall back to old raw history when statistics are missing', async () => {
    const callWS = vi.fn(async request => request.type === 'recorder/get_statistics_metadata'
      ? [{ statistic_id: 'sensor.one', mean_type: 1 }]
      : {});
    const record = (await fetchPlannedHistory({ callWS }, ['sensor.one'], {
      ...window, acquisition: { mode: 'statistics', statistics: window },
    }, () => window.end)).get('sensor.one\u0000');
    expect(record.status).toBe('unavailable');
    expect(record.coverage.kind).toBe('incomplete');
    expect(callWS.mock.calls.some(([request]) => request.type === 'history/history_during_period')).toBe(false);
  });
  it('acquires genuine hourly min/max as separate interval buckets', async () => {
    const callWS = vi.fn(async request => request.type === 'recorder/get_statistics_metadata'
      ? [{ statistic_id: 'sensor.one', has_mean: true, mean_type: 1, display_unit_of_measurement: '°C' }]
      : { 'sensor.one': [{ start: window.start, end: window.end, min: 2, max: 9 }] });
    const result = await fetchRecorderStatistics({ callWS, states: { 'sensor.one': { attributes: { unit_of_measurement: '°C' } } } },
      ['sensor.one'], { mode: 'statistics', statistics: window }, () => window.end);
    expect(callWS.mock.calls[1][0]).toMatchObject({ type: 'recorder/statistics_during_period', period: 'hour',
      statistic_ids: ['sensor.one'], types: ['min', 'max'] });
    expect(result.get('sensor.one\u0000')).toMatchObject({ status: 'available', observations: [],
      statistics: { unit: '°C', buckets: [{ start: window.start, end: window.end, min: 2, max: 9 }] }, coverage: { kind: 'unknown', complete: false } });
  });

  it('reports missing or malformed buckets, unsupported statistics and unit mismatches', async () => {
    const callWS = vi.fn(async request => request.type === 'recorder/get_statistics_metadata' ? [
      { statistic_id: 'sensor.one', has_mean: true, mean_type: 1, display_unit_of_measurement: 'W' },
      { statistic_id: 'sensor.two', has_mean: false, mean_type: 0, display_unit_of_measurement: 'W' },
      { statistic_id: 'sensor.three', has_mean: true, mean_type: 1, display_unit_of_measurement: 'kW' },
    ] : { 'sensor.one': [{ start: window.start, end: window.end, min: null, max: 10 }] });
    const hass = { callWS, states: Object.fromEntries(['one', 'two', 'three'].map(id => [`sensor.${id}`, { attributes: { unit_of_measurement: 'W' } }])) };
    const sources = ['sensor.one', 'sensor.two', 'sensor.three', 'sensor.missing', { entityId: 'sensor.one', attribute: 'value' }];
    const records = await fetchRecorderStatistics(hass, sources, { mode: 'statistics', statistics: window }, () => window.end);
    expect(records.get('sensor.one\u0000').coverage).toMatchObject({ kind: 'incomplete', reason: expect.stringContaining('malformed') });
    expect(records.get('sensor.two\u0000').coverage.reason).toContain('min/max');
    expect(records.get('sensor.three\u0000').coverage.reason).toContain('units');
    expect(records.get('sensor.missing\u0000').coverage.reason).toContain('metadata');
    expect(records.get('sensor.one\u0000value').coverage.reason).toContain('attributes');
    expect(callWS.mock.calls[1][0].statistic_ids).toEqual(['sensor.one']);
  });
  it('requests all state changes and the effective boundary state for several entities', async () => {
    const callWS = vi.fn().mockResolvedValue({
      'sensor.one': [{ s: '5', lu: window.start / 1000 - 1 }, { s: '7', lu: window.start / 1000 + 60 }],
      'sensor.two': [],
    });
    const result = await fetchRecorderHistory({ callWS }, ['sensor.one', 'sensor.two'], window);
    expect(callWS).toHaveBeenCalledOnce();
    expect(callWS.mock.calls[0][0]).toMatchObject({
      type: 'history/history_during_period', entity_ids: ['sensor.one', 'sensor.two'],
      include_start_time_state: true, significant_changes_only: false,
      minimal_response: true, no_attributes: true,
    });
    expect(result.get('sensor.one\u0000').observations.map((item) => item.value)).toEqual([5, 7]);
    expect(result.get('sensor.one\u0000').observations[0]).toMatchObject({ boundaryEffective: true, transitionInWindow: false, orderKnown: true });
    expect(result.get('sensor.two\u0000').status).toBe('unavailable');
    expect(result.get('sensor.one\u0000').coverage.complete).toBe(false);
    expect(result.get('sensor.one\u0000').coverage.boundaryState).toMatchObject({ requested: true, found: true });
    expect(result.get('sensor.one\u0000').observedThrough).toBe(Date.parse('2026-01-01T00:01:00Z'));
    expect(result.get('sensor.one\u0000').coverage.requested).toEqual({ start: window.start, end: window.end });
  });

  it('preserves attributes for attribute sources and converts invalid states to null observations', async () => {
    const callWS = vi.fn().mockResolvedValue({
      'sensor.one': [
        { state: 'unavailable', last_updated: '2026-01-01T00:00:00Z', attributes: { value: 3 } },
        { state: 'ok', last_updated: '2026-01-01T00:01:00Z', attributes: { value: '4.5' } },
      ],
    });
    const result = await fetchRecorderHistory({ callWS }, [{ entityId: 'sensor.one', attribute: 'value' }], window);
    expect(callWS.mock.calls[0][0]).toMatchObject({ minimal_response: false, no_attributes: false });
    expect(result.get('sensor.one\u0000value').observations.map((item) => item.value)).toEqual([null, 4.5]);
  });

  it('normalizes out-of-order and nonnumeric data and rejects invalid response shapes', () => {
    const result = normalizeHistoryResponse({ 'sensor.one': [
      { s: 'unknown', lu: window.start / 1000 + 90 },
      { s: '3', lu: window.start / 1000 + 10 },
      { s: 'bad', lu: window.start / 1000 + 30 },
    ] }, ['sensor.one'], window);
    expect(result.get('sensor.one\u0000').observations.map(({ value }) => value)).toEqual([3, null, null]);
    expect(() => normalizeHistoryResponse([], ['sensor.one'], window)).toThrow();
    expect(() => normalizeHistoryResponse({ 'sensor.one': {} }, ['sensor.one'], window)).toThrow();
  });

  it('propagates Home Assistant request errors', async () => {
    await expect(fetchRecorderHistory({ callWS: vi.fn().mockRejectedValue(new Error('offline')) }, ['sensor.one'], window))
      .rejects.toThrow('offline');
  });

  it('does not invent a boundary or future observed-through coverage', () => {
    const future = { start: window.end + 60_000, end: window.end + 120_000 };
    const record = normalizeHistoryResponse({ 'sensor.one': [
      { s: '12', lu: future.start / 1000 + 10 },
      { s: '5', lu: window.end / 1000 - 10 },
    ] }, ['sensor.one'], future, window.end);
    expect(record.get('sensor.one\u0000').coverage.boundaryState).toMatchObject({ found: true, timestamp: window.end - 10_000 });
    expect(record.get('sensor.one\u0000').coverage.futureInterval).toBe(true);
    expect(record.get('sensor.one\u0000').observedThrough).toBe(Date.parse('2026-01-01T00:59:50Z'));
    expect(record.get('sensor.one\u0000').observations.some((item) => item.timestamp > window.end)).toBe(false);

    const empty = normalizeHistoryResponse({ 'sensor.one': [] }, ['sensor.one'], future, window.end);
    expect(empty.get('sensor.one\u0000').coverage.boundaryState).toMatchObject({ found: false, timestamp: null });
    expect(empty.get('sensor.one\u0000').observedThrough).toBeNull();
  });

  it('reports delayed Recorder observations without claiming coverage through the request end', () => {
    const delayed = normalizeHistoryResponse({ 'sensor.one': [
      { s: '5', lu: window.start / 1000 + 10 },
    ] }, ['sensor.one'], window, window.end + 60_000).get('sensor.one\u0000');
    expect(delayed.requestedWindow.end).toBe(window.end);
    expect(delayed.observedThrough).toBe(window.start + 10_000);
    expect(delayed.coverage.observed.lastTimestamp).toBe(window.start + 10_000);
    expect(delayed.coverage.complete).toBe(false);
  });

  it('honors the exclusive query end when normalizing returned states', () => {
    const record = normalizeHistoryResponse({ 'sensor.one': [
      { s: '3', lu: (window.end - 1000) / 1000 },
      { s: '9', lu: window.end / 1000 },
    ] }, ['sensor.one'], window, window.end + 1000).get('sensor.one\u0000');
    expect(record.observations.map((sample) => sample.value)).toEqual([3]);
    expect(record.observedThrough).toBe(window.end - 1000);
  });
});
