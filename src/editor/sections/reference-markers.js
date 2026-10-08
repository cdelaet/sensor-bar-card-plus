import { normalizeMarkerDirection } from '../../config/normalize.js';
import { cloneDeep, isObject, setPathValue, deletePathValue, normalizeNumberValue, normalizeTextValue } from '../shared/editor-config.js';
import { escapeAttribute, normalizeEditorColorValue, renderColorInput, renderEntitySourceInput, renderScalePercentageInput, getColorPickerValue } from '../shared/editor-controls.js';
import { normalizeMarkerLabelField } from '../shared/editor-marker-controls.js';

export function getReferenceMarkerSource(marker) {
    const at = marker?.at;
    if (typeof at === 'string' && /^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s*$/.test(at)) {
      return { mode: 'percent', percent: at.replace(/%/g, '').trim() };
    }
    if (typeof at === 'string' && /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(at.trim())) {
      return { mode: 'entity', entity: at.trim(), fixed: '' };
    }
    const source = isObject(at) ? at : {};
    if (Object.prototype.hasOwnProperty.call(source, 'entity')) {
      return {
        mode: source.fixed !== undefined && source.fixed !== null && source.fixed !== '' ? 'entity-fallback' : 'entity',
        entity: source.entity ?? '',
        fixed: source.fixed ?? '',
      };
    }
    return { mode: 'fixed', fixed: source.fixed ?? '' };
}

// Array semantics and local UI identity; hosts retain persistence/render policy.
export class ReferenceMarkersSection {
  constructor(context, ui, options = {}) {
    this.options = options;
    this.context = context;
    this.ui = ui;
    this._genericMarkerUiIds = new Map();
    this._expandedGenericMarkerUiIds = new Set();
    this._nextGenericMarkerUiId = 0;
  }
  reset() { this._genericMarkerUiIds.clear(); this._expandedGenericMarkerUiIds.clear(); }
  _getShadowElementById(id) { return this.ui.root()?.getElementById?.(id) ?? this.ui.root()?.querySelector(`#${id}`); }
  render(scope = { type: 'card' }) { return this._renderGenericMarkersEditor(scope); }
  _hasMarkersOverride(scope) {
    return scope?.type === 'entity'
      && this.context.read(scope, ['markers']) !== undefined;
  }

  _getGenericMarkers(scope, effective = true) {
    const local = this.context.read(scope, ['markers']);
    if (scope?.type === 'entity' && local === undefined && effective) {
      const cardMarkers = this.context.read({ type: 'card' }, ['markers']);
      return Array.isArray(cardMarkers) ? cloneDeep(cardMarkers) : [];
    }
    return Array.isArray(local) ? cloneDeep(local) : [];
  }

  _getGenericMarkersSummary(scope) {
    if (scope?.type === 'entity' && !this._hasMarkersOverride(scope)) return 'Inherited';
    const count = this._getGenericMarkers(scope, false).length;
    return count === 0 ? 'No reference markers' : `${count} reference marker${count === 1 ? '' : 's'}`;
  }

  _getGenericMarkerScopeKey(scope) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getGenericMarkerUiIds(scope, count) {
    const key = this._getGenericMarkerScopeKey(scope);
    const ids = this._genericMarkerUiIds.get(key) ?? [];
    while (ids.length < count) {
      ids.push(`marker-${++this._nextGenericMarkerUiId}`);
    }
    ids.length = count;
    this._genericMarkerUiIds.set(key, ids);
    return ids;
  }

  _resetGenericMarkerUiScope(scope) {
    const key = this._getGenericMarkerScopeKey(scope);
    const ids = this._genericMarkerUiIds.get(key) ?? [];
    ids.forEach((id) => this._expandedGenericMarkerUiIds.delete(id));
    this._genericMarkerUiIds.delete(key);
  }

  _getGenericMarkerSummary(marker) {
    const source = this._getGenericMarkerSource(marker);
    const lane = marker?.lane === 'above' ? 'Above' : 'Below';
    const shape = marker?.shape ?? 'circle';
    let sourceSummary;
    if (source.mode === 'percent') {
      sourceSummary = source.percent === '' ? 'Percentage' : `${source.percent}%`;
    } else if (source.mode === 'entity' || source.mode === 'entity-fallback') {
      sourceSummary = source.entity || 'Entity';
    } else {
      sourceSummary = source.fixed === '' ? 'Fixed value' : String(source.fixed);
    }
    return `${lane} · ${shape.charAt(0).toUpperCase()}${shape.slice(1)} · ${sourceSummary}`;
  }

  _refreshGenericMarkerSummary(scope, markerIndex) {
    const markers = this._getGenericMarkers(scope);
    const marker = markers[markerIndex];
    const uiId = this._getGenericMarkerUiIds(scope, markers.length)[markerIndex];
    const summary = this._getShadowElementById(`generic-${uiId}-summary`);
    if (marker && summary) {
      const text = this._getGenericMarkerSummary(marker);
      // Keep the pressed text node mounted through focusout synchronization.
      // WebKit can cancel the following click if that text is replaced.
      if (summary.textContent !== text) summary.textContent = text;
      summary.setAttribute('title', text);
    }
  }

  _getGenericMarkerSource(marker) {
    return this.context.source({ type: 'card' }, { type: 'reference-marker', marker });
  }

  _renderGenericMarkersEditor(scope) {
    const scopeType = scope.type;
    const scopeIndex = scopeType === 'entity' ? scope.index : 'card';
    const markers = this._getGenericMarkers(scope);
    const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
    const override = this._hasMarkersOverride(scope);
    const rows = markers.map((marker, markerIndex) => {
      const source = this._getGenericMarkerSource(marker);
      const markerUiId = markerUiIds[markerIndex];
      const rowId = `${scopeType}-${scopeIndex}-generic-${markerUiId}`;
      const expanded = this._expandedGenericMarkerUiIds.has(markerUiId);
      const entitySource = (source.mode === 'entity' || source.mode === 'entity-fallback')
        ? renderEntitySourceInput('generic-marker-entity', scopeIndex, source.entity, 'sensor.reference', {
          'scope-type': scopeType,
          'marker-index': markerIndex,
        })
        : '';
      const labelEntitySource = renderEntitySourceInput(
        'generic-marker-label-entity', scopeIndex, marker?.label?.entity ?? '', 'sensor.information', {
          'scope-type': scopeType,
          'marker-index': markerIndex,
        }
      );
      return `
        <div class="generic-marker-item" data-marker-ui-id="${markerUiId}" data-expanded="${expanded ? 'true' : 'false'}">
          <div class="generic-marker-header">
            <button type="button" class="generic-marker-toggle" data-action="toggle-generic-marker" data-marker-ui-id="${markerUiId}" aria-expanded="${expanded ? 'true' : 'false'}">
              <span class="generic-marker-title">Reference marker ${markerIndex + 1}</span>
              <span id="generic-${markerUiId}-summary" class="generic-marker-summary" title="${escapeAttribute(this._getGenericMarkerSummary(marker))}">${escapeAttribute(this._getGenericMarkerSummary(marker))}</span>
            </button>
            <div class="generic-marker-actions">
              <button type="button" data-action="move-generic-marker-up" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${markerIndex === 0 ? ' disabled' : ''} aria-label="Move marker up">↑</button>
              <button type="button" data-action="move-generic-marker-down" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${markerIndex === markers.length - 1 ? ' disabled' : ''} aria-label="Move marker down">↓</button>
              <button type="button" data-action="remove-generic-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" aria-label="Remove marker">Remove</button>
            </div>
          </div>
          <div class="generic-marker-body" style="display:${expanded ? 'grid' : 'none'};">
            <div class="field-row">
              <label for="${rowId}-source-mode">Source</label>
              <select id="${rowId}-source-mode" data-kind="generic-marker-source-mode" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
              <option value="fixed"${source.mode === 'fixed' ? ' selected' : ''}>Fixed</option>
              <option value="entity"${source.mode === 'entity' ? ' selected' : ''}>Entity</option>
              <option value="entity-fallback"${source.mode === 'entity-fallback' ? ' selected' : ''}>Entity with fixed fallback</option>
              <option value="percent"${source.mode === 'percent' ? ' selected' : ''}>Percentage</option>
              </select>
            </div>
            ${source.mode === 'fixed' ? `
              <div class="field-row">
                <label for="${rowId}-fixed">Fixed value</label>
                <input id="${rowId}-fixed" type="number" step="any" data-kind="generic-marker-fixed" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(source.fixed)}">
              </div>` : ''}
          ${source.mode === 'entity' || source.mode === 'entity-fallback' ? `
            <div class="field-row">
              <label>Reference marker entity</label>
              ${entitySource}
            </div>` : ''}
          ${source.mode === 'entity-fallback' ? `
            <div class="field-row">
              <label for="${rowId}-fallback">Fixed fallback</label>
              <input id="${rowId}-fallback" type="number" step="any" data-kind="generic-marker-fallback" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(source.fixed)}">
            </div>` : ''}
          ${source.mode === 'percent' ? `
            <div class="field-row">
              <label for="${rowId}-percent">Scale percentage</label>
              ${renderScalePercentageInput(`${rowId}-percent`, `data-kind="generic-marker-percent" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"`, source.percent)}
            </div>` : ''}
          <div class="inline-row generic-marker-pair">
            <div class="field-row">
              <label for="${rowId}-lane">Lane</label>
              <select id="${rowId}-lane" data-kind="generic-marker-lane" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
                <option value="above"${marker?.lane === 'above' ? ' selected' : ''}>Above</option>
                <option value="below"${(marker?.lane ?? 'below') === 'below' ? ' selected' : ''}>Below</option>
              </select>
            </div>
            <div class="field-row">
              <label for="${rowId}-direction">Direction</label>
              <select id="${rowId}-direction" data-kind="generic-marker-direction" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${normalizeMarkerDirection(marker?.direction)}">
                <option value="inward"${(marker?.direction ?? 'inward') === 'inward' ? ' selected' : ''}>Inward</option>
                <option value="outward"${marker?.direction === 'outward' ? ' selected' : ''}>Outward</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label for="${rowId}-shape">Shape</label>
            <select id="${rowId}-shape" data-kind="generic-marker-shape" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
              ${['circle', 'diamond', 'triangle', 'chevron', 'arrow', 'pin'].map((shape) => `<option value="${shape}"${(marker?.shape ?? 'circle') === shape ? ' selected' : ''}>${shape}</option>`).join('')}
            </select>
          </div>
          <div class="field-row">
            <label for="${rowId}-color">Color</label>
            ${renderColorInput({ cssText: this.options.cssText, label: 'Reference marker color',
              id: `${rowId}-color`,
              kind: 'generic-marker-color',
              index: scopeIndex,
              value: marker?.color ?? '#888888',
              fallbackHex: '#888888',
              placeholder: '#888888',
              extraDataset: { 'scope-type': scopeType, 'marker-index': markerIndex },
            })}
          </div>
          <div class="field-row"><div class="toggle">
            <input id="${rowId}-show-marker" type="checkbox" data-kind="generic-marker-show-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${marker?.show_marker === false ? '' : ' checked'}>
            <label for="${rowId}-show-marker">Show marker shape</label>
          </div></div>
          <div class="field-row"><div class="toggle">
            <input id="${rowId}-label-show" type="checkbox" data-kind="generic-marker-label-show" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${marker?.label?.show === true ? ' checked' : ''}>
            <label for="${rowId}-label-show">Show label</label>
          </div></div>
          <div class="field-row"><label for="${rowId}-label-text">Label text</label>
            <input id="${rowId}-label-text" type="text" data-kind="generic-marker-label-text" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(marker?.label?.text ?? '')}" placeholder="optional semantic text">
          </div>
          <div class="field-row">
            <label>Label content entity</label>
            ${labelEntitySource}
          </div>
          <div class="inline-row generic-marker-options">
            <div class="field-row"><div class="toggle">
              <input id="${rowId}-label-show-value" type="checkbox" data-kind="generic-marker-label-show-value" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${marker?.label?.show_value === false ? '' : ' checked'}>
              <label for="${rowId}-label-show-value">Show value</label>
            </div></div>
            <div class="field-row"><div class="toggle">
              <input id="${rowId}-label-show-unit" type="checkbox" data-kind="generic-marker-label-show-unit" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${marker?.label?.show_unit === false ? '' : ' checked'}>
              <label for="${rowId}-label-show-unit">Show raw unit</label>
            </div></div>
            <div class="field-row generic-marker-precision"><label for="${rowId}-label-precision">Label precision</label>
              <input id="${rowId}-label-precision" type="number" min="0" step="1" data-kind="generic-marker-label-precision" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(marker?.label?.precision ?? marker?.label?.decimal ?? '')}" placeholder="inherit">
            </div>
          </div>
          </div>
        </div>`;
    }).join('');

    const inheritControl = scopeType === 'entity' ? `
      <div class="field-row">
        <div class="toggle">
          <input id="entity-${scopeIndex}-markers-inherit" type="checkbox" data-kind="entity-markers-inherit" data-index="${scopeIndex}"${override ? '' : ' checked'}>
          <label for="entity-${scopeIndex}-markers-inherit">Inherit card markers</label>
        </div>
      </div>` : '';
    const overrideNote = scopeType === 'entity' && !override
      ? '<div class="section-note">Enable the override to replace the card marker list. An empty override clears all card markers.</div>'
      : '';
    return `
      ${inheritControl}
      ${overrideNote}
      ${scopeType === 'card' || override ? `
        <div class="section-note">Up to four markers render in each lane, including Peak, Floor, and Target. Excess generic markers remain editable and show a warning. Unresolved markers still reserve a slot and lane.</div>
        <div class="list generic-marker-list">${rows}</div>
        <button type="button" data-action="add-generic-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}">Add reference marker</button>` : ''}
    `;
  }

  _getGenericMarkerScope(target) {
    return target?.dataset?.scopeType === 'entity'
      ? { type: 'entity', index: Number(target.dataset.index) }
      : { type: 'card' };
  }

  _setGenericMarkerList(scope, markers, options = {}) {
    const changed = this.context.mutate(scope, target => setPathValue(target, ['markers'], markers), { ...options, rerender: false });
    if (changed && options.rerender) this.ui.render(scope);
    return changed;
  }

  _updateGenericMarker(scope, markerIndex, update, options = {}) {
    const markers = this._getGenericMarkers(scope);
    if (!markers[markerIndex]) return false;
    const marker = isObject(markers[markerIndex]) ? cloneDeep(markers[markerIndex]) : {};
    const nextMarker = update(marker) ?? marker;
    markers[markerIndex] = nextMarker;
    const changed = this._setGenericMarkerList(scope, markers, options);
    if (changed) this._refreshGenericMarkerSummary(scope, markerIndex);
    return changed;
  }

  _setGenericMarkerSourceMode(scope, markerIndex, mode) {
    return this._updateGenericMarker(scope, markerIndex, (marker) => {
      if (mode === 'percent') {
        marker.at = '50%';
        return marker;
      }
      const oldAt = isObject(marker.at) ? cloneDeep(marker.at) : {};
      if (mode === 'fixed') {
        delete oldAt.entity;
        delete oldAt.percent;
        if (oldAt.fixed === undefined) oldAt.fixed = 50;
      } else {
        delete oldAt.percent;
        if (!oldAt.entity) oldAt.entity = '';
        if (mode === 'entity') delete oldAt.fixed;
        if (mode === 'entity-fallback' && oldAt.fixed === undefined) oldAt.fixed = 50;
      }
      marker.at = oldAt;
      return marker;
    }, { rerender: true, referenceMarkerEdit: { type: 'mode', index: markerIndex, value: mode } });
  }

  _toggleGenericMarkerExpanded(markerUiId) {
    if (this._expandedGenericMarkerUiIds.has(markerUiId)) {
      this._expandedGenericMarkerUiIds.delete(markerUiId);
    } else {
      this._expandedGenericMarkerUiIds.add(markerUiId);
    }
    const row = this.ui.root()?.querySelector(`.generic-marker-item[data-marker-ui-id="${markerUiId}"]`);
    if (row?.querySelector) {
      const expanded = this._expandedGenericMarkerUiIds.has(markerUiId);
      row.setAttribute('data-expanded', String(expanded));
      row.querySelector('.generic-marker-toggle').setAttribute('aria-expanded', String(expanded));
      row.querySelector('.generic-marker-body').style.display = expanded ? 'grid' : 'none';
    } else this.ui.render();
  }
  // Standalone's historical source writer; Feature supplies its patch-only writer
  // through the existing setSource operation instead.
  _setGenericMarkerSourcePart(scope, markerIndex, part, rawValue) {
    return this._updateGenericMarker(scope, markerIndex, marker => {
      const value = part === 'entity' ? normalizeTextValue(rawValue).trim() || undefined : normalizeNumberValue(rawValue) ?? undefined;
      if (part === 'percent') { marker.at = value === undefined ? null : `${value}%`; return marker; }
      const at = isObject(marker.at) ? cloneDeep(marker.at) : {};
      if (value === undefined) delete at[part]; else at[part] = value;
      marker.at = Object.keys(at).length ? at : null;
      return marker;
    });
  }

  _setGenericMarkerField(scope, markerIndex, kind, value) {
    const field = kind.replace(/^generic-marker-/, '');
    if (field === 'source-mode') return this._setGenericMarkerSourceMode(scope, markerIndex, value);
    if (['fixed', 'fallback', 'entity', 'percent'].includes(field)) {
      return this.context.setSource(scope, { type: 'reference-marker', index: markerIndex }, field === 'fallback' ? 'fixed' : field, value);
    }
    let path, normalized;
    if (field === 'show-marker') { path = ['show_marker']; normalized = value === false ? false : undefined; }
    else if (['lane', 'shape', 'direction'].includes(field)) { path = [field]; normalized = field === 'direction' ? normalizeMarkerDirection(value) : value; }
    else if (field === 'color') { path = ['color']; normalized = normalizeEditorColorValue(value, this.options.cssText); }
    else if (field.startsWith('label-')) {
      const labelField = field.slice(6).replace('show-value', 'show_value').replace('show-unit', 'show_unit');
      if (!['show', 'text', 'entity', 'show_value', 'show_unit', 'precision'].includes(labelField)) return false;
      path = ['label', labelField]; normalized = normalizeMarkerLabelField(labelField, value);
      if ((['text', 'entity'].includes(labelField) && !normalized) || normalized === null) normalized = undefined;
    } else return false;
    return this._updateGenericMarker(scope, markerIndex, marker => {
      if (path[0] === 'label') {
        const label = isObject(marker.label) ? cloneDeep(marker.label) : {};
        if (normalized === undefined) delete label[path[1]]; else label[path[1]] = normalized;
        if (path[1] === 'precision') delete label.decimal;
        marker.label = label;
      } else if (normalized === undefined) delete marker[path[0]]; else marker[path[0]] = normalized;
      return marker;
    }, { referenceMarkerEdit: { type: 'field', index: markerIndex, path, value: normalized } });
  }

  handleField({ target, kind, value }) {
    if (kind === 'entity-markers-inherit') {
      const scope = { type: 'entity', index: Number(target.dataset.index) };
      this._resetGenericMarkerUiScope(scope);
      if (value) this.context.mutate(scope, config => deletePathValue(config, ['markers']), { rerender: true });
      else this._setGenericMarkerList(scope, this._getGenericMarkers(scope), { rerender: true });
      return true;
    }
    if (!kind?.startsWith('generic-marker-')) return false;
    this._setGenericMarkerField(this._getGenericMarkerScope(target), Number(target.dataset.markerIndex), kind, value);
    return true;
  }

  handleClick(target) {
    const action = target?.dataset?.action;
    if (target?.disabled) return false;
    if (action === 'toggle-generic-marker') { this._toggleGenericMarkerExpanded(target.dataset.markerUiId); return true; }
    if (action === 'add-generic-marker') {
      const scope = this._getGenericMarkerScope(target);
      const markers = this._getGenericMarkers(scope);
      const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
      markers.push({ at: { fixed: 50 } });
      const markerUiId = `marker-${++this._nextGenericMarkerUiId}`;
      markerUiIds.push(markerUiId);
      this._expandedGenericMarkerUiIds.add(markerUiId);
      this._setGenericMarkerList(scope, markers, { rerender: true, referenceMarkerEdit: { type: 'add' } });
      return true;
    }

    if (action === 'remove-generic-marker' || action === 'move-generic-marker-up' || action === 'move-generic-marker-down') {
      const scope = this._getGenericMarkerScope(target);
      const markerIndex = Number(target.dataset.markerIndex);
      const markers = this._getGenericMarkers(scope);
      const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
      if (action === 'remove-generic-marker') {
        markers.splice(markerIndex, 1);
        this._expandedGenericMarkerUiIds.delete(markerUiIds[markerIndex]);
        markerUiIds.splice(markerIndex, 1);
      } else {
        const nextIndex = markerIndex + (action === 'move-generic-marker-up' ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= markers.length) return true;
        [markers[markerIndex], markers[nextIndex]] = [markers[nextIndex], markers[markerIndex]];
        [markerUiIds[markerIndex], markerUiIds[nextIndex]] = [markerUiIds[nextIndex], markerUiIds[markerIndex]];
      }
      this._setGenericMarkerList(scope, markers, { rerender: true, referenceMarkerEdit: { type: action === 'add-generic-marker' ? 'add' : action === 'remove-generic-marker' ? 'remove' : 'move', index: Number(target.dataset.markerIndex), delta: action === 'move-generic-marker-up' ? -1 : 1 } });
      return true;
    }
    return false;
  }
  // Reconcile only Reference rows. UI IDs own rows; field routing owns each
  // direct body group. Keep unchanged controls mounted, including Source, so
  // Safari never loses the editing row's viewport anchor during a mode change.
  syncStructure(scope = { type: 'card' }) {
    const root = this.ui.root();
    const wrapper = root?.querySelector(scope.type === 'entity'
      ? `.entity-shell[data-entity-shell-index="${scope.index}"] .override-group[data-group="markers"]`
      : '.card-subgroup[data-group="generic-markers"]');
    const list = wrapper?.querySelector?.('.generic-marker-list');
    if (!list?.ownerDocument) return false;
    const markers = this._getGenericMarkers(scope), ids = this._getGenericMarkerUiIds(scope, markers.length);
    const template = list.ownerDocument.createElement('template');
    template.innerHTML = this.render(scope);
    const nextRows = template.content.querySelectorAll('.generic-marker-item');
    const oldRows = new Map(Array.from(list.children, row => [row.dataset.markerUiId, row]));
    const active = root.activeElement;
    const owner = active?.closest?.('.generic-marker-item');
    const focus = owner && { id: owner.dataset.markerUiId, kind: active.dataset.kind, action: active.dataset.action };
    let cursor = list.firstElementChild;
    for (const next of nextRows) {
      const id = next.dataset.markerUiId;
      const row = oldRows.get(id) ?? next;
      oldRows.delete(id);
      if (row !== next) {
        row.querySelector('.generic-marker-title').textContent = next.querySelector('.generic-marker-title').textContent;
        for (const button of row.querySelectorAll('.generic-marker-actions button')) {
          const updated = next.querySelector(`[data-action="${button.dataset.action}"]`);
          button.dataset.markerIndex = updated.dataset.markerIndex;
          button.disabled = updated.disabled;
        }
        const body = row.querySelector('.generic-marker-body');
        const groupKey = group => group.querySelector('[data-kind]')?.dataset.kind;
        const groups = new Map(Array.from(body.children, group => [groupKey(group), group]));
        let fieldCursor = body.firstElementChild;
        for (const nextGroup of Array.from(next.querySelector('.generic-marker-body').children)) {
          const field = groupKey(nextGroup);
          const group = groups.get(field) ?? nextGroup;
          // A late HA picker definition changes the element type, not ownership.
          const oldControl = group.querySelector('[data-kind]'), newControl = nextGroup.querySelector('[data-kind]');
          const mounted = oldControl?.tagName === newControl?.tagName ? group : nextGroup;
          groups.delete(field);
          if (mounted !== fieldCursor) body.insertBefore(mounted, fieldCursor);
          if (mounted !== group) group.remove();
          fieldCursor = mounted.nextElementSibling;
        }
        for (const group of groups.values()) group.remove();
      }
      const index = ids.indexOf(id);
      for (const control of row.querySelectorAll('[data-marker-index]')) control.dataset.markerIndex = String(index);
      const expanded = this._expandedGenericMarkerUiIds.has(id);
      row.setAttribute('data-expanded', String(expanded));
      row.querySelector('.generic-marker-toggle').setAttribute('aria-expanded', String(expanded));
      row.querySelector('.generic-marker-body').style.display = expanded ? 'grid' : 'none';
      if (row !== cursor) list.insertBefore(row, cursor);
      cursor = row.nextElementSibling;
    }
    for (const row of oldRows.values()) row.remove();
    // Moving a row can blur its control. Recover within that same surviving UI
    // ID only; removal intentionally has no other-row focus fallback.
    if (focus && active !== root.activeElement) {
      const row = list.querySelector(`[data-marker-ui-id="${focus.id}"]`);
      const control = focus.kind ? row?.querySelector(`[data-kind="${focus.kind}"]`)
        : focus.action ? row?.querySelector(`[data-action="${focus.action}"]`) : null;
      control?.focus?.({ preventScroll: true });
    }
    return true;
  }

  // Hosts call this during their existing synchronization pass. It does not
  // replace nodes, observe DOM or persist display defaults.
  syncControls(hass, replaced = false, scope = { type: 'card' }) {
    const root = this.ui.root();
    const prefix = `${scope.type}-${scope.type === 'entity' ? scope.index : 'card'}-generic-`;
    if (!root) return;
    const markers = this._getGenericMarkers(scope), ids = this._getGenericMarkerUiIds(scope, markers.length);
    markers.forEach((marker, index) => {
      const source = this._getGenericMarkerSource(marker), label = marker?.label ?? {};
      const values = {
        'source-mode': source.mode, fixed: source.fixed ?? '', fallback: source.fixed ?? '', percent: source.percent ?? '',
        lane: marker?.lane ?? 'below', shape: marker?.shape ?? 'circle', direction: normalizeMarkerDirection(marker?.direction),
        color: getColorPickerValue(marker?.color, '#888888'), 'color-text-fallback': marker?.color ?? '#888888',
        'label-text': label.text ?? '', 'label-precision': label.precision ?? label.decimal ?? '',
      };
      for (const [field, value] of Object.entries(values)) {
        const control = root.querySelector(`#${prefix}${ids[index]}-${field}`);
        if (control && (control !== root.activeElement || replaced)) control.value = String(value);
      }
      for (const [field, checked] of [['show-marker', marker?.show_marker !== false], ['label-show', label.show === true],
        ['label-show-value', label.show_value !== false], ['label-show-unit', label.show_unit !== false]]) {
        const control = root.querySelector(`#${prefix}${ids[index]}-${field}`);
        if (control) control.checked = checked;
      }
      for (const [field, value, title] of [['entity', source.entity ?? '', 'Reference marker entity'], ['label-entity', label.entity ?? '', 'Label content entity']]) {
        for (const tag of ['input', 'ha-entity-picker']) for (const control of Array.from(root.querySelectorAll(`${tag}[data-kind="generic-marker-${field}"]`)).filter(control => Number(control.dataset.markerIndex) === index && control.dataset.scopeType === scope.type && String(control.dataset.index) === String(scope.type === 'entity' ? scope.index : 'card'))) {
          control.id = `${prefix}${ids[index]}-${field}`;
          control.setAttribute('aria-label', title);
          if (control !== root.activeElement || replaced) control.value = value;
          if (tag === 'ha-entity-picker') { control.hass = hass; control.label = title; control.allowCustomEntity = true; }
        }
      }
      this._refreshGenericMarkerSummary(scope, index);
    });
  }

}
