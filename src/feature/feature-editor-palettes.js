import { cloneDeep, getPathValue, setPathValue, isObject } from '../editor/shared/editor-config.js';

// Resolve the authoritative raw palette without normalizing or deleting aliases.
function palettePath(config, kind) {
  const paths = [['bar', kind], [kind], ...(kind === 'segments' ? [['severity']] : [])];
  return paths.find(path => getPathValue(config, path) !== undefined) ?? paths[0];
}
function displayBoundary(value) {
  if (!isObject(value)) return value;
  if (Number.isFinite(value.percent)) return `${value.percent}%`;
  return value.fixed ?? value.value;
}

export function createFeaturePaletteArray(context, kind) {
  let section;
  const rawRows = () => {
    const config = context.read({ type: 'card' }, []);
    const stored = getPathValue(config, palettePath(config, kind));
    if (stored !== undefined) return Array.isArray(stored) ? stored : [];
    return kind === 'segments' ? section._getFallbackSegments({ type: 'card' }) : section._getDefaultGradientStops();
  };
  return {
    patchOnly: true,
    autoEnds: kind === 'segments',
    cssText: kind === 'segments',
    segmentSpace: () => {
      const config = context.read({ type: 'card' }, []);
      const path = palettePath(config, kind);
      return path[0] === 'severity' ? 'percent' : path[0] === 'bar' ? config.bar?.segment_space ?? null : null;
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
      const applied = context.mutate(scope, config => {
        const path = palettePath(config, kind);
        const rows = [...rawRows()];
        if (operation.type === 'edit') {
          if (operation.index < 0 || operation.index >= rows.length) return config;
          const row = { ...rows[operation.index], [operation.field]: operation.value };
          if (operation.value === undefined) delete row[operation.field];
          rows[operation.index] = row;
        } else if (operation.type === 'add') rows.push(cloneDeep(operation.item));
        else if (operation.type === 'remove') rows.splice(operation.index, 1);
        else throw new Error('Unsupported palette operation');
        return setPathValue(config, path, rows);
      });
      if (applied !== false && operation.type !== 'edit') {
        if (kind === 'segments') section._clearSegmentScopeTextState(scope);
        else section._clearGradientStopScopeTextState(scope);
      }
      return applied;
    },
  };
}
