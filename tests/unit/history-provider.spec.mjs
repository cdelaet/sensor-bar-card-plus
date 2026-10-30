import { describe, expect, it, vi } from 'vitest';
import { fetchRecorderHistory, normalizeHistoryResponse } from '../../src/history/history-provider.js';

const window = { start: Date.parse('2026-01-01T00:00:00Z'), end: Date.parse('2026-01-01T01:00:00Z') };

describe('Recorder history provider', () => {
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
