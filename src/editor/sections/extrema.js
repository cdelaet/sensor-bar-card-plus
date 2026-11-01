import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue,
  pruneEmptyObjectsInTarget, normalizeTextValue, normalizeNumberValue } from '../shared/editor-config.js';
import { escapeAttribute, normalizeEditorColorValue, normalizeColorComparisonValue, renderColorInput, renderWindowOptions, renderBuiltinMarkerLabelControls } from '../shared/editor-controls.js';
import { getBuiltinMarkerLabelOptions, setBuiltinMarkerLabelField, getEffectiveMarkerDirection, setMarkerDirection } from '../shared/editor-marker-controls.js';
import { isValidReset } from '../../utils/extrema.js';
import { canonicalizeHistoricalWindow, parseHistoricalWindow, isEligibleHistoricalWindow } from '../../history/time-window.js';

export function migrateExtremaConfig(config) {
  let changed = false;
  const migrateScope = (scope) => {
    if (!isObject(scope)) return scope;
    let next = scope;
    for (const key of ['peak', 'floor']) {
      const marker = scope[key];
      if (!isObject(marker)) continue;
      const hasReset = Object.prototype.hasOwnProperty.call(marker, 'reset');
      const hasWindow = Object.prototype.hasOwnProperty.call(marker, 'window');
      const canonicalWindow = hasWindow ? canonicalizeHistoricalWindow(marker.window) : undefined;
      const windowChanged = hasWindow && !Object.is(canonicalWindow, marker.window);
      if (!hasReset && !windowChanged) continue;
      if (next === scope) next = { ...scope };
      const { reset, ...rest } = marker;
      if (hasWindow) {
        if (windowChanged) rest.window = canonicalWindow;
      } else {
        const normalized = typeof reset === 'string' ? reset.trim().toLowerCase() : reset;
        rest.window = isValidReset(reset)
          ? normalized === 'never' ? 'today' : canonicalizeHistoricalWindow(normalized)
          : parseHistoricalWindow(normalized) ? `invalid legacy reset: ${normalized}` : reset ?? null;
      }
      next[key] = rest;
      changed = true;
    }
    return next;
  };
  let next = migrateScope(config);
  if (Array.isArray(config?.entities)) {
    const entities = config.entities.map(migrateScope);
    if (entities.some((entry, index) => entry !== config.entities[index])) next = { ...next, entities };
  }
  return changed ? next : null;
}

// Configuration controls only. No runtime extrema/history state lives here.
export class ExtremaSection {
  constructor(context, options = {}) { this.options = options; this.context = context; }

  _getScopedPeakConfig(scope) {
    const rawPeak = this.context.read(scope, ['peak']);
    const rawLegacyShow = this.context.read(scope, ['show_peak']);
    const rawLegacyColor = this.context.read(scope, ['peak_color']);
    const defaultColor = '#888';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (isObject(rawPeak)) {
      if (rawPeak.enabled === true) {
        mode = 'enabled';
      } else if (rawPeak.enabled === false) {
        mode = 'disabled';
      }
      color = rawPeak.color ?? color;
    }

    if (rawLegacyShow === true) {
      mode = 'enabled';
    } else if (rawLegacyShow === false) {
      mode = 'disabled';
    }

    color = color || rawLegacyColor || '';
    if (color && normalizeColorComparisonValue(color) === normalizeColorComparisonValue(defaultColor)) {
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
    const peakValue = this.context.read(scope, ['peak']) ?? {};
    if (isObject(peakValue) && (
      Object.prototype.hasOwnProperty.call(peakValue, 'enabled')
      || Object.prototype.hasOwnProperty.call(peakValue, 'color')
      || Object.prototype.hasOwnProperty.call(peakValue, 'window')
      || Object.prototype.hasOwnProperty.call(peakValue, 'label')
      || Object.prototype.hasOwnProperty.call(peakValue, 'direction')
    )) {
      return true;
    }

    return this.context.read(scope, ['show_peak']) !== undefined
      || this.context.read(scope, ['peak_color']) !== undefined;
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
    return this.context.mutate(scope, (target) => {
      let nextTarget = deletePathValue(target, ['peak', 'enabled']);
      nextTarget = deletePathValue(nextTarget, ['peak', 'color']);
      nextTarget = deletePathValue(nextTarget, ['peak', 'window']);
      nextTarget = deletePathValue(nextTarget, ['peak', 'label']);
      nextTarget = deletePathValue(nextTarget, ['peak', 'direction']);
      nextTarget = deletePathValue(nextTarget, ['show_peak']);
      nextTarget = deletePathValue(nextTarget, ['peak_color']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    }, { rerender: true });
  }

  _setScopedPeakEnabled(scope, value) {
    const boolValue = !!value;
    const defaultColor = '#888';
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const currentPeak = isObject(getPathValue(nextTarget, ['peak']))
        ? cloneDeep(getPathValue(nextTarget, ['peak']))
        : {};
      const currentColor = currentPeak.color
        ?? getPathValue(nextTarget, ['peak_color'])
        ?? defaultColor;

      if (scope?.type === 'entity' || boolValue) {
        currentPeak.enabled = boolValue;
        if (boolValue && currentPeak.window === undefined) currentPeak.window = this._getEffectiveMarkerExtras(scope, 'peak').window;
      } else {
        delete currentPeak.enabled;
      }

      if (currentColor && normalizeColorComparisonValue(currentColor) !== normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = currentColor;
      } else {
        delete currentPeak.color;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = deletePathValue(nextTarget, ['show_peak']);
      nextTarget = deletePathValue(nextTarget, ['peak_color']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    }, { extremumEdit: { key: 'peak', path: ['enabled'], value: boolValue } });
  }

  _setScopedPeakColor(scope, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
    const defaultColor = '#888';
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const currentPeak = isObject(getPathValue(nextTarget, ['peak']))
        ? cloneDeep(getPathValue(nextTarget, ['peak']))
        : {};
      const currentConfig = this._getScopedPeakConfig(scope);

      delete currentPeak.color;
      if (normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor)) {
        currentPeak.color = normalizedValue;
      }

      if (scope?.type === 'entity') {
        if (currentConfig.mode === 'enabled') currentPeak.enabled = true;
        if (currentConfig.mode === 'disabled') currentPeak.enabled = false;
      } else if (currentConfig.mode === 'enabled') {
        currentPeak.enabled = true;
      }

      if (Object.keys(currentPeak).length) {
        nextTarget = setPathValue(nextTarget, ['peak'], currentPeak);
      } else {
        nextTarget = deletePathValue(nextTarget, ['peak']);
      }

      nextTarget = deletePathValue(nextTarget, ['show_peak']);
      nextTarget = deletePathValue(nextTarget, ['peak_color']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['peak']);
      return nextTarget;
    }, { extremumEdit: { key: 'peak', path: ['color'], value: normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor) ? normalizedValue : undefined } });
  }

  _getScopedMarkerExtras(scope, key) {
    const raw = this.context.read(scope, [key]);
    const marker = isObject(raw) ? raw : {};
    const label = isObject(marker.label) ? marker.label : {};
    return {
      window: Object.prototype.hasOwnProperty.call(marker, 'window')
        ? (marker.window == null ? String(marker.window) : normalizeTextValue(marker.window).trim().toLowerCase() || '(empty)')
        : null,
      labelShow: typeof label.show === 'boolean' ? label.show : null,
      labelText: typeof label.text === 'string' ? label.text.replace(/\s+/g, ' ').trim() : null,
      labelShowValue: typeof label.show_value === 'boolean' ? label.show_value : null,
      labelShowUnit: typeof label.show_unit === 'boolean' ? label.show_unit : null,
      labelPrecision: (label.precision ?? label.decimal) === undefined || (label.precision ?? label.decimal) === null || (label.precision ?? label.decimal) === ''
        ? null
        : normalizeNumberValue(label.precision ?? label.decimal),
    };
  }

  _hasExtremumOverride(scope, key) {
    const marker = this.context.read(scope, [key]);
    if (!isObject(marker)) return false;
    return ['enabled', 'color', 'window', 'label', 'direction'].some((field) => (
      Object.prototype.hasOwnProperty.call(marker, field)
    ));
  }

  _getEffectiveMarkerExtras(scope, key) {
    const local = this._getScopedMarkerExtras(scope, key);
    if (scope?.type !== 'entity') {
      return {
        window: local.window ?? 'today',
        labelShow: local.labelShow ?? false,
        labelText: local.labelText,
        labelShowValue: local.labelShowValue ?? true,
        labelShowUnit: local.labelShowUnit ?? true,
        labelPrecision: local.labelPrecision,
      };
    }
    const card = this._getScopedMarkerExtras({ type: 'card' }, key);
    if (!this._hasExtremumOverride(scope, key)) {
      return {
        window: card.window ?? 'today',
        labelShow: card.labelShow ?? false,
        labelText: card.labelText,
        labelShowValue: card.labelShowValue ?? true,
        labelShowUnit: card.labelShowUnit ?? true,
        labelPrecision: card.labelPrecision,
      };
    }
    return {
      window: local.window ?? card.window ?? 'today',
      labelShow: local.labelShow ?? card.labelShow ?? false,
      labelText: Object.prototype.hasOwnProperty.call(this.context.read(scope, [key, 'label']) ?? {}, 'text') ? local.labelText : card.labelText,
      labelShowValue: local.labelShowValue ?? card.labelShowValue ?? true,
      labelShowUnit: local.labelShowUnit ?? card.labelShowUnit ?? true,
      labelPrecision: local.labelPrecision ?? card.labelPrecision,
    };
  }

  _getScopedFloorConfig(scope) {
    const raw = this.context.read(scope, ['floor']);
    const marker = isObject(raw) ? raw : {};
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    if (marker.enabled === true) mode = 'enabled';
    if (marker.enabled === false) mode = 'disabled';
    const color = marker.color && normalizeColorComparisonValue(marker.color) !== normalizeColorComparisonValue('#888888')
      ? marker.color
      : '';
    return { mode, color };
  }

  _getEffectiveScopedFloorConfig(scope) {
    const local = this._getScopedFloorConfig(scope);
    const extras = this._getEffectiveMarkerExtras(scope, 'floor');
    if (scope?.type !== 'entity') return { ...local, ...extras };
    if (!this._hasExtremumOverride(scope, 'floor')) {
      return { ...this._getScopedFloorConfig({ type: 'card' }), ...extras };
    }
    const card = this._getEffectiveScopedFloorConfig({ type: 'card' });
    return {
      mode: local.mode === 'inherit' ? card.mode : local.mode,
      color: local.color || card.color,
      ...extras,
    };
  }

  _getFloorSummary(scope) {
    if (scope?.type === 'entity' && !this._hasExtremumOverride(scope, 'floor')) return 'Inherited';
    const floor = this._getEffectiveScopedFloorConfig(scope);
    if (floor.mode === 'enabled') return floor.color ? 'Enabled • Custom color' : 'Enabled';
    if (floor.color) return 'Disabled • Custom color';
    return 'Disabled';
  }

  _getMarkerResetSummary(key) {
    const scope = { type: 'card' };
    const marker = key === 'peak'
      ? this._getScopedPeakConfig(scope)
      : this._getEffectiveScopedFloorConfig(scope);
    const enabled = marker.mode === 'enabled';
    const window = this._getEffectiveMarkerExtras(scope, key).window;
    return `${enabled ? 'Enabled' : 'Disabled'} · ${window}`;
  }

  _setScopedExtremumEnabled(scope, key, value) {
    const boolValue = !!value;
    const defaultColor = '#888888';
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = isObject(getPathValue(nextTarget, [key]))
        ? cloneDeep(getPathValue(nextTarget, [key]))
        : {};
      const currentColor = current.color ?? defaultColor;
      if (scope?.type === 'entity' || boolValue) current.enabled = boolValue;
      else delete current.enabled;
      if (boolValue && current.window === undefined) current.window = this._getEffectiveMarkerExtras(scope, key).window;
      if (currentColor && normalizeColorComparisonValue(currentColor) !== normalizeColorComparisonValue(defaultColor)) {
        current.color = currentColor;
      } else delete current.color;
      if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
      else nextTarget = deletePathValue(nextTarget, [key]);
      return nextTarget;
    }, { extremumEdit: { key, path: ['enabled'], value: boolValue } });
  }

  _setScopedExtremumColor(scope, key, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
    const defaultColor = '#888888';
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = isObject(getPathValue(nextTarget, [key]))
        ? cloneDeep(getPathValue(nextTarget, [key]))
        : {};
      delete current.color;
      if (normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor)) {
        current.color = normalizedValue;
      }
      const mode = this._getScopedFloorConfig(scope).mode;
      if (key === 'floor' && ((scope?.type === 'entity' && mode !== 'inherit') || (scope?.type !== 'entity' && mode === 'enabled'))) {
        current.enabled = mode === 'enabled';
      }
      if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
      else nextTarget = deletePathValue(nextTarget, [key]);
      if (key === 'peak') {
        nextTarget = deletePathValue(nextTarget, ['show_peak']);
        nextTarget = deletePathValue(nextTarget, ['peak_color']);
      }
      return nextTarget;
    }, { extremumEdit: { key, path: ['color'], value: normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor) ? normalizedValue : undefined } });
  }

  _setScopedExtremumWindow(scope, key, value) {
    const normalized = canonicalizeHistoricalWindow(normalizeTextValue(value).trim().toLowerCase());
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = isObject(getPathValue(nextTarget, [key]))
        ? cloneDeep(getPathValue(nextTarget, [key]))
        : {};
      if (!isEligibleHistoricalWindow(normalized)) return target;
      current.window = normalized;
      if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
      else nextTarget = deletePathValue(nextTarget, [key]);
      if (key === 'peak') {
        nextTarget = deletePathValue(nextTarget, ['show_peak']);
        nextTarget = deletePathValue(nextTarget, ['peak_color']);
      }
      return nextTarget;
    }, { extremumEdit: { key, path: ['window'], value: normalized } });
  }

  _setScopedExtremumLabelShow(scope, key, value) {
    const enabled = !!value;
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = isObject(getPathValue(nextTarget, [key]))
        ? cloneDeep(getPathValue(nextTarget, [key]))
        : {};
      const label = isObject(current.label) ? cloneDeep(current.label) : {};
      if (scope?.type === 'entity' || enabled) label.show = enabled;
      else delete label.show;
      if (Object.keys(label).length) current.label = label;
      else delete current.label;
      if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
      else nextTarget = deletePathValue(nextTarget, [key]);
      if (key === 'peak') {
        nextTarget = deletePathValue(nextTarget, ['show_peak']);
        nextTarget = deletePathValue(nextTarget, ['peak_color']);
      }
      return nextTarget;
    }, { extremumEdit: { key, path: ['label', 'show'], value: enabled } });
  }

  _setScopedExtremumLabelDecimal(scope, key, value) {
    const decimal = normalizeNumberValue(value);
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = isObject(getPathValue(nextTarget, [key]))
        ? cloneDeep(getPathValue(nextTarget, [key]))
        : {};
      const label = isObject(current.label) ? cloneDeep(current.label) : {};
      if (decimal !== null) label.decimal = decimal;
      else delete label.decimal;
      if (Object.keys(label).length) current.label = label;
      else delete current.label;
      if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
      else nextTarget = deletePathValue(nextTarget, [key]);
      return nextTarget;
    }, { extremumEdit: { key, path: ['label', 'decimal'], value: decimal } });
  }

  _clearFloorOverride(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const floor = isObject(getPathValue(nextTarget, ['floor']))
        ? cloneDeep(getPathValue(nextTarget, ['floor']))
        : {};
      ['enabled', 'color', 'window', 'label', 'direction'].forEach((key) => delete floor[key]);
      if (Object.keys(floor).length) nextTarget = setPathValue(nextTarget, ['floor'], floor);
      else nextTarget = deletePathValue(nextTarget, ['floor']);
      return nextTarget;
    }, { rerender: true });
  }

  _setPeakShow(value) {
    return this._setScopedPeakEnabled({ type: 'card' }, value);
  }

  _getPeakShowValue() {
    return this._getScopedPeakConfig({ type: 'card' }).mode === 'enabled';
  }

  _getMarkerConfig(scope, key) {
    return key === 'peak' ? this._getEffectiveScopedPeakConfig(scope) : this._getEffectiveScopedFloorConfig(scope);
  }
  _getBuiltinMarkerLabelOptions(scope, key) {
    return getBuiltinMarkerLabelOptions(this.context, scope, key, this._getEffectiveMarkerExtras(scope, key).labelShow);
  }
  _renderBuiltinMarkerLabelControls(scope, key, title) {
    return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key));
  }
  _getEffectiveMarkerDirection(scope, key) { return getEffectiveMarkerDirection(this.context, scope, key); }

  render(scope = { type: 'card' }, key = 'peak') {
    const title = key === 'peak' ? 'Peak' : 'Floor';
    const defaultColor = key === 'peak' ? '#888' : '#888888';
    const marker = { ...this._getMarkerConfig(scope, key), ...this._getEffectiveMarkerExtras(scope, key) };
    if (scope?.type === 'entity') {
      const index = scope.index;
      const inherited = !(key === 'peak' ? this._hasPeakOverride(scope) : this._hasExtremumOverride(scope, key));
      const indent = key === 'peak' ? '\t' : '';
      return `
${indent}                      <div class="field-row">
${indent}                        <div class="toggle">
${indent}                          <input id="entity-${index}-${key}-inherit" type="checkbox" data-kind="entity-${key}-inherit" data-index="${index}"${inherited ? ' checked' : ''}>
                          <label for="entity-${index}-${key}-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-${key}-enabled" type="checkbox" data-kind="entity-${key}-enabled" data-index="${index}"${marker.mode === 'enabled' ? ' checked' : ''}>
                          <label for="entity-${index}-${key}-enabled">${title} enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-color">${title} color</label>
                        ${renderColorInput({ cssText: this.options.cssText, label: 'Marker color',
                          id: `entity-${index}-${key}-color`,
                          kind: `entity-${key}-color`,
                          index,
                          value: marker.color,
                          fallbackHex: defaultColor,
                          placeholder: 'inherit card default',
                        })}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-window">${title} time window</label>
                        <select id="entity-${index}-${key}-window" data-kind="entity-${key}-window" data-index="${index}" value="${escapeAttribute(marker.window)}">
                          ${renderWindowOptions(marker.window)}
                        </select>
                        <small class="section-note">Recent rolling windows include completed minutes and the current minute; longer windows include completed hours and the current hour. Older history requires Home Assistant statistics.</small>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-direction">Direction</label>
                        <select id="entity-${index}-${key}-direction" data-kind="entity-${key}-direction" data-index="${index}" value="${this._getEffectiveMarkerDirection(scope, key)}">
                          <option value="inward"${this._getEffectiveMarkerDirection(scope, key) === 'inward' ? ' selected' : ''}>Inward</option>
                          <option value="outward"${this._getEffectiveMarkerDirection(scope, key) === 'outward' ? ' selected' : ''}>Outward</option>
                        </select>
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(scope, key, title)}
${indent}                          `;
    }
    return `
            <div class="field-grid">
            <div class="field-row">
              <div class="toggle">
                <input id="${key}-show" type="checkbox" data-field="${key}-show"${marker.mode === 'enabled' ? ' checked' : ''}>
                <label for="${key}-show">${title} enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="${key}-color">${title} color</label>
              ${renderColorInput({ cssText: this.options.cssText, label: 'Marker color',
                id: `${key}-color`,
                field: `${key}-color`,
                value: marker.color,
                fallbackHex: defaultColor,
                placeholder: defaultColor,
              })}
            </div>
            <div class="field-row">
              <label for="${key}-window">${title} time window</label>
              <select id="${key}-window" data-field="${key}-window" value="${escapeAttribute(marker.window)}">
                ${renderWindowOptions(marker.window)}
              </select>
              <small class="section-note">Recent rolling windows include completed minutes and the current minute; longer windows include completed hours and the current hour. Older history requires Home Assistant statistics.</small>
            </div>
            <div class="field-row">
              <label for="${key}-direction">Direction</label>
              <select id="${key}-direction" data-field="${key}-direction" value="${this._getEffectiveMarkerDirection({ type: 'card' }, key)}">
                <option value="inward"${this._getEffectiveMarkerDirection({ type: 'card' }, key) === 'inward' ? ' selected' : ''}>Inward</option>
                <option value="outward"${this._getEffectiveMarkerDirection({ type: 'card' }, key) === 'outward' ? ' selected' : ''}>Outward</option>
              </select>
            </div>
            ${this._renderBuiltinMarkerLabelControls({ type: 'card' }, key, title)}
            </div>`;
  }

  handleField({ field, kind, index, value }) {
    const scope = kind?.startsWith('entity-') ? { type: 'entity', index: Number(index) } : { type: 'card' };
    const control = field ?? kind?.replace(/^entity-/, '');
    const match = control?.match(/^(peak|floor)-(.*)$/);
    if (!match) return false;
    const [, key, option] = match;
    if (option === 'inherit') { if (value) key === 'peak' ? this._clearPeakOverride(scope) : this._clearFloorOverride(scope); return true; }
    if (option === 'show' || option === 'enabled') {
      key === 'peak' ? this._setScopedPeakEnabled(scope, value) : this._setScopedExtremumEnabled(scope, key, value); return true;
    }
    if (option === 'color') { key === 'peak' ? this._setScopedPeakColor(scope, value) : this._setScopedExtremumColor(scope, key, value); return true; }
    if (option === 'window') { this._setScopedExtremumWindow(scope, key, value); return true; }
    if (option === 'direction') { setMarkerDirection(this.context, scope, key, value); return true; }
    const label = option.match(/^label-(show|text|show-value|show-unit|precision)$/);
    if (label) {
      const name = label[1];
      setBuiltinMarkerLabelField(this.context, scope, key, name === 'show-value' ? 'showValue' : name === 'show-unit' ? 'showUnit' : name, value);
      return true;
    }
    return false;
  }
}
