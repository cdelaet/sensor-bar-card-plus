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
  if(host==='feature'){await editor.locator('#feature-entity-override').check();await collect();}
  for(const mode of ['entity','entity-fallback','percent','fixed']) {await ref(rootRows(editor).nth(1),'source-mode').selectOption(mode);await collect();}
  if(host==='standalone'){
   await d.openDisclosure(editor.locator('[data-action="toggle-entity-overrides"]').first());
   await d.openDisclosure(editor.locator('#entity-0-group-markers'));
   await collect();
  }
  await d.mount(page,host,d.seed(host),{picker:true});await collect();
  const declared=new Set(inventory.filter(c=>c.hosts.includes(host)).map(c=>c.id));
  expect([...discovered].filter(id=>!declared.has(id)),'new controls need manifest entries and real journeys').toEqual([]);
  expect([...declared].filter(id=>!discovered.has(id)), 'conditional inventory fixture must mount every declared ID').toEqual([]);
  // A new routed control cannot silently pass discovery.
  await editor.evaluate(el=>{const input=document.createElement('input');input.dataset.field='uncovered-example';el.shadowRoot.append(input);});
  expect((await d.discover(editor)).filter(id=>!declared.has(id))).toEqual(['field:uncovered-example']);
  const journeys=new Set(['fields','sources','palettes','inheritance','entities','pickers','disclosures','references']);
  for(const entry of inventory.filter(c=>c.hosts.includes(host)))expect(journeys.has(entry.journey),entry.id).toBe(true);
 });
 test(`${host}: disclosures retain state through echo and normal close/reopen`,async({page})=>{
  const editor=await d.mount(page,host);await expect(editor.locator('.card-subgroup[data-expanded="true"]')).toHaveCount(0);
  for(const group of Object.values(groups)){
   const button=editor.locator(`#card-group-${group}`);await d.openDisclosure(button);await d.echo(page,editor);await expect(button).toHaveAttribute('aria-expanded','true');await d.closeDisclosure(button);await d.openDisclosure(button);
  }
  await refs(editor);const row=rootRows(editor).nth(1);await d.commit(page,editor,()=>ref(row,'label-text').fill('Marker Two'));await expect(row).toHaveAttribute('data-expanded','true');
  await d.closeDisclosure(row.locator('.generic-marker-toggle'));await d.openDisclosure(row.locator('.generic-marker-toggle'));
 });
 test(`${host}: foreign config resets owned numeric/palette drafts and Reference identities`,async({page})=>{
  const editor=await d.mount(page,host);await refs(editor);const row=rootRows(editor).nth(1);await ref(row,'source-mode').selectOption('percent');const input=ref(row,'percent');
  await input.fill('');await d.echo(page,editor);await expect(input).toHaveValue('');const events=await d.count(page);
  const replacement=await d.saved(page);replacement.markers=[{at:'35%',label:{text:'Foreign'}}];replacement.future={keep:'foreign'};
  await d.foreign(editor,replacement);await expect(rootRows(editor)).toHaveCount(1);await expect(rootRows(editor).first()).toHaveAttribute('data-expanded','false');
  await d.openDisclosure(rootRows(editor).first().locator('.generic-marker-toggle'));await expect(ref(rootRows(editor).first(),'percent')).toHaveValue('35');expect(await d.count(page)).toBe(events);
  await d.openDisclosure(editor.locator('#card-group-segments'));const from=editor.locator('[data-kind="segment-from"]').first();await from.fill('-.');await from.press('Tab');await d.echo(page,editor);await expect(from).toHaveValue('-.');
  replacement.bar.segments=[{from:10,to:100,color:'#abcdef'}];await d.foreign(editor,replacement);await expect(from).toHaveValue('10');
 });
 for(const nested of [false,true]) {
  test(`${host} ${nested?'dialog':'page'} Journey A — incomplete Percentage belongs to Marker 2`,async({page})=>{
   const editor=await d.mount(page,host,d.seed(host),{tall:true,nested});await refs(editor);const row=rootRows(editor).nth(1),source=ref(row,'source-mode');
   await d.commit(page,editor,()=>source.selectOption('percent'));const id=await row.getAttribute('data-marker-ui-id');const input=ref(row,'percent');await expect(input).toHaveValue('50');
   const originalFirst=(await d.saved(page)).markers[0];await input.focus();await d.replaceNumericDraft(page,editor,input,'75','percentage');
   await expect(source).toHaveValue('percent');await expect(row).toHaveAttribute('data-marker-ui-id',id);await expect(row).toHaveAttribute('data-expanded','true');await expect(input).toBeFocused();await nearby(input,nested);
   const config=await d.saved(page);expect(config.markers[1].at).toBe('75%');expect(config.markers[0]).toEqual(originalFirst);
   await d.reopen(page,editor);await refs(editor);await expect(ref(rootRows(editor).nth(1),'percent')).toHaveValue('75');
  });
  test(`${host} ${nested?'dialog':'page'} Journey B — Marker 2/3 Source ownership and viewport`,async({page})=>{
   const editor=await d.mount(page,host,d.seed(host),{tall:true,nested});await refs(editor);const ids=await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId));expect(new Set(ids).size).toBe(3);
   for(const index of [1,2]){
    const row=rootRows(editor).nth(index),source=ref(row,'source-mode');await source.scrollIntoViewIfNeeded();await source.focus();
    const before=await page.evaluate(nested=>nested?document.querySelector('#mount').scrollTop:scrollY,nested);
    await source.evaluate(el=>window.__acceptanceSource=el);await row.evaluate(el=>window.__acceptanceRow=el);
    for(const mode of ['percent','entity','fixed','entity','percent','fixed','entity-fallback']){
     await d.commit(page,editor,()=>source.selectOption(mode));await expect(source).toHaveValue(mode);await expect(source).toBeFocused();await expect(row).toHaveAttribute('data-expanded','true');await nearby(source,nested);
     expect(await rootRows(editor).evaluateAll(nodes=>nodes.map(n=>n.dataset.markerUiId))).toEqual(ids);
     expect(await source.evaluate(el=>el===window.__acceptanceSource)).toBe(true);expect(await row.evaluate(el=>el===window.__acceptanceRow)).toBe(true);
     const scroll=await page.evaluate(nested=>nested?document.querySelector('#mount').scrollTop:scrollY,nested);expect(scroll).toBeGreaterThan(before/2);
     await expect(ref(row,'percent')).toHaveCount(mode==='percent'?1:0);await expect(ref(row,'fixed')).toHaveCount(mode==='fixed'?1:0);
    }
    await d.replaceNumericDraft(page,editor,ref(row,'fallback'),'85');await d.commit(page,editor,()=>ref(row,'entity').fill(`sensor.marker_${index}`));
    expect((await d.saved(page)).markers[index].at).toMatchObject({fixed:85,entity:`sensor.marker_${index}`});
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
 const editor=await d.mount(page,host),section=family==='segment'?'Segments':'Gradient Stops',entry={section,scope};await d.openSection(editor,entry);
 const prefix=scope==='entity'?'entity-':'',kind=name=>editor.locator(`[data-kind="${prefix}${family}-${name}"]${scope==='entity'?'[data-index="0"]':''}`).first();
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
  const raw=d.seed(host);await d.foreign(editor,raw);await d.openSection(editor,entry);
  const fallback=kind('color-text-fallback');await d.commit(page,editor,()=>fallback.fill('#778899'));expect(d.read(await d.saved(page),configPath)[0].color).toBe('#778899');
 }
 const draftPos=kind(`draft-${family==='segment'?'from':'pos'}`);await draftPos.fill(family==='segment'?'100%':'60');
 if(family==='segment')await kind('draft-to').fill('150%');
 if(family==='gradient'){const draftColor=kind('draft-color-text-fallback');const events=await d.count(page);await draftColor.fill('#abcdef');await kind('draft-color').focus();await d.echo(page,editor);expect(await d.count(page)).toBe(events);await expect(kind('draft-color')).toHaveValue('#abcdef');}
 await d.colorPicker(kind('draft-color'),'#aabbcc');
 if(family==='segment'&&host==='feature')await kind('draft-color-text-fallback').fill('var(--some-theme-color)');
 const events=await d.count(page);await d.echo(page,editor);expect(await d.count(page)).toBe(events);
 const action=(verb)=>editor.locator(`[data-action="${verb}-${scope==='entity'?'entity-':''}${family==='segment'?'segment':'gradient-stop'}"]${scope==='entity'?'[data-index="0"]':''}`);
 await d.commit(page,editor,()=>action('add').click());expect(d.read(await d.saved(page),configPath)).toHaveLength(3);
 await draftPos.fill(family==='segment'?'150%':'80');if(family==='segment')await kind('draft-to').fill('200%');await draftPos.press('Enter');await d.echo(page,editor);expect(d.read(await d.saved(page),configPath)).toHaveLength(4);
 const second=editor.locator(`[data-kind="${prefix}${family}-${family==='segment'?'from':'pos'}"]${scope==='entity'?'[data-index="0"]':''}`).nth(1);
 await d.commit(page,editor,async()=>{await second.fill(family==='segment'?'55':'90');await second.press('Tab');});
 const rows=d.read(await d.saved(page),configPath);if(host==='feature'){expect(rows[0].future).toBe('first');expect(rows[1].future).toBe('second');} // Standalone deliberately canonicalizes palette rows.
 await d.commit(page,editor,()=>action('remove').first().click());expect(d.read(await d.saved(page),configPath)).toHaveLength(3);
 const result=d.read(await d.saved(page),configPath);await d.reopen(page,editor);await d.openSection(editor,entry);await expect(kind(family==='segment'?'from':'pos')).toHaveValue(String(family==='segment'?result[0].from:result[0].pos));
 // Neither palette exposes reordering buttons; preserve its existing array order.
 expect(await editor.locator(`[data-action^="move-${family}"]`).count()).toBe(0);
 if(host==='feature'&&family==='segment'){
  const autoConfig=d.seed(host);await d.foreign(editor,autoConfig);await d.openSection(editor,entry);const to=editor.locator('[data-kind="segment-to"]').last();await d.commit(page,editor,async()=>{await to.fill('90%');await to.press('Tab');});expect(d.read(await d.saved(page),configPath).at(-1).to).toBe('90%');await d.commit(page,editor,async()=>{await to.fill('');await to.press('Tab');});expect(d.read(await d.saved(page),configPath).at(-1).to).toBeUndefined();await d.reopen(page,editor);await d.openSection(editor,entry);await expect(editor.locator('[data-kind="segment-to"]').last()).toHaveValue('');
 }
 expect((await d.saved(page)).future).toEqual(original.future);
});
for(const key of ['target','baseline'])test(`feature ${key}: supported Source modes, percentage drafts, scalar/object preservation and clear`,async({page})=>{
 const config=d.seed('feature');config[key].at={value:25,future:'source metadata'};const editor=await d.mount(page,'feature',config);await d.openSection(editor,{section:key==='target'?'Target':'Baseline'});
 const source=editor.locator(`#${key}-source-mode`);
 for(const mode of ['entity','percent','fixed','percent','entity','entity-fallback','fixed']){
  await source.focus();await d.commit(page,editor,()=>source.selectOption(mode));await expect(source).toHaveValue(mode);await expect(source).toBeFocused();
  const raw=(await d.saved(page))[key].at;expect(raw.future).toBe('source metadata');
  if(mode==='percent')expect(raw.percent).toBe(50);if(mode==='fixed')expect(raw.entity).toBeUndefined();
 }
 await d.commit(page,editor,()=>source.selectOption('percent'));await d.replaceNumericDraft(page,editor,editor.locator(`#${key}-percent`),'75','percentage');expect((await d.saved(page))[key].at.percent).toBe(75);
 await d.commit(page,editor,()=>editor.locator(`[data-action="${key}-clear-percent"]`).click());expect((await d.saved(page))[key].at.percent).toBeUndefined();
 const foreign=d.seed('feature');foreign[key].at='40%';await d.foreign(editor,foreign);await d.openSection(editor,{section:key==='target'?'Target':'Baseline'});
 await d.commit(page,editor,()=>editor.locator(`#${key}-percent`).fill('65'));expect((await d.saved(page))[key].at).toBe('65%');await d.reopen(page,editor);await d.openSection(editor,{section:key==='target'?'Target':'Baseline'});await expect(editor.locator(`#${key}-percent`)).toHaveValue('65');
 if(key==='baseline'){await d.commit(page,editor,()=>editor.locator('[data-action="remove-baseline"]').click());expect((await d.saved(page)).baseline).toBeUndefined();}
});
for(const host of hosts)test(`${host}: entity ownership and structural persistence`,async({page})=>{
 const editor=await d.mount(page,host);
 if(host==='feature'){
  expect((await d.saved(page)).entity).toBeUndefined();const override=editor.locator('#feature-entity-override');await override.check();expect((await d.saved(page)).entity).toBeUndefined();
  await d.commit(page,editor,()=>editor.locator('[data-kind="feature-entity-source"]').fill('sensor.override'));expect((await d.saved(page)).entity).toBe('sensor.override');await d.reopen(page,editor);await expect(override).toBeChecked();
  await d.commit(page,editor,()=>override.uncheck());expect((await d.saved(page)).entity).toBeUndefined();await d.reopen(page,editor);await expect(override).not.toBeChecked();await expect(editor.locator('[data-kind="feature-entity-source"]')).toHaveCount(0);
 }else{
  await d.commit(page,editor,()=>editor.locator('[data-action="add-entity"]').click());expect((await d.saved(page)).entities).toHaveLength(3);
  const name=index=>editor.locator(`[data-kind="entity-name"][data-index="${index}"]`);
  await d.commit(page,editor,()=>name(2).fill('Third'));
  await d.commit(page,editor,()=>editor.locator('[data-action="duplicate-entity"][data-index="2"]').click());expect((await d.saved(page)).entities).toHaveLength(4);
  await d.commit(page,editor,()=>editor.locator('[data-action="move-entity-up"][data-index="2"]').click());await expect(name(1)).toHaveValue('Third');
  await d.commit(page,editor,()=>editor.locator('[data-action="move-entity-down"][data-index="1"]').click());
  await d.commit(page,editor,()=>editor.locator('[data-action="remove-entity"][data-index="0"]').click());await d.reopen(page,editor);await expect(name(0)).toHaveValue('Other');
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
 const before=await d.saved(page);await d.commit(page,editor,()=>ref(row,'source-mode').selectOption('percent'));await d.replaceNumericDraft(page,editor,ref(row,'percent'),'75','percentage');
 expect((await d.saved(page)).entities[0].markers[0].at).toBe('75%');expect((await d.saved(page)).markers).toEqual(before.markers);expect((await d.saved(page)).entities[1]).toEqual(before.entities[1]);
 await d.reopen(page,editor);await d.openSection(editor,{scope:'entity',section:'References'});await expect(ref(row,'percent')).toHaveValue('75');
});
for(const host of hosts)test(`${host}: Needle mode respects the host Baseline cleanup policy`,async({page})=>{
 const config=d.seed(host),editor=await d.mount(page,host,config);await d.commit(page,editor,()=>editor.locator('#bar-needle-mode').selectOption('disabled'));await d.commit(page,editor,()=>editor.locator('#bar-needle-mode').selectOption('enabled'));
 if(host==='feature')expect((await d.saved(page)).baseline).toEqual(config.baseline);else expect((await d.saved(page)).baseline).toBeUndefined();
});
test('standalone: Target inheritance preserves its established selective reset semantics',async({page})=>{
 const config=d.seed('standalone');config.entities[0].target.label.precision=3;const editor=await d.mount(page,'standalone',config);await d.openSection(editor,{section:'Target',scope:'entity'});
 await d.commit(page,editor,()=>editor.locator('[data-kind="entity-target-inherit"]').first().click());
 expect((await d.saved(page)).entities[0].target).toEqual({label:{text:'Label',precision:3},future:'marker metadata'});
 await expect(editor.locator('#entity-0-target-inherit')).not.toBeChecked();
 await d.reopen(page,editor);await d.openSection(editor,{section:'Target',scope:'entity'});await expect(editor.locator('#entity-0-target-label-text')).toHaveValue('Label');
});
for(const host of hosts)test(`${host}: blank numeric blur resets formatting and precision deliberately`,async({page})=>{
 const editor=await d.mount(page,host);await d.openSection(editor,{section:'Target'});
 for(const [id,path] of [['#formatting-decimal','formatting.decimal'],['#target-label-precision','target.label.precision']]){
  const input=editor.locator(id),events=await d.count(page);await input.fill('');await d.echo(page,editor);expect(await d.count(page)).toBe(events);
  await d.commit(page,editor,()=>input.press('Tab'));expect(d.read(await d.saved(page),path)).toBeUndefined();await d.reopen(page,editor);await d.openSection(editor,{section:'Target'});await expect(editor.locator(id)).toHaveValue('');
 }
});
test('feature: foreign config replaces an owned invalid CSS draft without emission',async({page})=>{
 const editor=await d.mount(page,'feature'),input=editor.locator('#bar-color-text-fallback'),events=await d.count(page);await input.fill('rgb(');await d.echo(page,editor);await expect(input).toHaveValue('rgb(');expect(await d.count(page)).toBe(events);
 const config=await d.saved(page);config.bar.color='blue';await d.foreign(editor,config);await expect(input).toHaveValue('blue');await expect(input).toHaveAttribute('aria-invalid','false');expect(await d.count(page)).toBe(events);
});
for(const host of hosts)test(`${host}: explicit Remove Baseline emits, echoes and persists without changing Needle`,async({page})=>{
 const editor=await d.mount(page,host);await d.openSection(editor,{section:'Baseline'});const needle=(await d.saved(page)).bar.needle;
 await d.commit(page,editor,()=>editor.locator('[data-action="remove-baseline"][data-scope-type="card"]').click());expect((await d.saved(page)).baseline).toBeUndefined();expect((await d.saved(page)).bar.needle).toEqual(needle);
 await d.reopen(page,editor);await d.openSection(editor,{section:'Baseline'});await expect(editor.locator('#baseline-value')).toHaveValue('');
});
