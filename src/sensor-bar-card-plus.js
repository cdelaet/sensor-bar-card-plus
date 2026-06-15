/**
 * sensor-bar-card-plus - A polished, configurable sensor bar card for Home Assistant
 *
 * Works great for: power, temperature, humidity, water flow, battery, CO2, and more.
 *
 * Installation:
 *   1. Copy this file to your HA config /www/ folder
 *   2. Add resource in Lovelace: /local/sensor-bar-card-plus.js (type: module)
 *   3. Restart or refresh browser
 *
 * ─── Global config options (all can be overridden per entity) ───────────────
 *
 *   type: custom:sensor-bar-card-plus
 *   title: My Sensors             # optional card title
 *   label_position: left          # left | above | inside | off
 *   color_mode: gradient          # gradient | severity | severity_gradient | single
 *   color: '#4a9eff'              # bar colour when color_mode is 'single'
 *   animated: true                # smooth bar fill transition on value change
 *   show_peak: true               # show peak marker (highest value seen this session)
 *   peak_color: '#888'             # colour of the peak marker (default grey)
 *   target: 2400                   # optional fixed target marker (absolute value, same scale as min/max)
 *   target_entity: sensor.my_target_sensor   # optional entity providing the target marker value
 *   target_color: '#4a9eff'        # colour of the target marker (default grey)
 *   above_target_color: '#F44336' # optional color for filled bar section beyond the target
 *   baseline: 0                    # optional neutral point for bidirectional fill
 *   baseline:
 *     at: sensor.my_baseline_sensor
 *     above: '#34d399'
 *     below: '#ef4444'
 *   decimal: 1                     # decimal places for displayed value (null = use raw value)
 *   min: 0                        # minimum value
 *   min_entity: sensor.my_min_sensor         # optional entity providing the minimum value
 *   max: 100                      # maximum value
 *   max_entity: sensor.my_max_sensor         # optional entity providing the maximum value
 *   height: 38                    # bar height in px
 *   unit: W                       # override unit of measurement
 *   severity:                     # colour bands, used when color_mode is 'severity'
 *     - from: 0
 *       to: 33
 *       color: '#4CAF50'
 *     - from: 33
 *       to: 75
 *       color: '#FF9800'
 *     - from: 75
 *       to: 100
 *       color: '#F44336'
 *
 * ─── Entity config (inherits globals, override any per entity) ──────────────
 *
 *   entities:
 *     - entity: sensor.my_sensor
 *       name: My Sensor           # display name
 *       icon: mdi:thermometer     # any mdi icon
 *       min: 0
 *       min_entity: sensor.my_min_sensor
 *       max: 100
 *       max_entity: sensor.my_max_sensor
 *       target_entity: sensor.my_target_sensor
 *       unit: °C
 *       height: 38
 *       label_position: left
 *       color_mode: gradient
 *       color: '#4a9eff'
 *       above_target_color: '#F44336'
 *       animated: true
 *       show_peak: true
 *       severity:
 *         - from: 0
 *           to: 50
 *           color: blue
 *
 * ─── Example configs ────────────────────────────────────────────────────────
 *
 *  Power monitoring:
 *   type: custom:sensor-bar-card-plus
 *   title: Power Usage
 *   color_mode: gradient
 *   entities:
 *     - entity: sensor.kettle_power
 *       name: Kettle
 *       icon: mdi:kettle
 *       max: 3000
 *
 *  Dynamic scaling from sensors:
 *   type: custom:sensor-bar-card-plus
 *   title: Grid Peak Monitoring
 *   entities:
 *     - entity: sensor.grid_projected_peak_power
 *       name: Projected Peak
 *       min: 0
 *       max_entity: sensor.grid_peak_limit
 *       target_entity: sensor.grid_peak_warning
 *       above_target_color: '#FF66AA'
 *
 *  Temperature:
 *   type: custom:sensor-bar-card-plus
 *   title: Temperatures
 *   color_mode: severity
 *   severity:
 *     - from: 0
 *       to: 18
 *       color: '#4a9eff'
 *     - from: 18
 *       to: 24
 *       color: '#4CAF50'
 *     - from: 24
 *       to: 40
 *       color: '#F44336'
 *   entities:
 *     - entity: sensor.living_room_temperature
 *       name: Living Room
 *       icon: mdi:sofa
 *       min: 0
 *       max: 40
 *
 *  Humidity:
 *   type: custom:sensor-bar-card-plus
 *   title: Humidity
 *   color_mode: single
 *   color: '#4a9eff'
 *   entities:
 *     - entity: sensor.bathroom_humidity
 *       name: Bathroom
 *       icon: mdi:water-percent
 *       max: 100
 */

class SensorBarCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('sensor-bar-card-plus-editor');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._baseDomReady = false;
    this._config = {};
    this._hass = null;
    this._peaks = {};
    this._rendered = false;
    this._resizeObserver = null;
    this._densityPassScheduled = false;
    this._densityPassFrame = null;
    this._densityPassRetries = 0;
    this._ensureBaseDom();
  }

  connectedCallback() {
    this._schedulePostLayoutDensityPass();
  }

  setConfig(config) {
    if (!config.entities && !config.entity) {
      throw new Error('You must define entities or entity');
    }
    this._rendered = false; // force full rebuild on config change
    this._config = this.normalizeCardConfig(config);
    this._render();
  }

  // The normalized model is internal only. It preserves today's flat YAML
  // while giving future work one structured compatibility layer to build on.
  normalizeCardConfig(rawConfig) {
    const baseConfig = {
      title: '',
      label_position: 'left',
      color_mode: 'severity',
      color: '#4a9eff',
      animated: true,
      show_peak: false,
      peak_color: '#888',
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
        { from: 0,  to: 33,  color: '#4CAF50' },
        { from: 33, to: 75,  color: '#FF9800' },
        { from: 75, to: 100, color: '#F44336' },
      ],
      ...rawConfig,
    };
    baseConfig._height_explicit = rawConfig?.layout?.height !== undefined || rawConfig?.height !== undefined;

    // Normalise single entity shorthand to array
    if (baseConfig.entity && !baseConfig.entities) {
      baseConfig.entities = [{
        entity: baseConfig.entity,
        ...(baseConfig.name !== undefined ? { name: baseConfig.name } : {}),
      }];
    }
    baseConfig.entities = baseConfig.entities.map(e =>
      typeof e === 'string' ? { entity: e } : e
    );

    const normalizedCard = {
      ...baseConfig,
      _normalized: true,
    };

    normalizedCard.layout = this.normalizeLayoutConfig(baseConfig, null);
    normalizedCard.scale = this.normalizeScaleConfig(baseConfig, null);
    normalizedCard.bar = this.normalizeBarConfig(baseConfig, null);
    normalizedCard.baseline = this.normalizeBaselineConfig(baseConfig, null);
    normalizedCard.formatting = this.normalizeFormattingConfig(baseConfig, null);
    normalizedCard.target_marker = this.normalizeTargetMarkerConfig(baseConfig, null);
    normalizedCard.peak_marker = this.normalizePeakMarkerConfig(baseConfig, null);
    normalizedCard.entities = baseConfig.entities.map(entityCfg =>
      this.normalizeEntityConfig(entityCfg, normalizedCard)
    );

    return normalizedCard;
  }

  normalizeEntityConfig(entityConfig, cardConfig) {
    const normalizedEntity = {
      ...entityConfig,
      _normalized: true,
      entity: entityConfig.entity,
      name: entityConfig.name ?? null,
      icon: entityConfig.icon,
    };

    normalizedEntity.layout = this.normalizeLayoutConfig(entityConfig, cardConfig);
    normalizedEntity.scale = this.normalizeScaleConfig(entityConfig, cardConfig);
    normalizedEntity.bar = this.normalizeBarConfig(entityConfig, cardConfig);
    normalizedEntity.baseline = this.normalizeBaselineConfig(entityConfig, cardConfig);
    normalizedEntity.formatting = this.normalizeFormattingConfig(entityConfig, cardConfig);
    normalizedEntity.target_marker = this.normalizeTargetMarkerConfig(entityConfig, cardConfig);
    normalizedEntity.peak_marker = this.normalizePeakMarkerConfig(entityConfig, cardConfig);

    // Keep flat aliases so current rendering code and public YAML stay stable.
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

  // Internal resolvable shape preserves today's flat `value + *_entity`
  // behavior while canonicalizing the normalized form to `fixed + entity`.
  normalizeResolvableValue(value, entityValue, percentValue = null) {
    const normalized = {
      fixed: value ?? null,
      entity: entityValue ?? null,
    };
    if (Number.isFinite(percentValue)) {
      normalized.percent = percentValue;
    }
    return normalized;
  }

  _looksLikeEntityId(value) {
    return typeof value === 'string' && /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(value.trim());
  }

  _parsePercentLiteral(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
    if (!match) return null;
    const percent = parseFloat(match[1]);
    return Number.isFinite(percent) ? percent : null;
  }

  _getFiniteNumber(value) {
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

  normalizeStructuredResolvableValue(input, inheritedResolvable = null, defaultValue = null, options = {}) {
    const { allowPercent = false } = options;
    const inherited = inheritedResolvable ?? this.normalizeResolvableValue(defaultValue, null);
    if (input === undefined) {
      return { ...inherited };
    }
    if (input === null) {
      return this.normalizeResolvableValue(null, null);
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
      const value = input.fixed ?? input.value ?? null;
      const entity = input.entity ?? null;
      const percent = allowPercent ? this._getFiniteNumber(input.percent) : null;
      return this.normalizeResolvableValue(value, entity, percent);
    }
    if (this._looksLikeEntityId(input)) {
      return this.normalizeResolvableValue(
        inherited.fixed ?? defaultValue ?? null,
        input,
        inherited.percent ?? null
      );
    }
    if (allowPercent) {
      const percent = this._parsePercentLiteral(input);
      if (Number.isFinite(percent)) {
        return this.normalizeResolvableValue(null, null, percent);
      }
    }
    return this.normalizeResolvableValue(input, null);
  }

  normalizeBaselineDirectionConfig(input, inheritedDirection = null) {
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

  normalizeBaselineConfig(entityConfig, cardConfig) {
    const cardBaseline = cardConfig?.baseline;
    const rawBaseline = entityConfig?.baseline;
    const inherited = {
      enabled: this._normalizeOptionalEnabled(cardBaseline?.enabled),
      at: cardBaseline?.at ? { ...cardBaseline.at } : this.normalizeResolvableValue(null, null),
      above: this.normalizeBaselineDirectionConfig(undefined, cardBaseline?.above),
      below: this.normalizeBaselineDirectionConfig(undefined, cardBaseline?.below),
    };

    if (rawBaseline === undefined) {
      return inherited;
    }

    if (rawBaseline === null) {
      return {
        enabled: null,
        at: this.normalizeResolvableValue(null, null),
        above: { color: null },
        below: { color: null },
      };
    }

    if (typeof rawBaseline !== 'object' || Array.isArray(rawBaseline)) {
      return {
        enabled: inherited.enabled,
        at: this.normalizeStructuredResolvableValue(rawBaseline, inherited.at, null),
        above: inherited.above,
        below: inherited.below,
      };
    }

    return {
      enabled: this._normalizeOptionalEnabled(rawBaseline.enabled) ?? inherited.enabled,
      at: this.normalizeStructuredResolvableValue(rawBaseline.at, inherited.at, null, { allowPercent: true }),
      above: this.normalizeBaselineDirectionConfig(rawBaseline.above, inherited.above),
      below: this.normalizeBaselineDirectionConfig(rawBaseline.below, inherited.below),
    };
  }

  inferSegmentEndValues(segments, fallbackEnd = null) {
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

  normalizeSeverityToSegments(input) {
    if (!Array.isArray(input)) return null;
    const segments = input
      .filter((segment) => Number.isFinite(segment?.from) && segment?.color)
      .map((segment) => ({
        from: segment.from,
        to: Number.isFinite(segment?.to) ? segment.to : null,
        color: segment.color,
        label: segment.label ?? null,
      }));

    return this.inferSegmentEndValues(segments, 100);
  }

  _hasResolvableMagnitude(resolvable) {
    return !!resolvable && (
      Number.isFinite(this._getFiniteNumber(resolvable.fixed))
      || Number.isFinite(resolvable.percent)
    );
  }

  normalizeGaugeSegments(input) {
    if (!Array.isArray(input)) return null;
    const segments = input
      .map((segment) => {
        const from = this.normalizeStructuredResolvableValue(segment?.from, null, null, { allowPercent: true });
        const to = segment?.to === undefined
          ? null
          : this.normalizeStructuredResolvableValue(segment.to, null, null, { allowPercent: true });

        if (!this._hasResolvableMagnitude(from) || !segment?.color) {
          return null;
        }

        return {
          from,
          to,
          color: segment.color,
          label: segment.label ?? null,
        };
      })
      .filter(Boolean);

    return segments.map((segment, index) => ({
      from: { ...segment.from },
      to: segment.to ? { ...segment.to } : (index < segments.length - 1 ? { ...segments[index + 1].from } : null),
      color: segment.color,
      label: segment.label ?? null,
    }));
  }

  normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
    const cardScale = cardConfig?.scale;
    const entityScale = entityConfig?.scale;
    const entityKey = `${key}_entity`;
    const inherited = this.normalizeResolvableValue(
      cardScale?.[key]?.fixed ?? cardScale?.[key]?.value ?? cardConfig?.[key] ?? defaultValue,
      cardScale?.[key]?.entity ?? cardConfig?.[entityKey] ?? null
    );

    if (entityScale?.[key] !== undefined) {
      return this.normalizeStructuredResolvableValue(entityScale[key], inherited, defaultValue);
    }

    const value = entityConfig[key] ?? inherited.fixed ?? defaultValue;
    const entity = entityConfig[entityKey] ?? inherited.entity ?? null;
    return this.normalizeResolvableValue(value, entity);
  }

  normalizeScaleConfig(entityConfig, cardConfig) {
    return {
      min: this.normalizeScaleBound(entityConfig, cardConfig, 'min', 0),
      max: this.normalizeScaleBound(entityConfig, cardConfig, 'max', 100),
    };
  }

  _fillStyleToColorMode(fillStyle) {
    switch (fillStyle) {
      case 'solid': return 'single';
      case 'gradient': return 'gradient';
      case 'bands': return 'severity';
      case 'soft_bands': return 'severity';
      case 'band_gradient': return 'severity_gradient';
      default: return null;
    }
  }

  _colorModeToFillStyle(colorMode) {
    switch (colorMode) {
      case 'single': return 'solid';
      case 'gradient': return 'gradient';
      case 'severity': return 'bands';
      case 'severity_gradient': return 'band_gradient';
      default: return null;
    }
  }

  _normalizeBarModeConfig(barConfig = null, flatColorMode = null) {
    const fillStyle = barConfig?.fill_style ?? null;
    const colorMode = barConfig?.color_mode ?? flatColorMode ?? null;
    const normalizedColorMode = this._fillStyleToColorMode(fillStyle) ?? colorMode ?? 'severity';
    return {
      fill_style: fillStyle ?? this._colorModeToFillStyle(normalizedColorMode) ?? 'bands',
      color_mode: normalizedColorMode,
    };
  }

  _resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig) {
    if (entityBar?.fill_style !== undefined || entityBar?.color_mode !== undefined || entityConfig.color_mode !== undefined) {
      return this._normalizeBarModeConfig(entityBar, entityConfig.color_mode);
    }
    if (cardBar?.fill_style !== undefined || cardBar?.color_mode !== undefined || cardConfig?.color_mode !== undefined) {
      return this._normalizeBarModeConfig(cardBar, cardConfig?.color_mode);
    }
    return this._normalizeBarModeConfig(null, null);
  }

  _normalizeGradientStops(input) {
    if (!Array.isArray(input)) return input ?? null;
    return input.map((stop) => {
      if (!stop || typeof stop !== 'object' || Array.isArray(stop)) {
        return stop;
      }
      const percentPos = this._parsePercentLiteral(stop.pos);
      const numericPos = Number.isFinite(percentPos) ? percentPos : this._getFiniteNumber(stop.pos);
      return {
        ...stop,
        pos: Number.isFinite(numericPos) ? numericPos : stop.pos,
      };
    });
  }

  normalizeNeedleConfig(input, inheritedNeedle = null) {
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

  normalizeBarConfig(entityConfig, cardConfig) {
    const cardBar = cardConfig?.bar;
    const entityBar = entityConfig?.bar;
    const entityStructuredSegments = entityBar?.segments;
    const entityTopLevelSegments = entityConfig.segments;
    const entityLegacySeverity = entityConfig.severity;
    const cardStructuredSegments = cardBar?.segments ?? null;
    const cardTopLevelSegments = cardConfig?.segments ?? null;
    const cardLegacySeverity = cardConfig?.severity ?? null;
    let segments = null;
    let segment_space = cardBar?.segment_space ?? 'percent';

    if (entityStructuredSegments !== undefined && entityStructuredSegments !== null) {
      segments = this.normalizeGaugeSegments(entityStructuredSegments);
      segment_space = 'scale';
    } else if (entityTopLevelSegments !== undefined && entityTopLevelSegments !== null) {
      segments = this.normalizeGaugeSegments(entityTopLevelSegments);
      segment_space = 'scale';
    } else if (entityLegacySeverity !== undefined && entityLegacySeverity !== null) {
      segments = this.normalizeSeverityToSegments(entityLegacySeverity);
      segment_space = 'percent';
    } else if (cardStructuredSegments !== null && cardStructuredSegments !== undefined) {
      segments = cardStructuredSegments.map((segment) => ({ ...segment }));
      segment_space = cardBar?.segment_space ?? 'percent';
    } else if (cardTopLevelSegments !== null && cardTopLevelSegments !== undefined) {
      segments = this.normalizeGaugeSegments(cardTopLevelSegments);
      segment_space = 'scale';
    } else if (cardLegacySeverity !== null && cardLegacySeverity !== undefined) {
      segments = this.normalizeSeverityToSegments(cardLegacySeverity);
      segment_space = 'percent';
    }

    const structuredAboveTargetColor = entityConfig?.target && typeof entityConfig.target === 'object' && !Array.isArray(entityConfig.target)
      ? entityConfig.target.when_exceeded?.fill_color
      : undefined;
    const inheritedStructuredAboveTargetColor = cardConfig?.target && typeof cardConfig.target === 'object' && !Array.isArray(cardConfig.target)
      ? cardConfig.target.when_exceeded?.fill_color
      : undefined;
    const normalizedMode = this._resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig);

    return {
      fill_style: normalizedMode.fill_style,
      color_mode: normalizedMode.color_mode,
      needle: this.normalizeNeedleConfig(entityBar?.needle, cardBar?.needle),
      solid_fill: entityBar?.solid_fill ?? cardBar?.solid_fill ?? false,
      color: entityBar?.color ?? entityConfig.color ?? cardBar?.color ?? cardConfig?.color ?? '#4a9eff',
      gradient_stops: this._normalizeGradientStops(
        entityBar?.gradient_stops ?? entityConfig.gradient_stops ?? cardBar?.gradient_stops ?? cardConfig?.gradient_stops ?? null
      ),
      severity: segments,
      segments,
      segment_space,
      animated: entityBar?.animated ?? entityConfig.animated ?? cardBar?.animated ?? cardConfig?.animated ?? true,
      above_target_color: structuredAboveTargetColor ?? entityConfig.above_target_color ?? cardBar?.above_target_color ?? inheritedStructuredAboveTargetColor ?? cardConfig?.above_target_color ?? null,
    };
  }

  normalizeLayoutConfig(entityConfig, cardConfig) {
    const cardLayout = cardConfig?.layout;
    const entityLayout = entityConfig?.layout;
    const entityLabel = entityLayout?.label;
    const cardLabel = cardLayout?.label;
    const isCardLevelNormalization = !cardConfig;
    const rawHeight = entityLayout?.height ?? entityConfig.height ?? cardLayout?.height ?? cardConfig?.height ?? 38;
    const heightExplicit =
      entityLayout?.height !== undefined
      || entityConfig._height_explicit === true
      || (!isCardLevelNormalization && entityConfig.height !== undefined)
      || cardLayout?.height_explicit === true
      || cardConfig?._height_explicit === true;
    return {
      label: {
        position: entityLabel?.position ?? entityConfig.label_position ?? cardLabel?.position ?? cardLayout?.label_position ?? cardConfig?.label_position ?? 'left',
        width: entityLabel?.width ?? entityConfig.label_width ?? cardLabel?.width ?? cardLayout?.label_width ?? cardConfig?.label_width ?? 100,
      },
      height: this._clampSupportedRowHeight(rawHeight),
      height_explicit: heightExplicit,
    };
  }

  _clampSupportedRowHeight(height) {
    return Math.max(24, height);
  }

  normalizeFormattingConfig(entityConfig, cardConfig) {
    const cardFormatting = cardConfig?.formatting;
    const entityFormatting = entityConfig?.formatting;
    return {
      decimal: entityFormatting?.decimal ?? entityConfig.decimal ?? cardFormatting?.decimal ?? cardConfig?.decimal ?? null,
      unit: entityFormatting?.unit ?? entityConfig.unit ?? cardFormatting?.unit ?? cardConfig?.unit ?? null,
    };
  }

  normalizeTargetMarkerConfig(entityConfig, cardConfig) {
    const cardTarget = cardConfig?.target_marker;
    const rawTarget = entityConfig?.target;
    const legacyCardTarget = cardConfig?.target && typeof cardConfig.target === 'object' && !Array.isArray(cardConfig.target)
      ? null
      : cardConfig?.target ?? null;
    const inheritedTarget = cardTarget ?? {
      enabled: null,
      source: this.normalizeResolvableValue(null, null),
      color: cardConfig?.target_color ?? '#888',
      show_label: cardConfig?.show_target_label ?? false,
    };

    if (rawTarget && typeof rawTarget === 'object' && !Array.isArray(rawTarget)) {
      return {
        enabled: this._normalizeOptionalEnabled(rawTarget.enabled) ?? inheritedTarget.enabled ?? null,
        source: this.normalizeStructuredResolvableValue(rawTarget.at, inheritedTarget.source, null, { allowPercent: true }),
        color: rawTarget.color ?? entityConfig.target_color ?? inheritedTarget.color,
        show_label: rawTarget.label?.show ?? entityConfig.show_target_label ?? inheritedTarget.show_label,
      };
    }

    const value = entityConfig.target ?? inheritedTarget.source?.fixed ?? inheritedTarget.source?.value ?? legacyCardTarget;
    const entity = entityConfig.target_entity ?? inheritedTarget.source?.entity ?? cardConfig?.target_entity ?? null;
    const percent = entityConfig.target === undefined && entityConfig.target_entity === undefined
      ? inheritedTarget.source?.percent ?? null
      : null;
    return {
      enabled: inheritedTarget.enabled ?? null,
      source: this.normalizeResolvableValue(value, entity, percent),
      color: entityConfig.target_color ?? inheritedTarget.color ?? cardConfig?.target_color ?? '#888',
      show_label: entityConfig.show_target_label ?? inheritedTarget.show_label ?? cardConfig?.show_target_label ?? false,
    };
  }

  normalizePeakMarkerConfig(entityConfig, cardConfig) {
    const cardPeak = cardConfig?.peak_marker;
    const entityPeak = entityConfig?.peak;
    return {
      show: entityPeak?.enabled ?? entityConfig.show_peak ?? cardPeak?.show ?? cardConfig?.show_peak ?? false,
      color: entityPeak?.color ?? entityConfig.peak_color ?? cardPeak?.color ?? cardConfig?.peak_color ?? '#888',
    };
  }

  _normalizeOptionalEnabled(value) {
    return value === true ? true : value === false ? false : null;
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    if (!oldHass) {
      this._update();
      return;
    }
    
    if (this._shouldUpdate(oldHass, hass)) {
      this._update();
    }
  }

  // Merge global config with per-entity overrides
  _resolve(entityCfg) {
    const ecfg = entityCfg?._normalized ? entityCfg : this.normalizeEntityConfig(entityCfg, this._config);
    const stateObj = this._hass?.states?.[ecfg.entity] ?? null;
    return {
      ...ecfg,
      icon: ecfg.icon === false ? false : (ecfg.icon ?? stateObj?.attributes?.icon ?? this._getDefaultEntityIcon(stateObj, ecfg.entity)),
      name: ecfg.name ?? null,
    };
  }

  _getDefaultEntityIcon(stateObj, entityId = '') {
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

  _shouldUpdate(oldHass, newHass) {
    if (!this._config || !this._config.entities) return true;
    
    for (const entityCfg of this._config.entities) {
      const ecfg = this._resolve(entityCfg);
      const entitiesToWatch = [
        entityCfg.entity,
        ecfg.scale?.min?.entity,
        ecfg.scale?.max?.entity,
        ecfg.baseline?.at?.entity,
        ecfg.target_marker?.source?.entity
      ].filter(Boolean);
      
      for (const ent of entitiesToWatch) {
        const oldState = oldHass.states[ent] ?? null;
        const newState = newHass.states[ent] ?? null;
        if (oldState !== newState) {
          return true;
        }
      }
    }
    return false;
  }

  _setStyleIfChanged(el, prop, value) {
    if (!el?.style) return false;
    const nextValue = value == null ? '' : String(value);

    if (prop.startsWith('--')) {
      const currentValue = typeof el.style.getPropertyValue === 'function'
        ? el.style.getPropertyValue(prop)
        : (el.style[prop] ?? '');
      if (currentValue === nextValue) return false;
      if (typeof el.style.setProperty === 'function') {
        el.style.setProperty(prop, nextValue);
      } else {
        el.style[prop] = nextValue;
      }
      return true;
    }

    const currentValue = el.style[prop] ?? '';
    if (currentValue === nextValue) return false;
    el.style[prop] = nextValue;
    return true;
  }

  _setStyleTextIfChanged(el, value) {
    if (!el?.style) return false;
    const nextValue = value == null ? '' : String(value);
    const currentValue = el.style.cssText ?? '';
    if (currentValue === nextValue) return false;
    el.style.cssText = nextValue;
    return true;
  }

  _setTextIfChanged(el, value) {
    if (!el) return false;
    const nextValue = value == null ? '' : String(value);
    if ((el.textContent ?? '') === nextValue) return false;
    el.textContent = nextValue;
    return true;
  }

  _setDatasetIfChanged(el, key, value) {
    if (!el?.dataset) return false;
    const nextValue = value == null ? '' : String(value);
    const currentValue = el.dataset[key] ?? '';
    if (currentValue === nextValue) return false;
    el.dataset[key] = nextValue;
    return true;
  }

  _setClassNameIfChanged(el, value) {
    if (!el) return false;
    const nextValue = value == null ? '' : String(value);
    if ((el.className ?? '') === nextValue) return false;
    el.className = nextValue;
    return true;
  }
  
  _repositionAllTargetLabels() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.querySelectorAll('.row[data-entity]').forEach(row => {
      this._positionTargetLabel(row);
    });
  }
  
  _positionTargetLabel(row) {
    const track = row.querySelector('.bar-track');
    const label = row.querySelector('.target-value-label');
    const marker = row.querySelector('.target-marker');
    
    if (!track || !label || !marker) return;
    
    if (marker.style.display === 'none' || !label.textContent.trim()) {
      this._setStyleIfChanged(label, 'visibility', 'hidden');
      return;
    }
    
    const trackRect = track.getBoundingClientRect();
    const maxLabelWidth = Math.max(0, Math.floor(trackRect.width - 4));
    this._setStyleIfChanged(label, 'maxWidth', `${maxLabelWidth}px`);

    const labelRect = label.getBoundingClientRect();
    
    const markerPercent = parseFloat(marker.style.left);
    if (!Number.isFinite(markerPercent) || trackRect.width <= 0 || labelRect.width <= 0 || maxLabelWidth <= 10) {
      this._setStyleIfChanged(label, 'visibility', 'hidden');
      return;
    }
    
    const markerX = (markerPercent / 100) * trackRect.width;
    const halfLabel = labelRect.width / 2;
    
    const clampedX = Math.max(halfLabel, Math.min(trackRect.width - halfLabel, markerX));
    
    this._setStyleIfChanged(label, 'left', `${clampedX}px`);
    this._setStyleIfChanged(label, 'transform', 'translateX(-50%)');
    this._setStyleIfChanged(label, 'visibility', 'visible');
  }

  _getEntityNumericValue(entityId) {
    if (!entityId || !this._hass?.states?.[entityId]) return null;
    const raw = this._hass.states[entityId].state;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  }
  
  _getNumericValue(value, entityId = null) {
    const entityValue = this._getEntityNumericValue(entityId);
    if (entityValue !== null) return entityValue;
    
    if (value === null || value === undefined || value === '') return null;
    
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : null;
  }

  _resolvePercentValue(percent, minValue, maxValue) {
    if (!Number.isFinite(percent)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    return safeMin + ((percent / 100) * (safeMax - safeMin));
  }

  _getNormalizedResolvableNumericValue(resolvable, minValue = null, maxValue = null) {
    if (!resolvable) return null;
    const entityValue = this._getEntityNumericValue(resolvable.entity);
    if (entityValue !== null) return entityValue;

    const fixedValue = this._getNumericValue(resolvable.fixed ?? resolvable.value, null);
    if (fixedValue !== null) return fixedValue;

    if (Number.isFinite(resolvable.percent)) {
      return this._resolvePercentValue(resolvable.percent, minValue, maxValue);
    }

    return null;
  }

  _hexToRgb(color) {
    if (!color || typeof color !== 'string') return null;
    const hex = color.replace('#', '').trim();
    const full = hex.length === 3
      ? hex.split('').map(c => c + c).join('')
      : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  _getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
    const bands = this._getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands
      .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
      .sort((a, b) => a.from - b.from);

    if (!sorted.length) return [];

    const stops = [];
    for (let i = 0; i < sorted.length; i++) {
      const band = sorted[i];
      const rgb = this._hexToRgb(band.color);
      if (!rgb) continue;
      let anchor;
      if (i === 0) {
        anchor = band.from;
      } else if (i === sorted.length - 1) {
        anchor = band.to;
      } else {
        anchor = band.from + ((band.to - band.from) / 2);
      }
      if (!stops.length || stops[stops.length - 1].p !== anchor) {
        stops.push({ p: anchor, ...rgb });
      }
    }

    return stops;
  }

  _getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    const bands = this._getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands
      .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
      .sort((a, b) => a.from - b.from);

    if (!sorted.length) return null;

    const stops = [];
    for (const band of sorted) {
      stops.push(`${band.color} ${band.from}%`, `${band.color} ${band.to}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  _getSoftBandBlendWidthPct() {
    return 1.5;
  }

  _pushGradientColorStop(stops, pos, color) {
    if (!Array.isArray(stops) || !color) return;
    const clampedPos = Math.min(100, Math.max(0, pos));
    const last = stops[stops.length - 1];
    if (last && last.color === color && Math.abs(last.p - clampedPos) < 0.0001) return;
    stops.push({ p: clampedPos, color });
  }

  _getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
    const bands = this._getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands
      .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
      .sort((a, b) => a.from - b.from);

    if (!sorted.length) return [];

    const blendWidth = this._getSoftBandBlendWidthPct();
    const blendHalf = blendWidth / 2;
    const stops = [];
    this._pushGradientColorStop(stops, sorted[0].from, sorted[0].color);

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const boundary = current.to;
      const currentWidth = current.to - current.from;
      const nextWidth = next.to - next.from;
      const soften = currentWidth >= blendWidth && nextWidth >= blendWidth;

      if (soften) {
        this._pushGradientColorStop(stops, Math.max(current.from, boundary - blendHalf), current.color);
        this._pushGradientColorStop(stops, Math.min(next.to, boundary + blendHalf), next.color);
      } else {
        this._pushGradientColorStop(stops, boundary, current.color);
        this._pushGradientColorStop(stops, boundary, next.color);
      }
    }

    this._pushGradientColorStop(stops, sorted[sorted.length - 1].to, sorted[sorted.length - 1].color);
    return stops;
  }

  _getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    const stops = this._getSoftBandGradientStops(ecfg, minValue, maxValue);
    if (!stops.length) return null;
    return `linear-gradient(to right, ${stops.map((stop) => `${stop.color} ${stop.p}%`).join(', ')})`;
  }

  _resolveSegmentBoundaryPct(boundary, minValue, maxValue) {
    if (boundary === null || boundary === undefined) return null;

    if (typeof boundary === 'object' && !Array.isArray(boundary)) {
      const fixed = this._getFiniteNumber(boundary.fixed);
      if (Number.isFinite(fixed)) {
        return this._toScalePct(fixed, minValue, maxValue);
      }
      if (Number.isFinite(boundary.percent)) {
        return boundary.percent;
      }
      return null;
    }

    const percent = this._parsePercentLiteral(boundary);
    if (Number.isFinite(percent)) {
      return percent;
    }

    const fixed = this._getFiniteNumber(boundary);
    return Number.isFinite(fixed) ? this._toScalePct(fixed, minValue, maxValue) : null;
  }

  _getEffectiveFillStyle(ecfg) {
    return ecfg?.bar?.fill_style
      ?? this._colorModeToFillStyle(ecfg?.bar?.color_mode)
      ?? 'bands';
  }

  _segmentsNeedBoundaryResolution(segments) {
    return Array.isArray(segments) && segments.some((segment) => (
      (segment?.from && typeof segment.from === 'object' && !Array.isArray(segment.from))
      || (segment?.to && typeof segment.to === 'object' && !Array.isArray(segment.to))
    ));
  }
  
  _getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const rawSegments = Array.isArray(ecfg.bar?.segments) ? ecfg.bar.segments : [];
    if (ecfg.bar?.segment_space === 'scale' || this._segmentsNeedBoundaryResolution(rawSegments)) {
      const resolvedSegments = rawSegments
        .map((segment) => ({
          from: this._resolveSegmentBoundaryPct(segment.from, safeMin, safeMax),
          to: this._resolveSegmentBoundaryPct(segment.to, safeMin, safeMax),
          color: segment.color,
          label: segment.label ?? null,
        }))
        .filter((segment) => Number.isFinite(segment.from) && segment.color);

      return this.inferSegmentEndValues(resolvedSegments, 100)
        .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
    }

    return this.inferSegmentEndValues(rawSegments, 100)
      .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
  }

  _getColor(pct, ecfg, minValue = 0, maxValue = 100) {
    const fillStyle = this._getEffectiveFillStyle(ecfg);
    if (fillStyle === 'solid') return ecfg.bar.color;

    if (fillStyle === 'gradient' || fillStyle === 'band_gradient' || fillStyle === 'soft_bands') {
      let stops;
      if (fillStyle === 'band_gradient') {
        stops = this._getSeverityInterpolationStops(ecfg, minValue, maxValue);
      } else if (fillStyle === 'soft_bands') {
        stops = this._getSoftBandGradientStops(ecfg, minValue, maxValue)
          .map((stop) => {
            const rgb = this._hexToRgb(stop.color);
            return rgb ? { p: stop.p, ...rgb } : null;
          })
          .filter(Boolean);
      } else if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
        stops = ecfg.bar.gradient_stops.map(s => {
          const hex = s.color.replace('#','');
          const full = hex.length === 3
            ? hex.split('').map(c => c+c).join('')
            : hex;
          return { p: s.pos, r: parseInt(full.slice(0,2),16), g: parseInt(full.slice(2,4),16), b: parseInt(full.slice(4,6),16) };
        });
        stops.sort((a,b) => a.p - b.p);
      } else {
        stops = [
          { p: 0,   r: 76,  g: 175, b: 80  },
          { p: 50,  r: 255, g: 152, b: 0   },
          { p: 100, r: 244, g: 67,  b: 54  },
        ];
      }
      if (!stops || !stops.length) return ecfg.bar.color;
      let lo = stops[0], hi = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (pct >= stops[i].p && pct <= stops[i + 1].p) {
          lo = stops[i]; hi = stops[i + 1]; break;
        }
      }
      const t = lo.p === hi.p ? 0 : (pct - lo.p) / (hi.p - lo.p);
      return `rgb(${Math.round(lo.r + t*(hi.r-lo.r))},${Math.round(lo.g + t*(hi.g-lo.g))},${Math.round(lo.b + t*(hi.b-lo.b))})`;
    }

    // Bands mode
    for (const s of this._getSegmentsForRendering(ecfg, minValue, maxValue)) {
      if (pct >= s.from && pct <= s.to) return s.color;
    }
    return ecfg.bar.color;
  }

  _buildFullScaleGradientStyle(stops) {
    if (!Array.isArray(stops) || !stops.length) return null;
    const cssStops = stops.map((stop) => {
      const cssColor = stop.color ?? this._rgbToCss(stop);
      return cssColor ? `${cssColor} ${stop.p}%` : null;
    }).filter(Boolean);
    if (!cssStops.length) return null;
    return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
  }

  _getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
    const fillStyle = this._getEffectiveFillStyle(ecfg);
    if (fillStyle === 'band_gradient') {
      return this._getSeverityInterpolationStops(ecfg, minValue, maxValue);
    }

    if (fillStyle === 'soft_bands') {
      return this._getSoftBandGradientStops(ecfg, minValue, maxValue)
        .map((stop) => {
          const rgb = this._hexToRgb(stop.color);
          return rgb ? { p: stop.p, ...rgb } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.p - b.p);
    }

    if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
      return ecfg.bar.gradient_stops
        .map((s) => {
          const rgb = this._hexToRgb(s.color);
          return rgb ? { p: s.pos, ...rgb } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.p - b.p);
    }

    return [
      { p: 0,   r: 76,  g: 175, b: 80  },
      { p: 50,  r: 255, g: 152, b: 0   },
      { p: 100, r: 244, g: 67,  b: 54  },
    ];
  }

  _interpolateStopColor(stops, pct) {
    if (!Array.isArray(stops) || !stops.length) return null;
    const clampedPct = Math.min(100, Math.max(0, pct));
    let lo = stops[0];
    let hi = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (clampedPct >= stops[i].p && clampedPct <= stops[i + 1].p) {
        lo = stops[i];
        hi = stops[i + 1];
        break;
      }
    }

    const t = lo.p === hi.p ? 0 : (clampedPct - lo.p) / (hi.p - lo.p);
    return {
      r: Math.round(lo.r + t * (hi.r - lo.r)),
      g: Math.round(lo.g + t * (hi.g - lo.g)),
      b: Math.round(lo.b + t * (hi.b - lo.b)),
    };
  }

  _rgbToCss(rgb) {
    if (!rgb) return null;
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }

  _buildSolidGradientStyle(color) {
    return `linear-gradient(to right,${color} 0%,${color} 100%)`;
  }

  _getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100) {
    const fillStyle = this._getEffectiveFillStyle(ecfg);
    if (ecfg.bar.solid_fill) {
      return this._buildSolidGradientStyle(color);
    }

    if (fillStyle === 'bands') {
      return this._getSeverityBandGradientCss(ecfg, minValue, maxValue);
    }

    if (fillStyle === 'soft_bands') {
      return this._getSoftBandGradientCss(ecfg, minValue, maxValue);
    }

    if (fillStyle === 'gradient' || fillStyle === 'band_gradient') {
      const stops = this._getGradientInterpolationStops(ecfg, minValue, maxValue);
      return this._buildFullScaleGradientStyle(stops)?.replace(/^background:/, '').replace(/;background-repeat:no-repeat;$/, '');
    }

    return this._buildSolidGradientStyle(color);
  }

  _getOverlayGradient(startPct, endPct, color) {
    if (!color) return null;
    const start = Math.min(100, Math.max(0, startPct));
    const end = Math.min(100, Math.max(0, endPct));
    if (end <= start) return null;
    return `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;
  }

  _toScalePct(value, minValue, maxValue) {
    if (!Number.isFinite(value)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const range = safeMax - safeMin || 1;
    return Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));
  }

  _resolveBaselinePct(ecfg, safeMin, safeMax) {
    if (ecfg.baseline?.enabled === false) return null;
    const baselineValue = this._getNormalizedResolvableNumericValue(ecfg.baseline?.at, safeMin, safeMax);
    if (!Number.isFinite(baselineValue)) return null;
    return this._toScalePct(baselineValue, safeMin, safeMax);
  }

  _formatNumericDisplay(rawVal, decimal = null) {
    if (!Number.isFinite(rawVal)) return String(rawVal);
    if (decimal !== null) {
      return parseFloat(rawVal.toFixed(decimal)).toLocaleString();
    }
    return rawVal.toLocaleString();
  }

  _getNormalizedPercent(valuePct, baselinePct = null) {
    const clampedValue = Math.min(100, Math.max(0, valuePct));
    if (!Number.isFinite(baselinePct)) {
      return {
        usesBaseline: false,
        start: 0,
        end: clampedValue,
        positive: true,
        baseline: null,
        hidden: clampedValue <= 0,
      };
    }

    const clampedBaseline = Math.min(100, Math.max(0, baselinePct));
    return {
      usesBaseline: true,
      start: Math.min(clampedValue, clampedBaseline),
      end: Math.max(clampedValue, clampedBaseline),
      positive: clampedValue >= clampedBaseline,
      baseline: clampedBaseline,
      hidden: clampedValue === clampedBaseline,
    };
  }

  _getEndpointSemantics(geometry) {
    if (geometry?.endpointSemantics) {
      return geometry.endpointSemantics;
    }
    if (!geometry?.usesBaseline) {
      return {
        left: 'scale',
        right: 'value',
      };
    }

    return geometry.positive
      ? { left: 'baseline', right: 'value' }
      : { left: 'value', right: 'baseline' };
  }

  _getRevealCornerRadii(geometry) {
    const endpoints = this._getEndpointSemantics(geometry);
    const isRounded = (endpointType) => endpointType === 'value' || endpointType === 'range' || endpointType === 'scale';
    const leftRadius = isRounded(endpoints.left) ? '6px' : '0';
    const rightRadius = isRounded(endpoints.right) ? '6px' : '0';
    return `${leftRadius} ${rightRadius} ${rightRadius} ${leftRadius}`;
  }

_getAboveTargetOverlayInterval(targetPct = null) {
  if (!Number.isFinite(targetPct)) return null;

  const start = Math.min(100, Math.max(0, targetPct));
  if (start >= 100) return null;

  return {
    start,
    end: 100,
  };
}

_getAboveTargetLayerGeometry(targetPct = null) {
  const interval = this._getAboveTargetOverlayInterval(targetPct);
  if (!interval) return null;

  return {
    start: interval.start,
    end: interval.end,
    hidden: false,
  };
}

  _getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    const layers = [];
    const basePaint = this._getBasePaintGradient(color, ecfg, minValue, maxValue);
    const clampedBaseline = Number.isFinite(baselinePct)
      ? Math.min(100, Math.max(0, baselinePct))
      : null;

    if (Number.isFinite(clampedBaseline)) {
      const belowColor = ecfg.baseline?.below?.color ?? null;
      const aboveColor = ecfg.baseline?.above?.color ?? null;
      const belowOverlay = this._getOverlayGradient(0, clampedBaseline, belowColor);
      const aboveOverlay = this._getOverlayGradient(clampedBaseline, 100, aboveColor);
      if (belowOverlay) layers.push(belowOverlay);
      if (aboveOverlay) layers.push(aboveOverlay);
    }

    if (basePaint) layers.push(basePaint);
    if (!layers.length) return 'display:none;';

    return `display:block;inset:0;background-image:${layers.join(',')};background-repeat:no-repeat;background-size:100% 100%;`;
  }

  _getRevealShapeStyle(geometry, h) {
    const heightValue = typeof h === 'number' ? `${h}px` : h;
    const start = Math.min(100, Math.max(0, geometry?.start ?? 0));
    const end = Math.min(100, Math.max(0, geometry?.end ?? 0));

    if (geometry?.hidden) {
      return `display:none;height:${heightValue};clip-path:inset(0 100% 0 0 round 0);`;
    }

    const topInset = '0';
    const rightInset = `${Math.max(0, 100 - end)}%`;
    const bottomInset = '0';
    const leftInset = `${start}%`;
    const radii = this._getRevealCornerRadii(geometry);
    return `display:block;height:${heightValue};clip-path:inset(${topInset} ${rightInset} ${bottomInset} ${leftInset} round ${radii});`;
  }

  _getStaticLayerRevealStyle(geometry) {
    if (!geometry?.hidden && Number.isFinite(geometry?.start) && Number.isFinite(geometry?.end) && geometry.end > geometry.start) {
      const start = Math.min(100, Math.max(0, geometry.start));
      const end = Math.min(100, Math.max(0, geometry.end));
      return `display:block;clip-path:inset(0 ${Math.max(0, 100 - end)}% 0 ${start}% round 0);`;
    }
    return 'display:none;clip-path:inset(0 100% 0 0 round 0);';
  }

  _getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    const basePaintStyle = this._getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue);
    const baseLayer = {
      id: 'base',
      zIndex: 1,
      visible: true,
      paintStyle: basePaintStyle,
      revealStyle: 'display:block;',
    };

    const aboveTargetGeometry = this._getAboveTargetLayerGeometry(targetPct);
    const aboveTargetLayer = {
      id: 'above-target',
      zIndex: 2,
      visible: !!(ecfg?.bar?.above_target_color && aboveTargetGeometry),
      paintStyle: ecfg?.bar?.above_target_color
        ? `display:block;inset:0;background:${ecfg.bar.above_target_color};`
        : 'display:none;',
      revealStyle: aboveTargetGeometry
        ? this._getStaticLayerRevealStyle(aboveTargetGeometry)
        : this._getStaticLayerRevealStyle({ start: 0, end: 0, hidden: true }),
    };

    return [baseLayer, aboveTargetLayer];
  }

  _getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
    const geometry = needleActive
      ? this._getNormalizedPercent(100, null)
      : this._getNormalizedPercent(pct, baselinePct);
    const paintLayers = this._getFillPaintLayers(geometry, h, ecfg, color, targetPct, baselinePct, minValue, maxValue);
    return {
      geometry,
      paintLayers,
      paintStyle: paintLayers[0]?.paintStyle ?? 'display:none;',
      revealStyle: this._getRevealShapeStyle(geometry, h),
    };
  }

  _getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null) {
    const needle = ecfg?.bar?.needle;
    if (!needle?.show) {
      return {
        show: false,
        pct: null,
        color: needle?.color ?? '#ffffff',
        borderColor: this._getNeedleBorderColor(needle?.color ?? '#ffffff'),
        edge: 'middle',
      };
    }
    if (Number.isFinite(baselinePct)) {
      return {
        show: false,
        pct: null,
        color: needle.color ?? '#ffffff',
        borderColor: this._getNeedleBorderColor(needle.color ?? '#ffffff'),
        edge: 'middle',
      };
    }
    if (!Number.isFinite(rawValue)) {
      return {
        show: false,
        pct: null,
        color: needle.color ?? '#ffffff',
        borderColor: this._getNeedleBorderColor(needle.color ?? '#ffffff'),
        edge: 'middle',
      };
    }

    const pct = Math.min(100, Math.max(0, this._toScalePct(rawValue, minValue, maxValue)));
    return {
      show: true,
      pct,
      color: needle.color ?? '#ffffff',
      borderColor: this._getNeedleBorderColor(needle.color ?? '#ffffff'),
      edge: pct <= 0 ? 'left' : (pct >= 100 ? 'right' : 'middle'),
    };
  }

  _ensureBaseDom() {
    if (this._baseDomReady) return;
    if (this.shadowRoot.querySelector('ha-card')) {
      this._baseDomReady = true;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }

        ha-card {
          display: block;
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.08));
          overflow: hidden;
          padding: 16px;
          box-sizing: border-box;
        }
        .card {
          --sbcp-main-gap: 8px;
          --sbcp-icon-width: 28px;
          --sbcp-above-gap: 10px;
          --sbcp-left-label-share: 25%;
          --sbcp-value-width: 60px;
          --sbcp-bar-min-width: 56px;
          --sbcp-target-label-font-size: 12px;
          --sbcp-inline-label-padding-x: 8px;
          --sbcp-inline-label-padding-y: 2px;
          --sbcp-inline-label-font-size: 12px;
          min-width: 0;
        }
        .card[data-compact="compact"] {
          --sbcp-main-gap: 6px;
          --sbcp-icon-width: 26px;
          --sbcp-above-gap: 8px;
          --sbcp-left-label-share: 22%;
          --sbcp-value-width: 54px;
          --sbcp-bar-min-width: 52px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 7px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="tight"] {
          --sbcp-main-gap: 5px;
          --sbcp-icon-width: 24px;
          --sbcp-above-gap: 6px;
          --sbcp-left-label-share: 19%;
          --sbcp-value-width: 50px;
          --sbcp-bar-min-width: 48px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 6px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="dense"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 23px;
          --sbcp-above-gap: 5px;
          --sbcp-left-label-share: 16%;
          --sbcp-value-width: 46px;
          --sbcp-bar-min-width: 44px;
          --sbcp-target-label-font-size: 10px;
          --sbcp-inline-label-padding-x: 5px;
          --sbcp-inline-label-font-size: 10px;
        }
        .card[data-compact="compressed"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 22px;
          --sbcp-above-gap: 4px;
          --sbcp-left-label-share: 14%;
          --sbcp-value-width: 42px;
          --sbcp-bar-min-width: 40px;
          --sbcp-target-label-font-size: 10px;
          --sbcp-inline-label-padding-x: 5px;
          --sbcp-inline-label-font-size: 10px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--secondary-text-color, #888);
          margin-bottom: 14px;
        }
        .row {
          margin-bottom: 10px;
          cursor: pointer;
          border-radius: 8px;
          padding: 2px 4px;
        }
        .row:last-child { margin-bottom: 0; }
        .row-stack {
          --sbcp-row-height: 38px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .row-stack[data-top-value="true"] .main-line.left-mode .value-right {
          display: none;
        }
        .top-right-value {
          display: none;
          align-self: flex-end;
          align-items: center;
          justify-content: flex-end;
          max-width: 100%;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          text-align: right;
          line-height: 1.1;
          margin-bottom: 1px;
        }
        .top-right-value[data-active="true"] {
          display: flex;
        }
        .row:hover .bar-track { filter: brightness(0.95); transition: filter 0.15s; }
        .main-line {
          display: flex;
          align-items: center;
          gap: var(--sbcp-main-gap);
          min-width: 0;
        }
        .main-line[data-row-density="tight"] {
          gap: calc(var(--sbcp-main-gap) - 1px);
        }
        .main-line[data-row-density="dense"] {
          gap: calc(var(--sbcp-main-gap) - 2px);
        }
        .main-line[data-row-density="compressed"] {
          gap: calc(var(--sbcp-main-gap) - 2px);
        }
        .main-line:not(.left-mode)[data-row-density="compact"] {
          --sbcp-value-width: 52px;
        }
        .main-line:not(.left-mode)[data-row-density="tight"] {
          --sbcp-value-width: 48px;
        }
        .main-line:not(.left-mode)[data-row-density="dense"] {
          --sbcp-value-width: 44px;
        }
        .main-line:not(.left-mode)[data-row-density="compressed"] {
          --sbcp-value-width: 40px;
        }
        .main-line.off-mode[data-row-density="compressed"] .icon-wrap,
        .main-line.above-mode[data-row-density="compressed"] .icon-wrap {
          display: none;
        }
        .main-line.left-mode[data-hide-left-icon="true"] .icon-wrap,
        .main-line.above-mode[data-hide-above-icon="true"] .icon-wrap,
        .main-line.inside-mode[data-hide-inside-icon="true"] .icon-wrap,
        .main-line.inside-mode[data-priority-hide-inside-icon="true"] .icon-wrap {
          display: none;
        }
        .main-line.left-mode[data-left-density="normal"] {
          --sbcp-left-label-share: 25%;
          --sbcp-value-width: 58px;
        }
        .main-line.left-mode[data-left-density="compact"] {
          --sbcp-left-label-share: 22%;
          --sbcp-value-width: 53px;
        }
        .main-line.left-mode[data-left-density="tight"] {
          --sbcp-left-label-share: 19%;
          --sbcp-value-width: 49px;
        }
        .main-line.left-mode[data-left-density="dense"] {
          --sbcp-left-label-share: 16%;
          --sbcp-value-width: 46px;
        }
        .main-line.left-mode[data-left-density="compressed"] {
          --sbcp-left-label-share: 14%;
          --sbcp-value-width: 42px;
        }
        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: var(--sbcp-icon-width);
          height: var(--sbcp-row-height);
          min-height: var(--sbcp-row-height);
          color: var(--primary-text-color, #333);
          line-height: 1;
        }
        .main-line.left-mode[data-left-density="compressed"] .icon-wrap {
          display: none;
        }
        ha-icon {
          --mdc-icon-size: 20px;
          display: block;
        }
        .label-left {
          flex: 1 1 auto;
          height: var(--sbcp-row-height);
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          display: flex;
          align-items: center;
        }
        .label-left[data-hidden="true"],
        .label-left[data-priority-hidden="true"] {
          display: none;
        }
        .label-left-text {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bar-wrap {
          flex: 1 1 var(--sbcp-bar-min-width);
          min-width: var(--sbcp-bar-min-width);
          position: relative;
        }
        .bar-track {
          position: relative;
          width: 100%;
          height: var(--sbcp-row-height);
          border-radius: 6px;
          background: var(--secondary-background-color, #e8e8e8);
          overflow: hidden;
        }
        .bar-fill-reveal {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: clip-path 0.6s cubic-bezier(0.4,0,0.2,1);
          z-index: 1;
        }
        .bar-paint-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .bar-paint-layer[data-layer="above-target"] {
          z-index: 2;
        }
        .bar-fill-reveal.no-anim {
          transition: none;
        }
        .row[data-bar-animated="false"] .bar-fill-reveal,
        .row[data-bar-animated="false"] .needle-marker,
        .row[data-bar-animated="false"] .target-marker,
        .row[data-bar-animated="false"] .peak-marker,
        .row[data-bar-animated="false"] .target-value-label {
          transition: none;
        }

        .bar-inner-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 0 6px;
          pointer-events: none;
          z-index: 8;
        }
        .bar-inner-label[data-inside-density="compact"] {
          gap: 5px;
          padding: 0 5px;
        }
        .bar-inner-label[data-inside-density="tight"] {
          gap: 4px;
          padding: 0 4px;
        }
        .bar-inner-label[data-inside-density="dense"] {
          gap: 0;
          padding: 0 4px;
          justify-content: flex-end;
        }
        .bar-inner-label[data-inside-density="compressed"] {
          gap: 0;
          padding: 0 4px;
          justify-content: flex-end;
        }
        .bar-inner-label > span {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: #fff;
          font-size: var(--sbcp-inline-label-font-size);
          font-weight: 600;
          white-space: nowrap;
          padding: var(--sbcp-inline-label-padding-y) var(--sbcp-inline-label-padding-x);
          border-radius: 20px;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-inner-label .inside-name {
          flex: 0 1 auto;
          width: fit-content;
          max-width: 60%;
          display: inline-block;
        }
        .bar-inner-label[data-inside-density="compact"] .inside-name {
          max-width: 56%;
        }
        .bar-inner-label[data-inside-density="tight"] .inside-name {
          max-width: 48%;
        }
        .bar-inner-label[data-hide-name="true"] .inside-name,
        .bar-inner-label[data-priority-hide-name="true"] .inside-name {
          display: none;
        }
        .bar-inner-label .inside-value {
          flex: 0 1 auto;
          min-width: 0;
          max-width: 56%;
          display: inline-flex;
          align-items: baseline;
        }
        .main-line.inside-mode[data-hide-inside-icon="true"] .bar-inner-label .inside-value,
        .main-line.inside-mode[data-priority-hide-inside-icon="true"] .bar-inner-label .inside-value,
        .bar-inner-label[data-hide-name="true"] .inside-value,
        .bar-inner-label[data-priority-hide-name="true"] .inside-value {
          max-width: 100%;
        }
        .bar-inner-label[data-inside-density="dense"] .inside-value,
        .bar-inner-label[data-inside-density="compressed"] .inside-value {
          max-width: 100%;
        }
        .bar-inner-label .inside-value-text {
          display: inline-flex;
          align-items: baseline;
          gap: 0;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          background: transparent;
          padding: 0;
          border-radius: 0;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .bar-inner-label .inside-value-text.has-unit {
          gap: 2px;
        }
        .bar-inner-label .inside-value-text.tight-unit {
          gap: 0;
        }
        .bar-inner-label .inside-number {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        .bar-inner-label .inside-unit {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.72);
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        .target-value-label {
          position: absolute;
          top: 100%;
          margin-top: 3px;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--secondary-text-color, #888);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 6;
          visibility: hidden;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .above-line {
          display: flex;
          gap: var(--sbcp-above-gap);
          min-width: 0;
          align-items: flex-end;
        }
        .above-bar-label[data-hide-name="true"] .above-bar-label-name,
        .above-bar-label[data-priority-hide-name="true"] .above-bar-label-name,
        .above-line[data-above-density="compressed"] .above-icon-spacer {
          display: none;
        }
        .above-line[data-hide-above-icon="true"] .above-icon-spacer {
          display: none;
        }
        .above-icon-spacer {
          flex: 0 0 var(--sbcp-icon-width);
        }
        .above-bar-label {
          flex: 1;
          min-width: 0;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: var(--sbcp-main-gap);
          margin-bottom: 2px;
          min-height: 16px;
        }
        .above-bar-label-name {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          line-height: 1.15;
        }
        .above-bar-label-value {
          flex: 0 0 auto;
          margin-left: auto;
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          text-align: right;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
        }
        /* ── Shared marker base ── */
        .peak-marker, .target-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 0;
          transform: translateX(-50%);
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          --marker-color: #888;
          --marker-contrast-color: #f3f4f6;
        }
        .target-marker {
          z-index: 6;
        }
        .peak-marker {
          z-index: 7;
        }
        .needle-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          pointer-events: none;
          z-index: 5;
        }
        .needle-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 7px;
          transform: translateX(-50%);
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          background: linear-gradient(
            to right,
            var(--needle-border-color, #000000) 0 1px,
            var(--needle-color, #ffffff) 1px 6px,
            var(--needle-border-color, #000000) 6px 7px
          );
          border-radius: 0;
          box-shadow:
            0 0 3px var(--needle-color, #ffffff),
            0 0 6px var(--needle-color, #ffffff);
        }
        .needle-layer .needle-marker[data-edge="right"] {
          transform: translateX(-100%);
        }
        .peak-marker .peak-inset,
        .peak-marker .peak-outset,
        .target-marker .target-inset,
        .target-marker .target-outset {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
        }
        /* Peak marker: large triangle intrudes into the bar, small one sits just above it. */
        .peak-marker .peak-inset {
          top: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 11px solid var(--marker-color);
          z-index: 2;
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .peak-marker .peak-outset {
          top: -4px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 4px solid var(--marker-color);
          z-index: 3;
        }
        /* Target marker: large triangle intrudes into the bar, small one sits just below it. */
        .target-marker .target-inset {
          bottom: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 11px solid var(--marker-color);
          z-index: 2;
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .target-marker .target-outset {
          bottom: -4px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 4px solid var(--marker-color);
          z-index: 3;
        }

        .value-right {
          --sbcp-value-extra-width: 0px;
          flex: 0 0 calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          min-width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          max-width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          height: var(--sbcp-row-height);
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
          box-sizing: border-box;
          padding-right: 1px;
          min-width: 0;
        }
        .value-right-text {
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 0;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .value-right-text.has-unit {
          gap: 2px;
        }
        .value-right-text.tight-unit {
          gap: 0;
        }
        .value-right-number {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit-group,
        .top-right-value .unit-group,
        .above-bar-label-value .unit-group {
          flex: 0 1 auto;
          display: inline-flex;
          align-items: baseline;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit,
        .top-right-value .unit,
        .above-bar-label-value .unit {
          flex: 0 1 auto;
          min-width: 0;
          display: inline-block;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 400;
          color: var(--secondary-text-color, #888);
          line-height: 1.1;
        }
        .measure-layer {
          position: fixed;
          left: -9999px;
          top: -9999px;
          visibility: hidden;
          pointer-events: none;
          white-space: nowrap;
        }
      </style>

      <ha-card>
        <div class="card">
          <div class="card-title" style="display:none;"></div>
          <div class="rows"></div>
          <div class="measure-layer"></div>
        </div>
      </ha-card>
    `;
    this._baseDomReady = true;
  }

  _render() {
    const cfg = this._config;
    this._ensureBaseDom();

    const titleEl = this.shadowRoot.querySelector('.card-title');
    if (titleEl) {
      if (cfg.title) {
        titleEl.textContent = cfg.title;
        titleEl.style.display = '';
      } else {
        titleEl.textContent = '';
        titleEl.style.display = 'none';
      }
    }

    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        this._applyCompactTier();
        this._runPostLayoutPasses();
      });
    }

    const surface = this.shadowRoot.querySelector('ha-card');
    const card = this.shadowRoot.querySelector('.card');
    if (surface && card) {
      this._applyCompactTier();
      this._resizeObserver.observe(surface);
    }
    this._update();
    this._schedulePostLayoutDensityPass();
  }

  _isReliableWidth(width, minWidth = 16) {
    return Number.isFinite(width) && width >= minWidth;
  }

  _classifyCompactTier(width, currentTier = 'normal') {
    if (!this._isReliableWidth(width)) return currentTier || 'normal';
    if (width < 180) return 'compressed';
    if (width < 220) return 'dense';
    if (width < 280) return 'tight';
    if (width < 360) return 'compact';
    return 'normal';
  }

  _classifyLeftDensity(width, currentDensity = 'normal') {
    if (!this._isReliableWidth(width)) return currentDensity || 'normal';
    if (width < 170) return 'compressed';
    if (width < 210) return 'dense';
    if (width < 255) return 'tight';
    if (width < 320) return 'compact';
    return 'normal';
  }

  _classifyRowDensity(width, currentDensity = 'normal') {
    if (!this._isReliableWidth(width)) return currentDensity || 'normal';
    if (width < 150) return 'compressed';
    if (width < 190) return 'dense';
    if (width < 245) return 'tight';
    if (width < 300) return 'compact';
    return 'normal';
  }

  _schedulePostLayoutDensityPass() {
    if (this._densityPassScheduled || !this.isConnected) return;
    this._densityPassScheduled = true;
    this._densityPassFrame = requestAnimationFrame(() => {
      this._densityPassScheduled = false;
      this._densityPassFrame = null;
      if (!this.isConnected) return;

      const surface = this.shadowRoot?.querySelector('ha-card');
      const width = surface?.getBoundingClientRect().width ?? 0;
      if (!this._isReliableWidth(width)) {
        if (this._densityPassRetries < 4) {
          this._densityPassRetries += 1;
          this._schedulePostLayoutDensityPass();
        }
        return;
      }

      this._densityPassRetries = 0;
      this._applyCompactTier();
      this._runPostLayoutPasses();
    });
  }

  _applyCompactTier() {
    if (!this.shadowRoot) return;
    const surface = this.shadowRoot.querySelector('ha-card');
    const card = this.shadowRoot.querySelector('.card');
    if (!surface || !card) return;
    const width = surface.getBoundingClientRect().width;
    if (!this._isReliableWidth(width)) {
      this._schedulePostLayoutDensityPass();
      if (!card.dataset.compact) card.dataset.compact = 'normal';
      return;
    }
    card.dataset.compact = this._classifyCompactTier(width, card.dataset.compact);
  }

  _applyLeftModeDensity() {
    if (!this.shadowRoot) return;
    const densities = ['normal', 'compact', 'tight', 'dense', 'compressed'];
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach(mainLine => {
      const width = mainLine.getBoundingClientRect().width;
      if (!this._isReliableWidth(width)) {
        this._schedulePostLayoutDensityPass();
        if (!mainLine.dataset.leftDensity) mainLine.dataset.leftDensity = 'normal';
        return;
      }

      let density = this._classifyLeftDensity(width, mainLine.dataset.leftDensity);

      const labelText = mainLine.querySelector('.label-left-text');
      const fullLabelWidth = labelText ? labelText.scrollWidth : Number.POSITIVE_INFINITY;
      const visibleLabelWidth = labelText ? labelText.clientWidth : Number.POSITIVE_INFINITY;
      const labelIsTruncated = labelText ? fullLabelWidth > visibleLabelWidth + 1 : false;
      const effectiveLabelWidth = labelIsTruncated ? visibleLabelWidth : fullLabelWidth;
      let relaxBy = 0;
      if (Number.isFinite(effectiveLabelWidth)) {
        if (effectiveLabelWidth <= 72 && width >= 185) relaxBy = 1;
        if (effectiveLabelWidth <= 44 && width >= 205) relaxBy = 2;
      }

      const currentIndex = densities.indexOf(density);
      if (currentIndex !== -1 && relaxBy > 0) {
        density = densities[Math.max(0, currentIndex - relaxBy)];
      }

      mainLine.dataset.leftDensity = density;
    });
  }

  _applyInsideLabelDensity() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.bar-inner-label').forEach(innerLabel => {
      const track = innerLabel.closest('.bar-track');
      const mainLine = innerLabel.closest('.main-line');
      const nameEl = innerLabel.querySelector('.inside-name');
      const valueEl = innerLabel.querySelector('.inside-value');
      if (!track || !nameEl || !valueEl) return;

      const trackWidth = track.getBoundingClientRect().width;
      const valueDisplay = this._decodeDataAttr(valueEl.dataset.display || valueEl.textContent || '');
      const valueUnit = this._decodeDataAttr(valueEl.dataset.unit || valueEl.querySelector('.inside-unit')?.textContent || '');
      const valueWidth = this._measureInsideValueMarkupWidth(valueEl, valueDisplay, valueUnit);
      let density = this._classifyInsideDensity(trackWidth, valueWidth);
      const rowWidth = typeof mainLine?.getBoundingClientRect === 'function'
        ? mainLine.getBoundingClientRect().width
        : 0;
      const rowDensity = this._isReliableWidth(rowWidth)
        ? this._classifyRowDensity(rowWidth, mainLine?.dataset?.rowDensity || 'normal')
        : (mainLine?.dataset?.rowDensity || 'normal');
      const iconWrap = mainLine?.querySelector?.('.icon-wrap') ?? null;
      let hideIcon = rowDensity === 'dense' || rowDensity === 'compressed';
      let hideName = density === 'dense' || density === 'compressed';
      const reclaimedWidth = iconWrap
        ? this._getLeftModeIconWidth(iconWrap, mainLine) + this._getLeftModeGap(mainLine)
        : 0;

      if (!hideIcon && valueWidth > this._getInsideValueVisibleCap(trackWidth, density)) {
        hideIcon = true;
      }

      if (iconWrap && hideIcon) {
        density = this._classifyInsideDensity(trackWidth + reclaimedWidth, valueWidth);
        hideName = density === 'dense' || density === 'compressed';
      }

      const effectiveTrackWidth = trackWidth + (hideIcon ? reclaimedWidth : 0);
      if (!hideName && valueWidth > this._getInsideValueVisibleCap(effectiveTrackWidth, density)) {
        hideName = true;
      }

      if (rowDensity === 'compressed') {
        density = 'compressed';
        hideIcon = true;
        hideName = true;
      } else if (hideName && density === 'normal') {
        density = 'dense';
      }

      innerLabel.dataset.insideDensity = density;
      innerLabel.dataset.hideName = hideName ? 'true' : 'false';
      if (mainLine) {
        mainLine.dataset.hideInsideIcon = hideIcon ? 'true' : 'false';
      }
    });
  }

  _getInsideValueVisibleCap(trackWidth, density) {
    if (density === 'dense' || density === 'compressed') {
      return trackWidth;
    }
    return trackWidth * 0.56;
  }

  _classifyInsideDensity(trackWidth, valueWidth) {
    if (trackWidth < Math.max(72, valueWidth + 12)) return 'compressed';
    if (trackWidth < valueWidth + 56) return 'dense';
    if (trackWidth < valueWidth + 92) return 'tight';
    if (trackWidth < valueWidth + 128) return 'compact';
    return 'normal';
  }

  _applyRowDensity() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.main-line').forEach(mainLine => {
      const width = mainLine.getBoundingClientRect().width;
      if (!this._isReliableWidth(width)) {
        this._schedulePostLayoutDensityPass();
        if (!mainLine.dataset.rowDensity) mainLine.dataset.rowDensity = 'normal';
        return;
      }
      mainLine.dataset.rowDensity = this._classifyRowDensity(width, mainLine.dataset.rowDensity);
    });
  }

  _applyAboveLabelDensity() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.above-line').forEach(aboveLine => {
      const label = aboveLine.querySelector('.above-bar-label');
      if (!label) return;
      const width = label.getBoundingClientRect().width;
      let density = 'normal';
      if (width < 110) density = 'compressed';
      else if (width < 150) density = 'dense';
      else if (width < 210) density = 'tight';
      else if (width < 280) density = 'compact';
      aboveLine.dataset.aboveDensity = density;
      label.dataset.hideName = density === 'dense' || density === 'compressed' ? 'true' : 'false';
    });
  }

  _measureValueMarkupWidth(valueEl, display, unit, hideUnit) {
    const layer = this.shadowRoot?.querySelector('.measure-layer');
    if (!layer || !valueEl) return 0;
    const clone = valueEl.cloneNode(false);
    clone.removeAttribute('data-hide-unit');
    clone.style.removeProperty('--sbcp-value-extra-width');
    clone.style.width = 'auto';
    clone.style.minWidth = '0';
    clone.style.maxWidth = 'none';
    clone.style.flex = '0 0 auto';
    clone.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
    layer.replaceChildren(clone);
    return clone.scrollWidth;
  }

  _measureInsideValueMarkupWidth(valueEl, display, unit) {
    const layer = this.shadowRoot?.querySelector('.measure-layer');
    if (!layer || !valueEl) return valueEl?.scrollWidth || 0;
    const clone = valueEl.cloneNode(false);
    clone.style.width = 'auto';
    clone.style.minWidth = '0';
    clone.style.maxWidth = 'none';
    clone.style.flex = '0 0 auto';
    clone.style.overflow = 'visible';
    clone.style.textOverflow = 'clip';
    clone.style.whiteSpace = 'nowrap';
    clone.innerHTML = this._formatInsideValueMarkup(display, unit);
    layer.replaceChildren(clone);
    return clone.scrollWidth;
  }

  _measureTextWidthWithStyles(sourceEl, text) {
    const layer = this.shadowRoot?.querySelector('.measure-layer');
    if (!layer || !sourceEl) return 0;
    const clone = sourceEl.cloneNode(false);
    clone.textContent = text;
    clone.style.width = 'auto';
    clone.style.minWidth = '0';
    clone.style.maxWidth = 'none';
    clone.style.flex = '0 0 auto';
    clone.style.overflow = 'visible';
    clone.style.textOverflow = 'clip';
    clone.style.whiteSpace = 'nowrap';
    layer.replaceChildren(clone);
    return clone.scrollWidth;
  }

  _measureVisibleLabelCharacters(labelTextEl, text, visibleWidth) {
    if (!labelTextEl || !text || !Number.isFinite(visibleWidth) || visibleWidth <= 0) return 0;
    const ellipsisWidth = this._measureTextWidthWithStyles(labelTextEl, '...');
    const availableTextWidth = Math.max(0, visibleWidth - ellipsisWidth);
    if (availableTextWidth <= 0) return 0;

    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const width = this._measureTextWidthWithStyles(labelTextEl, text.slice(0, mid));
      if (width <= availableTextWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return low;
  }

  _shouldHideLeftLabel(text, fullWidth, visibleWidth, visibleChars) {
    if (!text) return false;
    if (!Number.isFinite(fullWidth) || !Number.isFinite(visibleWidth)) return false;
    const truncated = fullWidth > visibleWidth + 1;
    return truncated && visibleChars < 5;
  }

  _applyValueWidthReservation() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.value-right').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
      if (!display) {
        valueEl.style.setProperty('--sbcp-value-extra-width', '0px');
        return;
      }

      const getStyle =
        (typeof globalThis.getComputedStyle === 'function' && globalThis.getComputedStyle.bind(globalThis))
        || (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function' && window.getComputedStyle.bind(window))
        || (valueEl?.ownerDocument?.defaultView?.getComputedStyle?.bind(valueEl.ownerDocument.defaultView));
      if (!getStyle) return;
      const style = getStyle(valueEl);
      const baseWidth = parseFloat(style.getPropertyValue('--sbcp-value-width')) || valueEl.clientWidth || 0;
      const desiredWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
      const extraWidth = Math.max(0, desiredWidth - baseWidth);
      valueEl.style.setProperty('--sbcp-value-extra-width', `${extraWidth}px`);
    });
  }

  _applyValueVisibility() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.value-right').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');

      if (valueEl.dataset.hideUnit !== 'false') {
        valueEl.dataset.hideUnit = 'false';
        valueEl.innerHTML = this._formatRightValueMarkup(display, unit, false);
      }
    });
  }

  _getMinimumBarShare() {
    return 0.5;
  }

  _getMinimumBarShareHysteresis() {
    return 0.02;
  }

  _getTopValueEnableShare() {
    return this._getMinimumBarShare() - this._getMinimumBarShareHysteresis();
  }

  _getTopValueDisableShare() {
    return this._getMinimumBarShare() + this._getMinimumBarShareHysteresis();
  }

  _getNumericStyleValue(el, propertyName, fallback = 0) {
    if (!el) return fallback;
    try {
      const value = parseFloat(getComputedStyle(el).getPropertyValue(propertyName));
      return Number.isFinite(value) ? value : fallback;
    } catch (_err) {
      return fallback;
    }
  }

  _getLeftModeGap(mainLine) {
    const computedGap = this._getNumericStyleValue(mainLine, 'gap', NaN);
    if (Number.isFinite(computedGap)) return computedGap;
    const density = mainLine?.dataset?.rowDensity || 'normal';
    if (density === 'tight') return 7;
    if (density === 'dense' || density === 'compressed') return 6;
    return 8;
  }

  _getLeftModeBarMinWidth(mainLine) {
    const computedMin = this._getNumericStyleValue(mainLine, '--sbcp-bar-min-width', NaN);
    if (Number.isFinite(computedMin)) return computedMin;
    const density = mainLine?.dataset?.leftDensity || 'normal';
    if (density === 'compact') return 52;
    if (density === 'tight') return 48;
    if (density === 'dense') return 44;
    if (density === 'compressed') return 40;
    return 56;
  }

  _getLeftModeIconWidth(iconWrap, mainLine) {
    const measured = iconWrap?.getBoundingClientRect?.().width;
    if (this._isReliableWidth(measured, 1)) return measured;
    const computed = this._getNumericStyleValue(iconWrap || mainLine, '--sbcp-icon-width', NaN);
    if (Number.isFinite(computed)) return computed;
    const density = mainLine?.dataset?.leftDensity || 'normal';
    if (density === 'compact') return 26;
    if (density === 'tight') return 24;
    if (density === 'dense') return 23;
    if (density === 'compressed') return 22;
    return 28;
  }

  _getReservedInlineValueWidth(valueEl) {
    if (!valueEl) return 0;
    const display = this._decodeDataAttr(valueEl.dataset.display || '');
    const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
    const baseWidth = this._getNumericStyleValue(valueEl, '--sbcp-value-width', valueEl.clientWidth || 0);
    const inlineExtra = parseFloat(valueEl.style?.getPropertyValue?.('--sbcp-value-extra-width') || valueEl.style?.['--sbcp-value-extra-width'] || '0');
    const extraWidth = Number.isFinite(inlineExtra)
      ? inlineExtra
      : this._getNumericStyleValue(valueEl, '--sbcp-value-extra-width', 0);
    const reservedWidth = Math.max(0, baseWidth + extraWidth);
    if (!display) return reservedWidth;
    const fullMarkupWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
    return Math.max(reservedWidth, fullMarkupWidth);
  }

  _estimateLeftModeWidthBudget(row) {
    const mainLine = row?.querySelector('.main-line');
    if (!mainLine) return null;
    const rowWidth = mainLine.getBoundingClientRect?.().width ?? 0;
    if (!this._isReliableWidth(rowWidth)) return null;

    const labelWrap = row.querySelector('.label-left');
    const iconWrap = row.querySelector('.icon-wrap');
    const valueEl = row.querySelector('.value-right');
    const labelMetrics = this._getLabelSacrificeMetrics(row, 'left', { rowWidth });
    const labelWidth = labelWrap?.dataset?.hidden === 'true'
      ? 0
      : (
        labelWrap?.getBoundingClientRect?.().width
          ?? labelMetrics?.labelWidth
          ?? 0
      );
    const iconWidth = iconWrap ? this._getLeftModeIconWidth(iconWrap, mainLine) : 0;
    const valueWidth = this._getReservedInlineValueWidth(valueEl);
    const gap = this._getLeftModeGap(mainLine);
    const barMinWidth = this._getLeftModeBarMinWidth(mainLine);
    const baseLabelVisible = !!labelWrap && labelWrap.dataset.hidden !== 'true';
    const labelSacrificial = baseLabelVisible
      ? this._isLabelWorthSacrificing(row, 'left', { rowWidth })
      : true;
    const hasIcon = !!iconWrap;

    return {
      rowWidth,
      gap,
      barMinWidth,
      labelWidth: this._isReliableWidth(labelWidth, 0) ? labelWidth : 0,
      iconWidth: this._isReliableWidth(iconWidth, 0) ? iconWidth : 0,
      valueWidth: this._isReliableWidth(valueWidth, 0) ? valueWidth : 0,
      baseLabelVisible,
      labelSacrificial,
      hasIcon,
      mainLine,
      labelWrap,
      iconWrap,
      valueEl,
      rowStack: row.querySelector('.row-stack'),
    };
  }

  _predictLeftModeBarShareForState(row, state, budget = null) {
    const effectiveBudget = budget || this._estimateLeftModeWidthBudget(row);
    if (!effectiveBudget) return null;

    const showLabel = effectiveBudget.baseLabelVisible && !state.hideLabel;
    const showIcon = effectiveBudget.hasIcon && !state.hideIcon;
    const showInlineValue = !state.topValue;
    const visibleItems = 1 + (showIcon ? 1 : 0) + (showLabel ? 1 : 0) + (showInlineValue ? 1 : 0);
    const gapCount = Math.max(0, visibleItems - 1);
    const reservedWidth =
      (showIcon ? effectiveBudget.iconWidth : 0) +
      (showLabel ? effectiveBudget.labelWidth : 0) +
      (showInlineValue ? effectiveBudget.valueWidth : 0) +
      (gapCount * effectiveBudget.gap);
    const predictedBarWidth = Math.max(0, effectiveBudget.rowWidth - reservedWidth);

    return {
      rowWidth: effectiveBudget.rowWidth,
      barWidth: predictedBarWidth,
      share: predictedBarWidth / effectiveBudget.rowWidth,
      showLabel,
      showIcon,
      showInlineValue,
      reservedWidth,
      gapCount,
    };
  }

  _getLeftModeCandidateStates(budget) {
    const states = [
      { hideLabel: false, topValue: false, hideIcon: false },
    ];
    if (budget?.labelSacrificial) {
      states.push({ hideLabel: true, topValue: false, hideIcon: false });
    }
    states.push(
      { hideLabel: false, topValue: true, hideIcon: false },
      { hideLabel: true, topValue: true, hideIcon: false },
      { hideLabel: true, topValue: true, hideIcon: true },
    );
    return states;
  }

  _chooseFirstPredictedLeftModeState(row, states, threshold, budget) {
    for (const state of states) {
      const predicted = this._predictLeftModeBarShareForState(row, state, budget);
      if (!predicted) continue;
      if (predicted.share >= threshold) return { ...state, predicted };
    }
    return null;
  }

  _chooseFallbackPredictedLeftModeState(row, states, budget) {
    let fallback = null;
    for (const state of states) {
      const predicted = this._predictLeftModeBarShareForState(row, state, budget);
      if (!predicted) continue;
      fallback = { ...state, predicted };
    }
    return fallback;
  }

  _chooseLeftModeResponsiveState(row) {
    const budget = this._estimateLeftModeWidthBudget(row);
    if (!budget) return null;
    const minimumBarShare = this._getMinimumBarShare();
    const states = this._getLeftModeCandidateStates(budget);
    const previousTopValue = budget.rowStack?.dataset?.forceTopValue === 'true';
    const inlineStates = states.filter(state => !state.topValue);
    const topStates = states.filter(state => state.topValue);
    const enableShare = this._getTopValueEnableShare();
    const disableShare = this._getTopValueDisableShare();

    const inlineChoice = previousTopValue
      ? this._chooseFirstPredictedLeftModeState(row, inlineStates, disableShare, budget)
      : this._chooseFirstPredictedLeftModeState(row, inlineStates, enableShare, budget);
    if (inlineChoice) return inlineChoice;

    const topChoice =
      this._chooseFirstPredictedLeftModeState(row, topStates, minimumBarShare, budget)
      || this._chooseFallbackPredictedLeftModeState(row, topStates, budget);
    return topChoice;
  }

  _applyLeftModeResponsiveState(row, state) {
    const mainLine = row?.querySelector('.main-line');
    const rowStack = row?.querySelector('.row-stack');
    const leftLabel = row?.querySelector('.label-left');
    if (!mainLine || !rowStack) return;

    delete rowStack.dataset.forceTopValue;
    delete mainLine.dataset.hideLeftIcon;
    if (leftLabel) delete leftLabel.dataset.priorityHidden;

    if (state?.hideLabel && leftLabel) {
      leftLabel.dataset.priorityHidden = 'true';
    }
    if (state?.topValue) {
      rowStack.dataset.forceTopValue = 'true';
    }
    if (state?.hideIcon) {
      mainLine.dataset.hideLeftIcon = 'true';
    }
  }

  _getMeasuredBarShare(row) {
    const mainLine = row?.querySelector('.main-line');
    const track = row?.querySelector('.bar-track');
    if (!mainLine || !track) return null;
    const rowWidth = mainLine.getBoundingClientRect().width;
    const barWidth = track.getBoundingClientRect().width;
    if (!this._isReliableWidth(rowWidth) || !this._isReliableWidth(barWidth, 1)) return null;
    return { rowWidth, barWidth, share: barWidth / rowWidth, mainLine, track };
  }

  _clearMinimumBarShareOverrides(row) {
    const mainLine = row?.querySelector('.main-line');
    const rowStack = row?.querySelector('.row-stack');
    const leftLabel = row?.querySelector('.label-left');
    const aboveLabel = row?.querySelector('.above-bar-label');
    const innerLabel = row?.querySelector('.bar-inner-label');
    const aboveLine = row?.querySelector('.above-line');
    if (rowStack) delete rowStack.dataset.forceTopValue;
    if (leftLabel) delete leftLabel.dataset.priorityHidden;
    if (aboveLabel) delete aboveLabel.dataset.priorityHideName;
    if (innerLabel) delete innerLabel.dataset.priorityHideName;
    if (aboveLine) delete aboveLine.dataset.hideAboveIcon;
    if (!mainLine) return;
    delete mainLine.dataset.hideLeftIcon;
    delete mainLine.dataset.hideAboveIcon;
    delete mainLine.dataset.priorityHideInsideIcon;
  }

  _hideMinimumBarShareLabel(row, mode) {
    if (mode === 'left') {
      const leftLabel = row.querySelector('.label-left');
      if (leftLabel) leftLabel.dataset.priorityHidden = 'true';
      return;
    }
    if (mode === 'above') {
      const aboveLabel = row.querySelector('.above-bar-label');
      if (aboveLabel) aboveLabel.dataset.priorityHideName = 'true';
      return;
    }
    if (mode === 'inside') {
      const innerLabel = row.querySelector('.bar-inner-label');
      if (innerLabel) innerLabel.dataset.priorityHideName = 'true';
    }
  }

  _forceMinimumBarShareTopValue(row, mode) {
    if (mode !== 'left') return;
    const rowStack = row.querySelector('.row-stack');
    if (rowStack) rowStack.dataset.forceTopValue = 'true';
  }

  _hideMinimumBarShareIcon(row, mode) {
    const mainLine = row.querySelector('.main-line');
    if (!mainLine) return;
    if (mode === 'left') {
      mainLine.dataset.hideLeftIcon = 'true';
      return;
    }
    if (mode === 'above') {
      mainLine.dataset.hideAboveIcon = 'true';
      const aboveLine = row.querySelector('.above-line');
      if (aboveLine) aboveLine.dataset.hideAboveIcon = 'true';
      return;
    }
    if (mode === 'inside') {
      mainLine.dataset.priorityHideInsideIcon = 'true';
    }
  }

  _getLabelSacrificeMetrics(row, mode, measurement) {
    const rowWidth = measurement?.rowWidth ?? row?.querySelector('.main-line')?.getBoundingClientRect?.().width ?? 0;
    if (!this._isReliableWidth(rowWidth)) return null;

    if (mode === 'left') {
      const labelWrap = row.querySelector('.label-left');
      const labelText = row.querySelector('.label-left-text');
      if (!labelWrap || !labelText) return null;
      const text = (labelText.textContent || '').trim();
      const visibleWidth = labelText.clientWidth;
      const fullWidth = labelText.scrollWidth;
      const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
      const labelWidth = labelWrap.getBoundingClientRect?.().width ?? visibleWidth;
      return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
    }

    if (mode === 'above') {
      const labelText = row.querySelector('.above-bar-label-name');
      if (!labelText) return null;
      const text = (labelText.textContent || '').trim();
      const visibleWidth = labelText.clientWidth;
      const fullWidth = labelText.scrollWidth;
      const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
      const labelWidth = labelText.getBoundingClientRect?.().width ?? visibleWidth;
      return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
    }

    if (mode === 'inside') {
      const labelText = row.querySelector('.inside-name');
      if (!labelText) return null;
      const text = (labelText.textContent || '').trim();
      const visibleWidth = labelText.clientWidth;
      const fullWidth = labelText.scrollWidth;
      const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
      const labelWidth = labelText.getBoundingClientRect?.().width ?? visibleWidth;
      return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
    }

    return null;
  }

  _isLabelWorthSacrificing(row, mode, measurement) {
    const metrics = this._getLabelSacrificeMetrics(row, mode, measurement);
    if (!metrics || !metrics.text) return false;
    return this._shouldHideLeftLabel(metrics.text, metrics.fullWidth, metrics.visibleWidth, metrics.visibleChars);
  }

  _ensureMinimumBarShare(rows = null) {
    if (!this.shadowRoot) return;
    const targetRows = rows || this.shadowRoot.querySelectorAll('.row[data-entity]');
    const minimumBarShare = this._getMinimumBarShare();
    targetRows.forEach((row) => {
      const mainLine = row.querySelector('.main-line');
      if (!mainLine) return;
      const mode = mainLine.classList.contains('left-mode')
        ? 'left'
        : mainLine.classList.contains('above-mode')
          ? 'above'
          : mainLine.classList.contains('inside-mode')
            ? 'inside'
            : 'other';
      if (mode === 'other') return;

      if (mode === 'left') {
        const state = this._chooseLeftModeResponsiveState(row);
        if (state) this._applyLeftModeResponsiveState(row, state);
        return;
      }

      this._clearMinimumBarShareOverrides(row);

      let measurement = this._getMeasuredBarShare(row);
      if (!measurement || measurement.share >= minimumBarShare) return;

      if (this._isLabelWorthSacrificing(row, mode, measurement)) {
        this._hideMinimumBarShareLabel(row, mode);
        measurement = this._getMeasuredBarShare(row);
        if (!measurement || measurement.share >= minimumBarShare) return;
      }

      this._forceMinimumBarShareTopValue(row, mode);
      this._applyTopRightValueLayout();
      measurement = this._getMeasuredBarShare(row);
      if (!measurement || measurement.share >= minimumBarShare) return;

      this._hideMinimumBarShareIcon(row, mode);
    });
  }

  _shouldUseTopValueRow(mainLine) {
    if (!mainLine?.classList?.contains('left-mode')) return false;
    return mainLine.closest?.('.row-stack')?.dataset.forceTopValue === 'true';
  }

  _getAdaptiveDensityForMainLine(mainLine) {
    if (!mainLine) return 'normal';
    if (mainLine.classList?.contains('left-mode')) {
      return mainLine.dataset.leftDensity || 'normal';
    }
    return mainLine.dataset.rowDensity || 'normal';
  }

  _getAdaptiveDefaultHeightForDensity(density) {
    if (density === 'compressed') return 24;
    if (density === 'dense') return 28;
    return 38;
  }

  _getEffectiveRowHeight(baseHeight, heightExplicit, mainLine) {
    if (heightExplicit) return this._clampSupportedRowHeight(baseHeight);
    return this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(mainLine)));
  }

  _applyAdaptiveRowHeight() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.row[data-entity]').forEach((row) => {
      const mainLine = row.querySelector('.main-line');
      const rowStack = row.querySelector('.row-stack');
      if (!mainLine) return;
      const baseHeight = parseFloat(row.dataset.baseHeight || '38') || 38;
      const explicit = row.dataset.heightExplicit === 'true';
      const effectiveHeight = this._getEffectiveRowHeight(baseHeight, explicit, mainLine);
      row.style.setProperty('--sbcp-row-height', `${effectiveHeight}px`);
      if (rowStack) rowStack.style.setProperty('--sbcp-row-height', `${effectiveHeight}px`);
      mainLine.style.height = `${effectiveHeight}px`;
      const labelLeft = mainLine.querySelector('.label-left');
      if (labelLeft) labelLeft.style.height = `${effectiveHeight}px`;
      const iconWrap = mainLine.querySelector('.icon-wrap');
      if (iconWrap) {
        iconWrap.style.height = `${effectiveHeight}px`;
        iconWrap.style.minHeight = `${effectiveHeight}px`;
      }
      const track = mainLine.querySelector('.bar-track');
      if (track) track.style.height = `${effectiveHeight}px`;
      const inlineValue = mainLine.querySelector('.value-right');
      if (inlineValue) inlineValue.style.height = `${effectiveHeight}px`;
    });
  }

  _applyTopRightValueLayout() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach((mainLine) => {
      const rowStack = mainLine.closest('.row-stack');
      const inlineValue = mainLine.querySelector('.value-right');
      const topValue = rowStack?.querySelector('.top-right-value');
      if (!rowStack || !inlineValue || !topValue) return;

      const active = this._shouldUseTopValueRow(mainLine);
      rowStack.dataset.topValue = active ? 'true' : 'false';
      topValue.dataset.active = active ? 'true' : 'false';

      const display = this._decodeDataAttr(inlineValue.dataset.display || '');
      const unit = this._decodeDataAttr(inlineValue.dataset.unit || '');
      topValue.dataset.display = inlineValue.dataset.display || '';
      topValue.dataset.unit = inlineValue.dataset.unit || '';
      topValue.dataset.hideUnit = 'false';
      topValue.innerHTML = this._formatRightValueMarkup(display, unit, false);
    });
  }

  _applyLeftLabelUsefulness() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach(mainLine => {
      const labelWrap = mainLine.querySelector('.label-left');
      const labelText = mainLine.querySelector('.label-left-text');
      if (!labelWrap || !labelText) return;

      labelWrap.dataset.hidden = 'false';

      const text = (labelText.textContent || '').trim();
      const fullWidth = labelText.scrollWidth;
      const visibleWidth = labelText.clientWidth;
      const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
      const shouldHide = this._shouldHideLeftLabel(text, fullWidth, visibleWidth, visibleChars);

      labelWrap.dataset.hidden = shouldHide ? 'true' : 'false';
    });
  }

  _runPostLayoutPasses(rows = null) {
    requestAnimationFrame(() => {
      this._applyRowDensity();
      this._applyLeftModeDensity();
      this._applyAboveLabelDensity();
      this._applyInsideLabelDensity();
      this._applyValueWidthReservation();

      requestAnimationFrame(() => {
        this._applyAdaptiveRowHeight();
        this._applyValueVisibility();
        this._applyLeftLabelUsefulness();
        this._applyTopRightValueLayout();
        this._ensureMinimumBarShare(rows);
        this._applyTopRightValueLayout();
        this._applyLeftLabelUsefulness();
        const targetRows = rows || this.shadowRoot?.querySelectorAll('.row[data-entity]') || [];
        targetRows.forEach(row => {
          this._positionTargetLabel(row);
        });
      });
    });
  }

  _isTightUnit(unit) {
    return ['h', 'm', 's'].includes(String(unit || '').trim());
  }

  _encodeDataAttr(value) {
    return encodeURIComponent(String(value ?? ''));
  }

  _decodeDataAttr(value) {
    return decodeURIComponent(String(value ?? ''));
  }

  _parseColorToRgb(color) {
    const value = String(color || '').trim();
    if (!value) return null;

    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const full = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
      };
    }

    const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(p => p.trim());
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

  _rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l: l * 100 };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;

    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  _getMarkerContrastColor(color) {
    const rgb = this._parseColorToRgb(color);
    if (!rgb) return '#f3f4f6';

    const { h, s, l } = this._rgbToHsl(rgb);
    const contrastL = Math.abs(l - 90) >= Math.abs(l - 10) ? 90 : 10;
    const contrastS = Math.max(40, Math.min(100, s));
    return `hsl(${Math.round(h)} ${Math.round(contrastS)}% ${Math.round(contrastL)}%)`;
  }

  _getNeedleBorderColor(color) {
    const rgb = this._parseColorToRgb(color);
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

  _formatDisplayWithUnit(display, unit) {
    if (!unit) return String(display);
    const cleanUnit = String(unit);
    return `${display}${this._isTightUnit(cleanUnit) ? '' : ' '}${cleanUnit}`;
  }

  _formatRightValueMarkup(display, unit, hideUnit = false) {
    if (!unit || hideUnit) {
      return `<span class="value-right-text"><span class="value-right-number">${display}</span></span>`;
    }
    const cleanUnit = String(unit);
    const tightUnit = this._isTightUnit(cleanUnit);
    const textClass = tightUnit ? 'value-right-text tight-unit' : 'value-right-text has-unit';
    return `<span class="${textClass}"><span class="value-right-number">${display}</span><span class="unit-group"><span class="unit">${cleanUnit}</span></span></span>`;
  }

  _formatAboveValueMarkup(display, unit) {
    return `<span class="above-bar-label-value">${this._formatRightValueMarkup(display, unit, false)}</span>`;
  }

  _formatInsideValueMarkup(display, unit) {
    if (!unit) return `<span class="inside-value-text"><span class="inside-number">${display}</span></span>`;
    const cleanUnit = String(unit);
    const unitModeClass = this._isTightUnit(cleanUnit) ? 'tight-unit' : 'has-unit';
    return `<span class="inside-value-text ${unitModeClass}"><span class="inside-number">${display}</span><span class="inside-unit">${cleanUnit}</span></span>`;
  }

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor, minValue, maxValue) {
    const ecfg = this._resolve(entityCfg);
    const layout = ecfg.layout;
    const bar = ecfg.bar;
    const targetMarkerCfg = ecfg.target_marker;
    const peakMarkerCfg = ecfg.peak_marker;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const baselinePct = this._resolveBaselinePct(ecfg, safeMin, safeMax);
    const lp   = layout.label.position;
    const h    = layout.height;
    const name = ecfg.name
      || this._hass?.states[entityCfg.entity]?.attributes?.friendly_name
      || entityCfg.entity;
    const targetEnabled = targetMarkerCfg?.enabled !== false;
    const peakMarkerColor = peakColor || '#888';
    const targetMarkerColor = targetColor || '#888';
    const peakContrastColor = this._getMarkerContrastColor(peakMarkerColor);
    const targetContrastColor = this._getMarkerContrastColor(targetMarkerColor);
    const rawValue = this._getFiniteNumber(stateDisplay);
    const needleState = this._getNeedleRenderState(rawValue, ecfg, safeMin, safeMax, baselinePct);
    const fillState = this._getFillRenderState(pct, 'var(--sbcp-row-height)', ecfg, color, targetPct, baselinePct, safeMin, safeMax, needleState.show);

    // Peak marker — chevron top, line full height, configurable colour
    const peakMarker = peakMarkerCfg.show && peakPct !== null ? `
      <div class="peak-marker" style="left:${peakPct}%;--marker-color:${peakMarkerColor};--marker-contrast-color:${peakContrastColor};">
        <div class="peak-outset"></div>
        <div class="peak-inset"></div>
      </div>` : '';

    // Target marker — same but chevron at bottom pointing up
    const targetMarker = `
      <div class="target-marker" style="left:${targetPct !== null ? targetPct : 0}%;--marker-color:${targetMarkerColor};--marker-contrast-color:${targetContrastColor};display:${targetPct !== null ? '' : 'none'};">
        <div class="target-inset"></div>
        <div class="target-outset"></div>
      </div>`;
    const targetValueLabel = targetEnabled && targetMarkerCfg.show_label ? `
      <div class="target-value-label" style="left:${targetPct !== null ? targetPct : 0}%;">
        ${targetDisplay !== null ? targetDisplay : ''}
      </div>` : '';
    const needleMarker = ecfg.bar?.needle?.show && !Number.isFinite(baselinePct) ? `
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${needleState.edge}" style="left:${needleState.pct ?? 0}%;--needle-color:${needleState.color};--needle-border-color:${needleState.borderColor};display:${needleState.show ? 'block' : 'none'};"></div>
      </div>` : '';
    const paintLayers = fillState.paintLayers.map(layer => `
                  <div class="bar-paint-layer" data-layer="${layer.id}" style="z-index:${layer.zIndex};${layer.paintStyle}${layer.revealStyle}"></div>`).join('');
    const aboveLabel = lp === 'above' ? `
      <div class="above-line">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="above-icon-spacer"></div>` : ''}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${name}</span>
          ${this._formatAboveValueMarkup(stateDisplay, unit)}
        </div>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span class="inside-name">${name}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}">${this._formatInsideValueMarkup(stateDisplay, unit)}</span>
      </div>` : '';

    const leftLabel  = lp === 'left'
      ? `<div class="label-left" style="flex:0 1 min(${layout.label.width}px, var(--sbcp-left-label-share));max-width:min(${layout.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${name}</span></div>`
      : '';
    const rightValue = lp !== 'inside' && lp !== 'above'
      ? `<div class="value-right" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>`
      : '';
    const topRightValue = lp === 'left'
      ? `<div class="top-right-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>`
      : '';
      
    return `
      <div class="row" data-entity="${entityCfg.entity}" data-base-height="${h}" data-height-explicit="${layout.height_explicit ? 'true' : 'false'}" data-bar-animated="${bar.animated ? 'true' : 'false'}">
        <div class="row-stack" style="--sbcp-row-height:${h}px;">
          ${aboveLabel}
          ${topRightValue}
          <div class="main-line ${lp}-mode" style="height:${h}px;">
            ${ecfg.icon && ecfg.icon !== false ? `<div class="icon-wrap"><ha-icon icon="${ecfg.icon}"></ha-icon></div>` : ''}
            ${leftLabel}
            <div class="bar-wrap">
              <div class="bar-track">
                <div class="bar-fill-reveal${bar.animated ? '' : ' no-anim'}" style="${fillState.revealStyle}">
${paintLayers}
                </div>
                ${innerLabel}
                ${peakMarker}
                ${targetMarker}
                ${needleMarker}
              </div>
              ${targetValueLabel}
            </div>
            ${rightValue}
          </div>
        </div>
      </div>`;
  }

  _patchRow(row, entityCfg, stateObj) {
    if (!row || !stateObj) return;

    const ecfg = this._resolve(entityCfg);
    const rawVal = parseFloat(stateObj.state);
    const unit = ecfg.formatting.unit ?? stateObj.attributes?.unit_of_measurement ?? '';
    const minVal = this._getNormalizedResolvableNumericValue(ecfg.scale.min);
    const maxVal = this._getNormalizedResolvableNumericValue(ecfg.scale.max);
    const safeMin = Number.isFinite(minVal) ? minVal : 0;
    const safeMax = Number.isFinite(maxVal) ? maxVal : 100;
    const targetVal = ecfg.target_marker?.enabled === false
      ? null
      : this._getNormalizedResolvableNumericValue(ecfg.target_marker.source, safeMin, safeMax);
    const isNumericState = Number.isFinite(rawVal);
    const pct = Number.isFinite(rawVal)
      ? this._toScalePct(rawVal, safeMin, safeMax)
      : 0;
    const color = this._getColor(pct, ecfg, safeMin, safeMax);
    const display = isNaN(rawVal) ? stateObj.state : this._formatNumericDisplay(rawVal, ecfg.formatting.decimal);
    const displayUnit = isNumericState ? unit : '';

    const fillReveal = row.querySelector('.bar-fill-reveal');
    const paintLayer = row.querySelector('.bar-paint-layer[data-layer="base"]');
    let liveTargetPct = null;
    if (targetVal !== null) {
      liveTargetPct = this._toScalePct(targetVal, safeMin, safeMax);
    }
    const liveBaselinePct = this._resolveBaselinePct(ecfg, safeMin, safeMax);
    const needleState = this._getNeedleRenderState(rawVal, ecfg, safeMin, safeMax, liveBaselinePct);
    const fillState = this._getFillRenderState(pct, 'var(--sbcp-row-height)', ecfg, color, liveTargetPct, liveBaselinePct, safeMin, safeMax, needleState.show);

    if (fillReveal) {
      this._setStyleTextIfChanged(fillReveal, fillState.revealStyle);
      this._setClassNameIfChanged(fillReveal, `bar-fill-reveal${ecfg.bar.animated ? '' : ' no-anim'}`);
    }
    if (paintLayer) {
      const baseLayerState = fillState.paintLayers.find(layer => layer.id === 'base');
      if (baseLayerState) {
        this._setStyleTextIfChanged(paintLayer, `z-index:${baseLayerState.zIndex};${baseLayerState.paintStyle}${baseLayerState.revealStyle}`);
      }
    }
    const aboveTargetLayer = row.querySelector('.bar-paint-layer[data-layer="above-target"]');
    if (aboveTargetLayer) {
      const aboveTargetState = fillState.paintLayers.find(layer => layer.id === 'above-target');
      if (aboveTargetState) {
        this._setStyleTextIfChanged(aboveTargetLayer, `z-index:${aboveTargetState.zIndex};${aboveTargetState.paintStyle}${aboveTargetState.revealStyle}`);
      }
    }
    const needleEl = row.querySelector('.needle-marker');
    if (needleEl) {
      this._setStyleIfChanged(needleEl, 'display', needleState.show ? 'block' : 'none');
      this._setStyleIfChanged(needleEl, 'left', `${needleState.pct ?? 0}%`);
      this._setStyleIfChanged(needleEl, '--needle-color', needleState.color);
      this._setStyleIfChanged(needleEl, '--needle-border-color', needleState.borderColor);
      this._setDatasetIfChanged(needleEl, 'edge', needleState.edge);
    }
    this._setDatasetIfChanged(row, 'baseHeight', ecfg.layout.height);
    this._setDatasetIfChanged(row, 'heightExplicit', ecfg.layout.height_explicit ? 'true' : 'false');
    this._setDatasetIfChanged(row, 'barAnimated', ecfg.bar.animated ? 'true' : 'false');

    const valueEl = row.querySelector('.value-right');
    if (valueEl) {
      valueEl.dataset.display = this._encodeDataAttr(display);
      valueEl.dataset.unit = this._encodeDataAttr(displayUnit);
      valueEl.dataset.hideUnit = 'false';
      valueEl.innerHTML = this._formatRightValueMarkup(display, displayUnit, false);
    }
    const topValueEl = row.querySelector('.top-right-value');
    if (topValueEl) {
      topValueEl.dataset.display = this._encodeDataAttr(display);
      topValueEl.dataset.unit = this._encodeDataAttr(displayUnit);
      topValueEl.dataset.hideUnit = 'false';
      topValueEl.innerHTML = this._formatRightValueMarkup(display, displayUnit, false);
    }
    const innerLabel = row.querySelector('.bar-inner-label');
    if (innerLabel) {
      const valueSpan = innerLabel.querySelector('.inside-value');
      if (valueSpan) {
        valueSpan.dataset.display = this._encodeDataAttr(display);
        valueSpan.dataset.unit = this._encodeDataAttr(displayUnit);
        valueSpan.innerHTML = this._formatInsideValueMarkup(display, displayUnit);
      }
    }
    const aboveLabel = row.querySelector('.above-bar-label');
    if (aboveLabel) {
      aboveLabel.innerHTML = `<span class="above-bar-label-name label-left-text">${ecfg.name || stateObj.attributes?.friendly_name || entityCfg.entity}</span>${this._formatAboveValueMarkup(display, displayUnit)}`;
    }

    if (ecfg.peak_marker.show && !isNaN(rawVal)) {
      const key = entityCfg.entity;
      if (this._peaks[key] === undefined || rawVal > this._peaks[key]) {
        this._peaks[key] = rawVal;
      }
      const peakVal = this._peaks[key];
      const peakPct = this._toScalePct(peakVal, safeMin, safeMax);
      const peakEl = row.querySelector('.peak-marker');
      if (peakEl) {
        this._setStyleIfChanged(peakEl, 'left', `${peakPct}%`);
        this._setStyleIfChanged(peakEl, '--marker-color', ecfg.peak_marker.color);
        this._setStyleIfChanged(peakEl, '--marker-contrast-color', this._getMarkerContrastColor(ecfg.peak_marker.color));
      }
    }

    const targetEl = row.querySelector('.target-marker');
    const targetLabelEl = row.querySelector('.target-value-label');
    if (targetVal !== null) {
      const targetPct = this._toScalePct(targetVal, safeMin, safeMax);
      if (targetEl) {
        this._setStyleIfChanged(targetEl, 'display', '');
        this._setStyleIfChanged(targetEl, 'left', `${targetPct}%`);
        this._setStyleIfChanged(targetEl, '--marker-color', ecfg.target_marker.color);
        this._setStyleIfChanged(targetEl, '--marker-contrast-color', this._getMarkerContrastColor(ecfg.target_marker.color));
      }

      if (targetLabelEl) {
        // Round the Target Value displayed to correct decimal format
        this._setTextIfChanged(targetLabelEl, this._formatDisplayWithUnit(this._formatNumericDisplay(targetVal, ecfg.formatting.decimal), unit));		  
      }
    } else {
      if (targetEl) this._setStyleIfChanged(targetEl, 'display', 'none');

      if (targetLabelEl) this._setStyleIfChanged(targetLabelEl, 'visibility', 'hidden');
    }
  }

  _update() {
    if (!this._hass || !this._config) return;
    const rowsEl = this.shadowRoot.querySelector('.rows');
    if (!rowsEl) return;

    const entities = this._config.entities;

    // First render: build all rows from scratch
    if (!this._rendered) {
      let html = '';
      for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
        const entityCfg = entities[entityIndex];
        const stateObj = this._hass.states[entityCfg.entity];
        if (!stateObj) {
          html += `<div class="row"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${entityCfg.entity}</span></div>`;
          continue;
        }
        const ecfg      = this._resolve(entityCfg);
        const rawVal    = parseFloat(stateObj.state);
        const unit      = ecfg.formatting.unit ?? stateObj.attributes?.unit_of_measurement ?? '';
        const minVal    = this._getNormalizedResolvableNumericValue(ecfg.scale.min);
        const maxVal    = this._getNormalizedResolvableNumericValue(ecfg.scale.max);
        const safeMin   = Number.isFinite(minVal) ? minVal : 0;
        const safeMax   = Number.isFinite(maxVal) ? maxVal : 100;
        const targetVal = ecfg.target_marker?.enabled === false
          ? null
          : this._getNormalizedResolvableNumericValue(ecfg.target_marker.source, safeMin, safeMax);
        const isNumericState = Number.isFinite(rawVal);
        const pct = Number.isFinite(rawVal)
          ? this._toScalePct(rawVal, safeMin, safeMax)
          : 0;        
        const color     = this._getColor(pct, ecfg, safeMin, safeMax);
        const display   = isNaN(rawVal) ? stateObj.state : this._formatNumericDisplay(rawVal, ecfg.formatting.decimal);
        const displayUnit = isNumericState ? unit : '';
        let targetPct   = null;
        if (targetVal !== null) {
          targetPct = this._toScalePct(targetVal, safeMin, safeMax);
        }
        let targetDisplay = null;
        if (targetVal !== null) {
          // Round the Target Value displayed to correct decimal format                   
          targetDisplay = this._formatDisplayWithUnit(this._formatNumericDisplay(targetVal, ecfg.formatting.decimal), unit);			
        }
        let peakPct = null, peakDisplay = null;
        if (ecfg.peak_marker.show && !isNaN(rawVal)) {
          if (this._peaks[entityCfg.entity] === undefined || rawVal > this._peaks[entityCfg.entity]) {
            this._peaks[entityCfg.entity] = rawVal;
          }
          const peakVal = this._peaks[entityCfg.entity];
          peakPct = this._toScalePct(peakVal, safeMin, safeMax);
          peakDisplay = this._formatNumericDisplay(peakVal, ecfg.formatting.decimal);
        }
        html += this._buildRow(entityCfg, display, displayUnit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, ecfg.peak_marker.color, ecfg.target_marker.color, safeMin, safeMax);
      }
      rowsEl.innerHTML = html;
      this._rendered = true;

      const builtRows = rowsEl.querySelectorAll('.row[data-entity]');
      builtRows.forEach((row, idx) => {
        const entityCfg = entities[idx];
        const stateObj = entityCfg ? this._hass.states[entityCfg.entity] : null;
        if (entityCfg && stateObj) {
          this._patchRow(row, entityCfg, stateObj);
        }
      });
      this._runPostLayoutPasses(builtRows);
      
      // Attach click handlers
      builtRows.forEach(row => {
        row.addEventListener('click', () => {
          const entityId = row.dataset.entity;
          const event = new CustomEvent('hass-more-info', { composed: true, detail: { entityId } });
          this.dispatchEvent(event);
        });
      });
      return;
    }

    // Subsequent renders: patch only what changed, preserving DOM for smooth transitions
    const rows = rowsEl.querySelectorAll('.row[data-entity]');
    let rowIdx = 0;
    for (const entityCfg of entities) {
      const stateObj = this._hass.states[entityCfg.entity];
      if (!stateObj) { rowIdx++; continue; }

      const row = rows[rowIdx];
      if (!row) { rowIdx++; continue; }
      this._patchRow(row, entityCfg, stateObj);
      rowIdx++;
    }
    this._runPostLayoutPasses(rows);
  }
  
  disconnectedCallback() {
    if (this._densityPassFrame !== null) {
      cancelAnimationFrame(this._densityPassFrame);
      this._densityPassFrame = null;
    }
    this._densityPassScheduled = false;
    this._densityPassRetries = 0;
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}

class SensorBarCardPlusEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._draftConfig = {};
    this._hass = null;
    this._isRendering = false;
    this._renderScheduled = false;
    this._lastRenderedConfigJson = null;
    this._lastEmittedConfigJson = null;
    this._shadowListenersAttached = false;
    this._expandedEntityOverrides = new Set();
    this._expandedOverrideGroups = new Set();
    this._expandedCardGroups = new Set();
    this._gradientStopsDrafts = new Map();
    this._gradientStopsUiRows = new Map();
    this._gradientStopPosTexts = new Map();
    this._gradientStopValidationMessages = new Map();
    this._segmentDrafts = new Map();
    this._segmentUiRows = new Map();
    this._segmentBoundaryTexts = new Map();
    this._targetAboveFillDrafts = new Map();
    this._baselineColorDrafts = new Map();
    this._pendingFocusSelector = null;
    this._boundHandleClick = (event) => this._handleClick(event);
    this._boundHandleChange = (event) => this._handleChange(event);
    this._boundHandleInput = (event) => this._handleInput(event);
    this._boundHandleValueChanged = (event) => this._handleValueChanged(event);
    this._boundHandleKeydown = (event) => this._handleKeydown(event);
  }

  setConfig(config) {
    const nextConfig = this._cloneDeep(config ?? {});
    const nextConfigJson = this._serializeConfig(nextConfig);
    const currentConfigJson = this._serializeConfig(this._config);
    const currentDraftJson = this._serializeConfig(this._draftConfig);

    if (nextConfigJson === currentConfigJson) {
      return;
    }

    if (nextConfigJson === currentDraftJson) {
      this._config = nextConfig;
      return;
    }

    const shouldRender = !this.shadowRoot?.innerHTML || nextConfigJson !== this._lastRenderedConfigJson;
    this._config = nextConfig;
    this._draftConfig = this._cloneDeep(nextConfig);
    this._gradientStopsDrafts = new Map();
    this._gradientStopsUiRows = new Map();
    this._gradientStopPosTexts = new Map();
    this._gradientStopValidationMessages = new Map();
    this._segmentDrafts = new Map();
    this._segmentUiRows = new Map();
    this._segmentBoundaryTexts = new Map();
    this._targetAboveFillDrafts = new Map();
    this._baselineColorDrafts = new Map();

    if (shouldRender) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot?.innerHTML) {
      this._render();
      return;
    }
    this._syncEntityPickers();
  }

  _cloneContainer(value) {
    return Array.isArray(value) ? [...value] : { ...(value ?? {}) };
  }

  _cloneDeep(value) {
    if (Array.isArray(value)) {
      return value.map((entry) => this._cloneDeep(entry));
    }
    if (this._isObject(value)) {
      const clone = {};
      for (const [key, entry] of Object.entries(value)) {
        clone[key] = this._cloneDeep(entry);
      }
      return clone;
    }
    return value;
  }

  _serializeConfig(value) {
    const normalize = (input) => {
      if (Array.isArray(input)) {
        return input.map((entry) => normalize(entry));
      }
      if (this._isObject(input)) {
        return Object.keys(input).sort().reduce((acc, key) => {
          acc[key] = normalize(input[key]);
          return acc;
        }, {});
      }
      return input;
    };

    return JSON.stringify(normalize(value ?? null));
  }

  _isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  _setPathValue(target, path, value) {
    if (!path.length) {
      return value;
    }

    const root = this._cloneContainer(target ?? {});
    let cursor = root;
    let sourceCursor = target;

    for (let index = 0; index < path.length - 1; index++) {
      const key = path[index];
      const nextSource = this._isObject(sourceCursor?.[key]) || Array.isArray(sourceCursor?.[key])
        ? sourceCursor[key]
        : {};
      cursor[key] = this._cloneContainer(nextSource);
      cursor = cursor[key];
      sourceCursor = nextSource;
    }

    cursor[path[path.length - 1]] = value;
    return root;
  }

  _deletePathValue(target, path) {
    if (!path.length || !this._isObject(target)) {
      return target;
    }

    const [key, ...rest] = path;
    if (!(key in target)) {
      return target;
    }

    const cloned = this._cloneContainer(target);
    if (!rest.length) {
      delete cloned[key];
      return cloned;
    }

    const nextValue = this._deletePathValue(cloned[key], rest);
    if (nextValue === cloned[key]) {
      return target;
    }

    if (this._isObject(nextValue) && !Object.keys(nextValue).length) {
      delete cloned[key];
      return cloned;
    }

    cloned[key] = nextValue;
    return cloned;
  }

  _getPathValue(target, path) {
    let cursor = target;
    for (const key of path) {
      if (cursor == null) return undefined;
      cursor = cursor[key];
    }
    return cursor;
  }

  _hasPath(target, path) {
    let cursor = target;
    for (const key of path) {
      if (!this._isObject(cursor) && !Array.isArray(cursor)) return false;
      if (!(key in cursor)) return false;
      cursor = cursor[key];
    }
    return true;
  }

  _normalizeTextValue(value) {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
  }

  _normalizeOptionalEnabled(value) {
    return value === true ? true : value === false ? false : null;
  }

  _normalizeNumberValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _normalizeDecimalValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return null;
    }
    return parsed;
  }

  _preferStructuredPath(structuredPath, legacyPath = null) {
    if (this._hasPath(this._draftConfig, structuredPath.slice(0, -1))) {
      return structuredPath;
    }
    if (this._hasPath(this._draftConfig, structuredPath)) {
      return structuredPath;
    }
    if (legacyPath && this._hasPath(this._draftConfig, legacyPath)) {
      return legacyPath;
    }
    return structuredPath;
  }

  _getEntitiesValue() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._draftConfig.entities.map((entry) => (
        typeof entry === 'string'
          ? { entity: entry }
          : {
            entity: entry?.entity ?? '',
            name: entry?.name ?? '',
            icon: entry?.icon ?? '',
          }
      ));
    }
    if (this._draftConfig.entity) {
      return [{
        entity: this._draftConfig.entity,
        name: this._draftConfig.name ?? '',
        icon: this._draftConfig.icon ?? '',
      }];
    }
    return [];
  }

  _getRawEntityRows() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._cloneDeep(this._draftConfig.entities);
    }
    if (this._draftConfig.entity !== undefined) {
      const hasTopLevelIdentity = this._draftConfig.name !== undefined || this._draftConfig.icon !== undefined;
      if (!hasTopLevelIdentity) {
        return [this._draftConfig.entity];
      }
      return [{
        entity: this._draftConfig.entity,
        ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
        ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
      }];
    }
    return [];
  }

  _buildEntityConfigEntries(entities) {
    const usesShorthand = !Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined;
    const source = Array.isArray(this._draftConfig.entities)
      ? this._draftConfig.entities
      : this._draftConfig.entity !== undefined
        ? [{
          entity: this._draftConfig.entity,
          ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
          ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
        }]
        : [];

    const entries = entities.map((entry, index) => {
      const rawEntry = source[index];
      if (this._isObject(rawEntry)) {
        const mergedEntry = {
          ...rawEntry,
          entity: entry.entity,
        };
        const normalizedName = this._normalizeTextValue(entry.name).trim();
        if (normalizedName) {
          mergedEntry.name = normalizedName;
        } else {
          delete mergedEntry.name;
        }
        const rawIconValue = entry?.icon;
        const normalizedIcon = typeof rawIconValue === 'string'
          ? rawIconValue.trim()
          : rawIconValue;
        if (normalizedIcon === false) {
          mergedEntry.icon = false;
        } else if (typeof normalizedIcon === 'string' && normalizedIcon) {
          mergedEntry.icon = normalizedIcon;
        } else if (rawEntry.icon === false) {
          mergedEntry.icon = false;
        } else {
          delete mergedEntry.icon;
        }
        return mergedEntry;
      }
      const nextEntry = {
        entity: entry.entity,
      };
      const normalizedName = this._normalizeTextValue(entry.name).trim();
      if (normalizedName) {
        nextEntry.name = normalizedName;
      }
      const normalizedIcon = typeof entry?.icon === 'string'
        ? entry.icon.trim()
        : entry?.icon;
      if (normalizedIcon === false) {
        nextEntry.icon = false;
      } else if (typeof normalizedIcon === 'string' && normalizedIcon) {
        nextEntry.icon = normalizedIcon;
      }
      return nextEntry;
    });

    if (!usesShorthand) {
      return entries.map((entry) => {
        if (this._isObject(entry) && Object.keys(entry).length === 1 && entry.entity !== undefined) {
          return entry.entity;
        }
        return entry;
      });
    }

    return entries;
  }

  _updateConfig(nextConfig) {
    this._draftConfig = this._cloneDeep(nextConfig);
  }

  _emitConfigChanged() {
    const emittedConfig = this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig));
    const nextConfigJson = this._serializeConfig(emittedConfig);
    if (nextConfigJson === this._lastEmittedConfigJson) {
      return false;
    }

    this._lastEmittedConfigJson = nextConfigJson;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: emittedConfig },
      bubbles: true,
      composed: true,
    }));
    return true;
  }

  _scheduleRender() {
    if (this._renderScheduled || this._isRendering) return;
    this._renderScheduled = true;
    setTimeout(() => {
      this._renderScheduled = false;
      this._render();
    }, 0);
  }

  _applyUserConfig(nextConfig, options = {}) {
    const { rerender = false } = options;
    const nextConfigJson = this._serializeConfig(nextConfig);
    const currentDraftJson = this._serializeConfig(this._draftConfig);
    if (nextConfigJson === currentDraftJson) {
      return false;
    }

    this._updateConfig(nextConfig);
    this._emitConfigChanged();
    if (!rerender) {
      this._refreshDerivedEditorUi();
    }
    if (rerender) {
      this._scheduleRender();
    }
    return true;
  }

  _getShadowElementById(id) {
    if (!this.shadowRoot) {
      return null;
    }
    return this.shadowRoot.getElementById?.(id)
      ?? this.shadowRoot.querySelector?.(`#${id}`)
      ?? null;
  }

  _setElementChecked(id, checked) {
    const element = this._getShadowElementById(id);
    if (element) {
      element.checked = !!checked;
    }
  }

  _setElementText(id, value) {
    const element = this._getShadowElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  _refreshDerivedEditorUi() {
    if (!this.shadowRoot) {
      return;
    }
    this._refreshCardDerivedUi();
    this._refreshEntityDerivedUi();
  }

  _refreshCardDerivedUi() {
    this._setElementText('card-group-segments-summary', this._getSegmentsSummary({ type: 'card' }));
    this._setElementText('card-group-gradient-stops-summary', this._getGradientStopsSummary({ type: 'card' }));
    this._setElementChecked('target-above-fill-enabled', this._isTargetAboveFillEnabled({ type: 'card' }));
    this._setElementChecked('baseline-above-color-enabled', this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'above'));
    this._setElementChecked('baseline-below-color-enabled', this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'below'));
    this._refreshSegmentUi({ type: 'card' });
  }

  _refreshEntityDerivedUi() {
    const count = this._getEntitiesValue().length;
    for (let index = 0; index < count; index += 1) {
      const scope = { type: 'entity', index };
      this._setElementChecked(`entity-${index}-scale-inherit`, !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'min'))
        && !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'max')));
      this._setElementChecked(`entity-${index}-target-inherit`, !this._hasTargetOverride(scope));
      this._setElementChecked(`entity-${index}-baseline-inherit`, !this._hasBaselineOverride(scope));
      this._setElementChecked(`entity-${index}-needle-inherit`, !this._hasNeedleOverride(scope));
      this._setElementChecked(`entity-${index}-peak-inherit`, !this._hasPeakOverride(scope));
      this._setElementChecked(`entity-${index}-bar-inherit`, !this._hasEntityBarAppearanceOverride(scope));
      this._setElementChecked(`entity-${index}-segments-inherit`, !this._hasSegmentsOverride(scope));
      this._setElementChecked(`entity-${index}-gradient-stops-inherit`, !this._hasGradientStopsOverride(scope));
      this._setElementChecked(`entity-${index}-layout-inherit`, !this._hasLayoutOverride(scope));
      this._setElementChecked(`entity-${index}-formatting-inherit`, !this._hasFormattingOverride(scope));
      this._setElementChecked(`entity-${index}-target-above-fill-enabled`, this._isTargetAboveFillEnabled(scope));
      this._setElementChecked(`entity-${index}-baseline-above-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, 'above'));
      this._setElementChecked(`entity-${index}-baseline-below-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, 'below'));

      this._setElementText(`entity-${index}-group-scale-summary`, this._getScaleOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-target-summary`, this._getTargetOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-baseline-summary`, this._getBaselineOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-needle-summary`, this._getNeedleSummary(scope));
      this._setElementText(`entity-${index}-group-peak-summary`, this._getPeakSummary(scope));
      this._setElementText(`entity-${index}-group-bar-summary`, this._getBarAppearanceSummary(scope));
      this._setElementText(`entity-${index}-group-segments-summary`, this._getSegmentsSummary(scope));
      this._setElementText(`entity-${index}-group-gradient-stops-summary`, this._getGradientStopsSummary(scope));
      this._setElementText(`entity-${index}-group-layout-summary`, this._getLayoutSummary(scope));
      this._setElementText(`entity-${index}-group-formatting-summary`, this._getFormattingSummary(scope));

      this._refreshSegmentUi(scope);
    }
  }

  _queuePostRenderFocus(selector) {
    this._pendingFocusSelector = selector || null;
  }

  _applyPendingFocus() {
    if (!this._pendingFocusSelector || !this.shadowRoot) {
      return;
    }
    const selector = this._pendingFocusSelector;
    this._pendingFocusSelector = null;
    setTimeout(() => {
      const element = this.shadowRoot?.querySelector?.(selector);
      if (!element || typeof element.focus !== 'function') {
        return;
      }
      try {
        element.focus({ preventScroll: true });
      } catch (_error) {
        element.focus();
      }
    }, 0);
  }

  _setValueAtPath(path, value, options = {}) {
    const nextConfig = value === undefined
      ? this._deletePathValue(this._draftConfig, path)
      : this._setPathValue(this._draftConfig, path, value);
    return this._applyUserConfig(nextConfig, options);
  }

  _setTitle(value) {
    this._setValueAtPath(['title'], value);
  }

  _setEntityField(index, key, value) {
    const normalizedValue = this._normalizeTextValue(value);
    if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined && index === 0) {
      if (!normalizedValue.trim()) {
        return this._setValueAtPath([key], undefined);
      }
      return this._setValueAtPath([key], normalizedValue.trim());
    }
    const nextConfig = this._withEntityScopeConfig((entries) => {
      const rawEntry = entries[index];
      const nextEntry = this._isObject(rawEntry)
        ? this._cloneDeep(rawEntry)
        : { entity: rawEntry?.entity ?? '' };
      if (!normalizedValue.trim()) {
        delete nextEntry[key];
      } else {
        nextEntry[key] = normalizedValue.trim();
      }
      entries[index] = nextEntry;
      return entries;
    });
    return this._applyUserConfig(nextConfig);
  }

  _cleanupEntityIdentityForEmit(target) {
    if (!this._isObject(target)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const normalizedName = this._normalizeTextValue(nextTarget.name).trim();
    if (!normalizedName) {
      delete nextTarget.name;
    } else {
      nextTarget.name = normalizedName;
    }

    if (nextTarget.icon === false) {
      return nextTarget;
    }
    const normalizedIcon = this._normalizeTextValue(nextTarget.icon).trim();
    if (!normalizedIcon) {
      delete nextTarget.icon;
    } else {
      nextTarget.icon = normalizedIcon;
    }
    return nextTarget;
  }

  _cleanupNeedleForEmit(target, scope = { type: 'card' }) {
    if (!this._isObject(target) || !this._isObject(target.bar)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const rawNeedle = nextTarget.bar?.needle;
    if (rawNeedle === undefined) {
      return nextTarget;
    }

    const defaultColor = this._normalizeColorComparisonValue('#ffffff');
    let nextNeedle = null;

    if (rawNeedle === true) {
      nextNeedle = { show: true };
    } else if (rawNeedle === false) {
      nextNeedle = scope?.type === 'entity' ? { show: false } : null;
    } else if (this._isObject(rawNeedle)) {
      const color = this._normalizeTextValue(rawNeedle.color).trim();
      if (rawNeedle.show === true) {
        nextNeedle = { show: true };
      } else if (rawNeedle.show === false) {
        nextNeedle = scope?.type === 'entity' ? { show: false } : null;
      } else if (scope?.type === 'entity' && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
        nextNeedle = {};
      }
      if (nextNeedle && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
        nextNeedle.color = color;
      }
    } else {
      nextNeedle = null;
    }

    if (nextNeedle) {
      nextTarget.bar.needle = nextNeedle;
    } else {
      delete nextTarget.bar.needle;
      if (!Object.keys(nextTarget.bar).length) {
        delete nextTarget.bar;
      }
    }
    return nextTarget;
  }

  _cleanupResolvableValueForEmit(value) {
    const nextValue = {};
    if (this._isObject(value)) {
      const fixed = this._normalizeNumberValue(value.fixed);
      const entity = this._normalizeTextValue(value.entity).trim();
      if (fixed !== null) {
        nextValue.fixed = fixed;
      }
      if (entity) {
        nextValue.entity = entity;
      }
    } else {
      const fixed = this._normalizeNumberValue(value);
      if (fixed !== null) {
        nextValue.fixed = fixed;
      }
    }
    return Object.keys(nextValue).length ? nextValue : null;
  }

  _cleanupScaleForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.scale)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextScale = this._cloneDeep(nextTarget.scale);

    ['min', 'max'].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(nextScale, key)) {
        return;
      }
      const cleanedValue = this._cleanupResolvableValueForEmit(nextScale[key]);
      if (cleanedValue) {
        nextScale[key] = cleanedValue;
        delete nextTarget[key];
        delete nextTarget[`${key}_entity`];
      } else {
        delete nextScale[key];
      }
    });

    if (Object.keys(nextScale).length) {
      nextTarget.scale = nextScale;
    } else {
      delete nextTarget.scale;
    }

    return nextTarget;
  }

  _cleanupFormattingForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.formatting)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextFormatting = this._cloneDeep(nextTarget.formatting);
    const unit = this._normalizeTextValue(nextFormatting.unit).trim();
    const decimal = this._normalizeDecimalValue(nextFormatting.decimal);

    if (unit) {
      nextFormatting.unit = unit;
      delete nextTarget.unit;
    } else {
      delete nextFormatting.unit;
    }

    if (decimal !== null) {
      nextFormatting.decimal = decimal;
      delete nextTarget.decimal;
    } else {
      delete nextFormatting.decimal;
    }

    if (Object.keys(nextFormatting).length) {
      nextTarget.formatting = nextFormatting;
    } else {
      delete nextTarget.formatting;
    }

    return nextTarget;
  }

  _cleanupLayoutForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.layout)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextLayout = this._cloneDeep(nextTarget.layout);
    const nextLabel = this._isObject(nextLayout.label) ? this._cloneDeep(nextLayout.label) : null;
    const height = this._normalizeNumberValue(nextLayout.height);
    const width = this._normalizeNumberValue(nextLabel?.width);
    const position = this._normalizeTextValue(nextLabel?.position).trim();

    if (height !== null && height >= 24) {
      nextLayout.height = height;
      delete nextTarget.height;
    } else {
      delete nextLayout.height;
    }

    if (nextLabel) {
      if (position) {
        nextLabel.position = position;
        delete nextTarget.label_position;
      } else {
        delete nextLabel.position;
      }

      if (width !== null) {
        nextLabel.width = width;
        delete nextTarget.label_width;
      } else {
        delete nextLabel.width;
      }

      if (Object.keys(nextLabel).length) {
        nextLayout.label = nextLabel;
      } else {
        delete nextLayout.label;
      }
    }

    if (Object.keys(nextLayout).length) {
      nextTarget.layout = nextLayout;
    } else {
      delete nextTarget.layout;
    }

    return nextTarget;
  }

  _cleanupTargetForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.target)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextMarker = this._cloneDeep(nextTarget.target);
    const cleanedAt = this._cleanupResolvableValueForEmit(nextMarker.at);
    const color = this._normalizeTextValue(nextMarker.color).trim();
    const labelShow = nextMarker.label?.show === true;
    const fillColor = this._normalizeTextValue(nextMarker.when_exceeded?.fill_color).trim();

    if (typeof nextMarker.enabled !== 'boolean') {
      delete nextMarker.enabled;
    }

    if (cleanedAt) {
      nextMarker.at = cleanedAt;
      delete nextTarget.target_entity;
    } else {
      delete nextMarker.at;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888')) {
      nextMarker.color = color;
      delete nextTarget.target_color;
    } else {
      delete nextMarker.color;
    }

    if (labelShow) {
      nextMarker.label = { ...(this._isObject(nextMarker.label) ? nextMarker.label : {}), show: true };
      delete nextTarget.show_target_label;
    } else {
      delete nextMarker.label;
    }

    if (fillColor) {
      nextMarker.when_exceeded = {
        ...(this._isObject(nextMarker.when_exceeded) ? nextMarker.when_exceeded : {}),
        fill_color: fillColor,
      };
      delete nextTarget.above_target_color;
    } else {
      delete nextMarker.when_exceeded;
    }

    if (Object.keys(nextMarker).length) {
      nextTarget.target = nextMarker;
    } else {
      delete nextTarget.target;
    }

    return nextTarget;
  }

  _cleanupBaselineForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.baseline)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextBaseline = this._cloneDeep(nextTarget.baseline);
    const cleanedAt = this._cleanupResolvableValueForEmit(nextBaseline.at);

    if (typeof nextBaseline.enabled !== 'boolean') {
      delete nextBaseline.enabled;
    }

    if (cleanedAt) {
      nextBaseline.at = cleanedAt;
    } else {
      delete nextBaseline.at;
    }

    ['above', 'below'].forEach((direction) => {
      if (!this._isObject(nextBaseline[direction])) {
        delete nextBaseline[direction];
        return;
      }
      const color = this._normalizeTextValue(nextBaseline[direction].color).trim();
      if (color) {
        nextBaseline[direction] = { ...nextBaseline[direction], color };
      } else {
        delete nextBaseline[direction];
      }
    });

    if (Object.keys(nextBaseline).length) {
      nextTarget.baseline = nextBaseline;
    } else {
      delete nextTarget.baseline;
    }

    return nextTarget;
  }

  _cleanupPeakForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.peak)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextPeak = this._cloneDeep(nextTarget.peak);
    const color = this._normalizeTextValue(nextPeak.color).trim();

    if (typeof nextPeak.enabled !== 'boolean') {
      delete nextPeak.enabled;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888')) {
      nextPeak.color = color;
      delete nextTarget.peak_color;
    } else {
      delete nextPeak.color;
    }

    if (Object.keys(nextPeak).length) {
      nextTarget.peak = nextPeak;
    } else {
      delete nextTarget.peak;
    }

    return nextTarget;
  }

  _cleanupBarForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.bar)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextBar = this._cloneDeep(nextTarget.bar);
    const fillStyle = this._normalizeTextValue(nextBar.fill_style).trim();
    const color = this._normalizeTextValue(nextBar.color).trim();
    const segments = Array.isArray(nextBar.segments) ? nextBar.segments : null;
    const gradientStops = Array.isArray(nextBar.gradient_stops) ? nextBar.gradient_stops : null;

    if (fillStyle && fillStyle !== 'bands') {
      nextBar.fill_style = fillStyle;
      delete nextTarget.color_mode;
    } else {
      delete nextBar.fill_style;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#4a9eff')) {
      nextBar.color = color;
      delete nextTarget.color;
    } else {
      delete nextBar.color;
    }

    if (nextBar.solid_fill === true) {
      nextBar.solid_fill = true;
    } else {
      delete nextBar.solid_fill;
    }

    if (segments && segments.length && !this._segmentsEqualForEditor(segments, this._getDefaultSegments())) {
      nextBar.segments = segments;
      delete nextTarget.segments;
      delete nextTarget.severity;
    } else {
      delete nextBar.segments;
    }

    if (gradientStops && gradientStops.length >= 2 && !this._isDefaultGradientStops(gradientStops)) {
      nextBar.gradient_stops = this._sanitizeGradientStopsForEmit(gradientStops);
      delete nextTarget.gradient_stops;
    } else {
      delete nextBar.gradient_stops;
    }

    if (Object.keys(nextBar).length) {
      nextTarget.bar = nextBar;
    } else {
      delete nextTarget.bar;
    }

    return nextTarget;
  }

  _getEditorKnownKeyOrder(path = []) {
    const pathKey = path.join('.');
    switch (pathKey) {
      case '':
        return ['type', 'title', 'entities', 'scale', 'target', 'baseline', 'peak', 'layout', 'formatting', 'bar'];
      case 'entities.*':
        return ['entity', 'name', 'icon', 'scale', 'target', 'baseline', 'peak', 'layout', 'formatting', 'bar'];
      case 'scale':
        return ['min', 'max'];
      case 'scale.min':
      case 'scale.max':
      case 'target.at':
      case 'baseline.at':
        return ['fixed', 'entity'];
      case 'target':
        return ['enabled', 'at', 'color', 'label', 'when_exceeded'];
      case 'target.label':
        return ['show'];
      case 'target.when_exceeded':
        return ['fill_color'];
      case 'baseline':
        return ['enabled', 'at', 'above', 'below'];
      case 'baseline.above':
      case 'baseline.below':
        return ['color'];
      case 'peak':
        return ['enabled', 'color'];
      case 'layout':
        return ['height', 'label'];
      case 'layout.label':
        return ['position', 'width'];
      case 'formatting':
        return ['unit', 'decimal'];
      case 'bar':
        return ['fill_style', 'color', 'solid_fill', 'needle', 'segments', 'gradient_stops'];
      case 'bar.needle':
        return ['show', 'color'];
      default:
        return null;
    }
  }

  _orderEditorConfigKeys(value, path = []) {
    if (Array.isArray(value)) {
      const nextPath = path[0] === 'entities' ? ['entities', '*'] : path;
      return value.map((entry) => this._orderEditorConfigKeys(entry, nextPath));
    }
    if (!this._isObject(value)) {
      return value;
    }

    const orderedValue = {};
    const knownOrder = this._getEditorKnownKeyOrder(path) ?? [];
    const seenKeys = new Set();

    knownOrder.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        return;
      }
      orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
      seenKeys.add(key);
    });

    Object.keys(value).forEach((key) => {
      if (seenKeys.has(key)) {
        return;
      }
      orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
    });

    return orderedValue;
  }

  _cleanupEditorEmittedConfig(config) {
    if (!this._isObject(config)) {
      return config;
    }
    let nextConfig = this._cleanupEntityIdentityForEmit(config);
    nextConfig = this._cleanupScaleForEmit(nextConfig);
    nextConfig = this._cleanupTargetForEmit(nextConfig);
    nextConfig = this._cleanupBaselineForEmit(nextConfig);
    nextConfig = this._cleanupPeakForEmit(nextConfig);
    nextConfig = this._cleanupLayoutForEmit(nextConfig);
    nextConfig = this._cleanupFormattingForEmit(nextConfig);
    nextConfig = this._cleanupNeedleForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupBarForEmit(nextConfig);

    if (Array.isArray(nextConfig.entities)) {
      nextConfig.entities = nextConfig.entities.map((entry) => {
        if (!this._isObject(entry)) {
          return entry;
        }
        let cleanedEntry = this._cleanupEntityIdentityForEmit(entry);
        cleanedEntry = this._cleanupScaleForEmit(cleanedEntry);
        cleanedEntry = this._cleanupTargetForEmit(cleanedEntry);
        cleanedEntry = this._cleanupBaselineForEmit(cleanedEntry);
        cleanedEntry = this._cleanupPeakForEmit(cleanedEntry);
        cleanedEntry = this._cleanupLayoutForEmit(cleanedEntry);
        cleanedEntry = this._cleanupFormattingForEmit(cleanedEntry);
        cleanedEntry = this._cleanupNeedleForEmit(cleanedEntry, { type: 'entity' });
        cleanedEntry = this._cleanupBarForEmit(cleanedEntry);
        return cleanedEntry;
      });
    }

    return this._orderEditorConfigKeys(nextConfig);
  }

  _getScopedPath(scope, keyPath) {
    const normalizedPath = Array.isArray(keyPath) ? keyPath : [keyPath];
    if (!scope || scope.type === 'card') {
      return normalizedPath;
    }
    if (scope.type === 'entity') {
      return ['entities', scope.index, ...normalizedPath];
    }
    return normalizedPath;
  }

  _normalizePath(keyPath) {
    return Array.isArray(keyPath) ? keyPath : [keyPath];
  }

  _getEntityRawEntries() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._draftConfig.entities.map((entry) => (
        this._isObject(entry) ? this._cloneDeep(entry) : { entity: entry }
      ));
    }
    if (this._draftConfig.entity !== undefined) {
      return [{
        entity: this._draftConfig.entity,
        ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
        ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
      }];
    }
    return [];
  }

  _withEntityScopeConfig(mutator) {
    const rawEntries = this._getEntityRawEntries();
    const nextEntries = mutator(rawEntries.map((entry) => this._cloneDeep(entry)));
    let nextConfig = this._setPathValue(this._draftConfig, ['entities'], nextEntries);
    if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
      nextConfig = this._deletePathValue(nextConfig, ['entity']);
      if (this._draftConfig.name !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['name']);
      }
      if (this._draftConfig.icon !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['icon']);
      }
    }
    return nextConfig;
  }

  _setEntityRowsRaw(nextRows, options = {}) {
    const normalizedRows = this._cloneDeep(nextRows);
    if (Array.isArray(this._draftConfig.entities) || this._draftConfig.entity === undefined || normalizedRows.length !== 1) {
      let nextConfig = this._setPathValue(this._draftConfig, ['entities'], normalizedRows);
      if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['entity']);
        nextConfig = this._deletePathValue(nextConfig, ['name']);
        nextConfig = this._deletePathValue(nextConfig, ['icon']);
      }
      return this._applyUserConfig(nextConfig, options);
    }

    const [row] = normalizedRows;
    if (typeof row === 'string') {
      let nextConfig = this._setPathValue(this._draftConfig, ['entity'], row);
      nextConfig = this._deletePathValue(nextConfig, ['name']);
      nextConfig = this._deletePathValue(nextConfig, ['icon']);
      return this._applyUserConfig(nextConfig, options);
    }

    let nextConfig = this._setPathValue(this._draftConfig, ['entity'], row?.entity ?? '');
    if (row && Object.prototype.hasOwnProperty.call(row, 'name')) {
      nextConfig = this._setPathValue(nextConfig, ['name'], row.name);
    } else {
      nextConfig = this._deletePathValue(nextConfig, ['name']);
    }
    if (row && Object.prototype.hasOwnProperty.call(row, 'icon')) {
      nextConfig = this._setPathValue(nextConfig, ['icon'], row.icon);
    } else {
      nextConfig = this._deletePathValue(nextConfig, ['icon']);
    }
    return this._applyUserConfig(nextConfig, options);
  }

  _moveEntityRow(index, direction) {
    const rows = this._getRawEntityRows();
    const nextIndex = index + direction;
    if (index < 0 || index >= rows.length || nextIndex < 0 || nextIndex >= rows.length) {
      return false;
    }
    const nextRows = this._cloneDeep(rows);
    [nextRows[index], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[index]];
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _duplicateEntityRow(index) {
    const rows = this._getRawEntityRows();
    if (index < 0 || index >= rows.length) {
      return false;
    }
    const sourceRow = this._cloneDeep(rows[index]);
    const duplicateRow = typeof sourceRow === 'string'
      ? { entity: sourceRow }
      : this._cloneDeep(sourceRow);
    if (this._isObject(duplicateRow) && typeof duplicateRow.name === 'string' && duplicateRow.name.trim()) {
      duplicateRow.name = `${duplicateRow.name.trim()} copy`;
    }
    const nextRows = this._cloneDeep(rows);
    nextRows.splice(index + 1, 0, duplicateRow);
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _removeEntityRow(index) {
    const rows = this._getRawEntityRows();
    if (rows.length <= 1 || index < 0 || index >= rows.length) {
      return false;
    }
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _getScopedValue(scope, keyPath) {
    if (scope?.type === 'entity') {
      const entry = this._getEntityRawEntries()[scope.index];
      return this._getPathValue(entry, this._normalizePath(keyPath));
    }
    return this._getPathValue(this._draftConfig, this._getScopedPath(scope, keyPath));
  }

  _removeScopedValue(scope, keyPath, options = {}) {
    if (scope?.type === 'entity') {
      const nextConfig = this._withEntityScopeConfig((entries) => {
        const entry = this._isObject(entries[scope.index]) ? { ...entries[scope.index] } : { entity: entries[scope.index]?.entity ?? '' };
        entries[scope.index] = this._deletePathValue(entry, this._normalizePath(keyPath));
        return entries;
      });
      return this._applyUserConfig(nextConfig, options);
    }
    return this._setValueAtPath(this._getScopedPath(scope, keyPath), undefined, options);
  }

  _applyScopedMutation(scope, mutator, options = {}) {
    if (scope?.type === 'entity') {
      const nextConfig = this._withEntityScopeConfig((entries) => {
        const rawEntry = entries[scope.index];
        const entry = this._isObject(rawEntry) ? this._cloneDeep(rawEntry) : { entity: rawEntry?.entity ?? '' };
        entries[scope.index] = mutator(entry);
        return entries;
      });
      return this._applyUserConfig(nextConfig, options);
    }
    const nextConfig = mutator(this._cloneDeep(this._draftConfig));
    return this._applyUserConfig(nextConfig, options);
  }

  _setScopedValue(scope, keyPath, value, options = {}) {
    return this._applyScopedMutation(scope, (target) => (
      this._setPathValue(target, this._normalizePath(keyPath), value)
    ), options);
  }

  _removePathsFromTarget(target, keyPaths = []) {
    return keyPaths.reduce((nextTarget, keyPath) => (
      this._deletePathValue(nextTarget, this._normalizePath(keyPath))
    ), target);
  }

  _pruneEmptyObjectsInTarget(target, keyPath) {
    let nextTarget = target;
    const normalizedPath = this._normalizePath(keyPath);
    for (let index = normalizedPath.length; index > 0; index--) {
      const currentPath = normalizedPath.slice(0, index);
      const currentValue = this._getPathValue(nextTarget, currentPath);
      if (!this._isObject(currentValue) || Object.keys(currentValue).length) {
        break;
      }
      nextTarget = this._deletePathValue(nextTarget, currentPath);
    }
    return nextTarget;
  }

  _setCanonicalScopedValue(scope, canonicalPath, value, options = {}) {
    const { deprecatedKeys = [], prunePaths = [] } = options;
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._setPathValue(target, this._normalizePath(canonicalPath), value);
      nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
      const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
      pathsToPrune.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _removeCanonicalScopedValue(scope, canonicalPath, options = {}) {
    const { deprecatedKeys = [], prunePaths = [] } = options;
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, this._normalizePath(canonicalPath));
      nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
      const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
      pathsToPrune.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _setScopedNumericOverride(scope, keyPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeNumberValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._removeScopedValue(scope, keyPath, options);
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._setScopedValue(scope, keyPath, normalizedValue, options);
  }

  _setScopedTextOverride(scope, keyPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return this._removeScopedValue(scope, keyPath, options);
    }
    return this._setScopedValue(scope, keyPath, normalizedValue, options);
  }

  _setCanonicalScopedNumericOverride(scope, canonicalPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeNumberValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
      return this._removeCanonicalScopedValue(scope, canonicalPath, options);
    }
    return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
  }

  _setCanonicalScopedTextOverride(scope, canonicalPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, canonicalPath, options);
    }
    return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
  }

  _getResolvablePartsFromTarget(target, field, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const structuredValue = this._getPathValue(target, canonicalBasePath);
    const legacyFixedValue = this._getPathValue(target, legacyFixedPath);
    const legacyEntityValue = this._getPathValue(target, legacyEntityPath);
    const structuredFixedValue = this._isObject(structuredValue)
      ? structuredValue?.fixed
      : structuredValue;
    const structuredEntityValue = this._isObject(structuredValue)
      ? structuredValue?.entity
      : undefined;
    return {
      fixed: structuredFixedValue ?? ((!this._isObject(legacyFixedValue) && legacyFixedValue !== undefined) ? legacyFixedValue : ''),
      entity: structuredEntityValue ?? legacyEntityValue ?? '',
    };
  }

  _getResolvableScopedValue(scope, field, options = {}) {
    const target = scope?.type === 'entity'
      ? this._getEntityRawEntries()[scope.index]
      : this._draftConfig;
    return this._getResolvablePartsFromTarget(target ?? {}, field, options);
  }

  _getEffectiveResolvableScopedValue(scope, field, options = {}) {
    const localValue = this._getResolvableScopedValue(scope, field, options);
    if (scope?.type !== 'entity') {
      return localValue;
    }
    const inheritedValue = this._getResolvableScopedValue({ type: 'card' }, field, options);
    return {
      fixed: this._hasExplicitOverrideValue(localValue.fixed) ? localValue.fixed : inheritedValue.fixed,
      entity: this._hasExplicitOverrideValue(localValue.entity) ? localValue.entity : inheritedValue.entity,
    };
  }

  _setCanonicalResolvablePart(scope, field, part, rawValue, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const prunePaths = options.prunePaths ?? [canonicalBasePath, canonicalBasePath.slice(0, -1)];
    const normalizedValue = part === 'fixed'
      ? this._normalizeNumberValue(rawValue)
      : this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      const currentParts = this._getResolvablePartsFromTarget(target ?? {}, field, {
        canonicalBasePath,
        legacyFixedPath,
        legacyEntityPath,
      });
      const nextParts = { ...currentParts };

      if (part === 'fixed') {
        if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
          delete nextParts.fixed;
        } else {
          nextParts.fixed = normalizedValue;
        }
      } else if (!normalizedValue) {
        delete nextParts.entity;
      } else {
        nextParts.entity = normalizedValue;
      }

      let nextTarget = this._cloneDeep(target);
      nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
      const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
      if (!this._isObject(legacyFixedValue)) {
        nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
      }
      nextTarget = this._deletePathValue(nextTarget, canonicalBasePath);

      const hasFixed = nextParts.fixed !== undefined && nextParts.fixed !== null && nextParts.fixed !== '';
      const hasEntity = nextParts.entity !== undefined && nextParts.entity !== null && nextParts.entity !== '';
      if (hasFixed || hasEntity) {
        const nextValue = {};
        if (hasFixed) nextValue.fixed = nextParts.fixed;
        if (hasEntity) nextValue.entity = nextParts.entity;
        nextTarget = this._setPathValue(nextTarget, canonicalBasePath, nextValue);
      }

      prunePaths.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _clearCanonicalResolvableValue(scope, field, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const prunePaths = options.prunePaths ?? [canonicalBasePath, canonicalBasePath.slice(0, -1)];
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, canonicalBasePath);
      nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
      const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
      if (!this._isObject(legacyFixedValue)) {
        nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
      }
      prunePaths.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _getScopedDisplayValue(scope, canonicalPath, fallbackPaths = []) {
    const valuesToTry = [canonicalPath, ...fallbackPaths];
    for (const path of valuesToTry) {
      const value = this._getScopedValue(scope, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return '';
  }

  _getEffectiveScopedDisplayValue(scope, canonicalPath, fallbackPaths = []) {
    const valuesToTry = [canonicalPath, ...fallbackPaths];
    for (const path of valuesToTry) {
      const value = this._getScopedValue(scope, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    if (scope?.type === 'entity') {
      for (const path of valuesToTry) {
        const value = this._getScopedValue({ type: 'card' }, path);
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }
    return '';
  }

  _getScopedFormattingValue(scope, key) {
    return this._getScopedValue(scope, ['formatting', key])
      ?? this._getScopedValue(scope, [key])
      ?? '';
  }

  _getEffectiveScopedFormattingValue(scope, key) {
    return this._getEffectiveScopedDisplayValue(scope, ['formatting', key], [[key]]);
  }

  _setScopedFormattingUnit(scope, rawValue) {
    return this._setCanonicalScopedTextOverride(scope, ['formatting', 'unit'], rawValue, {
      deprecatedKeys: [['unit']],
      prunePaths: [['formatting']],
    });
  }

  _setScopedFormattingDecimal(scope, rawValue) {
    const normalizedValue = this._normalizeDecimalValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._removeCanonicalScopedValue(scope, ['formatting', 'decimal'], {
        deprecatedKeys: [['decimal']],
        prunePaths: [['formatting']],
      });
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['formatting', 'decimal'], normalizedValue, {
      deprecatedKeys: [['decimal']],
      prunePaths: [['formatting']],
    });
  }

  _clearFormattingOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['formatting', 'unit']);
      nextTarget = this._deletePathValue(nextTarget, ['formatting', 'decimal']);
      nextTarget = this._deletePathValue(nextTarget, ['unit']);
      nextTarget = this._deletePathValue(nextTarget, ['decimal']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['formatting']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasFormattingOverride(scope) {
    const formattingValue = this._getScopedValue(scope, ['formatting']) ?? {};
    if (this._isObject(formattingValue) && (
      Object.prototype.hasOwnProperty.call(formattingValue, 'unit')
      || Object.prototype.hasOwnProperty.call(formattingValue, 'decimal')
    )) {
      return true;
    }
    return this._getScopedValue(scope, ['unit']) !== undefined
      || this._getScopedValue(scope, ['decimal']) !== undefined;
  }

  _getScopedLayoutValue(scope, key) {
    if (key === 'height') {
      return this._getScopedValue(scope, ['layout', 'height'])
        ?? this._getScopedValue(scope, ['height'])
        ?? '';
    }
    if (key === 'position') {
      return this._getScopedValue(scope, ['layout', 'label', 'position'])
        ?? this._getScopedValue(scope, ['label_position'])
        ?? '';
    }
    if (key === 'width') {
      return this._getScopedValue(scope, ['layout', 'label', 'width'])
        ?? this._getScopedValue(scope, ['label_width'])
        ?? '';
    }
    return '';
  }

  _getEffectiveScopedLayoutValue(scope, key) {
    if (key === 'height') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'height'], [['height']]);
    }
    if (key === 'position') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'label', 'position'], [['label_position']]);
    }
    if (key === 'width') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'label', 'width'], [['label_width']]);
    }
    return '';
  }

  _setScopedLayoutLabelPosition(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'label', 'position'], {
        deprecatedKeys: [['label_position']],
        prunePaths: [['layout', 'label'], ['layout']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'label', 'position'], value, {
      deprecatedKeys: [['label_position']],
      prunePaths: [['layout', 'label'], ['layout']],
    });
  }

  _setLayoutLabelPosition(value) {
    return this._setScopedLayoutLabelPosition({ type: 'card' }, value);
  }

  _setScopedLayoutHeight(scope, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (value === '' || value === null || value === undefined) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'height'], {
        deprecatedKeys: [['height']],
        prunePaths: [['layout']],
      });
    }
    if (numericValue === null || numericValue < 24) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'height'], numericValue, {
      deprecatedKeys: [['height']],
      prunePaths: [['layout']],
    });
  }

  _setLayoutHeight(value) {
    return this._setScopedLayoutHeight({ type: 'card' }, value);
  }

  _setScopedLayoutLabelWidth(scope, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (value === '' || value === null || value === undefined) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'label', 'width'], {
        deprecatedKeys: [['label_width']],
        prunePaths: [['layout', 'label'], ['layout']],
      });
    }
    if (numericValue === null) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'label', 'width'], numericValue, {
      deprecatedKeys: [['label_width']],
      prunePaths: [['layout', 'label'], ['layout']],
    });
  }

  _clearLayoutOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['layout', 'height']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'label', 'position']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'label', 'width']);
      nextTarget = this._deletePathValue(nextTarget, ['height']);
      nextTarget = this._deletePathValue(nextTarget, ['label_position']);
      nextTarget = this._deletePathValue(nextTarget, ['label_width']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['layout', 'label']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['layout']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasLayoutOverride(scope) {
    const layoutValue = this._getScopedValue(scope, ['layout']) ?? {};
    const labelValue = this._isObject(layoutValue) ? (layoutValue.label ?? {}) : {};
    if (this._isObject(layoutValue) && (
      Object.prototype.hasOwnProperty.call(layoutValue, 'height')
      || (this._isObject(labelValue) && (
        Object.prototype.hasOwnProperty.call(labelValue, 'position')
        || Object.prototype.hasOwnProperty.call(labelValue, 'width')
      ))
    )) {
      return true;
    }
    return this._getScopedValue(scope, ['height']) !== undefined
      || this._getScopedValue(scope, ['label_position']) !== undefined
      || this._getScopedValue(scope, ['label_width']) !== undefined;
  }

  _setScaleBound(key, value) {
    return this._setCanonicalResolvablePart({ type: 'card' }, key, 'fixed', value);
  }

  _clearScaleOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['scale', 'min']);
      nextTarget = this._deletePathValue(nextTarget, ['scale', 'max']);
      nextTarget = this._deletePathValue(nextTarget, ['min']);
      nextTarget = this._deletePathValue(nextTarget, ['max']);
      nextTarget = this._deletePathValue(nextTarget, ['min_entity']);
      nextTarget = this._deletePathValue(nextTarget, ['max_entity']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['scale']);
      return nextTarget;
    }, { rerender: true });
  }

  _setBarFillStyle(value) {
    return this._setScopedBarFillStyle({ type: 'card' }, value);
  }

  _setBarColor(value) {
    return this._setScopedBarColor({ type: 'card' }, value);
  }

  _setGradientStops(stops, options = {}) {
    return this._setScopedGradientStops({ type: 'card' }, stops, options);
  }

  _setSegments(segments, options = {}) {
    return this._setScopedSegments({ type: 'card' }, segments, options);
  }

  _getDefaultGradientStops() {
    return [
      { pos: 0, color: '#4CAF50' },
      { pos: 50, color: '#FF9800' },
      { pos: 100, color: '#F44336' },
    ];
  }

  _normalizeGradientStopPosValue(rawValue) {
    const numericValue = this._normalizeNumberValue(rawValue);
    if (numericValue === null || !Number.isFinite(numericValue)) {
      return null;
    }
    if (numericValue < 0 || numericValue > 100) {
      return null;
    }
    return numericValue;
  }

  _sanitizeGradientStopsForEmit(stops) {
    if (!Array.isArray(stops)) {
      return [];
    }

    return stops
      .map((stop) => {
        if (!this._isObject(stop)) {
          return null;
        }
        const pos = this._normalizeGradientStopPosValue(stop.pos);
        const color = this._normalizeTextValue(stop.color).trim();
        if (pos === null || !color) {
          return null;
        }
        return {
          ...stop,
          pos,
          color,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.pos - right.pos);
  }

  _getGradientStopDraftColorDefault(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (committedStops.length) {
      return committedStops[committedStops.length - 1].color ?? '#4CAF50';
    }
    return this._getDefaultGradientStops()[0].color;
  }

  _getNextSuggestedGradientStopPos(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (!committedStops.length) {
      return 0;
    }

    const highest = committedStops[committedStops.length - 1];
    if (highest.pos >= 100) {
      return '';
    }

    let suggestedPos;
    if (committedStops.length === 1) {
      suggestedPos = highest.pos + 25;
    } else {
      const previous = committedStops[committedStops.length - 2];
      suggestedPos = highest.pos + (highest.pos - previous.pos);
    }

    const clampedPos = Math.min(100, Math.max(0, suggestedPos));
    if (committedStops.some((stop) => stop.pos === clampedPos)) {
      return '';
    }
    return clampedPos;
  }

  _getGradientStopsDraftKey(scope) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getGradientStopPosTextKey(scope, stopIndex) {
    return `${this._getGradientStopsDraftKey(scope)}:pos:${stopIndex}`;
  }

  _getGradientStopPosText(scope = { type: 'card' }, stopIndex, fallbackValue = '') {
    const key = this._getGradientStopPosTextKey(scope, stopIndex);
    if (this._gradientStopPosTexts.has(key)) {
      return this._gradientStopPosTexts.get(key);
    }
    if (fallbackValue === '' || fallbackValue === null || fallbackValue === undefined) {
      return '';
    }
    return String(fallbackValue);
  }

  _setGradientStopPosText(scope, stopIndex, rawValue) {
    this._gradientStopPosTexts.set(
      this._getGradientStopPosTextKey(scope, stopIndex),
      this._normalizeTextValue(rawValue),
    );
  }

  _clearGradientStopPosText(scope, stopIndex) {
    this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(scope, stopIndex));
  }

  _clearGradientStopScopeTextState(scope) {
    const prefix = `${this._getGradientStopsDraftKey(scope)}:pos:`;
    for (const key of this._gradientStopPosTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopPosTexts.delete(key);
      }
    }
    for (const key of this._gradientStopValidationMessages.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopValidationMessages.delete(key);
      }
    }
  }

  _getGradientStopsUiRows(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (this._gradientStopsUiRows.has(key)) {
      return this._cloneDeep(this._gradientStopsUiRows.get(key));
    }
    return null;
  }

  _setGradientStopsUiRows(scope, stops) {
    this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(scope), this._cloneDeep(stops));
  }

  _getStoredScopedGradientStops(scope = { type: 'card' }) {
    const structuredValue = this._getScopedValue(scope, ['bar', 'gradient_stops']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacyValue = this._getScopedValue(scope, ['gradient_stops']);
    if (legacyValue !== undefined) {
      return legacyValue;
    }
    return null;
  }

  _getFallbackGradientStops(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const inheritedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({ type: 'card' }));
      return inheritedStops.length ? inheritedStops : this._getDefaultGradientStops();
    }
    return this._getDefaultGradientStops();
  }

  _createGradientStopDraftState(scope = { type: 'card' }) {
    const suggestedPos = this._getNextSuggestedGradientStopPos(scope);
    return {
      pos: suggestedPos === '' ? '' : String(suggestedPos),
      color: this._getGradientStopDraftColorDefault(scope),
    };
  }

  _getGradientStopsDraftState(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (!this._gradientStopsDrafts.has(key)) {
      this._gradientStopsDrafts.set(key, this._createGradientStopDraftState(scope));
    }
    return this._cloneDeep(this._gradientStopsDrafts.get(key));
  }

  _setGradientStopsDraftState(scope, nextDraft, options = {}) {
    this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
      pos: nextDraft?.pos ?? '',
      color: nextDraft?.color ?? this._getGradientStopDraftColorDefault(scope),
    });
    if (options?.refreshOnly) {
      this._refreshGradientDraftUi(scope);
      return;
    }
    this._render();
  }

  _setGradientStopsDraftField(scope, field, rawValue) {
    const currentDraft = this._getGradientStopsDraftState(scope);
    const nextValue = field === 'color'
      ? this._normalizeTextValue(rawValue).trim()
      : this._normalizeTextValue(rawValue);
    this._setGradientStopsDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
    }, { refreshOnly: field === 'pos' });
  }

  _getValidGradientDraftStop(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const pos = this._normalizeGradientStopPosValue(draft.pos);
    const color = this._normalizeTextValue(draft.color).trim();
    if (pos === null || !color) {
      return null;
    }
    return { pos, color };
  }

  _hasGradientStopDuplicate(scope = { type: 'card' }, candidatePos, excludeIndex = null) {
    return this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope)).some((stop, index) => (
      index !== excludeIndex && stop.pos === candidatePos
    ));
  }

  _canAddGradientStop(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop) {
      return false;
    }
    return !this._hasGradientStopDuplicate(scope, draftStop.pos);
  }

  _getGradientDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const normalizedPosText = this._normalizeTextValue(draft.pos).trim();
    const normalizedColor = this._normalizeTextValue(draft.color).trim();
    if (!normalizedPosText) {
      return 'Enter a position to add a stop.';
    }
    if (this._normalizeGradientStopPosValue(draft.pos) === null) {
      return 'Enter a value from 0 to 100.';
    }
    if (!normalizedColor) {
      return 'Choose a color to add a stop.';
    }
    if (this._hasGradientStopDuplicate(scope, this._normalizeGradientStopPosValue(draft.pos))) {
      return 'Position already exists.';
    }
    return '';
  }

  _isDefaultGradientStops(stops) {
    const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
    const defaultStops = this._getDefaultGradientStops();
    if (sanitizedStops.length !== defaultStops.length) {
      return false;
    }
    return sanitizedStops.every((stop, index) => (
      stop.pos === defaultStops[index].pos
      && this._normalizeColorComparisonValue(stop.color) === this._normalizeColorComparisonValue(defaultStops[index].color)
    ));
  }

  _setScopedGradientStops(scope, stops, options = {}) {
    const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
    const shouldRemove = sanitizedStops.length < 2 || this._isDefaultGradientStops(sanitizedStops);
    const previousUiRowsJson = this._serializeConfig(this._getGradientStopsUiRows(scope) ?? []);
    this._clearGradientStopScopeTextState(scope);
    this._setGradientStopsUiRows(scope, sanitizedStops);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['gradient_stops']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'gradient_stops']);
      if (!shouldRemove) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'gradient_stops'], sanitizedStops);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, options);
    if (applied === false && options?.rerender && this._serializeConfig(sanitizedStops) !== previousUiRowsJson) {
      this._render();
    }
    if (applied !== false && !options?.rerender) {
      this._refreshGradientDraftUi(scope);
    }
    return applied;
  }

  _clearGradientStopsOverride(scope) {
    const previousUiRowsJson = this._serializeConfig(this._getGradientStopsUiRows(scope) ?? []);
    this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(scope));
    this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(scope));
    this._clearGradientStopScopeTextState(scope);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'gradient_stops']);
      nextTarget = this._deletePathValue(nextTarget, ['gradient_stops']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
    if (applied === false && previousUiRowsJson !== this._serializeConfig([])) {
      this._render();
    }
    return applied;
  }

  _setScopedSegments(scope, segments, options = {}) {
    const nextSegments = options?.sort === false ? this._cloneDeep(segments) : this._sortSegmentsForEditor(segments);
    const fallbackSegments = this._getFallbackSegments(scope);
    const shouldRemove = !Array.isArray(nextSegments)
      || !nextSegments.length
      || (fallbackSegments.length > 0 && this._segmentsEqualForEditor(nextSegments, fallbackSegments));
    this._setSegmentsUiRows(scope, nextSegments);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'segments']);
      nextTarget = this._deletePathValue(nextTarget, ['segments']);
      nextTarget = this._deletePathValue(nextTarget, ['severity']);
      if (!shouldRemove) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'segments'], nextSegments);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, options);
    if (applied !== false) {
      this._refreshSegmentUi(scope);
    }
    return applied;
  }

  _clearSegmentsOverride(scope) {
    this._segmentDrafts.delete(this._getSegmentsScopeKey(scope));
    this._segmentUiRows.delete(this._getSegmentsScopeKey(scope));
    this._clearSegmentScopeTextState(scope);
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'segments']);
      nextTarget = this._deletePathValue(nextTarget, ['segments']);
      nextTarget = this._deletePathValue(nextTarget, ['severity']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
  }

  _setNeedle(value) {
    return this._setScopedNeedleMode({ type: 'card' }, value ? 'enabled' : 'disabled');
  }

  _getScopedPeakConfig(scope) {
    const rawPeak = this._getScopedValue(scope, ['peak']);
    const rawPeakMarker = this._getScopedValue(scope, ['peak_marker']);
    const rawLegacyShow = this._getScopedValue(scope, ['show_peak']);
    const rawLegacyColor = this._getScopedValue(scope, ['peak_color']);
    const defaultColor = '#888';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (this._isObject(rawPeak)) {
      if (rawPeak.enabled === true) {
        mode = 'enabled';
      } else if (rawPeak.enabled === false) {
        mode = 'disabled';
      }
      color = rawPeak.color ?? color;
    }

    if (this._isObject(rawPeakMarker)) {
      if (rawPeakMarker.show === true) {
        mode = 'enabled';
      } else if (rawPeakMarker.show === false) {
        mode = 'disabled';
      } else if (scope?.type !== 'entity') {
        mode = 'disabled';
      }
      color = rawPeakMarker.color ?? color;
    }

    if (rawLegacyShow === true) {
      mode = 'enabled';
    } else if (rawLegacyShow === false) {
      mode = 'disabled';
    }

    color = color || rawLegacyColor || '';
    if (color && this._normalizeColorComparisonValue(color) === this._normalizeColorComparisonValue(defaultColor)) {
      color = '';
    }

    return { mode, color };
  }

  _getEffectiveScopedPeakConfig(scope) {
    const localPeak = this._getScopedPeakConfig(scope);
    if (scope?.type !== 'entity') {
      return localPeak;
    }
    if (!this._hasPeakOverride(scope)) {
      return this._getScopedPeakConfig({ type: 'card' });
    }
    const inheritedPeak = this._getScopedPeakConfig({ type: 'card' });
    return {
      mode: localPeak.mode === 'inherit' ? inheritedPeak.mode : localPeak.mode,
      color: localPeak.color || inheritedPeak.color,
    };
  }

  _hasPeakOverride(scope) {
    const peakValue = this._getScopedValue(scope, ['peak']) ?? {};
    if (this._isObject(peakValue) && (
      Object.prototype.hasOwnProperty.call(peakValue, 'enabled')
      || Object.prototype.hasOwnProperty.call(peakValue, 'color')
    )) {
      return true;
    }

    const peakMarkerValue = this._getScopedValue(scope, ['peak_marker']) ?? {};
    if (this._isObject(peakMarkerValue) && (
      Object.prototype.hasOwnProperty.call(peakMarkerValue, 'show')
      || Object.prototype.hasOwnProperty.call(peakMarkerValue, 'color')
    )) {
      return true;
    }

    return this._getScopedValue(scope, ['show_peak']) !== undefined
      || this._getScopedValue(scope, ['peak_color']) !== undefined;
  }

  _getPeakSummary(scope) {
    if (scope?.type === 'entity' && !this._hasPeakOverride(scope)) return 'Inherited';
    const peak = this._getScopedPeakConfig(scope);
    if (peak.mode === 'disabled') return peak.color ? 'Disabled • Custom color' : 'Disabled';
    if (peak.mode === 'enabled') return peak.color ? 'Enabled • Custom color' : 'Enabled';
    if (peak.color) return 'Custom color';
    return 'Inherited';
  }

  _clearPeakOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['peak', 'enabled']);
      nextTarget = this._deletePathValue(nextTarget, ['peak', 'color']);
      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    }, { rerender: true });
  }

  _setScopedPeakEnabled(scope, value) {
    const boolValue = !!value;
    const defaultColor = '#888';
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const currentPeak = this._isObject(this._getPathValue(nextTarget, ['peak']))
        ? this._cloneDeep(this._getPathValue(nextTarget, ['peak']))
        : {};
      const currentColor = currentPeak.color
        ?? (this._isObject(this._getPathValue(nextTarget, ['peak_marker'])) ? this._getPathValue(nextTarget, ['peak_marker', 'color']) : undefined)
        ?? this._getPathValue(nextTarget, ['peak_color'])
        ?? defaultColor;

      if (scope?.type === 'entity' || boolValue) {
        currentPeak.enabled = boolValue;
      } else {
        delete currentPeak.enabled;
      }

      if (currentColor && this._normalizeColorComparisonValue(currentColor) !== this._normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = currentColor;
      } else {
        delete currentPeak.color;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = this._setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    });
  }

  _setScopedPeakColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const defaultColor = '#888';
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const currentPeak = this._isObject(this._getPathValue(nextTarget, ['peak']))
        ? this._cloneDeep(this._getPathValue(nextTarget, ['peak']))
        : {};
      const currentConfig = this._getScopedPeakConfig(scope);

      delete currentPeak.color;
      if (normalizedValue && this._normalizeColorComparisonValue(normalizedValue) !== this._normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = normalizedValue;
      }

      if (scope?.type === 'entity') {
        if (currentConfig.mode === 'enabled') currentPeak.enabled = true;
        if (currentConfig.mode === 'disabled') currentPeak.enabled = false;
      } else if (currentConfig.mode === 'enabled') {
        currentPeak.enabled = true;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = this._setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    });
  }

  _setFixedMarkerValue(rootKey, enabled, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (!enabled || numericValue === null) {
      return this._removeCanonicalScopedValue({ type: 'card' }, [rootKey, 'at', 'fixed'], {
        deprecatedKeys: rootKey === 'target' ? [['target_entity']] : [],
        prunePaths: [[rootKey, 'at'], [rootKey]],
      });
    }

    return this._setCanonicalScopedValue({ type: 'card' }, [rootKey, 'at', 'fixed'], numericValue, {
      deprecatedKeys: rootKey === 'target' ? [['target_entity']] : [],
      prunePaths: [[rootKey, 'at'], [rootKey]],
    });
  }

  _setPeakShow(value) {
    return this._setScopedPeakEnabled({ type: 'card' }, value);
  }

  _readFixedMarker(rootKey) {
    const rawValue = this._draftConfig[rootKey];
    if (this._isObject(rawValue)) {
      const fixed = this._isObject(rawValue?.at) ? rawValue.at.fixed : rawValue?.at;
      return {
        enabled: fixed !== undefined && fixed !== null && fixed !== '',
        value: fixed ?? '',
      };
    }
    return {
      enabled: rawValue !== undefined && rawValue !== null && rawValue !== '',
      value: rawValue ?? '',
    };
  }

  _getGradientStopsValue() {
    return this._getScopedGradientStopsValue({ type: 'card' });
  }

  _getSegmentsValue() {
    return this._getScopedSegmentsValue({ type: 'card' });
  }

  _getSegmentsScopeKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getSegmentBoundaryTextKey(scope, segmentIndex, field) {
    return `${this._getSegmentsScopeKey(scope)}:${segmentIndex}:${field}`;
  }

  _getSegmentBoundaryText(scope = { type: 'card' }, segmentIndex, field, fallbackValue = '') {
    const key = this._getSegmentBoundaryTextKey(scope, segmentIndex, field);
    if (this._segmentBoundaryTexts.has(key)) {
      return this._segmentBoundaryTexts.get(key);
    }
    return this._formatSegmentBoundaryValue(fallbackValue);
  }

  _setSegmentBoundaryText(scope, segmentIndex, field, rawValue) {
    this._segmentBoundaryTexts.set(
      this._getSegmentBoundaryTextKey(scope, segmentIndex, field),
      this._normalizeTextValue(rawValue),
    );
  }

  _clearSegmentBoundaryText(scope, segmentIndex, field) {
    this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(scope, segmentIndex, field));
  }

  _clearSegmentScopeTextState(scope) {
    const prefix = `${this._getSegmentsScopeKey(scope)}:`;
    for (const key of this._segmentBoundaryTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._segmentBoundaryTexts.delete(key);
      }
    }
  }

  _getSegmentsUiRows(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (this._segmentUiRows.has(key)) {
      return this._cloneDeep(this._segmentUiRows.get(key));
    }
    return null;
  }

  _setSegmentsUiRows(scope, rows) {
    this._segmentUiRows.set(this._getSegmentsScopeKey(scope), this._cloneDeep(rows));
  }

  _getSegmentDraftState(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (!this._segmentDrafts.has(key)) {
      this._segmentDrafts.set(key, this._createSegmentDraftState(scope));
    }
    return this._cloneDeep(this._segmentDrafts.get(key));
  }

  _setSegmentDraftState(scope, nextDraft, options = {}) {
    this._segmentDrafts.set(this._getSegmentsScopeKey(scope), {
      from: nextDraft?.from ?? '',
      to: nextDraft?.to ?? '',
      color: nextDraft?.color ?? this._getSegmentDraftColorDefault(scope),
    });
    if (options?.refreshOnly) {
      this._refreshSegmentUi(scope);
      return;
    }
    this._render();
  }

  _setSegmentDraftField(scope, field, rawValue) {
    const currentDraft = this._getSegmentDraftState(scope);
    const nextValue = field === 'color'
      ? this._normalizeTextValue(rawValue).trim()
      : this._normalizeTextValue(rawValue);
    this._setSegmentDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
    }, { refreshOnly: true });
  }

  _isSegmentFillStyle(fillStyle) {
    return ['bands', 'soft_bands', 'band_gradient'].includes(fillStyle);
  }

  _getDefaultSegments() {
    return [
      { from: '0%', to: '33%', color: '#4CAF50' },
      { from: '33%', to: '75%', color: '#FF9800' },
      { from: '75%', to: '100%', color: '#F44336' },
    ];
  }

  _getStoredScopedSegments(scope = { type: 'card' }) {
    const structuredValue = this._getScopedValue(scope, ['bar', 'segments']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacySegments = this._getScopedValue(scope, ['segments']);
    if (legacySegments !== undefined) {
      return legacySegments;
    }
    const legacySeverity = this._getScopedValue(scope, ['severity']);
    if (legacySeverity !== undefined) {
      return legacySeverity;
    }
    return null;
  }

  _parseSegmentBoundaryInput(rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return null;
    }
    const percentMatch = normalizedValue.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;
    if (Number.isFinite(percent)) {
      return `${percent}%`;
    }
    const numericValue = this._normalizeNumberValue(normalizedValue);
    return numericValue === null ? null : numericValue;
  }

  _formatSegmentBoundaryValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (this._isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return `${value.percent}%`;
      }
      if (Number.isFinite(this._getFiniteNumber(value.fixed))) {
        return String(this._getFiniteNumber(value.fixed));
      }
    }
    return '';
  }

  _getSegmentDraftColorDefault(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    if (segments.length) {
      return this._normalizeTextValue(segments[segments.length - 1]?.color).trim() || '#4a9eff';
    }
    return '#4CAF50';
  }

  _getNewSegmentDefaults(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    const previous = segments[segments.length - 1];
    const previousTo = previous?.to ?? null;
    return {
      from: previousTo ?? '0%',
      to: '100%',
      color: '#4a9eff',
    };
  }

  _createSegmentDraftState(scope = { type: 'card' }) {
    const defaults = this._getNewSegmentDefaults(scope);
    const formattedFrom = this._formatSegmentBoundaryValue(defaults.from);
    const formattedTo = this._formatSegmentBoundaryValue(defaults.to);
    const draftFrom = formattedFrom === '100%' || formattedFrom === '100' ? '' : formattedFrom;
    const draftTo = draftFrom ? formattedTo : '';
    return {
      from: draftFrom,
      to: draftTo,
      color: defaults.color ?? this._getSegmentDraftColorDefault(scope),
    };
  }

  _normalizeSegmentForEditorComparison(segment) {
    if (!this._isObject(segment)) {
      return null;
    }
    const from = this._formatSegmentBoundaryValue(segment.from).trim();
    const to = this._formatSegmentBoundaryValue(segment.to).trim();
    const color = this._normalizeColorComparisonValue(segment.color);
    if (!from || !to || !color) {
      return null;
    }
    return { from, to, color };
  }

  _segmentsEqualForEditor(leftSegments, rightSegments) {
    const left = Array.isArray(leftSegments)
      ? leftSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    const right = Array.isArray(rightSegments)
      ? rightSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    if (left.length !== right.length) {
      return false;
    }
    return left.every((segment, index) => (
      segment.from === right[index].from
      && segment.to === right[index].to
      && segment.color === right[index].color
    ));
  }

  _getFallbackSegments(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const cardStoredSegments = this._getStoredScopedSegments({ type: 'card' });
      if (cardStoredSegments !== null) {
        return this._cloneDeep(this._getScopedSegmentsValue({ type: 'card' }));
      }
    }
    if (!this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))) {
      return [];
    }
    return this._cloneDeep(this._getDefaultSegments());
  }

  _parseSegmentBoundaryText(rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return { state: 'empty', value: null };
    }
    const parsed = this._parseSegmentBoundaryInput(normalizedValue);
    if (parsed === null) {
      return { state: 'invalid', value: null };
    }
    return { state: 'valid', value: parsed };
  }

  _compareSegmentBoundaries(left, right) {
    const leftValue = this._getSegmentPreviewBoundaryValue(left);
    const rightValue = this._getSegmentPreviewBoundaryValue(right);
    if (leftValue === null || rightValue === null) {
      return null;
    }
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  }

  _buildSegmentValidationRows(scope = { type: 'card' }) {
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    return rows.map((segment, index) => {
      const rawFrom = this._getSegmentBoundaryText(scope, index, 'from', segment?.from);
      const rawTo = this._getSegmentBoundaryText(scope, index, 'to', segment?.to);
      const parsedFrom = this._parseSegmentBoundaryText(rawFrom);
      const parsedTo = this._parseSegmentBoundaryText(rawTo);
      return {
        index,
        rawFrom,
        rawTo,
        parsedFrom,
        parsedTo,
      };
    });
  }

  _getSegmentRowValidationMessage(scope = { type: 'card' }, segmentIndex) {
    const rows = this._buildSegmentValidationRows(scope);
    const row = rows[segmentIndex];
    if (!row) {
      return '';
    }
    if (row.parsedFrom.state === 'invalid' || row.parsedTo.state === 'invalid' || row.parsedFrom.state === 'empty' || row.parsedTo.state === 'empty') {
      return 'Enter valid from/to values.';
    }
    if (this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
    for (const other of rows) {
      if (other.index === segmentIndex) continue;
      if (other.parsedFrom.state !== 'valid' || other.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(other.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(other.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getValidSegmentDraft(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = this._normalizeTextValue(draft.color).trim();
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid' || !color) {
      return null;
    }
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return null;
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom || (candidateFrom < otherTo && candidateTo > otherFrom)) {
        return null;
      }
    }
    return {
      from: parsedFrom.value,
      to: parsedTo.value,
      color,
    };
  }

  _canAddSegment(scope = { type: 'card' }) {
    return !!this._getValidSegmentDraft(scope);
  }

  _getSegmentDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = this._normalizeTextValue(draft.color).trim();
    if (!this._normalizeTextValue(draft.from).trim() && !this._normalizeTextValue(draft.to).trim()) {
      return '';
    }
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid') {
      return 'Enter valid from/to values.';
    }
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    if (!color) {
      return 'Choose a color to add a segment.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getSegmentPreviewBoundaryValue(value) {
    if (typeof value === 'string') {
      const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);
      if (match) {
        const parsed = parseFloat(match[1]);
        return Number.isFinite(parsed) ? parsed : null;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (this._isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return value.percent;
      }
      const fixedValue = this._getFiniteNumber(value.fixed);
      if (Number.isFinite(fixedValue)) {
        return fixedValue;
      }
    }
    return null;
  }

  _sortSegmentsForEditor(segments) {
    if (!Array.isArray(segments)) {
      return [];
    }
    return this._cloneDeep(segments).sort((left, right) => {
      const leftFrom = this._getSegmentPreviewBoundaryValue(left?.from);
      const rightFrom = this._getSegmentPreviewBoundaryValue(right?.from);
      if (leftFrom === null && rightFrom === null) return 0;
      if (leftFrom === null) return 1;
      if (rightFrom === null) return -1;
      return leftFrom - rightFrom;
    });
  }

  _getSegmentPreviewRows(scope = { type: 'card' }) {
    const baseSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const previewSegments = this._sortSegmentsForEditor(baseSegments);
    const validDraft = this._getValidSegmentDraft(scope);
    if (validDraft) {
      previewSegments.push(validDraft);
    }
    return this._sortSegmentsForEditor(previewSegments).filter((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment?.from);
      const to = this._getSegmentPreviewBoundaryValue(segment?.to);
      return from !== null && to !== null && typeof segment?.color === 'string' && segment.color.trim();
    });
  }

  _buildEditorSegmentPreviewStyle(scope = { type: 'card' }) {
    const segments = this._getSegmentPreviewRows(scope);
    if (!segments.length) {
      return '';
    }
    const fillStyle = this._getEffectiveFillStyleValue(scope);
    const stops = [];
    segments.forEach((segment) => {
      const from = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.from)));
      const to = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.to)));
      stops.push(`${segment.color} ${from}%`, `${segment.color} ${to}%`);
    });
    if (fillStyle === 'bands') {
      return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
    }
    return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
  }

  _getSegmentPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-segment-preview`,
        trackId: `entity-${scope.index}-segment-preview-track`,
      };
    }
    return {
      previewId: 'card-segment-preview',
      trackId: 'card-segment-preview-track',
    };
  }

  _renderSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    return `
      <div id="${previewId}" class="gradient-preview segment-preview">
        <div id="${trackId}" class="gradient-preview-track segment-preview-track" style="${this._escapeAttribute(this._buildEditorSegmentPreviewStyle(scope) ?? '')}">
          ${uniqueMarkers.map((marker, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${this._escapeAttribute(String(marker))}%"
              title="${this._escapeAttribute(`${marker}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _refreshSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    const track = this._getShadowElementById(trackId);
    if (!track) {
      return;
    }
    track.setAttribute('style', this._buildEditorSegmentPreviewStyle(scope) ?? '');
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    track.innerHTML = uniqueMarkers.map((marker, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${this._escapeAttribute(String(marker))}%"
        title="${this._escapeAttribute(`${marker}%`)}"
      ></span>
    `).join('');
  }

  _getSegmentDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        hintPrefix: `entity-${scope.index}-segment-row-hint-`,
        draftHintId: `entity-${scope.index}-segment-draft-hint`,
        addSelector: `button[data-action="add-entity-segment"][data-index="${scope.index}"]`,
      };
    }
    return {
      hintPrefix: 'segment-row-hint-',
      draftHintId: 'segment-draft-hint',
      addSelector: 'button[data-action="add-segment"]',
    };
  }

  _refreshSegmentUi(scope = { type: 'card' }) {
    this._refreshSegmentPreview(scope);
    if (!this.shadowRoot) {
      return;
    }
    const { hintPrefix, draftHintId, addSelector } = this._getSegmentDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddSegment(scope);
    }
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    rows.forEach((_, index) => {
      const hint = this._getShadowElementById(`${hintPrefix}${index}`);
      const message = this._getSegmentRowValidationMessage(scope, index);
      if (hint) {
        hint.textContent = message;
        hint.setAttribute?.('style', message ? '' : 'display:none');
      }
    });
    const draftHint = this._getShadowElementById(draftHintId);
    if (draftHint) {
      const message = this._getSegmentDraftValidationMessage(scope);
      draftHint.textContent = message;
      draftHint.setAttribute?.('style', message ? '' : 'display:none');
    }
  }

  _commitSegmentDraft(scope = { type: 'card' }) {
    const draftSegment = this._getValidSegmentDraft(scope);
    if (!draftSegment) {
      this._refreshSegmentUi(scope);
      return false;
    }
    const committedSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const nextSegments = this._sortSegmentsForEditor([...committedSegments, draftSegment]);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true });
    if (applied !== false) {
      this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
    }
    return applied;
  }

  _commitSegmentBoundaryEdit(scope = { type: 'card' }, segmentIndex, field, rawValue, inputEl = null) {
    this._setSegmentBoundaryText(scope, segmentIndex, field, rawValue);
    const normalizedText = this._normalizeTextValue(rawValue).trim();
    const parsedValue = this._parseSegmentBoundaryInput(rawValue);
    const nextValue = parsedValue === null ? normalizedText : parsedValue;
    const currentSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const nextSegments = currentSegments.map((segment, currentIndex) => (
      currentIndex === segmentIndex
        ? { ...segment, [field]: nextValue }
        : segment
    ));
    this._clearSegmentBoundaryText(scope, segmentIndex, field);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true });
    const message = this._getSegmentRowValidationMessage(scope, segmentIndex);
    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity(message || '');
      if (message) {
        inputEl.reportValidity?.();
      }
    }
    return applied;
  }

  _commitGradientStopDraft(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop || this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      this._refreshGradientDraftUi(scope);
      return false;
    }
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const nextStops = [...committedStops, draftStop].sort((left, right) => left.pos - right.pos);
    const applied = this._setScopedGradientStops(scope, nextStops, { rerender: true });
    if (applied !== false) {
      this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
        pos: (() => {
          const suggestion = this._getNextSuggestedGradientStopPos(scope);
          return suggestion === '' ? '' : String(suggestion);
        })(),
        color: draftStop.color,
      });
    }
    return applied;
  }

  _getGradientPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-gradient-preview`,
        trackId: `entity-${scope.index}-gradient-preview-track`,
        hintId: `entity-${scope.index}-gradient-draft-hint`,
        addSelector: `button[data-action="add-entity-gradient-stop"][data-index="${scope.index}"]`,
        draftInputId: `entity-${scope.index}-gradient-draft-pos`,
      };
    }
    return {
      previewId: 'card-gradient-preview',
      trackId: 'card-gradient-preview-track',
      hintId: 'gradient-draft-hint',
      addSelector: 'button[data-action="add-gradient-stop"]',
      draftInputId: 'gradient-draft-pos',
    };
  }

  _refreshGradientDraftUi(scope = { type: 'card' }) {
    if (!this.shadowRoot) {
      return;
    }
    const getById = this.shadowRoot.getElementById?.bind(this.shadowRoot)
      ?? ((id) => this.shadowRoot.querySelector?.(`#${id}`) ?? null);
    const { previewId, trackId, hintId, addSelector, draftInputId } = this._getGradientPreviewDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddGradientStop(scope);
    }

    const draftInput = getById(draftInputId);
    if (draftInput && typeof draftInput.closest !== 'function') {
      this._render();
      return;
    }
    const draftContainer = draftInput?.closest('.gradient-stop-draft');
    const nextMessage = this._getGradientDraftValidationMessage(scope);
    const existingHint = getById(hintId);
    if (nextMessage) {
      if (existingHint) {
        existingHint.textContent = nextMessage;
      } else if (draftContainer) {
        const hint = document.createElement('div');
        hint.id = hintId;
        hint.className = 'section-note';
        hint.textContent = nextMessage;
        draftContainer.appendChild(hint);
      }
    } else if (existingHint) {
      existingHint.remove();
    }

    const preview = getById(previewId);
    const track = getById(trackId);
    if (!preview || !track) {
      return;
    }
    track.setAttribute('style', this._getGradientPreviewStyle(scope) ?? '');
    const markerStops = this._buildGradientPreviewEffectiveStops(scope);
    const renderedStops = markerStops.length ? markerStops : this._getDefaultGradientStops();
    track.innerHTML = renderedStops.map((stop, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${this._escapeAttribute(String(stop.pos))}%"
        title="${this._escapeAttribute(`${stop.pos}%`)}"
      ></span>
    `).join('');
  }

  _commitGradientStopPosEdit(scope = { type: 'card' }, stopIndex, rawValue, inputEl = null) {
    const nextPos = this._normalizeGradientStopPosValue(rawValue);
    if (nextPos === null || this._hasGradientStopDuplicate(scope, nextPos, stopIndex)) {
      if (inputEl?.setCustomValidity) {
        inputEl.setCustomValidity(nextPos === null
          ? 'Enter a value from 0 to 100.'
          : 'Position already exists.');
        if (inputEl.reportValidity) {
          inputEl.reportValidity();
        }
      }
      return false;
    }

    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity('');
    }

    const currentStops = this._getScopedGradientStopsValue(scope);
    const nextStops = currentStops.map((stop, currentStopIndex) => (
      currentStopIndex === stopIndex
        ? { ...stop, pos: nextPos }
        : stop
    ));
    this._clearGradientStopPosText(scope, stopIndex);
    return this._setScopedGradientStops(scope, nextStops, { rerender: true });
  }

  _getFillStyleValue() {
    return this._getScopedFillStyleValue({ type: 'card' });
  }

  _getFillStyleFromColorMode(colorMode) {
    switch (colorMode) {
      case 'single': return 'solid';
      case 'gradient': return 'gradient';
      case 'severity': return 'bands';
      case 'severity_gradient': return 'band_gradient';
      default: return 'bands';
    }
  }

  _getScopedFillStyleValue(scope) {
    const fillStyle = this._getScopedValue(scope, ['bar', 'fill_style']);
    if (fillStyle) return fillStyle;
    const colorMode = this._getScopedValue(scope, ['bar', 'color_mode']) ?? this._getScopedValue(scope, ['color_mode']);
    return this._getFillStyleFromColorMode(colorMode);
  }

  _getEffectiveScopedFillStyleValue(scope) {
    if (scope?.type !== 'entity') {
      return this._getScopedFillStyleValue(scope);
    }
    return this._getEffectiveFillStyleValue(scope);
  }

  _setScopedBarFillStyle(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || normalizedValue === 'bands') {
      return this._removeCanonicalScopedValue(scope, ['bar', 'fill_style'], {
        deprecatedKeys: [['color_mode']],
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['bar', 'fill_style'], normalizedValue, {
      deprecatedKeys: [['color_mode']],
      prunePaths: [['bar']],
    });
  }

  _getScopedBarColorValue(scope) {
    return this._getScopedValue(scope, ['bar', 'color'])
      ?? this._getScopedValue(scope, ['color'])
      ?? '#4a9eff';
  }

  _getEffectiveScopedBarColorValue(scope) {
    const value = this._getEffectiveScopedDisplayValue(scope, ['bar', 'color'], [['color']]);
    return value || '#4a9eff';
  }

  _setScopedBarColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || this._normalizeColorComparisonValue(normalizedValue) === this._normalizeColorComparisonValue('#4a9eff')) {
      return this._removeCanonicalScopedValue(scope, ['bar', 'color'], {
        deprecatedKeys: [['color']],
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['bar', 'color'], normalizedValue, {
      deprecatedKeys: [['color']],
      prunePaths: [['bar']],
    });
  }

  _getScopedBarSolidFillValue(scope) {
    return !!this._getScopedValue(scope, ['bar', 'solid_fill']);
  }

  _getEffectiveScopedBarSolidFillValue(scope) {
    if (scope?.type !== 'entity') {
      return this._getScopedBarSolidFillValue(scope);
    }
    const localValue = this._getScopedValue(scope, ['bar', 'solid_fill']);
    if (localValue !== undefined) {
      return !!localValue;
    }
    return this._getScopedBarSolidFillValue({ type: 'card' });
  }

  _setScopedBarSolidFill(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['bar', 'solid_fill'], {
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['bar', 'solid_fill'], true, {
      prunePaths: [['bar']],
    });
  }

  _clearEntityBarAppearance(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'fill_style']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'color']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'solid_fill']);
      nextTarget = this._deletePathValue(nextTarget, ['color_mode']);
      nextTarget = this._deletePathValue(nextTarget, ['color']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasEntityBarAppearanceOverride(scope) {
    const barValue = this._getScopedValue(scope, ['bar']) ?? {};
    if (this._isObject(barValue) && (
      Object.prototype.hasOwnProperty.call(barValue, 'fill_style')
      || Object.prototype.hasOwnProperty.call(barValue, 'color')
      || Object.prototype.hasOwnProperty.call(barValue, 'solid_fill')
    )) {
      return true;
    }
    return this._getScopedValue(scope, ['color_mode']) !== undefined
      || this._getScopedValue(scope, ['color']) !== undefined;
  }

  _getScopedNeedleConfig(scope) {
    const rawNeedle = this._getScopedValue(scope, ['bar', 'needle']);
    const defaultColor = '#ffffff';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (typeof rawNeedle === 'boolean') {
      mode = rawNeedle ? 'enabled' : 'disabled';
    } else if (this._isObject(rawNeedle)) {
      if (rawNeedle.show === true) {
        mode = 'enabled';
      } else if (rawNeedle.show === false) {
        mode = 'disabled';
      } else if (scope?.type !== 'entity') {
        mode = 'disabled';
      }
      color = rawNeedle.color ?? '';
    }

    if (color === defaultColor) {
      color = '';
    }

    return { mode, color };
  }

  _hasNeedleOverride(scope) {
    return this._getScopedValue(scope, ['bar', 'needle']) !== undefined;
  }

  _getEffectiveScopedNeedleConfig(scope) {
    const localNeedle = this._getScopedNeedleConfig(scope);
    if (scope?.type !== 'entity') {
      return localNeedle;
    }
    if (!this._hasNeedleOverride(scope)) {
      return this._getScopedNeedleConfig({ type: 'card' });
    }
    const inheritedNeedle = this._getScopedNeedleConfig({ type: 'card' });
    return {
      mode: localNeedle.mode === 'inherit' ? inheritedNeedle.mode : localNeedle.mode,
      color: localNeedle.color || inheritedNeedle.color,
    };
  }

  _setScopedNeedleMode(scope, mode) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const existingNeedle = this._getPathValue(nextTarget, ['bar', 'needle']);
      const existingColor = this._isObject(existingNeedle) ? existingNeedle.color : undefined;

      nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle']);

      if (scope?.type === 'entity' && mode === 'inherit') {
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      if (mode === 'disabled') {
        if (scope?.type === 'entity') {
          nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], { show: false });
        }
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      const nextNeedle = { show: true };
      if (existingColor && existingColor !== '#ffffff') {
        nextNeedle.color = existingColor;
      }
      nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
      const baselineEnabled = this._getPathValue(nextTarget, ['baseline', 'enabled']);
      const baselineParts = this._getResolvablePartsFromTarget(nextTarget ?? {}, 'baseline', {
        canonicalBasePath: ['baseline', 'at'],
        legacyFixedPath: ['baseline'],
        legacyEntityPath: ['baseline', 'at', 'entity'],
      });
      const baselineActive = baselineEnabled === true || (baselineEnabled !== false && this._hasResolvableOverride(baselineParts));
      if (baselineActive) {
        nextTarget = this._deletePathValue(nextTarget, ['baseline']);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _setScopedNeedleColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const current = this._getScopedNeedleConfig(scope);
      const hasCustomColor = normalizedValue
        && this._normalizeColorComparisonValue(normalizedValue) !== this._normalizeColorComparisonValue('#ffffff');

      nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle', 'color']);

      if (scope?.type !== 'entity' && current.mode === 'disabled') {
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      const showValue = current.mode === 'enabled'
        ? true
        : current.mode === 'disabled'
          ? false
          : undefined;

      const nextNeedle = {};
      if (showValue !== undefined) {
        nextNeedle.show = showValue;
      }
      if (hasCustomColor) {
        nextNeedle.color = normalizedValue;
      }

      if (Object.keys(nextNeedle).length) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle']);
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _getNeedleValue() {
    return this._getScopedNeedleConfig({ type: 'card' }).mode === 'enabled';
  }

  _getPeakShowValue() {
    return this._getScopedPeakConfig({ type: 'card' }).mode === 'enabled';
  }

  _getScaleFixedValue(key, fallbackKey) {
    return this._getResolvableScopedValue({ type: 'card' }, key).fixed;
  }

  _getScaleEntityValue(key) {
    return this._getResolvableScopedValue({ type: 'card' }, key).entity;
  }

  _getTargetResolvableValue(scope) {
    return this._getResolvableScopedValue(scope, 'target', {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
    });
  }

  _getEffectiveTargetResolvableValue(scope) {
    return this._getEffectiveResolvableScopedValue(scope, 'target', {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
    });
  }

  _getTargetMode(scope) {
    const enabled = this._getScopedValue(scope, ['target', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasTargetOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getEffectiveTargetMode(scope) {
    const mode = this._getTargetMode(scope);
    if (scope?.type !== 'entity' || mode !== 'inherit') {
      return mode;
    }
    const cardMode = this._getTargetMode({ type: 'card' });
    if (cardMode === 'disabled') return 'disabled';
    if (cardMode === 'enabled') return 'enabled';
    const cardTarget = this._getTargetResolvableValue({ type: 'card' });
    return this._hasResolvableOverride(cardTarget)
      || this._hasCustomTargetColor({ type: 'card' })
      || this._getTargetLabelShowValue({ type: 'card' })
      || !!this._getTargetAboveFillColorValue({ type: 'card' })
      ? 'enabled'
      : 'disabled';
  }

  _setTargetMode(scope, mode) {
    if (scope?.type === 'entity' && mode === 'inherit') {
      return this._clearTargetOverride(scope);
    }
    if (mode === 'auto') {
      return this._removeCanonicalScopedValue(scope, ['target', 'enabled'], {
        prunePaths: [['target']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['target', 'enabled'], mode === 'enabled', {
      prunePaths: [['target']],
    });
  }

  _setTargetResolvablePart(scope, part, rawValue) {
    return this._setCanonicalResolvablePart(scope, 'target', part, rawValue, {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
      prunePaths: [['target', 'at'], ['target']],
    });
  }

  _clearTargetOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const rawTarget = this._getPathValue(nextTarget, ['target']);
      if (this._isObject(rawTarget)) {
        nextTarget = this._deletePathValue(nextTarget, ['target', 'enabled']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'at']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'color']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'label', 'show']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'when_exceeded', 'fill_color']);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['target']);
      }
      nextTarget = this._deletePathValue(nextTarget, ['target_entity']);
      nextTarget = this._deletePathValue(nextTarget, ['target_color']);
      nextTarget = this._deletePathValue(nextTarget, ['show_target_label']);
      nextTarget = this._deletePathValue(nextTarget, ['above_target_color']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target', 'label']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target', 'when_exceeded']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target']);
      return nextTarget;
    }, { rerender: true });
  }

  _getTargetColorValue(scope) {
    return this._getScopedValue(scope, ['target', 'color'])
      ?? this._getScopedValue(scope, ['target_color'])
      ?? '';
  }

  _getEffectiveTargetColorValue(scope) {
    return this._getEffectiveScopedDisplayValue(scope, ['target', 'color'], [['target_color']]);
  }

  _hasCustomTargetColor(scope) {
    const color = this._getTargetColorValue(scope);
    return !!color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888');
  }

  _setTargetColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || this._normalizeColorComparisonValue(normalizedValue) === this._normalizeColorComparisonValue('#888')) {
      return this._removeCanonicalScopedValue(scope, ['target', 'color'], {
        deprecatedKeys: [['target_color']],
        prunePaths: [['target']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['target', 'color'], normalizedValue, {
      deprecatedKeys: [['target_color']],
      prunePaths: [['target']],
    });
  }

  _getTargetLabelShowValue(scope) {
    const structuredValue = this._getScopedValue(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    return !!this._getScopedValue(scope, ['show_target_label']);
  }

  _getEffectiveTargetLabelShowValue(scope) {
    const structuredValue = this._getScopedValue(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    const legacyValue = this._getScopedValue(scope, ['show_target_label']);
    if (legacyValue !== undefined) {
      return !!legacyValue;
    }
    if (scope?.type === 'entity') {
      return this._getTargetLabelShowValue({ type: 'card' });
    }
    return false;
  }

  _setTargetLabelShow(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['target', 'label', 'show'], {
        deprecatedKeys: [['show_target_label']],
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['target', 'label', 'show'], true, {
      deprecatedKeys: [['show_target_label']],
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _getTargetAboveFillColorValue(scope) {
    return this._getScopedValue(scope, ['target', 'when_exceeded', 'fill_color'])
      ?? this._getScopedValue(scope, ['above_target_color'])
      ?? '';
  }

  _getTargetAboveFillDraftKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _setTargetAboveFillDraft(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const key = this._getTargetAboveFillDraftKey(scope);
    if (normalizedValue) {
      this._targetAboveFillDrafts.set(key, normalizedValue);
    } else {
      this._targetAboveFillDrafts.delete(key);
    }
  }

  _getTargetAboveFillDraft(scope) {
    return this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(scope)) ?? '';
  }

  _getBaselineColorDraftKey(scope = { type: 'card' }, direction = 'above') {
    const scopeKey = scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
    return `${scopeKey}:${direction}`;
  }

  _setBaselineColorDraft(scope, direction, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const key = this._getBaselineColorDraftKey(scope, direction);
    if (normalizedValue) {
      this._baselineColorDrafts.set(key, normalizedValue);
    } else {
      this._baselineColorDrafts.delete(key);
    }
  }

  _getBaselineColorDraft(scope, direction) {
    return this._baselineColorDrafts.get(this._getBaselineColorDraftKey(scope, direction)) ?? '';
  }

  _getEffectiveTargetAboveFillColorValue(scope) {
    return this._getEffectiveScopedDisplayValue(scope, ['target', 'when_exceeded', 'fill_color'], [['above_target_color']]);
  }

  _setTargetAboveFillColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    this._setTargetAboveFillDraft(scope, normalizedValue);
    if (!this._isTargetAboveFillEnabled(scope)) {
      return false;
    }
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['target', 'when_exceeded', 'fill_color'], normalizedValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _isTargetAboveFillEnabled(scope) {
    return !!this._normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
  }

  _setTargetAboveFillEnabled(scope, value) {
    const currentValue = this._normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
    if (!value) {
      if (currentValue) {
        this._setTargetAboveFillDraft(scope, currentValue);
      }
      return this._removeCanonicalScopedValue(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    const nextValue = this._getTargetAboveFillDraft(scope)
      || this._normalizeTextValue(this._getEffectiveTargetAboveFillColorValue(scope)).trim()
      || currentValue
      || '#000000';
    return this._setCanonicalScopedTextOverride(scope, ['target', 'when_exceeded', 'fill_color'], nextValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _isBaselineDirectionalColorEnabled(scope, direction) {
    return !!this._normalizeTextValue(this._getBaselineDirectionalColorValue(scope, direction)).trim();
  }

  _setBaselineDirectionalColorEnabled(scope, direction, value) {
    const currentValue = this._normalizeTextValue(this._getBaselineDirectionalColorValue(scope, direction)).trim();
    if (!value) {
      if (currentValue) {
        this._setBaselineColorDraft(scope, direction, currentValue);
      }
      return this._removeCanonicalScopedValue(scope, ['baseline', direction, 'color'], {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    const nextValue = this._getBaselineColorDraft(scope, direction)
      || this._normalizeTextValue(this._getEffectiveBaselineDirectionalColorValue(scope, direction)).trim()
      || currentValue
      || '#000000';
    return this._setCanonicalScopedTextOverride(scope, ['baseline', direction, 'color'], nextValue, {
      prunePaths: [['baseline', direction], ['baseline']],
    });
  }

  _hasTargetOverride(scope) {
    const targetValue = this._getScopedValue(scope, ['target']);
    if (this._isObject(targetValue) && Object.keys(targetValue).length) {
      return true;
    }
    if (!this._isObject(targetValue) && targetValue !== undefined && targetValue !== null && targetValue !== '') {
      return true;
    }
    return ['target_entity', 'target_color', 'show_target_label', 'above_target_color']
      .some((key) => {
        const value = this._getScopedValue(scope, [key]);
        return value !== undefined && value !== null && value !== '' && value !== false;
      });
  }

  _getBaselineResolvableValue(scope) {
    return this._getResolvableScopedValue(scope, 'baseline', {
      canonicalBasePath: ['baseline', 'at'],
      legacyFixedPath: ['baseline'],
      legacyEntityPath: ['baseline', 'at', 'entity'],
    });
  }

  _getEffectiveBaselineResolvableValue(scope) {
    return this._getEffectiveResolvableScopedValue(scope, 'baseline', {
      canonicalBasePath: ['baseline', 'at'],
      legacyFixedPath: ['baseline'],
      legacyEntityPath: ['baseline', 'at', 'entity'],
    });
  }

  _getBaselineMode(scope) {
    const enabled = this._getScopedValue(scope, ['baseline', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasBaselineOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getEffectiveBaselineMode(scope) {
    const mode = this._getBaselineMode(scope);
    if (scope?.type !== 'entity' || mode !== 'inherit') {
      return mode;
    }
    const cardMode = this._getBaselineMode({ type: 'card' });
    if (cardMode === 'disabled') return 'disabled';
    if (cardMode === 'enabled') return 'enabled';
    const cardBaseline = this._getBaselineResolvableValue({ type: 'card' });
    return this._hasResolvableOverride(cardBaseline)
      || !!this._getBaselineDirectionalColorValue({ type: 'card' }, 'above')
      || !!this._getBaselineDirectionalColorValue({ type: 'card' }, 'below')
      ? 'enabled'
      : 'disabled';
  }

  _setBaselineMode(scope, mode) {
    if (scope?.type === 'entity' && mode === 'inherit') {
      return this._clearBaselineOverride(scope);
    }
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      if (mode === 'auto') {
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'enabled']);
      } else {
        nextTarget = this._setPathValue(nextTarget, ['baseline', 'enabled'], mode === 'enabled');
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    });
  }

  _setBaselineResolvablePart(scope, part, rawValue) {
    const normalizedValue = part === 'fixed'
      ? this._normalizeNumberValue(rawValue)
      : this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      const currentParts = this._getResolvablePartsFromTarget(target ?? {}, 'baseline', {
        canonicalBasePath: ['baseline', 'at'],
        legacyFixedPath: ['baseline'],
        legacyEntityPath: ['baseline', 'at', 'entity'],
      });
      const nextParts = { ...currentParts };

      if (part === 'fixed') {
        if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
          delete nextParts.fixed;
        } else {
          nextParts.fixed = normalizedValue;
        }
      } else if (!normalizedValue) {
        delete nextParts.entity;
      } else {
        nextParts.entity = normalizedValue;
      }

      let nextTarget = this._cloneDeep(target);
      nextTarget = this._deletePathValue(nextTarget, ['baseline', 'at']);

      const hasFixed = nextParts.fixed !== undefined && nextParts.fixed !== null && nextParts.fixed !== '';
      const hasEntity = nextParts.entity !== undefined && nextParts.entity !== null && nextParts.entity !== '';
      if (hasFixed || hasEntity) {
        const nextValue = {};
        if (hasFixed) nextValue.fixed = nextParts.fixed;
        if (hasEntity) nextValue.entity = nextParts.entity;
        nextTarget = this._setPathValue(nextTarget, ['baseline', 'at'], nextValue);
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'at']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    });
  }

  _removeScopedNeedle(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'needle']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _setBaselineDirectionalColor(scope, direction, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    this._setBaselineColorDraft(scope, direction, normalizedValue);
    const path = ['baseline', direction, 'color'];
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, path, {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    if (!this._isBaselineDirectionalColorEnabled(scope, direction)) {
      return this._setBaselineDirectionalColorEnabled(scope, direction, true);
    }
    return this._applyScopedMutation(scope, (target) => {
      return this._setPathValue(target, path, normalizedValue);
    });
  }

  _getBaselineDirectionalColorValue(scope, direction) {
    return this._getScopedValue(scope, ['baseline', direction, 'color']) ?? '';
  }

  _getEffectiveBaselineDirectionalColorValue(scope, direction) {
    return this._getEffectiveScopedDisplayValue(scope, ['baseline', direction, 'color']);
  }

  _clearBaselineOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const rawBaseline = this._getPathValue(nextTarget, ['baseline']);
      if (this._isObject(rawBaseline)) {
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'enabled']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'at']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'above', 'color']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'below', 'color']);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['baseline']);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'above']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'below']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasBaselineOverride(scope) {
    const baselineValue = this._getScopedValue(scope, ['baseline']);
    if (this._isObject(baselineValue) && Object.keys(baselineValue).length) {
      return true;
    }
    return !this._isObject(baselineValue) && baselineValue !== undefined && baselineValue !== null && baselineValue !== '';
  }

  _isEntityOverrideExpanded(index) {
    return this._expandedEntityOverrides.has(index);
  }

  _toggleEntityOverrideExpanded(index) {
    if (this._expandedEntityOverrides.has(index)) {
      this._expandedEntityOverrides.delete(index);
    } else {
      this._expandedEntityOverrides.add(index);
    }
    this._render();
  }

  _syncExpandedEntityOverrides(entityCount) {
    const nextExpanded = new Set();
    this._expandedEntityOverrides.forEach((index) => {
      if (index < entityCount) nextExpanded.add(index);
    });
    this._expandedEntityOverrides = nextExpanded;
    const nextGroups = new Set();
    this._expandedOverrideGroups.forEach((key) => {
      const [indexText, group] = String(key).split(':');
      const index = Number(indexText);
      if (Number.isInteger(index) && index < entityCount && group) {
        nextGroups.add(`${index}:${group}`);
      }
    });
    this._expandedOverrideGroups = nextGroups;
  }

  _isCardGroupExpanded(group) {
    return this._expandedCardGroups.has(group);
  }

  _toggleCardGroupExpanded(group) {
    if (this._expandedCardGroups.has(group)) {
      this._expandedCardGroups.delete(group);
    } else {
      this._expandedCardGroups.add(group);
    }
    this._render();
  }

  _getOverrideGroupKey(index, group) {
    return `${index}:${group}`;
  }

  _isOverrideGroupExpanded(index, group) {
    return this._expandedOverrideGroups.has(this._getOverrideGroupKey(index, group));
  }

  _toggleOverrideGroupExpanded(index, group) {
    const key = this._getOverrideGroupKey(index, group);
    if (this._expandedOverrideGroups.has(key)) {
      this._expandedOverrideGroups.delete(key);
    } else {
      this._expandedOverrideGroups.add(key);
    }
    this._render();
  }

  _hasExplicitOverrideValue(value) {
    return value !== '' && value !== undefined && value !== null;
  }

  _hasResolvableOverride(parts) {
    return this._hasExplicitOverrideValue(parts?.fixed) || this._hasExplicitOverrideValue(parts?.entity);
  }

  _getScaleOverrideSummary(scope) {
    const parts = [];
    const min = this._getResolvableScopedValue(scope, 'min');
    const max = this._getResolvableScopedValue(scope, 'max');
    if (min.entity) parts.push('Min entity');
    else if (min.fixed !== '' && min.fixed !== undefined) parts.push(`Min ${min.fixed}`);
    if (max.entity) parts.push('Max entity');
    else if (max.fixed !== '' && max.fixed !== undefined) parts.push(`Max ${max.fixed}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getLayoutSummary(scope) {
    const parts = [];
    const height = this._getScopedLayoutValue(scope, 'height');
    const position = this._getScopedLayoutValue(scope, 'position');
    const width = this._getScopedLayoutValue(scope, 'width');
    if (height !== '') parts.push(`Height ${height}`);
    if (position !== '') parts.push(`${position}`);
    if (width !== '') parts.push(`Width ${width}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getTargetOverrideSummary(scope) {
    const mode = this._getTargetMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const target = this._getTargetResolvableValue(scope);
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(`Target ${target.fixed}`);
    if (target.entity) parts.push('Entity');
    if (this._hasCustomTargetColor(scope)) parts.push('Custom color');
    if (this._getTargetLabelShowValue(scope)) parts.push('Label');
    if (this._getTargetAboveFillColorValue(scope)) parts.push('Above');
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getBaselineOverrideSummary(scope) {
    const mode = this._getBaselineMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const baseline = this._getBaselineResolvableValue(scope);
    if (baseline.fixed !== '' && baseline.fixed !== undefined) parts.push(`Baseline ${baseline.fixed}`);
    if (baseline.entity) parts.push('Entity');
    if (this._getBaselineDirectionalColorValue(scope, 'above')) parts.push('Above');
    if (this._getBaselineDirectionalColorValue(scope, 'below')) parts.push('Below');
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getBarAppearanceSummary(scope) {
    const parts = [];
    const fillStyle = this._getScopedFillStyleValue(scope);
    const color = this._getScopedValue(scope, ['bar', 'color']) ?? this._getScopedValue(scope, ['color']);
    if (fillStyle && fillStyle !== 'bands') parts.push(fillStyle.replace(/_/g, ' '));
    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#4a9eff')) {
      parts.push('Custom color');
    }
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getScopedSegmentsValue(scope) {
    const uiRows = this._getSegmentsUiRows(scope);
    if (uiRows !== null) {
      return this._cloneDeep(uiRows);
    }
    const storedSegments = this._getStoredScopedSegments(scope);
    if (storedSegments !== null) {
      return this._sortSegmentsForEditor(storedSegments);
    }
    return this._sortSegmentsForEditor(this._getFallbackSegments(scope));
  }

  _hasSegmentsOverride(scope) {
    return this._getStoredScopedSegments(scope) !== null;
  }

  _getSegmentsSummary(scope) {
    const segments = this._getScopedSegmentsValue(scope);
    if (!Array.isArray(segments) || segments.length === 0) {
      return 'Inherited';
    }
    if (scope?.type !== 'entity' && !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))) {
      return 'Default bands';
    }
    return `${segments.length} segments`;
  }

  _getEffectiveFillStyleValue(scope) {
    if (scope?.type === 'entity') {
      const hasEntityFillStyle =
        this._getScopedValue(scope, ['bar', 'fill_style']) !== undefined
        || this._getScopedValue(scope, ['bar', 'color_mode']) !== undefined
        || this._getScopedValue(scope, ['color_mode']) !== undefined;
      if (hasEntityFillStyle) {
        return this._getScopedFillStyleValue(scope);
      }
      return this._getFillStyleValue();
    }
    return this._getScopedFillStyleValue(scope);
  }

  _getScopedGradientStopsValue(scope) {
    const localRows = this._getGradientStopsUiRows(scope);
    if (Array.isArray(localRows)) {
      return localRows;
    }
    const storedStops = this._getStoredScopedGradientStops(scope);
    if (storedStops !== null) {
      return this._sanitizeGradientStopsForEmit(storedStops);
    }
    return this._cloneDeep(this._getFallbackGradientStops(scope));
  }

  _hasGradientStopsOverride(scope) {
    if (this._getStoredScopedGradientStops(scope) !== null) {
      return true;
    }
    const localRows = this._getGradientStopsUiRows(scope);
    if (!Array.isArray(localRows)) {
      return false;
    }
    return this._serializeConfig(this._sanitizeGradientStopsForEmit(localRows))
      !== this._serializeConfig(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(scope)));
  }

  _getGradientStopsSummary(scope) {
    if (scope?.type === 'entity' && !this._hasGradientStopsOverride(scope)) {
      return 'Inherited';
    }
    const gradientStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (this._getEffectiveFillStyleValue(scope) !== 'gradient') {
      return 'Inactive fill style';
    }
    if (!gradientStops.length) {
      return scope?.type === 'entity' ? 'Inherited' : 'Default gradient';
    }
    if (this._isDefaultGradientStops(gradientStops)) {
      return 'Default gradient';
    }
    return `${gradientStops.length} stops`;
  }

  _buildGradientPreviewEffectiveStops(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const draftStop = this._getValidGradientDraftStop(scope);
    const previewStops = [...committedStops];
    if (draftStop && !this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      previewStops.push(draftStop);
    }
    return previewStops.sort((left, right) => left.pos - right.pos);
  }

  _buildEditorGradientPreviewStyle(stops) {
    if (!Array.isArray(stops) || !stops.length) {
      return '';
    }
    const cssStops = stops
      .map((stop) => {
        const color = this._normalizeTextValue(stop.color).trim();
        const pos = this._normalizeGradientStopPosValue(stop.p ?? stop.pos);
        if (!color || pos === null) {
          return null;
        }
        return `${color} ${pos}%`;
      })
      .filter(Boolean);
    if (!cssStops.length) {
      return '';
    }
    return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
  }

  _getGradientPreviewStyle(scope = { type: 'card' }) {
    const previewStops = this._buildGradientPreviewEffectiveStops(scope);
    const resolvedStops = previewStops.length >= 2
      ? previewStops.map((stop) => ({ p: stop.pos, color: stop.color }))
      : this._getDefaultGradientStops().map((stop) => ({ p: stop.pos, color: stop.color }));
    return this._buildEditorGradientPreviewStyle(resolvedStops);
  }

  _renderGradientPreview(scope = { type: 'card' }, options = {}) {
    const previewId = options.previewId ?? 'gradient-preview';
    const trackId = options.trackId ?? `${previewId}-track`;
    const effectiveStops = this._buildGradientPreviewEffectiveStops(scope);
    const markerStops = effectiveStops.length ? effectiveStops : this._getDefaultGradientStops();
    return `
      <div id="${previewId}" class="gradient-preview">
        <div id="${trackId}" class="gradient-preview-track" style="${this._escapeAttribute(this._getGradientPreviewStyle(scope) ?? '')}">
          ${markerStops.map((stop, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${this._escapeAttribute(String(stop.pos))}%"
              title="${this._escapeAttribute(`${stop.pos}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _getNeedleSummary(scope) {
    if (scope?.type === 'entity' && !this._hasNeedleOverride(scope)) return 'Inherited';
    const needle = this._getScopedNeedleConfig(scope);
    if (needle.mode === 'disabled') return needle.color ? 'Disabled • Custom color' : 'Disabled';
    if (needle.mode === 'enabled') return needle.color ? 'Enabled • Custom color' : 'Enabled';
    if (needle.color) return 'Custom color';
    return 'Inherited';
  }

  _getFormattingSummary(scope) {
    const parts = [];
    const unit = this._getScopedFormattingValue(scope, 'unit');
    const decimal = this._getScopedFormattingValue(scope, 'decimal');
    if (unit !== '') parts.push(`Unit ${unit}`);
    if (decimal !== '') parts.push(`${decimal} ${Number(decimal) === 1 ? 'decimal' : 'decimals'}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _renderOverrideGroup({ index, group, title, summary, content }) {
    const expanded = this._isOverrideGroupExpanded(index, group);
    return `
      <div class="override-group" data-group="${group}" data-expanded="${expanded ? 'true' : 'false'}">
        <button
          type="button"
          id="entity-${index}-group-${group}"
          class="override-group-toggle"
          data-action="toggle-override-group"
          data-index="${index}"
          data-group="${group}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <span
            id="entity-${index}-group-${group}-title"
            class="override-group-title"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${expanded ? '▾' : '▸'} ${title}</span>
          <span
            id="entity-${index}-group-${group}-summary"
            class="override-group-summary"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${this._escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? 'grid' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }

  _renderCardGroup({ group, title, summary, content, inactive = false }) {
    const expanded = this._isCardGroupExpanded(group);
    return `
      <div class="override-group card-subgroup${inactive ? ' is-inactive' : ''}" data-group="${group}" data-expanded="${expanded ? 'true' : 'false'}">
        <button
          type="button"
          id="card-group-${group}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${group}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <span id="card-group-${group}-title" class="override-group-title">${expanded ? '▾' : '▸'} ${title}</span>
          <span id="card-group-${group}-summary" class="override-group-summary">${this._escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? 'grid' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }

  _renderEntityInput(entry, index) {
    if (customElements.get('ha-entity-picker')) {
      return `<ha-entity-picker data-kind="entity-picker" data-index="${index}"></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="entity-input" data-index="${index}" value="${this._escapeAttribute(entry.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }

  _renderEntitySourceInput(kind, index, value, placeholder = 'sensor.example') {
    if (customElements.get('ha-entity-picker')) {
      return `<ha-entity-picker data-kind="${kind}" data-index="${index}"></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="${kind}" data-index="${index}" value="${this._escapeAttribute(value)}" placeholder="${this._escapeAttribute(placeholder)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }

  _escapeAttribute(value) {
    return this._normalizeTextValue(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _isHexColorValue(value) {
    return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  }

  _expandHexColor(value) {
    if (!this._isHexColorValue(value)) {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 7) {
      return normalized;
    }
    return `#${normalized.slice(1).split('').map((char) => char + char).join('')}`;
  }

  _normalizeColorComparisonValue(value) {
    const normalizedText = this._normalizeTextValue(value).trim().toLowerCase();
    if (!normalizedText) {
      return '';
    }
    return this._expandHexColor(normalizedText) ?? normalizedText;
  }

  _getColorPickerValue(value, fallbackHex = '#000000') {
    return this._expandHexColor(value) ?? this._expandHexColor(fallbackHex) ?? '#000000';
  }

  _renderColorInput({ id, field = null, kind = null, index = null, value = '', fallbackHex = '#000000', placeholder = '', extraDataset = {} }) {
    const controlValue = this._normalizeTextValue(value).trim();
    const pickerValue = this._getColorPickerValue(controlValue, fallbackHex);
    const extraAttrs = Object.entries(extraDataset)
      .map(([key, entry]) => `data-${key}="${this._escapeAttribute(entry)}"`)
      .join(' ');
    const baseAttrs = field
      ? `data-field="${field}"${extraAttrs ? ` ${extraAttrs}` : ''}`
      : `data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;
    const fallbackAttrs = field
      ? `data-field="${field}-text-fallback"${extraAttrs ? ` ${extraAttrs}` : ''}`
      : `data-kind="${kind}-text-fallback" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;

    return `
      <div class="field-grid">
        <input id="${id}" type="color" ${baseAttrs} value="${this._escapeAttribute(pickerValue)}">
        ${controlValue && !this._isHexColorValue(controlValue)
          ? `<input type="text" ${fallbackAttrs} value="${this._escapeAttribute(controlValue)}" placeholder="${this._escapeAttribute(placeholder || 'CSS color value')}">`
          : ''
        }
      </div>
    `;
  }

  _renderListRows(items, renderItem) {
    return items.map((item, index) => renderItem(item, index)).join('');
  }

  _render() {
    if (!this.shadowRoot || this._isRendering) return;
    this._isRendering = true;
    try {
      const entities = this._getEntitiesValue();
      const fillStyle = this._getFillStyleValue();
      const layoutLabelPosition = this._getScopedLayoutValue({ type: 'card' }, 'position') || 'left';
      const layoutHeight = this._getScopedLayoutValue({ type: 'card' }, 'height');
      const layoutLabelWidth = this._getScopedLayoutValue({ type: 'card' }, 'width');
      const barColor = this._getScopedBarColorValue({ type: 'card' });
      const barSolidFill = this._getScopedBarSolidFillValue({ type: 'card' });
      const cardNeedle = this._getScopedNeedleConfig({ type: 'card' });
      const gradientStops = this._getGradientStopsValue();
      const gradientDraft = this._getGradientStopsDraftState({ type: 'card' });
      const gradientDraftMessage = this._getGradientDraftValidationMessage({ type: 'card' });
      const segments = this._getSegmentsValue();
      const baseline = this._getBaselineResolvableValue({ type: 'card' });
      const baselineMode = this._getBaselineMode({ type: 'card' });
      const baselineAboveColor = this._getBaselineDirectionalColorValue({ type: 'card' }, 'above');
      const baselineBelowColor = this._getBaselineDirectionalColorValue({ type: 'card' }, 'below');
      const target = this._getTargetResolvableValue({ type: 'card' });
      const targetMode = this._getTargetMode({ type: 'card' });
      const targetColor = this._getTargetColorValue({ type: 'card' });
      const targetLabelShow = this._getTargetLabelShowValue({ type: 'card' });
      const targetAboveFillColor = this._getTargetAboveFillColorValue({ type: 'card' });
      const formattingUnit = this._getScopedFormattingValue({ type: 'card' }, 'unit');
      const formattingDecimal = this._getScopedFormattingValue({ type: 'card' }, 'decimal');
      const cardPeak = this._getScopedPeakConfig({ type: 'card' });
      const scaleMin = this._getScaleFixedValue('min', 'min');
      const scaleMax = this._getScaleFixedValue('max', 'max');
      const scaleMinEntity = this._getScaleEntityValue('min');
      const scaleMaxEntity = this._getScaleEntityValue('max');
      const gradientStopsSummary = this._getGradientStopsSummary({ type: 'card' });
      const gradientStopsInactive = this._getEffectiveFillStyleValue({ type: 'card' }) !== 'gradient';
      const defaultSegmentsVisible = !this._hasSegmentsOverride({ type: 'card' }) && this._isSegmentFillStyle(this._getEffectiveFillStyleValue({ type: 'card' }));
      this._syncExpandedEntityOverrides(entities.length);

      this.shadowRoot.innerHTML = `
	      <style>
	        :host {
	          display: block;
	        }
	        .editor {
	          display: grid;
	          gap: 18px;
	          padding: 10px 0 14px;
	        }
	        .section {
	          display: grid;
	          gap: 14px;
	          padding: 14px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 88%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 35%, transparent);
	          border-radius: 14px;
	          box-shadow: 0 1px 0 color-mix(in srgb, var(--divider-color, #888) 20%, transparent);
	        }
	        .section-head {
	          display: grid;
	          gap: 4px;
	        }
	        .section h3 {
	          margin: 0;
	          font-size: 1rem;
	          font-weight: 700;
	          letter-spacing: 0.01em;
	          color: var(--primary-text-color, #111);
	        }
	        .section-note {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	        }
	        .field-grid {
	          display: grid;
	          gap: 12px;
	        }
	        .editor-grid,
	        .field-row {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .inline-row {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	          align-items: end;
	        }
	        label {
	          font-size: 0.9rem;
	          font-weight: 500;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	        }
	        input,
	        select,
	        button {
	          font: inherit;
        }
        input[type="text"],
        input[type="number"],
	        input[type="color"],
	        select {
	          width: 100%;
	          box-sizing: border-box;
	          min-height: 42px;
	          padding: 8px 10px;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 82%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 38%, transparent);
	          border-radius: 10px;
	        }
	        input[type="color"] {
	          padding: 4px;
	          cursor: pointer;
	        }
	        input[type="text"]:focus,
	        input[type="number"]:focus,
	        input[type="color"]:focus,
	        select:focus {
	          outline: 2px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 55%, transparent);
	          outline-offset: 1px;
	        }
	        input[type="checkbox"] {
	          width: 18px;
	          height: 18px;
	        }
	        .toggle {
	          display: flex;
	          gap: 8px;
	          align-items: center;
	          flex-wrap: wrap;
	        }
	        .list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .list-row {
	          display: grid;
	          gap: 10px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: end;
	          min-width: 0;
	        }
	        .list-row.triple {
	          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
	        }
	        .list-row.segment-row {
	          grid-template-columns: minmax(72px, 1fr) minmax(72px, 1fr) minmax(52px, 64px) 40px;
	          align-items: center;
	        }
	        .list-row.segment-row > * {
	          min-width: 0;
	        }
	        .list-row.segment-row > button {
	          width: 40px;
	          min-width: 40px;
	          padding: 6px;
	          justify-self: end;
	        }
	        .list-row.gradient-stop-row {
	          grid-template-columns: minmax(110px, 1fr) minmax(120px, 1fr) auto;
	        }
	        .gradient-stop-list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .gradient-stop-draft {
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .segment-editor-row {
	          display: grid;
	          gap: 6px;
	          min-width: 0;
	        }
	        .segment-draft {
	          display: grid;
	          gap: 6px;
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .gradient-preview {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .gradient-preview-track {
	          position: relative;
	          width: 100%;
	          min-height: 28px;
	          min-width: 0;
	          border-radius: 999px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: linear-gradient(to right, #4CAF50 0%, #FF9800 50%, #F44336 100%);
	          box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-background-color, #fff) 35%, transparent);
	          overflow: hidden;
	        }
	        .gradient-preview-stop {
	          position: absolute;
	          top: 3px;
	          bottom: 3px;
	          width: 2px;
	          margin-left: -1px;
	          border-radius: 999px;
	          background: color-mix(in srgb, var(--primary-text-color, #111) 72%, transparent);
	          box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 52%, transparent);
	        }
	        .entity-shell {
	          display: grid;
	          gap: 10px;
	          padding: 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 68%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 14px;
	        }
	        .entity-main {
	          display: grid;
	          gap: 10px;
	          padding: 10px 12px 12px;
	          min-width: 0;
	          border-radius: 12px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	        }
	        .entity-header {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: start;
	          padding-bottom: 4px;
	          border-bottom: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	        }
	        .entity-header-main {
	          display: grid;
	          gap: 4px;
	          min-width: 0;
	          flex: 1 1 auto;
	        }
	        .entity-title {
	          font-size: 0.95rem;
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	        }
	        .entity-subtitle {
	          font-size: 0.8rem;
	          color: var(--secondary-text-color, #666);
	          min-width: 0;
	          overflow: hidden;
	          text-overflow: ellipsis;
	          white-space: nowrap;
	        }
	        .entity-actions {
	          display: flex;
	          flex-wrap: wrap;
	          justify-content: flex-end;
	          align-items: center;
	          gap: 8px;
	          flex: 0 0 auto;
	          min-width: min(100%, 240px);
	        }
	        .entity-actions button {
	          min-height: 34px;
	          padding: 6px 10px;
	          flex: 0 1 auto;
	        }
	        .entity-fields {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .override-toggle {
	          display: inline-flex;
	          align-items: center;
	          gap: 8px;
	          justify-self: start;
	          padding: 8px 10px;
	          border-radius: 10px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
	          color: var(--secondary-text-color, #666);
	          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
	        }
	        .override-toggle:hover,
	        .override-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 74%, transparent);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 28%, var(--divider-color, #888));
	          color: var(--primary-text-color, #111);
	        }
	        .override-toggle[aria-expanded="true"] {
	          color: var(--primary-text-color, #111);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 40%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 70%, transparent);
	        }
	        .override-panel {
	          display: grid;
	          gap: 12px;
	          padding: 12px 14px;
	          min-width: 0;
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          border-left: 4px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 65%, transparent);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #ffffff)) 82%, transparent);
	        }
	        .override-panel::before {
	          content: "Overrides";
	          font-size: 0.78rem;
	          font-weight: 700;
	          letter-spacing: 0.04em;
	          text-transform: uppercase;
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	          --override-group-accent: var(--accent-color, var(--primary-color, #03a9f4));
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 78%, transparent);
	          overflow: hidden;
	        }
	        .override-group[data-group="scale"] {
	          --override-group-accent: #4f8dff;
	        }
	        .override-group[data-group="target"] {
	          --override-group-accent: #ff9b3d;
	        }
	        .override-group[data-group="baseline"] {
	          --override-group-accent: #5bbd6d;
	        }
	        .override-group[data-group="bar"] {
	          --override-group-accent: #34c6d3;
	        }
	        .override-group[data-group="needle"] {
	          --override-group-accent: #9b6bff;
	        }
	        .override-group[data-group="formatting"] {
	          --override-group-accent: #d46be3;
	        }
	        .override-group[data-group="layout"] {
	          --override-group-accent: #6e90ff;
	        }
	        .override-group[data-group="peak"] {
	          --override-group-accent: #f08b3e;
	        }
	        .override-group[data-group="segments"] {
	          --override-group-accent: #d2a53a;
	        }
	        .override-group[data-group="gradient-stops"] {
	          --override-group-accent: #48b978;
	        }
	        .card-subgroup {
	          margin-top: 2px;
	        }
	        .override-group.is-inactive .override-group-summary,
	        .override-group.is-inactive .section-note {
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group.is-inactive .override-group-body {
	          opacity: 0.92;
	        }
	        .override-group-toggle {
	          display: flex;
	          justify-content: space-between;
	          align-items: flex-start;
	          gap: 12px;
	          width: 100%;
	          text-align: left;
	          border: 0;
	          border-radius: 0;
	          background: transparent;
	          padding: 10px 12px;
	          min-width: 0;
	        }
	        .override-group-toggle:hover,
	        .override-group-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
	        }
	        .override-group[data-expanded="true"] {
	          border-color: color-mix(in srgb, var(--override-group-accent) 34%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--override-group-accent) 70%, transparent);
	        }
	        .override-group-title {
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	          overflow-wrap: anywhere;
	        }
	        .override-group-summary {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	          text-align: right;
	          min-width: 0;
	          max-width: 42%;
	          white-space: nowrap;
	          overflow: hidden;
	          text-overflow: ellipsis;
	        }
	        .override-group-body {
	          display: grid;
	          gap: 12px;
	          padding: 0 12px 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	        }
	        button {
	          min-height: 40px;
	          padding: 8px 12px;
	          cursor: pointer;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 10px;
	        }
	        button:hover,
	        button:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 60%, transparent);
	        }
	        button:disabled {
	          cursor: not-allowed;
	          opacity: 0.58;
	          color: var(--secondary-text-color, #666);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	          border-color: color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	          box-shadow: none;
	        }
	        button:disabled:hover,
	        button:disabled:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	        }
	        .field-row .field-grid {
	          gap: 8px;
	          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	          align-items: end;
	        }
	        .field-row .field-grid > * {
	          min-width: 0;
	        }
	        ha-entity-picker {
	          min-width: 0;
	          width: 100%;
	        }
	        @media (max-width: 720px) {
	          .section {
	            gap: 12px;
	          }
	          .inline-row {
	            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	          }
	          .override-group-toggle {
	            flex-wrap: wrap;
	          }
	          .override-group-summary {
	            max-width: 100%;
	            flex: 1 1 100%;
	            text-align: left;
	          }
	          .entity-actions {
	            min-width: 0;
	            justify-content: flex-start;
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(3, minmax(0, 1fr)) 40px;
	          }
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: auto;
	            width: 40px;
	          }
	        }
	        @media (max-width: 480px) {
	          .section {
	            padding: 12px;
	          }
	          .inline-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-shell,
	          .entity-main,
	          .override-panel {
	            padding-left: 10px;
	            padding-right: 10px;
	          }
	          .entity-header {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-actions {
	            width: 100%;
	          }
	          .entity-actions button {
	            flex: 1 1 120px;
	          }
	          .list-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row > button,
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	        }
	      </style>
	      <div class="editor">
	        <div class="section">
	          <div class="section-head">
	            <h3>Basics</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="title">Title</label>
              <input id="title" type="text" data-field="title" value="${this._escapeAttribute(this._draftConfig.title ?? '')}">
            </div>
	          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Entities</h3>
	            <div class="section-note">Overrides replace card defaults only for this entity.</div>
	          </div>
	          <div class="field-grid">
              <div class="list">
	                ${this._renderListRows(entities, (entry, index) => `
	                  <div class="entity-shell" data-entity-shell-index="${index}">
	                    <div class="entity-main">
	                      <div class="entity-header">
	                        <div class="entity-header-main">
	                          <div class="entity-title">Entity ${index + 1}</div>
	                          <div class="entity-subtitle">${this._escapeAttribute(entry.entity || 'Configure entity')}</div>
	                        </div>
	                        <div class="entity-actions">
	                          <button type="button" data-action="move-entity-up" data-index="${index}"${index === 0 ? ' disabled' : ''} aria-label="Move entity ${index + 1} up">↑</button>
	                          <button type="button" data-action="move-entity-down" data-index="${index}"${index === entities.length - 1 ? ' disabled' : ''} aria-label="Move entity ${index + 1} down">↓</button>
	                          <button type="button" data-action="duplicate-entity" data-index="${index}">Duplicate</button>
	                          <button type="button" data-action="remove-entity" data-index="${index}"${entities.length <= 1 ? ' disabled' : ''} aria-label="Remove" title="Remove">🗑</button>
	                        </div>
	                      </div>
	                      <div class="entity-fields">
	                        ${this._renderEntityInput(entry, index)}
	                        <input type="text" data-kind="entity-name" data-index="${index}" value="${this._escapeAttribute(entry.name ?? '')}" placeholder="Name">
	                        <input type="text" data-kind="entity-icon" data-index="${index}" value="${this._escapeAttribute(entry.icon ?? '')}" placeholder="mdi:flash" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">
	                      </div>
	                    </div>
	                    <button type="button" class="override-toggle" data-action="toggle-entity-overrides" data-index="${index}" aria-expanded="${this._isEntityOverrideExpanded(index) ? 'true' : 'false'}">
	                      ${this._isEntityOverrideExpanded(index) ? '▾' : '▸'} Overrides
	                    </button>
                    <div class="override-panel" style="display:${this._isEntityOverrideExpanded(index) ? 'grid' : 'none'};">
                      <div class="section-note">Overrides replace card defaults only for this entity.</div>
                      ${(() => {
                        const scope = { type: 'entity', index };
                        const minParts = this._getEffectiveResolvableScopedValue(scope, 'min');
                        const maxParts = this._getEffectiveResolvableScopedValue(scope, 'max');
	                        const barAppearanceInherited = !this._hasEntityBarAppearanceOverride(scope);
	                        const needleInherited = !this._hasNeedleOverride(scope);
	                        const entityNeedle = this._getEffectiveScopedNeedleConfig(scope);
	                        const baselineInherited = !this._hasBaselineOverride(scope);
	                        const baselineParts = this._getEffectiveBaselineResolvableValue(scope);
	                        const baselineMode = this._getEffectiveBaselineMode(scope);
	                        const targetInherited = !this._hasTargetOverride(scope);
	                        const targetParts = this._getEffectiveTargetResolvableValue(scope);
	                        const targetMode = this._getEffectiveTargetMode(scope);
	                        const formattingInherited = !this._hasFormattingOverride(scope);
	                        const layoutInherited = !this._hasLayoutOverride(scope);
	                        const peakInherited = !this._hasPeakOverride(scope);
	                        const gradientStopsInherited = !this._hasGradientStopsOverride(scope);
	                        const segmentsInherited = !this._hasSegmentsOverride(scope);
	                        const scaleInherited = !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'min'))
	                          && !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'max'));
	                        const entityPeak = this._getEffectiveScopedPeakConfig(scope);
	                        const entityGradientStops = this._getScopedGradientStopsValue(scope);
	                        const entityGradientDraft = this._getGradientStopsDraftState(scope);
	                        const entityGradientDraftMessage = this._getGradientDraftValidationMessage(scope);
	                        const entitySegments = this._getScopedSegmentsValue(scope);
	                        const scaleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'scale',
	                          title: 'Scale',
	                          summary: this._getScaleOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${index}"${scaleInherited ? ' checked' : ''}>
	                          <label for="entity-${index}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${index}-min">Min fallback</label>
                        <input id="entity-${index}-min" type="number" step="any" data-kind="entity-override-min" data-index="${index}" value="${this._escapeAttribute(minParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${this._renderEntitySourceInput('entity-override-min-entity-source', index, minParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-max">Max fallback</label>
                        <input id="entity-${index}-max" type="number" step="any" data-kind="entity-override-max" data-index="${index}" value="${this._escapeAttribute(maxParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${this._renderEntitySourceInput('entity-override-max-entity-source', index, maxParts.entity, 'inherit card default')}
                      </div>
	                          `,
	                        });
	                        const layoutGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'layout',
	                          title: 'Layout',
	                          summary: this._getLayoutSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-layout-inherit" type="checkbox" data-kind="entity-layout-inherit" data-index="${index}"${layoutInherited ? ' checked' : ''}>
                          <label for="entity-${index}-layout-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-height">Row height</label>
	                        <input id="entity-${index}-height" type="number" min="24" step="1" data-kind="entity-override-height" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'height'))}" placeholder="inherit card default">
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-label-position">Label position</label>
	                        <select id="entity-${index}-label-position" data-kind="entity-layout-label-position" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'position'))}">
                          <option value=""${this._getEffectiveScopedLayoutValue(scope, 'position') === '' ? ' selected' : ''}>inherit card default</option>
                          <option value="left"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'left' ? ' selected' : ''}>left</option>
                          <option value="above"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'above' ? ' selected' : ''}>above</option>
                          <option value="inside"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'inside' ? ' selected' : ''}>inside</option>
                          <option value="off"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'off' ? ' selected' : ''}>off</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-label-width">Label width</label>
	                        <input id="entity-${index}-label-width" type="number" step="1" data-kind="entity-layout-label-width" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'width'))}" placeholder="inherit card default">
	                      </div>
	                          `,
	                        });
	                        const barGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'bar',
	                          title: 'Bar Appearance',
	                          summary: this._getBarAppearanceSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${index}"${barAppearanceInherited ? ' checked' : ''}>
                          <label for="entity-${index}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-fill-style">Fill style</label>
                        <select id="entity-${index}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFillStyleValue(scope))}">
                          <option value="bands"${this._getEffectiveScopedFillStyleValue(scope) === 'bands' ? ' selected' : ''}>bands</option>
                          <option value="solid"${this._getEffectiveScopedFillStyleValue(scope) === 'solid' ? ' selected' : ''}>solid</option>
                          <option value="gradient"${this._getEffectiveScopedFillStyleValue(scope) === 'gradient' ? ' selected' : ''}>gradient</option>
                          <option value="soft_bands"${this._getEffectiveScopedFillStyleValue(scope) === 'soft_bands' ? ' selected' : ''}>soft_bands</option>
                          <option value="band_gradient"${this._getEffectiveScopedFillStyleValue(scope) === 'band_gradient' ? ' selected' : ''}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${index}"${this._getEffectiveScopedBarSolidFillValue(scope) ? ' checked' : ''}>
                          <label for="entity-${index}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-color">Bar color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-bar-color`,
                          kind: 'entity-bar-color',
                          index,
                          value: this._getEffectiveScopedBarColorValue(scope),
                          fallbackHex: '#4a9eff',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                          `,
	                        });
	                        const needleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'needle',
	                          title: 'Needle',
	                          summary: this._getNeedleSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${index}"${needleInherited ? ' checked' : ''}>
                          <label for="entity-${index}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-mode">Needle mode</label>
	                        <select id="entity-${index}-needle-mode" data-kind="entity-needle-mode" data-index="${index}" value="${this._escapeAttribute(entityNeedle.mode)}">
                          <option value="enabled"${entityNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${entityNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-color">Needle color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-needle-color`,
                          kind: 'entity-needle-color',
                          index,
                          value: entityNeedle.color,
                          fallbackHex: '#ffffff',
	                          placeholder: '#ffffff',
	                        })}
	                      </div>
	                          `,
	                        });
	                        const formattingGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'formatting',
	                          title: 'Formatting',
	                          summary: this._getFormattingSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${index}"${formattingInherited ? ' checked' : ''}>
                          <label for="entity-${index}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-unit">Unit</label>
                        <input id="entity-${index}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFormattingValue(scope, 'unit'))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-decimal">Decimals</label>
                        <input id="entity-${index}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFormattingValue(scope, 'decimal'))}" placeholder="inherit card default">
                      </div>
	                          `,
	                        });
	                        const peakGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'peak',
	                          title: 'Peak',
	                          summary: this._getPeakSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-peak-inherit" type="checkbox" data-kind="entity-peak-inherit" data-index="${index}"${peakInherited ? ' checked' : ''}>
                          <label for="entity-${index}-peak-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-peak-enabled" type="checkbox" data-kind="entity-peak-enabled" data-index="${index}"${entityPeak.mode === 'enabled' ? ' checked' : ''}>
                          <label for="entity-${index}-peak-enabled">Peak enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-peak-color">Peak color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-peak-color`,
                          kind: 'entity-peak-color',
                          index,
                          value: entityPeak.color,
                          fallbackHex: '#888',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                          `,
	                        });
	                        const segmentsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'segments',
	                          title: 'Segments',
	                          summary: this._getSegmentsSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${index}"${segmentsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-segments-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))
                        ? ''
                        : '<div class="section-note">Only used with segment-based fill styles.</div>'
                      }
                      ${this._renderSegmentPreview(scope)}
                      <div class="field-row">
                        <label>Segments</label>
                        <div class="list">
                          ${this._renderListRows(entitySegments, (segment, segmentIndex) => `
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'from', segment?.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'to', segment?.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(segment?.color ?? '#4a9eff')}">
                              <button type="button" data-action="remove-entity-segment" data-index="${index}" data-segment-index="${segmentIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                            <div id="entity-${index}-segment-row-hint-${segmentIndex}" class="section-note"${this._getSegmentRowValidationMessage(scope, segmentIndex) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentRowValidationMessage(scope, segmentIndex))}</div>
                            </div>
                          `)}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${index}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).from)}" placeholder="0%">
                              <input id="entity-${index}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).color || '#4a9eff')}">
                              <button type="button" data-action="add-entity-segment" data-index="${index}"${this._canAddSegment(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            <div id="entity-${index}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(scope) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentDraftValidationMessage(scope))}</div>
                          </div>
                        </div>
                      </div>
	                          `,
	                        });
	                        const gradientStopsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'gradient-stops',
	                          title: 'Gradient Stops',
	                          summary: this._getGradientStopsSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${index}"${gradientStopsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._getEffectiveFillStyleValue(scope) !== 'gradient'
                        ? '<div class="section-note">Only used with Gradient fill style</div>'
                        : ''
                      }
                      ${this._renderGradientPreview(scope, {
                        previewId: `entity-${index}-gradient-preview`,
                        trackId: `entity-${index}-gradient-preview-track`,
                      })}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(entityGradientStops, (stop, stopIndex) => `
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${index}" data-stop-index="${stopIndex}" value="${this._escapeAttribute(this._getGradientStopPosText(scope, stopIndex, stop?.pos ?? ''))}" placeholder="0">
                              ${this._renderColorInput({
                                id: `entity-${index}-gradient-color-${stopIndex}`,
                                kind: 'entity-gradient-color',
                                index,
                                value: stop?.color ?? '#4a9eff',
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                                extraDataset: { 'stop-index': stopIndex },
                              })}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${index}" data-stop-index="${stopIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                          `)}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${index}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${index}" value="${this._escapeAttribute(entityGradientDraft.pos)}" placeholder="0">
                              ${this._renderColorInput({
                                id: `entity-${index}-gradient-draft-color`,
                                kind: 'entity-gradient-draft-color',
                                index,
                                value: entityGradientDraft.color,
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                              })}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${index}"${this._canAddGradientStop(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            ${entityGradientDraftMessage
                              ? `<div id="entity-${index}-gradient-draft-hint" class="section-note">${this._escapeAttribute(entityGradientDraftMessage)}</div>`
                              : ''
                            }
                          </div>
                        </div>
                      </div>
	                          `,
	                        });
	                        const baselineGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'baseline',
	                          title: 'Baseline',
	                          summary: this._getBaselineOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${index}"${baselineInherited ? ' checked' : ''}>
                          <label for="entity-${index}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-mode">Baseline mode</label>
                        <select id="entity-${index}-baseline-mode" data-kind="entity-baseline-mode" data-index="${index}" value="${this._escapeAttribute(baselineMode)}">
                          <option value="enabled"${baselineMode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${baselineMode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-value">Baseline fallback</label>
                        <input id="entity-${index}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${index}" value="${this._escapeAttribute(baselineParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${this._renderEntitySourceInput('entity-baseline-entity-source', index, baselineParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, 'above') ? ' checked' : ''}>
                          <label for="entity-${index}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-above-color">Above-baseline color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-baseline-above-color`,
                          kind: 'entity-baseline-above-color',
                          index,
                          value: this._getEffectiveBaselineDirectionalColorValue(scope, 'above'),
                          fallbackHex: '#000000',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${index}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, 'below') ? ' checked' : ''}>
                            <label for="entity-${index}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-baseline-below-color">Below-baseline color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-baseline-below-color`,
                          kind: 'entity-baseline-below-color',
                          index,
                          value: this._getEffectiveBaselineDirectionalColorValue(scope, 'below'),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `,
	                        });
	                        const targetGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'target',
	                          title: 'Target',
	                          summary: this._getTargetOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${index}"${targetInherited ? ' checked' : ''}>
                          <label for="entity-${index}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-mode">Target mode</label>
	                        <select id="entity-${index}-target-mode" data-kind="entity-target-mode" data-index="${index}" value="${this._escapeAttribute(targetMode)}">
                          <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-value">Target fallback</label>
                        <input id="entity-${index}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${index}" value="${this._escapeAttribute(targetParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${this._renderEntitySourceInput('entity-target-entity-source', index, targetParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-color">Target color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-target-color`,
                          kind: 'entity-target-color',
                          index,
                          value: this._getEffectiveTargetColorValue(scope),
                          fallbackHex: '#888',
                          placeholder: 'inherit card default',
                        })}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-target-label-show" type="checkbox" data-kind="entity-target-label-show" data-index="${index}"${this._getEffectiveTargetLabelShowValue(scope) ? ' checked' : ''}>
                          <label for="entity-${index}-target-label-show">Show target label</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${index}"${this._isTargetAboveFillEnabled(scope) ? ' checked' : ''}>
	                          <label for="entity-${index}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-above-fill">Above-target color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-target-above-fill`,
                          kind: 'entity-target-above-fill-color',
                          index,
                          value: this._getEffectiveTargetAboveFillColorValue(scope),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `,
	                        });
	                        return `
	                          ${scaleGroup}
	                          ${targetGroup}
	                          ${baselineGroup}
	                          ${needleGroup}
	                          ${peakGroup}
	                          ${barGroup}
	                          ${segmentsGroup}
	                          ${gradientStopsGroup}
	                          ${layoutGroup}
	                          ${formattingGroup}
	                        `;
	                      })()}
	                    </div>
                  </div>
                `)}
                <button type="button" data-action="add-entity">Add entity</button>
              </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${this._escapeAttribute(scaleMin)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${this._renderEntitySourceInput('scale-min-entity-source', 'card', scaleMinEntity)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${this._escapeAttribute(scaleMax)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${this._renderEntitySourceInput('scale-max-entity-source', 'card', scaleMaxEntity)}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Target, baseline, and peak markers help compare the current value against reference points.</div>
	          </div>
	          <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${this._escapeAttribute(targetMode)}">
                <option value="auto"${targetMode === 'auto' ? ' selected' : ''}>auto</option>
                <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${this._escapeAttribute(target.fixed)}">
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${this._renderEntitySourceInput('target-entity-source', 'card', target.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${this._renderColorInput({
                id: 'target-color',
                field: 'target-color',
                value: targetColor,
                fallbackHex: '#888',
                placeholder: '#888',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="target-label-show" type="checkbox" data-field="target-label-show"${targetLabelShow ? ' checked' : ''}>
                <label for="target-label-show">Show target label</label>
              </div>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="target-above-fill-enabled" type="checkbox" data-field="target-above-fill-enabled"${this._isTargetAboveFillEnabled({ type: 'card' }) ? ' checked' : ''}>
                <label for="target-above-fill-enabled">Above-target color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="target-above-fill-color">Above-target color</label>
              ${this._renderColorInput({
                id: 'target-above-fill-color',
                field: 'target-above-fill-color',
                value: targetAboveFillColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${this._escapeAttribute(baselineMode)}">
                <option value="auto"${baselineMode === 'auto' ? ' selected' : ''}>auto</option>
                <option value="enabled"${baselineMode === 'enabled' ? ' selected' : ''}>enabled</option>
                <option value="disabled"${baselineMode === 'disabled' ? ' selected' : ''}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            <div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${this._escapeAttribute(baseline.fixed)}">
            </div>
            <div class="field-row">
              <label>Baseline entity</label>
              ${this._renderEntitySourceInput('baseline-entity-source', 'card', baseline.entity)}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'above') ? ' checked' : ''}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${this._renderColorInput({
                id: 'baseline-above-color',
                field: 'baseline-above-color',
                value: baselineAboveColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-below-color-enabled" type="checkbox" data-field="baseline-below-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'below') ? ' checked' : ''}>
                <label for="baseline-below-color-enabled">Below-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-below-color">Below-baseline color</label>
              ${this._renderColorInput({
                id: 'baseline-below-color',
                field: 'baseline-below-color',
                value: baselineBelowColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="peak-show" type="checkbox" data-field="peak-show"${cardPeak.mode === 'enabled' ? ' checked' : ''}>
                <label for="peak-show">Peak enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="peak-color">Peak color</label>
              ${this._renderColorInput({
                id: 'peak-color',
                field: 'peak-color',
                value: cardPeak.color,
                fallbackHex: '#888',
                placeholder: '#888',
              })}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${this._escapeAttribute(fillStyle)}">
                <option value="solid"${fillStyle === 'solid' ? ' selected' : ''}>solid</option>
                <option value="gradient"${fillStyle === 'gradient' ? ' selected' : ''}>gradient</option>
                <option value="bands"${fillStyle === 'bands' ? ' selected' : ''}>bands</option>
                <option value="band_gradient"${fillStyle === 'band_gradient' ? ' selected' : ''}>band_gradient</option>
                <option value="soft_bands"${fillStyle === 'soft_bands' ? ' selected' : ''}>soft_bands</option>
              </select>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="bar-solid-fill" type="checkbox" data-field="bar-solid-fill"${barSolidFill ? ' checked' : ''}>
                <label for="bar-solid-fill">Solid fill</label>
              </div>
            </div>
            <div class="field-row">
              <label for="bar-color">Bar color</label>
              ${this._renderColorInput({
                id: 'bar-color',
                field: 'bar-color',
                value: barColor,
                fallbackHex: '#4a9eff',
                placeholder: '#4a9eff',
              })}
            </div>
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${this._escapeAttribute(cardNeedle.mode)}">
                <option value="disabled"${cardNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                <option value="enabled"${cardNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${this._renderColorInput({
                id: 'bar-needle-color',
                field: 'bar-needle-color',
                value: cardNeedle.color,
                fallbackHex: '#ffffff',
                placeholder: '#ffffff',
              })}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${this._renderCardGroup({
	            group: 'segments',
	            title: 'Segments',
	            summary: this._getSegmentsSummary({ type: 'card' }),
	            inactive: !this._isSegmentFillStyle(fillStyle),
	            content: `
	              ${this._isSegmentFillStyle(fillStyle)
	                ? ''
	                : '<div class="section-note">Only used with segment-based fill styles.</div>'
	              }
                ${this._renderSegmentPreview({ type: 'card' })}
	              <div class="field-row">
	                <label>Segments</label>
	                <div class="list">
	                  ${defaultSegmentsVisible
	                    ? '<div class="section-note">Default bands</div>'
	                    : ''
	                  }
	                  ${this._renderListRows(segments, (segment, index) => `
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text" data-kind="segment-from" data-index="${index}" value="${this._escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'from', segment?.from))}" placeholder="0%">
	                      <input type="text" data-kind="segment-to" data-index="${index}" value="${this._escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'to', segment?.to))}" placeholder="100%">
	                      <input type="color" data-kind="segment-color" data-index="${index}" value="${this._escapeAttribute(segment?.color ?? '#4a9eff')}">
	                      <button type="button" data-action="remove-segment" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
	                    </div>
                      <div id="segment-row-hint-${index}" class="section-note"${this._getSegmentRowValidationMessage({ type: 'card' }, index) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentRowValidationMessage({ type: 'card' }, index))}</div>
                      </div>
	                  `)}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text" data-kind="segment-draft-from" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text" data-kind="segment-draft-to" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).to)}" placeholder="100%">
                        <input type="color" data-kind="segment-draft-color" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff')}">
                        <button type="button" data-action="add-segment"${this._canAddSegment({ type: 'card' }) ? '' : ' disabled'}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({ type: 'card' }) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentDraftValidationMessage({ type: 'card' }))}</div>
                    </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${this._renderCardGroup({
	            group: 'gradient-stops',
	            title: 'Gradient Stops',
	            summary: gradientStopsSummary,
	            inactive: gradientStopsInactive,
	            content: `
	              ${gradientStopsInactive
	                ? '<div class="section-note">Only used with Gradient fill style</div>'
	                : ''
	              }
	              ${this._renderGradientPreview({ type: 'card' }, {
	                previewId: 'card-gradient-preview',
	                trackId: 'card-gradient-preview-track',
	              })}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(gradientStops, (stop, index) => `
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${index}" value="${this._escapeAttribute(this._getGradientStopPosText({ type: 'card' }, index, stop?.pos ?? ''))}" placeholder="0">
	                      ${this._renderColorInput({
	                        id: `gradient-color-${index}`,
	                        kind: 'gradient-color',
	                        index,
	                        value: stop?.color ?? '#4a9eff',
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
	                    </div>
	                  `)}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${this._escapeAttribute(gradientDraft.pos)}" placeholder="0">
	                      ${this._renderColorInput({
	                        id: 'gradient-draft-color',
	                        kind: 'gradient-draft-color',
	                        index: 'card',
	                        value: gradientDraft.color,
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({ type: 'card' }) ? '' : ' disabled'}>Add</button>
	                    </div>
	                    ${gradientDraftMessage
	                      ? `<div id="gradient-draft-hint" class="section-note">${this._escapeAttribute(gradientDraftMessage)}</div>`
	                      : ''
	                    }
	                  </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Layout</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="layout-height">Row height</label>
              <input id="layout-height" type="number" min="24" step="1" data-field="layout-height" value="${this._escapeAttribute(layoutHeight)}">
            </div>
            <div class="field-row">
              <label for="layout-label-position">Label position</label>
              <select id="layout-label-position" data-field="layout-label-position" value="${this._escapeAttribute(layoutLabelPosition)}">
                <option value="left"${layoutLabelPosition === 'left' ? ' selected' : ''}>left</option>
                <option value="above"${layoutLabelPosition === 'above' ? ' selected' : ''}>above</option>
                <option value="inside"${layoutLabelPosition === 'inside' ? ' selected' : ''}>inside</option>
                <option value="off"${layoutLabelPosition === 'off' ? ' selected' : ''}>off</option>
              </select>
            </div>
            <div class="field-row">
              <label for="layout-label-width">Label width</label>
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(layoutLabelWidth)}">
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${this._escapeAttribute(formattingUnit)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${this._escapeAttribute(formattingDecimal)}">
            </div>
          </div>
	        </div>
      </div>
    `;

      this._bindShadowListeners();
      this._syncEntityPickers();
      this._lastRenderedConfigJson = this._serializeConfig(this._draftConfig);
      this._applyPendingFocus();
    } finally {
      this._isRendering = false;
    }
  }

  _bindShadowListeners() {
    if (!this.shadowRoot || this._shadowListenersAttached) return;
    this.shadowRoot.addEventListener('click', this._boundHandleClick);
    this.shadowRoot.addEventListener('change', this._boundHandleChange);
    this.shadowRoot.addEventListener('input', this._boundHandleInput);
    this.shadowRoot.addEventListener('value-changed', this._boundHandleValueChanged);
    this.shadowRoot.addEventListener('keydown', this._boundHandleKeydown);
    this._shadowListenersAttached = true;
  }

  _syncEntityPickers() {
    if (!this.shadowRoot) return;
    const entities = this._getEntitiesValue();
    const syncPicker = (picker) => {
      const kind = picker.dataset.kind;
      const indexValue = picker.dataset.index;
      const index = Number(indexValue);
      picker.hass = this._hass;
      picker.allowCustomEntity = true;

      if (kind === 'entity-picker') {
        const entry = entities[index];
        picker.value = entry?.entity ?? '';
        picker.label = `Entity ${index + 1}`;
        return;
      }

      if (kind === 'scale-min-entity-source') {
        picker.value = this._getScaleEntityValue('min');
        picker.label = 'Min entity';
        return;
      }

      if (kind === 'scale-max-entity-source') {
        picker.value = this._getScaleEntityValue('max');
        picker.label = 'Max entity';
        return;
      }

      if (kind === 'baseline-entity-source') {
        picker.value = this._getBaselineResolvableValue({ type: 'card' }).entity;
        picker.label = 'Baseline entity';
        return;
      }

      if (kind === 'target-entity-source') {
        picker.value = this._getTargetResolvableValue({ type: 'card' }).entity;
        picker.label = 'Target entity';
        return;
      }

      if (kind === 'entity-override-min-entity-source') {
        picker.value = this._getEffectiveResolvableScopedValue({ type: 'entity', index }, 'min').entity;
        picker.label = `Entity ${index + 1} min entity`;
        return;
      }

      if (kind === 'entity-override-max-entity-source') {
        picker.value = this._getEffectiveResolvableScopedValue({ type: 'entity', index }, 'max').entity;
        picker.label = `Entity ${index + 1} max entity`;
        return;
      }

      if (kind === 'entity-baseline-entity-source') {
        picker.value = this._getEffectiveBaselineResolvableValue({ type: 'entity', index }).entity;
        picker.label = `Entity ${index + 1} baseline entity`;
        return;
      }

      if (kind === 'entity-target-entity-source') {
        picker.value = this._getEffectiveTargetResolvableValue({ type: 'entity', index }).entity;
        picker.label = `Entity ${index + 1} target entity`;
      }
    };

    [
      'ha-entity-picker[data-kind="entity-picker"]',
      'ha-entity-picker[data-kind="scale-min-entity-source"]',
      'ha-entity-picker[data-kind="scale-max-entity-source"]',
      'ha-entity-picker[data-kind="baseline-entity-source"]',
      'ha-entity-picker[data-kind="target-entity-source"]',
      'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
      'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
      'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
      'ha-entity-picker[data-kind="entity-target-entity-source"]',
    ].forEach((selector) => {
      this.shadowRoot.querySelectorAll(selector).forEach(syncPicker);
    });
    if (customElements.whenDefined) {
      customElements.whenDefined('ha-entity-picker').then(() => {
        [
          'ha-entity-picker[data-kind="entity-picker"]',
          'ha-entity-picker[data-kind="scale-min-entity-source"]',
          'ha-entity-picker[data-kind="scale-max-entity-source"]',
          'ha-entity-picker[data-kind="baseline-entity-source"]',
          'ha-entity-picker[data-kind="target-entity-source"]',
          'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
          'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
          'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
          'ha-entity-picker[data-kind="entity-target-entity-source"]',
        ].forEach((selector) => {
          this.shadowRoot?.querySelectorAll(selector).forEach(syncPicker);
        });
      }).catch(() => {});
    }
  }

  _handleClick(event) {
    const target = event.target?.closest?.('[data-action]') ?? event.target;
    const action = target?.dataset?.action;
    if (!action) return;
    if (target?.disabled) return;

    if (action === 'add-entity') {
      const nextEntities = [...this._getEntitiesValue(), { entity: '' }];
      const nextEntries = this._buildEntityConfigEntries(nextEntities);
      this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${nextEntities.length - 1}"], [data-kind="entity-input"][data-index="${nextEntities.length - 1}"]`);
      if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
        let nextConfig = this._setPathValue(this._draftConfig, ['entities'], nextEntries);
        if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
          nextConfig = this._deletePathValue(nextConfig, ['entity']);
          if (this._draftConfig.name !== undefined) {
            nextConfig = this._deletePathValue(nextConfig, ['name']);
          }
          if (this._draftConfig.icon !== undefined) {
            nextConfig = this._deletePathValue(nextConfig, ['icon']);
          }
        }
        this._applyUserConfig(nextConfig, { rerender: true });
      } else {
        this._setValueAtPath(['entity'], nextEntities[0]?.entity ?? '', { rerender: true });
      }
      return;
    }

    if (action === 'move-entity-up') {
      this._moveEntityRow(Number(target.dataset.index), -1);
      return;
    }

    if (action === 'move-entity-down') {
      this._moveEntityRow(Number(target.dataset.index), 1);
      return;
    }

    if (action === 'duplicate-entity') {
      const sourceIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${sourceIndex + 1}"], [data-kind="entity-picker"][data-index="${sourceIndex + 1}"], [data-kind="entity-input"][data-index="${sourceIndex + 1}"]`);
      this._duplicateEntityRow(sourceIndex);
      return;
    }

    if (action === 'toggle-entity-overrides') {
      this._toggleEntityOverrideExpanded(Number(target.dataset.index));
      return;
    }

    if (action === 'toggle-override-group') {
      this._toggleOverrideGroupExpanded(Number(target.dataset.index), target.dataset.group);
      return;
    }

    if (action === 'toggle-card-group') {
      this._toggleCardGroupExpanded(target.dataset.group);
      return;
    }

    if (action === 'remove-entity') {
      this._removeEntityRow(Number(target.dataset.index));
      return;
    }

    if (action === 'add-gradient-stop') {
      this._queuePostRenderFocus('#gradient-draft-pos');
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }

    if (action === 'remove-gradient-stop') {
      const index = Number(target.dataset.index);
      this._setGradientStops(this._getGradientStopsValue().filter((_, stopIndex) => stopIndex !== index), { rerender: true });
      return;
    }

    if (action === 'add-entity-gradient-stop') {
      const entityIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`#entity-${entityIndex}-gradient-draft-pos`);
      this._commitGradientStopDraft({ type: 'entity', index: entityIndex });
      return;
    }

    if (action === 'remove-entity-gradient-stop') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const stopIndex = Number(target.dataset.stopIndex);
      this._setScopedGradientStops(scope, this._getScopedGradientStopsValue(scope).filter((_, index) => index !== stopIndex), { rerender: true });
      return;
    }

    if (action === 'add-segment') {
      this._queuePostRenderFocus('#segment-draft-from');
      this._commitSegmentDraft({ type: 'card' });
      return;
    }

    if (action === 'remove-segment') {
      const index = Number(target.dataset.index);
      this._setSegments(this._getSegmentsValue().filter((_, segmentIndex) => segmentIndex !== index), { rerender: true, sort: true });
      return;
    }

    if (action === 'add-entity-segment') {
      const entityIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`#entity-${entityIndex}-segment-draft-from`);
      this._commitSegmentDraft({ type: 'entity', index: entityIndex });
      return;
    }

    if (action === 'remove-entity-segment') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const segmentIndex = Number(target.dataset.segmentIndex);
      this._setScopedSegments(scope, this._getScopedSegmentsValue(scope).filter((_, index) => index !== segmentIndex), { rerender: true, sort: true });
      return;
    }
  }

  _handleChange(event) {
    const kind = event.target?.dataset?.kind;
    if (kind === 'gradient-pos') {
      const stopIndex = Number(event.target.dataset.index);
      this._commitGradientStopPosEdit({ type: 'card' }, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      const scope = { type: 'entity', index: Number(event.target.dataset.index) };
      const stopIndex = Number(event.target.dataset.stopIndex);
      this._commitGradientStopPosEdit(scope, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      this._commitSegmentBoundaryEdit({ type: 'card' }, Number(event.target.dataset.index), kind === 'segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      this._commitSegmentBoundaryEdit({ type: 'entity', index: Number(event.target.dataset.index) }, Number(event.target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    this._handleFieldEvent(event);
  }

  _handleInput(event) {
    const target = event.target;
    if (!target) return;
    if (target.tagName === 'HA-ENTITY-PICKER') return;
    if (target.tagName === 'INPUT' && target.type === 'checkbox') return;
    const kind = target.dataset?.kind;
    if (kind === 'gradient-pos') {
      this._setGradientStopPosText({ type: 'card' }, Number(target.dataset.index), target.value);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      this._setGradientStopPosText({ type: 'entity', index: Number(target.dataset.index) }, Number(target.dataset.stopIndex), target.value);
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      this._setSegmentBoundaryText({ type: 'card' }, Number(target.dataset.index), kind === 'segment-from' ? 'from' : 'to', target.value);
      this._refreshSegmentUi({ type: 'card' });
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      this._setSegmentBoundaryText(scope, Number(target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', target.value);
      this._refreshSegmentUi(scope);
      return;
    }
    this._handleFieldEvent(event);
  }

  _handleValueChanged(event) {
    if (event.target?.tagName === 'HA-ENTITY-PICKER') {
      this._handleFieldEvent(event);
    }
  }

  _handleKeydown(event) {
    const kind = event.target?.dataset?.kind;
    if (event.key === 'Escape') {
      if (kind === 'gradient-draft-pos' || kind === 'gradient-draft-color') {
        event.preventDefault?.();
        this._gradientStopsDrafts.set(this._getGradientStopsDraftKey({ type: 'card' }), this._createGradientStopDraftState({ type: 'card' }));
        this._render();
        return;
      }
      if (kind === 'entity-gradient-draft-pos' || kind === 'entity-gradient-draft-color') {
        event.preventDefault?.();
        const scope = { type: 'entity', index: Number(event.target.dataset.index) };
        this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), this._createGradientStopDraftState(scope));
        this._render();
      }
      if (kind === 'segment-draft-from' || kind === 'segment-draft-to' || kind === 'segment-draft-color') {
        event.preventDefault?.();
        this._segmentDrafts.set(this._getSegmentsScopeKey({ type: 'card' }), this._createSegmentDraftState({ type: 'card' }));
        this._render();
        return;
      }
      if (kind === 'entity-segment-draft-from' || kind === 'entity-segment-draft-to' || kind === 'entity-segment-draft-color') {
        event.preventDefault?.();
        const scope = { type: 'entity', index: Number(event.target.dataset.index) };
        this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
        this._render();
        return;
      }
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    if (kind === 'gradient-pos') {
      event.preventDefault?.();
      const stopIndex = Number(event.target.dataset.index);
      this._commitGradientStopPosEdit({ type: 'card' }, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      event.preventDefault?.();
      const scope = { type: 'entity', index: Number(event.target.dataset.index) };
      const stopIndex = Number(event.target.dataset.stopIndex);
      this._commitGradientStopPosEdit(scope, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'gradient-draft-pos') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }
    if (kind === 'gradient-draft-color') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }
    if (kind === 'entity-gradient-draft-pos') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'entity', index: Number(event.target.dataset.index) });
      return;
    }
    if (kind === 'entity-gradient-draft-color') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'entity', index: Number(event.target.dataset.index) });
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      event.preventDefault?.();
      this._commitSegmentBoundaryEdit({ type: 'card' }, Number(event.target.dataset.index), kind === 'segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      event.preventDefault?.();
      this._commitSegmentBoundaryEdit({ type: 'entity', index: Number(event.target.dataset.index) }, Number(event.target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'segment-draft-from' || kind === 'segment-draft-to' || kind === 'segment-draft-color') {
      event.preventDefault?.();
      this._commitSegmentDraft({ type: 'card' });
      return;
    }
    if (kind === 'entity-segment-draft-from' || kind === 'entity-segment-draft-to' || kind === 'entity-segment-draft-color') {
      event.preventDefault?.();
      this._commitSegmentDraft({ type: 'entity', index: Number(event.target.dataset.index) });
    }
  }

  _handleFieldEvent(event) {
    const target = event.target;
    const rawField = target?.dataset?.field;
    const rawKind = target?.dataset?.kind;
    const field = rawField?.endsWith('-text-fallback') ? rawField.slice(0, -14) : rawField;
    const kind = rawKind?.endsWith('-text-fallback') ? rawKind.slice(0, -14) : rawKind;
    const detailValue = event.detail?.value;
    const value = detailValue ?? (target?.type === 'checkbox' ? target.checked : target?.value);

    if (field === 'title') return void this._setTitle(value);
    if (field === 'formatting-unit') return void this._setScopedFormattingUnit({ type: 'card' }, value);
    if (field === 'formatting-decimal') return void this._setScopedFormattingDecimal({ type: 'card' }, value);
    if (field === 'layout-label-position') return void this._setLayoutLabelPosition(value);
    if (field === 'layout-height') return void this._setLayoutHeight(value);
    if (field === 'layout-label-width') return void this._setScopedLayoutLabelWidth({ type: 'card' }, value);
    if (field === 'scale-min') return void this._setScaleBound('min', value);
    if (field === 'scale-max') return void this._setScaleBound('max', value);
    if (field === 'bar-fill-style') return void this._setBarFillStyle(value);
    if (field === 'bar-color') return void this._setBarColor(value);
    if (field === 'bar-solid-fill') return void this._setScopedBarSolidFill({ type: 'card' }, value);
    if (field === 'bar-needle-mode') return void this._setScopedNeedleMode({ type: 'card' }, value);
    if (field === 'bar-needle-color') return void this._setScopedNeedleColor({ type: 'card' }, value);
    if (field === 'baseline-mode') return void this._setBaselineMode({ type: 'card' }, value);
    if (field === 'baseline-value') {
      return void this._setBaselineResolvablePart({ type: 'card' }, 'fixed', value);
    }
    if (field === 'baseline-above-color') return void this._setBaselineDirectionalColor({ type: 'card' }, 'above', value);
    if (field === 'baseline-below-color') return void this._setBaselineDirectionalColor({ type: 'card' }, 'below', value);
    if (field === 'baseline-above-color-enabled') return void this._setBaselineDirectionalColorEnabled({ type: 'card' }, 'above', value);
    if (field === 'baseline-below-color-enabled') return void this._setBaselineDirectionalColorEnabled({ type: 'card' }, 'below', value);
    if (field === 'target-mode') return void this._setTargetMode({ type: 'card' }, value);
    if (field === 'target-value') {
      return void this._setTargetResolvablePart({ type: 'card' }, 'fixed', value);
    }
    if (field === 'target-color') return void this._setTargetColor({ type: 'card' }, value);
    if (field === 'target-label-show') return void this._setTargetLabelShow({ type: 'card' }, value);
    if (field === 'target-above-fill-enabled') return void this._setTargetAboveFillEnabled({ type: 'card' }, value);
    if (field === 'target-above-fill-color') return void this._setTargetAboveFillColor({ type: 'card' }, value);
    if (field === 'peak-show') return void this._setPeakShow(value);
    if (field === 'peak-color') return void this._setScopedPeakColor({ type: 'card' }, value);

    if (kind === 'entity-picker' || kind === 'entity-input') {
      const index = Number(target.dataset.index);
      const nextEntities = this._getEntitiesValue().map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, entity: this._normalizeTextValue(value) } : entry
      ));
      const nextEntries = this._buildEntityConfigEntries(nextEntities);
      if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
        this._setValueAtPath(['entities'], nextEntries);
      } else {
        this._setValueAtPath(['entity'], nextEntities[0]?.entity ?? '');
      }
      return;
    }

    if (kind === 'entity-name') {
      return void this._setEntityField(Number(target.dataset.index), 'name', value);
    }

    if (kind === 'entity-icon') {
      return void this._setEntityField(Number(target.dataset.index), 'icon', value);
    }

    if (kind === 'scale-min-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'card' }, 'min', 'entity', value);
    }

    if (kind === 'scale-max-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'card' }, 'max', 'entity', value);
    }

    if (kind === 'baseline-entity-source') {
      return void this._setBaselineResolvablePart({ type: 'card' }, 'entity', value);
    }

    if (kind === 'target-entity-source') {
      return void this._setTargetResolvablePart({ type: 'card' }, 'entity', value);
    }

    if (kind === 'entity-scale-inherit') {
      if (value) {
        return void this._clearScaleOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-override-min') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'min', 'fixed', value);
    }

    if (kind === 'entity-override-max') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'max', 'fixed', value);
    }

    if (kind === 'entity-override-min-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'min', 'entity', value);
    }

    if (kind === 'entity-override-max-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'max', 'entity', value);
    }

    if (kind === 'entity-override-height') {
      return void this._setScopedLayoutHeight({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-inherit') {
      if (value) {
        return void this._clearLayoutOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-layout-label-position') {
      return void this._setScopedLayoutLabelPosition({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-label-width') {
      return void this._setScopedLayoutLabelWidth({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-formatting-inherit') {
      if (value) {
        return void this._clearFormattingOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-formatting-unit') {
      return void this._setScopedFormattingUnit({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-formatting-decimal') {
      return void this._setScopedFormattingDecimal({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-peak-inherit') {
      if (value) {
        return void this._clearPeakOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-peak-enabled') {
      return void this._setScopedPeakEnabled({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-peak-color') {
      return void this._setScopedPeakColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-segments-inherit') {
      if (value) {
        return void this._clearSegmentsOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-gradient-stops-inherit') {
      if (value) {
        return void this._clearGradientStopsOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-bar-inherit') {
      if (value) {
        return void this._clearEntityBarAppearance({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-needle-inherit') {
      if (value) {
        return void this._removeScopedNeedle({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-bar-fill-style') {
      return void this._setScopedBarFillStyle({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-bar-color') {
      return void this._setScopedBarColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-bar-solid-fill') {
      return void this._setScopedBarSolidFill({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-needle-mode') {
      return void this._setScopedNeedleMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-needle-color') {
      return void this._setScopedNeedleColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-baseline-mode') {
      return void this._setBaselineMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-baseline-inherit') {
      if (value) {
        return void this._clearBaselineOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-baseline-value') {
      return void this._setBaselineResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'fixed', value);
    }

    if (kind === 'entity-baseline-entity-source') {
      return void this._setBaselineResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'entity', value);
    }

    if (kind === 'entity-baseline-above-color') {
      return void this._setBaselineDirectionalColor({ type: 'entity', index: Number(target.dataset.index) }, 'above', value);
    }

    if (kind === 'entity-baseline-below-color') {
      return void this._setBaselineDirectionalColor({ type: 'entity', index: Number(target.dataset.index) }, 'below', value);
    }

    if (kind === 'entity-baseline-above-color-enabled') {
      return void this._setBaselineDirectionalColorEnabled({ type: 'entity', index: Number(target.dataset.index) }, 'above', value);
    }

    if (kind === 'entity-baseline-below-color-enabled') {
      return void this._setBaselineDirectionalColorEnabled({ type: 'entity', index: Number(target.dataset.index) }, 'below', value);
    }

    if (kind === 'entity-target-mode') {
      return void this._setTargetMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-inherit') {
      if (value) {
        return void this._clearTargetOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-target-value') {
      return void this._setTargetResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'fixed', value);
    }

    if (kind === 'entity-target-entity-source') {
      return void this._setTargetResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'entity', value);
    }

    if (kind === 'entity-target-color') {
      return void this._setTargetColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-label-show') {
      return void this._setTargetLabelShow({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-above-fill-enabled') {
      return void this._setTargetAboveFillEnabled({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-above-fill-color') {
      return void this._setTargetAboveFillColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'gradient-draft-pos') {
      this._setGradientStopsDraftField({ type: 'card' }, 'pos', value);
      return;
    }

    if (kind === 'gradient-draft-color') {
      this._setGradientStopsDraftField({ type: 'card' }, 'color', value);
      return;
    }

    if (kind === 'entity-gradient-draft-pos') {
      this._setGradientStopsDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'pos', value);
      return;
    }

    if (kind === 'entity-gradient-draft-color') {
      this._setGradientStopsDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'color', value);
      return;
    }

    if (kind === 'segment-draft-from') {
      this._setSegmentDraftField({ type: 'card' }, 'from', value);
      return;
    }

    if (kind === 'segment-draft-to') {
      this._setSegmentDraftField({ type: 'card' }, 'to', value);
      return;
    }

    if (kind === 'segment-draft-color') {
      this._setSegmentDraftField({ type: 'card' }, 'color', value);
      return;
    }

    if (kind === 'entity-segment-draft-from') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'from', value);
      return;
    }

    if (kind === 'entity-segment-draft-to') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'to', value);
      return;
    }

    if (kind === 'entity-segment-draft-color') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'color', value);
      return;
    }

    if (kind?.startsWith('gradient-')) {
      const index = Number(target.dataset.index);
      const currentStops = this._sanitizeGradientStopsForEmit(this._getGradientStopsValue());
      const nextStops = this._getGradientStopsValue().map((stop, stopIndex) => {
        if (stopIndex !== index) return stop;
        const nextPos = this._normalizeGradientStopPosValue(stop?.pos);
        return {
          ...stop,
          pos: nextPos ?? 0,
          color: kind === 'gradient-color' ? value : stop?.color ?? '#4a9eff',
        };
      });
      if (this._serializeConfig(nextStops) !== this._serializeConfig(currentStops)) {
        this._setGradientStops(nextStops);
      }
      return;
    }

    if (kind?.startsWith('entity-gradient-')) {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const stopIndex = Number(target.dataset.stopIndex);
      const currentStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
      const nextStops = this._getScopedGradientStopsValue(scope).map((stop, currentStopIndex) => {
        if (currentStopIndex !== stopIndex) return stop;
        const nextPos = this._normalizeGradientStopPosValue(stop?.pos);
        return {
          ...stop,
          pos: nextPos ?? 0,
          color: kind === 'entity-gradient-color' ? value : stop?.color ?? '#4a9eff',
        };
      });
      if (this._serializeConfig(nextStops) !== this._serializeConfig(currentStops)) {
        this._setScopedGradientStops(scope, nextStops);
      }
      return;
    }

    if (kind === 'segment-color') {
      const index = Number(target.dataset.index);
      const nextSegments = (this._getSegmentsUiRows({ type: 'card' }) ?? this._getSegmentsValue()).map((segment, segmentIndex) => {
        if (segmentIndex !== index) return segment;
        return {
          ...segment,
          color: value,
        };
      });
      this._setSegments(nextSegments, { sort: false });
      return;
    }

    if (kind === 'entity-segment-color') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const segmentIndex = Number(target.dataset.segmentIndex);
      const nextSegments = (this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope)).map((segment, currentSegmentIndex) => {
        if (currentSegmentIndex !== segmentIndex) return segment;
        return {
          ...segment,
          color: value,
        };
      });
      this._setScopedSegments(scope, nextSegments, { sort: false });
      return;
    }
  }
}

customElements.define('sensor-bar-card-plus', SensorBarCard);
customElements.define('sensor-bar-card-plus-editor', SensorBarCardPlusEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sensor-bar-card-plus',
  name: 'Sensor Bar Card Plus',
  description: 'Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features.',
});
