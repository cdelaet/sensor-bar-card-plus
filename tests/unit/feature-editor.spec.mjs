import { describe, it, expect, vi } from 'vitest';
import { loadCardClass, createEditor } from '../support/load-card-class.cjs';
import { renderScaleSection } from '../../src/editor/sections/scale.js';
import { renderFormattingSection } from '../../src/editor/sections/formatting.js';
import { renderBarAppearanceSection } from '../../src/editor/sections/bar-appearance.js';
import { patchFeatureScaleSource } from '../../src/feature/feature-editor-config.js';

const type = 'custom:sensor-bar-card-plus-feature';
const raw = () => ({
  type, future_option: { foo: 'bar' }, min: -10, min_entity: 'sensor.legacy_min',
  unit: 'Wh', decimal: 0, color: 'red', color_mode: 'gradient',
  bar: {
    fill_style: 'gradient', color: '#4a9eff', solid_fill: false, animated: false,
    unknown_future_bar_setting: { hello: 'world' },
    segments: [{ from: 50, to: 100, color: 'red' }, { from: 0, to: 50, color: 'blue' }],
    gradient_stops: [{ pos: 100, color: 'red', extra: true }, { pos: 0, color: 'blue' }],
    needle: { show: true, color: 'white' },
  },
  scale: { min: { fixed: 0, entity: 'sensor.min', future_metadata: 'keep-me' }, max: 100, extra: true },
  formatting: { future: true }, target: { at: '75%', label: { show: true } },
  peak: { enabled: true }, floor: { enabled: true }, baseline: { at: 20 },
  markers: [{ at: 75, custom_metadata: { untouched: true } }, { at: 25, show_marker: false }],
});

async function setup(source, config = { type }, context = { entity_id: 'sensor.parent' }, withEntityPicker = false) {
  const classes = loadCardClass({ source, withEntityPicker });
  const editor = new classes.featureEditor();
  const events = [];
  editor.dispatchEvent = event => { events.push(event); return true; };
  editor.setConfig(config);
  editor.context = context;
  editor.hass = { states: {} };
  await editor.updateComplete;
  return { editor, events, classes };
}
async function edit(editor, selector, value, eventType = 'input') {
  const control = selector.startsWith('input[') || selector.startsWith('ha-entity-picker[')
    ? editor.shadowRoot.querySelectorAll(selector)[0] : editor.shadowRoot.querySelector(selector);
  expect(control).toBeTruthy();
  if (control.type === 'checkbox') control.checked = value;
  else control.value = value;
  control.dispatchEvent({ type: eventType, ...(eventType === 'value-changed' ? { detail: { value } } : {}) });
  await editor.updateComplete;
}

for (const source of ['src', 'dist']) describe(`Feature editor foundation (${source})`, () => {
  it('guards all registrations, remains discoverable and keeps the inherited stub', async () => {
    const { classes, events } = await setup(source);
    const previous = [classes.card, classes.editor, classes.feature, classes.featureEditor];
    classes.reload();
    expect([classes.card, classes.editor, classes.feature, classes.featureEditor]).toEqual(previous);
    expect(classes.feature.getConfigElement()).toBeInstanceOf(classes.featureEditor);
    expect(classes.feature.getStubConfig()).toEqual({ type });
    expect(classes.customCardFeatures).toHaveLength(1);
    expect(classes.customCardFeatures[0]).toMatchObject({ configurable: true, type: 'sensor-bar-card-plus-feature' });
    expect(classes.customCardFeatures[0].isSupported({}, { area_id: 'kitchen' })).toBe(true);
    expect(classes.customCardFeatures[0].isSupported({}, { entity_id: 'switch.parent' })).toBe(true);
    expect(events).toHaveLength(0);
  });

  it('displays parent inheritance, updates context independently and never materializes it', async () => {
    const { editor, events } = await setup(source);
    expect(editor._effectiveEntity).toBe('sensor.parent');
    expect(editor._config).toEqual({ type });
    expect(editor.shadowRoot.querySelector('#feature-entity-status').textContent).toBe('Using parent card entity: sensor.parent');
    editor.context = { entity_id: 'sensor.new_parent' };
    await editor.updateComplete;
    expect(editor._effectiveEntity).toBe('sensor.new_parent');
    await edit(editor, '#formatting-unit', 'W');
    expect(events[0]).toMatchObject({ type: 'config-changed', bubbles: true, composed: true, detail: { config: { type, formatting: { unit: 'W' } } } });
    expect(editor._config.entity).toBeUndefined();
  });

  it('chooses an explicit override, survives context changes and clears back to inheritance', async () => {
    const { editor, events } = await setup(source);
    await edit(editor, '#feature-entity-override', true, 'change');
    expect(events).toHaveLength(0);
    expect(editor.shadowRoot.querySelector('#feature-entity').value).toBe('');
    await edit(editor, '#feature-entity', ' sensor.other ');
    expect(editor._config.entity).toBe('sensor.other');
    editor.context = { entity_id: 'sensor.new_parent' };
    await editor.updateComplete;
    expect(editor._effectiveEntity).toBe('sensor.other');
    await edit(editor, '#feature-entity-override', false, 'change');
    expect(editor._effectiveEntity).toBe('sensor.new_parent');
    expect(editor._config).toEqual({ type });
    expect(events).toHaveLength(2);
  });

  it('shows required entity for Area/no-parent context and accepts any custom domain', async () => {
    const { editor, events } = await setup(source, { type }, { area_id: 'kitchen' });
    expect(editor._effectiveEntity).toBe('');
    expect(editor._entityDescription()).toContain('An entity is required');
    expect(editor.shadowRoot.querySelector('#feature-entity')).toBeTruthy();
    expect(events).toHaveLength(0);
    await edit(editor, '#feature-entity', 'input_number.custom');
    expect(editor._effectiveEntity).toBe('input_number.custom');
    await edit(editor, '#feature-entity', '');
    expect(editor._effectiveEntity).toBe('');
    expect(editor._config).toEqual({ type });
    const explicit = await setup(source, { type, entity: 'sensor.explicit' }, {});
    expect(explicit.editor._effectiveEntity).toBe('sensor.explicit');
  });

  it('handles picker value-changed and synchronizes hass/custom IDs without internal event emissions', async () => {
    const { editor, events } = await setup(source, { type }, {}, true);
    const picker = editor.shadowRoot.querySelector('#feature-entity');
    expect(picker.tagName).toBe('HA-ENTITY-PICKER');
    expect(picker.allowCustomEntity).toBe(true);
    expect(picker.hass).toBe(editor.hass);
    await edit(editor, '#feature-entity', 'sensor.ignored', 'input');
    expect(events).toHaveLength(0);
    await edit(editor, '#feature-entity', 'sensor.custom', 'value-changed');
    expect(editor._config.entity).toBe('sensor.custom');
    await edit(editor, 'ha-entity-picker[data-kind="scale-max-entity-source"]', 'sensor.maximum', 'value-changed');
    expect(editor._config.scale.max).toEqual({ entity: 'sensor.maximum' });
    const stalePicker = editor.shadowRoot.querySelector('#feature-entity');
    stalePicker.value = 'sensor.custom';
    stalePicker.dispatchEvent({ type: 'value-changed', detail: { value: undefined } });
    await editor.updateComplete;
    expect(editor._config.entity).toBeUndefined();
  });

  it('patches Formatting without touching defaults, aliases, advanced config or array order', async () => {
    const config = raw();
    const before = JSON.stringify(config);
    const { editor, events } = await setup(source, config);
    await edit(editor, '#formatting-unit', ' kW ');
    expect(editor._config).toEqual({ ...config, unit: undefined, formatting: { future: true, unit: 'kW' } });
    expect(Object.hasOwn(editor._config, 'unit')).toBe(false);
    const count = events.length;
    await edit(editor, '#formatting-decimal', '-1');
    expect(events).toHaveLength(count);
    await edit(editor, '#formatting-decimal', '2');
    expect(editor._config.formatting).toEqual({ future: true, unit: 'kW', decimal: 2 });
    expect(Object.hasOwn(editor._config, 'decimal')).toBe(false);
    await edit(editor, '#formatting-decimal', '');
    await edit(editor, '#formatting-unit', '');
    expect(editor._config.formatting).toEqual({ future: true });
    expect(editor._config.bar).toEqual(config.bar);
    expect(editor._config.markers).toEqual(config.markers);
    expect(editor._config.scale).toEqual(config.scale);
    expect(JSON.stringify(config)).toBe(before);
    // Event listeners cannot mutate the host's retained raw configuration.
    events.at(-1).detail.config.markers.reverse();
    expect(editor._config.markers).toEqual(config.markers);
  });

  it('patches each Bar field, preserving unknown siblings and all inactive advanced sections', async () => {
    const config = raw();
    const { editor } = await setup(source, config);
    await edit(editor, '#bar-color', '#abcdef');
    expect(editor._config.bar).toEqual({ ...config.bar, color: '#abcdef' });
    expect(editor._config.color).toBeUndefined();
    expect(editor._config.color_mode).toBe('gradient');
    await edit(editor, '#bar-fill-style', 'solid', 'change');
    expect(editor._config.color_mode).toBeUndefined();
    await edit(editor, '#bar-solid-fill', true, 'change');
    expect(editor._config.bar).toEqual({ ...config.bar, color: '#abcdef', fill_style: 'solid', solid_fill: true });
    expect(editor._config.scale).toEqual(config.scale);
    expect(editor._config.formatting).toEqual(config.formatting);
    expect(editor._config.markers).toEqual(config.markers);
    await edit(editor, '#bar-color', '#4a9eff');
    expect(editor._config.bar.color).toBeUndefined();
    await edit(editor, '#bar-solid-fill', false, 'change');
    expect(editor._config.bar.solid_fill).toBeUndefined();
  });

  it('patches Scale parts without dropping bound metadata, other parts or inactive aliases', async () => {
    const config = raw();
    const { editor, events } = await setup(source, config);
    await edit(editor, '#scale-min', '12');
    expect(editor._config.scale.min).toEqual({ fixed: 12, entity: 'sensor.min', future_metadata: 'keep-me' });
    expect(editor._config.min).toBe(-10);
    expect(editor._config.min_entity).toBe('sensor.legacy_min');
    await edit(editor, 'input[data-kind="scale-min-entity-source"]', 'sensor.minimum');
    expect(editor._config.scale.min).toEqual({ fixed: 12, entity: 'sensor.minimum', future_metadata: 'keep-me' });
    const control = editor.shadowRoot.querySelector('#scale-min');
    editor.setConfig(events.at(-1).detail.config);
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelector('#scale-min')).toBe(control);
    await edit(editor, '#scale-min', '');
    expect(editor._config.scale.min).toEqual({ entity: 'sensor.minimum', future_metadata: 'keep-me' });
    await edit(editor, 'input[data-kind="scale-min-entity-source"]', '');
    expect(editor._config.scale.min).toEqual({ future_metadata: 'keep-me' });
    expect(editor._config.scale.max).toBe(100);
    expect(editor._config.bar).toEqual(config.bar);
    expect(editor._config.entity).toBeUndefined();
  });

  it('preserves scalar/legacy Scale syntax while editing only the owned source part', async () => {
    const { editor } = await setup(source, { type, min: 0, min_entity: 'sensor.minimum', scale: { max: 'sensor.maximum' } });
    await edit(editor, '#scale-min', '10');
    expect(editor._config.min).toBe(10);
    expect(editor._config.min_entity).toBe('sensor.minimum');
    await edit(editor, 'input[data-kind="scale-max-entity-source"]', 'sensor.new_maximum');
    expect(editor._config.scale.max).toBe('sensor.new_maximum');
    await edit(editor, '#scale-max', '100');
    expect(editor._config.scale.max).toEqual({ entity: 'sensor.new_maximum', fixed: 100 });
  });

  it('uses identical shared root templates and omits standalone/advanced controls and embedded runtime', async () => {
    const config = { type, scale: { min: 0, max: 100 }, formatting: { unit: 'W', decimal: 2 }, bar: { fill_style: 'gradient' } };
    const { editor } = await setup(source, config);
    const standalone = createEditor({ source });
    standalone.setConfig({ ...config, entity: 'sensor.parent' });
    vi.stubGlobal('customElements', { get: () => undefined });
    try {
      for (const render of [renderScaleSection, renderFormattingSection, renderBarAppearanceSection]) {
        expect(editor.shadowRoot.innerHTML).toContain(render(editor._createSectionContext(), { type: 'card' }, undefined, { animation: true, cssText: true }));
      }
      for (const render of [renderScaleSection, renderFormattingSection]) {
        expect(standalone.shadowRoot.innerHTML).toContain(render(standalone._createSectionContext(), { type: 'card' }));
      }
    } finally { vi.unstubAllGlobals(); }
    for (const excluded of ['id="title"', 'data-kind="entity-name"', 'add-entity', 'entity-0-', 'layout-height', 'hero-size', '<sensor-bar-card-plus-feature']) {
      expect(editor.shadowRoot.innerHTML).not.toContain(excluded);
    }
  });

  it('keeps mounted controls and avoids duplicate events through config echoes and unrelated replacements', async () => {
    const { editor, events } = await setup(source);
    const unit = editor.shadowRoot.querySelector('#formatting-unit');
    await edit(editor, '#formatting-unit', 'W');
    editor.setConfig(events[0].detail.config);
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelector('#formatting-unit')).toBe(unit);
    await edit(editor, '#formatting-unit', 'W', 'change');
    expect(events).toHaveLength(1);
    editor.setConfig({ type, extra: true, formatting: { unit: 'kW' } });
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelector('#formatting-unit')).toBe(unit);
    expect(unit.value).toBe('kW');
    expect(events).toHaveLength(1);
  });

  it('accepts all hass/context/config arrival orders without emitting or writing inherited state', async () => {
    for (const order of [['config', 'hass', 'context'], ['config', 'context', 'hass'], ['hass', 'config', 'context'], ['hass', 'context', 'config'], ['context', 'config', 'hass'], ['context', 'hass', 'config']]) {
      const { featureEditor: Editor } = loadCardClass({ source });
      const editor = new Editor();
      const emit = vi.fn();
      editor.dispatchEvent = emit;
      for (const input of order) {
        if (input === 'config') editor.setConfig({ type });
        if (input === 'hass') editor.hass = { states: {} };
        if (input === 'context') editor.context = { entity_id: 'sensor.parent' };
        await editor.updateComplete;
      }
      expect(editor._effectiveEntity).toBe('sensor.parent');
      expect(editor._config).toEqual({ type });
      expect(emit).not.toHaveBeenCalled();
    }
  });

  it('cancels pending rendering on disconnect and resumes without duplicate listeners', async () => {
    const { editor, events } = await setup(source);
    const render = vi.spyOn(editor, '_render');
    editor.context = { entity_id: 'sensor.changed' };
    editor.disconnectedCallback();
    await editor.updateComplete;
    expect(render).not.toHaveBeenCalled();
    editor.connectedCallback();
    await editor.updateComplete;
    expect(editor._effectiveEntity).toBe('sensor.changed');
    await edit(editor, '#formatting-unit', 'W');
    expect(events).toHaveLength(1);
  });
});

describe('Feature Scale patch ownership', () => {
  it.each([
    [{ scale: { min: { value: 0, future: true } } }, 'fixed', '10', { scale: { min: { value: 10, future: true } } }],
    [{ scale: { min: { fixed: 10, value: 2, entity: 'sensor.min', future: true } } }, 'fixed', '', { scale: { min: { entity: 'sensor.min', future: true } } }],
    [{ scale: { min: 0, extra: true } }, 'fixed', '', { scale: { extra: true } }],
    [{ min: 0, min_entity: 'sensor.min', max: 100 }, 'entity', '', { min: 0, max: 100 }],
    [{ scale: { min: 0 } }, 'entity', 'sensor.min', { scale: { min: { fixed: 0, entity: 'sensor.min' } } }],
    [{ scale: { min: null, extra: true } }, 'fixed', '', { scale: { min: null, extra: true } }],
  ])('preserves the untouched representation/parts in %j', (config, part, value, expected) => {
    const before = JSON.stringify(config);
    expect(patchFeatureScaleSource(config, 'min', part, value)).toEqual(expected);
    expect(JSON.stringify(config)).toBe(before);
  });

  it('renders and edits identically in source/dist and picker/fallback modes', async () => {
    for (const withEntityPicker of [false, true]) {
      for (const config of [{ type }, raw(), { type, entity: 'sensor.override', bar: { color: 'var(--accent-color)' } }]) {
        const a = await setup('src', config, { entity_id: 'sensor.parent' }, withEntityPicker);
        const b = await setup('dist', config, { entity_id: 'sensor.parent' }, withEntityPicker);
        expect(a.editor.shadowRoot.innerHTML).toBe(b.editor.shadowRoot.innerHTML);
        await edit(a.editor, '#formatting-unit', 'W');
        await edit(b.editor, '#formatting-unit', 'W');
        expect(a.events.at(-1).detail.config).toEqual(b.events.at(-1).detail.config);
      }
    }
  });
});
