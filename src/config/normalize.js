import { getConfiguredTargetMarkers } from './directional-targets.js';
import { getOverlayPaintDefaults } from './paint-defaults.js';
import { canonicalizeHistoricalWindow, parseHistoricalWindow, isEligibleHistoricalWindow } from '../history/time-window.js';

export const UNSUPPORTED_EXTREMA_ALIASES = Symbol.for('sensor-bar-card-plus.unsupported-extrema-aliases');
export const INVALID_PAINT_OPACITY = Symbol.for('sensor-bar-card-plus.invalid-paint-opacity');
export const BAR_PAINT_DIAGNOSTICS = Symbol.for('sensor-bar-card-plus.bar-paint-diagnostics');
export const PAINT_PROPERTY_SOURCES = Symbol.for('sensor-bar-card-plus.paint-property-sources');

/** Normalize only opacity; private metadata retains the invalid input for later diagnostics. */
export function normalizePaintOpacity(paint) {
  const rawOpacity = paint.opacity;
  const opacity = getFiniteNumber(rawOpacity);
  const valid = Number.isFinite(opacity) && opacity >= 0 && opacity <= 100;
  const normalized = { ...paint, opacity: valid ? opacity : 100 };
  if (rawOpacity !== undefined && !valid) {
    Object.defineProperty(normalized, INVALID_PAINT_OPACITY, { value: rawOpacity });
  }
  return normalized;
}

function recordUnsupportedExtremaAliases(normalized, raw) {
  const aliases = ['peak_marker', 'floor_marker'].filter(key => Object.prototype.hasOwnProperty.call(raw ?? {}, key));
  if (aliases.length) Object.defineProperty(normalized, UNSUPPORTED_EXTREMA_ALIASES, { value: aliases });
}

function normalizeAttribute(value) {
  return typeof value === 'string' && value !== '' ? value : null;
}

function normalizeWindowEntity(value) {
  if (value === undefined || value === null || value === '') return { entity: null, invalid: false };
  if (typeof value === 'string' && /^input_select\.[a-z0-9_]+$/i.test(value.trim())) {
    return { entity: value.trim(), invalid: false };
  }
  return { entity: null, invalid: true };
}

function hasInvalidAttribute(value) {
  return value !== undefined && value !== null && value !== '' && typeof value !== 'string';
}

export function normalizeResolvableValue(value, entityValue, percentValue = null, attribute = null) {
  const normalized = {
    fixed: value ?? null,
    entity: entityValue ?? null,
  };
  if (Number.isFinite(percentValue)) {
    normalized.percent = percentValue;
  }
  const normalizedAttribute = normalizeAttribute(attribute);
  if (normalizedAttribute !== null) normalized.attribute = normalizedAttribute;
  if (hasInvalidAttribute(attribute)) normalized.attribute_invalid = true;
  return normalized;
}

export function looksLikeEntityId(value) {
  return typeof value === 'string' && /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(value.trim());
}

export function parsePercentLiteral(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
  if (!match) return null;
  const percent = parseFloat(match[1]);
  return Number.isFinite(percent) ? percent : null;
}

export function getFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

export function normalizeStructuredResolvableValue(input, inheritedResolvable = null, defaultValue = null, options = {}) {
  const { allowPercent = false } = options;
  const inherited = inheritedResolvable ?? normalizeResolvableValue(defaultValue, null);
  if (input === undefined) {
    return { ...inherited };
  }
  if (input === null) {
    return normalizeResolvableValue(null, null);
  }
  if (typeof input === 'object' && !Array.isArray(input)) {
    const value = input.fixed ?? input.value ?? null;
    const rawEntity = input.entity;
    let entity = null;
    let attribute = null;
    let entityInvalid = false;
    // `entity: id` is the released state-source form. Attribute-backed
    // sources use the structured `entity: { id, attribute }` form.
    if (rawEntity !== undefined && rawEntity !== null && rawEntity !== '') {
      if (typeof rawEntity === 'string') {
        entity = rawEntity.trim();
        if (entity && !looksLikeEntityId(entity)) {
          entity = null;
          entityInvalid = true;
        }
      } else if (rawEntity && typeof rawEntity === 'object' && !Array.isArray(rawEntity)) {
        const keys = Object.keys(rawEntity);
        const id = rawEntity.id;
        const hasAttribute = Object.prototype.hasOwnProperty.call(rawEntity, 'attribute');
        if (typeof id !== 'string' || !looksLikeEntityId(id.trim())
          || (hasAttribute && (typeof rawEntity.attribute !== 'string' || !rawEntity.attribute.trim()))
          || keys.some((key) => !['id', 'attribute'].includes(key))) {
          entityInvalid = true;
        } else {
          entity = id.trim();
          if (hasAttribute) attribute = rawEntity.attribute.trim();
        }
      } else {
        entityInvalid = true;
      }
    }
    // The former v1.9 sibling form was never released. Reject it instead of
    // quietly degrading to a state source.
    if (Object.prototype.hasOwnProperty.call(input, 'attribute')) {
      entityInvalid = true;
      entity = null;
      attribute = null;
    }
    const percent = allowPercent ? getFiniteNumber(input.percent) : null;
    const normalized = normalizeResolvableValue(value, entity, percent, attribute);
    if (entityInvalid) normalized.entity_invalid = true;
    return normalized;
  }
  if (looksLikeEntityId(input)) {
    return normalizeResolvableValue(
      inherited.fixed ?? defaultValue ?? null,
      input,
      inherited.percent ?? null
    );
  }
  if (allowPercent) {
    const percent = parsePercentLiteral(input);
    if (Number.isFinite(percent)) {
      return normalizeResolvableValue(null, null, percent);
    }
  }
  return normalizeResolvableValue(input, null);
}

function applyGenericMarkerCapacity(markers, config) {
  const occupied = {
    above: config?.peak_marker?.show === true ? 1 : 0,
    below: (config?.floor_marker?.show === true ? 1 : 0)
      + getConfiguredTargetMarkers(config).length,
  };

  return markers.map((marker) => {
    const accepted = marker.valid && occupied[marker.lane] < 4;
    if (accepted) occupied[marker.lane] += 1;
    return { ...marker, accepted };
  });
}

export function normalizeGenericMarkerList(input, capacityConfig = null) {
  if (!Array.isArray(input)) {
    return { markers: [], invalidList: input !== undefined };
  }

  const markers = input.map((rawMarker, index) => {
    if (!rawMarker || typeof rawMarker !== 'object' || Array.isArray(rawMarker)) {
      return { id: `generic-${index}`, index, valid: false, accepted: false, malformed: true };
    }

    const rawAt = rawMarker.at;
    const atInput = typeof rawAt === 'string' ? rawAt.trim() : rawAt;
    const source = normalizeStructuredResolvableValue(atInput, null, null, { allowPercent: true });
    const explicitEntity = rawAt && typeof rawAt === 'object' && rawAt.entity !== undefined
      ? source.entity
      : (typeof atInput === 'string' && looksLikeEntityId(atInput) ? atInput : null);
    const invalidEntity = source.entity_invalid === true || (explicitEntity !== null && explicitEntity !== undefined && explicitEntity !== ''
      && !looksLikeEntityId(explicitEntity));
    const invalidFixed = rawAt && typeof rawAt === 'object'
      && rawAt.fixed !== undefined && rawAt.fixed !== null
      && getFiniteNumber(rawAt.fixed) === null;
    const hasObjectPercent = rawAt && typeof rawAt === 'object'
      && Object.prototype.hasOwnProperty.call(rawAt, 'percent');
    const hasSource = !!source.entity
      || getFiniteNumber(source.fixed) !== null
      || Number.isFinite(source.percent);
    const invalidPercentage = hasObjectPercent
      ? !Number.isFinite(source.percent) || source.percent < 0 || source.percent > 100
      : Number.isFinite(source.percent) && (source.percent < 0 || source.percent > 100);
    const validSource = rawAt !== undefined && rawAt !== null
      && !invalidEntity
      && !invalidFixed
      && hasSource
      && !invalidPercentage;
    const lane = rawMarker.lane === undefined ? 'below' : rawMarker.lane;
    const validLane = lane === 'above' || lane === 'below';
    const supportedShapes = ['circle', 'diamond', 'triangle', 'chevron', 'arrow', 'pin'];
    const validShape = rawMarker.shape === undefined || supportedShapes.includes(rawMarker.shape);
    const direction = normalizeMarkerDirection(rawMarker.direction);
    const invalidDirection = rawMarker.direction !== undefined && !['inward', 'outward'].includes(
      typeof rawMarker.direction === 'string' ? rawMarker.direction.trim().toLowerCase() : ''
    );
    const label = rawMarker.label && typeof rawMarker.label === 'object' && !Array.isArray(rawMarker.label)
      ? rawMarker.label
      : {};
    const labelConfig = normalizeMarkerLabelConfig(label);
    const labelEntityInput = label.entity;
    const labelEntityObject = labelEntityInput && typeof labelEntityInput === 'object' && !Array.isArray(labelEntityInput)
      ? labelEntityInput : null;
    const labelEntity = typeof labelEntityInput === 'string'
      ? labelEntityInput.trim()
      : typeof labelEntityObject?.id === 'string' ? labelEntityObject.id.trim() : '';
    const labelAttribute = labelEntityObject?.attribute;
    const invalidLabelEntity = (labelEntityInput !== undefined && labelEntityInput !== null && labelEntityInput !== ''
      && !looksLikeEntityId(labelEntity))
      || (labelEntityObject && (Object.keys(labelEntityObject).some((key) => !['id', 'attribute'].includes(key))
        || (Object.prototype.hasOwnProperty.call(labelEntityObject, 'attribute')
          && (typeof labelAttribute !== 'string' || !labelAttribute.trim()))))
      || Object.prototype.hasOwnProperty.call(label, 'attribute');
    const validLabelEntity = labelEntity && looksLikeEntityId(labelEntity) && !invalidLabelEntity ? labelEntity : null;
    const showMarker = typeof rawMarker.show_marker === 'boolean' ? rawMarker.show_marker : true;

    return {
      id: `generic-${index}`,
      index,
      source: {
        ...source,
        entity: typeof source.entity === 'string' ? source.entity.trim() : source.entity,
      },
      lane: validLane ? lane : null,
      shape: validShape ? (rawMarker.shape ?? 'circle') : 'circle',
      direction,
      invalidDirection,
      showMarker,
      invalidShowMarker: rawMarker.show_marker !== undefined && typeof rawMarker.show_marker !== 'boolean',
      color: typeof rawMarker.color === 'string' && rawMarker.color.trim() ? rawMarker.color : '#888888',
      label: {
        show: label.show === true,
        text: labelConfig.label_text,
        entity: validLabelEntity,
        ...(normalizeAttribute(labelAttribute) !== null ? { attribute: normalizeAttribute(labelAttribute) } : {}),
        showValue: labelConfig.label_show_value,
        showUnit: labelConfig.label_show_unit,
        precision: labelConfig.label_precision,
        invalidShow: labelConfig.label_invalid_show,
        invalidText: labelConfig.label_invalid_text,
        invalidShowValue: labelConfig.label_invalid_show_value,
        invalidShowUnit: labelConfig.label_invalid_show_unit,
        invalidPrecision: labelConfig.label_invalid_precision,
        invalidPrecisionKey: labelConfig.label_precision_key,
        unsupportedUnit: labelConfig.label_unsupported_unit,
        invalidEntity: invalidLabelEntity,
      },
      valid: validSource && validLane,
      invalidSource: !validSource,
      invalidPercentage,
      invalidLane: !validLane,
      invalidShape: !validShape,
      accepted: false,
    };
  });

  return { markers: applyGenericMarkerCapacity(markers, capacityConfig), invalidList: false };
}

export function normalizeBaselineDirectionConfig(input, inheritedDirection = null) {
  const inherited = inheritedDirection ?? { color: null };
  if (input === undefined) {
    return { ...inherited };
  }
  if (input === null) {
    return { color: null };
  }
  if (typeof input === 'string') input = { color: input };
  if (typeof input === 'object' && !Array.isArray(input)) {
    const color = hasOwnConfigValue(input, 'color') ? input.color : inherited.color ?? null;
    if (Object.prototype.hasOwnProperty.call(input, 'paint') && input.paint === null) {
      return { color, paint: null };
    }
    const hasPaint = Object.prototype.hasOwnProperty.call(input, 'paint')
      && input.paint !== undefined;
    const inheritedPaint = inherited.paint;
    if (!hasPaint && inheritedPaint === null && !hasOwnConfigValue(input, 'color')) return { color, paint: null };
    if (!hasPaint && !inheritedPaint) return { color };

    const defaults = getOverlayPaintDefaults();
    const fallback = inheritedPaint ?? (inherited.paint !== null && inherited.color ? { ...defaults, color: inherited.color } : defaults);
    const normalized = normalizeBarConfig({
      bar: {
        ...(hasPaint ? { paint: input.paint } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    }, { bar: { ...fallback, paint: fallback } }, { isCardScope: false });
    return {
      color: hasPaint ? normalized.paint.color : color,
      paint: normalized.paint,
      ...(normalized[BAR_PAINT_DIAGNOSTICS]
        ? { [BAR_PAINT_DIAGNOSTICS]: normalized[BAR_PAINT_DIAGNOSTICS] } : {}),
    };
  }
  return {
    color: input,
  };
}

export function normalizeOptionalEnabled(value) {
  return value === true ? true : value === false ? false : null;
}

/** Above Paint is independent of the shared Target source and marker. Preserve
 * disable state and the selected scope's legacy rendering policy together. */
export function normalizeTargetAboveConfig(config, parent = null) {
  const inherited = parent?._normalized ? parent.target_above
    : parent ? normalizeTargetAboveConfig(parent) : { legacy: false };
  const paint = config?.target?.when_above?.paint;
  const structuredColor = config?.target?.when_exceeded?.fill_color;
  const legacyColor = structuredColor ?? config?.above_target_color ?? undefined;
  if (paint === undefined && legacyColor === undefined) return { ...inherited };
  // Released falsy colors suppress an inherited legacy overlay as well.
  if (paint === undefined && !legacyColor) return { paint: null, legacy: true };
  const normalized = normalizeBaselineDirectionConfig({
    ...(paint !== undefined ? { paint } : { paint: {} }),
    ...(legacyColor !== undefined ? { color: legacyColor } : {}),
  }, inherited);
  const issues = normalized[BAR_PAINT_DIAGNOSTICS];
  return {
    paint: normalized.paint,
    legacy: paint === undefined,
    ...(issues ? { [BAR_PAINT_DIAGNOSTICS]: issues.map(issue => ({ ...issue,
      ...(issue.legacyPath ? { legacyPath: structuredColor != null ? 'target.when_exceeded.fill_color' : 'above_target_color' } : {}),
    })) } : {}),
  };
}

export function normalizeTargetBelowConfig(config, parent = null) {
  if (config?._normalized) return config.target_below;
  const inherited = parent?._normalized ? parent.target_below
    : parent ? normalizeTargetBelowConfig(parent) : undefined;
  const paint = config?.target?.when_below?.paint;
  const normalized = normalizeBaselineDirectionConfig(paint === undefined ? undefined : { paint }, inherited ? { paint: inherited.paint } : null);
  return { paint: normalized.paint,
    ...(normalized[BAR_PAINT_DIAGNOSTICS] ? { [BAR_PAINT_DIAGNOSTICS]: normalized[BAR_PAINT_DIAGNOSTICS] } : {}) };
}

export function normalizeBaselineConfig(entityConfig, cardConfig) {
  const cardBaseline = cardConfig?.baseline;
  const rawBaseline = entityConfig?.baseline;
  const inherited = {
    enabled: normalizeOptionalEnabled(cardBaseline?.enabled),
    at: cardBaseline?.at ? { ...cardBaseline.at } : normalizeResolvableValue(null, null),
    above: normalizeBaselineDirectionConfig(undefined, cardBaseline?.above),
    below: normalizeBaselineDirectionConfig(undefined, cardBaseline?.below),
  };

  if (rawBaseline === undefined) {
    return inherited;
  }

  if (rawBaseline === null) {
    return {
      enabled: null,
      at: normalizeResolvableValue(null, null),
      above: { color: null },
      below: { color: null },
    };
  }

  if (typeof rawBaseline !== 'object' || Array.isArray(rawBaseline)) {
    return {
      enabled: inherited.enabled,
      at: normalizeStructuredResolvableValue(rawBaseline, inherited.at, null),
      above: inherited.above,
      below: inherited.below,
    };
  }

  return {
    enabled: normalizeOptionalEnabled(rawBaseline.enabled) ?? inherited.enabled,
    at: normalizeStructuredResolvableValue(rawBaseline.at, inherited.at, null, { allowPercent: true }),
    above: normalizeBaselineDirectionConfig(rawBaseline.above, inherited.above),
    below: normalizeBaselineDirectionConfig(rawBaseline.below, inherited.below),
  };
}

export function inferSegmentEndValues(segments, fallbackEnd = null) {
  const sorted = [...segments].sort((a, b) => a.from - b.from);
  return sorted.map((segment, index) => {
    let to = Number.isFinite(segment.to) ? segment.to : null;
    if (!Number.isFinite(to) && index < sorted.length - 1) {
      to = sorted[index + 1].from;
    }
    if (!Number.isFinite(to) && Number.isFinite(fallbackEnd)) {
      to = fallbackEnd;
    }
    return {
      from: segment.from,
      to,
      color: segment.color,
      label: segment.label ?? null,
    };
  });
}

export function normalizeSeverityToSegments(input) {
  if (!Array.isArray(input)) return null;
  const segments = input
    .filter((segment) => Number.isFinite(segment?.from) && segment?.color)
    .map((segment) => ({
      from: segment.from,
      to: Number.isFinite(segment?.to) ? segment.to : null,
      color: segment.color,
      label: segment.label ?? null,
    }));

  return inferSegmentEndValues(segments, 100);
}

export function hasResolvableMagnitude(resolvable) {
  return !!resolvable && (
    Number.isFinite(getFiniteNumber(resolvable.fixed))
    || Number.isFinite(resolvable.percent)
  );
}

function normalizeSegmentBoundary(input, legacySegmentSpace = null) {
  if (input === undefined) return { value: null, issue: null };
  if (input === null) return { value: null, issue: 'malformed' };

  if (input && typeof input === 'object' && !Array.isArray(input)) {
    if (input.entity !== undefined && input.entity !== null && input.entity !== '') {
      return { value: null, issue: 'entity' };
    }
    if (Object.prototype.hasOwnProperty.call(input, 'percent')) {
      const percent = getFiniteNumber(input.percent);
      return Number.isFinite(percent)
        ? { value: normalizeResolvableValue(null, null, percent), issue: null }
        : { value: null, issue: 'malformed' };
    }
    const fixed = getFiniteNumber(input.fixed ?? input.value);
    return Number.isFinite(fixed)
      ? { value: normalizeResolvableValue(fixed, null), issue: null }
      : { value: null, issue: 'malformed' };
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (looksLikeEntityId(trimmed)) return { value: null, issue: 'entity' };
    if (trimmed.includes('%')) {
      const percent = parsePercentLiteral(trimmed);
      return Number.isFinite(percent)
        ? { value: normalizeResolvableValue(null, null, percent), issue: null }
        : { value: null, issue: 'malformed_percent' };
    }
  }

  const numeric = getFiniteNumber(input);
  if (!Number.isFinite(numeric)) return { value: null, issue: 'malformed' };
  return legacySegmentSpace === 'percent'
    ? { value: normalizeResolvableValue(null, null, numeric), issue: null }
    : { value: normalizeResolvableValue(numeric, null), issue: null };
}

export function normalizeGaugeSegments(input, options = {}) {
  if (!Array.isArray(input)) return null;
  const { legacySegmentSpace = null } = options;
  const segments = input
    .map((segment) => {
      const from = segment?.from === undefined
        ? { value: null, issue: 'malformed' }
        : normalizeSegmentBoundary(segment.from, legacySegmentSpace);
      const to = segment?.to === undefined
        ? { value: null, issue: null }
        : segment.to === null
          ? { value: null, issue: null }
          : normalizeSegmentBoundary(segment.to, legacySegmentSpace);

      if (!segment?.color) {
        return null;
      }

      return {
        from: from.value,
        to: to.value,
        invalidBoundary: from.issue ?? to.issue,
        color: segment.color,
        label: segment.label ?? null,
      };
    })
    .filter(Boolean);

  return segments.map((segment, index) => {
    const nextValid = segments.slice(index + 1).find((candidate) => !candidate.invalidBoundary);
    return {
      from: segment.from ? { ...segment.from } : null,
      to: segment.to ? { ...segment.to } : (nextValid?.from ? { ...nextValid.from } : null),
      ...(segment.invalidBoundary ? { invalidBoundary: segment.invalidBoundary } : {}),
      color: segment.color,
      label: segment.label ?? null,
    };
  });
}

export function normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
  const cardScale = cardConfig?.scale;
  const entityScale = entityConfig?.scale;
  const entityKey = `${key}_entity`;
  const cardBound = cardScale?.[key];

  const inherited = cardBound
    ? (Object.prototype.hasOwnProperty.call(cardBound, 'fixed_explicit')
      ? normalizeResolvableValue(cardBound.fixed ?? cardBound.value ?? null, cardBound.entity ?? null, cardBound.percent ?? null, cardBound.attribute)
      : normalizeStructuredResolvableValue(cardBound))
    : normalizeResolvableValue(
      cardConfig?.[key] ?? defaultValue,
      cardConfig?.[entityKey] ?? null
    );
  const inheritedFixedExplicit = cardBound
    ? cardBound.fixed_explicit !== false && cardBound.fixed !== null && cardBound.fixed !== undefined
    : cardConfig?.[key] !== null && cardConfig?.[key] !== undefined;
  const withFixedExplicit = (bound, explicit) => {
    // Keep default provenance internal while preserving the normalized shape.
    Object.defineProperty(bound, 'fixed_explicit', { value: explicit });
    return bound;
  };

  if (entityScale?.[key] !== undefined) {
    const input = entityScale[key];
    const fixedExplicit = looksLikeEntityId(input)
      ? inheritedFixedExplicit
      : (typeof input === 'object' && input !== null
        ? (input.fixed ?? input.value) !== null && (input.fixed ?? input.value) !== undefined
        : input !== null);
    return withFixedExplicit(normalizeStructuredResolvableValue(
      entityScale[key],
      inherited,
      defaultValue
    ), fixedExplicit);
  }

  const entityOverride = entityConfig[entityKey];
  const hasEntityOverride =
    entityOverride !== undefined && entityOverride !== null;

  const value =
    entityConfig[key]
    ?? (hasEntityOverride ? null : inherited.fixed)
    ?? (inherited.entity ? null : defaultValue);

  const entity =
    entityOverride
    ?? inherited.entity
    ?? null;

  return withFixedExplicit(normalizeResolvableValue(value, entity, inherited.percent ?? null, inherited.attribute),
    (entityConfig[key] !== null && entityConfig[key] !== undefined)
      || (!hasEntityOverride && inheritedFixedExplicit));
}

export function normalizeScaleConfig(entityConfig, cardConfig) {
  const entityDirection = entityConfig?.scale?.direction;
  const inheritedDirection = cardConfig?.scale?.direction;
  const validDirection = (direction) => direction === 'normal' || direction === 'reverse';
  const hasEntityDirection = entityDirection !== undefined;
  const direction = validDirection(entityDirection)
    ? entityDirection
    : validDirection(inheritedDirection) ? inheritedDirection : 'normal';
  return {
    min: normalizeScaleBound(entityConfig, cardConfig, 'min', 0),
    max: normalizeScaleBound(entityConfig, cardConfig, 'max', 100),
    direction,
    ...(hasEntityDirection && !validDirection(entityDirection)
      ? { direction_invalid: true }
      : {}),
  };
}

export function fillStyleToColorMode(fillStyle) {
  switch (fillStyle) {
    case 'solid': return 'single';
    case 'gradient': return 'gradient';
    case 'bands': return 'severity';
    case 'soft_bands': return 'severity';
    case 'band_gradient': return 'severity_gradient';
    default: return null;
  }
}

export function colorModeToFillStyle(colorMode) {
  switch (colorMode) {
    case 'single': return 'solid';
    case 'gradient': return 'gradient';
    case 'severity': return 'bands';
    case 'severity_gradient': return 'band_gradient';
    default: return null;
  }
}

const PAINT_EXPLICITNESS = Symbol('sbcp.paintExplicitness');
const EXPLICIT_SEGMENT_SPACE = Symbol('sbcp.explicitSegmentSpace');

function hasOwnConfigValue(config, key) {
  return config !== null && config !== undefined
    && Object.prototype.hasOwnProperty.call(config, key);
}

function hasExplicitColor(config) {
  const values = [
    hasOwnConfigValue(config, 'color') ? config.color : undefined,
    hasOwnConfigValue(config?.bar, 'color') ? config.bar.color : undefined,
  ];
  return values.some((value) => value !== undefined && value !== null);
}

export const BAR_PAINT_ALIASES = {
  color: [['bar', 'color'], ['color']],
  fill_style: [['bar', 'fill_style'], ['bar', 'color_mode'], ['color_mode']],
  solid_fill: [['bar', 'solid_fill']],
  segments: [['bar', 'segments'], ['segments'], ['severity']],
  gradient_stops: [['bar', 'gradient_stops'], ['gradient_stops']],
};
const barPaintAliases = BAR_PAINT_ALIASES;

function paintAliasValue(config, path) {
  return path.reduce((value, key) => value?.[key], config);
}

function isPaintObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPaintColor(value) {
  // Colors remain CSS strings, including variables and named colors. Do not
  // make pure normalization depend on browser CSS.supports or a new parser.
  return typeof value === 'string' && value.trim() !== '';
}

function isValidGroupedPaintProperty(property, value) {
  switch (property) {
    case 'color': return isPaintColor(value);
    case 'fill_style': return ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient'].includes(value);
    case 'solid_fill': return typeof value === 'boolean';
    case 'segments': {
      if (!Array.isArray(value)) return false;
      const normalized = normalizeGaugeSegments(value);
      return normalized.length === value.length && normalized.every(segment => !segment.invalidBoundary && isPaintColor(segment.color));
    }
    case 'gradient_stops': return Array.isArray(value) && value.every(stop => {
      const pos = parsePercentLiteral(stop?.pos) ?? getFiniteNumber(stop?.pos);
      return isPaintObject(stop) && Number.isFinite(pos) && pos >= 0 && pos <= 100 && isPaintColor(stop.color);
    });
    default: return false;
  }
}

function validPaintFallbacks(config, property) {
  let result = config;
  for (const path of barPaintAliases[property] ?? []) {
    const value = paintAliasValue(config, path);
    if (value === undefined) continue;
    const severity = path.at(-1) === 'severity' && Array.isArray(value) ? normalizeSeverityToSegments(value) : null;
    const valid = path.at(-1) === 'color_mode'
      ? colorModeToFillStyle(value) !== null
      : path.at(-1) === 'severity'
        ? severity !== null && severity.length === value.length && severity.every(segment => isPaintColor(segment.color))
        : isValidGroupedPaintProperty(property, value);
    if (valid) continue;
    if (result === config) {
      result = { ...config, bar: { ...config?.bar } };
      if (hasOwnConfigValue(config?.bar, EXPLICIT_SEGMENT_SPACE)) {
        Object.defineProperty(result.bar, EXPLICIT_SEGMENT_SPACE, { value: config.bar[EXPLICIT_SEGMENT_SPACE] });
      }
    }
    if (path.length === 1) delete result[path[0]];
    else delete result.bar[path[1]];
  }
  return result;
}

// Adapt only grouped properties into the established bar/alias pipeline. Legacy
// inputs retain their released normalization, including malformed-value handling.
function groupedBarPaintInput(config, authored = config) {
  const paint = config?.bar?.paint;
  const diagnostics = [];
  const overrides = {};
  if (hasOwnConfigValue(config?.bar, EXPLICIT_SEGMENT_SPACE) || paint === undefined) return { config, paint, diagnostics, overrides };
  if (!isPaintObject(paint)) {
    diagnostics.push({ kind: 'invalid', property: null, input: paint });
    return { config, paint: null, diagnostics, overrides };
  }
  for (const property of Object.keys(barPaintAliases)) {
    if (!hasOwnConfigValue(paint, property) || paint[property] === undefined) continue;
    if (!isValidGroupedPaintProperty(property, paint[property])) {
      diagnostics.push({ kind: 'invalid', property, input: paint[property] });
      // Only a new invalid grouped property opts into finding a valid fallback;
      // do not tighten released legacy-only normalization.
      config = validPaintFallbacks(config, property);
      continue;
    }
    overrides[property] = paint[property];
    const alias = barPaintAliases[property].find(path => paintAliasValue(authored, path) != null);
    if (alias) diagnostics.push({ kind: 'legacy_conflict', property, legacyPath: alias.join('.') });
  }
  return { config: { ...config, bar: { ...config?.bar, ...overrides } }, paint, diagnostics, overrides };
}

function paintPropertySources(config, overrides, paint) {
  const sources = {};
  for (const [property, aliases] of Object.entries(barPaintAliases)) {
    if (hasOwnConfigValue(overrides, property)) sources[property] = `bar.paint.${property}`;
    else {
      const alias = aliases.find(path => paintAliasValue(config, path) != null);
      if (alias) sources[property] = alias.join('.');
    }
  }
  if (isPaintObject(paint) && hasOwnConfigValue(paint, 'preset') && paint.preset !== undefined) {
    sources.preset = 'bar.paint.preset';
  }
  if (isPaintObject(paint) && hasOwnConfigValue(paint, 'opacity') && paint.opacity !== undefined) sources.opacity = 'bar.paint.opacity';
  return sources;
}

export function getPaintExplicitness(config) {
  config = groupedBarPaintInput(config).config;
  const bar = config?.bar;
  const explicitPaintKeys = [
    [config, 'color_mode'],
    [bar, 'color_mode'],
    [bar, 'fill_style'],
    [config, 'severity'],
    [config, 'segments'],
    [bar, 'segments'],
    [config, 'gradient_stops'],
    [bar, 'gradient_stops'],
    [bar, 'solid_fill'],
  ];

  return {
    color: hasExplicitColor(config),
    paint: explicitPaintKeys.some(([source, key]) => hasOwnConfigValue(source, key)),
  };
}

export function normalizeBarModeConfig(barConfig = null, flatColorMode = null) {
  const fillStyle = barConfig?.fill_style ?? null;
  const colorMode = barConfig?.color_mode ?? flatColorMode ?? null;
  const normalizedColorMode = fillStyleToColorMode(fillStyle) ?? colorMode ?? 'severity';
  return {
    fill_style: fillStyle ?? colorModeToFillStyle(normalizedColorMode) ?? 'bands',
    color_mode: normalizedColorMode,
  };
}

export function resolveNormalizedBarMode(
  entityBar,
  entityConfig,
  cardBar,
  cardConfig,
  { scopeExplicitness = null, inheritedExplicitness = null, isCardScope = false } = {}
) {
  const colorOnlyScope = scopeExplicitness?.color === true && scopeExplicitness.paint !== true;
  const inheritedPaintIsExplicit = inheritedExplicitness?.paint === true;
  if (colorOnlyScope && (isCardScope || !inheritedPaintIsExplicit)) {
    return normalizeBarModeConfig({ fill_style: 'solid' }, null);
  }

  if (entityBar?.fill_style !== undefined || entityBar?.color_mode !== undefined || entityConfig.color_mode !== undefined) {
    return normalizeBarModeConfig(entityBar, entityConfig.color_mode);
  }
  if (cardBar?.fill_style !== undefined || cardBar?.color_mode !== undefined || cardConfig?.color_mode !== undefined) {
    return normalizeBarModeConfig(cardBar, cardConfig?.color_mode);
  }
  return normalizeBarModeConfig(null, null);
}

export function normalizeGradientStops(input) {
  if (!Array.isArray(input)) return input ?? null;
  return input.map((stop) => {
    if (!stop || typeof stop !== 'object' || Array.isArray(stop)) {
      return stop;
    }
    const percentPos = parsePercentLiteral(stop.pos);
    const numericPos = Number.isFinite(percentPos) ? percentPos : getFiniteNumber(stop.pos);
    return {
      ...stop,
      pos: Number.isFinite(numericPos) ? numericPos : stop.pos,
    };
  });
}

export function normalizeNeedleConfig(input, inheritedNeedle = null) {
  const base = inheritedNeedle
    ? { show: inheritedNeedle.show ?? false, color: inheritedNeedle.color ?? '#ffffff' }
    : { show: false, color: '#ffffff' };

  if (input === undefined) {
    return { ...base };
  }

  if (typeof input === 'boolean') {
    return {
      show: input,
      color: '#ffffff',
    };
  }

  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return {
      show: input.show ?? base.show,
      color: input.color ?? base.color,
    };
  }

  return { ...base };
}

export function normalizeBarConfig(entityConfig, cardConfig, options = {}) {
  const scopeExplicitness = options.scopeExplicitness ?? getPaintExplicitness(entityConfig);
  const inheritedExplicitness = options.inheritedExplicitness
    ?? cardConfig?.[PAINT_EXPLICITNESS]
    ?? getPaintExplicitness(cardConfig);
  const isCardScope = options.isCardScope ?? cardConfig == null;
  const authored = options.rawConfig ?? entityConfig;
  const local = groupedBarPaintInput(entityConfig, authored);
  const inherited = groupedBarPaintInput(cardConfig);
  entityConfig = local.config;
  cardConfig = inherited.config;
  for (const issue of local.diagnostics) {
    if (issue.kind === 'invalid' && issue.property !== null) cardConfig = validPaintFallbacks(cardConfig, issue.property);
  }
  const cardBar = cardConfig?.bar;
  const entityBar = entityConfig?.bar;
  // Normalized severity also uses percent space; only a configured legacy mode
  // may govern a replacement Segment list. Null provenance prevents that leak.
  const inheritedSegmentSpace = hasOwnConfigValue(cardBar, EXPLICIT_SEGMENT_SPACE)
    ? cardBar[EXPLICIT_SEGMENT_SPACE]
    : ['percent', 'scale'].includes(cardBar?.segment_space) ? cardBar.segment_space : null;
  const explicitSegmentSpace = ['percent', 'scale'].includes(entityBar?.segment_space)
    ? entityBar.segment_space
    : inheritedSegmentSpace;
  const entityStructuredSegments = entityBar?.segments;
  const entityTopLevelSegments = entityConfig.segments;
  const entityLegacySeverity = entityConfig.severity;
  const cardStructuredSegments = cardBar?.segments ?? null;
  const cardTopLevelSegments = cardConfig?.segments ?? null;
  const cardLegacySeverity = cardConfig?.severity ?? null;
  let segments = null;
  let segment_space = cardBar?.segment_space === 'percent' || cardBar?.segment_space === 'scale'
    ? cardBar.segment_space
    : null;

  if (entityStructuredSegments !== undefined && entityStructuredSegments !== null) {
    segment_space = explicitSegmentSpace;
    segments = normalizeGaugeSegments(entityStructuredSegments, { legacySegmentSpace: segment_space });
  } else if (entityTopLevelSegments !== undefined && entityTopLevelSegments !== null) {
    segments = normalizeGaugeSegments(entityTopLevelSegments);
  } else if (entityLegacySeverity !== undefined && entityLegacySeverity !== null) {
    segments = normalizeSeverityToSegments(entityLegacySeverity);
    segment_space = 'percent';
  } else if (cardStructuredSegments !== null && cardStructuredSegments !== undefined) {
    segments = hasOwnConfigValue(inherited.overrides, 'segments')
      ? normalizeGaugeSegments(cardStructuredSegments, { legacySegmentSpace: inheritedSegmentSpace })
      : cardStructuredSegments.map((segment) => ({ ...segment }));
  } else if (cardTopLevelSegments !== null && cardTopLevelSegments !== undefined) {
    segments = normalizeGaugeSegments(cardTopLevelSegments);
  } else if (cardLegacySeverity !== null && cardLegacySeverity !== undefined) {
    segments = normalizeSeverityToSegments(cardLegacySeverity);
    segment_space = 'percent';
  }

  const structuredAboveTargetColor = entityConfig?.target && typeof entityConfig.target === 'object' && !Array.isArray(entityConfig.target)
    ? entityConfig.target.when_exceeded?.fill_color
    : undefined;
  const inheritedStructuredAboveTargetColor = cardConfig?.target && typeof cardConfig.target === 'object' && !Array.isArray(cardConfig.target)
    ? cardConfig.target.when_exceeded?.fill_color
    : undefined;
  const normalizedMode = resolveNormalizedBarMode(
    entityBar,
    entityConfig,
    cardBar,
    cardConfig,
    { scopeExplicitness, inheritedExplicitness, isCardScope }
  );

  const normalizedBar = {
    direction: ['normal', 'reverse'].includes(entityBar?.direction)
      ? entityBar.direction
      : ['normal', 'reverse'].includes(cardBar?.direction) ? cardBar.direction : 'normal',
    ...(entityBar?.direction !== undefined
      && !['normal', 'reverse'].includes(entityBar.direction)
      ? { direction_invalid: true }
      : {}),
    fill_style: normalizedMode.fill_style,
    color_mode: normalizedMode.color_mode,
    needle: normalizeNeedleConfig(entityBar?.needle, cardBar?.needle),
    solid_fill: entityBar?.solid_fill ?? cardBar?.solid_fill ?? false,
    color: entityBar?.color ?? entityConfig.color ?? cardBar?.color ?? cardConfig?.color ?? '#4a9eff',
    gradient_stops: normalizeGradientStops(
      entityBar?.gradient_stops ?? entityConfig.gradient_stops ?? cardBar?.gradient_stops ?? cardConfig?.gradient_stops ?? null
    ),
    severity: segments,
    segments,
    segment_space,
    animated: entityBar?.animated ?? entityConfig.animated ?? cardBar?.animated ?? cardConfig?.animated ?? true,
    above_target_color: structuredAboveTargetColor ?? entityConfig.above_target_color ?? cardBar?.above_target_color ?? inheritedStructuredAboveTargetColor ?? cardConfig?.above_target_color ?? null,
  };
  Object.defineProperty(normalizedBar, EXPLICIT_SEGMENT_SPACE, { value: explicitSegmentSpace });
  const localOpacity = isPaintObject(local.paint) && hasOwnConfigValue(local.paint, 'opacity') && local.paint.opacity !== undefined;
  const inheritedPaint = cardBar?.paint;
  const paint = normalizePaintOpacity({
    ...(isPaintObject(inheritedPaint) ? inheritedPaint : {}),
    ...(isPaintObject(local.paint) ? local.paint : {}),
    ...Object.fromEntries(Object.keys(barPaintAliases).map(key => [key, normalizedBar[key]])),
    opacity: localOpacity ? local.paint.opacity : inheritedPaint?.opacity,
  });
  if (!localOpacity && hasOwnConfigValue(inheritedPaint, INVALID_PAINT_OPACITY)) {
    Object.defineProperty(paint, INVALID_PAINT_OPACITY, { value: inheritedPaint[INVALID_PAINT_OPACITY] });
  }
  if (localOpacity && hasOwnConfigValue(paint, INVALID_PAINT_OPACITY)) {
    local.diagnostics.push({ kind: 'invalid', property: 'opacity', input: paint[INVALID_PAINT_OPACITY] });
  }
  let sourceConfig = authored;
  for (const issue of local.diagnostics) {
    if (issue.kind === 'invalid' && issue.property !== null) sourceConfig = validPaintFallbacks(sourceConfig, issue.property);
  }
  Object.defineProperty(paint, PAINT_PROPERTY_SOURCES, { value: paintPropertySources(sourceConfig, local.overrides, local.paint) });
  normalizedBar.paint = paint;
  if (local.diagnostics.length) Object.defineProperty(normalizedBar, BAR_PAINT_DIAGNOSTICS, { value: local.diagnostics });
  return normalizedBar;
}

export function clampSupportedRowHeight(height) {
  return Math.max(24, height);
}

export function normalizeLabelPosition(position, fallback = 'left') {
  const normalized = typeof position === 'string' ? position.trim().toLowerCase() : '';
  return ['left', 'above', 'inside', 'off', 'hero'].includes(normalized)
    ? normalized
    : fallback;
}

export function normalizeHeroSize(size, fallback = 'medium') {
  const normalized = typeof size === 'string' ? size.trim().toLowerCase() : '';
  return ['small', 'medium', 'large'].includes(normalized)
    ? normalized
    : fallback;
}

export function normalizeHeroFontSize(value) {
  if (!Number.isFinite(value)) return null;
  return Math.min(112, Math.max(12, value));
}

export function normalizeLayoutConfig(entityConfig, cardConfig) {
  const cardLayout = cardConfig?.layout;
  const entityLayout = entityConfig?.layout;
  const entityLabel = entityLayout?.label;
  const entityHero = entityLayout?.hero;
  const cardLabel = cardLayout?.label;
  const cardHero = cardLayout?.hero;
  const isCardLevelNormalization = !cardConfig;
  const rawHeight = entityLayout?.height ?? entityConfig.height ?? cardLayout?.height ?? cardConfig?.height ?? 38;
  const heightExplicit =
    entityLayout?.height !== undefined
    || entityConfig._height_explicit === true
    || (!isCardLevelNormalization && entityConfig.height !== undefined)
    || cardLayout?.height_explicit === true
    || cardConfig?._height_explicit === true;
  const labelPosition = normalizeLabelPosition(
    entityLabel?.position ?? entityConfig.label_position ?? cardLabel?.position ?? cardLayout?.label_position ?? cardConfig?.label_position,
    'left'
  );
  const heroFontSize = labelPosition === 'hero'
    ? normalizeHeroFontSize(entityHero?.value_size ?? cardHero?.value_size)
    : null;
  return {
    label: {
      position: labelPosition,
      width: entityLabel?.width ?? entityConfig.label_width ?? cardLabel?.width ?? cardLayout?.label_width ?? cardConfig?.label_width ?? 100,
    },
    hero: {
      size: normalizeHeroSize(
        entityHero?.size ?? entityLabel?.hero_size ?? entityLabel?.heroSize ?? entityConfig.hero_size ?? entityConfig.heroSize ?? cardHero?.size ?? cardLabel?.hero_size ?? cardLabel?.heroSize ?? cardLayout?.hero_size ?? cardLayout?.heroSize ?? cardConfig?.hero_size ?? cardConfig?.heroSize,
        'medium'
      ),
      value_size: heroFontSize,
    },
    height: clampSupportedRowHeight(rawHeight),
    height_explicit: heightExplicit,
  };
}

export function normalizeFormattingConfig(entityConfig, cardConfig) {
  const cardFormatting = cardConfig?.formatting;
  const entityFormatting = entityConfig?.formatting;
  return {
    decimal: entityFormatting?.decimal ?? entityConfig.decimal ?? cardFormatting?.decimal ?? cardConfig?.decimal ?? null,
    unit: entityFormatting?.unit ?? entityConfig.unit ?? cardFormatting?.unit ?? cardConfig?.unit ?? null,
  };
}

export function normalizeTargetMarkerShape(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'triangle' || normalized === 'diamond' ? normalized : 'diamond';
}

export function normalizeMarkerDirection(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'outward' ? 'outward' : 'inward';
}

function normalizeMarkerLabelConfig(rawLabel, inherited = {}) {
  const label = rawLabel && typeof rawLabel === 'object' && !Array.isArray(rawLabel) ? rawLabel : {};
  const hasText = Object.prototype.hasOwnProperty.call(label, 'text');
  const textValue = hasText
    ? (typeof label.text === 'string' ? label.text.replace(/\s+/g, ' ').trim() : inherited.label_text)
    : inherited.label_text;
  const hasPrecision = Object.prototype.hasOwnProperty.call(label, 'precision');
  const hasDecimal = Object.prototype.hasOwnProperty.call(label, 'decimal');
  const precisionValue = hasPrecision ? label.precision : label.decimal;
  const precisionSet = hasPrecision || hasDecimal;
  const precision = precisionSet ? getFiniteNumber(precisionValue) : inherited.label_precision ?? null;
  const precisionInvalid = precisionSet && precisionValue !== null && precisionValue !== ''
    && !(Number.isInteger(precision) && precision >= 0);

  return {
    label_text: textValue ?? null,
    label_show_value: typeof label.show_value === 'boolean' ? label.show_value : inherited.label_show_value ?? true,
    label_show_unit: typeof label.show_unit === 'boolean' ? label.show_unit : inherited.label_show_unit ?? true,
    label_precision: precisionInvalid ? null : precision,
    label_invalid_show: label.show !== undefined && typeof label.show !== 'boolean',
    label_invalid_text: hasText && typeof label.text !== 'string',
    label_invalid_show_value: label.show_value !== undefined && typeof label.show_value !== 'boolean',
    label_invalid_show_unit: label.show_unit !== undefined && typeof label.show_unit !== 'boolean',
    label_invalid_precision: precisionInvalid,
    label_precision_key: precisionInvalid ? (hasPrecision ? 'precision' : 'decimal') : undefined,
    label_unsupported_unit: Object.prototype.hasOwnProperty.call(label, 'unit'),
  };
}

function builtinMarkerLabelFields(options) {
  const fields = {};
  if (options.label_text !== null && options.label_text !== undefined) fields.label_text = options.label_text;
  if (options.label_show_value === false) fields.label_show_value = false;
  if (options.label_show_unit === false) fields.label_show_unit = false;
  if (options.label_precision !== null && options.label_precision !== undefined) fields.label_precision = options.label_precision;
  if (options.label_invalid_text) fields.label_invalid_text = true;
  if (options.label_invalid_show_value) fields.label_invalid_show_value = true;
  if (options.label_invalid_show_unit) fields.label_invalid_show_unit = true;
  if (options.label_invalid_show) fields.label_invalid_show = true;
  if (options.label_invalid_precision) fields.label_invalid_precision = true;
  if (options.label_invalid_precision && options.label_precision_key) fields.label_precision_key = options.label_precision_key;
  if (options.label_unsupported_unit) fields.label_unsupported_unit = true;
  return fields;
}

function isInvalidMarkerDirection(value) {
  return value !== undefined && !['inward', 'outward'].includes(
    typeof value === 'string' ? value.trim().toLowerCase() : ''
  );
}

export function getAuthoredSharedTargetSource(config) {
  const raw = config?.target;
  if (raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'at')) {
    return normalizeStructuredResolvableValue(raw.at, null, null, { allowPercent: true });
  }
  if (raw !== undefined && raw !== null && typeof raw !== 'object' || config?.target_entity !== undefined) {
    return normalizeResolvableValue(typeof raw === 'object' ? null : raw, config?.target_entity);
  }
  return undefined;
}

export function normalizeTargetMarkerConfig(entityConfig, cardConfig) {
  const cardTarget = cardConfig?.target_marker;
  const rawTarget = entityConfig?.target;
  const legacyCardTarget = cardConfig?.target && typeof cardConfig.target === 'object' && !Array.isArray(cardConfig.target)
    ? null
    : cardConfig?.target ?? null;
  const inheritedTarget = cardTarget ? {
    ...cardTarget,
    shape: normalizeTargetMarkerShape(cardTarget.shape),
    direction: normalizeMarkerDirection(cardTarget.direction),
  } : {
    enabled: null,
    source: normalizeResolvableValue(null, null),
    color: cardConfig?.target_color ?? '#888',
    show_label: cardConfig?.show_target_label ?? false,
    ...builtinMarkerLabelFields(normalizeMarkerLabelConfig(cardConfig?.target?.label)),
    label_decimal: cardConfig?.target?.label?.precision ?? cardConfig?.target?.label?.decimal ?? null,
    shape: 'diamond',
    direction: 'inward',
  };

  if (rawTarget && typeof rawTarget === 'object' && !Array.isArray(rawTarget)) {
    const labelOptions = normalizeMarkerLabelConfig(rawTarget.label, inheritedTarget);
    const normalizedTarget = {
      enabled: normalizeOptionalEnabled(rawTarget.enabled) ?? inheritedTarget.enabled ?? null,
      source: normalizeStructuredResolvableValue(rawTarget.at, rawTarget.at === undefined ? inheritedTarget.source : null, null, { allowPercent: true }),
      color: rawTarget.color ?? entityConfig.target_color ?? inheritedTarget.color,
      show_label: rawTarget.label?.show ?? entityConfig.show_target_label ?? inheritedTarget.show_label,
      shape: Object.prototype.hasOwnProperty.call(rawTarget, 'shape')
        ? normalizeTargetMarkerShape(rawTarget.shape)
        : inheritedTarget.shape,
      direction: Object.prototype.hasOwnProperty.call(rawTarget, 'direction')
        ? normalizeMarkerDirection(rawTarget.direction)
        : inheritedTarget.direction,
      ...(isInvalidMarkerDirection(rawTarget.direction) ? { direction_invalid: true } : {}),
      ...builtinMarkerLabelFields(labelOptions),
    };
    const labelDecimal = labelOptions.label_precision;
    if (labelDecimal !== null && labelDecimal !== undefined) {
      normalizedTarget.label_decimal = labelDecimal;
      normalizedTarget.label_precision = labelDecimal;
    }
    return normalizedTarget;
  }

  const value = entityConfig.target ?? inheritedTarget.source?.fixed ?? inheritedTarget.source?.value ?? legacyCardTarget;
  const entity = entityConfig.target_entity ?? inheritedTarget.source?.entity ?? cardConfig?.target_entity ?? null;
  const percent = entityConfig.target === undefined && entityConfig.target_entity === undefined
    ? inheritedTarget.source?.percent ?? null
    : null;
  const attribute = entityConfig.target === undefined && entityConfig.target_entity === undefined
    ? inheritedTarget.source?.attribute ?? null
    : null;
  const normalizedTarget = {
    enabled: inheritedTarget.enabled ?? null,
    source: normalizeResolvableValue(value, entity, percent, attribute),
    color: entityConfig.target_color ?? inheritedTarget.color ?? cardConfig?.target_color ?? '#888',
    show_label: entityConfig.show_target_label ?? inheritedTarget.show_label ?? cardConfig?.show_target_label ?? false,
    shape: inheritedTarget.shape,
    direction: inheritedTarget.direction,
    ...builtinMarkerLabelFields(inheritedTarget),
  };
  const labelDecimal = normalizedTarget.label_precision;
  if (labelDecimal !== null && labelDecimal !== undefined) {
    normalizedTarget.label_decimal = labelDecimal;
  }
  return normalizedTarget;
}

/** Select whole sources before resolution. Marker properties inherit independently
 * through Card shared/directional, Entity shared/directional defaults. */
export function normalizeDirectionalTargets(config, parent = null) {
  const inherited = parent?._normalized ? parent.target_directions
    : parent ? normalizeDirectionalTargets(parent) : null;
  const sharedSource = getAuthoredSharedTargetSource(config);
  const raw = config?.target;
  const hasShared = sharedSource !== undefined;
  const result = {};
  for (const side of ['above', 'below']) {
    const direction = raw?.[`when_${side}`];
    const hasDirectional = direction && Object.prototype.hasOwnProperty.call(direction, 'at');
    const source = hasDirectional
      ? normalizeStructuredResolvableValue(direction.at, null, null, { allowPercent: true })
      : hasShared ? sharedSource : inherited?.[side]?.source ?? normalizeResolvableValue(null, null);
    let marker = inherited?.[side]?.marker ?? normalizeTargetMarkerConfig({}, null);
    marker = normalizeTargetMarkerConfig(config, { target_marker: marker });
    marker = normalizeTargetMarkerConfig({ target: direction?.marker ?? {} }, { target_marker: marker });
    delete marker.source;
    const sourcePath = hasDirectional ? `target.when_${side}.at`
      : hasShared ? 'target.at' : inherited?.[side]?.sourcePath ?? 'target.at';
    result[side] = { source, marker, sourcePath,
      sourceScope: hasDirectional || hasShared ? 'local' : inherited ? 'inherited' : 'default' };
  }
  return result;
}

function getRawExtremumConfig(config, key) {
  const value = config?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function normalizeLabelConfig(rawConfig, inheritedConfig) {
  const rawLabel = rawConfig?.label;
  const hasRawLabel = rawLabel && typeof rawLabel === 'object' && !Array.isArray(rawLabel);
  const options = normalizeMarkerLabelConfig(rawLabel, inheritedConfig);
  return {
    show: hasRawLabel && typeof rawLabel.show === 'boolean'
      ? rawLabel.show
      : inheritedConfig.show_label ?? false,
    text: options.label_text,
    invalidShow: options.label_invalid_show,
    showValue: options.label_show_value,
    showUnit: options.label_show_unit,
    precision: options.label_invalid_precision ? null : options.label_precision ?? inheritedConfig.label_decimal ?? null,
    invalidText: options.label_invalid_text,
    invalidShowValue: options.label_invalid_show_value,
    invalidShowUnit: options.label_invalid_show_unit,
    invalidPrecision: options.label_invalid_precision,
    precisionKey: options.label_precision_key,
    unsupportedUnit: options.label_unsupported_unit,
  };
}

function normalizeExtremumMarkerConfig(entityConfig, cardConfig, key, options = {}) {
  const { legacy = false, defaultColor = '#888888' } = options;
  const cardMarker = cardConfig?.[`${key}_marker`];
  const rawMarker = getRawExtremumConfig(entityConfig, key);
  const inherited = cardMarker ?? {
    show: legacy ? cardConfig?.show_peak ?? false : false,
    color: legacy ? cardConfig?.peak_color ?? defaultColor : defaultColor,
    show_label: false,
    label_decimal: null,
    label_text: null,
    label_show_value: true,
    label_show_unit: true,
    label_precision: null,
    window: 'today', window_spec: parseHistoricalWindow('today'),
    direction: 'inward',
  };
  const hasReset = rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, 'reset');
  const hasWindow = rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, 'window');
  const hasWindowEntity = rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, 'window_entity');
  const rawWindow = hasWindow ? rawMarker.window : hasReset ? rawMarker.reset : inherited.window ?? 'today';
  const normalizedWindow = !hasWindow && hasReset && typeof rawWindow === 'string' && rawWindow.trim().toLowerCase() === 'never'
    ? 'today' : typeof rawWindow === 'string' ? rawWindow.trim().toLowerCase() : rawWindow;
  const window = canonicalizeHistoricalWindow(normalizedWindow);
  const windowSpec = isEligibleHistoricalWindow(window) ? parseHistoricalWindow(window) : null;
  const legacyInvalid = !hasWindow && hasReset && !windowSpec;
  const windowEntityInput = hasWindowEntity ? rawMarker.window_entity : inherited.window_entity;
  const windowEntity = normalizeWindowEntity(windowEntityInput);
  const rawLabel = rawMarker?.label;
  const label = normalizeLabelConfig(rawMarker, inherited);
  const normalized = {
    show: rawMarker?.enabled
      ?? (legacy ? entityConfig.show_peak : undefined)
      ?? inherited.show
      ?? false,
    color: rawMarker?.color
      ?? (legacy ? entityConfig.peak_color : undefined)
      ?? inherited.color
      ?? defaultColor,
    direction: rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, 'direction')
      ? normalizeMarkerDirection(rawMarker.direction)
      : normalizeMarkerDirection(inherited.direction),
    ...(isInvalidMarkerDirection(rawMarker?.direction) ? { direction_invalid: true } : {}),
    window, window_spec: windowSpec,
    ...(windowEntity.entity ? { window_entity: windowEntity.entity }
      : hasWindowEntity || inherited.window_entity_invalid ? { window_entity: null } : {}),
    ...(windowEntity.invalid || (!hasWindowEntity && inherited.window_entity_invalid) ? { window_entity_invalid: true } : {}),
    ...(!windowSpec || (!hasWindow && !hasReset && inherited.window_invalid) ? { window_invalid: true } : {}),
    ...(legacyInvalid ? { window_invalid_source: 'reset' } : {}),
  };
  const inheritedAdvanced = cardMarker && (
    Object.prototype.hasOwnProperty.call(cardMarker, 'show_label')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_decimal')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_text')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_show_value')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_show_unit')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_precision')
  );
  const hasAdvancedConfig = key === 'floor'
    || hasReset
    || hasWindow
    || hasWindowEntity
    || !!windowEntity.entity
    || rawLabel !== undefined
    || inheritedAdvanced;

  if (hasAdvancedConfig) {
    normalized.show_label = label.show;
    normalized.label_decimal = label.precision;
  }
  Object.assign(normalized, builtinMarkerLabelFields({
    label_text: label.text,
    label_show_value: label.showValue === true ? undefined : label.showValue,
    label_show_unit: label.showUnit === true ? undefined : label.showUnit,
    label_precision: label.precision,
    label_invalid_text: label.invalidText,
    label_invalid_show: label.invalidShow,
    label_invalid_show_value: label.invalidShowValue,
    label_invalid_show_unit: label.invalidShowUnit,
    label_invalid_precision: label.invalidPrecision,
    label_precision_key: label.precisionKey,
    label_unsupported_unit: label.unsupportedUnit,
  }));
  return normalized;
}

export function normalizePeakMarkerConfig(entityConfig, cardConfig) {
  return normalizeExtremumMarkerConfig(entityConfig, cardConfig, 'peak', { legacy: true, defaultColor: '#888888' });
}

export function normalizeFloorMarkerConfig(entityConfig, cardConfig) {
  return normalizeExtremumMarkerConfig(entityConfig, cardConfig, 'floor', { defaultColor: '#888888' });
}

function normalizeLegacyMarkerFields(config) {
  for (const key of ['peak', 'floor']) {
    if (!config[key] || typeof config[key] !== 'object' || Array.isArray(config[key])) continue;
    const { reset, ...marker } = config[key];
    config[key] = { ...marker, window: config[`${key}_marker`].window };
  }
}

export function normalizeEntityConfig(entityConfig, cardConfig) {
  const normalizedEntity = {
    ...entityConfig,
    _normalized: true,
    entity: entityConfig.entity,
    name: entityConfig.name ?? null,
    icon: entityConfig.icon,
  };
  recordUnsupportedExtremaAliases(normalizedEntity, entityConfig);

  if (entityConfig.attribute !== undefined) {
    const attribute = normalizeAttribute(entityConfig.attribute);
    if (attribute !== null) normalizedEntity.attribute = attribute;
    else delete normalizedEntity.attribute;
    if (hasInvalidAttribute(entityConfig.attribute)) normalizedEntity.attribute_invalid = true;
    else delete normalizedEntity.attribute_invalid;
  }

  normalizedEntity.layout = normalizeLayoutConfig(entityConfig, cardConfig);
  normalizedEntity.scale = normalizeScaleConfig(entityConfig, cardConfig);
  normalizedEntity.bar = normalizeBarConfig(entityConfig, cardConfig, {
    scopeExplicitness: getPaintExplicitness(entityConfig),
    inheritedExplicitness: cardConfig?.[PAINT_EXPLICITNESS] ?? getPaintExplicitness(cardConfig),
    isCardScope: false,
  });
  normalizedEntity.baseline = normalizeBaselineConfig(entityConfig, cardConfig);
  normalizedEntity.formatting = normalizeFormattingConfig(entityConfig, cardConfig);
  normalizedEntity.target_marker = normalizeTargetMarkerConfig(entityConfig, cardConfig);
  normalizedEntity.target_directions = normalizeDirectionalTargets(entityConfig, cardConfig);
  normalizedEntity.target_above = normalizeTargetAboveConfig(entityConfig, cardConfig);
  normalizedEntity.target_below = normalizeTargetBelowConfig(entityConfig, cardConfig);
  normalizedEntity.peak_marker = normalizePeakMarkerConfig(entityConfig, cardConfig);
  normalizedEntity.floor_marker = normalizeFloorMarkerConfig(entityConfig, cardConfig);
  normalizeLegacyMarkerFields(normalizedEntity);
  const normalizedMarkers = entityConfig.markers === undefined
    ? {
      markers: applyGenericMarkerCapacity(cardConfig?.generic_markers ?? [], normalizedEntity),
      invalidList: cardConfig?.generic_markers_invalid === true,
    }
    : normalizeGenericMarkerList(entityConfig.markers, normalizedEntity);
  normalizedEntity.generic_markers = normalizedMarkers.markers;
  normalizedEntity.generic_markers_invalid = normalizedMarkers.invalidList;

  normalizedEntity.min = normalizedEntity.scale.min.fixed;
  normalizedEntity.min_entity = normalizedEntity.scale.min.entity;
  normalizedEntity.max = normalizedEntity.scale.max.fixed;
  normalizedEntity.max_entity = normalizedEntity.scale.max.entity;
  normalizedEntity.height = normalizedEntity.layout.height;
  normalizedEntity.label_position = normalizedEntity.layout.label.position;
  normalizedEntity.label_width = normalizedEntity.layout.label.width;
  normalizedEntity.color_mode = normalizedEntity.bar.color_mode;
  normalizedEntity.fill_style = normalizedEntity.bar.fill_style;
  normalizedEntity.solid_fill = normalizedEntity.bar.solid_fill;
  normalizedEntity.color = normalizedEntity.bar.color;
  normalizedEntity.gradient_stops = normalizedEntity.bar.gradient_stops;
  normalizedEntity.severity = normalizedEntity.bar.severity;
  normalizedEntity.animated = normalizedEntity.bar.animated;
  normalizedEntity.above_target_color = normalizedEntity.bar.above_target_color;
  normalizedEntity.decimal = normalizedEntity.formatting.decimal;
  normalizedEntity.unit = normalizedEntity.formatting.unit;
  normalizedEntity.target = normalizedEntity.target_marker.source.fixed;
  normalizedEntity.target_entity = normalizedEntity.target_marker.source.entity;
  normalizedEntity.target_color = normalizedEntity.target_marker.color;
  normalizedEntity.show_target_label = normalizedEntity.target_marker.show_label;
  normalizedEntity.show_peak = normalizedEntity.peak_marker.show;
  normalizedEntity.peak_color = normalizedEntity.peak_marker.color;

  return normalizedEntity;
}

export function normalizeCardConfig(rawConfig) {
  const cardPaintExplicitness = getPaintExplicitness(rawConfig);
  const baseConfig = {
    title: '',
    label_position: 'left',
    color_mode: 'severity',
    color: '#4a9eff',
    animated: true,
    show_peak: false,
    peak_color: '#888888',
    target: null,
    target_entity: null,
    target_color: '#888',
    show_target_label: false,
    above_target_color: null,
    baseline: null,
    decimal: null,
    gradient_stops: null,
    min: 0,
    min_entity: null,
    max: 100,
    max_entity: null,
    height: 38,
    label_width: 100,
    severity: [
      { from: 0, to: 33, color: '#4CAF50' },
      { from: 33, to: 75, color: '#FF9800' },
      { from: 75, to: 100, color: '#F44336' },
    ],
    ...rawConfig,
  };
  baseConfig._height_explicit = rawConfig?.layout?.height !== undefined || rawConfig?.height !== undefined;

  if (baseConfig.entity && !baseConfig.entities) {
    baseConfig.entities = [{
      entity: baseConfig.entity,
      ...(baseConfig.attribute !== undefined ? { attribute: baseConfig.attribute } : {}),
      ...(baseConfig.name !== undefined ? { name: baseConfig.name } : {}),
    }];
  }
  baseConfig.entities = baseConfig.entities.map((e) =>
    typeof e === 'string' ? { entity: e } : e
  );

  const normalizedCard = {
    ...baseConfig,
    _normalized: true,
  };
  recordUnsupportedExtremaAliases(normalizedCard, rawConfig);
  Object.defineProperty(normalizedCard, PAINT_EXPLICITNESS, {
    value: cardPaintExplicitness,
    enumerable: false,
  });

  normalizedCard.layout = normalizeLayoutConfig(baseConfig, null);
  normalizedCard.scale = normalizeScaleConfig(rawConfig, null);
  normalizedCard.bar = normalizeBarConfig(baseConfig, null, {
    rawConfig,
    scopeExplicitness: cardPaintExplicitness,
    inheritedExplicitness: null,
    isCardScope: true,
  });
  normalizedCard.baseline = normalizeBaselineConfig(baseConfig, null);
  normalizedCard.formatting = normalizeFormattingConfig(baseConfig, null);
  normalizedCard.target_marker = normalizeTargetMarkerConfig(baseConfig, null);
  normalizedCard.target_directions = normalizeDirectionalTargets(rawConfig, null);
  normalizedCard.target_above = normalizeTargetAboveConfig(baseConfig);
  normalizedCard.target_below = normalizeTargetBelowConfig(baseConfig);
  normalizedCard.peak_marker = normalizePeakMarkerConfig(baseConfig, null);
  normalizedCard.floor_marker = normalizeFloorMarkerConfig(baseConfig, null);
  normalizeLegacyMarkerFields(normalizedCard);
  const normalizedMarkers = normalizeGenericMarkerList(baseConfig.markers, normalizedCard);
  normalizedCard.generic_markers = normalizedMarkers.markers;
  normalizedCard.generic_markers_invalid = normalizedMarkers.invalidList;
  normalizedCard.entities = baseConfig.entities.map((entityCfg) =>
    normalizeEntityConfig(entityCfg, normalizedCard)
  );

  return normalizedCard;
}
