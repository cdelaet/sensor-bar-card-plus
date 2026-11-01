import { describe, expect, it, vi } from 'vitest';
import { HistoricalValueResolver } from '../../src/history/value-resolver.js';
import { SharedObservationService } from '../../src/history/observation-service.js';
import { fetchPlannedHistory } from '../../src/history/history-provider.js';
import { calculateObservationValue } from '../support/history-observation-oracle.mjs';

const sourceKey = 'sensor.soil\u0000';
const spec = { provider: 'recorder_history', source: { entityId: 'sensor.soil' }, calculation: 'max',
  window: { kind: 'calendar', period: 'day' } };
const HOUR_MS = 60 * 60 * 1000;

function statisticsFixture(now, missingBucket = null) {
  const octoberStart = Date.parse('2026-10-01T00:00:00Z');
  const novemberStart = Date.parse('2026-11-01T00:00:00Z');
  const statisticsRequests = [];
  const callWS = vi.fn(async request => {
    if (request.type === 'recorder/get_statistics_metadata') {
      return [{ statistic_id: 'sensor.soil', has_mean: true }];
    }
    statisticsRequests.push(request);
    const start = Date.parse(request.start_time), end = Date.parse(request.end_time);
    const rows = [];
    for (let bucketStart = start; bucketStart < end; bucketStart += HOUR_MS) {
      if (bucketStart === missingBucket) continue;
      const october = bucketStart >= octoberStart && bucketStart < novemberStart;
      rows.push({ start: bucketStart, end: bucketStart + HOUR_MS,
        min: october ? 19.6 : 10, max: october ? 23.8 : 29.6 });
    }
    return { 'sensor.soil': rows };
  });
  const hass = { callWS, config: { time_zone: 'UTC' } };
  const service = new SharedObservationService({ provider: fetchPlannedHistory, now: () => now });
  const resolver = new HistoricalValueResolver({ service, now: () => now });
  const october = { ...spec, window: { kind: 'shifted_calendar', period: 'month', shift: { amount: -1, unit: 'month' } } };
  const year = { ...spec, window: { kind: 'calendar', period: 'year' } };
  const resolvePair = async windowSpec => Promise.all([
    resolver.resolve({ ...windowSpec, calculation: 'max' }, { hass, now }),
    resolver.resolve({ ...windowSpec, calculation: 'min' }, { hass, now }),
  ]);
  return { resolver, october, year, resolvePair, statisticsRequests, service };
}

describe('historical value resolver', () => {
  it.each(['October → year → October', 'year → October'])('keeps October values and coverage invariant for %s', async sequence => {
    const now = Date.parse('2026-11-01T00:00:00Z');
    const { october, year, resolvePair, statisticsRequests, service } = statisticsFixture(now,
      Date.parse('2026-03-01T00:00:00Z'));
    let firstOctober = null;
    if (sequence.startsWith('October')) firstOctober = await resolvePair(october);
    const yearValues = await resolvePair(year);
    expect(yearValues.map(result => result.status)).toEqual(['partial', 'partial']);
    const octoberValues = await resolvePair(october);
    expect(octoberValues.map(({ value, status }) => ({ value, status }))).toEqual([
      { value: 23.8, status: 'available' }, { value: 19.6, status: 'available' },
    ]);
    if (firstOctober) expect(octoberValues.map(({ value, status }) => ({ value, status })))
      .toEqual(firstOctober.map(({ value, status }) => ({ value, status })));
    expect(statisticsRequests).toHaveLength(11);
    service.clear();
  });

  it('reuses a complete broad statistics acquisition for a narrower window', async () => {
    const now = Date.parse('2026-11-01T00:00:00Z');
    const { october, year, resolvePair, statisticsRequests, service } = statisticsFixture(now);
    const yearValues = await resolvePair(year);
    expect(yearValues.map(result => result.status)).toEqual(['available', 'available']);
    const octoberValues = await resolvePair(october);
    expect(octoberValues.map(({ value, status }) => ({ value, status }))).toEqual([
      { value: 23.8, status: 'available' }, { value: 19.6, status: 'available' },
    ]);
    expect(octoberValues.map(result => result.freshness.cache)).toEqual(['hit', 'hit']);
    expect(statisticsRequests).toHaveLength(10);
    service.clear();
  });

  it('keeps a genuinely incomplete October window partial', async () => {
    const now = Date.parse('2026-11-01T00:00:00Z');
    const { october, resolvePair, statisticsRequests, service } = statisticsFixture(now,
      Date.parse('2026-10-15T12:00:00Z'));
    const octoberValues = await resolvePair(october);
    expect(octoberValues.map(({ value, status }) => ({ value, status }))).toEqual([
      { value: 23.8, status: 'partial' }, { value: 19.6, status: 'partial' },
    ]);
    expect(statisticsRequests).toHaveLength(1);
    service.clear();
  });

  it('reports unaligned Kathmandu calendar statistics as unavailable with a reason', async () => {
    const now = Date.parse('2026-10-31T12:00:00Z');
    const resolver = new HistoricalValueResolver({ now: () => now });
    const callWS = vi.fn();
    const result = await resolver.resolve({ ...spec,
      window: { kind: 'shifted_calendar', period: 'month', shift: { amount: -1, unit: 'month' } } },
    { hass: { callWS, config: { time_zone: 'Asia/Kathmandu' } } });
    expect(result.status).toBe('unavailable');
    expect(result.provenance.error.message).toContain('whole UTC-hour');
    expect(callWS).not.toHaveBeenCalled();
  });
  it('shares exact peak and floor for a full day of one-second observations', async () => {
    const now = Date.parse('2026-10-31T12:00:00Z');
    const states = Array.from({ length: 86400 }, (_, index) => ({
      s: String(index === 1 ? 1000 : index === 2 ? -1000 : index % 31),
      lu: (now - 86400000 + index * 1000) / 1000,
    }));
    const callWS = vi.fn(async () => ({ 'sensor.soil': states }));
    const hass = { callWS, config: { time_zone: 'UTC' } };
    const service = new SharedObservationService({ now: () => now });
    const resolver = new HistoricalValueResolver({ service, now: () => now });
    const rolling = { ...spec, window: { kind: 'rolling', duration: { amount: 24, unit: 'hour' } } };
    const peak = vi.fn(), floor = vi.fn();
    const stopPeak = resolver.watch(rolling, { hass }, peak);
    const stopFloor = resolver.watch({ ...rolling, calculation: 'min' }, { hass }, floor);
    await vi.waitFor(() => {
      expect(peak.mock.calls.at(-1)?.[0].value).toBe(1000);
      expect(floor.mock.calls.at(-1)?.[0].value).toBe(-1000);
      expect(peak.mock.calls.at(-1)?.[0].status).toBe('available');
      expect(floor.mock.calls.at(-1)?.[0].status).toBe('available');
    }, { timeout: 10000 });
    expect(callWS).toHaveBeenCalledTimes(1);
    stopPeak(); stopFloor();
  }, 15000);

  it('updates shared minute extrema for ordered, invalid, and out-of-order live transitions', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const service = new SharedObservationService({ now: () => clock, provider: async (_hass, sources, window) => new Map([[sourceKey, {
      source: sources[0], observations: [{ timestamp: window.start, value: 5, state: '5', origin: 'recorder', order: 0, orderKnown: true }],
      retrievedAt: clock, coverage: { kind: 'unknown', complete: false },
    }]]) });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const hass = { config: { time_zone: 'UTC' } }, peak = vi.fn(), floor = vi.fn();
    const stopPeak = resolver.watch(spec, { hass }, peak), stopFloor = resolver.watch({ ...spec, calculation: 'min' }, { hass }, floor);
    await vi.waitFor(() => expect(peak.mock.calls.at(-1)[0].value).toBe(5));
    clock += 10000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '30' }, clock - 1);
    clock += 1000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '-5' }, clock - 1);
    expect(peak.mock.calls.at(-1)[0].value).toBe(30);
    expect(floor.mock.calls.at(-1)[0].value).toBe(-5);
    clock += 1000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: 'unavailable' }, clock - 1);
    clock += 1000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '25' }, clock - 1);
    expect(peak.mock.calls.at(-1)[0].value).toBe(30);
    expect(floor.mock.calls.at(-1)[0].value).toBe(-5);
    clock += 1000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '50' }, clock - 2500);
    expect(peak.mock.calls.at(-1)[0].value).toBe(50);
    stopPeak(); stopFloor();
  });

  it('shares covering source history between different rolling durations', async () => {
    let clock = Date.parse('2026-05-13T10:00:30Z');
    const callWS = vi.fn(async () => ({ 'sensor.soil': [
      { s: '90', lu: Date.parse('2026-05-13T09:58:15Z') / 1000 },
      { s: '5', lu: Date.parse('2026-05-13T09:59:00Z') / 1000 },
    ] }));
    const hass = { callWS, config: { time_zone: 'UTC' } };
    const service = new SharedObservationService({ now: () => clock });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const rolling = minutes => ({ ...spec, window: { kind: 'rolling', duration: { amount: minutes, unit: 'minute' } } });
    const wide = vi.fn(), narrow = vi.fn();
    const stopWide = resolver.watch(rolling(2), { hass }, wide);
    const stopNarrow = resolver.watch(rolling(1), { hass }, narrow);
    await vi.waitFor(() => {
      expect(wide.mock.calls.at(-1)[0].value).toBe(90);
      expect(narrow.mock.calls.at(-1)[0].value).toBe(5);
    });
    expect(callWS).toHaveBeenCalledOnce();
    expect(service.sourceHistories.size).toBe(1);
    clock += 1000; resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '50' }, clock - 1);
    expect(wide.mock.calls.at(-1)[0].value).toBe(90);
    expect(narrow.mock.calls.at(-1)[0].value).toBe(50);
    stopWide();
    expect(service.sourceHistories.size).toBe(1);
    stopNarrow();
    expect(service.sourceHistories.size).toBe(0);
  });

  it('matches the transition oracle while live updates cross minute boundaries', async () => {
    let clock = Date.parse('2026-05-13T10:00:30Z');
    const initial = { timestamp: Date.parse('2026-05-13T09:59:00Z'), value: 5, state: '5',
      origin: 'recorder', order: 0, orderKnown: true };
    const service = new SharedObservationService({ now: () => clock, provider: async (_hass, sources) => new Map([[sourceKey, {
      source: sources[0], observations: [initial], retrievedAt: clock, coverage: { complete: false, kind: 'unknown' },
    }]]) });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const hass = { config: { time_zone: 'UTC' } }, peak = vi.fn(), floor = vi.fn();
    const rolling = { ...spec, window: { kind: 'rolling', duration: { amount: 1, unit: 'minute' } } };
    const stopPeak = resolver.watch(rolling, { hass }, peak);
    const stopFloor = resolver.watch({ ...rolling, calculation: 'min' }, { hass }, floor);
    await vi.waitFor(() => expect(peak.mock.calls.at(-1)[0].value).toBe(5));
    const samples = [initial]; let seed = 7;
    for (let index = 0; index < 120; index += 1) {
      clock += 1000; seed = (seed * 1664525 + 1013904223) >>> 0;
      const value = index % 17 === 0 ? null : (seed % 201) - 100;
      const state = value === null ? 'unavailable' : String(value);
      const timestamp = clock - 1;
      samples.push({ timestamp, value, state, origin: 'live', order: index + 1, orderKnown: true });
      resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state }, timestamp);
      const window = { start: Math.floor(clock / 60000) * 60000 - 60000, end: clock };
      expect(peak.mock.calls.at(-1)[0].value).toBe(calculateObservationValue(samples, 'max', window).value);
      expect(floor.mock.calls.at(-1)[0].value).toBe(calculateObservationValue(samples, 'min', window).value);
    }
    stopPeak(); stopFloor();
  });
  it('resolves long rolling extrema from hourly statistics and the raw current hour', async () => {
    const now = Date.parse('2026-10-31T12:30:00Z');
    const callWS = vi.fn(async request => {
      if (request.type === 'recorder/get_statistics_metadata') return [{ statistic_id: 'sensor.soil', mean_type: 1 }];
      if (request.type === 'history/history_during_period') return { 'sensor.soil': [{ s: '8', lu: now / 1000 - 100 }] };
      const start = Date.parse(request.start_time), end = Date.parse(request.end_time);
      return { 'sensor.soil': Array.from({ length: (end - start) / 3600000 }, (_, index) => ({
        start: start + index * 3600000, end: start + (index + 1) * 3600000, min: 2, max: index === 0 ? 100 : 20,
      })) };
    });
    const resolver = new HistoricalValueResolver({ now: () => now, serviceOptions: { now: () => now } });
    const hass = { callWS, config: { time_zone: 'UTC' } };
    const longSpec = { ...spec, window: { kind: 'rolling', duration: { amount: 48, unit: 'hour' } } };
    const max = await resolver.resolve(longSpec, { hass });
    const min = await resolver.resolve({ ...longSpec, calculation: 'min' }, { hass });
    expect(max).toMatchObject({ value: 100, status: 'available', provenance: { selectedTimestamp: null } });
    expect(min).toMatchObject({ value: 2, status: 'available', provenance: { selectedTimestamp: null } });
    expect(callWS.mock.calls.filter(([request]) => request.type === 'history/history_during_period')).toHaveLength(1);
  });

  it('keeps a raw extremum when a completed-hour bucket is delayed', async () => {
    vi.useFakeTimers();
    try {
      const now = Date.parse('2026-10-31T12:59:59Z');
      vi.setSystemTime(now);
      const callWS = vi.fn(async request => {
        if (request.type === 'recorder/get_statistics_metadata') return [{ statistic_id: 'sensor.soil', mean_type: 1 }];
        if (request.type === 'history/history_during_period') return { 'sensor.soil': [
          { s: Date.now() < now + 1000 ? '100' : '5', lu: Date.now() / 1000 - 0.5 },
        ] };
        const start = Date.parse(request.start_time), end = Date.parse(request.end_time);
        return { 'sensor.soil': Array.from({ length: (end - start) / 3600000 }, (_, index) => ({
          start: start + index * 3600000, end: start + (index + 1) * 3600000, min: 1, max: 10,
        })).filter(bucket => bucket.start !== Date.parse('2026-10-31T12:00:00Z')) };
      });
      const hass = { callWS, config: { time_zone: 'UTC' } };
      const resolver = new HistoricalValueResolver();
      const callback = vi.fn();
      const dispose = resolver.watch({ ...spec, window: { kind: 'rolling', duration: { amount: 48, unit: 'hour' } } },
        { hass }, callback);
      await vi.advanceTimersByTimeAsync(10);
      expect(callback.mock.calls.at(-1)[0]).toMatchObject({ value: 100, status: 'available' });
      await vi.advanceTimersByTimeAsync(1100);
      expect(callback.mock.calls.at(-1)[0]).toMatchObject({ value: 100, status: 'partial' });
      dispose();
    } finally { vi.useRealTimers(); }
  });

  it('deduplicates recent-bucket retries and recovers after repeated failures', async () => {
    vi.useFakeTimers();
    try {
      const now = Date.parse('2026-10-31T13:00:01Z'); vi.setSystemTime(now);
      const bucketStart = now - 3601000;
      let retries = 0;
      const callWS = vi.fn(async request => {
        if (request.type === 'recorder/get_statistics_metadata') return [{ statistic_id: 'sensor.soil', mean_type: 1 }];
        if (request.type === 'history/history_during_period') return { 'sensor.soil': [{ s: '5', lu: now / 1000 - 1 }] };
        const start = Date.parse(request.start_time), end = Date.parse(request.end_time);
        if (start === bucketStart && end - start === 3600000) {
          retries += 1;
          if (retries < 3) throw new Error('not ready');
          return { 'sensor.soil': [{ start, end, min: -20, max: 100 }] };
        }
        return { 'sensor.soil': Array.from({ length: (end - start) / 3600000 }, (_, index) => ({
          start: start + index * 3600000, end: start + (index + 1) * 3600000, min: 1, max: 10,
        })).filter(bucket => bucket.start !== bucketStart) };
      });
      const hass = { callWS, config: { time_zone: 'UTC' } };
      const resolver = new HistoricalValueResolver();
      const rolling = { ...spec, window: { kind: 'rolling', duration: { amount: 48, unit: 'hour' } } };
      const peak = vi.fn(), floor = vi.fn();
      const stopPeak = resolver.watch(rolling, { hass, liveCoverageStart: () => now }, peak);
      const stopFloor = resolver.watch({ ...rolling, calculation: 'min' }, { hass, liveCoverageStart: () => now }, floor);
      await vi.advanceTimersByTimeAsync(10);
      expect(peak.mock.calls.at(-1)[0].status).toBe('partial');
      await vi.advanceTimersByTimeAsync(36000);
      expect(retries).toBe(3);
      expect(peak.mock.calls.at(-1)[0]).toMatchObject({ value: 100, status: 'available' });
      expect(floor.mock.calls.at(-1)[0]).toMatchObject({ value: -20, status: 'available' });
      expect(callWS.mock.calls.filter(([request]) => request.type === 'recorder/statistics_during_period'
        && Date.parse(request.start_time) !== bucketStart)).toHaveLength(1);
      stopPeak(); stopFloor();
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it('resolves max with unknown coverage as available without presentation fields', async () => {
    const service = new SharedObservationService({ now: () => Date.parse('2026-05-13T10:00:00Z'),
      provider: async (_hass, sources, window) => new Map(sources.map((source) => [sourceKey, {
        source, observations: [{ timestamp: window.start + 1000, value: 22 }, { timestamp: window.start + 2000, value: 38 }],
        status: 'available', retrievedAt: Date.parse('2026-05-13T10:00:00Z'), observedThrough: window.end,
        coverage: { complete: false, kind: 'unknown' },
      }])) });
    const resolver = new HistoricalValueResolver({ service, now: () => Date.parse('2026-05-13T10:00:00Z') });
    const result = await resolver.resolve(spec, { hass: { config: { time_zone: 'Europe/Brussels' } } });
    expect(result).toMatchObject({ value: 38, status: 'available', calculation: 'max', source: { provider: 'recorder_history', entityId: 'sensor.soil' } });
    expect(result.window.interval).toBe('[start,end)');
    expect(result.provenance.coverage.complete).toBe(false);
    expect(result.provenance.coverage.kind).toBe('unknown');
    expect(result).not.toHaveProperty('color');
  });

  it.each([
    [{ complete: true, kind: 'complete' }, 'available'],
    [{ complete: false, kind: 'incomplete', reason: 'Missing interval' }, 'partial'],
  ])('classifies explicit coverage %j as %s', async (coverage, status) => {
    const now = Date.parse('2026-05-13T10:00:00Z');
    const provider = async (_hass, sources, window) => new Map([[sourceKey, {
      source: sources[0], observations: [{ timestamp: window.start + 1000, value: 22 }],
      retrievedAt: now, coverage,
    }]]);
    const resolver = new HistoricalValueResolver({ service: new SharedObservationService({ provider, now: () => now }), now: () => now });
    const result = await resolver.resolve(spec, { hass: { config: { time_zone: 'UTC' } } });
    expect(result).toMatchObject({ value: 22, status, provenance: { coverage } });
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

  it('keeps an uncovered tail partial when live coverage starts after the acquisition', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    let finish;
    const provider = (_hass, sources, window) => new Promise(resolve => { finish = () => resolve(new Map([[sourceKey, {
      source: sources[0], observations: [{ timestamp: window.start + 1, value: 8 }],
      retrievedAt: clock, coverage: { complete: false, kind: 'unknown' },
    }]])); });
    const service = new SharedObservationService({ provider, now: () => clock });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn(); const start = clock;
    const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } }, liveCoverageStart: () => start + 1000 }, callback);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    clock += 2000; finish();
    await vi.waitFor(() => expect(callback.mock.calls.at(-1)[0].value).toBe(8));
    expect(callback.mock.calls.at(-1)[0].status).toBe('partial');
    dispose();
  });

  it('retains explicitly incomplete Recorder coverage after a live observation', async () => {
    let clock = Date.parse('2026-05-13T10:00:00Z');
    const service = new SharedObservationService({ now: () => clock,
      provider: async (_hass, sources, window) => new Map([[sourceKey, {
        source: sources[0], observations: [{ timestamp: window.start + 1, value: 8 }], retrievedAt: clock,
        coverage: { complete: false, kind: 'incomplete', reason: 'Missing interval' },
      }]]) });
    const resolver = new HistoricalValueResolver({ service, now: () => clock });
    const callback = vi.fn(); const liveStart = clock;
    const dispose = resolver.watch(spec, { hass: { config: { time_zone: 'UTC' } }, liveCoverageStart: () => liveStart }, callback);
    await vi.waitFor(() => expect(callback.mock.calls.at(-1)[0].value).toBe(8));
    expect(callback.mock.calls.at(-1)[0].status).toBe('partial');
    clock += 2000;
    resolver.ingestLiveState({}, { entityId: 'sensor.soil' }, { state: '9' }, clock - 1000);
    expect(callback.mock.calls.at(-1)[0]).toMatchObject({ value: 9, status: 'partial', provenance: { coverage: { kind: 'incomplete' } } });
    dispose();
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

  it('expires a one-minute rolling maximum at the next minute boundary', async () => {
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
      await vi.advanceTimersByTimeAsync(start + 29_999 - Date.now());
      expect(callback.mock.calls.at(-1)[0].value).toBe(90);
      await vi.advanceTimersByTimeAsync(4);
      expect(callback.mock.calls.at(-1)[0].value).toBe(5);
      dispose();
      expect(resolver.service.cacheExpiryTimer).not.toBeNull();
      resolver.service.clear();
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
      expect(service.cacheExpiryTimer).not.toBeNull();
      service.clear();
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
    expect([...service.families.values()][0].history.observations.filter((item) => item.origin === 'recorder')).toHaveLength(3);
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
    const merge = vi.spyOn(service, '_mergeIntoHistory');
    clock += 2000;
    resolver.ingestLiveState(hass, { entityId: 'sensor.soil' }, { state: '9' }, clock - 1000);
    expect(merge).toHaveBeenCalledTimes(1);
    expect(peak.mock.calls.at(-1)[0].value).toBe(9);
    expect(floor.mock.calls.at(-1)[0].value).toBe(5);
    stopPeak(); stopFloor();
  });

});
