import { getWeekStartByLocale } from 'weekstart';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

const CALENDAR_UNITS = new Set(['quarter_hour', 'hour', 'day', 'week', 'month', 'year']);
const SHIFT_UNITS = new Set(['quarter_hour', 'hour', 'day', 'week', 'month', 'year']);

// Configuration strings map to the same window specifications used by the resolver.
export function parseHistoricalWindow(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  const calendars = {
    today: ['day', 0], yesterday: ['day', -1],
    this_week: ['week', 0], 'this week': ['week', 0], last_week: ['week', -1], 'last week': ['week', -1],
    this_month: ['month', 0], 'this month': ['month', 0], last_month: ['month', -1], 'last month': ['month', -1],
    this_year: ['year', 0], last_year: ['year', -1],
    quarterly: ['quarter_hour', 0], hourly: ['hour', 0], daily: ['day', 0],
    weekly: ['week', 0], monthly: ['month', 0], yearly: ['year', 0],
  };
  const calendar = Object.prototype.hasOwnProperty.call(calendars, text) ? calendars[text] : null;
  if (calendar) return calendar[1] === 0
    ? { kind: 'calendar', period: calendar[0] }
    : { kind: 'shifted_calendar', period: calendar[0], shift: { amount: -1, unit: calendar[0] } };
  const match = /^(\d+)(m|h|d|w)$/.exec(text);
  if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) < 1) return null;
  const unit = { m: 'minute', h: 'hour', d: 'day', w: 'week' }[match[2]];
  const duration = { amount: Number(match[1]), unit };
  return Number.isFinite(durationMilliseconds(duration)) ? { kind: 'rolling', duration } : null;
}

function toEpoch(value, name) {
  const epoch = value instanceof Date ? value.getTime()
    : typeof value === 'number' ? value
      : Date.parse(String(value ?? ''));
  if (!Number.isFinite(epoch)) throw new TypeError(`${name} must be a valid timestamp`);
  return epoch;
}

function formatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
  } catch {
    throw new TypeError(`Invalid IANA time zone: ${timeZone}`);
  }
}

function localParts(epoch, timeZone, dateFormatter) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(epoch))
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, Number(part.value)]));
  return {
    year: parts.year, month: parts.month, day: parts.day,
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute, second: parts.second,
  };
}

function localOrdinal(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function sameLocal(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day
    && a.hour === b.hour && a.minute === b.minute && a.second === b.second;
}

function compareLocal(a, b) {
  return localOrdinal(a) - localOrdinal(b);
}

function localToEpoch(parts, timeZone, dateFormatter, { after = null, reference = null } = {}) {
  const target = localOrdinal(parts);
  const offsets = new Set();
  for (let hours = -36; hours <= 36; hours += 6) {
    const probe = target + hours * HOUR_MS;
    const observed = localParts(probe, timeZone, dateFormatter);
    offsets.add(localOrdinal(observed) - probe);
  }

  const candidates = [...offsets]
    .map((offset) => target - offset)
    .filter((candidate) => sameLocal(localParts(candidate, timeZone, dateFormatter), parts))
    .sort((a, b) => a - b);

  if (candidates.length) {
    if (Number.isFinite(after)) return candidates.find((candidate) => candidate > after) ?? candidates.at(-1);
    if (Number.isFinite(reference)) {
      const beforeOrAt = candidates.filter((candidate) => candidate <= reference);
      if (beforeOrAt.length) return beforeOrAt.at(-1);
    }
    return candidates[0];
  }

  // A local time in a spring-forward gap resolves to the first representable
  // local time after the requested wall time, matching compatible semantics.
  const nearby = [...offsets].map((offset) => target - offset)
    .map((candidate) => ({ candidate, local: localParts(candidate, timeZone, dateFormatter) }))
    .filter(({ local }) => compareLocal(local, parts) >= 0)
    .sort((a, b) => compareLocal(a.local, b.local) || a.candidate - b.candidate);
  if (nearby.length) return nearby[0].candidate;
  throw new RangeError('Could not resolve local time in the configured time zone');
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addCalendar(parts, amount, unit) {
  if (unit === 'quarter_hour' || unit === 'hour' || unit === 'day' || unit === 'week') {
    const minutes = unit === 'quarter_hour' ? amount * 15 : 0;
    const hours = unit === 'hour' ? amount : 0;
    const days = unit === 'day' ? amount : unit === 'week' ? amount * 7 : 0;
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day,
      parts.hour + hours + days * 24, parts.minute + minutes, parts.second));
    return {
      year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
      hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds(),
    };
  }
  if (unit === 'month') {
    const monthIndex = parts.year * 12 + (parts.month - 1) + amount;
    const year = Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12 + 1;
    return { ...parts, year, month, day: Math.min(parts.day, daysInMonth(year, month)) };
  }
  if (unit === 'year') {
    const year = parts.year + amount;
    return { ...parts, year, day: Math.min(parts.day, daysInMonth(year, parts.month)) };
  }
  throw new TypeError(`Unsupported calendar unit: ${unit}`);
}

function periodStart(nowParts, unit, weekStartsOn) {
  const start = { ...nowParts };
  if (unit === 'quarter_hour') start.minute = Math.floor(start.minute / 15) * 15;
  if (unit === 'hour') start.minute = 0;
  if (unit === 'quarter_hour' || unit === 'hour') start.second = 0;
  if (unit === 'day') {
    start.hour = 0; start.minute = 0; start.second = 0;
  }
  if (unit === 'week') {
    const weekday = new Date(Date.UTC(start.year, start.month - 1, start.day)).getUTCDay();
    const firstDay = weekStartsOn % 7;
    const daysBack = (weekday - firstDay + 7) % 7;
    Object.assign(start, addCalendar({ ...start, hour: 0, minute: 0, second: 0 }, -daysBack, 'day'));
  }
  if (unit === 'month') {
    start.day = 1; start.hour = 0; start.minute = 0; start.second = 0;
  }
  if (unit === 'year') {
    start.month = 1; start.day = 1; start.hour = 0; start.minute = 0; start.second = 0;
  }
  return start;
}

function nextPeriod(parts, unit) {
  return addCalendar(parts, 1, unit);
}

function periodEndEpoch(startEpoch, startParts, unit, timeZone, dateFormatter) {
  if (unit === 'quarter_hour') return startEpoch + 15 * 60 * 1000;
  if (unit === 'hour') return startEpoch + HOUR_MS;
  return localToEpoch(nextPeriod(startParts, unit), timeZone, dateFormatter, { after: startEpoch });
}

export function resolveWeekStart(locale, firstWeekday = null, explicitWeekStartsOn = null) {
  if (Number.isInteger(explicitWeekStartsOn) && explicitWeekStartsOn >= 0 && explicitWeekStartsOn <= 6) {
    return explicitWeekStartsOn;
  }
  const weekdayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .indexOf(String(firstWeekday ?? '').toLowerCase());
  if (weekdayIndex >= 0) return weekdayIndex;
  if ((firstWeekday === null || firstWeekday === undefined || firstWeekday === 'language')
    && typeof locale === 'string') {
    try {
      const localeObject = typeof Intl.Locale === 'function' ? new Intl.Locale(locale) : null;
      if (!localeObject) return getWeekStartByLocale(locale) % 7;
      const info = typeof localeObject.getWeekInfo === 'function'
        ? localeObject.getWeekInfo()
        : localeObject.weekInfo;
      const firstDay = info?.firstDay;
      if (Number.isInteger(firstDay) && firstDay >= 1 && firstDay <= 7) return firstDay % 7;
    } catch { /* Use the same locale fallback as Home Assistant. */ }
    return getWeekStartByLocale(locale) % 7;
  }
  return 1;
}

function windowIdentity(kind, unit, start, end, timeZone, shift) {
  if (kind === 'rolling') return `rolling:${unit}:${timeZone}`;
  if (kind === 'calendar') return `calendar:${unit}:${start}:${timeZone}`;
  if (kind === 'shifted_calendar') return `shifted:${unit}:${shift.amount}:${shift.unit}:${start}:${end}:${timeZone}`;
  return `absolute:${start}:${end}`;
}

export function resolveTimeWindow(spec, options = {}) {
  if (!spec || typeof spec !== 'object') throw new TypeError('A time-window specification is required');
  const now = toEpoch(options.now ?? Date.now(), 'now');
  const timeZone = options.timeZone;
  if (typeof timeZone !== 'string' || !timeZone.trim()) throw new TypeError('timeZone must be an IANA time-zone name');
  const dateFormatter = formatter(timeZone);
  const locale = options.locale ?? 'en-US';
  const weekStartsOn = resolveWeekStart(locale, options.firstWeekday, options.weekStartsOn);
  const kind = spec.kind;
  let start;
  let end;
  let metadata;

  if (kind === 'absolute') {
    start = toEpoch(spec.start, 'start');
    end = toEpoch(spec.end, 'end');
    if (end <= start) throw new RangeError('Absolute window end must be after start');
    metadata = { kind, partial: end > now };
  } else if (kind === 'rolling') {
    const durationMs = Number.isFinite(spec.durationMs) ? spec.durationMs : durationMilliseconds(spec.duration);
    if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError('Rolling duration must be positive');
    start = now - durationMs;
    end = now;
    metadata = { kind, durationMs, partial: false };
  } else if (kind === 'calendar' || kind === 'shifted_calendar') {
    const unit = spec.period ?? spec.unit;
    if (!CALENDAR_UNITS.has(unit)) throw new TypeError(`Unsupported calendar period: ${unit}`);
    const nowParts = localParts(now, timeZone, dateFormatter);
    const baseStart = periodStart(nowParts, unit, weekStartsOn);
    const shift = kind === 'shifted_calendar' ? spec.shift : { amount: 0, unit };
    if (!shift || !Number.isInteger(shift.amount) || !SHIFT_UNITS.has(shift.unit)) {
      throw new TypeError('shift must contain an integer amount and supported calendar unit');
    }
    const shiftedStart = addCalendar(baseStart, shift.amount, shift.unit);
    start = localToEpoch(shiftedStart, timeZone, dateFormatter, {
      ...(kind === 'calendar' && shift.amount === 0 ? { reference: now } : {}),
    });
    if (kind === 'calendar' && shift.amount === 0) {
      end = now;
    } else if (unit === 'quarter_hour' || unit === 'hour') {
      end = start + (unit === 'hour' ? HOUR_MS : 15 * 60 * 1000);
    } else {
      // Shift one anchor, then construct the complete target calendar period
      // from it. Shifting both endpoints independently can clamp them to the
      // same date (for example March 30 shifted back one month).
      const shiftedEnd = nextPeriod(shiftedStart, unit);
      end = localToEpoch(shiftedEnd, timeZone, dateFormatter, { after: start });
    }
    metadata = {
      kind, period: unit, shift: kind === 'shifted_calendar' ? { ...shift } : null,
      weekStartsOn: unit === 'week' ? weekStartsOn : null,
      partial: kind === 'calendar' && shift.amount === 0,
    };
  } else {
    throw new TypeError(`Unsupported time-window kind: ${kind}`);
  }

  if (kind === 'calendar' && end === start && start === now) end += 1;

  if (!(end > start)) throw new RangeError('Resolved time window must have a positive duration');

  const calendarUnit = spec.period ?? spec.unit;
  const rolloverAt = kind === 'calendar' || kind === 'shifted_calendar'
    ? (() => {
      const startParts = periodStart(localParts(now, timeZone, dateFormatter), calendarUnit, weekStartsOn);
      const startEpoch = localToEpoch(startParts, timeZone, dateFormatter, { reference: now });
      return periodEndEpoch(startEpoch, startParts, calendarUnit, timeZone, dateFormatter);
    })()
    : null;
  return {
    start, end, timeZone,
    interval: '[start,end)',
    cacheKey: windowIdentity(kind, metadata.period ?? spec.period ?? spec.unit ?? metadata.durationMs, start, end, timeZone, metadata.shift),
    semantics: { ...metadata,
      future: !(kind === 'calendar' && start === now && end === now + 1) && (start > now || end > now),
      rolloverAt },
  };
}

function durationMilliseconds(duration) {
  if (!duration || typeof duration !== 'object' || !Number.isFinite(duration.amount) || duration.amount <= 0) return null;
  const units = { millisecond: 1, second: 1000, minute: 60000, hour: HOUR_MS, day: DAY_MS, week: WEEK_MS };
  return units[duration.unit] ? duration.amount * units[duration.unit] : null;
}

export { durationMilliseconds };
