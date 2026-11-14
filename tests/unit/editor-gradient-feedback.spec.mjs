import { describe, it, expect } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

function trackConfigEvents(editor) {
  const events = [];
  editor.addEventListener('config-changed', event => events.push(event));
  return events;
}

function dispatchInput(element, value) {
  element.value = value;
  dispatchDomEvent(element, 'input');
}

function dispatchClick(element) {
  dispatchDomEvent(element, 'click');
}

for (const source of ['src', 'dist']) describe(`native gradient draft feedback (${source})`, () => {
  it('card-level draft Add is disabled for duplicate positions and 100 clamp saturation', async () => {
    const { editor } = await createDomEditorFixture({ source });
    const events = trackConfigEvents(editor);

    editor.setConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: 0, color: '#4CAF50' },
          { pos: 100, color: '#F44336' },
        ],
      },
    });

    dispatchClick(editor.shadowRoot.querySelector('#card-group-gradient-stops'));
    const input = editor.shadowRoot.querySelector('#gradient-draft-pos');
    const hint = editor.shadowRoot.querySelector('#gradient-draft-hint');
    expect(editor.shadowRoot.querySelector('#gradient-draft-pos').value).toBe('');
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-gradient-stop"]')[0].getAttribute('disabled')).not.toBeNull();
    dispatchInput(editor.shadowRoot.querySelector('#gradient-draft-pos'), '100');
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-gradient-stop"]')[0].getAttribute('disabled')).not.toBeNull();
    expect(editor.shadowRoot.innerHTML).toContain('Position already exists.');
    expect(editor.shadowRoot.querySelector('#gradient-draft-pos')).toBe(input);
    expect(editor.shadowRoot.querySelector('#gradient-draft-hint')).toBe(hint);
    expect(hint.textContent).toBe('Position already exists.');
    expect(hint.parentElement).toBe(input.closest('.gradient-stop-draft'));
    expect(events).toHaveLength(0);
  });

  it('card-level invalid draft handling keeps Add disabled and updates preview only for valid draft input', async () => {
    const { editor } = await createDomEditorFixture({ source });
    const events = trackConfigEvents(editor);

    editor.setConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: 0, color: '#4CAF50' },
          { pos: 100, color: '#F44336' },
        ],
      },
    });

    dispatchClick(editor.shadowRoot.querySelector('#card-group-gradient-stops'));
    const originalStyle = editor.shadowRoot.querySelector('#card-gradient-preview-track').getAttribute('style');
    // A native number input sanitizes 'bad' to ''. Keep raw malformed-value
    // validation at the section boundary, then exercise native invalid input.
    editor._gradientStopsSection._setGradientStopsDraftField({ type: 'card' }, 'pos', 'bad');
    expect(editor.shadowRoot.querySelector('#gradient-draft-hint').textContent).toBe('Enter a value from 0 to 100.');
    dispatchInput(editor.shadowRoot.querySelector('#gradient-draft-pos'), '-1');
    dispatchInput(editor.shadowRoot.querySelector('#gradient-draft-color'), '#00ff00');

    expect(events).toHaveLength(0);
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-gradient-stop"]')[0].getAttribute('disabled')).not.toBeNull();
    expect(editor.shadowRoot.innerHTML).toContain('Enter a value from 0 to 100.');
    expect(editor.shadowRoot.querySelector('#card-gradient-preview-track').getAttribute('style')).toBe(originalStyle);

    const input = editor.shadowRoot.querySelector('#gradient-draft-pos');
    const add = editor.shadowRoot.querySelector('button[data-action="add-gradient-stop"]');
    const container = input.closest('.gradient-stop-draft');
    dispatchInput(input, '50');
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-gradient-stop"]')[0].getAttribute('disabled')).toBeNull();
    expect(editor.shadowRoot.querySelector('#card-gradient-preview-track').getAttribute('style')).not.toBe(originalStyle);
    expect(add.disabled).toBe(false);
    expect(editor.shadowRoot.querySelector('#gradient-draft-pos')).toBe(input);
    expect(editor.shadowRoot.querySelector('#gradient-draft-hint')).toBeNull();
    expect(editor.shadowRoot.innerHTML).not.toContain('Enter a value from 0 to 100.');

    dispatchInput(input, '-1');
    const hint = editor.shadowRoot.querySelector('#gradient-draft-hint');
    expect(hint.parentElement).toBe(container);
    expect(container.querySelectorAll('#gradient-draft-hint')).toHaveLength(1);
    expect(hint.textContent).toBe('Enter a value from 0 to 100.');
    expect(editor.shadowRoot.innerHTML).toContain(hint.outerHTML);
    expect(add.disabled).toBe(true);
    expect(add.hasAttribute('disabled')).toBe(true);
    expect(editor.shadowRoot.querySelector('#card-gradient-preview-track').getAttribute('style')).toBe(originalStyle);
    expect(events).toHaveLength(0);
  });

  it('per-entity duplicate draft positions are blocked and preview updates only for valid drafts', async () => {
    const { editor } = await createDomEditorFixture({ source });
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        bar: {
          gradient_stops: [
            { pos: 0, color: '#4CAF50' },
            { pos: 100, color: '#F44336' },
          ],
        },
      }, { entity: 'sensor.two' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-gradient-stops'));
    const originalStyle = editor.shadowRoot.querySelector('#entity-0-gradient-preview-track').getAttribute('style');
    const otherAdd = editor.shadowRoot.querySelector('button[data-action="add-entity-gradient-stop"][data-index="1"]');
    const otherHint = editor.shadowRoot.querySelector('#entity-1-gradient-draft-hint');
    const otherText = otherHint.textContent;

    dispatchInput(editor.shadowRoot.querySelector('#entity-0-gradient-draft-pos'), '100');
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-entity-gradient-stop"]')[0].getAttribute('disabled')).not.toBeNull();
    expect(editor.shadowRoot.innerHTML).toContain('Position already exists.');
    expect(editor.shadowRoot.querySelector('#entity-0-gradient-preview-track').getAttribute('style')).toBe(originalStyle);

    dispatchInput(editor.shadowRoot.querySelector('#entity-0-gradient-draft-pos'), '50');
    expect(editor.shadowRoot.querySelectorAll('button[data-action="add-entity-gradient-stop"]')[0].getAttribute('disabled')).toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-gradient-preview-track').getAttribute('style')).not.toBe(originalStyle);
    expect(editor.shadowRoot.querySelector('button[data-action="add-entity-gradient-stop"][data-index="0"]').disabled).toBe(false);
    expect(editor.shadowRoot.querySelector('#entity-0-gradient-draft-hint')).toBeNull();
    expect(otherAdd.disabled).toBe(true);
    expect(otherHint.textContent).toBe(otherText);
    expect(events).toHaveLength(0);
  });
});
