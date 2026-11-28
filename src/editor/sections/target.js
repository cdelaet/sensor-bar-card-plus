import { readResolvableSourceParts, updateResolvableSourceParts, writeResolvableSourceParts } from '../shared/resolvable-source.js';
import { getAuthoredSharedTargetSource, normalizeDirectionalTargets, normalizeTargetMarkerShape } from '../../config/normalize.js';
import { cloneDeep, isObject, getPathValue, setPathValue, deletePathValue, removePathsFromTarget,
  pruneEmptyObjectsInTarget, normalizeDecimalValue, getEffectiveDisplayValue } from '../shared/editor-config.js';
import { escapeAttribute, normalizeEditorColorValue, normalizeColorComparisonValue, renderColorInput, renderBuiltinMarkerLabelControls, formatScaleValueInput, renderEntityAttributeInput, getEntityAttributeSuggestions, syncColorInput } from '../shared/editor-controls.js';
import { renderResolvableSourceControls } from '../shared/resolvable-source-controls.js';
import { renderPaintEditor, syncPaintEditor, describePaint } from '../shared/paint-editor.js';
import { renderCardGroup } from '../shared/editor-disclosures.js';
import { getDestinationEditorState } from '../shared/paint-destination.js';
import { TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT } from '../../view-model/paint-destinations.js';
import { getBuiltinMarkerLabelOptions, setBuiltinMarkerLabelField, getEffectiveMarkerDirection, setMarkerDirection } from '../shared/editor-marker-controls.js';

export class TargetSection {
  constructor(context) { this.context = context; this._expandedGroups = new Set(); }

  _getCardTargetMarkerSummary() {
    const mode = this._getTargetMode({ type: 'card' });
    if (mode === 'disabled') return 'Disabled';
    const target = this._getTargetResolvableValue({ type: 'card' });
    const parts = [];
    if (mode === 'enabled') parts.push('Enabled');
    const hasTargetValue = (target.fixed !== '' && target.fixed !== undefined) || !!target.entity;
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(String(target.fixed));
    if (target.entity) parts.push(target.entity);
    if (hasTargetValue || this._hasTargetShape({ type: 'card' })) {
      parts.push(this._getEffectiveTargetShapeValue({ type: 'card' }) === 'triangle' ? 'Triangle' : 'Diamond');
    }
    return parts.length ? parts.join(' · ') : 'Automatic';
  }

  _handleValueField(control, value, scope) {
    if (control !== 'target-value') return false;
    this._setTargetResolvablePart(scope, 'value', value);
    return true;
  }

  _getTargetResolvableValue(scope) { return this.context.source(scope, 'target'); }

  _getEffectiveTargetResolvableValue(scope) {
    return getAuthoredSharedTargetSource(this.context.read(scope, []))
      ?? (scope.type === 'entity' ? getAuthoredSharedTargetSource(this.context.read({ type: 'card' }, [])) : null)
      ?? {};
  }

  _getTargetMode(scope) {
    const enabled = this.context.read(scope, ['target', 'enabled']);
    if (scope?.type === 'entity') {
      if (enabled === false) return 'disabled';
      if (enabled === true || this._hasTargetOverride(scope)) return 'enabled';
      return 'inherit';
    }
    if (enabled === true) return 'enabled';
    if (enabled === false) return 'disabled';
    return 'auto';
  }

  _getTargetShow(scope) {
    const enabled = this.context.read(scope, ['target', 'enabled']);
    if (typeof enabled === 'boolean') return enabled;
    return scope?.type === 'entity' ? this._getTargetShow({ type: 'card' }) : true;
  }

  _getTargetShapeValue(scope) {
    return this.context.read(scope, ['target', 'shape']) ?? '';
  }

  _hasTargetShape(scope) {
    const target = this.context.read(scope, ['target']);
    return isObject(target) && Object.prototype.hasOwnProperty.call(target, 'shape');
  }

  _getEffectiveTargetShapeValue(scope) {
    if (scope?.type === 'entity' && !this._hasTargetShape(scope)) {
      return this._getEffectiveTargetShapeValue({ type: 'card' });
    }
    return normalizeTargetMarkerShape(this._getTargetShapeValue(scope));
  }

  _setTargetShape(scope, rawValue) {
    const normalizedShape = normalizeTargetMarkerShape(rawValue);
    if (scope?.type !== 'entity' && normalizedShape === 'diamond') {
      return this._remove(scope, ['target', 'shape'], {
        prunePaths: [['target']],
      });
    }
    return this._setText(scope, ['target', 'shape'], normalizedShape, {
      prunePaths: [['target']],
    });
  }

  _setTargetShow(scope, value) {
    const enabled = !!value;
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const rawTarget = getPathValue(nextTarget, ['target']);
      if (rawTarget !== undefined && rawTarget !== null && !isObject(rawTarget)) {
        const legacyEntity = getPathValue(nextTarget, ['target_entity']);
        const at = legacyEntity ? { fixed: rawTarget, entity: legacyEntity } : rawTarget;
        nextTarget = setPathValue(nextTarget, ['target'], { at, enabled });
      } else {
        nextTarget = setPathValue(nextTarget, ['target', 'enabled'], enabled);
      }
      return nextTarget;
    }, { targetEdit: { path: ['enabled'], value: enabled } });
  }

  _setTargetResolvablePart(scope, part, rawValue) { return this.context.setSource(scope, 'target', part, rawValue); }

  _clearTargetOverride(scope) {
    return this.context.mutate(scope, (target) => {
      let nextTarget = cloneDeep(target);
      const rawTarget = getPathValue(nextTarget, ['target']);
      if (isObject(rawTarget)) {
        nextTarget = deletePathValue(nextTarget, ['target', 'enabled']);
        nextTarget = deletePathValue(nextTarget, ['target', 'at']);
        nextTarget = deletePathValue(nextTarget, ['target', 'color']);
        nextTarget = deletePathValue(nextTarget, ['target', 'shape']);
        nextTarget = deletePathValue(nextTarget, ['target', 'direction']);
        for (const field of ['show', 'decimal', 'precision', 'text', 'show_value', 'show_unit']) {
          nextTarget = deletePathValue(nextTarget, ['target', 'label', field]);
        }
      } else {
        nextTarget = deletePathValue(nextTarget, ['target']);
      }
      nextTarget = deletePathValue(nextTarget, ['target_entity']);
      nextTarget = deletePathValue(nextTarget, ['target_color']);
      nextTarget = deletePathValue(nextTarget, ['show_target_label']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target', 'label']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target', 'when_exceeded']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['target']);
      return nextTarget;
    });
  }

  _getTargetColorValue(scope) {
    return this.context.read(scope, ['target', 'color'])
      ?? this.context.read(scope, ['target_color'])
      ?? '';
  }

  _getEffectiveTargetColorValue(scope) {
    return this._effectiveDisplay(scope, ['target', 'color'], [['target_color']]);
  }

  _hasCustomTargetColor(scope) {
    const color = this._getTargetColorValue(scope);
    return !!color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue('#888');
  }

  _setTargetColor(scope, rawValue) {
    const normalizedValue = normalizeEditorColorValue(rawValue);
    if (!normalizedValue || normalizeColorComparisonValue(normalizedValue) === normalizeColorComparisonValue('#888')) {
      return this._remove(scope, ['target', 'color'], {
        deprecatedKeys: [['target_color']],
        prunePaths: [['target']],
      });
    }
    return this._setText(scope, ['target', 'color'], normalizedValue, {
      deprecatedKeys: [['target_color']],
      prunePaths: [['target']],
    });
  }

  _getTargetLabelShowValue(scope) {
    const structuredValue = this.context.read(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    return !!this.context.read(scope, ['show_target_label']);
  }

  _getEffectiveTargetLabelShowValue(scope) {
    const structuredValue = this.context.read(scope, ['target', 'label', 'show']);
    if (structuredValue !== undefined) {
      return !!structuredValue;
    }
    const legacyValue = this.context.read(scope, ['show_target_label']);
    if (legacyValue !== undefined) {
      return !!legacyValue;
    }
    if (scope?.type === 'entity') {
      return this._getTargetLabelShowValue({ type: 'card' });
    }
    return false;
  }

  _setTargetLabelShow(scope, value) {
    if (!value) {
      return this._remove(scope, ['target', 'label', 'show'], {
        deprecatedKeys: [['show_target_label']],
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    return this._write(scope, ['target', 'label', 'show'], true, {
      deprecatedKeys: [['show_target_label']],
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _getTargetLabelDecimalValue(scope) {
    return this.context.read(scope, ['target', 'label', 'precision'])
      ?? this.context.read(scope, ['target', 'label', 'decimal']) ?? '';
  }

  _getEffectiveTargetLabelDecimalValue(scope) {
    const local = this._getTargetLabelDecimalValue(scope);
    return local !== '' && local !== null && local !== undefined
      ? local : (scope?.type === 'entity' ? this._getTargetLabelDecimalValue({ type: 'card' }) : '');
  }

  _setTargetLabelDecimal(scope, rawValue) {
    const normalizedValue = normalizeDecimalValue(rawValue);
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return this._remove(scope, ['target', 'label', 'decimal'], {
        prunePaths: [['target', 'label'], ['target']],
      });
    }
    if (normalizedValue === null) {
      return false;
    }
    return this._write(scope, ['target', 'label', 'decimal'], normalizedValue, {
      prunePaths: [['target', 'label'], ['target']],
    });
  }

  _hasTargetOverride(scope) {
    const targetValue = this.context.read(scope, ['target']);
    if (isObject(targetValue) && Object.keys(targetValue).some(key => !['when_above', 'when_below', 'when_exceeded'].includes(key))) {
      return true;
    }
    if (!isObject(targetValue) && targetValue !== undefined && targetValue !== null && targetValue !== '') {
      return true;
    }
    return ['target_entity', 'target_color', 'show_target_label']
      .some((key) => {
        const value = this.context.read(scope, [key]);
        return value !== undefined && value !== null && value !== '' && value !== false;
      }) || this._getTargetLabelDecimalValue(scope) !== '';
  }

  _getTargetOverrideSummary(scope) {
    const mode = this._getTargetMode(scope);
    if (mode === 'disabled') return 'Disabled';
    const parts = [];
    const target = this._getTargetResolvableValue(scope);
    if (target.fixed !== '' && target.fixed !== undefined) parts.push(`Target ${target.fixed}`);
    if (target.entity) parts.push('Entity');
    if (this._hasTargetShape(scope)) {
      parts.push(this._getEffectiveTargetShapeValue(scope) === 'triangle' ? 'Triangle' : 'Diamond');
    }
    if (this._hasCustomTargetColor(scope)) parts.push('Custom color');
    if (this._getTargetLabelShowValue(scope)) parts.push('Label');
    const labelDecimal = this._getTargetLabelDecimalValue(scope);
    if (labelDecimal !== '') parts.push(`Label ${labelDecimal} ${Number(labelDecimal) === 1 ? 'decimal' : 'decimals'}`);
    return parts.length ? parts.join(' • ') : 'Inherited';
  }

  _write(scope, path, value, options = {}) {
    return this.context.mutate(scope, target => {
      let next = target;
      if (value !== undefined && path[0] === 'target' && path.length > 1 && target.target != null && !isObject(target.target)) {
        next = setPathValue(next, ['target'], { at: target.target_entity ? { fixed: target.target, entity: target.target_entity } : target.target });
      }
      next = value === undefined ? deletePathValue(next, path) : setPathValue(next, path, value);
      next = removePathsFromTarget(next, options.deprecatedKeys ?? []);
      for (const prunePath of options.prunePaths ?? []) next = pruneEmptyObjectsInTarget(next, prunePath);
      return next;
    }, { ...options, targetEdit: { path: path.slice(1), value, deprecatedKeys: options.deprecatedKeys ?? [] } });
  }
  _remove(scope, path, options) { return this._write(scope, path, undefined, options); }
  _setText(scope, path, rawValue, options) { return this._write(scope, path, normalizeEditorColorValue(rawValue) || undefined, options); }
  _effectiveDisplay(scope, path, fallbacks) { return getEffectiveDisplayValue(this.context, scope, path, fallbacks); }
  _getEffectiveMarkerDirection(scope, key) { return getEffectiveMarkerDirection(this.context, scope, key); }
  _setMarkerDirection(scope, key, value) { return setMarkerDirection(this.context, scope, key, value); }
  _getBuiltinMarkerLabelOptions(scope, key) { return getBuiltinMarkerLabelOptions(this.context, scope, key, this._getEffectiveTargetLabelShowValue(scope)); }
  _renderBuiltinMarkerLabelControls(scope, key, title) { return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key)); }
  _setBuiltinMarkerLabelField(scope, key, field, value) { return setBuiltinMarkerLabelField(this.context, scope, key, field, value); }

  _directionalTargets(scope) {
    return normalizeDirectionalTargets(this.context.read(scope, []), scope.type === 'entity' ? this.context.read({ type: 'card' }, []) : null);
  }

  _directionalPropertyPath(property) {
    return property === 'source' ? ['at'] : ['marker', ...(property.startsWith('label-')
      ? ['label', property.slice(6).replaceAll('-', '_')] : [property === 'show' ? 'enabled' : property])];
  }

  _ownsDirectionalProperty(scope, side, property) {
    return this.context.read(scope, ['target', `when_${side}`, ...this._directionalPropertyPath(property)]) !== undefined
      || property === 'label-precision' && this.context.read(scope, ['target', `when_${side}`, 'marker', 'label', 'decimal']) !== undefined;
  }

  _directionalPropertySource(scope, side, property) {
    const local = this._ownsDirectionalProperty(scope, side, property);
    const sharedProperty = property === 'show' ? 'enabled' : property;
    const shared = this._propertySource(scope, sharedProperty);
    const parent = scope.type === 'entity' && this._ownsDirectionalProperty({ type: 'card' }, side, property);
    const inherited = parent || shared !== 'Default';
    return local ? inherited ? 'Override' : 'Local' : inherited ? 'Inherited' : 'Default';
  }

  _setDirectionalField(scope, side, field, value) {
    if (['value', 'entity-source', 'attribute'].includes(field)) {
      const at = this.context.read(scope, ['target', `when_${side}`, 'at']);
      const selected = this._directionalTargets(scope)[side];
      const selectedScope = selected.sourceScope === 'inherited' ? { type: 'card' } : scope;
      const raw = at !== undefined ? at : this.context.read(selectedScope, selected.sourcePath.split('.'));
      const parts = readResolvableSourceParts(raw === undefined ? selected.source : raw);
      const update = updateResolvableSourceParts(parts, field === 'entity-source' ? 'entity' : field, value);
      if (!update.valid) return false;
      const nextSource = writeResolvableSourceParts(update.parts);
      const path = ['target', `when_${side}`, 'at'];
      return this._write(scope, path, Object.keys(nextSource).length ? nextSource : undefined, {
        prunePaths: [path.slice(0, -1), ['target']],
        forceTargetSyncScope: Object.keys(nextSource).length === 0 ? scope : undefined,
        syncTargetControls: true,
      });
    }
    const path = this._directionalPropertyPath(field);
    if (field === 'shape') value = normalizeTargetMarkerShape(value);
    else if (field === 'direction') value = value === 'outward' ? 'outward' : 'inward';
    else if (field === 'color') value = normalizeEditorColorValue(value) || undefined;
    else if (field === 'label-precision') {
      const precision = normalizeDecimalValue(value);
      if (value !== '' && precision === null) return false;
      value = precision ?? undefined;
    } else if (field === 'label-text') value = String(value ?? '');
    else value = value === true;
    return this._write(scope, ['target', `when_${side}`, ...path], value,
      { deprecatedKeys: field === 'label-precision' ? [['target', `when_${side}`, 'marker', 'label', 'decimal']] : [],
        prunePaths: [['target', `when_${side}`, 'marker', 'label'], ['target', `when_${side}`, 'marker'], ['target', `when_${side}`], ['target']] });
  }

  _renderDirectionalControls(scope, side) {
    const prefix = scope.type === 'entity' ? `entity-${scope.index}-` : '';
    const id = `${prefix}target-${side}`;
    const field = name => scope.type === 'entity' ? `data-kind="entity-target-${side}-${name}" data-index="${scope.index}"` : `data-field="target-${side}-${name}"`;
    const { source, marker } = this._directionalTargets(scope)[side];
    const appearance = `<div class="field-row"><label for="${id}-shape">Shape</label><select id="${id}-shape" ${field('shape')}>${['diamond', 'triangle'].map(shape => `<option value="${shape}">${shape}</option>`).join('')}</select></div>
      <div class="field-row"><label for="${id}-direction">Direction</label><select id="${id}-direction" ${field('direction')}><option value="inward">Inward</option><option value="outward">Outward</option></select></div>
      <div class="field-row"><label for="${id}-color">Color</label>${renderColorInput({ id: `${id}-color`, value: marker.color, fallbackHex: '#888',
        ...(scope.type === 'entity' ? { kind: `entity-target-${side}-color`, index: scope.index } : { field: `target-${side}-color` }) })}</div>`;
    const labels = `<div class="field-row"><div class="toggle"><input id="${id}-label-show" type="checkbox" ${field('label-show')}><label for="${id}-label-show">Show label</label></div></div>
      <div class="field-row"><label for="${id}-label-text">Label text</label><input id="${id}-label-text" type="text" ${field('label-text')}></div>
      ${[['show-value', 'Show value'], ['show-unit', 'Show unit']].map(([name, title]) => `<div class="field-row"><div class="toggle"><input id="${id}-label-${name}" type="checkbox" ${field(`label-${name}`)}><label for="${id}-label-${name}">${title}</label></div></div>`).join('')}
      <div class="field-row"><label for="${id}-label-precision">Precision</label><input id="${id}-label-precision" type="number" min="0" step="1" ${field('label-precision')}></div>`;
    const threshold = renderResolvableSourceControls({ source,
      value: { id: `${id}-value`, ...(scope.type === 'entity' ? { kind: `entity-target-${side}-value`, index: scope.index } : { field: `target-${side}-value` }) },
      entity: { kind: `${scope.type === 'entity' ? 'entity-' : ''}target-${side}-entity-source`, index: scope.type === 'entity' ? scope.index : 'card' },
      attribute: { kind: `${scope.type === 'entity' ? 'entity-' : ''}target-${side}-attribute`, index: scope.type === 'entity' ? scope.index : 'card' }, hass: this.context.hass,
    });
    return `<div class="target-directional-controls" data-target-side="${side}">
      ${this._renderGroup(scope, `${side}-threshold`, 'Threshold', threshold)}
      ${this._renderGroup(scope, `${side}-marker`, 'Marker', `<div class="field-row"><div class="toggle"><input id="${id}-show" type="checkbox" ${field('show')}><label for="${id}-show">Show marker</label></div></div>
        ${this._renderGroup(scope, `${side}-appearance`, 'Appearance', appearance)}
        ${this._renderGroup(scope, `${side}-labels`, 'Labels', labels)}`)}
    </div>`;
  }

  _syncDirectionalControls(root, section, scope, side, options) {
    const prefix = scope.type === 'entity' ? `entity-${scope.index}-` : '';
    const id = `${prefix}target-${side}`;
    const group = section.querySelector(`[data-target-side="${side}"]`);
    if (!group) return;
    const { source, marker } = this._directionalTargets(scope)[side];
    const syncValue = (control, value) => {
      if (control && (control !== root.activeElement || options.replaced)
        && !options.numericDrafts?.values?.has(control.id) && !options.cssColorDrafts?.has(control.id)
        && String(control.value ?? '') !== String(value ?? '')) control.value = String(value ?? '');
    };
    const values = { value: formatScaleValueInput(source), shape: marker.shape, direction: marker.direction,
      'label-text': marker.label_text, 'label-precision': marker.label_precision ?? marker.label_decimal };
    syncColorInput(group, `${id}-color`, marker.color, '#888', options);
    for (const [field, value] of Object.entries(values)) syncValue(group.querySelector(`#${id}-${field}`), value);
    for (const [field, checked] of [['show', marker.enabled !== false], ['label-show', marker.show_label === true],
      ['label-show-value', marker.label_show_value !== false], ['label-show-unit', marker.label_show_unit !== false]]) {
      group.querySelector(`#${id}-${field}`).checked = checked;
    }
    const entityKind = `${scope.type === 'entity' ? 'entity-' : ''}target-${side}-entity-source`;
    const entityControl = group.querySelector(`[data-kind="${entityKind}"]`);
    entityControl.id = `${id}-entity`;
    entityControl.setAttribute('aria-label', `${side === 'above' ? 'Above' : 'Below'} Target entity`);
    syncValue(entityControl, source.entity);
    if (entityControl.tagName === 'HA-ENTITY-PICKER') {
      entityControl.hass = this.context.hass; entityControl.label = `${side === 'above' ? 'Above' : 'Below'} Target entity`; entityControl.allowCustomEntity = true;
    }
    let attributeRow = group.querySelector('.resolvable-source-attribute');
    const attributeKind = entityKind.replace('-entity-source', '-attribute');
    if (!attributeRow && source.entity) {
      const template = section.ownerDocument.createElement('template');
      template.innerHTML = `<div class="field-row resolvable-source-attribute"><label>Attribute</label>${renderEntityAttributeInput(attributeKind,
        scope.type === 'entity' ? scope.index : 'card', source.attribute, source.entity, this.context.hass)}</div>`;
      entityControl.closest('.field-row').after(template.content);
      attributeRow = group.querySelector('.resolvable-source-attribute');
    }
    if (attributeRow) {
      attributeRow.hidden = !source.entity;
      attributeRow.style.display = source.entity ? '' : 'none';
      const control = attributeRow.querySelector(`[data-kind="${attributeKind}"]`);
      control.id = `${id}-attribute`;
      control.setAttribute('aria-label', `${side === 'above' ? 'Above' : 'Below'} Target attribute`);
      syncValue(control, source.attribute);
      if (control.tagName === 'HA-ENTITY-ATTRIBUTE-PICKER') {
        control.hass = this.context.hass; control.entityId = source.entity; control.label = 'Attribute'; control.allowCustomValue = true;
        control.hideAttributes = Object.entries(this.context.hass?.states?.[source.entity]?.attributes ?? {})
          .filter(([, value]) => !['string', 'number', 'boolean'].includes(typeof value)).map(([key]) => key);
      } else if (control.list) control.list.innerHTML = getEntityAttributeSuggestions(this.context.hass, source.entity)
        .map(key => `<option value="${escapeAttribute(key)}"></option>`).join('');
    }
    for (const control of group.querySelectorAll('[data-field], [data-kind]')) {
      const field = (control.dataset.field ?? control.dataset.kind).replace(/^entity-/, '').replace(/-text-fallback$/, '').replace(`target-${side}-`, '');
      const property = ['value', 'entity-source', 'attribute'].includes(field) ? 'source' : field;
      const row = control.closest('.field-row');
      const label = row?.querySelector('label');
      if (!label || control.id.endsWith('-text-fallback')) continue;
      let meta = row.querySelector('[data-target-source]');
      if (!meta) { meta = section.ownerDocument.createElement('span'); meta.className = 'paint-property-meta'; meta.dataset.targetSource = property; label.after(meta); }
      meta.textContent = this._directionalPropertySource(scope, side, property);
      meta.classList.toggle('is-overridden', meta.textContent === 'Override');
      if (property === 'source' && field !== 'value') continue;
      let clear = row.querySelector('[data-action="clear-target-property"]');
      if (!clear) {
        clear = section.ownerDocument.createElement('button'); clear.type = 'button'; clear.className = 'paint-clear-override';
        clear.textContent = 'Clear'; clear.dataset.action = 'clear-target-property'; clear.dataset.direction = side;
        clear.dataset.property = property === 'source' && field === 'value' ? 'value' : property;
        clear.dataset.index = scope.type === 'entity' ? scope.index : 'card'; row.append(clear);
      }
      if (property === 'source' && field === 'value') {
        const localParts = readResolvableSourceParts(this.context.read(scope, ['target', `when_${side}`, 'at']));
        clear.hidden = !(localParts.fixed !== undefined && localParts.fixed !== null && localParts.fixed !== ''
          || Number.isFinite(localParts.percent));
      } else clear.hidden = !this._ownsDirectionalProperty(scope, side, property);
    }
    const thresholdSummary = section.querySelector(`#card-group-${id}-threshold-summary`);
    thresholdSummary.textContent = `${this._directionalPropertySource(scope, side, 'source')} · ${source.entity || formatScaleValueInput(source) || 'No threshold'}`;
    section.querySelector(`#card-group-${id}-marker-summary`).textContent = marker.enabled === false ? 'Disabled' : `${this._directionalPropertySource(scope, side, 'show')} · ${marker.shape}`;
  }

  handleField({ field, kind, index, value }) {
    const scope = kind?.startsWith('entity-') ? { type: 'entity', index: Number(index) } : { type: 'card' };
    const control = field ?? kind?.replace(/^entity-/, '');
    const directional = control?.match(/^target-(above|below)-(value|entity-source|attribute|show|shape|direction|color|label-(?:show|text|show-value|show-unit|precision))$/);
    if (directional) { this._setDirectionalField(scope, directional[1], directional[2], value); return true; }
    if (this._handleValueField(control, value, scope)) return true;
    if (control === 'target-inherit') {
      if (value) this._clearTargetOverride(scope);
      else this._setTargetShow(scope, this._getTargetShow(scope));
      return true;
    }
    if (control === 'target-show') { this._setTargetShow(scope, value); return true; }
    if (control === 'target-value') { this._setTargetResolvablePart(scope, 'fixed', value); return true; }
    if (control === 'target-entity-source') { this._setTargetResolvablePart(scope, 'entity', value); return true; }
    if (control === 'target-attribute') { this._setTargetResolvablePart(scope, 'attribute', value); return true; }
    if (control === 'target-shape') { this._setTargetShape(scope, value); return true; }
    if (control === 'target-direction') { this._setMarkerDirection(scope, 'target', value); return true; }
    if (control === 'target-color') { this._setTargetColor(scope, value); return true; }
    const label = control?.match(/^target-label-(show|text|show-value|show-unit|precision)$/);
    if (label) {
      const option = label[1];
      this._setBuiltinMarkerLabelField(scope, 'target', option === 'show-value' ? 'showValue' : option === 'show-unit' ? 'showUnit' : option, value);
      return true;
    }
    return false;
  }

  handleClick(target) {
    if (target?.dataset?.action === 'clear-target-property') {
      const scope = target.dataset.index === 'card' ? { type: 'card' } : { type: 'entity', index: Number(target.dataset.index) };
      if (target.dataset.property === 'value') {
        this._setDirectionalField(scope, target.dataset.direction, 'value', '');
        return true;
      }
      const base = ['target', `when_${target.dataset.direction}`];
      this._remove(scope, [...base, ...this._directionalPropertyPath(target.dataset.property)], {
        deprecatedKeys: target.dataset.property === 'label-precision' ? [[...base, 'marker', 'label', 'decimal']] : [],
        prunePaths: [[...base, 'marker', 'label'], [...base, 'marker'], base, ['target']],
      });
      return true;
    }
    if (target?.dataset?.action !== 'toggle-target-group') return false;
    const group = target.dataset.group;
    if (this._expandedGroups.has(group)) this._expandedGroups.delete(group);
    else this._expandedGroups.add(group);
    this._syncDisclosure(target);
    return true;
  }

  _syncDisclosure(button) {
    const expanded = this._expandedGroups.has(button.dataset.group);
    button.setAttribute('aria-expanded', String(expanded));
    const wrapper = button.closest('.override-group');
    wrapper?.setAttribute('data-expanded', String(expanded));
    const title = button.querySelector('.override-group-title');
    if (title?.textContent) title.textContent = `${expanded ? '▾' : '▸'} ${title.textContent.slice(2)}`;
    if (button.nextElementSibling) button.nextElementSibling.style.display = expanded ? 'grid' : 'none';
  }

  _renderGroup(scope, group, title, content, summary = '') {
    const key = `${scope.type === 'entity' ? `entity-${scope.index}-` : ''}target-${group}`;
    return renderCardGroup({ group: key, title, content, summary, action: 'toggle-target-group' }, this._expandedGroups.has(key));
  }

  _propertySource(scope, property) {
    const owns = at => {
      if (property === 'source') {
        const target = this.context.read(at, ['target']);
        return this.context.read(at, ['target', 'at']) !== undefined
          || target != null && !isObject(target) || this.context.read(at, ['target_entity']) !== undefined;
      }
      const path = property.startsWith('label-') ? ['target', 'label', property.slice(6).replaceAll('-', '_')] : ['target', property];
      return this.context.read(at, path) !== undefined
        || property === 'color' && this.context.read(at, ['target_color']) !== undefined
        || property === 'label-show' && this.context.read(at, ['show_target_label']) !== undefined
        || property === 'label-precision' && this.context.read(at, ['target', 'label', 'decimal']) !== undefined;
    };
    const local = owns(scope);
    const inherited = scope.type === 'entity' && owns({ type: 'card' });
    return local ? inherited ? 'Override' : 'Local' : inherited ? 'Inherited' : 'Default';
  }

  // Both hosts delegate to this section: no second Target field list in a host.
  syncControls(root, scope = { type: 'card' }, options = {}) {
    const prefix = scope.type === 'entity' ? `entity-${scope.index}-` : '';
    const section = root?.querySelector(`#${prefix}target-controls`);
    if (!section) return;
    const source = this._getEffectiveTargetResolvableValue(scope);
    const labels = this._getBuiltinMarkerLabelOptions(scope, 'target');
    const color = this._getEffectiveTargetColorValue(scope) || '#888';
    const values = {
      value: formatScaleValueInput(source), shape: this._getEffectiveTargetShapeValue(scope),
      direction: this._getEffectiveMarkerDirection(scope, 'target'), 'label-text': labels.text, 'label-precision': labels.precision,
    };
    syncColorInput(section, `${prefix}target-color`, color, '#888', options);
    for (const [field, value] of Object.entries(values)) {
      const control = section.querySelector(`#${prefix}target-${field}`);
      if (control && (control !== root.activeElement || options.replaced)
        && !options.numericDrafts?.values?.has(control.id) && !options.cssColorDrafts?.has(control.id)) control.value = String(value ?? '');
    }
    for (const [field, checked] of [['show', this._getTargetShow(scope)], ['inherit', !this._hasTargetOverride(scope)],
      ['label-show', labels.show], ['label-show-value', labels.showValue], ['label-show-unit', labels.showUnit]]) {
      const control = section.querySelector(`#${prefix}target-${field}`);
      if (control) control.checked = checked;
    }
    const kind = `${scope.type === 'entity' ? 'entity-' : ''}target-entity-source`;
    const entityControl = section.querySelector(`input[data-kind="${kind}"]`) ?? section.querySelector(`ha-entity-picker[data-kind="${kind}"]`);
    if (entityControl) {
      entityControl.id = options.entityInputId ?? `${prefix}target-entity`;
      entityControl.setAttribute('aria-label', 'Target entity');
      if (entityControl !== root.activeElement || options.replaced) entityControl.value = source.entity || '';
      if (entityControl.tagName === 'HA-ENTITY-PICKER') {
        entityControl.hass = this.context.hass; entityControl.label = 'Target entity'; entityControl.allowCustomEntity = true;
      }
      const attributeKind = kind.replace('-entity-source', '-attribute');
      let row = section.querySelector('.target-shared-controls .resolvable-source-attribute');
      if (!source.entity) row?.remove();
      else if (row || section.ownerDocument) {
        if (!row) {
          const template = section.ownerDocument.createElement('template');
          template.innerHTML = `<div class="field-row resolvable-source-attribute"><label>Target attribute</label>${renderEntityAttributeInput(
            attributeKind, scope.type === 'entity' ? scope.index : 'card', source.attribute, source.entity, this.context.hass)}</div>`;
          entityControl.closest('.field-row').after(template.content);
          row = section.querySelector('.target-shared-controls .resolvable-source-attribute');
        }
        const control = row.querySelector(`[data-kind="${attributeKind}"]`);
        control?.setAttribute('aria-label', 'Target attribute');
        if (control && (control !== root.activeElement || options.replaced)) control.value = source.attribute ?? '';
        if (control?.tagName === 'HA-ENTITY-ATTRIBUTE-PICKER') {
          control.hass = this.context.hass; control.entityId = source.entity; control.label = 'Target attribute'; control.allowCustomValue = true;
          control.hideAttributes = Object.entries(this.context.hass?.states?.[source.entity]?.attributes ?? {})
            .filter(([, value]) => !['string', 'number', 'boolean'].includes(typeof value)).map(([key]) => key);
        } else if (control?.list) control.list.innerHTML = getEntityAttributeSuggestions(this.context.hass, source.entity)
          .map(key => `<option value="${escapeAttribute(key)}"></option>`).join('');
      }
    }
    for (const control of section.querySelectorAll('.target-shared-controls [data-field], .target-shared-controls [data-kind]')) {
      const field = (control.dataset.field ?? control.dataset.kind).replace(/^entity-/, '').replace(/-text-fallback$/, '').replace(/^target-/, '');
      if (field === 'inherit') continue;
      const property = ['value', 'entity-source', 'attribute'].includes(field) ? 'source' : field === 'show' ? 'enabled' : field;
      const label = control.closest('.field-row')?.querySelector('label');
      if (!label) continue;
      let meta = label.parentElement.querySelector('[data-target-source]');
      if (!meta) { meta = label.ownerDocument.createElement('span'); meta.className = 'paint-property-meta'; meta.dataset.targetSource = property; label.after(meta); }
      meta.textContent = this._propertySource(scope, property);
      meta.classList.toggle('is-overridden', meta.textContent === 'Override');
    }
    for (const [direction, destination] of [['above', TARGET_ABOVE_PAINT], ['below', TARGET_BELOW_PAINT]]) {
      const state = getDestinationEditorState(this.context, scope, destination,
        options.paletteValues?.[direction], options.registry);
      syncPaintEditor(root, `${prefix}target-${direction}-paint-editor`, state, {
        ...options, paletteFields: options.paintChildren ? () => options.paintChildren(scope, direction) : undefined,
      });
      const paintSummary = section.querySelector(`#card-group-${prefix}target-${direction}-summary`);
      if (paintSummary) paintSummary.textContent = state.enabled ? describePaint(state.paint, state.inherited) : 'Paint disabled';
    }
    for (const side of ['above', 'below']) this._syncDirectionalControls(root, section, scope, side, options);
    for (const button of section.querySelectorAll('[data-action="toggle-target-group"]')) this._syncDisclosure(button);
    const summary = section.querySelector(`#card-group-${prefix}target-shared-summary`);
    if (summary) summary.textContent = scope.type === 'entity' ? this._getTargetOverrideSummary(scope) : this._getCardTargetMarkerSummary();
  }

  render(scope = { type: 'card' }, options = {}) {
    const entity = scope.type === 'entity';
    const prefix = entity ? `entity-${scope.index}-` : '';
    const field = name => entity ? `data-kind="entity-target-${name}" data-index="${scope.index}"` : `data-field="target-${name}"`;
    const source = this._getEffectiveTargetResolvableValue(scope);
    const appearance = `
      <div class="field-row"><label for="${prefix}target-shape">Target shape</label><select id="${prefix}target-shape" ${field('shape')} value="${this._getEffectiveTargetShapeValue(scope)}">
        ${['diamond', 'triangle'].map(shape => `<option value="${shape}"${shape === this._getEffectiveTargetShapeValue(scope) ? ' selected' : ''}>${shape}</option>`).join('')}
      </select></div>
      <div class="field-row"><label for="${prefix}target-direction">Direction</label><select id="${prefix}target-direction" ${field('direction')} value="${this._getEffectiveMarkerDirection(scope, 'target')}">
        ${['inward', 'outward'].map(direction => `<option value="${direction}"${direction === this._getEffectiveMarkerDirection(scope, 'target') ? ' selected' : ''}>${direction === 'inward' ? 'Inward' : 'Outward'}</option>`).join('')}
      </select></div>
      <div class="field-row"><label for="${prefix}target-color">Target color</label>${renderColorInput({ label: 'Target color', id: `${prefix}target-color`,
        ...(entity ? { kind: 'entity-target-color', index: scope.index } : { field: 'target-color' }), value: this._getEffectiveTargetColorValue(scope), fallbackHex: '#888' })}</div>`;
    const shared = `<div class="target-shared-controls">
      ${entity ? `<div class="field-row"><div class="toggle"><input id="${prefix}target-inherit" type="checkbox" ${field('inherit')}${this._hasTargetOverride(scope) ? '' : ' checked'}><label for="${prefix}target-inherit">Inherit card settings</label></div></div>` : ''}
      <div class="field-row"><div class="toggle"><input id="${prefix}target-show" type="checkbox" ${field('show')}${this._getTargetShow(scope) ? ' checked' : ''}><label for="${prefix}target-show">Show marker</label></div></div>
      ${renderResolvableSourceControls({ source,
        value: { id: `${prefix}target-value`, ...(entity ? { kind: 'entity-target-value', index: scope.index } : { field: 'target-value' }) },
        entity: { kind: `${entity ? 'entity-' : ''}target-entity-source`, index: entity ? scope.index : 'card' },
        attribute: { kind: `${entity ? 'entity-' : ''}target-attribute`, index: entity ? scope.index : 'card' }, hass: this.context.hass,
        labels: { entity: 'Target entity', attribute: 'Target attribute' }, placeholders: { entity: entity ? 'inherit card default' : 'sensor.example' },
      })}
      ${this._renderGroup(scope, 'appearance', 'Marker appearance', appearance)}
      ${this._renderGroup(scope, 'labels', 'Marker labels', this._renderBuiltinMarkerLabelControls(scope, 'target', 'Target'))}
    </div>`;
    const renderPaint = (direction, destination) => {
      const state = getDestinationEditorState(this.context, scope, destination, options.paletteValues?.[direction], options.registry);
      const binding = property => ({ id: `${prefix}target-${direction}-paint-${property}`,
        ...(entity ? { kind: `entity-target-${direction}-paint-${property}`, index: scope.index } : { field: `target-${direction}-paint-${property}` }) });
      const fields = Object.fromEntries(['preset', 'fill_style', 'color', 'solid_fill', 'opacity'].map(property => [property, binding(property)]));
      if (entity) fields.index = scope.index;
      return { state, markup: renderPaintEditor({ ...state, id: `${prefix}target-${direction}-paint-editor`, root: options.root,
        fields, activation: binding('enabled'), resetLabel: entity ? 'Reset to Card paint settings' : 'Reset to default paint settings',
        paletteFields: state.enabled ? options.paintChildren?.(scope, direction) : null }) };
    };
    const above = renderPaint('above', TARGET_ABOVE_PAINT);
    const below = renderPaint('below', TARGET_BELOW_PAINT);
    return `<div id="${prefix}target-controls">
      ${this._renderGroup(scope, 'shared', 'Shared Target', shared, entity ? this._getTargetOverrideSummary(scope) : this._getCardTargetMarkerSummary())}
      ${this._renderGroup(scope, 'above', 'Above Target', this._renderDirectionalControls(scope, 'above') + above.markup, above.state.enabled ? describePaint(above.state.paint, above.state.inherited) : 'Paint disabled')}
      ${this._renderGroup(scope, 'below', 'Below Target', this._renderDirectionalControls(scope, 'below') + below.markup, below.state.enabled ? describePaint(below.state.paint, below.state.inherited) : 'Paint disabled')}
    </div>`;
  }
}
