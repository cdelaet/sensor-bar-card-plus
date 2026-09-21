function hasConfiguredSource(source) {
  if (!source) return false;
  return source.entity !== null && source.entity !== undefined && source.entity !== ''
    || source.fixed !== null && source.fixed !== undefined && source.fixed !== ''
    || Number.isFinite(source.percent);
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
  };
}

export function getMarkerLaneOccupancy(entityConfig) {
  const targetConfig = entityConfig?.target_marker;
  const peakConfig = entityConfig?.peak_marker;
  return {
    above: peakConfig?.show === true,
    below: targetConfig?.enabled !== false && hasConfiguredSource(targetConfig?.source),
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
}) {
  const targetConfig = entityConfig?.target_marker;
  const peakConfig = entityConfig?.peak_marker;
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
    }),
  ];
}
