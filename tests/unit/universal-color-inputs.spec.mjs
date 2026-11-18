import { describe, expect, it } from 'vitest';
import { renderColorInput } from '../../src/editor/shared/editor-controls.js';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

const featureType = 'custom:sensor-bar-card-plus-feature';

function changeColorPicker(picker, value) {
  picker.value = value;
  dispatchDomEvent(picker, 'input');
  dispatchDomEvent(picker, 'change');
}

describe('universal color renderer', () => {
  it.each(['#abc', '#A1b2C3'])('renders %s as a picker only', value => {
    const html = renderColorInput({ id: 'color', field: 'color', value, fallbackHex: '#123456' });
    expect(html).toContain('type="color"');
    expect(html).not.toContain('data-css-color');
    expect(html).not.toContain('type="text"');
  });

  it.each(['red', 'rgb(1, 2, 3)', 'var(--accent)', 'color-mix(in srgb, red, blue)'])
    ('keeps the original %s expression beside the picker', value => {
      const html = renderColorInput({ id: 'color', field: 'color', value, fallbackHex: '#123456' });
      expect(html).toContain('type="color"');
      expect(html).toContain('id="color-text-fallback" data-css-color="true"');
      expect(html).toContain(`value="${value}"`);
    });

  it('renders an empty value with the fallback picker only', () => {
    const html = renderColorInput({ id: 'color', field: 'color', value: '', fallbackHex: '#123456' });
    expect(html).toContain('type="color" data-field="color" value="#123456"');
    expect(html).not.toContain('data-css-color');
  });
});

for (const source of ['src', 'dist']) {
  describe(`standalone Card and Entity colors (${source})`, () => {
    it('preserves expressions, rejects incomplete drafts, and replaces expressions from the picker', async () => {
      const { editor } = await createDomEditorFixture({ source });
      const initial = { bar: { color: '#abc' }, entities: [{ entity: 'sensor.power', bar: { color: 'var(--row-color)' } }] };
      editor.setConfig(initial);
      const emitted = [];
      editor.addEventListener('config-changed', event => {
        emitted.push(event.detail.config);
        editor.setConfig(event.detail.config);
      });

      expect(editor.shadowRoot.querySelector('#bar-color-text-fallback')).toBeNull();
      expect(editor.shadowRoot.querySelector('#bar-color').value).toBe('#aabbcc');
      const rowText = editor.shadowRoot.querySelector('#entity-0-bar-color-text-fallback');
      expect(rowText.value).toBe('var(--row-color)');
      expect(emitted).toHaveLength(0);

      rowText.value = 'rgb(';
      dispatchDomEvent(rowText, 'input');
      expect(editor._draftConfig.entities[0].bar.color).toBe('var(--row-color)');
      expect(rowText.getAttribute('aria-invalid')).toBe('true');
      expect(emitted).toHaveLength(0);

      rowText.value = 'rgb(12, 34, 56)';
      dispatchDomEvent(rowText, 'input');
      expect(editor._draftConfig.entities[0].bar.color).toBe('rgb(12, 34, 56)');
      const saved = structuredClone(editor._draftConfig);
      expect(emitted.at(-1).entities[0].bar.color).toBe('rgb(12, 34, 56)');

      const reopened = await createDomEditorFixture({ source });
      reopened.editor.setConfig(saved);
      expect(reopened.editor.shadowRoot.querySelector('#entity-0-bar-color-text-fallback').value).toBe('rgb(12, 34, 56)');
      changeColorPicker(reopened.editor.shadowRoot.querySelector('#entity-0-bar-color'), '#445566');
      await reopened.editor.updateComplete;
      expect(reopened.editor._draftConfig.entities[0].bar.color).toBe('#445566');
      expect(reopened.editor.shadowRoot.querySelector('#entity-0-bar-color-text-fallback')).toBeNull();
      reopened.dispose();
    });
  });

  describe(`Tile Feature colors (${source})`, () => {
    it('keeps CSS expressions through reopen and accepts picker replacement', async () => {
      const { editor } = await createDomEditorFixture({ source, host: 'feature' });
      const initial = { type: featureType, bar: { paint: { color: 'color-mix(in srgb, red, blue)',
        segments: [{ from: 0, color: '#abc' }], gradient_stops: [{ pos: 0, color: 'var(--stop-color)' }, { pos: 100, color: '#123456' }] } } };
      editor.setConfig(initial);
      await editor.updateComplete;
      const emitted = [];
      editor.addEventListener('config-changed', event => {
        emitted.push(event.detail.config);
        editor.setConfig(event.detail.config);
      });

      expect(editor.shadowRoot.querySelector('#bar-color-text-fallback').value).toBe(initial.bar.paint.color);
      expect(editor.shadowRoot.querySelector('#segment-color-0-text-fallback')).toBeNull();
      expect(editor.shadowRoot.querySelector('#gradient-color-0-text-fallback').value).toBe('var(--stop-color)');
      expect(editor.shadowRoot.querySelector('#gradient-color-1-text-fallback')).toBeNull();
      expect(editor._config).toEqual(initial);
      expect(emitted).toHaveLength(0);

      const text = editor.shadowRoot.querySelector('#bar-color-text-fallback');
      text.value = 'rgb(';
      dispatchDomEvent(text, 'input');
      expect(editor._config.bar.paint.color).toBe(initial.bar.paint.color);
      expect(text.getAttribute('aria-invalid')).toBe('true');
      expect(emitted).toHaveLength(0);

      text.value = 'var(--saved-color)';
      dispatchDomEvent(text, 'input');
      const saved = structuredClone(editor._config);
      expect(saved.bar.paint.color).toBe('var(--saved-color)');
      const reopened = await createDomEditorFixture({ source, host: 'feature' });
      reopened.editor.setConfig(saved);
      await reopened.editor.updateComplete;
      expect(reopened.editor.shadowRoot.querySelector('#bar-color-text-fallback').value).toBe('var(--saved-color)');
      changeColorPicker(reopened.editor.shadowRoot.querySelector('#bar-color'), '#778899');
      await reopened.editor.updateComplete;
      expect(reopened.editor._config.bar.paint.color).toBe('#778899');
      expect(reopened.editor.shadowRoot.querySelector('#bar-color-text-fallback')).toBeNull();
      reopened.dispose();
    });
  });
}
