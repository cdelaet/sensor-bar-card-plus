import { describe, expect, it } from 'vitest';
import { historyDiagnostics, historyReason } from '../../src/history/history-status.js';

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

  it('produces marker-specific diagnostics with severity, configured windows, and consequences', () => {
    const diagnostics = historyDiagnostics('sensor.temperature',
      { enabled: true, status: 'pending', visible: false, reason: 'Historical data is still loading', window: 'today' },
      { enabled: true, status: 'stale', visible: true, reason: 'Cached history is stale; refresh failed', window: '24h' });
    expect(diagnostics).toEqual([
      expect.objectContaining({ code: 'history.marker.pending', severity: 'info', entity: 'sensor.temperature',
        area: 'Peak marker · Configured window: today', message: expect.stringContaining('Peak marker will be unavailable') }),
      expect.objectContaining({ code: 'history.marker.stale', severity: 'warning', entity: 'sensor.temperature',
        area: 'Floor marker · Configured window: 24h', message: expect.stringContaining('Floor marker uses a cached value') }),
    ]);
  });

  it('uses error severity for invalid or unavailable history and clears recovered results', () => {
    expect(historyDiagnostics('sensor.temperature',
      { enabled: true, status: 'invalid', visible: false, reason: 'Historical window is invalid or unsupported', window: '24h' },
      { enabled: true, status: 'unavailable', visible: false, reason: 'History is temporarily unavailable', window: 'today' })
    ).toEqual([
      expect.objectContaining({ severity: 'error', area: 'Peak marker · Configured window: 24h',
        message: expect.stringContaining('Peak marker is unavailable') }),
      expect.objectContaining({ severity: 'error', area: 'Floor marker · Configured window: today',
        message: expect.stringContaining('Floor marker is unavailable') }),
    ]);
    expect(historyDiagnostics('sensor.temperature',
      { enabled: true, status: 'available', visible: true, window: 'today' },
      { enabled: false, status: 'pending', visible: false, window: 'today' })).toEqual([]);
  });
});
