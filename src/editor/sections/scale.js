import { deletePathValue, pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { escapeAttribute, renderEntitySourceInput } from '../shared/editor-controls.js';

// The host supplies source reading/canonicalization and a scoped mutation sink.
// No session, entities array, cleanup policy or full editor instance is required.
export function getScaleParts(context, scope, key, effective = false) {
  return context.source(scope, key, effective);
}

export function getScaleFixedValue(context, key) {
  return getScaleParts(context, { type: 'card' }, key).fixed;
}

export function getScaleEntityValue(context, key) {
  return getScaleParts(context, { type: 'card' }, key).entity;
}

export function setScalePart(context, scope, key, part, value) {
  return context.setSource(scope, key, part, value);
}

export function hasScaleOverride(context, scope) {
  const explicit = value => value !== '' && value !== undefined && value !== null;
  return ['min', 'max'].some(key => {
    const parts = getScaleParts(context, scope, key);
    return explicit(parts?.fixed) || explicit(parts?.entity);
  });
}

export function getScaleOverrideSummary(context, scope) {
  const parts = [];
  const min = getScaleParts(context, scope, 'min');
  const max = getScaleParts(context, scope, 'max');
  if (min.entity) parts.push('Min entity');
  else if (min.fixed !== '' && min.fixed !== undefined) parts.push(`Min ${min.fixed}`);
  if (max.entity) parts.push('Max entity');
  else if (max.fixed !== '' && max.fixed !== undefined) parts.push(`Max ${max.fixed}`);
  return parts.length ? parts.join(' • ') : 'Inherited';
}

export function clearScaleOverride(context, scope) {
  return context.mutate(scope, target => {
    let nextTarget = deletePathValue(target, ['scale', 'min']);
    nextTarget = deletePathValue(nextTarget, ['scale', 'max']);
    nextTarget = deletePathValue(nextTarget, ['min']);
    nextTarget = deletePathValue(nextTarget, ['max']);
    nextTarget = deletePathValue(nextTarget, ['min_entity']);
    nextTarget = deletePathValue(nextTarget, ['max_entity']);
    return pruneEmptyObjectsInTarget(nextTarget, ['scale']);
  }, { rerender: true });
}

// Events are already decoded by the host; true means the field was handled,
// including no-op/invalid edits. The host retains delegated event lifecycle.
export function handleScaleField(context, { field, kind, index, value }) {
  if (field === 'scale-min' || field === 'scale-max') {
    setScalePart(context, { type: 'card' }, field.slice(6), 'fixed', value);
    return true;
  }
  if (kind === 'scale-min-entity-source' || kind === 'scale-max-entity-source') {
    setScalePart(context, { type: 'card' }, kind.split('-')[1], 'entity', value);
    return true;
  }
  const scope = { type: 'entity', index: Number(index) };
  if (kind === 'entity-scale-inherit') {
    if (value) clearScaleOverride(context, scope);
    return true;
  }
  if (['entity-override-min', 'entity-override-max', 'entity-override-min-entity-source', 'entity-override-max-entity-source'].includes(kind)) {
    setScalePart(context, scope, kind.split('-')[2], kind.endsWith('-entity-source') ? 'entity' : 'fixed', value);
    return true;
  }
  return false;
}

export function renderScaleSection(context, scope) {
  if (scope?.type === 'entity') {
    const index = scope.index;
    const minParts = getScaleParts(context, scope, 'min', true);
    const maxParts = getScaleParts(context, scope, 'max', true);
    const scaleInherited = !hasScaleOverride(context, scope);
    return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${index}"${scaleInherited ? ' checked' : ''}>
	                          <label for="entity-${index}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${index}-min">Min fallback</label>
                        <input id="entity-${index}-min" type="number" step="any" data-kind="entity-override-min" data-index="${index}" value="${escapeAttribute(minParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${renderEntitySourceInput('entity-override-min-entity-source', index, minParts.entity, 'inherit card default')}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-max">Max fallback</label>
                        <input id="entity-${index}-max" type="number" step="any" data-kind="entity-override-max" data-index="${index}" value="${escapeAttribute(maxParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${renderEntitySourceInput('entity-override-max-entity-source', index, maxParts.entity, 'inherit card default')}
                      </div>
	                          `;
  }
  const scaleMin = getScaleFixedValue(context, 'min');
  const scaleMax = getScaleFixedValue(context, 'max');
  const scaleMinEntity = getScaleEntityValue(context, 'min');
  const scaleMaxEntity = getScaleEntityValue(context, 'max');
  return `	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${escapeAttribute(scaleMin)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${renderEntitySourceInput('scale-min-entity-source', 'card', scaleMinEntity)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${escapeAttribute(scaleMax)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${renderEntitySourceInput('scale-max-entity-source', 'card', scaleMaxEntity)}
            </div>
          </div>
	        </div>`;
}
