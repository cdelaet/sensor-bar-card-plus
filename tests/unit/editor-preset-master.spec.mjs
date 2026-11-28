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

describe('Visual Editor Share Paint Presets controls', () => {
  it('shows the Share Paint Presets control on every Card and creates an empty local library', async () => {
    const { editor } = await editorFor({ entity: 'sensor.one', custom: { preserve: true } });
    const events = configEvents(editor);
    const checkbox = editor.shadowRoot.querySelector('#preset-master');

    expect(checkbox).not.toBeNull();
    expect(editor.shadowRoot.querySelector('label[for="preset-master"]').textContent).toBe('Share Paint Presets');
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
    expect(editor.shadowRoot.querySelector('.preset-master-title').textContent)
      .toBe('This Card shares its Paint Presets with this dashboard.');
    expect(editor.shadowRoot.querySelector('#paint-presets')).not.toBeNull();
  });

  it('allows another Card to enable sharing when dashboard libraries already exist', async () => {
    const { editor } = await editorFor({ entity: 'sensor.one' });
    editor._paintPresetRegistry = { status: 'ready', libraryCount: 3, presets: {}, conflicts: {} };
    editor._render();
    const checkbox = editor.shadowRoot.querySelector('#preset-master');
    expect(checkbox).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#paint-presets')).toBeNull();
    checkbox.checked = true;
    dispatchDomEvent(checkbox, 'change');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(editor._draftConfig.preset_library).toEqual({});
    expect(editor.shadowRoot.querySelector('#paint-presets')).not.toBeNull();
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
    expect(confirm).toHaveBeenCalledWith("Turning off Share Paint Presets will remove this Card's preset library. Continue?");
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

  it('shows only this Card’s duplicate names and reconciles multiple warnings without duplication', async () => {
    const config = { preset_library: { paint: { Thermal: {}, Energy: {}, Unique: {} }, unknown_category: { retained: true } } };
    const { editor } = await editorFor(config);
    editor._paintPresetRegistry = { status: 'ready', libraryCount: 4, presets: {}, conflicts: { Thermal: 2, Energy: 2, Other: 4 } };
    editor._render();
    const section = editor.shadowRoot.querySelector('.preset-master-section');
    const container = section.querySelector('.paint-preset-authoring-warnings');
    expect(editor.shadowRoot.querySelector('#preset-master').checked).toBe(true);
    expect(editor.shadowRoot.querySelector('#paint-presets')).not.toBeNull();
    expect(container.children).toHaveLength(2);
    expect([...container.children].map(node => node.dataset.presetName)).toEqual(['Thermal', 'Energy']);
    expect([...container.children].map(node => node.textContent)).toEqual([
      'Paint preset "Thermal" is defined by 2 Cards in this dashboard. Rename or remove this definition so only one Card defines it.',
      'Paint preset "Energy" is defined by 2 Cards in this dashboard. Rename or remove this definition so only one Card defines it.',
    ]);
    expect(section.contains(container)).toBe(true);
    expect([...section.children].indexOf(container)).toBeLessThan([...section.children].indexOf(section.querySelector('#paint-presets')));
    editor._syncPresetMasterControls();
    editor._syncPresetMasterControls();
    expect(container.children).toHaveLength(2);
    const thermalWarning = container.children[0];
    editor._paintPresetRegistry = { status: 'ready', libraryCount: 5, presets: {}, conflicts: { Thermal: 3, Energy: 2, Other: 4 } };
    editor._syncPresetMasterControls();
    expect(container.children).toHaveLength(2);
    expect(container.children[0]).toBe(thermalWarning);
    expect(thermalWarning.textContent).toContain('defined by 3 Cards');

    const events = configEvents(editor);
    const confirm = vi.fn(() => false);
    editor.ownerDocument.defaultView.confirm = confirm;
    const checkbox = editor.shadowRoot.querySelector('#preset-master');
    checkbox.checked = false;
    dispatchDomEvent(checkbox, 'change');
    expect(events).toHaveLength(0);
    expect(editor._draftConfig).toEqual(config);
    expect(container.children).toHaveLength(2);

    editor._paintPresetRegistry = { status: 'ready', libraryCount: 2, presets: {}, conflicts: { Energy: 2 } };
    editor._syncPresetMasterControls();
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild.dataset.presetName).toBe('Energy');
    editor._paintPresetRegistry = { status: 'ready', libraryCount: 1, presets: {}, conflicts: {} };
    editor._syncPresetMasterControls();
    expect(container.children).toHaveLength(0);
    expect(container.hidden).toBe(true);
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
    const savedSnapshot = { status: 'ready', libraryCount: 1, presets: library.paint, conflicts: {} };
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

  it('warns for an authored reserved preset name using own-property conflict lookup', async () => {
    const config = JSON.parse('{"preset_library":{"paint":{"__proto__":{},"other":{}}}}');
    const { editor } = await editorFor(config);
    editor._paintPresetRegistry = { status: 'ready', presets: {}, conflicts: JSON.parse('{"__proto__":2,"external":3}') };
    editor._syncPresetMasterControls();
    const warnings = editor.shadowRoot.querySelectorAll('.paint-preset-authoring-warning');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].dataset.presetName).toBe('__proto__');
    expect(warnings[0].textContent).toContain('defined by 2 Cards');
  });
});
