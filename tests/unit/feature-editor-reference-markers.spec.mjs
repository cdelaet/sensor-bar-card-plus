import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const root = { type: 'card' }, type = 'custom:sensor-bar-card-plus-feature';
const meta = () => ({ future: { values: [undefined, { keep: true }], unset: undefined }, unset: undefined });
const marker = () => ({ at: { entity: 'sensor.reference', value: 25, ...meta() }, show_marker: false, lane: 'above', shape: 'pin', direction: 'outward', color: 'red',
  label: { show: true, text: 'Limit', entity: 'sensor.information', show_value: false, show_unit: false, decimal: 2, unit: 'unsupported', ...meta() }, ...meta() });
const raw = () => ({ type, markers: [marker(), marker()], ...meta(),
  scale: { min: { fixed: 0, future: true }, max: 100 }, bar: { color: 'blue', needle: true, animated: false, fill_style: 'gradient', segments: [{ from: 50, color: 'red' }, { from: 0, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }] },
  baseline: { at: '50%', ...meta() }, target: { at: '75%', ...meta() }, peak: { enabled: true, reset: { unsupported: true }, ...meta() }, floor: { enabled: true, ...meta() }, formatting: { unit: 'W', decimal: 1 } });
async function setup(source, config = raw(), withEntityPicker = false) {
  const classes = loadCardClass({ source, withEntityPicker }), editor = new classes.featureEditor(), events = [];
  editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
  editor.setConfig(config); editor.context = { entity_id: 'sensor.parent' }; editor.hass = { states: {} }; await editor.updateComplete;
  return { editor, events, section: editor._referenceMarkersSection, classes };
}
async function field(editor, suffix, value, index = 0, eventType = 'change') {
  const control = editor.shadowRoot.querySelectorAll(`input[data-kind="generic-marker-${suffix}"]`)[index]
    ?? editor.shadowRoot.querySelectorAll(`select[data-kind="generic-marker-${suffix}"]`)[index]
    ?? editor.shadowRoot.querySelectorAll(`ha-entity-picker[data-kind="generic-marker-${suffix}"]`)[index];
  expect(control).toBeTruthy();
  if (control.type === 'checkbox') control.checked = value; else control.value = value;
  editor._handleField({ type: eventType, target: control, ...(eventType === 'value-changed' ? { detail: { value } } : {}) }); await editor.updateComplete;
}
async function action(section, kind, index = 0) {
  section.handleClick({ dataset: { action: `${kind}-generic-marker`, scopeType: 'card', markerIndex: String(index) } });
  await Promise.resolve();
}
for (const source of ['src', 'dist']) describe(`Feature Reference markers (${source})`, () => {
  for (const at of [25, '25%', 'sensor.reference', { fixed: 25, ...meta() }, { entity: 'sensor.reference', fixed: 25, ...meta() }, { entity: 'sensor.reference', value: 25, ...meta() }]) it(`opens and preserves raw ${JSON.stringify(at)} through context/unrelated edits`, async () => {
    const config = raw(); config.markers[0].at = at;
    const { editor, events } = await setup(source, config);
    expect(editor._config).toEqual(config); expect(events).toHaveLength(0);
    editor.context = { entity_id: 'sensor.changed' }; editor.hass = { states: {} }; await editor.updateComplete;
    expect(editor._config).toEqual(config);
    await field(editor, 'label-text', 'Changed'); expect(editor._config.markers[0].at).toEqual(at);
    editor._handleField({ type: 'input', target: { dataset: { field: 'formatting-unit' }, value: 'kW' } }); await editor.updateComplete;
    expect(editor._config.markers[0].at).toEqual(at); expect(editor._config).not.toHaveProperty('entity');
  });
  for (const [fieldName, value, path, stored] of [
    ['lane','below',['lane'],'below'], ['shape','circle',['shape'],'circle'], ['direction','inward',['direction'],'inward'], ['color','#123456',['color'],'#123456'],
    ['show-marker',true,['show_marker'],undefined], ['label-show',false,['label','show'],false], ['label-text',' New  limit ',['label','text'],'New limit'],
    ['label-entity','sensor.changed',['label','entity'],'sensor.changed'], ['label-show-value',true,['label','show_value'],true], ['label-show-unit',true,['label','show_unit'],true], ['label-precision','0',['label','precision'],0],
  ]) it(`patches only ${fieldName}, keeps duplicate rows, source/label/root metadata and every other section`, async () => {
    const config = raw(), { editor, events } = await setup(source, config), ids = editor._referenceMarkersSection._getGenericMarkerUiIds(root,2).slice();
    const untouched = editor._config.markers[1];
    await field(editor, fieldName, value);
    expect(editor._config.markers[1]).toBe(untouched);
    const expected = structuredClone(config); let node = expected.markers[0]; for (const key of path.slice(0,-1)) node = node[key];
    if (stored === undefined) delete node[path.at(-1)]; else node[path.at(-1)] = stored;
    if (fieldName === 'label-precision') delete expected.markers[0].label.decimal;
    expect(editor._config).toEqual(expected); expect(events).toHaveLength(1);
    expect(Object.hasOwn(editor._config.markers[0].label.future,'unset')).toBe(true);
    expect(editor._referenceMarkersSection._getGenericMarkerUiIds(root,2)).toEqual(ids);
    editor.setConfig(events[0]); await editor.updateComplete; expect(events).toHaveLength(1);
  });
  for (const shape of ['circle','diamond','triangle','chevron','arrow','pin']) it(`edits supported shape ${shape} without Target restrictions`, async () => {
    const { editor } = await setup(source); await field(editor,'shape',shape); expect(editor._config.markers[0].shape).toBe(shape);
  });
  for (const [sourcePart,value] of [['fallback','30'],['entity','sensor.changed'],['entity',''],['fallback','']]) it(`owns source ${sourcePart}=${value} and keeps value alias/metadata appropriately`, async () => {
    const config = raw(), { editor } = await setup(source,config); await field(editor,sourcePart,value);
    const expected = structuredClone(config);
    if (sourcePart === 'fallback') { if (value === '') { delete expected.markers[0].at.fixed; delete expected.markers[0].at.value; } else expected.markers[0].at.value = 30; }
    else if (value === '') delete expected.markers[0].at.entity; else expected.markers[0].at.entity = value;
    expect(editor._config).toEqual(expected);
  });
  it('edits scalar numeric/entity sources in place and promotes minimally for entity fallback', async () => {
    const config = raw(); config.markers[0].at = 25;
    const { editor } = await setup(source,config); expect(editor._referenceMarkersSection._getGenericMarkerSource(editor._config.markers[0])).toEqual({ mode:'fixed',fixed:25 });
    await field(editor,'fixed','30'); expect(editor._config.markers[0].at).toBe(30);
    await field(editor,'source-mode','entity-fallback'); expect(editor._config.markers[0].at).toEqual({ fixed:30,entity:'' });
    await field(editor,'entity','sensor.changed'); expect(editor._config.markers[0].at).toEqual({ fixed:30,entity:'sensor.changed' });
    const replacement = raw(); replacement.markers[0].at = 'sensor.reference'; editor.setConfig(replacement); await editor.updateComplete;
    await field(editor,'entity','sensor.changed'); expect(editor._config.markers[0].at).toBe('sensor.changed');
  });
  it('mode changes own source fields only, preserve object metadata, and percentage mode uses supported string syntax', async () => {
    const config = raw(), { editor } = await setup(source,config);
    await field(editor,'source-mode','fixed'); expect(editor._config.markers[0].at).toEqual({ value:25,...meta() });
    await field(editor,'source-mode','entity-fallback'); expect(editor._config.markers[0].at).toEqual({ value:25,entity:'',...meta() });
    await field(editor,'source-mode','entity'); expect(editor._config.markers[0].at).toEqual({ entity:'',...meta() });
    await field(editor,'source-mode','percent'); expect(editor._config.markers[0].at).toBe('50%');
    for (const value of ['0','100','101','']) { await field(editor,'percent',value); expect(editor._config.markers[0].at).toBe(value === '' ? null : `${value}%`); }
    expect(editor._config.markers[0].label).toEqual(config.markers[0].label); expect(editor._config.markers[1]).toEqual(config.markers[1]);
  });
  it('clears only label entity/text/precision and its decimal alias; label-only anchors remain', async () => {
    const config = raw(), { editor } = await setup(source,config);
    await field(editor,'label-entity',''); await field(editor,'label-text',''); await field(editor,'label-precision','-1');
    const expected = structuredClone(config); for (const key of ['entity','text','precision','decimal']) delete expected.markers[0].label[key];
    expect(editor._config).toEqual(expected); expect(editor._config.markers[0].show_marker).toBe(false);
  });
  it('add/remove/reorder preserve complete raw rows, identities, expansion and independence; no maximum', async () => {
    const config = raw(), { editor,section,events } = await setup(source,config), ids = section._getGenericMarkerUiIds(root,2).slice();
    section._expandedGenericMarkerUiIds.add(ids[0]);
    await action(section,'move-generic-marker',0); // Unrecognized action does not write.
    expect(events).toHaveLength(0);
    section.handleClick({dataset:{ action:'move-generic-marker-down',markerIndex:'0' }}); await editor.updateComplete;
    expect(section._getGenericMarkerUiIds(root,2)).toEqual([ids[1],ids[0]]); expect(section._expandedGenericMarkerUiIds.has(ids[0])).toBe(true);
    for (let i=0;i<7;i++) { await action(section,'add'); await editor.updateComplete; }
    expect(editor._config.markers).toHaveLength(9); expect(editor._config.markers.slice(0,2)).toEqual(config.markers); expect(editor._config.markers[8]).toEqual({at:{fixed:50}});
    await action(section,'remove',1); await editor.updateComplete;
    expect(editor._config.markers[0]).toEqual(config.markers[1]); expect(section._getGenericMarkerUiIds(root,8)).not.toContain(ids[0]); expect(section._expandedGenericMarkerUiIds.has(ids[0])).toBe(false);
    const expected = structuredClone(config); expected.markers = editor._config.markers; expect(editor._config).toEqual(expected);
    const old = section._getGenericMarkerUiIds(root,8).slice(); editor.setConfig({type,markers:[{at:10}]}); await editor.updateComplete;
    expect(section._getGenericMarkerUiIds(root,1)[0]).not.toBe(old[0]); expect(section._expandedGenericMarkerUiIds.size).toBe(0);
  });
  it('HA pickers retain index association/hass, ignore internal events, edit/clear independent label entities only', async () => {
    const config = raw(), { editor,events } = await setup(source,config,true);
    const picker = editor.shadowRoot.querySelectorAll('ha-entity-picker[data-kind="generic-marker-label-entity"]')[1];
    expect(picker.hass).toBe(editor.hass); expect(picker.label).toBe('Label content entity'); expect(picker.allowCustomEntity).toBe(true);
    await field(editor,'label-entity','sensor.changed',1,'input'); expect(events).toHaveLength(0);
    await field(editor,'label-entity','sensor.changed',1,'value-changed');
    const expected = structuredClone(config); expected.markers[1].label.entity = 'sensor.changed'; expect(editor._config).toEqual(expected);
    await field(editor,'label-entity',undefined,1,'value-changed'); delete expected.markers[1].label.entity; expect(editor._config).toEqual(expected);
    await field(editor,'entity','sensor.anchor',0,'value-changed'); expect(editor._config.markers[0].at.entity).toBe('sensor.anchor'); expect(editor._config.markers[0].label).toEqual(config.markers[0].label);
  });
  it('every existing Feature section and palette item edit preserves raw markers, including label-only/config aliases', async () => {
    const config = raw(), {editor}=await setup(source,config);
    for (const [fieldName,value] of [['scale-min','5'],['bar-color','#123456'],['bar-needle-mode','disabled'],['baseline-mode','enabled'],['target-mode','disabled'],['peak-show',false],['floor-show',false],['formatting-unit','kW']]) {
      const control = editor.shadowRoot.querySelector(`[data-field="${fieldName}"]`); if(control.type==='checkbox') control.checked=value;else control.value=value;
      editor._handleField({type:'change',target:control}); await editor.updateComplete;
    }
    for (const kind of ['gradient','segment']) {
      const control=editor.shadowRoot.querySelectorAll(`input[data-kind="${kind}-color"]`)[0];
      if(control) {control.value='#123456';editor._handleField({type:'input',target:control});await editor.updateComplete;}
      if(kind==='gradient') {const select=editor.shadowRoot.querySelector('#bar-fill-style');select.value='bands';editor._handleField({type:'change',target:select});await editor.updateComplete;}
    }
    expect(editor._config.markers).toEqual(config.markers); expect(editor._config.bar.animated).toBe(false);
  });
  it('ignores stale native blur/change events during foreign replacement and reorder', async () => {
    const {editor, section, events} = await setup(source);
    const ids = section._getGenericMarkerUiIds(root,2).slice();
    const stale = { dataset: { kind:'generic-marker-fallback', markerIndex:'0' }, value:'', closest() { return {dataset:{markerUiId:ids[0]}}; } };
    editor.setConfig({type,markers:[{at:'35%',label:{text:'Foreign'}}]}); await editor.updateComplete;
    editor._handleField({type:'change',target:stale}); await editor.updateComplete;
    expect(editor._config.markers[0].at).toBe('35%'); expect(events).toHaveLength(0);
    editor.setConfig(raw()); await editor.updateComplete;
    const current = section._getGenericMarkerUiIds(root,2).slice();
    section.handleClick({dataset:{action:'move-generic-marker-down',markerIndex:'0'}}); await editor.updateComplete;
    stale.closest = () => ({dataset:{markerUiId:current[0]}});
    const before = structuredClone(editor._config), count = events.length;
    editor._handleField({type:'change',target:stale}); await editor.updateComplete;
    expect(editor._config).toEqual(before); expect(events).toHaveLength(count);
  });
  it('uses the same section/row HTML in both hosts without giving independent entities to built-in labels', async () => {
    const { editor,classes,section } = await setup(source);
    const standalone = new classes.editor(); standalone.setConfig(raw()); expect(section.constructor).toBe(standalone._referenceMarkersSection.constructor);
    expect(editor.shadowRoot.innerHTML).toContain(section.render(root));
    for(const key of ['target','peak','floor']) expect(editor.shadowRoot.innerHTML).not.toContain(`${key}-label-entity`);
  });
});
it('source/dist and picker/fallback whole-Feature HTML remain identical for representative Reference Marker configurations', async () => {
  for(const withEntityPicker of [false,true]) for(const config of [{type},raw(),{type,markers:[{at:25},{at:'25%',show_marker:false,label:{entity:'sensor.label'}}]}]) {
    const a=await setup('src',config,withEntityPicker), b=await setup('dist',config,withEntityPicker);
    expect(a.editor.shadowRoot.innerHTML).toBe(b.editor.shadowRoot.innerHTML);
  }
});
