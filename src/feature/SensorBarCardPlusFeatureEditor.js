import {
  cloneDeep, serializeConfig, isObject, getPathValue, setPathValue, deletePathValue,
} from '../editor/shared/editor-config.js';
import {
  escapeAttribute, renderEntitySourceInput, getColorPickerValue, isHexColorValue,
} from '../editor/shared/editor-controls.js';
import { editorStyles } from '../editor/shared/editor-styles.js';
import { renderScaleSection, handleScaleField } from '../editor/sections/scale.js';
import {
  renderFormattingSection, handleFormattingField, getFormattingValue,
} from '../editor/sections/formatting.js';
import {
  renderBarAppearanceSection, handleBarAppearanceField, getEffectiveFillStyleValue,
  getBarColorValue, getBarSolidFillValue,
} from '../editor/sections/bar-appearance.js';
import { getFeatureScaleSource, patchFeatureScaleSource } from './feature-editor-config.js';

const root = { type: 'card' };

export class SensorBarCardPlusFeatureEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._context = {};
    this._chooseEntity = false;
    this._renderEpoch = 0;
    this._updateComplete = Promise.resolve();
    const handleField = event => this._handleField(event);
    for (const type of ['input', 'change', 'value-changed']) this.shadowRoot.addEventListener(type, handleField);
    this.shadowRoot.addEventListener('focusout', () => this._requestRender());
    // HA may load its picker after the editor. No polling or global observers.
    customElements.whenDefined('ha-entity-picker').then(() => {
      if (this.isConnected) this._requestRender();
    });
  }

  setConfig(config) {
    if (!isObject(config)) throw new Error('Invalid Sensor Bar Card Plus feature configuration');
    if (serializeConfig(config) !== serializeConfig(this._config)) {
      this._config = cloneDeep(config);
      this._chooseEntity = false;
      this._configReplaced = true;
    }
    this._requestRender();
  }

  set hass(value) { this._hass = value; this._requestRender(); }
  get hass() { return this._hass; }
  set context(value) { this._context = value ?? {}; this._requestRender(); }
  get context() { return this._context; }
  get updateComplete() { return this._updateComplete; }
  get _explicitEntity() { return typeof this._config.entity === 'string' ? this._config.entity.trim() : ''; }
  get _effectiveEntity() { return this._explicitEntity || this._context.entity_id || ''; }
  get _showEntityPicker() { return !!this._explicitEntity || this._chooseEntity || !this._context.entity_id; }

  connectedCallback() { this._requestRender(); }
  disconnectedCallback() { this._renderEpoch += 1; this._renderScheduled = false; }

  _requestRender() {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    const epoch = this._renderEpoch;
    this._updateComplete = Promise.resolve().then(() => {
      if (epoch !== this._renderEpoch) return;
      this._renderScheduled = false;
      this._render();
    });
  }

  _createSectionContext() {
    return {
      read: (_scope, path) => getPathValue(this._config, path),
      mutate: (_scope, mutation) => this._mutate(mutation),
      source: (_scope, key) => getFeatureScaleSource(this._config, key),
      setSource: (_scope, key, part, value) => this._mutate(config => patchFeatureScaleSource(config, key, part, value)),
    };
  }

  _mutate(mutation) {
    const next = mutation(this._config);
    if (serializeConfig(next) === serializeConfig(this._config)) return false;
    this._config = next;
    this._requestRender();
    this.dispatchEvent(new CustomEvent('config-changed', {
      bubbles: true, composed: true, detail: { config: cloneDeep(next) },
    }));
    return true;
  }

  _handleField(event) {
    const target = event.target;
    // Picker input/change events are internal; HA's value-changed is authoritative.
    if (target?.tagName === 'HA-ENTITY-PICKER' && event.type !== 'value-changed') return;
    const field = target?.dataset?.field?.replace(/-text-fallback$/, '');
    const kind = target?.dataset?.kind?.replace(/-text-fallback$/, '');
    const value = event.type === 'value-changed' ? event.detail?.value
      : target?.type === 'checkbox' ? target.checked : target?.value;
    if (field === 'feature-entity-override') {
      this._chooseEntity = !!value;
      if (!value) this._mutate(config => deletePathValue(config, ['entity']));
      this._requestRender();
      return;
    }
    if (kind === 'feature-entity-source') {
      const entity = typeof value === 'string' ? value.trim() : '';
      this._chooseEntity = false;
      this._mutate(config => entity ? setPathValue(config, ['entity'], entity) : deletePathValue(config, ['entity']));
      this._requestRender();
      return;
    }
    const context = this._createSectionContext();
    if (handleScaleField(context, { field, kind, value })) return;
    if (handleFormattingField(context, { field, kind, value })) return;
    handleBarAppearanceField(context, { field, kind, value });
  }

  _entityDescription() {
    if (this._explicitEntity) return `Using explicit entity: ${this._explicitEntity}`;
    if (this._context.entity_id) return `Using parent card entity: ${this._context.entity_id}`;
    return 'An entity is required. Select an entity below.';
  }

  _renderEntitySection() {
    return `<div class="section">
      <div class="section-head"><h3>Entity</h3></div>
      <div id="feature-entity-status" class="section-note" role="status">${escapeAttribute(this._entityDescription())}</div>
      ${this._context.entity_id || this._explicitEntity ? `<div class="toggle">
        <input id="feature-entity-override" type="checkbox" data-field="feature-entity-override"${this._explicitEntity || this._chooseEntity ? ' checked' : ''}>
        <label for="feature-entity-override">Use explicit entity</label>
      </div>` : ''}
      ${this._showEntityPicker ? `<div class="field-row">
        <label for="feature-entity">Entity override</label>
        ${renderEntitySourceInput('feature-entity-source', 'feature', this._explicitEntity)}
      </div>` : ''}
    </div>`;
  }

  _captureFocus() {
    const active = this.shadowRoot.activeElement;
    if (!active) return null;
    const selector = active.id ? `#${active.id}`
      : active.dataset.field ? `[data-field="${active.dataset.field}"]`
      : active.dataset.kind ? `[data-kind="${active.dataset.kind}"]` : null;
    return selector ? { selector, start: active.selectionStart, end: active.selectionEnd } : null;
  }

  _render() {
    const color = getBarColorValue(this._createSectionContext(), root);
    const signature = JSON.stringify([
      !!(this._context.entity_id || this._explicitEntity), this._showEntityPicker,
      !!customElements.get('ha-entity-picker'), !!color && !isHexColorValue(color),
    ]);
    // Keep active controls mounted through their native input/change sequence.
    const activeField = this.shadowRoot.activeElement?.dataset?.field;
    const defer = activeField === 'bar-color-text-fallback'
      || activeField === 'feature-entity-override' && !this._context.entity_id && !this._explicitEntity;
    if (signature !== this._structureSignature && !defer) {
      const focus = this._captureFocus();
      const context = this._createSectionContext();
      this.shadowRoot.innerHTML = `<style>${editorStyles}
        .inline-row { grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); }
        .section-note { overflow-wrap: anywhere; }
        ha-entity-picker { display: block; min-width: 0; max-width: 100%; }
      </style><div class="editor">
        ${this._renderEntitySection()}
        ${renderScaleSection(context, root)}
        ${renderBarAppearanceSection(context, root)}
        ${renderFormattingSection(context, root)}
      </div>`;
      this._structureSignature = signature;
      this._syncControls();
      const active = focus && this.shadowRoot.querySelector(focus.selector);
      active?.focus?.();
      if (active?.type === 'text' && focus.start != null) active.setSelectionRange?.(focus.start, focus.end);
    } else {
      this._syncControls();
    }
    this._configReplaced = false;
  }

  _syncControls() {
    const context = this._createSectionContext();
    const color = getBarColorValue(context, root);
    const values = {
      'scale-min': getFeatureScaleSource(this._config, 'min').fixed,
      'scale-max': getFeatureScaleSource(this._config, 'max').fixed,
      'bar-fill-style': getEffectiveFillStyleValue(context, root),
      'bar-color': getColorPickerValue(color, '#4a9eff'),
      'bar-color-text-fallback': color,
      'formatting-unit': getFormattingValue(context, root, 'unit'),
      'formatting-decimal': getFormattingValue(context, root, 'decimal'),
    };
    for (const [field, value] of Object.entries(values)) {
      const control = this.shadowRoot.querySelector(`[data-field="${field}"]`);
      if (control && (control !== this.shadowRoot.activeElement || this._configReplaced)) control.value = String(value);
      if (field === 'bar-color-text-fallback') control?.setAttribute('aria-label', 'Bar color (CSS value)');
    }
    const solid = this.shadowRoot.querySelector('#bar-solid-fill');
    if (solid) solid.checked = getBarSolidFillValue(context, root);
    const override = this.shadowRoot.querySelector('#feature-entity-override');
    if (override) override.checked = !!this._explicitEntity || this._chooseEntity;
    const status = this.shadowRoot.querySelector('#feature-entity-status');
    if (status) status.textContent = this._entityDescription();
    for (const [kind, value, label, id] of [
      ['feature-entity-source', this._explicitEntity, 'Entity override', 'feature-entity'],
      ['scale-min-entity-source', getFeatureScaleSource(this._config, 'min').entity, 'Min entity', 'feature-scale-min-entity'],
      ['scale-max-entity-source', getFeatureScaleSource(this._config, 'max').entity, 'Max entity', 'feature-scale-max-entity'],
    ]) {
      for (const tag of ['input', 'ha-entity-picker']) {
        for (const control of this.shadowRoot.querySelectorAll(`${tag}[data-kind="${kind}"]`)) {
          control.id = id;
          control.setAttribute('aria-label', label);
          if (kind === 'feature-entity-source') {
            control.setAttribute('aria-describedby', 'feature-entity-status');
            control.setAttribute('aria-required', this._effectiveEntity ? 'false' : 'true');
          }
          if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = value;
          if (tag === 'ha-entity-picker') {
            control.hass = this._hass;
            control.label = label;
            control.allowCustomEntity = true;
          }
        }
      }
    }
  }
}
