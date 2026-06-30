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

export { getFiniteNumber };
