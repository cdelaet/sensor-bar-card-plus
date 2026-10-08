import { getEffectiveFillStyleValue } from '../sections/bar-appearance.js';
import { serializeConfig } from './editor-config.js';

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

  handle(event, mode = event.type) {
    const target = event.target;
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
        'add-gradient-stop', 'remove-gradient-stop', 'add-entity-gradient-stop', 'remove-entity-gradient-stop'].includes(action)
        || !action.includes(prefix)) return false;
      if (action.startsWith('add-')) {
        this.ui.focus(`#${isEntity ? `entity-${scope.index}-` : ''}${prefix}-draft-${segment ? 'from' : 'pos'}`);
        commit();
      } else {
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
      write(next, segment ? { sort: false } : {}, { type: 'edit', index, field: 'color', value });
    }
    return true;
  }
}
