import { resolveDestinationPaint } from './paint-destinations.js';

const SIDES = ['above', 'below'];

/** Resolve each directional Baseline paint independently against its matching
 * card destination. The ordinary Bar paint is deliberately never consulted. */
export function resolveBaselinePaints(baseline, inheritedBaseline, registry) {
  const paints = {};
  const diagnostics = [];
  for (const side of SIDES) {
    const paint = baseline?.[side]?.paint;
    const inheritedPaint = inheritedBaseline?.[side]?.paint;
    if (paint === null) continue;
    if (paint?.preset === undefined && inheritedPaint?.preset === undefined) continue;
    const resolved = resolveDestinationPaint(paint, inheritedPaint, registry);
    paints[side] = resolved.paint;
    diagnostics.push(...resolved.diagnostics.map(diagnostic => ({
      ...diagnostic, path: `${side}.${diagnostic.path}`,
    })));
  }
  return { paints, diagnostics };
}
