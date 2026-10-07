import { setPathValue, deletePathValue, removePathsFromTarget, pruneEmptyObjectsInTarget } from '../editor/shared/editor-config.js';
import { promoteFeatureTarget } from './feature-editor-config.js';

// Patch the owned Target field, retaining source/presentation/label metadata.
export function patchFeatureTargetField(config, { path, value, deprecatedKeys = [], field }) {
  if ((field === 'text' && !value) || value === null) value = undefined;
  let next = value === undefined ? config : promoteFeatureTarget(config);
  next = value === undefined ? deletePathValue(next, ['target', ...path]) : setPathValue(next, ['target', ...path], value);
  next = removePathsFromTarget(next, deprecatedKeys);
  if (field === 'show') next = deletePathValue(next, ['show_target_label']);
  if (field === 'precision') next = deletePathValue(next, ['target', 'label', 'decimal']);
  return pruneEmptyObjectsInTarget(next, ['target', ...path.slice(0, -1)]);
}
