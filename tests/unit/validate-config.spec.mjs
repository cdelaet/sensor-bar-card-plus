import { describe, expect, it } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { validateNormalizedConfig } from '../../src/config/validate.js';

function normalize(rawConfig) {
  const card = createCard();
  return card.normalizeCardConfig(rawConfig);
}

describe('validateNormalizedConfig', () => {
  it('returns no warnings or errors for a valid config', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      scale: {
        min: { fixed: 0 },
        max: { fixed: 100 },
      },
      target: {
        at: { fixed: 50 },
      },
      baseline: {
        at: { fixed: 0 },
      },
    }));

    expect(diagnostics).toEqual({ warnings: [], errors: [] });
  });

  it('warns when card-level fixed min is greater than max', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      min: 100,
      max: 0,
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.min_gt_max',
      path: 'card',
      entity: null,
    }));
  });

  it('warns and falls back safely for invalid marker resets', () => {
    const normalized = normalize({
      peak: { enabled: true, reset: '60m' },
      floor: { enabled: true, reset: '1h30m' },
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.peak_marker.reset).toEqual({ kind: 'never' });
    expect(normalized.floor_marker.reset).toEqual({ kind: 'never' });
    expect(diagnostics.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'peak_marker.invalid_reset' }),
      expect.objectContaining({ code: 'floor_marker.invalid_reset' }),
    ]));
  });

  it('warns and falls back for explicitly non-string reset values', () => {
    for (const reset of [['15m'], {}, 15, null, true]) {
      const normalized = normalize({
        peak: { enabled: true, reset },
        entities: [{ entity: 'sensor.one' }],
      });
      const diagnostics = validateNormalizedConfig(normalized);

      expect(normalized.peak_marker.reset).toEqual({ kind: 'never' });
      expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
        code: 'peak_marker.invalid_reset',
      }));
    }
  });

  it('validates generic marker inputs, percentage bounds, lanes, shapes, and capacity non-fatally', () => {
    const normalized = normalize({
      markers: [
        { at: '0%', lane: 'above' },
        { at: '35%', lane: 'above' },
        { at: '100%', lane: 'above' },
        { at: { entity: 'sensor.unavailable_limit' }, lane: 'below' },
        { at: '120%' },
        { at: '-1%' },
        { at: { percent: 35 } },
        { at: { fixed: 42 }, lane: 'top' },
        { at: { fixed: 42 }, shape: 'hexagon' },
        null,
      ],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);
    const markers = normalized.entities[0].generic_markers;

    expect(markers.slice(0, 4).map((marker) => marker.accepted)).toEqual([true, true, false, true]);
    expect(markers[3]).toMatchObject({ lane: 'below', accepted: true });
    expect(markers[8]).toMatchObject({ shape: 'circle', accepted: true });
    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'markers.excess_capacity' }),
      expect.objectContaining({ code: 'markers.invalid_percentage' }),
      expect.objectContaining({ code: 'markers.invalid_source' }),
      expect.objectContaining({ code: 'markers.invalid_lane' }),
      expect.objectContaining({ code: 'markers.invalid_shape' }),
      expect.objectContaining({ code: 'markers.invalid_item' }),
    ]));
  });

  it('validates marker label component types and diagnoses the removed unit option', () => {
    const normalized = normalize({
      target: { at: 25, label: { show: true, text: 5, show_value: 'yes', show_unit: 0, precision: -1, unit: false } },
      peak: { enabled: true, label: { show: true, text: '  Max   value  ', show_value: false } },
      markers: [{ at: 50, label: { show: true, text: false, show_value: 1, show_unit: 'false', decimal: 1.5, unit: false } }],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.target_marker).not.toHaveProperty('label_text');
    expect(normalized.peak_marker.label_text).toBe('Max value');
    expect(normalized.entities[0].generic_markers[0].label.showUnit).toBe(true);
    expect(diagnostics.warnings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'markers.invalid_label_text',
      'markers.invalid_label_show_value',
      'markers.invalid_label_show_unit',
      'markers.invalid_label_precision',
      'markers.unsupported_label_unit',
    ]));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'markers.invalid_label_precision',
      path: 'markers[0].label.decimal',
    }));
  });

  it('warns on non-boolean marker label show values and accepts true or false', () => {
    const invalid = normalize({
      target: { at: 25, label: { show: 'true' } },
      peak: { enabled: true, label: { show: 'true' } },
      floor: { enabled: true, label: { show: 1 } },
      markers: [{ at: 50, label: { show: 'true' } }],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(invalid);

    expect(invalid.target_marker.show_label).toBe('true');
    expect(invalid.peak_marker.show_label).toBe(false);
    expect(invalid.floor_marker.show_label).toBe(false);
    expect(invalid.entities[0].generic_markers[0].label.show).toBe(false);
    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings.filter(({ code }) => code === 'markers.invalid_label_show'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'card.target.label.show' }),
        expect.objectContaining({ path: 'card.peak.label.show' }),
        expect.objectContaining({ path: 'card.floor.label.show' }),
        expect.objectContaining({ path: 'markers[0].label.show' }),
      ]));

    const valid = normalize({
      target: { at: 25, label: { show: true } },
      peak: { enabled: true, label: { show: false } },
      floor: { enabled: true, label: { show: true } },
      markers: [{ at: 50, label: { show: false } }],
      entities: [{ entity: 'sensor.one' }],
    });
    expect(validateNormalizedConfig(valid).warnings).not.toContainEqual(
      expect.objectContaining({ code: 'markers.invalid_label_show' })
    );
  });

  it('warns on invalid marker directions and falls back to inward without skipping markers', () => {
    const normalized = normalize({
      target: { at: { fixed: 50 }, direction: 'sideways' },
      peak: { enabled: true, direction: 12 },
      floor: { enabled: true, direction: null },
      markers: [{ at: { fixed: 42 }, direction: 'outside' }],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.target_marker.direction).toBe('inward');
    expect(normalized.peak_marker.direction).toBe('inward');
    expect(normalized.floor_marker.direction).toBe('inward');
    expect(normalized.entities[0].generic_markers[0]).toMatchObject({
      direction: 'inward',
      valid: true,
      accepted: true,
    });
    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'target_marker.invalid_direction',
      'peak_marker.invalid_direction',
      'floor_marker.invalid_direction',
      'markers.invalid_direction',
    ]));
  });

  it('warns on a malformed marker list and skips invalid items without consuming capacity', () => {
    const normalized = normalize({
      markers: [
        { at: { fixed: 1 }, lane: 'above' },
        {},
        { at: { fixed: 2 }, lane: 'above' },
      ],
      entities: [{
        entity: 'sensor.one',
        markers: [
          { at: { fixed: 3 }, lane: 'below' },
          'bad marker',
          { at: { fixed: 4 }, lane: 'below' },
          { at: { fixed: 5 }, lane: 'below' },
        ],
      }, { entity: 'sensor.clear', markers: [] }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.entities[0].generic_markers.map((marker) => marker.accepted)).toEqual([true, false, true, false]);
    expect(normalized.entities[1].generic_markers).toEqual([]);
    expect(diagnostics.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'markers.invalid_source', path: 'markers[1].at' }),
      expect.objectContaining({ code: 'markers.invalid_item' }),
      expect.objectContaining({ code: 'markers.excess_capacity' }),
    ]));

    const malformedList = normalize({ markers: {}, entities: [{ entity: 'sensor.one' }] });
    expect(validateNormalizedConfig(malformedList).warnings).toContainEqual(
      expect.objectContaining({ code: 'markers.invalid_list' })
    );
  });

  it('warns when entity-level fixed min is greater than max', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{
        entity: 'sensor.one',
        min: 100,
        max: 0,
      }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.min_gt_max',
      path: 'entities[0]',
      entity: 'sensor.one',
    }));
  });

  it('warns when a fixed target is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      target: 120,
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'target.outside_scale',
      path: 'card',
    }));
  });

  it('warns when a fixed baseline is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      baseline: 120,
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'baseline.outside_scale',
      path: 'card',
    }));
  });

  it('warns when a segment starts above its end', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: 80, to: 20, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.from_gt_to',
      path: 'card.bar.segments[0]',
    }));
  });

  it('warns when a fixed segment boundary is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: -10, to: 50, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.outside_scale',
      path: 'card.bar.segments[0]',
    }));
  });

  it('warns when fixed segments overlap', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: 0, to: 60, color: '#00ff00' },
          { from: 50, to: 100, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.overlap',
      path: 'card.bar.segments[1]',
    }));
  });

  it('warns when multiple gradient stops share the same position', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        gradient_stops: [
          { pos: 0, color: '#00ff00' },
          { pos: 50, color: '#ffaa00' },
          { pos: 50, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'duplicate-gradient-stop-position',
      path: 'card.bar.gradient_stops[2]',
      entity: null,
    }));
  });

  it('does not warn on distinct gradient stop positions', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        gradient_stops: [
          { pos: 0, color: '#00ff00' },
          { pos: 50, color: '#ffaa00' },
          { pos: 100, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings.some((warning) => (
      warning.code === 'duplicate-gradient-stop-position'
    ))).toBe(false);
  });

  it('warns when baseline configuration suppresses the needle', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      baseline: 0,
      bar: { needle: true },
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'baseline-suppresses-needle',
      path: 'card',
      entity: null,
    }));
  });

  it('does not warn when only baseline or needle is enabled', () => {
    const baselineOnly = validateNormalizedConfig(normalize({
      baseline: 0,
      entities: [{ entity: 'sensor.one' }],
    }));
    const needleOnly = validateNormalizedConfig(normalize({
      bar: { needle: true },
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(baselineOnly.warnings.some((warning) => (
      warning.code === 'baseline-suppresses-needle'
    ))).toBe(false);
    expect(needleOnly.warnings.some((warning) => (
      warning.code === 'baseline-suppresses-needle'
    ))).toBe(false);
  });

  it('does not warn when needle is explicitly disabled', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      baseline: 0,
      bar: { needle: false },
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings.some((warning) => (
      warning.code === 'baseline-suppresses-needle'
    ))).toBe(false);
  });

  it('does not warn on fixed-range checks when values are entity-backed', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min_entity: 'sensor.min',
      max_entity: 'sensor.max',
      target_entity: 'sensor.target',
      baseline: 'sensor.baseline',
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings.some((warning) => (
      warning.code === 'scale.min_gt_max'
      || warning.code === 'target.outside_scale'
      || warning.code === 'baseline.outside_scale'
    ))).toBe(false);
  });

  it('warns on duplicate entity ids', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [
        { entity: 'sensor.one' },
        { entity: 'sensor.one' },
      ],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'entities.duplicate_entity',
      path: 'entities[1]',
      entity: 'sensor.one',
    }));
  });
});
