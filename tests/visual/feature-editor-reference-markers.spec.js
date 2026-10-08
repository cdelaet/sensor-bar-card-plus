const { expandFeatureGroups, featureGroup } = require('./feature-editor-test-utils.cjs');
const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source, width, empty = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({width,empty}) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const config = empty ? { type:'custom:sensor-bar-card-plus-feature' } : { type:'custom:sensor-bar-card-plus-feature', future:true,
      markers:[{ at:25, show_marker:false, shape:'pin', lane:'above', direction:'outward', color:'var(--accent-color)', future:{keep:true}, label:{show:true,text:'Reference energy',entity:'sensor.label',decimal:1,show_value:true,show_unit:true,future:{keep:true}} },
        { at:{entity:'sensor.reference',value:50,future:{keep:true}}, shape:'arrow', future:{keep:true}, label:{show:true,text:'Other',entity:'sensor.other'} },
        { at:'75%', lane:'above', shape:'diamond', future:{keep:true} }],
      scale:{min:0,max:100}, baseline:{at:'50%',future:true},target:{at:'70%',future:true},peak:{enabled:true,reset:'daily',future:true},floor:{enabled:true,future:true},formatting:{unit:'W',decimal:1},
      bar:{needle:true,animated:false,fill_style:'gradient',segments:[{from:50,color:'red'},{from:0,color:'blue'}],gradient_stops:[{pos:100,color:'red'},{pos:0,color:'blue'}]} };
    window.__referenceOriginal=structuredClone(config);window.__referenceEvents=[];
    editor.addEventListener('config-changed',event=>{window.__referenceEvents.push(structuredClone(event.detail.config));editor.setConfig(event.detail.config);});
    editor.setConfig(config);editor.context={entity_id:'sensor.parent'};editor.hass={states:{}};
    document.querySelector('#mount').style.width=`${width}px`;document.querySelector('#mount').append(editor);await editor.updateComplete;
  },{width,empty});
  const editor = page.locator('sensor-bar-card-plus-feature-editor');
  await expandFeatureGroups(editor);
  return editor;
}
const saved = editor => editor.evaluate(el=>structuredClone(el._config));
const rows = editor => editor.locator('.generic-marker-item');
const field = (row,name) => row.locator(`[data-kind="generic-marker-${name}"]`);
for(const source of ['src','dist']) for(const width of [360,240]) test(`Feature Reference markers ${width}px (${source}): sources/labels/reorder/echo/preservation`,async({page})=>{
  const editor=await mount(page,source,width),original=await saved(editor);
  expect(await page.evaluate(()=>window.__referenceEvents)).toHaveLength(0);
  const section=featureGroup(editor,'generic-markers');
  await rows(editor).first().getByRole('button',{name:/Reference marker 1/}).click();
  await page.mouse.move(0, 0);
  await expect(section).toHaveScreenshot(`feature-reference-markers-${width}.png`);
  expect(await editor.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(await section.evaluate(el=>Array.from(el.querySelectorAll('input,select,button')).filter(node=>node.getBoundingClientRect().width>0).every(node=>node.getBoundingClientRect().right<=el.getBoundingClientRect().right+1&&node.getBoundingClientRect().left>=el.getBoundingClientRect().left-1))).toBe(true);
  let row=rows(editor).first();const id=await row.getAttribute('data-marker-ui-id');
  await expect(field(row,'fixed')).toHaveValue('25');await expect(field(row,'show-marker')).not.toBeChecked();
  await expect(field(row,'shape').locator('option')).toHaveText(['circle','diamond','triangle','chevron','arrow','pin']);
  for(const shape of ['circle','diamond','triangle','chevron','arrow','pin']) await field(row,'shape').selectOption(shape);
  for(const direction of ['inward','outward']) await field(row,'direction').selectOption(direction);
  for(const lane of ['below','above']) await field(row,'lane').selectOption(lane);
  await field(row,'show-marker').check();await field(row,'show-marker').uncheck();
  await field(row,'color-text-fallback').fill('var(--primary-color)');await expect(field(row,'color-text-fallback')).toBeFocused();
  const text=field(row,'label-text');await text.evaluate(node=>{window.__referenceTextNode=node;});
  const count=await page.evaluate(()=>window.__referenceEvents.length);await text.fill('New limit');await expect(text).toBeFocused();
  expect(await text.evaluate(node=>node===window.__referenceTextNode)).toBe(true);expect(await page.evaluate(()=>window.__referenceEvents.length)).toBe(count+1);
  await field(row,'label-show').uncheck();await field(row,'label-show-value').uncheck();await field(row,'label-show-unit').uncheck();
  await field(row,'label-precision').fill('0');await expect(field(row,'label-precision')).toBeFocused();
  await row.getByLabel('Label content entity',{exact:true}).fill('sensor.changed_label');
  expect((await saved(editor)).markers[0].label).toEqual({show:false,text:'New limit',entity:'sensor.changed_label',show_value:false,show_unit:false,precision:0,future:{keep:true}});
  await row.getByLabel('Label content entity',{exact:true}).fill('');expect((await saved(editor)).markers[0].label.entity).toBeUndefined();
  await field(row,'source-mode').focus();await field(row,'source-mode').selectOption('entity-fallback');await expect(field(row,'source-mode')).toBeFocused();
  await expect(field(row,'fallback')).toHaveValue('25');await row.getByLabel('Reference marker entity',{exact:true}).fill('sensor.changed_anchor');
  await field(row,'fallback').fill('30');await expect(field(row,'fallback')).toBeFocused();expect((await saved(editor)).markers[0].at).toEqual({fixed:30,entity:'sensor.changed_anchor'});
  await field(row,'source-mode').focus();await field(row,'source-mode').selectOption('percent');await field(row,'percent').fill('0');expect((await saved(editor)).markers[0].at).toBe('0%');
  await field(row,'percent').fill('100');await expect(field(row,'percent')).toBeFocused();expect((await saved(editor)).markers[0].at).toBe('100%');
  const before=await saved(editor);expect(before.markers.slice(1)).toEqual(original.markers.slice(1));
  for(const key of ['scale','bar','baseline','target','peak','floor','formatting','future'])expect(before[key]).toEqual(original[key]);
  const echoCount=await page.evaluate(()=>window.__referenceEvents.length);
  await editor.evaluate(async el=>{el.context={entity_id:'sensor.changed'};el.hass={states:{}};el.setConfig(el._config);await el.updateComplete;});
  expect(await page.evaluate(()=>window.__referenceEvents.length)).toBe(echoCount);await expect(field(row,'percent')).toBeFocused();
  await row.getByRole('button',{name:'Move marker down'}).click();
  await expect(rows(editor).nth(1)).toHaveAttribute('data-marker-ui-id',id);await expect(rows(editor).nth(1)).toHaveAttribute('data-expanded','true');
  await expect(rows(editor).nth(1).getByRole('button',{name:'Move marker down'})).toBeFocused();
  expect((await saved(editor)).markers).toEqual([before.markers[1],before.markers[0],before.markers[2]]);
  await section.getByRole('button',{name:'Add reference marker'}).click();await expect(rows(editor)).toHaveCount(4);await expect(rows(editor).last()).toHaveAttribute('data-expanded','true');
  expect((await saved(editor)).markers[3]).toEqual({at:{fixed:50}});
  await rows(editor).first().getByRole('button',{name:'Remove marker'}).click();await expect(rows(editor)).toHaveCount(3);
  expect((await saved(editor)).markers[0]).toEqual(before.markers[0]);await expect(rows(editor).first()).toHaveAttribute('data-marker-ui-id',id);
  const markers=(await saved(editor)).markers;
  await editor.locator('#formatting-unit').fill('kW');await editor.locator('#bar-needle-mode').selectOption('disabled');await editor.locator('#baseline-mode').selectOption('enabled');await editor.locator('#target-mode').selectOption('disabled');await editor.locator('#peak-show').uncheck();await editor.locator('#floor-show').uncheck();
  await editor.locator('#scale-min').fill('5');await editor.locator('#bar-fill-style').selectOption('bands');
  await editor.locator('input[data-kind="segment-color"]').first().evaluate(el=>{el.value='#123456';el.dispatchEvent(new Event('input',{bubbles:true}));});
  expect((await saved(editor)).markers).toEqual(markers);expect((await saved(editor)).bar.animated).toBe(false);expect((await saved(editor)).entity).toBeUndefined();
});
for(const source of ['src','dist']) test(`Feature Reference markers (${source}): empty add/remove, invalid input and foreign draft replacement`,async({page})=>{
  const editor=await mount(page,source,240,true);await expect(rows(editor)).toHaveCount(0);expect(await page.evaluate(()=>window.__referenceEvents)).toHaveLength(0);
  await editor.getByRole('button',{name:'Add reference marker'}).click();const row=rows(editor).first();await expect(row).toHaveAttribute('data-expanded','true');
  await field(row,'label-text').fill('Local');await field(row,'label-precision').fill('2');
  const beforeInvalid = await page.evaluate(()=>window.__referenceEvents.length);
  await field(row,'label-precision').fill('-1');await expect(field(row,'label-precision')).toBeFocused();
  expect((await saved(editor)).markers[0].label.precision).toBe(2);
  expect(await page.evaluate(()=>window.__referenceEvents.length)).toBe(beforeInvalid);
  await editor.evaluate(async el=>{el.setConfig(el._config);el.context={entity_id:'sensor.echo'};await el.updateComplete;});await expect(field(row,'label-precision')).toHaveValue('-1');
  await field(row,'fixed').fill('');expect((await saved(editor)).markers[0].at).toEqual({fixed:50});
  await field(row,'fixed').press('Tab');expect((await saved(editor)).markers[0].at).toBeUndefined();
  const oldId=await row.getAttribute('data-marker-ui-id');
  await editor.evaluate(async el=>{el.setConfig({type:'custom:sensor-bar-card-plus-feature',markers:[{at:'35%',label:{text:'Foreign'}}]});await el.updateComplete;});
  expect(await row.getAttribute('data-marker-ui-id')).not.toBe(oldId);await expect(row).toHaveAttribute('data-expanded','false');
  await row.getByRole('button',{name:/Reference marker 1/}).press('Enter');await expect(row).toHaveAttribute('data-expanded','true');await expect(row.getByRole('button',{name:/Reference marker 1/})).toBeFocused();
  await expect(field(row,'label-text')).toHaveValue('Foreign');await expect(field(row,'percent')).toHaveValue('35');
  await row.getByRole('button',{name:'Remove marker'}).click();expect((await saved(editor)).markers).toEqual([]);
});
for(const source of ['src','dist']) test(`Feature Reference markers (${source}): HA picker association survives reorder and edits independent label entity`,async({page})=>{
  await page.addInitScript(()=>{customElements.define('ha-entity-picker',class extends HTMLElement{});});
  const editor=await mount(page,source,240);let row=rows(editor).nth(1);await row.getByRole('button',{name:/Reference marker 2/}).click();
  await row.getByRole('button',{name:'Move marker up'}).click();row=rows(editor).first();
  const picker=field(row,'label-entity'),anchor=field(row,'entity'),before=await saved(editor);
  expect(await picker.evaluate(el=>el.allowCustomEntity&&!!el.hass&&el.label==='Label content entity')).toBe(true);
  await picker.evaluate(el=>{el.dispatchEvent(new CustomEvent('value-changed',{bubbles:true,composed:true,detail:{value:'sensor.changed_label'}}));});
  const expected=structuredClone(before);expected.markers[0].label.entity='sensor.changed_label';expect(await saved(editor)).toEqual(expected);
  await picker.evaluate(el=>{el.dispatchEvent(new CustomEvent('value-changed',{bubbles:true,composed:true,detail:{value:undefined}}));});delete expected.markers[0].label.entity;expect(await saved(editor)).toEqual(expected);
  await anchor.evaluate(el=>{el.dispatchEvent(new CustomEvent('value-changed',{bubbles:true,composed:true,detail:{value:'sensor.changed_anchor'}}));});
  expected.markers[0].at.entity='sensor.changed_anchor';expect(await saved(editor)).toEqual(expected);
  await field(row,'fallback').fill('55');expect((await saved(editor)).markers[0].at).toEqual({...before.markers[0].at,entity:'sensor.changed_anchor',value:55});
});
