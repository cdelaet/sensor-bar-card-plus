import { looksLikeEntityId, normalizeStructuredResolvableValue, parsePercentLiteral } from '../config/normalize.js';
import {
  isObject, normalizeNumberValue, normalizeTextValue, setPathValue, deletePathValue,
} from '../editor/shared/editor-config.js';
import { normalizeScalePercentageInput } from '../editor/shared/editor-controls.js';
import { readResolvableSourceParts, updateResolvableSourceParts, writeResolvableSourceParts } from '../editor/shared/resolvable-source.js';

// Display resolution only. Neither defaults nor normalized config are persisted.
export function getFeatureScaleSource(config, key) {
  const bound = config.scale?.[key];
  if (bound !== undefined) {
    const source = normalizeStructuredResolvableValue(bound);
    return { fixed: source.fixed ?? '', entity: source.entity ?? '', ...(source.attribute ? { attribute: source.attribute } : {}) };
  }
  return { fixed: config[key] ?? '', entity: config[`${key}_entity`] ?? '' };
}

// One raw source-component patcher for Scale, Baseline and Target. Display normalization
// never becomes the persisted object; untouched source parts/metadata stay raw.
export function patchSource(config, base, bound, part, value, empty, allowPercent = false) {
  const patch = (target, path) => empty ? deletePathValue(target, path) : setPathValue(target, path, value);
  if (typeof bound === 'string' && looksLikeEntityId(bound) && part === 'entity') {
    const update = updateResolvableSourceParts(readResolvableSourceParts(bound), part, empty ? '' : value);
    if (!update.valid) return config;
    return empty ? deletePathValue(config, base) : setPathValue(config, base, update.parts.entity);
  }
  // Scale retains its established source ownership and alias behavior. The
  // shared marker-source operations are used for Target and Baseline, where
  // direct fixed/percentage Value editing is supported.
  if (!allowPercent) {
    if (part === 'entity' || part === 'attribute') {
      const source = normalizeStructuredResolvableValue(bound, null, null, { allowPercent: false });
      const entity = part === 'entity' ? (empty ? '' : value) : source.entity ?? '';
      const attribute = part === 'attribute' ? (empty ? '' : value) : source.attribute ?? '';
      if (part === 'entity' && empty) {
        if (isObject(bound)) return deletePathValue(deletePathValue(config, [...base, 'entity']), [...base, 'attribute']);
        return config;
      }
      const entityValue = entity ? (attribute ? { id: entity, attribute } : entity) : undefined;
      if (isObject(bound)) {
        let next = deletePathValue(config, [...base, 'attribute']);
        if (entityValue === undefined) next = deletePathValue(next, [...base, 'entity']);
        else next = setPathValue(next, [...base, 'entity'], entityValue);
        return next;
      }
      const nextBound = {};
      if (source.fixed !== null && source.fixed !== undefined) nextBound.fixed = source.fixed;
      if (entityValue !== undefined) nextBound.entity = entityValue;
      if (Number.isFinite(source.percent)) nextBound.percent = source.percent;
      return Object.keys(nextBound).length ? setPathValue(config, base, nextBound) : config;
    }
    if (isObject(bound)) {
      if (part === 'fixed' && empty) return deletePathValue(deletePathValue(config, [...base, 'fixed']), [...base, 'value']);
      const storedPart = part === 'fixed' && bound.fixed === undefined && bound.value !== undefined ? 'value' : part;
      return patch(config, [...base, storedPart]);
    }
    if (bound !== undefined && bound !== null) {
      const storedPart = looksLikeEntityId(bound) ? 'entity' : 'fixed';
      if (part === storedPart) return patch(config, base);
      if (empty) return config;
      return setPathValue(config, base, { [storedPart]: bound, [part]: value });
    }
    if (empty) return config;
    if (part === 'fixed') return setPathValue(config, [...base, 'fixed'], value);
    return setPathValue(config, base, { entity: part === 'attribute' ? { id: '', attribute: value } : value });
  }
  if (isObject(bound)) {
    const update = updateResolvableSourceParts(readResolvableSourceParts(bound), part, empty ? '' : value);
    if (!update.valid) return config;
    const nextBound = writeResolvableSourceParts(update.parts);
    if (bound.fixed === undefined && bound.value !== undefined && nextBound.fixed !== undefined) {
      nextBound.value = nextBound.fixed;
      delete nextBound.fixed;
    }
    let next = deletePathValue(config, base);
    return Object.keys(nextBound).length ? setPathValue(next, base, nextBound) : next;
  }
  if (part === 'entity' || part === 'attribute') {
    const update = updateResolvableSourceParts(readResolvableSourceParts(bound), part, empty ? '' : value);
    if (!update.valid) return config;
    const nextBound = writeResolvableSourceParts(update.parts);
    if (!Object.keys(nextBound).length) return deletePathValue(config, base);
    return setPathValue(config, base, nextBound);
  }
  if (bound !== undefined && bound !== null) {
    const percent = allowPercent ? parsePercentLiteral(bound) : null;
    const storedPart = looksLikeEntityId(bound) ? 'entity' : Number.isFinite(percent) ? 'percent' : 'fixed';
    if (part === storedPart) return patch(config, base);
    if (empty) return config;
    return setPathValue(config, base, { [storedPart]: storedPart === 'percent' ? percent : bound, [part]: value });
  }
  if (empty) return config;
  if (part === 'fixed') return setPathValue(config, [...base, 'fixed'], value);
  return setPathValue(config, base, { entity: part === 'attribute' ? { id: '', attribute: value } : value });
}

export function patchFeatureScaleSource(config, key, part, rawValue) {
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const bound = config.scale?.[key];
  if (bound === undefined && (config[key] !== undefined || config[`${key}_entity`] !== undefined)) {
    if (part === 'attribute') {
      if (empty) return config;
      const source = {};
      if (config[key] !== undefined) source.fixed = config[key];
      if (config[`${key}_entity`] !== undefined) {
        source.entity = { id: config[`${key}_entity`], attribute: value };
      }
      config = deletePathValue(config, [key]);
      config = deletePathValue(config, [`${key}_entity`]);
      return setPathValue(config, ['scale', key], source);
    }
    const path = [part === 'fixed' ? key : `${key}_entity`];
    return empty ? deletePathValue(config, path) : setPathValue(config, path, value);
  }
  return patchSource(config, ['scale', key], bound, part, value, empty);
}

export function getFeatureBaselineSource(config) {
  const raw = config.baseline;
  if (!isObject(raw)) {
    const source = readResolvableSourceParts(raw);
    return { fixed: source.fixed ?? '', entity: '', ...(source.attribute ? { attribute: source.attribute } : {}), ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
  }
  const source = readResolvableSourceParts(raw.at);
  return { fixed: source.fixed ?? '', entity: source.entity ?? '', ...(source.attribute ? { attribute: source.attribute } : {}), ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
}

export function patchFeatureBaselineSource(config, part, rawValue) {
  if (part === 'value') return patchFeatureResolvableValue(config, 'baseline', rawValue);
  if (part === 'mode') return patchFeatureMarkerSourceMode(config, 'baseline', rawValue);
  if (part === 'percent') return patchFeatureMarkerPercentage(config, 'baseline', rawValue);
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
    const source = readResolvableSourceParts(raw.at);
    return { fixed: source.fixed ?? '', entity: source.entity ?? '', ...(source.attribute ? { attribute: source.attribute } : {}), ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
  }
  const source = readResolvableSourceParts(isObject(raw) ? undefined : raw);
  return { fixed: source.fixed ?? '', entity: config.target_entity ?? source.entity ?? '', ...(source.attribute ? { attribute: source.attribute } : {}), ...(Number.isFinite(source.percent) ? { percent: source.percent } : {}) };
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
  if (part === 'value') return patchFeatureResolvableValue(config, 'target', rawValue);
  if (part === 'mode') return patchFeatureMarkerSourceMode(config, 'target', rawValue);
  if (part === 'percent') return patchFeatureMarkerPercentage(config, 'target', rawValue);
  const value = part === 'fixed' ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
  const empty = part === 'fixed' ? value === null : !value;
  const raw = config.target;
  if ((!isObject(raw) || raw.at === undefined) && (raw !== undefined && !isObject(raw) || config.target_entity !== undefined)) {
    if (part === 'attribute') {
      if (empty) return config;
      const next = promoteFeatureTarget(config);
      return patchSource(next, ['target', 'at'], next.target?.at, part, value, false, true);
    }
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

function patchFeatureResolvableValue(config, key, rawValue) {
  const text = normalizeTextValue(rawValue).trim();
  const patchSource = key === 'target' ? patchFeatureTargetSource : patchFeatureBaselineSource;
  const getSource = key === 'target' ? getFeatureTargetSource : getFeatureBaselineSource;
  const raw = config[key];
  const hasAt = isObject(raw) && Object.prototype.hasOwnProperty.call(raw, 'at');
  const rawAt = hasAt ? raw.at : !isObject(raw) ? raw : undefined;
  const source = getSource(config);
  const existingAt = hasAt ? rawAt : key === 'baseline' && !isObject(raw) ? raw : rawAt;
  const currentParts = { ...readResolvableSourceParts(existingAt),
    ...(source.entity ? { entity: source.entity } : {}),
    ...(source.attribute ? { attribute: source.attribute } : {}),
  };
  const update = updateResolvableSourceParts(currentParts, 'value', text);
  if (!update.valid) return config;
  const parsedValue = text ? (Number.isFinite(update.parts.percent)
    ? { part: 'percent', value: update.parts.percent }
    : { part: 'fixed', value: update.parts.fixed }) : null;

  if (!text) {
    if (hasAt && isObject(rawAt)) {
      const nextAt = writeResolvableSourceParts(update.parts);
      const fixedAlias = rawAt.fixed === undefined && rawAt.value !== undefined;
      if (fixedAlias && nextAt.fixed !== undefined) { nextAt.value = nextAt.fixed; delete nextAt.fixed; }
      return Object.keys(nextAt).length ? setPathValue(config, [key, 'at'], nextAt) : deletePathValue(config, [key, 'at']);
    }
    if (hasAt) return deletePathValue(config, [key, 'at']);
    if (key === 'baseline' && !isObject(raw) && raw !== undefined && raw !== null) return deletePathValue(config, ['baseline']);
    if (key === 'target' && !isObject(raw) && raw !== undefined && raw !== null) return deletePathValue(config, ['target']);
    return config;
  }

  // A scalar at value is itself the canonical representation for fixed and
  // percentage fallbacks. Replace it directly so editing 50% to 25 cannot
  // leave both an old percent and a new fixed fallback behind.
  if (hasAt && rawAt !== null && rawAt !== undefined && !isObject(rawAt) && !source.entity) {
    return setPathValue(config, [key, 'at'], parsedValue.part === 'percent' ? `${parsedValue.value}%` : parsedValue.value);
  }
  if (key === 'baseline' && !isObject(raw) && raw !== null && raw !== undefined) {
    return setPathValue(config, [key], parsedValue.part === 'percent' ? `${parsedValue.value}%` : parsedValue.value);
  }

  // A legacy scalar Target may coexist with target_entity. Promote it only
  // when a second resolvable component is needed, keeping the entity primary.
  if (key === 'target' && !isObject(raw) && config.target_entity) {
    if (parsedValue.part === 'fixed') return setPathValue(config, ['target'], parsedValue.value);
    return setPathValue(config, ['target'], { at: { entity: config.target_entity, [parsedValue.part]: parsedValue.value } });
  }

  if (hasAt && isObject(rawAt)) {
    delete update.parts.unknown.value;
    const nextAt = writeResolvableSourceParts(update.parts);
    const fixedAlias = rawAt.fixed === undefined && rawAt.value !== undefined;
    if (fixedAlias && nextAt.fixed !== undefined) { nextAt.value = nextAt.fixed; delete nextAt.fixed; }
    return setPathValue(config, [key, 'at'], nextAt);
  }

  const next = patchSource(config, parsedValue.part === 'fixed' ? 'percent' : 'fixed', null);
  // Target and Baseline percentage literals are stored at their existing `at`
  // path. This also handles a newly added value without introducing a schema.
  const nextAt = isObject(next[key]) ? next[key].at : undefined;
  if (parsedValue.part === 'percent' && nextAt === undefined && !getSource(next).entity) {
    return setPathValue(next, [key, 'at'], `${parsedValue.value}%`);
  }
  return patchSource(next, parsedValue.part, parsedValue.value);
}

// Explicit conversions own source components, never surrounding marker fields.
function patchFeatureMarkerSourceMode(config, key, mode) {
  if (!['fixed', 'entity', 'entity-fallback', 'percent'].includes(mode)) return config;
  const read = key === 'target' ? getFeatureTargetSource : getFeatureBaselineSource;
  const source = read(config), raw = config[key]?.at;
  let next = key === 'target' ? promoteFeatureTarget(config)
    : isObject(config.baseline) ? config : setPathValue(config, ['baseline'], { at: config.baseline });
  let at = isObject(raw) ? { ...raw } : {};
  for (const field of ['fixed', 'value', 'entity', 'percent']) delete at[field];
  if (mode === 'fixed' || mode === 'percent') delete at.attribute;
  if (mode === 'percent') {
    const percent = Number.isFinite(source.percent) ? source.percent : 50;
    at = isObject(raw) ? { ...at, percent } : `${percent}%`;
  } else {
    if (mode !== 'entity') at.fixed = source.fixed !== '' && source.fixed !== undefined ? source.fixed : 50;
    if (mode !== 'fixed') at.entity = source.entity
      ? (source.attribute ? { id: source.entity, attribute: source.attribute } : source.entity)
      : '';
    if (!isObject(raw) && mode === 'fixed') at = at.fixed;
    if (!isObject(raw) && mode === 'entity' && at.entity) at = at.entity;
  }
  next = setPathValue(next, [key, 'at'], at);
  return key === 'target' ? deletePathValue(next, ['target_entity']) : next;
}

function patchFeatureMarkerPercentage(config, key, rawValue) {
  const clear = rawValue === null;
  const value = normalizeScalePercentageInput(rawValue);
  if (!clear && value === null) return config;
  const at = config[key]?.at, base = [key, 'at'];
  if (isObject(at)) return clear ? deletePathValue(config, [...base, 'percent']) : setPathValue(config, [...base, 'percent'], value);
  if (Number.isFinite(parsePercentLiteral(at))) return clear ? deletePathValue(config, base) : setPathValue(config, base, `${value}%`);
  if (clear) return config;
  const next = key === 'target' ? promoteFeatureTarget(config) : isObject(config.baseline) ? config : setPathValue(config, ['baseline'], { at: config.baseline });
  return patchSource(next, base, next[key]?.at, 'percent', value, false, true);
}
