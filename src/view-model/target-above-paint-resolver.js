import { resolveDestinationPaint } from './paint-destinations.js';

/** Keep null/undefined and compatibility policy intact through preset refresh. */
export function resolveTargetAbovePaint(target, inherited, registry) {
  return { legacy: target?.legacy === true,
    ...resolveDestinationPaint(target?.paint, inherited?.paint, registry) };
}
