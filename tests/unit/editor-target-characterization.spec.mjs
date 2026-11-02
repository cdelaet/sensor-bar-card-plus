import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
const root = { type: 'card' }, row = { type: 'entity', index: 0 };
for (const source of ['src', 'dist']) describe(`standalone Target characterization (${source})`, () => {
  for (const target of [undefined, { enabled: true }, { enabled: false }, { at: 0 }, { at: '70%' }]) it(`reads/defaults/inherits ${JSON.stringify(target)}`, () => {
    const editor = createEditor({ source }); editor.setConfig({ target, entities: ['sensor.a'] });
    expect(editor._getTargetMode(root)).toBe(target?.enabled === true ? 'enabled' : target?.enabled === false ? 'disabled' : 'auto');
    expect(editor._getEffectiveTargetShapeValue(row)).toBe('diamond');
    expect(editor._getEffectiveMarkerDirection(row, 'target')).toBe('inward');
    expect(editor._getBuiltinMarkerLabelOptions(root, 'target')).toEqual({ show: false, text: '', showValue: true, showUnit: true, precision: '' });
    expect(editor._hasTargetOverride(row)).toBe(false);
  });
  it('preserves percent and unknown source siblings on a canonical source edit', () => {
    const editor = createEditor({ source }); editor.setConfig({ target: { at: { percent: 70, value: 5, entity: 'sensor.t', future: true } } });
    editor._setTargetResolvablePart(root, 'fixed', '8');
    expect(editor._draftConfig.target.at).toEqual({ fixed: 8, entity: 'sensor.t', percent: 70, future: true });
    editor._setTargetResolvablePart(root, 'fixed', 'invalid');
    expect(editor._draftConfig.target.at).toEqual({ entity: 'sensor.t', percent: 70, future: true });
  });
  it('keeps exact alias cleanup and label default/precision behavior', () => {
    const editor = createEditor({ source }); editor.setConfig({ target: 25, target_entity: 'sensor.t', target_color: 'red', show_target_label: true, above_target_color: 'blue' });
    editor._setTargetResolvablePart(root, 'fixed', '30');
    expect(editor._draftConfig.target.at).toEqual({ fixed: 30, entity: 'sensor.t' }); expect(editor._draftConfig.target_entity).toBeUndefined();
    editor._setBuiltinMarkerLabelField(root, 'target', 'show', false);
    expect(editor._draftConfig.show_target_label).toBeUndefined(); expect(editor._draftConfig.target.label?.show).toBeUndefined();
    editor._setBuiltinMarkerLabelField(root, 'target', 'text', '  Goal   energy  ');
    editor._setBuiltinMarkerLabelField(root, 'target', 'precision', '2');
    editor._setBuiltinMarkerLabelField(root, 'target', 'showValue', false);
    expect(editor._draftConfig.target.label).toEqual({ text: 'Goal energy', precision: 2, show_value: false });
    expect(editor._setBuiltinMarkerLabelField(root, 'target', 'precision', '-1')).toBe(false);
  });
  it('retains local inheritance, presentation and the precise override clear fields', () => {
    const editor = createEditor({ source }); editor.setConfig({ target: { at: 10, shape: 'triangle', direction: 'outward', label: { text: 'Root' } }, entities: [{ entity: 'sensor.a', target: { enabled: false, at: 20, shape: 'triangle', label: { show: true, text: 'Local', precision: 1, decimal: 2 }, future: true } }] });
    expect(editor._getEffectiveTargetShapeValue(row)).toBe('triangle'); expect(editor._getEffectiveMarkerDirection(row, 'target')).toBe('outward');
    editor._clearTargetOverride(row);
    expect(editor._draftConfig.entities[0].target).toEqual({ label: { text: 'Local', precision: 1 }, future: true });
    editor._setTargetShape(root, 'diamond'); expect(editor._draftConfig.target.shape).toBeUndefined();
    editor._setMarkerDirection(root, 'target', 'inward'); expect(editor._draftConfig.target.direction).toBeUndefined();
  });
  it('stores exceeded-fill drafts locally when disabled and restores them through echo', () => {
    const editor = createEditor({ source }); editor.setConfig({ target: { at: 10 } });
    expect(editor._setTargetAboveFillColor(root, 'red')).toBe(false); expect(editor._draftConfig.target.when_exceeded).toBeUndefined();
    editor._setTargetAboveFillEnabled(root, true); expect(editor._draftConfig.target.when_exceeded.fill_color).toBe('red');
    editor._setTargetAboveFillEnabled(root, false); editor.setConfig(editor._draftConfig);
    expect(editor._getTargetAboveFillDraft(root)).toBe('red');
    editor._setTargetAboveFillEnabled(root, true); expect(editor._draftConfig.target.when_exceeded.fill_color).toBe('red');
    expect(editor._getCardTargetMarkerSummary()).toBe('10 · Diamond');
  });

  it('edits Card Target as one Value with Entity/Attribute and fixed/percentage fallbacks', () => {
    const editor = createEditor({ source });
    const config = { target: { at: { entity: { id: 'sensor.goal', attribute: 'reading' }, percent: 25, future_source: true }, shape: 'triangle', future_target: true }, entities: [{ entity: 'sensor.row', future_row: true }] };
    editor.setConfig(config);
    const cardMarkup = editor._targetSection.render(root);
    expect(cardMarkup).toContain('>Value</label>');
    expect(cardMarkup).toContain('class="field-row resolvable-source-value"');
    expect(cardMarkup).toContain('data-resolvable-source-value="true"');
    expect(cardMarkup).toContain('type="text"');
    expect(cardMarkup).toContain('value="25%"');
    expect(cardMarkup).toContain('data-kind="target-entity-source"');
    expect(cardMarkup).toContain('data-kind="target-attribute"');
    expect(editor._draftConfig).toEqual(config);

    editor._targetSection.handleField({ field: 'target-value', value: '25' });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, fixed: 25, future_source: true });
    editor._targetSection.handleField({ field: 'target-value', value: '0' });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, fixed: 0, future_source: true });
    editor._targetSection.handleField({ field: 'target-value', value: '25%' });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, percent: 25, future_source: true });
    editor._targetSection.handleField({ field: 'target-value', value: '' });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, future_source: true });
    editor._targetSection.handleField({ field: 'target-value', value: 'invalid' });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, future_source: true });
    editor._targetSection.handleField({ field: 'target-value', value: '25%' });
    editor._targetSection.handleField({ kind: 'target-entity-source', value: '' });
    expect(editor._draftConfig.target.at).toEqual({ percent: 25, future_source: true });
    editor._targetSection.handleField({ kind: 'entity-target-entity-source', index: 0, value: 'sensor.next' });
    editor._targetSection.handleField({ kind: 'entity-target-attribute', index: 0, value: 'temperature' });
    expect(editor._draftConfig.entities[0]).toMatchObject({ future_row: true, target: { at: { entity: { id: 'sensor.next', attribute: 'temperature' }, percent: 25 } } });
  });

  it('inherits a percentage Value/Entity, creates a complete override on edit, and restores inheritance', () => {
    const editor = createEditor({ source });
    editor.setConfig({ target: { at: { entity: { id: 'sensor.goal', attribute: 'reading' }, percent: 25 } }, entities: [{ entity: 'sensor.row' }] });
    const rowMarkup = editor._targetSection.render(row);
    expect(rowMarkup).toContain('id="entity-0-target-inherit"');
    expect(rowMarkup).toContain('checked');
    expect(rowMarkup).toContain('value="25%"');
    expect(editor._getEffectiveTargetResolvableValue(row)).toMatchObject({ entity: 'sensor.goal', attribute: 'reading', percent: 25 });

    editor._targetSection.handleField({ kind: 'entity-target-value', index: 0, value: '35%' });
    expect(editor._draftConfig.entities[0].target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, percent: 35 });
    editor._targetSection.handleField({ kind: 'entity-target-inherit', index: 0, value: true });
    expect(editor._draftConfig.target.at).toEqual({ entity: { id: 'sensor.goal', attribute: 'reading' }, percent: 25 });
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.row' });
    expect(editor._getEffectiveTargetResolvableValue(row)).toMatchObject({ entity: 'sensor.goal', attribute: 'reading', percent: 25 });
  });

  it('edits legacy scalar Target/target_entity forms through the direct Value field', () => {
    const editor = createEditor({ source });
    editor.setConfig({ target: 70, target_entity: 'sensor.legacy', target_color: 'red', future_target: true,
      entities: [{ entity: 'sensor.row', target: 50, target_entity: 'sensor.local', future_row: true }] });
    expect(editor._targetSection.render(root)).toContain('value="70"');
    expect(editor._targetSection.render(row)).toContain('value="50"');
    editor._targetSection.handleField({ field: 'target-value', value: '25%' });
    expect(editor._draftConfig.target).toEqual({ at: { entity: 'sensor.legacy', percent: 25 } });
    expect(editor._draftConfig.target_color).toBe('red');
    expect(editor._draftConfig.future_target).toBe(true);
    expect(editor._draftConfig.target_entity).toBeUndefined();
    editor._targetSection.handleField({ kind: 'entity-target-value', index: 0, value: '35%' });
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.row', future_row: true,
      target: { at: { entity: 'sensor.local', percent: 35 } } });
  });
});
