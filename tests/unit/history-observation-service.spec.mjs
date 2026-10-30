import { describe, expect, it, vi } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { calculateObservationValue } from '../../src/history/calculations.js';

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
  it('does not infer coverage of a gap from one later live observation', async () => {
    const provider = vi.fn(async (_h, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const source = { entityId: 'sensor.one' };
    await service.request({ hass: {}, sources: [source], window: win(100, 200) });
    service.ingestLiveState({ source, state: { state: '8' }, timestamp: 220 });
    await service.request({ hass: {}, sources: [source], window: win(100, 220) });
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it('shares one journal for peak and floor and preserves it until the last consumer leaves', async () => {
    const provider = vi.fn(async (_h, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const source = { entityId: 'sensor.one' };
    const peak = vi.fn(); const floor = vi.fn();
    const stopPeak = service.subscribe(source, win(), peak);
    const stopFloor = service.subscribe(source, win(), floor);
    await service.request({ hass: {}, sources: [source], window: win() });
    const [a, b] = [...service.consumers.values()];
    expect(a.journal).toBe(b.journal);
    expect(service.journals.size).toBe(1);
    stopPeak();
    service.ingestLiveState({ source, state: { state: '10' }, timestamp: 150 });
    expect(floor.mock.calls.at(-1)[0].observations.some((item) => item.value === 10)).toBe(true);
    expect(service.journals.size).toBe(1);
    stopFloor();
    expect(service.journals.size).toBe(0);
  });

  it('does not notify consumers with an older acquisition after a newer one', async () => {
    const pending = [];
    const provider = vi.fn((_h, sources, window) => new Promise((resolve) => pending.push({ resolve, sources, window })));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const callback = vi.fn();
    const stop = service.subscribe('sensor.one', win(100, 200), callback);
    const old = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    await Promise.resolve(); await Promise.resolve();
    const newer = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200) });
    await Promise.resolve(); await Promise.resolve();
    pending[1].resolve(result(pending[1].sources[0], pending[1].window, 30));
    await newer;
    const count = callback.mock.calls.length;
    pending[0].resolve(result(pending[0].sources[0], pending[0].window, 90));
    await old;
    expect(callback).toHaveBeenCalledTimes(count);
    expect(callback.mock.calls.at(-1)[0].observations.map((sample) => sample.value)).toEqual([30]);
    stop();
  });

  it('preserves all ordered equal-timestamp transitions through the service', async () => {
    const provider = async (_h, sources) => new Map([[key('sensor.one'), {
      source: sources[0], observations: [100, 5, 100].map((value, order) => ({ timestamp: 150,
        value, state: String(value), order, orderKnown: true, origin: 'recorder' })),
      coverage: { complete: false }, retrievedAt: 1000,
    }]]);
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const record = (await service.request({ hass: {}, sources: ['sensor.one'], window: win() })).get(key('sensor.one'));
    expect(record.observations.map((item) => item.value)).toEqual([100, 5, 100]);
  });

  it('keeps active history stale when refresh fails after cache eviction', async () => {
    let fail = false;
    const provider = async (_h, sources, window) => {
      if (fail) throw new Error('offline');
      return result(sources[0], window, 17);
    };
    const service = new SharedObservationService({ provider, now: () => 1000, maxEntries: 0 });
    const callback = vi.fn(); const stop = service.subscribe('sensor.one', win(), callback);
    await service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    expect(service.cache.size).toBe(0);
    fail = true;
    const failed = (await service.request({ hass: {}, sources: ['sensor.one'], window: win(), force: true })).get(key('sensor.one'));
    expect(failed.stale).toBe(true);
    expect(failed.observations[0].value).toBe(17);
    expect(failed.error.message).toBe('offline');
    stop();
  });

  it('does not erase an earlier rolling consumer when another receives a narrower acquisition', async () => {
    const service = new SharedObservationService({ now: () => 1000,
      provider: async (_h, sources, window) => result(sources[0], window, window.start) });
    const first = service.subscribe('sensor.one', win(100, 200, 'rolling'), vi.fn());
    const second = service.subscribe('sensor.one', win(120, 200, 'rolling'), vi.fn());
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200, 'rolling') });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(120, 200, 'rolling'), force: true });
    expect([...service.journals.values()][0].observations.some((sample) => sample.timestamp === 101)).toBe(true);
    first(); second();
  });

  it('retains ambiguous equal-time boundary observations instead of inventing an order', async () => {
    const service = new SharedObservationService({ now: () => 1000,
      provider: async (_h, sources) => new Map([[key('sensor.one'), { source: sources[0],
        observations: [100, 5].map((value) => ({ timestamp: 90, value, state: String(value) })),
        coverage: { complete: false }, retrievedAt: 1000 }]]) });
    const stop = service.subscribe('sensor.one', win(), vi.fn());
    const record = (await service.request({ hass: {}, sources: ['sensor.one'], window: win() })).get(key('sensor.one'));
    expect(record.observations.map((sample) => sample.value)).toEqual([100, 5]);
    stop();
  });

  it('does not claim a future query is already acquired', async () => {
    const provider = vi.fn(async (_h, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 200 });
    const request = { hass: {}, sources: ['sensor.one'], window: win(100, 300) };
    const first = (await service.request(request)).get(key('sensor.one'));
    expect(first.acquiredWindow.end).toBe(200);
    await service.request(request);
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it('retains a Recorder/live overlap without inventing a conflicting transition', async () => {
    let finish;
    const service = new SharedObservationService({ now: () => 1000, provider: (_h, sources) => new Promise((resolve) => {
      finish = () => resolve(new Map([[key('sensor.one'), { source: sources[0], observations: [{ timestamp: 150,
        value: 7, state: '7', order: 0, orderKnown: true, origin: 'recorder' }],
        retrievedAt: 1000, coverage: { complete: false } }]]));
    }) });
    const stop = service.subscribe('sensor.one', win(), vi.fn());
    const pending = service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    await Promise.resolve(); await Promise.resolve();
    service.ingestLiveState({ source: 'sensor.one', state: { state: '7' }, timestamp: 150 });
    finish();
    const record = (await pending).get(key('sensor.one'));
    expect(record.observations.map((sample) => sample.value)).toEqual([7, 7]);
    stop();
  });

  it('does not let an older success clear a newer failed acquisition', async () => {
    const pending = [];
    const provider = vi.fn((_h, sources, window) => new Promise((resolve, reject) => pending.push({ resolve, reject, sources, window })));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const stop = service.subscribe('sensor.one', win(100, 200), vi.fn());
    const initial = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 140) });
    await Promise.resolve(); await Promise.resolve();
    pending[0].resolve(result(pending[0].sources[0], pending[0].window, 5)); await initial;
    const older = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 150) });
    await Promise.resolve(); await Promise.resolve();
    const newer = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200) });
    await Promise.resolve(); await Promise.resolve();
    pending[2].reject(new Error('offline')); await newer;
    pending[1].resolve(result(pending[1].sources[0], pending[1].window, 99));
    const late = (await older).get(key('sensor.one'));
    expect(late.stale).toBe(true);
    expect(late.error.message).toBe('offline');
    expect(late.observations.some((item) => item.value === 99)).toBe(false);
    stop();
  });

  it('does not turn a failed forced refresh into a fresh cache hit', async () => {
    let fail = false;
    const provider = vi.fn(async (_h, sources, window) => {
      if (fail) throw new Error('offline');
      return result(sources[0], window);
    });
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args);
    fail = true;
    expect((await service.request({ ...args, force: true })).get(key('sensor.one')).stale).toBe(true);
    expect((await service.request(args)).get(key('sensor.one')).stale).toBe(true);
    expect(provider).toHaveBeenCalledTimes(3);
  });

  it('evicts an older cache entry when a successful replacement exceeds the limit', async () => {
    let large = false;
    const provider = async (_h, sources, window) => {
      const data = result(sources[0], window);
      if (large) data.get(key('sensor.one')).observations.push({ timestamp: 130, value: 30 });
      return data;
    };
    const service = new SharedObservationService({ provider, now: () => 1000, maxObservations: 1 });
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args); large = true;
    const refreshed = (await service.request({ ...args, force: true })).get(key('sensor.one'));
    expect(refreshed.observations).toHaveLength(2);
    expect(service.cache.size).toBe(0);
  });

  it('marks an active journal stale on invalidation until Recorder revalidation', async () => {
    const provider = vi.fn(async (_h, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const callback = vi.fn(); const stop = service.subscribe('sensor.one', win(), callback);
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args);
    service.invalidate({ sources: ['sensor.one'] });
    expect(callback.mock.calls.at(-1)[0].stale).toBe(true);
    expect((await service.request(args)).get(key('sensor.one')).stale).toBe(false);
    expect(provider).toHaveBeenCalledTimes(2);
    stop();
  });

  it('replaces covered Recorder transitions on refresh and retains live observations', async () => {
    const pending = [];
    const provider = vi.fn((_h, sources, window) => new Promise((resolve) => pending.push(() => resolve(new Map([[key('sensor.one'), {
      source: sources[0], observations: [100, 5, 100].map((value, order) => ({ timestamp: 150,
        value, state: String(value), order, orderKnown: true, origin: 'recorder' })),
      retrievedAt: 1000, coverage: { complete: false },
    }]])))));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const stop = service.subscribe('sensor.one', win(100, 220), vi.fn());
    const initial = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200) });
    await Promise.resolve(); await Promise.resolve(); pending.shift()();
    const before = (await initial).get(key('sensor.one'));
    expect(calculateObservationValue(before.observations, 'max', win(100, 200)).value).toBe(100);
    expect(calculateObservationValue(before.observations, 'min', win(100, 200)).value).toBe(100);
    const refresh = service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 200), force: true });
    await Promise.resolve(); await Promise.resolve();
    service.ingestLiveState({ source: 'sensor.one', state: { state: '50' }, timestamp: 190 });
    pending.shift()();
    const record = (await refresh).get(key('sensor.one'));
    expect(record.observations.filter((item) => item.origin === 'recorder').map((item) => item.value)).toEqual([100, 5, 100]);
    expect(record.observations.filter((item) => item.origin === 'live').map((item) => item.value)).toEqual([50]);
    expect(calculateObservationValue(record.observations, 'max', win(100, 200)).value).toBe(100);
    expect(calculateObservationValue(record.observations, 'min', win(100, 200)).value).toBe(50);
    stop();
  });

  it('merges a live observation once per shared journal and notifies both consumers', () => {
    const service = new SharedObservationService({ now: () => 1000 });
    const first = vi.fn(); const second = vi.fn();
    const stopA = service.subscribe('sensor.one', win(), first);
    const stopB = service.subscribe('sensor.one', win(), second);
    const merge = vi.spyOn(service, '_mergeIntoConsumer');
    expect(service.ingestLiveState({ source: 'sensor.one', state: { state: '7' }, timestamp: 150 })).toBe(2);
    expect(merge).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledOnce(); expect(second).toHaveBeenCalledOnce();
    expect(first.mock.calls[0][0].observations.map((item) => item.value)).toEqual([7]);
    expect(second.mock.calls[0][0].observations.map((item) => item.value)).toEqual([7]);
    stopA(); stopB();
  });

  it('does not restore older cached Recorder rows after a narrower refresh', async () => {
    const provider = async (_h, sources) => new Map([[key('sensor.one'), { source: sources[0],
      observations: [100, 5, 100].map((value, order) => ({ timestamp: 150, value, state: String(value),
        order, orderKnown: true, origin: 'recorder' })), retrievedAt: 1000, coverage: { complete: false } }]]);
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const first = service.subscribe('sensor.one', win(100, 220, 'rolling'), vi.fn());
    const second = service.subscribe('sensor.one', win(120, 200, 'rolling'), vi.fn());
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(100, 220, 'rolling') });
    await service.request({ hass: {}, sources: ['sensor.one'], window: win(120, 200, 'rolling'), force: true });
    first.updateWindow(win(100, 220, 'rolling'));
    const third = service.subscribe('sensor.one', win(100, 220, 'rolling'), vi.fn());
    const observations = [...service.journals.values()][0].observations;
    expect(observations.map((sample) => sample.value)).toEqual([100, 5, 100]);
    expect(calculateObservationValue(observations, 'min', win(100, 220, 'rolling')).value).toBe(100);
    first(); second(); third();
  });

});
