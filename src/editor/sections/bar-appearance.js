import { normalizeBarConfig } from '../../config/normalize.js';
import {
  isObject, getPathValue,
  removePathsFromTarget, pruneEmptyObjectsInTarget,
} from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue } from '../shared/editor-controls.js';
import { renderDirectionControl, setDirectionValue } from '../shared/direction-control.js';
import { createPaintBindings } from '../shared/paint-bindings.js';
import { usesGroupedBarPaint, readBarPaintProperty, ownsBarPaintProperty, clearBarPaintProperties } from '../shared/bar-paint-bindings.js';
import { renderPaintEditor, syncPaintEditor } from '../shared/paint-editor.js';
import { BAR_PAINT } from '../../view-model/paint-destinations.js';
import { getDestinationEditorState, resetDestinationPaint, selectDestinationPreset, clearDestinationProperty, setDestinationProperty, hasDestinationConfiguration } from '../shared/paint-destination.js';

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
  const fillStyle = readBarPaintProperty(context, scope, 'fill_style');
  if (fillStyle) return fillStyle;
  const colorMode = context.read(scope, ['bar', 'color_mode']) ?? context.read(scope, ['color_mode']);
  return getFillStyleFromColorMode(colorMode);
}

export function getEffectiveFillStyleValue(context, scope) {
  return getBarPaintEditorState(context, scope).paint.fill_style;
}

export function getBarColorValue(context, scope) {
  return readBarPaintProperty(context, scope, 'color') ?? '#4a9eff';
}

export function getEffectiveBarColorValue(context, scope) {
  return getBarPaintEditorState(context, scope).paint.color;
}

// Field-specific canonical edits keep the existing alias removal and pruning.
// Cleanup, emission and scheduling are entirely the host's mutation policy.
function setAppearanceValue(context, scope, key, value, deprecatedKeys = []) {
  const options = { deprecatedKeys, prunePaths: [['bar']] };
  const cleanup = target => pruneEmptyObjectsInTarget(removePathsFromTarget(target, deprecatedKeys), ['bar']);
  // Promotion belongs to this bar adapter. Present the promoted destination to
  // the bindings and apply it atomically with the edit, without a separate emit.
  const promoteBar = target => target?.bar === null ? { ...target, bar: {} } : target;
  const bindings = createPaintBindings({
    read: (scope, path) => getPathValue(promoteBar(context.read(scope, [])), path),
    mutate: (scope, mutation, options) => context.mutate(scope, target => cleanup(mutation(promoteBar(target))), options),
  }, { scope, path: ['bar'] });
  // Clearing an absent structured field must still remove its legacy alias.
  if (value === undefined && !bindings.hasOverride(key)) return context.mutate(scope, cleanup, options);
  return value === undefined ? bindings.clear(key, options) : bindings.set(key, value, options);
}

export function setBarFillStyle(context, scope, rawValue) {
  return setDestinationProperty(context, scope, BAR_PAINT, 'fill_style', rawValue);
}

export function setBarColor(context, scope, rawValue, options = {}) {
  return setDestinationProperty(context, scope, BAR_PAINT, 'color', rawValue, options);
}

export function getBarSolidFillValue(context, scope) {
  return !!readBarPaintProperty(context, scope, 'solid_fill');
}

export function getEffectiveBarSolidFillValue(context, scope) {
  return !!getBarPaintEditorState(context, scope).paint.solid_fill;
}

export function setBarSolidFill(context, scope, value) {
  return setDestinationProperty(context, scope, BAR_PAINT, 'solid_fill', value);
}

export function setBarOpacity(context, scope, rawValue) {
  return setDestinationProperty(context, scope, BAR_PAINT, 'opacity', rawValue);
}

export function getBarAnimatedValue(context, scope) {
  return !!normalizeBarConfig(context.read(scope, []), scope?.type === 'entity' ? context.read({ type: 'card' }, []) : null).animated;
}

export function setBarAnimated(context, scope, value) {
  // Keep a canonical true only when an inherited/flat false needs overriding.
  const fallback = context.read(scope, ['animated'])
    ?? (scope?.type === 'entity' ? normalizeBarConfig(context.read({ type: 'card' }, []), null).animated : true);
  return setAppearanceValue(context, scope, 'animated', value ? (fallback ? undefined : true) : false);
}

export function clearBarAppearanceOverride(context, scope) {
  return context.mutate(scope, target => {
    const nextTarget = removePathsFromTarget(usesGroupedBarPaint(context, scope)
      ? clearBarPaintProperties(target, ['preset', 'color', 'fill_style', 'solid_fill', 'opacity'])
      : clearBarPaintProperties(target, ['preset', 'opacity']), [
      ['bar', 'fill_style'], ['bar', 'color'], ['bar', 'solid_fill'], ['bar', 'direction'], ['bar', 'animated'], ['animated'], ['color_mode'], ['color'],
    ]);
    return pruneEmptyObjectsInTarget(nextTarget, ['bar']);
  }, { rerender: true, ...(usesGroupedBarPaint(context, scope) ? { preserveRawConfig: true } : {}) });
}

export function hasLocalBarPaintConfiguration(context, scope) {
  return hasDestinationConfiguration(context, scope, BAR_PAINT);
}

export function resetBarPaintConfiguration(context, scope) {
  return resetDestinationPaint(context, scope, BAR_PAINT);
}

export function hasBarAppearanceOverride(context, scope) {
  if (['preset', 'color', 'fill_style', 'solid_fill', 'segments', 'gradient_stops', 'opacity']
    .some(key => Object.prototype.hasOwnProperty.call(context.read(scope, ['bar', 'paint']) ?? {}, key))) return true;
  const bar = context.read(scope, ['bar']) ?? {};
  if (isObject(bar) && (
    Object.prototype.hasOwnProperty.call(bar, 'fill_style')
    || Object.prototype.hasOwnProperty.call(bar, 'color')
    || Object.prototype.hasOwnProperty.call(bar, 'solid_fill')
    || Object.prototype.hasOwnProperty.call(bar, 'direction')
    || Object.prototype.hasOwnProperty.call(bar, 'animated')
  )) return true;
  return context.read(scope, ['animated']) !== undefined || context.read(scope, ['color_mode']) !== undefined || context.read(scope, ['color']) !== undefined;
}

export function getBarAppearanceSummary(context, scope) {
  const parts = [];
  const fillStyle = getFillStyleValue(context, scope);
  const color = readBarPaintProperty(context, scope, 'color');
  const direction = context.read(scope, ['bar', 'direction']);
  if (fillStyle && fillStyle !== 'bands') parts.push(fillStyle.replace(/_/g, ' '));
  if (color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue('#4a9eff')) parts.push('Custom color');
  if (direction !== undefined) parts.push(`Direction ${direction === 'reverse' ? 'Reverse' : 'Normal'}`);
  return parts.length ? parts.join(' • ')
    : scope?.type === 'entity' && hasBarAppearanceOverride(context, scope) ? 'Custom row settings' : 'Inherited';
}

export function handleBarAppearanceField(context, { field, kind, index, value }, options = {}) {
  if (field === 'bar-direction') {
    setDirectionValue(context, { type: 'card' }, ['bar', 'direction'], value);
    return true;
  }
  if (kind === 'entity-bar-direction') {
    setDirectionValue(context, { type: 'entity', index: Number(index) }, ['bar', 'direction'], value);
    return true;
  }
  if (options.animation && field === 'bar-animated') { setBarAnimated(context, { type: 'card' }, value); return true; }
  if (options.animation && kind === 'entity-bar-animated') { setBarAnimated(context, { type: 'entity', index: Number(index) }, value); return true; }
  if (field === 'bar-paint-preset') return setBarPaintPreset(context, { type: 'card' }, value, options);
  const rootSetters = { 'bar-fill-style': setBarFillStyle, 'bar-color': setBarColor, 'bar-solid-fill': setBarSolidFill, 'bar-opacity': setBarOpacity };
  if (Object.prototype.hasOwnProperty.call(rootSetters, field)) {
    rootSetters[field](context, { type: 'card' }, value, options);
    return true;
  }
  const scope = { type: 'entity', index: Number(index) };
  if (kind === 'entity-bar-inherit') {
    if (value) clearBarAppearanceOverride(context, scope);
    return true;
  }
  if (kind === 'entity-bar-paint-preset') return setBarPaintPreset(context, scope, value, options);
  const rowSetters = { 'entity-bar-fill-style': setBarFillStyle, 'entity-bar-color': setBarColor, 'entity-bar-solid-fill': setBarSolidFill, 'entity-bar-opacity': setBarOpacity };
  if (Object.prototype.hasOwnProperty.call(rowSetters, kind)) {
    rowSetters[kind](context, scope, value);
    return true;
  }
  return false;
}

// Ordinary-bar destination adapter. The Paint Editor itself has no bar paths,
// inheritance rules, aliases or host mutation policy.
export function getBarPaintEditorState(context, scope, paletteValues, registry = context.paintPresetRegistry) {
  return getDestinationEditorState(context, scope, BAR_PAINT, paletteValues, registry);
}

export function syncBarPaintEditor(root, context, scope, paletteValues, options) {
  const id = scope?.type === 'entity' ? `entity-${scope.index}-paint-editor` : 'card-paint-editor';
  const state = getBarPaintEditorState(context, scope, paletteValues, options?.registry);
  syncPaintEditor(root, id, state, options);
  return state;
}

export function clearBarPaintPropertyOverride(context, scope, property) {
  return clearDestinationProperty(context, scope, BAR_PAINT, property);
}

function setBarPaintPreset(context, scope, value, options = {}) {
  return selectDestinationPreset(context, scope, BAR_PAINT, value, options);
}

export function renderBarAppearanceSection(context, scope, renderChildren = () => '', options = {}) {
  const entity = scope?.type === 'entity';
  const index = scope?.index;
  const field = key => entity
    ? { id: `entity-${index}-bar-${key}`, kind: `entity-bar-${key}`, index }
    : { id: `bar-${key}`, field: `bar-${key}` };
  const palette = options.paintChildren?.() ?? '';
  const paintEditor = renderPaintEditor({
    ...getBarPaintEditorState(context, scope, options.paletteValues, options.paintPresetRegistry),
    id: entity ? `entity-${index}-paint-editor` : 'card-paint-editor', root: options.root,
    resetLabel: entity ? 'Reset to Card paint settings' : 'Reset to default paint settings',
    resetDisabled: !hasLocalBarPaintConfiguration(context, scope),
    fields: { preset: field('paint-preset'), fill_style: field('fill-style'), color: field('color'), solid_fill: field('solid-fill'), opacity: field('opacity'), index },
    cssText: options.cssText,
    ...(palette && typeof palette === 'object' ? { paletteFields: palette } : { paletteContent: palette }),
    paintChildren: palette,
  });
  const direction = renderDirectionControl(context, scope, {
    path: ['bar', 'direction'], ...field('direction'), label: 'Bar Direction',
  });
  const animation = options.animation ? `<div class="field-row"><div class="toggle">
    <input id="${entity ? `entity-${index}-bar-animated` : 'bar-animated'}" type="checkbox" ${entity ? `data-kind="entity-bar-animated" data-index="${index}"` : 'data-field="bar-animated"'}${getBarAnimatedValue(context, scope) ? ' checked' : ''}>
    <label for="${entity ? `entity-${index}-bar-animated` : 'bar-animated'}">Animated</label>
  </div></div>` : '';
  if (entity) return `
    <div class="field-row"><div class="toggle">
      <input id="entity-${index}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${index}"${!hasBarAppearanceOverride(context, scope) ? ' checked' : ''}>
      <label for="entity-${index}-bar-inherit">Inherit card settings</label>
    </div></div>
    ${direction}${animation}${paintEditor}`;
  return `<div class="section">
    <div class="section-head"><h3>${escapeAttribute(options.heading ?? 'Bar Appearance')}</h3>
      <div class="section-note">Configure bar direction, paint, Baseline and Needle.</div>
    </div>
    ${direction}${animation}
    ${paintEditor}${renderChildren()}
  </div>`;
}
