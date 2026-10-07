import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { getNormalizedResolvableNumericValue } from '../../src/config/resolve.js';
import { getSegmentsForRendering, getBasePaintGradient, getGradientInterpolationStops } from '../../src/view-model/bar-render-model.js';
const root = { type: 'card' };
for (const source of ['src', 'dist']) describe(`standalone capability baseline (${source})`, () => {
  it('keeps animation runtime-only and source percentage controls absent', () => {
    const editor = createEditor({source}); editor.setConfig({target:{at:'50%'},baseline:{at:{percent:35}},bar:{animated:false}});
    expect(editor.shadowRoot.innerHTML).not.toContain('data-field="bar-animated"');
    expect(editor._targetSection.render(root)).not.toContain('target-source-mode');
    expect(editor._baselineSection.render(root)).not.toContain('baseline-source-mode');
    expect(editor._getTargetResolvableValue(root).percent).toBe(50);
    expect(editor._getBaselineResolvableValue(root).percent).toBe(35);
  });
  it('keeps conditional CSS fallback, explicit end validation and drafts unchanged', () => {
    const editor = createEditor({source}); editor.setConfig({bar:{color:'#abc',segments:[{from:0,color:'red'},{from:50,color:'blue'}]}});
    expect(editor.shadowRoot.innerHTML).not.toContain('data-field="bar-color-text-fallback"');
    expect(editor._segmentsSection._getSegmentRowValidationMessage(root,0)).toBe('Enter valid from/to values.');
    editor._segmentsSection._setSegmentDraftField(root,'from','80'); editor._segmentsSection._setSegmentDraftField(root,'to','');
    expect(editor._segmentsSection._getValidSegmentDraft(root)).toBeNull();
    editor.setConfig({bar:{color:'red'}}); expect(editor.shadowRoot.innerHTML).toContain('data-field="bar-color-text-fallback"');
  });
});
it('normalizes animation precedence/default without coercing raw values', () => {
  const appearance = config => normalizeCardConfig({entities:[{entity:'sensor.a'}],...config}).entities[0].bar.animated;
  expect(appearance({})).toBe(true); expect(appearance({animated:false})).toBe(false);
  expect(appearance({animated:false,bar:{animated:true}})).toBe(true);
  expect(appearance({bar:{animated:null}})).toBe(true); expect(appearance({bar:{animated:'false'}})).toBe('false');
  expect(normalizeCardConfig({bar:{animated:false},entities:[{entity:'sensor.a',animated:true},{entity:'sensor.b',animated:true,bar:{animated:false}}]}).entities.map(e=>e.bar.animated)).toEqual([true,false]);
});
for (const key of ['target','baseline']) it(`${key} resolves strings/objects with entity then fixed then percent precedence, including out-of-range YAML`, () => {
  const normalized = at => { const e=normalizeCardConfig({entities:['sensor.a'],[key]:{at}}).entities[0]; return key==='target'?e.target_marker.source:e.baseline.at; };
  for(const at of ['50%',{percent:50}]) expect(getNormalizedResolvableNumericValue({},normalized(at),-100,100)).toBe(0);
  expect(getNormalizedResolvableNumericValue({states:{'sensor.ref':{state:'10'}}},normalized({entity:'sensor.ref',fixed:20,percent:50}),-100,100)).toBe(10);
  expect(getNormalizedResolvableNumericValue({},normalized({fixed:20,percent:50}),-100,100)).toBe(20);
  expect(getNormalizedResolvableNumericValue({},normalized('101%'),0,100)).toBe(101);
});
it('infers omitted/null ends using next configured valid start then scale end, with mixed coordinates', () => {
  const e=normalizeCardConfig({entities:['sensor.a'],scale:{min:-100,max:100},bar:{segments:[{from:-100,color:'red'},{from:'50%',to:null,color:'orange'},{from:60,color:'green'}]}}).entities[0];
  expect(getSegmentsForRendering(e,-100,100)).toEqual([{from:0,to:50,color:'red',label:null},{from:50,to:80,color:'orange',label:null},{from:80,to:100,color:'green',label:null}]);
  const out=normalizeCardConfig({entities:['sensor.a'],bar:{segments:[{from:80,color:'red'},{from:0,color:'green'}]}}).entities[0];
  expect(getSegmentsForRendering(out)[1]).toMatchObject({from:80,to:0});
});
it('keeps CSS direct painting distinct from hex-only Gradient Stop interpolation', () => {
  const e=style=>normalizeCardConfig({entities:['sensor.a'],bar:{fill_style:style,segments:[{from:0,color:'var(--low)'},{from:50,color:'orange'}],gradient_stops:[{pos:0,color:'red'},{pos:100,color:'blue'}]}}).entities[0];
  for(const style of ['bands','soft_bands','band_gradient']) expect(getBasePaintGradient('red',e(style))).toContain('var(--low)');
  expect(getGradientInterpolationStops(e('gradient'))).toEqual([]);
});
