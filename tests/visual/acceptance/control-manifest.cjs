// Canonical editor routing is the inventory ID. Repeat row indexes/DOM nesting
// are deliberately not identity. Values and paths below are acceptance examples,
// not a new product schema. Each entry owns a real browser journey.
const controls = [];
function add(route, name, section, type, path, value, options = {}) {
  controls.push({ id: `${route}:${name}`, route, name, section, type, path, value,
    hosts: ['standalone', 'feature'], drafts: type === 'number' ? 'native' : false,
    conditional: false, echo: true, structural: false, journey: 'fields', ...options });
}
function field(name, section, type, path, value, options) { add('field', name, section, type, path, value, options); }
function kind(name, section, type, path, value, options) { add('kind', name, section, type, path, value, options); }
function color(route, name, section, path, options = {}) {
  add(route, name, section, 'color', path, '#334455', options);
  add(route, `${name}-text-fallback`, section, 'css', path, 'rgb(10, 120, 200)', { conditional: true, ...options });
}
field('title', 'Basics', 'text', 'title', 'Acceptance title', { hosts: ['standalone'], clear: true });
for (const edge of ['min', 'max']) {
  field(`scale-${edge}`, 'Scale', 'number', `scale.${edge}.fixed`, edge === 'min' ? '-75' : '125');
  kind(`scale-${edge}-entity-source`, 'Scale', 'entity', `scale.${edge}.entity`, 'sensor.changed');
}
for (const marker of ['target', 'peak', 'floor']) {
  const section = marker === 'target' ? 'Target' : marker === 'peak' ? 'Peak' : 'Floor';
  if (marker === 'target') {
    field('target-mode', section, 'select', 'target.enabled', ['disabled', 'enabled']);
    field('target-value', section, 'number', 'target.at.fixed', '75');
    kind('target-entity-source', section, 'entity', 'target.at.entity', 'sensor.changed');
    field('target-shape', section, 'select', 'target.shape', ['triangle', 'diamond']);
    field('target-source-mode', section, 'select', null, null, { hosts: ['feature'], conditional: true, journey: 'sources' });
    field('target-percent', section, 'number', null, '75', { hosts: ['feature'], drafts: 'percentage', conditional: true, journey: 'sources' });
    field('target-above-fill-enabled', section, 'checkbox', 'target.when_exceeded.fill_color', null);
    color('field', 'target-above-fill-color', section, 'target.when_exceeded.fill_color');
  } else {
    field(`${marker}-show`, section, 'checkbox', `${marker}.enabled`, null);
    field(`${marker}-reset`, section, 'select', `${marker}.reset`, ['15m', 'daily', 'never']);
  }
  field(`${marker}-direction`, section, 'select', `${marker}.direction`, ['outward', 'inward']);
  color('field', `${marker}-color`, section, `${marker}.color`);
  for (const [suffix, type, value, publicName] of [
    ['show', 'checkbox', null, 'show'], ['text', 'text', 'Energy Target', 'text'],
    ['show-value', 'checkbox', null, 'show_value'], ['show-unit', 'checkbox', null, 'show_unit'],
    ['precision', 'number', '3', 'precision'],
  ]) field(`${marker}-label-${suffix}`, section, type, `${marker}.label.${publicName}`, value, { clear: type === 'text' });
}
field('bar-fill-style', 'Bar Appearance', 'select', 'bar.fill_style', ['gradient', 'soft_bands', 'band_gradient', 'solid']);
field('bar-solid-fill', 'Bar Appearance', 'checkbox', 'bar.solid_fill', null);
field('bar-animated', 'Bar Appearance', 'checkbox', 'bar.animated', null, { hosts: ['feature'] });
color('field', 'bar-color', 'Bar Appearance', 'bar.color');
field('bar-needle-mode', 'Needle', 'select', 'bar.needle.show', ['disabled', 'enabled']);
color('field', 'bar-needle-color', 'Needle', 'bar.needle.color');
field('baseline-mode', 'Baseline', 'select', 'baseline.enabled', ['disabled', 'enabled']);
field('baseline-value', 'Baseline', 'number', 'baseline.at.fixed', '35');
kind('baseline-entity-source', 'Baseline', 'entity', 'baseline.at.entity', 'sensor.changed');
field('baseline-source-mode', 'Baseline', 'select', null, null, { hosts: ['feature'], journey: 'sources', conditional: true });
field('baseline-percent', 'Baseline', 'number', null, '75', { hosts: ['feature'], journey: 'sources', drafts: 'percentage', conditional: true });
for (const side of ['above', 'below']) {
  field(`baseline-${side}-color-enabled`, 'Baseline', 'checkbox', `baseline.${side}.color`, null);
  color('field', `baseline-${side}-color`, 'Baseline', `baseline.${side}.color`);
}
for (const [suffix, type, value, path] of [
  ['source-mode','select',null,null], ['fixed','number','75','at.fixed'], ['fallback','number','85','at.fixed'], ['percent','number','75','at'],
  ['entity','entity','sensor.changed','at.entity'], ['lane','select',['above','below'],'lane'],
  ['shape','select',['diamond','pin','circle'],'shape'], ['direction','select',['outward','inward'],'direction'],
  ['show-marker','checkbox',null,'show_marker'], ['label-show','checkbox',null,'label.show'],
  ['label-text','text','Reference label','label.text'], ['label-entity','entity','sensor.label','label.entity'],
  ['label-show-value','checkbox',null,'label.show_value'], ['label-show-unit','checkbox',null,'label.show_unit'], ['label-precision','number','3','label.precision'],
]) kind(`generic-marker-${suffix}`, 'References', type, path && `markers.0.${path}`, value,
  { journey: ['source-mode','fallback','percent','entity'].includes(suffix) ? 'sources' : 'fields', conditional: ['fixed','fallback','percent','entity'].includes(suffix), drafts: suffix === 'percent' ? 'percentage' : type === 'number' ? 'native' : false, clear: type === 'text' });
color('kind','generic-marker-color','References','markers.0.color');
for (const [name,type,path,value] of [
  ['height','number','height','36'], ['label-position','select','label.position',['left','hero','inside','off']],
  ['label-hero-size','select','hero.size',['large','small']], ['hero-value-size','number','hero.value_size','44'], ['label-width','number','label.width','180'],
]) field(`layout-${name}`, 'Layout', type, `layout.${path}`, value, { hosts:['standalone'] });
field('formatting-unit','Formatting','text','formatting.unit','kWh',{ clear:true });
field('formatting-decimal','Formatting','number','formatting.decimal','3');
for (const family of ['segment','gradient']) {
  const section = family === 'segment' ? 'Segments' : 'Gradient Stops';
  for (const draft of ['', 'draft-']) {
    for (const part of family === 'segment' ? ['from','to'] : ['pos']) kind(`${family}-${draft}${part}`, section, family === 'segment' ? 'boundary' : 'number', null, null, { journey:'palettes', drafts:'palette', structural:true });
    color('kind', `${family}-${draft}color`,section,null,{journey:'palettes',structural:true});
  }
}
// Segment CSS text is a Feature capability; existing non-hex Gradient Stop
// fallback is tested as a restricted fallback, never as arbitrary CSS support.
for (const entry of controls.filter(c=>c.section==='Segments' && c.type==='css')) entry.hosts=['feature'];
for(const entry of controls.filter(c=>c.section==='Gradient Stops'&&c.type==='css')) entry.type='legacy-color';
const entityNames = {
 'scale-min':'entity-override-min','scale-max':'entity-override-max',
 'scale-min-entity-source':'entity-override-min-entity-source','scale-max-entity-source':'entity-override-max-entity-source',
 'target-mode':'entity-target-mode','peak-show':'entity-peak-enabled','floor-show':'entity-floor-enabled',
 'bar-needle-mode':'entity-needle-mode','bar-needle-color':'entity-needle-color','bar-needle-color-text-fallback':'entity-needle-color-text-fallback',
 'layout-height':'entity-override-height',
};
// Explicit scope translation reuses shared semantics while exercising the actual
// standalone entity controls. Root config/other entity must stay untouched.
for (const entry of [...controls].filter(c => c.hosts.includes('standalone') && !['Basics','References'].includes(c.section))) {
  const name = entityNames[entry.name] ?? `entity-${entry.name}`;
  controls.push({...entry, id:`kind:${name}`,route:'kind',name,hosts:['standalone'],scope:'entity',
    path:entry.path && `entities.0.${entry.path}`, journey:entry.journey, clear:false});
}
for (const section of ['Scale','Target','Peak','Floor','References','Bar Appearance','Baseline','Needle','Segments','Gradient Stops','Layout','Formatting']) {
 const slug = {'References':'markers','Bar Appearance':'bar','Gradient Stops':'gradient-stops'}[section] ?? section.toLowerCase();
 kind(`entity-${slug}-inherit`,section,'checkbox',null,null,{hosts:['standalone'],scope:'entity',journey:'inheritance',structural:true});
}
for (const [name,path,value] of [['entity-input','entity','sensor.changed'],['entity-name','name','Power source'],['entity-icon','icon','mdi:flash']]) kind(name,'Entities','text',`entities.0.${path}`,value,{hosts:['standalone']});
kind('entity-picker','Entities','entity','entities.0.entity','sensor.changed',{hosts:['standalone'],journey:'pickers',conditional:true});
field('feature-entity-override','Entities','checkbox','entity',null,{hosts:['feature'],journey:'entities',conditional:true});
kind('feature-entity-source','Entities','entity','entity','sensor.changed',{hosts:['feature'],journey:'entities',conditional:true});
for (const [section,names,hosts,journey] of [
 ['Entities',['add-entity','remove-entity','duplicate-entity','move-entity-up','move-entity-down'],['standalone'],'entities'],
 ['Entities',['toggle-entity-overrides','toggle-override-group'],['standalone'],'disclosures'],
 ['Markers',['toggle-card-group'],['standalone','feature'],'disclosures'],
 ['References',['add-generic-marker','remove-generic-marker','move-generic-marker-up','move-generic-marker-down','toggle-generic-marker'],['standalone','feature'],'references'],
 ['Baseline',['remove-baseline'],['standalone','feature'],'sources'],
 ['Target',['target-clear-percent'],['feature'],'sources'],['Baseline',['baseline-clear-percent'],['feature'],'sources'],
 ['Segments',['add-segment','remove-segment','add-entity-segment','remove-entity-segment'],['standalone','feature'],'palettes'],
 ['Gradient Stops',['add-gradient-stop','remove-gradient-stop','add-entity-gradient-stop','remove-entity-gradient-stop'],['standalone','feature'],'palettes'],
]) for (const name of names) add('action',name,section,'button',null,null,{hosts:name.includes('-entity-')?['standalone']:hosts,journey,structural:true,echo:journey!=='disclosures'});
const inventory = controls.filter(c=>c.hosts.length);
const selector = entry => `[data-${entry.route}="${entry.name}"]${entry.scope==='entity'?'[data-index="0"]':''}`;
const groups = { Target:'marker-target',Peak:'marker-peak',Floor:'marker-floor',References:'generic-markers',Baseline:'baseline',Segments:'segments','Gradient Stops':'gradient-stops' };
module.exports={ inventory, selector, groups };
if (require.main === module) {
 for (const c of inventory) console.log(`${c.id}\t${c.scope??'root'}\t${c.hosts.length===2?'Both':c.hosts[0]}\t${c.section}\t${c.type}\tdraft=${c.drafts}\tconditional=${c.conditional}\techo=${c.echo}\tstructural=${c.structural}\t${c.journey}	path=${c.path??'journey-owned'}	example=${JSON.stringify(c.value)}`);
}
