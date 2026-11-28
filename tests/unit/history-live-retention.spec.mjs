import { describe, expect, it } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';

const source = { entityId: 'sensor.one', attribute: null };
const window = {
  start: 6_000_000, end: 12_000_000, timeZone: 'UTC',
  cacheKey: 'absolute:6000000:12000000', interval: '[start,end)',
  semantics: { kind: 'absolute' },
};
const narrowWindow = {
  start: 9_000_000, end: 12_000_000, timeZone: 'UTC',
  cacheKey: 'absolute:9000000:12000000', interval: '[start,end)',
  semantics: { kind: 'absolute' },
};

function liveState(value) {
  return { state: String(value), attributes: {} };
}

describe('bounded live observation retention', () => {
  it('compacts oldest live samples while preserving exact retained extrema', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const updates = [];
    const stop = service.subscribe(source.entityId, window, update => updates.push(update));

    for (const [index, value] of [90, 1, 2, 3, 4, 5, 6, 7, 8, 9].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 6_000_000 + index * 300_000 });
    }

    const history = [...service.sourceHistories.values()][0];
    const retainedLive = history.observations.filter(observation => observation.origin === 'live');
    expect(retainedLive.length).toBeLessThanOrEqual(4);
    expect(Number.isFinite(history.retentionFloor)).toBe(true);
    expect(updates.at(-1).retentionFloor).toBe(history.retentionFloor);

    const floor = history.retentionFloor;
    const retainedValues = history.observations
      .filter(observation => observation.origin === 'live' && observation.timestamp >= floor)
      .map(observation => observation.value);
    expect(Math.max(...retainedValues)).toBe(9);
    expect(retainedValues).not.toContain(90);

    stop();
    service.clear();
  });

  it('marks windows before the retention floor partial and keeps later windows exact', async () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const updates = [];
    const stop = service.subscribe(source.entityId, window, update => updates.push(update));
    for (const [index, value] of [90, 1, 2, 3, 4, 5, 6, 7, 8, 9].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 6_000_000 + index * 300_000 });
    }
    const latest = updates.at(-1);
    const floor = latest.retentionFloor;
    const record = {
      ...latest,
      observations: latest.observations,
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
    const spec = { source, calculation: 'max', window: { kind: 'absolute', start: window.start, end: window.end } };

    const beforeFloor = await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(beforeFloor.status).toBe('partial');
    expect(beforeFloor.value).toBe(9);

    const atFloor = await resolver.resolve({ ...spec, window: {
      kind: 'absolute', start: floor, end: window.end,
    } }, { hass: { config: { time_zone: 'UTC' } } });
    expect(atFloor.status).toBe('available');
    expect(atFloor.value).toBe(9);

    const afterFloor = await resolver.resolve({ ...spec, window: {
      kind: 'absolute', start: floor + 60_000, end: window.end,
    } }, { hass: { config: { time_zone: 'UTC' } } });
    expect(afterFloor.status).toBe('available');
    expect(afterFloor.value).toBe(9);

    stop();
    service.clear();
  });

  it('does not let an active cached record grow an independent live array', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start + 10, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start + 10, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });

    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7, 8, 9].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 6_000_000 + 300_000 + index * 70_000 });
    }
    const cached = service.cache.get(service._cacheKey(source, window));
    expect(cached.observations.filter(observation => observation.origin === 'live').length).toBeLessThanOrEqual(4);

    stop();
    service.clear();
  });

  it('does not grow an active cached record independently of shared history', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start + 10, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start + 10, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stopWide = service.subscribe(source.entityId, window, () => {});
    const stopNarrow = service.subscribe(source.entityId, narrowWindow, () => {});

    await service.request({ hass: {}, sources: [source.entityId], window });
    stopWide();
    await service.request({ hass: {}, sources: [source.entityId], window: narrowWindow, force: true });
    const cacheKey = service._cacheKey(source, narrowWindow);
    const history = [...service.sourceHistories.values()][0];
    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7, 8, 9].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + 100_000 + index * 70_000 });
    }

    const cached = service.cache.get(cacheKey);
    expect(cached.observations.filter(observation => observation.origin === 'live').length).toBeLessThanOrEqual(4);
    expect(cached.observations).toBe(history.observations);

    stopNarrow();
    service.clear();
  });

  it('bounds large equal-timestamp live groups without inventing an effective value', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    for (let index = 0; index < 20; index += 1) {
      service.ingestLiveState({
        source: source.entityId, state: liveState(index), timestamp: 9_000_000,
      });
    }
    const history = [...service.sourceHistories.values()][0];
    const live = history.observations.filter(observation => observation.origin === 'live');

    expect(live.length).toBeLessThanOrEqual(4);
    expect(live.at(-1)).toMatchObject({ value: 19, timestamp: 9_000_000 });
    expect(history.retentionFloor).toBe(9_000_000);

    stop();
    service.clear();
  });

  it('preserves equal-timestamp ambiguity instead of selecting a value', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    const history = [...service.sourceHistories.values()][0];
    history.observations = Array.from({ length: 8 }, (_, index) => ({
      timestamp: 9_000_000, value: index, state: String(index), origin: 'live',
      order: 1, orderKnown: true, orderDomain: 'live',
    }));
    service._compactLiveHistory(history);

    expect(history.observations).toHaveLength(1);
    expect(history.observations[0]).toMatchObject({ timestamp: 9_000_000, ambiguous: true, value: null });
    expect(history.retentionFloor).toBe(9_000_000);

    stop();
    service.clear();
  });

  it('keeps multiple consumers and their active cache views on one bounded history', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 3 });
    const wideUpdates = [], narrowUpdates = [];
    const stopWide = service.subscribe(source.entityId, window, update => wideUpdates.push(update));
    const stopNarrow = service.subscribe(source.entityId, narrowWindow, update => narrowUpdates.push(update));
    for (const [index, value] of [1, 2, 3, 4, 5, 6, 7, 8, 9].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + 100_000 + index * 70_000 });
    }

    const history = [...service.sourceHistories.values()][0];
    expect(service.sourceHistories.size).toBe(1);
    expect(history.observations.filter(observation => observation.origin === 'live').length).toBeLessThanOrEqual(4);
    expect(wideUpdates.at(-1).observations).toBe(history.observations);
    expect(narrowUpdates.at(-1).observations).toBe(history.observations);

    stopWide(); stopNarrow(); service.clear();
  });

  it('preserves Recorder rows in a mixed equal-timestamp group', () => {
    const service = new SharedObservationService({ now: () => 15_000_000, maxLiveObservations: 2 });
    const stop = service.subscribe(source.entityId, window, () => {});
    const history = [...service.sourceHistories.values()][0];
    history.observations = [
      { timestamp: 9_000_000, value: 90, state: '90', origin: 'live', order: 1, orderKnown: true, orderDomain: 'live' },
      { timestamp: 9_000_000, value: 5, state: '5', origin: 'recorder', order: 2, orderKnown: true, orderDomain: 'recorder:1' },
      { timestamp: 9_000_000, value: 80, state: '80', origin: 'live', order: 3, orderKnown: true, orderDomain: 'live' },
      { timestamp: 9_000_000, value: 4, state: '4', origin: 'recorder', order: 4, orderKnown: true, orderDomain: 'recorder:1' },
      { timestamp: 9_000_000, value: 70, state: '70', origin: 'live', order: 5, orderKnown: true, orderDomain: 'live' },
      { timestamp: 9_000_000, value: 3, state: '3', origin: 'recorder', order: 6, orderKnown: true, orderDomain: 'recorder:1' },
      { timestamp: 9_000_000, value: 60, state: '60', origin: 'live', order: 7, orderKnown: true, orderDomain: 'live' },
      { timestamp: 9_000_000, value: 2, state: '2', origin: 'recorder', order: 8, orderKnown: true, orderDomain: 'recorder:1' },
    ];
    service._compactLiveHistory(history);

    expect(history.observations.filter(observation => observation.origin === 'recorder')).toHaveLength(4);
    expect(history.observations.filter(observation => observation.origin === 'live').length).toBeLessThanOrEqual(1);
    expect(history.observations.at(-1)).toMatchObject({ origin: 'live', ambiguous: true, value: null });
    expect(history.retentionFloor).toBe(9_000_000);

    stop(); service.clear();
  });

  it('keeps Recorder rows and live reconciliation bounded across a refresh', async () => {
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [{
        timestamp: requested.start + 10, value: 5, state: '5', origin: 'recorder', order: 0,
      }],
      acquiredWindow: { start: requested.start, end: requested.end }, retrievedAt: 1000,
      observedThrough: requested.start + 10, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => 15_000_000, maxLiveObservations: 3 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    for (const [index, value] of [1, 2, 3, 4, 5, 6].entries()) {
      service.ingestLiveState({ source: source.entityId, state: liveState(value), timestamp: 9_000_000 + index * 70_000 });
    }
    await service.request({ hass: {}, sources: [source.entityId], window, force: true });

    const history = [...service.sourceHistories.values()][0];
    expect(history.observations.some(observation => observation.origin === 'recorder')).toBe(true);
    expect(history.observations.filter(observation => observation.origin === 'live').length).toBeLessThanOrEqual(4);
    expect(service.cache.get(service._cacheKey(source, window)).observations).toBe(history.observations);

    stop(); service.clear();
  });

  it('expires inactive cache records and releases source histories', async () => {
    let now = 1000;
    const provider = async (_hass, sources, requested) => new Map([[`${sources[0].entityId}\u0000`, {
      source: sources[0], observations: [], acquiredWindow: { start: requested.start, end: requested.end },
      retrievedAt: now, observedThrough: null, status: 'available', stale: false,
      coverage: { complete: false, kind: 'unknown' },
    }]]);
    const service = new SharedObservationService({ provider, now: () => now, ttlMs: 100 });
    const stop = service.subscribe(source.entityId, window, () => {});
    await service.request({ hass: {}, sources: [source.entityId], window });
    stop();
    expect(service.sourceHistories.size).toBe(0);
    expect(service.cache.size).toBe(1);

    now = 1100;
    service._scheduleCacheExpiry();
    expect(service.cache.size).toBe(0);
    service.clear();
  });

});
