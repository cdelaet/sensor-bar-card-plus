export const DEFAULT_PAINT_COLOR = 'var(--accent-color, #4a9eff)';
export const PAINT_PROPERTIES = ['fill_style', 'color', 'solid_fill', 'segments', 'gradient_stops', 'opacity'];

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

export function getOverlayPaintDefaults() {
  return { fill_style: 'solid', color: DEFAULT_PAINT_COLOR, solid_fill: false, opacity: 100,
    segments: getDefaultPaintSegments(), gradient_stops: getDefaultPaintGradientStops() };
}
