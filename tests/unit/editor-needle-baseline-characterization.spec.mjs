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
    expect(editor._draftConfig.baseline.at).toEqual({ fixed: 8, entity: 'sensor.b', future: true });
    expect(editor._draftConfig.bar.needle).toBe(true);
    editor.setConfig({ baseline: { at: '50%' } });
    expect(editor._getBaselineResolvableValue(root)).toEqual({ fixed: '', entity: '', percent: 50 });
    editor._setBaselineResolvablePart(root, 'entity', 'sensor.b');
    expect(editor._draftConfig.baseline.at).toEqual({ entity: 'sensor.b', percent: 50 });
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

  it('edits Card Baseline as one Value with Entity/Attribute and fixed/percentage fallbacks', () => {
    const editor = createEditor({ source });
    const config = { baseline: { at: { entity: { id: 'sensor.base', attribute: 'reading' }, percent: 25, future_source: true }, enabled: true, future_baseline: true }, entities: [{ entity: 'sensor.row', future_row: true }] };
    editor.setConfig(config);
    const cardMarkup = editor._baselineSection.render(root);
    expect(cardMarkup).toContain('>Value</label>');
    expect(cardMarkup).toContain('class="field-row resolvable-source-value"');
    expect(cardMarkup).toContain('data-resolvable-source-value="true"');
    expect(cardMarkup).toContain('type="text"');
    expect(cardMarkup).toContain('value="25%"');
    expect(cardMarkup).toContain('data-kind="baseline-entity-source"');
    expect(cardMarkup).toContain('data-kind="baseline-attribute"');
    expect(editor._draftConfig).toEqual(config);

    editor._baselineSection.handleField({ field: 'baseline-value', value: '25' });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, fixed: 25, future_source: true });
    editor._baselineSection.handleField({ field: 'baseline-value', value: '0' });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, fixed: 0, future_source: true });
    editor._baselineSection.handleField({ field: 'baseline-value', value: '25%' });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, percent: 25, future_source: true });
    editor._baselineSection.handleField({ field: 'baseline-value', value: '' });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, future_source: true });
    editor._baselineSection.handleField({ field: 'baseline-value', value: 'invalid' });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, future_source: true });
    editor._baselineSection.handleField({ field: 'baseline-value', value: '25%' });
    editor._baselineSection.handleField({ kind: 'baseline-entity-source', value: '' });
    expect(editor._draftConfig.baseline.at).toEqual({ percent: 25, future_source: true });
    editor._baselineSection.handleField({ kind: 'entity-baseline-entity-source', index: 0, value: 'sensor.next' });
    editor._baselineSection.handleField({ kind: 'entity-baseline-attribute', index: 0, value: 'temperature' });
    expect(editor._draftConfig.entities[0]).toMatchObject({ future_row: true, baseline: { at: { entity: { id: 'sensor.next', attribute: 'temperature' }, percent: 25 } } });
  });

  it('inherits a percentage Baseline Value/Entity, creates an override on edit, and restores inheritance', () => {
    const editor = createEditor({ source });
    editor.setConfig({ baseline: { at: { entity: { id: 'sensor.base', attribute: 'reading' }, percent: 25 } }, entities: [{ entity: 'sensor.row' }] });
    const rowMarkup = editor._baselineSection.render(row);
    expect(rowMarkup).toContain('id="entity-0-baseline-inherit"');
    expect(rowMarkup).toContain('checked');
    expect(rowMarkup).toContain('value="25%"');
    expect(editor._getEffectiveBaselineResolvableValue(row)).toMatchObject({ entity: 'sensor.base', attribute: 'reading', percent: 25 });

    editor._baselineSection.handleField({ kind: 'entity-baseline-value', index: 0, value: '35%' });
    expect(editor._draftConfig.entities[0].baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, percent: 35 });
    editor._baselineSection.handleField({ kind: 'entity-baseline-inherit', index: 0, value: true });
    expect(editor._draftConfig.baseline.at).toEqual({ entity: { id: 'sensor.base', attribute: 'reading' }, percent: 25 });
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.row' });
    expect(editor._getEffectiveBaselineResolvableValue(row)).toMatchObject({ entity: 'sensor.base', attribute: 'reading', percent: 25 });
  });

  it('reads legacy scalar Baseline as direct Value without materializing edits on open', () => {
    const editor = createEditor({ source });
    const config = { baseline: 12, entities: [{ entity: 'sensor.row', future_row: true }] };
    editor.setConfig(config);
    expect(editor._baselineSection.render(root)).toContain('value="12"');
    expect(editor._draftConfig).toEqual(config);
  });

  it('edits legacy scalar Baseline forms through direct Value without losing siblings', () => {
    const editor = createEditor({ source });
    editor.setConfig({ baseline: 0, future_baseline: true,
      entities: [{ entity: 'sensor.row', baseline: 12, future_row: true }] });
    expect(editor._baselineSection.render(root)).toContain('value="0"');
    expect(editor._baselineSection.render(row)).toContain('value="12"');
    editor._baselineSection.handleField({ field: 'baseline-value', value: '25%' });
    expect(editor._draftConfig.baseline).toEqual({ at: { percent: 25 } });
    expect(editor._draftConfig.future_baseline).toBe(true);
    editor._baselineSection.handleField({ kind: 'entity-baseline-value', index: 0, value: '35%' });
    expect(editor._draftConfig.entities[0]).toEqual({ entity: 'sensor.row', future_row: true,
      baseline: { at: { percent: 35 } } });
  });
});
