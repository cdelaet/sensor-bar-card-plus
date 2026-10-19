import { cloneDeep, serializeConfig, isObject, normalizeTextValue, normalizeNumberValue,
  setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue, renderColorInput, normalizeEditorColorValue } from '../shared/editor-controls.js';
import { normalizeGaugeSegments, normalizeScaleConfig } from '../../config/normalize.js';
import { getResolvedScale } from '../../config/resolve.js';
import { getSegmentsForRendering, resolveSegmentBoundaryPct } from '../../view-model/bar-render-model.js';
import { getEffectiveBarColorValue } from './bar-appearance.js';
import { PaletteSection } from '../shared/palette-section.js';

export const MIXED_INTERVAL_PREVIEW_WEIGHT = 10;
export const MIN_SEGMENT_PREVIEW_WIDTH = 1;

function segmentCoordinate(value, legacyPercent = false) {
  if (value === null || value === undefined || typeof value === 'string' && !value.trim()) return null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (Number.isFinite(value.percent)) return { value: value.percent, space: 'percent' };
    const fixed = Number(value.fixed ?? value.value);
    return Number.isFinite(fixed) ? { value: fixed, space: 'absolute' } : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);
    if (match) return { value: Number(match[1]), space: 'percent' };
    value = trimmed;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return { value: numeric, space: legacyPercent ? 'percent' : 'absolute' };
}

export function allocateSegmentPreviewWidths(intervals) {
  if (!intervals.length) return [];
  // More than 100 intervals cannot each receive 1% and still fit. Preserve a
  // fitted preview in that edge case by sharing the rail evenly.
  if (intervals.length * MIN_SEGMENT_PREVIEW_WIDTH > 100) return intervals.map(() => 100 / intervals.length);
  const mixedCount = intervals.filter(interval => interval.mixed).length;
  const sameSpace = intervals.filter(interval => !interval.mixed);
  let desired;
  if (mixedCount && sameSpace.length) {
    const mixedShare = Math.min(MIXED_INTERVAL_PREVIEW_WEIGHT, 100 / mixedCount);
    const knownShare = Math.max(0, 100 - mixedShare * mixedCount);
    const knownTotal = sameSpace.reduce((sum, interval) => sum + Math.max(0, interval.weight), 0);
    desired = intervals.map(interval => interval.mixed
      ? mixedShare
      : knownTotal > 0 ? knownShare * Math.max(0, interval.weight) / knownTotal : knownShare / sameSpace.length);
  } else {
    const total = intervals.reduce((sum, interval) => sum + Math.max(0, interval.weight), 0);
    desired = intervals.map(interval => total > 0
      ? 100 * Math.max(0, interval.weight) / total
      : 100 / intervals.length);
  }

  const widths = Array(intervals.length).fill(null);
  let remaining = 100;
  let active = intervals.map((_, index) => index);
  while (active.length) {
    const total = active.reduce((sum, index) => sum + desired[index], 0);
    const small = active.filter(index => (total > 0 ? remaining * desired[index] / total : remaining / active.length) < MIN_SEGMENT_PREVIEW_WIDTH);
    if (!small.length) {
      active.forEach(index => { widths[index] = total > 0 ? remaining * desired[index] / total : remaining / active.length; });
      break;
    }
    small.forEach(index => { widths[index] = MIN_SEGMENT_PREVIEW_WIDTH; remaining -= MIN_SEGMENT_PREVIEW_WIDTH; });
    active = active.filter(index => !small.includes(index));
  }
  return widths;
}

export class SegmentsSection extends PaletteSection {
  constructor(context, ui, array) {
    super(context, ui, array);
    this.reset();
  }

  reset() {
    this._segmentDrafts = new Map();
    this._segmentUiRows = new Map();
    this._segmentBoundaryTexts = new Map();
  }

  _setSegments(segments, options = {}) {
    return this._setScopedSegments({ type: 'card' }, segments, options);
  }

  _clearSegmentsOverride(scope) {
    this._segmentDrafts.delete(this._getSegmentsScopeKey(scope));
    this._segmentUiRows.delete(this._getSegmentsScopeKey(scope));
    this._clearSegmentScopeTextState(scope);
    return this.context.mutate(scope, (target) => {
      let nextTarget = deletePathValue(target, ['bar', 'segments']);
      nextTarget = deletePathValue(nextTarget, ['segments']);
      nextTarget = deletePathValue(nextTarget, ['severity']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
  }

  _getSegmentsValue() {
    return this._getScopedSegmentsValue({ type: 'card' });
  }

  _getSegmentsScopeKey(scope = { type: 'card' }) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getSegmentBoundaryTextKey(scope, segmentIndex, field) {
    return `${this._getSegmentsScopeKey(scope)}:${segmentIndex}:${field}`;
  }

  _getSegmentBoundaryText(scope = { type: 'card' }, segmentIndex, field, fallbackValue = '') {
    const key = this._getSegmentBoundaryTextKey(scope, segmentIndex, field);
    if (this._segmentBoundaryTexts.has(key)) {
      return this._segmentBoundaryTexts.get(key);
    }
    return this._formatSegmentBoundaryValue(fallbackValue);
  }

  _setSegmentBoundaryText(scope, segmentIndex, field, rawValue) {
    this._segmentBoundaryTexts.set(
      this._getSegmentBoundaryTextKey(scope, segmentIndex, field),
      normalizeTextValue(rawValue),
    );
  }

  _clearSegmentBoundaryText(scope, segmentIndex, field) {
    this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(scope, segmentIndex, field));
  }

  _clearSegmentScopeTextState(scope) {
    const prefix = `${this._getSegmentsScopeKey(scope)}:`;
    for (const key of this._segmentBoundaryTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._segmentBoundaryTexts.delete(key);
      }
    }
  }

  _getSegmentsUiRows(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (this._segmentUiRows.has(key)) {
      return cloneDeep(this._segmentUiRows.get(key));
    }
    return null;
  }

  _setSegmentsUiRows(scope, rows) {
    this._segmentUiRows.set(this._getSegmentsScopeKey(scope), cloneDeep(rows));
  }

  _getSegmentDraftState(scope = { type: 'card' }) {
    const key = this._getSegmentsScopeKey(scope);
    if (!this._segmentDrafts.has(key)) {
      this._segmentDrafts.set(key, this._createSegmentDraftState(scope));
    }
    return cloneDeep(this._segmentDrafts.get(key));
  }

  _setSegmentDraftState(scope, nextDraft, options = {}) {
    this._segmentDrafts.set(this._getSegmentsScopeKey(scope), {
      from: nextDraft?.from ?? '',
      to: nextDraft?.to ?? '',
      color: nextDraft?.color ?? this._getSegmentDraftColorDefault(scope),
      insertIndex: Number.isInteger(nextDraft?.insertIndex) ? nextDraft.insertIndex : undefined,
    });
    if (options?.refreshOnly) {
      this._refreshSegmentUi(scope);
      return;
    }
    this.ui.render();
  }

  _setSegmentDraftField(scope, field, rawValue) {
    const currentDraft = this._getSegmentDraftState(scope);
    const nextValue = field === 'color'
      ? normalizeEditorColorValue(rawValue, this.array.cssText)
      : normalizeTextValue(rawValue);
    this._setSegmentDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
      insertIndex: field === 'color' ? currentDraft.insertIndex : undefined,
    }, { refreshOnly: true });
  }

  _prepareSegmentDraftFromUndefined(scope, from, to, insertIndex) {
    this._setSegmentDraftState(scope, {
      from: this._formatSegmentBoundaryValue(from),
      to: this._formatSegmentBoundaryValue(to),
      color: this._getSegmentDraftColorDefault(scope),
      insertIndex: Number.isInteger(insertIndex) ? insertIndex : undefined,
    });
  }

  _isSegmentFillStyle(fillStyle) {
    return ['bands', 'soft_bands', 'band_gradient'].includes(fillStyle);
  }

  _getDefaultSegments() {
    return [
      { from: '0%', to: '33%', color: '#4CAF50' },
      { from: '33%', to: '75%', color: '#FF9800' },
      { from: '75%', to: '100%', color: '#F44336' },
    ];
  }

  _getStoredScopedSegments(scope = { type: 'card' }) {
    const structuredValue = this.context.read(scope, ['bar', 'segments']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacySegments = this.context.read(scope, ['segments']);
    if (legacySegments !== undefined) {
      return legacySegments;
    }
    const legacySeverity = this.context.read(scope, ['severity']);
    if (legacySeverity !== undefined) {
      return legacySeverity;
    }
    return null;
  }

  _parseSegmentBoundaryInput(rawValue) {
    const normalizedValue = normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return null;
    }
    const percentMatch = normalizedValue.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;
    if (Number.isFinite(percent)) {
      return `${percent}%`;
    }
    const numericValue = normalizeNumberValue(normalizedValue);
    return numericValue === null ? null : numericValue;
  }

  _formatSegmentBoundaryValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return `${value.percent}%`;
      }
      if (Number.isFinite(this._getFiniteNumber(value.fixed))) {
        return String(this._getFiniteNumber(value.fixed));
      }
    }
    return '';
  }

  _getSegmentDraftColorDefault(scope = { type: 'card' }) {
    return getEffectiveBarColorValue(this.context, scope);
  }

  _getNewSegmentDefaults(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    const previous = segments[segments.length - 1];
    const previousTo = previous?.to ?? null;
    return {
      from: previousTo ?? '0%',
      to: '100%',
      color: this._getSegmentDraftColorDefault(scope),
    };
  }

  _createSegmentDraftState(scope = { type: 'card' }) {
    const defaults = this._getNewSegmentDefaults(scope);
    const formattedFrom = this._formatSegmentBoundaryValue(defaults.from);
    const formattedTo = this._formatSegmentBoundaryValue(defaults.to);
    const draftFrom = formattedFrom === '100%' || formattedFrom === '100' ? '' : formattedFrom;
    const draftTo = draftFrom ? formattedTo : '';
    return {
      from: draftFrom,
      to: draftTo,
      color: defaults.color ?? this._getSegmentDraftColorDefault(scope),
    };
  }

  _normalizeSegmentForEditorComparison(segment) {
    if (!isObject(segment)) {
      return null;
    }
    const from = this._formatSegmentBoundaryValue(segment.from).trim();
    const to = this._formatSegmentBoundaryValue(segment.to).trim();
    const color = normalizeColorComparisonValue(segment.color);
    if (!from || !to || !color) {
      return null;
    }
    return { from, to, color };
  }

  _segmentsEqualForEditor(leftSegments, rightSegments) {
    const left = Array.isArray(leftSegments)
      ? leftSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    const right = Array.isArray(rightSegments)
      ? rightSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean)
      : [];
    if (left.length !== right.length) {
      return false;
    }
    return left.every((segment, index) => (
      segment.from === right[index].from
      && segment.to === right[index].to
      && segment.color === right[index].color
    ));
  }

  _getFallbackSegments(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const cardStoredSegments = this._getStoredScopedSegments({ type: 'card' });
      if (cardStoredSegments !== null) {
        return cloneDeep(this._getScopedSegmentsValue({ type: 'card' }));
      }
    }
    if (!this._isSegmentFillStyle(this.fillStyle(scope))) {
      return [];
    }
    return cloneDeep(this._getDefaultSegments());
  }

  _parseSegmentBoundaryText(rawValue) {
    const normalizedValue = normalizeTextValue(rawValue).trim();
    if (!normalizedValue) {
      return { state: 'empty', value: null };
    }
    const parsed = this._parseSegmentBoundaryInput(normalizedValue);
    if (parsed === null) {
      return { state: 'invalid', value: null };
    }
    return { state: 'valid', value: parsed };
  }

  _compareSegmentBoundaries(left, right) {
    const legacyPercent = this.array.segmentSpace?.() === 'percent';
    const leftCoordinate = segmentCoordinate(left, legacyPercent);
    const rightCoordinate = segmentCoordinate(right, legacyPercent);
    if (!leftCoordinate || !rightCoordinate || leftCoordinate.space !== rightCoordinate.space) {
      return null;
    }
    if (leftCoordinate.value < rightCoordinate.value) return -1;
    if (leftCoordinate.value > rightCoordinate.value) return 1;
    return 0;
  }

  _getResolvedMixedRangeValidationMessage(scope, rows, index) {
    const card = this.context.read({ type: 'card' }, []);
    const local = scope?.type === 'entity' ? this.context.read(scope, []) : {};
    const rootScale = normalizeScaleConfig(card, null);
    const scaleConfig = scope?.type === 'entity'
      ? normalizeScaleConfig(local, { scale: rootScale })
      : rootScale;
    const scale = getResolvedScale(this.ui.hass?.(), scaleConfig);
    const normalized = normalizeGaugeSegments(rows.map((row, rowIndex) => ({
      from: row.parsedFrom.value,
      ...(row.parsedTo.state === 'empty' ? {} : { to: row.parsedTo.value }),
      color: row.segment?.color ?? '#4a9eff',
      label: rowIndex,
    })), { legacySegmentSpace: this.array.segmentSpace?.() });
    const candidate = normalized?.[index];
    if (!candidate || !Number.isFinite(scale.min) || !Number.isFinite(scale.max) || scale.min === scale.max) return '';
    const from = resolveSegmentBoundaryPct(candidate.from, scale.min, scale.max);
    let to = resolveSegmentBoundaryPct(candidate.to, scale.min, scale.max);
    if (to === null) {
      const next = normalized.slice(index + 1).find(segment => segment && !segment.invalidBoundary);
      to = next ? resolveSegmentBoundaryPct(next.from, scale.min, scale.max) : 100;
    }
    return Number.isFinite(from) && Number.isFinite(to) && from >= to ? 'From must be below To.' : '';
  }

  _buildSegmentValidationRows(scope = { type: 'card' }) {
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    return rows.map((segment, index) => {
      const rawFrom = this._getSegmentBoundaryText(scope, index, 'from', segment?.from);
      const rawTo = this._getSegmentBoundaryText(scope, index, 'to', segment?.to);
      const parsedFrom = this._parseSegmentBoundaryText(rawFrom);
      const parsedTo = this._parseSegmentBoundaryText(rawTo);
      return {
        index,
        segment,
        rawFrom,
        rawTo,
        parsedFrom,
        parsedTo,
      };
    });
  }

  _getAutomaticEndInputRows(scope) {
    return this._getScopedSegmentsValue(scope).map((row, index) => {
      const from = this._getSegmentBoundaryText(scope, index, 'from', row?.from);
      const to = this._getSegmentBoundaryText(scope, index, 'to', row?.to);
      return { ...row, from, ...(to.trim() ? { to } : { to: undefined }) };
    });
  }

  _resolveAutomaticEndRows(scope, rows) {
    const card = this.context.read({ type: 'card' }, []);
    const local = scope?.type === 'entity' ? this.context.read(scope, []) : {};
    const rootScale = normalizeScaleConfig(card, null);
    const scale = getResolvedScale(this.ui.hass?.(), scope?.type === 'entity' ? normalizeScaleConfig(local, { scale: rootScale }) : rootScale);
    // Temporary labels associate sorted resolved preview rows with raw indices.
    // Neither this normalization nor inferred ends are written into config.
    const segments = normalizeGaugeSegments(rows.map((row, index) => ({ ...row, to: typeof row.to === 'string' && !row.to.trim() ? undefined : row.to, label: index })), { legacySegmentSpace: this.array.segmentSpace?.() });
    return getSegmentsForRendering({ bar: { segments } }, scale.min, scale.max);
  }

  _getAutomaticEndValidationMessage(scope, rows, index) {
    const row = rows[index];
    if (!row) return '';
    const from = this._parseSegmentBoundaryText(row.from);
    const to = this._parseSegmentBoundaryText(row.to);
    if (from.state !== 'valid' || to.state === 'invalid') return 'Enter valid from/to values.';
    const resolved = this._resolveAutomaticEndRows(scope, rows);
    const candidate = resolved.find(segment => segment.label === index);
    if (!candidate || candidate.from >= candidate.to) return 'From must be below To.';
    for (const other of resolved) {
      if (other.label === index || other.from >= other.to) continue;
      if (candidate.from === other.from) return 'Duplicate segment start.';
      if (candidate.from < other.to && candidate.to > other.from) return 'Segments overlap.';
    }
    return '';
  }

  _getSegmentRowValidationMessage(scope = { type: 'card' }, segmentIndex) {
    if (this.array.autoEnds) return this._getAutomaticEndValidationMessage(scope, this._getAutomaticEndInputRows(scope), segmentIndex);
    const rows = this._buildSegmentValidationRows(scope);
    const row = rows[segmentIndex];
    if (!row) {
      return '';
    }
    if (row.parsedFrom.state === 'invalid' || row.parsedTo.state === 'invalid' || row.parsedFrom.state === 'empty' || row.parsedTo.state === 'empty') {
      return 'Enter valid from/to values.';
    }
    const boundaryOrder = this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value);
    if (boundaryOrder !== null && boundaryOrder !== -1) {
      return 'From must be below To.';
    }
    if (boundaryOrder === null) {
      const resolvedMessage = this._getResolvedMixedRangeValidationMessage(scope, rows, segmentIndex);
      if (resolvedMessage) return resolvedMessage;
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
    for (const other of rows) {
      if (other.index === segmentIndex) continue;
      if (other.parsedFrom.state !== 'valid' || other.parsedTo.state !== 'valid') continue;
      if (this._compareSegmentBoundaries(row.parsedFrom.value, other.parsedFrom.value) === null
        || this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) === null
        || this._compareSegmentBoundaries(other.parsedFrom.value, other.parsedTo.value) === null) continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(other.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(other.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getValidSegmentDraft(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    if (this.array.autoEnds) {
      if (!draft.color.trim() || !CSS.supports('color', draft.color)) return null;
      const rows = [...this._getAutomaticEndInputRows(scope), draft];
      if (this._getAutomaticEndValidationMessage(scope, rows, rows.length - 1)) return null;
      const from = this._parseSegmentBoundaryInput(draft.from), to = this._parseSegmentBoundaryInput(draft.to);
      return { from, ...(draft.to.trim() ? { to } : {}), color: draft.color };
    }
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = normalizeTextValue(draft.color).trim();
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid' || !color) {
      return null;
    }
    const boundaryOrder = this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value);
    if (boundaryOrder !== null && boundaryOrder !== -1) {
      return null;
    }
    if (boundaryOrder === null) {
      const rows = this._buildSegmentValidationRows(scope);
      const mixedRow = { index: rows.length, segment: draft, rawFrom: draft.from, rawTo: draft.to,
        parsedFrom, parsedTo };
      if (this._getResolvedMixedRangeValidationMessage(scope, [...rows, mixedRow], mixedRow.index)) return null;
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      if (this._compareSegmentBoundaries(parsedFrom.value, row.parsedFrom.value) === null
        || this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) === null
        || this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) === null) continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom || (candidateFrom < otherTo && candidateTo > otherFrom)) {
        return null;
      }
    }
    return {
      from: parsedFrom.value,
      to: parsedTo.value,
      color,
    };
  }

  _canAddSegment(scope = { type: 'card' }) {
    return !!this._getValidSegmentDraft(scope);
  }

  _getSegmentDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getSegmentDraftState(scope);
    if (this.array.autoEnds) {
      if (!draft.from.trim()) return 'Enter a start value to add a segment.';
      if (!draft.color.trim() || !CSS.supports('color', draft.color)) return 'Enter a valid CSS color.';
      const rows = [...this._getAutomaticEndInputRows(scope), draft];
      return this._getAutomaticEndValidationMessage(scope, rows, rows.length - 1);
    }
    const parsedFrom = this._parseSegmentBoundaryText(draft.from);
    const parsedTo = this._parseSegmentBoundaryText(draft.to);
    const color = normalizeTextValue(draft.color).trim();
    if (!normalizeTextValue(draft.from).trim() && !normalizeTextValue(draft.to).trim()) {
      return '';
    }
    if (parsedFrom.state !== 'valid' || parsedTo.state !== 'valid') {
      return 'Enter valid from/to values.';
    }
    const boundaryOrder = this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value);
    if (boundaryOrder !== null && boundaryOrder !== -1) {
      return 'From must be below To.';
    }
    if (boundaryOrder === null) {
      const rows = this._buildSegmentValidationRows(scope);
      const mixedRow = { index: rows.length, segment: { from: parsedFrom.value, to: parsedTo.value, color },
        parsedFrom, parsedTo };
      const resolvedMessage = this._getResolvedMixedRangeValidationMessage(scope, [...rows, mixedRow], mixedRow.index);
      if (resolvedMessage) return resolvedMessage;
    }
    if (!color) {
      return 'Choose a color to add a segment.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
      if (this._compareSegmentBoundaries(parsedFrom.value, row.parsedFrom.value) === null
        || this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) === null
        || this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) === null) continue;
      const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
      const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
      if (candidateFrom === otherFrom) {
        return 'Duplicate segment start.';
      }
      if (candidateFrom < otherTo && candidateTo > otherFrom) {
        return 'Segments overlap.';
      }
    }
    return '';
  }

  _getSegmentPreviewBoundaryValue(value) {
    if (typeof value === 'string') {
      const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);
      if (match) {
        const parsed = parseFloat(match[1]);
        return Number.isFinite(parsed) ? parsed : null;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (isObject(value)) {
      if (Number.isFinite(value.percent)) {
        return value.percent;
      }
      const fixedValue = this._getFiniteNumber(value.fixed);
      if (Number.isFinite(fixedValue)) {
        return fixedValue;
      }
    }
    return null;
  }

  _sortSegmentsForEditor(segments) {
    if (!Array.isArray(segments)) {
      return [];
    }
    const rows = cloneDeep(segments);
    const coordinates = rows.map(segment => segmentCoordinate(segment?.from, this.array.segmentSpace?.() === 'percent'));
    const space = coordinates[0]?.space;
    if (!space || coordinates.some(coordinate => !coordinate || coordinate.space !== space)) return rows;
    return rows.sort((left, right) => segmentCoordinate(left?.from, space === 'percent').value
      - segmentCoordinate(right?.from, space === 'percent').value);
  }

  _getSegmentPreviewRows(scope = { type: 'card' }) {
    const committedSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const legacyPercent = this.array.segmentSpace?.() === 'percent';
    const authored = committedSegments.map((segment, index) => ({
      segment,
      index,
      fromValue: this._parseSegmentBoundaryText(this._getSegmentBoundaryText(scope, index, 'from', segment?.from)).value,
      toValue: this._parseSegmentBoundaryText(this._getSegmentBoundaryText(scope, index, 'to', segment?.to)).value,
      from: segmentCoordinate(this._getSegmentBoundaryText(scope, index, 'from', segment?.from), legacyPercent),
      to: segmentCoordinate(this._getSegmentBoundaryText(scope, index, 'to', segment?.to), legacyPercent),
    })).filter(row => row.from && typeof row.segment?.color === 'string' && row.segment.color.trim());
    if (!authored.length) return [];

    const intervals = [];
    const first = authored[0];
    if (first.from.space === 'percent' && first.from.value > 0) {
      intervals.push({ type: 'undefined', from: '0%', to: first.fromValue,
        fromCoordinate: { value: 0, space: 'percent' }, toCoordinate: first.from,
        beforeIndex: first.index, mixed: false, weight: first.from.value });
    }

    for (let index = 0; index < authored.length; index++) {
      const row = authored[index];
      const next = authored[index + 1];
      const to = row.to ?? next?.from ?? (row.from.space === 'percent' ? { value: 100, space: 'percent' } : null);
      const toValue = row.toValue ?? next?.fromValue ?? (row.from.space === 'percent' ? '100%' : null);
      const railEnd = !to;
      const mixed = railEnd || to.space !== row.from.space;
      const weight = mixed ? MIXED_INTERVAL_PREVIEW_WEIGHT : Math.abs(to.value - row.from.value);
      intervals.push({ type: 'segment', index: row.index, segment: row.segment,
        from: row.fromValue, to: toValue, fromCoordinate: row.from, toCoordinate: to,
        railEnd, mixed, weight,
        invalid: !mixed && row.from.value >= to.value });

      if (!next || !row.to) continue;
      if (to.space !== next.from.space) {
        intervals.push({ type: 'undefined', from: row.toValue, to: next.fromValue,
          fromCoordinate: to, toCoordinate: next.from,
          afterIndex: row.index, mixed: true, weight: MIXED_INTERVAL_PREVIEW_WEIGHT });
      } else if (next.from.value > to.value) {
        intervals.push({ type: 'undefined', from: row.toValue, to: next.fromValue,
          fromCoordinate: to, toCoordinate: next.from,
          afterIndex: row.index, mixed: false, weight: next.from.value - to.value });
      }
    }

    const last = authored.at(-1);
    if (last.to?.space === 'percent' && last.to.value < 100) {
      intervals.push({ type: 'undefined', from: last.toValue, to: '100%',
        fromCoordinate: last.to, toCoordinate: { value: 100, space: 'percent' },
        afterIndex: last.index, mixed: false, weight: 100 - last.to.value });
    }

    const widths = allocateSegmentPreviewWidths(intervals);
    let start = 0;
    return intervals.map((interval, index) => {
      const width = widths[index];
      const laidOut = { ...interval, previewStart: start, previewWidth: width, previewEnd: start + width };
      start += width;
      return laidOut;
    });
  }

  _buildEditorSegmentPreviewStyle(scope = { type: 'card' }) {
    return '';
  }

  _renderSegmentPreviewIntervals(scope = { type: 'card' }) {
    return this._getSegmentPreviewRows(scope).map((interval, index) => {
      const undefinedRegion = interval.type === 'undefined';
      const color = !undefinedRegion && interval.segment?.color
        ? `background-color:${escapeAttribute(interval.segment.color)};`
        : '';
      const description = undefinedRegion ? 'No Segment is defined for this range.' : 'Authored Segment range.';
      return `<span class="segment-preview-interval${undefinedRegion ? ' segment-undefined-region' : ''}${interval.invalid ? ' segment-invalid-region' : ''}" data-preview-kind="${undefinedRegion ? 'undefined' : 'segment'}" style="left:${interval.previewStart}%;width:${interval.previewWidth}%;${color}" aria-label="${escapeAttribute(description)}"></span>`;
    }).join('');
  }

  _renderSegmentListRows(scope, renderAuthored) {
    const segments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const previewRows = this._getSegmentPreviewRows(scope);
    const renderUndefined = interval => {
      const from = this._formatSegmentBoundaryValue(interval.from);
      const to = this._formatSegmentBoundaryValue(interval.to);
      const entity = scope?.type === 'entity';
      const action = entity ? 'add-entity-segment-from-undefined' : 'add-segment-from-undefined';
      const insertIndex = Number.isInteger(interval.beforeIndex)
        ? interval.beforeIndex
        : Number.isInteger(interval.afterIndex) ? interval.afterIndex + 1 : segments.length;
      return `<div class="segment-undefined-row" role="group" aria-label="Undefined Segment range ${escapeAttribute(from)} to ${escapeAttribute(to)}.">
        <span class="segment-undefined-swatch" aria-hidden="true"></span>
        <span class="segment-undefined-label"><strong>Undefined</strong><small>${escapeAttribute(from)} – ${escapeAttribute(to)}</small></span>
        <button type="button" class="segment-undefined-action" data-action="${action}"${entity ? ` data-index="${scope.index}"` : ''} data-from="${escapeAttribute(from)}" data-to="${escapeAttribute(to)}" data-insert-index="${insertIndex}">Add Segment</button>
      </div>`;
    };
    const undefinedRows = previewRows.filter(interval => interval.type === 'undefined');
    const rendered = [];
    segments.forEach((segment, index) => {
      undefinedRows.filter(interval => interval.beforeIndex === index).forEach(interval => rendered.push(renderUndefined(interval)));
      rendered.push(renderAuthored(segment, index));
      undefinedRows.filter(interval => interval.afterIndex === index).forEach(interval => rendered.push(renderUndefined(interval)));
    });
    // Keep authored controls stable while a boundary has an incomplete draft.
    // The preview may omit that range temporarily, but must not reorder inputs.
    return rendered.join('');
  }

  _getSegmentPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-segment-preview`,
        trackId: `entity-${scope.index}-segment-preview-track`,
      };
    }
    return {
      previewId: 'card-segment-preview',
      trackId: 'card-segment-preview-track',
    };
  }

  _renderSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    return `
      <div id="${previewId}" class="gradient-preview segment-preview">
        <div id="${trackId}" class="gradient-preview-track segment-preview-track" style="" aria-label="Authored Segment coverage preview">${this._renderSegmentPreviewIntervals(scope)}</div>
      </div>
    `;
  }

  _refreshSegmentPreview(scope = { type: 'card' }) {
    const { trackId } = this._getSegmentPreviewDomIds(scope);
    const track = this._getShadowElementById(trackId);
    if (!track) {
      return;
    }
    track.setAttribute('style', '');
    track.innerHTML = this._renderSegmentPreviewIntervals(scope);
  }

  _getSegmentDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        hintPrefix: `entity-${scope.index}-segment-row-hint-`,
        draftHintId: `entity-${scope.index}-segment-draft-hint`,
        addSelector: `button[data-action="add-entity-segment"][data-index="${scope.index}"]`,
      };
    }
    return {
      hintPrefix: 'segment-row-hint-',
      draftHintId: 'segment-draft-hint',
      addSelector: 'button[data-action="add-segment"]',
    };
  }

  _refreshSegmentUi(scope = { type: 'card' }) {
    this._refreshSegmentPreview(scope);
    if (!this.shadowRoot) {
      return;
    }
    const { hintPrefix, draftHintId, addSelector } = this._getSegmentDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddSegment(scope);
    }
    const rows = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    rows.forEach((_, index) => {
      const hint = this._getShadowElementById(`${hintPrefix}${index}`);
      const message = this._getSegmentRowValidationMessage(scope, index);
      if (hint) {
        hint.textContent = message;
        hint.setAttribute?.('style', message ? '' : 'display:none');
      }
    });
    const draftHint = this._getShadowElementById(draftHintId);
    if (draftHint) {
      const message = this._getSegmentDraftValidationMessage(scope);
      draftHint.textContent = message;
      draftHint.setAttribute?.('style', message ? '' : 'display:none');
    }
  }

  _commitSegmentDraft(scope = { type: 'card' }) {
    const draftSegment = this._getValidSegmentDraft(scope);
    if (!draftSegment) {
      this._refreshSegmentUi(scope);
      return false;
    }
    const committedSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const draftState = this._getSegmentDraftState(scope);
    const hasPreparedPosition = Number.isInteger(draftState.insertIndex);
    const nextSegments = hasPreparedPosition
      ? [...committedSegments.slice(0, draftState.insertIndex), draftSegment, ...committedSegments.slice(draftState.insertIndex)]
      : this._sortSegmentsForEditor([...committedSegments, draftSegment]);
    const applied = this._setScopedSegments(scope, nextSegments,
      { rerender: true, ...(hasPreparedPosition ? { sort: false } : {}) },
      { type: 'add', item: draftSegment });
    if (applied !== false) {
      this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
    }
    return applied;
  }

  _commitSegmentBoundaryEdit(scope = { type: 'card' }, segmentIndex, field, rawValue, inputEl = null) {
    this._setSegmentBoundaryText(scope, segmentIndex, field, rawValue);
    const parsed = this._parseSegmentBoundaryText(rawValue);
    if (parsed.state !== 'valid' && !(this.array.autoEnds && field === 'to' && parsed.state === 'empty')) {
      inputEl?.setCustomValidity?.('Enter a valid boundary value.');
      this._refreshSegmentUi(scope);
      return false;
    }
    if (this.array.patchOnly) {
      const message = this._getSegmentRowValidationMessage(scope, segmentIndex);
      if (message) {
        inputEl?.setCustomValidity?.(message);
        inputEl?.reportValidity?.();
        this._refreshSegmentUi(scope);
        return false;
      }
    }
    const normalizedText = normalizeTextValue(rawValue).trim();
    const parsedValue = this._parseSegmentBoundaryInput(rawValue);
    const nextValue = this.array.autoEnds && field === 'to' && !normalizedText ? undefined : parsedValue === null ? normalizedText : parsedValue;
    const currentSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const nextSegments = currentSegments.map((segment, currentIndex) => (
      currentIndex === segmentIndex
        ? { ...segment, [field]: nextValue }
        : segment
    ));
    this._clearSegmentBoundaryText(scope, segmentIndex, field);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true }, { type: 'edit', index: segmentIndex, field, value: nextValue });
    const message = this._getSegmentRowValidationMessage(scope, segmentIndex);
    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity(message || '');
      if (message) {
        inputEl.reportValidity?.();
      }
    }
    return applied;
  }

  _getScopedSegmentsValue(scope) {
    if (this.array.rows) return this.array.rows(scope, this);
    const uiRows = this._getSegmentsUiRows(scope);
    if (uiRows !== null) {
      return cloneDeep(uiRows);
    }
    const storedSegments = this._getStoredScopedSegments(scope);
    if (storedSegments !== null) {
      return this._sortSegmentsForEditor(storedSegments);
    }
    return this._sortSegmentsForEditor(this._getFallbackSegments(scope));
  }

  _hasSegmentsOverride(scope) {
    return this._getStoredScopedSegments(scope) !== null;
  }

  _getSegmentsSummary(scope) {
    if (scope?.type === 'entity' && !this._hasSegmentsOverride(scope)) {
      return 'Inherited';
    }
    const segments = this._getScopedSegmentsValue(scope);
    if (!Array.isArray(segments) || segments.length === 0) {
      return 'Inherited';
    }
    if (scope?.type !== 'entity' && !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(this.fillStyle(scope))) {
      return 'Default bands';
    }
    return `${segments.length} segments`;
  }

  _setScopedSegments(scope, rows, options = {}, operation) {
    return this.array.write(scope, rows, options, operation);
  }

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content, { section = true } = {}) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const segmentsInherited = !this._hasSegmentsOverride(scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${index}"${segmentsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-segments-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._isSegmentFillStyle(this.fillStyle(scope))
                        ? ''
                        : '<div class="section-note">Only used with segment-based fill styles.</div>'
                      }
                      ${this._renderSegmentPreview(scope)}
                      <div class="field-row">
                        <label>Segments</label>
                        <div class="list">
                          ${this._renderSegmentListRows(scope, (segment, segmentIndex) => `
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'from', segment?.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, 'to', segment?.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute(segment?.color ?? '#4a9eff')}">
                              <button type="button" data-action="remove-entity-segment" data-index="${index}" data-segment-index="${segmentIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                            <div id="entity-${index}-segment-row-hint-${segmentIndex}" class="section-note"${this._getSegmentRowValidationMessage(scope, segmentIndex) ? '' : ' style="display:none"'}>${escapeAttribute(this._getSegmentRowValidationMessage(scope, segmentIndex))}</div>
                            </div>
                          `)}
                          <div class="segment-draft">
                            <div class="segment-draft-heading">Add Segment</div>
                            <div class="list-row triple segment-row">
                              <input id="entity-${index}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).from)}" placeholder="0%">
                              <input id="entity-${index}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).color || '#4a9eff')}">
                              <button type="button" data-action="add-entity-segment" data-index="${index}"${this._canAddSegment(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            <div id="entity-${index}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(scope) ? '' : ' style="display:none"'}>${escapeAttribute(this._getSegmentDraftValidationMessage(scope))}</div>
                          </div>
                        </div>
                      </div>
	                          `;
    }
    const fillStyle = this.fillStyle(scope);
    const defaultSegmentsVisible = !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(fillStyle);
    const group = renderGroup({
      group: 'segments',
      title: 'Segments',
      summary: this._getSegmentsSummary({ type: 'card' }),
      inactive: !this._isSegmentFillStyle(fillStyle),
      content: `
              ${this._isSegmentFillStyle(fillStyle)
                ? ''
                : '<div class="section-note">Only used with segment-based fill styles.</div>'
              }
                ${this._renderSegmentPreview({ type: 'card' })}
              <div class="field-row">
                <label>Segments</label>
                <div class="list">
                  ${defaultSegmentsVisible
                    ? '<div class="section-note">Default bands</div>'
                    : ''
                  }
                  ${this._renderSegmentListRows({ type: 'card' }, (segment, index) => `
                    <div class="segment-editor-row">
                    <div class="list-row triple segment-row">
                      <input type="text"${this.array.autoEnds ? ` aria-label="Segment ${index + 1} start"` : ''} data-kind="segment-from" data-index="${index}" value="${escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'from', segment?.from))}" placeholder="0%">
                      <input type="text"${this.array.autoEnds ? ` aria-label="Segment ${index + 1} end (blank = Auto)"` : ''} data-kind="segment-to" data-index="${index}" value="${escapeAttribute(this._getSegmentBoundaryText({ type: 'card' }, index, 'to', segment?.to))}" placeholder="${this.array.autoEnds ? 'Auto' : '100%'}">
                      ${this.array.cssText ? renderColorInput({ id: `segment-color-${index}`, kind: 'segment-color', index, value: segment?.color ?? '#4a9eff', fallbackHex: '#4a9eff', cssText: true, label: `Segment ${index + 1} color` }) : `<input type="color" data-kind="segment-color" data-index="${index}" value="${escapeAttribute(segment?.color ?? '#4a9eff')}">`}
                      <button type="button" data-action="remove-segment" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
                    </div>
                      <div id="segment-row-hint-${index}" class="section-note"${this._getSegmentRowValidationMessage({ type: 'card' }, index) ? '' : ' style="display:none"'}>${escapeAttribute(this._getSegmentRowValidationMessage({ type: 'card' }, index))}</div>
                      </div>
                  `)}
                    <div class="segment-draft">
                      <div class="segment-draft-heading">Add Segment</div>
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds ? ' aria-label="New segment start"' : ''} data-kind="segment-draft-from" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds ? ' aria-label="New segment end (blank = Auto)"' : ''} data-kind="segment-draft-to" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).to)}" placeholder="${this.array.autoEnds ? 'Auto' : '100%'}">
                        ${this.array.cssText ? renderColorInput({ id: 'segment-draft-color', kind: 'segment-draft-color', value: this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff', fallbackHex: '#4a9eff', cssText: true, label: 'New segment color' }) : `<input type="color" data-kind="segment-draft-color" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff')}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({ type: 'card' }) ? '' : ' disabled'}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({ type: 'card' }) ? '' : ' style="display:none"'}>${escapeAttribute(this._getSegmentDraftValidationMessage({ type: 'card' }))}</div>
                    </div>
                </div>
              </div>`,
    });
    if (!section) return group;
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${group}
	        </div>`;
  }
}
