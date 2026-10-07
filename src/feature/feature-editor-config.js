import { looksLikeEntityId, normalizeStructuredResolvableValue } from '../config/normalize.js';
import {
  isObject, normalizeNumberValue, normalizeTextValue, setPathValue, deletePathValue,
} from '../editor/shared/editor-config.js';

// Display resolution only. Neither defaults nor normalized config are persisted.
export function getFeatureScaleSource(config, key) {
  const bound = config.scale?.[key];
  if (bound !== undefined) {
    const source = normalizeStructuredResolvableValue(bound);
    return { fixed: source.fixed ?? '', entity: source.entity ?? '' };
  }
  return { fixed: config[key] ?? '', entity: config[`${key}_entity`] ?? '' };
}

export function patchFeatureScaleSource(config, key, part, rawValue) {
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const base = ['scale', key];
  const bound = config.scale?.[key];
  const patch = (target, path) => empty ? deletePathValue(target, path) : setPathValue(target, path, value);

  if (isObject(bound)) {
    // A fixed control owns fixed/value aliases, but never the entity or metadata.
    if (part === 'fixed' && empty) {
      return deletePathValue(deletePathValue(config, [...base, 'fixed']), [...base, 'value']);
    }
    const storedPart = part === 'fixed' && bound.fixed === undefined && bound.value !== undefined ? 'value' : part;
    return patch(config, [...base, storedPart]);
  }

  if (bound !== undefined && bound !== null) {
    const storedPart = looksLikeEntityId(bound) ? 'entity' : 'fixed';
    // Retain scalar syntax when the edited control owns that scalar.
    if (part === storedPart) return patch(config, base);
    if (empty) return config;
    return setPathValue(config, base, { [storedPart]: bound, [part]: value });
  }

  if (bound === undefined && (config[key] !== undefined || config[`${key}_entity`] !== undefined)) {
    // Keep legacy source syntax and the other source part untouched.
    return patch(config, [part === 'fixed' ? key : `${key}_entity`]);
  }
  return empty ? config : setPathValue(config, [...base, part], value);
}
