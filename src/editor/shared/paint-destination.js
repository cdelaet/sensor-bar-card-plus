import { PAINT_PROPERTIES } from '../../config/paint-defaults.js';
import { normalizeScaleConfig, INVALID_PAINT_OPACITY, PAINT_PROPERTY_SOURCES } from '../../config/normalize.js';
import { getResolvedScale } from '../../config/resolve.js';
import { BAR_PAINT, BASELINE_PAINTS, resolveConfiguredDestination, resolveDestinationPaint } from '../../view-model/paint-destinations.js';
import { createPaintBindings } from './paint-bindings.js';
import { createBarPaintBindings, ownsBarPaintProperty, clearBarPaintProperties } from './bar-paint-bindings.js';
import { cloneDeep, getPathValue, setPathValue, deletePathValue, isObject, removePathsFromTarget, pruneEmptyObjectsInTarget, serializeConfig, normalizeNumberValue } from './editor-config.js';
import { resolvePaintEditorPaint } from './paint-editor-paint.js';
import { getPaintPreviewScale } from './paint-swatch.js';
import { normalizeEditorColorValue } from './editor-controls.js';

const owns = (object, property) => Object.prototype.hasOwnProperty.call(object ?? {}, property);

export function paintSourceSignature(config, destination) {
  const paint = getPathValue(config, destination.path);
  return serializeConfig([paint === null, paint === undefined, paint?.fill_style, paint?.preset,
    ...(destination.aliases.fill_style ?? []).map(path => getPathValue(config, path))]);
}

// Destination adapters declare shorthand promotion; transactions never discard
// a source or sibling while creating a nested Paint object.
function promote(target, destination) {
  let next = target;
  for (const { path, property } of destination.shorthands ?? []) {
    const value = getPathValue(next, path);
    if (value != null && !isObject(value)) next = setPathValue(next, path, { [property]: value });
  }
  return next;
}

export function ownsDestinationProperty(context, scope, destination, property) {
  if (destination === BAR_PAINT) return ownsBarPaintProperty(context, scope, property);
  const config = promote(context.read(scope, []) ?? {}, destination);
  return owns(getPathValue(config, destination.path), property)
    || (destination.aliases[property] ?? []).some(path => getPathValue(config, path) !== undefined);
}

export function hasDestinationConfiguration(context, scope, destination) {
  return context.read(scope, destination.path) !== undefined
    || ['preset', ...PAINT_PROPERTIES].some(property => ownsDestinationProperty(context, scope, destination, property));
}

export function clearDestinationConfiguration(target, destination) {
  if (destination === BAR_PAINT) return pruneEmptyObjectsInTarget(
    deletePathValue(clearBarPaintProperties(target, ['preset', ...PAINT_PROPERTIES]), destination.path), ['bar']);
  let next = removePathsFromTarget(promote(target, destination),
    [destination.path, ...Object.values(destination.aliases).flat()]);
  for (let length = destination.path.length - 1; length > 0; length--) {
    next = pruneEmptyObjectsInTarget(next, destination.path.slice(0, length));
  }
  return next;
}

export function createDestinationBindings(context, scope, destination = BAR_PAINT, options = {}) {
  if (destination === BAR_PAINT) return createBarPaintBindings(context, scope, options);
  const promoted = target => {
    let next = promote(target, destination);
    if (getPathValue(next, destination.path) === null) next = setPathValue(next, destination.path, {});
    return next;
  };
  const binding = createPaintBindings({
    read: (_scope, path) => getPathValue(promoted(context.read(scope, [])), path),
    mutate: (_scope, mutation, mutationOptions) => context.mutate(scope,
      target => mutation(promoted(target)), { preserveRawConfig: true, ...mutationOptions }),
  }, { scope, path: destination.path });
  return {
    ...binding,
    hasOverride: property => ownsDestinationProperty(context, scope, destination, property),
    set(property, value, mutationOptions) {
      return context.mutate(scope, target => {
        const next = setPathValue(promoted(target), [...destination.path, property], cloneDeep(value));
        return removePathsFromTarget(next, destination.aliases[property] ?? []);
      }, { preserveRawConfig: true, ...mutationOptions });
    },
    clear(property, mutationOptions) {
      if (!ownsDestinationProperty(context, scope, destination, property)) return false;
      return context.mutate(scope, target => {
        const next = removePathsFromTarget(promoted(target),
          [[...destination.path, property], ...(destination.aliases[property] ?? [])]);
        // Clearing a property preserves explicit activation. Only Reset removes it.
        return getPathValue(next, destination.path) === undefined ? setPathValue(next, destination.path, {}) : next;
      }, { preserveRawConfig: true, ...mutationOptions });
    },
  };
}

export function getDestinationEditorState(context, scope, destination = BAR_PAINT, paletteValues, registry = context.paintPresetRegistry) {
  const local = context.read(scope, []) ?? {};
  const parent = scope?.type === 'entity' ? context.read({ type: 'card' }, []) : null;
  const resolved = resolveConfiguredDestination(local, parent, destination, registry);
  const bindings = createDestinationBindings(context, scope, destination);
  const configured = hasDestinationConfiguration(context, scope, destination);
  const enabled = resolved.paint != null;
  // Disabled overlays still have an editor and Reset action; preview the same
  // defaults/inheritance that enabling them would use, without authoring it.
  const display = enabled ? resolved.paint : resolveConfiguredDestination(
    setPathValue(promote(local, destination), destination.path, {}), parent, destination, registry).paint;
  const paint = resolvePaintEditorPaint(display, paletteValues);
  const ownPreset = context.read(scope, [...destination.path, 'preset']);
  const inheritedPreset = parent ? getPathValue(parent, [...destination.path, 'preset']) : undefined;
  const presetReference = ownPreset !== undefined ? ownPreset : inheritedPreset;
  const presetOptions = Object.keys(registry?.presets ?? {}).filter(name => name.trim()).map(name => ({ value: name, label: name }));
  if (presetReference !== undefined && !presetOptions.some(option => option.value === String(presetReference))) {
    presetOptions.push({ value: String(presetReference ?? ''), label: `${String(presetReference || '(empty name)')} (unavailable)` });
  }
  const presetFailed = resolved.diagnostics.some(item => item.reference === presetReference && item.code !== 'paint_opacity_invalid');
  const preset = registry?.status === 'ready' && !presetFailed ? registry?.presets?.[presetReference] : null;
  const parentResolved = resolveDestinationPaint(resolved.inheritedPaint, null, registry);
  const parentPresetValid = registry?.status === 'ready'
    && !parentResolved.diagnostics.some(item => item.code !== 'paint_opacity_invalid');
  const parentPreset = parentPresetValid ? registry?.presets?.[inheritedPreset] : null;
  const authored = Object.fromEntries(PAINT_PROPERTIES.map(property => [property, ownsDestinationProperty(context, scope, destination, property)]));
  const sources = Object.fromEntries(PAINT_PROPERTIES.map(property => {
    const inherited = resolved.inheritedPaint != null
      && (owns(resolved.inheritedPaint[PAINT_PROPERTY_SOURCES], property) || owns(parentPreset, property));
    const fromPreset = owns(preset, property) && (!parent || ownPreset !== undefined);
    const invalidOpacity = property === 'opacity' && owns(resolved.normalized, INVALID_PAINT_OPACITY);
    const local = authored[property] && owns(resolved.normalized?.[PAINT_PROPERTY_SOURCES], property);
    return [property, invalidOpacity ? 'Default' : local ? (inherited || fromPreset ? 'Override' : 'Local')
      : fromPreset ? 'Preset' : inherited ? 'Inherited' : 'Default'];
  }));
  const scaleConfig = normalizeScaleConfig(local, parent);
  const { min, max } = getResolvedScale(context.hass, scaleConfig);
  const scale = { minValue: min, maxValue: max, scaleDirection: scaleConfig.direction };
  const diagnostics = [...resolved.diagnostics];
  if (owns(resolved.normalized, INVALID_PAINT_OPACITY)) diagnostics.push({
    code: 'paint_opacity_invalid', severity: 'warning', path: 'paint.opacity', reference: null, fallback: 'default_opacity',
  });
  return { bindings, paint, enabled, destination: destination.id, inherited: !!parent && !configured, resetDisabled: !configured,
    presetReference, presetOptions, overrides: authored, sources, diagnostics,
    registryStatus: registry?.status ?? 'loading', scale, previewScale: getPaintPreviewScale(paint, scale) };
}

export function setDestinationEnabled(context, scope, destination, enabled) {
  context.clearPaintPaletteState?.(scope, destination);
  return context.mutate(scope, target => setPathValue(clearDestinationConfiguration(target, destination), destination.path, enabled ? {} : null),
    { preserveRawConfig: true });
}

export function resetDestinationPaint(context, scope, destination = BAR_PAINT) {
  if (!hasDestinationConfiguration(context, scope, destination)) return false;
  context.clearPaintPaletteState?.(scope, destination);
  return context.mutate(scope, target => clearDestinationConfiguration(target, destination),
    { preserveRawConfig: true, rerender: true });
}

export function clearDestinationProperty(context, scope, destination, property) {
  if (!['preset', ...PAINT_PROPERTIES].includes(property)) return false;
  if (['segments', 'gradient_stops'].includes(property)) context.clearPaintPaletteState?.(scope, destination, property);
  return createDestinationBindings(context, scope, destination,
    property === 'preset' ? { grouped: true } : {}).clear(property, { preserveRawConfig: true });
}

export function setDestinationProperty(context, scope, destination, property, rawValue, options = {}) {
  if (!PAINT_PROPERTIES.includes(property)) return false;
  let value = rawValue;
  if (property === 'color') value = normalizeEditorColorValue(rawValue, options.cssText) || undefined;
  if (property === 'fill_style') value = String(rawValue ?? '').trim() || undefined;
  if (property === 'solid_fill') value = !!rawValue;
  if (property === 'opacity') {
    value = rawValue === '' || rawValue == null ? undefined : normalizeNumberValue(rawValue);
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) return false;
  }
  return value === undefined ? clearDestinationProperty(context, scope, destination, property)
    : createDestinationBindings(context, scope, destination).set(property, value);
}

export function selectDestinationPreset(context, scope, destination, value, { confirm } = {}) {
  const state = getDestinationEditorState(context, scope, destination);
  if (value === '') return createDestinationBindings(context, scope, destination, { grouped: true })
    .clear('preset', { preserveRawConfig: true, rerender: true });
  if (value === state.presetReference) return true;
  const rawPaint = context.read(scope, destination.path);
  const hasProperties = isObject(rawPaint) ? Object.keys(rawPaint).some(key => key !== 'preset') : rawPaint != null;
  if ((hasProperties || PAINT_PROPERTIES.some(property => ownsDestinationProperty(context, scope, destination, property))) && confirm?.(value) !== true) return false;
  context.clearPaintPaletteState?.(scope, destination);
  return context.mutate(scope, target => setPathValue(clearDestinationConfiguration(target, destination),
    destination.path, { preset: value }), { preserveRawConfig: true, rerender: true });
}

function controlDestination(target) {
  const id = target?.closest?.('.paint-editor')?.dataset?.paintDestination;
  return [BAR_PAINT, ...BASELINE_PAINTS].find(destination => destination.id === id)
    ?? BASELINE_PAINTS.find(destination => (target?.dataset?.field ?? target?.dataset?.kind)?.includes(`${destination.id}-paint-`))
    ?? BAR_PAINT;
}

export function handlePaintPresetControl(context, target, value) {
  const field = target?.dataset?.field ?? target?.dataset?.kind;
  if (!field?.endsWith('paint-preset')) return false;
  const destination = controlDestination(target);
  const scope = target.dataset.index === undefined ? { type: 'card' } : { type: 'entity', index: Number(target.dataset.index) };
  const current = getDestinationEditorState(context, scope, destination).presetReference;
  const window = target.ownerDocument?.defaultView;
  const applied = selectDestinationPreset(context, scope, destination, value, {
    confirm: name => window?.confirm?.(`Applying paint preset “${name}” replaces local paint properties. Continue?`) === true,
  });
  if (applied === false) target.value = current == null ? '' : String(current);
  return true;
}

export function handlePaintPropertyControl(context, target, value, options = {}) {
  const property = target?.dataset?.paintProperty;
  const activation = target?.dataset?.paintEnabled === 'true';
  if (!property && !activation) return false;
  const destination = controlDestination(target);
  const scope = target.dataset.index === undefined ? { type: 'card' } : { type: 'entity', index: Number(target.dataset.index) };
  if (activation) setDestinationEnabled(context, scope, destination, !!value);
  else setDestinationProperty(context, scope, destination, property, value, options);
  return true;
}

export function handlePaintAction(context, target) {
  const action = target?.dataset?.action;
  if (!['reset-paint', 'clear-paint-property'].includes(action)) return false;
  if (target.disabled) return true;
  const destination = controlDestination(target);
  const scope = target.dataset.index === undefined ? { type: 'card' } : { type: 'entity', index: Number(target.dataset.index) };
  if (action === 'clear-paint-property') {
    clearDestinationProperty(context, scope, destination, target.dataset.property);
  } else if (hasDestinationConfiguration(context, scope, destination)) {
    const message = scope.type === 'entity' ? 'Reset this Entity to Card paint?' : 'Reset paint to its default?';
    if (target.ownerDocument?.defaultView?.confirm?.(message) === true) resetDestinationPaint(context, scope, destination);
  }
  return true;
}
