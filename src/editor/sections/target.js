import { normalizeTargetMarkerShape } from '../../config/normalize.js';
import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue, removePathsFromTarget,
  pruneEmptyObjectsInTarget, normalizeTextValue, normalizeDecimalValue, hasResolvableOverride, getEffectiveDisplayValue } from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue, renderColorInput, renderEntitySourceInput, renderBuiltinMarkerLabelControls } from '../shared/editor-controls.js';
import { getBuiltinMarkerLabelOptions, setBuiltinMarkerLabelField, getEffectiveMarkerDirection, setMarkerDirection } from '../shared/editor-marker-controls.js';

export class TargetSection {
  constructor(context) { this.context = context; this.reset(); }
  reset() { this._targetAboveFillDrafts = new Map(); }

  _getCardTargetMarkerSummary() {
    const mode = this._getTargetMode({ type: 'card' });
    if (mode === 'disabled') return 'Disabled';
    const target = this._getTargetResolvableValue({ type: 'card' });
    const parts = [];
    if (mode === 'enabled') parts.push('Enabled');
    const hasTargetValue = (target.fixed !== '' && target.fixed !== undefined) || !!target.entity;
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(String(target.fixed));
    if (target.entity) parts.push(target.entity);
    if (hasTargetValue || this._hasTargetShape({ type: 'card' })) {
      parts.push(this._getEffectiveTargetShapeValue({ type: 'card' }) === 'triangle' ? 'Triangle' : 'Diamond');
    }
    return parts.length ? parts.join(' · ') : 'Automatic';
  }

  _getTargetResolvableValue(scope) { return this.context.source(scope, 'target'); }

  _getEffectiveTargetResolvableValue(scope) { return this.context.source(scope, 'target', true); }

  _getTargetMode(scope) {
    const enabled = this.context.read(scope, ['target', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasTargetOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getTargetShapeValue(scope) {
    return this.context.read(scope, ['target', 'shape']) ?? '';
  }

  _hasTargetShape(scope) {
    const target = this.context.read(scope, ['target']);
    return isObject(target) && Object.prototype.hasOwnProperty.call(target, 'shape');
  }

  _getEffectiveTargetShapeValue(scope) {
    if (scope?.type === 'entity' && !this._hasTargetShape(scope)) {
      return this._getEffectiveTargetShapeValue({ type: 'card' });
    }
    return normalizeTargetMarkerShape(this._getTargetShapeValue(scope));
  }

  _setTargetShape(scope, rawValue) {
    const normalizedShape = normalizeTargetMarkerShape(rawValue);
    if (scope?.type !== 'entity' && normalizedShape === 'diamond') {
      return this._remove(scope, ['target', 'shape'], {
        prunePaths: [['target']],
      });
    }
    return this._setText(scope, ['target', 'shape'], normalizedShape, {
      prunePaths: [['target']],
    });
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
    return hasResolvableOverride(cardTarget)
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
      return this._remove(scope, ['target', 'enabled'], {
        prunePaths: [['target']],
      });
    }
    return this._write(scope, ['target', 'enabled'], mode === 'enabled', {
      prunePaths: [['target']],
    });
  }

  _setTargetResolvablePart(scope, part, rawValue) { return this.context.setSource(scope, 'target', part, rawValue); }

  _clearTargetOverride(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const rawTarget = getPathValue(nextTarget, ['target']);
      if (isObject(rawTarget)) {
        nextTarget = deletePathValue(nextTarget, ['target', 'enabled']);
        nextTarget = deletePathValue(nextTarget, ['target', 'at']);
        nextTarget = deletePathValue(nextTarget, ['target', 'color']);
        nextTarget = deletePathValue(nextTarget, ['target', 'shape']);
        nextTarget = deletePathValue(nextTarget, ['target', 'direction']);
        nextTarget = deletePathValue(nextTarget, ['target', 'label', 'show']);
        nextTarget = deletePathValue(nextTarget, ['target', 'label', 'decimal']);
        nextTarget = deletePathValue(nextTarget, ['target', 'when_exceeded', 'fill_color']);
      } else {
        nextTarget = deletePathValue(nextTarget, ['target']);
      }
      nextTarget = deletePathValue(nextTarget, ['target_entity']);
      nextTarget = deletePathValue(nextTarget, ['target_color']);
      nextTarget = deletePathValue(nextTarget, ['show_target_label']);
      nextTarget = deletePathValue(nextTarget, ['above_target_color']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target', 'label']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target', 'when_exceeded']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target']);
      return nextTarget;
    }, { rerender: true });
  }

  _getTargetColorValue(scope) {
    return this.context.read(scope, ['target', 'color'])
      ?? this.context.read(scope, ['target_color'])
      ?? '';
  }

  _getEffectiveTargetColorValue(scope) {
    return this._effectiveDisplay(scope, ['target', 'color'], [['target_color']]);
  }

  _hasCustomTargetColor(scope) {
    const color = this._getTargetColorValue(scope);
    return !!color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue('#888');
  }

  _setTargetColor(scope, rawValue) {
    const normalizedValue = normalizeTextValue(rawValue).trim();
    if (!normalizedValue || normalizeColorComparisonValue(normalizedValue) === normalizeColorComparisonValue('#888')) {
      return this._remove(scope, ['target', 'color'], {
        deprecatedKeys: [['target_color']],
        prunePaths: [['target']],
      });
    }
    return this._setText(scope, ['target', 'color'], normalizedValue, {
      deprecatedKeys: [['target_color']],
      prunePaths: [['target']],
    });
  }

  _getTargetLabelShowValue(scope) {
    const structuredValue = this.context.read(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    return !!this.context.read(scope, ['show_target_label']);
  }

  _getEffectiveTargetLabelShowValue(scope) {
    const structuredValue = this.context.read(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    const legacyValue = this.context.read(scope, ['show_target_label']);
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
      return this._remove(scope, ['target', 'label', 'show'], {
        deprecatedKeys: [['show_target_label']],
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    return this._write(scope, ['target', 'label', 'show'], true, {
      deprecatedKeys: [['show_target_label']],
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _getTargetLabelDecimalValue(scope) {
    return this.context.read(scope, ['target', 'label', 'precision'])
      ?? this.context.read(scope, ['target', 'label', 'decimal']) ?? '';
  }

  _getEffectiveTargetLabelDecimalValue(scope) {
    const local = this._getTargetLabelDecimalValue(scope);
    return local !== '' && local !== null && local !== undefined
      ? local : (scope?.type === 'entity' ? this._getTargetLabelDecimalValue({ type: 'card' }) : '');
  }

  _setTargetLabelDecimal(scope, rawValue) {
    const normalizedValue = normalizeDecimalValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._remove(scope, ['target', 'label', 'decimal'], {
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._write(scope, ['target', 'label', 'decimal'], normalizedValue, {
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _getTargetAboveFillColorValue(scope) {
    return this.context.read(scope, ['target', 'when_exceeded', 'fill_color'])
      ?? this.context.read(scope, ['above_target_color'])
      ?? '';
  }

  _getTargetAboveFillDraftKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _setTargetAboveFillDraft(scope, rawValue) {
    const normalizedValue = normalizeTextValue(rawValue).trim();
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

  _getEffectiveTargetAboveFillColorValue(scope) {
    return this._effectiveDisplay(scope, ['target', 'when_exceeded', 'fill_color'], [['above_target_color']]);
  }

  _setTargetAboveFillColor(scope, rawValue) {
    const normalizedValue = normalizeTextValue(rawValue).trim();
    this._setTargetAboveFillDraft(scope, normalizedValue);
    if (!this._isTargetAboveFillEnabled(scope)) {
      return false;
    }
    if (!normalizedValue) {
      return this._remove(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    return this._setText(scope, ['target', 'when_exceeded', 'fill_color'], normalizedValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _isTargetAboveFillEnabled(scope) {
    return !!normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
  }

  _setTargetAboveFillEnabled(scope, value) {
    const currentValue = normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
    if (!value) {
      if (currentValue) {
        this._setTargetAboveFillDraft(scope, currentValue);
      }
      return this._remove(scope, ['target', 'when_exceeded', 'fill_color'], {
        deprecatedKeys: [['above_target_color']],
        prunePaths: [['target', 'when_exceeded'], ['target']],
      });
    }
    const nextValue = this._getTargetAboveFillDraft(scope)
      || normalizeTextValue(this._getEffectiveTargetAboveFillColorValue(scope)).trim()
      || currentValue
      || '#000000';
    return this._setText(scope, ['target', 'when_exceeded', 'fill_color'], nextValue, {
      deprecatedKeys: [['above_target_color']],
      prunePaths: [['target', 'when_exceeded'], ['target']],
    });
  }

  _hasTargetOverride(scope) {
    const targetValue = this.context.read(scope, ['target']);
    if (isObject(targetValue) && Object.keys(targetValue).length) {
      return true;
    }
    if (!isObject(targetValue) && targetValue !== undefined && targetValue !== null && targetValue !== '') {
      return true;
    }
    return ['target_entity', 'target_color', 'show_target_label', 'above_target_color']
      .some((key) => {
        const value = this.context.read(scope, [key]);
        return value !== undefined && value !== null && value !== '' && value !== false;
      }) || this._getTargetLabelDecimalValue(scope) !== '';
  }

  _getTargetOverrideSummary(scope) {
    const mode = this._getTargetMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const target = this._getTargetResolvableValue(scope);
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(`Target ${target.fixed}`);
    if (target.entity) parts.push('Entity');
    if (this._hasTargetShape(scope)) {
      parts.push(this._getEffectiveTargetShapeValue(scope) === 'triangle' ? 'Triangle' : 'Diamond');
    }
    if (this._hasCustomTargetColor(scope)) parts.push('Custom color');
    if (this._getTargetLabelShowValue(scope)) parts.push('Label');
    const labelDecimal = this._getTargetLabelDecimalValue(scope);
    if (labelDecimal !== '') parts.push(`Label ${labelDecimal} ${Number(labelDecimal) === 1 ? 'decimal' : 'decimals'}`);
    if (this._getTargetAboveFillColorValue(scope)) parts.push('Above');
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _write(scope, path, value, options = {}) {
    return this.context.mutate(scope, target => {
      let next = value === undefined ? deletePathValue(target, path) : setPathValue(target, path, value);
      next = removePathsFromTarget(next, options.deprecatedKeys ?? []);
      for (const prunePath of options.prunePaths ?? []) next = pruneEmptyObjectsInTarget(next, prunePath);
      return next;
    }, { ...options, targetEdit: { path: path.slice(1), value, deprecatedKeys: options.deprecatedKeys ?? [] } });
  }
  _remove(scope, path, options) { return this._write(scope, path, undefined, options); }
  _setText(scope, path, rawValue, options) { return this._write(scope, path, normalizeTextValue(rawValue).trim() || undefined, options); }
  _effectiveDisplay(scope, path, fallbacks) { return getEffectiveDisplayValue(this.context, scope, path, fallbacks); }
  _getEffectiveMarkerDirection(scope, key) { return getEffectiveMarkerDirection(this.context, scope, key); }
  _setMarkerDirection(scope, key, value) { return setMarkerDirection(this.context, scope, key, value); }
  _getBuiltinMarkerLabelOptions(scope, key) { return getBuiltinMarkerLabelOptions(this.context, scope, key, this._getEffectiveTargetLabelShowValue(scope)); }
  _renderBuiltinMarkerLabelControls(scope, key, title) { return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key)); }
  _setBuiltinMarkerLabelField(scope, key, field, value) { return setBuiltinMarkerLabelField(this.context, scope, key, field, value); }

  handleField({ field, kind, index, value }) {
    const scope = kind?.startsWith('entity-') ? { type: 'entity', index: Number(index) } : { type: 'card' };
    const control = field ?? kind?.replace(/^entity-/, '');
    if (control === 'target-inherit') { if (value) this._clearTargetOverride(scope); return true; }
    if (control === 'target-mode') { this._setTargetMode(scope, value); return true; }
    if (control === 'target-value') { this._setTargetResolvablePart(scope, 'fixed', value); return true; }
    if (control === 'target-entity-source') { this._setTargetResolvablePart(scope, 'entity', value); return true; }
    if (control === 'target-shape') { this._setTargetShape(scope, value); return true; }
    if (control === 'target-direction') { this._setMarkerDirection(scope, 'target', value); return true; }
    if (control === 'target-color') { this._setTargetColor(scope, value); return true; }
    const label = control?.match(/^target-label-(show|text|show-value|show-unit|precision)$/);
    if (label) {
      const option = label[1];
      this._setBuiltinMarkerLabelField(scope, 'target', option === 'show-value' ? 'showValue' : option === 'show-unit' ? 'showUnit' : option, value);
      return true;
    }
    if (control === 'target-above-fill-enabled') { this._setTargetAboveFillEnabled(scope, value); return true; }
    if (control === 'target-above-fill-color') { this._setTargetAboveFillColor(scope, value); return true; }
    return false;
  }

  render(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const targetInherited = !this._hasTargetOverride(scope);
      const targetParts = this._getEffectiveTargetResolvableValue(scope);
      const targetMode = this._getEffectiveTargetMode(scope);
      const targetShape = this._getEffectiveTargetShapeValue(scope);
      const targetDirection = this._getEffectiveMarkerDirection(scope, 'target');
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${index}"${targetInherited ? ' checked' : ''}>
                          <label for="entity-${index}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-mode">Target mode</label>
	                        <select id="entity-${index}-target-mode" data-kind="entity-target-mode" data-index="${index}" value="${escapeAttribute(targetMode)}">
                          <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-value">Target fallback</label>
                        <input id="entity-${index}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${index}" value="${escapeAttribute(targetParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-shape">Target shape</label>
                        <select id="entity-${index}-target-shape" data-kind="entity-target-shape" data-index="${index}" value="${escapeAttribute(targetShape)}">
                          <option value="diamond"${targetShape === 'diamond' ? ' selected' : ''}>diamond</option>
                          <option value="triangle"${targetShape === 'triangle' ? ' selected' : ''}>triangle</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-direction">Direction</label>
                        <select id="entity-${index}-target-direction" data-kind="entity-target-direction" data-index="${index}" value="${targetDirection}">
                          <option value="inward"${targetDirection === 'inward' ? ' selected' : ''}>Inward</option>
                          <option value="outward"${targetDirection === 'outward' ? ' selected' : ''}>Outward</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${renderEntitySourceInput('entity-target-entity-source', index, targetParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-color">Target color</label>
                        ${renderColorInput({
                          id: `entity-${index}-target-color`,
                          kind: 'entity-target-color',
                          index,
                          value: this._getEffectiveTargetColorValue(scope),
                          fallbackHex: '#888',
                          placeholder: 'inherit card default',
                        })}
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(scope, 'target', 'Target')}
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${index}"${this._isTargetAboveFillEnabled(scope) ? ' checked' : ''}>
	                          <label for="entity-${index}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-above-fill">Above-target color</label>
	                        ${renderColorInput({
                          id: `entity-${index}-target-above-fill`,
                          kind: 'entity-target-above-fill-color',
                          index,
                          value: this._getEffectiveTargetAboveFillColorValue(scope),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `;
    }
    const target = this._getTargetResolvableValue(scope);
    const targetMode = this._getTargetMode(scope);
    const targetShape = this._getEffectiveTargetShapeValue(scope);
    const targetDirection = this._getEffectiveMarkerDirection(scope, 'target');
    const targetColor = this._getTargetColorValue(scope);
    const targetAboveFillColor = this._getTargetAboveFillColorValue(scope);
    return `
            <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${escapeAttribute(targetMode)}">
                <option value="auto"${targetMode === 'auto' ? ' selected' : ''}>auto</option>
                <option value="enabled"${targetMode === 'enabled' ? ' selected' : ''}>enabled</option>
                <option value="disabled"${targetMode === 'disabled' ? ' selected' : ''}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${escapeAttribute(target.fixed)}">
            </div>
            <div class="field-row">
              <label for="target-shape">Target shape</label>
              <select id="target-shape" data-field="target-shape" value="${escapeAttribute(targetShape)}">
                <option value="diamond"${targetShape === 'diamond' ? ' selected' : ''}>diamond</option>
                <option value="triangle"${targetShape === 'triangle' ? ' selected' : ''}>triangle</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-direction">Direction</label>
              <select id="target-direction" data-field="target-direction" value="${targetDirection}">
                <option value="inward"${targetDirection === 'inward' ? ' selected' : ''}>Inward</option>
                <option value="outward"${targetDirection === 'outward' ? ' selected' : ''}>Outward</option>
              </select>
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${renderEntitySourceInput('target-entity-source', 'card', target.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${renderColorInput({
                id: 'target-color',
                field: 'target-color',
                value: targetColor,
                fallbackHex: '#888',
                placeholder: '#888',
              })}
            </div>
            ${this._renderBuiltinMarkerLabelControls({ type: 'card' }, 'target', 'Target')}
            <div class="field-row">
              <div class="toggle">
                <input id="target-above-fill-enabled" type="checkbox" data-field="target-above-fill-enabled"${this._isTargetAboveFillEnabled({ type: 'card' }) ? ' checked' : ''}>
                <label for="target-above-fill-enabled">Above-target color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="target-above-fill-color">Above-target color</label>
              ${renderColorInput({
                id: 'target-above-fill-color',
                field: 'target-above-fill-color',
                value: targetAboveFillColor,
                fallbackHex: '#000000',
              })}
            </div>
            </div>`;
  }
}
