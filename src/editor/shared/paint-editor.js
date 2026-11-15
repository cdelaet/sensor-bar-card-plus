import { escapeAttribute, getColorPickerValue, isHexColorValue, renderColorInput, renderScalePercentageInput } from './editor-controls.js';
import { renderPaintSwatch, syncPaintSwatch } from './paint-swatch.js';

const styleNames = { solid: 'Solid', gradient: 'Gradient', bands: 'Bands', soft_bands: 'Soft bands', band_gradient: 'Band gradient' };

export function describePaint(paint, inherited = false) {
  const style = paint.fill_style ?? 'bands';
  const parts = [styleNames[style] ?? style];
  if (style === 'solid') parts.push(paint.color || 'Default color');
  else if (style === 'gradient') parts.push(`${paint.gradient_stops?.length ?? 3} ${paint.gradient_stops?.length === 1 ? 'stop' : 'stops'}`);
  else parts.push(paint.segments ? `${paint.segments.length} ${paint.segments.length === 1 ? 'segment' : 'segments'}` : 'Default bands');
  if (paint.solid_fill) parts.push('Sampled color');
  return `${inherited ? 'Inherited · ' : ''}${parts.join(' · ')}`;
}

function fieldAttributes({ id, field, kind, index }) {
  return `id="${escapeAttribute(id)}"${field ? ` data-field="${escapeAttribute(field)}"` : ''}${kind ? ` data-kind="${escapeAttribute(kind)}"` : ''}${index !== undefined ? ` data-index="${index}"` : ''}`;
}

function fieldRoutingAttributes({ field, kind, index }) {
  return `${field ? `data-field="${escapeAttribute(field)}"` : ''}${kind ? `${field ? ' ' : ''}data-kind="${escapeAttribute(kind)}"` : ''}${index !== undefined ? ` data-index="${index}"` : ''}`;
}

function renderPropertyMeta(property, label, { sources = {}, overrides = {}, fields = {}, showPropertyMeta = true }) {
  const source = sources[property] ?? (overrides[property] ? 'Local' : 'Default');
  return showPropertyMeta
    ? `<span class="paint-property-meta${source === 'Override' ? ' is-overridden' : ''}" data-paint-source="${property}">${source}</span>
      <button type="button" class="paint-clear-override" data-action="clear-paint-property" data-property="${property}"${fields.index !== undefined ? ` data-index="${fields.index}"` : ''} aria-label="Clear ${escapeAttribute(label)} ${source === 'Override' ? 'override' : 'value'}"${overrides[property] ? '' : ' hidden'}>Clear</button>`
    : '';
}

function renderPaletteFields(paletteFields, options) {
  return ['segments', 'gradient_stops'].map(property => {
    const content = paletteFields[property];
    if (!content) return '';
    const label = property === 'segments' ? 'Segments' : 'Gradient stops';
    return `<div class="paint-palette-field"><div class="paint-property-heading"><span>${label}</span>${renderPropertyMeta(property, label, options)}</div>${content}</div>`;
  }).join('');
}

/** Destination-neutral paint controls. Bindings own raw properties; the host
 * supplies effective display paint, field routing and existing palette editors.
 * Native disclosure state survives host renders by reading the mounted node.
 */
export function renderPaintEditor({ id, bindings, paint = bindings.read() ?? {}, inherited = false,
  scale, previewScale = scale, fields = {}, root, paletteContent = '', paletteFields = null, cssText = false,
  presetReference, presetInherited = false, presetOptions = [], overrides = {}, diagnostics = [], registryStatus = 'unknown',
  showPropertyMeta = true, bodyId = null, resetLabel, resetDisabled = true,
  sources = {}, activation = null, enabled = true, destination = 'bar' }) {
  const controls = Object.fromEntries(['fill_style', 'solid_fill', 'color', 'opacity'].map(key => [key,
    fields[key] ?? { id: `${id}-${key}`, field: key },
  ]));
  controls.preset = fields.preset ?? { id: `${id}-preset`, field: 'paint-preset' };
  const open = root?.querySelector(`#${id}`)?.open === true;
  const fillStyle = paint.fill_style ?? 'bands';
  const referenceName = presetReference == null ? '' : String(presetReference);
  const selection = presetInherited ? undefined : presetReference;
  const propertyHeader = (property, label) => renderPropertyMeta(property, label, { sources, overrides, fields, showPropertyMeta });
  const labelRow = (property, label, control) => `<div class="paint-property-row"><div class="paint-property-heading"><label for="${controls[property].id}">${label}</label>${propertyHeader(property, label)}</div>${control}</div>`;
  const options = [`<option value=""${presetInherited ? ' selected' : ''}>None</option>`,
    ...presetOptions.map(option => `<option value="${escapeAttribute(option.value)}"${selection === option.value ? ' selected' : ''}>${escapeAttribute(option.label)}</option>`),
    ...(presetReference != null && !presetOptions.some(option => option.value === presetReference)
      ? [`<option value="${escapeAttribute(referenceName)}"${presetInherited ? '' : ' selected'}>${escapeAttribute(`${referenceName || '(empty name)'} (unavailable)`)}</option>`] : [])].join('');
  const showPreset = presetOptions.length > 0 || presetReference != null;
  const feedback = diagnostics.find(item => item.code?.startsWith('paint_preset') || item.code === 'paint_registry_unavailable');
  const feedbackText = feedback?.code === 'paint_preset_missing'
    ? `Preset “${feedback.reference}” was not found. Using inherited paint.`
    : feedback?.code === 'paint_preset_invalid'
      ? `Preset “${feedback.reference}” is invalid. Using inherited paint.`
      : feedback?.code === 'paint_preset_reference_invalid'
        ? 'Preset name is invalid. Using inherited paint.'
        : feedback?.code === 'paint_registry_unavailable'
          ? `Preset “${feedback.reference}” cannot be checked. Using inherited paint.`
          : '';
  const description = presetReference != null
    ? `${inherited || presetInherited ? 'Inherited · ' : ''}Preset · ${referenceName || '(empty name)'} · ${describePaint(paint)}`
    : describePaint(paint, inherited);
  const paintChildren = paletteFields && typeof paletteFields === 'object'
    ? renderPaletteFields(paletteFields, { sources, overrides, fields, showPropertyMeta }) : paletteContent;
  const registryMessage = registryStatus === 'loading' && !presetOptions.length
    ? 'Loading dashboard presets…'
    : registryStatus === 'empty' && !presetOptions.length && !feedbackText
      ? 'No dashboard paint presets available.' : '';
  const resetAction = resetLabel ? `<div class="paint-editor-actions"><button type="button" data-action="reset-paint"${fields.index !== undefined ? ` data-index="${fields.index}"` : ''}${resetDisabled ? ' disabled' : ''}>${escapeAttribute(resetLabel)}</button></div>` : '';
  return `<details id="${id}" class="paint-editor" data-paint-destination="${destination}"${open ? ' open' : ''}>
    <summary class="paint-editor-summary">
      ${renderPaintSwatch('paint-editor-swatch', paint, previewScale)}
      <span class="paint-editor-heading">Paint</span>
      <span class="paint-editor-description">${escapeAttribute(description)}</span>
    </summary>
    <div${bodyId ? ` id="${escapeAttribute(bodyId)}"` : ''} class="paint-editor-body">
      ${activation ? `<div class="toggle"><input ${fieldAttributes(activation)} type="checkbox" data-paint-enabled="true"${enabled ? ' checked' : ''}><label for="${activation.id}">Enable Paint</label></div>` : ''}
      ${activation ? resetAction : ''}
      ${activation ? `<div class="paint-editor-properties"${enabled ? '' : ' hidden'}>` : ''}
      <div class="paint-preset-row"${showPreset ? '' : ' hidden'}>
        <label for="${controls.preset.id}">Paint preset</label>
        <select ${fieldAttributes(controls.preset)} data-paint-preset="true">${options}</select>
      </div>
      ${activation ? '' : resetAction}
      <div class="paint-preset-feedback" role="status" aria-live="polite"${feedbackText ? '' : ' hidden'}>${escapeAttribute(feedbackText)}</div>
      <div class="paint-registry-status" role="status"${registryMessage ? '' : ' hidden'}>${escapeAttribute(registryMessage)}</div>
      <div class="paint-editor-grid">
        ${labelRow('fill_style', 'Fill style', `<select ${fieldAttributes(controls.fill_style)} value="${escapeAttribute(fillStyle)}" data-paint-property="fill_style">
            ${Object.entries(styleNames).map(([value, label]) => `<option value="${value}"${fillStyle === value ? ' selected' : ''}>${label}</option>`).join('')}
          </select>`)}
        <div class="paint-property-row"><div class="paint-property-heading"><div class="toggle">
          <input ${fieldAttributes(controls.solid_fill)} type="checkbox" data-paint-property="solid_fill"${paint.solid_fill ? ' checked' : ''}>
          <label for="${controls.solid_fill.id}">Solid fill</label>
        </div>${propertyHeader('solid_fill', 'Solid fill')}</div></div>
        ${labelRow('color', 'Color', renderColorInput({ ...controls.color, value: paint.color, fallbackHex: '#4a9eff', cssText, label: 'Color', placeholder: 'CSS color value', extraDataset: { 'paint-property': 'color' } }))}
        ${labelRow('opacity', 'Opacity', renderScalePercentageInput(controls.opacity.id, `${fieldRoutingAttributes(controls.opacity)} data-paint-property="opacity"`, paint.opacity ?? 100))}
      </div>
      ${paintChildren}
      ${activation ? '</div>' : ''}
    </div>
  </details>`;
}

export function syncPaintEditor(root, id, state, { numericDrafts, cssColorDrafts, paletteFields } = {}) {
  const editor = root?.querySelector(`#${id}`);
  if (!editor) return;
  const { paint, inherited, scale } = state;
  const reset = editor.querySelector?.('[data-action="reset-paint"]');
  if (reset) reset.disabled = state.resetDisabled ?? true;
  const activation = editor.querySelector?.('[data-paint-enabled="true"]');
  if (activation) activation.checked = state.enabled;
  const properties = editor.querySelector?.('.paint-editor-properties');
  if (properties) {
    properties.hidden = state.enabled === false;
    // Mount lazily on first activation; subsequent edits keep the same controls,
    // disclosures and native focus/scroll anchoring as ordinary Paint edits.
    if (state.enabled && !properties.querySelector('.paint-palette-field') && paletteFields) {
      const template = properties.ownerDocument.createElement('template');
      template.innerHTML = renderPaletteFields(paletteFields(), { ...state, fields: { index: activation?.dataset.index } });
      properties.append(template.content);
    }
  }
  const previewScale = state.previewScale ?? scale;
  const description = editor.querySelector?.('.paint-editor-description');
  const reference = state.presetReference == null ? '' : String(state.presetReference);
  const text = state.presetReference != null
    ? `${inherited || state.presetInherited ? 'Inherited · ' : ''}Preset · ${reference || '(empty name)'} · ${describePaint(paint)}`
    : describePaint(paint, inherited);
  if (description && description.textContent !== text) description.textContent = text;
  const swatch = editor.querySelector?.('.paint-editor-swatch');
  syncPaintSwatch(swatch, paint, previewScale);
  const presetControl = editor.querySelector?.('[data-paint-preset="true"]');
  if (presetControl?.options) {
    const activeReference = state.presetReference == null ? '' : String(state.presetReference);
    const optionHtml = `<option value="">None</option>${(state.presetOptions ?? []).map(option => `<option value="${escapeAttribute(option.value)}">${escapeAttribute(option.label)}</option>`).join('')}${activeReference && !(state.presetOptions ?? []).some(option => option.value === activeReference)
      ? `<option value="${escapeAttribute(activeReference)}">${escapeAttribute(`${activeReference} (unavailable)`)}</option>` : ''}`;
    if (presetControl.dataset.options !== optionHtml) {
      presetControl.innerHTML = optionHtml;
      presetControl.dataset.options = optionHtml;
    }
    presetControl.closest?.('.paint-preset-row')?.toggleAttribute('hidden', !(state.presetOptions?.length || state.presetReference != null));
    if (root.activeElement !== presetControl) presetControl.value = state.presetInherited ? '' : activeReference;
  }
  // Effective colors can acquire a CSS value without replacing the mounted picker.
  const picker = editor.querySelector?.('input[type="color"][data-paint-property="color"]');
  if (picker?.ownerDocument && paint.color && !isHexColorValue(paint.color)
    && !picker.parentElement.querySelector('input[type="text"]')) {
    const template = picker.ownerDocument.createElement('template');
    template.innerHTML = renderColorInput({ id: picker.id, field: picker.dataset.field, kind: picker.dataset.kind,
      index: picker.dataset.index, value: paint.color, extraDataset: { 'paint-property': 'color' } });
    picker.after(template.content.querySelector('input[type="text"]'));
  }
  for (const property of ['fill_style', 'color', 'solid_fill', 'opacity']) {
    for (const control of editor.querySelectorAll?.(`[data-paint-property="${property}"]`) ?? []) {
      if (control === root.activeElement || property === 'opacity' && numericDrafts?.values?.has(control.id)) continue;
      if (property === 'solid_fill') control.checked = !!paint.solid_fill;
      else if (property === 'fill_style') control.value = paint.fill_style ?? 'bands';
      else if (property === 'opacity') control.value = String(paint.opacity ?? 100);
      else if (property === 'color' && !cssColorDrafts?.has?.(control.id)) {
        control.value = control.type === 'color' ? getColorPickerValue(paint.color, '#4a9eff') : paint.color ?? '';
      }
    }
  }
  const opacity = editor.querySelector?.('[data-paint-property="opacity"]');
  const opacityValue = String(paint.opacity ?? 100);
  if (opacity && opacity !== root.activeElement && !numericDrafts?.values?.has(opacity.id) && opacity.value !== opacityValue) opacity.value = opacityValue;
  for (const property of ['fill_style', 'color', 'solid_fill', 'segments', 'gradient_stops', 'opacity']) {
    const source = editor.querySelector?.(`[data-paint-source="${property}"]`);
    const clear = editor.querySelector?.(`[data-action="clear-paint-property"][data-property="${property}"]`);
    const overridden = !!state.overrides?.[property];
    if (source) {
      source.textContent = state.sources?.[property] ?? (overridden ? 'Local' : 'Default');
      source.classList?.toggle('is-overridden', source.textContent === 'Override');
    }
    if (clear) {
      clear.hidden = !overridden;
      const label = clear.getAttribute?.('aria-label');
      if (label) clear.setAttribute?.('aria-label', label.replace(/(?:override|value)$/, source?.textContent === 'Override' ? 'override' : 'value'));
    }
  }
  const diagnostic = state.diagnostics?.find(item => item.code?.startsWith('paint_preset') || item.code === 'paint_registry_unavailable');
  const message = diagnostic?.code === 'paint_preset_missing'
    ? `Preset “${diagnostic.reference}” was not found. Using inherited paint.`
    : diagnostic?.code === 'paint_preset_invalid'
      ? `Preset “${diagnostic.reference}” is invalid. Using inherited paint.`
      : diagnostic?.code === 'paint_preset_reference_invalid'
        ? 'Preset name is invalid. Using inherited paint.'
        : diagnostic?.code === 'paint_registry_unavailable'
          ? `Preset “${diagnostic.reference}” cannot be checked. Using inherited paint.` : '';
  const feedback = editor.querySelector?.('.paint-preset-feedback');
  if (feedback) { feedback.textContent = message; feedback.hidden = !message; }
  const registryMessage = state.registryStatus === 'loading' && !state.presetOptions?.length
    ? 'Loading dashboard presets…'
    : state.registryStatus === 'empty' && !state.presetOptions?.length && !message
      ? 'No dashboard paint presets available.' : '';
  const status = editor.querySelector?.('.paint-registry-status');
  if (status) { status.textContent = registryMessage; status.hidden = !registryMessage; }
}
