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
 *   baseline_entity: sensor.my_baseline_sensor # optional entity providing the baseline value
 *   above_baseline_color: '#34d399' # optional fill color override above baseline
 *   below_baseline_color: '#ef4444' # optional fill color override below baseline
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
    this._config = {};
    this._hass = null;
    this._peaks = {};
    this._rendered = false;
    this._resizeObserver = null;
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
      baseline_entity: null,
      above_baseline_color: null,
      below_baseline_color: null,
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

    // Normalise single entity shorthand to array
    if (baseConfig.entity && !baseConfig.entities) {
      baseConfig.entities = [{ entity: baseConfig.entity }];
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
    normalizedEntity.formatting = this.normalizeFormattingConfig(entityConfig, cardConfig);
    normalizedEntity.target_marker = this.normalizeTargetMarkerConfig(entityConfig, cardConfig);
    normalizedEntity.peak_marker = this.normalizePeakMarkerConfig(entityConfig, cardConfig);

    // Keep flat aliases so current rendering code and public YAML stay stable.
    normalizedEntity.min = normalizedEntity.scale.min.fallback;
    normalizedEntity.min_entity = normalizedEntity.scale.min.entity;
    normalizedEntity.max = normalizedEntity.scale.max.fallback;
    normalizedEntity.max_entity = normalizedEntity.scale.max.entity;
    normalizedEntity.baseline = normalizedEntity.scale.baseline.fallback;
    normalizedEntity.baseline_entity = normalizedEntity.scale.baseline.entity;
    normalizedEntity.height = normalizedEntity.layout.height;
    normalizedEntity.label_position = normalizedEntity.layout.label_position;
    normalizedEntity.label_width = normalizedEntity.layout.label_width;
    normalizedEntity.color_mode = normalizedEntity.bar.color_mode;
    normalizedEntity.color = normalizedEntity.bar.color;
    normalizedEntity.gradient_stops = normalizedEntity.bar.gradient_stops;
    normalizedEntity.severity = normalizedEntity.bar.severity;
    normalizedEntity.animated = normalizedEntity.bar.animated;
    normalizedEntity.above_target_color = normalizedEntity.bar.above_target_color;
    normalizedEntity.above_baseline_color = normalizedEntity.bar.above_baseline_color;
    normalizedEntity.below_baseline_color = normalizedEntity.bar.below_baseline_color;
    normalizedEntity.decimal = normalizedEntity.formatting.decimal;
    normalizedEntity.unit = normalizedEntity.formatting.unit;
    normalizedEntity.target = normalizedEntity.target_marker.source.fallback;
    normalizedEntity.target_entity = normalizedEntity.target_marker.source.entity;
    normalizedEntity.target_color = normalizedEntity.target_marker.color;
    normalizedEntity.show_target_label = normalizedEntity.target_marker.show_label;
    normalizedEntity.show_peak = normalizedEntity.peak_marker.show;
    normalizedEntity.peak_color = normalizedEntity.peak_marker.color;

    return normalizedEntity;
  }

  // Internal resolvable shape used to preserve today's flat `value + *_entity`
  // model while giving future work one consistent place to look up dynamic
  // versus fallback-backed values.
  normalizeResolvableValue(value, entityValue, fallbackValue) {
    return {
      value: value ?? null,
      entity: entityValue ?? null,
      fallback: fallbackValue ?? value ?? null,
    };
  }

  normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
    const cardScale = cardConfig?.scale;
    const entityKey = `${key}_entity`;
    const fallback = entityConfig[key] ?? cardScale?.[key]?.fallback ?? cardConfig?.[key] ?? defaultValue;
    const entity = entityConfig[entityKey] ?? cardScale?.[key]?.entity ?? cardConfig?.[entityKey] ?? null;
    return this.normalizeResolvableValue(fallback, entity, fallback);
  }

  normalizeScaleConfig(entityConfig, cardConfig) {
    return {
      min: this.normalizeScaleBound(entityConfig, cardConfig, 'min', 0),
      max: this.normalizeScaleBound(entityConfig, cardConfig, 'max', 100),
      baseline: this.normalizeScaleBound(entityConfig, cardConfig, 'baseline', null),
    };
  }

  normalizeBarConfig(entityConfig, cardConfig) {
    const cardBar = cardConfig?.bar;
    return {
      color_mode: entityConfig.color_mode ?? cardBar?.color_mode ?? cardConfig?.color_mode ?? 'severity',
      color: entityConfig.color ?? cardBar?.color ?? cardConfig?.color ?? '#4a9eff',
      gradient_stops: entityConfig.gradient_stops ?? cardBar?.gradient_stops ?? cardConfig?.gradient_stops ?? null,
      severity: entityConfig.severity ?? cardBar?.severity ?? cardConfig?.severity ?? null,
      animated: entityConfig.animated ?? cardBar?.animated ?? cardConfig?.animated ?? true,
      above_target_color: entityConfig.above_target_color ?? cardBar?.above_target_color ?? cardConfig?.above_target_color ?? null,
      above_baseline_color: entityConfig.above_baseline_color ?? cardBar?.above_baseline_color ?? cardConfig?.above_baseline_color ?? null,
      below_baseline_color: entityConfig.below_baseline_color ?? cardBar?.below_baseline_color ?? cardConfig?.below_baseline_color ?? null,
    };
  }

  normalizeLayoutConfig(entityConfig, cardConfig) {
    const cardLayout = cardConfig?.layout;
    return {
      label_position: entityConfig.label_position ?? cardLayout?.label_position ?? cardConfig?.label_position ?? 'left',
      label_width: entityConfig.label_width ?? cardLayout?.label_width ?? cardConfig?.label_width ?? 100,
      height: entityConfig.height ?? cardLayout?.height ?? cardConfig?.height ?? 38,
    };
  }

  normalizeFormattingConfig(entityConfig, cardConfig) {
    const cardFormatting = cardConfig?.formatting;
    return {
      decimal: entityConfig.decimal ?? cardFormatting?.decimal ?? cardConfig?.decimal ?? null,
      unit: entityConfig.unit ?? cardFormatting?.unit ?? cardConfig?.unit ?? null,
    };
  }

  normalizeTargetMarkerConfig(entityConfig, cardConfig) {
    const cardTarget = cardConfig?.target_marker;
    const fallback = entityConfig.target ?? cardTarget?.source?.fallback ?? cardConfig?.target ?? null;
    const entity = entityConfig.target_entity ?? cardTarget?.source?.entity ?? cardConfig?.target_entity ?? null;
    return {
      source: this.normalizeResolvableValue(fallback, entity, fallback),
      color: entityConfig.target_color ?? cardTarget?.color ?? cardConfig?.target_color ?? '#888',
      show_label: entityConfig.show_target_label ?? cardTarget?.show_label ?? cardConfig?.show_target_label ?? false,
    };
  }

  normalizePeakMarkerConfig(entityConfig, cardConfig) {
    const cardPeak = cardConfig?.peak_marker;
    return {
      show: entityConfig.show_peak ?? cardPeak?.show ?? cardConfig?.show_peak ?? false,
      color: entityConfig.peak_color ?? cardPeak?.color ?? cardConfig?.peak_color ?? '#888',
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
        ecfg.scale?.baseline?.entity,
        ecfg.target_marker?.source?.entity
      ].filter(Boolean);
      
      for (const ent of entitiesToWatch) {
        if (!oldHass.states[ent] || !newHass.states[ent]) continue;
        if (oldHass.states[ent] !== newHass.states[ent]) {
          return true;
        }
      }
    }
    return false;
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
      label.style.visibility = 'hidden';
      return;
    }
    
    const trackRect = track.getBoundingClientRect();
    const maxLabelWidth = Math.max(0, Math.floor(trackRect.width - 4));
    label.style.maxWidth = `${maxLabelWidth}px`;

    const labelRect = label.getBoundingClientRect();
    
    const markerPercent = parseFloat(marker.style.left);
    if (!Number.isFinite(markerPercent) || trackRect.width <= 0 || labelRect.width <= 0 || maxLabelWidth <= 10) {
      label.style.visibility = 'hidden';
      return;
    }
    
    const markerX = (markerPercent / 100) * trackRect.width;
    const halfLabel = labelRect.width / 2;
    
    const clampedX = Math.max(halfLabel, Math.min(trackRect.width - halfLabel, markerX));
    
    label.style.left = `${clampedX}px`;
    label.style.transform = 'translateX(-50%)';
    label.style.visibility = 'visible';
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

  _getNormalizedResolvableNumericValue(resolvable) {
    if (!resolvable) return null;
    return this._getNumericValue(resolvable.fallback ?? resolvable.value, resolvable.entity);
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

  _getSeverityInterpolationStops(ecfg) {
    const bands = Array.isArray(ecfg.bar?.severity) ? [...ecfg.bar.severity] : [];
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

  _getSeverityBandGradientCss(ecfg) {
    const bands = Array.isArray(ecfg.bar?.severity) ? [...ecfg.bar.severity] : [];
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
  
  _getColor(pct, ecfg) {
    if (ecfg.bar.color_mode === 'single') return ecfg.bar.color;

    if (ecfg.bar.color_mode === 'gradient' || ecfg.bar.color_mode === 'severity_gradient') {
      let stops;
      if (ecfg.bar.color_mode === 'severity_gradient') {
        stops = this._getSeverityInterpolationStops(ecfg);
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

    // Severity mode
    for (const s of (ecfg.bar.severity || [])) {
      if (pct >= s.from && pct <= s.to) return s.color;
    }
    return ecfg.bar.color;
  }

  _getBarBackgroundStyle(color, ecfg) {
    if (ecfg.bar.color_mode === 'severity') {
      const severityGradient = this._getSeverityBandGradientCss(ecfg);
      if (severityGradient) {
        return `background-image:${severityGradient};background-repeat:no-repeat;`;
      }
    }

    if (ecfg.bar.color_mode === 'gradient') {
      const gs = ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2
        ? [...ecfg.bar.gradient_stops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(',')
        : '#4CAF50 0%,#FF9800 50%,#F44336 100%';

      return `background:linear-gradient(to right,${gs});background-repeat:no-repeat;`;
    }

    return `background:${color};`;
  }

  _getGradientInterpolationStops(ecfg) {
    if (ecfg.bar.color_mode === 'severity_gradient') {
      return this._getSeverityInterpolationStops(ecfg);
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

  _buildSegmentGradientStyle(stops, startPct, endPct) {
    if (!Array.isArray(stops) || !stops.length) return null;

    const start = Math.min(100, Math.max(0, startPct));
    const end = Math.min(100, Math.max(0, endPct));
    const width = end - start;
    if (width <= 0) return null;

    const gradientStops = [];
    const pushStop = (pct, rgb) => {
      if (!rgb) return;
      const normalizedPct = width === 0 ? 0 : ((pct - start) / width) * 100;
      const cssColor = this._rgbToCss(rgb);
      if (!cssColor) return;
      const last = gradientStops[gradientStops.length - 1];
      if (last && last.color === cssColor && Math.abs(last.pct - normalizedPct) < 0.0001) return;
      gradientStops.push({ color: cssColor, pct: normalizedPct });
    };

    pushStop(start, this._interpolateStopColor(stops, start));
    for (const stop of stops) {
      if (stop.p > start && stop.p < end) {
        pushStop(stop.p, stop);
      }
    }
    pushStop(end, this._interpolateStopColor(stops, end));

    if (!gradientStops.length) return null;

    const cssStops = gradientStops.map((stop) => `${stop.color} ${stop.pct}%`).join(',');
    return `background:linear-gradient(to right,${cssStops});background-repeat:no-repeat;`;
  }

  _buildSegmentSeverityStyle(ecfg, startPct, endPct, fallbackColor) {
    const bands = Array.isArray(ecfg.bar?.severity) ? [...ecfg.bar.severity] : [];
    const sorted = bands
      .filter((s) => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
      .sort((a, b) => a.from - b.from);

    const start = Math.min(100, Math.max(0, startPct));
    const end = Math.min(100, Math.max(0, endPct));
    const width = end - start;
    if (!sorted.length || width <= 0) return `background:${fallbackColor};`;

    const cssStops = [];
    for (const band of sorted) {
      const segmentStart = Math.max(start, band.from);
      const segmentEnd = Math.min(end, band.to);
      if (segmentEnd <= segmentStart) continue;
      const localStart = ((segmentStart - start) / width) * 100;
      const localEnd = ((segmentEnd - start) / width) * 100;
      cssStops.push(`${band.color} ${localStart}%`, `${band.color} ${localEnd}%`);
    }

    if (!cssStops.length) return `background:${fallbackColor};`;
    return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
  }

  _getSegmentBackgroundStyle(color, ecfg, startPct, endPct, overrideColor = null) {
    if (overrideColor) {
      return `background:${overrideColor};`;
    }

    if (ecfg.bar.color_mode === 'single') {
      return `background:${color};`;
    }

    if (ecfg.bar.color_mode === 'severity') {
      return this._buildSegmentSeverityStyle(ecfg, startPct, endPct, color);
    }

    if (ecfg.bar.color_mode === 'gradient' || ecfg.bar.color_mode === 'severity_gradient') {
      const stops = this._getGradientInterpolationStops(ecfg);
      return this._buildSegmentGradientStyle(stops, startPct, endPct) || `background:${color};`;
    }

    return `background:${color};`;
  }

  _getScaleStyle(color, ecfg) {
    return `width:100%;height:100%;${this._getBarBackgroundStyle(color, ecfg)}`;
  }

  _toScalePct(value, minValue, maxValue) {
    if (!Number.isFinite(value)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const range = safeMax - safeMin || 1;
    return Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));
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

  _getSegmentStyle(startPct, endPct, h, ecfg, color, overrideColor = null, positive = true) {
    const left = Math.min(100, Math.max(0, startPct));
    const right = Math.min(100, Math.max(0, endPct));
    const width = Math.max(0, right - left);
    if (width <= 0) {
      return `display:none;left:0;width:0;height:${h}px;`;
    }

    const backgroundStyle = this._getSegmentBackgroundStyle(color, ecfg, left, right, overrideColor);

    let radius = positive ? 'border-radius:0 6px 6px 0;' : 'border-radius:6px 0 0 6px;';
    if (left <= 0 && right >= 100) radius = 'border-radius:6px;';
    else if (left <= 0) radius = 'border-radius:6px 0 0 6px;';
    else if (right >= 100) radius = 'border-radius:0 6px 6px 0;';
    return `display:block;top:0;left:${left}%;width:${width}%;height:${h}px;right:auto;bottom:auto;${radius}${backgroundStyle}`;
  }

  _getBaselineFillStyle(pct, h, ecfg, color, baselinePct = null) {
    const geometry = this._getNormalizedPercent(pct, baselinePct);
    if (!geometry.usesBaseline) return this._getScaleStyle(color, ecfg);
    const overrideColor = geometry.positive ? ecfg.bar.above_baseline_color : ecfg.bar.below_baseline_color;
    return this._getSegmentStyle(geometry.start, geometry.end, h, ecfg, color, overrideColor, geometry.positive);
  }

  _getAboveTargetSegmentStyle(pct, h, ecfg, targetPct = null, baselinePct = null) {
    if (!ecfg.bar.above_target_color || !Number.isFinite(targetPct)) {
      return `left:0;height:${h}px;display:none;`;
    }

    const geometry = this._getNormalizedPercent(pct, baselinePct);
    if (!geometry.usesBaseline) {
      return this._getAboveTargetOverlayStyle(pct, h, ecfg, targetPct);
    }
    if (geometry.hidden || !Number.isFinite(geometry.baseline)) {
      return `left:0;height:${h}px;display:none;`;
    }

    const clampedTarget = Math.min(100, Math.max(0, targetPct));
    if (geometry.positive) {
      if (clampedTarget < geometry.baseline || pct <= clampedTarget) {
        return `left:0;height:${h}px;display:none;`;
      }
      return this._getSegmentStyle(clampedTarget, pct, h, ecfg, ecfg.bar.above_target_color, ecfg.bar.above_target_color, true);
    }

    if (clampedTarget > geometry.baseline || pct >= clampedTarget) {
      return `left:0;height:${h}px;display:none;`;
    }

    return this._getSegmentStyle(pct, clampedTarget, h, ecfg, ecfg.bar.above_target_color, ecfg.bar.above_target_color, false);
  }

  _getAboveTargetOverlayStyle(pct, h, ecfg, targetPct = null) {
    const hasAboveTargetColor =
      ecfg.bar.above_target_color &&
      targetPct !== null &&
      Number.isFinite(targetPct) &&
      targetPct >= 0 &&
      targetPct <= 100 &&
      pct > targetPct;

    if (!hasAboveTargetColor) {
      return `left:0;height:${h}px;display:none;`;
    }

    const left = Math.min(100, Math.max(0, targetPct));
    return `left:${left}%;height:${h}px;background:${ecfg.bar.above_target_color};display:block;`;
  }

  _getMaskStyle(pct, h) {
    const clampedPct = Math.min(100, Math.max(0, pct));
    const isHidden = clampedPct >= 100;
    const left = Math.min(100, Math.max(0, clampedPct));
    const radius = clampedPct <= 0 ? 'border-radius:6px;' : 'border-radius:0 6px 6px 0;';
    return `left:${left}%;height:${h}px;${radius}display:${isHidden ? 'none' : 'block'};`;
  }

  _render() {
    const cfg = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }

        .card {
          --sbcp-main-gap: 8px;
          --sbcp-icon-width: 28px;
          --sbcp-above-gap: 10px;
          --sbcp-left-label-share: 34%;
          --sbcp-value-width: 62px;
          --sbcp-bar-min-width: 48px;
          --sbcp-target-label-font-size: 12px;
          --sbcp-inline-label-padding-x: 8px;
          --sbcp-inline-label-padding-y: 2px;
          --sbcp-inline-label-font-size: 12px;
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.08));
        }
        .card[data-compact="compact"] {
          --sbcp-main-gap: 6px;
          --sbcp-icon-width: 26px;
          --sbcp-above-gap: 8px;
          --sbcp-left-label-share: 28%;
          --sbcp-value-width: 56px;
          --sbcp-bar-min-width: 44px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 7px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="tight"] {
          --sbcp-main-gap: 5px;
          --sbcp-icon-width: 24px;
          --sbcp-above-gap: 6px;
          --sbcp-left-label-share: 24%;
          --sbcp-value-width: 52px;
          --sbcp-bar-min-width: 40px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 6px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="dense"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 23px;
          --sbcp-above-gap: 5px;
          --sbcp-left-label-share: 20%;
          --sbcp-value-width: 48px;
          --sbcp-bar-min-width: 38px;
          --sbcp-target-label-font-size: 10px;
          --sbcp-inline-label-padding-x: 5px;
          --sbcp-inline-label-font-size: 10px;
        }
        .card[data-compact="compressed"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 22px;
          --sbcp-above-gap: 4px;
          --sbcp-left-label-share: 18%;
          --sbcp-value-width: 44px;
          --sbcp-bar-min-width: 36px;
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
          display: flex;
          flex-direction: column;
          gap: 2px;
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
          --sbcp-value-width: 54px;
        }
        .main-line:not(.left-mode)[data-row-density="tight"] {
          --sbcp-value-width: 50px;
        }
        .main-line:not(.left-mode)[data-row-density="dense"] {
          --sbcp-value-width: 46px;
        }
        .main-line:not(.left-mode)[data-row-density="compressed"] {
          --sbcp-value-width: 42px;
        }
        .main-line.off-mode[data-row-density="compressed"] .icon-wrap,
        .main-line.above-mode[data-row-density="compressed"] .icon-wrap {
          display: none;
        }
        .main-line.left-mode[data-left-density="normal"] {
          --sbcp-left-label-share: 32%;
          --sbcp-value-width: 60px;
        }
        .main-line.left-mode[data-left-density="compact"] {
          --sbcp-left-label-share: 28%;
          --sbcp-value-width: 55px;
        }
        .main-line.left-mode[data-left-density="tight"] {
          --sbcp-left-label-share: 24%;
          --sbcp-value-width: 51px;
        }
        .main-line.left-mode[data-left-density="dense"] {
          --sbcp-left-label-share: 20%;
          --sbcp-value-width: 48px;
        }
        .main-line.left-mode[data-left-density="compressed"] {
          --sbcp-left-label-share: 17%;
          --sbcp-value-width: 44px;
        }
        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: var(--sbcp-icon-width);
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
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          display: flex;
          align-items: center;
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
          border-radius: 6px;
          background: var(--secondary-background-color, #e8e8e8);
          overflow: hidden;
        }
        .bar-scale {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          z-index: 1;
        }
        .bar-above-target {
          position: absolute;
          top: 0;
          right: 0;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          z-index: 2;
        }
        .bar-above-target.no-anim {
          transition: none;
        }
        .bar-fill {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          background: var(--secondary-background-color, #e8e8e8);
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          z-index: 3;
        }
        .bar-fill.no-anim { transition: none; }

        .bar-inner-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 0 6px;
          pointer-events: none;
          z-index: 4;
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
          display: none;
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
          flex: 1 1 auto;
          max-width: 58%;
        }
        .bar-inner-label[data-inside-density="compact"] .inside-name {
          max-width: 52%;
        }
        .bar-inner-label[data-inside-density="tight"] .inside-name {
          max-width: 44%;
        }
        .bar-inner-label[data-inside-density="dense"] .inside-name {
          display: none;
        }
        .bar-inner-label .inside-value {
          flex: 0 0 auto;
          max-width: 56%;
          display: inline-flex;
          align-items: baseline;
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
        .above-line[data-above-density="dense"] .above-bar-label-unit,
        .above-line[data-above-density="compressed"] .above-bar-label-unit {
          display: none;
        }
        .above-line[data-above-density="compressed"] .above-bar-label-name,
        .above-line[data-above-density="compressed"] .above-icon-spacer {
          display: none;
        }
        .above-icon-spacer {
          flex: 0 0 var(--sbcp-icon-width);
        }
        .above-bar-label {
          flex: 1;
          min-width: 0;
          display: flex;
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
          white-space: nowrap;
          display: inline-flex;
          align-items: baseline;
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
          z-index: 4;
        }
        .peak-marker {
          z-index: 5;
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
        .value-right[data-hide-unit="true"] .unit-group {
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
        .value-right .unit-group {
          flex: 0 1 auto;
          display: inline-flex;
          align-items: baseline;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit {
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
          ${cfg.title ? `<div class="card-title">${cfg.title}</div>` : ''}
          <div class="rows"></div>
          <div class="measure-layer"></div>
        </div>
      </ha-card>
    `;
    
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    
    this._resizeObserver = new ResizeObserver(() => {
      this._applyCompactTier();
      this._runPostLayoutPasses();
    });
    
    const card = this.shadowRoot.querySelector('.card');
    if (card) {
      this._applyCompactTier();
      this._resizeObserver.observe(card);
    }
    this._update();
  }

  _applyCompactTier() {
    if (!this.shadowRoot) return;
    const card = this.shadowRoot.querySelector('.card');
    if (!card) return;
    const width = card.getBoundingClientRect().width;
    let tier = 'normal';
    if (width < 180) tier = 'compressed';
    else if (width < 220) tier = 'dense';
    else if (width < 280) tier = 'tight';
    else if (width < 360) tier = 'compact';
    card.dataset.compact = tier;
  }

  _applyLeftModeDensity() {
    if (!this.shadowRoot) return;
    const densities = ['normal', 'compact', 'tight', 'dense', 'compressed'];
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach(mainLine => {
      const width = mainLine.getBoundingClientRect().width;
      let density = 'normal';
      if (width < 170) density = 'compressed';
      else if (width < 210) density = 'dense';
      else if (width < 255) density = 'tight';
      else if (width < 320) density = 'compact';

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
    });
  }

  _applyRowDensity() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.main-line').forEach(mainLine => {
      const width = mainLine.getBoundingClientRect().width;
      let density = 'normal';
      if (width < 150) density = 'compressed';
      else if (width < 190) density = 'dense';
      else if (width < 245) density = 'tight';
      else if (width < 300) density = 'compact';
      mainLine.dataset.rowDensity = density;
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

  _applyValueWidthReservation() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.value-right').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
      if (!display) {
        valueEl.style.setProperty('--sbcp-value-extra-width', '0px');
        return;
      }

      const style = getComputedStyle(valueEl);
      const baseWidth = parseFloat(style.getPropertyValue('--sbcp-value-width')) || valueEl.clientWidth || 0;
      const reserveFullValue = unit && (this._isTightUnit(unit) || String(unit).trim().length <= 1);
      const desiredWidth = Math.ceil(
        this._measureValueMarkupWidth(valueEl, display, reserveFullValue ? unit : '', !reserveFullValue) + 2
      );
      const extraWidth = Math.max(0, Math.min(24, desiredWidth - baseWidth));
      valueEl.style.setProperty('--sbcp-value-extra-width', `${extraWidth}px`);
    });
  }

  _applyValueVisibility() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.value-right').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');

      if (!unit) {
        if (valueEl.dataset.hideUnit !== 'false') {
          valueEl.dataset.hideUnit = 'false';
          valueEl.innerHTML = this._formatRightValueMarkup(display, unit, false);
        }
        return;
      }

      const availableWidth = valueEl.clientWidth;
      const fullWidth = this._measureValueMarkupWidth(valueEl, display, unit, false);
      const shouldHideUnit = fullWidth > availableWidth + 1;
      const hideUnitFlag = shouldHideUnit ? 'true' : 'false';

      if (valueEl.dataset.hideUnit !== hideUnitFlag) {
        valueEl.dataset.hideUnit = hideUnitFlag;
        valueEl.innerHTML = this._formatRightValueMarkup(display, unit, shouldHideUnit);
      }
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
        this._applyValueVisibility();
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

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor, baselinePct = null) {
    const ecfg = this._resolve(entityCfg);
    const layout = ecfg.layout;
    const bar = ecfg.bar;
    const targetMarkerCfg = ecfg.target_marker;
    const peakMarkerCfg = ecfg.peak_marker;
    const lp   = layout.label_position;
    const h    = layout.height;
    const name = ecfg.name
      || this._hass?.states[entityCfg.entity]?.attributes?.friendly_name
      || entityCfg.entity;
    const peakMarkerColor = peakColor || '#888';
    const targetMarkerColor = targetColor || '#888';
    const peakContrastColor = this._getMarkerContrastColor(peakMarkerColor);
    const targetContrastColor = this._getMarkerContrastColor(targetMarkerColor);
    const usesBaseline = Number.isFinite(baselinePct);

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
      ? `<div class="label-left" style="flex:0 1 min(${layout.label_width}px, var(--sbcp-left-label-share));max-width:min(${layout.label_width}px, var(--sbcp-left-label-share));height:${h}px;"><span class="label-left-text">${name}</span></div>`
      : '';
    const rightValue = lp !== 'inside' && lp !== 'above'
      ? `<div class="value-right" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" style="height:${h}px;">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>`
      : '';    
      
    return `
      <div class="row" data-entity="${entityCfg.entity}">
        <div class="row-stack">
          ${aboveLabel}
          <div class="main-line ${lp}-mode" style="height:${h}px;">
            ${ecfg.icon && ecfg.icon !== false ? `<div class="icon-wrap" style="height:${h}px;min-height:${h}px;"><ha-icon icon="${ecfg.icon}"></ha-icon></div>` : ''}
            ${leftLabel}
            <div class="bar-wrap">
              <div class="bar-track" style="height:${h}px;">
                <div class="bar-scale" style="${usesBaseline ? this._getBaselineFillStyle(pct, h, ecfg, color, baselinePct) : this._getScaleStyle(color, ecfg)}"></div>
                <div class="bar-above-target${bar.animated ? '' : ' no-anim'}" style="${usesBaseline ? this._getAboveTargetSegmentStyle(pct, h, ecfg, targetPct, baselinePct) : this._getAboveTargetOverlayStyle(pct, h, ecfg, targetPct)}"></div>
                <div class="bar-fill${bar.animated ? '' : ' no-anim'}"
                  style="${usesBaseline ? `display:none;left:0;height:${h}px;` : this._getMaskStyle(pct, h)}"></div>
                ${innerLabel}
                ${peakMarker}
                ${targetMarker}
              </div>
              ${targetValueLabel}
            </div>
            ${rightValue}
          </div>
        </div>
      </div>`;
  }

  _update() {
    if (!this._hass || !this._config) return;
    const rowsEl = this.shadowRoot.querySelector('.rows');
    if (!rowsEl) return;

    const entities = this._config.entities;

    // First render: build all rows from scratch
    if (!this._rendered) {
      let html = '';
      for (const entityCfg of entities) {
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
        const baselineVal = this._getNormalizedResolvableNumericValue(ecfg.scale.baseline);
        const targetVal = this._getNormalizedResolvableNumericValue(ecfg.target_marker.source);
        const safeMin   = Number.isFinite(minVal) ? minVal : 0;
        const safeMax   = Number.isFinite(maxVal) ? maxVal : 100;
        const range     = safeMax - safeMin || 1;
        const isNumericState = Number.isFinite(rawVal);
        const pct = Number.isFinite(rawVal)
          ? this._toScalePct(rawVal, safeMin, safeMax)
          : 0;        
        const color     = this._getColor(pct, ecfg);
        const display   = isNaN(rawVal) ? stateObj.state : this._formatNumericDisplay(rawVal, ecfg.formatting.decimal);
        const displayUnit = isNumericState ? unit : '';
        let targetPct   = null;
        if (targetVal !== null) {
          targetPct = this._toScalePct(targetVal, safeMin, safeMax);
        }
        let baselinePct = null;
        if (baselineVal !== null) {
          baselinePct = this._toScalePct(baselineVal, safeMin, safeMax);
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
        html += this._buildRow(entityCfg, display, displayUnit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, ecfg.peak_marker.color, ecfg.target_marker.color, baselinePct);
      }
      rowsEl.innerHTML = html;
      this._rendered = true;
      this._runPostLayoutPasses(rowsEl.querySelectorAll('.row[data-entity]'));
      
      // Attach click handlers
      rowsEl.querySelectorAll('.row[data-entity]').forEach(row => {
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

      const ecfg    = this._resolve(entityCfg);
      const rawVal  = parseFloat(stateObj.state);
      const unit    = ecfg.formatting.unit ?? stateObj.attributes?.unit_of_measurement ?? '';
      const minVal    = this._getNormalizedResolvableNumericValue(ecfg.scale.min);
      const maxVal    = this._getNormalizedResolvableNumericValue(ecfg.scale.max);
      const baselineVal = this._getNormalizedResolvableNumericValue(ecfg.scale.baseline);
      const targetVal = this._getNormalizedResolvableNumericValue(ecfg.target_marker.source);
      const safeMin   = Number.isFinite(minVal) ? minVal : 0;
      const safeMax   = Number.isFinite(maxVal) ? maxVal : 100;
      const range     = safeMax - safeMin || 1;
      const isNumericState = Number.isFinite(rawVal);
      const pct = Number.isFinite(rawVal)
        ? this._toScalePct(rawVal, safeMin, safeMax)
        : 0;      
      const color   = this._getColor(pct, ecfg);
      const display = isNaN(rawVal) ? stateObj.state : this._formatNumericDisplay(rawVal, ecfg.formatting.decimal);
      const displayUnit = isNumericState ? unit : '';

      const row = rows[rowIdx];
      if (!row) { rowIdx++; continue; }

      // Update bar fill width and colour in-place — this is what triggers the CSS transition
      const fill = row.querySelector('.bar-fill');
      const aboveTarget = row.querySelector('.bar-above-target');
      const scale = row.querySelector('.bar-scale');
      let liveTargetPct = null;
      let liveBaselinePct = null;
      if (targetVal !== null) {
        liveTargetPct = this._toScalePct(targetVal, safeMin, safeMax);
      }
      if (baselineVal !== null) {
        liveBaselinePct = this._toScalePct(baselineVal, safeMin, safeMax);
      }

      if (scale) {
        scale.style.cssText = Number.isFinite(liveBaselinePct)
          ? this._getBaselineFillStyle(pct, ecfg.layout.height, ecfg, color, liveBaselinePct)
          : this._getScaleStyle(color, ecfg);
      }
      if (aboveTarget) {
        aboveTarget.style.cssText = Number.isFinite(liveBaselinePct)
          ? this._getAboveTargetSegmentStyle(pct, ecfg.layout.height, ecfg, liveTargetPct, liveBaselinePct)
          : this._getAboveTargetOverlayStyle(pct, ecfg.layout.height, ecfg, liveTargetPct);
        aboveTarget.className = `bar-above-target${ecfg.bar.animated ? '' : ' no-anim'}`;
      }
      if (fill) {
        fill.style.cssText = Number.isFinite(liveBaselinePct)
          ? `display:none;left:0;height:${ecfg.layout.height}px;`
          : this._getMaskStyle(pct, ecfg.layout.height);
        fill.className = `bar-fill${ecfg.bar.animated ? '' : ' no-anim'}`;
      }

      // Update displayed value
      const valueEl = row.querySelector('.value-right');
      if (valueEl) {
        valueEl.dataset.display = this._encodeDataAttr(display);
        valueEl.dataset.unit = this._encodeDataAttr(displayUnit);
        valueEl.dataset.hideUnit = 'false';
        valueEl.innerHTML = this._formatRightValueMarkup(display, displayUnit, false);
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

      // Update peak marker position
      if (ecfg.peak_marker.show && !isNaN(rawVal)) {
        const key = entityCfg.entity;
        if (this._peaks[key] === undefined || rawVal > this._peaks[key]) {
          this._peaks[key] = rawVal;
        }
        const peakVal = this._peaks[key];
        const peakPct = this._toScalePct(peakVal, safeMin, safeMax);
        const peakEl  = row.querySelector('.peak-marker');
        if (peakEl) peakEl.style.left = `${peakPct}%`;
      }
      // Update target marker position (for dynamic target_entity)
      if (targetVal !== null) {
        const targetPct = this._toScalePct(targetVal, safeMin, safeMax);
        const targetEl  = row.querySelector('.target-marker');
        if (targetEl) {
          targetEl.style.display = '';
          targetEl.style.left = `${targetPct}%`;
        }
        
        const targetLabelEl = row.querySelector('.target-value-label');
        if (targetLabelEl) {
          targetLabelEl.textContent = this._formatDisplayWithUnit(targetVal.toLocaleString(), unit);
          targetLabelEl.style.left = `${targetPct}%`;
          targetLabelEl.style.visibility = 'hidden';
        }
      }
      else {
        const targetEl = row.querySelector('.target-marker');
        if (targetEl) targetEl.style.display = 'none';
        
        const targetLabelEl = row.querySelector('.target-value-label');
        if (targetLabelEl) targetLabelEl.style.visibility = 'hidden';
      }
      rowIdx++;
    }
    this._runPostLayoutPasses(rows);
  }
  
  disconnectedCallback() {
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
