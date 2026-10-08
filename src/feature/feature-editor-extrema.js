import { isObject, setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../editor/shared/editor-config.js';
import { isValidReset } from '../utils/extrema.js';

// Feature edits own a single field; standalone cleanup remains in the section.
export function patchFeatureExtremumField(config, { key, path, value, field }) {
  if (path[0] === 'reset' && value && !isValidReset(value)) return config;
  if ((field === 'text' && !value) || value === null || (path[0] === 'reset' && !value)) value = undefined;
  let next = value === undefined ? deletePathValue(config, [key, ...path]) : setPathValue(config, [key, ...path], value);
  if (field === 'precision') next = deletePathValue(next, [key, 'label', 'decimal']);
  if (key === 'peak' && path[0] === 'enabled') {
    next = deletePathValue(next, ['show_peak']);
    // The legacy editor reader treats an existing peak_marker without show as
    // disabled. Synchronize only that alias, keeping its other fields intact.
    if (isObject(config.peak_marker)) next = setPathValue(next, ['peak_marker', 'show'], value);
  }
  if (key === 'peak' && path[0] === 'color') {
    next = deletePathValue(next, ['peak_color']);
    next = deletePathValue(next, ['peak_marker', 'color']);
    next = pruneEmptyObjectsInTarget(next, ['peak_marker']);
  }
  return pruneEmptyObjectsInTarget(next, [key, ...path.slice(0, -1)]);
}
