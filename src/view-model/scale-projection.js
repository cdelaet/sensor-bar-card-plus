export function projectScalePercent(scalePercent, direction = 'normal') {
  if (!Number.isFinite(scalePercent)) return null;
  const clamped = Math.min(100, Math.max(0, scalePercent));
  return direction === 'reverse' ? 100 - clamped : clamped;
}

export function projectScaleInterval(startScalePercent, endScalePercent, direction = 'normal') {
  const startPosition = projectScalePercent(startScalePercent, direction);
  const endPosition = projectScalePercent(endScalePercent, direction);
  if (!Number.isFinite(startPosition) || !Number.isFinite(endPosition)) return null;
  return {
    start: Math.min(startPosition, endPosition),
    end: Math.max(startPosition, endPosition),
  };
}

export function toScalePct(value, minValue, maxValue) {
  if (!Number.isFinite(value)) return null;
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  const range = safeMax - safeMin || 1;
  return Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));
}
