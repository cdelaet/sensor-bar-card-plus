import { describe, expect, it } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { validateNormalizedConfig } from '../../src/config/validate.js';

function normalize(rawConfig) {
  const card = createCard();
  return card.normalizeCardConfig(rawConfig);
}

describe('validateNormalizedConfig', () => {
  it.each(['min', 'max'])('warns non-fatally for a two-dynamic-bound pair with only %s.fixed', (key) => {
    const scale = { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } };
    scale[key].fixed = key === 'min' ? 0 : 1000;
    const diagnostics = validateNormalizedConfig(normalize({ entity: 'sensor.one', scale }));
    expect(diagnostics.errors).toEqual([]);
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.orphan_fixed_fallback', path: 'card.scale', entity: null,
      message: expect.stringContaining('will not be used'),
    }));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.orphan_fixed_fallback', path: 'entities[0].scale', entity: 'sensor.one',
    }));
  });

  it.each([
    { min: { entity: 'sensor.min', fixed: 0 }, max: { entity: 'sensor.max', fixed: 1000 } },
    { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } },
    { min: { fixed: 0 }, max: { entity: 'sensor.max', fixed: 1000 } },
    { min: { entity: 'sensor.min', fixed: -500 } },
  ])('does not warn about an orphan fallback for complete, absent, or mixed fallbacks', (scale) => {
    const diagnostics = validateNormalizedConfig(normalize({ entity: 'sensor.one', scale }));
    expect(diagnostics.warnings.filter(({ code }) => code === 'scale.orphan_fixed_fallback')).toEqual([]);
  });

  it('warns on a row override without treating the default max as an explicit fallback', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one', scale: { min: 'sensor.min', max: 'sensor.max' }, min: 500 }],
      min: 500,
    }));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.orphan_fixed_fallback', path: 'entities[0].scale',
    }));
  });

  it.each([
    { scale: { min: 'sensor.min', max: 'sensor.max' } },
    { min_entity: 'sensor.min', max_entity: 'sensor.max' },
  ])('does not warn when shorthand dynamic bounds have only implicit defaults', (config) => {
    const diagnostics = validateNormalizedConfig(normalize({ entity: 'sensor.one', ...config }));
    expect(diagnostics.warnings.filter(({ code }) => code === 'scale.orphan_fixed_fallback')).toEqual([]);
  });

  it.each([
    { scale: { min: 'sensor.min', max: { entity: 'sensor.max', fixed: 1000 } } },
    { min_entity: 'sensor.min', max_entity: 'sensor.max', max: 1000 },
  ])('warns for a shorthand dynamic pair with only one explicit fallback', (config) => {
    const diagnostics = validateNormalizedConfig(normalize({ entity: 'sensor.one', ...config }));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.orphan_fixed_fallback', path: 'card.scale',
    }));
  });

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
        { at: { fixed: 44 }, lane: 'above' },
        { at: { fixed: 45 }, lane: 'above' },
      ],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);
    const markers = normalized.entities[0].generic_markers;

    expect(markers.slice(0, 4).map((marker) => marker.accepted)).toEqual([true, true, true, true]);
    expect(markers[3]).toMatchObject({ lane: 'below', accepted: true });
    expect(markers[8]).toMatchObject({ shape: 'circle', accepted: true });
    expect(markers[11]).toMatchObject({ lane: 'above', accepted: false });
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
      markers: [{ at: 50, show_marker: 'false', label: { show: true, text: false, entity: 42, show_value: 1, show_unit: 'false', decimal: 1.5, unit: false } }],
      entities: [{ entity: 'sensor.one' }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.target_marker).not.toHaveProperty('label_text');
    expect(normalized.peak_marker.label_text).toBe('Max value');
    expect(normalized.entities[0].generic_markers[0].label.showUnit).toBe(true);
    expect(diagnostics.warnings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'markers.invalid_label_text',
      'markers.invalid_label_entity',
      'markers.invalid_show_marker',
      'markers.invalid_label_show_value',
      'markers.invalid_label_show_unit',
      'markers.invalid_label_precision',
      'markers.unsupported_label_unit',
    ]));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'markers.invalid_label_precision',
      path: 'markers[0].label.decimal',
    }));
    expect(normalized.entities[0].generic_markers[0]).toMatchObject({ showMarker: true, label: { entity: null, invalidEntity: true } });
  });

  it('normalizes label entity and show_marker defaults while preserving old marker defaults', () => {
    const normalized = normalize({
      markers: [
        { at: { fixed: 50 }, label: { show: true, entity: ' sensor.energy_total ' } },
        { at: { fixed: 75 }, label: { text: 'Existing' } },
      ],
      entities: [{ entity: 'sensor.one' }],
    });
    expect(normalized.entities[0].generic_markers.map((marker) => marker.showMarker)).toEqual([true, true]);
    expect(normalized.entities[0].generic_markers[0].label.entity).toBe('sensor.energy_total');
    expect(normalized.entities[0].generic_markers[1].label).toMatchObject({ show: false, entity: null });
    expect(validateNormalizedConfig(normalized).warnings).toEqual([]);
  });

  it('accepts up to four generic markers in each lane without a global generic limit', () => {
    for (const lanes of [
      ['above', 'above', 'above', 'above', 'below', 'below', 'below', 'below'],
      ['above', 'above', 'above', 'above', 'above', 'below', 'below', 'below', 'below'],
    ]) {
      const normalized = normalize({
        markers: lanes.map((lane, index) => ({ at: { fixed: index * 20 }, lane })),
        entities: [{ entity: 'sensor.one' }],
      });
      const markers = normalized.entities[0].generic_markers;
      expect(markers.filter((marker) => marker.accepted && marker.lane === 'above')).toHaveLength(4);
      expect(markers.filter((marker) => marker.accepted && marker.lane === 'below')).toHaveLength(4);
      expect(markers.filter((marker) => !marker.accepted)).toHaveLength(lanes.length - 8);
    }
  });

  it('does not reserve lane capacity for disabled or unconfigured special markers', () => {
    const markersForLane = (lane) => Array.from({ length: 4 }, (_, index) => ({
      at: { fixed: index * 20 },
      lane,
    }));
    const acceptedInLane = (specialMarkers, lane) => {
      const normalized = normalize({
        ...specialMarkers,
        markers: markersForLane(lane),
        entities: [{ entity: 'sensor.capacity' }],
      });
      return normalized.entities[0].generic_markers.filter((marker) => marker.accepted && marker.lane === lane).length;
    };

    expect(acceptedInLane({}, 'above')).toBe(4);
    expect(acceptedInLane({ peak: { enabled: false } }, 'above')).toBe(4);
    expect(acceptedInLane({}, 'below')).toBe(4);
    expect(acceptedInLane({ floor: { enabled: false } }, 'below')).toBe(4);
    expect(acceptedInLane({ target: { at: 50, enabled: false } }, 'below')).toBe(4);

    const noSpecialMarkers = normalize({
      markers: [
        ...markersForLane('above'),
        ...markersForLane('below'),
      ],
      entities: [{ entity: 'sensor.capacity' }],
    }).entities[0].generic_markers;
    expect(noSpecialMarkers.filter((marker) => marker.accepted)).toHaveLength(8);
  });

  it('reserves special marker slots before accepting generic markers in each lane', () => {
    const normalized = normalize({
      target: { at: 50 },
      peak: { enabled: true },
      floor: { enabled: true },
      markers: [
        { at: 10, lane: 'above' }, { at: 20, lane: 'above' }, { at: 30, lane: 'above' },
        { at: 40, lane: 'below' }, { at: 60, lane: 'below' },
      ],
      entities: [{ entity: 'sensor.one' }],
    });
    const markers = normalized.entities[0].generic_markers;

    expect(markers.map((marker) => marker.accepted)).toEqual([true, true, true, true, true]);
    expect(markers.filter((marker) => marker.lane === 'above' && marker.accepted)).toHaveLength(3);
    expect(markers.filter((marker) => marker.lane === 'below' && marker.accepted)).toHaveLength(2);
  });

  it('continues processing later generic markers after a lane fills without redistributing them', () => {
    const aboveOverflow = normalize({
      peak: { enabled: true },
      markers: [
        { at: 10, lane: 'above' }, { at: 20, lane: 'above' }, { at: 30, lane: 'above' },
        { at: 40, lane: 'above' }, { at: 50, lane: 'above' }, { at: 60, lane: 'below' },
      ],
      entities: [{ entity: 'sensor.one' }],
    }).entities[0].generic_markers;

    expect(aboveOverflow.map((marker) => marker.accepted)).toEqual([true, true, true, false, false, true]);
    expect(aboveOverflow.slice(3, 5).every((marker) => marker.lane === 'above')).toBe(true);

    const belowOverflow = normalize({
      target: { at: 50 },
      floor: { enabled: true },
      markers: [
        { at: 10, lane: 'below' }, { at: 20, lane: 'below' }, { at: 30, lane: 'below' },
        { at: 40, lane: 'below' }, { at: 60, lane: 'above' },
      ],
      entities: [{ entity: 'sensor.two' }],
    }).entities[0].generic_markers;

    expect(belowOverflow.map((marker) => marker.accepted)).toEqual([true, true, false, false, true]);
    expect(belowOverflow[2].lane).toBe('below');
  });

  it('keeps the earliest fitting generic markers and counts hidden glyph markers toward capacity', () => {
    const normalized = normalize({
      peak: { enabled: true },
      markers: [
        { at: 10, lane: 'above', show_marker: false },
        { at: 20, lane: 'above' },
        { at: 30, lane: 'above' },
        { at: 40, lane: 'above' },
      ],
      entities: [{ entity: 'sensor.one' }],
    });
    const markers = normalized.entities[0].generic_markers;

    expect(markers.map((marker) => marker.accepted)).toEqual([true, true, true, false]);
    expect(markers[0]).toMatchObject({ showMarker: false, accepted: true });
  });

  it('reapplies inherited generic marker capacity for entity-level special markers', () => {
    const normalized = normalize({
      markers: Array.from({ length: 5 }, (_, index) => ({ at: index * 10, lane: 'above' })),
      entities: [
        { entity: 'sensor.with_peak', peak: { enabled: true } },
        { entity: 'sensor.without_peak' },
      ],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.entities[0].generic_markers.map((marker) => marker.accepted)).toEqual([true, true, true, false, false]);
    expect(normalized.entities[1].generic_markers.map((marker) => marker.accepted)).toEqual([true, true, true, true, false]);
    expect(normalized.entities[0].generic_markers).not.toBe(normalized.entities[1].generic_markers);
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'markers.excess_capacity',
      path: 'entities[0].markers[3]',
      entity: 'sensor.with_peak',
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
          { at: { fixed: 6 }, lane: 'below' },
          { at: { fixed: 7 }, lane: 'below' },
        ],
      }, { entity: 'sensor.clear', markers: [] }],
    });
    const diagnostics = validateNormalizedConfig(normalized);

    expect(normalized.entities[0].generic_markers.map((marker) => marker.accepted)).toEqual([true, false, true, true, true, false]);
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

  it('warns and ignores malformed percentage segment boundaries', () => {
    const normalized = normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: { segments: [{ from: 'twenty%', to: '80%', color: '#ff0000' }] },
    });
    const diagnostics = validateNormalizedConfig(normalized);
    const card = createCard();

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.invalid_percentage',
      path: 'card.bar.segments[0]',
    }));
    expect(card._getSegmentsForRendering(normalized.entities[0], 0, 100)).toEqual([]);
  });

  it('warns and ignores unsupported entity-backed segment boundaries', () => {
    const normalized = normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: { segments: [
        { from: 'sensor.limit', to: '80%', color: '#ff0000' },
        { from: { fixed: 20, entity: 'sensor.other_limit' }, to: '80%', color: '#00ff00' },
      ] },
    });
    const diagnostics = validateNormalizedConfig(normalized);
    const card = createCard();

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.unsupported_entity_boundary',
      path: 'card.bar.segments[0]',
    }));
    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.unsupported_entity_boundary',
      path: 'card.bar.segments[1]',
    }));
    expect(card._getSegmentsForRendering(normalized.entities[0], 0, 100)).toEqual([]);
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
