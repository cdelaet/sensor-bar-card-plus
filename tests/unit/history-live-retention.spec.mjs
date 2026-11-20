import { describe, expect, it } from 'vitest';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';

const source = { entityId: 'sensor.one', attribute: null };
const window = {
  start: 6_000_000, end: 12_000_000, timeZone: 'UTC',
  cacheKey: 'absolute:6000000:12000000', interval: '[start,end)',
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

    const afterFloor = await resolver.resolve({ ...spec, window: {
      kind: 'absolute', start: floor, end: window.end,
    } }, { hass: { config: { time_zone: 'UTC' } } });
    expect(afterFloor.status).toBe('available');
    expect(afterFloor.value).toBe(9);

    stop();
    service.clear();
  });
});
