import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue,
  pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { escapeAttribute, normalizeEditorColorValue, normalizeColorComparisonValue, renderColorInput } from '../shared/editor-controls.js';

export class NeedleSection {
  constructor(context, options = {}) { this.options = options;
    this.context = context;
  }

  _setNeedle(value) {
    return this._setScopedNeedleMode({ type: 'card' }, value ? 'enabled' : 'disabled');
  }

  _getScopedNeedleConfig(scope) {
    const rawNeedle = this.context.read(scope, ['bar', 'needle']);
    const defaultColor = '#ffffff';
    let mode = scope?.type === 'entity' ? 'inherit' : 'disabled';
    let color = '';

    if (typeof rawNeedle === 'boolean') {
      mode = rawNeedle ? 'enabled' : 'disabled';
    } else if (isObject(rawNeedle)) {
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
    return this.context.read(scope, ['bar', 'needle']) !== undefined;
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
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const existingNeedle = getPathValue(nextTarget, ['bar', 'needle']);
      const existingColor = isObject(existingNeedle) ? existingNeedle.color : undefined;

      nextTarget = deletePathValue(nextTarget, ['bar', 'needle']);

      if (scope?.type === 'entity' && mode === 'inherit') {
        nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      if (mode === 'disabled') {
        if (scope?.type === 'entity') {
          nextTarget = setPathValue(nextTarget, ['bar', 'needle'], { show: false });
        }
        nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
        return nextTarget;
      }

      const nextNeedle = { show: true };
      if (existingColor && existingColor !== '#ffffff') {
        nextNeedle.color = existingColor;
      }
      nextTarget = setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { needleEdit: { field: 'mode', value: mode } });
  }

  _setScopedNeedleColor(scope, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const current = this._getScopedNeedleConfig(scope);
      const hasCustomColor = normalizedValue
        && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue('#ffffff');

      nextTarget = deletePathValue(nextTarget, ['bar', 'needle', 'color']);

      if (scope?.type !== 'entity' && current.mode === 'disabled') {
        nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
        nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
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
        nextTarget = setPathValue(nextTarget, ['bar', 'needle'], nextNeedle);
      } else {
        nextTarget = deletePathValue(nextTarget, ['bar', 'needle']);
      }

      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar', 'needle']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { needleEdit: { field: 'color', value: normalizedValue } });
  }

  _getNeedleValue() {
    return this._getScopedNeedleConfig({ type: 'card' }).mode === 'enabled';
  }

  _removeScopedNeedle(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = deletePathValue(target, ['bar', 'needle']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    });
  }

  _getNeedleSummary(scope) {
    if (scope?.type === 'entity' && !this._hasNeedleOverride(scope)) return 'Inherited';
    const needle = this._getScopedNeedleConfig(scope);
    if (needle.mode === 'disabled') return needle.color ? 'Disabled • Custom color' : 'Disabled';
    if (needle.mode === 'enabled') return needle.color ? 'Enabled • Custom color' : 'Enabled';
    if (needle.color) return 'Custom color';
    return 'Inherited';
  }

  handleField({ field, kind, index, value }) {
    const scope = kind?.startsWith('entity-') ? { type: 'entity', index: Number(index) } : { type: 'card' };
    const control = field ?? kind?.replace(/^entity-/, '');
    if (kind === 'entity-needle-inherit') {
      if (value) this._removeScopedNeedle(scope);
      return true;
    }
    if (['bar-needle-mode', 'needle-mode'].includes(control)) { this._setScopedNeedleMode(scope, value); return true; }
    if (['bar-needle-color', 'needle-color'].includes(control)) { this._setScopedNeedleColor(scope, value); return true; }
    return false;
  }

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const needleInherited = !this._hasNeedleOverride(scope);
      const entityNeedle = this._getEffectiveScopedNeedleConfig(scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${index}"${needleInherited ? ' checked' : ''}>
                          <label for="entity-${index}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-mode">Needle mode</label>
	                        <select id="entity-${index}-needle-mode" data-kind="entity-needle-mode" data-index="${index}" value="${escapeAttribute(entityNeedle.mode)}">
                          <option value="enabled"${entityNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
                          <option value="disabled"${entityNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-color">Needle color</label>
	                        ${renderColorInput({ cssText: this.options.cssText, label: 'Needle color',
                          id: `entity-${index}-needle-color`,
                          kind: 'entity-needle-color',
                          index,
                          value: entityNeedle.color,
                          fallbackHex: '#ffffff',
	                          placeholder: '#ffffff',
	                        })}
	                      </div>
	                          `;
    }
    const cardNeedle = this._getScopedNeedleConfig(scope);
    return `          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${escapeAttribute(cardNeedle.mode)}">
                <option value="disabled"${cardNeedle.mode === 'disabled' ? ' selected' : ''}>disabled</option>
                <option value="enabled"${cardNeedle.mode === 'enabled' ? ' selected' : ''}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${renderColorInput({ cssText: this.options.cssText, label: 'Needle color',
                id: 'bar-needle-color',
                field: 'bar-needle-color',
                value: cardNeedle.color,
                fallbackHex: '#ffffff',
                placeholder: '#ffffff',
              })}
            </div>
          </div>`;
  }
}
