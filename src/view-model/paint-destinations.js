import { normalizeBarConfig, normalizeBaselineDirectionConfig, normalizeTargetAboveConfig, normalizeTargetBelowConfig, getPaintExplicitness, BAR_PAINT_ALIASES } from '../config/normalize.js';
import { resolveScopedPaintPreset } from './paint-preset-resolver.js';

export const BAR_PAINT = {
  id: 'bar', path: ['bar', 'paint'],
  aliases: BAR_PAINT_ALIASES,
  normalize(config, parent) {
    return normalizeBarConfig(config, parent ? { ...parent, bar: normalizeBarConfig(parent, null) } : null, {
      isCardScope: !parent, inheritedExplicitness: getPaintExplicitness(parent),
    }).paint;
  },
};

export const BASELINE_PAINTS = ['above', 'below'].map(side => ({
  id: `baseline-${side}`, path: ['baseline', side, 'paint'],
  aliases: { color: [['baseline', side, 'color']] },
  shorthands: [{ path: ['baseline'], property: 'at' }, { path: ['baseline', side], property: 'color' }],
  normalize(config, parent) {
    const inherited = normalizeBaselineDirectionConfig(parent?.baseline?.[side]);
    const direction = normalizeBaselineDirectionConfig(config?.baseline?.[side], inherited);
    if (direction.paint !== undefined) return direction.paint;
    return direction.color
      ? normalizeBaselineDirectionConfig({ paint: {}, color: direction.color }).paint : undefined;
  },
}));

export const TARGET_ABOVE_PAINT = {
  id: 'target-above', path: ['target', 'when_above', 'paint'],
  aliases: { color: [['target', 'when_exceeded', 'fill_color'], ['above_target_color']] },
  shorthands: [{ path: ['target'], property: 'at', entityPath: ['target_entity'] }],
  normalize(config, parent) { return normalizeTargetAboveConfig(config, parent).paint; },
};

export const TARGET_BELOW_PAINT = {
  id: 'target-below', path: ['target', 'when_below', 'paint'],
  aliases: {},
  shorthands: [{ path: ['target'], property: 'at', entityPath: ['target_entity'] }],
  normalize(config, parent) { return normalizeTargetBelowConfig(config, parent).paint; },
};

/** Resolve a normalized destination using the same scope/preset ordering in
 * editors and runtime hosts. Activation belongs to normalization, never Bar. */
export function resolveDestinationPaint(paint, inheritedPaint, registry) {
  if (paint == null) return { paint, diagnostics: [] };
  if (paint.preset === undefined && inheritedPaint?.preset === undefined) return { paint, diagnostics: [] };
  const inheritedScope = inheritedPaint && inheritedPaint !== paint;
  const resolved = resolveScopedPaintPreset({
    inheritedPaint: inheritedPaint ?? paint,
    paint: inheritedScope ? paint : {}, registry,
  });
  return { ...resolved, diagnostics: resolved.diagnostics.map(diagnostic => !inheritedScope && diagnostic.fallback === 'inherited'
    ? { ...diagnostic, fallback: 'default' } : diagnostic) };
}

export function resolveConfiguredDestination(config, parent, destination, registry) {
  const normalized = destination.normalize(config, parent);
  const inheritedPaint = parent ? destination.normalize(parent, null) : null;
  return { ...resolveDestinationPaint(normalized, inheritedPaint, registry), normalized, inheritedPaint };
}
