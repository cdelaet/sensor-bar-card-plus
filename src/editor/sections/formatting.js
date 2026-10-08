import {
  isObject, normalizeTextValue, normalizeDecimalValue,
  setPathValue, deletePathValue, removePathsFromTarget, pruneEmptyObjectsInTarget,
} from '../shared/editor-config.js';
import { escapeAttribute } from '../shared/editor-controls.js';

// Only raw scoped reads and a host-owned mutation sink are needed here.
export function getFormattingValue(context, scope, key) {
  return context.read(scope, ['formatting', key]) ?? context.read(scope, [key]) ?? '';
}

export function getEffectiveFormattingValue(context, scope, key) {
  const paths = [['formatting', key], [key]];
  for (const path of paths) {
    const value = context.read(scope, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  if (scope?.type === 'entity') {
    for (const path of paths) {
      const value = context.read({ type: 'card' }, path);
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return '';
}

export function setFormattingUnit(context, scope, rawValue) {
  const value = normalizeTextValue(rawValue).trim();
  return context.mutate(scope, target => {
    let nextTarget = value
      ? setPathValue(target, ['formatting', 'unit'], value)
      : deletePathValue(target, ['formatting', 'unit']);
    nextTarget = deletePathValue(nextTarget, ['unit']);
    return pruneEmptyObjectsInTarget(nextTarget, ['formatting']);
  });
}

export function setFormattingDecimal(context, scope, rawValue) {
  const value = normalizeDecimalValue(rawValue);
  const empty = rawValue === '' || rawValue === null || rawValue === undefined;
  if (!empty && value === null) return false;
  return context.mutate(scope, target => {
    let nextTarget = empty
      ? deletePathValue(target, ['formatting', 'decimal'])
      : setPathValue(target, ['formatting', 'decimal'], value);
    nextTarget = deletePathValue(nextTarget, ['decimal']);
    return pruneEmptyObjectsInTarget(nextTarget, ['formatting']);
  });
}

export function clearFormattingOverride(context, scope) {
  return context.mutate(scope, target => {
    const nextTarget = removePathsFromTarget(target, [['formatting', 'unit'], ['formatting', 'decimal'], ['unit'], ['decimal']]);
    return pruneEmptyObjectsInTarget(nextTarget, ['formatting']);
  }, { rerender: true });
}

export function hasFormattingOverride(context, scope) {
  const value = context.read(scope, ['formatting']) ?? {};
  if (isObject(value) && (Object.prototype.hasOwnProperty.call(value, 'unit') || Object.prototype.hasOwnProperty.call(value, 'decimal'))) return true;
  return context.read(scope, ['unit']) !== undefined || context.read(scope, ['decimal']) !== undefined;
}

export function getFormattingSummary(context, scope) {
  const parts = [];
  const unit = getFormattingValue(context, scope, 'unit');
  const decimal = getFormattingValue(context, scope, 'decimal');
  if (unit !== '') parts.push(`Unit ${unit}`);
  if (decimal !== '') parts.push(`${decimal} ${Number(decimal) === 1 ? 'decimal' : 'decimals'}`);
  return parts.length ? parts.join(' • ') : 'Inherited';
}

export function handleFormattingField(context, { field, kind, index, value }) {
  if (field === 'formatting-unit' || field === 'formatting-decimal') {
    const setter = field === 'formatting-unit' ? setFormattingUnit : setFormattingDecimal;
    setter(context, { type: 'card' }, value);
    return true;
  }
  const scope = { type: 'entity', index: Number(index) };
  if (kind === 'entity-formatting-inherit') {
    if (value) clearFormattingOverride(context, scope);
    return true;
  }
  if (kind === 'entity-formatting-unit' || kind === 'entity-formatting-decimal') {
    const setter = kind === 'entity-formatting-unit' ? setFormattingUnit : setFormattingDecimal;
    setter(context, scope, value);
    return true;
  }
  return false;
}

export function renderFormattingSection(context, scope) {
  if (scope?.type === 'entity') {
    const index = scope.index;
    const formattingInherited = !hasFormattingOverride(context, scope);
    return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${index}"${formattingInherited ? ' checked' : ''}>
                          <label for="entity-${index}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-unit">Unit</label>
                        <input id="entity-${index}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${index}" value="${escapeAttribute(getEffectiveFormattingValue(context, scope, 'unit'))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-decimal">Decimals</label>
                        <input id="entity-${index}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${index}" value="${escapeAttribute(getEffectiveFormattingValue(context, scope, 'decimal'))}" placeholder="inherit card default">
                      </div>
	                          `;
  }
  const formattingUnit = getFormattingValue(context, { type: 'card' }, 'unit');
  const formattingDecimal = getFormattingValue(context, { type: 'card' }, 'decimal');
  return `	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${escapeAttribute(formattingUnit)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${escapeAttribute(formattingDecimal)}">
            </div>
          </div>
	        </div>`;
}
