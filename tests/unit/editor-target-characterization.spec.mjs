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
  it('preserves percent on a canonical source edit but rebuilds known source fields', () => {
    const editor = createEditor({ source }); editor.setConfig({ target: { at: { percent: 70, value: 5, entity: 'sensor.t', future: true } } });
    editor._setTargetResolvablePart(root, 'fixed', '8');
    expect(editor._draftConfig.target.at).toEqual({ fixed: 8, entity: 'sensor.t', percent: 70 });
    editor._setTargetResolvablePart(root, 'fixed', 'invalid');
    expect(editor._draftConfig.target.at).toEqual({ entity: 'sensor.t', percent: 70 });
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
});
