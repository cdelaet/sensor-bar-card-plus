import { describe, expect, it } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';

const source = { entityId: 'sensor.one', attribute: null };
const window = {
  start: 6_000_000, end: 12_000_000, timeZone: 'UTC',
  cacheKey: 'absolute:6000000:12000000', interval: '[start,end)',
  semantics: { kind: 'absolute' },
};
const spec = {
  source, calculation: 'max',
  window: { kind: 'absolute', start: window.start, end: window.end },
};

function liveState(value) {
  return { state: String(value), attributes: {} };
}

function recorderRecord(requested, options = {}) {
  const observations = options.observations ?? [{
    timestamp: requested.start, value: 5, state: '5', origin: 'recorder', order: 0,
  }];
  return {
    source, observations,
    acquiredWindow: { start: requested.start, end: requested.end },
    retrievedAt: 1000, observedThrough: requested.start,
    status: 'available', stale: false,
    coverage: { complete: false, kind: 'unknown', ...(options.coverage ?? {}) },
  };
}

function providerFor(options = {}) {
  return async (_hass, sources, requested) => new Map([[
    `${sources[0].entityId}\u0000`,
    recorderRecord(requested, options),
  ]]);
}

describe('retention floor recovery', () => {
  it('does not restore a floor when Recorder data is absent from the discarded interval', async () => {
    const service = new SharedObservationService({ provider: providerFor({ observations: [] }), now: () => 15_000_000, maxLiveObservations: 3 });
    const updates = [];
    const stop = service.subscribe(source.entityId, window, update => updates.push(update));
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const floor = [...service.sourceHistories.values()][0].retentionFloor;
    expect(Number.isFinite(floor)).toBe(true);

    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    expect([...service.sourceHistories.values()][0].retentionFloor).toBe(floor);
    stop(); service.clear();
  });

  it('restores the floor after complete raw Recorder reacquisition', async () => {
    const service = new SharedObservationService({ provider: providerFor(), now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const history = [...service.sourceHistories.values()][0];
    expect(history.retentionFloor).toBeGreaterThan(window.start);

    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    expect(history.retentionFloor).toBeLessThanOrEqual(window.start);

    const resolver = new HistoricalValueResolver({ service, now: () => 15_000_000 });
    const result = await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(result.status).toBe('available');
    expect(result.value).toBe(7);

    stop(); service.clear();
  });


  it('keeps the floor when Recorder returns no boundary at the acquired start', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start + 120_000, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start + 120_000, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const history = [...service.sourceHistories.values()][0];
    const floor = history.retentionFloor;
    expect(Number.isFinite(floor)).toBe(true);
    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    expect(history.retentionFloor).toBe(floor);
    stop(); service.clear();
  });

  it('lowers only to a partially recovered start and leaves earlier windows partial', async () => {
    const narrow = { ...window, start: 8_040_000, cacheKey: 'absolute:8040000:12000000' };
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stopWide = service.subscribe(source.entityId, window, () => {});
    const stopNarrow = service.subscribe(source.entityId, narrow, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    stopWide();
    await service.request({ hass: {}, sources: [source.entityId], window: narrow, force: true });
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    await service.request({ hass: {}, sources: [source.entityId], window: narrow, force: true });
    const history = [...service.sourceHistories.values()][0];
    expect(history.retentionFloor).toBe(8_040_000);

    const record = {
      ...history,
      observations: history.observations,
      acquiredWindow: { start: window.start, end: window.end },
      historyStart: window.start,
      status: 'available',
      coverage: { complete: false, kind: 'unknown' },
      observationsOrdered: true,
    };
    const resolver = new HistoricalValueResolver({
      now: () => 15_000_000,
      service: { request: async () => new Map([['sensor.one\u0000', record]]) },
    });
    const before = await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(before.status).toBe('partial');
    const after = await resolver.resolve({ ...spec, window: { kind: 'absolute', start: narrow.start, end: window.end } },
      { hass: { config: { time_zone: 'UTC' } } });
    expect(after.status).toBe('available');

    stopNarrow(); service.clear();
  });

  it('restores a statistics floor only for complete statistics coverage', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const history = [...service.sourceHistories.values()][0];
    const floor = history.retentionFloor;
    const consumer = [...service.consumers.values()][0];
    const statsRecord = {
      source, observations: [], acquiredWindow: { start: 0, end: 12_000_000 },
      statisticsWindow: { start: 0, end: 12_000_000 },
      statistics: { buckets: [{ start: 0, end: 12_000_000, min: 1, max: 8 }], missingBuckets: 0 },
      acquisitionMode: 'statistics', status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown', statistics: { kind: 'unknown' } },
    };
    service._consumerRecord(consumer, statsRecord, true);
    expect(history.retentionFloor).toBe(0);

    history.retentionFloor = floor;
    const incomplete = { ...statsRecord, statistics: { ...statsRecord.statistics, missingBuckets: 1 } };
    service._consumerRecord(consumer, incomplete, true);
    expect(history.retentionFloor).toBe(floor);

    stop(); service.clear();
  });



  it('uses a complete recovery for multiple consumers and repeated refreshes', async () => {
    const narrow = { ...window, start: 8_040_000, cacheKey: 'absolute:8040000:12000000' };
    const provider = providerFor();
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stopWide = service.subscribe(source.entityId, window, () => {});
    const stopNarrow = service.subscribe(source.entityId, narrow, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    const history = [...service.sourceHistories.values()][0];
    expect(history.retentionFloor).toBeLessThanOrEqual(window.start);

    const record = {
      ...history,
      observations: history.observations,
      acquiredWindow: { start: window.start, end: window.end },
      historyStart: window.start,
      status: 'available',
      coverage: { complete: false, kind: 'unknown' },
      observationsOrdered: true,
    };
    const resolver = new HistoricalValueResolver({
      now: () => 15_000_000,
      service: { request: async () => new Map([['sensor.one\u0000', record]]) },
    });
    expect((await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } })).status).toBe('available');
    expect((await resolver.resolve({ ...spec, window: { kind: 'absolute', start: narrow.start, end: window.end } },
      { hass: { config: { time_zone: 'UTC' } } })).status).toBe('available');

    // A later compaction raises the floor again; a second complete refresh
    // must re-establish the acquired coverage rather than leave the old floor.
    for (const [index, value] of [8, 9, 10, 11, 12].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 10_000_000 + index * 70_000 });
    }
    expect(history.retentionFloor).toBeGreaterThan(window.start);
    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    expect(history.retentionFloor).toBeLessThanOrEqual(window.start);

    stopWide(); stopNarrow(); service.clear();
  });



  it('does not restore when the Recorder record reports incomplete coverage', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start, status: 'available', stale: false,
      coverage: { complete: false, kind: 'incomplete' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const history = [...service.sourceHistories.values()][0];
    const floor = history.retentionFloor;
    await service.request({ hass: {}, sources: [source.entityId], window, force: true });
    expect(history.retentionFloor).toBe(floor);
    stop(); service.clear();
  });

  it('keeps recovered extrema for absolute, rolling and calendar windows', async () => {
    const now = Date.parse('2026-11-20T12:00:00Z');
    const dayStart = Date.parse('2026-11-20T00:00:00Z');
    const record = {
      source, acquiredWindow: { start: dayStart, end: now }, historyStart: dayStart,
      retentionFloor: dayStart, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
      observationsOrdered: true,
      observations: [
        { timestamp: dayStart, value: 3, state: '3', origin: 'recorder', order: 0 },
        { timestamp: now - 3_600_000, value: 9, state: '9', origin: 'live', order: 1 },
      ],
    };
    const resolver = new HistoricalValueResolver({
      now: () => now,
      service: { request: async () => new Map([['sensor.one\u0000', record]]) },
    });
    const specs = [
      { kind: 'absolute', start: dayStart, end: now },
      { kind: 'rolling', duration: { amount: 2, unit: 'hour' } },
      { kind: 'calendar', period: 'day' },
    ];
    for (const windowSpec of specs) {
      const result = await resolver.resolve({ source, calculation: 'max', window: windowSpec },
        { hass: { config: { time_zone: 'UTC' } } });
      expect(result.status, JSON.stringify(windowSpec)).toBe('available');
      expect(result.value, JSON.stringify(windowSpec)).toBe(9);
    }
  });



  it('retains a compacted cache floor when a later subscription reuses the cache', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start + 120_000, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start + 120_000, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    const oldFloor = [...service.sourceHistories.values()][0].retentionFloor;
    stop();

    const stopAgain = service.subscribe(source.entityId, window, () => {});
    const history = [...service.sourceHistories.values()][0];
    expect(history.retentionFloor).toBe(oldFloor);

    const record = {
      ...history, observations: history.observations,
      acquiredWindow: { start: window.start, end: window.end }, historyStart: window.start,
      status: 'available', coverage: { complete: false, kind: 'unknown' },
      observationsOrdered: true,
    };
    const resolver = new HistoricalValueResolver({
      now: () => 15_000_000,
      service: { request: async () => new Map([['sensor.one\u0000', record]]) },
    });
    expect((await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } })).status).toBe('partial');

    stopAgain(); service.clear();
  });

});
