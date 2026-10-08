import { getReferenceMarkerSource } from '../editor/sections/reference-markers.js';
import { cloneDeep, isObject, normalizeNumberValue, normalizeTextValue, setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../editor/shared/editor-config.js';
import { patchSource } from './feature-editor-config.js';

// Display supported scalar/value sources without changing standalone's reader.
export function getFeatureReferenceMarkerSource(marker) {
  const at = marker?.at;
  if (typeof at === 'number') return getReferenceMarkerSource({ at: { fixed: at } });
  if (isObject(at) && at.fixed === undefined && at.value !== undefined) return getReferenceMarkerSource({ at: { ...at, fixed: at.value } });
  return getReferenceMarkerSource(marker);
}

export function patchFeatureReferenceMarkerSource(config, index, part, rawValue) {
  if (!Array.isArray(config.markers) || !config.markers[index]) return config;
  const base = ['markers', index, 'at'], at = config.markers[index]?.at;
  const value = part === 'entity' ? normalizeTextValue(rawValue).trim() : normalizeNumberValue(rawValue);
  const empty = part === 'entity' ? !value : value === null;
  // Generic percentage anchors have only string syntax; object percent is invalid.
  if (part === 'percent') return setPathValue(config, base, empty ? null : `${value}%`);
  // Apply the existing object-source patcher to one item: its delete helper
  // intentionally does not traverse arrays.
  const marker = patchSource(config.markers[index], ['at'], at, part, value, empty);
  return setPathValue(config, ['markers', index], marker);
}

export function patchFeatureReferenceMarker(config, operation) {
  const rows = Array.isArray(config.markers) ? [...config.markers] : [];
  const { type, index, path, value } = operation;
  if (type === 'add') rows.push({ at: { fixed: 50 } });
  else {
    if (index < 0 || index >= rows.length || !Number.isInteger(index)) return config;
    if (type === 'remove') rows.splice(index, 1);
    else if (type === 'move') {
      const next = index + operation.delta;
      if (next < 0 || next >= rows.length) return config;
      [rows[index], rows[next]] = [rows[next], rows[index]];
    } else if (type === 'field') {
      let marker = value === undefined ? deletePathValue(rows[index], path) : setPathValue(rows[index], path, value);
      if (path[0] === 'label' && path[1] === 'precision') marker = deletePathValue(marker, ['label', 'decimal']);
      rows[index] = path[0] === 'label' ? pruneEmptyObjectsInTarget(marker, ['label']) : marker;
    } else if (type === 'mode') {
      let at;
      if (value === 'percent') at = '50%';
      else {
        const source = getFeatureReferenceMarkerSource(rows[index]);
        at = isObject(rows[index]?.at) ? cloneDeep(rows[index].at)
          : { ...(source.entity ? { entity: source.entity } : {}), ...(source.fixed !== '' && source.fixed !== undefined ? { fixed: source.fixed } : {}) };
        delete at.percent;
        if (value === 'fixed') {
          delete at.entity;
          if (at.fixed === undefined && at.value === undefined) at.fixed = 50;
        } else {
          if (!at.entity) at.entity = '';
          if (value === 'entity') { delete at.fixed; delete at.value; }
          if (value === 'entity-fallback' && at.fixed === undefined && at.value === undefined) at.fixed = 50;
        }
      }
      rows[index] = setPathValue(rows[index], ['at'], at);
    }
  }
  return setPathValue(config, ['markers'], rows);
}
