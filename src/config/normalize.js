import { isValidReset, normalizeReset } from '../utils/extrema.js';

export function normalizeResolvableValue(value, entityValue, percentValue = null) {
  const normalized = {
    fixed: value ?? null,
    entity: entityValue ?? null,
  };
  if (Number.isFinite(percentValue)) {
    normalized.percent = percentValue;
  }
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
    const entity = input.entity ?? null;
    const percent = allowPercent ? getFiniteNumber(input.percent) : null;
    return normalizeResolvableValue(value, entity, percent);
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

function hasConfiguredMarkerSource(source) {
  return !!source && (
    getFiniteNumber(source.fixed ?? source.value) !== null
    || Number.isFinite(source.percent)
    || !!source.entity
  );
}

function applyGenericMarkerCapacity(markers, config) {
  const occupied = {
    above: config?.peak_marker?.show === true ? 1 : 0,
    below: (config?.floor_marker?.show === true ? 1 : 0)
      + (config?.target_marker?.enabled !== false && hasConfiguredMarkerSource(config?.target_marker?.source) ? 1 : 0),
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
    const hasUnsupportedPercentField = rawAt && typeof rawAt === 'object'
      && Object.prototype.hasOwnProperty.call(rawAt, 'percent');
    const atInput = typeof rawAt === 'string' ? rawAt.trim() : rawAt;
    const source = normalizeStructuredResolvableValue(atInput, null, null, { allowPercent: true });
    const explicitEntity = rawAt && typeof rawAt === 'object' && rawAt.entity !== undefined
      ? rawAt.entity
      : (typeof atInput === 'string' && looksLikeEntityId(atInput) ? atInput : null);
    const invalidEntity = explicitEntity !== null && explicitEntity !== undefined && explicitEntity !== ''
      && !looksLikeEntityId(explicitEntity);
    const invalidFixed = rawAt && typeof rawAt === 'object'
      && rawAt.fixed !== undefined && rawAt.fixed !== null
      && getFiniteNumber(rawAt.fixed) === null;
    const hasSource = !!source.entity
      || getFiniteNumber(source.fixed) !== null
      || Number.isFinite(source.percent);
    const invalidPercentage = Number.isFinite(source.percent)
      && (source.percent < 0 || source.percent > 100);
    const validSource = rawAt !== undefined && rawAt !== null
      && !hasUnsupportedPercentField
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
    const labelEntity = typeof labelEntityInput === 'string' ? labelEntityInput.trim() : '';
    const invalidLabelEntity = labelEntityInput !== undefined && labelEntityInput !== null && labelEntityInput !== ''
      && !looksLikeEntityId(labelEntity);
    const validLabelEntity = labelEntity && looksLikeEntityId(labelEntity) ? labelEntity : null;
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
      unsupportedPercentField: hasUnsupportedPercentField,
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
  if (typeof input === 'object' && !Array.isArray(input)) {
    return {
      color: input.color ?? null,
    };
  }
  return {
    color: input,
  };
}

export function normalizeOptionalEnabled(value) {
  return value === true ? true : value === false ? false : null;
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
    ? normalizeResolvableValue(
      cardBound.fixed ?? cardBound.value ?? null,
      cardBound.entity ?? null
    )
    : normalizeResolvableValue(
      cardConfig?.[key] ?? defaultValue,
      cardConfig?.[entityKey] ?? null
    );

  if (entityScale?.[key] !== undefined) {
    return normalizeStructuredResolvableValue(
      entityScale[key],
      inherited,
      defaultValue
    );
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

  return normalizeResolvableValue(value, entity);
}

export function normalizeScaleConfig(entityConfig, cardConfig) {
  return {
    min: normalizeScaleBound(entityConfig, cardConfig, 'min', 0),
    max: normalizeScaleBound(entityConfig, cardConfig, 'max', 100),
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

function getPaintExplicitness(config) {
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
  const cardBar = cardConfig?.bar;
  const entityBar = entityConfig?.bar;
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
    segment_space = entityBar?.segment_space === 'percent' || entityBar?.segment_space === 'scale'
      ? entityBar.segment_space
      : segment_space;
    segments = normalizeGaugeSegments(entityStructuredSegments, { legacySegmentSpace: segment_space });
  } else if (entityTopLevelSegments !== undefined && entityTopLevelSegments !== null) {
    segments = normalizeGaugeSegments(entityTopLevelSegments);
  } else if (entityLegacySeverity !== undefined && entityLegacySeverity !== null) {
    segments = normalizeSeverityToSegments(entityLegacySeverity);
    segment_space = 'percent';
  } else if (cardStructuredSegments !== null && cardStructuredSegments !== undefined) {
    segments = cardStructuredSegments.map((segment) => ({ ...segment }));
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

  return {
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
      source: normalizeStructuredResolvableValue(rawTarget.at, inheritedTarget.source, null, { allowPercent: true }),
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
  const normalizedTarget = {
    enabled: inheritedTarget.enabled ?? null,
    source: normalizeResolvableValue(value, entity, percent),
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

function getRawExtremumConfig(config, key) {
  const value = config?.[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  const markerValue = config?.[`${key}_marker`];
  return markerValue && typeof markerValue === 'object' && !Array.isArray(markerValue)
    ? markerValue
    : null;
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
    reset: { kind: 'never' },
    direction: 'inward',
  };
  const hasReset = rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, 'reset');
  const rawReset = hasReset ? rawMarker.reset : undefined;
  const reset = hasReset ? normalizeReset(rawReset) : (inherited.reset ?? { kind: 'never' });
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
  };
  const inheritedAdvanced = cardMarker && (
    Object.prototype.hasOwnProperty.call(cardMarker, 'show_label')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_decimal')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_text')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_show_value')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_show_unit')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'label_precision')
    || Object.prototype.hasOwnProperty.call(cardMarker, 'reset')
  );
  const hasAdvancedConfig = key === 'floor'
    || hasReset
    || rawLabel !== undefined
    || inheritedAdvanced;

  if (hasAdvancedConfig) {
    normalized.show_label = label.show;
    normalized.label_decimal = label.precision;
    normalized.reset = reset;
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
  if (hasReset && !isValidReset(rawReset)) {
    normalized.reset_invalid = true;
  }
  return normalized;
}

export function normalizePeakMarkerConfig(entityConfig, cardConfig) {
  return normalizeExtremumMarkerConfig(entityConfig, cardConfig, 'peak', { legacy: true, defaultColor: '#888888' });
}

export function normalizeFloorMarkerConfig(entityConfig, cardConfig) {
  return normalizeExtremumMarkerConfig(entityConfig, cardConfig, 'floor', { defaultColor: '#888888' });
}

export function normalizeEntityConfig(entityConfig, cardConfig) {
  const normalizedEntity = {
    ...entityConfig,
    _normalized: true,
    entity: entityConfig.entity,
    name: entityConfig.name ?? null,
    icon: entityConfig.icon,
  };

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
  normalizedEntity.peak_marker = normalizePeakMarkerConfig(entityConfig, cardConfig);
  normalizedEntity.floor_marker = normalizeFloorMarkerConfig(entityConfig, cardConfig);
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
  Object.defineProperty(normalizedCard, PAINT_EXPLICITNESS, {
    value: cardPaintExplicitness,
    enumerable: false,
  });

  normalizedCard.layout = normalizeLayoutConfig(baseConfig, null);
  normalizedCard.scale = normalizeScaleConfig(baseConfig, null);
  normalizedCard.bar = normalizeBarConfig(baseConfig, null, {
    scopeExplicitness: cardPaintExplicitness,
    inheritedExplicitness: null,
    isCardScope: true,
  });
  normalizedCard.baseline = normalizeBaselineConfig(baseConfig, null);
  normalizedCard.formatting = normalizeFormattingConfig(baseConfig, null);
  normalizedCard.target_marker = normalizeTargetMarkerConfig(baseConfig, null);
  normalizedCard.peak_marker = normalizePeakMarkerConfig(baseConfig, null);
  normalizedCard.floor_marker = normalizeFloorMarkerConfig(baseConfig, null);
  const normalizedMarkers = normalizeGenericMarkerList(baseConfig.markers, normalizedCard);
  normalizedCard.generic_markers = normalizedMarkers.markers;
  normalizedCard.generic_markers_invalid = normalizedMarkers.invalidList;
  normalizedCard.entities = baseConfig.entities.map((entityCfg) =>
    normalizeEntityConfig(entityCfg, normalizedCard)
  );

  return normalizedCard;
}
