import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const type = 'custom:sensor-bar-card-plus-feature', root = { type: 'card' };
const meta = () => ({ future: { values: [undefined, { keep: true }], unset: undefined }, unset: undefined });
const extremum = () => ({ enabled: true, color: 'red', direction: 'outward', reset: { mode: 'duration', duration: '15m', ...meta() },
  label: { show: true, text: 'Energy', show_value: false, show_unit: false, decimal: 3, entity: 'sensor.unsupported', value: true, unit: true, ...meta() }, ...meta() });
const raw = () => ({ type, peak: extremum(), floor: extremum(), ...meta(),
  target: { at: '75%', label: { show: true }, ...meta() }, baseline: { at: '50%', ...meta() },
  bar: { needle: true, animated: false, fill_style: 'gradient', segments: [{ from: 50, color: 'red' }, { from: 0, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }] },
  markers: [{ at: 25, label: { entity: 'sensor.marker' }, ...meta() }],
});
async function setup(source, config = raw(), withEntityPicker = false) {
  const classes = loadCardClass({ source, withEntityPicker });
  const editor = new classes.featureEditor(), events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
  editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} }; await editor.updateComplete;
  return { classes, editor, events };
}
async function edit(editor, field, value) {
  const control = editor.shadowRoot.querySelector(`[data-field="${field}"]`);
  expect(control).toBeTruthy();
  if (control.type === 'checkbox') control.checked = value; else control.value = value;
  editor._handleField({ type: 'change', target: control }); await editor.updateComplete;
}
for (const source of ['src', 'dist']) describe(`Feature extrema (${source})`, () => {
  for (const key of ['peak', 'floor']) {
    for (const marker of [undefined, { enabled: false }, { reset: ' 01M ' }, { reset: 'quarterly' }, extremum()]) it(`${key}: preserves raw reset, aliases and metadata on open/context/unrelated edit: ${JSON.stringify(marker)}`, async () => {
      const config = raw(); config[key] = marker;
      const { editor, events } = await setup(source, config);
      expect(editor._config).toEqual(config); expect(events).toHaveLength(0);
      editor.context = { entity_id: 'sensor.new' }; editor.hass = { states: {} }; editor.setConfig(config); await editor.updateComplete;
      expect(events).toHaveLength(0);
      for (const [field, value] of [['formatting-unit', 'W'], ['bar-needle-mode', 'disabled'], ['baseline-mode', 'enabled'], ['target-mode', 'disabled'], ['bar-color', '#123456'], ['bar-fill-style', 'bands']]) await edit(editor, field, value);
      expect(editor._config[key]).toEqual(marker); expect(editor._config).not.toHaveProperty('entity');
    });
    for (const [suffix, value, path, stored] of [
      ['show', false, ['enabled'], false], ['color', '#123456', ['color'], '#123456'], ['direction', 'inward', ['direction'], 'inward'],
      ['reset', '15m', ['reset'], '15m'], ['label-text', 'New energy', ['label', 'text'], 'New energy'],
      ['label-show', false, ['label', 'show'], false], ['label-show-value', true, ['label', 'show_value'], true],
      ['label-show-unit', true, ['label', 'show_unit'], true], ['label-precision', '2', ['label', 'precision'], 2],
    ]) it(`${key}: patches only ${suffix}, preserving other extrema, controls and unknown metadata`, async () => {
      const config = raw(), { editor, events } = await setup(source, config);
      await edit(editor, `${key}-${suffix}`, value);
      const expected = structuredClone(config);
      let container = expected[key]; for (const part of path.slice(0, -1)) container = container[part];
      container[path.at(-1)] = stored;
      if (suffix === 'label-precision') delete expected[key].label.decimal;
      expect(editor._config).toEqual(expected); expect(events).toHaveLength(1);
      expect(Object.hasOwn(editor._config[key].future, 'unset')).toBe(true);
      expect(editor._config[key].label.entity).toBe('sensor.unsupported');
      editor.setConfig(events[0]); editor.context = { entity_id: 'sensor.changed' }; await editor.updateComplete;
      expect(events).toHaveLength(1); expect(editor._config).toEqual(expected);
    });
    it(`${key}: opens absent without defaults and retains explicit enabled/disabled/default labels only on edit`, async () => {
      const { editor, events } = await setup(source, { type });
      expect(editor._config).toEqual({ type }); expect(events).toHaveLength(0);
      expect(editor.shadowRoot.querySelector(`#${key}-show`).checked).toBe(false);
      expect(editor.shadowRoot.querySelector(`#${key}-reset`).value).toBe('never');
      await edit(editor, `${key}-show`, true); expect(editor._config[key]).toEqual({ enabled: true });
      await edit(editor, `${key}-show`, false); expect(editor._config[key]).toEqual({ enabled: false });
      await edit(editor, `${key}-label-show-unit`, true); expect(editor._config[key]).toEqual({ enabled: false, label: { show_unit: true } });
    });
    it(`${key}: accepts all exposed presets and duration boundaries, rejects invalid reset events without emissions`, async () => {
      const { editor, events } = await setup(source);
      for (const reset of ['never', 'quarterly', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', ...Array.from({ length: 59 }, (_, i) => `${i + 1}m`), ...Array.from({ length: 23 }, (_, i) => `${i + 1}h`), ' 01M ']) {
        const before = events.length; await edit(editor, `${key}-reset`, reset);
        expect(editor._config[key].reset).toBe(reset.trim().toLowerCase()); expect(events).toHaveLength(before + 1);
      }
      const config = structuredClone(editor._config), count = events.length;
      for (const reset of ['0m', '60m', '0h', '24h', '1s', '2d', 'cron', 'duration', '[object Object]']) await edit(editor, `${key}-reset`, reset);
      expect(editor._config).toEqual(config); expect(events).toHaveLength(count);
      expect(editor._extremaSection._resetDrafts).toBeUndefined();
    });
    it(`${key}: clears only owned color/text/precision and legacy decimal; invalid precision remains local`, async () => {
      const config = raw(), { editor } = await setup(source, config);
      expect(editor.shadowRoot.querySelector(`#${key}-label-precision`).value).toBe('3');
      await edit(editor, `${key}-color`, '#888888'); await edit(editor, `${key}-label-text`, ''); await edit(editor, `${key}-label-precision`, '');
      const expected = structuredClone(config); delete expected[key].color; delete expected[key].label.text; delete expected[key].label.decimal;
      expect(editor._config).toEqual(expected);
      await edit(editor, `${key}-label-precision`, '-1'); expect(editor._config).toEqual(expected);
      await edit(editor, `${key}-label-precision`, '0'); expect(editor._config[key].label.precision).toBe(0);
    });
    it(`${key}: foreign replacement resets displayed values without emitting or creating runtime history`, async () => {
      const { editor, events } = await setup(source);
      await edit(editor, `${key}-label-text`, 'Edited');
      editor.setConfig({ type, [key]: { reset: 'daily', label: { text: 'Foreign' } } }); await editor.updateComplete;
      expect(editor.shadowRoot.querySelector(`#${key}-label-text`).value).toBe('Foreign');
      expect(editor.shadowRoot.querySelector(`#${key}-reset`).value).toBe('daily'); expect(events).toHaveLength(1);
      expect(editor._peakState).toBeUndefined(); expect(editor._floorState).toBeUndefined();
    });
  }
  it('palette item edits preserve both complete extrema including unsupported reset objects', async () => {
    const config = raw(), { editor } = await setup(source, config);
    for (const [style, kind] of [['gradient', 'gradient'], ['bands', 'segment']]) {
      await edit(editor, 'bar-fill-style', style);
      const control = editor.shadowRoot.querySelectorAll(`input[data-kind="${kind}-color"]`)[0];
      expect(control).toBeTruthy(); control.value = '#123456';
      editor._handleField({ type: 'input', target: control }); await editor.updateComplete;
      expect(editor._config.peak).toEqual(config.peak); expect(editor._config.floor).toEqual(config.floor);
    }
  });
  it('preserves Peak legacy metadata and independent aliases; enabled owns show, color owns color, reset owns no aliases', async () => {
    const config = raw(); config.show_peak = true; config.peak_color = 'blue'; config.peak_marker = { show: true, color: 'blue', direction: 'outward', ...meta() };
    const { editor } = await setup(source, config);
    await edit(editor, 'peak-reset', 'daily'); expect(editor._config.peak_marker).toEqual(config.peak_marker); expect(editor._config.show_peak).toBe(true);
    await edit(editor, 'peak-show', false); expect(editor._config.peak_marker).toEqual({ ...config.peak_marker, show: false });
    expect(editor.shadowRoot.querySelector('#peak-show').checked).toBe(false); expect(editor._config).not.toHaveProperty('show_peak'); expect(editor._config.peak_color).toBe('blue');
    await edit(editor, 'peak-show', true); expect(editor.shadowRoot.querySelector('#peak-show').checked).toBe(true);
    await edit(editor, 'peak-color', '#123456'); expect(editor._config).not.toHaveProperty('peak_color');
    const marker = structuredClone(config.peak_marker); delete marker.color;
    expect(editor._config.peak_marker).toEqual(marker); expect(editor._config.floor).toEqual(config.floor);
  });
  it('shares the same section and templates with standalone for both extrema; picker availability does not change controls', async () => {
    const { editor, classes } = await setup(source);
    const standalone = new classes.editor(); standalone.setConfig(raw());
    expect(editor._extremaSection.constructor).toBe(standalone._extremaSection.constructor);
    for (const key of ['peak', 'floor']) {
      expect(editor.shadowRoot.innerHTML).toContain(editor._extremaSection.render(root, key));
      expect(editor.shadowRoot.innerHTML).not.toContain(`${key}-label-entity`);
    }
  });
});
it('matches source/dist extrema templates with and without HA picker', async () => {
  for (const withEntityPicker of [false, true]) for (const key of ['peak', 'floor']) {
    const src = await setup('src', raw(), withEntityPicker), dist = await setup('dist', raw(), withEntityPicker);
    expect(src.editor._extremaSection.render(root, key)).toBe(dist.editor._extremaSection.render(root, key));
  }
});
