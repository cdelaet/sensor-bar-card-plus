import { describe, it, expect } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
const type='custom:sensor-bar-card-plus-feature',root={type:'card'};
const metadata=()=>({future:{nested:[undefined,{keep:true}],unset:undefined},unset:undefined});
const raw=()=>({type,...metadata(),scale:{min:-100,max:100},
 bar:{animated:false,fill_style:'band_gradient',solid_fill:false,color:'#123456',needle:{show:true,color:'#abcdef',...metadata()},segments:[{from:-100,color:'var(--low)',...metadata()},{from:'50%',color:'orange',...metadata()},{from:60,color:'red',...metadata()}],gradient_stops:[{pos:0,color:'#123456'},{pos:100,color:'#abcdef'}],...metadata()},
 baseline:{at:{percent:35,...metadata()},above:{color:'red',...metadata()},below:{color:'blue',...metadata()},...metadata()},
 target:{at:{percent:75,...metadata()},shape:'triangle',direction:'outward',color:'orange',label:{show:true,text:'Limit',precision:1,...metadata()},when_exceeded:{fill_color:'red',...metadata()},...metadata()},
 peak:{enabled:true,color:'red',reset:'daily',...metadata()},floor:{enabled:true,color:'blue',...metadata()},
 markers:[{at:'25%',color:'red',show_marker:false,label:{show:true,entity:'sensor.label',...metadata()},...metadata()}],formatting:{unit:'W',decimal:1},animated:false});
async function setup(source,config=raw(),picker=false) {
 const calls=[],classes=loadCardClass({source,withEntityPicker:picker,CSS:{supports:(property,value)=>{calls.push([property,value]);return !['var(','rgb(','bogus'].includes(value);}}}),editor=new classes.featureEditor(),events=[];
 editor.dispatchEvent=event=>{events.push(event.detail.config);editor.setConfig(event.detail.config);return true;};
 editor.setConfig(config);editor.context={entity_id:'sensor.parent'};editor.hass={states:{}};await editor.updateComplete;
 return {editor,events,classes,calls};
}
async function edit(editor,id,value,eventType='input') {
 const control=editor.shadowRoot.querySelector(id);expect(control).toBeTruthy();
 if(control.type==='checkbox')control.checked=value;else control.value=value;
 editor._handleField({type:eventType,target:control});await editor.updateComplete;return control;
}
async function segment(editor,field,index,value,eventType='change') {
 const control=editor.shadowRoot.querySelectorAll(`input[data-kind="segment-${field}"]`)[index];expect(control).toBeTruthy();control.value=value;
 editor._handleField({type:eventType,target:control});await editor.updateComplete;return control;
}
function expectedAt(config,path,value) {const next=structuredClone(config);let node=next;for(const part of path.slice(0,-1))node=node[part];if(value===undefined)delete node[path.at(-1)];else node[path.at(-1)]=value;return next;}
for(const source of ['src','dist']) describe(`Feature capability closure (${source})`,()=>{
 for(const [config,checked] of [[{type},true],[{type,bar:{animated:true}},true],[{type,bar:{animated:false}},false],[{type,animated:false},false],[{type,animated:false,bar:{animated:true}},true]]) it(`animation opens without emission for ${JSON.stringify(config)}`,async()=>{
  const {editor,events}=await setup(source,config);expect(editor.shadowRoot.querySelector('#bar-animated').checked).toBe(checked);expect(editor._config).toEqual(config);expect(events).toHaveLength(0);
 });
 it('animation patches only the canonical field, preserving aliases/metadata, and does not materialize omitted true',async()=>{
  const config=raw(),{editor,events}=await setup(source,config);await edit(editor,'#bar-animated',true);
  expect(editor._config).toEqual(expectedAt(config,['bar','animated'],true));expect(editor._config.animated).toBe(false);expect(events).toHaveLength(1);
  await edit(editor,'#bar-fill-style','bands','change');expect(editor._config.bar.animated).toBe(true);expect(editor._config.markers).toEqual(config.markers);
  const empty=await setup(source,{type});await edit(empty.editor,'#bar-animated',true);expect(empty.events).toHaveLength(0);
  await edit(empty.editor,'#bar-animated',false);await edit(empty.editor,'#bar-animated',true);expect(empty.editor._config).toEqual({type});expect(empty.events).toHaveLength(2);
 });
 for(const key of ['target','baseline']) {
  for(const at of [' 50% ',{percent:50,...metadata()},{percent:50,fixed:5,entity:'sensor.reference',...metadata()}])it(`${key} percentage edits preserve source form/components and all marker siblings`,async()=>{
   const config=raw();config[key].at=at;const {editor,events}=await setup(source,config);expect(events).toHaveLength(0);
   await edit(editor,`#${key}-percent`,'0');const first=typeof at==='string'?'0%':{...at,percent:0};expect(editor._config).toEqual(expectedAt(config,[key,'at'],first));
   await edit(editor,`#${key}-percent`,'100');expect(editor._config[key].at).toEqual(typeof at==='string'?'100%':{...at,percent:100});
  });
  it(`${key} explicit mode conversions own recognized components, keeping metadata, labels and paint`,async()=>{
   const config=raw();config[key].at={entity:'sensor.reference',value:25,...metadata()};const {editor}=await setup(source,config);
   for(const [mode,at] of [['percent',{percent:50,...metadata()}],['fixed',{fixed:50,...metadata()}],['entity',{entity:'',...metadata()}],['entity-fallback',{fixed:50,entity:'',...metadata()}]]){
    await edit(editor,`#${key}-source-mode`,mode,'change');expect(editor._config).toEqual(expectedAt(config,[key,'at'],at));
   }
   for(const input of [25,'sensor.reference','50%']){
    const fresh=raw();fresh[key].at=input;editor.setConfig(fresh);await editor.updateComplete;
    await edit(editor,`#${key}-source-mode`,'percent','change');expect(editor._config[key].at).toBe('50%');
    await edit(editor,`#${key}-source-mode`,'fixed','change');expect(editor._config[key].at).toBe(50);
    await edit(editor,`#${key}-source-mode`,'entity','change');expect(editor._config[key].at).toEqual({entity:''});
   }
  });
  it(`${key} invalid/incomplete percent stays local through echo/context, and clear owns percent only`,async()=>{
   const config=raw(),{editor,events}=await setup(source,config);
   for(const invalid of ['-1','101','','-','1e']){
    await edit(editor,`#${key}-percent`,invalid);expect(editor._config).toEqual(config);expect(events).toHaveLength(0);
    editor.setConfig(editor._config);editor.context={entity_id:'sensor.changed'};await editor.updateComplete;expect(editor.shadowRoot.querySelector(`#${key}-percent`).value).toBe(invalid);
   }
   await edit(editor,`#${key}-percent`,'42.5');expect(editor._config[key].at.percent).toBe(42.5);expect(events).toHaveLength(1);
   editor[`_${key}Section`].handleClick({dataset:{action:`${key}-clear-percent`}});await editor.updateComplete;
   expect(editor._config[key].at).toEqual(metadata());expect(events).toHaveLength(2);
   await edit(editor,`#${key}-percent`,'-1');editor.setConfig({type,[key]:{at:'0%'}});await editor.updateComplete;expect(editor.shadowRoot.querySelector(`#${key}-percent`).value).toBe('0');
  });
 }
 for(const starts of [[0,50,80],['0%','50%','80%'],[-100,'50%',60]])it(`auto ends use the current scale for ${JSON.stringify(starts)} without materialization`,async()=>{
  const config=raw();config.scale=starts[0]===-100?{min:-100,max:100}:{min:0,max:100};config.bar.segments=config.bar.segments.map((row,i)=>({...row,from:starts[i]}));
  const {editor,events}=await setup(source,config),section=editor._segmentsSection;
  expect(events).toHaveLength(0);expect(editor._config).toEqual(config);
  for(let i=0;i<3;i++)expect(section._getSegmentRowValidationMessage(root,i)).toBe('');
  expect(section._getSegmentPreviewRows(root).map(row=>[row.from,row.to])).toEqual([[0,50],[50,80],[80,100]]);
  const untouched=editor._config.bar.segments[1];await segment(editor,'color-text-fallback',0,'green');expect(editor._config.bar.segments[1]).toBe(untouched);
  expect(editor._config.bar.segments.every(row=>!Object.hasOwn(row,'to'))).toBe(true);
  await segment(editor,'to',0,starts[1]===50?'40':'40%');expect(editor._config.bar.segments[0].to).toBe(starts[1]===50?40:'40%');
  await segment(editor,'to',0,'');expect(Object.hasOwn(editor._config.bar.segments[0],'to')).toBe(false);expect(editor._config.bar.segments[0].color).toBe('green');
  expect(editor._config.markers).toEqual(config.markers);expect(Object.hasOwn(editor._config.bar.segments[0].future,'unset')).toBe(true);
 });
 it('auto final end, null ends, add/remove and invalid geometry keep raw order and local drafts',async()=>{
  const config=raw();config.bar.segments=[{from:0,to:null,color:'red',...metadata()},{from:50,to:75,color:'orange',...metadata()}];config.scale={min:0,max:100};
  const {editor,events}=await setup(source,config),section=editor._segmentsSection;
  expect(section._getSegmentRowValidationMessage(root,0)).toBe('');expect(editor._config.bar.segments[0].to).toBeNull();
  section._setSegmentDraftField(root,'from','80');section._setSegmentDraftField(root,'to','');section._setSegmentDraftField(root,'color','var(--high)');
  expect(section._getValidSegmentDraft(root)).toEqual({from:80,color:'var(--high)'});section._commitSegmentDraft(root);await editor.updateComplete;
  expect(editor._config.bar.segments).toEqual([...config.bar.segments,{from:80,color:'var(--high)'}]);
  section.handle({type:'click',target:{dataset:{action:'remove-segment',index:'2'}}});await editor.updateComplete;expect(editor._config).toEqual(config);
  const count=events.length;await segment(editor,'to',0,'70');expect(editor._config).toEqual(config);expect(section._getSegmentRowValidationMessage(root,0)).toBe('Segments overlap.');expect(events).toHaveLength(count);
  await segment(editor,'to',0,'-1');expect(editor._config).toEqual(config);
 });
 it('auto end resolution tracks dynamic scale without config emissions and reports reversed configured order',async()=>{
  const config=raw();config.scale={min:{entity:'sensor.min',fixed:0},max:{entity:'sensor.max',fixed:200}};config.bar.segments=[{from:0,color:'red'},{from:50,color:'orange'}];
  const {editor,events}=await setup(source,config);expect(editor._segmentsSection._getSegmentPreviewRows(root).map(r=>r.from)).toEqual([0,25]);
  editor.hass={states:{'sensor.min':{state:'0'},'sensor.max':{state:'100'}}};await editor.updateComplete;
  expect(editor._segmentsSection._getSegmentPreviewRows(root).map(r=>r.from)).toEqual([0,50]);expect(events).toHaveLength(0);
  editor.setConfig({type,bar:{fill_style:'bands',segments:[{from:80,color:'red'},{from:0,color:'blue'}]}});await editor.updateComplete;
  expect(editor._segmentsSection._getSegmentRowValidationMessage(root,0)).toBe('From must be below To.');expect(editor._config.bar.segments.map(r=>r.from)).toEqual([80,0]);
 });
 const colors=[['bar-color-text-fallback',['bar','color']],['bar-needle-color-text-fallback',['bar','needle','color']],['baseline-above-color-text-fallback',['baseline','above','color']],['baseline-below-color-text-fallback',['baseline','below','color']],['target-color-text-fallback',['target','color']],['target-above-fill-color-text-fallback',['target','when_exceeded','fill_color']],['peak-color-text-fallback',['peak','color']],['floor-color-text-fallback',['floor','color']],['card-card-generic-marker-1-color-text-fallback',['markers',0,'color']]];
 for(const [id,path] of colors)it(`${id} accepts direct CSS text verbatim, patches one path and retains invalid drafts`,async()=>{
  const config=raw(),{editor,events,calls}=await setup(source,config);
  for(const color of ['#123456','#abc','red','rgb(1, 2, 3)','var(--warning-color)','  rgba(1, 2, 3, .5)  ']){
   await edit(editor,`#${id}`,color);expect(editor._config).toEqual(expectedAt(config,path,color));
  }
  const toggle=id.startsWith('baseline-')?id.replace('-text-fallback','-enabled'):id==='target-above-fill-color-text-fallback'?'target-above-fill-enabled':null;
  if(toggle){const before=structuredClone(editor._config);await edit(editor,`#${toggle}`,false,'change');await edit(editor,`#${toggle}`,true,'change');expect(editor._config).toEqual(before);}
  const saved=structuredClone(editor._config),count=events.length;await edit(editor,`#${id}`,'var(');editor.context={entity_id:'sensor.changed'};editor.setConfig(editor._config);await editor.updateComplete;
  expect(editor._config).toEqual(saved);expect(events).toHaveLength(count);expect(editor.shadowRoot.querySelector(`#${id}`).value).toBe('var(');expect(calls).toContainEqual(['color','var(']);
 });
 it('Segment CSS drafts stay local through echo and reset on replacement, while hex Gradient Stops do not gain CSS entry',async()=>{
  const {editor,events}=await setup(source);const control=editor.shadowRoot.querySelector('#segment-color-0-text-fallback');
  await edit(editor,'#segment-color-0-text-fallback','rgb(');expect(events).toHaveLength(0);editor.hass={states:{}};await editor.updateComplete;expect(editor.shadowRoot.querySelector('#segment-color-0-text-fallback')).toBe(control);expect(control.value).toBe('rgb(');
  await edit(editor,'#segment-draft-color-text-fallback','bogus');expect(editor._segmentsSection._getValidSegmentDraft(root)).toBeNull();
  editor.setConfig({type,bar:{fill_style:'bands',segments:[{from:0,color:'blue'}]}});await editor.updateComplete;expect(editor.shadowRoot.querySelector('#segment-color-0-text-fallback').value).toBe('blue');expect(editor._cssColorDrafts.size).toBe(0);
  await edit(editor,'#bar-fill-style','gradient','change');expect(editor.shadowRoot.innerHTML).not.toContain('data-kind="gradient-color-text-fallback"');expect(editor.shadowRoot.innerHTML).not.toContain('data-kind="gradient-draft-color-text-fallback"');
 });
});
it('all four capabilities have exact source/dist template parity in picker/fallback environments',async()=>{
 for(const picker of [false,true])for(const config of [{type},raw(),{type,bar:{animated:true,fill_style:'gradient'},target:{at:'0%'},baseline:{at:'100%'}}]){
  const a=await setup('src',config,picker),b=await setup('dist',config,picker);expect(a.editor.shadowRoot.innerHTML).toBe(b.editor.shadowRoot.innerHTML);
  expect(Object.keys(a.editor._createSectionContext()).sort()).toEqual(['mutate','read','setSource','source']);
 }
});
