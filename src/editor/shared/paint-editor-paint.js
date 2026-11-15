import { normalizeGaugeSegments } from '../../config/normalize.js';
import { getDefaultPaintSegments, getDefaultPaintGradientStops } from '../../config/paint-defaults.js';
export { getDefaultPaintSegments, getDefaultPaintGradientStops } from '../../config/paint-defaults.js';

// Display resolution only: keep explicit empty palettes and never write defaults
// into authored configuration. Palette sections can supply their current drafts.
export function resolvePaintEditorPaint(paint, paletteValues = {}) {
  return { ...paint,
    segments: paint.segments ?? normalizeGaugeSegments(paletteValues?.segments
      ?? (['bands', 'soft_bands', 'band_gradient'].includes(paint.fill_style) ? getDefaultPaintSegments() : [])),
    gradient_stops: paint.gradient_stops ?? paletteValues?.gradient_stops ?? getDefaultPaintGradientStops(),
  };
}
