import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const type = 'custom:sensor-bar-card-plus-feature', root = { type: 'card' };
const metadata = () => ({ future: { list: [1, undefined, { keep: true }], unset: undefined }, extra: undefined });
const raw = () => ({ type, ...metadata(), color_mode: 'gradient', target: { at: '80%', unknown: true }, peak: { enabled: true }, floor: { enabled: true }, markers: [{ at: 25, extra: true }],
  scale: { min: 0, max: 100 },
  bar: { fill_style: 'bands', animated: false, ...metadata(), needle: { show: false, color: 'white', ...metadata() },
    segments: [{ from: 60, to: 100, color: 'red', unknown: true }, { from: 0, to: 60, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }],
  },
  baseline: { enabled: true, at: { entity: 'sensor.b', fixed: 0, fallback: 50, ...metadata() }, above: { color: 'red', ...metadata() }, below: { color: 'blue', ...metadata() }, ...metadata() },
});
async function setup(source, config = raw(), withEntityPicker = false) {
  const classes = loadCardClass({ source, withEntityPicker });
  const editor = new classes.featureEditor(), events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
  editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} }; await editor.updateComplete;
  return { editor, events, classes };
}
async function edit(editor, selector, value, type = 'input') {
  const control = selector.startsWith('ha-entity-picker[') || selector.startsWith('input[')
    ? editor.shadowRoot.querySelectorAll(selector)[0] : editor.shadowRoot.querySelector(selector);
  expect(control).toBeTruthy();
  if (control.type === 'checkbox') control.checked = value; else control.value = value;
  editor._handleField({ type, target: control, ...(type === 'value-changed' ? { detail: { value } } : {}) });
  await editor.updateComplete;
}
for (const source of ['src', 'dist']) describe(`Feature Needle/Baseline (${source})`, () => {
  for (const needle of [undefined, true, false, { show: true, color: '#fff' }, { show: false, color: 'red' }, { color: 'white', ...metadata() }]) {
    it(`preserves Needle representation on open, context and unrelated edits: ${JSON.stringify(needle)}`, async () => {
      const config = raw(); config.bar.needle = needle;
      const { editor, events } = await setup(source, config);
      expect(editor._config).toEqual(config); expect(events).toHaveLength(0);
      editor.context = { entity_id: 'sensor.changed' }; editor.hass = { states: {} }; await editor.updateComplete;
      expect(editor._config).toEqual(config);
      await edit(editor, '#formatting-unit', 'W');
      expect(editor._config.bar.needle).toEqual(needle); expect(editor._config.baseline).toEqual(config.baseline);
    });
  }
  for (const [field, value] of [['mode', 'enabled'], ['mode', 'disabled'], ['color', '#123456'], ['color', '#ffffff']]) {
    it(`patches Needle ${field} without touching Baseline, metadata, palettes or markers`, async () => {
      const config = raw(), { editor } = await setup(source, config);
      await edit(editor, `#bar-needle-${field}`, value, field === 'mode' ? 'change' : 'input');
      const expected = structuredClone(config);
      if (field === 'mode') expected.bar.needle.show = value === 'enabled';
      else if (value === '#ffffff') delete expected.bar.needle.color;
      else expected.bar.needle.color = value;
      expect(editor._config).toEqual(expected);
      expect(Object.hasOwn(editor._config.bar.needle.future, 'unset')).toBe(true);
    });
  }
  for (const boolean of [true, false]) it(`minimally converts boolean ${boolean} only when a color needs an object`, async () => {
    const config = raw(); config.bar.needle = boolean;
    const { editor } = await setup(source, config);
    await edit(editor, '#bar-needle-mode', boolean ? 'disabled' : 'enabled', 'change');
    expect(editor._config.bar.needle).toBe(!boolean);
    await edit(editor, '#bar-needle-color', '#123456');
    expect(editor._config.bar.needle).toEqual({ show: !boolean, color: '#123456' });
    expect(editor._config.baseline).toEqual(config.baseline);
  });
  it('enables an absent Needle without materializing disabled defaults and works with every fill style', async () => {
    const { editor, events } = await setup(source, { type });
    await edit(editor, '#bar-needle-mode', 'disabled', 'change'); expect(events).toHaveLength(0);
    await edit(editor, '#bar-needle-mode', 'enabled', 'change'); expect(editor._config.bar.needle).toBe(true);
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await edit(editor, '#bar-fill-style', style, 'change'); expect(editor.shadowRoot.querySelector('#bar-needle-mode')).toBeTruthy();
      expect(editor._config.bar.needle).toBe(true);
    }
  });
  for (const mode of ['auto', 'enabled', 'disabled']) it(`patches Baseline mode ${mode} and preserves Needle and source`, async () => {
    const config = raw(), { editor } = await setup(source, config);
    await edit(editor, '#baseline-mode', mode, 'change');
    const expected = structuredClone(config);
    if (mode === 'auto') delete expected.baseline.enabled; else expected.baseline.enabled = mode === 'enabled';
    expect(editor._config).toEqual(expected);
  });
  for (const direction of ['above', 'below']) it(`patches/toggles ${direction} color without losing nested metadata or Needle`, async () => {
    const config = raw(), { editor } = await setup(source, config);
    await edit(editor, `#baseline-${direction}-color`, '#123456');
    expect(editor._config.baseline[direction]).toEqual({ ...config.baseline[direction], color: '#123456' });
    await edit(editor, `#baseline-${direction}-color-enabled`, false, 'change');
    const expected = structuredClone(config); delete expected.baseline[direction].color;
    expect(editor._config).toEqual(expected);
    editor.context = { entity_id: 'sensor.changed' }; await editor.updateComplete;
    await edit(editor, `#baseline-${direction}-color-enabled`, true, 'change');
    expected.baseline[direction].color = '#123456'; expect(editor._config).toEqual(expected);
  });
  for (const [part, value] of [['fixed', '12'], ['entity', 'sensor.changed'], ['fixed', ''], ['entity', '']]) it(`patches only source ${part}=${value}`, async () => {
    const config = raw(), { editor, events } = await setup(source, config);
    await edit(editor, part === 'fixed' ? '#baseline-value' : '#feature-baseline-entity', value, value === '' ? 'change' : 'input');
    const expected = structuredClone(config);
    if (value === '') delete expected.baseline.at[part]; else expected.baseline.at[part] = part === 'fixed' ? 12 : value;
    expect(editor._config).toEqual(expected);
    expect(Object.hasOwn(editor._config.baseline.at.future, 'unset')).toBe(true);
    expect(editor._config.baseline.at.fallback).toBe(50); // Unknown literal fallback is not normalized into a known field.
    expect(events).toHaveLength(1);
    editor.setConfig(events[0]); await editor.updateComplete; expect(events).toHaveLength(1);
  });
  it('keeps value aliases, inactive fixed aliases and percent metadata while editing one source part', async () => {
    const config = raw(); config.baseline.at = { value: 5, entity: 'sensor.b', ...metadata() };
    const { editor } = await setup(source, config);
    await edit(editor, '#baseline-value', '8');
    expect(editor._config.baseline.at).toEqual({ ...config.baseline.at, value: 8 });
    editor.setConfig({ ...config, baseline: { ...config.baseline, at: { fixed: 10, value: 5, percent: 30, ...metadata() } } }); await editor.updateComplete;
    await edit(editor, '#feature-baseline-entity', 'sensor.c');
    expect(editor._config.baseline.at).toEqual({ fixed: 10, value: 5, percent: 30, ...metadata(), entity: 'sensor.c' });
    await edit(editor, '#baseline-value', '', 'change');
    expect(editor._config.baseline.at).toEqual({ percent: 30, ...metadata(), entity: 'sensor.c' });
  });
  for (const at of [25, 'sensor.b', '50%', { percent: 50, ...metadata() }]) it(`preserves source representation ${JSON.stringify(at)} through unrelated Baseline/Needle edits`, async () => {
    const config = raw(); config.baseline.at = at;
    const { editor } = await setup(source, config);
    await edit(editor, '#baseline-above-color', '#123456');
    await edit(editor, '#bar-needle-mode', 'enabled', 'change');
    expect(editor._config.baseline.at).toEqual(at);
    if (at === '50%' || typeof at === 'object') {
      expect(editor.shadowRoot.querySelector('#baseline-value').value).toBe('');
      expect(editor.shadowRoot.innerHTML).toContain('baseline-percent');
    }
  });
  it('promotes only the source that needs another part, preserving scalar/percentage semantics', async () => {
    const config = raw(); config.baseline.at = 25;
    const { editor } = await setup(source, config);
    await edit(editor, '#baseline-value', '30'); expect(editor._config.baseline.at).toBe(30);
    await edit(editor, '#feature-baseline-entity', 'sensor.c'); expect(editor._config.baseline.at).toEqual({ fixed: 30, entity: 'sensor.c' });
    editor.setConfig({ ...config, baseline: { ...config.baseline, at: '50%' } }); await editor.updateComplete;
    await edit(editor, '#baseline-value', '', 'change'); expect(editor._config.baseline.at).toBe('50%');
    await edit(editor, '#feature-baseline-entity', 'sensor.c'); expect(editor._config.baseline.at).toEqual({ percent: 50, entity: 'sensor.c' });
  });
  it('promotes legacy Baseline scalars only for a field that requires an object', async () => {
    const config = raw(); config.baseline = 20;
    const { editor } = await setup(source, config);
    await edit(editor, '#baseline-value', '30'); expect(editor._config.baseline).toBe(30);
    await edit(editor, '#baseline-mode', 'disabled', 'change'); expect(editor._config.baseline).toEqual({ at: 30, enabled: false });
    await edit(editor, '#baseline-above-color', '#123456'); expect(editor._config.baseline).toEqual({ at: 30, enabled: false, above: { color: '#123456' } });
    expect(editor._config.bar.needle).toEqual(config.bar.needle);
  });
  it('explicit removal owns Baseline only and does not touch Needle', async () => {
    const config = raw(), { editor, events } = await setup(source, config);
    const target = { dataset: { action: 'remove-baseline', scopeType: 'card' } };
    expect(editor._baselineSection.handleClick(target)).toBe(true); await editor.updateComplete;
    const expected = structuredClone(config); delete expected.baseline;
    expect(editor._config).toEqual(expected); expect(events).toHaveLength(1);
  });
  it('handles authoritative HA picker events, including clear, and ignores internal input/change', async () => {
    const config = raw(), { editor, events } = await setup(source, config, true);
    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="baseline-entity-source"]')[0];
    expect(picker.label).toBe('Baseline entity'); expect(picker.hass).toBe(editor.hass);
    await edit(editor, 'ha-entity-picker[data-kind="baseline-entity-source"]', 'sensor.c', 'input'); expect(events).toHaveLength(0);
    await edit(editor, 'ha-entity-picker[data-kind="baseline-entity-source"]', 'sensor.c', 'value-changed');
    expect(editor._config.baseline.at.entity).toBe('sensor.c');
    await edit(editor, 'ha-entity-picker[data-kind="baseline-entity-source"]', undefined, 'value-changed');
    expect(editor._config.baseline.at).not.toHaveProperty('entity'); expect(editor._config.baseline.at.fixed).toBe(0);
  });
  it('keeps both editors on the exact same shared controllers and templates', async () => {
    const { editor, classes } = await setup(source);
    const standalone = new classes.editor(); standalone.setConfig(raw());
    for (const key of ['_needleSection', '_baselineSection']) {
      expect(editor[key].constructor).toBe(standalone[key].constructor);
      expect(editor.shadowRoot.innerHTML).toContain(editor[key].render(root));
    }
    expect(editor.shadowRoot.innerHTML).toContain(editor._baselineSection.render(root, options => editor._renderCardGroup(options)));
    expect(editor.shadowRoot.innerHTML).not.toContain('disabled="disabled"');
  });
  it('leaves visibility precedence to runtime and restores Needle when Baseline fails to resolve', async () => {
    const { editor, classes } = await setup(source);
    await edit(editor, '#bar-needle-mode', 'enabled', 'change');
    const feature = new classes.feature(); feature._render = () => {}; feature.setConfig(editor._config); feature.context = { entity_id: 'sensor.a' };
    feature.hass = { states: { 'sensor.a': { state: '30', attributes: {} }, 'sensor.b': { state: '10', attributes: {} } } };
    await feature.updateComplete;
    expect(feature._row.needle.show).toBe(false); expect(feature._row.baselineVisible).toBe(true);
    await edit(editor, '#baseline-value', '', 'change');
    feature.setConfig(editor._config); feature.hass = { states: { 'sensor.a': { state: '30', attributes: {} }, 'sensor.b': { state: 'unavailable', attributes: {} } } };
    await feature.updateComplete;
    expect(feature._row.needle.show).toBe(true); expect(feature._row.baselineVisible).toBe(false);
  });
});

it('matches source/dist Needle/Baseline templates in picker and fallback environments', async () => {
  for (const withEntityPicker of [false, true]) {
    let expected;
    for (const source of ['src', 'dist']) {
      const { editor } = await setup(source, raw(), withEntityPicker);
      const html = editor._needleSection.render(root) + editor._baselineSection.render(root);
      expected ??= html; expect(html).toBe(expected);
    }
  }
});
