// The shared marker remains a compatibility input for callers of the row model.
export function getTargetDirections(config) {
  return config?.target_directions ?? Object.fromEntries(['above', 'below'].map(side =>
    [side, { source: config?.target_marker?.source, marker: config?.target_marker, sourcePath: 'target.at' }]));
}

export function hasTargetSource(source) {
  return !!source && (source.entity || source.fixed !== null && source.fixed !== undefined && source.fixed !== ''
    || Number.isFinite(source.percent));
}

export function sameTargetSource(a, b) {
  return ['fixed', 'entity', 'percent', 'attribute'].every(key => (a?.[key] ?? null) === (b?.[key] ?? null));
}

export function getTargetSourceEntities(config) {
  return [...new Set(Object.values(getTargetDirections(config)).map(target => target.source?.entity).filter(Boolean))];
}

export function getConfiguredTargetMarkers(config) {
  const { above, below } = getTargetDirections(config);
  const candidates = [above, below].filter(target => target.marker?.enabled !== false && hasTargetSource(target.source));
  return candidates.length === 2 && sameTargetSource(above.source, below.source) ? [above] : candidates;
}
