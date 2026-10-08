import { barTrackStyles, barMarkerStyles, getBarAnimationStyles } from '../render/bar-styles.js';
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
import {
  buildMarkerModels,
  getMarkerLabelLaneOccupancy,
  getMarkerLaneOccupancy,
} from '../view-model/marker-view-model.js';
import { escapeHtml, setStyleIfChanged, setStyleTextIfChanged, setDatasetIfChanged, setClassNameIfChanged } from '../utils/dom.js';
import {
  formatDisplayWithUnit,
  formatNumericDisplay,
  isTightUnit,
} from '../utils/format.js';
import { updateExtremum } from '../utils/extrema.js';
import * as barRenderModel from '../view-model/bar-render-model.js';
import * as barRenderer from '../render/bar-renderer.js';

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
 *   peak_color: '#888888'          # colour of the peak marker (default grey)
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
    this._extrema = new WeakMap();
    this._rowScales = new WeakMap();
    this._rowGeneration = 0;
    this._rowPresence = [];
    this._leftModeResponsiveHistory = new WeakMap();
    this._rendered = false;
    this._resizeObserver = null;
    this._densityPassScheduled = false;
    this._densityPassDirty = false;
    this._densityPassFrame = null;
    this._densityPassRetries = 0;
    this._boundWindowResize = () => this._schedulePostLayoutDensityPass();
    this._markerHover = null;
    this._boundMarkerPointerOver = (event) => this._handleMarkerPointerOver(event);
    this._boundMarkerPointerOut = (event) => this._handleMarkerPointerOut(event);
    this._ensureBaseDom();
  }

  connectedCallback() {
    window.addEventListener('resize', this._boundWindowResize, { passive: true });
    this._setupResizeObserver();
    this._schedulePostLayoutDensityPass();
  }

  disconnectedCallback() {
    this._rowGeneration += 1;
    window.removeEventListener('resize', this._boundWindowResize);
    this._clearMarkerHover();
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
    this._rowGeneration += 1;
    const previousConfig = this._config;
    this._config = this.normalizeCardConfig(config);
    this._rowScales = new WeakMap();
    this._reconcileRowHistory(previousConfig?.entities ?? []);
    this._diagnostics = validateNormalizedConfig(this._config);
    this._logDiagnostics();
    this._render();
  }

  _reconcileRowHistory(previousRows) {
    // Compare normalized behavior, not retained raw aliases. Scale provenance
    // must be explicit here because it changes unavailable-source fallback.
    const canonical = (value, key = '') => {
      if (Array.isArray(value)) return value.map(canonical);
      if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort()
        .filter(name => !['severity', 'segment_space', 'label_precision_key'].includes(name))
        .map(name => [name, canonical(value[name], name)]));
      if (key === 'fixed') return getNumericValue(null, value);
      if (/color/i.test(key) && typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim())) {
        const hex = value.trim().slice(1).toLowerCase();
        return `#${hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex}`;
      }
      return value;
    };
    const signature = row => JSON.stringify(canonical({
      entity: row.entity, name: row.name, icon: row.icon ?? null,
      layout: row.layout,
      scale: Object.fromEntries(['min', 'max'].map(key => [key, {
        ...row.scale[key], fixed_explicit: row.scale[key].fixed_explicit !== false,
      }])),
      bar: row.bar, baseline: row.baseline, formatting: row.formatting,
      target_marker: row.target_marker, peak_marker: row.peak_marker,
      floor_marker: row.floor_marker, generic_markers: row.generic_markers,
    }));
    // Consume unchanged rows one-to-one, then preserve only unique remaining
    // old/new pairs for an entity. Ambiguous edited duplicates start fresh.
    const unmatchedOld = new Set(previousRows);
    const matches = new Map();
    const oldSignatures = new Map(previousRows.map(row => [row, signature(row)]));
    for (const row of this._config.entities) {
      const key = signature(row);
      const previous = [...unmatchedOld].find(old => oldSignatures.get(old) === key);
      if (!previous) continue;
      matches.set(row, previous);
      unmatchedOld.delete(previous);
    }
    const unmatchedNew = this._config.entities.filter(row => !matches.has(row));
    for (const row of unmatchedNew) {
      const old = [...unmatchedOld].filter(previous => previous.entity === row.entity);
      const next = unmatchedNew.filter(current => current.entity === row.entity);
      if (old.length !== 1 || next.length !== 1) continue;
      matches.set(row, old[0]);
      unmatchedOld.delete(old[0]);
    }
    const extrema = new WeakMap();
    const responsive = new WeakMap();
    for (const [row, previous] of matches) {
      const stored = this._extrema.get(previous);
      const retained = {};
      for (const key of ['peak', 'floor']) {
        const before = previous[`${key}_marker`];
        const after = row[`${key}_marker`];
        if (stored?.[key] && before?.show === true && after?.show === true
          && JSON.stringify(before.reset) === JSON.stringify(after.reset)) {
          retained[key] = { ...stored[key] };
        }
      }
      if (retained.peak || retained.floor) extrema.set(row, retained);
      if (previous.layout?.label?.position === 'left' && row.layout?.label?.position === 'left'
        && this._leftModeResponsiveHistory.has(previous)) {
        responsive.set(row, this._leftModeResponsiveHistory.get(previous));
      }
    }
    this._extrema = extrema;
    this._leftModeResponsiveHistory = responsive;
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
    return barRenderModel.inferSegmentEndValues(segments, fallbackEnd);
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
    if (!this._config.entities) return;
    
    if (!oldHass) {
      this._update();
      return;
    }
    
    if (this._shouldUpdate(oldHass, hass)) {
      this._update(oldHass);
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

  _getStateTimestamp(stateObj) {
    const rawTimestamp = stateObj?.last_updated ?? stateObj?.last_changed;
    const timestamp = rawTimestamp instanceof Date
      ? rawTimestamp.getTime()
      : Date.parse(String(rawTimestamp ?? ''));
    return Number.isFinite(timestamp) ? timestamp : Date.now();
  }

  _updateExtrema(entityCfg, normalizedEntity, stateObj) {
    const sample = getFiniteNumber(stateObj?.state);
    if (!Number.isFinite(sample)) return;

    const current = this._extrema.get(entityCfg) ?? {};
    const timestamp = this._getStateTimestamp(stateObj);
    for (const key of ['peak', 'floor']) {
      const marker = normalizedEntity?.[`${key}_marker`];
      if (marker?.show !== true) {
        delete current[key];
        continue;
      }
      current[key] = updateExtremum(
        current[key] ?? null,
        sample,
        marker.reset ?? { kind: 'never' },
        key === 'floor' ? 'min' : 'max',
        timestamp,
      );
    }
    if (current.peak || current.floor) {
      this._extrema.set(entityCfg, current);
    } else {
      this._extrema.delete(entityCfg);
    }
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
        ecfg.target_marker?.source?.entity,
        ...(ecfg.generic_markers ?? [])
          .filter((marker) => marker.accepted)
          .flatMap((marker) => [marker.source?.entity, marker.label?.entity])
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
    return setStyleIfChanged(el, prop, value);
  }

  _setStyleTextIfChanged(el, value) {
    return setStyleTextIfChanged(el, value);
  }

  _setTextIfChanged(el, value) {
    if (!el) return false;
    const nextValue = value == null ? '' : String(value);
    if ((el.textContent ?? '') === nextValue) return false;
    el.textContent = nextValue;
    return true;
  }

  _setDatasetIfChanged(el, key, value) {
    return setDatasetIfChanged(el, key, value);
  }

  _setClassNameIfChanged(el, value) {
    return setClassNameIfChanged(el, value);
  }
  
  _repositionAllTargetLabels() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.querySelectorAll('.row[data-entity]').forEach(row => {
      this._positionTargetLabel(row);
      this._positionMarkerValueLabel(row, '.peak-value-label', '.peak-marker');
      this._positionMarkerValueLabel(row, '.floor-value-label', '.floor-marker');
      this._positionGenericMarkerLabels(row);
    });
  }

  _positionGenericMarkerLabels(row) {
    (row.querySelectorAll?.('.generic-value-label[data-marker-id]') ?? []).forEach((label) => {
      const id = label.dataset.markerId;
      this._positionMarkerValueLabel(
        row,
        `.generic-value-label[data-marker-id="${id}"]`,
        `.generic-marker[data-marker-id="${id}"]`
      );
    });
  }
  
  _positionTargetLabel(row) {
    this._positionMarkerValueLabel(row, '.target-value-label', '.target-marker');
  }

  _getMarkerLabel(markerEl) {
    const row = markerEl?.closest('.row');
    if (!row) return null;
    if (markerEl.matches('.generic-marker[data-marker-id]')) {
      const markerId = markerEl.dataset.markerId;
      return [...row.querySelectorAll('.generic-value-label[data-marker-id]')]
        .find((label) => label.dataset.markerId === markerId) ?? null;
    }
    const labelSelector = markerEl.matches('.target-marker') ? '.target-value-label'
      : markerEl.matches('.peak-marker') ? '.peak-value-label'
        : markerEl.matches('.floor-marker') ? '.floor-value-label' : null;
    return labelSelector ? row.querySelector(labelSelector) : null;
  }

  _getGenericMarkerForLabel(labelEl) {
    const row = labelEl?.closest('.row');
    const markerId = labelEl?.dataset?.markerId;
    if (!row || !markerId) return null;
    return [...row.querySelectorAll('.generic-marker[data-marker-id]')]
      .find((marker) => marker.dataset.markerId === markerId) ?? null;
  }

  _setMarkerHover(markerEl) {
    const label = this._getMarkerLabel(markerEl);
    if (!label || markerEl.style.display === 'none' || getComputedStyle(label).visibility !== 'visible') {
      this._clearMarkerHover(markerEl);
      return;
    }
    if (this._markerHover?.label === label) return;
    this._clearMarkerHover();
    label.dataset.markerHovered = 'true';
    this._markerHover = { marker: markerEl, label };
  }

  _clearMarkerHover(markerEl = null) {
    if (!this._markerHover || (markerEl && this._markerHover.marker !== markerEl)) return;
    delete this._markerHover.label.dataset.markerHovered;
    this._markerHover = null;
  }

  _handleMarkerPointerOver(event) {
    if (event.pointerType === 'touch') return;
    const target = event.target?.closest?.('.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');
    const markerEl = target?.matches?.('.generic-value-label') ? this._getGenericMarkerForLabel(target) : target;
    if (markerEl) this._setMarkerHover(markerEl);
  }

  _handleMarkerPointerOut(event) {
    if (event.pointerType === 'touch') return;
    const target = event.target?.closest?.('.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');
    if (!target || target.contains(event.relatedTarget)) return;
    const markerEl = target.matches('.generic-value-label') ? this._getGenericMarkerForLabel(target) : target;
    if (!markerEl) return;
    this._clearMarkerHover(markerEl);
  }

  _positionMarkerValueLabel(row, labelSelector, markerSelector) {
    const track = row.querySelector('.bar-track');
    const label = row.querySelector(labelSelector);
    const marker = row.querySelector(markerSelector);
    
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
    return barRenderModel.hexToRgb(color);
  }

  _getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getSeverityInterpolationStops(ecfg, minValue, maxValue);
  }

  _getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getSeverityBandGradientCss(ecfg, minValue, maxValue);
  }

  _getSoftBandBlendWidthPct() {
    return barRenderModel.getSoftBandBlendWidthPct();
  }

  _pushGradientColorStop(stops, pos, color) {
    return barRenderModel.pushGradientColorStop(stops, pos, color);
  }

  _getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getSoftBandGradientStops(ecfg, minValue, maxValue);
  }

  _getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getSoftBandGradientCss(ecfg, minValue, maxValue);
  }

  _resolveSegmentBoundaryPct(boundary, minValue, maxValue) {
    return barRenderModel.resolveSegmentBoundaryPct(boundary, minValue, maxValue);
  }

  _getEffectiveFillStyle(ecfg) {
    return barRenderModel.getEffectiveFillStyle(ecfg);
  }

  _segmentsNeedBoundaryResolution(segments) {
    return barRenderModel.segmentsNeedBoundaryResolution(segments);
  }
  
  _getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getSegmentsForRendering(ecfg, minValue, maxValue);
  }

  _getColor(pct, ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getColor(pct, ecfg, minValue, maxValue);
  }

  _buildFullScaleGradientStyle(stops) {
    return barRenderModel.buildFullScaleGradientStyle(stops);
  }

  _getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getGradientInterpolationStops(ecfg, minValue, maxValue);
  }

  _rgbToCss(rgb) {
    return barRenderModel.rgbToCss(rgb);
  }

  _buildSolidGradientStyle(color) {
    return barRenderModel.buildSolidGradientStyle(color);
  }

  _getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100) {
    return barRenderModel.getBasePaintGradient(color, ecfg, minValue, maxValue);
  }

  _getOverlayGradient(startPct, endPct, color) {
    return barRenderModel.getOverlayGradient(startPct, endPct, color);
  }

  _toScalePct(value, minValue, maxValue) {
    return barRenderModel.toScalePct(value, minValue, maxValue);
  }

  _getRevealTransitionDuration(previousGeometry, nextGeometry) {
    return barRenderModel.getRevealTransitionDuration(previousGeometry, nextGeometry);
  }

  _resolveBaselinePct(ecfg, safeMin, safeMax) {
    if (ecfg.baseline?.enabled === false) return null;
    const baselineValue = this._getNormalizedResolvableNumericValue(ecfg.baseline?.at, safeMin, safeMax);
    if (!Number.isFinite(baselineValue)) return null;
    return this._toScalePct(baselineValue, safeMin, safeMax);
  }

  _formatNumericDisplay(rawVal, decimal = null) {
    return formatNumericDisplay(rawVal, decimal);
  }

  _getNormalizedPercent(valuePct, baselinePct = null) {
    return barRenderModel.getNormalizedPercent(valuePct, baselinePct);
  }

  _getEndpointSemantics(geometry) {
    return barRenderModel.getEndpointSemantics(geometry);
  }

  _getRevealCornerRadii(geometry) {
    return barRenderModel.getRevealCornerRadii(geometry);
  }

  _getAboveTargetOverlayInterval(targetPct = null) {
    return barRenderModel.getAboveTargetOverlayInterval(targetPct);
  }

  _getAboveTargetLayerGeometry(targetPct = null) {
    return barRenderModel.getAboveTargetLayerGeometry(targetPct);
  }

  _getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    return barRenderModel.getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue);
  }

  _getRevealShapeStyle(geometry, h) {
    return barRenderModel.getRevealShapeStyle(geometry, h);
  }

  _getStaticLayerRevealStyle(geometry) {
    return barRenderModel.getStaticLayerRevealStyle(geometry);
  }

  _getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    return barRenderModel.getFillPaintLayers(geometry, h, ecfg, color, targetPct, baselinePct, minValue, maxValue);
  }

  _getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
    return barRenderModel.getFillRenderState(pct, h, ecfg, color, targetPct, baselinePct, minValue, maxValue, needleActive);
  }

  _getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null) {
    return barRenderModel.getNeedleRenderState(rawValue, ecfg, minValue, maxValue, baselinePct);
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
          --sbcp-marker-label-lane-size: 15px;
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
        .row[data-marker-label-lane-below="true"]:not(:last-child) {
          margin-bottom: calc(10px + max(0px, var(--sbcp-marker-label-lane-size) - 12px));
        }
        /* Facing configured lanes overlap by 9px at the approved offsets; 10px leaves a 1px gap. */
        .row[data-marker-label-lane-below="true"]:has(+ .row[data-marker-label-lane-above="true"]) {
          margin-bottom: calc(10px + max(0px, var(--sbcp-marker-label-lane-size) - 12px) + 10px);
        }
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
        .above-line,
        .hero-line,
        .top-right-value {
          position: relative;
          z-index: 10;
        }
        .row:hover .bar-track { filter: brightness(0.95); transition: filter 0.15s; }
        .main-line {
          display: flex;
          align-items: center;
          gap: var(--sbcp-main-gap);
          min-width: 0;
        }
        .row[data-marker-label-lane-above="true"] .main-line:not(.hero-mode) {
          margin-top: var(--sbcp-target-label-font-size);
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
        .main-line.inside-mode[data-priority-hide-inside-icon="true"] .icon-wrap,
        .main-line.off-mode[data-hide-off-icon="true"] .icon-wrap {
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
        ha-icon {
          --mdc-icon-size: 20px;
          display: block;
        }
        .label-left {
          position: relative;
          z-index: 10;
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
${barTrackStyles}
${getBarAnimationStyles('.row[data-bar-animated="false"]')}
        .row[data-bar-animated="false"] .target-value-label,
        .row[data-bar-animated="false"] .peak-value-label,
        .row[data-bar-animated="false"] .floor-value-label,
        .row[data-bar-animated="false"] .generic-value-label {
          transition: none;
        }
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
          z-index: 10;
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
          min-width: 0;
          max-width: 100%;
          display: inline-flex;
          align-items: baseline;
        }
        .bar-inner-label .inside-value[data-hide-value="true"] {
          display: none;
        }
        .bar-inner-label[data-value-fit="compact"] {
          padding: 0 2px;
        }
        .bar-inner-label .inside-value[data-value-fit="compact"] {
          padding-left: 2px;
          padding-right: 2px;
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
          margin-top: 2px;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--marker-color, var(--secondary-text-color, #888));
          text-shadow:
            0 0 0.6px var(--marker-contrast-color),
            0 0 1.2px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent);
          background-color: var(--card-background-color, #fff);
          padding: 0 2px;
          border: 0;
          border-radius: 2px;
          box-shadow: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 8;
          visibility: hidden;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .peak-value-label,
        .floor-value-label,
        .generic-value-label {
          position: absolute;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--marker-color, var(--secondary-text-color, #888));
          text-shadow:
            0 0 0.6px var(--marker-contrast-color),
            0 0 1.2px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent);
          background-color: var(--card-background-color, #fff);
          padding: 0 2px;
          border: 0;
          border-radius: 2px;
          box-shadow: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 8;
          visibility: hidden;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .generic-value-label[data-show-marker="false"] {
          pointer-events: auto;
          cursor: pointer;
        }
        .peak-value-label {
          bottom: 100%;
          margin-bottom: 1px;
        }
        .floor-value-label {
          top: 100%;
          margin-top: 2px;
        }
        .generic-value-label[data-lane="above"] {
          bottom: 100%;
          margin-bottom: 1px;
        }
        .generic-value-label[data-lane="below"] {
          top: 100%;
          margin-top: 2px;
        }
        .target-value-label[data-marker-hovered="true"],
        .peak-value-label[data-marker-hovered="true"],
        .floor-value-label[data-marker-hovered="true"],
        .generic-value-label[data-marker-hovered="true"] {
          z-index: 11;
        }
        .above-line {
          display: grid;
          grid-template-columns: var(--sbcp-icon-width) minmax(0, 1fr);
          column-gap: var(--sbcp-main-gap);
          min-width: 0;
          align-items: flex-end;
        }
        .above-line[data-hide-above-icon="true"],
        .above-line[data-above-density="compressed"] {
          grid-template-columns: minmax(0, 1fr);
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
          width: var(--sbcp-icon-width);
          min-width: 0;
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
        .above-bar-label[data-hide-name="true"],
        .above-bar-label[data-priority-hide-name="true"] {
          gap: 0;
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
          --sbcp-hero-base-size: 84px;
          --sbcp-hero-compact-size: clamp(50px, calc(var(--sbcp-hero-base-size) * 0.89), 100px);
          --sbcp-hero-tight-size: clamp(42px, calc(var(--sbcp-hero-base-size) * 0.75), 84px);
          --sbcp-hero-dense-size: clamp(29px, calc(var(--sbcp-hero-base-size) * 0.52), 58px);
          --sbcp-hero-compressed-size: clamp(21px, calc(var(--sbcp-hero-base-size) * 0.38), 43px);
          --sbcp-hero-xs-size: clamp(15px, calc(var(--sbcp-hero-base-size) * 0.26), 29px);
          --sbcp-hero-fit-tight-size: clamp(15px, calc(var(--sbcp-hero-base-size) * 0.26), 29px);
          --sbcp-hero-fit-minimum-size: 12px;
          min-width: 0;
          margin-bottom: 0;
        }

        .hero-line[data-hero-size="small"] {
          --sbcp-hero-base-size: 56px;
        }

        .hero-line[data-hero-size="large"] {
          --sbcp-hero-base-size: 112px;
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
        .row[data-marker-label-lane-above="false"] .hero-header {
          margin-bottom: 0;
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
${barMarkerStyles}
        .value-right {
          position: relative;
          z-index: 10;
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
        .main-line.off-mode .value-right {
          flex-shrink: 1;
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
    this.shadowRoot.addEventListener('pointerover', this._boundMarkerPointerOver);
    this.shadowRoot.addEventListener('pointerout', this._boundMarkerPointerOut);
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

    this._setupResizeObserver();
    this._update();
    this._schedulePostLayoutDensityPass();
  }

  _setupResizeObserver() {
    if (!this.isConnected || this._resizeObserver) return;
    const surface = this.shadowRoot.querySelector('ha-card');
    const card = this.shadowRoot.querySelector('.card');
    if (!surface || !card) return;

    const observer = new ResizeObserver(() => {
      if (!this.isConnected || this._resizeObserver !== observer) return;
      this._applyCompactTier();
      this._schedulePostLayoutDensityPass();
    });
    this._resizeObserver = observer;
    this._applyCompactTier();
    observer.observe(surface);
    observer.observe(this);
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

  _classifyLeftDensity(width, currentDensity = 'normal', naturalLabelWidth = Number.POSITIVE_INFINITY) {
    if (!this._isReliableWidth(width)) return currentDensity || 'normal';
    const densities = ['normal', 'compact', 'tight', 'dense', 'compressed'];
    let density = 'normal';
    if (width < 170) density = 'compressed';
    else if (width < 210) density = 'dense';
    else if (width < 255) density = 'tight';
    else if (width < 320) density = 'compact';

    const currentIndex = densities.indexOf(density);
    const relaxBy = Number.isFinite(naturalLabelWidth)
      ? (naturalLabelWidth <= 44 && width >= 205 ? 2 : naturalLabelWidth <= 72 && width >= 185 ? 1 : 0)
      : 0;
    return densities[Math.max(0, currentIndex - relaxBy)];
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
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach(mainLine => {
      const width = mainLine.getBoundingClientRect().width;
      if (!this._isReliableWidth(width)) {
        this._schedulePostLayoutDensityPass();
        if (!mainLine.dataset.leftDensity) mainLine.dataset.leftDensity = 'normal';
        return;
      }

      const labelText = mainLine.querySelector('.label-left-text');
      const text = (labelText?.textContent || '').trim();
      const naturalLabelWidth = labelText
        ? this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth
        : Number.POSITIVE_INFINITY;
      const density = this._classifyLeftDensity(width, mainLine.dataset.leftDensity, naturalLabelWidth);
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

      const display = this._decodeDataAttr(valueEl.dataset.display || valueEl.textContent || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
      valueEl.dataset.valueFit = 'normal';
      innerLabel.dataset.valueFit = 'normal';
      const fullWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, false);
      const numberWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, true);
      const rowWidth = mainLine?.getBoundingClientRect?.().width ?? 0;
      const rowDensity = this._isReliableWidth(rowWidth)
        ? this._classifyRowDensity(rowWidth, mainLine?.dataset?.rowDensity)
        : (mainLine?.dataset?.rowDensity || 'normal');
      const iconWrap = mainLine?.querySelector?.('.icon-wrap') ?? null;
      const iconReserve = iconWrap
        ? this._getLeftModeIconWidth(iconWrap, mainLine) + this._getLeftModeGap(mainLine)
        : 0;
      const minimum = this._getLeftModeBarMinWidth(mainLine);
      const withIconWidth = this._isReliableWidth(rowWidth)
        ? Math.max(minimum, rowWidth - iconReserve)
        : track.getBoundingClientRect().width;
      const withoutIconWidth = this._isReliableWidth(rowWidth)
        ? Math.max(minimum, rowWidth)
        : withIconWidth + iconReserve;
      const nameText = (nameEl.textContent || '').trim();
      const nameWidth = this._measureTextWidthWithStyles(nameEl, nameText) || nameEl.scrollWidth;

      const candidate = (trackWidth) => {
        const density = rowDensity === 'compressed' ? 'compressed'
          : this._classifyInsideDensity(trackWidth, fullWidth);
        innerLabel.dataset.insideDensity = density;
        innerLabel.dataset.valueFit = 'normal';
        valueEl.dataset.valueFit = 'normal';
        const padding = this._getNumericStyleValue(innerLabel, 'padding-left', 0)
          + this._getNumericStyleValue(innerLabel, 'padding-right', 0);
        let cap = Math.max(0, trackWidth - padding);
        const hideUnit = !!unit && fullWidth > cap;
        let readingWidth = hideUnit ? numberWidth : fullWidth;
        let valueFit = 'normal';
        if (readingWidth > cap) {
          // Compact existing pill padding before giving up a physically fitting number.
          valueFit = 'compact';
          innerLabel.dataset.valueFit = valueFit;
          valueEl.dataset.valueFit = valueFit;
          cap = Math.max(0, trackWidth - this._getNumericStyleValue(innerLabel, 'padding-left', 0)
            - this._getNumericStyleValue(innerLabel, 'padding-right', 0));
          readingWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, true);
        }
        const hideValue = readingWidth > cap;
        const gap = hideValue ? 0 : this._getNumericStyleValue(innerLabel, 'gap', 0);
        const nameShare = density === 'compact' ? 0.56 : density === 'tight' ? 0.48 : 0.6;
        const availableNameWidth = Math.max(0,
          Math.min(cap * nameShare, cap - (hideValue ? 0 : Math.ceil(readingWidth)) - gap));
        let hideName = density === 'dense' || density === 'compressed';
        if (nameText && nameWidth > 0) {
          const usefulWidth = this._getInsideUsefulNameWidth(nameEl, nameText, nameWidth);
          const visibleChars = this._measureVisibleLabelCharacters(nameEl, nameText, availableNameWidth);
          hideName = availableNameWidth < usefulWidth
            || (nameWidth > availableNameWidth + 1 && visibleChars < Math.min(4, nameText.length));
        }
        return { density, valueFit, hideUnit, hideValue, hideName,
          rank: hideValue ? 3 : valueFit === 'compact' ? 2 : hideUnit ? 1 : 0 };
      };

      let hideIcon = rowDensity === 'dense' || rowDensity === 'compressed';
      let chosen = candidate(hideIcon ? withoutIconWidth : withIconWidth);
      if (iconWrap && !hideIcon) {
        const withoutIcon = candidate(withoutIconWidth);
        if (withoutIcon.rank < chosen.rank
          || (withoutIcon.rank === chosen.rank && chosen.hideName && !withoutIcon.hideName)) {
          hideIcon = true;
          chosen = withoutIcon;
        }
      }
      innerLabel.dataset.insideDensity = chosen.density;
      innerLabel.dataset.valueFit = chosen.valueFit;
      innerLabel.dataset.hideName = chosen.hideName ? 'true' : 'false';
      valueEl.dataset.valueFit = chosen.valueFit;
      valueEl.dataset.hideUnit = chosen.hideUnit ? 'true' : 'false';
      valueEl.dataset.hideValue = chosen.hideValue ? 'true' : 'false';
      if (mainLine) mainLine.dataset.hideInsideIcon = hideIcon ? 'true' : 'false';
    });
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
      const labelText = typeof label.querySelector === 'function' ? label.querySelector('.above-bar-label-name') : null;
      const valueEl = typeof label.querySelector === 'function' ? label.querySelector('.above-bar-label-value') : null;
      const display = this._decodeDataAttr(valueEl?.dataset?.display || '');
      const unit = this._decodeDataAttr(valueEl?.dataset?.unit || '');
      const row = aboveLine.closest?.('.row');
      const mainLine = row?.querySelector?.('.main-line.above-mode');
      const rowDensity = mainLine?.dataset?.rowDensity || 'normal';
      const iconWrap = mainLine?.querySelector?.('.icon-wrap') ?? null;
      const iconRect = iconWrap?.getBoundingClientRect?.();
      const iconStyle = iconWrap && typeof getComputedStyle === 'function'
        ? getComputedStyle(iconWrap)
        : null;
      const mainIconVisible = !!iconWrap
        && rowDensity !== 'compressed'
        && iconStyle?.display !== 'none'
        && (iconRect?.width ?? 0) > 0
        && (iconRect?.height ?? 0) > 0;
      let hideName = density === 'dense' || density === 'compressed';
      let hideSpacer = !mainIconVisible;

      if (labelText && valueEl && display) {
        const rowStack = aboveLine.closest?.('.row-stack');
        const lineWidth = rowStack?.getBoundingClientRect?.().width
          ?? aboveLine.getBoundingClientRect?.().width
          ?? width;
        const spacerEl = typeof aboveLine.querySelector === 'function' ? aboveLine.querySelector('.above-icon-spacer') : null;
        const spacerWidth = mainIconVisible ? iconRect.width : 0;
        const lineGap = spacerEl ? this._getNumericStyleValue(aboveLine, 'gap', 0) : 0;
        const labelGap = this._getNumericStyleValue(aboveLine, '--sbcp-main-gap', this._getLeftModeGap(aboveLine));
        const fullValueWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
        const valueOnlyWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, true) + 2);
        const text = (labelText.textContent || '').trim();
        const spacerReserve = mainIconVisible && spacerWidth > 0 ? spacerWidth + lineGap : 0;
        const nameWidth = this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth || 0;
        const withNameBudget = Math.max(0, lineWidth - spacerReserve - labelGap);
        const fitsWithName = (valueWidth, budget = withNameBudget) => {
          const visibleWidth = Math.max(0, budget - valueWidth);
          const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
          return !this._shouldHideLeftLabel(text, nameWidth, visibleWidth, visibleChars);
        };
        const availableValueOnly = Math.max(0, lineWidth);

        let hideUnit = false;
        if (fullValueWidth <= withNameBudget && fitsWithName(fullValueWidth)) {
          hideName = false;
          hideSpacer = !mainIconVisible;
        } else if (fullValueWidth <= availableValueOnly) {
          // Header alignment and name yield before a unit that fits the full header.
          hideName = !fitsWithName(fullValueWidth, lineWidth - labelGap);
          hideSpacer = true;
        } else if (valueOnlyWidth <= withNameBudget && fitsWithName(valueOnlyWidth)) {
          hideName = false;
          hideUnit = !!unit;
          hideSpacer = !mainIconVisible;
        } else if (fitsWithName(valueOnlyWidth, lineWidth - labelGap)) {
          hideName = false;
          hideSpacer = true;
          hideUnit = !!unit;
        } else {
          hideName = true;
          hideSpacer = true;
          hideUnit = !!unit && fullValueWidth > availableValueOnly;
        }

        valueEl.dataset.hideUnit = hideUnit ? 'true' : 'false';
      } else if (valueEl) {
        valueEl.dataset.hideUnit = 'false';
      }

      label.dataset.hideName = hideName ? 'true' : 'false';
      aboveLine.dataset.hideAboveIcon = hideSpacer ? 'true' : 'false';
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
    wrapper.dataset.heroSize = heroLine.dataset.heroSize || 'medium';
    wrapper.dataset.heroDensity = heroLine.dataset.heroDensity || 'normal';
    wrapper.dataset.heroValueFit = valueFit;
    wrapper.dataset.hideHeroUnit = hideUnit ? 'true' : 'false';
    wrapper.style.display = 'inline-block';
    this._setStyleIfChanged(
      wrapper,
      '--sbcp-hero-base-size',
      heroLine.style?.getPropertyValue?.('--sbcp-hero-base-size') || null
    );

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
      delete headerEl.dataset.priorityHideName;

      const headerWidth = Math.floor(headerEl.getBoundingClientRect?.().width ?? 0);
      if (!this._isReliableWidth(headerWidth, 8)) {
        this._schedulePostLayoutDensityPass();
        return;
      }

      const hasUnit = !!unitGroup && unitGroup.textContent.trim().length > 0;
      const labelHiddenByDensity = headerEl.dataset.hideName === 'true';
      const visibleLabelGap = !labelHiddenByDensity && labelEl ? this._getNumericStyleValue(headerEl, 'column-gap', 0) : 0;
      const valueWidth = (valueFit = 'normal', hideUnit = false) => this._measureHeroValueWidth(heroLine, valueEl, valueFit, hideUnit);
      const availableWithLabel = Math.max(0, headerWidth - visibleLabelGap - 4);
      const availableWithoutLabel = Math.max(0, headerWidth - 4);

      if (!this._isReliableWidth(availableWithoutLabel, 8)) {
        heroLine.dataset.hideHeroUnit = hasUnit ? 'true' : 'false';
        heroLine.dataset.heroValueFit = 'minimum';
        this._schedulePostLayoutDensityPass();
        return;
      }

      if (valueWidth('normal', false) <= availableWithLabel) return;

      if (!labelHiddenByDensity && labelEl) {
        headerEl.dataset.priorityHideName = 'true';
        if (valueWidth('normal', false) <= availableWithoutLabel) return;
      }

      if (hasUnit) {
        // Keep the complete reading through the existing readable fitting sizes.
        for (const fit of ['tight', 'minimum']) {
          const readingWidth = valueWidth(fit, false);
          if (readingWidth <= availableWithoutLabel) {
            heroLine.dataset.heroValueFit = fit;
            if (!labelHiddenByDensity && labelEl) {
              const text = (labelEl.textContent || '').trim();
              const nameWidth = this._measureTextWidthWithStyles(labelEl, text);
              const availableName = Math.max(0, availableWithLabel - readingWidth);
              if (!this._shouldHideLeftLabel(text, nameWidth, availableName,
                this._measureVisibleLabelCharacters(labelEl, text, availableName))) {
                delete headerEl.dataset.priorityHideName;
              }
            }
            return;
          }
        }
        heroLine.dataset.hideHeroUnit = 'true';
        if (valueWidth('normal', true) <= availableWithoutLabel) return;
      }

      heroLine.dataset.heroValueFit = 'tight';
      if (valueWidth('tight', hasUnit) <= availableWithoutLabel) return;

      heroLine.dataset.heroValueFit = 'minimum';
      if (valueWidth('minimum', hasUnit) <= availableWithoutLabel) return;

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

  _measureInsideValueMarkupWidth(valueEl, display, unit, hideUnit = false) {
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
    clone.innerHTML = this._formatInsideValueMarkup(display, unit, hideUnit);
    // Reproduce the actual Inside typography and pill padding in the measuring layer.
    clone.removeAttribute('data-hide-value');
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-inner-label';
    wrapper.style.cssText = 'position:static;display:block;padding:0';
    wrapper.appendChild(clone);
    layer.replaceChildren(wrapper);
    return clone.getBoundingClientRect().width;
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

  _getInsideUsefulNameWidth(labelTextEl, text, fullWidth = NaN) {
    if (!text) return 0;
    const naturalWidth = Number.isFinite(fullWidth) && fullWidth > 0
      ? fullWidth
      : this._measureTextWidthWithStyles(labelTextEl, text);
    const usefulChars = text.slice(0, Math.min(5, text.length));
    const usefulWidth = this._measureTextWidthWithStyles(labelTextEl, usefulChars)
      + this._measureTextWidthWithStyles(labelTextEl, '...');
    const minUsefulWidth = Math.max(36, Math.min(44, usefulWidth || 0));
    return Math.min(naturalWidth || minUsefulWidth, minUsefulWidth);
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
      const fullWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
      const mainLine = valueEl.closest('.main-line');
      let desiredWidth = fullWidth;

      if (mainLine?.classList.contains('off-mode')) {
        const barWrap = mainLine.querySelector('.bar-wrap');
        const iconWrap = mainLine.querySelector('.icon-wrap');
        mainLine.dataset.hideOffIcon = 'false';
        const gap = parseFloat(getStyle(mainLine).gap) || 0;
        const rowWidth = mainLine.getBoundingClientRect?.().width ?? 0;
        const minimumRail = parseFloat(getStyle(barWrap).minWidth) || 0;
        const iconVisible = iconWrap && getStyle(iconWrap).display !== 'none';
        const iconWidth = iconVisible ? this._getLeftModeIconWidth(iconWrap, mainLine) : 0;
        const withoutIcon = Math.max(0, rowWidth - minimumRail - gap);
        const withIcon = withoutIcon - (iconVisible ? iconWidth + gap : 0);
        const numberWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, true) + 2);
        const hideIcon = iconVisible && (
          (fullWidth > withIcon && fullWidth <= withoutIcon)
          || (numberWidth > withIcon && numberWidth <= withoutIcon)
        );
        mainLine.dataset.hideOffIcon = hideIcon ? 'true' : 'false';
        const availableWidth = hideIcon ? withoutIcon : withIcon;
        if (availableWidth > 0) {
          const readableWidth = fullWidth <= availableWidth ? fullWidth : numberWidth;
          desiredWidth = Math.min(readableWidth, availableWidth);
        }
      }

      const extraWidth = Math.max(0, desiredWidth - baseWidth);
      valueEl.style.setProperty('--sbcp-value-extra-width', `${extraWidth}px`);
    });
  }

  _applyValueVisibility() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.value-right, .top-right-value, .above-bar-label-value').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
      let hideUnit = valueEl.dataset.hideUnit === 'true';
      const isAboveValue = valueEl.classList?.contains('above-bar-label-value');

      if (!isAboveValue && display) {
        const availableWidth = valueEl.getBoundingClientRect?.().width ?? valueEl.clientWidth ?? 0;
        const fullValueWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
        hideUnit = !!unit && availableWidth > 0 ? fullValueWidth > availableWidth : false;
        valueEl.dataset.hideUnit = hideUnit ? 'true' : 'false';
      }

      if (valueEl.innerHTML !== this._formatRightValueMarkup(display, unit, hideUnit)) {
        valueEl.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
      }
    });

    this.shadowRoot.querySelectorAll('.inside-value').forEach(valueEl => {
      const display = this._decodeDataAttr(valueEl.dataset.display || '');
      const unit = this._decodeDataAttr(valueEl.dataset.unit || '');
      const hideUnit = valueEl.dataset.hideUnit === 'true';
      const hideValue = valueEl.dataset.hideValue === 'true';

      if (!hideValue && !display) return;
      if (!valueEl.dataset.hideUnit) valueEl.dataset.hideUnit = 'false';
      if (!valueEl.dataset.hideValue) valueEl.dataset.hideValue = 'false';
      const nextMarkup = this._formatInsideValueMarkup(display, unit, hideUnit);
      if (valueEl.innerHTML !== nextMarkup) {
        valueEl.innerHTML = nextMarkup;
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

  _getStableLeftLabelMetrics(row, rowWidth = null) {
    const mainLine = row?.querySelector('.main-line');
    const labelWrap = row?.querySelector('.label-left');
    const labelText = row?.querySelector('.label-left-text');
    if (!mainLine || !labelWrap || !labelText) return null;

    const width = rowWidth ?? mainLine.getBoundingClientRect?.().width ?? 0;
    const text = (labelText.textContent || '').trim();
    const naturalWidth = this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth || 0;
    const density = mainLine.dataset?.leftDensity || 'normal';
    const labelShares = { normal: 0.25, compact: 0.22, tight: 0.19, dense: 0.16, compressed: 0.14 };
    const entityConfig = this._config?.entities?.find((item) => item.entity === row.dataset?.entity);
    const configuredWidth = entityConfig ? this._resolve(entityConfig)?.layout?.label?.width ?? 100 : 100;
    const maximumWidth = width > 0
      ? Math.min(configuredWidth, width * (labelShares[density] ?? labelShares.normal))
      : Math.min(naturalWidth, configuredWidth);

    return { text, naturalWidth, maximumWidth, labelWidth: maximumWidth, labelText };
  }

  _estimateLeftModeWidthBudget(row) {
    const mainLine = row?.querySelector('.main-line');
    if (!mainLine) return null;
    const rowWidth = mainLine.getBoundingClientRect?.().width ?? 0;
    if (!this._isReliableWidth(rowWidth)) return null;

    const labelWrap = row.querySelector('.label-left');
    const iconWrap = row.querySelector('.icon-wrap');
    const valueEl = row.querySelector('.value-right');
    const labelMetrics = this._getStableLeftLabelMetrics(row, rowWidth);
    const labelWidth = labelMetrics?.labelWidth ?? 0;
    const iconWidth = iconWrap ? this._getLeftModeIconWidth(iconWrap, mainLine) : 0;
    const valueWidth = this._getReservedInlineValueWidth(valueEl);
    const gap = this._getLeftModeGap(mainLine);
    const barMinWidth = this._getLeftModeBarMinWidth(mainLine);
    const baseLabelVisible = !!labelWrap;
    const hasIcon = !!iconWrap;
    const labelGapCount = hasIcon ? 2 : 1;
    const labelAvailableWidth = Math.max(0,
      rowWidth - (hasIcon ? iconWidth : 0) - barMinWidth - (labelGapCount * gap));
    const candidateLabelWidth = Math.min(labelWidth, labelAvailableWidth);
    const labelSacrificial = !labelMetrics || this._shouldHideLeftLabel(
      labelMetrics.text,
      labelMetrics.naturalWidth,
      candidateLabelWidth,
      this._measureVisibleLabelCharacters(labelMetrics.labelText, labelMetrics.text, candidateLabelWidth),
    );

    const withoutIconLabelWidth = Math.min(labelWidth, Math.max(0, rowWidth - barMinWidth - gap));
    const labelSacrificialWithoutIcon = !labelMetrics || this._shouldHideLeftLabel(
      labelMetrics.text, labelMetrics.naturalWidth, withoutIconLabelWidth,
      this._measureVisibleLabelCharacters(labelMetrics.labelText, labelMetrics.text, withoutIconLabelWidth),
    );

    return {
      rowWidth,
      gap,
      barMinWidth,
      labelSacrificialWithoutIcon,
      labelWidth: this._isReliableWidth(labelWidth, 0) ? labelWidth : 0,
      iconWidth: this._isReliableWidth(iconWidth, 0) ? iconWidth : 0,
      valueWidth: this._isReliableWidth(valueWidth, 0) ? valueWidth : 0,
      baseLabelVisible,
      labelSacrificial,
      hasIcon,
      mainLine,
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
    const remainingWidth = Math.max(0, effectiveBudget.rowWidth - reservedWidth);
    const fits = remainingWidth >= effectiveBudget.barMinWidth;
    const predictedBarWidth = fits ? remainingWidth : effectiveBudget.barMinWidth;

    return {
      rowWidth: effectiveBudget.rowWidth,
      barWidth: predictedBarWidth,
      share: predictedBarWidth / effectiveBudget.rowWidth,
      showLabel,
      showIcon,
      showInlineValue,
      reservedWidth,
      gapCount,
      fits,
    };
  }

  _getLeftModeCandidateStates(budget) {
    const states = [];
    if (budget && !budget.labelSacrificial) {
      states.push(
        { hideLabel: false, topValue: false, hideIcon: false },
        { hideLabel: false, topValue: true, hideIcon: false },
      );
    }
    if (budget && !budget.labelSacrificialWithoutIcon) {
      states.push(
        { hideLabel: false, topValue: false, hideIcon: true },
        { hideLabel: false, topValue: true, hideIcon: true },
      );
    }
    states.push(
      { hideLabel: true, topValue: false, hideIcon: false },
      { hideLabel: true, topValue: false, hideIcon: true },
      { hideLabel: true, topValue: true, hideIcon: true },
    );
    return states;
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

  _chooseLeftModeResponsiveState(row, settled = true) {
    const budget = this._estimateLeftModeWidthBudget(row);
    if (!budget) return null;
    const minimumBarShare = this._getMinimumBarShare();
    const states = this._getLeftModeCandidateStates(budget);
    const entityCfg = this._config.entities?.[Number(row?.dataset?.rowIndex)];
    const previousTopValue = entityCfg && this._leftModeResponsiveHistory.has(entityCfg)
      ? this._leftModeResponsiveHistory.get(entityCfg)
      : budget.rowStack?.dataset?.forceTopValue === 'true';
    const topStates = states.filter(state => state.topValue);
    const enableShare = this._getTopValueEnableShare();
    const disableShare = this._getTopValueDisableShare();
    for (const state of states) {
      const threshold = state.topValue || settled
        ? minimumBarShare
        : previousTopValue ? disableShare : enableShare;
      const predicted = this._predictLeftModeBarShareForState(row, state, budget);
      if (predicted?.fits && predicted.share >= threshold) return { ...state, predicted };
    }
    return this._chooseFallbackPredictedLeftModeState(row, topStates, budget);
  }

  _applyLeftModeResponsiveState(row, state) {
    const mainLine = row?.querySelector('.main-line');
    const rowStack = row?.querySelector('.row-stack');
    const leftLabel = row?.querySelector('.label-left');
    if (!mainLine || !rowStack) return;

    const entityCfg = this._config.entities?.[Number(row?.dataset?.rowIndex)];
    if (entityCfg) this._leftModeResponsiveHistory.set(entityCfg, state?.topValue === true);
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

  _ensureMinimumBarShare(rows = null, leftWidths = null) {
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
        const settled = !leftWidths || leftWidths.get(mainLine) === mainLine.getBoundingClientRect().width;
        const state = this._chooseLeftModeResponsiveState(row, settled);
        if (state) this._applyLeftModeResponsiveState(row, state);
        if (!settled) this._schedulePostLayoutDensityPass();
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
      const availableWidth = rowStack.getBoundingClientRect?.().width ?? topValue.getBoundingClientRect?.().width ?? topValue.clientWidth ?? 0;
      const fullValueWidth = display
        ? Math.ceil(this._measureValueMarkupWidth(topValue, display, unit, false) + 2)
        : 0;
      const hideUnit = !!unit && availableWidth > 0 && fullValueWidth > availableWidth;
      topValue.dataset.hideUnit = hideUnit ? 'true' : 'false';
      topValue.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
    });
  }

  _applyLeftLabelUsefulness() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.main-line.left-mode').forEach(mainLine => {
      const labelWrap = mainLine.querySelector('.label-left');
      const labelText = mainLine.querySelector('.label-left-text');
      if (!labelWrap || !labelText) return;

      const row = mainLine.closest?.('.row') || {
        dataset: {},
        querySelector: (selector) => selector === '.main-line' ? mainLine
          : selector === '.label-left' ? labelWrap
          : selector === '.label-left-text' ? labelText
          : null,
      };
      const metrics = this._getStableLeftLabelMetrics(row);
      if (!metrics) return;
      const visibleChars = this._measureVisibleLabelCharacters(metrics.labelText, metrics.text, metrics.labelWidth);
      labelWrap.dataset.hidden = this._shouldHideLeftLabel(
        metrics.text,
        metrics.naturalWidth,
        metrics.labelWidth,
        visibleChars,
      ) ? 'true' : 'false';
    });
  }

  _runPostLayoutPasses(rows = null) {
    const generation = this._rowGeneration;
    requestAnimationFrame(() => {
      if (!this.isConnected || generation !== this._rowGeneration) return;
      this._applyRowDensity();
      this._applyLeftModeDensity();
      this._applyAboveLabelDensity();
      this._applyHeroValueFit();
      this._applyInsideLabelDensity();
      this._applyValueWidthReservation();

      // Hysteresis smooths changing widths, but a stable width must select the
      // same candidate regardless of the row's previous inline/top placement.
      const leftWidths = new Map(
        [...(this.shadowRoot?.querySelectorAll('.main-line.left-mode') || [])]
          .map(mainLine => [mainLine, mainLine.getBoundingClientRect().width])
      );

      requestAnimationFrame(() => {
        if (!this.isConnected || generation !== this._rowGeneration) return;
        this._applyAdaptiveRowHeight();
        this._applyValueVisibility();
        this._applyLeftLabelUsefulness();
        this._applyTopRightValueLayout();
        this._ensureMinimumBarShare(rows, leftWidths);
        this._applyTopRightValueLayout();
        this._applyLeftLabelUsefulness();
        const targetRows = rows || this.shadowRoot?.querySelectorAll('.row[data-entity]') || [];
        targetRows.forEach(row => {
          this._positionTargetLabel(row);
          this._positionMarkerValueLabel(row, '.peak-value-label', '.peak-marker');
          this._positionMarkerValueLabel(row, '.floor-value-label', '.floor-marker');
          this._positionGenericMarkerLabels(row);
        });
      });
    });
  }

  _isTightUnit(unit) {
    return isTightUnit(unit);
  }

  _encodeDataAttr(value) {
    return encodeURIComponent(String(value ?? ''));
  }

  _decodeDataAttr(value) {
    const raw = String(value ?? '');
    try {
      return decodeURIComponent(raw);
    } catch (_err) {
      return raw;
    }
  }

  _parseColorToRgb(color) {
    return barRenderModel.parseColorToRgb(color);
  }

  _rgbToHsl({ r, g, b }) {
    return barRenderModel.rgbToHsl({ r, g, b });
  }

  _getMarkerContrastColor(color) {
    return barRenderModel.getMarkerContrastColor(color);
  }

  _getEffectiveMarkerColor(marker) {
    return barRenderModel.getEffectiveMarkerColor(marker);
  }

  _getMarkerLabelColorStyle(marker) {
    const color = this._getEffectiveMarkerColor(marker);
    return `--marker-color:${color};--marker-contrast-color:${this._getMarkerContrastColor(color)};`;
  }

  _getNeedleBorderColor(color) {
    return barRenderModel.getNeedleBorderColor(color);
  }

  _formatDisplayWithUnit(display, unit) {
    return formatDisplayWithUnit(display, unit);
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

  _formatAboveValueMarkup(display, unit, hideUnit = false) {
    return `<span class="above-bar-label-value" data-display="${this._encodeDataAttr(display)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="${hideUnit ? 'true' : 'false'}">${this._formatRightValueMarkup(display, unit, hideUnit)}</span>`;
  }

  _formatInsideValueMarkup(display, unit, hideUnit = false) {
    const escapedDisplay = escapeHtml(display);
    if (!unit || hideUnit) return `<span class="inside-value-text"><span class="inside-number">${escapedDisplay}</span></span>`;
    const cleanUnit = String(unit);
    const escapedUnit = escapeHtml(cleanUnit);
    const unitModeClass = this._isTightUnit(cleanUnit) ? 'tight-unit' : 'has-unit';
    return `<span class="inside-value-text ${unitModeClass}"><span class="inside-number">${escapedDisplay}</span><span class="inside-unit">${escapedUnit}</span></span>`;
  }

  _getRowMarkerModels(rowViewModel, ecfg, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor) {
    if (rowViewModel?.markers) {
      return rowViewModel.markers.map((marker) => {
        if (marker.type === 'target') {
          return {
            ...marker,
            position: targetPct === undefined ? marker.position : targetPct,
            visible: targetPct !== null && targetPct !== undefined,
            color: targetColor || marker.color,
            label: marker.label ?? (targetDisplay === null ? null : { text: targetDisplay }),
          };
        }
        if (marker.type === 'floor') {
          return marker;
        }
        if (marker.type !== 'peak') return marker;
        return {
          ...marker,
          position: peakPct === undefined ? marker.position : peakPct,
          visible: peakPct !== null && peakPct !== undefined && ecfg.peak_marker.show === true,
          color: peakColor || marker.color,
          label: marker.label ?? (peakDisplay === null ? null : { text: peakDisplay }),
        };
      });
    }
    const markers = buildMarkerModels({
      entityConfig: ecfg,
      targetPosition: targetPct,
      targetPresentation: targetDisplay === null ? null : { text: targetDisplay },
      targetVisible: Number.isFinite(targetPct),
      peakPosition: peakPct,
      peakPresentation: peakDisplay === null ? null : { number: peakDisplay },
      peakVisible: Number.isFinite(peakPct),
    });
    const targetMarker = this._getMarkerModel(markers, 'target');
    const peakMarker = this._getMarkerModel(markers, 'peak');
    if (targetMarker && targetColor) targetMarker.color = targetColor;
    if (peakMarker && peakColor) peakMarker.color = peakColor;
    return markers;
  }

  _getMarkerModel(markers, type) {
    return markers.find((marker) => marker.id === type || marker.type === type) ?? null;
  }

  _renderMarker(marker) {
    return barRenderer.renderMarker(marker);
  }

  _patchMarker(markerEl, marker) {
    if (markerEl && marker && !marker.visible) this._clearMarkerHover(markerEl);
    return barRenderer.patchMarker(markerEl, marker);
  }

  _patchMarkerLabelAppearance(labelEl, marker) {
    if (!labelEl || !marker) return;
    const markerColor = this._getEffectiveMarkerColor(marker);
    this._setStyleIfChanged(labelEl, '--marker-color', markerColor);
    this._setStyleIfChanged(labelEl, '--marker-contrast-color', this._getMarkerContrastColor(markerColor));
  }

  _buildRowViewModel(entityCfg, ecfg, stateObj) {
    const rowViewModel = buildRowViewModel({
      hass: this._hass,
      cardConfig: this._config,
      entityConfig: ecfg,
      entityState: stateObj,
      extrema: this._extrema.get(entityCfg) ?? null,
      previousScale: this._rowScales.get(entityCfg),
    });
    this._rowScales.set(entityCfg, { min: rowViewModel.min, max: rowViewModel.max });
    return rowViewModel;
  }

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor, minValue, maxValue, rowIndex = this._config.entities?.indexOf(entityCfg) ?? -1) {
    const ecfg = this._resolve(entityCfg);
    const stateObj = this._hass?.states?.[entityCfg.entity] ?? null;
    if (stateObj) this._updateExtrema(entityCfg, ecfg, stateObj);
    const rowViewModel = stateObj
      ? this._buildRowViewModel(entityCfg, ecfg, stateObj)
      : null;
    const layout = ecfg.layout;
    const bar = ecfg.bar;
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
    const markerModels = this._getRowMarkerModels(rowViewModel, ecfg, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor);
    const targetMarkerModel = this._getMarkerModel(markerModels, 'target');
    const peakMarkerModel = this._getMarkerModel(markerModels, 'peak');
    const floorMarkerModel = this._getMarkerModel(markerModels, 'floor');
    const genericMarkerModels = markerModels.filter((marker) => marker.type === 'generic');
    const markerLaneOccupancy = rowViewModel?.markerLaneOccupancy ?? getMarkerLaneOccupancy(ecfg);
    const markerLabelLaneOccupancy = rowViewModel?.markerLabelLaneOccupancy ?? getMarkerLabelLaneOccupancy(ecfg);
    const rawValue = rowViewModel?.numericValue ?? this._getFiniteNumber(stateDisplay);
    const needleState = rowViewModel?.needle ?? this._getNeedleRenderState(rawValue, ecfg, safeMin, safeMax, baselinePct);
    const barModel = barRenderModel.buildBarRenderModel({
      percent: pct, min: safeMin, max: safeMax,
      targetPercent: targetPct, baselinePercent: baselinePct,
      needle: needleState, markers: markerModels,
    }, ecfg, { height: 'var(--sbcp-row-height)', color });
    const targetValueLabel = targetMarkerModel?.labelVisible ? `
      <div class="target-value-label" style="left:${Number.isFinite(targetMarkerModel.position) ? targetMarkerModel.position : 0}%;visibility:${targetMarkerModel.visible && targetMarkerModel.label?.text ? 'visible' : 'hidden'};${this._getMarkerLabelColorStyle(targetMarkerModel)}">
        ${targetMarkerModel.label?.text ? escapeHtml(targetMarkerModel.label.text) : ''}
      </div>` : '';
    const peakValueLabel = peakMarkerModel?.labelVisible ? `
      <div class="peak-value-label" style="left:${Number.isFinite(peakMarkerModel.position) ? peakMarkerModel.position : 0}%;visibility:${peakMarkerModel.visible && peakMarkerModel.label?.text ? 'visible' : 'hidden'};${this._getMarkerLabelColorStyle(peakMarkerModel)}">
        ${peakMarkerModel.visible && peakMarkerModel.label?.text ? escapeHtml(peakMarkerModel.label.text) : ''}
      </div>` : '';
    const floorValueLabel = floorMarkerModel?.labelVisible ? `
      <div class="floor-value-label" style="left:${Number.isFinite(floorMarkerModel.position) ? floorMarkerModel.position : 0}%;visibility:${floorMarkerModel.visible && floorMarkerModel.label?.text ? 'visible' : 'hidden'};${this._getMarkerLabelColorStyle(floorMarkerModel)}">
        ${floorMarkerModel.visible && floorMarkerModel.label?.text ? escapeHtml(floorMarkerModel.label.text) : ''}
      </div>` : '';
    const genericValueLabels = genericMarkerModels
      .filter((marker) => marker.labelVisible)
      .map((marker) => `
      <div class="generic-value-label" data-marker-id="${escapeHtml(marker.id)}" data-lane="${marker.lane}" data-show-marker="${marker.showMarker === false ? 'false' : 'true'}" style="left:${Number.isFinite(marker.position) ? marker.position : 0}%;visibility:${marker.visible && marker.label?.text ? 'visible' : 'hidden'};${this._getMarkerLabelColorStyle(marker)}">
        ${marker.visible && marker.label?.text ? escapeHtml(marker.label.text) : ''}
      </div>`)
      .join('');
    const aboveLabel = lp === 'above' ? `
      <div class="above-line">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="above-icon-spacer"></div>` : ''}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${escapedName}</span>
          ${this._formatAboveValueMarkup(stateDisplay, unit, false)}
        </div>
      </div>` : '';
    const heroSize = layout.hero.size ?? 'small';
    const heroFontSize = layout.hero.value_size;
    const heroHeader = lp === 'hero' ? `
      <div class="hero-line" data-hero-size="${heroSize}"${Number.isFinite(heroFontSize) ? ` style="--sbcp-hero-base-size:${heroFontSize}px"` : ''}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${escapedName}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}">${this._formatRightValueMarkup(stateDisplay, unit, false)}</span>
        </div>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span class="inside-name">${escapedName}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(stateDisplay, unit, false)}</span>
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
    const escapedIcon = ecfg.icon && ecfg.icon !== false ? escapeHtml(ecfg.icon) : '';
    const mainIcon = escapedIcon && lp !== 'hero'
      ? `<div class="icon-wrap"><ha-icon icon="${escapedIcon}"></ha-icon></div>`
      : '';
    return `
      <div class="row" data-row-index="${rowIndex}" data-entity="${escapedEntityId}" data-base-height="${h}" data-height-explicit="${(rowViewModel?.attributes?.heightExplicit ?? layout.height_explicit) ? 'true' : 'false'}" data-bar-animated="${(rowViewModel?.attributes?.barAnimated ?? bar.animated) ? 'true' : 'false'}" data-marker-label-lane-above="${markerLabelLaneOccupancy.above ? 'true' : 'false'}" data-marker-label-lane-below="${markerLabelLaneOccupancy.below ? 'true' : 'false'}">
        <div class="row-stack" style="--sbcp-row-height:${h}px;">
          ${aboveLabel}
          ${heroHeader}
          ${topRightValue}
          <div class="main-line ${lp}-mode" data-marker-lane-above="${markerLaneOccupancy.above ? 'true' : 'false'}" data-marker-lane-below="${markerLaneOccupancy.below ? 'true' : 'false'}" style="height:${h}px;">
            ${mainIcon}
            ${leftLabel}
            <div class="bar-wrap">
              ${barRenderer.renderBar(barModel, { insideContent: innerLabel })}
              ${peakValueLabel}
              ${targetValueLabel}
              ${floorValueLabel}
              ${genericValueLabels}
            </div>
            ${rightValue}
          </div>
        </div>
      </div>`;
  }

  _patchRow(row, entityCfg, stateObj, previousHass = null) {
    if (!row || !stateObj) return;

    const ecfg = this._resolve(entityCfg);
    this._updateExtrema(entityCfg, ecfg, stateObj);
    const previousScale = this._rowScales.get(entityCfg);
    const rowViewModel = this._buildRowViewModel(entityCfg, ecfg, stateObj);
    const safeMin = rowViewModel.min;
    const safeMax = rowViewModel.max;
    const pct = rowViewModel.percent;
    const color = this._getColor(pct, ecfg, safeMin, safeMax);
    const display = rowViewModel.primaryPresentation.number;
    const displayUnit = rowViewModel.primaryPresentation.unit;

    const liveBaselinePct = rowViewModel.baselinePercent;
    const barModel = barRenderModel.buildBarRenderModel(rowViewModel, ecfg, { height: 'var(--sbcp-row-height)', color });
    const previousStateObj = previousHass?.states?.[entityCfg.entity] ?? null;
    const previousViewModel = previousStateObj
      ? buildRowViewModel({
        hass: previousHass,
        cardConfig: this._config,
        entityConfig: ecfg,
        entityState: previousStateObj,
        extrema: this._extrema.get(entityCfg) ?? null,
        previousScale,
      })
      : null;
    const revealDuration = this._getRevealTransitionDuration(
      previousViewModel && Number.isFinite(previousViewModel.numericValue)
        ? { valuePercent: previousViewModel.percent, baselinePercent: previousViewModel.baselinePercent }
        : null,
      Number.isFinite(rowViewModel.numericValue)
        ? { valuePercent: pct, baselinePercent: liveBaselinePct }
        : null,
    );

    // Hover belongs to the card's external labels, never to the shared renderer.
    const hoveredMarker = this._markerHover?.marker;
    if (hoveredMarker && row.contains(hoveredMarker)) {
      const marker = barModel.markers.find(candidate => candidate.type === 'generic'
        ? hoveredMarker.dataset.markerId === candidate.id
        : hoveredMarker.matches(`.${candidate.type}-marker`));
      if (marker && !marker.visible) this._clearMarkerHover(hoveredMarker);
    }
    barRenderer.patchBar(row, barModel, { revealDuration });
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
        valueSpan.dataset.hideUnit = 'false';
        valueSpan.dataset.hideValue = 'false';
        valueSpan.innerHTML = this._formatInsideValueMarkup(display, displayUnit, false);
      }
    }
    const heroHeader = row.querySelector('.hero-header');
    if (heroHeader) {
      const heroLine = row.querySelector('.hero-line');
      this._setStyleIfChanged(
        heroLine,
        '--sbcp-hero-base-size',
        Number.isFinite(ecfg.layout.hero.value_size) ? `${ecfg.layout.hero.value_size}px` : null
      );
      heroHeader.innerHTML = `<span class="hero-label label-left-text">${escapeHtml(rowViewModel.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(display)}" data-unit="${this._encodeDataAttr(displayUnit)}">${this._formatRightValueMarkup(display, displayUnit, false)}</span>`;
    }
    const aboveLabel = heroHeader ? null : row.querySelector('.above-bar-label');
    if (aboveLabel) {
      aboveLabel.innerHTML = `<span class="above-bar-label-name label-left-text">${escapeHtml(rowViewModel.name)}</span>${this._formatAboveValueMarkup(display, displayUnit, false)}`;
    }

    const targetLabelEl = row.querySelector('.target-value-label');
    const peakLabelEl = row.querySelector('.peak-value-label');
    const floorLabelEl = row.querySelector('.floor-value-label');
    const markerModels = rowViewModel.markers ?? [];
    (row.querySelectorAll?.('.generic-marker[data-marker-id]') ?? []).forEach((markerEl) => {
      const markerId = markerEl.dataset.markerId;
      const marker = this._getMarkerModel(markerModels, markerId);
      const labelEl = [...(row.querySelectorAll?.('.generic-value-label[data-marker-id]') ?? [])]
        .find((label) => label.dataset.markerId === markerId);
      if (!labelEl) return;
      this._setDatasetIfChanged(labelEl, 'showMarker', marker?.showMarker === false ? 'false' : 'true');
      this._patchMarkerLabelAppearance(labelEl, marker);
      if (marker?.labelVisible && marker.visible && marker.label?.text) {
        this._setTextIfChanged(labelEl, marker.label?.text ?? null);
        this._setStyleIfChanged(labelEl, 'visibility', 'visible');
        this._setStyleIfChanged(labelEl, 'left', `${Number.isFinite(marker.position) ? marker.position : 0}%`);
      } else {
        this._setStyleIfChanged(labelEl, 'visibility', 'hidden');
      }
    });
    const targetMarkerModel = this._getMarkerModel(markerModels, 'target');
    this._patchMarkerLabelAppearance(targetLabelEl, targetMarkerModel);
    if (targetLabelEl) {
      if (targetMarkerModel?.labelVisible && targetMarkerModel.visible && targetMarkerModel.label?.text) {
        this._setTextIfChanged(targetLabelEl, targetMarkerModel.label?.text ?? null);
      } else {
        this._setStyleIfChanged(targetLabelEl, 'visibility', 'hidden');
      }
    }
    const patchValueLabel = (labelEl, markerType) => {
      if (!labelEl) return;
      const marker = this._getMarkerModel(markerModels, markerType);
      this._patchMarkerLabelAppearance(labelEl, marker);
      if (marker?.labelVisible && marker.visible && marker.label?.text) {
        this._setTextIfChanged(labelEl, marker.label?.text ?? null);
        this._setStyleIfChanged(labelEl, 'visibility', 'visible');
        this._setStyleIfChanged(labelEl, 'left', `${Number.isFinite(marker.position) ? marker.position : 0}%`);
      } else {
        this._setStyleIfChanged(labelEl, 'visibility', 'hidden');
      }
    };
    patchValueLabel(peakLabelEl, 'peak');
    patchValueLabel(floorLabelEl, 'floor');
  }

  _update(previousHass = null) {
    if (!this._hass || !this._config) return;
    const rowsEl = this.shadowRoot.querySelector('.rows');
    if (!rowsEl) return;

    const entities = this._config.entities;
    const presence = entities.map(entityCfg => !!this._hass.states[entityCfg.entity]);
    const presenceChanged = presence.some((present, index) => present !== this._rowPresence[index]);

    // First render: build all rows from scratch
    if (!this._rendered || presenceChanged) {
      // Reconstruct DOM association only. Configured row ownership and runtime
      // histories survive primary-entity appearance/disappearance.
      this._rowGeneration += 1;
      this._rowPresence = presence;
      let html = '';
      for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
        const entityCfg = entities[entityIndex];
        const stateObj = this._hass.states[entityCfg.entity];
        if (!stateObj) {
          html += `<div class="row" data-row-index="${entityIndex}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${escapeHtml(entityCfg.entity)}</span></div>`;
          continue;
        }
        const ecfg      = this._resolve(entityCfg);
        this._updateExtrema(entityCfg, ecfg, stateObj);
        const rowViewModel = this._buildRowViewModel(entityCfg, ecfg, stateObj);
        const safeMin   = rowViewModel.min;
        const safeMax   = rowViewModel.max;
        const pct       = rowViewModel.percent;
        const color     = this._getColor(pct, ecfg, safeMin, safeMax);
        const display   = rowViewModel.primaryPresentation.number;
        const displayUnit = rowViewModel.primaryPresentation.unit;
        const targetPct = rowViewModel.targetPercent;
        const targetDisplay = rowViewModel.targetPresentation?.text ?? null;
        const peakPct = rowViewModel.peakPercent;
        const peakDisplay = rowViewModel.peakPresentation?.number ?? null;
        html += this._buildRow(entityCfg, display, displayUnit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, ecfg.peak_marker.color, ecfg.target_marker.color, safeMin, safeMax, entityIndex);
      }
      this._clearMarkerHover();
      rowsEl.innerHTML = html;
      this._rendered = true;

      const builtRows = rowsEl.querySelectorAll('.row[data-entity]');
      builtRows.forEach((row) => {
        const entityCfg = entities[Number(row.dataset.rowIndex)];
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
    for (const row of rows) {
      const entityCfg = entities[Number(row.dataset.rowIndex)];
      if (!entityCfg) continue;
      const stateObj = this._hass.states[entityCfg.entity];
      if (!stateObj) continue;
      this._patchRow(row, entityCfg, stateObj, previousHass);
    }
    this._runPostLayoutPasses(rows);
  }
}
