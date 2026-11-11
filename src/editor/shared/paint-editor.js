import { escapeAttribute, renderColorInput } from './editor-controls.js';
import { compilePaint } from '../../view-model/paint-compiler.js';
import { setStyleIfChanged } from '../../utils/dom.js';

const styleNames = { solid: 'Solid', gradient: 'Gradient', bands: 'Bands', soft_bands: 'Soft bands', band_gradient: 'Band gradient' };
const swatchBackdrop = 'var(--card-background-color, #fff)';

export function describePaint(paint, inherited = false) {
  const style = paint.fill_style ?? 'bands';
  const parts = [styleNames[style] ?? style];
  if (style === 'solid') parts.push(paint.color || 'Default color');
  else if (style === 'gradient') parts.push(`${paint.gradient_stops?.length ?? 3} ${paint.gradient_stops?.length === 1 ? 'stop' : 'stops'}`);
  else parts.push(paint.segments ? `${paint.segments.length} ${paint.segments.length === 1 ? 'segment' : 'segments'}` : 'Default bands');
  if (paint.solid_fill) parts.push('Sampled color');
  return `${inherited ? 'Inherited · ' : ''}${parts.join(' · ')}`;
}

function swatchPaint(paint, scale) {
  // Invalid/incomplete authored palettes must not prevent opening the editor.
  try { return compilePaint(paint, { ...scale, samplePercent: 50 }).gradient ?? 'none'; }
  catch { return 'none'; }
}

function fieldAttributes({ id, field, kind, index }) {
  return `id="${escapeAttribute(id)}"${field ? ` data-field="${escapeAttribute(field)}"` : ''}${kind ? ` data-kind="${escapeAttribute(kind)}"` : ''}${index !== undefined ? ` data-index="${index}"` : ''}`;
}

/** Destination-neutral paint controls. Bindings own raw properties; the host
 * supplies effective display paint, field routing and existing palette editors.
 * Native disclosure state survives host renders by reading the mounted node.
 */
export function renderPaintEditor({ id, bindings, paint = bindings.read() ?? {}, inherited = false,
  scale, fields = {}, root, paletteContent = '', cssText = false }) {
  const controls = Object.fromEntries(['fill_style', 'solid_fill', 'color'].map(key => [key,
    fields[key] ?? { id: `${id}-${key}`, field: key },
  ]));
  const open = root?.querySelector(`#${id}`)?.open === true;
  const fillStyle = paint.fill_style ?? 'bands';
  return `<details id="${id}" class="paint-editor"${open ? ' open' : ''}>
    <summary class="paint-editor-summary">
      <span class="paint-editor-swatch" aria-hidden="true" style="background-color:${swatchBackdrop};background-image:${escapeAttribute(swatchPaint(paint, scale))};"></span>
      <span class="paint-editor-heading">Paint</span>
      <span class="paint-editor-description">${escapeAttribute(describePaint(paint, inherited))}</span>
    </summary>
    <div class="paint-editor-body">
      <div class="paint-editor-grid">
        <div class="field-row"><label for="${controls.fill_style.id}">Fill style</label>
          <select ${fieldAttributes(controls.fill_style)} value="${escapeAttribute(fillStyle)}">
            ${Object.entries(styleNames).map(([value, label]) => `<option value="${value}"${fillStyle === value ? ' selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field-row"><div class="toggle">
          <input ${fieldAttributes(controls.solid_fill)} type="checkbox"${paint.solid_fill ? ' checked' : ''}>
          <label for="${controls.solid_fill.id}">Solid fill</label>
        </div></div>
        <div class="field-row"><label for="${controls.color.id}">Color</label>
          ${renderColorInput({ ...controls.color, value: paint.color, fallbackHex: '#4a9eff', cssText, label: 'Color', placeholder: 'CSS color value' })}
        </div>
      </div>
      ${paletteContent}
    </div>
  </details>`;
}

export function syncPaintEditor(root, id, { paint, inherited, scale }) {
  const editor = root?.querySelector(`#${id}`);
  if (!editor) return;
  const description = editor.querySelector?.('.paint-editor-description');
  const text = describePaint(paint, inherited);
  if (description && description.textContent !== text) description.textContent = text;
  const swatch = editor.querySelector?.('.paint-editor-swatch');
  setStyleIfChanged(swatch, 'backgroundColor', swatchBackdrop);
  setStyleIfChanged(swatch, 'backgroundImage', swatchPaint(paint, scale));
}
