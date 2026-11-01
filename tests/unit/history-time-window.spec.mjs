import { describe, expect, it } from 'vitest';
import { canonicalizeHistoricalWindow, isEligibleHistoricalWindow, parseHistoricalWindow, planHistoricalAcquisition, resolveTimeWindow } from '../../src/history/time-window.js';

const brussels = { timeZone: 'Europe/Brussels', locale: 'en-GB' };

describe('historical time windows', () => {
  it('parses legacy calendar aliases while exposing canonical values', () => {
    for (const [alias, canonical] of [
      ['last_week', 'previous_week'], ['last_month', 'previous_month'], ['last_year', 'previous_year'], ['yearly', 'this_year'],
    ]) {
      expect(canonicalizeHistoricalWindow(alias)).toBe(canonical);
      expect(parseHistoricalWindow(alias)).toEqual(parseHistoricalWindow(canonical));
    }
    for (const value of ['5m', '1500m', '24h', '7d', 'custom-window']) {
      expect(canonicalizeHistoricalWindow(value)).toBe(value);
    }
  });

  it('accepts whole-minute recent windows and whole-hour longer windows', () => {
    for (const value of ['1m', '1440m', '24h', '1500m', '48h']) expect(isEligibleHistoricalWindow(value)).toBe(true);
    for (const value of ['1441m', '0m', '1s', 'bad']) expect(isEligibleHistoricalWindow(value)).toBe(false);
  });
  it('requires rolling durations to contain whole minutes without rounding observations', () => {
    const now = Date.parse('2026-10-31T12:34:56.789Z');
    expect(() => resolveTimeWindow({ kind: 'rolling', durationMs: 90001 }, { ...brussels, now })).toThrow('whole number of minutes');
    expect(resolveTimeWindow({ kind: 'rolling', durationMs: 60000 }, { ...brussels, now }))
      .toMatchObject({ start: Date.parse('2026-10-31T12:33:00Z'), end: now });
  });
  it('uses completed minutes plus the unfinished minute, including for 24 hours', () => {
    const now = Date.parse('2026-10-31T12:15:30Z');
    const quarter = resolveTimeWindow({ kind: 'rolling', duration: { amount: 15, unit: 'minute' } }, { ...brussels, now });
    expect(quarter).toMatchObject({ start: Date.parse('2026-10-31T12:00:00Z'), end: now });
    const day = resolveTimeWindow({ kind: 'rolling', duration: { amount: 24, unit: 'hour' } }, { ...brussels, now });
    expect(day.start).toBe(Date.parse('2026-10-30T12:15:00Z'));
    expect(planHistoricalAcquisition(day, now).mode).toBe('raw');
  });
  it('plans raw within the last 24 hours and complete-hour statistics beyond it', () => {
    const now = Date.parse('2026-10-31T12:34:00Z');
    const rolling = hours => resolveTimeWindow({ kind: 'rolling', duration: { amount: hours, unit: 'hour' } }, { ...brussels, now });
    const quarterHour = resolveTimeWindow({ kind: 'rolling', duration: { amount: 15, unit: 'minute' } }, { ...brussels, now });
    expect(planHistoricalAcquisition(quarterHour, now)).toMatchObject({ mode: 'raw', raw: { start: now - 900000, end: now } });
    expect(planHistoricalAcquisition(rolling(24), now).mode).toBe('raw');
    const justOutside = resolveTimeWindow({ kind: 'absolute', start: now - 24 * 3600000 - 1,
      end: now - 24 * 3600000 + 899999 }, { ...brussels, now });
    expect(planHistoricalAcquisition(justOutside, now).mode).toBe('invalid');
    const plan = planHistoricalAcquisition(rolling(48), now);
    expect(plan).toMatchObject({ mode: 'statistics', statistics: { start: Date.parse('2026-10-29T12:00:00Z'), end: Date.parse('2026-10-31T12:00:00Z') },
      raw: { start: Date.parse('2026-10-31T12:00:00Z'), end: now } });
    expect(plan.window.start).toBe(plan.statistics.start);
    expect(plan.window.cacheKey).toContain(':statistics');
    const subhour = resolveTimeWindow({ kind: 'absolute', start: now - 25 * 3600000, end: now - 25 * 3600000 + 900000 }, { ...brussels, now });
    expect(planHistoricalAcquisition(subhour, now)).toMatchObject({ mode: 'invalid', reason: expect.stringContaining('whole UTC-hour') });
  });

  it('preserves DST calendar boundaries and rejects unaligned local calendar periods', () => {
    const now = Date.parse('2026-10-26T12:00:00Z');
    const yesterday = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day', shift: { amount: -1, unit: 'day' } }, { ...brussels, now });
    const plan = planHistoricalAcquisition(yesterday, now);
    expect(plan.mode).toBe('statistics');
    expect(plan.statistics.end - plan.statistics.start).toBe(25 * 3600000);
    const month = resolveTimeWindow({ kind: 'shifted_calendar', period: 'month', shift: { amount: -1, unit: 'month' } },
      { timeZone: 'Asia/Kathmandu', now });
    expect(planHistoricalAcquisition(month, now)).toMatchObject({ mode: 'invalid', reason: expect.stringContaining('UTC-hour') });
  });
  it('plans long calendar periods and the previous month using whole hourly buckets', () => {
    const now = Date.parse('2026-10-31T12:34:00Z');
    for (const period of ['week', 'month', 'year']) {
      const window = resolveTimeWindow({ kind: 'calendar', period }, { ...brussels, now });
      const plan = planHistoricalAcquisition(window, now);
      expect(plan.mode).toBe('statistics');
      expect(plan.statistics.start).toBe(window.start);
      expect(plan.statistics.end).toBe(Date.parse('2026-10-31T12:00:00Z'));
      expect(plan.raw.end).toBe(now);
    }
    const lastMonth = resolveTimeWindow({ kind: 'shifted_calendar', period: 'month', shift: { amount: -1, unit: 'month' } }, { ...brussels, now });
    const plan = planHistoricalAcquisition(lastMonth, now);
    expect(plan).toMatchObject({ mode: 'statistics', raw: null, statistics: { start: lastMonth.start, end: lastMonth.end } });
  });
  it('resolves calendar days and locale-aware week boundaries', () => {
    const now = Date.parse('2026-05-13T10:22:00Z');
    const day = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { ...brussels, now });
    expect(day.start).toBe(Date.parse('2026-05-12T22:00:00Z'));
    expect(day.end).toBe(now);
    const usWeek = resolveTimeWindow({ kind: 'calendar', period: 'week' }, { ...brussels, locale: 'en-US', now });
    const gbWeek = resolveTimeWindow({ kind: 'calendar', period: 'week' }, { ...brussels, now });
    expect(new Date(usWeek.start).toISOString()).toBe('2026-05-09T22:00:00.000Z');
    expect(new Date(gbWeek.start).toISOString()).toBe('2026-05-10T22:00:00.000Z');
  });

  it('uses the Home Assistant first-weekday preference before locale and has a deterministic fallback', () => {
    const now = Date.parse('2026-05-13T10:22:00Z');
    const sunday = resolveTimeWindow({ kind: 'calendar', period: 'week' },
      { ...brussels, locale: 'en-GB', firstWeekday: 'sunday', now });
    const monday = resolveTimeWindow({ kind: 'calendar', period: 'week' },
      { ...brussels, locale: 'en-US', firstWeekday: 'monday', now });
    expect(sunday.start).toBe(Date.parse('2026-05-09T22:00:00Z'));
    expect(monday.start).toBe(Date.parse('2026-05-10T22:00:00Z'));

    const originalLocale = Intl.Locale;
    try {
      Object.defineProperty(Intl, 'Locale', { configurable: true, value: class LocaleWithoutWeekInfo {} });
      const fallback = resolveTimeWindow({ kind: 'calendar', period: 'week' },
        { ...brussels, locale: 'en-US', firstWeekday: 'language', now });
      expect(fallback.semantics.weekStartsOn).toBe(0);
      expect(fallback.start).toBe(Date.parse('2026-05-09T22:00:00Z'));
      const gb = resolveTimeWindow({ kind: 'calendar', period: 'week' },
        { ...brussels, firstWeekday: 'language', now });
      expect(gb.semantics.weekStartsOn).toBe(1);
    } finally {
      Object.defineProperty(Intl, 'Locale', { configurable: true, value: originalLocale });
    }
  });

  it('uses local calendar-day boundaries across 23 and 25 hour DST days', () => {
    const springNow = Date.parse('2026-03-29T12:00:00Z');
    const fallNow = Date.parse('2026-10-25T12:00:00Z');
    const spring = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { ...brussels, now: springNow });
    const fall = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { ...brussels, now: fallNow });
    expect(spring.start).toBe(Date.parse('2026-03-28T23:00:00Z'));
    expect(spring.semantics.rolloverAt - spring.start).toBe(23 * 60 * 60 * 1000);
    expect(fall.start).toBe(Date.parse('2026-10-24T22:00:00Z'));
    expect(fall.semantics.rolloverAt - fall.start).toBe(25 * 60 * 60 * 1000);
  });

  it('resolves repeated hours using the occurrence containing now', () => {
    const now = Date.parse('2026-10-25T01:30:00Z');
    const window = resolveTimeWindow({ kind: 'calendar', period: 'hour' }, { ...brussels, now });
    expect(window.start).toBe(Date.parse('2026-10-25T01:00:00Z'));
    expect(window.semantics.rolloverAt).toBe(Date.parse('2026-10-25T02:00:00Z'));
  });

  it('supports rolling, shifted, absolute, future, and clamped calendar windows', () => {
    const now = Date.parse('2026-03-01T12:00:00Z');
    const rolling = resolveTimeWindow({ kind: 'rolling', duration: { amount: 7, unit: 'day' } }, { ...brussels, now });
    expect(rolling.start).toBe(now - 7 * 24 * 60 * 60 * 1000);
    const yesterday = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day', shift: { amount: -1, unit: 'day' } }, { ...brussels, now });
    expect(yesterday.start).toBe(Date.parse('2026-02-27T23:00:00Z'));
    expect(yesterday.end).toBe(Date.parse('2026-02-28T23:00:00Z'));
    const leapDay = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day', shift: { amount: -1, unit: 'year' } },
      { ...brussels, now: Date.parse('2025-03-01T12:00:00Z') });
    expect(leapDay.start).toBe(Date.parse('2024-02-29T23:00:00Z'));
    const absolute = resolveTimeWindow({ kind: 'absolute', start: now, end: now + 1000 }, { ...brussels, now });
    expect(absolute.semantics.future).toBe(true);
  });

  it('clamps shifted calendar days once and keeps their full target calendar day', () => {
    const cases = [
      ['2025-03-30T12:00:00Z', '2025-02-27T23:00:00Z', '2025-02-28T23:00:00Z'],
      ['2024-03-30T12:00:00Z', '2024-02-28T23:00:00Z', '2024-02-29T23:00:00Z'],
      ['2026-05-31T12:00:00Z', '2026-04-29T22:00:00Z', '2026-04-30T22:00:00Z'],
    ];
    for (const [nowIso, startIso, endIso] of cases) {
      const window = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day',
        shift: { amount: -1, unit: 'month' } }, { ...brussels, now: Date.parse(nowIso) });
      expect(window.start).toBe(Date.parse(startIso));
      expect(window.end).toBe(Date.parse(endIso));
      expect(window.end).toBeGreaterThan(window.start);
    }

    const shiftedYear = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day',
      shift: { amount: -1, unit: 'year' } }, { ...brussels, now: Date.parse('2024-02-29T12:00:00Z') });
    expect(shiftedYear.start).toBe(Date.parse('2023-02-27T23:00:00Z'));
    expect(shiftedYear.end).toBe(Date.parse('2023-02-28T23:00:00Z'));

    const shiftedDstDay = resolveTimeWindow({ kind: 'shifted_calendar', period: 'day',
      shift: { amount: -1, unit: 'day' } }, { ...brussels, now: Date.parse('2026-03-30T12:00:00Z') });
    expect(shiftedDstDay.start).toBe(Date.parse('2026-03-28T23:00:00Z'));
    expect(shiftedDstDay.end).toBe(Date.parse('2026-03-29T22:00:00Z'));
    expect(shiftedDstDay.end - shiftedDstDay.start).toBe(23 * 60 * 60 * 1000);
  });

  it('is independent of the browser process timezone and rejects invalid intervals', () => {
    const now = Date.parse('2026-05-13T10:22:00Z');
    const a = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { ...brussels, now });
    const b = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { ...brussels, now });
    expect(a.start).toBe(b.start);
    expect(a.interval).toBe('[start,end)');
    expect(() => resolveTimeWindow({ kind: 'absolute', start: 10, end: 10 }, { ...brussels, now })).toThrow();
    expect(() => resolveTimeWindow({ kind: 'calendar', period: 'day' }, { now, timeZone: 'not/a-zone' })).toThrow();
  });

  it('keeps the instant at a calendar boundary representable as a positive interval', () => {
    const now = Date.parse('2026-05-13T00:00:00Z');
    const window = resolveTimeWindow({ kind: 'calendar', period: 'day' }, { now, timeZone: 'UTC' });
    expect(window.start).toBe(now);
    expect(window.end).toBe(now + 1);
    expect(window.semantics.future).toBe(false);
  });
});
