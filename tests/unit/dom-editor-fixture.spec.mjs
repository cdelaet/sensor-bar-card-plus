import { it, expect, vi } from 'vitest';
import { getCardClassBundles, createCard } from '../support/load-card-class.cjs';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

for (const source of ['src', 'dist']) {
  it(`isolates real editor realms while sharing immutable bundles (${source})`, async () => {
    const first = await createDomEditorFixture({ source });
    const second = await createDomEditorFixture({ source, host: 'feature', withEntityPicker: true });
    expect(getCardClassBundles({ source }).bundles).toBe(getCardClassBundles({ source }).bundles);
    expect(first.window.document).not.toBe(second.window.document);
    expect(first.window.customElements).not.toBe(second.window.customElements);
    expect(first.editor).toBeInstanceOf(first.window.HTMLElement);
    expect(second.editor).toBeInstanceOf(second.window.HTMLElement);
    expect(first.editor.isConnected).toBe(true);
    expect(second.editor.isConnected).toBe(true);
    expect(first.window.customElements.get('ha-entity-picker')).toBeUndefined();
    expect(second.window.customElements.get('ha-entity-picker')).toBeDefined();
    expect(first.window.customElements.get('sensor-bar-card-plus-editor')).toBe(first.editor.constructor);
    expect(second.window.customElements.get('sensor-bar-card-plus-feature-editor')).toBe(second.editor.constructor);

    first.editor.setConfig({ title: 'Before', entity: 'sensor.one' });
    const emitted = [];
    first.window.document.body.addEventListener('config-changed', event => emitted.push(event));
    const title = first.editor.shadowRoot.querySelector('#title');
    title.value = 'After';
    dispatchDomEvent(title, 'input');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBeInstanceOf(first.window.CustomEvent);
    expect(emitted[0].detail.config.title).toBe('After');
  });
}

it('disconnects the editor and cancels realm timers and animation frames on teardown', async () => {
  const { editor, window, dispose } = await createDomEditorFixture();
  const unsubscribe = vi.fn();
  editor._paintPresetHandle = { unsubscribe };
  const pending = vi.fn();
  window.setTimeout(pending, 0);
  window.setInterval(pending, 1);
  window.requestAnimationFrame(pending);
  dispose();
  dispose();
  expect(editor.isConnected).toBe(false);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(pending).not.toHaveBeenCalled();
});

it('retains the independent lightweight card logic fixture', () => {
  const card = createCard();
  const root = { querySelectorAll: () => [] };
  card.shadowRoot = root;
  expect(card.shadowRoot).toBe(root);
});
