import { getNormalizedResolvableNumericValue } from '../config/resolve.js';
import { getFiniteNumber } from '../config/normalize.js';

function getDefaultEntityIcon(stateObj, entityId = '') {
  const deviceClass = String(stateObj?.attributes?.device_class ?? '').trim();
  if (deviceClass) {
    const deviceClassIcons = {
      apparent_power: 'mdi:flash',
      battery: 'mdi:battery',
      carbon_dioxide: 'mdi:molecule-co2',
      current: 'mdi:current-ac',
      energy: 'mdi:lightning-bolt',
      gas: 'mdi:meter-gas',
      humidity: 'mdi:water-percent',
      monetary: 'mdi:cash',
      power: 'mdi:flash',
      pressure: 'mdi:gauge',
      temperature: 'mdi:thermometer',
      voltage: 'mdi:sine-wave',
      water: 'mdi:water',
      weight: 'mdi:weight',
      wind_speed: 'mdi:weather-windy',
    };
    if (deviceClassIcons[deviceClass]) {
      return deviceClassIcons[deviceClass];
    }
  }

  const domain = String(entityId || '').split('.')[0];
  const domainIcons = {
    sensor: 'mdi:eye',
    binary_sensor: 'mdi:radiobox-marked',
    switch: 'mdi:toggle-switch-variant',
    light: 'mdi:lightbulb',
  };
  return domainIcons[domain] ?? null;
}

function toScalePct(value, minValue, maxValue) {
  if (!Number.isFinite(value)) return null;
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  const range = safeMax - safeMin || 1;
  return Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));
}

function formatNumericDisplay(rawVal, decimal = null) {
  if (!Number.isFinite(rawVal)) return String(rawVal);
  if (decimal !== null) {
    return parseFloat(rawVal.toFixed(decimal)).toLocaleString();
  }
  return rawVal.toLocaleString();
}

function isTightUnit(unit) {
  return ['h', 'm', 's'].includes(String(unit || '').trim());
}

function formatDisplayWithUnit(display, unit) {
  if (!unit) return String(display);
  const cleanUnit = String(unit);
  return `${display}${isTightUnit(cleanUnit) ? '' : ' '}${cleanUnit}`;
}

function parseColorToRgb(color) {
  const value = String(color || '').trim();
  if (!value) return null;

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const full = hex.length === 3
      ? hex.split('').map((char) => char + char).join('')
      : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return {
        r: Math.max(0, Math.min(255, parseFloat(parts[0]))),
        g: Math.max(0, Math.min(255, parseFloat(parts[1]))),
        b: Math.max(0, Math.min(255, parseFloat(parts[2]))),
      };
    }
  }

  return null;
}

function getNeedleBorderColor(color) {
  const rgb = parseColorToRgb(color);
  if (!rgb) return '#000000';
  const toLinear = (channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (
    0.2126 * toLinear(rgb.r)
    + 0.7152 * toLinear(rgb.g)
    + 0.0722 * toLinear(rgb.b)
  );
  return luminance < 0.22 ? '#ffffff' : '#000000';
}

function getNeedleState(entityConfig, numericValue, minValue, maxValue, baselinePercent) {
  const needle = entityConfig?.bar?.needle;
  if (!needle?.show || Number.isFinite(baselinePercent) || !Number.isFinite(numericValue)) {
    const color = needle?.color ?? '#ffffff';
    return {
      show: false,
      percent: null,
      pct: null,
      color,
      borderColor: getNeedleBorderColor(color),
      edge: 'middle',
    };
  }

  const color = needle.color ?? '#ffffff';
  const percent = Math.min(100, Math.max(0, toScalePct(numericValue, minValue, maxValue)));
  return {
    show: true,
    percent,
    pct: percent,
    color,
    borderColor: getNeedleBorderColor(color),
    edge: percent <= 0 ? 'left' : (percent >= 100 ? 'right' : 'middle'),
  };
}

function getPeakState(entityId, numericValue, minValue, maxValue, peaks, peakEnabled) {
  if (!peakEnabled || !Number.isFinite(numericValue)) {
    return {
      value: null,
      percent: null,
      display: null,
      visible: false,
    };
  }

  const existingPeak = getFiniteNumber(peaks?.[entityId]);
  const peakValue = Number.isFinite(existingPeak)
    ? Math.max(existingPeak, numericValue)
    : numericValue;

  return {
    value: peakValue,
    percent: toScalePct(peakValue, minValue, maxValue),
    visible: true,
  };
}

export function buildRowViewModel(options) {
  const {
    hass,
    cardConfig,
    entityConfig,
    entityState,
    peaks,
  } = options;

  void cardConfig;

  const entityId = entityConfig?.entity ?? null;
  const rawState = entityState?.state ?? '';
  const numericValue = getFiniteNumber(rawState);
  const rawUnit = entityState?.attributes?.unit_of_measurement ?? '';
  const displayUnit = numericValue !== null
    ? (entityConfig?.formatting?.unit ?? rawUnit ?? '')
    : '';
  const min = getNormalizedResolvableNumericValue(hass, entityConfig?.scale?.min);
  const max = getNormalizedResolvableNumericValue(hass, entityConfig?.scale?.max);
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  const percent = numericValue !== null ? toScalePct(numericValue, safeMin, safeMax) : 0;
  const displayValue = numericValue === null
    ? rawState
    : formatNumericDisplay(numericValue, entityConfig?.formatting?.decimal ?? null);

  const targetValue = entityConfig?.target_marker?.enabled === false
    ? null
    : getNormalizedResolvableNumericValue(hass, entityConfig?.target_marker?.source, safeMin, safeMax);
  const targetPercent = targetValue !== null ? toScalePct(targetValue, safeMin, safeMax) : null;
  const targetVisible = targetValue !== null;
  const targetDisplay = targetValue !== null
    ? formatDisplayWithUnit(
      formatNumericDisplay(targetValue, entityConfig?.formatting?.decimal ?? null),
      entityConfig?.formatting?.unit ?? rawUnit ?? ''
    )
    : null;

  const baselineValue = entityConfig?.baseline?.enabled === false
    ? null
    : getNormalizedResolvableNumericValue(hass, entityConfig?.baseline?.at, safeMin, safeMax);
  const baselinePercent = Number.isFinite(baselineValue) ? toScalePct(baselineValue, safeMin, safeMax) : null;
  const baselineVisible = Number.isFinite(baselineValue);

  const peakState = getPeakState(
    entityId,
    numericValue,
    safeMin,
    safeMax,
    peaks,
    entityConfig?.peak_marker?.show === true
  );
  const peakDisplay = peakState.visible
    ? formatNumericDisplay(peakState.value, entityConfig?.formatting?.decimal ?? null)
    : null;

  return {
    entityId,
    name: entityConfig?.name ?? entityState?.attributes?.friendly_name ?? entityId,
    icon: entityConfig?.icon === false
      ? false
      : (entityConfig?.icon ?? entityState?.attributes?.icon ?? getDefaultEntityIcon(entityState, entityId)),
    state: rawState,
    numericValue,
    rawUnit,
    displayUnit,
    min: safeMin,
    max: safeMax,
    percent,
    displayValue,
    unit: displayUnit,
    barColor: entityConfig?.bar?.color ?? null,
    fillStyle: entityConfig?.bar?.fill_style ?? null,
    target: targetValue,
    targetPercent,
    targetDisplay,
    targetVisible,
    baseline: baselineValue,
    baselinePercent,
    baselineVisible,
    peak: peakState.value,
    peakPercent: peakState.percent,
    peakDisplay,
    peakVisible: peakState.visible,
    segments: entityConfig?.bar?.segments ?? null,
    gradientStops: entityConfig?.bar?.gradient_stops ?? null,
    needle: getNeedleState(entityConfig, numericValue, safeMin, safeMax, baselinePercent),
    classes: {
      labelPosition: entityConfig?.layout?.label?.position ?? 'left',
      animated: entityConfig?.bar?.animated !== false,
    },
    attributes: {
      entity: entityId,
      baseHeight: entityConfig?.layout?.height ?? 38,
      heightExplicit: entityConfig?.layout?.height_explicit === true,
      barAnimated: entityConfig?.bar?.animated !== false,
    },
  };
}
