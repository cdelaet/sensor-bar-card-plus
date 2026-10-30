import { describe, expect, it } from 'vitest';
import { calculateObservationValue, normalizeObservations } from '../../src/history/calculations.js';

const window = { start: 100, end: 200 };
const observation = (timestamp, value, order = 0) => ({ timestamp, value, order });

describe('historical extrema calculations', () => {
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
});
