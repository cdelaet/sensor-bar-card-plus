import { expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel, getColor, getSegmentsForRendering } from '../../src/view-model/bar-render-model.js';
import { renderBar } from '../../src/render/bar-renderer.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';
import { loadCardClass } from '../support/load-card-class.cjs';

const entity = 'sensor.power';
const segments = [{ from: 0, to: '40%', color: '#123456' }, { from: '60%', to: 200, color: '#abcdef' }];
const gradient_stops = [{ pos: 0, color: '#123456', extra: true }, { pos: 100, color: '#abcdef' }];
const state = value => ({ state: String(value), attributes: {} });
for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) for (const solid_fill of [false, true]) {
  for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
    it(`canonical ${fill_style}, sampled ${solid_fill}, Scale ${scaleDirection}, Bar ${barDirection}`, () => {
      const paint = { fill_style, color: '#556677', solid_fill, segments, gradient_stops };
      const raw = { entities: [entity], scale: { max: { entity: 'sensor.maximum' }, direction: scaleDirection }, bar: { direction: barDirection } };
      const legacy = normalizeCardConfig({ ...raw, bar: { ...raw.bar, ...paint } });
      const grouped = normalizeCardConfig({ ...raw, bar: { ...raw.bar, paint: { ...paint, opacity: 100 } } });
      const original = structuredClone(grouped.entities[0].bar.paint);
      // Make the compatibility fields disagree: runtime must use canonical paint.
      Object.assign(grouped.entities[0].bar, { color: 'red', fill_style: 'solid', solid_fill: true, segments: [], gradient_stops: [] });
      for (const max of [100, 200]) {
        const hass = { states: { [entity]: state(75), 'sensor.maximum': state(max) } };
        const row = buildRowViewModel({ hass, entityConfig: grouped.entities[0], entityState: hass.states[entity] });
        const expected = buildRowViewModel({ hass, entityConfig: legacy.entities[0], entityState: hass.states[entity] });
        expect(renderBar(buildBarRenderModel(row, grouped.entities[0], { height: 30 })))
          .toBe(renderBar(buildBarRenderModel(expected, legacy.entities[0], { height: 30 })));
        expect(getColor(row.percent, grouped.entities[0], 0, max)).toBe(getColor(expected.percent, legacy.entities[0], 0, max));
        expect(getSegmentsForRendering(grouped.entities[0], 0, max)).toEqual(getSegmentsForRendering(legacy.entities[0], 0, max));
      }
      expect(grouped.entities[0].bar.paint).toEqual(original);
    });
  }
}

async function setup(source, host, config) {
  const classes = loadCardClass({ source });
  const editor = new (host === 'Card' ? classes.editor : classes.featureEditor)();
  const events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
  editor.setConfig(host === 'Card' ? { entities: [entity], ...config } : { type: 'custom:sensor-bar-card-plus-feature', ...config });
  await editor.updateComplete;
  return { editor, events, config: () => editor._draftConfig ?? editor._config };
}
async function edit(editor, id, value, type = 'input') {
  const control = editor.shadowRoot.querySelector(`#${id}`);
  expect(control).toBeTruthy();
  if (typeof value === 'boolean') control.checked = value;
  else control.value = value;
  control.dispatchEvent({ type }); await editor.updateComplete;
}
for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  it(`${host} edits grouped and mixed paint without changing unrelated legacy values (${source})`, async () => {
    const raw = { extra: { keep: true }, bar: { color: 'red', fill_style: 'gradient', solid_fill: true,
      segments, gradient_stops, direction: 'reverse', future: true, paint: { color: null, future: { keep: true }, opacity: 40 } } };
    const original = structuredClone(raw);
    const state = await setup(source, host, raw), { editor } = state;
    expect(state.events).toHaveLength(0);
    expect(editor.shadowRoot.querySelector('#bar-fill-style').value).toBe('gradient');
    await edit(editor, 'bar-color', '#4a9eff');
    expect(state.config().bar.paint.color).toBe('#4a9eff');
    expect(state.config().bar.color).toBeUndefined();
    expect(state.config().bar.fill_style).toBe('gradient');
    expect(state.config().bar.paint.future).toEqual({ keep: true });
    await edit(editor, 'bar-solid-fill', false, 'change');
    expect(state.config().bar.paint.solid_fill).toBe(false);
    expect(state.config().bar.solid_fill).toBeUndefined();
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) await edit(editor, 'bar-fill-style', style, 'change');
    expect(state.config().bar.paint.fill_style).toBe('band_gradient');
    expect(state.config().bar.fill_style).toBeUndefined();
    const scope = { type: 'card' };
    editor._segmentsSection._setScopedSegments(scope, [], { rerender: true }, { type: 'remove', index: 0 });
    // Feature applies one raw item operation; remove the remaining item too.
    if (host === 'Feature') editor._segmentsSection._setScopedSegments(scope, [], { rerender: true }, { type: 'remove', index: 0 });
    await editor.updateComplete;
    expect(state.config().bar.paint.segments).toEqual([]);
    expect(state.config().bar.segments).toBeUndefined();
    const saved = structuredClone(state.config()); editor.setConfig(saved); await editor.updateComplete;
    expect(state.config()).toEqual(saved);
    expect(normalizeCardConfig({ ...saved, entities: [entity] }).bar.paint).toMatchObject({ solid_fill: false, segments: [], opacity: 40 });
    expect(raw).toEqual(original);
    expect(validateNormalizedConfig(normalizeCardConfig({ ...saved, entities: [entity] })).warnings.filter(warning => warning.code === 'paint.invalid_value')).toEqual([]);
  });
  it(`${host} repairs a null grouped destination only on an explicit edit (${source})`, async () => {
    const s = await setup(source, host, { bar: { paint: null, future: true } });
    expect(s.config().bar.paint).toBeNull(); expect(s.events).toHaveLength(0);
    await edit(s.editor, 'bar-fill-style', 'solid', 'change');
    expect(s.config().bar).toEqual({ future: true, paint: { fill_style: 'solid' } });
    expect(s.events).toHaveLength(1);
  });
}

it('Card entity grouped overrides inherit per property and clear without copying parent paint', async () => {
  const parent = { color: 'red', fill_style: 'gradient', solid_fill: true, segments, gradient_stops };
  const s = await setup('src', 'Card', { bar: { paint: parent }, entities: [{ entity, bar: { paint: { color: null } }, future: true }] });
  expect(s.editor._getEffectiveScopedBarColorValue({ type: 'entity', index: 0 })).toBe('red');
  await edit(s.editor, 'entity-0-bar-solid-fill', false, 'change');
  await edit(s.editor, 'entity-0-bar-color', '#4a9eff');
  expect(s.config().entities[0].bar.paint).toEqual({ color: '#4a9eff', solid_fill: false });
  const normalized = normalizeCardConfig(s.config()).entities[0].bar.paint;
  expect(normalized).toMatchObject({ color: '#4a9eff', solid_fill: false, fill_style: 'gradient' });
  await edit(s.editor, 'entity-0-bar-inherit', true, 'change');
  expect(s.config().entities[0]).toEqual({ entity, future: true });
  expect(s.config().bar.paint).toEqual(parent);
});

for (const host of ['Card', 'Feature']) it(`${host} preserves explicit default blue and false while editing legacy paint`, async () => {
  const s = await setup('src', host, { bar: { color: 'red', solid_fill: true } });
  await edit(s.editor, 'bar-color', '#4a9eff');
  await edit(s.editor, 'bar-solid-fill', false, 'change');
  expect(s.config().bar).toEqual({ color: '#4a9eff', solid_fill: false });
  expect(normalizeCardConfig({ ...s.config(), entities: [entity] }).bar.paint).toMatchObject({ color: '#4a9eff', solid_fill: false });
});

it('does not let legacy default elision make a child override ineffective', async () => {
  const s = await setup('src', 'Card', { bar: { color: 'red', solid_fill: true }, entities: [{ entity, bar: { color: 'green' } }] });
  await edit(s.editor, 'entity-0-bar-color', '#4a9eff');
  await edit(s.editor, 'entity-0-bar-solid-fill', false, 'change');
  expect(normalizeCardConfig(s.config()).entities[0].bar.paint).toMatchObject({ color: '#4a9eff', solid_fill: false });
});

it('Card save preserves grouped percentage coordinates while cleaning a legacy coordinate hint', async () => {
  const s = await setup('src', 'Card', { bar: { segment_space: 'percent', paint: { fill_style: 'bands', segments: [{ from: 25, to: 75, color: 'red' }] } } });
  const before = normalizeCardConfig(s.config()).entities[0].bar.paint.segments;
  await edit(s.editor, 'title', 'Saved');
  expect(s.events.at(-1).bar.segment_space).toBeUndefined();
  expect(s.events.at(-1).bar.paint.segments[0]).toMatchObject({ from: '25%', to: '75%' });
  expect(normalizeCardConfig(s.events.at(-1)).entities[0].bar.paint.segments).toEqual(before);
});
for (const host of ['Card', 'Feature']) it(`${host} promotes Severity percentages without changing their coordinate meaning`, async () => {
  const s = await setup('src', host, { severity: [{ from: 0, to: 100, color: 'red', future: true }], bar: { paint: {} } });
  s.editor._segmentsSection._setScopedSegments({ type: 'card' }, [{ from: 0, to: 100, color: 'blue', future: true }], {}, { type: 'edit', index: 0, field: 'color', value: 'blue' });
  await s.editor.updateComplete;
  expect(s.config().bar.paint.segments[0]).toMatchObject({ from: '0%', to: '100%', color: 'blue', future: true });
  expect(s.config().severity).toBeUndefined();
});

it('promotes inherited legacy Severity to an entity grouped palette without rescaling it', async () => {
  const s = await setup('src', 'Card', { severity: [{ from: 0, to: 100, color: 'red' }], scale: { min: 0, max: 200 }, entities: [{ entity, bar: { paint: {} } }] });
  const control = s.editor.shadowRoot.querySelectorAll('input[data-kind="entity-segment-color"]')[0];
  control.value = '#abcdef';
  control.dispatchEvent({ type: 'input' }); control.dispatchEvent({ type: 'change' });
  expect(s.config().entities[0].bar.paint.segments).toEqual([{ from: '0%', to: '100%', color: '#abcdef' }]);
  const row = normalizeCardConfig(s.config()).entities[0];
  expect(getSegmentsForRendering(row, 0, 200)).toMatchObject([{ from: 0, to: 100, color: '#abcdef' }]);
  expect(s.config().severity).toEqual([{ from: 0, to: 100, color: 'red' }]);
});

it('keeps inherited explicit empty palettes empty in entity controls', async () => {
  const s = await setup('src', 'Card', { bar: { paint: { fill_style: 'gradient', gradient_stops: [], segments: [] } }, entities: [{ entity, bar: { paint: {} } }] });
  const scope = { type: 'entity', index: 0 };
  expect(s.editor._gradientStopsSection._getScopedGradientStopsValue(scope)).toEqual([]);
  expect(s.editor._segmentsSection._getScopedSegmentsValue(scope)).toEqual([]);
  expect(s.events).toHaveLength(0);
});
