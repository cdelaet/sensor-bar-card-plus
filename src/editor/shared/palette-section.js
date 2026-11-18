import { BAR_PAINT } from '../../view-model/paint-destinations.js';
import { getDestinationEditorState, ownsDestinationProperty, clearDestinationProperty } from './paint-destination.js';
import { readBarPaintProperty } from './bar-paint-bindings.js';
import { serializeConfig, cloneDeep } from './editor-config.js';

let paletteGeneration = 0;
const trackedPointerDocuments = new WeakSet();
const pendingPalettePointerSyncs = new WeakMap();

// Keep primary-pointer transactions through activation and carry any palette
// syncs requested by blur.
export function trackPalettePointerSync(root) {
  const document = root?.ownerDocument;
  if (!document?.addEventListener || trackedPointerDocuments.has(document)) return;
  trackedPointerDocuments.add(document);
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const previous = pendingPalettePointerSyncs.get(document);
    previous?.cleanup();
    const transaction = { callbacks: [], cleanup: null, changeRoot: null, changeListener: null };
    const finish = () => {
      if (pendingPalettePointerSyncs.get(document) !== transaction) return;
      transaction.cleanup();
      pendingPalettePointerSyncs.delete(document);
      for (const synchronize of transaction.callbacks) synchronize();
    };
    const finishAfterClick = event => {
      if (!event.defaultPrevented) {
        const path = event.composedPath?.() ?? [];
        const control = path.find(node => node?.matches?.('input[type="checkbox"]'))
          ?? path.find(node => node?.tagName === 'LABEL')?.control;
        if (control?.matches?.('input[type="checkbox"]')) {
          if (transaction.changeListener) return;
          // Checkbox input/change follow click. Sync only after the editor has
          // processed change, or it can restore the pre-click checked value.
          const changeRoot = path.find(node => node?.nodeType === 11 && node?.host) ?? document;
          transaction.changeRoot = changeRoot;
          transaction.changeListener = changeEvent => {
            if (changeEvent.target === control) finish();
          };
          changeRoot.addEventListener('change', transaction.changeListener);
          return;
        }
      }
      finish();
    };
    transaction.cleanup = () => {
      document.removeEventListener('click', finishAfterClick);
      document.removeEventListener('pointercancel', finish);
      if (transaction.changeRoot && transaction.changeListener) {
        transaction.changeRoot.removeEventListener('change', transaction.changeListener);
      }
    };
    if (previous) transaction.callbacks.push(...previous.callbacks);
    pendingPalettePointerSyncs.set(document, transaction);
    document.addEventListener('click', finishAfterClick);
    document.addEventListener('pointercancel', finish);
  }, true);
}

// A focusout triggered by pointerdown is followed by a click on the same target.
// Keep palette synchronization until that click has been dispatched so an
// in-place control update cannot move the target out from under the pointer.
export function deferPaletteSyncUntilClick(eventOrTarget, synchronize, root) {
  if (typeof synchronize !== 'function') return false;
  const event = eventOrTarget?.target ? eventOrTarget : null;
  const target = event?.relatedTarget ?? eventOrTarget;
  const document = event?.target?.ownerDocument ?? root?.ownerDocument ?? target?.ownerDocument;
  if (!document?.addEventListener) return false;
  const transaction = pendingPalettePointerSyncs.get(document);
  if (transaction) {
    transaction.callbacks.push(synchronize);
    return true;
  }
  if (!target?.isConnected || !target.matches?.(':active')) return false;
  const finish = () => {
    document.removeEventListener('click', finish);
    document.removeEventListener('pointercancel', finish);
    synchronize();
  };
  document.addEventListener('click', finish, { once: true });
  document.addEventListener('pointercancel', finish, { once: true });
  return true;
}

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
    this.destination = array.destination ?? BAR_PAINT;
    this._reconcilingRows = false;
  }
  _getPaletteRoot(scope) { return this.ui.root(scope); }
  paintState(scope) { return getDestinationEditorState(this.context, scope, this.destination); }
  fillStyle(scope) { return this.paintState(scope).paint.fill_style; }
  readPaintProperty(scope, property) {
    if (this.destination === BAR_PAINT) return readBarPaintProperty(this.context, scope, property);
    const local = this.context.read(scope, this.destination.path);
    const parent = scope?.type === 'entity' ? this.context.read({ type: 'card' }, this.destination.path) : null;
    if (local?.preset === undefined && parent?.preset === undefined) {
      const raw = local?.[property] ?? parent?.[property];
      if (raw !== undefined) return cloneDeep(raw);
    }
    return this.paintState(scope).paint[property];
  }
  ownsPaintProperty(scope, property) { return ownsDestinationProperty(this.context, scope, this.destination, property); }
  clearPaintProperty(scope, property) { return clearDestinationProperty(this.context, scope, this.destination, property); }
  paletteId(id) { return this.destination === BAR_PAINT ? id : `${this.destination.id}-${id}`; }
  scopeMarkup(html) {
    return this.destination === BAR_PAINT ? html : html.replace(/\b(id|for)="([^"]+)"/g,
      (match, attribute, id) => id.startsWith('card-group-') ? match : `${attribute}="${this.paletteId(id)}"`);
  }
  _getShadowElementById(id, scope) { return this._getPaletteRoot(scope)?.querySelector(`#${this.paletteId(id)}`); }
  _renderListRows(items, renderItem) { return items.map(renderItem).join(''); }

  _syncPaletteActivity(scope, group, active, summary) {
    const note = this._getPaletteRoot(scope)?.querySelector(`[data-palette-inactive="${group}"]`);
    if (!note) return;
    note.hidden = active;
    const disclosure = note.closest?.('.override-group');
    // Entity Baseline palettes are inline in the Baseline group; only a palette
    // disclosure owns palette activity and its status description.
    const disclosureGroup = disclosure?.dataset?.group;
    if (disclosureGroup !== group && !disclosureGroup?.endsWith(`-${group}`)) return;
    disclosure.classList.toggle('is-inactive', !active);
    const description = disclosure.querySelector('.override-group-summary');
    if (description && summary !== undefined) description.textContent = summary;
  }

  _syncRows(scope, { inputSelector, rowSelector, draftSelector, memberSelector, generation, rowCount }) {
    draftSelector = `#${this.paletteId(draftSelector.slice(1))}`;
    const root = this._getPaletteRoot(scope);
    if (!root?.ownerDocument) return false;
    const liveInputs = [...root.querySelectorAll(inputSelector)];
    const liveRows = liveInputs.map(input => input.closest(rowSelector)).filter(Boolean);
    const draft = root.querySelector(draftSelector);
    const list = liveRows[0]?.parentElement ?? draft?.closest('.list')
      ?? root.querySelector(memberSelector ? `:scope ${memberSelector}` : rowSelector)?.parentElement;
    if (list && Number.isInteger(rowCount)) {
      const liveMembers = [...list.children].filter(item => item.matches(memberSelector));
      const liveDraft = list.querySelector(`:scope > ${rowSelector === '.segment-editor-row' ? '.segment-draft' : '.gradient-stop-draft'}`);
      const session = this._getPaletteSession?.(scope);
      const hasBoundaryDrafts = session?.drafts?.size > 0;
      if (!hasBoundaryDrafts && liveInputs.length === rowCount && liveMembers.length === rowCount
        && liveDraft?.dataset.paletteGeneration === String(generation)
        && liveMembers.every(item => item.dataset.paletteGeneration === String(generation))) return false;
    }

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
    if (!generationChanged && liveInputs.length === desired.length && liveMembers.length === members.length
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
    if (target?.closest && target.closest('.paint-editor') !== this._getPaletteRoot(scope)) return false;
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
          this.syncRows?.(scope);
          this.ui.focus(`#${this.paletteId(`${isEntity ? `entity-${scope.index}-` : ''}${prefix}-draft-from`)}`, scope, { immediate: true });
        } else {
          this.ui.focus(`#${this.paletteId(`${isEntity ? `entity-${scope.index}-` : ''}${prefix}-draft-${segment ? 'from' : 'pos'}`)}`, scope);
          commit();
        }
      } else {
        if (segment && !this._isCurrentSegmentRow(scope, index, target)
          || !segment && !this._isCurrentGradientStopRow(scope, index, target)) {
          this.syncRows?.(scope);
          return true;
        }
        write(rows().filter((_, i) => i !== index), { rerender: true, paletteAction: true, ...(segment ? { sort: true } : {}) }, { type: 'remove', index });
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
        if (segment) {
          this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
          this._syncSegmentDraftControls(scope);
        } else {
          this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), this._createGradientStopDraftState(scope));
          this._syncGradientDraftControls(scope);
        }
        refresh();
      } else if (event.key === 'Enter') {
        event.preventDefault?.();
        if (draft) commit();
        else if (segment && ['from', 'to'].includes(field)) this._commitSegmentBoundaryEdit(scope, index, field, value, target);
        else if (!segment && field === 'pos') this._commitGradientStopPosEdit(scope, index, value, target);
      }
      return true;
    }
    if (draft) {
      if (segment) {
        this._setSegmentDraftField(scope, field, value);
        if (field === 'color' && target?.type === 'color') this._syncSegmentDraftControls?.(scope);
      }
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
      write(next, segment ? { sort: false, paletteSource: target } : { paletteSource: target }, { type: 'edit', index, field: 'color', value });
    }
    return true;
  }
}
