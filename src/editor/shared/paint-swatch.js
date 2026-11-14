import { compilePaint } from '../../view-model/paint-compiler.js';
import { escapeAttribute } from './editor-controls.js';
import { setStyleIfChanged } from '../../utils/dom.js';

// Preview the complete authored fixed palette without changing the runtime Scale.
export function getPaintPreviewScale(paint, scale) {
  if (!['bands', 'soft_bands', 'band_gradient'].includes(paint.fill_style) || paint.solid_fill) return scale;
  const segments = Array.isArray(paint.segments) ? paint.segments.filter(segment => !segment?.invalidBoundary) : [];
  const fixedBoundaries = segments.flatMap(segment => [segment?.from?.fixed, segment?.to?.fixed])
    .filter(Number.isFinite);
  if (!fixedBoundaries.length) return scale;

  const fixedStarts = [...new Set(segments.map(segment => segment?.from?.fixed).filter(Number.isFinite))]
    .sort((left, right) => left - right);
  const minValue = Math.min(...fixedBoundaries);
  let maxValue = Math.max(...fixedBoundaries);
  const lastStart = fixedStarts.at(-1);
  const lastSegment = segments.filter(segment => segment?.from?.fixed === lastStart).at(-1);
  if (lastSegment && lastSegment.to == null && Number.isFinite(lastStart)) {
    const previousStart = fixedStarts.at(-2);
    const scaleRange = Math.abs(scale.maxValue - scale.minValue);
    const step = Number.isFinite(previousStart) ? lastStart - previousStart : scaleRange || 1;
    maxValue = Math.max(maxValue, lastStart + (step || scaleRange || 1));
  }
  return { ...scale, minValue, maxValue };
}

function swatchStyle(paint, scale = { minValue: 0, maxValue: 100, scaleDirection: 'normal' }) {
  let backgroundImage = 'none';
  // Invalid/incomplete authored palettes must not prevent opening the editor.
  try { backgroundImage = compilePaint(paint, { ...getPaintPreviewScale(paint, scale), samplePercent: 50 }).gradient ?? 'none'; }
  catch { /* Keep malformed palettes editable. */ }
  const opacity = Number.isFinite(Number(paint.opacity)) ? Math.max(0, Math.min(100, Number(paint.opacity))) : 100;
  return { backgroundColor: 'var(--card-background-color, #fff)', backgroundImage, opacity: String(opacity / 100) };
}

export function renderPaintSwatch(className, paint, scale) {
  const style = swatchStyle(paint, scale);
  return `<span class="${className}" aria-hidden="true" style="background-color:${style.backgroundColor};background-image:${escapeAttribute(style.backgroundImage)};opacity:${style.opacity};"></span>`;
}

export function syncPaintSwatch(swatch, paint, scale) {
  for (const [property, value] of Object.entries(swatchStyle(paint, scale))) setStyleIfChanged(swatch, property, value);
}
