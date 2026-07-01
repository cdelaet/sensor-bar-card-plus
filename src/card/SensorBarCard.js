import {
  clampSupportedRowHeight,
  colorModeToFillStyle,
  getFiniteNumber,
  looksLikeEntityId,
  normalizeBarConfig,
  normalizeBarModeConfig,
  normalizeBaselineConfig,
  normalizeBaselineDirectionConfig,
  normalizeCardConfig,
  normalizeEntityConfig,
  normalizeFormattingConfig,
  normalizeGaugeSegments,
  normalizeGradientStops,
  normalizeLayoutConfig,
  normalizeNeedleConfig,
  normalizeOptionalEnabled,
  normalizePeakMarkerConfig,
  normalizeResolvableValue,
  normalizeScaleBound,
  normalizeScaleConfig,
  normalizeSeverityToSegments,
  normalizeStructuredResolvableValue,
  normalizeTargetMarkerConfig,
  parsePercentLiteral,
  resolveNormalizedBarMode,
  fillStyleToColorMode,
} from '../config/normalize.js';
import {
  getEntityNumericValue,
  getNormalizedResolvableNumericValue,
  getNumericValue,
  resolvePercentValue,
} from '../config/resolve.js';
import { validateNormalizedConfig } from '../config/validate.js';
import { buildRowViewModel } from '../view-model/row-view-model.js';
import { escapeHtml } from '../utils/dom.js';

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

export class SensorBarCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('sensor-bar-card-plus-editor');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._baseDomReady = false;
    this._config = {};
    this._diagnostics = { warnings: [], errors: [] };
    this._lastDiagnosticsSignature = null;
    this._hass = null;
    this._peaks = {};
    this._rendered = false;
    this._resizeObserver = null;
    this._densityPassScheduled = false;
    this._densityPassDirty = false;
    this._densityPassFrame = null;
    this._densityPassRetries = 0;
    this._boundWindowResize = () => this._schedulePostLayoutDensityPass();
    this._ensureBaseDom();
  }

  connectedCallback() {
    window.addEventListener('resize', this._boundWindowResize, { passive: true });
    this._schedulePostLayoutDensityPass();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._boundWindowResize);
    this._disconnectResizeObserver();
    if (this._densityPassFrame) {
      cancelAnimationFrame(this._densityPassFrame);
      this._densityPassFrame = null;
    }
    this._densityPassScheduled = false;
    this._densityPassDirty = false;
  }

  setConfig(config) {
    if (!config.entities && !config.entity) {
      throw new Error('You must define entities or entity');
    }
    this._rendered = false; // force full rebuild on config change
    this._config = this.normalizeCardConfig(config);
    const activeEntityIds = new Set(
      (this._config.entities || []).map((entityConfig) => entityConfig.entity)
    );
    for (const entityId of Object.keys(this._peaks)) {
      if (!activeEntityIds.has(entityId)) {
        delete this._peaks[entityId];
      }
    }
    this._diagnostics = validateNormalizedConfig(this._config);
    this._logDiagnostics();
    this._render();
  }

  _logDiagnostics() {
    const diagnostics = this._diagnostics ?? { warnings: [], errors: [] };
    const signature = JSON.stringify(diagnostics);
    if (signature === this._lastDiagnosticsSignature) return;
    this._lastDiagnosticsSignature = signature;

    diagnostics.warnings.forEach((diagnostic) => {
      console.warn(`[sensor-bar-card-plus] ${diagnostic.message}`, diagnostic);
    });
    diagnostics.errors.forEach((diagnostic) => {
      console.warn(`[sensor-bar-card-plus] ${diagnostic.message}`, diagnostic);
    });
  }

  // The normalized model is internal only. It preserves today's flat YAML
  // while giving future work one structured compatibility layer to build on.
  normalizeCardConfig(rawConfig) {
    return normalizeCardConfig(rawConfig);
  }

  normalizeEntityConfig(entityConfig, cardConfig) {
    return normalizeEntityConfig(entityConfig, cardConfig);
  }

  // Internal resolvable shape preserves today's flat `value + *_entity`
  // behavior while canonicalizing the normalized form to `fixed + entity`.
  normalizeResolvableValue(value, entityValue, percentValue = null) {
    return normalizeResolvableValue(value, entityValue, percentValue);
  }

  _looksLikeEntityId(value) {
    return looksLikeEntityId(value);
  }

  _parsePercentLiteral(value) {
    return parsePercentLiteral(value);
  }

  _getFiniteNumber(value) {
    return getFiniteNumber(value);
  }

  normalizeStructuredResolvableValue(input, inheritedResolvable = null, defaultValue = null, options = {}) {
    return normalizeStructuredResolvableValue(input, inheritedResolvable, defaultValue, options);
  }

  normalizeBaselineDirectionConfig(input, inheritedDirection = null) {
    return normalizeBaselineDirectionConfig(input, inheritedDirection);
  }

  normalizeBaselineConfig(entityConfig, cardConfig) {
    return normalizeBaselineConfig(entityConfig, cardConfig);
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
    return normalizeSeverityToSegments(input);
  }

  _hasResolvableMagnitude(resolvable) {
    return !!resolvable && (
      Number.isFinite(this._getFiniteNumber(resolvable.fixed))
      || Number.isFinite(resolvable.percent)
    );
  }

  normalizeGaugeSegments(input) {
    return normalizeGaugeSegments(input);
  }

  normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
    return normalizeScaleBound(entityConfig, cardConfig, key, defaultValue);
  }

  normalizeScaleConfig(entityConfig, cardConfig) {
    return normalizeScaleConfig(entityConfig, cardConfig);
  }

  _fillStyleToColorMode(fillStyle) {
    return fillStyleToColorMode(fillStyle);
  }

  _colorModeToFillStyle(colorMode) {
    return colorModeToFillStyle(colorMode);
  }

  _normalizeBarModeConfig(barConfig = null, flatColorMode = null) {
    return normalizeBarModeConfig(barConfig, flatColorMode);
  }

  _resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig) {
    return resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig);
  }

  _normalizeGradientStops(input) {
    return normalizeGradientStops(input);
  }

  normalizeNeedleConfig(input, inheritedNeedle = null) {
    return normalizeNeedleConfig(input, inheritedNeedle);
  }

  normalizeBarConfig(entityConfig, cardConfig) {
    return normalizeBarConfig(entityConfig, cardConfig);
  }

  normalizeLayoutConfig(entityConfig, cardConfig) {
    return normalizeLayoutConfig(entityConfig, cardConfig);
  }

  _clampSupportedRowHeight(height) {
    return clampSupportedRowHeight(height);
  }

  normalizeFormattingConfig(entityConfig, cardConfig) {
    return normalizeFormattingConfig(entityConfig, cardConfig);
  }

  normalizeTargetMarkerConfig(entityConfig, cardConfig) {
    return normalizeTargetMarkerConfig(entityConfig, cardConfig);
  }

  normalizePeakMarkerConfig(entityConfig, cardConfig) {
    return normalizePeakMarkerConfig(entityConfig, cardConfig);
  }

  _normalizeOptionalEnabled(value) {
    return normalizeOptionalEnabled(value);
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
    return getEntityNumericValue(this._hass, entityId);
  }
  
  _getNumericValue(value, entityId = null) {
    return getNumericValue(this._hass, value, entityId);
  }

  _resolvePercentValue(percent, minValue, maxValue) {
    return resolvePercentValue(percent, minValue, maxValue);
  }

  _getNormalizedResolvableNumericValue(resolvable, minValue = null, maxValue = null) {
    return getNormalizedResolvableNumericValue(this._hass, resolvable, minValue, maxValue);
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
        :host { 
          display: block; 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          position: relative;
          z-index: 0;
          isolation: isolate;
        }

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
        .hero-line {
          --sbcp-hero-min-value-size: 10px;
          --sbcp-hero-base-size: 56px;
          --sbcp-hero-compact-size: 50px;
          --sbcp-hero-tight-size: 44px;
          --sbcp-hero-dense-size: 36px;
          --sbcp-hero-compressed-size: 28px;
          --sbcp-hero-xs-size: 20px;
          --sbcp-hero-fit-tight-size: 20px;
          --sbcp-hero-fit-minimum-size: 12px;
          min-width: 0;
          margin-bottom: 0;
        }
        .hero-line[data-hero-size="medium"] {
          --sbcp-hero-base-size: 84px;
          --sbcp-hero-compact-size: 72px;
          --sbcp-hero-tight-size: 60px;
          --sbcp-hero-dense-size: 44px;
          --sbcp-hero-compressed-size: 32px;
          --sbcp-hero-xs-size: 22px;
          --sbcp-hero-fit-tight-size: 22px;
          --sbcp-hero-fit-minimum-size: 12px;
        }
        .hero-line[data-hero-size="large"] {
          --sbcp-hero-base-size: 112px;
          --sbcp-hero-compact-size: 88px;
          --sbcp-hero-tight-size: 64px;
          --sbcp-hero-dense-size: 44px;
          --sbcp-hero-compressed-size: 32px;
          --sbcp-hero-xs-size: 22px;
          --sbcp-hero-fit-tight-size: 22px;
          --sbcp-hero-fit-minimum-size: 12px;
        }
        .hero-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, auto);
          align-items: baseline;
          column-gap: var(--sbcp-main-gap);
          min-width: 0;
          overflow: hidden;
          margin-bottom: clamp(2px, calc(var(--sbcp-row-height) * 0.08), 4px);
        }
        .hero-header[data-hide-name="true"] .hero-label,
        .hero-header[data-priority-hide-name="true"] .hero-label {
          display: none;
        }
        .hero-header[data-hide-name="true"],
        .hero-header[data-priority-hide-name="true"] {
          grid-template-columns: minmax(0, 1fr);
        }
        .hero-header[data-hide-name="true"] .hero-value,
        .hero-header[data-priority-hide-name="true"] .hero-value {
          grid-column: 1 / -1;
          justify-self: stretch;
          width: 100%;
        }
        .hero-label {
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          line-height: 1.15;
        }
        .hero-value {
          min-width: 0;
          max-width: 100%;
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          justify-self: end;
          overflow: hidden;
          font-size: var(--sbcp-hero-base-size);
          font-weight: 700;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          line-height: 0.95;
          text-align: right;
        }

        .hero-line[data-hero-density="compact"] .hero-value {
          font-size: var(--sbcp-hero-compact-size);
        }
        .hero-line[data-hero-density="tight"] .hero-value {
          font-size: var(--sbcp-hero-tight-size);
        }
        .hero-line[data-hero-density="dense"] .hero-value {
          font-size: var(--sbcp-hero-dense-size);
        }
        .hero-line[data-hero-density="compressed"] .hero-value {
          font-size: var(--sbcp-hero-compressed-size);
        }
        .hero-line[data-hero-density="xs"] .hero-value {
          font-size: var(--sbcp-hero-xs-size);
        }
        .hero-line[data-hero-value-fit="tight"] .hero-value {
          font-size: var(--sbcp-hero-fit-tight-size);
        }
        .hero-line[data-hero-value-fit="minimum"] .hero-value {
          font-size: var(--sbcp-hero-fit-minimum-size);
        }
        .hero-line[data-hero-value-fit="hidden"] .hero-value {
          display: none;
        }
        .hero-line[data-hide-hero-unit="true"] .hero-value .unit-group {
          display: none;
        }
        .hero-value .value-right-text {
          display: inline-flex;
          flex: 1 1 auto;
          justify-content: flex-end;
          gap: 4px;
          align-items: baseline;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
        }
        .hero-value .value-right-text.tight-unit {
          gap: 2px;
        }
        .hero-value .value-right-number {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          line-height: 0.95;
        }
        .hero-value .unit-group {
          flex: 0 0 auto;
          align-self: baseline;
          line-height: 1;
          overflow: visible;
          text-overflow: clip;
        }
        .hero-value .unit {
          font-size: clamp(10px, 0.42em, 16px);
          font-weight: 500;
          color: var(--secondary-text-color, #888);
          line-height: 1;
          overflow: visible;
          text-overflow: clip;
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

    this._disconnectResizeObserver();
    this._resizeObserver = new ResizeObserver(() => {
      this._applyCompactTier();
      this._schedulePostLayoutDensityPass();
    });

    const surface = this.shadowRoot.querySelector('ha-card');
    const card = this.shadowRoot.querySelector('.card');
    if (surface && card) {
      this._applyCompactTier();
      this._resizeObserver.observe(surface);
      this._resizeObserver.observe(this);
    }
    this._update();
    this._schedulePostLayoutDensityPass();
  }

  _disconnectResizeObserver() {
    if (!this._resizeObserver) return;
    this._resizeObserver.disconnect();
    this._resizeObserver = null;
  }

  _isReliableWidth(width, minWidth = 16) {
    return Number.isFinite(width) && width >= minWidth;
  }

  _getHeroLabelReservedWidth(headerEl, labelEl, labelHidden) {
    if (labelHidden || !headerEl || !labelEl) return 0;

    const headerWidth = Math.floor(headerEl.getBoundingClientRect?.().width ?? 0);
    const naturalLabelWidth = Math.ceil(labelEl.scrollWidth || labelEl.getBoundingClientRect?.().width || 0);
    if (!this._isReliableWidth(headerWidth, 8) || !Number.isFinite(naturalLabelWidth) || naturalLabelWidth <= 0) {
      return 0;
    }

    return Math.min(naturalLabelWidth, headerWidth * 0.45);
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
    if (!this.isConnected) return;
    if (this._densityPassScheduled) {
      this._densityPassDirty = true;
      return;
    }
    this._densityPassScheduled = true;
    this._densityPassFrame = requestAnimationFrame(() => {
      this._densityPassScheduled = false;
      this._densityPassFrame = null;
      const runAgain = this._densityPassDirty;
      this._densityPassDirty = false;
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

      if (runAgain) {
        this._schedulePostLayoutDensityPass();
      }
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
    this.shadowRoot.querySelectorAll('.above-line, .hero-line').forEach(aboveLine => {
      const label = aboveLine.querySelector('.above-bar-label, .hero-header');
      if (!label) return;
      const isHeroLine = aboveLine.classList.contains('hero-line');
      const width = isHeroLine
        ? this._getHeroDensityWidth(aboveLine)
        : label.getBoundingClientRect().width;
      let density = 'normal';
      if (width < 90) density = 'xs';
      else if (width < 110) density = 'compressed';
      else if (width < 150) density = 'dense';
      else if (width < 210) density = 'tight';
      else if (width < 280) density = 'compact';
      if (isHeroLine) {
        aboveLine.dataset.heroDensity = density;
        label.dataset.hideName = density === 'dense' || density === 'compressed' || density === 'xs' ? 'true' : 'false';
        aboveLine.dataset.hideHeroIcon = density === 'compressed' || density === 'xs' ? 'true' : 'false';
        return;
      }
      aboveLine.dataset.aboveDensity = density;
      label.dataset.hideName = density === 'dense' || density === 'compressed' ? 'true' : 'false';
    });
  }

  _getHeroDensityWidth(heroLine) {
    const row = heroLine?.closest?.('.row');
    const rowStack = heroLine?.closest?.('.row-stack');
    const mainLine = rowStack?.querySelector?.('.main-line.hero-mode');
    const barWrap = mainLine?.querySelector?.('.bar-wrap');

    const candidates = [
      row?.getBoundingClientRect?.().width,
      rowStack?.getBoundingClientRect?.().width,
      mainLine?.getBoundingClientRect?.().width,
      barWrap?.getBoundingClientRect?.().width,
      heroLine?.getBoundingClientRect?.().width,
    ];

    for (const width of candidates) {
      if (this._isReliableWidth(width, 8)) return width;
    }

    return 0;
  }

  _measureHeroValueWidth(heroLine, valueEl, valueFit = 'normal', hideUnit = false) {
    const layer = this.shadowRoot?.querySelector('.measure-layer');
    if (!layer || !heroLine || !valueEl) return 0;

    const display = this._decodeDataAttr(valueEl.dataset.display || valueEl.textContent || '');
    const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
    if (!display) return 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'hero-line';
    wrapper.dataset.heroDensity = heroLine.dataset.heroDensity || 'normal';
    wrapper.dataset.heroValueFit = valueFit;
    wrapper.dataset.hideHeroUnit = hideUnit ? 'true' : 'false';
    wrapper.style.display = 'inline-block';

    const measureValue = document.createElement('span');
    measureValue.className = 'hero-value';
    measureValue.dataset.display = valueEl.dataset.display || '';
    measureValue.dataset.unit = valueEl.dataset.unit || '';
    measureValue.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
    measureValue.style.display = 'inline-flex';
    measureValue.style.flex = '0 0 auto';
    measureValue.style.width = 'auto';
    measureValue.style.minWidth = '0';
    measureValue.style.maxWidth = 'none';
    measureValue.style.justifyContent = 'flex-start';
    measureValue.style.justifySelf = 'start';
    measureValue.style.overflow = 'visible';

    const text = measureValue.querySelector('.value-right-text');
    if (text) {
      text.style.display = 'inline-flex';
      text.style.flex = '0 0 auto';
      text.style.width = 'auto';
      text.style.minWidth = '0';
      text.style.maxWidth = 'none';
      text.style.justifyContent = 'flex-start';
      text.style.overflow = 'visible';
    }

    const number = measureValue.querySelector('.value-right-number');
    if (number) {
      number.style.flex = '0 0 auto';
      number.style.minWidth = '0';
      number.style.overflow = 'visible';
      number.style.textOverflow = 'clip';
    }

    const unitGroup = measureValue.querySelector('.unit-group');
    if (unitGroup) {
      unitGroup.style.flex = '0 0 auto';
      unitGroup.style.minWidth = '0';
      unitGroup.style.overflow = 'visible';
    }

    wrapper.appendChild(measureValue);
    layer.replaceChildren(wrapper);

    return Math.max(
      Math.ceil(measureValue.getBoundingClientRect?.().width ?? 0),
      Math.ceil(measureValue.scrollWidth || 0),
      Math.ceil(text?.getBoundingClientRect?.().width ?? text?.scrollWidth ?? 0),
      Math.ceil(number?.getBoundingClientRect?.().width ?? number?.scrollWidth ?? 0),
      Math.ceil(unitGroup?.getBoundingClientRect?.().width ?? unitGroup?.scrollWidth ?? 0),
    );
  }

  _applyHeroValueFit() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.hero-line').forEach(heroLine => {
      const headerEl = heroLine.querySelector('.hero-header');
      const labelEl = heroLine.querySelector('.hero-label');
      const valueEl = heroLine.querySelector('.hero-value');
      const unitGroup = heroLine.querySelector('.unit-group');
      if (!headerEl || !valueEl) return;

      heroLine.dataset.hideHeroUnit = 'false';
      heroLine.dataset.heroValueFit = 'normal';

      const headerWidth = Math.floor(headerEl.getBoundingClientRect?.().width ?? 0);
      if (!this._isReliableWidth(headerWidth, 8)) {
        this._schedulePostLayoutDensityPass();
        return;
      }

      const labelHidden = headerEl.dataset.hideName === 'true' || headerEl.dataset.priorityHideName === 'true';
      const labelWidth = this._getHeroLabelReservedWidth(headerEl, labelEl, labelHidden);
      const gap = !labelHidden && labelEl ? this._getNumericStyleValue(headerEl, 'column-gap', 0) : 0;
      const availableWidth = Math.max(0, headerWidth - labelWidth - gap - 4);

      const hasUnit = !!unitGroup && unitGroup.textContent.trim().length > 0;

      if (!this._isReliableWidth(availableWidth, 8)) {
        heroLine.dataset.hideHeroUnit = hasUnit ? 'true' : 'false';
        heroLine.dataset.heroValueFit = 'minimum';
        this._schedulePostLayoutDensityPass();
        return;
      }

      if (this._measureHeroValueWidth(heroLine, valueEl, 'normal', false) <= availableWidth) return;

      heroLine.dataset.heroValueFit = 'tight';
      if (this._measureHeroValueWidth(heroLine, valueEl, 'tight', false) <= availableWidth) return;

      heroLine.dataset.heroValueFit = 'minimum';
      if (this._measureHeroValueWidth(heroLine, valueEl, 'minimum', false) <= availableWidth) return;

      if (hasUnit) {
        heroLine.dataset.hideHeroUnit = 'true';
        heroLine.dataset.heroValueFit = 'minimum';
        if (this._measureHeroValueWidth(heroLine, valueEl, 'minimum', true) <= availableWidth) return;
      }

      heroLine.dataset.hideHeroUnit = hasUnit ? 'true' : 'false';
      heroLine.dataset.heroValueFit = 'hidden';
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
      this._applyHeroValueFit();
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
    const escapedDisplay = escapeHtml(display);
    if (!unit || hideUnit) {
      return `<span class="value-right-text"><span class="value-right-number">${escapedDisplay}</span></span>`;
    }
    const cleanUnit = String(unit);
    const escapedUnit = escapeHtml(cleanUnit);
    const tightUnit = this._isTightUnit(cleanUnit);
    const textClass = tightUnit ? 'value-right-text tight-unit' : 'value-right-text has-unit';
    return `<span class="${textClass}"><span class="value-right-number">${escapedDisplay}</span><span class="unit-group"><span class="unit">${escapedUnit}</span></span></span>`;
  }

  _formatAboveValueMarkup(display, unit) {
    return `<span class="above-bar-label-value">${this._formatRightValueMarkup(display, unit, false)}</span>`;
  }

  _formatInsideValueMarkup(display, unit) {
    const escapedDisplay = escapeHtml(display);
    if (!unit) return `<span class="inside-value-text"><span class="inside-number">${escapedDisplay}</span></span>`;
    const cleanUnit = String(unit);
    const escapedUnit = escapeHtml(cleanUnit);
    const unitModeClass = this._isTightUnit(cleanUnit) ? 'tight-unit' : 'has-unit';
    return `<span class="inside-value-text ${unitModeClass}"><span class="inside-number">${escapedDisplay}</span><span class="inside-unit">${escapedUnit}</span></span>`;
  }

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor, minValue, maxValue) {
    const ecfg = this._resolve(entityCfg);
    const stateObj = this._hass?.states?.[entityCfg.entity] ?? null;
    const rowViewModel = stateObj
      ? buildRowViewModel({
        hass: this._hass,
        cardConfig: this._config,
        entityConfig: ecfg,
        entityState: stateObj,
        peaks: this._peaks,
      })
      : null;
    const layout = ecfg.layout;
    const bar = ecfg.bar;
    const targetMarkerCfg = ecfg.target_marker;
    const peakMarkerCfg = ecfg.peak_marker;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const baselinePct = rowViewModel?.baselinePercent ?? this._resolveBaselinePct(ecfg, safeMin, safeMax);
    const lp   = layout.label.position;
    const h    = rowViewModel?.attributes?.baseHeight ?? layout.height;
    const name = rowViewModel?.name
      ?? ecfg.name
      ?? stateObj?.attributes?.friendly_name
      ?? entityCfg.entity;
    const escapedEntityId = escapeHtml(rowViewModel?.entityId ?? entityCfg.entity);
    const escapedName = escapeHtml(name);
    const targetEnabled = targetMarkerCfg?.enabled !== false;
    const peakMarkerColor = peakColor || '#888';
    const targetMarkerColor = targetColor || '#888';
    const peakContrastColor = this._getMarkerContrastColor(peakMarkerColor);
    const targetContrastColor = this._getMarkerContrastColor(targetMarkerColor);
    const rawValue = rowViewModel?.numericValue ?? this._getFiniteNumber(stateDisplay);
    const needleState = rowViewModel?.needle ?? this._getNeedleRenderState(rawValue, ecfg, safeMin, safeMax, baselinePct);
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
        ${targetDisplay !== null ? escapeHtml(targetDisplay) : ''}
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
          <span class="above-bar-label-name label-left-text">${escapedName}</span>
          ${this._formatAboveValueMarkup(stateDisplay, unit)}
        </div>
      </div>` : '';
    const heroSize = layout.label.hero_size ?? 'small';
    const heroHeader = lp === 'hero' ? `
      <div class="hero-line" data-hero-size="${heroSize}">
        <div class="hero-header">
          <span class="hero-label label-left-text">${escapedName}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}">${this._formatRightValueMarkup(stateDisplay, unit, false)}</span>
        </div>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span class="inside-name">${escapedName}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}">${this._formatInsideValueMarkup(stateDisplay, unit)}</span>
      </div>` : '';

    const leftLabel  = lp === 'left'
      ? `<div class="label-left" style="flex:0 1 min(${layout.label.width}px, var(--sbcp-left-label-share));max-width:min(${layout.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${escapedName}</span></div>`
      : '';
    const rightValue = lp !== 'inside' && lp !== 'above' && lp !== 'hero'
      ? `<div class="value-right" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>`
      : '';
    const topRightValue = lp === 'left'
      ? `<div class="top-right-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>`
      : '';
    const mainIcon = ecfg.icon && ecfg.icon !== false && lp !== 'hero'
      ? `<div class="icon-wrap"><ha-icon icon="${ecfg.icon}"></ha-icon></div>`
      : '';
    return `
      <div class="row" data-entity="${escapedEntityId}" data-base-height="${h}" data-height-explicit="${(rowViewModel?.attributes?.heightExplicit ?? layout.height_explicit) ? 'true' : 'false'}" data-bar-animated="${(rowViewModel?.attributes?.barAnimated ?? bar.animated) ? 'true' : 'false'}">
        <div class="row-stack" style="--sbcp-row-height:${h}px;">
          ${aboveLabel}
          ${heroHeader}
          ${topRightValue}
          <div class="main-line ${lp}-mode" style="height:${h}px;">
            ${mainIcon}
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
    const rowViewModel = buildRowViewModel({
      hass: this._hass,
      cardConfig: this._config,
      entityConfig: ecfg,
      entityState: stateObj,
      peaks: this._peaks,
    });
    const rawVal = rowViewModel.numericValue;
    const safeMin = rowViewModel.min;
    const safeMax = rowViewModel.max;
    const targetVal = rowViewModel.target;
    const pct = rowViewModel.percent;
    const color = this._getColor(pct, ecfg, safeMin, safeMax);
    const display = rowViewModel.displayValue;
    const displayUnit = rowViewModel.displayUnit;

    const fillReveal = row.querySelector('.bar-fill-reveal');
    const paintLayer = row.querySelector('.bar-paint-layer[data-layer="base"]');
    const liveTargetPct = rowViewModel.targetPercent;
    const liveBaselinePct = rowViewModel.baselinePercent;
    const needleState = rowViewModel.needle;
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
    this._setDatasetIfChanged(row, 'baseHeight', rowViewModel.attributes.baseHeight);
    this._setDatasetIfChanged(row, 'heightExplicit', rowViewModel.attributes.heightExplicit ? 'true' : 'false');
    this._setDatasetIfChanged(row, 'barAnimated', rowViewModel.attributes.barAnimated ? 'true' : 'false');

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
    const heroHeader = row.querySelector('.hero-header');
    if (heroHeader) {
      heroHeader.innerHTML = `<span class="hero-label label-left-text">${escapeHtml(rowViewModel.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(display)}" data-unit="${this._encodeDataAttr(displayUnit)}">${this._formatRightValueMarkup(display, displayUnit, false)}</span>`;
    }
    const aboveLabel = heroHeader ? null : row.querySelector('.above-bar-label');
    if (aboveLabel) {
      aboveLabel.innerHTML = `<span class="above-bar-label-name label-left-text">${escapeHtml(rowViewModel.name)}</span>${this._formatAboveValueMarkup(display, displayUnit)}`;
    }

    if (ecfg.peak_marker.show && Number.isFinite(rawVal)) {
      const key = entityCfg.entity;
      if (this._peaks[key] === undefined || rawVal > this._peaks[key]) {
        this._peaks[key] = rawVal;
      }
      const peakVal = this._peaks[key];
      const peakPct = this._toScalePct(peakVal, safeMin, safeMax);
      const peakEl = row.querySelector('.peak-marker');
      if (peakEl) {
        if (Number.isFinite(peakPct)) {
          this._setStyleIfChanged(peakEl, 'left', `${peakPct}%`);
        }
        this._setStyleIfChanged(peakEl, '--marker-color', ecfg.peak_marker.color);
        this._setStyleIfChanged(peakEl, '--marker-contrast-color', this._getMarkerContrastColor(ecfg.peak_marker.color));
      }
    }

    const targetEl = row.querySelector('.target-marker');
    const targetLabelEl = row.querySelector('.target-value-label');
    if (targetVal !== null) {
      const targetPct = rowViewModel.targetPercent;
      if (targetEl) {
        this._setStyleIfChanged(targetEl, 'display', '');
        this._setStyleIfChanged(targetEl, 'left', `${targetPct}%`);
        this._setStyleIfChanged(targetEl, '--marker-color', ecfg.target_marker.color);
        this._setStyleIfChanged(targetEl, '--marker-contrast-color', this._getMarkerContrastColor(ecfg.target_marker.color));
      }

      if (targetLabelEl) {
        this._setTextIfChanged(targetLabelEl, rowViewModel.targetDisplay);
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
          html += `<div class="row"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${escapeHtml(entityCfg.entity)}</span></div>`;
          continue;
        }
        const ecfg      = this._resolve(entityCfg);
        const rowViewModel = buildRowViewModel({
          hass: this._hass,
          cardConfig: this._config,
          entityConfig: ecfg,
          entityState: stateObj,
          peaks: this._peaks,
        });
        const rawVal    = rowViewModel.numericValue;
        const safeMin   = rowViewModel.min;
        const safeMax   = rowViewModel.max;
        const targetVal = rowViewModel.target;
        const pct       = rowViewModel.percent;
        const color     = this._getColor(pct, ecfg, safeMin, safeMax);
        const display   = rowViewModel.displayValue;
        const displayUnit = rowViewModel.displayUnit;
        const targetPct = rowViewModel.targetPercent;
        const targetDisplay = rowViewModel.targetDisplay;
        let peakPct = null, peakDisplay = null;
        if (ecfg.peak_marker.show && Number.isFinite(rawVal)) {
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
}
