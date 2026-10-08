import { it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
const root={type:'card'};
for(const source of ['src','dist'])it(`canonical standalone structure and disclosure lifecycle (${source})`,()=>{
 const editor=createEditor({source});editor.setConfig({entities:['sensor.a'],target:{at:'75%'},baseline:{at:'35%'},markers:[{at:25}],bar:{fill_style:'solid'}});
 const html=editor.shadowRoot.innerHTML;
 expect([...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1])).toEqual(['Basics','Entities','Scale','Markers','Bar Appearance','Segments','Gradient Stops','Layout','Formatting']);
 const cardGroups=[...html.matchAll(/id="card-group-([^"]+)"\s+class="override-group-toggle"/g)].map(m=>m[1]);
 expect(cardGroups).toEqual(['marker-target','marker-peak','marker-floor','generic-markers','baseline','segments','gradient-stops']);
 expect(editor._expandedCardGroups.size).toBe(0);editor._toggleCardGroupExpanded('marker-target');editor._render();expect(editor._isCardGroupExpanded('marker-target')).toBe(true);
 editor.setConfig(editor._draftConfig);expect(editor._isCardGroupExpanded('marker-target')).toBe(true);
 editor.setConfig({entities:['sensor.b']});expect(editor._isCardGroupExpanded('marker-target')).toBe(true);
 expect(editor._referenceMarkersSection._getGenericMarkersSummary(root)).toBe('No reference markers');
});
for(const source of ['src','dist'])it(`Feature is the filtered canonical structure with shared summaries and local state (${source})`,async()=>{
 const {loadCardClass}=await import('../support/load-card-class.cjs');const classes=loadCardClass({source});
 const config={type:'custom:sensor-bar-card-plus-feature',target:{at:'75%'},baseline:{at:{percent:35,future:true}},peak:{enabled:true,reset:'daily'},floor:{enabled:true},markers:[{at:'25%'}],bar:{animated:false,fill_style:'solid'},future:{unset:undefined}};
 const standalone=new classes.editor();standalone.setConfig({...config,entities:['sensor.a']});
 const editor=new classes.featureEditor(),events=[];editor.dispatchEvent=e=>{events.push(e.detail.config);editor.setConfig(e.detail.config);return true;};editor.setConfig(config);editor.context={entity_id:'sensor.parent'};await editor.updateComplete;
 const headings=html=>[...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]);expect(headings(editor.shadowRoot.innerHTML)).toEqual(headings(standalone.shadowRoot.innerHTML).filter(name=>!['Basics','Layout'].includes(name)));
 const groups=html=>[...html.matchAll(/id="card-group-([^"]+)"\s+class="override-group-toggle"/g)].map(m=>m[1]);expect(groups(editor.shadowRoot.innerHTML)).toEqual(groups(standalone.shadowRoot.innerHTML));
 for(const [group,title,summary] of [
  ['marker-target','Target',editor._targetSection._getCardTargetMarkerSummary()],['marker-peak','Peak',editor._extremaSection._getMarkerResetSummary('peak')],['marker-floor','Floor',editor._extremaSection._getMarkerResetSummary('floor')],['generic-markers','Generic Reference Markers',editor._referenceMarkersSection._getGenericMarkersSummary(root)],['baseline','Baseline',editor._baselineSection._getCardBaselineSummary()],['segments','Segments',editor._segmentsSection._getSegmentsSummary(root)],['gradient-stops','Gradient Stops',editor._gradientStopsSection._getGradientStopsSummary(root)]]){
  const options={group,title,summary,content:'SAME'};expect(editor._renderCardGroup(options)).toBe(standalone._renderCardGroup(options));
  editor._toggleCardGroup(group);editor.setConfig(editor._config);editor.context={entity_id:'sensor.changed'};await editor.updateComplete;expect(editor._expandedCardGroups.has(group)).toBe(true);
  expect(editor._renderCardGroup(options)).toContain('aria-expanded="true"');editor._toggleCardGroup(group);
 }
 expect(events).toHaveLength(0);expect(editor._config).toEqual(config);expect(Object.hasOwn(editor._config.future,'unset')).toBe(true);
 editor._toggleCardGroup('marker-target');editor.setConfig({type:config.type,markers:[{at:50}]});await editor.updateComplete;expect(editor._expandedCardGroups.has('marker-target')).toBe(true);expect(editor._referenceMarkersSection._expandedGenericMarkerUiIds.size).toBe(0);
});
