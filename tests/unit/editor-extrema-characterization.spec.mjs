import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { parseHistoricalWindow } from '../../src/history/time-window.js';
const root = { type: 'card' }, row = { type: 'entity', index: 0 };
const configOf = (editor, scope, key) => key === 'peak' ? editor._getEffectiveScopedPeakConfig(scope) : editor._getEffectiveScopedFloorConfig(scope);
const setEnabled = (editor, scope, key, value) => key === 'peak' ? editor._setScopedPeakEnabled(scope, value) : editor._setScopedExtremumEnabled(scope, key, value);
for (const source of ['src', 'dist']) describe(`standalone extrema characterization (${source})`, () => {
  for (const key of ['peak', 'floor']) {
    it(`${key}: defaults, enable/disable, inheritance and summaries`, () => {
      const editor = createEditor({ source }); editor.setConfig({ entities: ['sensor.a'] });
      expect(configOf(editor, root, key)).toMatchObject({ mode: 'disabled', color: '' });
      expect(editor._getEffectiveMarkerExtras(root, key)).toMatchObject({ window: 'today', labelShow: false, labelShowValue: true, labelShowUnit: true });
      expect(editor._getMarkerResetSummary(key)).toBe('Disabled · today');
      setEnabled(editor, root, key, true); expect(configOf(editor, row, key).mode).toBe('enabled');
      setEnabled(editor, row, key, false); expect(configOf(editor, row, key).mode).toBe('disabled');
      expect(configOf(editor, root, key).mode).toBe('enabled');
      setEnabled(editor, root, key, false); expect(editor._draftConfig[key]).toEqual({ window: 'today' });
    });
    it(`${key}: accepts supported windows and rejects invalid values`, () => {
      const editor = createEditor({ source }); editor.setConfig({ [key]: { enabled: true }, entities: ['sensor.a'] });
      for (const window of ['1m', '59m', '1h', '24h', '7d', 'today', 'yesterday', 'quarterly', 'hourly', 'yearly']) {
        editor._setScopedExtremumWindow(root, key, window);
        expect(editor._draftConfig[key].window).toBe(window); expect(parseHistoricalWindow(window)).not.toBeNull();
        expect(editor._getMarkerResetSummary(key)).toBe(`Enabled · ${window}`);
      }
      const before = editor._draftConfig[key].window;
      for (const window of ['never', '0m', '1s', 'invalid']) {
        editor._setScopedExtremumWindow(root, key, window); expect(editor._draftConfig[key].window).toBe(before);
      }
    });
    it(`${key}: direction, color and inherited label fields retain current canonicalization`, () => {
      const editor = createEditor({ source }); editor.setConfig({ [key]: { enabled: true, color: '#123456', direction: 'outward', label: { show: true, text: 'Root', decimal: 2 } }, entities: ['sensor.a'] });
      expect(editor._getEffectiveMarkerDirection(row, key)).toBe('outward');
      expect(editor._getBuiltinMarkerLabelOptions(row, key)).toMatchObject({ show: true, text: 'Root', precision: 2 });
      editor._setMarkerDirection(root, key, 'inward'); expect(editor._draftConfig[key].direction).toBeUndefined();
      editor._setBuiltinMarkerLabelField(root, key, 'text', '  Peak   energy ');
      editor._setBuiltinMarkerLabelField(root, key, 'precision', '0');
      editor._setBuiltinMarkerLabelField(root, key, 'showValue', false); editor._setBuiltinMarkerLabelField(root, key, 'showUnit', false);
      expect(editor._draftConfig[key].label).toEqual({ show: true, text: 'Peak energy', precision: 0, show_value: false, show_unit: false });
      editor.setConfig(editor._draftConfig); expect(editor._getBuiltinMarkerLabelOptions(root, key).precision).toBe(0);
      expect(editor._setBuiltinMarkerLabelField(root, key, 'precision', '-1')).toBe(false);
    });
    it(`${key}: clears only its override and preserves unknown marker siblings`, () => {
      const editor = createEditor({ source }); editor.setConfig({ [key]: { enabled: true, window: 'daily' }, entities: [{ entity: 'sensor.a', [key]: { enabled: false, color: 'red', direction: 'outward', window: 'today', label: { show: true }, future: true }, [key === 'peak' ? 'floor' : 'peak']: { enabled: true } }] });
      if (key === 'peak') editor._clearPeakOverride(row); else editor._clearFloorOverride(row);
      expect(editor._draftConfig.entities[0][key]).toEqual({ future: true });
      expect(editor._draftConfig.entities[0][key === 'peak' ? 'floor' : 'peak']).toEqual({ enabled: true });
      expect(editor._draftConfig[key]).toEqual({ enabled: true, window: 'daily' });
    });
    it(`${key}: preserves raw unsupported reset objects on load, with no reset draft state`, () => {
      const editor = createEditor({ source }), reset = { mode: 'duration', duration: '15m', future: true };
      editor.setConfig({ [key]: { reset } }); expect(editor._draftConfig[key].window).toEqual(reset);
      expect(editor._getEffectiveMarkerExtras(root, key).window).toBe('[object object]');
      expect(editor.shadowRoot.innerHTML).not.toContain(`${key}-window-duration`);
      expect(editor._renderWindowOptions('today').match(/<option /g)).toHaveLength(95);
    });
  }
  it('ignores unsupported Peak aliases while retaining documented flat legacy controls', () => {
    const editor = createEditor({ source }); editor.setConfig({ peak: { enabled: true, color: 'red' }, peak_marker: { show: true, color: 'blue', future: true }, show_peak: false, peak_color: 'green' });
    expect(editor._getScopedPeakConfig(root)).toEqual({ mode: 'disabled', color: 'red' });
    editor._setScopedPeakEnabled(root, true);
    expect(editor._draftConfig.peak).toEqual({ enabled: true, color: 'red', window: 'today' });
    expect(editor._draftConfig.peak_marker).toEqual({ show: true, color: 'blue', future: true });
    expect(editor._draftConfig.show_peak).toBeUndefined(); expect(editor._draftConfig.peak_color).toBeUndefined();
  });
});
