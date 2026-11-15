import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel } from '../../src/view-model/bar-render-model.js';
import { BAR_PAINT, BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT, resolveConfiguredDestination } from '../../src/view-model/paint-destinations.js';
import { getDestinationEditorState, setDestinationEnabled, resetDestinationPaint, selectDestinationPreset,
  setDestinationProperty, clearDestinationProperty } from '../../src/editor/shared/paint-destination.js';
import { getPathValue, setPathValue } from '../../src/editor/shared/editor-config.js';
import { compilePaint } from '../../src/view-model/paint-compiler.js';
import { loadCardClass } from '../support/load-card-class.cjs';

const entity = 'sensor.power';
const sides = ['above', 'below'];
const themeColor = 'var(--accent-color, #4a9eff)';

function modelFor(config, value = 80) {
  const appearance = normalizeCardConfig({ ...config, entities: [{ entity }] }).entities[0];
  return buildBarRenderModel(buildRowViewModel({ entityConfig: appearance,
    entityState: { state: String(value), attributes: {} }, hass: { states: {} },
  }), appearance, { height: 30 });
}

describe('shared Paint destination contract regressions', () => {
  for (const side of sides) {
    it(`explicitly enables ${side} with Solid theme defaults and visible paint`, () => {
      const config = { baseline: { at: 50, [side]: { paint: {} } } };
      const normalized = normalizeCardConfig({ ...config, entities: [{ entity }] });
      expect(normalized.entities[0].baseline[side].paint).toMatchObject({
        fill_style: 'solid', color: themeColor, opacity: 100,
        segments: expect.any(Array), gradient_stops: expect.any(Array),
      });
      expect(modelFor(config).fill.paintLayers.find(layer => layer.id === `baseline-${side}`))
        .toMatchObject({ visible: true, paintStyle: expect.stringContaining(themeColor) });
    });

    it(`samples ${side} Solid Fill at the current value`, () => {
      const config = { baseline: { at: 50, [side]: { paint: {
        fill_style: 'gradient', solid_fill: true,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
      } } } };
      const layer = value => modelFor(config, value).fill.paintLayers.find(item => item.id === `baseline-${side}`);
      expect(layer(80).paintStyle).toContain('rgb(204,204,204)');
      expect(layer(20).paintStyle).toContain('rgb(51,51,51)');
    });

    it(`enables ${side} with inherited legacy color and retains other inherited Paint properties`, () => {
      const card = normalizeCardConfig({ baseline: { [side]: { color: '#ff0000' } },
        entities: [{ entity, baseline: { [side]: { paint: {} } } }] });
      expect(card.entities[0].baseline[side].paint.color).toBe('#ff0000');
      const shorthand = normalizeCardConfig({ baseline: { [side]: { paint: {
        fill_style: 'gradient', opacity: 40,
      } } }, entities: [{ entity, baseline: { [side]: '#00ff00' } }] });
      expect(shorthand.entities[0].baseline[side].paint).toMatchObject({
        fill_style: 'gradient', color: '#00ff00', opacity: 40,
      });
    });
  }

  for (const source of ['src', 'dist']) for (const host of ['editor', 'featureEditor']) {
    it(`${host}/${source} preserves scalar Baseline sources when enabling Paint`, () => {
      const C = loadCardClass({ source })[host];
      const editor = new C();
      editor.setConfig({ type: 'custom:sensor-bar-card-plus-feature', entity, baseline: 50 });
      setDestinationEnabled(editor._createSectionContext(), { type: 'card' }, BASELINE_PAINTS[0], true);
      expect((editor._draftConfig ?? editor._config).baseline).toEqual({ at: 50, above: { paint: {} } });
    });

    it(`${host}/${source} binds Baseline palettes directly without reading legacy Bar aliases`, () => {
      const C = loadCardClass({ source })[host];
      const editor = new C();
      editor.setConfig({ type: 'custom:sensor-bar-card-plus-feature', entity,
        bar: { color: 'pink', segments: [{ from: 0, to: 100, color: 'orange' }],
          gradient_stops: [{ pos: 0, color: 'purple' }, { pos: 100, color: 'purple' }] },
        baseline: { at: 50, above: { paint: {} }, below: { paint: {} } },
      });
      for (const side of sides) {
        const sections = editor._baselinePaintSections[side];
        expect(sections.segments._getScopedSegmentsValue({ type: 'card' }).map(row => row.color))
          .toEqual(['#4CAF50', '#FF9800', '#F44336']);
        expect(sections.gradientStops._getScopedGradientStopsValue({ type: 'card' }).map(row => row.color))
          .toEqual(['#4CAF50', '#FF9800', '#F44336']);
      }
    });

    for (const destination of [BAR_PAINT, ...BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT]) it(`${host}/${source}/${destination.id} clears one palette without invalidating the other`, () => {
      const C = loadCardClass({ source })[host];
      const editor = new C();
      const paint = { fill_style: 'gradient', segments: [{ from: '0%', to: '100%', color: '#123456' }],
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] };
      editor.setConfig(setPathValue({ type: 'custom:sensor-bar-card-plus-feature', entity, baseline: { at: 50 } }, destination.path, paint));
      const sections = destination === BAR_PAINT ? { segments: editor._segmentsSection, gradientStops: editor._gradientStopsSection }
        : destination === TARGET_ABOVE_PAINT ? editor._targetPaintSections : destination === TARGET_BELOW_PAINT ? editor._targetBelowPaintSections : editor._baselinePaintSections[destination.id.slice(9)];
      const scope = { type: 'card' };
      const segmentSession = sections.segments._getPaletteSession(scope);
      const gradientSession = sections.gradientStops._getPaletteSession(scope);
      sections.gradientStops.clearPaintProperty(scope, 'gradient_stops');
      expect(sections.segments._getPaletteSession(scope)).toBe(segmentSession);
      expect(sections.gradientStops._getPaletteSession(scope)).not.toBe(gradientSession);
    });
  }
});

const registry = { status: 'ready', presets: {
  warm: { fill_style: 'gradient', color: '#112233', opacity: 35,
    gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
  cool: { fill_style: 'solid', color: '#123456' },
} };

function fixture(host, destination, paint, parentPaint) {
  const scope = host === 'Entity' ? { type: 'entity', index: 0 } : { type: 'card' };
  let config = { future: true, scale: { min: 0, max: 100 }, baseline: { at: 50 },
    entities: [{ entity, future: true }] };
  if (parentPaint !== undefined && host === 'Entity') config = setPathValue(config, destination.path, parentPaint);
  const path = scope.type === 'entity' ? ['entities', 0, ...destination.path] : destination.path;
  if (paint !== undefined) config = setPathValue(config, path, paint);
  const events = [], cleared = [];
  const context = {
    hass: { states: {} }, paintPresetRegistry: registry,
    read(at, path = []) { return getPathValue(at.type === 'entity' ? config.entities[at.index] : config, path); },
    mutate(at, mutation) {
      const before = at.type === 'entity' ? config.entities[at.index] : config;
      const after = mutation(before);
      if (JSON.stringify(before) === JSON.stringify(after)) return false;
      config = at.type === 'entity' ? setPathValue(config, ['entities', at.index], after) : after;
      events.push(structuredClone(config));
      return true;
    },
    clearPaintPaletteState(at, target) { cleared.push([at, target]); },
  };
  return { scope, context, events, cleared, config: () => config, paint: () => getPathValue(config, path),
    state: () => getDestinationEditorState(context, scope, destination) };
}

for (const destination of [BAR_PAINT, ...BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT]) for (const host of ['Card', 'Entity', 'Feature']) {
  describe(`${host} / ${destination.id} shared destination contract`, () => {
    it('opens without emitting, resolves presets before local properties, and agrees with runtime', () => {
      const f = fixture(host, destination, { preset: 'warm', opacity: 0 });
      const before = structuredClone(f.config());
      const state = f.state();
      expect(state.paint).toMatchObject({ fill_style: 'gradient', opacity: 0 });
      expect(state.sources.opacity).toBe('Override');
      expect(state.sources.gradient_stops).toBe('Preset');
      const normalized = normalizeCardConfig(f.config());
      const appearance = normalized.entities[0];
      const runtime = resolveConfiguredDestination(f.context.read(f.scope, []),
        host === 'Entity' ? f.config() : null, destination, registry).paint;
      expect(compilePaint(state.paint, { samplePercent: 50 }).gradient).toBe(compilePaint(runtime, { samplePercent: 50 }).gradient);
      if (destination === BAR_PAINT) expect(appearance.bar.paint.opacity).toBe(0);
      expect(f.config()).toEqual(before);
      expect(f.events).toHaveLength(0);
    });

    it('keeps the active preset a no-op, preserves properties on None, and confirms replacement', () => {
      const f = fixture(host, destination, { preset: 'warm', color: '#abcdef' });
      expect(selectDestinationPreset(f.context, f.scope, destination, 'warm', { confirm: () => { throw Error('must not confirm'); } })).toBe(true);
      expect(f.events).toHaveLength(0);
      expect(selectDestinationPreset(f.context, f.scope, destination, 'cool', { confirm: () => false })).toBe(false);
      expect(f.events).toHaveLength(0);
      selectDestinationPreset(f.context, f.scope, destination, '');
      expect(f.paint()).toEqual({ color: '#abcdef' });
      selectDestinationPreset(f.context, f.scope, destination, 'cool', { confirm: () => true });
      expect(f.paint()).toEqual({ preset: 'cool' });
      expect(f.cleared.at(-1)).toEqual([f.scope, destination]);
    });

    it('clears individual authored properties and resets only its own configuration', () => {
      const f = fixture(host, destination, { color: '#abcdef', opacity: 63 });
      const before = structuredClone(f.config());
      expect(f.state().sources.color).toBe('Local');
      clearDestinationProperty(f.context, f.scope, destination, 'color');
      expect(f.paint()).toEqual({ opacity: 63 });
      resetDestinationPaint(f.context, f.scope, destination);
      expect(f.paint()).toBeUndefined();
      expect(f.state().resetDisabled).toBe(true);
      expect(f.config().future).toBe(before.future);
      expect(f.config().baseline.at).toBe(50);
      expect(f.config().entities[0].future).toBe(true);
    });

    it('rejects invalid opacity edits without corrupting saved paint', () => {
      const f = fixture(host, destination, { preset: 'warm', color: '#abcdef' });
      for (const value of ['bad', -1, 101, Infinity]) {
        expect(setDestinationProperty(f.context, f.scope, destination, 'opacity', value)).toBe(false);
      }
      expect(f.events).toHaveLength(0);
      setDestinationProperty(f.context, f.scope, destination, 'opacity', 0);
      expect(f.paint()).toEqual({ preset: 'warm', color: '#abcdef', opacity: 0 });
    });

    if (host === 'Entity') it('resolves the parent preset before local overrides and identifies genuine inheritance', () => {
      const f = fixture(host, destination, { opacity: 60 }, { preset: 'warm' });
      expect(f.state().paint).toMatchObject({ fill_style: 'gradient', opacity: 60, color: '#112233' });
      expect(f.state().sources.color).toBe('Inherited');
      expect(f.state().sources.opacity).toBe('Override');
      selectDestinationPreset(f.context, f.scope, destination, 'warm');
      expect(f.events).toHaveLength(0);
      resetDestinationPaint(f.context, f.scope, destination);
      expect(f.state()).toMatchObject({ inherited: true, paint: { opacity: 35 } });
    });

    if (destination !== BAR_PAINT) {
      it('distinguishes omission, null, empty, property clear, disable and reset', () => {
        const f = fixture(host, destination);
        expect(f.state()).toMatchObject({ enabled: false, resetDisabled: true });
        setDestinationEnabled(f.context, f.scope, destination, true);
        expect(f.paint()).toEqual({});
        expect(f.state()).toMatchObject({ enabled: true, paint: { fill_style: 'solid', color: themeColor } });
        setDestinationProperty(f.context, f.scope, destination, 'color', '#123456');
        clearDestinationProperty(f.context, f.scope, destination, 'color');
        expect(f.paint()).toEqual({});
        setDestinationEnabled(f.context, f.scope, destination, false);
        expect(f.state()).toMatchObject({ enabled: false, resetDisabled: false });
        resetDestinationPaint(f.context, f.scope, destination);
        expect(f.paint()).toBeUndefined();
        expect(f.state()).toMatchObject({ enabled: false, resetDisabled: true });
      });

      it('does not read ordinary Bar aliases or another Baseline side', () => {
        const f = fixture(host, destination, {});
        f.context.mutate({ type: 'card' }, target => ({ ...target,
          color: 'red', severity: [{ from: 0, to: 100, color: 'pink' }],
          bar: { color: 'green', segments: [{ from: 0, to: 100, color: 'orange' }],
            paint: { fill_style: 'gradient', opacity: 5 } },
        }));
        expect(f.state().paint).toMatchObject({ fill_style: 'solid', color: themeColor, opacity: 100 });
        expect(f.state().paint.segments.map(row => row.color)).toEqual(['#4CAF50', '#FF9800', '#F44336']);
      });

      it('recovers malformed properties independently and paints default recovery for missing presets', () => {
        const f = fixture(host, destination, { preset: 'missing', fill_style: 'gradient', opacity: -1,
          color: 123, gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] });
        expect(f.state().paint).toMatchObject({ fill_style: 'gradient', opacity: 100, color: themeColor });
        expect(f.state().sources).toMatchObject({ color: 'Default', opacity: 'Default' });
        expect(f.state().overrides.color).toBe(true);
        expect(compilePaint(f.state().paint).gradient).toContain('rgb(255,255,255) 100%');
        const missing = fixture(host, destination, { preset: 'missing' });
        expect(missing.state().paint).toMatchObject({ fill_style: 'solid', color: themeColor, opacity: 100 });
        expect(compilePaint(missing.state().paint).gradient).toContain(themeColor);
      });

      if (host === 'Entity') it('restores matching inherited Paint after disabling, including an inherited disable', () => {
        const f = fixture(host, destination, null, { color: '#abcdef', opacity: 35 });
        expect(f.state()).toMatchObject({ enabled: false, resetDisabled: false });
        resetDestinationPaint(f.context, f.scope, destination);
        expect(f.state()).toMatchObject({ enabled: true, inherited: true, paint: { color: '#abcdef', opacity: 35 } });
        const disabledParent = fixture(host, destination, {}, null);
        expect(disabledParent.state().enabled).toBe(true);
        resetDestinationPaint(disabledParent.context, disabledParent.scope, destination);
        expect(disabledParent.state().enabled).toBe(false);
      });

      if (host === 'Entity' && destination.aliases?.color?.length) it('does not label disabled inherited legacy properties as effective inheritance', () => {
        const f = fixture(host, destination, {}, null);
        f.context.mutate({ type: 'card' }, target => setPathValue(target, destination.aliases.color[0], '#ff0000'));
        expect(f.state().paint.color).toBe(themeColor);
        expect(f.state().sources.color).toBe('Default');
      });
    }
  });
}

for (const destination of [BAR_PAINT, ...BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT]) for (const host of ['Card', 'Entity', 'Feature']) {
  it(`classifies every ${host}/${destination.id} property by provenance, not default equality`, () => {
    const complete = { fill_style: 'gradient', color: '#123456', solid_fill: false, opacity: 100,
      segments: [{ from: '0%', to: '100%', color: '#123456' }],
      gradient_stops: [{ pos: 0, color: '#4CAF50' }, { pos: 50, color: '#FF9800' }, { pos: 100, color: '#F44336' }] };
    const f = fixture(host, destination, {});
    f.context.paintPresetRegistry = { status: 'ready', presets: { complete } };
    const state = () => getDestinationEditorState(f.context, f.scope, destination);
    const properties = Object.keys(complete);
    expect(properties.map(key => state().sources[key])).toEqual(properties.map(() => 'Default'));
    for (const property of properties) setDestinationProperty(f.context, f.scope, destination, property, complete[property]);
    expect(properties.map(key => state().sources[key])).toEqual(properties.map(() => 'Local'));
    selectDestinationPreset(f.context, f.scope, destination, 'complete', { confirm: () => true });
    expect(properties.map(key => state().sources[key])).toEqual(properties.map(() => 'Preset'));
    for (const property of properties) setDestinationProperty(f.context, f.scope, destination, property, complete[property]);
    expect(properties.map(key => state().sources[key])).toEqual(properties.map(() => 'Override'));
    for (const property of properties) clearDestinationProperty(f.context, f.scope, destination, property);
    expect(properties.map(key => state().sources[key])).toEqual(properties.map(() => 'Preset'));
    if (host === 'Entity') {
      const inherited = fixture(host, destination, {}, complete);
      expect(properties.map(key => inherited.state().sources[key])).toEqual(properties.map(() => 'Inherited'));
      for (const property of properties) setDestinationProperty(inherited.context, inherited.scope, destination, property, complete[property]);
      expect(properties.map(key => inherited.state().sources[key])).toEqual(properties.map(() => 'Override'));
    }
  });
}

for (const host of ['editor', 'featureEditor']) for (const destination of [BAR_PAINT, ...BASELINE_PAINTS, TARGET_ABOVE_PAINT, TARGET_BELOW_PAINT]) {
  it(`${host}/${destination.id} palette descriptions use resolved sources, including authored default stops`, () => {
    const C = loadCardClass({ source: 'src' })[host];
    const editor = new C();
    const scope = { type: 'card' };
    const apply = (paint, presets) => editor.setConfig(setPathValue({ type: 'custom:sensor-bar-card-plus-feature', entity,
      baseline: { at: 50 }, ...(presets ? { preset_library: { paint: presets } } : {}) }, destination.path, paint));
    const sections = destination === BAR_PAINT ? { segments: editor._segmentsSection, gradientStops: editor._gradientStopsSection }
      : destination === TARGET_ABOVE_PAINT ? editor._targetPaintSections : destination === TARGET_BELOW_PAINT ? editor._targetBelowPaintSections : editor._baselinePaintSections[destination.id.slice(9)];
    apply({ fill_style: 'gradient' });
    expect(sections.segments._getSegmentsSummary(scope)).toBe('Default bands');
    expect(sections.gradientStops._getGradientStopsSummary(scope)).toBe('Default gradient');
    const stops = sections.gradientStops._getScopedGradientStopsValue(scope);
    apply({ fill_style: 'gradient', gradient_stops: stops });
    expect(sections.gradientStops._getGradientStopsSummary(scope)).toBe(`${stops.length} stops`);
    apply({ preset: 'defaults' }, { defaults: { fill_style: 'gradient', gradient_stops: stops } });
    editor._paintPresetRegistry = { status: 'ready', presets: sections.gradientStops.context.read(scope, ['preset_library', 'paint']) };
    expect(sections.gradientStops._getGradientStopsSummary(scope)).toBe(`Preset · ${stops.length} stops`);
  });
}
