import { normalizeNumberValue, normalizeTextValue, cloneDeep, isObject } from './editor-config.js';
import { parseScaleValueInput, normalizeScalePercentageInput } from './editor-controls.js';
import { normalizeStructuredResolvableValue, parsePercentLiteral } from '../../config/normalize.js';

const SOURCE_KEYS = new Set(['fixed', 'value', 'percent', 'entity', 'attribute']);

function scalarParts(source) {
  if (typeof source === 'number') return { fixed: source };
  const text = normalizeTextValue(source).trim();
  if (!text) return {};
  const percent = parsePercentLiteral(text);
  if (percent !== null) return { percent };
  const parsed = parseScaleValueInput(text);
  if (parsed?.part === 'fixed') return { fixed: parsed.value };
  if (/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(text)) return { entity: text };
  return { fixed: source };
}

/** Read a scalar or structured resolvable source into editor-neutral parts. */
export function readResolvableSourceParts(source) {
  if (!isObject(source)) return { ...scalarParts(source), unknown: {} };
  const normalized = normalizeStructuredResolvableValue(source, null, null, { allowPercent: true });
  const percentRaw = source.percent;
  const percentLiteral = typeof percentRaw === 'string' ? parsePercentLiteral(percentRaw) : null;
  const percent = percentLiteral ?? normalizeNumberValue(percentRaw) ?? normalized.percent;
  const invalidEntity = normalized.entity_invalid === true;
  const unknown = Object.fromEntries([
    ...Object.entries(source).filter(([key]) => !SOURCE_KEYS.has(key)),
    ...(source.fixed !== undefined && source.value !== undefined ? [['value', source.value]] : []),
    ...(invalidEntity && Object.prototype.hasOwnProperty.call(source, 'entity') ? [['entity', source.entity]] : []),
    ...(invalidEntity && Object.prototype.hasOwnProperty.call(source, 'attribute') ? [['attribute', source.attribute]] : []),
  ].map(([key, value]) => [key, cloneDeep(value)]));
  return {
    ...(source.fixed !== undefined && source.fixed !== null && source.fixed !== ''
      ? { fixed: source.fixed }
      : source.value !== undefined && source.value !== null && source.value !== '' ? { fixed: source.value } : {}),
    ...(!invalidEntity && normalized.entity ? { entity: normalized.entity } : {}),
    ...(!invalidEntity && normalized.attribute ? { attribute: normalized.attribute } : {}),
    ...(percent !== null ? { percent } : {}),
    unknown,
  };
}

/** Apply a Value, Entity, Attribute, fixed or percentage edit without mutation. */
export function updateResolvableSourceParts(currentParts, part, rawValue) {
  const parts = cloneDeep(currentParts ?? {});
  parts.unknown = cloneDeep(parts.unknown ?? {});
  const text = normalizeTextValue(rawValue).trim();

  if (part === 'value') {
    if (!text) {
      delete parts.fixed;
      delete parts.percent;
      return { valid: true, parts };
    }
    const parsed = parseScaleValueInput(text);
    if (!parsed) return { valid: false, parts: currentParts };
    delete parts.fixed;
    delete parts.percent;
    parts[parsed.part] = parsed.value;
    return { valid: true, parts };
  }

  if (!['fixed', 'percent', 'entity', 'attribute'].includes(part)) return { valid: false, parts: currentParts };
  if (part === 'fixed') {
    if (!text) delete parts.fixed;
    else {
      const value = normalizeNumberValue(text);
      if (value === null) return { valid: false, parts: currentParts };
      parts.fixed = value;
    }
  } else if (part === 'percent') {
    if (!text) delete parts.percent;
    else {
      const value = normalizeScalePercentageInput(text);
      if (value === null) return { valid: false, parts: currentParts };
      parts.percent = value;
    }
  } else if (part === 'entity') {
    // Replacing an invalid source is an explicit repair. Merely editing Value
    // leaves these raw fields in `unknown` so runtime validation is unchanged.
    delete parts.unknown.entity;
    delete parts.unknown.attribute;
    if (!text) {
      delete parts.entity;
      delete parts.attribute;
    } else parts.entity = text;
  } else if (part === 'attribute') {
    // Attribute editing owns the unsupported sibling form, but cannot repair
    // an invalid Entity object when no valid Entity ID was read.
    delete parts.unknown.attribute;
    if (!text) delete parts.attribute;
    else parts.attribute = text;
  }
  return { valid: true, parts };
}

/** Serialize editor-neutral parts into the canonical object source form. */
export function writeResolvableSourceParts(parts) {
  const source = cloneDeep(parts?.unknown ?? {});
  if (parts?.fixed !== undefined && parts.fixed !== null && parts.fixed !== '') source.fixed = parts.fixed;
  if (parts?.entity !== undefined && parts.entity !== null && parts.entity !== '') {
    source.entity = parts.attribute ? { id: parts.entity, attribute: parts.attribute } : parts.entity;
  }
  if (Number.isFinite(parts?.percent)) source.percent = parts.percent;
  return source;
}
