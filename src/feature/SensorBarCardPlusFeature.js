import { getFiniteNumber, looksLikeEntityId, normalizeCardConfig } from '../config/normalize.js';
import { validateNormalizedConfig } from '../config/validate.js';
import { buildRowViewModel } from '../view-model/row-view-model.js';
import { buildBarRenderModel, getRevealTransitionDuration } from '../view-model/bar-render-model.js';
import { renderBar, patchBar } from '../render/bar-renderer.js';
import { barTrackStyles, barMarkerStyles, getBarAnimationStyles } from '../render/bar-styles.js';
import { updateExtremum } from '../utils/extrema.js';
import { formatNumericDisplay } from '../utils/format.js';
import { setStyleIfChanged } from '../utils/dom.js';
import { getFeatureLabelGeometry, layoutFeatureMarkerLabels } from './marker-label-layout.js';

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
    this._labelNodes = new Map();
    this._onLabelResize = () => this._scheduleLabelLayout(true);
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

  disconnectedCallback() {
    this._stopLabelLayout();
  }

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
      this._labelLayoutKey = null;
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
        }
        .surface {
          position: relative; height: 100%; min-width: 0;
          --label-above: 0px; --label-below: 0px;
          --sbcp-row-height: calc(var(--feature-height, 42px) - var(--label-above) - var(--label-below));
        }
        #bar { position: absolute; top: var(--label-above); width: 100%; }
        .compact-labels { font: inherit; font-size: 9px; line-height: 9px; letter-spacing: normal; pointer-events: none; }
        .compact-marker-label {
          position: absolute; top: 0; height: 9px; padding: 0 2px; box-sizing: border-box;
          color: var(--primary-text-color, currentColor); white-space: nowrap; overflow: hidden;
          pointer-events: none;
        }
        .compact-marker-label[data-lane="below"] { top: auto; bottom: 0; }
        .surface[data-bar-animated="false"] .compact-marker-label { transition: none !important; }
        /* Both reserved label lanes cap glyphs. Uniform scaling preserves shape and edge anchoring. */
        .surface[data-compact-glyphs="true"] .marker-shape-svg { transform: translateX(-50%) scale(0.5); }
        .surface[data-compact-glyphs="true"] :is(.peak-inset, .target-inset, .floor-inset) {
          transform: translateX(-50%) scale(calc(8 / 14)); transform-origin: 50% 100%;
        }
        .surface[data-compact-glyphs="true"] .peak-inset { transform-origin: 50% 0; }
        .surface[data-compact-glyphs="true"] :is(.peak-outset, .target-outset, .floor-outset) {
          transform: translateX(-50%) scale(0.8); transform-origin: 50% 0;
        }
        .surface[data-compact-glyphs="true"] .peak-outset { transform-origin: 50% 100%; }
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
        <div id="labels" class="compact-labels" aria-hidden="true"></div>
        <div id="status" class="status" aria-hidden="true"></div>
      </div>`;
    this._surface = this.shadowRoot.querySelector('#surface');
    this._bar = this.shadowRoot.querySelector('#bar');
    this._labels = this.shadowRoot.querySelector('#labels');
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
    const occupancy = row?.markerLabelLaneOccupancy ?? {};
    const geometry = getFeatureLabelGeometry(0, occupancy);
    setStyleIfChanged(this._surface, '--label-above', `${geometry.above}px`);
    setStyleIfChanged(this._surface, '--label-below', `${geometry.below}px`);
    this._syncLabels(row, status);
    const name = row?.name || this._entity || 'Sensor Bar Card Plus';
    const markerDescription = (row?.markers ?? [])
      .filter(marker => marker.visible && (marker.showMarker || marker.labelVisible))
      .map(marker => {
        const type = marker.type === 'generic' ? 'Reference marker' : `${marker.type[0].toUpperCase()}${marker.type.slice(1)}`;
        const anchor = `${formatNumericDisplay(marker.value)}${row.displayUnit ? ` ${row.displayUnit}` : ''}`;
        return `${type} at ${anchor}${marker.labelVisible && marker.label?.text ? `; label ${marker.label.text}` : ''}.`;
      }).join(' ');
    this._surface.setAttribute('aria-label', status
      ? `${name}${this._entity && name !== this._entity ? ` (${this._entity})` : ''}: ${status}${row ? ` (${row.state})` : ''}`
      : `${name} (${this._entity}): ${row.primaryPresentation.text}. Range ${formatNumericDisplay(row.min)} to ${formatNumericDisplay(row.max)}${row.displayUnit ? ` ${row.displayUnit}` : ''}.${markerDescription ? ` ${markerDescription}` : ''}`);
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
    this._labelAnimated = model.animated;
    this._scheduleLabelLayout();
  }

  _syncLabels(row, status) {
    const markers = (row?.markers ?? []).filter(marker => marker.labelVisible);
    const ids = new Set(markers.map(marker => marker.id));
    for (const [id, node] of this._labelNodes) {
      if (!ids.has(id)) { node.remove(); this._labelNodes.delete(id); }
    }
    for (const marker of markers) {
      if (!this._labelNodes.has(marker.id)) {
        const node = document.createElement('span');
        node.className = 'compact-marker-label';
        node.dataset.markerId = marker.id;
        node.hidden = true;
        this._labels.append(node);
        this._labelNodes.set(marker.id, node);
      }
      this._labelNodes.get(marker.id).dataset.lane = marker.lane;
    }
    this._labels.hidden = Boolean(status);
    const required = row?.markerLabelLaneOccupancy?.above || row?.markerLabelLaneOccupancy?.below;
    if (!required) {
      this._stopLabelLayout();
      this._surface.dataset.compactGlyphs = 'false';
    } else if (this.isConnected && !this._labelObserver) {
      this._labelObserver = new ResizeObserver(this._onLabelResize);
      this._labelObserver.observe(this._surface);
      this._labelFonts = document.fonts;
      this._labelFonts.addEventListener('loadingdone', this._onLabelResize);
      const fonts = this._labelFonts;
      fonts.ready.then(() => {
        if (this._labelFonts === fonts) this._scheduleLabelLayout(true);
      });
    }
  }

  _stopLabelLayout() {
    this._labelObserver?.disconnect();
    this._labelObserver = null;
    this._labelFonts?.removeEventListener('loadingdone', this._onLabelResize);
    this._labelFonts = null;
    if (this._labelFrame) cancelAnimationFrame(this._labelFrame);
    this._labelFrame = null;
    this._labelLayoutKey = null;
  }

  _scheduleLabelLayout(snap = false) {
    if (!this._labelObserver) return;
    this._snapLabels = this._snapLabels || snap;
    if (this._labelFrame) return;
    this._labelFrame = requestAnimationFrame(() => {
      this._labelFrame = null;
      this._layoutLabels();
    });
  }

  _layoutLabels() {
    const { width, height } = this._surface.getBoundingClientRect();
    const geometry = getFeatureLabelGeometry(height, this._row?.markerLabelLaneOccupancy);
    this._surface.dataset.compactGlyphs = String(geometry.compactGlyphs);
    this._labelMeasure ??= document.createElement('canvas').getContext('2d');
    this._labelMeasure.font = getComputedStyle(this._labels).font;
    const layouts = layoutFeatureMarkerLabels(this._row?.markers ?? [], width, text => this._labelMeasure.measureText(text).width);
    const key = JSON.stringify([width, height, geometry.above, geometry.below, this._labelMeasure.font,
      layouts.map(label => [label.id, label.lane, label.mode, label.width])]);
    const animate = this._labelAnimated && !this._snapLabels && key === this._labelLayoutKey;
    for (const node of this._labelNodes.values()) node.hidden = true;
    for (const label of layouts) {
      const node = this._labelNodes.get(label.id);
      node.hidden = label.mode === 'hidden';
      node.dataset.mode = label.mode;
      if (node.textContent !== label.text) node.textContent = label.text;
      setStyleIfChanged(node, 'transition', animate ? 'left 0.6s cubic-bezier(0.4,0,0.2,1)' : 'none');
      setStyleIfChanged(node, 'left', `${label.left}px`);
      setStyleIfChanged(node, 'width', `${label.width}px`);
    }
    this._labelLayoutKey = key;
    this._snapLabels = false;
  }
}
