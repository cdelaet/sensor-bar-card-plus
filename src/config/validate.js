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
  }

  return diagnostics;
}
