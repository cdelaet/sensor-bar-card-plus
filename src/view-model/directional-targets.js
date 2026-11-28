import { getNormalizedResolvableNumericValue } from '../config/resolve.js';
import { getTargetDirections, hasTargetSource, sameTargetSource } from '../config/directional-targets.js';

export function resolveDirectionalTargets(config, hass, min, max) {
  const directions = getTargetDirections(config);
  const resolved = Object.fromEntries(Object.entries(directions).map(([side, target]) => [side, {
    ...target, value: getNormalizedResolvableNumericValue(hass, target.source, min, max),
  }]));
  const { above, below } = resolved;
  const invalidOrdering = Number.isFinite(above.value) && Number.isFinite(below.value) && below.value > above.value;
  let sides = ['above', 'below'].filter(side => hasTargetSource(resolved[side].source));
  if (!sides.length) sides = ['above']; // Preserve the legacy hidden marker node.
  if (sides.length === 2 && (sameTargetSource(above.source, below.source)
    || Number.isFinite(above.value) && above.value === below.value)) {
    sides = [above.marker?.enabled === false && below.marker?.enabled !== false ? 'below' : 'above'];
  }
  const diagnostics = invalidOrdering ? [{ code: 'target.invalid_ordering',
    message: 'Lower Target threshold is greater than upper Target threshold; both Target paints are suppressed.',
    path: 'target', entity: config?.entity ?? null, above: above.value, below: below.value }] : [];
  return { ...resolved, markerSides: sides, invalidOrdering, diagnostics };
}
