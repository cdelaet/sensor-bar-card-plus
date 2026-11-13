import { normalizeBarConfig, PAINT_PROPERTY_SOURCES } from '../../config/normalize.js';
import { resolveScopedPaintPreset } from '../../view-model/paint-preset-resolver.js';
import { createPaintBindings } from './paint-bindings.js';
import { cloneDeep, getPathValue, isObject, removePathsFromTarget, pruneEmptyObjectsInTarget } from './editor-config.js';

const aliases = {
  color: [['bar', 'color'], ['color']],
  fill_style: [['bar', 'fill_style'], ['bar', 'color_mode'], ['color_mode']],
  solid_fill: [['bar', 'solid_fill']],
  segments: [['bar', 'segments'], ['segments'], ['severity']],
  gradient_stops: [['bar', 'gradient_stops'], ['gradient_stops']],
  opacity: [],
  preset: [],
};
const owns = (object, key) => object != null && Object.prototype.hasOwnProperty.call(object, key);
const legacyPaint = config => Object.values(aliases).flat().some(path => getPathValue(config, path) !== undefined);
const legacySolidToggleWrites = new WeakSet();

function isLegacyColorOnlyPaint(config) {
  const bar = config?.bar;
  if (bar?.color === undefined || owns(bar, 'paint') || owns(bar, 'solid_fill')) return false;
  if (['fill_style', 'color_mode', 'segments', 'gradient_stops'].some(key => bar[key] !== undefined)) return false;
  return !['color_mode', 'segments', 'severity', 'gradient_stops'].some(key => config[key] !== undefined);
}

function shouldClearLegacySolidToggle(context, scope) {
  const local = context.read(scope, []) ?? {};
  if (local.bar?.solid_fill !== true || !legacySolidToggleWrites.has(local.bar)) return false;

  // A local false is redundant for this legacy color-only shape, unless it
  // needs to override an inherited true value.
  if (scope?.type !== 'entity') return true;
  const inherited = context.read({ type: 'card' }, []);
  return normalizeBarConfig(inherited, null, { isCardScope: true }).paint.solid_fill !== true;
}

// Ordinary-bar destinations and promotion belong to this adapter, never the
// generic bindings. Existing legacy documents keep their editing convention.
export function usesGroupedBarPaint(context, scope) {
  const local = context.read(scope, []);
  if (owns(local?.bar, 'paint')) return true;
  if (legacyPaint(local)) return false;
  const card = scope?.type === 'entity' ? context.read({ type: 'card' }, []) : null;
  return !card || owns(card.bar, 'paint') || !legacyPaint(card);
}

export function barPaintSource(context, scope, property) {
  const config = context.read(scope, []) ?? {};
  return normalizeBarConfig(config, null).paint[PAINT_PROPERTY_SOURCES][property]?.split('.') ?? null;
}

export function readBarPaintProperty(context, scope, property) {
  if (['segments', 'gradient_stops'].includes(property) && context.paintPresetRegistry) {
    const local = context.read(scope, []) ?? {};
    const inheritedConfig = scope?.type === 'entity' ? context.read({ type: 'card' }, []) : null;
    const normalized = normalizeBarConfig(local, inheritedConfig, {
      isCardScope: scope?.type !== 'entity',
    }).paint;
    const inherited = inheritedConfig
      ? normalizeBarConfig(inheritedConfig, null, { isCardScope: true }).paint
      : normalized;
    if (normalized.preset !== undefined || inherited.preset !== undefined) {
      const resolved = scope?.type === 'entity'
        ? resolveScopedPaintPreset({ inheritedPaint: inherited, paint: normalized, registry: context.paintPresetRegistry })
        : resolveScopedPaintPreset({ inheritedPaint: normalized, paint: {}, registry: context.paintPresetRegistry });
      return cloneDeep(resolved.paint[property]);
    }
  }
  const path = barPaintSource(context, scope, property);
  if (!path) return undefined;
  return property === 'fill_style' ? normalizeBarConfig(context.read(scope, []), null).paint.fill_style : cloneDeep(context.read(scope, path));
}

export function ownsBarPaintProperty(context, scope, property) {
  return owns(context.read(scope, ['bar', 'paint']), property)
    || aliases[property].some(path => context.read(scope, path) !== undefined);
}

export function clearBarPaintProperties(target, properties) {
  const paths = properties.flatMap(key => [['bar', 'paint', key], ...aliases[key]]);
  let next = removePathsFromTarget(target, paths);
  next = pruneEmptyObjectsInTarget(next, ['bar', 'paint']);
  return pruneEmptyObjectsInTarget(next, ['bar']);
}

export function prepareBarPaintSegments(context, scope, rows) {
  const source = barPaintSource(context, scope, 'segments')
    ?? (scope?.type === 'entity' ? barPaintSource(context, { type: 'card' }, 'segments') : null);
  // Severity's numeric coordinates remain percentages after promotion.
  return source?.[0] === 'severity' && Array.isArray(rows) ? rows.map(row => ({ ...row,
    from: typeof row.from === 'number' ? `${row.from}%` : row.from,
    ...(typeof row.to === 'number' ? { to: `${row.to}%` } : {}),
  })) : rows;
}

export function createBarPaintBindings(context, scope, { grouped = usesGroupedBarPaint(context, scope) } = {}) {
  const promote = target => {
    let next = target?.bar === null ? { ...target, bar: {} } : target;
    if (grouped && next?.bar?.paint !== undefined && !isObject(next.bar.paint)) next = { ...next, bar: { ...next.bar, paint: {} } };
    return next;
  };
  const createBinding = (useGrouped, cleanupProperty = null) => {
    const path = useGrouped ? ['bar', 'paint'] : ['bar'];
    return createPaintBindings({
      read: (_scope, at) => getPathValue(promote(context.read(scope, [])), at),
      mutate: (_scope, mutation, options) => {
        const legacyToggleWrite = options?.legacySolidToggleWrite
          && isLegacyColorOnlyPaint(context.read(scope, []));
        const result = context.mutate(scope, target => {
          const edited = mutation(promote(target));
          if (cleanupProperty === null) return edited;
          const stale = useGrouped ? aliases[cleanupProperty] : aliases[cleanupProperty].filter(at => at.join('.') !== `bar.${cleanupProperty}` && at.join('.') !== 'bar.color_mode');
          return removePathsFromTarget(edited, stale);
        }, options);
        if (legacyToggleWrite) {
          const committed = context.read(scope, []);
          if (committed?.bar) legacySolidToggleWrites.add(committed.bar);
        }
        return result;
      },
    }, { scope, path });
  };
  const binding = createBinding(grouped);
  return {
    ...binding,
    read(property) {
      if (property === 'opacity') return cloneDeep(context.read(scope, ['bar', 'paint', 'opacity']));
      return binding.read(property);
    },
    hasOverride(property) {
      if (property === 'opacity') return owns(context.read(scope, ['bar', 'paint']), property);
      return binding.hasOverride(property);
    },
    set(property, value, options = {}) {
      if (property === 'segments') value = prepareBarPaintSegments(context, scope, value);
      if (property === 'solid_fill' && value === false && shouldClearLegacySolidToggle(context, scope)) {
        return createBinding(grouped, property).clear(property, { ...options, preserveRawConfig: true });
      }
      const propertyGrouped = grouped || property === 'opacity';
      return createBinding(propertyGrouped, property).set(property, value, { ...options,
        ...(property === 'solid_fill' && value === true && isLegacyColorOnlyPaint(context.read(scope, [])) ? { legacySolidToggleWrite: true } : {}),
        ...(propertyGrouped || value === false || property === 'color' && String(value).toLowerCase() === '#4a9eff' ? { preserveRawConfig: true } : {}) });
    },
    clear(property, options = {}) {
      const propertyGrouped = grouped || property === 'opacity';
      return context.mutate(scope, target => propertyGrouped ? clearBarPaintProperties(target, [property])
        : pruneEmptyObjectsInTarget(removePathsFromTarget(target, aliases[property].filter(at => at.join('.') !== 'bar.color_mode')), ['bar']), { ...options, ...(propertyGrouped ? { preserveRawConfig: true } : {}) });
    },
  };
}
