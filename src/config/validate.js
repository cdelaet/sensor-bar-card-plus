import { getTargetDirections } from './directional-targets.js';
import { getFiniteNumber, looksLikeEntityId, UNSUPPORTED_EXTREMA_ALIASES, BAR_PAINT_DIAGNOSTICS, PAINT_PROPERTY_SOURCES } from './normalize.js';

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

function validateUnsupportedExtremaAliases(diagnostics, config, path, entity = null) {
  for (const alias of config?.[UNSUPPORTED_EXTREMA_ALIASES] ?? []) {
    addWarning(diagnostics, 'markers.unsupported_extremum_alias',
      `Unsupported ${alias}; use ${alias.replace('_marker', '')} instead.`, `${path}.${alias}`, entity);
  }
}

function validateAttribute(diagnostics, source, path, entity = null) {
  if (source?.attribute_invalid) {
    addWarning(diagnostics, 'source.invalid_attribute', 'Attribute must be a non-empty string; using the entity state.', path, entity);
  }
}

function validateEntitySource(diagnostics, source, path, entity = null) {
  if (source?.entity_invalid) {
    addWarning(diagnostics, 'source.invalid_entity_source',
      'Entity source must be an entity ID or `{ id: entity_id, attribute: attribute_name }`; sibling `attribute` is not supported.',
      path, entity);
  }
}

function validateScaleBounds(diagnostics, scale, path, entity = null) {
  if (scale?.min?.entity && scale?.max?.entity) {
    const hasFixed = (bound) => bound.fixed_explicit !== false
      && (bound.fixed ?? bound.value) !== null && (bound.fixed ?? bound.value) !== undefined;
    if (hasFixed(scale.min) !== hasFixed(scale.max)) {
      addWarning(diagnostics, 'scale.orphan_fixed_fallback',
        'Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.',
        `${path}.scale`, entity);
    }
  }
  const min = getStaticFixedValue(scale?.min);
  const max = getStaticFixedValue(scale?.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    addWarning(diagnostics, 'scale.min_gt_max', 'Scale minimum is greater than maximum.', path, entity);
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
    if (config?.[marker]?.window_entity_invalid) {
      addWarning(diagnostics, `${marker}.invalid_window_entity`,
        'Dropdown Helper must be an input_select entity ID; using the configured static history window.',
        `${path}.${marker === 'peak_marker' ? 'peak' : 'floor'}.window_entity`, entity);
    }
    if (config?.[marker]?.window_invalid) {
      const name = marker === 'peak_marker' ? 'Peak' : 'Floor';
      const configuredWindow = config[marker].window;
      let window = configuredWindow === null || configuredWindow === undefined ? 'unspecified' : configuredWindow;
      if (typeof window !== 'string') {
        try { window = JSON.stringify(window); } catch { window = String(window); }
      }
      diagnostics.errors.push({
        code: `${marker}.invalid_window`,
        severity: 'error',
        path: `${path}.${marker}.window`,
        entity,
        area: `${name} marker · Configured window: ${window}`,
        window,
        message: `Configured history window “${window}” is invalid or unsupported. ${name} marker is unavailable until a supported window is configured.`,
      });
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
  for (const [marker, publicKey] of [[config?.target_marker, 'target'], [config?.peak_marker, 'peak'], [config?.floor_marker, 'floor'],
    ...Object.entries(getTargetDirections(config)).map(([side, target]) => [target.marker, `target.when_${side}.marker`])]) {
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
    validateEntitySource(diagnostics, marker.source, `${markerPath}.at`, entity);
    if (marker.invalidSource && !marker.invalidPercentage && !marker.source?.entity_invalid) {
      addWarning(diagnostics, 'markers.invalid_source', 'Marker requires a valid fixed value, percentage, or entity source.', `${markerPath}.at`, entity);
    }
    if (marker.invalidPercentage) {
      addWarning(diagnostics, 'markers.invalid_percentage', 'Marker percentage must be between 0 and 100 inclusive.', `${markerPath}.at`, entity);
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
    if (marker.label?.invalidEntity) addWarning(diagnostics, 'markers.invalid_label_entity', 'Marker label entity must be an entity ID or `{ id, attribute }`; sibling `label.attribute` is not supported.', `${markerPath}.label.entity`, entity);
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

function validateSegments(diagnostics, segments, path, entity = null, checkStatic = true) {
  if (!Array.isArray(segments) || !segments.length) return;
  const staticSegments = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const from = getStaticSegmentBound(segment?.from);
    const to = getStaticSegmentBound(segment?.to);
    const segmentPath = `${path}.segments[${index}]`;

    if (segment?.invalidBoundary === 'entity') {
      if (checkStatic) addWarning(diagnostics, 'segments.unsupported_entity_boundary', 'Entity-backed segment boundaries are not supported; ignoring this segment.', segmentPath, entity);
      continue;
    }
    if (segment?.invalidBoundary === 'malformed_percent') {
      if (checkStatic) addWarning(diagnostics, 'segments.invalid_percentage', 'Malformed percentage segment boundary; ignoring this segment.', segmentPath, entity);
      continue;
    }
    if (segment?.invalidBoundary) {
      if (checkStatic) addWarning(diagnostics, 'segments.invalid_boundary', 'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.', segmentPath, entity);
      continue;
    }

    if (checkStatic && Number.isFinite(from) && Number.isFinite(to) && from > to) {
      addWarning(diagnostics, 'segments.from_gt_to', 'Segment start is greater than segment end.', segmentPath, entity);
    }

    if (checkStatic && Number.isFinite(from) && Number.isFinite(to)) {
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
    if (!stops[index] || typeof stops[index] !== 'object' || Array.isArray(stops[index])) {
      addWarning(diagnostics, 'gradient_stops.invalid_stop',
        'Gradient stop must be an object with a position and color; ignoring this stop.', `${path}.gradient_stops[${index}]`, entity);
      continue;
    }
    const pos = getFiniteNumber(stops[index].pos);
    const stopPath = `${path}.gradient_stops[${index}]`;
    if (typeof stops[index].color !== 'string' || !stops[index].color.trim()) {
      addWarning(diagnostics, 'gradient_stops.invalid_color',
        'Gradient stop color must be a non-empty CSS color; ignoring this stop.', stopPath, entity);
    }
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

function paletteValidationSource(config, inheritedConfig, path, property) {
  const source = config?.bar?.paint?.[PAINT_PROPERTY_SOURCES]?.[property];
  const groupedSource = `bar.paint.${property}`;
  if (source === groupedSource) return { path: `${path}.bar.paint`, inherited: false };
  if (source === undefined && inheritedConfig?.bar?.paint?.[PAINT_PROPERTY_SOURCES]?.[property] === groupedSource) {
    return { path: 'card.bar.paint', inherited: true };
  }
  // Legacy diagnostics retain their existing resolved-scope paths and frequency.
  return { path: `${path}.bar`, inherited: false };
}

function validateConfigScope(diagnostics, config, path, entity = null, inheritedConfig = null) {
  for (const issue of config?.target_above?.[BAR_PAINT_DIAGNOSTICS] ?? []) {
    addWarning(diagnostics, `paint.${issue.kind === 'invalid' ? 'invalid_value' : 'legacy_conflict'}`,
      issue.kind === 'legacy_conflict' ? `Grouped paint overrides ${issue.legacyPath}.`
        : issue.property === 'opacity' ? 'Invalid paint opacity; using 100.'
          : 'Invalid grouped paint value; using the legacy, inherited or default value.',
      `${path}.target.when_above.paint${issue.property === null ? '' : `.${issue.property}`}`, entity);
  }
  for (const issue of config?.target_below?.[BAR_PAINT_DIAGNOSTICS] ?? []) {
    addWarning(diagnostics, `paint.${issue.kind === 'invalid' ? 'invalid_value' : 'legacy_conflict'}`,
      issue.property === 'opacity' ? 'Invalid paint opacity; using 100.'
        : 'Invalid grouped paint value; using the inherited or default value.',
      `${path}.target.when_below.paint${issue.property === null ? '' : `.${issue.property}`}`, entity);
  }
  for (const issue of config?.bar?.[BAR_PAINT_DIAGNOSTICS] ?? []) {
    const paintPath = `${path}.bar.paint${issue.property === null ? '' : `.${issue.property}`}`;
    addWarning(diagnostics, `paint.${issue.kind === 'invalid' ? 'invalid_value' : 'legacy_conflict'}`,
      issue.kind === 'legacy_conflict'
        ? `Grouped paint overrides ${issue.legacyPath}.`
        : issue.property === 'opacity' ? 'Invalid paint opacity; using 100.'
          : 'Invalid grouped paint value; using the legacy, inherited or default value.', paintPath, entity);
  }
  for (const side of ['above', 'below']) {
    const direction = config?.baseline?.[side];
    for (const issue of direction?.[BAR_PAINT_DIAGNOSTICS] ?? []) {
      const paintPath = `${path}.baseline.${side}.paint${issue.property === null ? '' : `.${issue.property}`}`;
      addWarning(diagnostics, `paint.${issue.kind === 'invalid' ? 'invalid_value' : 'legacy_conflict'}`,
        issue.kind === 'legacy_conflict'
          ? `Grouped paint overrides ${issue.legacyPath}.`
          : issue.property === 'opacity' ? 'Invalid paint opacity; using 100.'
            : 'Invalid grouped paint value; using the legacy, inherited or default value.', paintPath, entity);
    }
  }
  if (config?.scale?.direction_invalid) {
    addWarning(diagnostics, 'scale.invalid_direction',
      'Scale direction must be `normal` or `reverse`; using the inherited or default direction.',
      `${path}.scale.direction`, entity);
  }
  if (config?.bar?.direction_invalid) {
    addWarning(diagnostics, 'bar.invalid_direction',
      'Bar direction must be `normal` or `reverse`; using the inherited or default direction.',
      `${path}.bar.direction`, entity);
  }
  validateAttribute(diagnostics, config, `${path}.attribute`, entity);
  validateAttribute(diagnostics, config?.scale?.min, `${path}.scale.min.attribute`, entity);
  validateAttribute(diagnostics, config?.scale?.max, `${path}.scale.max.attribute`, entity);
  validateAttribute(diagnostics, config?.baseline?.at, `${path}.baseline.at.attribute`, entity);
  validateEntitySource(diagnostics, config?.scale?.min, `${path}.scale.min`, entity);
  validateEntitySource(diagnostics, config?.scale?.max, `${path}.scale.max`, entity);
  validateEntitySource(diagnostics, config?.baseline?.at, `${path}.baseline.at`, entity);
  validateScaleBounds(diagnostics, config?.scale, path, entity);
  const targetSourcePaths = new Set();
  for (const [side, target] of Object.entries(getTargetDirections(config))) {
    const sourcePath = `${path}.${target.sourcePath}`;
    if (!targetSourcePaths.has(sourcePath)) {
      targetSourcePaths.add(sourcePath);
      validateAttribute(diagnostics, target.source, `${sourcePath}.attribute`, entity);
      validateEntitySource(diagnostics, target.source, sourcePath, entity);
    }
    if (target.marker?.direction_invalid) addWarning(diagnostics, 'target_marker.invalid_direction',
      'Invalid marker direction; using inward.', `${path}.target.when_${side}.marker.direction`, entity);
  }
  const targetPaint = config?.target_above?.paint;
  if (targetPaint) {
    validateSegments(diagnostics, targetPaint.segments, `${path}.target.when_above.paint`, entity, true);
    validateGradientStops(diagnostics, targetPaint.gradient_stops, `${path}.target.when_above.paint`, entity);
  }
  const belowTargetPaint = config?.target_below?.paint;
  if (belowTargetPaint) {
    validateSegments(diagnostics, belowTargetPaint.segments, `${path}.target.when_below.paint`, entity, true);
    validateGradientStops(diagnostics, belowTargetPaint.gradient_stops, `${path}.target.when_below.paint`, entity);
  }
  if (config?.decimal_invalid === true) {
    addWarning(diagnostics, 'formatting.invalid_decimal',
      'Decimal places must be a whole number from 0 to 20; using default formatting.', `${path}.formatting.decimal`, entity);
  }
  validateBaselineSuppressesNeedle(diagnostics, config, path, entity);
  validateExtremumReset(diagnostics, config, path, entity);
  validateMarkerDirections(diagnostics, config, path, entity);
  validateBuiltinMarkerLabels(diagnostics, config, path, entity);
  const segments = paletteValidationSource(config, inheritedConfig, path, 'segments');
  validateSegments(diagnostics, config?.bar?.segments, segments.path, entity, !segments.inherited);
  const gradientStops = paletteValidationSource(config, inheritedConfig, path, 'gradient_stops');
  if (!gradientStops.inherited) validateGradientStops(diagnostics, config?.bar?.gradient_stops, gradientStops.path, entity);
  for (const side of ['above', 'below']) {
    const paint = config?.baseline?.[side]?.paint;
    if (!paint || typeof paint !== 'object') continue;
    validateSegments(diagnostics, paint.segments, `${path}.baseline.${side}.paint`, entity, true);
    validateGradientStops(diagnostics, paint.gradient_stops, `${path}.baseline.${side}.paint`, entity);
  }
}

export function validateNormalizedConfig(config) {
  const diagnostics = {
    warnings: [],
    errors: [],
  };

  if (!config || typeof config !== 'object') {
    return diagnostics;
  }

  if (config.entities_invalid === true) {
    addWarning(diagnostics, 'entities.invalid_structure',
      'Entities must be a list; no entity rows were loaded.', 'entities', null);
  }
  validateConfigScope(diagnostics, config, 'card');
  validateUnsupportedExtremaAliases(diagnostics, config, 'card');
  validateGenericMarkers(diagnostics, config.generic_markers, config.generic_markers_invalid, 'markers');

  const entities = Array.isArray(config.entities) ? config.entities : [];
  for (let index = 0; index < entities.length; index += 1) {
    const entityConfig = entities[index];
    const entityId = entityConfig?.entity ?? null;
    const path = `entities[${index}]`;
    validateUnsupportedExtremaAliases(diagnostics, entityConfig, path, entityId);

    if (!entityId) {
      addWarning(diagnostics, 'entities.missing_entity', 'Entity row is missing an entity id.', path, null);
      continue;
    }

    if (entityConfig?.entity_invalid === true || !looksLikeEntityId(entityId)) {
      addWarning(diagnostics, 'entities.invalid_entity',
        'Entity ID must use the domain.object_id form; this row remains unresolved until corrected.',
        `${path}.entity`, entityId);
    }

    validateConfigScope(diagnostics, entityConfig, path, entityId, config);
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
