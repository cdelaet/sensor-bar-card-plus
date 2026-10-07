import { normalizeBarConfig } from '../../config/normalize.js';
import {
  isObject, normalizeTextValue, setPathValue, deletePathValue,
  removePathsFromTarget, pruneEmptyObjectsInTarget,
} from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue, renderColorInput } from '../shared/editor-controls.js';

export function getFillStyleFromColorMode(colorMode) {
  switch (colorMode) {
    case 'single': return 'solid';
    case 'gradient': return 'gradient';
    case 'severity': return 'bands';
    case 'severity_gradient': return 'band_gradient';
    default: return 'bands';
  }
}

export function getFillStyleValue(context, scope) {
  const fillStyle = context.read(scope, ['bar', 'fill_style']);
  if (fillStyle) return fillStyle;
  const colorMode = context.read(scope, ['bar', 'color_mode']) ?? context.read(scope, ['color_mode']);
  return getFillStyleFromColorMode(colorMode);
}

export function getEffectiveFillStyleValue(context, scope) {
  // Reuse existing bar normalization/paint explicitness; never normalize or
  // persist a whole card. Empty-path reads supply raw root/local scope data.
  if (scope?.type === 'entity') {
    return normalizeBarConfig(context.read(scope, []), context.read({ type: 'card' }, []), { isCardScope: false }).fill_style;
  }
  return normalizeBarConfig(context.read({ type: 'card' }, []), null, { isCardScope: true }).fill_style;
}

export function getBarColorValue(context, scope) {
  return context.read(scope, ['bar', 'color']) ?? context.read(scope, ['color']) ?? '#4a9eff';
}

export function getEffectiveBarColorValue(context, scope) {
  const paths = [['bar', 'color'], ['color']];
  for (const path of paths) {
    const value = context.read(scope, path);
    if (value !== undefined && value !== null && value !== '') return value || '#4a9eff';
  }
  if (scope?.type === 'entity') {
    for (const path of paths) {
      const value = context.read({ type: 'card' }, path);
      if (value !== undefined && value !== null && value !== '') return value || '#4a9eff';
    }
  }
  return '#4a9eff';
}

// Field-specific canonical edits keep the existing alias removal and pruning.
// Cleanup, emission and scheduling are entirely the host's mutation policy.
function setAppearanceValue(context, scope, key, value, deprecatedKeys = []) {
  const options = { deprecatedKeys, prunePaths: [['bar']] };
  return context.mutate(scope, target => {
    let nextTarget = value === undefined
      ? deletePathValue(target, ['bar', key])
      : setPathValue(target, ['bar', key], value);
    nextTarget = removePathsFromTarget(nextTarget, deprecatedKeys);
    return pruneEmptyObjectsInTarget(nextTarget, ['bar']);
  }, options);
}

export function setBarFillStyle(context, scope, rawValue) {
  const value = normalizeTextValue(rawValue).trim();
  return setAppearanceValue(context, scope, 'fill_style', value || undefined, [['color_mode']]);
}

export function setBarColor(context, scope, rawValue) {
  const value = normalizeTextValue(rawValue).trim();
  const remove = !value || normalizeColorComparisonValue(value) === normalizeColorComparisonValue('#4a9eff');
  return setAppearanceValue(context, scope, 'color', remove ? undefined : value, [['color']]);
}

export function getBarSolidFillValue(context, scope) {
  return !!context.read(scope, ['bar', 'solid_fill']);
}

export function getEffectiveBarSolidFillValue(context, scope) {
  if (scope?.type !== 'entity') return getBarSolidFillValue(context, scope);
  const localValue = context.read(scope, ['bar', 'solid_fill']);
  if (localValue !== undefined) return !!localValue;
  return getBarSolidFillValue(context, { type: 'card' });
}

export function setBarSolidFill(context, scope, value) {
  return setAppearanceValue(context, scope, 'solid_fill', value ? true : undefined);
}

export function clearBarAppearanceOverride(context, scope) {
  return context.mutate(scope, target => {
    const nextTarget = removePathsFromTarget(target, [
      ['bar', 'fill_style'], ['bar', 'color'], ['bar', 'solid_fill'], ['color_mode'], ['color'],
    ]);
    return pruneEmptyObjectsInTarget(nextTarget, ['bar']);
  }, { rerender: true });
}

export function hasBarAppearanceOverride(context, scope) {
  const bar = context.read(scope, ['bar']) ?? {};
  if (isObject(bar) && (
    Object.prototype.hasOwnProperty.call(bar, 'fill_style')
    || Object.prototype.hasOwnProperty.call(bar, 'color')
    || Object.prototype.hasOwnProperty.call(bar, 'solid_fill')
  )) return true;
  return context.read(scope, ['color_mode']) !== undefined || context.read(scope, ['color']) !== undefined;
}

export function getBarAppearanceSummary(context, scope) {
  const parts = [];
  const fillStyle = getFillStyleValue(context, scope);
  const color = context.read(scope, ['bar', 'color']) ?? context.read(scope, ['color']);
  if (fillStyle && fillStyle !== 'bands') parts.push(fillStyle.replace(/_/g, ' '));
  if (color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue('#4a9eff')) parts.push('Custom color');
  return parts.length ? parts.join(' • ') : 'Inherited';
}

export function handleBarAppearanceField(context, { field, kind, index, value }) {
  const rootSetters = { 'bar-fill-style': setBarFillStyle, 'bar-color': setBarColor, 'bar-solid-fill': setBarSolidFill };
  if (Object.prototype.hasOwnProperty.call(rootSetters, field)) {
    rootSetters[field](context, { type: 'card' }, value);
    return true;
  }
  const scope = { type: 'entity', index: Number(index) };
  if (kind === 'entity-bar-inherit') {
    if (value) clearBarAppearanceOverride(context, scope);
    return true;
  }
  const rowSetters = { 'entity-bar-fill-style': setBarFillStyle, 'entity-bar-color': setBarColor, 'entity-bar-solid-fill': setBarSolidFill };
  if (Object.prototype.hasOwnProperty.call(rowSetters, kind)) {
    rowSetters[kind](context, scope, value);
    return true;
  }
  return false;
}

// The root's existing nested Baseline/Needle content is supplied by its host.
// Shared Segments/Gradient Stops are composed separately as sibling sections.
// Entity content still belongs inside the host-owned override disclosure.
export function renderBarAppearanceSection(context, scope, renderChildren = () => '') {
  if (scope?.type === 'entity') {
    const index = scope.index;
    const barAppearanceInherited = !hasBarAppearanceOverride(context, scope);
    return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${index}"${barAppearanceInherited ? ' checked' : ''}>
                          <label for="entity-${index}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-fill-style">Fill style</label>
                        <select id="entity-${index}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${index}" value="${escapeAttribute(getEffectiveFillStyleValue(context, scope))}">
                          <option value="bands"${getEffectiveFillStyleValue(context, scope) === 'bands' ? ' selected' : ''}>bands</option>
                          <option value="solid"${getEffectiveFillStyleValue(context, scope) === 'solid' ? ' selected' : ''}>solid</option>
                          <option value="gradient"${getEffectiveFillStyleValue(context, scope) === 'gradient' ? ' selected' : ''}>gradient</option>
                          <option value="soft_bands"${getEffectiveFillStyleValue(context, scope) === 'soft_bands' ? ' selected' : ''}>soft_bands</option>
                          <option value="band_gradient"${getEffectiveFillStyleValue(context, scope) === 'band_gradient' ? ' selected' : ''}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${index}"${getEffectiveBarSolidFillValue(context, scope) ? ' checked' : ''}>
                          <label for="entity-${index}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-color">Bar color</label>
                        ${renderColorInput({
                          id: `entity-${index}-bar-color`,
                          kind: 'entity-bar-color',
                          index,
                          value: getEffectiveBarColorValue(context, scope),
                          fallbackHex: '#4a9eff',
                          placeholder: 'inherit card default',
                        })}
                      </div>
	                          `;
  }
  const fillStyle = getEffectiveFillStyleValue(context, { type: 'card' });
  const barColor = getBarColorValue(context, { type: 'card' });
  const barSolidFill = getBarSolidFillValue(context, { type: 'card' });
  return `	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${escapeAttribute(fillStyle)}">
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
              ${renderColorInput({
                id: 'bar-color',
                field: 'bar-color',
                value: barColor,
                fallbackHex: '#4a9eff',
                placeholder: '#4a9eff',
              })}
            </div>
          </div>${renderChildren()}
	        </div>`;
}
