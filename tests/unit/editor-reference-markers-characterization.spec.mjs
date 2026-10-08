import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
const root = { type: 'card' }, row = { type: 'entity', index: 0 };
const edit = (editor, field, value) => editor._setGenericMarkerField(root, 0, `generic-marker-${field}`, value);
const click = (editor, action, index = 0) => editor._handleClick({ target: { dataset: { action: `${action}-generic-marker${action === 'move' ? '-down' : ''}`, scopeType: 'card', markerIndex: String(index) }, closest() { return this; } } });
for (const source of ['src', 'dist']) describe(`standalone Reference Marker characterization (${source})`, () => {
  it('starts empty, appends default anchors without a maximum, preserves duplicates and moves identities with rows', () => {
    const editor = createEditor({ source }); editor.setConfig({});
    expect(editor._getGenericMarkersSummary(root)).toBe('No reference markers');
    for (let i = 0; i < 9; i++) click(editor, 'add');
    expect(editor._draftConfig.markers).toHaveLength(9); expect(editor._draftConfig.markers[0]).toEqual({ at: { fixed: 50 } });
    const ids = editor._getGenericMarkerUiIds(root, 9).slice();
    click(editor, 'move'); expect(editor._getGenericMarkerUiIds(root, 9).slice(0,2)).toEqual([ids[1], ids[0]]);
    click(editor, 'remove', 1); expect(editor._getGenericMarkerUiIds(root, 8)).not.toContain(ids[0]);
    expect(editor._expandedGenericMarkerUiIds.has(ids[1])).toBe(true);
    expect(editor._draftConfig.markers[0]).not.toHaveProperty('markerUiId');
  });
  for (const [at, expected] of [[25, { mode: 'fixed', fixed: '' }], [{ value: 25 }, { mode: 'fixed', fixed: '' }], [{ fixed: 25 }, { mode: 'fixed', fixed: 25 }], ['25%', { mode: 'percent', percent: '25' }], ['sensor.reference', { mode: 'entity', entity: 'sensor.reference', fixed: '' }], [{ entity: 'sensor.reference', fixed: 25 }, { mode: 'entity-fallback', entity: 'sensor.reference', fixed: 25 }]]) it(`reads source ${JSON.stringify(at)} exactly as before`, () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at }] });
    expect(editor._getGenericMarkerSource(editor._draftConfig.markers[0])).toEqual(expected);
  });
  it('source modes preserve object unknown fields but replace scalar sources, with percent exposed as a string', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: { fixed: 25, entity: 'sensor.a', future: true } }] });
    edit(editor, 'source-mode', 'fixed'); expect(editor._draftConfig.markers[0].at).toEqual({ fixed: 25, future: true });
    edit(editor, 'source-mode', 'entity'); expect(editor._draftConfig.markers[0].at).toEqual({ entity: '', future: true });
    edit(editor, 'source-mode', 'entity-fallback'); expect(editor._draftConfig.markers[0].at).toEqual({ entity: '', fixed: 50, future: true });
    edit(editor, 'source-mode', 'percent'); expect(editor._draftConfig.markers[0].at).toBe('50%');
    edit(editor, 'percent', '101'); expect(editor._draftConfig.markers[0].at).toBe('101%');
    edit(editor, 'source-mode', 'fixed'); expect(editor._draftConfig.markers[0].at).toEqual({ fixed: 50 });
  });
  it('blank/invalid numeric and precision inputs clear owned fields; aliases and unrelated fields survive draft mutation', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: { fixed: 25, value: 12, future: true }, label: { precision: 1, decimal: 2, future: true } }] });
    edit(editor, 'fixed', '-'); expect(editor._draftConfig.markers[0].at).toEqual({ value: 12, future: true });
    edit(editor, 'label-precision', '-1'); expect(editor._draftConfig.markers[0].label).toEqual({ future: true });
    edit(editor, 'label-precision', '0'); expect(editor._draftConfig.markers[0].label.precision).toBe(0);
  });
  it('label-only anchors keep independent label entities and supported label fields', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: { fixed: 25 }, label: { text: 'Limit', future: true, decimal: 2 } }] });
    for (const [field,value] of [['show-marker',false],['label-show',true],['label-entity',' sensor.information '],['label-text','  Limit   energy '],['label-show-value',false],['label-show-unit',false],['label-precision','0']]) edit(editor,field,value);
    expect(editor._draftConfig.markers[0]).toEqual({ at: { fixed: 25 }, show_marker: false, label: { show: true, text: 'Limit energy', entity: 'sensor.information', show_value: false, show_unit: false, precision: 0, future: true } });
    edit(editor,'show-marker',true); edit(editor,'label-entity',''); expect(editor._draftConfig.markers[0]).not.toHaveProperty('show_marker'); expect(editor._draftConfig.markers[0].label).not.toHaveProperty('entity');
  });
  it('renders every shape/direction/lane plus percentage and CSS text fallback; defaults remain unchanged', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: '25%', color: 'red' }] });
    const html = editor._renderGenericMarkersEditor(root);
    for (const option of ['circle','diamond','triangle','chevron','arrow','pin','above','below','inward','outward']) expect(html).toContain(`value="${option}"`);
    expect(html).toContain('generic-marker-percent'); expect(html).toContain('generic-marker-color-text-fallback');
    for (const shape of ['circle','diamond','triangle','chevron','arrow','pin']) { edit(editor,'shape',shape); expect(editor._draftConfig.markers[0].shape).toBe(shape); }
    edit(editor,'direction','OUTWARD'); expect(editor._draftConfig.markers[0].direction).toBe('outward');
    edit(editor,'direction','invalid'); expect(editor._draftConfig.markers[0].direction).toBe('inward');
  });
  it('retains echo identities/expansion, resetting them only on foreign replacement', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: '25%' }] });
    const id = editor._getGenericMarkerUiIds(root,1)[0]; editor._expandedGenericMarkerUiIds.add(id);
    edit(editor,'label-text','Edited'); const echo = editor._cleanupEditorEmittedConfig(editor._cloneDeep(editor._draftConfig)); editor.setConfig(echo);
    expect(editor._getGenericMarkerUiIds(root,1)[0]).toBe(id); expect(editor._expandedGenericMarkerUiIds.has(id)).toBe(true);
    editor.setConfig({ markers: [{ at: '50%' }] }); expect(editor._getGenericMarkerUiIds(root,1)[0]).not.toBe(id); expect(editor._expandedGenericMarkerUiIds.size).toBe(0);
  });
  it('inherits complete marker lists; empty entity overrides clear all inherited markers', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: '25%', future: true }], entities: ['sensor.a'] });
    expect(editor._getGenericMarkersSummary(row)).toBe('Inherited');
    editor._setGenericMarkerList(row, editor._getGenericMarkers(row)); expect(editor._getGenericMarkersSummary(row)).toBe('1 reference marker');
    editor._setGenericMarkerList(row, []); expect(editor._getGenericMarkers(row)).toEqual([]);
  });
  it('standalone emit cleanup retains unknown keys while dropping defaults, label unit and legacy decimal', () => {
    const editor = createEditor({ source }); editor.setConfig({ markers: [{ at: { fixed: '25', entity: ' ', future: true }, show_marker: true, lane: 'below', shape: 'circle', direction: 'inward', color: '#888', future: true, label: { show: false, show_value: true, show_unit: true, decimal: '2', unit: 'W', future: true } }] });
    expect(editor._cleanupGenericMarkersForEmit(editor._cloneDeep(editor._draftConfig)).markers[0]).toEqual({ at: { fixed: 25, future: true }, future: true, label: { precision: 2, future: true } });
    // Whole-config cleanup refuses changes whose runtime meaning differs.
    expect(editor._cleanupEditorEmittedConfig(editor._cloneDeep(editor._draftConfig))).toEqual(editor._draftConfig);
  });
});
