import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const type = 'custom:sensor-bar-card-plus-feature', root = { type: 'card' };
const meta = () => ({ future: { items: [undefined, { keep: true }], unset: undefined }, unset: undefined });
const raw = () => ({ type, ...meta(), target_color: 'blue', show_target_label: true, above_target_color: 'blue',
  target: { enabled: false, at: { fixed: 70, entity: 'sensor.t', ...meta() }, color: 'red', shape: 'triangle', direction: 'outward',
    label: { show: true, text: 'Goal', show_value: false, show_unit: false, precision: 1, decimal: 3, entity: 'sensor.unsupported', value: true, unit: true, ...meta() },
    when_exceeded: { fill_color: 'red', ...meta() }, ...meta() },
  baseline: { enabled: true, at: '50%', above: { color: 'red' }, future: true },
  bar: { needle: true, animated: false, fill_style: 'gradient', segments: [{ from: 50, color: 'red' }, { from: 0, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }] },
  peak: { enabled: true, future: true }, floor: { enabled: true }, markers: [{ at: 25, label: { entity: 'sensor.m' } }],
});
async function setup(source, config = raw(), withEntityPicker = false) {
  const classes = loadCardClass({ source, withEntityPicker });
  const editor = new classes.featureEditor(), events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
  editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} }; await editor.updateComplete;
  return { classes, editor, events };
}
async function edit(editor, selector, value, type = 'input') {
  const control = selector.startsWith('ha-entity-picker') ? editor.shadowRoot.querySelectorAll(selector)[0] : editor.shadowRoot.querySelector(selector);
  expect(control).toBeTruthy();
  if (control.type === 'checkbox') control.checked = value; else control.value = value;
  editor._handleField({ type, target: control, ...(type === 'value-changed' ? { detail: { value } } : {}) });
  await editor.updateComplete;
}
for (const source of ['src', 'dist']) describe(`Feature Target (${source})`, () => {
  for (const target of [undefined, 70, { at: 70 }, { at: '70%' }, { at: { percent: 70, ...meta() } }, { enabled: false, ...meta() }]) it(`preserves raw Target on open/context/unrelated edits: ${JSON.stringify(target)}`, async () => {
    const config = raw(); config.target = target;
    const { editor, events } = await setup(source, config);
    expect(editor._config).toEqual(config); expect(events).toHaveLength(0);
    editor.context = { entity_id: 'sensor.changed' }; editor.hass = { states: {} }; await editor.updateComplete;
    expect(editor._config).toEqual(config);
    await edit(editor, '#formatting-unit', 'W'); await edit(editor, '#bar-needle-mode', 'enabled', 'change');
    expect(editor._config.target).toEqual(target); expect(editor._config).not.toHaveProperty('entity');
  });
  for (const [field, value, path] of [
    ['target-color', '#123456', ['color']], ['target-shape', 'diamond', ['shape']], ['target-direction', 'inward', ['direction']],
    ['target-mode', 'enabled', ['enabled']], ['target-label-text', 'New goal', ['label', 'text']],
    ['target-label-show', false, ['label', 'show']], ['target-label-show-value', true, ['label', 'show_value']],
    ['target-label-show-unit', true, ['label', 'show_unit']], ['target-label-precision', '2', ['label', 'precision']],
    ['target-above-fill-color', '#123456', ['when_exceeded', 'fill_color']],
  ]) it(`patches only ${field}, preserving all nested metadata and other controls`, async () => {
    const config = raw(), { editor, events } = await setup(source, config);
    await edit(editor, `#${field}`, value, typeof value === 'boolean' || field.endsWith('mode') || field.endsWith('shape') || field.endsWith('direction') ? 'change' : 'input');
    const expected = structuredClone(config);
    let container = expected.target; for (const key of path.slice(0, -1)) container = container[key];
    const key = path.at(-1);
    if (field === 'target-shape') delete container[key];
    else container[key] = field === 'target-mode' ? true : field === 'target-label-precision' ? 2 : value;
    if (field === 'target-color') delete expected.target_color;
    if (field === 'target-label-show') delete expected.show_target_label;
    if (field === 'target-label-precision') delete expected.target.label.decimal;
    if (field === 'target-above-fill-color') delete expected.above_target_color;
    expect(editor._config).toEqual(expected); expect(events).toHaveLength(1);
    expect(Object.hasOwn(editor._config.target.label.future, 'unset')).toBe(true);
    expect(editor._config.target.label.entity).toBe('sensor.unsupported');
  });
  for (const mode of ['auto', 'disabled']) it(`owns only enabled for ${mode}`, async () => {
    const config = raw(); config.target.enabled = true;
    const { editor } = await setup(source, config); await edit(editor, '#target-mode', mode, 'change');
    const expected = structuredClone(config); if (mode === 'auto') delete expected.target.enabled; else expected.target.enabled = false;
    expect(editor._config).toEqual(expected);
  });
  it('clears owned label/color fields and aliases without normalizing other defaults', async () => {
    const config = raw(), { editor } = await setup(source, config);
    await edit(editor, '#target-label-text', ''); await edit(editor, '#target-label-precision', ''); await edit(editor, '#target-color', '#888888');
    const expected = structuredClone(config); delete expected.target.label.text; delete expected.target.label.precision; delete expected.target.label.decimal;
    delete expected.target.color; delete expected.target_color;
    expect(editor._config).toEqual(expected);
    await edit(editor, '#target-label-precision', '-1'); expect(editor._config).toEqual(expected);
  });
  for (const [part, value] of [['fixed', '75'], ['fixed', ''], ['entity', 'sensor.changed'], ['entity', '']]) it(`owns only source ${part}=${value}`, async () => {
    const config = raw(), { editor } = await setup(source, config);
    await edit(editor, part === 'fixed' ? '#target-value' : '#feature-target-entity', value);
    const expected = structuredClone(config); if (value === '') delete expected.target.at[part]; else expected.target.at[part] = part === 'fixed' ? 75 : value;
    expect(editor._config).toEqual(expected);
  });
  it('retains value aliases and percentage metadata while patching source components', async () => {
    const config = raw(); config.target.at = { value: 70, percent: 30, fallback: 10, ...meta() };
    const { editor } = await setup(source, config);
    await edit(editor, '#target-value', '75'); expect(editor._config.target.at).toEqual({ ...config.target.at, value: 75 });
    await edit(editor, '#feature-target-entity', 'sensor.changed'); await edit(editor, '#target-value', '');
    expect(editor._config.target.at).toEqual({ percent: 30, fallback: 10, ...meta(), entity: 'sensor.changed' });
  });
  for (const at of [70, 'sensor.t', '70%']) it(`keeps scalar source ${at} and promotes minimally for another component`, async () => {
    const config = raw(); config.target.at = at;
    const { editor } = await setup(source, config);
    await edit(editor, '#target-label-text', 'Edited'); await edit(editor, '#baseline-mode', 'disabled', 'change'); expect(editor._config.target.at).toBe(at);
    if (at === 'sensor.t') {
      await edit(editor, '#feature-target-entity', 'sensor.changed'); expect(editor._config.target.at).toBe('sensor.changed');
      await edit(editor, '#target-value', '75'); expect(editor._config.target.at).toEqual({ entity: 'sensor.changed', fixed: 75 });
    } else {
      if (at === '70%') { expect(editor.shadowRoot.querySelector('#target-value').value).toBe(''); await edit(editor, '#target-value', ''); expect(editor._config.target.at).toBe(at); }
      await edit(editor, '#feature-target-entity', 'sensor.changed'); expect(editor._config.target.at).toEqual({ [at === '70%' ? 'percent' : 'fixed']: 70, entity: 'sensor.changed' });
    }
    expect(editor.shadowRoot.innerHTML).not.toContain('target-percent');
  });
  it('preserves legacy scalar/aliases until owned editing requires object syntax', async () => {
    const config = raw(); config.target = 70; config.target_entity = 'sensor.t';
    const { editor } = await setup(source, config);
    await edit(editor, '#target-value', '75'); expect(editor._config.target).toBe(75);
    await edit(editor, '#feature-target-entity', 'sensor.changed'); expect(editor._config.target).toBe(75); expect(editor._config.target_entity).toBe('sensor.changed');
    await edit(editor, '#target-label-text', 'Goal');
    expect(editor._config.target).toEqual({ at: { fixed: 75, entity: 'sensor.changed' }, label: { text: 'Goal' } });
    expect(editor._config.target_entity).toBe('sensor.changed');
  });
  it('preserves disabled exceeded-fill drafts through echo and resets on foreign replacement', async () => {
    const config = raw(), { editor, events } = await setup(source, config);
    await edit(editor, '#target-above-fill-enabled', false, 'change');
    expect(editor._config.target.when_exceeded).toEqual(meta()); expect(editor._config.bar).toEqual(config.bar);
    const count = events.length;
    await edit(editor, '#target-above-fill-color', '#123456'); expect(events).toHaveLength(count);
    expect(editor._targetSection._getTargetAboveFillDraft(root)).toBe('#123456');
    editor.context = { entity_id: 'sensor.changed' }; editor.setConfig(editor._config); await editor.updateComplete;
    await edit(editor, '#target-above-fill-enabled', true, 'change'); expect(editor._config.target.when_exceeded.fill_color).toBe('#123456');
    editor.setConfig({ type, target: { at: 10 } }); await editor.updateComplete;
    expect(editor._targetSection._getTargetAboveFillDraft(root)).toBe('');
    await edit(editor, '#target-above-fill-enabled', true, 'change'); expect(editor._config.target.when_exceeded.fill_color).toBe('#000000');
  });
  it('uses authoritative HA picker events and ignores internal input/change', async () => {
    const { editor, events } = await setup(source, raw(), true);
    const selector = 'ha-entity-picker[data-kind="target-entity-source"]';
    const picker = editor.shadowRoot.querySelectorAll(selector)[0]; expect(picker.hass).toBe(editor.hass); expect(picker.label).toBe('Target entity');
    await edit(editor, selector, 'sensor.changed', 'input'); expect(events).toHaveLength(0);
    await edit(editor, selector, 'sensor.changed', 'value-changed'); expect(editor._config.target.at.entity).toBe('sensor.changed');
    await edit(editor, selector, undefined, 'value-changed'); expect(editor._config.target.at).not.toHaveProperty('entity'); expect(editor._config.target.at.fixed).toBe(70);
  });
  it('uses exactly the same Target controller and control template in both hosts', async () => {
    const { editor, classes } = await setup(source);
    const standalone = new classes.editor(); standalone.setConfig(raw());
    expect(editor._targetSection.constructor).toBe(standalone._targetSection.constructor);
    expect(editor.shadowRoot.innerHTML).toContain(editor._targetSection.render(root));
    expect(editor.shadowRoot.innerHTML).not.toContain('target-label-entity');
  });
  it('opens an absent Target without defaults, enables/disables it and retains label defaults only when edited', async () => {
    const { editor, events } = await setup(source, { type });
    expect(editor._config).toEqual({ type }); expect(events).toHaveLength(0);
    expect(editor.shadowRoot.querySelector('#target-mode').value).toBe('auto');
    await edit(editor, '#target-mode', 'enabled', 'change'); expect(editor._config.target).toEqual({ enabled: true });
    await edit(editor, '#target-mode', 'disabled', 'change'); expect(editor._config.target).toEqual({ enabled: false });
    await edit(editor, '#target-label-show-unit', true, 'change'); expect(editor._config.target.label).toEqual({ show_unit: true });
    await edit(editor, '#target-mode', 'auto', 'change'); expect(editor._config.target).toEqual({ label: { show_unit: true } });
  });
  it('adds a numeric fallback to percentage syntax while retaining its percentage component', async () => {
    const config = raw(); config.target.at = '70%';
    const { editor } = await setup(source, config);
    await edit(editor, '#target-value', '75'); expect(editor._config.target.at).toEqual({ percent: 70, fixed: 75 });
    await edit(editor, '#target-value', ''); expect(editor._config.target.at).toEqual({ percent: 70 });
  });
});

it('matches source/dist Target templates in picker/fallback environments', async () => {
  for (const withEntityPicker of [false, true]) {
    let expected;
    for (const source of ['src', 'dist']) {
      const { editor } = await setup(source, raw(), withEntityPicker);
      const html = editor._targetSection.render(root); expected ??= html; expect(html).toBe(expected);
    }
  }
});
