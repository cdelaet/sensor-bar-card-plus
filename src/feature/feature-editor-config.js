import { looksLikeEntityId, normalizeStructuredResolvableValue, parsePercentLiteral } from '../config/normalize.js';
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

// One raw source-component patcher for Scale, Baseline and Target. Display normalization
// never becomes the persisted object; untouched source parts/metadata stay raw.
function patchSource(config, base, bound, part, value, empty, allowPercent = false) {
  const patch = (target, path) => empty ? deletePathValue(target, path) : setPathValue(target, path, value);
  if (isObject(bound)) {
    if (part === 'fixed' && empty) return deletePathValue(deletePathValue(config, [...base, 'fixed']), [...base, 'value']);
    const storedPart = part === 'fixed' && bound.fixed === undefined && bound.value !== undefined ? 'value' : part;
    return patch(config, [...base, storedPart]);
  }
  if (bound !== undefined && bound !== null) {
    const percent = allowPercent ? parsePercentLiteral(bound) : null;
    const storedPart = looksLikeEntityId(bound) ? 'entity' : Number.isFinite(percent) ? 'percent' : 'fixed';
    if (part === storedPart) return patch(config, base);
    if (empty) return config;
    return setPathValue(config, base, { [storedPart]: storedPart === 'percent' ? percent : bound, [part]: value });
  }
  return empty ? config : setPathValue(config, [...base, part], value);
}

export function patchFeatureScaleSource(config, key, part, rawValue) {
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const bound = config.scale?.[key];
  if (bound === undefined && (config[key] !== undefined || config[`${key}_entity`] !== undefined)) {
    const path = [part === 'fixed' ? key : `${key}_entity`];
    return empty ? deletePathValue(config, path) : setPathValue(config, path, value);
  }
  return patchSource(config, ['scale', key], bound, part, value, empty);
}

export function getFeatureBaselineSource(config) {
  const raw = config.baseline;
  if (!isObject(raw)) return { fixed: raw ?? '', entity: '' };
  const source = normalizeStructuredResolvableValue(raw.at, null, null, { allowPercent: true });
  return { fixed: source.fixed ?? '', entity: source.entity ?? '', ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
}

export function patchFeatureBaselineSource(config, part, rawValue) {
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const raw = config.baseline;
  if (!isObject(raw) && raw !== undefined && raw !== null) {
    // A legacy numeric baseline stays scalar for edits of that scalar. Adding
    // another part requires baseline.at, while retaining the original source.
    if (part === 'fixed') return empty ? deletePathValue(config, ['baseline']) : setPathValue(config, ['baseline'], value);
    if (empty) return config;
    config = setPathValue(config, ['baseline'], { at: raw });
  }
  return patchSource(config, ['baseline', 'at'], config.baseline?.at, part, value, empty, true);
}

export function getFeatureTargetSource(config) {
  const raw = config.target;
  if (isObject(raw) && raw.at !== undefined) {
    const source = normalizeStructuredResolvableValue(raw.at, null, null, { allowPercent: true });
    return { fixed: source.fixed ?? '', entity: source.entity ?? '', ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
  }
  return { fixed: isObject(raw) ? '' : raw ?? '', entity: config.target_entity ?? '' };
}

// Adding Target fields requires object syntax. Retain legacy source components
// so promotion does not lose the source that the runtime previously resolved.
export function promoteFeatureTarget(config) {
  if (isObject(config.target)) return config;
  const raw = config.target, entity = config.target_entity;
  const at = entity !== undefined ? { ...(raw !== undefined && raw !== null ? { fixed: raw } : {}), entity } : raw;
  return setPathValue(config, ['target'], at === undefined || at === null ? {} : { at });
}

export function patchFeatureTargetSource(config, part, rawValue) {
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const raw = config.target;
  if ((!isObject(raw) || raw.at === undefined) && (raw !== undefined && !isObject(raw) || config.target_entity !== undefined)) {
    if (part === 'entity') return empty ? deletePathValue(config, ['target_entity']) : setPathValue(config, ['target_entity'], value);
    if (!isObject(raw)) return empty ? deletePathValue(config, ['target']) : setPathValue(config, ['target'], value);
    if (empty) return config;
    // The legacy entity and newly configured fallback must resolve together.
    return setPathValue(config, ['target', 'at'], { entity: config.target_entity, fixed: value });
  }
  let next = patchSource(config, ['target', 'at'], raw?.at, part, value, empty, true);
  if (part === 'entity') next = deletePathValue(next, ['target_entity']);
  return next;
}
