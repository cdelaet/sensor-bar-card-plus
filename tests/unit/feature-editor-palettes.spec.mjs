import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const root = { type: 'card' };
const type = 'custom:sensor-bar-card-plus-feature';
const metadata = () => ({ flag: true, nested: { array: [1, undefined, { deep: true }], empty: undefined }, extra: undefined });
const raw = style => ({ type, extra: metadata(), target: { at: '80%' }, markers: [{ at: 10 }],
  bar: { fill_style: style, extra: metadata(), animated: false, needle: { show: true },
    segments: [{ from: '60%', to: '100%', color: '#123456', ...metadata() }, { from: 0, to: 50, color: '#abcdef', ...metadata() }],
    gradient_stops: [{ pos: '80%', color: ' red ', ...metadata() }, { pos: 0, color: '#abcdef', ...metadata() }],
  },
});
async function setup(source, config) {
  const editor = new (loadCardClass({ source }).featureEditor)();
  const events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
  editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; await editor.updateComplete;
  return { editor, events, segment: editor._segmentsSection, gradient: editor._gradientStopsSection };
}
async function field(editor, kind, index, value, type = 'change') {
  const control = editor.shadowRoot.querySelectorAll(`input[data-kind="${kind}"]`)[index];
  expect(control).toBeTruthy(); control.value = value;
  editor._handleField({ type, target: control }); await editor.updateComplete;
}
for (const source of ['src', 'dist']) describe(`shared Feature palettes (${source})`, () => {
  for (const style of ['bands', 'soft_bands', 'band_gradient', 'gradient', 'solid']) it(`only composes the applicable palette for ${style}`, async () => {
    const { editor, events } = await setup(source, raw(style));
    expect(editor.shadowRoot.innerHTML.includes('id="segment-draft-from"')).toBe(['bands', 'soft_bands', 'band_gradient'].includes(style));
    expect(editor.shadowRoot.innerHTML.includes('id="gradient-draft-pos"')).toBe(style === 'gradient');
    expect(events).toHaveLength(0);
  });
  for (const [kind, fieldName, value] of [['segment', 'from', '65%'], ['segment', 'to', '95%'], ['segment', 'color', '#333333'], ['gradient', 'pos', '90%'], ['gradient', 'color', 'blue']]) {
    it(`patches only ${kind}.${fieldName} and preserves order, exact untouched values and all metadata`, async () => {
      const original = raw(kind === 'segment' ? 'bands' : 'gradient');
      const { editor, events } = await setup(source, original);
      await field(editor, `${kind}-${fieldName}`, 0, value);
      const key = kind === 'segment' ? 'segments' : 'gradient_stops';
      const expected = structuredClone(original);
      expected.bar[key][0][fieldName] = fieldName === 'pos' ? 90 : value;
      expect(editor._config).toEqual(expected);
      expect(Object.hasOwn(editor._config.bar[key][0], 'extra')).toBe(true);
      expect(Object.hasOwn(editor._config.bar[key][0].nested, 'empty')).toBe(true);
      expect(editor._config.bar[key][0].nested.array[1]).toBeUndefined();
      expect(events).toHaveLength(1);
      editor.setConfig(events[0]); await editor.updateComplete;
      expect(events).toHaveLength(1);
    });
  }
  it('leaves omitted ends and object/legacy forms untouched while editing color', async () => {
    const config = { type, bar: { fill_style: 'bands', segments: [
      { from: { fixed: 5, future: true }, color: '#123456' },
      { from: { value: 20 }, to: { percent: 50 }, color: '#abcdef' },
    ] } };
    const { editor } = await setup(source, config);
    await field(editor, 'segment-color', 0, '#222222');
    expect(editor._config).toEqual({ ...config, bar: { ...config.bar, segments: [{ ...config.bar.segments[0], color: '#222222' }, config.bar.segments[1]] } });
    expect(editor._config.bar.segments[0]).not.toHaveProperty('to');
  });
  it('preserves inactive palettes and advanced config through fill-style switching', async () => {
    const config = raw('bands'), { editor } = await setup(source, config);
    for (const style of ['gradient', 'solid', 'soft_bands', 'band_gradient']) {
      const target = editor.shadowRoot.querySelector('#bar-fill-style'); target.value = style;
      editor._handleField({ type: 'change', target }); await editor.updateComplete;
      expect(editor._config.bar.segments).toEqual(config.bar.segments);
      expect(editor._config.bar.gradient_stops).toEqual(config.bar.gradient_stops);
      expect(editor._config.target).toEqual(config.target);
    }
  });
  for (const kind of ['segment', 'gradient']) it(`appends and removes ${kind} raw items without sorting or rebuilding`, async () => {
    const config = raw(kind === 'segment' ? 'bands' : 'gradient');
    const { editor, segment, gradient } = await setup(source, config);
    const section = kind === 'segment' ? segment : gradient;
    if (kind === 'segment') { section._setSegmentDraftField(root, 'from', '50%'); section._setSegmentDraftField(root, 'to', '60%'); section._commitSegmentDraft(root); }
    else { section._setGradientStopsDraftField(root, 'pos', '50'); section._commitGradientStopDraft(root); }
    await editor.updateComplete;
    const key = kind === 'segment' ? 'segments' : 'gradient_stops';
    expect(editor._config.bar[key].slice(0, 2)).toEqual(config.bar[key]);
    expect(editor._config.bar[key]).toHaveLength(3);
    section.handle({ type: 'click', target: { dataset: { action: kind === 'segment' ? 'remove-segment' : 'remove-gradient-stop', index: '0' } } });
    await editor.updateComplete;
    expect(editor._config.bar[key][0]).toEqual(config.bar[key][1]);
    expect(editor._config.bar[key]).toHaveLength(2);
  });
  it('keeps malformed/overlapping Segment edits local, then commits a valid value', async () => {
    const config = raw('bands'), { editor, events, segment } = await setup(source, config);
    for (const value of ['-', '', '40%', '110%']) {
      await field(editor, 'segment-from', 0, value, 'input');
      await field(editor, 'segment-from', 0, value);
      expect(editor._config).toEqual(config); expect(events).toHaveLength(0);
      expect(segment._getSegmentBoundaryText(root, 0, 'from')).toBe(value);
    }
    await field(editor, 'segment-from', 0, '65%');
    expect(editor._config.bar.segments[0].from).toBe('65%');
    expect(events).toHaveLength(1);
  });
  it('validates unsorted Gradient positions using raw row indices', async () => {
    const config = raw('gradient'), { editor, events } = await setup(source, config);
    await field(editor, 'gradient-pos', 0, '0');
    await field(editor, 'gradient-pos', 0, '-1');
    expect(events).toHaveLength(0); expect(editor._config).toEqual(config);
    await field(editor, 'gradient-pos', 0, '80');
    expect(editor._config.bar.gradient_stops[0].pos).toBe(80);
    expect(events).toHaveLength(1);
  });
  for (const kind of ['segment', 'gradient']) it(`preserves ${kind} drafts and mounted nodes on ordinary updates/echoes`, async () => {
    const { editor, events, segment, gradient } = await setup(source, raw(kind === 'segment' ? 'bands' : 'gradient'));
    const id = kind === 'segment' ? '#segment-draft-from' : '#gradient-draft-pos';
    const node = editor.shadowRoot.querySelector(id);
    await field(editor, `${kind}-draft-${kind === 'segment' ? 'from' : 'pos'}`, 0, kind === 'segment' ? '50%' : '50', 'input');
    const draft = kind === 'segment' ? segment._getSegmentDraftState(root) : gradient._getGradientStopsDraftState(root);
    editor.hass = { states: {} }; editor.context = { entity_id: 'sensor.changed' }; editor.setConfig(editor._config); await editor.updateComplete;
    expect(kind === 'segment' ? segment._getSegmentDraftState(root) : gradient._getGradientStopsDraftState(root)).toEqual(draft);
    // The lightweight gradient DOM falls back to structural refresh; real-browser focus is tested separately.
    if (kind === 'segment') expect(editor.shadowRoot.querySelector(id)).toBe(node);
    expect(events).toHaveLength(0);
  });
  it('keeps legacy palette paths/aliases and malformed untouched raw rows', async () => {
    const config = { type, bar: { fill_style: 'gradient', segments: raw('bands').bar.segments }, gradient_stops: [
      { pos: '80%', color: '#123456', ...metadata() }, null, { pos: 0, color: '#abcdef' },
    ] };
    const { editor } = await setup(source, config);
    await field(editor, 'gradient-color', 0, '#222222');
    expect(editor._config.gradient_stops.slice(1)).toEqual(config.gradient_stops.slice(1));
    expect(editor._config.bar).toEqual(config.bar);
    expect(editor._config.bar).not.toHaveProperty('gradient_stops');
  });
  it('discards local drafts on foreign config replacement without emitting', async () => {
    const { editor, events, segment, gradient } = await setup(source, raw('gradient'));
    gradient._setGradientStopsDraftField(root, 'pos', '55');
    gradient._setGradientStopsDraftField(root, 'color', 'var(--accent-color)');
    segment._setSegmentDraftField(root, 'from', '-');
    await editor.updateComplete;
    editor.setConfig({ ...raw('gradient'), futureReplacement: true }); await editor.updateComplete;
    expect(gradient._getGradientStopsDraftState(root).pos).toBe('100');
    expect(gradient._getGradientStopsDraftState(root).color).toBe('red');
    expect(segment._getSegmentDraftState(root).from).not.toBe('-');
    expect(editor.shadowRoot.querySelector('#gradient-draft-pos').value).toBe('100');
    expect(events).toHaveLength(0);
  });
  it('does not persist displayed defaults until an explicit palette operation', async () => {
    const { editor, events } = await setup(source, { type, bar: { fill_style: 'bands', extra: true } });
    expect(editor._config.bar).not.toHaveProperty('segments');
    await field(editor, 'segment-color', 0, '#112233');
    expect(editor._config.bar.segments).toHaveLength(3);
    expect(editor._config.bar.segments[0]).toEqual({ from: '0%', to: '33%', color: '#112233' });
    expect(editor._config.bar.extra).toBe(true); expect(events).toHaveLength(1);
  });
  it('uses the same extracted templates and controller methods in both hosts', async () => {
    const classes = loadCardClass({ source });
    const standalone = new classes.editor(), editor = new classes.featureEditor();
    standalone.setConfig(raw('bands')); editor.setConfig(raw('bands')); editor.context = { entity_id: 'sensor.a' };
    await editor.updateComplete;
    const segment = editor._segmentsSection, gradient = editor._gradientStopsSection;
    expect(segment.constructor).toBe(standalone._segmentsSection.constructor);
    expect(gradient.constructor).toBe(standalone._gradientStopsSection.constructor);
    expect(editor.shadowRoot.innerHTML).toContain(segment.render(root));
    expect(standalone._renderSegmentPreview(root)).toBe(standalone._segmentsSection._renderSegmentPreview(root));
  });
});

it('keeps both palette templates identical across source/dist and picker/fallback environments', async () => {
  for (const style of ['bands', 'gradient']) {
    let expected;
    for (const source of ['src', 'dist']) for (const withEntityPicker of [false, true]) {
      const editor = new (loadCardClass({ source, withEntityPicker }).featureEditor)();
      editor.setConfig(raw(style)); editor.context = { entity_id: 'sensor.a' }; await editor.updateComplete;
      const section = style === 'bands' ? editor._segmentsSection : editor._gradientStopsSection;
      const html = section.render(root);
      expected ??= html; expect(html).toBe(expected);
    }
  }
});
