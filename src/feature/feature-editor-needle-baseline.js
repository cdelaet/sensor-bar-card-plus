import { isObject, setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../editor/shared/editor-config.js';
import { normalizeColorComparisonValue } from '../editor/shared/editor-controls.js';

// Only the selected Needle field is owned. Mode changes never touch Baseline.
export function patchFeatureNeedle(config, { field, value }) {
  const path = ['bar', 'needle'];
  const raw = config.bar?.needle;
  if (field === 'mode') {
    const show = value === 'enabled';
    if (raw === undefined && !show) return config;
    return setPathValue(config, isObject(raw) ? [...path, 'show'] : path, show);
  }
  const clear = !value || normalizeColorComparisonValue(value) === normalizeColorComparisonValue('#ffffff');
  if (clear) return pruneEmptyObjectsInTarget(deletePathValue(config, [...path, 'color']), path);
  // Color requires object syntax; retain a boolean's explicit show state.
  const needle = isObject(raw) ? raw : typeof raw === 'boolean' ? { show: raw } : {};
  return setPathValue(config, path, { ...needle, color: value });
}

export function patchFeatureBaselineField(config, { path, value }) {
  const raw = config.baseline;
  if (!isObject(raw) && raw !== undefined && raw !== null) {
    if (value === undefined) return config;
    config = setPathValue(config, ['baseline'], { at: raw });
  }
  const ownedPath = ['baseline', ...path];
  let next = value === undefined ? deletePathValue(config, ownedPath) : setPathValue(config, ownedPath, value);
  if (value === undefined) {
    if (path.length > 1) next = pruneEmptyObjectsInTarget(next, ['baseline', path[0]]);
    next = pruneEmptyObjectsInTarget(next, ['baseline']);
  }
  return next;
}
