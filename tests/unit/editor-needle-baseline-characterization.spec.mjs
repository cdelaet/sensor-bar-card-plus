import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
const root = { type: 'card' }, row = { type: 'entity', index: 0 };
for (const source of ['src', 'dist']) describe(`standalone Needle/Baseline characterization (${source})`, () => {
  for (const needle of [undefined, true, false, { show: true, color: '#123456' }, { color: 'red' }]) it(`reads/inherits Needle ${JSON.stringify(needle)}`, () => {
    const editor = createEditor({ source }); editor.setConfig({ bar: { needle }, entities: [{ entity: 'sensor.a' }] });
    const mode = needle === true || needle?.show === true ? 'enabled' : 'disabled';
    expect(editor._getScopedNeedleConfig(root).mode).toBe(mode);
    expect(editor._getEffectiveScopedNeedleConfig(row)).toEqual(editor._getScopedNeedleConfig(root));
    expect(editor._hasNeedleOverride(row)).toBe(false);
  });
  it('removes only local active Baseline on Needle enable, leaving disabled/percentage-only Baselines', () => {
    const editor = createEditor({ source }); editor.setConfig({ baseline: { enabled: true, at: 10 }, entities: [{ entity: 'sensor.a', baseline: { at: { entity: 'sensor.b', fixed: 0 } } }] });
    editor._setScopedNeedleMode(row, 'enabled');
    expect(editor._draftConfig.entities[0]).not.toHaveProperty('baseline');
    expect(editor._draftConfig.baseline).toEqual({ enabled: true, at: 10 });
    editor._setScopedNeedleMode(root, 'enabled'); expect(editor._draftConfig).not.toHaveProperty('baseline');
    for (const baseline of [{ enabled: false, at: 10 }, { at: '50%' }]) {
      editor.setConfig({ baseline }); editor._setScopedNeedleMode(root, 'enabled');
      expect(editor._draftConfig.baseline).toEqual(baseline);
    }
  });
  it('canonicalizes boolean Needle and retains root disabled-color behavior', () => {
    const editor = createEditor({ source }); editor.setConfig({ bar: { needle: true }, baseline: { enabled: false, at: 20 } });
    editor._setScopedNeedleColor(root, '#123456');
    expect(editor._draftConfig.bar.needle).toEqual({ show: true, color: '#123456' });
    editor._setScopedNeedleMode(root, 'disabled'); expect(editor._draftConfig.bar?.needle).toBeUndefined();
    editor._setScopedNeedleColor(root, 'red'); expect(editor._draftConfig.bar?.needle).toBeUndefined();
  });
  it('reads percent, fixed/value/entity sources and preserves current source commit canonicalization', () => {
    const editor = createEditor({ source }); editor.setConfig({ baseline: { at: { value: 5, entity: 'sensor.b', future: true } }, bar: { needle: true }, entities: [{ entity: 'sensor.a' }] });
    expect(editor._getBaselineResolvableValue(root)).toEqual({ fixed: 5, entity: 'sensor.b' });
    expect(editor._getEffectiveBaselineResolvableValue(row)).toEqual({ fixed: 5, entity: 'sensor.b' });
    editor._setBaselineResolvablePart(root, 'fixed', '8');
    expect(editor._draftConfig.baseline.at).toEqual({ fixed: 8, entity: 'sensor.b' });
    expect(editor._draftConfig.bar.needle).toBe(true);
    editor.setConfig({ baseline: { at: '50%' } });
    expect(editor._getBaselineResolvableValue(root)).toEqual({ fixed: '', entity: '', percent: 50 });
    editor._setBaselineResolvablePart(root, 'entity', 'sensor.b');
    expect(editor._draftConfig.baseline.at).toEqual({ entity: 'sensor.b' });
  });
  it('retains directional-color drafts through echo, clearing and toggling', () => {
    const editor = createEditor({ source }); editor.setConfig({ baseline: { at: { fixed: 0 }, above: { color: 'red' } } });
    editor._setBaselineDirectionalColorEnabled(root, 'above', false);
    editor.setConfig(editor._draftConfig); editor._render();
    expect(editor._getBaselineColorDraft(root, 'above')).toBe('red');
    editor._setBaselineDirectionalColorEnabled(root, 'above', true);
    expect(editor._draftConfig.baseline.above.color).toBe('red');
    editor._clearBaselineOverride(root); expect(editor._draftConfig.baseline).toBeUndefined();
  });
});
