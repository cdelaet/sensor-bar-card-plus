import { normalizeBarConfig, PAINT_PROPERTY_SOURCES } from '../../config/normalize.js';
import { createPaintBindings } from './paint-bindings.js';
import { cloneDeep, getPathValue, isObject, removePathsFromTarget, pruneEmptyObjectsInTarget } from './editor-config.js';

const aliases = {
  color: [['bar', 'color'], ['color']],
  fill_style: [['bar', 'fill_style'], ['bar', 'color_mode'], ['color_mode']],
  solid_fill: [['bar', 'solid_fill']],
  segments: [['bar', 'segments'], ['segments'], ['severity']],
  gradient_stops: [['bar', 'gradient_stops'], ['gradient_stops']],
};
const owns = (object, key) => object != null && Object.prototype.hasOwnProperty.call(object, key);
const legacyPaint = config => Object.values(aliases).flat().some(path => getPathValue(config, path) !== undefined);

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
  const path = grouped ? ['bar', 'paint'] : ['bar'];
  const binding = createPaintBindings({
    read: (_scope, at) => getPathValue(promote(context.read(scope, [])), at),
    mutate: (_scope, mutation, options) => context.mutate(scope, target => mutation(promote(target)), options),
  }, { scope, path });
  return {
    ...binding,
    set(property, value, options = {}) {
      if (property === 'segments') value = prepareBarPaintSegments(context, scope, value);
      const adapter = createPaintBindings({
        read: (_scope, at) => getPathValue(promote(context.read(scope, [])), at),
        mutate: (_scope, mutation, opts) => context.mutate(scope, target => {
          const edited = mutation(promote(target));
          const stale = grouped ? aliases[property] : aliases[property].filter(at => at.join('.') !== `bar.${property}` && at.join('.') !== 'bar.color_mode');
          return removePathsFromTarget(edited, stale);
        }, opts),
      }, { scope, path });
      return adapter.set(property, value, { ...options, ...(grouped || value === false || property === 'color' && String(value).toLowerCase() === '#4a9eff' ? { preserveRawConfig: true } : {}) });
    },
    clear(property, options = {}) {
      return context.mutate(scope, target => grouped ? clearBarPaintProperties(target, [property])
        : pruneEmptyObjectsInTarget(removePathsFromTarget(target, aliases[property].filter(at => at.join('.') !== 'bar.color_mode')), ['bar']), { ...options, ...(grouped ? { preserveRawConfig: true } : {}) });
    },
  };
}
