import { normalizeGaugeSegments } from '../../config/normalize.js';

export function getDefaultPaintSegments() {
  return [
    { from: '0%', to: '33%', color: '#4CAF50' },
    { from: '33%', to: '75%', color: '#FF9800' },
    { from: '75%', to: '100%', color: '#F44336' },
  ];
}

export function getDefaultPaintGradientStops() {
  return [
    { pos: 0, color: '#4CAF50' },
    { pos: 50, color: '#FF9800' },
    { pos: 100, color: '#F44336' },
  ];
}

// Display resolution only: keep explicit empty palettes and never write defaults
// into authored configuration. Palette sections can supply their current drafts.
export function resolvePaintEditorPaint(paint, paletteValues = {}) {
  return { ...paint,
    segments: paint.segments ?? normalizeGaugeSegments(paletteValues?.segments
      ?? (['bands', 'soft_bands', 'band_gradient'].includes(paint.fill_style) ? getDefaultPaintSegments() : [])),
    gradient_stops: paint.gradient_stops ?? paletteValues?.gradient_stops ?? getDefaultPaintGradientStops(),
  };
}
