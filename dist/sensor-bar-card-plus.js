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
 *   color_mode: gradient          # gradient | severity | single
 *   color: '#4a9eff'              # bar colour when color_mode is 'single'
 *   animated: true                # smooth bar fill transition on value change
 *   show_peak: true               # show peak marker (highest value seen this session)
 *   peak_color: '#888'             # colour of the peak marker (default grey)
 *   target: 2400                   # optional fixed target marker (absolute value, same scale as min/max)
 *   target_entity: sensor.my_target_sensor   # optional entity providing the target marker value
 *   target_color: '#4a9eff'        # colour of the target marker (default grey)
 *   above_target_color: '#F44336' # optional color for filled bar section beyond the target
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
    this._config = {
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
      target: null,
      show_target_label: false,
      above_target_color: null, 
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
      ...config,
    };

    // Normalise single entity shorthand to array
    if (this._config.entity && !this._config.entities) {
      this._config.entities = [{ entity: this._config.entity }];
    }
    this._config.entities = this._config.entities.map(e =>
      typeof e === 'string' ? { entity: e } : e
    );

    this._render();
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
    const g = this._config;
    return {
      min:            entityCfg.min            ?? g.min,
      min_entity:     entityCfg.min_entity     ?? g.min_entity ?? null,
      max:            entityCfg.max            ?? g.max,
      max_entity:     entityCfg.max_entity     ?? g.max_entity ?? null,
      height:         entityCfg.height         ?? g.height,
      label_position: entityCfg.label_position ?? g.label_position,
      animated:       entityCfg.animated       ?? g.animated,
      color_mode:     entityCfg.color_mode     ?? g.color_mode,
      color:          entityCfg.color          ?? g.color,
      severity:       entityCfg.severity       ?? g.severity,
      show_peak:      entityCfg.show_peak      ?? g.show_peak,
      peak_color:     entityCfg.peak_color     ?? g.peak_color,
      target:         entityCfg.target         ?? g.target,
      target_entity:  entityCfg.target_entity  ?? g.target_entity ?? null,
      target_color:   entityCfg.target_color   ?? g.target_color,
      show_target_label: entityCfg.show_target_label ?? g.show_target_label,
      above_target_color: entityCfg.above_target_color ?? g.above_target_color ?? null,
      decimal:        entityCfg.decimal        ?? g.decimal,
      label_width:    entityCfg.label_width    ?? g.label_width,
      gradient_stops: entityCfg.gradient_stops ?? g.gradient_stops,
      unit:           entityCfg.unit           ?? g.unit ?? null,
      icon:           entityCfg.icon === false ? false : (entityCfg.icon ?? this._hass?.states[entityCfg.entity]?.attributes?.icon ?? null),
      name:           entityCfg.name           ?? null,
    };
  }

  _shouldUpdate(oldHass, newHass) {
    if (!this._config || !this._config.entities) return true;
    
    for (const entityCfg of this._config.entities) {
      const ecfg = this._resolve(entityCfg);
      const entitiesToWatch = [
        entityCfg.entity,
        ecfg.min_entity,
        ecfg.max_entity,
        ecfg.target_entity
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
    const labelRect = label.getBoundingClientRect();
    
    const markerPercent = parseFloat(marker.style.left);
    if (!Number.isFinite(markerPercent) || trackRect.width <= 0 || labelRect.width <= 0) {
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
  
  _getColor(pct, ecfg) {
    if (ecfg.color_mode === 'single') return ecfg.color;

    if (ecfg.color_mode === 'gradient') {
      let stops;
      if (ecfg.gradient_stops && ecfg.gradient_stops.length >= 2) {
        stops = ecfg.gradient_stops.map(s => {
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
    for (const s of (ecfg.severity || [])) {
      if (pct >= s.from && pct <= s.to) return s.color;
    }
    return ecfg.color;
  }

  _getFillStyle(pct, h, color, ecfg, targetPct = null) {
    const borderRadius = pct >= 97 ? 'border-radius:6px;' : 'border-radius:6px 0 0 6px;';
    const widthStyle = `width:${pct}%;height:${h}px;`;

    const hasAboveTargetColor =
      ecfg.above_target_color &&
      targetPct !== null &&
      Number.isFinite(targetPct) &&
      pct > targetPct;

    if (hasAboveTargetColor) {
      const normalStop = Math.max(0, Math.min(100, (targetPct / pct) * 100));
      return (
        widthStyle +
        borderRadius +
        `background:linear-gradient(to right, ` +
        `${color} 0%, ` +
        `${color} ${normalStop}%, ` +
        `${ecfg.above_target_color} ${normalStop}%, ` +
        `${ecfg.above_target_color} 100%);`
      );
    }

    if (ecfg.color_mode === 'gradient') {
      const gs = ecfg.gradient_stops && ecfg.gradient_stops.length >= 2
        ? [...ecfg.gradient_stops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(',')
        : '#4CAF50 0%,#FF9800 50%,#F44336 100%';

      return (
        widthStyle +
        borderRadius +
        'background:linear-gradient(to right,' + gs + ');' +
        'background-size:' + ((100 / pct) * 100).toFixed(1) + '% 100%;' +
        'background-repeat:no-repeat;'
      );
    }

    return widthStyle + borderRadius + 'background:' + color + ';';
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
        .main-line.left-mode[data-left-density="normal"] {
          --sbcp-left-label-share: 32%;
          --sbcp-value-width: 62px;
        }
        .main-line.left-mode[data-left-density="compact"] {
          --sbcp-left-label-share: 28%;
          --sbcp-value-width: 58px;
        }
        .main-line.left-mode[data-left-density="tight"] {
          --sbcp-left-label-share: 24%;
          --sbcp-value-width: 54px;
        }
        .main-line.left-mode[data-left-density="dense"] {
          --sbcp-left-label-share: 20%;
          --sbcp-value-width: 50px;
        }
        .main-line.left-mode[data-left-density="compressed"] {
          --sbcp-left-label-share: 17%;
          --sbcp-value-width: 46px;
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
        .main-line.left-mode[data-left-density="dense"] .value-right .unit-group,
        .main-line.left-mode[data-left-density="compressed"] .value-right .unit-group {
          display: none;
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
        .bar-fill {
          height: 100%;
          border-radius: 6px 0 0 6px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1), background-color 0.4s ease;
          min-width: 4px;
          position: relative;
          z-index: 1;
        }
        .bar-fill.no-anim { transition: none; }

        .bar-inner-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6px;
          pointer-events: none;
          z-index: 2;
        }
        .bar-inner-label span {
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
        .target-value-label {
          position: absolute;
          top: 100%;
          margin-top: 1px;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--secondary-text-color, #888);
          white-space: nowrap;
          pointer-events: none;
          z-index: 5;
          visibility: hidden;
        }
        .above-line {
          display: flex;
          gap: var(--sbcp-above-gap);
          min-width: 0;
          align-items: flex-end;
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
          color: var(--secondary-text-color, #888);
          margin-bottom: 4px;
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
        }
        /* ── Shared marker base ── */
        .peak-marker, .target-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          transform: translateX(-50%);
          z-index: 4;
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          --marker-color: #888;
        }
        /* Vertical lines */
        .peak-marker .peak-line,
        .target-marker .target-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 2px;
          background: var(--marker-color);
          z-index: 1;
        }
        /* Peak: chevron at TOP pointing down */
        .peak-marker .peak-chevron {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--marker-color);
          z-index: 2;
        }
        /* Target: chevron at BOTTOM pointing up */
        .target-marker .target-chevron {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 8px solid var(--marker-color);
          z-index: 2;
        }

        .value-right {
          flex: 0 0 var(--sbcp-value-width);
          width: var(--sbcp-value-width);
          min-width: var(--sbcp-value-width);
          max-width: var(--sbcp-value-width);
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
          min-width: 0;
        }
        .value-right-text {
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
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
          margin-left: 2px;
          line-height: 1.1;
        }
        .value-right .unit-group.tight-unit {
          margin-left: 0;
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
      </style>

      <ha-card>
        <div class="card">
          ${cfg.title ? `<div class="card-title">${cfg.title}</div>` : ''}
          <div class="rows"></div>
        </div>
      </ha-card>
    `;
    
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    
    this._resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this._applyCompactTier();
        this._applyLeftModeDensity();
        this._repositionAllTargetLabels();
      });
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
      const naturalLabelWidth = labelText ? labelText.scrollWidth : Number.POSITIVE_INFINITY;
      let relaxBy = 0;
      if (Number.isFinite(naturalLabelWidth)) {
        if (naturalLabelWidth <= 72 && width >= 185) relaxBy = 1;
        if (naturalLabelWidth <= 44 && width >= 205) relaxBy = 2;
      }

      const currentIndex = densities.indexOf(density);
      if (currentIndex !== -1 && relaxBy > 0) {
        density = densities[Math.max(0, currentIndex - relaxBy)];
      }

      mainLine.dataset.leftDensity = density;
    });
  }

  _isTightUnit(unit) {
    return ['h', 'm', 's'].includes(String(unit || '').trim());
  }

  _formatDisplayWithUnit(display, unit) {
    if (!unit) return String(display);
    const cleanUnit = String(unit);
    return `${display}${this._isTightUnit(cleanUnit) ? '' : ' '}${cleanUnit}`;
  }

  _formatRightValueMarkup(display, unit) {
    if (!unit) {
      return `<span class="value-right-text"><span class="value-right-number">${display}</span></span>`;
    }
    const cleanUnit = String(unit);
    const unitGroupClass = this._isTightUnit(cleanUnit) ? 'unit-group tight-unit' : 'unit-group';
    return `<span class="value-right-text"><span class="value-right-number">${display}</span><span class="${unitGroupClass}"><span class="unit">${cleanUnit}</span></span></span>`;
  }

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor) {
    const ecfg = this._resolve(entityCfg);
    const lp   = ecfg.label_position;
    const h    = ecfg.height;
    const name = ecfg.name
      || this._hass?.states[entityCfg.entity]?.attributes?.friendly_name
      || entityCfg.entity;

    // Peak marker — chevron top, line full height, configurable colour
    const peakMarker = ecfg.show_peak && peakPct !== null ? `
      <div class="peak-marker" style="left:${peakPct}%;--marker-color:${peakColor || '#888'};">
        <div class="peak-chevron"></div>
        <div class="peak-line"></div>
      </div>` : '';

    // Target marker — same but chevron at bottom pointing up
    const targetMarker = `
      <div class="target-marker" style="left:${targetPct !== null ? targetPct : 0}%;--marker-color:${targetColor || '#888'};display:${targetPct !== null ? '' : 'none'};">
        <div class="target-line"></div>
        <div class="target-chevron"></div>
      </div>`;
    const targetValueLabel = ecfg.show_target_label ? `
      <div class="target-value-label" style="left:${targetPct !== null ? targetPct : 0}%;">
        ${targetDisplay !== null ? targetDisplay : ''}
      </div>` : '';
    const aboveLabel = lp === 'above' ? `
      <div class="above-line">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="above-icon-spacer"></div>` : ''}
        <div class="above-bar-label">
          <span class="above-bar-label-name">${name}</span>
          <span class="above-bar-label-value">${this._formatDisplayWithUnit(stateDisplay, unit)}</span>
        </div>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span>${name}</span>
        <span>${this._formatDisplayWithUnit(stateDisplay, unit)}</span>
      </div>` : '';

    const leftLabel  = lp === 'left'
      ? `<div class="label-left" style="flex:0 1 min(${ecfg.label_width}px, var(--sbcp-left-label-share));max-width:min(${ecfg.label_width}px, var(--sbcp-left-label-share));height:${h}px;"><span class="label-left-text">${name}</span></div>`
      : '';
    const rightValue = lp !== 'inside' && lp !== 'above'
      ? `<div class="value-right" style="height:${h}px;">${this._formatRightValueMarkup(stateDisplay, unit)}</div>`
      : '';    
      
    return `
      <div class="row" data-entity="${entityCfg.entity}">
        <div class="row-stack">
          ${aboveLabel}
          <div class="main-line${lp === 'left' ? ' left-mode' : ''}" style="height:${h}px;">
            ${ecfg.icon && ecfg.icon !== false ? `<div class="icon-wrap" style="height:${h}px;min-height:${h}px;"><ha-icon icon="${ecfg.icon}"></ha-icon></div>` : ''}
            ${leftLabel}
            <div class="bar-wrap">
              <div class="bar-track" style="height:${h}px;">
                <div class="bar-fill${ecfg.animated ? '' : ' no-anim'}"
                  style="${this._getFillStyle(pct, h, color, ecfg, targetPct)}"></div>
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
        const unit      = ecfg.unit ?? stateObj.attributes?.unit_of_measurement ?? '';
        const minVal    = this._getNumericValue(ecfg.min, ecfg.min_entity);
        const maxVal    = this._getNumericValue(ecfg.max, ecfg.max_entity);
        const targetVal = this._getNumericValue(ecfg.target, ecfg.target_entity);
        const safeMin   = Number.isFinite(minVal) ? minVal : 0;
        const safeMax   = Number.isFinite(maxVal) ? maxVal : 100;
        const range     = safeMax - safeMin || 1;
        const pct = Number.isFinite(rawVal)
          ? Math.min(100, Math.max(0, ((rawVal - safeMin) / range) * 100))
          : 0;        
        const color     = this._getColor(pct, ecfg);
        const display   = isNaN(rawVal) ? stateObj.state : (ecfg.decimal !== null ? parseFloat(rawVal.toFixed(ecfg.decimal)).toLocaleString() : rawVal.toLocaleString());
        let targetPct   = null;
        if (targetVal !== null) {
          targetPct = Math.min(100, Math.max(0, ((targetVal - safeMin) / range) * 100));
        }
        let targetDisplay = null;
        if (targetVal !== null) {
          targetDisplay = this._formatDisplayWithUnit(targetVal.toLocaleString(), unit);
        }
        let peakPct = null, peakDisplay = null;
        if (ecfg.show_peak && !isNaN(rawVal)) {
          this._peaks[entityCfg.entity] = rawVal;
          peakPct     = pct;
          peakDisplay = display;
        }
        html += this._buildRow(entityCfg, display, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, ecfg.peak_color, ecfg.target_color);
      }
      rowsEl.innerHTML = html;
      this._rendered = true;
      requestAnimationFrame(() => {
        this._applyLeftModeDensity();
        rowsEl.querySelectorAll('.row[data-entity]').forEach(row => {
          this._positionTargetLabel(row);
        });
      });
      
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
      const unit    = ecfg.unit ?? stateObj.attributes?.unit_of_measurement ?? '';
      const minVal    = this._getNumericValue(ecfg.min, ecfg.min_entity);
      const maxVal    = this._getNumericValue(ecfg.max, ecfg.max_entity);
      const targetVal = this._getNumericValue(ecfg.target, ecfg.target_entity);
      const safeMin   = Number.isFinite(minVal) ? minVal : 0;
      const safeMax   = Number.isFinite(maxVal) ? maxVal : 100;
      const range     = safeMax - safeMin || 1;
      const pct = Number.isFinite(rawVal)
        ? Math.min(100, Math.max(0, ((rawVal - safeMin) / range) * 100))
        : 0;      
      const color   = this._getColor(pct, ecfg);
      const display = isNaN(rawVal) ? stateObj.state : (ecfg.decimal !== null ? parseFloat(rawVal.toFixed(ecfg.decimal)).toLocaleString() : rawVal.toLocaleString());

      const row = rows[rowIdx];
      if (!row) { rowIdx++; continue; }

      // Update bar fill width and colour in-place — this is what triggers the CSS transition
      const fill = row.querySelector('.bar-fill');
      let liveTargetPct = null;
      if (targetVal !== null) {
        liveTargetPct = Math.min(100, Math.max(0, ((targetVal - safeMin) / range) * 100));
      }

      if (fill) {
        fill.style.cssText = this._getFillStyle(pct, ecfg.height, color, ecfg, liveTargetPct);
        fill.className = `bar-fill${ecfg.animated ? '' : ' no-anim'}`;
      }

      // Update displayed value
      const valueEl = row.querySelector('.value-right');
      if (valueEl) {
        valueEl.innerHTML = this._formatRightValueMarkup(display, unit);
      }
      const innerLabel = row.querySelector('.bar-inner-label');
      if (innerLabel) {
        const spans = innerLabel.querySelectorAll('span');
        if (spans[1]) spans[1].textContent = this._formatDisplayWithUnit(display, unit);
      }
      const aboveLabel = row.querySelector('.above-bar-label');
      if (aboveLabel) {
        const spans = aboveLabel.querySelectorAll('span');
        if (spans[1]) spans[1].textContent = this._formatDisplayWithUnit(display, unit);
      }

      // Update peak marker position
      if (ecfg.show_peak && !isNaN(rawVal)) {
        const key = entityCfg.entity;
        if (this._peaks[key] === undefined || rawVal > this._peaks[key]) {
          this._peaks[key] = rawVal;
        }
        const peakVal = this._peaks[key];
        const peakPct = Math.min(100, Math.max(0, ((peakVal - safeMin) / range) * 100));
        const peakEl  = row.querySelector('.peak-marker');
        if (peakEl) peakEl.style.left = `${peakPct}%`;
      }
      // Update target marker position (for dynamic target_entity)
      if (targetVal !== null) {
        const targetPct = Math.min(100, Math.max(0, ((targetVal - safeMin) / range) * 100));
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
    requestAnimationFrame(() => {
      this._applyLeftModeDensity();
      rows.forEach(row => {
        this._positionTargetLabel(row);
      });
    });
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
