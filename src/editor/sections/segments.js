import { cloneDeep, serializeConfig, isObject, normalizeTextValue, normalizeNumberValue,
  setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue, renderColorInput, normalizeEditorColorValue } from '../shared/editor-controls.js';
import { normalizeGaugeSegments, normalizeScaleConfig } from '../../config/normalize.js';
import { getResolvedScale } from '../../config/resolve.js';
import { getSegmentsForRendering } from '../../view-model/bar-render-model.js';
import { PaletteSection } from '../shared/palette-section.js';

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
    }, { refreshOnly: true });
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
    const segments = this._getScopedSegmentsValue(scope);
    if (segments.length) {
      return normalizeTextValue(segments[segments.length - 1]?.color).trim() || '#4a9eff';
    }
    return '#4CAF50';
  }

  _getNewSegmentDefaults(scope = { type: 'card' }) {
    const segments = this._getScopedSegmentsValue(scope);
    const previous = segments[segments.length - 1];
    const previousTo = previous?.to ?? null;
    return {
      from: previousTo ?? '0%',
      to: '100%',
      color: '#4a9eff',
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
    const leftValue = this._getSegmentPreviewBoundaryValue(left);
    const rightValue = this._getSegmentPreviewBoundaryValue(right);
    if (leftValue === null || rightValue === null) {
      return null;
    }
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
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
    if (this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
    for (const other of rows) {
      if (other.index === segmentIndex) continue;
      if (other.parsedFrom.state !== 'valid' || other.parsedTo.state !== 'valid') continue;
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
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return null;
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
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
    if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
      return 'From must be below To.';
    }
    if (!color) {
      return 'Choose a color to add a segment.';
    }
    const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
    const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
    const rows = this._buildSegmentValidationRows(scope);
    for (const row of rows) {
      if (row.parsedFrom.state !== 'valid' || row.parsedTo.state !== 'valid') continue;
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
    return cloneDeep(segments).sort((left, right) => {
      const leftFrom = this._getSegmentPreviewBoundaryValue(left?.from);
      const rightFrom = this._getSegmentPreviewBoundaryValue(right?.from);
      if (leftFrom === null && rightFrom === null) return 0;
      if (leftFrom === null) return 1;
      if (rightFrom === null) return -1;
      return leftFrom - rightFrom;
    });
  }

  _getSegmentPreviewRows(scope = { type: 'card' }) {
    if (this.array.autoEnds) {
      const draft = this._getValidSegmentDraft(scope);
      return this._resolveAutomaticEndRows(scope, [...this._getAutomaticEndInputRows(scope), ...(draft ? [draft] : [])]);
    }
    const baseSegments = this._getSegmentsUiRows(scope) ?? this._getScopedSegmentsValue(scope);
    const previewSegments = this._sortSegmentsForEditor(baseSegments);
    const validDraft = this._getValidSegmentDraft(scope);
    if (validDraft) {
      previewSegments.push(validDraft);
    }
    return this._sortSegmentsForEditor(previewSegments).filter((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment?.from);
      const to = this._getSegmentPreviewBoundaryValue(segment?.to);
      return from !== null && to !== null && typeof segment?.color === 'string' && segment.color.trim();
    });
  }

  _buildEditorSegmentPreviewStyle(scope = { type: 'card' }) {
    const segments = this._getSegmentPreviewRows(scope);
    if (!segments.length) {
      return '';
    }
    const fillStyle = this.fillStyle(scope);
    const stops = [];
    segments.forEach((segment) => {
      const from = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.from)));
      const to = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.to)));
      stops.push(`${segment.color} ${from}%`, `${segment.color} ${to}%`);
    });
    if (fillStyle === 'bands') {
      return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
    }
    return `background:linear-gradient(to right,${stops.join(',')});background-repeat:no-repeat;`;
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
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    return `
      <div id="${previewId}" class="gradient-preview segment-preview">
        <div id="${trackId}" class="gradient-preview-track segment-preview-track" style="${escapeAttribute(this._buildEditorSegmentPreviewStyle(scope) ?? '')}">
          ${uniqueMarkers.map((marker, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${escapeAttribute(String(marker))}%"
              title="${escapeAttribute(`${marker}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _refreshSegmentPreview(scope = { type: 'card' }) {
    const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
    const track = this._getShadowElementById(trackId);
    if (!track) {
      return;
    }
    track.setAttribute('style', this._buildEditorSegmentPreviewStyle(scope) ?? '');
    const segments = this._getSegmentPreviewRows(scope);
    const markers = [];
    segments.forEach((segment) => {
      const from = this._getSegmentPreviewBoundaryValue(segment.from);
      const to = this._getSegmentPreviewBoundaryValue(segment.to);
      if (from !== null) markers.push(from);
      if (to !== null) markers.push(to);
    });
    const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
    track.innerHTML = uniqueMarkers.map((marker, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${escapeAttribute(String(marker))}%"
        title="${escapeAttribute(`${marker}%`)}"
      ></span>
    `).join('');
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
    const nextSegments = this._sortSegmentsForEditor([...committedSegments, draftSegment]);
    const applied = this._setScopedSegments(scope, nextSegments, { rerender: true }, { type: 'add', item: draftSegment });
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

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const entitySegments = this._getScopedSegmentsValue(scope);
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
                          ${this._renderListRows(entitySegments, (segment, segmentIndex) => `
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
    const segments = this._getScopedSegmentsValue(scope);
    const defaultSegmentsVisible = !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(fillStyle);
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${renderGroup({
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
	                  ${this._renderListRows(segments, (segment, index) => `
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
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds ? ' aria-label="New segment start"' : ''} data-kind="segment-draft-from" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds ? ' aria-label="New segment end (blank = Auto)"' : ''} data-kind="segment-draft-to" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).to)}" placeholder="${this.array.autoEnds ? 'Auto' : '100%'}">
                        ${this.array.cssText ? renderColorInput({ id: 'segment-draft-color', kind: 'segment-draft-color', value: this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff', fallbackHex: '#4a9eff', cssText: true, label: 'New segment color' }) : `<input type="color" data-kind="segment-draft-color" value="${escapeAttribute(this._getSegmentDraftState({ type: 'card' }).color || '#4a9eff')}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({ type: 'card' }) ? '' : ' disabled'}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({ type: 'card' }) ? '' : ' style="display:none"'}>${escapeAttribute(this._getSegmentDraftValidationMessage({ type: 'card' }))}</div>
                    </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>`;
  }
}
