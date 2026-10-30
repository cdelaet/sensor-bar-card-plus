import { describe, expect, it, vi } from 'vitest';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';
import { SharedObservationService } from '../../src/history/observation-service.js';

const sourceKey = 'sensor.soil\u0000';
const spec = { provider: 'recorder_history', source: { entityId: 'sensor.soil' }, calculation: 'max',
  window: { kind: 'calendar', period: 'day' } };

describe('historical value resolver', () => {
  it('resolves max as a partial Recorder value without presentation fields', async () => {
    const service = new SharedObservationService({ now: () => Date.parse('2026-05-13T10:00:00Z'),
      provider: async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.start + 1000, value: 22 }, { timestamp: window.start + 2000, value: 38 }],
        status: 'available', retrievedAt: Date.parse('2026-05-13T10:00:00Z'), observedThrough: window.end,
        coverage: { complete: false, kind: 'unknown' },
      }])) });
    const resolver = new HistoricalValueResolver({ service, now: () => Date.parse('2026-05-13T10:00:00Z') });
    const result = await resolver.resolve(spec, { hass: { config: { time_zone: 'Europe/Brussels' } } });
    expect(result).toMatchObject({ value: 38, status: 'partial', calculation: 'max', source: { provider: 'recorder_history', entityId: 'sensor.soil' } });
    expect(result.window.interval).toBe('[start,end)');
    expect(result.provenance.coverage.complete).toBe(false);
    expect(result).not.toHaveProperty('color');
  });

  it('publishes pending and a result, then stops publishing after disposal', async () => {
    const service = new SharedObservationService({ now: () => 1000,
      provider: async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.start + 1, value: 8 }], retrievedAt: 1000,
        observedThrough: window.end, coverage: { complete: false, kind: 'unknown' },
      }])) });
    const resolver = new HistoricalValueResolver({ service, now: () => 1000 });
    const callback = vi.fn();
    const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
    expect(callback.mock.calls[0][0].status).toBe('pending');
    await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 8)).toBe(true));
    const before = callback.mock.calls.length;
    dispose();
    service.ingestLiveState({ source: { entityId: 'sensor.soil' }, state: { state: '11', last_updated: new Date(1500).toISOString() } });
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(before);
  });

  it('re-resolves the live 10:00 to 10:05 update against the advancing calendar window', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const hass = { config: { time_zone: 'UTC' }, locale: { language: 'en-GB', first_weekday: 'monday' } };
    const service = new SharedObservationService({ now: () => clock,
      provider: async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.end - 1000, value: 24, state: '24', order: 0,
          orderKnown: true, origin: 'recorder' }], retrievedAt: clock,
        observedThrough: window.end - 1000, coverage: { complete: false, kind: 'unknown' },
      }])) });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn();
    const dispose = resolver.watch(spec, { hass }, callback);
    await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 24)).toBe(true));
    clock = Date.parse('2026-05-13T10:05:10Z');
    resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, {
      state: '38', last_updated: '2026-05-13T10:05:00Z', attributes: {},
    });
    await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 38
      && item.window.end === clock)).toBe(true));
    expect(callback.mock.calls.at(-1)[0].status).toBe('partial');
    dispose();
  });

  it('advances a calendar window locally each minute without repeating the history query', async () => {
    vi.useFakeTimers();
    try {
      let clock = Date.parse('2026-05-13T10:00:00Z');
      const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.end - 1000, value: 24, state: '24', order: 0,
          orderKnown: true, origin: 'recorder' }], retrievedAt: clock, coverage: { complete: false, kind: 'unknown' },
      }])));
      const service = new SharedObservationService({ now: () => clock, provider });
      const resolver = new HistoricalValueResolver({ service, now: () => clock });
      const callback = vi.fn();
      const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
      await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 24)).toBe(true));
      clock = Date.parse('2026-05-13T10:05:00Z');
      await vi.advanceTimersByTimeAsync(60_001);
      expect(callback.mock.calls.at(-1)[0].window.end).toBe(clock);
      expect(provider).toHaveBeenCalledOnce();
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('expires rolling extrema locally without issuing another history request', async () => {
    vi.useFakeTimers();
    try {
      let clock = Date.parse('2026-05-13T10:00:00Z');
      const rollingSpec = { ...spec, window: { kind: 'rolling', duration: { amount: 5, unit: 'minute' } } };
      const provider = vi.fn(async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
          source,
          observations: [
            { timestamp: window.start + 10_000, value: 90, state: '90', order: 0, orderKnown: true, origin: 'recorder' },
            { timestamp: window.start + 60_000, value: 40, state: '40', order: 1, orderKnown: true, origin: 'recorder' },
          ],
          retrievedAt: clock, observedThrough: window.end - 1000,
          coverage: { complete: false, kind: 'unknown' },
        }])));
      const service = new SharedObservationService({ now: () => clock, provider });
      const resolver = new HistoricalValueResolver({ service, now: () => clock });
      const callback = vi.fn();
      const dispose = resolver.watch(rollingSpec, { hass: { config: { time_zone: 'UTC' } } }, callback);
      await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 90)).toBe(true));
      clock = Date.parse('2026-05-13T10:01:01Z');
      await vi.advanceTimersByTimeAsync(61_000);
      expect(callback.mock.calls.at(-1)[0].value).toBe(40);
      expect(provider).toHaveBeenCalledOnce();
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores an obsolete earlier-period response after a newer refresh completes', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const pending = [];
    const provider = vi.fn((_hass, sources, window) => new Promise((resolve) => {
      const value = pending.length === 0 ? 91 : 28;
      pending.push(() => resolve(new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.start + 1000, value,
          state: String(value), order: 0, orderKnown: true }],
        retrievedAt: clock, coverage: { complete: false, kind: 'unknown' },
      }]))));
    }));
    const service = new SharedObservationService({ now: () => clock, provider });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn();
    const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    clock = Date.parse('2026-05-14T10:00:00Z');
    dispose.refresh();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1]();
    await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 28)).toBe(true));
    pending[0]();
    await Promise.resolve();
    expect(callback.mock.calls.at(-1)[0].value).toBe(28);
    dispose();
  });

  it('returns invalid for unsupported specifications and unavailable for empty history', async () => {
    const resolver = new HistoricalValueResolver({ now: () => 1000 });
    expect((await resolver.resolve({ ...spec, calculation: 'mean' }, { hass: { config: { time_zone: 'UTC' } } })).status)
      .toBe('invalid');
    const emptyResolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider: async (_h, sources) =>
      new Map(sources.map((source) => [sourceKey, { source, observations: [], retrievedAt: 1000,
        coverage: { complete: false, kind: 'unknown' } }])) }), now: () => 1000 });
    const result = await emptyResolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(result.value).toBeNull();
    expect(result.status).toBe('unavailable');
  });
  it('reevaluates a live observation at the exclusive end promptly', async () => {
    vi.useFakeTimers();
    try {
      const start = Date.parse('2026-05-13T10:00:10Z');
      vi.setSystemTime(start);
      const provider = async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
        observations: [{ timestamp: window.start + 1, value: 5 }], coverage: { complete: false }, retrievedAt: Date.now() }]]);
      const service = new SharedObservationService({ provider });
      const resolver = new HistoricalValueResolver({ service });
      const callback = vi.fn();
      const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
      await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 5)).toBe(true));
      resolver.ingestLiveState({}, { entityId: 'sensor.soil' }, { state: '30' }, Date.now());
      await vi.advanceTimersByTimeAsync(3);
      expect(callback.mock.calls.at(-1)[0].value).toBe(30);
      dispose();
    } finally { vi.useRealTimers(); }
  });

  it('keeps a failed refresh stale after live delivery and clears it after recovery', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z'); let fail = false;
    const provider = vi.fn(async (_h, sources, window) => {
      if (fail) throw new Error('offline');
      return new Map([[sourceKey, { source: sources[0], observations: [{ timestamp: window.start + 1,
        value: 5, state: '5', order: 0, orderKnown: true, origin: 'recorder' }],
        coverage: { complete: false }, retrievedAt: clock }]]);
    });
    const service = new SharedObservationService({ provider, now: () => clock });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn(); const hass = { config: { time_zone: 'UTC' } };
    const dispose = resolver.watch(spec, { hass }, callback);
    await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 5)).toBe(true));
    fail = true; await dispose.refresh();
    expect(callback.mock.calls.at(-1)[0].status).toBe('stale');
    clock += 1000;
    resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '6' }, clock - 1);
    expect(callback.mock.calls.at(-1)[0].status).toBe('stale');
    expect(callback.mock.calls.at(-1)[0].provenance.error).toBeTruthy();
    fail = false; await dispose.refresh();
    expect(callback.mock.calls.at(-1)[0].freshness.stale).toBe(false);
    expect(callback.mock.calls.at(-1)[0].provenance.error).toBeNull();
    dispose();
  });

  it('resolves ordered equal-timestamp transitions from Recorder through the resolver', async () => {
    const clock = Date.parse('2026-05-13T10:00:00Z');
    const provider = async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
      observations: [100, 5, 100].map((value, order) => ({ timestamp: window.start + 1,
        value, state: String(value), order, orderKnown: true, origin: 'recorder' })),
      coverage: { complete: false }, retrievedAt: clock }]]);
    const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider, now: () => clock }), now: () => clock });
    const result = await resolver.resolve({ ...spec, calculation: 'min' }, { hass: { config: { time_zone: 'UTC' } } });
    expect(result.value).toBe(100);
  });

  it('expires a one-minute rolling maximum at the superseding transition boundary', async () => {
    vi.useFakeTimers();
    try {
      const start = Date.parse('2026-05-13T10:00:30Z'); vi.setSystemTime(start);
      const provider = async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
        observations: [{ timestamp: window.start - 1000, value: 90, state: '90' },
          { timestamp: window.start + 10_000, value: 5, state: '5' }],
        coverage: { complete: false }, retrievedAt: Date.now() }]]);
      const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider }) });
      const callback = vi.fn();
      const dispose = resolver.watch({ ...spec, window: { kind: 'rolling', duration: { amount: 1, unit: 'minute' } } },
        { hass: { config: { time_zone: 'UTC' } } }, callback);
      await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 90)).toBe(true));
      await vi.advanceTimersByTimeAsync(start + 9_999 - Date.now());
      expect(callback.mock.calls.at(-1)[0].value).toBe(90);
      await vi.advanceTimersByTimeAsync(4);
      expect(callback.mock.calls.at(-1)[0].value).toBe(5);
      dispose();
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('rolls into the new calendar day and reuses one listener across refreshes', async () => {
    vi.useFakeTimers();
    try {
      const start = Date.parse('2026-05-13T23:59:58Z'); vi.setSystemTime(start);
      const provider = vi.fn(async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
        observations: [{ timestamp: window.start, value: new Date(window.start).getUTCDate(), state: 'ok' }],
        retrievedAt: Date.now(), coverage: { complete: false } }]]));
      const service = new SharedObservationService({ provider });
      const resolver = new HistoricalValueResolver({ service });
      const callback = vi.fn(); const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
      await vi.waitFor(() => expect(callback.mock.calls.some(([item]) => item.value === 13)).toBe(true));
      await dispose.refresh(); await dispose.refresh();
      expect(service.consumers.size).toBe(1);
      await vi.advanceTimersByTimeAsync(start + 2003 - Date.now());
      await vi.waitFor(() => expect(callback.mock.calls.at(-1)[0].value).toBe(14));
      expect(callback.mock.calls.at(-1)[0].window.start).toBe(Date.parse('2026-05-14T00:00:00Z'));
      expect(service.consumers.size).toBe(1);
      dispose();
      expect(service.consumers.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('does not publish after disposal during an acquisition', async () => {
    let complete;
    const provider = (_h, sources, window) => new Promise((resolve) => { complete = () => resolve(new Map([[sourceKey, {
      source: sources[0], observations: [{ timestamp: window.start + 1, value: 9 }], coverage: { complete: false },
    }]])); });
    const service = new SharedObservationService({ provider });
    const callback = vi.fn(); const resolver = new HistoricalValueResolver({ service });
    const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } } }, callback);
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
    dispose(); const calls = callback.mock.calls.length;
    complete(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(calls);
    expect(service.consumers.size).toBe(0);
  });

  it('withholds a result when conflicting equal-time observations are unordered', async () => {
    const clock = Date.parse('2026-05-13T10:00:00Z');
    const provider = async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
      observations: [100, 5].map((value) => ({ timestamp: window.start + 1, value, state: String(value) })),
      retrievedAt: clock, coverage: { complete: false } }]]);
    const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider, now: () => clock }), now: () => clock });
    const resolved = await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(resolved.value).toBeNull();
    expect(resolved.status).toBe('partial');
  });

  it('keeps ordered equal-time extrema through refresh with a live update during acquisition', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const pending = [];
    const provider = (_h, sources, window) => new Promise((resolve) => pending.push(() => resolve(new Map([[sourceKey, {
      source: sources[0], observations: [100, 5, 100].map((value, order) => ({ timestamp: window.start + 1000,
        value, state: String(value), order, orderKnown: true, origin: 'recorder' })),
      coverage: { complete: false }, retrievedAt: clock,
    }]]))));
    const service = new SharedObservationService({ provider, now: () => clock });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn(); const hass = { config: { time_zone: 'UTC' } };
    const dispose = resolver.watch({ ...spec, calculation: 'min' }, { hass }, callback);
    await vi.waitFor(() => expect(pending).toHaveLength(1)); pending.shift()();
    await vi.waitFor(() => expect(callback.mock.calls.at(-1)[0].value).toBe(100));
    const refresh = dispose.refresh();
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    clock += 2000;
    resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '50' }, clock - 1000);
    pending.shift()(); await refresh;
    expect(callback.mock.calls.at(-1)[0].value).toBe(50);
    expect(callback.mock.calls.at(-1)[0].status).toBe('partial');
    expect([...service.journals.values()][0].observations.filter((item) => item.origin === 'recorder')).toHaveLength(3);
    dispose();
  });

  it('processes one live event once for shared peak and floor watchers', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const provider = async (_h, sources, window) => new Map([[sourceKey, { source: sources[0],
      observations: [{ timestamp: window.start + 1, value: 5, state: '5', order: 0,
        orderKnown: true, origin: 'recorder' }], retrievedAt: clock, coverage: { complete: false } }]]);
    const service = new SharedObservationService({ provider, now: () => clock });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const hass = { config: { time_zone: 'UTC' } }; const peak = vi.fn(); const floor = vi.fn();
    const stopPeak = resolver.watch(spec, { hass }, peak);
    const stopFloor = resolver.watch({ ...spec, calculation: 'min' }, { hass }, floor);
    await vi.waitFor(() => { expect(peak.mock.calls.at(-1)[0].value).toBe(5); expect(floor.mock.calls.at(-1)[0].value).toBe(5); });
    const merge = vi.spyOn(service, '_mergeIntoConsumer');
    clock += 2000;
    resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '9' }, clock - 1000);
    expect(merge).toHaveBeenCalledTimes(1);
    expect(peak.mock.calls.at(-1)[0].value).toBe(9);
    expect(floor.mock.calls.at(-1)[0].value).toBe(5);
    stopPeak(); stopFloor();
  });

});
