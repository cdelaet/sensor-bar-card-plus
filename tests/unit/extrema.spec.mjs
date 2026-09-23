import { describe, expect, it } from 'vitest';
import {
  getResetWindowKey,
  isValidReset,
  normalizeReset,
  updateExtremum,
} from '../../src/utils/extrema.js';
import { createCard } from '../support/load-card-class.cjs';

const local = (year, month, day, hour = 0, minute = 0) => new Date(year, month - 1, day, hour, minute).getTime();

describe('extrema reset helpers', () => {
  it('initializes Peak and Floor from the first finite sample', () => {
    const reset = normalizeReset('never');
    expect(updateExtremum(null, 42, reset, 'max', 100)).toEqual({
      value: 42,
      startedAtMs: null,
      windowKey: null,
    });
    expect(updateExtremum(null, 42, reset, 'min', 100).value).toBe(42);
    expect(updateExtremum(null, Number.NaN, reset, 'max', 100)).toBeNull();
  });

  it('tracks maxima and minima without moving in the wrong direction', () => {
    const reset = normalizeReset('never');
    const peak = updateExtremum({ value: 42, startedAtMs: null, windowKey: null }, 35, reset, 'max', 100);
    const floor = updateExtremum({ value: 42, startedAtMs: null, windowKey: null }, 50, reset, 'min', 100);
    expect(peak.value).toBe(42);
    expect(floor.value).toBe(42);
  });

  it('uses relative duration windows from tracker initialization', () => {
    const reset = normalizeReset('26m');
    const start = local(2026, 1, 1, 10, 7);
    const current = updateExtremum(null, 10, reset, 'max', start);
    expect(updateExtremum(current, 20, reset, 'max', start + 25 * 60 * 1000).value).toBe(20);
    expect(updateExtremum(current, 5, reset, 'max', start + 26 * 60 * 1000)).toEqual({
      value: 5,
      startedAtMs: start + 26 * 60 * 1000,
      windowKey: null,
    });
  });

  it('does not treat 15m as a quarterly clock reset', () => {
    const start = local(2026, 1, 1, 10, 7);
    const relative = updateExtremum(null, 10, normalizeReset('15m'), 'max', start);
    const clockAligned = updateExtremum(null, 10, normalizeReset('quarterly'), 'max', start);
    expect(updateExtremum(relative, 5, normalizeReset('15m'), 'max', start + 14 * 60 * 1000).value).toBe(10);
    expect(updateExtremum(relative, 5, normalizeReset('15m'), 'max', start + 15 * 60 * 1000).value).toBe(5);
    expect(getResetWindowKey(normalizeReset('quarterly'), start)).not.toBe(
      getResetWindowKey(normalizeReset('quarterly'), start + 8 * 60 * 1000)
    );
    expect(clockAligned.windowKey).toBe(getResetWindowKey(normalizeReset('quarterly'), start));
  });

  it('supports every calendar reset boundary', () => {
    const timestamp = local(2026, 5, 13, 10, 22);
    for (const unit of ['quarterly', 'hourly', 'daily', 'weekly', 'monthly', 'yearly']) {
      const reset = normalizeReset(unit);
      const state = updateExtremum(null, 10, reset, 'max', timestamp);
      expect(state.windowKey).toBe(getResetWindowKey(reset, timestamp));
    }
    expect(getResetWindowKey(normalizeReset('quarterly'), local(2026, 5, 13, 10, 14))).toBe(
      getResetWindowKey(normalizeReset('quarterly'), local(2026, 5, 13, 10, 0))
    );
    expect(getResetWindowKey(normalizeReset('quarterly'), local(2026, 5, 13, 10, 15))).not.toBe(
      getResetWindowKey(normalizeReset('quarterly'), local(2026, 5, 13, 10, 14))
    );
  });

  it('validates only the supported duration grammar', () => {
    for (const value of ['1m', '15m', '26m', '59m', '1h', '7h', '23h']) {
      expect(isValidReset(value)).toBe(true);
    }
    for (const value of ['0m', '60m', '90m', '0h', '24h', '1.5h', '1h30m', '5d', '30s']) {
      expect(isValidReset(value)).toBe(false);
      expect(normalizeReset(value)).toEqual({ kind: 'never' });
    }
    expect(normalizeReset('1h')).toEqual({ kind: 'duration', hours: 1 });
    expect(normalizeReset('23h')).toEqual({ kind: 'duration', hours: 23 });
  });

  it('rejects non-string reset values without throwing', () => {
    for (const value of [['15m'], {}, 15, null, true]) {
      expect(isValidReset(value)).toBe(false);
      expect(normalizeReset(value)).toEqual({ kind: 'never' });
    }
    expect(normalizeReset(undefined)).toEqual({ kind: 'never' });
  });

  it('normalizes Floor and extended Peak configuration without reparsing at runtime', () => {
    const card = createCard();
    const config = card.normalizeCardConfig({
      peak: { enabled: true, reset: '26m', label: { show: true, decimal: 0 } },
      floor: { enabled: true, reset: 'quarterly', label: { show: true, decimal: 1 } },
      entities: [{ entity: 'sensor.one' }],
    });

    expect(config.entities[0].peak_marker).toMatchObject({
      show: true,
      reset: { kind: 'duration', minutes: 26 },
      show_label: true,
      label_decimal: 0,
    });
    expect(config.entities[0].floor_marker).toMatchObject({
      show: true,
      reset: { kind: 'calendar', unit: 'quarterly' },
      show_label: true,
      label_decimal: 1,
    });
  });
});
