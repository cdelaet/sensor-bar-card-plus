import { setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../editor/shared/editor-config.js';
import { canonicalizeHistoricalWindow, isEligibleHistoricalWindow } from '../history/time-window.js';

// Feature edits own a single field; standalone cleanup remains in the section.
export function patchFeatureExtremumField(config, { key, path, value, field }) {
  if (path[0] === 'window') {
    if (!isEligibleHistoricalWindow(value)) return config;
    value = canonicalizeHistoricalWindow(typeof value === 'string' ? value.trim().toLowerCase() : value);
  }
  if ((field === 'text' && !value) || value === null) value = undefined;
  let next = value === undefined ? deletePathValue(config, [key, ...path]) : setPathValue(config, [key, ...path], value);
  if (path[0] === 'enabled' && value === true && config[key]?.window === undefined) {
    next = setPathValue(next, [key, 'window'], 'today');
  }
  if (field === 'precision') next = deletePathValue(next, [key, 'label', 'decimal']);
  if (key === 'peak' && path[0] === 'enabled') {
    next = deletePathValue(next, ['show_peak']);

  }
  if (key === 'peak' && path[0] === 'color') {
    next = deletePathValue(next, ['peak_color']);
  }
  return pruneEmptyObjectsInTarget(next, [key, ...path.slice(0, -1)]);
}
