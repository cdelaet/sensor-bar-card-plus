import { deletePathValue, pruneEmptyObjectsInTarget, setPathValue } from './editor-config.js';
import { escapeAttribute } from './editor-controls.js';

export function getDirectionSelection(context, scope, path) {
  const local = context.read(scope, path);
  return scope?.type === 'entity' && local === undefined ? 'inherit' : local ?? 'normal';
}

export function setDirectionValue(context, scope, path, value) {
  const isEntity = scope?.type === 'entity';
  if (!['normal', 'reverse'].includes(value) && !(isEntity && value === 'inherit')) return false;
  return context.mutate(scope, target => {
    const remove = value === 'inherit' || (!isEntity && value === 'normal');
    let nextTarget = remove
      ? deletePathValue(target, path)
      : setPathValue(target, path, value);
    nextTarget = pruneEmptyObjectsInTarget(nextTarget, path.slice(0, -1));
    return nextTarget;
  }, { preserveRawConfig: true });
}

export function renderDirectionControl(context, scope, { path, id, field, kind, label }) {
  const isEntity = scope?.type === 'entity';
  const selection = getDirectionSelection(context, scope, path);
  const routing = isEntity
    ? `data-kind="${escapeAttribute(kind)}" data-index="${escapeAttribute(scope.index)}"`
    : `data-field="${escapeAttribute(field)}"`;
  const options = [
    ...(isEntity ? [['inherit', 'Inherit']] : []),
    ['normal', 'Normal'],
    ['reverse', 'Reverse'],
  ];
  return `<div class="field-row">
    <label for="${escapeAttribute(id)}">${escapeAttribute(label)}</label>
    <select id="${escapeAttribute(id)}" ${routing} value="${escapeAttribute(selection)}">
      ${options.map(([value, title]) => `<option value="${value}"${selection === value ? ' selected' : ''}>${title}</option>`).join('')}
    </select>
  </div>`;
}
