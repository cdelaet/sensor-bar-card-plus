var Zt=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"]);function er(o){if(o===void 0&&(o="never"),typeof o!="string")return{kind:"never"};let e=o.trim().toLowerCase();if(e==="never")return{kind:"never"};if(Zt.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let r=Number(t[1]),i=t[2];return!Number.isInteger(r)||r<1||i==="m"&&r>59||i==="h"&&r>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:r}:{kind:"duration",hours:r}}function ot(o){if(typeof o!="string")return!1;let e=o.trim().toLowerCase();if(e==="never"||Zt.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let r=Number(t[1]);return Number.isInteger(r)&&r>=1&&(t[2]==="m"?r<=59:r<=23)}function H(o,e,t=null){let r={fixed:o!=null?o:null,entity:e!=null?e:null};return Number.isFinite(t)&&(r.percent=t),r}function ne(o){return typeof o=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(o.trim())}function re(o){if(typeof o!="string")return null;let e=o.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function Z(o){if(typeof o=="number")return Number.isFinite(o)?o:null;if(typeof o=="string"){let e=o.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function ee(o,e=null,t=null,r={}){var a,l,s,d,c,u;let{allowPercent:i=!1}=r,n=e!=null?e:H(t,null);if(o===void 0)return{...n};if(o===null)return H(null,null);if(typeof o=="object"&&!Array.isArray(o)){let h=(l=(a=o.fixed)!=null?a:o.value)!=null?l:null,f=(s=o.entity)!=null?s:null,m=i?Z(o.percent):null;return H(h,f,m)}if(ne(o))return H((c=(d=n.fixed)!=null?d:t)!=null?c:null,o,(u=n.percent)!=null?u:null);if(i){let h=re(o);if(Number.isFinite(h))return H(null,null,h)}return H(o,null)}function jr(o){var e;return!!o&&(Z((e=o.fixed)!=null?e:o.value)!==null||Number.isFinite(o.percent)||!!o.entity)}function nr(o,e){var r,i,n,a;let t={above:((r=e==null?void 0:e.peak_marker)==null?void 0:r.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&jr((a=e==null?void 0:e.target_marker)==null?void 0:a.source)?1:0)};return o.map(l=>{let s=l.valid&&t[l.lane]<4;return s&&(t[l.lane]+=1),{...l,accepted:s}})}function ar(o,e=null){if(!Array.isArray(o))return{markers:[],invalidList:o!==void 0};let t=o.map((r,i)=>{var R;if(!r||typeof r!="object"||Array.isArray(r))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=r.at,a=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),l=typeof n=="string"?n.trim():n,s=ee(l,null,null,{allowPercent:!0}),d=n&&typeof n=="object"&&n.entity!==void 0?n.entity:typeof l=="string"&&ne(l)?l:null,c=d!=null&&d!==""&&!ne(d),u=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&Z(n.fixed)===null,h=!!s.entity||Z(s.fixed)!==null||Number.isFinite(s.percent),f=Number.isFinite(s.percent)&&(s.percent<0||s.percent>100),m=n!=null&&!a&&!c&&!u&&h&&!f,x=r.lane===void 0?"below":r.lane,k=x==="above"||x==="below",S=["circle","diamond","triangle","chevron","arrow","pin"],$=r.shape===void 0||S.includes(r.shape),_=Y(r.direction),g=r.direction!==void 0&&!["inward","outward"].includes(typeof r.direction=="string"?r.direction.trim().toLowerCase():""),v=r.label&&typeof r.label=="object"&&!Array.isArray(r.label)?r.label:{},w=ut(v),E=v.entity,V=typeof E=="string"?E.trim():"",T=E!=null&&E!==""&&!ne(V),z=V&&ne(V)?V:null,N=typeof r.show_marker=="boolean"?r.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...s,entity:typeof s.entity=="string"?s.entity.trim():s.entity},lane:k?x:null,shape:$&&(R=r.shape)!=null?R:"circle",direction:_,invalidDirection:g,showMarker:N,invalidShowMarker:r.show_marker!==void 0&&typeof r.show_marker!="boolean",color:typeof r.color=="string"&&r.color.trim()?r.color:"#888888",label:{show:v.show===!0,text:w.label_text,entity:z,showValue:w.label_show_value,showUnit:w.label_show_unit,precision:w.label_precision,invalidShow:w.label_invalid_show,invalidText:w.label_invalid_text,invalidShowValue:w.label_invalid_show_value,invalidShowUnit:w.label_invalid_show_unit,invalidPrecision:w.label_invalid_precision,invalidPrecisionKey:w.label_precision_key,unsupportedUnit:w.label_unsupported_unit,invalidEntity:T},valid:m&&k,invalidSource:!m,invalidPercentage:f,unsupportedPercentField:a,invalidLane:!k,invalidShape:!$,accepted:!1}});return{markers:nr(t,e),invalidList:!1}}function lt(o,e=null){var r;let t=e!=null?e:{color:null};return o===void 0?{...t}:o===null?{color:null}:typeof o=="object"&&!Array.isArray(o)?{color:(r=o.color)!=null?r:null}:{color:o}}function Ot(o){return o===!0?!0:o===!1?!1:null}function or(o,e){var n;let t=e==null?void 0:e.baseline,r=o==null?void 0:o.baseline,i={enabled:Ot(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:H(null,null),above:lt(void 0,t==null?void 0:t.above),below:lt(void 0,t==null?void 0:t.below)};return r===void 0?i:r===null?{enabled:null,at:H(null,null),above:{color:null},below:{color:null}}:typeof r!="object"||Array.isArray(r)?{enabled:i.enabled,at:ee(r,i.at,null),above:i.above,below:i.below}:{enabled:(n=Ot(r.enabled))!=null?n:i.enabled,at:ee(r.at,i.at,null,{allowPercent:!0}),above:lt(r.above,i.above),below:lt(r.below,i.below)}}function Lr(o,e=null){let t=[...o].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var a;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(a=r.label)!=null?a:null}})}function tr(o){if(!Array.isArray(o))return null;let e=o.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var r;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(r=t.label)!=null?r:null}});return Lr(e,100)}function rr(o,e=null){var r;if(o===void 0)return{value:null,issue:null};if(o===null)return{value:null,issue:"malformed"};if(o&&typeof o=="object"&&!Array.isArray(o)){if(o.entity!==void 0&&o.entity!==null&&o.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(o,"percent")){let n=Z(o.percent);return Number.isFinite(n)?{value:H(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=Z((r=o.fixed)!=null?r:o.value);return Number.isFinite(i)?{value:H(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof o=="string"){let i=o.trim();if(ne(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=re(i);return Number.isFinite(n)?{value:H(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=Z(o);return Number.isFinite(t)?e==="percent"?{value:H(null,null,t),issue:null}:{value:H(t,null),issue:null}:{value:null,issue:"malformed"}}function Je(o,e={}){if(!Array.isArray(o))return null;let{legacySegmentSpace:t=null}=e,r=o.map(i=>{var l,s;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:rr(i.from,t),a=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:rr(i.to,t);return i!=null&&i.color?{from:n.value,to:a.value,invalidBoundary:(l=n.issue)!=null?l:a.issue,color:i.color,label:(s=i.label)!=null?s:null}:null}).filter(Boolean);return r.map((i,n)=>{var l;let a=r.slice(n+1).find(s=>!s.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:a!=null&&a.from?{...a.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(l=i.label)!=null?l:null}})}function ir(o,e,t,r){var x,k,S,$,_,g,v,w,E,V;let i=e==null?void 0:e.scale,n=o==null?void 0:o.scale,a=`${t}_entity`,l=i==null?void 0:i[t],s=l?H((k=(x=l.fixed)!=null?x:l.value)!=null?k:null,(S=l.entity)!=null?S:null):H(($=e==null?void 0:e[t])!=null?$:r,(_=e==null?void 0:e[a])!=null?_:null),d=l?l.fixed_explicit!==!1&&l.fixed!==null&&l.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,c=(T,z)=>(Object.defineProperty(T,"fixed_explicit",{value:z}),T);if((n==null?void 0:n[t])!==void 0){let T=n[t],z=ne(T)?d:typeof T=="object"&&T!==null?((g=T.fixed)!=null?g:T.value)!==null&&((v=T.fixed)!=null?v:T.value)!==void 0:T!==null;return c(ee(n[t],s,r),z)}let u=o[a],h=u!=null,f=(E=(w=o[t])!=null?w:h?null:s.fixed)!=null?E:s.entity?null:r,m=(V=u!=null?u:s.entity)!=null?V:null;return c(H(f,m),o[t]!==null&&o[t]!==void 0||!h&&d)}function Xe(o,e){return{min:ir(o,e,"min",0),max:ir(o,e,"max",100)}}function Ur(o){switch(o){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function lr(o){switch(o){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}var Gt=Symbol("sbcp.paintExplicitness"),Dt=Symbol("sbcp.explicitSegmentSpace");function ct(o,e){return o!=null&&Object.prototype.hasOwnProperty.call(o,e)}function Kr(o){return[ct(o,"color")?o.color:void 0,ct(o==null?void 0:o.bar,"color")?o.bar.color:void 0].some(t=>t!=null)}function Ye(o){let e=o==null?void 0:o.bar,t=[[o,"color_mode"],[e,"color_mode"],[e,"fill_style"],[o,"severity"],[o,"segments"],[e,"segments"],[o,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Kr(o),paint:t.some(([r,i])=>ct(r,i))}}function st(o=null,e=null){var n,a,l,s,d,c;let t=(n=o==null?void 0:o.fill_style)!=null?n:null,r=(l=(a=o==null?void 0:o.color_mode)!=null?a:e)!=null?l:null,i=(d=(s=Ur(t))!=null?s:r)!=null?d:"severity";return{fill_style:(c=t!=null?t:lr(i))!=null?c:"bands",color_mode:i}}function qr(o,e,t,r,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:a=!1}={}){let l=(i==null?void 0:i.color)===!0&&i.paint!==!0,s=(n==null?void 0:n.paint)===!0;return l&&(a||!s)?st({fill_style:"solid"},null):(o==null?void 0:o.fill_style)!==void 0||(o==null?void 0:o.color_mode)!==void 0||e.color_mode!==void 0?st(o,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(r==null?void 0:r.color_mode)!==void 0?st(t,r==null?void 0:r.color_mode):st(null,null)}function Hr(o){return Array.isArray(o)?o.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=re(e.pos),r=Number.isFinite(t)?t:Z(e.pos);return{...e,pos:Number.isFinite(r)?r:e.pos}}):o!=null?o:null}function Wr(o,e=null){var r,i,n,a;let t=e?{show:(r=e.show)!=null?r:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return o===void 0?{...t}:typeof o=="boolean"?{show:o,color:"#ffffff"}:o&&typeof o=="object"&&!Array.isArray(o)?{show:(n=o.show)!=null?n:t.show,color:(a=o.color)!=null?a:t.color}:{...t}}function ae(o,e,t={}){var w,E,V,T,z,N,R,B,A,L,U,q,le,se,de,ce,Ne,Ie,je,Le,Ue,Ke,qe,He,We,ge,he;let r=(w=t.scopeExplicitness)!=null?w:Ye(o),i=(V=(E=t.inheritedExplicitness)!=null?E:e==null?void 0:e[Gt])!=null?V:Ye(e),n=(T=t.isCardScope)!=null?T:e==null,a=e==null?void 0:e.bar,l=o==null?void 0:o.bar,s=ct(a,Dt)?a[Dt]:["percent","scale"].includes(a==null?void 0:a.segment_space)?a.segment_space:null,d=["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:s,c=l==null?void 0:l.segments,u=o.segments,h=o.severity,f=(z=a==null?void 0:a.segments)!=null?z:null,m=(N=e==null?void 0:e.segments)!=null?N:null,x=(R=e==null?void 0:e.severity)!=null?R:null,k=null,S=(a==null?void 0:a.segment_space)==="percent"||(a==null?void 0:a.segment_space)==="scale"?a.segment_space:null;c!=null?(S=d,k=Je(c,{legacySegmentSpace:S})):u!=null?k=Je(u):h!=null?(k=tr(h),S="percent"):f!=null?k=f.map(Ir=>({...Ir})):m!=null?k=Je(m):x!=null&&(k=tr(x),S="percent");let $=o!=null&&o.target&&typeof o.target=="object"&&!Array.isArray(o.target)?(B=o.target.when_exceeded)==null?void 0:B.fill_color:void 0,_=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(A=e.target.when_exceeded)==null?void 0:A.fill_color:void 0,g=qr(l,o,a,e,{scopeExplicitness:r,inheritedExplicitness:i,isCardScope:n}),v={fill_style:g.fill_style,color_mode:g.color_mode,needle:Wr(l==null?void 0:l.needle,a==null?void 0:a.needle),solid_fill:(U=(L=l==null?void 0:l.solid_fill)!=null?L:a==null?void 0:a.solid_fill)!=null?U:!1,color:(de=(se=(le=(q=l==null?void 0:l.color)!=null?q:o.color)!=null?le:a==null?void 0:a.color)!=null?se:e==null?void 0:e.color)!=null?de:"#4a9eff",gradient_stops:Hr((je=(Ie=(Ne=(ce=l==null?void 0:l.gradient_stops)!=null?ce:o.gradient_stops)!=null?Ne:a==null?void 0:a.gradient_stops)!=null?Ie:e==null?void 0:e.gradient_stops)!=null?je:null),severity:k,segments:k,segment_space:S,animated:(qe=(Ke=(Ue=(Le=l==null?void 0:l.animated)!=null?Le:o.animated)!=null?Ue:a==null?void 0:a.animated)!=null?Ke:e==null?void 0:e.animated)!=null?qe:!0,above_target_color:(he=(ge=(We=(He=$!=null?$:o.above_target_color)!=null?He:a==null?void 0:a.above_target_color)!=null?We:_)!=null?ge:e==null?void 0:e.above_target_color)!=null?he:null};return Object.defineProperty(v,Dt,{value:d}),v}function Jr(o){return Math.max(24,o)}function Yr(o,e="left"){let t=typeof o=="string"?o.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function Xr(o,e="medium"){let t=typeof o=="string"?o.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Qr(o){return Number.isFinite(o)?Math.min(112,Math.max(12,o)):null}function sr(o,e){var f,m,x,k,S,$,_,g,v,w,E,V,T,z,N,R,B,A,L,U,q,le,se,de,ce;let t=e==null?void 0:e.layout,r=o==null?void 0:o.layout,i=r==null?void 0:r.label,n=r==null?void 0:r.hero,a=t==null?void 0:t.label,l=t==null?void 0:t.hero,s=!e,d=(k=(x=(m=(f=r==null?void 0:r.height)!=null?f:o.height)!=null?m:t==null?void 0:t.height)!=null?x:e==null?void 0:e.height)!=null?k:38,c=(r==null?void 0:r.height)!==void 0||o._height_explicit===!0||!s&&o.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,u=Yr((g=(_=($=(S=i==null?void 0:i.position)!=null?S:o.label_position)!=null?$:a==null?void 0:a.position)!=null?_:t==null?void 0:t.label_position)!=null?g:e==null?void 0:e.label_position,"left"),h=u==="hero"?Qr((v=n==null?void 0:n.value_size)!=null?v:l==null?void 0:l.value_size):null;return{label:{position:u,width:(z=(T=(V=(E=(w=i==null?void 0:i.width)!=null?w:o.label_width)!=null?E:a==null?void 0:a.width)!=null?V:t==null?void 0:t.label_width)!=null?T:e==null?void 0:e.label_width)!=null?z:100},hero:{size:Xr((ce=(de=(se=(le=(q=(U=(L=(A=(B=(R=(N=n==null?void 0:n.size)!=null?N:i==null?void 0:i.hero_size)!=null?R:i==null?void 0:i.heroSize)!=null?B:o.hero_size)!=null?A:o.heroSize)!=null?L:l==null?void 0:l.size)!=null?U:a==null?void 0:a.hero_size)!=null?q:a==null?void 0:a.heroSize)!=null?le:t==null?void 0:t.hero_size)!=null?se:t==null?void 0:t.heroSize)!=null?de:e==null?void 0:e.hero_size)!=null?ce:e==null?void 0:e.heroSize,"medium"),value_size:h},height:Jr(d),height_explicit:c}}function dr(o,e){var i,n,a,l,s,d,c,u;let t=e==null?void 0:e.formatting,r=o==null?void 0:o.formatting;return{decimal:(l=(a=(n=(i=r==null?void 0:r.decimal)!=null?i:o.decimal)!=null?n:t==null?void 0:t.decimal)!=null?a:e==null?void 0:e.decimal)!=null?l:null,unit:(u=(c=(d=(s=r==null?void 0:r.unit)!=null?s:o.unit)!=null?d:t==null?void 0:t.unit)!=null?c:e==null?void 0:e.unit)!=null?u:null}}function fe(o){let e=String(o!=null?o:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function Y(o){return(typeof o=="string"?o.trim().toLowerCase():"")==="outward"?"outward":"inward"}function ut(o,e={}){var u,h,f;let t=o&&typeof o=="object"&&!Array.isArray(o)?o:{},r=Object.prototype.hasOwnProperty.call(t,"text"),i=r&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),a=Object.prototype.hasOwnProperty.call(t,"decimal"),l=n?t.precision:t.decimal,s=n||a,d=s?Z(l):(u=e.label_precision)!=null?u:null,c=s&&l!==null&&l!==""&&!(Number.isInteger(d)&&d>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(h=e.label_show_value)!=null?h:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(f=e.label_show_unit)!=null?f:!0,label_precision:c?null:d,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:r&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:c,label_precision_key:c?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function dt(o){let e={};return o.label_text!==null&&o.label_text!==void 0&&(e.label_text=o.label_text),o.label_show_value===!1&&(e.label_show_value=!1),o.label_show_unit===!1&&(e.label_show_unit=!1),o.label_precision!==null&&o.label_precision!==void 0&&(e.label_precision=o.label_precision),o.label_invalid_text&&(e.label_invalid_text=!0),o.label_invalid_show_value&&(e.label_invalid_show_value=!0),o.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),o.label_invalid_show&&(e.label_invalid_show=!0),o.label_invalid_precision&&(e.label_invalid_precision=!0),o.label_invalid_precision&&o.label_precision_key&&(e.label_precision_key=o.label_precision_key),o.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function cr(o){return o!==void 0&&!["inward","outward"].includes(typeof o=="string"?o.trim().toLowerCase():"")}function ur(o,e){var u,h,f,m,x,k,S,$,_,g,v,w,E,V,T,z,N,R,B,A,L,U,q,le,se,de,ce,Ne,Ie,je,Le,Ue,Ke,qe,He;let t=e==null?void 0:e.target_marker,r=o==null?void 0:o.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(u=e==null?void 0:e.target)!=null?u:null,n=t?{...t,shape:fe(t.shape),direction:Y(t.direction)}:{enabled:null,source:H(null,null),color:(h=e==null?void 0:e.target_color)!=null?h:"#888",show_label:(f=e==null?void 0:e.show_target_label)!=null?f:!1,...dt(ut((m=e==null?void 0:e.target)==null?void 0:m.label)),label_decimal:(g=(_=(k=(x=e==null?void 0:e.target)==null?void 0:x.label)==null?void 0:k.precision)!=null?_:($=(S=e==null?void 0:e.target)==null?void 0:S.label)==null?void 0:$.decimal)!=null?g:null,shape:"diamond",direction:"inward"};if(r&&typeof r=="object"&&!Array.isArray(r)){let We=ut(r.label,n),ge={enabled:(w=(v=Ot(r.enabled))!=null?v:n.enabled)!=null?w:null,source:ee(r.at,n.source,null,{allowPercent:!0}),color:(V=(E=r.color)!=null?E:o.target_color)!=null?V:n.color,show_label:(N=(z=(T=r.label)==null?void 0:T.show)!=null?z:o.show_target_label)!=null?N:n.show_label,shape:Object.prototype.hasOwnProperty.call(r,"shape")?fe(r.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(r,"direction")?Y(r.direction):n.direction,...cr(r.direction)?{direction_invalid:!0}:{},...dt(We)},he=We.label_precision;return he!=null&&(ge.label_decimal=he,ge.label_precision=he),ge}let a=(U=(L=(B=o.target)!=null?B:(R=n.source)==null?void 0:R.fixed)!=null?L:(A=n.source)==null?void 0:A.value)!=null?U:i,l=(de=(se=(le=o.target_entity)!=null?le:(q=n.source)==null?void 0:q.entity)!=null?se:e==null?void 0:e.target_entity)!=null?de:null,s=o.target===void 0&&o.target_entity===void 0&&(Ne=(ce=n.source)==null?void 0:ce.percent)!=null?Ne:null,d={enabled:(Ie=n.enabled)!=null?Ie:null,source:H(a,l,s),color:(Ue=(Le=(je=o.target_color)!=null?je:n.color)!=null?Le:e==null?void 0:e.target_color)!=null?Ue:"#888",show_label:(He=(qe=(Ke=o.show_target_label)!=null?Ke:n.show_label)!=null?qe:e==null?void 0:e.show_target_label)!=null?He:!1,shape:n.shape,direction:n.direction,...dt(n)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Zr(o,e){let t=o==null?void 0:o[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let r=o==null?void 0:o[`${e}_marker`];return r&&typeof r=="object"&&!Array.isArray(r)?r:null}function ei(o,e){var n,a,l;let t=o==null?void 0:o.label,r=t&&typeof t=="object"&&!Array.isArray(t),i=ut(t,e);return{show:r&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(l=(a=i.label_precision)!=null?a:e.label_decimal)!=null?l:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function hr(o,e,t,r={}){var S,$,_,g,v,w,E,V,T;let{legacy:i=!1,defaultColor:n="#888888"}=r,a=e==null?void 0:e[`${t}_marker`],l=Zr(o,t),s=a!=null?a:{show:i&&(S=e==null?void 0:e.show_peak)!=null?S:!1,color:i&&($=e==null?void 0:e.peak_color)!=null?$:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},d=l&&Object.prototype.hasOwnProperty.call(l,"reset"),c=d?l.reset:void 0,u=d?er(c):(_=s.reset)!=null?_:{kind:"never"},h=l==null?void 0:l.label,f=ei(l,s),m={show:(w=(v=(g=l==null?void 0:l.enabled)!=null?g:i?o.show_peak:void 0)!=null?v:s.show)!=null?w:!1,color:(T=(V=(E=l==null?void 0:l.color)!=null?E:i?o.peak_color:void 0)!=null?V:s.color)!=null?T:n,direction:l&&Object.prototype.hasOwnProperty.call(l,"direction")?Y(l.direction):Y(s.direction),...cr(l==null?void 0:l.direction)?{direction_invalid:!0}:{}},x=a&&(Object.prototype.hasOwnProperty.call(a,"show_label")||Object.prototype.hasOwnProperty.call(a,"label_decimal")||Object.prototype.hasOwnProperty.call(a,"label_text")||Object.prototype.hasOwnProperty.call(a,"label_show_value")||Object.prototype.hasOwnProperty.call(a,"label_show_unit")||Object.prototype.hasOwnProperty.call(a,"label_precision")||Object.prototype.hasOwnProperty.call(a,"reset"));return(t==="floor"||d||h!==void 0||x)&&(m.show_label=f.show,m.label_decimal=f.precision,m.reset=u),Object.assign(m,dt({label_text:f.text,label_show_value:f.showValue===!0?void 0:f.showValue,label_show_unit:f.showUnit===!0?void 0:f.showUnit,label_precision:f.precision,label_invalid_text:f.invalidText,label_invalid_show:f.invalidShow,label_invalid_show_value:f.invalidShowValue,label_invalid_show_unit:f.invalidShowUnit,label_invalid_precision:f.invalidPrecision,label_precision_key:f.precisionKey,label_unsupported_unit:f.unsupportedUnit})),d&&!ot(c)&&(m.reset_invalid=!0),m}function fr(o,e){return hr(o,e,"peak",{legacy:!0,defaultColor:"#888888"})}function mr(o,e){return hr(o,e,"floor",{defaultColor:"#888888"})}function ti(o,e){var i,n,a;let t={...o,_normalized:!0,entity:o.entity,name:(i=o.name)!=null?i:null,icon:o.icon};t.layout=sr(o,e),t.scale=Xe(o,e),t.bar=ae(o,e,{scopeExplicitness:Ye(o),inheritedExplicitness:(n=e==null?void 0:e[Gt])!=null?n:Ye(e),isCardScope:!1}),t.baseline=or(o,e),t.formatting=dr(o,e),t.target_marker=ur(o,e),t.peak_marker=fr(o,e),t.floor_marker=mr(o,e);let r=o.markers===void 0?{markers:nr((a=e==null?void 0:e.generic_markers)!=null?a:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:ar(o.markers,t);return t.generic_markers=r.markers,t.generic_markers_invalid=r.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function _r(o){var n;let e=Ye(o),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...o};t._height_explicit=((n=o==null?void 0:o.layout)==null?void 0:n.height)!==void 0||(o==null?void 0:o.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(a=>typeof a=="string"?{entity:a}:a);let r={...t,_normalized:!0};Object.defineProperty(r,Gt,{value:e,enumerable:!1}),r.layout=sr(t,null),r.scale=Xe(o,null),r.bar=ae(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),r.baseline=or(t,null),r.formatting=dr(t,null),r.target_marker=ur(t,null),r.peak_marker=fr(t,null),r.floor_marker=mr(t,null);let i=ar(t.markers,r);return r.generic_markers=i.markers,r.generic_markers_invalid=i.invalidList,r.entities=t.entities.map(a=>ti(a,r)),r}function ht(o,e){var i;if(!e||!((i=o==null?void 0:o.states)!=null&&i[e]))return null;let t=o.states[e].state,r=parseFloat(t);return Number.isFinite(r)?r:null}function Qe(o,e,t=null){let r=ht(o,t);if(r!==null)return r;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function ri(o,e,t){if(!Number.isFinite(o))return null;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return r+o/100*(i-r)}function pr(o,e,t=null,r=null){var a;if(!e)return null;let i=ht(o,e.entity);if(i!==null)return i;let n=Qe(o,(a=e.fixed)!=null?a:e.value,null);return n!==null?n:Number.isFinite(e.percent)?ri(e.percent,t,r):null}function gr(o,e,t=null){var l,s,d,c,u,h,f,m,x,k,S,$;let r=_=>Number.isFinite(_==null?void 0:_.min)&&Number.isFinite(_==null?void 0:_.max)&&_.min<_.max,i={min:Qe(null,(d=(l=e==null?void 0:e.min)==null?void 0:l.fixed)!=null?d:(s=e==null?void 0:e.min)==null?void 0:s.value),max:Qe(null,(h=(c=e==null?void 0:e.max)==null?void 0:c.fixed)!=null?h:(u=e==null?void 0:e.max)==null?void 0:u.value)};if((f=e==null?void 0:e.min)!=null&&f.entity&&((m=e==null?void 0:e.max)!=null&&m.entity)){let _={min:ht(o,e.min.entity),max:ht(o,e.max.entity)};return r(_)?_:Number.isFinite(_.min)&&Number.isFinite(_.max)&&r(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&r(i)?i:{min:0,max:100}}let n={min:(x=pr(o,e==null?void 0:e.min))!=null?x:0,max:(k=pr(o,e==null?void 0:e.max))!=null?k:100};if(r(n))return n;let a={min:(S=i.min)!=null?S:0,max:($=i.max)!=null?$:100};return r(a)?a:{min:0,max:100}}function Ze(o){return Array.isArray(o)?[...o]:{...o!=null?o:{}}}function M(o){if(Array.isArray(o))return o.map(e=>M(e));if(b(o)){let e={};for(let[t,r]of Object.entries(o))e[t]=M(r);return e}return o}function J(o){let e=t=>Array.isArray(t)?t.map(r=>e(r)):b(t)?Object.keys(t).sort().reduce((r,i)=>(r[i]=e(t[i]),r),{}):t;return JSON.stringify(e(o!=null?o:null))}function b(o){return!!o&&typeof o=="object"&&!Array.isArray(o)}function P(o,e,t){if(!e.length)return t;let r=Ze(o!=null?o:{}),i=r,n=o;for(let a=0;a<e.length-1;a++){let l=e[a],s=b(n==null?void 0:n[l])||Array.isArray(n==null?void 0:n[l])?n[l]:{};i[l]=Ze(s),i=i[l],n=s}return i[e[e.length-1]]=t,r}function p(o,e){if(!e.length||!b(o))return o;let[t,...r]=e;if(!(t in o))return o;let i=Ze(o);if(!r.length)return delete i[t],i;let n=p(i[t],r);return n===i[t]?o:b(n)&&!Object.keys(n).length?(delete i[t],i):(i[t]=n,i)}function G(o,e){let t=o;for(let r of e){if(t==null)return;t=t[r]}return t}function br(o,e){let t=o;for(let r of e){if(!b(t)&&!Array.isArray(t)||!(r in t))return!1;t=t[r]}return!0}function D(o){return typeof o=="string"?o:o==null?"":String(o)}function yr(o){return o===!0?!0:o===!1?!1:null}function K(o){if(o===""||o===null||o===void 0)return null;let e=Number(o);return Number.isFinite(e)?e:null}function ie(o){if(o===""||o===null||o===void 0)return null;let e=Number(o);return!Number.isFinite(e)||e<0||!Number.isInteger(e)?null:e}function Sr(o,e){let t=Array.isArray(e)?e:[e];return!o||o.type==="card"?t:o.type==="entity"?["entities",o.index,...t]:t}function mt(o){return Array.isArray(o)?o:[o]}function te(o,e=[]){return e.reduce((t,r)=>p(t,mt(r)),o)}function C(o,e){let t=o,r=mt(e);for(let i=r.length;i>0;i--){let n=r.slice(0,i),a=G(t,n);if(!b(a)||Object.keys(a).length)break;t=p(t,n)}return t}function ft(o){return o!==""&&o!==void 0&&o!==null}function be(o){return ft(o==null?void 0:o.fixed)||ft(o==null?void 0:o.entity)}function _t(o,e,t,r=[]){let i=[t,...r];for(let n of i){let a=o.read(e,n);if(a!=null&&a!=="")return a}if((e==null?void 0:e.type)==="entity")for(let n of i){let a=o.read({type:"card"},n);if(a!=null&&a!=="")return a}return""}function vr(o,e){return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="entity-picker" data-index="${e}"></ha-entity-picker>`:`<input type="text" data-kind="entity-input" data-index="${e}" value="${y(o.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function W(o,e,t,r="sensor.example",i={}){let n=Object.entries(i).map(([a,l])=>`data-${a}="${y(l)}"`).join(" ");return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="${o}" data-index="${e}"${n?` ${n}`:""}></ha-entity-picker>`:`<input type="text" data-kind="${o}" data-index="${e}"${n?` ${n}`:""} value="${y(t)}" placeholder="${y(r)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function ye(o,e,t,r){var s;let i=(o==null?void 0:o.type)==="entity",n=i?`entity-${o.index}-${e}`:e,a=i?`data-kind="entity-${e}-label-`:`data-field="${e}-label-`,l=i?`" data-index="${o.index}"`:'"';return`
      <div class="field-row"><div class="toggle">
        <input id="${n}-label-show" type="checkbox" ${a}show${l}${r.show?" checked":""}>
        <label for="${n}-label-show">Show ${t} label</label>
      </div></div>
      <div class="field-row"><label for="${n}-label-text">${t} label text</label>
        <input id="${n}-label-text" type="text" ${a}text${l} value="${y((s=r.text)!=null?s:"")}" placeholder="optional semantic text">
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
        <input id="${n}-label-precision" type="number" min="0" step="1" ${a}precision${l} value="${y(r.precision)}" placeholder="inherit primary precision">
      </div>`}function tt(o){let e=D(o).trim().toLowerCase()||"never";return["never","quarterly","hourly","daily","weekly","monthly","yearly",...Array.from({length:59},(r,i)=>`${i+1}m`),...Array.from({length:23},(r,i)=>`${i+1}h`)].map(r=>`<option value="${r}"${e===r?" selected":""}>${r}</option>`).join("")}function y(o){return D(o).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function me(o){return typeof o=="string"&&/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(o.trim())}function et(o){if(!me(o))return null;let e=o.trim().toLowerCase();return e.length===7?e:`#${e.slice(1).split("").map(t=>t+t).join("")}`}function O(o){var t;let e=D(o).trim().toLowerCase();return e?(t=et(e))!=null?t:e:""}function Q(o,e="#000000"){var t,r;return(r=(t=et(o))!=null?t:et(e))!=null?r:"#000000"}function j(o,e=!1){let t=D(o);return e&&t.trim()?t:t.trim()}function Se(o){let e=K(o);return e!==null&&e>=0&&e<=100?e:null}function Rt(o,e,t){return`<input id="${o}" type="number" min="0" max="100" step="any" ${e} value="${y(t)}">%`}function pt(o){return Number.isFinite(o.percent)?"percent":o.entity?o.fixed!==""&&o.fixed!==void 0?"entity-fallback":"entity":"fixed"}function gt(o,e,t){return`<div class="field-row">
      <label for="${o}-source-mode">Source</label>
      <select id="${o}-source-mode" data-field="${o}-source-mode">
        ${[["fixed","Fixed"],["entity","Entity"],["entity-fallback","Entity with fixed fallback"],["percent","Percentage"]].map(([r,i])=>`<option value="${r}"${e===r?" selected":""}>${i}</option>`).join("")}
      </select>
    </div>
    <div class="field-row">
      <label for="${o}-percent">Scale percentage</label>
      ${Rt(`${o}-percent`,`data-field="${o}-percent"`,t)}
      <button type="button" data-action="${o}-clear-percent">Clear percentage</button>
      <div class="section-note">Percentage uses the current scale. Entity and fixed values take precedence when present.</div>
    </div>`}function I({id:o,field:e=null,kind:t=null,index:r=null,value:i="",fallbackHex:n="#000000",placeholder:a="",extraDataset:l={},cssText:s=!1,label:d="Color"}){let c=D(i).trim(),u=Q(c,n),h=Object.entries(l).map(([x,k])=>`data-${x}="${y(k)}"`).join(" "),f=e?`data-field="${e}"${h?` ${h}`:""}`:`data-kind="${t}" data-index="${r}"${h?` ${h}`:""}`,m=e?`data-field="${e}-text-fallback"${h?` ${h}`:""}`:`data-kind="${t}-text-fallback" data-index="${r}"${h?` ${h}`:""}`;return`
      <div class="field-grid">
        <input id="${o}" type="color" ${f} value="${y(u)}">
        ${s||c&&!me(c)?`<input${s?` id="${o}-text-fallback" data-css-color="true" aria-label="${y(d)} (CSS value)"`:""} type="text" ${m} value="${y(s?i:c)}" placeholder="${y(a||"CSS color value")}">`:""}
      </div>
    `}var bt=`
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
	      `;function yt({group:o,title:e,summary:t,content:r,inactive:i=!1},n){return`
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
          <span id="card-group-${o}-summary" class="override-group-summary">${y(t)}</span>
        </button>
        <div class="override-group-body" style="display:${n?"grid":"none"};">
          ${r}
        </div>
      </div>
    `}function St({renderGroup:o,target:e,peak:t,floor:r,references:i}){return`	        <div class="section">
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
	        </div>`}var ve=class{constructor(){this.values=new Map}reset(){this.values.clear()}handle(e,t=!1){var u,h,f,m,x,k;let r=e.target;if(t&&(r==null?void 0:r.type)==="number")return!0;let i=(m=(f=(u=r==null?void 0:r.dataset)==null?void 0:u.field)!=null?f:(h=r==null?void 0:r.dataset)==null?void 0:h.kind)!=null?m:"";if(i==="generic-marker-source-mode"&&r.id)for(let S of["fixed","fallback","percent"])this.values.delete(r.id.replace(/source-mode$/,S));if((r==null?void 0:r.type)!=="number"||!r.id||/^(?:entity-)?gradient-/.test(i)||/^(?:target|baseline)-percent$/.test(i))return!1;if(r.isConnected===!1)return!0;let n=r.value,a=i==="generic-marker-percent",s=/(?:precision|decimal)$/.test(i)?ie(n):K(n),d=s!==null&&!((x=r.validity)!=null&&x.badInput)&&(!/(?:layout-height|override-height)$/.test(i)||s>=24),c=e.type==="change"&&n===""&&!((k=r.validity)!=null&&k.badInput)&&!a;return d||c?(this.values.delete(r.id),!1):(this.values.set(r.id,n),!0)}captureFocus(e){let t=e.activeElement;return t&&this.values.has(t.id)?t.id:null}apply(e,t=null){var r,i,n,a,l,s;for(let[d,c]of this.values){let u=(i=(r=e.getElementById)==null?void 0:r.call(e,d))!=null?i:e.querySelector(`#${d}`);if(!u){this.values.delete(d);continue}u!==e.activeElement&&(u.value=c)}t&&((s=(l=(a=(n=e.getElementById)==null?void 0:n.call(e,t))!=null?a:e.querySelector(`#${t}`))==null?void 0:l.focus)==null||s.call(l,{preventScroll:!0}))}};function _e(o,e,t,r=!1){return o.source(e,t,r)}function vt(o,e){return _e(o,{type:"card"},e).fixed}function xt(o,e){return _e(o,{type:"card"},e).entity}function rt(o,e,t,r,i){return o.setSource(e,t,r,i)}function ii(o,e){let t=r=>r!==""&&r!==void 0&&r!==null;return["min","max"].some(r=>{let i=_e(o,e,r);return t(i==null?void 0:i.fixed)||t(i==null?void 0:i.entity)})}function xr(o,e){let t=[],r=_e(o,e,"min"),i=_e(o,e,"max");return r.entity?t.push("Min entity"):r.fixed!==""&&r.fixed!==void 0&&t.push(`Min ${r.fixed}`),i.entity?t.push("Max entity"):i.fixed!==""&&i.fixed!==void 0&&t.push(`Max ${i.fixed}`),t.length?t.join(" \u2022 "):"Inherited"}function zt(o,e){return o.mutate(e,t=>{let r=p(t,["scale","min"]);return r=p(r,["scale","max"]),r=p(r,["min"]),r=p(r,["max"]),r=p(r,["min_entity"]),r=p(r,["max_entity"]),C(r,["scale"])},{rerender:!0})}function xe(o,{field:e,kind:t,index:r,value:i}){if(e==="scale-min"||e==="scale-max")return rt(o,{type:"card"},e.slice(6),"fixed",i),!0;if(t==="scale-min-entity-source"||t==="scale-max-entity-source")return rt(o,{type:"card"},t.split("-")[1],"entity",i),!0;let n={type:"entity",index:Number(r)};return t==="entity-scale-inherit"?(i&&zt(o,n),!0):["entity-override-min","entity-override-max","entity-override-min-entity-source","entity-override-max-entity-source"].includes(t)?(rt(o,n,t.split("-")[2],t.endsWith("-entity-source")?"entity":"fixed",i),!0):!1}function wt(o,e){if((e==null?void 0:e.type)==="entity"){let a=e.index,l=_e(o,e,"min",!0),s=_e(o,e,"max",!0),d=!ii(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${a}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${a}"${d?" checked":""}>
	                          <label for="entity-${a}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${a}-min">Min fallback</label>
                        <input id="entity-${a}-min" type="number" step="any" data-kind="entity-override-min" data-index="${a}" value="${y(l.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${W("entity-override-min-entity-source",a,l.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${a}-max">Max fallback</label>
                        <input id="entity-${a}-max" type="number" step="any" data-kind="entity-override-max" data-index="${a}" value="${y(s.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${W("entity-override-max-entity-source",a,s.entity,"inherit card default")}
                      </div>
	                          `}let t=vt(o,"min"),r=vt(o,"max"),i=xt(o,"min"),n=xt(o,"max");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${y(t)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${W("scale-min-entity-source","card",i)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${y(r)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${W("scale-max-entity-source","card",n)}
            </div>
          </div>
	        </div>`}function oe(o,e,t){var r,i;return(i=(r=o.read(e,["formatting",t]))!=null?r:o.read(e,[t]))!=null?i:""}function $t(o,e,t){let r=[["formatting",t],[t]];for(let i of r){let n=o.read(e,i);if(n!=null&&n!=="")return n}if((e==null?void 0:e.type)==="entity")for(let i of r){let n=o.read({type:"card"},i);if(n!=null&&n!=="")return n}return""}function kt(o,e,t){let r=D(t).trim();return o.mutate(e,i=>{let n=r?P(i,["formatting","unit"],r):p(i,["formatting","unit"]);return n=p(n,["unit"]),C(n,["formatting"])})}function Et(o,e,t){let r=ie(t),i=t===""||t===null||t===void 0;return!i&&r===null?!1:o.mutate(e,n=>{let a=i?p(n,["formatting","decimal"]):P(n,["formatting","decimal"],r);return a=p(a,["decimal"]),C(a,["formatting"])})}function At(o,e){return o.mutate(e,t=>{let r=te(t,[["formatting","unit"],["formatting","decimal"],["unit"],["decimal"]]);return C(r,["formatting"])},{rerender:!0})}function Bt(o,e){var r;let t=(r=o.read(e,["formatting"]))!=null?r:{};return b(t)&&(Object.prototype.hasOwnProperty.call(t,"unit")||Object.prototype.hasOwnProperty.call(t,"decimal"))?!0:o.read(e,["unit"])!==void 0||o.read(e,["decimal"])!==void 0}function wr(o,e){let t=[],r=oe(o,e,"unit"),i=oe(o,e,"decimal");return r!==""&&t.push(`Unit ${r}`),i!==""&&t.push(`${i} ${Number(i)===1?"decimal":"decimals"}`),t.length?t.join(" \u2022 "):"Inherited"}function it(o,{field:e,kind:t,index:r,value:i}){if(e==="formatting-unit"||e==="formatting-decimal")return(e==="formatting-unit"?kt:Et)(o,{type:"card"},i),!0;let n={type:"entity",index:Number(r)};return t==="entity-formatting-inherit"?(i&&At(o,n),!0):t==="entity-formatting-unit"||t==="entity-formatting-decimal"?((t==="entity-formatting-unit"?kt:Et)(o,n,i),!0):!1}function Vt(o,e){if((e==null?void 0:e.type)==="entity"){let i=e.index,n=!Bt(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${i}"${n?" checked":""}>
                          <label for="entity-${i}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-unit">Unit</label>
                        <input id="entity-${i}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${i}" value="${y($t(o,e,"unit"))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-decimal">Decimals</label>
                        <input id="entity-${i}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${i}" value="${y($t(o,e,"decimal"))}" placeholder="inherit card default">
                      </div>
	                          `}let t=oe(o,{type:"card"},"unit"),r=oe(o,{type:"card"},"decimal");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${y(t)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${y(r)}">
            </div>
          </div>
	        </div>`}function Nt(o){switch(o){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return"bands"}}function It(o,e){var i;let t=o.read(e,["bar","fill_style"]);if(t)return t;let r=(i=o.read(e,["bar","color_mode"]))!=null?i:o.read(e,["color_mode"]);return Nt(r)}function X(o,e){return(e==null?void 0:e.type)==="entity"?ae(o.read(e,[]),o.read({type:"card"},[]),{isCardScope:!1}).fill_style:ae(o.read({type:"card"},[]),null,{isCardScope:!0}).fill_style}function nt(o,e){var t,r;return(r=(t=o.read(e,["bar","color"]))!=null?t:o.read(e,["color"]))!=null?r:"#4a9eff"}function jt(o,e){let t=[["bar","color"],["color"]];for(let r of t){let i=o.read(e,r);if(i!=null&&i!=="")return i||"#4a9eff"}if((e==null?void 0:e.type)==="entity")for(let r of t){let i=o.read({type:"card"},r);if(i!=null&&i!=="")return i||"#4a9eff"}return"#4a9eff"}function Mt(o,e,t,r,i=[]){let n={deprecatedKeys:i,prunePaths:[["bar"]]};return o.mutate(e,a=>{let l=r===void 0?p(a,["bar",t]):P(a,["bar",t],r);return l=te(l,i),C(l,["bar"])},n)}function Pt(o,e,t){let r=D(t).trim();return Mt(o,e,"fill_style",r||void 0,[["color_mode"]])}function Tt(o,e,t,r={}){let i=j(t,r.cssText),n=!i||O(i)===O("#4a9eff");return Mt(o,e,"color",n?void 0:i,[["color"]])}function pe(o,e){return!!o.read(e,["bar","solid_fill"])}function Lt(o,e){if((e==null?void 0:e.type)!=="entity")return pe(o,e);let t=o.read(e,["bar","solid_fill"]);return t!==void 0?!!t:pe(o,{type:"card"})}function Ft(o,e,t){return Mt(o,e,"solid_fill",t?!0:void 0)}function Ut(o,e){return!!ae(o.read(e,[]),(e==null?void 0:e.type)==="entity"?o.read({type:"card"},[]):null).animated}function ni(o,e,t){var i;let r=(i=o.read(e,["animated"]))!=null?i:(e==null?void 0:e.type)==="entity"?ae(o.read({type:"card"},[]),null).animated:!0;return Mt(o,e,"animated",t?r?void 0:!0:!1)}function Kt(o,e){return o.mutate(e,t=>{let r=te(t,[["bar","fill_style"],["bar","color"],["bar","solid_fill"],["color_mode"],["color"]]);return C(r,["bar"])},{rerender:!0})}function qt(o,e){var r;let t=(r=o.read(e,["bar"]))!=null?r:{};return b(t)&&(Object.prototype.hasOwnProperty.call(t,"fill_style")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"solid_fill"))?!0:o.read(e,["color_mode"])!==void 0||o.read(e,["color"])!==void 0}function $r(o,e){var n;let t=[],r=It(o,e),i=(n=o.read(e,["bar","color"]))!=null?n:o.read(e,["color"]);return r&&r!=="bands"&&t.push(r.replace(/_/g," ")),i&&O(i)!==O("#4a9eff")&&t.push("Custom color"),t.length?t.join(" \u2022 "):"Inherited"}function we(o,{field:e,kind:t,index:r,value:i},n={}){if(n.animation&&e==="bar-animated")return ni(o,{type:"card"},i),!0;let a={"bar-fill-style":Pt,"bar-color":Tt,"bar-solid-fill":Ft};if(Object.prototype.hasOwnProperty.call(a,e))return a[e](o,{type:"card"},i,n),!0;let l={type:"entity",index:Number(r)};if(t==="entity-bar-inherit")return i&&Kt(o,l),!0;let s={"entity-bar-fill-style":Pt,"entity-bar-color":Tt,"entity-bar-solid-fill":Ft};return Object.prototype.hasOwnProperty.call(s,t)?(s[t](o,l,i),!0):!1}function at(o,e,t=()=>"",r={}){if((e==null?void 0:e.type)==="entity"){let l=e.index,s=!qt(o,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${l}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${l}"${s?" checked":""}>
                          <label for="entity-${l}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-fill-style">Fill style</label>
                        <select id="entity-${l}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${l}" value="${y(X(o,e))}">
                          <option value="bands"${X(o,e)==="bands"?" selected":""}>bands</option>
                          <option value="solid"${X(o,e)==="solid"?" selected":""}>solid</option>
                          <option value="gradient"${X(o,e)==="gradient"?" selected":""}>gradient</option>
                          <option value="soft_bands"${X(o,e)==="soft_bands"?" selected":""}>soft_bands</option>
                          <option value="band_gradient"${X(o,e)==="band_gradient"?" selected":""}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${l}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${l}"${Lt(o,e)?" checked":""}>
                          <label for="entity-${l}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-color">Bar color</label>
                        ${I({id:`entity-${l}-bar-color`,kind:"entity-bar-color",index:l,value:jt(o,e),fallbackHex:"#4a9eff",placeholder:"inherit card default"})}
                      </div>
	                          `}let i=X(o,{type:"card"}),n=nt(o,{type:"card"}),a=pe(o,{type:"card"});return`	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${y(i)}">
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
              <input id="bar-animated" type="checkbox" data-field="bar-animated"${Ut(o,e)?" checked":""}>
              <label for="bar-animated">Animated</label>
            </div></div>`:""}<div class="field-row">
              <label for="bar-color">Bar color</label>
              ${I({cssText:r.cssText,label:"Bar color",id:"bar-color",field:"bar-color",value:n,fallbackHex:"#4a9eff",placeholder:"#4a9eff"})}
            </div>
          </div>${t()}
	        </div>`}function kr(o,e=null){let t=[...o].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var a;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(a=r.label)!=null?a:null}})}function Er(o,e,t){if(o==null)return null;if(typeof o=="object"&&!Array.isArray(o)){let n=Z(o.fixed);return Number.isFinite(n)?Vr(n,e,t):Number.isFinite(o.percent)?o.percent:null}let r=re(o);if(Number.isFinite(r))return r;let i=Z(o);return Number.isFinite(i)?Vr(i,e,t):null}function ai(o){return Array.isArray(o)&&o.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Pr(o,e=0,t=100){var a,l;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((a=o.bar)==null?void 0:a.segments)?o.bar.segments:[]).filter(s=>!(s!=null&&s.invalidBoundary));if(((l=o.bar)==null?void 0:l.segment_space)==="scale"||ai(n)){let s=n.map(d=>{var c;return{from:Er(d.from,r,i),to:Er(d.to,r,i),color:d.color,label:(c=d.label)!=null?c:null}}).filter(d=>Number.isFinite(d.from)&&d.color);return kr(s,100).filter(d=>Number.isFinite(d.from)&&Number.isFinite(d.to)&&d.color)}return kr(n,100).filter(s=>Number.isFinite(s.from)&&Number.isFinite(s.to)&&s.color)}function Vr(o,e,t){if(!Number.isFinite(o))return null;let r=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(o-r)/n*100))}var $e=class{constructor(e,t,r){this.context=e,this.ui=t,this.array=r}get shadowRoot(){return this.ui.root()}fillStyle(e){return X(this.context,e)}_getShadowElementById(e){var t,r,i,n;return(n=(r=(t=this.shadowRoot)==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?n:(i=this.shadowRoot)==null?void 0:i.querySelector(`#${e}`)}_renderListRows(e,t){return e.map(t).join("")}handle(e,t=e.type){var w,E,V,T,z,N,R,B;let r=e.target;if(t==="input"&&(r==null?void 0:r.type)==="checkbox")return!1;let i=(w=r==null?void 0:r.dataset)==null?void 0:w.kind,n=i==null?void 0:i.replace(/-text-fallback$/,""),a=(E=r==null?void 0:r.dataset)==null?void 0:E.action,l=!!this._getScopedSegmentsValue,s=l?"segment":"gradient",d=(V=t==="click"?a:n)==null?void 0:V.includes("entity-"),c=d?{type:"entity",index:Number(r.dataset.index)}:{type:"card"},u=n==null?void 0:n.replace(/^entity-/,""),h=Number(d?r.dataset[l?"segmentIndex":"stopIndex"]:(T=r==null?void 0:r.dataset)==null?void 0:T.index),f=()=>l?this._getScopedSegmentsValue(c):this._getScopedGradientStopsValue(c),m=(A,L,U)=>l?this._setScopedSegments(c,A,L,U):this._setScopedGradientStops(c,A,L,U),x=()=>l?this._commitSegmentDraft(c):this._commitGradientStopDraft(c),k=()=>l?this._refreshSegmentUi(c):this._refreshGradientDraftUi(c);if(t==="click")return!["add-segment","remove-segment","add-entity-segment","remove-entity-segment","add-gradient-stop","remove-gradient-stop","add-entity-gradient-stop","remove-entity-gradient-stop"].includes(a)||!a.includes(s)?!1:(a.startsWith("add-")?(this.ui.focus(`#${d?`entity-${c.index}-`:""}${s}-draft-${l?"from":"pos"}`),x()):m(f().filter((A,L)=>L!==h),{rerender:!0,...l?{sort:!0}:{}},{type:"remove",index:h}),!0);if(n===`entity-${l?"segments":"gradient-stops"}-inherit`)return r.checked&&(l?this._clearSegmentsOverride(c):this._clearGradientStopsOverride(c)),!0;if(!(u!=null&&u.startsWith(`${s}-`)))return!1;let S=u.startsWith(`${s}-draft-`),$=u.slice((S?`${s}-draft-`:`${s}-`).length),_=(N=(z=e.detail)==null?void 0:z.value)!=null?N:r.value;if(t==="keydown")return e.key==="Escape"&&S?((R=e.preventDefault)==null||R.call(e),l?this._segmentDrafts.set(this._getSegmentsScopeKey(c),this._createSegmentDraftState(c)):this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(c),this._createGradientStopDraftState(c)),this.ui.render()):e.key==="Enter"&&((B=e.preventDefault)==null||B.call(e),S?x():l&&["from","to"].includes($)?this._commitSegmentBoundaryEdit(c,h,$,_,r):!l&&$==="pos"&&this._commitGradientStopPosEdit(c,h,_,r)),!0;if(S)return l?this._setSegmentDraftField(c,$,_):this._setGradientStopsDraftField(c,$,_),!0;if(l&&["from","to"].includes($)||!l&&$==="pos")return t==="input"?l?(this._setSegmentBoundaryText(c,h,$,_),k()):this._setGradientStopPosText(c,h,_):t==="change"&&(l?this._commitSegmentBoundaryEdit(c,h,$,_,r):this._commitGradientStopPosEdit(c,h,_,r)),!0;let g=f(),v=g.map((A,L)=>{var U,q;return L!==h?A:l?{...A,color:_}:{...A,pos:(U=this._normalizeGradientStopPosValue(A==null?void 0:A.pos))!=null?U:0,color:$==="color"?_:(q=A==null?void 0:A.color)!=null?q:"#4a9eff"}});return(l||J(v)!==J(this._sanitizeGradientStopsForEmit(g)))&&m(v,l?{sort:!1}:{},{type:"edit",index:h,field:"color",value:_}),!0}};var ke=class extends $e{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._segmentDrafts=new Map,this._segmentUiRows=new Map,this._segmentBoundaryTexts=new Map}_setSegments(e,t={}){return this._setScopedSegments({type:"card"},e,t)}_clearSegmentsOverride(e){return this._segmentDrafts.delete(this._getSegmentsScopeKey(e)),this._segmentUiRows.delete(this._getSegmentsScopeKey(e)),this._clearSegmentScopeTextState(e),this.context.mutate(e,t=>{let r=p(t,["bar","segments"]);return r=p(r,["segments"]),r=p(r,["severity"]),r=C(r,["bar"]),r},{rerender:!0})}_getSegmentsValue(){return this._getScopedSegmentsValue({type:"card"})}_getSegmentsScopeKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getSegmentBoundaryTextKey(e,t,r){return`${this._getSegmentsScopeKey(e)}:${t}:${r}`}_getSegmentBoundaryText(e={type:"card"},t,r,i=""){let n=this._getSegmentBoundaryTextKey(e,t,r);return this._segmentBoundaryTexts.has(n)?this._segmentBoundaryTexts.get(n):this._formatSegmentBoundaryValue(i)}_setSegmentBoundaryText(e,t,r,i){this._segmentBoundaryTexts.set(this._getSegmentBoundaryTextKey(e,t,r),D(i))}_clearSegmentBoundaryText(e,t,r){this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(e,t,r))}_clearSegmentScopeTextState(e){let t=`${this._getSegmentsScopeKey(e)}:`;for(let r of this._segmentBoundaryTexts.keys())r.startsWith(t)&&this._segmentBoundaryTexts.delete(r)}_getSegmentsUiRows(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentUiRows.has(t)?M(this._segmentUiRows.get(t)):null}_setSegmentsUiRows(e,t){this._segmentUiRows.set(this._getSegmentsScopeKey(e),M(t))}_getSegmentDraftState(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentDrafts.has(t)||this._segmentDrafts.set(t,this._createSegmentDraftState(e)),M(this._segmentDrafts.get(t))}_setSegmentDraftState(e,t,r={}){var i,n,a;if(this._segmentDrafts.set(this._getSegmentsScopeKey(e),{from:(i=t==null?void 0:t.from)!=null?i:"",to:(n=t==null?void 0:t.to)!=null?n:"",color:(a=t==null?void 0:t.color)!=null?a:this._getSegmentDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshSegmentUi(e);return}this.ui.render()}_setSegmentDraftField(e,t,r){let i=this._getSegmentDraftState(e),n=t==="color"?j(r,this.array.cssText):D(r);this._setSegmentDraftState(e,{...i,[t]:n},{refreshOnly:!0})}_isSegmentFillStyle(e){return["bands","soft_bands","band_gradient"].includes(e)}_getDefaultSegments(){return[{from:"0%",to:"33%",color:"#4CAF50"},{from:"33%",to:"75%",color:"#FF9800"},{from:"75%",to:"100%",color:"#F44336"}]}_getStoredScopedSegments(e={type:"card"}){let t=this.context.read(e,["bar","segments"]);if(t!==void 0)return t;let r=this.context.read(e,["segments"]);if(r!==void 0)return r;let i=this.context.read(e,["severity"]);return i!==void 0?i:null}_parseSegmentBoundaryInput(e){let t=D(e).trim();if(!t)return null;let r=t.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/),i=r?parseFloat(r[1]):null;if(Number.isFinite(i))return`${i}%`;let n=K(t);return n===null?null:n}_formatSegmentBoundaryValue(e){if(typeof e=="string")return e;if(typeof e=="number"&&Number.isFinite(e))return String(e);if(b(e)){if(Number.isFinite(e.percent))return`${e.percent}%`;if(Number.isFinite(this._getFiniteNumber(e.fixed)))return String(this._getFiniteNumber(e.fixed))}return""}_getSegmentDraftColorDefault(e={type:"card"}){var r;let t=this._getScopedSegmentsValue(e);return t.length?D((r=t[t.length-1])==null?void 0:r.color).trim()||"#4a9eff":"#4CAF50"}_getNewSegmentDefaults(e={type:"card"}){var n;let t=this._getScopedSegmentsValue(e),r=t[t.length-1],i=(n=r==null?void 0:r.to)!=null?n:null;return{from:i!=null?i:"0%",to:"100%",color:"#4a9eff"}}_createSegmentDraftState(e={type:"card"}){var l;let t=this._getNewSegmentDefaults(e),r=this._formatSegmentBoundaryValue(t.from),i=this._formatSegmentBoundaryValue(t.to),n=r==="100%"||r==="100"?"":r;return{from:n,to:n?i:"",color:(l=t.color)!=null?l:this._getSegmentDraftColorDefault(e)}}_normalizeSegmentForEditorComparison(e){if(!b(e))return null;let t=this._formatSegmentBoundaryValue(e.from).trim(),r=this._formatSegmentBoundaryValue(e.to).trim(),i=O(e.color);return!t||!r||!i?null:{from:t,to:r,color:i}}_segmentsEqualForEditor(e,t){let r=Array.isArray(e)?e.map(n=>this._normalizeSegmentForEditorComparison(n)).filter(Boolean):[],i=Array.isArray(t)?t.map(n=>this._normalizeSegmentForEditorComparison(n)).filter(Boolean):[];return r.length!==i.length?!1:r.every((n,a)=>n.from===i[a].from&&n.to===i[a].to&&n.color===i[a].color)}_getFallbackSegments(e={type:"card"}){return(e==null?void 0:e.type)==="entity"&&this._getStoredScopedSegments({type:"card"})!==null?M(this._getScopedSegmentsValue({type:"card"})):this._isSegmentFillStyle(this.fillStyle(e))?M(this._getDefaultSegments()):[]}_parseSegmentBoundaryText(e){let t=D(e).trim();if(!t)return{state:"empty",value:null};let r=this._parseSegmentBoundaryInput(t);return r===null?{state:"invalid",value:null}:{state:"valid",value:r}}_compareSegmentBoundaries(e,t){let r=this._getSegmentPreviewBoundaryValue(e),i=this._getSegmentPreviewBoundaryValue(t);return r===null||i===null?null:r<i?-1:r>i?1:0}_buildSegmentValidationRows(e={type:"card"}){var r;return((r=this._getSegmentsUiRows(e))!=null?r:this._getScopedSegmentsValue(e)).map((i,n)=>{let a=this._getSegmentBoundaryText(e,n,"from",i==null?void 0:i.from),l=this._getSegmentBoundaryText(e,n,"to",i==null?void 0:i.to),s=this._parseSegmentBoundaryText(a),d=this._parseSegmentBoundaryText(l);return{index:n,rawFrom:a,rawTo:l,parsedFrom:s,parsedTo:d}})}_getAutomaticEndInputRows(e){return this._getScopedSegmentsValue(e).map((t,r)=>{let i=this._getSegmentBoundaryText(e,r,"from",t==null?void 0:t.from),n=this._getSegmentBoundaryText(e,r,"to",t==null?void 0:t.to);return{...t,from:i,...n.trim()?{to:n}:{to:void 0}}})}_resolveAutomaticEndRows(e,t){var s,d,c,u;let r=this.context.read({type:"card"},[]),i=(e==null?void 0:e.type)==="entity"?this.context.read(e,[]):{},n=Xe(r,null),a=gr((d=(s=this.ui).hass)==null?void 0:d.call(s),(e==null?void 0:e.type)==="entity"?Xe(i,{scale:n}):n),l=Je(t.map((h,f)=>({...h,to:typeof h.to=="string"&&!h.to.trim()?void 0:h.to,label:f})),{legacySegmentSpace:(u=(c=this.array).segmentSpace)==null?void 0:u.call(c)});return Pr({bar:{segments:l}},a.min,a.max)}_getAutomaticEndValidationMessage(e,t,r){let i=t[r];if(!i)return"";let n=this._parseSegmentBoundaryText(i.from),a=this._parseSegmentBoundaryText(i.to);if(n.state!=="valid"||a.state==="invalid")return"Enter valid from/to values.";let l=this._resolveAutomaticEndRows(e,t),s=l.find(d=>d.label===r);if(!s||s.from>=s.to)return"From must be below To.";for(let d of l)if(!(d.label===r||d.from>=d.to)){if(s.from===d.from)return"Duplicate segment start.";if(s.from<d.to&&s.to>d.from)return"Segments overlap."}return""}_getSegmentRowValidationMessage(e={type:"card"},t){if(this.array.autoEnds)return this._getAutomaticEndValidationMessage(e,this._getAutomaticEndInputRows(e),t);let r=this._buildSegmentValidationRows(e),i=r[t];if(!i)return"";if(i.parsedFrom.state==="invalid"||i.parsedTo.state==="invalid"||i.parsedFrom.state==="empty"||i.parsedTo.state==="empty")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(i.parsedFrom.value,i.parsedTo.value)!==-1)return"From must be below To.";let n=this._getSegmentPreviewBoundaryValue(i.parsedFrom.value),a=this._getSegmentPreviewBoundaryValue(i.parsedTo.value);for(let l of r){if(l.index===t||l.parsedFrom.state!=="valid"||l.parsedTo.state!=="valid")continue;let s=this._getSegmentPreviewBoundaryValue(l.parsedFrom.value),d=this._getSegmentPreviewBoundaryValue(l.parsedTo.value);if(n===s)return"Duplicate segment start.";if(n<d&&a>s)return"Segments overlap."}return""}_getValidSegmentDraft(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.color.trim()||!CSS.supports("color",t.color))return null;let d=[...this._getAutomaticEndInputRows(e),t];if(this._getAutomaticEndValidationMessage(e,d,d.length-1))return null;let c=this._parseSegmentBoundaryInput(t.from),u=this._parseSegmentBoundaryInput(t.to);return{from:c,...t.to.trim()?{to:u}:{},color:t.color}}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),n=D(t.color).trim();if(r.state!=="valid"||i.state!=="valid"||!n||this._compareSegmentBoundaries(r.value,i.value)!==-1)return null;let a=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),s=this._buildSegmentValidationRows(e);for(let d of s){if(d.parsedFrom.state!=="valid"||d.parsedTo.state!=="valid")continue;let c=this._getSegmentPreviewBoundaryValue(d.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(d.parsedTo.value);if(a===c||a<u&&l>c)return null}return{from:r.value,to:i.value,color:n}}_canAddSegment(e={type:"card"}){return!!this._getValidSegmentDraft(e)}_getSegmentDraftValidationMessage(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.from.trim())return"Enter a start value to add a segment.";if(!t.color.trim()||!CSS.supports("color",t.color))return"Enter a valid CSS color.";let d=[...this._getAutomaticEndInputRows(e),t];return this._getAutomaticEndValidationMessage(e,d,d.length-1)}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),n=D(t.color).trim();if(!D(t.from).trim()&&!D(t.to).trim())return"";if(r.state!=="valid"||i.state!=="valid")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(r.value,i.value)!==-1)return"From must be below To.";if(!n)return"Choose a color to add a segment.";let a=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),s=this._buildSegmentValidationRows(e);for(let d of s){if(d.parsedFrom.state!=="valid"||d.parsedTo.state!=="valid")continue;let c=this._getSegmentPreviewBoundaryValue(d.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(d.parsedTo.value);if(a===c)return"Duplicate segment start.";if(a<u&&l>c)return"Segments overlap."}return""}_getSegmentPreviewBoundaryValue(e){if(typeof e=="string"){let t=e.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);if(t){let r=parseFloat(t[1]);return Number.isFinite(r)?r:null}}if(typeof e=="number"&&Number.isFinite(e))return e;if(b(e)){if(Number.isFinite(e.percent))return e.percent;let t=this._getFiniteNumber(e.fixed);if(Number.isFinite(t))return t}return null}_sortSegmentsForEditor(e){return Array.isArray(e)?M(e).sort((t,r)=>{let i=this._getSegmentPreviewBoundaryValue(t==null?void 0:t.from),n=this._getSegmentPreviewBoundaryValue(r==null?void 0:r.from);return i===null&&n===null?0:i===null?1:n===null?-1:i-n}):[]}_getSegmentPreviewRows(e={type:"card"}){var n;if(this.array.autoEnds){let a=this._getValidSegmentDraft(e);return this._resolveAutomaticEndRows(e,[...this._getAutomaticEndInputRows(e),...a?[a]:[]])}let t=(n=this._getSegmentsUiRows(e))!=null?n:this._getScopedSegmentsValue(e),r=this._sortSegmentsForEditor(t),i=this._getValidSegmentDraft(e);return i&&r.push(i),this._sortSegmentsForEditor(r).filter(a=>{let l=this._getSegmentPreviewBoundaryValue(a==null?void 0:a.from),s=this._getSegmentPreviewBoundaryValue(a==null?void 0:a.to);return l!==null&&s!==null&&typeof(a==null?void 0:a.color)=="string"&&a.color.trim()})}_buildEditorSegmentPreviewStyle(e={type:"card"}){let t=this._getSegmentPreviewRows(e);if(!t.length)return"";let r=this.fillStyle(e),i=[];return t.forEach(n=>{let a=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(n.from))),l=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(n.to)));i.push(`${n.color} ${a}%`,`${n.color} ${l}%`)}),r==="bands"?`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`:`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`}_getSegmentPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-segment-preview`,trackId:`entity-${e.index}-segment-preview-track`}:{previewId:"card-segment-preview",trackId:"card-segment-preview-track"}}_renderSegmentPreview(e={type:"card"}){var l;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getSegmentPreviewRows(e),n=[];i.forEach(s=>{let d=this._getSegmentPreviewBoundaryValue(s.from),c=this._getSegmentPreviewBoundaryValue(s.to);d!==null&&n.push(d),c!==null&&n.push(c)});let a=[...new Set(n)].sort((s,d)=>s-d);return`
      <div id="${t}" class="gradient-preview segment-preview">
        <div id="${r}" class="gradient-preview-track segment-preview-track" style="${y((l=this._buildEditorSegmentPreviewStyle(e))!=null?l:"")}">
          ${a.map((s,d)=>`
            <span
              id="${t}-stop-${d}"
              class="gradient-preview-stop"
              style="left:${y(String(s))}%"
              title="${y(`${s}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_refreshSegmentPreview(e={type:"card"}){var s;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getShadowElementById(r);if(!i)return;i.setAttribute("style",(s=this._buildEditorSegmentPreviewStyle(e))!=null?s:"");let n=this._getSegmentPreviewRows(e),a=[];n.forEach(d=>{let c=this._getSegmentPreviewBoundaryValue(d.from),u=this._getSegmentPreviewBoundaryValue(d.to);c!==null&&a.push(c),u!==null&&a.push(u)});let l=[...new Set(a)].sort((d,c)=>d-c);i.innerHTML=l.map((d,c)=>`
      <span
        id="${t}-stop-${c}"
        class="gradient-preview-stop"
        style="left:${y(String(d))}%"
        title="${y(`${d}%`)}"
      ></span>
    `).join("")}_getSegmentDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{hintPrefix:`entity-${e.index}-segment-row-hint-`,draftHintId:`entity-${e.index}-segment-draft-hint`,addSelector:`button[data-action="add-entity-segment"][data-index="${e.index}"]`}:{hintPrefix:"segment-row-hint-",draftHintId:"segment-draft-hint",addSelector:'button[data-action="add-segment"]'}}_refreshSegmentUi(e={type:"card"}){var s,d;if(this._refreshSegmentPreview(e),!this.shadowRoot)return;let{hintPrefix:t,draftHintId:r,addSelector:i}=this._getSegmentDomIds(e),n=this.shadowRoot.querySelector(i);n&&(n.disabled=!this._canAddSegment(e)),((s=this._getSegmentsUiRows(e))!=null?s:this._getScopedSegmentsValue(e)).forEach((c,u)=>{var m;let h=this._getShadowElementById(`${t}${u}`),f=this._getSegmentRowValidationMessage(e,u);h&&(h.textContent=f,(m=h.setAttribute)==null||m.call(h,"style",f?"":"display:none"))});let l=this._getShadowElementById(r);if(l){let c=this._getSegmentDraftValidationMessage(e);l.textContent=c,(d=l.setAttribute)==null||d.call(l,"style",c?"":"display:none")}}_commitSegmentDraft(e={type:"card"}){var a;let t=this._getValidSegmentDraft(e);if(!t)return this._refreshSegmentUi(e),!1;let r=(a=this._getSegmentsUiRows(e))!=null?a:this._getScopedSegmentsValue(e),i=this._sortSegmentsForEditor([...r,t]),n=this._setScopedSegments(e,i,{rerender:!0},{type:"add",item:t});return n!==!1&&this._segmentDrafts.set(this._getSegmentsScopeKey(e),this._createSegmentDraftState(e)),n}_commitSegmentBoundaryEdit(e={type:"card"},t,r,i,n=null){var m,x,k,S,$;this._setSegmentBoundaryText(e,t,r,i);let a=this._parseSegmentBoundaryText(i);if(a.state!=="valid"&&!(this.array.autoEnds&&r==="to"&&a.state==="empty"))return(m=n==null?void 0:n.setCustomValidity)==null||m.call(n,"Enter a valid boundary value."),this._refreshSegmentUi(e),!1;if(this.array.patchOnly){let _=this._getSegmentRowValidationMessage(e,t);if(_)return(x=n==null?void 0:n.setCustomValidity)==null||x.call(n,_),(k=n==null?void 0:n.reportValidity)==null||k.call(n),this._refreshSegmentUi(e),!1}let l=D(i).trim(),s=this._parseSegmentBoundaryInput(i),d=this.array.autoEnds&&r==="to"&&!l?void 0:s===null?l:s,u=((S=this._getSegmentsUiRows(e))!=null?S:this._getScopedSegmentsValue(e)).map((_,g)=>g===t?{..._,[r]:d}:_);this._clearSegmentBoundaryText(e,t,r);let h=this._setScopedSegments(e,u,{rerender:!0},{type:"edit",index:t,field:r,value:d}),f=this._getSegmentRowValidationMessage(e,t);return n!=null&&n.setCustomValidity&&(n.setCustomValidity(f||""),f&&(($=n.reportValidity)==null||$.call(n))),h}_getScopedSegmentsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getSegmentsUiRows(e);if(t!==null)return M(t);let r=this._getStoredScopedSegments(e);return r!==null?this._sortSegmentsForEditor(r):this._sortSegmentsForEditor(this._getFallbackSegments(e))}_hasSegmentsOverride(e){return this._getStoredScopedSegments(e)!==null}_getSegmentsSummary(e){let t=this._getScopedSegmentsValue(e);return!Array.isArray(t)||t.length===0?"Inherited":(e==null?void 0:e.type)!=="entity"&&!this._hasSegmentsOverride(e)&&this._isSegmentFillStyle(this.fillStyle(e))?"Default bands":`${t.length} segments`}_setScopedSegments(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let a=e.index,l=this._getScopedSegmentsValue(e),s=!this._hasSegmentsOverride(e);return`
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
                          ${this._renderListRows(l,(d,c)=>{var u;return`
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${a}" data-segment-index="${c}" value="${y(this._getSegmentBoundaryText(e,c,"from",d==null?void 0:d.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${a}" data-segment-index="${c}" value="${y(this._getSegmentBoundaryText(e,c,"to",d==null?void 0:d.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${a}" data-segment-index="${c}" value="${y((u=d==null?void 0:d.color)!=null?u:"#4a9eff")}">
                              <button type="button" data-action="remove-entity-segment" data-index="${a}" data-segment-index="${c}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                            <div id="entity-${a}-segment-row-hint-${c}" class="section-note"${this._getSegmentRowValidationMessage(e,c)?"":' style="display:none"'}>${y(this._getSegmentRowValidationMessage(e,c))}</div>
                            </div>
                          `})}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${a}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${a}" value="${y(this._getSegmentDraftState(e).from)}" placeholder="0%">
                              <input id="entity-${a}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${a}" value="${y(this._getSegmentDraftState(e).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${a}" value="${y(this._getSegmentDraftState(e).color||"#4a9eff")}">
                              <button type="button" data-action="add-entity-segment" data-index="${a}"${this._canAddSegment(e)?"":" disabled"}>Add</button>
                            </div>
                            <div id="entity-${a}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(e)?"":' style="display:none"'}>${y(this._getSegmentDraftValidationMessage(e))}</div>
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
	                  ${this._renderListRows(i,(a,l)=>{var s,d;return`
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} start"`:""} data-kind="segment-from" data-index="${l}" value="${y(this._getSegmentBoundaryText({type:"card"},l,"from",a==null?void 0:a.from))}" placeholder="0%">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} end (blank = Auto)"`:""} data-kind="segment-to" data-index="${l}" value="${y(this._getSegmentBoundaryText({type:"card"},l,"to",a==null?void 0:a.to))}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
	                      ${this.array.cssText?I({id:`segment-color-${l}`,kind:"segment-color",index:l,value:(s=a==null?void 0:a.color)!=null?s:"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:`Segment ${l+1} color`}):`<input type="color" data-kind="segment-color" data-index="${l}" value="${y((d=a==null?void 0:a.color)!=null?d:"#4a9eff")}">`}
	                      <button type="button" data-action="remove-segment" data-index="${l}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
                      <div id="segment-row-hint-${l}" class="section-note"${this._getSegmentRowValidationMessage({type:"card"},l)?"":' style="display:none"'}>${y(this._getSegmentRowValidationMessage({type:"card"},l))}</div>
                      </div>
	                  `})}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds?' aria-label="New segment start"':""} data-kind="segment-draft-from" value="${y(this._getSegmentDraftState({type:"card"}).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds?' aria-label="New segment end (blank = Auto)"':""} data-kind="segment-draft-to" value="${y(this._getSegmentDraftState({type:"card"}).to)}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
                        ${this.array.cssText?I({id:"segment-draft-color",kind:"segment-draft-color",value:this._getSegmentDraftState({type:"card"}).color||"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:"New segment color"}):`<input type="color" data-kind="segment-draft-color" value="${y(this._getSegmentDraftState({type:"card"}).color||"#4a9eff")}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({type:"card"})?"":" disabled"}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({type:"card"})?"":' style="display:none"'}>${y(this._getSegmentDraftValidationMessage({type:"card"}))}</div>
                    </div>
	                </div>
	              </div>
	            `})}
	        </div>`}};var Ee=class extends $e{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._gradientStopsDrafts=new Map,this._gradientStopsUiRows=new Map,this._gradientStopPosTexts=new Map,this._gradientStopValidationMessages=new Map}_setGradientStops(e,t={}){return this._setScopedGradientStops({type:"card"},e,t)}_getDefaultGradientStops(){return[{pos:0,color:"#4CAF50"},{pos:50,color:"#FF9800"},{pos:100,color:"#F44336"}]}_normalizeGradientStopPosValue(e){let t=re(e),r=Number.isFinite(t)?t:K(e);return r===null||!Number.isFinite(r)||r<0||r>100?null:r}_sanitizeGradientStopsForEmit(e){return Array.isArray(e)?e.map(t=>{if(!b(t))return null;let r=this._normalizeGradientStopPosValue(t.pos),i=D(t.color).trim();return r===null||!i?null:{...t,pos:r,color:i}}).filter(Boolean).sort((t,r)=>t.pos-r.pos):[]}_getGradientStopDraftColorDefault(e={type:"card"}){var r;let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return t.length?(r=t[t.length-1].color)!=null?r:"#4CAF50":this._getDefaultGradientStops()[0].color}_getNextSuggestedGradientStopPos(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));if(!t.length)return 0;let r=t[t.length-1];if(r.pos>=100)return"";let i;if(t.length===1)i=r.pos+25;else{let a=t[t.length-2];i=r.pos+(r.pos-a.pos)}let n=Math.min(100,Math.max(0,i));return t.some(a=>a.pos===n)?"":n}_getGradientStopsDraftKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGradientStopPosTextKey(e,t){return`${this._getGradientStopsDraftKey(e)}:pos:${t}`}_getGradientStopPosText(e={type:"card"},t,r=""){let i=this._getGradientStopPosTextKey(e,t);return this._gradientStopPosTexts.has(i)?this._gradientStopPosTexts.get(i):r===""||r===null||r===void 0?"":String(r)}_setGradientStopPosText(e,t,r){this._gradientStopPosTexts.set(this._getGradientStopPosTextKey(e,t),D(r))}_clearGradientStopPosText(e,t){this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(e,t))}_clearGradientStopScopeTextState(e){let t=`${this._getGradientStopsDraftKey(e)}:pos:`;for(let r of this._gradientStopPosTexts.keys())r.startsWith(t)&&this._gradientStopPosTexts.delete(r);for(let r of this._gradientStopValidationMessages.keys())r.startsWith(t)&&this._gradientStopValidationMessages.delete(r)}_getGradientStopsUiRows(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsUiRows.has(t)?M(this._gradientStopsUiRows.get(t)):null}_setGradientStopsUiRows(e,t){this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(e),M(t))}_getStoredScopedGradientStops(e={type:"card"}){let t=this.context.read(e,["bar","gradient_stops"]);if(t!==void 0)return t;let r=this.context.read(e,["gradient_stops"]);return r!==void 0?r:null}_getFallbackGradientStops(e={type:"card"}){if((e==null?void 0:e.type)==="entity"){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({type:"card"}));return t.length?t:this._getDefaultGradientStops()}return this._getDefaultGradientStops()}_createGradientStopDraftState(e={type:"card"}){let t=this._getNextSuggestedGradientStopPos(e);return{pos:t===""?"":String(t),color:this._getGradientStopDraftColorDefault(e)}}_getGradientStopsDraftState(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsDrafts.has(t)||this._gradientStopsDrafts.set(t,this._createGradientStopDraftState(e)),M(this._gradientStopsDrafts.get(t))}_setGradientStopsDraftState(e,t,r={}){var i,n;if(this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(i=t==null?void 0:t.pos)!=null?i:"",color:(n=t==null?void 0:t.color)!=null?n:this._getGradientStopDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshGradientDraftUi(e);return}this.ui.render()}_setGradientStopsDraftField(e,t,r){let i=this._getGradientStopsDraftState(e),n=t==="color"?D(r).trim():D(r);this._setGradientStopsDraftState(e,{...i,[t]:n},{refreshOnly:t==="pos"})}_getValidGradientDraftStop(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=this._normalizeGradientStopPosValue(t.pos),i=D(t.color).trim();return r===null||!i?null:{pos:r,color:i}}_hasGradientStopDuplicate(e={type:"card"},t,r=null){return this.array.patchOnly?this._getScopedGradientStopsValue(e).some((i,n)=>n!==r&&this._normalizeGradientStopPosValue(i==null?void 0:i.pos)===t):this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)).some((i,n)=>n!==r&&i.pos===t)}_canAddGradientStop(e={type:"card"}){let t=this._getValidGradientDraftStop(e);return t?!this._hasGradientStopDuplicate(e,t.pos):!1}_getGradientDraftValidationMessage(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=D(t.pos).trim(),i=D(t.color).trim();return r?this._normalizeGradientStopPosValue(t.pos)===null?"Enter a value from 0 to 100.":i?this._hasGradientStopDuplicate(e,this._normalizeGradientStopPosValue(t.pos))?"Position already exists.":"":"Choose a color to add a stop.":"Enter a position to add a stop."}_isDefaultGradientStops(e){let t=this._sanitizeGradientStopsForEmit(e),r=this._getDefaultGradientStops();return t.length!==r.length?!1:t.every((i,n)=>i.pos===r[n].pos&&O(i.color)===O(r[n].color))}_clearGradientStopsOverride(e){var i;let t=J((i=this._getGradientStopsUiRows(e))!=null?i:[]);this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(e)),this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(e)),this._clearGradientStopScopeTextState(e);let r=this.context.mutate(e,n=>{let a=p(n,["bar","gradient_stops"]);return a=p(a,["gradient_stops"]),a=C(a,["bar"]),a},{rerender:!0});return r===!1&&t!==J([])&&this.ui.render(),r}_getGradientStopsValue(){return this._getScopedGradientStopsValue({type:"card"})}_commitGradientStopDraft(e={type:"card"}){let t=this._getValidGradientDraftStop(e);if(!t||this._hasGradientStopDuplicate(e,t.pos))return this._refreshGradientDraftUi(e),!1;let i=[...this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),t].sort((a,l)=>a.pos-l.pos),n=this._setScopedGradientStops(e,i,{rerender:!0},{type:"add",item:t});return n!==!1&&this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(()=>{let a=this._getNextSuggestedGradientStopPos(e);return a===""?"":String(a)})(),color:t.color}),n}_getGradientPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-gradient-preview`,trackId:`entity-${e.index}-gradient-preview-track`,hintId:`entity-${e.index}-gradient-draft-hint`,addSelector:`button[data-action="add-entity-gradient-stop"][data-index="${e.index}"]`,draftInputId:`entity-${e.index}-gradient-draft-pos`}:{previewId:"card-gradient-preview",trackId:"card-gradient-preview-track",hintId:"gradient-draft-hint",addSelector:'button[data-action="add-gradient-stop"]',draftInputId:"gradient-draft-pos"}}_refreshGradientDraftUi(e={type:"card"}){var S,$,_;if(!this.shadowRoot)return;let t=($=(S=this.shadowRoot.getElementById)==null?void 0:S.bind(this.shadowRoot))!=null?$:(g=>{var v,w,E;return(E=(w=(v=this.shadowRoot).querySelector)==null?void 0:w.call(v,`#${g}`))!=null?E:null}),{previewId:r,trackId:i,hintId:n,addSelector:a,draftInputId:l}=this._getGradientPreviewDomIds(e),s=this.shadowRoot.querySelector(a);s&&(s.disabled=!this._canAddGradientStop(e));let d=t(l);if(d&&typeof d.closest!="function"){this.ui.render();return}let c=d==null?void 0:d.closest(".gradient-stop-draft"),u=this._getGradientDraftValidationMessage(e),h=t(n);if(u){if(h)h.textContent=u;else if(c){let g=document.createElement("div");g.id=n,g.className="section-note",g.textContent=u,c.appendChild(g)}}else h&&h.remove();let f=t(r),m=t(i);if(!f||!m)return;m.setAttribute("style",(_=this._getGradientPreviewStyle(e))!=null?_:"");let x=this._buildGradientPreviewEffectiveStops(e),k=x.length?x:this._getDefaultGradientStops();m.innerHTML=k.map((g,v)=>`
      <span
        id="${r}-stop-${v}"
        class="gradient-preview-stop"
        style="left:${y(String(g.pos))}%"
        title="${y(`${g.pos}%`)}"
      ></span>
    `).join("")}_commitGradientStopPosEdit(e={type:"card"},t,r,i=null){let n=this._normalizeGradientStopPosValue(r);if(n===null||this._hasGradientStopDuplicate(e,n,t))return i!=null&&i.setCustomValidity&&(i.setCustomValidity(n===null?"Enter a value from 0 to 100.":"Position already exists."),i.reportValidity&&i.reportValidity()),!1;i!=null&&i.setCustomValidity&&i.setCustomValidity("");let l=this._getScopedGradientStopsValue(e).map((s,d)=>d===t?{...s,pos:n}:s);return this._clearGradientStopPosText(e,t),this._setScopedGradientStops(e,l,{rerender:!0},{type:"edit",index:t,field:"pos",value:n})}_getScopedGradientStopsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getGradientStopsUiRows(e);if(Array.isArray(t))return t;let r=this._getStoredScopedGradientStops(e);return r!==null?this._sanitizeGradientStopsForEmit(r):M(this._getFallbackGradientStops(e))}_hasGradientStopsOverride(e){if(this._getStoredScopedGradientStops(e)!==null)return!0;let t=this._getGradientStopsUiRows(e);return Array.isArray(t)?J(this._sanitizeGradientStopsForEmit(t))!==J(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(e))):!1}_getGradientStopsSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasGradientStopsOverride(e))return"Inherited";let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return this.fillStyle(e)!=="gradient"?"Inactive fill style":t.length?this._isDefaultGradientStops(t)?"Default gradient":`${t.length} stops`:(e==null?void 0:e.type)==="entity"?"Inherited":"Default gradient"}_buildGradientPreviewEffectiveStops(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),r=this._getValidGradientDraftStop(e),i=[...t];return r&&!this._hasGradientStopDuplicate(e,r.pos)&&i.push(r),i.sort((n,a)=>n.pos-a.pos)}_buildEditorGradientPreviewStyle(e){if(!Array.isArray(e)||!e.length)return"";let t=e.map(r=>{var a;let i=D(r.color).trim(),n=this._normalizeGradientStopPosValue((a=r.p)!=null?a:r.pos);return!i||n===null?null:`${i} ${n}%`}).filter(Boolean);return t.length?`background:linear-gradient(to right,${t.join(",")});background-repeat:no-repeat;`:""}_getGradientPreviewStyle(e={type:"card"}){let t=this._buildGradientPreviewEffectiveStops(e),r=t.length>=2?t.map(i=>({p:i.pos,color:i.color})):this._getDefaultGradientStops().map(i=>({p:i.pos,color:i.color}));return this._buildEditorGradientPreviewStyle(r)}_renderGradientPreview(e={type:"card"},t={}){var l,s,d;let r=(l=t.previewId)!=null?l:"gradient-preview",i=(s=t.trackId)!=null?s:`${r}-track`,n=this._buildGradientPreviewEffectiveStops(e),a=n.length?n:this._getDefaultGradientStops();return`
      <div id="${r}" class="gradient-preview">
        <div id="${i}" class="gradient-preview-track" style="${y((d=this._getGradientPreviewStyle(e))!=null?d:"")}">
          ${a.map((c,u)=>`
            <span
              id="${r}-stop-${u}"
              class="gradient-preview-stop"
              style="left:${y(String(c.pos))}%"
              title="${y(`${c.pos}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_setScopedGradientStops(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let s=e.index,d=this._getScopedGradientStopsValue(e),c=this._getGradientStopsDraftState(e),u=this._getGradientDraftValidationMessage(e),h=!this._hasGradientStopsOverride(e);return`
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
                          ${this._renderListRows(d,(f,m)=>{var x,k;return`
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${s}" data-stop-index="${m}" value="${y(this._getGradientStopPosText(e,m,(x=f==null?void 0:f.pos)!=null?x:""))}" placeholder="0">
                              ${I({id:`entity-${s}-gradient-color-${m}`,kind:"entity-gradient-color",index:s,value:(k=f==null?void 0:f.color)!=null?k:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value",extraDataset:{"stop-index":m}})}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${s}" data-stop-index="${m}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                          `})}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${s}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${s}" value="${y(c.pos)}" placeholder="0">
                              ${I({id:`entity-${s}-gradient-draft-color`,kind:"entity-gradient-draft-color",index:s,value:c.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${s}"${this._canAddGradientStop(e)?"":" disabled"}>Add</button>
                            </div>
                            ${u?`<div id="entity-${s}-gradient-draft-hint" class="section-note">${y(u)}</div>`:""}
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
	                  ${this._renderListRows(r,(s,d)=>{var c,u;return`
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${d}" value="${y(this._getGradientStopPosText({type:"card"},d,(c=s==null?void 0:s.pos)!=null?c:""))}" placeholder="0">
	                      ${I({id:`gradient-color-${d}`,kind:"gradient-color",index:d,value:(u=s==null?void 0:s.color)!=null?u:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${d}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
	                  `})}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${y(i.pos)}" placeholder="0">
	                      ${I({id:"gradient-draft-color",kind:"gradient-draft-color",index:"card",value:i.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({type:"card"})?"":" disabled"}>Add</button>
	                    </div>
	                    ${n?`<div id="gradient-draft-hint" class="section-note">${y(n)}</div>`:""}
	                  </div>
	                </div>
	              </div>
	            `})}
	        </div>`}};var Ve=class{constructor(e,t={}){this.options=t,this.context=e}_setNeedle(e){return this._setScopedNeedleMode({type:"card"},e?"enabled":"disabled")}_getScopedNeedleConfig(e){var a;let t=this.context.read(e,["bar","needle"]),r="#ffffff",i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",n="";return typeof t=="boolean"?i=t?"enabled":"disabled":b(t)&&(t.show===!0?i="enabled":(t.show===!1||(e==null?void 0:e.type)!=="entity")&&(i="disabled"),n=(a=t.color)!=null?a:""),n===r&&(n=""),{mode:i,color:n}}_hasNeedleOverride(e){return this.context.read(e,["bar","needle"])!==void 0}_getEffectiveScopedNeedleConfig(e){let t=this._getScopedNeedleConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasNeedleOverride(e))return this._getScopedNeedleConfig({type:"card"});let r=this._getScopedNeedleConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_setScopedNeedleMode(e,t){return this.context.mutate(e,r=>{let i=M(r),n=G(i,["bar","needle"]),a=b(n)?n.color:void 0;if(i=p(i,["bar","needle"]),(e==null?void 0:e.type)==="entity"&&t==="inherit")return i=C(i,["bar"]),i;if(t==="disabled")return(e==null?void 0:e.type)==="entity"&&(i=P(i,["bar","needle"],{show:!1})),i=C(i,["bar"]),i;let l={show:!0};return a&&a!=="#ffffff"&&(l.color=a),i=P(i,["bar","needle"],l),i=C(i,["bar"]),i},{needleEdit:{field:"mode",value:t}})}_setScopedNeedleColor(e,t){let r=j(t,this.options.cssText);return this.context.mutate(e,i=>{let n=M(i),a=this._getScopedNeedleConfig(e),l=r&&O(r)!==O("#ffffff");if(n=p(n,["bar","needle","color"]),(e==null?void 0:e.type)!=="entity"&&a.mode==="disabled")return n=C(n,["bar","needle"]),n=C(n,["bar"]),n;let s=a.mode==="enabled"?!0:a.mode==="disabled"?!1:void 0,d={};return s!==void 0&&(d.show=s),l&&(d.color=r),Object.keys(d).length?n=P(n,["bar","needle"],d):n=p(n,["bar","needle"]),n=C(n,["bar","needle"]),n=C(n,["bar"]),n},{needleEdit:{field:"color",value:r}})}_getNeedleValue(){return this._getScopedNeedleConfig({type:"card"}).mode==="enabled"}_removeScopedNeedle(e){return this.context.mutate(e,t=>{let r=p(t,["bar","needle"]);return r=C(r,["bar"]),r})}_getNeedleSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasNeedleOverride(e))return"Inherited";let t=this._getScopedNeedleConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");return t==="entity-needle-inherit"?(i&&this._removeScopedNeedle(n),!0):["bar-needle-mode","needle-mode"].includes(a)?(this._setScopedNeedleMode(n,i),!0):["bar-needle-color","needle-color"].includes(a)?(this._setScopedNeedleColor(n,i),!0):!1}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let i=e.index,n=!this._hasNeedleOverride(e),a=this._getEffectiveScopedNeedleConfig(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${i}"${n?" checked":""}>
                          <label for="entity-${i}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${i}-needle-mode">Needle mode</label>
	                        <select id="entity-${i}-needle-mode" data-kind="entity-needle-mode" data-index="${i}" value="${y(a.mode)}">
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
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${y(r.mode)}">
                <option value="disabled"${r.mode==="disabled"?" selected":""}>disabled</option>
                <option value="enabled"${r.mode==="enabled"?" selected":""}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${I({cssText:this.options.cssText,label:"Needle color",id:"bar-needle-color",field:"bar-needle-color",value:r.color,fallbackHex:"#ffffff",placeholder:"#ffffff"})}
            </div>
          </div>`}};var Pe=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._baselineColorDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getBaselineColorDraftKey(e={type:"card"},t="above"){return`${(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}:${t}`}_setBaselineColorDraft(e,t,r){let i=j(r,this.options.cssText),n=this._getBaselineColorDraftKey(e,t);i?this._baselineColorDrafts.set(n,i):this._baselineColorDrafts.delete(n)}_getBaselineColorDraft(e,t){var r;return(r=this._baselineColorDrafts.get(this._getBaselineColorDraftKey(e,t)))!=null?r:""}_isBaselineDirectionalColorEnabled(e,t){return!!D(this._getBaselineDirectionalColorValue(e,t)).trim()}_setBaselineDirectionalColorEnabled(e,t,r){let i=j(this._getBaselineDirectionalColorValue(e,t),this.options.cssText);if(!r)return i&&this._setBaselineColorDraft(e,t,i),this._removeColor(e,["baseline",t,"color"],{prunePaths:[["baseline",t],["baseline"]]});let n=this._getBaselineColorDraft(e,t)||j(this._getEffectiveBaselineDirectionalColorValue(e,t),this.options.cssText)||i||"#000000";return this._setColor(e,["baseline",t,"color"],n,{prunePaths:[["baseline",t],["baseline"]]})}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:pt(this.context.source({type:"card"},"baseline"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="baseline-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"baseline","mode",t),!0;if(e!=="baseline-percent")return!1;let i=Se(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"baseline","percent",i),!0}_getBaselineResolvableValue(e){return this.context.source(e,"baseline")}_getEffectiveBaselineResolvableValue(e){return this.context.source(e,"baseline",!0)}_getBaselineMode(e){let t=this.context.read(e,["baseline","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasBaselineOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getEffectiveBaselineMode(e){let t=this._getBaselineMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getBaselineMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getBaselineResolvableValue({type:"card"});return be(i)||this._getBaselineDirectionalColorValue({type:"card"},"above")||this._getBaselineDirectionalColorValue({type:"card"},"below")?"enabled":"disabled"}_setBaselineMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearBaselineOverride(e):this.context.mutate(e,r=>{let i=M(r);return t==="auto"?i=p(i,["baseline","enabled"]):i=P(i,["baseline","enabled"],t==="enabled"),i=C(i,["baseline"]),i},{baselineEdit:{path:["enabled"],value:t==="auto"?void 0:t==="enabled"}})}_setBaselineDirectionalColor(e,t,r){let i=j(r,this.options.cssText);this._setBaselineColorDraft(e,t,i);let n=["baseline",t,"color"];return i?this._isBaselineDirectionalColorEnabled(e,t)?this.context.mutate(e,a=>P(a,n,i),{baselineEdit:{path:[t,"color"],value:i}}):this._setBaselineDirectionalColorEnabled(e,t,!0):this._removeColor(e,n,{prunePaths:[["baseline",t],["baseline"]]})}_getBaselineDirectionalColorValue(e,t){var r;return(r=this.context.read(e,["baseline",t,"color"]))!=null?r:""}_getEffectiveBaselineDirectionalColorValue(e,t){var i;let r=this.context.read(e,["baseline",t,"color"]);return r!=null&&r!==""?r:(e==null?void 0:e.type)==="entity"&&(i=this.context.read({type:"card"},["baseline",t,"color"]))!=null?i:""}_clearBaselineOverride(e){return this.context.mutate(e,t=>{let r=M(t),i=G(r,["baseline"]);return b(i)?(r=p(r,["baseline","enabled"]),r=p(r,["baseline","at"]),r=p(r,["baseline","above","color"]),r=p(r,["baseline","below","color"])):r=p(r,["baseline"]),r=C(r,["baseline","above"]),r=C(r,["baseline","below"]),r=C(r,["baseline"]),r},{rerender:!0})}_removeBaseline(e){return this.context.mutate(e,t=>p(t,["baseline"]),{rerender:!0})}_hasBaselineOverride(e){let t=this.context.read(e,["baseline"]);return b(t)&&Object.keys(t).length?!0:!b(t)&&t!==void 0&&t!==null&&t!==""}_getBaselineOverrideSummary(e){if(this._getBaselineMode(e)==="disabled")return"Disabled";let r=[],i=this._getBaselineResolvableValue(e);return i.fixed!==""&&i.fixed!==void 0&&r.push(`Baseline ${i.fixed}`),i.entity&&r.push("Entity"),this._getBaselineDirectionalColorValue(e,"above")&&r.push("Above"),this._getBaselineDirectionalColorValue(e,"below")&&r.push("Below"),r.length?r.join(" \u2022 "):"Inherited"}_getCardBaselineSummary(){let e=this._getBaselineMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getBaselineResolvableValue({type:"card"}),r=t.entity||(t.fixed!==""&&t.fixed!==void 0?t.fixed:""),i=e==="enabled"?"Enabled":"Auto";return r!==""?`${i} \xB7 ${r}`:i}_setBaselineResolvablePart(e,t,r){return this.context.setSource(e,"baseline",t,r)}_setColor(e,t,r,i={}){return this.context.mutate(e,n=>{var l;let a=r===void 0?p(n,t):P(n,t,r);for(let s of(l=i.prunePaths)!=null?l:[])a=C(a,s);return a},{...i,baselineEdit:{path:t.slice(1),value:r}})}_removeColor(e,t,r){return this._setColor(e,t,void 0,r)}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(a,i,n))return!0;if(t==="entity-baseline-inherit")return i&&this._clearBaselineOverride(n),!0;if(a==="baseline-mode")return this._setBaselineMode(n,i),!0;if(a==="baseline-value")return this._setBaselineResolvablePart(n,"fixed",i),!0;if(a==="baseline-entity-source")return this._setBaselineResolvablePart(n,"entity",i),!0;for(let l of["above","below"]){if(a===`baseline-${l}-color`)return this._setBaselineDirectionalColor(n,l,i),!0;if(a===`baseline-${l}-color-enabled`)return this._setBaselineDirectionalColorEnabled(n,l,i),!0}return!1}handleClick(e){var t,r;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="baseline-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"baseline","percent",null),!0):((r=e==null?void 0:e.dataset)==null?void 0:r.action)!=="remove-baseline"?!1:(this._removeBaseline(e.dataset.scopeType==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}),!0)}render(e={type:"card"},t=({content:r})=>r){var l,s;if((e==null?void 0:e.type)==="entity"){let d=e.index,c=!this._hasBaselineOverride(e),u=this._getEffectiveBaselineResolvableValue(e),h=this._getEffectiveBaselineMode(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${d}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${d}"${c?" checked":""}>
	                          <label for="entity-${d}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <button type="button" data-action="remove-baseline" data-scope-type="entity" data-index="${d}" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-baseline-mode">Baseline mode</label>
                        <select id="entity-${d}-baseline-mode" data-kind="entity-baseline-mode" data-index="${d}" value="${y(h)}">
                          <option value="enabled"${h==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${h==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-baseline-value">Baseline fallback</label>
                        <input id="entity-${d}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${d}" value="${y(u.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${W("entity-baseline-entity-source",d,u.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${d}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${d}"${this._isBaselineDirectionalColorEnabled(e,"above")?" checked":""}>
                          <label for="entity-${d}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-baseline-above-color">Above-baseline color</label>
                        ${I({cssText:this.options.cssText,label:"Baseline color",id:`entity-${d}-baseline-above-color`,kind:"entity-baseline-above-color",index:d,value:this._getEffectiveBaselineDirectionalColorValue(e,"above"),fallbackHex:"#000000",placeholder:"inherit card default"})}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${d}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${d}"${this._isBaselineDirectionalColorEnabled(e,"below")?" checked":""}>
                            <label for="entity-${d}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${d}-baseline-below-color">Below-baseline color</label>
	                        ${I({cssText:this.options.cssText,label:"Baseline color",id:`entity-${d}-baseline-below-color`,kind:"entity-baseline-below-color",index:d,value:this._getEffectiveBaselineDirectionalColorValue(e,"below"),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let r=this._getBaselineResolvableValue(e),i=this._getBaselineMode(e),n=this._getBaselineDirectionalColorValue(e,"above"),a=this._getBaselineDirectionalColorValue(e,"below");return`
          ${t({group:"baseline",title:"Baseline",summary:this._getCardBaselineSummary(),content:`
          <div class="field-grid">
            <div class="field-row">
              <button type="button" data-action="remove-baseline" data-scope-type="card" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${y(i)}">
                <option value="auto"${i==="auto"?" selected":""}>auto</option>
                <option value="enabled"${i==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${i==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            ${this.options.percentSources?gt("baseline",this._getSourceMode(),(s=(l=this._percentageDraft)!=null?l:r.percent)!=null?s:""):""}<div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${y(r.fixed)}">
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
`}};function Ht(o,e){return o==="text"?D(e).replace(/\s+/g," ").trim():o==="entity"?D(e).trim():["show","showValue","showUnit","show_value","show_unit"].includes(o)?e===!0:ie(e)}function Te(o,e,t,r){var c;let i=o.read(e,[t]),n=b(i==null?void 0:i.label)?i.label:{},a=(e==null?void 0:e.type)==="entity"?(c=o.read({type:"card"},[t,"label"]))!=null?c:{}:{},l=u=>Object.prototype.hasOwnProperty.call(n,u),s=(u,h)=>{var f;return l(u)?n[u]:(f=a[u])!=null?f:h},d=s("precision",s("decimal",""));return{show:r,text:s("text",""),showValue:s("show_value",!0)!==!1,showUnit:s("show_unit",!0)!==!1,precision:d===null?"":d}}function Fe(o,e,t,r,i){let n=r==="showValue"?"show_value":r==="showUnit"?"show_unit":r==="precision"?"precision":r,a=r==="text",l=Ht(r,i);return r==="precision"&&i!==""&&l===null?!1:o.mutate(e,s=>{var m,x,k,S;let d=M(s);t==="target"&&r==="show"&&(d=p(d,["show_target_label"]));let c=b(G(d,[t]))?M(G(d,[t])):{},u=b(c.label)?M(c.label):{},h=(e==null?void 0:e.type)==="entity"?(m=o.read({type:"card"},[t,"label"]))!=null?m:{}:{},f=r==="precision"?(k=(x=h.precision)!=null?x:h.decimal)!=null?k:null:(S=h[n])!=null?S:r==="show"?!1:r==="showValue"||r==="showUnit"?!0:void 0;return l===null||a&&!l?a&&(e==null?void 0:e.type)==="entity"&&typeof h.text=="string"&&h.text.trim()?u[n]="":delete u[n]:(e==null?void 0:e.type)==="entity"&&l===f||(r==="show"||r==="showValue"||r==="showUnit")&&(e==null?void 0:e.type)!=="entity"&&l===(r!=="show")?delete u[n]:u[n]=l,r==="precision"&&delete u.decimal,Object.keys(u).length?c.label=u:delete c.label,Object.keys(c).length?d=P(d,[t],c):d=p(d,[t]),d},{markerEdit:{key:t,path:["label",n],value:l,field:r}})}function ue(o,e,t){let r=o.read(e,[t,"direction"]),i=r!==void 0?r:o.read(e,[`${t}_marker`,"direction"]);return(e==null?void 0:e.type)==="entity"&&i===void 0?ue(o,{type:"card"},t):Y(i)}function Me(o,e,t,r){let i=Y(r),n=ue(o,{type:"card"},t),a=(e==null?void 0:e.type)!=="entity"&&i==="inward"||(e==null?void 0:e.type)==="entity"&&i===n?void 0:i;return o.mutate(e,l=>C(a===void 0?p(l,[t,"direction"]):P(l,[t,"direction"],a),[t]),{prunePaths:[[t]],markerEdit:{key:t,path:["direction"],value:i}})}var Ce=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._targetAboveFillDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getCardTargetMarkerSummary(){let e=this._getTargetMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getTargetResolvableValue({type:"card"}),r=[];e==="enabled"&&r.push("Enabled");let i=t.fixed!==""&&t.fixed!==void 0||!!t.entity;return t.fixed!==""&&t.fixed!==void 0&&r.push(String(t.fixed)),t.entity&&r.push(t.entity),(i||this._hasTargetShape({type:"card"}))&&r.push(this._getEffectiveTargetShapeValue({type:"card"})==="triangle"?"Triangle":"Diamond"),r.length?r.join(" \xB7 "):"Automatic"}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:pt(this.context.source({type:"card"},"target"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="target-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"target","mode",t),!0;if(e!=="target-percent")return!1;let i=Se(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"target","percent",i),!0}_getTargetResolvableValue(e){return this.context.source(e,"target")}_getEffectiveTargetResolvableValue(e){return this.context.source(e,"target",!0)}_getTargetMode(e){let t=this.context.read(e,["target","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasTargetOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getTargetShapeValue(e){var t;return(t=this.context.read(e,["target","shape"]))!=null?t:""}_hasTargetShape(e){let t=this.context.read(e,["target"]);return b(t)&&Object.prototype.hasOwnProperty.call(t,"shape")}_getEffectiveTargetShapeValue(e){return(e==null?void 0:e.type)==="entity"&&!this._hasTargetShape(e)?this._getEffectiveTargetShapeValue({type:"card"}):fe(this._getTargetShapeValue(e))}_setTargetShape(e,t){let r=fe(t);return(e==null?void 0:e.type)!=="entity"&&r==="diamond"?this._remove(e,["target","shape"],{prunePaths:[["target"]]}):this._setText(e,["target","shape"],r,{prunePaths:[["target"]]})}_getEffectiveTargetMode(e){let t=this._getTargetMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getTargetMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getTargetResolvableValue({type:"card"});return be(i)||this._hasCustomTargetColor({type:"card"})||this._getTargetLabelShowValue({type:"card"})||this._getTargetAboveFillColorValue({type:"card"})?"enabled":"disabled"}_setTargetMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearTargetOverride(e):t==="auto"?this._remove(e,["target","enabled"],{prunePaths:[["target"]]}):this._write(e,["target","enabled"],t==="enabled",{prunePaths:[["target"]]})}_setTargetResolvablePart(e,t,r){return this.context.setSource(e,"target",t,r)}_clearTargetOverride(e){return this.context.mutate(e,t=>{let r=M(t),i=G(r,["target"]);return b(i)?(r=p(r,["target","enabled"]),r=p(r,["target","at"]),r=p(r,["target","color"]),r=p(r,["target","shape"]),r=p(r,["target","direction"]),r=p(r,["target","label","show"]),r=p(r,["target","label","decimal"]),r=p(r,["target","when_exceeded","fill_color"])):r=p(r,["target"]),r=p(r,["target_entity"]),r=p(r,["target_color"]),r=p(r,["show_target_label"]),r=p(r,["above_target_color"]),r=C(r,["target","label"]),r=C(r,["target","when_exceeded"]),r=C(r,["target"]),r},{rerender:!0})}_getTargetColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","color"]))!=null?t:this.context.read(e,["target_color"]))!=null?r:""}_getEffectiveTargetColorValue(e){return this._effectiveDisplay(e,["target","color"],[["target_color"]])}_hasCustomTargetColor(e){let t=this._getTargetColorValue(e);return!!t&&O(t)!==O("#888")}_setTargetColor(e,t){let r=j(t,this.options.cssText);return!r||O(r)===O("#888")?this._remove(e,["target","color"],{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]}):this._setText(e,["target","color"],r,{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]})}_getTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);return t!==void 0?!!t:!!this.context.read(e,["show_target_label"])}_getEffectiveTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);if(t!==void 0)return!!t;let r=this.context.read(e,["show_target_label"]);return r!==void 0?!!r:(e==null?void 0:e.type)==="entity"?this._getTargetLabelShowValue({type:"card"}):!1}_setTargetLabelShow(e,t){return t?this._write(e,["target","label","show"],!0,{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]}):this._remove(e,["target","label","show"],{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]})}_getTargetLabelDecimalValue(e){var t,r;return(r=(t=this.context.read(e,["target","label","precision"]))!=null?t:this.context.read(e,["target","label","decimal"]))!=null?r:""}_getEffectiveTargetLabelDecimalValue(e){let t=this._getTargetLabelDecimalValue(e);return t!==""&&t!==null&&t!==void 0?t:(e==null?void 0:e.type)==="entity"?this._getTargetLabelDecimalValue({type:"card"}):""}_setTargetLabelDecimal(e,t){let r=ie(t);return t===""||t===null||t===void 0?this._remove(e,["target","label","decimal"],{prunePaths:[["target","label"],["target"]]}):r===null?!1:this._write(e,["target","label","decimal"],r,{prunePaths:[["target","label"],["target"]]})}_getTargetAboveFillColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","when_exceeded","fill_color"]))!=null?t:this.context.read(e,["above_target_color"]))!=null?r:""}_getTargetAboveFillDraftKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_setTargetAboveFillDraft(e,t){let r=j(t,this.options.cssText),i=this._getTargetAboveFillDraftKey(e);r?this._targetAboveFillDrafts.set(i,r):this._targetAboveFillDrafts.delete(i)}_getTargetAboveFillDraft(e){var t;return(t=this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(e)))!=null?t:""}_getEffectiveTargetAboveFillColorValue(e){return this._effectiveDisplay(e,["target","when_exceeded","fill_color"],[["above_target_color"]])}_setTargetAboveFillColor(e,t){let r=j(t,this.options.cssText);return this._setTargetAboveFillDraft(e,r),this._isTargetAboveFillEnabled(e)?r?this._setText(e,["target","when_exceeded","fill_color"],r,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):!1}_isTargetAboveFillEnabled(e){return!!D(this._getTargetAboveFillColorValue(e)).trim()}_setTargetAboveFillEnabled(e,t){let r=j(this._getTargetAboveFillColorValue(e),this.options.cssText);if(!t)return r&&this._setTargetAboveFillDraft(e,r),this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]});let i=this._getTargetAboveFillDraft(e)||j(this._getEffectiveTargetAboveFillColorValue(e),this.options.cssText)||r||"#000000";return this._setText(e,["target","when_exceeded","fill_color"],i,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]})}_hasTargetOverride(e){let t=this.context.read(e,["target"]);return b(t)&&Object.keys(t).length||!b(t)&&t!==void 0&&t!==null&&t!==""?!0:["target_entity","target_color","show_target_label","above_target_color"].some(r=>{let i=this.context.read(e,[r]);return i!=null&&i!==""&&i!==!1})||this._getTargetLabelDecimalValue(e)!==""}_getTargetOverrideSummary(e){if(this._getTargetMode(e)==="disabled")return"Disabled";let r=[],i=this._getTargetResolvableValue(e);i.fixed!==""&&i.fixed!==void 0&&r.push(`Target ${i.fixed}`),i.entity&&r.push("Entity"),this._hasTargetShape(e)&&r.push(this._getEffectiveTargetShapeValue(e)==="triangle"?"Triangle":"Diamond"),this._hasCustomTargetColor(e)&&r.push("Custom color"),this._getTargetLabelShowValue(e)&&r.push("Label");let n=this._getTargetLabelDecimalValue(e);return n!==""&&r.push(`Label ${n} ${Number(n)===1?"decimal":"decimals"}`),this._getTargetAboveFillColorValue(e)&&r.push("Above"),r.length?r.join(" \u2022 "):"Inherited"}_write(e,t,r,i={}){var n;return this.context.mutate(e,a=>{var s,d;let l=r===void 0?p(a,t):P(a,t,r);l=te(l,(s=i.deprecatedKeys)!=null?s:[]);for(let c of(d=i.prunePaths)!=null?d:[])l=C(l,c);return l},{...i,targetEdit:{path:t.slice(1),value:r,deprecatedKeys:(n=i.deprecatedKeys)!=null?n:[]}})}_remove(e,t,r){return this._write(e,t,void 0,r)}_setText(e,t,r,i){return this._write(e,t,j(r,this.options.cssText)||void 0,i)}_effectiveDisplay(e,t,r){return _t(this.context,e,t,r)}_getEffectiveMarkerDirection(e,t){return ue(this.context,e,t)}_setMarkerDirection(e,t,r){return Me(this.context,e,t,r)}_getBuiltinMarkerLabelOptions(e,t){return Te(this.context,e,t,this._getEffectiveTargetLabelShowValue(e))}_renderBuiltinMarkerLabelControls(e,t,r){return ye(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(e,t,r,i){return Fe(this.context,e,t,r,i)}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(a,i,n))return!0;if(a==="target-inherit")return i&&this._clearTargetOverride(n),!0;if(a==="target-mode")return this._setTargetMode(n,i),!0;if(a==="target-value")return this._setTargetResolvablePart(n,"fixed",i),!0;if(a==="target-entity-source")return this._setTargetResolvablePart(n,"entity",i),!0;if(a==="target-shape")return this._setTargetShape(n,i),!0;if(a==="target-direction")return this._setMarkerDirection(n,"target",i),!0;if(a==="target-color")return this._setTargetColor(n,i),!0;let l=a==null?void 0:a.match(/^target-label-(show|text|show-value|show-unit|precision)$/);if(l){let s=l[1];return this._setBuiltinMarkerLabelField(n,"target",s==="show-value"?"showValue":s==="show-unit"?"showUnit":s,i),!0}return a==="target-above-fill-enabled"?(this._setTargetAboveFillEnabled(n,i),!0):a==="target-above-fill-color"?(this._setTargetAboveFillColor(n,i),!0):!1}handleClick(e){var t;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="target-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"target","percent",null),!0):!1}render(e={type:"card"}){var s,d;if((e==null?void 0:e.type)==="entity"){let c=e.index,u=!this._hasTargetOverride(e),h=this._getEffectiveTargetResolvableValue(e),f=this._getEffectiveTargetMode(e),m=this._getEffectiveTargetShapeValue(e),x=this._getEffectiveMarkerDirection(e,"target");return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${c}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${c}"${u?" checked":""}>
                          <label for="entity-${c}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${c}-target-mode">Target mode</label>
	                        <select id="entity-${c}-target-mode" data-kind="entity-target-mode" data-index="${c}" value="${y(f)}">
                          <option value="enabled"${f==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${f==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-value">Target fallback</label>
                        <input id="entity-${c}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${c}" value="${y(h.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-shape">Target shape</label>
                        <select id="entity-${c}-target-shape" data-kind="entity-target-shape" data-index="${c}" value="${y(m)}">
                          <option value="diamond"${m==="diamond"?" selected":""}>diamond</option>
                          <option value="triangle"${m==="triangle"?" selected":""}>triangle</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-direction">Direction</label>
                        <select id="entity-${c}-target-direction" data-kind="entity-target-direction" data-index="${c}" value="${x}">
                          <option value="inward"${x==="inward"?" selected":""}>Inward</option>
                          <option value="outward"${x==="outward"?" selected":""}>Outward</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${W("entity-target-entity-source",c,h.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-color">Target color</label>
                        ${I({cssText:this.options.cssText,label:"Target color",id:`entity-${c}-target-color`,kind:"entity-target-color",index:c,value:this._getEffectiveTargetColorValue(e),fallbackHex:"#888",placeholder:"inherit card default"})}
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(e,"target","Target")}
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${c}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${c}"${this._isTargetAboveFillEnabled(e)?" checked":""}>
	                          <label for="entity-${c}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${c}-target-above-fill">Above-target color</label>
	                        ${I({cssText:this.options.cssText,label:"Target color",id:`entity-${c}-target-above-fill`,kind:"entity-target-above-fill-color",index:c,value:this._getEffectiveTargetAboveFillColorValue(e),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let t=this._getTargetResolvableValue(e),r=this._getTargetMode(e),i=this._getEffectiveTargetShapeValue(e),n=this._getEffectiveMarkerDirection(e,"target"),a=this._getTargetColorValue(e),l=this._getTargetAboveFillColorValue(e);return`
            <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${y(r)}">
                <option value="auto"${r==="auto"?" selected":""}>auto</option>
                <option value="enabled"${r==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${r==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            ${this.options.percentSources?gt("target",this._getSourceMode(),(d=(s=this._percentageDraft)!=null?s:t.percent)!=null?d:""):""}<div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${y(t.fixed)}">
            </div>
            <div class="field-row">
              <label for="target-shape">Target shape</label>
              <select id="target-shape" data-field="target-shape" value="${y(i)}">
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
            </div>`}};var De=class{constructor(e,t={}){this.options=t,this.context=e}_getScopedPeakConfig(e){var d,c;let t=this.context.read(e,["peak"]),r=this.context.read(e,["peak_marker"]),i=this.context.read(e,["show_peak"]),n=this.context.read(e,["peak_color"]),a="#888",l=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",s="";return b(t)&&(t.enabled===!0?l="enabled":t.enabled===!1&&(l="disabled"),s=(d=t.color)!=null?d:s),b(r)&&(r.show===!0?l="enabled":(r.show===!1||(e==null?void 0:e.type)!=="entity")&&(l="disabled"),s=(c=r.color)!=null?c:s),i===!0?l="enabled":i===!1&&(l="disabled"),s=s||n||"",s&&O(s)===O(a)&&(s=""),{mode:l,color:s}}_getEffectiveScopedPeakConfig(e){let t=this._getScopedPeakConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasPeakOverride(e))return this._getScopedPeakConfig({type:"card"});let r=this._getScopedPeakConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_hasPeakOverride(e){var i,n;let t=(i=this.context.read(e,["peak"]))!=null?i:{};if(b(t)&&(Object.prototype.hasOwnProperty.call(t,"enabled")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"reset")||Object.prototype.hasOwnProperty.call(t,"label")||Object.prototype.hasOwnProperty.call(t,"direction")))return!0;let r=(n=this.context.read(e,["peak_marker"]))!=null?n:{};return b(r)&&(Object.prototype.hasOwnProperty.call(r,"show")||Object.prototype.hasOwnProperty.call(r,"color")||Object.prototype.hasOwnProperty.call(r,"direction"))?!0:this.context.read(e,["show_peak"])!==void 0||this.context.read(e,["peak_color"])!==void 0}_getPeakSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasPeakOverride(e))return"Inherited";let t=this._getScopedPeakConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}_clearPeakOverride(e){return this.context.mutate(e,t=>{let r=p(t,["peak","enabled"]);return r=p(r,["peak","color"]),r=p(r,["peak","reset"]),r=p(r,["peak","label"]),r=p(r,["peak","direction"]),r=p(r,["show_peak"]),r=p(r,["peak_color"]),r=p(r,["peak_marker"]),r=C(r,["peak"]),r},{rerender:!0})}_setScopedPeakEnabled(e,t){let r=!!t,i="#888";return this.context.mutate(e,n=>{var d,c,u;let a=M(n),l=b(G(a,["peak"]))?M(G(a,["peak"])):{},s=(u=(c=(d=l.color)!=null?d:b(G(a,["peak_marker"]))?G(a,["peak_marker","color"]):void 0)!=null?c:G(a,["peak_color"]))!=null?u:i;return(e==null?void 0:e.type)==="entity"||r?l.enabled=r:delete l.enabled,s&&O(s)!==O(i)?l.color=s:delete l.color,Object.keys(l).length?a=P(a,["peak"],l):a=p(a,["peak"]),a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"]),a=C(a,["peak"]),a},{extremumEdit:{key:"peak",path:["enabled"],value:r}})}_setScopedPeakColor(e,t){let r=j(t,this.options.cssText),i="#888";return this.context.mutate(e,n=>{let a=M(n),l=b(G(a,["peak"]))?M(G(a,["peak"])):{},s=this._getScopedPeakConfig(e);return delete l.color,r&&O(r)!==O(i)&&(l.color=r),(e==null?void 0:e.type)==="entity"?(s.mode==="enabled"&&(l.enabled=!0),s.mode==="disabled"&&(l.enabled=!1)):s.mode==="enabled"&&(l.enabled=!0),Object.keys(l).length?a=P(a,["peak"],l):a=p(a,["peak"]),a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"]),a=C(a,["peak"]),a},{extremumEdit:{key:"peak",path:["color"],value:r&&O(r)!==O(i)?r:void 0}})}_getScopedMarkerExtras(e,t){var a,l,s,d;let r=this.context.read(e,[t]),i=b(r)?r:{},n=b(i.label)?i.label:{};return{reset:Object.prototype.hasOwnProperty.call(i,"reset")?D(i.reset).trim().toLowerCase():null,labelShow:typeof n.show=="boolean"?n.show:null,labelText:typeof n.text=="string"?n.text.replace(/\s+/g," ").trim():null,labelShowValue:typeof n.show_value=="boolean"?n.show_value:null,labelShowUnit:typeof n.show_unit=="boolean"?n.show_unit:null,labelPrecision:((a=n.precision)!=null?a:n.decimal)===void 0||((l=n.precision)!=null?l:n.decimal)===null||((s=n.precision)!=null?s:n.decimal)===""?null:K((d=n.precision)!=null?d:n.decimal)}}_hasExtremumOverride(e,t){let r=this.context.read(e,[t]);return b(r)?["enabled","color","reset","label","direction"].some(i=>Object.prototype.hasOwnProperty.call(r,i)):!1}_getEffectiveMarkerExtras(e,t){var n,a,l,s,d,c,u,h,f,m,x,k,S,$,_,g,v,w;let r=this._getScopedMarkerExtras(e,t);if((e==null?void 0:e.type)!=="entity")return{reset:(n=r.reset)!=null?n:"never",labelShow:(a=r.labelShow)!=null?a:!1,labelText:r.labelText,labelShowValue:(l=r.labelShowValue)!=null?l:!0,labelShowUnit:(s=r.labelShowUnit)!=null?s:!0,labelPrecision:r.labelPrecision};let i=this._getScopedMarkerExtras({type:"card"},t);return this._hasExtremumOverride(e,t)?{reset:(m=(f=r.reset)!=null?f:i.reset)!=null?m:"never",labelShow:(k=(x=r.labelShow)!=null?x:i.labelShow)!=null?k:!1,labelText:Object.prototype.hasOwnProperty.call((S=this.context.read(e,[t,"label"]))!=null?S:{},"text")?r.labelText:i.labelText,labelShowValue:(_=($=r.labelShowValue)!=null?$:i.labelShowValue)!=null?_:!0,labelShowUnit:(v=(g=r.labelShowUnit)!=null?g:i.labelShowUnit)!=null?v:!0,labelPrecision:(w=r.labelPrecision)!=null?w:i.labelPrecision}:{reset:(d=i.reset)!=null?d:"never",labelShow:(c=i.labelShow)!=null?c:!1,labelText:i.labelText,labelShowValue:(u=i.labelShowValue)!=null?u:!0,labelShowUnit:(h=i.labelShowUnit)!=null?h:!0,labelPrecision:i.labelPrecision}}_getScopedFloorConfig(e){let t=this.context.read(e,["floor"]),r=b(t)?t:{},i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled";r.enabled===!0&&(i="enabled"),r.enabled===!1&&(i="disabled");let n=r.color&&O(r.color)!==O("#888888")?r.color:"";return{mode:i,color:n}}_getEffectiveScopedFloorConfig(e){let t=this._getScopedFloorConfig(e),r=this._getEffectiveMarkerExtras(e,"floor");if((e==null?void 0:e.type)!=="entity")return{...t,...r};if(!this._hasExtremumOverride(e,"floor"))return{...this._getScopedFloorConfig({type:"card"}),...r};let i=this._getEffectiveScopedFloorConfig({type:"card"});return{mode:t.mode==="inherit"?i.mode:t.mode,color:t.color||i.color,...r}}_getFloorSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasExtremumOverride(e,"floor"))return"Inherited";let t=this._getEffectiveScopedFloorConfig(e);return t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Disabled \u2022 Custom color":"Disabled"}_getMarkerResetSummary(e){var a;let t={type:"card"},i=(e==="peak"?this._getScopedPeakConfig(t):this._getEffectiveScopedFloorConfig(t)).mode==="enabled",n=(a=this._getEffectiveMarkerExtras(t,e).reset)!=null?a:"never";return`${i?"Enabled":"Disabled"} \xB7 ${n==="never"?"no reset":`${n} reset`}`}_setScopedExtremumEnabled(e,t,r){let i=!!r,n="#888888";return this.context.mutate(e,a=>{var c;let l=M(a),s=b(G(l,[t]))?M(G(l,[t])):{},d=(c=s.color)!=null?c:n;return(e==null?void 0:e.type)==="entity"||i?s.enabled=i:delete s.enabled,d&&O(d)!==O(n)?s.color=d:delete s.color,Object.keys(s).length?l=P(l,[t],s):l=p(l,[t]),l},{extremumEdit:{key:t,path:["enabled"],value:i}})}_setScopedExtremumColor(e,t,r){let i=j(r,this.options.cssText),n="#888888";return this.context.mutate(e,a=>{let l=M(a),s=b(G(l,[t]))?M(G(l,[t])):{};delete s.color,i&&O(i)!==O(n)&&(s.color=i);let d=this._getScopedFloorConfig(e).mode;return t==="floor"&&((e==null?void 0:e.type)==="entity"&&d!=="inherit"||(e==null?void 0:e.type)!=="entity"&&d==="enabled")&&(s.enabled=d==="enabled"),Object.keys(s).length?l=P(l,[t],s):l=p(l,[t]),t==="peak"&&(l=p(l,["show_peak"]),l=p(l,["peak_color"]),l=p(l,["peak_marker"])),l},{extremumEdit:{key:t,path:["color"],value:i&&O(i)!==O(n)?i:void 0}})}_setScopedExtremumReset(e,t,r){let i=D(r).trim().toLowerCase();return this.context.mutate(e,n=>{let a=M(n),l=b(G(a,[t]))?M(G(a,[t])):{};return i&&((e==null?void 0:e.type)==="entity"||i!=="never")?l.reset=i:delete l.reset,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),t==="peak"&&(a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"])),a},{extremumEdit:{key:t,path:["reset"],value:i}})}_setScopedExtremumLabelShow(e,t,r){let i=!!r;return this.context.mutate(e,n=>{let a=M(n),l=b(G(a,[t]))?M(G(a,[t])):{},s=b(l.label)?M(l.label):{};return(e==null?void 0:e.type)==="entity"||i?s.show=i:delete s.show,Object.keys(s).length?l.label=s:delete l.label,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),t==="peak"&&(a=p(a,["show_peak"]),a=p(a,["peak_color"]),a=p(a,["peak_marker"])),a},{extremumEdit:{key:t,path:["label","show"],value:i}})}_setScopedExtremumLabelDecimal(e,t,r){let i=K(r);return this.context.mutate(e,n=>{let a=M(n),l=b(G(a,[t]))?M(G(a,[t])):{},s=b(l.label)?M(l.label):{};return i!==null?s.decimal=i:delete s.decimal,Object.keys(s).length?l.label=s:delete l.label,Object.keys(l).length?a=P(a,[t],l):a=p(a,[t]),a},{extremumEdit:{key:t,path:["label","decimal"],value:i}})}_clearFloorOverride(e){return this.context.mutate(e,t=>{let r=M(t),i=b(G(r,["floor"]))?M(G(r,["floor"])):{};return["enabled","color","reset","label","direction"].forEach(n=>delete i[n]),Object.keys(i).length?r=P(r,["floor"],i):r=p(r,["floor"]),r=p(r,["floor_marker"]),r},{rerender:!0})}_setPeakShow(e){return this._setScopedPeakEnabled({type:"card"},e)}_getPeakShowValue(){return this._getScopedPeakConfig({type:"card"}).mode==="enabled"}_getMarkerConfig(e,t){return t==="peak"?this._getEffectiveScopedPeakConfig(e):this._getEffectiveScopedFloorConfig(e)}_getBuiltinMarkerLabelOptions(e,t){return Te(this.context,e,t,this._getEffectiveMarkerExtras(e,t).labelShow)}_renderBuiltinMarkerLabelControls(e,t,r){return ye(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_getEffectiveMarkerDirection(e,t){return ue(this.context,e,t)}render(e={type:"card"},t="peak"){let r=t==="peak"?"Peak":"Floor",i=t==="peak"?"#888":"#888888",n={...this._getMarkerConfig(e,t),...this._getEffectiveMarkerExtras(e,t)};if((e==null?void 0:e.type)==="entity"){let a=e.index,l=!(t==="peak"?this._hasPeakOverride(e):this._hasExtremumOverride(e,t)),s=t==="peak"?"	":"";return`
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
                        <select id="entity-${a}-${t}-reset" data-kind="entity-${t}-reset" data-index="${a}" value="${y(n.reset)}">
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
              <select id="${t}-reset" data-field="${t}-reset" value="${y(n.reset)}">
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
            </div>`}handleField({field:e,kind:t,index:r,value:i}){let n=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},a=e!=null?e:t==null?void 0:t.replace(/^entity-/,""),l=a==null?void 0:a.match(/^(peak|floor)-(.*)$/);if(!l)return!1;let[,s,d]=l;if(d==="inherit")return i&&(s==="peak"?this._clearPeakOverride(n):this._clearFloorOverride(n)),!0;if(d==="show"||d==="enabled")return s==="peak"?this._setScopedPeakEnabled(n,i):this._setScopedExtremumEnabled(n,s,i),!0;if(d==="color")return s==="peak"?this._setScopedPeakColor(n,i):this._setScopedExtremumColor(n,s,i),!0;if(d==="reset")return this._setScopedExtremumReset(n,s,i),!0;if(d==="direction")return Me(this.context,n,s,i),!0;let c=d.match(/^label-(show|text|show-value|show-unit|precision)$/);if(c){let u=c[1];return Fe(this.context,n,s,u==="show-value"?"showValue":u==="show-unit"?"showUnit":u,i),!0}return!1}};function Ge(o){var r,i,n;let e=o==null?void 0:o.at;if(typeof e=="string"&&/^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s*$/.test(e))return{mode:"percent",percent:e.replace(/%/g,"").trim()};if(typeof e=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(e.trim()))return{mode:"entity",entity:e.trim(),fixed:""};let t=b(e)?e:{};return Object.prototype.hasOwnProperty.call(t,"entity")?{mode:t.fixed!==void 0&&t.fixed!==null&&t.fixed!==""?"entity-fallback":"entity",entity:(r=t.entity)!=null?r:"",fixed:(i=t.fixed)!=null?i:""}:{mode:"fixed",fixed:(n=t.fixed)!=null?n:""}}var Oe=class{constructor(e,t,r={}){this.options=r,this.context=e,this.ui=t,this._genericMarkerUiIds=new Map,this._expandedGenericMarkerUiIds=new Set,this._nextGenericMarkerUiId=0}reset(){this._genericMarkerUiIds.clear(),this._expandedGenericMarkerUiIds.clear()}_getShadowElementById(e){var t,r,i,n;return(n=(r=(t=this.ui.root())==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?n:(i=this.ui.root())==null?void 0:i.querySelector(`#${e}`)}render(e={type:"card"}){return this._renderGenericMarkersEditor(e)}_hasMarkersOverride(e){return(e==null?void 0:e.type)==="entity"&&this.context.read(e,["markers"])!==void 0}_getGenericMarkers(e,t=!0){let r=this.context.read(e,["markers"]);if((e==null?void 0:e.type)==="entity"&&r===void 0&&t){let i=this.context.read({type:"card"},["markers"]);return Array.isArray(i)?M(i):[]}return Array.isArray(r)?M(r):[]}_getGenericMarkersSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasMarkersOverride(e))return"Inherited";let t=this._getGenericMarkers(e,!1).length;return t===0?"No reference markers":`${t} reference marker${t===1?"":"s"}`}_getGenericMarkerScopeKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGenericMarkerUiIds(e,t){var n;let r=this._getGenericMarkerScopeKey(e),i=(n=this._genericMarkerUiIds.get(r))!=null?n:[];for(;i.length<t;)i.push(`marker-${++this._nextGenericMarkerUiId}`);return i.length=t,this._genericMarkerUiIds.set(r,i),i}_resetGenericMarkerUiScope(e){var i;let t=this._getGenericMarkerScopeKey(e);((i=this._genericMarkerUiIds.get(t))!=null?i:[]).forEach(n=>this._expandedGenericMarkerUiIds.delete(n)),this._genericMarkerUiIds.delete(t)}_getGenericMarkerSummary(e){var a;let t=this._getGenericMarkerSource(e),r=(e==null?void 0:e.lane)==="above"?"Above":"Below",i=(a=e==null?void 0:e.shape)!=null?a:"circle",n;return t.mode==="percent"?n=t.percent===""?"Percentage":`${t.percent}%`:t.mode==="entity"||t.mode==="entity-fallback"?n=t.entity||"Entity":n=t.fixed===""?"Fixed value":String(t.fixed),`${r} \xB7 ${i.charAt(0).toUpperCase()}${i.slice(1)} \xB7 ${n}`}_refreshGenericMarkerSummary(e,t){let r=this._getGenericMarkers(e),i=r[t],n=this._getGenericMarkerUiIds(e,r.length)[t],a=this._getShadowElementById(`generic-${n}-summary`);if(i&&a){let l=this._getGenericMarkerSummary(i);a.textContent!==l&&(a.textContent=l),a.setAttribute("title",l)}}_getGenericMarkerSource(e){return this.context.source({type:"card"},{type:"reference-marker",marker:e})}_renderGenericMarkersEditor(e){let t=e.type,r=t==="entity"?e.index:"card",i=this._getGenericMarkers(e),n=this._getGenericMarkerUiIds(e,i.length),a=this._hasMarkersOverride(e),l=i.map((c,u)=>{var $,_,g,v,w,E,V,T,z,N,R,B,A,L;let h=this._getGenericMarkerSource(c),f=n[u],m=`${t}-${r}-generic-${f}`,x=this._expandedGenericMarkerUiIds.has(f),k=h.mode==="entity"||h.mode==="entity-fallback"?W("generic-marker-entity",r,h.entity,"sensor.reference",{"scope-type":t,"marker-index":u}):"",S=W("generic-marker-label-entity",r,(_=($=c==null?void 0:c.label)==null?void 0:$.entity)!=null?_:"","sensor.information",{"scope-type":t,"marker-index":u});return`
        <div class="generic-marker-item" data-marker-ui-id="${f}" data-expanded="${x?"true":"false"}">
          <div class="generic-marker-header">
            <button type="button" class="generic-marker-toggle" data-action="toggle-generic-marker" data-marker-ui-id="${f}" aria-expanded="${x?"true":"false"}">
              <span class="generic-marker-title">Reference marker ${u+1}</span>
              <span id="generic-${f}-summary" class="generic-marker-summary" title="${y(this._getGenericMarkerSummary(c))}">${y(this._getGenericMarkerSummary(c))}</span>
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
                <input id="${m}-fixed" type="number" step="any" data-kind="generic-marker-fixed" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${y(h.fixed)}">
              </div>`:""}
          ${h.mode==="entity"||h.mode==="entity-fallback"?`
            <div class="field-row">
              <label>Reference marker entity</label>
              ${k}
            </div>`:""}
          ${h.mode==="entity-fallback"?`
            <div class="field-row">
              <label for="${m}-fallback">Fixed fallback</label>
              <input id="${m}-fallback" type="number" step="any" data-kind="generic-marker-fallback" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${y(h.fixed)}">
            </div>`:""}
          ${h.mode==="percent"?`
            <div class="field-row">
              <label for="${m}-percent">Scale percentage</label>
              ${Rt(`${m}-percent`,`data-kind="generic-marker-percent" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"`,h.percent)}
            </div>`:""}
          <div class="inline-row generic-marker-pair">
            <div class="field-row">
              <label for="${m}-lane">Lane</label>
              <select id="${m}-lane" data-kind="generic-marker-lane" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
                <option value="above"${(c==null?void 0:c.lane)==="above"?" selected":""}>Above</option>
                <option value="below"${((g=c==null?void 0:c.lane)!=null?g:"below")==="below"?" selected":""}>Below</option>
              </select>
            </div>
            <div class="field-row">
              <label for="${m}-direction">Direction</label>
              <select id="${m}-direction" data-kind="generic-marker-direction" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${Y(c==null?void 0:c.direction)}">
                <option value="inward"${((v=c==null?void 0:c.direction)!=null?v:"inward")==="inward"?" selected":""}>Inward</option>
                <option value="outward"${(c==null?void 0:c.direction)==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label for="${m}-shape">Shape</label>
            <select id="${m}-shape" data-kind="generic-marker-shape" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
              ${["circle","diamond","triangle","chevron","arrow","pin"].map(U=>{var q;return`<option value="${U}"${((q=c==null?void 0:c.shape)!=null?q:"circle")===U?" selected":""}>${U}</option>`}).join("")}
            </select>
          </div>
          <div class="field-row">
            <label for="${m}-color">Color</label>
            ${I({cssText:this.options.cssText,label:"Reference marker color",id:`${m}-color`,kind:"generic-marker-color",index:r,value:(w=c==null?void 0:c.color)!=null?w:"#888888",fallbackHex:"#888888",placeholder:"#888888",extraDataset:{"scope-type":t,"marker-index":u}})}
          </div>
          <div class="field-row"><div class="toggle">
            <input id="${m}-show-marker" type="checkbox" data-kind="generic-marker-show-marker" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${(c==null?void 0:c.show_marker)===!1?"":" checked"}>
            <label for="${m}-show-marker">Show marker shape</label>
          </div></div>
          <div class="field-row"><div class="toggle">
            <input id="${m}-label-show" type="checkbox" data-kind="generic-marker-label-show" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((E=c==null?void 0:c.label)==null?void 0:E.show)===!0?" checked":""}>
            <label for="${m}-label-show">Show label</label>
          </div></div>
          <div class="field-row"><label for="${m}-label-text">Label text</label>
            <input id="${m}-label-text" type="text" data-kind="generic-marker-label-text" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${y((T=(V=c==null?void 0:c.label)==null?void 0:V.text)!=null?T:"")}" placeholder="optional semantic text">
          </div>
          <div class="field-row">
            <label>Label content entity</label>
            ${S}
          </div>
          <div class="inline-row generic-marker-options">
            <div class="field-row"><div class="toggle">
              <input id="${m}-label-show-value" type="checkbox" data-kind="generic-marker-label-show-value" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((z=c==null?void 0:c.label)==null?void 0:z.show_value)===!1?"":" checked"}>
              <label for="${m}-label-show-value">Show value</label>
            </div></div>
            <div class="field-row"><div class="toggle">
              <input id="${m}-label-show-unit" type="checkbox" data-kind="generic-marker-label-show-unit" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((N=c==null?void 0:c.label)==null?void 0:N.show_unit)===!1?"":" checked"}>
              <label for="${m}-label-show-unit">Show raw unit</label>
            </div></div>
            <div class="field-row generic-marker-precision"><label for="${m}-label-precision">Label precision</label>
              <input id="${m}-label-precision" type="number" min="0" step="1" data-kind="generic-marker-label-precision" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${y((L=(A=(R=c==null?void 0:c.label)==null?void 0:R.precision)!=null?A:(B=c==null?void 0:c.label)==null?void 0:B.decimal)!=null?L:"")}" placeholder="inherit">
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
    `}_getGenericMarkerScope(e){var t;return((t=e==null?void 0:e.dataset)==null?void 0:t.scopeType)==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}}_setGenericMarkerList(e,t,r={}){let i=this.context.mutate(e,n=>P(n,["markers"],t),{...r,rerender:!1});return i&&r.rerender&&this.ui.render(e),i}_updateGenericMarker(e,t,r,i={}){var d;let n=this._getGenericMarkers(e);if(!n[t])return!1;let a=b(n[t])?M(n[t]):{},l=(d=r(a))!=null?d:a;n[t]=l;let s=this._setGenericMarkerList(e,n,i);return s&&this._refreshGenericMarkerSummary(e,t),s}_setGenericMarkerSourceMode(e,t,r){return this._updateGenericMarker(e,t,i=>{if(r==="percent")return i.at="50%",i;let n=b(i.at)?M(i.at):{};return r==="fixed"?(delete n.entity,delete n.percent,n.fixed===void 0&&(n.fixed=50)):(delete n.percent,n.entity||(n.entity=""),r==="entity"&&delete n.fixed,r==="entity-fallback"&&n.fixed===void 0&&(n.fixed=50)),i.at=n,i},{rerender:!0,referenceMarkerEdit:{type:"mode",index:t,value:r}})}_toggleGenericMarkerExpanded(e){var r;this._expandedGenericMarkerUiIds.has(e)?this._expandedGenericMarkerUiIds.delete(e):this._expandedGenericMarkerUiIds.add(e);let t=(r=this.ui.root())==null?void 0:r.querySelector(`.generic-marker-item[data-marker-ui-id="${e}"]`);if(t!=null&&t.querySelector){let i=this._expandedGenericMarkerUiIds.has(e);t.setAttribute("data-expanded",String(i)),t.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),t.querySelector(".generic-marker-body").style.display=i?"grid":"none"}else this.ui.render()}_setGenericMarkerSourcePart(e,t,r,i){return this._updateGenericMarker(e,t,n=>{var s;let a=r==="entity"?D(i).trim()||void 0:(s=K(i))!=null?s:void 0;if(r==="percent")return n.at=a===void 0?null:`${a}%`,n;let l=b(n.at)?M(n.at):{};return a===void 0?delete l[r]:l[r]=a,n.at=Object.keys(l).length?l:null,n})}_setGenericMarkerField(e,t,r,i){let n=r.replace(/^generic-marker-/,"");if(n==="source-mode")return this._setGenericMarkerSourceMode(e,t,i);if(["fixed","fallback","entity","percent"].includes(n))return this.context.setSource(e,{type:"reference-marker",index:t},n==="fallback"?"fixed":n,i);let a,l;if(n==="show-marker")a=["show_marker"],l=i===!1?!1:void 0;else if(["lane","shape","direction"].includes(n))a=[n],l=n==="direction"?Y(i):i;else if(n==="color")a=["color"],l=j(i,this.options.cssText);else if(n.startsWith("label-")){let s=n.slice(6).replace("show-value","show_value").replace("show-unit","show_unit");if(!["show","text","entity","show_value","show_unit","precision"].includes(s))return!1;a=["label",s],l=Ht(s,i),(["text","entity"].includes(s)&&!l||l===null)&&(l=void 0)}else return!1;return this._updateGenericMarker(e,t,s=>{if(a[0]==="label"){let d=b(s.label)?M(s.label):{};l===void 0?delete d[a[1]]:d[a[1]]=l,a[1]==="precision"&&delete d.decimal,s.label=d}else l===void 0?delete s[a[0]]:s[a[0]]=l;return s},{referenceMarkerEdit:{type:"field",index:t,path:a,value:l}})}handleField({target:e,kind:t,value:r}){if(t==="entity-markers-inherit"){let i={type:"entity",index:Number(e.dataset.index)};return this._resetGenericMarkerUiScope(i),r?this.context.mutate(i,n=>p(n,["markers"]),{rerender:!0}):this._setGenericMarkerList(i,this._getGenericMarkers(i),{rerender:!0}),!0}return t!=null&&t.startsWith("generic-marker-")?(this._setGenericMarkerField(this._getGenericMarkerScope(e),Number(e.dataset.markerIndex),t,r),!0):!1}handleClick(e){var r;let t=(r=e==null?void 0:e.dataset)==null?void 0:r.action;if(e!=null&&e.disabled)return!1;if(t==="toggle-generic-marker")return this._toggleGenericMarkerExpanded(e.dataset.markerUiId),!0;if(t==="add-generic-marker"){let i=this._getGenericMarkerScope(e),n=this._getGenericMarkers(i),a=this._getGenericMarkerUiIds(i,n.length);n.push({at:{fixed:50}});let l=`marker-${++this._nextGenericMarkerUiId}`;return a.push(l),this._expandedGenericMarkerUiIds.add(l),this._setGenericMarkerList(i,n,{rerender:!0,referenceMarkerEdit:{type:"add"}}),!0}if(t==="remove-generic-marker"||t==="move-generic-marker-up"||t==="move-generic-marker-down"){let i=this._getGenericMarkerScope(e),n=Number(e.dataset.markerIndex),a=this._getGenericMarkers(i),l=this._getGenericMarkerUiIds(i,a.length);if(t==="remove-generic-marker")a.splice(n,1),this._expandedGenericMarkerUiIds.delete(l[n]),l.splice(n,1);else{let s=n+(t==="move-generic-marker-up"?-1:1);if(s<0||s>=a.length)return!0;[a[n],a[s]]=[a[s],a[n]],[l[n],l[s]]=[l[s],l[n]]}return this._setGenericMarkerList(i,a,{rerender:!0,referenceMarkerEdit:{type:t==="add-generic-marker"?"add":t==="remove-generic-marker"?"remove":"move",index:Number(e.dataset.markerIndex),delta:t==="move-generic-marker-up"?-1:1}}),!0}return!1}syncStructure(e={type:"card"}){var m,x,k,S,$;let t=this.ui.root(),r=t==null?void 0:t.querySelector(e.type==="entity"?`.entity-shell[data-entity-shell-index="${e.index}"] .override-group[data-group="markers"]`:'.card-subgroup[data-group="generic-markers"]'),i=(m=r==null?void 0:r.querySelector)==null?void 0:m.call(r,".generic-marker-list");if(!(i!=null&&i.ownerDocument))return!1;let n=this._getGenericMarkers(e),a=this._getGenericMarkerUiIds(e,n.length),l=i.ownerDocument.createElement("template");l.innerHTML=this.render(e);let s=l.content.querySelectorAll(".generic-marker-item"),d=new Map(Array.from(i.children,_=>[_.dataset.markerUiId,_])),c=t.activeElement,u=(x=c==null?void 0:c.closest)==null?void 0:x.call(c,".generic-marker-item"),h=u&&{id:u.dataset.markerUiId,kind:c.dataset.kind,action:c.dataset.action},f=i.firstElementChild;for(let _ of s){let g=_.dataset.markerUiId,v=(k=d.get(g))!=null?k:_;if(d.delete(g),v!==_){v.querySelector(".generic-marker-title").textContent=_.querySelector(".generic-marker-title").textContent;for(let R of v.querySelectorAll(".generic-marker-actions button")){let B=_.querySelector(`[data-action="${R.dataset.action}"]`);R.dataset.markerIndex=B.dataset.markerIndex,R.disabled=B.disabled}let V=v.querySelector(".generic-marker-body"),T=R=>{var B;return(B=R.querySelector("[data-kind]"))==null?void 0:B.dataset.kind},z=new Map(Array.from(V.children,R=>[T(R),R])),N=V.firstElementChild;for(let R of Array.from(_.querySelector(".generic-marker-body").children)){let B=T(R),A=(S=z.get(B))!=null?S:R,L=A.querySelector("[data-kind]"),U=R.querySelector("[data-kind]"),q=(L==null?void 0:L.tagName)===(U==null?void 0:U.tagName)?A:R;z.delete(B),q!==N&&V.insertBefore(q,N),q!==A&&A.remove(),N=q.nextElementSibling}for(let R of z.values())R.remove()}let w=a.indexOf(g);for(let V of v.querySelectorAll("[data-marker-index]"))V.dataset.markerIndex=String(w);let E=this._expandedGenericMarkerUiIds.has(g);v.setAttribute("data-expanded",String(E)),v.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(E)),v.querySelector(".generic-marker-body").style.display=E?"grid":"none",v!==f&&i.insertBefore(v,f),f=v.nextElementSibling}for(let _ of d.values())_.remove();if(h&&c!==t.activeElement){let _=i.querySelector(`[data-marker-ui-id="${h.id}"]`),g=h.kind?_==null?void 0:_.querySelector(`[data-kind="${h.kind}"]`):h.action?_==null?void 0:_.querySelector(`[data-action="${h.action}"]`):null;($=g==null?void 0:g.focus)==null||$.call(g,{preventScroll:!0})}return!0}syncControls(e,t=!1,r={type:"card"}){let i=this.ui.root(),n=`${r.type}-${r.type==="entity"?r.index:"card"}-generic-`;if(!i)return;let a=this._getGenericMarkers(r),l=this._getGenericMarkerUiIds(r,a.length);a.forEach((s,d)=>{var f,m,x,k,S,$,_,g,v,w,E,V;let c=this._getGenericMarkerSource(s),u=(f=s==null?void 0:s.label)!=null?f:{},h={"source-mode":c.mode,fixed:(m=c.fixed)!=null?m:"",fallback:(x=c.fixed)!=null?x:"",percent:(k=c.percent)!=null?k:"",lane:(S=s==null?void 0:s.lane)!=null?S:"below",shape:($=s==null?void 0:s.shape)!=null?$:"circle",direction:Y(s==null?void 0:s.direction),color:Q(s==null?void 0:s.color,"#888888"),"color-text-fallback":(_=s==null?void 0:s.color)!=null?_:"#888888","label-text":(g=u.text)!=null?g:"","label-precision":(w=(v=u.precision)!=null?v:u.decimal)!=null?w:""};for(let[T,z]of Object.entries(h)){let N=i.querySelector(`#${n}${l[d]}-${T}`);N&&(N!==i.activeElement||t)&&(N.value=String(z))}for(let[T,z]of[["show-marker",(s==null?void 0:s.show_marker)!==!1],["label-show",u.show===!0],["label-show-value",u.show_value!==!1],["label-show-unit",u.show_unit!==!1]]){let N=i.querySelector(`#${n}${l[d]}-${T}`);N&&(N.checked=z)}for(let[T,z,N]of[["entity",(E=c.entity)!=null?E:"","Reference marker entity"],["label-entity",(V=u.entity)!=null?V:"","Label content entity"]])for(let R of["input","ha-entity-picker"])for(let B of Array.from(i.querySelectorAll(`${R}[data-kind="generic-marker-${T}"]`)).filter(A=>Number(A.dataset.markerIndex)===d&&A.dataset.scopeType===r.type&&String(A.dataset.index)===String(r.type==="entity"?r.index:"card")))B.id=`${n}${l[d]}-${T}`,B.setAttribute("aria-label",N),(B!==i.activeElement||t)&&(B.value=z),R==="ha-entity-picker"&&(B.hass=e,B.label=N,B.allowCustomEntity=!0);this._refreshGenericMarkerSummary(r,d)})}};var Wt=class extends HTMLElement{get _gradientStopValidationMessages(){return this._gradientStopsSection._gradientStopValidationMessages}get _gradientStopPosTexts(){return this._gradientStopsSection._gradientStopPosTexts}get _gradientStopsUiRows(){return this._gradientStopsSection._gradientStopsUiRows}get _gradientStopsDrafts(){return this._gradientStopsSection._gradientStopsDrafts}get _segmentBoundaryTexts(){return this._segmentsSection._segmentBoundaryTexts}get _segmentUiRows(){return this._segmentsSection._segmentUiRows}get _segmentDrafts(){return this._segmentsSection._segmentDrafts}get _baselineColorDrafts(){return this._baselineSection._baselineColorDrafts}get _targetAboveFillDrafts(){return this._targetSection._targetAboveFillDrafts}get _genericMarkerUiIds(){return this._referenceMarkersSection._genericMarkerUiIds}get _expandedGenericMarkerUiIds(){return this._referenceMarkersSection._expandedGenericMarkerUiIds}get _nextGenericMarkerUiId(){return this._referenceMarkersSection._nextGenericMarkerUiId}set _nextGenericMarkerUiId(e){this._referenceMarkersSection._nextGenericMarkerUiId=e}constructor(){super(),this.attachShadow({mode:"open"}),this._segmentsSection=new ke(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedSegments(e,t,r)}),this._gradientStopsSection=new Ee(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedGradientStops(e,t,r)}),this._needleSection=new Ve(this._createSectionContext()),this._baselineSection=new Pe(this._createSectionContext()),this._targetSection=new Ce(this._createSectionContext()),this._extremaSection=new De(this._createSectionContext()),this._referenceMarkersSection=new Oe(this._createSectionContext(),{...this._paletteUi(),render:(e={type:"card"})=>{let t;this._isRendering=!0;try{t=this._referenceMarkersSection.syncStructure(e)}finally{this._isRendering=!1}if(!t){this._render();return}this._referenceMarkersSection.syncControls(this._hass,!1,e),this._syncEntityPickers(),this._numericDrafts.apply(this.shadowRoot)}}),this._config={},this._numericDrafts=new ve,this._draftConfig={},this._hass=null,this._isRendering=!1,this._renderScheduled=!1,this._lastRenderedConfigJson=null,this._lastEmittedConfigJson=null,this._shadowListenersAttached=!1,this._expandedEntityOverrides=new Set,this._entityIconCustomPending=new Set,this._expandedOverrideGroups=new Set,this._expandedCardGroups=new Set,this._targetSection.reset(),this._baselineSection.reset(),this._pendingFocusSelector=null,this._boundHandleClick=e=>this._handleClick(e),this._boundHandleChange=e=>this._handleChange(e),this._boundHandleInput=e=>this._handleInput(e),this._boundHandleValueChanged=e=>this._handleValueChanged(e),this._boundHandleKeydown=e=>this._handleKeydown(e)}setConfig(e){var l;let t=this._cloneDeep(e!=null?e:{}),r=this._serializeConfig(t),i=this._serializeConfig(this._config),n=this._serializeConfig(this._draftConfig);if(r===i)return;if(r===n){this._config=t;return}if(r===this._lastEmittedConfigJson){this._config=t;return}if(this._getEmittedConfigJson(t)===this._getEmittedConfigJson(this._draftConfig)){this._config=t;return}let a=!((l=this.shadowRoot)!=null&&l.innerHTML)||r!==this._lastRenderedConfigJson;this._lastEmittedConfigJson=null,this._entityIconCustomPending.clear(),this._config=t,this._draftConfig=this._cloneDeep(t),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._targetSection.reset(),this._baselineSection.reset(),this._referenceMarkersSection.reset(),this._numericDrafts.reset(),a&&this._render()}set hass(e){var t;if(this._hass=e,!((t=this.shadowRoot)!=null&&t.innerHTML)){this._render();return}this._syncEntityPickers()}_cloneContainer(e){return Ze(e)}_cloneDeep(e){return M(e)}_serializeConfig(e){return J(e)}_getEmittedConfigJson(e){return this._serializeConfig(e)}_isObject(e){return b(e)}_setPathValue(e,t,r){return P(e,t,r)}_deletePathValue(e,t){return p(e,t)}_getPathValue(e,t){return G(e,t)}_hasPath(e,t){return br(e,t)}_normalizeTextValue(e){return D(e)}_normalizeOptionalEnabled(e){return yr(e)}_normalizeNumberValue(e){return K(e)}_normalizeDecimalValue(e){return ie(e)}_preferStructuredPath(e,t=null){return this._hasPath(this._draftConfig,e.slice(0,-1))||this._hasPath(this._draftConfig,e)?e:t&&this._hasPath(this._draftConfig,t)?t:e}_getEntitiesValue(){var e,t;return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(r=>{var i,n,a;return typeof r=="string"?{entity:r}:{entity:(i=r==null?void 0:r.entity)!=null?i:"",name:(n=r==null?void 0:r.name)!=null?n:"",icon:(a=r==null?void 0:r.icon)!=null?a:""}}):this._draftConfig.entity?[{entity:this._draftConfig.entity,name:(e=this._draftConfig.name)!=null?e:"",icon:(t=this._draftConfig.icon)!=null?t:""}]:[]}_getRawEntityRows(){return Array.isArray(this._draftConfig.entities)?this._cloneDeep(this._draftConfig.entities):this._draftConfig.entity!==void 0?this._draftConfig.name!==void 0||this._draftConfig.icon!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[this._draftConfig.entity]:[]}_buildEntityConfigEntries(e){let t=!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0,r=Array.isArray(this._draftConfig.entities)?this._draftConfig.entities:this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[],i=e.map((n,a)=>{let l=r[a];if(this._isObject(l)){let u={...l,entity:n.entity},h=this._normalizeTextValue(n.name).trim();h?u.name=h:delete u.name;let f=n==null?void 0:n.icon,m=typeof f=="string"?f.trim():f;return m===!1?u.icon=!1:typeof m=="string"&&m?u.icon=m:l.icon===!1?u.icon=!1:delete u.icon,u}let s={entity:n.entity},d=this._normalizeTextValue(n.name).trim();d&&(s.name=d);let c=typeof(n==null?void 0:n.icon)=="string"?n.icon.trim():n==null?void 0:n.icon;return c===!1?s.icon=!1:typeof c=="string"&&c&&(s.icon=c),s});return t?i:i.map(n=>this._isObject(n)&&Object.keys(n).length===1&&n.entity!==void 0?n.entity:n)}_updateConfig(e){this._draftConfig=this._cloneDeep(e)}_emitConfigChanged(){let e=this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig)),t=this._serializeConfig(e);return t===this._lastEmittedConfigJson?!1:(this._lastEmittedConfigJson=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),!0)}_scheduleRender(){this._renderScheduled||this._isRendering||(this._renderScheduled=!0,setTimeout(()=>{this._renderScheduled=!1,this._render()},0))}_applyUserConfig(e,t={}){let{rerender:r=!1}=t,i=this._serializeConfig(e),n=this._serializeConfig(this._draftConfig);return i===n?!1:(this._updateConfig(e),this._emitConfigChanged(),this._refreshDerivedEditorUi(),r&&this._scheduleRender(),!0)}_getShadowElementById(e){var t,r,i,n,a,l;return this.shadowRoot&&(l=(a=(r=(t=this.shadowRoot).getElementById)==null?void 0:r.call(t,e))!=null?a:(n=(i=this.shadowRoot).querySelector)==null?void 0:n.call(i,`#${e}`))!=null?l:null}_setElementChecked(e,t){let r=this._getShadowElementById(e);r&&(r.checked=!!t)}_setElementText(e,t){let r=this._getShadowElementById(e);r&&(r.textContent=t)}_refreshDerivedEditorUi(){this.shadowRoot&&(this._refreshCardDerivedUi(),this._refreshEntityDerivedUi())}_refreshCardDerivedUi(){this._setElementText("card-group-marker-target-summary",this._getCardTargetMarkerSummary()),this._setElementText("card-group-marker-peak-summary",this._getMarkerResetSummary("peak")),this._setElementText("card-group-marker-floor-summary",this._getMarkerResetSummary("floor")),this._setElementText("card-group-baseline-summary",this._getCardBaselineSummary()),this._setElementText("card-group-generic-markers-summary",this._getGenericMarkersSummary({type:"card"})),this._setElementText("card-group-segments-summary",this._getSegmentsSummary({type:"card"})),this._setElementText("card-group-gradient-stops-summary",this._getGradientStopsSummary({type:"card"})),this._setElementChecked("target-above-fill-enabled",this._isTargetAboveFillEnabled({type:"card"})),this._setElementChecked("baseline-above-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"above")),this._setElementChecked("baseline-below-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"below")),this._refreshSegmentUi({type:"card"})}_refreshEntityDerivedUi(){let e=this._getEntitiesValue().length;for(let t=0;t<e;t+=1){let r={type:"entity",index:t};this._setElementChecked(`entity-${t}-scale-inherit`,!this._hasResolvableOverride(this._getResolvableScopedValue(r,"min"))&&!this._hasResolvableOverride(this._getResolvableScopedValue(r,"max"))),this._setElementChecked(`entity-${t}-target-inherit`,!this._hasTargetOverride(r)),this._setElementChecked(`entity-${t}-baseline-inherit`,!this._hasBaselineOverride(r)),this._setElementChecked(`entity-${t}-needle-inherit`,!this._hasNeedleOverride(r)),this._setElementChecked(`entity-${t}-peak-inherit`,!this._hasPeakOverride(r)),this._setElementChecked(`entity-${t}-floor-inherit`,!this._hasExtremumOverride(r,"floor")),this._setElementChecked(`entity-${t}-markers-inherit`,!this._hasMarkersOverride(r)),this._setElementChecked(`entity-${t}-bar-inherit`,!this._hasEntityBarAppearanceOverride(r)),this._setElementChecked(`entity-${t}-segments-inherit`,!this._hasSegmentsOverride(r)),this._setElementChecked(`entity-${t}-gradient-stops-inherit`,!this._hasGradientStopsOverride(r)),this._setElementChecked(`entity-${t}-layout-inherit`,!this._hasLayoutOverride(r)),this._setElementChecked(`entity-${t}-formatting-inherit`,!this._hasFormattingOverride(r)),this._setElementChecked(`entity-${t}-target-above-fill-enabled`,this._isTargetAboveFillEnabled(r)),this._setElementChecked(`entity-${t}-baseline-above-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"above")),this._setElementChecked(`entity-${t}-baseline-below-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"below")),this._setElementText(`entity-${t}-group-scale-summary`,this._getScaleOverrideSummary(r)),this._setElementText(`entity-${t}-group-target-summary`,this._getTargetOverrideSummary(r)),this._setElementText(`entity-${t}-group-baseline-summary`,this._getBaselineOverrideSummary(r)),this._setElementText(`entity-${t}-group-needle-summary`,this._getNeedleSummary(r)),this._setElementText(`entity-${t}-group-peak-summary`,this._getPeakSummary(r)),this._setElementText(`entity-${t}-group-floor-summary`,this._getFloorSummary(r)),this._setElementText(`entity-${t}-group-markers-summary`,this._getGenericMarkersSummary(r)),this._setElementText(`entity-${t}-group-bar-summary`,this._getBarAppearanceSummary(r)),this._setElementText(`entity-${t}-group-segments-summary`,this._getSegmentsSummary(r)),this._setElementText(`entity-${t}-group-gradient-stops-summary`,this._getGradientStopsSummary(r)),this._setElementText(`entity-${t}-group-layout-summary`,this._getLayoutSummary(r)),this._setElementText(`entity-${t}-group-formatting-summary`,this._getFormattingSummary(r)),this._refreshSegmentUi(r)}}_queuePostRenderFocus(e){this._pendingFocusSelector=e||null}_applyPendingFocus(){if(!this._pendingFocusSelector||!this.shadowRoot)return;let e=this._pendingFocusSelector;this._pendingFocusSelector=null,setTimeout(()=>{var r,i;let t=(i=(r=this.shadowRoot)==null?void 0:r.querySelector)==null?void 0:i.call(r,e);if(!(!t||typeof t.focus!="function"))try{t.focus({preventScroll:!0})}catch(n){t.focus()}},0)}_setValueAtPath(e,t,r={}){let i=t===void 0?this._deletePathValue(this._draftConfig,e):this._setPathValue(this._draftConfig,e,t);return this._applyUserConfig(i,r)}_setTitle(e){this._setValueAtPath(["title"],e)}_setEntityField(e,t,r){let i=this._normalizeTextValue(r);if(!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&e===0)return i.trim()?this._setValueAtPath([t],i.trim()):this._setValueAtPath([t],void 0);let n=this._withEntityScopeConfig(a=>{var d;let l=a[e],s=this._isObject(l)?this._cloneDeep(l):{entity:(d=l==null?void 0:l.entity)!=null?d:""};return i.trim()?s[t]=i.trim():delete s[t],a[e]=s,a});return this._applyUserConfig(n)}_setEntityIcon(e,t){let r=this._withEntityScopeConfig(i=>(i[e]&&(t===void 0?delete i[e].icon:i[e].icon=t),i));return this._applyUserConfig(r,{rerender:!0})}_getEntityIconMode(e,t){return(e==null?void 0:e.icon)===!1?"off":typeof(e==null?void 0:e.icon)=="string"&&e.icon.trim()||this._entityIconCustomPending.has(t)?"custom":"default"}_cleanupEntityIdentityForEmit(e){if(!this._isObject(e))return e;let t=this._cloneDeep(e),r=this._normalizeTextValue(t.name).trim();if(r?t.name=r:delete t.name,t.icon===!1)return t;let i=this._normalizeTextValue(t.icon).trim();return i?t.icon=i:delete t.icon,t}_cleanupNeedleForEmit(e,t={type:"card"}){var l;if(!this._isObject(e)||!this._isObject(e.bar))return e;let r=this._cloneDeep(e),i=(l=r.bar)==null?void 0:l.needle;if(i===void 0)return r;let n=this._normalizeColorComparisonValue("#ffffff"),a=null;if(i===!0)a={show:!0};else if(i===!1)a=(t==null?void 0:t.type)==="entity"?{show:!1}:null;else if(this._isObject(i)){let s=this._normalizeTextValue(i.color).trim();i.show===!0?a={show:!0}:i.show===!1?a=(t==null?void 0:t.type)==="entity"?{show:!1}:null:(t==null?void 0:t.type)==="entity"&&s&&this._normalizeColorComparisonValue(s)!==n&&(a={}),a&&s&&this._normalizeColorComparisonValue(s)!==n&&(a.color=s)}else a=null;return a?r.bar.needle=a:(delete r.bar.needle,Object.keys(r.bar).length||delete r.bar),r}_cleanupResolvableValueForEmit(e){if(this._isObject(e)||e===null||typeof e=="string"&&this._normalizeNumberValue(e)===null)return this._cloneDeep(e);let t=this._normalizeNumberValue(e);return t===null?null:{fixed:t}}_cleanupScaleForEmit(e){if(!this._isObject(e)||!this._isObject(e.scale))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.scale);return["min","max"].forEach(i=>{if(!Object.prototype.hasOwnProperty.call(r,i))return;let n=this._cleanupResolvableValueForEmit(r[i]);n||r[i]===null?(r[i]=n,delete t[i],delete t[`${i}_entity`]):delete r[i]}),Object.keys(r).length?t.scale=r:delete t.scale,t}_cleanupFormattingForEmit(e){if(!this._isObject(e)||!this._isObject(e.formatting))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.formatting),i=this._normalizeTextValue(r.unit).trim(),n=this._normalizeDecimalValue(r.decimal);return i?(r.unit=i,delete t.unit):delete r.unit,n!==null?(r.decimal=n,delete t.decimal):delete r.decimal,Object.keys(r).length?t.formatting=r:delete t.formatting,t}_cleanupLayoutForEmit(e){if(!this._isObject(e)||!this._isObject(e.layout))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.layout),i=this._isObject(r.label)?this._cloneDeep(r.label):null,n=this._isObject(r.hero)?this._cloneDeep(r.hero):null,a=this._normalizeNumberValue(r.height),l=this._normalizeNumberValue(i==null?void 0:i.width),s=this._normalizeHeroValueSizeValue(n==null?void 0:n.value_size),d=this._normalizeTextValue(i==null?void 0:i.position).trim();return a!==null&&a>=24?(r.height=a,delete t.height):delete r.height,i&&(d?(i.position=d,delete t.label_position):delete i.position,l!==null?(i.width=l,delete t.label_width):delete i.width,Object.keys(i).length?r.label=i:delete r.label),n&&(s!==null?n.value_size=s:delete n.value_size,Object.keys(n).length?r.hero=n:delete r.hero),Object.keys(r).length?t.layout=r:delete t.layout,t}_cleanupTargetForEmit(e,t={type:"card"}){var h;if(!this._isObject(e)||!this._isObject(e.target))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.target),n=this._cleanupResolvableValueForEmit(i.at),a=this._normalizeTextValue(i.color).trim(),l=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"target"),s=this._normalizeTextValue((h=i.when_exceeded)==null?void 0:h.fill_color).trim(),c=Object.prototype.hasOwnProperty.call(i,"shape")?fe(i.shape):null,u=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,n||i.at===null?(i.at=n,delete r.target_entity):delete i.at,a&&this._normalizeColorComparisonValue(a)!==this._normalizeColorComparisonValue("#888")?(i.color=a,delete r.target_color):delete i.color,Object.keys(l).length?(i.label=l,l.show===!0&&delete r.show_target_label):(delete i.label,delete r.show_target_label),s?(i.when_exceeded={...this._isObject(i.when_exceeded)?i.when_exceeded:{},fill_color:s},delete r.above_target_color):delete i.when_exceeded,(t==null?void 0:t.type)==="card"&&c==="diamond"?delete i.shape:c?i.shape=c:delete i.shape,u==="inward"&&((t==null?void 0:t.type)!=="entity"||u===this._getEffectiveMarkerDirection({type:"card"},"target"))?delete i.direction:u&&(i.direction=u),Object.keys(i).length?r.target=i:delete r.target,r}_cleanupBaselineForEmit(e){if(!this._isObject(e)||!this._isObject(e.baseline))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.baseline),i=this._cleanupResolvableValueForEmit(r.at);return typeof r.enabled!="boolean"&&delete r.enabled,i||r.at===null?r.at=i:delete r.at,["above","below"].forEach(n=>{if(!this._isObject(r[n])){delete r[n];return}let a=this._normalizeTextValue(r[n].color).trim();a?r[n]={...r[n],color:a}:delete r[n]}),Object.keys(r).length?t.baseline=r:delete t.baseline,t}_cleanupPeakForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.peak))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.peak),n=this._normalizeTextValue(i.color).trim(),a=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,(t==null?void 0:t.type)!=="entity"&&i.reset==="never"&&delete i.reset,a==="inward"&&((t==null?void 0:t.type)!=="entity"||a===this._getEffectiveMarkerDirection({type:"card"},"peak"))?delete i.direction:a&&(i.direction=a),n&&this._normalizeColorComparisonValue(n)!==this._normalizeColorComparisonValue("#888")?(i.color=n,delete r.peak_color):delete i.color,i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"peak"),Object.keys(i.label).length||delete i.label,Object.keys(i).length?r.peak=i:delete r.peak,r}_cleanupFloorForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.floor))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.floor),n=this._normalizeTextValue(i.color).trim(),a=Object.prototype.hasOwnProperty.call(i,"direction")?Y(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,n&&this._normalizeColorComparisonValue(n)!==this._normalizeColorComparisonValue("#888888")?i.color=n:delete i.color,this._isObject(i.label)&&(i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"floor"),Object.keys(i.label).length||delete i.label),((t==null?void 0:t.type)!=="entity"&&i.reset==="never"||i.reset===void 0||i.reset===null||i.reset==="")&&delete i.reset,a==="inward"&&((t==null?void 0:t.type)!=="entity"||a===this._getEffectiveMarkerDirection({type:"card"},"floor"))?delete i.direction:a&&(i.direction=a),Object.keys(i).length?r.floor=i:delete r.floor,r}_cleanBuiltinMarkerLabelForEmit(e,t,r){var l,s,d;let i=this._isObject(e)?this._cloneDeep(e):{},n=(t==null?void 0:t.type)==="entity"?(l=this._getScopedValue({type:"card"},[r,"label"]))!=null?l:{}:{};i.show===!1&&(t==null?void 0:t.type)!=="entity"&&delete i.show,i.show===!1&&(t==null?void 0:t.type)==="entity"&&n.show!==!0&&delete i.show,i.show_value===!0&&((t==null?void 0:t.type)!=="entity"||n.show_value!==!1)&&delete i.show_value,i.show_unit===!0&&((t==null?void 0:t.type)!=="entity"||n.show_unit!==!1)&&delete i.show_unit,typeof i.text=="string"&&(i.text=i.text.replace(/\s+/g," ").trim(),!i.text&&(t==null?void 0:t.type)!=="entity"&&delete i.text);let a=this._normalizeDecimalValue((s=i.precision)!=null?s:i.decimal);return delete i.decimal,a===null||(t==null?void 0:t.type)==="entity"&&a===((d=n.precision)!=null?d:n.decimal)?delete i.precision:i.precision=a,i}_cleanupBarForEmit(e,t={type:"card"},r=null,i=null){if(!this._isObject(e)||!this._isObject(e.bar))return e;let n=this._cloneDeep(e),a=this._cloneDeep(n.bar),s=["percent","scale"].includes(a.segment_space)?a.segment_space:(t==null?void 0:t.type)==="entity"&&["percent","scale"].includes(i)?i:null;if(s==="percent"&&Array.isArray(a.segments)){let f=m=>typeof m=="number"&&Number.isFinite(m)?`${m}%`:typeof m=="string"&&m.trim()!==""&&!m.includes("%")&&Number.isFinite(Number(m.trim()))?`${Number(m.trim())}%`:m;a.segments=a.segments.map(m=>({...m,from:f(m==null?void 0:m.from),...Object.prototype.hasOwnProperty.call(m!=null?m:{},"to")?{to:f(m.to)}:{}}))}delete a.segment_space;let d=this._normalizeTextValue(a.fill_style).trim(),c=this._normalizeTextValue(a.color).trim(),u=Array.isArray(a.segments)?a.segments:null,h=Array.isArray(a.gradient_stops)?a.gradient_stops:null;if(d){let f=this._cloneDeep(n);delete f.bar.fill_style;let m=ae(f,(t==null?void 0:t.type)==="entity"?r:null,{isCardScope:(t==null?void 0:t.type)!=="entity"}).fill_style;d==="bands"&&m==="bands"?delete a.fill_style:a.fill_style=d,delete n.color_mode}else delete a.fill_style;return c&&this._normalizeColorComparisonValue(c)!==this._normalizeColorComparisonValue("#4a9eff")?(a.color=c,delete n.color):delete a.color,a.solid_fill===!0?a.solid_fill=!0:delete a.solid_fill,u&&(!u.length||s||!this._segmentsEqualForEditor(u,this._getDefaultSegments()))?(a.segments=u,delete n.segments,delete n.severity):delete a.segments,h&&(!h.length||h.length>=2&&!this._isDefaultGradientStops(h))?(a.gradient_stops=this._sanitizeGradientStopsForEmit(h),delete n.gradient_stops):delete a.gradient_stops,Object.keys(a).length?n.bar=a:delete n.bar,n}_getEditorKnownKeyOrder(e=[]){switch(e.join(".")){case"":return["type","title","entities","scale","target","baseline","peak","floor","layout","formatting","bar"];case"entities.*":return["entity","name","icon","scale","target","baseline","peak","floor","layout","formatting","bar"];case"scale":return["min","max"];case"scale.min":case"scale.max":case"target.at":case"baseline.at":return["fixed","entity"];case"target":return["enabled","at","shape","color","label","when_exceeded"];case"target.label":return["show","decimal"];case"target.when_exceeded":return["fill_color"];case"baseline":return["enabled","at","above","below"];case"baseline.above":case"baseline.below":return["color"];case"peak":return["enabled","color","reset","label"];case"floor":return["enabled","color","reset","label"];case"peak.label":case"floor.label":return["show","decimal"];case"layout":return["height","label","hero"];case"layout.label":return["position","hero_size","width"];case"layout.hero":return["size","value_size"];case"formatting":return["unit","decimal"];case"bar":return["fill_style","color","solid_fill","needle","segments","gradient_stops"];case"bar.needle":return["show","color"];default:return null}}_orderEditorConfigKeys(e,t=[]){var a;if(Array.isArray(e)){let l=t[0]==="entities"?["entities","*"]:t;return e.map(s=>this._orderEditorConfigKeys(s,l))}if(!this._isObject(e))return e;let r={},i=(a=this._getEditorKnownKeyOrder(t))!=null?a:[],n=new Set;return i.forEach(l=>{Object.prototype.hasOwnProperty.call(e,l)&&(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]),n.add(l))}),Object.keys(e).forEach(l=>{n.has(l)||(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]))}),r}_cleanupEditorEmittedConfig(e){var n;if(!this._isObject(e))return e;let t=(n=e.bar)==null?void 0:n.segment_space,r=this._cleanupEntityIdentityForEmit(e);r=this._cleanupScaleForEmit(r),r=this._cleanupTargetForEmit(r,{type:"card"}),r=this._cleanupBaselineForEmit(r),r=this._cleanupPeakForEmit(r,{type:"card"}),r=this._cleanupFloorForEmit(r,{type:"card"}),r=this._cleanupGenericMarkersForEmit(r),r=this._cleanupLayoutForEmit(r),r=this._cleanupFormattingForEmit(r),r=this._cleanupNeedleForEmit(r,{type:"card"}),r=this._cleanupBarForEmit(r,{type:"card"}),Array.isArray(r.entities)&&(r.entities=r.entities.map((a,l)=>{if(!this._isObject(a))return a;let s=this._cleanupEntityIdentityForEmit(a);return s=this._cleanupScaleForEmit(s),s=this._cleanupTargetForEmit(s,{type:"entity",index:l}),s=this._cleanupBaselineForEmit(s),s=this._cleanupPeakForEmit(s,{type:"entity",index:l}),s=this._cleanupFloorForEmit(s,{type:"entity",index:l}),s=this._cleanupGenericMarkersForEmit(s),s=this._cleanupLayoutForEmit(s),s=this._cleanupFormattingForEmit(s),s=this._cleanupNeedleForEmit(s,{type:"entity"}),s=this._cleanupBarForEmit(s,{type:"entity",index:l},r,t),s}));let i=a=>{let l=_r({...a,...!a.entities&&!a.entity?{entities:[]}:{}}),s=["layout","scale","bar","baseline","formatting","target_marker","peak_marker","floor_marker","generic_markers"],d=u=>({...Object.fromEntries(s.map(h=>[h,u[h]])),scale:Object.fromEntries(["min","max"].map(h=>[h,{...u.scale[h],fixed_explicit:u.scale[h].fixed_explicit!==!1}]))}),c=(u,h="")=>Array.isArray(u)?u.map(f=>c(f)):this._isObject(u)?Object.fromEntries(Object.entries(u).filter(([f])=>!["severity","segment_space","label_precision_key"].includes(f)&&!/invalid/i.test(f)).map(([f,m])=>[f,c(m,f)])):h==="fixed"?Qe(null,u):/color/i.test(h)&&typeof u=="string"?this._normalizeColorComparisonValue(u):u;return this._serializeConfig(c({card:d(l),entities:l.entities.map(u=>({entity:u.entity,name:u.name,icon:u.icon,...d(u)}))}))};try{i(e)!==i(r)&&(r=this._cloneDeep(e))}catch(a){r=this._cloneDeep(e)}return this._orderEditorConfigKeys(r)}_getScopedPath(e,t){return Sr(e,t)}_normalizePath(e){return mt(e)}_getEntityRawEntries(){return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(e=>this._isObject(e)?this._cloneDeep(e):{entity:e}):this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[]}_withEntityScopeConfig(e){let t=this._getEntityRawEntries(),r=e(t.map(n=>this._cloneDeep(n))),i=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(i=this._deletePathValue(i,["entity"]),this._draftConfig.name!==void 0&&(i=this._deletePathValue(i,["name"])),this._draftConfig.icon!==void 0&&(i=this._deletePathValue(i,["icon"]))),i}_setEntityRowsRaw(e,t={}){var a;let r=this._cloneDeep(e);if(Array.isArray(this._draftConfig.entities)||this._draftConfig.entity===void 0||r.length!==1){let l=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(l=this._deletePathValue(l,["entity"]),l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"])),this._applyUserConfig(l,t)}let[i]=r;if(typeof i=="string"){let l=this._setPathValue(this._draftConfig,["entity"],i);return l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"]),this._applyUserConfig(l,t)}let n=this._setPathValue(this._draftConfig,["entity"],(a=i==null?void 0:i.entity)!=null?a:"");return i&&Object.prototype.hasOwnProperty.call(i,"name")?n=this._setPathValue(n,["name"],i.name):n=this._deletePathValue(n,["name"]),i&&Object.prototype.hasOwnProperty.call(i,"icon")?n=this._setPathValue(n,["icon"],i.icon):n=this._deletePathValue(n,["icon"]),this._applyUserConfig(n,t)}_moveEntityRow(e,t){let r=this._getRawEntityRows(),i=e+t;if(e<0||e>=r.length||i<0||i>=r.length)return!1;let n=this._cloneDeep(r);return[n[e],n[i]]=[n[i],n[e]],this._setEntityRowsRaw(n,{rerender:!0})}_duplicateEntityRow(e){let t=this._getRawEntityRows();if(e<0||e>=t.length)return!1;let r=this._cloneDeep(t[e]),i=typeof r=="string"?{entity:r}:this._cloneDeep(r);this._isObject(i)&&typeof i.name=="string"&&i.name.trim()&&(i.name=`${i.name.trim()} copy`);let n=this._cloneDeep(t);return n.splice(e+1,0,i),this._setEntityRowsRaw(n,{rerender:!0})}_removeEntityRow(e){let t=this._getRawEntityRows();if(t.length<=1||e<0||e>=t.length)return!1;let r=t.filter((i,n)=>n!==e);return this._setEntityRowsRaw(r,{rerender:!0})}_getScopedValue(e,t){if((e==null?void 0:e.type)==="entity"){let r=this._getEntityRawEntries()[e.index];return this._getPathValue(r,this._normalizePath(t))}return this._getPathValue(this._draftConfig,this._getScopedPath(e,t))}_removeScopedValue(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let i=this._withEntityScopeConfig(n=>{var l,s;let a=this._isObject(n[e.index])?{...n[e.index]}:{entity:(s=(l=n[e.index])==null?void 0:l.entity)!=null?s:""};return n[e.index]=this._deletePathValue(a,this._normalizePath(t)),n});return this._applyUserConfig(i,r)}return this._setValueAtPath(this._getScopedPath(e,t),void 0,r)}_applyScopedMutation(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let n=this._withEntityScopeConfig(a=>{var d;let l=a[e.index],s=this._isObject(l)?this._cloneDeep(l):{entity:(d=l==null?void 0:l.entity)!=null?d:""};return a[e.index]=t(s),a});return this._applyUserConfig(n,r)}let i=t(this._cloneDeep(this._draftConfig));return this._applyUserConfig(i,r)}_setScopedValue(e,t,r,i={}){return this._applyScopedMutation(e,n=>this._setPathValue(n,this._normalizePath(t),r),i)}_removePathsFromTarget(e,t=[]){return te(e,t)}_pruneEmptyObjectsInTarget(e,t){return C(e,t)}_setCanonicalScopedValue(e,t,r,i={}){let{deprecatedKeys:n=[],prunePaths:a=[]}=i;return this._applyScopedMutation(e,l=>{let s=this._setPathValue(l,this._normalizePath(t),r);return s=this._removePathsFromTarget(s,n),[this._normalizePath(t).slice(0,-1),...a.map(c=>this._normalizePath(c))].forEach(c=>{c.length&&(s=this._pruneEmptyObjectsInTarget(s,c))}),s},i)}_removeCanonicalScopedValue(e,t,r={}){let{deprecatedKeys:i=[],prunePaths:n=[]}=r;return this._applyScopedMutation(e,a=>{let l=this._deletePathValue(a,this._normalizePath(t));return l=this._removePathsFromTarget(l,i),[this._normalizePath(t).slice(0,-1),...n.map(d=>this._normalizePath(d))].forEach(d=>{d.length&&(l=this._pruneEmptyObjectsInTarget(l,d))}),l},r)}_setScopedNumericOverride(e,t,r,i={}){let n=this._normalizeNumberValue(r);return r===""||r===null||r===void 0?this._removeScopedValue(e,t,i):n===null?!1:this._setScopedValue(e,t,n,i)}_setScopedTextOverride(e,t,r,i={}){let n=this._normalizeTextValue(r).trim();return n?this._setScopedValue(e,t,n,i):this._removeScopedValue(e,t,i)}_setCanonicalScopedNumericOverride(e,t,r,i={}){let n=this._normalizeNumberValue(r);return r===""||r===null||r===void 0||n===null?this._removeCanonicalScopedValue(e,t,i):this._setCanonicalScopedValue(e,t,n,i)}_setCanonicalScopedTextOverride(e,t,r,i={}){let n=this._normalizeTextValue(r).trim();return n?this._setCanonicalScopedValue(e,t,n,i):this._removeCanonicalScopedValue(e,t,i)}_getResolvablePartsFromTarget(e,t,r={}){var c,u,h,f,m,x;let i=(c=r.canonicalBasePath)!=null?c:["scale",t],n=(u=r.legacyFixedPath)!=null?u:[t],a=(h=r.legacyEntityPath)!=null?h:[`${t}_entity`],l=this._getPathValue(e,i),s=this._getPathValue(e,n),d=this._getPathValue(e,a);if(l!==void 0){let k=ee(l,(f=r.inheritedSource)!=null?f:null,null,{allowPercent:["target","baseline"].includes(i[0])});return{fixed:(m=k.fixed)!=null?m:"",entity:(x=k.entity)!=null?x:"",...Number.isFinite(k.percent)?{percent:k.percent}:{}}}return{fixed:!this._isObject(s)&&s!==void 0?s:"",entity:d!=null?d:""}}_getResolvableScopedValue(e,t,r={}){let i=(e==null?void 0:e.type)==="entity"?this._getEntityRawEntries()[e.index]:this._draftConfig;return this._getResolvablePartsFromTarget(i!=null?i:{},t,r)}_getEffectiveResolvableScopedValue(e,t,r={}){var l,s;let i=this._getResolvableScopedValue(e,t,r);if((e==null?void 0:e.type)!=="entity")return i;let n=this._getResolvableScopedValue({type:"card"},t,r),a=this._getEntityRawEntries()[e.index];return this._getPathValue(a,(l=r.canonicalBasePath)!=null?l:["scale",t])!==void 0?this._getResolvablePartsFromTarget(a,t,{...r,inheritedSource:{fixed:n.fixed===""?null:n.fixed,entity:n.entity||null,percent:(s=n.percent)!=null?s:null}}):{fixed:this._hasExplicitOverrideValue(i.fixed)?i.fixed:n.fixed,entity:this._hasExplicitOverrideValue(i.entity)?i.entity:n.entity}}_setCanonicalResolvablePart(e,t,r,i,n={}){var u,h,f,m;let a=(u=n.canonicalBasePath)!=null?u:["scale",t],l=(h=n.legacyFixedPath)!=null?h:[t],s=(f=n.legacyEntityPath)!=null?f:[`${t}_entity`],d=(m=n.prunePaths)!=null?m:[a,a.slice(0,-1)],c=r==="fixed"?this._normalizeNumberValue(i):this._normalizeTextValue(i).trim();return this._applyScopedMutation(e,x=>{let S={...this._getResolvablePartsFromTarget(x!=null?x:{},t,{canonicalBasePath:a,legacyFixedPath:l,legacyEntityPath:s})};r==="fixed"?i===""||i===null||i===void 0||c===null?delete S.fixed:S.fixed=c:c?S.entity=c:delete S.entity;let $=this._cloneDeep(x);$=this._deletePathValue($,s);let _=this._getPathValue($,l);this._isObject(_)||($=this._deletePathValue($,l)),$=this._deletePathValue($,a);let g=S.fixed!==void 0&&S.fixed!==null&&S.fixed!=="",v=S.entity!==void 0&&S.entity!==null&&S.entity!=="",w=Number.isFinite(S.percent);if(g||v||w){let E={};g&&(E.fixed=S.fixed),v&&(E.entity=S.entity),w&&(E.percent=S.percent),$=this._setPathValue($,a,E)}return d.forEach(E=>{E.length&&($=this._pruneEmptyObjectsInTarget($,E))}),$},n)}_clearCanonicalResolvableValue(e,t,r={}){var s,d,c,u;let i=(s=r.canonicalBasePath)!=null?s:["scale",t],n=(d=r.legacyFixedPath)!=null?d:[t],a=(c=r.legacyEntityPath)!=null?c:[`${t}_entity`],l=(u=r.prunePaths)!=null?u:[i,i.slice(0,-1)];return this._applyScopedMutation(e,h=>{let f=this._deletePathValue(h,i);f=this._deletePathValue(f,a);let m=this._getPathValue(f,n);return this._isObject(m)||(f=this._deletePathValue(f,n)),l.forEach(x=>{x.length&&(f=this._pruneEmptyObjectsInTarget(f,x))}),f},r)}_getScopedDisplayValue(e,t,r=[]){let i=[t,...r];for(let n of i){let a=this._getScopedValue(e,n);if(a!=null&&a!=="")return a}return""}_getEffectiveScopedDisplayValue(...e){return _t(this._createSectionContext(),...e)}_paletteUi(){return{root:()=>this.shadowRoot,render:()=>this._render(),focus:e=>this._queuePostRenderFocus(e)}}_applySectionMutation(e,t,r){var i;return((i=r==null?void 0:r.needleEdit)==null?void 0:i.field)!=="mode"||r.needleEdit.value==="disabled"||(e==null?void 0:e.type)==="entity"&&r.needleEdit.value==="inherit"?this._applyScopedMutation(e,t,r):this._applyScopedMutation(e,n=>{let a=t(n),l=this._getPathValue(a,["baseline","enabled"]),s=this._getResolvablePartsFromTarget(a!=null?a:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]});return(l===!0||l!==!1&&this._hasResolvableOverride(s))&&(a=this._deletePathValue(a,["baseline"])),a},r)}_createSectionContext(){return{read:(e,t)=>this._getScopedValue(e,t),mutate:(e,t,r)=>this._applySectionMutation(e,t,r),source:(e,t,r=!1)=>{if((t==null?void 0:t.type)==="reference-marker")return Ge(t.marker);let i=["baseline","target"].includes(t)?{canonicalBasePath:[t,"at"],legacyFixedPath:[t],legacyEntityPath:t==="target"?["target_entity"]:["baseline","at","entity"]}:{};return r?this._getEffectiveResolvableScopedValue(e,t,i):this._getResolvableScopedValue(e,t,i)},setSource:(e,t,r,i)=>(t==null?void 0:t.type)==="reference-marker"?this._referenceMarkersSection._setGenericMarkerSourcePart(e,t.index,r,i):t==="baseline"?this._persistBaselineSourcePart(e,r,i):this._setCanonicalResolvablePart(e,t,r,i,t==="target"?{canonicalBasePath:["target","at"],legacyFixedPath:["target"],legacyEntityPath:["target_entity"],prunePaths:[["target","at"],["target"]]}:{})}}_renderScaleSection(e){return wt(this._createSectionContext(),e)}_renderFormattingSection(e){return Vt(this._createSectionContext(),e)}_getScopedFormattingValue(e,t){return oe(this._createSectionContext(),e,t)}_getEffectiveScopedFormattingValue(e,t){return $t(this._createSectionContext(),e,t)}_setScopedFormattingUnit(e,t){return kt(this._createSectionContext(),e,t)}_setScopedFormattingDecimal(e,t){return Et(this._createSectionContext(),e,t)}_clearFormattingOverride(e){return At(this._createSectionContext(),e)}_hasFormattingOverride(e){return Bt(this._createSectionContext(),e)}_getScopedLayoutValue(e,t){var r,i,n,a,l,s,d,c,u;return t==="height"?(i=(r=this._getScopedValue(e,["layout","height"]))!=null?r:this._getScopedValue(e,["height"]))!=null?i:"":t==="position"?(a=(n=this._getScopedValue(e,["layout","label","position"]))!=null?n:this._getScopedValue(e,["label_position"]))!=null?a:"":t==="width"?(s=(l=this._getScopedValue(e,["layout","label","width"]))!=null?l:this._getScopedValue(e,["label_width"]))!=null?s:"":t==="hero_size"?(c=(d=this._getScopedValue(e,["layout","hero","size"]))!=null?d:this._getScopedValue(e,["layout","label","hero_size"]))!=null?c:"":t==="value_size"&&(u=this._getScopedValue(e,["layout","hero","value_size"]))!=null?u:""}_getEffectiveScopedLayoutValue(e,t){return t==="height"?this._getEffectiveScopedDisplayValue(e,["layout","height"],[["height"]]):t==="position"?this._getEffectiveScopedDisplayValue(e,["layout","label","position"],[["label_position"]]):t==="width"?this._getEffectiveScopedDisplayValue(e,["layout","label","width"],[["label_width"]]):t==="hero_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","size"],[["layout","label","hero_size"]]):t==="value_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","value_size"]):""}_setScopedLayoutLabelPosition(e,t){if(!t)return this._removeCanonicalScopedValue(e,["layout","label","position"],{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});let r=this._setCanonicalScopedValue(e,["layout","label","position"],t,{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});return!r||t==="hero"?r:(this._removeCanonicalScopedValue(e,["layout","label","hero_size"],{prunePaths:[["layout","label"],["layout"]],rerender:!0}),this._removeCanonicalScopedValue(e,["layout","hero"],{prunePaths:[["layout"]],rerender:!0}),!0)}_setLayoutLabelPosition(e){return this._setScopedLayoutLabelPosition({type:"card"},e)}_setScopedLayoutHeroSize(e,t){return t?this._setCanonicalScopedValue(e,["layout","hero","size"],t,{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]}):this._removeCanonicalScopedValue(e,["layout","hero","size"],{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroSize(e){return this._setScopedLayoutHeroSize({type:"card"},e)}_normalizeHeroValueSizeValue(e){let t=this._normalizeNumberValue(e);return t===null?null:Math.min(112,Math.max(12,t))}_setScopedLayoutHeroValueSize(e,t){if(t===""||t===null||t===void 0)return this._removeCanonicalScopedValue(e,["layout","hero","value_size"],{prunePaths:[["layout","hero"],["layout"]]});let r=this._normalizeHeroValueSizeValue(t);return r===null?!1:this._setCanonicalScopedValue(e,["layout","hero","value_size"],r,{prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroValueSize(e){return this._setScopedLayoutHeroValueSize({type:"card"},e)}_setScopedLayoutHeight(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","height"],{deprecatedKeys:[["height"]],prunePaths:[["layout"]]}):r===null||r<24?!1:this._setCanonicalScopedValue(e,["layout","height"],r,{deprecatedKeys:[["height"]],prunePaths:[["layout"]]})}_setLayoutHeight(e){return this._setScopedLayoutHeight({type:"card"},e)}_setScopedLayoutLabelWidth(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","label","width"],{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]}):r===null?!1:this._setCanonicalScopedValue(e,["layout","label","width"],r,{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]})}_clearLayoutOverride(e){return this._applyScopedMutation(e,t=>{let r=this._deletePathValue(t,["layout","height"]);return r=this._deletePathValue(r,["layout","label","position"]),r=this._deletePathValue(r,["layout","label","hero_size"]),r=this._deletePathValue(r,["layout","label","width"]),r=this._deletePathValue(r,["layout","hero"]),r=this._deletePathValue(r,["height"]),r=this._deletePathValue(r,["label_position"]),r=this._deletePathValue(r,["label_width"]),r=this._pruneEmptyObjectsInTarget(r,["layout","label"]),r=this._pruneEmptyObjectsInTarget(r,["layout"]),r},{rerender:!0})}_hasLayoutOverride(e){var i,n;let t=(i=this._getScopedValue(e,["layout"]))!=null?i:{},r=this._isObject(t)?(n=t.label)!=null?n:{}:{};return this._isObject(t)&&(Object.prototype.hasOwnProperty.call(t,"height")||this._isObject(r)&&(Object.prototype.hasOwnProperty.call(r,"position")||Object.prototype.hasOwnProperty.call(r,"hero_size")||Object.prototype.hasOwnProperty.call(r,"width")))||this._isObject(t)&&this._isObject(t.hero)&&Object.keys(t.hero).length?!0:this._getScopedValue(e,["height"])!==void 0||this._getScopedValue(e,["label_position"])!==void 0||this._getScopedValue(e,["label_width"])!==void 0}_setScaleBound(e,t){return rt(this._createSectionContext(),{type:"card"},e,"fixed",t)}_clearScaleOverride(e){return zt(this._createSectionContext(),e)}_setBarFillStyle(e){return this._setScopedBarFillStyle({type:"card"},e)}_setBarColor(e){return this._setScopedBarColor({type:"card"},e)}_setGradientStops(...e){return this._gradientStopsSection._setGradientStops(...e)}_setSegments(...e){return this._segmentsSection._setSegments(...e)}_getDefaultGradientStops(...e){return this._gradientStopsSection._getDefaultGradientStops(...e)}_normalizeGradientStopPosValue(...e){return this._gradientStopsSection._normalizeGradientStopPosValue(...e)}_sanitizeGradientStopsForEmit(...e){return this._gradientStopsSection._sanitizeGradientStopsForEmit(...e)}_getGradientStopDraftColorDefault(...e){return this._gradientStopsSection._getGradientStopDraftColorDefault(...e)}_getNextSuggestedGradientStopPos(...e){return this._gradientStopsSection._getNextSuggestedGradientStopPos(...e)}_getGradientStopsDraftKey(...e){return this._gradientStopsSection._getGradientStopsDraftKey(...e)}_getGradientStopPosTextKey(...e){return this._gradientStopsSection._getGradientStopPosTextKey(...e)}_getGradientStopPosText(...e){return this._gradientStopsSection._getGradientStopPosText(...e)}_setGradientStopPosText(...e){return this._gradientStopsSection._setGradientStopPosText(...e)}_clearGradientStopPosText(...e){return this._gradientStopsSection._clearGradientStopPosText(...e)}_clearGradientStopScopeTextState(...e){return this._gradientStopsSection._clearGradientStopScopeTextState(...e)}_getGradientStopsUiRows(...e){return this._gradientStopsSection._getGradientStopsUiRows(...e)}_setGradientStopsUiRows(...e){return this._gradientStopsSection._setGradientStopsUiRows(...e)}_getStoredScopedGradientStops(...e){return this._gradientStopsSection._getStoredScopedGradientStops(...e)}_getFallbackGradientStops(...e){return this._gradientStopsSection._getFallbackGradientStops(...e)}_createGradientStopDraftState(...e){return this._gradientStopsSection._createGradientStopDraftState(...e)}_getGradientStopsDraftState(...e){return this._gradientStopsSection._getGradientStopsDraftState(...e)}_setGradientStopsDraftState(...e){return this._gradientStopsSection._setGradientStopsDraftState(...e)}_setGradientStopsDraftField(...e){return this._gradientStopsSection._setGradientStopsDraftField(...e)}_getValidGradientDraftStop(...e){return this._gradientStopsSection._getValidGradientDraftStop(...e)}_hasGradientStopDuplicate(...e){return this._gradientStopsSection._hasGradientStopDuplicate(...e)}_canAddGradientStop(...e){return this._gradientStopsSection._canAddGradientStop(...e)}_getGradientDraftValidationMessage(...e){return this._gradientStopsSection._getGradientDraftValidationMessage(...e)}_isDefaultGradientStops(...e){return this._gradientStopsSection._isDefaultGradientStops(...e)}_setScopedGradientStops(e,t,r={}){var s;let i=this._sanitizeGradientStopsForEmit(t),n=i.length<2||this._isDefaultGradientStops(i),a=this._serializeConfig((s=this._getGradientStopsUiRows(e))!=null?s:[]);this._clearGradientStopScopeTextState(e),this._setGradientStopsUiRows(e,i);let l=this._applyScopedMutation(e,d=>{let c=this._deletePathValue(d,["gradient_stops"]);return c=this._deletePathValue(c,["bar","gradient_stops"]),n||(c=this._setPathValue(c,["bar","gradient_stops"],i)),c=this._pruneEmptyObjectsInTarget(c,["bar"]),c},r);return l===!1&&(r!=null&&r.rerender)&&this._serializeConfig(i)!==a&&this._render(),l!==!1&&!(r!=null&&r.rerender)&&this._refreshGradientDraftUi(e),l}_clearGradientStopsOverride(...e){return this._gradientStopsSection._clearGradientStopsOverride(...e)}_setScopedSegments(e,t,r={}){let i=(r==null?void 0:r.sort)===!1?this._cloneDeep(t):this._sortSegmentsForEditor(t),n=this._getFallbackSegments(e),a=!Array.isArray(i)||!i.length||n.length>0&&this._segmentsEqualForEditor(i,n);this._setSegmentsUiRows(e,i);let l=this._applyScopedMutation(e,s=>{let d=this._deletePathValue(s,["bar","segments"]);return d=this._deletePathValue(d,["segments"]),d=this._deletePathValue(d,["severity"]),a||(d=this._setPathValue(d,["bar","segments"],i)),d=this._pruneEmptyObjectsInTarget(d,["bar"]),d},r);return l!==!1&&this._refreshSegmentUi(e),l}_clearSegmentsOverride(...e){return this._segmentsSection._clearSegmentsOverride(...e)}_setNeedle(...e){return this._needleSection._setNeedle(...e)}_getScopedPeakConfig(...e){return this._extremaSection._getScopedPeakConfig(...e)}_getEffectiveScopedPeakConfig(...e){return this._extremaSection._getEffectiveScopedPeakConfig(...e)}_hasPeakOverride(...e){return this._extremaSection._hasPeakOverride(...e)}_getPeakSummary(...e){return this._extremaSection._getPeakSummary(...e)}_clearPeakOverride(...e){return this._extremaSection._clearPeakOverride(...e)}_setScopedPeakEnabled(...e){return this._extremaSection._setScopedPeakEnabled(...e)}_setScopedPeakColor(...e){return this._extremaSection._setScopedPeakColor(...e)}_getScopedMarkerExtras(...e){return this._extremaSection._getScopedMarkerExtras(...e)}_hasExtremumOverride(...e){return this._extremaSection._hasExtremumOverride(...e)}_getEffectiveMarkerExtras(...e){return this._extremaSection._getEffectiveMarkerExtras(...e)}_getScopedFloorConfig(...e){return this._extremaSection._getScopedFloorConfig(...e)}_getEffectiveScopedFloorConfig(...e){return this._extremaSection._getEffectiveScopedFloorConfig(...e)}_getFloorSummary(...e){return this._extremaSection._getFloorSummary(...e)}_getMarkerResetSummary(...e){return this._extremaSection._getMarkerResetSummary(...e)}_getCardTargetMarkerSummary(...e){return this._targetSection._getCardTargetMarkerSummary(...e)}_setScopedExtremumEnabled(...e){return this._extremaSection._setScopedExtremumEnabled(...e)}_setScopedExtremumColor(...e){return this._extremaSection._setScopedExtremumColor(...e)}_setScopedExtremumReset(...e){return this._extremaSection._setScopedExtremumReset(...e)}_setScopedExtremumLabelShow(...e){return this._extremaSection._setScopedExtremumLabelShow(...e)}_setScopedExtremumLabelDecimal(...e){return this._extremaSection._setScopedExtremumLabelDecimal(...e)}_getBuiltinMarkerLabelOptions(e,t){let r=t==="target"?this._getEffectiveTargetLabelShowValue(e):this._getEffectiveMarkerExtras(e,t).labelShow;return Te(this._createSectionContext(),e,t,r)}_renderBuiltinMarkerLabelControls(e,t,r){return ye(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(...e){return Fe(this._createSectionContext(),...e)}_clearFloorOverride(...e){return this._extremaSection._clearFloorOverride(...e)}_setFixedMarkerValue(e,t,r){let i=this._normalizeNumberValue(r);return!t||i===null?this._removeCanonicalScopedValue({type:"card"},[e,"at","fixed"],{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]}):this._setCanonicalScopedValue({type:"card"},[e,"at","fixed"],i,{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]})}_setPeakShow(...e){return this._extremaSection._setPeakShow(...e)}_readFixedMarker(e){let t=this._draftConfig[e];if(this._isObject(t)){let r=this._isObject(t==null?void 0:t.at)?t.at.fixed:t==null?void 0:t.at;return{enabled:r!=null&&r!=="",value:r!=null?r:""}}return{enabled:t!=null&&t!=="",value:t!=null?t:""}}_getGradientStopsValue(...e){return this._gradientStopsSection._getGradientStopsValue(...e)}_getSegmentsValue(...e){return this._segmentsSection._getSegmentsValue(...e)}_getSegmentsScopeKey(...e){return this._segmentsSection._getSegmentsScopeKey(...e)}_getSegmentBoundaryTextKey(...e){return this._segmentsSection._getSegmentBoundaryTextKey(...e)}_getSegmentBoundaryText(...e){return this._segmentsSection._getSegmentBoundaryText(...e)}_setSegmentBoundaryText(...e){return this._segmentsSection._setSegmentBoundaryText(...e)}_clearSegmentBoundaryText(...e){return this._segmentsSection._clearSegmentBoundaryText(...e)}_clearSegmentScopeTextState(...e){return this._segmentsSection._clearSegmentScopeTextState(...e)}_getSegmentsUiRows(...e){return this._segmentsSection._getSegmentsUiRows(...e)}_setSegmentsUiRows(...e){return this._segmentsSection._setSegmentsUiRows(...e)}_getSegmentDraftState(...e){return this._segmentsSection._getSegmentDraftState(...e)}_setSegmentDraftState(...e){return this._segmentsSection._setSegmentDraftState(...e)}_setSegmentDraftField(...e){return this._segmentsSection._setSegmentDraftField(...e)}_isSegmentFillStyle(...e){return this._segmentsSection._isSegmentFillStyle(...e)}_getDefaultSegments(...e){return this._segmentsSection._getDefaultSegments(...e)}_getStoredScopedSegments(...e){return this._segmentsSection._getStoredScopedSegments(...e)}_parseSegmentBoundaryInput(...e){return this._segmentsSection._parseSegmentBoundaryInput(...e)}_formatSegmentBoundaryValue(...e){return this._segmentsSection._formatSegmentBoundaryValue(...e)}_getSegmentDraftColorDefault(...e){return this._segmentsSection._getSegmentDraftColorDefault(...e)}_getNewSegmentDefaults(...e){return this._segmentsSection._getNewSegmentDefaults(...e)}_createSegmentDraftState(...e){return this._segmentsSection._createSegmentDraftState(...e)}_normalizeSegmentForEditorComparison(...e){return this._segmentsSection._normalizeSegmentForEditorComparison(...e)}_segmentsEqualForEditor(...e){return this._segmentsSection._segmentsEqualForEditor(...e)}_getFallbackSegments(...e){return this._segmentsSection._getFallbackSegments(...e)}_parseSegmentBoundaryText(...e){return this._segmentsSection._parseSegmentBoundaryText(...e)}_compareSegmentBoundaries(...e){return this._segmentsSection._compareSegmentBoundaries(...e)}_buildSegmentValidationRows(...e){return this._segmentsSection._buildSegmentValidationRows(...e)}_getSegmentRowValidationMessage(...e){return this._segmentsSection._getSegmentRowValidationMessage(...e)}_getValidSegmentDraft(...e){return this._segmentsSection._getValidSegmentDraft(...e)}_canAddSegment(...e){return this._segmentsSection._canAddSegment(...e)}_getSegmentDraftValidationMessage(...e){return this._segmentsSection._getSegmentDraftValidationMessage(...e)}_getSegmentPreviewBoundaryValue(...e){return this._segmentsSection._getSegmentPreviewBoundaryValue(...e)}_sortSegmentsForEditor(...e){return this._segmentsSection._sortSegmentsForEditor(...e)}_getSegmentPreviewRows(...e){return this._segmentsSection._getSegmentPreviewRows(...e)}_buildEditorSegmentPreviewStyle(...e){return this._segmentsSection._buildEditorSegmentPreviewStyle(...e)}_getSegmentPreviewDomIds(...e){return this._segmentsSection._getSegmentPreviewDomIds(...e)}_renderSegmentPreview(...e){return this._segmentsSection._renderSegmentPreview(...e)}_refreshSegmentPreview(...e){return this._segmentsSection._refreshSegmentPreview(...e)}_getSegmentDomIds(...e){return this._segmentsSection._getSegmentDomIds(...e)}_refreshSegmentUi(...e){return this._segmentsSection._refreshSegmentUi(...e)}_commitSegmentDraft(...e){return this._segmentsSection._commitSegmentDraft(...e)}_commitSegmentBoundaryEdit(...e){return this._segmentsSection._commitSegmentBoundaryEdit(...e)}_commitGradientStopDraft(...e){return this._gradientStopsSection._commitGradientStopDraft(...e)}_getGradientPreviewDomIds(...e){return this._gradientStopsSection._getGradientPreviewDomIds(...e)}_refreshGradientDraftUi(...e){return this._gradientStopsSection._refreshGradientDraftUi(...e)}_commitGradientStopPosEdit(...e){return this._gradientStopsSection._commitGradientStopPosEdit(...e)}_getFillStyleValue(){return X(this._createSectionContext(),{type:"card"})}_getFillStyleFromColorMode(e){return Nt(e)}_getScopedFillStyleValue(e){return It(this._createSectionContext(),e)}_getEffectiveScopedFillStyleValue(e){return X(this._createSectionContext(),e)}_setScopedBarFillStyle(e,t){return Pt(this._createSectionContext(),e,t)}_getScopedBarColorValue(e){return nt(this._createSectionContext(),e)}_getEffectiveScopedBarColorValue(e){return jt(this._createSectionContext(),e)}_setScopedBarColor(e,t){return Tt(this._createSectionContext(),e,t)}_getScopedBarSolidFillValue(e){return pe(this._createSectionContext(),e)}_getEffectiveScopedBarSolidFillValue(e){return Lt(this._createSectionContext(),e)}_setScopedBarSolidFill(e,t){return Ft(this._createSectionContext(),e,t)}_clearEntityBarAppearance(e){return Kt(this._createSectionContext(),e)}_hasEntityBarAppearanceOverride(e){return qt(this._createSectionContext(),e)}_getScopedNeedleConfig(...e){return this._needleSection._getScopedNeedleConfig(...e)}_hasNeedleOverride(...e){return this._needleSection._hasNeedleOverride(...e)}_getEffectiveScopedNeedleConfig(...e){return this._needleSection._getEffectiveScopedNeedleConfig(...e)}_setScopedNeedleMode(...e){return this._needleSection._setScopedNeedleMode(...e)}_setScopedNeedleColor(...e){return this._needleSection._setScopedNeedleColor(...e)}_getNeedleValue(...e){return this._needleSection._getNeedleValue(...e)}_getPeakShowValue(...e){return this._extremaSection._getPeakShowValue(...e)}_getScaleFixedValue(e,t){return vt(this._createSectionContext(),e)}_getScaleEntityValue(e){return xt(this._createSectionContext(),e)}_getTargetResolvableValue(...e){return this._targetSection._getTargetResolvableValue(...e)}_getEffectiveTargetResolvableValue(...e){return this._targetSection._getEffectiveTargetResolvableValue(...e)}_getTargetMode(...e){return this._targetSection._getTargetMode(...e)}_getTargetShapeValue(...e){return this._targetSection._getTargetShapeValue(...e)}_getEffectiveMarkerDirection(...e){return ue(this._createSectionContext(),...e)}_setMarkerDirection(...e){return Me(this._createSectionContext(),...e)}_hasTargetShape(...e){return this._targetSection._hasTargetShape(...e)}_getEffectiveTargetShapeValue(...e){return this._targetSection._getEffectiveTargetShapeValue(...e)}_setTargetShape(...e){return this._targetSection._setTargetShape(...e)}_getEffectiveTargetMode(...e){return this._targetSection._getEffectiveTargetMode(...e)}_setTargetMode(...e){return this._targetSection._setTargetMode(...e)}_setTargetResolvablePart(...e){return this._targetSection._setTargetResolvablePart(...e)}_clearTargetOverride(...e){return this._targetSection._clearTargetOverride(...e)}_getTargetColorValue(...e){return this._targetSection._getTargetColorValue(...e)}_getEffectiveTargetColorValue(...e){return this._targetSection._getEffectiveTargetColorValue(...e)}_hasCustomTargetColor(...e){return this._targetSection._hasCustomTargetColor(...e)}_setTargetColor(...e){return this._targetSection._setTargetColor(...e)}_getTargetLabelShowValue(...e){return this._targetSection._getTargetLabelShowValue(...e)}_getEffectiveTargetLabelShowValue(...e){return this._targetSection._getEffectiveTargetLabelShowValue(...e)}_setTargetLabelShow(...e){return this._targetSection._setTargetLabelShow(...e)}_getTargetLabelDecimalValue(...e){return this._targetSection._getTargetLabelDecimalValue(...e)}_getEffectiveTargetLabelDecimalValue(...e){return this._targetSection._getEffectiveTargetLabelDecimalValue(...e)}_setTargetLabelDecimal(...e){return this._targetSection._setTargetLabelDecimal(...e)}_getTargetAboveFillColorValue(...e){return this._targetSection._getTargetAboveFillColorValue(...e)}_getTargetAboveFillDraftKey(...e){return this._targetSection._getTargetAboveFillDraftKey(...e)}_setTargetAboveFillDraft(...e){return this._targetSection._setTargetAboveFillDraft(...e)}_getTargetAboveFillDraft(...e){return this._targetSection._getTargetAboveFillDraft(...e)}_getBaselineColorDraftKey(...e){return this._baselineSection._getBaselineColorDraftKey(...e)}_setBaselineColorDraft(...e){return this._baselineSection._setBaselineColorDraft(...e)}_getBaselineColorDraft(...e){return this._baselineSection._getBaselineColorDraft(...e)}_getEffectiveTargetAboveFillColorValue(...e){return this._targetSection._getEffectiveTargetAboveFillColorValue(...e)}_setTargetAboveFillColor(...e){return this._targetSection._setTargetAboveFillColor(...e)}_isTargetAboveFillEnabled(...e){return this._targetSection._isTargetAboveFillEnabled(...e)}_setTargetAboveFillEnabled(...e){return this._targetSection._setTargetAboveFillEnabled(...e)}_isBaselineDirectionalColorEnabled(...e){return this._baselineSection._isBaselineDirectionalColorEnabled(...e)}_setBaselineDirectionalColorEnabled(...e){return this._baselineSection._setBaselineDirectionalColorEnabled(...e)}_hasTargetOverride(...e){return this._targetSection._hasTargetOverride(...e)}_getBaselineResolvableValue(...e){return this._baselineSection._getBaselineResolvableValue(...e)}_getEffectiveBaselineResolvableValue(...e){return this._baselineSection._getEffectiveBaselineResolvableValue(...e)}_getBaselineMode(...e){return this._baselineSection._getBaselineMode(...e)}_getEffectiveBaselineMode(...e){return this._baselineSection._getEffectiveBaselineMode(...e)}_setBaselineMode(...e){return this._baselineSection._setBaselineMode(...e)}_persistBaselineSourcePart(e,t,r){let i=t==="fixed"?this._normalizeNumberValue(r):this._normalizeTextValue(r).trim();return this._applyScopedMutation(e,n=>{let l={...this._getResolvablePartsFromTarget(n!=null?n:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]})};t==="fixed"?r===""||r===null||r===void 0||i===null?delete l.fixed:l.fixed=i:i?l.entity=i:delete l.entity;let s=this._cloneDeep(n);s=this._deletePathValue(s,["baseline","at"]);let d=l.fixed!==void 0&&l.fixed!==null&&l.fixed!=="",c=l.entity!==void 0&&l.entity!==null&&l.entity!=="";if(d||c){let u={};d&&(u.fixed=l.fixed),c&&(u.entity=l.entity),s=this._setPathValue(s,["baseline","at"],u)}return s=this._pruneEmptyObjectsInTarget(s,["baseline","at"]),s=this._pruneEmptyObjectsInTarget(s,["baseline"]),s})}_setBaselineResolvablePart(...e){return this._baselineSection._setBaselineResolvablePart(...e)}_removeScopedNeedle(...e){return this._needleSection._removeScopedNeedle(...e)}_setBaselineDirectionalColor(...e){return this._baselineSection._setBaselineDirectionalColor(...e)}_getBaselineDirectionalColorValue(...e){return this._baselineSection._getBaselineDirectionalColorValue(...e)}_getEffectiveBaselineDirectionalColorValue(...e){return this._baselineSection._getEffectiveBaselineDirectionalColorValue(...e)}_clearBaselineOverride(...e){return this._baselineSection._clearBaselineOverride(...e)}_removeBaseline(...e){return this._baselineSection._removeBaseline(...e)}_hasBaselineOverride(...e){return this._baselineSection._hasBaselineOverride(...e)}_isEntityOverrideExpanded(e){return this._expandedEntityOverrides.has(e)}_toggleEntityOverrideExpanded(e){this._expandedEntityOverrides.has(e)?this._expandedEntityOverrides.delete(e):this._expandedEntityOverrides.add(e),this._render()}_syncExpandedEntityOverrides(e){let t=new Set;this._expandedEntityOverrides.forEach(i=>{i<e&&t.add(i)}),this._expandedEntityOverrides=t;let r=new Set;this._expandedOverrideGroups.forEach(i=>{let[n,a]=String(i).split(":"),l=Number(n);Number.isInteger(l)&&l<e&&a&&r.add(`${l}:${a}`)}),this._expandedOverrideGroups=r}_isCardGroupExpanded(e){return this._expandedCardGroups.has(e)}_toggleCardGroupExpanded(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._render()}_toggleGenericMarkerExpanded(...e){return this._referenceMarkersSection._toggleGenericMarkerExpanded(...e)}_getOverrideGroupKey(e,t){return`${e}:${t}`}_isOverrideGroupExpanded(e,t){return this._expandedOverrideGroups.has(this._getOverrideGroupKey(e,t))}_toggleOverrideGroupExpanded(e,t){let r=this._getOverrideGroupKey(e,t);this._expandedOverrideGroups.has(r)?this._expandedOverrideGroups.delete(r):this._expandedOverrideGroups.add(r),this._render()}_hasExplicitOverrideValue(...e){return ft(...e)}_hasResolvableOverride(...e){return be(...e)}_getScaleOverrideSummary(e){return xr(this._createSectionContext(),e)}_getLayoutSummary(e){let t=[],r=this._getScopedLayoutValue(e,"height"),i=this._getScopedLayoutValue(e,"position"),n=this._getScopedLayoutValue(e,"width");return r!==""&&t.push(`Height ${r}`),i!==""&&t.push(`${i}`),n!==""&&t.push(`Width ${n}`),t.length?t.join(" \u2022 "):"Inherited"}_getTargetOverrideSummary(...e){return this._targetSection._getTargetOverrideSummary(...e)}_getBaselineOverrideSummary(...e){return this._baselineSection._getBaselineOverrideSummary(...e)}_getCardBaselineSummary(...e){return this._baselineSection._getCardBaselineSummary(...e)}_getBarAppearanceSummary(e){return $r(this._createSectionContext(),e)}_getScopedSegmentsValue(...e){return this._segmentsSection._getScopedSegmentsValue(...e)}_hasSegmentsOverride(...e){return this._segmentsSection._hasSegmentsOverride(...e)}_getSegmentsSummary(...e){return this._segmentsSection._getSegmentsSummary(...e)}_getEffectiveFillStyleValue(e){return X(this._createSectionContext(),e)}_getScopedGradientStopsValue(...e){return this._gradientStopsSection._getScopedGradientStopsValue(...e)}_hasGradientStopsOverride(...e){return this._gradientStopsSection._hasGradientStopsOverride(...e)}_getGradientStopsSummary(...e){return this._gradientStopsSection._getGradientStopsSummary(...e)}_buildGradientPreviewEffectiveStops(...e){return this._gradientStopsSection._buildGradientPreviewEffectiveStops(...e)}_buildEditorGradientPreviewStyle(...e){return this._gradientStopsSection._buildEditorGradientPreviewStyle(...e)}_getGradientPreviewStyle(...e){return this._gradientStopsSection._getGradientPreviewStyle(...e)}_renderGradientPreview(...e){return this._gradientStopsSection._renderGradientPreview(...e)}_getNeedleSummary(...e){return this._needleSection._getNeedleSummary(...e)}_getFormattingSummary(e){return wr(this._createSectionContext(),e)}_renderOverrideGroup({index:e,group:t,title:r,summary:i,content:n}){let a=this._isOverrideGroupExpanded(e,t);return`
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
    `}_renderCardGroup(e){return yt(e,this._isCardGroupExpanded(e.group))}_renderEntityInput(e,t){return vr(e,t)}_renderEntitySourceInput(e,t,r,i="sensor.example",n={}){return W(e,t,r,i,n)}_hasMarkersOverride(...e){return this._referenceMarkersSection._hasMarkersOverride(...e)}_getGenericMarkers(...e){return this._referenceMarkersSection._getGenericMarkers(...e)}_getGenericMarkersSummary(...e){return this._referenceMarkersSection._getGenericMarkersSummary(...e)}_getGenericMarkerScopeKey(...e){return this._referenceMarkersSection._getGenericMarkerScopeKey(...e)}_getGenericMarkerUiIds(...e){return this._referenceMarkersSection._getGenericMarkerUiIds(...e)}_resetGenericMarkerUiScope(...e){return this._referenceMarkersSection._resetGenericMarkerUiScope(...e)}_getGenericMarkerSummary(...e){return this._referenceMarkersSection._getGenericMarkerSummary(...e)}_refreshGenericMarkerSummary(...e){return this._referenceMarkersSection._refreshGenericMarkerSummary(...e)}_getGenericMarkerSource(...e){return this._referenceMarkersSection._getGenericMarkerSource(...e)}_renderGenericMarkersEditor(...e){return this._referenceMarkersSection._renderGenericMarkersEditor(...e)}_getGenericMarkerScope(...e){return this._referenceMarkersSection._getGenericMarkerScope(...e)}_setGenericMarkerList(...e){return this._referenceMarkersSection._setGenericMarkerList(...e)}_updateGenericMarker(...e){return this._referenceMarkersSection._updateGenericMarker(...e)}_setGenericMarkerSourceMode(...e){return this._referenceMarkersSection._setGenericMarkerSourceMode(...e)}_setGenericMarkerField(...e){return this._referenceMarkersSection._setGenericMarkerField(...e)}_cleanupGenericMarkersForEmit(e){if(!this._isObject(e)||!Array.isArray(e.markers))return e;let t=this._cloneDeep(e);return t.markers=t.markers.map(r=>{var n;if(!this._isObject(r))return r;let i=this._cloneDeep(r);if(i.show_marker===!0&&delete i.show_marker,this._isObject(i.at)){let a=this._cloneDeep(i.at),l=this._normalizeNumberValue(a.fixed),s=this._normalizeTextValue(a.entity).trim();l!==null?a.fixed=l:delete a.fixed,s?a.entity=s:delete a.entity,Object.keys(a).length?i.at=a:delete i.at}if(i.lane==="below"&&delete i.lane,i.shape==="circle"&&delete i.shape,i.direction==="inward"&&delete i.direction,this._normalizeColorComparisonValue(i.color)===this._normalizeColorComparisonValue("#888888")&&delete i.color,this._isObject(i.label)){let a=this._cloneDeep(i.label);a.show===!1&&delete a.show,a.show_value===!0&&delete a.show_value,a.show_unit===!0&&delete a.show_unit,typeof a.text=="string"&&(a.text=a.text.replace(/\s+/g," ").trim(),a.text||delete a.text);let l=this._normalizeDecimalValue((n=a.precision)!=null?n:a.decimal);delete a.decimal,l===null?delete a.precision:a.precision=l,delete a.unit,Object.keys(a).length?i.label=a:delete i.label}return i}),t}_renderResetOptions(e){return tt(e)}_escapeAttribute(e){return y(e)}_isHexColorValue(e){return me(e)}_expandHexColor(e){return et(e)}_normalizeColorComparisonValue(e){return O(e)}_getColorPickerValue(e,t="#000000"){return Q(e,t)}_renderColorInput(e){return I(e)}_renderListRows(e,t){return e.map((r,i)=>t(r,i)).join("")}_render(){var t;if(!this.shadowRoot||this._isRendering)return;let e=this._numericDrafts.captureFocus(this.shadowRoot);this._isRendering=!0;try{let r=this._getEntitiesValue(),i=this._getFillStyleValue(),n=this._getScopedLayoutValue({type:"card"},"position")||"left",a=this._getScopedLayoutValue({type:"card"},"hero_size")||"medium",l=this._getScopedLayoutValue({type:"card"},"value_size"),s=this._getScopedLayoutValue({type:"card"},"height"),d=this._getScopedLayoutValue({type:"card"},"width");this._syncExpandedEntityOverrides(r.length),this.shadowRoot.innerHTML=`
	      <style>${bt}</style>
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
	                ${this._renderListRows(r,(c,u)=>{var h;return`
	                  <div class="entity-shell" data-entity-shell-index="${u}">
	                    <div class="entity-main">
	                      <div class="entity-header">
	                        <div class="entity-header-main">
	                          <div class="entity-title">Entity ${u+1}</div>
	                          <div class="entity-subtitle">${this._escapeAttribute(c.entity||"Configure entity")}</div>
	                        </div>
	                        <div class="entity-actions">
	                          <button type="button" data-action="move-entity-up" data-index="${u}"${u===0?" disabled":""} aria-label="Move entity ${u+1} up">\u2191</button>
	                          <button type="button" data-action="move-entity-down" data-index="${u}"${u===r.length-1?" disabled":""} aria-label="Move entity ${u+1} down">\u2193</button>
	                          <button type="button" data-action="duplicate-entity" data-index="${u}">Duplicate</button>
	                          <button type="button" data-action="remove-entity" data-index="${u}"${r.length<=1?" disabled":""} aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                        </div>
	                      </div>
	                      <div class="entity-fields">
	                        ${this._renderEntityInput(c,u)}
	                        <input type="text" data-kind="entity-name" data-index="${u}" value="${this._escapeAttribute((h=c.name)!=null?h:"")}" placeholder="Name">
                        ${(()=>{var x;let f=this._getEntityIconMode(c,u),m=(x=customElements.get)!=null&&x.call(customElements,"ha-icon-picker")?`<ha-icon-picker data-kind="entity-icon-picker" data-index="${u}" label="Select an icon" placeholder="Search icons"${f!=="custom"?" disabled":""}></ha-icon-picker>`:`<input type="text" data-kind="entity-icon-value" data-index="${u}" value="${this._escapeAttribute(typeof c.icon=="string"?c.icon:"")}" placeholder="Select an icon"${f!=="custom"?" disabled":""} autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;return`<div class="entity-icon-field">
                            <label>Icon</label>
                            <div class="entity-icon-modes" role="radiogroup" aria-label="Entity ${u+1} icon mode">
                              ${[["default","Default"],["custom","Custom"],["off","Off"]].map(([k,S])=>`
                                <label class="entity-icon-mode-option"><input type="radio" data-kind="entity-icon-mode" data-index="${u}" name="entity-icon-mode-${u}" value="${k}"${f===k?" checked":""}>${S}</label>
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
                      ${(()=>{let f={type:"entity",index:u},m=!this._hasTargetOverride(f),x=!this._hasLayoutOverride(f),k=!this._hasPeakOverride(f),S=!this._hasExtremumOverride(f,"floor"),$=this._renderOverrideGroup({index:u,group:"scale",title:"Scale",summary:this._getScaleOverrideSummary(f),content:this._renderScaleSection(f)}),_=this._renderOverrideGroup({index:u,group:"layout",title:"Layout",summary:this._getLayoutSummary(f),content:`
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
	                          `}),g=this._renderOverrideGroup({index:u,group:"bar",title:"Bar Appearance",summary:this._getBarAppearanceSummary(f),content:at(this._createSectionContext(),f)}),v=this._renderOverrideGroup({index:u,group:"needle",title:"Needle",summary:this._getNeedleSummary(f),content:this._needleSection.render(f)}),w=this._renderOverrideGroup({index:u,group:"formatting",title:"Formatting",summary:this._getFormattingSummary(f),content:this._renderFormattingSection(f)}),E=this._renderOverrideGroup({index:u,group:"peak",title:"Peak",summary:this._getPeakSummary(f),content:this._extremaSection.render(f,"peak")}),V=this._renderOverrideGroup({index:u,group:"floor",title:"Floor",summary:this._getFloorSummary(f),content:this._extremaSection.render(f,"floor")}),T=this._renderOverrideGroup({index:u,group:"markers",title:"Reference markers",summary:this._getGenericMarkersSummary(f),content:this._renderGenericMarkersEditor(f)}),z=this._renderOverrideGroup({index:u,group:"segments",title:"Segments",summary:this._getSegmentsSummary(f),content:this._segmentsSection.render(f)}),N=this._renderOverrideGroup({index:u,group:"gradient-stops",title:"Gradient Stops",summary:this._getGradientStopsSummary(f),content:this._gradientStopsSection.render(f)}),R=this._renderOverrideGroup({index:u,group:"baseline",title:"Baseline",summary:this._getBaselineOverrideSummary(f),content:this._baselineSection.render(f)}),B=this._renderOverrideGroup({index:u,group:"target",title:"Target",summary:this._getTargetOverrideSummary(f),content:this._targetSection.render(f)});return`
                          ${$}
                          ${B}
                          ${E}
                          ${V}
                          ${T}
                          ${g}
                          ${R}
                          ${v}
	                          ${z}
	                          ${N}
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

${St({renderGroup:c=>this._renderCardGroup(c),target:{summary:this._getCardTargetMarkerSummary(),content:this._targetSection.render({type:"card"})},peak:{summary:this._getMarkerResetSummary("peak"),content:this._extremaSection.render({type:"card"},"peak")},floor:{summary:this._getMarkerResetSummary("floor"),content:this._extremaSection.render({type:"card"},"floor")},references:{summary:this._getGenericMarkersSummary({type:"card"}),content:this._renderGenericMarkersEditor({type:"card"})}})}

${at(this._createSectionContext(),{type:"card"},()=>`${this._baselineSection.render({type:"card"},c=>this._renderCardGroup(c))}${this._needleSection.render({type:"card"})}`)}

${this._segmentsSection.render({type:"card"},c=>this._renderCardGroup(c))}

${this._gradientStopsSection.render({type:"card"},c=>this._renderCardGroup(c))}

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
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(d)}">
            </div>
          </div>
	        </div>

${this._renderFormattingSection({type:"card"})}
      </div>
    `,this._bindShadowListeners(),this._syncEntityPickers(),this._syncEntityIconPickers(),this._numericDrafts.apply(this.shadowRoot,e),this._lastRenderedConfigJson=this._serializeConfig(this._draftConfig),this._applyPendingFocus()}finally{this._isRendering=!1}}_bindShadowListeners(){!this.shadowRoot||this._shadowListenersAttached||(this.shadowRoot.addEventListener("click",this._boundHandleClick),this.shadowRoot.addEventListener("change",this._boundHandleChange),this.shadowRoot.addEventListener("input",this._boundHandleInput),this.shadowRoot.addEventListener("value-changed",this._boundHandleValueChanged),this.shadowRoot.addEventListener("keydown",this._boundHandleKeydown),this._shadowListenersAttached=!0)}_syncEntityPickers(){if(!this.shadowRoot)return;let e=this._getEntitiesValue(),t=r=>{var l,s,d,c;let i=r.dataset.kind,n=r.dataset.index,a=Number(n);if(r.hass=this._hass,r.allowCustomEntity=!0,i==="entity-picker"){let u=e[a];r.value=(l=u==null?void 0:u.entity)!=null?l:"",r.label=`Entity ${a+1}`;return}if(i==="scale-min-entity-source"){r.value=this._getScaleEntityValue("min"),r.label="Min entity";return}if(i==="scale-max-entity-source"){r.value=this._getScaleEntityValue("max"),r.label="Max entity";return}if(i==="baseline-entity-source"){r.value=this._getBaselineResolvableValue({type:"card"}).entity,r.label="Baseline entity";return}if(i==="target-entity-source"){r.value=this._getTargetResolvableValue({type:"card"}).entity,r.label="Target entity";return}if(i==="entity-override-min-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:a},"min").entity,r.label=`Entity ${a+1} min entity`;return}if(i==="entity-override-max-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:a},"max").entity,r.label=`Entity ${a+1} max entity`;return}if(i==="entity-baseline-entity-source"){r.value=this._getEffectiveBaselineResolvableValue({type:"entity",index:a}).entity,r.label=`Entity ${a+1} baseline entity`;return}if(i==="entity-target-entity-source"){r.value=this._getEffectiveTargetResolvableValue({type:"entity",index:a}).entity,r.label=`Entity ${a+1} target entity`;return}if(i==="generic-marker-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(s=this._getGenericMarkerSource(h).entity)!=null?s:"",r.label="Reference marker entity"}if(i==="generic-marker-label-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(c=(d=h==null?void 0:h.label)==null?void 0:d.entity)!=null?c:"",r.label="Label content entity"}};['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{this.shadowRoot.querySelectorAll(r).forEach(t)}),customElements.whenDefined&&customElements.whenDefined("ha-entity-picker").then(()=>{['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{var i;(i=this.shadowRoot)==null||i.querySelectorAll(r).forEach(t)})}).catch(()=>{})}_syncEntityIconPickers(){if(!this.shadowRoot)return;let e=this._getEntitiesValue();this.shadowRoot.querySelectorAll('ha-icon-picker[data-kind="entity-icon-picker"]').forEach(t=>{let r=Number(t.dataset.index),i=e[r],n=this._getEntityIconMode(i,r);t.value=n==="custom"&&typeof(i==null?void 0:i.icon)=="string"?i.icon:"",t.disabled=n!=="custom",!t._sbcpIconChangeHandler&&typeof t.addEventListener=="function"&&(t._sbcpIconChangeHandler=a=>{var s;let l=(s=a.detail)==null?void 0:s.value;this._entityIconCustomPending.delete(r),this._setEntityIcon(r,typeof l=="string"&&l.trim()?l.trim():void 0)},t.addEventListener("value-changed",t._sbcpIconChangeHandler))})}_handleClick(e){var i,n,a,l,s,d;if(this._segmentsSection.handle(e,"click")||this._gradientStopsSection.handle(e,"click"))return;let t=(a=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,"[data-action]"))!=null?a:e.target,r=(l=t==null?void 0:t.dataset)==null?void 0:l.action;if(r&&!(t!=null&&t.disabled)){if(["move-entity-up","move-entity-down","duplicate-entity","remove-entity"].includes(r)&&this._entityIconCustomPending.clear(),["move-entity-up","move-entity-down","duplicate-entity","remove-entity"].includes(r)&&this._numericDrafts.reset(),r==="add-entity"){let c=[...this._getEntitiesValue(),{entity:""}],u=this._buildEntityConfigEntries(c);if(this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${c.length-1}"], [data-kind="entity-input"][data-index="${c.length-1}"]`),Array.isArray(this._draftConfig.entities)||u.length>1||!this._draftConfig.entity){let h=this._setPathValue(this._draftConfig,["entities"],u);!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(h=this._deletePathValue(h,["entity"]),this._draftConfig.name!==void 0&&(h=this._deletePathValue(h,["name"])),this._draftConfig.icon!==void 0&&(h=this._deletePathValue(h,["icon"]))),this._applyUserConfig(h,{rerender:!0})}else this._setValueAtPath(["entity"],(d=(s=c[0])==null?void 0:s.entity)!=null?d:"",{rerender:!0});return}if(r==="move-entity-up"){this._moveEntityRow(Number(t.dataset.index),-1);return}if(r==="move-entity-down"){this._moveEntityRow(Number(t.dataset.index),1);return}if(r==="duplicate-entity"){let c=Number(t.dataset.index);this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${c+1}"], [data-kind="entity-picker"][data-index="${c+1}"], [data-kind="entity-input"][data-index="${c+1}"]`),this._duplicateEntityRow(c);return}if(r==="toggle-entity-overrides"){this._toggleEntityOverrideExpanded(Number(t.dataset.index));return}if(r==="toggle-override-group"){this._toggleOverrideGroupExpanded(Number(t.dataset.index),t.dataset.group);return}if(r==="toggle-card-group"){this._toggleCardGroupExpanded(t.dataset.group);return}if(r==="remove-entity"){this._removeEntityRow(Number(t.dataset.index));return}this._baselineSection.handleClick(t)||this._referenceMarkersSection.handleClick(t)}}_handleChange(e){var r,i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"change")||this._gradientStopsSection.handle(e,"change"))return;let t=(i=(r=e.target)==null?void 0:r.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleInput(e){var i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"input")||this._gradientStopsSection.handle(e,"input"))return;let t=e.target;if(!t||t.tagName==="HA-ENTITY-PICKER"||t.tagName==="INPUT"&&["checkbox","radio"].includes(t.type))return;let r=(i=t.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleValueChanged(e){var t;((t=e.target)==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&this._handleFieldEvent(e)}_handleKeydown(e){this._segmentsSection.handle(e,"keydown")||this._gradientStopsSection.handle(e,"keydown")}_handleFieldEvent(e){var d,c,u,h,f,m,x,k,S,$,_;if(this._segmentsSection.handle(e,"field")||this._gradientStopsSection.handle(e,"field"))return;let t=e.target,r=(d=t==null?void 0:t.dataset)==null?void 0:d.field,i=(c=t==null?void 0:t.dataset)==null?void 0:c.kind,n=r!=null&&r.endsWith("-text-fallback")?r.slice(0,-14):r,a=i!=null&&i.endsWith("-text-fallback")?i.slice(0,-14):i,l=(u=e.detail)==null?void 0:u.value,s=l!=null?l:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if(!this._referenceMarkersSection.handleField({target:t,kind:a,value:s})){if(n==="title")return void this._setTitle(s);if(!it(this._createSectionContext(),{field:n,value:s})){if(n==="layout-label-position")return void this._setLayoutLabelPosition(s);if(n==="layout-label-hero-size")return void this._setLayoutHeroSize(s);if(n==="layout-hero-value-size")return void this._setLayoutHeroValueSize(s);if(n==="layout-height")return void this._setLayoutHeight(s);if(n==="layout-label-width")return void this._setScopedLayoutLabelWidth({type:"card"},s);if(!xe(this._createSectionContext(),{field:n,value:s})&&!we(this._createSectionContext(),{field:n,value:s})&&!(this._needleSection.handleField({field:n,kind:a,index:(h=t.dataset)==null?void 0:h.index,value:s})||this._baselineSection.handleField({field:n,kind:a,index:(f=t.dataset)==null?void 0:f.index,value:s})||this._targetSection.handleField({field:n,kind:a,index:(m=t.dataset)==null?void 0:m.index,value:s})||this._extremaSection.handleField({field:n,kind:a,index:(x=t.dataset)==null?void 0:x.index,value:s}))){if(a==="entity-picker"||a==="entity-input"){let g=Number(t.dataset.index),v=this._getEntitiesValue().map((E,V)=>V===g?{...E,entity:this._normalizeTextValue(s)}:E),w=this._buildEntityConfigEntries(v);Array.isArray(this._draftConfig.entities)||w.length>1||!this._draftConfig.entity?this._setValueAtPath(["entities"],w):this._setValueAtPath(["entity"],(S=(k=v[0])==null?void 0:k.entity)!=null?S:"");return}if(a==="entity-name")return void this._setEntityField(Number(t.dataset.index),"name",s);if(a==="entity-icon-mode"){let g=Number(t.dataset.index);if(s==="default")this._entityIconCustomPending.delete(g),this._setEntityIcon(g,void 0)||this._render();else if(s==="off")this._entityIconCustomPending.delete(g),this._setEntityIcon(g,!1);else if(s==="custom"){let v=this._getEntitiesValue()[g];if(typeof(v==null?void 0:v.icon)=="string"&&v.icon.trim())this._entityIconCustomPending.delete(g);else{this._entityIconCustomPending.add(g);let w=this._getEntityRawEntries()[g];w&&Object.prototype.hasOwnProperty.call(w,"icon")?this._setEntityIcon(g,void 0)||this._render():this._render()}}return}if(a==="entity-icon-value"){let g=typeof s=="string"?s.trim():"";return this._entityIconCustomPending.delete(Number(t.dataset.index)),void this._setEntityIcon(Number(t.dataset.index),g||void 0)}if(!xe(this._createSectionContext(),{kind:a!=null&&a.startsWith("scale-")?a:void 0,value:s})&&!xe(this._createSectionContext(),{kind:a,index:($=t==null?void 0:t.dataset)==null?void 0:$.index,value:s})){if(a==="entity-override-height")return void this._setScopedLayoutHeight({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-inherit")return s?void this._clearLayoutOverride({type:"entity",index:Number(t.dataset.index)}):void 0;if(a==="entity-layout-label-position")return void this._setScopedLayoutLabelPosition({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-label-hero-size")return void this._setScopedLayoutHeroSize({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-hero-value-size")return void this._setScopedLayoutHeroValueSize({type:"entity",index:Number(t.dataset.index)},s);if(a==="entity-layout-label-width")return void this._setScopedLayoutLabelWidth({type:"entity",index:Number(t.dataset.index)},s);it(this._createSectionContext(),{kind:a,index:(_=t==null?void 0:t.dataset)==null?void 0:_.index,value:s})||a==="entity-bar-inherit"&&we(this._createSectionContext(),{kind:a,index:t.dataset.index,value:s})||we(this._createSectionContext(),{kind:a,index:t.dataset.index,value:s})}}}}}};function Re(o,e){var r,i,n,a,l;let t=(r=o.scale)==null?void 0:r[e];if(t!==void 0){let s=ee(t);return{fixed:(i=s.fixed)!=null?i:"",entity:(n=s.entity)!=null?n:""}}return{fixed:(a=o[e])!=null?a:"",entity:(l=o[`${e}_entity`])!=null?l:""}}function ze(o,e,t,r,i,n,a=!1){let l=(s,d)=>n?p(s,d):P(s,d,i);if(b(t)){if(r==="fixed"&&n)return p(p(o,[...e,"fixed"]),[...e,"value"]);let s=r==="fixed"&&t.fixed===void 0&&t.value!==void 0?"value":r;return l(o,[...e,s])}if(t!=null){let s=a?re(t):null,d=ne(t)?"entity":Number.isFinite(s)?"percent":"fixed";return r===d?l(o,e):n?o:P(o,e,{[d]:d==="percent"?s:t,[r]:i})}return n?o:P(o,[...e,r],i)}function Tr(o,e,t,r){var l;let i=t==="fixed"?K(r):D(r).trim(),n=t==="fixed"?i===null:!i,a=(l=o.scale)==null?void 0:l[e];if(a===void 0&&(o[e]!==void 0||o[`${e}_entity`]!==void 0)){let s=[t==="fixed"?e:`${e}_entity`];return n?p(o,s):P(o,s,i)}return ze(o,["scale",e],a,t,i,n)}function Ae(o){var r,i;let e=o.baseline;if(!b(e))return{fixed:e!=null?e:"",entity:""};let t=ee(e.at,null,null,{allowPercent:!0});return{fixed:(r=t.fixed)!=null?r:"",entity:(i=t.entity)!=null?i:"",...Number.isFinite(t.percent)?{percent:t.percent}:{}}}function Fr(o,e,t){var a;if(e==="mode")return Cr(o,"baseline",t);if(e==="percent")return Dr(o,"baseline",t);let r=e==="fixed"?K(t):D(t).trim(),i=e==="fixed"?r===null:!r,n=o.baseline;if(!b(n)&&n!==void 0&&n!==null){if(e==="fixed")return i?p(o,["baseline"]):P(o,["baseline"],r);if(i)return o;o=P(o,["baseline"],{at:n})}return ze(o,["baseline","at"],(a=o.baseline)==null?void 0:a.at,e,r,i,!0)}function Be(o){var t,r,i;let e=o.target;if(b(e)&&e.at!==void 0){let n=ee(e.at,null,null,{allowPercent:!0});return{fixed:(t=n.fixed)!=null?t:"",entity:(r=n.entity)!=null?r:"",...Number.isFinite(n.percent)?{percent:n.percent}:{}}}return{fixed:b(e)?"":e!=null?e:"",entity:(i=o.target_entity)!=null?i:""}}function Ct(o){if(b(o.target))return o;let e=o.target,t=o.target_entity,r=t!==void 0?{...e!=null?{fixed:e}:{},entity:t}:e;return P(o,["target"],r==null?{}:{at:r})}function Mr(o,e,t){if(e==="mode")return Cr(o,"target",t);if(e==="percent")return Dr(o,"target",t);let r=e==="fixed"?K(t):D(t).trim(),i=e==="fixed"?r===null:!r,n=o.target;if((!b(n)||n.at===void 0)&&(n!==void 0&&!b(n)||o.target_entity!==void 0))return e==="entity"?i?p(o,["target_entity"]):P(o,["target_entity"],r):b(n)?i?o:P(o,["target","at"],{entity:o.target_entity,fixed:r}):i?p(o,["target"]):P(o,["target"],r);let a=ze(o,["target","at"],n==null?void 0:n.at,e,r,i,!0);return e==="entity"&&(a=p(a,["target_entity"])),a}function Cr(o,e,t){var s;if(!["fixed","entity","entity-fallback","percent"].includes(t))return o;let i=(e==="target"?Be:Ae)(o),n=(s=o[e])==null?void 0:s.at,a=e==="target"?Ct(o):b(o.baseline)?o:P(o,["baseline"],{at:o.baseline}),l=b(n)?{...n}:{};for(let d of["fixed","value","entity","percent"])delete l[d];if(t==="percent"){let d=Number.isFinite(i.percent)?i.percent:50;l=b(n)?{...l,percent:d}:`${d}%`}else t!=="entity"&&(l.fixed=i.fixed!==""&&i.fixed!==void 0?i.fixed:50),t!=="fixed"&&(l.entity=i.entity||""),!b(n)&&t==="fixed"&&(l=l.fixed),!b(n)&&t==="entity"&&l.entity&&(l=l.entity);return a=P(a,[e,"at"],l),e==="target"?p(a,["target_entity"]):a}function Dr(o,e,t){var s,d;let r=t===null,i=Se(t);if(!r&&i===null)return o;let n=(s=o[e])==null?void 0:s.at,a=[e,"at"];if(b(n))return r?p(o,[...a,"percent"]):P(o,[...a,"percent"],i);if(Number.isFinite(re(n)))return r?p(o,a):P(o,a,`${i}%`);if(r)return o;let l=e==="target"?Ct(o):b(o.baseline)?o:P(o,["baseline"],{at:o.baseline});return ze(l,a,(d=l[e])==null?void 0:d.at,"percent",i,!1,!0)}function Jt(o,e){var r;let t=[["bar",e],[e],...e==="segments"?[["severity"]]:[]];return(r=t.find(i=>G(o,i)!==void 0))!=null?r:t[0]}function Or(o){var e;return b(o)?Number.isFinite(o.percent)?`${o.percent}%`:(e=o.fixed)!=null?e:o.value:o}function Yt(o,e){let t,r=()=>{let i=o.read({type:"card"},[]),n=G(i,Jt(i,e));return n!==void 0?Array.isArray(n)?n:[]:e==="segments"?t._getFallbackSegments({type:"card"}):t._getDefaultGradientStops()};return{patchOnly:!0,autoEnds:e==="segments",cssText:e==="segments",segmentSpace:()=>{var a,l;let i=o.read({type:"card"},[]),n=Jt(i,e);return n[0]==="severity"?"percent":n[0]==="bar"&&(l=(a=i.bar)==null?void 0:a.segment_space)!=null?l:null},rows(i,n){return t=n,r().map(a=>{var l;return e==="segments"?{...a,from:Or(a==null?void 0:a.from),to:Or(a==null?void 0:a.to)}:{...a,pos:(l=n._normalizeGradientStopPosValue(a==null?void 0:a.pos))!=null?l:a==null?void 0:a.pos}})},write(i,n,a,l){if(!l)throw new Error("Feature palette writes require an explicit item operation");let s=o.mutate(i,d=>{let c=Jt(d,e),u=[...r()];if(l.type==="edit"){if(l.index<0||l.index>=u.length)return d;let h={...u[l.index],[l.field]:l.value};l.value===void 0&&delete h[l.field],u[l.index]=h}else if(l.type==="add")u.push(M(l.item));else if(l.type==="remove")u.splice(l.index,1);else throw new Error("Unsupported palette operation");return P(d,c,u)});return s!==!1&&l.type!=="edit"&&(e==="segments"?t._clearSegmentScopeTextState(i):t._clearGradientStopScopeTextState(i)),s}}}function Xt(o){let e=o==null?void 0:o.at;return typeof e=="number"?Ge({at:{fixed:e}}):b(e)&&e.fixed===void 0&&e.value!==void 0?Ge({at:{...e,fixed:e.value}}):Ge(o)}function Gr(o,e,t,r){var d;if(!Array.isArray(o.markers)||!o.markers[e])return o;let i=["markers",e,"at"],n=(d=o.markers[e])==null?void 0:d.at,a=t==="entity"?D(r).trim():K(r),l=t==="entity"?!a:a===null;if(t==="percent")return P(o,i,l?null:`${a}%`);let s=ze(o.markers[e],["at"],n,t,a,l);return P(o,["markers",e],s)}function Rr(o,e){var l;let t=Array.isArray(o.markers)?[...o.markers]:[],{type:r,index:i,path:n,value:a}=e;if(r==="add")t.push({at:{fixed:50}});else{if(i<0||i>=t.length||!Number.isInteger(i))return o;if(r==="remove")t.splice(i,1);else if(r==="move"){let s=i+e.delta;if(s<0||s>=t.length)return o;[t[i],t[s]]=[t[s],t[i]]}else if(r==="field"){let s=a===void 0?p(t[i],n):P(t[i],n,a);n[0]==="label"&&n[1]==="precision"&&(s=p(s,["label","decimal"])),t[i]=n[0]==="label"?C(s,["label"]):s}else if(r==="mode"){let s;if(a==="percent")s="50%";else{let d=Xt(t[i]);s=b((l=t[i])==null?void 0:l.at)?M(t[i].at):{...d.entity?{entity:d.entity}:{},...d.fixed!==""&&d.fixed!==void 0?{fixed:d.fixed}:{}},delete s.percent,a==="fixed"?(delete s.entity,s.fixed===void 0&&s.value===void 0&&(s.fixed=50)):(s.entity||(s.entity=""),a==="entity"&&(delete s.fixed,delete s.value),a==="entity-fallback"&&s.fixed===void 0&&s.value===void 0&&(s.fixed=50))}t[i]=P(t[i],["at"],s)}}return P(o,["markers"],t)}function zr(o,{key:e,path:t,value:r,field:i}){if(t[0]==="reset"&&r&&!ot(r))return o;(i==="text"&&!r||r===null||t[0]==="reset"&&!r)&&(r=void 0);let n=r===void 0?p(o,[e,...t]):P(o,[e,...t],r);return i==="precision"&&(n=p(n,[e,"label","decimal"])),e==="peak"&&t[0]==="enabled"&&(n=p(n,["show_peak"]),b(o.peak_marker)&&(n=P(n,["peak_marker","show"],r))),e==="peak"&&t[0]==="color"&&(n=p(n,["peak_color"]),n=p(n,["peak_marker","color"]),n=C(n,["peak_marker"])),C(n,[e,...t.slice(0,-1)])}function Ar(o,{path:e,value:t,deprecatedKeys:r=[],field:i}){(i==="text"&&!t||t===null)&&(t=void 0);let n=t===void 0?o:Ct(o);return n=t===void 0?p(n,["target",...e]):P(n,["target",...e],t),n=te(n,r),i==="show"&&(n=p(n,["show_target_label"])),i==="precision"&&(n=p(n,["target","label","decimal"])),C(n,["target",...e.slice(0,-1)])}function Br(o,{field:e,value:t}){var l;let r=["bar","needle"],i=(l=o.bar)==null?void 0:l.needle;if(e==="mode"){let s=t==="enabled";return i===void 0&&!s?o:P(o,b(i)?[...r,"show"]:r,s)}if(!t||O(t)===O("#ffffff"))return C(p(o,[...r,"color"]),r);let a=b(i)?i:typeof i=="boolean"?{show:i}:{};return P(o,r,{...a,color:t})}function Nr(o,{path:e,value:t}){let r=o.baseline;if(!b(r)&&r!==void 0&&r!==null){if(t===void 0)return o;o=P(o,["baseline"],{at:r})}let i=["baseline",...e],n=t===void 0?p(o,i):P(o,i,t);return t===void 0&&(e.length>1&&(n=C(n,["baseline",e[0]])),n=C(n,["baseline"])),n}var F={type:"card"},Qt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._context={},this._chooseEntity=!1,this._renderEpoch=0,this._updateComplete=Promise.resolve(),this._cssColorDrafts=new Map,this._numericDrafts=new ve,this._expandedCardGroups=new Set;let e=this._createSectionContext(),t={cssText:!0,percentSources:!0};this._needleSection=new Ve(e,t),this._baselineSection=new Pe(e,t),this._targetSection=new Ce(e,t),this._extremaSection=new De(e,t);let r={root:()=>this.shadowRoot,render:()=>{this._paletteRenderRequested=!0,this._requestRender()},focus:n=>{this._pendingPaletteFocus=n},hass:()=>this._hass};this._referenceMarkersSection=new Oe(e,{root:r.root,render:()=>this._requestRender()},t),this._segmentsSection=new ke(e,r,Yt(e,"segments")),this._gradientStopsSection=new Ee(e,r,Yt(e,"gradient_stops"));for(let n of["click","keydown"])this.shadowRoot.addEventListener(n,a=>{var l,s,d,c,u;if(n==="click"){let h=(d=(s=(l=a.target)==null?void 0:l.closest)==null?void 0:s.call(l,"[data-action]"))!=null?d:a.target;if(((c=h==null?void 0:h.dataset)==null?void 0:c.action)==="toggle-card-group"){this._toggleCardGroup(h.dataset.group);return}if(this._baselineSection.handleClick(h)||this._targetSection.handleClick(h)){this._requestRender();return}if(this._referenceMarkersSection.handleClick(h)){if(((u=h==null?void 0:h.dataset)==null?void 0:u.action)==="add-generic-marker"){let f=this._referenceMarkersSection._getGenericMarkers(F);this._pendingReferenceFocusId=this._referenceMarkersSection._getGenericMarkerUiIds(F,f.length).at(-1)}this._requestRender();return}}this._segmentsSection.handle(a)||this._gradientStopsSection.handle(a)});let i=n=>this._handleField(n);for(let n of["input","change","value-changed"])this.shadowRoot.addEventListener(n,i);this.shadowRoot.addEventListener("focusout",n=>{var a,l;(l=(a=n.target)==null?void 0:a.matches)!=null&&l.call(a,"input, select, ha-entity-picker")&&this._requestRender()}),customElements.whenDefined("ha-entity-picker").then(()=>{this.isConnected&&this._requestRender()})}setConfig(e){if(!b(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");J(e)!==J(this._config)&&(this._paletteRenderRequested||(this._paletteRenderRequested=["bar.segments","bar.gradient_stops","segments","severity","gradient_stops"].some(t=>J(G(e,t.split(".")))!==J(G(this._config,t.split("."))))),this._config=M(e),this._cssColorDrafts.clear(),this._numericDrafts.reset(),this._baselineSection.reset(),this._targetSection.reset(),this._referenceMarkersSection.reset(),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._chooseEntity=!1,this._configReplaced=!0),this._requestRender()}set hass(e){this._hass=e,this._requestRender()}get hass(){return this._hass}set context(e){this._context=e!=null?e:{},this._requestRender()}get context(){return this._context}get updateComplete(){return this._updateComplete}get _explicitEntity(){return typeof this._config.entity=="string"?this._config.entity.trim():""}get _effectiveEntity(){return this._explicitEntity||this._context.entity_id||""}get _showEntityPicker(){return!!this._explicitEntity||this._chooseEntity||!this._context.entity_id}connectedCallback(){this._requestRender()}disconnectedCallback(){this._renderEpoch+=1,this._renderScheduled=!1}_requestRender(){if(this._renderScheduled)return;this._renderScheduled=!0;let e=this._renderEpoch;this._updateComplete=Promise.resolve().then(()=>{e===this._renderEpoch&&(this._renderScheduled=!1,this._render())})}_createSectionContext(){return{read:(e,t)=>G(this._config,t),mutate:(e,t,r)=>this._mutate(i=>{var n,a,l,s;return r!=null&&r.referenceMarkerEdit?Rr(i,r.referenceMarkerEdit):r!=null&&r.needleEdit?Br(i,r.needleEdit):r!=null&&r.baselineEdit?Nr(i,r.baselineEdit):r!=null&&r.targetEdit||((n=r==null?void 0:r.markerEdit)==null?void 0:n.key)==="target"?Ar(i,(a=r.targetEdit)!=null?a:r.markerEdit):r!=null&&r.extremumEdit||["peak","floor"].includes((l=r==null?void 0:r.markerEdit)==null?void 0:l.key)?zr(i,(s=r.extremumEdit)!=null?s:r.markerEdit):t(i)}),source:(e,t)=>(t==null?void 0:t.type)==="reference-marker"?Xt(t.marker):t==="baseline"?Ae(this._config):t==="target"?Be(this._config):Re(this._config,t),setSource:(e,t,r,i)=>this._mutate(n=>(t==null?void 0:t.type)==="reference-marker"?Gr(n,t.index,r,i):t==="baseline"?Fr(n,r,i):t==="target"?Mr(n,r,i):Tr(n,t,r,i))}}_mutate(e){var r,i,n,a,l,s,d,c;let t=e(this._config);if(J(t)===J(this._config))return!1;if(((i=(r=t.bar)==null?void 0:r.segments)==null?void 0:i.length)!==((a=(n=this._config.bar)==null?void 0:n.segments)==null?void 0:a.length)||((l=t.segments)==null?void 0:l.length)!==((s=this._config.segments)==null?void 0:s.length)||((d=t.severity)==null?void 0:d.length)!==((c=this._config.severity)==null?void 0:c.length))for(let u of this._cssColorDrafts.keys())u.startsWith("segment-")&&this._cssColorDrafts.delete(u);return this._config=t,this._requestRender(),this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:M(t)}})),!0}_handleField(e){var l,s,d,c,u,h,f,m,x,k;let t=e.target;if(this._configReplaced||(t==null?void 0:t.isConnected)===!1||(t==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&e.type!=="value-changed"||this._numericDrafts.handle(e,this._isRendering))return;let r=(s=(l=t==null?void 0:t.dataset)==null?void 0:l.field)==null?void 0:s.replace(/-text-fallback$/,""),i=(c=(d=t==null?void 0:t.dataset)==null?void 0:d.kind)==null?void 0:c.replace(/-text-fallback$/,""),n=e.type==="value-changed"?(u=e.detail)==null?void 0:u.value:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if((t==null?void 0:t.type)==="color"&&this._cssColorDrafts.delete(`${t.id}-text-fallback`),((h=t==null?void 0:t.dataset)==null?void 0:h.cssColor)==="true"){let S=!n.trim()||CSS.supports("color",n);if((f=t.setCustomValidity)==null||f.call(t,S?"":"Enter a valid CSS color."),t.setAttribute("aria-invalid",S?"false":"true"),S?this._cssColorDrafts.delete(t.id):this._cssColorDrafts.set(t.id,n),!S&&i!=="segment-draft-color")return}if(r==="feature-entity-override"){this._chooseEntity=!!n,n||this._mutate(S=>p(S,["entity"])),this._requestRender();return}if(i==="feature-entity-source"){let S=typeof n=="string"?n.trim():"";this._chooseEntity=!1,this._mutate($=>S?P($,["entity"],S):p($,["entity"])),this._requestRender();return}if(i!=null&&i.startsWith("generic-marker-")){let S=(k=(x=(m=t.closest)==null?void 0:m.call(t,".generic-marker-item"))==null?void 0:x.dataset)==null?void 0:k.markerUiId,$=this._referenceMarkersSection._getGenericMarkerUiIds(F,this._referenceMarkersSection._getGenericMarkers(F).length);if(S&&S!==$[Number(t.dataset.markerIndex)])return}if(this._referenceMarkersSection.handleField({target:t,kind:i,value:n}))return;if(this._segmentsSection.handle(e)||this._gradientStopsSection.handle(e)){this._requestRender();return}if(this._needleSection.handleField({field:r,kind:i,value:n})||this._baselineSection.handleField({field:r,kind:i,value:n})||this._targetSection.handleField({field:r,kind:i,value:n})||this._extremaSection.handleField({field:r,kind:i,value:n}))return;let a=this._createSectionContext();xe(a,{field:r,kind:i,value:n})||it(a,{field:r,kind:i,value:n})||we(a,{field:r,kind:i,value:n},{animation:!0,cssText:!0})}_entityDescription(){return this._explicitEntity?`Using explicit entity: ${this._explicitEntity}`:this._context.entity_id?`Using parent card entity: ${this._context.entity_id}`:"An entity is required. Select an entity below."}_renderEntitySection(){return`<div class="section">
      <div class="section-head"><h3>Entities</h3></div>
      <div id="feature-entity-status" class="section-note" role="status">${y(this._entityDescription())}</div>
      ${this._context.entity_id||this._explicitEntity?`<div class="toggle">
        <input id="feature-entity-override" type="checkbox" data-field="feature-entity-override"${this._explicitEntity||this._chooseEntity?" checked":""}>
        <label for="feature-entity-override">Use explicit entity</label>
      </div>`:""}
      ${this._showEntityPicker?`<div class="field-row">
        <label for="feature-entity">Entity override</label>
        ${W("feature-entity-source","feature",this._explicitEntity)}
      </div>`:""}
    </div>`}_renderCardGroup(e){return yt(e,this._expandedCardGroups.has(e.group))}_toggleCardGroup(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._syncDisclosures()}_syncDisclosures(){var t;let e={"marker-target":this._targetSection._getCardTargetMarkerSummary(),"marker-peak":this._extremaSection._getMarkerResetSummary("peak"),"marker-floor":this._extremaSection._getMarkerResetSummary("floor"),"generic-markers":this._referenceMarkersSection._getGenericMarkersSummary(F),baseline:this._baselineSection._getCardBaselineSummary(),segments:this._segmentsSection._getSegmentsSummary(F),"gradient-stops":this._gradientStopsSection._getGradientStopsSummary(F)};for(let[r,i]of Object.entries(e)){let n=this.shadowRoot.querySelector(`#card-group-${r}`),a=(t=n==null?void 0:n.closest)==null?void 0:t.call(n,".override-group"),l=this._expandedCardGroups.has(r);n==null||n.setAttribute("aria-expanded",String(l)),a==null||a.setAttribute("data-expanded",String(l));let s=this.shadowRoot.querySelector(`#card-group-${r}-title`);s!=null&&s.textContent&&(s.textContent=`${l?"\u25BE":"\u25B8"} ${s.textContent.slice(2)}`);let d=this.shadowRoot.querySelector(`#card-group-${r}-summary`);d&&(d.textContent=i);let c=a==null?void 0:a.querySelector(".override-group-body");c&&(c.style.display=l?"grid":"none")}for(let r of this.shadowRoot.querySelectorAll(".generic-marker-item")){let i=this._referenceMarkersSection._expandedGenericMarkerUiIds.has(r.dataset.markerUiId);r.setAttribute("data-expanded",String(i)),r.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),r.querySelector(".generic-marker-body").style.display=i?"grid":"none"}}_captureFocus(){var a,l,s,d,c;let e=this.shadowRoot.activeElement;if(!e)return null;let t=(s=(l=(a=e.closest)==null?void 0:a.call(e,".generic-marker-item"))==null?void 0:l.dataset)==null?void 0:s.markerUiId,r=e.id?`#${e.id}`:e.dataset.field?`[data-field="${e.dataset.field}"]`:e.dataset.kind?`[data-kind="${e.dataset.kind}"]`:t&&e.dataset.action?`.generic-marker-item[data-marker-ui-id="${t}"] [data-action="${e.dataset.action}"]`:e.dataset.action?`[data-action="${e.dataset.action}"]`:null,i=(c=(d=e.dataset.segmentIndex)!=null?d:e.dataset.stopIndex)!=null?c:e.dataset.index,n=r&&e.dataset.kind&&i!==void 0?`${r}[data-${e.dataset.segmentIndex!==void 0?"segment-index":e.dataset.stopIndex!==void 0?"stop-index":"index"}="${i}"]`:r;return n?{selector:n,start:e.selectionStart,end:e.selectionEnd}:null}_render(){var h,f,m,x,k,S,$,_,g,v;let e=X(this._createSectionContext(),F),t=this._segmentsSection._getScopedSegmentsValue(F),r=this._gradientStopsSection._getScopedGradientStopsValue(F),i=this._referenceMarkersSection._getGenericMarkers(F),n=this._referenceMarkersSection._getGenericMarkerUiIds(F,i.length),a=JSON.stringify(i.map((w,E)=>[n[E],this._referenceMarkersSection._getGenericMarkerSource(w).mode])),l=JSON.stringify([!!(this._context.entity_id||this._explicitEntity),this._showEntityPicker,e,t.length,r.length,!me(this._gradientStopsSection._getGradientStopsDraftState(F).color),...r.map(w=>!me(w.color)),!!customElements.get("ha-entity-picker")]),s=(f=(h=this.shadowRoot.activeElement)==null?void 0:h.dataset)==null?void 0:f.field,d=(x=(m=this.shadowRoot.activeElement)==null?void 0:m.dataset)==null?void 0:x.kind,c=(d==null?void 0:d.endsWith("-text-fallback"))||(s==null?void 0:s.endsWith("-text-fallback"))||s==="feature-entity-override"&&!this._context.entity_id&&!this._explicitEntity||((S=(k=this.shadowRoot.activeElement)==null?void 0:k.validity)==null?void 0:S.badInput)&&this._numericDrafts.captureFocus(this.shadowRoot),u=!1;if(a!==this._referenceStructureSignature&&!c){this._isRendering=!0;try{u=!this._referenceMarkersSection.syncStructure(F)}finally{this._isRendering=!1}}if((l!==this._structureSignature||this._paletteRenderRequested||u)&&!c){let w=this._captureFocus(),E=this._createSectionContext();this._isRendering=!0;try{this.shadowRoot.innerHTML=`<style>${bt}
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
        ${wt(E,F)}
        ${St({renderGroup:T=>this._renderCardGroup(T),target:{summary:this._targetSection._getCardTargetMarkerSummary(),content:this._targetSection.render(F)},peak:{summary:this._extremaSection._getMarkerResetSummary("peak"),content:this._extremaSection.render(F,"peak")},floor:{summary:this._extremaSection._getMarkerResetSummary("floor"),content:this._extremaSection.render(F,"floor")},references:{summary:this._referenceMarkersSection._getGenericMarkersSummary(F),content:this._referenceMarkersSection.render(F)}})}
        ${at(E,F,()=>`${this._baselineSection.render(F,T=>this._renderCardGroup(T))}${this._needleSection.render(F)}`,{animation:!0,cssText:!0})}
        ${this._segmentsSection.render(F,T=>this._renderCardGroup(T))}
        ${this._gradientStopsSection.render(F,T=>this._renderCardGroup(T))}
        ${Vt(E,F)}
      </div>`}finally{this._isRendering=!1}this._structureSignature=l,this._paletteRenderRequested=!1,this._syncControls();let V=w&&this.shadowRoot.querySelector(w.selector);($=V==null?void 0:V.focus)==null||$.call(V,{preventScroll:!0}),(V==null?void 0:V.type)==="text"&&w.start!=null&&((_=V.setSelectionRange)==null||_.call(V,w.start,w.end))}else this._syncControls();if(c||(this._referenceStructureSignature=a),this._pendingPaletteFocus&&((v=(g=this.shadowRoot.querySelector(this._pendingPaletteFocus))==null?void 0:g.focus)==null||v.call(g,{preventScroll:!0}),this._pendingPaletteFocus=null),this._pendingReferenceFocusId){let w=this.shadowRoot.querySelector(`.generic-marker-item[data-marker-ui-id="${this._pendingReferenceFocusId}"] .generic-marker-toggle`);w==null||w.focus({preventScroll:!0}),w==null||w.scrollIntoView({block:"nearest",inline:"nearest"}),this._pendingReferenceFocusId=null}this._configReplaced=!1}_syncControls(){var d,c,u,h,f,m,x,k,S,$;let e=this._createSectionContext(),t=nt(e,F),r={"scale-min":Re(this._config,"min").fixed,"scale-max":Re(this._config,"max").fixed,"bar-fill-style":X(e,F),"bar-color":Q(t,"#4a9eff"),"bar-color-text-fallback":t,"bar-needle-mode":this._needleSection._getScopedNeedleConfig(F).mode,"bar-needle-color":Q(this._needleSection._getScopedNeedleConfig(F).color,"#ffffff"),"bar-needle-color-text-fallback":this._needleSection._getScopedNeedleConfig(F).color,"baseline-mode":this._baselineSection._getBaselineMode(F),"baseline-value":Ae(this._config).fixed,"baseline-source-mode":this._baselineSection._getSourceMode(),"baseline-percent":(c=(d=this._baselineSection._percentageDraft)!=null?d:Ae(this._config).percent)!=null?c:"","baseline-above-color":Q(this._baselineSection._getBaselineDirectionalColorValue(F,"above"),"#000000"),"baseline-above-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(F,"above"),"baseline-below-color":Q(this._baselineSection._getBaselineDirectionalColorValue(F,"below"),"#000000"),"baseline-below-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(F,"below"),"target-mode":this._targetSection._getTargetMode(F),"target-value":Be(this._config).fixed,"target-source-mode":this._targetSection._getSourceMode(),"target-percent":(h=(u=this._targetSection._percentageDraft)!=null?u:Be(this._config).percent)!=null?h:"","target-shape":this._targetSection._getEffectiveTargetShapeValue(F),"target-direction":this._targetSection._getEffectiveMarkerDirection(F,"target"),"target-color":Q(this._targetSection._getTargetColorValue(F),"#888"),"target-color-text-fallback":this._targetSection._getTargetColorValue(F),"target-above-fill-color":Q(this._targetSection._getTargetAboveFillColorValue(F),"#000000"),"target-above-fill-color-text-fallback":this._targetSection._getTargetAboveFillColorValue(F),"target-label-text":this._targetSection._getBuiltinMarkerLabelOptions(F,"target").text,"target-label-precision":this._targetSection._getBuiltinMarkerLabelOptions(F,"target").precision,"formatting-unit":oe(e,F,"unit"),"formatting-decimal":oe(e,F,"decimal")};for(let _ of["peak","floor"]){let g=this._extremaSection._getMarkerConfig(F,_),v=this._extremaSection._getBuiltinMarkerLabelOptions(F,_);Object.assign(r,{[`${_}-color`]:Q(g.color,"#888888"),[`${_}-color-text-fallback`]:g.color,[`${_}-reset`]:this._extremaSection._getEffectiveMarkerExtras(F,_).reset,[`${_}-direction`]:this._extremaSection._getEffectiveMarkerDirection(F,_),[`${_}-label-text`]:v.text,[`${_}-label-precision`]:v.precision});for(let[w,E]of[["show",g.mode==="enabled"],["label-show",v.show],["label-show-value",v.showValue],["label-show-unit",v.showUnit]]){let V=this.shadowRoot.querySelector(`#${_}-${w}`);V&&(V.checked=E)}}for(let[_,g]of Object.entries(r)){let v=this.shadowRoot.querySelector(`[data-field="${_}"]`);v&&(v!==this.shadowRoot.activeElement||this._configReplaced)&&(v.value=String(g)),_==="bar-color-text-fallback"&&(v==null||v.setAttribute("aria-label","Bar color (CSS value)"))}for(let _ of[this._segmentsSection,this._gradientStopsSection]){let g=_===this._segmentsSection,v=g?_._getScopedSegmentsValue(F):_._getScopedGradientStopsValue(F);for(let w of g?["from","to","color","color-text-fallback"]:["pos","color"])for(let E of this.shadowRoot.querySelectorAll(`input[data-kind="${g?"segment":"gradient"}-${w}"]`)){let V=Number(E.dataset.index),T=v[V],z=g&&!w.startsWith("color")?_._getSegmentBoundaryText(F,V,w,T==null?void 0:T[w]):!g&&w==="pos"?_._getGradientStopPosText(F,V,(f=T==null?void 0:T.pos)!=null?f:""):T==null?void 0:T.color;(E!==this.shadowRoot.activeElement||this._configReplaced)&&(E.value=g&&E.type==="color"?Q(z,"#4a9eff"):z!=null?z:"")}if(g||this._configReplaced){let w=g?_._getSegmentDraftState(F):_._getGradientStopsDraftState(F);for(let E of Object.keys(w))for(let V of["","-text-fallback"])for(let T of this.shadowRoot.querySelectorAll(`input[data-kind="${g?"segment":"gradient"}-draft-${E}${V}"]`))(T!==this.shadowRoot.activeElement||this._configReplaced)&&(T.value=E==="color"&&T.type==="color"?Q(w[E],"#4CAF50"):w[E])}g?_._refreshSegmentUi(F):(m=this.shadowRoot.querySelector("#gradient-draft-pos"))!=null&&m.closest&&_._refreshGradientDraftUi(F)}for(let _ of["above","below"]){let g=this.shadowRoot.querySelector(`#baseline-${_}-color-enabled`);g&&(g.checked=this._baselineSection._isBaselineDirectionalColorEnabled(F,_))}this._referenceMarkersSection.syncControls(this._hass,this._configReplaced);let i=this._targetSection._getBuiltinMarkerLabelOptions(F,"target");for(let[_,g]of[["target-label-show",i.show],["target-label-show-value",i.showValue],["target-label-show-unit",i.showUnit],["target-above-fill-enabled",this._targetSection._isTargetAboveFillEnabled(F)]]){let v=this.shadowRoot.querySelector(`#${_}`);v&&(v.checked=g)}let n=this.shadowRoot.querySelector("#bar-solid-fill");n&&(n.checked=pe(e,F));let a=this.shadowRoot.querySelector("#bar-animated");a&&(a.checked=Ut(e,F));let l=this.shadowRoot.querySelector("#feature-entity-override");l&&(l.checked=!!this._explicitEntity||this._chooseEntity);let s=this.shadowRoot.querySelector("#feature-entity-status");s&&(s.textContent=this._entityDescription());for(let[_,g,v,w]of[["feature-entity-source",this._explicitEntity,"Entity override","feature-entity"],["scale-min-entity-source",Re(this._config,"min").entity,"Min entity","feature-scale-min-entity"],["baseline-entity-source",Ae(this._config).entity,"Baseline entity","feature-baseline-entity"],["target-entity-source",Be(this._config).entity,"Target entity","feature-target-entity"],["scale-max-entity-source",Re(this._config,"max").entity,"Max entity","feature-scale-max-entity"]])for(let E of["input","ha-entity-picker"])for(let V of this.shadowRoot.querySelectorAll(`${E}[data-kind="${_}"]`))V.id=w,V.setAttribute("aria-label",v),_==="feature-entity-source"&&(V.setAttribute("aria-describedby","feature-entity-status"),V.setAttribute("aria-required",this._effectiveEntity?"false":"true")),(V!==this.shadowRoot.activeElement||this._configReplaced)&&(V.value=g),E==="ha-entity-picker"&&(V.hass=this._hass,V.label=v,V.allowCustomEntity=!0);this._syncDisclosures(),this._numericDrafts.apply(this.shadowRoot);for(let _ of this.shadowRoot.querySelectorAll('input[data-css-color="true"]')){let g=this._cssColorDrafts.get(_.id);g!==void 0&&(_.value=g),_.setAttribute("aria-invalid",g===void 0?"false":"true"),(x=_.setCustomValidity)==null||x.call(_,g===void 0?"":"Enter a valid CSS color.");let v=($=(S=(k=this.shadowRoot.querySelector(`#${_.id.replace(/-text-fallback$/,"")}`))==null?void 0:k.labels)==null?void 0:S[0])==null?void 0:$.textContent;v&&_.setAttribute("aria-label",`${v} (CSS value)`)}}};var ka="7083e7abbadd6075d211b6b75585a01b4299e37c55af21c7d57ea6e2ee6c5651";export{Wt as SensorBarCardPlusEditor,Qt as SensorBarCardPlusFeatureEditor,ka as buildIdentity};
