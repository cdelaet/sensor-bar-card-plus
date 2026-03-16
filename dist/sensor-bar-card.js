/**
 * sensor-bar-card - A polished, configurable sensor bar card for Home Assistant
 *
 * Works great for: power, temperature, humidity, water flow, battery, CO2, and more.
 *
 * Installation:
 *   1. Copy this file to your HA config /www/ folder
 *   2. Add resource in Lovelace: /local/sensor-bar-card.js (type: module)
 *   3. Restart or refresh browser
 *
 * ─── Global config options (all can be overridden per entity) ───────────────
 *
 *   type: custom:sensor-bar-card
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
 *   type: custom:sensor-bar-card
 *   title: Power Usage
 *   color_mode: gradient
 *   entities:
 *     - entity: sensor.kettle_power
 *       name: Kettle
 *       icon: mdi:kettle
 *       max: 3000
 *
 *  Dynamic scaling from sensors:
 *   type: custom:sensor-bar-card
 *   title: Grid Peak Monitoring
 *   entities:
 *     - entity: sensor.grid_projected_peak_power
 *       name: Projected Peak
 *       min: 0
 *       max_entity: sensor.grid_peak_limit
 *       target_entity: sensor.grid_peak_warning
 *
 *  Temperature:
 *   type: custom:sensor-bar-card
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
 *   type: custom:sensor-bar-card
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

  _render() {
    const cfg = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }

        .card {
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.08));
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
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          gap: 10px;
          cursor: pointer;
          border-radius: 8px;
          padding: 2px 4px;
        }
        .row:last-child { margin-bottom: 0; }
        .row:hover .bar-track { filter: brightness(0.95); transition: filter 0.15s; }

        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 28px;
          color: var(--primary-text-color, #333);
        }
        ha-icon { --mdc-icon-size: 20px; }

        .label-left {
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bar-label-above {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--secondary-text-color, #888);
          margin-bottom: 2px;
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
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          padding: 2px 8px;
          border-radius: 20px;
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
          flex-shrink: 0;
          min-width: 58px;
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
        }
        .value-right .unit {
          font-size: 11px;
          font-weight: 400;
          color: var(--secondary-text-color, #888);
          margin-left: 1px;
        }
      </style>

      <ha-card>
        <div class="card">
          ${cfg.title ? `<div class="card-title">${cfg.title}</div>` : ''}
          <div class="rows"></div>
        </div>
      </ha-card>
    `;

    this._update();
  }

  _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, peakColor, targetColor) {
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
    const targetMarker = targetPct !== null ? `
      <div class="target-marker" style="left:${targetPct}%;--marker-color:${targetColor || '#888'};">
        <div class="target-line"></div>
        <div class="target-chevron"></div>
      </div>` : '';

    const aboveLabel = lp === 'above' ? `
      <div class="bar-label-above">
        <span>${name}</span>
        <span>${stateDisplay}${unit ? ' ' + unit : ''}</span>
      </div>` : '';

    const innerLabel = lp === 'inside' ? `
      <div class="bar-inner-label">
        <span>${name}</span>
        <span>${stateDisplay}${unit ? ' ' + unit : ''}</span>
      </div>` : '';

    const leftLabel  = lp === 'left' ? `<div class="label-left" style="width:${ecfg.label_width}px;">${name}</div>` : '';

    const rightValue = lp !== 'inside' && lp !== 'above'
      ? `<div class="value-right">${stateDisplay}${unit ? `<span class="unit"> ${unit}</span>` : ''}</div>`
      : '';

    return `
      <div class="row" data-entity="${entityCfg.entity}">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="icon-wrap"><ha-icon icon="${ecfg.icon}"></ha-icon></div>` : ''}
        ${leftLabel}
        <div class="bar-wrap">
          ${aboveLabel}
          <div style="position:relative;height:${h}px;">
            <div class="bar-track" style="position:absolute;inset:0;height:${h}px;">
              <div class="bar-fill${ecfg.animated ? '' : ' no-anim'}"
                style="width:${pct}%;height:${h}px;${pct >= 97 ? 'border-radius:6px;' : ''}${
                  ecfg.color_mode === 'gradient'
                    ? (() => {
                      const gs = ecfg.gradient_stops && ecfg.gradient_stops.length >= 2
                        ? [...ecfg.gradient_stops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(',')
                        : '#4CAF50 0%,#FF9800 50%,#F44336 100%';
                      return 'background:linear-gradient(to right,' + gs + ');background-size:' + ((100/pct)*100).toFixed(1) + '% 100%;background-repeat:no-repeat;';
                    })()
                    : 'background:' + color + ';'
                }"></div>
              ${innerLabel}
            </div>
            ${peakMarker}
            ${targetMarker}
          </div>
        </div>
        ${rightValue}
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
        const pct       = Math.min(100, Math.max(0, ((rawVal - safeMin) / range) * 100));
        const color     = this._getColor(pct, ecfg);
        const display   = isNaN(rawVal) ? stateObj.state : (ecfg.decimal !== null ? parseFloat(rawVal.toFixed(ecfg.decimal)).toLocaleString() : rawVal.toLocaleString());
        let targetPct   = null;
        if (targetVal !== null) {
          targetPct = Math.min(100, Math.max(0, ((targetVal - safeMin) / range) * 100));
        }
        let peakPct = null, peakDisplay = null;
        if (ecfg.show_peak && !isNaN(rawVal)) {
          this._peaks[entityCfg.entity] = rawVal;
          peakPct     = pct;
          peakDisplay = display;
        }
        html += this._buildRow(entityCfg, display, unit, pct, color, peakPct, peakDisplay, targetPct, ecfg.peak_color, ecfg.target_color);
      }
      rowsEl.innerHTML = html;
      this._rendered = true;

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
      const pct     = Math.min(100, Math.max(0, ((rawVal - safeMin) / range) * 100));
      const color   = this._getColor(pct, ecfg);
      const display = isNaN(rawVal) ? stateObj.state : (ecfg.decimal !== null ? parseFloat(rawVal.toFixed(ecfg.decimal)).toLocaleString() : rawVal.toLocaleString());

      const row = rows[rowIdx];
      if (!row) { rowIdx++; continue; }

      // Update bar fill width and colour in-place — this is what triggers the CSS transition
      const fill = row.querySelector('.bar-fill');
      if (fill) {
        if (ecfg.color_mode === 'gradient') {
          fill.style.width = `${pct}%`;
          fill.style.backgroundSize = `${(100 / pct * 100).toFixed(1)}% 100%`;
        } else {
          fill.style.width = `${pct}%`;
          fill.style.background = color;
        }
        if (pct >= 97) {
          fill.style.borderRadius = '6px';
        } else {
          fill.style.borderRadius = '6px 0 0 6px';
        }
      }

      // Update displayed value
      const valueEl = row.querySelector('.value-right');
      if (valueEl) {
        valueEl.innerHTML = display + (unit ? `<span class="unit"> ${unit}</span>` : '');
      }
      const innerLabel = row.querySelector('.bar-inner-label');
      if (innerLabel) {
        const spans = innerLabel.querySelectorAll('span');
        if (spans[1]) spans[1].textContent = display + (unit ? ' ' + unit : '');
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
        if (targetEl) targetEl.style.left = `${targetPct}%`;
      }
      rowIdx++;
    }
  }
}

customElements.define('sensor-bar-card', SensorBarCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sensor-bar-card',
  name: 'Sensor Bar Card',
  description: 'Animated, colour-coded horizontal bar card for Home Assistant. Works with power, temperature, humidity, water flow, battery and more.',
});