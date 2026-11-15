import { TARGET_PAINTS, resolveConfiguredDestination, resolveDestinationPaint } from './paint-destinations.js';

/** Resolve Target Above and Below independently against the matching Card
 * destination. Target Paint never falls back to Bar or a sibling direction. */
export function resolveTargetPaints(config, parent, registry) {
  const paints = {};
  const diagnostics = [];
  const normalized = config?._normalized === true && config?.target_directions;
  for (const destination of TARGET_PAINTS) {
    const side = destination.id.slice('target-'.length);
    const resolved = normalized
      ? resolveDestinationPaint(config.target_directions[side]?.paint, parent?.target_directions?.[side]?.paint, registry)
      : resolveConfiguredDestination(config, parent, destination, registry);
    if (resolved.paint !== undefined && resolved.paint !== null) paints[side] = resolved.paint;
    diagnostics.push(...resolved.diagnostics.map(item => ({ ...item, path: `${destination.id}.${item.path}` })));
  }
  const legacyUpper = normalized
    ? config.target_directions?.above?.legacy_paint === true || parent?.target_directions?.above?.legacy_paint === true
    : !config?.target?.when_above?.paint
      && !(config?.target && Object.prototype.hasOwnProperty.call(config.target, 'when_above')
        && config.target.when_above?.paint === null)
      && (config?.target?.when_exceeded?.fill_color != null || config?.above_target_color != null);
  return { paints, diagnostics, legacyUpper };
}
