import { getEffectiveFillStyleValue } from '../sections/bar-appearance.js';
import { serializeConfig } from './editor-config.js';

function paletteFingerprint(value) {
  const text = serializeConfig(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    first = Math.imul(first ^ text.charCodeAt(index), 0x01000193);
    second = Math.imul(second ^ text.charCodeAt(index), 0x85ebca6b);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

let paletteSessionRevision = 0;
let paletteSessionKey = 0;

// Row IDs live only for the lifetime of a section session. Configurations do
// not carry row IDs, so identical rows are matched by occurrence order.
export class PaletteRowSession {
  constructor(logicalKey = serializeConfig) {
    this.sessionKey = ++paletteSessionKey;
    this.revision = ++paletteSessionRevision;
    this.rows = [];
    this.drafts = new Map();
    this.logicalKey = logicalKey;
  }

  reconcile(rows) {
    const previous = new Map();
    this.rows.forEach((entry) => {
      const queue = previous.get(entry.fingerprint) ?? [];
      queue.push(entry.id);
      previous.set(entry.fingerprint, queue);
    });
    const usedIds = new Set();
    const next = rows.map((row) => {
      const fingerprint = serializeConfig(row);
      const id = previous.get(fingerprint)?.shift() ?? null;
      if (id) usedIds.add(id);
      return { id, fingerprint, logicalKey: this.logicalKey(row) };
    });
    const oldUnmatched = this.rows.filter(entry => !usedIds.has(entry.id));
    const newUnmatched = next.filter(entry => entry.id === null);
    const oldByKey = new Map();
    const newByKey = new Map();
    for (const entry of oldUnmatched) {
      const group = oldByKey.get(entry.logicalKey) ?? [];
      group.push(entry);
      oldByKey.set(entry.logicalKey, group);
    }
    for (const entry of newUnmatched) {
      const group = newByKey.get(entry.logicalKey) ?? [];
      group.push(entry);
      newByKey.set(entry.logicalKey, group);
    }
    for (const [key, oldGroup] of oldByKey) {
      const newGroup = newByKey.get(key) ?? [];
      // A secondary match is safe only when there is one unmatched candidate
      // on each side. Ambiguous same-anchor rows receive fresh identities.
      if (oldGroup.length === 1 && newGroup.length === 1) newGroup[0].id = oldGroup[0].id;
    }
    const occurrences = new Map();
    next.forEach((entry, index) => {
      const occurrence = occurrences.get(entry.fingerprint) ?? 0;
      occurrences.set(entry.fingerprint, occurrence + 1);
      if (!entry.id) entry.id = `row-${paletteFingerprint(rows[index])}#${occurrence}`;
    });
    if (next.length !== this.rows.length || next.some((entry, index) => entry.id !== this.rows[index]?.id
      || entry.fingerprint !== this.rows[index]?.fingerprint)) this.revision = ++paletteSessionRevision;
    const liveIds = new Set(next.map(({ id }) => id));
    for (const id of this.drafts.keys()) if (!liveIds.has(id)) this.drafts.delete(id);
    this.rows = next;
    return next.map(({ id }) => id);
  }

  idAt(index) { return this.rows[index]?.id ?? null; }
  updateAt(index, row) {
    const entry = this.rows[index];
    if (!entry) return false;
    const fingerprint = serializeConfig(row);
    if (entry.fingerprint === fingerprint) return true;
    entry.fingerprint = fingerprint;
    entry.logicalKey = this.logicalKey(row);
    this.revision = ++paletteSessionRevision;
    return true;
  }
  tokenAt(index) { return { id: this.idAt(index), revision: this.revision }; }
  isCurrent(token, index = null) {
    return !!token?.id && token.revision === this.revision
      && (index === null || this.idAt(index) === token.id);
  }
  setDraft(index, field, value) {
    const id = this.idAt(index);
    if (id) {
      if (!this.drafts.has(id)) this.drafts.set(id, new Map());
      this.drafts.get(id).set(field, value);
    }
  }
  getDraft(index, field) {
    const id = this.idAt(index);
    return id ? this.drafts.get(id)?.get(field) : undefined;
  }
  clearDraft(index, field) {
    const id = this.idAt(index);
    if (id) {
      this.drafts.get(id)?.delete(field);
      if (!this.drafts.get(id)?.size) this.drafts.delete(id);
    }
  }
}

// Narrow UI/session boundary: sections own drafts; hosts own DOM replacement,
// focus restoration and persistence. The four-operation section context stays intact.
export class PaletteSection {
  constructor(context, ui, array) {
    this.context = context;
    this.ui = ui;
    this.array = array;
  }
  get shadowRoot() { return this.ui.root(); }
  fillStyle(scope) { return getEffectiveFillStyleValue(this.context, scope); }
  _getShadowElementById(id) { return this.shadowRoot?.getElementById?.(id) ?? this.shadowRoot?.querySelector(`#${id}`); }
  _renderListRows(items, renderItem) { return items.map(renderItem).join(''); }

  _syncRows(scope, { inputSelector, rowSelector, draftSelector, memberSelector, onDiscard, sessionRevision, sessionKey, rowIds, deferRemovedActive = false }) {
    const root = this.shadowRoot;
    if (!root?.ownerDocument) return false;
    const template = root.ownerDocument.createElement('template');
    template.innerHTML = this.render(scope, ({ content }) => content, { section: false });
    const desired = [...template.content.querySelectorAll(rowSelector)]
      .filter(row => row.querySelector(inputSelector));
    if (memberSelector && sessionRevision !== undefined) {
      for (const member of template.content.querySelectorAll(memberSelector)) {
        member.dataset.paletteRevision = String(sessionRevision);
        member.dataset.paletteSession = String(sessionKey);
        if (member.classList.contains('segment-undefined-row')) {
          member.dataset.paletteKey = `${sessionKey}:${member.dataset.paletteKey}`;
        } else {
          const rowInput = member.querySelector('[data-segment-index], [data-stop-index], [data-kind="segment-from"], [data-kind="gradient-pos"]');
          const rowIndex = Number(rowInput?.dataset.segmentIndex ?? rowInput?.dataset.stopIndex ?? rowInput?.dataset.index);
          if (Number.isInteger(rowIndex) && rowIds?.[rowIndex]) {
            member.dataset.paletteId = `${sessionKey}:${rowIds[rowIndex]}`;
            member.dataset.paletteKey = member.dataset.paletteId;
          }
        }
      }
    }
    const liveInputs = [...root.querySelectorAll(inputSelector)];
    const liveRows = liveInputs.map(input => input.closest(rowSelector)).filter(Boolean);
    const draft = root.querySelector(draftSelector);
    const list = liveRows[0]?.parentElement ?? draft?.closest('.list')
      ?? root.querySelector(memberSelector ? `:scope ${memberSelector}` : rowSelector)?.parentElement;
    if (!list) return false;
    const active = root.activeElement;
    if (memberSelector) {
      const keyMembers = items => {
        const occurrences = new Map();
        return items.map((item, index) => {
          const base = item.dataset.paletteKey;
          const occurrence = occurrences.get(base) ?? 0;
          occurrences.set(base, occurrence + 1);
          return { item, index, key: `${base}#${occurrence}` };
        });
      };
      const desiredEntries = keyMembers([...template.content.querySelectorAll(memberSelector)]);
      const desiredByKey = new Map(desiredEntries.map(entry => [entry.key, entry]));
      const liveMembers = [...list.children].filter(item => item.matches(memberSelector));
      const liveEntries = keyMembers(liveMembers);
      const activeMember = liveEntries.find(({ item }) => item.contains(active));
      const activeRemoved = !!activeMember && !desiredByKey.has(activeMember.key);
      if (activeRemoved && deferRemovedActive
        && String(activeMember.item.dataset.paletteSession) === String(sessionKey)) return false;
      const selection = active?.matches?.('input') && typeof active.selectionStart === 'number'
        ? [active.selectionStart, active.selectionEnd, active.selectionDirection]
        : null;
      let changed = liveMembers.length !== desiredEntries.length;

      const liveByKey = new Map(liveEntries.map(entry => [entry.key, entry]));
      for (const entry of liveEntries) {
        const { item, index, key } = entry;
        const next = desiredByKey.get(key);
        const oldRowIndex = item.querySelector('[data-segment-index]')?.dataset.segmentIndex;
        const nextRowIndex = next?.item.querySelector('[data-segment-index]')?.dataset.segmentIndex;
        if (!next || index !== next.index || oldRowIndex !== nextRowIndex) {
          onDiscard?.(item, next?.item ?? desiredEntries.find(candidate => candidate.item.querySelector('[data-segment-index]')?.dataset.segmentIndex === oldRowIndex)?.item);
        }
      }
      const reconciled = desiredEntries.map(({ item: desiredMember, key }) => {
        const existing = liveByKey.get(key)?.item;
        if (!existing) return desiredMember.cloneNode(true);
        const syncElement = (current, next) => {
          for (const attribute of [...current.attributes]) {
            if (!next.hasAttribute(attribute.name)) { current.removeAttribute(attribute.name); changed = true; }
          }
          for (const attribute of [...next.attributes]) {
            if (current.getAttribute(attribute.name) !== attribute.value) { current.setAttribute(attribute.name, attribute.value); changed = true; }
          }
          if (current.matches('input, button')) {
            if (current !== active && current.matches('input')) {
              if (current.value !== next.value) { current.value = next.value; changed = true; }
              if (current.checked !== next.checked) { current.checked = next.checked; changed = true; }
            }
            if (current.matches('button') && current.textContent !== next.textContent) { current.textContent = next.textContent; changed = true; }
          }
          const currentChildren = [...current.children];
          const nextChildren = [...next.children];
          currentChildren.forEach((child, childIndex) => {
            if (nextChildren[childIndex] && child.tagName === nextChildren[childIndex].tagName) syncElement(child, nextChildren[childIndex]);
          });
          if (!current.children.length && !current.matches('input, button') && current.textContent !== next.textContent) { current.textContent = next.textContent; changed = true; }
        };
        syncElement(existing, desiredMember);
        return existing;
      });
      if (reconciled.some(item => !liveMembers.includes(item))) changed = true;

      const anchor = list.querySelector(':scope > .segment-draft, :scope > .gradient-stop-draft');
      const nextMember = item => {
        let next = item?.nextElementSibling;
        while (next && !next.matches(memberSelector)) next = next.nextElementSibling;
        return next;
      };
      let cursor = liveMembers[0] ?? anchor;
      for (const item of reconciled) {
        if (item === cursor) cursor = nextMember(cursor) ?? anchor;
        else list.insertBefore(item, cursor ?? anchor);
      }
      for (const entry of liveEntries) if (!desiredByKey.has(entry.key)) entry.item.remove();
      if (liveEntries.some(entry => !desiredByKey.has(entry.key))) changed = true;
      if (!activeRemoved && active?.isConnected && root.activeElement !== active) {
        active.focus?.({ preventScroll: true });
        if (selection) active.setSelectionRange?.(...selection);
      }
      return changed || liveMembers.some((item, index) => item !== reconciled[index]);
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
    if (target?.isConnected === false) return true;
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
      session.updateAt(index, next[index]);
      const row = target.closest?.(segment ? '.segment-editor-row' : '.gradient-stop-row');
      if (row) row.dataset.paletteRevision = String(session.revision);
      write(next, segment ? { sort: false } : {}, { type: 'edit', index, field: 'color', value });
    }
    return true;
  }
}
