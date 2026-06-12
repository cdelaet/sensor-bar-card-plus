import { describe, it, expect } from 'vitest';
import { createEditor, loadElementClass } from '../support/load-card-class.cjs';

function trackConfigEvents(editor) {
  const events = [];
  editor.dispatchEvent = (event) => {
    events.push(event);
    return true;
  };
  return events;
}

async function flushTimers() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function dispatchInput(el, value) {
  el.value = value;
  el.dispatchEvent({
    type: 'input',
    bubbles: true,
    composed: true,
  });
}

function dispatchChange(el, value) {
  el.value = value;
  el.dispatchEvent({
    type: 'change',
    bubbles: true,
    composed: true,
  });
}

function dispatchClick(el) {
  el.dispatchEvent({
    type: 'click',
    bubbles: true,
    composed: true,
  });
}

function dispatchValueChanged(el, value) {
  el.value = value;
  el.dispatchEvent({
    type: 'value-changed',
    detail: { value },
    bubbles: true,
    composed: true,
  });
}

function expectNoDeprecatedEditedKeys(target) {
  expect(target.min).toBeUndefined();
  expect(target.max).toBeUndefined();
  expect(target.min_entity).toBeUndefined();
  expect(target.max_entity).toBeUndefined();
  expect(target.height).toBeUndefined();
  expect(target.color).toBeUndefined();
  expect(target.show_peak).toBeUndefined();
  expect(target.peak_color).toBeUndefined();
}

describe('Sensor Bar Card Plus editor', () => {
  it('exposes a Lovelace config editor element', () => {
    const CardClass = loadElementClass('card');
    const editor = CardClass.getConfigElement();

    expect(editor.constructor.name).toBe('SensorBarCardPlusEditor');
  });

  it('render does not dispatch config-changed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      title: 'Power',
    });

    events.length = 0;
    editor._render();

    expect(events).toHaveLength(0);
  });

  it('title input emits changed config with bubbles and composed enabled', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      title: 'Power',
      card_mod: {
        style: 'ha-card { background: red; }',
      },
    });

    events.length = 0;
    const titleInput = editor.shadowRoot.querySelector('#title');
    dispatchInput(titleInput, 'Updated Power');

    expect(events).toHaveLength(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
    expect(events[0].detail.config.title).toBe('Updated Power');
    expect(events[0].detail.config.card_mod).toEqual({
      style: 'ha-card { background: red; }',
    });
  });

  it('entity name input emits changed config through the real input path', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'Kitchen', custom_key: 'keep' }],
      card_mod: { style: 'ha-card { color: white; }' },
    });

    const nameInput = editor.shadowRoot.querySelectorAll('input[data-kind="entity-name"]')[0];
    dispatchInput(nameInput, 'Updated Kitchen');

    expect(events).toHaveLength(1);
    expect(events[0].detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'Updated Kitchen', custom_key: 'keep' },
    ]);
  });

  it('entity icon input emits changed config through the real input path', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', icon: 'mdi:flash', custom_key: 'keep' }],
    });

    const iconInput = editor.shadowRoot.querySelectorAll('input[data-kind="entity-icon"]')[0];
    dispatchInput(iconInput, 'mdi:thermometer');

    expect(events).toHaveLength(1);
    expect(events[0].detail.config.entities).toEqual([
      { entity: 'sensor.one', icon: 'mdi:thermometer', custom_key: 'keep' },
    ]);
  });

  it('override expander renders collapsed by default', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
        { entity: 'sensor.two', name: 'Two' },
      ],
    });

    const toggles = editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]');
    expect(toggles).toHaveLength(2);
    expect(toggles[0].getAttribute('aria-expanded')).toBe('false');
    expect(toggles[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('expanding one entity override section does not expand all rows', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
        { entity: 'sensor.two', name: 'Two' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    const toggles = editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]');
    expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
    expect(toggles[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('entity Overrides panel renders grouped subsection headers', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-layout')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-target')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-baseline')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-bar')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-group-needle')).not.toBeNull();
  });

  it('subsection groups are collapsed by default inside an opened Overrides panel', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-layout').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-target').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-baseline').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-bar').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-needle').getAttribute('aria-expanded')).toBe('false');
  });

  it('opening one subsection does not open other subsections', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('true');
    expect(editor.shadowRoot.querySelector('#entity-0-group-layout').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-target').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-baseline').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-bar').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-needle').getAttribute('aria-expanded')).toBe('false');
  });

  it('opening formatting subsection does not open other subsections', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting').getAttribute('aria-expanded')).toBe('true');
    expect(editor.shadowRoot.querySelector('#entity-0-group-target').getAttribute('aria-expanded')).toBe('false');
  });

  it('opening layout subsection does not open other subsections', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('false');
    expect(editor.shadowRoot.querySelector('#entity-0-group-layout').getAttribute('aria-expanded')).toBe('true');
    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting').getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking subsection title toggles the subsection', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale-title'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking subsection summary toggles the subsection', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale-summary'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking opened subsection controls does not collapse the subsection', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-min'), '12');

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('true');
  });

  it('expanded Scale group styling uses the scale accent variable', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    const styles = editor.shadowRoot.innerHTML;
    expect(styles).toMatch(/\.override-group\[data-group="scale"\]\s*\{\s*--override-group-accent:\s*#4f8dff;/);
    expect(styles).toMatch(/border-color:\s*color-mix\(in srgb,\s*var\(--override-group-accent\)\s*34%,\s*transparent\);/);
  });

  it('expanded Target group styling uses the target accent variable and not the shared accent rule', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    const styles = editor.shadowRoot.innerHTML;
    expect(styles).toMatch(/\.override-group\[data-group="target"\]\s*\{\s*--override-group-accent:\s*#ff9b3d;/);
    expect(styles).not.toMatch(/\.override-group\[data-expanded="true"\]\s*\{\s*border-color:\s*color-mix\(in srgb,\s*var\(--accent-color,\s*var\(--primary-color,\s*#03a9f4\)\)\s*34%,\s*transparent\);/);
  });

  it('opening one entity subsection does not open another entity subsection', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
        { entity: 'sensor.two', name: 'Two' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[1]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale'));

    expect(editor.shadowRoot.querySelector('#entity-0-group-scale').getAttribute('aria-expanded')).toBe('true');
    expect(editor.shadowRoot.querySelector('#entity-1-group-scale').getAttribute('aria-expanded')).toBe('false');
  });

  it('subsection open state is not written into emitted config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale'));

    expect(events).toHaveLength(0);
    expect(editor._draftConfig).toEqual({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });
  });

  it('subsection groups contain the existing override fields', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-scale'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-target'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-baseline'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-bar'));
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-needle'));

    expect(editor.shadowRoot.querySelector('#entity-0-min')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-max')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-height')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-label-position')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-label-width')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-formatting-unit')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-formatting-decimal')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-target-value')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-target-color')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-baseline-value')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-baseline-above-color')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-bar-fill-style')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-bar-color')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-needle-mode')).not.toBeNull();
    expect(editor.shadowRoot.querySelector('#entity-0-needle-color')).not.toBeNull();
  });

  it('entity scale min fixed override renders Min inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', scale: { min: { fixed: 0 } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-min-inherit').checked).toBe(false);
  });

  it('entity scale min entity override renders Min inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', scale: { min: { entity: 'sensor.dynamic_min' } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-min-inherit').checked).toBe(false);
  });

  it('entity scale max fixed override renders Max inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', scale: { max: { fixed: 5000 } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-max-inherit').checked).toBe(false);
  });

  it('entity scale max entity override renders Max inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', scale: { max: { entity: 'sensor.dynamic_max' } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-max-inherit').checked).toBe(false);
  });

  it('entity formatting override renders Formatting inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', formatting: { unit: 'kW' } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-formatting-inherit').checked).toBe(false);
  });

  it('entity layout override renders Layout inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', layout: { height: 42 } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-layout-inherit').checked).toBe(false);
  });

  it('entity target override renders Target inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', target: { at: { fixed: 2500 } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-target-inherit').checked).toBe(false);
  });

  it('entity baseline override renders Baseline inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', baseline: { at: { fixed: 0 } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-baseline-inherit').checked).toBe(false);
  });

  it('entity bar appearance override renders Bar Appearance inherit unchecked', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', bar: { color: '#ff9800' } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-bar-inherit').checked).toBe(false);
  });

  it('entity needle override renders Needle mode as enabled, not inherit', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', bar: { needle: { show: true } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelector('#entity-0-needle-mode').value).toBe('enabled');
  });

  it('fake ha-entity-picker value-changed updates entities[index].entity', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'Kitchen', custom_key: 'keep' }],
    });

    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="entity-picker"]')[0];
    expect(picker.hass).toEqual({ states: {} });
    dispatchValueChanged(picker, 'sensor.updated');

    expect(events).toHaveLength(1);
    expect(events[0].detail.config.entities).toEqual([
      { entity: 'sensor.updated', name: 'Kitchen', custom_key: 'keep' },
    ]);
  });

  it('per-entity min override writes entities[index].scale.min.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
        { entity: 'sensor.two', name: 'Two' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[1]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[1], '12');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One' },
      { entity: 'sensor.two', name: 'Two', scale: { min: { fixed: 12 } } },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[1]);
  });

  it('per-entity min entity override writes entities[index].scale.min.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min-entity-source"]')[0], 'sensor.dynamic_min');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', scale: { min: { entity: 'sensor.dynamic_min' } } },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[0]);
  });

  it('per-entity min fixed plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[0], '-5000');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min-entity-source"]')[0], 'sensor.dynamic_min');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', scale: { min: { fixed: -5000, entity: 'sensor.dynamic_min' } } },
    ]);
  });

  it('per-entity max override writes entities[index].scale.max.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
        { entity: 'sensor.two', name: 'Two' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max"]')[0], '11000');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', scale: { max: { fixed: 11000 } } },
      { entity: 'sensor.two', name: 'Two' },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[0]);
  });

  it('per-entity max entity override writes entities[index].scale.max.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max-entity-source"]')[0], 'sensor.dynamic_max');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', scale: { max: { entity: 'sensor.dynamic_max' } } },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[0]);
  });

  it('per-entity max fixed plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max"]')[0], '5000');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max-entity-source"]')[0], 'sensor.dynamic_max');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', scale: { max: { fixed: 5000, entity: 'sensor.dynamic_max' } } },
    ]);
  });

  it('per-entity height override writes entities[index].layout.height', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-height"]')[0], '48');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', layout: { height: 48 } },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[0]);
  });

  it('per-entity color override writes entities[index].bar.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const colorInput = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-color"]')[0];
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ffa500');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { color: '#ffa500' } },
    ]);
    expectNoDeprecatedEditedKeys(finalConfig.entities[0]);
  });

  it('clearing an override removes only that specific key', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          min: 5,
          custom_entity_key: 'keep',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[0], '');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      },
    ]);
    expect(finalConfig.entities[0].scale).toBeUndefined();
    expect(finalConfig.entities[0].min).toBeUndefined();
  });

  it('clearing per-entity fixed preserves entity override', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          scale: {
            min: {
              fixed: 5,
              entity: 'sensor.dynamic_min',
            },
          },
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        scale: {
          min: {
            entity: 'sensor.dynamic_min',
          },
        },
      },
    ]);
  });

  it('clearing per-entity entity preserves fixed fallback', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          scale: {
            max: {
              fixed: 5000,
              entity: 'sensor.dynamic_max',
            },
          },
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        scale: {
          max: {
            fixed: 5000,
          },
        },
      },
    ]);
  });

  it('clearing both per-entity Min fields removes entities[index].scale.min', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          scale: {
            min: {
              fixed: 5,
              entity: 'sensor.dynamic_min',
            },
          },
          custom_entity_key: 'keep',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      },
    ]);
  });

  it('clearing both per-entity Max fields removes entities[index].scale.max', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          scale: {
            max: {
              fixed: 10,
              entity: 'sensor.dynamic_max',
            },
          },
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
      },
    ]);
  });

  it('clearing an override preserves unknown keys on that entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          color: 'orange',
          custom_entity_key: 'keep',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-color"]')[0], '');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      },
    ]);
    expect(finalConfig.entities[0].bar).toBeUndefined();
    expect(finalConfig.entities[0].color).toBeUndefined();
  });

  it('add entity converts single-entity shorthand into clean entities[] and removes top-level entity', async () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      name: 'Kitchen',
      card_mod: { style: 'ha-card { color: white; }' },
      custom_top_level: true,
    });

    const addButton = editor.shadowRoot.querySelectorAll('button[data-action="add-entity"]')[0];
    dispatchClick(addButton);
    await flushTimers();

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'Kitchen' },
      { entity: '' },
    ]);
    expect(finalConfig.entity).toBeUndefined();
    expect(finalConfig.name).toBeUndefined();
    expect(finalConfig.custom_top_level).toBe(true);
    expect(editor.shadowRoot.innerHTML).toContain('data-index="1"');
  });

  it('repeated equivalent setConfig does not wipe a draft edit', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);
    const initialConfig = {
      entity: 'sensor.one',
      title: 'Power',
    };

    editor.setConfig(initialConfig);
    dispatchInput(editor.shadowRoot.querySelector('#title'), 'Draft Title');
    expect(events.at(-1).detail.config.title).toBe('Draft Title');

    editor.setConfig(initialConfig);

    expect(editor._draftConfig.title).toBe('Draft Title');
    expect(editor._config.title).toBe('Power');
  });

  it('edited config survives save and reopen through setConfig', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      title: 'Power',
    });

    dispatchInput(editor.shadowRoot.querySelector('#title'), 'Persisted Title');

    const savedConfig = events.at(-1).detail.config;
    const reopenedEditor = createEditor();
    reopenedEditor.setConfig(savedConfig);

    expect(savedConfig.title).toBe('Persisted Title');
    expect(reopenedEditor._config.title).toBe('Persisted Title');
    expect(reopenedEditor._draftConfig.title).toBe('Persisted Title');
    expect(reopenedEditor.shadowRoot.innerHTML).toContain('Persisted Title');
  });

  it('setConfig with equivalent config does not force a redundant render', () => {
    const editor = createEditor();
    let renderCount = 0;
    const originalRender = editor._render.bind(editor);
    editor._render = () => {
      renderCount += 1;
      return originalRender();
    };

    const config = {
      entity: 'sensor.one',
      title: 'Power',
      card_mod: {
        style: 'ha-card { background: red; }',
      },
    };

    editor.setConfig(config);
    editor.setConfig({
      title: 'Power',
      card_mod: {
        style: 'ha-card { background: red; }',
      },
      entity: 'sensor.one',
    });

    expect(renderCount).toBe(1);
  });

  it('scale min/max edits write structured card-level scale bounds', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      scale: {
        min: {
          fixed: 0,
        },
      },
      card_mod: {
        style: 'ha-card { background: red; }',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '10');
    dispatchInput(editor.shadowRoot.querySelector('#scale-max'), '250');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.scale).toEqual({
      min: { fixed: 10 },
      max: { fixed: 250 },
    });
    expectNoDeprecatedEditedKeys(finalConfig);
    expect(finalConfig.card_mod).toEqual({
      style: 'ha-card { background: red; }',
    });
  });

  it('card-level Min entity only writes scale.min.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0], 'sensor.dynamic_min');

    expect(events.at(-1).detail.config.scale).toEqual({
      min: { entity: 'sensor.dynamic_min' },
    });
    expectNoDeprecatedEditedKeys(events.at(-1).detail.config);
  });

  it('card-level Min fixed plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '-1000');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0], 'sensor.dynamic_min');

    expect(events.at(-1).detail.config.scale).toEqual({
      min: { fixed: -1000, entity: 'sensor.dynamic_min' },
    });
  });

  it('card-level Max entity only writes scale.max.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-max-entity-source"]')[0], 'sensor.dynamic_max');

    expect(events.at(-1).detail.config.scale).toEqual({
      max: { entity: 'sensor.dynamic_max' },
    });
  });

  it('card-level Max fixed plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-max'), '1000');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-max-entity-source"]')[0], 'sensor.dynamic_max');

    expect(events.at(-1).detail.config.scale).toEqual({
      max: { fixed: 1000, entity: 'sensor.dynamic_max' },
    });
  });

  it('clearing card-level Min fixed preserves Min entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      scale: {
        min: {
          fixed: -1000,
          entity: 'sensor.dynamic_min',
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '');

    expect(events.at(-1).detail.config.scale).toEqual({
      min: {
        entity: 'sensor.dynamic_min',
      },
    });
  });

  it('clearing card-level Min entity preserves Min fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      scale: {
        min: {
          fixed: -1000,
          entity: 'sensor.dynamic_min',
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.scale).toEqual({
      min: {
        fixed: -1000,
      },
    });
  });

  it('clearing both card-level Min fields removes scale.min', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      scale: {
        min: {
          fixed: -1000,
          entity: 'sensor.dynamic_min',
        },
        max: {
          fixed: 1000,
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.scale).toEqual({
      max: {
        fixed: 1000,
      },
    });
  });

  it('card-level scale edits loaded from flat config convert to structured scale while preserving entity overrides', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      min: 0,
      max: 100,
      min_entity: 'sensor.legacy_min',
      max_entity: 'sensor.legacy_max',
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '10');
    dispatchInput(editor.shadowRoot.querySelector('#scale-max'), '250');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.scale).toEqual({
      min: { fixed: 10, entity: 'sensor.legacy_min' },
      max: { fixed: 250, entity: 'sensor.legacy_max' },
    });
    expect(finalConfig.min).toBeUndefined();
    expect(finalConfig.max).toBeUndefined();
    expect(finalConfig.min_entity).toBeUndefined();
    expect(finalConfig.max_entity).toBeUndefined();
  });

  it('loading flat min, max, min_entity, and max_entity renders correctly', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      min: 0,
      max: 100,
      min_entity: 'sensor.dynamic_min',
      max_entity: 'sensor.dynamic_max',
    });

    expect(editor.shadowRoot.querySelector('#scale-min').value).toBe('0');
    expect(editor.shadowRoot.querySelector('#scale-max').value).toBe('100');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0].value).toBe('sensor.dynamic_min');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="scale-max-entity-source"]')[0].value).toBe('sensor.dynamic_max');
  });

  it('editing a flat-loaded Min field converts only that field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      min: 0,
      max_entity: 'sensor.dynamic_max',
      custom_top_level: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelector('#scale-min'), '10');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.scale).toEqual({
      min: {
        fixed: 10,
      },
    });
    expect(finalConfig.min).toBeUndefined();
    expect(finalConfig.min_entity).toBeUndefined();
    expect(finalConfig.max_entity).toBe('sensor.dynamic_max');
    expect(finalConfig.custom_top_level).toBe('keep');
  });

  it('fake ha-entity-picker value-changed works for dynamic Min/Max', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One' },
      ],
    });

    const cardMinPicker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="scale-min-entity-source"]')[0];
    dispatchValueChanged(cardMinPicker, 'sensor.card_min');

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const entityMaxPicker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="entity-override-max-entity-source"]')[0];
    expect(entityMaxPicker.hass).toEqual({ states: {} });
    dispatchValueChanged(entityMaxPicker, 'sensor.entity_max');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.scale).toEqual({
      min: {
        entity: 'sensor.card_min',
      },
    });
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        scale: {
          max: {
            entity: 'sensor.entity_max',
          },
        },
      },
    ]);
  });

  it('card-level formatting unit only writes formatting.unit', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#formatting-unit'), 'W');

    expect(events.at(-1).detail.config.formatting).toEqual({ unit: 'W' });
    expect(events.at(-1).detail.config.unit).toBeUndefined();
  });

  it('card-level formatting decimal only writes formatting.decimal', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#formatting-decimal'), '1');

    expect(events.at(-1).detail.config.formatting).toEqual({ decimal: 1 });
    expect(events.at(-1).detail.config.decimal).toBeUndefined();
  });

  it('card-level formatting unit and decimal write together', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#formatting-unit'), 'kW');
    dispatchInput(editor.shadowRoot.querySelector('#formatting-decimal'), '2');

    expect(events.at(-1).detail.config.formatting).toEqual({ unit: 'kW', decimal: 2 });
  });

  it('clearing card-level formatting unit preserves decimal', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      formatting: { unit: 'kW', decimal: 2 },
    });

    dispatchInput(editor.shadowRoot.querySelector('#formatting-unit'), '');

    expect(events.at(-1).detail.config.formatting).toEqual({ decimal: 2 });
  });

  it('clearing card-level formatting decimal preserves unit', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      formatting: { unit: 'kW', decimal: 2 },
    });

    dispatchInput(editor.shadowRoot.querySelector('#formatting-decimal'), '');

    expect(events.at(-1).detail.config.formatting).toEqual({ unit: 'kW' });
  });

  it('card-level formatting reads legacy flat config', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      unit: 'W',
      decimal: 1,
    });

    expect(editor.shadowRoot.querySelector('#formatting-unit').value).toBe('W');
    expect(editor.shadowRoot.querySelector('#formatting-decimal').value).toBe('1');
  });

  it('editing legacy flat formatting converts only the edited field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      unit: 'W',
      decimal: 1,
      custom_key: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelector('#formatting-unit'), 'kW');

    expect(events.at(-1).detail.config.formatting).toEqual({ unit: 'kW' });
    expect(events.at(-1).detail.config.unit).toBeUndefined();
    expect(events.at(-1).detail.config.decimal).toBe(1);
    expect(events.at(-1).detail.config.custom_key).toBe('keep');
  });

  it('per-entity formatting group is collapsed by default', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [{ entity: 'sensor.one' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    expect(editor.shadowRoot.querySelector('#entity-0-group-formatting').getAttribute('aria-expanded')).toBe('false');
  });

  it('per-entity formatting summary renders inherited', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [{ entity: 'sensor.one' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    expect(editor.shadowRoot.innerHTML).toContain('id="entity-0-group-formatting-summary"');
    expect(editor.shadowRoot.innerHTML).toContain('>Inherited</span>');
  });

  it('per-entity formatting summary renders unit and decimals', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [{ entity: 'sensor.one', formatting: { unit: 'kW', decimal: 2 } }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);

    expect(editor.shadowRoot.innerHTML).toContain('unit kW • 2 decimals</span>');
  });

  it('per-entity formatting unit override writes entities[index].formatting.unit', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-unit'), 'kW');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', formatting: { unit: 'kW' } },
    ]);
  });

  it('per-entity formatting decimal override writes entities[index].formatting.decimal', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-decimal'), '2');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', formatting: { decimal: 2 } },
    ]);
  });

  it('per-entity formatting unit and decimal write together', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-unit'), 'kW');
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-decimal'), '2');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', formatting: { unit: 'kW', decimal: 2 } },
    ]);
  });

  it('clearing one per-entity formatting field preserves the other', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', formatting: { unit: 'kW', decimal: 2 } }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-unit'), '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', formatting: { decimal: 2 } },
    ]);
  });

  it('clearing both per-entity formatting fields removes formatting block', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', formatting: { unit: 'kW', decimal: 2 } }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-unit'), '');
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-formatting-decimal'), '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one' },
    ]);
  });

  it('per-entity formatting preserve unrelated formatting keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        formatting: { unit: 'kW', decimal: 2, custom_formatting_key: 'keep' },
        other_key: 'keep',
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-formatting'));
    const toggle = editor.shadowRoot.querySelector('#entity-0-formatting-inherit');
    toggle.checked = true;
    toggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        formatting: { custom_formatting_key: 'keep' },
        other_key: 'keep',
      },
    ]);
  });

  it('card-level target fallback only writes target.at.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#target-value'), '2500');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { fixed: 2500 },
    });
  });

  it('card-level target entity only writes target.at.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0], 'sensor.dynamic_target');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { entity: 'sensor.dynamic_target' },
    });
  });

  it('card-level target fallback plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#target-value'), '2500');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0], 'sensor.dynamic_target');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { fixed: 2500, entity: 'sensor.dynamic_target' },
    });
  });

  it('clearing target fallback preserves target entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        at: {
          fixed: 2500,
          entity: 'sensor.dynamic_target',
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-value'), '');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { entity: 'sensor.dynamic_target' },
    });
  });

  it('clearing target entity preserves target fallback', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        at: {
          fixed: 2500,
          entity: 'sensor.dynamic_target',
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { fixed: 2500 },
    });
  });

  it('clearing both card-level target values removes target.at', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        at: {
          fixed: 2500,
          entity: 'sensor.dynamic_target',
        },
        color: '#ff9800',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-value'), '');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.target).toEqual({
      color: '#ff9800',
    });
  });

  it('default target color #888 is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        at: { fixed: 2500 },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-color'), '#888');

    expect(events).toHaveLength(0);
    expect(editor._draftConfig.target).toEqual({
      at: { fixed: 2500 },
    });
  });

  it('custom target color writes target.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const colorInput = editor.shadowRoot.querySelector('#target-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ff9800');

    expect(events.at(-1).detail.config.target).toEqual({
      color: '#ff9800',
    });
  });

  it('show target label false is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        label: { show: true },
      },
    });

    const toggle = editor.shadowRoot.querySelector('#target-label-show');
    toggle.checked = false;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.target).toBeUndefined();
  });

  it('show target label true writes target.label.show', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });

    const toggle = editor.shadowRoot.querySelector('#target-label-show');
    toggle.checked = true;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.target).toEqual({
      label: { show: true },
    });
  });

  it('above-target fill color writes target.when_exceeded.fill_color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const colorInput = editor.shadowRoot.querySelector('#target-above-fill-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ff0000');

    expect(events.at(-1).detail.config.target).toEqual({
      when_exceeded: {
        fill_color: '#ff0000',
      },
    });
  });

  it('clearing above-target fill color removes target.when_exceeded.fill_color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        when_exceeded: {
          fill_color: '#ff0000',
        },
        color: '#ff9800',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-above-fill-color'), '');

    expect(events.at(-1).detail.config.target).toEqual({
      color: '#ff9800',
    });
  });

  it('per-entity target inherit removes entire entity-level target', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          target: {
            at: { fixed: 2500 },
            color: '#ff9800',
          },
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One' },
    ]);
  });

  it('per-entity target fallback only writes entities[index].target.at.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '2500');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { fixed: 2500 } } },
    ]);
  });

  it('per-entity target entity only writes entities[index].target.at.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-entity-source"]')[0], 'sensor.grid_target');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { entity: 'sensor.grid_target' } } },
    ]);
  });

  it('per-entity target fallback plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '2500');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-entity-source"]')[0], 'sensor.grid_target');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { fixed: 2500, entity: 'sensor.grid_target' } } },
    ]);
  });

  it('clearing per-entity target fallback preserves entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        target: {
          at: { fixed: 2500, entity: 'sensor.grid_target' },
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { entity: 'sensor.grid_target' } } },
    ]);
  });

  it('clearing per-entity target entity preserves fallback', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        target: {
          at: { fixed: 2500, entity: 'sensor.grid_target' },
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { fixed: 2500 } } },
    ]);
  });

  it('clearing both per-entity target values removes entities[index].target.at', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        target: {
          at: { fixed: 2500, entity: 'sensor.grid_target' },
          color: '#ff9800',
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { color: '#ff9800' } },
    ]);
  });

  it('empty/default per-entity target override removes empty entity-level target', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        target: {
          color: '#ff9800',
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-color"]')[0], '#888');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One' },
    ]);
  });

  it('custom per-entity target color writes entities[index].target.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-color"]')[0], '#ff9800');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { color: '#ff9800' } },
    ]);
  });

  it('per-entity target show label true writes entities[index].target.label.show', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const toggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-label-show"]')[0];
    toggle.checked = true;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { label: { show: true } } },
    ]);
  });

  it('per-entity target above-target fill color writes entities[index].target.when_exceeded.fill_color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-above-fill-color"]')[0], '#ff0000');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { when_exceeded: { fill_color: '#ff0000' } } },
    ]);
  });

  it('per-entity target preserves unrelated entity keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '2500');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', custom_entity_key: 'keep', target: { at: { fixed: 2500 } } },
    ]);
  });

  it('loading flat target config renders correctly', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      target: 2500,
      target_entity: 'sensor.dynamic_target',
      target_color: '#ff9800',
      show_target_label: true,
      above_target_color: '#ff0000',
    });

    expect(editor.shadowRoot.querySelector('#target-value').value).toBe('2500');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0].value).toBe('sensor.dynamic_target');
    expect(editor.shadowRoot.querySelector('#target-color').value).toBe('#ff9800');
    expect(editor.shadowRoot.querySelector('#target-label-show').checked).toBe(true);
    expect(editor.shadowRoot.querySelector('#target-above-fill-color').value).toBe('#ff0000');
  });

  it('editing a flat-loaded target fallback converts only that edited field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: 2500,
      target_entity: 'sensor.dynamic_target',
      target_color: '#ff9800',
      custom_top_level: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-value'), '3000');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.target).toEqual({
      at: { fixed: 3000, entity: 'sensor.dynamic_target' },
    });
    expect(finalConfig.target_entity).toBeUndefined();
    expect(finalConfig.target_color).toBe('#ff9800');
    expect(finalConfig.custom_top_level).toBe('keep');
  });

  it('editing a flat-loaded target entity converts only that edited field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: 2500,
      target_entity: 'sensor.dynamic_target',
      above_target_color: '#ff0000',
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="target-entity-source"]')[0], 'sensor.updated_target');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.target).toEqual({
      at: { fixed: 2500, entity: 'sensor.updated_target' },
    });
    expect(finalConfig.target_entity).toBeUndefined();
    expect(finalConfig.above_target_color).toBe('#ff0000');
  });

  it('per-entity flat target config converts correctly when edited', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.grid_power',
        target: 2500,
        target_entity: 'sensor.grid_target',
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-target-value"]')[0], '3000');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.grid_power',
        target: {
          at: {
            fixed: 3000,
            entity: 'sensor.grid_target',
          },
        },
      },
    ]);
  });

  it('fake ha-entity-picker value-changed works for card-level target entity', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({ entity: 'sensor.one' });

    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="target-entity-source"]')[0];
    expect(picker.hass).toEqual({ states: {} });
    dispatchValueChanged(picker, 'sensor.dynamic_target');

    expect(events.at(-1).detail.config.target).toEqual({
      at: { entity: 'sensor.dynamic_target' },
    });
  });

  it('fake ha-entity-picker value-changed works for per-entity target entity', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="entity-target-entity-source"]')[0];
    expect(picker.hass).toEqual({ states: {} });
    dispatchValueChanged(picker, 'sensor.grid_target');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', target: { at: { entity: 'sensor.grid_target' } } },
    ]);
  });

  it('card-level baseline fallback only writes baseline.at.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '0');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { fixed: 0 },
    });
  });

  it('card-level baseline entity only writes baseline.at.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="baseline-entity-source"]')[0], 'sensor.dynamic_baseline');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { entity: 'sensor.dynamic_baseline' },
    });
  });

  it('card-level baseline fallback plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '0');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="baseline-entity-source"]')[0], 'sensor.dynamic_baseline');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { fixed: 0, entity: 'sensor.dynamic_baseline' },
    });
  });

  it('clearing baseline fallback preserves entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        at: { fixed: 0, entity: 'sensor.dynamic_baseline' },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { entity: 'sensor.dynamic_baseline' },
    });
  });

  it('clearing baseline entity preserves fallback', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        at: { fixed: 0, entity: 'sensor.dynamic_baseline' },
      },
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="baseline-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { fixed: 0 },
    });
  });

  it('clearing both removes baseline.at', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        at: { fixed: 0, entity: 'sensor.dynamic_baseline' },
        above: { color: '#00ff00' },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="baseline-entity-source"]')[0], '');

    expect(events.at(-1).detail.config.baseline).toEqual({
      above: { color: '#00ff00' },
    });
  });

  it('above-baseline color writes baseline.above.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const colorInput = editor.shadowRoot.querySelector('#baseline-above-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#00ff00');

    expect(events.at(-1).detail.config.baseline).toEqual({
      above: { color: '#00ff00' },
    });
  });

  it('below-baseline color writes baseline.below.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const colorInput = editor.shadowRoot.querySelector('#baseline-below-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ff0000');

    expect(events.at(-1).detail.config.baseline).toEqual({
      below: { color: '#ff0000' },
    });
  });

  it('clearing above-baseline color removes baseline.above', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        above: { color: '#00ff00' },
        below: { color: '#ff0000' },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-above-color'), '');

    expect(events.at(-1).detail.config.baseline).toEqual({
      below: { color: '#ff0000' },
    });
  });

  it('clearing below-baseline color removes baseline.below', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        above: { color: '#00ff00' },
        below: { color: '#ff0000' },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-below-color'), '');

    expect(events.at(-1).detail.config.baseline).toEqual({
      above: { color: '#00ff00' },
    });
  });

  it('empty/default baseline removes entire baseline', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        at: { fixed: 0 },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '');

    expect(events.at(-1).detail.config.baseline).toBeUndefined();
  });

  it('per-entity baseline inherit removes entire entity-level baseline', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        baseline: {
          at: { fixed: 0 },
          above: { color: '#00ff00' },
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One' },
    ]);
  });

  it('per-entity baseline fallback only writes entities[index].baseline.at.fixed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-value"]')[0], '500');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { at: { fixed: 500 } } },
    ]);
  });

  it('per-entity baseline entity only writes entities[index].baseline.at.entity', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-entity-source"]')[0], 'sensor.grid_baseline');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { at: { entity: 'sensor.grid_baseline' } } },
    ]);
  });

  it('per-entity baseline fallback plus entity writes both', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-value"]')[0], '500');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-entity-source"]')[0], 'sensor.grid_baseline');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { at: { fixed: 500, entity: 'sensor.grid_baseline' } } },
    ]);
  });

  it('per-entity baseline above color writes entities[index].baseline.above.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-above-color"]')[0], '#4caf50');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { above: { color: '#4caf50' } } },
    ]);
  });

  it('per-entity baseline below color writes entities[index].baseline.below.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-below-color"]')[0], '#f44336');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { below: { color: '#f44336' } } },
    ]);
  });

  it('empty/default per-entity baseline override removes empty entity-level baseline', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        baseline: {
          above: { color: '#00ff00' },
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-above-color"]')[0], '');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One' },
    ]);
  });

  it('per-entity baseline preserves unrelated entity keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-value"]')[0], '500');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', custom_entity_key: 'keep', baseline: { at: { fixed: 500 } } },
    ]);
  });

  it('enabling baseline removes needle in same scope', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: { needle: true, fill_style: 'soft_bands' },
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '0');

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'soft_bands',
    });
    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { fixed: 0 },
    });
  });

  it('enabling needle removes baseline in same scope', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: { at: { fixed: 0 } },
      bar: { fill_style: 'soft_bands' },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-needle-mode'), 'enabled');

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'soft_bands',
      needle: {
        show: true,
      },
    });
    expect(events.at(-1).detail.config.baseline).toBeUndefined();
  });

  it('card-level baseline does not remove unrelated entity-level needle overrides', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        bar: { needle: true },
      }],
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '0');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', bar: { needle: true } },
    ]);
    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { fixed: 0 },
    });
  });

  it('entity-level baseline only affects that entity scope', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        { entity: 'sensor.one', name: 'One', bar: { needle: true } },
        { entity: 'sensor.two', name: 'Two', bar: { needle: true } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-baseline-value"]')[0], '500');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { at: { fixed: 500 } } },
      { entity: 'sensor.two', name: 'Two', bar: { needle: true } },
    ]);
  });

  it('loading flat baseline renders correctly', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      baseline: 0,
    });

    expect(editor.shadowRoot.querySelector('#baseline-value').value).toBe('0');
  });

  it('editing flat-loaded baseline converts to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: 0,
      custom_top_level: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelector('#baseline-value'), '10');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.baseline).toEqual({
      at: { fixed: 10 },
    });
    expect(finalConfig.custom_top_level).toBe('keep');
  });

  it('fake ha-entity-picker value-changed works for card-level baseline entity', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({ entity: 'sensor.one' });

    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="baseline-entity-source"]')[0];
    expect(picker.hass).toEqual({ states: {} });
    dispatchValueChanged(picker, 'sensor.dynamic_baseline');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: { entity: 'sensor.dynamic_baseline' },
    });
  });

  it('fake ha-entity-picker value-changed works for per-entity baseline entity', () => {
    const editor = createEditor({ withEntityPicker: true });
    const events = trackConfigEvents(editor);

    editor.hass = { states: {} };
    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="entity-baseline-entity-source"]')[0];
    expect(picker.hass).toEqual({ states: {} });
    dispatchValueChanged(picker, 'sensor.grid_baseline');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', baseline: { at: { entity: 'sensor.grid_baseline' } } },
    ]);
  });

  it('card-level fill style writes bar.fill_style', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    dispatchChange(editor.shadowRoot.querySelector('#bar-fill-style'), 'soft_bands');

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'soft_bands',
    });
  });

  it('card-level color writes bar.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const colorInput = editor.shadowRoot.querySelector('#bar-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ff9800');

    expect(events.at(-1).detail.config.bar).toEqual({
      color: '#ff9800',
    });
  });

  it('card-level solid fill true writes bar.solid_fill true', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entity: 'sensor.one' });
    const toggle = editor.shadowRoot.querySelector('#bar-solid-fill');
    toggle.checked = true;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.bar).toEqual({
      solid_fill: true,
    });
  });

  it('card-level solid fill false removes bar.solid_fill', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        solid_fill: true,
        fill_style: 'soft_bands',
      },
    });

    const toggle = editor.shadowRoot.querySelector('#bar-solid-fill');
    toggle.checked = false;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'soft_bands',
    });
  });

  it('default card-level color is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#bar-color'), '#4a9eff');

    expect(events).toHaveLength(0);
    expect(editor._draftConfig.bar).toEqual({
      fill_style: 'soft_bands',
    });
  });

  it('default card-level fill style is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
      },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-fill-style'), 'bands');

    expect(events.at(-1).detail.config.bar).toBeUndefined();
  });

  it('editing legacy color_mode converts to bar.fill_style', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      color_mode: 'severity',
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-fill-style'), 'gradient');

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'gradient',
    });
    expect(events.at(-1).detail.config.color_mode).toBeUndefined();
  });

  it('editing legacy color converts to bar.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      color: '#ff9800',
    });

    dispatchInput(editor.shadowRoot.querySelector('#bar-color'), '#00ff00');

    expect(events.at(-1).detail.config.bar).toEqual({
      color: '#00ff00',
    });
    expect(events.at(-1).detail.config.color).toBeUndefined();
  });

  it('per-entity fill style writes entities[index].bar.fill_style', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchChange(editor.shadowRoot.querySelectorAll('select[data-kind="entity-bar-fill-style"]')[0], 'gradient');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { fill_style: 'gradient' } },
    ]);
  });

  it('per-entity color writes entities[index].bar.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-color"]')[0], '#ff9800');

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { color: '#ff9800' } },
    ]);
  });

  it('per-entity solid fill true writes entities[index].bar.solid_fill true', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const toggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-solid-fill"]')[0];
    toggle.checked = true;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { solid_fill: true } },
    ]);
  });

  it('per-entity solid fill false removes entities[index].bar.solid_fill', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{ entity: 'sensor.one', name: 'One', bar: { solid_fill: true, fill_style: 'gradient' } }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const toggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-solid-fill"]')[0];
    toggle.checked = false;
    toggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { fill_style: 'gradient' } },
    ]);
  });

  it('Bar Appearance inherit removes only managed keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        bar: {
          fill_style: 'gradient',
          color: '#ff9800',
          solid_fill: true,
          needle: true,
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { needle: true } },
    ]);
  });

  it('Bar Appearance inherit preserves unrelated entity bar.segments', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        bar: {
          fill_style: 'gradient',
          segments: [{ from: 0, to: 10, color: '#ff9800' }],
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { segments: [{ from: 0, to: 10, color: '#ff9800' }] } },
    ]);
  });

  it('Bar Appearance inherit preserves unknown entity-level bar keys and sibling entity config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        icon: 'mdi:flash',
        bar: {
          color: '#ff9800',
          custom_bar_key: 'keep',
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    const inheritToggle = editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-inherit"]')[0];
    inheritToggle.checked = true;
    inheritToggle.dispatchEvent({ type: 'change', bubbles: true, composed: true });

    expect(events.at(-1).detail.config.entities).toEqual([
      { entity: 'sensor.one', name: 'One', icon: 'mdi:flash', bar: { custom_bar_key: 'keep' } },
    ]);
  });

  it('loading flat color_mode renders the matching fill style', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      color_mode: 'gradient',
    });

    expect(editor.shadowRoot.querySelector('#bar-fill-style').value).toBe('gradient');
  });

  it('loading flat color renders the color field', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      color: '#ff9800',
    });

    expect(editor.shadowRoot.querySelector('#bar-color').value).toBe('#ff9800');
  });

  it('edited Bar Appearance config does not emit deprecated color_mode or flat color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      color_mode: 'severity',
      color: '#ff9800',
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-fill-style'), 'soft_bands');
    dispatchInput(editor.shadowRoot.querySelector('#bar-color'), '#00ff00');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      fill_style: 'soft_bands',
      color: '#00ff00',
    });
    expect(finalConfig.color_mode).toBeUndefined();
    expect(finalConfig.color).toBeUndefined();
  });

  it('Add segment creates a new row with smart defaults', async () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        segments: [
          { from: '0%', to: '20%', color: '#c4bc00' },
        ],
      },
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="add-segment"]')[0]);
    await flushTimers();

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar.segments).toEqual([
      { from: '0%', to: '20%', color: '#c4bc00' },
      { from: '20%', to: '100%', color: '#4a9eff' },
    ]);
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="segment-from"]')[1].value).toBe('20%');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="segment-to"]')[1].value).toBe('100%');
  });

  it('segment rows accept percent input and emit structured bar.segments', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        segments: [
          { from: 0, to: 100, color: '#4a9eff' },
        ],
      },
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="segment-from"]')[0], '0%');
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="segment-to"]')[0], '20%');
    const segmentColor = editor.shadowRoot.querySelectorAll('input[data-kind="segment-color"]')[0];
    expect(segmentColor.type).toBe('color');
    dispatchInput(segmentColor, '#c4bc00');

    expect(events.at(-1).detail.config.bar).toEqual({
      segments: [
        { from: '0%', to: '20%', color: '#c4bc00' },
      ],
    });
    expect(events.at(-1).detail.config.segments).toBeUndefined();
    expect(events.at(-1).detail.config.severity).toBeUndefined();
  });

  it('Remove segment removes the selected row', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        segments: [
          { from: '0%', to: '20%', color: '#c4bc00' },
          { from: '20%', to: '100%', color: '#4a9eff' },
        ],
      },
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="remove-segment"]')[0]);

    expect(events.at(-1).detail.config.bar).toEqual({
      segments: [
        { from: '20%', to: '100%', color: '#4a9eff' },
      ],
    });
  });

  it('editing flat-loaded segments converts them to structured bar.segments', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      segments: [
        { from: 0, to: 20, color: '#c4bc00' },
      ],
      custom_top_level: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="segment-to"]')[0], '25%');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      segments: [
        { from: 0, to: '25%', color: '#c4bc00' },
      ],
    });
    expect(finalConfig.segments).toBeUndefined();
    expect(finalConfig.severity).toBeUndefined();
    expect(finalConfig.custom_top_level).toBe('keep');
  });

  it('disabling card-level needle removes bar.needle and preserves unrelated bar keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
        needle: {
          show: true,
        },
      },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-needle-mode'), 'disabled');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      fill_style: 'soft_bands',
    });
    expect(finalConfig.bar.needle).toBeUndefined();
  });

  it('enabling needle emits canonical structured needle config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
      },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-needle-mode'), 'enabled');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      fill_style: 'soft_bands',
      needle: {
        show: true,
      },
    });
  });

  it('custom needle color writes bar.needle.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        needle: {
          show: true,
        },
      },
    });

    const colorInput = editor.shadowRoot.querySelector('#bar-needle-color');
    expect(colorInput.type).toBe('color');
    dispatchInput(colorInput, '#ff9800');

    expect(events.at(-1).detail.config.bar).toEqual({
      needle: {
        show: true,
        color: '#ff9800',
      },
    });
  });

  it('default needle color #ffffff is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        needle: {
          show: true,
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#bar-needle-color'), '#ffffff');

    expect(events).toHaveLength(0);
    expect(editor._draftConfig.bar).toEqual({
      needle: {
        show: true,
      },
    });
  });

  it('shorthand target default color displays safely as #888888', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        color: '#888',
      },
    });

    expect(editor.shadowRoot.querySelector('#target-color').value).toBe('#888888');
  });

  it('default-equivalent target colors are still suppressed after color picker conversion', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      target: {
        at: {
          fixed: 2500,
        },
        color: '#ff9800',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#target-color'), '#888888');

    expect(events.at(-1).detail.config.target).toEqual({
      at: {
        fixed: 2500,
      },
    });
  });

  it('non-hex colors are preserved on open and exposed through fallback text inputs', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        color: 'red',
      },
      target: {
        color: 'var(--accent-color)',
      },
    });

    expect(editor._draftConfig.bar.color).toBe('red');
    expect(editor._draftConfig.target.color).toBe('var(--accent-color)');
    expect(editor.shadowRoot.querySelector('[data-field="bar-color-text-fallback"]').value).toBe('red');
    expect(editor.shadowRoot.querySelector('[data-field="target-color-text-fallback"]').value).toBe('var(--accent-color)');
  });

  it('changing a non-hex color through the picker writes the selected hex color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        color: 'red',
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#bar-color'), '#00ff00');

    expect(events.at(-1).detail.config.bar).toEqual({
      color: '#00ff00',
    });
  });

  it('enabling needle removes card-level baseline', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      baseline: {
        at: {
          fixed: 0,
        },
      },
      bar: {
        fill_style: 'soft_bands',
      },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-needle-mode'), 'enabled');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      fill_style: 'soft_bands',
      needle: {
        show: true,
      },
    });
    expect(finalConfig.baseline).toBeUndefined();
  });

  it('enabling needle preserves unrelated card-level bar keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
        color: '#ff9800',
        solid_fill: true,
        segments: [{ from: 0, to: 10, color: '#00ff00' }],
        custom_bar_key: 'keep',
      },
    });

    dispatchChange(editor.shadowRoot.querySelector('#bar-needle-mode'), 'enabled');

    expect(events.at(-1).detail.config.bar).toEqual({
      fill_style: 'soft_bands',
      color: '#ff9800',
      solid_fill: true,
      segments: [{ from: 0, to: 10, color: '#00ff00' }],
      custom_bar_key: 'keep',
      needle: {
        show: true,
      },
    });
  });

  it('per-entity needle inherit removes only entities[index].bar.needle', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: true,
            color: '#ff9800',
          },
          fill_style: 'gradient',
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchChange(editor.shadowRoot.querySelectorAll('select[data-kind="entity-needle-mode"]')[0], 'inherit');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          fill_style: 'gradient',
        },
      },
    ]);
  });

  it('per-entity needle enabled writes entities[index].bar.needle.show true', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One' }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchChange(editor.shadowRoot.querySelectorAll('select[data-kind="entity-needle-mode"]')[0], 'enabled');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: true,
          },
        },
      },
    ]);
  });

  it('per-entity needle disabled writes entities[index].bar.needle.show false', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      bar: {
        needle: {
          show: true,
        },
      },
      entities: [{ entity: 'sensor.one', name: 'One' }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchChange(editor.shadowRoot.querySelectorAll('select[data-kind="entity-needle-mode"]')[0], 'disabled');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: false,
          },
        },
      },
    ]);
  });

  it('per-entity custom needle color writes entities[index].bar.needle.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One', bar: { needle: { show: true } } }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-needle-color"]')[0], '#ff9800');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: true,
            color: '#ff9800',
          },
        },
      },
    ]);
  });

  it('per-entity default needle color is suppressed', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({ entities: [{ entity: 'sensor.one', name: 'One', bar: { needle: { show: true } } }] });
    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-needle-color"]')[0], '#ffffff');

    expect(events).toHaveLength(0);
  });

  it('enabling per-entity needle removes only that entity baseline', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      baseline: {
        at: {
          fixed: 0,
        },
      },
      entities: [
        { entity: 'sensor.one', name: 'One', baseline: { at: { fixed: 5 } } },
        { entity: 'sensor.two', name: 'Two', baseline: { at: { fixed: 10 } } },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchChange(editor.shadowRoot.querySelectorAll('select[data-kind="entity-needle-mode"]')[0], 'enabled');

    expect(events.at(-1).detail.config.baseline).toEqual({
      at: {
        fixed: 0,
      },
    });
    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: true,
          },
        },
      },
      {
        entity: 'sensor.two',
        name: 'Two',
        baseline: {
          at: {
            fixed: 10,
          },
        },
      },
    ]);
  });

  it('loading legacy boolean card-level needle renders as enabled', () => {
    const editor = createEditor();
    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        needle: true,
      },
    });

    expect(editor.shadowRoot.querySelector('#bar-needle-mode').value).toBe('enabled');
  });

  it('loading legacy boolean per-entity needle false renders as disabled override', () => {
    const editor = createEditor();
    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: false,
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    expect(editor.shadowRoot.querySelectorAll('select[data-kind="entity-needle-mode"]')[0].value).toBe('disabled');
  });

  it('editing legacy boolean card-level needle emits object form', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        needle: true,
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#bar-needle-color'), '#ff9800');

    expect(events.at(-1).detail.config.bar).toEqual({
      needle: {
        show: true,
        color: '#ff9800',
      },
    });
  });

  it('editing legacy boolean per-entity needle emits object form', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [{
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: true,
        },
      }],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-needle-color"]')[0], '#ff9800');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        bar: {
          needle: {
            show: true,
            color: '#ff9800',
          },
        },
      },
    ]);
  });

  it('empty card-level height does not emit layout.height null', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      layout: {
        height: 64,
        label: {
          position: 'left',
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#layout-height'), '');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.layout).toEqual({
      label: {
        position: 'left',
      },
    });
    expect(finalConfig.layout.height).toBeUndefined();
  });

  it('card-level layout writes structured height position and width', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
    });

    dispatchInput(editor.shadowRoot.querySelector('#layout-height'), '38');
    dispatchChange(editor.shadowRoot.querySelector('#layout-label-position'), 'above');
    dispatchInput(editor.shadowRoot.querySelector('#layout-label-width'), '120');

    expect(events.at(-1).detail.config.layout).toEqual({
      height: 38,
      label: {
        position: 'above',
        width: 120,
      },
    });
    expect(events.at(-1).detail.config.height).toBeUndefined();
    expect(events.at(-1).detail.config.label_position).toBeUndefined();
    expect(events.at(-1).detail.config.label_width).toBeUndefined();
  });

  it('card-level layout reads legacy flat config', () => {
    const editor = createEditor();

    editor.setConfig({
      entity: 'sensor.one',
      height: 64,
      label_position: 'inside',
      label_width: 100,
    });

    expect(editor.shadowRoot.querySelector('#layout-height').value).toBe('64');
    expect(editor.shadowRoot.querySelector('#layout-label-position').value).toBe('inside');
    expect(editor.shadowRoot.querySelector('#layout-label-width').value).toBe('100');
  });

  it('editing flat-loaded layout field converts only that field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      height: 64,
      label_position: 'inside',
      label_width: 100,
      custom_top_level: 'keep',
    });

    dispatchInput(editor.shadowRoot.querySelector('#layout-height'), '38');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.layout).toEqual({
      height: 38,
    });
    expect(finalConfig.height).toBeUndefined();
    expect(finalConfig.label_position).toBe('inside');
    expect(finalConfig.label_width).toBe(100);
    expect(finalConfig.custom_top_level).toBe('keep');
  });

  it('empty card-level label width removes only layout.label.width and prunes empty parents', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      layout: {
        label: {
          width: 120,
        },
      },
    });

    dispatchInput(editor.shadowRoot.querySelector('#layout-label-width'), '');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.layout).toBeUndefined();
  });

  it('clearing per-entity height removes entities[index].layout.height without leaving null', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          layout: {
            height: 64,
          },
          custom_entity_key: 'keep',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-height"]')[0], '');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        custom_entity_key: 'keep',
      },
    ]);
    expect(finalConfig.entities[0].layout).toBeUndefined();
    expect(finalConfig.entities[0].height).toBeUndefined();
  });

  it('per-entity layout writes structured height position and width', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-height'), '42');
    dispatchChange(editor.shadowRoot.querySelector('#entity-0-label-position'), 'inside');
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-label-width'), '100');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        layout: {
          height: 42,
          label: {
            position: 'inside',
            width: 100,
          },
        },
      },
    ]);
  });

  it('per-entity layout inherit removes only managed keys and preserves unrelated layout keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'One',
          layout: {
            height: 42,
            label: {
              position: 'inside',
              width: 100,
              custom_label_key: 'keep',
            },
            custom_layout_key: 'keep',
          },
          custom_entity_key: 'keep',
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    const toggle = editor.shadowRoot.querySelector('#entity-0-layout-inherit');
    toggle.checked = true;
    toggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'One',
        layout: {
          label: {
            custom_label_key: 'keep',
          },
          custom_layout_key: 'keep',
        },
        custom_entity_key: 'keep',
      },
    ]);
  });

  it('per-entity layout reads legacy flat config', () => {
    const editor = createEditor();

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          height: 64,
          label_position: 'above',
          label_width: 90,
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));

    expect(editor.shadowRoot.querySelector('#entity-0-height').value).toBe('64');
    expect(editor.shadowRoot.querySelector('#entity-0-label-position').value).toBe('above');
    expect(editor.shadowRoot.querySelector('#entity-0-label-width').value).toBe('90');
  });

  it('editing flat-loaded per-entity layout field converts only that field to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.old',
          height: 64,
          label_position: 'above',
          label_width: 90,
        },
      ],
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    dispatchInput(editor.shadowRoot.querySelector('#entity-0-label-width'), '100');

    expect(events.at(-1).detail.config.entities).toEqual([
      {
        entity: 'sensor.old',
        height: 64,
        label_position: 'above',
        layout: {
          label: {
            width: 100,
          },
        },
      },
    ]);
    expect(events.at(-1).detail.config.entities[0].label_width).toBeUndefined();
  });

  it('peak toggle writes structured peak config and never show_peak', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      show_peak: true,
      peak_color: '#777777',
    });

    const peakToggle = editor.shadowRoot.querySelector('#peak-show');
    peakToggle.checked = false;
    peakToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.peak).toEqual({
      color: '#777777',
    });
    expect(finalConfig.show_peak).toBeUndefined();
    expect(finalConfig.peak_color).toBeUndefined();
  });

  it('peak enabled with default color omits peak.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      peak: {
        enabled: false,
        color: '#888',
      },
    });

    const peakToggle = editor.shadowRoot.querySelector('#peak-show');
    peakToggle.checked = true;
    peakToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.peak).toEqual({
      enabled: true,
    });
    expect(finalConfig.peak.color).toBeUndefined();
  });

  it('peak enabled with custom color keeps peak.color', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      peak: {
        enabled: false,
        color: '#ff9800',
      },
    });

    const peakToggle = editor.shadowRoot.querySelector('#peak-show');
    peakToggle.checked = true;
    peakToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.peak).toEqual({
      enabled: true,
      color: '#ff9800',
    });
  });

  it('peak disabled/default removes entire peak block if empty', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      peak: {
        enabled: true,
        color: '#888',
      },
    });

    const peakToggle = editor.shadowRoot.querySelector('#peak-show');
    peakToggle.checked = false;
    peakToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.peak).toBeUndefined();
  });

  it('unrelated peak keys survive color cleanup and pruning does not remove siblings', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      peak: {
        enabled: true,
        color: '#888',
        custom_peak_key: 'keep',
      },
    });

    const peakToggle = editor.shadowRoot.querySelector('#peak-show');
    peakToggle.checked = true;
    peakToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.peak).toEqual({
      enabled: true,
      custom_peak_key: 'keep',
    });
  });

  it('loading flat config still renders editable values and editing converts them to structured config', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.old',
          min: 0,
          max: 5000,
          height: 64,
          color: 'red',
        },
      ],
      show_peak: true,
    });

    dispatchClick(editor.shadowRoot.querySelectorAll('button[data-action="toggle-entity-overrides"]')[0]);
    dispatchClick(editor.shadowRoot.querySelector('#entity-0-group-layout'));
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[0].value).toBe('0');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max"]')[0].value).toBe('5000');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-height"]')[0].value).toBe('64');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-color"]')[0].value).toBe('#4a9eff');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-bar-color-text-fallback"]')[0].value).toBe('red');

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max"]')[0], '6000');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.old',
        min: 0,
        height: 64,
        color: 'red',
        scale: {
          max: {
            fixed: 6000,
          },
        },
      },
    ]);
    expect(finalConfig.entities[0].max).toBeUndefined();
  });

  it('unknown top-level and per-entity keys remain preserved', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entities: [
        {
          entity: 'sensor.one',
          name: 'Kitchen',
          custom_entity_key: 'keep',
        },
      ],
      custom_top_level: 'stay',
      card_mod: {
        style: 'ha-card { background: red; }',
      },
    });

    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-name"]')[0], 'Updated Kitchen');
    dispatchChange(editor.shadowRoot.querySelector('#layout-label-position'), 'inside');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.custom_top_level).toBe('stay');
    expect(finalConfig.entities).toEqual([
      {
        entity: 'sensor.one',
        name: 'Updated Kitchen',
        custom_entity_key: 'keep',
      },
    ]);
    expect(finalConfig.card_mod).toEqual({
      style: 'ha-card { background: red; }',
    });
  });
});
