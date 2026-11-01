import { describe, expect, it, vi } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { calculateObservationValue } from '../support/history-observation-oracle.mjs';

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
const statisticsWindow = (start, end, cacheKey) => ({
  ...win(start, end, cacheKey), acquisition: { mode: 'statistics', statistics: { start, end } },
});

describe('shared observation service', () => {
  it('expires the previous calendar window while the same source remains active', async () => {
    vi.useFakeTimers();
    const midnight = Date.parse('2026-11-01T00:00:00Z');
    vi.setSystemTime(midnight - 10_000);
    try {
      const source = 'sensor.one';
      const previous = win(midnight - 86400000, midnight - 10_000, 'today:old');
      const current = win(midnight, midnight + 1000, 'today:new');
      const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
      const service = new SharedObservationService({ provider, ttlMs: 30_000 });
      const onUpdate = vi.fn();
      const stop = service.subscribe(source, previous, onUpdate);
      await service.request({ hass: {}, sources: [source], window: previous });
      const oldKey = service._cacheKey({ entityId: source }, previous);
      const oldRecord = service.cache.get(oldKey);
      await vi.advanceTimersByTimeAsync(11_000);
      stop.updateWindow(current);
      await service.request({ hass: {}, sources: [source], window: current });
      expect(service.cache.has(oldKey)).toBe(true);
      const oldValues = oldRecord.observations.map(item => item.value);
      service.ingestLiveState({ source, state: { state: '9' }, timestamp: midnight + 1000 });
      expect(oldRecord.observations.map(item => item.value)).toEqual(oldValues);
      expect(onUpdate.mock.calls.at(-1)[0].observations.at(-1).value).toBe(9);
      const reused = (await service.request({ hass: {}, sources: [source], window: previous })).get(key(source));
      expect(reused.cache).toBe('hit');
      expect(reused.observations.map(item => item.value)).toEqual(oldValues);
      expect(provider).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(19_000);
      expect(service.cache.has(oldKey)).toBe(false);
      expect(service.sourceHistories.size).toBe(1);
      expect([...service.sourceHistories.values()][0].observations.at(-1).value).toBe(9);
      stop(); service.clear();
    } finally { vi.useRealTimers(); }
  });

  it('retains each active window independently and expires only the disposed window', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    try {
      const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
      const service = new SharedObservationService({ provider, ttlMs: 100 });
      const firstWindow = win(100, 200, 'first'), secondWindow = win(300, 400, 'second');
      const first = service.subscribe('sensor.one', firstWindow, () => {});
      const second = service.subscribe('sensor.one', secondWindow, () => {});
      await service.request({ hass: {}, sources: ['sensor.one'], window: firstWindow });
      await service.request({ hass: {}, sources: ['sensor.one'], window: secondWindow, force: true });
      const firstKey = service._cacheKey({ entityId: 'sensor.one' }, firstWindow);
      const secondKey = service._cacheKey({ entityId: 'sensor.one' }, secondWindow);
      expect(service.cache.has(firstKey)).toBe(true);
      expect(service.cache.has(secondKey)).toBe(true);
      first(); await vi.advanceTimersByTimeAsync(100);
      expect(service.cache.has(firstKey)).toBe(false);
      expect(service.cache.has(secondKey)).toBe(true);
      expect(service.sourceHistories.size).toBe(1);
      second(); service.clear();
      expect(service.cache.size).toBe(0);
      expect(service.sourceHistories.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('reacquires inactive cached windows if an omitted live event intersects them', async () => {
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000, ttlMs: 30_000 });
    const old = win(100, 200, 'old'), other = win(300, 400, 'other');
    const stop = service.subscribe('sensor.one', old, () => {});
    await service.request({ hass: {}, sources: ['sensor.one'], window: old });
    stop.updateWindow(other);
    service.ingestLiveState({ source: 'sensor.one', state: { state: '9' }, timestamp: 150 });
    stop.updateWindow(old);
    const record = (await service.request({ hass: {}, sources: ['sensor.one'], window: old })).get(key('sensor.one'));
    expect(provider).toHaveBeenCalledTimes(2);
    expect(record.observations.map(item => item.value)).toContain(9);
    stop(); service.clear();
  });

  it('reclaims inactive cache entries after the TTL with one shared timer', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1000);
    try {
      const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map(source => [key(source.entityId), result(source, window).get(key(source.entityId))])));
      const service = new SharedObservationService({ provider, ttlMs: 100 });
      const first = service.subscribe('sensor.one', win(), () => {});
      const second = service.subscribe('sensor.two', win(), () => {});
      await service.request({ hass: {}, sources: ['sensor.one', 'sensor.two'], window: win() });
      first(); second();
      expect(service.sourceHistories.size).toBe(0);
      expect(service.cache.size).toBe(2);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(99);
      const remount = service.subscribe('sensor.one', win(), () => {});
      expect((await service.request({ hass: {}, sources: ['sensor.one'], window: win() })).get(key('sensor.one')).cache).toBe('hit');
      remount();
      await vi.advanceTimersByTimeAsync(1);
      expect(service.cache.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(provider).toHaveBeenCalledOnce();
      service.clear();
    } finally { vi.useRealTimers(); }
  });
  it('shares a covering acquisition and transition array across compatible window families', async () => {
    let finish;
    const provider = vi.fn((_hass, sources, window) => new Promise(resolve => {
      finish = () => resolve(result(sources[0], window));
    }));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const source = 'sensor.one';
    const wide = win(100, 200, 'wide');
    const narrow = win(120, 200, 'narrow');
    const stopWide = service.subscribe(source, wide, () => {});
    const stopNarrow = service.subscribe(source, narrow, () => {});
    const first = service.request({ hass: {}, sources: [source], window: wide });
    const second = service.request({ hass: {}, sources: [source], window: narrow });
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    finish();
    const [large, small] = await Promise.all([first, second]);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(large.get(key(source)).observations).toBe(small.get(key(source)).observations);
    expect((await service.request({ hass: {}, sources: [source], window: narrow })).get(key(source)).cache).toBe('hit');
    expect(provider).toHaveBeenCalledTimes(1);
    service.ingestLiveState({ source, state: { state: '9' }, timestamp: 190 });
    const histories = [...service.families.values()].map(journal => journal.history.observations);
    expect(histories[0]).toBe(histories[1]);
    expect(histories[0].map(item => item.value)).toEqual([5, 9]);
    expect([...service.cache.values()][0].observations).toBe(histories[0]);
    stopWide(); stopNarrow();
  });

  it('coalesces compatible queued windows even when the narrower request arrives first', async () => {
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const narrow = win(120, 200, 'narrow'), wide = win(100, 200, 'wide');
    const first = service.request({ hass: {}, sources: ['sensor.one'], window: narrow });
    const second = service.request({ hass: {}, sources: ['sensor.one'], window: wide });
    const [, wider] = await Promise.all([first, second]);
    expect(provider).toHaveBeenCalledOnce();
    expect(provider.mock.calls[0][2]).toMatchObject({ start: 100, end: 200 });
    expect(wider.get(key('sensor.one')).acquiredWindow).toEqual({ start: 100, end: 200 });
  });

  it('does not join a broader in-flight statistics request for a narrower interval', async () => {
    const pending = [];
    const provider = vi.fn((_hass, sources, window) => new Promise(resolve => {
      pending.push(() => resolve(new Map(sources.map(source => [key(source.entityId), {
        source, observations: [], statisticsWindow: { ...window.acquisition.statistics }, statistics: { buckets: [] },
        retrievedAt: 1000, status: 'available', stale: false,
        coverage: { kind: window.start === 100 ? 'incomplete' : 'unknown', requested: { start: window.start, end: window.end } },
      }]))));
    }));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const wide = statisticsWindow(100, 300, 'wide-statistics');
    const narrow = statisticsWindow(200, 300, 'narrow-statistics');
    const broadRequest = service.request({ hass: {}, sources: ['sensor.one'], window: wide });
    await vi.waitFor(() => expect(provider).toHaveBeenCalledOnce());
    const narrowRequest = service.request({ hass: {}, sources: ['sensor.one'], window: narrow });
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(2));
    pending[0](); pending[1]();
    const [broad, small] = await Promise.all([broadRequest, narrowRequest]);
    expect(broad.get(key('sensor.one')).coverage.kind).toBe('incomplete');
    expect(small.get(key('sensor.one')).coverage.kind).toBe('unknown');
    expect(provider.mock.calls.map(([, , requested]) => [requested.start, requested.end]))
      .toEqual([[100, 300], [200, 300]]);
    service.clear();
  });

  it('does not widen a recent raw acquisition to an aged-out consumer window', async () => {
    const now = Date.parse('2026-05-13T12:00:00Z');
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => now });
    const aged = win(now - 48 * 3600000, now - 47 * 3600000, 'aged');
    const recent = win(now - 3600000, now, 'recent');
    const stopAged = service.subscribe('sensor.one', aged, () => {});
    const stopRecent = service.subscribe('sensor.one', recent, () => {});
    await service.request({ hass: {}, sources: ['sensor.one'], window: recent });
    expect(provider.mock.calls[0][2].start).toBe(recent.start);
    stopAged(); stopRecent();
  });

  it('does not reuse another window family after source invalidation', async () => {
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const wide = win(100, 200, 'wide'), narrow = win(120, 200, 'narrow');
    const stop = service.subscribe('sensor.one', narrow, () => {});
    await service.request({ hass: {}, sources: ['sensor.one'], window: wide });
    await service.request({ hass: {}, sources: ['sensor.one'], window: narrow });
    expect(provider).toHaveBeenCalledTimes(1);
    service.invalidate({ sources: ['sensor.one'], windowKey: 'narrow' });
    await service.request({ hass: {}, sources: ['sensor.one'], window: narrow });
    expect(provider).toHaveBeenCalledTimes(2);
    stop();
  });

  it('reconciles a compatible-family refresh into the shared transition history', async () => {
    let value = 5;
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window, value));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const wide = win(100, 200, 'wide'), narrow = win(120, 200, 'narrow');
    const wideUpdates = vi.fn(), narrowUpdates = vi.fn();
    const stopWide = service.subscribe('sensor.one', wide, wideUpdates);
    const stopNarrow = service.subscribe('sensor.one', narrow, narrowUpdates);
    await service.request({ hass: {}, sources: ['sensor.one'], window: wide });
    await service.request({ hass: {}, sources: ['sensor.one'], window: narrow });
    value = 20;
    await service.request({ hass: {}, sources: ['sensor.one'], window: narrow, force: true });
    const histories = [...service.families.values()].map(journal => journal.history.observations);
    expect(histories[0]).toBe(histories[1]);
    expect(histories[0].map(sample => sample.value)).toEqual([20]);
    expect(wideUpdates.mock.calls.at(-1)[0].observations[0].value).toBe(20);
    expect(narrowUpdates.mock.calls.at(-1)[0].observations[0].value).toBe(20);
    stopWide(); stopNarrow();
  });

  it('does not let an older response from another window family replace newer source history', async () => {
    const pending = [];
    const provider = vi.fn((_hass, sources, window) => new Promise(resolve => {
      pending.push(value => resolve(result(sources[0], window, value)));
    }));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const wide = win(100, 150, 'wide'), narrow = win(120, 200, 'narrow');
    const stopWide = service.subscribe('sensor.one', wide, () => {});
    const stopNarrow = service.subscribe('sensor.one', narrow, () => {});
    const older = service.request({ hass: {}, sources: ['sensor.one'], window: wide });
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const newer = service.request({ hass: {}, sources: ['sensor.one'], window: narrow, force: true });
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1](20); await newer;
    pending[0](5); await older;
    expect([...service.sourceHistories.values()][0].observations.map(item => item.value)).toEqual([20]);
    stopWide(); stopNarrow();
  });

  it('keeps raw and statistics acquisition histories independent for the same source', async () => {
    const provider = vi.fn(async (_hass, sources, window) => result(sources[0], window,
      window.acquisition?.mode === 'statistics' ? 20 : 10));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const raw = win(100, 200, 'raw');
    const stats = { ...win(100, 200, 'stats'), acquisition: { mode: 'statistics' } };
    const stopRaw = service.subscribe('sensor.one', raw, () => {});
    const stopStats = service.subscribe('sensor.one', stats, () => {});
    const [rawResult, statsResult] = await Promise.all([
      service.request({ hass: {}, sources: ['sensor.one'], window: raw }),
      service.request({ hass: {}, sources: ['sensor.one'], window: stats }),
    ]);
    expect(rawResult.get(key('sensor.one')).observations.map(item => item.value)).toEqual([10]);
    expect(statsResult.get(key('sensor.one')).observations.map(item => item.value)).toEqual([20]);
    expect(service.sourceHistories.size).toBe(2);
    stopRaw(); stopStats();
  });
  it('bounds simultaneous acquisitions while batching compatible sources', async () => {
    const pending = [];
    const provider = vi.fn((_hass, sources, window) => new Promise(resolve => pending.push(() => resolve(
      new Map(sources.map(source => [key(source.entityId), result(source, window).get(key(source.entityId))]))))));
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const sources = Array.from({ length: 16 }, (_, index) => `sensor.n${index}`);
    const request = service.request({ hass: {}, sources, window: win() });
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(3));
    expect(provider.mock.calls.every(([, batch]) => batch.length <= 4)).toBe(true);
    pending.shift()();
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(4));
    for (const finish of pending) finish();
    expect((await request).size).toBe(16);
  });

  it('keeps transport slots occupied after timeout until the underlying request settles', async () => {
    vi.useFakeTimers();
    try {
      const pending = [];
      const provider = vi.fn(() => new Promise(resolve => pending.push(resolve)));
      const service = new SharedObservationService({ provider, now: () => 1000, requestTimeoutMs: 10 });
      const sources = Array.from({ length: 16 }, (_, index) => `sensor.timeout${index}`);
      const request = service.request({ hass: {}, sources, window: win() });
      await vi.advanceTimersByTimeAsync(11);
      const records = await request;
      expect(provider).toHaveBeenCalledTimes(3);
      expect([...records.values()].every(record => record.status === 'unavailable')).toBe(true);
      expect(service.activeBatches).toBe(3);
      for (const finish of pending) finish(new Map());
      await vi.advanceTimersByTimeAsync(0);
      expect(service.activeBatches).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it('retains raw journal rows across a statistical hour handoff', async () => {
    const first = { ...win(0, 5400000, 'statistics'), acquisition: { mode: 'statistics' } };
    const second = { ...first, end: 9000000 };
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map(source => [key(source.entityId), {
      source, observations: [{ timestamp: window.end - 1000, value: window.end === first.end ? 100 : 5,
        state: 'ok', origin: 'recorder', order: 0 }], status: 'available', retrievedAt: window.end,
      statisticsWindow: { start: 0, end: window.end === first.end ? 3600000 : 7200000 },
      rawWindow: { start: window.end === first.end ? 3600000 : 7200000, end: window.end },
      statistics: { buckets: [] }, coverage: { kind: 'incomplete' },
    }])));
    const service = new SharedObservationService({ provider, now: () => second.end });
    const dispose = service.subscribe('sensor.one', first, () => {});
    await service.request({ hass: {}, sources: ['sensor.one'], window: first });
    dispose.updateWindow(second);
    const record = (await service.request({ hass: {}, sources: ['sensor.one'], window: second })).get(key('sensor.one'));
    expect(record.observations.map(item => item.value)).toEqual([100, 5]);
    dispose();
  });
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

  it('retains all active observations after cache eviction', async () => {
    const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [key(source.entityId), {
      source, observations: [1, 9, 2].map((value, index) => ({ timestamp: window.start + index + 1, value,
        state: String(value), order: index, orderKnown: true, origin: 'recorder' })),
      acquiredWindow: { start: window.start, end: window.end }, retrievedAt: 1000,
      coverage: { complete: false, kind: 'unknown' },
    }])));
    const service = new SharedObservationService({ provider, now: () => 1000, maxEntries: 0 });
    const source = { entityId: 'sensor.one' };
    const callback = vi.fn();
    const dispose = service.subscribe(source, win(), callback);
    const record = (await service.request({ hass: {}, sources: [source], window: win() })).get(key('sensor.one'));
    expect(service.cache.size).toBe(0);
    expect(record.observations.map(item => item.value)).toEqual([1, 9, 2]);
    service.ingestLiveState({ source, state: { state: '4', last_updated: new Date(150).toISOString() } });
    expect(callback.mock.calls.at(-1)[0].observations.map(item => item.value)).toEqual([1, 9, 2, 4]);
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
    expect(a.family).toBe(b.family);
    expect(service.families.size).toBe(1);
    stopPeak();
    service.ingestLiveState({ source, state: { state: '10' }, timestamp: 150 });
    expect(floor.mock.calls.at(-1)[0].observations.some((item) => item.value === 10)).toBe(true);
    expect(service.families.size).toBe(1);
    stopFloor();
    expect(service.families.size).toBe(0);
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
    expect([...service.families.values()][0].history.observations.some((sample) => sample.timestamp === 101)).toBe(true);
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

  it('retains a non-extreme live transition to detect a later conflicting Recorder row', async () => {
    let correction = null;
    const provider = async (_hass, sources) => new Map([[key('sensor.one'), {
      source: sources[0], observations: [
        { timestamp: 101, value: 0, state: '0', order: 0, orderKnown: true, origin: 'recorder' },
        ...(correction === null ? [] : [{ timestamp: 150, value: correction, state: String(correction), order: 1, orderKnown: true, origin: 'recorder' }]),
        { timestamp: 160, value: 10, state: '10', order: 2, orderKnown: true, origin: 'recorder' },
        { timestamp: 180, value: 0, state: '0', order: 3, orderKnown: true, origin: 'recorder' },
      ], retrievedAt: 1000, coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const stop = service.subscribe('sensor.one', win(), () => {});
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args);
    service.ingestLiveState({ source: 'sensor.one', state: { state: '6' }, timestamp: 150 });
    correction = 5;
    const conflicting = (await service.request({ ...args, force: true })).get(key('sensor.one'));
    expect(calculateObservationValue(conflicting.observations, 'max', win())).toMatchObject({ value: null, orderingAmbiguous: true });
    correction = 6;
    const matching = (await service.request({ ...args, force: true })).get(key('sensor.one'));
    expect(calculateObservationValue(matching.observations, 'max', win())).toMatchObject({ value: 10, orderingAmbiguous: false });
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

  it('retains a successful cache replacement without truncating its observations', async () => {
    let large = false;
    const provider = async (_h, sources, window) => {
      const data = result(sources[0], window);
      if (large) data.get(key('sensor.one')).observations.push({ timestamp: 130, value: 30 });
      return data;
    };
    const service = new SharedObservationService({ provider, now: () => 1000 });
    const args = { hass: {}, sources: ['sensor.one'], window: win() };
    await service.request(args); large = true;
    const refreshed = (await service.request({ ...args, force: true })).get(key('sensor.one'));
    expect(refreshed.observations).toHaveLength(2);
    expect(service.cache.size).toBe(1);
    expect((await service.request(args)).get(key('sensor.one')).observations).toHaveLength(2);
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
    const merge = vi.spyOn(service, '_mergeIntoHistory');
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
    const observations = [...service.families.values()][0].history.observations;
    expect(observations.map((sample) => sample.value)).toEqual([100, 5, 100]);
    expect(calculateObservationValue(observations, 'min', win(100, 220, 'rolling')).value).toBe(100);
    first(); second(); third();
  });

  it('notifies a shared journal without remerging on invalidation or live delivery', async () => {
    const service = new SharedObservationService({ now: () => 1000,
      provider: async (_h, sources, window) => result(sources[0], window) });
    const peak = vi.fn(); const floor = vi.fn();
    const stopPeak = service.subscribe('sensor.one', win(), peak);
    const stopFloor = service.subscribe('sensor.one', win(), floor);
    await service.request({ hass: {}, sources: ['sensor.one'], window: win() });
    const merge = vi.spyOn(service, '_mergeIntoHistory');
    peak.mockClear(); floor.mockClear();
    service.invalidate({ sources: ['sensor.one'] });
    expect(merge).not.toHaveBeenCalled();
    service.ingestLiveState({ source: 'sensor.one', state: { state: '9' }, timestamp: 150 });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(peak.mock.calls.at(-1)[0]).toMatchObject({ stale: true });
    expect(floor.mock.calls.at(-1)[0]).toMatchObject({ stale: true });
    stopPeak();
    service.ingestLiveState({ source: 'sensor.one', state: { state: '10' }, timestamp: 160 });
    expect(floor.mock.calls.at(-1)[0].observations.at(-1).value).toBe(10);
    stopFloor();
  });

});
