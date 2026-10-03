import { getFiniteNumber } from './normalize.js';

export function getEntityNumericValue(hass, entityId) {
  if (!entityId || !hass?.states?.[entityId]) return null;
  const raw = hass.states[entityId].state;
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : null;
}

export function getNumericValue(hass, value, entityId = null) {
  const entityValue = getEntityNumericValue(hass, entityId);
  if (entityValue !== null) return entityValue;

  if (value === null || value === undefined || value === '') return null;

  const num = parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

export function resolvePercentValue(percent, minValue, maxValue) {
  if (!Number.isFinite(percent)) return null;
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  return safeMin + ((percent / 100) * (safeMax - safeMin));
}

export function getNormalizedResolvableNumericValue(hass, resolvable, minValue = null, maxValue = null) {
  if (!resolvable) return null;
  const entityValue = getEntityNumericValue(hass, resolvable.entity);
  if (entityValue !== null) return entityValue;

  const fixedValue = getNumericValue(hass, resolvable.fixed ?? resolvable.value, null);
  if (fixedValue !== null) return fixedValue;

  if (Number.isFinite(resolvable.percent)) {
    return resolvePercentValue(resolvable.percent, minValue, maxValue);
  }

  return null;
}

export function getResolvedScale(hass, scale, previousScale = null) {
  const isValid = (bounds) => Number.isFinite(bounds?.min)
    && Number.isFinite(bounds?.max) && bounds.min < bounds.max;
  const fixed = {
    min: getNumericValue(null, scale?.min?.fixed ?? scale?.min?.value),
    max: getNumericValue(null, scale?.max?.fixed ?? scale?.max?.value),
  };

  if (scale?.min?.entity && scale?.max?.entity) {
    const dynamic = {
      min: getEntityNumericValue(hass, scale.min.entity),
      max: getEntityNumericValue(hass, scale.max.entity),
    };
    if (isValid(dynamic)) return dynamic;
    // History protects numeric transient inversions, never missing sources.
    if (Number.isFinite(dynamic.min) && Number.isFinite(dynamic.max) && isValid(previousScale)) {
      return previousScale;
    }
    return scale.min.fixed_explicit !== false && scale.max.fixed_explicit !== false && isValid(fixed)
      ? fixed : { min: 0, max: 100 };
  }

  const resolved = {
    min: getNormalizedResolvableNumericValue(hass, scale?.min) ?? 0,
    max: getNormalizedResolvableNumericValue(hass, scale?.max) ?? 100,
  };
  if (isValid(resolved)) return resolved;

  // Mixed/fixed bounds use their fixed/default pair when resolution is invalid.
  const fallback = {
    min: fixed.min ?? 0,
    max: fixed.max ?? 100,
  };
  return isValid(fallback) ? fallback : { min: 0, max: 100 };
}

export { getFiniteNumber };
