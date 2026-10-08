import { normalizeBarConfig, normalizeCardConfig, normalizeStructuredResolvableValue, normalizeMarkerDirection, normalizeTargetMarkerShape } from '../config/normalize.js';
import { getNumericValue } from '../config/resolve.js';
import {
  cloneContainer, cloneDeep, serializeConfig, isObject, hasExplicitOverrideValue, hasResolvableOverride, getEffectiveDisplayValue,
  setPathValue, deletePathValue, getPathValue, hasPath,
  normalizeTextValue, normalizeOptionalEnabled, normalizeNumberValue, normalizeDecimalValue,
  getScopedPath, normalizePath, removePathsFromTarget, pruneEmptyObjectsInTarget,
} from './shared/editor-config.js';
import {
  renderEntityInput, renderEntitySourceInput, renderBuiltinMarkerLabelControls,
  renderResetOptions, escapeAttribute, isHexColorValue, expandHexColor,
  normalizeColorComparisonValue, getColorPickerValue, renderColorInput,
} from './shared/editor-controls.js';
import { editorStyles } from './shared/editor-styles.js';
import { renderCardGroup, renderMarkersSection } from './shared/editor-disclosures.js';

import {
  getScaleFixedValue, getScaleEntityValue, setScalePart,
  clearScaleOverride, getScaleOverrideSummary, renderScaleSection, handleScaleField,
} from './sections/scale.js';
import {
  getFormattingValue, getEffectiveFormattingValue, setFormattingUnit, setFormattingDecimal,
  clearFormattingOverride, hasFormattingOverride, getFormattingSummary,
  renderFormattingSection, handleFormattingField,
} from './sections/formatting.js';

import {
  getFillStyleFromColorMode, getFillStyleValue, getEffectiveFillStyleValue,
  getBarColorValue, getEffectiveBarColorValue, setBarFillStyle, setBarColor,
  getBarSolidFillValue, getEffectiveBarSolidFillValue, setBarSolidFill,
  clearBarAppearanceOverride, hasBarAppearanceOverride, getBarAppearanceSummary,
  renderBarAppearanceSection, handleBarAppearanceField,
} from './sections/bar-appearance.js';

import { SegmentsSection } from './sections/segments.js';
import { GradientStopsSection } from './sections/gradient-stops.js';

import { NeedleSection } from './sections/needle.js';
import { BaselineSection } from './sections/baseline.js';
import { TargetSection } from './sections/target.js';
import { ExtremaSection } from './sections/extrema.js';
import { ReferenceMarkersSection, getReferenceMarkerSource } from './sections/reference-markers.js';
import { getBuiltinMarkerLabelOptions, setBuiltinMarkerLabelField, getEffectiveMarkerDirection, setMarkerDirection } from './shared/editor-marker-controls.js';

export class SensorBarCardPlusEditor extends HTMLElement {
  get _gradientStopValidationMessages() { return this._gradientStopsSection._gradientStopValidationMessages; }
  get _gradientStopPosTexts() { return this._gradientStopsSection._gradientStopPosTexts; }
  get _gradientStopsUiRows() { return this._gradientStopsSection._gradientStopsUiRows; }
  get _gradientStopsDrafts() { return this._gradientStopsSection._gradientStopsDrafts; }
  get _segmentBoundaryTexts() { return this._segmentsSection._segmentBoundaryTexts; }
  get _segmentUiRows() { return this._segmentsSection._segmentUiRows; }
  get _segmentDrafts() { return this._segmentsSection._segmentDrafts; }
  get _baselineColorDrafts() { return this._baselineSection._baselineColorDrafts; }

  get _targetAboveFillDrafts() { return this._targetSection._targetAboveFillDrafts; }

  get _genericMarkerUiIds() { return this._referenceMarkersSection._genericMarkerUiIds; }
  get _expandedGenericMarkerUiIds() { return this._referenceMarkersSection._expandedGenericMarkerUiIds; }
  get _nextGenericMarkerUiId() { return this._referenceMarkersSection._nextGenericMarkerUiId; }
  set _nextGenericMarkerUiId(value) { this._referenceMarkersSection._nextGenericMarkerUiId = value; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._segmentsSection = new SegmentsSection(this._createSectionContext(), this._paletteUi(), {
      write: (scope, rows, options) => this._setScopedSegments(scope, rows, options),
    });
    this._gradientStopsSection = new GradientStopsSection(this._createSectionContext(), this._paletteUi(), {
      write: (scope, rows, options) => this._setScopedGradientStops(scope, rows, options),
    });
    this._needleSection = new NeedleSection(this._createSectionContext());
    this._baselineSection = new BaselineSection(this._createSectionContext());
    this._targetSection = new TargetSection(this._createSectionContext());
    this._extremaSection = new ExtremaSection(this._createSectionContext());
    this._referenceMarkersSection = new ReferenceMarkersSection(this._createSectionContext(), this._paletteUi());
    this._config = {};
    this._draftConfig = {};
    this._hass = null;
    this._isRendering = false;
    this._renderScheduled = false;
    this._lastRenderedConfigJson = null;
    this._lastEmittedConfigJson = null;
    this._shadowListenersAttached = false;
    this._expandedEntityOverrides = new Set();
    this._expandedOverrideGroups = new Set();
    this._expandedCardGroups = new Set();
    this._targetSection.reset();
    this._baselineSection.reset();
    this._pendingFocusSelector = null;
    this._boundHandleClick = (event) => this._handleClick(event);
    this._boundHandleChange = (event) => this._handleChange(event);
    this._boundHandleInput = (event) => this._handleInput(event);
    this._boundHandleValueChanged = (event) => this._handleValueChanged(event);
    this._boundHandleKeydown = (event) => this._handleKeydown(event);
  }

  setConfig(config) {
    const nextConfig = this._cloneDeep(config ?? {});
    const nextConfigJson = this._serializeConfig(nextConfig);
    const currentConfigJson = this._serializeConfig(this._config);
    const currentDraftJson = this._serializeConfig(this._draftConfig);

    if (nextConfigJson === currentConfigJson) {
      return;
    }

    if (nextConfigJson === currentDraftJson) {
      this._config = nextConfig;
      return;
    }

    if (nextConfigJson === this._lastEmittedConfigJson) {
      this._config = nextConfig;
      return;
    }

    if (this._getEmittedConfigJson(nextConfig) === this._getEmittedConfigJson(this._draftConfig)) {
      this._config = nextConfig;
      return;
    }

    const shouldRender = !this.shadowRoot?.innerHTML || nextConfigJson !== this._lastRenderedConfigJson;
    this._lastEmittedConfigJson = null;
    this._config = nextConfig;
    this._draftConfig = this._cloneDeep(nextConfig);
    this._segmentsSection.reset();
    this._gradientStopsSection.reset();
    this._targetSection.reset();
    this._baselineSection.reset();
    this._referenceMarkersSection.reset();

    if (shouldRender) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot?.innerHTML) {
      this._render();
      return;
    }
    this._syncEntityPickers();
  }

  _cloneContainer(value) {
    return cloneContainer(value);
  }

  _cloneDeep(value) {
    return cloneDeep(value);
  }

  _serializeConfig(value) {
    return serializeConfig(value);
  }

  _getEmittedConfigJson(config) {
    // Equality must not collapse sources or explicit inheritance overrides.
    return this._serializeConfig(config);
  }

  _isObject(value) {
    return isObject(value);
  }

  _setPathValue(target, path, value) {
    return setPathValue(target, path, value);
  }

  _deletePathValue(target, path) {
    return deletePathValue(target, path);
  }

  _getPathValue(target, path) {
    return getPathValue(target, path);
  }

  _hasPath(target, path) {
    return hasPath(target, path);
  }

  _normalizeTextValue(value) {
    return normalizeTextValue(value);
  }

  _normalizeOptionalEnabled(value) {
    return normalizeOptionalEnabled(value);
  }

  _normalizeNumberValue(value) {
    return normalizeNumberValue(value);
  }

  _normalizeDecimalValue(value) {
    return normalizeDecimalValue(value);
  }

  _preferStructuredPath(structuredPath, legacyPath = null) {
    if (this._hasPath(this._draftConfig, structuredPath.slice(0, -1))) {
      return structuredPath;
    }
    if (this._hasPath(this._draftConfig, structuredPath)) {
      return structuredPath;
    }
    if (legacyPath && this._hasPath(this._draftConfig, legacyPath)) {
      return legacyPath;
    }
    return structuredPath;
  }

  _getEntitiesValue() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._draftConfig.entities.map((entry) => (
        typeof entry === 'string'
          ? { entity: entry }
          : {
            entity: entry?.entity ?? '',
            name: entry?.name ?? '',
            icon: entry?.icon ?? '',
          }
      ));
    }
    if (this._draftConfig.entity) {
      return [{
        entity: this._draftConfig.entity,
        name: this._draftConfig.name ?? '',
        icon: this._draftConfig.icon ?? '',
      }];
    }
    return [];
  }

  _getRawEntityRows() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._cloneDeep(this._draftConfig.entities);
    }
    if (this._draftConfig.entity !== undefined) {
      const hasTopLevelIdentity = this._draftConfig.name !== undefined || this._draftConfig.icon !== undefined;
      if (!hasTopLevelIdentity) {
        return [this._draftConfig.entity];
      }
      return [{
        entity: this._draftConfig.entity,
        ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
        ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
      }];
    }
    return [];
  }

  _buildEntityConfigEntries(entities) {
    const usesShorthand = !Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined;
    const source = Array.isArray(this._draftConfig.entities)
      ? this._draftConfig.entities
      : this._draftConfig.entity !== undefined
        ? [{
          entity: this._draftConfig.entity,
          ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
          ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
        }]
        : [];

    const entries = entities.map((entry, index) => {
      const rawEntry = source[index];
      if (this._isObject(rawEntry)) {
        const mergedEntry = {
          ...rawEntry,
          entity: entry.entity,
        };
        const normalizedName = this._normalizeTextValue(entry.name).trim();
        if (normalizedName) {
          mergedEntry.name = normalizedName;
        } else {
          delete mergedEntry.name;
        }
        const rawIconValue = entry?.icon;
        const normalizedIcon = typeof rawIconValue === 'string'
          ? rawIconValue.trim()
          : rawIconValue;
        if (normalizedIcon === false) {
          mergedEntry.icon = false;
        } else if (typeof normalizedIcon === 'string' && normalizedIcon) {
          mergedEntry.icon = normalizedIcon;
        } else if (rawEntry.icon === false) {
          mergedEntry.icon = false;
        } else {
          delete mergedEntry.icon;
        }
        return mergedEntry;
      }
      const nextEntry = {
        entity: entry.entity,
      };
      const normalizedName = this._normalizeTextValue(entry.name).trim();
      if (normalizedName) {
        nextEntry.name = normalizedName;
      }
      const normalizedIcon = typeof entry?.icon === 'string'
        ? entry.icon.trim()
        : entry?.icon;
      if (normalizedIcon === false) {
        nextEntry.icon = false;
      } else if (typeof normalizedIcon === 'string' && normalizedIcon) {
        nextEntry.icon = normalizedIcon;
      }
      return nextEntry;
    });

    if (!usesShorthand) {
      return entries.map((entry) => {
        if (this._isObject(entry) && Object.keys(entry).length === 1 && entry.entity !== undefined) {
          return entry.entity;
        }
        return entry;
      });
    }

    return entries;
  }

  _updateConfig(nextConfig) {
    this._draftConfig = this._cloneDeep(nextConfig);
  }

  _emitConfigChanged() {
    const emittedConfig = this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig));
    const nextConfigJson = this._serializeConfig(emittedConfig);
    if (nextConfigJson === this._lastEmittedConfigJson) {
      return false;
    }

    this._lastEmittedConfigJson = nextConfigJson;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: emittedConfig },
      bubbles: true,
      composed: true,
    }));
    return true;
  }

  _scheduleRender() {
    if (this._renderScheduled || this._isRendering) return;
    this._renderScheduled = true;
    setTimeout(() => {
      this._renderScheduled = false;
      this._render();
    }, 0);
  }

  _applyUserConfig(nextConfig, options = {}) {
    const { rerender = false } = options;
    const nextConfigJson = this._serializeConfig(nextConfig);
    const currentDraftJson = this._serializeConfig(this._draftConfig);
    if (nextConfigJson === currentDraftJson) {
      return false;
    }

    this._updateConfig(nextConfig);
    this._emitConfigChanged();
    this._refreshDerivedEditorUi();
    if (rerender) {
      this._scheduleRender();
    }
    return true;
  }

  _getShadowElementById(id) {
    if (!this.shadowRoot) {
      return null;
    }
    return this.shadowRoot.getElementById?.(id)
      ?? this.shadowRoot.querySelector?.(`#${id}`)
      ?? null;
  }

  _setElementChecked(id, checked) {
    const element = this._getShadowElementById(id);
    if (element) {
      element.checked = !!checked;
    }
  }

  _setElementText(id, value) {
    const element = this._getShadowElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  _refreshDerivedEditorUi() {
    if (!this.shadowRoot) {
      return;
    }
    this._refreshCardDerivedUi();
    this._refreshEntityDerivedUi();
  }

  _refreshCardDerivedUi() {
    this._setElementText('card-group-marker-target-summary', this._getCardTargetMarkerSummary());
    this._setElementText('card-group-marker-peak-summary', this._getMarkerResetSummary('peak'));
    this._setElementText('card-group-marker-floor-summary', this._getMarkerResetSummary('floor'));
    this._setElementText('card-group-baseline-summary', this._getCardBaselineSummary());
    this._setElementText('card-group-generic-markers-summary', this._getGenericMarkersSummary({ type: 'card' }));
    this._setElementText('card-group-segments-summary', this._getSegmentsSummary({ type: 'card' }));
    this._setElementText('card-group-gradient-stops-summary', this._getGradientStopsSummary({ type: 'card' }));
    this._setElementChecked('target-above-fill-enabled', this._isTargetAboveFillEnabled({ type: 'card' }));
    this._setElementChecked('baseline-above-color-enabled', this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'above'));
    this._setElementChecked('baseline-below-color-enabled', this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'below'));
    this._refreshSegmentUi({ type: 'card' });
  }

  _refreshEntityDerivedUi() {
    const count = this._getEntitiesValue().length;
    for (let index = 0; index < count; index += 1) {
      const scope = { type: 'entity', index };
      this._setElementChecked(`entity-${index}-scale-inherit`, !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'min'))
        && !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'max')));
      this._setElementChecked(`entity-${index}-target-inherit`, !this._hasTargetOverride(scope));
      this._setElementChecked(`entity-${index}-baseline-inherit`, !this._hasBaselineOverride(scope));
      this._setElementChecked(`entity-${index}-needle-inherit`, !this._hasNeedleOverride(scope));
      this._setElementChecked(`entity-${index}-peak-inherit`, !this._hasPeakOverride(scope));
      this._setElementChecked(`entity-${index}-floor-inherit`, !this._hasExtremumOverride(scope, 'floor'));
      this._setElementChecked(`entity-${index}-markers-inherit`, !this._hasMarkersOverride(scope));
      this._setElementChecked(`entity-${index}-bar-inherit`, !this._hasEntityBarAppearanceOverride(scope));
      this._setElementChecked(`entity-${index}-segments-inherit`, !this._hasSegmentsOverride(scope));
      this._setElementChecked(`entity-${index}-gradient-stops-inherit`, !this._hasGradientStopsOverride(scope));
      this._setElementChecked(`entity-${index}-layout-inherit`, !this._hasLayoutOverride(scope));
      this._setElementChecked(`entity-${index}-formatting-inherit`, !this._hasFormattingOverride(scope));
      this._setElementChecked(`entity-${index}-target-above-fill-enabled`, this._isTargetAboveFillEnabled(scope));
      this._setElementChecked(`entity-${index}-baseline-above-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, 'above'));
      this._setElementChecked(`entity-${index}-baseline-below-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, 'below'));

      this._setElementText(`entity-${index}-group-scale-summary`, this._getScaleOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-target-summary`, this._getTargetOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-baseline-summary`, this._getBaselineOverrideSummary(scope));
      this._setElementText(`entity-${index}-group-needle-summary`, this._getNeedleSummary(scope));
      this._setElementText(`entity-${index}-group-peak-summary`, this._getPeakSummary(scope));
      this._setElementText(`entity-${index}-group-floor-summary`, this._getFloorSummary(scope));
      this._setElementText(`entity-${index}-group-markers-summary`, this._getGenericMarkersSummary(scope));
      this._setElementText(`entity-${index}-group-bar-summary`, this._getBarAppearanceSummary(scope));
      this._setElementText(`entity-${index}-group-segments-summary`, this._getSegmentsSummary(scope));
      this._setElementText(`entity-${index}-group-gradient-stops-summary`, this._getGradientStopsSummary(scope));
      this._setElementText(`entity-${index}-group-layout-summary`, this._getLayoutSummary(scope));
      this._setElementText(`entity-${index}-group-formatting-summary`, this._getFormattingSummary(scope));

      this._refreshSegmentUi(scope);
    }
  }

  _queuePostRenderFocus(selector) {
    this._pendingFocusSelector = selector || null;
  }

  _applyPendingFocus() {
    if (!this._pendingFocusSelector || !this.shadowRoot) {
      return;
    }
    const selector = this._pendingFocusSelector;
    this._pendingFocusSelector = null;
    setTimeout(() => {
      const element = this.shadowRoot?.querySelector?.(selector);
      if (!element || typeof element.focus !== 'function') {
        return;
      }
      try {
        element.focus({ preventScroll: true });
      } catch (_error) {
        element.focus();
      }
    }, 0);
  }

  _setValueAtPath(path, value, options = {}) {
    const nextConfig = value === undefined
      ? this._deletePathValue(this._draftConfig, path)
      : this._setPathValue(this._draftConfig, path, value);
    return this._applyUserConfig(nextConfig, options);
  }

  _setTitle(value) {
    this._setValueAtPath(['title'], value);
  }

  _setEntityField(index, key, value) {
    const normalizedValue = this._normalizeTextValue(value);
    if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined && index === 0) {
      if (!normalizedValue.trim()) {
        return this._setValueAtPath([key], undefined);
      }
      return this._setValueAtPath([key], normalizedValue.trim());
    }
    const nextConfig = this._withEntityScopeConfig((entries) => {
      const rawEntry = entries[index];
      const nextEntry = this._isObject(rawEntry)
        ? this._cloneDeep(rawEntry)
        : { entity: rawEntry?.entity ?? '' };
      if (!normalizedValue.trim()) {
        delete nextEntry[key];
      } else {
        nextEntry[key] = normalizedValue.trim();
      }
      entries[index] = nextEntry;
      return entries;
    });
    return this._applyUserConfig(nextConfig);
  }

  _cleanupEntityIdentityForEmit(target) {
    if (!this._isObject(target)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const normalizedName = this._normalizeTextValue(nextTarget.name).trim();
    if (!normalizedName) {
      delete nextTarget.name;
    } else {
      nextTarget.name = normalizedName;
    }

    if (nextTarget.icon === false) {
      return nextTarget;
    }
    const normalizedIcon = this._normalizeTextValue(nextTarget.icon).trim();
    if (!normalizedIcon) {
      delete nextTarget.icon;
    } else {
      nextTarget.icon = normalizedIcon;
    }
    return nextTarget;
  }

  _cleanupNeedleForEmit(target, scope = { type: 'card' }) {
    if (!this._isObject(target) || !this._isObject(target.bar)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const rawNeedle = nextTarget.bar?.needle;
    if (rawNeedle === undefined) {
      return nextTarget;
    }

    const defaultColor = this._normalizeColorComparisonValue('#ffffff');
    let nextNeedle = null;

    if (rawNeedle === true) {
      nextNeedle = { show: true };
    } else if (rawNeedle === false) {
      nextNeedle = scope?.type === 'entity' ? { show: false } : null;
    } else if (this._isObject(rawNeedle)) {
      const color = this._normalizeTextValue(rawNeedle.color).trim();
      if (rawNeedle.show === true) {
        nextNeedle = { show: true };
      } else if (rawNeedle.show === false) {
        nextNeedle = scope?.type === 'entity' ? { show: false } : null;
      } else if (scope?.type === 'entity' && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
        nextNeedle = {};
      }
      if (nextNeedle && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
        nextNeedle.color = color;
      }
    } else {
      nextNeedle = null;
    }

    if (nextNeedle) {
      nextTarget.bar.needle = nextNeedle;
    } else {
      delete nextTarget.bar.needle;
      if (!Object.keys(nextTarget.bar).length) {
        delete nextTarget.bar;
      }
    }
    return nextTarget;
  }

  _cleanupResolvableValueForEmit(value) {
    if (this._isObject(value) || value === null || typeof value === 'string' && this._normalizeNumberValue(value) === null) {
      return this._cloneDeep(value);
    }
    const fixed = this._normalizeNumberValue(value);
    return fixed === null ? null : { fixed };
  }

  _cleanupScaleForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.scale)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextScale = this._cloneDeep(nextTarget.scale);

    ['min', 'max'].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(nextScale, key)) {
        return;
      }
      const cleanedValue = this._cleanupResolvableValueForEmit(nextScale[key]);
      if (cleanedValue || nextScale[key] === null) {
        nextScale[key] = cleanedValue;
        delete nextTarget[key];
        delete nextTarget[`${key}_entity`];
      } else {
        delete nextScale[key];
      }
    });

    if (Object.keys(nextScale).length) {
      nextTarget.scale = nextScale;
    } else {
      delete nextTarget.scale;
    }

    return nextTarget;
  }

  _cleanupFormattingForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.formatting)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextFormatting = this._cloneDeep(nextTarget.formatting);
    const unit = this._normalizeTextValue(nextFormatting.unit).trim();
    const decimal = this._normalizeDecimalValue(nextFormatting.decimal);

    if (unit) {
      nextFormatting.unit = unit;
      delete nextTarget.unit;
    } else {
      delete nextFormatting.unit;
    }

    if (decimal !== null) {
      nextFormatting.decimal = decimal;
      delete nextTarget.decimal;
    } else {
      delete nextFormatting.decimal;
    }

    if (Object.keys(nextFormatting).length) {
      nextTarget.formatting = nextFormatting;
    } else {
      delete nextTarget.formatting;
    }

    return nextTarget;
  }

  _cleanupLayoutForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.layout)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextLayout = this._cloneDeep(nextTarget.layout);
    const nextLabel = this._isObject(nextLayout.label) ? this._cloneDeep(nextLayout.label) : null;
    const nextHero = this._isObject(nextLayout.hero) ? this._cloneDeep(nextLayout.hero) : null;
    const height = this._normalizeNumberValue(nextLayout.height);
    const width = this._normalizeNumberValue(nextLabel?.width);
    const valueSize = this._normalizeHeroValueSizeValue(nextHero?.value_size);
    const position = this._normalizeTextValue(nextLabel?.position).trim();

    if (height !== null && height >= 24) {
      nextLayout.height = height;
      delete nextTarget.height;
    } else {
      delete nextLayout.height;
    }

    if (nextLabel) {
      if (position) {
        nextLabel.position = position;
        delete nextTarget.label_position;
      } else {
        delete nextLabel.position;
      }

      if (width !== null) {
        nextLabel.width = width;
        delete nextTarget.label_width;
      } else {
        delete nextLabel.width;
      }

      if (Object.keys(nextLabel).length) {
        nextLayout.label = nextLabel;
      } else {
        delete nextLayout.label;
      }
    }

    if (nextHero) {
      if (valueSize !== null) {
        nextHero.value_size = valueSize;
      } else {
        delete nextHero.value_size;
      }

      if (Object.keys(nextHero).length) {
        nextLayout.hero = nextHero;
      } else {
        delete nextLayout.hero;
      }
    }

    if (Object.keys(nextLayout).length) {
      nextTarget.layout = nextLayout;
    } else {
      delete nextTarget.layout;
    }

    return nextTarget;
  }

  _cleanupTargetForEmit(target, scope = { type: 'card' }) {
    if (!this._isObject(target) || !this._isObject(target.target)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextMarker = this._cloneDeep(nextTarget.target);
    const cleanedAt = this._cleanupResolvableValueForEmit(nextMarker.at);
    const color = this._normalizeTextValue(nextMarker.color).trim();
    const label = this._cleanBuiltinMarkerLabelForEmit(nextMarker.label, scope, 'target');
    const fillColor = this._normalizeTextValue(nextMarker.when_exceeded?.fill_color).trim();
    const hasShape = Object.prototype.hasOwnProperty.call(nextMarker, 'shape');
    const shape = hasShape ? normalizeTargetMarkerShape(nextMarker.shape) : null;
    const direction = Object.prototype.hasOwnProperty.call(nextMarker, 'direction')
      ? normalizeMarkerDirection(nextMarker.direction)
      : null;

    if (typeof nextMarker.enabled !== 'boolean') {
      delete nextMarker.enabled;
    }

    if (cleanedAt || nextMarker.at === null) {
      nextMarker.at = cleanedAt;
      delete nextTarget.target_entity;
    } else {
      delete nextMarker.at;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888')) {
      nextMarker.color = color;
      delete nextTarget.target_color;
    } else {
      delete nextMarker.color;
    }

    if (Object.keys(label).length) {
      nextMarker.label = label;
      if (label.show === true) delete nextTarget.show_target_label;
    } else {
      delete nextMarker.label;
      delete nextTarget.show_target_label;
    }

    if (fillColor) {
      nextMarker.when_exceeded = {
        ...(this._isObject(nextMarker.when_exceeded) ? nextMarker.when_exceeded : {}),
        fill_color: fillColor,
      };
      delete nextTarget.above_target_color;
    } else {
      delete nextMarker.when_exceeded;
    }

    if (scope?.type === 'card' && shape === 'diamond') {
      delete nextMarker.shape;
    } else if (shape) {
      nextMarker.shape = shape;
    } else {
      delete nextMarker.shape;
    }

    if (direction === 'inward' && (scope?.type !== 'entity'
      || direction === this._getEffectiveMarkerDirection({ type: 'card' }, 'target'))) {
      delete nextMarker.direction;
    } else if (direction) {
      nextMarker.direction = direction;
    }

    if (Object.keys(nextMarker).length) {
      nextTarget.target = nextMarker;
    } else {
      delete nextTarget.target;
    }

    return nextTarget;
  }

  _cleanupBaselineForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.baseline)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextBaseline = this._cloneDeep(nextTarget.baseline);
    const cleanedAt = this._cleanupResolvableValueForEmit(nextBaseline.at);

    if (typeof nextBaseline.enabled !== 'boolean') {
      delete nextBaseline.enabled;
    }

    if (cleanedAt || nextBaseline.at === null) {
      nextBaseline.at = cleanedAt;
    } else {
      delete nextBaseline.at;
    }

    ['above', 'below'].forEach((direction) => {
      if (!this._isObject(nextBaseline[direction])) {
        delete nextBaseline[direction];
        return;
      }
      const color = this._normalizeTextValue(nextBaseline[direction].color).trim();
      if (color) {
        nextBaseline[direction] = { ...nextBaseline[direction], color };
      } else {
        delete nextBaseline[direction];
      }
    });

    if (Object.keys(nextBaseline).length) {
      nextTarget.baseline = nextBaseline;
    } else {
      delete nextTarget.baseline;
    }

    return nextTarget;
  }

  _cleanupPeakForEmit(target, scope = { type: 'card' }) {
    if (!this._isObject(target) || !this._isObject(target.peak)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextPeak = this._cloneDeep(nextTarget.peak);
    const color = this._normalizeTextValue(nextPeak.color).trim();
    const direction = Object.prototype.hasOwnProperty.call(nextPeak, 'direction')
      ? normalizeMarkerDirection(nextPeak.direction)
      : null;

    if (typeof nextPeak.enabled !== 'boolean') {
      delete nextPeak.enabled;
    }
    if (scope?.type !== 'entity' && nextPeak.reset === 'never') {
      delete nextPeak.reset;
    }
    if (direction === 'inward' && (scope?.type !== 'entity'
      || direction === this._getEffectiveMarkerDirection({ type: 'card' }, 'peak'))) {
      delete nextPeak.direction;
    } else if (direction) {
      nextPeak.direction = direction;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888')) {
      nextPeak.color = color;
      delete nextTarget.peak_color;
    } else {
      delete nextPeak.color;
    }
    nextPeak.label = this._cleanBuiltinMarkerLabelForEmit(nextPeak.label, scope, 'peak');
    if (!Object.keys(nextPeak.label).length) delete nextPeak.label;

    if (Object.keys(nextPeak).length) {
      nextTarget.peak = nextPeak;
    } else {
      delete nextTarget.peak;
    }

    return nextTarget;
  }

  _cleanupFloorForEmit(target, scope = { type: 'card' }) {
    if (!this._isObject(target) || !this._isObject(target.floor)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextFloor = this._cloneDeep(nextTarget.floor);
    const color = this._normalizeTextValue(nextFloor.color).trim();
    const direction = Object.prototype.hasOwnProperty.call(nextFloor, 'direction')
      ? normalizeMarkerDirection(nextFloor.direction)
      : null;
    if (typeof nextFloor.enabled !== 'boolean') delete nextFloor.enabled;
    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888888')) {
      nextFloor.color = color;
    } else {
      delete nextFloor.color;
    }
    if (this._isObject(nextFloor.label)) {
      nextFloor.label = this._cleanBuiltinMarkerLabelForEmit(nextFloor.label, scope, 'floor');
      if (!Object.keys(nextFloor.label).length) delete nextFloor.label;
    }
    if ((scope?.type !== 'entity' && nextFloor.reset === 'never')
      || nextFloor.reset === undefined || nextFloor.reset === null || nextFloor.reset === '') {
      delete nextFloor.reset;
    }
    if (direction === 'inward' && (scope?.type !== 'entity'
      || direction === this._getEffectiveMarkerDirection({ type: 'card' }, 'floor'))) {
      delete nextFloor.direction;
    } else if (direction) {
      nextFloor.direction = direction;
    }
    if (Object.keys(nextFloor).length) nextTarget.floor = nextFloor;
    else delete nextTarget.floor;
    return nextTarget;
  }

  _cleanBuiltinMarkerLabelForEmit(rawLabel, scope, key) {
    const label = this._isObject(rawLabel) ? this._cloneDeep(rawLabel) : {};
    const cardLabel = scope?.type === 'entity'
      ? (this._getScopedValue({ type: 'card' }, [key, 'label']) ?? {}) : {};
    if (label.show === false && scope?.type !== 'entity') delete label.show;
    if (label.show === false && scope?.type === 'entity' && cardLabel.show !== true) delete label.show;
    if (label.show_value === true && (scope?.type !== 'entity' || cardLabel.show_value !== false)) delete label.show_value;
    if (label.show_unit === true && (scope?.type !== 'entity' || cardLabel.show_unit !== false)) delete label.show_unit;
    if (typeof label.text === 'string') {
      label.text = label.text.replace(/\s+/g, ' ').trim();
      if (!label.text && scope?.type !== 'entity') delete label.text;
    }
    const precision = this._normalizeDecimalValue(label.precision ?? label.decimal);
    delete label.decimal;
    if (precision === null) delete label.precision;
    else if (scope?.type === 'entity' && precision === (cardLabel.precision ?? cardLabel.decimal)) delete label.precision;
    else label.precision = precision;
    return label;
  }

  _cleanupBarForEmit(target, scope = { type: 'card' }, cardConfig = null, inheritedSegmentSpace = null) {
    if (!this._isObject(target) || !this._isObject(target.bar)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextBar = this._cloneDeep(nextTarget.bar);
    const scopedSegmentSpace = ['percent', 'scale'].includes(nextBar.segment_space)
      ? nextBar.segment_space
      : (scope?.type === 'entity' && ['percent', 'scale'].includes(inheritedSegmentSpace) ? inheritedSegmentSpace : null);
    const legacySegmentSpace = scopedSegmentSpace;
    if (legacySegmentSpace === 'percent' && Array.isArray(nextBar.segments)) {
      const asLegacyPercent = (boundary) => {
        if (typeof boundary === 'number' && Number.isFinite(boundary)) return `${boundary}%`;
        if (typeof boundary === 'string' && boundary.trim() !== '' && !boundary.includes('%') && Number.isFinite(Number(boundary.trim()))) {
          return `${Number(boundary.trim())}%`;
        }
        return boundary;
      };
      nextBar.segments = nextBar.segments.map((segment) => ({
        ...segment,
        from: asLegacyPercent(segment?.from),
        ...(Object.prototype.hasOwnProperty.call(segment ?? {}, 'to') ? { to: asLegacyPercent(segment.to) } : {}),
      }));
    }
    delete nextBar.segment_space;
    const fillStyle = this._normalizeTextValue(nextBar.fill_style).trim();
    const color = this._normalizeTextValue(nextBar.color).trim();
    const segments = Array.isArray(nextBar.segments) ? nextBar.segments : null;
    const gradientStops = Array.isArray(nextBar.gradient_stops) ? nextBar.gradient_stops : null;

    if (fillStyle) {
      const withoutLocalFillStyle = this._cloneDeep(nextTarget);
      delete withoutLocalFillStyle.bar.fill_style;
      const inheritedStyle = normalizeBarConfig(
        withoutLocalFillStyle,
        scope?.type === 'entity' ? cardConfig : null,
        { isCardScope: scope?.type !== 'entity' }
      ).fill_style;
      if (fillStyle === 'bands' && inheritedStyle === 'bands') delete nextBar.fill_style;
      else nextBar.fill_style = fillStyle;
      delete nextTarget.color_mode;
    } else {
      delete nextBar.fill_style;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#4a9eff')) {
      nextBar.color = color;
      delete nextTarget.color;
    } else {
      delete nextBar.color;
    }

    if (nextBar.solid_fill === true) {
      nextBar.solid_fill = true;
    } else {
      delete nextBar.solid_fill;
    }

    if (segments && (!segments.length || legacySegmentSpace || !this._segmentsEqualForEditor(segments, this._getDefaultSegments()))) {
      nextBar.segments = segments;
      delete nextTarget.segments;
      delete nextTarget.severity;
    } else {
      delete nextBar.segments;
    }

    if (gradientStops && (!gradientStops.length || gradientStops.length >= 2 && !this._isDefaultGradientStops(gradientStops))) {
      nextBar.gradient_stops = this._sanitizeGradientStopsForEmit(gradientStops);
      delete nextTarget.gradient_stops;
    } else {
      delete nextBar.gradient_stops;
    }

    if (Object.keys(nextBar).length) {
      nextTarget.bar = nextBar;
    } else {
      delete nextTarget.bar;
    }

    return nextTarget;
  }

  _getEditorKnownKeyOrder(path = []) {
    const pathKey = path.join('.');
    switch (pathKey) {
      case '':
        return ['type', 'title', 'entities', 'scale', 'target', 'baseline', 'peak', 'floor', 'layout', 'formatting', 'bar'];
      case 'entities.*':
        return ['entity', 'name', 'icon', 'scale', 'target', 'baseline', 'peak', 'floor', 'layout', 'formatting', 'bar'];
      case 'scale':
        return ['min', 'max'];
      case 'scale.min':
      case 'scale.max':
      case 'target.at':
      case 'baseline.at':
        return ['fixed', 'entity'];
      case 'target':
        return ['enabled', 'at', 'shape', 'color', 'label', 'when_exceeded'];
      case 'target.label':
        return ['show', 'decimal'];
      case 'target.when_exceeded':
        return ['fill_color'];
      case 'baseline':
        return ['enabled', 'at', 'above', 'below'];
      case 'baseline.above':
      case 'baseline.below':
        return ['color'];
      case 'peak':
        return ['enabled', 'color', 'reset', 'label'];
      case 'floor':
        return ['enabled', 'color', 'reset', 'label'];
      case 'peak.label':
      case 'floor.label':
        return ['show', 'decimal'];
      case 'layout':
        return ['height', 'label', 'hero'];
      case 'layout.label':
        return ['position', 'hero_size', 'width'];
      case 'layout.hero':
        return ['size', 'value_size'];
      case 'formatting':
        return ['unit', 'decimal'];
      case 'bar':
        return ['fill_style', 'color', 'solid_fill', 'needle', 'segments', 'gradient_stops'];
      case 'bar.needle':
        return ['show', 'color'];
      default:
        return null;
    }
  }

  _orderEditorConfigKeys(value, path = []) {
    if (Array.isArray(value)) {
      const nextPath = path[0] === 'entities' ? ['entities', '*'] : path;
      return value.map((entry) => this._orderEditorConfigKeys(entry, nextPath));
    }
    if (!this._isObject(value)) {
      return value;
    }

    const orderedValue = {};
    const knownOrder = this._getEditorKnownKeyOrder(path) ?? [];
    const seenKeys = new Set();

    knownOrder.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        return;
      }
      orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
      seenKeys.add(key);
    });

    Object.keys(value).forEach((key) => {
      if (seenKeys.has(key)) {
        return;
      }
      orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
    });

    return orderedValue;
  }

  _cleanupEditorEmittedConfig(config) {
    if (!this._isObject(config)) {
      return config;
    }
    const inheritedSegmentSpace = config.bar?.segment_space;
    let nextConfig = this._cleanupEntityIdentityForEmit(config);
    nextConfig = this._cleanupScaleForEmit(nextConfig);
    nextConfig = this._cleanupTargetForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupBaselineForEmit(nextConfig);
    nextConfig = this._cleanupPeakForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupFloorForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupGenericMarkersForEmit(nextConfig);
    nextConfig = this._cleanupLayoutForEmit(nextConfig);
    nextConfig = this._cleanupFormattingForEmit(nextConfig);
    nextConfig = this._cleanupNeedleForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupBarForEmit(nextConfig, { type: 'card' });

    if (Array.isArray(nextConfig.entities)) {
      nextConfig.entities = nextConfig.entities.map((entry, index) => {
        if (!this._isObject(entry)) {
          return entry;
        }
        let cleanedEntry = this._cleanupEntityIdentityForEmit(entry);
        cleanedEntry = this._cleanupScaleForEmit(cleanedEntry);
        cleanedEntry = this._cleanupTargetForEmit(cleanedEntry, { type: 'entity', index });
        cleanedEntry = this._cleanupBaselineForEmit(cleanedEntry);
        cleanedEntry = this._cleanupPeakForEmit(cleanedEntry, { type: 'entity', index });
        cleanedEntry = this._cleanupFloorForEmit(cleanedEntry, { type: 'entity', index });
        cleanedEntry = this._cleanupGenericMarkersForEmit(cleanedEntry);
        cleanedEntry = this._cleanupLayoutForEmit(cleanedEntry);
        cleanedEntry = this._cleanupFormattingForEmit(cleanedEntry);
        cleanedEntry = this._cleanupNeedleForEmit(cleanedEntry, { type: 'entity' });
        cleanedEntry = this._cleanupBarForEmit(cleanedEntry, { type: 'entity', index }, nextConfig, inheritedSegmentSpace);
        return cleanedEntry;
      });
    }

    // Cleanup is optional. Compare normalized feature semantics at both scopes
    // before dropping explicit input; never emit the normalized runtime object.
    const meaning = (raw) => {
      const normalized = normalizeCardConfig({ ...raw, ...(!raw.entities && !raw.entity ? { entities: [] } : {}) });
      const featureKeys = ['layout', 'scale', 'bar', 'baseline', 'formatting', 'target_marker', 'peak_marker', 'floor_marker', 'generic_markers'];
      const scope = (value) => ({
        ...Object.fromEntries(featureKeys.map(key => [key, value[key]])),
        scale: Object.fromEntries(['min', 'max'].map(key => [key, {
          ...value.scale[key], fixed_explicit: value.scale[key].fixed_explicit !== false,
        }])),
      });
      const canonical = (value, key = '') => {
        if (Array.isArray(value)) return value.map(entry => canonical(entry));
        if (this._isObject(value)) return Object.fromEntries(Object.entries(value)
          .filter(([name]) => !['severity', 'segment_space', 'label_precision_key'].includes(name)
            && !/invalid/i.test(name))
          .map(([name, entry]) => [name, canonical(entry, name)]));
        if (key === 'fixed') return getNumericValue(null, value);
        if (/color/i.test(key) && typeof value === 'string') return this._normalizeColorComparisonValue(value);
        return value;
      };
      return this._serializeConfig(canonical({ card: scope(normalized), entities: normalized.entities.map(row => ({
        entity: row.entity, name: row.name, icon: row.icon, ...scope(row),
      })) }));
    };
    try {
      if (meaning(config) !== meaning(nextConfig)) nextConfig = this._cloneDeep(config);
    } catch (_error) {
      // An incomplete/unsupported draft cannot prove cleanup equivalence.
      nextConfig = this._cloneDeep(config);
    }
    return this._orderEditorConfigKeys(nextConfig);
  }

  _getScopedPath(scope, keyPath) {
    return getScopedPath(scope, keyPath);
  }

  _normalizePath(keyPath) {
    return normalizePath(keyPath);
  }

  _getEntityRawEntries() {
    if (Array.isArray(this._draftConfig.entities)) {
      return this._draftConfig.entities.map((entry) => (
        this._isObject(entry) ? this._cloneDeep(entry) : { entity: entry }
      ));
    }
    if (this._draftConfig.entity !== undefined) {
      return [{
        entity: this._draftConfig.entity,
        ...(this._draftConfig.name !== undefined ? { name: this._draftConfig.name } : {}),
        ...(this._draftConfig.icon !== undefined ? { icon: this._draftConfig.icon } : {}),
      }];
    }
    return [];
  }

  _withEntityScopeConfig(mutator) {
    const rawEntries = this._getEntityRawEntries();
    const nextEntries = mutator(rawEntries.map((entry) => this._cloneDeep(entry)));
    let nextConfig = this._setPathValue(this._draftConfig, ['entities'], nextEntries);
    if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
      nextConfig = this._deletePathValue(nextConfig, ['entity']);
      if (this._draftConfig.name !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['name']);
      }
      if (this._draftConfig.icon !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['icon']);
      }
    }
    return nextConfig;
  }

  _setEntityRowsRaw(nextRows, options = {}) {
    const normalizedRows = this._cloneDeep(nextRows);
    if (Array.isArray(this._draftConfig.entities) || this._draftConfig.entity === undefined || normalizedRows.length !== 1) {
      let nextConfig = this._setPathValue(this._draftConfig, ['entities'], normalizedRows);
      if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
        nextConfig = this._deletePathValue(nextConfig, ['entity']);
        nextConfig = this._deletePathValue(nextConfig, ['name']);
        nextConfig = this._deletePathValue(nextConfig, ['icon']);
      }
      return this._applyUserConfig(nextConfig, options);
    }

    const [row] = normalizedRows;
    if (typeof row === 'string') {
      let nextConfig = this._setPathValue(this._draftConfig, ['entity'], row);
      nextConfig = this._deletePathValue(nextConfig, ['name']);
      nextConfig = this._deletePathValue(nextConfig, ['icon']);
      return this._applyUserConfig(nextConfig, options);
    }

    let nextConfig = this._setPathValue(this._draftConfig, ['entity'], row?.entity ?? '');
    if (row && Object.prototype.hasOwnProperty.call(row, 'name')) {
      nextConfig = this._setPathValue(nextConfig, ['name'], row.name);
    } else {
      nextConfig = this._deletePathValue(nextConfig, ['name']);
    }
    if (row && Object.prototype.hasOwnProperty.call(row, 'icon')) {
      nextConfig = this._setPathValue(nextConfig, ['icon'], row.icon);
    } else {
      nextConfig = this._deletePathValue(nextConfig, ['icon']);
    }
    return this._applyUserConfig(nextConfig, options);
  }

  _moveEntityRow(index, direction) {
    const rows = this._getRawEntityRows();
    const nextIndex = index + direction;
    if (index < 0 || index >= rows.length || nextIndex < 0 || nextIndex >= rows.length) {
      return false;
    }
    const nextRows = this._cloneDeep(rows);
    [nextRows[index], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[index]];
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _duplicateEntityRow(index) {
    const rows = this._getRawEntityRows();
    if (index < 0 || index >= rows.length) {
      return false;
    }
    const sourceRow = this._cloneDeep(rows[index]);
    const duplicateRow = typeof sourceRow === 'string'
      ? { entity: sourceRow }
      : this._cloneDeep(sourceRow);
    if (this._isObject(duplicateRow) && typeof duplicateRow.name === 'string' && duplicateRow.name.trim()) {
      duplicateRow.name = `${duplicateRow.name.trim()} copy`;
    }
    const nextRows = this._cloneDeep(rows);
    nextRows.splice(index + 1, 0, duplicateRow);
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _removeEntityRow(index) {
    const rows = this._getRawEntityRows();
    if (rows.length <= 1 || index < 0 || index >= rows.length) {
      return false;
    }
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    return this._setEntityRowsRaw(nextRows, { rerender: true });
  }

  _getScopedValue(scope, keyPath) {
    if (scope?.type === 'entity') {
      const entry = this._getEntityRawEntries()[scope.index];
      return this._getPathValue(entry, this._normalizePath(keyPath));
    }
    return this._getPathValue(this._draftConfig, this._getScopedPath(scope, keyPath));
  }

  _removeScopedValue(scope, keyPath, options = {}) {
    if (scope?.type === 'entity') {
      const nextConfig = this._withEntityScopeConfig((entries) => {
        const entry = this._isObject(entries[scope.index]) ? { ...entries[scope.index] } : { entity: entries[scope.index]?.entity ?? '' };
        entries[scope.index] = this._deletePathValue(entry, this._normalizePath(keyPath));
        return entries;
      });
      return this._applyUserConfig(nextConfig, options);
    }
    return this._setValueAtPath(this._getScopedPath(scope, keyPath), undefined, options);
  }

  _applyScopedMutation(scope, mutator, options = {}) {
    if (scope?.type === 'entity') {
      const nextConfig = this._withEntityScopeConfig((entries) => {
        const rawEntry = entries[scope.index];
        const entry = this._isObject(rawEntry) ? this._cloneDeep(rawEntry) : { entity: rawEntry?.entity ?? '' };
        entries[scope.index] = mutator(entry);
        return entries;
      });
      return this._applyUserConfig(nextConfig, options);
    }
    const nextConfig = mutator(this._cloneDeep(this._draftConfig));
    return this._applyUserConfig(nextConfig, options);
  }

  _setScopedValue(scope, keyPath, value, options = {}) {
    return this._applyScopedMutation(scope, (target) => (
      this._setPathValue(target, this._normalizePath(keyPath), value)
    ), options);
  }

  _removePathsFromTarget(target, keyPaths = []) {
    return removePathsFromTarget(target, keyPaths);
  }

  _pruneEmptyObjectsInTarget(target, keyPath) {
    return pruneEmptyObjectsInTarget(target, keyPath);
  }

  _setCanonicalScopedValue(scope, canonicalPath, value, options = {}) {
    const { deprecatedKeys = [], prunePaths = [] } = options;
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._setPathValue(target, this._normalizePath(canonicalPath), value);
      nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
      const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
      pathsToPrune.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _removeCanonicalScopedValue(scope, canonicalPath, options = {}) {
    const { deprecatedKeys = [], prunePaths = [] } = options;
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, this._normalizePath(canonicalPath));
      nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
      const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
      pathsToPrune.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _setScopedNumericOverride(scope, keyPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeNumberValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._removeScopedValue(scope, keyPath, options);
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._setScopedValue(scope, keyPath, normalizedValue, options);
  }

  _setScopedTextOverride(scope, keyPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return this._removeScopedValue(scope, keyPath, options);
    }
    return this._setScopedValue(scope, keyPath, normalizedValue, options);
  }

  _setCanonicalScopedNumericOverride(scope, canonicalPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeNumberValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
      return this._removeCanonicalScopedValue(scope, canonicalPath, options);
    }
    return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
  }

  _setCanonicalScopedTextOverride(scope, canonicalPath, rawValue, options = {}) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, canonicalPath, options);
    }
    return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
  }

  _getResolvablePartsFromTarget(target, field, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const structuredValue = this._getPathValue(target, canonicalBasePath);
    const legacyFixedValue = this._getPathValue(target, legacyFixedPath);
    const legacyEntityValue = this._getPathValue(target, legacyEntityPath);
    if (structuredValue !== undefined) {
      const source = normalizeStructuredResolvableValue(structuredValue, options.inheritedSource ?? null, null, {
        allowPercent: ['target', 'baseline'].includes(canonicalBasePath[0]),
      });
      return {
        fixed: source.fixed ?? '', entity: source.entity ?? '',
        ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}),
      };
    }
    return {
      fixed: (!this._isObject(legacyFixedValue) && legacyFixedValue !== undefined) ? legacyFixedValue : '',
      entity: legacyEntityValue ?? '',
    };
  }

  _getResolvableScopedValue(scope, field, options = {}) {
    const target = scope?.type === 'entity'
      ? this._getEntityRawEntries()[scope.index]
      : this._draftConfig;
    return this._getResolvablePartsFromTarget(target ?? {}, field, options);
  }

  _getEffectiveResolvableScopedValue(scope, field, options = {}) {
    const localValue = this._getResolvableScopedValue(scope, field, options);
    if (scope?.type !== 'entity') {
      return localValue;
    }
    const inheritedValue = this._getResolvableScopedValue({ type: 'card' }, field, options);
    const target = this._getEntityRawEntries()[scope.index];
    if (this._getPathValue(target, options.canonicalBasePath ?? ['scale', field]) !== undefined) {
      return this._getResolvablePartsFromTarget(target, field, { ...options,
        inheritedSource: { fixed: inheritedValue.fixed === '' ? null : inheritedValue.fixed, entity: inheritedValue.entity || null, percent: inheritedValue.percent ?? null },
      });
    }
    return {
      fixed: this._hasExplicitOverrideValue(localValue.fixed) ? localValue.fixed : inheritedValue.fixed,
      entity: this._hasExplicitOverrideValue(localValue.entity) ? localValue.entity : inheritedValue.entity,
    };
  }

  _setCanonicalResolvablePart(scope, field, part, rawValue, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const prunePaths = options.prunePaths ?? [canonicalBasePath, canonicalBasePath.slice(0, -1)];
    const normalizedValue = part === 'fixed'
      ? this._normalizeNumberValue(rawValue)
      : this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      const currentParts = this._getResolvablePartsFromTarget(target ?? {}, field, {
        canonicalBasePath,
        legacyFixedPath,
        legacyEntityPath,
      });
      const nextParts = { ...currentParts };

      if (part === 'fixed') {
        if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
          delete nextParts.fixed;
        } else {
          nextParts.fixed = normalizedValue;
        }
      } else if (!normalizedValue) {
        delete nextParts.entity;
      } else {
        nextParts.entity = normalizedValue;
      }

      let nextTarget = this._cloneDeep(target);
      nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
      const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
      if (!this._isObject(legacyFixedValue)) {
        nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
      }
      nextTarget = this._deletePathValue(nextTarget, canonicalBasePath);

      const hasFixed = nextParts.fixed !== undefined && nextParts.fixed !== null && nextParts.fixed !== '';
      const hasEntity = nextParts.entity !== undefined && nextParts.entity !== null && nextParts.entity !== '';
      const hasPercent = Number.isFinite(nextParts.percent);
      if (hasFixed || hasEntity || hasPercent) {
        const nextValue = {};
        if (hasFixed) nextValue.fixed = nextParts.fixed;
        if (hasEntity) nextValue.entity = nextParts.entity;
        if (hasPercent) nextValue.percent = nextParts.percent;
        nextTarget = this._setPathValue(nextTarget, canonicalBasePath, nextValue);
      }

      prunePaths.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _clearCanonicalResolvableValue(scope, field, options = {}) {
    const canonicalBasePath = options.canonicalBasePath ?? ['scale', field];
    const legacyFixedPath = options.legacyFixedPath ?? [field];
    const legacyEntityPath = options.legacyEntityPath ?? [`${field}_entity`];
    const prunePaths = options.prunePaths ?? [canonicalBasePath, canonicalBasePath.slice(0, -1)];
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, canonicalBasePath);
      nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
      const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
      if (!this._isObject(legacyFixedValue)) {
        nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
      }
      prunePaths.forEach((path) => {
        if (path.length) {
          nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
        }
      });
      return nextTarget;
    }, options);
  }

  _getScopedDisplayValue(scope, canonicalPath, fallbackPaths = []) {
    const valuesToTry = [canonicalPath, ...fallbackPaths];
    for (const path of valuesToTry) {
      const value = this._getScopedValue(scope, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return '';
  }

  _getEffectiveScopedDisplayValue(...args) {
    return getEffectiveDisplayValue(this._createSectionContext(), ...args);
  }

  _paletteUi() {
    return {
      root: () => this.shadowRoot,
      render: () => this._render(),
      focus: selector => this._queuePostRenderFocus(selector),
    };
  }

  _applySectionMutation(scope, mutation, options) {
    if (options?.needleEdit?.field !== 'mode' || options.needleEdit.value === 'disabled'
      || scope?.type === 'entity' && options.needleEdit.value === 'inherit') {
      return this._applyScopedMutation(scope, mutation, options);
    }
    // Historical standalone editing policy; it is deliberately absent from the
    // shared Needle section and the Feature's mutation adapter.
    return this._applyScopedMutation(scope, target => {
      let nextTarget = mutation(target);
      const baselineEnabled = this._getPathValue(nextTarget, ['baseline', 'enabled']);
      const baselineParts = this._getResolvablePartsFromTarget(nextTarget ?? {}, 'baseline', {
        canonicalBasePath: ['baseline', 'at'],
        legacyFixedPath: ['baseline'],
        legacyEntityPath: ['baseline', 'at', 'entity'],
      });
      const baselineActive = baselineEnabled === true || (baselineEnabled !== false && this._hasResolvableOverride(baselineParts));
      if (baselineActive) {
        nextTarget = this._deletePathValue(nextTarget, ['baseline']);
      }
      return nextTarget;
    }, options);
  }

  _createSectionContext() {
    return {
      read: (scope, path) => this._getScopedValue(scope, path),
      mutate: (scope, mutation, options) => this._applySectionMutation(scope, mutation, options),
      source: (scope, key, effective = false) => {
        if (key?.type === 'reference-marker') return getReferenceMarkerSource(key.marker);
        const options = ['baseline', 'target'].includes(key) ? { canonicalBasePath: [key, 'at'], legacyFixedPath: [key], legacyEntityPath: key === 'target' ? ['target_entity'] : ['baseline', 'at', 'entity'] } : {};
        return effective ? this._getEffectiveResolvableScopedValue(scope, key, options) : this._getResolvableScopedValue(scope, key, options);
      },
      setSource: (scope, key, part, value) => key?.type === 'reference-marker'
        ? this._referenceMarkersSection._setGenericMarkerSourcePart(scope, key.index, part, value) : key === 'baseline'
        ? this._persistBaselineSourcePart(scope, part, value)
        : this._setCanonicalResolvablePart(scope, key, part, value, key === 'target' ? { canonicalBasePath: ['target', 'at'], legacyFixedPath: ['target'], legacyEntityPath: ['target_entity'], prunePaths: [['target', 'at'], ['target']] } : {}),
    };
  }

  _renderScaleSection(scope) {
    return renderScaleSection(this._createSectionContext(), scope);
  }

  _renderFormattingSection(scope) {
    return renderFormattingSection(this._createSectionContext(), scope);
  }

  _getScopedFormattingValue(scope, key) {
    return getFormattingValue(this._createSectionContext(), scope, key);
  }

  _getEffectiveScopedFormattingValue(scope, key) {
    return getEffectiveFormattingValue(this._createSectionContext(), scope, key);
  }

  _setScopedFormattingUnit(scope, rawValue) {
    return setFormattingUnit(this._createSectionContext(), scope, rawValue);
  }

  _setScopedFormattingDecimal(scope, rawValue) {
    return setFormattingDecimal(this._createSectionContext(), scope, rawValue);
  }

  _clearFormattingOverride(scope) {
    return clearFormattingOverride(this._createSectionContext(), scope);
  }

  _hasFormattingOverride(scope) {
    return hasFormattingOverride(this._createSectionContext(), scope);
  }

  _getScopedLayoutValue(scope, key) {
    if (key === 'height') {
      return this._getScopedValue(scope, ['layout', 'height'])
        ?? this._getScopedValue(scope, ['height'])
        ?? '';
    }
    if (key === 'position') {
      return this._getScopedValue(scope, ['layout', 'label', 'position'])
        ?? this._getScopedValue(scope, ['label_position'])
        ?? '';
    }
    if (key === 'width') {
      return this._getScopedValue(scope, ['layout', 'label', 'width'])
        ?? this._getScopedValue(scope, ['label_width'])
        ?? '';
    }
    if (key === 'hero_size') {
      return this._getScopedValue(scope, ['layout', 'hero', 'size'])
        ?? this._getScopedValue(scope, ['layout', 'label', 'hero_size'])
        ?? '';
    }
    if (key === 'value_size') {
      return this._getScopedValue(scope, ['layout', 'hero', 'value_size'])
        ?? '';
    }
    return '';
  }

  _getEffectiveScopedLayoutValue(scope, key) {
    if (key === 'height') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'height'], [['height']]);
    }
    if (key === 'position') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'label', 'position'], [['label_position']]);
    }
    if (key === 'width') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'label', 'width'], [['label_width']]);
    }
    if (key === 'hero_size') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'hero', 'size'], [['layout', 'label', 'hero_size']]);
    }
    if (key === 'value_size') {
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'hero', 'value_size']);
    }
    return '';
  }

  _setScopedLayoutLabelPosition(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'label', 'position'], {
        deprecatedKeys: [['label_position']],
        prunePaths: [['layout', 'label'], ['layout']],
        rerender: true,
      });
    }
    const didSet = this._setCanonicalScopedValue(scope, ['layout', 'label', 'position'], value, {
      deprecatedKeys: [['label_position']],
      prunePaths: [['layout', 'label'], ['layout']],
      rerender: true,
    });
    if (!didSet || value === 'hero') return didSet;
    this._removeCanonicalScopedValue(scope, ['layout', 'label', 'hero_size'], {
      prunePaths: [['layout', 'label'], ['layout']],
      rerender: true,
    });
    this._removeCanonicalScopedValue(scope, ['layout', 'hero'], {
      prunePaths: [['layout']],
      rerender: true,
    });
    return true;
  }

  _setLayoutLabelPosition(value) {
    return this._setScopedLayoutLabelPosition({ type: 'card' }, value);
  }

  _setScopedLayoutHeroSize(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'hero', 'size'], {
        deprecatedKeys: [['layout', 'label', 'hero_size']],
        prunePaths: [['layout', 'hero'], ['layout']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'hero', 'size'], value, {
      deprecatedKeys: [['layout', 'label', 'hero_size']],
      prunePaths: [['layout', 'hero'], ['layout']],
    });
  }

  _setLayoutHeroSize(value) {
    return this._setScopedLayoutHeroSize({ type: 'card' }, value);
  }

  _normalizeHeroValueSizeValue(value) {
    const numericValue = this._normalizeNumberValue(value);
    if (numericValue === null) return null;
    return Math.min(112, Math.max(12, numericValue));
  }

  _setScopedLayoutHeroValueSize(scope, value) {
    if (value === '' || value === null || value === undefined) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'hero', 'value_size'], {
        prunePaths: [['layout', 'hero'], ['layout']],
      });
    }
    const valueSize = this._normalizeHeroValueSizeValue(value);
    if (valueSize === null) return false;
    return this._setCanonicalScopedValue(scope, ['layout', 'hero', 'value_size'], valueSize, {
      prunePaths: [['layout', 'hero'], ['layout']],
    });
  }

  _setLayoutHeroValueSize(value) {
    return this._setScopedLayoutHeroValueSize({ type: 'card' }, value);
  }

  _setScopedLayoutHeight(scope, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (value === '' || value === null || value === undefined) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'height'], {
        deprecatedKeys: [['height']],
        prunePaths: [['layout']],
      });
    }
    if (numericValue === null || numericValue < 24) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'height'], numericValue, {
      deprecatedKeys: [['height']],
      prunePaths: [['layout']],
    });
  }

  _setLayoutHeight(value) {
    return this._setScopedLayoutHeight({ type: 'card' }, value);
  }

  _setScopedLayoutLabelWidth(scope, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (value === '' || value === null || value === undefined) {
      return this._removeCanonicalScopedValue(scope, ['layout', 'label', 'width'], {
        deprecatedKeys: [['label_width']],
        prunePaths: [['layout', 'label'], ['layout']],
      });
    }
    if (numericValue === null) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'label', 'width'], numericValue, {
      deprecatedKeys: [['label_width']],
      prunePaths: [['layout', 'label'], ['layout']],
    });
  }

  _clearLayoutOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['layout', 'height']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'label', 'position']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'label', 'hero_size']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'label', 'width']);
      nextTarget = this._deletePathValue(nextTarget, ['layout', 'hero']);
      nextTarget = this._deletePathValue(nextTarget, ['height']);
      nextTarget = this._deletePathValue(nextTarget, ['label_position']);
      nextTarget = this._deletePathValue(nextTarget, ['label_width']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['layout', 'label']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['layout']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasLayoutOverride(scope) {
    const layoutValue = this._getScopedValue(scope, ['layout']) ?? {};
    const labelValue = this._isObject(layoutValue) ? (layoutValue.label ?? {}) : {};
    if (this._isObject(layoutValue) && (
      Object.prototype.hasOwnProperty.call(layoutValue, 'height')
      || (this._isObject(labelValue) && (
        Object.prototype.hasOwnProperty.call(labelValue, 'position')
        || Object.prototype.hasOwnProperty.call(labelValue, 'hero_size')
        || Object.prototype.hasOwnProperty.call(labelValue, 'width')
      ))
    )) {
      return true;
    }
    if (this._isObject(layoutValue) && this._isObject(layoutValue.hero) && Object.keys(layoutValue.hero).length) {
      return true;
    }
    return this._getScopedValue(scope, ['height']) !== undefined
      || this._getScopedValue(scope, ['label_position']) !== undefined
      || this._getScopedValue(scope, ['label_width']) !== undefined;
  }

  _setScaleBound(key, value) {
    return setScalePart(this._createSectionContext(), { type: 'card' }, key, 'fixed', value);
  }

  _clearScaleOverride(scope) {
    return clearScaleOverride(this._createSectionContext(), scope);
  }

  _setBarFillStyle(value) {
    return this._setScopedBarFillStyle({ type: 'card' }, value);
  }

  _setBarColor(value) {
    return this._setScopedBarColor({ type: 'card' }, value);
  }

  _setGradientStops(...args) {
    return this._gradientStopsSection._setGradientStops(...args);
  }

  _setSegments(...args) {
    return this._segmentsSection._setSegments(...args);
  }

  _getDefaultGradientStops(...args) {
    return this._gradientStopsSection._getDefaultGradientStops(...args);
  }

  _normalizeGradientStopPosValue(...args) {
    return this._gradientStopsSection._normalizeGradientStopPosValue(...args);
  }

  _sanitizeGradientStopsForEmit(...args) {
    return this._gradientStopsSection._sanitizeGradientStopsForEmit(...args);
  }

  _getGradientStopDraftColorDefault(...args) {
    return this._gradientStopsSection._getGradientStopDraftColorDefault(...args);
  }

  _getNextSuggestedGradientStopPos(...args) {
    return this._gradientStopsSection._getNextSuggestedGradientStopPos(...args);
  }

  _getGradientStopsDraftKey(...args) {
    return this._gradientStopsSection._getGradientStopsDraftKey(...args);
  }

  _getGradientStopPosTextKey(...args) {
    return this._gradientStopsSection._getGradientStopPosTextKey(...args);
  }

  _getGradientStopPosText(...args) {
    return this._gradientStopsSection._getGradientStopPosText(...args);
  }

  _setGradientStopPosText(...args) {
    return this._gradientStopsSection._setGradientStopPosText(...args);
  }

  _clearGradientStopPosText(...args) {
    return this._gradientStopsSection._clearGradientStopPosText(...args);
  }

  _clearGradientStopScopeTextState(...args) {
    return this._gradientStopsSection._clearGradientStopScopeTextState(...args);
  }

  _getGradientStopsUiRows(...args) {
    return this._gradientStopsSection._getGradientStopsUiRows(...args);
  }

  _setGradientStopsUiRows(...args) {
    return this._gradientStopsSection._setGradientStopsUiRows(...args);
  }

  _getStoredScopedGradientStops(...args) {
    return this._gradientStopsSection._getStoredScopedGradientStops(...args);
  }

  _getFallbackGradientStops(...args) {
    return this._gradientStopsSection._getFallbackGradientStops(...args);
  }

  _createGradientStopDraftState(...args) {
    return this._gradientStopsSection._createGradientStopDraftState(...args);
  }

  _getGradientStopsDraftState(...args) {
    return this._gradientStopsSection._getGradientStopsDraftState(...args);
  }

  _setGradientStopsDraftState(...args) {
    return this._gradientStopsSection._setGradientStopsDraftState(...args);
  }

  _setGradientStopsDraftField(...args) {
    return this._gradientStopsSection._setGradientStopsDraftField(...args);
  }

  _getValidGradientDraftStop(...args) {
    return this._gradientStopsSection._getValidGradientDraftStop(...args);
  }

  _hasGradientStopDuplicate(...args) {
    return this._gradientStopsSection._hasGradientStopDuplicate(...args);
  }

  _canAddGradientStop(...args) {
    return this._gradientStopsSection._canAddGradientStop(...args);
  }

  _getGradientDraftValidationMessage(...args) {
    return this._gradientStopsSection._getGradientDraftValidationMessage(...args);
  }

  _isDefaultGradientStops(...args) {
    return this._gradientStopsSection._isDefaultGradientStops(...args);
  }

  _setScopedGradientStops(scope, stops, options = {}) {
    const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
    const shouldRemove = sanitizedStops.length < 2 || this._isDefaultGradientStops(sanitizedStops);
    const previousUiRowsJson = this._serializeConfig(this._getGradientStopsUiRows(scope) ?? []);
    this._clearGradientStopScopeTextState(scope);
    this._setGradientStopsUiRows(scope, sanitizedStops);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['gradient_stops']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'gradient_stops']);
      if (!shouldRemove) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'gradient_stops'], sanitizedStops);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, options);
    if (applied === false && options?.rerender && this._serializeConfig(sanitizedStops) !== previousUiRowsJson) {
      this._render();
    }
    if (applied !== false && !options?.rerender) {
      this._refreshGradientDraftUi(scope);
    }
    return applied;
  }

  _clearGradientStopsOverride(...args) {
    return this._gradientStopsSection._clearGradientStopsOverride(...args);
  }

  _setScopedSegments(scope, segments, options = {}) {
    const nextSegments = options?.sort === false ? this._cloneDeep(segments) : this._sortSegmentsForEditor(segments);
    const fallbackSegments = this._getFallbackSegments(scope);
    const shouldRemove = !Array.isArray(nextSegments)
      || !nextSegments.length
      || (fallbackSegments.length > 0 && this._segmentsEqualForEditor(nextSegments, fallbackSegments));
    this._setSegmentsUiRows(scope, nextSegments);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'segments']);
      nextTarget = this._deletePathValue(nextTarget, ['segments']);
      nextTarget = this._deletePathValue(nextTarget, ['severity']);
      if (!shouldRemove) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'segments'], nextSegments);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, options);
    if (applied !== false) {
      this._refreshSegmentUi(scope);
    }
    return applied;
  }

  _clearSegmentsOverride(...args) {
    return this._segmentsSection._clearSegmentsOverride(...args);
  }

  _setNeedle(...args) {
    return this._needleSection._setNeedle(...args);
  }

  _getScopedPeakConfig(...args) {
    return this._extremaSection._getScopedPeakConfig(...args);
  }

  _getEffectiveScopedPeakConfig(...args) {
    return this._extremaSection._getEffectiveScopedPeakConfig(...args);
  }

  _hasPeakOverride(...args) {
    return this._extremaSection._hasPeakOverride(...args);
  }

  _getPeakSummary(...args) {
    return this._extremaSection._getPeakSummary(...args);
  }

  _clearPeakOverride(...args) {
    return this._extremaSection._clearPeakOverride(...args);
  }

  _setScopedPeakEnabled(...args) {
    return this._extremaSection._setScopedPeakEnabled(...args);
  }

  _setScopedPeakColor(...args) {
    return this._extremaSection._setScopedPeakColor(...args);
  }

  _getScopedMarkerExtras(...args) {
    return this._extremaSection._getScopedMarkerExtras(...args);
  }

  _hasExtremumOverride(...args) {
    return this._extremaSection._hasExtremumOverride(...args);
  }

  _getEffectiveMarkerExtras(...args) {
    return this._extremaSection._getEffectiveMarkerExtras(...args);
  }

  _getScopedFloorConfig(...args) {
    return this._extremaSection._getScopedFloorConfig(...args);
  }

  _getEffectiveScopedFloorConfig(...args) {
    return this._extremaSection._getEffectiveScopedFloorConfig(...args);
  }

  _getFloorSummary(...args) {
    return this._extremaSection._getFloorSummary(...args);
  }

  _getMarkerResetSummary(...args) {
    return this._extremaSection._getMarkerResetSummary(...args);
  }

  _getCardTargetMarkerSummary(...args) {
    return this._targetSection._getCardTargetMarkerSummary(...args);
  }

  _setScopedExtremumEnabled(...args) {
    return this._extremaSection._setScopedExtremumEnabled(...args);
  }

  _setScopedExtremumColor(...args) {
    return this._extremaSection._setScopedExtremumColor(...args);
  }

  _setScopedExtremumReset(...args) {
    return this._extremaSection._setScopedExtremumReset(...args);
  }

  _setScopedExtremumLabelShow(...args) {
    return this._extremaSection._setScopedExtremumLabelShow(...args);
  }

  _setScopedExtremumLabelDecimal(...args) {
    return this._extremaSection._setScopedExtremumLabelDecimal(...args);
  }

  _getBuiltinMarkerLabelOptions(scope, key) {
    const show = key === 'target' ? this._getEffectiveTargetLabelShowValue(scope) : this._getEffectiveMarkerExtras(scope, key).labelShow;
    return getBuiltinMarkerLabelOptions(this._createSectionContext(), scope, key, show);
  }

  _renderBuiltinMarkerLabelControls(scope, key, title) {
    return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key));
  }

  _setBuiltinMarkerLabelField(...args) {
    return setBuiltinMarkerLabelField(this._createSectionContext(), ...args);
  }

  _clearFloorOverride(...args) {
    return this._extremaSection._clearFloorOverride(...args);
  }

  _setFixedMarkerValue(rootKey, enabled, value) {
    const numericValue = this._normalizeNumberValue(value);
    if (!enabled || numericValue === null) {
      return this._removeCanonicalScopedValue({ type: 'card' }, [rootKey, 'at', 'fixed'], {
        deprecatedKeys: rootKey === 'target' ? [['target_entity']] : [],
        prunePaths: [[rootKey, 'at'], [rootKey]],
      });
    }

    return this._setCanonicalScopedValue({ type: 'card' }, [rootKey, 'at', 'fixed'], numericValue, {
      deprecatedKeys: rootKey === 'target' ? [['target_entity']] : [],
      prunePaths: [[rootKey, 'at'], [rootKey]],
    });
  }

  _setPeakShow(...args) {
    return this._extremaSection._setPeakShow(...args);
  }

  _readFixedMarker(rootKey) {
    const rawValue = this._draftConfig[rootKey];
    if (this._isObject(rawValue)) {
      const fixed = this._isObject(rawValue?.at) ? rawValue.at.fixed : rawValue?.at;
      return {
        enabled: fixed !== undefined && fixed !== null && fixed !== '',
        value: fixed ?? '',
      };
    }
    return {
      enabled: rawValue !== undefined && rawValue !== null && rawValue !== '',
      value: rawValue ?? '',
    };
  }

  _getGradientStopsValue(...args) {
    return this._gradientStopsSection._getGradientStopsValue(...args);
  }

  _getSegmentsValue(...args) {
    return this._segmentsSection._getSegmentsValue(...args);
  }

  _getSegmentsScopeKey(...args) {
    return this._segmentsSection._getSegmentsScopeKey(...args);
  }

  _getSegmentBoundaryTextKey(...args) {
    return this._segmentsSection._getSegmentBoundaryTextKey(...args);
  }

  _getSegmentBoundaryText(...args) {
    return this._segmentsSection._getSegmentBoundaryText(...args);
  }

  _setSegmentBoundaryText(...args) {
    return this._segmentsSection._setSegmentBoundaryText(...args);
  }

  _clearSegmentBoundaryText(...args) {
    return this._segmentsSection._clearSegmentBoundaryText(...args);
  }

  _clearSegmentScopeTextState(...args) {
    return this._segmentsSection._clearSegmentScopeTextState(...args);
  }

  _getSegmentsUiRows(...args) {
    return this._segmentsSection._getSegmentsUiRows(...args);
  }

  _setSegmentsUiRows(...args) {
    return this._segmentsSection._setSegmentsUiRows(...args);
  }

  _getSegmentDraftState(...args) {
    return this._segmentsSection._getSegmentDraftState(...args);
  }

  _setSegmentDraftState(...args) {
    return this._segmentsSection._setSegmentDraftState(...args);
  }

  _setSegmentDraftField(...args) {
    return this._segmentsSection._setSegmentDraftField(...args);
  }

  _isSegmentFillStyle(...args) {
    return this._segmentsSection._isSegmentFillStyle(...args);
  }

  _getDefaultSegments(...args) {
    return this._segmentsSection._getDefaultSegments(...args);
  }

  _getStoredScopedSegments(...args) {
    return this._segmentsSection._getStoredScopedSegments(...args);
  }

  _parseSegmentBoundaryInput(...args) {
    return this._segmentsSection._parseSegmentBoundaryInput(...args);
  }

  _formatSegmentBoundaryValue(...args) {
    return this._segmentsSection._formatSegmentBoundaryValue(...args);
  }

  _getSegmentDraftColorDefault(...args) {
    return this._segmentsSection._getSegmentDraftColorDefault(...args);
  }

  _getNewSegmentDefaults(...args) {
    return this._segmentsSection._getNewSegmentDefaults(...args);
  }

  _createSegmentDraftState(...args) {
    return this._segmentsSection._createSegmentDraftState(...args);
  }

  _normalizeSegmentForEditorComparison(...args) {
    return this._segmentsSection._normalizeSegmentForEditorComparison(...args);
  }

  _segmentsEqualForEditor(...args) {
    return this._segmentsSection._segmentsEqualForEditor(...args);
  }

  _getFallbackSegments(...args) {
    return this._segmentsSection._getFallbackSegments(...args);
  }

  _parseSegmentBoundaryText(...args) {
    return this._segmentsSection._parseSegmentBoundaryText(...args);
  }

  _compareSegmentBoundaries(...args) {
    return this._segmentsSection._compareSegmentBoundaries(...args);
  }

  _buildSegmentValidationRows(...args) {
    return this._segmentsSection._buildSegmentValidationRows(...args);
  }

  _getSegmentRowValidationMessage(...args) {
    return this._segmentsSection._getSegmentRowValidationMessage(...args);
  }

  _getValidSegmentDraft(...args) {
    return this._segmentsSection._getValidSegmentDraft(...args);
  }

  _canAddSegment(...args) {
    return this._segmentsSection._canAddSegment(...args);
  }

  _getSegmentDraftValidationMessage(...args) {
    return this._segmentsSection._getSegmentDraftValidationMessage(...args);
  }

  _getSegmentPreviewBoundaryValue(...args) {
    return this._segmentsSection._getSegmentPreviewBoundaryValue(...args);
  }

  _sortSegmentsForEditor(...args) {
    return this._segmentsSection._sortSegmentsForEditor(...args);
  }

  _getSegmentPreviewRows(...args) {
    return this._segmentsSection._getSegmentPreviewRows(...args);
  }

  _buildEditorSegmentPreviewStyle(...args) {
    return this._segmentsSection._buildEditorSegmentPreviewStyle(...args);
  }

  _getSegmentPreviewDomIds(...args) {
    return this._segmentsSection._getSegmentPreviewDomIds(...args);
  }

  _renderSegmentPreview(...args) {
    return this._segmentsSection._renderSegmentPreview(...args);
  }

  _refreshSegmentPreview(...args) {
    return this._segmentsSection._refreshSegmentPreview(...args);
  }

  _getSegmentDomIds(...args) {
    return this._segmentsSection._getSegmentDomIds(...args);
  }

  _refreshSegmentUi(...args) {
    return this._segmentsSection._refreshSegmentUi(...args);
  }

  _commitSegmentDraft(...args) {
    return this._segmentsSection._commitSegmentDraft(...args);
  }

  _commitSegmentBoundaryEdit(...args) {
    return this._segmentsSection._commitSegmentBoundaryEdit(...args);
  }

  _commitGradientStopDraft(...args) {
    return this._gradientStopsSection._commitGradientStopDraft(...args);
  }

  _getGradientPreviewDomIds(...args) {
    return this._gradientStopsSection._getGradientPreviewDomIds(...args);
  }

  _refreshGradientDraftUi(...args) {
    return this._gradientStopsSection._refreshGradientDraftUi(...args);
  }

  _commitGradientStopPosEdit(...args) {
    return this._gradientStopsSection._commitGradientStopPosEdit(...args);
  }

  _getFillStyleValue() {
    return getEffectiveFillStyleValue(this._createSectionContext(), { type: 'card' });
  }

  _getFillStyleFromColorMode(colorMode) {
    return getFillStyleFromColorMode(colorMode);
  }

  _getScopedFillStyleValue(scope) {
    return getFillStyleValue(this._createSectionContext(), scope);
  }

  _getEffectiveScopedFillStyleValue(scope) {
    return getEffectiveFillStyleValue(this._createSectionContext(), scope);
  }

  _setScopedBarFillStyle(scope, rawValue) {
    return setBarFillStyle(this._createSectionContext(), scope, rawValue);
  }

  _getScopedBarColorValue(scope) {
    return getBarColorValue(this._createSectionContext(), scope);
  }

  _getEffectiveScopedBarColorValue(scope) {
    return getEffectiveBarColorValue(this._createSectionContext(), scope);
  }

  _setScopedBarColor(scope, rawValue) {
    return setBarColor(this._createSectionContext(), scope, rawValue);
  }

  _getScopedBarSolidFillValue(scope) {
    return getBarSolidFillValue(this._createSectionContext(), scope);
  }

  _getEffectiveScopedBarSolidFillValue(scope) {
    return getEffectiveBarSolidFillValue(this._createSectionContext(), scope);
  }

  _setScopedBarSolidFill(scope, value) {
    return setBarSolidFill(this._createSectionContext(), scope, value);
  }

  _clearEntityBarAppearance(scope) {
    return clearBarAppearanceOverride(this._createSectionContext(), scope);
  }

  _hasEntityBarAppearanceOverride(scope) {
    return hasBarAppearanceOverride(this._createSectionContext(), scope);
  }

  _getScopedNeedleConfig(...args) {
    return this._needleSection._getScopedNeedleConfig(...args);
  }

  _hasNeedleOverride(...args) {
    return this._needleSection._hasNeedleOverride(...args);
  }

  _getEffectiveScopedNeedleConfig(...args) {
    return this._needleSection._getEffectiveScopedNeedleConfig(...args);
  }

  _setScopedNeedleMode(...args) {
    return this._needleSection._setScopedNeedleMode(...args);
  }

  _setScopedNeedleColor(...args) {
    return this._needleSection._setScopedNeedleColor(...args);
  }

  _getNeedleValue(...args) {
    return this._needleSection._getNeedleValue(...args);
  }

  _getPeakShowValue(...args) {
    return this._extremaSection._getPeakShowValue(...args);
  }

  _getScaleFixedValue(key, fallbackKey) {
    return getScaleFixedValue(this._createSectionContext(), key);
  }

  _getScaleEntityValue(key) {
    return getScaleEntityValue(this._createSectionContext(), key);
  }

  _getTargetResolvableValue(...args) {
    return this._targetSection._getTargetResolvableValue(...args);
  }

  _getEffectiveTargetResolvableValue(...args) {
    return this._targetSection._getEffectiveTargetResolvableValue(...args);
  }

  _getTargetMode(...args) {
    return this._targetSection._getTargetMode(...args);
  }

  _getTargetShapeValue(...args) {
    return this._targetSection._getTargetShapeValue(...args);
  }

  _getEffectiveMarkerDirection(...args) {
    return getEffectiveMarkerDirection(this._createSectionContext(), ...args);
  }

  _setMarkerDirection(...args) {
    return setMarkerDirection(this._createSectionContext(), ...args);
  }

  _hasTargetShape(...args) {
    return this._targetSection._hasTargetShape(...args);
  }

  _getEffectiveTargetShapeValue(...args) {
    return this._targetSection._getEffectiveTargetShapeValue(...args);
  }

  _setTargetShape(...args) {
    return this._targetSection._setTargetShape(...args);
  }

  _getEffectiveTargetMode(...args) {
    return this._targetSection._getEffectiveTargetMode(...args);
  }

  _setTargetMode(...args) {
    return this._targetSection._setTargetMode(...args);
  }

  _setTargetResolvablePart(...args) {
    return this._targetSection._setTargetResolvablePart(...args);
  }

  _clearTargetOverride(...args) {
    return this._targetSection._clearTargetOverride(...args);
  }

  _getTargetColorValue(...args) {
    return this._targetSection._getTargetColorValue(...args);
  }

  _getEffectiveTargetColorValue(...args) {
    return this._targetSection._getEffectiveTargetColorValue(...args);
  }

  _hasCustomTargetColor(...args) {
    return this._targetSection._hasCustomTargetColor(...args);
  }

  _setTargetColor(...args) {
    return this._targetSection._setTargetColor(...args);
  }

  _getTargetLabelShowValue(...args) {
    return this._targetSection._getTargetLabelShowValue(...args);
  }

  _getEffectiveTargetLabelShowValue(...args) {
    return this._targetSection._getEffectiveTargetLabelShowValue(...args);
  }

  _setTargetLabelShow(...args) {
    return this._targetSection._setTargetLabelShow(...args);
  }

  _getTargetLabelDecimalValue(...args) {
    return this._targetSection._getTargetLabelDecimalValue(...args);
  }

  _getEffectiveTargetLabelDecimalValue(...args) {
    return this._targetSection._getEffectiveTargetLabelDecimalValue(...args);
  }

  _setTargetLabelDecimal(...args) {
    return this._targetSection._setTargetLabelDecimal(...args);
  }

  _getTargetAboveFillColorValue(...args) {
    return this._targetSection._getTargetAboveFillColorValue(...args);
  }

  _getTargetAboveFillDraftKey(...args) {
    return this._targetSection._getTargetAboveFillDraftKey(...args);
  }

  _setTargetAboveFillDraft(...args) {
    return this._targetSection._setTargetAboveFillDraft(...args);
  }

  _getTargetAboveFillDraft(...args) {
    return this._targetSection._getTargetAboveFillDraft(...args);
  }

  _getBaselineColorDraftKey(...args) {
    return this._baselineSection._getBaselineColorDraftKey(...args);
  }

  _setBaselineColorDraft(...args) {
    return this._baselineSection._setBaselineColorDraft(...args);
  }

  _getBaselineColorDraft(...args) {
    return this._baselineSection._getBaselineColorDraft(...args);
  }

  _getEffectiveTargetAboveFillColorValue(...args) {
    return this._targetSection._getEffectiveTargetAboveFillColorValue(...args);
  }

  _setTargetAboveFillColor(...args) {
    return this._targetSection._setTargetAboveFillColor(...args);
  }

  _isTargetAboveFillEnabled(...args) {
    return this._targetSection._isTargetAboveFillEnabled(...args);
  }

  _setTargetAboveFillEnabled(...args) {
    return this._targetSection._setTargetAboveFillEnabled(...args);
  }

  _isBaselineDirectionalColorEnabled(...args) {
    return this._baselineSection._isBaselineDirectionalColorEnabled(...args);
  }

  _setBaselineDirectionalColorEnabled(...args) {
    return this._baselineSection._setBaselineDirectionalColorEnabled(...args);
  }

  _hasTargetOverride(...args) {
    return this._targetSection._hasTargetOverride(...args);
  }

  _getBaselineResolvableValue(...args) {
    return this._baselineSection._getBaselineResolvableValue(...args);
  }

  _getEffectiveBaselineResolvableValue(...args) {
    return this._baselineSection._getEffectiveBaselineResolvableValue(...args);
  }

  _getBaselineMode(...args) {
    return this._baselineSection._getBaselineMode(...args);
  }

  _getEffectiveBaselineMode(...args) {
    return this._baselineSection._getEffectiveBaselineMode(...args);
  }

  _setBaselineMode(...args) {
    return this._baselineSection._setBaselineMode(...args);
  }

  _persistBaselineSourcePart(scope, part, rawValue) {
    const normalizedValue = part === 'fixed'
      ? this._normalizeNumberValue(rawValue)
      : this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      const currentParts = this._getResolvablePartsFromTarget(target ?? {}, 'baseline', {
        canonicalBasePath: ['baseline', 'at'],
        legacyFixedPath: ['baseline'],
        legacyEntityPath: ['baseline', 'at', 'entity'],
      });
      const nextParts = { ...currentParts };

      if (part === 'fixed') {
        if (rawValue === '' || rawValue === null || rawValue === undefined || normalizedValue === null) {
          delete nextParts.fixed;
        } else {
          nextParts.fixed = normalizedValue;
        }
      } else if (!normalizedValue) {
        delete nextParts.entity;
      } else {
        nextParts.entity = normalizedValue;
      }

      let nextTarget = this._cloneDeep(target);
      nextTarget = this._deletePathValue(nextTarget, ['baseline', 'at']);

      const hasFixed = nextParts.fixed !== undefined && nextParts.fixed !== null && nextParts.fixed !== '';
      const hasEntity = nextParts.entity !== undefined && nextParts.entity !== null && nextParts.entity !== '';
      if (hasFixed || hasEntity) {
        const nextValue = {};
        if (hasFixed) nextValue.fixed = nextParts.fixed;
        if (hasEntity) nextValue.entity = nextParts.entity;
        nextTarget = this._setPathValue(nextTarget, ['baseline', 'at'], nextValue);
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'at']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    });
  }

  _setBaselineResolvablePart(...args) {
    return this._baselineSection._setBaselineResolvablePart(...args);
  }

  _removeScopedNeedle(...args) {
    return this._needleSection._removeScopedNeedle(...args);
  }

  _setBaselineDirectionalColor(...args) {
    return this._baselineSection._setBaselineDirectionalColor(...args);
  }

  _getBaselineDirectionalColorValue(...args) {
    return this._baselineSection._getBaselineDirectionalColorValue(...args);
  }

  _getEffectiveBaselineDirectionalColorValue(...args) {
    return this._baselineSection._getEffectiveBaselineDirectionalColorValue(...args);
  }

  _clearBaselineOverride(...args) {
    return this._baselineSection._clearBaselineOverride(...args);
  }

  _removeBaseline(...args) {
    return this._baselineSection._removeBaseline(...args);
  }

  _hasBaselineOverride(...args) {
    return this._baselineSection._hasBaselineOverride(...args);
  }

  _isEntityOverrideExpanded(index) {
    return this._expandedEntityOverrides.has(index);
  }

  _toggleEntityOverrideExpanded(index) {
    if (this._expandedEntityOverrides.has(index)) {
      this._expandedEntityOverrides.delete(index);
    } else {
      this._expandedEntityOverrides.add(index);
    }
    this._render();
  }

  _syncExpandedEntityOverrides(entityCount) {
    const nextExpanded = new Set();
    this._expandedEntityOverrides.forEach((index) => {
      if (index < entityCount) nextExpanded.add(index);
    });
    this._expandedEntityOverrides = nextExpanded;
    const nextGroups = new Set();
    this._expandedOverrideGroups.forEach((key) => {
      const [indexText, group] = String(key).split(':');
      const index = Number(indexText);
      if (Number.isInteger(index) && index < entityCount && group) {
        nextGroups.add(`${index}:${group}`);
      }
    });
    this._expandedOverrideGroups = nextGroups;
  }

  _isCardGroupExpanded(group) {
    return this._expandedCardGroups.has(group);
  }

  _toggleCardGroupExpanded(group) {
    if (this._expandedCardGroups.has(group)) {
      this._expandedCardGroups.delete(group);
    } else {
      this._expandedCardGroups.add(group);
    }
    this._render();
  }

  _toggleGenericMarkerExpanded(...args) {
    return this._referenceMarkersSection._toggleGenericMarkerExpanded(...args);
  }

  _getOverrideGroupKey(index, group) {
    return `${index}:${group}`;
  }

  _isOverrideGroupExpanded(index, group) {
    return this._expandedOverrideGroups.has(this._getOverrideGroupKey(index, group));
  }

  _toggleOverrideGroupExpanded(index, group) {
    const key = this._getOverrideGroupKey(index, group);
    if (this._expandedOverrideGroups.has(key)) {
      this._expandedOverrideGroups.delete(key);
    } else {
      this._expandedOverrideGroups.add(key);
    }
    this._render();
  }

  _hasExplicitOverrideValue(...args) {
    return hasExplicitOverrideValue(...args);
  }

  _hasResolvableOverride(...args) {
    return hasResolvableOverride(...args);
  }

  _getScaleOverrideSummary(scope) {
    return getScaleOverrideSummary(this._createSectionContext(), scope);
  }

  _getLayoutSummary(scope) {
    const parts = [];
    const height = this._getScopedLayoutValue(scope, 'height');
    const position = this._getScopedLayoutValue(scope, 'position');
    const width = this._getScopedLayoutValue(scope, 'width');
    if (height !== '') parts.push(`Height ${height}`);
    if (position !== '') parts.push(`${position}`);
    if (width !== '') parts.push(`Width ${width}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getTargetOverrideSummary(...args) {
    return this._targetSection._getTargetOverrideSummary(...args);
  }

  _getBaselineOverrideSummary(...args) {
    return this._baselineSection._getBaselineOverrideSummary(...args);
  }

  _getCardBaselineSummary(...args) {
    return this._baselineSection._getCardBaselineSummary(...args);
  }

  _getBarAppearanceSummary(scope) {
    return getBarAppearanceSummary(this._createSectionContext(), scope);
  }

  _getScopedSegmentsValue(...args) {
    return this._segmentsSection._getScopedSegmentsValue(...args);
  }

  _hasSegmentsOverride(...args) {
    return this._segmentsSection._hasSegmentsOverride(...args);
  }

  _getSegmentsSummary(...args) {
    return this._segmentsSection._getSegmentsSummary(...args);
  }

  _getEffectiveFillStyleValue(scope) {
    return getEffectiveFillStyleValue(this._createSectionContext(), scope);
  }

  _getScopedGradientStopsValue(...args) {
    return this._gradientStopsSection._getScopedGradientStopsValue(...args);
  }

  _hasGradientStopsOverride(...args) {
    return this._gradientStopsSection._hasGradientStopsOverride(...args);
  }

  _getGradientStopsSummary(...args) {
    return this._gradientStopsSection._getGradientStopsSummary(...args);
  }

  _buildGradientPreviewEffectiveStops(...args) {
    return this._gradientStopsSection._buildGradientPreviewEffectiveStops(...args);
  }

  _buildEditorGradientPreviewStyle(...args) {
    return this._gradientStopsSection._buildEditorGradientPreviewStyle(...args);
  }

  _getGradientPreviewStyle(...args) {
    return this._gradientStopsSection._getGradientPreviewStyle(...args);
  }

  _renderGradientPreview(...args) {
    return this._gradientStopsSection._renderGradientPreview(...args);
  }

  _getNeedleSummary(...args) {
    return this._needleSection._getNeedleSummary(...args);
  }

  _getFormattingSummary(scope) {
    return getFormattingSummary(this._createSectionContext(), scope);
  }

  _renderOverrideGroup({ index, group, title, summary, content }) {
    const expanded = this._isOverrideGroupExpanded(index, group);
    return `
      <div class="override-group" data-group="${group}" data-expanded="${expanded ? 'true' : 'false'}">
        <button
          type="button"
          id="entity-${index}-group-${group}"
          class="override-group-toggle"
          data-action="toggle-override-group"
          data-index="${index}"
          data-group="${group}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <span
            id="entity-${index}-group-${group}-title"
            class="override-group-title"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${expanded ? '▾' : '▸'} ${title}</span>
          <span
            id="entity-${index}-group-${group}-summary"
            class="override-group-summary"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${this._escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? 'grid' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }

  _renderCardGroup(options) {
    return renderCardGroup(options, this._isCardGroupExpanded(options.group));
  }

  _renderEntityInput(entry, index) {
    return renderEntityInput(entry, index);
  }

  _renderEntitySourceInput(kind, index, value, placeholder = 'sensor.example', extraDataset = {}) {
    return renderEntitySourceInput(kind, index, value, placeholder, extraDataset);
  }

  _hasMarkersOverride(...args) {
    return this._referenceMarkersSection._hasMarkersOverride(...args);
  }

  _getGenericMarkers(...args) {
    return this._referenceMarkersSection._getGenericMarkers(...args);
  }

  _getGenericMarkersSummary(...args) {
    return this._referenceMarkersSection._getGenericMarkersSummary(...args);
  }

  _getGenericMarkerScopeKey(...args) {
    return this._referenceMarkersSection._getGenericMarkerScopeKey(...args);
  }

  _getGenericMarkerUiIds(...args) {
    return this._referenceMarkersSection._getGenericMarkerUiIds(...args);
  }

  _resetGenericMarkerUiScope(...args) {
    return this._referenceMarkersSection._resetGenericMarkerUiScope(...args);
  }

  _getGenericMarkerSummary(...args) {
    return this._referenceMarkersSection._getGenericMarkerSummary(...args);
  }

  _refreshGenericMarkerSummary(...args) {
    return this._referenceMarkersSection._refreshGenericMarkerSummary(...args);
  }

  _getGenericMarkerSource(...args) {
    return this._referenceMarkersSection._getGenericMarkerSource(...args);
  }

  _renderGenericMarkersEditor(...args) {
    return this._referenceMarkersSection._renderGenericMarkersEditor(...args);
  }

  _getGenericMarkerScope(...args) {
    return this._referenceMarkersSection._getGenericMarkerScope(...args);
  }

  _setGenericMarkerList(...args) {
    return this._referenceMarkersSection._setGenericMarkerList(...args);
  }

  _updateGenericMarker(...args) {
    return this._referenceMarkersSection._updateGenericMarker(...args);
  }

  _setGenericMarkerSourceMode(...args) {
    return this._referenceMarkersSection._setGenericMarkerSourceMode(...args);
  }

  _setGenericMarkerField(...args) {
    return this._referenceMarkersSection._setGenericMarkerField(...args);
  }

  _cleanupGenericMarkersForEmit(target) {
    if (!this._isObject(target) || !Array.isArray(target.markers)) return target;
    const nextTarget = this._cloneDeep(target);
    nextTarget.markers = nextTarget.markers.map((rawMarker) => {
      if (!this._isObject(rawMarker)) return rawMarker;
      const marker = this._cloneDeep(rawMarker);
      if (marker.show_marker === true) delete marker.show_marker;
      if (this._isObject(marker.at)) {
        const at = this._cloneDeep(marker.at);
        const fixed = this._normalizeNumberValue(at.fixed);
        const entity = this._normalizeTextValue(at.entity).trim();
        if (fixed !== null) at.fixed = fixed;
        else delete at.fixed;
        if (entity) at.entity = entity;
        else delete at.entity;
        if (Object.keys(at).length) marker.at = at;
        else delete marker.at;
      }
      if (marker.lane === 'below') delete marker.lane;
      if (marker.shape === 'circle') delete marker.shape;
      if (marker.direction === 'inward') delete marker.direction;
      if (this._normalizeColorComparisonValue(marker.color) === this._normalizeColorComparisonValue('#888888')) delete marker.color;
      if (this._isObject(marker.label)) {
        const label = this._cloneDeep(marker.label);
        if (label.show === false) delete label.show;
        if (label.show_value === true) delete label.show_value;
        if (label.show_unit === true) delete label.show_unit;
        if (typeof label.text === 'string') {
          label.text = label.text.replace(/\s+/g, ' ').trim();
          if (!label.text) delete label.text;
        }
        const precision = this._normalizeDecimalValue(label.precision ?? label.decimal);
        delete label.decimal;
        if (precision === null) delete label.precision;
        else label.precision = precision;
        delete label.unit;
        if (Object.keys(label).length) marker.label = label;
        else delete marker.label;
      }
      return marker;
    });
    return nextTarget;
  }

  _renderResetOptions(value) {
    return renderResetOptions(value);
  }

  _escapeAttribute(value) {
    return escapeAttribute(value);
  }

  _isHexColorValue(value) {
    return isHexColorValue(value);
  }

  _expandHexColor(value) {
    return expandHexColor(value);
  }

  _normalizeColorComparisonValue(value) {
    return normalizeColorComparisonValue(value);
  }

  _getColorPickerValue(value, fallbackHex = '#000000') {
    return getColorPickerValue(value, fallbackHex);
  }

  _renderColorInput(options) {
    return renderColorInput(options);
  }

  _renderListRows(items, renderItem) {
    return items.map((item, index) => renderItem(item, index)).join('');
  }

  _render() {
    if (!this.shadowRoot || this._isRendering) return;
    this._isRendering = true;
    try {
      const entities = this._getEntitiesValue();
      const fillStyle = this._getFillStyleValue();
      const layoutLabelPosition = this._getScopedLayoutValue({ type: 'card' }, 'position') || 'left';
      const layoutHeroSize = this._getScopedLayoutValue({ type: 'card' }, 'hero_size') || 'medium';
      const layoutHeroValueSize = this._getScopedLayoutValue({ type: 'card' }, 'value_size');
      const layoutHeight = this._getScopedLayoutValue({ type: 'card' }, 'height');
      const layoutLabelWidth = this._getScopedLayoutValue({ type: 'card' }, 'width');
      this._syncExpandedEntityOverrides(entities.length);

      this.shadowRoot.innerHTML = `
	      <style>${editorStyles}</style>
	      <div class="editor">
	        <div class="section">
	          <div class="section-head">
	            <h3>Basics</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="title">Title</label>
              <input id="title" type="text" data-field="title" value="${this._escapeAttribute(this._draftConfig.title ?? '')}">
            </div>
	          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Entities</h3>
	            <div class="section-note">Overrides replace card defaults only for this entity.</div>
	          </div>
	          <div class="field-grid">
              <div class="list">
	                ${this._renderListRows(entities, (entry, index) => `
	                  <div class="entity-shell" data-entity-shell-index="${index}">
	                    <div class="entity-main">
	                      <div class="entity-header">
	                        <div class="entity-header-main">
	                          <div class="entity-title">Entity ${index + 1}</div>
	                          <div class="entity-subtitle">${this._escapeAttribute(entry.entity || 'Configure entity')}</div>
	                        </div>
	                        <div class="entity-actions">
	                          <button type="button" data-action="move-entity-up" data-index="${index}"${index === 0 ? ' disabled' : ''} aria-label="Move entity ${index + 1} up">↑</button>
	                          <button type="button" data-action="move-entity-down" data-index="${index}"${index === entities.length - 1 ? ' disabled' : ''} aria-label="Move entity ${index + 1} down">↓</button>
	                          <button type="button" data-action="duplicate-entity" data-index="${index}">Duplicate</button>
	                          <button type="button" data-action="remove-entity" data-index="${index}"${entities.length <= 1 ? ' disabled' : ''} aria-label="Remove" title="Remove">🗑</button>
	                        </div>
	                      </div>
	                      <div class="entity-fields">
	                        ${this._renderEntityInput(entry, index)}
	                        <input type="text" data-kind="entity-name" data-index="${index}" value="${this._escapeAttribute(entry.name ?? '')}" placeholder="Name">
	                        <input type="text" data-kind="entity-icon" data-index="${index}" value="${this._escapeAttribute(entry.icon ?? '')}" placeholder="mdi:flash" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">
	                      </div>
	                    </div>
	                    <button type="button" class="override-toggle" data-action="toggle-entity-overrides" data-index="${index}" aria-expanded="${this._isEntityOverrideExpanded(index) ? 'true' : 'false'}">
	                      ${this._isEntityOverrideExpanded(index) ? '▾' : '▸'} Overrides
	                    </button>
                    <div class="override-panel" style="display:${this._isEntityOverrideExpanded(index) ? 'grid' : 'none'};">
                      <div class="section-note">Overrides replace card defaults only for this entity.</div>
                      ${(() => {
                        const scope = { type: 'entity', index };
	                        const targetInherited = !this._hasTargetOverride(scope);
	                        const layoutInherited = !this._hasLayoutOverride(scope);
	                        const peakInherited = !this._hasPeakOverride(scope);
                        const floorInherited = !this._hasExtremumOverride(scope, 'floor');
	                        const scaleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'scale',
	                          title: 'Scale',
	                          summary: this._getScaleOverrideSummary(scope),
	                          content: this._renderScaleSection(scope),
	                        });
	                        const layoutGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'layout',
	                          title: 'Layout',
	                          summary: this._getLayoutSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-layout-inherit" type="checkbox" data-kind="entity-layout-inherit" data-index="${index}"${layoutInherited ? ' checked' : ''}>
                          <label for="entity-${index}-layout-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-height">Row height</label>
	                        <input id="entity-${index}-height" type="number" min="24" step="1" data-kind="entity-override-height" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'height'))}" placeholder="inherit card default">
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-label-position">Label position</label>
	                        <select id="entity-${index}-label-position" data-kind="entity-layout-label-position" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'position'))}">
                          <option value=""${this._getEffectiveScopedLayoutValue(scope, 'position') === '' ? ' selected' : ''}>inherit card default</option>
                          <option value="left"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'left' ? ' selected' : ''}>left</option>
                          <option value="above"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'above' ? ' selected' : ''}>above</option>
                          <option value="inside"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'inside' ? ' selected' : ''}>inside</option>
                          <option value="hero"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'hero' ? ' selected' : ''}>hero</option>
                          <option value="off"${this._getEffectiveScopedLayoutValue(scope, 'position') === 'off' ? ' selected' : ''}>off</option>
                        </select>
                      </div>
                      ${(this._getEffectiveScopedLayoutValue(scope, 'position') || '') === 'hero' ? `
                      <div class="field-row">
                        <label for="entity-${index}-label-hero-size">Hero size</label>
                        <select id="entity-${index}-label-hero-size" data-kind="entity-layout-label-hero-size" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'hero_size') || 'medium')}">
                          <option value="small"${(this._getEffectiveScopedLayoutValue(scope, 'hero_size') || 'medium') === 'small' ? ' selected' : ''}>small</option>
                          <option value="medium"${(this._getEffectiveScopedLayoutValue(scope, 'hero_size') || 'medium') === 'medium' ? ' selected' : ''}>medium</option>
                          <option value="large"${(this._getEffectiveScopedLayoutValue(scope, 'hero_size') || 'medium') === 'large' ? ' selected' : ''}>large</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-hero-value-size">Maximum font size</label>
                        <input id="entity-${index}-hero-value-size" type="number" min="12" max="112" step="1" data-kind="entity-layout-hero-value-size" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'value_size'))}" placeholder="use Hero size preset">
                        <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
                      </div>
                      ` : ''}
	                      <div class="field-row">
	                        <label for="entity-${index}-label-width">Label width</label>
	                        <input id="entity-${index}-label-width" type="number" step="1" data-kind="entity-layout-label-width" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, 'width'))}" placeholder="inherit card default">
	                      </div>
	                          `,
	                        });
	                        const barGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'bar',
	                          title: 'Bar Appearance',
	                          summary: this._getBarAppearanceSummary(scope),
	                          content: renderBarAppearanceSection(this._createSectionContext(), scope),
	                        });
	                        const needleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'needle',
	                          title: 'Needle',
	                          summary: this._getNeedleSummary(scope),
	                          content: this._needleSection.render(scope),
	                        });
	                        const formattingGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'formatting',
	                          title: 'Formatting',
	                          summary: this._getFormattingSummary(scope),
	                          content: this._renderFormattingSection(scope),
	                        });
                        const peakGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'peak',
	                          title: 'Peak',
	                          summary: this._getPeakSummary(scope),
	                          content: this._extremaSection.render(scope, 'peak'),
                        });
                        const floorGroup = this._renderOverrideGroup({
                          index,
                          group: 'floor',
                          title: 'Floor',
                          summary: this._getFloorSummary(scope),
                          content: this._extremaSection.render(scope, 'floor'),
                        });
	                        const markersGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'markers',
	                          title: 'Reference markers',
	                          summary: this._getGenericMarkersSummary(scope),
	                          content: this._renderGenericMarkersEditor(scope),
	                        });
	                        const segmentsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'segments',
	                          title: 'Segments',
	                          summary: this._getSegmentsSummary(scope),
	                          content: this._segmentsSection.render(scope),
	                        });
	                        const gradientStopsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'gradient-stops',
	                          title: 'Gradient Stops',
	                          summary: this._getGradientStopsSummary(scope),
	                          content: this._gradientStopsSection.render(scope),
	                        });
	                        const baselineGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'baseline',
	                          title: 'Baseline',
	                          summary: this._getBaselineOverrideSummary(scope),
	                          content: this._baselineSection.render(scope),
	                        });
	                        const targetGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'target',
	                          title: 'Target',
	                          summary: this._getTargetOverrideSummary(scope),
	                          content: this._targetSection.render(scope),
	                        });
	                        return `
                          ${scaleGroup}
                          ${targetGroup}
                          ${peakGroup}
                          ${floorGroup}
                          ${markersGroup}
                          ${barGroup}
                          ${baselineGroup}
                          ${needleGroup}
	                          ${segmentsGroup}
	                          ${gradientStopsGroup}
	                          ${layoutGroup}
	                          ${formattingGroup}
	                        `;
	                      })()}
	                    </div>
                  </div>
                `)}
                <button type="button" data-action="add-entity">Add entity</button>
              </div>
          </div>
	        </div>

${this._renderScaleSection({ type: 'card' })}

${renderMarkersSection({
  renderGroup: options => this._renderCardGroup(options),
  target: { summary: this._getCardTargetMarkerSummary(), content: this._targetSection.render({ type: 'card' }) },
  peak: { summary: this._getMarkerResetSummary('peak'), content: this._extremaSection.render({ type: 'card' }, 'peak') },
  floor: { summary: this._getMarkerResetSummary('floor'), content: this._extremaSection.render({ type: 'card' }, 'floor') },
  references: { summary: this._getGenericMarkersSummary({ type: 'card' }), content: this._renderGenericMarkersEditor({ type: 'card' }) },
})}

${renderBarAppearanceSection(this._createSectionContext(), { type: 'card' }, () => `${this._baselineSection.render({ type: 'card' }, options => this._renderCardGroup(options))}${this._needleSection.render({ type: 'card' })}`)}

${this._segmentsSection.render({ type: 'card' }, options => this._renderCardGroup(options))}

${this._gradientStopsSection.render({ type: 'card' }, options => this._renderCardGroup(options))}

	        <div class="section">
	          <div class="section-head">
	            <h3>Layout</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="layout-height">Row height</label>
              <input id="layout-height" type="number" min="24" step="1" data-field="layout-height" value="${this._escapeAttribute(layoutHeight)}">
            </div>
            <div class="field-row">
              <label for="layout-label-position">Label position</label>
              <select id="layout-label-position" data-field="layout-label-position" value="${this._escapeAttribute(layoutLabelPosition)}">
                <option value="left"${layoutLabelPosition === 'left' ? ' selected' : ''}>left</option>
                <option value="above"${layoutLabelPosition === 'above' ? ' selected' : ''}>above</option>
                <option value="inside"${layoutLabelPosition === 'inside' ? ' selected' : ''}>inside</option>
                <option value="hero"${layoutLabelPosition === 'hero' ? ' selected' : ''}>hero</option>
                <option value="off"${layoutLabelPosition === 'off' ? ' selected' : ''}>off</option>
              </select>
            </div>
            ${layoutLabelPosition === 'hero' ? `
            <div class="field-row">
              <label for="layout-label-hero-size">Hero size</label>
              <select id="layout-label-hero-size" data-field="layout-label-hero-size" value="${this._escapeAttribute(layoutHeroSize)}">
                <option value="small"${layoutHeroSize === 'small' ? ' selected' : ''}>small</option>
                <option value="medium"${layoutHeroSize === 'medium' ? ' selected' : ''}>medium</option>
                <option value="large"${layoutHeroSize === 'large' ? ' selected' : ''}>large</option>
              </select>
            </div>
            <div class="field-row">
              <label for="layout-hero-value-size">Maximum font size</label>
              <input id="layout-hero-value-size" type="number" min="12" max="112" step="1" data-field="layout-hero-value-size" value="${this._escapeAttribute(layoutHeroValueSize)}" placeholder="use Hero size preset">
              <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
            </div>
            ` : ''}
            <div class="field-row">
              <label for="layout-label-width">Label width</label>
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(layoutLabelWidth)}">
            </div>
          </div>
	        </div>

${this._renderFormattingSection({ type: 'card' })}
      </div>
    `;

      this._bindShadowListeners();
      this._syncEntityPickers();
      this._lastRenderedConfigJson = this._serializeConfig(this._draftConfig);
      this._applyPendingFocus();
    } finally {
      this._isRendering = false;
    }
  }

  _bindShadowListeners() {
    if (!this.shadowRoot || this._shadowListenersAttached) return;
    this.shadowRoot.addEventListener('click', this._boundHandleClick);
    this.shadowRoot.addEventListener('change', this._boundHandleChange);
    this.shadowRoot.addEventListener('input', this._boundHandleInput);
    this.shadowRoot.addEventListener('value-changed', this._boundHandleValueChanged);
    this.shadowRoot.addEventListener('keydown', this._boundHandleKeydown);
    this._shadowListenersAttached = true;
  }

  _syncEntityPickers() {
    if (!this.shadowRoot) return;
    const entities = this._getEntitiesValue();
    const syncPicker = (picker) => {
      const kind = picker.dataset.kind;
      const indexValue = picker.dataset.index;
      const index = Number(indexValue);
      picker.hass = this._hass;
      picker.allowCustomEntity = true;

      if (kind === 'entity-picker') {
        const entry = entities[index];
        picker.value = entry?.entity ?? '';
        picker.label = `Entity ${index + 1}`;
        return;
      }

      if (kind === 'scale-min-entity-source') {
        picker.value = this._getScaleEntityValue('min');
        picker.label = 'Min entity';
        return;
      }

      if (kind === 'scale-max-entity-source') {
        picker.value = this._getScaleEntityValue('max');
        picker.label = 'Max entity';
        return;
      }

      if (kind === 'baseline-entity-source') {
        picker.value = this._getBaselineResolvableValue({ type: 'card' }).entity;
        picker.label = 'Baseline entity';
        return;
      }

      if (kind === 'target-entity-source') {
        picker.value = this._getTargetResolvableValue({ type: 'card' }).entity;
        picker.label = 'Target entity';
        return;
      }

      if (kind === 'entity-override-min-entity-source') {
        picker.value = this._getEffectiveResolvableScopedValue({ type: 'entity', index }, 'min').entity;
        picker.label = `Entity ${index + 1} min entity`;
        return;
      }

      if (kind === 'entity-override-max-entity-source') {
        picker.value = this._getEffectiveResolvableScopedValue({ type: 'entity', index }, 'max').entity;
        picker.label = `Entity ${index + 1} max entity`;
        return;
      }

      if (kind === 'entity-baseline-entity-source') {
        picker.value = this._getEffectiveBaselineResolvableValue({ type: 'entity', index }).entity;
        picker.label = `Entity ${index + 1} baseline entity`;
        return;
      }

      if (kind === 'entity-target-entity-source') {
        picker.value = this._getEffectiveTargetResolvableValue({ type: 'entity', index }).entity;
        picker.label = `Entity ${index + 1} target entity`;
        return;
      }

      if (kind === 'generic-marker-entity') {
        const scope = this._getGenericMarkerScope(picker);
        const marker = this._getGenericMarkers(scope)[Number(picker.dataset.markerIndex)];
        picker.value = this._getGenericMarkerSource(marker).entity ?? '';
        picker.label = 'Reference marker entity';
      }
      if (kind === 'generic-marker-label-entity') {
        const scope = this._getGenericMarkerScope(picker);
        const marker = this._getGenericMarkers(scope)[Number(picker.dataset.markerIndex)];
        picker.value = marker?.label?.entity ?? '';
        picker.label = 'Label content entity';
      }
    };

    [
      'ha-entity-picker[data-kind="entity-picker"]',
      'ha-entity-picker[data-kind="scale-min-entity-source"]',
      'ha-entity-picker[data-kind="scale-max-entity-source"]',
      'ha-entity-picker[data-kind="baseline-entity-source"]',
      'ha-entity-picker[data-kind="target-entity-source"]',
      'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
      'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
      'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
      'ha-entity-picker[data-kind="entity-target-entity-source"]',
      'ha-entity-picker[data-kind="generic-marker-entity"]',
      'ha-entity-picker[data-kind="generic-marker-label-entity"]',
    ].forEach((selector) => {
      this.shadowRoot.querySelectorAll(selector).forEach(syncPicker);
    });
    if (customElements.whenDefined) {
      customElements.whenDefined('ha-entity-picker').then(() => {
        [
          'ha-entity-picker[data-kind="entity-picker"]',
          'ha-entity-picker[data-kind="scale-min-entity-source"]',
          'ha-entity-picker[data-kind="scale-max-entity-source"]',
          'ha-entity-picker[data-kind="baseline-entity-source"]',
          'ha-entity-picker[data-kind="target-entity-source"]',
          'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
          'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
          'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
          'ha-entity-picker[data-kind="entity-target-entity-source"]',
          'ha-entity-picker[data-kind="generic-marker-entity"]',
          'ha-entity-picker[data-kind="generic-marker-label-entity"]',
        ].forEach((selector) => {
          this.shadowRoot?.querySelectorAll(selector).forEach(syncPicker);
        });
      }).catch(() => {});
    }
  }

  _handleClick(event) {
    if (this._segmentsSection.handle(event, 'click') || this._gradientStopsSection.handle(event, 'click')) return;
    const target = event.target?.closest?.('[data-action]') ?? event.target;
    const action = target?.dataset?.action;
    if (!action) return;
    if (target?.disabled) return;

    if (action === 'add-entity') {
      const nextEntities = [...this._getEntitiesValue(), { entity: '' }];
      const nextEntries = this._buildEntityConfigEntries(nextEntities);
      this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${nextEntities.length - 1}"], [data-kind="entity-input"][data-index="${nextEntities.length - 1}"]`);
      if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
        let nextConfig = this._setPathValue(this._draftConfig, ['entities'], nextEntries);
        if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== undefined) {
          nextConfig = this._deletePathValue(nextConfig, ['entity']);
          if (this._draftConfig.name !== undefined) {
            nextConfig = this._deletePathValue(nextConfig, ['name']);
          }
          if (this._draftConfig.icon !== undefined) {
            nextConfig = this._deletePathValue(nextConfig, ['icon']);
          }
        }
        this._applyUserConfig(nextConfig, { rerender: true });
      } else {
        this._setValueAtPath(['entity'], nextEntities[0]?.entity ?? '', { rerender: true });
      }
      return;
    }

    if (action === 'move-entity-up') {
      this._moveEntityRow(Number(target.dataset.index), -1);
      return;
    }

    if (action === 'move-entity-down') {
      this._moveEntityRow(Number(target.dataset.index), 1);
      return;
    }

    if (action === 'duplicate-entity') {
      const sourceIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${sourceIndex + 1}"], [data-kind="entity-picker"][data-index="${sourceIndex + 1}"], [data-kind="entity-input"][data-index="${sourceIndex + 1}"]`);
      this._duplicateEntityRow(sourceIndex);
      return;
    }

    if (action === 'toggle-entity-overrides') {
      this._toggleEntityOverrideExpanded(Number(target.dataset.index));
      return;
    }

    if (action === 'toggle-override-group') {
      this._toggleOverrideGroupExpanded(Number(target.dataset.index), target.dataset.group);
      return;
    }

    if (action === 'toggle-card-group') {
      this._toggleCardGroupExpanded(target.dataset.group);
      return;
    }

    if (action === 'remove-entity') {
      this._removeEntityRow(Number(target.dataset.index));
      return;
    }

    if (this._baselineSection.handleClick(target)) return;

    this._referenceMarkersSection.handleClick(target);
  }

  _handleChange(event) {
    if (this._segmentsSection.handle(event, 'change') || this._gradientStopsSection.handle(event, 'change')) return;
    const kind = event.target?.dataset?.kind;
    this._handleFieldEvent(event);
  }

  _handleInput(event) {
    if (this._segmentsSection.handle(event, 'input') || this._gradientStopsSection.handle(event, 'input')) return;
    const target = event.target;
    if (!target) return;
    if (target.tagName === 'HA-ENTITY-PICKER') return;
    if (target.tagName === 'INPUT' && target.type === 'checkbox') return;
    const kind = target.dataset?.kind;
    this._handleFieldEvent(event);
  }

  _handleValueChanged(event) {
    if (event.target?.tagName === 'HA-ENTITY-PICKER') {
      this._handleFieldEvent(event);
    }
  }

  _handleKeydown(event) {
    this._segmentsSection.handle(event, 'keydown') || this._gradientStopsSection.handle(event, 'keydown');
  }

  _handleFieldEvent(event) {
    if (this._segmentsSection.handle(event, 'field') || this._gradientStopsSection.handle(event, 'field')) return;
    const target = event.target;
    const rawField = target?.dataset?.field;
    const rawKind = target?.dataset?.kind;
    const field = rawField?.endsWith('-text-fallback') ? rawField.slice(0, -14) : rawField;
    const kind = rawKind?.endsWith('-text-fallback') ? rawKind.slice(0, -14) : rawKind;
    const detailValue = event.detail?.value;
    const value = detailValue ?? (target?.type === 'checkbox' ? target.checked : target?.value);

    if (this._referenceMarkersSection.handleField({ target, kind, value })) return;

    if (field === 'title') return void this._setTitle(value);
    if (handleFormattingField(this._createSectionContext(), { field, value })) return;
    if (field === 'layout-label-position') return void this._setLayoutLabelPosition(value);
    if (field === 'layout-label-hero-size') return void this._setLayoutHeroSize(value);
    if (field === 'layout-hero-value-size') return void this._setLayoutHeroValueSize(value);
    if (field === 'layout-height') return void this._setLayoutHeight(value);
    if (field === 'layout-label-width') return void this._setScopedLayoutLabelWidth({ type: 'card' }, value);
    if (handleScaleField(this._createSectionContext(), { field, value })) return;
    if (handleBarAppearanceField(this._createSectionContext(), { field, value })) return;
    if (this._needleSection.handleField({ field, kind, index: target.dataset?.index, value })
      || this._baselineSection.handleField({ field, kind, index: target.dataset?.index, value })
      || this._targetSection.handleField({ field, kind, index: target.dataset?.index, value })
      || this._extremaSection.handleField({ field, kind, index: target.dataset?.index, value })) return;
    if (kind === 'entity-picker' || kind === 'entity-input') {
      const index = Number(target.dataset.index);
      const nextEntities = this._getEntitiesValue().map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, entity: this._normalizeTextValue(value) } : entry
      ));
      const nextEntries = this._buildEntityConfigEntries(nextEntities);
      if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
        this._setValueAtPath(['entities'], nextEntries);
      } else {
        this._setValueAtPath(['entity'], nextEntities[0]?.entity ?? '');
      }
      return;
    }

    if (kind === 'entity-name') {
      return void this._setEntityField(Number(target.dataset.index), 'name', value);
    }

    if (kind === 'entity-icon') {
      return void this._setEntityField(Number(target.dataset.index), 'icon', value);
    }

    if (handleScaleField(this._createSectionContext(), { kind: kind?.startsWith('scale-') ? kind : undefined, value })) return;

    if (handleScaleField(this._createSectionContext(), { kind, index: target?.dataset?.index, value })) return;

    if (kind === 'entity-override-height') {
      return void this._setScopedLayoutHeight({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-inherit') {
      if (value) {
        return void this._clearLayoutOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-layout-label-position') {
      return void this._setScopedLayoutLabelPosition({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-label-hero-size') {
      return void this._setScopedLayoutHeroSize({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-hero-value-size') {
      return void this._setScopedLayoutHeroValueSize({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-layout-label-width') {
      return void this._setScopedLayoutLabelWidth({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (handleFormattingField(this._createSectionContext(), { kind, index: target?.dataset?.index, value })) return;

    if (kind === 'entity-bar-inherit' && handleBarAppearanceField(this._createSectionContext(), { kind, index: target.dataset.index, value })) return;

    if (handleBarAppearanceField(this._createSectionContext(), { kind, index: target.dataset.index, value })) return;

  }
}
