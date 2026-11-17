import { describe, expect, it, vi } from 'vitest';
import { createPaintBindings } from '../../src/editor/shared/paint-bindings.js';
import { describePaint, renderPaintEditor, syncPaintEditor } from '../../src/editor/shared/paint-editor.js';
import { getBarPaintEditorState } from '../../src/editor/sections/bar-appearance.js';
import { getPathValue } from '../../src/editor/shared/editor-config.js';
import { compilePaint } from '../../src/view-model/paint-compiler.js';

function bindingFor(config, path) {
  const context = { read: (_scope, path) => getPathValue(config, path), mutate: vi.fn() };
  return { context, bindings: createPaintBindings(context, { scope: {}, path }) };
}
const palettes = { color: '#123456', segments: [{ from: 0, to: 100, color: '#abcdef' }],
  gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }] };

describe('shared Paint Editor', () => {
  it('reads an arbitrary nested destination without materializing effective paint or emitting', () => {
    const config = { entries: [{ appearance: { color: '#123456', extra: true } }] };
    const { bindings, context } = bindingFor(config, ['entries', 0, 'appearance']);
    const html = renderPaintEditor({ id: 'custom-paint', bindings, paletteContent: '<div>Palette controls</div>' });
    expect(html).toContain('<details id="custom-paint" class="paint-editor" data-paint-destination="bar">');
    expect(html).toContain('id="custom-paint-color"');
    expect(html).toContain('Palette controls');
    expect(html).not.toContain('bar-');
    expect(context.mutate).not.toHaveBeenCalled();
    expect(config.entries[0].appearance).toEqual({ color: '#123456', extra: true });
  });

  it.each(['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient'])('shows all five choices and a compiler swatch for %s', fill_style => {
    const paint = { ...palettes, fill_style };
    const { bindings } = bindingFor(paint, []);
    const html = renderPaintEditor({ id: 'paint', bindings, paint });
    expect(html.match(/<option /g)).toHaveLength(6);
    for (const option of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      expect(html).toContain(`data-paint-property="fill_style"`);
      expect(html).toContain(`<option value="${option}"`);
    }
    expect(html).toContain(`<option value="${fill_style}" selected>`);
    expect(html).toContain('Paint preset');
    expect(html).toMatch(/<option value=""(?: selected)?>None<\/option>/);
    expect(html).toMatch(/class="paint-preset-row">/);
    expect(html).toContain(`background-image:${compilePaint(paint).gradient}`);
    expect(html).toContain(describePaint(paint));
    expect(html).toMatch(/Opacity/);
    expect(html).not.toMatch(/simulator/);
  });

  it('retains mounted disclosure state while accepting host field routing', () => {
    const { bindings } = bindingFor({ ...palettes, fill_style: 'solid' }, []);
    const root = { querySelector: () => ({ open: true }) };
    const html = renderPaintEditor({ id: 'paint', bindings, root,
      fields: { color: { id: 'destination-color', kind: 'destination-color', index: 2 } } });
    expect(html).toContain('data-paint-destination="bar" open');
    expect(html).toContain('id="destination-color"');
    expect(html).toContain('data-kind="destination-color" data-index="2"');
  });

  it('shows named presets and keeps unresolved references visible', () => {
    const { bindings } = bindingFor({}, []);
    const available = renderPaintEditor({ id: 'paint', bindings, presetOptions: [{ value: 'night', label: 'night' }] });
    expect(available).toContain('class="paint-preset-row"');
    expect(available).toContain('<option value="night">night</option>');
    expect(available).not.toContain('Inherited paint');
    expect(available).not.toContain('Manual paint');

    const missing = renderPaintEditor({ id: 'paint', bindings, presetReference: 'missing' });
    expect(missing).toContain('<option value="missing" selected>missing (unavailable)</option>');
  });

  it('renders reset only for consumers and reflects whether local paint can be reset', () => {
    const { bindings } = bindingFor({ color: '#123456' }, []);
    const consumer = renderPaintEditor({ id: 'paint', bindings, resetLabel: 'Reset to default paint settings', resetDisabled: false });
    expect(consumer).toContain('data-action="reset-paint"');
    expect(consumer).toContain('>Reset to default paint settings</button>');
    expect(consumer).not.toContain('data-action="reset-paint" disabled');

    const disabled = renderPaintEditor({ id: 'paint', bindings, resetLabel: 'Reset to Card paint settings' });
    expect(disabled).toContain('data-action="reset-paint" disabled');
    expect(renderPaintEditor({ id: 'preset-paint', bindings })).not.toContain('data-action="reset-paint"');
  });

  it('describes inherited paint and explicit sampling, and escapes authored colors', () => {
    expect(describePaint({ fill_style: 'gradient', solid_fill: true, gradient_stops: palettes.gradient_stops }, true))
      .toBe('Inherited · Gradient · 2 stops · Sampled color');
    const { bindings } = bindingFor({ fill_style: 'solid', color: '<img src=x onerror="bad">' }, []);
    expect(renderPaintEditor({ id: 'paint', bindings })).not.toContain('<img');
  });

  it('updates the compact summary and swatch without replacing the editor or controls', () => {
    const description = { textContent: 'old' }, swatch = { style: {} }, opacity = { id: 'paint-opacity', value: '35' };
    const editor = { querySelector: selector => selector.includes('description') ? description
      : selector.includes('swatch') ? swatch : opacity };
    const root = { querySelector: () => editor };
    const paint = { ...palettes, fill_style: 'solid', opacity: 60 };
    syncPaintEditor(root, 'paint', { paint, inherited: true });
    expect(description.textContent).toBe('Inherited · Solid · #123456');
    expect(swatch.style.backgroundImage).toBe(compilePaint(paint).gradient);
    expect(opacity.value).toBe('60');
    expect(root.querySelector()).toBe(editor);
  });

  it.each([0, 40, 100])('renders and synchronizes 50%% sampled paint at opacity %s', opacity => {
    const paint = { fill_style: 'gradient', solid_fill: true, opacity,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] };
    const { bindings } = bindingFor(paint, []);
    const html = renderPaintEditor({ id: 'paint', bindings });
    expect(html).toContain('rgb(128,128,128)');
    expect(html).toContain(`opacity:${opacity / 100};`);
    const swatch = { style: {} };
    const editor = { querySelector: selector => selector.includes('swatch') ? swatch : null };
    syncPaintEditor({ querySelector: () => editor }, 'paint', { paint });
    expect(swatch.style.backgroundImage).toContain('rgb(128,128,128)');
    expect(swatch.style.opacity).toBe(String(opacity / 100));
  });

  it('preserves a pending numeric opacity draft during unrelated Paint synchronization', () => {
    const opacity = { id: 'bar-opacity', value: '' };
    const editor = { querySelector: selector => selector.includes('opacity') ? opacity : null };
    const root = { querySelector: () => editor };
    const numericDrafts = { values: new Map([['bar-opacity', '-']]) };

    syncPaintEditor(root, 'paint', { paint: { opacity: 75 } }, { numericDrafts });

    expect(opacity.value).toBe('');
    expect(numericDrafts.values.get('bar-opacity')).toBe('-');
  });

  it('preserves the focused opacity editing buffer without a tracked draft', () => {
    const opacity = { id: 'bar-opacity', value: '37.0' };
    const editor = { querySelector: selector => selector.includes('opacity') ? opacity : null };
    const root = { activeElement: opacity, querySelector: () => editor };

    syncPaintEditor(root, 'paint', { paint: { opacity: 37 } });

    expect(opacity.value).toBe('37.0');
  });

  it('keeps controls usable for an incomplete authored palette', () => {
    const { bindings } = bindingFor({ fill_style: 'gradient', gradient_stops: [null, null] }, []);
    const html = renderPaintEditor({ id: 'paint', bindings });
    expect(html).toContain('background-image:none');
    expect(html).toContain('id="paint-fill_style"');
  });
});

it('resolves inherited raw Segment anchors for summaries without copying paint into the row', () => {
  const card = { scale: { min: 0, max: 200, direction: 'reverse' }, bar: { fill_style: 'bands',
    segments: [{ from: '0%', to: '50%', color: '#123456' }, { from: 100, to: 200, color: '#abcdef' }] } };
  const row = { entity: 'sensor.power' };
  const context = { read: (scope, path) => getPathValue(scope.type === 'card' ? card : row, path), mutate: vi.fn() };
  const state = getBarPaintEditorState(context, { type: 'entity', index: 0 });
  expect(state.inherited).toBe(true);
  expect(state.scale).toEqual({ minValue: 0, maxValue: 200, scaleDirection: 'reverse' });
  expect(compilePaint(state.paint, state.scale).gradient).toContain('#abcdef 0%');
  expect(compilePaint(state.paint, state.scale).gradient).toContain('#123456 100%');
  expect(row).toEqual({ entity: 'sensor.power' });
  expect(context.mutate).not.toHaveBeenCalled();
});

it('identifies a local legacy nested color mode as authored paint in the compact summary', () => {
  const context = { read: (scope, path) => getPathValue(scope.type === 'card'
    ? { bar: { fill_style: 'bands' } } : { bar: { color_mode: 'single' } }, path) };
  const state = getBarPaintEditorState(context, { type: 'entity', index: 0 });
  expect(state.paint.fill_style).toBe('solid');
  expect(state.inherited).toBe(false);
});

it.each(['bands', 'soft_bands', 'band_gradient'])('uses authored fixed extent for the %s header swatch only', fill_style => {
  const colors = ['#3949AB', '#1E88E5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#D4E157', '#FFCA28',
    '#FFA726', '#FB8C00', '#E53935', '#8E24AA'];
  const boundaries = [5, 10, 15, 18, 20, 22, 24, 26, 28, 30, 33, 36, 40];
  const segments = colors.map((color, index) => ({ from: boundaries[index], to: boundaries[index + 1], color }));
  const config = { scale: { min: { fixed: 15 }, max: { fixed: 25 }, direction: 'reverse' }, bar: { fill_style, segments } };
  const context = { read: (_scope, path) => getPathValue(config, path), hass: { states: {} } };
  const state = getBarPaintEditorState(context, { type: 'card' });
  const html = renderPaintEditor({ id: 'paint', ...state });
  const previewGradient = compilePaint(state.paint, state.previewScale).gradient;

  expect(state.scale).toEqual({ minValue: 15, maxValue: 25, scaleDirection: 'reverse' });
  expect(state.previewScale).toEqual({ minValue: 5, maxValue: 40, scaleDirection: 'reverse' });
  expect(html).toContain(`background-image:${previewGradient}`);
  for (const color of colors) {
    const [red, green, blue] = color.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16));
    expect(previewGradient.includes(color) || previewGradient.includes(`rgb(${red},${green},${blue})`)).toBe(true);
  }
  expect(compilePaint(state.paint, state.scale).gradient).not.toContain(colors[0]);
  const [red, green, blue] = colors[0].slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16));
  const completeGradient = compilePaint(state.paint, state.previewScale).gradient;
  expect(completeGradient.includes(colors[0]) || completeGradient.includes(`rgb(${red},${green},${blue})`)).toBe(true);
  expect(config.scale).toEqual({ min: { fixed: 15 }, max: { fixed: 25 }, direction: 'reverse' });
  expect(config.bar.segments).toEqual(segments);
});

it('keeps percentage segment swatches on their existing percentage scale', () => {
  const segments = [
    { from: '0%', to: '25%', color: '#112233' }, { from: '25%', to: '50%', color: '#223344' },
    { from: '50%', to: '75%', color: '#334455' }, { from: '75%', to: '100%', color: '#445566' },
  ];
  const config = { scale: { min: { fixed: 15 }, max: { fixed: 25 } }, bar: { fill_style: 'band_gradient', segments } };
  const context = { read: (_scope, path) => getPathValue(config, path), hass: { states: {} } };
  const state = getBarPaintEditorState(context, { type: 'card' });
  const html = renderPaintEditor({ id: 'paint', ...state });

  expect(state.previewScale).toEqual(state.scale);
  expect(html).toContain(`background-image:${compilePaint(state.paint, state.scale).gradient}`);
  expect(config.bar.segments).toEqual(segments);
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Card row', 'Feature']) {
  describe(`null bar promotion (${host}, ${source})`, () => {
    it.each([
      ['fill_style', 'fill-style', 'gradient', 'change'],
      ['color', 'color', '#abcdef', 'input'],
      ['solid_fill', 'solid-fill', true, 'change'],
    ])('emits one owned %s edit without materializing inherited properties', async (property, field, value, type) => {
      const { loadCardClass } = await import('../support/load-card-class.cjs');
      const classes = loadCardClass({ source });
      const row = host === 'Card row';
      const config = host === 'Feature'
        ? { type: 'custom:sensor-bar-card-plus-feature', bar: null, extra: { keep: true } }
        : { entities: [{ entity: 'sensor.power', ...(row ? { bar: null, extra: true } : {}) }, { entity: 'sensor.other' }],
          bar: row ? { fill_style: 'bands', color: '#112233', solid_fill: false, future: true } : null, extra: { keep: true } };
      const original = structuredClone(config);
      const editor = new (host === 'Feature' ? classes.featureEditor : classes.editor)();
      const events = [];
      editor.dispatchEvent = event => { events.push(event); return true; };
      editor.setConfig(config);
      await editor.updateComplete;
      expect(events).toHaveLength(0);
      expect(row ? editor._draftConfig.entities[0].bar : (editor._draftConfig ?? editor._config).bar).toBeNull();
      const control = editor.shadowRoot.querySelector(`#${row ? 'entity-0-' : ''}bar-${field}`);
      if (typeof value === 'boolean') control.checked = value;
      else control.value = value;
      control.dispatchEvent({ type });
      await editor.updateComplete;
      expect(events).toHaveLength(1);
      const emitted = events[0].detail.config;
      const expected = structuredClone(original);
      if (row) expected.entities[0].bar = { [property]: value };
      else expected.bar = { paint: { [property]: value } };
      expect(emitted).toEqual(expected);
      expect(events[0]).toMatchObject({ bubbles: true, composed: true });
      expect(config).toEqual(original);
      editor.setConfig(emitted);
      await editor.updateComplete;
      expect(events).toHaveLength(1);
      expect(editor._draftConfig ?? editor._config).toEqual(emitted);
    });
  });
}

it.each([
  { fill_style: 'solid', color: 'rgba(255, 0, 0, 0.5)' },
  { fill_style: 'bands', solid_fill: true, color: 'rgba(0, 255, 0, 0.5)', segments: [{ from: 0, to: 100, color: 'rgba(0, 0, 255, 0.25)' }] },
  { fill_style: 'solid', color: '#123456' },
])('composites compiled paint once over a neutral backdrop: %j', paint => {
  const { bindings } = bindingFor(paint, []);
  const html = renderPaintEditor({ id: 'paint', bindings });
  expect(html).toContain('background-color:var(--card-background-color, #fff)');
  expect(html).toContain(`background-image:${compilePaint(paint).gradient}`);
  const swatch = { style: { backgroundColor: paint.color } };
  const editor = { querySelector: selector => selector.includes('swatch') ? swatch : null };
  syncPaintEditor({ querySelector: () => editor }, 'paint', { paint });
  expect(swatch.style.backgroundColor).toBe('var(--card-background-color, #fff)');
  expect(swatch.style.backgroundImage).toBe(compilePaint(paint).gradient);
});

for (const source of ['src', 'dist']) it(`Card entity Paint is nested inside the collapsible Bar group (${source})`, async () => {
  const { createEditor } = await import('../support/load-card-class.cjs');
  const editor = createEditor({ source });
  const config = { entities: ['sensor.power'], bar: { fill_style: 'bands', color: '#123456' } };
  const events = [];
  editor.dispatchEvent = event => { events.push(event); return true; };
  editor.setConfig(config);
  const group = editor.shadowRoot.querySelector('#entity-0-bar-appearance');
  expect(group).toBeTruthy();
  expect(group.getAttribute('role')).toBe('group');
  expect(group.getAttribute('aria-label')).toBe('Bar Appearance');
  expect(group.getAttribute('class')).not.toContain('override-group');
  const barGroup = editor.shadowRoot.querySelector('#entity-0-group-bar');
  expect(barGroup).toBeTruthy();
  expect(barGroup.getAttribute('aria-expanded')).toBe('false');
  let parentGroup = barGroup.parentElement;
  while (parentGroup && parentGroup.dataset.group !== 'bar') parentGroup = parentGroup.parentElement;
  expect(parentGroup).toBeTruthy();
  for (const id of ['entity-0-paint-editor', 'entity-0-bar-direction', 'entity-0-bar-fill-style', 'entity-0-bar-color', 'entity-0-bar-solid-fill', 'entity-0-bar-inherit']) {
    expect(editor.shadowRoot.innerHTML.match(new RegExp(`id="${id}"`, 'g'))).toHaveLength(1);
  }
  expect(editor.shadowRoot.querySelector('#entity-0-paint-editor').getAttribute('open')).toBeNull();
  for (const group of ['segments', 'gradient-stops']) {
    expect(editor.shadowRoot.querySelector(`#entity-0-group-${group}`).getAttribute('aria-expanded')).toBe('false');
  }
  expect(events).toHaveLength(0);
  expect(editor._draftConfig).toEqual(config);
});
