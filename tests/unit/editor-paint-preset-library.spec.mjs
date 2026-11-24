import { describe, expect, it, vi } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

async function createMaster(config) {
  const fixture = await createDomEditorFixture();
  fixture.editor.setConfig(config);
  const events = [];
  fixture.editor.addEventListener('config-changed', event => events.push(event.detail.config));
  return { ...fixture, events };
}

function click(window, element) {
  return dispatchDomEvent(element, 'click');
}

function change(window, element, value) {
  if (element.type === 'checkbox') element.checked = value;
  else element.value = value;
  return dispatchDomEvent(element, 'change');
}

describe('master Paint Presets library editor', () => {
  it('lists paint previews and edits all six properties with the shared Paint Editor', async () => {
    const library = {
      paint: { warm: { fill_style: 'gradient', color: '#bb4422', opacity: 72,
        segments: [], gradient_stops: [{ pos: 0, color: '#111111' }, { pos: 100, color: '#eeeeee' }] } },
      layout: { keep: true },
    };
    const saved = { title: 'Power', preset_library: library, bar: { paint: { preset: 'warm' } }, future: { keep: true } };
    const { editor, window, events } = await createMaster(saved);
    const root = editor.shadowRoot;

    expect(root.querySelector('#paint-presets')).not.toBeNull();
    expect(root.querySelector('[role="listbox"] .paint-preset-choice').dataset.presetName).toBe('warm');
    expect(root.querySelector('.paint-preset-swatch').style.backgroundImage).toContain('linear-gradient');
    expect(root.querySelector('#preset-paint-fill_style')).not.toBeNull();
    expect(root.querySelector('#preset-paint-color')).not.toBeNull();
    expect(root.querySelector('#preset-paint-solid_fill')).not.toBeNull();
    expect(root.querySelector('#preset-paint-opacity').value).toBe('72');
    expect(root.querySelector('#segment-draft-from')).not.toBeNull();
    expect(root.querySelector('#gradient-draft-pos')).not.toBeNull();

    change(null, root.querySelector('#preset-paint-fill_style'), 'bands');
    change(null, root.querySelector('#preset-paint-solid_fill'), true);
    change(null, root.querySelector('#preset-paint-opacity'), 61);
    const color = root.querySelector('[data-field="preset-paint-color"]');
    color.value = '#336699';
    dispatchDomEvent(color, 'input');
    expect(events.at(-1).preset_library.paint.warm).toMatchObject({
      fill_style: 'bands', solid_fill: true, opacity: 61, color: '#336699',
    });

    for (const [input, value] of [
      [root.querySelector('#segment-draft-from'), '0%'],
      [root.querySelector('#segment-draft-to'), '50%'],
      [root.querySelector('[data-kind="segment-draft-color"]'), '#123456'],
    ]) {
      input.value = value;
      dispatchDomEvent(input, 'input');
    }
    click(null, root.querySelector('[data-action="add-segment"]'));
    expect(events.at(-1).preset_library.paint.warm.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: '0%', to: '50%', color: '#123456' }),
    ]));
    await new Promise(resolve => window.setTimeout(resolve, 0));

    const gradientColor = root.querySelector('[data-kind="gradient-color"]');
    gradientColor.value = '#aabbcc';
    dispatchDomEvent(gradientColor, 'input');
    expect(events.at(-1).preset_library.paint.warm.gradient_stops[0].color).toBe('#aabbcc');
    expect(events.at(-1).preset_library.layout).toEqual({ keep: true });
    expect(events.at(-1).bar.paint.preset).toBe('warm');
    expect(events.at(-1).future.keep).toBe(true);
    expect(editor._config).toEqual(saved);
  });

  it('creates unique trimmed names in the local draft and preserves unknown categories', async () => {
    const saved = { preset_library: { paint: { warm: { color: 'red' } }, layout: { mode: 'future' } }, title: 'Keep' };
    const { editor, events } = await createMaster(saved);
    const input = editor.shadowRoot.querySelector('#paint-preset-name');
    input.value = '  cool  ';
    click(null, editor.shadowRoot.querySelector('[data-action="add-paint-preset"]'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(events.at(-1).preset_library).toEqual({ paint: { warm: { color: 'red' }, cool: {} }, layout: { mode: 'future' } });
    expect(editor._config).toEqual(saved);
    expect(editor._paintPresetRegistry.presets).toEqual({});
    expect(editor.shadowRoot.querySelector('[aria-selected="true"]').dataset.presetName).toBe('cool');

    const duplicateInput = editor.shadowRoot.querySelector('#paint-preset-name');
    duplicateInput.value = 'warm';
    click(null, editor.shadowRoot.querySelector('[data-action="add-paint-preset"]'));
    expect(events).toHaveLength(1);
    expect(editor.shadowRoot.querySelector('.paint-preset-library-message').textContent).toContain('already exists');

    const emptyInput = editor.shadowRoot.querySelector('#paint-preset-name');
    emptyInput.value = '   ';
    click(null, editor.shadowRoot.querySelector('[data-action="add-paint-preset"]'));
    expect(events).toHaveLength(1);
    expect(editor.shadowRoot.querySelector('.paint-preset-library-message').textContent).toContain('Enter a name');
  });

  it('renames without rewriting consumers and confirms deletion while preserving the draft', async () => {
    const library = { paint: { warm: { fill_style: 'solid', color: '#cc4400' }, cool: { color: '#0088cc' } }, layout: { keep: true } };
    const saved = { preset_library: library, bar: { paint: { preset: 'warm' } }, title: 'Keep' };
    const { editor, window, events } = await createMaster(saved);
    const prompt = vi.fn(() => 'gold');
    window.prompt = prompt;
    click(null, editor.shadowRoot.querySelector('[data-action="rename-paint-preset"]'));

    expect(prompt).toHaveBeenCalledOnce();
    expect(prompt.mock.calls[0][0]).toContain('may be affected');
    expect(events.at(-1).preset_library.paint).toEqual({ gold: library.paint.warm, cool: library.paint.cool });
    expect(events.at(-1).bar.paint.preset).toBe('warm');
    expect(events.at(-1).preset_library.layout).toEqual({ keep: true });

    window.prompt = vi.fn(() => 'cool');
    click(null, editor.shadowRoot.querySelector('[data-action="rename-paint-preset"]'));
    expect(events).toHaveLength(1);
    expect(editor.shadowRoot.querySelector('.paint-preset-library-message').textContent).toContain('already exists');

    const cancelDelete = vi.fn(() => false);
    window.confirm = cancelDelete;
    click(null, editor.shadowRoot.querySelector('[data-action="delete-paint-preset"]'));
    expect(cancelDelete).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);

    window.confirm = vi.fn(() => true);
    click(null, editor.shadowRoot.querySelector('[data-action="delete-paint-preset"]'));
    expect(events.at(-1).preset_library.paint).toEqual({ cool: library.paint.cool });
    expect(events.at(-1).preset_library.layout).toEqual({ keep: true });
    expect(events.at(-1).bar.paint.preset).toBe('warm');
    expect(editor._config).toEqual(saved);
  });

  it('keeps a conflicted definition editable, renamable and removable', async () => {
    const library = { paint: { Thermal: { fill_style: 'solid', color: 'red' } }, layout: { keep: true } };
    const { editor, window, events } = await createMaster({ preset_library: library, bar: { paint: { preset: 'Thermal' } } });
    editor._paintPresetRegistry = { status: 'ready', presets: {}, conflicts: { Thermal: 2 } };
    editor._syncPresetMasterControls();
    expect(editor.shadowRoot.querySelector('.paint-preset-authoring-warning').textContent).toContain('Thermal');
    expect(editor.shadowRoot.querySelector('[data-preset-name="Thermal"]')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#preset-paint-color')).not.toBeNull();

    window.prompt = vi.fn(() => 'Warm');
    click(null, editor.shadowRoot.querySelector('[data-action="rename-paint-preset"]'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(events.at(-1).preset_library.paint).toEqual({ Warm: library.paint.Thermal });
    expect(events.at(-1).preset_library.layout).toEqual({ keep: true });
    expect(editor.shadowRoot.querySelector('.paint-preset-authoring-warning')).toBeNull();

    window.confirm = vi.fn(() => true);
    click(null, editor.shadowRoot.querySelector('[data-action="delete-paint-preset"]'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(events.at(-1).preset_library).toEqual({ paint: {}, layout: { keep: true } });
    expect(editor.shadowRoot.querySelector('.paint-preset-authoring-warning')).toBeNull();
  });
});
