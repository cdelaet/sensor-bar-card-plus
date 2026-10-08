const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source = 'src', width = 360, nested = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({width,nested}) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const config = { type:'custom:sensor-bar-card-plus-feature', bar:{fill_style:'bands',animated:false,segments:[{from:0,color:'red'},{from:50,color:'orange'}],gradient_stops:[{pos:0,color:'#abc'}]},
      target:{at:'75%',label:{show:true,text:'Limit'}},baseline:{at:{percent:35,future:true}},peak:{enabled:true},floor:{enabled:true},markers:[{at:25,label:{text:'First'}},{at:'75%'}],future:{keep:true,unset:undefined} };
    window.__uxEvents=[];window.__uxOriginal=structuredClone(config);
    editor.addEventListener('config-changed',e=>{window.__uxEvents.push(structuredClone(e.detail.config));editor.setConfig(e.detail.config);});
    editor.setConfig(config);editor.context={entity_id:'sensor.parent'};editor.hass={states:{}};
    const host=document.querySelector('#mount');host.style.width=`${width}px`;
    if(nested){host.style.height='500px';host.style.overflow='auto';}
    const before=document.createElement('div');before.style.height='850px';host.append(before,editor);
    const after=document.createElement('div');after.style.height='1200px';host.append(after);await editor.updateComplete;
  },{width,nested});
  return page.locator('sensor-bar-card-plus-feature-editor');
}
async function openReferences(editor) {
  const group=editor.locator('#card-group-generic-markers');
  if(await group.count())await group.click();
}
async function around(control) { await control.evaluate(el=>el.scrollIntoView({block:'center'})); }
async function scroll(page,nested) { return page.evaluate(nested=>nested?document.querySelector('#mount').scrollTop:window.scrollY,nested); }
async function inView(control,nested) {
  return control.evaluate((el,nested)=>{const r=el.getBoundingClientRect(),host=document.querySelector('#mount').getBoundingClientRect();const top=nested?host.top:0,bottom=nested?host.bottom:innerHeight;return r.bottom>top&&r.top<bottom;},nested);
}
for(const source of ['src','dist'])for(const nested of [false,true])test(`Reference scroll ${source} ${nested?'dialog':'page'}: expand/fold/add remains around interaction`,async({page})=>{
  const editor=await mount(page,source,240,nested);await openReferences(editor);
  const toggle=editor.locator('.generic-marker-toggle').first();await around(toggle);
  const before=await scroll(page,nested);expect(before).toBeGreaterThan(300);
  await toggle.evaluate(el=>window.__uxToggle=el);await toggle.click();
  await expect(editor.locator('.generic-marker-item').first()).toHaveAttribute('data-expanded','true');
  expect(await toggle.evaluate(el=>el===window.__uxToggle)).toBe(true);
  expect(await scroll(page,nested)).toBeGreaterThan(before/2);expect(await inView(toggle,nested)).toBe(true);

  await toggle.click();await expect(editor.locator('.generic-marker-item').first()).toHaveAttribute('data-expanded','false');expect(await scroll(page,nested)).toBeGreaterThan(before/2);expect(await inView(toggle,nested)).toBe(true);
  expect(await page.evaluate(()=>window.__uxEvents)).toHaveLength(0);
  const add=editor.locator('[data-action="add-generic-marker"]');await around(add);const atAdd=await scroll(page,nested);await add.click();
  const last=editor.locator('.generic-marker-item').last();await expect(last).toHaveAttribute('data-expanded','true');
  expect(await scroll(page,nested)).toBeGreaterThan(atAdd/2);expect(await inView(last.locator('.generic-marker-toggle'),nested)).toBe(true);expect(await page.evaluate(()=>window.__uxEvents)).toHaveLength(1);await expect(last.locator('.generic-marker-toggle')).toBeFocused();
});
for(const source of ['src','dist'])for(const width of [360,240])test(`Canonical Feature UX ${source} ${width}px: filtered order, summaries, disclosures, edit/echo and containment`,async({page})=>{
 const editor=await mount(page,source,width);
 const canonical=await editor.evaluate(el=>{
  const standalone=document.createElement('sensor-bar-card-plus-editor');standalone.setConfig({...el._config,type:'custom:sensor-bar-card-plus',entities:['sensor.parent']});document.querySelector('#mount').append(standalone);
  const headings=root=>Array.from(root.querySelectorAll('.editor > .section > .section-head > h3')).map(n=>n.textContent.trim());
  const groups=root=>Array.from(root.querySelectorAll('.card-subgroup')).map(n=>({group:n.dataset.group,title:n.querySelector('.override-group-title').textContent,summary:n.querySelector('.override-group-summary').textContent}));
  const result={standalone:headings(standalone.shadowRoot).filter(n=>!['Basics','Layout'].includes(n)),feature:headings(el.shadowRoot),groups:groups(standalone.shadowRoot),featureGroups:groups(el.shadowRoot)};standalone.remove();return result;
 });
 expect(canonical.feature).toEqual(canonical.standalone);expect(canonical.featureGroups).toEqual(canonical.groups);
 await expect(editor.locator('.card-subgroup[data-expanded="true"]')).toHaveCount(0);expect(await page.evaluate(()=>window.__uxEvents)).toHaveLength(0);
 await expect(editor).toHaveScreenshot(`feature-ux-initial-${width}.png`);
 for(const group of canonical.groups){const button=editor.locator(`#card-group-${group.group}`);await button.evaluate(el=>window.__uxDisclosure=el);await button.click();await expect(button).toHaveAttribute('aria-expanded','true');expect(await button.evaluate(el=>el===window.__uxDisclosure)).toBe(true);await button.press('Enter');await expect(button).toHaveAttribute('aria-expanded','false');}
 expect(await page.evaluate(()=>window.__uxEvents)).toHaveLength(0);
 for(const [group,id,value] of [['marker-target','target-percent','60'],['marker-peak','peak-label-text','High'],['marker-floor','floor-label-text','Low'],['baseline','baseline-percent','40']]){
  const button=editor.locator(`#card-group-${group}`);await button.click();const control=editor.locator(`#${id}`);await control.fill(value);await expect(control).toBeFocused();await expect(button).toHaveAttribute('aria-expanded','true');
  await editor.evaluate(async el=>{el.setConfig(el._config);el.hass={states:{}};el.context={entity_id:'sensor.changed'};await el.updateComplete;});await expect(button).toHaveAttribute('aria-expanded','true');await expect(control).toHaveValue(value);
 }
 await openReferences(editor);await editor.locator('.generic-marker-toggle').first().click();await editor.locator('[data-kind="generic-marker-label-text"]').first().fill('Changed');
 await expect(editor.locator('.generic-marker-item').first()).toHaveAttribute('data-expanded','true');
 await page.mouse.move(0,0);
 const markers=editor.locator('.section').filter({has:page.getByRole('heading',{name:'Markers',exact:true})});await expect(markers).toHaveScreenshot(`feature-ux-markers-${width}.png`);
 const bar=editor.locator('.section').filter({has:page.getByRole('heading',{name:'Bar Appearance',exact:true})});await expect(bar).toHaveScreenshot(`feature-ux-bar-${width}.png`);
 expect(await editor.evaluate(el=>Array.from(el.shadowRoot.querySelectorAll('.override-group-toggle')).every(node=>{const r=node.getBoundingClientRect(),host=el.getBoundingClientRect();return r.left>=host.left-1&&r.right<=host.right+1;}))).toBe(true);
 const saved=await editor.evaluate(el=>structuredClone(el._config));expect(saved.future).toEqual({keep:true,unset:undefined});expect(saved.bar).toEqual(await page.evaluate(()=>window.__uxOriginal.bar));expect(saved.entity).toBeUndefined();
 const before=await page.evaluate(()=>window.__uxEvents.length);await editor.evaluate(async el=>{el.setConfig({...el._config,future:{keep:'foreign'}});await el.updateComplete;});await expect(editor.locator('#card-group-marker-target')).toHaveAttribute('aria-expanded','true');await expect(editor.locator('.generic-marker-item').first()).toHaveAttribute('data-expanded','false');expect(await page.evaluate(()=>window.__uxEvents.length)).toBe(before);
});
