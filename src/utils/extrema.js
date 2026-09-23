const CALENDAR_RESETS = new Set([
  'quarterly',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
]);

function getLocalBoundaryTimestamp(date, unit) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();

  if (unit === 'quarterly') {
    return new Date(year, month, day, hour, Math.floor(date.getMinutes() / 15) * 15, 0, 0).getTime();
  }
  if (unit === 'hourly') {
    return new Date(year, month, day, hour, 0, 0, 0).getTime();
  }
  if (unit === 'daily') {
    return new Date(year, month, day, 0, 0, 0, 0).getTime();
  }
  if (unit === 'weekly') {
    const daysSinceMonday = (date.getDay() + 6) % 7;
    return new Date(year, month, day - daysSinceMonday, 0, 0, 0, 0).getTime();
  }
  if (unit === 'monthly') {
    return new Date(year, month, 1, 0, 0, 0, 0).getTime();
  }
  if (unit === 'yearly') {
    return new Date(year, 0, 1, 0, 0, 0, 0).getTime();
  }
  return null;
}

export function normalizeReset(value) {
  if (value === undefined) value = 'never';
  if (typeof value !== 'string') return { kind: 'never' };
  const normalized = value.trim().toLowerCase();
  if (normalized === 'never') return { kind: 'never' };
  if (CALENDAR_RESETS.has(normalized)) {
    return { kind: 'calendar', unit: normalized };
  }

  const durationMatch = normalized.match(/^(\d+)(m|h)$/);
  if (!durationMatch) return { kind: 'never' };

  const amount = Number(durationMatch[1]);
  const unit = durationMatch[2];
  if (!Number.isInteger(amount) || amount < 1 || (unit === 'm' && amount > 59) || (unit === 'h' && amount > 23)) {
    return { kind: 'never' };
  }
  return unit === 'm'
    ? { kind: 'duration', minutes: amount }
    : { kind: 'duration', hours: amount };
}

export function isValidReset(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'never' || CALENDAR_RESETS.has(normalized)) return true;
  const match = normalized.match(/^(\d+)(m|h)$/);
  if (!match) return false;
  const amount = Number(match[1]);
  return Number.isInteger(amount)
    && amount >= 1
    && (match[2] === 'm' ? amount <= 59 : amount <= 23);
}

export function getResetWindowKey(reset, timestamp) {
  if (reset?.kind !== 'calendar') return null;
  const boundary = getLocalBoundaryTimestamp(new Date(timestamp), reset.unit);
  return Number.isFinite(boundary) ? String(boundary) : null;
}

function getDurationMs(reset) {
  if (reset?.kind !== 'duration') return null;
  if (Number.isInteger(reset.minutes)) return reset.minutes * 60 * 1000;
  if (Number.isInteger(reset.hours)) return reset.hours * 60 * 60 * 1000;
  return null;
}

function initializeExtremum(sample, reset, timestamp) {
  if (reset?.kind === 'duration') {
    return {
      value: sample,
      startedAtMs: Number.isFinite(timestamp) ? timestamp : null,
      windowKey: null,
    };
  }
  if (reset?.kind === 'calendar') {
    return {
      value: sample,
      startedAtMs: null,
      windowKey: getResetWindowKey(reset, timestamp),
    };
  }
  return {
    value: sample,
    startedAtMs: null,
    windowKey: null,
  };
}

export function updateExtremum(previous, sample, reset, direction, timestamp) {
  if (!Number.isFinite(sample)) return previous ?? null;

  const durationMs = getDurationMs(reset);
  if (!previous) return initializeExtremum(sample, reset, timestamp);

  if (durationMs !== null && Number.isFinite(previous.startedAtMs) && Number.isFinite(timestamp)
    && timestamp - previous.startedAtMs >= durationMs) {
    return initializeExtremum(sample, reset, timestamp);
  }

  if (reset?.kind === 'calendar') {
    const windowKey = getResetWindowKey(reset, timestamp);
    if (windowKey !== null && windowKey !== previous.windowKey) {
      return initializeExtremum(sample, reset, timestamp);
    }
  }

  const shouldReplace = direction === 'min'
    ? sample < previous.value
    : sample > previous.value;
  return shouldReplace ? { ...previous, value: sample } : previous;
}
