import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { getPathValue } from '../../src/editor/shared/editor-config.js';
import {
  getFillStyleValue, getEffectiveFillStyleValue, getBarColorValue,
  getEffectiveBarSolidFillValue, getBarAppearanceSummary, hasBarAppearanceOverride,
  handleBarAppearanceField, renderBarAppearanceSection, clearBarAppearanceOverride,
  getBarPaintEditorState, clearBarPaintPropertyOverride,
} from '../../src/editor/sections/bar-appearance.js';

const root = { type: 'card' };
const row = { type: 'entity', index: 0 };
const styles = ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient'];
function setup(source, config) {
  const editor = createEditor({ source });
  const events = [];
  editor.dispatchEvent = event => { events.push(event); return true; };
  editor.setConfig(config);
  editor._render();
  return { editor, events };
}
function edit(editor, id, value, type = 'input') {
  const control = id.startsWith('[data-kind')
    ? editor.shadowRoot.querySelectorAll(`input${id}`)[0]
    : editor.shadowRoot.querySelector(id.startsWith('[') ? id : `#${id}`);
  if (control.type === 'checkbox') control.checked = value;
  else control.value = value;
  control.dispatchEvent({ type });
}

for (const source of ['src', 'dist']) describe(`Bar Appearance characterization (${source})`, () => {
  it('preserves default/raw/effective distinctions and existing paint explicitness', () => {
    for (const [config, effective] of [
      [{}, 'bands'],
      [{ bar: { color: 'red' } }, 'solid'],
      [{ bar: { color: 'red', segments: [{ from: '0%', to: '100%', color: '#123456' }] } }, 'bands'],
      [{ bar: { fill_style: 'gradient', color: 'red' } }, 'gradient'],
    ]) {
      const { editor, events } = setup(source, config);
      expect(editor._getFillStyleValue()).toBe(effective);
      expect(editor._getScopedFillStyleValue(root)).toBe(config.bar?.fill_style ?? 'bands');
      expect(editor.shadowRoot.querySelector('#bar-fill-style').value).toBe(effective);
      expect(events).toHaveLength(0);
    }
  });

  it('keeps legacy color-only entity style inference when no preset applies', () => {
    const { editor, events } = setup(source, { entities: [{ entity: 'sensor.power', color: '#123456' }] });
    expect(editor._getEffectiveScopedFillStyleValue(row)).toBe('solid');
    expect(editor.shadowRoot.querySelector('#entity-0-bar-fill-style').value).toBe('solid');
    expect(events).toHaveLength(0);

    const invalid = setup(source, { bar: { paint: { opacity: 120 } } }).editor;
    expect(getBarPaintEditorState(invalid._createSectionContext(), root).diagnostics).toContainEqual({
      code: 'paint_opacity_invalid', severity: 'warning', path: 'paint.opacity', reference: null, fallback: 'default_opacity',
    });
  });

  it('retains all legacy color modes, including nested read-only override behavior', () => {
    for (const [color_mode, expected] of [['single', 'solid'], ['gradient', 'gradient'], ['severity', 'bands'], ['severity_gradient', 'band_gradient']]) {
      const { editor } = setup(source, { color_mode, color: 'red', entities: [{ entity: 'sensor.power', color_mode, color: 'blue' }] });
      expect(editor._getScopedFillStyleValue(root)).toBe(expected);
      expect(editor._getScopedFillStyleValue(row)).toBe(expected);
      expect(editor._hasEntityBarAppearanceOverride(row)).toBe(true);
      editor._setScopedBarFillStyle(row, 'soft_bands');
      expect(editor._draftConfig.entities[0].color_mode).toBeUndefined();
      expect(editor._getEffectiveScopedFillStyleValue(row)).toBe('soft_bands');
    }
    const { editor } = setup(source, { entities: [{ entity: 'sensor.power', bar: { color_mode: 'single' } }] });
    expect(editor._getScopedFillStyleValue(row)).toBe('solid');
    expect(editor._hasEntityBarAppearanceOverride(row)).toBe(false);
    editor._clearEntityBarAppearance(row);
    expect(editor._draftConfig.entities[0].bar.color_mode).toBe('single');
  });

  it('switches every fill style while retaining config echo, palettes and unrelated config', () => {
    const segments = [{ from: '0%', to: '100%', color: '#123456' }];
    const gradient_stops = [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }];
    const { editor, events } = setup(source, {
      entity: 'sensor.power', extra: { keep: true },
      bar: { color: 'red', solid_fill: true, segments, gradient_stops, future: true },
    });
    for (const style of styles) {
      edit(editor, 'bar-fill-style', style, 'change');
      editor.setConfig(events.at(-1).detail.config);
      editor._render();
      expect(editor._getFillStyleValue()).toBe(style);
      expect(editor._draftConfig.bar).toMatchObject({ fill_style: style, color: 'red', solid_fill: true, segments, gradient_stops, future: true });
      expect(editor._draftConfig.extra).toEqual({ keep: true });
      expect(editor.shadowRoot.innerHTML.includes('Only used with Gradient fill style')).toBe(style !== 'gradient');
      expect(editor.shadowRoot.innerHTML.includes('Only used with segment-based fill styles.')).toBe(!['bands', 'soft_bands', 'band_gradient'].includes(style));
      expect(editor.shadowRoot.querySelector('#gradient-draft-pos')).toBeTruthy();
      expect(editor.shadowRoot.querySelector('#segment-draft-from')).toBeTruthy();
    }
  });

  it('preserves effective inherited controls, override summaries and scoped clearing', () => {
    const { editor, events } = setup(source, {
      bar: { fill_style: 'gradient', color: 'red', solid_fill: true },
      entities: [{ entity: 'sensor.power', bar: { fill_style: 'soft_bands', color: 'blue', solid_fill: false, needle: { show: true }, future: true }, extra: true }],
    });
    expect(editor._getBarAppearanceSummary(row)).toBe('soft bands • Custom color');
    expect(editor._getEffectiveScopedBarSolidFillValue(row)).toBe(false);
    edit(editor, 'entity-0-bar-inherit', true, 'change');
    expect(events.at(-1).detail.config.entities[0]).toEqual({ entity: 'sensor.power', bar: { needle: { show: true }, future: true }, extra: true });
    expect(editor._getEffectiveScopedFillStyleValue(row)).toBe('gradient');
    expect(editor._getEffectiveScopedBarColorValue(row)).toBe('red');
    expect(editor._getEffectiveScopedBarSolidFillValue(row)).toBe(true);
    expect(editor._hasEntityBarAppearanceOverride(row)).toBe(false);
    expect(editor._getBarAppearanceSummary(row)).toBe('Inherited');
    editor._render();
    expect(editor.shadowRoot.querySelector('#entity-0-bar-fill-style').value).toBe('gradient');
  });

  it('retains CSS color fallback, aliases, mounted input echoes and picker edits', () => {
    const { editor, events } = setup(source, { color: 'red', entities: [{ entity: 'sensor.power' }] });
    expect(editor._getScopedBarColorValue(row)).toBe('#4a9eff');
    expect(editor._getEffectiveScopedBarColorValue(row)).toBe('red');
    const control = editor.shadowRoot.querySelector('[data-field="bar-color-text-fallback"]');
    edit(editor, '[data-field="bar-color-text-fallback"]', ' var(--accent-color) ');
    editor.setConfig(events.at(-1).detail.config);
    expect(editor.shadowRoot.querySelector('[data-field="bar-color-text-fallback"]')).toBe(control);
    expect(editor._draftConfig.color).toBeUndefined();
    expect(editor._draftConfig.bar.color).toBe('var(--accent-color)');
    expect(editor._getFillStyleValue()).toBe('solid');
    edit(editor, '[data-kind="entity-bar-color-text-fallback"]', 'blue');
    expect(editor._getEffectiveScopedBarColorValue(row)).toBe('blue');
    edit(editor, 'entity-0-bar-color', '#abcdef');
    expect(editor._draftConfig.entities[0].bar.color).toBe('#abcdef');
  });

  it('preserves explicit default color and false-solid-fill overrides', () => {
    const { editor, events } = setup(source, {
      bar: { fill_style: 'gradient', color: 'red', solid_fill: true },
      entities: [{ entity: 'sensor.power', color: 'blue', bar: { solid_fill: false } }],
    });
    expect(editor._getEffectiveScopedBarSolidFillValue(row)).toBe(false);
    edit(editor, 'entity-0-bar-solid-fill', false, 'change');
    expect(editor._getScopedBarSolidFillValue(row)).toBe(false);
    expect(editor._getEffectiveScopedBarSolidFillValue(row)).toBe(false);
    editor._setScopedBarColor(row, '#4A9EFF');
    expect(editor._getEffectiveScopedBarColorValue(row)).toBe('#4A9EFF');
    expect(events.at(-1).detail.config.entities[0]).toEqual({ entity: 'sensor.power', bar: { color: '#4A9EFF', solid_fill: false } });
    edit(editor, 'bar-solid-fill', false, 'change');
    expect(editor._getEffectiveScopedBarSolidFillValue(root)).toBe(false);
    edit(editor, 'bar-solid-fill', true, 'change');
    expect(editor._draftConfig.bar.solid_fill).toBe(true);
  });

  it('edits canonical opacity including zero while preserving legacy paint and config echo', () => {
    const { editor, events } = setup(source, {
      extra: { keep: true },
      bar: { fill_style: 'gradient', color: 'red', solid_fill: true, future: { keep: true }, paint: { opacity: 35, future: true } },
    });
    const input = editor.shadowRoot.querySelector('#bar-opacity');
    expect(input.value).toBe('35');
    expect(input.getAttribute('min')).toBe('0');
    expect(input.getAttribute('max')).toBe('100');
    expect(input.getAttribute('step')).toBe('any');
    edit(editor, 'bar-opacity', '0');
    expect(events.at(-1).detail.config).toEqual({
      extra: { keep: true },
      bar: { fill_style: 'gradient', color: 'red', solid_fill: true, future: { keep: true }, paint: { opacity: 0, future: true } },
    });
    editor.setConfig(events.at(-1).detail.config);
    editor._render();
    expect(editor.shadowRoot.querySelector('#bar-opacity').value).toBe('0');
    expect(editor._draftConfig).toEqual(events.at(-1).detail.config);
  });

  it('selects a preset by reference, applies local overrides, and clears them individually', () => {
    const { editor } = setup(source, { bar: { paint: { opacity: 35, future: true } } });
    const context = editor._createSectionContext();
    const registry = { status: 'ready', presets: { night: { fill_style: 'solid', color: '#112233', opacity: 42 } } };
    const before = getBarPaintEditorState(context, root, null, registry);
    expect(before.presetOptions).toEqual([{ value: 'preset:night', label: 'night' }]);
    expect(handleBarAppearanceField(context, { field: 'bar-paint-mode', value: 'preset:night' })).toBe(true);
    expect(editor._draftConfig.bar.paint).toEqual({ opacity: 35, future: true, preset: 'night' });
    expect(getBarPaintEditorState(context, root, null, registry).paint).toMatchObject({
      fill_style: 'solid', color: '#112233', opacity: 35,
    });
    handleBarAppearanceField(context, { field: 'bar-opacity', value: 0 });
    expect(editor._draftConfig.bar.paint.opacity).toBe(0);
    clearBarPaintPropertyOverride(context, root, 'opacity');
    expect(editor._draftConfig.bar.paint).toEqual({ future: true, preset: 'night' });
    expect(getBarPaintEditorState(context, root, null, registry).paint.opacity).toBe(42);
    expect(handleBarAppearanceField(context, { field: 'bar-paint-mode', value: 'manual' })).toBe(true);
    expect(editor._draftConfig.bar.paint).toEqual({ future: true });
  });

  it('clears scoped palette session state atomically with the inherited paint mutation', () => {
    const { editor, events } = setup(source, { bar: { paint: {
      fill_style: 'bands', segments: [{ from: '15%', to: '100%', color: '#123456' }],
    } } });
    const context = editor._createSectionContext();
    let clearedScope = null;
    context.clearPaintPaletteState = scope => { clearedScope = scope; };

    expect(handleBarAppearanceField(context, { field: 'bar-paint-mode', value: 'inherit' })).toBe(true);
    expect(clearedScope).toEqual(root);
    expect(editor._draftConfig.bar?.paint).toBeUndefined();
    expect(events).toHaveLength(1);
  });

  it('reports missing presets and retains the reference while using inherited paint', () => {
    const { editor } = setup(source, { bar: { paint: { preset: 'missing', opacity: 0 }, color: 'red' } });
    const state = getBarPaintEditorState(editor._createSectionContext(), root, null, { status: 'ready', presets: {} });
    expect(state.mode).toBe('preset:missing');
    expect(state.presetReference).toBe('missing');
    expect(state.diagnostics).toContainEqual(expect.objectContaining({ code: 'paint_preset_missing', reference: 'missing' }));
    expect(state.paint).toMatchObject({ color: 'red', opacity: 0 });
  });

  it('reports malformed preset definitions without discarding local overrides', () => {
    const { editor } = setup(source, { bar: { paint: { preset: 'bad', opacity: 0 } } });
    const state = getBarPaintEditorState(editor._createSectionContext(), root, null, {
      status: 'ready', presets: { bad: { fill_style: 'invalid-style', color: '#123456' } },
    });
    expect(state.diagnostics).toContainEqual(expect.objectContaining({ code: 'paint_preset_invalid', reference: 'bad' }));
    expect(state.paint.opacity).toBe(0);
  });
});

describe('Bar Appearance with a root-only host context', () => {
  function hostFor(initial) {
    let config = initial;
    const edits = [];
    return {
      config: () => config,
      edits,
      context: {
        read: (scope, path) => {
          expect(scope).toEqual(root);
          return getPathValue(config, path);
        },
        mutate: (scope, mutation, options) => {
          expect(scope).toEqual(root);
          config = mutation(config);
          edits.push(options);
          return true;
        },
      },
    };
  }

  it('renders/edits canonical appearance with only reads, mutations and optional host child content', () => {
    const host = hostFor({ color_mode: 'single', color: 'red', extra: { keep: true }, bar: { future: true } });
    expect(getFillStyleValue(host.context, root)).toBe('solid');
    expect(getEffectiveFillStyleValue(host.context, root)).toBe('solid');
    expect(getBarColorValue(host.context, root)).toBe('red');
    let childCalls = 0;
    const html = renderBarAppearanceSection(host.context, root, () => {
      childCalls += 1;
      return '<div id="host-child">Existing host content</div>';
    });
    expect(childCalls).toBe(1);
    expect(html).toContain('data-field="bar-fill-style" value="solid"');
    expect(html).toContain('data-field="bar-color-text-fallback" data-paint-property="color" value="red"');
    expect(html.indexOf('id="host-child"')).toBeGreaterThan(html.indexOf('id="bar-color"'));
    expect(renderBarAppearanceSection(host.context, root)).not.toContain('host-child');
    expect(handleBarAppearanceField(host.context, { field: 'bar-fill-style', value: ' gradient ' })).toBe(true);
    expect(handleBarAppearanceField(host.context, { field: 'bar-color', value: ' var(--accent-color) ' })).toBe(true);
    expect(handleBarAppearanceField(host.context, { field: 'bar-solid-fill', value: true })).toBe(true);
    expect(host.config()).toEqual({ extra: { keep: true }, bar: { future: true, fill_style: 'gradient', color: 'var(--accent-color)', solid_fill: true } });
    expect(getEffectiveBarSolidFillValue(host.context, root)).toBe(true);
    expect(getBarAppearanceSummary(host.context, root)).toBe('gradient • Custom color');
    expect(hasBarAppearanceOverride(host.context, root)).toBe(true);
    expect(handleBarAppearanceField(host.context, { field: 'unrelated', value: 'ignored' })).toBe(false);
    expect(host.edits).toHaveLength(3);
    expect(host.config().entities).toBeUndefined();
  });

  it('retains explicit defaults and clears only appearance fields without whole-config cleanup', () => {
    const host = hostFor({
      color: 'blue', color_mode: 'gradient', solid_fill: true,
      bar: { fill_style: 'gradient', color: 'red', solid_fill: true, color_mode: 'single', needle: { show: true }, segments: [], future: true },
      extra: { keep: true },
    });
    handleBarAppearanceField(host.context, { field: 'bar-color', value: '#4A9EFF' });
    expect(host.config().color).toBeUndefined();
    expect(host.config().bar.color).toBe('#4A9EFF');
    handleBarAppearanceField(host.context, { field: 'bar-solid-fill', value: false });
    expect(getEffectiveBarSolidFillValue(host.context, root)).toBe(false);
    // There is no top-level solid_fill alias in the existing appearance reader.
    expect(host.config().solid_fill).toBe(true);
    handleBarAppearanceField(host.context, { field: 'bar-fill-style', value: '' });
    expect(host.config().color_mode).toBeUndefined();
    expect(host.config().bar.color_mode).toBe('single');
    clearBarAppearanceOverride(host.context, root);
    expect(host.edits.at(-1)).toEqual({ rerender: true });
    expect(host.config()).toEqual({
      solid_fill: true, extra: { keep: true },
      bar: { color_mode: 'single', needle: { show: true }, segments: [], future: true },
    });
    expect(hasBarAppearanceOverride(host.context, root)).toBe(false);
    expect(getEffectiveFillStyleValue(host.context, root)).toBe('solid');
  });
});
