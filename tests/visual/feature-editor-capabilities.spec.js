const {test,expect}=require('@playwright/test');
const path=require('path');
const type='custom:sensor-bar-card-plus-feature';
async function mount(page,source,width=240){
 if(source==='dist')await page.route('**/src/sensor-bar-card-plus.js',route=>route.fulfill({path:path.resolve(__dirname,'../../dist/sensor-bar-card-plus.js'),contentType:'text/javascript'}));
 await page.goto('/tests/visual/fixtures/harness.html');
 await page.evaluate(async({width,type})=>{
  await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
  const editor=document.createElement('sensor-bar-card-plus-feature-editor');
  const config={type,future:{keep:true,unset:undefined},scale:{min:0,max:100},bar:{animated:false,fill_style:'band_gradient',color:'#123456',solid_fill:false,needle:{show:true,color:'#abcdef',future:true},segments:[{from:0,color:'var(--success-color)',future:{keep:true}},{from:50,color:'orange',future:{keep:true}},{from:80,color:'red',future:{keep:true}}],gradient_stops:[{pos:0,color:'#123456'},{pos:100,color:'#abcdef'}],future:{keep:true}},
   baseline:{at:{percent:35,future:{keep:true}},above:{color:'var(--success-color)'},below:{color:'rgb(100, 0, 0)'},future:{keep:true}},
   target:{at:'75%',shape:'triangle',direction:'outward',color:'#abcdef',label:{show:true,text:'Limit',precision:1},when_exceeded:{fill_color:'red'},future:{keep:true}},
   peak:{enabled:true,reset:'daily',color:'red'},floor:{enabled:true,color:'blue'},markers:[{at:'25%',color:'#abc',show_marker:false,label:{show:true,entity:'sensor.label'},future:{keep:true}}],formatting:{unit:'W'}};
  window.__capabilityEvents=[];window.__capabilityOriginal=structuredClone(config);
  editor.addEventListener('config-changed',e=>{window.__capabilityEvents.push(structuredClone(e.detail.config));editor.setConfig(e.detail.config);});
  editor.setConfig(config);editor.context={entity_id:'sensor.parent'};editor.hass={states:{}};
  const host=document.querySelector('#mount');host.style.width=`${width}px`;host.style.setProperty('--success-color','green');host.append(editor);await editor.updateComplete;
 },{width,type});return page.locator('sensor-bar-card-plus-feature-editor');
}
const saved=editor=>editor.evaluate(el=>structuredClone(el._config));
const section=(editor,page,name)=>editor.locator('.section').filter({has:page.getByRole('heading',{name,exact:true})});
async function end(editor,index,value){const control=editor.locator(`input[data-kind="segment-to"][data-index="${index}"]`);await control.fill(value);await control.press('Tab');return control;}
for(const source of ['src','dist'])for(const width of [360,240])test(`Feature capabilities ${source} ${width}px: combined edit/echo, Auto ends and native CSS drafts`,async({page})=>{
 const editor=await mount(page,source,width),original=await saved(editor),segments=section(editor,page,'Segments');
 expect(await page.evaluate(()=>window.__capabilityEvents)).toHaveLength(0);
 await expect(section(editor,page,'Bar Appearance')).toHaveScreenshot(`feature-capabilities-bar-${width}.png`);
 await expect(segments).toHaveScreenshot(`feature-capabilities-segments-${width}.png`);
 expect(await editor.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 expect(await segments.evaluate(el=>Array.from(el.querySelectorAll('input,button')).every(node=>node.getBoundingClientRect().right<=el.getBoundingClientRect().right+1))).toBe(true);
 await expect(editor.locator('#bar-animated')).not.toBeChecked();await editor.locator('#bar-animated').check();await expect(editor.locator('#bar-animated')).toBeFocused();expect((await saved(editor)).bar.animated).toBeUndefined();
 await editor.locator('#bar-fill-style').selectOption('bands');expect((await saved(editor)).bar.animated).toBeUndefined();await editor.locator('#bar-animated').uncheck();expect((await saved(editor)).bar.animated).toBe(false);
 const color=editor.locator('#segment-color-0-text-fallback');await color.evaluate(el=>window.__capabilityColorNode=el);await color.fill('var(');await expect(color).toBeFocused();
 const count=await page.evaluate(()=>window.__capabilityEvents.length);await editor.evaluate(async el=>{el.setConfig(el._config);el.context={entity_id:'sensor.changed'};el.hass={states:{}};await el.updateComplete;});
 expect(await page.evaluate(()=>window.__capabilityEvents.length)).toBe(count);await expect(color).toHaveValue('var(');await expect(color).toHaveAttribute('aria-invalid','true');expect(await color.evaluate(el=>el===window.__capabilityColorNode)).toBe(true);
 await color.fill('rgba(0, 100, 0, .5)');await expect(color).toBeFocused();expect((await saved(editor)).bar.segments[0].color).toBe('rgba(0, 100, 0, .5)');expect((await saved(editor)).bar.segments.every(row=>!Object.hasOwn(row,'to'))).toBe(true);
 await end(editor,0,'40');expect((await saved(editor)).bar.segments[0].to).toBe(40);await end(editor,0,'');expect(Object.hasOwn((await saved(editor)).bar.segments[0],'to')).toBe(false);
 await editor.locator('#target-source-mode').selectOption('percent');await editor.locator('#target-percent').fill('50');expect((await saved(editor)).target.at).toBe('50%');
 await editor.locator('#baseline-percent').fill('42.5');expect((await saved(editor)).baseline.at).toEqual({percent:42.5,future:{keep:true}});
 const config=await saved(editor);for(const key of ['peak','floor','markers','formatting','scale','future'])expect(config[key]).toEqual(original[key]);
 expect(config.target).toEqual({...original.target,at:'50%'});expect(config.baseline).toEqual({...original.baseline,at:{percent:42.5,future:{keep:true}}});
 expect(config.bar.gradient_stops).toEqual(original.bar.gradient_stops);expect(config.bar.needle).toEqual(original.bar.needle);expect(config.bar.segments.slice(1)).toEqual(original.bar.segments.slice(1));expect(config.entity).toBeUndefined();
 const after=await page.evaluate(()=>window.__capabilityEvents.length);await editor.evaluate(async el=>{el.setConfig(el._config);await el.updateComplete;});expect(await page.evaluate(()=>window.__capabilityEvents.length)).toBe(after);
});
for(const source of ['src','dist'])for(const key of ['target','baseline'])test(`Feature ${key} percentages ${source}: conversion, invalid draft, clear and foreign replacement`,async({page})=>{
 const editor=await mount(page,source),original=await saved(editor),mode=editor.locator(`#${key}-source-mode`),percent=editor.locator(`#${key}-percent`);
 for(const invalid of ['-1','101','']){
  const before=await saved(editor),count=await page.evaluate(()=>window.__capabilityEvents.length);await percent.fill(invalid);await expect(percent).toBeFocused();
  await editor.evaluate(async el=>{el.setConfig(el._config);el.context={entity_id:'sensor.changed'};await el.updateComplete;});expect(await saved(editor)).toEqual(before);expect(await page.evaluate(()=>window.__capabilityEvents.length)).toBe(count);await expect(percent).toHaveValue(invalid);
 }
 for(const value of ['0','100','35']){await percent.fill(value);expect((await saved(editor))[key].at).toEqual(key==='target'?`${value}%`:{percent:Number(value),future:{keep:true}});}
 await mode.focus();await mode.selectOption('fixed');await expect(mode).toBeFocused();await editor.locator(`#${key}-value`).fill('20');
 expect((await saved(editor))[key].at).toEqual(key==='target'?20:{fixed:20,future:{keep:true}});
 await mode.focus();await mode.selectOption('percent');expect((await saved(editor))[key].at).toEqual(key==='target'?'50%':{percent:50,future:{keep:true}});
 await mode.focus();await mode.selectOption('entity');await editor.getByLabel(`${key==='target'?'Target':'Baseline'} entity`,{exact:true}).fill('sensor.reference');expect((await saved(editor))[key].at).toEqual({entity:'sensor.reference',...(key==='baseline'?{future:{keep:true}}:{})});
 await mode.focus();await mode.selectOption('percent');await percent.fill('50');
 await editor.locator(`[data-action="${key}-clear-percent"]`).click();const cleared=(await saved(editor))[key];expect(cleared.at).toEqual(key==='target'?undefined:{future:{keep:true}});
 for(const name of Object.keys(original[key]).filter(name=>name!=='at'))expect(cleared[name]).toEqual(original[key][name]);
 await percent.fill('101');await editor.evaluate(async(el,key)=>{el.setConfig({type:'custom:sensor-bar-card-plus-feature',[key]:{at:'0%'}});await el.updateComplete;},key);await expect(percent).toHaveValue('0');
});
for(const source of ['src','dist'])test(`Feature CSS colors ${source}: all direct controls, raw text, keyboard, replacement and Gradient Stop boundary`,async({page})=>{
 const editor=await mount(page,source);await editor.locator('.generic-marker-toggle').click();
 const ids=['bar-color','bar-needle-color','baseline-above-color','baseline-below-color','target-color','target-above-fill-color','peak-color','floor-color','card-card-generic-marker-1-color'];
 for(const id of ids){
  const control=editor.locator(`#${id}-text-fallback`);expect(await control.getAttribute('aria-label')).toContain('CSS value');
  for(const color of ['#123456','#abc','red','rgb(1, 2, 3)','var(--warning-color)','  hsl(30, 100%, 50%)  ']){await control.fill(color);await expect(control).toBeFocused();await expect(control).toHaveAttribute('aria-invalid','false');}
  const before=await saved(editor),count=await page.evaluate(()=>window.__capabilityEvents.length);await control.fill('rgb(');await control.press('Tab');await expect(control).toHaveValue('rgb(');expect(await saved(editor)).toEqual(before);expect(await page.evaluate(()=>window.__capabilityEvents.length)).toBe(count);
  await control.fill('orange');await control.press('Tab');await expect(control).toHaveValue('orange');
  const toggle=id.startsWith('baseline-')?`${id}-enabled`:id==='target-above-fill-color'?'target-above-fill-enabled':null;
  if(toggle){await control.fill('  orange  ');const before=await saved(editor);await editor.locator(`#${toggle}`).uncheck();await editor.locator(`#${toggle}`).check();expect(await saved(editor)).toEqual(before);await expect(control).toHaveValue('  orange  ');}
 }
 const before=await saved(editor);expect(before.markers[0]).toEqual({...await page.evaluate(()=>window.__capabilityOriginal.markers[0]),color:'orange'});
 await editor.locator('#bar-color-text-fallback').fill('var(');await editor.evaluate(async el=>{el.setConfig({...el._config,bar:{...el._config.bar,color:'blue'}});await el.updateComplete;});await expect(editor.locator('#bar-color-text-fallback')).toHaveValue('blue');await expect(editor.locator('#bar-color-text-fallback')).toHaveAttribute('aria-invalid','false');
 await editor.locator('#bar-fill-style').selectOption('gradient');await expect(editor.locator('[data-kind="gradient-color-text-fallback"]')).toHaveCount(0);await expect(editor.locator('[data-kind="gradient-draft-color-text-fallback"]')).toHaveCount(0);
 expect((await saved(editor)).bar.gradient_stops).toEqual(before.bar.gradient_stops);
});
for(const source of ['src','dist'])test(`Feature automatic Segment draft ${source}: CSS validation, add/remove, ordering and echo`,async({page})=>{
 const editor=await mount(page,source),original=await saved(editor);
 await editor.locator('#segment-draft-from').fill('90');await editor.locator('#segment-draft-to').fill('');await editor.locator('#segment-draft-color-text-fallback').fill('var(');
 const add=editor.locator('[data-action="add-segment"]');await expect(add).toBeDisabled();expect(await page.evaluate(()=>window.__capabilityEvents.length)).toBe(0);
 await editor.evaluate(async el=>{el.setConfig(el._config);el.hass={states:{}};await el.updateComplete;});await expect(editor.locator('#segment-draft-color-text-fallback')).toHaveValue('var(');
 await editor.locator('#segment-draft-color-text-fallback').fill('var(--warning-color)');await expect(add).toBeEnabled();await add.click();
 expect((await saved(editor)).bar.segments).toEqual([...original.bar.segments,{from:90,color:'var(--warning-color)'}]);
 await editor.locator('[data-action="remove-segment"][data-index="3"]').click();expect(await saved(editor)).toEqual(original);
 await end(editor,0,'70');expect(await saved(editor)).toEqual(original);await expect(editor.locator('#segment-row-hint-0')).toHaveText('Segments overlap.');
});
