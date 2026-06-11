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
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-color"]')[0], 'orange');

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.entities).toEqual([
      { entity: 'sensor.one', name: 'One', bar: { color: 'orange' } },
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
    dispatchInput(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-color"]')[0], '');

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

  it('default needle OFF does not emit bar.needle and preserves unrelated bar keys', () => {
    const editor = createEditor();
    const events = trackConfigEvents(editor);

    editor.setConfig({
      entity: 'sensor.one',
      bar: {
        fill_style: 'soft_bands',
        needle: true,
      },
    });

    const needleToggle = editor.shadowRoot.querySelector('#bar-needle');
    needleToggle.checked = false;
    needleToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

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

    const needleToggle = editor.shadowRoot.querySelector('#bar-needle');
    needleToggle.checked = true;
    needleToggle.dispatchEvent({
      type: 'change',
      bubbles: true,
      composed: true,
    });

    const finalConfig = events.at(-1).detail.config;
    expect(finalConfig.bar).toEqual({
      fill_style: 'soft_bands',
      needle: true,
    });
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
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min"]')[0].value).toBe('0');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max"]')[0].value).toBe('5000');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-height"]')[0].value).toBe('64');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-color"]')[0].value).toBe('red');

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
