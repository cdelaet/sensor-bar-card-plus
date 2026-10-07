import { normalizeTextValue, normalizeNumberValue } from './editor-config.js';

// Templates preserve the existing IDs/data routing. The host supplies resolved
// values and owns picker synchronization, event handling and persistence.
export function renderEntityInput(entry, index) {
  if (customElements.get('ha-entity-picker')) {
    return `<ha-entity-picker data-kind="entity-picker" data-index="${index}"></ha-entity-picker>`;
  }
  return `<input type="text" data-kind="entity-input" data-index="${index}" value="${escapeAttribute(entry.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
}

export function renderEntitySourceInput(kind, index, value, placeholder = 'sensor.example', extraDataset = {}) {
  const extraAttrs = Object.entries(extraDataset)
    .map(([key, entry]) => `data-${key}="${escapeAttribute(entry)}"`)
    .join(' ');
  if (customElements.get('ha-entity-picker')) {
    return `<ha-entity-picker data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}></ha-entity-picker>`;
  }
  return `<input type="text" data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''} value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
}

export function renderBuiltinMarkerLabelControls(scope, key, title, options) {
  const isEntity = scope?.type === 'entity';
  const prefix = isEntity ? `entity-${scope.index}-${key}` : key;
  const attr = isEntity ? `data-kind="entity-${key}-label-` : `data-field="${key}-label-`;
  const suffix = isEntity ? `" data-index="${scope.index}"` : '"';
  return `
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show" type="checkbox" ${attr}show${suffix}${options.show ? ' checked' : ''}>
        <label for="${prefix}-label-show">Show ${title} label</label>
      </div></div>
      <div class="field-row"><label for="${prefix}-label-text">${title} label text</label>
        <input id="${prefix}-label-text" type="text" ${attr}text${suffix} value="${escapeAttribute(options.text ?? '')}" placeholder="optional semantic text">
      </div>
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show-value" type="checkbox" ${attr}show-value${suffix}${options.showValue ? ' checked' : ''}>
        <label for="${prefix}-label-show-value">Show value</label>
      </div></div>
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show-unit" type="checkbox" ${attr}show-unit${suffix}${options.showUnit ? ' checked' : ''}>
        <label for="${prefix}-label-show-unit">Show unit</label>
      </div></div>
      <div class="field-row"><label for="${prefix}-label-precision">${title} label precision</label>
        <input id="${prefix}-label-precision" type="number" min="0" step="1" ${attr}precision${suffix} value="${escapeAttribute(options.precision)}" placeholder="inherit primary precision">
      </div>`;
}

export function renderResetOptions(value) {
  const selected = normalizeTextValue(value).trim().toLowerCase() || 'never';
  const options = [
    'never', 'quarterly', 'hourly', 'daily', 'weekly', 'monthly', 'yearly',
    ...Array.from({ length: 59 }, (_, index) => `${index + 1}m`),
    ...Array.from({ length: 23 }, (_, index) => `${index + 1}h`),
  ];
  return options.map((option) => `<option value="${option}"${selected === option ? ' selected' : ''}>${option}</option>`).join('');
}

export function escapeAttribute(value) {
  return normalizeTextValue(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function isHexColorValue(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function expandHexColor(value) {
  if (!isHexColorValue(value)) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 7) {
    return normalized;
  }
  return `#${normalized.slice(1).split('').map((char) => char + char).join('')}`;
}

export function normalizeColorComparisonValue(value) {
  const normalizedText = normalizeTextValue(value).trim().toLowerCase();
  if (!normalizedText) {
    return '';
  }
  return expandHexColor(normalizedText) ?? normalizedText;
}

export function getColorPickerValue(value, fallbackHex = '#000000') {
  return expandHexColor(value) ?? expandHexColor(fallbackHex) ?? '#000000';
}

export function normalizeEditorColorValue(value, preserveText = false) {
  const text = normalizeTextValue(value);
  return preserveText && text.trim() ? text : text.trim();
}

export function normalizeScalePercentageInput(value) {
  const number = normalizeNumberValue(value);
  return number !== null && number >= 0 && number <= 100 ? number : null;
}

// Same compact percentage input used by Reference, Target and Baseline.
export function renderScalePercentageInput(id, routing, value) {
  return `<input id="${id}" type="number" min="0" max="100" step="any" ${routing} value="${escapeAttribute(value)}">%`;
}

export function getMarkerSourceMode(source) {
  if (Number.isFinite(source.percent)) return 'percent';
  if (source.entity) return source.fixed !== '' && source.fixed !== undefined ? 'entity-fallback' : 'entity';
  return 'fixed';
}

export function renderMarkerPercentageControls(key, mode, percent) {
  return `<div class="field-row">
      <label for="${key}-source-mode">Source</label>
      <select id="${key}-source-mode" data-field="${key}-source-mode">
        ${[['fixed','Fixed'],['entity','Entity'],['entity-fallback','Entity with fixed fallback'],['percent','Percentage']].map(([value,title]) => `<option value="${value}"${mode === value ? ' selected' : ''}>${title}</option>`).join('')}
      </select>
    </div>
    <div class="field-row">
      <label for="${key}-percent">Scale percentage</label>
      ${renderScalePercentageInput(`${key}-percent`, `data-field="${key}-percent"`, percent)}
      <button type="button" data-action="${key}-clear-percent">Clear percentage</button>
      <div class="section-note">Percentage uses the current scale. Entity and fixed values take precedence when present.</div>
    </div>`;
}

export function renderColorInput({ id, field = null, kind = null, index = null, value = '', fallbackHex = '#000000', placeholder = '', extraDataset = {}, cssText = false, label = 'Color' }) {
  const controlValue = normalizeTextValue(value).trim();
  const pickerValue = getColorPickerValue(controlValue, fallbackHex);
  const extraAttrs = Object.entries(extraDataset)
    .map(([key, entry]) => `data-${key}="${escapeAttribute(entry)}"`)
    .join(' ');
  const baseAttrs = field
    ? `data-field="${field}"${extraAttrs ? ` ${extraAttrs}` : ''}`
    : `data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;
  const fallbackAttrs = field
    ? `data-field="${field}-text-fallback"${extraAttrs ? ` ${extraAttrs}` : ''}`
    : `data-kind="${kind}-text-fallback" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ''}`;

  return `
      <div class="field-grid">
        <input id="${id}" type="color" ${baseAttrs} value="${escapeAttribute(pickerValue)}">
        ${cssText || controlValue && !isHexColorValue(controlValue)
          ? `<input${cssText ? ` id="${id}-text-fallback" data-css-color="true" aria-label="${escapeAttribute(label)} (CSS value)"` : ''} type="text" ${fallbackAttrs} value="${escapeAttribute(cssText ? value : controlValue)}" placeholder="${escapeAttribute(placeholder || 'CSS color value')}">`
          : ''
        }
      </div>
    `;
}
