export class SensorBarCardPlusEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this._gradientStopsDrafts = new Map();
    this._gradientStopsUiRows = new Map();
    this._gradientStopPosTexts = new Map();
    this._gradientStopValidationMessages = new Map();
    this._segmentDrafts = new Map();
    this._segmentUiRows = new Map();
    this._segmentBoundaryTexts = new Map();
    this._targetAboveFillDrafts = new Map();
    this._baselineColorDrafts = new Map();
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

    const shouldRender = !this.shadowRoot?.innerHTML || nextConfigJson !== this._lastRenderedConfigJson;
    this._config = nextConfig;
    this._draftConfig = this._cloneDeep(nextConfig);
    this._gradientStopsDrafts = new Map();
    this._gradientStopsUiRows = new Map();
    this._gradientStopPosTexts = new Map();
    this._gradientStopValidationMessages = new Map();
    this._segmentDrafts = new Map();
    this._segmentUiRows = new Map();
    this._segmentBoundaryTexts = new Map();
    this._targetAboveFillDrafts = new Map();
    this._baselineColorDrafts = new Map();

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
    return Array.isArray(value) ? [...value] : { ...(value ?? {}) };
  }

  _cloneDeep(value) {
    if (Array.isArray(value)) {
      return value.map((entry) => this._cloneDeep(entry));
    }
    if (this._isObject(value)) {
      const clone = {};
      for (const [key, entry] of Object.entries(value)) {
        clone[key] = this._cloneDeep(entry);
      }
      return clone;
    }
    return value;
  }

  _serializeConfig(value) {
    const normalize = (input) => {
      if (Array.isArray(input)) {
        return input.map((entry) => normalize(entry));
      }
      if (this._isObject(input)) {
        return Object.keys(input).sort().reduce((acc, key) => {
          acc[key] = normalize(input[key]);
          return acc;
        }, {});
      }
      return input;
    };

    return JSON.stringify(normalize(value ?? null));
  }

  _isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  _setPathValue(target, path, value) {
    if (!path.length) {
      return value;
    }

    const root = this._cloneContainer(target ?? {});
    let cursor = root;
    let sourceCursor = target;

    for (let index = 0; index < path.length - 1; index++) {
      const key = path[index];
      const nextSource = this._isObject(sourceCursor?.[key]) || Array.isArray(sourceCursor?.[key])
        ? sourceCursor[key]
        : {};
      cursor[key] = this._cloneContainer(nextSource);
      cursor = cursor[key];
      sourceCursor = nextSource;
    }

    cursor[path[path.length - 1]] = value;
    return root;
  }

  _deletePathValue(target, path) {
    if (!path.length || !this._isObject(target)) {
      return target;
    }

    const [key, ...rest] = path;
    if (!(key in target)) {
      return target;
    }

    const cloned = this._cloneContainer(target);
    if (!rest.length) {
      delete cloned[key];
      return cloned;
    }

    const nextValue = this._deletePathValue(cloned[key], rest);
    if (nextValue === cloned[key]) {
      return target;
    }

    if (this._isObject(nextValue) && !Object.keys(nextValue).length) {
      delete cloned[key];
      return cloned;
    }

    cloned[key] = nextValue;
    return cloned;
  }

  _getPathValue(target, path) {
    let cursor = target;
    for (const key of path) {
      if (cursor == null) return undefined;
      cursor = cursor[key];
    }
    return cursor;
  }

  _hasPath(target, path) {
    let cursor = target;
    for (const key of path) {
      if (!this._isObject(cursor) && !Array.isArray(cursor)) return false;
      if (!(key in cursor)) return false;
      cursor = cursor[key];
    }
    return true;
  }

  _normalizeTextValue(value) {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
  }

  _normalizeOptionalEnabled(value) {
    return value === true ? true : value === false ? false : null;
  }

  _normalizeNumberValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _normalizeDecimalValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return null;
    }
    return parsed;
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
    const nextValue = {};
    if (this._isObject(value)) {
      const fixed = this._normalizeNumberValue(value.fixed);
      const entity = this._normalizeTextValue(value.entity).trim();
      if (fixed !== null) {
        nextValue.fixed = fixed;
      }
      if (entity) {
        nextValue.entity = entity;
      }
    } else {
      const fixed = this._normalizeNumberValue(value);
      if (fixed !== null) {
        nextValue.fixed = fixed;
      }
    }
    return Object.keys(nextValue).length ? nextValue : null;
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
      if (cleanedValue) {
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
    const height = this._normalizeNumberValue(nextLayout.height);
    const width = this._normalizeNumberValue(nextLabel?.width);
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

    if (Object.keys(nextLayout).length) {
      nextTarget.layout = nextLayout;
    } else {
      delete nextTarget.layout;
    }

    return nextTarget;
  }

  _cleanupTargetForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.target)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextMarker = this._cloneDeep(nextTarget.target);
    const cleanedAt = this._cleanupResolvableValueForEmit(nextMarker.at);
    const color = this._normalizeTextValue(nextMarker.color).trim();
    const labelShow = nextMarker.label?.show === true;
    const fillColor = this._normalizeTextValue(nextMarker.when_exceeded?.fill_color).trim();

    if (typeof nextMarker.enabled !== 'boolean') {
      delete nextMarker.enabled;
    }

    if (cleanedAt) {
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

    if (labelShow) {
      nextMarker.label = { ...(this._isObject(nextMarker.label) ? nextMarker.label : {}), show: true };
      delete nextTarget.show_target_label;
    } else {
      delete nextMarker.label;
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

    if (cleanedAt) {
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

  _cleanupPeakForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.peak)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextPeak = this._cloneDeep(nextTarget.peak);
    const color = this._normalizeTextValue(nextPeak.color).trim();

    if (typeof nextPeak.enabled !== 'boolean') {
      delete nextPeak.enabled;
    }

    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888')) {
      nextPeak.color = color;
      delete nextTarget.peak_color;
    } else {
      delete nextPeak.color;
    }

    if (Object.keys(nextPeak).length) {
      nextTarget.peak = nextPeak;
    } else {
      delete nextTarget.peak;
    }

    return nextTarget;
  }

  _cleanupBarForEmit(target) {
    if (!this._isObject(target) || !this._isObject(target.bar)) {
      return target;
    }
    const nextTarget = this._cloneDeep(target);
    const nextBar = this._cloneDeep(nextTarget.bar);
    const fillStyle = this._normalizeTextValue(nextBar.fill_style).trim();
    const color = this._normalizeTextValue(nextBar.color).trim();
    const segments = Array.isArray(nextBar.segments) ? nextBar.segments : null;
    const gradientStops = Array.isArray(nextBar.gradient_stops) ? nextBar.gradient_stops : null;

    if (fillStyle && fillStyle !== 'bands') {
      nextBar.fill_style = fillStyle;
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

    if (segments && segments.length && !this._segmentsEqualForEditor(segments, this._getDefaultSegments())) {
      nextBar.segments = segments;
      delete nextTarget.segments;
      delete nextTarget.severity;
    } else {
      delete nextBar.segments;
    }

    if (gradientStops && gradientStops.length >= 2 && !this._isDefaultGradientStops(gradientStops)) {
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
        return ['type', 'title', 'entities', 'scale', 'target', 'baseline', 'peak', 'layout', 'formatting', 'bar'];
      case 'entities.*':
        return ['entity', 'name', 'icon', 'scale', 'target', 'baseline', 'peak', 'layout', 'formatting', 'bar'];
      case 'scale':
        return ['min', 'max'];
      case 'scale.min':
      case 'scale.max':
      case 'target.at':
      case 'baseline.at':
        return ['fixed', 'entity'];
      case 'target':
        return ['enabled', 'at', 'color', 'label', 'when_exceeded'];
      case 'target.label':
        return ['show'];
      case 'target.when_exceeded':
        return ['fill_color'];
      case 'baseline':
        return ['enabled', 'at', 'above', 'below'];
      case 'baseline.above':
      case 'baseline.below':
        return ['color'];
      case 'peak':
        return ['enabled', 'color'];
      case 'layout':
        return ['height', 'label'];
      case 'layout.label':
        return ['position', 'hero_size', 'width'];
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
    let nextConfig = this._cleanupEntityIdentityForEmit(config);
    nextConfig = this._cleanupScaleForEmit(nextConfig);
    nextConfig = this._cleanupTargetForEmit(nextConfig);
    nextConfig = this._cleanupBaselineForEmit(nextConfig);
    nextConfig = this._cleanupPeakForEmit(nextConfig);
    nextConfig = this._cleanupLayoutForEmit(nextConfig);
    nextConfig = this._cleanupFormattingForEmit(nextConfig);
    nextConfig = this._cleanupNeedleForEmit(nextConfig, { type: 'card' });
    nextConfig = this._cleanupBarForEmit(nextConfig);

    if (Array.isArray(nextConfig.entities)) {
      nextConfig.entities = nextConfig.entities.map((entry) => {
        if (!this._isObject(entry)) {
          return entry;
        }
        let cleanedEntry = this._cleanupEntityIdentityForEmit(entry);
        cleanedEntry = this._cleanupScaleForEmit(cleanedEntry);
        cleanedEntry = this._cleanupTargetForEmit(cleanedEntry);
        cleanedEntry = this._cleanupBaselineForEmit(cleanedEntry);
        cleanedEntry = this._cleanupPeakForEmit(cleanedEntry);
        cleanedEntry = this._cleanupLayoutForEmit(cleanedEntry);
        cleanedEntry = this._cleanupFormattingForEmit(cleanedEntry);
        cleanedEntry = this._cleanupNeedleForEmit(cleanedEntry, { type: 'entity' });
        cleanedEntry = this._cleanupBarForEmit(cleanedEntry);
        return cleanedEntry;
      });
    }

    return this._orderEditorConfigKeys(nextConfig);
  }

  _getScopedPath(scope, keyPath) {
    const normalizedPath = Array.isArray(keyPath) ? keyPath : [keyPath];
    if (!scope || scope.type === 'card') {
      return normalizedPath;
    }
    if (scope.type === 'entity') {
      return ['entities', scope.index, ...normalizedPath];
    }
    return normalizedPath;
  }

  _normalizePath(keyPath) {
    return Array.isArray(keyPath) ? keyPath : [keyPath];
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
    return keyPaths.reduce((nextTarget, keyPath) => (
      this._deletePathValue(nextTarget, this._normalizePath(keyPath))
    ), target);
  }

  _pruneEmptyObjectsInTarget(target, keyPath) {
    let nextTarget = target;
    const normalizedPath = this._normalizePath(keyPath);
    for (let index = normalizedPath.length; index > 0; index--) {
      const currentPath = normalizedPath.slice(0, index);
      const currentValue = this._getPathValue(nextTarget, currentPath);
      if (!this._isObject(currentValue) || Object.keys(currentValue).length) {
        break;
      }
      nextTarget = this._deletePathValue(nextTarget, currentPath);
    }
    return nextTarget;
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
    const structuredFixedValue = this._isObject(structuredValue)
      ? structuredValue?.fixed
      : structuredValue;
    const structuredEntityValue = this._isObject(structuredValue)
      ? structuredValue?.entity
      : undefined;
    return {
      fixed: structuredFixedValue ?? ((!this._isObject(legacyFixedValue) && legacyFixedValue !== undefined) ? legacyFixedValue : ''),
      entity: structuredEntityValue ?? legacyEntityValue ?? '',
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
      if (hasFixed || hasEntity) {
        const nextValue = {};
        if (hasFixed) nextValue.fixed = nextParts.fixed;
        if (hasEntity) nextValue.entity = nextParts.entity;
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

  _getEffectiveScopedDisplayValue(scope, canonicalPath, fallbackPaths = []) {
    const valuesToTry = [canonicalPath, ...fallbackPaths];
    for (const path of valuesToTry) {
      const value = this._getScopedValue(scope, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    if (scope?.type === 'entity') {
      for (const path of valuesToTry) {
        const value = this._getScopedValue({ type: 'card' }, path);
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }
    return '';
  }

  _getScopedFormattingValue(scope, key) {
    return this._getScopedValue(scope, ['formatting', key])
      ?? this._getScopedValue(scope, [key])
      ?? '';
  }

  _getEffectiveScopedFormattingValue(scope, key) {
    return this._getEffectiveScopedDisplayValue(scope, ['formatting', key], [[key]]);
  }

  _setScopedFormattingUnit(scope, rawValue) {
    return this._setCanonicalScopedTextOverride(scope, ['formatting', 'unit'], rawValue, {
      deprecatedKeys: [['unit']],
      prunePaths: [['formatting']],
    });
  }

  _setScopedFormattingDecimal(scope, rawValue) {
    const normalizedValue = this._normalizeDecimalValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._removeCanonicalScopedValue(scope, ['formatting', 'decimal'], {
        deprecatedKeys: [['decimal']],
        prunePaths: [['formatting']],
      });
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._setCanonicalScopedValue(scope, ['formatting', 'decimal'], normalizedValue, {
      deprecatedKeys: [['decimal']],
      prunePaths: [['formatting']],
    });
  }

  _clearFormattingOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['formatting', 'unit']);
      nextTarget = this._deletePathValue(nextTarget, ['formatting', 'decimal']);
      nextTarget = this._deletePathValue(nextTarget, ['unit']);
      nextTarget = this._deletePathValue(nextTarget, ['decimal']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['formatting']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasFormattingOverride(scope) {
    const formattingValue = this._getScopedValue(scope, ['formatting']) ?? {};
    if (this._isObject(formattingValue) && (
      Object.prototype.hasOwnProperty.call(formattingValue, 'unit')
      || Object.prototype.hasOwnProperty.call(formattingValue, 'decimal')
    )) {
      return true;
    }
    return this._getScopedValue(scope, ['unit']) !== undefined
      || this._getScopedValue(scope, ['decimal']) !== undefined;
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
      return this._getScopedValue(scope, ['layout', 'label', 'hero_size'])
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
      return this._getEffectiveScopedDisplayValue(scope, ['layout', 'label', 'hero_size']);
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
    return true;
  }

  _setLayoutLabelPosition(value) {
    return this._setScopedLayoutLabelPosition({ type: 'card' }, value);
  }

  _setScopedLayoutHeroSize(scope, value) {
    if (!value || value === 'medium') {
      return this._removeCanonicalScopedValue(scope, ['layout', 'label', 'hero_size'], {
        prunePaths: [['layout', 'label'], ['layout']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['layout', 'label', 'hero_size'], value, {
      prunePaths: [['layout', 'label'], ['layout']],
    });
  }

  _setLayoutHeroSize(value) {
    return this._setScopedLayoutHeroSize({ type: 'card' }, value);
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
    return this._getScopedValue(scope, ['height']) !== undefined
      || this._getScopedValue(scope, ['label_position']) !== undefined
      || this._getScopedValue(scope, ['label_width']) !== undefined;
  }

  _setScaleBound(key, value) {
    return this._setCanonicalResolvablePart({ type: 'card' }, key, 'fixed', value);
  }

  _clearScaleOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['scale', 'min']);
      nextTarget = this._deletePathValue(nextTarget, ['scale', 'max']);
      nextTarget = this._deletePathValue(nextTarget, ['min']);
      nextTarget = this._deletePathValue(nextTarget, ['max']);
      nextTarget = this._deletePathValue(nextTarget, ['min_entity']);
      nextTarget = this._deletePathValue(nextTarget, ['max_entity']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['scale']);
      return nextTarget;
    }, { rerender: true });
  }

  _setBarFillStyle(value) {
    return this._setScopedBarFillStyle({ type: 'card' }, value);
  }

  _setBarColor(value) {
    return this._setScopedBarColor({ type: 'card' }, value);
  }

  _setGradientStops(stops, options = {}) {
    return this._setScopedGradientStops({ type: 'card' }, stops, options);
  }

  _setSegments(segments, options = {}) {
    return this._setScopedSegments({ type: 'card' }, segments, options);
  }

  _getDefaultGradientStops() {
    return [
      { pos: 0, color: '#4CAF50' },
      { pos: 50, color: '#FF9800' },
      { pos: 100, color: '#F44336' },
    ];
  }

  _normalizeGradientStopPosValue(rawValue) {
    const numericValue = this._normalizeNumberValue(rawValue);
    if (numericValue === null || !Number.isFinite(numericValue)) {
      return null;
    }
    if (numericValue < 0 || numericValue > 100) {
      return null;
    }
    return numericValue;
  }

  _sanitizeGradientStopsForEmit(stops) {
    if (!Array.isArray(stops)) {
      return [];
    }

    return stops
      .map((stop) => {
        if (!this._isObject(stop)) {
          return null;
        }
        const pos = this._normalizeGradientStopPosValue(stop.pos);
        const color = this._normalizeTextValue(stop.color).trim();
        if (pos === null || !color) {
          return null;
        }
        return {
          ...stop,
          pos,
          color,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.pos - right.pos);
  }

  _getGradientStopDraftColorDefault(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (committedStops.length) {
      return committedStops[committedStops.length - 1].color ?? '#4CAF50';
    }
    return this._getDefaultGradientStops()[0].color;
  }

  _getNextSuggestedGradientStopPos(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (!committedStops.length) {
      return 0;
    }

    const highest = committedStops[committedStops.length - 1];
    if (highest.pos >= 100) {
      return '';
    }

    let suggestedPos;
    if (committedStops.length === 1) {
      suggestedPos = highest.pos + 25;
    } else {
      const previous = committedStops[committedStops.length - 2];
      suggestedPos = highest.pos + (highest.pos - previous.pos);
    }

    const clampedPos = Math.min(100, Math.max(0, suggestedPos));
    if (committedStops.some((stop) => stop.pos === clampedPos)) {
      return '';
    }
    return clampedPos;
  }

  _getGradientStopsDraftKey(scope) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getGradientStopPosTextKey(scope, stopIndex) {
    return `${this._getGradientStopsDraftKey(scope)}:pos:${stopIndex}`;
  }

  _getGradientStopPosText(scope = { type: 'card' }, stopIndex, fallbackValue = '') {
    const key = this._getGradientStopPosTextKey(scope, stopIndex);
    if (this._gradientStopPosTexts.has(key)) {
      return this._gradientStopPosTexts.get(key);
    }
    if (fallbackValue === '' || fallbackValue === null || fallbackValue === undefined) {
      return '';
    }
    return String(fallbackValue);
  }

  _setGradientStopPosText(scope, stopIndex, rawValue) {
    this._gradientStopPosTexts.set(
      this._getGradientStopPosTextKey(scope, stopIndex),
      this._normalizeTextValue(rawValue),
    );
  }

  _clearGradientStopPosText(scope, stopIndex) {
    this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(scope, stopIndex));
  }

  _clearGradientStopScopeTextState(scope) {
    const prefix = `${this._getGradientStopsDraftKey(scope)}:pos:`;
    for (const key of this._gradientStopPosTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopPosTexts.delete(key);
      }
    }
    for (const key of this._gradientStopValidationMessages.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopValidationMessages.delete(key);
      }
    }
  }

  _getGradientStopsUiRows(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (this._gradientStopsUiRows.has(key)) {
      return this._cloneDeep(this._gradientStopsUiRows.get(key));
    }
    return null;
  }

  _setGradientStopsUiRows(scope, stops) {
    this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(scope), this._cloneDeep(stops));
  }

  _getStoredScopedGradientStops(scope = { type: 'card' }) {
    const structuredValue = this._getScopedValue(scope, ['bar', 'gradient_stops']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacyValue = this._getScopedValue(scope, ['gradient_stops']);
    if (legacyValue !== undefined) {
      return legacyValue;
    }
    return null;
  }

  _getFallbackGradientStops(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const inheritedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({ type: 'card' }));
      return inheritedStops.length ? inheritedStops : this._getDefaultGradientStops();
    }
    return this._getDefaultGradientStops();
  }

  _createGradientStopDraftState(scope = { type: 'card' }) {
    const suggestedPos = this._getNextSuggestedGradientStopPos(scope);
    return {
      pos: suggestedPos === '' ? '' : String(suggestedPos),
      color: this._getGradientStopDraftColorDefault(scope),
    };
  }

  _getGradientStopsDraftState(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (!this._gradientStopsDrafts.has(key)) {
      this._gradientStopsDrafts.set(key, this._createGradientStopDraftState(scope));
    }
    return this._cloneDeep(this._gradientStopsDrafts.get(key));
  }

  _setGradientStopsDraftState(scope, nextDraft, options = {}) {
    this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
      pos: nextDraft?.pos ?? '',
      color: nextDraft?.color ?? this._getGradientStopDraftColorDefault(scope),
    });
    if (options?.refreshOnly) {
      this._refreshGradientDraftUi(scope);
      return;
    }
    this._render();
  }

  _setGradientStopsDraftField(scope, field, rawValue) {
    const currentDraft = this._getGradientStopsDraftState(scope);
    const nextValue = field === 'color'
      ? this._normalizeTextValue(rawValue).trim()
      : this._normalizeTextValue(rawValue);
    this._setGradientStopsDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
    }, { refreshOnly: field === 'pos' });
  }

  _getValidGradientDraftStop(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const pos = this._normalizeGradientStopPosValue(draft.pos);
    const color = this._normalizeTextValue(draft.color).trim();
    if (pos === null || !color) {
      return null;
    }
    return { pos, color };
  }

  _hasGradientStopDuplicate(scope = { type: 'card' }, candidatePos, excludeIndex = null) {
    return this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope)).some((stop, index) => (
      index !== excludeIndex && stop.pos === candidatePos
    ));
  }

  _canAddGradientStop(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop) {
      return false;
    }
    return !this._hasGradientStopDuplicate(scope, draftStop.pos);
  }

  _getGradientDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const normalizedPosText = this._normalizeTextValue(draft.pos).trim();
    const normalizedColor = this._normalizeTextValue(draft.color).trim();
    if (!normalizedPosText) {
      return 'Enter a position to add a stop.';
    }
    if (this._normalizeGradientStopPosValue(draft.pos) === null) {
      return 'Enter a value from 0 to 100.';
    }
    if (!normalizedColor) {
      return 'Choose a color to add a stop.';
    }
    if (this._hasGradientStopDuplicate(scope, this._normalizeGradientStopPosValue(draft.pos))) {
      return 'Position already exists.';
    }
    return '';
  }

  _isDefaultGradientStops(stops) {
    const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
    const defaultStops = this._getDefaultGradientStops();
    if (sanitizedStops.length !== defaultStops.length) {
      return false;
    }
    return sanitizedStops.every((stop, index) => (
      stop.pos === defaultStops[index].pos
      && this._normalizeColorComparisonValue(stop.color) === this._normalizeColorComparisonValue(defaultStops[index].color)
    ));
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

  _clearGradientStopsOverride(scope) {
    const previousUiRowsJson = this._serializeConfig(this._getGradientStopsUiRows(scope) ?? []);
    this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(scope));
    this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(scope));
    this._clearGradientStopScopeTextState(scope);
    const applied = this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'gradient_stops']);
      nextTarget = this._deletePathValue(nextTarget, ['gradient_stops']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
    if (applied === false && previousUiRowsJson !== this._serializeConfig([])) {
      this._render();
    }
    return applied;
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

  _clearSegmentsOverride(scope) {
    this._segmentDrafts.delete(this._getSegmentsScopeKey(scope));
    this._segmentUiRows.delete(this._getSegmentsScopeKey(scope));
    this._clearSegmentScopeTextState(scope);
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'segments']);
      nextTarget = this._deletePathValue(nextTarget, ['segments']);
      nextTarget = this._deletePathValue(nextTarget, ['severity']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
  }

  _setNeedle(value) {
    return this._setScopedNeedleMode({ type: 'card' }, value ? 'enabled' : 'disabled');
  }

  _getScopedPeakConfig(scope) {
    const rawPeak = this._getScopedValue(scope, ['peak']);
    const rawPeakMarker = this._getScopedValue(scope, ['peak_marker']);
    const rawLegacyShow = this._getScopedValue(scope, ['show_peak']);
    const rawLegacyColor = this._getScopedValue(scope, ['peak_color']);
    const defaultColor = '#888';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (this._isObject(rawPeak)) {
      if (rawPeak.enabled === true) {
        mode = 'enabled';
      } else if (rawPeak.enabled === false) {
        mode = 'disabled';
      }
      color = rawPeak.color ?? color;
    }

    if (this._isObject(rawPeakMarker)) {
      if (rawPeakMarker.show === true) {
        mode = 'enabled';
      } else if (rawPeakMarker.show === false) {
        mode = 'disabled';
      } else if (scope?.type !== 'entity') {
        mode = 'disabled';
      }
      color = rawPeakMarker.color ?? color;
    }

    if (rawLegacyShow === true) {
      mode = 'enabled';
    } else if (rawLegacyShow === false) {
      mode = 'disabled';
    }

    color = color || rawLegacyColor || '';
    if (color && this._normalizeColorComparisonValue(color) === this._normalizeColorComparisonValue(defaultColor)) {
      color = '';
    }

    return { mode, color };
  }

  _getEffectiveScopedPeakConfig(scope) {
    const localPeak = this._getScopedPeakConfig(scope);
    if (scope?.type !== 'entity') {
      return localPeak;
    }
    if (!this._hasPeakOverride(scope)) {
      return this._getScopedPeakConfig({ type: 'card' });
    }
    const inheritedPeak = this._getScopedPeakConfig({ type: 'card' });
    return {
      mode: localPeak.mode === 'inherit' ? inheritedPeak.mode : localPeak.mode,
      color: localPeak.color || inheritedPeak.color,
    };
  }

  _hasPeakOverride(scope) {
    const peakValue = this._getScopedValue(scope, ['peak']) ?? {};
    if (this._isObject(peakValue) && (
      Object.prototype.hasOwnProperty.call(peakValue, 'enabled')
      || Object.prototype.hasOwnProperty.call(peakValue, 'color')
    )) {
      return true;
    }

    const peakMarkerValue = this._getScopedValue(scope, ['peak_marker']) ?? {};
    if (this._isObject(peakMarkerValue) && (
      Object.prototype.hasOwnProperty.call(peakMarkerValue, 'show')
      || Object.prototype.hasOwnProperty.call(peakMarkerValue, 'color')
    )) {
      return true;
    }

    return this._getScopedValue(scope, ['show_peak']) !== undefined
      || this._getScopedValue(scope, ['peak_color']) !== undefined;
  }

  _getPeakSummary(scope) {
    if (scope?.type === 'entity' && !this._hasPeakOverride(scope)) return 'Inherited';
    const peak = this._getScopedPeakConfig(scope);
    if (peak.mode === 'disabled') return peak.color ? 'Disabled • Custom color' : 'Disabled';
    if (peak.mode === 'enabled') return peak.color ? 'Enabled • Custom color' : 'Enabled';
    if (peak.color) return 'Custom color';
    return 'Inherited';
  }

  _clearPeakOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['peak', 'enabled']);
      nextTarget = this._deletePathValue(nextTarget, ['peak', 'color']);
      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    }, { rerender: true });
  }

  _setScopedPeakEnabled(scope, value) {
    const boolValue = !!value;
    const defaultColor = '#888';
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const currentPeak = this._isObject(this._getPathValue(nextTarget, ['peak']))
        ? this._cloneDeep(this._getPathValue(nextTarget, ['peak']))
        : {};
      const currentColor = currentPeak.color
        ?? (this._isObject(this._getPathValue(nextTarget, ['peak_marker'])) ? this._getPathValue(nextTarget, ['peak_marker', 'color']) : undefined)
        ?? this._getPathValue(nextTarget, ['peak_color'])
        ?? defaultColor;

      if (scope?.type === 'entity' || boolValue) {
        currentPeak.enabled = boolValue;
      } else {
        delete currentPeak.enabled;
      }

      if (currentColor && this._normalizeColorComparisonValue(currentColor) !== this._normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = currentColor;
      } else {
        delete currentPeak.color;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = this._setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    });
  }

  _setScopedPeakColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const defaultColor = '#888';
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const currentPeak = this._isObject(this._getPathValue(nextTarget, ['peak']))
        ? this._cloneDeep(this._getPathValue(nextTarget, ['peak']))
        : {};
      const currentConfig = this._getScopedPeakConfig(scope);

      delete currentPeak.color;
      if (normalizedValue && this._normalizeColorComparisonValue(normalizedValue) !== this._normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = normalizedValue;
      }

      if (scope?.type === 'entity') {
        if (currentConfig.mode === 'enabled') currentPeak.enabled = true;
        if (currentConfig.mode === 'disabled') currentPeak.enabled = false;
      } else if (currentConfig.mode === 'enabled') {
        currentPeak.enabled = true;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = this._setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = this._deletePathValue(nextTarget, ['show_peak']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_color']);
      nextTarget = this._deletePathValue(nextTarget, ['peak_marker']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    });
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

  _setPeakShow(value) {
    return this._setScopedPeakEnabled({ type: 'card' }, value);
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

  _getGradientStopsValue() {
    return this._getScopedGradientStopsValue({ type: 'card' });
  }

  _getSegmentsValue() {
    return this._getScopedSegmentsValue({ type: 'card' });
  }

  _getSegmentsScopeKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getSegmentBoundaryTextKey(scope, segmentIndex, field) {
    return `${this._getSegmentsScopeKey(scope)}:${segmentIndex}:${field}`;
  }

  _getSegmentBoundaryText(scope = { type: 'card' }, segmentIndex, field, fallbackValue = '') {
    const key = this._getSegmentBoundaryTextKey(scope, segmentIndex, field);
    if (this._segmentBoundaryTexts.has(key)) {
      return this._segmentBoundaryTexts.get(key);
    }
    return this._formatSegmentBoundaryValue(fallbackValue);
  }

  _setSegmentBoundaryText(scope, segmentIndex, field, rawValue) {
    this._segmentBoundaryTexts.set(
      this._getSegmentBoundaryTextKey(scope, segmentIndex, field),
      this._normalizeTextValue(rawValue),
    );
  }

  _clearSegmentBoundaryText(scope, segmentIndex, field) {
    this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(scope, segmentIndex, field));
  }

  _clearSegmentScopeTextState(scope) {
    const prefix = `${this._getSegmentsScopeKey(scope)}:`;
    for (const key of this._segmentBoundaryTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._segmentBoundaryTexts.delete(key);
      }
    }
  }

  _getSegmentsUiRows(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (this._segmentUiRows.has(key)) {
      return this._cloneDeep(this._segmentUiRows.get(key));
    }
    return null;
  }

  _setSegmentsUiRows(scope, rows) {
    this._segmentUiRows.set(this._getSegmentsScopeKey(scope), this._cloneDeep(rows));
  }

  _getSegmentDraftState(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (!this._segmentDrafts.has(key)) {
      this._segmentDrafts.set(key, this._createSegmentDraftState(scope));
    }
    return this._cloneDeep(this._segmentDrafts.get(key));
  }

  _setSegmentDraftState(scope, nextDraft, options = {}) {
    this._segmentDrafts.set(this._getSegmentsScopeKey(scope), {
      from: nextDraft?.from ?? '',
      to: nextDraft?.to ?? '',
      color: nextDraft?.color ?? this._getSegmentDraftColorDefault(scope),
    });
    if (options?.refreshOnly) {
      this._refreshSegmentUi(scope);
      return;
    }
    this._render();
  }

  _setSegmentDraftField(scope, field, rawValue) {
    const currentDraft = this._getSegmentDraftState(scope);
    const nextValue = field === 'color'
      ? this._normalizeTextValue(rawValue).trim()
      : this._normalizeTextValue(rawValue);
    this._setSegmentDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
    }, { refreshOnly: true });
  }

  _isSegmentFillStyle(fillStyle) {
    return ['bands', 'soft_bands', 'band_gradient'].includes(fillStyle);
  }

  _getDefaultSegments() {
    return [
      { from: '0%', to: '33%', color: '#4CAF50' },
      { from: '33%', to: '75%', color: '#FF9800' },
      { from: '75%', to: '100%', color: '#F44336' },
    ];
  }

  _getStoredScopedSegments(scope = { type: 'card' }) {
    const structuredValue = this._getScopedValue(scope, ['bar', 'segments']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacySegments = this._getScopedValue(scope, ['segments']);
    if (legacySegments !== undefined) {
      return legacySegments;
    }
    const legacySeverity = this._getScopedValue(scope, ['severity']);
    if (legacySeverity !== undefined) {
      return legacySeverity;
    }
    return null;
  }

  _parseSegmentBoundaryInput(rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return null;
    }
    const percentMatch = normalizedValue.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;
    if (Number.isFinite(percent)) {
      return `${percent}%`;
    }
    const numericValue = this._normalizeNumberValue(normalizedValue);
    return numericValue === null ? null : numericValue;
  }

  _formatSegmentBoundaryValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (this._isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return `${value.percent}%`;
      }
      if (Number.isFinite(this._getFiniteNumber(value.fixed))) {
        return String(this._getFiniteNumber(value.fixed));
      }
    }
    return '';
  }

  _getSegmentDraftColorDefault(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    if (segments.length) {
      return this._normalizeTextValue(segments[segments.length - 1]?.color).trim() || '#4a9eff';
    }
    return '#4CAF50';
  }

  _getNewSegmentDefaults(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    const previous = segments[segments.length - 1];
    const previousTo = previous?.to ?? null;
    return {
      from: previousTo ?? '0%',
      to: '100%',
      color: '#4a9eff',
    };
  }

  _createSegmentDraftState(scope = { type: 'card' }) {
    const defaults = this._getNewSegmentDefaults(scope);
    const formattedFrom = this._formatSegmentBoundaryValue(defaults.from);
    const formattedTo = this._formatSegmentBoundaryValue(defaults.to);
    const draftFrom = formattedFrom === '100%' || formattedFrom === '100' ? '' : formattedFrom;
    const draftTo = draftFrom ? formattedTo : '';
    return {
      from: draftFrom,
      to: draftTo,
      color: defaults.color ?? this._getSegmentDraftColorDefault(scope),
    };
  }

  _normalizeSegmentForEditorComparison(segment) {
    if (!this._isObject(segment)) {
      return null;
    }
    const from = this._formatSegmentBoundaryValue(segment.from).trim();
    const to = this._formatSegmentBoundaryValue(segment.to).trim();
    const color = this._normalizeColorComparisonValue(segment.color);
    if (!from || !to || !color) {
      return null;
    }
    return { from, to, color };
  }

  _segmentsEqualForEditor(leftSegments, rightSegments) {
    const left = Array.isArray(leftSegments)
      ? leftSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    const right = Array.isArray(rightSegments)
      ? rightSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    if (left.length !== right.length) {
      return false;
    }
    return left.every((segment, index) => (
      segment.from === right[index].from
      && segment.to === right[index].to
      && segment.color === right[index].color
    ));
  }

  _getFallbackSegments(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const cardStoredSegments = this._getStoredScopedSegments({ type: 'card' });
      if (cardStoredSegments !== null) {
        return this._cloneDeep(this._getScopedSegmentsValue({ type: 'card' }));
      }
    }
    if (!this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))) {
      return [];
    }
    return this._cloneDeep(this._getDefaultSegments());
  }

  _parseSegmentBoundaryText(rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return { state: 'empty', value: null };
    }
    const parsed = this._parseSegmentBoundaryInput(normalizedValue);
    if (parsed === null) {
      return { state: 'invalid', value: null };
    }
    return { state: 'valid', value: parsed };
  }

  _compareSegmentBoundaries(left, right) {
    const leftValue = this._getSegmentPreviewBoundaryValue(left);
    const rightValue = this._getSegmentPreviewBoundaryValue(right);
    if (leftValue === null || rightValue === null) {
      return null;
    }
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  }

  _buildSegmentValidationRows(scope = { type: 'card' }) {
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    return rows.map((segment, index) => {
      const rawFrom = this._getSegmentBoundaryText(scope, index, 'from', segment?.from);
      const rawTo = this._getSegmentBoundaryText(scope, index, 'to', segment?.to);
      const parsedFrom = this._parseSegmentBoundaryText(rawFrom);
      const parsedTo = this._parseSegmentBoundaryText(rawTo);
      return {
        index,
        rawFrom,
        rawTo,
        parsedFrom,
        parsedTo,
      };
    });
  }

  _getSegmentRowValidationMessage(scope = { type: 'card' }, segmentIndex) {
    const rows = this._buildSegmentValidationRows(scope);
    const row = rows[segmentIndex];
    if (!row) {
      return '';
    }
    if (row.parsedFrom.state === 'invalid' || row.parsedTo.state === 'invalid' || row.parsedFrom.state === 'empty' || row.parsedTo.state === 'empty') {
      return 'Enter valid from/to values.';
    }
    if (this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
    for (const other of rows) {
      if (other.index === segmentIndex) continue;
      if (other.parsedFrom.state !== 'valid' || other.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(other.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(other.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getValidSegmentDraft(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = this._normalizeTextValue(draft.color).trim();
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid' || !color) {
      return null;
    }
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return null;
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom || (candidateFrom < otherTo && candidateTo > otherFrom)) {
        return null;
      }
    }
    return {
      from: parsedFrom.value,
      to: parsedTo.value,
      color,
    };
  }

  _canAddSegment(scope = { type: 'card' }) {
    return !!this._getValidSegmentDraft(scope);
  }

  _getSegmentDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = this._normalizeTextValue(draft.color).trim();
    if (!this._normalizeTextValue(draft.from).trim() && !this._normalizeTextValue(draft.to).trim()) {
      return '';
    }
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid') {
      return 'Enter valid from/to values.';
    }
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    if (!color) {
      return 'Choose a color to add a segment.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getSegmentPreviewBoundaryValue(value) {
    if (typeof value === 'string') {
      const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);
      if (match) {
        const parsed = parseFloat(match[1]);
        return Number.isFinite(parsed) ? parsed : null;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (this._isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return value.percent;
      }
      const fixedValue = this._getFiniteNumber(value.fixed);
      if (Number.isFinite(fixedValue)) {
        return fixedValue;
      }
    }
    return null;
  }

  _sortSegmentsForEditor(segments) {
    if (!Array.isArray(segments)) {
      return [];
    }
    return this._cloneDeep(segments).sort((left, right) => {
      const leftFrom = this._getSegmentPreviewBoundaryValue(left?.from);
      const rightFrom = this._getSegmentPreviewBoundaryValue(right?.from);
      if (leftFrom === null && rightFrom === null) return 0;
      if (leftFrom === null) return 1;
      if (rightFrom === null) return -1;
      return leftFrom - rightFrom;
    });
  }

  _getSegmentPreviewRows(scope = { type: 'card' }) {
    const baseSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const previewSegments = this._sortSegmentsForEditor(baseSegments);
    const validDraft = this._getValidSegmentDraft(scope);
    if (validDraft) {
      previewSegments.push(validDraft);
    }
    return this._sortSegmentsForEditor(previewSegments).filter((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment?.from);
      const to = this._getSegmentPreviewBoundaryValue(segment?.to);
      return from !== null && to !== null && typeof segment?.color === 'string' && segment.color.trim();
    });
  }

  _buildEditorSegmentPreviewStyle(scope = { type: 'card' }) {
    const segments = this._getSegmentPreviewRows(scope);
    if (!segments.length) {
      return '';
    }
    const fillStyle = this._getEffectiveFillStyleValue(scope);
    const stops = [];
    segments.forEach((segment) => {
      const from = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.from)));
      const to = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.to)));
      stops.push(`${segment.color} ${from}%`, `${segment.color} ${to}%`);
    });
    if (fillStyle === 'bands') {
      return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
    }
    return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
  }

  _getSegmentPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-segment-preview`,
        trackId: `entity-${scope.index}-segment-preview-track`,
      };
    }
    return {
      previewId: 'card-segment-preview',
      trackId: 'card-segment-preview-track',
    };
  }

  _renderSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    return `
      <div id="${previewId}" class="gradient-preview segment-preview">
        <div id="${trackId}" class="gradient-preview-track segment-preview-track" style="${this._escapeAttribute(this._buildEditorSegmentPreviewStyle(scope) ?? '')}">
          ${uniqueMarkers.map((marker, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${this._escapeAttribute(String(marker))}%"
              title="${this._escapeAttribute(`${marker}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _refreshSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    const track = this._getShadowElementById(trackId);
    if (!track) {
      return;
    }
    track.setAttribute('style', this._buildEditorSegmentPreviewStyle(scope) ?? '');
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    track.innerHTML = uniqueMarkers.map((marker, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${this._escapeAttribute(String(marker))}%"
        title="${this._escapeAttribute(`${marker}%`)}"
      ></span>
    `).join('');
  }

  _getSegmentDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        hintPrefix: `entity-${scope.index}-segment-row-hint-`,
        draftHintId: `entity-${scope.index}-segment-draft-hint`,
        addSelector: `button[data-action="add-entity-segment"][data-index="${scope.index}"]`,
      };
    }
    return {
      hintPrefix: 'segment-row-hint-',
      draftHintId: 'segment-draft-hint',
      addSelector: 'button[data-action="add-segment"]',
    };
  }

  _refreshSegmentUi(scope = { type: 'card' }) {
    this._refreshSegmentPreview(scope);
    if (!this.shadowRoot) {
      return;
    }
    const { hintPrefix, draftHintId, addSelector } = this._getSegmentDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddSegment(scope);
    }
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    rows.forEach((_, index) => {
      const hint = this._getShadowElementById(`${hintPrefix}${index}`);
      const message = this._getSegmentRowValidationMessage(scope, index);
      if (hint) {
        hint.textContent = message;
        hint.setAttribute?.('style', message ? '' : 'display:none');
      }
    });
    const draftHint = this._getShadowElementById(draftHintId);
    if (draftHint) {
      const message = this._getSegmentDraftValidationMessage(scope);
      draftHint.textContent = message;
      draftHint.setAttribute?.('style', message ? '' : 'display:none');
    }
  }

  _commitSegmentDraft(scope = { type: 'card' }) {
    const draftSegment = this._getValidSegmentDraft(scope);
    if (!draftSegment) {
      this._refreshSegmentUi(scope);
      return false;
    }
    const committedSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const nextSegments = this._sortSegmentsForEditor([...committedSegments, draftSegment]);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true });
    if (applied !== false) {
      this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
    }
    return applied;
  }

  _commitSegmentBoundaryEdit(scope = { type: 'card' }, segmentIndex, field, rawValue, inputEl = null) {
    this._setSegmentBoundaryText(scope, segmentIndex, field, rawValue);
    const normalizedText = this._normalizeTextValue(rawValue).trim();
    const parsedValue = this._parseSegmentBoundaryInput(rawValue);
    const nextValue = parsedValue === null ? normalizedText : parsedValue;
    const currentSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const nextSegments = currentSegments.map((segment, currentIndex) => (
      currentIndex === segmentIndex
        ? { ...segment, [field]: nextValue }
        : segment
    ));
    this._clearSegmentBoundaryText(scope, segmentIndex, field);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true });
    const message = this._getSegmentRowValidationMessage(scope, segmentIndex);
    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity(message || '');
      if (message) {
        inputEl.reportValidity?.();
      }
    }
    return applied;
  }

  _commitGradientStopDraft(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop || this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      this._refreshGradientDraftUi(scope);
      return false;
    }
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const nextStops = [...committedStops, draftStop].sort((left, right) => left.pos - right.pos);
    const applied = this._setScopedGradientStops(scope, nextStops, { rerender: true });
    if (applied !== false) {
      this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
        pos: (() => {
          const suggestion = this._getNextSuggestedGradientStopPos(scope);
          return suggestion === '' ? '' : String(suggestion);
        })(),
        color: draftStop.color,
      });
    }
    return applied;
  }

  _getGradientPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-gradient-preview`,
        trackId: `entity-${scope.index}-gradient-preview-track`,
        hintId: `entity-${scope.index}-gradient-draft-hint`,
        addSelector: `button[data-action="add-entity-gradient-stop"][data-index="${scope.index}"]`,
        draftInputId: `entity-${scope.index}-gradient-draft-pos`,
      };
    }
    return {
      previewId: 'card-gradient-preview',
      trackId: 'card-gradient-preview-track',
      hintId: 'gradient-draft-hint',
      addSelector: 'button[data-action="add-gradient-stop"]',
      draftInputId: 'gradient-draft-pos',
    };
  }

  _refreshGradientDraftUi(scope = { type: 'card' }) {
    if (!this.shadowRoot) {
      return;
    }
    const getById = this.shadowRoot.getElementById?.bind(this.shadowRoot)
      ?? ((id) => this.shadowRoot.querySelector?.(`#${id}`) ?? null);
    const { previewId, trackId, hintId, addSelector, draftInputId } = this._getGradientPreviewDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddGradientStop(scope);
    }

    const draftInput = getById(draftInputId);
    if (draftInput && typeof draftInput.closest !== 'function') {
      this._render();
      return;
    }
    const draftContainer = draftInput?.closest('.gradient-stop-draft');
    const nextMessage = this._getGradientDraftValidationMessage(scope);
    const existingHint = getById(hintId);
    if (nextMessage) {
      if (existingHint) {
        existingHint.textContent = nextMessage;
      } else if (draftContainer) {
        const hint = document.createElement('div');
        hint.id = hintId;
        hint.className = 'section-note';
        hint.textContent = nextMessage;
        draftContainer.appendChild(hint);
      }
    } else if (existingHint) {
      existingHint.remove();
    }

    const preview = getById(previewId);
    const track = getById(trackId);
    if (!preview || !track) {
      return;
    }
    track.setAttribute('style', this._getGradientPreviewStyle(scope) ?? '');
    const markerStops = this._buildGradientPreviewEffectiveStops(scope);
    const renderedStops = markerStops.length ? markerStops : this._getDefaultGradientStops();
    track.innerHTML = renderedStops.map((stop, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${this._escapeAttribute(String(stop.pos))}%"
        title="${this._escapeAttribute(`${stop.pos}%`)}"
      ></span>
    `).join('');
  }

  _commitGradientStopPosEdit(scope = { type: 'card' }, stopIndex, rawValue, inputEl = null) {
    const nextPos = this._normalizeGradientStopPosValue(rawValue);
    if (nextPos === null || this._hasGradientStopDuplicate(scope, nextPos, stopIndex)) {
      if (inputEl?.setCustomValidity) {
        inputEl.setCustomValidity(nextPos === null
          ? 'Enter a value from 0 to 100.'
          : 'Position already exists.');
        if (inputEl.reportValidity) {
          inputEl.reportValidity();
        }
      }
      return false;
    }

    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity('');
    }

    const currentStops = this._getScopedGradientStopsValue(scope);
    const nextStops = currentStops.map((stop, currentStopIndex) => (
      currentStopIndex === stopIndex
        ? { ...stop, pos: nextPos }
        : stop
    ));
    this._clearGradientStopPosText(scope, stopIndex);
    return this._setScopedGradientStops(scope, nextStops, { rerender: true });
  }

  _getFillStyleValue() {
    return this._getScopedFillStyleValue({ type: 'card' });
  }

  _getFillStyleFromColorMode(colorMode) {
    switch (colorMode) {
      case 'single': return 'solid';
      case 'gradient': return 'gradient';
      case 'severity': return 'bands';
      case 'severity_gradient': return 'band_gradient';
      default: return 'bands';
    }
  }

  _getScopedFillStyleValue(scope) {
    const fillStyle = this._getScopedValue(scope, ['bar', 'fill_style']);
    if (fillStyle) return fillStyle;
    const colorMode = this._getScopedValue(scope, ['bar', 'color_mode']) ?? this._getScopedValue(scope, ['color_mode']);
    return this._getFillStyleFromColorMode(colorMode);
  }

  _getEffectiveScopedFillStyleValue(scope) {
    if (scope?.type !== 'entity') {
      return this._getScopedFillStyleValue(scope);
    }
    return this._getEffectiveFillStyleValue(scope);
  }

  _setScopedBarFillStyle(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || normalizedValue === 'bands') {
      return this._removeCanonicalScopedValue(scope, ['bar', 'fill_style'], {
        deprecatedKeys: [['color_mode']],
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['bar', 'fill_style'], normalizedValue, {
      deprecatedKeys: [['color_mode']],
      prunePaths: [['bar']],
    });
  }

  _getScopedBarColorValue(scope) {
    return this._getScopedValue(scope, ['bar', 'color'])
      ?? this._getScopedValue(scope, ['color'])
      ?? '#4a9eff';
  }

  _getEffectiveScopedBarColorValue(scope) {
    const value = this._getEffectiveScopedDisplayValue(scope, ['bar', 'color'], [['color']]);
    return value || '#4a9eff';
  }

  _setScopedBarColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || this._normalizeColorComparisonValue(normalizedValue) === this._normalizeColorComparisonValue('#4a9eff')) {
      return this._removeCanonicalScopedValue(scope, ['bar', 'color'], {
        deprecatedKeys: [['color']],
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['bar', 'color'], normalizedValue, {
      deprecatedKeys: [['color']],
      prunePaths: [['bar']],
    });
  }

  _getScopedBarSolidFillValue(scope) {
    return !!this._getScopedValue(scope, ['bar', 'solid_fill']);
  }

  _getEffectiveScopedBarSolidFillValue(scope) {
    if (scope?.type !== 'entity') {
      return this._getScopedBarSolidFillValue(scope);
    }
    const localValue = this._getScopedValue(scope, ['bar', 'solid_fill']);
    if (localValue !== undefined) {
      return !!localValue;
    }
    return this._getScopedBarSolidFillValue({ type: 'card' });
  }

  _setScopedBarSolidFill(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['bar', 'solid_fill'], {
        prunePaths: [['bar']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['bar', 'solid_fill'], true, {
      prunePaths: [['bar']],
    });
  }

  _clearEntityBarAppearance(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'fill_style']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'color']);
      nextTarget = this._deletePathValue(nextTarget, ['bar', 'solid_fill']);
      nextTarget = this._deletePathValue(nextTarget, ['color_mode']);
      nextTarget = this._deletePathValue(nextTarget, ['color']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasEntityBarAppearanceOverride(scope) {
    const barValue = this._getScopedValue(scope, ['bar']) ?? {};
    if (this._isObject(barValue) && (
      Object.prototype.hasOwnProperty.call(barValue, 'fill_style')
      || Object.prototype.hasOwnProperty.call(barValue, 'color')
      || Object.prototype.hasOwnProperty.call(barValue, 'solid_fill')
    )) {
      return true;
    }
    return this._getScopedValue(scope, ['color_mode']) !== undefined
      || this._getScopedValue(scope, ['color']) !== undefined;
  }

  _getScopedNeedleConfig(scope) {
    const rawNeedle = this._getScopedValue(scope, ['bar', 'needle']);
    const defaultColor = '#ffffff';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (typeof rawNeedle === 'boolean') {
      mode = rawNeedle ? 'enabled' : 'disabled';
    } else if (this._isObject(rawNeedle)) {
      if (rawNeedle.show === true) {
        mode = 'enabled';
      } else if (rawNeedle.show === false) {
        mode = 'disabled';
      } else if (scope?.type !== 'entity') {
        mode = 'disabled';
      }
      color = rawNeedle.color ?? '';
    }

    if (color === defaultColor) {
      color = '';
    }

    return { mode, color };
  }

  _hasNeedleOverride(scope) {
    return this._getScopedValue(scope, ['bar', 'needle']) !== undefined;
  }

  _getEffectiveScopedNeedleConfig(scope) {
    const localNeedle = this._getScopedNeedleConfig(scope);
    if (scope?.type !== 'entity') {
      return localNeedle;
    }
    if (!this._hasNeedleOverride(scope)) {
      return this._getScopedNeedleConfig({ type: 'card' });
    }
    const inheritedNeedle = this._getScopedNeedleConfig({ type: 'card' });
    return {
      mode: localNeedle.mode === 'inherit' ? inheritedNeedle.mode : localNeedle.mode,
      color: localNeedle.color || inheritedNeedle.color,
    };
  }

  _setScopedNeedleMode(scope, mode) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const existingNeedle = this._getPathValue(nextTarget, ['bar', 'needle']);
      const existingColor = this._isObject(existingNeedle) ? existingNeedle.color : undefined;

      nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle']);

      if (scope?.type === 'entity' && mode === 'inherit') {
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      if (mode === 'disabled') {
        if (scope?.type === 'entity') {
          nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], { show: false });
        }
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      const nextNeedle = { show: true };
      if (existingColor && existingColor !== '#ffffff') {
        nextNeedle.color = existingColor;
      }
      nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
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
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _setScopedNeedleColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const current = this._getScopedNeedleConfig(scope);
      const hasCustomColor = normalizedValue
        && this._normalizeColorComparisonValue(normalizedValue) !== this._normalizeColorComparisonValue('#ffffff');

      nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle', 'color']);

      if (scope?.type !== 'entity' && current.mode === 'disabled') {
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
        nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      const showValue = current.mode === 'enabled'
        ? true
        : current.mode === 'disabled'
          ? false
          : undefined;

      const nextNeedle = {};
      if (showValue !== undefined) {
        nextNeedle.show = showValue;
      }
      if (hasCustomColor) {
        nextNeedle.color = normalizedValue;
      }

      if (Object.keys(nextNeedle).length) {
        nextTarget = this._setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['bar', 'needle']);
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _getNeedleValue() {
    return this._getScopedNeedleConfig({ type: 'card' }).mode === 'enabled';
  }

  _getPeakShowValue() {
    return this._getScopedPeakConfig({ type: 'card' }).mode === 'enabled';
  }

  _getScaleFixedValue(key, fallbackKey) {
    return this._getResolvableScopedValue({ type: 'card' }, key).fixed;
  }

  _getScaleEntityValue(key) {
    return this._getResolvableScopedValue({ type: 'card' }, key).entity;
  }

  _getTargetResolvableValue(scope) {
    return this._getResolvableScopedValue(scope, 'target', {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
    });
  }

  _getEffectiveTargetResolvableValue(scope) {
    return this._getEffectiveResolvableScopedValue(scope, 'target', {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
    });
  }

  _getTargetMode(scope) {
    const enabled = this._getScopedValue(scope, ['target', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasTargetOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getEffectiveTargetMode(scope) {
    const mode = this._getTargetMode(scope);
    if (scope?.type !== 'entity' || mode !== 'inherit') {
      return mode;
    }
    const cardMode = this._getTargetMode({ type: 'card' });
    if (cardMode === 'disabled') return 'disabled';
    if (cardMode === 'enabled') return 'enabled';
    const cardTarget = this._getTargetResolvableValue({ type: 'card' });
    return this._hasResolvableOverride(cardTarget)
      || this._hasCustomTargetColor({ type: 'card' })
      || this._getTargetLabelShowValue({ type: 'card' })
      || !!this._getTargetAboveFillColorValue({ type: 'card' })
      ? 'enabled'
      : 'disabled';
  }

  _setTargetMode(scope, mode) {
    if (scope?.type === 'entity' && mode === 'inherit') {
      return this._clearTargetOverride(scope);
    }
    if (mode === 'auto') {
      return this._removeCanonicalScopedValue(scope, ['target', 'enabled'], {
        prunePaths: [['target']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['target', 'enabled'], mode === 'enabled', {
      prunePaths: [['target']],
    });
  }

  _setTargetResolvablePart(scope, part, rawValue) {
    return this._setCanonicalResolvablePart(scope, 'target', part, rawValue, {
      canonicalBasePath: ['target', 'at'],
      legacyFixedPath: ['target'],
      legacyEntityPath: ['target_entity'],
      prunePaths: [['target', 'at'], ['target']],
    });
  }

  _clearTargetOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const rawTarget = this._getPathValue(nextTarget, ['target']);
      if (this._isObject(rawTarget)) {
        nextTarget = this._deletePathValue(nextTarget, ['target', 'enabled']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'at']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'color']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'label', 'show']);
        nextTarget = this._deletePathValue(nextTarget, ['target', 'when_exceeded', 'fill_color']);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['target']);
      }
      nextTarget = this._deletePathValue(nextTarget, ['target_entity']);
      nextTarget = this._deletePathValue(nextTarget, ['target_color']);
      nextTarget = this._deletePathValue(nextTarget, ['show_target_label']);
      nextTarget = this._deletePathValue(nextTarget, ['above_target_color']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target', 'label']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target', 'when_exceeded']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['target']);
      return nextTarget;
    }, { rerender: true });
  }

  _getTargetColorValue(scope) {
    return this._getScopedValue(scope, ['target', 'color'])
      ?? this._getScopedValue(scope, ['target_color'])
      ?? '';
  }

  _getEffectiveTargetColorValue(scope) {
    return this._getEffectiveScopedDisplayValue(scope, ['target', 'color'], [['target_color']]);
  }

  _hasCustomTargetColor(scope) {
    const color = this._getTargetColorValue(scope);
    return !!color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#888');
  }

  _setTargetColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    if (!normalizedValue || this._normalizeColorComparisonValue(normalizedValue) === this._normalizeColorComparisonValue('#888')) {
      return this._removeCanonicalScopedValue(scope, ['target', 'color'], {
        deprecatedKeys: [['target_color']],
        prunePaths: [['target']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['target', 'color'], normalizedValue, {
      deprecatedKeys: [['target_color']],
      prunePaths: [['target']],
    });
  }

  _getTargetLabelShowValue(scope) {
    const structuredValue = this._getScopedValue(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    return !!this._getScopedValue(scope, ['show_target_label']);
  }

  _getEffectiveTargetLabelShowValue(scope) {
    const structuredValue = this._getScopedValue(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    const legacyValue = this._getScopedValue(scope, ['show_target_label']);
    if (legacyValue !== undefined) {
      return !!legacyValue;
    }
    if (scope?.type === 'entity') {
      return this._getTargetLabelShowValue({ type: 'card' });
    }
    return false;
  }

  _setTargetLabelShow(scope, value) {
    if (!value) {
      return this._removeCanonicalScopedValue(scope, ['target', 'label', 'show'], {
        deprecatedKeys: [['show_target_label']],
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    return this._setCanonicalScopedValue(scope, ['target', 'label', 'show'], true, {
      deprecatedKeys: [['show_target_label']],
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _getTargetAboveFillColorValue(scope) {
    return this._getScopedValue(scope, ['target', 'when_exceeded', 'fill_color'])
      ?? this._getScopedValue(scope, ['above_target_color'])
      ?? '';
  }

  _getTargetAboveFillDraftKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _setTargetAboveFillDraft(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const key = this._getTargetAboveFillDraftKey(scope);
    if (normalizedValue) {
      this._targetAboveFillDrafts.set(key, normalizedValue);
    } else {
      this._targetAboveFillDrafts.delete(key);
    }
  }

  _getTargetAboveFillDraft(scope) {
    return this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(scope)) ?? '';
  }

  _getBaselineColorDraftKey(scope = { type: 'card' }, direction = 'above') {
    const scopeKey = scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
    return `${scopeKey}:${direction}`;
  }

  _setBaselineColorDraft(scope, direction, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    const key = this._getBaselineColorDraftKey(scope, direction);
    if (normalizedValue) {
      this._baselineColorDrafts.set(key, normalizedValue);
    } else {
      this._baselineColorDrafts.delete(key);
    }
  }

  _getBaselineColorDraft(scope, direction) {
    return this._baselineColorDrafts.get(this._getBaselineColorDraftKey(scope, direction)) ?? '';
  }

  _getEffectiveTargetAboveFillColorValue(scope) {
    return this._getEffectiveScopedDisplayValue(scope, ['target', 'when_exceeded', 'fill_color'], [['above_target_color']]);
  }

  _setTargetAboveFillColor(scope, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    this._setTargetAboveFillDraft(scope, normalizedValue);
    if (!this._isTargetAboveFillEnabled(scope)) {
      return false;
    }
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    return this._setCanonicalScopedTextOverride(scope, ['target', 'when_exceeded', 'fill_color'], normalizedValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _isTargetAboveFillEnabled(scope) {
    return !!this._normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
  }

  _setTargetAboveFillEnabled(scope, value) {
    const currentValue = this._normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
    if (!value) {
      if (currentValue) {
        this._setTargetAboveFillDraft(scope, currentValue);
      }
      return this._removeCanonicalScopedValue(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    const nextValue = this._getTargetAboveFillDraft(scope)
      || this._normalizeTextValue(this._getEffectiveTargetAboveFillColorValue(scope)).trim()
      || currentValue
      || '#000000';
    return this._setCanonicalScopedTextOverride(scope, ['target', 'when_exceeded', 'fill_color'], nextValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _isBaselineDirectionalColorEnabled(scope, direction) {
    return !!this._normalizeTextValue(this._getBaselineDirectionalColorValue(scope, direction)).trim();
  }

  _setBaselineDirectionalColorEnabled(scope, direction, value) {
    const currentValue = this._normalizeTextValue(this._getBaselineDirectionalColorValue(scope, direction)).trim();
    if (!value) {
      if (currentValue) {
        this._setBaselineColorDraft(scope, direction, currentValue);
      }
      return this._removeCanonicalScopedValue(scope, ['baseline', direction, 'color'], {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    const nextValue = this._getBaselineColorDraft(scope, direction)
      || this._normalizeTextValue(this._getEffectiveBaselineDirectionalColorValue(scope, direction)).trim()
      || currentValue
      || '#000000';
    return this._setCanonicalScopedTextOverride(scope, ['baseline', direction, 'color'], nextValue, {
      prunePaths: [['baseline', direction], ['baseline']],
    });
  }

  _hasTargetOverride(scope) {
    const targetValue = this._getScopedValue(scope, ['target']);
    if (this._isObject(targetValue) && Object.keys(targetValue).length) {
      return true;
    }
    if (!this._isObject(targetValue) && targetValue !== undefined && targetValue !== null && targetValue !== '') {
      return true;
    }
    return ['target_entity', 'target_color', 'show_target_label', 'above_target_color']
      .some((key) => {
        const value = this._getScopedValue(scope, [key]);
        return value !== undefined && value !== null && value !== '' && value !== false;
      });
  }

  _getBaselineResolvableValue(scope) {
    return this._getResolvableScopedValue(scope, 'baseline', {
      canonicalBasePath: ['baseline', 'at'],
      legacyFixedPath: ['baseline'],
      legacyEntityPath: ['baseline', 'at', 'entity'],
    });
  }

  _getEffectiveBaselineResolvableValue(scope) {
    return this._getEffectiveResolvableScopedValue(scope, 'baseline', {
      canonicalBasePath: ['baseline', 'at'],
      legacyFixedPath: ['baseline'],
      legacyEntityPath: ['baseline', 'at', 'entity'],
    });
  }

  _getBaselineMode(scope) {
    const enabled = this._getScopedValue(scope, ['baseline', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasBaselineOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getEffectiveBaselineMode(scope) {
    const mode = this._getBaselineMode(scope);
    if (scope?.type !== 'entity' || mode !== 'inherit') {
      return mode;
    }
    const cardMode = this._getBaselineMode({ type: 'card' });
    if (cardMode === 'disabled') return 'disabled';
    if (cardMode === 'enabled') return 'enabled';
    const cardBaseline = this._getBaselineResolvableValue({ type: 'card' });
    return this._hasResolvableOverride(cardBaseline)
      || !!this._getBaselineDirectionalColorValue({ type: 'card' }, 'above')
      || !!this._getBaselineDirectionalColorValue({ type: 'card' }, 'below')
      ? 'enabled'
      : 'disabled';
  }

  _setBaselineMode(scope, mode) {
    if (scope?.type === 'entity' && mode === 'inherit') {
      return this._clearBaselineOverride(scope);
    }
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      if (mode === 'auto') {
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'enabled']);
      } else {
        nextTarget = this._setPathValue(nextTarget, ['baseline', 'enabled'], mode === 'enabled');
      }

      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    });
  }

  _setBaselineResolvablePart(scope, part, rawValue) {
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

  _removeScopedNeedle(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._deletePathValue(target, ['bar', 'needle']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _setBaselineDirectionalColor(scope, direction, rawValue) {
    const normalizedValue = this._normalizeTextValue(rawValue).trim();
    this._setBaselineColorDraft(scope, direction, normalizedValue);
    const path = ['baseline', direction, 'color'];
    if (!normalizedValue) {
      return this._removeCanonicalScopedValue(scope, path, {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    if (!this._isBaselineDirectionalColorEnabled(scope, direction)) {
      return this._setBaselineDirectionalColorEnabled(scope, direction, true);
    }
    return this._applyScopedMutation(scope, (target) => {
      return this._setPathValue(target, path, normalizedValue);
    });
  }

  _getBaselineDirectionalColorValue(scope, direction) {
    return this._getScopedValue(scope, ['baseline', direction, 'color']) ?? '';
  }

  _getEffectiveBaselineDirectionalColorValue(scope, direction) {
    return this._getEffectiveScopedDisplayValue(scope, ['baseline', direction, 'color']);
  }

  _clearBaselineOverride(scope) {
    return this._applyScopedMutation(scope, (target) => {
      let nextTarget = this._cloneDeep(target);
      const rawBaseline = this._getPathValue(nextTarget, ['baseline']);
      if (this._isObject(rawBaseline)) {
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'enabled']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'at']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'above', 'color']);
        nextTarget = this._deletePathValue(nextTarget, ['baseline', 'below', 'color']);
      } else {
        nextTarget = this._deletePathValue(nextTarget, ['baseline']);
      }
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'above']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'below']);
      nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    }, { rerender: true });
  }

  _hasBaselineOverride(scope) {
    const baselineValue = this._getScopedValue(scope, ['baseline']);
    if (this._isObject(baselineValue) && Object.keys(baselineValue).length) {
      return true;
    }
    return !this._isObject(baselineValue) && baselineValue !== undefined && baselineValue !== null && baselineValue !== '';
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

  _hasExplicitOverrideValue(value) {
    return value !== '' && value !== undefined && value !== null;
  }

  _hasResolvableOverride(parts) {
    return this._hasExplicitOverrideValue(parts?.fixed) || this._hasExplicitOverrideValue(parts?.entity);
  }

  _getScaleOverrideSummary(scope) {
    const parts = [];
    const min = this._getResolvableScopedValue(scope, 'min');
    const max = this._getResolvableScopedValue(scope, 'max');
    if (min.entity) parts.push('Min entity');
    else if (min.fixed !== '' && min.fixed !== undefined) parts.push(`Min ${min.fixed}`);
    if (max.entity) parts.push('Max entity');
    else if (max.fixed !== '' && max.fixed !== undefined) parts.push(`Max ${max.fixed}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
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

  _getTargetOverrideSummary(scope) {
    const mode = this._getTargetMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const target = this._getTargetResolvableValue(scope);
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(`Target ${target.fixed}`);
    if (target.entity) parts.push('Entity');
    if (this._hasCustomTargetColor(scope)) parts.push('Custom color');
    if (this._getTargetLabelShowValue(scope)) parts.push('Label');
    if (this._getTargetAboveFillColorValue(scope)) parts.push('Above');
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getBaselineOverrideSummary(scope) {
    const mode = this._getBaselineMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const baseline = this._getBaselineResolvableValue(scope);
    if (baseline.fixed !== '' && baseline.fixed !== undefined) parts.push(`Baseline ${baseline.fixed}`);
    if (baseline.entity) parts.push('Entity');
    if (this._getBaselineDirectionalColorValue(scope, 'above')) parts.push('Above');
    if (this._getBaselineDirectionalColorValue(scope, 'below')) parts.push('Below');
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getBarAppearanceSummary(scope) {
    const parts = [];
    const fillStyle = this._getScopedFillStyleValue(scope);
    const color = this._getScopedValue(scope, ['bar', 'color']) ?? this._getScopedValue(scope, ['color']);
    if (fillStyle && fillStyle !== 'bands') parts.push(fillStyle.replace(/_/g, ' '));
    if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue('#4a9eff')) {
      parts.push('Custom color');
    }
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _getScopedSegmentsValue(scope) {
    const uiRows = this._getSegmentsUiRows(scope);
    if (uiRows !== null) {
      return this._cloneDeep(uiRows);
    }
    const storedSegments = this._getStoredScopedSegments(scope);
    if (storedSegments !== null) {
      return this._sortSegmentsForEditor(storedSegments);
    }
    return this._sortSegmentsForEditor(this._getFallbackSegments(scope));
  }

  _hasSegmentsOverride(scope) {
    return this._getStoredScopedSegments(scope) !== null;
  }

  _getSegmentsSummary(scope) {
    const segments = this._getScopedSegmentsValue(scope);
    if (!Array.isArray(segments) || segments.length === 0) {
      return 'Inherited';
    }
    if (scope?.type !== 'entity' && !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))) {
      return 'Default bands';
    }
    return `${segments.length} segments`;
  }

  _getEffectiveFillStyleValue(scope) {
    if (scope?.type === 'entity') {
      const hasEntityFillStyle =
        this._getScopedValue(scope, ['bar', 'fill_style']) !== undefined
        || this._getScopedValue(scope, ['bar', 'color_mode']) !== undefined
        || this._getScopedValue(scope, ['color_mode']) !== undefined;
      if (hasEntityFillStyle) {
        return this._getScopedFillStyleValue(scope);
      }
      return this._getFillStyleValue();
    }
    return this._getScopedFillStyleValue(scope);
  }

  _getScopedGradientStopsValue(scope) {
    const localRows = this._getGradientStopsUiRows(scope);
    if (Array.isArray(localRows)) {
      return localRows;
    }
    const storedStops = this._getStoredScopedGradientStops(scope);
    if (storedStops !== null) {
      return this._sanitizeGradientStopsForEmit(storedStops);
    }
    return this._cloneDeep(this._getFallbackGradientStops(scope));
  }

  _hasGradientStopsOverride(scope) {
    if (this._getStoredScopedGradientStops(scope) !== null) {
      return true;
    }
    const localRows = this._getGradientStopsUiRows(scope);
    if (!Array.isArray(localRows)) {
      return false;
    }
    return this._serializeConfig(this._sanitizeGradientStopsForEmit(localRows))
      !== this._serializeConfig(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(scope)));
  }

  _getGradientStopsSummary(scope) {
    if (scope?.type === 'entity' && !this._hasGradientStopsOverride(scope)) {
      return 'Inherited';
    }
    const gradientStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (this._getEffectiveFillStyleValue(scope) !== 'gradient') {
      return 'Inactive fill style';
    }
    if (!gradientStops.length) {
      return scope?.type === 'entity' ? 'Inherited' : 'Default gradient';
    }
    if (this._isDefaultGradientStops(gradientStops)) {
      return 'Default gradient';
    }
    return `${gradientStops.length} stops`;
  }

  _buildGradientPreviewEffectiveStops(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const draftStop = this._getValidGradientDraftStop(scope);
    const previewStops = [...committedStops];
    if (draftStop && !this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      previewStops.push(draftStop);
    }
    return previewStops.sort((left, right) => left.pos - right.pos);
  }

  _buildEditorGradientPreviewStyle(stops) {
    if (!Array.isArray(stops) || !stops.length) {
      return '';
    }
    const cssStops = stops
      .map((stop) => {
        const color = this._normalizeTextValue(stop.color).trim();
        const pos = this._normalizeGradientStopPosValue(stop.p ?? stop.pos);
        if (!color || pos === null) {
          return null;
        }
        return `${color} ${pos}%`;
      })
      .filter(Boolean);
    if (!cssStops.length) {
      return '';
    }
    return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
  }

  _getGradientPreviewStyle(scope = { type: 'card' }) {
    const previewStops = this._buildGradientPreviewEffectiveStops(scope);
    const resolvedStops = previewStops.length >= 2
      ? previewStops.map((stop) => ({ p: stop.pos, color: stop.color }))
      : this._getDefaultGradientStops().map((stop) => ({ p: stop.pos, color: stop.color }));
    return this._buildEditorGradientPreviewStyle(resolvedStops);
  }

  _renderGradientPreview(scope = { type: 'card' }, options = {}) {
    const previewId = options.previewId ?? 'gradient-preview';
    const trackId = options.trackId ?? `${previewId}-track`;
    const effectiveStops = this._buildGradientPreviewEffectiveStops(scope);
    const markerStops = effectiveStops.length ? effectiveStops : this._getDefaultGradientStops();
    return `
      <div id="${previewId}" class="gradient-preview">
        <div id="${trackId}" class="gradient-preview-track" style="${this._escapeAttribute(this._getGradientPreviewStyle(scope) ?? '')}">
          ${markerStops.map((stop, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${this._escapeAttribute(String(stop.pos))}%"
              title="${this._escapeAttribute(`${stop.pos}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _getNeedleSummary(scope) {
    if (scope?.type === 'entity' && !this._hasNeedleOverride(scope)) return 'Inherited';
    const needle = this._getScopedNeedleConfig(scope);
    if (needle.mode === 'disabled') return needle.color ? 'Disabled • Custom color' : 'Disabled';
    if (needle.mode === 'enabled') return needle.color ? 'Enabled • Custom color' : 'Enabled';
    if (needle.color) return 'Custom color';
    return 'Inherited';
  }

  _getFormattingSummary(scope) {
    const parts = [];
    const unit = this._getScopedFormattingValue(scope, 'unit');
    const decimal = this._getScopedFormattingValue(scope, 'decimal');
    if (unit !== '') parts.push(`Unit ${unit}`);
    if (decimal !== '') parts.push(`${decimal} ${Number(decimal) === 1 ? 'decimal' : 'decimals'}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
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

  _renderCardGroup({ group, title, summary, content, inactive = false }) {
    const expanded = this._isCardGroupExpanded(group);
    return `
      <div class="override-group card-subgroup${inactive ? ' is-inactive' : ''}" data-group="${group}" data-expanded="${expanded ? 'true' : 'false'}">
        <button
          type="button"
          id="card-group-${group}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${group}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <span id="card-group-${group}-title" class="override-group-title">${expanded ? '▾' : '▸'} ${title}</span>
          <span id="card-group-${group}-summary" class="override-group-summary">${this._escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? 'grid' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }

  _renderEntityInput(entry, index) {
    if (customElements.get('ha-entity-picker')) {
      return `<ha-entity-picker data-kind="entity-picker" data-index="${index}"></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="entity-input" data-index="${index}" value="${this._escapeAttribute(entry.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }

  _renderEntitySourceInput(kind, index, value, placeholder = 'sensor.example') {
    if (customElements.get('ha-entity-picker')) {
      return `<ha-entity-picker data-kind="${kind}" data-index="${index}"></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="${kind}" data-index="${index}" value="${this._escapeAttribute(value)}" placeholder="${this._escapeAttribute(placeholder)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }

  _escapeAttribute(value) {
    return this._normalizeTextValue(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _isHexColorValue(value) {
    return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  }

  _expandHexColor(value) {
    if (!this._isHexColorValue(value)) {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 7) {
      return normalized;
    }
    return `#${normalized.slice(1).split('').map((char) => char + char).join('')}`;
  }

  _normalizeColorComparisonValue(value) {
    const normalizedText = this._normalizeTextValue(value).trim().toLowerCase();
    if (!normalizedText) {
      return '';
    }
    return this._expandHexColor(normalizedText) ?? normalizedText;
  }

  _getColorPickerValue(value, fallbackHex = '#000000') {
    return this._expandHexColor(value) ?? this._expandHexColor(fallbackHex) ?? '#000000';
  }

  _renderColorInput({ id, field = null, kind = null, index = null, value = '', fallbackHex = '#000000', placeholder = '', extraDataset = {} }) {
    const controlValue = this._normalizeTextValue(value).trim();
    const pickerValue = this._getColorPickerValue(controlValue, fallbackHex);
    const extraAttrs = Object.entries(extraDataset)
      .map(([key, entry]) => `data-${key}="${this._escapeAttribute(entry)}"`)
      .join(' ');
    const baseAttrs = field
      ? `data-field="${field}"${extraAttrs ? ` ${extraAttrs}` : ''}`
      : `data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;
    const fallbackAttrs = field
      ? `data-field="${field}-text-fallback"${extraAttrs ? ` ${extraAttrs}` : ''}`
      : `data-kind="${kind}-text-fallback" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;

    return `
      <div class="field-grid">
        <input id="${id}" type="color" ${baseAttrs} value="${this._escapeAttribute(pickerValue)}">
        ${controlValue && !this._isHexColorValue(controlValue)
          ? `<input type="text" ${fallbackAttrs} value="${this._escapeAttribute(controlValue)}" placeholder="${this._escapeAttribute(placeholder || 'CSS color value')}">`
          : ''
        }
      </div>
    `;
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
      const layoutHeight = this._getScopedLayoutValue({ type: 'card' }, 'height');
      const layoutLabelWidth = this._getScopedLayoutValue({ type: 'card' }, 'width');
      const barColor = this._getScopedBarColorValue({ type: 'card' });
      const barSolidFill = this._getScopedBarSolidFillValue({ type: 'card' });
      const cardNeedle = this._getScopedNeedleConfig({ type: 'card' });
      const gradientStops = this._getGradientStopsValue();
      const gradientDraft = this._getGradientStopsDraftState({ type: 'card' });
      const gradientDraftMessage = this._getGradientDraftValidationMessage({ type: 'card' });
      const segments = this._getSegmentsValue();
      const baseline = this._getBaselineResolvableValue({ type: 'card' });
      const baselineMode = this._getBaselineMode({ type: 'card' });
      const baselineAboveColor = this._getBaselineDirectionalColorValue({ type: 'card' }, 'above');
      const baselineBelowColor = this._getBaselineDirectionalColorValue({ type: 'card' }, 'below');
      const target = this._getTargetResolvableValue({ type: 'card' });
      const targetMode = this._getTargetMode({ type: 'card' });
      const targetColor = this._getTargetColorValue({ type: 'card' });
      const targetLabelShow = this._getTargetLabelShowValue({ type: 'card' });
      const targetAboveFillColor = this._getTargetAboveFillColorValue({ type: 'card' });
      const formattingUnit = this._getScopedFormattingValue({ type: 'card' }, 'unit');
      const formattingDecimal = this._getScopedFormattingValue({ type: 'card' }, 'decimal');
      const cardPeak = this._getScopedPeakConfig({ type: 'card' });
      const scaleMin = this._getScaleFixedValue('min', 'min');
      const scaleMax = this._getScaleFixedValue('max', 'max');
      const scaleMinEntity = this._getScaleEntityValue('min');
      const scaleMaxEntity = this._getScaleEntityValue('max');
      const gradientStopsSummary = this._getGradientStopsSummary({ type: 'card' });
      const gradientStopsInactive = this._getEffectiveFillStyleValue({ type: 'card' }) !== 'gradient';
      const defaultSegmentsVisible = !this._hasSegmentsOverride({ type: 'card' }) && this._isSegmentFillStyle(this._getEffectiveFillStyleValue({ type: 'card' }));
      this._syncExpandedEntityOverrides(entities.length);

      this.shadowRoot.innerHTML = `
	      <style>
	        :host {
	          display: block;
	        }
	        .editor {
	          display: grid;
	          gap: 18px;
	          padding: 10px 0 14px;
	        }
	        .section {
	          display: grid;
	          gap: 14px;
	          padding: 14px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 88%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 35%, transparent);
	          border-radius: 14px;
	          box-shadow: 0 1px 0 color-mix(in srgb, var(--divider-color, #888) 20%, transparent);
	        }
	        .section-head {
	          display: grid;
	          gap: 4px;
	        }
	        .section h3 {
	          margin: 0;
	          font-size: 1rem;
	          font-weight: 700;
	          letter-spacing: 0.01em;
	          color: var(--primary-text-color, #111);
	        }
	        .section-note {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	        }
	        .field-grid {
	          display: grid;
	          gap: 12px;
	        }
	        .editor-grid,
	        .field-row {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .inline-row {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	          align-items: end;
	        }
	        label {
	          font-size: 0.9rem;
	          font-weight: 500;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	        }
	        input,
	        select,
	        button {
	          font: inherit;
        }
        input[type="text"],
        input[type="number"],
	        input[type="color"],
	        select {
	          width: 100%;
	          box-sizing: border-box;
	          min-height: 42px;
	          padding: 8px 10px;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 82%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 38%, transparent);
	          border-radius: 10px;
	        }
	        input[type="color"] {
	          padding: 4px;
	          cursor: pointer;
	        }
	        input[type="text"]:focus,
	        input[type="number"]:focus,
	        input[type="color"]:focus,
	        select:focus {
	          outline: 2px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 55%, transparent);
	          outline-offset: 1px;
	        }
	        input[type="checkbox"] {
	          width: 18px;
	          height: 18px;
	        }
	        .toggle {
	          display: flex;
	          gap: 8px;
	          align-items: center;
	          flex-wrap: wrap;
	        }
	        .list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .list-row {
	          display: grid;
	          gap: 10px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: end;
	          min-width: 0;
	        }
	        .list-row.triple {
	          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
	        }
	        .list-row.segment-row {
	          grid-template-columns: minmax(72px, 1fr) minmax(72px, 1fr) minmax(52px, 64px) 40px;
	          align-items: center;
	        }
	        .list-row.segment-row > * {
	          min-width: 0;
	        }
	        .list-row.segment-row > button {
	          width: 40px;
	          min-width: 40px;
	          padding: 6px;
	          justify-self: end;
	        }
	        .list-row.gradient-stop-row {
	          grid-template-columns: minmax(110px, 1fr) minmax(120px, 1fr) auto;
	        }
	        .gradient-stop-list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .gradient-stop-draft {
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .segment-editor-row {
	          display: grid;
	          gap: 6px;
	          min-width: 0;
	        }
	        .segment-draft {
	          display: grid;
	          gap: 6px;
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .gradient-preview {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .gradient-preview-track {
	          position: relative;
	          width: 100%;
	          min-height: 28px;
	          min-width: 0;
	          border-radius: 999px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: linear-gradient(to right, #4CAF50 0%, #FF9800 50%, #F44336 100%);
	          box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-background-color, #fff) 35%, transparent);
	          overflow: hidden;
	        }
	        .gradient-preview-stop {
	          position: absolute;
	          top: 3px;
	          bottom: 3px;
	          width: 2px;
	          margin-left: -1px;
	          border-radius: 999px;
	          background: color-mix(in srgb, var(--primary-text-color, #111) 72%, transparent);
	          box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 52%, transparent);
	        }
	        .entity-shell {
	          display: grid;
	          gap: 10px;
	          padding: 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 68%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 14px;
	        }
	        .entity-main {
	          display: grid;
	          gap: 10px;
	          padding: 10px 12px 12px;
	          min-width: 0;
	          border-radius: 12px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	        }
	        .entity-header {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: start;
	          padding-bottom: 4px;
	          border-bottom: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	        }
	        .entity-header-main {
	          display: grid;
	          gap: 4px;
	          min-width: 0;
	          flex: 1 1 auto;
	        }
	        .entity-title {
	          font-size: 0.95rem;
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	        }
	        .entity-subtitle {
	          font-size: 0.8rem;
	          color: var(--secondary-text-color, #666);
	          min-width: 0;
	          overflow: hidden;
	          text-overflow: ellipsis;
	          white-space: nowrap;
	        }
	        .entity-actions {
	          display: flex;
	          flex-wrap: wrap;
	          justify-content: flex-end;
	          align-items: center;
	          gap: 8px;
	          flex: 0 0 auto;
	          min-width: min(100%, 240px);
	        }
	        .entity-actions button {
	          min-height: 34px;
	          padding: 6px 10px;
	          flex: 0 1 auto;
	        }
	        .entity-fields {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .override-toggle {
	          display: inline-flex;
	          align-items: center;
	          gap: 8px;
	          justify-self: start;
	          padding: 8px 10px;
	          border-radius: 10px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
	          color: var(--secondary-text-color, #666);
	          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
	        }
	        .override-toggle:hover,
	        .override-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 74%, transparent);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 28%, var(--divider-color, #888));
	          color: var(--primary-text-color, #111);
	        }
	        .override-toggle[aria-expanded="true"] {
	          color: var(--primary-text-color, #111);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 40%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 70%, transparent);
	        }
	        .override-panel {
	          display: grid;
	          gap: 12px;
	          padding: 12px 14px;
	          min-width: 0;
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          border-left: 4px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 65%, transparent);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #ffffff)) 82%, transparent);
	        }
	        .override-panel::before {
	          content: "Overrides";
	          font-size: 0.78rem;
	          font-weight: 700;
	          letter-spacing: 0.04em;
	          text-transform: uppercase;
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	          --override-group-accent: var(--accent-color, var(--primary-color, #03a9f4));
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 78%, transparent);
	          overflow: hidden;
	        }
	        .override-group[data-group="scale"] {
	          --override-group-accent: #4f8dff;
	        }
	        .override-group[data-group="target"] {
	          --override-group-accent: #ff9b3d;
	        }
	        .override-group[data-group="baseline"] {
	          --override-group-accent: #5bbd6d;
	        }
	        .override-group[data-group="bar"] {
	          --override-group-accent: #34c6d3;
	        }
	        .override-group[data-group="needle"] {
	          --override-group-accent: #9b6bff;
	        }
	        .override-group[data-group="formatting"] {
	          --override-group-accent: #d46be3;
	        }
	        .override-group[data-group="layout"] {
	          --override-group-accent: #6e90ff;
	        }
	        .override-group[data-group="peak"] {
	          --override-group-accent: #f08b3e;
	        }
	        .override-group[data-group="segments"] {
	          --override-group-accent: #d2a53a;
	        }
	        .override-group[data-group="gradient-stops"] {
	          --override-group-accent: #48b978;
	        }
	        .card-subgroup {
	          margin-top: 2px;
	        }
	        .override-group.is-inactive .override-group-summary,
	        .override-group.is-inactive .section-note {
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group.is-inactive .override-group-body {
	          opacity: 0.92;
	        }
	        .override-group-toggle {
	          display: flex;
	          justify-content: space-between;
	          align-items: flex-start;
	          gap: 12px;
	          width: 100%;
	          text-align: left;
	          border: 0;
	          border-radius: 0;
	          background: transparent;
	          padding: 10px 12px;
	          min-width: 0;
	        }
	        .override-group-toggle:hover,
	        .override-group-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
	        }
	        .override-group[data-expanded="true"] {
	          border-color: color-mix(in srgb, var(--override-group-accent) 34%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--override-group-accent) 70%, transparent);
	        }
	        .override-group-title {
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	          overflow-wrap: anywhere;
	        }
	        .override-group-summary {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	          text-align: right;
	          min-width: 0;
	          max-width: 42%;
	          white-space: nowrap;
	          overflow: hidden;
	          text-overflow: ellipsis;
	        }
	        .override-group-body {
	          display: grid;
	          gap: 12px;
	          padding: 0 12px 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	        }
	        button {
	          min-height: 40px;
	          padding: 8px 12px;
	          cursor: pointer;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 10px;
	        }
	        button:hover,
	        button:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 60%, transparent);
	        }
	        button:disabled {
	          cursor: not-allowed;
	          opacity: 0.58;
	          color: var(--secondary-text-color, #666);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	          border-color: color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	          box-shadow: none;
	        }
	        button:disabled:hover,
	        button:disabled:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	        }
	        .field-row .field-grid {
	          gap: 8px;
	          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	          align-items: end;
	        }
	        .field-row .field-grid > * {
	          min-width: 0;
	        }
	        ha-entity-picker {
	          min-width: 0;
	          width: 100%;
	        }
	        @media (max-width: 720px) {
	          .section {
	            gap: 12px;
	          }
	          .inline-row {
	            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	          }
	          .override-group-toggle {
	            flex-wrap: wrap;
	          }
	          .override-group-summary {
	            max-width: 100%;
	            flex: 1 1 100%;
	            text-align: left;
	          }
	          .entity-actions {
	            min-width: 0;
	            justify-content: flex-start;
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(3, minmax(0, 1fr)) 40px;
	          }
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: auto;
	            width: 40px;
	          }
	        }
	        @media (max-width: 480px) {
	          .section {
	            padding: 12px;
	          }
	          .inline-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-shell,
	          .entity-main,
	          .override-panel {
	            padding-left: 10px;
	            padding-right: 10px;
	          }
	          .entity-header {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-actions {
	            width: 100%;
	          }
	          .entity-actions button {
	            flex: 1 1 120px;
	          }
	          .list-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row > button,
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	        }
	      </style>
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
                        const minParts = this._getEffectiveResolvableScopedValue(scope, 'min');
                        const maxParts = this._getEffectiveResolvableScopedValue(scope, 'max');
	                        const barAppearanceInherited = !this._hasEntityBarAppearanceOverride(scope);
	                        const needleInherited = !this._hasNeedleOverride(scope);
	                        const entityNeedle = this._getEffectiveScopedNeedleConfig(scope);
	                        const baselineInherited = !this._hasBaselineOverride(scope);
	                        const baselineParts = this._getEffectiveBaselineResolvableValue(scope);
	                        const baselineMode = this._getEffectiveBaselineMode(scope);
	                        const targetInherited = !this._hasTargetOverride(scope);
	                        const targetParts = this._getEffectiveTargetResolvableValue(scope);
	                        const targetMode = this._getEffectiveTargetMode(scope);
	                        const formattingInherited = !this._hasFormattingOverride(scope);
	                        const layoutInherited = !this._hasLayoutOverride(scope);
	                        const peakInherited = !this._hasPeakOverride(scope);
	                        const gradientStopsInherited = !this._hasGradientStopsOverride(scope);
	                        const segmentsInherited = !this._hasSegmentsOverride(scope);
	                        const scaleInherited = !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'min'))
	                          && !this._hasResolvableOverride(this._getResolvableScopedValue(scope, 'max'));
	                        const entityPeak = this._getEffectiveScopedPeakConfig(scope);
	                        const entityGradientStops = this._getScopedGradientStopsValue(scope);
	                        const entityGradientDraft = this._getGradientStopsDraftState(scope);
	                        const entityGradientDraftMessage = this._getGradientDraftValidationMessage(scope);
	                        const entitySegments = this._getScopedSegmentsValue(scope);
	                        const scaleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'scale',
	                          title: 'Scale',
	                          summary: this._getScaleOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${index}"${scaleInherited ? ' checked' : ''}>
	                          <label for="entity-${index}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${index}-min">Min fallback</label>
                        <input id="entity-${index}-min" type="number" step="any" data-kind="entity-override-min" data-index="${index}" value="${this._escapeAttribute(minParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${this._renderEntitySourceInput('entity-override-min-entity-source', index, minParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-max">Max fallback</label>
                        <input id="entity-${index}-max" type="number" step="any" data-kind="entity-override-max" data-index="${index}" value="${this._escapeAttribute(maxParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${this._renderEntitySourceInput('entity-override-max-entity-source', index, maxParts.entity, 'inherit card default')}
                      </div>
	                          `,
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
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${index}"${barAppearanceInherited ? ' checked' : ''}>
                          <label for="entity-${index}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-fill-style">Fill style</label>
                        <select id="entity-${index}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFillStyleValue(scope))}">
                          <option value="bands"${this._getEffectiveScopedFillStyleValue(scope) === 'bands' ? ' selected' : ''}>bands</option>
                          <option value="solid"${this._getEffectiveScopedFillStyleValue(scope) === 'solid' ? ' selected' : ''}>solid</option>
                          <option value="gradient"${this._getEffectiveScopedFillStyleValue(scope) === 'gradient' ? ' selected' : ''}>gradient</option>
                          <option value="soft_bands"${this._getEffectiveScopedFillStyleValue(scope) === 'soft_bands' ? ' selected' : ''}>soft_bands</option>
                          <option value="band_gradient"${this._getEffectiveScopedFillStyleValue(scope) === 'band_gradient' ? ' selected' : ''}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${index}"${this._getEffectiveScopedBarSolidFillValue(scope) ? ' checked' : ''}>
                          <label for="entity-${index}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-color">Bar color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-bar-color`,
                          kind: 'entity-bar-color',
                          index,
                          value: this._getEffectiveScopedBarColorValue(scope),
                          fallbackHex: '#4a9eff',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                          `,
	                        });
	                        const needleGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'needle',
	                          title: 'Needle',
	                          summary: this._getNeedleSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${index}"${needleInherited ? ' checked' : ''}>
                          <label for="entity-${index}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-mode">Needle mode</label>
	                        <select id="entity-${index}-needle-mode" data-kind="entity-needle-mode" data-index="${index}" value="${this._escapeAttribute(entityNeedle.mode)}">
                          <option value="enabled"${entityNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${entityNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-color">Needle color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-needle-color`,
                          kind: 'entity-needle-color',
                          index,
                          value: entityNeedle.color,
                          fallbackHex: '#ffffff',
	                          placeholder: '#ffffff',
	                        })}
	                      </div>
	                          `,
	                        });
	                        const formattingGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'formatting',
	                          title: 'Formatting',
	                          summary: this._getFormattingSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${index}"${formattingInherited ? ' checked' : ''}>
                          <label for="entity-${index}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-unit">Unit</label>
                        <input id="entity-${index}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFormattingValue(scope, 'unit'))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-decimal">Decimals</label>
                        <input id="entity-${index}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedFormattingValue(scope, 'decimal'))}" placeholder="inherit card default">
                      </div>
	                          `,
	                        });
	                        const peakGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'peak',
	                          title: 'Peak',
	                          summary: this._getPeakSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-peak-inherit" type="checkbox" data-kind="entity-peak-inherit" data-index="${index}"${peakInherited ? ' checked' : ''}>
                          <label for="entity-${index}-peak-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-peak-enabled" type="checkbox" data-kind="entity-peak-enabled" data-index="${index}"${entityPeak.mode === 'enabled' ? ' checked' : ''}>
                          <label for="entity-${index}-peak-enabled">Peak enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-peak-color">Peak color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-peak-color`,
                          kind: 'entity-peak-color',
                          index,
                          value: entityPeak.color,
                          fallbackHex: '#888',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                          `,
	                        });
	                        const segmentsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'segments',
	                          title: 'Segments',
	                          summary: this._getSegmentsSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${index}"${segmentsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-segments-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._isSegmentFillStyle(this._getEffectiveFillStyleValue(scope))
                        ? ''
                        : '<div class="section-note">Only used with segment-based fill styles.</div>'
                      }
                      ${this._renderSegmentPreview(scope)}
                      <div class="field-row">
                        <label>Segments</label>
                        <div class="list">
                          ${this._renderListRows(entitySegments, (segment, segmentIndex) => `
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'from', segment?.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'to', segment?.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${index}" data-segment-index="${segmentIndex}" value="${this._escapeAttribute(segment?.color ?? '#4a9eff')}">
                              <button type="button" data-action="remove-entity-segment" data-index="${index}" data-segment-index="${segmentIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                            <div id="entity-${index}-segment-row-hint-${segmentIndex}" class="section-note"${this._getSegmentRowValidationMessage(scope, segmentIndex) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentRowValidationMessage(scope, segmentIndex))}</div>
                            </div>
                          `)}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${index}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).from)}" placeholder="0%">
                              <input id="entity-${index}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${index}" value="${this._escapeAttribute(this._getSegmentDraftState(scope).color || '#4a9eff')}">
                              <button type="button" data-action="add-entity-segment" data-index="${index}"${this._canAddSegment(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            <div id="entity-${index}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(scope) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentDraftValidationMessage(scope))}</div>
                          </div>
                        </div>
                      </div>
	                          `,
	                        });
	                        const gradientStopsGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'gradient-stops',
	                          title: 'Gradient Stops',
	                          summary: this._getGradientStopsSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${index}"${gradientStopsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._getEffectiveFillStyleValue(scope) !== 'gradient'
                        ? '<div class="section-note">Only used with Gradient fill style</div>'
                        : ''
                      }
                      ${this._renderGradientPreview(scope, {
                        previewId: `entity-${index}-gradient-preview`,
                        trackId: `entity-${index}-gradient-preview-track`,
                      })}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(entityGradientStops, (stop, stopIndex) => `
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${index}" data-stop-index="${stopIndex}" value="${this._escapeAttribute(this._getGradientStopPosText(scope, stopIndex, stop?.pos ?? ''))}" placeholder="0">
                              ${this._renderColorInput({
                                id: `entity-${index}-gradient-color-${stopIndex}`,
                                kind: 'entity-gradient-color',
                                index,
                                value: stop?.color ?? '#4a9eff',
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                                extraDataset: { 'stop-index': stopIndex },
                              })}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${index}" data-stop-index="${stopIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                          `)}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${index}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${index}" value="${this._escapeAttribute(entityGradientDraft.pos)}" placeholder="0">
                              ${this._renderColorInput({
                                id: `entity-${index}-gradient-draft-color`,
                                kind: 'entity-gradient-draft-color',
                                index,
                                value: entityGradientDraft.color,
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                              })}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${index}"${this._canAddGradientStop(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            ${entityGradientDraftMessage
                              ? `<div id="entity-${index}-gradient-draft-hint" class="section-note">${this._escapeAttribute(entityGradientDraftMessage)}</div>`
                              : ''
                            }
                          </div>
                        </div>
                      </div>
	                          `,
	                        });
	                        const baselineGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'baseline',
	                          title: 'Baseline',
	                          summary: this._getBaselineOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${index}"${baselineInherited ? ' checked' : ''}>
                          <label for="entity-${index}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-mode">Baseline mode</label>
                        <select id="entity-${index}-baseline-mode" data-kind="entity-baseline-mode" data-index="${index}" value="${this._escapeAttribute(baselineMode)}">
                          <option value="enabled"${baselineMode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${baselineMode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-value">Baseline fallback</label>
                        <input id="entity-${index}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${index}" value="${this._escapeAttribute(baselineParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${this._renderEntitySourceInput('entity-baseline-entity-source', index, baselineParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, 'above') ? ' checked' : ''}>
                          <label for="entity-${index}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-above-color">Above-baseline color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-baseline-above-color`,
                          kind: 'entity-baseline-above-color',
                          index,
                          value: this._getEffectiveBaselineDirectionalColorValue(scope, 'above'),
                          fallbackHex: '#000000',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${index}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, 'below') ? ' checked' : ''}>
                            <label for="entity-${index}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-baseline-below-color">Below-baseline color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-baseline-below-color`,
                          kind: 'entity-baseline-below-color',
                          index,
                          value: this._getEffectiveBaselineDirectionalColorValue(scope, 'below'),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `,
	                        });
	                        const targetGroup = this._renderOverrideGroup({
	                          index,
	                          group: 'target',
	                          title: 'Target',
	                          summary: this._getTargetOverrideSummary(scope),
	                          content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${index}"${targetInherited ? ' checked' : ''}>
                          <label for="entity-${index}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-mode">Target mode</label>
	                        <select id="entity-${index}-target-mode" data-kind="entity-target-mode" data-index="${index}" value="${this._escapeAttribute(targetMode)}">
                          <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-value">Target fallback</label>
                        <input id="entity-${index}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${index}" value="${this._escapeAttribute(targetParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${this._renderEntitySourceInput('entity-target-entity-source', index, targetParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-color">Target color</label>
                        ${this._renderColorInput({
                          id: `entity-${index}-target-color`,
                          kind: 'entity-target-color',
                          index,
                          value: this._getEffectiveTargetColorValue(scope),
                          fallbackHex: '#888',
                          placeholder: 'inherit card default',
                        })}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-target-label-show" type="checkbox" data-kind="entity-target-label-show" data-index="${index}"${this._getEffectiveTargetLabelShowValue(scope) ? ' checked' : ''}>
                          <label for="entity-${index}-target-label-show">Show target label</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${index}"${this._isTargetAboveFillEnabled(scope) ? ' checked' : ''}>
	                          <label for="entity-${index}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-above-fill">Above-target color</label>
	                        ${this._renderColorInput({
                          id: `entity-${index}-target-above-fill`,
                          kind: 'entity-target-above-fill-color',
                          index,
                          value: this._getEffectiveTargetAboveFillColorValue(scope),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `,
	                        });
	                        return `
	                          ${scaleGroup}
	                          ${targetGroup}
	                          ${baselineGroup}
	                          ${needleGroup}
	                          ${peakGroup}
	                          ${barGroup}
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

	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${this._escapeAttribute(scaleMin)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${this._renderEntitySourceInput('scale-min-entity-source', 'card', scaleMinEntity)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${this._escapeAttribute(scaleMax)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${this._renderEntitySourceInput('scale-max-entity-source', 'card', scaleMaxEntity)}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Target, baseline, and peak markers help compare the current value against reference points.</div>
	          </div>
	          <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${this._escapeAttribute(targetMode)}">
                <option value="auto"${targetMode === 'auto' ? ' selected' : ''}>auto</option>
                <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${this._escapeAttribute(target.fixed)}">
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${this._renderEntitySourceInput('target-entity-source', 'card', target.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${this._renderColorInput({
                id: 'target-color',
                field: 'target-color',
                value: targetColor,
                fallbackHex: '#888',
                placeholder: '#888',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="target-label-show" type="checkbox" data-field="target-label-show"${targetLabelShow ? ' checked' : ''}>
                <label for="target-label-show">Show target label</label>
              </div>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="target-above-fill-enabled" type="checkbox" data-field="target-above-fill-enabled"${this._isTargetAboveFillEnabled({ type: 'card' }) ? ' checked' : ''}>
                <label for="target-above-fill-enabled">Above-target color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="target-above-fill-color">Above-target color</label>
              ${this._renderColorInput({
                id: 'target-above-fill-color',
                field: 'target-above-fill-color',
                value: targetAboveFillColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${this._escapeAttribute(baselineMode)}">
                <option value="auto"${baselineMode === 'auto' ? ' selected' : ''}>auto</option>
                <option value="enabled"${baselineMode === 'enabled' ? ' selected' : ''}>enabled</option>
                <option value="disabled"${baselineMode === 'disabled' ? ' selected' : ''}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            <div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${this._escapeAttribute(baseline.fixed)}">
            </div>
            <div class="field-row">
              <label>Baseline entity</label>
              ${this._renderEntitySourceInput('baseline-entity-source', 'card', baseline.entity)}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'above') ? ' checked' : ''}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${this._renderColorInput({
                id: 'baseline-above-color',
                field: 'baseline-above-color',
                value: baselineAboveColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-below-color-enabled" type="checkbox" data-field="baseline-below-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'below') ? ' checked' : ''}>
                <label for="baseline-below-color-enabled">Below-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-below-color">Below-baseline color</label>
              ${this._renderColorInput({
                id: 'baseline-below-color',
                field: 'baseline-below-color',
                value: baselineBelowColor,
                fallbackHex: '#000000',
              })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="peak-show" type="checkbox" data-field="peak-show"${cardPeak.mode === 'enabled' ? ' checked' : ''}>
                <label for="peak-show">Peak enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="peak-color">Peak color</label>
              ${this._renderColorInput({
                id: 'peak-color',
                field: 'peak-color',
                value: cardPeak.color,
                fallbackHex: '#888',
                placeholder: '#888',
              })}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${this._escapeAttribute(fillStyle)}">
                <option value="solid"${fillStyle === 'solid' ? ' selected' : ''}>solid</option>
                <option value="gradient"${fillStyle === 'gradient' ? ' selected' : ''}>gradient</option>
                <option value="bands"${fillStyle === 'bands' ? ' selected' : ''}>bands</option>
                <option value="band_gradient"${fillStyle === 'band_gradient' ? ' selected' : ''}>band_gradient</option>
                <option value="soft_bands"${fillStyle === 'soft_bands' ? ' selected' : ''}>soft_bands</option>
              </select>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="bar-solid-fill" type="checkbox" data-field="bar-solid-fill"${barSolidFill ? ' checked' : ''}>
                <label for="bar-solid-fill">Solid fill</label>
              </div>
            </div>
            <div class="field-row">
              <label for="bar-color">Bar color</label>
              ${this._renderColorInput({
                id: 'bar-color',
                field: 'bar-color',
                value: barColor,
                fallbackHex: '#4a9eff',
                placeholder: '#4a9eff',
              })}
            </div>
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${this._escapeAttribute(cardNeedle.mode)}">
                <option value="disabled"${cardNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                <option value="enabled"${cardNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${this._renderColorInput({
                id: 'bar-needle-color',
                field: 'bar-needle-color',
                value: cardNeedle.color,
                fallbackHex: '#ffffff',
                placeholder: '#ffffff',
              })}
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${this._renderCardGroup({
	            group: 'segments',
	            title: 'Segments',
	            summary: this._getSegmentsSummary({ type: 'card' }),
	            inactive: !this._isSegmentFillStyle(fillStyle),
	            content: `
	              ${this._isSegmentFillStyle(fillStyle)
	                ? ''
	                : '<div class="section-note">Only used with segment-based fill styles.</div>'
	              }
                ${this._renderSegmentPreview({ type: 'card' })}
	              <div class="field-row">
	                <label>Segments</label>
	                <div class="list">
	                  ${defaultSegmentsVisible
	                    ? '<div class="section-note">Default bands</div>'
	                    : ''
	                  }
	                  ${this._renderListRows(segments, (segment, index) => `
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text" data-kind="segment-from" data-index="${index}" value="${this._escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'from', segment?.from))}" placeholder="0%">
	                      <input type="text" data-kind="segment-to" data-index="${index}" value="${this._escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'to', segment?.to))}" placeholder="100%">
	                      <input type="color" data-kind="segment-color" data-index="${index}" value="${this._escapeAttribute(segment?.color ?? '#4a9eff')}">
	                      <button type="button" data-action="remove-segment" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
	                    </div>
                      <div id="segment-row-hint-${index}" class="section-note"${this._getSegmentRowValidationMessage({ type: 'card' }, index) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentRowValidationMessage({ type: 'card' }, index))}</div>
                      </div>
	                  `)}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text" data-kind="segment-draft-from" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text" data-kind="segment-draft-to" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).to)}" placeholder="100%">
                        <input type="color" data-kind="segment-draft-color" value="${this._escapeAttribute(this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff')}">
                        <button type="button" data-action="add-segment"${this._canAddSegment({ type: 'card' }) ? '' : ' disabled'}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({ type: 'card' }) ? '' : ' style="display:none"'}>${this._escapeAttribute(this._getSegmentDraftValidationMessage({ type: 'card' }))}</div>
                    </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${this._renderCardGroup({
	            group: 'gradient-stops',
	            title: 'Gradient Stops',
	            summary: gradientStopsSummary,
	            inactive: gradientStopsInactive,
	            content: `
	              ${gradientStopsInactive
	                ? '<div class="section-note">Only used with Gradient fill style</div>'
	                : ''
	              }
	              ${this._renderGradientPreview({ type: 'card' }, {
	                previewId: 'card-gradient-preview',
	                trackId: 'card-gradient-preview-track',
	              })}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(gradientStops, (stop, index) => `
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${index}" value="${this._escapeAttribute(this._getGradientStopPosText({ type: 'card' }, index, stop?.pos ?? ''))}" placeholder="0">
	                      ${this._renderColorInput({
	                        id: `gradient-color-${index}`,
	                        kind: 'gradient-color',
	                        index,
	                        value: stop?.color ?? '#4a9eff',
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
	                    </div>
	                  `)}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${this._escapeAttribute(gradientDraft.pos)}" placeholder="0">
	                      ${this._renderColorInput({
	                        id: 'gradient-draft-color',
	                        kind: 'gradient-draft-color',
	                        index: 'card',
	                        value: gradientDraft.color,
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({ type: 'card' }) ? '' : ' disabled'}>Add</button>
	                    </div>
	                    ${gradientDraftMessage
	                      ? `<div id="gradient-draft-hint" class="section-note">${this._escapeAttribute(gradientDraftMessage)}</div>`
	                      : ''
	                    }
	                  </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>

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
            ` : ''}
            <div class="field-row">
              <label for="layout-label-width">Label width</label>
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(layoutLabelWidth)}">
            </div>
          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${this._escapeAttribute(formattingUnit)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${this._escapeAttribute(formattingDecimal)}">
            </div>
          </div>
	        </div>
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
        ].forEach((selector) => {
          this.shadowRoot?.querySelectorAll(selector).forEach(syncPicker);
        });
      }).catch(() => {});
    }
  }

  _handleClick(event) {
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

    if (action === 'add-gradient-stop') {
      this._queuePostRenderFocus('#gradient-draft-pos');
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }

    if (action === 'remove-gradient-stop') {
      const index = Number(target.dataset.index);
      this._setGradientStops(this._getGradientStopsValue().filter((_, stopIndex) => stopIndex !== index), { rerender: true });
      return;
    }

    if (action === 'add-entity-gradient-stop') {
      const entityIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`#entity-${entityIndex}-gradient-draft-pos`);
      this._commitGradientStopDraft({ type: 'entity', index: entityIndex });
      return;
    }

    if (action === 'remove-entity-gradient-stop') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const stopIndex = Number(target.dataset.stopIndex);
      this._setScopedGradientStops(scope, this._getScopedGradientStopsValue(scope).filter((_, index) => index !== stopIndex), { rerender: true });
      return;
    }

    if (action === 'add-segment') {
      this._queuePostRenderFocus('#segment-draft-from');
      this._commitSegmentDraft({ type: 'card' });
      return;
    }

    if (action === 'remove-segment') {
      const index = Number(target.dataset.index);
      this._setSegments(this._getSegmentsValue().filter((_, segmentIndex) => segmentIndex !== index), { rerender: true, sort: true });
      return;
    }

    if (action === 'add-entity-segment') {
      const entityIndex = Number(target.dataset.index);
      this._queuePostRenderFocus(`#entity-${entityIndex}-segment-draft-from`);
      this._commitSegmentDraft({ type: 'entity', index: entityIndex });
      return;
    }

    if (action === 'remove-entity-segment') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const segmentIndex = Number(target.dataset.segmentIndex);
      this._setScopedSegments(scope, this._getScopedSegmentsValue(scope).filter((_, index) => index !== segmentIndex), { rerender: true, sort: true });
      return;
    }
  }

  _handleChange(event) {
    const kind = event.target?.dataset?.kind;
    if (kind === 'gradient-pos') {
      const stopIndex = Number(event.target.dataset.index);
      this._commitGradientStopPosEdit({ type: 'card' }, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      const scope = { type: 'entity', index: Number(event.target.dataset.index) };
      const stopIndex = Number(event.target.dataset.stopIndex);
      this._commitGradientStopPosEdit(scope, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      this._commitSegmentBoundaryEdit({ type: 'card' }, Number(event.target.dataset.index), kind === 'segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      this._commitSegmentBoundaryEdit({ type: 'entity', index: Number(event.target.dataset.index) }, Number(event.target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    this._handleFieldEvent(event);
  }

  _handleInput(event) {
    const target = event.target;
    if (!target) return;
    if (target.tagName === 'HA-ENTITY-PICKER') return;
    if (target.tagName === 'INPUT' && target.type === 'checkbox') return;
    const kind = target.dataset?.kind;
    if (kind === 'gradient-pos') {
      this._setGradientStopPosText({ type: 'card' }, Number(target.dataset.index), target.value);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      this._setGradientStopPosText({ type: 'entity', index: Number(target.dataset.index) }, Number(target.dataset.stopIndex), target.value);
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      this._setSegmentBoundaryText({ type: 'card' }, Number(target.dataset.index), kind === 'segment-from' ? 'from' : 'to', target.value);
      this._refreshSegmentUi({ type: 'card' });
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      this._setSegmentBoundaryText(scope, Number(target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', target.value);
      this._refreshSegmentUi(scope);
      return;
    }
    this._handleFieldEvent(event);
  }

  _handleValueChanged(event) {
    if (event.target?.tagName === 'HA-ENTITY-PICKER') {
      this._handleFieldEvent(event);
    }
  }

  _handleKeydown(event) {
    const kind = event.target?.dataset?.kind;
    if (event.key === 'Escape') {
      if (kind === 'gradient-draft-pos' || kind === 'gradient-draft-color') {
        event.preventDefault?.();
        this._gradientStopsDrafts.set(this._getGradientStopsDraftKey({ type: 'card' }), this._createGradientStopDraftState({ type: 'card' }));
        this._render();
        return;
      }
      if (kind === 'entity-gradient-draft-pos' || kind === 'entity-gradient-draft-color') {
        event.preventDefault?.();
        const scope = { type: 'entity', index: Number(event.target.dataset.index) };
        this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), this._createGradientStopDraftState(scope));
        this._render();
      }
      if (kind === 'segment-draft-from' || kind === 'segment-draft-to' || kind === 'segment-draft-color') {
        event.preventDefault?.();
        this._segmentDrafts.set(this._getSegmentsScopeKey({ type: 'card' }), this._createSegmentDraftState({ type: 'card' }));
        this._render();
        return;
      }
      if (kind === 'entity-segment-draft-from' || kind === 'entity-segment-draft-to' || kind === 'entity-segment-draft-color') {
        event.preventDefault?.();
        const scope = { type: 'entity', index: Number(event.target.dataset.index) };
        this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
        this._render();
        return;
      }
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    if (kind === 'gradient-pos') {
      event.preventDefault?.();
      const stopIndex = Number(event.target.dataset.index);
      this._commitGradientStopPosEdit({ type: 'card' }, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'entity-gradient-pos') {
      event.preventDefault?.();
      const scope = { type: 'entity', index: Number(event.target.dataset.index) };
      const stopIndex = Number(event.target.dataset.stopIndex);
      this._commitGradientStopPosEdit(scope, stopIndex, event.target.value, event.target);
      return;
    }
    if (kind === 'gradient-draft-pos') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }
    if (kind === 'gradient-draft-color') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'card' });
      return;
    }
    if (kind === 'entity-gradient-draft-pos') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'entity', index: Number(event.target.dataset.index) });
      return;
    }
    if (kind === 'entity-gradient-draft-color') {
      event.preventDefault?.();
      this._commitGradientStopDraft({ type: 'entity', index: Number(event.target.dataset.index) });
      return;
    }
    if (kind === 'segment-from' || kind === 'segment-to') {
      event.preventDefault?.();
      this._commitSegmentBoundaryEdit({ type: 'card' }, Number(event.target.dataset.index), kind === 'segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'entity-segment-from' || kind === 'entity-segment-to') {
      event.preventDefault?.();
      this._commitSegmentBoundaryEdit({ type: 'entity', index: Number(event.target.dataset.index) }, Number(event.target.dataset.segmentIndex), kind === 'entity-segment-from' ? 'from' : 'to', event.target.value, event.target);
      return;
    }
    if (kind === 'segment-draft-from' || kind === 'segment-draft-to' || kind === 'segment-draft-color') {
      event.preventDefault?.();
      this._commitSegmentDraft({ type: 'card' });
      return;
    }
    if (kind === 'entity-segment-draft-from' || kind === 'entity-segment-draft-to' || kind === 'entity-segment-draft-color') {
      event.preventDefault?.();
      this._commitSegmentDraft({ type: 'entity', index: Number(event.target.dataset.index) });
    }
  }

  _handleFieldEvent(event) {
    const target = event.target;
    const rawField = target?.dataset?.field;
    const rawKind = target?.dataset?.kind;
    const field = rawField?.endsWith('-text-fallback') ? rawField.slice(0, -14) : rawField;
    const kind = rawKind?.endsWith('-text-fallback') ? rawKind.slice(0, -14) : rawKind;
    const detailValue = event.detail?.value;
    const value = detailValue ?? (target?.type === 'checkbox' ? target.checked : target?.value);

    if (field === 'title') return void this._setTitle(value);
    if (field === 'formatting-unit') return void this._setScopedFormattingUnit({ type: 'card' }, value);
    if (field === 'formatting-decimal') return void this._setScopedFormattingDecimal({ type: 'card' }, value);
    if (field === 'layout-label-position') return void this._setLayoutLabelPosition(value);
    if (field === 'layout-label-hero-size') return void this._setLayoutHeroSize(value);
    if (field === 'layout-height') return void this._setLayoutHeight(value);
    if (field === 'layout-label-width') return void this._setScopedLayoutLabelWidth({ type: 'card' }, value);
    if (field === 'scale-min') return void this._setScaleBound('min', value);
    if (field === 'scale-max') return void this._setScaleBound('max', value);
    if (field === 'bar-fill-style') return void this._setBarFillStyle(value);
    if (field === 'bar-color') return void this._setBarColor(value);
    if (field === 'bar-solid-fill') return void this._setScopedBarSolidFill({ type: 'card' }, value);
    if (field === 'bar-needle-mode') return void this._setScopedNeedleMode({ type: 'card' }, value);
    if (field === 'bar-needle-color') return void this._setScopedNeedleColor({ type: 'card' }, value);
    if (field === 'baseline-mode') return void this._setBaselineMode({ type: 'card' }, value);
    if (field === 'baseline-value') {
      return void this._setBaselineResolvablePart({ type: 'card' }, 'fixed', value);
    }
    if (field === 'baseline-above-color') return void this._setBaselineDirectionalColor({ type: 'card' }, 'above', value);
    if (field === 'baseline-below-color') return void this._setBaselineDirectionalColor({ type: 'card' }, 'below', value);
    if (field === 'baseline-above-color-enabled') return void this._setBaselineDirectionalColorEnabled({ type: 'card' }, 'above', value);
    if (field === 'baseline-below-color-enabled') return void this._setBaselineDirectionalColorEnabled({ type: 'card' }, 'below', value);
    if (field === 'target-mode') return void this._setTargetMode({ type: 'card' }, value);
    if (field === 'target-value') {
      return void this._setTargetResolvablePart({ type: 'card' }, 'fixed', value);
    }
    if (field === 'target-color') return void this._setTargetColor({ type: 'card' }, value);
    if (field === 'target-label-show') return void this._setTargetLabelShow({ type: 'card' }, value);
    if (field === 'target-above-fill-enabled') return void this._setTargetAboveFillEnabled({ type: 'card' }, value);
    if (field === 'target-above-fill-color') return void this._setTargetAboveFillColor({ type: 'card' }, value);
    if (field === 'peak-show') return void this._setPeakShow(value);
    if (field === 'peak-color') return void this._setScopedPeakColor({ type: 'card' }, value);

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

    if (kind === 'scale-min-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'card' }, 'min', 'entity', value);
    }

    if (kind === 'scale-max-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'card' }, 'max', 'entity', value);
    }

    if (kind === 'baseline-entity-source') {
      return void this._setBaselineResolvablePart({ type: 'card' }, 'entity', value);
    }

    if (kind === 'target-entity-source') {
      return void this._setTargetResolvablePart({ type: 'card' }, 'entity', value);
    }

    if (kind === 'entity-scale-inherit') {
      if (value) {
        return void this._clearScaleOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-override-min') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'min', 'fixed', value);
    }

    if (kind === 'entity-override-max') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'max', 'fixed', value);
    }

    if (kind === 'entity-override-min-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'min', 'entity', value);
    }

    if (kind === 'entity-override-max-entity-source') {
      return void this._setCanonicalResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'max', 'entity', value);
    }

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

    if (kind === 'entity-layout-label-width') {
      return void this._setScopedLayoutLabelWidth({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-formatting-inherit') {
      if (value) {
        return void this._clearFormattingOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-formatting-unit') {
      return void this._setScopedFormattingUnit({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-formatting-decimal') {
      return void this._setScopedFormattingDecimal({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-peak-inherit') {
      if (value) {
        return void this._clearPeakOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-peak-enabled') {
      return void this._setScopedPeakEnabled({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-peak-color') {
      return void this._setScopedPeakColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-segments-inherit') {
      if (value) {
        return void this._clearSegmentsOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-gradient-stops-inherit') {
      if (value) {
        return void this._clearGradientStopsOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-bar-inherit') {
      if (value) {
        return void this._clearEntityBarAppearance({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-needle-inherit') {
      if (value) {
        return void this._removeScopedNeedle({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-bar-fill-style') {
      return void this._setScopedBarFillStyle({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-bar-color') {
      return void this._setScopedBarColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-bar-solid-fill') {
      return void this._setScopedBarSolidFill({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-needle-mode') {
      return void this._setScopedNeedleMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-needle-color') {
      return void this._setScopedNeedleColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-baseline-mode') {
      return void this._setBaselineMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-baseline-inherit') {
      if (value) {
        return void this._clearBaselineOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-baseline-value') {
      return void this._setBaselineResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'fixed', value);
    }

    if (kind === 'entity-baseline-entity-source') {
      return void this._setBaselineResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'entity', value);
    }

    if (kind === 'entity-baseline-above-color') {
      return void this._setBaselineDirectionalColor({ type: 'entity', index: Number(target.dataset.index) }, 'above', value);
    }

    if (kind === 'entity-baseline-below-color') {
      return void this._setBaselineDirectionalColor({ type: 'entity', index: Number(target.dataset.index) }, 'below', value);
    }

    if (kind === 'entity-baseline-above-color-enabled') {
      return void this._setBaselineDirectionalColorEnabled({ type: 'entity', index: Number(target.dataset.index) }, 'above', value);
    }

    if (kind === 'entity-baseline-below-color-enabled') {
      return void this._setBaselineDirectionalColorEnabled({ type: 'entity', index: Number(target.dataset.index) }, 'below', value);
    }

    if (kind === 'entity-target-mode') {
      return void this._setTargetMode({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-inherit') {
      if (value) {
        return void this._clearTargetOverride({ type: 'entity', index: Number(target.dataset.index) });
      }
      return;
    }

    if (kind === 'entity-target-value') {
      return void this._setTargetResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'fixed', value);
    }

    if (kind === 'entity-target-entity-source') {
      return void this._setTargetResolvablePart({ type: 'entity', index: Number(target.dataset.index) }, 'entity', value);
    }

    if (kind === 'entity-target-color') {
      return void this._setTargetColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-label-show') {
      return void this._setTargetLabelShow({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-above-fill-enabled') {
      return void this._setTargetAboveFillEnabled({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'entity-target-above-fill-color') {
      return void this._setTargetAboveFillColor({ type: 'entity', index: Number(target.dataset.index) }, value);
    }

    if (kind === 'gradient-draft-pos') {
      this._setGradientStopsDraftField({ type: 'card' }, 'pos', value);
      return;
    }

    if (kind === 'gradient-draft-color') {
      this._setGradientStopsDraftField({ type: 'card' }, 'color', value);
      return;
    }

    if (kind === 'entity-gradient-draft-pos') {
      this._setGradientStopsDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'pos', value);
      return;
    }

    if (kind === 'entity-gradient-draft-color') {
      this._setGradientStopsDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'color', value);
      return;
    }

    if (kind === 'segment-draft-from') {
      this._setSegmentDraftField({ type: 'card' }, 'from', value);
      return;
    }

    if (kind === 'segment-draft-to') {
      this._setSegmentDraftField({ type: 'card' }, 'to', value);
      return;
    }

    if (kind === 'segment-draft-color') {
      this._setSegmentDraftField({ type: 'card' }, 'color', value);
      return;
    }

    if (kind === 'entity-segment-draft-from') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'from', value);
      return;
    }

    if (kind === 'entity-segment-draft-to') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'to', value);
      return;
    }

    if (kind === 'entity-segment-draft-color') {
      this._setSegmentDraftField({ type: 'entity', index: Number(target.dataset.index) }, 'color', value);
      return;
    }

    if (kind?.startsWith('gradient-')) {
      const index = Number(target.dataset.index);
      const currentStops = this._sanitizeGradientStopsForEmit(this._getGradientStopsValue());
      const nextStops = this._getGradientStopsValue().map((stop, stopIndex) => {
        if (stopIndex !== index) return stop;
        const nextPos = this._normalizeGradientStopPosValue(stop?.pos);
        return {
          ...stop,
          pos: nextPos ?? 0,
          color: kind === 'gradient-color' ? value : stop?.color ?? '#4a9eff',
        };
      });
      if (this._serializeConfig(nextStops) !== this._serializeConfig(currentStops)) {
        this._setGradientStops(nextStops);
      }
      return;
    }

    if (kind?.startsWith('entity-gradient-')) {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const stopIndex = Number(target.dataset.stopIndex);
      const currentStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
      const nextStops = this._getScopedGradientStopsValue(scope).map((stop, currentStopIndex) => {
        if (currentStopIndex !== stopIndex) return stop;
        const nextPos = this._normalizeGradientStopPosValue(stop?.pos);
        return {
          ...stop,
          pos: nextPos ?? 0,
          color: kind === 'entity-gradient-color' ? value : stop?.color ?? '#4a9eff',
        };
      });
      if (this._serializeConfig(nextStops) !== this._serializeConfig(currentStops)) {
        this._setScopedGradientStops(scope, nextStops);
      }
      return;
    }

    if (kind === 'segment-color') {
      const index = Number(target.dataset.index);
      const nextSegments = (this._getSegmentsUiRows({ type: 'card' }) ?? this._getSegmentsValue()).map((segment, segmentIndex) => {
        if (segmentIndex !== index) return segment;
        return {
          ...segment,
          color: value,
        };
      });
      this._setSegments(nextSegments, { sort: false });
      return;
    }

    if (kind === 'entity-segment-color') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      const segmentIndex = Number(target.dataset.segmentIndex);
      const nextSegments = (this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope)).map((segment, currentSegmentIndex) => {
        if (currentSegmentIndex !== segmentIndex) return segment;
        return {
          ...segment,
          color: value,
        };
      });
      this._setScopedSegments(scope, nextSegments, { sort: false });
      return;
    }
  }
}
