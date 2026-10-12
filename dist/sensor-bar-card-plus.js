var ae=(r,e,t)=>()=>{if(t)throw t[0];try{return r&&(e=r(r=0)),e}catch(a){throw t=[a],a}};var mi=(r,e)=>()=>{try{return e||r((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function qr(r,e){xa=[r,e]}function ga(){if(!xa||vi.some((r,e)=>customElements.get(r)!==xa[e]))throw new Error(ya);if(lt&&nt.some((r,e)=>customElements.get(r)!==lt[e]))throw new Error(ya)}async function xi(){if(!Dr)throw new Error("Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.");let r=new URL(fi,import.meta.url);r.searchParams.set("sbcp_build",_i),Br++&&r.searchParams.set("sbcp_retry","1");let e;try{e=await import(r.href)}catch(a){throw new Error(yi)}if(e.buildIdentity!==Dr)throw new Error(Tr);ga();let t=[e.SensorBarCardPlusEditor,e.SensorBarCardPlusFeatureEditor];if(t.some(a=>typeof a!="function"||!(a.prototype instanceof HTMLElement))||t[0]===t[1])throw new Error(Tr);if(nt.some((a,i)=>{let n=customElements.get(a);return n&&(!lt||n!==lt[i]||n!==t[i])}))throw new Error(ya);for(let a=0;a<nt.length;a++)customElements.get(nt[a])||customElements.define(nt[a],t[a]);lt=t}async function $t(r){if(ga(),!Rt){if(Br>=2)throw Lr;Rt=xi().catch(e=>{throw Lr=e,Rt=void 0,e})}return await Rt,ga(),document.createElement(r)}var Dr,fi,_i,nt,vi,Tr,ya,yi,xa,lt,Rt,Br,Lr,Nt=ae(()=>{Dr="4b6a91e362a1da2b05c16f93b5e21db724f1beaa9ad0820a87cf4179c6d1d4f8",fi="./sensor-bar-card-plus-editor.js",_i="93f96e237a2d0c4fb594e30881047183c51cad6c11c81f710e09d9a0c696d35e",nt=["sensor-bar-card-plus-editor","sensor-bar-card-plus-feature-editor"],vi=["sensor-bar-card-plus","sensor-bar-card-plus-feature"],Tr="Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.",ya="Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.",yi="Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.",Br=0});function Pt(r){return`
        ${r} .bar-fill-reveal,
        ${r} .needle-marker,
        ${r} .target-marker,
        ${r} .peak-marker,
        ${r} .floor-marker,
        ${r} .generic-marker,
        ${r} .baseline-indicator {
          transition: none;
        }
`}var Ft,zt,wa=ae(()=>{Ft=`
        .bar-track {
          position: relative;
          width: 100%;
          height: var(--sbcp-row-height);
          border-radius: 6px;
          background: var(--secondary-background-color, #e8e8e8);
          overflow: hidden;
        }
        .bar-fill-reveal {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: clip-path var(--sbcp-reveal-duration, 600ms) cubic-bezier(0.4,0,0.2,1);
          z-index: 1;
        }
        .bar-paint-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .bar-paint-layer[data-layer="above-target"] {
          z-index: 2;
        }
        .bar-fill-reveal.no-anim {
          transition: none;
        }
        .baseline-indicator {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          transform: translateX(-50%);
          background-color: var(--primary-text-color, currentColor);
          opacity: 0.6;
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          z-index: 3;
        }
`,zt=`
        /* \u2500\u2500 Shared marker base \u2500\u2500 */
        .peak-marker, .target-marker, .floor-marker, .generic-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 0;
          transform: translateX(-50%);
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          --marker-color: #888;
          --marker-contrast-color: #f3f4f6;
        }
        .peak-marker .peak-inset,
        .peak-marker .peak-outset,
        .target-marker .target-inset,
        .target-marker .target-outset,
        .floor-marker .floor-inset,
        .floor-marker .floor-outset,
        .generic-marker .peak-inset,
        .generic-marker .peak-outset,
        .generic-marker .target-inset,
        .generic-marker .target-outset {
          pointer-events: auto;
        }
        .peak-marker .peak-inset:hover,
        .peak-marker .peak-outset:hover,
        .target-marker .target-inset:hover,
        .target-marker .target-outset:hover,
        .floor-marker .floor-inset:hover,
        .floor-marker .floor-outset:hover,
        .generic-marker .peak-inset:hover,
        .generic-marker .peak-outset:hover,
        .generic-marker .target-inset:hover,
        .generic-marker .target-outset:hover,
        .marker-shape-svg path[data-shape]:hover {
          cursor: none;
        }
        .target-marker {
          z-index: 6;
        }
        .floor-marker {
          z-index: 6;
        }
        .generic-marker[data-lane="below"] {
          z-index: 6;
        }
        .peak-marker {
          z-index: 7;
        }
        .generic-marker[data-lane="above"] {
          z-index: 7;
        }
        .needle-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          pointer-events: none;
          z-index: 5;
        }
        .needle-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 7px;
          transform: translateX(-50%);
          pointer-events: none;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
          background: linear-gradient(
            to right,
            var(--needle-border-color, #000000) 0 1px,
            var(--needle-color, #ffffff) 1px 6px,
            var(--needle-border-color, #000000) 6px 7px
          );
          border-radius: 0;
          box-shadow:
            0 0 3px var(--needle-color, #ffffff),
            0 0 6px var(--needle-color, #ffffff);
        }
        .needle-layer .needle-marker[data-edge="right"] {
          transform: translateX(-100%);
        }
        .peak-marker .peak-inset,
        .peak-marker .peak-outset,
        .target-marker .target-inset,
        .target-marker .target-outset,
        .floor-marker .floor-inset,
        .floor-marker .floor-outset,
        .generic-marker[data-lane="above"] .peak-inset,
        .generic-marker[data-lane="above"] .peak-outset,
        .generic-marker[data-lane="below"] .target-inset,
        .generic-marker[data-lane="below"] .target-outset {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
        }
        /* Peak marker: large triangle intrudes into the bar, small one sits just above it. */
        .peak-marker .peak-inset,
        .generic-marker[data-lane="above"] .peak-inset {
          top: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 11px solid var(--marker-color);
          z-index: 2;
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .peak-marker[data-direction="outward"] .peak-inset,
        .generic-marker[data-lane="above"][data-direction="outward"] .peak-inset {
          border-top-width: 0;
          border-top-color: transparent;
          border-bottom: 11px solid var(--marker-color);
        }
        .peak-marker .peak-outset,
        .generic-marker[data-lane="above"] .peak-outset {
          top: -4px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 4px solid var(--marker-color);
          z-index: 3;
        }
        /* Target marker: large triangle intrudes into the bar, small one sits just below it. */
        .target-marker .target-inset,
        .generic-marker[data-lane="below"] .target-inset {
          bottom: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 11px solid var(--marker-color);
          z-index: 2;
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .target-marker .target-outset,
        .generic-marker[data-lane="below"] .target-outset {
          bottom: -4px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 4px solid var(--marker-color);
          z-index: 3;
        }
        .floor-marker .floor-inset {
          bottom: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 11px solid var(--marker-color);
          z-index: 2;
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .target-marker[data-direction="outward"] .target-inset,
        .floor-marker[data-direction="outward"] .floor-inset,
        .generic-marker[data-lane="below"][data-direction="outward"] .target-inset {
          border-bottom-width: 0;
          border-bottom-color: transparent;
          border-top: 11px solid var(--marker-color);
        }
        .floor-marker .floor-outset {
          bottom: -4px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 4px solid var(--marker-color);
          z-index: 3;
        }
        /* Shared non-triangle marker shapes. Triangle keeps the original CSS geometry. */
        .marker-shape-svg {
          display: none;
          position: absolute;
          left: 50%;
          width: 16px;
          height: 16px;
          overflow: visible;
          color: var(--marker-color);
          pointer-events: none;
          z-index: 2;
          transform: translateX(-50%);
          filter:
            drop-shadow(0 0 1.2px var(--marker-contrast-color))
            drop-shadow(0 0 3px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent));
        }
        .peak-marker .marker-shape-svg {
          top: 0;
        }
        .target-marker .marker-shape-svg {
          bottom: 0;
        }
        .floor-marker .marker-shape-svg {
          bottom: 0;
        }
        .generic-marker[data-lane="above"] .marker-shape-svg {
          top: 0;
        }
        .generic-marker[data-lane="below"] .marker-shape-svg {
          bottom: 0;
        }
        .marker-shape-svg[data-lane="above"] {
          transform-origin: 50% 0;
        }
        .marker-shape-svg[data-lane="below"] {
          transform-origin: 50% 100%;
        }
        .marker-shape-svg[data-shape="diamond"],
        .marker-shape-svg[data-shape="arrow"],
        .marker-shape-svg[data-shape="chevron"],
        .marker-shape-svg[data-shape="pin"] {
          transform: translateX(-50%) scale(0.75);
        }
        .marker-shape-svg[data-shape="circle"] {
          transform: translateX(-50%) scale(0.64);
        }
        .peak-marker[data-shape]:not([data-shape="triangle"]) .peak-inset,
        .peak-marker[data-shape]:not([data-shape="triangle"]) .peak-outset,
        .target-marker[data-shape]:not([data-shape="triangle"]) .target-inset,
        .target-marker[data-shape]:not([data-shape="triangle"]) .target-outset,
        .floor-marker[data-shape]:not([data-shape="triangle"]) .floor-inset,
        .floor-marker[data-shape]:not([data-shape="triangle"]) .floor-outset,
        .generic-marker[data-shape]:not([data-shape="triangle"]) .peak-inset,
        .generic-marker[data-shape]:not([data-shape="triangle"]) .peak-outset,
        .generic-marker[data-shape]:not([data-shape="triangle"]) .target-inset,
        .generic-marker[data-shape]:not([data-shape="triangle"]) .target-outset {
          display: none;
        }
        .peak-marker[data-shape]:not([data-shape="triangle"]) .marker-shape-svg,
        .target-marker[data-shape]:not([data-shape="triangle"]) .marker-shape-svg {
          display: block;
        }
        .floor-marker[data-shape]:not([data-shape="triangle"]) .marker-shape-svg {
          display: block;
        }
        .generic-marker[data-shape]:not([data-shape="triangle"]) .marker-shape-svg {
          display: block;
        }
        .generic-marker[data-show-marker="false"][data-shape] .peak-inset,
        .generic-marker[data-show-marker="false"][data-shape] .peak-outset,
        .generic-marker[data-show-marker="false"][data-shape] .target-inset,
        .generic-marker[data-show-marker="false"][data-shape] .target-outset,
        .generic-marker[data-show-marker="false"][data-shape] .marker-shape-svg {
          display: none;
        }
        .marker-shape-svg path {
          display: none;
          fill: currentColor;
        }
        .marker-shape-svg path[data-shape] {
          pointer-events: visiblePainted;
        }
        .marker-shape-svg[data-shape="circle"] path[data-shape="circle"],
        .marker-shape-svg[data-shape="diamond"] path[data-shape="diamond"],
        .marker-shape-svg[data-shape="chevron"] path[data-shape="chevron"],
        .marker-shape-svg[data-shape="arrow"] path[data-shape="arrow"],
        .marker-shape-svg[data-shape="pin"] path[data-shape="pin"] {
          display: block;
        }
        .marker-shape-svg[data-shape="chevron"] path[data-shape="chevron"] {
          fill: none;
        }
        .marker-shape-svg[data-shape="chevron"][data-lane="below"][data-direction="inward"] .marker-shape-paths,
        .marker-shape-svg[data-shape="arrow"][data-lane="below"][data-direction="inward"] .marker-shape-paths,
        .marker-shape-svg[data-shape="pin"][data-lane="below"][data-direction="inward"] .marker-shape-paths,
        .marker-shape-svg[data-shape="chevron"][data-lane="above"][data-direction="outward"] .marker-shape-paths,
        .marker-shape-svg[data-shape="arrow"][data-lane="above"][data-direction="outward"] .marker-shape-paths,
        .marker-shape-svg[data-shape="pin"][data-lane="above"][data-direction="outward"] .marker-shape-paths {
          transform-box: view-box;
          transform-origin: 0 0;
          transform: translateY(16px) scaleY(-1);
        }

`});function gi(r,e){if(!(r instanceof Date)||Number.isNaN(r.getTime()))return null;let t=r.getFullYear(),a=r.getMonth(),i=r.getDate(),n=r.getHours();if(e==="quarterly")return new Date(t,a,i,n,Math.floor(r.getMinutes()/15)*15,0,0).getTime();if(e==="hourly")return new Date(t,a,i,n,0,0,0).getTime();if(e==="daily")return new Date(t,a,i,0,0,0,0).getTime();if(e==="weekly"){let l=(r.getDay()+6)%7;return new Date(t,a,i-l,0,0,0,0).getTime()}return e==="monthly"?new Date(t,a,1,0,0,0,0).getTime():e==="yearly"?new Date(t,0,1,0,0,0,0).getTime():null}function Or(r){if(r===void 0&&(r="never"),typeof r!="string")return{kind:"never"};let e=r.trim().toLowerCase();if(e==="never")return{kind:"never"};if(Hr.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let a=Number(t[1]),i=t[2];return!Number.isInteger(a)||a<1||i==="m"&&a>59||i==="h"&&a>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:a}:{kind:"duration",hours:a}}function Ur(r){if(typeof r!="string")return!1;let e=r.trim().toLowerCase();if(e==="never"||Hr.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let a=Number(t[1]);return Number.isInteger(a)&&a>=1&&(t[2]==="m"?a<=59:a<=23)}function jr(r,e){if((r==null?void 0:r.kind)!=="calendar")return null;let t=gi(new Date(e),r.unit);return Number.isFinite(t)?String(t):null}function wi(r){return(r==null?void 0:r.kind)!=="duration"?null:Number.isInteger(r.minutes)?r.minutes*60*1e3:Number.isInteger(r.hours)?r.hours*60*60*1e3:null}function ka(r,e,t){return(e==null?void 0:e.kind)==="duration"?{value:r,startedAtMs:Number.isFinite(t)?t:null,windowKey:null}:(e==null?void 0:e.kind)==="calendar"?{value:r,startedAtMs:null,windowKey:jr(e,t)}:{value:r,startedAtMs:null,windowKey:null}}function It(r,e,t,a,i){if(!Number.isFinite(e))return r!=null?r:null;let n=wi(t);if(!r||n!==null&&Number.isFinite(r.startedAtMs)&&Number.isFinite(i)&&i-r.startedAtMs>=n)return ka(e,t,i);if((t==null?void 0:t.kind)==="calendar"){let s=jr(t,i);if(s!==null&&s!==r.windowKey)return ka(e,t,i)}return(a==="min"?e<r.value:e>r.value)?{...r,value:e}:r}var Hr,Vt=ae(()=>{Hr=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function At(r){return typeof r=="string"&&r!==""?r:null}function Ma(r){return r!=null&&r!==""&&typeof r!="string"}function X(r,e,t=null,a=null){let i={fixed:r!=null?r:null,entity:e!=null?e:null};Number.isFinite(t)&&(i.percent=t);let n=At(a);return n!==null&&(i.attribute=n),Ma(a)&&(i.attribute_invalid=!0),i}function le(r){return typeof r=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(r.trim())}function me(r){if(typeof r!="string")return null;let e=r.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function T(r){if(typeof r=="number")return Number.isFinite(r)?r:null;if(typeof r=="string"){let e=r.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function be(r,e=null,t=null,a={}){var l,s,o,u,d,c;let{allowPercent:i=!1}=a,n=e!=null?e:X(t,null);if(r===void 0)return{...n};if(r===null)return X(null,null);if(typeof r=="object"&&!Array.isArray(r)){let p=(s=(l=r.fixed)!=null?l:r.value)!=null?s:null,h=(o=r.entity)!=null?o:null,b=i?T(r.percent):null;return X(p,h,b,r.attribute)}if(le(r))return X((d=(u=n.fixed)!=null?u:t)!=null?d:null,r,(c=n.percent)!=null?c:null);if(i){let p=me(r);if(Number.isFinite(p))return X(null,null,p)}return X(r,null)}function ki(r){var e;return!!r&&(T((e=r.fixed)!=null?e:r.value)!==null||Number.isFinite(r.percent)||!!r.entity)}function Kr(r,e){var a,i,n,l;let t={above:((a=e==null?void 0:e.peak_marker)==null?void 0:a.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&ki((l=e==null?void 0:e.target_marker)==null?void 0:l.source)?1:0)};return r.map(s=>{let o=s.valid&&t[s.lane]<4;return o&&(t[s.lane]+=1),{...s,accepted:o}})}function Xr(r,e=null){if(!Array.isArray(r))return{markers:[],invalidList:r!==void 0};let t=r.map((a,i)=>{var $;if(!a||typeof a!="object"||Array.isArray(a))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=a.at,l=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),s=typeof n=="string"?n.trim():n,o=be(s,null,null,{allowPercent:!0}),u=n&&typeof n=="object"&&n.entity!==void 0?n.entity:typeof s=="string"&&le(s)?s:null,d=u!=null&&u!==""&&!le(u),c=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&T(n.fixed)===null,p=!!o.entity||T(o.fixed)!==null||Number.isFinite(o.percent),h=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),b=n!=null&&!l&&!d&&!c&&p&&!h,m=a.lane===void 0?"below":a.lane,v=m==="above"||m==="below",f=["circle","diamond","triangle","chevron","arrow","pin"],y=a.shape===void 0||f.includes(a.shape),_=dt(a.direction),x=a.direction!==void 0&&!["inward","outward"].includes(typeof a.direction=="string"?a.direction.trim().toLowerCase():""),g=a.label&&typeof a.label=="object"&&!Array.isArray(a.label)?a.label:{},k=Bt(g),w=g.entity,M=typeof w=="string"?w.trim():"",S=w!=null&&w!==""&&!le(M),R=M&&le(M)?M:null,z=typeof a.show_marker=="boolean"?a.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:v?m:null,shape:y&&($=a.shape)!=null?$:"circle",direction:_,invalidDirection:x,showMarker:z,invalidShowMarker:a.show_marker!==void 0&&typeof a.show_marker!="boolean",color:typeof a.color=="string"&&a.color.trim()?a.color:"#888888",label:{show:g.show===!0,text:k.label_text,entity:R,...At(g.attribute)!==null?{attribute:At(g.attribute)}:{},...Ma(g.attribute)?{attribute_invalid:!0}:{},showValue:k.label_show_value,showUnit:k.label_show_unit,precision:k.label_precision,invalidShow:k.label_invalid_show,invalidText:k.label_invalid_text,invalidShowValue:k.label_invalid_show_value,invalidShowUnit:k.label_invalid_show_unit,invalidPrecision:k.label_invalid_precision,invalidPrecisionKey:k.label_precision_key,unsupportedUnit:k.label_unsupported_unit,invalidEntity:S},valid:b&&v,invalidSource:!b,invalidPercentage:h,unsupportedPercentField:l,invalidLane:!v,invalidShape:!y,accepted:!1}});return{markers:Kr(t,e),invalidList:!1}}function xe(r,e=null){var a;let t=e!=null?e:{color:null};return r===void 0?{...t}:r===null?{color:null}:typeof r=="object"&&!Array.isArray(r)?{color:(a=r.color)!=null?a:null}:{color:r}}function ot(r){return r===!0?!0:r===!1?!1:null}function qt(r,e){var n;let t=e==null?void 0:e.baseline,a=r==null?void 0:r.baseline,i={enabled:ot(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:X(null,null),above:xe(void 0,t==null?void 0:t.above),below:xe(void 0,t==null?void 0:t.below)};return a===void 0?i:a===null?{enabled:null,at:X(null,null),above:{color:null},below:{color:null}}:typeof a!="object"||Array.isArray(a)?{enabled:i.enabled,at:be(a,i.at,null),above:i.above,below:i.below}:{enabled:(n=ot(a.enabled))!=null?n:i.enabled,at:be(a.at,i.at,null,{allowPercent:!0}),above:xe(a.above,i.above),below:xe(a.below,i.below)}}function Si(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function Dt(r){if(!Array.isArray(r))return null;let e=r.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var a;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(a=t.label)!=null?a:null}});return Si(e,100)}function Er(r,e=null){var a;if(r===void 0)return{value:null,issue:null};if(r===null)return{value:null,issue:"malformed"};if(r&&typeof r=="object"&&!Array.isArray(r)){if(r.entity!==void 0&&r.entity!==null&&r.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(r,"percent")){let n=T(r.percent);return Number.isFinite(n)?{value:X(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=T((a=r.fixed)!=null?a:r.value);return Number.isFinite(i)?{value:X(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof r=="string"){let i=r.trim();if(le(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=me(i);return Number.isFinite(n)?{value:X(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=T(r);return Number.isFinite(t)?e==="percent"?{value:X(null,null,t),issue:null}:{value:X(t,null),issue:null}:{value:null,issue:"malformed"}}function st(r,e={}){if(!Array.isArray(r))return null;let{legacySegmentSpace:t=null}=e,a=r.map(i=>{var s,o;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:Er(i.from,t),l=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:Er(i.to,t);return i!=null&&i.color?{from:n.value,to:l.value,invalidBoundary:(s=n.issue)!=null?s:l.issue,color:i.color,label:(o=i.label)!=null?o:null}:null}).filter(Boolean);return a.map((i,n)=>{var s;let l=a.slice(n+1).find(o=>!o.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:l!=null&&l.from?{...l.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(s=i.label)!=null?s:null}})}function Tt(r,e,t,a){var m,v,f,y,_,x,g,k,w,M,S;let i=e==null?void 0:e.scale,n=r==null?void 0:r.scale,l=`${t}_entity`,s=i==null?void 0:i[t],o=s?X((v=(m=s.fixed)!=null?m:s.value)!=null?v:null,(f=s.entity)!=null?f:null,null,s.attribute):X((y=e==null?void 0:e[t])!=null?y:a,(_=e==null?void 0:e[l])!=null?_:null),u=s?s.fixed_explicit!==!1&&s.fixed!==null&&s.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,d=(R,z)=>(Object.defineProperty(R,"fixed_explicit",{value:z}),R);if((n==null?void 0:n[t])!==void 0){let R=n[t],z=le(R)?u:typeof R=="object"&&R!==null?((x=R.fixed)!=null?x:R.value)!==null&&((g=R.fixed)!=null?g:R.value)!==void 0:R!==null;return d(be(n[t],o,a),z)}let c=r[l],p=c!=null,h=(w=(k=r[t])!=null?k:p?null:o.fixed)!=null?w:o.entity?null:a,b=(M=c!=null?c:o.entity)!=null?M:null;return d(X(h,b,(S=o.percent)!=null?S:null,o.attribute),r[t]!==null&&r[t]!==void 0||!p&&u)}function Ht(r,e){return{min:Tt(r,e,"min",0),max:Tt(r,e,"max",100)}}function Ra(r){switch(r){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function ct(r){switch(r){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function Lt(r,e){return r!=null&&Object.prototype.hasOwnProperty.call(r,e)}function Mi(r){return[Lt(r,"color")?r.color:void 0,Lt(r==null?void 0:r.bar,"color")?r.bar.color:void 0].some(t=>t!=null)}function ut(r){let e=r==null?void 0:r.bar,t=[[r,"color_mode"],[e,"color_mode"],[e,"fill_style"],[r,"severity"],[r,"segments"],[e,"segments"],[r,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Mi(r),paint:t.some(([a,i])=>Lt(a,i))}}function ge(r=null,e=null){var n,l,s,o,u,d;let t=(n=r==null?void 0:r.fill_style)!=null?n:null,a=(s=(l=r==null?void 0:r.color_mode)!=null?l:e)!=null?s:null,i=(u=(o=Ra(t))!=null?o:a)!=null?u:"severity";return{fill_style:(d=t!=null?t:ct(i))!=null?d:"bands",color_mode:i}}function Na(r,e,t,a,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:l=!1}={}){let s=(i==null?void 0:i.color)===!0&&i.paint!==!0,o=(n==null?void 0:n.paint)===!0;return s&&(l||!o)?ge({fill_style:"solid"},null):(r==null?void 0:r.fill_style)!==void 0||(r==null?void 0:r.color_mode)!==void 0||e.color_mode!==void 0?ge(r,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(a==null?void 0:a.color_mode)!==void 0?ge(t,a==null?void 0:a.color_mode):ge(null,null)}function Fa(r){return Array.isArray(r)?r.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=me(e.pos),a=Number.isFinite(t)?t:T(e.pos);return{...e,pos:Number.isFinite(a)?a:e.pos}}):r!=null?r:null}function za(r,e=null){var a,i,n,l;let t=e?{show:(a=e.show)!=null?a:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return r===void 0?{...t}:typeof r=="boolean"?{show:r,color:"#ffffff"}:r&&typeof r=="object"&&!Array.isArray(r)?{show:(n=r.show)!=null?n:t.show,color:(l=r.color)!=null?l:t.color}:{...t}}function Ot(r,e,t={}){var k,w,M,S,R,z,$,I,B,W,D,N,V,L,E,Y,Z,H,q,P,O,A,U,G,j,te,Q;let a=(k=t.scopeExplicitness)!=null?k:ut(r),i=(M=(w=t.inheritedExplicitness)!=null?w:e==null?void 0:e[$a])!=null?M:ut(e),n=(S=t.isCardScope)!=null?S:e==null,l=e==null?void 0:e.bar,s=r==null?void 0:r.bar,o=Lt(l,Sa)?l[Sa]:["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:null,u=["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:o,d=s==null?void 0:s.segments,c=r.segments,p=r.severity,h=(R=l==null?void 0:l.segments)!=null?R:null,b=(z=e==null?void 0:e.segments)!=null?z:null,m=($=e==null?void 0:e.severity)!=null?$:null,v=null,f=(l==null?void 0:l.segment_space)==="percent"||(l==null?void 0:l.segment_space)==="scale"?l.segment_space:null;d!=null?(f=u,v=st(d,{legacySegmentSpace:f})):c!=null?v=st(c):p!=null?(v=Dt(p),f="percent"):h!=null?v=h.map(re=>({...re})):b!=null?v=st(b):m!=null&&(v=Dt(m),f="percent");let y=r!=null&&r.target&&typeof r.target=="object"&&!Array.isArray(r.target)?(I=r.target.when_exceeded)==null?void 0:I.fill_color:void 0,_=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(B=e.target.when_exceeded)==null?void 0:B.fill_color:void 0,x=Na(s,r,l,e,{scopeExplicitness:a,inheritedExplicitness:i,isCardScope:n}),g={fill_style:x.fill_style,color_mode:x.color_mode,needle:za(s==null?void 0:s.needle,l==null?void 0:l.needle),solid_fill:(D=(W=s==null?void 0:s.solid_fill)!=null?W:l==null?void 0:l.solid_fill)!=null?D:!1,color:(E=(L=(V=(N=s==null?void 0:s.color)!=null?N:r.color)!=null?V:l==null?void 0:l.color)!=null?L:e==null?void 0:e.color)!=null?E:"#4a9eff",gradient_stops:Fa((q=(H=(Z=(Y=s==null?void 0:s.gradient_stops)!=null?Y:r.gradient_stops)!=null?Z:l==null?void 0:l.gradient_stops)!=null?H:e==null?void 0:e.gradient_stops)!=null?q:null),severity:v,segments:v,segment_space:f,animated:(U=(A=(O=(P=s==null?void 0:s.animated)!=null?P:r.animated)!=null?O:l==null?void 0:l.animated)!=null?A:e==null?void 0:e.animated)!=null?U:!0,above_target_color:(Q=(te=(j=(G=y!=null?y:r.above_target_color)!=null?G:l==null?void 0:l.above_target_color)!=null?j:_)!=null?te:e==null?void 0:e.above_target_color)!=null?Q:null};return Object.defineProperty(g,Sa,{value:u}),g}function Pa(r){return Math.max(24,r)}function Ri(r,e="left"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function $i(r,e="medium"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Ni(r){return Number.isFinite(r)?Math.min(112,Math.max(12,r)):null}function Ut(r,e){var h,b,m,v,f,y,_,x,g,k,w,M,S,R,z,$,I,B,W,D,N,V,L,E,Y;let t=e==null?void 0:e.layout,a=r==null?void 0:r.layout,i=a==null?void 0:a.label,n=a==null?void 0:a.hero,l=t==null?void 0:t.label,s=t==null?void 0:t.hero,o=!e,u=(v=(m=(b=(h=a==null?void 0:a.height)!=null?h:r.height)!=null?b:t==null?void 0:t.height)!=null?m:e==null?void 0:e.height)!=null?v:38,d=(a==null?void 0:a.height)!==void 0||r._height_explicit===!0||!o&&r.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,c=Ri((x=(_=(y=(f=i==null?void 0:i.position)!=null?f:r.label_position)!=null?y:l==null?void 0:l.position)!=null?_:t==null?void 0:t.label_position)!=null?x:e==null?void 0:e.label_position,"left"),p=c==="hero"?Ni((g=n==null?void 0:n.value_size)!=null?g:s==null?void 0:s.value_size):null;return{label:{position:c,width:(R=(S=(M=(w=(k=i==null?void 0:i.width)!=null?k:r.label_width)!=null?w:l==null?void 0:l.width)!=null?M:t==null?void 0:t.label_width)!=null?S:e==null?void 0:e.label_width)!=null?R:100},hero:{size:$i((Y=(E=(L=(V=(N=(D=(W=(B=(I=($=(z=n==null?void 0:n.size)!=null?z:i==null?void 0:i.hero_size)!=null?$:i==null?void 0:i.heroSize)!=null?I:r.hero_size)!=null?B:r.heroSize)!=null?W:s==null?void 0:s.size)!=null?D:l==null?void 0:l.hero_size)!=null?N:l==null?void 0:l.heroSize)!=null?V:t==null?void 0:t.hero_size)!=null?L:t==null?void 0:t.heroSize)!=null?E:e==null?void 0:e.hero_size)!=null?Y:e==null?void 0:e.heroSize,"medium"),value_size:p},height:Pa(u),height_explicit:d}}function jt(r,e){var i,n,l,s,o,u,d,c;let t=e==null?void 0:e.formatting,a=r==null?void 0:r.formatting;return{decimal:(s=(l=(n=(i=a==null?void 0:a.decimal)!=null?i:r.decimal)!=null?n:t==null?void 0:t.decimal)!=null?l:e==null?void 0:e.decimal)!=null?s:null,unit:(c=(d=(u=(o=a==null?void 0:a.unit)!=null?o:r.unit)!=null?u:t==null?void 0:t.unit)!=null?d:e==null?void 0:e.unit)!=null?c:null}}function Gr(r){let e=String(r!=null?r:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function dt(r){return(typeof r=="string"?r.trim().toLowerCase():"")==="outward"?"outward":"inward"}function Bt(r,e={}){var c,p,h;let t=r&&typeof r=="object"&&!Array.isArray(r)?r:{},a=Object.prototype.hasOwnProperty.call(t,"text"),i=a&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),l=Object.prototype.hasOwnProperty.call(t,"decimal"),s=n?t.precision:t.decimal,o=n||l,u=o?T(s):(c=e.label_precision)!=null?c:null,d=o&&s!==null&&s!==""&&!(Number.isInteger(u)&&u>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(p=e.label_show_value)!=null?p:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(h=e.label_show_unit)!=null?h:!0,label_precision:d?null:u,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:a&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:d,label_precision_key:d?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function Wt(r){let e={};return r.label_text!==null&&r.label_text!==void 0&&(e.label_text=r.label_text),r.label_show_value===!1&&(e.label_show_value=!1),r.label_show_unit===!1&&(e.label_show_unit=!1),r.label_precision!==null&&r.label_precision!==void 0&&(e.label_precision=r.label_precision),r.label_invalid_text&&(e.label_invalid_text=!0),r.label_invalid_show_value&&(e.label_invalid_show_value=!0),r.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),r.label_invalid_show&&(e.label_invalid_show=!0),r.label_invalid_precision&&(e.label_invalid_precision=!0),r.label_invalid_precision&&r.label_precision_key&&(e.label_precision_key=r.label_precision_key),r.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function Jr(r){return r!==void 0&&!["inward","outward"].includes(typeof r=="string"?r.trim().toLowerCase():"")}function Et(r,e){var p,h,b,m,v,f,y,_,x,g,k,w,M,S,R,z,$,I,B,W,D,N,V,L,E,Y,Z,H,q,P,O,A,U,G,j,te,Q;let t=e==null?void 0:e.target_marker,a=r==null?void 0:r.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(p=e==null?void 0:e.target)!=null?p:null,n=t?{...t,shape:Gr(t.shape),direction:dt(t.direction)}:{enabled:null,source:X(null,null),color:(h=e==null?void 0:e.target_color)!=null?h:"#888",show_label:(b=e==null?void 0:e.show_target_label)!=null?b:!1,...Wt(Bt((m=e==null?void 0:e.target)==null?void 0:m.label)),label_decimal:(g=(x=(f=(v=e==null?void 0:e.target)==null?void 0:v.label)==null?void 0:f.precision)!=null?x:(_=(y=e==null?void 0:e.target)==null?void 0:y.label)==null?void 0:_.decimal)!=null?g:null,shape:"diamond",direction:"inward"};if(a&&typeof a=="object"&&!Array.isArray(a)){let re=Bt(a.label,n),ie={enabled:(w=(k=ot(a.enabled))!=null?k:n.enabled)!=null?w:null,source:be(a.at,n.source,null,{allowPercent:!0}),color:(S=(M=a.color)!=null?M:r.target_color)!=null?S:n.color,show_label:($=(z=(R=a.label)==null?void 0:R.show)!=null?z:r.show_target_label)!=null?$:n.show_label,shape:Object.prototype.hasOwnProperty.call(a,"shape")?Gr(a.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(a,"direction")?dt(a.direction):n.direction,...Jr(a.direction)?{direction_invalid:!0}:{},...Wt(re)},ne=re.label_precision;return ne!=null&&(ie.label_decimal=ne,ie.label_precision=ne),ie}let l=(N=(D=(B=r.target)!=null?B:(I=n.source)==null?void 0:I.fixed)!=null?D:(W=n.source)==null?void 0:W.value)!=null?N:i,s=(Y=(E=(L=r.target_entity)!=null?L:(V=n.source)==null?void 0:V.entity)!=null?E:e==null?void 0:e.target_entity)!=null?Y:null,o=r.target===void 0&&r.target_entity===void 0&&(H=(Z=n.source)==null?void 0:Z.percent)!=null?H:null,u=r.target===void 0&&r.target_entity===void 0&&(P=(q=n.source)==null?void 0:q.attribute)!=null?P:null,d={enabled:(O=n.enabled)!=null?O:null,source:X(l,s,o,u),color:(G=(U=(A=r.target_color)!=null?A:n.color)!=null?U:e==null?void 0:e.target_color)!=null?G:"#888",show_label:(Q=(te=(j=r.show_target_label)!=null?j:n.show_label)!=null?te:e==null?void 0:e.show_target_label)!=null?Q:!1,shape:n.shape,direction:n.direction,...Wt(n)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Fi(r,e){let t=r==null?void 0:r[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let a=r==null?void 0:r[`${e}_marker`];return a&&typeof a=="object"&&!Array.isArray(a)?a:null}function zi(r,e){var n,l,s;let t=r==null?void 0:r.label,a=t&&typeof t=="object"&&!Array.isArray(t),i=Bt(t,e);return{show:a&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(s=(l=i.label_precision)!=null?l:e.label_decimal)!=null?s:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function Yr(r,e,t,a={}){var f,y,_,x,g,k,w,M,S;let{legacy:i=!1,defaultColor:n="#888888"}=a,l=e==null?void 0:e[`${t}_marker`],s=Fi(r,t),o=l!=null?l:{show:i&&(f=e==null?void 0:e.show_peak)!=null?f:!1,color:i&&(y=e==null?void 0:e.peak_color)!=null?y:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},u=s&&Object.prototype.hasOwnProperty.call(s,"reset"),d=u?s.reset:void 0,c=u?Or(d):(_=o.reset)!=null?_:{kind:"never"},p=s==null?void 0:s.label,h=zi(s,o),b={show:(k=(g=(x=s==null?void 0:s.enabled)!=null?x:i?r.show_peak:void 0)!=null?g:o.show)!=null?k:!1,color:(S=(M=(w=s==null?void 0:s.color)!=null?w:i?r.peak_color:void 0)!=null?M:o.color)!=null?S:n,direction:s&&Object.prototype.hasOwnProperty.call(s,"direction")?dt(s.direction):dt(o.direction),...Jr(s==null?void 0:s.direction)?{direction_invalid:!0}:{}},m=l&&(Object.prototype.hasOwnProperty.call(l,"show_label")||Object.prototype.hasOwnProperty.call(l,"label_decimal")||Object.prototype.hasOwnProperty.call(l,"label_text")||Object.prototype.hasOwnProperty.call(l,"label_show_value")||Object.prototype.hasOwnProperty.call(l,"label_show_unit")||Object.prototype.hasOwnProperty.call(l,"label_precision")||Object.prototype.hasOwnProperty.call(l,"reset"));return(t==="floor"||u||p!==void 0||m)&&(b.show_label=h.show,b.label_decimal=h.precision,b.reset=c),Object.assign(b,Wt({label_text:h.text,label_show_value:h.showValue===!0?void 0:h.showValue,label_show_unit:h.showUnit===!0?void 0:h.showUnit,label_precision:h.precision,label_invalid_text:h.invalidText,label_invalid_show:h.invalidShow,label_invalid_show_value:h.invalidShowValue,label_invalid_show_unit:h.invalidShowUnit,label_invalid_precision:h.invalidPrecision,label_precision_key:h.precisionKey,label_unsupported_unit:h.unsupportedUnit})),u&&!Ur(d)&&(b.reset_invalid=!0),b}function Gt(r,e){return Yr(r,e,"peak",{legacy:!0,defaultColor:"#888888"})}function Zr(r,e){return Yr(r,e,"floor",{defaultColor:"#888888"})}function Ia(r,e){var i,n,l;let t={...r,_normalized:!0,entity:r.entity,name:(i=r.name)!=null?i:null,icon:r.icon};if(r.attribute!==void 0){let s=At(r.attribute);s!==null?t.attribute=s:delete t.attribute,Ma(r.attribute)?t.attribute_invalid=!0:delete t.attribute_invalid}t.layout=Ut(r,e),t.scale=Ht(r,e),t.bar=Ot(r,e,{scopeExplicitness:ut(r),inheritedExplicitness:(n=e==null?void 0:e[$a])!=null?n:ut(e),isCardScope:!1}),t.baseline=qt(r,e),t.formatting=jt(r,e),t.target_marker=Et(r,e),t.peak_marker=Gt(r,e),t.floor_marker=Zr(r,e);let a=r.markers===void 0?{markers:Kr((l=e==null?void 0:e.generic_markers)!=null?l:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:Xr(r.markers,t);return t.generic_markers=a.markers,t.generic_markers_invalid=a.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Kt(r){var n;let e=ut(r),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...r};t._height_explicit=((n=r==null?void 0:r.layout)==null?void 0:n.height)!==void 0||(r==null?void 0:r.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.attribute!==void 0?{attribute:t.attribute}:{},...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(l=>typeof l=="string"?{entity:l}:l);let a={...t,_normalized:!0};Object.defineProperty(a,$a,{value:e,enumerable:!1}),a.layout=Ut(t,null),a.scale=Ht(r,null),a.bar=Ot(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),a.baseline=qt(t,null),a.formatting=jt(t,null),a.target_marker=Et(t,null),a.peak_marker=Gt(t,null),a.floor_marker=Zr(t,null);let i=Xr(t.markers,a);return a.generic_markers=i.markers,a.generic_markers_invalid=i.invalidList,a.entities=t.entities.map(l=>Ia(l,a)),a}var $a,Sa,fe=ae(()=>{Vt();$a=Symbol("sbcp.paintExplicitness"),Sa=Symbol("sbcp.explicitSegmentSpace")});function ht(r,e=null){var n;if(!r)return{stateObj:null,value:void 0,found:!1,available:!1,attributeFound:!1};let t=!["unknown","unavailable"].includes(String((n=r.state)!=null?n:"").trim().toLowerCase());if(typeof e!="string"||e==="")return{stateObj:r,value:r.state,found:!0,available:t,attributeFound:!0};let a=r.attributes,i=a!=null&&Object.prototype.hasOwnProperty.call(a,e);return{stateObj:r,value:i?a[e]:void 0,found:!0,available:t,attributeFound:i}}function pt(r,e,t=null){var i,n;let a=e&&(n=(i=r==null?void 0:r.states)==null?void 0:i[e])!=null?n:null;return ht(a,t)}function we(r,e,t=null){let a=pt(r,e,t);if(!a.found||!a.available||!a.attributeFound)return null;let i=a.value,n=parseFloat(i);return Number.isFinite(n)?n:null}function ke(r,e,t=null){let a=we(r,t);if(a!==null)return a;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function Va(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return a+r/100*(i-a)}function de(r,e,t=null,a=null){var l;if(!e)return null;let i=we(r,e.entity,e.attribute);if(i!==null)return i;let n=ke(r,(l=e.fixed)!=null?l:e.value,null);return n!==null?n:Number.isFinite(e.percent)?Va(e.percent,t,a):null}function Qr(r,e,t=null){var s,o,u,d,c,p,h,b,m,v,f,y;let a=_=>Number.isFinite(_==null?void 0:_.min)&&Number.isFinite(_==null?void 0:_.max)&&_.min<_.max,i={min:ke(null,(u=(s=e==null?void 0:e.min)==null?void 0:s.fixed)!=null?u:(o=e==null?void 0:e.min)==null?void 0:o.value),max:ke(null,(p=(d=e==null?void 0:e.max)==null?void 0:d.fixed)!=null?p:(c=e==null?void 0:e.max)==null?void 0:c.value)};if((h=e==null?void 0:e.min)!=null&&h.entity&&((b=e==null?void 0:e.max)!=null&&b.entity)){let _={min:we(r,e.min.entity,e.min.attribute),max:we(r,e.max.entity,e.max.attribute)};return a(_)?_:Number.isFinite(_.min)&&Number.isFinite(_.max)&&a(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&a(i)?i:{min:0,max:100}}let n={min:(m=de(r,e==null?void 0:e.min))!=null?m:0,max:(v=de(r,e==null?void 0:e.max))!=null?v:100};if(a(n))return n;let l={min:(f=i.min)!=null?f:0,max:(y=i.max)!=null?y:100};return a(l)?l:{min:0,max:100}}var Xt=ae(()=>{fe()});function Pi(r,e,t,a=null){return{code:r,message:e,path:t,entity:a}}function Jt(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:T((e=r.fixed)!=null?e:r.value)}function F(r,e,t,a,i=null){r.warnings.push(Pi(e,t,a,i))}function _e(r,e,t,a=null){e!=null&&e.attribute_invalid&&F(r,"source.invalid_attribute","Attribute must be a non-empty string; using the entity state.",t,a)}function Ii(r,e,t,a=null){var l,s;if((l=e==null?void 0:e.min)!=null&&l.entity&&((s=e==null?void 0:e.max)!=null&&s.entity)){let o=u=>{var d,c;return u.fixed_explicit!==!1&&((d=u.fixed)!=null?d:u.value)!==null&&((c=u.fixed)!=null?c:u.value)!==void 0};o(e.min)!==o(e.max)&&F(r,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,a)}let i=Jt(e==null?void 0:e.min),n=Jt(e==null?void 0:e.max);return Number.isFinite(i)&&Number.isFinite(n)&&i>n&&F(r,"scale.min_gt_max","Scale minimum is greater than maximum.",t,a),{min:i,max:n}}function Vi(r,e,t,a,i=null){var o;let n=Jt((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&F(r,"target.outside_scale","Fixed target value is outside the fixed scale range.",a,i)}function Wi(r,e,t,a,i=null){var o;let n=Jt((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&F(r,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",a,i)}function Ai(r){var e;return!!r&&(Number.isFinite(T((e=r.fixed)!=null?e:r.value))||Number.isFinite(r.percent)||!!r.entity)}function Di(r,e,t,a=null){var l,s,o,u;let i=((s=(l=e==null?void 0:e.bar)==null?void 0:l.needle)==null?void 0:s.show)===!0,n=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&Ai((u=e==null?void 0:e.baseline)==null?void 0:u.at);i&&n&&F(r,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,a)}function Ti(r,e,t,a=null){var i;for(let n of["peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.reset_invalid&&F(r,`${n}.invalid_reset`,"Invalid marker reset; using never.",`${t}.${n}.reset`,a)}function Li(r,e,t,a=null){var i;for(let n of["target_marker","peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.direction_invalid&&F(r,`${n}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${n==="target_marker"?"target":n.replace("_marker","")}.direction`,a)}function Bi(r,e,t,a=null){var i;for(let[n,l]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let s=e==null?void 0:e[n],o=`${t}.${l}.label`;s!=null&&s.label_invalid_show&&F(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,a),s!=null&&s.label_invalid_text&&F(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,a),s!=null&&s.label_invalid_show_value&&F(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,a),s!=null&&s.label_invalid_show_unit&&F(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,a),s!=null&&s.label_invalid_precision&&F(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(i=s.label_precision_key)!=null?i:"precision"}`,a),s!=null&&s.label_unsupported_unit&&F(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,a)}}function Wa(r,e,t,a,i=null){var n,l,s,o,u,d,c,p;t&&F(r,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",a,i);for(let h of e!=null?e:[]){let b=`${a}[${h.index}]`;if(h.malformed){F(r,"markers.invalid_item","Marker must be an object; ignoring this item.",b,i);continue}_e(r,h.source,`${b}.at`,i),h.invalidSource&&!h.invalidPercentage&&!h.unsupportedPercentField&&F(r,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${b}.at`,i),h.invalidPercentage&&F(r,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${b}.at`,i),h.unsupportedPercentField&&F(r,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${b}.at`,i),h.invalidLane&&F(r,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${b}.lane`,i),h.invalidShape&&F(r,"markers.invalid_shape","Invalid marker shape; using circle.",`${b}.shape`,i),h.invalidDirection&&F(r,"markers.invalid_direction","Invalid marker direction; using inward.",`${b}.direction`,i),h.invalidShowMarker&&F(r,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${b}.show_marker`,i),(n=h.label)!=null&&n.invalidEntity&&F(r,"markers.invalid_label_entity","Marker label entity must be a valid entity ID; ignoring it.",`${b}.label.entity`,i),_e(r,h.label,`${b}.label.attribute`,i),(l=h.label)!=null&&l.invalidShow&&F(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${b}.label.show`,i),(s=h.label)!=null&&s.invalidText&&F(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${b}.label.text`,i),(o=h.label)!=null&&o.invalidShowValue&&F(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${b}.label.show_value`,i),(u=h.label)!=null&&u.invalidShowUnit&&F(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${b}.label.show_unit`,i),(d=h.label)!=null&&d.invalidPrecision&&F(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${b}.label.${(c=h.label.invalidPrecisionKey)!=null?c:"precision"}`,i),(p=h.label)!=null&&p.unsupportedUnit&&F(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${b}.label.unit`,i),h.valid&&!h.accepted&&F(r,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",b,i)}}function Cr(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:T((e=r.fixed)!=null?e:r.value)}function qi(r,e,t,a,i=null){if(!Array.isArray(e)||!e.length)return;let n=[],{min:l,max:s}=t;for(let u=0;u<e.length;u+=1){let d=e[u],c=Cr(d==null?void 0:d.from),p=Cr(d==null?void 0:d.to),h=`${a}.segments[${u}]`;if((d==null?void 0:d.invalidBoundary)==="entity"){F(r,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",h,i);continue}if((d==null?void 0:d.invalidBoundary)==="malformed_percent"){F(r,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",h,i);continue}if(d!=null&&d.invalidBoundary){F(r,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',h,i);continue}Number.isFinite(c)&&Number.isFinite(p)&&c>p&&F(r,"segments.from_gt_to","Segment start is greater than segment end.",h,i),Number.isFinite(l)&&Number.isFinite(s)&&(Number.isFinite(c)&&(c<l||c>s)&&F(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i),Number.isFinite(p)&&(p<l||p>s)&&F(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i)),Number.isFinite(c)&&Number.isFinite(p)&&n.push({from:c,to:p,path:h})}let o=[...n].sort((u,d)=>u.from-d.from);for(let u=1;u<o.length;u+=1){let d=o[u-1],c=o[u];c.from<d.to&&F(r,"segments.overlap","Fixed segments overlap.",c.path,i)}}function Hi(r,e,t,a=null){var n;if(!Array.isArray(e))return;let i=new Set;for(let l=0;l<e.length;l+=1){let s=T((n=e[l])==null?void 0:n.pos),o=`${t}.gradient_stops[${l}]`;Number.isFinite(s)&&(s<0||s>100)&&F(r,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,a),Number.isFinite(s)&&(i.has(s)?F(r,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,a):i.add(s))}}function ei(r,e,t,a=null){var n,l,s,o,u,d;_e(r,e,`${t}.attribute`,a),_e(r,(n=e==null?void 0:e.scale)==null?void 0:n.min,`${t}.scale.min.attribute`,a),_e(r,(l=e==null?void 0:e.scale)==null?void 0:l.max,`${t}.scale.max.attribute`,a),_e(r,(s=e==null?void 0:e.baseline)==null?void 0:s.at,`${t}.baseline.at.attribute`,a),_e(r,(o=e==null?void 0:e.target_marker)==null?void 0:o.source,`${t}.target.at.attribute`,a);let i=Ii(r,e==null?void 0:e.scale,t,a);Vi(r,e,i,t,a),Wi(r,e,i,t,a),Di(r,e,t,a),Ti(r,e,t,a),Li(r,e,t,a),Bi(r,e,t,a),qi(r,(u=e==null?void 0:e.bar)==null?void 0:u.segments,i,`${t}.bar`,a),Hi(r,(d=e==null?void 0:e.bar)==null?void 0:d.gradient_stops,`${t}.bar`,a)}function Yt(r){var i,n;let e={warnings:[],errors:[]};if(!r||typeof r!="object")return e;ei(e,r,"card"),Wa(e,r.generic_markers,r.generic_markers_invalid,"markers");let t=new Set,a=Array.isArray(r.entities)?r.entities:[];for(let l=0;l<a.length;l+=1){let s=a[l],o=(i=s==null?void 0:s.entity)!=null?i:null,u=`entities[${l}]`;if(!o){F(e,"entities.missing_entity","Entity row is missing an entity id.",u,null);continue}if(t.has(o)?F(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",u,o):t.add(o),ei(e,s,u,o),Object.prototype.hasOwnProperty.call(s,"markers"))Wa(e,s.generic_markers,s.generic_markers_invalid,`${u}.markers`,o);else{let d=((n=s.generic_markers)!=null?n:[]).filter(c=>{var p,h;return c.valid&&!c.accepted&&((h=(p=r.generic_markers)==null?void 0:p[c.index])==null?void 0:h.accepted)===!0});d.length&&Wa(e,d,!1,`${u}.markers`,o)}}return e}var Aa=ae(()=>{fe()});function ce(r,e=null){return Number.isFinite(r)?e!==null?r.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):r.toLocaleString():String(r)}function Da(r){return["h","m","s"].includes(String(r||"").trim())}function Ta(r,e){if(!e)return String(r);let t=String(e);return`${r}${Da(t)?"":" "}${t}`}function bt(r,e,t=null){let a=ce(r,t),i=e?String(e):"";return{value:r,number:a,unit:i,text:Ta(a,i)}}function mt(r,e,t=null,a={}){let i=typeof a.text=="string"?a.text:"",n=a.showValue===!1||r===null||r===void 0||r===""?"":Number.isFinite(r)?ce(r,t):String(r),l=a.showUnit===!1?"":String(e!=null?e:"").trim(),s=[i,n,l].filter(Boolean).join(" ");return{value:Number.isFinite(r)?r:null,semanticText:i,number:n,unit:l,showValue:a.showValue!==!1,showUnit:a.showUnit!==!1,text:s}}function ti(r){let e=String(r);return{value:null,number:e,unit:"",text:e}}var Zt=ae(()=>{});function ai(r){return r?r.entity!==null&&r.entity!==void 0&&r.entity!==""||r.fixed!==null&&r.fixed!==void 0&&r.fixed!==""||Number.isFinite(r.percent):!1}function Ct(r,e="circle"){return Oi.has(r)?r:e}function Qt({id:r,type:e,value:t=null,position:a=null,lane:i,visible:n=!1,color:l=null,label:s=null,labelVisible:o=!1,shape:u="circle",direction:d="inward",showMarker:c=!0}){return{id:r,type:e,value:t,position:a,lane:i,visible:n===!0,color:l,label:s,labelVisible:o===!0,shape:Ct(u),direction:d,showMarker:c!==!1}}function ue(r){return!!(typeof(r==null?void 0:r.text)=="string"&&r.text.trim())||(r==null?void 0:r.showValue)!==!1||(r==null?void 0:r.showUnit)!==!1}function ea(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&ai(e==null?void 0:e.source)||(a==null?void 0:a.show)===!0||i.some(l=>l.lane==="below"),above:(t==null?void 0:t.show)===!0||i.some(l=>l.lane==="above")}}function ta(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&ai(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&ue({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(a==null?void 0:a.show)===!0&&(a==null?void 0:a.show_label)===!0&&ue({text:a.label_text,showValue:a.label_show_value,showUnit:a.label_show_unit})||i.some(l=>{var s;return l.lane==="below"&&((s=l.label)==null?void 0:s.show)===!0&&ue(l.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&ue({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||i.some(l=>{var s;return l.lane==="above"&&((s=l.label)==null?void 0:s.show)===!0&&ue(l.label)})}}function aa({entityConfig:r,targetValue:e=null,targetPosition:t=null,targetPresentation:a=null,targetLabelPresentation:i=null,targetVisible:n=Number.isFinite(t),peakValue:l=null,peakPosition:s=null,peakPresentation:o=null,peakLabelPresentation:u=null,peakVisible:d=Number.isFinite(s),floorValue:c=null,floorPosition:p=null,floorPresentation:h=null,floorLabelPresentation:b=null,floorVisible:m=Number.isFinite(p),genericMarkers:v=[]}){var g,k,w,M,S,R,z;let f=r==null?void 0:r.target_marker,y=r==null?void 0:r.peak_marker,_=r==null?void 0:r.floor_marker,x=(f==null?void 0:f.enabled)!==!1;return[Qt({id:"target",type:"target",value:e,position:t,lane:"below",visible:x&&n,color:(g=f==null?void 0:f.color)!=null?g:null,label:i!=null?i:a,labelVisible:x&&(f==null?void 0:f.show_label)===!0&&ue({text:f.label_text,showValue:f.label_show_value,showUnit:f.label_show_unit}),shape:(k=f==null?void 0:f.shape)!=null?k:"diamond",direction:(w=f==null?void 0:f.direction)!=null?w:"inward"}),Qt({id:"floor",type:"floor",value:c,position:p,lane:"below",visible:(_==null?void 0:_.show)===!0&&m,color:(M=_==null?void 0:_.color)!=null?M:null,label:b!=null?b:h,labelVisible:(_==null?void 0:_.show)===!0&&(_==null?void 0:_.show_label)===!0&&ue({text:_.label_text,showValue:_.label_show_value,showUnit:_.label_show_unit}),shape:"triangle",direction:(S=_==null?void 0:_.direction)!=null?S:"inward"}),Qt({id:"peak",type:"peak",value:l,position:s,lane:"above",visible:(y==null?void 0:y.show)===!0&&d,color:(R=y==null?void 0:y.color)!=null?R:null,label:u!=null?u:o,labelVisible:(y==null?void 0:y.show)===!0&&(y==null?void 0:y.show_label)===!0&&ue({text:y.label_text,showValue:y.label_show_value,showUnit:y.label_show_unit}),shape:"triangle",direction:(z=y==null?void 0:y.direction)!=null?z:"inward"}),...v.map($=>Qt({id:$.id,type:"generic",value:$.value,position:$.position,lane:$.lane,visible:$.visible,color:$.color,label:$.label,labelVisible:$.labelVisible&&ue($.label),shape:$.shape,direction:$.direction,showMarker:$.showMarker}))]}var Oi,ra=ae(()=>{Oi=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function Ui(r,e=""){var n,l,s;let t=String((l=(n=r==null?void 0:r.attributes)==null?void 0:n.device_class)!=null?l:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let a=String(e||"").split(".")[0];return(s={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[a])!=null?s:null}function Se(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function ji(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function ri(r){let e=ji(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function Ei(r,e,t,a,i){var o,u,d;let n=(o=r==null?void 0:r.bar)==null?void 0:o.needle;if(!(n!=null&&n.show)||Number.isFinite(i)||!Number.isFinite(e)){let c=(u=n==null?void 0:n.color)!=null?u:"#ffffff";return{show:!1,percent:null,pct:null,color:c,borderColor:ri(c),edge:"middle"}}let l=(d=n.color)!=null?d:"#ffffff",s=Math.min(100,Math.max(0,Se(e,t,a)));return{show:!0,percent:s,pct:s,color:l,borderColor:ri(l),edge:s<=0?"left":s>=100?"right":"middle"}}function ii(r,e,t,a,i,n){if(!n)return{value:null,percent:null,display:null,visible:!1};let l=T(a==null?void 0:a.value);if(!Number.isFinite(l)&&!Number.isFinite(r))return{value:null,percent:null,visible:!1};let s=Number.isFinite(l)?Number.isFinite(r)?i==="min"?Math.min(l,r):Math.max(l,r):l:r;return{value:s,percent:Se(s,e,t),visible:!0}}function ft(r){var G,j,te,Q,re,ie,ne,pe,St,Pe,Ie,Ve,We,Ae,De,Te,Le,Be,qe,He,Oe,Ue,je,Ee,Ge,Ke,Xe,Je,Ye,Ze,Qe,Ce,et,tt,at,C,rt,it,nr,lr,sr,or,ur,dr,cr,hr,pr,br,mr,fr,_r,vr,yr,xr,gr,wr,kr,Sr,Mr,Rr,$r,Nr;let{hass:e,cardConfig:t,entityConfig:a,entityState:i,peaks:n,extrema:l,previousScale:s}=r,o=(G=a==null?void 0:a.entity)!=null?G:null,u=ht(i,a==null?void 0:a.attribute),d=u.found&&!u.available?(j=u.stateObj)==null?void 0:j.state:null,c=d!=null?d:u.available&&u.attributeFound?u.value:"",p=typeof c=="string"||typeof c=="number"||typeof c=="boolean"?c:"",h=u.available&&u.attributeFound?T(u.value):null,b=(Q=(te=i==null?void 0:i.attributes)==null?void 0:te.unit_of_measurement)!=null?Q:"",m=(re=a==null?void 0:a.formatting)==null?void 0:re.unit,v=(ie=m!=null?m:b)!=null?ie:"",f=h!==null?v:"",{min:y,max:_}=Qr(e,a==null?void 0:a.scale,s),x=h!==null?Se(h,y,_):0,g=(pe=(ne=a==null?void 0:a.formatting)==null?void 0:ne.decimal)!=null?pe:null,k=h===null?ti(p):bt(h,f,g),w=((St=a==null?void 0:a.target_marker)==null?void 0:St.enabled)===!1?null:de(e,(Pe=a==null?void 0:a.target_marker)==null?void 0:Pe.source,y,_),M=w!==null?Se(w,y,_):null,S=w!==null,R=(Ve=(Ie=a==null?void 0:a.target_marker)==null?void 0:Ie.label_decimal)!=null?Ve:g,z=w!==null?bt(w,v,R):null,$=w!==null?mt(w,v,(Ae=(We=a==null?void 0:a.target_marker)==null?void 0:We.label_precision)!=null?Ae:R,{text:(De=a==null?void 0:a.target_marker)==null?void 0:De.label_text,showValue:(Te=a==null?void 0:a.target_marker)==null?void 0:Te.label_show_value,showUnit:(Le=a==null?void 0:a.target_marker)==null?void 0:Le.label_show_unit}):null,I=((Be=a==null?void 0:a.baseline)==null?void 0:Be.enabled)===!1?null:de(e,(qe=a==null?void 0:a.baseline)==null?void 0:qe.at,y,_),B=Number.isFinite(I)?Se(I,y,_):null,W=Number.isFinite(I),D=Number.isFinite(T(n==null?void 0:n[o]))?{value:T(n==null?void 0:n[o])}:null,N=ii(h,y,_,(He=l==null?void 0:l.peak)!=null?He:D,"max",((Oe=a==null?void 0:a.peak_marker)==null?void 0:Oe.show)===!0),V=ii(h,y,_,l==null?void 0:l.floor,"min",((Ue=a==null?void 0:a.floor_marker)==null?void 0:Ue.show)===!0),L=(Ee=(je=a==null?void 0:a.peak_marker)==null?void 0:je.label_decimal)!=null?Ee:g,E=(Ke=(Ge=a==null?void 0:a.floor_marker)==null?void 0:Ge.label_decimal)!=null?Ke:g,Y=(Je=(Xe=a==null?void 0:a.peak_marker)==null?void 0:Xe.label_precision)!=null?Je:L,Z=(Ze=(Ye=a==null?void 0:a.floor_marker)==null?void 0:Ye.label_precision)!=null?Ze:E,H=N.visible?bt(N.value,v,L):null,q=V.visible?bt(V.value,v,E):null,P=N.visible?mt(N.value,v,Y,{text:(Qe=a==null?void 0:a.peak_marker)==null?void 0:Qe.label_text,showValue:(Ce=a==null?void 0:a.peak_marker)==null?void 0:Ce.label_show_value,showUnit:(et=a==null?void 0:a.peak_marker)==null?void 0:et.label_show_unit}):null,O=V.visible?mt(V.value,v,Z,{text:(tt=a==null?void 0:a.floor_marker)==null?void 0:tt.label_text,showValue:(at=a==null?void 0:a.floor_marker)==null?void 0:at.label_show_value,showUnit:(C=a==null?void 0:a.floor_marker)==null?void 0:C.label_show_unit}):null,A=((rt=a==null?void 0:a.generic_markers)!=null?rt:[]).filter(K=>K.accepted).map(K=>{var Pr,Ir,Vr,Wr,Ar;let Mt=de(e,K.source,y,_),Fr=Number.isFinite(Mt),ci=(Pr=K.label.precision)!=null?Pr:g,oe=K.label.entity?pt(e,K.label.entity,K.label.attribute):null,va=oe==null?void 0:oe.value,ye=typeof va=="string"?va.trim():va,zr=(oe==null?void 0:oe.found)&&oe.available&&oe.attributeFound&&ye!==null&&ye!==void 0&&ye!==""&&!["unknown","unavailable"].includes(String(ye).trim().toLowerCase()),hi=K.label.entity?zr?(Ir=T(ye))!=null?Ir:String(ye):null:Mt,pi=K.label.entity?zr&&(Ar=(Wr=(Vr=oe.stateObj)==null?void 0:Vr.attributes)==null?void 0:Wr.unit_of_measurement)!=null?Ar:"":v,bi=K.label.show?mt(hi,pi,ci,{text:K.label.text,showValue:K.label.showValue,showUnit:K.label.showUnit}):null;return{id:K.id,value:Mt,position:Fr?Se(Mt,y,_):null,lane:K.lane,visible:Fr,color:K.color,shape:K.shape,direction:K.direction,showMarker:K.showMarker,label:bi,labelVisible:K.label.show}}),U=aa({entityConfig:a,targetValue:w,targetPosition:M,targetPresentation:z,targetLabelPresentation:$,targetVisible:S,peakValue:N.value,peakPosition:N.percent,peakPresentation:H,peakLabelPresentation:P,peakVisible:N.visible,floorValue:V.value,floorPosition:V.percent,floorPresentation:q,floorLabelPresentation:O,floorVisible:V.visible,genericMarkers:A});return{entityId:o,name:(lr=(nr=a==null?void 0:a.name)!=null?nr:(it=i==null?void 0:i.attributes)==null?void 0:it.friendly_name)!=null?lr:o,icon:(a==null?void 0:a.icon)===!1?!1:(ur=(or=a==null?void 0:a.icon)!=null?or:(sr=i==null?void 0:i.attributes)==null?void 0:sr.icon)!=null?ur:Ui(i,o),state:p,numericValue:h,rawUnit:b,min:y,max:_,percent:x,displayValue:k.number,displayUnit:k.unit,primaryPresentation:k,unit:k.unit,barColor:(cr=(dr=a==null?void 0:a.bar)==null?void 0:dr.color)!=null?cr:null,fillStyle:(pr=(hr=a==null?void 0:a.bar)==null?void 0:hr.fill_style)!=null?pr:null,target:w,targetPercent:M,targetDisplay:(br=z==null?void 0:z.text)!=null?br:null,targetPresentation:z,targetLabelPresentation:$,targetVisible:S,baseline:I,baselinePercent:B,baselineVisible:W,peak:N.value,peakPercent:N.percent,peakDisplay:(mr=H==null?void 0:H.number)!=null?mr:null,peakPresentation:H,peakLabelPresentation:P,peakVisible:N.visible,floor:V.value,floorPercent:V.percent,floorDisplay:(fr=q==null?void 0:q.number)!=null?fr:null,floorPresentation:q,floorLabelPresentation:O,floorVisible:V.visible,markers:U,markerLaneOccupancy:ea(a),markerLabelLaneOccupancy:ta(a),segments:(vr=(_r=a==null?void 0:a.bar)==null?void 0:_r.segments)!=null?vr:null,gradientStops:(xr=(yr=a==null?void 0:a.bar)==null?void 0:yr.gradient_stops)!=null?xr:null,needle:Ei(a,h,y,_,B),classes:{labelPosition:(kr=(wr=(gr=a==null?void 0:a.layout)==null?void 0:gr.label)==null?void 0:wr.position)!=null?kr:"left",animated:((Sr=a==null?void 0:a.bar)==null?void 0:Sr.animated)!==!1},attributes:{entity:o,baseHeight:(Rr=(Mr=a==null?void 0:a.layout)==null?void 0:Mr.height)!=null?Rr:38,heightExplicit:(($r=a==null?void 0:a.layout)==null?void 0:$r.height_explicit)===!0,barAnimated:((Nr=a==null?void 0:a.bar)==null?void 0:Nr.animated)!==!1}}}var La=ae(()=>{Xt();fe();Zt();ra()});function ee(r){return r==null?"":String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function J(r,e,t){var n,l;if(!(r!=null&&r.style))return!1;let a=t==null?"":String(t);return e.startsWith("--")?(typeof r.style.getPropertyValue=="function"?r.style.getPropertyValue(e):(n=r.style[e])!=null?n:"")===a?!1:(typeof r.style.setProperty=="function"?r.style.setProperty(e,a):r.style[e]=a,!0):((l=r.style[e])!=null?l:"")===a?!1:(r.style[e]=a,!0)}function Me(r,e){var i;if(!(r!=null&&r.style))return!1;let t=e==null?"":String(e);return((i=r.style.cssText)!=null?i:"")===t?!1:(r.style.cssText=t,!0)}function se(r,e,t){var n;if(!(r!=null&&r.dataset))return!1;let a=t==null?"":String(t);return((n=r.dataset[e])!=null?n:"")===a?!1:(r.dataset[e]=a,!0)}function ia(r,e){var a;if(!r)return!1;let t=e==null?"":String(e);return((a=r.className)!=null?a:"")===t?!1:(r.className=t,!0)}var na=ae(()=>{});function ha(r,e){if(!r||!e||!Number.isFinite(r.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(r.baselinePercent)?r.baselinePercent:0,a=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,i=Math.max(Math.abs(e.valuePercent-r.valuePercent),Math.abs(a-t)),n=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,i-5))));return Number.isFinite(r.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(r.valuePercent-r.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(n,300):n}function la(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function $e(r){if(!r||typeof r!="string")return null;let e=r.replace("#","").trim(),t=e.length===3?e.split("").map(a=>a+a).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function pa(r,e=0,t=100,a=!1){let n=Ne(r,e,t).filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&(s==null?void 0:s.color)).sort((s,o)=>s.from-o.from);if(!n.length)return[];let l=[];for(let s=0;s<n.length;s++){let o=n[s],u=$e(o.color);if(!u&&!a)continue;let d;s===0?d=o.from:s===n.length-1?d=o.to:d=o.from+(o.to-o.from)/2,(!l.length||l[l.length-1].p!==d)&&l.push({p:d,...u!=null?u:{color:o.color}})}return l}function Ba(r,e=0,t=100){let i=Ne(r,e,t).filter(l=>Number.isFinite(l==null?void 0:l.from)&&Number.isFinite(l==null?void 0:l.to)&&(l==null?void 0:l.color)).sort((l,s)=>l.from-s.from);if(!i.length)return null;let n=[];for(let l of i)n.push(`${l.color} ${l.from}%`,`${l.color} ${l.to}%`);return`linear-gradient(to right, ${n.join(", ")})`}function qa(){return 1.5}function he(r,e,t){if(!Array.isArray(r)||!t)return;let a=Math.min(100,Math.max(0,e)),i=r[r.length-1];i&&i.color===t&&Math.abs(i.p-a)<1e-4||r.push({p:a,color:t})}function vt(r,e=0,t=100){let i=Ne(r,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,u)=>o.from-u.from);if(!i.length)return[];let n=qa(),l=n/2,s=[];he(s,i[0].from,i[0].color);for(let o=0;o<i.length-1;o++){let u=i[o],d=i[o+1],c=u.to,p=u.to-u.from,h=d.to-d.from;p>=n&&h>=n?(he(s,Math.max(u.from,c-l),u.color),he(s,Math.min(d.to,c+l),d.color)):(he(s,c,u.color),he(s,c,d.color))}return he(s,i[i.length-1].to,i[i.length-1].color),s}function Ha(r,e=0,t=100){let a=vt(r,e,t);return a.length?`linear-gradient(to right, ${a.map(i=>`${i.color} ${i.p}%`).join(", ")})`:null}function sa(r,e,t){if(r==null)return null;if(typeof r=="object"&&!Array.isArray(r)){let n=T(r.fixed);return Number.isFinite(n)?_t(n,e,t):Number.isFinite(r.percent)?r.percent:null}let a=me(r);if(Number.isFinite(a))return a;let i=T(r);return Number.isFinite(i)?_t(i,e,t):null}function yt(r){var e,t,a,i;return(i=(a=(e=r==null?void 0:r.bar)==null?void 0:e.fill_style)!=null?a:ct((t=r==null?void 0:r.bar)==null?void 0:t.color_mode))!=null?i:"bands"}function Oa(r){return Array.isArray(r)&&r.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Ne(r,e=0,t=100){var l,s;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((l=r.bar)==null?void 0:l.segments)?r.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((s=r.bar)==null?void 0:s.segment_space)==="scale"||Oa(n)){let o=n.map(u=>{var d;return{from:sa(u.from,a,i),to:sa(u.to,a,i),color:u.color,label:(d=u.label)!=null?d:null}}).filter(u=>Number.isFinite(u.from)&&u.color);return la(o,100).filter(u=>Number.isFinite(u.from)&&Number.isFinite(u.to)&&u.color)}return la(n,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.color)}function Ua(r,e,t=0,a=100){let i=yt(e);if(i==="solid")return e.bar.color;if(i==="gradient"||i==="band_gradient"||i==="soft_bands"){let n;if(i==="band_gradient"?n=pa(e,t,a):i==="soft_bands"?n=vt(e,t,a).map(u=>{let d=$e(u.color);return d?{p:u.p,...d}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(n=e.bar.gradient_stops.map(u=>{let d=u.color.replace("#",""),c=d.length===3?d.split("").map(p=>p+p).join(""):d;return{p:u.pos,r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}}),n.sort((u,d)=>u.p-d.p)):n=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!n||!n.length)return e.bar.color;let l=n[0],s=n[n.length-1];for(let u=0;u<n.length-1;u++)if(r>=n[u].p&&r<=n[u+1].p){l=n[u],s=n[u+1];break}let o=l.p===s.p?0:(r-l.p)/(s.p-l.p);return`rgb(${Math.round(l.r+o*(s.r-l.r))},${Math.round(l.g+o*(s.g-l.g))},${Math.round(l.b+o*(s.b-l.b))})`}for(let n of Ne(e,t,a))if(r>=n.from&&r<=n.to)return n.color;return e.bar.color}function ja(r){if(!Array.isArray(r)||!r.length)return null;let e=r.map(t=>{var i;let a=(i=t.color)!=null?i:Ga(t);return a?`${a} ${t.p}%`:null}).filter(Boolean);return e.length?`background:linear-gradient(to right,${e.join(",")});background-repeat:no-repeat;`:null}function Ea(r,e=0,t=100){let a=yt(r);return a==="band_gradient"?pa(r,e,t,!0):a==="soft_bands"?vt(r,e,t).map(i=>{let n=$e(i.color);return n?{p:i.p,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):r.bar.gradient_stops&&r.bar.gradient_stops.length>=2?r.bar.gradient_stops.map(i=>{let n=$e(i.color);return n?{p:i.pos,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function Ga(r){return r?`rgb(${r.r},${r.g},${r.b})`:null}function oa(r){return`linear-gradient(to right,${r} 0%,${r} 100%)`}function Ka(r,e,t=0,a=100){var n;let i=yt(e);if(e.bar.solid_fill)return oa(r);if(i==="bands")return Ba(e,t,a);if(i==="soft_bands")return Ha(e,t,a);if(i==="gradient"||i==="band_gradient"){let l=Ea(e,t,a);return(n=ja(l))==null?void 0:n.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return oa(r)}function ua(r,e,t){if(!t)return null;let a=Math.min(100,Math.max(0,r)),i=Math.min(100,Math.max(0,e));return i<=a?null:`linear-gradient(to right,transparent 0%,transparent ${a}%,${t} ${a}%,${t} ${i}%,transparent ${i}%,transparent 100%)`}function _t(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function da(r,e=null){let t=Math.min(100,Math.max(0,r));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let a=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,a),end:Math.max(t,a),positive:t>=a,baseline:a,hidden:t===a}}function Xa(r){return r!=null&&r.endpointSemantics?r.endpointSemantics:r!=null&&r.usesBaseline?r.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function Ja(r){let e=Xa(r),t=n=>n==="value"||n==="range"||n==="scale",a=t(e.left)?"6px":"0",i=t(e.right)?"6px":"0";return`${a} ${i} ${i} ${a}`}function Ya(r=null){if(!Number.isFinite(r))return null;let e=Math.min(100,Math.max(0,r));return e>=100?null:{start:e,end:100}}function Za(r=null){let e=Ya(r);return e?{start:e.start,end:e.end,hidden:!1}:null}function Qa(r,e,t=null,a=null,i=0,n=100){var u,d,c,p,h,b;let l=[],s=Ka(e,r,i,n),o=Number.isFinite(a)?Math.min(100,Math.max(0,a)):null;if(Number.isFinite(o)){let m=(c=(d=(u=r.baseline)==null?void 0:u.below)==null?void 0:d.color)!=null?c:null,v=(b=(h=(p=r.baseline)==null?void 0:p.above)==null?void 0:h.color)!=null?b:null,f=ua(0,o,m),y=ua(o,100,v);f&&l.push(f),y&&l.push(y)}return s&&l.push(s),l.length?`display:block;inset:0;background-image:${l.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function Ca(r,e){var d,c;let t=typeof e=="number"?`${e}px`:e,a=Math.min(100,Math.max(0,(d=r==null?void 0:r.start)!=null?d:0)),i=Math.min(100,Math.max(0,(c=r==null?void 0:r.end)!=null?c:0));if(r!=null&&r.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let n="0",l=`${Math.max(0,100-i)}%`,s="0",o=`${a}%`,u=Ja(r);return`display:block;height:${t};clip-path:inset(${n} ${l} ${s} ${o} round ${u});`}function ca(r){if(!(r!=null&&r.hidden)&&Number.isFinite(r==null?void 0:r.start)&&Number.isFinite(r==null?void 0:r.end)&&r.end>r.start){let e=Math.min(100,Math.max(0,r.start)),t=Math.min(100,Math.max(0,r.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function er(r,e,t,a,i=null,n=null,l=0,s=100){var p,h;let u={id:"base",zIndex:1,visible:!0,paintStyle:Qa(t,a,i,n,l,s),revealStyle:"display:block;"},d=Za(i),c={id:"above-target",zIndex:2,visible:!!((p=t==null?void 0:t.bar)!=null&&p.above_target_color&&d),paintStyle:(h=t==null?void 0:t.bar)!=null&&h.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:ca(d||{start:0,end:0,hidden:!0})};return[u,c]}function tr(r,e,t,a,i=null,n=null,l=0,s=100,o=!1){var c,p;let u=o?da(100,null):da(r,n),d=er(u,e,t,a,i,n,l,s);return{geometry:u,paintLayers:d,paintStyle:(p=(c=d[0])==null?void 0:c.paintStyle)!=null?p:"display:none;",revealStyle:Ca(u,e)}}function ni(r,e,t=0,a=100,i=null){var s,o,u,d,c,p,h,b,m;let n=(s=e==null?void 0:e.bar)==null?void 0:s.needle;if(!(n!=null&&n.show))return{show:!1,pct:null,color:(o=n==null?void 0:n.color)!=null?o:"#ffffff",borderColor:Re((u=n==null?void 0:n.color)!=null?u:"#ffffff"),edge:"middle"};if(Number.isFinite(i))return{show:!1,pct:null,color:(d=n.color)!=null?d:"#ffffff",borderColor:Re((c=n.color)!=null?c:"#ffffff"),edge:"middle"};if(!Number.isFinite(r))return{show:!1,pct:null,color:(p=n.color)!=null?p:"#ffffff",borderColor:Re((h=n.color)!=null?h:"#ffffff"),edge:"middle"};let l=Math.min(100,Math.max(0,_t(r,t,a)));return{show:!0,pct:l,color:(b=n.color)!=null?b:"#ffffff",borderColor:Re((m=n.color)!=null?m:"#ffffff"),edge:l<=0?"left":l>=100?"right":"middle"}}function ba(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function ar({r,g:e,b:t}){let a=r/255,i=e/255,n=t/255,l=Math.max(a,i,n),s=Math.min(a,i,n),o=(l+s)/2;if(l===s)return{h:0,s:0,l:o*100};let u=l-s,d=o>.5?u/(2-l-s):u/(l+s),c;switch(l){case a:c=((i-n)/u+(i<n?6:0))/6;break;case i:c=((n-a)/u+2)/6;break;default:c=((a-i)/u+4)/6;break}return{h:c*360,s:d*100,l:o*100}}function xt(r){let e=ba(r);if(!e)return"#f3f4f6";let{h:t,s:a,l:i}=ar(e),n=Math.abs(i-90)>=Math.abs(i-10)?90:10,l=Math.max(40,Math.min(100,a));return`hsl(${Math.round(t)} ${Math.round(l)}% ${Math.round(n)}%)`}function ve(r){var e;return(e=r==null?void 0:r.color)!=null?e:"#888888"}function Re(r){let e=ba(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function gt(r,e,{height:t,color:a=Ua(r.percent,e,r.min,r.max)}={}){var s,o,u,d;let i=r.baselinePercent,n=(s=e.baseline)==null?void 0:s.at,l=((o=e.baseline)==null?void 0:o.enabled)!==!1&&(Number.isFinite(i)||!!(n!=null&&n.entity)||(n==null?void 0:n.fixed)!==null&&(n==null?void 0:n.fixed)!==void 0||Number.isFinite(n==null?void 0:n.percent));return{animated:e.bar.animated,fill:tr(r.percent,t,e,a,r.targetPercent,i,r.min,r.max,r.needle.show),baseline:{configured:l,percent:i},needle:{...r.needle,configured:((d=(u=e.bar)==null?void 0:u.needle)==null?void 0:d.show)&&!Number.isFinite(i)},markers:r.markers}}var ma=ae(()=>{fe()});function Fe(r){var u,d,c,p,h,b,m;if(!r)return"";let e=Number.isFinite(r.position)?r.position:0,t=ve(r),a=xt(t),i=r.visible?"":"none",n=r.type==="target"?"diamond":r.type==="generic"?"circle":"triangle",l=Ct(r.shape,n),s=(u=r.lane)!=null?u:r.type==="peak"?"above":"below",o=`<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;if(r.type==="generic"){let v=s==="above"?["peak-inset","peak-outset"]:["target-inset","target-outset"];return`
    <div class="generic-marker" data-marker-id="${ee(r.id)}" data-shape="${l}" data-lane="${s}" data-direction="${(d=r.direction)!=null?d:"inward"}" data-show-marker="${r.showMarker===!1?"false":"true"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${v[0]}"></div>
      <div class="${v[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(c=r.direction)!=null?c:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}return r.type==="target"||r.type==="floor"?`
    <div class="${`${r.type}-marker`}" data-shape="${l}" data-lane="${s}" data-direction="${(p=r.direction)!=null?p:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${r.type}-inset"></div>
      <div class="${r.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(h=r.direction)!=null?h:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`:`
    <div class="peak-marker" data-shape="${l}" data-lane="${s}" data-direction="${(b=r.direction)!=null?b:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(m=r.direction)!=null?m:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}function ze(r,e){var l,s,o,u,d;if(!r||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",a=Ct(e.shape,t);se(r,"shape",a),se(r,"lane",(l=e.lane)!=null?l:e.type==="peak"?"above":"below"),se(r,"direction",(s=e.direction)!=null?s:"inward"),e.type==="generic"&&se(r,"showMarker",e.showMarker===!1?"false":"true");let i=(o=r.querySelector)==null?void 0:o.call(r,".marker-shape-svg");i&&(se(i,"shape",a),se(i,"lane",(u=e.lane)!=null?u:e.type==="peak"?"above":"below"),se(i,"direction",(d=e.direction)!=null?d:"inward")),J(r,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&J(r,"left",`${e.position}%`);let n=ve(e);J(r,"--marker-color",n),J(r,"--marker-contrast-color",xt(n))}function fa(r,e,{revealDuration:t=600}={}){var d,c,p;let a=r.querySelector(".bar-fill-reveal"),i=r.querySelector(".baseline-indicator"),n=r.querySelector('.bar-paint-layer[data-layer="base"]');if(a&&(Me(a,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),ia(a,`bar-fill-reveal${e.animated?"":" no-anim"}`)),i&&(J(i,"display",Number.isFinite(e.baseline.percent)?"block":"none"),Number.isFinite(e.baseline.percent)&&J(i,"left",`${e.baseline.percent}%`)),n){let h=e.fill.paintLayers.find(b=>b.id==="base");h&&Me(n,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let l=r.querySelector('.bar-paint-layer[data-layer="above-target"]');if(l){let h=e.fill.paintLayers.find(b=>b.id==="above-target");h&&Me(l,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let s=r.querySelector(".needle-marker");s&&(J(s,"display",e.needle.show?"block":"none"),J(s,"left",`${(d=e.needle.pct)!=null?d:0}%`),J(s,"--needle-color",e.needle.color),J(s,"--needle-border-color",e.needle.borderColor),se(s,"edge",e.needle.edge));let o=e.markers,u=h=>{var b;return(b=o.find(m=>m.id===h||m.type===h))!=null?b:null};ze(r.querySelector(".target-marker"),u("target")),ze(r.querySelector(".peak-marker"),u("peak")),ze(r.querySelector(".floor-marker"),u("floor")),((p=(c=r.querySelectorAll)==null?void 0:c.call(r,".generic-marker[data-marker-id]"))!=null?p:[]).forEach(h=>{ze(h,u(h.dataset.markerId))})}function _a(r,{insideContent:e=""}={}){var h;let t=r.fill,a=r.baseline.percent,i=r.needle,n=r.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(a)?`left:${a}%;display:block;`:"display:none;"}"></div>`:"",l=b=>{var m;return(m=r.markers.find(v=>v.id===b||v.type===b))!=null?m:null},s=Fe(l("peak")),o=Fe(l("target")),u=Fe(l("floor")),d=r.markers.filter(b=>b.type==="generic").map(Fe).join(""),c=i.configured?`
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${i.edge}" style="left:${(h=i.pct)!=null?h:0}%;--needle-color:${i.color};--needle-border-color:${i.borderColor};display:${i.show?"block":"none"};"></div>
      </div>`:"",p=t.paintLayers.map(b=>`
                  <div class="bar-paint-layer" data-layer="${b.id}" style="z-index:${b.zIndex};${b.paintStyle}${b.revealStyle}"></div>`).join("");return`<div class="bar-track">
                <div class="bar-fill-reveal${r.animated?"":" no-anim"}" style="${t.revealStyle}">
${p}
                </div>
                ${n}
                ${e}
                ${s}
                ${o}
                ${u}
                ${d}
                ${c}
              </div>`}var rr=ae(()=>{ra();ma();na()});var wt,li=ae(()=>{Nt();wa();fe();Xt();Aa();La();ra();na();Zt();Vt();ma();rr();wt=class extends HTMLElement{static async getConfigElement(){return $t("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._extrema=new WeakMap,this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._rowGeneration+=1,window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var a;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._rowGeneration+=1;let t=this._config;this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((a=t==null?void 0:t.entities)!=null?a:[]),this._diagnostics=Yt(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var d,c,p,h;let t=(b,m="")=>{if(Array.isArray(b))return b.map(t);if(b&&typeof b=="object")return Object.fromEntries(Object.keys(b).sort().filter(v=>!["severity","segment_space","label_precision_key"].includes(v)).map(v=>[v,t(b[v],v)]));if(m==="fixed")return ke(null,b);if(/color/i.test(m)&&typeof b=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(b.trim())){let v=b.trim().slice(1).toLowerCase();return`#${v.length===3?v.split("").map(f=>f+f).join(""):v}`}return b},a=b=>{var m;return JSON.stringify(t({entity:b.entity,name:b.name,icon:(m=b.icon)!=null?m:null,layout:b.layout,scale:Object.fromEntries(["min","max"].map(v=>[v,{...b.scale[v],fixed_explicit:b.scale[v].fixed_explicit!==!1}])),bar:b.bar,baseline:b.baseline,formatting:b.formatting,target_marker:b.target_marker,peak_marker:b.peak_marker,floor_marker:b.floor_marker,generic_markers:b.generic_markers}))},i=new Set(e),n=new Map,l=new Map(e.map(b=>[b,a(b)]));for(let b of this._config.entities){let m=a(b),v=[...i].find(f=>l.get(f)===m);v&&(n.set(b,v),i.delete(v))}let s=this._config.entities.filter(b=>!n.has(b));for(let b of s){let m=[...i].filter(f=>f.entity===b.entity),v=s.filter(f=>f.entity===b.entity);m.length!==1||v.length!==1||(n.set(b,m[0]),i.delete(m[0]))}let o=new WeakMap,u=new WeakMap;for(let[b,m]of n){let v=this._extrema.get(m),f={};for(let y of["peak","floor"]){let _=m[`${y}_marker`],x=b[`${y}_marker`];v!=null&&v[y]&&(_==null?void 0:_.show)===!0&&(x==null?void 0:x.show)===!0&&JSON.stringify(_.reset)===JSON.stringify(x.reset)&&(f[y]={...v[y]})}(f.peak||f.floor)&&o.set(b,f),((c=(d=m.layout)==null?void 0:d.label)==null?void 0:c.position)==="left"&&((h=(p=b.layout)==null?void 0:p.label)==null?void 0:h.position)==="left"&&this._leftModeResponsiveHistory.has(m)&&u.set(b,this._leftModeResponsiveHistory.get(m))}this._extrema=o,this._leftModeResponsiveHistory=u}_logDiagnostics(){var a;let e=(a=this._diagnostics)!=null?a:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}),e.errors.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}))}normalizeCardConfig(e){return Kt(e)}normalizeEntityConfig(e,t){return Ia(e,t)}normalizeResolvableValue(e,t,a=null){return X(e,t,a)}_looksLikeEntityId(e){return le(e)}_parsePercentLiteral(e){return me(e)}_getFiniteNumber(e){return T(e)}normalizeStructuredResolvableValue(e,t=null,a=null,i={}){return be(e,t,a,i)}normalizeBaselineDirectionConfig(e,t=null){return xe(e,t)}normalizeBaselineConfig(e,t){return qt(e,t)}inferSegmentEndValues(e,t=null){return la(e,t)}normalizeSeverityToSegments(e){return Dt(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return st(e)}normalizeScaleBound(e,t,a,i){return Tt(e,t,a,i)}normalizeScaleConfig(e,t){return Ht(e,t)}_fillStyleToColorMode(e){return Ra(e)}_colorModeToFillStyle(e){return ct(e)}_normalizeBarModeConfig(e=null,t=null){return ge(e,t)}_resolveNormalizedBarMode(e,t,a,i){return Na(e,t,a,i)}_normalizeGradientStops(e){return Fa(e)}normalizeNeedleConfig(e,t=null){return za(e,t)}normalizeBarConfig(e,t){return Ot(e,t)}normalizeLayoutConfig(e,t){return Ut(e,t)}_clampSupportedRowHeight(e){return Pa(e)}normalizeFormattingConfig(e,t){return jt(e,t)}normalizeTargetMarkerConfig(e,t){return Et(e,t)}normalizePeakMarkerConfig(e,t){return Gt(e,t)}_normalizeOptionalEnabled(e){return ot(e)}set hass(e){let t=this._hass;if(this._hass=e,!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var i,n,l,s,o,u,d;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),a=(l=(n=(i=this._hass)==null?void 0:i.states)==null?void 0:n[t.entity])!=null?l:null;return{...t,icon:t.icon===!1?!1:(u=(o=t.icon)!=null?o:(s=a==null?void 0:a.attributes)==null?void 0:s.icon)!=null?u:this._getDefaultEntityIcon(a,t.entity),name:(d=t.name)!=null?d:null}}_getStateTimestamp(e){var i;let t=(i=e==null?void 0:e.last_updated)!=null?i:e==null?void 0:e.last_changed,a=t instanceof Date?t.getTime():Date.parse(String(t!=null?t:""));return Number.isFinite(a)?a:Date.now()}_updateExtrema(e,t,a){var o,u,d;let i=ht(a,t==null?void 0:t.attribute),n=i.available&&i.attributeFound?T(i.value):null;if(!Number.isFinite(n))return;let l=(o=this._extrema.get(e))!=null?o:{},s=this._getStateTimestamp(a);for(let c of["peak","floor"]){let p=t==null?void 0:t[`${c}_marker`];if((p==null?void 0:p.show)!==!0){delete l[c];continue}l[c]=It((u=l[c])!=null?u:null,n,(d=p.reset)!=null?d:{kind:"never"},c==="floor"?"min":"max",s)}l.peak||l.floor?this._extrema.set(e,l):this._extrema.delete(e)}_getDefaultEntityIcon(e,t=""){var l,s,o;let a=String((s=(l=e==null?void 0:e.attributes)==null?void 0:l.device_class)!=null?s:"").trim();if(a){let u={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(u[a])return u[a]}let i=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[i])!=null?o:null}_shouldUpdate(e,t){var a,i,n,l,s,o,u,d,c,p,h;if(!this._config||!this._config.entities)return!0;for(let b of this._config.entities){let m=this._resolve(b),v=[b.entity,(i=(a=m.scale)==null?void 0:a.min)==null?void 0:i.entity,(l=(n=m.scale)==null?void 0:n.max)==null?void 0:l.entity,(o=(s=m.baseline)==null?void 0:s.at)==null?void 0:o.entity,(d=(u=m.target_marker)==null?void 0:u.source)==null?void 0:d.entity,...((c=m.generic_markers)!=null?c:[]).filter(f=>f.accepted).flatMap(f=>{var y,_;return[(y=f.source)==null?void 0:y.entity,(_=f.label)==null?void 0:_.entity]})].filter(Boolean);for(let f of v){let y=(p=e.states[f])!=null?p:null,_=(h=t.states[f])!=null?h:null;if(y!==_)return!0}}return!1}_setStyleIfChanged(e,t,a){return J(e,t,a)}_setStyleTextIfChanged(e,t){return Me(e,t)}_setTextIfChanged(e,t){var i;if(!e)return!1;let a=t==null?"":String(t);return((i=e.textContent)!=null?i:"")===a?!1:(e.textContent=a,!0)}_setDatasetIfChanged(e,t,a){return se(e,t,a)}_setClassNameIfChanged(e,t){return ia(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,a;((a=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?a:[]).forEach(i=>{let n=i.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${n}"]`,`.generic-marker[data-marker-id="${n}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var i;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let n=e.dataset.markerId;return(i=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(l=>l.dataset.markerId===n))!=null?i:null}let a=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return a?t.querySelector(a):null}_getGenericMarkerForLabel(e){var i,n;let t=e==null?void 0:e.closest(".row"),a=(i=e==null?void 0:e.dataset)==null?void 0:i.markerId;return!t||!a?null:(n=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(l=>l.dataset.markerId===a))!=null?n:null}_setMarkerHover(e){var a;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((a=this._markerHover)==null?void 0:a.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var i,n,l;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),a=(l=t==null?void 0:t.matches)!=null&&l.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._setMarkerHover(a)}_handleMarkerPointerOut(e){var i,n;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let a=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._clearMarkerHover(a)}_positionMarkerValueLabel(e,t,a){let i=e.querySelector(".bar-track"),n=e.querySelector(t),l=e.querySelector(a);if(!i||!n||!l)return;if(l.style.display==="none"||!n.textContent.trim()){this._setStyleIfChanged(n,"visibility","hidden");return}let s=i.getBoundingClientRect(),o=Math.max(0,Math.floor(s.width-4));this._setStyleIfChanged(n,"maxWidth",`${o}px`);let u=n.getBoundingClientRect(),d=parseFloat(l.style.left);if(!Number.isFinite(d)||s.width<=0||u.width<=0||o<=10){this._setStyleIfChanged(n,"visibility","hidden");return}let c=d/100*s.width,p=u.width/2,h=Math.max(p,Math.min(s.width-p,c));this._setStyleIfChanged(n,"left",`${h}px`),this._setStyleIfChanged(n,"transform","translateX(-50%)"),this._setStyleIfChanged(n,"visibility","visible")}_getEntityNumericValue(e){return we(this._hass,e)}_getNumericValue(e,t=null){return ke(this._hass,e,t)}_resolvePercentValue(e,t,a){return Va(e,t,a)}_getNormalizedResolvableNumericValue(e,t=null,a=null){return de(this._hass,e,t,a)}_hexToRgb(e){return $e(e)}_getSeverityInterpolationStops(e,t=0,a=100){return pa(e,t,a)}_getSeverityBandGradientCss(e,t=0,a=100){return Ba(e,t,a)}_getSoftBandBlendWidthPct(){return qa()}_pushGradientColorStop(e,t,a){return he(e,t,a)}_getSoftBandGradientStops(e,t=0,a=100){return vt(e,t,a)}_getSoftBandGradientCss(e,t=0,a=100){return Ha(e,t,a)}_resolveSegmentBoundaryPct(e,t,a){return sa(e,t,a)}_getEffectiveFillStyle(e){return yt(e)}_segmentsNeedBoundaryResolution(e){return Oa(e)}_getSegmentsForRendering(e,t=0,a=100){return Ne(e,t,a)}_getColor(e,t,a=0,i=100){return Ua(e,t,a,i)}_buildFullScaleGradientStyle(e){return ja(e)}_getGradientInterpolationStops(e,t=0,a=100){return Ea(e,t,a)}_rgbToCss(e){return Ga(e)}_buildSolidGradientStyle(e){return oa(e)}_getBasePaintGradient(e,t,a=0,i=100){return Ka(e,t,a,i)}_getOverlayGradient(e,t,a){return ua(e,t,a)}_toScalePct(e,t,a){return _t(e,t,a)}_getRevealTransitionDuration(e,t){return ha(e,t)}_resolveBaselinePct(e,t,a){var n,l;if(((n=e.baseline)==null?void 0:n.enabled)===!1)return null;let i=this._getNormalizedResolvableNumericValue((l=e.baseline)==null?void 0:l.at,t,a);return Number.isFinite(i)?this._toScalePct(i,t,a):null}_formatNumericDisplay(e,t=null){return ce(e,t)}_getNormalizedPercent(e,t=null){return da(e,t)}_getEndpointSemantics(e){return Xa(e)}_getRevealCornerRadii(e){return Ja(e)}_getAboveTargetOverlayInterval(e=null){return Ya(e)}_getAboveTargetLayerGeometry(e=null){return Za(e)}_getFullScalePaintStyle(e,t,a=null,i=null,n=0,l=100){return Qa(e,t,a,i,n,l)}_getRevealShapeStyle(e,t){return Ca(e,t)}_getStaticLayerRevealStyle(e){return ca(e)}_getFillPaintLayers(e,t,a,i,n=null,l=null,s=0,o=100){return er(e,t,a,i,n,l,s,o)}_getFillRenderState(e,t,a,i,n=null,l=null,s=0,o=100,u=!1){return tr(e,t,a,i,n,l,s,o,u)}_getNeedleRenderState(e,t,a=0,i=100,n=null){return ni(e,t,a,i,n)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, sans-serif;
          position: relative;
          z-index: 0;
          isolation: isolate;
        }

        ha-card {
          display: block;
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.08));
          overflow: hidden;
          padding: 16px;
          box-sizing: border-box;
        }
        .card {
          --sbcp-main-gap: 8px;
          --sbcp-icon-width: 28px;
          --sbcp-above-gap: 10px;
          --sbcp-left-label-share: 25%;
          --sbcp-value-width: 60px;
          --sbcp-bar-min-width: 56px;
          --sbcp-target-label-font-size: 12px;
          --sbcp-marker-label-lane-size: 15px;
          --sbcp-inline-label-padding-x: 8px;
          --sbcp-inline-label-padding-y: 2px;
          --sbcp-inline-label-font-size: 12px;
          min-width: 0;
        }
        .card[data-compact="compact"] {
          --sbcp-main-gap: 6px;
          --sbcp-icon-width: 26px;
          --sbcp-above-gap: 8px;
          --sbcp-left-label-share: 22%;
          --sbcp-value-width: 54px;
          --sbcp-bar-min-width: 52px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 7px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="tight"] {
          --sbcp-main-gap: 5px;
          --sbcp-icon-width: 24px;
          --sbcp-above-gap: 6px;
          --sbcp-left-label-share: 19%;
          --sbcp-value-width: 50px;
          --sbcp-bar-min-width: 48px;
          --sbcp-target-label-font-size: 11px;
          --sbcp-inline-label-padding-x: 6px;
          --sbcp-inline-label-font-size: 11px;
        }
        .card[data-compact="dense"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 23px;
          --sbcp-above-gap: 5px;
          --sbcp-left-label-share: 16%;
          --sbcp-value-width: 46px;
          --sbcp-bar-min-width: 44px;
          --sbcp-target-label-font-size: 10px;
          --sbcp-inline-label-padding-x: 5px;
          --sbcp-inline-label-font-size: 10px;
        }
        .card[data-compact="compressed"] {
          --sbcp-main-gap: 4px;
          --sbcp-icon-width: 22px;
          --sbcp-above-gap: 4px;
          --sbcp-left-label-share: 14%;
          --sbcp-value-width: 42px;
          --sbcp-bar-min-width: 40px;
          --sbcp-target-label-font-size: 10px;
          --sbcp-inline-label-padding-x: 5px;
          --sbcp-inline-label-font-size: 10px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--secondary-text-color, #888);
          margin-bottom: 14px;
        }
        .row {
          margin-bottom: 10px;
          cursor: pointer;
          border-radius: 8px;
          padding: 2px 4px;
        }
        .row:last-child { margin-bottom: 0; }
        .row[data-marker-label-lane-below="true"]:not(:last-child) {
          margin-bottom: calc(10px + max(0px, var(--sbcp-marker-label-lane-size) - 12px));
        }
        /* Facing configured lanes overlap by 9px at the approved offsets; 10px leaves a 1px gap. */
        .row[data-marker-label-lane-below="true"]:has(+ .row[data-marker-label-lane-above="true"]) {
          margin-bottom: calc(10px + max(0px, var(--sbcp-marker-label-lane-size) - 12px) + 10px);
        }
        .row-stack {
          --sbcp-row-height: 38px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .row-stack[data-top-value="true"] .main-line.left-mode .value-right {
          display: none;
        }
        .top-right-value {
          display: none;
          align-self: flex-end;
          align-items: center;
          justify-content: flex-end;
          max-width: 100%;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          text-align: right;
          line-height: 1.1;
          margin-bottom: 1px;
        }
        .top-right-value[data-active="true"] {
          display: flex;
        }
        .above-line,
        .hero-line,
        .top-right-value {
          position: relative;
          z-index: 10;
        }
        .row:hover .bar-track { filter: brightness(0.95); transition: filter 0.15s; }
        .main-line {
          display: flex;
          align-items: center;
          gap: var(--sbcp-main-gap);
          min-width: 0;
        }
        .row[data-marker-label-lane-above="true"] .main-line:not(.hero-mode) {
          margin-top: var(--sbcp-target-label-font-size);
        }
        .main-line[data-row-density="tight"] {
          gap: calc(var(--sbcp-main-gap) - 1px);
        }
        .main-line[data-row-density="dense"] {
          gap: calc(var(--sbcp-main-gap) - 2px);
        }
        .main-line[data-row-density="compressed"] {
          gap: calc(var(--sbcp-main-gap) - 2px);
        }
        .main-line:not(.left-mode)[data-row-density="compact"] {
          --sbcp-value-width: 52px;
        }
        .main-line:not(.left-mode)[data-row-density="tight"] {
          --sbcp-value-width: 48px;
        }
        .main-line:not(.left-mode)[data-row-density="dense"] {
          --sbcp-value-width: 44px;
        }
        .main-line:not(.left-mode)[data-row-density="compressed"] {
          --sbcp-value-width: 40px;
        }
        .main-line.off-mode[data-row-density="compressed"] .icon-wrap,
        .main-line.above-mode[data-row-density="compressed"] .icon-wrap {
          display: none;
        }
        .main-line.left-mode[data-hide-left-icon="true"] .icon-wrap,
        .main-line.above-mode[data-hide-above-icon="true"] .icon-wrap,
        .main-line.inside-mode[data-hide-inside-icon="true"] .icon-wrap,
        .main-line.inside-mode[data-priority-hide-inside-icon="true"] .icon-wrap,
        .main-line.off-mode[data-hide-off-icon="true"] .icon-wrap {
          display: none;
        }
        .main-line.left-mode[data-left-density="normal"] {
          --sbcp-left-label-share: 25%;
          --sbcp-value-width: 58px;
        }
        .main-line.left-mode[data-left-density="compact"] {
          --sbcp-left-label-share: 22%;
          --sbcp-value-width: 53px;
        }
        .main-line.left-mode[data-left-density="tight"] {
          --sbcp-left-label-share: 19%;
          --sbcp-value-width: 49px;
        }
        .main-line.left-mode[data-left-density="dense"] {
          --sbcp-left-label-share: 16%;
          --sbcp-value-width: 46px;
        }
        .main-line.left-mode[data-left-density="compressed"] {
          --sbcp-left-label-share: 14%;
          --sbcp-value-width: 42px;
        }
        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: var(--sbcp-icon-width);
          height: var(--sbcp-row-height);
          min-height: var(--sbcp-row-height);
          color: var(--primary-text-color, #333);
          line-height: 1;
        }
        ha-icon {
          --mdc-icon-size: 20px;
          display: block;
        }
        .label-left {
          position: relative;
          z-index: 10;
          flex: 1 1 auto;
          height: var(--sbcp-row-height);
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          display: flex;
          align-items: center;
        }
        .label-left[data-hidden="true"],
        .label-left[data-priority-hidden="true"] {
          display: none;
        }
        .label-left-text {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bar-wrap {
          flex: 1 1 var(--sbcp-bar-min-width);
          min-width: var(--sbcp-bar-min-width);
          position: relative;
        }
${Ft}
${Pt('.row[data-bar-animated="false"]')}
        .row[data-bar-animated="false"] .target-value-label,
        .row[data-bar-animated="false"] .peak-value-label,
        .row[data-bar-animated="false"] .floor-value-label,
        .row[data-bar-animated="false"] .generic-value-label {
          transition: none;
        }
        .row[data-bar-animated="false"] .target-value-label {
          transition: none;
        }

        .bar-inner-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 0 6px;
          pointer-events: none;
          z-index: 10;
        }
        .bar-inner-label[data-inside-density="compact"] {
          gap: 5px;
          padding: 0 5px;
        }
        .bar-inner-label[data-inside-density="tight"] {
          gap: 4px;
          padding: 0 4px;
        }
        .bar-inner-label[data-inside-density="dense"] {
          gap: 0;
          padding: 0 4px;
          justify-content: flex-end;
        }
        .bar-inner-label[data-inside-density="compressed"] {
          gap: 0;
          padding: 0 4px;
          justify-content: flex-end;
        }
        .bar-inner-label > span {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: #fff;
          font-size: var(--sbcp-inline-label-font-size);
          font-weight: 600;
          white-space: nowrap;
          padding: var(--sbcp-inline-label-padding-y) var(--sbcp-inline-label-padding-x);
          border-radius: 20px;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-inner-label .inside-name {
          flex: 0 1 auto;
          width: fit-content;
          max-width: 60%;
          display: inline-block;
        }
        .bar-inner-label[data-inside-density="compact"] .inside-name {
          max-width: 56%;
        }
        .bar-inner-label[data-inside-density="tight"] .inside-name {
          max-width: 48%;
        }
        .bar-inner-label[data-hide-name="true"] .inside-name,
        .bar-inner-label[data-priority-hide-name="true"] .inside-name {
          display: none;
        }
        .bar-inner-label .inside-value {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 100%;
          display: inline-flex;
          align-items: baseline;
        }
        .bar-inner-label .inside-value[data-hide-value="true"] {
          display: none;
        }
        .bar-inner-label[data-value-fit="compact"] {
          padding: 0 2px;
        }
        .bar-inner-label .inside-value[data-value-fit="compact"] {
          padding-left: 2px;
          padding-right: 2px;
        }
        .main-line.inside-mode[data-hide-inside-icon="true"] .bar-inner-label .inside-value,
        .main-line.inside-mode[data-priority-hide-inside-icon="true"] .bar-inner-label .inside-value,
        .bar-inner-label[data-hide-name="true"] .inside-value,
        .bar-inner-label[data-priority-hide-name="true"] .inside-value {
          max-width: 100%;
        }
        .bar-inner-label[data-inside-density="dense"] .inside-value,
        .bar-inner-label[data-inside-density="compressed"] .inside-value {
          max-width: 100%;
        }
        .bar-inner-label .inside-value-text {
          display: inline-flex;
          align-items: baseline;
          gap: 0;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          background: transparent;
          padding: 0;
          border-radius: 0;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .bar-inner-label .inside-value-text.has-unit {
          gap: 2px;
        }
        .bar-inner-label .inside-value-text.tight-unit {
          gap: 0;
        }
        .bar-inner-label .inside-number {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        .bar-inner-label .inside-unit {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.72);
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        .target-value-label {
          position: absolute;
          top: 100%;
          margin-top: 2px;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--marker-color, var(--secondary-text-color, #888));
          text-shadow:
            0 0 0.6px var(--marker-contrast-color),
            0 0 1.2px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent);
          background-color: var(--card-background-color, #fff);
          padding: 0 2px;
          border: 0;
          border-radius: 2px;
          box-shadow: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 8;
          visibility: hidden;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .peak-value-label,
        .floor-value-label,
        .generic-value-label {
          position: absolute;
          font-size: var(--sbcp-target-label-font-size);
          line-height: 1;
          color: var(--marker-color, var(--secondary-text-color, #888));
          text-shadow:
            0 0 0.6px var(--marker-contrast-color),
            0 0 1.2px color-mix(in srgb, var(--marker-contrast-color) 78%, transparent);
          background-color: var(--card-background-color, #fff);
          padding: 0 2px;
          border: 0;
          border-radius: 2px;
          box-shadow: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 8;
          visibility: hidden;
          transition: left 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .generic-value-label[data-show-marker="false"] {
          pointer-events: auto;
          cursor: pointer;
        }
        .peak-value-label {
          bottom: 100%;
          margin-bottom: 1px;
        }
        .floor-value-label {
          top: 100%;
          margin-top: 2px;
        }
        .generic-value-label[data-lane="above"] {
          bottom: 100%;
          margin-bottom: 1px;
        }
        .generic-value-label[data-lane="below"] {
          top: 100%;
          margin-top: 2px;
        }
        .target-value-label[data-marker-hovered="true"],
        .peak-value-label[data-marker-hovered="true"],
        .floor-value-label[data-marker-hovered="true"],
        .generic-value-label[data-marker-hovered="true"] {
          z-index: 11;
        }
        .above-line {
          display: grid;
          grid-template-columns: var(--sbcp-icon-width) minmax(0, 1fr);
          column-gap: var(--sbcp-main-gap);
          min-width: 0;
          align-items: flex-end;
        }
        .above-line[data-hide-above-icon="true"],
        .above-line[data-above-density="compressed"] {
          grid-template-columns: minmax(0, 1fr);
        }
        .above-bar-label[data-hide-name="true"] .above-bar-label-name,
        .above-bar-label[data-priority-hide-name="true"] .above-bar-label-name,
        .above-line[data-above-density="compressed"] .above-icon-spacer {
          display: none;
        }
        .above-line[data-hide-above-icon="true"] .above-icon-spacer {
          display: none;
        }
        .above-icon-spacer {
          width: var(--sbcp-icon-width);
          min-width: 0;
        }
        .above-bar-label {
          flex: 1;
          min-width: 0;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: var(--sbcp-main-gap);
          margin-bottom: 2px;
          min-height: 16px;
        }
        .above-bar-label[data-hide-name="true"],
        .above-bar-label[data-priority-hide-name="true"] {
          gap: 0;
        }
        .above-bar-label-name {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          line-height: 1.15;
        }
        .above-bar-label-value {
          flex: 0 0 auto;
          margin-left: auto;
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          text-align: right;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
        }
        .hero-line {
          --sbcp-hero-min-value-size: 10px;
          --sbcp-hero-base-size: 84px;
          --sbcp-hero-compact-size: clamp(50px, calc(var(--sbcp-hero-base-size) * 0.89), 100px);
          --sbcp-hero-tight-size: clamp(42px, calc(var(--sbcp-hero-base-size) * 0.75), 84px);
          --sbcp-hero-dense-size: clamp(29px, calc(var(--sbcp-hero-base-size) * 0.52), 58px);
          --sbcp-hero-compressed-size: clamp(21px, calc(var(--sbcp-hero-base-size) * 0.38), 43px);
          --sbcp-hero-xs-size: clamp(15px, calc(var(--sbcp-hero-base-size) * 0.26), 29px);
          --sbcp-hero-fit-tight-size: clamp(15px, calc(var(--sbcp-hero-base-size) * 0.26), 29px);
          --sbcp-hero-fit-minimum-size: 12px;
          min-width: 0;
          margin-bottom: 0;
        }

        .hero-line[data-hero-size="small"] {
          --sbcp-hero-base-size: 56px;
        }

        .hero-line[data-hero-size="large"] {
          --sbcp-hero-base-size: 112px;
        }
        .hero-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, auto);
          align-items: baseline;
          column-gap: var(--sbcp-main-gap);
          min-width: 0;
          overflow: hidden;
          margin-bottom: clamp(2px, calc(var(--sbcp-row-height) * 0.08), 4px);
        }
        .row[data-marker-label-lane-above="true"] .hero-header {
          margin-bottom: calc(clamp(2px, calc(var(--sbcp-row-height) * 0.08), 4px) + 4px);
        }
        .row[data-marker-label-lane-above="false"] .hero-header {
          margin-bottom: 0;
        }
        .hero-header[data-hide-name="true"] .hero-label,
        .hero-header[data-priority-hide-name="true"] .hero-label {
          display: none;
        }
        .hero-header[data-hide-name="true"],
        .hero-header[data-priority-hide-name="true"] {
          grid-template-columns: minmax(0, 1fr);
        }
        .hero-header[data-hide-name="true"] .hero-value,
        .hero-header[data-priority-hide-name="true"] .hero-value {
          grid-column: 1 / -1;
          justify-self: stretch;
          width: 100%;
        }
        .hero-label {
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          line-height: 1.15;
        }
        .hero-value {
          min-width: 0;
          max-width: 100%;
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          justify-self: end;
          overflow: hidden;
          font-size: var(--sbcp-hero-base-size);
          font-weight: 700;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          line-height: 0.95;
          text-align: right;
        }

        .hero-line[data-hero-density="compact"] .hero-value {
          font-size: var(--sbcp-hero-compact-size);
        }
        .hero-line[data-hero-density="tight"] .hero-value {
          font-size: var(--sbcp-hero-tight-size);
        }
        .hero-line[data-hero-density="dense"] .hero-value {
          font-size: var(--sbcp-hero-dense-size);
        }
        .hero-line[data-hero-density="compressed"] .hero-value {
          font-size: var(--sbcp-hero-compressed-size);
        }
        .hero-line[data-hero-density="xs"] .hero-value {
          font-size: var(--sbcp-hero-xs-size);
        }
        .hero-line[data-hero-value-fit="tight"] .hero-value {
          font-size: var(--sbcp-hero-fit-tight-size);
        }
        .hero-line[data-hero-value-fit="minimum"] .hero-value {
          font-size: var(--sbcp-hero-fit-minimum-size);
        }
        .hero-line[data-hero-value-fit="hidden"] .hero-value {
          display: none;
        }
        .hero-line[data-hide-hero-unit="true"] .hero-value .unit-group {
          display: none;
        }
        .hero-value .value-right-text {
          display: inline-flex;
          flex: 1 1 auto;
          justify-content: flex-end;
          gap: 4px;
          align-items: baseline;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
        }
        .hero-value .value-right-text.tight-unit {
          gap: 2px;
        }
        .hero-value .value-right-number {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          line-height: 0.95;
        }
        .hero-value .unit-group {
          flex: 0 0 auto;
          align-self: baseline;
          line-height: 1;
          overflow: visible;
          text-overflow: clip;
        }
        .hero-value .unit {
          font-size: clamp(10px, 0.42em, 16px);
          font-weight: 500;
          color: var(--secondary-text-color, #888);
          line-height: 1;
          overflow: visible;
          text-overflow: clip;
        }
${zt}
        .value-right {
          position: relative;
          z-index: 10;
          --sbcp-value-extra-width: 0px;
          flex: 0 0 calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          min-width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          max-width: calc(var(--sbcp-value-width) + var(--sbcp-value-extra-width));
          height: var(--sbcp-row-height);
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-text-color, #333);
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
          box-sizing: border-box;
          padding-right: 1px;
          min-width: 0;
        }
        .value-right-text {
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 0;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .main-line.off-mode .value-right {
          flex-shrink: 1;
        }
        .value-right-text.has-unit {
          gap: 2px;
        }
        .value-right-text.tight-unit {
          gap: 0;
        }
        .value-right-number {
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit-group,
        .top-right-value .unit-group,
        .above-bar-label-value .unit-group {
          flex: 0 1 auto;
          display: inline-flex;
          align-items: baseline;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          line-height: 1.1;
        }
        .value-right .unit,
        .top-right-value .unit,
        .above-bar-label-value .unit {
          flex: 0 1 auto;
          min-width: 0;
          display: inline-block;
          overflow: hidden;
          text-overflow: clip;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 400;
          color: var(--secondary-text-color, #888);
          line-height: 1.1;
        }
        .measure-layer {
          position: fixed;
          left: -9999px;
          top: -9999px;
          visibility: hidden;
          pointer-events: none;
          white-space: nowrap;
        }
      </style>

      <ha-card>
        <div class="card">
          <div class="card-title" style="display:none;"></div>
          <div class="rows"></div>
          <div class="measure-layer"></div>
        </div>
      </ha-card>
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==a||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=a,this._applyCompactTier(),a.observe(e),a.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,a){var l,s,o;if(a||!e||!t)return 0;let i=Math.floor((s=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?s:0),n=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(i,8)||!Number.isFinite(n)||n<=0?0:Math.min(n,i*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",a=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let i=["normal","compact","tight","dense","compressed"],n="normal";e<170?n="compressed":e<210?n="dense":e<255?n="tight":e<320&&(n="compact");let l=i.indexOf(n),s=Number.isFinite(a)?a<=44&&e>=205?2:a<=72&&e>=185?1:0:0;return i[Math.max(0,l-s)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var i,n;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(i=this.shadowRoot)==null?void 0:i.querySelector("ha-card"),a=(n=t==null?void 0:t.getBoundingClientRect().width)!=null?n:0;if(!this._isReliableWidth(a)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=e.getBoundingClientRect().width;if(!this._isReliableWidth(a)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(a,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let a=e.querySelector(".label-left-text"),i=((a==null?void 0:a.textContent)||"").trim(),n=a?this._measureTextWidthWithStyles(a,i)||a.scrollWidth:Number.POSITIVE_INFINITY,l=this._classifyLeftDensity(t,e.dataset.leftDensity,n);e.dataset.leftDensity=l})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var k,w,M,S,R,z;let t=e.closest(".bar-track"),a=e.closest(".main-line"),i=e.querySelector(".inside-name"),n=e.querySelector(".inside-value");if(!t||!i||!n)return;let l=this._decodeDataAttr(n.dataset.display||n.textContent||""),s=this._decodeDataAttr(n.dataset.unit||"");n.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(n,l,s,!1),u=this._measureInsideValueMarkupWidth(n,l,s,!0),d=(w=(k=a==null?void 0:a.getBoundingClientRect)==null?void 0:k.call(a).width)!=null?w:0,c=this._isReliableWidth(d)?this._classifyRowDensity(d,(M=a==null?void 0:a.dataset)==null?void 0:M.rowDensity):((S=a==null?void 0:a.dataset)==null?void 0:S.rowDensity)||"normal",p=(z=(R=a==null?void 0:a.querySelector)==null?void 0:R.call(a,".icon-wrap"))!=null?z:null,h=p?this._getLeftModeIconWidth(p,a)+this._getLeftModeGap(a):0,b=this._getLeftModeBarMinWidth(a),m=this._isReliableWidth(d)?Math.max(b,d-h):t.getBoundingClientRect().width,v=this._isReliableWidth(d)?Math.max(b,d):m+h,f=(i.textContent||"").trim(),y=this._measureTextWidthWithStyles(i,f)||i.scrollWidth,_=$=>{let I=c==="compressed"?"compressed":this._classifyInsideDensity($,o);e.dataset.insideDensity=I,e.dataset.valueFit="normal",n.dataset.valueFit="normal";let B=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),W=Math.max(0,$-B),D=!!s&&o>W,N=D?u:o,V="normal";N>W&&(V="compact",e.dataset.valueFit=V,n.dataset.valueFit=V,W=Math.max(0,$-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),N=this._measureInsideValueMarkupWidth(n,l,s,!0));let L=N>W,E=L?0:this._getNumericStyleValue(e,"gap",0),Z=Math.max(0,Math.min(W*(I==="compact"?.56:I==="tight"?.48:.6),W-(L?0:Math.ceil(N))-E)),H=I==="dense"||I==="compressed";if(f&&y>0){let q=this._getInsideUsefulNameWidth(i,f,y),P=this._measureVisibleLabelCharacters(i,f,Z);H=Z<q||y>Z+1&&P<Math.min(4,f.length)}return{density:I,valueFit:V,hideUnit:D,hideValue:L,hideName:H,rank:L?3:V==="compact"?2:D?1:0}},x=c==="dense"||c==="compressed",g=_(x?v:m);if(p&&!x){let $=_(v);($.rank<g.rank||$.rank===g.rank&&g.hideName&&!$.hideName)&&(x=!0,g=$)}e.dataset.insideDensity=g.density,e.dataset.valueFit=g.valueFit,e.dataset.hideName=g.hideName?"true":"false",n.dataset.valueFit=g.valueFit,n.dataset.hideUnit=g.hideUnit?"true":"false",n.dataset.hideValue=g.hideValue?"true":"false",a&&(a.dataset.hideInsideIcon=x?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var _,x,g,k,w,M,S,R,z,$,I,B,W,D,N;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let a=e.classList.contains("hero-line"),i=a?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,n="normal";if(i<90?n="xs":i<110?n="compressed":i<150?n="dense":i<210?n="tight":i<280&&(n="compact"),a){e.dataset.heroDensity=n,t.dataset.hideName=n==="dense"||n==="compressed"||n==="xs"?"true":"false",e.dataset.hideHeroIcon=n==="compressed"||n==="xs"?"true":"false";return}e.dataset.aboveDensity=n;let l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((_=s==null?void 0:s.dataset)==null?void 0:_.display)||""),u=this._decodeDataAttr(((x=s==null?void 0:s.dataset)==null?void 0:x.unit)||""),d=(g=e.closest)==null?void 0:g.call(e,".row"),c=(k=d==null?void 0:d.querySelector)==null?void 0:k.call(d,".main-line.above-mode"),p=((w=c==null?void 0:c.dataset)==null?void 0:w.rowDensity)||"normal",h=(S=(M=c==null?void 0:c.querySelector)==null?void 0:M.call(c,".icon-wrap"))!=null?S:null,b=(R=h==null?void 0:h.getBoundingClientRect)==null?void 0:R.call(h),m=h&&typeof getComputedStyle=="function"?getComputedStyle(h):null,v=!!h&&p!=="compressed"&&(m==null?void 0:m.display)!=="none"&&((z=b==null?void 0:b.width)!=null?z:0)>0&&(($=b==null?void 0:b.height)!=null?$:0)>0,f=n==="dense"||n==="compressed",y=!v;if(l&&s&&o){let V=(I=e.closest)==null?void 0:I.call(e,".row-stack"),L=(N=(D=(B=V==null?void 0:V.getBoundingClientRect)==null?void 0:B.call(V).width)!=null?D:(W=e.getBoundingClientRect)==null?void 0:W.call(e).width)!=null?N:i,E=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,Y=v?b.width:0,Z=E?this._getNumericStyleValue(e,"gap",0):0,H=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),q=Math.ceil(this._measureValueMarkupWidth(s,o,u,!1)+2),P=Math.ceil(this._measureValueMarkupWidth(s,o,u,!0)+2),O=(l.textContent||"").trim(),A=v&&Y>0?Y+Z:0,U=this._measureTextWidthWithStyles(l,O)||l.scrollWidth||0,G=Math.max(0,L-A-H),j=(re,ie=G)=>{let ne=Math.max(0,ie-re),pe=this._measureVisibleLabelCharacters(l,O,ne);return!this._shouldHideLeftLabel(O,U,ne,pe)},te=Math.max(0,L),Q=!1;q<=G&&j(q)?(f=!1,y=!v):q<=te?(f=!j(q,L-H),y=!0):P<=G&&j(P)?(f=!1,Q=!!u,y=!v):j(P,L-H)?(f=!1,y=!0,Q=!!u):(f=!0,y=!0,Q=!!u&&q>te),s.dataset.hideUnit=Q?"true":"false"}else s&&(s.dataset.hideUnit="false");t.dataset.hideName=f?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var s,o,u,d,c,p,h,b,m;let t=(s=e==null?void 0:e.closest)==null?void 0:s.call(e,".row"),a=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),i=(u=a==null?void 0:a.querySelector)==null?void 0:u.call(a,".main-line.hero-mode"),n=(d=i==null?void 0:i.querySelector)==null?void 0:d.call(i,".bar-wrap"),l=[(c=t==null?void 0:t.getBoundingClientRect)==null?void 0:c.call(t).width,(p=a==null?void 0:a.getBoundingClientRect)==null?void 0:p.call(a).width,(h=i==null?void 0:i.getBoundingClientRect)==null?void 0:h.call(i).width,(b=n==null?void 0:n.getBoundingClientRect)==null?void 0:b.call(n).width,(m=e==null?void 0:e.getBoundingClientRect)==null?void 0:m.call(e).width];for(let v of l)if(this._isReliableWidth(v,8))return v;return 0}_measureHeroValueWidth(e,t,a="normal",i=!1){var h,b,m,v,f,y,_,x,g,k,w,M,S,R;let n=(h=this.shadowRoot)==null?void 0:h.querySelector(".measure-layer");if(!n||!e||!t)return 0;let l=this._decodeDataAttr(t.dataset.display||t.textContent||""),s=this._decodeDataAttr(t.dataset.unit||"");if(!l)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=a,o.dataset.hideHeroUnit=i?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((m=(b=e.style)==null?void 0:b.getPropertyValue)==null?void 0:m.call(b,"--sbcp-hero-base-size"))||null);let u=document.createElement("span");u.className="hero-value",u.dataset.display=t.dataset.display||"",u.dataset.unit=t.dataset.unit||"",u.innerHTML=this._formatRightValueMarkup(l,s,i),u.style.display="inline-flex",u.style.flex="0 0 auto",u.style.width="auto",u.style.minWidth="0",u.style.maxWidth="none",u.style.justifyContent="flex-start",u.style.justifySelf="start",u.style.overflow="visible";let d=u.querySelector(".value-right-text");d&&(d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.overflow="visible");let c=u.querySelector(".value-right-number");c&&(c.style.flex="0 0 auto",c.style.minWidth="0",c.style.overflow="visible",c.style.textOverflow="clip");let p=u.querySelector(".unit-group");return p&&(p.style.flex="0 0 auto",p.style.minWidth="0",p.style.overflow="visible"),o.appendChild(u),n.replaceChildren(o),Math.max(Math.ceil((f=(v=u.getBoundingClientRect)==null?void 0:v.call(u).width)!=null?f:0),Math.ceil(u.scrollWidth||0),Math.ceil((x=(_=(y=d==null?void 0:d.getBoundingClientRect)==null?void 0:y.call(d).width)!=null?_:d==null?void 0:d.scrollWidth)!=null?x:0),Math.ceil((w=(k=(g=c==null?void 0:c.getBoundingClientRect)==null?void 0:g.call(c).width)!=null?k:c==null?void 0:c.scrollWidth)!=null?w:0),Math.ceil((R=(S=(M=p==null?void 0:p.getBoundingClientRect)==null?void 0:M.call(p).width)!=null?S:p==null?void 0:p.scrollWidth)!=null?R:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var h,b;let t=e.querySelector(".hero-header"),a=e.querySelector(".hero-label"),i=e.querySelector(".hero-value"),n=e.querySelector(".unit-group");if(!t||!i)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let l=Math.floor((b=(h=t.getBoundingClientRect)==null?void 0:h.call(t).width)!=null?b:0);if(!this._isReliableWidth(l,8)){this._schedulePostLayoutDensityPass();return}let s=!!n&&n.textContent.trim().length>0,o=t.dataset.hideName==="true",u=!o&&a?this._getNumericStyleValue(t,"column-gap",0):0,d=(m="normal",v=!1)=>this._measureHeroValueWidth(e,i,m,v),c=Math.max(0,l-u-4),p=Math.max(0,l-4);if(!this._isReliableWidth(p,8)){e.dataset.hideHeroUnit=s?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(d("normal",!1)<=c)&&!(!o&&a&&(t.dataset.priorityHideName="true",d("normal",!1)<=p))){if(s){for(let m of["tight","minimum"]){let v=d(m,!1);if(v<=p){if(e.dataset.heroValueFit=m,!o&&a){let f=(a.textContent||"").trim(),y=this._measureTextWidthWithStyles(a,f),_=Math.max(0,c-v);this._shouldHideLeftLabel(f,y,_,this._measureVisibleLabelCharacters(a,f,_))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",d("normal",!0)<=p)return}e.dataset.heroValueFit="tight",!(d("tight",s)<=p)&&(e.dataset.heroValueFit="minimum",!(d("minimum",s)<=p)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,a,i){var s;let n=(s=this.shadowRoot)==null?void 0:s.querySelector(".measure-layer");if(!n||!e)return 0;let l=e.cloneNode(!1);return l.removeAttribute("data-hide-unit"),l.style.removeProperty("--sbcp-value-extra-width"),l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.innerHTML=this._formatRightValueMarkup(t,a,i),n.replaceChildren(l),l.scrollWidth}_measureInsideValueMarkupWidth(e,t,a,i=!1){var o;let n=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!n||!e)return(e==null?void 0:e.scrollWidth)||0;let l=e.cloneNode(!1);l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.style.overflow="visible",l.style.textOverflow="clip",l.style.whiteSpace="nowrap",l.innerHTML=this._formatInsideValueMarkup(t,a,i),l.removeAttribute("data-hide-value");let s=document.createElement("div");return s.className="bar-inner-label",s.style.cssText="position:static;display:block;padding:0",s.appendChild(l),n.replaceChildren(s),l.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var n;let a=(n=this.shadowRoot)==null?void 0:n.querySelector(".measure-layer");if(!a||!e)return 0;let i=e.cloneNode(!1);return i.textContent=t,i.style.width="auto",i.style.minWidth="0",i.style.maxWidth="none",i.style.flex="0 0 auto",i.style.overflow="visible",i.style.textOverflow="clip",i.style.whiteSpace="nowrap",a.replaceChildren(i),i.scrollWidth}_measureVisibleLabelCharacters(e,t,a){if(!e||!t||!Number.isFinite(a)||a<=0)return 0;let i=this._measureTextWidthWithStyles(e,"..."),n=Math.max(0,a-i);if(n<=0)return 0;let l=0,s=t.length;for(;l<s;){let o=Math.ceil((l+s)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=n?l=o:s=o-1}return l}_shouldHideLeftLabel(e,t,a,i){return!e||!Number.isFinite(t)||!Number.isFinite(a)?!1:t>a+1&&i<5}_getInsideUsefulNameWidth(e,t,a=NaN){if(!t)return 0;let i=Number.isFinite(a)&&a>0?a:this._measureTextWidthWithStyles(e,t),n=t.slice(0,Math.min(5,t.length)),l=this._measureTextWidthWithStyles(e,n)+this._measureTextWidthWithStyles(e,"..."),s=Math.max(36,Math.min(44,l||0));return Math.min(i||s,s)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var c,p,h,b,m;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let i=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((h=(p=(c=e==null?void 0:e.ownerDocument)==null?void 0:c.defaultView)==null?void 0:p.getComputedStyle)==null?void 0:h.bind(e.ownerDocument.defaultView));if(!i)return;let n=i(e),l=parseFloat(n.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,s=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2),o=e.closest(".main-line"),u=s;if(o!=null&&o.classList.contains("off-mode")){let v=o.querySelector(".bar-wrap"),f=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(i(o).gap)||0,_=(m=(b=o.getBoundingClientRect)==null?void 0:b.call(o).width)!=null?m:0,x=parseFloat(i(v).minWidth)||0,g=f&&i(f).display!=="none",k=g?this._getLeftModeIconWidth(f,o):0,w=Math.max(0,_-x-y),M=w-(g?k+y:0),S=Math.ceil(this._measureValueMarkupWidth(e,t,a,!0)+2),R=g&&(s>M&&s<=w||S>M&&S<=w);o.dataset.hideOffIcon=R?"true":"false";let z=R?w:M;if(z>0){let $=s<=z?s:S;u=Math.min($,z)}}let d=Math.max(0,u-l);e.style.setProperty("--sbcp-value-extra-width",`${d}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var l,s,o,u;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!((l=e.classList)==null?void 0:l.contains("above-bar-label-value"))&&t){let d=(u=(o=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?o:e.clientWidth)!=null?u:0,c=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);i=a&&d>0?c>d:!1,e.dataset.hideUnit=i?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,a,i)&&(e.innerHTML=this._formatRightValueMarkup(t,a,i))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let l=this._formatInsideValueMarkup(t,a,i);e.innerHTML!==l&&(e.innerHTML=l)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,a=0){if(!e)return a;try{let i=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(i)?i:a}catch(i){return a}}_getLeftModeGap(e){var i;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.rowDensity)||"normal";return a==="tight"?7:a==="dense"||a==="compressed"?6:8}_getLeftModeBarMinWidth(e){var i;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.leftDensity)||"normal";return a==="compact"?52:a==="tight"?48:a==="dense"?44:a==="compressed"?40:56}_getLeftModeIconWidth(e,t){var l,s;let a=(l=e==null?void 0:e.getBoundingClientRect)==null?void 0:l.call(e).width;if(this._isReliableWidth(a,1))return a;let i=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(i))return i;let n=((s=t==null?void 0:t.dataset)==null?void 0:s.leftDensity)||"normal";return n==="compact"?26:n==="tight"?24:n==="dense"?23:n==="compressed"?22:28}_getReservedInlineValueWidth(e){var u,d,c;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),n=parseFloat(((d=(u=e.style)==null?void 0:u.getPropertyValue)==null?void 0:d.call(u,"--sbcp-value-extra-width"))||((c=e.style)==null?void 0:c["--sbcp-value-extra-width"])||"0"),l=Number.isFinite(n)?n:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),s=Math.max(0,i+l);if(!t)return s;let o=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);return Math.max(s,o)}_getStableLeftLabelMetrics(e,t=null){var b,m,v,f,y,_,x,g,k,w;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".label-left-text");if(!a||!i||!n)return null;let l=(m=t!=null?t:(b=a.getBoundingClientRect)==null?void 0:b.call(a).width)!=null?m:0,s=(n.textContent||"").trim(),o=this._measureTextWidthWithStyles(n,s)||n.scrollWidth||0,u=((v=a.dataset)==null?void 0:v.leftDensity)||"normal",d={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},c=(y=(f=this._config)==null?void 0:f.entities)==null?void 0:y.find(M=>{var S;return M.entity===((S=e.dataset)==null?void 0:S.entity)}),p=c&&(k=(g=(x=(_=this._resolve(c))==null?void 0:_.layout)==null?void 0:x.label)==null?void 0:g.width)!=null?k:100,h=l>0?Math.min(p,l*((w=d[u])!=null?w:d.normal)):Math.min(o,p);return{text:s,naturalWidth:o,maximumWidth:h,labelWidth:h,labelText:n}}_estimateLeftModeWidthBudget(e){var g,k,w;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let a=(k=(g=t.getBoundingClientRect)==null?void 0:g.call(t).width)!=null?k:0;if(!this._isReliableWidth(a))return null;let i=e.querySelector(".label-left"),n=e.querySelector(".icon-wrap"),l=e.querySelector(".value-right"),s=this._getStableLeftLabelMetrics(e,a),o=(w=s==null?void 0:s.labelWidth)!=null?w:0,u=n?this._getLeftModeIconWidth(n,t):0,d=this._getReservedInlineValueWidth(l),c=this._getLeftModeGap(t),p=this._getLeftModeBarMinWidth(t),h=!!i,b=!!n,m=b?2:1,v=Math.max(0,a-(b?u:0)-p-m*c),f=Math.min(o,v),y=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,f,this._measureVisibleLabelCharacters(s.labelText,s.text,f)),_=Math.min(o,Math.max(0,a-p-c)),x=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,_,this._measureVisibleLabelCharacters(s.labelText,s.text,_));return{rowWidth:a,gap:c,barMinWidth:p,labelSacrificialWithoutIcon:x,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(u,0)?u:0,valueWidth:this._isReliableWidth(d,0)?d:0,baseLabelVisible:h,labelSacrificial:y,hasIcon:b,mainLine:t,iconWrap:n,valueEl:l,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,a=null){let i=a||this._estimateLeftModeWidthBudget(e);if(!i)return null;let n=i.baseLabelVisible&&!t.hideLabel,l=i.hasIcon&&!t.hideIcon,s=!t.topValue,o=1+(l?1:0)+(n?1:0)+(s?1:0),u=Math.max(0,o-1),d=(l?i.iconWidth:0)+(n?i.labelWidth:0)+(s?i.valueWidth:0)+u*i.gap,c=Math.max(0,i.rowWidth-d),p=c>=i.barMinWidth,h=p?c:i.barMinWidth;return{rowWidth:i.rowWidth,barWidth:h,share:h/i.rowWidth,showLabel:n,showIcon:l,showInlineValue:s,reservedWidth:d,gapCount:u,fits:p}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,a){let i=null;for(let n of t){let l=this._predictLeftModeBarShareForState(e,n,a);l&&(i={...n,predicted:l})}return i}_chooseLeftModeResponsiveState(e,t=!0){var c,p,h,b;let a=this._estimateLeftModeWidthBudget(e);if(!a)return null;let i=this._getMinimumBarShare(),n=this._getLeftModeCandidateStates(a),l=(p=this._config.entities)==null?void 0:p[Number((c=e==null?void 0:e.dataset)==null?void 0:c.rowIndex)],s=l&&this._leftModeResponsiveHistory.has(l)?this._leftModeResponsiveHistory.get(l):((b=(h=a.rowStack)==null?void 0:h.dataset)==null?void 0:b.forceTopValue)==="true",o=n.filter(m=>m.topValue),u=this._getTopValueEnableShare(),d=this._getTopValueDisableShare();for(let m of n){let v=m.topValue||t?i:s?d:u,f=this._predictLeftModeBarShareForState(e,m,a);if(f!=null&&f.fits&&f.share>=v)return{...m,predicted:f}}return this._chooseFallbackPredictedLeftModeState(e,o,a)}_applyLeftModeResponsiveState(e,t){var s,o;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".row-stack"),n=e==null?void 0:e.querySelector(".label-left");if(!a||!i)return;let l=(o=this._config.entities)==null?void 0:o[Number((s=e==null?void 0:e.dataset)==null?void 0:s.rowIndex)];l&&this._leftModeResponsiveHistory.set(l,(t==null?void 0:t.topValue)===!0),delete i.dataset.forceTopValue,delete a.dataset.hideLeftIcon,n&&delete n.dataset.priorityHidden,t!=null&&t.hideLabel&&n&&(n.dataset.priorityHidden="true"),t!=null&&t.topValue&&(i.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(a.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".bar-track");if(!t||!a)return null;let i=t.getBoundingClientRect().width,n=a.getBoundingClientRect().width;return!this._isReliableWidth(i)||!this._isReliableWidth(n,1)?null:{rowWidth:i,barWidth:n,share:n/i,mainLine:t,track:a}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".row-stack"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".above-bar-label"),l=e==null?void 0:e.querySelector(".bar-inner-label"),s=e==null?void 0:e.querySelector(".above-line");a&&delete a.dataset.forceTopValue,i&&delete i.dataset.priorityHidden,n&&delete n.dataset.priorityHideName,l&&delete l.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let a=e.querySelector(".label-left");a&&(a.dataset.priorityHidden="true");return}if(t==="above"){let a=e.querySelector(".above-bar-label");a&&(a.dataset.priorityHideName="true");return}if(t==="inside"){let a=e.querySelector(".bar-inner-label");a&&(a.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let a=e.querySelector(".row-stack");a&&(a.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let a=e.querySelector(".main-line");if(a){if(t==="left"){a.dataset.hideLeftIcon="true";return}if(t==="above"){a.dataset.hideAboveIcon="true";let i=e.querySelector(".above-line");i&&(i.dataset.hideAboveIcon="true");return}t==="inside"&&(a.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,a){var n,l,s,o,u,d,c,p,h,b;let i=(o=(s=a==null?void 0:a.rowWidth)!=null?s:(l=(n=e==null?void 0:e.querySelector(".main-line"))==null?void 0:n.getBoundingClientRect)==null?void 0:l.call(n).width)!=null?o:0;if(!this._isReliableWidth(i))return null;if(t==="left"){let m=e.querySelector(".label-left"),v=e.querySelector(".label-left-text");if(!m||!v)return null;let f=(v.textContent||"").trim(),y=v.clientWidth,_=v.scrollWidth,x=this._measureVisibleLabelCharacters(v,f,y),g=(d=(u=m.getBoundingClientRect)==null?void 0:u.call(m).width)!=null?d:y;return{text:f,visibleWidth:y,fullWidth:_,visibleChars:x,labelWidth:g,rowWidth:i}}if(t==="above"){let m=e.querySelector(".above-bar-label-name");if(!m)return null;let v=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,_=this._measureVisibleLabelCharacters(m,v,f),x=(p=(c=m.getBoundingClientRect)==null?void 0:c.call(m).width)!=null?p:f;return{text:v,visibleWidth:f,fullWidth:y,visibleChars:_,labelWidth:x,rowWidth:i}}if(t==="inside"){let m=e.querySelector(".inside-name");if(!m)return null;let v=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,_=this._measureVisibleLabelCharacters(m,v,f),x=(b=(h=m.getBoundingClientRect)==null?void 0:h.call(m).width)!=null?b:f;return{text:v,visibleWidth:f,fullWidth:y,visibleChars:_,labelWidth:x,rowWidth:i}}return null}_isLabelWorthSacrificing(e,t,a){let i=this._getLabelSacrificeMetrics(e,t,a);return!i||!i.text?!1:this._shouldHideLeftLabel(i.text,i.fullWidth,i.visibleWidth,i.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let a=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),i=this._getMinimumBarShare();a.forEach(n=>{let l=n.querySelector(".main-line");if(!l)return;let s=l.classList.contains("left-mode")?"left":l.classList.contains("above-mode")?"above":l.classList.contains("inside-mode")?"inside":"other";if(s==="other")return;if(s==="left"){let u=!t||t.get(l)===l.getBoundingClientRect().width,d=this._chooseLeftModeResponsiveState(n,u);d&&this._applyLeftModeResponsiveState(n,d),u||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(n);let o=this._getMeasuredBarShare(n);!o||o.share>=i||this._isLabelWorthSacrificing(n,s,o)&&(this._hideMinimumBarShareLabel(n,s),o=this._getMeasuredBarShare(n),!o||o.share>=i)||(this._forceMinimumBarShareTopValue(n,s),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(n),!(!o||o.share>=i)&&this._hideMinimumBarShareIcon(n,s))})}_shouldUseTopValueRow(e){var t,a,i;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((i=(a=e.closest)==null?void 0:a.call(e,".row-stack"))==null?void 0:i.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,a){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(a)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),a=e.querySelector(".row-stack");if(!t)return;let i=parseFloat(e.dataset.baseHeight||"38")||38,n=e.dataset.heightExplicit==="true",l=this._getEffectiveRowHeight(i,n,t);e.style.setProperty("--sbcp-row-height",`${l}px`),a&&a.style.setProperty("--sbcp-row-height",`${l}px`),t.style.height=`${l}px`;let s=t.querySelector(".label-left");s&&(s.style.height=`${l}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${l}px`,o.style.minHeight=`${l}px`);let u=t.querySelector(".bar-track");u&&(u.style.height=`${l}px`);let d=t.querySelector(".value-right");d&&(d.style.height=`${l}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var c,p,h,b,m;let t=e.closest(".row-stack"),a=e.querySelector(".value-right"),i=t==null?void 0:t.querySelector(".top-right-value");if(!t||!a||!i)return;let n=this._shouldUseTopValueRow(e);t.dataset.topValue=n?"true":"false",i.dataset.active=n?"true":"false";let l=this._decodeDataAttr(a.dataset.display||""),s=this._decodeDataAttr(a.dataset.unit||"");i.dataset.display=a.dataset.display||"",i.dataset.unit=a.dataset.unit||"",i.dataset.hideUnit="false";let o=(m=(b=(h=(c=t.getBoundingClientRect)==null?void 0:c.call(t).width)!=null?h:(p=i.getBoundingClientRect)==null?void 0:p.call(i).width)!=null?b:i.clientWidth)!=null?m:0,u=l?Math.ceil(this._measureValueMarkupWidth(i,l,s,!1)+2):0,d=!!s&&o>0&&u>o;i.dataset.hideUnit=d?"true":"false",i.innerHTML=this._formatRightValueMarkup(l,s,d)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var s;let t=e.querySelector(".label-left"),a=e.querySelector(".label-left-text");if(!t||!a)return;let i=((s=e.closest)==null?void 0:s.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?a:null},n=this._getStableLeftLabelMetrics(i);if(!n)return;let l=this._measureVisibleLabelCharacters(n.labelText,n.text,n.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(n.text,n.naturalWidth,n.labelWidth,l)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var i;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let a=new Map([...((i=this.shadowRoot)==null?void 0:i.querySelectorAll(".main-line.left-mode"))||[]].map(n=>[n,n.getBoundingClientRect().width]));requestAnimationFrame(()=>{var l;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,a),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((l=this.shadowRoot)==null?void 0:l.querySelectorAll(".row[data-entity]"))||[]).forEach(s=>{this._positionTargetLabel(s),this._positionMarkerValueLabel(s,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(s,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(s)})})})}_isTightUnit(e){return Da(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(a){return t}}_parseColorToRgb(e){return ba(e)}_rgbToHsl({r:e,g:t,b:a}){return ar({r:e,g:t,b:a})}_getMarkerContrastColor(e){return xt(e)}_getEffectiveMarkerColor(e){return ve(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return Re(e)}_formatDisplayWithUnit(e,t){return Ta(e,t)}_formatRightValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="value-right-text"><span class="value-right-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="${this._isTightUnit(n)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${i}</span><span class="unit-group"><span class="unit">${l}</span></span></span>`}_formatAboveValueMarkup(e,t,a=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${a?"true":"false"}">${this._formatRightValueMarkup(e,t,a)}</span>`}_formatInsideValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="inside-value-text"><span class="inside-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="inside-value-text ${this._isTightUnit(n)?"tight-unit":"has-unit"}"><span class="inside-number">${i}</span><span class="inside-unit">${l}</span></span>`}_getRowMarkerModels(e,t,a,i,n,l,s,o){if(e!=null&&e.markers)return e.markers.map(p=>{var h,b;return p.type==="target"?{...p,position:n===void 0?p.position:n,visible:n!=null,color:o||p.color,label:(h=p.label)!=null?h:l===null?null:{text:l}}:p.type==="floor"||p.type!=="peak"?p:{...p,position:a===void 0?p.position:a,visible:a!=null&&t.peak_marker.show===!0,color:s||p.color,label:(b=p.label)!=null?b:i===null?null:{text:i}}});let u=aa({entityConfig:t,targetPosition:n,targetPresentation:l===null?null:{text:l},targetVisible:Number.isFinite(n),peakPosition:a,peakPresentation:i===null?null:{number:i},peakVisible:Number.isFinite(a)}),d=this._getMarkerModel(u,"target"),c=this._getMarkerModel(u,"peak");return d&&o&&(d.color=o),c&&s&&(c.color=s),u}_getMarkerModel(e,t){var a;return(a=e.find(i=>i.id===t||i.type===t))!=null?a:null}_renderMarker(e){return Fe(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),ze(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let a=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",a),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(a))}_buildRowViewModel(e,t,a){var n;let i=ft({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:a,extrema:(n=this._extrema.get(e))!=null?n:null,previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:i.min,max:i.max}),i}_buildRow(e,t,a,i,n,l,s,o,u,d,c,p,h,b=(v=>(v=(m=>(m=this._config.entities)==null?void 0:m.indexOf(e))())!=null?v:-1)()){var Pe,Ie,Ve,We,Ae,De,Te,Le,Be,qe,He,Oe,Ue,je,Ee,Ge,Ke,Xe,Je,Ye,Ze,Qe,Ce,et,tt,at;let f=this._resolve(e),y=(Ve=(Ie=(Pe=this._hass)==null?void 0:Pe.states)==null?void 0:Ie[e.entity])!=null?Ve:null;y&&this._updateExtrema(e,f,y);let _=y?this._buildRowViewModel(e,f,y):null,x=f.layout,g=f.bar,k=Number.isFinite(p)?p:0,w=Number.isFinite(h)?h:100,M=(We=_==null?void 0:_.baselinePercent)!=null?We:this._resolveBaselinePct(f,k,w),S=x.label.position,R=(De=(Ae=_==null?void 0:_.attributes)==null?void 0:Ae.baseHeight)!=null?De:x.height,z=(qe=(Be=(Te=_==null?void 0:_.name)!=null?Te:f.name)!=null?Be:(Le=y==null?void 0:y.attributes)==null?void 0:Le.friendly_name)!=null?qe:e.entity,$=ee((He=_==null?void 0:_.entityId)!=null?He:e.entity),I=ee(z),B=this._getRowMarkerModels(_,f,l,s,o,u,d,c),W=this._getMarkerModel(B,"target"),D=this._getMarkerModel(B,"peak"),N=this._getMarkerModel(B,"floor"),V=B.filter(C=>C.type==="generic"),L=(Oe=_==null?void 0:_.markerLaneOccupancy)!=null?Oe:ea(f),E=(Ue=_==null?void 0:_.markerLabelLaneOccupancy)!=null?Ue:ta(f),Y=(je=_==null?void 0:_.numericValue)!=null?je:this._getFiniteNumber(t),Z=(Ee=_==null?void 0:_.needle)!=null?Ee:this._getNeedleRenderState(Y,f,k,w,M),H=gt({percent:i,min:k,max:w,targetPercent:o,baselinePercent:M,needle:Z,markers:B},f,{height:"var(--sbcp-row-height)",color:n}),q=W!=null&&W.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite(W.position)?W.position:0}%;visibility:${W.visible&&((Ge=W.label)!=null&&Ge.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(W)}">
        ${(Ke=W.label)!=null&&Ke.text?ee(W.label.text):""}
      </div>`:"",P=D!=null&&D.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(D.position)?D.position:0}%;visibility:${D.visible&&((Xe=D.label)!=null&&Xe.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(D)}">
        ${D.visible&&((Je=D.label)!=null&&Je.text)?ee(D.label.text):""}
      </div>`:"",O=N!=null&&N.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(N.position)?N.position:0}%;visibility:${N.visible&&((Ye=N.label)!=null&&Ye.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(N)}">
        ${N.visible&&((Ze=N.label)!=null&&Ze.text)?ee(N.label.text):""}
      </div>`:"",A=V.filter(C=>C.labelVisible).map(C=>{var rt,it;return`
      <div class="generic-value-label" data-marker-id="${ee(C.id)}" data-lane="${C.lane}" data-show-marker="${C.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(C.position)?C.position:0}%;visibility:${C.visible&&((rt=C.label)!=null&&rt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(C)}">
        ${C.visible&&((it=C.label)!=null&&it.text)?ee(C.label.text):""}
      </div>`}).join(""),U=S==="above"?`
      <div class="above-line">
        ${f.icon&&f.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${I}</span>
          ${this._formatAboveValueMarkup(t,a,!1)}
        </div>
      </div>`:"",G=(Qe=x.hero.size)!=null?Qe:"small",j=x.hero.value_size,te=S==="hero"?`
      <div class="hero-line" data-hero-size="${G}"${Number.isFinite(j)?` style="--sbcp-hero-base-size:${j}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${I}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}">${this._formatRightValueMarkup(t,a,!1)}</span>
        </div>
      </div>`:"",Q=S==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${I}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,a,!1)}</span>
      </div>`:"",re=S==="left"?`<div class="label-left" style="flex:0 1 min(${x.label.width}px, var(--sbcp-left-label-share));max-width:min(${x.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${I}</span></div>`:"",ie=S!=="inside"&&S!=="above"&&S!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",ne=S==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",pe=f.icon&&f.icon!==!1?ee(f.icon):"",St=pe&&S!=="hero"?`<div class="icon-wrap"><ha-icon icon="${pe}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${b}" data-entity="${$}" data-base-height="${R}" data-height-explicit="${((et=(Ce=_==null?void 0:_.attributes)==null?void 0:Ce.heightExplicit)!=null?et:x.height_explicit)?"true":"false"}" data-bar-animated="${((at=(tt=_==null?void 0:_.attributes)==null?void 0:tt.barAnimated)!=null?at:g.animated)?"true":"false"}" data-marker-label-lane-above="${E.above?"true":"false"}" data-marker-label-lane-below="${E.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${R}px;">
          ${U}
          ${te}
          ${ne}
          <div class="main-line ${S}-mode" data-marker-lane-above="${L.above?"true":"false"}" data-marker-lane-below="${L.below?"true":"false"}" style="height:${R}px;">
            ${St}
            ${re}
            <div class="bar-wrap">
              ${_a(H,{insideContent:Q})}
              ${P}
              ${q}
              ${O}
              ${A}
            </div>
            ${ie}
          </div>
        </div>
      </div>`}_patchRow(e,t,a,i=null){var W,D,N,V,L,E,Y,Z,H,q;if(!e||!a)return;let n=this._resolve(t);this._updateExtrema(t,n,a);let l=this._rowScales.get(t),s=this._buildRowViewModel(t,n,a),o=s.min,u=s.max,d=s.percent,c=this._getColor(d,n,o,u),p=s.primaryPresentation.number,h=s.primaryPresentation.unit,b=s.baselinePercent,m=gt(s,n,{height:"var(--sbcp-row-height)",color:c}),v=(D=(W=i==null?void 0:i.states)==null?void 0:W[t.entity])!=null?D:null,f=v?ft({hass:i,cardConfig:this._config,entityConfig:n,entityState:v,extrema:(N=this._extrema.get(t))!=null?N:null,previousScale:l}):null,y=this._getRevealTransitionDuration(f&&Number.isFinite(f.numericValue)?{valuePercent:f.percent,baselinePercent:f.baselinePercent}:null,Number.isFinite(s.numericValue)?{valuePercent:d,baselinePercent:b}:null),_=(V=this._markerHover)==null?void 0:V.marker;if(_&&e.contains(_)){let P=m.markers.find(O=>O.type==="generic"?_.dataset.markerId===O.id:_.matches(`.${O.type}-marker`));P&&!P.visible&&this._clearMarkerHover(_)}fa(e,m,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",s.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",s.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",s.attributes.barAnimated?"true":"false");let x=e.querySelector(".value-right");x&&(x.dataset.display=this._encodeDataAttr(p),x.dataset.unit=this._encodeDataAttr(h),x.dataset.hideUnit="false",x.innerHTML=this._formatRightValueMarkup(p,h,!1));let g=e.querySelector(".top-right-value");g&&(g.dataset.display=this._encodeDataAttr(p),g.dataset.unit=this._encodeDataAttr(h),g.dataset.hideUnit="false",g.innerHTML=this._formatRightValueMarkup(p,h,!1));let k=e.querySelector(".bar-inner-label");if(k){let P=k.querySelector(".inside-value");P&&(P.dataset.display=this._encodeDataAttr(p),P.dataset.unit=this._encodeDataAttr(h),P.dataset.hideUnit="false",P.dataset.hideValue="false",P.innerHTML=this._formatInsideValueMarkup(p,h,!1))}let w=e.querySelector(".hero-header");if(w){let P=e.querySelector(".hero-line");this._setStyleIfChanged(P,"--sbcp-hero-base-size",Number.isFinite(n.layout.hero.value_size)?`${n.layout.hero.value_size}px`:null),w.innerHTML=`<span class="hero-label label-left-text">${ee(s.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(p)}" data-unit="${this._encodeDataAttr(h)}">${this._formatRightValueMarkup(p,h,!1)}</span>`}let M=w?null:e.querySelector(".above-bar-label");M&&(M.innerHTML=`<span class="above-bar-label-name label-left-text">${ee(s.name)}</span>${this._formatAboveValueMarkup(p,h,!1)}`);let S=e.querySelector(".target-value-label"),R=e.querySelector(".peak-value-label"),z=e.querySelector(".floor-value-label"),$=(L=s.markers)!=null?L:[];((Y=(E=e.querySelectorAll)==null?void 0:E.call(e,".generic-marker[data-marker-id]"))!=null?Y:[]).forEach(P=>{var G,j,te,Q,re;let O=P.dataset.markerId,A=this._getMarkerModel($,O),U=[...(j=(G=e.querySelectorAll)==null?void 0:G.call(e,".generic-value-label[data-marker-id]"))!=null?j:[]].find(ie=>ie.dataset.markerId===O);U&&(this._setDatasetIfChanged(U,"showMarker",(A==null?void 0:A.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(U,A),A!=null&&A.labelVisible&&A.visible&&((te=A.label)!=null&&te.text)?(this._setTextIfChanged(U,(re=(Q=A.label)==null?void 0:Q.text)!=null?re:null),this._setStyleIfChanged(U,"visibility","visible"),this._setStyleIfChanged(U,"left",`${Number.isFinite(A.position)?A.position:0}%`)):this._setStyleIfChanged(U,"visibility","hidden"))});let I=this._getMarkerModel($,"target");this._patchMarkerLabelAppearance(S,I),S&&(I!=null&&I.labelVisible&&I.visible&&((Z=I.label)!=null&&Z.text)?this._setTextIfChanged(S,(q=(H=I.label)==null?void 0:H.text)!=null?q:null):this._setStyleIfChanged(S,"visibility","hidden"));let B=(P,O)=>{var U,G,j;if(!P)return;let A=this._getMarkerModel($,O);this._patchMarkerLabelAppearance(P,A),A!=null&&A.labelVisible&&A.visible&&((U=A.label)!=null&&U.text)?(this._setTextIfChanged(P,(j=(G=A.label)==null?void 0:G.text)!=null?j:null),this._setStyleIfChanged(P,"visibility","visible"),this._setStyleIfChanged(P,"left",`${Number.isFinite(A.position)?A.position:0}%`)):this._setStyleIfChanged(P,"visibility","hidden")};B(R,"peak"),B(z,"floor")}_update(e=null){var s,o,u,d;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let a=this._config.entities,i=a.map(c=>!!this._hass.states[c.entity]),n=i.some((c,p)=>c!==this._rowPresence[p]);if(!this._rendered||n){this._rowGeneration+=1,this._rowPresence=i;let c="";for(let h=0;h<a.length;h++){let b=a[h],m=this._hass.states[b.entity];if(!m){c+=`<div class="row" data-row-index="${h}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${ee(b.entity)}</span></div>`;continue}let v=this._resolve(b);this._updateExtrema(b,v,m);let f=this._buildRowViewModel(b,v,m),y=f.min,_=f.max,x=f.percent,g=this._getColor(x,v,y,_),k=f.primaryPresentation.number,w=f.primaryPresentation.unit,M=f.targetPercent,S=(o=(s=f.targetPresentation)==null?void 0:s.text)!=null?o:null,R=f.peakPercent,z=(d=(u=f.peakPresentation)==null?void 0:u.number)!=null?d:null;c+=this._buildRow(b,k,w,x,g,R,z,M,S,v.peak_marker.color,v.target_marker.color,y,_,h)}this._clearMarkerHover(),t.innerHTML=c,this._rendered=!0;let p=t.querySelectorAll(".row[data-entity]");p.forEach(h=>{let b=a[Number(h.dataset.rowIndex)],m=b?this._hass.states[b.entity]:null;b&&m&&this._patchRow(h,b,m)}),this._runPostLayoutPasses(p),p.forEach(h=>{h.addEventListener("click",()=>{let b=h.dataset.entity,m=new CustomEvent("hass-more-info",{composed:!0,detail:{entityId:b}});this.dispatchEvent(m)})});return}let l=t.querySelectorAll(".row[data-entity]");for(let c of l){let p=a[Number(c.dataset.rowIndex)];if(!p)continue;let h=this._hass.states[p.entity];h&&this._patchRow(c,p,h,e)}this._runPostLayoutPasses(l)}}});function ir(r,e={}){let t=e.above?10:0,a=e.below?10:0,i=Math.max(0,r-t-a);return{above:t,below:a,railHeight:i,aboveY:0,belowY:r-9,compactGlyphs:t>0||a>0}}function si(r,e,t){let a=[];for(let i of["above","below"]){let n=r.filter(l=>{var s,o;return l.lane===i&&l.visible&&l.labelVisible&&Number.isFinite(l.position)&&((o=(s=l.label)==null?void 0:s.text)==null?void 0:o.trim())}).map(l=>({marker:l,anchor:Math.max(0,Math.min(100,l.position))*e/100})).sort((l,s)=>l.anchor-s.anchor);n.forEach(({marker:l,anchor:s},o)=>{var v;let u=o?(n[o-1].anchor+s)/2+2:0,d=o+1<n.length?(s+n[o+1].anchor)/2-2:e,c=Math.max(0,d-u),p=l.label,h=p.text,b="full",m=t(h)+4;if(m>c&&(h=[p.showValue!==!1?p.number:"",p.showUnit!==!1?p.unit:""].filter(Boolean).join(" "),b="value",m=h?t(h)+4:1/0,!h&&!p.number&&!p.unit)){let f=Array.from((v=p.semanticText)!=null?v:"");for(;f.length>=3;){if(h=`${f.join("").trimEnd()}\u2026`,m=t(h)+4,m<=c){b="text";break}f.pop()}}!h||m>c||e<=0?a.push({id:l.id,lane:i,mode:"hidden",text:"",left:0,width:0}):a.push({id:l.id,lane:i,mode:b,text:h,left:Math.max(u,Math.min(s-m/2,d-m)),width:m})})}return a}var oi=ae(()=>{});function ui(r,e){return le(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var kt,di=ae(()=>{Nt();fe();Xt();Aa();La();ma();rr();wa();Vt();Zt();na();oi();kt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._extrema={},this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static async getConfigElement(){return $t("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!le(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._requestUpdate()}get hass(){return this._hass}set context(e){this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._requestUpdate()}disconnectedCallback(){this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var l,s,o,u,d,c,p,h;let e=((l=this._config)==null?void 0:l.entity)||((s=this._context)==null?void 0:s.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._extrema={},this._scaleHistory=null,this._sampleState=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?Kt({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e,...this._config.attribute!==void 0?{attribute:this._config.attribute}:{}}]:[]}):null,this._diagnostics=Yt(this._normalized));let t=pt(this._hass,e,(d=(u=(o=this._normalized)==null?void 0:o.entities)==null?void 0:u[0])==null?void 0:d.attribute),a=t.stateObj,i=null,n=this._config?e?this._hass?a?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured";if(a&&((c=this._normalized)!=null&&c.entities[0])){let b=this._normalized.entities[0],m=t.available&&t.attributeFound?T(t.value):null;if(m!==null&&(a!==this._sampleState||m!==this._sampleValue)){this._sampleState=a,this._sampleValue=m;let v=(p=a.last_updated)!=null?p:a.last_changed,f=v instanceof Date?v.getTime():Date.parse(String(v!=null?v:"")),y=Number.isFinite(f)?f:Date.now();for(let _ of["peak","floor"]){let x=b[`${_}_marker`];x.show&&(this._extrema[_]=It(this._extrema[_],m,(h=x.reset)!=null?h:{kind:"never"},_==="peak"?"max":"min",y))}}i=ft({hass:this._hass,entityConfig:b,entityState:a,extrema:this._extrema,previousScale:this._scaleHistory}),this._scaleHistory={min:i.min,max:i.max},i.numericValue===null&&(n=a.state==="unknown"?"Unknown":a.state==="unavailable"?"Unavailable":"Not numeric")}this._row=i,this._status=n,this._render(i,n),this._previousRow=n?null:i}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${Ft}
        ${zt}
        ${Pt('.surface[data-bar-animated="false"]')}
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          height: var(--feature-height, 42px);
        }
        .surface {
          position: relative; height: 100%; min-width: 0;
          --label-above: 0px; --label-below: 0px;
          --sbcp-row-height: calc(var(--feature-height, 42px) - var(--label-above) - var(--label-below));
        }
        #bar { position: absolute; top: var(--label-above); width: 100%; }
        .compact-labels { font: inherit; font-size: 9px; line-height: 9px; letter-spacing: normal; pointer-events: none; }
        .compact-marker-label {
          position: absolute; top: 0; height: 9px; padding: 0 2px; box-sizing: border-box;
          color: var(--marker-color); white-space: nowrap; overflow: hidden;
          pointer-events: none;
        }
        .compact-marker-label[data-lane="below"] { top: auto; bottom: 0; }
        .surface[data-bar-animated="false"] .compact-marker-label { transition: none !important; }
        /* Any reserved label lane caps all glyphs. Uniform scaling preserves shape and edge anchoring. */
        .surface[data-compact-glyphs="true"] .marker-shape-svg { transform: translateX(-50%) scale(0.5); }
        .surface[data-compact-glyphs="true"] :is(.peak-inset, .target-inset, .floor-inset) {
          transform: translateX(-50%) scale(calc(8 / 14)); transform-origin: 50% 100%;
        }
        .surface[data-compact-glyphs="true"] .peak-inset { transform-origin: 50% 0; }
        .surface[data-compact-glyphs="true"] :is(.peak-outset, .target-outset, .floor-outset) {
          transform: translateX(-50%) scale(0.8); transform-origin: 50% 0;
        }
        .surface[data-compact-glyphs="true"] .peak-outset { transform-origin: 50% 100%; }
        .bar-track {
          border-radius: var(--feature-border-radius, 12px);
          background: var(--secondary-background-color, #e8e8e8);
          background: color-mix(in srgb, var(--feature-color, var(--primary-color, #4a9eff)) 12%, var(--secondary-background-color, #e8e8e8));
        }
        .surface .bar-track *, .surface .marker-shape-svg path[data-shape] { pointer-events: none; }
        [hidden] { display: none !important; }
        .status {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          overflow: hidden;
          padding: 0 4px;
          box-sizing: border-box;
          border-radius: var(--feature-border-radius, 12px);
          background: var(--secondary-background-color, #e8e8e8);
          color: var(--secondary-text-color, #888);
          font: inherit;
          font-size: 12px;
        }
        @media (prefers-reduced-motion: reduce) {
          .surface *, .surface *::before, .surface *::after { transition: none !important; animation: none !important; }
        }
      </style>
      <div id="surface" class="surface" role="img">
        <div id="bar" aria-hidden="true" hidden></div>
        <div id="labels" class="compact-labels" aria-hidden="true"></div>
        <div id="status" class="status" aria-hidden="true"></div>
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var d,c;this._ensureDom(),typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!t,this._statusEl.hidden=!t,this._statusEl.textContent=t!=null?t:"",this._surface.dataset.state=t?"unavailable":"numeric";let a=(d=e==null?void 0:e.markerLabelLaneOccupancy)!=null?d:{},i=ir(0,a);J(this._surface,"--label-above",`${i.above}px`),J(this._surface,"--label-below",`${i.below}px`),this._syncLabels(e,t);let n=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",l=((c=e==null?void 0:e.markers)!=null?c:[]).filter(p=>p.visible&&(p.showMarker||p.labelVisible)).map(p=>{var m;let h=p.type==="generic"?"Reference marker":`${p.type[0].toUpperCase()}${p.type.slice(1)}`,b=`${ce(p.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${h} at ${b}${p.labelVisible&&((m=p.label)!=null&&m.text)?`; label ${p.label.text}`:""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${n}${this._entity&&n!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:`${n} (${this._entity}): ${e.primaryPresentation.text}. Range ${ce(e.min)} to ${ce(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${l?` ${l}`:""}`),t)return;let s=gt(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});s.animated=s.animated&&!!this._previousRow,this._surface.dataset.barAnimated=s.animated?"true":"false";let o=JSON.stringify(s),u=JSON.stringify([s.baseline.configured,s.needle.configured,s.markers.map(p=>[p.type,p.id])]);u!==this._structureKey?(this._bar.innerHTML=_a(s),this._structureKey=u):o!==this._barRenderKey&&fa(this._bar,s,{revealDuration:ha(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=o,this._labelAnimated=s.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var l,s,o;let a=((l=e==null?void 0:e.markers)!=null?l:[]).filter(u=>u.labelVisible),i=new Set(a.map(u=>u.id));for(let[u,d]of this._labelNodes)i.has(u)||(d.remove(),this._labelNodes.delete(u));for(let u of a){if(!this._labelNodes.has(u.id)){let c=document.createElement("span");c.className="compact-marker-label",c.dataset.markerId=u.id,c.hidden=!0,this._labels.append(c),this._labelNodes.set(u.id,c)}let d=this._labelNodes.get(u.id);d.dataset.lane=u.lane,J(d,"--marker-color",ve(u))}if(this._labels.hidden=!!t,!(((s=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:s.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let u=this._labelFonts;u.ready.then(()=>{this._labelFonts===u&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var s,o,u,d;let{width:e,height:t}=this._surface.getBoundingClientRect(),a=ir(t,(s=this._row)==null?void 0:s.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(a.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let i=si((d=(u=this._row)==null?void 0:u.markers)!=null?d:[],e,c=>this._labelMeasure.measureText(c).width),n=JSON.stringify([e,t,a.above,a.below,this._labelMeasure.font,i.map(c=>[c.id,c.lane,c.mode,c.width])]),l=this._labelAnimated&&!this._snapLabels&&n===this._labelLayoutKey;for(let c of this._labelNodes.values())c.hidden=!0;for(let c of i){let p=this._labelNodes.get(c.id);p.hidden=c.mode==="hidden",p.dataset.mode=c.mode,p.textContent!==c.text&&(p.textContent=c.text),J(p,"transition",l?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),J(p,"left",`${c.left}px`),J(p,"width",`${c.width}px`)}this._labelLayoutKey=n,this._snapLabels=!1}}});var Xi=mi(()=>{li();di();Nt();qr(wt,kt);for(let[r,e]of[["sensor-bar-card-plus",wt],["sensor-bar-card-plus-feature",kt]])customElements.get(r)||customElements.define(r,e);window.customCards=window.customCards||[];window.customCards.some(r=>r.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(r=>r.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:ui,configurable:!0})});export default Xi();
