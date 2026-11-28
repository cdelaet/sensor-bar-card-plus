import { describe, expect, it } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

for (const source of ['src', 'dist']) describe(`Formatting inherited synchronization (${source})`, () => {
  it('updates mounted inherited Unit and Decimals without creating Entity overrides', async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({ formatting: { unit: 'W', decimal: 2 }, entities: [{ entity: 'sensor.power' }] });

    const entityUnit = editor.shadowRoot.querySelector('#entity-0-formatting-unit');
    const entityDecimal = editor.shadowRoot.querySelector('#entity-0-formatting-decimal');
    expect(entityUnit.value).toBe('W');
    expect(entityDecimal.value).toBe('2');

    const cardUnit = editor.shadowRoot.querySelector('#formatting-unit');
    cardUnit.value = 'kW';
    dispatchDomEvent(cardUnit, 'input');
    expect(entityUnit.value).toBe('kW');

    const cardDecimal = editor.shadowRoot.querySelector('#formatting-decimal');
    cardDecimal.value = '3';
    dispatchDomEvent(cardDecimal, 'input');
    expect(entityDecimal.value).toBe('3');
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.power' });
  });

  it('retains a focused pending decimal clear while Card Decimal changes', async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({ formatting: { unit: 'W', decimal: 2 }, entities: [{ entity: 'sensor.power' }] });

    const entityDecimal = editor.shadowRoot.querySelector('#entity-0-formatting-decimal');
    entityDecimal.focus();
    entityDecimal.value = '';
    dispatchDomEvent(entityDecimal, 'input');
    expect(editor._numericDrafts.values.get(entityDecimal.id)).toBe('');

    const cardDecimal = editor.shadowRoot.querySelector('#formatting-decimal');
    cardDecimal.value = '3';
    dispatchDomEvent(cardDecimal, 'input');

    expect(entityDecimal.value).toBe('');
    expect(editor._numericDrafts.values.get(entityDecimal.id)).toBe('');
    expect(editor._draftConfig.formatting.decimal).toBe(3);
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.power' });
  });
});
