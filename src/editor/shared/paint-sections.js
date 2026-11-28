import { SegmentsSection } from '../sections/segments.js';
import { GradientStopsSection } from '../sections/gradient-stops.js';
import { BAR_PAINT, PAINT_DESTINATIONS } from '../../view-model/paint-destinations.js';

export function createPaintSectionPair(context, ui, createArray) {
  return {
    segments: new SegmentsSection(context, ui, createArray('segments')),
    gradientStops: new GradientStopsSection(context, ui, createArray('gradient_stops')),
  };
}

export function paintSectionSelector(destination, scope) {
  const entity = scope?.type === 'entity' ? `entity-${scope.index}` : '';
  if (destination === BAR_PAINT) return `#${entity || 'card'}-paint-editor`;
  return `#${entity ? `${entity}-` : ''}${destination.id}-paint-editor`;
}

export function scopePaintSectionUi(root, ui, selector) {
  return {
    ...ui,
    root: scope => root?.querySelector(selector(scope)),
    focus: (control, scope, options) => ui.focus(`${selector(scope)} ${control}`, scope, options),
  };
}

export function readPaintPalette(sections, scope) {
  return {
    segments: sections.segments._getScopedSegmentsValue(scope),
    gradient_stops: sections.gradientStops._getScopedGradientStopsValue(scope),
  };
}

export function readDirectionalPaintPalettes(sections, marker, scope) {
  return {
    above: readPaintPalette(sections[`${marker}-above`], scope),
    below: readPaintPalette(sections[`${marker}-below`], scope),
  };
}

export function renderPaintPalette(sections, scope, renderGroup) {
  return {
    segments: sections.segments.render(scope, renderGroup, { section: false }),
    gradient_stops: sections.gradientStops.render(scope, renderGroup, { section: false }),
  };
}

export function directionalPaintChildren(sections, marker, renderGroup) {
  return (scope, direction) => {
    const group = `${marker}-${direction}`;
    return renderPaintPalette(sections[group], scope, options => renderGroup({ ...options, group: `${group}-${options.group}` }));
  };
}

export function syncPaintSectionRows(sections, scope, options) {
  sections.segments.syncRows(scope, options);
  sections.gradientStops.syncRows(scope, options);
}

export function syncDirectionalPaintRows(sections, marker, scope, options) {
  syncPaintSectionRows(sections[`${marker}-above`], scope, options);
  syncPaintSectionRows(sections[`${marker}-below`], scope, options);
}

export function clearPaintSectionState(sections, scope, property) {
  if (!property || property === 'segments') sections?.segments.clearScopeState(scope);
  if (!property || property === 'gradient_stops') sections?.gradientStops.clearScopeState(scope);
}

export function handlePaintPaletteEvent(sections, event, mode = event.type) {
  return sections?.segments.handle(event, mode) || sections?.gradientStops.handle(event, mode) || false;
}

export function handlePaintSectionEvent(sections, event, mode = event.type) {
  return PAINT_DESTINATIONS.some(({ id }) => handlePaintPaletteEvent(sections[id], event, mode));
}
