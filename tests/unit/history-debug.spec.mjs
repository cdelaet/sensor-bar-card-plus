import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { HistoricalHostRuntime } from '../../src/history/host-runtime.js';

const now = Date.parse('2026-10-31T12:00:00Z');
const spec = { source: { entityId: 'sensor.temperature' }, calculation: 'max',
  window: { kind: 'calendar', period: 'day' } };
const hass = { config: { time_zone: 'Europe/Brussels' }, callWS: vi.fn(async () => ({
  'sensor.temperature': [{ s: '20', lu: Date.parse('2026-10-31T10:00:00Z') / 1000 }],
})) };
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('history diagnostics', () => {
  it('is silent by default and when browser storage is unavailable', async () => {
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ now: () => now }), now: () => now });
    expect((await resolver.resolve(spec, { hass })).status).toBe('available');
    vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('storage disabled'); } } });
    expect((await resolver.resolve(spec, { hass })).value).toBe(20);
    expect(log).not.toHaveBeenCalled();
  });

  it('correlates consumer, shared acquisition, WebSocket, normalization and terminal status', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: key => key === 'sbcp.history.debug' ? '1' : null } });
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const service = new SharedObservationService({ now: () => now });
    const resolver = new HistoricalValueResolver({ service, now: () => now });
    const peak = vi.fn(); const floor = vi.fn();
    const stopPeak = resolver.watch(spec, { hass }, peak);
    const stopFloor = resolver.watch({ ...spec, calculation: 'min' }, { hass }, floor);
    await vi.waitFor(() => { expect(peak.mock.calls.at(-1)?.[0].value).toBe(20); expect(floor.mock.calls.at(-1)?.[0].value).toBe(20); });
    const events = log.mock.calls.map(([, data]) => data);
    const starts = events.filter(event => event.event === 'resolution.start');
    expect(starts).toHaveLength(2);
    expect(new Set(starts.map(event => event.resolutionId)).size).toBe(2);
    expect(starts[0]).toMatchObject({ source: { entityId: 'sensor.temperature' }, windowSpec: spec.window,
      window: { timeZone: 'Europe/Brussels' } });
    expect(events.some(event => event.event === 'acquisition.join_queued')).toBe(true);
    expect(events.find(event => event.event === 'recorder.websocket.start')).toMatchObject({ entities: ['sensor.temperature'], timeZone: 'Europe/Brussels' });
    expect(events.find(event => event.event === 'recorder.websocket.end')).toMatchObject({ responseCounts: { 'sensor.temperature': 1 } });
    expect(events.find(event => event.event === 'recorder.normalized').observations[0].count).toBe(1);
    expect(events.some(event => event.event === 'journal.merge' && event.observations === 1)).toBe(true);
    expect(events.filter(event => event.event === 'resolution.end')).toHaveLength(2);
    expect(events.filter(event => event.event === 'resolution.end').every(event => event.status === 'available')).toBe(true);
    await resolver.resolve(spec, { hass });
    expect(log.mock.calls.some(([, data]) => data.event === 'cache.hit')).toBe(true);
    stopPeak(); stopFloor();
  });

  it('logs cancellation and the actual timeout as terminal outcomes', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => '1' } });
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const service = new SharedObservationService({ provider: () => new Promise(() => {}), requestTimeoutMs: 10, now: () => now });
    const resolver = new HistoricalValueResolver({ service, now: () => now });
    const callback = vi.fn(); const dispose = resolver.watch(spec, { hass }, callback);
    await vi.waitFor(() => expect(callback.mock.calls.at(-1)?.[0].status).toBe('unavailable'));
    expect(log.mock.calls.some(([, data]) => data.event === 'acquisition.batch.error' && data.error.includes('timed out'))).toBe(true);
    expect(log.mock.calls.some(([, data]) => data.event === 'resolution.end' && data.status === 'unavailable')).toBe(true);
    dispose();
    const second = new HistoricalValueResolver({ service: new SharedObservationService({ provider: () => new Promise(() => {}), requestTimeoutMs: 10, now: () => now }), now: () => now });
    const stop = second.watch(spec, { hass }, () => {}); stop();
    expect(log.mock.calls.some(([, data]) => data.event === 'resolution.cancelled')).toBe(true);
  });

  it('logs superseded resolutions and Recorder failures', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => '1' } });
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    let fail;
    const service = new SharedObservationService({ provider: () => new Promise((_, reject) => { fail = reject; }), now: () => now });
    const resolver = new HistoricalValueResolver({ service, now: () => now });
    const callback = vi.fn(); const stop = resolver.watch(spec, { hass }, callback);
    await vi.waitFor(() => expect(fail).toBeTypeOf('function'));
    const refresh = stop.refresh();
    expect(log.mock.calls.some(([, data]) => data.event === 'resolution.superseded')).toBe(true);
    fail(new Error('Recorder offline'));
    await refresh;
    expect(log.mock.calls.some(([, data]) => data.event === 'acquisition.batch.error' && data.error.includes('Recorder offline'))).toBe(true);
    expect(log.mock.calls.some(([, data]) => data.event === 'resolution.end' && data.status === 'unavailable')).toBe(true);
    stop();
  });

  it('reports a stalled subscription without issuing a Recorder request', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { localStorage: { getItem: () => '1' } });
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const connection = { connected: true, addEventListener() {}, removeEventListener() {},
      subscribeMessage: () => new Promise(() => {}) };
    const callWS = vi.fn();
    const host = new HistoricalHostRuntime();
    host.setHass({ connection, callWS, config: { time_zone: 'UTC' } });
    host.setConsumers([{ id: 'peak', spec }]); host.attach();
    await vi.advanceTimersByTimeAsync(30_001);
    const events = log.mock.calls.map(([, data]) => data);
    expect(events.some(event => event.event === 'consumer.waiting_for_subscription' && event.consumerId === 'peak')).toBe(true);
    expect(events.some(event => event.event === 'subscription.still_waiting')).toBe(true);
    expect(callWS).not.toHaveBeenCalled();
    host.detach(); expect(vi.getTimerCount()).toBe(0);
  });
});
