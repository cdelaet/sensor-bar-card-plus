import { getFiniteNumber, looksLikeEntityId, normalizeCardConfig } from '../config/normalize.js';
import { validateNormalizedConfig } from '../config/validate.js';
import { buildRowViewModel } from '../view-model/row-view-model.js';
import { buildBarRenderModel, getRevealTransitionDuration } from '../view-model/bar-render-model.js';
import { renderBar, patchBar } from '../render/bar-renderer.js';
import { barTrackStyles, barMarkerStyles, getBarAnimationStyles } from '../render/bar-styles.js';
import { updateExtremum } from '../utils/extrema.js';
import { formatNumericDisplay } from '../utils/format.js';

// Discovery sees parent context, not the feature's optional entity override.
export function supportsSensorBarFeature(_hass, context) {
  return looksLikeEntityId(context?.entity_id)
    || typeof context?.area_id === 'string' && context.area_id.trim().length > 0;
}

export class SensorBarCardPlusFeature extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._extrema = {};
    this._scaleHistory = null;
    this._previousRow = null;
    this._updateComplete = Promise.resolve();
  }

  static getStubConfig() {
    return { type: 'custom:sensor-bar-card-plus-feature' };
  }

  setConfig(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Invalid Sensor Bar Card Plus feature configuration');
    }
    if (config.entities !== undefined) {
      throw new Error('The feature displays one entity; use entity instead of entities');
    }
    if (config.entity != null && config.entity !== '' && !looksLikeEntityId(config.entity)) {
      throw new Error('Feature entity must be a valid entity id');
    }
    const key = JSON.stringify(config);
    if (key === this._configKey) return;
    this._configKey = key;
    this._config = { ...config, ...(typeof config.entity === 'string' ? { entity: config.entity.trim() } : {}) };
    this._configChanged = true;
    this._requestUpdate();
  }

  set hass(value) { this._hass = value; this._requestUpdate(); }
  get hass() { return this._hass; }
  set context(value) { this._context = value; this._requestUpdate(); }
  get context() { return this._context; }
  set color(value) { this._color = value; this._requestUpdate(); }
  get color() { return this._color; }
  set position(value) { this._position = value; this._requestUpdate(); }
  get position() { return this._position; }
  get updateComplete() { return this._updateComplete; }

  connectedCallback() { this._requestUpdate(); }

  _requestUpdate() {
    if (this._updateScheduled) return;
    this._updateScheduled = true;
    this._updateComplete = Promise.resolve().then(() => {
      this._updateScheduled = false;
      this._reconcile();
    });
  }

  _reconcile() {
    const entity = this._config?.entity || this._context?.entity_id || null;
    if (this._configChanged || entity !== this._entity) {
      this._entity = entity;
      this._configChanged = false;
      this._extrema = {};
      this._scaleHistory = null;
      this._sampleState = null;
      this._previousRow = null;
      this._structureKey = null;
      // Keep inheritance transient: never write context.entity_id into raw config.
      this._normalized = this._config ? normalizeCardConfig({
        ...this._config,
        type: 'custom:sensor-bar-card-plus',
        entity: undefined,
        entities: entity ? [{ entity }] : [],
      }) : null;
      this._diagnostics = validateNormalizedConfig(this._normalized);
    }

    const state = this._hass?.states?.[entity];
    let row = null;
    let status = !this._config ? 'Not configured'
      : !entity ? 'Configure an entity'
      : !this._hass ? 'Waiting for Home Assistant'
      : !state ? 'Entity not found'
      : null;
    if (state && this._normalized?.entities[0]) {
      const appearance = this._normalized.entities[0];
      const sample = getFiniteNumber(state.state);
      if (sample !== null && (state !== this._sampleState || sample !== this._sampleValue)) {
        this._sampleState = state;
        this._sampleValue = sample;
        const rawTimestamp = state.last_updated ?? state.last_changed;
        const parsedTimestamp = rawTimestamp instanceof Date ? rawTimestamp.getTime() : Date.parse(String(rawTimestamp ?? ''));
        const timestamp = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
        for (const key of ['peak', 'floor']) {
          const marker = appearance[`${key}_marker`];
          if (marker.show) {
            this._extrema[key] = updateExtremum(this._extrema[key], sample, marker.reset ?? { kind: 'never' }, key === 'peak' ? 'max' : 'min', timestamp);
          }
        }
      }
      row = buildRowViewModel({
        hass: this._hass, entityConfig: appearance, entityState: state,
        extrema: this._extrema, previousScale: this._scaleHistory,
      });
      this._scaleHistory = { min: row.min, max: row.max };
      if (row.numericValue === null) {
        status = state.state === 'unknown' ? 'Unknown'
          : state.state === 'unavailable' ? 'Unavailable' : 'Not numeric';
      }
    }
    this._row = row;
    this._status = status;
    this._render(row, status);
    // Recovery starts a fresh transition, without animating from a fictitious zero.
    this._previousRow = status ? null : row;
  }

  _ensureDom() {
    if (this._surface) return;
    this.shadowRoot.innerHTML = `
      <style>
        ${barTrackStyles}
        ${barMarkerStyles}
        ${getBarAnimationStyles('.surface[data-bar-animated="false"]')}
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          height: var(--feature-height, 42px);
          --sbcp-row-height: var(--feature-height, 42px);
        }
        .surface { position: relative; height: 100%; min-width: 0; }
        .bar-track {
          border-radius: var(--feature-border-radius, 12px);
          background: var(--secondary-background-color, #e8e8e8);
          background: color-mix(in srgb, var(--feature-color, var(--primary-color, #4a9eff)) 12%, var(--secondary-background-color, #e8e8e8));
        }
        .surface .bar-track *, .surface .marker-shape-svg path[data-shape] { pointer-events: none; }
        [hidden] { display: none !important; }
        .status {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          overflow: hidden;
          padding: 0 4px;
          box-sizing: border-box;
          border-radius: var(--feature-border-radius, 12px);
          background: var(--secondary-background-color, #e8e8e8);
          color: var(--secondary-text-color, #888);
          font: inherit;
          font-size: 12px;
        }
        @media (prefers-reduced-motion: reduce) {
          .surface *, .surface *::before, .surface *::after { transition: none !important; animation: none !important; }
        }
      </style>
      <div id="surface" class="surface" role="img">
        <div id="bar" aria-hidden="true" hidden></div>
        <div id="status" class="status" aria-hidden="true"></div>
      </div>`;
    this._surface = this.shadowRoot.querySelector('#surface');
    this._bar = this.shadowRoot.querySelector('#bar');
    this._statusEl = this.shadowRoot.querySelector('#status');
  }

  _render(row, status) {
    this._ensureDom();
    if (typeof this._color === 'string' && this._color) this.style.setProperty('--feature-color', this._color);
    else this.style.removeProperty('--feature-color');
    this._bar.hidden = Boolean(status);
    this._statusEl.hidden = !status;
    this._statusEl.textContent = status ?? '';
    this._surface.dataset.state = status ? 'unavailable' : 'numeric';
    const name = row?.name || this._entity || 'Sensor Bar Card Plus';
    this._surface.setAttribute('aria-label', status
      ? `${name}${this._entity && name !== this._entity ? ` (${this._entity})` : ''}: ${status}${row ? ` (${row.state})` : ''}`
      : `${name} (${this._entity}): ${row.primaryPresentation.text}. Range ${formatNumericDisplay(row.min)} to ${formatNumericDisplay(row.max)}${row.displayUnit ? ` ${row.displayUnit}` : ''}.`);
    if (status) return;

    const model = buildBarRenderModel(row, this._normalized.entities[0], { height: 'var(--sbcp-row-height)' });
    // No initial/recovery motion; subsequent numeric updates use the shared timing.
    model.animated = model.animated && Boolean(this._previousRow);
    this._surface.dataset.barAnimated = model.animated ? 'true' : 'false';
    const renderKey = JSON.stringify(model);
    const structureKey = JSON.stringify([model.baseline.configured, model.needle.configured, model.markers.map(marker => [marker.type, marker.id])]);
    if (structureKey !== this._structureKey) {
      this._bar.innerHTML = renderBar(model);
      this._structureKey = structureKey;
    } else if (renderKey !== this._barRenderKey) {
      patchBar(this._bar, model, { revealDuration: getRevealTransitionDuration(
        this._previousRow ? { valuePercent: this._previousRow.percent, baselinePercent: this._previousRow.baselinePercent } : null,
        { valuePercent: row.percent, baselinePercent: row.baselinePercent },
      ) });
    }
    this._barRenderKey = renderKey;
  }
}
