import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';

function setup(source, config, withEntityPicker = false) {
  const editor = createEditor({ source, withEntityPicker });
  const events = [];
  editor.dispatchEvent = (event) => { events.push(event); return true; };
  editor.setConfig(config);
  return { editor, events };
}

function dispatch(element, type, value, extra = {}) {
  if (value !== undefined) element.value = value;
  element.dispatchEvent({ type, bubbles: true, composed: true, preventDefault() {}, ...extra });
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// Exercise both shipped and source editors through the existing private/DOM
// entry points. These characterize the standalone policy, not a future host.
for (const source of ['src', 'dist']) {
  describe(`editor infrastructure (${source})`, () => {
    it('loads without emitting or mutating input, and accepts reordered equivalent config without rerendering', () => {
      const config = { entity: 'sensor.power', title: 'Power', scale: { min: 0, max: 100 } };
      const { editor, events } = setup(source, config);
      const title = editor.shadowRoot.querySelector('#title');
      editor.setConfig({ scale: { max: 100, min: 0 }, title: 'Power', entity: 'sensor.power' });
      expect(editor.shadowRoot.querySelector('#title')).toBe(title);
      expect(events).toHaveLength(0);
      dispatch(title, 'input', 'Edited');
      expect(config.title).toBe('Power');
      expect(events[0]).toMatchObject({ type: 'config-changed', bubbles: true, composed: true });
      expect(events[0].detail).toEqual({ config: { entity: 'sensor.power', title: 'Edited', scale: { min: { fixed: 0 }, max: { fixed: 100 } } } });
    });

    it('retains pending array drafts and disclosure state through config echoes and structural renders', async () => {
      const config = { entity: 'sensor.power', bar: { fill_style: 'gradient' } };
      const { editor, events } = setup(source, config);
      dispatch(editor.shadowRoot.querySelector('#card-group-gradient-stops'), 'click');
      dispatch(editor.shadowRoot.querySelector('#gradient-draft-pos'), 'input', '45');
      dispatch(editor.shadowRoot.querySelector('#segment-draft-from'), 'input', '101');
      dispatch(editor.shadowRoot.querySelector('#segment-draft-to'), 'input', '120');
      expect(events).toHaveLength(0);
      const title = editor.shadowRoot.querySelector('#title');
      dispatch(title, 'input', 'Edited');
      editor.setConfig(config);
      editor.setConfig(events.at(-1).detail.config);
      expect(editor.shadowRoot.querySelector('#title')).toBe(title);
      expect(editor.shadowRoot.querySelector('#gradient-draft-pos').value).toBe('45');
      dispatch(editor.shadowRoot.querySelector('#card-group-marker-target'), 'click');
      await flush();
      expect(editor.shadowRoot.querySelector('#gradient-draft-pos').value).toBe('45');
      expect(editor.shadowRoot.querySelector('#segment-draft-from').value).toBe('101');
      expect(editor.shadowRoot.querySelector('#segment-draft-to').value).toBe('120');
      expect(editor.shadowRoot.querySelector('#card-group-gradient-stops').getAttribute('aria-expanded')).toBe('true');
      expect(events).toHaveLength(1);
    });

    it('sets nested paths immutably, prunes deleted objects, and leaves missing paths unchanged', () => {
      const { editor } = setup(source, { entity: 'sensor.power' });
      const original = { entities: [{ entity: 'sensor.power', label: { text: 'Old' } }], extra: { keep: true } };
      const changed = editor._setPathValue(original, ['entities', 0, 'label', 'text'], 'New');
      expect(changed.entities[0].label.text).toBe('New');
      expect(original.entities[0].label.text).toBe('Old');
      expect(changed.extra).toBe(original.extra);
      const removed = editor._deletePathValue({ label: { text: 'Only' }, extra: original.extra }, ['label', 'text']);
      expect(removed).toEqual({ extra: { keep: true } });
      expect(editor._deletePathValue(original, ['absent', 'text'])).toBe(original);
      expect(editor._hasPath(changed, ['entities', 0, 'label', 'text'])).toBe(true);
      expect(editor._getPathValue(changed, ['entities', 0, 'label', 'text'])).toBe('New');
    });

    it('routes root and entity scoped edits through standalone emission without altering sibling configuration', () => {
      const config = { entity: 'sensor.power', name: 'Power', extra: { keep: [1, 2] } };
      const { editor, events } = setup(source, config);
      editor._applyScopedMutation({ type: 'card' }, target => editor._setPathValue(target, ['formatting', 'unit'], 'W'));
      editor._applyScopedMutation({ type: 'entity', index: 0 }, target => editor._setPathValue(target, ['formatting', 'decimal'], 2));
      expect(events.at(-1).detail.config).toEqual({
        entities: [{ entity: 'sensor.power', name: 'Power', formatting: { decimal: 2 } }],
        formatting: { unit: 'W' }, extra: { keep: [1, 2] },
      });
      expect(config).toEqual({ entity: 'sensor.power', name: 'Power', extra: { keep: [1, 2] } });
      expect(editor._getScopedPath({ type: 'entity', index: 0 }, ['formatting', 'decimal'])).toEqual(['entities', 0, 'formatting', 'decimal']);
    });

    it('preserves effective inherited source parts while changing only a local fixed/entity part', () => {
      const { editor, events } = setup(source, {
        scale: { min: { fixed: 10, entity: 'sensor.minimum' } },
        entities: [{ entity: 'sensor.power', scale: { min: { entity: 'sensor.local_minimum' } } }, { entity: 'sensor.other' }],
      });
      const scope = { type: 'entity', index: 0 };
      expect(editor._getEffectiveResolvableScopedValue({ type: 'entity', index: 1 }, 'min')).toEqual({ fixed: 10, entity: 'sensor.minimum' });
      expect(editor._getEffectiveResolvableScopedValue(scope, 'min')).toEqual({ fixed: '', entity: 'sensor.local_minimum' });
      editor._setCanonicalResolvablePart(scope, 'min', 'fixed', '20');
      expect(events.at(-1).detail.config.entities[0].scale.min).toEqual({ fixed: 20, entity: 'sensor.local_minimum' });
      editor._setCanonicalResolvablePart(scope, 'min', 'entity', '');
      expect(events.at(-1).detail.config.entities[0].scale.min).toEqual({ fixed: 20 });
      expect(events.at(-1).detail.config.scale.min).toEqual({ fixed: 10, entity: 'sensor.minimum' });
    });

    it('renders fallback inputs and synchronizes picker values/hass without emitting', () => {
      const config = { entity: 'sensor.power', scale: { min: { fixed: 0, entity: 'sensor.minimum' } } };
      const fallback = setup(source, config);
      expect(fallback.editor.shadowRoot.querySelectorAll('input[data-kind="entity-input"]')[0].value).toBe('sensor.power');
      expect(fallback.editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-entity-source"]')[0].value).toBe('sensor.minimum');
      const { editor, events } = setup(source, config, true);
      const hass = { states: {} };
      editor.hass = hass;
      const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="scale-min-entity-source"]')[0];
      expect(picker.value).toBe('sensor.minimum');
      expect(picker.hass).toBe(hass);
      expect(picker.allowCustomEntity).toBe(true);
      expect(picker.label).toBe('Min entity');
      expect(events).toHaveLength(0);
      dispatch(picker, 'value-changed', 'sensor.next_minimum', { detail: { value: 'sensor.next_minimum' } });
      expect(events.at(-1).detail.config.scale.min).toEqual({ fixed: 0, entity: 'sensor.next_minimum' });
    });

    it('keeps marker identities and expansion attached to a marker through reorder and config echo', async () => {
      const { editor, events } = setup(source, { entity: 'sensor.power', markers: [{ at: { fixed: 25 } }, { at: { fixed: 75 } }] });
      dispatch(editor.shadowRoot.querySelector('#card-group-generic-markers'), 'click');
      const toggles = editor.shadowRoot.querySelectorAll('button[data-action="toggle-generic-marker"]');
      const id = toggles[1].dataset.markerUiId;
      dispatch(toggles[1], 'click');
      dispatch(editor.shadowRoot.querySelectorAll('button[data-action="move-generic-marker-up"]')[1], 'click');
      editor.setConfig(events.at(-1).detail.config);
      await flush();
      const moved = editor.shadowRoot.querySelectorAll('button[data-action="toggle-generic-marker"]')[0];
      expect(moved.dataset.markerUiId).toBe(id);
      expect(moved.getAttribute('aria-expanded')).toBe('true');
      expect(events.at(-1).detail.config.markers.map(marker => marker.at.fixed)).toEqual([75, 25]);
    });
  });
}
