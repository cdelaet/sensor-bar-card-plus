import { describe, expect, it, vi } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';

const win = (start = 100, end = 200, cacheKey = 'calendar:day:100:UTC') => ({
  start, end, timeZone: 'UTC', cacheKey, interval: '[start,end)', semantics: { kind: 'calendar' },
});
const key = (entityId) => `${entityId}\u0000`;
const result = (source, window, value = 5) => new Map([[key(source.entityId), {
  source, observations: [{ timestamp: window.start + 1, value, state: String(value) }],
  acquiredWindow: { start: window.start, end: window.end }, retrievedAt: 1000,
  observedThrough: window.end, status: 'available', stale: false,
  coverage: { complete: false, kind: 'unknown' },
}]]);

describe('shared observation service', () => {
  it('batches compatible requests and deduplicates identical in-flight requests', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), {
      ...result(source, window).get(key(source.entityId)),
    }])));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const hass = {};
    const a = service.request({ hass, sources: ['sensor.one'], window: win() });
    const duplicate = service.request({ hass, sources: ['sensor.one'], window: win() });
    const b = service.request({ hass, sources: ['sensor.two'], window: win() });
    const [aResult, duplicateResult, bResult] = await Promise.all([a, duplicate, b]);
    expect(provider).toHaveBeenCalledOnce();
    expect(provider.mock.calls[0][1].map((source) => source.entityId).sort()).toEqual(['sensor.one', 'sensor.two']);
    expect(aResult.get(key('sensor.one')).observations).toEqual(duplicateResult.get(key('sensor.one')).observations);
    expect(bResult.has(key('sensor.two'))).toBe(true);
  });

  it('reuses fresh cache, revalidates after TTL, and serves stale values after provider failure', async () => {
    let now = 1000;
    const provider = vi.fn().mockImplementation(async (_hass, sources, window) => {
      if (provider.mock.calls.length > 1) throw new Error('offline');
      return new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))]));
    });
    const service = new SharedObservationService({ provider, now: () => now, ttlMs: 100 });
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args);
    expect((await service.request(args)).get(key('sensor.one')).cache).toBe('hit');
    now += 101;
    const stale = (await service.request(args)).get(key('sensor.one'));
    expect(provider).toHaveBeenCalledTimes(2);
    expect(stale.stale).toBe(true);
    expect(stale.observations[0].value).toBe(5);
  });

  it('does not reuse a cache interval whose acquired end precedes the requested end', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 60_000 });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    const later = (await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 175) })).get(key('sensor.one'));
    expect(provider).toHaveBeenCalledTimes(2);
    expect(later.requestedWindow).toEqual({ start: 100, end: 175 });
    expect(later.acquiredWindow).toEqual({ start: 100, end: 175 });
  });

  it('also rejects cached observations whose acquired start is later than requested', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 60_000 });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200) });
    const wider = (await service.request({ hass: {}, sources: ['sensor.one'], window: win(90, 200) })).get(key('sensor.one'));
    expect(provider).toHaveBeenCalledTimes(2);
    expect(wider.acquiredWindow.start).toBe(90);
  });

  it('labels a failed tail extension stale and exposes the uncovered acquired end', async () => {
    const provider = vi.fn().mockImplementation(async (_hass, sources, window) => {
      if (provider.mock.calls.length > 1) throw new Error('Recorder unavailable');
      return new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))]));
    });
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 60_000 });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    const extended = (await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 175) })).get(key('sensor.one'));
    expect(extended.stale).toBe(true);
    expect(extended.acquiredWindow).toEqual({ start: 100, end: 150 });
    expect(extended.requestedWindow).toEqual({ start: 100, end: 175 });
  });

  it('does not deduplicate an in-flight request that cannot cover a later requested end', async () => {
    const pending = [];
    const provider = vi.fn((_hass, sources, window) => new Promise((resolve) => pending.push({ resolve, sources, window })));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const earlier = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    await Promise.resolve();
    await Promise.resolve();
    const later = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 175) });
    await Promise.resolve();
    await Promise.resolve();
    expect(provider).toHaveBeenCalledTimes(2);
    pending[0].resolve(result(pending[0].sources[0], pending[0].window));
    pending[1].resolve(result(pending[1].sources[0], pending[1].window));
    const [earlierResult, laterResult] = await Promise.all([earlier, later]);
    expect(earlierResult.get(key('sensor.one')).acquiredWindow.end).toBe(150);
    expect(laterResult.get(key('sensor.one')).acquiredWindow.end).toBe(175);
  });

  it('revalidates a dashboard remount during TTL when the requested tail is newer', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 60_000 });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    const remounted = await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 175) });
    expect(provider).toHaveBeenCalledTimes(2);
    expect(remounted.get(key('sensor.one')).cache).toBe('miss');
  });

  it('revalidates a later request and reconciles the live transition captured in the gap', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 60_000 });
    const source = { entityId: 'sensor.one' };
    const dispose = service.subscribe(source, win(100, 150), vi.fn());
    await service.request({ hass: {}, sources: [source], window: win(100, 150) });
    service.ingestLiveState({ source, state: { state: '12', last_updated: new Date(151).toISOString() } });
    const extended = (await service.request({ hass: {}, sources: [source], window: win(100, 155) })).get(key('sensor.one'));
    expect(provider).toHaveBeenCalledTimes(2);
    expect(extended.cache).toBe('miss');
    expect(extended.observations.some((item) => item.value === 12 && item.origin === 'live')).toBe(true);
    expect(extended.acquiredWindow.end).toBe(155);
    dispose();
  });

  it('invalidates in-flight generations so late responses cannot repopulate cache', async () => {
    let resolveProvider;
    const provider = vi.fn(() => new Promise((resolve) => { resolveProvider = resolve; }));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const pending = service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    await Promise.resolve();
    await Promise.resolve();
    service.invalidate({ sources: ['sensor.one'] });
    resolveProvider(result({ entityId: 'sensor.one', attribute: null }, win()));
    const record = (await pending).get(key('sensor.one'));
    expect(record.stale).toBe(true);
    expect(service.cache.size).toBe(0);
  });

  it('updates mounted cached observations from live states and disposes consumers', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const source = { entityId: 'sensor.one', attribute: null };
    await service.request({ hass: {}, sources: [source], window: win() });
    const callback = vi.fn();
    const dispose = service.subscribe(source, win(), callback);
    service.ingestLiveState({ source, state: { state: '9', last_updated: new Date(150).toISOString() } });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0][0].observations.at(-1).value).toBe(9);
    dispose();
    service.ingestLiveState({ source, state: { state: '10', last_updated: new Date(160).toISOString() } });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('reconciles live states received before an initial Recorder request completes', async () => {
    let resolveProvider;
    const provider = vi.fn((_hass, sources, window) => new Promise((resolve) => { resolveProvider = () => resolve(
      new Map(sources.map((source) => [key(source.entityId), result(source, window, 3).get(key(source.entityId))]))); }));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const source = { entityId: 'sensor.one' };
    const callback = vi.fn();
    const dispose = service.subscribe(source, win(), callback);
    const pendingRequest = service.request({ hass: {}, sources: [source], window: win() });
    await Promise.resolve();
    await Promise.resolve();
    service.ingestLiveState({ source, state: { state: '20', last_updated: new Date(150).toISOString() } });
    resolveProvider();
    const record = (await pendingRequest).get(key('sensor.one'));
    expect(record.observations.some((item) => item.value === 20 && item.origin === 'live')).toBe(true);
    expect(callback.mock.calls.some(([item]) => item.observations.some((sample) => sample.value === 20))).toBe(true);
    dispose();
  });

  it('keeps active consumer observations when their cache entry is evicted', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window, 6).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, maxEntries: 1 });
    const source = { entityId: 'sensor.one' };
    const callback = vi.fn();
    const dispose = service.subscribe(source, win(), callback);
    await service.request({ hass: {}, sources: [source], window: win() });
    await service.request({ hass: {}, sources: ['sensor.other'], window: win() });
    expect(service.cache.has(`${key('sensor.one')}\u0001${win().cacheKey}`)).toBe(false);
    service.ingestLiveState({ source, state: { state: '12', last_updated: new Date(150).toISOString() } });
    const latest = callback.mock.calls.at(-1)[0];
    expect(latest.observations.some((item) => item.value === 6)).toBe(true);
    expect(latest.observations.some((item) => item.value === 12)).toBe(true);
    dispose();
  });

  it('retains active observations after cache eviction and reports bounded-buffer overflow', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), {
      source, observations: [1, 9, 2].map((value, index) => ({ timestamp: window.start + index + 1, value,
        state: String(value), order: index, orderKnown: true, origin: 'recorder' })),
      acquiredWindow: { start: window.start, end: window.end }, retrievedAt: 1000,
      coverage: { complete: false, kind: 'unknown' },
    }])));
    const service = new SharedObservationService({ provider, now: () => 1000, maxEntries: 0,
      maxObservations: 2, maxConsumerObservations: 2 });
    const source = { entityId: 'sensor.one' };
    const callback = vi.fn();
    const dispose = service.subscribe(source, win(), callback);
    const record = (await service.request({ hass: {}, sources: [source], window: win() })).get(key('sensor.one'));
    expect(service.cache.size).toBe(0);
    expect(record.observations.length).toBeLessThanOrEqual(2);
    expect(record.coverage.liveOverflow).toBe(true);
    service.ingestLiveState({ source, state: { state: '4', last_updated: new Date(150).toISOString() } });
    expect(callback.mock.calls.at(-1)[0].coverage.liveOverflow).toBe(true);
    expect(callback.mock.calls.at(-1)[0].observations.length).toBeLessThanOrEqual(2);
    dispose();
    expect(service.consumers.size).toBe(0);
  });

  it('bounds cache entry count and clears consumer/cache state safely', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), result(source, window).get(key(source.entityId))])));
    const service = new SharedObservationService({ provider, now: () => 1000, maxEntries: 1 });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    await service.request({ hass: {}, sources: ['sensor.two'], window: win() });
    expect(service.cache.size).toBe(1);
    service.clear();
    expect(service.cache.size).toBe(0);
    expect(service.consumers.size).toBe(0);
  });

  it('converts a stalled provider request into a bounded unavailable result', async () => {
    const service = new SharedObservationService({ provider: () => new Promise(() => {}),
      now: () => 1000, requestTimeoutMs: 5 });
    const records = await service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    expect(records.get(key('sensor.one'))).toMatchObject({ status: 'unavailable', stale: false });
    expect(records.get(key('sensor.one')).error.message).toContain('timed out');
  });
});
