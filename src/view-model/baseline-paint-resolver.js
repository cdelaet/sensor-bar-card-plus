import { PAINT_PROPERTY_SOURCES } from '../config/normalize.js';
import { authoredPaintProperties, resolvePaintPreset } from './paint-preset-resolver.js';

const SIDES = ['above', 'below'];

function hasPreset(paint) {
  return Object.prototype.hasOwnProperty.call(authoredPaintProperties(paint), 'preset');
}

function withoutPreset(paint) {
  const inherited = { ...(paint ?? {}) };
  delete inherited.preset;
  delete inherited[PAINT_PROPERTY_SOURCES];
  return inherited;
}

/** Resolve each directional Baseline paint independently against its matching
 * card destination. The ordinary Bar paint is deliberately never consulted. */
export function resolveBaselinePaints(baseline, inheritedBaseline, registry) {
  const paints = {};
  const diagnostics = [];
  for (const side of SIDES) {
    const paint = baseline?.[side]?.paint;
    const inheritedPaint = inheritedBaseline?.[side]?.paint;
    if (paint === null) continue;
    if (!hasPreset(paint) && !hasPreset(inheritedPaint)) continue;
    const inherited = inheritedPaint && hasPreset(inheritedPaint)
      ? resolvePaintPreset({ paint: authoredPaintProperties(inheritedPaint), registry, canonicalPaint: true })
      : { paint: inheritedPaint ? withoutPreset(inheritedPaint) : null, diagnostics: [] };
    const resolved = resolvePaintPreset({
      paint: authoredPaintProperties(paint),
      inheritedPaint: inherited.paint,
      registry,
      canonicalPaint: true,
    });
    paints[side] = resolved.paint;
    diagnostics.push(...inherited.diagnostics.map(diagnostic => ({
      ...diagnostic, path: `${side}.${diagnostic.path}`,
    })), ...resolved.diagnostics.map(diagnostic => ({
      ...diagnostic, path: `${side}.${diagnostic.path}`,
    })));
  }
  return { paints, diagnostics };
}
