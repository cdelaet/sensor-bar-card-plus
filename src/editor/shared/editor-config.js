// Immutable config primitives only. Cleanup, emission and session state belong
// to the host; these functions never persist or normalize a complete config.
export function cloneContainer(value) {
  return Array.isArray(value) ? [...value] : { ...(value ?? {}) };
}

export function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneDeep(entry));
  }
  if (isObject(value)) {
    const clone = {};
    for (const [key, entry] of Object.entries(value)) {
      clone[key] = cloneDeep(entry);
    }
    return clone;
  }
  return value;
}

export function serializeConfig(value) {
  const normalize = (input) => {
    if (Array.isArray(input)) {
      return input.map((entry) => normalize(entry));
    }
    if (isObject(input)) {
      return Object.keys(input).sort().reduce((acc, key) => {
        acc[key] = normalize(input[key]);
        return acc;
      }, {});
    }
    return input;
  };

  return JSON.stringify(normalize(value ?? null));
}

export function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function setPathValue(target, path, value) {
  if (!path.length) {
    return value;
  }

  const root = cloneContainer(target ?? {});
  let cursor = root;
  let sourceCursor = target;

  for (let index = 0; index < path.length - 1; index++) {
    const key = path[index];
    const nextSource = isObject(sourceCursor?.[key]) || Array.isArray(sourceCursor?.[key])
      ? sourceCursor[key]
      : {};
    cursor[key] = cloneContainer(nextSource);
    cursor = cursor[key];
    sourceCursor = nextSource;
  }

  cursor[path[path.length - 1]] = value;
  return root;
}

export function deletePathValue(target, path) {
  if (!path.length || !isObject(target)) {
    return target;
  }

  const [key, ...rest] = path;
  if (!(key in target)) {
    return target;
  }

  const cloned = cloneContainer(target);
  if (!rest.length) {
    delete cloned[key];
    return cloned;
  }

  const nextValue = deletePathValue(cloned[key], rest);
  if (nextValue === cloned[key]) {
    return target;
  }

  if (isObject(nextValue) && !Object.keys(nextValue).length) {
    delete cloned[key];
    return cloned;
  }

  cloned[key] = nextValue;
  return cloned;
}

export function getPathValue(target, path) {
  let cursor = target;
  for (const key of path) {
    if (cursor == null) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

export function hasPath(target, path) {
  let cursor = target;
  for (const key of path) {
    if (!isObject(cursor) && !Array.isArray(cursor)) return false;
    if (!(key in cursor)) return false;
    cursor = cursor[key];
  }
  return true;
}

export function normalizeTextValue(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

export function normalizeOptionalEnabled(value) {
  return value === true ? true : value === false ? false : null;
}

export function normalizeNumberValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeDecimalValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

export function getScopedPath(scope, keyPath) {
  const normalizedPath = Array.isArray(keyPath) ? keyPath : [keyPath];
  if (!scope || scope.type === 'card') {
    return normalizedPath;
  }
  if (scope.type === 'entity') {
    return ['entities', scope.index, ...normalizedPath];
  }
  return normalizedPath;
}

export function normalizePath(keyPath) {
  return Array.isArray(keyPath) ? keyPath : [keyPath];
}

export function removePathsFromTarget(target, keyPaths = []) {
  return keyPaths.reduce((nextTarget, keyPath) => (
    deletePathValue(nextTarget, normalizePath(keyPath))
  ), target);
}

export function pruneEmptyObjectsInTarget(target, keyPath) {
  let nextTarget = target;
  const normalizedPath = normalizePath(keyPath);
  for (let index = normalizedPath.length; index > 0; index--) {
    const currentPath = normalizedPath.slice(0, index);
    const currentValue = getPathValue(nextTarget, currentPath);
    if (!isObject(currentValue) || Object.keys(currentValue).length) {
      break;
    }
    nextTarget = deletePathValue(nextTarget, currentPath);
  }
  return nextTarget;
}

export function hasExplicitOverrideValue(value) {
  return value !== '' && value !== undefined && value !== null;
}

export function hasResolvableOverride(parts) {
  return hasExplicitOverrideValue(parts?.fixed) || hasExplicitOverrideValue(parts?.entity);
}
