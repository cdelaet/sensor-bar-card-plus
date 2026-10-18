import { getNormalizedResolvableNumericValue, getResolvedScale, resolveEntitySource, resolveEntityState } from '../config/resolve.js';
import { getFiniteNumber } from '../config/normalize.js';
import { projectScalePercent } from './scale-projection.js';
import {
  createNumericPresentation,
  createMarkerLabelPresentation,
  createTextPresentation,
} from '../utils/format.js';
import {
  buildMarkerModels,
  getMarkerLabelLaneOccupancy,
  getMarkerLaneOccupancy,
} from './marker-view-model.js';

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

function getNeedleState(entityConfig, numericValue, minValue, maxValue, baselinePercent, scaleDirection) {
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
  const scalePercent = toScalePct(numericValue, minValue, maxValue);
  const positionPercent = projectScalePercent(scalePercent, scaleDirection);
  return {
    show: true,
    percent: scalePercent,
    pct: positionPercent,
    positionPercent,
    color,
    borderColor: getNeedleBorderColor(color),
    edge: positionPercent <= 0 ? 'left' : (positionPercent >= 100 ? 'right' : 'middle'),
  };
}

function getExtremumState(numericValue, minValue, maxValue, tracker, direction, enabled) {
  if (!enabled) {
    return {
      value: null,
      percent: null,
      display: null,
      visible: false,
    };
  }

  const existingValue = getFiniteNumber(tracker?.value);
  if (!Number.isFinite(existingValue) && !Number.isFinite(numericValue)) {
    return {
      value: null,
      percent: null,
      visible: false,
    };
  }
  const value = Number.isFinite(existingValue)
    ? (Number.isFinite(numericValue)
      ? (direction === 'min' ? Math.min(existingValue, numericValue) : Math.max(existingValue, numericValue))
      : existingValue)
    : numericValue;

  return {
    value,
    percent: toScalePct(value, minValue, maxValue),
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
    extrema,
    previousScale,
  } = options;

  void cardConfig;

  const entityId = entityConfig?.entity ?? null;
  const primarySource = resolveEntityState(entityState, entityConfig?.attribute);
  const unavailableText = primarySource.found && !primarySource.available
    ? primarySource.stateObj?.state
    : null;
  const selectedValue = unavailableText ?? (primarySource.available && primarySource.attributeFound
    ? primarySource.value
    : '');
  const rawState = typeof selectedValue === 'string' || typeof selectedValue === 'number' || typeof selectedValue === 'boolean'
    ? selectedValue
    : '';
  const numericValue = primarySource.available && primarySource.attributeFound
    ? getFiniteNumber(primarySource.value)
    : null;
  const rawUnit = entityState?.attributes?.unit_of_measurement ?? '';
  const configuredUnit = entityConfig?.formatting?.unit;
  const targetUnit = configuredUnit ?? rawUnit ?? '';
  const displayUnit = numericValue !== null
    ? targetUnit
    : '';
  const { min: safeMin, max: safeMax } = getResolvedScale(hass, entityConfig?.scale, previousScale);
  const scaleDirection = entityConfig?.scale?.direction ?? 'normal';
  const percent = numericValue !== null ? toScalePct(numericValue, safeMin, safeMax) : 0;
  const positionPercent = numericValue !== null ? projectScalePercent(percent, scaleDirection) : null;
  const decimal = entityConfig?.formatting?.decimal ?? null;
  const primaryPresentation = numericValue === null
    ? createTextPresentation(rawState)
    : createNumericPresentation(numericValue, displayUnit, decimal);

  const targetValue = entityConfig?.target_marker?.enabled === false
    ? null
    : getNormalizedResolvableNumericValue(hass, entityConfig?.target_marker?.source, safeMin, safeMax);
  const targetPercent = targetValue !== null ? toScalePct(targetValue, safeMin, safeMax) : null;
  const targetPositionPercent = projectScalePercent(targetPercent, scaleDirection);
  const targetVisible = targetValue !== null;
  const targetDecimal = entityConfig?.target_marker?.label_decimal ?? decimal;
  const targetPresentation = targetValue !== null
    ? createNumericPresentation(targetValue, targetUnit, targetDecimal)
    : null;
  const targetLabelPresentation = targetValue !== null
    ? createMarkerLabelPresentation(targetValue, targetUnit, entityConfig?.target_marker?.label_precision ?? targetDecimal, {
      text: entityConfig?.target_marker?.label_text,
      showValue: entityConfig?.target_marker?.label_show_value,
      showUnit: entityConfig?.target_marker?.label_show_unit,
    })
    : null;

  const baselineValue = entityConfig?.baseline?.enabled === false
    ? null
    : getNormalizedResolvableNumericValue(hass, entityConfig?.baseline?.at, safeMin, safeMax);
  const baselinePercent = Number.isFinite(baselineValue) ? toScalePct(baselineValue, safeMin, safeMax) : null;
  const baselinePositionPercent = projectScalePercent(baselinePercent, scaleDirection);
  const baselineVisible = Number.isFinite(baselineValue);

  const legacyPeak = Number.isFinite(getFiniteNumber(peaks?.[entityId]))
    ? { value: getFiniteNumber(peaks?.[entityId]) }
    : null;
  const peakState = getExtremumState(
    numericValue,
    safeMin,
    safeMax,
    extrema?.peak ?? legacyPeak,
    'max',
    entityConfig?.peak_marker?.show === true,
  );
  const floorState = getExtremumState(
    numericValue,
    safeMin,
    safeMax,
    extrema?.floor,
    'min',
    entityConfig?.floor_marker?.show === true,
  );
  const peakDecimal = entityConfig?.peak_marker?.label_decimal ?? decimal;
  const floorDecimal = entityConfig?.floor_marker?.label_decimal ?? decimal;
  const peakLabelPrecision = entityConfig?.peak_marker?.label_precision ?? peakDecimal;
  const floorLabelPrecision = entityConfig?.floor_marker?.label_precision ?? floorDecimal;
  const peakPresentation = peakState.visible
    ? createNumericPresentation(peakState.value, targetUnit, peakDecimal)
    : null;
  const floorPresentation = floorState.visible
    ? createNumericPresentation(floorState.value, targetUnit, floorDecimal)
    : null;
  const peakLabelPresentation = peakState.visible
    ? createMarkerLabelPresentation(peakState.value, targetUnit, peakLabelPrecision, {
      text: entityConfig?.peak_marker?.label_text,
      showValue: entityConfig?.peak_marker?.label_show_value,
      showUnit: entityConfig?.peak_marker?.label_show_unit,
    })
    : null;
  const floorLabelPresentation = floorState.visible
    ? createMarkerLabelPresentation(floorState.value, targetUnit, floorLabelPrecision, {
      text: entityConfig?.floor_marker?.label_text,
      showValue: entityConfig?.floor_marker?.label_show_value,
      showUnit: entityConfig?.floor_marker?.label_show_unit,
    })
    : null;
  const genericMarkers = (entityConfig?.generic_markers ?? [])
    .filter((marker) => marker.accepted)
    .map((marker) => {
      const value = getNormalizedResolvableNumericValue(hass, marker.source, safeMin, safeMax);
      const visible = Number.isFinite(value);
      const markerPrecision = marker.label.precision ?? decimal;
      const labelSource = marker.label.entity
        ? resolveEntitySource(hass, marker.label.entity, marker.label.attribute)
        : null;
      const rawLabelValue = labelSource?.value;
      const cleanLabelValue = typeof rawLabelValue === 'string' ? rawLabelValue.trim() : rawLabelValue;
      const usableLabelValue = labelSource?.found && labelSource.available && labelSource.attributeFound
        && cleanLabelValue !== null && cleanLabelValue !== undefined && cleanLabelValue !== ''
        && !(['unknown', 'unavailable'].includes(String(cleanLabelValue).trim().toLowerCase()));
      const labelValue = marker.label.entity
        ? usableLabelValue ? getFiniteNumber(cleanLabelValue) ?? String(cleanLabelValue) : null
        : value;
      const labelUnit = marker.label.entity
        ? (usableLabelValue ? labelSource.stateObj?.attributes?.unit_of_measurement ?? '' : '')
        : targetUnit;
      const label = marker.label.show
        ? createMarkerLabelPresentation(labelValue, labelUnit, markerPrecision, {
          text: marker.label.text,
          showValue: marker.label.showValue,
          showUnit: marker.label.showUnit,
        })
        : null;
      return {
        id: marker.id,
        value,
        scalePercent: visible ? toScalePct(value, safeMin, safeMax) : null,
        position: visible ? projectScalePercent(toScalePct(value, safeMin, safeMax), scaleDirection) : null,
        lane: marker.lane,
        visible,
        color: marker.color,
        shape: marker.shape,
        direction: marker.direction,
        showMarker: marker.showMarker,
        label,
        labelVisible: marker.label.show,
      };
    });
  const markers = buildMarkerModels({
    entityConfig,
    targetValue,
    targetPosition: targetPositionPercent,
    targetPresentation,
    targetLabelPresentation,
    targetVisible,
    peakValue: peakState.value,
    peakPosition: projectScalePercent(peakState.percent, scaleDirection),
    peakPresentation,
    peakLabelPresentation,
    peakVisible: peakState.visible,
    floorValue: floorState.value,
    floorPosition: projectScalePercent(floorState.percent, scaleDirection),
    floorPresentation,
    floorLabelPresentation,
    floorVisible: floorState.visible,
    genericMarkers,
  });

  return {
    entityId,
    name: entityConfig?.name ?? entityState?.attributes?.friendly_name ?? entityId,
    icon: entityConfig?.icon === false
      ? false
      : (entityConfig?.icon ?? entityState?.attributes?.icon ?? getDefaultEntityIcon(entityState, entityId)),
    state: rawState,
    numericValue,
    rawUnit,
    min: safeMin,
    max: safeMax,
    percent,
    positionPercent,
    displayValue: primaryPresentation.number,
    displayUnit: primaryPresentation.unit,
    primaryPresentation,
    unit: primaryPresentation.unit,
    barColor: entityConfig?.bar?.color ?? null,
    fillStyle: entityConfig?.bar?.fill_style ?? null,
    target: targetValue,
    targetPercent,
    targetPositionPercent,
    targetDisplay: targetPresentation?.text ?? null,
    targetPresentation,
    targetLabelPresentation,
    targetVisible,
    baseline: baselineValue,
    baselinePercent,
    baselinePositionPercent,
    baselineVisible,
    peak: peakState.value,
    peakPercent: peakState.percent,
    peakDisplay: peakPresentation?.number ?? null,
    peakPresentation,
    peakLabelPresentation,
    peakVisible: peakState.visible,
    floor: floorState.value,
    floorPercent: floorState.percent,
    floorDisplay: floorPresentation?.number ?? null,
    floorPresentation,
    floorLabelPresentation,
    floorVisible: floorState.visible,
    markers,
    markerLaneOccupancy: getMarkerLaneOccupancy(entityConfig),
    markerLabelLaneOccupancy: getMarkerLabelLaneOccupancy(entityConfig),
    segments: entityConfig?.bar?.segments ?? null,
    gradientStops: entityConfig?.bar?.gradient_stops ?? null,
    needle: getNeedleState(entityConfig, numericValue, safeMin, safeMax, baselinePercent, scaleDirection),
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
