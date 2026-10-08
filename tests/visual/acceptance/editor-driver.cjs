const { expect } = require('@playwright/test');
const { groups, selector } = require('./control-manifest.cjs');
const marker = () => ({ at: { fixed: 50 }, color: 'red', label: { show: true, text: 'Label', precision: 1 }, future: 'marker metadata' });
function seed(host) {
  const physical = { scale: { min: { fixed: 0 }, max: { fixed: 100 } },
    target: { ...marker(), enabled: true, when_exceeded: { fill_color: 'red' } },
    peak: { enabled: true, color: 'red', label: { show: true, text: 'Peak', precision: 1 } },
    floor: { enabled: true, color: 'red', label: { show: true, text: 'Floor', precision: 1 } },
    markers: Array.from({ length: 3 }, marker), baseline: { enabled: true, at: { fixed: 20 }, above: { color: 'red' }, below: { color: 'blue' } },
    bar: { fill_style: 'bands', color: 'red', needle: { show: true, color: 'red' },
      segments: [{ from: 0, to: 50, color: '#112233', future: 'first' }, { from: 50, to: 100, color: '#445566', future: 'second' }],
      gradient_stops: [{ pos: 0, color: 'red', future: 'first' }, { pos: 100, color: 'red', future: 'second' }] },
    formatting: { unit: 'W', decimal: 2 } };
  return { type: `custom:sensor-bar-card-plus${host === 'feature' ? '-feature' : ''}`, ...physical, future: { keep: true },
    ...(host === 'standalone' ? { title: 'Power', layout: { height: 32, label: { position: 'hero', width: 150 }, hero: { value_size: 80 } },
      entities: [{ entity: 'sensor.power', ...structuredClone(physical), layout: { height: 32, label: { position: 'hero', width: 150 }, hero: { value_size: 80 } } }, { entity: 'sensor.other', name: 'Other' }] } : {}) };
}
async function mount(page, host, config = seed(host), options = {}) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ host, config, options }) => {
    if (options.picker) customElements.define('ha-entity-picker', class extends HTMLElement {
      constructor() { super(); const root = this.attachShadow({mode:'open'}); root.innerHTML='<input aria-label="Entity picker">';
        root.querySelector('input').addEventListener('input',e=>this.dispatchEvent(new CustomEvent('value-changed',{bubbles:true,composed:true,detail:{value:e.target.value}}))); }
      set value(value) { this.shadowRoot.querySelector('input').value=value??''; }
      get value() { return this.shadowRoot.querySelector('input').value; }
    });
    const tag = host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor';
    await customElements.whenDefined(tag); window.__acceptance={host,tag,saved:structuredClone(config),events:[],echoes:0};
    window.__acceptanceAttach = editor => {
      editor.addEventListener('config-changed',e=> {
        const state=window.__acceptance; state.saved=structuredClone(e.detail.config); state.events.push(structuredClone(e.detail.config));
        editor.setConfig(structuredClone(e.detail.config));
        Promise.resolve().then(async()=>{ await editor.updateComplete; state.echoes++; });
      });
      editor.setConfig(structuredClone(window.__acceptance.saved)); editor.context={entity_id:'sensor.power'}; editor.hass={states:{'sensor.power':{state:'50',attributes:{unit_of_measurement:'W'}}}};
    };
    const editor=document.createElement(tag); window.__acceptanceAttach(editor);
    const container=document.querySelector('#mount'); container.style.width=options.tall?'240px':'600px';
    if(options.nested){container.style.height='500px';container.style.overflow='auto';}
    if(options.tall){const spacer=document.createElement('div');spacer.style.height='850px';container.append(spacer);}
    container.append(editor); await editor.updateComplete;
  }, {host,config,options});
  return page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
}
const saved = page => page.evaluate(()=>structuredClone(window.__acceptance.saved));
const count = page => page.evaluate(()=>window.__acceptance.events.length);
async function echo(page, editor) {
  await editor.evaluate(async el=>{el.setConfig(structuredClone(window.__acceptance.saved)); await el.updateComplete;});
  await expect.poll(()=>page.evaluate(()=>window.__acceptance.echoes)).toBe(await count(page));
}
async function reopen(page,editor) {
 await editor.evaluate(async old=>{const el=document.createElement(window.__acceptance.tag); window.__acceptanceAttach(el);old.replaceWith(el);await el.updateComplete;});
 return editor;
}
async function foreign(editor, config) {
 await editor.evaluate(async (el,config)=>{window.__acceptance.saved=structuredClone(config);el.setConfig(config);await el.updateComplete;},config);
}
async function openDisclosure(control) { if(await control.getAttribute('aria-expanded')==='false') await control.click(); await expect(control).toHaveAttribute('aria-expanded','true'); }
async function closeDisclosure(control) { if(await control.getAttribute('aria-expanded')==='true') await control.click(); await expect(control).toHaveAttribute('aria-expanded','false'); }
async function openSection(editor, entry) {
 if(entry.scope==='entity') {
  await openDisclosure(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));
  const slug={'References':'markers','Bar Appearance':'bar','Gradient Stops':'gradient-stops'}[entry.section]??entry.section.toLowerCase();
  await openDisclosure(editor.locator(`#entity-0-group-${slug}`));
 } else if(groups[entry.section]) await openDisclosure(editor.locator(`#card-group-${groups[entry.section]}`));
 if(entry.section==='References') {
  // data-scope-type lives on fields/buttons rather than the row in old templates.
  const row=entry.scope==='entity'?editor.locator('.override-group:not(.card-subgroup)[data-group="markers"] .generic-marker-item').first():editor.locator('.card-subgroup[data-group="generic-markers"] .generic-marker-item').first();
  if(await row.count())await openDisclosure(row.locator('.generic-marker-toggle'));
 }
}
const control = (editor,entry) => editor.locator(selector(entry)+(entry.name.startsWith('generic-marker-')&&entry.scope!=='entity'?'[data-scope-type="card"]':'')).first();
async function replaceText(input,value) {await input.focus();await input.fill(value);}
async function colorPicker(input,value) {
 // Native color dialogs are OS UI outside Playwright. Drive their normal input
 // event boundary; CSS text journeys use keyboard/editable DOM controls.
 await input.focus();await input.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);
}
async function commit(page,editor,operation) {
 const before=await count(page);await operation();await expect.poll(()=>count(page)).toBeGreaterThan(before);await echo(page,editor);
 return saved(page);
}
async function replaceNumericDraft(page,editor,input,value,policy='native') {
 await input.focus();const before=await saved(page),events=await count(page);await input.fill('');
 await expect(input).toHaveValue('');await expect(input).toBeFocused();await echo(page,editor);
 expect(await saved(page)).toEqual(before);expect(await count(page)).toBe(events);await expect(input).toHaveValue('');
 if(policy==='native'||policy==='percentage') {
  for(const draft of ['-','.','-.']) {
   for(const key of draft)await input.press(key);expect(await saved(page)).toEqual(before);expect(await count(page)).toBe(events);
   await input.fill('');
  }
 }
 await commit(page,editor,async()=>{await input.fill(value);if(policy==='palette')await input.press('Tab');});
 await expect(input).toHaveValue(value);
}
function read(config,path) { return path?.split('.').reduce((value,key)=>value?.[key],config); }
function expectedValue(entry,value,config) {
 const actual=read(config,entry.path);
 if(entry.type==='number') return [actual,Number(value)];
 if(entry.type==='select') {
  if(entry.name.endsWith('mode')) return [actual ?? false,value==='enabled'];
  if(value==='below' && entry.name==='generic-marker-lane') return [actual??'below',value];
  if(value==='circle' && entry.name==='generic-marker-shape') return [actual??'circle',value];
  if(value==='never') return [actual??'never',value];
  if(value==='inward') return [actual??'inward',value];
  if(entry.name.endsWith('shape') && value==='diamond') return [actual??'diamond',value];
  return [actual,value];
 }
 return [actual,value];
}
async function fieldJourney(page,host,entry) {
 const editor=await mount(page,host);await openSection(editor,entry);const input=control(editor,entry),before=await saved(page);
 let value=entry.value;
 if(entry.type==='number') await replaceNumericDraft(page,editor,input,value,entry.drafts);
 else if(entry.type==='checkbox') {
  const initial=await input.isChecked();
  for(const checked of [!initial,initial]) {
   await commit(page,editor,()=>input.setChecked(checked));await expect(input).toBeChecked({checked});
   const config=await saved(page);
   const actual=read(config,entry.path)??(entry.scope==='entity'&&entry.name.includes('-label-')?read(config,entry.path.replace('entities.0.','')):undefined);
   const fallback=/show-(?:value|unit|marker)$/.test(entry.name)||entry.name==='bar-animated';
   expect(typeof actual==='string'?!!actual:actual??fallback,entry.id).toBe(checked);
  }
 } else if(entry.type==='select') {
  for(value of entry.value) {
   await commit(page,editor,()=>input.selectOption(value));await expect(input).toHaveValue(value);
   const [actual,expected]=expectedValue(entry,value,await saved(page));expect(actual,entry.id).toEqual(expected);
  }
 } else if(entry.type==='color') await commit(page,editor,()=>colorPicker(input,value));
 else {
  if(entry.type==='css' && host==='feature') {
   const events=await count(page);await input.fill('rgb(');await expect(input).toHaveAttribute('aria-invalid','true');await echo(page,editor);
   expect(await count(page)).toBe(events);expect(await saved(page)).toEqual(before);await expect(input).toHaveValue('rgb(');
  }
  const values=entry.type==='css'?(host==='feature'?['var(--some-theme-color)','red','#ff8800','rgb(10, 120, 200)']:['var(--some-theme-color)','red','rgb(10, 120, 200)']):[value];
  for(value of values) {
   await commit(page,editor,()=>replaceText(input,value));
   const [actual,expected]=expectedValue(entry,value,await saved(page));expect(actual,entry.id).toEqual(expected);
  }
 }
 if(!['checkbox','select'].includes(entry.type)) {const [actual,expected]=expectedValue(entry,value,await saved(page));expect(actual,entry.id).toEqual(expected);}
 if(entry.type==='number'||entry.type==='text'||entry.type==='entity'||entry.type==='css'&&host==='feature') await expect(input).toBeFocused();
 if(entry.scope==='entity') {const after=await saved(page);expect(after.entities[1]).toEqual(before.entities[1]);expect(after.scale).toEqual(before.scale);expect(after.markers).toEqual(before.markers);}
 expect((await saved(page)).future).toEqual(before.future);
 const state=entry.type==='checkbox'?await input.isChecked():await input.inputValue();
 await reopen(page,editor);await openSection(editor,entry);
 if(entry.type==='checkbox') await expect(control(editor,entry)).toBeChecked({checked:state});
 else await expect(control(editor,entry)).toHaveValue(state);
 if(entry.clear) {
  await commit(page,editor,()=>replaceText(control(editor,entry),''));
  expect(read(await saved(page),entry.path)).toBe(entry.name==='title'?'':undefined);await reopen(page,editor);await openSection(editor,entry);await expect(control(editor,entry)).toHaveValue('');
 }
 return entry.id;
}
async function discover(editor) {
 return editor.evaluate(el=>[...el.shadowRoot.querySelectorAll('input,select,button,ha-entity-picker')].map(n=>{
  const route=n.dataset.field?'field':n.dataset.kind?'kind':n.dataset.action?'action':null;
  return route?`${route}:${n.dataset[route]}`:`UNROUTED:${n.tagName}:${n.id}`;
 }));
}
module.exports={seed,mount,saved,count,echo,reopen,foreign,openDisclosure,closeDisclosure,openSection,control,replaceText,colorPicker,commit,replaceNumericDraft,read,fieldJourney,discover};
