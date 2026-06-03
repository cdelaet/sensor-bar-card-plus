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
      at: cardBaseline?.at ? { ...cardBaseline.at } : this.normalizeResolvableValue(null, null),
      above: this.normalizeBaselineDirectionConfig(undefined, cardBaseline?.above),
      below: this.normalizeBaselineDirectionConfig(undefined, cardBaseline?.below),
    };

    if (rawBaseline === undefined) {
      return inherited;
    }

    if (rawBaseline === null) {
      return {
        at: this.normalizeResolvableValue(null, null),
        above: { color: null },
        below: { color: null },
      };
    }

    if (typeof rawBaseline !== 'object' || Array.isArray(rawBaseline)) {
      return {
        at: this.normalizeStructuredResolvableValue(rawBaseline, inherited.at, null),
        above: inherited.above,
        below: inherited.below,
      };
    }

    return {
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
      source: this.normalizeResolvableValue(null, null),
      color: cardConfig?.target_color ?? '#888',
      show_label: cardConfig?.show_target_label ?? false,
    };

    if (rawTarget && typeof rawTarget === 'object' && !Array.isArray(rawTarget)) {
      return {
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
    return {
      ...ecfg,
      icon: ecfg.icon === false ? false : (ecfg.icon ?? this._hass?.states[ecfg.entity]?.attributes?.icon ?? null),
      name: ecfg.name ?? null,
    };
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
    return 4;
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
    const clampedTarget = Math.min(100, Math.max(0, targetPct));
    return { start: clampedTarget, end: 100 };
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

    if (ecfg.bar.above_target_color) {
      const interval = this._getAboveTargetOverlayInterval(targetPct);
      const targetOverlay = interval
        ? this._getOverlayGradient(interval.start, interval.end, ecfg.bar.above_target_color)
        : null;
      if (targetOverlay) layers.push(targetOverlay);
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

  _getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
    const geometry = needleActive
      ? this._getNormalizedPercent(100, null)
      : this._getNormalizedPercent(pct, baselinePct);
    return {
      geometry,
      paintStyle: this._getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue),
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
        .main-line.inside-mode[data-hide-inside-icon="true"] .icon-wrap {
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
        .bar-paint-layer {
          position: absolute;
          inset: 0;
          transition: clip-path 0.6s cubic-bezier(0.4,0,0.2,1);
          z-index: 1;
        }
        .bar-paint-layer.no-anim {
          transition: none;
        }
        .row[data-bar-animated="false"] .bar-paint-layer,
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
          flex: 0 0 auto;
          max-width: 56%;
          display: inline-flex;
          align-items: baseline;
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
          font-size: 12px;
          line-height: 1.15;
          color: var(--secondary-text-color, #888);
          margin-bottom: 3px;
          min-height: 16px;
        }
        .above-bar-label-name {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .above-bar-label-value {
          flex: 0 0 auto;
          margin-left: auto;
          white-space: nowrap;
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          text-align: right;
          gap: 0;
        }
        .above-bar-label-value.has-unit {
          gap: 2px;
        }
        .above-bar-label-value.tight-unit {
          gap: 0;
        }
        .above-bar-label-unit {
          color: var(--secondary-text-color, #888);
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
        .main-line.inside-mode[data-hide-inside-icon="true"] .icon-wrap {
          display: none;
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
        .top-right-value .unit-group {
          flex: 0 1 auto;
          display: inline-flex;
          align-items: baseline;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit,
        .top-right-value .unit {
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
      const valueWidth = valueEl.scrollWidth;
      let density = 'normal';

      if (trackWidth < Math.max(72, valueWidth + 12)) density = 'compressed';
      else if (trackWidth < valueWidth + 56) density = 'dense';
      else if (trackWidth < valueWidth + 92) density = 'tight';
      else if (trackWidth < valueWidth + 128) density = 'compact';

      innerLabel.dataset.insideDensity = density;
      innerLabel.dataset.hideName = density === 'dense' || density === 'compressed' ? 'true' : 'false';
      if (mainLine) {
        const rowDensity = mainLine.dataset.rowDensity || 'normal';
        mainLine.dataset.hideInsideIcon = rowDensity === 'dense' || rowDensity === 'compressed' ? 'true' : 'false';
      }
    });
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
    delete mainLine.dataset.hideInsideIcon;
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
      mainLine.dataset.hideInsideIcon = 'true';
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
    if (!unit) return `<span class="above-bar-label-value">${display}</span>`;
    const cleanUnit = String(unit);
    const unitModeClass = this._isTightUnit(cleanUnit) ? 'tight-unit' : 'has-unit';
    return `<span class="above-bar-label-value ${unitModeClass}"><span class="above-bar-label-number">${display}</span><span class="above-bar-label-unit">${cleanUnit}</span></span>`;
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
    const targetValueLabel = targetMarkerCfg.show_label ? `
      <div class="target-value-label" style="left:${targetPct !== null ? targetPct : 0}%;">
        ${targetDisplay !== null ? targetDisplay : ''}
      </div>` : '';
    const needleMarker = ecfg.bar?.needle?.show && !Number.isFinite(baselinePct) ? `
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${needleState.edge}" style="left:${needleState.pct ?? 0}%;--needle-color:${needleState.color};--needle-border-color:${needleState.borderColor};display:${needleState.show ? 'block' : 'none'};"></div>
      </div>` : '';
    const aboveLabel = lp === 'above' ? `
      <div class="above-line">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="above-icon-spacer"></div>` : ''}
        <div class="above-bar-label">
          <span class="above-bar-label-name">${name}</span>
          ${this._formatAboveValueMarkup(stateDisplay, unit)}
        </div>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span class="inside-name">${name}</span>
        <span class="inside-value">${this._formatInsideValueMarkup(stateDisplay, unit)}</span>
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
                <div class="bar-paint-layer${bar.animated ? '' : ' no-anim'}" style="${fillState.paintStyle}${fillState.revealStyle}"></div>
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
    const targetVal = this._getNormalizedResolvableNumericValue(ecfg.target_marker.source, safeMin, safeMax);
    const isNumericState = Number.isFinite(rawVal);
    const pct = Number.isFinite(rawVal)
      ? this._toScalePct(rawVal, safeMin, safeMax)
      : 0;
    const color = this._getColor(pct, ecfg, safeMin, safeMax);
    const display = isNaN(rawVal) ? stateObj.state : this._formatNumericDisplay(rawVal, ecfg.formatting.decimal);
    const displayUnit = isNumericState ? unit : '';

    const paintLayer = row.querySelector('.bar-paint-layer');
    let liveTargetPct = null;
    if (targetVal !== null) {
      liveTargetPct = this._toScalePct(targetVal, safeMin, safeMax);
    }
    const liveBaselinePct = this._resolveBaselinePct(ecfg, safeMin, safeMax);
    const needleState = this._getNeedleRenderState(rawVal, ecfg, safeMin, safeMax, liveBaselinePct);
    const fillState = this._getFillRenderState(pct, 'var(--sbcp-row-height)', ecfg, color, liveTargetPct, liveBaselinePct, safeMin, safeMax, needleState.show);

    if (paintLayer) {
      this._setStyleTextIfChanged(paintLayer, `${fillState.paintStyle}${fillState.revealStyle}`);
      this._setClassNameIfChanged(paintLayer, `bar-paint-layer${ecfg.bar.animated ? '' : ' no-anim'}`);
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
      if (valueSpan) valueSpan.innerHTML = this._formatInsideValueMarkup(display, displayUnit);
    }
    const aboveLabel = row.querySelector('.above-bar-label');
    if (aboveLabel) {
      aboveLabel.innerHTML = `<span class="above-bar-label-name">${ecfg.name || stateObj.attributes?.friendly_name || entityCfg.entity}</span>${this._formatAboveValueMarkup(display, displayUnit)}`;
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
        this._setTextIfChanged(targetLabelEl, this._formatDisplayWithUnit(targetVal.toLocaleString(), unit));
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
        const targetVal = this._getNormalizedResolvableNumericValue(ecfg.target_marker.source, safeMin, safeMax);
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
          targetDisplay = this._formatDisplayWithUnit(targetVal.toLocaleString(), unit);
        }
        let peakPct = null, peakDisplay = null;
        if (ecfg.peak_marker.show && !isNaN(rawVal)) {
          this._peaks[entityCfg.entity] = rawVal;
          peakPct     = pct;
          peakDisplay = display;
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

customElements.define('sensor-bar-card-plus', SensorBarCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sensor-bar-card-plus',
  name: 'Sensor Bar Card Plus',
  description: 'Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features.',
});
