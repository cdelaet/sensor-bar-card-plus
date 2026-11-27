import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { compilePaint, getSegmentsForRendering } from '../../src/view-model/paint-compiler.js';
import { resolvePaintPreset, resolveScopedPaintPreset } from '../../src/view-model/paint-preset-resolver.js';

const registryWith = (presets, conflicts = {}) => ({ presets, conflicts });

const inherited = Object.freeze({
  fill_style: 'bands', color: '#112233', solid_fill: false, opacity: 40,
  segments: Object.freeze([Object.freeze({ from: 0, to: 100, color: '#112233' })]),
});

describe('pure dashboard paint preset resolution', () => {
  it('resolves a named preset into canonical paint without carrying the reference', () => {
    const definition = Object.freeze({
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: Object.freeze([
        Object.freeze({ pos: 0, color: '#000000' }), Object.freeze({ pos: 100, color: '#ffffff' }),
      ]),
    });
    const result = resolvePaintPreset({ paint: { preset: 'thermal' }, registry: registryWith({ thermal: definition }) });

    expect(result).toMatchObject({ source: 'preset', diagnostics: [] });
    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#112233', opacity: 100 });
    expect(result.paint).not.toHaveProperty('preset');
    expect(compilePaint(result.paint, { samplePercent: 25 }).gradient)
      .toBe('linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)');
  });

  it('applies explicit local fields over a preset while preserving the other paint properties', () => {
    const definition = {
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 100, color: '#abcdef' }],
      opacity: 55,
    };
    const result = resolvePaintPreset({
      paint: { preset: 'thermal', color: '#ff0000', opacity: 0 }, registry: registryWith({ thermal: definition }),
    });

    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#ff0000', opacity: 0 });
    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toMatchObject([{ from: { fixed: 0, entity: null }, to: { fixed: 100, entity: null },
      color: '#abcdef', label: null }]);
    expect(compilePaint(result.paint, { samplePercent: 25 }).gradient)
      .toBe('linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)');
  });

  it('uses default opacity when a selected preset omits opacity', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'plain' }, registry: registryWith({ plain: { fill_style: 'solid', color: '#abcdef' } }),
      inheritedPaint: inherited,
    });
    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#abcdef', opacity: 100 });
  });

  it('treats an undefined preset opacity as omitted', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'plain' },
      registry: registryWith({ plain: { fill_style: 'solid', color: '#abcdef', opacity: undefined } }),
      inheritedPaint: inherited,
    });
    expect(result.paint.opacity).toBe(100);
  });

  it('uses standard defaults for every property omitted by a preset, rather than inherited values', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'plain' }, registry: registryWith({ plain: { fill_style: 'solid', color: '#abcdef' } }),
      inheritedPaint: { ...inherited, solid_fill: true, opacity: 42,
        gradient_stops: [{ pos: 0, color: '#111111' }, { pos: 100, color: '#222222' }] },
    });

    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#abcdef', solid_fill: false, opacity: 100 });
    expect(result.paint.segments).toHaveLength(3);
    expect(getSegmentsForRendering(result.paint)).toHaveLength(3);
    expect(result.paint.gradient_stops).toBeNull();
  });

  it.each([{}, { fill_style: 'bands' }, { opacity: 60 }])(
    'keeps omitted preset segments renderable for %j', definition => {
      const result = resolvePaintPreset({ paint: { preset: 'plain' }, registry: registryWith({ plain: definition }) });

      expect(result.paint.fill_style).toBe('bands');
      expect(result.paint.segments).toHaveLength(3);
      expect(compilePaint(result.paint).gradient).toMatch(/^linear-gradient/);
    },
  );

  it('preserves an explicitly empty preset segment list', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'empty' }, registry: registryWith({ empty: { fill_style: 'bands', segments: [] } }),
    });

    expect(result.paint.segments).toEqual([]);
    expect(getSegmentsForRendering(result.paint)).toEqual([]);
    expect(compilePaint(result.paint).gradient).toBeNull();
  });

  it('uses a renderable standard palette when the unresolved preset has no inherited paint', () => {
    const result = resolvePaintPreset({ paint: { preset: 'missing' }, registry: registryWith({}) });

    expect(result.source).toBe('default');
    expect(result.paint.segments).toHaveLength(3);
    expect(compilePaint(result.paint).gradient).toMatch(/^linear-gradient/);
  });

  it.each([[0, 0], [100, 100], [37.5, 37.5], ['42.25', 42.25]])(
    'uses authored preset opacity %s and keeps raw/canonical resolution in parity', (opacity, expected) => {
      const paint = { preset: 'fade' };
      const registry = registryWith({ fade: { fill_style: 'gradient', color: 'rgb(20 40 60 / 50%)', opacity } });
      const raw = resolvePaintPreset({ paint, registry, inheritedPaint: inherited });
      const canonical = resolvePaintPreset({ paint, registry, inheritedPaint: inherited, canonicalPaint: true });

      expect(raw.paint.opacity).toBe(expected);
      expect(canonical.paint).toEqual(raw.paint);
      expect(raw.paint.fill_style).toBe('gradient');
      expect(raw.paint.color).toBe('rgb(20 40 60 / 50%)');
      expect(raw.diagnostics).toEqual([]);
    },
  );

  it('uses explicit local opacity before the preset opacity', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'fade', opacity: '12.5' },
      registry: registryWith({ fade: { fill_style: 'gradient', color: '#abcdef', opacity: 55 } }),
      inheritedPaint: inherited,
    });
    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#abcdef', opacity: 12.5 });
  });

  it('recovers invalid local opacity without discarding the selected preset', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'fade', opacity: 'invalid' },
      registry: registryWith({ fade: { fill_style: 'gradient', color: '#abcdef', opacity: 55 } }),
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('preset');
    expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#abcdef', opacity: 100 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_opacity_invalid', path: 'paint.opacity', reference: 'fade', fallback: 'default_opacity',
    }));
  });

  it.each([['invalid', 100], [101, 100], [-1, 100]])(
    'recovers invalid preset opacity %j without discarding its valid paint', (opacity, expected) => {
      const result = resolvePaintPreset({
        paint: { preset: 'fade' },
        registry: registryWith({ fade: { fill_style: 'gradient', color: '#abcdef',
          gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#654321' }], opacity } }),
        inheritedPaint: inherited,
      });

      expect(result.source).toBe('preset');
      expect(result.paint).toMatchObject({ fill_style: 'gradient', color: '#abcdef', opacity: expected });
      expect(result.paint.gradient_stops).toHaveLength(2);
      expect(result.diagnostics).toContainEqual(expect.objectContaining({
        code: 'paint_opacity_invalid', path: 'paint.opacity', reference: 'fade', fallback: 'default_opacity',
      }));
      expect(result.diagnostics.some(diagnostic => diagnostic.code === 'paint_preset_invalid')).toBe(false);
    },
  );

  it('merges ordinary local paint fields property by property over inherited paint', () => {
    const result = resolvePaintPreset({ paint: { color: '#ff0000', opacity: 65 }, inheritedPaint: inherited });
    expect(result).toMatchObject({ source: 'inherited', diagnostics: [] });
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#ff0000', opacity: 65 });
    expect(result.paint.segments).toMatchObject([{ from: { fixed: 0 }, to: { fixed: 100 }, color: '#112233' }]);
  });

  it('uses normalized source metadata to resolve card and entity paint layers without default leakage', () => {
    const normalized = normalizeCardConfig({
      entities: [{ entity: 'sensor.power', bar: { paint: { color: '#ff0000' } } }],
      bar: { paint: { preset: 'thermal', opacity: 35 } },
    });
    const result = resolveScopedPaintPreset({
      inheritedPaint: normalized.bar.paint,
      paint: normalized.entities[0].bar.paint,
      registry: registryWith({ thermal: { fill_style: 'solid', color: '#123456' } }),
    });

    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#ff0000', opacity: 35 });
    expect(result.paint).not.toHaveProperty('preset');
    expect(result.diagnostics).toEqual([]);
  });

  it('distinguishes omitted, null and named Entity references and preserves manual properties under None', () => {
    const normalized = normalizeCardConfig({
      bar: { paint: { preset: 'card', color: '#334455' } },
      entities: [
        { entity: 'sensor.omitted' },
        { entity: 'sensor.none', bar: { paint: { preset: null, opacity: 65 } } },
        { entity: 'sensor.named', bar: { paint: { preset: 'child' } } },
      ],
    });
    const registry = registryWith({
      card: { fill_style: 'gradient', color: '#ee0000', opacity: 40,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
      child: { fill_style: 'solid', color: '#abcdef', opacity: 20 },
    });
    const resolve = index => resolveScopedPaintPreset({
      inheritedPaint: normalized.bar.paint,
      paint: normalized.entities[index].bar.paint,
      registry,
    });
    const omitted = resolve(0);
    const none = resolve(1);
    const named = resolve(2);

    expect(omitted.paint).toMatchObject({ fill_style: 'gradient', color: '#334455', opacity: 40 });
    expect(omitted.paint.gradient_stops).toHaveLength(2);
    expect(none.paint).toMatchObject({ fill_style: 'solid', color: '#334455', opacity: 65 });
    expect(none.paint.gradient_stops).toBeNull();
    expect(none.diagnostics).toEqual([]);
    expect(named.paint).toMatchObject({ fill_style: 'solid', color: '#abcdef', opacity: 20 });
  });

  it('does not inherit Card preset properties when Entity selects another preset', () => {
    const normalized = normalizeCardConfig({
      bar: { paint: { preset: 'card' } },
      entities: [{ entity: 'sensor.power', bar: { paint: { preset: 'entity' } } }],
    });
    const registry = registryWith({
      card: { fill_style: 'solid', color: '#123456', opacity: 28 },
      entity: { fill_style: 'gradient', color: '#abcdef' },
      opaque: { fill_style: 'gradient', color: '#fedcba', opacity: 72 },
    });
    const inherited = resolveScopedPaintPreset({ inheritedPaint: normalized.bar.paint, paint: {}, registry });
    const child = resolvePaintPreset({
      paint: { preset: 'entity' }, inheritedPaint: inherited.paint, registry,
    });
    const explicitChild = resolvePaintPreset({
      paint: { preset: 'opaque' }, inheritedPaint: inherited.paint, registry,
    });

    expect(inherited.paint.opacity).toBe(28);
    expect(child.paint.opacity).toBe(100);
    expect(explicitChild.paint.opacity).toBe(72);
  });

  it.each([
    ['fill_style', 'solid'],
    ['color', '#445566'],
    ['solid_fill', true],
    ['segments', [{ from: '0%', to: '100%', color: '#445566' }]],
    ['gradient_stops', [{ pos: 0, color: '#445566' }, { pos: 100, color: '#abcdef' }]],
    ['opacity', 60],
  ])('applies a local %s override over a complete preset without changing other properties', (property, value) => {
    const definition = {
      fill_style: 'gradient', color: '#123456', solid_fill: false, opacity: 35,
      segments: [{ from: '0%', to: '100%', color: '#123456' }],
      gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }],
    };
    const expected = resolvePaintPreset({ paint: { preset: 'thermal' }, registry: registryWith({ thermal: definition }) }).paint;
    const actual = resolvePaintPreset({ paint: { preset: 'thermal', [property]: value },
      registry: registryWith({ thermal: definition }), inheritedPaint: inherited }).paint;

    expect(actual[property]).toEqual(property === 'segments'
      ? expect.arrayContaining([expect.objectContaining({ color: '#445566' })])
      : property === 'gradient_stops' ? value : value);
    for (const key of ['fill_style', 'color', 'solid_fill', 'segments', 'gradient_stops', 'opacity']) {
      if (key === property) continue;
      expect(actual[key]).toEqual(expected[key]);
    }
  });

  it('preserves normalized ordinary paint when no preset reference is present', () => {
    const normalized = normalizeCardConfig({ entities: [{ entity: 'sensor.power' }] });
    const result = resolveScopedPaintPreset({
      inheritedPaint: normalized.bar.paint,
      paint: normalized.entities[0].bar.paint,
      registry: { status: 'loading', presets: {} },
    });

    expect(result.paint.color).toBe(normalized.bar.paint.color);
    expect(result.paint.fill_style).toBe(normalized.bar.paint.fill_style);
    expect(compilePaint(result.paint, { samplePercent: 35 }))
      .toEqual(compilePaint(normalized.bar.paint, { samplePercent: 35 }));
    expect(result.diagnostics).toEqual([]);
  });

  it.each([[0, 200], [-100, 300]])('keeps normalized default percentage bands canonical at Scale %s–%s', (minValue, maxValue) => {
    const normalized = normalizeCardConfig({
      scale: { min: minValue, max: maxValue },
      bar: { paint: { preset: 'missing' } },
      entities: [{ entity: 'sensor.power' }],
    });
    const before = getSegmentsForRendering(normalized.bar.paint, minValue, maxValue);
    const resolved = resolveScopedPaintPreset({
      inheritedPaint: normalized.bar.paint,
      paint: normalized.entities[0].bar.paint,
      registry: registryWith({}),
    });

    expect(before.map(segment => [segment.from, segment.to])).toEqual([[0, 33], [33, 75], [75, 100]]);
    expect(getSegmentsForRendering(resolved.paint, minValue, maxValue)).toEqual(before);
    expect(resolved.diagnostics).toContainEqual(expect.objectContaining({ code: 'paint_preset_missing' }));
  });

  it('preserves canonical percentage and absolute coordinates plus normalized gradient stops', () => {
    const normalized = normalizeCardConfig({
      scale: { min: 0, max: 200 },
      bar: { paint: { preset: 'missing', fill_style: 'bands', segments: [
        { from: '33%', to: '75%', color: '#112233' },
        { from: 100, to: 150, color: '#abcdef' },
      ], gradient_stops: [{ pos: '33%', color: '#112233' }, { pos: '75%', color: '#abcdef' }] } },
      entities: [{ entity: 'sensor.power' }],
    });
    const before = normalized.bar.paint;
    const resolved = resolveScopedPaintPreset({
      inheritedPaint: before,
      paint: normalized.entities[0].bar.paint,
      registry: registryWith({}),
    });

    expect(resolved.paint.segments).toEqual(before.segments);
    expect(resolved.paint.gradient_stops).toEqual(before.gradient_stops);
    expect(getSegmentsForRendering(resolved.paint, 0, 200)).toEqual(getSegmentsForRendering(before, 0, 200));
  });

  it.each([
    ['solid', '#112233', 'linear-gradient(to right,#112233 0%,#112233 100%)'],
    ['gradient', 'rgb(64,64,64)', 'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)'],
    ['bands', '#000000', 'linear-gradient(to right, #000000 0%, #000000 50%, #ffffff 50%, #ffffff 100%)'],
    ['soft_bands', 'rgb(0,0,0)', 'linear-gradient(to right, #000000 0%, #000000 49.25%, #ffffff 50.75%, #ffffff 100%)'],
    ['band_gradient', 'rgb(64,64,64)', 'linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)'],
  ])('preserves and compiles %s preset properties using its effective style', (fill_style, color, gradient) => {
    const definition = {
      fill_style, color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 50, color: '#000000' }, { from: 50, to: 100, color: '#ffffff' }],
    };
    const result = resolvePaintPreset({ paint: { preset: 'paint' }, registry: registryWith({ paint: definition }) });

    expect(result.paint.fill_style).toBe(fill_style);
    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toHaveLength(2);
    expect(compilePaint(result.paint, { samplePercent: 25 })).toEqual({ color, gradient });
  });

  it('preserves both preset collections when switching styles and compiles only the selected style', () => {
    const definition = {
      fill_style: 'gradient', color: '#112233', solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      segments: [{ from: 0, to: 100, color: '#abcdef' }],
    };
    const result = resolvePaintPreset({
      paint: { preset: 'paint', fill_style: 'solid', color: '#ff0000' }, registry: registryWith({ paint: definition }),
    });

    expect(result.paint.gradient_stops).toEqual(definition.gradient_stops);
    expect(result.paint.segments).toHaveLength(1);
    expect(compilePaint(result.paint, { samplePercent: 50 })).toEqual({
      color: '#ff0000', gradient: 'linear-gradient(to right,#ff0000 0%,#ff0000 100%)',
    });
  });

  it('retains full-Scale fixed and percentage anchors through resolution', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'anchored' },
      registry: registryWith({ anchored: {
        fill_style: 'bands', color: '#112233',
        segments: [
          { from: { fixed: 100 }, to: { fixed: 200 }, color: 'red' },
          { from: { percent: 60 }, to: { percent: 90 }, color: 'blue' },
        ],
      } }),
    });

    expect(getSegmentsForRendering(result.paint, 0, 400)).toEqual([
      { from: 25, to: 50, color: 'red', label: null },
      { from: 60, to: 90, color: 'blue', label: null },
    ]);
    expect(compilePaint(result.paint, { minValue: 0, maxValue: 400, samplePercent: 35, scaleDirection: 'reverse' })).toEqual({
      color: 'red', gradient: 'linear-gradient(to right, blue 10%, blue 40%, red 50%, red 75%)',
    });
  });

  it('falls back to valid inherited paint for a missing preset and identifies the reference', () => {
    const result = resolvePaintPreset({ paint: { preset: 'absent' }, registry: registryWith({}), inheritedPaint: inherited });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 40 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_missing', path: 'paint.preset', reference: 'absent', fallback: 'inherited',
    }));
  });

  it('falls back to inherited paint and reports a conflict instead of a missing preset', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'Thermal' }, registry: registryWith({ Energy: { fill_style: 'solid', color: 'green' } }, { Thermal: 2 }),
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 40 });
    expect(result.diagnostics).toEqual([expect.objectContaining({
      code: 'paint_preset_conflict', path: 'paint.preset', reference: 'Thermal', fallback: 'inherited',
    })]);
    expect(result.diagnostics.some(diagnostic => diagnostic.code === 'paint_preset_missing')).toBe(false);
  });

  it('uses default paint for a conflict when no valid inherited paint exists', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'Thermal' }, registry: registryWith({}, { Thermal: 3 }), themeAccent: '#123456',
    });
    expect(result.source).toBe('default');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#123456', opacity: 100 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_conflict', reference: 'Thermal', fallback: 'default',
    }));
  });

  it('resolves a unique preset while another name is conflicted', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'Energy' },
      registry: registryWith({ Energy: { fill_style: 'solid', color: '#abcdef' } }, { Thermal: 2 }),
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('preset');
    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#abcdef' });
    expect(result.diagnostics).toEqual([]);
  });

  it('checks conflicts with own-property lookup for the reserved __proto__ name', () => {
    const conflicts = JSON.parse('{"__proto__":2}');
    const result = resolvePaintPreset({ paint: { preset: '__proto__' }, registry: registryWith({}, conflicts), inheritedPaint: inherited });
    expect(result.source).toBe('inherited');
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_conflict', reference: '__proto__', fallback: 'inherited',
    }));
    expect(Object.getPrototypeOf(conflicts)).toBe(Object.prototype);
  });

  it('waits for the registry before reporting a preset as missing', () => {
    const result = resolvePaintPreset({ paint: { preset: 'pending' }, registry: { status: 'loading', presets: {}, conflicts: { pending: 2 } } });
    expect(result.diagnostics).toEqual([]);
    expect(result.source).toBe('default');
  });

  it('preserves registry-unavailable behavior ahead of conflict lookup', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'Thermal' },
      registry: { status: 'error', diagnostic: { code: 'dashboard_config_unavailable' }, presets: {}, conflicts: { Thermal: 2 } },
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('inherited');
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_registry_unavailable', reference: 'Thermal', fallback: 'inherited',
    }));
    expect(result.diagnostics.some(diagnostic => diagnostic.code === 'paint_preset_conflict')).toBe(false);
  });

  it.each([
    ['not an object', 'paint_preset_invalid'],
    [{ future: true, color: '#123456' }, 'paint_preset_invalid'],
    [{ fill_style: 'unknown', color: '#123456' }, 'paint_preset_invalid'],
  ])('uses inherited paint and diagnoses invalid preset definitions: %j', (definition, code) => {
    const result = resolvePaintPreset({ paint: { preset: 'broken' }, registry: registryWith({ broken: definition }), inheritedPaint: inherited });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 40 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code, path: 'paint.preset', reference: 'broken', fallback: 'inherited',
    }));
  });

  it('falls back from a malformed local override while keeping independent opacity', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'valid', fill_style: 'unknown', opacity: 0 },
      registry: registryWith({ valid: { fill_style: 'solid', color: '#abcdef' } }),
      inheritedPaint: inherited,
    });
    expect(result.source).toBe('inherited');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: '#112233', opacity: 0 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_definition_invalid', path: 'paint.preset', reference: 'valid', fallback: 'inherited',
    }));
  });

  it('uses the theme-accent default when neither the preset nor inherited paint is valid', () => {
    const result = resolvePaintPreset({
      paint: { preset: 'missing' }, registry: registryWith({}), inheritedPaint: { fill_style: 'bad' },
      themeAccent: 'var(--accent-color)',
    });
    expect(result.source).toBe('default');
    expect(result.paint).toMatchObject({ fill_style: 'bands', color: 'var(--accent-color)', opacity: 100 });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_missing', reference: 'missing', fallback: 'default',
    }));
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'inherited_paint_invalid', fallback: 'default',
    }));
  });

  it('re-resolves changed registry definitions without retaining stale paint', () => {
    const paint = { preset: 'active' };
    const first = resolvePaintPreset({ paint, registry: registryWith({ active: { fill_style: 'solid', color: 'red' } }) });
    const second = resolvePaintPreset({ paint, registry: registryWith({ active: { fill_style: 'solid', color: 'blue' } }) });
    expect(first.paint.color).toBe('red');
    expect(second.paint.color).toBe('blue');
  });

  it('does not mutate frozen local, inherited, or registry definitions', () => {
    const definition = Object.freeze({
      fill_style: 'gradient', color: '#112233',
      gradient_stops: Object.freeze([
        Object.freeze({ pos: 0, color: '#000000' }), Object.freeze({ pos: 100, color: '#ffffff' }),
      ]),
    });
    const definitions = Object.freeze({ named: definition });
    const localPaint = Object.freeze({ preset: 'named', opacity: 0 });
    const inheritedPaint = Object.freeze({ ...inherited });
    const before = JSON.stringify({ definition, localPaint, inheritedPaint });

    const result = resolvePaintPreset({ paint: localPaint, registry: Object.freeze({ presets: definitions }), inheritedPaint });

    expect(result.paint.opacity).toBe(0);
    expect(JSON.stringify({ definition, localPaint, inheritedPaint })).toBe(before);
  });
});
