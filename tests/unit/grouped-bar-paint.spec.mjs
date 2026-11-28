import { describe, expect, it } from 'vitest';
import {
  normalizeBarConfig, normalizeCardConfig, INVALID_PAINT_OPACITY,
  BAR_PAINT_DIAGNOSTICS, PAINT_PROPERTY_SOURCES,
} from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';

const entity = 'sensor.power';
const segments = [{ from: -20, to: '50%', color: '#123456' }, { from: '50%', to: 100, color: 'var(--accent-color)' }];
const gradient_stops = [{ pos: '0%', color: '#123456', extra: true }, { pos: '100', color: '#abcdef' }];
const normalize = (bar, row = {}) => normalizeCardConfig({ bar, entities: [{ entity, ...row }] });
const flatPaint = bar => Object.fromEntries(['color', 'fill_style', 'solid_fill', 'segments', 'gradient_stops'].map(key => [key, bar[key]]));

for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
  it(`normalizes grouped and legacy ${fill_style} paint equivalently`, () => {
    const paint = { color: 'var(--accent-color)', fill_style, solid_fill: false, segments, gradient_stops };
    const legacy = normalize(paint), grouped = normalize({ paint });
    expect(grouped.bar).toEqual(legacy.bar);
    expect(grouped.entities[0].bar).toEqual(legacy.entities[0].bar);
    expect(grouped.bar.paint).toEqual({ ...flatPaint(legacy.bar), opacity: 100 });
  });
}

it('resolves each property by entity scope first and grouped fields before same-scope aliases', () => {
  const config = normalize({ paint: { color: 'red', fill_style: 'gradient', solid_fill: true, segments, gradient_stops, opacity: 30 } }, {
    color: 'yellow', bar: { color: 'blue', solid_fill: true, paint: { solid_fill: false, opacity: 0, segments: [] } },
  });
  expect(config.entities[0].bar.paint).toEqual({ color: 'blue', fill_style: 'gradient', solid_fill: false,
    segments: [], gradient_stops: config.bar.gradient_stops, opacity: 0 });
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({ color: 'bar.color', solid_fill: 'bar.paint.solid_fill',
    opacity: 'bar.paint.opacity', segments: 'bar.paint.segments' });
  const local = normalize({ color: 'black' }, { color: 'yellow', bar: { color: 'blue', paint: { color: 'red' } } });
  expect(local.entities[0].bar.color).toBe('red');
});

it('keeps omitted and empty grouped paint equivalent, including color-only inference and explicitness', () => {
  for (const bar of [{}, { color: 'red' }, { color: 'red', solid_fill: false }, { fill_style: 'gradient' }]) {
    const omitted = normalize(bar, { bar: { color: 'blue' } });
    const empty = normalize({ ...bar, paint: {} }, { bar: { color: 'blue', paint: {} } });
    expect(empty).toEqual(omitted);
    expect(empty.bar.paint[PAINT_PROPERTY_SOURCES]).toEqual(omitted.bar.paint[PAINT_PROPERTY_SOURCES]);
  }
  expect(normalize({ paint: { color: 'red', opacity: 50 } }).bar.fill_style).toBe('solid');
  expect(normalize({ paint: { color: 'red' } }, { bar: { color: 'blue' } }).entities[0].bar.fill_style).toBe('solid');
  expect(normalize({ paint: { fill_style: 'gradient' } }, { bar: { paint: { color: 'blue' } } }).entities[0].bar.fill_style).toBe('gradient');
});

it.each([null, false, 'red', []])('records invalid grouped container %j without making it authoritative', paint => {
  const config = normalize({ color: 'red', paint });
  expect(config.bar.color).toBe('red');
  expect(config.bar.fill_style).toBe('solid');
  expect(config.bar[BAR_PAINT_DIAGNOSTICS]).toContainEqual(expect.objectContaining({ kind: 'invalid', property: null, input: paint }));
  expect(validateNormalizedConfig(config).warnings).toContainEqual(expect.objectContaining({ code: 'paint.invalid_value', path: 'card.bar.paint' }));
});

it.each([
  ['color', null], ['color', false], ['color', ''], ['fill_style', null], ['fill_style', 'invalid'],
  ['solid_fill', null], ['solid_fill', 'false'], ['segments', null], ['segments', {}],
  ['segments', [{ from: 'sensor.unsupported', color: 'red' }]],
  ['gradient_stops', null], ['gradient_stops', [{ pos: 'invalid', color: 'red' }]],
])('invalid grouped %s=%j falls back property by property', (property, input) => {
  const legacy = { color: 'red', fill_style: 'gradient', solid_fill: true, segments, gradient_stops };
  const config = normalize({ ...legacy, paint: { [property]: input } });
  expect(flatPaint(config.bar)).toEqual(flatPaint(normalize(legacy).bar));
  expect(config.bar[BAR_PAINT_DIAGNOSTICS]).toContainEqual(expect.objectContaining({ kind: 'invalid', property, input }));
});

it('falls through null grouped color to the local legacy alias before inherited grouped color', () => {
  const config = normalize({ paint: { color: 'red' } }, { color: 'blue', bar: { paint: { color: null } } });
  expect(config.entities[0].bar.color).toBe('blue');
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES].color).toBe('color');
  const inherited = normalize({ paint: { color: 'red' } }, { bar: { paint: { color: null } } });
  expect(inherited.entities[0].bar.color).toBe('red');
  expect(inherited.entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({});
});

it.each([false, 0, 100, ' 50.5 ', null, '', 101])('preserves opacity handling for %j independently from other paint', opacity => {
  const config = normalize({ paint: { opacity: 35 } }, { bar: { paint: { color: 'blue', opacity } } });
  const paint = config.entities[0].bar.paint;
  const valid = [0, 100, ' 50.5 '].includes(opacity);
  expect(paint.opacity).toBe(valid ? Number(opacity) : 100);
  expect(paint.color).toBe('blue');
  expect(Object.hasOwn(paint, INVALID_PAINT_OPACITY)).toBe(!valid);
  if (!valid) expect(paint[INVALID_PAINT_OPACITY]).toBe(opacity);
});

it('inherits opacity and its private invalid input only until explicitly overridden', () => {
  const config = normalize({ paint: { opacity: null } });
  expect(config.entities[0].bar.paint[INVALID_PAINT_OPACITY]).toBeNull();
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({});
  const overridden = normalize({ paint: { opacity: null } }, { bar: { paint: { opacity: 100 } } });
  expect(Object.hasOwn(overridden.entities[0].bar.paint, INVALID_PAINT_OPACITY)).toBe(false);
});

it('retains explicit false and empty palettes without erasing unrelated paint', () => {
  const config = normalize({ paint: { solid_fill: true, segments, gradient_stops } }, { bar: { paint: { solid_fill: false, segments: [], gradient_stops: [] } } });
  expect(config.entities[0].bar.paint).toMatchObject({ solid_fill: false, segments: [], gradient_stops: [] });
});

it('preserves raw legacy alias ordering and percentage provenance for replacement grouped Segments', () => {
  const config = normalizeCardConfig({ entity, scale: { min: -20, max: 100 }, severity: [{ from: 0, to: 100, color: 'red' }],
    entities: [{ entity, bar: { paint: { segments: [{ from: 25, to: 75, color: 'blue' }] } } }] });
  expect(config.bar.segment_space).toBe('percent');
  expect(config.entities[0].bar.segments[0].from).toEqual({ fixed: 25, entity: null });
  const compatibility = normalize({ segment_space: 'percent' }, { bar: { paint: { segments: [{ from: 25, to: 75, color: 'blue' }] } } });
  expect(compatibility.entities[0].bar.segments[0].from.percent).toBe(25);
  const aliases = normalizeCardConfig({ entities: [{ entity, severity: [{ from: 0, to: 100, color: 'red' }],
    segments: [{ from: -20, to: 100, color: 'blue' }], bar: { paint: {}, segments: [] } }] });
  expect(aliases.entities[0].bar.segments).toEqual([]);
});

it('does not mutate frozen input and retains unknown grouped fields without resolving them', () => {
  const paint = Object.freeze({ color: 'red', extra: Object.freeze({ keep: true }) });
  const bar = Object.freeze({ direction: 'reverse', needle: true, animated: false, paint });
  const row = Object.freeze({ entity, bar: Object.freeze({ paint: Object.freeze({ solid_fill: false }) }) });
  const raw = Object.freeze({ bar, entities: Object.freeze([row]), extra: true });
  const config = normalizeCardConfig(raw);
  expect(config.bar.paint.extra).toEqual({ keep: true });
  expect(config.entities[0].bar.paint.extra).toEqual({ keep: true });
  expect(config.bar).toMatchObject({ direction: 'reverse', needle: { show: true }, animated: false });
  expect(raw.bar.paint).toBe(paint);
  expect(Object.keys(paint)).toEqual(['color', 'extra']);
  expect(JSON.stringify(config)).not.toContain('bar-paint');
  expect(Object.getOwnPropertyDescriptor(config.bar.paint, PAINT_PROPERTY_SOURCES).enumerable).toBe(false);
});

it('keeps diagnostic ownership at its authored scope rather than duplicating inherited errors', () => {
  const config = normalize({ color: 'red', paint: { color: null } }, { bar: { paint: { fill_style: null } } });
  const warnings = validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'paint.invalid_value');
  expect(warnings.map(warning => warning.path)).toEqual(['card.bar.paint.color', 'entities[0].bar.paint.fill_style']);
});

it('preserves direct bar normalization and legacy-only values through the canonical paint compatibility fields', () => {
  const bar = normalizeBarConfig({ bar: { color: 'red', fill_style: 'gradient', segments: [], solid_fill: false } });
  expect(bar.paint).toEqual({ color: 'red', fill_style: 'gradient', solid_fill: false, segments: [], gradient_stops: null, opacity: 100 });
  expect(bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({ color: 'bar.color', fill_style: 'bar.fill_style', solid_fill: 'bar.solid_fill', segments: 'bar.segments' });
});

it('normalizes grouped palettes from a raw inherited scope for direct callers', () => {
  const inherited = normalizeBarConfig({}, { bar: { paint: { segments, opacity: '50' } } });
  expect(inherited.segments).toEqual(normalizeBarConfig({ bar: { segments } }).segments);
  expect(inherited.paint.opacity).toBe(50);
  expect(inherited.paint[PAINT_PROPERTY_SOURCES]).toEqual({});
  const localMode = normalizeBarConfig({ bar: { segment_space: 'percent' } }, { bar: { paint: { segments: [{ from: 25, to: 75, color: 'red' }] } } });
  expect(localMode.segments[0].from).toEqual({ fixed: 25, entity: null });
});

it('treats undefined grouped properties as omitted and removes overrides by property deletion', () => {
  const parent = { paint: { color: 'red', fill_style: 'gradient', opacity: 30 } };
  const config = normalize(parent, { bar: { paint: { color: undefined, fill_style: undefined, opacity: undefined } } });
  expect(config.entities[0].bar.paint).toMatchObject({ color: 'red', fill_style: 'gradient', opacity: 30 });
  expect(config.entities[0].bar[BAR_PAINT_DIAGNOSTICS]).toBeUndefined();
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({});
  const row = { entity, bar: { paint: { color: 'blue', solid_fill: false } } };
  expect(normalize(parent, row).entities[0].bar.paint.color).toBe('blue');
  delete row.bar.paint.color;
  expect(normalize(parent, row).entities[0].bar.paint).toMatchObject({ color: 'red', solid_fill: false });
  expect(normalize(parent, row).entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({ solid_fill: 'bar.paint.solid_fill' });
});

it('does not reinterpret unsupported flat opacity or unknown nested settings as paint overrides', () => {
  const config = normalize({ opacity: 50, paint: { color: 'red', preset: 'future-name' } });
  expect(config.bar.paint.opacity).toBe(100);
  expect(config.bar.paint.preset).toBe('future-name');
  expect(config.bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({ color: 'bar.paint.color', preset: 'bar.paint.preset' });
});

it('records same-scope grouped/legacy conflicts without mistaking injected defaults for authored aliases', () => {
  expect(normalize({ paint: { color: 'red', fill_style: 'gradient' } }).bar[BAR_PAINT_DIAGNOSTICS]).toBeUndefined();
  const config = normalize({ color: 'blue', paint: { color: 'red' } }, { color: 'yellow' });
  const conflicts = validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'paint.legacy_conflict');
  expect(conflicts.map(warning => warning.path)).toEqual(['card.bar.paint.color']);
  expect(config.entities[0].bar.color).toBe('yellow');
});

it('skips malformed legacy candidates when an invalid grouped property requests the next valid fallback', () => {
  const config = normalize({ paint: { color: 'red', fill_style: 'gradient' } }, {
    color: 'blue', bar: { color: false, fill_style: 'invalid', paint: { color: null, fill_style: null } },
  });
  expect(config.entities[0].bar.paint).toMatchObject({ color: 'blue', fill_style: 'gradient' });
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({ color: 'color' });
  const fallback = normalize({ color: false }, { bar: { color: 0, paint: { color: null } } });
  expect(fallback.entities[0].bar.color).toBe('#4a9eff');
  // Without grouped input the released malformed-value handling is unchanged.
  expect(normalize({ color: false }, { bar: { color: 0 } }).entities[0].bar.color).toBe(0);
});

it.each([123, true, {}, [], '   '].map(color => [color]))('rejects invalid Severity color %j before falling back to inherited grouped Segments', color => {
  const parentSegments = Object.freeze([Object.freeze({ from: 0, to: 100, color: '#123456' })]);
  const severity = Object.freeze([Object.freeze({ from: 0, to: 100, color })]);
  const raw = Object.freeze({ bar: Object.freeze({ paint: Object.freeze({ segments: parentSegments }) }),
    entities: Object.freeze([Object.freeze({ entity, severity, bar: Object.freeze({ paint: Object.freeze({ segments: null }) }) })]) });
  const config = normalizeCardConfig(raw);
  expect(config.entities[0].bar.segments).toEqual(config.bar.segments);
  expect(config.entities[0].bar.paint.segments).toEqual(config.bar.paint.segments);
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES].segments).toBeUndefined();
  expect(config.entities[0].bar.fill_style).toBe('bands');
  expect(raw.entities[0].severity[0].color).toBe(color);
  // The invalid-grouped-input fallback is the only path whose acceptance changes.
  const legacy = normalizeCardConfig({ entities: [{ entity, severity }] });
  expect(legacy.entities[0].bar.segments[0].color).toBe(color);
  expect(legacy.entities[0].bar.segment_space).toBe('percent');
});

it('retains valid Severity fallback colors and their percentage coordinates', () => {
  const severity = [{ from: 0, to: 100, color: 'var(--accent-color)' }];
  const config = normalize({ paint: { segments } }, { severity, bar: { paint: { segments: null } } });
  expect(config.entities[0].bar.segments).toEqual([{ ...severity[0], label: null }]);
  expect(config.entities[0].bar.segment_space).toBe('percent');
  expect(config.entities[0].bar.paint[PAINT_PROPERTY_SOURCES].segments).toBe('severity');
});

describe('grouped palette diagnostic provenance', () => {
  const duplicateStops = [{ pos: 50, color: 'red' }, { pos: 50, color: 'blue' }];
  const duplicateWarnings = config => validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'duplicate-gradient-stop-position');

  it('reports an inherited grouped Gradient once at the authored card stop path', () => {
    const config = normalizeCardConfig({ bar: { paint: { gradient_stops: duplicateStops } },
      entities: [entity, 'sensor.second', { entity: 'sensor.third', bar: { paint: { color: 'red', gradient_stops: null } } }] });
    expect(duplicateWarnings(config)).toEqual([expect.objectContaining({ path: 'card.bar.paint.gradient_stops[1]', entity: null })]);
    expect(validateNormalizedConfig(config).warnings).toContainEqual(expect.objectContaining({ code: 'paint.invalid_value', path: 'entities[2].bar.paint.gradient_stops' }));
  });

  it('keeps independently authored grouped Gradient diagnostics even for identical palette values', () => {
    const config = normalizeCardConfig({ bar: { paint: { gradient_stops: duplicateStops } }, entities: [
      { entity, bar: { paint: { gradient_stops: duplicateStops } } },
      { entity: 'sensor.second', bar: { paint: { gradient_stops: structuredClone(duplicateStops) } } },
      'sensor.inherits',
    ] });
    expect(duplicateWarnings(config).map(({ path, entity }) => ({ path, entity }))).toEqual([
      { path: 'card.bar.paint.gradient_stops[1]', entity: null },
      { path: 'entities[0].bar.paint.gradient_stops[1]', entity },
      { path: 'entities[1].bar.paint.gradient_stops[1]', entity: 'sensor.second' },
    ]);
  });

  it('preserves legacy Gradient paths and inherited warning behavior', () => {
    const config = normalizeCardConfig({ gradient_stops: duplicateStops, entities: [entity, 'sensor.second'] });
    expect(duplicateWarnings(config).map(warning => warning.path)).toEqual([
      'card.bar.gradient_stops[1]', 'entities[0].bar.gradient_stops[1]', 'entities[1].bar.gradient_stops[1]',
    ]);
    const mixed = normalizeCardConfig({ bar: { paint: { gradient_stops: duplicateStops } }, entities: [
      { entity, gradient_stops: duplicateStops }, 'sensor.inherits',
    ] });
    expect(duplicateWarnings(mixed).map(warning => warning.path)).toEqual([
      'card.bar.paint.gradient_stops[1]', 'entities[0].bar.gradient_stops[1]',
    ]);
  });

  it('reports scale-independent Segment errors once per authored grouped palette', () => {
    const inverted = [{ from: 80, to: 20, color: 'red' }];
    const config = normalizeCardConfig({ bar: { paint: { segments: inverted } }, entities: [
      entity, { entity: 'sensor.second', bar: { paint: { segments: inverted } } },
    ] });
    expect(validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'segments.from_gt_to').map(warning => warning.path))
      .toEqual(['card.bar.paint.segments[0]', 'entities[1].bar.paint.segments[0]']);
    const overlap = normalizeCardConfig({ bar: { paint: { segments: [
      { from: 0, to: 60, color: 'red' }, { from: 50, to: 90, color: 'blue' },
    ] } }, entities: [entity, 'sensor.second'] });
    expect(validateNormalizedConfig(overlap).warnings.filter(warning => warning.code === 'segments.overlap').map(warning => warning.path))
      .toEqual(['card.bar.paint.segments[1]']);
  });

  it('allows reusable Paint Segment ranges to extend beyond card and entity Scales', () => {
    const config = normalizeCardConfig({ bar: { paint: { segments: [{ from: 10, to: 90, color: 'red' }] } }, entities: [
      entity, { entity: 'sensor.narrow', scale: { min: 0, max: 50 } },
      { entity: 'sensor.override', scale: { min: 0, max: 50 }, bar: { paint: { segments: [{ from: 10, to: 90, color: 'blue' }] } } },
    ] });
    expect(validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'segments.outside_scale')).toEqual([]);
    expect(config.entities[1].bar.paint.segments).toEqual(config.bar.paint.segments);
    expect(config.entities[2].bar.paint.segments).toMatchObject([{ from: { fixed: 10 }, to: { fixed: 90 }, color: 'blue' }]);
    expect(config.entities[1].bar.paint[PAINT_PROPERTY_SOURCES]).toEqual({});
  });

  it('preserves legacy Segment paths and inherited validation behavior', () => {
    const config = normalizeCardConfig({ bar: { segments: [{ from: 80, to: 20, color: 'red' }] }, entities: [entity] });
    expect(validateNormalizedConfig(config).warnings.filter(warning => warning.code === 'segments.from_gt_to').map(warning => warning.path))
      .toEqual(['card.bar.segments[0]', 'entities[0].bar.segments[0]']);
  });
});
