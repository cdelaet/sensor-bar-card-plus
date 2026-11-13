import { getEffectiveFillStyleValue } from '../sections/bar-appearance.js';
import { serializeConfig } from './editor-config.js';

let paletteGeneration = 0;

export class PaletteRowSession {
  constructor() {
    this.generation = ++paletteGeneration;
    this.drafts = new Map();
    this.snapshot = null;
  }

  reconcile(rows) {
    const snapshot = rows.map(row => serializeConfig(row));
    const changed = this.snapshot && serializeConfig(snapshot) !== serializeConfig(this.snapshot);
    if (changed) {
      this.generation = ++paletteGeneration;
      this.drafts.clear();
    }
    this.snapshot = snapshot;
    return !!changed;
  }

  record(rows) {
    this.snapshot = rows.map(row => serializeConfig(row));
  }

  setDraft(index, field, value) {
    if (!this.drafts.has(index)) this.drafts.set(index, new Map());
    this.drafts.get(index).set(field, value);
  }
  getDraft(index, field) {
    return this.drafts.get(index)?.get(field);
  }
  clearDraft(index, field) {
    this.drafts.get(index)?.delete(field);
    if (!this.drafts.get(index)?.size) this.drafts.delete(index);
  }
}

// Narrow UI/session boundary: sections own drafts; hosts own DOM replacement,
// focus restoration and persistence. The four-operation section context stays intact.
export class PaletteSection {
  constructor(context, ui, array) {
    this.context = context;
    this.ui = ui;
    this.array = array;
    this._reconcilingRows = false;
  }
  get shadowRoot() { return this.ui.root(); }
  fillStyle(scope) { return getEffectiveFillStyleValue(this.context, scope); }
  _getShadowElementById(id) { return this.shadowRoot?.getElementById?.(id) ?? this.shadowRoot?.querySelector(`#${id}`); }
  _renderListRows(items, renderItem) { return items.map(renderItem).join(''); }

  _syncRows(scope, { inputSelector, rowSelector, draftSelector, memberSelector, generation }) {
    const root = this.shadowRoot;
    if (!root?.ownerDocument) return false;
    const template = root.ownerDocument.createElement('template');
    template.innerHTML = this.render(scope, ({ content }) => content, { section: false });
    const desired = [...template.content.querySelectorAll(rowSelector)].filter(row => row.querySelector(inputSelector));
    const members = [...template.content.querySelectorAll(memberSelector)];
    const draftContainerSelector = rowSelector === '.segment-editor-row' ? '.segment-draft' : '.gradient-stop-draft';
    const desiredDraft = template.content.querySelector(draftSelector)?.closest(draftContainerSelector);
    for (const member of members) {
      member.dataset.paletteGeneration = String(generation);
      for (const control of member.querySelectorAll('input, button')) {
        control.dataset.paletteGeneration = String(generation);
      }
      const rowInput = member.querySelector('[data-segment-index], [data-stop-index], [data-kind="segment-from"], [data-kind="gradient-pos"]');
      const rowIndex = Number(rowInput?.dataset.segmentIndex ?? rowInput?.dataset.stopIndex ?? rowInput?.dataset.index);
      if (Number.isInteger(rowIndex)) member.dataset.paletteIndex = String(rowIndex);
    }
    if (desiredDraft) {
      desiredDraft.dataset.paletteGeneration = String(generation);
      for (const control of desiredDraft.querySelectorAll('input, button')) control.dataset.paletteGeneration = String(generation);
    }
    const liveInputs = [...root.querySelectorAll(inputSelector)];
    const liveRows = liveInputs.map(input => input.closest(rowSelector)).filter(Boolean);
    const draft = root.querySelector(draftSelector);
    const list = liveRows[0]?.parentElement ?? draft?.closest('.list')
      ?? root.querySelector(memberSelector ? `:scope ${memberSelector}` : rowSelector)?.parentElement;
    if (!list) return false;
    const liveMembers = [...list.children].filter(item => item.matches(memberSelector));
    const liveDraft = list.querySelector(`:scope > ${draftContainerSelector}`);
    const generationChanged = liveMembers.some(item => item.dataset.paletteGeneration !== String(generation))
      || liveDraft?.dataset.paletteGeneration !== String(generation);
    for (const member of liveMembers) if (member.dataset.paletteGeneration === String(generation)) {
      for (const control of member.querySelectorAll('input, button')) control.dataset.paletteGeneration = String(generation);
    }
    if (liveDraft?.dataset.paletteGeneration === String(generation)) {
      for (const control of liveDraft.querySelectorAll('input, button')) control.dataset.paletteGeneration = String(generation);
    }
    if (!generationChanged && liveMembers.length === members.length
      && liveMembers.every(item => item.dataset.paletteGeneration === String(generation))) return false;

    this._reconcilingRows = true;
    try {
      liveMembers.forEach(item => item.remove());
      if (generationChanged) liveDraft?.remove();
      const draftAnchor = list.querySelector(':scope > .segment-draft, :scope > .gradient-stop-draft');
      members.forEach(member => list.insertBefore(member.cloneNode(true), draftAnchor));
      if (generationChanged && desiredDraft) list.appendChild(desiredDraft.cloneNode(true));
    } finally {
      this._reconcilingRows = false;
    }
    return true;
  }

  handle(event, mode = event.type) {
    const target = event.target;
    if (this._reconcilingRows || this.ui.isRendering?.() || target?.isConnected === false) return true;
    if (mode === 'input' && target?.type === 'checkbox') return false;
    const rawKind = target?.dataset?.kind;
    const kind = rawKind?.replace(/-text-fallback$/, '');
    const action = target?.dataset?.action;
    const segment = !!this._getScopedSegmentsValue;
    const prefix = segment ? 'segment' : 'gradient';
    const isEntity = (mode === 'click' ? action : kind)?.includes('entity-');
    const scope = isEntity ? { type: 'entity', index: Number(target.dataset.index) } : { type: 'card' };
    const local = kind?.replace(/^entity-/, '');
    const index = Number(isEntity ? target.dataset[segment ? 'segmentIndex' : 'stopIndex'] : target?.dataset?.index);
    const rows = () => segment ? this._getScopedSegmentsValue(scope) : this._getScopedGradientStopsValue(scope);
    const write = (next, options, operation) => segment
      ? this._setScopedSegments(scope, next, options, operation)
      : this._setScopedGradientStops(scope, next, options, operation);
    const commit = () => segment ? this._commitSegmentDraft(scope) : this._commitGradientStopDraft(scope);
    const refresh = () => segment ? this._refreshSegmentUi(scope) : this._refreshGradientDraftUi(scope);
    if (mode === 'click') {
      if (!['add-segment', 'remove-segment', 'add-entity-segment', 'remove-entity-segment',
        'add-segment-from-undefined', 'add-entity-segment-from-undefined',
        'add-gradient-stop', 'remove-gradient-stop', 'add-entity-gradient-stop', 'remove-entity-gradient-stop'].includes(action)
        || !action.includes(prefix)) return false;
      const session = this._getPaletteSession(scope, rows());
      if (Number(target?.dataset?.paletteGeneration) !== session.generation) return true;
      if (action.startsWith('add-')) {
        if (segment && action.endsWith('-from-undefined')) {
          if (!this._isCurrentSegmentGap(scope, target)) return true;
          this._prepareSegmentDraftFromUndefined(scope, target.dataset.from, target.dataset.to, Number(target.dataset.insertIndex));
          this.ui.focus(`#${isEntity ? `entity-${scope.index}-` : ''}${prefix}-draft-from`);
        } else {
          this.ui.focus(`#${isEntity ? `entity-${scope.index}-` : ''}${prefix}-draft-${segment ? 'from' : 'pos'}`);
          commit();
        }
      } else {
        if (segment && !this._isCurrentSegmentRow(scope, index, target)
          || !segment && !this._isCurrentGradientStopRow(scope, index, target)) {
          this.syncRows?.(scope);
          return true;
        }
        write(rows().filter((_, i) => i !== index), { rerender: true, ...(segment ? { sort: true } : {}) }, { type: 'remove', index });
      }
      return true;
    }
    if (kind === `entity-${segment ? 'segments' : 'gradient-stops'}-inherit`) {
      if (target.checked) segment ? this._clearSegmentsOverride(scope) : this._clearGradientStopsOverride(scope);
      return true;
    }
    if (!local?.startsWith(`${prefix}-`)) return false;
    const draft = local.startsWith(`${prefix}-draft-`);
    const field = local.slice((draft ? `${prefix}-draft-` : `${prefix}-`).length);
    const value = event.detail?.value ?? target.value;
    const session = this._getPaletteSession(scope, rows());
    if (Number(target?.dataset?.paletteGeneration) !== session.generation) return true;
    if (segment && !draft && !this._isCurrentSegmentRow(scope, index, target)
      || !segment && !draft && !this._isCurrentGradientStopRow(scope, index, target)) {
      this.syncRows?.(scope);
      return true;
    }
    if (mode === 'keydown') {
      if (event.key === 'Escape' && draft) {
        event.preventDefault?.();
        if (segment) this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
        else this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), this._createGradientStopDraftState(scope));
        this.ui.render();
      } else if (event.key === 'Enter') {
        event.preventDefault?.();
        if (draft) commit();
        else if (segment && ['from', 'to'].includes(field)) this._commitSegmentBoundaryEdit(scope, index, field, value, target);
        else if (!segment && field === 'pos') this._commitGradientStopPosEdit(scope, index, value, target);
      }
      return true;
    }
    if (draft) {
      if (segment) this._setSegmentDraftField(scope, field, value);
      else this._setGradientStopsDraftField(scope, field, value);
      return true;
    }
    if (segment && ['from', 'to'].includes(field) || !segment && field === 'pos') {
      if (mode === 'input') {
        if (segment) { this._setSegmentBoundaryText(scope, index, field, value); refresh(); }
        else this._setGradientStopPosText(scope, index, value);
      } else if (mode === 'change') {
        if (segment) this._commitSegmentBoundaryEdit(scope, index, field, value, target);
        else this._commitGradientStopPosEdit(scope, index, value, target);
      }
      return true;
    }
    // Preserve standalone gradient color canonicalization; the raw adapter uses
    // the operation, so incidental display normalization never reaches Feature config.
    const current = rows();
    const next = current.map((row, i) => i !== index ? row : segment ? { ...row, color: value }
      : { ...row, pos: this._normalizeGradientStopPosValue(row?.pos) ?? 0, color: field === 'color' ? value : row?.color ?? '#4a9eff' });
    if (segment || serializeConfig(next) !== serializeConfig(this._sanitizeGradientStopsForEmit(current))) {
      const session = this._getPaletteSession(scope, current);
      const row = target.closest?.(segment ? '.segment-editor-row' : '.gradient-stop-row');
      if (row) row.dataset.paletteGeneration = String(session.generation);
      write(next, segment ? { sort: false } : {}, { type: 'edit', index, field: 'color', value });
    }
    return true;
  }
}
