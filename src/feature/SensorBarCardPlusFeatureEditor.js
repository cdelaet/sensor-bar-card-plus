import {
  cloneDeep, serializeConfig, isObject, getPathValue, setPathValue, deletePathValue,
} from '../editor/shared/editor-config.js';
import {
  escapeAttribute, formatScaleValueInput, renderEntitySourceInput, renderEntityAttributeInput, renderWindowOptions, getEntityAttributeSuggestions, getColorPickerValue,
  isValidCssColor, syncColorInput, syncCssColorDrafts,
} from '../editor/shared/editor-controls.js';
import { editorStyles } from '../editor/shared/editor-styles.js';
import { renderCardGroup, renderMarkersSection } from '../editor/shared/editor-disclosures.js';
import { NumericInputDrafts } from '../editor/shared/editor-numeric-drafts.js';
import { renderScaleSection, handleScaleField } from '../editor/sections/scale.js';
import { getDirectionSelection } from '../editor/shared/direction-control.js';
import {
  renderFormattingSection, handleFormattingField, getFormattingValue,
} from '../editor/sections/formatting.js';
import {
  renderBarAppearanceSection, handleBarAppearanceField,
  getBarAnimatedValue, syncBarPaintEditor,
} from '../editor/sections/bar-appearance.js';
import { getFeatureScaleSource, patchFeatureScaleSource, getFeatureBaselineSource, patchFeatureBaselineSource, getFeatureTargetSource, patchFeatureTargetSource } from './feature-editor-config.js';

import { SegmentsSection } from '../editor/sections/segments.js';
import { GradientStopsSection } from '../editor/sections/gradient-stops.js';
import { createFeaturePaletteArray } from './feature-editor-palettes.js';
import { BAR_PAINT, BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT } from '../view-model/paint-destinations.js';
import { handlePaintAction, handlePaintPresetControl, handlePaintPropertyControl, paintSourceSignature } from '../editor/shared/paint-destination.js';

import { NeedleSection } from '../editor/sections/needle.js';
import { BaselineSection } from '../editor/sections/baseline.js';
import { TargetSection } from '../editor/sections/target.js';
import { ExtremaSection, migrateExtremaConfig } from '../editor/sections/extrema.js';
import { ReferenceMarkersSection } from '../editor/sections/reference-markers.js';
import { getFeatureReferenceMarkerSource, patchFeatureReferenceMarkerSource, patchFeatureReferenceMarkerLabelSource, patchFeatureReferenceMarker } from './feature-editor-reference-markers.js';
import { patchFeatureExtremumField } from './feature-editor-extrema.js';
import { patchFeatureTargetField } from './feature-editor-target.js';
import { patchFeatureNeedle, patchFeatureBaselineField } from './feature-editor-needle-baseline.js';
import { dashboardPathFromLocation, subscribeDashboardPaintPresets } from '../dashboard/paint-preset-registry.js';

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
    this._paintPresetHandle = null;
    this._paintPresetSubscriptionGeneration = 0;
    this._paintPresetRegistry = { status: 'loading', presets: {} };
    this._cssColorDrafts = new Map();
    this._numericDrafts = new NumericInputDrafts();
    this._expandedCardGroups = new Set();
    const context = this._createSectionContext();
    this._needleSection = new NeedleSection(context);
    this._baselineSection = new BaselineSection(context);
    this._targetSection = new TargetSection(context);
    this._extremaSection = new ExtremaSection(context);
    const ui = {
      root: () => this.shadowRoot,
      isRendering: () => this._isRendering,
      render: () => this._requestRender(),
      focus: (selector, _scope, options) => this._focusPaletteControl(selector, options),
      hass: () => this._hass,
    };
    this._referenceMarkersSection = new ReferenceMarkersSection(context, { root: ui.root, render: () => this._requestRender() });
    customElements.whenDefined('ha-entity-attribute-picker').then(() => {
      if (this.isConnected && this.shadowRoot.querySelector('input[data-kind$="-attribute"]')) this._requestRender();
    });
    const paletteUi = { ...ui,
      root: () => this.shadowRoot?.querySelector('#card-paint-editor'),
      focus: (selector, _scope, options) => this._focusPaletteControl(`#card-paint-editor ${selector}`, options),
    };
    this._segmentsSection = new SegmentsSection(context, paletteUi, createFeaturePaletteArray(context, 'segments'));
    this._gradientStopsSection = new GradientStopsSection(context, paletteUi, createFeaturePaletteArray(context, 'gradient_stops'));
    this._baselinePaintSections = {};
    for (const direction of ['above', 'below']) {
      const destination = BASELINE_PAINTS.find(item => item.id === `baseline-${direction}`);
      const rootSelector = scope => `#${scope?.type === 'entity' ? `entity-${scope.index}-` : ''}baseline-${direction}-paint-editor`;
      const ui = { ...paletteUi,
        root: scope => this.shadowRoot?.querySelector(rootSelector(scope)),
        focus: (selector, scope, focusOptions) => this._focusPaletteControl(`${rootSelector(scope)} ${selector}`, focusOptions),
      };
      this._baselinePaintSections[direction] = {
        segments: new SegmentsSection(context, ui, createFeaturePaletteArray(context, 'segments', destination)),
        gradientStops: new GradientStopsSection(context, ui, createFeaturePaletteArray(context, 'gradient_stops', destination)),
      };
    }
    const targetUi = { ...paletteUi, root: () => this.shadowRoot?.querySelector('#target-above-paint-editor'),
      focus: (selector, _scope, options) => this._focusPaletteControl(`#target-above-paint-editor ${selector}`, options) };
    this._targetPaintSections = {
      segments: new SegmentsSection(context, targetUi, createFeaturePaletteArray(context, 'segments', TARGET_ABOVE_PAINT)),
      gradientStops: new GradientStopsSection(context, targetUi, createFeaturePaletteArray(context, 'gradient_stops', TARGET_ABOVE_PAINT)),
    };
    const targetBelowUi = { ...paletteUi, root: scope => this.shadowRoot?.querySelector(`#${scope?.type === 'entity' ? `entity-${scope.index}-` : ''}target-below-paint-editor`),
      focus: (selector, scope, options) => this._focusPaletteControl(`#${scope?.type === 'entity' ? `entity-${scope.index}-` : ''}target-below-paint-editor ${selector}`, options) };
    this._targetBelowPaintSections = {
      segments: new SegmentsSection(context, targetBelowUi, createFeaturePaletteArray(context, 'segments', TARGET_BELOW_PAINT)),
      gradientStops: new GradientStopsSection(context, targetBelowUi, createFeaturePaletteArray(context, 'gradient_stops', TARGET_BELOW_PAINT)),
    };
    for (const type of ['click', 'keydown']) this.shadowRoot.addEventListener(type, event => {
      if (type === 'click') {
        const target = event.target?.closest?.('[data-action]') ?? event.target;
        if (handlePaintAction(this._createSectionContext(), target)) return;
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
      this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event)
        || this._handleBaselinePaletteEvent(event) || this._handleTargetPaletteEvent(event);
    });
    const handleField = event => {
      if (event._sbcpEntityPickerHandled || event.target?.tagName === 'HA-ENTITY-PICKER') return;
      this._handleField(event);
    };
    for (const type of ['input', 'change', 'value-changed']) this.shadowRoot.addEventListener(type, handleField);
    this.shadowRoot.addEventListener('focusout', event => {
      // Only editable controls can defer reconciliation until blur. Refreshing
      // after a button loses focus can move WebKit's pending click target.
      const kind = event.target?.dataset?.kind ?? '';
      const targetSource = /^(?:target-(?:above-|below-)?entity-source|entity-target-(?:above-|below-)?entity-source)$/.test(kind);
      if (!targetSource && event.target?.matches?.('input, select, ha-entity-picker, ha-entity-attribute-picker')) this._requestRender();
    });
    // HA may load its picker after the editor. No polling or global observers.
    customElements.whenDefined('ha-entity-picker').then(() => {
      if (this.isConnected) this._requestRender();
    });
  }

  setConfig(config) {
    if (!isObject(config)) throw new Error('Invalid Sensor Bar Card Plus feature configuration');
    const changed = serializeConfig(config) !== serializeConfig(this._config);
    const migrated = migrateExtremaConfig(config);
    if (migrated) {
      this.setConfig(migrated);
      const signature = serializeConfig(migrated);
      Promise.resolve().then(() => {
        if (serializeConfig(this._config) !== signature || this._lastMigrationSignature === signature) return;
        this._lastMigrationSignature = signature;
        this.dispatchEvent(new CustomEvent('config-changed', {
          bubbles: true, composed: true, detail: { config: cloneDeep(this._config) },
        }));
      });
      return;
    }
    if (changed) {
      for (const destination of [BAR_PAINT, ...BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT]) {
        const sections = destination === BAR_PAINT ? { segments: this._segmentsSection, gradientStops: this._gradientStopsSection }
          : destination === TARGET_ABOVE_PAINT ? this._targetPaintSections : destination === TARGET_BELOW_PAINT ? this._targetBelowPaintSections : this._baselinePaintSections[destination.id.replace('baseline-', '')];
        const changed = paintSourceSignature(config, destination) !== paintSourceSignature(this._config, destination);
        for (const section of [sections.segments, sections.gradientStops]) {
          if (changed) section.clearScopeState(root); else section.prepareExternalSync(root);
        }
      }
      this._lastMigrationSignature = null;
      this._config = cloneDeep(config);
      this._cssColorDrafts.clear();
      this._numericDrafts.reset();
      this._referenceMarkersSection.reset();
      this._chooseEntity = false;
      this._configReplaced = true;
    }
    this._syncPaintPresetRegistry();
    if (changed || !this.shadowRoot?.innerHTML) this._requestRender();
  }

  set hass(value) { this._hass = value; this._syncPaintPresetRegistry(); this._requestRender(); }
  get hass() { return this._hass; }
  set context(value) { this._context = value ?? {}; this._syncPaintPresetRegistry(); this._requestRender(); }
  get context() { return this._context; }
  get updateComplete() { return this._updateComplete; }
  get _explicitEntity() { return typeof this._config.entity === 'string' ? this._config.entity.trim() : ''; }
  get _effectiveEntity() { return this._explicitEntity || this._context.entity_id || ''; }
  get _showEntityPicker() { return !!this._explicitEntity || this._chooseEntity || !this._context.entity_id; }

  connectedCallback() { this._syncPaintPresetRegistry(); this._requestRender(); }
  disconnectedCallback() {
    this._renderEpoch += 1; this._renderScheduled = false;
    this._paintPresetSubscriptionGeneration += 1;
    this._paintPresetHandle?.unsubscribe();
    this._paintPresetHandle = null;
    this._paintPresetRegistry = { status: 'loading', presets: {} };
  }

  _syncPaintPresetRegistry() {
    if (!this.isConnected || !this._hass?.connection) {
      if (this._paintPresetHandle) {
        this._paintPresetSubscriptionGeneration += 1;
        this._paintPresetHandle.unsubscribe();
        this._paintPresetHandle = null;
      }
      this._paintPresetRegistry = this._hass?.connection
        ? { status: 'loading', presets: {} }
        : { status: 'empty', presets: {}, diagnostic: { code: 'connection_unavailable' } };
      return;
    }
    const path = dashboardPathFromLocation();
    if (!this._paintPresetHandle) {
      const generation = ++this._paintPresetSubscriptionGeneration;
      this._paintPresetHandle = subscribeDashboardPaintPresets(this._hass, path, snapshot => {
        if (generation !== this._paintPresetSubscriptionGeneration || snapshot === this._paintPresetRegistry) return;
        this._paintPresetRegistry = snapshot;
        if (this.shadowRoot?.innerHTML) this._syncControls();
        else this._requestRender();
      });
      this._paintPresetRegistry = this._paintPresetHandle.getSnapshot();
      if (this.shadowRoot?.innerHTML) this._syncControls();
      return;
    }
    this._paintPresetHandle.update(this._hass, path);
  }

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
    const editor = this;
    const context = {
      read: (_scope, path) => getPathValue(this._config, path),
      mutate: (_scope, mutation, options) => this._mutate(config => options?.referenceMarkerEdit ? patchFeatureReferenceMarker(config, options.referenceMarkerEdit) : options?.needleEdit
        ? patchFeatureNeedle(config, options.needleEdit)
        : options?.baselineEdit ? patchFeatureBaselineField(config, options.baselineEdit)
          : options?.targetEdit || options?.markerEdit?.key === 'target' ? patchFeatureTargetField(config, options.targetEdit ?? options.markerEdit)
            : options?.extremumEdit || ['peak', 'floor'].includes(options?.markerEdit?.key) ? patchFeatureExtremumField(config, options.extremumEdit ?? options.markerEdit) : mutation(config), options),
      source: (_scope, key) => key?.type === 'reference-marker' ? getFeatureReferenceMarkerSource(key.marker) : key === 'baseline' ? getFeatureBaselineSource(this._config) : key === 'target' ? getFeatureTargetSource(this._config) : getFeatureScaleSource(this._config, key),
      setSource: (_scope, key, part, value) => this._mutate(config => key?.type === 'reference-marker' ? patchFeatureReferenceMarkerSource(config, key.index, part, value) : key?.type === 'reference-marker-label' ? patchFeatureReferenceMarkerLabelSource(config, key.index, part, value) : key === 'baseline' ? patchFeatureBaselineSource(config, part, value) : key === 'target' ? patchFeatureTargetSource(config, part, value) : patchFeatureScaleSource(config, key, part, value), key === 'target' ? { syncTargetControls: true } : {}),
    };
    Object.defineProperty(context, 'clearPaintPaletteState', {
      configurable: true,
      value: (scope, destination = BAR_PAINT, property) => {
        const sections = destination === BAR_PAINT ? { segments: this._segmentsSection, gradientStops: this._gradientStopsSection }
          : destination === TARGET_ABOVE_PAINT ? this._targetPaintSections : destination === TARGET_BELOW_PAINT ? this._targetBelowPaintSections : this._baselinePaintSections[destination.id.replace('baseline-', '')];
        if (!property || property === 'segments') sections?.segments.clearScopeState(scope);
        if (!property || property === 'gradient_stops') sections?.gradientStops.clearScopeState(scope);
      },
      writable: true,
    });
    Object.defineProperty(context, 'hass', { get: () => editor._hass });
    Object.defineProperty(context, 'paintPresetRegistry', { get: () => editor._paintPresetRegistry });
    return context;
  }

  _mutate(mutation, options = {}) {
    const next = mutation(this._config);
    if (serializeConfig(next) === serializeConfig(this._config)) return false;
    if (next.bar?.segments?.length !== this._config.bar?.segments?.length || next.segments?.length !== this._config.segments?.length || next.severity?.length !== this._config.severity?.length) {
      for (const key of this._cssColorDrafts.keys()) if (key.startsWith('segment-')) this._cssColorDrafts.delete(key);
    }
    this._config = next;
    this._forceTargetSync = options.forceTargetSyncScope?.type === 'card';
    if (options.syncTargetControls) this._syncTargetControls();
    else this._requestRender();
    this.dispatchEvent(new CustomEvent('config-changed', {
      bubbles: true, composed: true, detail: { config: cloneDeep(next) },
    }));
    return true;
  }

  _handleField(event) {
    const target = event.target;
    // Replacing focused native controls can dispatch change from the old DOM.
    if (this._configReplaced || target?.isConnected === false) return;
    if (event.type === 'input' && target?.type === 'checkbox' && (target.dataset.paintProperty || target.dataset.paintEnabled)) return;
    // Picker input/change events are internal; HA's value-changed is authoritative.
    if (['HA-ENTITY-PICKER', 'HA-ENTITY-ATTRIBUTE-PICKER'].includes(target?.tagName) && event.type !== 'value-changed') return;
    if (this._numericDrafts.handle(event, this._isRendering)) return;
    const field = target?.dataset?.field?.replace(/-text-fallback$/, '');
    const kind = target?.dataset?.kind?.replace(/-text-fallback$/, '');
    const value = event.type === 'value-changed' ? event.detail?.value
      : target?.type === 'checkbox' ? target.checked : target?.value;
    if (target?.type === 'color') this._cssColorDrafts.delete(`${target.id}-text-fallback`);
    if (target?.dataset?.cssColor === 'true') {
      const valid = isValidCssColor(value, target.ownerDocument?.defaultView?.CSS);
      target.setCustomValidity?.(valid ? '' : 'Enter a valid CSS color.');
      target.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (valid) this._cssColorDrafts.delete(target.id); else this._cssColorDrafts.set(target.id, value);
      if (!valid && !kind?.endsWith('-draft-color')) return;
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
    if (kind === 'feature-attribute') {
      this._mutate(config => {
        const attribute = typeof value === 'string' ? value.trim() : '';
        return attribute ? setPathValue(config, ['attribute'], attribute) : deletePathValue(config, ['attribute']);
      });
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
    if (this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event)
      || this._handleBaselinePaletteEvent(event) || this._handleTargetPaletteEvent(event)) {
      if (event.type !== 'input') this._requestRender();
      return;
    }
    if (handlePaintPresetControl(this._createSectionContext(), target, value)) return;
    if (handlePaintPropertyControl(this._createSectionContext(), target, value)) return;
    if (this._needleSection.handleField({ field, kind, value }) || this._baselineSection.handleField({ field, kind, value }) || this._targetSection.handleField({ field, kind, value }) || this._extremaSection.handleField({ field, kind, value })) return;
    const context = this._createSectionContext();
    if (handleScaleField(context, { field, kind, value })) return;
    if (handleFormattingField(context, { field, kind, value })) return;
    handleBarAppearanceField(context, { field, kind, value }, { animation: true });
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
      ${this._effectiveEntity ? `<div class="field-row">
        <label>Attribute</label>
        ${renderEntityAttributeInput('feature-attribute', null, this._config.attribute, this._effectiveEntity, this._hass).replace('data-kind="feature-attribute"', 'id="feature-attribute" data-kind="feature-attribute"')}
      </div>` : ''}
      <div class="field-row">
        <label for="formatting-unit">Unit</label>
        <input id="formatting-unit" type="text" data-field="formatting-unit" value="${escapeAttribute(getFormattingValue(this._createSectionContext(), root, 'unit'))}">
      </div>
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
      'target-above-segments': this._targetPaintSections.segments._getSegmentsSummary(root),
      'target-above-gradient-stops': this._targetPaintSections.gradientStops._getGradientStopsSummary(root),
      'target-below-segments': this._targetBelowPaintSections.segments._getSegmentsSummary(root),
      'target-below-gradient-stops': this._targetBelowPaintSections.gradientStops._getGradientStopsSummary(root),
      'marker-target': this._targetSection._getCardTargetMarkerSummary(),
      'marker-peak': this._extremaSection._getMarkerResetSummary('peak'),
      'marker-floor': this._extremaSection._getMarkerResetSummary('floor'),
      'generic-markers': this._referenceMarkersSection._getGenericMarkersSummary(root),
      baseline: this._baselineSection._getCardBaselineSummary(),
      segments: this._segmentsSection._getSegmentsSummary(root),
      'gradient-stops': this._gradientStopsSection._getGradientStopsSummary(root),
    };
    for (const direction of ['above', 'below']) {
      summaries[`baseline-${direction}-segments`] = this._baselinePaintSections[direction].segments._getSegmentsSummary(root);
      summaries[`baseline-${direction}-gradient-stops`] = this._baselinePaintSections[direction].gradientStops._getGradientStopsSummary(root);
    }
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

  _focusPaletteControl(selector, { immediate = false } = {}) {
    if (immediate) this.shadowRoot?.querySelector(selector)?.focus?.({ preventScroll: true });
    else this._pendingPaletteFocus = selector;
  }

  _render() {
    const segmentRows = this._segmentsSection._getScopedSegmentsValue(root);
    const gradientRows = this._gradientStopsSection._getScopedGradientStopsValue(root);
    const markers = this._referenceMarkersSection._getGenericMarkers(root);
    const markerIds = this._referenceMarkersSection._getGenericMarkerUiIds(root, markers.length);
    const markerSignature = JSON.stringify(markers.map((marker, index) => [markerIds[index], this._referenceMarkersSection._getGenericMarkerSource(marker, root, index).mode]));
    const signature = JSON.stringify([
      !!(this._context.entity_id || this._explicitEntity), this._showEntityPicker,
      !!getFeatureScaleSource(this._config, 'min').entity, !!getFeatureScaleSource(this._config, 'max').entity,
      !!getFeatureBaselineSource(this._config).entity,
      !!customElements.get('ha-entity-picker'), !!customElements.get('ha-entity-attribute-picker'),
    ]);
    // Keep active controls mounted through their native input/change sequence.
    const activeField = this.shadowRoot.activeElement?.dataset?.field;
    const activeKind = this.shadowRoot.activeElement?.dataset?.kind;
    const defer = activeKind?.endsWith('-text-fallback') || activeField?.endsWith('-text-fallback')
      || activeField === 'feature-entity-override' && !this._context.entity_id && !this._explicitEntity
      || this.shadowRoot.activeElement?.validity?.badInput && this._numericDrafts.captureFocus(this.shadowRoot);
    let replaceReferences = false;
    if (markerSignature !== this._referenceStructureSignature && !defer) {
      this._isRendering = true;
      try { replaceReferences = !this._referenceMarkersSection.syncStructure(root); }
      finally { this._isRendering = false; }
    }
    if ((signature !== this._structureSignature || replaceReferences) && !defer) {
      const focus = this._captureFocus();
      const context = this._createSectionContext();
      this._isRendering = true;
      try {
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
          target: { summary: this._targetSection._getCardTargetMarkerSummary(), content: this._targetSection.render(root, this._targetRenderOptions(root)) },
          peak: { summary: this._extremaSection._getMarkerResetSummary('peak'), content: this._extremaSection.render(root, 'peak') },
          floor: { summary: this._extremaSection._getMarkerResetSummary('floor'), content: this._extremaSection.render(root, 'floor') },
          references: { summary: this._referenceMarkersSection._getGenericMarkersSummary(root), content: this._referenceMarkersSection.render(root) },
        })}
        ${renderBarAppearanceSection(context, root, () => `${this._baselineSection.render(root, options => this._renderCardGroup(options), {
          root: this.shadowRoot, registry: this._paintPresetRegistry,
          paletteValues: (paintScope, direction) => ({ segments: this._baselinePaintSections[direction].segments._getScopedSegmentsValue(paintScope),
            gradient_stops: this._baselinePaintSections[direction].gradientStops._getScopedGradientStopsValue(paintScope) }),
          paintChildren: (paintScope, direction) => this._renderBaselinePaintPalette(paintScope, direction),
        })}${this._needleSection.render(root)}`, { animation: true, root: this.shadowRoot, paintPresetRegistry: this._paintPresetRegistry,
          paletteValues: { segments: segmentRows, gradient_stops: gradientRows },
          paintChildren: () => ({ segments: this._segmentsSection.render(root, options => this._renderCardGroup(options), { section: false }), gradient_stops: this._gradientStopsSection.render(root, options => this._renderCardGroup(options), { section: false }) }),
        })}
        ${renderFormattingSection(context, root, { includeUnit: false })}
      </div>`;
      } finally { this._isRendering = false; }
      this._structureSignature = signature;
      this._syncControls();
      const active = focus && this.shadowRoot.querySelector(focus.selector);
      active?.focus?.({ preventScroll: true });
      if (active?.type === 'text' && focus.start != null) active.setSelectionRange?.(focus.start, focus.end);
    } else {
      this._syncControls();
    }
    if (!defer) this._referenceStructureSignature = markerSignature;
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
    for (const picker of this.shadowRoot.querySelectorAll('ha-entity-picker')) {
      if (!picker._sbcpEntityChangeHandler && typeof picker.addEventListener === 'function') {
        picker._sbcpEntityChangeHandler = event => {
          if (!event.detail || !Object.prototype.hasOwnProperty.call(event.detail, 'value')) return;
          event._sbcpEntityPickerHandled = true;
          this._handleField(event);
        };
        picker.addEventListener('value-changed', picker._sbcpEntityChangeHandler);
      }
    }
    const context = this._createSectionContext();
    const paintState = syncBarPaintEditor(this.shadowRoot, context, root, {
      segments: this._segmentsSection._getScopedSegmentsValue(root),
      gradient_stops: this._gradientStopsSection._getScopedGradientStopsValue(root),
    }, { numericDrafts: this._numericDrafts, cssColorDrafts: this._cssColorDrafts, registry: this._paintPresetRegistry });
    const needle = this._needleSection._getEffectiveScopedNeedleConfig(root);
    syncColorInput(this.shadowRoot, 'bar-needle-color', needle.color, '#ffffff', this._cssColorDrafts);
    for (const key of ['peak', 'floor']) {
      const marker = { ...this._extremaSection._getMarkerConfig(root, key), ...this._extremaSection._getEffectiveMarkerExtras(root, key) };
      syncColorInput(this.shadowRoot, `${key}-color`, marker.color, key === 'peak' ? '#888' : '#888888', this._cssColorDrafts);
    }
    const baselinePaletteValues = Object.fromEntries(['above', 'below'].map(direction => [direction, {
      segments: this._baselinePaintSections[direction].segments._getScopedSegmentsValue(root),
      gradient_stops: this._baselinePaintSections[direction].gradientStops._getScopedGradientStopsValue(root),
    }]));
    this._baselineSection.syncPaintEditors(this.shadowRoot, root, baselinePaletteValues, this._paintPresetRegistry,
      { numericDrafts: this._numericDrafts, cssColorDrafts: this._cssColorDrafts,
        paintChildren: (paintScope, direction) => this._renderBaselinePaintPalette(paintScope, direction) });
    for (const direction of ['above', 'below']) {
      this._baselinePaintSections[direction].segments.syncRows(root);
      this._baselinePaintSections[direction].gradientStops.syncRows(root);
    }
    this._targetSection.syncControls(this.shadowRoot, root, { ...this._targetRenderOptions(root),
      numericDrafts: this._numericDrafts, cssColorDrafts: this._cssColorDrafts,
      replaced: this._configReplaced || this._forceTargetSync });
    this._forceTargetSync = false;
    for (const sections of [this._targetPaintSections, this._targetBelowPaintSections]) {
      sections.segments.syncRows(root); sections.gradientStops.syncRows(root);
    }
    const segmentsRebuilt = this._segmentsSection.syncRows(root);
    const gradientStopsRebuilt = this._gradientStopsSection.syncRows(root);
    const paletteRoot = this._segmentsSection._getPaletteRoot(root);
    const color = paintState.paint.color;
    const values = {
      'scale-min': getFeatureScaleSource(this._config, 'min').fixed,
      'scale-max': getFeatureScaleSource(this._config, 'max').fixed,
      'scale-direction': getDirectionSelection(context, root, ['scale', 'direction']),
      'bar-fill-style': paintState.paint.fill_style,
      'bar-opacity': paintState.paint.opacity,
      'bar-direction': getDirectionSelection(context, root, ['bar', 'direction']),
      'bar-color': getColorPickerValue(color, '#4a9eff'),
      'bar-color-text-fallback': color,
      'bar-needle-mode': this._needleSection._getScopedNeedleConfig(root).mode === 'enabled',
      'bar-needle-color': getColorPickerValue(this._needleSection._getScopedNeedleConfig(root).color, '#ffffff'),
      'bar-needle-color-text-fallback': this._needleSection._getScopedNeedleConfig(root).color,
      'baseline-value': formatScaleValueInput(getFeatureBaselineSource(this._config)),
      'formatting-unit': getFormattingValue(context, root, 'unit'),
      'formatting-decimal': getFormattingValue(context, root, 'decimal'),
    };
    for (const key of ['peak', 'floor']) {
      const marker = this._extremaSection._getMarkerConfig(root, key);
      const label = this._extremaSection._getBuiltinMarkerLabelOptions(root, key);
      Object.assign(values, {
        [`${key}-color`]: getColorPickerValue(marker.color, '#888888'),
        [`${key}-color-text-fallback`]: marker.color,
        [`${key}-window`]: this._extremaSection._getEffectiveMarkerExtras(root, key).window,
        [`${key}-window-entity`]: this._extremaSection._getEffectiveMarkerExtras(root, key).windowEntity ?? '',
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
      const controlRoot = ['bar-fill-style', 'bar-opacity', 'bar-color', 'bar-color-text-fallback'].includes(field) ? paletteRoot : this.shadowRoot;
      const control = controlRoot?.querySelector(`[data-field="${field}"]`);
      if (control && /^(peak|floor)-window$/.test(field) && control.options
        && ![...control.options].some(option => option.value === String(value))) control.innerHTML = renderWindowOptions(value);
      if (control && (control !== this.shadowRoot.activeElement || this._configReplaced)) {
        if (control.type === 'checkbox') control.checked = !!value;
        else control.value = String(value);
      }
      if (field === 'bar-color-text-fallback') control?.setAttribute('aria-label', 'Bar color (CSS value)');
    }
    for (const [id, checked] of [['baseline-show', this._baselineSection._getBaselineShow(root)]]) {
      const control = this.shadowRoot.querySelector(`#${id}`);
      if (control) control.checked = checked;
    }
    for (const [section, rebuilt] of [[this._segmentsSection, segmentsRebuilt], [this._gradientStopsSection, gradientStopsRebuilt]]) {
      const segment = section === this._segmentsSection;
      const rows = segment ? section._getScopedSegmentsValue(root) : section._getScopedGradientStopsValue(root);
      for (const field of segment ? ['from', 'to', 'color', 'color-text-fallback'] : ['pos', 'color']) {
        for (const control of paletteRoot?.querySelectorAll(`input[data-kind="${segment ? 'segment' : 'gradient'}-${field}"]`) ?? []) {
          const index = Number(control.dataset.index), row = rows[index];
          if (!row) continue;
          const value = segment && !field.startsWith('color') ? section._getSegmentBoundaryText(root, index, field, row?.[field])
            : !segment && field === 'pos' ? section._getGradientStopPosText(root, index, row?.pos ?? '') : row?.color;
          if (rebuilt) control.value = segment && control.type === 'color' ? getColorPickerValue(value, '#4a9eff') : value ?? '';
        }
      }
    }
    this._referenceMarkersSection.syncControls(this._hass, this._configReplaced, root, { cssColorDrafts: this._cssColorDrafts });
    const solid = paletteRoot?.querySelector('#bar-solid-fill');
    if (solid) solid.checked = !!paintState.paint.solid_fill;
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
    const sourceForKind = kind => {
      if (kind === 'scale-min-attribute') return { entity: getFeatureScaleSource(this._config, 'min').entity, attribute: getFeatureScaleSource(this._config, 'min').attribute, label: 'Min attribute' };
      if (kind === 'scale-max-attribute') return { entity: getFeatureScaleSource(this._config, 'max').entity, attribute: getFeatureScaleSource(this._config, 'max').attribute, label: 'Max attribute' };
      if (kind === 'baseline-attribute') return { entity: getFeatureBaselineSource(this._config).entity, attribute: getFeatureBaselineSource(this._config).attribute, label: 'Baseline attribute' };
      return null;
    };
    for (const control of this.shadowRoot.querySelectorAll('[data-kind$="-attribute"]')) {
      let source = control.dataset.kind === 'feature-attribute'
        ? { entity: this._effectiveEntity, attribute: this._config.attribute ?? '', label: 'Entity attribute' }
        : sourceForKind(control.dataset.kind);
      if (!source) continue;
      if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = source.attribute ?? '';
      if (control.tagName === 'HA-ENTITY-ATTRIBUTE-PICKER') {
        control.hass = this._hass;
        control.entityId = source.entity || undefined;
        if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = source.attribute ?? '';
        control.label = source.label;
        control.allowCustomValue = true;
        const attrs = this._hass?.states?.[source.entity]?.attributes ?? {};
        control.hideAttributes = Object.entries(attrs).filter(([, item]) => !['string', 'number', 'boolean'].includes(typeof item)).map(([key]) => key);
      } else if (control.list) {
        control.list.innerHTML = getEntityAttributeSuggestions(this._hass, source.entity).map(key => `<option value="${escapeAttribute(key)}"></option>`).join('');
      }
    }
    this._syncDisclosures();
    this._numericDrafts.apply(this.shadowRoot);
    syncCssColorDrafts(this.shadowRoot, this._cssColorDrafts);
  }

  _syncTargetControls() {
    this._targetSection.syncControls(this.shadowRoot, root, { ...this._targetRenderOptions(root),
      numericDrafts: this._numericDrafts, cssColorDrafts: this._cssColorDrafts,
      replaced: this._configReplaced || this._forceTargetSync });
    this._forceTargetSync = false;
    const summary = this.shadowRoot.querySelector('#card-group-marker-target-summary');
    if (summary) summary.textContent = this._targetSection._getCardTargetMarkerSummary();
  }

  _targetRenderOptions(scope) {
    return { root: this.shadowRoot, registry: this._paintPresetRegistry, entityInputId: 'feature-target-entity',
      paletteValues: Object.fromEntries([['above', this._targetPaintSections], ['below', this._targetBelowPaintSections]].map(([direction, sections]) => [direction, {
        segments: sections.segments._getScopedSegmentsValue(scope), gradient_stops: sections.gradientStops._getScopedGradientStopsValue(scope),
      }])),
      paintChildren: (paintScope, direction) => this._renderTargetPaintPalette(paintScope, direction) };
  }

  _renderTargetPaintPalette(scope, direction = 'above') {
    const sections = direction === 'below' ? this._targetBelowPaintSections : this._targetPaintSections;
    const renderGroup = options => this._renderCardGroup({ ...options, group: `target-${direction}-${options.group}` });
    return { segments: sections.segments.render(scope, renderGroup, { section: false }),
      gradient_stops: sections.gradientStops.render(scope, renderGroup, { section: false }) };
  }

  _handleTargetPaletteEvent(event, mode = event.type) {
    return [this._targetPaintSections, this._targetBelowPaintSections].some(sections => sections.segments.handle(event, mode) || sections.gradientStops.handle(event, mode));
  }

  _renderBaselinePaintPalette(scope, direction) {
    const sections = this._baselinePaintSections[direction];
    const renderGroup = options => this._renderCardGroup({ ...options, group: `baseline-${direction}-${options.group}` });
    return {
      segments: sections.segments.render(scope, renderGroup, { section: false }),
      gradient_stops: sections.gradientStops.render(scope, renderGroup, { section: false }),
    };
  }

  _handleBaselinePaletteEvent(event, mode = event.type) {
    for (const direction of ['above', 'below']) {
      const sections = this._baselinePaintSections[direction];
      if (sections.segments.handle(event, mode) || sections.gradientStops.handle(event, mode)) return true;
    }
    return false;
  }
}
