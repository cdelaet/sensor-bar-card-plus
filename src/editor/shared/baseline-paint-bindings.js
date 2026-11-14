import { cloneDeep, deletePathValue, getPathValue, isObject, setPathValue } from './editor-config.js';

/** Adapt a directional Baseline Paint destination to the ordinary palette
 * sections' expected bar.paint shape while keeping all mutations at baseline. */
export function createBaselinePaintContext(context, direction) {
  const virtualize = target => {
    const paint = getPathValue(target, ['baseline', direction, 'paint']);
    const bar = { ...(isObject(target?.bar) ? target.bar : {}) };
    delete bar.paint;
    if (paint !== undefined) bar.paint = cloneDeep(paint);
    return { ...target, bar };
  };
  return {
    get hass() { return context.hass; },
    get paintPresetRegistry() { return context.paintPresetRegistry; },
    read(scope, path = []) { return getPathValue(virtualize(context.read(scope, [])), path); },
    mutate(scope, mutation, options = {}) {
      return context.mutate(scope, target => {
        const virtual = virtualize(target);
        const changed = mutation(virtual);
        const before = getPathValue(target, ['baseline', direction, 'paint']);
        const after = getPathValue(changed, ['bar', 'paint']);
        if (JSON.stringify(before) === JSON.stringify(after)) return target;
        let next = deletePathValue(changed, ['bar', 'paint']);
        const originalBarPaint = getPathValue(target, ['bar', 'paint']);
        if (originalBarPaint !== undefined) {
          next = setPathValue(next, ['bar', 'paint'], cloneDeep(originalBarPaint));
        }
        return after === undefined
          ? deletePathValue(next, ['baseline', direction, 'paint'])
          : setPathValue(next, ['baseline', direction, 'paint'], cloneDeep(after));
      }, options);
    },
  };
}
