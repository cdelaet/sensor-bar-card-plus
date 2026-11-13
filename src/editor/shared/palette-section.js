import { getEffectiveFillStyleValue } from '../sections/bar-appearance.js';
import { serializeConfig } from './editor-config.js';

let paletteSessionKey = 0;

export class PaletteRowSession {
  constructor() {
    this.sessionKey = ++paletteSessionKey;
    this.generation = 1;
    this.drafts = new Map();
    this.snapshot = null;
    this.replaced = false;
  }

  reconcile(rows) {
    const snapshot = rows.map(row => serializeConfig(row));
    const changed = this.snapshot && serializeConfig(snapshot) !== serializeConfig(this.snapshot);
    if (changed) {
      this.generation += 1;
      this.drafts.clear();
      this.replaced = true;
    }
    this.snapshot = snapshot;
    return !!changed;
  }

  record(rows) {
    this.snapshot = rows.map(row => serializeConfig(row));
  }

  takeReplacement() {
    const replaced = this.replaced;
    this.replaced = false;
    return replaced;
  }

  get revision() { return this.generation; }
  tokenAt(index) { return { sessionKey: this.sessionKey, generation: this.generation, index }; }
  isCurrent(token, index = null) {
    return token?.sessionKey === this.sessionKey && token.generation === this.generation
      && (index === null || token.index === index);
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

  _syncRows(scope, { inputSelector, rowSelector, draftSelector, memberSelector, sessionRevision, sessionKey, replacement = false }) {
    const root = this.shadowRoot;
    if (!root?.ownerDocument) return false;
    const template = root.ownerDocument.createElement('template');
    template.innerHTML = this.render(scope, ({ content }) => content, { section: false });
    const desired = [...template.content.querySelectorAll(rowSelector)].filter(row => row.querySelector(inputSelector));
    const members = memberSelector ? [...template.content.querySelectorAll(memberSelector)] : [];
    for (const member of members) {
      member.dataset.paletteRevision = String(sessionRevision);
      member.dataset.paletteSession = String(sessionKey);
      for (const control of member.querySelectorAll('input, button')) {
        control.dataset.paletteRevision = String(sessionRevision);
        control.dataset.paletteSession = String(sessionKey);
      }
      const rowInput = member.querySelector('[data-segment-index], [data-stop-index], [data-kind="segment-from"], [data-kind="gradient-pos"]');
      const rowIndex = Number(rowInput?.dataset.segmentIndex ?? rowInput?.dataset.stopIndex ?? rowInput?.dataset.index);
      if (Number.isInteger(rowIndex)) member.dataset.paletteIndex = String(rowIndex);
    }
    const liveInputs = [...root.querySelectorAll(inputSelector)];
    const liveRows = liveInputs.map(input => input.closest(rowSelector)).filter(Boolean);
    const draft = root.querySelector(draftSelector);
    const list = liveRows[0]?.parentElement ?? draft?.closest('.list')
      ?? root.querySelector(memberSelector ? `:scope ${memberSelector}` : rowSelector)?.parentElement;
    if (!list) return false;
    const liveMembers = [...list.children].filter(item => item.matches(memberSelector));
    const active = root.activeElement;
    if (memberSelector && !replacement && liveMembers.length === members.length
      && liveMembers.every(item => item.dataset.paletteSession === String(sessionKey)
        && item.dataset.paletteRevision === String(sessionRevision))) return false;

    if (memberSelector) {
      this._reconcilingRows = true;
      try {
        liveMembers.forEach(item => item.remove());
        const draftAnchor = list.querySelector(':scope > .segment-draft, :scope > .gradient-stop-draft');
        members.forEach(member => list.insertBefore(member.cloneNode(true), draftAnchor));
      } finally {
        this._reconcilingRows = false;
      }
      return true;
    }

    if (liveRows.slice(desired.length).some(row => row.contains(active))) return false;

    let changed = liveRows.length !== desired.length;
    for (let index = 0; index < Math.min(liveRows.length, desired.length); index += 1) {
      const current = liveRows[index];
      const next = desired[index];
      for (const input of next.querySelectorAll('input')) {
        const kind = input.dataset.kind;
        const currentInput = [...current.querySelectorAll('input')].find(candidate => candidate.dataset.kind === kind);
        if (!currentInput || currentInput === active) continue;
        if (currentInput.value !== input.value) { currentInput.value = input.value; changed = true; }
        if (currentInput.checked !== input.checked) { currentInput.checked = input.checked; changed = true; }
      }
      for (const hint of next.querySelectorAll('.section-note[id]')) {
        const currentHint = current.querySelector(`#${hint.id}`);
        if (!currentHint) continue;
        if (currentHint.textContent !== hint.textContent) { currentHint.textContent = hint.textContent; changed = true; }
        if (currentHint.getAttribute('style') !== hint.getAttribute('style')) {
          if (hint.hasAttribute('style')) currentHint.setAttribute('style', hint.getAttribute('style'));
          else currentHint.removeAttribute('style');
          changed = true;
        }
      }
    }

    for (const row of liveRows.slice(desired.length)) row.remove();
    const draftRow = list.querySelector(':scope > .segment-draft, :scope > .gradient-stop-draft');
    for (let index = liveRows.length; index < desired.length; index += 1) {
      list.insertBefore(desired[index].cloneNode(true), draftRow);
      changed = true;
    }
    return changed;
  }

  handle(event, mode = event.type) {
    const target = event.target;
    if (this._reconcilingRows || target?.isConnected === false) return true;
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
      if (row) row.dataset.paletteRevision = String(session.revision);
      write(next, segment ? { sort: false } : {}, { type: 'edit', index, field: 'color', value });
    }
    return true;
  }
}
