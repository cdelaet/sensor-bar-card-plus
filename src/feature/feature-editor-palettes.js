import { barPaintSource, readBarPaintProperty, usesGroupedBarPaint } from '../editor/shared/bar-paint-bindings.js';
import { cloneDeep, getPathValue, setPathValue, isObject } from '../editor/shared/editor-config.js';
import { BAR_PAINT } from '../view-model/paint-destinations.js';
import { createDestinationBindings, getDestinationEditorState } from '../editor/shared/paint-destination.js';

// Resolve the authoritative raw palette without normalizing or deleting aliases.
function palettePath(context, config, kind, destination) {
  if (destination !== BAR_PAINT) return [...destination.path, kind];
  const source = barPaintSource(context, { type: 'card' }, kind);
  if (source) return source;
  if (Object.prototype.hasOwnProperty.call(config.bar ?? {}, 'paint')) return null;
  const paths = [['bar', kind], [kind], ...(kind === 'segments' ? [['severity']] : [])];
  return paths.find(path => getPathValue(config, path) !== undefined) ?? paths[0];
}
function displayBoundary(value) {
  if (!isObject(value)) return value;
  if (Number.isFinite(value.percent)) return `${value.percent}%`;
  return value.fixed ?? value.value;
}

export function createFeaturePaletteArray(context, kind, destination = BAR_PAINT) {
  let section;
  const rawRows = () => {
    const config = context.read({ type: 'card' }, []);
    const path = palettePath(context, config, kind, destination);
    const stored = path ? getPathValue(config, path) : undefined;
    if (stored !== undefined) return Array.isArray(stored) ? stored : [];
    const resolved = destination === BAR_PAINT ? readBarPaintProperty(context, { type: 'card' }, kind)
      : getDestinationEditorState(context, { type: 'card' }, destination).paint[kind];
    if (Array.isArray(resolved)) return resolved;
    return kind === 'segments' ? section._getFallbackSegments({ type: 'card' }) : section._getDefaultGradientStops();
  };
  return {
    destination,
    patchOnly: true,
    autoEnds: kind === 'segments',
    segmentSpace: () => {
      const config = context.read({ type: 'card' }, []);
      const path = palettePath(context, config, kind, destination);
      if (destination !== BAR_PAINT) return null;
      return path?.[0] === 'severity' ? 'percent' : path?.[0] === 'bar' ? config.bar?.segment_space ?? null : null;
    },
    rows(_scope, controller) {
      section = controller;
      // Display normalization is intentionally separate from persistence.
      return rawRows().map(row => kind === 'segments'
        ? { ...row, from: displayBoundary(row?.from), to: displayBoundary(row?.to) }
        : { ...row, pos: controller._normalizeGradientStopPosValue(row?.pos) ?? row?.pos });
    },
    write(scope, _displayRows, _options, operation) {
      if (!operation) throw new Error('Feature palette writes require an explicit item operation');
      const config = context.read(scope, []);
      const grouped = destination !== BAR_PAINT || usesGroupedBarPaint(context, scope);
      const path = palettePath(context, config, kind, destination);
      const rows = [...rawRows()];
      if (operation.type === 'edit') {
        if (operation.index < 0 || operation.index >= rows.length) return false;
        const row = { ...rows[operation.index], [operation.field]: operation.value };
        if (operation.value === undefined) delete row[operation.field];
        rows[operation.index] = row;
      } else if (operation.type === 'add') rows.splice(operation.index ?? rows.length, 0, cloneDeep(operation.item));
      else if (operation.type === 'remove') rows.splice(operation.index, 1);
      else throw new Error('Unsupported palette operation');
      const applied = grouped ? createDestinationBindings(context, scope, destination).set(kind, rows)
        : context.mutate(scope, target => setPathValue(target, path ?? ['bar', kind], rows));
      if (applied !== false && operation.type !== 'edit') {
        if (kind === 'segments') section._clearSegmentScopeTextState(scope);
        else section._clearGradientStopScopeTextState(scope);
      }
      return applied;
    },
  };
}
