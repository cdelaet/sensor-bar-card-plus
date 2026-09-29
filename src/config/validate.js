import { getFiniteNumber } from './normalize.js';

function createDiagnostic(code, message, path, entity = null) {
  return { code, message, path, entity };
}

function getStaticFixedValue(resolvable) {
  if (!resolvable || resolvable.entity || Number.isFinite(resolvable.percent)) {
    return null;
  }
  return getFiniteNumber(resolvable.fixed ?? resolvable.value);
}

function addWarning(diagnostics, code, message, path, entity = null) {
  diagnostics.warnings.push(createDiagnostic(code, message, path, entity));
}

function validateScaleBounds(diagnostics, scale, path, entity = null) {
  const min = getStaticFixedValue(scale?.min);
  const max = getStaticFixedValue(scale?.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    addWarning(diagnostics, 'scale.min_gt_max', 'Scale minimum is greater than maximum.', path, entity);
  }
  return { min, max };
}

function validateTargetRange(diagnostics, config, scaleBounds, path, entity = null) {
  const target = getStaticFixedValue(config?.target_marker?.source);
  if (!Number.isFinite(target)) return;
  const { min, max } = scaleBounds;
  if (Number.isFinite(min) && Number.isFinite(max) && (target < min || target > max)) {
    addWarning(diagnostics, 'target.outside_scale', 'Fixed target value is outside the fixed scale range.', path, entity);
  }
}

function validateBaselineRange(diagnostics, config, scaleBounds, path, entity = null) {
  const baseline = getStaticFixedValue(config?.baseline?.at);
  if (!Number.isFinite(baseline)) return;
  const { min, max } = scaleBounds;
  if (Number.isFinite(min) && Number.isFinite(max) && (baseline < min || baseline > max)) {
    addWarning(diagnostics, 'baseline.outside_scale', 'Fixed baseline value is outside the fixed scale range.', path, entity);
  }
}

function hasConfiguredResolvableValue(resolvable) {
  return !!resolvable && (
    Number.isFinite(getFiniteNumber(resolvable.fixed ?? resolvable.value))
    || Number.isFinite(resolvable.percent)
    || !!resolvable.entity
  );
}

function validateBaselineSuppressesNeedle(diagnostics, config, path, entity = null) {
  const needleEnabled = config?.bar?.needle?.show === true;
  const baselineConfigured = config?.baseline?.enabled !== false
    && hasConfiguredResolvableValue(config?.baseline?.at);

  if (needleEnabled && baselineConfigured) {
    addWarning(
      diagnostics,
      'baseline-suppresses-needle',
      'Baseline rendering suppresses the needle marker.',
      path,
      entity
    );
  }
}

function validateExtremumReset(diagnostics, config, path, entity = null) {
  for (const marker of ['peak_marker', 'floor_marker']) {
    if (config?.[marker]?.reset_invalid) {
      addWarning(
        diagnostics,
        `${marker}.invalid_reset`,
        'Invalid marker reset; using never.',
        `${path}.${marker}.reset`,
        entity
      );
    }
  }
}

function validateMarkerDirections(diagnostics, config, path, entity = null) {
  for (const marker of ['target_marker', 'peak_marker', 'floor_marker']) {
    if (config?.[marker]?.direction_invalid) {
      addWarning(
        diagnostics,
        `${marker}.invalid_direction`,
        'Invalid marker direction; using inward.',
        `${path}.${marker === 'target_marker' ? 'target' : marker.replace('_marker', '')}.direction`,
        entity
      );
    }
  }
}

function validateBuiltinMarkerLabels(diagnostics, config, path, entity = null) {
  for (const [key, publicKey] of [['target_marker', 'target'], ['peak_marker', 'peak'], ['floor_marker', 'floor']]) {
    const marker = config?.[key];
    const labelPath = `${path}.${publicKey}.label`;
    if (marker?.label_invalid_show) addWarning(diagnostics, 'markers.invalid_label_show', 'Marker label show must be a boolean; using the existing fallback.', `${labelPath}.show`, entity);
    if (marker?.label_invalid_text) addWarning(diagnostics, 'markers.invalid_label_text', 'Marker label text must be a string; ignoring it.', `${labelPath}.text`, entity);
    if (marker?.label_invalid_show_value) addWarning(diagnostics, 'markers.invalid_label_show_value', 'Marker label show_value must be a boolean; using the inherited or default value.', `${labelPath}.show_value`, entity);
    if (marker?.label_invalid_show_unit) addWarning(diagnostics, 'markers.invalid_label_show_unit', 'Marker label show_unit must be a boolean; using the inherited or default value.', `${labelPath}.show_unit`, entity);
    if (marker?.label_invalid_precision) addWarning(diagnostics, 'markers.invalid_label_precision', 'Marker label precision must be a non-negative integer; using the inherited or row precision.', `${labelPath}.${marker.label_precision_key ?? 'precision'}`, entity);
    if (marker?.label_unsupported_unit) addWarning(diagnostics, 'markers.unsupported_label_unit', 'Marker label unit is no longer supported; use show_unit instead.', `${labelPath}.unit`, entity);
  }
}

function validateGenericMarkers(diagnostics, markers, invalidList, path, entity = null) {
  if (invalidList) {
    addWarning(diagnostics, 'markers.invalid_list', 'Markers must be a list; ignoring the malformed value.', path, entity);
  }

  for (const marker of markers ?? []) {
    const markerPath = `${path}[${marker.index}]`;
    if (marker.malformed) {
      addWarning(diagnostics, 'markers.invalid_item', 'Marker must be an object; ignoring this item.', markerPath, entity);
      continue;
    }
    if (marker.invalidSource && !marker.invalidPercentage && !marker.unsupportedPercentField) {
      addWarning(diagnostics, 'markers.invalid_source', 'Marker requires a valid fixed value, percentage, or entity source.', `${markerPath}.at`, entity);
    }
    if (marker.invalidPercentage) {
      addWarning(diagnostics, 'markers.invalid_percentage', 'Marker percentage must be between 0 and 100 inclusive.', `${markerPath}.at`, entity);
    }
    if (marker.unsupportedPercentField) {
      addWarning(diagnostics, 'markers.invalid_source', 'Use a percentage string such as "35%" instead of an at.percent field.', `${markerPath}.at`, entity);
    }
    if (marker.invalidLane) {
      addWarning(diagnostics, 'markers.invalid_lane', 'Marker lane must be above or below; ignoring this marker.', `${markerPath}.lane`, entity);
    }
    if (marker.invalidShape) {
      addWarning(diagnostics, 'markers.invalid_shape', 'Invalid marker shape; using circle.', `${markerPath}.shape`, entity);
    }
    if (marker.invalidDirection) {
      addWarning(diagnostics, 'markers.invalid_direction', 'Invalid marker direction; using inward.', `${markerPath}.direction`, entity);
    }
    if (marker.invalidShowMarker) addWarning(diagnostics, 'markers.invalid_show_marker', 'Marker show_marker must be a boolean; using true.', `${markerPath}.show_marker`, entity);
    if (marker.label?.invalidEntity) addWarning(diagnostics, 'markers.invalid_label_entity', 'Marker label entity must be a valid entity ID; ignoring it.', `${markerPath}.label.entity`, entity);
    if (marker.label?.invalidShow) addWarning(diagnostics, 'markers.invalid_label_show', 'Marker label show must be a boolean; using the existing fallback.', `${markerPath}.label.show`, entity);
    if (marker.label?.invalidText) addWarning(diagnostics, 'markers.invalid_label_text', 'Marker label text must be a string; ignoring it.', `${markerPath}.label.text`, entity);
    if (marker.label?.invalidShowValue) addWarning(diagnostics, 'markers.invalid_label_show_value', 'Marker label show_value must be a boolean; using the inherited or default value.', `${markerPath}.label.show_value`, entity);
    if (marker.label?.invalidShowUnit) addWarning(diagnostics, 'markers.invalid_label_show_unit', 'Marker label show_unit must be a boolean; using the inherited or default value.', `${markerPath}.label.show_unit`, entity);
    if (marker.label?.invalidPrecision) addWarning(diagnostics, 'markers.invalid_label_precision', 'Marker label precision must be a non-negative integer; using the inherited or row precision.', `${markerPath}.label.${marker.label.invalidPrecisionKey ?? 'precision'}`, entity);
    if (marker.label?.unsupportedUnit) addWarning(diagnostics, 'markers.unsupported_label_unit', 'Marker label unit is no longer supported; use show_unit instead.', `${markerPath}.label.unit`, entity);
    if (marker.valid && !marker.accepted) {
      addWarning(diagnostics, 'markers.excess_capacity', 'This marker is not rendered because its lane already has four markers.', markerPath, entity);
    }
  }
}

function getStaticSegmentBound(boundary) {
  if (!boundary || boundary.entity || Number.isFinite(boundary.percent)) return null;
  return getFiniteNumber(boundary.fixed ?? boundary.value);
}

function validateSegments(diagnostics, segments, scaleBounds, path, entity = null) {
  if (!Array.isArray(segments) || !segments.length) return;
  const staticSegments = [];
  const { min, max } = scaleBounds;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const from = getStaticSegmentBound(segment?.from);
    const to = getStaticSegmentBound(segment?.to);
    const segmentPath = `${path}.segments[${index}]`;

    if (Number.isFinite(from) && Number.isFinite(to) && from > to) {
      addWarning(diagnostics, 'segments.from_gt_to', 'Segment start is greater than segment end.', segmentPath, entity);
    }

    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (Number.isFinite(from) && (from < min || from > max)) {
        addWarning(diagnostics, 'segments.outside_scale', 'Segment boundary is outside the fixed scale range.', segmentPath, entity);
      }
      if (Number.isFinite(to) && (to < min || to > max)) {
        addWarning(diagnostics, 'segments.outside_scale', 'Segment boundary is outside the fixed scale range.', segmentPath, entity);
      }
    }

    if (Number.isFinite(from) && Number.isFinite(to)) {
      staticSegments.push({ from, to, path: segmentPath });
    }
  }

  const sorted = [...staticSegments].sort((a, b) => a.from - b.from);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.from < previous.to) {
      addWarning(diagnostics, 'segments.overlap', 'Fixed segments overlap.', current.path, entity);
    }
  }
}

function validateGradientStops(diagnostics, stops, path, entity = null) {
  if (!Array.isArray(stops)) return;
  const seenPositions = new Set();
  for (let index = 0; index < stops.length; index += 1) {
    const pos = getFiniteNumber(stops[index]?.pos);
    const stopPath = `${path}.gradient_stops[${index}]`;
    if (Number.isFinite(pos) && (pos < 0 || pos > 100)) {
      addWarning(
        diagnostics,
        'gradient_stops.outside_range',
        'Gradient stop position is outside 0..100.',
        stopPath,
        entity
      );
    }
    if (Number.isFinite(pos)) {
      if (seenPositions.has(pos)) {
        addWarning(
          diagnostics,
          'duplicate-gradient-stop-position',
          'Multiple gradient stops use the same position value.',
          stopPath,
          entity
        );
      } else {
        seenPositions.add(pos);
      }
    }
  }
}

function validateConfigScope(diagnostics, config, path, entity = null) {
  const scaleBounds = validateScaleBounds(diagnostics, config?.scale, path, entity);
  validateTargetRange(diagnostics, config, scaleBounds, path, entity);
  validateBaselineRange(diagnostics, config, scaleBounds, path, entity);
  validateBaselineSuppressesNeedle(diagnostics, config, path, entity);
  validateExtremumReset(diagnostics, config, path, entity);
  validateMarkerDirections(diagnostics, config, path, entity);
  validateBuiltinMarkerLabels(diagnostics, config, path, entity);
  validateSegments(diagnostics, config?.bar?.segments, scaleBounds, `${path}.bar`, entity);
  validateGradientStops(diagnostics, config?.bar?.gradient_stops, `${path}.bar`, entity);
}

export function validateNormalizedConfig(config) {
  const diagnostics = {
    warnings: [],
    errors: [],
  };

  if (!config || typeof config !== 'object') {
    return diagnostics;
  }

  validateConfigScope(diagnostics, config, 'card');
  validateGenericMarkers(diagnostics, config.generic_markers, config.generic_markers_invalid, 'markers');

  const seenEntities = new Set();
  const entities = Array.isArray(config.entities) ? config.entities : [];
  for (let index = 0; index < entities.length; index += 1) {
    const entityConfig = entities[index];
    const entityId = entityConfig?.entity ?? null;
    const path = `entities[${index}]`;

    if (!entityId) {
      addWarning(diagnostics, 'entities.missing_entity', 'Entity row is missing an entity id.', path, null);
      continue;
    }

    if (seenEntities.has(entityId)) {
      addWarning(diagnostics, 'entities.duplicate_entity', 'Duplicate entity id in the same card config.', path, entityId);
    } else {
      seenEntities.add(entityId);
    }

    validateConfigScope(diagnostics, entityConfig, path, entityId);
    if (Object.prototype.hasOwnProperty.call(entityConfig, 'markers')) {
      validateGenericMarkers(
        diagnostics,
        entityConfig.generic_markers,
        entityConfig.generic_markers_invalid,
        `${path}.markers`,
        entityId
      );
    } else {
      const inheritedOverflow = (entityConfig.generic_markers ?? []).filter((marker) =>
        marker.valid && !marker.accepted && config.generic_markers?.[marker.index]?.accepted === true
      );
      if (inheritedOverflow.length) {
        validateGenericMarkers(diagnostics, inheritedOverflow, false, `${path}.markers`, entityId);
      }
    }
  }

  return diagnostics;
}
