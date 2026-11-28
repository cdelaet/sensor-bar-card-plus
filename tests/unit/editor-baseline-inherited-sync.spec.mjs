import { describe, expect, it } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

for (const source of ['src', 'dist']) describe(`Baseline inherited synchronization (${source})`, () => {
  it('keeps inherited percentage values formatted through Target and Card edits', async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({
      baseline: { at: { percent: 20 } },
      entities: [{ entity: 'sensor.percent' }, { entity: 'sensor.fixed' }],
    });
    const percent = editor.shadowRoot.querySelector('#entity-0-baseline-value');
    const fixed = editor.shadowRoot.querySelector('#entity-1-baseline-value');
    expect(percent.value).toBe('20%');

    const target = editor.shadowRoot.querySelector('#entity-0-target-value');
    target.value = '65';
    dispatchDomEvent(target, 'input');
    expect(target.value).toBe('65');
    expect(percent.value).toBe('20%');
    expect(editor._getEffectiveBaselineResolvableValue({ type: 'entity', index: 0 })).toMatchObject({ percent: 20 });
    expect(editor._draftConfig.entities[0]).toMatchObject({ target: { at: { fixed: 65 } } });
    expect(editor._draftConfig.entities[0]).not.toHaveProperty('baseline');

    const cardBaseline = editor.shadowRoot.querySelector('#baseline-value');
    cardBaseline.value = '25%';
    dispatchDomEvent(cardBaseline, 'input');
    expect(percent.value).toBe('25%');
    expect(editor._draftConfig.entities[0]).not.toHaveProperty('baseline');

  });

  it('formats an inherited fixed Baseline as a number', async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({ baseline: { at: { fixed: 42 } }, entities: [{ entity: 'sensor.fixed' }] });
    expect(editor.shadowRoot.querySelector('#entity-0-baseline-value').value).toBe('42');
  });

  it('keeps local overrides authoritative, restores inheritance when cleared, and preserves focused drafts', async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({
      baseline: { at: { percent: 20 } },
      entities: [
        { entity: 'sensor.percent', baseline: { at: { percent: 12 } } },
        { entity: 'sensor.fixed', baseline: { at: { fixed: 7 } } },
        { entity: 'sensor.pending' },
      ],
    });
    const localPercent = editor.shadowRoot.querySelector('#entity-0-baseline-value');
    const localFixed = editor.shadowRoot.querySelector('#entity-1-baseline-value');
    const inherited = editor.shadowRoot.querySelector('#entity-2-baseline-value');
    expect(localPercent.value).toBe('12%');
    expect(localFixed.value).toBe('7');
    expect(inherited.value).toBe('20%');

    const events = [];
    editor.addEventListener('config-changed', event => events.push(event.detail.config));
    for (let node = inherited.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    inherited.focus();
    inherited.value = '.';
    dispatchDomEvent(inherited, 'input');
    expect(editor._numericDrafts.values.get(inherited.id)).toBe('.');
    const eventCount = events.length;

    const target = editor.shadowRoot.querySelector('#entity-0-target-value');
    target.value = '65';
    dispatchDomEvent(target, 'input');
    expect(events).toHaveLength(eventCount + 1);
    expect(inherited.value).toBe('.');
    expect(editor._numericDrafts.values.get(inherited.id)).toBe('.');
    expect(localPercent.value).toBe('12%');
    expect(localFixed.value).toBe('7');
    expect(editor._draftConfig.entities[2]).toEqual({ entity: 'sensor.pending' });

    const inherit = editor.shadowRoot.querySelector('#entity-0-baseline-inherit');
    inherit.checked = true;
    dispatchDomEvent(inherit, 'change');
    expect(events).toHaveLength(eventCount + 2);
    expect(localPercent.value).toBe('20%');
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.percent', target: { at: { fixed: 65 } } });
    expect(editor._draftConfig.entities[1].baseline.at).toEqual({ fixed: 7 });
  });
});
