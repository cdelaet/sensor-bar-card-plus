import { describe, expect, it } from 'vitest';
import { historyReason, historyStatusSummary } from '../../src/history/history-status.js';

describe('historical status presentation', () => {
  it.each([
    ['Statistics metadata is unavailable', 'Long-term statistics are unavailable for this entity'],
    ['Statistics do not provide min/max', 'Required minimum and maximum statistics are unavailable'],
    ['Long-term statistics are not available for entity attributes', 'Entity attributes do not support historical statistics'],
    ['Statistics and entity units are incompatible', 'Statistics and Recorder units are incompatible'],
    ['Statistics contain missing or malformed hourly buckets', 'Required history intervals are missing'],
  ])('maps %s safely', (reason, expected) => {
    expect(historyReason({ status: 'unavailable', provenance: { coverage: { reason } } })).toBe(expected);
  });

  it('does not expose transport errors and distinguishes loading, stale and alignment failures', () => {
    expect(historyReason({ status: 'unavailable', provenance: { error: new Error('secret token') } })).toBe('History is temporarily unavailable');
    expect(historyReason({ status: 'unavailable', provenance: { error: new Error('Historical statistics require whole UTC-hour boundaries') } })).toBe('Historical window boundaries are unsupported');
    expect(historyReason({ status: 'pending' })).toBe('Historical data is still loading');
    expect(historyReason({ status: 'stale' })).toBe('Cached history is stale; refresh failed');
    expect(historyReason({ status: 'available', provenance: { coverage: { kind: 'unknown' } } })).toBeNull();
  });

  it('combines identical reasons and separates different reasons without marker positions', () => {
    const peak = { enabled: true, status: 'unavailable', visible: false, reason: 'Missing' };
    const floor = { ...peak };
    expect(historyStatusSummary(peak, floor).text).toBe('Peak and Floor: Missing');
    expect(historyStatusSummary(peak, { ...floor, reason: 'Units' }).text).toBe('Peak: Missing; Floor: Units');
    expect(historyStatusSummary({ ...peak, status: 'pending' }, { enabled: false }).pending).toBe(true);
    expect(historyStatusSummary({ ...peak, status: 'partial', visible: true }, null)).toBeNull();
    expect(historyStatusSummary({ ...peak, status: 'stale', visible: false }, null).text).toBe('Peak: Missing');
  });
});
