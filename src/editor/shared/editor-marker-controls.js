import { normalizeMarkerDirection } from '../../config/normalize.js';
import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue,
  normalizeTextValue, normalizeDecimalValue, pruneEmptyObjectsInTarget } from './editor-config.js';

export function normalizeMarkerLabelField(field, value) {
  if (field === 'text') return normalizeTextValue(value).replace(/\s+/g, ' ').trim();
  if (field === 'entity') return normalizeTextValue(value).trim();
  if (['show', 'showValue', 'showUnit', 'show_value', 'show_unit'].includes(field)) return value === true;
  return normalizeDecimalValue(value);
}

export function getBuiltinMarkerLabelOptions(context, scope, key, show) {
  const marker = context.read(scope, [key]);
  const label = isObject(marker?.label) ? marker.label : {};
  const cardLabel = scope?.type === 'entity'
    ? (context.read({ type: 'card' }, [key, 'label']) ?? {})
    : {};
  const own = (name) => Object.prototype.hasOwnProperty.call(label, name);
  const inheritedValue = (name, fallback) => own(name) ? label[name] : (cardLabel[name] ?? fallback);
  const precision = inheritedValue('precision', inheritedValue('decimal', ''));
  return {
    show,
    text: inheritedValue('text', ''),
    showValue: inheritedValue('show_value', true) !== false,
    showUnit: inheritedValue('show_unit', true) !== false,
    precision: precision === null ? '' : precision,
  };
}

export function setBuiltinMarkerLabelField(context, scope, key, field, value) {
  const publicField = field === 'showValue' ? 'show_value'
    : field === 'showUnit' ? 'show_unit'
      : field === 'precision' ? 'precision' : field;
  const isText = field === 'text';
  const normalized = normalizeMarkerLabelField(field, value);
  if (field === 'precision' && value !== '' && normalized === null) return false;
  return context.mutate(scope, (target) => {
    let next = cloneDeep(target);
    if (key === 'target' && field === 'show') next = deletePathValue(next, ['show_target_label']);
    const marker = isObject(getPathValue(next, [key]))
      ? cloneDeep(getPathValue(next, [key])) : {};
    const label = isObject(marker.label) ? cloneDeep(marker.label) : {};
    const inheritedLabel = scope?.type === 'entity'
      ? (context.read({ type: 'card' }, [key, 'label']) ?? {}) : {};
    const inheritedValue = field === 'precision'
      ? (inheritedLabel.precision ?? inheritedLabel.decimal ?? null)
      : inheritedLabel[publicField] ?? (field === 'show' ? false : field === 'showValue' || field === 'showUnit' ? true : undefined);
    if (normalized === null || (isText && !normalized)) {
      if (isText && scope?.type === 'entity' && typeof inheritedLabel.text === 'string' && inheritedLabel.text.trim()) {
        label[publicField] = '';
      } else {
        delete label[publicField];
      }
    } else if (scope?.type === 'entity' && normalized === inheritedValue) {
      delete label[publicField];
    } else if ((field === 'show' || field === 'showValue' || field === 'showUnit') && scope?.type !== 'entity'
      && normalized === (field === 'show' ? false : true)) {
      delete label[publicField];
    } else {
      label[publicField] = normalized;
    }
    if (field === 'precision') delete label.decimal;
    if (Object.keys(label).length) marker.label = label;
    else delete marker.label;
    if (Object.keys(marker).length) next = setPathValue(next, [key], marker);
    else next = deletePathValue(next, [key]);
    return next;
  }, { markerEdit: { key, path: ['label', publicField], value: normalized, field } });
}

export function getEffectiveMarkerDirection(context, scope, key) {
  const canonical = context.read(scope, [key, 'direction']);
  const local = canonical !== undefined
    ? canonical
    : context.read(scope, [`${key}_marker`, 'direction']);
  if (scope?.type === 'entity' && local === undefined) {
    return getEffectiveMarkerDirection(context, { type: 'card' }, key);
  }
  return normalizeMarkerDirection(local);
}

export function setMarkerDirection(context, scope, key, rawValue) {
  const direction = normalizeMarkerDirection(rawValue);
  const cardDirection = getEffectiveMarkerDirection(context, { type: 'card' }, key);
  const value = (scope?.type !== 'entity' && direction === 'inward')
    || (scope?.type === 'entity' && direction === cardDirection) ? undefined : direction;
  return context.mutate(scope, target => pruneEmptyObjectsInTarget(value === undefined
    ? deletePathValue(target, [key, 'direction']) : setPathValue(target, [key, 'direction'], value), [key]),
    { prunePaths: [[key]], markerEdit: { key, path: ['direction'], value: direction } });
}
