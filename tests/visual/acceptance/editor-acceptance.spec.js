const { test, expect } = require('@playwright/test');
const { inventory, groups } = require('./control-manifest.cjs');
const d = require('./editor-driver.cjs');
test.setTimeout(90_000);
const hosts=['standalone','feature'];
const entries=(host,journey,scope)=>inventory.filter(c=>c.hosts.includes(host)&&c.journey===journey&&(c.scope??'root')===(scope??'root'));
const rootRows=editor=>editor.locator('.card-subgroup[data-group="generic-markers"] .generic-marker-item');
const ref=(row,name)=>row.locator(`[data-kind="generic-marker-${name}"]`);
async function refs(editor) {await d.openDisclosure(editor.locator('#card-group-generic-markers'));for(const row of await rootRows(editor).all())await d.openDisclosure(row.locator('.generic-marker-toggle'));}
async function nearby(control,nested=false) {
 expect(await control.evaluate((el,nested)=>{const rect=el.getBoundingClientRect(),container=document.querySelector('#mount').getBoundingClientRect();return rect.bottom>(nested?container.top:0)&&rect.top<(nested?container.bottom:innerHeight);},nested)).toBe(true);
}
async function pointerClick(page,target) {
 await target.scrollIntoViewIfNeeded();
 await target.evaluate(button=>{
  window.__segmentPointerLog=[];window.__segmentPendingTarget=button;
  button.addEventListener('pointerdown',()=>window.__segmentPointerLog.push('pointerdown'),{once:true});
  button.addEventListener('click',()=>window.__segmentPointerLog.push('click'),{once:true});
 });
 const before=await target.boundingBox();expect(before).not.toBeNull();
 await page.mouse.move(before.x+before.width/2,before.y+before.height/2);
 await page.mouse.down();
 const after=await target.boundingBox();expect(after).not.toBeNull();
 expect(Math.abs(after.x-before.x)).toBeLessThan(0.5);
 expect(Math.abs(after.y-before.y)).toBeLessThan(0.5);
 expect(await target.evaluate(button=>button.isConnected&&button===window.__segmentPendingTarget)).toBe(true);
 await page.mouse.up();
 expect(await page.evaluate(()=>window.__segmentPointerLog)).toEqual(['pointerdown','click']);
}
for(const source of ['src','dist'])test(`feature: Target edits retain Baseline disclosure clicks and values (${source})`,async({page})=>{
 const editor=await d.mount(page,'feature',d.seed('feature'),source==='dist'?{source:'dist'}:{});
 await d.openDisclosure(editor.locator('#card-group-marker-target'));
 for(const [key,groups,kind] of [
  ['above',['target-above','target-above-threshold'],'target-above-entity-source'],
  ['below',['target-below','target-below-threshold'],'target-below-entity-source'],
  ['shared',['target-shared'],'target-entity-source'],
 ]) {
  for(const group of groups)await d.openDisclosure(editor.locator(`#card-group-${group}`));
  const value=`sensor.reference_${key}`,sourceControl=editor.locator(`[data-kind="${kind}"]`);
  await sourceControl.fill(value);
  const baseline=editor.locator('#card-group-baseline');
  await d.openDisclosure(baseline);
  await expect(baseline).toHaveAttribute('aria-expanded','true');
  await expect(sourceControl).toHaveValue(value);
  if(key==='shared')expect((await d.saved(page)).target.at).toEqual({fixed:50,entity:value});
  else expect((await d.saved(page)).target[`when_${key}`].at).toEqual({fixed:50,entity:value});
  await d.closeDisclosure(baseline);
  await d.openDisclosure(baseline);
  await d.closeDisclosure(baseline);
 }
});
for(const source of ['src','dist'])test(`feature: unrelated disclosures work after Target edits and explicit blur (${source})`,async({page})=>{
 const editor=await d.mount(page,'feature',d.seed('feature'),source==='dist'?{source:'dist'}:{});
 await d.openDisclosure(editor.locator('#card-group-marker-target'));
 await d.openDisclosure(editor.locator('#card-group-target-above'));
 await d.openDisclosure(editor.locator('#card-group-target-above-threshold'));
 const above=editor.locator('[data-kind="target-above-entity-source"]');
 await above.fill('sensor.above_for_other_disclosure');
 const peak=editor.locator('#card-group-marker-peak');
 await d.openDisclosure(peak);
 await expect(peak).toHaveAttribute('aria-expanded','true');
 expect((await d.saved(page)).target.when_above.at).toEqual({fixed:50,entity:'sensor.above_for_other_disclosure'});
 await d.closeDisclosure(peak);
 await above.fill('sensor.above_after_explicit_blur');
 await above.blur();
 await editor.evaluate(el=>el.updateComplete);
 const baseline=editor.locator('#card-group-baseline');
 await d.openDisclosure(baseline);
 await expect(baseline).toHaveAttribute('aria-expanded','true');
 expect((await d.saved(page)).target.when_above.at).toEqual({fixed:50,entity:'sensor.above_after_explicit_blur'});
});
for(const host of hosts) {
 for(const scope of host==='standalone'?['root','entity']:['root']) {
  const sections=[...new Set(entries(host,'fields',scope).map(c=>c.section))];
  for(const section of sections) test(`${host} ${scope} ${section}: declared control lifecycle, echo and reopen`,async({page})=>{
   const declared=entries(host,'fields',scope).filter(c=>c.section===section),exercised=[];
   for(const entry of declared) await test.step(entry.id,async()=>exercised.push(await d.fieldJourney(page,host,entry)));
   expect(exercised).toEqual(declared.map(c=>c.id));
  });
 }
 test(`${host}: coverage guard discovers conditional controls and structural actions`,async({page})=>{
  const editor=await d.mount(page,host),discovered=new Set();
  async function collect(){for(const id of await d.discover(editor))discovered.add(id);}
  await collect();await refs(editor);
  await d.openDisclosure(editor.locator('#card-group-marker-target'));
  for(const side of ['above','below']) {
   await d.openDisclosure(editor.locator(`#card-group-target-${side}`));
   await d.openDisclosure(editor.locator(`#card-group-target-${side}-threshold`));
   await editor.locator(`[data-kind="target-${side}-entity-source"]`).fill(`sensor.${side}_target`);
   await collect();
  }
  if(host==='feature'){
   await editor.locator('#feature-entity-override').check();await collect();
   for(const [group,key] of [['marker-target','target'],['baseline','baseline']]){
    await d.openDisclosure(editor.locator(`#card-group-${group}`));
    if(key==='target')await d.openDisclosure(editor.locator('#card-group-target-shared'));
    await editor.locator(`[data-kind="${key}-entity-source"]`).fill('sensor.reference');await collect();
   }
  }
  const markerRow=rootRows(editor).nth(1);
  await ref(markerRow,'fixed').fill('75%');await collect();
  await ref(markerRow,'entity').fill('sensor.reference');await collect();
  await ref(markerRow,'attribute').fill('temperature');await collect();
  if(host==='standalone'){
   await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"]').first());
   await d.openDisclosure(editor.locator('#entity-0-group-markers'));
   await d.openDisclosure(editor.locator('#entity-0-group-target'));
   for(const side of ['above','below']) {
    await d.openDisclosure(editor.locator(`#card-group-entity-0-target-${side}`));
    await d.openDisclosure(editor.locator(`#card-group-entity-0-target-${side}-threshold`));
    await editor.locator(`[data-kind="entity-target-${side}-entity-source"][data-index="0"]`).fill(`sensor.entity_${side}_target`);
   }
   await collect();
  }
  await d.mount(page,host,d.seed(host),{picker:true,iconPicker:host==='standalone'});await collect();
  const declared=new Set(inventory.filter(c=>c.hosts.includes(host)).map(c=>c.id));
  expect([...discovered].filter(id=>!declared.has(id)),'new controls need manifest entries and real journeys').toEqual([]);
  expect([...declared].filter(id=>!discovered.has(id)), 'conditional inventory fixture must mount every declared ID').toEqual([]);
  // A new routed control cannot silently pass discovery.
  await editor.evaluate(el=>{const input=document.createElement('input');input.dataset.field='uncovered-example';el.shadowRoot.append(input);});
  expect((await d.discover(editor)).filter(id=>!declared.has(id))).toEqual(['field:uncovered-example']);
  const journeys=new Set(['fields','sources','palettes','inheritance','entities','pickers','disclosures','references','direction','paint-source','paint-preset','directional','history']);
  for(const entry of inventory.filter(c=>c.hosts.includes(host)))expect(journeys.has(entry.journey),entry.id).toBe(true);
 });
 test(`${host}: Scale and Bar Direction default, edit and canonicalize only their owned keys`,async({page})=>{
  const config=d.seed(host),before=structuredClone(config),editor=await d.mount(page,host,config);
  for(const name of ['scale-direction','bar-direction']){
   const entry=inventory.find(c=>c.hosts.includes(host)&&(c.scope??'root')==='root'&&c.name===name);
   const eventsBeforeOpen=await d.count(page);
   await d.openSection(editor,entry);const input=d.control(editor,entry);
   await expect(input).toHaveValue('normal');
   expect(await d.count(page)).toBe(eventsBeforeOpen);
   expect(d.read(await d.saved(page),entry.path)).toBeUndefined();
   await d.commit(page,editor,()=>input.selectOption('reverse'));
   expect(d.read(await d.saved(page),entry.path)).toBe('reverse');
   await d.commit(page,editor,()=>input.selectOption('normal'));
   const after=await d.saved(page);
   expect(d.read(after,entry.path)).toBeUndefined();
   const expected=structuredClone(before);delete expected.scale.direction;delete expected.bar.direction;
   expect(after).toEqual(expected);
   await d.reopen(page,editor);await d.openSection(editor,entry);await expect(d.control(editor,entry)).toHaveValue('normal');
  }
 });
 for(const source of ['src','dist'])for(const scope of host==='standalone'?['root','entity']:['root'])test(`${host} ${scope} Segments (${source}): undefined gap draft sync, edit, cancel and save`,async({page})=>{
  test.setTimeout(30_000);
  const config=d.seed(host),entity=scope==='entity',paint=entity?config.entities[0].bar:config.bar;
  config.bar.fill_style='soft_bands';paint.fill_style='soft_bands';paint.color='#123456';paint.segments=[{from:0,to:50,color:'red'},{from:60,to:100,color:'blue'}];
  const editor=await d.mount(page,host,config,{source});
  if(entity){await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));await d.openDisclosure(editor.locator('#entity-0-group-bar'));}
  await d.openSection(editor,{section:'Segments',scope:entity?'entity':'root'});
  const idPrefix=entity?'entity-0-':'',kindPrefix=entity?'entity-':'';
  const kind=name=>`${kindPrefix}segment-${name}`;
  const palette=editor.locator(entity?'#entity-0-group-segments':'#card-group-segments').locator('xpath=..');
  const from=palette.locator(`#${idPrefix}segment-draft-from`),to=palette.locator(`#${idPrefix}segment-draft-to`);
  const draft=from.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " segment-draft ")]');
  const color=draft.locator(`input[data-kind="${kind('draft-color')}"]`);
  const colorText=draft.locator(`input[data-kind="${kind('draft-color-text-fallback')}"]`);
  const action=palette.locator(`button.segment-undefined-action[data-action="add-${entity?'entity-':''}segment-from-undefined"]${entity?'[data-index="0"]':''}`);
  const authoredFrom=palette.locator(`input[data-kind="${kind('from')}"]`).first();
  await expect(action).toBeVisible();await expect(action).toHaveAttribute('data-from','50');await expect(action).toHaveAttribute('data-to','60');await authoredFrom.fill('0.');
  const before=await d.saved(page),events=await d.count(page);
  await authoredFrom.evaluate(node=>window.__gapAuthoredNode=node);
  await from.evaluate(node=>window.__gapDraftNode=node);
  const scrollBefore=await page.evaluate(()=>({window:window.scrollY,mount:document.querySelector('#mount').scrollTop}));
  await action.click();
  await expect(from).toHaveValue('50');await expect(to).toHaveValue('60');await expect(color).toHaveValue('#123456');
  if(await colorText.count())await expect(colorText).toHaveValue('#123456');
  await expect(from).toBeFocused();await expect(editor.locator(entity?'#entity-0-group-segments':'#card-group-segments')).toHaveAttribute('aria-expanded','true');
  expect(await authoredFrom.evaluate(node=>node===window.__gapAuthoredNode)).toBe(true);
  expect(await authoredFrom).toHaveValue('0.');
  expect(await from.evaluate(node=>node===window.__gapDraftNode)).toBe(true);
  expect(await page.evaluate(()=>({window:window.scrollY,mount:document.querySelector('#mount').scrollTop}))).toEqual(scrollBefore);
  expect(await d.saved(page)).toEqual(before);expect(await d.count(page)).toBe(events);

  await from.fill('51');await to.fill('59');await color.fill('#654321');
  await expect(from).toHaveValue('51');await expect(to).toHaveValue('59');await expect(color).toHaveValue('#654321');
  if(await colorText.count())await expect(colorText).toHaveValue('#654321');
  await from.press('Escape');
  expect(await d.saved(page)).toEqual(before);expect(await d.count(page)).toBe(events);

  await authoredFrom.fill('0');await authoredFrom.press('Tab');
  await palette.locator(`button.segment-undefined-action[data-action="add-${entity?'entity-':''}segment-from-undefined"]${entity?'[data-index="0"]':''}`).click();
  await expect(from).toHaveValue('50');await expect(to).toHaveValue('60');await expect(color).toHaveValue('#123456');
  await d.commit(page,editor,()=>draft.locator(`button[data-action="add-${entity?'entity-':''}segment"]${entity?'[data-index="0"]':''}`).click());
  const after=await d.saved(page),updated=entity?after.entities[0].bar.segments:after.bar.segments;
  expect(updated).toHaveLength(3);
  expect(updated).toEqual(expect.arrayContaining([{from:0,to:50,color:'red'},{from:50,to:60,color:'#123456'},{from:60,to:100,color:'blue'}]));
  const stripSegments=value=>{const copy=structuredClone(value);if(entity)delete copy.entities[0].bar.segments;else delete copy.bar.segments;return copy;};
  expect(stripSegments(after)).toEqual(stripSegments(before));
 });
 test(`${host}: disclosures retain state through echo and normal close/reopen`,async({page})=>{
  const editor=await d.mount(page,host);await expect(editor.locator('.card-subgroup[data-expanded="true"]')).toHaveCount(0);
  const paint=editor.locator('#card-paint-editor');
  await expect(paint).not.toHaveAttribute('open');await expect(editor.locator('#card-group-segments')).toBeHidden();
  await d.openSection(editor,{section:'Bar Appearance'});
  await expect(paint).toHaveAttribute('open');await expect(editor.locator('#card-group-segments')).toBeVisible();
  for(const group of Object.values(groups)){
   const button=editor.locator(`#card-group-${group}`);if(!(await button.count()))continue;await d.openDisclosure(button);await d.echo(page,editor);await expect(button).toHaveAttribute('aria-expanded','true');await d.closeDisclosure(button);await d.openDisclosure(button);
  }
  await expect(paint).toHaveAttribute('open');expect(await d.count(page)).toBe(0);
  await refs(editor);const row=rootRows(editor).nth(1);await d.commit(page,editor,()=>ref(row,'label-text').fill('Marker Two'));await expect(row).toHaveAttribute('data-expanded','true');
  await d.closeDisclosure(row.locator('.generic-marker-toggle'));await d.openDisclosure(row.locator('.generic-marker-toggle'));
 });
 test(`${host}: foreign config resets owned numeric/palette drafts and Reference identities`,async({page})=>{
  const editor=await d.mount(page,host);await refs(editor);const row=rootRows(editor).nth(1);const input=ref(row,'fixed');
  await input.focus();await input.evaluate(el=>el.select());await input.press('Backspace');await d.echo(page,editor);await expect(input).toHaveValue('');const events=await d.count(page);
  const replacement=await d.saved(page);replacement.markers=[{at:'35%',label:{text:'Foreign'}}];replacement.future={keep:'foreign'};
  await d.foreign(editor,replacement);await expect(rootRows(editor)).toHaveCount(1);await expect(rootRows(editor).first()).toHaveAttribute('data-expanded','false');
  await d.openDisclosure(rootRows(editor).first().locator('.generic-marker-toggle'));await expect(ref(rootRows(editor).first(),'fixed')).toHaveValue('35%');expect(await d.count(page)).toBe(events);
  await d.openSection(editor,{section:'Segments'});const from=editor.locator('[data-kind="segment-from"]').first();await from.fill('-.');await from.press('Tab');await d.echo(page,editor);await expect(from).toHaveValue('-.');
  replacement.bar.segments=[{from:10,to:100,color:'#abcdef'}];await d.foreign(editor,replacement);await expect(from).toHaveValue('10');
 });
 for(const nested of [false,true]) {
  test(`${host} ${nested?'dialog':'page'} Journey A — incomplete Percentage belongs to Marker 2`,async({page})=>{
   const editor=await d.mount(page,host,d.seed(host),{tall:true,nested});await refs(editor);const row=rootRows(editor).nth(1),input=ref(row,'fixed');
   const id=await row.getAttribute('data-marker-ui-id');await expect(input).toHaveValue('50');
   const originalFirst=(await d.saved(page)).markers[0];await input.focus();await d.replaceNumericDraft(page,editor,input,'75%','percentage');
   await expect(row).toHaveAttribute('data-marker-ui-id',id);await expect(row).toHaveAttribute('data-expanded','true');await expect(input).toBeFocused();await nearby(input,nested);
   const config=await d.saved(page);expect(config.markers[1].at).toBe('75%');expect(config.markers[0]).toEqual(originalFirst);
   await d.reopen(page,editor);await refs(editor);await expect(ref(rootRows(editor).nth(1),'fixed')).toHaveValue('75%');
  });
  test(`${host} ${nested?'dialog':'page'} Journey B — Marker 2/3 Source ownership and viewport`,async({page})=>{
   const editor=await d.mount(page,host,d.seed(host),{tall:true,nested});await refs(editor);const ids=await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId));expect(new Set(ids).size).toBe(3);
   for(const index of [1,2]){
    const row=rootRows(editor).nth(index),value=ref(row,'fixed');await value.scrollIntoViewIfNeeded();await value.focus();
    await value.evaluate(el=>window.__acceptanceValue=el);await row.evaluate(el=>window.__acceptanceRow=el);
    for(const nextValue of ['75%','25','50%','50']){
     const before=await d.saved(page),events=await d.count(page);await value.fill(nextValue);await expect(value).toHaveValue(nextValue);
     if(JSON.stringify(await d.saved(page))===JSON.stringify(before))expect(await d.count(page)).toBe(events);
     else await expect.poll(()=>d.count(page)).toBeGreaterThan(events);
     await d.echo(page,editor);await expect(value).toBeFocused();await expect(row).toHaveAttribute('data-expanded','true');await nearby(value,nested);
     expect(await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId))).toEqual(ids);
     expect(await value.evaluate(el=>el===window.__acceptanceValue)).toBe(true);expect(await row.evaluate(el=>el===window.__acceptanceRow)).toBe(true);
    }
    await d.replaceNumericDraft(page,editor,value,'85');await d.commit(page,editor,()=>ref(row,'entity').fill(`sensor.marker_${index}`));
    expect((await d.saved(page)).markers[index].at).toMatchObject({fixed:85,entity:`sensor.marker_${index}`});
    await d.commit(page,editor,()=>ref(row,'attribute').fill('temperature'));
    expect((await d.saved(page)).markers[index].at).toMatchObject({fixed:85,entity:{id:`sensor.marker_${index}`,attribute:'temperature'}});
   }
  });
  test(`${host} ${nested?'dialog':'page'} Journey C — Add/expand/fold stays near interaction`,async({page})=>{
   const editor=await d.mount(page,host,d.seed(host),{tall:true,nested});await refs(editor);const add=editor.locator('[data-action="add-generic-marker"][data-scope-type="card"]');
   await add.scrollIntoViewIfNeeded();const before=await page.evaluate(nested=>nested?document.querySelector('#mount').scrollTop:scrollY,nested);await d.commit(page,editor,()=>add.click());
   const last=rootRows(editor).last();await expect(rootRows(editor)).toHaveCount(4);await expect(last).toHaveAttribute('data-expanded','true');await nearby(last.locator('.generic-marker-toggle'),nested);
   expect(await page.evaluate(nested=>nested?document.querySelector('#mount').scrollTop:scrollY,nested)).toBeGreaterThan(before/2);
   const toggle=rootRows(editor).nth(1).locator('.generic-marker-toggle');await toggle.scrollIntoViewIfNeeded();const summary=toggle.locator('.generic-marker-summary');await (await summary.isVisible()?summary:toggle).click();await expect(toggle).toHaveAttribute('aria-expanded','false');await nearby(toggle,nested);await d.openDisclosure(toggle);await nearby(toggle,nested);
  });
 }
 test(`${host}: Reference collection routes surviving and moved duplicate rows`,async({page})=>{
  const editor=await d.mount(page,host);await refs(editor);const initial=await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId));
  await d.commit(page,editor,()=>ref(rootRows(editor).nth(1),'label-text').fill('Second'));
  await d.commit(page,editor,()=>ref(rootRows(editor).nth(2),'label-text').fill('Third'));
  await d.commit(page,editor,()=>rootRows(editor).first().locator('[data-action="remove-generic-marker"]').click());
  expect(await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId))).toEqual(initial.slice(1));
  await d.commit(page,editor,()=>ref(rootRows(editor).first(),'label-text').fill('Surviving'));
  await d.commit(page,editor,()=>rootRows(editor).first().locator('[data-action="move-generic-marker-down"]').click());
  await d.commit(page,editor,()=>ref(rootRows(editor).last(),'label-text').fill('Moved'));
  expect((await d.saved(page)).markers.map(m=>m.label.text)).toEqual(['Third','Moved']);
  await d.commit(page,editor,()=>rootRows(editor).last().locator('[data-action="move-generic-marker-up"]').click());
  await d.reopen(page,editor);await refs(editor);await expect(ref(rootRows(editor).first(),'label-text')).toHaveValue('Moved');
 });
}
for(const host of hosts)for(const scope of host==='standalone'?['root','entity']:['root'])for(const family of ['segment','gradient'])test(`${host} ${scope} ${family}: draft, add/edit/remove, order, metadata and reopen`,async({page})=>{
 const editor=await d.mount(page,host),section=family==='segment'?'Segments':'Gradient Stops',entry={section,scope};
 const group=family==='segment'?'segments':'gradient-stops';
 const palette=editor.locator(scope==='entity'?`#entity-0-group-${group}`:`#card-group-${group}`).locator('xpath=..');
 const openPalette=async()=>{if(scope==='entity'){await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));await d.openDisclosure(editor.locator('#entity-0-group-bar'));}await d.openSection(editor,entry);};
 await openPalette();
 const prefix=scope==='entity'?'entity-':'',kind=(name,index=0)=>palette.locator(`[data-kind="${prefix}${family}-${name}"]${scope==='entity'?'[data-index="0"]':''}`).nth(index);
 const configPath=`${scope==='entity'?'entities.0.':''}bar.${family==='segment'?'segments':'gradient_stops'}`;
 const field=kind(family==='segment'?'from':'pos');const original=await d.saved(page);
 for(const draft of family==='segment'?['','-','.','-.']:['']){
  const before=await d.saved(page),events=await d.count(page);await field.fill(draft);await field.press('Tab');await d.echo(page,editor);
  expect(await d.saved(page)).toEqual(before);expect(await d.count(page)).toBe(events);await expect(field).toHaveValue(draft);
 }
 if(family==='gradient')for(const draft of ['-','.','-.']){const before=await d.saved(page),events=await d.count(page);await field.fill('');for(const key of draft)await field.press(key);await field.press('Tab');await d.echo(page,editor);expect(await d.saved(page)).toEqual(before);expect(await d.count(page)).toBe(events);}
 await d.commit(page,editor,async()=>{await field.fill('10');await field.press('Tab');});expect(d.read(await d.saved(page),configPath)[0][family==='segment'?'from':'pos']).toBe(10);
 if(family==='segment'){
  await d.commit(page,editor,async()=>{await kind('to').fill('45%');await kind('to').press('Enter');});expect(d.read(await d.saved(page),configPath)[0].to).toBe('45%');
 }
 await d.commit(page,editor,()=>d.colorPicker(kind('color'),'#334455'));expect(d.read(await d.saved(page),configPath)[0].color).toBe('#334455');
 if(family==='segment'&&host==='feature'){
  const css=kind('color-text-fallback');const before=await d.saved(page);await css.fill('rgb(');await css.press('Tab');await d.echo(page,editor);expect(await d.saved(page)).toEqual(before);await expect(css).toHaveValue('rgb(');
  for(const color of ['red','#ff8800','rgb(10, 120, 200)','var(--some-theme-color)']){await d.commit(page,editor,async()=>{await css.fill(color);await css.press('Tab');});expect(d.read(await d.saved(page),configPath)[0].color).toBe(color);}
 }
 // Gradient fallback is existing raw non-hex input. Edit it only to supported
 // interpolation paint; do not invent an arbitrary-CSS Gradient Stop journey.
 if(family==='gradient'){
  const raw=d.seed(host);await d.foreign(editor,raw);await openPalette();
  const fallback=kind('color-text-fallback');await d.commit(page,editor,()=>fallback.fill('#778899'));expect(d.read(await d.saved(page),configPath)[0].color).toBe('#778899');
 }
 const draftPos=kind(`draft-${family==='segment'?'from':'pos'}`);await draftPos.fill(family==='segment'?'100%':'60');
 if(family==='segment')await kind('draft-to').fill('150%');
 if(family==='gradient'){const draftColor=kind('draft-color-text-fallback');const events=await d.count(page);await draftColor.fill('#abcdef');await kind('draft-color').focus();await d.echo(page,editor);expect(await d.count(page)).toBe(events);await expect(kind('draft-color')).toHaveValue('#abcdef');}
 await d.colorPicker(kind('draft-color'),'#aabbcc');
 if(family==='segment'&&host==='feature')await kind('draft-color-text-fallback').fill('var(--some-theme-color)');
 const events=await d.count(page);await d.echo(page,editor);expect(await d.count(page)).toBe(events);
 const action=(verb)=>palette.locator(`[data-action="${verb}-${scope==='entity'?'entity-':''}${family==='segment'?'segment':'gradient-stop'}"]${scope==='entity'?'[data-index="0"]':''}`);
 await d.commit(page,editor,()=>action('add').click());expect(d.read(await d.saved(page),configPath)).toHaveLength(3);
 await draftPos.fill(family==='segment'?'150%':'80');if(family==='segment')await kind('draft-to').fill('200%');await draftPos.press('Enter');await d.echo(page,editor);expect(d.read(await d.saved(page),configPath)).toHaveLength(4);
 const second=kind(family==='segment'?'from':'pos',1);
 await d.commit(page,editor,async()=>{await second.fill(family==='segment'?'55':'90');await second.press('Tab');});
 const rows=d.read(await d.saved(page),configPath);if(host==='feature'){expect(rows[0].future).toBe('first');expect(rows[1].future).toBe('second');} // Standalone deliberately canonicalizes palette rows.
 await d.commit(page,editor,()=>action('remove').first().click());expect(d.read(await d.saved(page),configPath)).toHaveLength(3);
 const result=d.read(await d.saved(page),configPath);await d.reopen(page,editor);await openPalette();await expect(kind(family==='segment'?'from':'pos')).toHaveValue(String(family==='segment'?result[0].from:result[0].pos));
 // Neither palette exposes reordering buttons; preserve its existing array order.
 expect(await editor.locator(`[data-action^="move-${family}"]`).count()).toBe(0);
 if(host==='feature'&&family==='segment'){
  const autoConfig=d.seed(host);await d.foreign(editor,autoConfig);await openPalette();const to=palette.locator('[data-kind="segment-to"]').last();await d.commit(page,editor,async()=>{await to.fill('90%');await to.press('Tab');});expect(d.read(await d.saved(page),configPath).at(-1).to).toBe('90%');await d.commit(page,editor,async()=>{await to.fill('');await to.press('Tab');});expect(d.read(await d.saved(page),configPath).at(-1).to).toBeUndefined();await d.reopen(page,editor);await openPalette();await expect(palette.locator('[data-kind="segment-to"]').last()).toHaveValue('');
 }
 expect((await d.saved(page)).future).toEqual(original.future);
});

for(const source of ['src','dist'])for(const [host,scope] of [['standalone','root'],['standalone','entity'],['feature','root']])test(`${host} ${scope} Segment Add pointer remains stable after Start, End and Color edits (${source})`,async({page})=>{
 const config=d.seed(host),entity=scope==='entity',paint=entity?config.entities[0].bar:config.bar;
 paint.fill_style='bands';paint.color='red';paint.segments=[{from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}];
 const editor=await d.mount(page,host,config,{source});
 await d.openSection(editor,{section:'Segments',scope:entity?'entity':'root'});
 const prefix=entity?'entity-':'',idPrefix=entity?'entity-0-':'',index=entity?'[data-index="0"]':'';
 const palette=editor.locator(entity?'#entity-0-group-segments':'#card-group-segments').locator('xpath=..');
 const kind=name=>palette.locator(`input[data-kind="${prefix}segment-${name}"]${index}`).first();
 const add=palette.locator(`button[data-action="add-${prefix}segment"]${index}`);
 const path=entity?'entities.0.bar.segments':'bar.segments';
 const rows=[{from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}];
 const scenarios=[
  {name:'Start',from:'20',to:'40',color:'#aabbcc',last:'from'},
  {name:'End',from:'65',to:'70',color:'#c0ffee',last:'to'},
  {name:'Color',from:'80',to:'90',color:'#def456',last:'color'},
 ];
 for(const scenario of scenarios){
  const from=kind('draft-from'),to=kind('draft-to'),color=kind('draft-color');
  if(scenario.last==='from'){
   await to.fill(scenario.to);await d.colorPicker(color,scenario.color);await from.fill(scenario.from);
  }else if(scenario.last==='to'){
   await from.fill(scenario.from);await d.colorPicker(color,scenario.color);await to.fill(scenario.to);
  }else{
   await from.fill(scenario.from);await to.fill(scenario.to);await d.colorPicker(color,scenario.color);
  }
  await expect(add).toBeEnabled();
  const beforeEvents=await d.count(page);
  await pointerClick(page,add);
  await expect.poll(()=>d.count(page)).toBe(beforeEvents+1);
  rows.push({from:Number(scenario.from),to:Number(scenario.to),color:scenario.color});
  if(host!=='feature')rows.sort((left,right)=>left.from-right.from);
  expect(d.read(await d.saved(page),path)).toEqual(rows);
  await d.echo(page,editor);
  expect(await palette.locator(`input[data-kind="${prefix}segment-from"]${index}`).evaluateAll(nodes=>nodes.map(node=>node.value)))
   .toEqual(rows.map(row=>String(row.from)));
 }
 // Repeat an Add after the pointer sequence and verify it emits exactly once.
 const beforeEvents=await d.count(page),from=kind('draft-from'),to=kind('draft-to'),color=kind('draft-color');
 await from.fill('95');await to.fill('99');await d.colorPicker(color,'#123abc');
 await pointerClick(page,add);
 await expect.poll(()=>d.count(page)).toBe(beforeEvents+1);
 rows.push({from:95,to:99,color:'#123abc'});if(host!=='feature')rows.sort((left,right)=>left.from-right.from);
 expect(d.read(await d.saved(page),path)).toEqual(rows);
});

for(const source of ['src','dist'])test(`Card Segment Add remains stable for touch pointer clicks (${source})`,async({browser})=>{
 const context=await browser.newContext({hasTouch:true,baseURL:'http://127.0.0.1:4173',viewport:{width:900,height:720}});
 try{
  const page=await context.newPage(),config=d.seed('standalone');
  config.bar.fill_style='bands';config.bar.color='red';config.bar.segments=[{from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}];
  const editor=await d.mount(page,'standalone',config,{source});await d.openSection(editor,{section:'Segments'});
  const palette=editor.locator('#card-group-segments').locator('xpath=..');
  const from=palette.locator('#segment-draft-from'),to=palette.locator('#segment-draft-to');
  const css=palette.locator('#segment-draft-color-text-fallback'),add=palette.locator('button[data-action="add-segment"]');
  await from.fill('20');await to.fill('40');await css.fill('#aabbcc');
  await add.evaluate(button=>{
   window.__segmentPointerLog=[];window.__segmentPendingTarget=button;
   button.addEventListener('pointerdown',event=>{window.__segmentPointerLog.push(`down:${event.pointerType}`);window.__segmentDownY=button.getBoundingClientRect().y;window.__segmentStableAtUp=false;});
   button.addEventListener('pointerup',event=>{window.__segmentPointerLog.push(`up:${event.pointerType}`);window.__segmentStableAtUp=button.isConnected&&button===window.__segmentPendingTarget&&Math.abs(button.getBoundingClientRect().y-window.__segmentDownY)<0.5;});
   button.addEventListener('click',event=>window.__segmentPointerLog.push(`click:${event.pointerType}`));
  });
  await add.scrollIntoViewIfNeeded();const box=await add.boundingBox();
  const events=await d.count(page);
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  const pointerLog=await page.evaluate(()=>window.__segmentPointerLog);
  expect(pointerLog.slice(0,2)).toEqual(['down:touch','up:touch']);
  expect(['click:touch','click:mouse']).toContain(pointerLog[2]);
  expect(pointerLog).toHaveLength(3);
  expect(await page.evaluate(()=>window.__segmentStableAtUp)).toBe(true);
  await expect.poll(()=>d.count(page)).toBe(events+1);
  expect(d.read(await d.saved(page),'bar.segments')).toEqual([
   {from:10,to:15,color:'#112233'},{from:20,to:40,color:'#aabbcc'},{from:40,to:60,color:'#445566'},
  ]);
 }finally{await context.close();}
});

for(const source of ['src','dist'])for(const [host,scope] of [['standalone','root'],['standalone','entity'],['feature','root']])test(`${host} ${scope} Segment CSS draft remains editable through pointer Add (${source})`,async({page})=>{
 const config=d.seed(host),entity=scope==='entity',paint=entity?config.entities[0].bar:config.bar;
 paint.fill_style='bands';paint.color='red';paint.segments=[{from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}];
 const editor=await d.mount(page,host,config,{source});
 await d.openSection(editor,{section:'Segments',scope:entity?'entity':'root'});
 const prefix=entity?'entity-':'',index=entity?'[data-index="0"]':'';
 const palette=editor.locator(entity?'#entity-0-group-segments':'#card-group-segments').locator('xpath=..');
 const kind=name=>palette.locator(`input[data-kind="${prefix}segment-${name}"]${index}`).first();
 const add=palette.locator(`button[data-action="add-${prefix}segment"]${index}`);
 const from=kind('draft-from'),to=kind('draft-to'),css=kind('draft-color-text-fallback');
 await from.fill('20');await to.fill('40');await css.fill('#aabbcc');await expect(css).toBeVisible();await expect(add).toBeEnabled();
 const events=await d.count(page);
 await pointerClick(page,add);
 await expect.poll(()=>d.count(page)).toBe(events+1);
 const path=entity?'entities.0.bar.segments':'bar.segments';
 expect(d.read(await d.saved(page),path)).toEqual(host==='feature' ? [
  {from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'},{from:20,to:40,color:'#aabbcc'},
 ] : [
  {from:10,to:15,color:'#112233'},{from:20,to:40,color:'#aabbcc'},{from:40,to:60,color:'#445566'},
 ]);
 await expect(kind('draft-color-text-fallback')).toHaveValue('red');
});

for(const source of ['src','dist'])for(const [host,scope] of [['standalone','root'],['standalone','entity'],['feature','root']])test(`${host} ${scope} Segment edit, delete, gap insertion, validation and keyboard Add (${source})`,async({page})=>{
 const config=d.seed(host),entity=scope==='entity',paint=entity?config.entities[0].bar:config.bar;
 paint.fill_style='bands';paint.color='red';paint.segments=[{from:10,to:15,color:'#112233'},{from:40,to:60,color:'#445566'},{from:70,to:80,color:'#778899'}];
 const editor=await d.mount(page,host,config,{source});
 await d.openSection(editor,{section:'Segments',scope:entity?'entity':'root'});
 const prefix=entity?'entity-':'',index=entity?'[data-index="0"]':'',idPrefix=entity?'entity-0-':'';
 const palette=editor.locator(entity?'#entity-0-group-segments':'#card-group-segments').locator('xpath=..');
 const path=entity?'entities.0.bar.segments':'bar.segments';
 const rows=()=>palette.locator('.segment-editor-row');
 const edit=palette.locator(`input[data-kind="${prefix}segment-from"]${index}`).first();
 const remove=palette.locator(`button[data-action="remove-${prefix}segment"]${index}`).last();
 const changesBefore=await d.count(page);
 await edit.fill('11');
 await pointerClick(page,remove);
 await expect.poll(()=>d.count(page)).toBe(changesBefore+2);
 const edits=await page.evaluate(({start,path})=>window.__acceptance.events.slice(start).map(event=>structuredClone(path.split('.').reduce((value,key)=>value?.[key],event))),{start:changesBefore,path});
 expect(edits[0]).toEqual([{from:11,to:15,color:'#112233'},{from:40,to:60,color:'#445566'},{from:70,to:80,color:'#778899'}]);
 expect(edits[1]).toEqual([{from:11,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}]);
 expect(d.read(await d.saved(page),path)).toEqual([{from:11,to:15,color:'#112233'},{from:40,to:60,color:'#445566'}]);
 await d.echo(page,editor);
 const gap=palette.locator(`button.segment-undefined-action[data-action="add-${prefix}segment-from-undefined"]${index}`).first();
 await expect(gap).toHaveAttribute('data-from','15');await expect(gap).toHaveAttribute('data-to','40');
 const afterDelete=await d.count(page);
 await pointerClick(page,gap);
 expect(await d.count(page)).toBe(afterDelete);
 await expect(palette.locator(`#${idPrefix}segment-draft-from`)).toHaveValue('15');
 await expect(palette.locator(`#${idPrefix}segment-draft-to`)).toHaveValue('40');
 const color=palette.locator(`input[data-kind="${prefix}segment-draft-color"]${index}`).first();
 await d.colorPicker(color,'#aabbcc');
 const beforeAdd=await d.count(page);
 await pointerClick(page,palette.locator(`button[data-action="add-${prefix}segment"]${index}`));
 await expect.poll(()=>d.count(page)).toBe(beforeAdd+1);
 expect(d.read(await d.saved(page),path)).toEqual([
  {from:11,to:15,color:'#112233'},{from:15,to:40,color:'#aabbcc'},{from:40,to:60,color:'#445566'},
 ]);
 await d.echo(page,editor);
 const draftFrom=palette.locator(`#${idPrefix}segment-draft-from`),draftTo=palette.locator(`#${idPrefix}segment-draft-to`);
 const add=palette.locator(`button[data-action="add-${prefix}segment"]${index}`);
 const invalidEvents=await d.count(page);
 await draftFrom.fill(host==='feature'?'':'65');await draftTo.fill('');
 await expect(add).toBeDisabled();
 await expect(palette.locator(`#${idPrefix}segment-draft-hint`)).toHaveText(host==='feature'?'Enter a start value to add a segment.':'Enter valid from/to values.');
 expect(await d.count(page)).toBe(invalidEvents);
 await draftFrom.fill('35');await draftTo.fill('50');
 await expect(add).toBeDisabled();
 await expect(palette.locator(`#${idPrefix}segment-draft-hint`)).toContainText('overlap');
 expect(await d.count(page)).toBe(invalidEvents);
 await draftFrom.fill('65');await draftTo.fill('70');
 await d.colorPicker(color,'#fedcba');
 await draftFrom.press('Enter');
 await expect.poll(()=>d.count(page)).toBe(invalidEvents+1);
 expect(d.read(await d.saved(page),path)).toEqual([
  {from:11,to:15,color:'#112233'},{from:15,to:40,color:'#aabbcc'},{from:40,to:60,color:'#445566'},{from:65,to:70,color:'#fedcba'},
 ]);
});

for (const source of ['src', 'dist']) for (const [host, scope] of [['standalone', 'root'], ['standalone', 'entity'], ['feature', 'root']]) {
 const editorName=host==='feature'?'Tile Feature':scope==='entity'?'Entity':'Card';
 test(`${editorName} inserts a Segment from the visible gap action in list order (${source})`, async ({page}) => {
  const config=d.seed(host),entity=scope==='entity';
  const segments=[
   {from:'0%',to:'30%',color:'#4CAF50'},
   {from:'70%',to:'100%',color:'#FF9800'},
  ];
  config.bar={paint:{fill_style:'bands',segments:structuredClone(segments)}};
  if(entity)config.entities[0].bar={paint:{fill_style:'bands',segments:structuredClone(segments)}};
  const editor=await d.mount(page,host,config,{source});
  const entry={section:'Segments',scope:entity?'entity':'root'};
  if(entity){await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));await d.openDisclosure(editor.locator('#entity-0-group-bar'));}
  await d.openSection(editor,entry);
  const palette=editor.locator(entity?'#entity-0-group-segments':'#card-group-segments').locator('xpath=..');
  const prefix=entity?'entity-':'';
  const from=palette.locator(`input[data-kind="${prefix}segment-draft-from"]`);
  const to=palette.locator(`input[data-kind="${prefix}segment-draft-to"]`);
  const color=palette.locator(`input[data-kind="${prefix}segment-draft-color"]`);
  const add=palette.locator(`button[data-action="add-${prefix}segment"]${entity?'[data-index="0"]':''}`);
  const gap=palette.locator(`button.segment-undefined-action[data-action="add-${prefix}segment-from-undefined"]${entity?'[data-index="0"]':''}`);
  const path=entity?'entities.0.bar.paint.segments':'bar.paint.segments';
  const before=await d.saved(page);
  await expect(gap).toHaveAttribute('data-from','30%');
  await expect(gap).toHaveAttribute('data-to','70%');
  await gap.click();
  await expect(from).toHaveValue('30%');
  await expect(to).toHaveValue('70%');
  await from.press('Escape');
  expect(await d.saved(page)).toEqual(before);

  await gap.click();
  await color.fill('#00ffff');
  await d.commit(page,editor,()=>add.click());
  const expected=[segments[0],{from:'30%',to:'70%',color:'#00ffff'},segments[1]];
  expect(d.read(await d.saved(page),path)).toEqual(expected);
  await expect(palette.locator(`input[data-kind="${prefix}segment-from"]`)).toHaveCount(3);
  expect(await palette.locator(`input[data-kind="${prefix}segment-from"]`).evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['0%','30%','70%']);
  expect(await palette.locator('.segment-editor-row .section-note').allTextContents()).toEqual(['','','']);
  const draftHint=palette.locator(`#${entity?'entity-0-':''}segment-draft-hint`);
  await expect(draftHint).not.toHaveText('Duplicate segment start.');
  const preview=await palette.locator('.segment-preview-interval[data-preview-kind="segment"]').evaluateAll(nodes=>nodes.map(node=>({left:node.style.left,width:node.style.width,color:node.style.backgroundColor})));
  expect(preview).toContainEqual({left:'30%',width:'40%',color:'rgb(0, 255, 255)'});

  await from.fill('70%');
  await to.fill('100%');
  await expect(draftHint).toHaveText('Duplicate segment start.');
  await from.press('Escape');
  await from.fill('100%');
  await to.fill('110%');
  await color.fill('#abcdef');
  await d.commit(page,editor,()=>add.click());
  const ordinary=[...expected,{from:'100%',to:'110%',color:'#abcdef'}];
  expect(d.read(await d.saved(page),path)).toEqual(ordinary);
  const paint=await page.evaluate(async segments=>{
   const {normalizeCardConfig}=await import('/src/config/normalize.js');
   const {getColor}=await import('/src/view-model/bar-render-model.js');
   const config={scale:{min:0,max:100},bar:{paint:{fill_style:'bands',segments}}};
   const card=await window.__sbcpRenderCard({config:{...config,entities:['sensor.power']},states:{'sensor.power':window.__sbcpCreateState(50)}});
   return {css:card.shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]').style.backgroundImage,
    color:getColor(50,normalizeCardConfig({...config,entities:['sensor.power']}).entities[0],0,100)};
  },ordinary);
  expect(paint.color).toBe('#00ffff');
  expect(paint.css).toContain('rgb(0, 255, 255) 30%');
  expect(paint.css).toContain('rgb(0, 255, 255) 70%');
 });
}
for(const key of ['target','baseline'])test(`feature ${key}: direct Value conversions, entity fallback, drafts and preservation`,async({page})=>{
 const config=d.seed('feature');config[key].at={value:25,future:'source metadata'};const editor=await d.mount(page,'feature',config);await d.openSection(editor,{section:key==='target'?'Target':'Baseline'});
 const input=editor.locator(`#${key}-value`),entity=editor.locator(`[data-kind="${key}-entity-source"]`),attribute=editor.locator(`[data-kind="${key}-attribute"]`);
 await expect(input).toHaveValue('25');
 await d.commit(page,editor,()=>input.fill('50%'));
 expect((await d.saved(page))[key].at).toEqual({percent:50,future:'source metadata'});
 await d.commit(page,editor,()=>d.replaceText(entity,'sensor.reference'));
 expect((await d.saved(page))[key].at).toEqual({entity:'sensor.reference',percent:50,future:'source metadata'});
 await d.commit(page,editor,()=>attribute.fill('temperature'));
 expect((await d.saved(page))[key].at).toEqual({entity:{id:'sensor.reference',attribute:'temperature'},percent:50,future:'source metadata'});
 await d.commit(page,editor,()=>input.fill('30'));
 expect((await d.saved(page))[key].at).toEqual({entity:{id:'sensor.reference',attribute:'temperature'},fixed:30,future:'source metadata'});
 await d.commit(page,editor,()=>input.fill('65%'));
 expect((await d.saved(page))[key].at).toEqual({entity:{id:'sensor.reference',attribute:'temperature'},percent:65,future:'source metadata'});
 const before=await d.saved(page),count=await d.count(page);await input.fill('101%');await d.echo(page,editor);
 expect(await d.saved(page)).toEqual(before);expect(await d.count(page)).toBe(count);await expect(input).toHaveValue('101%');
 await d.commit(page,editor,async()=>{await input.fill('');await input.press('Tab');});
 expect((await d.saved(page))[key].at).toEqual({entity:{id:'sensor.reference',attribute:'temperature'},future:'source metadata'});
 const foreign=d.seed('feature');foreign[key].at='40%';await d.foreign(editor,foreign);await d.openSection(editor,{section:key==='target'?'Target':'Baseline'});
 await expect(editor.locator(`#${key}-value`)).toHaveValue('40%');
 if(key==='baseline'){await d.commit(page,editor,()=>editor.locator('[data-action="remove-baseline"]').click());expect((await d.saved(page)).baseline).toBeUndefined();}
});
for(const host of hosts)test(`${host}: entity ownership and structural persistence`,async({page})=>{
 const editor=await d.mount(page,host);
 if(host==='feature'){
  expect((await d.saved(page)).entity).toBeUndefined();
  const attribute=editor.locator('[data-kind="feature-attribute"]');
  await d.commit(page,editor,()=>attribute.fill('current_temperature'));
  expect((await d.saved(page)).attribute).toBe('current_temperature');
  const override=editor.locator('#feature-entity-override');await override.check();expect((await d.saved(page)).entity).toBeUndefined();
  await d.commit(page,editor,()=>editor.locator('[data-kind="feature-entity-source"]').fill('sensor.override'));expect((await d.saved(page)).entity).toBe('sensor.override');await d.reopen(page,editor);await expect(override).toBeChecked();
  expect((await d.saved(page)).attribute).toBe('current_temperature');
  await d.commit(page,editor,()=>editor.locator('[data-kind="feature-attribute"]').fill(''));
  expect((await d.saved(page)).attribute).toBeUndefined();
  await d.commit(page,editor,()=>override.uncheck());expect((await d.saved(page)).entity).toBeUndefined();await d.reopen(page,editor);await expect(override).not.toBeChecked();await expect(editor.locator('[data-kind="feature-entity-source"]')).toHaveCount(0);
 }else{
  await d.commit(page,editor,()=>editor.locator('[data-kind="entity-attribute"][data-index="0"]').fill('current_temperature'));
  expect((await d.saved(page)).entities[0].attribute).toBe('current_temperature');
  await d.commit(page,editor,()=>editor.locator('[data-kind="entity-attribute"][data-index="0"]').fill(''));
  expect((await d.saved(page)).entities[0].attribute).toBeUndefined();
  await d.commit(page,editor,()=>editor.locator('[data-action="add-entity"]').click());expect((await d.saved(page)).entities).toHaveLength(3);
  const name=index=>editor.locator(`[data-kind="entity-name"][data-index="${index}"]`);
  await d.commit(page,editor,()=>name(2).fill('Third'));
  await d.commit(page,editor,()=>editor.locator('[data-action="duplicate-entity"][data-index="2"]').click());expect((await d.saved(page)).entities).toHaveLength(4);
  await d.commit(page,editor,()=>editor.locator('[data-action="move-entity-up"][data-index="2"]').click());await expect(name(1)).toHaveValue('Third');
  await d.commit(page,editor,()=>editor.locator('[data-action="move-entity-down"][data-index="1"]').click());
  await d.commit(page,editor,()=>editor.locator('[data-action="remove-entity"][data-index="0"]').click());await d.reopen(page,editor);await expect(name(0)).toHaveValue('Other');
 }
});
test('standalone: Scale and Bar Direction entity overrides preserve Inherit, Normal and Reverse',async({page})=>{
 for(const name of ['entity-scale-direction','entity-bar-direction']){
  const entry=inventory.find(c=>c.hosts.includes('standalone')&&c.scope==='entity'&&c.name===name);
  const config=d.seed('standalone'),parentKey=entry.section==='Scale'?'scale':'bar';
  config[parentKey].direction='reverse';
  const before=structuredClone(config),editor=await d.mount(page,'standalone',config);
  await d.openSection(editor,entry);const input=d.control(editor,entry);
  await expect(input).toHaveValue('inherit');expect(await d.count(page)).toBe(0);
  expect(d.read(await d.saved(page),entry.path)).toBeUndefined();
  await d.commit(page,editor,()=>input.selectOption('normal'));
  expect(d.read(await d.saved(page),entry.path)).toBe('normal');
  expect(d.read(await d.saved(page),`${parentKey}.direction`)).toBe('reverse');
  await d.commit(page,editor,()=>input.selectOption('reverse'));
  expect(d.read(await d.saved(page),entry.path)).toBe('reverse');
  await d.commit(page,editor,()=>input.selectOption('inherit'));
  const after=await d.saved(page),expected=structuredClone(before);
  delete expected.entities[0][parentKey].direction;
  expect(after).toEqual(expected);
  await d.reopen(page,editor);await d.openSection(editor,entry);await expect(d.control(editor,entry)).toHaveValue('inherit');
 }
});
test('standalone: every entity inheritance control restores the canonical card value',async({page})=>{
 for(const entry of entries('standalone','inheritance','entity')){
  const config=d.seed('standalone');config.entities[0].target={at:{fixed:50},color:'red',label:{show:true,decimal:1}};
  const editor=await d.mount(page,'standalone',config);await d.openSection(editor,entry);const input=d.control(editor,entry);await expect(input).not.toBeChecked();
  await d.commit(page,editor,()=>input.check());await expect(input).toBeChecked();const sectionPath={'Bar Appearance':'bar','Gradient Stops':'bar.gradient_stops','Segments':'bar.segments','References':'markers','Needle':'bar.needle'}[entry.section]??entry.section.toLowerCase();
  if(entry.section==='Bar Appearance'){for(const part of ['fill_style','color','solid_fill'])expect(d.read(await d.saved(page),`entities.0.bar.${part}`)).toBeUndefined();expect((await d.saved(page)).entities[0].bar.needle).toEqual(config.entities[0].bar.needle);}
  else expect(d.read(await d.saved(page),`entities.0.${sectionPath}`),entry.id).toBeUndefined();await d.reopen(page,editor);await d.openSection(editor,entry);await expect(d.control(editor,entry)).toBeChecked();
 }
});
test('standalone: entity Icon YAML modes and HA icon picker lifecycle',async({page})=>{
 for(const [icon,mode] of [[undefined,'default'],['mdi:battery','custom'],[false,'off']]){
  const config=d.seed('standalone');if(icon!==undefined)config.entities[0].icon=icon;
  const editor=await d.mount(page,'standalone',config,{iconPicker:true});
  const radio=editor.locator(`input[data-kind="entity-icon-mode"][data-index="0"][value="${mode}"]`),picker=editor.locator('ha-icon-picker[data-kind="entity-icon-picker"][data-index="0"] input');
  await expect(editor.locator('input[data-kind="entity-icon-value"]')).toHaveCount(0);
  for(const reopen of [false,true]){
   if(reopen)await d.reopen(page,editor);
   await expect(radio).toBeChecked();await expect(picker).toBeEnabled({enabled:mode==='custom'});await expect(picker).toHaveValue(typeof icon==='string'?icon:'');
   expect((await d.saved(page)).entities[0].icon).toBe(icon);expect(Object.hasOwn((await d.saved(page)).entities[0],'icon')).toBe(icon!==undefined);expect(await d.count(page)).toBe(0);
  }
 }
 for(const id of ['kind:entity-icon-mode','kind:entity-icon-picker']){
  const entry=inventory.find(c=>c.id===id);expect(await d.fieldJourney(page,'standalone',entry,{iconPicker:true})).toBe(id);
 }
});
for(const host of hosts)test(`${host}: HA picker event boundary supports entity/source and label controls`,async({page})=>{
 const editor=await d.mount(page,host,d.seed(host),{picker:true});await refs(editor);
 const cases=[['kind:scale-min-entity-source','scale.min.entity'],['kind:target-entity-source','target.at.entity'],['kind:baseline-entity-source','baseline.at.entity'],['kind:generic-marker-label-entity','markers.0.label.entity']];
 if(host==='standalone')cases.push(['kind:entity-picker','entities.0.entity']);
 else {await editor.locator('#feature-entity-override').check();cases.push(['kind:feature-entity-source','entity']);}
 for(const [id,path] of cases){const entry=inventory.find(c=>c.id===id);await d.openSection(editor,entry);const picker=d.control(editor,entry);await d.commit(page,editor,()=>picker.locator('input').fill('sensor.picked'));expect(d.read(await d.saved(page),path)).toBe('sensor.picked');}
 await d.reopen(page,editor);if(host==='feature')await expect(editor.locator('[data-kind="feature-entity-source"] input')).toHaveValue('sensor.picked');else await expect(editor.locator('[data-kind="entity-picker"][data-index="0"] input')).toHaveValue('sensor.picked');
});
test('feature: palette aliases keep raw order, untouched metadata and omitted Auto ends',async({page})=>{
 for(const alias of ['segments','severity','gradient_stops']){
  const config=d.seed('feature'),gradient=alias==='gradient_stops';delete config.bar[gradient?'gradient_stops':'segments'];
  config[alias]=gradient?[{pos:0,color:'#112233',future:'first'},{pos:100,color:'#445566',future:'second'}]:[{from:0,color:'red',future:'first'},{from:50,color:'blue',future:'second'}];
  const editor=await d.mount(page,'feature',config);await d.openSection(editor,{section:gradient?'Gradient Stops':'Segments'});
  const input=editor.locator(`[data-kind="${gradient?'gradient-pos':'segment-from'}"]`).first();await d.commit(page,editor,async()=>{await input.fill('10');await input.press('Tab');});
  const saved=await d.saved(page);expect(saved[alias][0]).toEqual({...config[alias][0],[gradient?'pos':'from']:10});expect(saved[alias][1]).toEqual(config[alias][1]);expect(saved.bar[gradient?'gradient_stops':'segments']).toBeUndefined();
  await d.reopen(page,editor);await d.openSection(editor,{section:gradient?'Gradient Stops':'Segments'});await expect(input).toHaveValue('10');
 }
});
test('standalone: entity Reference scope edits do not route to root or another entity',async({page})=>{
 const editor=await d.mount(page,'standalone');await d.openSection(editor,{scope:'entity',section:'References'});const row=editor.locator('.override-group:not(.card-subgroup)[data-group="markers"] .generic-marker-item').first();
 const before=await d.saved(page),value=ref(row,'fixed');await d.replaceNumericDraft(page,editor,value,'75%','percentage');
 await d.commit(page,editor,()=>ref(row,'entity').fill('sensor.override_reference'));
 expect((await d.saved(page)).entities[0].markers[0].at).toMatchObject({entity:'sensor.override_reference'});expect((await d.saved(page)).markers).toEqual(before.markers);expect((await d.saved(page)).entities[1]).toEqual(before.entities[1]);
 await d.reopen(page,editor);await d.openSection(editor,{scope:'entity',section:'References'});await expect(ref(row,'fixed')).toHaveValue('75%');
});
for(const host of hosts)test(`${host}: Needle mode respects the host Baseline cleanup policy`,async({page})=>{
 const config=d.seed(host),editor=await d.mount(page,host,config);await d.openSection(editor,{section:'Needle'});await d.commit(page,editor,()=>editor.locator('#bar-needle-mode').uncheck());await d.commit(page,editor,()=>editor.locator('#bar-needle-mode').check());
 if(host==='feature')expect((await d.saved(page)).baseline).toEqual(config.baseline);else expect((await d.saved(page)).baseline).toBeUndefined();
});
test('standalone: Shared Target inheritance keeps Paint and restores omitted marker fields',async({page})=>{
 const config=d.seed('standalone');config.entities[0].target.label.precision=3;const editor=await d.mount(page,'standalone',config);await d.openSection(editor,{section:'Target',scope:'entity'});
 await d.commit(page,editor,()=>editor.locator('[data-kind="entity-target-inherit"]').first().click());
 expect((await d.saved(page)).entities[0].target).toEqual({when_exceeded:{fill_color:'red'},future:'marker metadata'});
 await expect(editor.locator('#entity-0-target-inherit')).not.toBeChecked();
 await d.reopen(page,editor);await d.openSection(editor,{section:'Target',scope:'entity'});
 await expect(editor.locator('#entity-0-target-label-text')).toHaveValue('Label');
 await expect(editor.locator('#entity-0-target-label-precision')).toHaveValue('1');
});
for(const host of hosts)test(`${host}: blank numeric blur resets formatting and precision deliberately`,async({page})=>{
 const editor=await d.mount(page,host);await d.openSection(editor,{section:'Target'});
 for(const [id,path] of [['#formatting-decimal','formatting.decimal'],['#target-label-precision','target.label.precision']]){
  const input=editor.locator(id),events=await d.count(page);await input.fill('');await d.echo(page,editor);expect(await d.count(page)).toBe(events);
  await d.commit(page,editor,()=>input.press('Tab'));expect(d.read(await d.saved(page),path)).toBeUndefined();await d.reopen(page,editor);await d.openSection(editor,{section:'Target'});await expect(editor.locator(id)).toHaveValue('');
 }
});
test('feature: foreign config replaces an owned invalid CSS draft without emission',async({page})=>{
 const editor=await d.mount(page,'feature'),input=editor.locator('#bar-color-text-fallback'),events=await d.count(page);await d.openSection(editor,{section:'Bar Appearance'});await input.fill('rgb(');await d.echo(page,editor);await expect(input).toHaveValue('rgb(');expect(await d.count(page)).toBe(events);
 const config=await d.saved(page);config.bar.color='blue';await d.foreign(editor,config);await expect(input).toHaveValue('blue');await expect(input).toHaveAttribute('aria-invalid','false');expect(await d.count(page)).toBe(events);
});
for(const host of hosts)test(`${host}: explicit Remove Baseline emits, echoes and persists without changing Needle`,async({page})=>{
 const editor=await d.mount(page,host);await d.openSection(editor,{section:'Baseline'});const needle=(await d.saved(page)).bar.needle;
 await d.commit(page,editor,()=>editor.locator('[data-action="remove-baseline"][data-scope-type="card"]').click());expect((await d.saved(page)).baseline).toBeUndefined();expect((await d.saved(page)).bar.needle).toEqual(needle);
 await d.reopen(page,editor);await d.openSection(editor,{section:'Baseline'});await expect(editor.locator('#baseline-value')).toHaveValue('');
});

test('standalone: entity Paint is directly reachable by keyboard at 240px',async({page})=>{
 const original=d.seed('standalone'),editor=await d.mount(page,'standalone',original,{tall:true});
 const overrides=editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]');
 await overrides.focus();await page.keyboard.press('Space');
 const barDisclosure=editor.locator('#entity-0-group-bar');
 await expect(barDisclosure).toHaveAttribute('aria-expanded','false');
 await barDisclosure.focus();await page.keyboard.press('Space');
 const group=editor.getByRole('group',{name:'Bar Appearance',exact:true}).first();
 const paint=group.locator('#entity-0-paint-editor'),summary=paint.locator('summary');
 await expect(group.locator('#entity-0-bar-direction')).toBeVisible();await expect(summary).toBeVisible();
 await expect(paint).not.toHaveAttribute('open');expect(await d.count(page)).toBe(0);
 await d.commit(page,editor,()=>group.locator('#entity-0-bar-direction').selectOption('reverse'));
 await group.locator('#entity-0-bar-direction').focus();await page.keyboard.press('Tab');
 await expect(group.locator('#entity-0-bar-animated')).toBeFocused();await page.keyboard.press('Tab');await expect(summary).toBeFocused();
 await page.keyboard.press('Enter');await expect(paint).toHaveAttribute('open');
 for(const name of ['segments','gradient-stops']){
  const toggle=paint.locator(`#entity-0-group-${name}`);await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','true');
 }
 expect(await group.evaluate(el=>{
  const bounds=el.getBoundingClientRect();
  return [...el.querySelectorAll('input,select,button')].every(control=>{
   const rect=control.getBoundingClientRect();return !rect.width||(rect.left>=bounds.left&&rect.right<=bounds.right);
  });
 })).toBe(true);
 expect(await editor.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 expect(await d.count(page)).toBe(1);expect((await d.saved(page)).entities[0].bar.direction).toBe('reverse');
 expect((await d.saved(page)).bar).toEqual(original.bar);expect((await d.saved(page)).entities[1]).toEqual(original.entities[1]);
 await summary.focus();await page.keyboard.press('Space');await expect(paint).not.toHaveAttribute('open');
 await d.reopen(page,editor);await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));
 await d.openDisclosure(editor.locator('#entity-0-group-bar'));
 await expect(editor.locator('#entity-0-bar-direction')).toHaveValue('reverse');await expect(editor.locator('#entity-0-paint-editor')).not.toHaveAttribute('open');
});

for(const host of hosts)test(`${host}: canonical grouped paint editing, palettes and reopen`,async({page})=>{
 const config=d.seed(host);config.bar.paint={opacity:35,future:{keep:true}};
 for(const key of ['fill_style','color','solid_fill','segments','gradient_stops'])if(Object.hasOwn(config.bar,key)){config.bar.paint[key]=config.bar[key];delete config.bar[key];}
 if(host==='standalone')config.entities[0].bar.paint={color:'#abcdef'};
 const editor=await d.mount(page,host,config);await d.openSection(editor,{section:'Bar Appearance'});
 for(const style of ['solid','gradient','soft_bands','band_gradient','bands']){
  await d.commit(page,editor,()=>editor.locator('#bar-fill-style').selectOption(style));
  expect((await d.saved(page)).bar.paint.fill_style).toBe(style);expect((await d.saved(page)).bar.fill_style).toBeUndefined();
 }
 await d.commit(page,editor,()=>d.colorPicker(editor.locator('#bar-color'),'#4a9eff'));
 await d.commit(page,editor,()=>editor.locator('#bar-solid-fill').check());
 await d.commit(page,editor,()=>editor.locator('#bar-solid-fill').uncheck());
 expect((await d.saved(page)).bar.paint).toMatchObject({color:'#4a9eff',solid_fill:false,opacity:35,future:{keep:true}});
 await d.openSection(editor,{section:'Segments'});
 const from=editor.locator('input[data-kind="segment-from"]').first();
 await d.commit(page,editor,async()=>{await from.fill('10%');await from.press('Enter');});
 expect((await d.saved(page)).bar.paint.segments[0].from).toBe('10%');
 expect((await d.saved(page)).bar.segments).toBeUndefined();
 const saved=await d.saved(page);await d.reopen(page,editor);await d.openSection(editor,{section:'Bar Appearance'});
 await expect(editor.locator('#bar-fill-style')).toHaveValue('bands');await expect(editor.locator('#bar-solid-fill')).not.toBeChecked();
 expect(await d.saved(page)).toEqual(saved);
 if(host==='standalone'){
  await d.openSection(editor,{section:'Bar Appearance',scope:'entity'});
  await d.commit(page,editor,()=>d.colorPicker(editor.locator('#entity-0-bar-color'),'#4a9eff'));
  expect((await d.saved(page)).entities[0].bar.paint.color).toBe('#4a9eff');
  expect((await d.saved(page)).entities[0].bar.color).toBeUndefined();
  await d.commit(page,editor,()=>editor.locator('#entity-0-bar-inherit').check());
  for(const key of ['color','fill_style','solid_fill'])expect((await d.saved(page)).entities[0].bar?.paint?.[key]).toBeUndefined();
  expect((await d.saved(page)).bar).toEqual(saved.bar);
 }
});

test('standalone: editing inherited Severity into entity grouped Segments keeps percent coordinates',async({page})=>{
 const severity=[{from:0,to:100,color:'red'}];
 const editor=await d.mount(page,'standalone',{type:'custom:sensor-bar-card-plus',scale:{min:0,max:200},severity,
  entities:[{entity:'sensor.power',bar:{paint:{}}}]});
 await d.openSection(editor,{section:'Segments',scope:'entity'});
 const color=editor.locator('input[data-kind="entity-segment-color"][data-index="0"]').first();
 await d.commit(page,editor,()=>d.colorPicker(color,'#abcdef'));
 expect((await d.saved(page)).entities[0].bar.paint.segments).toEqual([{from:'0%',to:'100%',color:'#abcdef'}]);
 expect((await d.saved(page)).severity).toEqual(severity);
 await d.reopen(page,editor);await d.openSection(editor,{section:'Segments',scope:'entity'});
 await expect(editor.locator('input[data-kind="entity-segment-from"]').first()).toHaveValue('0%');
 await expect(editor.locator('input[data-kind="entity-segment-to"]').first()).toHaveValue('100%');
 await d.commit(page,editor,()=>editor.locator('#entity-0-segments-inherit').check());
 expect((await d.saved(page)).entities[0].bar?.paint?.segments).toBeUndefined();
 expect((await d.saved(page)).severity).toEqual(severity);
});

for(const host of hosts)test(`${host}: Paint preset selection and clearing preserve local properties`,async({page})=>{
 const config=d.seed(host);config.bar.paint={preset:'night',opacity:35,future:{keep:true}};config.bar.direction='reverse';
 if(host==='standalone')config.entities[0].bar.paint={preset:'night',opacity:25,local:{keep:true}};
 const editor=await d.mount(page,host,config);await d.openSection(editor,{section:'Bar Appearance'});
 const clear=editor.locator('#card-paint-editor button[data-action="clear-paint-property"][data-property="opacity"]');
 await d.commit(page,editor,()=>clear.click());
 expect((await d.saved(page)).bar.paint).toEqual({preset:'night',future:{keep:true}});
 expect((await d.saved(page)).bar.direction).toBe('reverse');
 const preset=editor.locator('#bar-paint-preset');
 await d.commit(page,editor,()=>preset.selectOption(''));
 expect((await d.saved(page)).bar.paint).toEqual({future:{keep:true}});
 if(host==='standalone'){
  await d.openSection(editor,{section:'Bar Appearance',scope:'entity'});
  await d.commit(page,editor,()=>editor.locator('#entity-0-bar-paint-preset').selectOption(''));
  expect((await d.saved(page)).entities[0].bar.paint).toEqual({opacity:25,local:{keep:true}});
  expect((await d.saved(page)).bar.direction).toBe('reverse');
 }
});
