import { describe, expect, it } from 'vitest';
import { advanceMinuteBuckets, aggregateMinuteBuckets, calculateMinuteBuckets, normalizeObservations } from '../../src/history/calculations.js';
import { calculateObservationValue } from '../support/history-observation-oracle.mjs';

const window = { start: 100, end: 200 };
const observation = (timestamp, value, order = 0) => ({ timestamp, value, order });

describe('historical extrema calculations', () => {
  it('advances five minute rollovers without observations and expires old extrema', () => {
    const samples = Array.from({ length: 86400 }, (_, index) => ({ timestamp: index * 1000,
      value: index === 1 ? 1000 : index === 2 ? -1000 : index % 31,
      state: 's', origin: 'recorder', order: index, orderKnown: true }));
    const end = 86400000;
    let buckets = aggregateMinuteBuckets(samples, { start: 0, end }, { ordered: true });
    for (let minute = 1; minute <= 5; minute += 1) {
      const window = { start: minute * 60000, end: end + minute * 60000 };
      buckets = advanceMinuteBuckets(buckets, [], window);
      const expected = aggregateMinuteBuckets(samples, window, { ordered: true });
      for (const calculation of ['max', 'min']) {
        expect(calculateMinuteBuckets(buckets, calculation, window)).toMatchObject({
          value: calculateMinuteBuckets(expected, calculation, window).value,
          sampleCount: calculateMinuteBuckets(expected, calculation, window).sampleCount,
          orderingAmbiguous: false,
        });
      }
      expect(calculateMinuteBuckets(buckets, 'max', window).value).toBe(30);
      expect(calculateMinuteBuckets(buckets, 'min', window).value).toBe(0);
    }
  });
  it('aggregates 86400 transitions into exact minute extrema and carries states', () => {
    const samples = Array.from({ length: 86400 }, (_, i) => ({ timestamp: i * 1000,
      value: i === 1 ? 1000 : i === 2 ? -1000 : i % 31, order: i, orderKnown: true, origin: 'recorder' }));
    const window = { start: 0, end: 86400000 };
    const buckets = aggregateMinuteBuckets(samples, window);
    expect(buckets).toHaveLength(1440);
    expect(calculateMinuteBuckets(buckets, 'max', window).value).toBe(1000);
    expect(calculateMinuteBuckets(buckets, 'min', window).value).toBe(-1000);
    const carry = aggregateMinuteBuckets([{ timestamp: -1, value: 8 }, { timestamp: 120000, value: null }], { start: 0, end: 180000 });
    expect(carry.map(bucket => bucket.max?.value ?? null)).toEqual([8, 8, null]);
  });

  it('preserves equal-time ambiguity until the next effective transition', () => {
    const window = { start: 0, end: 180000 };
    const samples = [{ timestamp: -10, value: 2 }, { timestamp: 60000, value: 100 },
      { timestamp: 60000, value: 5 }, { timestamp: 130000, value: 7 }];
    const buckets = aggregateMinuteBuckets(samples, window);
    expect(buckets.map(bucket => bucket.ambiguous)).toEqual([false, true, true]);
    expect(calculateMinuteBuckets(buckets, 'max', window)).toMatchObject({ value: null, orderingAmbiguous: true });
  });

  it('distinguishes matching and conflicting late Recorder/live transitions even when bucket extrema match', () => {
    const window = { start: 0, end: 60000 };
    const event = (timestamp, value, origin, order) => ({ timestamp, value, state: String(value),
      origin, order, orderKnown: true, orderDomain: origin });
    const samples = value => [event(0, 0, 'recorder', 0), event(10000, value, 'live', 1),
      event(20000, 10, 'recorder', 2), event(30000, 0, 'recorder', 3)];
    const matching = samples(5), conflicting = samples(6);
    const summary = events => {
      const [bucket] = aggregateMinuteBuckets(events, window);
      return { min: bucket.min.value, max: bucket.max.value, end: bucket.endState.value, count: bucket.numericCount };
    };
    expect(summary(matching)).toEqual(summary(conflicting));
    const late = event(10000, 5, 'recorder', 4);
    expect(calculateMinuteBuckets(aggregateMinuteBuckets([...matching, late], window), 'max', window))
      .toMatchObject({ value: 10, orderingAmbiguous: false });
    expect(calculateMinuteBuckets(aggregateMinuteBuckets([...conflicting, late], window), 'max', window))
      .toMatchObject({ value: null, orderingAmbiguous: true });
  });

  it('matches ordered-state extrema for aligned subwindows', () => {
    let seed = 17;
    const samples = Array.from({ length: 5000 }, (_, index) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return { timestamp: index * 1000, value: index % 127 === 0 ? null : (seed % 1000) - 500,
        state: 's', order: index, orderKnown: true, origin: 'recorder' };
    });
    const buckets = aggregateMinuteBuckets(samples, { start: 0, end: 5040000 });
    for (let start = 0; start < 4800000; start += 300000) for (const calculation of ['max', 'min']) {
      const window = { start, end: 5040000 };
      const expected = calculateObservationValue(samples, calculation, window);
      const actual = calculateMinuteBuckets(buckets, calculation, window);
      expect(actual.value).toBe(expected.value);
      expect(actual.sampleCount).toBe(expected.sampleCount);
      expect(actual.boundaryIncluded).toBe(expected.boundaryIncluded);
    }
    expect(() => calculateMinuteBuckets(buckets, 'max', { start: 1, end: 5040000 })).toThrow('minute-aligned');
  });
  it('calculates max and min from unordered observations', () => {
    const samples = [observation(150, 8), observation(120, 2), observation(180, 5)];
    expect(calculateObservationValue(samples, 'max', window).value).toBe(8);
    expect(calculateObservationValue(samples, 'min', window).value).toBe(2);
  });

  it('includes the effective boundary state and excludes the exclusive end', () => {
    const result = calculateObservationValue([
      observation(99, 10), observation(200, 100),
    ], 'max', window, { acquiredWindow: { start: 0, end: 200 } });
    expect(result.value).toBe(10);
    expect(result.boundaryIncluded).toBe(true);
    expect(result.selectedObservation.boundaryEffective).toBe(true);
  });

  it('lets a nonnumeric boundary state supersede older numeric state', () => {
    const result = calculateObservationValue([
      observation(80, 20, 0), observation(99, null, 1), observation(120, 4, 2),
    ], 'max', window, { acquiredWindow: { start: 0, end: 200 } });
    expect(result.value).toBe(4);
    expect(result.boundaryIncluded).toBe(true);
    expect(result.sampleCount).toBe(1);
  });

  it('handles duplicate timestamps deterministically and empty numeric history', () => {
    const ordered = normalizeObservations([observation(120, 2, 0), observation(120, 9, 1)]);
    expect(ordered.at(-1).value).toBe(9);
    expect(calculateObservationValue([observation(120, null)], 'min', window).status).toBe('unavailable');
    expect(calculateObservationValue([], 'max', window).value).toBeNull();
  });

  it('drops a rolling-window maximum once a later transition becomes the effective boundary', () => {
    const samples = [observation(105, 2), observation(115, 9), observation(130, 4)];
    expect(calculateObservationValue(samples, 'max', { start: 100, end: 140 }).value).toBe(9);
    expect(calculateObservationValue(samples, 'max', { start: 131, end: 150 },
      { acquiredWindow: { start: 0, end: 140 } }).value).toBe(4);
  });

  it('marks history with incomplete requested bounds as partial', () => {
    const result = calculateObservationValue([observation(120, 5)], 'max', window,
      { acquiredWindow: { start: 110, end: 190 } });
    expect(result.value).toBe(5);
    expect(result.status).toBe('partial');
    expect(result.requestedBoundsCovered).toBe(false);
  });

  it('uses the last authoritative equal-timestamp value and rejects ambiguous ordering', () => {
    const ordered = calculateObservationValue([
      { ...observation(120, 99, 0), state: 'old', orderKnown: true },
      { ...observation(120, 4, 1), state: 'new', orderKnown: true },
      observation(130, 7),
    ], 'max', window);
    expect(ordered.value).toBe(7);
    expect(ordered.sampleCount).toBe(2);

    const ambiguous = calculateObservationValue([
      { ...observation(120, 99), state: 'a' },
      { ...observation(120, 4), state: 'b' },
    ], 'max', window);
    expect(ambiguous).toMatchObject({ value: null, status: 'partial', orderingAmbiguous: true });
  });

  it('applies equal-timestamp ordering to the effective boundary state', () => {
    const result = calculateObservationValue([
      { ...observation(90, 99, 0), orderKnown: true },
      { ...observation(90, 3, 1), orderKnown: true },
    ], 'max', window, { acquiredWindow: { start: 0, end: 200 } });
    expect(result.value).toBe(3);
    expect(result.boundaryIncluded).toBe(true);
  });
  it('keeps an unchanged boundary state effective and respects unavailable intervals', () => {
    const samples = [observation(10, 21, 0), observation(130, null, 1), observation(180, 22, 2)];
    expect(calculateObservationValue(samples, 'max', { start: 100, end: 120 }).value).toBe(21);
    expect(calculateObservationValue(samples, 'max', { start: 140, end: 170 }).value).toBeNull();
    expect(calculateObservationValue(samples, 'min', { start: 140, end: 190 }).value).toBe(22);
  });

  it('does not invent an ordering across independent acquisition batches', () => {
    const result = calculateObservationValue([
      { ...observation(120, 100, 0), state: '100', orderKnown: true, orderDomain: 'recorder:1' },
      { ...observation(120, 5, 1), state: '5', orderKnown: true, orderDomain: 'recorder:2' },
    ], 'max', window);
    expect(result).toMatchObject({ value: null, orderingAmbiguous: true });
  });

});
