import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue,
  pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { renderResolvableSourceControls } from '../shared/resolvable-source-controls.js';
import { renderPaintEditor, syncPaintEditor } from '../shared/paint-editor.js';
import { BASELINE_PAINTS } from '../../view-model/paint-destinations.js';
import { getDestinationEditorState } from '../shared/paint-destination.js';

const destinationFor = direction => BASELINE_PAINTS.find(destination => destination.id === `baseline-${direction}`);

function renderBaselinePaintEditor(context, scope, direction, options = {}) {
  const state = getDestinationEditorState(context, scope, destinationFor(direction), options.paletteValues?.(scope, direction), options.registry);
  const entity = scope?.type === 'entity';
  const prefix = entity ? `entity-${scope.index}-` : '';
  const destination = `baseline-${direction}-paint`;
  const field = property => ({ id: `${prefix}${destination}-${property}`,
    ...(entity ? { kind: `entity-${destination}-${property}` } : { field: `${destination}-${property}` }), index: scope?.index });
  const fields = Object.fromEntries(['preset', 'fill_style', 'color', 'solid_fill', 'opacity'].map(property => [property, field(property)]));
  fields.index = scope?.index;
  return `<div class="baseline-paint-destination" data-baseline-direction="${direction}"><div class="field-row"><span class="override-group-title">${direction === 'above' ? 'Above' : 'Below'} Baseline Paint</span></div>
    ${renderPaintEditor({ ...state, id: `${prefix}${destination}-editor`, root: options.root, fields,
      activation: field('enabled'), resetLabel: entity ? 'Reset to Card paint' : 'Reset to default paint',
      cssText: options.cssText, paletteFields: state.enabled ? options.paintChildren?.(scope, direction) : null })}</div>`;
}

export class BaselineSection {
  constructor(context, options = {}) { this.options = options;
    this.context = context;
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

  _hasBaselinePaint(scope, direction) {
    return getDestinationEditorState(this.context, scope, destinationFor(direction)).enabled;
  }

  _clearBaselineOverride(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const rawBaseline = getPathValue(nextTarget, ['baseline']);
      if (isObject(rawBaseline)) {
        nextTarget = deletePathValue(nextTarget, ['baseline', 'enabled']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'at']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'above', 'color']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'above', 'paint']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'below', 'color']);
        nextTarget = deletePathValue(nextTarget, ['baseline', 'below', 'paint']);
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
    if (this._hasBaselinePaint(scope, 'above')) parts.push('Above');
    if (this._hasBaselinePaint(scope, 'below')) parts.push('Below');
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
    return false;
  }

  handleClick(target) {
    if (target?.dataset?.action !== 'remove-baseline') return false;
    this._removeBaseline(target.dataset.scopeType === 'entity'
      ? { type: 'entity', index: Number(target.dataset.index) } : { type: 'card' });
    return true;
  }

  syncPaintEditors(root, scope, paletteValues = {}, registry = this.context.paintPresetRegistry, options = {}) {
    for (const direction of ['above', 'below']) {
      const id = `${scope?.type === 'entity' ? `entity-${scope.index}-` : ''}baseline-${direction}-paint-editor`;
      syncPaintEditor(root, id, getDestinationEditorState(this.context, scope, destinationFor(direction),
        paletteValues[direction], registry), options);
    }
  }

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content, renderOptions = {}) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const baselineInherited = !this._hasBaselineOverride(scope);
      const baselineParts = this._getEffectiveBaselineResolvableValue(scope);
      const baselineShow = this._getBaselineShow(scope);
      const baselinePaintEditors = ['above', 'below'].map(direction => renderBaselinePaintEditor(
        this.context, scope, direction, { ...this.options, ...renderOptions },
      )).join('');
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${index}"${baselineInherited ? ' checked' : ''}>
	                          <label for="entity-${index}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${baselinePaintEditors}
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
`;
    }
    const baseline = this._getBaselineResolvableValue(scope);
    const baselineShow = this._getBaselineShow(scope);
    const baselinePaintEditors = ['above', 'below'].map(direction => renderBaselinePaintEditor(
      this.context, scope, direction, { ...this.options, ...renderOptions },
    )).join('');
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
            ${baselinePaintEditors}
          </div>`,
          })}
`;
  }
}
