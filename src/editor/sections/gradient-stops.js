import { parsePercentLiteral } from '../../config/normalize.js';
import { cloneDeep, serializeConfig, isObject, normalizeTextValue, normalizeNumberValue,
  setPathValue, deletePathValue, pruneEmptyObjectsInTarget } from '../shared/editor-config.js';
import { escapeAttribute, normalizeColorComparisonValue, renderColorInput } from '../shared/editor-controls.js';
import { PaletteSection } from '../shared/palette-section.js';

export class GradientStopsSection extends PaletteSection {
  constructor(context, ui, array) {
    super(context, ui, array);
    this.reset();
  }

  reset() {
    this._gradientStopsDrafts = new Map();
    this._gradientStopsUiRows = new Map();
    this._gradientStopPosTexts = new Map();
    this._gradientStopValidationMessages = new Map();
  }

  _setGradientStops(stops, options = {}) {
    return this._setScopedGradientStops({ type: 'card' }, stops, options);
  }

  _getDefaultGradientStops() {
    return [
      { pos: 0, color: '#4CAF50' },
      { pos: 50, color: '#FF9800' },
      { pos: 100, color: '#F44336' },
    ];
  }

  _normalizeGradientStopPosValue(rawValue) {
    const percent = parsePercentLiteral(rawValue);
    const numericValue = Number.isFinite(percent) ? percent : normalizeNumberValue(rawValue);
    if (numericValue === null || !Number.isFinite(numericValue)) {
      return null;
    }
    if (numericValue < 0 || numericValue > 100) {
      return null;
    }
    return numericValue;
  }

  _sanitizeGradientStopsForEmit(stops) {
    if (!Array.isArray(stops)) {
      return [];
    }

    return stops
      .map((stop) => {
        if (!isObject(stop)) {
          return null;
        }
        const pos = this._normalizeGradientStopPosValue(stop.pos);
        const color = normalizeTextValue(stop.color).trim();
        if (pos === null || !color) {
          return null;
        }
        return {
          ...stop,
          pos,
          color,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.pos - right.pos);
  }

  _getGradientStopDraftColorDefault(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (committedStops.length) {
      return committedStops[committedStops.length - 1].color ?? '#4CAF50';
    }
    return this._getDefaultGradientStops()[0].color;
  }

  _getNextSuggestedGradientStopPos(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (!committedStops.length) {
      return 0;
    }

    const highest = committedStops[committedStops.length - 1];
    if (highest.pos >= 100) {
      return '';
    }

    let suggestedPos;
    if (committedStops.length === 1) {
      suggestedPos = highest.pos + 25;
    } else {
      const previous = committedStops[committedStops.length - 2];
      suggestedPos = highest.pos + (highest.pos - previous.pos);
    }

    const clampedPos = Math.min(100, Math.max(0, suggestedPos));
    if (committedStops.some((stop) => stop.pos === clampedPos)) {
      return '';
    }
    return clampedPos;
  }

  _getGradientStopsDraftKey(scope) {
    return scope?.type === 'entity' ? `entity:${scope.index}` : 'card';
  }

  _getGradientStopPosTextKey(scope, stopIndex) {
    return `${this._getGradientStopsDraftKey(scope)}:pos:${stopIndex}`;
  }

  _getGradientStopPosText(scope = { type: 'card' }, stopIndex, fallbackValue = '') {
    const key = this._getGradientStopPosTextKey(scope, stopIndex);
    if (this._gradientStopPosTexts.has(key)) {
      return this._gradientStopPosTexts.get(key);
    }
    if (fallbackValue === '' || fallbackValue === null || fallbackValue === undefined) {
      return '';
    }
    return String(fallbackValue);
  }

  _setGradientStopPosText(scope, stopIndex, rawValue) {
    this._gradientStopPosTexts.set(
      this._getGradientStopPosTextKey(scope, stopIndex),
      normalizeTextValue(rawValue),
    );
  }

  _clearGradientStopPosText(scope, stopIndex) {
    this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(scope, stopIndex));
  }

  _clearGradientStopScopeTextState(scope) {
    const prefix = `${this._getGradientStopsDraftKey(scope)}:pos:`;
    for (const key of this._gradientStopPosTexts.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopPosTexts.delete(key);
      }
    }
    for (const key of this._gradientStopValidationMessages.keys()) {
      if (key.startsWith(prefix)) {
        this._gradientStopValidationMessages.delete(key);
      }
    }
  }

  _getGradientStopsUiRows(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (this._gradientStopsUiRows.has(key)) {
      return cloneDeep(this._gradientStopsUiRows.get(key));
    }
    return null;
  }

  _setGradientStopsUiRows(scope, stops) {
    this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(scope), cloneDeep(stops));
  }

  _getStoredScopedGradientStops(scope = { type: 'card' }) {
    const structuredValue = this.context.read(scope, ['bar', 'gradient_stops']);
    if (structuredValue !== undefined) {
      return structuredValue;
    }
    const legacyValue = this.context.read(scope, ['gradient_stops']);
    if (legacyValue !== undefined) {
      return legacyValue;
    }
    return null;
  }

  _getFallbackGradientStops(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      const inheritedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({ type: 'card' }));
      return inheritedStops.length ? inheritedStops : this._getDefaultGradientStops();
    }
    return this._getDefaultGradientStops();
  }

  _createGradientStopDraftState(scope = { type: 'card' }) {
    const suggestedPos = this._getNextSuggestedGradientStopPos(scope);
    return {
      pos: suggestedPos === '' ? '' : String(suggestedPos),
      color: this._getGradientStopDraftColorDefault(scope),
    };
  }

  _getGradientStopsDraftState(scope = { type: 'card' }) {
    const key = this._getGradientStopsDraftKey(scope);
    if (!this._gradientStopsDrafts.has(key)) {
      this._gradientStopsDrafts.set(key, this._createGradientStopDraftState(scope));
    }
    return cloneDeep(this._gradientStopsDrafts.get(key));
  }

  _setGradientStopsDraftState(scope, nextDraft, options = {}) {
    this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
      pos: nextDraft?.pos ?? '',
      color: nextDraft?.color ?? this._getGradientStopDraftColorDefault(scope),
    });
    if (options?.refreshOnly) {
      this._refreshGradientDraftUi(scope);
      return;
    }
    this.ui.render();
  }

  _setGradientStopsDraftField(scope, field, rawValue) {
    const currentDraft = this._getGradientStopsDraftState(scope);
    const nextValue = field === 'color'
      ? normalizeTextValue(rawValue).trim()
      : normalizeTextValue(rawValue);
    this._setGradientStopsDraftState(scope, {
      ...currentDraft,
      [field]: nextValue,
    }, { refreshOnly: field === 'pos' });
  }

  _getValidGradientDraftStop(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const pos = this._normalizeGradientStopPosValue(draft.pos);
    const color = normalizeTextValue(draft.color).trim();
    if (pos === null || !color) {
      return null;
    }
    return { pos, color };
  }

  _hasGradientStopDuplicate(scope = { type: 'card' }, candidatePos, excludeIndex = null) {
    if (this.array.patchOnly) return this._getScopedGradientStopsValue(scope).some((stop, index) => (
      index !== excludeIndex && this._normalizeGradientStopPosValue(stop?.pos) === candidatePos
    ));
    return this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope)).some((stop, index) => (
      index !== excludeIndex && stop.pos === candidatePos
    ));
  }

  _canAddGradientStop(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop) {
      return false;
    }
    return !this._hasGradientStopDuplicate(scope, draftStop.pos);
  }

  _getGradientDraftValidationMessage(scope = { type: 'card' }) {
    const draft = this._getGradientStopsDraftState(scope);
    const normalizedPosText = normalizeTextValue(draft.pos).trim();
    const normalizedColor = normalizeTextValue(draft.color).trim();
    if (!normalizedPosText) {
      return 'Enter a position to add a stop.';
    }
    if (this._normalizeGradientStopPosValue(draft.pos) === null) {
      return 'Enter a value from 0 to 100.';
    }
    if (!normalizedColor) {
      return 'Choose a color to add a stop.';
    }
    if (this._hasGradientStopDuplicate(scope, this._normalizeGradientStopPosValue(draft.pos))) {
      return 'Position already exists.';
    }
    return '';
  }

  _isDefaultGradientStops(stops) {
    const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
    const defaultStops = this._getDefaultGradientStops();
    if (sanitizedStops.length !== defaultStops.length) {
      return false;
    }
    return sanitizedStops.every((stop, index) => (
      stop.pos === defaultStops[index].pos
      && normalizeColorComparisonValue(stop.color) === normalizeColorComparisonValue(defaultStops[index].color)
    ));
  }

  _clearGradientStopsOverride(scope) {
    const previousUiRowsJson = serializeConfig(this._getGradientStopsUiRows(scope) ?? []);
    this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(scope));
    this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(scope));
    this._clearGradientStopScopeTextState(scope);
    const applied = this.context.mutate(scope, (target) => {
      let nextTarget = deletePathValue(target, ['bar', 'gradient_stops']);
      nextTarget = deletePathValue(nextTarget, ['gradient_stops']);
      nextTarget = pruneEmptyObjectsInTarget(nextTarget, ['bar']);
      return nextTarget;
    }, { rerender: true });
    if (applied === false && previousUiRowsJson !== serializeConfig([])) {
      this.ui.render();
    }
    return applied;
  }

  _getGradientStopsValue() {
    return this._getScopedGradientStopsValue({ type: 'card' });
  }

  _commitGradientStopDraft(scope = { type: 'card' }) {
    const draftStop = this._getValidGradientDraftStop(scope);
    if (!draftStop || this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      this._refreshGradientDraftUi(scope);
      return false;
    }
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const nextStops = [...committedStops, draftStop].sort((left, right) => left.pos - right.pos);
    const applied = this._setScopedGradientStops(scope, nextStops, { rerender: true }, { type: 'add', item: draftStop });
    if (applied !== false) {
      this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
        pos: (() => {
          const suggestion = this._getNextSuggestedGradientStopPos(scope);
          return suggestion === '' ? '' : String(suggestion);
        })(),
        color: draftStop.color,
      });
    }
    return applied;
  }

  _getGradientPreviewDomIds(scope = { type: 'card' }) {
    if (scope?.type === 'entity') {
      return {
        previewId: `entity-${scope.index}-gradient-preview`,
        trackId: `entity-${scope.index}-gradient-preview-track`,
        hintId: `entity-${scope.index}-gradient-draft-hint`,
        addSelector: `button[data-action="add-entity-gradient-stop"][data-index="${scope.index}"]`,
        draftInputId: `entity-${scope.index}-gradient-draft-pos`,
      };
    }
    return {
      previewId: 'card-gradient-preview',
      trackId: 'card-gradient-preview-track',
      hintId: 'gradient-draft-hint',
      addSelector: 'button[data-action="add-gradient-stop"]',
      draftInputId: 'gradient-draft-pos',
    };
  }

  _refreshGradientDraftUi(scope = { type: 'card' }) {
    if (!this.shadowRoot) {
      return;
    }
    const getById = this.shadowRoot.getElementById?.bind(this.shadowRoot)
      ?? ((id) => this.shadowRoot.querySelector?.(`#${id}`) ?? null);
    const { previewId, trackId, hintId, addSelector, draftInputId } = this._getGradientPreviewDomIds(scope);
    const addButton = this.shadowRoot.querySelector(addSelector);
    if (addButton) {
      addButton.disabled = !this._canAddGradientStop(scope);
    }

    const draftInput = getById(draftInputId);
    if (draftInput && typeof draftInput.closest !== 'function') {
      this.ui.render();
      return;
    }
    const draftContainer = draftInput?.closest('.gradient-stop-draft');
    const nextMessage = this._getGradientDraftValidationMessage(scope);
    const existingHint = getById(hintId);
    if (nextMessage) {
      if (existingHint) {
        existingHint.textContent = nextMessage;
      } else if (draftContainer) {
        const hint = document.createElement('div');
        hint.id = hintId;
        hint.className = 'section-note';
        hint.textContent = nextMessage;
        draftContainer.appendChild(hint);
      }
    } else if (existingHint) {
      existingHint.remove();
    }

    const preview = getById(previewId);
    const track = getById(trackId);
    if (!preview || !track) {
      return;
    }
    track.setAttribute('style', this._getGradientPreviewStyle(scope) ?? '');
    const markerStops = this._buildGradientPreviewEffectiveStops(scope);
    const renderedStops = markerStops.length ? markerStops : this._getDefaultGradientStops();
    track.innerHTML = renderedStops.map((stop, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${escapeAttribute(String(stop.pos))}%"
        title="${escapeAttribute(`${stop.pos}%`)}"
      ></span>
    `).join('');
  }

  _commitGradientStopPosEdit(scope = { type: 'card' }, stopIndex, rawValue, inputEl = null) {
    const nextPos = this._normalizeGradientStopPosValue(rawValue);
    if (nextPos === null || this._hasGradientStopDuplicate(scope, nextPos, stopIndex)) {
      if (inputEl?.setCustomValidity) {
        inputEl.setCustomValidity(nextPos === null
          ? 'Enter a value from 0 to 100.'
          : 'Position already exists.');
        if (inputEl.reportValidity) {
          inputEl.reportValidity();
        }
      }
      return false;
    }

    if (inputEl?.setCustomValidity) {
      inputEl.setCustomValidity('');
    }

    const currentStops = this._getScopedGradientStopsValue(scope);
    const nextStops = currentStops.map((stop, currentStopIndex) => (
      currentStopIndex === stopIndex
        ? { ...stop, pos: nextPos }
        : stop
    ));
    this._clearGradientStopPosText(scope, stopIndex);
    return this._setScopedGradientStops(scope, nextStops, { rerender: true }, { type: 'edit', index: stopIndex, field: 'pos', value: nextPos });
  }

  _getScopedGradientStopsValue(scope) {
    if (this.array.rows) return this.array.rows(scope, this);
    const localRows = this._getGradientStopsUiRows(scope);
    if (Array.isArray(localRows)) {
      return localRows;
    }
    const storedStops = this._getStoredScopedGradientStops(scope);
    if (storedStops !== null) {
      return this._sanitizeGradientStopsForEmit(storedStops);
    }
    return cloneDeep(this._getFallbackGradientStops(scope));
  }

  _hasGradientStopsOverride(scope) {
    if (this._getStoredScopedGradientStops(scope) !== null) {
      return true;
    }
    const localRows = this._getGradientStopsUiRows(scope);
    if (!Array.isArray(localRows)) {
      return false;
    }
    return serializeConfig(this._sanitizeGradientStopsForEmit(localRows))
      !== serializeConfig(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(scope)));
  }

  _getGradientStopsSummary(scope) {
    if (scope?.type === 'entity' && !this._hasGradientStopsOverride(scope)) {
      return 'Inherited';
    }
    const gradientStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    if (this.fillStyle(scope) !== 'gradient') {
      return 'Inactive fill style';
    }
    if (!gradientStops.length) {
      return scope?.type === 'entity' ? 'Inherited' : 'Default gradient';
    }
    if (this._isDefaultGradientStops(gradientStops)) {
      return 'Default gradient';
    }
    return `${gradientStops.length} stops`;
  }

  _buildGradientPreviewEffectiveStops(scope = { type: 'card' }) {
    const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
    const draftStop = this._getValidGradientDraftStop(scope);
    const previewStops = [...committedStops];
    if (draftStop && !this._hasGradientStopDuplicate(scope, draftStop.pos)) {
      previewStops.push(draftStop);
    }
    return previewStops.sort((left, right) => left.pos - right.pos);
  }

  _buildEditorGradientPreviewStyle(stops) {
    if (!Array.isArray(stops) || !stops.length) {
      return '';
    }
    const cssStops = stops
      .map((stop) => {
        const color = normalizeTextValue(stop.color).trim();
        const pos = this._normalizeGradientStopPosValue(stop.p ?? stop.pos);
        if (!color || pos === null) {
          return null;
        }
        return `${color} ${pos}%`;
      })
      .filter(Boolean);
    if (!cssStops.length) {
      return '';
    }
    return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
  }

  _getGradientPreviewStyle(scope = { type: 'card' }) {
    const previewStops = this._buildGradientPreviewEffectiveStops(scope);
    const resolvedStops = previewStops.length >= 2
      ? previewStops.map((stop) => ({ p: stop.pos, color: stop.color }))
      : this._getDefaultGradientStops().map((stop) => ({ p: stop.pos, color: stop.color }));
    return this._buildEditorGradientPreviewStyle(resolvedStops);
  }

  _renderGradientPreview(scope = { type: 'card' }, options = {}) {
    const previewId = options.previewId ?? 'gradient-preview';
    const trackId = options.trackId ?? `${previewId}-track`;
    const effectiveStops = this._buildGradientPreviewEffectiveStops(scope);
    const markerStops = effectiveStops.length ? effectiveStops : this._getDefaultGradientStops();
    return `
      <div id="${previewId}" class="gradient-preview">
        <div id="${trackId}" class="gradient-preview-track" style="${escapeAttribute(this._getGradientPreviewStyle(scope) ?? '')}">
          ${markerStops.map((stop, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${escapeAttribute(String(stop.pos))}%"
              title="${escapeAttribute(`${stop.pos}%`)}"
            ></span>
          `).join('')}
        </div>
      </div>
    `;
  }

  _setScopedGradientStops(scope, rows, options = {}, operation) {
    return this.array.write(scope, rows, options, operation);
  }

  render(scope = { type: 'card' }, renderGroup = ({ content }) => content) {
    if (scope?.type === 'entity') {
      const index = scope.index;
      const entityGradientStops = this._getScopedGradientStopsValue(scope);
      const entityGradientDraft = this._getGradientStopsDraftState(scope);
      const entityGradientDraftMessage = this._getGradientDraftValidationMessage(scope);
      const gradientStopsInherited = !this._hasGradientStopsOverride(scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${index}"${gradientStopsInherited ? ' checked' : ''}>
                          <label for="entity-${index}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this.fillStyle(scope) !== 'gradient'
                        ? '<div class="section-note">Only used with Gradient fill style</div>'
                        : ''
                      }
                      ${this._renderGradientPreview(scope, {
                        previewId: `entity-${index}-gradient-preview`,
                        trackId: `entity-${index}-gradient-preview-track`,
                      })}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(entityGradientStops, (stop, stopIndex) => `
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${index}" data-stop-index="${stopIndex}" value="${escapeAttribute(this._getGradientStopPosText(scope, stopIndex, stop?.pos ?? ''))}" placeholder="0">
                              ${renderColorInput({
                                id: `entity-${index}-gradient-color-${stopIndex}`,
                                kind: 'entity-gradient-color',
                                index,
                                value: stop?.color ?? '#4a9eff',
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                                extraDataset: { 'stop-index': stopIndex },
                              })}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${index}" data-stop-index="${stopIndex}" aria-label="Remove" title="Remove">🗑</button>
                            </div>
                          `)}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${index}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${index}" value="${escapeAttribute(entityGradientDraft.pos)}" placeholder="0">
                              ${renderColorInput({
                                id: `entity-${index}-gradient-draft-color`,
                                kind: 'entity-gradient-draft-color',
                                index,
                                value: entityGradientDraft.color,
                                fallbackHex: '#4CAF50',
                                placeholder: 'CSS color value',
                              })}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${index}"${this._canAddGradientStop(scope) ? '' : ' disabled'}>Add</button>
                            </div>
                            ${entityGradientDraftMessage
                              ? `<div id="entity-${index}-gradient-draft-hint" class="section-note">${escapeAttribute(entityGradientDraftMessage)}</div>`
                              : ''
                            }
                          </div>
                        </div>
                      </div>
	                          `;
    }
    const gradientStops = this._getScopedGradientStopsValue(scope);
    const gradientDraft = this._getGradientStopsDraftState(scope);
    const gradientDraftMessage = this._getGradientDraftValidationMessage(scope);
    const gradientStopsSummary = this._getGradientStopsSummary(scope);
    const gradientStopsInactive = this.fillStyle(scope) !== 'gradient';
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${renderGroup({
	            group: 'gradient-stops',
	            title: 'Gradient Stops',
	            summary: gradientStopsSummary,
	            inactive: gradientStopsInactive,
	            content: `
	              ${gradientStopsInactive
	                ? '<div class="section-note">Only used with Gradient fill style</div>'
	                : ''
	              }
	              ${this._renderGradientPreview({ type: 'card' }, {
	                previewId: 'card-gradient-preview',
	                trackId: 'card-gradient-preview-track',
	              })}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(gradientStops, (stop, index) => `
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${index}" value="${escapeAttribute(this._getGradientStopPosText({ type: 'card' }, index, stop?.pos ?? ''))}" placeholder="0">
	                      ${renderColorInput({
	                        id: `gradient-color-${index}`,
	                        kind: 'gradient-color',
	                        index,
	                        value: stop?.color ?? '#4a9eff',
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${index}" aria-label="Remove" title="Remove">🗑</button>
	                    </div>
	                  `)}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${escapeAttribute(gradientDraft.pos)}" placeholder="0">
	                      ${renderColorInput({
	                        id: 'gradient-draft-color',
	                        kind: 'gradient-draft-color',
	                        index: 'card',
	                        value: gradientDraft.color,
	                        fallbackHex: '#4CAF50',
	                        placeholder: 'CSS color value',
	                      })}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({ type: 'card' }) ? '' : ' disabled'}>Add</button>
	                    </div>
	                    ${gradientDraftMessage
	                      ? `<div id="gradient-draft-hint" class="section-note">${escapeAttribute(gradientDraftMessage)}</div>`
	                      : ''
	                    }
	                  </div>
	                </div>
	              </div>
	            `,
	          })}
	        </div>`;
  }
}
