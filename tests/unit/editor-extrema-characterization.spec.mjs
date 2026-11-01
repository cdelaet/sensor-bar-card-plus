import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { canonicalizeHistoricalWindow, parseHistoricalWindow } from '../../src/history/time-window.js';
import { renderWindowOptions } from '../../src/editor/shared/editor-controls.js';
const root = { type: 'card' }, row = { type: 'entity', index: 0 };
const configOf = (editor, scope, key) => key === 'peak' ? editor._getEffectiveScopedPeakConfig(scope) : editor._getEffectiveScopedFloorConfig(scope);
const setEnabled = (editor, scope, key, value) => key === 'peak' ? editor._setScopedPeakEnabled(scope, value) : editor._setScopedExtremumEnabled(scope, key, value);

describe('historical window selector presets', () => {
  it('shows the curated presets while preserving year aliases and non-preset values', () => {
    const html = renderWindowOptions('today');
    const options = [...html.matchAll(/<option value="([^"]+)"(?: selected)?>([^<]+)<\/option>/g)]
      .map(([, value, label]) => [value, label]);
    expect(options).toEqual([
      ['quarterly', 'This quarter-hour'], ['hourly', 'This hour'], ['today', 'Today'], ['yesterday', 'Yesterday'],
      ['this_week', 'This week'], ['previous_week', 'Previous week'], ['this_month', 'This month'], ['previous_month', 'Previous month'],
      ['this_year', 'This year'], ['previous_year', 'Previous year'],
      ['5m', 'Last 5 minutes'], ['10m', 'Last 10 minutes'], ['15m', 'Last 15 minutes'], ['30m', 'Last 30 minutes'],
      ['1h', 'Last 1 hour'], ['2h', 'Last 2 hours'], ['3h', 'Last 3 hours'], ['6h', 'Last 6 hours'],
      ['12h', 'Last 12 hours'], ['24h', 'Last 24 hours'], ['48h', 'Last 48 hours'],
      ['7d', 'Last 7 days'], ['14d', 'Last 14 days'], ['30d', 'Last 30 days'],
    ]);
    expect(parseHistoricalWindow('yearly')).toEqual(parseHistoricalWindow('this_year'));
    expect(options.some(([, label]) => label === 'Current year')).toBe(false);
    expect(renderWindowOptions('last_week')).toContain('<option value="previous_week" selected>Previous week</option>');
    expect(renderWindowOptions('yearly')).toContain('<option value="this_year" selected>This year</option>');
    expect(renderWindowOptions('yearly')).not.toContain('<option value="yearly"');

    for (const value of ['1500m']) {
      expect(renderWindowOptions(value)).toContain(`<option value="${value}" selected>`);
    }
  });
});

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
      for (const window of ['1m', '59m', '1h', '1440m', '24h', '1500m', '48h', '7d', 'today', 'yesterday',
        'quarterly', 'hourly', 'previous_week', 'previous_month', 'previous_year', 'last_week', 'last_month', 'last_year', 'yearly']) {
        editor._setScopedExtremumWindow(root, key, window);
        const canonical = canonicalizeHistoricalWindow(window);
        expect(editor._draftConfig[key].window).toBe(canonical); expect(parseHistoricalWindow(window)).not.toBeNull();
        expect(editor._getMarkerResetSummary(key)).toBe(`Enabled · ${canonical}`);
      }
      const before = editor._draftConfig[key].window;
      for (const window of ['never', '0m', '1s', '1441m', 'invalid']) {
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
    it(`${key}: preserves an existing unsupported duration through unrelated edits`, () => {
      const editor = createEditor({ source });
      editor.setConfig({ [key]: { enabled: true, window: '1441m' }, entities: [{ entity: 'sensor.a', [key]: { window: '1441m' } }] });
      editor._setMarkerDirection(root, key, 'outward');
      expect(editor._draftConfig[key].window).toBe('1441m');
      expect(editor._draftConfig.entities[0][key].window).toBe('1441m');
      expect(editor._renderWindowOptions('1441m')).toContain('Invalid window: 1441m');
    });
    it(`${key}: clears only its override and preserves unknown marker siblings`, () => {
      const editor = createEditor({ source }); editor.setConfig({ [key]: { enabled: true, window: 'daily' }, entities: [{ entity: 'sensor.a', [key]: { enabled: false, color: 'red', direction: 'outward', window: 'today', label: { show: true }, future: true }, [key === 'peak' ? 'floor' : 'peak']: { enabled: true } }] });
      if (key === 'peak') editor._clearPeakOverride(row); else editor._clearFloorOverride(row);
      expect(editor._draftConfig.entities[0][key]).toEqual({ future: true });
      expect(editor._draftConfig.entities[0][key === 'peak' ? 'floor' : 'peak']).toEqual({ enabled: true });
      expect(editor._draftConfig[key]).toEqual({ enabled: true, window: 'today' });
    });
    it(`${key}: preserves raw unsupported reset objects on load, with no reset draft state`, () => {
      const editor = createEditor({ source }), reset = { mode: 'duration', duration: '15m', future: true };
      editor.setConfig({ [key]: { reset } }); expect(editor._draftConfig[key].window).toEqual(reset);
      expect(editor._getEffectiveMarkerExtras(root, key).window).toBe('[object object]');
      expect(editor.shadowRoot.innerHTML).not.toContain(`${key}-window-duration`);
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
