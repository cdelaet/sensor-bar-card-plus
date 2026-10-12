var nr=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"]);function ar(o){if(o===void 0&&(o="never"),typeof o!="string")return{kind:"never"};let e=o.trim().toLowerCase();if(e==="never")return{kind:"never"};if(nr.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let r=Number(t[1]),i=t[2];return!Number.isInteger(r)||r<1||i==="m"&&r>59||i==="h"&&r>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:r}:{kind:"duration",hours:r}}function st(o){if(typeof o!="string")return!1;let e=o.trim().toLowerCase();if(e==="never"||nr.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let r=Number(t[1]);return Number.isInteger(r)&&r>=1&&(t[2]==="m"?r<=59:r<=23)}function ht(o){return typeof o=="string"&&o!==""?o:null}function Bt(o){return o!=null&&o!==""&&typeof o!="string"}function H(o,e,t=null,r=null){let i={fixed:o!=null?o:null,entity:e!=null?e:null};Number.isFinite(t)&&(i.percent=t);let n=ht(r);return n!==null&&(i.attribute=n),Bt(r)&&(i.attribute_invalid=!0),i}function ne(o){return typeof o=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(o.trim())}function re(o){if(typeof o!="string")return null;let e=o.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function Z(o){if(typeof o=="number")return Number.isFinite(o)?o:null;if(typeof o=="string"){let e=o.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function ee(o,e=null,t=null,r={}){var a,l,s,c,d,u;let{allowPercent:i=!1}=r,n=e!=null?e:H(t,null);if(o===void 0)return{...n};if(o===null)return H(null,null);if(typeof o=="object"&&!Array.isArray(o)){let h=(l=(a=o.fixed)!=null?a:o.value)!=null?l:null,f=(s=o.entity)!=null?s:null,m=i?Z(o.percent):null;return H(h,f,m,o.attribute)}if(ne(o))return H((d=(c=n.fixed)!=null?c:t)!=null?d:null,o,(u=n.percent)!=null?u:null);if(i){let h=re(o);if(Number.isFinite(h))return H(null,null,h)}return H(o,null)}function qr(o){var e;return!!o&&(Z((e=o.fixed)!=null?e:o.value)!==null||Number.isFinite(o.percent)||!!o.entity)}function dr(o,e){var r,i,n,a;let t={above:((r=e==null?void 0:e.peak_marker)==null?void 0:r.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&qr((a=e==null?void 0:e.target_marker)==null?void 0:a.source)?1:0)};return o.map(l=>{let s=l.valid&&t[l.lane]<4;return s&&(t[l.lane]+=1),{...l,accepted:s}})}function cr(o,e=null){if(!Array.isArray(o))return{markers:[],invalidList:o!==void 0};let t=o.map((r,i)=>{var z;if(!r||typeof r!="object"||Array.isArray(r))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=r.at,a=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),l=typeof n=="string"?n.trim():n,s=ee(l,null,null,{allowPercent:!0}),c=n&&typeof n=="object"&&n.entity!==void 0?n.entity:typeof l=="string"&&ne(l)?l:null,d=c!=null&&c!==""&&!ne(c),u=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&Z(n.fixed)===null,h=!!s.entity||Z(s.fixed)!==null||Number.isFinite(s.percent),f=Number.isFinite(s.percent)&&(s.percent<0||s.percent>100),m=n!=null&&!a&&!d&&!u&&h&&!f,x=r.lane===void 0?"below":r.lane,k=x==="above"||x==="below",v=["circle","diamond","triangle","chevron","arrow","pin"],$=r.shape===void 0||v.includes(r.shape),_=Y(r.direction),g=r.direction!==void 0&&!["inward","outward"].includes(typeof r.direction=="string"?r.direction.trim().toLowerCase():""),y=r.label&&typeof r.label=="object"&&!Array.isArray(r.label)?r.label:{},w=mt(y),E=y.entity,V=typeof E=="string"?E.trim():"",M=E!=null&&E!==""&&!ne(V),O=V&&ne(V)?V:null,A=typeof r.show_marker=="boolean"?r.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...s,entity:typeof s.entity=="string"?s.entity.trim():s.entity},lane:k?x:null,shape:$&&(z=r.shape)!=null?z:"circle",direction:_,invalidDirection:g,showMarker:A,invalidShowMarker:r.show_marker!==void 0&&typeof r.show_marker!="boolean",color:typeof r.color=="string"&&r.color.trim()?r.color:"#888888",label:{show:y.show===!0,text:w.label_text,entity:O,...ht(y.attribute)!==null?{attribute:ht(y.attribute)}:{},...Bt(y.attribute)?{attribute_invalid:!0}:{},showValue:w.label_show_value,showUnit:w.label_show_unit,precision:w.label_precision,invalidShow:w.label_invalid_show,invalidText:w.label_invalid_text,invalidShowValue:w.label_invalid_show_value,invalidShowUnit:w.label_invalid_show_unit,invalidPrecision:w.label_invalid_precision,invalidPrecisionKey:w.label_precision_key,unsupportedUnit:w.label_unsupported_unit,invalidEntity:M},valid:m&&k,invalidSource:!m,invalidPercentage:f,unsupportedPercentField:a,invalidLane:!k,invalidShape:!$,accepted:!1}});return{markers:dr(t,e),invalidList:!1}}function dt(o,e=null){var r;let t=e!=null?e:{color:null};return o===void 0?{...t}:o===null?{color:null}:typeof o=="object"&&!Array.isArray(o)?{color:(r=o.color)!=null?r:null}:{color:o}}function At(o){return o===!0?!0:o===!1?!1:null}function ur(o,e){var n;let t=e==null?void 0:e.baseline,r=o==null?void 0:o.baseline,i={enabled:At(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:H(null,null),above:dt(void 0,t==null?void 0:t.above),below:dt(void 0,t==null?void 0:t.below)};return r===void 0?i:r===null?{enabled:null,at:H(null,null),above:{color:null},below:{color:null}}:typeof r!="object"||Array.isArray(r)?{enabled:i.enabled,at:ee(r,i.at,null),above:i.above,below:i.below}:{enabled:(n=At(r.enabled))!=null?n:i.enabled,at:ee(r.at,i.at,null,{allowPercent:!0}),above:dt(r.above,i.above),below:dt(r.below,i.below)}}function Hr(o,e=null){let t=[...o].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var a;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(a=r.label)!=null?a:null}})}function or(o){if(!Array.isArray(o))return null;let e=o.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var r;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(r=t.label)!=null?r:null}});return Hr(e,100)}function lr(o,e=null){var r;if(o===void 0)return{value:null,issue:null};if(o===null)return{value:null,issue:"malformed"};if(o&&typeof o=="object"&&!Array.isArray(o)){if(o.entity!==void 0&&o.entity!==null&&o.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(o,"percent")){let n=Z(o.percent);return Number.isFinite(n)?{value:H(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=Z((r=o.fixed)!=null?r:o.value);return Number.isFinite(i)?{value:H(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof o=="string"){let i=o.trim();if(ne(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=re(i);return Number.isFinite(n)?{value:H(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=Z(o);return Number.isFinite(t)?e==="percent"?{value:H(null,null,t),issue:null}:{value:H(t,null),issue:null}:{value:null,issue:"malformed"}}function Je(o,e={}){if(!Array.isArray(o))return null;let{legacySegmentSpace:t=null}=e,r=o.map(i=>{var l,s;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:lr(i.from,t),a=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:lr(i.to,t);return i!=null&&i.color?{from:n.value,to:a.value,invalidBoundary:(l=n.issue)!=null?l:a.issue,color:i.color,label:(s=i.label)!=null?s:null}:null}).filter(Boolean);return r.map((i,n)=>{var l;let a=r.slice(n+1).find(s=>!s.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:a!=null&&a.from?{...a.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(l=i.label)!=null?l:null}})}function sr(o,e,t,r){var x,k,v,$,_,g,y,w,E,V,M;let i=e==null?void 0:e.scale,n=o==null?void 0:o.scale,a=`${t}_entity`,l=i==null?void 0:i[t],s=l?H((k=(x=l.fixed)!=null?x:l.value)!=null?k:null,(v=l.entity)!=null?v:null,null,l.attribute):H(($=e==null?void 0:e[t])!=null?$:r,(_=e==null?void 0:e[a])!=null?_:null),c=l?l.fixed_explicit!==!1&&l.fixed!==null&&l.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,d=(O,A)=>(Object.defineProperty(O,"fixed_explicit",{value:A}),O);if((n==null?void 0:n[t])!==void 0){let O=n[t],A=ne(O)?c:typeof O=="object"&&O!==null?((g=O.fixed)!=null?g:O.value)!==null&&((y=O.fixed)!=null?y:O.value)!==void 0:O!==null;return d(ee(n[t],s,r),A)}let u=o[a],h=u!=null,f=(E=(w=o[t])!=null?w:h?null:s.fixed)!=null?E:s.entity?null:r,m=(V=u!=null?u:s.entity)!=null?V:null;return d(H(f,m,(M=s.percent)!=null?M:null,s.attribute),o[t]!==null&&o[t]!==void 0||!h&&c)}function Xe(o,e){return{min:sr(o,e,"min",0),max:sr(o,e,"max",100)}}function Wr(o){switch(o){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function hr(o){switch(o){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}var Nt=Symbol("sbcp.paintExplicitness"),zt=Symbol("sbcp.explicitSegmentSpace");function ft(o,e){return o!=null&&Object.prototype.hasOwnProperty.call(o,e)}function Jr(o){return[ft(o,"color")?o.color:void 0,ft(o==null?void 0:o.bar,"color")?o.bar.color:void 0].some(t=>t!=null)}function Ye(o){let e=o==null?void 0:o.bar,t=[[o,"color_mode"],[e,"color_mode"],[e,"fill_style"],[o,"severity"],[o,"segments"],[e,"segments"],[o,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Jr(o),paint:t.some(([r,i])=>ft(r,i))}}function ct(o=null,e=null){var n,a,l,s,c,d;let t=(n=o==null?void 0:o.fill_style)!=null?n:null,r=(l=(a=o==null?void 0:o.color_mode)!=null?a:e)!=null?l:null,i=(c=(s=Wr(t))!=null?s:r)!=null?c:"severity";return{fill_style:(d=t!=null?t:hr(i))!=null?d:"bands",color_mode:i}}function Yr(o,e,t,r,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:a=!1}={}){let l=(i==null?void 0:i.color)===!0&&i.paint!==!0,s=(n==null?void 0:n.paint)===!0;return l&&(a||!s)?ct({fill_style:"solid"},null):(o==null?void 0:o.fill_style)!==void 0||(o==null?void 0:o.color_mode)!==void 0||e.color_mode!==void 0?ct(o,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(r==null?void 0:r.color_mode)!==void 0?ct(t,r==null?void 0:r.color_mode):ct(null,null)}function Xr(o){return Array.isArray(o)?o.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=re(e.pos),r=Number.isFinite(t)?t:Z(e.pos);return{...e,pos:Number.isFinite(r)?r:e.pos}}):o!=null?o:null}function Qr(o,e=null){var r,i,n,a;let t=e?{show:(r=e.show)!=null?r:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return o===void 0?{...t}:typeof o=="boolean"?{show:o,color:"#ffffff"}:o&&typeof o=="object"&&!Array.isArray(o)?{show:(n=o.show)!=null?n:t.show,color:(a=o.color)!=null?a:t.color}:{...t}}function ae(o,e,t={}){var w,E,V,M,O,A,z,N,B,L,U,q,le,se,de,ce,Ae,Be,Ne,Ie,je,Le,Ue,Ke,qe,He,We;let r=(w=t.scopeExplicitness)!=null?w:Ye(o),i=(V=(E=t.inheritedExplicitness)!=null?E:e==null?void 0:e[Nt])!=null?V:Ye(e),n=(M=t.isCardScope)!=null?M:e==null,a=e==null?void 0:e.bar,l=o==null?void 0:o.bar,s=ft(a,zt)?a[zt]:["percent","scale"].includes(a==null?void 0:a.segment_space)?a.segment_space:null,c=["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:s,d=l==null?void 0:l.segments,u=o.segments,h=o.severity,f=(O=a==null?void 0:a.segments)!=null?O:null,m=(A=e==null?void 0:e.segments)!=null?A:null,x=(z=e==null?void 0:e.severity)!=null?z:null,k=null,v=(a==null?void 0:a.segment_space)==="percent"||(a==null?void 0:a.segment_space)==="scale"?a.segment_space:null;d!=null?(v=c,k=Je(d,{legacySegmentSpace:v})):u!=null?k=Je(u):h!=null?(k=or(h),v="percent"):f!=null?k=f.map(ot=>({...ot})):m!=null?k=Je(m):x!=null&&(k=or(x),v="percent");let $=o!=null&&o.target&&typeof o.target=="object"&&!Array.isArray(o.target)?(N=o.target.when_exceeded)==null?void 0:N.fill_color:void 0,_=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(B=e.target.when_exceeded)==null?void 0:B.fill_color:void 0,g=Yr(l,o,a,e,{scopeExplicitness:r,inheritedExplicitness:i,isCardScope:n}),y={fill_style:g.fill_style,color_mode:g.color_mode,needle:Qr(l==null?void 0:l.needle,a==null?void 0:a.needle),solid_fill:(U=(L=l==null?void 0:l.solid_fill)!=null?L:a==null?void 0:a.solid_fill)!=null?U:!1,color:(de=(se=(le=(q=l==null?void 0:l.color)!=null?q:o.color)!=null?le:a==null?void 0:a.color)!=null?se:e==null?void 0:e.color)!=null?de:"#4a9eff",gradient_stops:Xr((Ne=(Be=(Ae=(ce=l==null?void 0:l.gradient_stops)!=null?ce:o.gradient_stops)!=null?Ae:a==null?void 0:a.gradient_stops)!=null?Be:e==null?void 0:e.gradient_stops)!=null?Ne:null),severity:k,segments:k,segment_space:v,animated:(Ue=(Le=(je=(Ie=l==null?void 0:l.animated)!=null?Ie:o.animated)!=null?je:a==null?void 0:a.animated)!=null?Le:e==null?void 0:e.animated)!=null?Ue:!0,above_target_color:(We=(He=(qe=(Ke=$!=null?$:o.above_target_color)!=null?Ke:a==null?void 0:a.above_target_color)!=null?qe:_)!=null?He:e==null?void 0:e.above_target_color)!=null?We:null};return Object.defineProperty(y,zt,{value:c}),y}function Zr(o){return Math.max(24,o)}function ei(o,e="left"){let t=typeof o=="string"?o.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function ti(o,e="medium"){let t=typeof o=="string"?o.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function ri(o){return Number.isFinite(o)?Math.min(112,Math.max(12,o)):null}function fr(o,e){var f,m,x,k,v,$,_,g,y,w,E,V,M,O,A,z,N,B,L,U,q,le,se,de,ce;let t=e==null?void 0:e.layout,r=o==null?void 0:o.layout,i=r==null?void 0:r.label,n=r==null?void 0:r.hero,a=t==null?void 0:t.label,l=t==null?void 0:t.hero,s=!e,c=(k=(x=(m=(f=r==null?void 0:r.height)!=null?f:o.height)!=null?m:t==null?void 0:t.height)!=null?x:e==null?void 0:e.height)!=null?k:38,d=(r==null?void 0:r.height)!==void 0||o._height_explicit===!0||!s&&o.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,u=ei((g=(_=($=(v=i==null?void 0:i.position)!=null?v:o.label_position)!=null?$:a==null?void 0:a.position)!=null?_:t==null?void 0:t.label_position)!=null?g:e==null?void 0:e.label_position,"left"),h=u==="hero"?ri((y=n==null?void 0:n.value_size)!=null?y:l==null?void 0:l.value_size):null;return{label:{position:u,width:(O=(M=(V=(E=(w=i==null?void 0:i.width)!=null?w:o.label_width)!=null?E:a==null?void 0:a.width)!=null?V:t==null?void 0:t.label_width)!=null?M:e==null?void 0:e.label_width)!=null?O:100},hero:{size:ti((ce=(de=(se=(le=(q=(U=(L=(B=(N=(z=(A=n==null?void 0:n.size)!=null?A:i==null?void 0:i.hero_size)!=null?z:i==null?void 0:i.heroSize)!=null?N:o.hero_size)!=null?B:o.heroSize)!=null?L:l==null?void 0:l.size)!=null?U:a==null?void 0:a.hero_size)!=null?q:a==null?void 0:a.heroSize)!=null?le:t==null?void 0:t.hero_size)!=null?se:t==null?void 0:t.heroSize)!=null?de:e==null?void 0:e.hero_size)!=null?ce:e==null?void 0:e.heroSize,"medium"),value_size:h},height:Zr(c),height_explicit:d}}function mr(o,e){var i,n,a,l,s,c,d,u;let t=e==null?void 0:e.formatting,r=o==null?void 0:o.formatting;return{decimal:(l=(a=(n=(i=r==null?void 0:r.decimal)!=null?i:o.decimal)!=null?n:t==null?void 0:t.decimal)!=null?a:e==null?void 0:e.decimal)!=null?l:null,unit:(u=(d=(c=(s=r==null?void 0:r.unit)!=null?s:o.unit)!=null?c:t==null?void 0:t.unit)!=null?d:e==null?void 0:e.unit)!=null?u:null}}function he(o){let e=String(o!=null?o:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function Y(o){return(typeof o=="string"?o.trim().toLowerCase():"")==="outward"?"outward":"inward"}function mt(o,e={}){var u,h,f;let t=o&&typeof o=="object"&&!Array.isArray(o)?o:{},r=Object.prototype.hasOwnProperty.call(t,"text"),i=r&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),a=Object.prototype.hasOwnProperty.call(t,"decimal"),l=n?t.precision:t.decimal,s=n||a,c=s?Z(l):(u=e.label_precision)!=null?u:null,d=s&&l!==null&&l!==""&&!(Number.isInteger(c)&&c>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(h=e.label_show_value)!=null?h:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(f=e.label_show_unit)!=null?f:!0,label_precision:d?null:c,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:r&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:d,label_precision_key:d?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function ut(o){let e={};return o.label_text!==null&&o.label_text!==void 0&&(e.label_text=o.label_text),o.label_show_value===!1&&(e.label_show_value=!1),o.label_show_unit===!1&&(e.label_show_unit=!1),o.label_precision!==null&&o.label_precision!==void 0&&(e.label_precision=o.label_precision),o.label_invalid_text&&(e.label_invalid_text=!0),o.label_invalid_show_value&&(e.label_invalid_show_value=!0),o.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),o.label_invalid_show&&(e.label_invalid_show=!0),o.label_invalid_precision&&(e.label_invalid_precision=!0),o.label_invalid_precision&&o.label_precision_key&&(e.label_precision_key=o.label_precision_key),o.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function _r(o){return o!==void 0&&!["inward","outward"].includes(typeof o=="string"?o.trim().toLowerCase():"")}function pr(o,e){var h,f,m,x,k,v,$,_,g,y,w,E,V,M,O,A,z,N,B,L,U,q,le,se,de,ce,Ae,Be,Ne,Ie,je,Le,Ue,Ke,qe,He,We;let t=e==null?void 0:e.target_marker,r=o==null?void 0:o.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(h=e==null?void 0:e.target)!=null?h:null,n=t?{...t,shape:he(t.shape),direction:Y(t.direction)}:{enabled:null,source:H(null,null),color:(f=e==null?void 0:e.target_color)!=null?f:"#888",show_label:(m=e==null?void 0:e.show_target_label)!=null?m:!1,...ut(mt((x=e==null?void 0:e.target)==null?void 0:x.label)),label_decimal:(y=(g=(v=(k=e==null?void 0:e.target)==null?void 0:k.label)==null?void 0:v.precision)!=null?g:(_=($=e==null?void 0:e.target)==null?void 0:$.label)==null?void 0:_.decimal)!=null?y:null,shape:"diamond",direction:"inward"};if(r&&typeof r=="object"&&!Array.isArray(r)){let ot=mt(r.label,n),Rt={enabled:(E=(w=At(r.enabled))!=null?w:n.enabled)!=null?E:null,source:ee(r.at,n.source,null,{allowPercent:!0}),color:(M=(V=r.color)!=null?V:o.target_color)!=null?M:n.color,show_label:(z=(A=(O=r.label)==null?void 0:O.show)!=null?A:o.show_target_label)!=null?z:n.show_label,shape:Object.prototype.hasOwnProperty.call(r,"shape")?he(r.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(r,"direction")?Y(r.direction):n.direction,..._r(r.direction)?{direction_invalid:!0}:{},...ut(ot)},lt=ot.label_precision;return lt!=null&&(Rt.label_decimal=lt,Rt.label_precision=lt),Rt}let a=(q=(U=(B=o.target)!=null?B:(N=n.source)==null?void 0:N.fixed)!=null?U:(L=n.source)==null?void 0:L.value)!=null?q:i,l=(ce=(de=(se=o.target_entity)!=null?se:(le=n.source)==null?void 0:le.entity)!=null?de:e==null?void 0:e.target_entity)!=null?ce:null,s=o.target===void 0&&o.target_entity===void 0&&(Be=(Ae=n.source)==null?void 0:Ae.percent)!=null?Be:null,c=o.target===void 0&&o.target_entity===void 0&&(Ie=(Ne=n.source)==null?void 0:Ne.attribute)!=null?Ie:null,d={enabled:(je=n.enabled)!=null?je:null,source:H(a,l,s,c),color:(Ke=(Ue=(Le=o.target_color)!=null?Le:n.color)!=null?Ue:e==null?void 0:e.target_color)!=null?Ke:"#888",show_label:(We=(He=(qe=o.show_target_label)!=null?qe:n.show_label)!=null?He:e==null?void 0:e.show_target_label)!=null?We:!1,shape:n.shape,direction:n.direction,...ut(n)},u=d.label_precision;return u!=null&&(d.label_decimal=u),d}function ii(o,e){let t=o==null?void 0:o[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let r=o==null?void 0:o[`${e}_marker`];return r&&typeof r=="object"&&!Array.isArray(r)?r:null}function ni(o,e){var n,a,l;let t=o==null?void 0:o.label,r=t&&typeof t=="object"&&!Array.isArray(t),i=mt(t,e);return{show:r&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(l=(a=i.label_precision)!=null?a:e.label_decimal)!=null?l:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function gr(o,e,t,r={}){var v,$,_,g,y,w,E,V,M;let{legacy:i=!1,defaultColor:n="#888888"}=r,a=e==null?void 0:e[`${t}_marker`],l=ii(o,t),s=a!=null?a:{show:i&&(v=e==null?void 0:e.show_peak)!=null?v:!1,color:i&&($=e==null?void 0:e.peak_color)!=null?$:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},c=l&&Object.prototype.hasOwnProperty.call(l,"reset"),d=c?l.reset:void 0,u=c?ar(d):(_=s.reset)!=null?_:{kind:"never"},h=l==null?void 0:l.label,f=ni(l,s),m={show:(w=(y=(g=l==null?void 0:l.enabled)!=null?g:i?o.show_peak:void 0)!=null?y:s.show)!=null?w:!1,color:(M=(V=(E=l==null?void 0:l.color)!=null?E:i?o.peak_color:void 0)!=null?V:s.color)!=null?M:n,direction:l&&Object.prototype.hasOwnProperty.call(l,"direction")?Y(l.direction):Y(s.direction),..._r(l==null?void 0:l.direction)?{direction_invalid:!0}:{}},x=a&&(Object.prototype.hasOwnProperty.call(a,"show_label")||Object.prototype.hasOwnProperty.call(a,"label_decimal")||Object.prototype.hasOwnProperty.call(a,"label_text")||Object.prototype.hasOwnProperty.call(a,"label_show_value")||Object.prototype.hasOwnProperty.call(a,"label_show_unit")||Object.prototype.hasOwnProperty.call(a,"label_precision")||Object.prototype.hasOwnProperty.call(a,"reset"));return(t==="floor"||c||h!==void 0||x)&&(m.show_label=f.show,m.label_decimal=f.precision,m.reset=u),Object.assign(m,ut({label_text:f.text,label_show_value:f.showValue===!0?void 0:f.showValue,label_show_unit:f.showUnit===!0?void 0:f.showUnit,label_precision:f.precision,label_invalid_text:f.invalidText,label_invalid_show:f.invalidShow,label_invalid_show_value:f.invalidShowValue,label_invalid_show_unit:f.invalidShowUnit,label_invalid_precision:f.invalidPrecision,label_precision_key:f.precisionKey,label_unsupported_unit:f.unsupportedUnit})),c&&!st(d)&&(m.reset_invalid=!0),m}function br(o,e){return gr(o,e,"peak",{legacy:!0,defaultColor:"#888888"})}function yr(o,e){return gr(o,e,"floor",{defaultColor:"#888888"})}function ai(o,e){var i,n,a;let t={...o,_normalized:!0,entity:o.entity,name:(i=o.name)!=null?i:null,icon:o.icon};if(o.attribute!==void 0){let l=ht(o.attribute);l!==null?t.attribute=l:delete t.attribute,Bt(o.attribute)?t.attribute_invalid=!0:delete t.attribute_invalid}t.layout=fr(o,e),t.scale=Xe(o,e),t.bar=ae(o,e,{scopeExplicitness:Ye(o),inheritedExplicitness:(n=e==null?void 0:e[Nt])!=null?n:Ye(e),isCardScope:!1}),t.baseline=ur(o,e),t.formatting=mr(o,e),t.target_marker=pr(o,e),t.peak_marker=br(o,e),t.floor_marker=yr(o,e);let r=o.markers===void 0?{markers:dr((a=e==null?void 0:e.generic_markers)!=null?a:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:cr(o.markers,t);return t.generic_markers=r.markers,t.generic_markers_invalid=r.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Sr(o){var n;let e=Ye(o),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...o};t._height_explicit=((n=o==null?void 0:o.layout)==null?void 0:n.height)!==void 0||(o==null?void 0:o.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.attribute!==void 0?{attribute:t.attribute}:{},...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(a=>typeof a=="string"?{entity:a}:a);let r={...t,_normalized:!0};Object.defineProperty(r,Nt,{value:e,enumerable:!1}),r.layout=fr(t,null),r.scale=Xe(o,null),r.bar=ae(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),r.baseline=ur(t,null),r.formatting=mr(t,null),r.target_marker=pr(t,null),r.peak_marker=br(t,null),r.floor_marker=yr(t,null);let i=cr(t.markers,r);return r.generic_markers=i.markers,r.generic_markers_invalid=i.invalidList,r.entities=t.entities.map(a=>ai(a,r)),r}function oi(o,e=null){var n;if(!o)return{stateObj:null,value:void 0,found:!1,available:!1,attributeFound:!1};let t=!["unknown","unavailable"].includes(String((n=o.state)!=null?n:"").trim().toLowerCase());if(typeof e!="string"||e==="")return{stateObj:o,value:o.state,found:!0,available:t,attributeFound:!0};let r=o.attributes,i=r!=null&&Object.prototype.hasOwnProperty.call(r,e);return{stateObj:o,value:i?r[e]:void 0,found:!0,available:t,attributeFound:i}}function li(o,e,t=null){var i,n;let r=e&&(n=(i=o==null?void 0:o.states)==null?void 0:i[e])!=null?n:null;return oi(r,t)}function _t(o,e,t=null){let r=li(o,e,t);if(!r.found||!r.available||!r.attributeFound)return null;let i=r.value,n=parseFloat(i);return Number.isFinite(n)?n:null}function Qe(o,e,t=null){let r=_t(o,t);if(r!==null)return r;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function si(o,e,t){if(!Number.isFinite(o))return null;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return r+o/100*(i-r)}function vr(o,e,t=null,r=null){var a;if(!e)return null;let i=_t(o,e.entity,e.attribute);if(i!==null)return i;let n=Qe(o,(a=e.fixed)!=null?a:e.value,null);return n!==null?n:Number.isFinite(e.percent)?si(e.percent,t,r):null}function xr(o,e,t=null){var l,s,c,d,u,h,f,m,x,k,v,$;let r=_=>Number.isFinite(_==null?void 0:_.min)&&Number.isFinite(_==null?void 0:_.max)&&_.min<_.max,i={min:Qe(null,(c=(l=e==null?void 0:e.min)==null?void 0:l.fixed)!=null?c:(s=e==null?void 0:e.min)==null?void 0:s.value),max:Qe(null,(h=(d=e==null?void 0:e.max)==null?void 0:d.fixed)!=null?h:(u=e==null?void 0:e.max)==null?void 0:u.value)};if((f=e==null?void 0:e.min)!=null&&f.entity&&((m=e==null?void 0:e.max)!=null&&m.entity)){let _={min:_t(o,e.min.entity,e.min.attribute),max:_t(o,e.max.entity,e.max.attribute)};return r(_)?_:Number.isFinite(_.min)&&Number.isFinite(_.max)&&r(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&r(i)?i:{min:0,max:100}}let n={min:(x=vr(o,e==null?void 0:e.min))!=null?x:0,max:(k=vr(o,e==null?void 0:e.max))!=null?k:100};if(r(n))return n;let a={min:(v=i.min)!=null?v:0,max:($=i.max)!=null?$:100};return r(a)?a:{min:0,max:100}}function Ze(o){return Array.isArray(o)?[...o]:{...o!=null?o:{}}}function F(o){if(Array.isArray(o))return o.map(e=>F(e));if(b(o)){let e={};for(let[t,r]of Object.entries(o))e[t]=F(r);return e}return o}function J(o){let e=t=>Array.isArray(t)?t.map(r=>e(r)):b(t)?Object.keys(t).sort().reduce((r,i)=>(r[i]=e(t[i]),r),{}):t;return JSON.stringify(e(o!=null?o:null))}function b(o){return!!o&&typeof o=="object"&&!Array.isArray(o)}function P(o,e,t){if(!e.length)return t;let r=Ze(o!=null?o:{}),i=r,n=o;for(let a=0;a<e.length-1;a++){let l=e[a],s=b(n==null?void 0:n[l])||Array.isArray(n==null?void 0:n[l])?n[l]:{};i[l]=Ze(s),i=i[l],n=s}return i[e[e.length-1]]=t,r}function p(o,e){if(!e.length||!b(o))return o;let[t,...r]=e;if(!(t in o))return o;let i=Ze(o);if(!r.length)return delete i[t],i;let n=p(i[t],r);return n===i[t]?o:b(n)&&!Object.keys(n).length?(delete i[t],i):(i[t]=n,i)}function R(o,e){let t=o;for(let r of e){if(t==null)return;t=t[r]}return t}function wr(o,e){let t=o;for(let r of e){if(!b(t)&&!Array.isArray(t)||!(r in t))return!1;t=t[r]}return!0}function D(o){return typeof o=="string"?o:o==null?"":String(o)}function $r(o){return o===!0?!0:o===!1?!1:null}function K(o){if(o===""||o===null||o===void 0)return null;let e=Number(o);return Number.isFinite(e)?e:null}function ie(o){if(o===""||o===null||o===void 0)return null;let e=Number(o);return!Number.isFinite(e)||e<0||!Number.isInteger(e)?null:e}function kr(o,e){let t=Array.isArray(e)?e:[e];return!o||o.type==="card"?t:o.type==="entity"?["entities",o.index,...t]:t}function gt(o){return Array.isArray(o)?o:[o]}function te(o,e=[]){return e.reduce((t,r)=>p(t,gt(r)),o)}function C(o,e){let t=o,r=gt(e);for(let i=r.length;i>0;i--){let n=r.slice(0,i),a=R(t,n);if(!b(a)||Object.keys(a).length)break;t=p(t,n)}return t}function pt(o){return o!==""&&o!==void 0&&o!==null}function pe(o){return pt(o==null?void 0:o.fixed)||pt(o==null?void 0:o.entity)}function bt(o,e,t,r=[]){let i=[t,...r];for(let n of i){let a=o.read(e,n);if(a!=null&&a!=="")return a}if((e==null?void 0:e.type)==="entity")for(let n of i){let a=o.read({type:"card"},n);if(a!=null&&a!=="")return a}return""}function Er(o,e){return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="entity-picker" data-index="${e}"></ha-entity-picker>`:`<input type="text" data-kind="entity-input" data-index="${e}" value="${S(o.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function W(o,e,t,r="sensor.example",i={}){let n=Object.entries(i).map(([a,l])=>`data-${a}="${S(l)}"`).join(" ");return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="${o}" data-index="${e}"${n?` ${n}`:""}></ha-entity-picker>`:`<input type="text" data-kind="${o}" data-index="${e}"${n?` ${n}`:""} value="${S(t)}" placeholder="${S(r)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function ge(o,e,t,r){var s;let i=(o==null?void 0:o.type)==="entity",n=i?`entity-${o.index}-${e}`:e,a=i?`data-kind="entity-${e}-label-`:`data-field="${e}-label-`,l=i?`" data-index="${o.index}"`:'"';return`
      <div class="field-row"><div class="toggle">
        <input id="${n}-label-show" type="checkbox" ${a}show${l}${r.show?" checked":""}>
        <label for="${n}-label-show">Show ${t} label</label>
      </div></div>
      <div class="field-row"><label for="${n}-label-text">${t} label text</label>
        <input id="${n}-label-text" type="text" ${a}text${l} value="${S((s=r.text)!=null?s:"")}" placeholder="optional semantic text">
      </div>
      <div class="field-row"><div class="toggle">
        <input id="${n}-label-show-value" type="checkbox" ${a}show-value${l}${r.showValue?" checked":""}>
        <label for="${n}-label-show-value">Show value</label>
      </div></div>
      <div class="field-row"><div class="toggle">
        <input id="${n}-label-show-unit" type="checkbox" ${a}show-unit${l}${r.showUnit?" checked":""}>
        <label for="${n}-label-show-unit">Show unit</label>
      </div></div>
      <div class="field-row"><label for="${n}-label-precision">${t} label precision</label>
        <input id="${n}-label-precision" type="number" min="0" step="1" ${a}precision${l} value="${S(r.precision)}" placeholder="inherit primary precision">
      </div>`}function tt(o){let e=D(o).trim().toLowerCase()||"never";return["never","quarterly","hourly","daily","weekly","monthly","yearly",...Array.from({length:59},(r,i)=>`${i+1}m`),...Array.from({length:23},(r,i)=>`${i+1}h`)].map(r=>`<option value="${r}"${e===r?" selected":""}>${r}</option>`).join("")}function S(o){return D(o).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function fe(o){return typeof o=="string"&&/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(o.trim())}function et(o){if(!fe(o))return null;let e=o.trim().toLowerCase();return e.length===7?e:`#${e.slice(1).split("").map(t=>t+t).join("")}`}function G(o){var t;let e=D(o).trim().toLowerCase();return e?(t=et(e))!=null?t:e:""}function Q(o,e="#000000"){var t,r;return(r=(t=et(o))!=null?t:et(e))!=null?r:"#000000"}function j(o,e=!1){let t=D(o);return e&&t.trim()?t:t.trim()}function be(o){let e=K(o);return e!==null&&e>=0&&e<=100?e:null}function It(o,e,t){return`<input id="${o}" type="number" min="0" max="100" step="any" ${e} value="${S(t)}">%`}function yt(o){return Number.isFinite(o.percent)?"percent":o.entity?o.fixed!==""&&o.fixed!==void 0?"entity-fallback":"entity":"fixed"}function St(o,e,t){return`<div class="field-row">
      <label for="${o}-source-mode">Source</label>
      <select id="${o}-source-mode" data-field="${o}-source-mode">
        ${[["fixed","Fixed"],["entity","Entity"],["entity-fallback","Entity with fixed fallback"],["percent","Percentage"]].map(([r,i])=>`<option value="${r}"${e===r?" selected":""}>${i}</option>`).join("")}
      </select>
    </div>
    <div class="field-row">
      <label for="${o}-percent">Scale percentage</label>
      ${It(`${o}-percent`,`data-field="${o}-percent"`,t)}
      <button type="button" data-action="${o}-clear-percent">Clear percentage</button>
      <div class="section-note">Percentage uses the current scale. Entity and fixed values take precedence when present.</div>
    </div>`}function I({id:o,field:e=null,kind:t=null,index:r=null,value:i="",fallbackHex:n="#000000",placeholder:a="",extraDataset:l={},cssText:s=!1,label:c="Color"}){let d=D(i).trim(),u=Q(d,n),h=Object.entries(l).map(([x,k])=>`data-${x}="${S(k)}"`).join(" "),f=e?`data-field="${e}"${h?` ${h}`:""}`:`data-kind="${t}" data-index="${r}"${h?` ${h}`:""}`,m=e?`data-field="${e}-text-fallback"${h?` ${h}`:""}`:`data-kind="${t}-text-fallback" data-index="${r}"${h?` ${h}`:""}`;return`
      <div class="field-grid">
        <input id="${o}" type="color" ${f} value="${S(u)}">
        ${s||d&&!fe(d)?`<input${s?` id="${o}-text-fallback" data-css-color="true" aria-label="${S(c)} (CSS value)"`:""} type="text" ${m} value="${S(s?i:d)}" placeholder="${S(a||"CSS color value")}">`:""}
      </div>
    `}var vt=`
	        :host {
	          display: block;
	        }
	        .editor {
	          display: grid;
	          gap: 18px;
	          padding: 10px 0 14px;
	        }
	        .section {
	          display: grid;
	          gap: 14px;
	          padding: 14px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 88%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 35%, transparent);
	          border-radius: 14px;
	          box-shadow: 0 1px 0 color-mix(in srgb, var(--divider-color, #888) 20%, transparent);
	        }
	        .section-head {
	          display: grid;
	          gap: 4px;
	        }
	        .section h3 {
	          margin: 0;
	          font-size: 1rem;
	          font-weight: 700;
	          letter-spacing: 0.01em;
	          color: var(--primary-text-color, #111);
	        }
	        .section-note {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	        }
	        .field-grid {
	          display: grid;
	          gap: 12px;
	        }
	        .editor-grid,
	        .field-row {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .inline-row {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	          align-items: end;
	        }
	        label {
	          font-size: 0.9rem;
	          font-weight: 500;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	        }
	        input,
	        select,
	        button {
	          font: inherit;
        }
        input[type="text"],
        input[type="number"],
	        input[type="color"],
	        select {
	          width: 100%;
	          box-sizing: border-box;
	          min-height: 42px;
	          padding: 8px 10px;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 82%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 38%, transparent);
	          border-radius: 10px;
	        }
	        input[type="color"] {
	          padding: 4px;
	          cursor: pointer;
	        }
	        input[type="text"]:focus,
	        input[type="number"]:focus,
	        input[type="color"]:focus,
	        select:focus {
	          outline: 2px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 55%, transparent);
	          outline-offset: 1px;
	        }
	        input[type="checkbox"] {
	          width: 18px;
	          height: 18px;
	        }
	        .toggle {
	          display: flex;
	          gap: 8px;
	          align-items: center;
	          flex-wrap: wrap;
	        }
	        .list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .list-row {
	          display: grid;
	          gap: 10px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: end;
	          min-width: 0;
	        }
        .generic-marker-list {
          gap: 8px;
        }
        .generic-marker-item {
          min-width: 0;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 32%, transparent);
          border-radius: 10px;
          background: color-mix(in srgb, var(--card-background-color, #fff) 82%, transparent);
        }
        .generic-marker-item[data-expanded="true"] {
          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 38%, var(--divider-color, #888));
        }
        .generic-marker-header {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 6px 8px;
        }
        .generic-marker-toggle {
          display: grid;
          grid-template-columns: minmax(0, auto) minmax(0, 1fr);
          align-items: center;
          gap: 4px 10px;
          flex: 1 1 auto;
          min-width: 0;
          min-height: 40px;
          padding: 4px 6px;
          border: 0;
          background: transparent;
          text-align: left;
        }
        .generic-marker-toggle:hover,
        .generic-marker-toggle:focus {
          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
        }
        .generic-marker-title {
          font-weight: 700;
          white-space: nowrap;
        }
        .generic-marker-summary {
          min-width: 0;
          overflow: hidden;
          color: var(--secondary-text-color, #666);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .generic-marker-actions {
          display: flex;
          flex: 0 0 auto;
          gap: 4px;
          align-items: center;
        }
        .generic-marker-actions button {
          min-width: 38px;
          min-height: 38px;
          padding: 6px;
        }
        .generic-marker-body {
          gap: 12px;
          padding: 12px;
          border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 25%, transparent);
          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
        }
        .generic-marker-pair,
        .generic-marker-options {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          align-items: end;
        }
        .generic-marker-precision {
          max-width: 220px;
        }
	        .list-row.triple {
	          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
	        }
	        .list-row.segment-row {
	          grid-template-columns: minmax(72px, 1fr) minmax(72px, 1fr) minmax(52px, 64px) 40px;
	          align-items: center;
	        }
	        .list-row.segment-row > * {
	          min-width: 0;
	        }
	        .list-row.segment-row > button {
	          width: 40px;
	          min-width: 40px;
	          padding: 6px;
	          justify-self: end;
	        }
	        .list-row.gradient-stop-row {
	          grid-template-columns: minmax(110px, 1fr) minmax(120px, 1fr) auto;
	        }
	        .gradient-stop-list {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .gradient-stop-draft {
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .segment-editor-row {
	          display: grid;
	          gap: 6px;
	          min-width: 0;
	        }
	        .segment-draft {
	          display: grid;
	          gap: 6px;
	          padding-top: 10px;
	          border-top: 1px dashed color-mix(in srgb, var(--divider-color, #888) 34%, transparent);
	        }
	        .gradient-preview {
	          display: grid;
	          gap: 8px;
	          min-width: 0;
	        }
	        .gradient-preview-track {
	          position: relative;
	          width: 100%;
	          min-height: 28px;
	          min-width: 0;
	          border-radius: 999px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: linear-gradient(to right, #4CAF50 0%, #FF9800 50%, #F44336 100%);
	          box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-background-color, #fff) 35%, transparent);
	          overflow: hidden;
	        }
	        .gradient-preview-stop {
	          position: absolute;
	          top: 3px;
	          bottom: 3px;
	          width: 2px;
	          margin-left: -1px;
	          border-radius: 999px;
	          background: color-mix(in srgb, var(--primary-text-color, #111) 72%, transparent);
	          box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 52%, transparent);
	        }
	        .entity-shell {
	          display: grid;
	          gap: 10px;
	          padding: 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 68%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 14px;
	        }
	        .entity-main {
	          display: grid;
	          gap: 10px;
	          padding: 10px 12px 12px;
	          min-width: 0;
	          border-radius: 12px;
	          background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	        }
	        .entity-header {
	          display: grid;
	          gap: 12px;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: start;
	          padding-bottom: 4px;
	          border-bottom: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	        }
	        .entity-header-main {
	          display: grid;
	          gap: 4px;
	          min-width: 0;
	          flex: 1 1 auto;
	        }
	        .entity-title {
	          font-size: 0.95rem;
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	        }
	        .entity-subtitle {
	          font-size: 0.8rem;
	          color: var(--secondary-text-color, #666);
	          min-width: 0;
	          overflow: hidden;
	          text-overflow: ellipsis;
	          white-space: nowrap;
	        }
	        .entity-actions {
	          display: flex;
	          flex-wrap: wrap;
	          justify-content: flex-end;
	          align-items: center;
	          gap: 8px;
	          flex: 0 0 auto;
	          min-width: min(100%, 240px);
	        }
	        .entity-actions button {
	          min-height: 34px;
	          padding: 6px 10px;
	          flex: 0 1 auto;
	        }
	        .entity-fields {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	        }
	        .entity-icon-field {
	          display: grid;
	          gap: 6px;
	          min-width: 0;
	        }
	        .entity-icon-modes {
	          display: flex;
	          align-items: center;
	          flex-wrap: wrap;
	          gap: 10px 14px;
	        }
	        .entity-icon-mode-option {
	          display: inline-flex;
	          align-items: center;
	          gap: 5px;
	          cursor: pointer;
	          font-size: 0.85rem;
	        }
	        .entity-icon-mode-option input[type="radio"] {
	          width: 16px;
	          height: 16px;
	          margin: 0;
	          accent-color: var(--primary-color, #03a9f4);
	        }
	        .override-toggle {
	          display: inline-flex;
	          align-items: center;
	          gap: 8px;
	          justify-self: start;
	          padding: 8px 10px;
	          border-radius: 10px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
	          color: var(--secondary-text-color, #666);
	          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
	        }
	        .override-toggle:hover,
	        .override-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 74%, transparent);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 28%, var(--divider-color, #888));
	          color: var(--primary-text-color, #111);
	        }
	        .override-toggle[aria-expanded="true"] {
	          color: var(--primary-text-color, #111);
	          border-color: color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 40%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 70%, transparent);
	        }
	        .override-panel {
	          display: grid;
	          gap: 12px;
	          padding: 12px 14px;
	          min-width: 0;
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 28%, transparent);
	          border-left: 4px solid color-mix(in srgb, var(--accent-color, var(--primary-color, #03a9f4)) 65%, transparent);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #ffffff)) 82%, transparent);
	        }
	        .override-panel::before {
	          content: "Overrides";
	          font-size: 0.78rem;
	          font-weight: 700;
	          letter-spacing: 0.04em;
	          text-transform: uppercase;
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group {
	          display: grid;
	          gap: 10px;
	          min-width: 0;
	          --override-group-accent: var(--accent-color, var(--primary-color, #03a9f4));
	          border-radius: 12px;
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 24%, transparent);
	          background: color-mix(in srgb, var(--card-background-color, #fff) 78%, transparent);
	          overflow: hidden;
	        }
	        .override-group[data-group="scale"] {
	          --override-group-accent: #4f8dff;
	        }
	        .override-group[data-group="target"] {
	          --override-group-accent: #ff9b3d;
	        }
	        .override-group[data-group="baseline"] {
	          --override-group-accent: #5bbd6d;
	        }
	        .override-group[data-group="bar"] {
	          --override-group-accent: #34c6d3;
	        }
	        .override-group[data-group="needle"] {
	          --override-group-accent: #9b6bff;
	        }
	        .override-group[data-group="formatting"] {
	          --override-group-accent: #d46be3;
	        }
	        .override-group[data-group="layout"] {
	          --override-group-accent: #6e90ff;
	        }
	        .override-group[data-group="peak"] {
	          --override-group-accent: #f08b3e;
	        }
	        .override-group[data-group="segments"] {
	          --override-group-accent: #d2a53a;
	        }
	        .override-group[data-group="gradient-stops"] {
	          --override-group-accent: #48b978;
	        }
	        .card-subgroup {
	          margin-top: 2px;
	        }
	        .override-group.is-inactive .override-group-summary,
	        .override-group.is-inactive .section-note {
	          color: var(--secondary-text-color, #666);
	        }
	        .override-group.is-inactive .override-group-body {
	          opacity: 0.92;
	        }
	        .override-group-toggle {
	          display: flex;
	          justify-content: space-between;
	          align-items: flex-start;
	          gap: 12px;
	          width: 100%;
	          text-align: left;
	          border: 0;
	          border-radius: 0;
	          background: transparent;
	          padding: 10px 12px;
	          min-width: 0;
	        }
	        .override-group-toggle:hover,
	        .override-group-toggle:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 72%, transparent);
	        }
	        .override-group[data-expanded="true"] {
	          border-color: color-mix(in srgb, var(--override-group-accent) 34%, transparent);
	          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--override-group-accent) 70%, transparent);
	        }
	        .override-group-title {
	          font-weight: 700;
	          color: var(--primary-text-color, #111);
	          min-width: 0;
	          overflow-wrap: anywhere;
	        }
	        .override-group-summary {
	          font-size: 0.82rem;
	          color: var(--secondary-text-color, #666);
	          text-align: right;
	          min-width: 0;
	          max-width: 42%;
	          white-space: nowrap;
	          overflow: hidden;
	          text-overflow: ellipsis;
	        }
	        .override-group-body {
	          display: grid;
	          gap: 12px;
	          padding: 0 12px 12px;
	          min-width: 0;
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	        }
	        button {
	          min-height: 40px;
	          padding: 8px 12px;
	          cursor: pointer;
	          color: var(--primary-text-color, #111);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 78%, transparent);
	          border: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent);
	          border-radius: 10px;
	        }
	        button:hover,
	        button:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 60%, transparent);
	        }
	        button:disabled {
	          cursor: not-allowed;
	          opacity: 0.58;
	          color: var(--secondary-text-color, #666);
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	          border-color: color-mix(in srgb, var(--divider-color, #888) 22%, transparent);
	          box-shadow: none;
	        }
	        button:disabled:hover,
	        button:disabled:focus {
	          background: color-mix(in srgb, var(--secondary-background-color, var(--card-background-color, #fff)) 86%, transparent);
	        }
	        .field-row .field-grid {
	          gap: 8px;
	          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	          align-items: end;
	        }
	        .field-row .field-grid > * {
	          min-width: 0;
	        }
	        ha-entity-picker {
	          min-width: 0;
	          width: 100%;
	        }
	        ha-icon-picker {
	          display: block;
	          min-width: 0;
	          width: 100%;
	        }
	        @media (max-width: 720px) {
	          .section {
	            gap: 12px;
	          }
	          .inline-row {
	            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	          }
	          .override-group-toggle {
	            flex-wrap: wrap;
	          }
	          .override-group-summary {
	            max-width: 100%;
	            flex: 1 1 100%;
	            text-align: left;
	          }
	          .entity-actions {
	            min-width: 0;
	            justify-content: flex-start;
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(3, minmax(0, 1fr)) 40px;
	          }
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: auto;
	            width: 40px;
	          }
	        }
	        @media (max-width: 480px) {
	          .section {
	            padding: 12px;
	          }
	          .inline-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-shell,
	          .entity-main,
	          .override-panel {
	            padding-left: 10px;
	            padding-right: 10px;
	          }
	          .entity-header {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .entity-actions {
	            width: 100%;
	          }
	          .entity-actions button {
	            flex: 1 1 120px;
	          }
	          .list-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .generic-marker-header {
	            flex-wrap: wrap;
	          }
	          .generic-marker-toggle {
	            flex-basis: 100%;
	          }
	          .generic-marker-actions {
	            width: 100%;
	          }
	          .generic-marker-actions button {
	            flex: 1 1 auto;
	          }
	          .generic-marker-pair,
	          .generic-marker-options {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.triple,
	          .list-row.gradient-stop-row {
	            grid-template-columns: minmax(0, 1fr);
	          }
	          .list-row.segment-row {
	            grid-template-columns: repeat(2, minmax(0, 1fr));
	          }
	          .list-row > button,
	          .list-row.triple > button,
	          .list-row.gradient-stop-row > button {
	            width: 100%;
	          }
	          .list-row.segment-row > button {
	            grid-column: 1 / -1;
	            width: 100%;
	          }
	        }
	      `;function xt({group:o,title:e,summary:t,content:r,inactive:i=!1},n){return`
      <div class="override-group card-subgroup${i?" is-inactive":""}" data-group="${o}" data-expanded="${n?"true":"false"}">
        <button
          type="button"
          id="card-group-${o}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${o}"
          aria-expanded="${n?"true":"false"}"
        >
          <span id="card-group-${o}-title" class="override-group-title">${n?"\u25BE":"\u25B8"} ${e}</span>
          <span id="card-group-${o}-summary" class="override-group-summary">${S(t)}</span>
        </button>
        <div class="override-group-body" style="display:${n?"grid":"none"};">
          ${r}
        </div>
      </div>
    `}function wt({renderGroup:o,target:e,peak:t,floor:r,references:i}){return`	        <div class="section">
          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Configure Target, Peak, Floor, and custom reference markers.</div>
	          </div>
	          <div class="field-grid">
            ${o({group:"marker-target",title:"Target",...e})}
            ${o({group:"marker-peak",title:"Peak",...t})}
            ${o({group:"marker-floor",title:"Floor",...r})}
            ${o({group:"generic-markers",title:"Generic Reference Markers",...i})}
          </div>
	        </div>`}var ye=class{constructor(){this.values=new Map}reset(){this.values.clear()}handle(e,t=!1){var u,h,f,m,x,k;let r=e.target;if(t&&(r==null?void 0:r.type)==="number")return!0;let i=(m=(f=(u=r==null?void 0:r.dataset)==null?void 0:u.field)!=null?f:(h=r==null?void 0:r.dataset)==null?void 0:h.kind)!=null?m:"";if(i==="generic-marker-source-mode"&&r.id)for(let v of["fixed","fallback","percent"])this.values.delete(r.id.replace(/source-mode$/,v));if((r==null?void 0:r.type)!=="number"||!r.id||/^(?:entity-)?gradient-/.test(i)||/^(?:target|baseline)-percent$/.test(i))return!1;if(r.isConnected===!1)return!0;let n=r.value,a=i==="generic-marker-percent",s=/(?:precision|decimal)$/.test(i)?ie(n):K(n),c=s!==null&&!((x=r.validity)!=null&&x.badInput)&&(!/(?:layout-height|override-height)$/.test(i)||s>=24),d=e.type==="change"&&n===""&&!((k=r.validity)!=null&&k.badInput)&&!a;return c||d?(this.values.delete(r.id),!1):(this.values.set(r.id,n),!0)}captureFocus(e){let t=e.activeElement;return t&&this.values.has(t.id)?t.id:null}apply(e,t=null){var r,i,n,a,l,s;for(let[c,d]of this.values){let u=(i=(r=e.getElementById)==null?void 0:r.call(e,c))!=null?i:e.querySelector(`#${c}`);if(!u){this.values.delete(c);continue}u!==e.activeElement&&(u.value=d)}t&&((s=(l=(a=(n=e.getElementById)==null?void 0:n.call(e,t))!=null?a:e.querySelector(`#${t}`))==null?void 0:l.focus)==null||s.call(l,{preventScroll:!0}))}};function me(o,e,t,r=!1){return o.source(e,t,r)}function $t(o,e){return me(o,{type:"card"},e).fixed}function kt(o,e){return me(o,{type:"card"},e).entity}function rt(o,e,t,r,i){return o.setSource(e,t,r,i)}function di(o,e){let t=r=>r!==""&&r!==void 0&&r!==null;return["min","max"].some(r=>{let i=me(o,e,r);return t(i==null?void 0:i.fixed)||t(i==null?void 0:i.entity)})}function Vr(o,e){let t=[],r=me(o,e,"min"),i=me(o,e,"max");return r.entity?t.push("Min entity"):r.fixed!==""&&r.fixed!==void 0&&t.push(`Min ${r.fixed}`),i.entity?t.push("Max entity"):i.fixed!==""&&i.fixed!==void 0&&t.push(`Max ${i.fixed}`),t.length?t.join(" \u2022 "):"Inherited"}function jt(o,e){return o.mutate(e,t=>{let r=p(t,["scale","min"]);return r=p(r,["scale","max"]),r=p(r,["min"]),r=p(r,["max"]),r=p(r,["min_entity"]),r=p(r,["max_entity"]),C(r,["scale"])},{rerender:!0})}function Se(o,{field:e,kind:t,index:r,value:i}){if(e==="scale-min"||e==="scale-max")return rt(o,{type:"card"},e.slice(6),"fixed",i),!0;if(t==="scale-min-entity-source"||t==="scale-max-entity-source")return rt(o,{type:"card"},t.split("-")[1],"entity",i),!0;let n={type:"entity",index:Number(r)};return t==="entity-scale-inherit"?(i&&jt(o,n),!0):["entity-override-min","entity-override-max","entity-override-min-entity-source","entity-override-max-entity-source"].includes(t)?(rt(o,n,t.split("-")[2],t.endsWith("-entity-source")?"entity":"fixed",i),!0):!1}function Et(o,e){if((e==null?void 0:e.type)==="entity"){let a=e.index,l=me(o,e,"min",!0),s=me(o,e,"max",!0),c=!di(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${a}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${a}"${c?" checked":""}>
	                          <label for="entity-${a}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${a}-min">Min fallback</label>
                        <input id="entity-${a}-min" type="number" step="any" data-kind="entity-override-min" data-index="${a}" value="${S(l.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${W("entity-override-min-entity-source",a,l.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${a}-max">Max fallback</label>
                        <input id="entity-${a}-max" type="number" step="any" data-kind="entity-override-max" data-index="${a}" value="${S(s.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${W("entity-override-max-entity-source",a,s.entity,"inherit card default")}
                      </div>
	                          `}let t=$t(o,"min"),r=$t(o,"max"),i=kt(o,"min"),n=kt(o,"max");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${S(t)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${W("scale-min-entity-source","card",i)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${S(r)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${W("scale-max-entity-source","card",n)}
            </div>
          </div>
	        </div>`}function oe(o,e,t){var r,i;return(i=(r=o.read(e,["formatting",t]))!=null?r:o.read(e,[t]))!=null?i:""}function Vt(o,e,t){let r=[["formatting",t],[t]];for(let i of r){let n=o.read(e,i);if(n!=null&&n!=="")return n}if((e==null?void 0:e.type)==="entity")for(let i of r){let n=o.read({type:"card"},i);if(n!=null&&n!=="")return n}return""}function Pt(o,e,t){let r=D(t).trim();return o.mutate(e,i=>{let n=r?P(i,["formatting","unit"],r):p(i,["formatting","unit"]);return n=p(n,["unit"]),C(n,["formatting"])})}function Tt(o,e,t){let r=ie(t),i=t===""||t===null||t===void 0;return!i&&r===null?!1:o.mutate(e,n=>{let a=i?p(n,["formatting","decimal"]):P(n,["formatting","decimal"],r);return a=p(a,["decimal"]),C(a,["formatting"])})}function Lt(o,e){return o.mutate(e,t=>{let r=te(t,[["formatting","unit"],["formatting","decimal"],["unit"],["decimal"]]);return C(r,["formatting"])},{rerender:!0})}function Ut(o,e){var r;let t=(r=o.read(e,["formatting"]))!=null?r:{};return b(t)&&(Object.prototype.hasOwnProperty.call(t,"unit")||Object.prototype.hasOwnProperty.call(t,"decimal"))?!0:o.read(e,["unit"])!==void 0||o.read(e,["decimal"])!==void 0}function Pr(o,e){let t=[],r=oe(o,e,"unit"),i=oe(o,e,"decimal");return r!==""&&t.push(`Unit ${r}`),i!==""&&t.push(`${i} ${Number(i)===1?"decimal":"decimals"}`),t.length?t.join(" \u2022 "):"Inherited"}function it(o,{field:e,kind:t,index:r,value:i}){if(e==="formatting-unit"||e==="formatting-decimal")return(e==="formatting-unit"?Pt:Tt)(o,{type:"card"},i),!0;let n={type:"entity",index:Number(r)};return t==="entity-formatting-inherit"?(i&&Lt(o,n),!0):t==="entity-formatting-unit"||t==="entity-formatting-decimal"?((t==="entity-formatting-unit"?Pt:Tt)(o,n,i),!0):!1}function Ft(o,e){if((e==null?void 0:e.type)==="entity"){let i=e.index,n=!Ut(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${i}"${n?" checked":""}>
                          <label for="entity-${i}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-unit">Unit</label>
                        <input id="entity-${i}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${i}" value="${S(Vt(o,e,"unit"))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-decimal">Decimals</label>
                        <input id="entity-${i}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${i}" value="${S(Vt(o,e,"decimal"))}" placeholder="inherit card default">
                      </div>
	                          `}let t=oe(o,{type:"card"},"unit"),r=oe(o,{type:"card"},"decimal");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${S(t)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${S(r)}">
            </div>
          </div>
	        </div>`}function Kt(o){switch(o){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return"bands"}}function qt(o,e){var i;let t=o.read(e,["bar","fill_style"]);if(t)return t;let r=(i=o.read(e,["bar","color_mode"]))!=null?i:o.read(e,["color_mode"]);return Kt(r)}function X(o,e){return(e==null?void 0:e.type)==="entity"?ae(o.read(e,[]),o.read({type:"card"},[]),{isCardScope:!1}).fill_style:ae(o.read({type:"card"},[]),null,{isCardScope:!0}).fill_style}function nt(o,e){var t,r;return(r=(t=o.read(e,["bar","color"]))!=null?t:o.read(e,["color"]))!=null?r:"#4a9eff"}function Ht(o,e){let t=[["bar","color"],["color"]];for(let r of t){let i=o.read(e,r);if(i!=null&&i!=="")return i||"#4a9eff"}if((e==null?void 0:e.type)==="entity")for(let r of t){let i=o.read({type:"card"},r);if(i!=null&&i!=="")return i||"#4a9eff"}return"#4a9eff"}function Ot(o,e,t,r,i=[]){let n={deprecatedKeys:i,prunePaths:[["bar"]]};return o.mutate(e,a=>{let l=r===void 0?p(a,["bar",t]):P(a,["bar",t],r);return l=te(l,i),C(l,["bar"])},n)}function Mt(o,e,t){let r=D(t).trim();return Ot(o,e,"fill_style",r||void 0,[["color_mode"]])}function Ct(o,e,t,r={}){let i=j(t,r.cssText),n=!i||G(i)===G("#4a9eff");return Ot(o,e,"color",n?void 0:i,[["color"]])}function _e(o,e){return!!o.read(e,["bar","solid_fill"])}function Wt(o,e){if((e==null?void 0:e.type)!=="entity")return _e(o,e);let t=o.read(e,["bar","solid_fill"]);return t!==void 0?!!t:_e(o,{type:"card"})}function Dt(o,e,t){return Ot(o,e,"solid_fill",t?!0:void 0)}function Jt(o,e){return!!ae(o.read(e,[]),(e==null?void 0:e.type)==="entity"?o.read({type:"card"},[]):null).animated}function ci(o,e,t){var i;let r=(i=o.read(e,["animated"]))!=null?i:(e==null?void 0:e.type)==="entity"?ae(o.read({type:"card"},[]),null).animated:!0;return Ot(o,e,"animated",t?r?void 0:!0:!1)}function Yt(o,e){return o.mutate(e,t=>{let r=te(t,[["bar","fill_style"],["bar","color"],["bar","solid_fill"],["color_mode"],["color"]]);return C(r,["bar"])},{rerender:!0})}function Xt(o,e){var r;let t=(r=o.read(e,["bar"]))!=null?r:{};return b(t)&&(Object.prototype.hasOwnProperty.call(t,"fill_style")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"solid_fill"))?!0:o.read(e,["color_mode"])!==void 0||o.read(e,["color"])!==void 0}function Tr(o,e){var n;let t=[],r=qt(o,e),i=(n=o.read(e,["bar","color"]))!=null?n:o.read(e,["color"]);return r&&r!=="bands"&&t.push(r.replace(/_/g," ")),i&&G(i)!==G("#4a9eff")&&t.push("Custom color"),t.length?t.join(" \u2022 "):"Inherited"}function ve(o,{field:e,kind:t,index:r,value:i},n={}){if(n.animation&&e==="bar-animated")return ci(o,{type:"card"},i),!0;let a={"bar-fill-style":Mt,"bar-color":Ct,"bar-solid-fill":Dt};if(Object.prototype.hasOwnProperty.call(a,e))return a[e](o,{type:"card"},i,n),!0;let l={type:"entity",index:Number(r)};if(t==="entity-bar-inherit")return i&&Yt(o,l),!0;let s={"entity-bar-fill-style":Mt,"entity-bar-color":Ct,"entity-bar-solid-fill":Dt};return Object.prototype.hasOwnProperty.call(s,t)?(s[t](o,l,i),!0):!1}function at(o,e,t=()=>"",r={}){if((e==null?void 0:e.type)==="entity"){let l=e.index,s=!Xt(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${l}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${l}"${s?" checked":""}>
                          <label for="entity-${l}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-fill-style">Fill style</label>
                        <select id="entity-${l}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${l}" value="${S(X(o,e))}">
                          <option value="bands"${X(o,e)==="bands"?" selected":""}>bands</option>
                          <option value="solid"${X(o,e)==="solid"?" selected":""}>solid</option>
                          <option value="gradient"${X(o,e)==="gradient"?" selected":""}>gradient</option>
                          <option value="soft_bands"${X(o,e)==="soft_bands"?" selected":""}>soft_bands</option>
                          <option value="band_gradient"${X(o,e)==="band_gradient"?" selected":""}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${l}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${l}"${Wt(o,e)?" checked":""}>
                          <label for="entity-${l}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-color">Bar color</label>
                        ${I({id:`entity-${l}-bar-color`,kind:"entity-bar-color",index:l,value:Ht(o,e),fallbackHex:"#4a9eff",placeholder:"inherit card default"})}
                      </div>
	                          `}let i=X(o,{type:"card"}),n=nt(o,{type:"card"}),a=_e(o,{type:"card"});return`	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${S(i)}">
                <option value="solid"${i==="solid"?" selected":""}>solid</option>
                <option value="gradient"${i==="gradient"?" selected":""}>gradient</option>
                <option value="bands"${i==="bands"?" selected":""}>bands</option>
                <option value="band_gradient"${i==="band_gradient"?" selected":""}>band_gradient</option>
                <option value="soft_bands"${i==="soft_bands"?" selected":""}>soft_bands</option>
              </select>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="bar-solid-fill" type="checkbox" data-field="bar-solid-fill"${a?" checked":""}>
                <label for="bar-solid-fill">Solid fill</label>
              </div>
            </div>
            ${r.animation?`<div class="field-row"><div class="toggle">
              <input id="bar-animated" type="checkbox" data-field="bar-animated"${Jt(o,e)?" checked":""}>
              <label for="bar-animated">Animated</label>
            </div></div>`:""}<div class="field-row">
              <label for="bar-color">Bar color</label>
              ${I({cssText:r.cssText,label:"Bar color",id:"bar-color",field:"bar-color",value:n,fallbackHex:"#4a9eff",placeholder:"#4a9eff"})}
            </div>
          </div>${t()}
	        </div>`}function Fr(o,e=null){let t=[...o].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var a;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(a=r.label)!=null?a:null}})}function Mr(o,e,t){if(o==null)return null;if(typeof o=="object"&&!Array.isArray(o)){let n=Z(o.fixed);return Number.isFinite(n)?Cr(n,e,t):Number.isFinite(o.percent)?o.percent:null}let r=re(o);if(Number.isFinite(r))return r;let i=Z(o);return Number.isFinite(i)?Cr(i,e,t):null}function ui(o){return Array.isArray(o)&&o.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Dr(o,e=0,t=100){var a,l;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((a=o.bar)==null?void 0:a.segments)?o.bar.segments:[]).filter(s=>!(s!=null&&s.invalidBoundary));if(((l=o.bar)==null?void 0:l.segment_space)==="scale"||ui(n)){let s=n.map(c=>{var d;return{from:Mr(c.from,r,i),to:Mr(c.to,r,i),color:c.color,label:(d=c.label)!=null?d:null}}).filter(c=>Number.isFinite(c.from)&&c.color);return Fr(s,100).filter(c=>Number.isFinite(c.from)&&Number.isFinite(c.to)&&c.color)}return Fr(n,100).filter(s=>Number.isFinite(s.from)&&Number.isFinite(s.to)&&s.color)}function Cr(o,e,t){if(!Number.isFinite(o))return null;let r=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(o-r)/n*100))}var xe=class{constructor(e,t,r){this.context=e,this.ui=t,this.array=r}get shadowRoot(){return this.ui.root()}fillStyle(e){return X(this.context,e)}_getShadowElementById(e){var t,r,i,n;return(n=(r=(t=this.shadowRoot)==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?n:(i=this.shadowRoot)==null?void 0:i.querySelector(`#${e}`)}_renderListRows(e,t){return e.map(t).join("")}handle(e,t=e.type){var w,E,V,M,O,A,z,N;let r=e.target;if(t==="input"&&(r==null?void 0:r.type)==="checkbox")return!1;let i=(w=r==null?void 0:r.dataset)==null?void 0:w.kind,n=i==null?void 0:i.replace(/-text-fallback$/,""),a=(E=r==null?void 0:r.dataset)==null?void 0:E.action,l=!!this._getScopedSegmentsValue,s=l?"segment":"gradient",c=(V=t==="click"?a:n)==null?void 0:V.includes("entity-"),d=c?{type:"entity",index:Number(r.dataset.index)}:{type:"card"},u=n==null?void 0:n.replace(/^entity-/,""),h=Number(c?r.dataset[l?"segmentIndex":"stopIndex"]:(M=r==null?void 0:r.dataset)==null?void 0:M.index),f=()=>l?this._getScopedSegmentsValue(d):this._getScopedGradientStopsValue(d),m=(B,L,U)=>l?this._setScopedSegments(d,B,L,U):this._setScopedGradientStops(d,B,L,U),x=()=>l?this._commitSegmentDraft(d):this._commitGradientStopDraft(d),k=()=>l?this._refreshSegmentUi(d):this._refreshGradientDraftUi(d);if(t==="click")return!["add-segment","remove-segment","add-entity-segment","remove-entity-segment","add-gradient-stop","remove-gradient-stop","add-entity-gradient-stop","remove-entity-gradient-stop"].includes(a)||!a.includes(s)?!1:(a.startsWith("add-")?(this.ui.focus(`#${c?`entity-${d.index}-`:""}${s}-draft-${l?"from":"pos"}`),x()):m(f().filter((B,L)=>L!==h),{rerender:!0,...l?{sort:!0}:{}},{type:"remove",index:h}),!0);if(n===`entity-${l?"segments":"gradient-stops"}-inherit`)return r.checked&&(l?this._clearSegmentsOverride(d):this._clearGradientStopsOverride(d)),!0;if(!(u!=null&&u.startsWith(`${s}-`)))return!1;let v=u.startsWith(`${s}-draft-`),$=u.slice((v?`${s}-draft-`:`${s}-`).length),_=(A=(O=e.detail)==null?void 0:O.value)!=null?A:r.value;if(t==="keydown")return e.key==="Escape"&&v?((z=e.preventDefault)==null||z.call(e),l?this._segmentDrafts.set(this._getSegmentsScopeKey(d),this._createSegmentDraftState(d)):this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(d),this._createGradientStopDraftState(d)),this.ui.render()):e.key==="Enter"&&((N=e.preventDefault)==null||N.call(e),v?x():l&&["from","to"].includes($)?this._commitSegmentBoundaryEdit(d,h,$,_,r):!l&&$==="pos"&&this._commitGradientStopPosEdit(d,h,_,r)),!0;if(v)return l?this._setSegmentDraftField(d,$,_):this._setGradientStopsDraftField(d,$,_),!0;if(l&&["from","to"].includes($)||!l&&$==="pos")return t==="input"?l?(this._setSegmentBoundaryText(d,h,$,_),k()):this._setGradientStopPosText(d,h,_):t==="change"&&(l?this._commitSegmentBoundaryEdit(d,h,$,_,r):this._commitGradientStopPosEdit(d,h,_,r)),!0;let g=f(),y=g.map((B,L)=>{var U,q;return L!==h?B:l?{...B,color:_}:{...B,pos:(U=this._normalizeGradientStopPosValue(B==null?void 0:B.pos))!=null?U:0,color:$==="color"?_:(q=B==null?void 0:B.color)!=null?q:"#4a9eff"}});return(l||J(y)!==J(this._sanitizeGradientStopsForEmit(g)))&&m(y,l?{sort:!1}:{},{type:"edit",index:h,field:"color",value:_}),!0}};var we=class extends xe{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._segmentDrafts=new Map,this._segmentUiRows=new Map,this._segmentBoundaryTexts=new Map}_setSegments(e,t={}){return this._setScopedSegments({type:"card"},e,t)}_clearSegmentsOverride(e){return this._segmentDrafts.delete(this._getSegmentsScopeKey(e)),this._segmentUiRows.delete(this._getSegmentsScopeKey(e)),this._clearSegmentScopeTextState(e),this.context.mutate(e,t=>{let r=p(t,["bar","segments"]);return r=p(r,["segments"]),r=p(r,["severity"]),r=C(r,["bar"]),r},{rerender:!0})}_getSegmentsValue(){return this._getScopedSegmentsValue({type:"card"})}_getSegmentsScopeKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getSegmentBoundaryTextKey(e,t,r){return`${this._getSegmentsScopeKey(e)}:${t}:${r}`}_getSegmentBoundaryText(e={type:"card"},t,r,i=""){let n=this._getSegmentBoundaryTextKey(e,t,r);return this._segmentBoundaryTexts.has(n)?this._segmentBoundaryTexts.get(n):this._formatSegmentBoundaryValue(i)}_setSegmentBoundaryText(e,t,r,i){this._segmentBoundaryTexts.set(this._getSegmentBoundaryTextKey(e,t,r),D(i))}_clearSegmentBoundaryText(e,t,r){this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(e,t,r))}_clearSegmentScopeTextState(e){let t=`${this._getSegmentsScopeKey(e)}:`;for(let r of this._segmentBoundaryTexts.keys())r.startsWith(t)&&this._segmentBoundaryTexts.delete(r)}_getSegmentsUiRows(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentUiRows.has(t)?F(this._segmentUiRows.get(t)):null}_setSegmentsUiRows(e,t){this._segmentUiRows.set(this._getSegmentsScopeKey(e),F(t))}_getSegmentDraftState(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentDrafts.has(t)||this._segmentDrafts.set(t,this._createSegmentDraftState(e)),F(this._segmentDrafts.get(t))}_setSegmentDraftState(e,t,r={}){var i,n,a;if(this._segmentDrafts.set(this._getSegmentsScopeKey(e),{from:(i=t==null?void 0:t.from)!=null?i:"",to:(n=t==null?void 0:t.to)!=null?n:"",color:(a=t==null?void 0:t.color)!=null?a:this._getSegmentDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshSegmentUi(e);return}this.ui.render()}_setSegmentDraftField(e,t,r){let i=this._getSegmentDraftState(e),n=t==="color"?j(r,this.array.cssText):D(r);this._setSegmentDraftState(e,{...i,[t]:n},{refreshOnly:!0})}_isSegmentFillStyle(e){return["bands","soft_bands","band_gradient"].includes(e)}_getDefaultSegments(){return[{from:"0%",to:"33%",color:"#4CAF50"},{from:"33%",to:"75%",color:"#FF9800"},{from:"75%",to:"100%",color:"#F44336"}]}_getStoredScopedSegments(e={type:"card"}){let t=this.context.read(e,["bar","segments"]);if(t!==void 0)return t;let r=this.context.read(e,["segments"]);if(r!==void 0)return r;let i=this.context.read(e,["severity"]);return i!==void 0?i:null}_parseSegmentBoundaryInput(e){let t=D(e).trim();if(!t)return null;let r=t.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/),i=r?parseFloat(r[1]):null;if(Number.isFinite(i))return`${i}%`;let n=K(t);return n===null?null:n}_formatSegmentBoundaryValue(e){if(typeof e=="string")return e;if(typeof e=="number"&&Number.isFinite(e))return String(e);if(b(e)){if(Number.isFinite(e.percent))return`${e.percent}%`;if(Number.isFinite(this._getFiniteNumber(e.fixed)))return String(this._getFiniteNumber(e.fixed))}return""}_getSegmentDraftColorDefault(e={type:"card"}){var r;let t=this._getScopedSegmentsValue(e);return t.length?D((r=t[t.length-1])==null?void 0:r.color).trim()||"#4a9eff":"#4CAF50"}_getNewSegmentDefaults(e={type:"card"}){var n;let t=this._getScopedSegmentsValue(e),r=t[t.length-1],i=(n=r==null?void 0:r.to)!=null?n:null;return{from:i!=null?i:"0%",to:"100%",color:"#4a9eff"}}_createSegmentDraftState(e={type:"card"}){var l;let t=this._getNewSegmentDefaults(e),r=this._formatSegmentBoundaryValue(t.from),i=this._formatSegmentBoundaryValue(t.to),n=r==="100%"||r==="100"?"":r;return{from:n,to:n?i:"",color:(l=t.color)!=null?l:this._getSegmentDraftColorDefault(e)}}_normalizeSegmentForEditorComparison(e){if(!b(e))return null;let t=this._formatSegmentBoundaryValue(e.from).trim(),r=this._formatSegmentBoundaryValue(e.to).trim(),i=G(e.color);return!t||!r||!i?null:{from:t,to:r,color:i}}_segmentsEqualForEditor(e,t){let r=Array.isArray(e)?e.map(n=>this._normalizeSegmentForEditorComparison(n)).filter(Boolean):[],i=Array.isArray(t)?t.map(n=>this._normalizeSegmentForEditorComparison(n)).filter(Boolean):[];return r.length!==i.length?!1:r.every((n,a)=>n.from===i[a].from&&n.to===i[a].to&&n.color===i[a].color)}_getFallbackSegments(e={type:"card"}){return(e==null?void 0:e.type)==="entity"&&this._getStoredScopedSegments({type:"card"})!==null?F(this._getScopedSegmentsValue({type:"card"})):this._isSegmentFillStyle(this.fillStyle(e))?F(this._getDefaultSegments()):[]}_parseSegmentBoundaryText(e){let t=D(e).trim();if(!t)return{state:"empty",value:null};let r=this._parseSegmentBoundaryInput(t);return r===null?{state:"invalid",value:null}:{state:"valid",value:r}}_compareSegmentBoundaries(e,t){let r=this._getSegmentPreviewBoundaryValue(e),i=this._getSegmentPreviewBoundaryValue(t);return r===null||i===null?null:r<i?-1:r>i?1:0}_buildSegmentValidationRows(e={type:"card"}){var r;return((r=this._getSegmentsUiRows(e))!=null?r:this._getScopedSegmentsValue(e)).map((i,n)=>{let a=this._getSegmentBoundaryText(e,n,"from",i==null?void 0:i.from),l=this._getSegmentBoundaryText(e,n,"to",i==null?void 0:i.to),s=this._parseSegmentBoundaryText(a),c=this._parseSegmentBoundaryText(l);return{index:n,rawFrom:a,rawTo:l,parsedFrom:s,parsedTo:c}})}_getAutomaticEndInputRows(e){return this._getScopedSegmentsValue(e).map((t,r)=>{let i=this._getSegmentBoundaryText(e,r,"from",t==null?void 0:t.from),n=this._getSegmentBoundaryText(e,r,"to",t==null?void 0:t.to);return{...t,from:i,...n.trim()?{to:n}:{to:void 0}}})}_resolveAutomaticEndRows(e,t){var s,c,d,u;let r=this.context.read({type:"card"},[]),i=(e==null?void 0:e.type)==="entity"?this.context.read(e,[]):{},n=Xe(r,null),a=xr((c=(s=this.ui).hass)==null?void 0:c.call(s),(e==null?void 0:e.type)==="entity"?Xe(i,{scale:n}):n),l=Je(t.map((h,f)=>({...h,to:typeof h.to=="string"&&!h.to.trim()?void 0:h.to,label:f})),{legacySegmentSpace:(u=(d=this.array).segmentSpace)==null?void 0:u.call(d)});return Dr({bar:{segments:l}},a.min,a.max)}_getAutomaticEndValidationMessage(e,t,r){let i=t[r];if(!i)return"";let n=this._parseSegmentBoundaryText(i.from),a=this._parseSegmentBoundaryText(i.to);if(n.state!=="valid"||a.state==="invalid")return"Enter valid from/to values.";let l=this._resolveAutomaticEndRows(e,t),s=l.find(c=>c.label===r);if(!s||s.from>=s.to)return"From must be below To.";for(let c of l)if(!(c.label===r||c.from>=c.to)){if(s.from===c.from)return"Duplicate segment start.";if(s.from<c.to&&s.to>c.from)return"Segments overlap."}return""}_getSegmentRowValidationMessage(e={type:"card"},t){if(this.array.autoEnds)return this._getAutomaticEndValidationMessage(e,this._getAutomaticEndInputRows(e),t);let r=this._buildSegmentValidationRows(e),i=r[t];if(!i)return"";if(i.parsedFrom.state==="invalid"||i.parsedTo.state==="invalid"||i.parsedFrom.state==="empty"||i.parsedTo.state==="empty")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(i.parsedFrom.value,i.parsedTo.value)!==-1)return"From must be below To.";let n=this._getSegmentPreviewBoundaryValue(i.parsedFrom.value),a=this._getSegmentPreviewBoundaryValue(i.parsedTo.value);for(let l of r){if(l.index===t||l.parsedFrom.state!=="valid"||l.parsedTo.state!=="valid")continue;let s=this._getSegmentPreviewBoundaryValue(l.parsedFrom.value),c=this._getSegmentPreviewBoundaryValue(l.parsedTo.value);if(n===s)return"Duplicate segment start.";if(n<c&&a>s)return"Segments overlap."}return""}_getValidSegmentDraft(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.color.trim()||!CSS.supports("color",t.color))return null;let c=[...this._getAutomaticEndInputRows(e),t];if(this._getAutomaticEndValidationMessage(e,c,c.length-1))return null;let d=this._parseSegmentBoundaryInput(t.from),u=this._parseSegmentBoundaryInput(t.to);return{from:d,...t.to.trim()?{to:u}:{},color:t.color}}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),n=D(t.color).trim();if(r.state!=="valid"||i.state!=="valid"||!n||this._compareSegmentBoundaries(r.value,i.value)!==-1)return null;let a=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),s=this._buildSegmentValidationRows(e);for(let c of s){if(c.parsedFrom.state!=="valid"||c.parsedTo.state!=="valid")continue;let d=this._getSegmentPreviewBoundaryValue(c.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(c.parsedTo.value);if(a===d||a<u&&l>d)return null}return{from:r.value,to:i.value,color:n}}_canAddSegment(e={type:"card"}){return!!this._getValidSegmentDraft(e)}_getSegmentDraftValidationMessage(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.from.trim())return"Enter a start value to add a segment.";if(!t.color.trim()||!CSS.supports("color",t.color))return"Enter a valid CSS color.";let c=[...this._getAutomaticEndInputRows(e),t];return this._getAutomaticEndValidationMessage(e,c,c.length-1)}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),n=D(t.color).trim();if(!D(t.from).trim()&&!D(t.to).trim())return"";if(r.state!=="valid"||i.state!=="valid")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(r.value,i.value)!==-1)return"From must be below To.";if(!n)return"Choose a color to add a segment.";let a=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),s=this._buildSegmentValidationRows(e);for(let c of s){if(c.parsedFrom.state!=="valid"||c.parsedTo.state!=="valid")continue;let d=this._getSegmentPreviewBoundaryValue(c.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(c.parsedTo.value);if(a===d)return"Duplicate segment start.";if(a<u&&l>d)return"Segments overlap."}return""}_getSegmentPreviewBoundaryValue(e){if(typeof e=="string"){let t=e.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);if(t){let r=parseFloat(t[1]);return Number.isFinite(r)?r:null}}if(typeof e=="number"&&Number.isFinite(e))return e;if(b(e)){if(Number.isFinite(e.percent))return e.percent;let t=this._getFiniteNumber(e.fixed);if(Number.isFinite(t))return t}return null}_sortSegmentsForEditor(e){return Array.isArray(e)?F(e).sort((t,r)=>{let i=this._getSegmentPreviewBoundaryValue(t==null?void 0:t.from),n=this._getSegmentPreviewBoundaryValue(r==null?void 0:r.from);return i===null&&n===null?0:i===null?1:n===null?-1:i-n}):[]}_getSegmentPreviewRows(e={type:"card"}){var c;let t=(c=this._getSegmentsUiRows(e))!=null?c:this._getScopedSegmentsValue(e);if(this.array.autoEnds)return this._resolveAutomaticEndRows(e,this._getAutomaticEndInputRows(e));let r=this._sortSegmentsForEditor(t).filter(d=>{let u=this._getSegmentPreviewBoundaryValue(d==null?void 0:d.from),h=this._getSegmentPreviewBoundaryValue(d==null?void 0:d.to);return u!==null&&h!==null&&typeof(d==null?void 0:d.color)=="string"&&d.color.trim()});if(!r.length||!r.every(d=>[d.from,d.to].every(u=>typeof u=="number"&&Number.isFinite(u)||b(u)&&!Number.isFinite(u.percent)&&Number.isFinite(this._getFiniteNumber(u.fixed)))))return r;let n=r.flatMap(d=>[this._getSegmentPreviewBoundaryValue(d.from),this._getSegmentPreviewBoundaryValue(d.to)]),a=n.reduce((d,u)=>Math.min(d,u),1/0),s=n.reduce((d,u)=>Math.max(d,u),-1/0)-a;return!Number.isFinite(s)||s<=0?r:r.map(d=>({...d,from:(this._getSegmentPreviewBoundaryValue(d.from)-a)/s*100,to:(this._getSegmentPreviewBoundaryValue(d.to)-a)/s*100}))}_buildEditorSegmentPreviewStyle(e={type:"card"}){let t=this._getSegmentPreviewRows(e);if(!t.length)return"";let r=this.fillStyle(e),i=[];return t.forEach(n=>{let a=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(n.from))),l=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(n.to)));i.push(`${n.color} ${a}%`,`${n.color} ${l}%`)}),r==="bands"?`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`:`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`}_getSegmentPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-segment-preview`,trackId:`entity-${e.index}-segment-preview-track`}:{previewId:"card-segment-preview",trackId:"card-segment-preview-track"}}_renderSegmentPreview(e={type:"card"}){var l;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getSegmentPreviewRows(e),n=[];i.forEach(s=>{let c=this._getSegmentPreviewBoundaryValue(s.from),d=this._getSegmentPreviewBoundaryValue(s.to);c!==null&&n.push(c),d!==null&&n.push(d)});let a=[...new Set(n)].sort((s,c)=>s-c);return`
      <div id="${t}" class="gradient-preview segment-preview">
        <div id="${r}" class="gradient-preview-track segment-preview-track" style="${S((l=this._buildEditorSegmentPreviewStyle(e))!=null?l:"")}">
          ${a.map((s,c)=>`
            <span
              id="${t}-stop-${c}"
              class="gradient-preview-stop"
              style="left:${S(String(s))}%"
              title="${S(`${s}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_refreshSegmentPreview(e={type:"card"}){var s;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getShadowElementById(r);if(!i)return;i.setAttribute("style",(s=this._buildEditorSegmentPreviewStyle(e))!=null?s:"");let n=this._getSegmentPreviewRows(e),a=[];n.forEach(c=>{let d=this._getSegmentPreviewBoundaryValue(c.from),u=this._getSegmentPreviewBoundaryValue(c.to);d!==null&&a.push(d),u!==null&&a.push(u)});let l=[...new Set(a)].sort((c,d)=>c-d);i.innerHTML=l.map((c,d)=>`
      <span
        id="${t}-stop-${d}"
        class="gradient-preview-stop"
        style="left:${S(String(c))}%"
        title="${S(`${c}%`)}"
      ></span>
    `).join("")}_getSegmentDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{hintPrefix:`entity-${e.index}-segment-row-hint-`,draftHintId:`entity-${e.index}-segment-draft-hint`,addSelector:`button[data-action="add-entity-segment"][data-index="${e.index}"]`}:{hintPrefix:"segment-row-hint-",draftHintId:"segment-draft-hint",addSelector:'button[data-action="add-segment"]'}}_refreshSegmentUi(e={type:"card"}){var s,c;if(this._refreshSegmentPreview(e),!this.shadowRoot)return;let{hintPrefix:t,draftHintId:r,addSelector:i}=this._getSegmentDomIds(e),n=this.shadowRoot.querySelector(i);n&&(n.disabled=!this._canAddSegment(e)),((s=this._getSegmentsUiRows(e))!=null?s:this._getScopedSegmentsValue(e)).forEach((d,u)=>{var m;let h=this._getShadowElementById(`${t}${u}`),f=this._getSegmentRowValidationMessage(e,u);h&&(h.textContent=f,(m=h.setAttribute)==null||m.call(h,"style",f?"":"display:none"))});let l=this._getShadowElementById(r);if(l){let d=this._getSegmentDraftValidationMessage(e);l.textContent=d,(c=l.setAttribute)==null||c.call(l,"style",d?"":"display:none")}}_commitSegmentDraft(e={type:"card"}){var a;let t=this._getValidSegmentDraft(e);if(!t)return this._refreshSegmentUi(e),!1;let r=(a=this._getSegmentsUiRows(e))!=null?a:this._getScopedSegmentsValue(e),i=this._sortSegmentsForEditor([...r,t]),n=this._setScopedSegments(e,i,{rerender:!0},{type:"add",item:t});return n!==!1&&this._segmentDrafts.set(this._getSegmentsScopeKey(e),this._createSegmentDraftState(e)),n}_commitSegmentBoundaryEdit(e={type:"card"},t,r,i,n=null){var m,x,k,v,$;this._setSegmentBoundaryText(e,t,r,i);let a=this._parseSegmentBoundaryText(i);if(a.state!=="valid"&&!(this.array.autoEnds&&r==="to"&&a.state==="empty"))return(m=n==null?void 0:n.setCustomValidity)==null||m.call(n,"Enter a valid boundary value."),this._refreshSegmentUi(e),!1;if(this.array.patchOnly){let _=this._getSegmentRowValidationMessage(e,t);if(_)return(x=n==null?void 0:n.setCustomValidity)==null||x.call(n,_),(k=n==null?void 0:n.reportValidity)==null||k.call(n),this._refreshSegmentUi(e),!1}let l=D(i).trim(),s=this._parseSegmentBoundaryInput(i),c=this.array.autoEnds&&r==="to"&&!l?void 0:s===null?l:s,u=((v=this._getSegmentsUiRows(e))!=null?v:this._getScopedSegmentsValue(e)).map((_,g)=>g===t?{..._,[r]:c}:_);this._clearSegmentBoundaryText(e,t,r);let h=this._setScopedSegments(e,u,{rerender:!0},{type:"edit",index:t,field:r,value:c}),f=this._getSegmentRowValidationMessage(e,t);return n!=null&&n.setCustomValidity&&(n.setCustomValidity(f||""),f&&(($=n.reportValidity)==null||$.call(n))),h}_getScopedSegmentsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getSegmentsUiRows(e);if(t!==null)return F(t);let r=this._getStoredScopedSegments(e);return r!==null?this._sortSegmentsForEditor(r):this._sortSegmentsForEditor(this._getFallbackSegments(e))}_hasSegmentsOverride(e){return this._getStoredScopedSegments(e)!==null}_getSegmentsSummary(e){let t=this._getScopedSegmentsValue(e);return!Array.isArray(t)||t.length===0?"Inherited":(e==null?void 0:e.type)!=="entity"&&!this._hasSegmentsOverride(e)&&this._isSegmentFillStyle(this.fillStyle(e))?"Default bands":`${t.length} segments`}_setScopedSegments(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let a=e.index,l=this._getScopedSegmentsValue(e),s=!this._hasSegmentsOverride(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${a}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${a}"${s?" checked":""}>
                          <label for="entity-${a}-segments-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._isSegmentFillStyle(this.fillStyle(e))?"":'<div class="section-note">Only used with segment-based fill styles.</div>'}
                      ${this._renderSegmentPreview(e)}
                      <div class="field-row">
                        <label>Segments</label>
                        <div class="list">
                          ${this._renderListRows(l,(c,d)=>{var u;return`
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${a}" data-segment-index="${d}" value="${S(this._getSegmentBoundaryText(e,d,"from",c==null?void 0:c.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${a}" data-segment-index="${d}" value="${S(this._getSegmentBoundaryText(e,d,"to",c==null?void 0:c.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${a}" data-segment-index="${d}" value="${S((u=c==null?void 0:c.color)!=null?u:"#4a9eff")}">
                              <button type="button" data-action="remove-entity-segment" data-index="${a}" data-segment-index="${d}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                            <div id="entity-${a}-segment-row-hint-${d}" class="section-note"${this._getSegmentRowValidationMessage(e,d)?"":' style="display:none"'}>${S(this._getSegmentRowValidationMessage(e,d))}</div>
                            </div>
                          `})}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${a}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${a}" value="${S(this._getSegmentDraftState(e).from)}" placeholder="0%">
                              <input id="entity-${a}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${a}" value="${S(this._getSegmentDraftState(e).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${a}" value="${S(this._getSegmentDraftState(e).color||"#4a9eff")}">
                              <button type="button" data-action="add-entity-segment" data-index="${a}"${this._canAddSegment(e)?"":" disabled"}>Add</button>
                            </div>
                            <div id="entity-${a}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(e)?"":' style="display:none"'}>${S(this._getSegmentDraftValidationMessage(e))}</div>
                          </div>
                        </div>
                      </div>
	                          `}let r=this.fillStyle(e),i=this._getScopedSegmentsValue(e),n=!this._hasSegmentsOverride(e)&&this._isSegmentFillStyle(r);return`	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${t({group:"segments",title:"Segments",summary:this._getSegmentsSummary({type:"card"}),inactive:!this._isSegmentFillStyle(r),content:`
	              ${this._isSegmentFillStyle(r)?"":'<div class="section-note">Only used with segment-based fill styles.</div>'}
                ${this._renderSegmentPreview({type:"card"})}
	              <div class="field-row">
	                <label>Segments</label>
	                <div class="list">
	                  ${n?'<div class="section-note">Default bands</div>':""}
	                  ${this._renderListRows(i,(a,l)=>{var s,c;return`
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} start"`:""} data-kind="segment-from" data-index="${l}" value="${S(this._getSegmentBoundaryText({type:"card"},l,"from",a==null?void 0:a.from))}" placeholder="0%">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} end (blank = Auto)"`:""} data-kind="segment-to" data-index="${l}" value="${S(this._getSegmentBoundaryText({type:"card"},l,"to",a==null?void 0:a.to))}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
	                      ${this.array.cssText?I({id:`segment-color-${l}`,kind:"segment-color",index:l,value:(s=a==null?void 0:a.color)!=null?s:"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:`Segment ${l+1} color`}):`<input type="color" data-kind="segment-color" data-index="${l}" value="${S((c=a==null?void 0:a.color)!=null?c:"#4a9eff")}">`}
	                      <button type="button" data-action="remove-segment" data-index="${l}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
                      <div id="segment-row-hint-${l}" class="section-note"${this._getSegmentRowValidationMessage({type:"card"},l)?"":' style="display:none"'}>${S(this._getSegmentRowValidationMessage({type:"card"},l))}</div>
                      </div>
	                  `})}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds?' aria-label="New segment start"':""} data-kind="segment-draft-from" value="${S(this._getSegmentDraftState({type:"card"}).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds?' aria-label="New segment end (blank = Auto)"':""} data-kind="segment-draft-to" value="${S(this._getSegmentDraftState({type:"card"}).to)}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
                        ${this.array.cssText?I({id:"segment-draft-color",kind:"segment-draft-color",value:this._getSegmentDraftState({type:"card"}).color||"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:"New segment color"}):`<input type="color" data-kind="segment-draft-color" value="${S(this._getSegmentDraftState({type:"card"}).color||"#4a9eff")}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({type:"card"})?"":" disabled"}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({type:"card"})?"":' style="display:none"'}>${S(this._getSegmentDraftValidationMessage({type:"card"}))}</div>
                    </div>
	                </div>
	              </div>
	            `})}
	        </div>`}};var $e=class extends xe{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._gradientStopsDrafts=new Map,this._gradientStopsUiRows=new Map,this._gradientStopPosTexts=new Map,this._gradientStopValidationMessages=new Map}_setGradientStops(e,t={}){return this._setScopedGradientStops({type:"card"},e,t)}_getDefaultGradientStops(){return[{pos:0,color:"#4CAF50"},{pos:50,color:"#FF9800"},{pos:100,color:"#F44336"}]}_normalizeGradientStopPosValue(e){let t=re(e),r=Number.isFinite(t)?t:K(e);return r===null||!Number.isFinite(r)||r<0||r>100?null:r}_sanitizeGradientStopsForEmit(e){return Array.isArray(e)?e.map(t=>{if(!b(t))return null;let r=this._normalizeGradientStopPosValue(t.pos),i=D(t.color).trim();return r===null||!i?null:{...t,pos:r,color:i}}).filter(Boolean).sort((t,r)=>t.pos-r.pos):[]}_getGradientStopDraftColorDefault(e={type:"card"}){var r;let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return t.length?(r=t[t.length-1].color)!=null?r:"#4CAF50":this._getDefaultGradientStops()[0].color}_getNextSuggestedGradientStopPos(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));if(!t.length)return 0;let r=t[t.length-1];if(r.pos>=100)return"";let i;if(t.length===1)i=r.pos+25;else{let a=t[t.length-2];i=r.pos+(r.pos-a.pos)}let n=Math.min(100,Math.max(0,i));return t.some(a=>a.pos===n)?"":n}_getGradientStopsDraftKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGradientStopPosTextKey(e,t){return`${this._getGradientStopsDraftKey(e)}:pos:${t}`}_getGradientStopPosText(e={type:"card"},t,r=""){let i=this._getGradientStopPosTextKey(e,t);return this._gradientStopPosTexts.has(i)?this._gradientStopPosTexts.get(i):r===""||r===null||r===void 0?"":String(r)}_setGradientStopPosText(e,t,r){this._gradientStopPosTexts.set(this._getGradientStopPosTextKey(e,t),D(r))}_clearGradientStopPosText(e,t){this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(e,t))}_clearGradientStopScopeTextState(e){let t=`${this._getGradientStopsDraftKey(e)}:pos:`;for(let r of this._gradientStopPosTexts.keys())r.startsWith(t)&&this._gradientStopPosTexts.delete(r);for(let r of this._gradientStopValidationMessages.keys())r.startsWith(t)&&this._gradientStopValidationMessages.delete(r)}_getGradientStopsUiRows(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsUiRows.has(t)?F(this._gradientStopsUiRows.get(t)):null}_setGradientStopsUiRows(e,t){this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(e),F(t))}_getStoredScopedGradientStops(e={type:"card"}){let t=this.context.read(e,["bar","gradient_stops"]);if(t!==void 0)return t;let r=this.context.read(e,["gradient_stops"]);return r!==void 0?r:null}_getFallbackGradientStops(e={type:"card"}){if((e==null?void 0:e.type)==="entity"){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({type:"card"}));return t.length?t:this._getDefaultGradientStops()}return this._getDefaultGradientStops()}_createGradientStopDraftState(e={type:"card"}){let t=this._getNextSuggestedGradientStopPos(e);return{pos:t===""?"":String(t),color:this._getGradientStopDraftColorDefault(e)}}_getGradientStopsDraftState(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsDrafts.has(t)||this._gradientStopsDrafts.set(t,this._createGradientStopDraftState(e)),F(this._gradientStopsDrafts.get(t))}_setGradientStopsDraftState(e,t,r={}){var i,n;if(this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(i=t==null?void 0:t.pos)!=null?i:"",color:(n=t==null?void 0:t.color)!=null?n:this._getGradientStopDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshGradientDraftUi(e);return}this.ui.render()}_setGradientStopsDraftField(e,t,r){let i=this._getGradientStopsDraftState(e),n=t==="color"?D(r).trim():D(r);this._setGradientStopsDraftState(e,{...i,[t]:n},{refreshOnly:t==="pos"})}_getValidGradientDraftStop(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=this._normalizeGradientStopPosValue(t.pos),i=D(t.color).trim();return r===null||!i?null:{pos:r,color:i}}_hasGradientStopDuplicate(e={type:"card"},t,r=null){return this.array.patchOnly?this._getScopedGradientStopsValue(e).some((i,n)=>n!==r&&this._normalizeGradientStopPosValue(i==null?void 0:i.pos)===t):this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)).some((i,n)=>n!==r&&i.pos===t)}_canAddGradientStop(e={type:"card"}){let t=this._getValidGradientDraftStop(e);return t?!this._hasGradientStopDuplicate(e,t.pos):!1}_getGradientDraftValidationMessage(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=D(t.pos).trim(),i=D(t.color).trim();return r?this._normalizeGradientStopPosValue(t.pos)===null?"Enter a value from 0 to 100.":i?this._hasGradientStopDuplicate(e,this._normalizeGradientStopPosValue(t.pos))?"Position already exists.":"":"Choose a color to add a stop.":"Enter a position to add a stop."}_isDefaultGradientStops(e){let t=this._sanitizeGradientStopsForEmit(e),r=this._getDefaultGradientStops();return t.length!==r.length?!1:t.every((i,n)=>i.pos===r[n].pos&&G(i.color)===G(r[n].color))}_clearGradientStopsOverride(e){var i;let t=J((i=this._getGradientStopsUiRows(e))!=null?i:[]);this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(e)),this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(e)),this._clearGradientStopScopeTextState(e);let r=this.context.mutate(e,n=>{let a=p(n,["bar","gradient_stops"]);return a=p(a,["gradient_stops"]),a=C(a,["bar"]),a},{rerender:!0});return r===!1&&t!==J([])&&this.ui.render(),r}_getGradientStopsValue(){return this._getScopedGradientStopsValue({type:"card"})}_commitGradientStopDraft(e={type:"card"}){let t=this._getValidGradientDraftStop(e);if(!t||this._hasGradientStopDuplicate(e,t.pos))return this._refreshGradientDraftUi(e),!1;let i=[...this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),t].sort((a,l)=>a.pos-l.pos),n=this._setScopedGradientStops(e,i,{rerender:!0},{type:"add",item:t});return n!==!1&&this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(()=>{let a=this._getNextSuggestedGradientStopPos(e);return a===""?"":String(a)})(),color:t.color}),n}_getGradientPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-gradient-preview`,trackId:`entity-${e.index}-gradient-preview-track`,hintId:`entity-${e.index}-gradient-draft-hint`,addSelector:`button[data-action="add-entity-gradient-stop"][data-index="${e.index}"]`,draftInputId:`entity-${e.index}-gradient-draft-pos`}:{previewId:"card-gradient-preview",trackId:"card-gradient-preview-track",hintId:"gradient-draft-hint",addSelector:'button[data-action="add-gradient-stop"]',draftInputId:"gradient-draft-pos"}}_refreshGradientDraftUi(e={type:"card"}){var v,$,_;if(!this.shadowRoot)return;let t=($=(v=this.shadowRoot.getElementById)==null?void 0:v.bind(this.shadowRoot))!=null?$:(g=>{var y,w,E;return(E=(w=(y=this.shadowRoot).querySelector)==null?void 0:w.call(y,`#${g}`))!=null?E:null}),{previewId:r,trackId:i,hintId:n,addSelector:a,draftInputId:l}=this._getGradientPreviewDomIds(e),s=this.shadowRoot.querySelector(a);s&&(s.disabled=!this._canAddGradientStop(e));let c=t(l);if(c&&typeof c.closest!="function"){this.ui.render();return}let d=c==null?void 0:c.closest(".gradient-stop-draft"),u=this._getGradientDraftValidationMessage(e),h=t(n);if(u){if(h)h.textContent=u;else if(d){let g=document.createElement("div");g.id=n,g.className="section-note",g.textContent=u,d.appendChild(g)}}else h&&h.remove();let f=t(r),m=t(i);if(!f||!m)return;m.setAttribute("style",(_=this._getGradientPreviewStyle(e))!=null?_:"");let x=this._buildGradientPreviewEffectiveStops(e),k=x.length?x:this._getDefaultGradientStops();m.innerHTML=k.map((g,y)=>`
      <span
        id="${r}-stop-${y}"
        class="gradient-preview-stop"
        style="left:${S(String(g.pos))}%"
        title="${S(`${g.pos}%`)}"
      ></span>
    `).join("")}_commitGradientStopPosEdit(e={type:"card"},t,r,i=null){let n=this._normalizeGradientStopPosValue(r);if(n===null||this._hasGradientStopDuplicate(e,n,t))return i!=null&&i.setCustomValidity&&(i.setCustomValidity(n===null?"Enter a value from 0 to 100.":"Position already exists."),i.reportValidity&&i.reportValidity()),!1;i!=null&&i.setCustomValidity&&i.setCustomValidity("");let l=this._getScopedGradientStopsValue(e).map((s,c)=>c===t?{...s,pos:n}:s);return this._clearGradientStopPosText(e,t),this._setScopedGradientStops(e,l,{rerender:!0},{type:"edit",index:t,field:"pos",value:n})}_getScopedGradientStopsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getGradientStopsUiRows(e);if(Array.isArray(t))return t;let r=this._getStoredScopedGradientStops(e);return r!==null?this._sanitizeGradientStopsForEmit(r):F(this._getFallbackGradientStops(e))}_hasGradientStopsOverride(e){if(this._getStoredScopedGradientStops(e)!==null)return!0;let t=this._getGradientStopsUiRows(e);return Array.isArray(t)?J(this._sanitizeGradientStopsForEmit(t))!==J(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(e))):!1}_getGradientStopsSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasGradientStopsOverride(e))return"Inherited";let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return this.fillStyle(e)!=="gradient"?"Inactive fill style":t.length?this._isDefaultGradientStops(t)?"Default gradient":`${t.length} stops`:(e==null?void 0:e.type)==="entity"?"Inherited":"Default gradient"}_buildGradientPreviewEffectiveStops(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),r=this._getValidGradientDraftStop(e),i=[...t];return r&&!this._hasGradientStopDuplicate(e,r.pos)&&i.push(r),i.sort((n,a)=>n.pos-a.pos)}_buildEditorGradientPreviewStyle(e){if(!Array.isArray(e)||!e.length)return"";let t=e.map(r=>{var a;let i=D(r.color).trim(),n=this._normalizeGradientStopPosValue((a=r.p)!=null?a:r.pos);return!i||n===null?null:`${i} ${n}%`}).filter(Boolean);return t.length?`background:linear-gradient(to right,${t.join(",")});background-repeat:no-repeat;`:""}_getGradientPreviewStyle(e={type:"card"}){let t=this._buildGradientPreviewEffectiveStops(e),r=t.length>=2?t.map(i=>({p:i.pos,color:i.color})):this._getDefaultGradientStops().map(i=>({p:i.pos,color:i.color}));return this._buildEditorGradientPreviewStyle(r)}_renderGradientPreview(e={type:"card"},t={}){var l,s,c;let r=(l=t.previewId)!=null?l:"gradient-preview",i=(s=t.trackId)!=null?s:`${r}-track`,n=this._buildGradientPreviewEffectiveStops(e),a=n.length?n:this._getDefaultGradientStops();return`
      <div id="${r}" class="gradient-preview">
        <div id="${i}" class="gradient-preview-track" style="${S((c=this._getGradientPreviewStyle(e))!=null?c:"")}">
          ${a.map((d,u)=>`
            <span
              id="${r}-stop-${u}"
              class="gradient-preview-stop"
              style="left:${S(String(d.pos))}%"
              title="${S(`${d.pos}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_setScopedGradientStops(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let s=e.index,c=this._getScopedGradientStopsValue(e),d=this._getGradientStopsDraftState(e),u=this._getGradientDraftValidationMessage(e),h=!this._hasGradientStopsOverride(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${s}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${s}"${h?" checked":""}>
                          <label for="entity-${s}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this.fillStyle(e)!=="gradient"?'<div class="section-note">Only used with Gradient fill style</div>':""}
                      ${this._renderGradientPreview(e,{previewId:`entity-${s}-gradient-preview`,trackId:`entity-${s}-gradient-preview-track`})}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(c,(f,m)=>{var x,k;return`
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${s}" data-stop-index="${m}" value="${S(this._getGradientStopPosText(e,m,(x=f==null?void 0:f.pos)!=null?x:""))}" placeholder="0">
                              ${I({id:`entity-${s}-gradient-color-${m}`,kind:"entity-gradient-color",index:s,value:(k=f==null?void 0:f.color)!=null?k:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value",extraDataset:{"stop-index":m}})}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${s}" data-stop-index="${m}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                          `})}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${s}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${s}" value="${S(d.pos)}" placeholder="0">
                              ${I({id:`entity-${s}-gradient-draft-color`,kind:"entity-gradient-draft-color",index:s,value:d.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${s}"${this._canAddGradientStop(e)?"":" disabled"}>Add</button>
                            </div>
                            ${u?`<div id="entity-${s}-gradient-draft-hint" class="section-note">${S(u)}</div>`:""}
                          </div>
                        </div>
                      </div>
	                          `}let r=this._getScopedGradientStopsValue(e),i=this._getGradientStopsDraftState(e),n=this._getGradientDraftValidationMessage(e),a=this._getGradientStopsSummary(e),l=this.fillStyle(e)!=="gradient";return`	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${t({group:"gradient-stops",title:"Gradient Stops",summary:a,inactive:l,content:`
	              ${l?'<div class="section-note">Only used with Gradient fill style</div>':""}
	              ${this._renderGradientPreview({type:"card"},{previewId:"card-gradient-preview",trackId:"card-gradient-preview-track"})}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(r,(s,c)=>{var d,u;return`
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${c}" value="${S(this._getGradientStopPosText({type:"card"},c,(d=s==null?void 0:s.pos)!=null?d:""))}" placeholder="0">
	                      ${I({id:`gradient-color-${c}`,kind:"gradient-color",index:c,value:(u=s==null?void 0:s.color)!=null?u:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${c}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
	                  `})}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${S(i.pos)}" placeholder="0">
	                      ${I({id:"gradient-draft-color",kind:"gradient-draft-color",index:"card",value:i.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({type:"card"})?"":" disabled"}>Add</button>
	                    </div>
	                    ${n?`<div id="gradient-draft-hint" class="section-note">${S(n)}</div>`:""}
	                  </div>
	                </div>
	              </div>
	            `})}
	        </div>`}};var ke=class{constructor(e,t={}){this.options=t,this.context=e}_setNeedle(e){return this._setScopedNeedleMode({type:"card"},e?"enabled":"disabled")}_getScopedNeedleConfig(e){var a;let t=this.context.read(e,["bar","needle"]),r="#ffffff",i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",n="";return typeof t=="boolean"?i=t?"enabled":"disabled":b(t)&&(t.show===!0?i="enabled":(t.show===!1||(e==null?void 0:e.type)!=="entity")&&(i="disabled"),n=(a=t.color)!=null?a:""),n===r&&(n=""),{mode:i,color:n}}_hasNeedleOverride(e){return this.context.read(e,["bar","needle"])!==void 0}_getEffectiveScopedNeedleConfig(e){let t=this._getScopedNeedleConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasNeedleOverride(e))return this._getScopedNeedleConfig({type:"card"});let r=this._getScopedNeedleConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_setScopedNeedleMode(e,t){return this.context.mutate(e,r=>{let i=F(r),n=R(i,["bar","needle"]),a=b(n)?n.color:void 0;if(i=p(i,["bar","needle"]),(e==null?void 0:e.type)==="entity"&&t==="inherit")return i=C(i,["bar"]),i;if(t==="disabled")return(e==null?void 0:e.type)==="entity"&&(i=P(i,["bar","needle"],{show:!1})),i=C(i,["bar"]),i;let l={show:!0};return a&&a!=="#ffffff"&&(l.color=a),i=P(i,["bar","needle"],l),i=C(i,["bar"]),i},{needleEdit:{field:"mode",value:t}})}_setScopedNeedleColor(e,t){let r=j(t,this.options.cssText);return this.context.mutate(e,i=>{let n=F(i),a=this._getScopedNeedleConfig(e),l=r&&G(r)!==G("#ffffff");if(n=p(n,["bar","needle","color"]),(e==null?void 0:e.type)!=="entity"&&a.mode==="disabled")return n=C(n,["bar","needle"]),n=C(n,["bar"]),n;let s=a.mode==="enabled"?!0:a.mode==="disabled"?!1:void 0,c={};return s!==void 0&&(c.show=s),l&&(c.color=r),Object.keys(c).length?n=P(n,["bar","needle"],c):n=p(n,["bar","needle"]),n=C(n,["bar","needle"]),n=C(n,["bar"]),n},{needleEdit:{field:"color",value:r}})}_getNeedleValue(){return this._getScopedNeedleConfig({type:"card"}).mode==="enabled"}_removeScopedNeedle(e){return this.context.mutate(e,t=>{let r=p(t,["bar","needle"]);return r=C(r,["bar"]),r})}_getNeedleSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasNeedleOverride(e))return"Inherited";let t=this._getScopedNeedleConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");return t==="entity-needle-inherit"?(i&&this._removeScopedNeedle(n),!0):["bar-needle-mode","needle-mode"].includes(a)?(this._setScopedNeedleMode(n,i),!0):["bar-needle-color","needle-color"].includes(a)?(this._setScopedNeedleColor(n,i),!0):!1}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let i=e.index,n=!this._hasNeedleOverride(e),a=this._getEffectiveScopedNeedleConfig(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${i}"${n?" checked":""}>
                          <label for="entity-${i}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${i}-needle-mode">Needle mode</label>
	                        <select id="entity-${i}-needle-mode" data-kind="entity-needle-mode" data-index="${i}" value="${S(a.mode)}">
                          <option value="enabled"${a.mode==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${a.mode==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${i}-needle-color">Needle color</label>
	                        ${I({cssText:this.options.cssText,label:"Needle color",id:`entity-${i}-needle-color`,kind:"entity-needle-color",index:i,value:a.color,fallbackHex:"#ffffff",placeholder:"#ffffff"})}
	                      </div>
	                          `}let r=this._getScopedNeedleConfig(e);return`          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${S(r.mode)}">
                <option value="disabled"${r.mode==="disabled"?" selected":""}>disabled</option>
                <option value="enabled"${r.mode==="enabled"?" selected":""}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${I({cssText:this.options.cssText,label:"Needle color",id:"bar-needle-color",field:"bar-needle-color",value:r.color,fallbackHex:"#ffffff",placeholder:"#ffffff"})}
            </div>
          </div>`}};var Ee=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._baselineColorDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getBaselineColorDraftKey(e={type:"card"},t="above"){return`${(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}:${t}`}_setBaselineColorDraft(e,t,r){let i=j(r,this.options.cssText),n=this._getBaselineColorDraftKey(e,t);i?this._baselineColorDrafts.set(n,i):this._baselineColorDrafts.delete(n)}_getBaselineColorDraft(e,t){var r;return(r=this._baselineColorDrafts.get(this._getBaselineColorDraftKey(e,t)))!=null?r:""}_isBaselineDirectionalColorEnabled(e,t){return!!D(this._getBaselineDirectionalColorValue(e,t)).trim()}_setBaselineDirectionalColorEnabled(e,t,r){let i=j(this._getBaselineDirectionalColorValue(e,t),this.options.cssText);if(!r)return i&&this._setBaselineColorDraft(e,t,i),this._removeColor(e,["baseline",t,"color"],{prunePaths:[["baseline",t],["baseline"]]});let n=this._getBaselineColorDraft(e,t)||j(this._getEffectiveBaselineDirectionalColorValue(e,t),this.options.cssText)||i||"#000000";return this._setColor(e,["baseline",t,"color"],n,{prunePaths:[["baseline",t],["baseline"]]})}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:yt(this.context.source({type:"card"},"baseline"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="baseline-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"baseline","mode",t),!0;if(e!=="baseline-percent")return!1;let i=be(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"baseline","percent",i),!0}_getBaselineResolvableValue(e){return this.context.source(e,"baseline")}_getEffectiveBaselineResolvableValue(e){return this.context.source(e,"baseline",!0)}_getBaselineMode(e){let t=this.context.read(e,["baseline","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasBaselineOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getEffectiveBaselineMode(e){let t=this._getBaselineMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getBaselineMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getBaselineResolvableValue({type:"card"});return pe(i)||this._getBaselineDirectionalColorValue({type:"card"},"above")||this._getBaselineDirectionalColorValue({type:"card"},"below")?"enabled":"disabled"}_setBaselineMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearBaselineOverride(e):this.context.mutate(e,r=>{let i=F(r);return t==="auto"?i=p(i,["baseline","enabled"]):i=P(i,["baseline","enabled"],t==="enabled"),i=C(i,["baseline"]),i},{baselineEdit:{path:["enabled"],value:t==="auto"?void 0:t==="enabled"}})}_setBaselineDirectionalColor(e,t,r){let i=j(r,this.options.cssText);this._setBaselineColorDraft(e,t,i);let n=["baseline",t,"color"];return i?this._isBaselineDirectionalColorEnabled(e,t)?this.context.mutate(e,a=>P(a,n,i),{baselineEdit:{path:[t,"color"],value:i}}):this._setBaselineDirectionalColorEnabled(e,t,!0):this._removeColor(e,n,{prunePaths:[["baseline",t],["baseline"]]})}_getBaselineDirectionalColorValue(e,t){var r;return(r=this.context.read(e,["baseline",t,"color"]))!=null?r:""}_getEffectiveBaselineDirectionalColorValue(e,t){var i;let r=this.context.read(e,["baseline",t,"color"]);return r!=null&&r!==""?r:(e==null?void 0:e.type)==="entity"&&(i=this.context.read({type:"card"},["baseline",t,"color"]))!=null?i:""}_clearBaselineOverride(e){return this.context.mutate(e,t=>{let r=F(t),i=R(r,["baseline"]);return b(i)?(r=p(r,["baseline","enabled"]),r=p(r,["baseline","at"]),r=p(r,["baseline","above","color"]),r=p(r,["baseline","below","color"])):r=p(r,["baseline"]),r=C(r,["baseline","above"]),r=C(r,["baseline","below"]),r=C(r,["baseline"]),r},{rerender:!0})}_removeBaseline(e){return this.context.mutate(e,t=>p(t,["baseline"]),{rerender:!0})}_hasBaselineOverride(e){let t=this.context.read(e,["baseline"]);return b(t)&&Object.keys(t).length?!0:!b(t)&&t!==void 0&&t!==null&&t!==""}_getBaselineOverrideSummary(e){if(this._getBaselineMode(e)==="disabled")return"Disabled";let r=[],i=this._getBaselineResolvableValue(e);return i.fixed!==""&&i.fixed!==void 0&&r.push(`Baseline ${i.fixed}`),i.entity&&r.push("Entity"),this._getBaselineDirectionalColorValue(e,"above")&&r.push("Above"),this._getBaselineDirectionalColorValue(e,"below")&&r.push("Below"),r.length?r.join(" \u2022 "):"Inherited"}_getCardBaselineSummary(){let e=this._getBaselineMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getBaselineResolvableValue({type:"card"}),r=t.entity||(t.fixed!==""&&t.fixed!==void 0?t.fixed:""),i=e==="enabled"?"Enabled":"Auto";return r!==""?`${i} \xB7 ${r}`:i}_setBaselineResolvablePart(e,t,r){return this.context.setSource(e,"baseline",t,r)}_setColor(e,t,r,i={}){return this.context.mutate(e,n=>{var l;let a=r===void 0?p(n,t):P(n,t,r);for(let s of(l=i.prunePaths)!=null?l:[])a=C(a,s);return a},{...i,baselineEdit:{path:t.slice(1),value:r}})}_removeColor(e,t,r){return this._setColor(e,t,void 0,r)}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(a,i,n))return!0;if(t==="entity-baseline-inherit")return i&&this._clearBaselineOverride(n),!0;if(a==="baseline-mode")return this._setBaselineMode(n,i),!0;if(a==="baseline-value")return this._setBaselineResolvablePart(n,"fixed",i),!0;if(a==="baseline-entity-source")return this._setBaselineResolvablePart(n,"entity",i),!0;for(let l of["above","below"]){if(a===`baseline-${l}-color`)return this._setBaselineDirectionalColor(n,l,i),!0;if(a===`baseline-${l}-color-enabled`)return this._setBaselineDirectionalColorEnabled(n,l,i),!0}return!1}handleClick(e){var t,r;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="baseline-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"baseline","percent",null),!0):((r=e==null?void 0:e.dataset)==null?void 0:r.action)!=="remove-baseline"?!1:(this._removeBaseline(e.dataset.scopeType==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}),!0)}render(e={type:"card"},t=({content:r})=>r){var l,s;if((e==null?void 0:e.type)==="entity"){let c=e.index,d=!this._hasBaselineOverride(e),u=this._getEffectiveBaselineResolvableValue(e),h=this._getEffectiveBaselineMode(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${c}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${c}"${d?" checked":""}>
	                          <label for="entity-${c}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <button type="button" data-action="remove-baseline" data-scope-type="entity" data-index="${c}" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-baseline-mode">Baseline mode</label>
                        <select id="entity-${c}-baseline-mode" data-kind="entity-baseline-mode" data-index="${c}" value="${S(h)}">
                          <option value="enabled"${h==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${h==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-baseline-value">Baseline fallback</label>
                        <input id="entity-${c}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${c}" value="${S(u.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${W("entity-baseline-entity-source",c,u.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${c}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${c}"${this._isBaselineDirectionalColorEnabled(e,"above")?" checked":""}>
                          <label for="entity-${c}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-baseline-above-color">Above-baseline color</label>
                        ${I({cssText:this.options.cssText,label:"Baseline color",id:`entity-${c}-baseline-above-color`,kind:"entity-baseline-above-color",index:c,value:this._getEffectiveBaselineDirectionalColorValue(e,"above"),fallbackHex:"#000000",placeholder:"inherit card default"})}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${c}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${c}"${this._isBaselineDirectionalColorEnabled(e,"below")?" checked":""}>
                            <label for="entity-${c}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${c}-baseline-below-color">Below-baseline color</label>
	                        ${I({cssText:this.options.cssText,label:"Baseline color",id:`entity-${c}-baseline-below-color`,kind:"entity-baseline-below-color",index:c,value:this._getEffectiveBaselineDirectionalColorValue(e,"below"),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let r=this._getBaselineResolvableValue(e),i=this._getBaselineMode(e),n=this._getBaselineDirectionalColorValue(e,"above"),a=this._getBaselineDirectionalColorValue(e,"below");return`
          ${t({group:"baseline",title:"Baseline",summary:this._getCardBaselineSummary(),content:`
          <div class="field-grid">
            <div class="field-row">
              <button type="button" data-action="remove-baseline" data-scope-type="card" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${S(i)}">
                <option value="auto"${i==="auto"?" selected":""}>auto</option>
                <option value="enabled"${i==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${i==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            ${this.options.percentSources?St("baseline",this._getSourceMode(),(s=(l=this._percentageDraft)!=null?l:r.percent)!=null?s:""):""}<div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${S(r.fixed)}">
            </div>
            <div class="field-row">
              <label>Baseline entity</label>
              ${W("baseline-entity-source","card",r.entity)}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({type:"card"},"above")?" checked":""}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${I({cssText:this.options.cssText,label:"Baseline color",id:"baseline-above-color",field:"baseline-above-color",value:n,fallbackHex:"#000000"})}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-below-color-enabled" type="checkbox" data-field="baseline-below-color-enabled"${this._isBaselineDirectionalColorEnabled({type:"card"},"below")?" checked":""}>
                <label for="baseline-below-color-enabled">Below-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-below-color">Below-baseline color</label>
              ${I({cssText:this.options.cssText,label:"Baseline color",id:"baseline-below-color",field:"baseline-below-color",value:a,fallbackHex:"#000000"})}
            </div>
          </div>`})}
`}};function Qt(o,e){return o==="text"?D(e).replace(/\s+/g," ").trim():o==="entity"?D(e).trim():["show","showValue","showUnit","show_value","show_unit"].includes(o)?e===!0:ie(e)}function Ve(o,e,t,r){var d;let i=o.read(e,[t]),n=b(i==null?void 0:i.label)?i.label:{},a=(e==null?void 0:e.type)==="entity"?(d=o.read({type:"card"},[t,"label"]))!=null?d:{}:{},l=u=>Object.prototype.hasOwnProperty.call(n,u),s=(u,h)=>{var f;return l(u)?n[u]:(f=a[u])!=null?f:h},c=s("precision",s("decimal",""));return{show:r,text:s("text",""),showValue:s("show_value",!0)!==!1,showUnit:s("show_unit",!0)!==!1,precision:c===null?"":c}}function Pe(o,e,t,r,i){let n=r==="showValue"?"show_value":r==="showUnit"?"show_unit":r==="precision"?"precision":r,a=r==="text",l=Qt(r,i);return r==="precision"&&i!==""&&l===null?!1:o.mutate(e,s=>{var m,x,k,v;let c=F(s);t==="target"&&r==="show"&&(c=p(c,["show_target_label"]));let d=b(R(c,[t]))?F(R(c,[t])):{},u=b(d.label)?F(d.label):{},h=(e==null?void 0:e.type)==="entity"?(m=o.read({type:"card"},[t,"label"]))!=null?m:{}:{},f=r==="precision"?(k=(x=h.precision)!=null?x:h.decimal)!=null?k:null:(v=h[n])!=null?v:r==="show"?!1:r==="showValue"||r==="showUnit"?!0:void 0;return l===null||a&&!l?a&&(e==null?void 0:e.type)==="entity"&&typeof h.text=="string"&&h.text.trim()?u[n]="":delete u[n]:(e==null?void 0:e.type)==="entity"&&l===f||(r==="show"||r==="showValue"||r==="showUnit")&&(e==null?void 0:e.type)!=="entity"&&l===(r!=="show")?delete u[n]:u[n]=l,r==="precision"&&delete u.decimal,Object.keys(u).length?d.label=u:delete d.label,Object.keys(d).length?c=P(c,[t],d):c=p(c,[t]),c},{markerEdit:{key:t,path:["label",n],value:l,field:r}})}function ue(o,e,t){let r=o.read(e,[t,"direction"]),i=r!==void 0?r:o.read(e,[`${t}_marker`,"direction"]);return(e==null?void 0:e.type)==="entity"&&i===void 0?ue(o,{type:"card"},t):Y(i)}function Te(o,e,t,r){let i=Y(r),n=ue(o,{type:"card"},t),a=(e==null?void 0:e.type)!=="entity"&&i==="inward"||(e==null?void 0:e.type)==="entity"&&i===n?void 0:i;return o.mutate(e,l=>C(a===void 0?p(l,[t,"direction"]):P(l,[t,"direction"],a),[t]),{prunePaths:[[t]],markerEdit:{key:t,path:["direction"],value:i}})}var Fe=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._targetAboveFillDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getCardTargetMarkerSummary(){let e=this._getTargetMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getTargetResolvableValue({type:"card"}),r=[];e==="enabled"&&r.push("Enabled");let i=t.fixed!==""&&t.fixed!==void 0||!!t.entity;return t.fixed!==""&&t.fixed!==void 0&&r.push(String(t.fixed)),t.entity&&r.push(t.entity),(i||this._hasTargetShape({type:"card"}))&&r.push(this._getEffectiveTargetShapeValue({type:"card"})==="triangle"?"Triangle":"Diamond"),r.length?r.join(" \xB7 "):"Automatic"}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:yt(this.context.source({type:"card"},"target"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="target-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"target","mode",t),!0;if(e!=="target-percent")return!1;let i=be(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"target","percent",i),!0}_getTargetResolvableValue(e){return this.context.source(e,"target")}_getEffectiveTargetResolvableValue(e){return this.context.source(e,"target",!0)}_getTargetMode(e){let t=this.context.read(e,["target","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasTargetOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getTargetShapeValue(e){var t;return(t=this.context.read(e,["target","shape"]))!=null?t:""}_hasTargetShape(e){let t=this.context.read(e,["target"]);return b(t)&&Object.prototype.hasOwnProperty.call(t,"shape")}_getEffectiveTargetShapeValue(e){return(e==null?void 0:e.type)==="entity"&&!this._hasTargetShape(e)?this._getEffectiveTargetShapeValue({type:"card"}):he(this._getTargetShapeValue(e))}_setTargetShape(e,t){let r=he(t);return(e==null?void 0:e.type)!=="entity"&&r==="diamond"?this._remove(e,["target","shape"],{prunePaths:[["target"]]}):this._setText(e,["target","shape"],r,{prunePaths:[["target"]]})}_getEffectiveTargetMode(e){let t=this._getTargetMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getTargetMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getTargetResolvableValue({type:"card"});return pe(i)||this._hasCustomTargetColor({type:"card"})||this._getTargetLabelShowValue({type:"card"})||this._getTargetAboveFillColorValue({type:"card"})?"enabled":"disabled"}_setTargetMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearTargetOverride(e):t==="auto"?this._remove(e,["target","enabled"],{prunePaths:[["target"]]}):this._write(e,["target","enabled"],t==="enabled",{prunePaths:[["target"]]})}_setTargetResolvablePart(e,t,r){return this.context.setSource(e,"target",t,r)}_clearTargetOverride(e){return this.context.mutate(e,t=>{let r=F(t),i=R(r,["target"]);return b(i)?(r=p(r,["target","enabled"]),r=p(r,["target","at"]),r=p(r,["target","color"]),r=p(r,["target","shape"]),r=p(r,["target","direction"]),r=p(r,["target","label","show"]),r=p(r,["target","label","decimal"]),r=p(r,["target","when_exceeded","fill_color"])):r=p(r,["target"]),r=p(r,["target_entity"]),r=p(r,["target_color"]),r=p(r,["show_target_label"]),r=p(r,["above_target_color"]),r=C(r,["target","label"]),r=C(r,["target","when_exceeded"]),r=C(r,["target"]),r},{rerender:!0})}_getTargetColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","color"]))!=null?t:this.context.read(e,["target_color"]))!=null?r:""}_getEffectiveTargetColorValue(e){return this._effectiveDisplay(e,["target","color"],[["target_color"]])}_hasCustomTargetColor(e){let t=this._getTargetColorValue(e);return!!t&&G(t)!==G("#888")}_setTargetColor(e,t){let r=j(t,this.options.cssText);return!r||G(r)===G("#888")?this._remove(e,["target","color"],{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]}):this._setText(e,["target","color"],r,{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]})}_getTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);return t!==void 0?!!t:!!this.context.read(e,["show_target_label"])}_getEffectiveTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);if(t!==void 0)return!!t;let r=this.context.read(e,["show_target_label"]);return r!==void 0?!!r:(e==null?void 0:e.type)==="entity"?this._getTargetLabelShowValue({type:"card"}):!1}_setTargetLabelShow(e,t){return t?this._write(e,["target","label","show"],!0,{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]}):this._remove(e,["target","label","show"],{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]})}_getTargetLabelDecimalValue(e){var t,r;return(r=(t=this.context.read(e,["target","label","precision"]))!=null?t:this.context.read(e,["target","label","decimal"]))!=null?r:""}_getEffectiveTargetLabelDecimalValue(e){let t=this._getTargetLabelDecimalValue(e);return t!==""&&t!==null&&t!==void 0?t:(e==null?void 0:e.type)==="entity"?this._getTargetLabelDecimalValue({type:"card"}):""}_setTargetLabelDecimal(e,t){let r=ie(t);return t===""||t===null||t===void 0?this._remove(e,["target","label","decimal"],{prunePaths:[["target","label"],["target"]]}):r===null?!1:this._write(e,["target","label","decimal"],r,{prunePaths:[["target","label"],["target"]]})}_getTargetAboveFillColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","when_exceeded","fill_color"]))!=null?t:this.context.read(e,["above_target_color"]))!=null?r:""}_getTargetAboveFillDraftKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_setTargetAboveFillDraft(e,t){let r=j(t,this.options.cssText),i=this._getTargetAboveFillDraftKey(e);r?this._targetAboveFillDrafts.set(i,r):this._targetAboveFillDrafts.delete(i)}_getTargetAboveFillDraft(e){var t;return(t=this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(e)))!=null?t:""}_getEffectiveTargetAboveFillColorValue(e){return this._effectiveDisplay(e,["target","when_exceeded","fill_color"],[["above_target_color"]])}_setTargetAboveFillColor(e,t){let r=j(t,this.options.cssText);return this._setTargetAboveFillDraft(e,r),this._isTargetAboveFillEnabled(e)?r?this._setText(e,["target","when_exceeded","fill_color"],r,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):!1}_isTargetAboveFillEnabled(e){return!!D(this._getTargetAboveFillColorValue(e)).trim()}_setTargetAboveFillEnabled(e,t){let r=j(this._getTargetAboveFillColorValue(e),this.options.cssText);if(!t)return r&&this._setTargetAboveFillDraft(e,r),this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]});let i=this._getTargetAboveFillDraft(e)||j(this._getEffectiveTargetAboveFillColorValue(e),this.options.cssText)||r||"#000000";return this._setText(e,["target","when_exceeded","fill_color"],i,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]})}_hasTargetOverride(e){let t=this.context.read(e,["target"]);return b(t)&&Object.keys(t).length||!b(t)&&t!==void 0&&t!==null&&t!==""?!0:["target_entity","target_color","show_target_label","above_target_color"].some(r=>{let i=this.context.read(e,[r]);return i!=null&&i!==""&&i!==!1})||this._getTargetLabelDecimalValue(e)!==""}_getTargetOverrideSummary(e){if(this._getTargetMode(e)==="disabled")return"Disabled";let r=[],i=this._getTargetResolvableValue(e);i.fixed!==""&&i.fixed!==void 0&&r.push(`Target ${i.fixed}`),i.entity&&r.push("Entity"),this._hasTargetShape(e)&&r.push(this._getEffectiveTargetShapeValue(e)==="triangle"?"Triangle":"Diamond"),this._hasCustomTargetColor(e)&&r.push("Custom color"),this._getTargetLabelShowValue(e)&&r.push("Label");let n=this._getTargetLabelDecimalValue(e);return n!==""&&r.push(`Label ${n} ${Number(n)===1?"decimal":"decimals"}`),this._getTargetAboveFillColorValue(e)&&r.push("Above"),r.length?r.join(" \u2022 "):"Inherited"}_write(e,t,r,i={}){var n;return this.context.mutate(e,a=>{var s,c;let l=r===void 0?p(a,t):P(a,t,r);l=te(l,(s=i.deprecatedKeys)!=null?s:[]);for(let d of(c=i.prunePaths)!=null?c:[])l=C(l,d);return l},{...i,targetEdit:{path:t.slice(1),value:r,deprecatedKeys:(n=i.deprecatedKeys)!=null?n:[]}})}_remove(e,t,r){return this._write(e,t,void 0,r)}_setText(e,t,r,i){return this._write(e,t,j(r,this.options.cssText)||void 0,i)}_effectiveDisplay(e,t,r){return bt(this.context,e,t,r)}_getEffectiveMarkerDirection(e,t){return ue(this.context,e,t)}_setMarkerDirection(e,t,r){return Te(this.context,e,t,r)}_getBuiltinMarkerLabelOptions(e,t){return Ve(this.context,e,t,this._getEffectiveTargetLabelShowValue(e))}_renderBuiltinMarkerLabelControls(e,t,r){return ge(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(e,t,r,i){return Pe(this.context,e,t,r,i)}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(a,i,n))return!0;if(a==="target-inherit")return i&&this._clearTargetOverride(n),!0;if(a==="target-mode")return this._setTargetMode(n,i),!0;if(a==="target-value")return this._setTargetResolvablePart(n,"fixed",i),!0;if(a==="target-entity-source")return this._setTargetResolvablePart(n,"entity",i),!0;if(a==="target-shape")return this._setTargetShape(n,i),!0;if(a==="target-direction")return this._setMarkerDirection(n,"target",i),!0;if(a==="target-color")return this._setTargetColor(n,i),!0;let l=a==null?void 0:a.match(/^target-label-(show|text|show-value|show-unit|precision)$/);if(l){let s=l[1];return this._setBuiltinMarkerLabelField(n,"target",s==="show-value"?"showValue":s==="show-unit"?"showUnit":s,i),!0}return a==="target-above-fill-enabled"?(this._setTargetAboveFillEnabled(n,i),!0):a==="target-above-fill-color"?(this._setTargetAboveFillColor(n,i),!0):!1}handleClick(e){var t;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="target-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"target","percent",null),!0):!1}render(e={type:"card"}){var s,c;if((e==null?void 0:e.type)==="entity"){let d=e.index,u=!this._hasTargetOverride(e),h=this._getEffectiveTargetResolvableValue(e),f=this._getEffectiveTargetMode(e),m=this._getEffectiveTargetShapeValue(e),x=this._getEffectiveMarkerDirection(e,"target");return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${d}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${d}"${u?" checked":""}>
                          <label for="entity-${d}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${d}-target-mode">Target mode</label>
	                        <select id="entity-${d}-target-mode" data-kind="entity-target-mode" data-index="${d}" value="${S(f)}">
                          <option value="enabled"${f==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${f==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-target-value">Target fallback</label>
                        <input id="entity-${d}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${d}" value="${S(h.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-target-shape">Target shape</label>
                        <select id="entity-${d}-target-shape" data-kind="entity-target-shape" data-index="${d}" value="${S(m)}">
                          <option value="diamond"${m==="diamond"?" selected":""}>diamond</option>
                          <option value="triangle"${m==="triangle"?" selected":""}>triangle</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-target-direction">Direction</label>
                        <select id="entity-${d}-target-direction" data-kind="entity-target-direction" data-index="${d}" value="${x}">
                          <option value="inward"${x==="inward"?" selected":""}>Inward</option>
                          <option value="outward"${x==="outward"?" selected":""}>Outward</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${W("entity-target-entity-source",d,h.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-target-color">Target color</label>
                        ${I({cssText:this.options.cssText,label:"Target color",id:`entity-${d}-target-color`,kind:"entity-target-color",index:d,value:this._getEffectiveTargetColorValue(e),fallbackHex:"#888",placeholder:"inherit card default"})}
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(e,"target","Target")}
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${d}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${d}"${this._isTargetAboveFillEnabled(e)?" checked":""}>
	                          <label for="entity-${d}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${d}-target-above-fill">Above-target color</label>
	                        ${I({cssText:this.options.cssText,label:"Target color",id:`entity-${d}-target-above-fill`,kind:"entity-target-above-fill-color",index:d,value:this._getEffectiveTargetAboveFillColorValue(e),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let t=this._getTargetResolvableValue(e),r=this._getTargetMode(e),i=this._getEffectiveTargetShapeValue(e),n=this._getEffectiveMarkerDirection(e,"target"),a=this._getTargetColorValue(e),l=this._getTargetAboveFillColorValue(e);return`
            <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${S(r)}">
                <option value="auto"${r==="auto"?" selected":""}>auto</option>
                <option value="enabled"${r==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${r==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            ${this.options.percentSources?St("target",this._getSourceMode(),(c=(s=this._percentageDraft)!=null?s:t.percent)!=null?c:""):""}<div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${S(t.fixed)}">
            </div>
            <div class="field-row">
              <label for="target-shape">Target shape</label>
              <select id="target-shape" data-field="target-shape" value="${S(i)}">
                <option value="diamond"${i==="diamond"?" selected":""}>diamond</option>
                <option value="triangle"${i==="triangle"?" selected":""}>triangle</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-direction">Direction</label>
              <select id="target-direction" data-field="target-direction" value="${n}">
                <option value="inward"${n==="inward"?" selected":""}>Inward</option>
                <option value="outward"${n==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${W("target-entity-source","card",t.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${I({cssText:this.options.cssText,label:"Target color",id:"target-color",field:"target-color",value:a,fallbackHex:"#888",placeholder:"#888"})}
            </div>
            ${this._renderBuiltinMarkerLabelControls({type:"card"},"target","Target")}
            <div class="field-row">
              <div class="toggle">
                <input id="target-above-fill-enabled" type="checkbox" data-field="target-above-fill-enabled"${this._isTargetAboveFillEnabled({type:"card"})?" checked":""}>
                <label for="target-above-fill-enabled">Above-target color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="target-above-fill-color">Above-target color</label>
              ${I({cssText:this.options.cssText,label:"Target color",id:"target-above-fill-color",field:"target-above-fill-color",value:l,fallbackHex:"#000000"})}
            </div>
            </div>`}};var Me=class{constructor(e,t={}){this.options=t,this.context=e}_getScopedPeakConfig(e){var c,d;let t=this.context.read(e,["peak"]),r=this.context.read(e,["peak_marker"]),i=this.context.read(e,["show_peak"]),n=this.context.read(e,["peak_color"]),a="#888",l=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",s="";return b(t)&&(t.enabled===!0?l="enabled":t.enabled===!1&&(l="disabled"),s=(c=t.color)!=null?c:s),b(r)&&(r.show===!0?l="enabled":(r.show===!1||(e==null?void 0:e.type)!=="entity")&&(l="disabled"),s=(d=r.color)!=null?d:s),i===!0?l="enabled":i===!1&&(l="disabled"),s=s||n||"",s&&G(s)===G(a)&&(s=""),{mode:l,color:s}}_getEffectiveScopedPeakConfig(e){let t=this._getScopedPeakConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasPeakOverride(e))return this._getScopedPeakConfig({type:"card"});let r=this._getScopedPeakConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_hasPeakOverride(e){var i,n;let t=(i=this.context.read(e,["peak"]))!=null?i:{};if(b(t)&&(Object.prototype.hasOwnProperty.call(t,"enabled")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"reset")||Object.prototype.hasOwnProperty.call(t,"label")||Object.prototype.hasOwnProperty.call(t,"direction")))return!0;let r=(n=this.context.read(e,["peak_marker"]))!=null?n:{};return b(r)&&(Object.prototype.hasOwnProperty.call(r,"show")||Object.prototype.hasOwnProperty.call(r,"color")||Object.prototype.hasOwnProperty.call(r,"direction"))?!0:this.context.read(e,["show_peak"])!==void 0||this.context.read(e,["peak_color"])!==void 0}_getPeakSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasPeakOverride(e))return"Inherited";let t=this._getScopedPeakConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}_clearPeakOverride(e){return this.context.mutate(e,t=>{let r=p(t,["peak","enabled"]);return r=p(r,["peak","color"]),r=p(r,["peak","reset"]),r=p(r,["peak","label"]),r=p(r,["peak","direction"]),r=p(r,["show_peak"]),r=p(r,["peak_color"]),r=p(r,["peak_marker"]),r=C(r,["peak"]),r},{rerender:!0})}_setScopedPeakEnabled(e,t){let r=!!t,i="#888";return this.context.mutate(e,n=>{var c,d,u;let a=F(n),l=b(R(a,["peak"]))?F(R(a,["peak"])):{},s=(u=(d=(c=l.color)!=null?c:b(R(a,["peak_marker"]))?R(a,["peak_marker","color"]):void 0)!=null?d:R(a,["peak_color"]))!=null?u:i;return(e==null?void 0:e.type)==="entity"||r?l.enabled=r:delete l.enabled,s&&G(s)!==G(i)?l.color=s:delete l.color,Object.keys(l).length?a=P(a,["peak"],l):a=p(a,["peak"]),a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"]),a=C(a,["peak"]),a},{extremumEdit:{key:"peak",path:["enabled"],value:r}})}_setScopedPeakColor(e,t){let r=j(t,this.options.cssText),i="#888";return this.context.mutate(e,n=>{let a=F(n),l=b(R(a,["peak"]))?F(R(a,["peak"])):{},s=this._getScopedPeakConfig(e);return delete l.color,r&&G(r)!==G(i)&&(l.color=r),(e==null?void 0:e.type)==="entity"?(s.mode==="enabled"&&(l.enabled=!0),s.mode==="disabled"&&(l.enabled=!1)):s.mode==="enabled"&&(l.enabled=!0),Object.keys(l).length?a=P(a,["peak"],l):a=p(a,["peak"]),a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"]),a=C(a,["peak"]),a},{extremumEdit:{key:"peak",path:["color"],value:r&&G(r)!==G(i)?r:void 0}})}_getScopedMarkerExtras(e,t){var a,l,s,c;let r=this.context.read(e,[t]),i=b(r)?r:{},n=b(i.label)?i.label:{};return{reset:Object.prototype.hasOwnProperty.call(i,"reset")?D(i.reset).trim().toLowerCase():null,labelShow:typeof n.show=="boolean"?n.show:null,labelText:typeof n.text=="string"?n.text.replace(/\s+/g," ").trim():null,labelShowValue:typeof n.show_value=="boolean"?n.show_value:null,labelShowUnit:typeof n.show_unit=="boolean"?n.show_unit:null,labelPrecision:((a=n.precision)!=null?a:n.decimal)===void 0||((l=n.precision)!=null?l:n.decimal)===null||((s=n.precision)!=null?s:n.decimal)===""?null:K((c=n.precision)!=null?c:n.decimal)}}_hasExtremumOverride(e,t){let r=this.context.read(e,[t]);return b(r)?["enabled","color","reset","label","direction"].some(i=>Object.prototype.hasOwnProperty.call(r,i)):!1}_getEffectiveMarkerExtras(e,t){var n,a,l,s,c,d,u,h,f,m,x,k,v,$,_,g,y,w;let r=this._getScopedMarkerExtras(e,t);if((e==null?void 0:e.type)!=="entity")return{reset:(n=r.reset)!=null?n:"never",labelShow:(a=r.labelShow)!=null?a:!1,labelText:r.labelText,labelShowValue:(l=r.labelShowValue)!=null?l:!0,labelShowUnit:(s=r.labelShowUnit)!=null?s:!0,labelPrecision:r.labelPrecision};let i=this._getScopedMarkerExtras({type:"card"},t);return this._hasExtremumOverride(e,t)?{reset:(m=(f=r.reset)!=null?f:i.reset)!=null?m:"never",labelShow:(k=(x=r.labelShow)!=null?x:i.labelShow)!=null?k:!1,labelText:Object.prototype.hasOwnProperty.call((v=this.context.read(e,[t,"label"]))!=null?v:{},"text")?r.labelText:i.labelText,labelShowValue:(_=($=r.labelShowValue)!=null?$:i.labelShowValue)!=null?_:!0,labelShowUnit:(y=(g=r.labelShowUnit)!=null?g:i.labelShowUnit)!=null?y:!0,labelPrecision:(w=r.labelPrecision)!=null?w:i.labelPrecision}:{reset:(c=i.reset)!=null?c:"never",labelShow:(d=i.labelShow)!=null?d:!1,labelText:i.labelText,labelShowValue:(u=i.labelShowValue)!=null?u:!0,labelShowUnit:(h=i.labelShowUnit)!=null?h:!0,labelPrecision:i.labelPrecision}}_getScopedFloorConfig(e){let t=this.context.read(e,["floor"]),r=b(t)?t:{},i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled";r.enabled===!0&&(i="enabled"),r.enabled===!1&&(i="disabled");let n=r.color&&G(r.color)!==G("#888888")?r.color:"";return{mode:i,color:n}}_getEffectiveScopedFloorConfig(e){let t=this._getScopedFloorConfig(e),r=this._getEffectiveMarkerExtras(e,"floor");if((e==null?void 0:e.type)!=="entity")return{...t,...r};if(!this._hasExtremumOverride(e,"floor"))return{...this._getScopedFloorConfig({type:"card"}),...r};let i=this._getEffectiveScopedFloorConfig({type:"card"});return{mode:t.mode==="inherit"?i.mode:t.mode,color:t.color||i.color,...r}}_getFloorSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasExtremumOverride(e,"floor"))return"Inherited";let t=this._getEffectiveScopedFloorConfig(e);return t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Disabled \u2022 Custom color":"Disabled"}_getMarkerResetSummary(e){var a;let t={type:"card"},i=(e==="peak"?this._getScopedPeakConfig(t):this._getEffectiveScopedFloorConfig(t)).mode==="enabled",n=(a=this._getEffectiveMarkerExtras(t,e).reset)!=null?a:"never";return`${i?"Enabled":"Disabled"} \xB7 ${n==="never"?"no reset":`${n} reset`}`}_setScopedExtremumEnabled(e,t,r){let i=!!r,n="#888888";return this.context.mutate(e,a=>{var d;let l=F(a),s=b(R(l,[t]))?F(R(l,[t])):{},c=(d=s.color)!=null?d:n;return(e==null?void 0:e.type)==="entity"||i?s.enabled=i:delete s.enabled,c&&G(c)!==G(n)?s.color=c:delete s.color,Object.keys(s).length?l=P(l,[t],s):l=p(l,[t]),l},{extremumEdit:{key:t,path:["enabled"],value:i}})}_setScopedExtremumColor(e,t,r){let i=j(r,this.options.cssText),n="#888888";return this.context.mutate(e,a=>{let l=F(a),s=b(R(l,[t]))?F(R(l,[t])):{};delete s.color,i&&G(i)!==G(n)&&(s.color=i);let c=this._getScopedFloorConfig(e).mode;return t==="floor"&&((e==null?void 0:e.type)==="entity"&&c!=="inherit"||(e==null?void 0:e.type)!=="entity"&&c==="enabled")&&(s.enabled=c==="enabled"),Object.keys(s).length?l=P(l,[t],s):l=p(l,[t]),t==="peak"&&(l=p(l,["show_peak"]),l=p(l,["peak_color"]),l=p(l,["peak_marker"])),l},{extremumEdit:{key:t,path:["color"],value:i&&G(i)!==G(n)?i:void 0}})}_setScopedExtremumReset(e,t,r){let i=D(r).trim().toLowerCase();return this.context.mutate(e,n=>{let a=F(n),l=b(R(a,[t]))?F(R(a,[t])):{};return i&&((e==null?void 0:e.type)==="entity"||i!=="never")?l.reset=i:delete l.reset,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),t==="peak"&&(a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"])),a},{extremumEdit:{key:t,path:["reset"],value:i}})}_setScopedExtremumLabelShow(e,t,r){let i=!!r;return this.context.mutate(e,n=>{let a=F(n),l=b(R(a,[t]))?F(R(a,[t])):{},s=b(l.label)?F(l.label):{};return(e==null?void 0:e.type)==="entity"||i?s.show=i:delete s.show,Object.keys(s).length?l.label=s:delete l.label,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),t==="peak"&&(a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"])),a},{extremumEdit:{key:t,path:["label","show"],value:i}})}_setScopedExtremumLabelDecimal(e,t,r){let i=K(r);return this.context.mutate(e,n=>{let a=F(n),l=b(R(a,[t]))?F(R(a,[t])):{},s=b(l.label)?F(l.label):{};return i!==null?s.decimal=i:delete s.decimal,Object.keys(s).length?l.label=s:delete l.label,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),a},{extremumEdit:{key:t,path:["label","decimal"],value:i}})}_clearFloorOverride(e){return this.context.mutate(e,t=>{let r=F(t),i=b(R(r,["floor"]))?F(R(r,["floor"])):{};return["enabled","color","reset","label","direction"].forEach(n=>delete i[n]),Object.keys(i).length?r=P(r,["floor"],i):r=p(r,["floor"]),r=p(r,["floor_marker"]),r},{rerender:!0})}_setPeakShow(e){return this._setScopedPeakEnabled({type:"card"},e)}_getPeakShowValue(){return this._getScopedPeakConfig({type:"card"}).mode==="enabled"}_getMarkerConfig(e,t){return t==="peak"?this._getEffectiveScopedPeakConfig(e):this._getEffectiveScopedFloorConfig(e)}_getBuiltinMarkerLabelOptions(e,t){return Ve(this.context,e,t,this._getEffectiveMarkerExtras(e,t).labelShow)}_renderBuiltinMarkerLabelControls(e,t,r){return ge(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_getEffectiveMarkerDirection(e,t){return ue(this.context,e,t)}render(e={type:"card"},t="peak"){let r=t==="peak"?"Peak":"Floor",i=t==="peak"?"#888":"#888888",n={...this._getMarkerConfig(e,t),...this._getEffectiveMarkerExtras(e,t)};if((e==null?void 0:e.type)==="entity"){let a=e.index,l=!(t==="peak"?this._hasPeakOverride(e):this._hasExtremumOverride(e,t)),s=t==="peak"?"	":"";return`
${s}                      <div class="field-row">
${s}                        <div class="toggle">
${s}                          <input id="entity-${a}-${t}-inherit" type="checkbox" data-kind="entity-${t}-inherit" data-index="${a}"${l?" checked":""}>
                          <label for="entity-${a}-${t}-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${a}-${t}-enabled" type="checkbox" data-kind="entity-${t}-enabled" data-index="${a}"${n.mode==="enabled"?" checked":""}>
                          <label for="entity-${a}-${t}-enabled">${r} enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${a}-${t}-color">${r} color</label>
                        ${I({cssText:this.options.cssText,label:"Marker color",id:`entity-${a}-${t}-color`,kind:`entity-${t}-color`,index:a,value:n.color,fallbackHex:i,placeholder:"inherit card default"})}
                      </div>
                      <div class="field-row">
                        <label for="entity-${a}-${t}-reset">${r} reset</label>
                        <select id="entity-${a}-${t}-reset" data-kind="entity-${t}-reset" data-index="${a}" value="${S(n.reset)}">
                          ${tt(n.reset)}
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${a}-${t}-direction">Direction</label>
                        <select id="entity-${a}-${t}-direction" data-kind="entity-${t}-direction" data-index="${a}" value="${this._getEffectiveMarkerDirection(e,t)}">
                          <option value="inward"${this._getEffectiveMarkerDirection(e,t)==="inward"?" selected":""}>Inward</option>
                          <option value="outward"${this._getEffectiveMarkerDirection(e,t)==="outward"?" selected":""}>Outward</option>
                        </select>
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(e,t,r)}
${s}                          `}return`
            <div class="field-grid">
            <div class="field-row">
              <div class="toggle">
                <input id="${t}-show" type="checkbox" data-field="${t}-show"${n.mode==="enabled"?" checked":""}>
                <label for="${t}-show">${r} enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="${t}-color">${r} color</label>
              ${I({cssText:this.options.cssText,label:"Marker color",id:`${t}-color`,field:`${t}-color`,value:n.color,fallbackHex:i,placeholder:i})}
            </div>
            <div class="field-row">
              <label for="${t}-reset">${r} reset</label>
              <select id="${t}-reset" data-field="${t}-reset" value="${S(n.reset)}">
                ${tt(n.reset)}
              </select>
            </div>
            <div class="field-row">
              <label for="${t}-direction">Direction</label>
              <select id="${t}-direction" data-field="${t}-direction" value="${this._getEffectiveMarkerDirection({type:"card"},t)}">
                <option value="inward"${this._getEffectiveMarkerDirection({type:"card"},t)==="inward"?" selected":""}>Inward</option>
                <option value="outward"${this._getEffectiveMarkerDirection({type:"card"},t)==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
            ${this._renderBuiltinMarkerLabelControls({type:"card"},t,r)}
            </div>`}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,""),l=a==null?void 0:a.match(/^(peak|floor)-(.*)$/);if(!l)return!1;let[,s,c]=l;if(c==="inherit")return i&&(s==="peak"?this._clearPeakOverride(n):this._clearFloorOverride(n)),!0;if(c==="show"||c==="enabled")return s==="peak"?this._setScopedPeakEnabled(n,i):this._setScopedExtremumEnabled(n,s,i),!0;if(c==="color")return s==="peak"?this._setScopedPeakColor(n,i):this._setScopedExtremumColor(n,s,i),!0;if(c==="reset")return this._setScopedExtremumReset(n,s,i),!0;if(c==="direction")return Te(this.context,n,s,i),!0;let d=c.match(/^label-(show|text|show-value|show-unit|precision)$/);if(d){let u=d[1];return Pe(this.context,n,s,u==="show-value"?"showValue":u==="show-unit"?"showUnit":u,i),!0}return!1}};function De(o){var r,i,n;let e=o==null?void 0:o.at;if(typeof e=="string"&&/^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s*$/.test(e))return{mode:"percent",percent:e.replace(/%/g,"").trim()};if(typeof e=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(e.trim()))return{mode:"entity",entity:e.trim(),fixed:""};let t=b(e)?e:{};return Object.prototype.hasOwnProperty.call(t,"entity")?{mode:t.fixed!==void 0&&t.fixed!==null&&t.fixed!==""?"entity-fallback":"entity",entity:(r=t.entity)!=null?r:"",fixed:(i=t.fixed)!=null?i:""}:{mode:"fixed",fixed:(n=t.fixed)!=null?n:""}}var Ce=class{constructor(e,t,r={}){this.options=r,this.context=e,this.ui=t,this._genericMarkerUiIds=new Map,this._expandedGenericMarkerUiIds=new Set,this._nextGenericMarkerUiId=0}reset(){this._genericMarkerUiIds.clear(),this._expandedGenericMarkerUiIds.clear()}_getShadowElementById(e){var t,r,i,n;return(n=(r=(t=this.ui.root())==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?n:(i=this.ui.root())==null?void 0:i.querySelector(`#${e}`)}render(e={type:"card"}){return this._renderGenericMarkersEditor(e)}_hasMarkersOverride(e){return(e==null?void 0:e.type)==="entity"&&this.context.read(e,["markers"])!==void 0}_getGenericMarkers(e,t=!0){let r=this.context.read(e,["markers"]);if((e==null?void 0:e.type)==="entity"&&r===void 0&&t){let i=this.context.read({type:"card"},["markers"]);return Array.isArray(i)?F(i):[]}return Array.isArray(r)?F(r):[]}_getGenericMarkersSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasMarkersOverride(e))return"Inherited";let t=this._getGenericMarkers(e,!1).length;return t===0?"No reference markers":`${t} reference marker${t===1?"":"s"}`}_getGenericMarkerScopeKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGenericMarkerUiIds(e,t){var n;let r=this._getGenericMarkerScopeKey(e),i=(n=this._genericMarkerUiIds.get(r))!=null?n:[];for(;i.length<t;)i.push(`marker-${++this._nextGenericMarkerUiId}`);return i.length=t,this._genericMarkerUiIds.set(r,i),i}_resetGenericMarkerUiScope(e){var i;let t=this._getGenericMarkerScopeKey(e);((i=this._genericMarkerUiIds.get(t))!=null?i:[]).forEach(n=>this._expandedGenericMarkerUiIds.delete(n)),this._genericMarkerUiIds.delete(t)}_getGenericMarkerSummary(e){var a;let t=this._getGenericMarkerSource(e),r=(e==null?void 0:e.lane)==="above"?"Above":"Below",i=(a=e==null?void 0:e.shape)!=null?a:"circle",n;return t.mode==="percent"?n=t.percent===""?"Percentage":`${t.percent}%`:t.mode==="entity"||t.mode==="entity-fallback"?n=t.entity||"Entity":n=t.fixed===""?"Fixed value":String(t.fixed),`${r} \xB7 ${i.charAt(0).toUpperCase()}${i.slice(1)} \xB7 ${n}`}_refreshGenericMarkerSummary(e,t){let r=this._getGenericMarkers(e),i=r[t],n=this._getGenericMarkerUiIds(e,r.length)[t],a=this._getShadowElementById(`generic-${n}-summary`);if(i&&a){let l=this._getGenericMarkerSummary(i);a.textContent!==l&&(a.textContent=l),a.setAttribute("title",l)}}_getGenericMarkerSource(e){return this.context.source({type:"card"},{type:"reference-marker",marker:e})}_renderGenericMarkersEditor(e){let t=e.type,r=t==="entity"?e.index:"card",i=this._getGenericMarkers(e),n=this._getGenericMarkerUiIds(e,i.length),a=this._hasMarkersOverride(e),l=i.map((d,u)=>{var $,_,g,y,w,E,V,M,O,A,z,N,B,L;let h=this._getGenericMarkerSource(d),f=n[u],m=`${t}-${r}-generic-${f}`,x=this._expandedGenericMarkerUiIds.has(f),k=h.mode==="entity"||h.mode==="entity-fallback"?W("generic-marker-entity",r,h.entity,"sensor.reference",{"scope-type":t,"marker-index":u}):"",v=W("generic-marker-label-entity",r,(_=($=d==null?void 0:d.label)==null?void 0:$.entity)!=null?_:"","sensor.information",{"scope-type":t,"marker-index":u});return`
        <div class="generic-marker-item" data-marker-ui-id="${f}" data-expanded="${x?"true":"false"}">
          <div class="generic-marker-header">
            <button type="button" class="generic-marker-toggle" data-action="toggle-generic-marker" data-marker-ui-id="${f}" aria-expanded="${x?"true":"false"}">
              <span class="generic-marker-title">Reference marker ${u+1}</span>
              <span id="generic-${f}-summary" class="generic-marker-summary" title="${S(this._getGenericMarkerSummary(d))}">${S(this._getGenericMarkerSummary(d))}</span>
            </button>
            <div class="generic-marker-actions">
              <button type="button" data-action="move-generic-marker-up" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${u===0?" disabled":""} aria-label="Move marker up">\u2191</button>
              <button type="button" data-action="move-generic-marker-down" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${u===i.length-1?" disabled":""} aria-label="Move marker down">\u2193</button>
              <button type="button" data-action="remove-generic-marker" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" aria-label="Remove marker">Remove</button>
            </div>
          </div>
          <div class="generic-marker-body" style="display:${x?"grid":"none"};">
            <div class="field-row">
              <label for="${m}-source-mode">Source</label>
              <select id="${m}-source-mode" data-kind="generic-marker-source-mode" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
              <option value="fixed"${h.mode==="fixed"?" selected":""}>Fixed</option>
              <option value="entity"${h.mode==="entity"?" selected":""}>Entity</option>
              <option value="entity-fallback"${h.mode==="entity-fallback"?" selected":""}>Entity with fixed fallback</option>
              <option value="percent"${h.mode==="percent"?" selected":""}>Percentage</option>
              </select>
            </div>
            ${h.mode==="fixed"?`
              <div class="field-row">
                <label for="${m}-fixed">Fixed value</label>
                <input id="${m}-fixed" type="number" step="any" data-kind="generic-marker-fixed" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${S(h.fixed)}">
              </div>`:""}
          ${h.mode==="entity"||h.mode==="entity-fallback"?`
            <div class="field-row">
              <label>Reference marker entity</label>
              ${k}
            </div>`:""}
          ${h.mode==="entity-fallback"?`
            <div class="field-row">
              <label for="${m}-fallback">Fixed fallback</label>
              <input id="${m}-fallback" type="number" step="any" data-kind="generic-marker-fallback" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${S(h.fixed)}">
            </div>`:""}
          ${h.mode==="percent"?`
            <div class="field-row">
              <label for="${m}-percent">Scale percentage</label>
              ${It(`${m}-percent`,`data-kind="generic-marker-percent" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"`,h.percent)}
            </div>`:""}
          <div class="inline-row generic-marker-pair">
            <div class="field-row">
              <label for="${m}-lane">Lane</label>
              <select id="${m}-lane" data-kind="generic-marker-lane" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
                <option value="above"${(d==null?void 0:d.lane)==="above"?" selected":""}>Above</option>
                <option value="below"${((g=d==null?void 0:d.lane)!=null?g:"below")==="below"?" selected":""}>Below</option>
              </select>
            </div>
            <div class="field-row">
              <label for="${m}-direction">Direction</label>
              <select id="${m}-direction" data-kind="generic-marker-direction" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${Y(d==null?void 0:d.direction)}">
                <option value="inward"${((y=d==null?void 0:d.direction)!=null?y:"inward")==="inward"?" selected":""}>Inward</option>
                <option value="outward"${(d==null?void 0:d.direction)==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label for="${m}-shape">Shape</label>
            <select id="${m}-shape" data-kind="generic-marker-shape" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
              ${["circle","diamond","triangle","chevron","arrow","pin"].map(U=>{var q;return`<option value="${U}"${((q=d==null?void 0:d.shape)!=null?q:"circle")===U?" selected":""}>${U}</option>`}).join("")}
            </select>
          </div>
          <div class="field-row">
            <label for="${m}-color">Color</label>
            ${I({cssText:this.options.cssText,label:"Reference marker color",id:`${m}-color`,kind:"generic-marker-color",index:r,value:(w=d==null?void 0:d.color)!=null?w:"#888888",fallbackHex:"#888888",placeholder:"#888888",extraDataset:{"scope-type":t,"marker-index":u}})}
          </div>
          <div class="field-row"><div class="toggle">
            <input id="${m}-show-marker" type="checkbox" data-kind="generic-marker-show-marker" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${(d==null?void 0:d.show_marker)===!1?"":" checked"}>
            <label for="${m}-show-marker">Show marker shape</label>
          </div></div>
          <div class="field-row"><div class="toggle">
            <input id="${m}-label-show" type="checkbox" data-kind="generic-marker-label-show" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((E=d==null?void 0:d.label)==null?void 0:E.show)===!0?" checked":""}>
            <label for="${m}-label-show">Show label</label>
          </div></div>
          <div class="field-row"><label for="${m}-label-text">Label text</label>
            <input id="${m}-label-text" type="text" data-kind="generic-marker-label-text" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${S((M=(V=d==null?void 0:d.label)==null?void 0:V.text)!=null?M:"")}" placeholder="optional semantic text">
          </div>
          <div class="field-row">
            <label>Label content entity</label>
            ${v}
          </div>
          <div class="inline-row generic-marker-options">
            <div class="field-row"><div class="toggle">
              <input id="${m}-label-show-value" type="checkbox" data-kind="generic-marker-label-show-value" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((O=d==null?void 0:d.label)==null?void 0:O.show_value)===!1?"":" checked"}>
              <label for="${m}-label-show-value">Show value</label>
            </div></div>
            <div class="field-row"><div class="toggle">
              <input id="${m}-label-show-unit" type="checkbox" data-kind="generic-marker-label-show-unit" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((A=d==null?void 0:d.label)==null?void 0:A.show_unit)===!1?"":" checked"}>
              <label for="${m}-label-show-unit">Show raw unit</label>
            </div></div>
            <div class="field-row generic-marker-precision"><label for="${m}-label-precision">Label precision</label>
              <input id="${m}-label-precision" type="number" min="0" step="1" data-kind="generic-marker-label-precision" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${S((L=(B=(z=d==null?void 0:d.label)==null?void 0:z.precision)!=null?B:(N=d==null?void 0:d.label)==null?void 0:N.decimal)!=null?L:"")}" placeholder="inherit">
            </div>
          </div>
          </div>
        </div>`}).join("");return`
      ${t==="entity"?`
      <div class="field-row">
        <div class="toggle">
          <input id="entity-${r}-markers-inherit" type="checkbox" data-kind="entity-markers-inherit" data-index="${r}"${a?"":" checked"}>
          <label for="entity-${r}-markers-inherit">Inherit card markers</label>
        </div>
      </div>`:""}
      ${t==="entity"&&!a?'<div class="section-note">Enable the override to replace the card marker list. An empty override clears all card markers.</div>':""}
      ${t==="card"||a?`
        <div class="section-note">Up to four markers render in each lane, including Peak, Floor, and Target. Excess generic markers remain editable and show a warning. Unresolved markers still reserve a slot and lane.</div>
        <div class="list generic-marker-list">${l}</div>
        <button type="button" data-action="add-generic-marker" data-scope-type="${t}" data-index="${r}">Add reference marker</button>`:""}
    `}_getGenericMarkerScope(e){var t;return((t=e==null?void 0:e.dataset)==null?void 0:t.scopeType)==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}}_setGenericMarkerList(e,t,r={}){let i=this.context.mutate(e,n=>P(n,["markers"],t),{...r,rerender:!1});return i&&r.rerender&&this.ui.render(e),i}_updateGenericMarker(e,t,r,i={}){var c;let n=this._getGenericMarkers(e);if(!n[t])return!1;let a=b(n[t])?F(n[t]):{},l=(c=r(a))!=null?c:a;n[t]=l;let s=this._setGenericMarkerList(e,n,i);return s&&this._refreshGenericMarkerSummary(e,t),s}_setGenericMarkerSourceMode(e,t,r){return this._updateGenericMarker(e,t,i=>{if(r==="percent")return i.at="50%",i;let n=b(i.at)?F(i.at):{};return r==="fixed"?(delete n.entity,delete n.percent,n.fixed===void 0&&(n.fixed=50)):(delete n.percent,n.entity||(n.entity=""),r==="entity"&&delete n.fixed,r==="entity-fallback"&&n.fixed===void 0&&(n.fixed=50)),i.at=n,i},{rerender:!0,referenceMarkerEdit:{type:"mode",index:t,value:r}})}_toggleGenericMarkerExpanded(e){var r;this._expandedGenericMarkerUiIds.has(e)?this._expandedGenericMarkerUiIds.delete(e):this._expandedGenericMarkerUiIds.add(e);let t=(r=this.ui.root())==null?void 0:r.querySelector(`.generic-marker-item[data-marker-ui-id="${e}"]`);if(t!=null&&t.querySelector){let i=this._expandedGenericMarkerUiIds.has(e);t.setAttribute("data-expanded",String(i)),t.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),t.querySelector(".generic-marker-body").style.display=i?"grid":"none"}else this.ui.render()}_setGenericMarkerSourcePart(e,t,r,i){return this._updateGenericMarker(e,t,n=>{var s;let a=r==="entity"?D(i).trim()||void 0:(s=K(i))!=null?s:void 0;if(r==="percent")return n.at=a===void 0?null:`${a}%`,n;let l=b(n.at)?F(n.at):{};return a===void 0?delete l[r]:l[r]=a,n.at=Object.keys(l).length?l:null,n})}_setGenericMarkerField(e,t,r,i){let n=r.replace(/^generic-marker-/,"");if(n==="source-mode")return this._setGenericMarkerSourceMode(e,t,i);if(["fixed","fallback","entity","percent"].includes(n))return this.context.setSource(e,{type:"reference-marker",index:t},n==="fallback"?"fixed":n,i);let a,l;if(n==="show-marker")a=["show_marker"],l=i===!1?!1:void 0;else if(["lane","shape","direction"].includes(n))a=[n],l=n==="direction"?Y(i):i;else if(n==="color")a=["color"],l=j(i,this.options.cssText);else if(n.startsWith("label-")){let s=n.slice(6).replace("show-value","show_value").replace("show-unit","show_unit");if(!["show","text","entity","show_value","show_unit","precision"].includes(s))return!1;a=["label",s],l=Qt(s,i),(["text","entity"].includes(s)&&!l||l===null)&&(l=void 0)}else return!1;return this._updateGenericMarker(e,t,s=>{if(a[0]==="label"){let c=b(s.label)?F(s.label):{};l===void 0?delete c[a[1]]:c[a[1]]=l,a[1]==="precision"&&delete c.decimal,s.label=c}else l===void 0?delete s[a[0]]:s[a[0]]=l;return s},{referenceMarkerEdit:{type:"field",index:t,path:a,value:l}})}handleField({target:e,kind:t,value:r}){if(t==="entity-markers-inherit"){let i={type:"entity",index:Number(e.dataset.index)};return this._resetGenericMarkerUiScope(i),r?this.context.mutate(i,n=>p(n,["markers"]),{rerender:!0}):this._setGenericMarkerList(i,this._getGenericMarkers(i),{rerender:!0}),!0}return t!=null&&t.startsWith("generic-marker-")?(this._setGenericMarkerField(this._getGenericMarkerScope(e),Number(e.dataset.markerIndex),t,r),!0):!1}handleClick(e){var r;let t=(r=e==null?void 0:e.dataset)==null?void 0:r.action;if(e!=null&&e.disabled)return!1;if(t==="toggle-generic-marker")return this._toggleGenericMarkerExpanded(e.dataset.markerUiId),!0;if(t==="add-generic-marker"){let i=this._getGenericMarkerScope(e),n=this._getGenericMarkers(i),a=this._getGenericMarkerUiIds(i,n.length);n.push({at:{fixed:50}});let l=`marker-${++this._nextGenericMarkerUiId}`;return a.push(l),this._expandedGenericMarkerUiIds.add(l),this._setGenericMarkerList(i,n,{rerender:!0,referenceMarkerEdit:{type:"add"}}),!0}if(t==="remove-generic-marker"||t==="move-generic-marker-up"||t==="move-generic-marker-down"){let i=this._getGenericMarkerScope(e),n=Number(e.dataset.markerIndex),a=this._getGenericMarkers(i),l=this._getGenericMarkerUiIds(i,a.length);if(t==="remove-generic-marker")a.splice(n,1),this._expandedGenericMarkerUiIds.delete(l[n]),l.splice(n,1);else{let s=n+(t==="move-generic-marker-up"?-1:1);if(s<0||s>=a.length)return!0;[a[n],a[s]]=[a[s],a[n]],[l[n],l[s]]=[l[s],l[n]]}return this._setGenericMarkerList(i,a,{rerender:!0,referenceMarkerEdit:{type:t==="add-generic-marker"?"add":t==="remove-generic-marker"?"remove":"move",index:Number(e.dataset.markerIndex),delta:t==="move-generic-marker-up"?-1:1}}),!0}return!1}syncStructure(e={type:"card"}){var m,x,k,v,$;let t=this.ui.root(),r=t==null?void 0:t.querySelector(e.type==="entity"?`.entity-shell[data-entity-shell-index="${e.index}"] .override-group[data-group="markers"]`:'.card-subgroup[data-group="generic-markers"]'),i=(m=r==null?void 0:r.querySelector)==null?void 0:m.call(r,".generic-marker-list");if(!(i!=null&&i.ownerDocument))return!1;let n=this._getGenericMarkers(e),a=this._getGenericMarkerUiIds(e,n.length),l=i.ownerDocument.createElement("template");l.innerHTML=this.render(e);let s=l.content.querySelectorAll(".generic-marker-item"),c=new Map(Array.from(i.children,_=>[_.dataset.markerUiId,_])),d=t.activeElement,u=(x=d==null?void 0:d.closest)==null?void 0:x.call(d,".generic-marker-item"),h=u&&{id:u.dataset.markerUiId,kind:d.dataset.kind,action:d.dataset.action},f=i.firstElementChild;for(let _ of s){let g=_.dataset.markerUiId,y=(k=c.get(g))!=null?k:_;if(c.delete(g),y!==_){y.querySelector(".generic-marker-title").textContent=_.querySelector(".generic-marker-title").textContent;for(let z of y.querySelectorAll(".generic-marker-actions button")){let N=_.querySelector(`[data-action="${z.dataset.action}"]`);z.dataset.markerIndex=N.dataset.markerIndex,z.disabled=N.disabled}let V=y.querySelector(".generic-marker-body"),M=z=>{var N;return(N=z.querySelector("[data-kind]"))==null?void 0:N.dataset.kind},O=new Map(Array.from(V.children,z=>[M(z),z])),A=V.firstElementChild;for(let z of Array.from(_.querySelector(".generic-marker-body").children)){let N=M(z),B=(v=O.get(N))!=null?v:z,L=B.querySelector("[data-kind]"),U=z.querySelector("[data-kind]"),q=(L==null?void 0:L.tagName)===(U==null?void 0:U.tagName)?B:z;O.delete(N),q!==A&&V.insertBefore(q,A),q!==B&&B.remove(),A=q.nextElementSibling}for(let z of O.values())z.remove()}let w=a.indexOf(g);for(let V of y.querySelectorAll("[data-marker-index]"))V.dataset.markerIndex=String(w);let E=this._expandedGenericMarkerUiIds.has(g);y.setAttribute("data-expanded",String(E)),y.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(E)),y.querySelector(".generic-marker-body").style.display=E?"grid":"none",y!==f&&i.insertBefore(y,f),f=y.nextElementSibling}for(let _ of c.values())_.remove();if(h&&d!==t.activeElement){let _=i.querySelector(`[data-marker-ui-id="${h.id}"]`),g=h.kind?_==null?void 0:_.querySelector(`[data-kind="${h.kind}"]`):h.action?_==null?void 0:_.querySelector(`[data-action="${h.action}"]`):null;($=g==null?void 0:g.focus)==null||$.call(g,{preventScroll:!0})}return!0}syncControls(e,t=!1,r={type:"card"}){let i=this.ui.root(),n=`${r.type}-${r.type==="entity"?r.index:"card"}-generic-`;if(!i)return;let a=this._getGenericMarkers(r),l=this._getGenericMarkerUiIds(r,a.length);a.forEach((s,c)=>{var f,m,x,k,v,$,_,g,y,w,E,V;let d=this._getGenericMarkerSource(s),u=(f=s==null?void 0:s.label)!=null?f:{},h={"source-mode":d.mode,fixed:(m=d.fixed)!=null?m:"",fallback:(x=d.fixed)!=null?x:"",percent:(k=d.percent)!=null?k:"",lane:(v=s==null?void 0:s.lane)!=null?v:"below",shape:($=s==null?void 0:s.shape)!=null?$:"circle",direction:Y(s==null?void 0:s.direction),color:Q(s==null?void 0:s.color,"#888888"),"color-text-fallback":(_=s==null?void 0:s.color)!=null?_:"#888888","label-text":(g=u.text)!=null?g:"","label-precision":(w=(y=u.precision)!=null?y:u.decimal)!=null?w:""};for(let[M,O]of Object.entries(h)){let A=i.querySelector(`#${n}${l[c]}-${M}`);A&&(A!==i.activeElement||t)&&(A.value=String(O))}for(let[M,O]of[["show-marker",(s==null?void 0:s.show_marker)!==!1],["label-show",u.show===!0],["label-show-value",u.show_value!==!1],["label-show-unit",u.show_unit!==!1]]){let A=i.querySelector(`#${n}${l[c]}-${M}`);A&&(A.checked=O)}for(let[M,O,A]of[["entity",(E=d.entity)!=null?E:"","Reference marker entity"],["label-entity",(V=u.entity)!=null?V:"","Label content entity"]])for(let z of["input","ha-entity-picker"])for(let N of Array.from(i.querySelectorAll(`${z}[data-kind="generic-marker-${M}"]`)).filter(B=>Number(B.dataset.markerIndex)===c&&B.dataset.scopeType===r.type&&String(B.dataset.index)===String(r.type==="entity"?r.index:"card")))N.id=`${n}${l[c]}-${M}`,N.setAttribute("aria-label",A),(N!==i.activeElement||t)&&(N.value=O),z==="ha-entity-picker"&&(N.hass=e,N.label=A,N.allowCustomEntity=!0);this._refreshGenericMarkerSummary(r,c)})}};var Zt=class extends HTMLElement{get _gradientStopValidationMessages(){return this._gradientStopsSection._gradientStopValidationMessages}get _gradientStopPosTexts(){return this._gradientStopsSection._gradientStopPosTexts}get _gradientStopsUiRows(){return this._gradientStopsSection._gradientStopsUiRows}get _gradientStopsDrafts(){return this._gradientStopsSection._gradientStopsDrafts}get _segmentBoundaryTexts(){return this._segmentsSection._segmentBoundaryTexts}get _segmentUiRows(){return this._segmentsSection._segmentUiRows}get _segmentDrafts(){return this._segmentsSection._segmentDrafts}get _baselineColorDrafts(){return this._baselineSection._baselineColorDrafts}get _targetAboveFillDrafts(){return this._targetSection._targetAboveFillDrafts}get _genericMarkerUiIds(){return this._referenceMarkersSection._genericMarkerUiIds}get _expandedGenericMarkerUiIds(){return this._referenceMarkersSection._expandedGenericMarkerUiIds}get _nextGenericMarkerUiId(){return this._referenceMarkersSection._nextGenericMarkerUiId}set _nextGenericMarkerUiId(e){this._referenceMarkersSection._nextGenericMarkerUiId=e}constructor(){super(),this.attachShadow({mode:"open"}),this._segmentsSection=new we(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedSegments(e,t,r)}),this._gradientStopsSection=new $e(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedGradientStops(e,t,r)}),this._needleSection=new ke(this._createSectionContext()),this._baselineSection=new Ee(this._createSectionContext()),this._targetSection=new Fe(this._createSectionContext()),this._extremaSection=new Me(this._createSectionContext()),this._referenceMarkersSection=new Ce(this._createSectionContext(),{...this._paletteUi(),render:(e={type:"card"})=>{let t;this._isRendering=!0;try{t=this._referenceMarkersSection.syncStructure(e)}finally{this._isRendering=!1}if(!t){this._render();return}this._referenceMarkersSection.syncControls(this._hass,!1,e),this._syncEntityPickers(),this._numericDrafts.apply(this.shadowRoot)}}),this._config={},this._numericDrafts=new ye,this._draftConfig={},this._hass=null,this._isRendering=!1,this._renderScheduled=!1,this._lastRenderedConfigJson=null,this._lastEmittedConfigJson=null,this._shadowListenersAttached=!1,this._expandedEntityOverrides=new Set,this._entityIconCustomPending=new Set,this._expandedOverrideGroups=new Set,this._expandedCardGroups=new Set,this._targetSection.reset(),this._baselineSection.reset(),this._pendingFocusSelector=null,this._boundHandleClick=e=>this._handleClick(e),this._boundHandleChange=e=>this._handleChange(e),this._boundHandleInput=e=>this._handleInput(e),this._boundHandleValueChanged=e=>this._handleValueChanged(e),this._boundHandleKeydown=e=>this._handleKeydown(e)}setConfig(e){var l;let t=this._cloneDeep(e!=null?e:{}),r=this._serializeConfig(t),i=this._serializeConfig(this._config),n=this._serializeConfig(this._draftConfig);if(r===i)return;if(r===n){this._config=t;return}if(r===this._lastEmittedConfigJson){this._config=t;return}if(this._getEmittedConfigJson(t)===this._getEmittedConfigJson(this._draftConfig)){this._config=t;return}let a=!((l=this.shadowRoot)!=null&&l.innerHTML)||r!==this._lastRenderedConfigJson;this._lastEmittedConfigJson=null,this._entityIconCustomPending.clear(),this._config=t,this._draftConfig=this._cloneDeep(t),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._targetSection.reset(),this._baselineSection.reset(),this._referenceMarkersSection.reset(),this._numericDrafts.reset(),a&&this._render()}set hass(e){var t;if(this._hass=e,!((t=this.shadowRoot)!=null&&t.innerHTML)){this._render();return}this._syncEntityPickers()}_cloneContainer(e){return Ze(e)}_cloneDeep(e){return F(e)}_serializeConfig(e){return J(e)}_getEmittedConfigJson(e){return this._serializeConfig(e)}_isObject(e){return b(e)}_setPathValue(e,t,r){return P(e,t,r)}_deletePathValue(e,t){return p(e,t)}_getPathValue(e,t){return R(e,t)}_hasPath(e,t){return wr(e,t)}_normalizeTextValue(e){return D(e)}_normalizeOptionalEnabled(e){return $r(e)}_normalizeNumberValue(e){return K(e)}_normalizeDecimalValue(e){return ie(e)}_preferStructuredPath(e,t=null){return this._hasPath(this._draftConfig,e.slice(0,-1))||this._hasPath(this._draftConfig,e)?e:t&&this._hasPath(this._draftConfig,t)?t:e}_getEntitiesValue(){var e,t;return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(r=>{var i,n,a;return typeof r=="string"?{entity:r}:{entity:(i=r==null?void 0:r.entity)!=null?i:"",name:(n=r==null?void 0:r.name)!=null?n:"",icon:(a=r==null?void 0:r.icon)!=null?a:""}}):this._draftConfig.entity?[{entity:this._draftConfig.entity,name:(e=this._draftConfig.name)!=null?e:"",icon:(t=this._draftConfig.icon)!=null?t:""}]:[]}_getRawEntityRows(){return Array.isArray(this._draftConfig.entities)?this._cloneDeep(this._draftConfig.entities):this._draftConfig.entity!==void 0?this._draftConfig.name!==void 0||this._draftConfig.icon!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[this._draftConfig.entity]:[]}_buildEntityConfigEntries(e){let t=!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0,r=Array.isArray(this._draftConfig.entities)?this._draftConfig.entities:this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[],i=e.map((n,a)=>{let l=r[a];if(this._isObject(l)){let u={...l,entity:n.entity},h=this._normalizeTextValue(n.name).trim();h?u.name=h:delete u.name;let f=n==null?void 0:n.icon,m=typeof f=="string"?f.trim():f;return m===!1?u.icon=!1:typeof m=="string"&&m?u.icon=m:l.icon===!1?u.icon=!1:delete u.icon,u}let s={entity:n.entity},c=this._normalizeTextValue(n.name).trim();c&&(s.name=c);let d=typeof(n==null?void 0:n.icon)=="string"?n.icon.trim():n==null?void 0:n.icon;return d===!1?s.icon=!1:typeof d=="string"&&d&&(s.icon=d),s});return t?i:i.map(n=>this._isObject(n)&&Object.keys(n).length===1&&n.entity!==void 0?n.entity:n)}_updateConfig(e){this._draftConfig=this._cloneDeep(e)}_emitConfigChanged(){let e=this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig)),t=this._serializeConfig(e);return t===this._lastEmittedConfigJson?!1:(this._lastEmittedConfigJson=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),!0)}_scheduleRender(){this._renderScheduled||this._isRendering||(this._renderScheduled=!0,setTimeout(()=>{this._renderScheduled=!1,this._render()},0))}_applyUserConfig(e,t={}){let{rerender:r=!1}=t,i=this._serializeConfig(e),n=this._serializeConfig(this._draftConfig);return i===n?!1:(this._updateConfig(e),this._emitConfigChanged(),this._refreshDerivedEditorUi(),r&&this._scheduleRender(),!0)}_getShadowElementById(e){var t,r,i,n,a,l;return this.shadowRoot&&(l=(a=(r=(t=this.shadowRoot).getElementById)==null?void 0:r.call(t,e))!=null?a:(n=(i=this.shadowRoot).querySelector)==null?void 0:n.call(i,`#${e}`))!=null?l:null}_setElementChecked(e,t){let r=this._getShadowElementById(e);r&&(r.checked=!!t)}_setElementText(e,t){let r=this._getShadowElementById(e);r&&(r.textContent=t)}_refreshDerivedEditorUi(){this.shadowRoot&&(this._refreshCardDerivedUi(),this._refreshEntityDerivedUi())}_refreshCardDerivedUi(){this._setElementText("card-group-marker-target-summary",this._getCardTargetMarkerSummary()),this._setElementText("card-group-marker-peak-summary",this._getMarkerResetSummary("peak")),this._setElementText("card-group-marker-floor-summary",this._getMarkerResetSummary("floor")),this._setElementText("card-group-baseline-summary",this._getCardBaselineSummary()),this._setElementText("card-group-generic-markers-summary",this._getGenericMarkersSummary({type:"card"})),this._setElementText("card-group-segments-summary",this._getSegmentsSummary({type:"card"})),this._setElementText("card-group-gradient-stops-summary",this._getGradientStopsSummary({type:"card"})),this._setElementChecked("target-above-fill-enabled",this._isTargetAboveFillEnabled({type:"card"})),this._setElementChecked("baseline-above-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"above")),this._setElementChecked("baseline-below-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"below")),this._refreshSegmentUi({type:"card"})}_refreshEntityDerivedUi(){let e=this._getEntitiesValue().length;for(let t=0;t<e;t+=1){let r={type:"entity",index:t};this._setElementChecked(`entity-${t}-scale-inherit`,!this._hasResolvableOverride(this._getResolvableScopedValue(r,"min"))&&!this._hasResolvableOverride(this._getResolvableScopedValue(r,"max"))),this._setElementChecked(`entity-${t}-target-inherit`,!this._hasTargetOverride(r)),this._setElementChecked(`entity-${t}-baseline-inherit`,!this._hasBaselineOverride(r)),this._setElementChecked(`entity-${t}-needle-inherit`,!this._hasNeedleOverride(r)),this._setElementChecked(`entity-${t}-peak-inherit`,!this._hasPeakOverride(r)),this._setElementChecked(`entity-${t}-floor-inherit`,!this._hasExtremumOverride(r,"floor")),this._setElementChecked(`entity-${t}-markers-inherit`,!this._hasMarkersOverride(r)),this._setElementChecked(`entity-${t}-bar-inherit`,!this._hasEntityBarAppearanceOverride(r)),this._setElementChecked(`entity-${t}-segments-inherit`,!this._hasSegmentsOverride(r)),this._setElementChecked(`entity-${t}-gradient-stops-inherit`,!this._hasGradientStopsOverride(r)),this._setElementChecked(`entity-${t}-layout-inherit`,!this._hasLayoutOverride(r)),this._setElementChecked(`entity-${t}-formatting-inherit`,!this._hasFormattingOverride(r)),this._setElementChecked(`entity-${t}-target-above-fill-enabled`,this._isTargetAboveFillEnabled(r)),this._setElementChecked(`entity-${t}-baseline-above-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"above")),this._setElementChecked(`entity-${t}-baseline-below-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"below")),this._setElementText(`entity-${t}-group-scale-summary`,this._getScaleOverrideSummary(r)),this._setElementText(`entity-${t}-group-target-summary`,this._getTargetOverrideSummary(r)),this._setElementText(`entity-${t}-group-baseline-summary`,this._getBaselineOverrideSummary(r)),this._setElementText(`entity-${t}-group-needle-summary`,this._getNeedleSummary(r)),this._setElementText(`entity-${t}-group-peak-summary`,this._getPeakSummary(r)),this._setElementText(`entity-${t}-group-floor-summary`,this._getFloorSummary(r)),this._setElementText(`entity-${t}-group-markers-summary`,this._getGenericMarkersSummary(r)),this._setElementText(`entity-${t}-group-bar-summary`,this._getBarAppearanceSummary(r)),this._setElementText(`entity-${t}-group-segments-summary`,this._getSegmentsSummary(r)),this._setElementText(`entity-${t}-group-gradient-stops-summary`,this._getGradientStopsSummary(r)),this._setElementText(`entity-${t}-group-layout-summary`,this._getLayoutSummary(r)),this._setElementText(`entity-${t}-group-formatting-summary`,this._getFormattingSummary(r)),this._refreshSegmentUi(r)}}_queuePostRenderFocus(e){this._pendingFocusSelector=e||null}_applyPendingFocus(){if(!this._pendingFocusSelector||!this.shadowRoot)return;let e=this._pendingFocusSelector;this._pendingFocusSelector=null,setTimeout(()=>{var r,i;let t=(i=(r=this.shadowRoot)==null?void 0:r.querySelector)==null?void 0:i.call(r,e);if(!(!t||typeof t.focus!="function"))try{t.focus({preventScroll:!0})}catch(n){t.focus()}},0)}_setValueAtPath(e,t,r={}){let i=t===void 0?this._deletePathValue(this._draftConfig,e):this._setPathValue(this._draftConfig,e,t);return this._applyUserConfig(i,r)}_setTitle(e){this._setValueAtPath(["title"],e)}_setEntityField(e,t,r){let i=this._normalizeTextValue(r);if(!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&e===0)return i.trim()?this._setValueAtPath([t],i.trim()):this._setValueAtPath([t],void 0);let n=this._withEntityScopeConfig(a=>{var c;let l=a[e],s=this._isObject(l)?this._cloneDeep(l):{entity:(c=l==null?void 0:l.entity)!=null?c:""};return i.trim()?s[t]=i.trim():delete s[t],a[e]=s,a});return this._applyUserConfig(n)}_setEntityIcon(e,t){let r=this._withEntityScopeConfig(i=>(i[e]&&(t===void 0?delete i[e].icon:i[e].icon=t),i));return this._applyUserConfig(r,{rerender:!0})}_getEntityIconMode(e,t){return(e==null?void 0:e.icon)===!1?"off":typeof(e==null?void 0:e.icon)=="string"&&e.icon.trim()||this._entityIconCustomPending.has(t)?"custom":"default"}_cleanupEntityIdentityForEmit(e){if(!this._isObject(e))return e;let t=this._cloneDeep(e),r=this._normalizeTextValue(t.name).trim();if(r?t.name=r:delete t.name,t.icon===!1)return t;let i=this._normalizeTextValue(t.icon).trim();return i?t.icon=i:delete t.icon,t}_cleanupNeedleForEmit(e,t={type:"card"}){var l;if(!this._isObject(e)||!this._isObject(e.bar))return e;let r=this._cloneDeep(e),i=(l=r.bar)==null?void 0:l.needle;if(i===void 0)return r;let n=this._normalizeColorComparisonValue("#ffffff"),a=null;if(i===!0)a={show:!0};else if(i===!1)a=(t==null?void 0:t.type)==="entity"?{show:!1}:null;else if(this._isObject(i)){let s=this._normalizeTextValue(i.color).trim();i.show===!0?a={show:!0}:i.show===!1?a=(t==null?void 0:t.type)==="entity"?{show:!1}:null:(t==null?void 0:t.type)==="entity"&&s&&this._normalizeColorComparisonValue(s)!==n&&(a={}),a&&s&&this._normalizeColorComparisonValue(s)!==n&&(a.color=s)}else a=null;return a?r.bar.needle=a:(delete r.bar.needle,Object.keys(r.bar).length||delete r.bar),r}_cleanupResolvableValueForEmit(e){if(this._isObject(e)||e===null||typeof e=="string"&&this._normalizeNumberValue(e)===null)return this._cloneDeep(e);let t=this._normalizeNumberValue(e);return t===null?null:{fixed:t}}_cleanupScaleForEmit(e){if(!this._isObject(e)||!this._isObject(e.scale))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.scale);return["min","max"].forEach(i=>{if(!Object.prototype.hasOwnProperty.call(r,i))return;let n=this._cleanupResolvableValueForEmit(r[i]);n||r[i]===null?(r[i]=n,delete t[i],delete t[`${i}_entity`]):delete r[i]}),Object.keys(r).length?t.scale=r:delete t.scale,t}_cleanupFormattingForEmit(e){if(!this._isObject(e)||!this._isObject(e.formatting))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.formatting),i=this._normalizeTextValue(r.unit).trim(),n=this._normalizeDecimalValue(r.decimal);return i?(r.unit=i,delete t.unit):delete r.unit,n!==null?(r.decimal=n,delete t.decimal):delete r.decimal,Object.keys(r).length?t.formatting=r:delete t.formatting,t}_cleanupLayoutForEmit(e){if(!this._isObject(e)||!this._isObject(e.layout))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.layout),i=this._isObject(r.label)?this._cloneDeep(r.label):null,n=this._isObject(r.hero)?this._cloneDeep(r.hero):null,a=this._normalizeNumberValue(r.height),l=this._normalizeNumberValue(i==null?void 0:i.width),s=this._normalizeHeroValueSizeValue(n==null?void 0:n.value_size),c=this._normalizeTextValue(i==null?void 0:i.position).trim();return a!==null&&a>=24?(r.height=a,delete t.height):delete r.height,i&&(c?(i.position=c,delete t.label_position):delete i.position,l!==null?(i.width=l,delete t.label_width):delete i.width,Object.keys(i).length?r.label=i:delete r.label),n&&(s!==null?n.value_size=s:delete n.value_size,Object.keys(n).length?r.hero=n:delete r.hero),Object.keys(r).length?t.layout=r:delete t.layout,t}_cleanupTargetForEmit(e,t={type:"card"}){var h;if(!this._isObject(e)||!this._isObject(e.target))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.target),n=this._cleanupResolvableValueForEmit(i.at),a=this._normalizeTextValue(i.color).trim(),l=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"target"),s=this._normalizeTextValue((h=i.when_exceeded)==null?void 0:h.fill_color).trim(),d=Object.prototype.hasOwnProperty.call(i,"shape")?he(i.shape):null,u=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,n||i.at===null?(i.at=n,delete r.target_entity):delete i.at,a&&this._normalizeColorComparisonValue(a)!==this._normalizeColorComparisonValue("#888")?(i.color=a,delete r.target_color):delete i.color,Object.keys(l).length?(i.label=l,l.show===!0&&delete r.show_target_label):(delete i.label,delete r.show_target_label),s?(i.when_exceeded={...this._isObject(i.when_exceeded)?i.when_exceeded:{},fill_color:s},delete r.above_target_color):delete i.when_exceeded,(t==null?void 0:t.type)==="card"&&d==="diamond"?delete i.shape:d?i.shape=d:delete i.shape,u==="inward"&&((t==null?void 0:t.type)!=="entity"||u===this._getEffectiveMarkerDirection({type:"card"},"target"))?delete i.direction:u&&(i.direction=u),Object.keys(i).length?r.target=i:delete r.target,r}_cleanupBaselineForEmit(e){if(!this._isObject(e)||!this._isObject(e.baseline))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.baseline),i=this._cleanupResolvableValueForEmit(r.at);return typeof r.enabled!="boolean"&&delete r.enabled,i||r.at===null?r.at=i:delete r.at,["above","below"].forEach(n=>{if(!this._isObject(r[n])){delete r[n];return}let a=this._normalizeTextValue(r[n].color).trim();a?r[n]={...r[n],color:a}:delete r[n]}),Object.keys(r).length?t.baseline=r:delete t.baseline,t}_cleanupPeakForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.peak))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.peak),n=this._normalizeTextValue(i.color).trim(),a=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,(t==null?void 0:t.type)!=="entity"&&i.reset==="never"&&delete i.reset,a==="inward"&&((t==null?void 0:t.type)!=="entity"||a===this._getEffectiveMarkerDirection({type:"card"},"peak"))?delete i.direction:a&&(i.direction=a),n&&this._normalizeColorComparisonValue(n)!==this._normalizeColorComparisonValue("#888")?(i.color=n,delete r.peak_color):delete i.color,i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"peak"),Object.keys(i.label).length||delete i.label,Object.keys(i).length?r.peak=i:delete r.peak,r}_cleanupFloorForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.floor))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.floor),n=this._normalizeTextValue(i.color).trim(),a=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,n&&this._normalizeColorComparisonValue(n)!==this._normalizeColorComparisonValue("#888888")?i.color=n:delete i.color,this._isObject(i.label)&&(i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"floor"),Object.keys(i.label).length||delete i.label),((t==null?void 0:t.type)!=="entity"&&i.reset==="never"||i.reset===void 0||i.reset===null||i.reset==="")&&delete i.reset,a==="inward"&&((t==null?void 0:t.type)!=="entity"||a===this._getEffectiveMarkerDirection({type:"card"},"floor"))?delete i.direction:a&&(i.direction=a),Object.keys(i).length?r.floor=i:delete r.floor,r}_cleanBuiltinMarkerLabelForEmit(e,t,r){var l,s,c;let i=this._isObject(e)?this._cloneDeep(e):{},n=(t==null?void 0:t.type)==="entity"?(l=this._getScopedValue({type:"card"},[r,"label"]))!=null?l:{}:{};i.show===!1&&(t==null?void 0:t.type)!=="entity"&&delete i.show,i.show===!1&&(t==null?void 0:t.type)==="entity"&&n.show!==!0&&delete i.show,i.show_value===!0&&((t==null?void 0:t.type)!=="entity"||n.show_value!==!1)&&delete i.show_value,i.show_unit===!0&&((t==null?void 0:t.type)!=="entity"||n.show_unit!==!1)&&delete i.show_unit,typeof i.text=="string"&&(i.text=i.text.replace(/\s+/g," ").trim(),!i.text&&(t==null?void 0:t.type)!=="entity"&&delete i.text);let a=this._normalizeDecimalValue((s=i.precision)!=null?s:i.decimal);return delete i.decimal,a===null||(t==null?void 0:t.type)==="entity"&&a===((c=n.precision)!=null?c:n.decimal)?delete i.precision:i.precision=a,i}_cleanupBarForEmit(e,t={type:"card"},r=null,i=null){if(!this._isObject(e)||!this._isObject(e.bar))return e;let n=this._cloneDeep(e),a=this._cloneDeep(n.bar),s=["percent","scale"].includes(a.segment_space)?a.segment_space:(t==null?void 0:t.type)==="entity"&&["percent","scale"].includes(i)?i:null;if(s==="percent"&&Array.isArray(a.segments)){let f=m=>typeof m=="number"&&Number.isFinite(m)?`${m}%`:typeof m=="string"&&m.trim()!==""&&!m.includes("%")&&Number.isFinite(Number(m.trim()))?`${Number(m.trim())}%`:m;a.segments=a.segments.map(m=>({...m,from:f(m==null?void 0:m.from),...Object.prototype.hasOwnProperty.call(m!=null?m:{},"to")?{to:f(m.to)}:{}}))}delete a.segment_space;let c=this._normalizeTextValue(a.fill_style).trim(),d=this._normalizeTextValue(a.color).trim(),u=Array.isArray(a.segments)?a.segments:null,h=Array.isArray(a.gradient_stops)?a.gradient_stops:null;if(c){let f=this._cloneDeep(n);delete f.bar.fill_style;let m=ae(f,(t==null?void 0:t.type)==="entity"?r:null,{isCardScope:(t==null?void 0:t.type)!=="entity"}).fill_style;c==="bands"&&m==="bands"?delete a.fill_style:a.fill_style=c,delete n.color_mode}else delete a.fill_style;return d&&this._normalizeColorComparisonValue(d)!==this._normalizeColorComparisonValue("#4a9eff")?(a.color=d,delete n.color):delete a.color,a.solid_fill===!0?a.solid_fill=!0:delete a.solid_fill,u&&(!u.length||s||!this._segmentsEqualForEditor(u,this._getDefaultSegments()))?(a.segments=u,delete n.segments,delete n.severity):delete a.segments,h&&(!h.length||h.length>=2&&!this._isDefaultGradientStops(h))?(a.gradient_stops=this._sanitizeGradientStopsForEmit(h),delete n.gradient_stops):delete a.gradient_stops,Object.keys(a).length?n.bar=a:delete n.bar,n}_getEditorKnownKeyOrder(e=[]){switch(e.join(".")){case"":return["type","title","entities","scale","target","baseline","peak","floor","layout","formatting","bar"];case"entities.*":return["entity","name","icon","scale","target","baseline","peak","floor","layout","formatting","bar"];case"scale":return["min","max"];case"scale.min":case"scale.max":case"target.at":case"baseline.at":return["fixed","entity"];case"target":return["enabled","at","shape","color","label","when_exceeded"];case"target.label":return["show","decimal"];case"target.when_exceeded":return["fill_color"];case"baseline":return["enabled","at","above","below"];case"baseline.above":case"baseline.below":return["color"];case"peak":return["enabled","color","reset","label"];case"floor":return["enabled","color","reset","label"];case"peak.label":case"floor.label":return["show","decimal"];case"layout":return["height","label","hero"];case"layout.label":return["position","hero_size","width"];case"layout.hero":return["size","value_size"];case"formatting":return["unit","decimal"];case"bar":return["fill_style","color","solid_fill","needle","segments","gradient_stops"];case"bar.needle":return["show","color"];default:return null}}_orderEditorConfigKeys(e,t=[]){var a;if(Array.isArray(e)){let l=t[0]==="entities"?["entities","*"]:t;return e.map(s=>this._orderEditorConfigKeys(s,l))}if(!this._isObject(e))return e;let r={},i=(a=this._getEditorKnownKeyOrder(t))!=null?a:[],n=new Set;return i.forEach(l=>{Object.prototype.hasOwnProperty.call(e,l)&&(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]),n.add(l))}),Object.keys(e).forEach(l=>{n.has(l)||(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]))}),r}_cleanupEditorEmittedConfig(e){var n;if(!this._isObject(e))return e;let t=(n=e.bar)==null?void 0:n.segment_space,r=this._cleanupEntityIdentityForEmit(e);r=this._cleanupScaleForEmit(r),r=this._cleanupTargetForEmit(r,{type:"card"}),r=this._cleanupBaselineForEmit(r),r=this._cleanupPeakForEmit(r,{type:"card"}),r=this._cleanupFloorForEmit(r,{type:"card"}),r=this._cleanupGenericMarkersForEmit(r),r=this._cleanupLayoutForEmit(r),r=this._cleanupFormattingForEmit(r),r=this._cleanupNeedleForEmit(r,{type:"card"}),r=this._cleanupBarForEmit(r,{type:"card"}),Array.isArray(r.entities)&&(r.entities=r.entities.map((a,l)=>{if(!this._isObject(a))return a;let s=this._cleanupEntityIdentityForEmit(a);return s=this._cleanupScaleForEmit(s),s=this._cleanupTargetForEmit(s,{type:"entity",index:l}),s=this._cleanupBaselineForEmit(s),s=this._cleanupPeakForEmit(s,{type:"entity",index:l}),s=this._cleanupFloorForEmit(s,{type:"entity",index:l}),s=this._cleanupGenericMarkersForEmit(s),s=this._cleanupLayoutForEmit(s),s=this._cleanupFormattingForEmit(s),s=this._cleanupNeedleForEmit(s,{type:"entity"}),s=this._cleanupBarForEmit(s,{type:"entity",index:l},r,t),s}));let i=a=>{let l=Sr({...a,...!a.entities&&!a.entity?{entities:[]}:{}}),s=["layout","scale","bar","baseline","formatting","target_marker","peak_marker","floor_marker","generic_markers"],c=u=>({...Object.fromEntries(s.map(h=>[h,u[h]])),scale:Object.fromEntries(["min","max"].map(h=>[h,{...u.scale[h],fixed_explicit:u.scale[h].fixed_explicit!==!1}]))}),d=(u,h="")=>Array.isArray(u)?u.map(f=>d(f)):this._isObject(u)?Object.fromEntries(Object.entries(u).filter(([f])=>!["severity","segment_space","label_precision_key"].includes(f)&&!/invalid/i.test(f)).map(([f,m])=>[f,d(m,f)])):h==="fixed"?Qe(null,u):/color/i.test(h)&&typeof u=="string"?this._normalizeColorComparisonValue(u):u;return this._serializeConfig(d({card:c(l),entities:l.entities.map(u=>({entity:u.entity,name:u.name,icon:u.icon,...c(u)}))}))};try{i(e)!==i(r)&&(r=this._cloneDeep(e))}catch(a){r=this._cloneDeep(e)}return this._orderEditorConfigKeys(r)}_getScopedPath(e,t){return kr(e,t)}_normalizePath(e){return gt(e)}_getEntityRawEntries(){return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(e=>this._isObject(e)?this._cloneDeep(e):{entity:e}):this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[]}_withEntityScopeConfig(e){let t=this._getEntityRawEntries(),r=e(t.map(n=>this._cloneDeep(n))),i=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(i=this._deletePathValue(i,["entity"]),this._draftConfig.name!==void 0&&(i=this._deletePathValue(i,["name"])),this._draftConfig.icon!==void 0&&(i=this._deletePathValue(i,["icon"]))),i}_setEntityRowsRaw(e,t={}){var a;let r=this._cloneDeep(e);if(Array.isArray(this._draftConfig.entities)||this._draftConfig.entity===void 0||r.length!==1){let l=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(l=this._deletePathValue(l,["entity"]),l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"])),this._applyUserConfig(l,t)}let[i]=r;if(typeof i=="string"){let l=this._setPathValue(this._draftConfig,["entity"],i);return l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"]),this._applyUserConfig(l,t)}let n=this._setPathValue(this._draftConfig,["entity"],(a=i==null?void 0:i.entity)!=null?a:"");return i&&Object.prototype.hasOwnProperty.call(i,"name")?n=this._setPathValue(n,["name"],i.name):n=this._deletePathValue(n,["name"]),i&&Object.prototype.hasOwnProperty.call(i,"icon")?n=this._setPathValue(n,["icon"],i.icon):n=this._deletePathValue(n,["icon"]),this._applyUserConfig(n,t)}_moveEntityRow(e,t){let r=this._getRawEntityRows(),i=e+t;if(e<0||e>=r.length||i<0||i>=r.length)return!1;let n=this._cloneDeep(r);return[n[e],n[i]]=[n[i],n[e]],this._setEntityRowsRaw(n,{rerender:!0})}_duplicateEntityRow(e){let t=this._getRawEntityRows();if(e<0||e>=t.length)return!1;let r=this._cloneDeep(t[e]),i=typeof r=="string"?{entity:r}:this._cloneDeep(r);this._isObject(i)&&typeof i.name=="string"&&i.name.trim()&&(i.name=`${i.name.trim()} copy`);let n=this._cloneDeep(t);return n.splice(e+1,0,i),this._setEntityRowsRaw(n,{rerender:!0})}_removeEntityRow(e){let t=this._getRawEntityRows();if(t.length<=1||e<0||e>=t.length)return!1;let r=t.filter((i,n)=>n!==e);return this._setEntityRowsRaw(r,{rerender:!0})}_getScopedValue(e,t){if((e==null?void 0:e.type)==="entity"){let r=this._getEntityRawEntries()[e.index];return this._getPathValue(r,this._normalizePath(t))}return this._getPathValue(this._draftConfig,this._getScopedPath(e,t))}_removeScopedValue(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let i=this._withEntityScopeConfig(n=>{var l,s;let a=this._isObject(n[e.index])?{...n[e.index]}:{entity:(s=(l=n[e.index])==null?void 0:l.entity)!=null?s:""};return n[e.index]=this._deletePathValue(a,this._normalizePath(t)),n});return this._applyUserConfig(i,r)}return this._setValueAtPath(this._getScopedPath(e,t),void 0,r)}_applyScopedMutation(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let n=this._withEntityScopeConfig(a=>{var c;let l=a[e.index],s=this._isObject(l)?this._cloneDeep(l):{entity:(c=l==null?void 0:l.entity)!=null?c:""};return a[e.index]=t(s),a});return this._applyUserConfig(n,r)}let i=t(this._cloneDeep(this._draftConfig));return this._applyUserConfig(i,r)}_setScopedValue(e,t,r,i={}){return this._applyScopedMutation(e,n=>this._setPathValue(n,this._normalizePath(t),r),i)}_removePathsFromTarget(e,t=[]){return te(e,t)}_pruneEmptyObjectsInTarget(e,t){return C(e,t)}_setCanonicalScopedValue(e,t,r,i={}){let{deprecatedKeys:n=[],prunePaths:a=[]}=i;return this._applyScopedMutation(e,l=>{let s=this._setPathValue(l,this._normalizePath(t),r);return s=this._removePathsFromTarget(s,n),[this._normalizePath(t).slice(0,-1),...a.map(d=>this._normalizePath(d))].forEach(d=>{d.length&&(s=this._pruneEmptyObjectsInTarget(s,d))}),s},i)}_removeCanonicalScopedValue(e,t,r={}){let{deprecatedKeys:i=[],prunePaths:n=[]}=r;return this._applyScopedMutation(e,a=>{let l=this._deletePathValue(a,this._normalizePath(t));return l=this._removePathsFromTarget(l,i),[this._normalizePath(t).slice(0,-1),...n.map(c=>this._normalizePath(c))].forEach(c=>{c.length&&(l=this._pruneEmptyObjectsInTarget(l,c))}),l},r)}_setScopedNumericOverride(e,t,r,i={}){let n=this._normalizeNumberValue(r);return r===""||r===null||r===void 0?this._removeScopedValue(e,t,i):n===null?!1:this._setScopedValue(e,t,n,i)}_setScopedTextOverride(e,t,r,i={}){let n=this._normalizeTextValue(r).trim();return n?this._setScopedValue(e,t,n,i):this._removeScopedValue(e,t,i)}_setCanonicalScopedNumericOverride(e,t,r,i={}){let n=this._normalizeNumberValue(r);return r===""||r===null||r===void 0||n===null?this._removeCanonicalScopedValue(e,t,i):this._setCanonicalScopedValue(e,t,n,i)}_setCanonicalScopedTextOverride(e,t,r,i={}){let n=this._normalizeTextValue(r).trim();return n?this._setCanonicalScopedValue(e,t,n,i):this._removeCanonicalScopedValue(e,t,i)}_getResolvablePartsFromTarget(e,t,r={}){var d,u,h,f,m,x;let i=(d=r.canonicalBasePath)!=null?d:["scale",t],n=(u=r.legacyFixedPath)!=null?u:[t],a=(h=r.legacyEntityPath)!=null?h:[`${t}_entity`],l=this._getPathValue(e,i),s=this._getPathValue(e,n),c=this._getPathValue(e,a);if(l!==void 0){let k=ee(l,(f=r.inheritedSource)!=null?f:null,null,{allowPercent:["target","baseline"].includes(i[0])});return{fixed:(m=k.fixed)!=null?m:"",entity:(x=k.entity)!=null?x:"",...Number.isFinite(k.percent)?{percent:k.percent}:{}}}return{fixed:!this._isObject(s)&&s!==void 0?s:"",entity:c!=null?c:""}}_getResolvableScopedValue(e,t,r={}){let i=(e==null?void 0:e.type)==="entity"?this._getEntityRawEntries()[e.index]:this._draftConfig;return this._getResolvablePartsFromTarget(i!=null?i:{},t,r)}_getEffectiveResolvableScopedValue(e,t,r={}){var l,s;let i=this._getResolvableScopedValue(e,t,r);if((e==null?void 0:e.type)!=="entity")return i;let n=this._getResolvableScopedValue({type:"card"},t,r),a=this._getEntityRawEntries()[e.index];return this._getPathValue(a,(l=r.canonicalBasePath)!=null?l:["scale",t])!==void 0?this._getResolvablePartsFromTarget(a,t,{...r,inheritedSource:{fixed:n.fixed===""?null:n.fixed,entity:n.entity||null,percent:(s=n.percent)!=null?s:null}}):{fixed:this._hasExplicitOverrideValue(i.fixed)?i.fixed:n.fixed,entity:this._hasExplicitOverrideValue(i.entity)?i.entity:n.entity}}_setCanonicalResolvablePart(e,t,r,i,n={}){var u,h,f,m;let a=(u=n.canonicalBasePath)!=null?u:["scale",t],l=(h=n.legacyFixedPath)!=null?h:[t],s=(f=n.legacyEntityPath)!=null?f:[`${t}_entity`],c=(m=n.prunePaths)!=null?m:[a,a.slice(0,-1)],d=r==="fixed"?this._normalizeNumberValue(i):this._normalizeTextValue(i).trim();return this._applyScopedMutation(e,x=>{let v={...this._getResolvablePartsFromTarget(x!=null?x:{},t,{canonicalBasePath:a,legacyFixedPath:l,legacyEntityPath:s})};r==="fixed"?i===""||i===null||i===void 0||d===null?delete v.fixed:v.fixed=d:d?v.entity=d:delete v.entity;let $=this._cloneDeep(x);$=this._deletePathValue($,s);let _=this._getPathValue($,l);this._isObject(_)||($=this._deletePathValue($,l)),$=this._deletePathValue($,a);let g=v.fixed!==void 0&&v.fixed!==null&&v.fixed!=="",y=v.entity!==void 0&&v.entity!==null&&v.entity!=="",w=Number.isFinite(v.percent);if(g||y||w){let E={};g&&(E.fixed=v.fixed),y&&(E.entity=v.entity),w&&(E.percent=v.percent),$=this._setPathValue($,a,E)}return c.forEach(E=>{E.length&&($=this._pruneEmptyObjectsInTarget($,E))}),$},n)}_clearCanonicalResolvableValue(e,t,r={}){var s,c,d,u;let i=(s=r.canonicalBasePath)!=null?s:["scale",t],n=(c=r.legacyFixedPath)!=null?c:[t],a=(d=r.legacyEntityPath)!=null?d:[`${t}_entity`],l=(u=r.prunePaths)!=null?u:[i,i.slice(0,-1)];return this._applyScopedMutation(e,h=>{let f=this._deletePathValue(h,i);f=this._deletePathValue(f,a);let m=this._getPathValue(f,n);return this._isObject(m)||(f=this._deletePathValue(f,n)),l.forEach(x=>{x.length&&(f=this._pruneEmptyObjectsInTarget(f,x))}),f},r)}_getScopedDisplayValue(e,t,r=[]){let i=[t,...r];for(let n of i){let a=this._getScopedValue(e,n);if(a!=null&&a!=="")return a}return""}_getEffectiveScopedDisplayValue(...e){return bt(this._createSectionContext(),...e)}_paletteUi(){return{root:()=>this.shadowRoot,render:()=>this._render(),focus:e=>this._queuePostRenderFocus(e)}}_applySectionMutation(e,t,r){var i;return((i=r==null?void 0:r.needleEdit)==null?void 0:i.field)!=="mode"||r.needleEdit.value==="disabled"||(e==null?void 0:e.type)==="entity"&&r.needleEdit.value==="inherit"?this._applyScopedMutation(e,t,r):this._applyScopedMutation(e,n=>{let a=t(n),l=this._getPathValue(a,["baseline","enabled"]),s=this._getResolvablePartsFromTarget(a!=null?a:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]});return(l===!0||l!==!1&&this._hasResolvableOverride(s))&&(a=this._deletePathValue(a,["baseline"])),a},r)}_createSectionContext(){return{read:(e,t)=>this._getScopedValue(e,t),mutate:(e,t,r)=>this._applySectionMutation(e,t,r),source:(e,t,r=!1)=>{if((t==null?void 0:t.type)==="reference-marker")return De(t.marker);let i=["baseline","target"].includes(t)?{canonicalBasePath:[t,"at"],legacyFixedPath:[t],legacyEntityPath:t==="target"?["target_entity"]:["baseline","at","entity"]}:{};return r?this._getEffectiveResolvableScopedValue(e,t,i):this._getResolvableScopedValue(e,t,i)},setSource:(e,t,r,i)=>(t==null?void 0:t.type)==="reference-marker"?this._referenceMarkersSection._setGenericMarkerSourcePart(e,t.index,r,i):t==="baseline"?this._persistBaselineSourcePart(e,r,i):this._setCanonicalResolvablePart(e,t,r,i,t==="target"?{canonicalBasePath:["target","at"],legacyFixedPath:["target"],legacyEntityPath:["target_entity"],prunePaths:[["target","at"],["target"]]}:{})}}_renderScaleSection(e){return Et(this._createSectionContext(),e)}_renderFormattingSection(e){return Ft(this._createSectionContext(),e)}_getScopedFormattingValue(e,t){return oe(this._createSectionContext(),e,t)}_getEffectiveScopedFormattingValue(e,t){return Vt(this._createSectionContext(),e,t)}_setScopedFormattingUnit(e,t){return Pt(this._createSectionContext(),e,t)}_setScopedFormattingDecimal(e,t){return Tt(this._createSectionContext(),e,t)}_clearFormattingOverride(e){return Lt(this._createSectionContext(),e)}_hasFormattingOverride(e){return Ut(this._createSectionContext(),e)}_getScopedLayoutValue(e,t){var r,i,n,a,l,s,c,d,u;return t==="height"?(i=(r=this._getScopedValue(e,["layout","height"]))!=null?r:this._getScopedValue(e,["height"]))!=null?i:"":t==="position"?(a=(n=this._getScopedValue(e,["layout","label","position"]))!=null?n:this._getScopedValue(e,["label_position"]))!=null?a:"":t==="width"?(s=(l=this._getScopedValue(e,["layout","label","width"]))!=null?l:this._getScopedValue(e,["label_width"]))!=null?s:"":t==="hero_size"?(d=(c=this._getScopedValue(e,["layout","hero","size"]))!=null?c:this._getScopedValue(e,["layout","label","hero_size"]))!=null?d:"":t==="value_size"&&(u=this._getScopedValue(e,["layout","hero","value_size"]))!=null?u:""}_getEffectiveScopedLayoutValue(e,t){return t==="height"?this._getEffectiveScopedDisplayValue(e,["layout","height"],[["height"]]):t==="position"?this._getEffectiveScopedDisplayValue(e,["layout","label","position"],[["label_position"]]):t==="width"?this._getEffectiveScopedDisplayValue(e,["layout","label","width"],[["label_width"]]):t==="hero_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","size"],[["layout","label","hero_size"]]):t==="value_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","value_size"]):""}_setScopedLayoutLabelPosition(e,t){if(!t)return this._removeCanonicalScopedValue(e,["layout","label","position"],{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});let r=this._setCanonicalScopedValue(e,["layout","label","position"],t,{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});return!r||t==="hero"?r:(this._removeCanonicalScopedValue(e,["layout","label","hero_size"],{prunePaths:[["layout","label"],["layout"]],rerender:!0}),this._removeCanonicalScopedValue(e,["layout","hero"],{prunePaths:[["layout"]],rerender:!0}),!0)}_setLayoutLabelPosition(e){return this._setScopedLayoutLabelPosition({type:"card"},e)}_setScopedLayoutHeroSize(e,t){return t?this._setCanonicalScopedValue(e,["layout","hero","size"],t,{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]}):this._removeCanonicalScopedValue(e,["layout","hero","size"],{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroSize(e){return this._setScopedLayoutHeroSize({type:"card"},e)}_normalizeHeroValueSizeValue(e){let t=this._normalizeNumberValue(e);return t===null?null:Math.min(112,Math.max(12,t))}_setScopedLayoutHeroValueSize(e,t){if(t===""||t===null||t===void 0)return this._removeCanonicalScopedValue(e,["layout","hero","value_size"],{prunePaths:[["layout","hero"],["layout"]]});let r=this._normalizeHeroValueSizeValue(t);return r===null?!1:this._setCanonicalScopedValue(e,["layout","hero","value_size"],r,{prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroValueSize(e){return this._setScopedLayoutHeroValueSize({type:"card"},e)}_setScopedLayoutHeight(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","height"],{deprecatedKeys:[["height"]],prunePaths:[["layout"]]}):r===null||r<24?!1:this._setCanonicalScopedValue(e,["layout","height"],r,{deprecatedKeys:[["height"]],prunePaths:[["layout"]]})}_setLayoutHeight(e){return this._setScopedLayoutHeight({type:"card"},e)}_setScopedLayoutLabelWidth(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","label","width"],{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]}):r===null?!1:this._setCanonicalScopedValue(e,["layout","label","width"],r,{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]})}_clearLayoutOverride(e){return this._applyScopedMutation(e,t=>{let r=this._deletePathValue(t,["layout","height"]);return r=this._deletePathValue(r,["layout","label","position"]),r=this._deletePathValue(r,["layout","label","hero_size"]),r=this._deletePathValue(r,["layout","label","width"]),r=this._deletePathValue(r,["layout","hero"]),r=this._deletePathValue(r,["height"]),r=this._deletePathValue(r,["label_position"]),r=this._deletePathValue(r,["label_width"]),r=this._pruneEmptyObjectsInTarget(r,["layout","label"]),r=this._pruneEmptyObjectsInTarget(r,["layout"]),r},{rerender:!0})}_hasLayoutOverride(e){var i,n;let t=(i=this._getScopedValue(e,["layout"]))!=null?i:{},r=this._isObject(t)?(n=t.label)!=null?n:{}:{};return this._isObject(t)&&(Object.prototype.hasOwnProperty.call(t,"height")||this._isObject(r)&&(Object.prototype.hasOwnProperty.call(r,"position")||Object.prototype.hasOwnProperty.call(r,"hero_size")||Object.prototype.hasOwnProperty.call(r,"width")))||this._isObject(t)&&this._isObject(t.hero)&&Object.keys(t.hero).length?!0:this._getScopedValue(e,["height"])!==void 0||this._getScopedValue(e,["label_position"])!==void 0||this._getScopedValue(e,["label_width"])!==void 0}_setScaleBound(e,t){return rt(this._createSectionContext(),{type:"card"},e,"fixed",t)}_clearScaleOverride(e){return jt(this._createSectionContext(),e)}_setBarFillStyle(e){return this._setScopedBarFillStyle({type:"card"},e)}_setBarColor(e){return this._setScopedBarColor({type:"card"},e)}_setGradientStops(...e){return this._gradientStopsSection._setGradientStops(...e)}_setSegments(...e){return this._segmentsSection._setSegments(...e)}_getDefaultGradientStops(...e){return this._gradientStopsSection._getDefaultGradientStops(...e)}_normalizeGradientStopPosValue(...e){return this._gradientStopsSection._normalizeGradientStopPosValue(...e)}_sanitizeGradientStopsForEmit(...e){return this._gradientStopsSection._sanitizeGradientStopsForEmit(...e)}_getGradientStopDraftColorDefault(...e){return this._gradientStopsSection._getGradientStopDraftColorDefault(...e)}_getNextSuggestedGradientStopPos(...e){return this._gradientStopsSection._getNextSuggestedGradientStopPos(...e)}_getGradientStopsDraftKey(...e){return this._gradientStopsSection._getGradientStopsDraftKey(...e)}_getGradientStopPosTextKey(...e){return this._gradientStopsSection._getGradientStopPosTextKey(...e)}_getGradientStopPosText(...e){return this._gradientStopsSection._getGradientStopPosText(...e)}_setGradientStopPosText(...e){return this._gradientStopsSection._setGradientStopPosText(...e)}_clearGradientStopPosText(...e){return this._gradientStopsSection._clearGradientStopPosText(...e)}_clearGradientStopScopeTextState(...e){return this._gradientStopsSection._clearGradientStopScopeTextState(...e)}_getGradientStopsUiRows(...e){return this._gradientStopsSection._getGradientStopsUiRows(...e)}_setGradientStopsUiRows(...e){return this._gradientStopsSection._setGradientStopsUiRows(...e)}_getStoredScopedGradientStops(...e){return this._gradientStopsSection._getStoredScopedGradientStops(...e)}_getFallbackGradientStops(...e){return this._gradientStopsSection._getFallbackGradientStops(...e)}_createGradientStopDraftState(...e){return this._gradientStopsSection._createGradientStopDraftState(...e)}_getGradientStopsDraftState(...e){return this._gradientStopsSection._getGradientStopsDraftState(...e)}_setGradientStopsDraftState(...e){return this._gradientStopsSection._setGradientStopsDraftState(...e)}_setGradientStopsDraftField(...e){return this._gradientStopsSection._setGradientStopsDraftField(...e)}_getValidGradientDraftStop(...e){return this._gradientStopsSection._getValidGradientDraftStop(...e)}_hasGradientStopDuplicate(...e){return this._gradientStopsSection._hasGradientStopDuplicate(...e)}_canAddGradientStop(...e){return this._gradientStopsSection._canAddGradientStop(...e)}_getGradientDraftValidationMessage(...e){return this._gradientStopsSection._getGradientDraftValidationMessage(...e)}_isDefaultGradientStops(...e){return this._gradientStopsSection._isDefaultGradientStops(...e)}_setScopedGradientStops(e,t,r={}){var s;let i=this._sanitizeGradientStopsForEmit(t),n=i.length<2||this._isDefaultGradientStops(i),a=this._serializeConfig((s=this._getGradientStopsUiRows(e))!=null?s:[]);this._clearGradientStopScopeTextState(e),this._setGradientStopsUiRows(e,i);let l=this._applyScopedMutation(e,c=>{let d=this._deletePathValue(c,["gradient_stops"]);return d=this._deletePathValue(d,["bar","gradient_stops"]),n||(d=this._setPathValue(d,["bar","gradient_stops"],i)),d=this._pruneEmptyObjectsInTarget(d,["bar"]),d},r);return l===!1&&(r!=null&&r.rerender)&&this._serializeConfig(i)!==a&&this._render(),l!==!1&&!(r!=null&&r.rerender)&&this._refreshGradientDraftUi(e),l}_clearGradientStopsOverride(...e){return this._gradientStopsSection._clearGradientStopsOverride(...e)}_setScopedSegments(e,t,r={}){let i=(r==null?void 0:r.sort)===!1?this._cloneDeep(t):this._sortSegmentsForEditor(t),n=this._getFallbackSegments(e),a=!Array.isArray(i)||!i.length||n.length>0&&this._segmentsEqualForEditor(i,n);this._setSegmentsUiRows(e,i);let l=this._applyScopedMutation(e,s=>{let c=this._deletePathValue(s,["bar","segments"]);return c=this._deletePathValue(c,["segments"]),c=this._deletePathValue(c,["severity"]),a||(c=this._setPathValue(c,["bar","segments"],i)),c=this._pruneEmptyObjectsInTarget(c,["bar"]),c},r);return l!==!1&&this._refreshSegmentUi(e),l}_clearSegmentsOverride(...e){return this._segmentsSection._clearSegmentsOverride(...e)}_setNeedle(...e){return this._needleSection._setNeedle(...e)}_getScopedPeakConfig(...e){return this._extremaSection._getScopedPeakConfig(...e)}_getEffectiveScopedPeakConfig(...e){return this._extremaSection._getEffectiveScopedPeakConfig(...e)}_hasPeakOverride(...e){return this._extremaSection._hasPeakOverride(...e)}_getPeakSummary(...e){return this._extremaSection._getPeakSummary(...e)}_clearPeakOverride(...e){return this._extremaSection._clearPeakOverride(...e)}_setScopedPeakEnabled(...e){return this._extremaSection._setScopedPeakEnabled(...e)}_setScopedPeakColor(...e){return this._extremaSection._setScopedPeakColor(...e)}_getScopedMarkerExtras(...e){return this._extremaSection._getScopedMarkerExtras(...e)}_hasExtremumOverride(...e){return this._extremaSection._hasExtremumOverride(...e)}_getEffectiveMarkerExtras(...e){return this._extremaSection._getEffectiveMarkerExtras(...e)}_getScopedFloorConfig(...e){return this._extremaSection._getScopedFloorConfig(...e)}_getEffectiveScopedFloorConfig(...e){return this._extremaSection._getEffectiveScopedFloorConfig(...e)}_getFloorSummary(...e){return this._extremaSection._getFloorSummary(...e)}_getMarkerResetSummary(...e){return this._extremaSection._getMarkerResetSummary(...e)}_getCardTargetMarkerSummary(...e){return this._targetSection._getCardTargetMarkerSummary(...e)}_setScopedExtremumEnabled(...e){return this._extremaSection._setScopedExtremumEnabled(...e)}_setScopedExtremumColor(...e){return this._extremaSection._setScopedExtremumColor(...e)}_setScopedExtremumReset(...e){return this._extremaSection._setScopedExtremumReset(...e)}_setScopedExtremumLabelShow(...e){return this._extremaSection._setScopedExtremumLabelShow(...e)}_setScopedExtremumLabelDecimal(...e){return this._extremaSection._setScopedExtremumLabelDecimal(...e)}_getBuiltinMarkerLabelOptions(e,t){let r=t==="target"?this._getEffectiveTargetLabelShowValue(e):this._getEffectiveMarkerExtras(e,t).labelShow;return Ve(this._createSectionContext(),e,t,r)}_renderBuiltinMarkerLabelControls(e,t,r){return ge(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(...e){return Pe(this._createSectionContext(),...e)}_clearFloorOverride(...e){return this._extremaSection._clearFloorOverride(...e)}_setFixedMarkerValue(e,t,r){let i=this._normalizeNumberValue(r);return!t||i===null?this._removeCanonicalScopedValue({type:"card"},[e,"at","fixed"],{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]}):this._setCanonicalScopedValue({type:"card"},[e,"at","fixed"],i,{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]})}_setPeakShow(...e){return this._extremaSection._setPeakShow(...e)}_readFixedMarker(e){let t=this._draftConfig[e];if(this._isObject(t)){let r=this._isObject(t==null?void 0:t.at)?t.at.fixed:t==null?void 0:t.at;return{enabled:r!=null&&r!=="",value:r!=null?r:""}}return{enabled:t!=null&&t!=="",value:t!=null?t:""}}_getGradientStopsValue(...e){return this._gradientStopsSection._getGradientStopsValue(...e)}_getSegmentsValue(...e){return this._segmentsSection._getSegmentsValue(...e)}_getSegmentsScopeKey(...e){return this._segmentsSection._getSegmentsScopeKey(...e)}_getSegmentBoundaryTextKey(...e){return this._segmentsSection._getSegmentBoundaryTextKey(...e)}_getSegmentBoundaryText(...e){return this._segmentsSection._getSegmentBoundaryText(...e)}_setSegmentBoundaryText(...e){return this._segmentsSection._setSegmentBoundaryText(...e)}_clearSegmentBoundaryText(...e){return this._segmentsSection._clearSegmentBoundaryText(...e)}_clearSegmentScopeTextState(...e){return this._segmentsSection._clearSegmentScopeTextState(...e)}_getSegmentsUiRows(...e){return this._segmentsSection._getSegmentsUiRows(...e)}_setSegmentsUiRows(...e){return this._segmentsSection._setSegmentsUiRows(...e)}_getSegmentDraftState(...e){return this._segmentsSection._getSegmentDraftState(...e)}_setSegmentDraftState(...e){return this._segmentsSection._setSegmentDraftState(...e)}_setSegmentDraftField(...e){return this._segmentsSection._setSegmentDraftField(...e)}_isSegmentFillStyle(...e){return this._segmentsSection._isSegmentFillStyle(...e)}_getDefaultSegments(...e){return this._segmentsSection._getDefaultSegments(...e)}_getStoredScopedSegments(...e){return this._segmentsSection._getStoredScopedSegments(...e)}_parseSegmentBoundaryInput(...e){return this._segmentsSection._parseSegmentBoundaryInput(...e)}_formatSegmentBoundaryValue(...e){return this._segmentsSection._formatSegmentBoundaryValue(...e)}_getSegmentDraftColorDefault(...e){return this._segmentsSection._getSegmentDraftColorDefault(...e)}_getNewSegmentDefaults(...e){return this._segmentsSection._getNewSegmentDefaults(...e)}_createSegmentDraftState(...e){return this._segmentsSection._createSegmentDraftState(...e)}_normalizeSegmentForEditorComparison(...e){return this._segmentsSection._normalizeSegmentForEditorComparison(...e)}_segmentsEqualForEditor(...e){return this._segmentsSection._segmentsEqualForEditor(...e)}_getFallbackSegments(...e){return this._segmentsSection._getFallbackSegments(...e)}_parseSegmentBoundaryText(...e){return this._segmentsSection._parseSegmentBoundaryText(...e)}_compareSegmentBoundaries(...e){return this._segmentsSection._compareSegmentBoundaries(...e)}_buildSegmentValidationRows(...e){return this._segmentsSection._buildSegmentValidationRows(...e)}_getSegmentRowValidationMessage(...e){return this._segmentsSection._getSegmentRowValidationMessage(...e)}_getValidSegmentDraft(...e){return this._segmentsSection._getValidSegmentDraft(...e)}_canAddSegment(...e){return this._segmentsSection._canAddSegment(...e)}_getSegmentDraftValidationMessage(...e){return this._segmentsSection._getSegmentDraftValidationMessage(...e)}_getSegmentPreviewBoundaryValue(...e){return this._segmentsSection._getSegmentPreviewBoundaryValue(...e)}_sortSegmentsForEditor(...e){return this._segmentsSection._sortSegmentsForEditor(...e)}_getSegmentPreviewRows(...e){return this._segmentsSection._getSegmentPreviewRows(...e)}_buildEditorSegmentPreviewStyle(...e){return this._segmentsSection._buildEditorSegmentPreviewStyle(...e)}_getSegmentPreviewDomIds(...e){return this._segmentsSection._getSegmentPreviewDomIds(...e)}_renderSegmentPreview(...e){return this._segmentsSection._renderSegmentPreview(...e)}_refreshSegmentPreview(...e){return this._segmentsSection._refreshSegmentPreview(...e)}_getSegmentDomIds(...e){return this._segmentsSection._getSegmentDomIds(...e)}_refreshSegmentUi(...e){return this._segmentsSection._refreshSegmentUi(...e)}_commitSegmentDraft(...e){return this._segmentsSection._commitSegmentDraft(...e)}_commitSegmentBoundaryEdit(...e){return this._segmentsSection._commitSegmentBoundaryEdit(...e)}_commitGradientStopDraft(...e){return this._gradientStopsSection._commitGradientStopDraft(...e)}_getGradientPreviewDomIds(...e){return this._gradientStopsSection._getGradientPreviewDomIds(...e)}_refreshGradientDraftUi(...e){return this._gradientStopsSection._refreshGradientDraftUi(...e)}_commitGradientStopPosEdit(...e){return this._gradientStopsSection._commitGradientStopPosEdit(...e)}_getFillStyleValue(){return X(this._createSectionContext(),{type:"card"})}_getFillStyleFromColorMode(e){return Kt(e)}_getScopedFillStyleValue(e){return qt(this._createSectionContext(),e)}_getEffectiveScopedFillStyleValue(e){return X(this._createSectionContext(),e)}_setScopedBarFillStyle(e,t){return Mt(this._createSectionContext(),e,t)}_getScopedBarColorValue(e){return nt(this._createSectionContext(),e)}_getEffectiveScopedBarColorValue(e){return Ht(this._createSectionContext(),e)}_setScopedBarColor(e,t){return Ct(this._createSectionContext(),e,t)}_getScopedBarSolidFillValue(e){return _e(this._createSectionContext(),e)}_getEffectiveScopedBarSolidFillValue(e){return Wt(this._createSectionContext(),e)}_setScopedBarSolidFill(e,t){return Dt(this._createSectionContext(),e,t)}_clearEntityBarAppearance(e){return Yt(this._createSectionContext(),e)}_hasEntityBarAppearanceOverride(e){return Xt(this._createSectionContext(),e)}_getScopedNeedleConfig(...e){return this._needleSection._getScopedNeedleConfig(...e)}_hasNeedleOverride(...e){return this._needleSection._hasNeedleOverride(...e)}_getEffectiveScopedNeedleConfig(...e){return this._needleSection._getEffectiveScopedNeedleConfig(...e)}_setScopedNeedleMode(...e){return this._needleSection._setScopedNeedleMode(...e)}_setScopedNeedleColor(...e){return this._needleSection._setScopedNeedleColor(...e)}_getNeedleValue(...e){return this._needleSection._getNeedleValue(...e)}_getPeakShowValue(...e){return this._extremaSection._getPeakShowValue(...e)}_getScaleFixedValue(e,t){return $t(this._createSectionContext(),e)}_getScaleEntityValue(e){return kt(this._createSectionContext(),e)}_getTargetResolvableValue(...e){return this._targetSection._getTargetResolvableValue(...e)}_getEffectiveTargetResolvableValue(...e){return this._targetSection._getEffectiveTargetResolvableValue(...e)}_getTargetMode(...e){return this._targetSection._getTargetMode(...e)}_getTargetShapeValue(...e){return this._targetSection._getTargetShapeValue(...e)}_getEffectiveMarkerDirection(...e){return ue(this._createSectionContext(),...e)}_setMarkerDirection(...e){return Te(this._createSectionContext(),...e)}_hasTargetShape(...e){return this._targetSection._hasTargetShape(...e)}_getEffectiveTargetShapeValue(...e){return this._targetSection._getEffectiveTargetShapeValue(...e)}_setTargetShape(...e){return this._targetSection._setTargetShape(...e)}_getEffectiveTargetMode(...e){return this._targetSection._getEffectiveTargetMode(...e)}_setTargetMode(...e){return this._targetSection._setTargetMode(...e)}_setTargetResolvablePart(...e){return this._targetSection._setTargetResolvablePart(...e)}_clearTargetOverride(...e){return this._targetSection._clearTargetOverride(...e)}_getTargetColorValue(...e){return this._targetSection._getTargetColorValue(...e)}_getEffectiveTargetColorValue(...e){return this._targetSection._getEffectiveTargetColorValue(...e)}_hasCustomTargetColor(...e){return this._targetSection._hasCustomTargetColor(...e)}_setTargetColor(...e){return this._targetSection._setTargetColor(...e)}_getTargetLabelShowValue(...e){return this._targetSection._getTargetLabelShowValue(...e)}_getEffectiveTargetLabelShowValue(...e){return this._targetSection._getEffectiveTargetLabelShowValue(...e)}_setTargetLabelShow(...e){return this._targetSection._setTargetLabelShow(...e)}_getTargetLabelDecimalValue(...e){return this._targetSection._getTargetLabelDecimalValue(...e)}_getEffectiveTargetLabelDecimalValue(...e){return this._targetSection._getEffectiveTargetLabelDecimalValue(...e)}_setTargetLabelDecimal(...e){return this._targetSection._setTargetLabelDecimal(...e)}_getTargetAboveFillColorValue(...e){return this._targetSection._getTargetAboveFillColorValue(...e)}_getTargetAboveFillDraftKey(...e){return this._targetSection._getTargetAboveFillDraftKey(...e)}_setTargetAboveFillDraft(...e){return this._targetSection._setTargetAboveFillDraft(...e)}_getTargetAboveFillDraft(...e){return this._targetSection._getTargetAboveFillDraft(...e)}_getBaselineColorDraftKey(...e){return this._baselineSection._getBaselineColorDraftKey(...e)}_setBaselineColorDraft(...e){return this._baselineSection._setBaselineColorDraft(...e)}_getBaselineColorDraft(...e){return this._baselineSection._getBaselineColorDraft(...e)}_getEffectiveTargetAboveFillColorValue(...e){return this._targetSection._getEffectiveTargetAboveFillColorValue(...e)}_setTargetAboveFillColor(...e){return this._targetSection._setTargetAboveFillColor(...e)}_isTargetAboveFillEnabled(...e){return this._targetSection._isTargetAboveFillEnabled(...e)}_setTargetAboveFillEnabled(...e){return this._targetSection._setTargetAboveFillEnabled(...e)}_isBaselineDirectionalColorEnabled(...e){return this._baselineSection._isBaselineDirectionalColorEnabled(...e)}_setBaselineDirectionalColorEnabled(...e){return this._baselineSection._setBaselineDirectionalColorEnabled(...e)}_hasTargetOverride(...e){return this._targetSection._hasTargetOverride(...e)}_getBaselineResolvableValue(...e){return this._baselineSection._getBaselineResolvableValue(...e)}_getEffectiveBaselineResolvableValue(...e){return this._baselineSection._getEffectiveBaselineResolvableValue(...e)}_getBaselineMode(...e){return this._baselineSection._getBaselineMode(...e)}_getEffectiveBaselineMode(...e){return this._baselineSection._getEffectiveBaselineMode(...e)}_setBaselineMode(...e){return this._baselineSection._setBaselineMode(...e)}_persistBaselineSourcePart(e,t,r){let i=t==="fixed"?this._normalizeNumberValue(r):this._normalizeTextValue(r).trim();return this._applyScopedMutation(e,n=>{let l={...this._getResolvablePartsFromTarget(n!=null?n:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]})};t==="fixed"?r===""||r===null||r===void 0||i===null?delete l.fixed:l.fixed=i:i?l.entity=i:delete l.entity;let s=this._cloneDeep(n);s=this._deletePathValue(s,["baseline","at"]);let c=l.fixed!==void 0&&l.fixed!==null&&l.fixed!=="",d=l.entity!==void 0&&l.entity!==null&&l.entity!=="";if(c||d){let u={};c&&(u.fixed=l.fixed),d&&(u.entity=l.entity),s=this._setPathValue(s,["baseline","at"],u)}return s=this._pruneEmptyObjectsInTarget(s,["baseline","at"]),s=this._pruneEmptyObjectsInTarget(s,["baseline"]),s})}_setBaselineResolvablePart(...e){return this._baselineSection._setBaselineResolvablePart(...e)}_removeScopedNeedle(...e){return this._needleSection._removeScopedNeedle(...e)}_setBaselineDirectionalColor(...e){return this._baselineSection._setBaselineDirectionalColor(...e)}_getBaselineDirectionalColorValue(...e){return this._baselineSection._getBaselineDirectionalColorValue(...e)}_getEffectiveBaselineDirectionalColorValue(...e){return this._baselineSection._getEffectiveBaselineDirectionalColorValue(...e)}_clearBaselineOverride(...e){return this._baselineSection._clearBaselineOverride(...e)}_removeBaseline(...e){return this._baselineSection._removeBaseline(...e)}_hasBaselineOverride(...e){return this._baselineSection._hasBaselineOverride(...e)}_isEntityOverrideExpanded(e){return this._expandedEntityOverrides.has(e)}_toggleEntityOverrideExpanded(e){this._expandedEntityOverrides.has(e)?this._expandedEntityOverrides.delete(e):this._expandedEntityOverrides.add(e),this._render()}_syncExpandedEntityOverrides(e){let t=new Set;this._expandedEntityOverrides.forEach(i=>{i<e&&t.add(i)}),this._expandedEntityOverrides=t;let r=new Set;this._expandedOverrideGroups.forEach(i=>{let[n,a]=String(i).split(":"),l=Number(n);Number.isInteger(l)&&l<e&&a&&r.add(`${l}:${a}`)}),this._expandedOverrideGroups=r}_isCardGroupExpanded(e){return this._expandedCardGroups.has(e)}_toggleCardGroupExpanded(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._render()}_toggleGenericMarkerExpanded(...e){return this._referenceMarkersSection._toggleGenericMarkerExpanded(...e)}_getOverrideGroupKey(e,t){return`${e}:${t}`}_isOverrideGroupExpanded(e,t){return this._expandedOverrideGroups.has(this._getOverrideGroupKey(e,t))}_toggleOverrideGroupExpanded(e,t){let r=this._getOverrideGroupKey(e,t);this._expandedOverrideGroups.has(r)?this._expandedOverrideGroups.delete(r):this._expandedOverrideGroups.add(r),this._render()}_hasExplicitOverrideValue(...e){return pt(...e)}_hasResolvableOverride(...e){return pe(...e)}_getScaleOverrideSummary(e){return Vr(this._createSectionContext(),e)}_getLayoutSummary(e){let t=[],r=this._getScopedLayoutValue(e,"height"),i=this._getScopedLayoutValue(e,"position"),n=this._getScopedLayoutValue(e,"width");return r!==""&&t.push(`Height ${r}`),i!==""&&t.push(`${i}`),n!==""&&t.push(`Width ${n}`),t.length?t.join(" \u2022 "):"Inherited"}_getTargetOverrideSummary(...e){return this._targetSection._getTargetOverrideSummary(...e)}_getBaselineOverrideSummary(...e){return this._baselineSection._getBaselineOverrideSummary(...e)}_getCardBaselineSummary(...e){return this._baselineSection._getCardBaselineSummary(...e)}_getBarAppearanceSummary(e){return Tr(this._createSectionContext(),e)}_getScopedSegmentsValue(...e){return this._segmentsSection._getScopedSegmentsValue(...e)}_hasSegmentsOverride(...e){return this._segmentsSection._hasSegmentsOverride(...e)}_getSegmentsSummary(...e){return this._segmentsSection._getSegmentsSummary(...e)}_getEffectiveFillStyleValue(e){return X(this._createSectionContext(),e)}_getScopedGradientStopsValue(...e){return this._gradientStopsSection._getScopedGradientStopsValue(...e)}_hasGradientStopsOverride(...e){return this._gradientStopsSection._hasGradientStopsOverride(...e)}_getGradientStopsSummary(...e){return this._gradientStopsSection._getGradientStopsSummary(...e)}_buildGradientPreviewEffectiveStops(...e){return this._gradientStopsSection._buildGradientPreviewEffectiveStops(...e)}_buildEditorGradientPreviewStyle(...e){return this._gradientStopsSection._buildEditorGradientPreviewStyle(...e)}_getGradientPreviewStyle(...e){return this._gradientStopsSection._getGradientPreviewStyle(...e)}_renderGradientPreview(...e){return this._gradientStopsSection._renderGradientPreview(...e)}_getNeedleSummary(...e){return this._needleSection._getNeedleSummary(...e)}_getFormattingSummary(e){return Pr(this._createSectionContext(),e)}_renderOverrideGroup({index:e,group:t,title:r,summary:i,content:n}){let a=this._isOverrideGroupExpanded(e,t);return`
      <div class="override-group" data-group="${t}" data-expanded="${a?"true":"false"}">
        <button
          type="button"
          id="entity-${e}-group-${t}"
          class="override-group-toggle"
          data-action="toggle-override-group"
          data-index="${e}"
          data-group="${t}"
          aria-expanded="${a?"true":"false"}"
        >
          <span
            id="entity-${e}-group-${t}-title"
            class="override-group-title"
            data-action="toggle-override-group"
            data-index="${e}"
            data-group="${t}"
          >${a?"\u25BE":"\u25B8"} ${r}</span>
          <span
            id="entity-${e}-group-${t}-summary"
            class="override-group-summary"
            data-action="toggle-override-group"
            data-index="${e}"
            data-group="${t}"
          >${this._escapeAttribute(i)}</span>
        </button>
        <div class="override-group-body" style="display:${a?"grid":"none"};">
          ${n}
        </div>
      </div>
    `}_renderCardGroup(e){return xt(e,this._isCardGroupExpanded(e.group))}_renderEntityInput(e,t){return Er(e,t)}_renderEntitySourceInput(e,t,r,i="sensor.example",n={}){return W(e,t,r,i,n)}_hasMarkersOverride(...e){return this._referenceMarkersSection._hasMarkersOverride(...e)}_getGenericMarkers(...e){return this._referenceMarkersSection._getGenericMarkers(...e)}_getGenericMarkersSummary(...e){return this._referenceMarkersSection._getGenericMarkersSummary(...e)}_getGenericMarkerScopeKey(...e){return this._referenceMarkersSection._getGenericMarkerScopeKey(...e)}_getGenericMarkerUiIds(...e){return this._referenceMarkersSection._getGenericMarkerUiIds(...e)}_resetGenericMarkerUiScope(...e){return this._referenceMarkersSection._resetGenericMarkerUiScope(...e)}_getGenericMarkerSummary(...e){return this._referenceMarkersSection._getGenericMarkerSummary(...e)}_refreshGenericMarkerSummary(...e){return this._referenceMarkersSection._refreshGenericMarkerSummary(...e)}_getGenericMarkerSource(...e){return this._referenceMarkersSection._getGenericMarkerSource(...e)}_renderGenericMarkersEditor(...e){return this._referenceMarkersSection._renderGenericMarkersEditor(...e)}_getGenericMarkerScope(...e){return this._referenceMarkersSection._getGenericMarkerScope(...e)}_setGenericMarkerList(...e){return this._referenceMarkersSection._setGenericMarkerList(...e)}_updateGenericMarker(...e){return this._referenceMarkersSection._updateGenericMarker(...e)}_setGenericMarkerSourceMode(...e){return this._referenceMarkersSection._setGenericMarkerSourceMode(...e)}_setGenericMarkerField(...e){return this._referenceMarkersSection._setGenericMarkerField(...e)}_cleanupGenericMarkersForEmit(e){if(!this._isObject(e)||!Array.isArray(e.markers))return e;let t=this._cloneDeep(e);return t.markers=t.markers.map(r=>{var n;if(!this._isObject(r))return r;let i=this._cloneDeep(r);if(i.show_marker===!0&&delete i.show_marker,this._isObject(i.at)){let a=this._cloneDeep(i.at),l=this._normalizeNumberValue(a.fixed),s=this._normalizeTextValue(a.entity).trim();l!==null?a.fixed=l:delete a.fixed,s?a.entity=s:delete a.entity,Object.keys(a).length?i.at=a:delete i.at}if(i.lane==="below"&&delete i.lane,i.shape==="circle"&&delete i.shape,i.direction==="inward"&&delete i.direction,this._normalizeColorComparisonValue(i.color)===this._normalizeColorComparisonValue("#888888")&&delete i.color,this._isObject(i.label)){let a=this._cloneDeep(i.label);a.show===!1&&delete a.show,a.show_value===!0&&delete a.show_value,a.show_unit===!0&&delete a.show_unit,typeof a.text=="string"&&(a.text=a.text.replace(/\s+/g," ").trim(),a.text||delete a.text);let l=this._normalizeDecimalValue((n=a.precision)!=null?n:a.decimal);delete a.decimal,l===null?delete a.precision:a.precision=l,delete a.unit,Object.keys(a).length?i.label=a:delete i.label}return i}),t}_renderResetOptions(e){return tt(e)}_escapeAttribute(e){return S(e)}_isHexColorValue(e){return fe(e)}_expandHexColor(e){return et(e)}_normalizeColorComparisonValue(e){return G(e)}_getColorPickerValue(e,t="#000000"){return Q(e,t)}_renderColorInput(e){return I(e)}_renderListRows(e,t){return e.map((r,i)=>t(r,i)).join("")}_render(){var t;if(!this.shadowRoot||this._isRendering)return;let e=this._numericDrafts.captureFocus(this.shadowRoot);this._isRendering=!0;try{let r=this._getEntitiesValue(),i=this._getFillStyleValue(),n=this._getScopedLayoutValue({type:"card"},"position")||"left",a=this._getScopedLayoutValue({type:"card"},"hero_size")||"medium",l=this._getScopedLayoutValue({type:"card"},"value_size"),s=this._getScopedLayoutValue({type:"card"},"height"),c=this._getScopedLayoutValue({type:"card"},"width");this._syncExpandedEntityOverrides(r.length),this.shadowRoot.innerHTML=`
	      <style>${vt}</style>
	      <div class="editor">
	        <div class="section">
	          <div class="section-head">
	            <h3>Basics</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="title">Title</label>
              <input id="title" type="text" data-field="title" value="${this._escapeAttribute((t=this._draftConfig.title)!=null?t:"")}">
            </div>
	          </div>
	        </div>

	        <div class="section">
	          <div class="section-head">
	            <h3>Entities</h3>
	            <div class="section-note">Overrides replace card defaults only for this entity.</div>
	          </div>
	          <div class="field-grid">
              <div class="list">
	                ${this._renderListRows(r,(d,u)=>{var h;return`
	                  <div class="entity-shell" data-entity-shell-index="${u}">
	                    <div class="entity-main">
	                      <div class="entity-header">
	                        <div class="entity-header-main">
	                          <div class="entity-title">Entity ${u+1}</div>
	                          <div class="entity-subtitle">${this._escapeAttribute(d.entity||"Configure entity")}</div>
	                        </div>
	                        <div class="entity-actions">
	                          <button type="button" data-action="move-entity-up" data-index="${u}"${u===0?" disabled":""} aria-label="Move entity ${u+1} up">\u2191</button>
	                          <button type="button" data-action="move-entity-down" data-index="${u}"${u===r.length-1?" disabled":""} aria-label="Move entity ${u+1} down">\u2193</button>
	                          <button type="button" data-action="duplicate-entity" data-index="${u}">Duplicate</button>
	                          <button type="button" data-action="remove-entity" data-index="${u}"${r.length<=1?" disabled":""} aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                        </div>
	                      </div>
	                      <div class="entity-fields">
	                        ${this._renderEntityInput(d,u)}
	                        <input type="text" data-kind="entity-name" data-index="${u}" value="${this._escapeAttribute((h=d.name)!=null?h:"")}" placeholder="Name">
                        ${(()=>{var x;let f=this._getEntityIconMode(d,u),m=(x=customElements.get)!=null&&x.call(customElements,"ha-icon-picker")?`<ha-icon-picker data-kind="entity-icon-picker" data-index="${u}" label="Select an icon" placeholder="Search icons"${f!=="custom"?" disabled":""}></ha-icon-picker>`:`<input type="text" data-kind="entity-icon-value" data-index="${u}" value="${this._escapeAttribute(typeof d.icon=="string"?d.icon:"")}" placeholder="Select an icon"${f!=="custom"?" disabled":""} autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;return`<div class="entity-icon-field">
                            <label>Icon</label>
                            <div class="entity-icon-modes" role="radiogroup" aria-label="Entity ${u+1} icon mode">
                              ${[["default","Default"],["custom","Custom"],["off","Off"]].map(([k,v])=>`
                                <label class="entity-icon-mode-option"><input type="radio" data-kind="entity-icon-mode" data-index="${u}" name="entity-icon-mode-${u}" value="${k}"${f===k?" checked":""}>${v}</label>
                              `).join("")}
                            </div>
                            ${m}
                          </div>`})()}
	                      </div>
	                    </div>
	                    <button type="button" class="override-toggle" data-action="toggle-entity-overrides" data-index="${u}" aria-expanded="${this._isEntityOverrideExpanded(u)?"true":"false"}">
	                      ${this._isEntityOverrideExpanded(u)?"\u25BE":"\u25B8"} Overrides
	                    </button>
                    <div class="override-panel" style="display:${this._isEntityOverrideExpanded(u)?"grid":"none"};">
                      <div class="section-note">Overrides replace card defaults only for this entity.</div>
                      ${(()=>{let f={type:"entity",index:u},m=!this._hasTargetOverride(f),x=!this._hasLayoutOverride(f),k=!this._hasPeakOverride(f),v=!this._hasExtremumOverride(f,"floor"),$=this._renderOverrideGroup({index:u,group:"scale",title:"Scale",summary:this._getScaleOverrideSummary(f),content:this._renderScaleSection(f)}),_=this._renderOverrideGroup({index:u,group:"layout",title:"Layout",summary:this._getLayoutSummary(f),content:`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${u}-layout-inherit" type="checkbox" data-kind="entity-layout-inherit" data-index="${u}"${x?" checked":""}>
                          <label for="entity-${u}-layout-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${u}-height">Row height</label>
	                        <input id="entity-${u}-height" type="number" min="24" step="1" data-kind="entity-override-height" data-index="${u}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(f,"height"))}" placeholder="inherit card default">
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${u}-label-position">Label position</label>
	                        <select id="entity-${u}-label-position" data-kind="entity-layout-label-position" data-index="${u}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(f,"position"))}">
                          <option value=""${this._getEffectiveScopedLayoutValue(f,"position")===""?" selected":""}>inherit card default</option>
                          <option value="left"${this._getEffectiveScopedLayoutValue(f,"position")==="left"?" selected":""}>left</option>
                          <option value="above"${this._getEffectiveScopedLayoutValue(f,"position")==="above"?" selected":""}>above</option>
                          <option value="inside"${this._getEffectiveScopedLayoutValue(f,"position")==="inside"?" selected":""}>inside</option>
                          <option value="hero"${this._getEffectiveScopedLayoutValue(f,"position")==="hero"?" selected":""}>hero</option>
                          <option value="off"${this._getEffectiveScopedLayoutValue(f,"position")==="off"?" selected":""}>off</option>
                        </select>
                      </div>
                      ${(this._getEffectiveScopedLayoutValue(f,"position")||"")==="hero"?`
                      <div class="field-row">
                        <label for="entity-${u}-label-hero-size">Hero size</label>
                        <select id="entity-${u}-label-hero-size" data-kind="entity-layout-label-hero-size" data-index="${u}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(f,"hero_size")||"medium")}">
                          <option value="small"${(this._getEffectiveScopedLayoutValue(f,"hero_size")||"medium")==="small"?" selected":""}>small</option>
                          <option value="medium"${(this._getEffectiveScopedLayoutValue(f,"hero_size")||"medium")==="medium"?" selected":""}>medium</option>
                          <option value="large"${(this._getEffectiveScopedLayoutValue(f,"hero_size")||"medium")==="large"?" selected":""}>large</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${u}-hero-value-size">Maximum font size</label>
                        <input id="entity-${u}-hero-value-size" type="number" min="12" max="112" step="1" data-kind="entity-layout-hero-value-size" data-index="${u}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(f,"value_size"))}" placeholder="use Hero size preset">
                        <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
                      </div>
                      `:""}
	                      <div class="field-row">
	                        <label for="entity-${u}-label-width">Label width</label>
	                        <input id="entity-${u}-label-width" type="number" step="1" data-kind="entity-layout-label-width" data-index="${u}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(f,"width"))}" placeholder="inherit card default">
	                      </div>
	                          `}),g=this._renderOverrideGroup({index:u,group:"bar",title:"Bar Appearance",summary:this._getBarAppearanceSummary(f),content:at(this._createSectionContext(),f)}),y=this._renderOverrideGroup({index:u,group:"needle",title:"Needle",summary:this._getNeedleSummary(f),content:this._needleSection.render(f)}),w=this._renderOverrideGroup({index:u,group:"formatting",title:"Formatting",summary:this._getFormattingSummary(f),content:this._renderFormattingSection(f)}),E=this._renderOverrideGroup({index:u,group:"peak",title:"Peak",summary:this._getPeakSummary(f),content:this._extremaSection.render(f,"peak")}),V=this._renderOverrideGroup({index:u,group:"floor",title:"Floor",summary:this._getFloorSummary(f),content:this._extremaSection.render(f,"floor")}),M=this._renderOverrideGroup({index:u,group:"markers",title:"Reference markers",summary:this._getGenericMarkersSummary(f),content:this._renderGenericMarkersEditor(f)}),O=this._renderOverrideGroup({index:u,group:"segments",title:"Segments",summary:this._getSegmentsSummary(f),content:this._segmentsSection.render(f)}),A=this._renderOverrideGroup({index:u,group:"gradient-stops",title:"Gradient Stops",summary:this._getGradientStopsSummary(f),content:this._gradientStopsSection.render(f)}),z=this._renderOverrideGroup({index:u,group:"baseline",title:"Baseline",summary:this._getBaselineOverrideSummary(f),content:this._baselineSection.render(f)}),N=this._renderOverrideGroup({index:u,group:"target",title:"Target",summary:this._getTargetOverrideSummary(f),content:this._targetSection.render(f)});return`
                          ${$}
                          ${N}
                          ${E}
                          ${V}
                          ${M}
                          ${g}
                          ${z}
                          ${y}
	                          ${O}
	                          ${A}
	                          ${_}
	                          ${w}
	                        `})()}
	                    </div>
                  </div>
                `})}
                <button type="button" data-action="add-entity">Add entity</button>
              </div>
          </div>
	        </div>

${this._renderScaleSection({type:"card"})}

${wt({renderGroup:d=>this._renderCardGroup(d),target:{summary:this._getCardTargetMarkerSummary(),content:this._targetSection.render({type:"card"})},peak:{summary:this._getMarkerResetSummary("peak"),content:this._extremaSection.render({type:"card"},"peak")},floor:{summary:this._getMarkerResetSummary("floor"),content:this._extremaSection.render({type:"card"},"floor")},references:{summary:this._getGenericMarkersSummary({type:"card"}),content:this._renderGenericMarkersEditor({type:"card"})}})}

${at(this._createSectionContext(),{type:"card"},()=>`${this._baselineSection.render({type:"card"},d=>this._renderCardGroup(d))}${this._needleSection.render({type:"card"})}`)}

${this._segmentsSection.render({type:"card"},d=>this._renderCardGroup(d))}

${this._gradientStopsSection.render({type:"card"},d=>this._renderCardGroup(d))}

	        <div class="section">
	          <div class="section-head">
	            <h3>Layout</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="layout-height">Row height</label>
              <input id="layout-height" type="number" min="24" step="1" data-field="layout-height" value="${this._escapeAttribute(s)}">
            </div>
            <div class="field-row">
              <label for="layout-label-position">Label position</label>
              <select id="layout-label-position" data-field="layout-label-position" value="${this._escapeAttribute(n)}">
                <option value="left"${n==="left"?" selected":""}>left</option>
                <option value="above"${n==="above"?" selected":""}>above</option>
                <option value="inside"${n==="inside"?" selected":""}>inside</option>
                <option value="hero"${n==="hero"?" selected":""}>hero</option>
                <option value="off"${n==="off"?" selected":""}>off</option>
              </select>
            </div>
            ${n==="hero"?`
            <div class="field-row">
              <label for="layout-label-hero-size">Hero size</label>
              <select id="layout-label-hero-size" data-field="layout-label-hero-size" value="${this._escapeAttribute(a)}">
                <option value="small"${a==="small"?" selected":""}>small</option>
                <option value="medium"${a==="medium"?" selected":""}>medium</option>
                <option value="large"${a==="large"?" selected":""}>large</option>
              </select>
            </div>
            <div class="field-row">
              <label for="layout-hero-value-size">Maximum font size</label>
              <input id="layout-hero-value-size" type="number" min="12" max="112" step="1" data-field="layout-hero-value-size" value="${this._escapeAttribute(l)}" placeholder="use Hero size preset">
              <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
            </div>
            `:""}
            <div class="field-row">
              <label for="layout-label-width">Label width</label>
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(c)}">
            </div>
          </div>
	        </div>

${this._renderFormattingSection({type:"card"})}
      </div>
    `,this._bindShadowListeners(),this._syncEntityPickers(),this._syncEntityIconPickers(),this._numericDrafts.apply(this.shadowRoot,e),this._lastRenderedConfigJson=this._serializeConfig(this._draftConfig),this._applyPendingFocus()}finally{this._isRendering=!1}}_bindShadowListeners(){!this.shadowRoot||this._shadowListenersAttached||(this.shadowRoot.addEventListener("click",this._boundHandleClick),this.shadowRoot.addEventListener("change",this._boundHandleChange),this.shadowRoot.addEventListener("input",this._boundHandleInput),this.shadowRoot.addEventListener("value-changed",this._boundHandleValueChanged),this.shadowRoot.addEventListener("keydown",this._boundHandleKeydown),this._shadowListenersAttached=!0)}_syncEntityPickers(){if(!this.shadowRoot)return;let e=this._getEntitiesValue(),t=r=>{var l,s,c,d;let i=r.dataset.kind,n=r.dataset.index,a=Number(n);if(r.hass=this._hass,r.allowCustomEntity=!0,i==="entity-picker"){let u=e[a];r.value=(l=u==null?void 0:u.entity)!=null?l:"",r.label=`Entity ${a+1}`;return}if(i==="scale-min-entity-source"){r.value=this._getScaleEntityValue("min"),r.label="Min entity";return}if(i==="scale-max-entity-source"){r.value=this._getScaleEntityValue("max"),r.label="Max entity";return}if(i==="baseline-entity-source"){r.value=this._getBaselineResolvableValue({type:"card"}).entity,r.label="Baseline entity";return}if(i==="target-entity-source"){r.value=this._getTargetResolvableValue({type:"card"}).entity,r.label="Target entity";return}if(i==="entity-override-min-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:a},"min").entity,r.label=`Entity ${a+1} min entity`;return}if(i==="entity-override-max-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:a},"max").entity,r.label=`Entity ${a+1} max entity`;return}if(i==="entity-baseline-entity-source"){r.value=this._getEffectiveBaselineResolvableValue({type:"entity",index:a}).entity,r.label=`Entity ${a+1} baseline entity`;return}if(i==="entity-target-entity-source"){r.value=this._getEffectiveTargetResolvableValue({type:"entity",index:a}).entity,r.label=`Entity ${a+1} target entity`;return}if(i==="generic-marker-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(s=this._getGenericMarkerSource(h).entity)!=null?s:"",r.label="Reference marker entity"}if(i==="generic-marker-label-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(d=(c=h==null?void 0:h.label)==null?void 0:c.entity)!=null?d:"",r.label="Label content entity"}};['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{this.shadowRoot.querySelectorAll(r).forEach(t)}),customElements.whenDefined&&customElements.whenDefined("ha-entity-picker").then(()=>{['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{var i;(i=this.shadowRoot)==null||i.querySelectorAll(r).forEach(t)})}).catch(()=>{})}_syncEntityIconPickers(){if(!this.shadowRoot)return;let e=this._getEntitiesValue();this.shadowRoot.querySelectorAll('ha-icon-picker[data-kind="entity-icon-picker"]').forEach(t=>{let r=Number(t.dataset.index),i=e[r],n=this._getEntityIconMode(i,r);t.value=n==="custom"&&typeof(i==null?void 0:i.icon)=="string"?i.icon:"",t.disabled=n!=="custom",!t._sbcpIconChangeHandler&&typeof t.addEventListener=="function"&&(t._sbcpIconChangeHandler=a=>{var s;let l=(s=a.detail)==null?void 0:s.value;this._entityIconCustomPending.delete(r),this._setEntityIcon(r,typeof l=="string"&&l.trim()?l.trim():void 0)},t.addEventListener("value-changed",t._sbcpIconChangeHandler))})}_handleClick(e){var i,n,a,l,s,c;if(this._segmentsSection.handle(e,"click")||this._gradientStopsSection.handle(e,"click"))return;let t=(a=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,"[data-action]"))!=null?a:e.target,r=(l=t==null?void 0:t.dataset)==null?void 0:l.action;if(r&&!(t!=null&&t.disabled)){if(["move-entity-up","move-entity-down","duplicate-entity","remove-entity"].includes(r)&&this._entityIconCustomPending.clear(),["move-entity-up","move-entity-down","duplicate-entity","remove-entity"].includes(r)&&this._numericDrafts.reset(),r==="add-entity"){let d=[...this._getEntitiesValue(),{entity:""}],u=this._buildEntityConfigEntries(d);if(this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${d.length-1}"], [data-kind="entity-input"][data-index="${d.length-1}"]`),Array.isArray(this._draftConfig.entities)||u.length>1||!this._draftConfig.entity){let h=this._setPathValue(this._draftConfig,["entities"],u);!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(h=this._deletePathValue(h,["entity"]),this._draftConfig.name!==void 0&&(h=this._deletePathValue(h,["name"])),this._draftConfig.icon!==void 0&&(h=this._deletePathValue(h,["icon"]))),this._applyUserConfig(h,{rerender:!0})}else this._setValueAtPath(["entity"],(c=(s=d[0])==null?void 0:s.entity)!=null?c:"",{rerender:!0});return}if(r==="move-entity-up"){this._moveEntityRow(Number(t.dataset.index),-1);return}if(r==="move-entity-down"){this._moveEntityRow(Number(t.dataset.index),1);return}if(r==="duplicate-entity"){let d=Number(t.dataset.index);this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${d+1}"], [data-kind="entity-picker"][data-index="${d+1}"], [data-kind="entity-input"][data-index="${d+1}"]`),this._duplicateEntityRow(d);return}if(r==="toggle-entity-overrides"){this._toggleEntityOverrideExpanded(Number(t.dataset.index));return}if(r==="toggle-override-group"){this._toggleOverrideGroupExpanded(Number(t.dataset.index),t.dataset.group);return}if(r==="toggle-card-group"){this._toggleCardGroupExpanded(t.dataset.group);return}if(r==="remove-entity"){this._removeEntityRow(Number(t.dataset.index));return}this._baselineSection.handleClick(t)||this._referenceMarkersSection.handleClick(t)}}_handleChange(e){var r,i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"change")||this._gradientStopsSection.handle(e,"change"))return;let t=(i=(r=e.target)==null?void 0:r.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleInput(e){var i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"input")||this._gradientStopsSection.handle(e,"input"))return;let t=e.target;if(!t||t.tagName==="HA-ENTITY-PICKER"||t.tagName==="INPUT"&&["checkbox","radio"].includes(t.type))return;let r=(i=t.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleValueChanged(e){var t;((t=e.target)==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&this._handleFieldEvent(e)}_handleKeydown(e){this._segmentsSection.handle(e,"keydown")||this._gradientStopsSection.handle(e,"keydown")}_handleFieldEvent(e){var c,d,u,h,f,m,x,k,v,$,_;if(this._segmentsSection.handle(e,"field")||this._gradientStopsSection.handle(e,"field"))return;let t=e.target,r=(c=t==null?void 0:t.dataset)==null?void 0:c.field,i=(d=t==null?void 0:t.dataset)==null?void 0:d.kind,n=r!=null&&r.endsWith("-text-fallback")?r.slice(0,-14):r,a=i!=null&&i.endsWith("-text-fallback")?i.slice(0,-14):i,l=(u=e.detail)==null?void 0:u.value,s=l!=null?l:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if(!this._referenceMarkersSection.handleField({target:t,kind:a,value:s})){if(n==="title")return void this._setTitle(s);if(!it(this._createSectionContext(),{field:n,value:s})){if(n==="layout-label-position")return void this._setLayoutLabelPosition(s);if(n==="layout-label-hero-size")return void this._setLayoutHeroSize(s);if(n==="layout-hero-value-size")return void this._setLayoutHeroValueSize(s);if(n==="layout-height")return void this._setLayoutHeight(s);if(n==="layout-label-width")return void this._setScopedLayoutLabelWidth({type:"card"},s);if(!Se(this._createSectionContext(),{field:n,value:s})&&!ve(this._createSectionContext(),{field:n,value:s})&&!(this._needleSection.handleField({field:n,kind:a,index:(h=t.dataset)==null?void 0:h.index,value:s})||this._baselineSection.handleField({field:n,kind:a,index:(f=t.dataset)==null?void 0:f.index,value:s})||this._targetSection.handleField({field:n,kind:a,index:(m=t.dataset)==null?void 0:m.index,value:s})||this._extremaSection.handleField({field:n,kind:a,index:(x=t.dataset)==null?void 0:x.index,value:s}))){if(a==="entity-picker"||a==="entity-input"){let g=Number(t.dataset.index),y=this._getEntitiesValue().map((E,V)=>V===g?{...E,entity:this._normalizeTextValue(s)}:E),w=this._buildEntityConfigEntries(y);Array.isArray(this._draftConfig.entities)||w.length>1||!this._draftConfig.entity?this._setValueAtPath(["entities"],w):this._setValueAtPath(["entity"],(v=(k=y[0])==null?void 0:k.entity)!=null?v:"");return}if(a==="entity-name")return void this._setEntityField(Number(t.dataset.index),"name",s);if(a==="entity-icon-mode"){let g=Number(t.dataset.index);if(s==="default")this._entityIconCustomPending.delete(g),this._setEntityIcon(g,void 0)||this._render();else if(s==="off")this._entityIconCustomPending.delete(g),this._setEntityIcon(g,!1);else if(s==="custom"){let y=this._getEntitiesValue()[g];if(typeof(y==null?void 0:y.icon)=="string"&&y.icon.trim())this._entityIconCustomPending.delete(g);else{this._entityIconCustomPending.add(g);let w=this._getEntityRawEntries()[g];w&&Object.prototype.hasOwnProperty.call(w,"icon")?this._setEntityIcon(g,void 0)||this._render():this._render()}}return}if(a==="entity-icon-value"){let g=typeof s=="string"?s.trim():"";return this._entityIconCustomPending.delete(Number(t.dataset.index)),void this._setEntityIcon(Number(t.dataset.index),g||void 0)}if(!Se(this._createSectionContext(),{kind:a!=null&&a.startsWith("scale-")?a:void 0,value:s})&&!Se(this._createSectionContext(),{kind:a,index:($=t==null?void 0:t.dataset)==null?void 0:$.index,value:s})){if(a==="entity-override-height")return void this._setScopedLayoutHeight({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-inherit")return s?void this._clearLayoutOverride({type:"entity",index:Number(t.dataset.index)}):void 0;if(a==="entity-layout-label-position")return void this._setScopedLayoutLabelPosition({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-label-hero-size")return void this._setScopedLayoutHeroSize({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-hero-value-size")return void this._setScopedLayoutHeroValueSize({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-label-width")return void this._setScopedLayoutLabelWidth({type:"entity",index:Number(t.dataset.index)},s);it(this._createSectionContext(),{kind:a,index:(_=t==null?void 0:t.dataset)==null?void 0:_.index,value:s})||a==="entity-bar-inherit"&&ve(this._createSectionContext(),{kind:a,index:t.dataset.index,value:s})||ve(this._createSectionContext(),{kind:a,index:t.dataset.index,value:s})}}}}}};function Oe(o,e){var r,i,n,a,l;let t=(r=o.scale)==null?void 0:r[e];if(t!==void 0){let s=ee(t);return{fixed:(i=s.fixed)!=null?i:"",entity:(n=s.entity)!=null?n:""}}return{fixed:(a=o[e])!=null?a:"",entity:(l=o[`${e}_entity`])!=null?l:""}}function Ge(o,e,t,r,i,n,a=!1){let l=(s,c)=>n?p(s,c):P(s,c,i);if(b(t)){if(r==="fixed"&&n)return p(p(o,[...e,"fixed"]),[...e,"value"]);let s=r==="fixed"&&t.fixed===void 0&&t.value!==void 0?"value":r;return l(o,[...e,s])}if(t!=null){let s=a?re(t):null,c=ne(t)?"entity":Number.isFinite(s)?"percent":"fixed";return r===c?l(o,e):n?o:P(o,e,{[c]:c==="percent"?s:t,[r]:i})}return n?o:P(o,[...e,r],i)}function Or(o,e,t,r){var l;let i=t==="fixed"?K(r):D(r).trim(),n=t==="fixed"?i===null:!i,a=(l=o.scale)==null?void 0:l[e];if(a===void 0&&(o[e]!==void 0||o[`${e}_entity`]!==void 0)){let s=[t==="fixed"?e:`${e}_entity`];return n?p(o,s):P(o,s,i)}return Ge(o,["scale",e],a,t,i,n)}function Re(o){var r,i;let e=o.baseline;if(!b(e))return{fixed:e!=null?e:"",entity:""};let t=ee(e.at,null,null,{allowPercent:!0});return{fixed:(r=t.fixed)!=null?r:"",entity:(i=t.entity)!=null?i:"",...Number.isFinite(t.percent)?{percent:t.percent}:{}}}function Gr(o,e,t){var a;if(e==="mode")return zr(o,"baseline",t);if(e==="percent")return Ar(o,"baseline",t);let r=e==="fixed"?K(t):D(t).trim(),i=e==="fixed"?r===null:!r,n=o.baseline;if(!b(n)&&n!==void 0&&n!==null){if(e==="fixed")return i?p(o,["baseline"]):P(o,["baseline"],r);if(i)return o;o=P(o,["baseline"],{at:n})}return Ge(o,["baseline","at"],(a=o.baseline)==null?void 0:a.at,e,r,i,!0)}function ze(o){var t,r,i;let e=o.target;if(b(e)&&e.at!==void 0){let n=ee(e.at,null,null,{allowPercent:!0});return{fixed:(t=n.fixed)!=null?t:"",entity:(r=n.entity)!=null?r:"",...Number.isFinite(n.percent)?{percent:n.percent}:{}}}return{fixed:b(e)?"":e!=null?e:"",entity:(i=o.target_entity)!=null?i:""}}function Gt(o){if(b(o.target))return o;let e=o.target,t=o.target_entity,r=t!==void 0?{...e!=null?{fixed:e}:{},entity:t}:e;return P(o,["target"],r==null?{}:{at:r})}function Rr(o,e,t){if(e==="mode")return zr(o,"target",t);if(e==="percent")return Ar(o,"target",t);let r=e==="fixed"?K(t):D(t).trim(),i=e==="fixed"?r===null:!r,n=o.target;if((!b(n)||n.at===void 0)&&(n!==void 0&&!b(n)||o.target_entity!==void 0))return e==="entity"?i?p(o,["target_entity"]):P(o,["target_entity"],r):b(n)?i?o:P(o,["target","at"],{entity:o.target_entity,fixed:r}):i?p(o,["target"]):P(o,["target"],r);let a=Ge(o,["target","at"],n==null?void 0:n.at,e,r,i,!0);return e==="entity"&&(a=p(a,["target_entity"])),a}function zr(o,e,t){var s;if(!["fixed","entity","entity-fallback","percent"].includes(t))return o;let i=(e==="target"?ze:Re)(o),n=(s=o[e])==null?void 0:s.at,a=e==="target"?Gt(o):b(o.baseline)?o:P(o,["baseline"],{at:o.baseline}),l=b(n)?{...n}:{};for(let c of["fixed","value","entity","percent"])delete l[c];if(t==="percent"){let c=Number.isFinite(i.percent)?i.percent:50;l=b(n)?{...l,percent:c}:`${c}%`}else t!=="entity"&&(l.fixed=i.fixed!==""&&i.fixed!==void 0?i.fixed:50),t!=="fixed"&&(l.entity=i.entity||""),!b(n)&&t==="fixed"&&(l=l.fixed),!b(n)&&t==="entity"&&l.entity&&(l=l.entity);return a=P(a,[e,"at"],l),e==="target"?p(a,["target_entity"]):a}function Ar(o,e,t){var s,c;let r=t===null,i=be(t);if(!r&&i===null)return o;let n=(s=o[e])==null?void 0:s.at,a=[e,"at"];if(b(n))return r?p(o,[...a,"percent"]):P(o,[...a,"percent"],i);if(Number.isFinite(re(n)))return r?p(o,a):P(o,a,`${i}%`);if(r)return o;let l=e==="target"?Gt(o):b(o.baseline)?o:P(o,["baseline"],{at:o.baseline});return Ge(l,a,(c=l[e])==null?void 0:c.at,"percent",i,!1,!0)}function er(o,e){var r;let t=[["bar",e],[e],...e==="segments"?[["severity"]]:[]];return(r=t.find(i=>R(o,i)!==void 0))!=null?r:t[0]}function Br(o){var e;return b(o)?Number.isFinite(o.percent)?`${o.percent}%`:(e=o.fixed)!=null?e:o.value:o}function tr(o,e){let t,r=()=>{let i=o.read({type:"card"},[]),n=R(i,er(i,e));return n!==void 0?Array.isArray(n)?n:[]:e==="segments"?t._getFallbackSegments({type:"card"}):t._getDefaultGradientStops()};return{patchOnly:!0,autoEnds:e==="segments",cssText:e==="segments",segmentSpace:()=>{var a,l;let i=o.read({type:"card"},[]),n=er(i,e);return n[0]==="severity"?"percent":n[0]==="bar"&&(l=(a=i.bar)==null?void 0:a.segment_space)!=null?l:null},rows(i,n){return t=n,r().map(a=>{var l;return e==="segments"?{...a,from:Br(a==null?void 0:a.from),to:Br(a==null?void 0:a.to)}:{...a,pos:(l=n._normalizeGradientStopPosValue(a==null?void 0:a.pos))!=null?l:a==null?void 0:a.pos}})},write(i,n,a,l){if(!l)throw new Error("Feature palette writes require an explicit item operation");let s=o.mutate(i,c=>{let d=er(c,e),u=[...r()];if(l.type==="edit"){if(l.index<0||l.index>=u.length)return c;let h={...u[l.index],[l.field]:l.value};l.value===void 0&&delete h[l.field],u[l.index]=h}else if(l.type==="add")u.push(F(l.item));else if(l.type==="remove")u.splice(l.index,1);else throw new Error("Unsupported palette operation");return P(c,d,u)});return s!==!1&&l.type!=="edit"&&(e==="segments"?t._clearSegmentScopeTextState(i):t._clearGradientStopScopeTextState(i)),s}}}function rr(o){let e=o==null?void 0:o.at;return typeof e=="number"?De({at:{fixed:e}}):b(e)&&e.fixed===void 0&&e.value!==void 0?De({at:{...e,fixed:e.value}}):De(o)}function Nr(o,e,t,r){var c;if(!Array.isArray(o.markers)||!o.markers[e])return o;let i=["markers",e,"at"],n=(c=o.markers[e])==null?void 0:c.at,a=t==="entity"?D(r).trim():K(r),l=t==="entity"?!a:a===null;if(t==="percent")return P(o,i,l?null:`${a}%`);let s=Ge(o.markers[e],["at"],n,t,a,l);return P(o,["markers",e],s)}function Ir(o,e){var l;let t=Array.isArray(o.markers)?[...o.markers]:[],{type:r,index:i,path:n,value:a}=e;if(r==="add")t.push({at:{fixed:50}});else{if(i<0||i>=t.length||!Number.isInteger(i))return o;if(r==="remove")t.splice(i,1);else if(r==="move"){let s=i+e.delta;if(s<0||s>=t.length)return o;[t[i],t[s]]=[t[s],t[i]]}else if(r==="field"){let s=a===void 0?p(t[i],n):P(t[i],n,a);n[0]==="label"&&n[1]==="precision"&&(s=p(s,["label","decimal"])),t[i]=n[0]==="label"?C(s,["label"]):s}else if(r==="mode"){let s;if(a==="percent")s="50%";else{let c=rr(t[i]);s=b((l=t[i])==null?void 0:l.at)?F(t[i].at):{...c.entity?{entity:c.entity}:{},...c.fixed!==""&&c.fixed!==void 0?{fixed:c.fixed}:{}},delete s.percent,a==="fixed"?(delete s.entity,s.fixed===void 0&&s.value===void 0&&(s.fixed=50)):(s.entity||(s.entity=""),a==="entity"&&(delete s.fixed,delete s.value),a==="entity-fallback"&&s.fixed===void 0&&s.value===void 0&&(s.fixed=50))}t[i]=P(t[i],["at"],s)}}return P(o,["markers"],t)}function jr(o,{key:e,path:t,value:r,field:i}){if(t[0]==="reset"&&r&&!st(r))return o;(i==="text"&&!r||r===null||t[0]==="reset"&&!r)&&(r=void 0);let n=r===void 0?p(o,[e,...t]):P(o,[e,...t],r);return i==="precision"&&(n=p(n,[e,"label","decimal"])),e==="peak"&&t[0]==="enabled"&&(n=p(n,["show_peak"]),b(o.peak_marker)&&(n=P(n,["peak_marker","show"],r))),e==="peak"&&t[0]==="color"&&(n=p(n,["peak_color"]),n=p(n,["peak_marker","color"]),n=C(n,["peak_marker"])),C(n,[e,...t.slice(0,-1)])}function Lr(o,{path:e,value:t,deprecatedKeys:r=[],field:i}){(i==="text"&&!t||t===null)&&(t=void 0);let n=t===void 0?o:Gt(o);return n=t===void 0?p(n,["target",...e]):P(n,["target",...e],t),n=te(n,r),i==="show"&&(n=p(n,["show_target_label"])),i==="precision"&&(n=p(n,["target","label","decimal"])),C(n,["target",...e.slice(0,-1)])}function Ur(o,{field:e,value:t}){var l;let r=["bar","needle"],i=(l=o.bar)==null?void 0:l.needle;if(e==="mode"){let s=t==="enabled";return i===void 0&&!s?o:P(o,b(i)?[...r,"show"]:r,s)}if(!t||G(t)===G("#ffffff"))return C(p(o,[...r,"color"]),r);let a=b(i)?i:typeof i=="boolean"?{show:i}:{};return P(o,r,{...a,color:t})}function Kr(o,{path:e,value:t}){let r=o.baseline;if(!b(r)&&r!==void 0&&r!==null){if(t===void 0)return o;o=P(o,["baseline"],{at:r})}let i=["baseline",...e],n=t===void 0?p(o,i):P(o,i,t);return t===void 0&&(e.length>1&&(n=C(n,["baseline",e[0]])),n=C(n,["baseline"])),n}var T={type:"card"},ir=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._context={},this._chooseEntity=!1,this._renderEpoch=0,this._updateComplete=Promise.resolve(),this._cssColorDrafts=new Map,this._numericDrafts=new ye,this._expandedCardGroups=new Set;let e=this._createSectionContext(),t={cssText:!0,percentSources:!0};this._needleSection=new ke(e,t),this._baselineSection=new Ee(e,t),this._targetSection=new Fe(e,t),this._extremaSection=new Me(e,t);let r={root:()=>this.shadowRoot,render:()=>{this._paletteRenderRequested=!0,this._requestRender()},focus:n=>{this._pendingPaletteFocus=n},hass:()=>this._hass};this._referenceMarkersSection=new Ce(e,{root:r.root,render:()=>this._requestRender()},t),this._segmentsSection=new we(e,r,tr(e,"segments")),this._gradientStopsSection=new $e(e,r,tr(e,"gradient_stops"));for(let n of["click","keydown"])this.shadowRoot.addEventListener(n,a=>{var l,s,c,d,u;if(n==="click"){let h=(c=(s=(l=a.target)==null?void 0:l.closest)==null?void 0:s.call(l,"[data-action]"))!=null?c:a.target;if(((d=h==null?void 0:h.dataset)==null?void 0:d.action)==="toggle-card-group"){this._toggleCardGroup(h.dataset.group);return}if(this._baselineSection.handleClick(h)||this._targetSection.handleClick(h)){this._requestRender();return}if(this._referenceMarkersSection.handleClick(h)){if(((u=h==null?void 0:h.dataset)==null?void 0:u.action)==="add-generic-marker"){let f=this._referenceMarkersSection._getGenericMarkers(T);this._pendingReferenceFocusId=this._referenceMarkersSection._getGenericMarkerUiIds(T,f.length).at(-1)}this._requestRender();return}}this._segmentsSection.handle(a)||this._gradientStopsSection.handle(a)});let i=n=>this._handleField(n);for(let n of["input","change","value-changed"])this.shadowRoot.addEventListener(n,i);this.shadowRoot.addEventListener("focusout",n=>{var a,l;(l=(a=n.target)==null?void 0:a.matches)!=null&&l.call(a,"input, select, ha-entity-picker")&&this._requestRender()}),customElements.whenDefined("ha-entity-picker").then(()=>{this.isConnected&&this._requestRender()})}setConfig(e){if(!b(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");J(e)!==J(this._config)&&(this._paletteRenderRequested||(this._paletteRenderRequested=["bar.segments","bar.gradient_stops","segments","severity","gradient_stops"].some(t=>J(R(e,t.split(".")))!==J(R(this._config,t.split("."))))),this._config=F(e),this._cssColorDrafts.clear(),this._numericDrafts.reset(),this._baselineSection.reset(),this._targetSection.reset(),this._referenceMarkersSection.reset(),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._chooseEntity=!1,this._configReplaced=!0),this._requestRender()}set hass(e){this._hass=e,this._requestRender()}get hass(){return this._hass}set context(e){this._context=e!=null?e:{},this._requestRender()}get context(){return this._context}get updateComplete(){return this._updateComplete}get _explicitEntity(){return typeof this._config.entity=="string"?this._config.entity.trim():""}get _effectiveEntity(){return this._explicitEntity||this._context.entity_id||""}get _showEntityPicker(){return!!this._explicitEntity||this._chooseEntity||!this._context.entity_id}connectedCallback(){this._requestRender()}disconnectedCallback(){this._renderEpoch+=1,this._renderScheduled=!1}_requestRender(){if(this._renderScheduled)return;this._renderScheduled=!0;let e=this._renderEpoch;this._updateComplete=Promise.resolve().then(()=>{e===this._renderEpoch&&(this._renderScheduled=!1,this._render())})}_createSectionContext(){return{read:(e,t)=>R(this._config,t),mutate:(e,t,r)=>this._mutate(i=>{var n,a,l,s;return r!=null&&r.referenceMarkerEdit?Ir(i,r.referenceMarkerEdit):r!=null&&r.needleEdit?Ur(i,r.needleEdit):r!=null&&r.baselineEdit?Kr(i,r.baselineEdit):r!=null&&r.targetEdit||((n=r==null?void 0:r.markerEdit)==null?void 0:n.key)==="target"?Lr(i,(a=r.targetEdit)!=null?a:r.markerEdit):r!=null&&r.extremumEdit||["peak","floor"].includes((l=r==null?void 0:r.markerEdit)==null?void 0:l.key)?jr(i,(s=r.extremumEdit)!=null?s:r.markerEdit):t(i)}),source:(e,t)=>(t==null?void 0:t.type)==="reference-marker"?rr(t.marker):t==="baseline"?Re(this._config):t==="target"?ze(this._config):Oe(this._config,t),setSource:(e,t,r,i)=>this._mutate(n=>(t==null?void 0:t.type)==="reference-marker"?Nr(n,t.index,r,i):t==="baseline"?Gr(n,r,i):t==="target"?Rr(n,r,i):Or(n,t,r,i))}}_mutate(e){var r,i,n,a,l,s,c,d;let t=e(this._config);if(J(t)===J(this._config))return!1;if(((i=(r=t.bar)==null?void 0:r.segments)==null?void 0:i.length)!==((a=(n=this._config.bar)==null?void 0:n.segments)==null?void 0:a.length)||((l=t.segments)==null?void 0:l.length)!==((s=this._config.segments)==null?void 0:s.length)||((c=t.severity)==null?void 0:c.length)!==((d=this._config.severity)==null?void 0:d.length))for(let u of this._cssColorDrafts.keys())u.startsWith("segment-")&&this._cssColorDrafts.delete(u);return this._config=t,this._requestRender(),this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:F(t)}})),!0}_handleField(e){var l,s,c,d,u,h,f,m,x,k;let t=e.target;if(this._configReplaced||(t==null?void 0:t.isConnected)===!1||(t==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&e.type!=="value-changed"||this._numericDrafts.handle(e,this._isRendering))return;let r=(s=(l=t==null?void 0:t.dataset)==null?void 0:l.field)==null?void 0:s.replace(/-text-fallback$/,""),i=(d=(c=t==null?void 0:t.dataset)==null?void 0:c.kind)==null?void 0:d.replace(/-text-fallback$/,""),n=e.type==="value-changed"?(u=e.detail)==null?void 0:u.value:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if((t==null?void 0:t.type)==="color"&&this._cssColorDrafts.delete(`${t.id}-text-fallback`),((h=t==null?void 0:t.dataset)==null?void 0:h.cssColor)==="true"){let v=!n.trim()||CSS.supports("color",n);if((f=t.setCustomValidity)==null||f.call(t,v?"":"Enter a valid CSS color."),t.setAttribute("aria-invalid",v?"false":"true"),v?this._cssColorDrafts.delete(t.id):this._cssColorDrafts.set(t.id,n),!v&&i!=="segment-draft-color")return}if(r==="feature-entity-override"){this._chooseEntity=!!n,n||this._mutate(v=>p(v,["entity"])),this._requestRender();return}if(i==="feature-entity-source"){let v=typeof n=="string"?n.trim():"";this._chooseEntity=!1,this._mutate($=>v?P($,["entity"],v):p($,["entity"])),this._requestRender();return}if(i!=null&&i.startsWith("generic-marker-")){let v=(k=(x=(m=t.closest)==null?void 0:m.call(t,".generic-marker-item"))==null?void 0:x.dataset)==null?void 0:k.markerUiId,$=this._referenceMarkersSection._getGenericMarkerUiIds(T,this._referenceMarkersSection._getGenericMarkers(T).length);if(v&&v!==$[Number(t.dataset.markerIndex)])return}if(this._referenceMarkersSection.handleField({target:t,kind:i,value:n}))return;if(this._segmentsSection.handle(e)||this._gradientStopsSection.handle(e)){this._requestRender();return}if(this._needleSection.handleField({field:r,kind:i,value:n})||this._baselineSection.handleField({field:r,kind:i,value:n})||this._targetSection.handleField({field:r,kind:i,value:n})||this._extremaSection.handleField({field:r,kind:i,value:n}))return;let a=this._createSectionContext();Se(a,{field:r,kind:i,value:n})||it(a,{field:r,kind:i,value:n})||ve(a,{field:r,kind:i,value:n},{animation:!0,cssText:!0})}_entityDescription(){return this._explicitEntity?`Using explicit entity: ${this._explicitEntity}`:this._context.entity_id?`Using parent card entity: ${this._context.entity_id}`:"An entity is required. Select an entity below."}_renderEntitySection(){return`<div class="section">
      <div class="section-head"><h3>Entities</h3></div>
      <div id="feature-entity-status" class="section-note" role="status">${S(this._entityDescription())}</div>
      ${this._context.entity_id||this._explicitEntity?`<div class="toggle">
        <input id="feature-entity-override" type="checkbox" data-field="feature-entity-override"${this._explicitEntity||this._chooseEntity?" checked":""}>
        <label for="feature-entity-override">Use explicit entity</label>
      </div>`:""}
      ${this._showEntityPicker?`<div class="field-row">
        <label for="feature-entity">Entity override</label>
        ${W("feature-entity-source","feature",this._explicitEntity)}
      </div>`:""}
    </div>`}_renderCardGroup(e){return xt(e,this._expandedCardGroups.has(e.group))}_toggleCardGroup(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._syncDisclosures()}_syncDisclosures(){var t;let e={"marker-target":this._targetSection._getCardTargetMarkerSummary(),"marker-peak":this._extremaSection._getMarkerResetSummary("peak"),"marker-floor":this._extremaSection._getMarkerResetSummary("floor"),"generic-markers":this._referenceMarkersSection._getGenericMarkersSummary(T),baseline:this._baselineSection._getCardBaselineSummary(),segments:this._segmentsSection._getSegmentsSummary(T),"gradient-stops":this._gradientStopsSection._getGradientStopsSummary(T)};for(let[r,i]of Object.entries(e)){let n=this.shadowRoot.querySelector(`#card-group-${r}`),a=(t=n==null?void 0:n.closest)==null?void 0:t.call(n,".override-group"),l=this._expandedCardGroups.has(r);n==null||n.setAttribute("aria-expanded",String(l)),a==null||a.setAttribute("data-expanded",String(l));let s=this.shadowRoot.querySelector(`#card-group-${r}-title`);s!=null&&s.textContent&&(s.textContent=`${l?"\u25BE":"\u25B8"} ${s.textContent.slice(2)}`);let c=this.shadowRoot.querySelector(`#card-group-${r}-summary`);c&&(c.textContent=i);let d=a==null?void 0:a.querySelector(".override-group-body");d&&(d.style.display=l?"grid":"none")}for(let r of this.shadowRoot.querySelectorAll(".generic-marker-item")){let i=this._referenceMarkersSection._expandedGenericMarkerUiIds.has(r.dataset.markerUiId);r.setAttribute("data-expanded",String(i)),r.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),r.querySelector(".generic-marker-body").style.display=i?"grid":"none"}}_captureFocus(){var a,l,s,c,d;let e=this.shadowRoot.activeElement;if(!e)return null;let t=(s=(l=(a=e.closest)==null?void 0:a.call(e,".generic-marker-item"))==null?void 0:l.dataset)==null?void 0:s.markerUiId,r=e.id?`#${e.id}`:e.dataset.field?`[data-field="${e.dataset.field}"]`:e.dataset.kind?`[data-kind="${e.dataset.kind}"]`:t&&e.dataset.action?`.generic-marker-item[data-marker-ui-id="${t}"] [data-action="${e.dataset.action}"]`:e.dataset.action?`[data-action="${e.dataset.action}"]`:null,i=(d=(c=e.dataset.segmentIndex)!=null?c:e.dataset.stopIndex)!=null?d:e.dataset.index,n=r&&e.dataset.kind&&i!==void 0?`${r}[data-${e.dataset.segmentIndex!==void 0?"segment-index":e.dataset.stopIndex!==void 0?"stop-index":"index"}="${i}"]`:r;return n?{selector:n,start:e.selectionStart,end:e.selectionEnd}:null}_render(){var h,f,m,x,k,v,$,_,g,y;let e=X(this._createSectionContext(),T),t=this._segmentsSection._getScopedSegmentsValue(T),r=this._gradientStopsSection._getScopedGradientStopsValue(T),i=this._referenceMarkersSection._getGenericMarkers(T),n=this._referenceMarkersSection._getGenericMarkerUiIds(T,i.length),a=JSON.stringify(i.map((w,E)=>[n[E],this._referenceMarkersSection._getGenericMarkerSource(w).mode])),l=JSON.stringify([!!(this._context.entity_id||this._explicitEntity),this._showEntityPicker,e,t.length,r.length,!fe(this._gradientStopsSection._getGradientStopsDraftState(T).color),...r.map(w=>!fe(w.color)),!!customElements.get("ha-entity-picker")]),s=(f=(h=this.shadowRoot.activeElement)==null?void 0:h.dataset)==null?void 0:f.field,c=(x=(m=this.shadowRoot.activeElement)==null?void 0:m.dataset)==null?void 0:x.kind,d=(c==null?void 0:c.endsWith("-text-fallback"))||(s==null?void 0:s.endsWith("-text-fallback"))||s==="feature-entity-override"&&!this._context.entity_id&&!this._explicitEntity||((v=(k=this.shadowRoot.activeElement)==null?void 0:k.validity)==null?void 0:v.badInput)&&this._numericDrafts.captureFocus(this.shadowRoot),u=!1;if(a!==this._referenceStructureSignature&&!d){this._isRendering=!0;try{u=!this._referenceMarkersSection.syncStructure(T)}finally{this._isRendering=!1}}if((l!==this._structureSignature||this._paletteRenderRequested||u)&&!d){let w=this._captureFocus(),E=this._createSectionContext();this._isRendering=!0;try{this.shadowRoot.innerHTML=`<style>${vt}
        :host { container-type: inline-size; }
        .list-row.gradient-stop-row .field-grid { grid-template-columns: minmax(0, 1fr); }
        .list-row.segment-row > .field-grid { grid-template-columns: minmax(0, 1fr); }
        @container (max-width: 320px) {
          .list-row.segment-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .list-row.gradient-stop-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .generic-marker-header { flex-wrap: wrap; }
          .generic-marker-toggle { flex-basis: 100%; }
          .generic-marker-actions { width: 100%; }
          .generic-marker-actions button { flex: 1 1 auto; }
          .generic-marker-pair, .generic-marker-options { grid-template-columns: minmax(0, 1fr); }
          .list-row.segment-row > button, .list-row.gradient-stop-row > button {
            grid-column: 1 / -1; width: 100%;
          }
        }
        .inline-row { grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); }
        .section-note { overflow-wrap: anywhere; }
        ha-entity-picker { display: block; min-width: 0; max-width: 100%; }
      </style><div class="editor">
        ${this._renderEntitySection()}
        ${Et(E,T)}
        ${wt({renderGroup:M=>this._renderCardGroup(M),target:{summary:this._targetSection._getCardTargetMarkerSummary(),content:this._targetSection.render(T)},peak:{summary:this._extremaSection._getMarkerResetSummary("peak"),content:this._extremaSection.render(T,"peak")},floor:{summary:this._extremaSection._getMarkerResetSummary("floor"),content:this._extremaSection.render(T,"floor")},references:{summary:this._referenceMarkersSection._getGenericMarkersSummary(T),content:this._referenceMarkersSection.render(T)}})}
        ${at(E,T,()=>`${this._baselineSection.render(T,M=>this._renderCardGroup(M))}${this._needleSection.render(T)}`,{animation:!0,cssText:!0})}
        ${this._segmentsSection.render(T,M=>this._renderCardGroup(M))}
        ${this._gradientStopsSection.render(T,M=>this._renderCardGroup(M))}
        ${Ft(E,T)}
      </div>`}finally{this._isRendering=!1}this._structureSignature=l,this._paletteRenderRequested=!1,this._syncControls();let V=w&&this.shadowRoot.querySelector(w.selector);($=V==null?void 0:V.focus)==null||$.call(V,{preventScroll:!0}),(V==null?void 0:V.type)==="text"&&w.start!=null&&((_=V.setSelectionRange)==null||_.call(V,w.start,w.end))}else this._syncControls();if(d||(this._referenceStructureSignature=a),this._pendingPaletteFocus&&((y=(g=this.shadowRoot.querySelector(this._pendingPaletteFocus))==null?void 0:g.focus)==null||y.call(g,{preventScroll:!0}),this._pendingPaletteFocus=null),this._pendingReferenceFocusId){let w=this.shadowRoot.querySelector(`.generic-marker-item[data-marker-ui-id="${this._pendingReferenceFocusId}"] .generic-marker-toggle`);w==null||w.focus({preventScroll:!0}),w==null||w.scrollIntoView({block:"nearest",inline:"nearest"}),this._pendingReferenceFocusId=null}this._configReplaced=!1}_syncControls(){var c,d,u,h,f,m,x,k,v,$;let e=this._createSectionContext(),t=nt(e,T),r={"scale-min":Oe(this._config,"min").fixed,"scale-max":Oe(this._config,"max").fixed,"bar-fill-style":X(e,T),"bar-color":Q(t,"#4a9eff"),"bar-color-text-fallback":t,"bar-needle-mode":this._needleSection._getScopedNeedleConfig(T).mode,"bar-needle-color":Q(this._needleSection._getScopedNeedleConfig(T).color,"#ffffff"),"bar-needle-color-text-fallback":this._needleSection._getScopedNeedleConfig(T).color,"baseline-mode":this._baselineSection._getBaselineMode(T),"baseline-value":Re(this._config).fixed,"baseline-source-mode":this._baselineSection._getSourceMode(),"baseline-percent":(d=(c=this._baselineSection._percentageDraft)!=null?c:Re(this._config).percent)!=null?d:"","baseline-above-color":Q(this._baselineSection._getBaselineDirectionalColorValue(T,"above"),"#000000"),"baseline-above-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(T,"above"),"baseline-below-color":Q(this._baselineSection._getBaselineDirectionalColorValue(T,"below"),"#000000"),"baseline-below-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(T,"below"),"target-mode":this._targetSection._getTargetMode(T),"target-value":ze(this._config).fixed,"target-source-mode":this._targetSection._getSourceMode(),"target-percent":(h=(u=this._targetSection._percentageDraft)!=null?u:ze(this._config).percent)!=null?h:"","target-shape":this._targetSection._getEffectiveTargetShapeValue(T),"target-direction":this._targetSection._getEffectiveMarkerDirection(T,"target"),"target-color":Q(this._targetSection._getTargetColorValue(T),"#888"),"target-color-text-fallback":this._targetSection._getTargetColorValue(T),"target-above-fill-color":Q(this._targetSection._getTargetAboveFillColorValue(T),"#000000"),"target-above-fill-color-text-fallback":this._targetSection._getTargetAboveFillColorValue(T),"target-label-text":this._targetSection._getBuiltinMarkerLabelOptions(T,"target").text,"target-label-precision":this._targetSection._getBuiltinMarkerLabelOptions(T,"target").precision,"formatting-unit":oe(e,T,"unit"),"formatting-decimal":oe(e,T,"decimal")};for(let _ of["peak","floor"]){let g=this._extremaSection._getMarkerConfig(T,_),y=this._extremaSection._getBuiltinMarkerLabelOptions(T,_);Object.assign(r,{[`${_}-color`]:Q(g.color,"#888888"),[`${_}-color-text-fallback`]:g.color,[`${_}-reset`]:this._extremaSection._getEffectiveMarkerExtras(T,_).reset,[`${_}-direction`]:this._extremaSection._getEffectiveMarkerDirection(T,_),[`${_}-label-text`]:y.text,[`${_}-label-precision`]:y.precision});for(let[w,E]of[["show",g.mode==="enabled"],["label-show",y.show],["label-show-value",y.showValue],["label-show-unit",y.showUnit]]){let V=this.shadowRoot.querySelector(`#${_}-${w}`);V&&(V.checked=E)}}for(let[_,g]of Object.entries(r)){let y=this.shadowRoot.querySelector(`[data-field="${_}"]`);y&&(y!==this.shadowRoot.activeElement||this._configReplaced)&&(y.value=String(g)),_==="bar-color-text-fallback"&&(y==null||y.setAttribute("aria-label","Bar color (CSS value)"))}for(let _ of[this._segmentsSection,this._gradientStopsSection]){let g=_===this._segmentsSection,y=g?_._getScopedSegmentsValue(T):_._getScopedGradientStopsValue(T);for(let w of g?["from","to","color","color-text-fallback"]:["pos","color"])for(let E of this.shadowRoot.querySelectorAll(`input[data-kind="${g?"segment":"gradient"}-${w}"]`)){let V=Number(E.dataset.index),M=y[V],O=g&&!w.startsWith("color")?_._getSegmentBoundaryText(T,V,w,M==null?void 0:M[w]):!g&&w==="pos"?_._getGradientStopPosText(T,V,(f=M==null?void 0:M.pos)!=null?f:""):M==null?void 0:M.color;(E!==this.shadowRoot.activeElement||this._configReplaced)&&(E.value=g&&E.type==="color"?Q(O,"#4a9eff"):O!=null?O:"")}if(g||this._configReplaced){let w=g?_._getSegmentDraftState(T):_._getGradientStopsDraftState(T);for(let E of Object.keys(w))for(let V of["","-text-fallback"])for(let M of this.shadowRoot.querySelectorAll(`input[data-kind="${g?"segment":"gradient"}-draft-${E}${V}"]`))(M!==this.shadowRoot.activeElement||this._configReplaced)&&(M.value=E==="color"&&M.type==="color"?Q(w[E],"#4CAF50"):w[E])}g?_._refreshSegmentUi(T):(m=this.shadowRoot.querySelector("#gradient-draft-pos"))!=null&&m.closest&&_._refreshGradientDraftUi(T)}for(let _ of["above","below"]){let g=this.shadowRoot.querySelector(`#baseline-${_}-color-enabled`);g&&(g.checked=this._baselineSection._isBaselineDirectionalColorEnabled(T,_))}this._referenceMarkersSection.syncControls(this._hass,this._configReplaced);let i=this._targetSection._getBuiltinMarkerLabelOptions(T,"target");for(let[_,g]of[["target-label-show",i.show],["target-label-show-value",i.showValue],["target-label-show-unit",i.showUnit],["target-above-fill-enabled",this._targetSection._isTargetAboveFillEnabled(T)]]){let y=this.shadowRoot.querySelector(`#${_}`);y&&(y.checked=g)}let n=this.shadowRoot.querySelector("#bar-solid-fill");n&&(n.checked=_e(e,T));let a=this.shadowRoot.querySelector("#bar-animated");a&&(a.checked=Jt(e,T));let l=this.shadowRoot.querySelector("#feature-entity-override");l&&(l.checked=!!this._explicitEntity||this._chooseEntity);let s=this.shadowRoot.querySelector("#feature-entity-status");s&&(s.textContent=this._entityDescription());for(let[_,g,y,w]of[["feature-entity-source",this._explicitEntity,"Entity override","feature-entity"],["scale-min-entity-source",Oe(this._config,"min").entity,"Min entity","feature-scale-min-entity"],["baseline-entity-source",Re(this._config).entity,"Baseline entity","feature-baseline-entity"],["target-entity-source",ze(this._config).entity,"Target entity","feature-target-entity"],["scale-max-entity-source",Oe(this._config,"max").entity,"Max entity","feature-scale-max-entity"]])for(let E of["input","ha-entity-picker"])for(let V of this.shadowRoot.querySelectorAll(`${E}[data-kind="${_}"]`))V.id=w,V.setAttribute("aria-label",y),_==="feature-entity-source"&&(V.setAttribute("aria-describedby","feature-entity-status"),V.setAttribute("aria-required",this._effectiveEntity?"false":"true")),(V!==this.shadowRoot.activeElement||this._configReplaced)&&(V.value=g),E==="ha-entity-picker"&&(V.hass=this._hass,V.label=y,V.allowCustomEntity=!0);this._syncDisclosures(),this._numericDrafts.apply(this.shadowRoot);for(let _ of this.shadowRoot.querySelectorAll('input[data-css-color="true"]')){let g=this._cssColorDrafts.get(_.id);g!==void 0&&(_.value=g),_.setAttribute("aria-invalid",g===void 0?"false":"true"),(x=_.setCustomValidity)==null||x.call(_,g===void 0?"":"Enter a valid CSS color.");let y=($=(v=(k=this.shadowRoot.querySelector(`#${_.id.replace(/-text-fallback$/,"")}`))==null?void 0:k.labels)==null?void 0:v[0])==null?void 0:$.textContent;y&&_.setAttribute("aria-label",`${y} (CSS value)`)}}};var Ma="4b6a91e362a1da2b05c16f93b5e21db724f1beaa9ad0820a87cf4179c6d1d4f8";export{Zt as SensorBarCardPlusEditor,ir as SensorBarCardPlusFeatureEditor,Ma as buildIdentity};
