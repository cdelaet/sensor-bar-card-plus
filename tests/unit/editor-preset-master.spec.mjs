import { describe, expect, it, vi } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

async function editorFor(config = {}) {
  const fixture = await createDomEditorFixture();
  fixture.editor.setConfig(config);
  return fixture;
}

function configEvents(editor) {
  const events = [];
  editor.addEventListener('config-changed', event => events.push(event.detail.config));
  return events;
}

describe('Visual Editor Preset Master designation', () => {
  it('shows designation when no saved master exists and creates an empty local library', async () => {
    const { editor } = await editorFor({ entity: 'sensor.one', custom: { preserve: true } });
    const events = configEvents(editor);
    const checkbox = editor.shadowRoot.querySelector('#preset-master');

    expect(checkbox).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#paint-presets')).toBeNull();
    expect(editor.shadowRoot.innerHTML.indexOf('id="preset-master"')).toBeLessThan(editor.shadowRoot.innerHTML.indexOf('<h3>Basics</h3>'));
    checkbox.checked = true;
    dispatchDomEvent(checkbox, 'change');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(events.at(-1)).toEqual({ entity: 'sensor.one', custom: { preserve: true }, preset_library: {} });
    expect(editor._config).toEqual({ entity: 'sensor.one', custom: { preserve: true } });
    expect(editor._paintPresetRegistry.status).toBe('empty');
    expect(editor._paintPresetRegistry.presets).toEqual({});
    expect(editor.shadowRoot.querySelector('#preset-master').checked).toBe(true);
    expect(editor.shadowRoot.querySelector('.preset-master-title').textContent).toContain('Preset Master');
    expect(editor.shadowRoot.querySelector('#paint-presets')).not.toBeNull();
  });

  it('hides designation on ordinary Cards when another saved master exists', async () => {
    const { editor } = await editorFor({ entity: 'sensor.one' });
    editor._paintPresetRegistry = { status: 'ready', masterCount: 1, presets: {} };
    editor._render();
    expect(editor.shadowRoot.querySelector('#preset-master')).toBeNull();
    expect(editor.shadowRoot.querySelector('#paint-presets')).toBeNull();
  });

  it('confirms removal of populated libraries and preserves the draft when cancelled', async () => {
    const config = { preset_library: { paint: { warm: { color: 'red' } }, future: { keep: true } }, title: 'Keep' };
    const { editor, window } = await editorFor(config);
    const events = configEvents(editor);
    const confirm = vi.fn(() => false);
    window.confirm = confirm;
    let checkbox = editor.shadowRoot.querySelector('#preset-master');
    checkbox.checked = false;
    dispatchDomEvent(checkbox, 'change');

    expect(confirm).toHaveBeenCalledOnce();
    expect(events).toHaveLength(0);
    expect(editor._draftConfig).toEqual(config);
    expect(editor.shadowRoot.querySelector('#preset-master').checked).toBe(true);

    window.confirm = vi.fn(() => true);
    checkbox = editor.shadowRoot.querySelector('#preset-master');
    checkbox.checked = false;
    dispatchDomEvent(checkbox, 'change');
    expect(events.at(-1)).toEqual({ title: 'Keep' });
    expect(editor._config).toEqual(config);
  });

  it('keeps every duplicate master editable and presents the registry warning', async () => {
    const config = { preset_library: { paint: {}, unknown_category: { retained: true } } };
    const { editor } = await editorFor(config);
    editor._paintPresetRegistry = { status: 'conflict', masterCount: 2, presets: {},
      diagnostic: { code: 'multiple_preset_masters', message: 'Dashboard has 2 master Cards.' } };
    editor._render();
    const warning = editor.shadowRoot.querySelector('[role="status"][aria-live="polite"]');
    expect(editor.shadowRoot.querySelector('#preset-master').checked).toBe(true);
    expect(editor.shadowRoot.querySelector('#paint-presets')).not.toBeNull();
    expect(warning.textContent).toBe('Dashboard has 2 master Cards.');

    const events = configEvents(editor);
    const confirm = vi.fn(() => true);
    editor.ownerDocument.defaultView.confirm = confirm;
    const checkbox = editor.shadowRoot.querySelector('#preset-master');
    checkbox.checked = false;
    dispatchDomEvent(checkbox, 'change');
    expect(events.at(-1)).toEqual({});
    expect(editor._paintPresetRegistry.status).toBe('conflict');
  });

  it('shows the checkbox on a current master and removes an empty library without confirmation', async () => {
    const { editor } = await editorFor({ preset_library: { paint: {} }, keep: ['config'] });
    const events = configEvents(editor);
    const confirm = vi.fn();
    editor.ownerDocument.defaultView.confirm = confirm;
    const checkbox = editor.shadowRoot.querySelector('#preset-master');
    expect(checkbox.checked).toBe(true);
    checkbox.checked = false;
    dispatchDomEvent(checkbox, 'change');

    expect(confirm).not.toHaveBeenCalled();
    expect(events.at(-1)).toEqual({ keep: ['config'] });
  });

  it('preserves unknown library categories through unrelated draft edits', async () => {
    const library = { paint: { warm: { color: '#aa3300' } }, future: { version: 2, keep: true } };
    const savedSnapshot = { status: 'ready', masterCount: 1, presets: library.paint, masterLibrary: library };
    const config = { title: 'Before', preset_library: library, extra: { keep: true } };
    const { editor } = await editorFor(config);
    editor._paintPresetRegistry = savedSnapshot;
    const events = configEvents(editor);
    const title = editor.shadowRoot.querySelector('#title');
    title.value = 'After';
    dispatchDomEvent(title, 'input');

    expect(events.at(-1).preset_library).toEqual(library);
    expect(events.at(-1).extra).toEqual({ keep: true });
    expect(editor._config).toEqual(config);
    expect(editor._paintPresetRegistry).toBe(savedSnapshot);
  });
});
