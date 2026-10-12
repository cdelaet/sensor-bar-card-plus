import { describe, it, expect } from 'vitest';
import { createEditor, loadCardClass } from '../support/load-card-class.cjs';
import { getEntityAttributeSuggestions, renderEntityAttributeInput } from '../../src/editor/shared/editor-controls.js';

function dispatch(editor, control, value, type = 'input') {
  control.value = value;
  control.dispatchEvent({ type, bubbles: true, composed: true, ...(type === 'value-changed' ? { detail: { value } } : {}) });
}

function track(editor) {
  const events = [];
  editor.dispatchEvent = event => { events.push(event.detail?.config); return true; };
  return events;
}

async function featureEditor(config, context = { entity_id: 'sensor.parent' }) {
  const classes = loadCardClass({ source: 'src' });
  const editor = new classes.featureEditor();
  const events = track(editor);
  editor.setConfig(config);
  editor.context = context;
  editor.hass = { states: {} };
  await editor.updateComplete;
  return { editor, events };
}

for (const source of ['src', 'dist']) describe(`Entity attributes (${source})`, () => {
  it('suggests only top-level scalar keys and keeps manual keys editable', () => {
    const hass = { states: { 'sensor.one': { attributes: { temperature: 21, status: 'ready', enabled: true, nested: { x: 1 }, values: [1, 2] } } } };
    expect(getEntityAttributeSuggestions(hass, 'sensor.one')).toEqual(['temperature', 'status', 'enabled']);
    expect(getEntityAttributeSuggestions(hass, 'sensor.missing')).toEqual([]);
    expect(renderEntityAttributeInput('entity-attribute', 0, 'custom_future', 'sensor.missing', hass)).toContain('value="custom_future"');
    expect(renderEntityAttributeInput('entity-attribute', 0, '', 'sensor.one', hass)).toContain('<option value="temperature"></option>');
    expect(renderEntityAttributeInput('entity-attribute', 0, '', 'sensor.one', hass)).not.toContain('value="nested"');
  });

  it('preserves independent primary row attributes through edits, entity changes, and clearing', () => {
    const editor = createEditor({ source });
    const events = track(editor);
    editor.setConfig({ entities: [
      { entity: 'sensor.one', attribute: 'custom_future', extra: 'keep' },
      { entity: 'sensor.two', attribute: 'status' },
    ] });
    const attrs = editor.shadowRoot.querySelectorAll('input[data-kind="entity-attribute"]');
    expect(attrs.map(input => input.value)).toEqual(['custom_future', 'status']);
    dispatch(editor, attrs[0], 'new_key');
    expect(events.at(-1).entities).toEqual([
      { entity: 'sensor.one', attribute: 'new_key', extra: 'keep' },
      { entity: 'sensor.two', attribute: 'status' },
    ]);
    dispatch(editor, editor.shadowRoot.querySelectorAll('input[data-kind="entity-name"]')[0], 'Kitchen');
    expect(events.at(-1).entities[0].attribute).toBe('new_key');
    const entityInput = editor.shadowRoot.querySelectorAll('input[data-kind="entity-input"]')[0];
    if (entityInput) dispatch(editor, entityInput, 'sensor.changed');
    expect(events.at(-1).entities[0].attribute).toBe('new_key');
    dispatch(editor, editor.shadowRoot.querySelectorAll('input[data-kind="entity-attribute"]')[0], '');
    expect(Object.hasOwn(events.at(-1).entities[0], 'attribute')).toBe(false);
    expect(events.at(-1).entities[1].attribute).toBe('status');
  });

  it('edits and clears nested Scale, Baseline, and Target attributes without losing siblings', () => {
    const editor = createEditor({ source });
    const events = track(editor);
    editor.setConfig({ scale: { min: { entity: 'sensor.min', attribute: 'lower', future: 1 }, max: { entity: 'sensor.max' } },
      baseline: { at: { entity: 'sensor.base', attribute: 'zero' }, above: { color: 'red' } },
      target: { at: { entity: 'sensor.target', attribute: 'limit' }, label: { text: 'Limit' } } });
    const set = (selector, value) => dispatch(editor, editor.shadowRoot.querySelectorAll(selector)[0], value);
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="scale-min-attribute"]')[0].value).toBe('lower');
    set('input[data-kind="scale-min-attribute"]', 'bottom');
    set('input[data-kind="scale-max-attribute"]', 'ceiling');
    set('input[data-kind="baseline-attribute"]', 'origin');
    set('input[data-kind="target-attribute"]', 'threshold');
    expect(events.at(-1).scale).toEqual({ min: { entity: 'sensor.min', attribute: 'bottom' }, max: { entity: 'sensor.max', attribute: 'ceiling' } });
    expect(events.at(-1).baseline).toEqual({ at: { entity: 'sensor.base', attribute: 'origin' }, above: { color: 'red' } });
    expect(events.at(-1).target).toEqual({ at: { entity: 'sensor.target', attribute: 'threshold' }, label: { text: 'Limit' } });
    set('input[data-kind="scale-min-attribute"]', '');
    expect(Object.hasOwn(events.at(-1).scale.min, 'attribute')).toBe(false);
  });

  it('handles non-bubbling entity picker value changes and ignores its empty change event', () => {
    const editor = createEditor({ source, withEntityPicker: true });
    const events = track(editor);
    editor.setConfig({ entity: 'sensor.primary' });
    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="scale-min-entity-source"]')[0];
    expect(picker).toBeTruthy();

    picker.value = 'sensor.p1_power';
    picker.dispatchEvent({ type: 'value-changed', detail: { value: 'sensor.p1_power' }, bubbles: false, composed: false });

    expect(events.at(-1).scale.min).toEqual({ entity: 'sensor.p1_power' });
    picker.value = '';
    picker.dispatchEvent({ type: 'change', bubbles: true, composed: true });
    expect(events.at(-1).scale.min).toEqual({ entity: 'sensor.p1_power' });

    picker.dispatchEvent({ type: 'value-changed', detail: { value: '' }, bubbles: false, composed: false });
    expect(editor._getScaleEntityValue('min')).toBe('');
    expect(events.at(-1).scale?.min).toBeUndefined();
  });

  it('edits per-row Scale attribute overrides independently from the primary row attribute', () => {
    const editor = createEditor({ source });
    const events = track(editor);
    editor.setConfig({ entities: [
      { entity: 'sensor.one', attribute: 'state_attr', scale: { min: { entity: 'sensor.row_min', attribute: 'row_lower' }, max: { entity: 'sensor.row_max', attribute: 'row_upper' } } },
      { entity: 'sensor.two', attribute: 'other_state_attr', scale: { max: { entity: 'sensor.row_max', attribute: 'row_upper' } } },
    ] });
    const min = editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-min-attribute"]')[0];
    const max = editor.shadowRoot.querySelectorAll('input[data-kind="entity-override-max-attribute"]')[0];
    expect(min.value).toBe('row_lower');
    expect(max.value).toBe('row_upper');
    dispatch(editor, min, 'lower_bound');
    expect(events.at(-1).entities[0].scale.min).toEqual({ entity: 'sensor.row_min', attribute: 'lower_bound' });
    expect(events.at(-1).entities[0].scale.max).toEqual({ entity: 'sensor.row_max', attribute: 'row_upper' });
    expect(events.at(-1).entities[0].attribute).toBe('state_attr');
  });

  it.each([
    ['entity-override-min-entity-source', 'entity-override-min-attribute', 'scale', 'min'],
    ['entity-override-max-entity-source', 'entity-override-max-attribute', 'scale', 'max'],
    ['entity-baseline-entity-source', 'entity-baseline-attribute', 'baseline', 'at'],
    ['entity-target-entity-source', 'entity-target-attribute', 'target', 'at'],
  ])('retains textual-state entities through picker events and config echoes for %s', (kind, attributeKind, section, part) => {
    const editor = createEditor({ source, withEntityPicker: true });
    const events = track(editor);
    editor.setConfig({ entities: [{ entity: 'sensor.row' }] });
    editor.hass = { states: { 'weather.forecast_home': { state: 'partlycloudy', attributes: { temperature: 21 } } } };
    const target = { tagName: 'HA-ENTITY-PICKER', dataset: { kind, index: '0' }, value: 'weather.forecast_home' };
    editor._handleValueChanged({ type: 'value-changed', target, detail: { value: 'weather.forecast_home' } });
    const getStoredSource = config => section === 'scale' ? config.entities[0].scale?.[part]
      : section === 'baseline' ? config.entities[0].baseline?.at : config.entities[0].target?.at;
    expect(getStoredSource(editor._draftConfig)).toEqual({ entity: 'weather.forecast_home' });
    expect(getStoredSource(events.at(-1))).toEqual({ entity: 'weather.forecast_home' });
    editor._handleFieldEvent({ type: 'change', target });
    editor.setConfig(events.at(-1));
    editor._render();
    expect(getStoredSource(editor._draftConfig)).toEqual({ entity: 'weather.forecast_home' });
    expect(editor.shadowRoot.querySelectorAll(`input[data-kind="${attributeKind}"]`)).toHaveLength(1);
    const attribute = editor.shadowRoot.querySelectorAll(`input[data-kind="${attributeKind}"]`)[0];
    dispatch(editor, attribute, 'temperature');
    expect(getStoredSource(events.at(-1))).toEqual({ entity: 'weather.forecast_home', attribute: 'temperature' });
  });

  it('edits marker position and general label attributes while preserving independent label data', () => {
    const editor = createEditor({ source });
    const events = track(editor);
    editor.setConfig({ markers: [{ at: { entity: 'sensor.position', attribute: 'unknown_position' },
      label: { text: 'Static label', entity: 'sensor.label', attribute: 'description', unit: 'W' }, metadata: true }] });
    const get = selector => editor.shadowRoot.querySelectorAll(selector)[0];
    expect(get('input[data-kind="generic-marker-label-attribute"]').value).toBe('description');
    dispatch(editor, get('input[data-kind="generic-marker-attribute"]'), 'threshold');
    dispatch(editor, get('input[data-kind="generic-marker-label-attribute"]'), 'status');
    expect(events.at(-1).markers[0]).toEqual({ at: { entity: 'sensor.position', attribute: 'threshold' },
      label: { text: 'Static label', entity: 'sensor.label', attribute: 'status', unit: 'W' }, metadata: true });
    dispatch(editor, get('input[data-kind="generic-marker-label-attribute"]'), '');
    expect(Object.hasOwn(events.at(-1).markers[0].label, 'attribute')).toBe(false);
    expect(events.at(-1).markers[0].label.text).toBe('Static label');
    expect(events.at(-1).markers[0].label.entity).toBe('sensor.label');
  });

  it.each([
    ['card', { markers: [{ at: { fixed: 50 } }] }, { type: 'card' }, 'card'],
    ['entity override', { entities: [{ entity: 'sensor.row', markers: [{ at: { fixed: 50 } }] }] }, { type: 'entity', index: 0 }, '0'],
  ])('keeps a transient Reference Marker Entity mode through config echo and then persists its attribute (%s)', (scopeName, config, scope, scopeIndex) => {
    const editor = createEditor({ source, withEntityPicker: true });
    const events = track(editor);
    editor.setConfig(config);
    editor.hass = { states: { 'weather.forecast_home': { state: 'partlycloudy', attributes: { temperature: 21 } } } };
    const modeTarget = { dataset: { kind: 'generic-marker-source-mode', scopeType: scope.type, index: scopeIndex, markerIndex: '0' }, value: 'entity' };
    editor._handleFieldEvent({ type: 'change', target: modeTarget });
    const emitted = events.at(-1);
    expect(emitted.markers?.[0]?.at?.entity).toBeUndefined();
    if (scope.type === 'entity') expect(emitted.entities[0].markers[0].at?.entity).toBeUndefined();
    editor.setConfig(emitted);
    editor._render();
    const currentMarker = () => editor._getGenericMarkers(scope)[0];
    expect(editor._getGenericMarkerSource(currentMarker(), scope, 0).mode).toBe('entity');
    expect(editor._renderGenericMarkersEditor(scope)).toContain('<option value="entity" selected>Entity</option>');

    const picker = { tagName: 'HA-ENTITY-PICKER', dataset: { kind: 'generic-marker-entity', scopeType: scope.type, index: scopeIndex, markerIndex: '0' }, value: 'weather.forecast_home' };
    editor._handleValueChanged({ type: 'value-changed', target: picker, detail: { value: 'weather.forecast_home' } });
    editor.setConfig(events.at(-1));
    editor._render();
    expect(editor._getGenericMarkerSource(currentMarker(), scope, 0)).toMatchObject({ mode: 'entity', entity: 'weather.forecast_home' });
    const attribute = editor.shadowRoot.querySelectorAll('input[data-kind="generic-marker-attribute"]')[0];
    expect(attribute).toBeTruthy();
    dispatch(editor, attribute, 'temperature');
    const finalConfig = events.at(-1);
    const finalMarker = scope.type === 'entity' ? finalConfig.entities[0].markers[0] : finalConfig.markers[0];
    expect(finalMarker.at).toEqual({ entity: 'weather.forecast_home', attribute: 'temperature' });
  });

  it('moves the existing row Unit control beside Attribute without duplicating its binding', () => {
    const editor = createEditor({ source });
    const events = track(editor);
    editor.setConfig({ formatting: { unit: 'W' }, entities: [{ entity: 'sensor.one' }] });
    let unit = editor.shadowRoot.querySelectorAll('input[data-kind="entity-formatting-unit"]')[0];
    expect(unit.value).toBe('W');
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-formatting-unit"]')).toHaveLength(1);
    expect(editor._renderFormattingSection({ type: 'entity', index: 0 }, { includeUnit: false })).not.toContain('data-kind="entity-formatting-unit"');
    dispatch(editor, unit, 'kW');
    expect(events.at(-1).entities[0].formatting.unit).toBe('kW');
    editor.setConfig(events.at(-1));
    dispatch(editor, editor.shadowRoot.querySelectorAll('input[data-kind="entity-formatting-unit"]')[0], '');
    expect(events.at(-1).entities[0].formatting).toBeUndefined();
    editor._render();
    expect(editor.shadowRoot.querySelectorAll('input[data-kind="entity-formatting-unit"]')[0].value).toBe('W');
    dispatch(editor, editor.shadowRoot.querySelectorAll('input[data-kind="entity-attribute"]')[0], 'temperature');
    expect(events.at(-1).formatting.unit).toBe('W');
    expect(events.at(-1).entities[0].attribute).toBe('temperature');
  });
});

describe('Feature entity attributes', () => {
  for (const source of ['src', 'dist']) {
    it(`${source}: handles non-bubbling Feature entity picker changes and deliberate clearing`, async () => {
      const classes = loadCardClass({ source, withEntityPicker: true });
      const editor = new classes.featureEditor();
      const events = track(editor);
      editor.setConfig({ type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.initial', attribute: 'temperature' });
      editor.context = { entity_id: 'sensor.parent' };
      editor.hass = { states: {} };
      await editor.updateComplete;
      const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="feature-entity-source"]')[0];
      expect(picker).toBeTruthy();

      picker.value = 'sensor.p1_power';
      picker.dispatchEvent({ type: 'value-changed', detail: { value: 'sensor.p1_power' }, bubbles: false, composed: false });
      expect(editor._config.entity).toBe('sensor.p1_power');
      await editor.updateComplete;

      picker.value = '';
      picker.dispatchEvent({ type: 'change', bubbles: true, composed: true });
      expect(editor._config.entity).toBe('sensor.p1_power');

      picker.dispatchEvent({ type: 'value-changed', detail: { value: '' }, bubbles: false, composed: false });
      await editor.updateComplete;
      expect(editor._config.entity).toBeUndefined();
      expect(editor._effectiveEntity).toBe('sensor.parent');
      expect(editor._config.attribute).toBe('temperature');
      expect(events.at(-1).entity).toBeUndefined();
    });
  }

  it.each([
    [{ type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.explicit', attribute: 'custom_future' }, {}, 'sensor.explicit'],
    [{ type: 'custom:sensor-bar-card-plus-feature', attribute: 'temperature' }, { entity_id: 'weather.forecast_home' }, 'weather.forecast_home'],
  ])('edits %s effective entity and retains its attribute on reopen and entity changes', async (config, context, effective) => {
    const { editor, events } = await featureEditor(config, context);
    const control = editor.shadowRoot.querySelector('#feature-attribute');
    expect(control.value).toBe(config.attribute);
    expect(editor._effectiveEntity).toBe(effective);
    control.value = 'unknown_manual';
    control.dispatchEvent({ type: 'input', bubbles: true });
    await editor.updateComplete;
    expect(editor._config.attribute).toBe('unknown_manual');
    if (editor._explicitEntity) {
      const entity = editor.shadowRoot.querySelector('#feature-entity');
      entity.value = 'sensor.changed'; entity.dispatchEvent({ type: 'input', bubbles: true }); await editor.updateComplete;
      expect(editor._config.attribute).toBe('unknown_manual');
    }
    editor.setConfig(editor._config); await editor.updateComplete;
    expect(editor.shadowRoot.querySelector('#feature-attribute').value).toBe('unknown_manual');
    expect(events.length).toBeGreaterThan(0);
  });

  it('adds an attribute to legacy Feature Scale and Target sources without losing fallbacks', async () => {
    const { editor } = await featureEditor({ type: 'custom:sensor-bar-card-plus-feature', min: 0, min_entity: 'sensor.min', target: 75, target_entity: 'sensor.target' });
    const scale = editor._createSectionContext();
    scale.setSource({ type: 'card' }, 'min', 'attribute', 'lower');
    expect(editor._config.scale.min).toEqual({ fixed: 0, entity: 'sensor.min', attribute: 'lower' });
    expect(editor._config.min).toBeUndefined();
    scale.setSource({ type: 'card' }, 'target', 'attribute', 'limit');
    expect(editor._config.target.at).toEqual({ fixed: 75, entity: 'sensor.target', attribute: 'limit' });
    scale.setSource({ type: 'card' }, 'target', 'mode', 'entity-fallback');
    expect(editor._config.target.at.attribute).toBe('limit');
    scale.setSource({ type: 'card' }, 'target', 'mode', 'fixed');
    expect(editor._config.target.at.attribute).toBeUndefined();
  });

  it('edits Feature Reference Marker position and free-text label attributes independently', async () => {
    const { editor } = await featureEditor({ type: 'custom:sensor-bar-card-plus-feature', markers: [{
      at: { entity: 'sensor.position', attribute: 'unknown_position' },
      label: { text: 'Static label', entity: 'sensor.label', attribute: 'description', show_unit: false },
    }] });
    const position = editor.shadowRoot.querySelectorAll('input[data-kind="generic-marker-attribute"]')[0];
    const label = editor.shadowRoot.querySelectorAll('input[data-kind="generic-marker-label-attribute"]')[0];
    expect(position.value).toBe('unknown_position');
    expect(label.value).toBe('description');
    label.value = 'status';
    label.dispatchEvent({ type: 'input', bubbles: true, composed: true });
    await editor.updateComplete;
    expect(editor._config.markers[0]).toEqual({ at: { entity: 'sensor.position', attribute: 'unknown_position' },
      label: { text: 'Static label', entity: 'sensor.label', attribute: 'status', show_unit: false } });
    position.value = '';
    position.dispatchEvent({ type: 'input', bubbles: true, composed: true });
    await editor.updateComplete;
    expect(editor._config.markers[0].at).toEqual({ entity: 'sensor.position' });
    expect(editor._config.markers[0].label.attribute).toBe('status');
  });

  it('keeps Entity mode transient in Feature Reference Markers until a real entity is selected', async () => {
    const { editor } = await featureEditor({ type: 'custom:sensor-bar-card-plus-feature', markers: [{ at: { fixed: 50 } }] });
    const section = editor._referenceMarkersSection;
    const sourceTarget = { dataset: { kind: 'generic-marker-source-mode', scopeType: 'card', index: 'card', markerIndex: '0' }, value: 'entity' };
    section.handleField({ target: sourceTarget, kind: 'generic-marker-source-mode', value: 'entity' });
    await editor.updateComplete;
    expect(editor._config.markers[0].at).toBeUndefined();
    expect(section._getGenericMarkerSource(editor._config.markers[0], { type: 'card' }, 0).mode).toBe('entity');
    const picker = { dataset: { kind: 'generic-marker-entity', scopeType: 'card', index: 'card', markerIndex: '0' } };
    section.handleField({ target: picker, kind: 'generic-marker-entity', value: 'weather.forecast_home' });
    await editor.updateComplete;
    expect(editor._config.markers[0].at).toEqual({ entity: 'weather.forecast_home' });
  });

  it('places the existing Feature Unit editor near Attribute and keeps a single config binding', async () => {
    const { editor, events } = await featureEditor({ type: 'custom:sensor-bar-card-plus-feature', formatting: { unit: 'W' } }, { entity_id: 'sensor.parent' });
    expect(editor.shadowRoot.innerHTML.indexOf('data-kind="feature-attribute"')).toBeLessThan(editor.shadowRoot.innerHTML.indexOf('data-field="formatting-unit"'));
    expect(editor.shadowRoot.innerHTML.match(/data-field="formatting-unit"/g)).toHaveLength(1);
    const unit = editor.shadowRoot.querySelector('#formatting-unit');
    expect(unit.value).toBe('W');
    unit.value = 'kW'; unit.dispatchEvent({ type: 'input', bubbles: true }); await editor.updateComplete;
    expect(events.at(-1).formatting.unit).toBe('kW');
    const relocated = editor.shadowRoot.querySelector('#formatting-unit');
    relocated.value = ''; relocated.dispatchEvent({ type: 'input', bubbles: true }); await editor.updateComplete;
    expect(events.at(-1).formatting).toBeUndefined();
    expect(editor.shadowRoot.innerHTML.match(/data-field="formatting-unit"/g)).toHaveLength(1);
  });
});
