import {
  cloneDeep, serializeConfig, isObject, getPathValue, setPathValue, deletePathValue,
} from '../editor/shared/editor-config.js';
import {
  escapeAttribute, renderEntitySourceInput, getColorPickerValue, isHexColorValue,
} from '../editor/shared/editor-controls.js';
import { editorStyles } from '../editor/shared/editor-styles.js';
import { renderCardGroup, renderMarkersSection } from '../editor/shared/editor-disclosures.js';
import { renderScaleSection, handleScaleField } from '../editor/sections/scale.js';
import {
  renderFormattingSection, handleFormattingField, getFormattingValue,
} from '../editor/sections/formatting.js';
import {
  renderBarAppearanceSection, handleBarAppearanceField, getEffectiveFillStyleValue,
  getBarColorValue, getBarSolidFillValue,
  getBarAnimatedValue,
} from '../editor/sections/bar-appearance.js';
import { getFeatureScaleSource, patchFeatureScaleSource, getFeatureBaselineSource, patchFeatureBaselineSource, getFeatureTargetSource, patchFeatureTargetSource } from './feature-editor-config.js';

import { SegmentsSection } from '../editor/sections/segments.js';
import { GradientStopsSection } from '../editor/sections/gradient-stops.js';
import { createFeaturePaletteArray } from './feature-editor-palettes.js';

import { NeedleSection } from '../editor/sections/needle.js';
import { BaselineSection } from '../editor/sections/baseline.js';
import { TargetSection } from '../editor/sections/target.js';
import { ExtremaSection } from '../editor/sections/extrema.js';
import { ReferenceMarkersSection } from '../editor/sections/reference-markers.js';
import { getFeatureReferenceMarkerSource, patchFeatureReferenceMarkerSource, patchFeatureReferenceMarker } from './feature-editor-reference-markers.js';
import { patchFeatureExtremumField } from './feature-editor-extrema.js';
import { patchFeatureTargetField } from './feature-editor-target.js';
import { patchFeatureNeedle, patchFeatureBaselineField } from './feature-editor-needle-baseline.js';

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
    this._cssColorDrafts = new Map();
    this._expandedCardGroups = new Set();
    const context = this._createSectionContext();
    const options = { cssText: true, percentSources: true };
    this._needleSection = new NeedleSection(context, options);
    this._baselineSection = new BaselineSection(context, options);
    this._targetSection = new TargetSection(context, options);
    this._extremaSection = new ExtremaSection(context, options);
    const ui = {
      root: () => this.shadowRoot,
      render: () => { this._paletteRenderRequested = true; this._requestRender(); },
      focus: selector => { this._pendingPaletteFocus = selector; },
      hass: () => this._hass,
    };
    this._referenceMarkersSection = new ReferenceMarkersSection(context, { root: ui.root, render: () => this._requestRender() }, options);
    this._segmentsSection = new SegmentsSection(context, ui, createFeaturePaletteArray(context, 'segments'));
    this._gradientStopsSection = new GradientStopsSection(context, ui, createFeaturePaletteArray(context, 'gradient_stops'));
    for (const type of ['click', 'keydown']) this.shadowRoot.addEventListener(type, event => {
      if (type === 'click') {
        const target = event.target?.closest?.('[data-action]') ?? event.target;
        if (target?.dataset?.action === 'toggle-card-group') {
          this._toggleCardGroup(target.dataset.group);
          return;
        }
        if (this._baselineSection.handleClick(target) || this._targetSection.handleClick(target)) { this._requestRender(); return; }
        if (this._referenceMarkersSection.handleClick(target)) {
          if (target?.dataset?.action === 'add-generic-marker') {
            const markers = this._referenceMarkersSection._getGenericMarkers(root);
            this._pendingReferenceFocusId = this._referenceMarkersSection._getGenericMarkerUiIds(root, markers.length).at(-1);
          }
          this._requestRender();
          return;
        }
      }
      this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event);
    });
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
      this._paletteRenderRequested ||= ['bar.segments', 'bar.gradient_stops', 'segments', 'severity', 'gradient_stops']
        .some(path => serializeConfig(getPathValue(config, path.split('.'))) !== serializeConfig(getPathValue(this._config, path.split('.'))));
      this._config = cloneDeep(config);
      this._cssColorDrafts.clear();
      this._baselineSection.reset();
      this._targetSection.reset();
      this._referenceMarkersSection.reset();
      this._segmentsSection.reset();
      this._gradientStopsSection.reset();
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
      mutate: (_scope, mutation, options) => this._mutate(config => options?.referenceMarkerEdit ? patchFeatureReferenceMarker(config, options.referenceMarkerEdit) : options?.needleEdit
        ? patchFeatureNeedle(config, options.needleEdit)
        : options?.baselineEdit ? patchFeatureBaselineField(config, options.baselineEdit)
          : options?.targetEdit || options?.markerEdit?.key === 'target' ? patchFeatureTargetField(config, options.targetEdit ?? options.markerEdit)
            : options?.extremumEdit || ['peak', 'floor'].includes(options?.markerEdit?.key) ? patchFeatureExtremumField(config, options.extremumEdit ?? options.markerEdit) : mutation(config)),
      source: (_scope, key) => key?.type === 'reference-marker' ? getFeatureReferenceMarkerSource(key.marker) : key === 'baseline' ? getFeatureBaselineSource(this._config) : key === 'target' ? getFeatureTargetSource(this._config) : getFeatureScaleSource(this._config, key),
      setSource: (_scope, key, part, value) => this._mutate(config => key?.type === 'reference-marker' ? patchFeatureReferenceMarkerSource(config, key.index, part, value) : key === 'baseline' ? patchFeatureBaselineSource(config, part, value) : key === 'target' ? patchFeatureTargetSource(config, part, value) : patchFeatureScaleSource(config, key, part, value)),
    };
  }

  _mutate(mutation) {
    const next = mutation(this._config);
    if (serializeConfig(next) === serializeConfig(this._config)) return false;
    if (next.bar?.segments?.length !== this._config.bar?.segments?.length || next.segments?.length !== this._config.segments?.length || next.severity?.length !== this._config.severity?.length) {
      for (const key of this._cssColorDrafts.keys()) if (key.startsWith('segment-')) this._cssColorDrafts.delete(key);
    }
    this._config = next;
    this._requestRender();
    this.dispatchEvent(new CustomEvent('config-changed', {
      bubbles: true, composed: true, detail: { config: cloneDeep(next) },
    }));
    return true;
  }

  _handleField(event) {
    const target = event.target;
    // Replacing focused native controls can dispatch change from the old DOM.
    if (this._configReplaced || target?.isConnected === false) return;
    // Picker input/change events are internal; HA's value-changed is authoritative.
    if (target?.tagName === 'HA-ENTITY-PICKER' && event.type !== 'value-changed') return;
    const field = target?.dataset?.field?.replace(/-text-fallback$/, '');
    const kind = target?.dataset?.kind?.replace(/-text-fallback$/, '');
    const value = event.type === 'value-changed' ? event.detail?.value
      : target?.type === 'checkbox' ? target.checked : target?.value;
    if (target?.type === 'color') this._cssColorDrafts.delete(`${target.id}-text-fallback`);
    if (target?.dataset?.cssColor === 'true') {
      const valid = !value.trim() || CSS.supports('color', value);
      target.setCustomValidity?.(valid ? '' : 'Enter a valid CSS color.');
      target.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (valid) this._cssColorDrafts.delete(target.id); else this._cssColorDrafts.set(target.id, value);
      if (!valid && kind !== 'segment-draft-color') return;
    }
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
    if (kind?.startsWith('generic-marker-')) {
      const markerId = target.closest?.('.generic-marker-item')?.dataset?.markerUiId;
      const ids = this._referenceMarkersSection._getGenericMarkerUiIds(root, this._referenceMarkersSection._getGenericMarkers(root).length);
      // Native blur/change can fire during structural replacement or reorder.
      // Its old row index must never write into a different current raw item.
      if (markerId && markerId !== ids[Number(target.dataset.markerIndex)]) return;
    }
    if (this._referenceMarkersSection.handleField({ target, kind, value })) return;
    if (this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event)) { this._requestRender(); return; }
    if (this._needleSection.handleField({ field, kind, value }) || this._baselineSection.handleField({ field, kind, value }) || this._targetSection.handleField({ field, kind, value }) || this._extremaSection.handleField({ field, kind, value })) return;
    const context = this._createSectionContext();
    if (handleScaleField(context, { field, kind, value })) return;
    if (handleFormattingField(context, { field, kind, value })) return;
    handleBarAppearanceField(context, { field, kind, value }, { animation: true, cssText: true });
  }

  _entityDescription() {
    if (this._explicitEntity) return `Using explicit entity: ${this._explicitEntity}`;
    if (this._context.entity_id) return `Using parent card entity: ${this._context.entity_id}`;
    return 'An entity is required. Select an entity below.';
  }

  _renderEntitySection() {
    return `<div class="section">
      <div class="section-head"><h3>Entities</h3></div>
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

  _renderCardGroup(options) { return renderCardGroup(options, this._expandedCardGroups.has(options.group)); }

  _toggleCardGroup(group) {
    if (this._expandedCardGroups.has(group)) this._expandedCardGroups.delete(group);
    else this._expandedCardGroups.add(group);
    this._syncDisclosures();
  }

  _syncDisclosures() {
    const summaries = {
      'marker-target': this._targetSection._getCardTargetMarkerSummary(),
      'marker-peak': this._extremaSection._getMarkerResetSummary('peak'),
      'marker-floor': this._extremaSection._getMarkerResetSummary('floor'),
      'generic-markers': this._referenceMarkersSection._getGenericMarkersSummary(root),
      baseline: this._baselineSection._getCardBaselineSummary(),
      segments: this._segmentsSection._getSegmentsSummary(root),
      'gradient-stops': this._gradientStopsSection._getGradientStopsSummary(root),
    };
    for (const [group, summary] of Object.entries(summaries)) {
      const button = this.shadowRoot.querySelector(`#card-group-${group}`);
      const wrapper = button?.closest?.('.override-group');
      const expanded = this._expandedCardGroups.has(group);
      button?.setAttribute('aria-expanded', String(expanded));
      wrapper?.setAttribute('data-expanded', String(expanded));
      const title = this.shadowRoot.querySelector(`#card-group-${group}-title`);
      if (title?.textContent) title.textContent = `${expanded ? '▾' : '▸'} ${title.textContent.slice(2)}`;
      const label = this.shadowRoot.querySelector(`#card-group-${group}-summary`);
      if (label) label.textContent = summary;
      const body = wrapper?.querySelector('.override-group-body');
      if (body) body.style.display = expanded ? 'grid' : 'none';
    }
    for (const row of this.shadowRoot.querySelectorAll('.generic-marker-item')) {
      const expanded = this._referenceMarkersSection._expandedGenericMarkerUiIds.has(row.dataset.markerUiId);
      row.setAttribute('data-expanded', String(expanded));
      row.querySelector('.generic-marker-toggle').setAttribute('aria-expanded', String(expanded));
      row.querySelector('.generic-marker-body').style.display = expanded ? 'grid' : 'none';
    }
  }

  _captureFocus() {
    const active = this.shadowRoot.activeElement;
    if (!active) return null;
    const markerId = active.closest?.('.generic-marker-item')?.dataset?.markerUiId;
    const selector = active.id ? `#${active.id}`
      : active.dataset.field ? `[data-field="${active.dataset.field}"]`
      : active.dataset.kind ? `[data-kind="${active.dataset.kind}"]`
      : markerId && active.dataset.action ? `.generic-marker-item[data-marker-ui-id="${markerId}"] [data-action="${active.dataset.action}"]` : active.dataset.action ? `[data-action="${active.dataset.action}"]` : null;
    const item = active.dataset.segmentIndex ?? active.dataset.stopIndex ?? active.dataset.index;
    const rowSelector = selector && active.dataset.kind && item !== undefined
      ? `${selector}[data-${active.dataset.segmentIndex !== undefined ? 'segment-index' : active.dataset.stopIndex !== undefined ? 'stop-index' : 'index'}="${item}"]` : selector;
    return rowSelector ? { selector: rowSelector, start: active.selectionStart, end: active.selectionEnd } : null;
  }

  _render() {
    const fillStyle = getEffectiveFillStyleValue(this._createSectionContext(), root);
    const segmentRows = this._segmentsSection._getScopedSegmentsValue(root);
    const gradientRows = this._gradientStopsSection._getScopedGradientStopsValue(root);
    const markers = this._referenceMarkersSection._getGenericMarkers(root);
    const markerIds = this._referenceMarkersSection._getGenericMarkerUiIds(root, markers.length);
    const signature = JSON.stringify([
      !!(this._context.entity_id || this._explicitEntity), this._showEntityPicker,
      ...markers.map((marker, i) => [markerIds[i], this._referenceMarkersSection._getGenericMarkerSource(marker).mode]),
      fillStyle, segmentRows.length, gradientRows.length,
      !isHexColorValue(this._gradientStopsSection._getGradientStopsDraftState(root).color),
      ...gradientRows.map(row => !isHexColorValue(row.color)),
      !!customElements.get('ha-entity-picker'),
    ]);
    // Keep active controls mounted through their native input/change sequence.
    const activeField = this.shadowRoot.activeElement?.dataset?.field;
    const activeKind = this.shadowRoot.activeElement?.dataset?.kind;
    const defer = activeKind?.endsWith('-text-fallback') || activeField?.endsWith('-text-fallback')
      || activeField === 'feature-entity-override' && !this._context.entity_id && !this._explicitEntity;
    if ((signature !== this._structureSignature || this._paletteRenderRequested) && !defer) {
      const focus = this._captureFocus();
      const context = this._createSectionContext();
      this.shadowRoot.innerHTML = `<style>${editorStyles}
        :host { container-type: inline-size; }
        .list-row.gradient-stop-row .field-grid { grid-template-columns: minmax(0, 1fr); }
        .list-row.segment-row > .field-grid { grid-template-columns: minmax(0, 1fr); }
        @container (max-width: 320px) {
          .list-row.segment-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .list-row.gradient-stop-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .generic-marker-header { flex-wrap: wrap; }
          .generic-marker-toggle { flex-basis: 100%; }
          .generic-marker-actions { width: 100%; }
          .generic-marker-actions button { flex: 1 1 auto; }
          .generic-marker-pair, .generic-marker-options { grid-template-columns: minmax(0, 1fr); }
          .list-row.segment-row > button, .list-row.gradient-stop-row > button {
            grid-column: 1 / -1; width: 100%;
          }
        }
        .inline-row { grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); }
        .section-note { overflow-wrap: anywhere; }
        ha-entity-picker { display: block; min-width: 0; max-width: 100%; }
      </style><div class="editor">
        ${this._renderEntitySection()}
        ${renderScaleSection(context, root)}
        ${renderMarkersSection({
          renderGroup: options => this._renderCardGroup(options),
          target: { summary: this._targetSection._getCardTargetMarkerSummary(), content: this._targetSection.render(root) },
          peak: { summary: this._extremaSection._getMarkerResetSummary('peak'), content: this._extremaSection.render(root, 'peak') },
          floor: { summary: this._extremaSection._getMarkerResetSummary('floor'), content: this._extremaSection.render(root, 'floor') },
          references: { summary: this._referenceMarkersSection._getGenericMarkersSummary(root), content: this._referenceMarkersSection.render(root) },
        })}
        ${renderBarAppearanceSection(context, root, () => `${this._baselineSection.render(root, options => this._renderCardGroup(options))}${this._needleSection.render(root)}`, { animation: true, cssText: true })}
        ${this._segmentsSection.render(root, options => this._renderCardGroup(options))}
        ${this._gradientStopsSection.render(root, options => this._renderCardGroup(options))}
        ${renderFormattingSection(context, root)}
      </div>`;
      this._structureSignature = signature;
      this._paletteRenderRequested = false;
      this._syncControls();
      const active = focus && this.shadowRoot.querySelector(focus.selector);
      active?.focus?.({ preventScroll: true });
      if (active?.type === 'text' && focus.start != null) active.setSelectionRange?.(focus.start, focus.end);
    } else {
      this._syncControls();
    }
    if (this._pendingPaletteFocus) {
      this.shadowRoot.querySelector(this._pendingPaletteFocus)?.focus?.({ preventScroll: true });
      this._pendingPaletteFocus = null;
    }
    if (this._pendingReferenceFocusId) {
      const heading = this.shadowRoot.querySelector(`.generic-marker-item[data-marker-ui-id="${this._pendingReferenceFocusId}"] .generic-marker-toggle`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      this._pendingReferenceFocusId = null;
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
      'bar-needle-mode': this._needleSection._getScopedNeedleConfig(root).mode,
      'bar-needle-color': getColorPickerValue(this._needleSection._getScopedNeedleConfig(root).color, '#ffffff'),
      'bar-needle-color-text-fallback': this._needleSection._getScopedNeedleConfig(root).color,
      'baseline-mode': this._baselineSection._getBaselineMode(root),
      'baseline-value': getFeatureBaselineSource(this._config).fixed,
      'baseline-source-mode': this._baselineSection._getSourceMode(),
      'baseline-percent': this._baselineSection._percentageDraft ?? getFeatureBaselineSource(this._config).percent ?? '',
      'baseline-above-color': getColorPickerValue(this._baselineSection._getBaselineDirectionalColorValue(root, 'above'), '#000000'),
      'baseline-above-color-text-fallback': this._baselineSection._getBaselineDirectionalColorValue(root, 'above'),
      'baseline-below-color': getColorPickerValue(this._baselineSection._getBaselineDirectionalColorValue(root, 'below'), '#000000'),
      'baseline-below-color-text-fallback': this._baselineSection._getBaselineDirectionalColorValue(root, 'below'),
      'target-mode': this._targetSection._getTargetMode(root),
      'target-value': getFeatureTargetSource(this._config).fixed,
      'target-source-mode': this._targetSection._getSourceMode(),
      'target-percent': this._targetSection._percentageDraft ?? getFeatureTargetSource(this._config).percent ?? '',
      'target-shape': this._targetSection._getEffectiveTargetShapeValue(root),
      'target-direction': this._targetSection._getEffectiveMarkerDirection(root, 'target'),
      'target-color': getColorPickerValue(this._targetSection._getTargetColorValue(root), '#888'),
      'target-color-text-fallback': this._targetSection._getTargetColorValue(root),
      'target-above-fill-color': getColorPickerValue(this._targetSection._getTargetAboveFillColorValue(root), '#000000'),
      'target-above-fill-color-text-fallback': this._targetSection._getTargetAboveFillColorValue(root),
      'target-label-text': this._targetSection._getBuiltinMarkerLabelOptions(root, 'target').text,
      'target-label-precision': this._targetSection._getBuiltinMarkerLabelOptions(root, 'target').precision,
      'formatting-unit': getFormattingValue(context, root, 'unit'),
      'formatting-decimal': getFormattingValue(context, root, 'decimal'),
    };
    for (const key of ['peak', 'floor']) {
      const marker = this._extremaSection._getMarkerConfig(root, key);
      const label = this._extremaSection._getBuiltinMarkerLabelOptions(root, key);
      Object.assign(values, {
        [`${key}-color`]: getColorPickerValue(marker.color, '#888888'),
        [`${key}-color-text-fallback`]: marker.color,
        [`${key}-reset`]: this._extremaSection._getEffectiveMarkerExtras(root, key).reset,
        [`${key}-direction`]: this._extremaSection._getEffectiveMarkerDirection(root, key),
        [`${key}-label-text`]: label.text,
        [`${key}-label-precision`]: label.precision,
      });
      for (const [suffix, checked] of [['show', marker.mode === 'enabled'], ['label-show', label.show],
        ['label-show-value', label.showValue], ['label-show-unit', label.showUnit]]) {
        const control = this.shadowRoot.querySelector(`#${key}-${suffix}`);
        if (control) control.checked = checked;
      }
    }
    for (const [field, value] of Object.entries(values)) {
      const control = this.shadowRoot.querySelector(`[data-field="${field}"]`);
      if (control && (control !== this.shadowRoot.activeElement || this._configReplaced)) control.value = String(value);
      if (field === 'bar-color-text-fallback') control?.setAttribute('aria-label', 'Bar color (CSS value)');
    }
    for (const section of [this._segmentsSection, this._gradientStopsSection]) {
      const segment = section === this._segmentsSection;
      const rows = segment ? section._getScopedSegmentsValue(root) : section._getScopedGradientStopsValue(root);
      for (const field of segment ? ['from', 'to', 'color', 'color-text-fallback'] : ['pos', 'color']) {
        for (const control of this.shadowRoot.querySelectorAll(`input[data-kind="${segment ? 'segment' : 'gradient'}-${field}"]`)) {
          const index = Number(control.dataset.index), row = rows[index];
          const value = segment && !field.startsWith('color') ? section._getSegmentBoundaryText(root, index, field, row?.[field])
            : !segment && field === 'pos' ? section._getGradientStopPosText(root, index, row?.pos ?? '') : row?.color;
          if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = segment && control.type === 'color' ? getColorPickerValue(value, '#4a9eff') : value ?? '';
        }
      }
      if (segment || this._configReplaced) {
        const draft = segment ? section._getSegmentDraftState(root) : section._getGradientStopsDraftState(root);
        for (const field of Object.keys(draft)) for (const suffix of ['', '-text-fallback']) for (const control of this.shadowRoot.querySelectorAll(`input[data-kind="${segment ? 'segment' : 'gradient'}-draft-${field}${suffix}"]`)) {
          if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = field === 'color' && control.type === 'color' ? getColorPickerValue(draft[field], '#4CAF50') : draft[field];
        }
      }
      if (segment) section._refreshSegmentUi(root);
      // Refreshing gradient hints in the lightweight unit DOM intentionally uses
      // structural render in standalone; avoid an endless host render loop here.
      else if (this.shadowRoot.querySelector('#gradient-draft-pos')?.closest) section._refreshGradientDraftUi(root);
    }
    for (const direction of ['above', 'below']) {
      const control = this.shadowRoot.querySelector(`#baseline-${direction}-color-enabled`);
      if (control) control.checked = this._baselineSection._isBaselineDirectionalColorEnabled(root, direction);
    }
    this._referenceMarkersSection.syncControls(this._hass, this._configReplaced);
    const targetLabel = this._targetSection._getBuiltinMarkerLabelOptions(root, 'target');
    for (const [id, checked] of [['target-label-show', targetLabel.show], ['target-label-show-value', targetLabel.showValue],
      ['target-label-show-unit', targetLabel.showUnit], ['target-above-fill-enabled', this._targetSection._isTargetAboveFillEnabled(root)]]) {
      const control = this.shadowRoot.querySelector(`#${id}`);
      if (control) control.checked = checked;
    }
    const solid = this.shadowRoot.querySelector('#bar-solid-fill');
    if (solid) solid.checked = getBarSolidFillValue(context, root);
    const animated = this.shadowRoot.querySelector('#bar-animated');
    if (animated) animated.checked = getBarAnimatedValue(context, root);
    const override = this.shadowRoot.querySelector('#feature-entity-override');
    if (override) override.checked = !!this._explicitEntity || this._chooseEntity;
    const status = this.shadowRoot.querySelector('#feature-entity-status');
    if (status) status.textContent = this._entityDescription();
    for (const [kind, value, label, id] of [
      ['feature-entity-source', this._explicitEntity, 'Entity override', 'feature-entity'],
      ['scale-min-entity-source', getFeatureScaleSource(this._config, 'min').entity, 'Min entity', 'feature-scale-min-entity'],
      ['baseline-entity-source', getFeatureBaselineSource(this._config).entity, 'Baseline entity', 'feature-baseline-entity'],
      ['target-entity-source', getFeatureTargetSource(this._config).entity, 'Target entity', 'feature-target-entity'],
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
    this._syncDisclosures();
    for (const control of this.shadowRoot.querySelectorAll('input[data-css-color="true"]')) {
      const draft = this._cssColorDrafts.get(control.id);
      if (draft !== undefined) control.value = draft;
      control.setAttribute('aria-invalid', draft === undefined ? 'false' : 'true');
      control.setCustomValidity?.(draft === undefined ? '' : 'Enter a valid CSS color.');
      const inputLabel = this.shadowRoot.querySelector(`#${control.id.replace(/-text-fallback$/, '')}`)?.labels?.[0]?.textContent;
      if (inputLabel) control.setAttribute('aria-label', `${inputLabel} (CSS value)`);
    }
  }
}
