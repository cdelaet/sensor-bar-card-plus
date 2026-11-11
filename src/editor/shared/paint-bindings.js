import {
  cloneDeep, deletePathValue, getPathValue, isObject, normalizePath, setPathValue,
} from './editor-config.js';

/** Bind direct paint properties at a path relative to an existing section scope.
 * Reads are raw snapshots, not resolved/defaulted paint. Local property presence
 * identifies ownership; inherited/preset values are never copied into the config.
 * Hosts own validation, shorthand promotion, cleanup and emission. A non-object
 * destination must be explicitly promoted by its host before it can be edited.
 * Bind to an array item's path to edit its properties without replacing its list.
 */
export function createPaintBindings(context, { scope, path = [] }) {
  const destination = [...normalizePath(path)];
  const readPaint = () => context.read(scope, destination);
  const owns = (paint, property) => isObject(paint) && Object.prototype.hasOwnProperty.call(paint, property);
  const editable = target => {
    let value = target;
    for (const key of destination) {
      if (value === undefined) {
        if (typeof key === 'number') return false;
      } else {
        if (!isObject(value) && !Array.isArray(value)) return false;
        // Lists and their membership belong to the host, not a property binding.
        if (Array.isArray(value) && !Object.prototype.hasOwnProperty.call(value, key)) return false;
      }
      value = value?.[key];
    }
    return value === undefined || isObject(value);
  };
  const update = (mutation, options) => context.mutate(scope, target => {
    if (!editable(target)) return target;
    const paint = getPathValue(target, destination);
    const nextPaint = mutation(paint);
    return nextPaint === paint ? target : setPathValue(target, destination, nextPaint);
  }, options);

  return {
    read(property) {
      return cloneDeep(context.read(scope, property === undefined ? destination : [...destination, property]));
    },
    hasOverride(property) {
      return owns(readPaint(), property);
    },
    set(property, value, options) {
      if (!editable(context.read(scope, []))) return false;
      const stored = cloneDeep(value);
      return update(paint => setPathValue(paint ?? {}, [property], stored), options);
    },
    clear(property, options) {
      if (!owns(readPaint(), property)) return false;
      // Keep the destination itself, including an explicit empty object. Any
      // pruning or alias cleanup remains part of the host's mutation policy.
      return update(paint => deletePathValue(paint, [property]), options);
    },
  };
}
