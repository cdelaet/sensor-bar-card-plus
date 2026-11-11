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
    expect(html).toContain('<details id="custom-paint" class="paint-editor">');
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
    expect(html.match(/<option /g)).toHaveLength(5);
    expect(html).toContain(`<option value="${fill_style}" selected>`);
    expect(html).toContain(`background-image:${compilePaint(paint).gradient}`);
    expect(html).toContain(describePaint(paint));
    expect(html).not.toMatch(/opacity|preset|simulator/);
  });

  it('retains mounted disclosure state while accepting host field routing', () => {
    const { bindings } = bindingFor({ ...palettes, fill_style: 'solid' }, []);
    const root = { querySelector: () => ({ open: true }) };
    const html = renderPaintEditor({ id: 'paint', bindings, root,
      fields: { color: { id: 'destination-color', kind: 'destination-color', index: 2 } } });
    expect(html).toContain('class="paint-editor" open');
    expect(html).toContain('id="destination-color"');
    expect(html).toContain('data-kind="destination-color" data-index="2"');
  });

  it('describes inherited paint and explicit sampling, and escapes authored colors', () => {
    expect(describePaint({ fill_style: 'gradient', solid_fill: true, gradient_stops: palettes.gradient_stops }, true))
      .toBe('Inherited · Gradient · 2 stops · Sampled color');
    const { bindings } = bindingFor({ fill_style: 'solid', color: '<img src=x onerror="bad">' }, []);
    expect(renderPaintEditor({ id: 'paint', bindings })).not.toContain('<img');
  });

  it('updates the compact summary and swatch without replacing the editor or controls', () => {
    const description = { textContent: 'old' }, swatch = { style: {} };
    const editor = { querySelector: selector => selector.includes('description') ? description : swatch };
    const root = { querySelector: () => editor };
    const paint = { ...palettes, fill_style: 'solid' };
    syncPaintEditor(root, 'paint', { paint, inherited: true });
    expect(description.textContent).toBe('Inherited · Solid · #123456');
    expect(swatch.style.backgroundImage).toBe(compilePaint(paint).gradient);
    expect(root.querySelector()).toBe(editor);
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
