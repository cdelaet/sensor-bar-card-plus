import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue,
  pruneEmptyObjectsInTarget, normalizeTextValue } from '../shared/editor-config.js';
import { escapeAttribute, normalizeEditorColorValue, renderColorInput } from '../shared/editor-controls.js';
import { renderResolvableSourceControls } from '../shared/resolvable-source-controls.js';

export class BaselineSection {
  constructor(context, options = {}) { this.options = options;
    this.context = context;
    this.reset();
  }

  reset() { this._baselineColorDrafts = new Map(); }

  _getBaselineColorDraftKey(scope = { type: 'card' }, direction = 'above') {
    const scopeKey = scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
    return `${scopeKey}:${direction}`;
  }

  _setBaselineColorDraft(scope, direction, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
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

  _isBaselineDirectionalColorEnabled(scope, direction) {
    return !!normalizeTextValue(this._getEffectiveBaselineDirectionalColorValue(scope, direction)).trim();
  }

  _setBaselineDirectionalColorEnabled(scope, direction, value) {
    const currentValue = normalizeEditorColorValue(this._getBaselineDirectionalColorValue(scope, direction), this.options.cssText);
    if (!value) {
      if (currentValue) {
        this._setBaselineColorDraft(scope, direction, currentValue);
      }
      if (scope?.type === 'entity') {
        return this.context.mutate(scope, (target) => {
          const current = getPathValue(target, ['baseline', direction]);
          const nextDirection = isObject(current) ? cloneDeep(current) : {};
          nextDirection.color = null;
          return setPathValue(target, ['baseline', direction], nextDirection);
        }, { baselineEdit: { path: [direction, 'color'], value: null } });
      }
      return this._removeColor(scope, ['baseline', direction, 'color'], {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    const nextValue = this._getBaselineColorDraft(scope, direction)
      || normalizeEditorColorValue(this._getEffectiveBaselineDirectionalColorValue(scope, direction), this.options.cssText)
      || currentValue
      || '#000000';
    return this._setColor(scope, ['baseline', direction, 'color'], nextValue, {
      prunePaths: [['baseline', direction], ['baseline']],
    });
  }

  _handleValueField(control, value, scope) {
    if (control !== 'baseline-value') return false;
    this._setBaselineResolvablePart(scope, 'value', value);
    return true;
  }

  _getBaselineResolvableValue(scope) {
    return this.context.source(scope, 'baseline');
  }

  _getEffectiveBaselineResolvableValue(scope) {
    return this.context.source(scope, 'baseline', true);
  }

  _getBaselineMode(scope) {
    const enabled = this.context.read(scope, ['baseline', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasBaselineOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getBaselineShow(scope) {
    const enabled = this.context.read(scope, ['baseline', 'enabled']);
    if (typeof enabled === 'boolean') return enabled;
    return scope?.type === 'entity' ? this._getBaselineShow({ type: 'card' }) : true;
  }

  _setBaselineShow(scope, value) {
    const enabled = !!value;
    return this.context.mutate(scope, (target) => {
      const rawBaseline = getPathValue(target, ['baseline']);
      let nextTarget = cloneDeep(target);
      if (rawBaseline !== undefined && rawBaseline !== null && !isObject(rawBaseline)) {
        nextTarget = setPathValue(nextTarget, ['baseline'], { at: rawBaseline, enabled });
      } else {
        nextTarget = setPathValue(nextTarget, ['baseline', 'enabled'], enabled);
      }
      return nextTarget;
    }, { baselineEdit: { path: ['enabled'], value: enabled } });
  }

  _setBaselineDirectionalColor(scope, direction, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
    this._setBaselineColorDraft(scope, direction, normalizedValue);
    const path = ['baseline', direction, 'color'];
    if (!normalizedValue) {
      return this._removeColor(scope, path, {
        prunePaths: [['baseline', direction], ['baseline']],
      });
    }
    if (!this._isBaselineDirectionalColorEnabled(scope, direction)) {
      return this._setBaselineDirectionalColorEnabled(scope, direction, true);
    }
    return this.context.mutate(scope, (target) => {
      return setPathValue(target, path, normalizedValue);
    }, { baselineEdit: { path: [direction, 'color'], value: normalizedValue } });
  }

  _getBaselineDirectionalColorValue(scope, direction) {
    return this.context.read(scope, ['baseline', direction, 'color']) ?? '';
  }

  _getEffectiveBaselineDirectionalColorValue(scope, direction) {
    const value = this.context.read(scope, ['baseline', direction, 'color']);
    if (value !== undefined) return value ?? '';
    return scope?.type === 'entity' ? this.context.read({ type: 'card' }, ['baseline', direction, 'color']) ?? '' : '';
  }

  _clearBaselineOverride(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const rawBaseline = getPathValue(nextTarget, ['baseline']);
      if (isObject(rawBaseline)) {
        nextTarget = deletePathValue(nextTarget, ['baseline', 'enabled']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'at']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'above', 'color']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'below', 'color']);
      } else {
        nextTarget = deletePathValue(nextTarget, ['baseline']);
      }
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'above']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['baseline', 'below']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['baseline']);
      return nextTarget;
    }, { rerender: true });
  }

  _removeBaseline(scope) {
    return this.context.mutate(scope, target => deletePathValue(target, ['baseline']), { rerender: true });
  }

  _hasBaselineOverride(scope) {
    const baselineValue = this.context.read(scope, ['baseline']);
    if (isObject(baselineValue) && Object.keys(baselineValue).length) {
      return true;
    }
    return !isObject(baselineValue) && baselineValue !== undefined && baselineValue !== null && baselineValue !== '';
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

  _getCardBaselineSummary() {
    const mode = this._getBaselineMode({ type: 'card' });
    if (mode === 'disabled') return 'Disabled';

    const baseline = this._getBaselineResolvableValue({ type: 'card' });
    const origin = baseline.entity
      || (baseline.fixed !== '' && baseline.fixed !== undefined ? baseline.fixed : '');
    const modeLabel = mode === 'enabled' ? 'Enabled' : 'Auto';
    return origin !== '' ? `${modeLabel} · ${origin}` : modeLabel;
  }

  _setBaselineResolvablePart(scope, part, value) {
    return this.context.setSource(scope, 'baseline', part, value);
  }

  _setColor(scope, path, value, options = {}) {
    return this.context.mutate(scope, target => {
      let next = value === undefined ? deletePathValue(target, path) : setPathValue(target, path, value);
      for (const prunePath of options.prunePaths ?? []) next = pruneEmptyObjectsInTarget(next, prunePath);
      return next;
    }, { ...options, baselineEdit: { path: path.slice(1), value } });
  }

  _removeColor(scope, path, options) { return this._setColor(scope, path, undefined, options); }

  handleField({ field, kind, index, value }) {
    const scope = kind?.startsWith('entity-') ? { type: 'entity', index: Number(index) } : { type: 'card' };
    const control = field ?? kind?.replace(/^entity-/, '');
    if (this._handleValueField(control, value, scope)) return true;
    if (kind === 'entity-baseline-inherit') {
      if (value) this._clearBaselineOverride(scope);
      else this._setBaselineShow(scope, this._getBaselineShow(scope));
      return true;
    }
    if (control === 'baseline-show') { this._setBaselineShow(scope, value); return true; }
    if (control === 'baseline-value') { this._setBaselineResolvablePart(scope, 'fixed', value); return true; }
    if (control === 'baseline-entity-source') { this._setBaselineResolvablePart(scope, 'entity', value); return true; }
    if (control === 'baseline-attribute') { this._setBaselineResolvablePart(scope, 'attribute', value); return true; }
    for (const direction of ['above', 'below']) {
      if (control === `baseline-${direction}-color`) { this._setBaselineDirectionalColor(scope, direction, value); return true; }
      if (control === `baseline-${direction}-color-enabled`) { this._setBaselineDirectionalColorEnabled(scope, direction, value); return true; }
    }
    return false;
  }

  handleClick(target) {
    if (target?.dataset?.action !== 'remove-baseline') return false;
    this._removeBaseline(target.dataset.scopeType === 'entity'
      ? { type: 'entity', index: Number(target.dataset.index) } : { type: 'card' });
    return true;
  }

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const baselineInherited = !this._hasBaselineOverride(scope);
      const baselineParts = this._getEffectiveBaselineResolvableValue(scope);
      const baselineShow = this._getBaselineShow(scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${index}"${baselineInherited ? ' checked' : ''}>
	                          <label for="entity-${index}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <button type="button" data-action="remove-baseline" data-scope-type="entity" data-index="${index}" aria-label="Remove Baseline" title="Remove Baseline">🗑</button>
                      </div>
                      <div class="field-row">
	                      <div class="toggle">
	                        <input id="entity-${index}-baseline-show" type="checkbox" data-kind="entity-baseline-show" data-index="${index}"${baselineShow ? ' checked' : ''}>
	                        <label for="entity-${index}-baseline-show">Enable Baseline</label>
	                      </div>
                      </div>
                      ${renderResolvableSourceControls({ source: baselineParts,
                        value: { id: `entity-${index}-baseline-value`, kind: 'entity-baseline-value', index },
                        entity: { kind: 'entity-baseline-entity-source', index },
                        attribute: { kind: 'entity-baseline-attribute', index }, hass: this.context.hass,
                        labels: { entity: 'Baseline entity', attribute: 'Baseline attribute' },
                        placeholders: { entity: 'inherit card default' },
                      })}
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, 'above') ? ' checked' : ''}>
                          <label for="entity-${index}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-above-color">Above-baseline color</label>
                        ${renderColorInput({ cssText: this.options.cssText, label: 'Baseline color',
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
	                        ${renderColorInput({ cssText: this.options.cssText, label: 'Baseline color',
                          id: `entity-${index}-baseline-below-color`,
                          kind: 'entity-baseline-below-color',
                          index,
                          value: this._getEffectiveBaselineDirectionalColorValue(scope, 'below'),
                          fallbackHex: '#000000',
	                          placeholder: 'inherit card default',
	                        })}
	                      </div>
	                          `;
    }
    const baseline = this._getBaselineResolvableValue(scope);
    const baselineShow = this._getBaselineShow(scope);
    const baselineAboveColor = this._getBaselineDirectionalColorValue(scope, 'above');
    const baselineBelowColor = this._getBaselineDirectionalColorValue(scope, 'below');
    return `
          ${renderGroup({
            group: 'baseline',
            title: 'Baseline',
            summary: this._getCardBaselineSummary(),
          content: `
          <div class="field-grid">
            <div class="field-row">
              <button type="button" data-action="remove-baseline" data-scope-type="card" aria-label="Remove Baseline" title="Remove Baseline">🗑</button>
            </div>
            <div class="field-row">
	              <div class="toggle">
	                <input id="baseline-show" type="checkbox" data-field="baseline-show"${baselineShow ? ' checked' : ''}>
	                <label for="baseline-show">Enable Baseline</label>
	              </div>
            </div>
            ${renderResolvableSourceControls({ source: baseline,
              value: { id: 'baseline-value', field: 'baseline-value' },
              entity: { kind: 'baseline-entity-source', index: 'card' },
              attribute: { kind: 'baseline-attribute', index: 'card' }, hass: this.context.hass,
              labels: { entity: 'Baseline entity', attribute: 'Baseline attribute' },
            })}
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: 'card' }, 'above') ? ' checked' : ''}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${renderColorInput({ cssText: this.options.cssText, label: 'Baseline color',
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
              ${renderColorInput({ cssText: this.options.cssText, label: 'Baseline color',
                id: 'baseline-below-color',
                field: 'baseline-below-color',
                value: baselineBelowColor,
                fallbackHex: '#000000',
              })}
            </div>
          </div>`,
          })}
`;
  }
}
