function hasConfiguredSource(source) {
  if (!source) return false;
  return source.entity !== null && source.entity !== undefined && source.entity !== ''
    || source.fixed !== null && source.fixed !== undefined && source.fixed !== ''
    || Number.isFinite(source.percent);
}

const MARKER_SHAPES = new Set(['circle', 'diamond', 'triangle', 'chevron', 'arrow', 'pin']);

export function normalizeMarkerShape(value, fallback = 'circle') {
  return MARKER_SHAPES.has(value) ? value : fallback;
}

export function createMarkerModel({
  id,
  type,
  value = null,
  position = null,
  lane,
  visible = false,
  color = null,
  label = null,
  labelVisible = false,
  shape = 'circle',
  direction = 'inward',
}) {
  return {
    id,
    type,
    value,
    position,
    lane,
    visible: visible === true,
    color,
    label,
    labelVisible: labelVisible === true,
    shape: normalizeMarkerShape(shape),
    direction,
  };
}

export function getMarkerLaneOccupancy(entityConfig) {
  const targetConfig = entityConfig?.target_marker;
  const peakConfig = entityConfig?.peak_marker;
  const floorConfig = entityConfig?.floor_marker;
  const genericMarkers = (entityConfig?.generic_markers ?? []).filter((marker) => marker.accepted);
  return {
    below: (targetConfig?.enabled !== false && hasConfiguredSource(targetConfig?.source))
      || floorConfig?.show === true
      || genericMarkers.some((marker) => marker.lane === 'below'),
    above: peakConfig?.show === true || genericMarkers.some((marker) => marker.lane === 'above'),
  };
}

export function getMarkerLabelLaneOccupancy(entityConfig) {
  const targetConfig = entityConfig?.target_marker;
  const peakConfig = entityConfig?.peak_marker;
  const floorConfig = entityConfig?.floor_marker;
  const genericMarkers = (entityConfig?.generic_markers ?? []).filter((marker) => marker.accepted);
  return {
    below: (targetConfig?.enabled !== false
      && hasConfiguredSource(targetConfig?.source)
      && targetConfig?.show_label === true)
      || (floorConfig?.show === true && floorConfig?.show_label === true)
      || genericMarkers.some((marker) => marker.lane === 'below' && marker.label?.show === true),
    above: (peakConfig?.show === true && peakConfig?.show_label === true)
      || genericMarkers.some((marker) => marker.lane === 'above' && marker.label?.show === true),
  };
}

export function buildMarkerModels({
  entityConfig,
  targetValue = null,
  targetPosition = null,
  targetPresentation = null,
  targetVisible = Number.isFinite(targetPosition),
  peakValue = null,
  peakPosition = null,
  peakPresentation = null,
  peakVisible = Number.isFinite(peakPosition),
  floorValue = null,
  floorPosition = null,
  floorPresentation = null,
  floorVisible = Number.isFinite(floorPosition),
  genericMarkers = [],
}) {
  const targetConfig = entityConfig?.target_marker;
  const peakConfig = entityConfig?.peak_marker;
  const floorConfig = entityConfig?.floor_marker;
  const targetEnabled = targetConfig?.enabled !== false;

  return [
    createMarkerModel({
      id: 'target',
      type: 'target',
      value: targetValue,
      position: targetPosition,
      lane: 'below',
      visible: targetEnabled && targetVisible,
      color: targetConfig?.color ?? null,
      label: targetPresentation,
      labelVisible: targetEnabled && targetConfig?.show_label === true,
      shape: targetConfig?.shape ?? 'diamond',
      direction: targetConfig?.direction ?? 'inward',
    }),
    createMarkerModel({
      id: 'floor',
      type: 'floor',
      value: floorValue,
      position: floorPosition,
      lane: 'below',
      visible: floorConfig?.show === true && floorVisible,
      color: floorConfig?.color ?? null,
      label: floorPresentation,
      labelVisible: floorConfig?.show === true && floorConfig?.show_label === true,
      shape: 'triangle',
      direction: floorConfig?.direction ?? 'inward',
    }),
    createMarkerModel({
      id: 'peak',
      type: 'peak',
      value: peakValue,
      position: peakPosition,
      lane: 'above',
      visible: peakConfig?.show === true && peakVisible,
      color: peakConfig?.color ?? null,
      label: peakPresentation,
      labelVisible: peakConfig?.show === true && peakConfig?.show_label === true,
      shape: 'triangle',
      direction: peakConfig?.direction ?? 'inward',
    }),
    ...genericMarkers.map((marker) => createMarkerModel({
      id: marker.id,
      type: 'generic',
      value: marker.value,
      position: marker.position,
      lane: marker.lane,
      visible: marker.visible,
      color: marker.color,
      label: marker.label,
      labelVisible: marker.labelVisible,
      shape: marker.shape,
      direction: marker.direction,
    })),
  ];
}
