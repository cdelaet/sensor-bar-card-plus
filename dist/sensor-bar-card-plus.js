var ae=(r,e,t)=>()=>{if(t)throw t[0];try{return r&&(e=r(r=0)),e}catch(a){throw t=[a],a}};var si=(r,e)=>()=>{try{return e||r((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function Ir(r,e){ba=[r,e]}function ma(){if(!ba||ui.some((r,e)=>customElements.get(r)!==ba[e]))throw new Error(pa);if(it&&rt.some((r,e)=>customElements.get(r)!==it[e]))throw new Error(pa)}async function hi(){if(!Nr)throw new Error("Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.");let r=new URL(oi,import.meta.url);r.searchParams.set("sbcp_build",di),Pr++&&r.searchParams.set("sbcp_retry","1");let e;try{e=await import(r.href)}catch(a){throw new Error(ci)}if(e.buildIdentity!==Nr)throw new Error(Fr);ma();let t=[e.SensorBarCardPlusEditor,e.SensorBarCardPlusFeatureEditor];if(t.some(a=>typeof a!="function"||!(a.prototype instanceof HTMLElement))||t[0]===t[1])throw new Error(Fr);if(rt.some((a,i)=>{let n=customElements.get(a);return n&&(!it||n!==it[i]||n!==t[i])}))throw new Error(pa);for(let a=0;a<rt.length;a++)customElements.get(rt[a])||customElements.define(rt[a],t[a]);it=t}async function St(r){if(ma(),!kt){if(Pr>=2)throw zr;kt=hi().catch(e=>{throw zr=e,kt=void 0,e})}return await kt,ma(),document.createElement(r)}var Nr,oi,di,rt,ui,Fr,pa,ci,ba,it,kt,Pr,zr,Mt=ae(()=>{Nr="fa095f2b61612cc029cc4c7c89225b6ad7d6fc44d61cecbeb0eabe8de8ba51d6",oi="./sensor-bar-card-plus-editor.js",di="99729fd324d0333441ae0a5610ac2507e068de12de1571fe1b2c70e16334b4de",rt=["sensor-bar-card-plus-editor","sensor-bar-card-plus-feature-editor"],ui=["sensor-bar-card-plus","sensor-bar-card-plus-feature"],Fr="Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.",pa="Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.",ci="Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.",Pr=0});function Nt(r){return`
        ${r} .bar-fill-reveal,
        ${r} .needle-marker,
        ${r} .target-marker,
        ${r} .peak-marker,
        ${r} .floor-marker,
        ${r} .generic-marker,
        ${r} .baseline-indicator {
          transition: none;
        }
`}var Rt,$t,fa=ae(()=>{Rt=`
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
`,$t=`
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

`});function pi(r,e){if(!(r instanceof Date)||Number.isNaN(r.getTime()))return null;let t=r.getFullYear(),a=r.getMonth(),i=r.getDate(),n=r.getHours();if(e==="quarterly")return new Date(t,a,i,n,Math.floor(r.getMinutes()/15)*15,0,0).getTime();if(e==="hourly")return new Date(t,a,i,n,0,0,0).getTime();if(e==="daily")return new Date(t,a,i,0,0,0,0).getTime();if(e==="weekly"){let l=(r.getDay()+6)%7;return new Date(t,a,i-l,0,0,0,0).getTime()}return e==="monthly"?new Date(t,a,1,0,0,0,0).getTime():e==="yearly"?new Date(t,0,1,0,0,0,0).getTime():null}function Wr(r){if(r===void 0&&(r="never"),typeof r!="string")return{kind:"never"};let e=r.trim().toLowerCase();if(e==="never")return{kind:"never"};if(Vr.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let a=Number(t[1]),i=t[2];return!Number.isInteger(a)||a<1||i==="m"&&a>59||i==="h"&&a>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:a}:{kind:"duration",hours:a}}function Ar(r){if(typeof r!="string")return!1;let e=r.trim().toLowerCase();if(e==="never"||Vr.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let a=Number(t[1]);return Number.isInteger(a)&&a>=1&&(t[2]==="m"?a<=59:a<=23)}function Dr(r,e){if((r==null?void 0:r.kind)!=="calendar")return null;let t=pi(new Date(e),r.unit);return Number.isFinite(t)?String(t):null}function bi(r){return(r==null?void 0:r.kind)!=="duration"?null:Number.isInteger(r.minutes)?r.minutes*60*1e3:Number.isInteger(r.hours)?r.hours*60*60*1e3:null}function _a(r,e,t){return(e==null?void 0:e.kind)==="duration"?{value:r,startedAtMs:Number.isFinite(t)?t:null,windowKey:null}:(e==null?void 0:e.kind)==="calendar"?{value:r,startedAtMs:null,windowKey:Dr(e,t)}:{value:r,startedAtMs:null,windowKey:null}}function Ft(r,e,t,a,i){if(!Number.isFinite(e))return r!=null?r:null;let n=bi(t);if(!r||n!==null&&Number.isFinite(r.startedAtMs)&&Number.isFinite(i)&&i-r.startedAtMs>=n)return _a(e,t,i);if((t==null?void 0:t.kind)==="calendar"){let s=Dr(t,i);if(s!==null&&s!==r.windowKey)return _a(e,t,i)}return(a==="min"?e<r.value:e>r.value)?{...r,value:e}:r}var Vr,zt=ae(()=>{Vr=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function J(r,e,t=null){let a={fixed:r!=null?r:null,entity:e!=null?e:null};return Number.isFinite(t)&&(a.percent=t),a}function re(r){return typeof r=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(r.trim())}function me(r){if(typeof r!="string")return null;let e=r.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function T(r){if(typeof r=="number")return Number.isFinite(r)?r:null;if(typeof r=="string"){let e=r.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function be(r,e=null,t=null,a={}){var l,s,o,d,u,c;let{allowPercent:i=!1}=a,n=e!=null?e:J(t,null);if(r===void 0)return{...n};if(r===null)return J(null,null);if(typeof r=="object"&&!Array.isArray(r)){let p=(s=(l=r.fixed)!=null?l:r.value)!=null?s:null,h=(o=r.entity)!=null?o:null,b=i?T(r.percent):null;return J(p,h,b)}if(re(r))return J((u=(d=n.fixed)!=null?d:t)!=null?u:null,r,(c=n.percent)!=null?c:null);if(i){let p=me(r);if(Number.isFinite(p))return J(null,null,p)}return J(r,null)}function mi(r){var e;return!!r&&(T((e=r.fixed)!=null?e:r.value)!==null||Number.isFinite(r.percent)||!!r.entity)}function Br(r,e){var a,i,n,l;let t={above:((a=e==null?void 0:e.peak_marker)==null?void 0:a.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&mi((l=e==null?void 0:e.target_marker)==null?void 0:l.source)?1:0)};return r.map(s=>{let o=s.valid&&t[s.lane]<4;return o&&(t[s.lane]+=1),{...s,accepted:o}})}function qr(r,e=null){if(!Array.isArray(r))return{markers:[],invalidList:r!==void 0};let t=r.map((a,i)=>{var R;if(!a||typeof a!="object"||Array.isArray(a))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=a.at,l=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),s=typeof n=="string"?n.trim():n,o=be(s,null,null,{allowPercent:!0}),d=n&&typeof n=="object"&&n.entity!==void 0?n.entity:typeof s=="string"&&re(s)?s:null,u=d!=null&&d!==""&&!re(d),c=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&T(n.fixed)===null,p=!!o.entity||T(o.fixed)!==null||Number.isFinite(o.percent),h=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),b=n!=null&&!l&&!u&&!c&&p&&!h,m=a.lane===void 0?"below":a.lane,_=m==="above"||m==="below",f=["circle","diamond","triangle","chevron","arrow","pin"],y=a.shape===void 0||f.includes(a.shape),v=ot(a.direction),x=a.direction!==void 0&&!["inward","outward"].includes(typeof a.direction=="string"?a.direction.trim().toLowerCase():""),w=a.label&&typeof a.label=="object"&&!Array.isArray(a.label)?a.label:{},k=At(w),S=w.entity,M=typeof S=="string"?S.trim():"",g=S!=null&&S!==""&&!re(M),N=M&&re(M)?M:null,D=typeof a.show_marker=="boolean"?a.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:_?m:null,shape:y&&(R=a.shape)!=null?R:"circle",direction:v,invalidDirection:x,showMarker:D,invalidShowMarker:a.show_marker!==void 0&&typeof a.show_marker!="boolean",color:typeof a.color=="string"&&a.color.trim()?a.color:"#888888",label:{show:w.show===!0,text:k.label_text,entity:N,showValue:k.label_show_value,showUnit:k.label_show_unit,precision:k.label_precision,invalidShow:k.label_invalid_show,invalidText:k.label_invalid_text,invalidShowValue:k.label_invalid_show_value,invalidShowUnit:k.label_invalid_show_unit,invalidPrecision:k.label_invalid_precision,invalidPrecisionKey:k.label_precision_key,unsupportedUnit:k.label_unsupported_unit,invalidEntity:g},valid:b&&_,invalidSource:!b,invalidPercentage:h,unsupportedPercentField:l,invalidLane:!_,invalidShape:!y,accepted:!1}});return{markers:Br(t,e),invalidList:!1}}function ve(r,e=null){var a;let t=e!=null?e:{color:null};return r===void 0?{...t}:r===null?{color:null}:typeof r=="object"&&!Array.isArray(r)?{color:(a=r.color)!=null?a:null}:{color:r}}function lt(r){return r===!0?!0:r===!1?!1:null}function Dt(r,e){var n;let t=e==null?void 0:e.baseline,a=r==null?void 0:r.baseline,i={enabled:lt(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:J(null,null),above:ve(void 0,t==null?void 0:t.above),below:ve(void 0,t==null?void 0:t.below)};return a===void 0?i:a===null?{enabled:null,at:J(null,null),above:{color:null},below:{color:null}}:typeof a!="object"||Array.isArray(a)?{enabled:i.enabled,at:be(a,i.at,null),above:i.above,below:i.below}:{enabled:(n=lt(a.enabled))!=null?n:i.enabled,at:be(a.at,i.at,null,{allowPercent:!0}),above:ve(a.above,i.above),below:ve(a.below,i.below)}}function fi(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function It(r){if(!Array.isArray(r))return null;let e=r.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var a;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(a=t.label)!=null?a:null}});return fi(e,100)}function Tr(r,e=null){var a;if(r===void 0)return{value:null,issue:null};if(r===null)return{value:null,issue:"malformed"};if(r&&typeof r=="object"&&!Array.isArray(r)){if(r.entity!==void 0&&r.entity!==null&&r.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(r,"percent")){let n=T(r.percent);return Number.isFinite(n)?{value:J(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=T((a=r.fixed)!=null?a:r.value);return Number.isFinite(i)?{value:J(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof r=="string"){let i=r.trim();if(re(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=me(i);return Number.isFinite(n)?{value:J(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=T(r);return Number.isFinite(t)?e==="percent"?{value:J(null,null,t),issue:null}:{value:J(t,null),issue:null}:{value:null,issue:"malformed"}}function nt(r,e={}){if(!Array.isArray(r))return null;let{legacySegmentSpace:t=null}=e,a=r.map(i=>{var s,o;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:Tr(i.from,t),l=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:Tr(i.to,t);return i!=null&&i.color?{from:n.value,to:l.value,invalidBoundary:(s=n.issue)!=null?s:l.issue,color:i.color,label:(o=i.label)!=null?o:null}:null}).filter(Boolean);return a.map((i,n)=>{var s;let l=a.slice(n+1).find(o=>!o.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:l!=null&&l.from?{...l.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(s=i.label)!=null?s:null}})}function Vt(r,e,t,a){var m,_,f,y,v,x,w,k,S,M;let i=e==null?void 0:e.scale,n=r==null?void 0:r.scale,l=`${t}_entity`,s=i==null?void 0:i[t],o=s?J((_=(m=s.fixed)!=null?m:s.value)!=null?_:null,(f=s.entity)!=null?f:null):J((y=e==null?void 0:e[t])!=null?y:a,(v=e==null?void 0:e[l])!=null?v:null),d=s?s.fixed_explicit!==!1&&s.fixed!==null&&s.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,u=(g,N)=>(Object.defineProperty(g,"fixed_explicit",{value:N}),g);if((n==null?void 0:n[t])!==void 0){let g=n[t],N=re(g)?d:typeof g=="object"&&g!==null?((x=g.fixed)!=null?x:g.value)!==null&&((w=g.fixed)!=null?w:g.value)!==void 0:g!==null;return u(be(n[t],o,a),N)}let c=r[l],p=c!=null,h=(S=(k=r[t])!=null?k:p?null:o.fixed)!=null?S:o.entity?null:a,b=(M=c!=null?c:o.entity)!=null?M:null;return u(J(h,b),r[t]!==null&&r[t]!==void 0||!p&&d)}function Tt(r,e){return{min:Vt(r,e,"min",0),max:Vt(r,e,"max",100)}}function ya(r){switch(r){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function dt(r){switch(r){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function Wt(r,e){return r!=null&&Object.prototype.hasOwnProperty.call(r,e)}function _i(r){return[Wt(r,"color")?r.color:void 0,Wt(r==null?void 0:r.bar,"color")?r.bar.color:void 0].some(t=>t!=null)}function st(r){let e=r==null?void 0:r.bar,t=[[r,"color_mode"],[e,"color_mode"],[e,"fill_style"],[r,"severity"],[r,"segments"],[e,"segments"],[r,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:_i(r),paint:t.some(([a,i])=>Wt(a,i))}}function ye(r=null,e=null){var n,l,s,o,d,u;let t=(n=r==null?void 0:r.fill_style)!=null?n:null,a=(s=(l=r==null?void 0:r.color_mode)!=null?l:e)!=null?s:null,i=(d=(o=ya(t))!=null?o:a)!=null?d:"severity";return{fill_style:(u=t!=null?t:dt(i))!=null?u:"bands",color_mode:i}}function ga(r,e,t,a,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:l=!1}={}){let s=(i==null?void 0:i.color)===!0&&i.paint!==!0,o=(n==null?void 0:n.paint)===!0;return s&&(l||!o)?ye({fill_style:"solid"},null):(r==null?void 0:r.fill_style)!==void 0||(r==null?void 0:r.color_mode)!==void 0||e.color_mode!==void 0?ye(r,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(a==null?void 0:a.color_mode)!==void 0?ye(t,a==null?void 0:a.color_mode):ye(null,null)}function wa(r){return Array.isArray(r)?r.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=me(e.pos),a=Number.isFinite(t)?t:T(e.pos);return{...e,pos:Number.isFinite(a)?a:e.pos}}):r!=null?r:null}function ka(r,e=null){var a,i,n,l;let t=e?{show:(a=e.show)!=null?a:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return r===void 0?{...t}:typeof r=="boolean"?{show:r,color:"#ffffff"}:r&&typeof r=="object"&&!Array.isArray(r)?{show:(n=r.show)!=null?n:t.show,color:(l=r.color)!=null?l:t.color}:{...t}}function Lt(r,e,t={}){var k,S,M,g,N,D,R,V,W,$,A,I,L,B,q,H,Z,j,G,z,O,P,U,K,E,te,X;let a=(k=t.scopeExplicitness)!=null?k:st(r),i=(M=(S=t.inheritedExplicitness)!=null?S:e==null?void 0:e[xa])!=null?M:st(e),n=(g=t.isCardScope)!=null?g:e==null,l=e==null?void 0:e.bar,s=r==null?void 0:r.bar,o=Wt(l,va)?l[va]:["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:null,d=["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:o,u=s==null?void 0:s.segments,c=r.segments,p=r.severity,h=(N=l==null?void 0:l.segments)!=null?N:null,b=(D=e==null?void 0:e.segments)!=null?D:null,m=(R=e==null?void 0:e.severity)!=null?R:null,_=null,f=(l==null?void 0:l.segment_space)==="percent"||(l==null?void 0:l.segment_space)==="scale"?l.segment_space:null;u!=null?(f=d,_=nt(u,{legacySegmentSpace:f})):c!=null?_=nt(c):p!=null?(_=It(p),f="percent"):h!=null?_=h.map(ie=>({...ie})):b!=null?_=nt(b):m!=null&&(_=It(m),f="percent");let y=r!=null&&r.target&&typeof r.target=="object"&&!Array.isArray(r.target)?(V=r.target.when_exceeded)==null?void 0:V.fill_color:void 0,v=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(W=e.target.when_exceeded)==null?void 0:W.fill_color:void 0,x=ga(s,r,l,e,{scopeExplicitness:a,inheritedExplicitness:i,isCardScope:n}),w={fill_style:x.fill_style,color_mode:x.color_mode,needle:ka(s==null?void 0:s.needle,l==null?void 0:l.needle),solid_fill:(A=($=s==null?void 0:s.solid_fill)!=null?$:l==null?void 0:l.solid_fill)!=null?A:!1,color:(q=(B=(L=(I=s==null?void 0:s.color)!=null?I:r.color)!=null?L:l==null?void 0:l.color)!=null?B:e==null?void 0:e.color)!=null?q:"#4a9eff",gradient_stops:wa((G=(j=(Z=(H=s==null?void 0:s.gradient_stops)!=null?H:r.gradient_stops)!=null?Z:l==null?void 0:l.gradient_stops)!=null?j:e==null?void 0:e.gradient_stops)!=null?G:null),severity:_,segments:_,segment_space:f,animated:(U=(P=(O=(z=s==null?void 0:s.animated)!=null?z:r.animated)!=null?O:l==null?void 0:l.animated)!=null?P:e==null?void 0:e.animated)!=null?U:!0,above_target_color:(X=(te=(E=(K=y!=null?y:r.above_target_color)!=null?K:l==null?void 0:l.above_target_color)!=null?E:v)!=null?te:e==null?void 0:e.above_target_color)!=null?X:null};return Object.defineProperty(w,va,{value:d}),w}function Sa(r){return Math.max(24,r)}function vi(r,e="left"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function yi(r,e="medium"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function xi(r){return Number.isFinite(r)?Math.min(112,Math.max(12,r)):null}function Bt(r,e){var h,b,m,_,f,y,v,x,w,k,S,M,g,N,D,R,V,W,$,A,I,L,B,q,H;let t=e==null?void 0:e.layout,a=r==null?void 0:r.layout,i=a==null?void 0:a.label,n=a==null?void 0:a.hero,l=t==null?void 0:t.label,s=t==null?void 0:t.hero,o=!e,d=(_=(m=(b=(h=a==null?void 0:a.height)!=null?h:r.height)!=null?b:t==null?void 0:t.height)!=null?m:e==null?void 0:e.height)!=null?_:38,u=(a==null?void 0:a.height)!==void 0||r._height_explicit===!0||!o&&r.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,c=vi((x=(v=(y=(f=i==null?void 0:i.position)!=null?f:r.label_position)!=null?y:l==null?void 0:l.position)!=null?v:t==null?void 0:t.label_position)!=null?x:e==null?void 0:e.label_position,"left"),p=c==="hero"?xi((w=n==null?void 0:n.value_size)!=null?w:s==null?void 0:s.value_size):null;return{label:{position:c,width:(N=(g=(M=(S=(k=i==null?void 0:i.width)!=null?k:r.label_width)!=null?S:l==null?void 0:l.width)!=null?M:t==null?void 0:t.label_width)!=null?g:e==null?void 0:e.label_width)!=null?N:100},hero:{size:yi((H=(q=(B=(L=(I=(A=($=(W=(V=(R=(D=n==null?void 0:n.size)!=null?D:i==null?void 0:i.hero_size)!=null?R:i==null?void 0:i.heroSize)!=null?V:r.hero_size)!=null?W:r.heroSize)!=null?$:s==null?void 0:s.size)!=null?A:l==null?void 0:l.hero_size)!=null?I:l==null?void 0:l.heroSize)!=null?L:t==null?void 0:t.hero_size)!=null?B:t==null?void 0:t.heroSize)!=null?q:e==null?void 0:e.hero_size)!=null?H:e==null?void 0:e.heroSize,"medium"),value_size:p},height:Sa(d),height_explicit:u}}function qt(r,e){var i,n,l,s,o,d,u,c;let t=e==null?void 0:e.formatting,a=r==null?void 0:r.formatting;return{decimal:(s=(l=(n=(i=a==null?void 0:a.decimal)!=null?i:r.decimal)!=null?n:t==null?void 0:t.decimal)!=null?l:e==null?void 0:e.decimal)!=null?s:null,unit:(c=(u=(d=(o=a==null?void 0:a.unit)!=null?o:r.unit)!=null?d:t==null?void 0:t.unit)!=null?u:e==null?void 0:e.unit)!=null?c:null}}function Lr(r){let e=String(r!=null?r:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function ot(r){return(typeof r=="string"?r.trim().toLowerCase():"")==="outward"?"outward":"inward"}function At(r,e={}){var c,p,h;let t=r&&typeof r=="object"&&!Array.isArray(r)?r:{},a=Object.prototype.hasOwnProperty.call(t,"text"),i=a&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),l=Object.prototype.hasOwnProperty.call(t,"decimal"),s=n?t.precision:t.decimal,o=n||l,d=o?T(s):(c=e.label_precision)!=null?c:null,u=o&&s!==null&&s!==""&&!(Number.isInteger(d)&&d>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(p=e.label_show_value)!=null?p:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(h=e.label_show_unit)!=null?h:!0,label_precision:u?null:d,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:a&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:u,label_precision_key:u?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function Pt(r){let e={};return r.label_text!==null&&r.label_text!==void 0&&(e.label_text=r.label_text),r.label_show_value===!1&&(e.label_show_value=!1),r.label_show_unit===!1&&(e.label_show_unit=!1),r.label_precision!==null&&r.label_precision!==void 0&&(e.label_precision=r.label_precision),r.label_invalid_text&&(e.label_invalid_text=!0),r.label_invalid_show_value&&(e.label_invalid_show_value=!0),r.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),r.label_invalid_show&&(e.label_invalid_show=!0),r.label_invalid_precision&&(e.label_invalid_precision=!0),r.label_invalid_precision&&r.label_precision_key&&(e.label_precision_key=r.label_precision_key),r.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function Hr(r){return r!==void 0&&!["inward","outward"].includes(typeof r=="string"?r.trim().toLowerCase():"")}function Ht(r,e){var c,p,h,b,m,_,f,y,v,x,w,k,S,M,g,N,D,R,V,W,$,A,I,L,B,q,H,Z,j,G,z,O,P,U,K;let t=e==null?void 0:e.target_marker,a=r==null?void 0:r.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(c=e==null?void 0:e.target)!=null?c:null,n=t?{...t,shape:Lr(t.shape),direction:ot(t.direction)}:{enabled:null,source:J(null,null),color:(p=e==null?void 0:e.target_color)!=null?p:"#888",show_label:(h=e==null?void 0:e.show_target_label)!=null?h:!1,...Pt(At((b=e==null?void 0:e.target)==null?void 0:b.label)),label_decimal:(x=(v=(_=(m=e==null?void 0:e.target)==null?void 0:m.label)==null?void 0:_.precision)!=null?v:(y=(f=e==null?void 0:e.target)==null?void 0:f.label)==null?void 0:y.decimal)!=null?x:null,shape:"diamond",direction:"inward"};if(a&&typeof a=="object"&&!Array.isArray(a)){let E=At(a.label,n),te={enabled:(k=(w=lt(a.enabled))!=null?w:n.enabled)!=null?k:null,source:be(a.at,n.source,null,{allowPercent:!0}),color:(M=(S=a.color)!=null?S:r.target_color)!=null?M:n.color,show_label:(D=(N=(g=a.label)==null?void 0:g.show)!=null?N:r.show_target_label)!=null?D:n.show_label,shape:Object.prototype.hasOwnProperty.call(a,"shape")?Lr(a.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(a,"direction")?ot(a.direction):n.direction,...Hr(a.direction)?{direction_invalid:!0}:{},...Pt(E)},X=E.label_precision;return X!=null&&(te.label_decimal=X,te.label_precision=X),te}let l=(A=($=(V=r.target)!=null?V:(R=n.source)==null?void 0:R.fixed)!=null?$:(W=n.source)==null?void 0:W.value)!=null?A:i,s=(q=(B=(L=r.target_entity)!=null?L:(I=n.source)==null?void 0:I.entity)!=null?B:e==null?void 0:e.target_entity)!=null?q:null,o=r.target===void 0&&r.target_entity===void 0&&(Z=(H=n.source)==null?void 0:H.percent)!=null?Z:null,d={enabled:(j=n.enabled)!=null?j:null,source:J(l,s,o),color:(O=(z=(G=r.target_color)!=null?G:n.color)!=null?z:e==null?void 0:e.target_color)!=null?O:"#888",show_label:(K=(U=(P=r.show_target_label)!=null?P:n.show_label)!=null?U:e==null?void 0:e.show_target_label)!=null?K:!1,shape:n.shape,direction:n.direction,...Pt(n)},u=d.label_precision;return u!=null&&(d.label_decimal=u),d}function gi(r,e){let t=r==null?void 0:r[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let a=r==null?void 0:r[`${e}_marker`];return a&&typeof a=="object"&&!Array.isArray(a)?a:null}function wi(r,e){var n,l,s;let t=r==null?void 0:r.label,a=t&&typeof t=="object"&&!Array.isArray(t),i=At(t,e);return{show:a&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(s=(l=i.label_precision)!=null?l:e.label_decimal)!=null?s:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function Or(r,e,t,a={}){var f,y,v,x,w,k,S,M,g;let{legacy:i=!1,defaultColor:n="#888888"}=a,l=e==null?void 0:e[`${t}_marker`],s=gi(r,t),o=l!=null?l:{show:i&&(f=e==null?void 0:e.show_peak)!=null?f:!1,color:i&&(y=e==null?void 0:e.peak_color)!=null?y:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},d=s&&Object.prototype.hasOwnProperty.call(s,"reset"),u=d?s.reset:void 0,c=d?Wr(u):(v=o.reset)!=null?v:{kind:"never"},p=s==null?void 0:s.label,h=wi(s,o),b={show:(k=(w=(x=s==null?void 0:s.enabled)!=null?x:i?r.show_peak:void 0)!=null?w:o.show)!=null?k:!1,color:(g=(M=(S=s==null?void 0:s.color)!=null?S:i?r.peak_color:void 0)!=null?M:o.color)!=null?g:n,direction:s&&Object.prototype.hasOwnProperty.call(s,"direction")?ot(s.direction):ot(o.direction),...Hr(s==null?void 0:s.direction)?{direction_invalid:!0}:{}},m=l&&(Object.prototype.hasOwnProperty.call(l,"show_label")||Object.prototype.hasOwnProperty.call(l,"label_decimal")||Object.prototype.hasOwnProperty.call(l,"label_text")||Object.prototype.hasOwnProperty.call(l,"label_show_value")||Object.prototype.hasOwnProperty.call(l,"label_show_unit")||Object.prototype.hasOwnProperty.call(l,"label_precision")||Object.prototype.hasOwnProperty.call(l,"reset"));return(t==="floor"||d||p!==void 0||m)&&(b.show_label=h.show,b.label_decimal=h.precision,b.reset=c),Object.assign(b,Pt({label_text:h.text,label_show_value:h.showValue===!0?void 0:h.showValue,label_show_unit:h.showUnit===!0?void 0:h.showUnit,label_precision:h.precision,label_invalid_text:h.invalidText,label_invalid_show:h.invalidShow,label_invalid_show_value:h.invalidShowValue,label_invalid_show_unit:h.invalidShowUnit,label_invalid_precision:h.invalidPrecision,label_precision_key:h.precisionKey,label_unsupported_unit:h.unsupportedUnit})),d&&!Ar(u)&&(b.reset_invalid=!0),b}function Ot(r,e){return Or(r,e,"peak",{legacy:!0,defaultColor:"#888888"})}function Ur(r,e){return Or(r,e,"floor",{defaultColor:"#888888"})}function Ma(r,e){var i,n,l;let t={...r,_normalized:!0,entity:r.entity,name:(i=r.name)!=null?i:null,icon:r.icon};t.layout=Bt(r,e),t.scale=Tt(r,e),t.bar=Lt(r,e,{scopeExplicitness:st(r),inheritedExplicitness:(n=e==null?void 0:e[xa])!=null?n:st(e),isCardScope:!1}),t.baseline=Dt(r,e),t.formatting=qt(r,e),t.target_marker=Ht(r,e),t.peak_marker=Ot(r,e),t.floor_marker=Ur(r,e);let a=r.markers===void 0?{markers:Br((l=e==null?void 0:e.generic_markers)!=null?l:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:qr(r.markers,t);return t.generic_markers=a.markers,t.generic_markers_invalid=a.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Ut(r){var n;let e=st(r),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...r};t._height_explicit=((n=r==null?void 0:r.layout)==null?void 0:n.height)!==void 0||(r==null?void 0:r.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(l=>typeof l=="string"?{entity:l}:l);let a={...t,_normalized:!0};Object.defineProperty(a,xa,{value:e,enumerable:!1}),a.layout=Bt(t,null),a.scale=Tt(r,null),a.bar=Lt(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),a.baseline=Dt(t,null),a.formatting=qt(t,null),a.target_marker=Ht(t,null),a.peak_marker=Ot(t,null),a.floor_marker=Ur(t,null);let i=qr(t.markers,a);return a.generic_markers=i.markers,a.generic_markers_invalid=i.invalidList,a.entities=t.entities.map(l=>Ma(l,a)),a}var xa,va,fe=ae(()=>{zt();xa=Symbol("sbcp.paintExplicitness"),va=Symbol("sbcp.explicitSegmentSpace")});function xe(r,e){var i;if(!e||!((i=r==null?void 0:r.states)!=null&&i[e]))return null;let t=r.states[e].state,a=parseFloat(t);return Number.isFinite(a)?a:null}function ge(r,e,t=null){let a=xe(r,t);if(a!==null)return a;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function Ra(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return a+r/100*(i-a)}function oe(r,e,t=null,a=null){var l;if(!e)return null;let i=xe(r,e.entity);if(i!==null)return i;let n=ge(r,(l=e.fixed)!=null?l:e.value,null);return n!==null?n:Number.isFinite(e.percent)?Ra(e.percent,t,a):null}function Er(r,e,t=null){var s,o,d,u,c,p,h,b,m,_,f,y;let a=v=>Number.isFinite(v==null?void 0:v.min)&&Number.isFinite(v==null?void 0:v.max)&&v.min<v.max,i={min:ge(null,(d=(s=e==null?void 0:e.min)==null?void 0:s.fixed)!=null?d:(o=e==null?void 0:e.min)==null?void 0:o.value),max:ge(null,(p=(u=e==null?void 0:e.max)==null?void 0:u.fixed)!=null?p:(c=e==null?void 0:e.max)==null?void 0:c.value)};if((h=e==null?void 0:e.min)!=null&&h.entity&&((b=e==null?void 0:e.max)!=null&&b.entity)){let v={min:xe(r,e.min.entity),max:xe(r,e.max.entity)};return a(v)?v:Number.isFinite(v.min)&&Number.isFinite(v.max)&&a(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&a(i)?i:{min:0,max:100}}let n={min:(m=oe(r,e==null?void 0:e.min))!=null?m:0,max:(_=oe(r,e==null?void 0:e.max))!=null?_:100};if(a(n))return n;let l={min:(f=i.min)!=null?f:0,max:(y=i.max)!=null?y:100};return a(l)?l:{min:0,max:100}}var $a=ae(()=>{fe()});function ki(r,e,t,a=null){return{code:r,message:e,path:t,entity:a}}function Et(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:T((e=r.fixed)!=null?e:r.value)}function F(r,e,t,a,i=null){r.warnings.push(ki(e,t,a,i))}function Si(r,e,t,a=null){var l,s;if((l=e==null?void 0:e.min)!=null&&l.entity&&((s=e==null?void 0:e.max)!=null&&s.entity)){let o=d=>{var u,c;return d.fixed_explicit!==!1&&((u=d.fixed)!=null?u:d.value)!==null&&((c=d.fixed)!=null?c:d.value)!==void 0};o(e.min)!==o(e.max)&&F(r,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,a)}let i=Et(e==null?void 0:e.min),n=Et(e==null?void 0:e.max);return Number.isFinite(i)&&Number.isFinite(n)&&i>n&&F(r,"scale.min_gt_max","Scale minimum is greater than maximum.",t,a),{min:i,max:n}}function Mi(r,e,t,a,i=null){var o;let n=Et((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&F(r,"target.outside_scale","Fixed target value is outside the fixed scale range.",a,i)}function Ri(r,e,t,a,i=null){var o;let n=Et((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&F(r,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",a,i)}function $i(r){var e;return!!r&&(Number.isFinite(T((e=r.fixed)!=null?e:r.value))||Number.isFinite(r.percent)||!!r.entity)}function Ni(r,e,t,a=null){var l,s,o,d;let i=((s=(l=e==null?void 0:e.bar)==null?void 0:l.needle)==null?void 0:s.show)===!0,n=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&$i((d=e==null?void 0:e.baseline)==null?void 0:d.at);i&&n&&F(r,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,a)}function Fi(r,e,t,a=null){var i;for(let n of["peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.reset_invalid&&F(r,`${n}.invalid_reset`,"Invalid marker reset; using never.",`${t}.${n}.reset`,a)}function zi(r,e,t,a=null){var i;for(let n of["target_marker","peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.direction_invalid&&F(r,`${n}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${n==="target_marker"?"target":n.replace("_marker","")}.direction`,a)}function Pi(r,e,t,a=null){var i;for(let[n,l]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let s=e==null?void 0:e[n],o=`${t}.${l}.label`;s!=null&&s.label_invalid_show&&F(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,a),s!=null&&s.label_invalid_text&&F(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,a),s!=null&&s.label_invalid_show_value&&F(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,a),s!=null&&s.label_invalid_show_unit&&F(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,a),s!=null&&s.label_invalid_precision&&F(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(i=s.label_precision_key)!=null?i:"precision"}`,a),s!=null&&s.label_unsupported_unit&&F(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,a)}}function Na(r,e,t,a,i=null){var n,l,s,o,d,u,c,p;t&&F(r,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",a,i);for(let h of e!=null?e:[]){let b=`${a}[${h.index}]`;if(h.malformed){F(r,"markers.invalid_item","Marker must be an object; ignoring this item.",b,i);continue}h.invalidSource&&!h.invalidPercentage&&!h.unsupportedPercentField&&F(r,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${b}.at`,i),h.invalidPercentage&&F(r,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${b}.at`,i),h.unsupportedPercentField&&F(r,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${b}.at`,i),h.invalidLane&&F(r,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${b}.lane`,i),h.invalidShape&&F(r,"markers.invalid_shape","Invalid marker shape; using circle.",`${b}.shape`,i),h.invalidDirection&&F(r,"markers.invalid_direction","Invalid marker direction; using inward.",`${b}.direction`,i),h.invalidShowMarker&&F(r,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${b}.show_marker`,i),(n=h.label)!=null&&n.invalidEntity&&F(r,"markers.invalid_label_entity","Marker label entity must be a valid entity ID; ignoring it.",`${b}.label.entity`,i),(l=h.label)!=null&&l.invalidShow&&F(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${b}.label.show`,i),(s=h.label)!=null&&s.invalidText&&F(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${b}.label.text`,i),(o=h.label)!=null&&o.invalidShowValue&&F(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${b}.label.show_value`,i),(d=h.label)!=null&&d.invalidShowUnit&&F(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${b}.label.show_unit`,i),(u=h.label)!=null&&u.invalidPrecision&&F(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${b}.label.${(c=h.label.invalidPrecisionKey)!=null?c:"precision"}`,i),(p=h.label)!=null&&p.unsupportedUnit&&F(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${b}.label.unit`,i),h.valid&&!h.accepted&&F(r,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",b,i)}}function jr(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:T((e=r.fixed)!=null?e:r.value)}function Ii(r,e,t,a,i=null){if(!Array.isArray(e)||!e.length)return;let n=[],{min:l,max:s}=t;for(let d=0;d<e.length;d+=1){let u=e[d],c=jr(u==null?void 0:u.from),p=jr(u==null?void 0:u.to),h=`${a}.segments[${d}]`;if((u==null?void 0:u.invalidBoundary)==="entity"){F(r,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",h,i);continue}if((u==null?void 0:u.invalidBoundary)==="malformed_percent"){F(r,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",h,i);continue}if(u!=null&&u.invalidBoundary){F(r,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',h,i);continue}Number.isFinite(c)&&Number.isFinite(p)&&c>p&&F(r,"segments.from_gt_to","Segment start is greater than segment end.",h,i),Number.isFinite(l)&&Number.isFinite(s)&&(Number.isFinite(c)&&(c<l||c>s)&&F(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i),Number.isFinite(p)&&(p<l||p>s)&&F(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i)),Number.isFinite(c)&&Number.isFinite(p)&&n.push({from:c,to:p,path:h})}let o=[...n].sort((d,u)=>d.from-u.from);for(let d=1;d<o.length;d+=1){let u=o[d-1],c=o[d];c.from<u.to&&F(r,"segments.overlap","Fixed segments overlap.",c.path,i)}}function Vi(r,e,t,a=null){var n;if(!Array.isArray(e))return;let i=new Set;for(let l=0;l<e.length;l+=1){let s=T((n=e[l])==null?void 0:n.pos),o=`${t}.gradient_stops[${l}]`;Number.isFinite(s)&&(s<0||s>100)&&F(r,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,a),Number.isFinite(s)&&(i.has(s)?F(r,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,a):i.add(s))}}function Gr(r,e,t,a=null){var n,l;let i=Si(r,e==null?void 0:e.scale,t,a);Mi(r,e,i,t,a),Ri(r,e,i,t,a),Ni(r,e,t,a),Fi(r,e,t,a),zi(r,e,t,a),Pi(r,e,t,a),Ii(r,(n=e==null?void 0:e.bar)==null?void 0:n.segments,i,`${t}.bar`,a),Vi(r,(l=e==null?void 0:e.bar)==null?void 0:l.gradient_stops,`${t}.bar`,a)}function jt(r){var i,n;let e={warnings:[],errors:[]};if(!r||typeof r!="object")return e;Gr(e,r,"card"),Na(e,r.generic_markers,r.generic_markers_invalid,"markers");let t=new Set,a=Array.isArray(r.entities)?r.entities:[];for(let l=0;l<a.length;l+=1){let s=a[l],o=(i=s==null?void 0:s.entity)!=null?i:null,d=`entities[${l}]`;if(!o){F(e,"entities.missing_entity","Entity row is missing an entity id.",d,null);continue}if(t.has(o)?F(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",d,o):t.add(o),Gr(e,s,d,o),Object.prototype.hasOwnProperty.call(s,"markers"))Na(e,s.generic_markers,s.generic_markers_invalid,`${d}.markers`,o);else{let u=((n=s.generic_markers)!=null?n:[]).filter(c=>{var p,h;return c.valid&&!c.accepted&&((h=(p=r.generic_markers)==null?void 0:p[c.index])==null?void 0:h.accepted)===!0});u.length&&Na(e,u,!1,`${d}.markers`,o)}}return e}var Fa=ae(()=>{fe()});function de(r,e=null){return Number.isFinite(r)?e!==null?r.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):r.toLocaleString():String(r)}function za(r){return["h","m","s"].includes(String(r||"").trim())}function Pa(r,e){if(!e)return String(r);let t=String(e);return`${r}${za(t)?"":" "}${t}`}function ut(r,e,t=null){let a=de(r,t),i=e?String(e):"";return{value:r,number:a,unit:i,text:Pa(a,i)}}function ct(r,e,t=null,a={}){let i=typeof a.text=="string"?a.text:"",n=a.showValue===!1||r===null||r===void 0||r===""?"":Number.isFinite(r)?de(r,t):String(r),l=a.showUnit===!1?"":String(e!=null?e:"").trim(),s=[i,n,l].filter(Boolean).join(" ");return{value:Number.isFinite(r)?r:null,semanticText:i,number:n,unit:l,showValue:a.showValue!==!1,showUnit:a.showUnit!==!1,text:s}}function Kr(r){let e=String(r);return{value:null,number:e,unit:"",text:e}}var Gt=ae(()=>{});function Xr(r){return r?r.entity!==null&&r.entity!==void 0&&r.entity!==""||r.fixed!==null&&r.fixed!==void 0&&r.fixed!==""||Number.isFinite(r.percent):!1}function Xt(r,e="circle"){return Wi.has(r)?r:e}function Kt({id:r,type:e,value:t=null,position:a=null,lane:i,visible:n=!1,color:l=null,label:s=null,labelVisible:o=!1,shape:d="circle",direction:u="inward",showMarker:c=!0}){return{id:r,type:e,value:t,position:a,lane:i,visible:n===!0,color:l,label:s,labelVisible:o===!0,shape:Xt(d),direction:u,showMarker:c!==!1}}function le(r){return!!(typeof(r==null?void 0:r.text)=="string"&&r.text.trim())||(r==null?void 0:r.showValue)!==!1||(r==null?void 0:r.showUnit)!==!1}function Jt(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&Xr(e==null?void 0:e.source)||(a==null?void 0:a.show)===!0||i.some(l=>l.lane==="below"),above:(t==null?void 0:t.show)===!0||i.some(l=>l.lane==="above")}}function Yt(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&Xr(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&le({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(a==null?void 0:a.show)===!0&&(a==null?void 0:a.show_label)===!0&&le({text:a.label_text,showValue:a.label_show_value,showUnit:a.label_show_unit})||i.some(l=>{var s;return l.lane==="below"&&((s=l.label)==null?void 0:s.show)===!0&&le(l.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&le({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||i.some(l=>{var s;return l.lane==="above"&&((s=l.label)==null?void 0:s.show)===!0&&le(l.label)})}}function Zt({entityConfig:r,targetValue:e=null,targetPosition:t=null,targetPresentation:a=null,targetLabelPresentation:i=null,targetVisible:n=Number.isFinite(t),peakValue:l=null,peakPosition:s=null,peakPresentation:o=null,peakLabelPresentation:d=null,peakVisible:u=Number.isFinite(s),floorValue:c=null,floorPosition:p=null,floorPresentation:h=null,floorLabelPresentation:b=null,floorVisible:m=Number.isFinite(p),genericMarkers:_=[]}){var w,k,S,M,g,N,D;let f=r==null?void 0:r.target_marker,y=r==null?void 0:r.peak_marker,v=r==null?void 0:r.floor_marker,x=(f==null?void 0:f.enabled)!==!1;return[Kt({id:"target",type:"target",value:e,position:t,lane:"below",visible:x&&n,color:(w=f==null?void 0:f.color)!=null?w:null,label:i!=null?i:a,labelVisible:x&&(f==null?void 0:f.show_label)===!0&&le({text:f.label_text,showValue:f.label_show_value,showUnit:f.label_show_unit}),shape:(k=f==null?void 0:f.shape)!=null?k:"diamond",direction:(S=f==null?void 0:f.direction)!=null?S:"inward"}),Kt({id:"floor",type:"floor",value:c,position:p,lane:"below",visible:(v==null?void 0:v.show)===!0&&m,color:(M=v==null?void 0:v.color)!=null?M:null,label:b!=null?b:h,labelVisible:(v==null?void 0:v.show)===!0&&(v==null?void 0:v.show_label)===!0&&le({text:v.label_text,showValue:v.label_show_value,showUnit:v.label_show_unit}),shape:"triangle",direction:(g=v==null?void 0:v.direction)!=null?g:"inward"}),Kt({id:"peak",type:"peak",value:l,position:s,lane:"above",visible:(y==null?void 0:y.show)===!0&&u,color:(N=y==null?void 0:y.color)!=null?N:null,label:d!=null?d:o,labelVisible:(y==null?void 0:y.show)===!0&&(y==null?void 0:y.show_label)===!0&&le({text:y.label_text,showValue:y.label_show_value,showUnit:y.label_show_unit}),shape:"triangle",direction:(D=y==null?void 0:y.direction)!=null?D:"inward"}),..._.map(R=>Kt({id:R.id,type:"generic",value:R.value,position:R.position,lane:R.lane,visible:R.visible,color:R.color,label:R.label,labelVisible:R.labelVisible&&le(R.label),shape:R.shape,direction:R.direction,showMarker:R.showMarker}))]}var Wi,Qt=ae(()=>{Wi=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function Ai(r,e=""){var n,l,s;let t=String((l=(n=r==null?void 0:r.attributes)==null?void 0:n.device_class)!=null?l:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let a=String(e||"").split(".")[0];return(s={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[a])!=null?s:null}function we(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function Di(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function Jr(r){let e=Di(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function Ti(r,e,t,a,i){var o,d,u;let n=(o=r==null?void 0:r.bar)==null?void 0:o.needle;if(!(n!=null&&n.show)||Number.isFinite(i)||!Number.isFinite(e)){let c=(d=n==null?void 0:n.color)!=null?d:"#ffffff";return{show:!1,percent:null,pct:null,color:c,borderColor:Jr(c),edge:"middle"}}let l=(u=n.color)!=null?u:"#ffffff",s=Math.min(100,Math.max(0,we(e,t,a)));return{show:!0,percent:s,pct:s,color:l,borderColor:Jr(l),edge:s<=0?"left":s>=100?"right":"middle"}}function Yr(r,e,t,a,i,n){if(!n)return{value:null,percent:null,display:null,visible:!1};let l=T(a==null?void 0:a.value);if(!Number.isFinite(l)&&!Number.isFinite(r))return{value:null,percent:null,visible:!1};let s=Number.isFinite(l)?Number.isFinite(r)?i==="min"?Math.min(l,r):Math.max(l,r):l:r;return{value:s,percent:we(s,e,t),visible:!0}}function ht(r){var O,P,U,K,E,te,X,ie,se,ce,he,xt,Fe,ze,Pe,Ie,Ve,We,Ae,De,Te,Le,Be,qe,He,Oe,Ue,Ee,je,Ge,Ke,Xe,Je,Ye,Ze,Qe,Ce,et,C,tt,at,Ca,er,tr,ar,rr,ir,nr,lr,sr,or,dr,ur,cr,hr,pr,br,mr,fr,_r,vr,yr;let{hass:e,cardConfig:t,entityConfig:a,entityState:i,peaks:n,extrema:l,previousScale:s}=r,o=(O=a==null?void 0:a.entity)!=null?O:null,d=(P=i==null?void 0:i.state)!=null?P:"",u=T(d),c=(K=(U=i==null?void 0:i.attributes)==null?void 0:U.unit_of_measurement)!=null?K:"",p=(E=a==null?void 0:a.formatting)==null?void 0:E.unit,h=(te=p!=null?p:c)!=null?te:"",b=u!==null?h:"",{min:m,max:_}=Er(e,a==null?void 0:a.scale,s),f=u!==null?we(u,m,_):0,y=(ie=(X=a==null?void 0:a.formatting)==null?void 0:X.decimal)!=null?ie:null,v=u===null?Kr(d):ut(u,b,y),x=((se=a==null?void 0:a.target_marker)==null?void 0:se.enabled)===!1?null:oe(e,(ce=a==null?void 0:a.target_marker)==null?void 0:ce.source,m,_),w=x!==null?we(x,m,_):null,k=x!==null,S=(xt=(he=a==null?void 0:a.target_marker)==null?void 0:he.label_decimal)!=null?xt:y,M=x!==null?ut(x,h,S):null,g=x!==null?ct(x,h,(ze=(Fe=a==null?void 0:a.target_marker)==null?void 0:Fe.label_precision)!=null?ze:S,{text:(Pe=a==null?void 0:a.target_marker)==null?void 0:Pe.label_text,showValue:(Ie=a==null?void 0:a.target_marker)==null?void 0:Ie.label_show_value,showUnit:(Ve=a==null?void 0:a.target_marker)==null?void 0:Ve.label_show_unit}):null,N=((We=a==null?void 0:a.baseline)==null?void 0:We.enabled)===!1?null:oe(e,(Ae=a==null?void 0:a.baseline)==null?void 0:Ae.at,m,_),D=Number.isFinite(N)?we(N,m,_):null,R=Number.isFinite(N),V=Number.isFinite(T(n==null?void 0:n[o]))?{value:T(n==null?void 0:n[o])}:null,W=Yr(u,m,_,(De=l==null?void 0:l.peak)!=null?De:V,"max",((Te=a==null?void 0:a.peak_marker)==null?void 0:Te.show)===!0),$=Yr(u,m,_,l==null?void 0:l.floor,"min",((Le=a==null?void 0:a.floor_marker)==null?void 0:Le.show)===!0),A=(qe=(Be=a==null?void 0:a.peak_marker)==null?void 0:Be.label_decimal)!=null?qe:y,I=(Oe=(He=a==null?void 0:a.floor_marker)==null?void 0:He.label_decimal)!=null?Oe:y,L=(Ee=(Ue=a==null?void 0:a.peak_marker)==null?void 0:Ue.label_precision)!=null?Ee:A,B=(Ge=(je=a==null?void 0:a.floor_marker)==null?void 0:je.label_precision)!=null?Ge:I,q=W.visible?ut(W.value,h,A):null,H=$.visible?ut($.value,h,I):null,Z=W.visible?ct(W.value,h,L,{text:(Ke=a==null?void 0:a.peak_marker)==null?void 0:Ke.label_text,showValue:(Xe=a==null?void 0:a.peak_marker)==null?void 0:Xe.label_show_value,showUnit:(Je=a==null?void 0:a.peak_marker)==null?void 0:Je.label_show_unit}):null,j=$.visible?ct($.value,h,B,{text:(Ye=a==null?void 0:a.floor_marker)==null?void 0:Ye.label_text,showValue:(Ze=a==null?void 0:a.floor_marker)==null?void 0:Ze.label_show_value,showUnit:(Qe=a==null?void 0:a.floor_marker)==null?void 0:Qe.label_show_unit}):null,G=((Ce=a==null?void 0:a.generic_markers)!=null?Ce:[]).filter(Q=>Q.accepted).map(Q=>{var kr,Sr,Mr,Rr,$r;let gt=oe(e,Q.source,m,_),xr=Number.isFinite(gt),ri=(kr=Q.label.precision)!=null?kr:y,pe=Q.label.entity?(Sr=e==null?void 0:e.states)==null?void 0:Sr[Q.label.entity]:null,gr=pe==null?void 0:pe.state,wt=typeof gr=="string"?gr.trim():"",wr=pe&&wt&&!["unknown","unavailable"].includes(wt.toLowerCase()),ii=Q.label.entity?wr?(Mr=T(wt))!=null?Mr:wt:null:gt,ni=Q.label.entity?wr&&($r=(Rr=pe==null?void 0:pe.attributes)==null?void 0:Rr.unit_of_measurement)!=null?$r:"":h,li=Q.label.show?ct(ii,ni,ri,{text:Q.label.text,showValue:Q.label.showValue,showUnit:Q.label.showUnit}):null;return{id:Q.id,value:gt,position:xr?we(gt,m,_):null,lane:Q.lane,visible:xr,color:Q.color,shape:Q.shape,direction:Q.direction,showMarker:Q.showMarker,label:li,labelVisible:Q.label.show}}),z=Zt({entityConfig:a,targetValue:x,targetPosition:w,targetPresentation:M,targetLabelPresentation:g,targetVisible:k,peakValue:W.value,peakPosition:W.percent,peakPresentation:q,peakLabelPresentation:Z,peakVisible:W.visible,floorValue:$.value,floorPosition:$.percent,floorPresentation:H,floorLabelPresentation:j,floorVisible:$.visible,genericMarkers:G});return{entityId:o,name:(tt=(C=a==null?void 0:a.name)!=null?C:(et=i==null?void 0:i.attributes)==null?void 0:et.friendly_name)!=null?tt:o,icon:(a==null?void 0:a.icon)===!1?!1:(er=(Ca=a==null?void 0:a.icon)!=null?Ca:(at=i==null?void 0:i.attributes)==null?void 0:at.icon)!=null?er:Ai(i,o),state:d,numericValue:u,rawUnit:c,min:m,max:_,percent:f,displayValue:v.number,displayUnit:v.unit,primaryPresentation:v,unit:v.unit,barColor:(ar=(tr=a==null?void 0:a.bar)==null?void 0:tr.color)!=null?ar:null,fillStyle:(ir=(rr=a==null?void 0:a.bar)==null?void 0:rr.fill_style)!=null?ir:null,target:x,targetPercent:w,targetDisplay:(nr=M==null?void 0:M.text)!=null?nr:null,targetPresentation:M,targetLabelPresentation:g,targetVisible:k,baseline:N,baselinePercent:D,baselineVisible:R,peak:W.value,peakPercent:W.percent,peakDisplay:(lr=q==null?void 0:q.number)!=null?lr:null,peakPresentation:q,peakLabelPresentation:Z,peakVisible:W.visible,floor:$.value,floorPercent:$.percent,floorDisplay:(sr=H==null?void 0:H.number)!=null?sr:null,floorPresentation:H,floorLabelPresentation:j,floorVisible:$.visible,markers:z,markerLaneOccupancy:Jt(a),markerLabelLaneOccupancy:Yt(a),segments:(dr=(or=a==null?void 0:a.bar)==null?void 0:or.segments)!=null?dr:null,gradientStops:(cr=(ur=a==null?void 0:a.bar)==null?void 0:ur.gradient_stops)!=null?cr:null,needle:Ti(a,u,m,_,D),classes:{labelPosition:(br=(pr=(hr=a==null?void 0:a.layout)==null?void 0:hr.label)==null?void 0:pr.position)!=null?br:"left",animated:((mr=a==null?void 0:a.bar)==null?void 0:mr.animated)!==!1},attributes:{entity:o,baseHeight:(_r=(fr=a==null?void 0:a.layout)==null?void 0:fr.height)!=null?_r:38,heightExplicit:((vr=a==null?void 0:a.layout)==null?void 0:vr.height_explicit)===!0,barAnimated:((yr=a==null?void 0:a.bar)==null?void 0:yr.animated)!==!1}}}var Ia=ae(()=>{$a();fe();Gt();Qt()});function ee(r){return r==null?"":String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Y(r,e,t){var n,l;if(!(r!=null&&r.style))return!1;let a=t==null?"":String(t);return e.startsWith("--")?(typeof r.style.getPropertyValue=="function"?r.style.getPropertyValue(e):(n=r.style[e])!=null?n:"")===a?!1:(typeof r.style.setProperty=="function"?r.style.setProperty(e,a):r.style[e]=a,!0):((l=r.style[e])!=null?l:"")===a?!1:(r.style[e]=a,!0)}function ke(r,e){var i;if(!(r!=null&&r.style))return!1;let t=e==null?"":String(e);return((i=r.style.cssText)!=null?i:"")===t?!1:(r.style.cssText=t,!0)}function ne(r,e,t){var n;if(!(r!=null&&r.dataset))return!1;let a=t==null?"":String(t);return((n=r.dataset[e])!=null?n:"")===a?!1:(r.dataset[e]=a,!0)}function Ct(r,e){var a;if(!r)return!1;let t=e==null?"":String(e);return((a=r.className)!=null?a:"")===t?!1:(r.className=t,!0)}var ea=ae(()=>{});function sa(r,e){if(!r||!e||!Number.isFinite(r.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(r.baselinePercent)?r.baselinePercent:0,a=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,i=Math.max(Math.abs(e.valuePercent-r.valuePercent),Math.abs(a-t)),n=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,i-5))));return Number.isFinite(r.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(r.valuePercent-r.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(n,300):n}function ta(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function Me(r){if(!r||typeof r!="string")return null;let e=r.replace("#","").trim(),t=e.length===3?e.split("").map(a=>a+a).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function oa(r,e=0,t=100,a=!1){let n=Re(r,e,t).filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&(s==null?void 0:s.color)).sort((s,o)=>s.from-o.from);if(!n.length)return[];let l=[];for(let s=0;s<n.length;s++){let o=n[s],d=Me(o.color);if(!d&&!a)continue;let u;s===0?u=o.from:s===n.length-1?u=o.to:u=o.from+(o.to-o.from)/2,(!l.length||l[l.length-1].p!==u)&&l.push({p:u,...d!=null?d:{color:o.color}})}return l}function Va(r,e=0,t=100){let i=Re(r,e,t).filter(l=>Number.isFinite(l==null?void 0:l.from)&&Number.isFinite(l==null?void 0:l.to)&&(l==null?void 0:l.color)).sort((l,s)=>l.from-s.from);if(!i.length)return null;let n=[];for(let l of i)n.push(`${l.color} ${l.from}%`,`${l.color} ${l.to}%`);return`linear-gradient(to right, ${n.join(", ")})`}function Wa(){return 1.5}function ue(r,e,t){if(!Array.isArray(r)||!t)return;let a=Math.min(100,Math.max(0,e)),i=r[r.length-1];i&&i.color===t&&Math.abs(i.p-a)<1e-4||r.push({p:a,color:t})}function bt(r,e=0,t=100){let i=Re(r,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,d)=>o.from-d.from);if(!i.length)return[];let n=Wa(),l=n/2,s=[];ue(s,i[0].from,i[0].color);for(let o=0;o<i.length-1;o++){let d=i[o],u=i[o+1],c=d.to,p=d.to-d.from,h=u.to-u.from;p>=n&&h>=n?(ue(s,Math.max(d.from,c-l),d.color),ue(s,Math.min(u.to,c+l),u.color)):(ue(s,c,d.color),ue(s,c,u.color))}return ue(s,i[i.length-1].to,i[i.length-1].color),s}function Aa(r,e=0,t=100){let a=bt(r,e,t);return a.length?`linear-gradient(to right, ${a.map(i=>`${i.color} ${i.p}%`).join(", ")})`:null}function aa(r,e,t){if(r==null)return null;if(typeof r=="object"&&!Array.isArray(r)){let n=T(r.fixed);return Number.isFinite(n)?pt(n,e,t):Number.isFinite(r.percent)?r.percent:null}let a=me(r);if(Number.isFinite(a))return a;let i=T(r);return Number.isFinite(i)?pt(i,e,t):null}function mt(r){var e,t,a,i;return(i=(a=(e=r==null?void 0:r.bar)==null?void 0:e.fill_style)!=null?a:dt((t=r==null?void 0:r.bar)==null?void 0:t.color_mode))!=null?i:"bands"}function Da(r){return Array.isArray(r)&&r.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Re(r,e=0,t=100){var l,s;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((l=r.bar)==null?void 0:l.segments)?r.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((s=r.bar)==null?void 0:s.segment_space)==="scale"||Da(n)){let o=n.map(d=>{var u;return{from:aa(d.from,a,i),to:aa(d.to,a,i),color:d.color,label:(u=d.label)!=null?u:null}}).filter(d=>Number.isFinite(d.from)&&d.color);return ta(o,100).filter(d=>Number.isFinite(d.from)&&Number.isFinite(d.to)&&d.color)}return ta(n,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.color)}function Ta(r,e,t=0,a=100){let i=mt(e);if(i==="solid")return e.bar.color;if(i==="gradient"||i==="band_gradient"||i==="soft_bands"){let n;if(i==="band_gradient"?n=oa(e,t,a):i==="soft_bands"?n=bt(e,t,a).map(d=>{let u=Me(d.color);return u?{p:d.p,...u}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(n=e.bar.gradient_stops.map(d=>{let u=d.color.replace("#",""),c=u.length===3?u.split("").map(p=>p+p).join(""):u;return{p:d.pos,r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}}),n.sort((d,u)=>d.p-u.p)):n=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!n||!n.length)return e.bar.color;let l=n[0],s=n[n.length-1];for(let d=0;d<n.length-1;d++)if(r>=n[d].p&&r<=n[d+1].p){l=n[d],s=n[d+1];break}let o=l.p===s.p?0:(r-l.p)/(s.p-l.p);return`rgb(${Math.round(l.r+o*(s.r-l.r))},${Math.round(l.g+o*(s.g-l.g))},${Math.round(l.b+o*(s.b-l.b))})`}for(let n of Re(e,t,a))if(r>=n.from&&r<=n.to)return n.color;return e.bar.color}function La(r){if(!Array.isArray(r)||!r.length)return null;let e=r.map(t=>{var i;let a=(i=t.color)!=null?i:qa(t);return a?`${a} ${t.p}%`:null}).filter(Boolean);return e.length?`background:linear-gradient(to right,${e.join(",")});background-repeat:no-repeat;`:null}function Ba(r,e=0,t=100){let a=mt(r);return a==="band_gradient"?oa(r,e,t,!0):a==="soft_bands"?bt(r,e,t).map(i=>{let n=Me(i.color);return n?{p:i.p,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):r.bar.gradient_stops&&r.bar.gradient_stops.length>=2?r.bar.gradient_stops.map(i=>{let n=Me(i.color);return n?{p:i.pos,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function qa(r){return r?`rgb(${r.r},${r.g},${r.b})`:null}function ra(r){return`linear-gradient(to right,${r} 0%,${r} 100%)`}function Ha(r,e,t=0,a=100){var n;let i=mt(e);if(e.bar.solid_fill)return ra(r);if(i==="bands")return Va(e,t,a);if(i==="soft_bands")return Aa(e,t,a);if(i==="gradient"||i==="band_gradient"){let l=Ba(e,t,a);return(n=La(l))==null?void 0:n.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return ra(r)}function ia(r,e,t){if(!t)return null;let a=Math.min(100,Math.max(0,r)),i=Math.min(100,Math.max(0,e));return i<=a?null:`linear-gradient(to right,transparent 0%,transparent ${a}%,${t} ${a}%,${t} ${i}%,transparent ${i}%,transparent 100%)`}function pt(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function na(r,e=null){let t=Math.min(100,Math.max(0,r));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let a=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,a),end:Math.max(t,a),positive:t>=a,baseline:a,hidden:t===a}}function Oa(r){return r!=null&&r.endpointSemantics?r.endpointSemantics:r!=null&&r.usesBaseline?r.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function Ua(r){let e=Oa(r),t=n=>n==="value"||n==="range"||n==="scale",a=t(e.left)?"6px":"0",i=t(e.right)?"6px":"0";return`${a} ${i} ${i} ${a}`}function Ea(r=null){if(!Number.isFinite(r))return null;let e=Math.min(100,Math.max(0,r));return e>=100?null:{start:e,end:100}}function ja(r=null){let e=Ea(r);return e?{start:e.start,end:e.end,hidden:!1}:null}function Ga(r,e,t=null,a=null,i=0,n=100){var d,u,c,p,h,b;let l=[],s=Ha(e,r,i,n),o=Number.isFinite(a)?Math.min(100,Math.max(0,a)):null;if(Number.isFinite(o)){let m=(c=(u=(d=r.baseline)==null?void 0:d.below)==null?void 0:u.color)!=null?c:null,_=(b=(h=(p=r.baseline)==null?void 0:p.above)==null?void 0:h.color)!=null?b:null,f=ia(0,o,m),y=ia(o,100,_);f&&l.push(f),y&&l.push(y)}return s&&l.push(s),l.length?`display:block;inset:0;background-image:${l.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function Ka(r,e){var u,c;let t=typeof e=="number"?`${e}px`:e,a=Math.min(100,Math.max(0,(u=r==null?void 0:r.start)!=null?u:0)),i=Math.min(100,Math.max(0,(c=r==null?void 0:r.end)!=null?c:0));if(r!=null&&r.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let n="0",l=`${Math.max(0,100-i)}%`,s="0",o=`${a}%`,d=Ua(r);return`display:block;height:${t};clip-path:inset(${n} ${l} ${s} ${o} round ${d});`}function la(r){if(!(r!=null&&r.hidden)&&Number.isFinite(r==null?void 0:r.start)&&Number.isFinite(r==null?void 0:r.end)&&r.end>r.start){let e=Math.min(100,Math.max(0,r.start)),t=Math.min(100,Math.max(0,r.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function Xa(r,e,t,a,i=null,n=null,l=0,s=100){var p,h;let d={id:"base",zIndex:1,visible:!0,paintStyle:Ga(t,a,i,n,l,s),revealStyle:"display:block;"},u=ja(i),c={id:"above-target",zIndex:2,visible:!!((p=t==null?void 0:t.bar)!=null&&p.above_target_color&&u),paintStyle:(h=t==null?void 0:t.bar)!=null&&h.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:la(u||{start:0,end:0,hidden:!0})};return[d,c]}function Ja(r,e,t,a,i=null,n=null,l=0,s=100,o=!1){var c,p;let d=o?na(100,null):na(r,n),u=Xa(d,e,t,a,i,n,l,s);return{geometry:d,paintLayers:u,paintStyle:(p=(c=u[0])==null?void 0:c.paintStyle)!=null?p:"display:none;",revealStyle:Ka(d,e)}}function Zr(r,e,t=0,a=100,i=null){var s,o,d,u,c,p,h,b,m;let n=(s=e==null?void 0:e.bar)==null?void 0:s.needle;if(!(n!=null&&n.show))return{show:!1,pct:null,color:(o=n==null?void 0:n.color)!=null?o:"#ffffff",borderColor:Se((d=n==null?void 0:n.color)!=null?d:"#ffffff"),edge:"middle"};if(Number.isFinite(i))return{show:!1,pct:null,color:(u=n.color)!=null?u:"#ffffff",borderColor:Se((c=n.color)!=null?c:"#ffffff"),edge:"middle"};if(!Number.isFinite(r))return{show:!1,pct:null,color:(p=n.color)!=null?p:"#ffffff",borderColor:Se((h=n.color)!=null?h:"#ffffff"),edge:"middle"};let l=Math.min(100,Math.max(0,pt(r,t,a)));return{show:!0,pct:l,color:(b=n.color)!=null?b:"#ffffff",borderColor:Se((m=n.color)!=null?m:"#ffffff"),edge:l<=0?"left":l>=100?"right":"middle"}}function da(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function Ya({r,g:e,b:t}){let a=r/255,i=e/255,n=t/255,l=Math.max(a,i,n),s=Math.min(a,i,n),o=(l+s)/2;if(l===s)return{h:0,s:0,l:o*100};let d=l-s,u=o>.5?d/(2-l-s):d/(l+s),c;switch(l){case a:c=((i-n)/d+(i<n?6:0))/6;break;case i:c=((n-a)/d+2)/6;break;default:c=((a-i)/d+4)/6;break}return{h:c*360,s:u*100,l:o*100}}function ft(r){let e=da(r);if(!e)return"#f3f4f6";let{h:t,s:a,l:i}=Ya(e),n=Math.abs(i-90)>=Math.abs(i-10)?90:10,l=Math.max(40,Math.min(100,a));return`hsl(${Math.round(t)} ${Math.round(l)}% ${Math.round(n)}%)`}function _e(r){var e;return(e=r==null?void 0:r.color)!=null?e:"#888888"}function Se(r){let e=da(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function _t(r,e,{height:t,color:a=Ta(r.percent,e,r.min,r.max)}={}){var s,o,d,u;let i=r.baselinePercent,n=(s=e.baseline)==null?void 0:s.at,l=((o=e.baseline)==null?void 0:o.enabled)!==!1&&(Number.isFinite(i)||!!(n!=null&&n.entity)||(n==null?void 0:n.fixed)!==null&&(n==null?void 0:n.fixed)!==void 0||Number.isFinite(n==null?void 0:n.percent));return{animated:e.bar.animated,fill:Ja(r.percent,t,e,a,r.targetPercent,i,r.min,r.max,r.needle.show),baseline:{configured:l,percent:i},needle:{...r.needle,configured:((u=(d=e.bar)==null?void 0:d.needle)==null?void 0:u.show)&&!Number.isFinite(i)},markers:r.markers}}var ua=ae(()=>{fe()});function $e(r){var d,u,c,p,h,b,m;if(!r)return"";let e=Number.isFinite(r.position)?r.position:0,t=_e(r),a=ft(t),i=r.visible?"":"none",n=r.type==="target"?"diamond":r.type==="generic"?"circle":"triangle",l=Xt(r.shape,n),s=(d=r.lane)!=null?d:r.type==="peak"?"above":"below",o=`<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;if(r.type==="generic"){let _=s==="above"?["peak-inset","peak-outset"]:["target-inset","target-outset"];return`
    <div class="generic-marker" data-marker-id="${ee(r.id)}" data-shape="${l}" data-lane="${s}" data-direction="${(u=r.direction)!=null?u:"inward"}" data-show-marker="${r.showMarker===!1?"false":"true"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${_[0]}"></div>
      <div class="${_[1]}"></div>
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
    </div>`}function Ne(r,e){var l,s,o,d,u;if(!r||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",a=Xt(e.shape,t);ne(r,"shape",a),ne(r,"lane",(l=e.lane)!=null?l:e.type==="peak"?"above":"below"),ne(r,"direction",(s=e.direction)!=null?s:"inward"),e.type==="generic"&&ne(r,"showMarker",e.showMarker===!1?"false":"true");let i=(o=r.querySelector)==null?void 0:o.call(r,".marker-shape-svg");i&&(ne(i,"shape",a),ne(i,"lane",(d=e.lane)!=null?d:e.type==="peak"?"above":"below"),ne(i,"direction",(u=e.direction)!=null?u:"inward")),Y(r,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&Y(r,"left",`${e.position}%`);let n=_e(e);Y(r,"--marker-color",n),Y(r,"--marker-contrast-color",ft(n))}function ca(r,e,{revealDuration:t=600}={}){var u,c,p;let a=r.querySelector(".bar-fill-reveal"),i=r.querySelector(".baseline-indicator"),n=r.querySelector('.bar-paint-layer[data-layer="base"]');if(a&&(ke(a,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),Ct(a,`bar-fill-reveal${e.animated?"":" no-anim"}`)),i&&(Y(i,"display",Number.isFinite(e.baseline.percent)?"block":"none"),Number.isFinite(e.baseline.percent)&&Y(i,"left",`${e.baseline.percent}%`)),n){let h=e.fill.paintLayers.find(b=>b.id==="base");h&&ke(n,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let l=r.querySelector('.bar-paint-layer[data-layer="above-target"]');if(l){let h=e.fill.paintLayers.find(b=>b.id==="above-target");h&&ke(l,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let s=r.querySelector(".needle-marker");s&&(Y(s,"display",e.needle.show?"block":"none"),Y(s,"left",`${(u=e.needle.pct)!=null?u:0}%`),Y(s,"--needle-color",e.needle.color),Y(s,"--needle-border-color",e.needle.borderColor),ne(s,"edge",e.needle.edge));let o=e.markers,d=h=>{var b;return(b=o.find(m=>m.id===h||m.type===h))!=null?b:null};Ne(r.querySelector(".target-marker"),d("target")),Ne(r.querySelector(".peak-marker"),d("peak")),Ne(r.querySelector(".floor-marker"),d("floor")),((p=(c=r.querySelectorAll)==null?void 0:c.call(r,".generic-marker[data-marker-id]"))!=null?p:[]).forEach(h=>{Ne(h,d(h.dataset.markerId))})}function ha(r,{insideContent:e=""}={}){var h;let t=r.fill,a=r.baseline.percent,i=r.needle,n=r.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(a)?`left:${a}%;display:block;`:"display:none;"}"></div>`:"",l=b=>{var m;return(m=r.markers.find(_=>_.id===b||_.type===b))!=null?m:null},s=$e(l("peak")),o=$e(l("target")),d=$e(l("floor")),u=r.markers.filter(b=>b.type==="generic").map($e).join(""),c=i.configured?`
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
                ${d}
                ${u}
                ${c}
              </div>`}var Za=ae(()=>{Qt();ua();ea()});var vt,Qr=ae(()=>{Mt();fa();fe();$a();Fa();Ia();Qt();ea();Gt();zt();ua();Za();vt=class extends HTMLElement{static async getConfigElement(){return St("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._extrema=new WeakMap,this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._rowGeneration+=1,window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var a;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._rowGeneration+=1;let t=this._config;this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((a=t==null?void 0:t.entities)!=null?a:[]),this._diagnostics=jt(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var u,c,p,h;let t=(b,m="")=>{if(Array.isArray(b))return b.map(t);if(b&&typeof b=="object")return Object.fromEntries(Object.keys(b).sort().filter(_=>!["severity","segment_space","label_precision_key"].includes(_)).map(_=>[_,t(b[_],_)]));if(m==="fixed")return ge(null,b);if(/color/i.test(m)&&typeof b=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(b.trim())){let _=b.trim().slice(1).toLowerCase();return`#${_.length===3?_.split("").map(f=>f+f).join(""):_}`}return b},a=b=>{var m;return JSON.stringify(t({entity:b.entity,name:b.name,icon:(m=b.icon)!=null?m:null,layout:b.layout,scale:Object.fromEntries(["min","max"].map(_=>[_,{...b.scale[_],fixed_explicit:b.scale[_].fixed_explicit!==!1}])),bar:b.bar,baseline:b.baseline,formatting:b.formatting,target_marker:b.target_marker,peak_marker:b.peak_marker,floor_marker:b.floor_marker,generic_markers:b.generic_markers}))},i=new Set(e),n=new Map,l=new Map(e.map(b=>[b,a(b)]));for(let b of this._config.entities){let m=a(b),_=[...i].find(f=>l.get(f)===m);_&&(n.set(b,_),i.delete(_))}let s=this._config.entities.filter(b=>!n.has(b));for(let b of s){let m=[...i].filter(f=>f.entity===b.entity),_=s.filter(f=>f.entity===b.entity);m.length!==1||_.length!==1||(n.set(b,m[0]),i.delete(m[0]))}let o=new WeakMap,d=new WeakMap;for(let[b,m]of n){let _=this._extrema.get(m),f={};for(let y of["peak","floor"]){let v=m[`${y}_marker`],x=b[`${y}_marker`];_!=null&&_[y]&&(v==null?void 0:v.show)===!0&&(x==null?void 0:x.show)===!0&&JSON.stringify(v.reset)===JSON.stringify(x.reset)&&(f[y]={..._[y]})}(f.peak||f.floor)&&o.set(b,f),((c=(u=m.layout)==null?void 0:u.label)==null?void 0:c.position)==="left"&&((h=(p=b.layout)==null?void 0:p.label)==null?void 0:h.position)==="left"&&this._leftModeResponsiveHistory.has(m)&&d.set(b,this._leftModeResponsiveHistory.get(m))}this._extrema=o,this._leftModeResponsiveHistory=d}_logDiagnostics(){var a;let e=(a=this._diagnostics)!=null?a:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}),e.errors.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}))}normalizeCardConfig(e){return Ut(e)}normalizeEntityConfig(e,t){return Ma(e,t)}normalizeResolvableValue(e,t,a=null){return J(e,t,a)}_looksLikeEntityId(e){return re(e)}_parsePercentLiteral(e){return me(e)}_getFiniteNumber(e){return T(e)}normalizeStructuredResolvableValue(e,t=null,a=null,i={}){return be(e,t,a,i)}normalizeBaselineDirectionConfig(e,t=null){return ve(e,t)}normalizeBaselineConfig(e,t){return Dt(e,t)}inferSegmentEndValues(e,t=null){return ta(e,t)}normalizeSeverityToSegments(e){return It(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return nt(e)}normalizeScaleBound(e,t,a,i){return Vt(e,t,a,i)}normalizeScaleConfig(e,t){return Tt(e,t)}_fillStyleToColorMode(e){return ya(e)}_colorModeToFillStyle(e){return dt(e)}_normalizeBarModeConfig(e=null,t=null){return ye(e,t)}_resolveNormalizedBarMode(e,t,a,i){return ga(e,t,a,i)}_normalizeGradientStops(e){return wa(e)}normalizeNeedleConfig(e,t=null){return ka(e,t)}normalizeBarConfig(e,t){return Lt(e,t)}normalizeLayoutConfig(e,t){return Bt(e,t)}_clampSupportedRowHeight(e){return Sa(e)}normalizeFormattingConfig(e,t){return qt(e,t)}normalizeTargetMarkerConfig(e,t){return Ht(e,t)}normalizePeakMarkerConfig(e,t){return Ot(e,t)}_normalizeOptionalEnabled(e){return lt(e)}set hass(e){let t=this._hass;if(this._hass=e,!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var i,n,l,s,o,d,u;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),a=(l=(n=(i=this._hass)==null?void 0:i.states)==null?void 0:n[t.entity])!=null?l:null;return{...t,icon:t.icon===!1?!1:(d=(o=t.icon)!=null?o:(s=a==null?void 0:a.attributes)==null?void 0:s.icon)!=null?d:this._getDefaultEntityIcon(a,t.entity),name:(u=t.name)!=null?u:null}}_getStateTimestamp(e){var i;let t=(i=e==null?void 0:e.last_updated)!=null?i:e==null?void 0:e.last_changed,a=t instanceof Date?t.getTime():Date.parse(String(t!=null?t:""));return Number.isFinite(a)?a:Date.now()}_updateExtrema(e,t,a){var s,o,d;let i=T(a==null?void 0:a.state);if(!Number.isFinite(i))return;let n=(s=this._extrema.get(e))!=null?s:{},l=this._getStateTimestamp(a);for(let u of["peak","floor"]){let c=t==null?void 0:t[`${u}_marker`];if((c==null?void 0:c.show)!==!0){delete n[u];continue}n[u]=Ft((o=n[u])!=null?o:null,i,(d=c.reset)!=null?d:{kind:"never"},u==="floor"?"min":"max",l)}n.peak||n.floor?this._extrema.set(e,n):this._extrema.delete(e)}_getDefaultEntityIcon(e,t=""){var l,s,o;let a=String((s=(l=e==null?void 0:e.attributes)==null?void 0:l.device_class)!=null?s:"").trim();if(a){let d={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(d[a])return d[a]}let i=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[i])!=null?o:null}_shouldUpdate(e,t){var a,i,n,l,s,o,d,u,c,p,h;if(!this._config||!this._config.entities)return!0;for(let b of this._config.entities){let m=this._resolve(b),_=[b.entity,(i=(a=m.scale)==null?void 0:a.min)==null?void 0:i.entity,(l=(n=m.scale)==null?void 0:n.max)==null?void 0:l.entity,(o=(s=m.baseline)==null?void 0:s.at)==null?void 0:o.entity,(u=(d=m.target_marker)==null?void 0:d.source)==null?void 0:u.entity,...((c=m.generic_markers)!=null?c:[]).filter(f=>f.accepted).flatMap(f=>{var y,v;return[(y=f.source)==null?void 0:y.entity,(v=f.label)==null?void 0:v.entity]})].filter(Boolean);for(let f of _){let y=(p=e.states[f])!=null?p:null,v=(h=t.states[f])!=null?h:null;if(y!==v)return!0}}return!1}_setStyleIfChanged(e,t,a){return Y(e,t,a)}_setStyleTextIfChanged(e,t){return ke(e,t)}_setTextIfChanged(e,t){var i;if(!e)return!1;let a=t==null?"":String(t);return((i=e.textContent)!=null?i:"")===a?!1:(e.textContent=a,!0)}_setDatasetIfChanged(e,t,a){return ne(e,t,a)}_setClassNameIfChanged(e,t){return Ct(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,a;((a=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?a:[]).forEach(i=>{let n=i.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${n}"]`,`.generic-marker[data-marker-id="${n}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var i;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let n=e.dataset.markerId;return(i=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(l=>l.dataset.markerId===n))!=null?i:null}let a=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return a?t.querySelector(a):null}_getGenericMarkerForLabel(e){var i,n;let t=e==null?void 0:e.closest(".row"),a=(i=e==null?void 0:e.dataset)==null?void 0:i.markerId;return!t||!a?null:(n=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(l=>l.dataset.markerId===a))!=null?n:null}_setMarkerHover(e){var a;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((a=this._markerHover)==null?void 0:a.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var i,n,l;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),a=(l=t==null?void 0:t.matches)!=null&&l.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._setMarkerHover(a)}_handleMarkerPointerOut(e){var i,n;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let a=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._clearMarkerHover(a)}_positionMarkerValueLabel(e,t,a){let i=e.querySelector(".bar-track"),n=e.querySelector(t),l=e.querySelector(a);if(!i||!n||!l)return;if(l.style.display==="none"||!n.textContent.trim()){this._setStyleIfChanged(n,"visibility","hidden");return}let s=i.getBoundingClientRect(),o=Math.max(0,Math.floor(s.width-4));this._setStyleIfChanged(n,"maxWidth",`${o}px`);let d=n.getBoundingClientRect(),u=parseFloat(l.style.left);if(!Number.isFinite(u)||s.width<=0||d.width<=0||o<=10){this._setStyleIfChanged(n,"visibility","hidden");return}let c=u/100*s.width,p=d.width/2,h=Math.max(p,Math.min(s.width-p,c));this._setStyleIfChanged(n,"left",`${h}px`),this._setStyleIfChanged(n,"transform","translateX(-50%)"),this._setStyleIfChanged(n,"visibility","visible")}_getEntityNumericValue(e){return xe(this._hass,e)}_getNumericValue(e,t=null){return ge(this._hass,e,t)}_resolvePercentValue(e,t,a){return Ra(e,t,a)}_getNormalizedResolvableNumericValue(e,t=null,a=null){return oe(this._hass,e,t,a)}_hexToRgb(e){return Me(e)}_getSeverityInterpolationStops(e,t=0,a=100){return oa(e,t,a)}_getSeverityBandGradientCss(e,t=0,a=100){return Va(e,t,a)}_getSoftBandBlendWidthPct(){return Wa()}_pushGradientColorStop(e,t,a){return ue(e,t,a)}_getSoftBandGradientStops(e,t=0,a=100){return bt(e,t,a)}_getSoftBandGradientCss(e,t=0,a=100){return Aa(e,t,a)}_resolveSegmentBoundaryPct(e,t,a){return aa(e,t,a)}_getEffectiveFillStyle(e){return mt(e)}_segmentsNeedBoundaryResolution(e){return Da(e)}_getSegmentsForRendering(e,t=0,a=100){return Re(e,t,a)}_getColor(e,t,a=0,i=100){return Ta(e,t,a,i)}_buildFullScaleGradientStyle(e){return La(e)}_getGradientInterpolationStops(e,t=0,a=100){return Ba(e,t,a)}_rgbToCss(e){return qa(e)}_buildSolidGradientStyle(e){return ra(e)}_getBasePaintGradient(e,t,a=0,i=100){return Ha(e,t,a,i)}_getOverlayGradient(e,t,a){return ia(e,t,a)}_toScalePct(e,t,a){return pt(e,t,a)}_getRevealTransitionDuration(e,t){return sa(e,t)}_resolveBaselinePct(e,t,a){var n,l;if(((n=e.baseline)==null?void 0:n.enabled)===!1)return null;let i=this._getNormalizedResolvableNumericValue((l=e.baseline)==null?void 0:l.at,t,a);return Number.isFinite(i)?this._toScalePct(i,t,a):null}_formatNumericDisplay(e,t=null){return de(e,t)}_getNormalizedPercent(e,t=null){return na(e,t)}_getEndpointSemantics(e){return Oa(e)}_getRevealCornerRadii(e){return Ua(e)}_getAboveTargetOverlayInterval(e=null){return Ea(e)}_getAboveTargetLayerGeometry(e=null){return ja(e)}_getFullScalePaintStyle(e,t,a=null,i=null,n=0,l=100){return Ga(e,t,a,i,n,l)}_getRevealShapeStyle(e,t){return Ka(e,t)}_getStaticLayerRevealStyle(e){return la(e)}_getFillPaintLayers(e,t,a,i,n=null,l=null,s=0,o=100){return Xa(e,t,a,i,n,l,s,o)}_getFillRenderState(e,t,a,i,n=null,l=null,s=0,o=100,d=!1){return Ja(e,t,a,i,n,l,s,o,d)}_getNeedleRenderState(e,t,a=0,i=100,n=null){return Zr(e,t,a,i,n)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
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
${Rt}
${Nt('.row[data-bar-animated="false"]')}
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
${$t}
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
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==a||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=a,this._applyCompactTier(),a.observe(e),a.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,a){var l,s,o;if(a||!e||!t)return 0;let i=Math.floor((s=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?s:0),n=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(i,8)||!Number.isFinite(n)||n<=0?0:Math.min(n,i*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",a=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let i=["normal","compact","tight","dense","compressed"],n="normal";e<170?n="compressed":e<210?n="dense":e<255?n="tight":e<320&&(n="compact");let l=i.indexOf(n),s=Number.isFinite(a)?a<=44&&e>=205?2:a<=72&&e>=185?1:0:0;return i[Math.max(0,l-s)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var i,n;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(i=this.shadowRoot)==null?void 0:i.querySelector("ha-card"),a=(n=t==null?void 0:t.getBoundingClientRect().width)!=null?n:0;if(!this._isReliableWidth(a)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=e.getBoundingClientRect().width;if(!this._isReliableWidth(a)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(a,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let a=e.querySelector(".label-left-text"),i=((a==null?void 0:a.textContent)||"").trim(),n=a?this._measureTextWidthWithStyles(a,i)||a.scrollWidth:Number.POSITIVE_INFINITY,l=this._classifyLeftDensity(t,e.dataset.leftDensity,n);e.dataset.leftDensity=l})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var k,S,M,g,N,D;let t=e.closest(".bar-track"),a=e.closest(".main-line"),i=e.querySelector(".inside-name"),n=e.querySelector(".inside-value");if(!t||!i||!n)return;let l=this._decodeDataAttr(n.dataset.display||n.textContent||""),s=this._decodeDataAttr(n.dataset.unit||"");n.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(n,l,s,!1),d=this._measureInsideValueMarkupWidth(n,l,s,!0),u=(S=(k=a==null?void 0:a.getBoundingClientRect)==null?void 0:k.call(a).width)!=null?S:0,c=this._isReliableWidth(u)?this._classifyRowDensity(u,(M=a==null?void 0:a.dataset)==null?void 0:M.rowDensity):((g=a==null?void 0:a.dataset)==null?void 0:g.rowDensity)||"normal",p=(D=(N=a==null?void 0:a.querySelector)==null?void 0:N.call(a,".icon-wrap"))!=null?D:null,h=p?this._getLeftModeIconWidth(p,a)+this._getLeftModeGap(a):0,b=this._getLeftModeBarMinWidth(a),m=this._isReliableWidth(u)?Math.max(b,u-h):t.getBoundingClientRect().width,_=this._isReliableWidth(u)?Math.max(b,u):m+h,f=(i.textContent||"").trim(),y=this._measureTextWidthWithStyles(i,f)||i.scrollWidth,v=R=>{let V=c==="compressed"?"compressed":this._classifyInsideDensity(R,o);e.dataset.insideDensity=V,e.dataset.valueFit="normal",n.dataset.valueFit="normal";let W=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),$=Math.max(0,R-W),A=!!s&&o>$,I=A?d:o,L="normal";I>$&&(L="compact",e.dataset.valueFit=L,n.dataset.valueFit=L,$=Math.max(0,R-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),I=this._measureInsideValueMarkupWidth(n,l,s,!0));let B=I>$,q=B?0:this._getNumericStyleValue(e,"gap",0),Z=Math.max(0,Math.min($*(V==="compact"?.56:V==="tight"?.48:.6),$-(B?0:Math.ceil(I))-q)),j=V==="dense"||V==="compressed";if(f&&y>0){let G=this._getInsideUsefulNameWidth(i,f,y),z=this._measureVisibleLabelCharacters(i,f,Z);j=Z<G||y>Z+1&&z<Math.min(4,f.length)}return{density:V,valueFit:L,hideUnit:A,hideValue:B,hideName:j,rank:B?3:L==="compact"?2:A?1:0}},x=c==="dense"||c==="compressed",w=v(x?_:m);if(p&&!x){let R=v(_);(R.rank<w.rank||R.rank===w.rank&&w.hideName&&!R.hideName)&&(x=!0,w=R)}e.dataset.insideDensity=w.density,e.dataset.valueFit=w.valueFit,e.dataset.hideName=w.hideName?"true":"false",n.dataset.valueFit=w.valueFit,n.dataset.hideUnit=w.hideUnit?"true":"false",n.dataset.hideValue=w.hideValue?"true":"false",a&&(a.dataset.hideInsideIcon=x?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var v,x,w,k,S,M,g,N,D,R,V,W,$,A,I;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let a=e.classList.contains("hero-line"),i=a?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,n="normal";if(i<90?n="xs":i<110?n="compressed":i<150?n="dense":i<210?n="tight":i<280&&(n="compact"),a){e.dataset.heroDensity=n,t.dataset.hideName=n==="dense"||n==="compressed"||n==="xs"?"true":"false",e.dataset.hideHeroIcon=n==="compressed"||n==="xs"?"true":"false";return}e.dataset.aboveDensity=n;let l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((v=s==null?void 0:s.dataset)==null?void 0:v.display)||""),d=this._decodeDataAttr(((x=s==null?void 0:s.dataset)==null?void 0:x.unit)||""),u=(w=e.closest)==null?void 0:w.call(e,".row"),c=(k=u==null?void 0:u.querySelector)==null?void 0:k.call(u,".main-line.above-mode"),p=((S=c==null?void 0:c.dataset)==null?void 0:S.rowDensity)||"normal",h=(g=(M=c==null?void 0:c.querySelector)==null?void 0:M.call(c,".icon-wrap"))!=null?g:null,b=(N=h==null?void 0:h.getBoundingClientRect)==null?void 0:N.call(h),m=h&&typeof getComputedStyle=="function"?getComputedStyle(h):null,_=!!h&&p!=="compressed"&&(m==null?void 0:m.display)!=="none"&&((D=b==null?void 0:b.width)!=null?D:0)>0&&((R=b==null?void 0:b.height)!=null?R:0)>0,f=n==="dense"||n==="compressed",y=!_;if(l&&s&&o){let L=(V=e.closest)==null?void 0:V.call(e,".row-stack"),B=(I=(A=(W=L==null?void 0:L.getBoundingClientRect)==null?void 0:W.call(L).width)!=null?A:($=e.getBoundingClientRect)==null?void 0:$.call(e).width)!=null?I:i,q=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,H=_?b.width:0,Z=q?this._getNumericStyleValue(e,"gap",0):0,j=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),G=Math.ceil(this._measureValueMarkupWidth(s,o,d,!1)+2),z=Math.ceil(this._measureValueMarkupWidth(s,o,d,!0)+2),O=(l.textContent||"").trim(),P=_&&H>0?H+Z:0,U=this._measureTextWidthWithStyles(l,O)||l.scrollWidth||0,K=Math.max(0,B-P-j),E=(ie,se=K)=>{let ce=Math.max(0,se-ie),he=this._measureVisibleLabelCharacters(l,O,ce);return!this._shouldHideLeftLabel(O,U,ce,he)},te=Math.max(0,B),X=!1;G<=K&&E(G)?(f=!1,y=!_):G<=te?(f=!E(G,B-j),y=!0):z<=K&&E(z)?(f=!1,X=!!d,y=!_):E(z,B-j)?(f=!1,y=!0,X=!!d):(f=!0,y=!0,X=!!d&&G>te),s.dataset.hideUnit=X?"true":"false"}else s&&(s.dataset.hideUnit="false");t.dataset.hideName=f?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var s,o,d,u,c,p,h,b,m;let t=(s=e==null?void 0:e.closest)==null?void 0:s.call(e,".row"),a=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),i=(d=a==null?void 0:a.querySelector)==null?void 0:d.call(a,".main-line.hero-mode"),n=(u=i==null?void 0:i.querySelector)==null?void 0:u.call(i,".bar-wrap"),l=[(c=t==null?void 0:t.getBoundingClientRect)==null?void 0:c.call(t).width,(p=a==null?void 0:a.getBoundingClientRect)==null?void 0:p.call(a).width,(h=i==null?void 0:i.getBoundingClientRect)==null?void 0:h.call(i).width,(b=n==null?void 0:n.getBoundingClientRect)==null?void 0:b.call(n).width,(m=e==null?void 0:e.getBoundingClientRect)==null?void 0:m.call(e).width];for(let _ of l)if(this._isReliableWidth(_,8))return _;return 0}_measureHeroValueWidth(e,t,a="normal",i=!1){var h,b,m,_,f,y,v,x,w,k,S,M,g,N;let n=(h=this.shadowRoot)==null?void 0:h.querySelector(".measure-layer");if(!n||!e||!t)return 0;let l=this._decodeDataAttr(t.dataset.display||t.textContent||""),s=this._decodeDataAttr(t.dataset.unit||"");if(!l)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=a,o.dataset.hideHeroUnit=i?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((m=(b=e.style)==null?void 0:b.getPropertyValue)==null?void 0:m.call(b,"--sbcp-hero-base-size"))||null);let d=document.createElement("span");d.className="hero-value",d.dataset.display=t.dataset.display||"",d.dataset.unit=t.dataset.unit||"",d.innerHTML=this._formatRightValueMarkup(l,s,i),d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.justifySelf="start",d.style.overflow="visible";let u=d.querySelector(".value-right-text");u&&(u.style.display="inline-flex",u.style.flex="0 0 auto",u.style.width="auto",u.style.minWidth="0",u.style.maxWidth="none",u.style.justifyContent="flex-start",u.style.overflow="visible");let c=d.querySelector(".value-right-number");c&&(c.style.flex="0 0 auto",c.style.minWidth="0",c.style.overflow="visible",c.style.textOverflow="clip");let p=d.querySelector(".unit-group");return p&&(p.style.flex="0 0 auto",p.style.minWidth="0",p.style.overflow="visible"),o.appendChild(d),n.replaceChildren(o),Math.max(Math.ceil((f=(_=d.getBoundingClientRect)==null?void 0:_.call(d).width)!=null?f:0),Math.ceil(d.scrollWidth||0),Math.ceil((x=(v=(y=u==null?void 0:u.getBoundingClientRect)==null?void 0:y.call(u).width)!=null?v:u==null?void 0:u.scrollWidth)!=null?x:0),Math.ceil((S=(k=(w=c==null?void 0:c.getBoundingClientRect)==null?void 0:w.call(c).width)!=null?k:c==null?void 0:c.scrollWidth)!=null?S:0),Math.ceil((N=(g=(M=p==null?void 0:p.getBoundingClientRect)==null?void 0:M.call(p).width)!=null?g:p==null?void 0:p.scrollWidth)!=null?N:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var h,b;let t=e.querySelector(".hero-header"),a=e.querySelector(".hero-label"),i=e.querySelector(".hero-value"),n=e.querySelector(".unit-group");if(!t||!i)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let l=Math.floor((b=(h=t.getBoundingClientRect)==null?void 0:h.call(t).width)!=null?b:0);if(!this._isReliableWidth(l,8)){this._schedulePostLayoutDensityPass();return}let s=!!n&&n.textContent.trim().length>0,o=t.dataset.hideName==="true",d=!o&&a?this._getNumericStyleValue(t,"column-gap",0):0,u=(m="normal",_=!1)=>this._measureHeroValueWidth(e,i,m,_),c=Math.max(0,l-d-4),p=Math.max(0,l-4);if(!this._isReliableWidth(p,8)){e.dataset.hideHeroUnit=s?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(u("normal",!1)<=c)&&!(!o&&a&&(t.dataset.priorityHideName="true",u("normal",!1)<=p))){if(s){for(let m of["tight","minimum"]){let _=u(m,!1);if(_<=p){if(e.dataset.heroValueFit=m,!o&&a){let f=(a.textContent||"").trim(),y=this._measureTextWidthWithStyles(a,f),v=Math.max(0,c-_);this._shouldHideLeftLabel(f,y,v,this._measureVisibleLabelCharacters(a,f,v))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",u("normal",!0)<=p)return}e.dataset.heroValueFit="tight",!(u("tight",s)<=p)&&(e.dataset.heroValueFit="minimum",!(u("minimum",s)<=p)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,a,i){var s;let n=(s=this.shadowRoot)==null?void 0:s.querySelector(".measure-layer");if(!n||!e)return 0;let l=e.cloneNode(!1);return l.removeAttribute("data-hide-unit"),l.style.removeProperty("--sbcp-value-extra-width"),l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.innerHTML=this._formatRightValueMarkup(t,a,i),n.replaceChildren(l),l.scrollWidth}_measureInsideValueMarkupWidth(e,t,a,i=!1){var o;let n=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!n||!e)return(e==null?void 0:e.scrollWidth)||0;let l=e.cloneNode(!1);l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.style.overflow="visible",l.style.textOverflow="clip",l.style.whiteSpace="nowrap",l.innerHTML=this._formatInsideValueMarkup(t,a,i),l.removeAttribute("data-hide-value");let s=document.createElement("div");return s.className="bar-inner-label",s.style.cssText="position:static;display:block;padding:0",s.appendChild(l),n.replaceChildren(s),l.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var n;let a=(n=this.shadowRoot)==null?void 0:n.querySelector(".measure-layer");if(!a||!e)return 0;let i=e.cloneNode(!1);return i.textContent=t,i.style.width="auto",i.style.minWidth="0",i.style.maxWidth="none",i.style.flex="0 0 auto",i.style.overflow="visible",i.style.textOverflow="clip",i.style.whiteSpace="nowrap",a.replaceChildren(i),i.scrollWidth}_measureVisibleLabelCharacters(e,t,a){if(!e||!t||!Number.isFinite(a)||a<=0)return 0;let i=this._measureTextWidthWithStyles(e,"..."),n=Math.max(0,a-i);if(n<=0)return 0;let l=0,s=t.length;for(;l<s;){let o=Math.ceil((l+s)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=n?l=o:s=o-1}return l}_shouldHideLeftLabel(e,t,a,i){return!e||!Number.isFinite(t)||!Number.isFinite(a)?!1:t>a+1&&i<5}_getInsideUsefulNameWidth(e,t,a=NaN){if(!t)return 0;let i=Number.isFinite(a)&&a>0?a:this._measureTextWidthWithStyles(e,t),n=t.slice(0,Math.min(5,t.length)),l=this._measureTextWidthWithStyles(e,n)+this._measureTextWidthWithStyles(e,"..."),s=Math.max(36,Math.min(44,l||0));return Math.min(i||s,s)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var c,p,h,b,m;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let i=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((h=(p=(c=e==null?void 0:e.ownerDocument)==null?void 0:c.defaultView)==null?void 0:p.getComputedStyle)==null?void 0:h.bind(e.ownerDocument.defaultView));if(!i)return;let n=i(e),l=parseFloat(n.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,s=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2),o=e.closest(".main-line"),d=s;if(o!=null&&o.classList.contains("off-mode")){let _=o.querySelector(".bar-wrap"),f=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(i(o).gap)||0,v=(m=(b=o.getBoundingClientRect)==null?void 0:b.call(o).width)!=null?m:0,x=parseFloat(i(_).minWidth)||0,w=f&&i(f).display!=="none",k=w?this._getLeftModeIconWidth(f,o):0,S=Math.max(0,v-x-y),M=S-(w?k+y:0),g=Math.ceil(this._measureValueMarkupWidth(e,t,a,!0)+2),N=w&&(s>M&&s<=S||g>M&&g<=S);o.dataset.hideOffIcon=N?"true":"false";let D=N?S:M;if(D>0){let R=s<=D?s:g;d=Math.min(R,D)}}let u=Math.max(0,d-l);e.style.setProperty("--sbcp-value-extra-width",`${u}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var l,s,o,d;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!((l=e.classList)==null?void 0:l.contains("above-bar-label-value"))&&t){let u=(d=(o=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?o:e.clientWidth)!=null?d:0,c=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);i=a&&u>0?c>u:!1,e.dataset.hideUnit=i?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,a,i)&&(e.innerHTML=this._formatRightValueMarkup(t,a,i))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let l=this._formatInsideValueMarkup(t,a,i);e.innerHTML!==l&&(e.innerHTML=l)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,a=0){if(!e)return a;try{let i=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(i)?i:a}catch(i){return a}}_getLeftModeGap(e){var i;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.rowDensity)||"normal";return a==="tight"?7:a==="dense"||a==="compressed"?6:8}_getLeftModeBarMinWidth(e){var i;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.leftDensity)||"normal";return a==="compact"?52:a==="tight"?48:a==="dense"?44:a==="compressed"?40:56}_getLeftModeIconWidth(e,t){var l,s;let a=(l=e==null?void 0:e.getBoundingClientRect)==null?void 0:l.call(e).width;if(this._isReliableWidth(a,1))return a;let i=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(i))return i;let n=((s=t==null?void 0:t.dataset)==null?void 0:s.leftDensity)||"normal";return n==="compact"?26:n==="tight"?24:n==="dense"?23:n==="compressed"?22:28}_getReservedInlineValueWidth(e){var d,u,c;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),n=parseFloat(((u=(d=e.style)==null?void 0:d.getPropertyValue)==null?void 0:u.call(d,"--sbcp-value-extra-width"))||((c=e.style)==null?void 0:c["--sbcp-value-extra-width"])||"0"),l=Number.isFinite(n)?n:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),s=Math.max(0,i+l);if(!t)return s;let o=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);return Math.max(s,o)}_getStableLeftLabelMetrics(e,t=null){var b,m,_,f,y,v,x,w,k,S;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".label-left-text");if(!a||!i||!n)return null;let l=(m=t!=null?t:(b=a.getBoundingClientRect)==null?void 0:b.call(a).width)!=null?m:0,s=(n.textContent||"").trim(),o=this._measureTextWidthWithStyles(n,s)||n.scrollWidth||0,d=((_=a.dataset)==null?void 0:_.leftDensity)||"normal",u={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},c=(y=(f=this._config)==null?void 0:f.entities)==null?void 0:y.find(M=>{var g;return M.entity===((g=e.dataset)==null?void 0:g.entity)}),p=c&&(k=(w=(x=(v=this._resolve(c))==null?void 0:v.layout)==null?void 0:x.label)==null?void 0:w.width)!=null?k:100,h=l>0?Math.min(p,l*((S=u[d])!=null?S:u.normal)):Math.min(o,p);return{text:s,naturalWidth:o,maximumWidth:h,labelWidth:h,labelText:n}}_estimateLeftModeWidthBudget(e){var w,k,S;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let a=(k=(w=t.getBoundingClientRect)==null?void 0:w.call(t).width)!=null?k:0;if(!this._isReliableWidth(a))return null;let i=e.querySelector(".label-left"),n=e.querySelector(".icon-wrap"),l=e.querySelector(".value-right"),s=this._getStableLeftLabelMetrics(e,a),o=(S=s==null?void 0:s.labelWidth)!=null?S:0,d=n?this._getLeftModeIconWidth(n,t):0,u=this._getReservedInlineValueWidth(l),c=this._getLeftModeGap(t),p=this._getLeftModeBarMinWidth(t),h=!!i,b=!!n,m=b?2:1,_=Math.max(0,a-(b?d:0)-p-m*c),f=Math.min(o,_),y=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,f,this._measureVisibleLabelCharacters(s.labelText,s.text,f)),v=Math.min(o,Math.max(0,a-p-c)),x=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,v,this._measureVisibleLabelCharacters(s.labelText,s.text,v));return{rowWidth:a,gap:c,barMinWidth:p,labelSacrificialWithoutIcon:x,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(d,0)?d:0,valueWidth:this._isReliableWidth(u,0)?u:0,baseLabelVisible:h,labelSacrificial:y,hasIcon:b,mainLine:t,iconWrap:n,valueEl:l,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,a=null){let i=a||this._estimateLeftModeWidthBudget(e);if(!i)return null;let n=i.baseLabelVisible&&!t.hideLabel,l=i.hasIcon&&!t.hideIcon,s=!t.topValue,o=1+(l?1:0)+(n?1:0)+(s?1:0),d=Math.max(0,o-1),u=(l?i.iconWidth:0)+(n?i.labelWidth:0)+(s?i.valueWidth:0)+d*i.gap,c=Math.max(0,i.rowWidth-u),p=c>=i.barMinWidth,h=p?c:i.barMinWidth;return{rowWidth:i.rowWidth,barWidth:h,share:h/i.rowWidth,showLabel:n,showIcon:l,showInlineValue:s,reservedWidth:u,gapCount:d,fits:p}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,a){let i=null;for(let n of t){let l=this._predictLeftModeBarShareForState(e,n,a);l&&(i={...n,predicted:l})}return i}_chooseLeftModeResponsiveState(e,t=!0){var c,p,h,b;let a=this._estimateLeftModeWidthBudget(e);if(!a)return null;let i=this._getMinimumBarShare(),n=this._getLeftModeCandidateStates(a),l=(p=this._config.entities)==null?void 0:p[Number((c=e==null?void 0:e.dataset)==null?void 0:c.rowIndex)],s=l&&this._leftModeResponsiveHistory.has(l)?this._leftModeResponsiveHistory.get(l):((b=(h=a.rowStack)==null?void 0:h.dataset)==null?void 0:b.forceTopValue)==="true",o=n.filter(m=>m.topValue),d=this._getTopValueEnableShare(),u=this._getTopValueDisableShare();for(let m of n){let _=m.topValue||t?i:s?u:d,f=this._predictLeftModeBarShareForState(e,m,a);if(f!=null&&f.fits&&f.share>=_)return{...m,predicted:f}}return this._chooseFallbackPredictedLeftModeState(e,o,a)}_applyLeftModeResponsiveState(e,t){var s,o;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".row-stack"),n=e==null?void 0:e.querySelector(".label-left");if(!a||!i)return;let l=(o=this._config.entities)==null?void 0:o[Number((s=e==null?void 0:e.dataset)==null?void 0:s.rowIndex)];l&&this._leftModeResponsiveHistory.set(l,(t==null?void 0:t.topValue)===!0),delete i.dataset.forceTopValue,delete a.dataset.hideLeftIcon,n&&delete n.dataset.priorityHidden,t!=null&&t.hideLabel&&n&&(n.dataset.priorityHidden="true"),t!=null&&t.topValue&&(i.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(a.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".bar-track");if(!t||!a)return null;let i=t.getBoundingClientRect().width,n=a.getBoundingClientRect().width;return!this._isReliableWidth(i)||!this._isReliableWidth(n,1)?null:{rowWidth:i,barWidth:n,share:n/i,mainLine:t,track:a}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".row-stack"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".above-bar-label"),l=e==null?void 0:e.querySelector(".bar-inner-label"),s=e==null?void 0:e.querySelector(".above-line");a&&delete a.dataset.forceTopValue,i&&delete i.dataset.priorityHidden,n&&delete n.dataset.priorityHideName,l&&delete l.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let a=e.querySelector(".label-left");a&&(a.dataset.priorityHidden="true");return}if(t==="above"){let a=e.querySelector(".above-bar-label");a&&(a.dataset.priorityHideName="true");return}if(t==="inside"){let a=e.querySelector(".bar-inner-label");a&&(a.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let a=e.querySelector(".row-stack");a&&(a.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let a=e.querySelector(".main-line");if(a){if(t==="left"){a.dataset.hideLeftIcon="true";return}if(t==="above"){a.dataset.hideAboveIcon="true";let i=e.querySelector(".above-line");i&&(i.dataset.hideAboveIcon="true");return}t==="inside"&&(a.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,a){var n,l,s,o,d,u,c,p,h,b;let i=(o=(s=a==null?void 0:a.rowWidth)!=null?s:(l=(n=e==null?void 0:e.querySelector(".main-line"))==null?void 0:n.getBoundingClientRect)==null?void 0:l.call(n).width)!=null?o:0;if(!this._isReliableWidth(i))return null;if(t==="left"){let m=e.querySelector(".label-left"),_=e.querySelector(".label-left-text");if(!m||!_)return null;let f=(_.textContent||"").trim(),y=_.clientWidth,v=_.scrollWidth,x=this._measureVisibleLabelCharacters(_,f,y),w=(u=(d=m.getBoundingClientRect)==null?void 0:d.call(m).width)!=null?u:y;return{text:f,visibleWidth:y,fullWidth:v,visibleChars:x,labelWidth:w,rowWidth:i}}if(t==="above"){let m=e.querySelector(".above-bar-label-name");if(!m)return null;let _=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,v=this._measureVisibleLabelCharacters(m,_,f),x=(p=(c=m.getBoundingClientRect)==null?void 0:c.call(m).width)!=null?p:f;return{text:_,visibleWidth:f,fullWidth:y,visibleChars:v,labelWidth:x,rowWidth:i}}if(t==="inside"){let m=e.querySelector(".inside-name");if(!m)return null;let _=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,v=this._measureVisibleLabelCharacters(m,_,f),x=(b=(h=m.getBoundingClientRect)==null?void 0:h.call(m).width)!=null?b:f;return{text:_,visibleWidth:f,fullWidth:y,visibleChars:v,labelWidth:x,rowWidth:i}}return null}_isLabelWorthSacrificing(e,t,a){let i=this._getLabelSacrificeMetrics(e,t,a);return!i||!i.text?!1:this._shouldHideLeftLabel(i.text,i.fullWidth,i.visibleWidth,i.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let a=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),i=this._getMinimumBarShare();a.forEach(n=>{let l=n.querySelector(".main-line");if(!l)return;let s=l.classList.contains("left-mode")?"left":l.classList.contains("above-mode")?"above":l.classList.contains("inside-mode")?"inside":"other";if(s==="other")return;if(s==="left"){let d=!t||t.get(l)===l.getBoundingClientRect().width,u=this._chooseLeftModeResponsiveState(n,d);u&&this._applyLeftModeResponsiveState(n,u),d||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(n);let o=this._getMeasuredBarShare(n);!o||o.share>=i||this._isLabelWorthSacrificing(n,s,o)&&(this._hideMinimumBarShareLabel(n,s),o=this._getMeasuredBarShare(n),!o||o.share>=i)||(this._forceMinimumBarShareTopValue(n,s),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(n),!(!o||o.share>=i)&&this._hideMinimumBarShareIcon(n,s))})}_shouldUseTopValueRow(e){var t,a,i;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((i=(a=e.closest)==null?void 0:a.call(e,".row-stack"))==null?void 0:i.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,a){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(a)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),a=e.querySelector(".row-stack");if(!t)return;let i=parseFloat(e.dataset.baseHeight||"38")||38,n=e.dataset.heightExplicit==="true",l=this._getEffectiveRowHeight(i,n,t);e.style.setProperty("--sbcp-row-height",`${l}px`),a&&a.style.setProperty("--sbcp-row-height",`${l}px`),t.style.height=`${l}px`;let s=t.querySelector(".label-left");s&&(s.style.height=`${l}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${l}px`,o.style.minHeight=`${l}px`);let d=t.querySelector(".bar-track");d&&(d.style.height=`${l}px`);let u=t.querySelector(".value-right");u&&(u.style.height=`${l}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var c,p,h,b,m;let t=e.closest(".row-stack"),a=e.querySelector(".value-right"),i=t==null?void 0:t.querySelector(".top-right-value");if(!t||!a||!i)return;let n=this._shouldUseTopValueRow(e);t.dataset.topValue=n?"true":"false",i.dataset.active=n?"true":"false";let l=this._decodeDataAttr(a.dataset.display||""),s=this._decodeDataAttr(a.dataset.unit||"");i.dataset.display=a.dataset.display||"",i.dataset.unit=a.dataset.unit||"",i.dataset.hideUnit="false";let o=(m=(b=(h=(c=t.getBoundingClientRect)==null?void 0:c.call(t).width)!=null?h:(p=i.getBoundingClientRect)==null?void 0:p.call(i).width)!=null?b:i.clientWidth)!=null?m:0,d=l?Math.ceil(this._measureValueMarkupWidth(i,l,s,!1)+2):0,u=!!s&&o>0&&d>o;i.dataset.hideUnit=u?"true":"false",i.innerHTML=this._formatRightValueMarkup(l,s,u)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var s;let t=e.querySelector(".label-left"),a=e.querySelector(".label-left-text");if(!t||!a)return;let i=((s=e.closest)==null?void 0:s.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?a:null},n=this._getStableLeftLabelMetrics(i);if(!n)return;let l=this._measureVisibleLabelCharacters(n.labelText,n.text,n.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(n.text,n.naturalWidth,n.labelWidth,l)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var i;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let a=new Map([...((i=this.shadowRoot)==null?void 0:i.querySelectorAll(".main-line.left-mode"))||[]].map(n=>[n,n.getBoundingClientRect().width]));requestAnimationFrame(()=>{var l;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,a),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((l=this.shadowRoot)==null?void 0:l.querySelectorAll(".row[data-entity]"))||[]).forEach(s=>{this._positionTargetLabel(s),this._positionMarkerValueLabel(s,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(s,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(s)})})})}_isTightUnit(e){return za(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(a){return t}}_parseColorToRgb(e){return da(e)}_rgbToHsl({r:e,g:t,b:a}){return Ya({r:e,g:t,b:a})}_getMarkerContrastColor(e){return ft(e)}_getEffectiveMarkerColor(e){return _e(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return Se(e)}_formatDisplayWithUnit(e,t){return Pa(e,t)}_formatRightValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="value-right-text"><span class="value-right-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="${this._isTightUnit(n)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${i}</span><span class="unit-group"><span class="unit">${l}</span></span></span>`}_formatAboveValueMarkup(e,t,a=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${a?"true":"false"}">${this._formatRightValueMarkup(e,t,a)}</span>`}_formatInsideValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="inside-value-text"><span class="inside-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="inside-value-text ${this._isTightUnit(n)?"tight-unit":"has-unit"}"><span class="inside-number">${i}</span><span class="inside-unit">${l}</span></span>`}_getRowMarkerModels(e,t,a,i,n,l,s,o){if(e!=null&&e.markers)return e.markers.map(p=>{var h,b;return p.type==="target"?{...p,position:n===void 0?p.position:n,visible:n!=null,color:o||p.color,label:(h=p.label)!=null?h:l===null?null:{text:l}}:p.type==="floor"||p.type!=="peak"?p:{...p,position:a===void 0?p.position:a,visible:a!=null&&t.peak_marker.show===!0,color:s||p.color,label:(b=p.label)!=null?b:i===null?null:{text:i}}});let d=Zt({entityConfig:t,targetPosition:n,targetPresentation:l===null?null:{text:l},targetVisible:Number.isFinite(n),peakPosition:a,peakPresentation:i===null?null:{number:i},peakVisible:Number.isFinite(a)}),u=this._getMarkerModel(d,"target"),c=this._getMarkerModel(d,"peak");return u&&o&&(u.color=o),c&&s&&(c.color=s),d}_getMarkerModel(e,t){var a;return(a=e.find(i=>i.id===t||i.type===t))!=null?a:null}_renderMarker(e){return $e(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),Ne(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let a=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",a),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(a))}_buildRowViewModel(e,t,a){var n;let i=ht({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:a,extrema:(n=this._extrema.get(e))!=null?n:null,previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:i.min,max:i.max}),i}_buildRow(e,t,a,i,n,l,s,o,d,u,c,p,h,b=(_=>(_=(m=>(m=this._config.entities)==null?void 0:m.indexOf(e))())!=null?_:-1)()){var Fe,ze,Pe,Ie,Ve,We,Ae,De,Te,Le,Be,qe,He,Oe,Ue,Ee,je,Ge,Ke,Xe,Je,Ye,Ze,Qe,Ce,et;let f=this._resolve(e),y=(Pe=(ze=(Fe=this._hass)==null?void 0:Fe.states)==null?void 0:ze[e.entity])!=null?Pe:null;y&&this._updateExtrema(e,f,y);let v=y?this._buildRowViewModel(e,f,y):null,x=f.layout,w=f.bar,k=Number.isFinite(p)?p:0,S=Number.isFinite(h)?h:100,M=(Ie=v==null?void 0:v.baselinePercent)!=null?Ie:this._resolveBaselinePct(f,k,S),g=x.label.position,N=(We=(Ve=v==null?void 0:v.attributes)==null?void 0:Ve.baseHeight)!=null?We:x.height,D=(Le=(Te=(Ae=v==null?void 0:v.name)!=null?Ae:f.name)!=null?Te:(De=y==null?void 0:y.attributes)==null?void 0:De.friendly_name)!=null?Le:e.entity,R=ee((Be=v==null?void 0:v.entityId)!=null?Be:e.entity),V=ee(D),W=this._getRowMarkerModels(v,f,l,s,o,d,u,c),$=this._getMarkerModel(W,"target"),A=this._getMarkerModel(W,"peak"),I=this._getMarkerModel(W,"floor"),L=W.filter(C=>C.type==="generic"),B=(qe=v==null?void 0:v.markerLaneOccupancy)!=null?qe:Jt(f),q=(He=v==null?void 0:v.markerLabelLaneOccupancy)!=null?He:Yt(f),H=(Oe=v==null?void 0:v.numericValue)!=null?Oe:this._getFiniteNumber(t),Z=(Ue=v==null?void 0:v.needle)!=null?Ue:this._getNeedleRenderState(H,f,k,S,M),j=_t({percent:i,min:k,max:S,targetPercent:o,baselinePercent:M,needle:Z,markers:W},f,{height:"var(--sbcp-row-height)",color:n}),G=$!=null&&$.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite($.position)?$.position:0}%;visibility:${$.visible&&((Ee=$.label)!=null&&Ee.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle($)}">
        ${(je=$.label)!=null&&je.text?ee($.label.text):""}
      </div>`:"",z=A!=null&&A.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(A.position)?A.position:0}%;visibility:${A.visible&&((Ge=A.label)!=null&&Ge.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(A)}">
        ${A.visible&&((Ke=A.label)!=null&&Ke.text)?ee(A.label.text):""}
      </div>`:"",O=I!=null&&I.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(I.position)?I.position:0}%;visibility:${I.visible&&((Xe=I.label)!=null&&Xe.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(I)}">
        ${I.visible&&((Je=I.label)!=null&&Je.text)?ee(I.label.text):""}
      </div>`:"",P=L.filter(C=>C.labelVisible).map(C=>{var tt,at;return`
      <div class="generic-value-label" data-marker-id="${ee(C.id)}" data-lane="${C.lane}" data-show-marker="${C.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(C.position)?C.position:0}%;visibility:${C.visible&&((tt=C.label)!=null&&tt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(C)}">
        ${C.visible&&((at=C.label)!=null&&at.text)?ee(C.label.text):""}
      </div>`}).join(""),U=g==="above"?`
      <div class="above-line">
        ${f.icon&&f.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${V}</span>
          ${this._formatAboveValueMarkup(t,a,!1)}
        </div>
      </div>`:"",K=(Ye=x.hero.size)!=null?Ye:"small",E=x.hero.value_size,te=g==="hero"?`
      <div class="hero-line" data-hero-size="${K}"${Number.isFinite(E)?` style="--sbcp-hero-base-size:${E}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${V}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}">${this._formatRightValueMarkup(t,a,!1)}</span>
        </div>
      </div>`:"",X=g==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${V}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,a,!1)}</span>
      </div>`:"",ie=g==="left"?`<div class="label-left" style="flex:0 1 min(${x.label.width}px, var(--sbcp-left-label-share));max-width:min(${x.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${V}</span></div>`:"",se=g!=="inside"&&g!=="above"&&g!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",ce=g==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",he=f.icon&&f.icon!==!1?ee(f.icon):"",xt=he&&g!=="hero"?`<div class="icon-wrap"><ha-icon icon="${he}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${b}" data-entity="${R}" data-base-height="${N}" data-height-explicit="${((Qe=(Ze=v==null?void 0:v.attributes)==null?void 0:Ze.heightExplicit)!=null?Qe:x.height_explicit)?"true":"false"}" data-bar-animated="${((et=(Ce=v==null?void 0:v.attributes)==null?void 0:Ce.barAnimated)!=null?et:w.animated)?"true":"false"}" data-marker-label-lane-above="${q.above?"true":"false"}" data-marker-label-lane-below="${q.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${N}px;">
          ${U}
          ${te}
          ${ce}
          <div class="main-line ${g}-mode" data-marker-lane-above="${B.above?"true":"false"}" data-marker-lane-below="${B.below?"true":"false"}" style="height:${N}px;">
            ${xt}
            ${ie}
            <div class="bar-wrap">
              ${ha(j,{insideContent:X})}
              ${z}
              ${G}
              ${O}
              ${P}
            </div>
            ${se}
          </div>
        </div>
      </div>`}_patchRow(e,t,a,i=null){var $,A,I,L,B,q,H,Z,j,G;if(!e||!a)return;let n=this._resolve(t);this._updateExtrema(t,n,a);let l=this._rowScales.get(t),s=this._buildRowViewModel(t,n,a),o=s.min,d=s.max,u=s.percent,c=this._getColor(u,n,o,d),p=s.primaryPresentation.number,h=s.primaryPresentation.unit,b=s.baselinePercent,m=_t(s,n,{height:"var(--sbcp-row-height)",color:c}),_=(A=($=i==null?void 0:i.states)==null?void 0:$[t.entity])!=null?A:null,f=_?ht({hass:i,cardConfig:this._config,entityConfig:n,entityState:_,extrema:(I=this._extrema.get(t))!=null?I:null,previousScale:l}):null,y=this._getRevealTransitionDuration(f&&Number.isFinite(f.numericValue)?{valuePercent:f.percent,baselinePercent:f.baselinePercent}:null,Number.isFinite(s.numericValue)?{valuePercent:u,baselinePercent:b}:null),v=(L=this._markerHover)==null?void 0:L.marker;if(v&&e.contains(v)){let z=m.markers.find(O=>O.type==="generic"?v.dataset.markerId===O.id:v.matches(`.${O.type}-marker`));z&&!z.visible&&this._clearMarkerHover(v)}ca(e,m,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",s.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",s.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",s.attributes.barAnimated?"true":"false");let x=e.querySelector(".value-right");x&&(x.dataset.display=this._encodeDataAttr(p),x.dataset.unit=this._encodeDataAttr(h),x.dataset.hideUnit="false",x.innerHTML=this._formatRightValueMarkup(p,h,!1));let w=e.querySelector(".top-right-value");w&&(w.dataset.display=this._encodeDataAttr(p),w.dataset.unit=this._encodeDataAttr(h),w.dataset.hideUnit="false",w.innerHTML=this._formatRightValueMarkup(p,h,!1));let k=e.querySelector(".bar-inner-label");if(k){let z=k.querySelector(".inside-value");z&&(z.dataset.display=this._encodeDataAttr(p),z.dataset.unit=this._encodeDataAttr(h),z.dataset.hideUnit="false",z.dataset.hideValue="false",z.innerHTML=this._formatInsideValueMarkup(p,h,!1))}let S=e.querySelector(".hero-header");if(S){let z=e.querySelector(".hero-line");this._setStyleIfChanged(z,"--sbcp-hero-base-size",Number.isFinite(n.layout.hero.value_size)?`${n.layout.hero.value_size}px`:null),S.innerHTML=`<span class="hero-label label-left-text">${ee(s.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(p)}" data-unit="${this._encodeDataAttr(h)}">${this._formatRightValueMarkup(p,h,!1)}</span>`}let M=S?null:e.querySelector(".above-bar-label");M&&(M.innerHTML=`<span class="above-bar-label-name label-left-text">${ee(s.name)}</span>${this._formatAboveValueMarkup(p,h,!1)}`);let g=e.querySelector(".target-value-label"),N=e.querySelector(".peak-value-label"),D=e.querySelector(".floor-value-label"),R=(B=s.markers)!=null?B:[];((H=(q=e.querySelectorAll)==null?void 0:q.call(e,".generic-marker[data-marker-id]"))!=null?H:[]).forEach(z=>{var K,E,te,X,ie;let O=z.dataset.markerId,P=this._getMarkerModel(R,O),U=[...(E=(K=e.querySelectorAll)==null?void 0:K.call(e,".generic-value-label[data-marker-id]"))!=null?E:[]].find(se=>se.dataset.markerId===O);U&&(this._setDatasetIfChanged(U,"showMarker",(P==null?void 0:P.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(U,P),P!=null&&P.labelVisible&&P.visible&&((te=P.label)!=null&&te.text)?(this._setTextIfChanged(U,(ie=(X=P.label)==null?void 0:X.text)!=null?ie:null),this._setStyleIfChanged(U,"visibility","visible"),this._setStyleIfChanged(U,"left",`${Number.isFinite(P.position)?P.position:0}%`)):this._setStyleIfChanged(U,"visibility","hidden"))});let V=this._getMarkerModel(R,"target");this._patchMarkerLabelAppearance(g,V),g&&(V!=null&&V.labelVisible&&V.visible&&((Z=V.label)!=null&&Z.text)?this._setTextIfChanged(g,(G=(j=V.label)==null?void 0:j.text)!=null?G:null):this._setStyleIfChanged(g,"visibility","hidden"));let W=(z,O)=>{var U,K,E;if(!z)return;let P=this._getMarkerModel(R,O);this._patchMarkerLabelAppearance(z,P),P!=null&&P.labelVisible&&P.visible&&((U=P.label)!=null&&U.text)?(this._setTextIfChanged(z,(E=(K=P.label)==null?void 0:K.text)!=null?E:null),this._setStyleIfChanged(z,"visibility","visible"),this._setStyleIfChanged(z,"left",`${Number.isFinite(P.position)?P.position:0}%`)):this._setStyleIfChanged(z,"visibility","hidden")};W(N,"peak"),W(D,"floor")}_update(e=null){var s,o,d,u;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let a=this._config.entities,i=a.map(c=>!!this._hass.states[c.entity]),n=i.some((c,p)=>c!==this._rowPresence[p]);if(!this._rendered||n){this._rowGeneration+=1,this._rowPresence=i;let c="";for(let h=0;h<a.length;h++){let b=a[h],m=this._hass.states[b.entity];if(!m){c+=`<div class="row" data-row-index="${h}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${ee(b.entity)}</span></div>`;continue}let _=this._resolve(b);this._updateExtrema(b,_,m);let f=this._buildRowViewModel(b,_,m),y=f.min,v=f.max,x=f.percent,w=this._getColor(x,_,y,v),k=f.primaryPresentation.number,S=f.primaryPresentation.unit,M=f.targetPercent,g=(o=(s=f.targetPresentation)==null?void 0:s.text)!=null?o:null,N=f.peakPercent,D=(u=(d=f.peakPresentation)==null?void 0:d.number)!=null?u:null;c+=this._buildRow(b,k,S,x,w,N,D,M,g,_.peak_marker.color,_.target_marker.color,y,v,h)}this._clearMarkerHover(),t.innerHTML=c,this._rendered=!0;let p=t.querySelectorAll(".row[data-entity]");p.forEach(h=>{let b=a[Number(h.dataset.rowIndex)],m=b?this._hass.states[b.entity]:null;b&&m&&this._patchRow(h,b,m)}),this._runPostLayoutPasses(p),p.forEach(h=>{h.addEventListener("click",()=>{let b=h.dataset.entity,m=new CustomEvent("hass-more-info",{composed:!0,detail:{entityId:b}});this.dispatchEvent(m)})});return}let l=t.querySelectorAll(".row[data-entity]");for(let c of l){let p=a[Number(c.dataset.rowIndex)];if(!p)continue;let h=this._hass.states[p.entity];h&&this._patchRow(c,p,h,e)}this._runPostLayoutPasses(l)}}});function Qa(r,e={}){let t=e.above?10:0,a=e.below?10:0,i=Math.max(0,r-t-a);return{above:t,below:a,railHeight:i,aboveY:0,belowY:r-9,compactGlyphs:t>0||a>0}}function Cr(r,e,t){let a=[];for(let i of["above","below"]){let n=r.filter(l=>{var s,o;return l.lane===i&&l.visible&&l.labelVisible&&Number.isFinite(l.position)&&((o=(s=l.label)==null?void 0:s.text)==null?void 0:o.trim())}).map(l=>({marker:l,anchor:Math.max(0,Math.min(100,l.position))*e/100})).sort((l,s)=>l.anchor-s.anchor);n.forEach(({marker:l,anchor:s},o)=>{var _;let d=o?(n[o-1].anchor+s)/2+2:0,u=o+1<n.length?(s+n[o+1].anchor)/2-2:e,c=Math.max(0,u-d),p=l.label,h=p.text,b="full",m=t(h)+4;if(m>c&&(h=[p.showValue!==!1?p.number:"",p.showUnit!==!1?p.unit:""].filter(Boolean).join(" "),b="value",m=h?t(h)+4:1/0,!h&&!p.number&&!p.unit)){let f=Array.from((_=p.semanticText)!=null?_:"");for(;f.length>=3;){if(h=`${f.join("").trimEnd()}\u2026`,m=t(h)+4,m<=c){b="text";break}f.pop()}}!h||m>c||e<=0?a.push({id:l.id,lane:i,mode:"hidden",text:"",left:0,width:0}):a.push({id:l.id,lane:i,mode:b,text:h,left:Math.max(d,Math.min(s-m/2,u-m)),width:m})})}return a}var ei=ae(()=>{});function ti(r,e){return re(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var yt,ai=ae(()=>{Mt();fe();Fa();Ia();ua();Za();fa();zt();Gt();ea();ei();yt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._extrema={},this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static async getConfigElement(){return St("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!re(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._requestUpdate()}get hass(){return this._hass}set context(e){this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._requestUpdate()}disconnectedCallback(){this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var n,l,s,o,d,u,c;let e=((n=this._config)==null?void 0:n.entity)||((l=this._context)==null?void 0:l.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._extrema={},this._scaleHistory=null,this._sampleState=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?Ut({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e}]:[]}):null,this._diagnostics=jt(this._normalized));let t=(o=(s=this._hass)==null?void 0:s.states)==null?void 0:o[e],a=null,i=this._config?e?this._hass?t?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured";if(t&&((d=this._normalized)!=null&&d.entities[0])){let p=this._normalized.entities[0],h=T(t.state);if(h!==null&&(t!==this._sampleState||h!==this._sampleValue)){this._sampleState=t,this._sampleValue=h;let b=(u=t.last_updated)!=null?u:t.last_changed,m=b instanceof Date?b.getTime():Date.parse(String(b!=null?b:"")),_=Number.isFinite(m)?m:Date.now();for(let f of["peak","floor"]){let y=p[`${f}_marker`];y.show&&(this._extrema[f]=Ft(this._extrema[f],h,(c=y.reset)!=null?c:{kind:"never"},f==="peak"?"max":"min",_))}}a=ht({hass:this._hass,entityConfig:p,entityState:t,extrema:this._extrema,previousScale:this._scaleHistory}),this._scaleHistory={min:a.min,max:a.max},a.numericValue===null&&(i=t.state==="unknown"?"Unknown":t.state==="unavailable"?"Unavailable":"Not numeric")}this._row=a,this._status=i,this._render(a,i),this._previousRow=i?null:a}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${Rt}
        ${$t}
        ${Nt('.surface[data-bar-animated="false"]')}
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
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var u,c;this._ensureDom(),typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!t,this._statusEl.hidden=!t,this._statusEl.textContent=t!=null?t:"",this._surface.dataset.state=t?"unavailable":"numeric";let a=(u=e==null?void 0:e.markerLabelLaneOccupancy)!=null?u:{},i=Qa(0,a);Y(this._surface,"--label-above",`${i.above}px`),Y(this._surface,"--label-below",`${i.below}px`),this._syncLabels(e,t);let n=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",l=((c=e==null?void 0:e.markers)!=null?c:[]).filter(p=>p.visible&&(p.showMarker||p.labelVisible)).map(p=>{var m;let h=p.type==="generic"?"Reference marker":`${p.type[0].toUpperCase()}${p.type.slice(1)}`,b=`${de(p.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${h} at ${b}${p.labelVisible&&((m=p.label)!=null&&m.text)?`; label ${p.label.text}`:""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${n}${this._entity&&n!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:`${n} (${this._entity}): ${e.primaryPresentation.text}. Range ${de(e.min)} to ${de(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${l?` ${l}`:""}`),t)return;let s=_t(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});s.animated=s.animated&&!!this._previousRow,this._surface.dataset.barAnimated=s.animated?"true":"false";let o=JSON.stringify(s),d=JSON.stringify([s.baseline.configured,s.needle.configured,s.markers.map(p=>[p.type,p.id])]);d!==this._structureKey?(this._bar.innerHTML=ha(s),this._structureKey=d):o!==this._barRenderKey&&ca(this._bar,s,{revealDuration:sa(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=o,this._labelAnimated=s.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var l,s,o;let a=((l=e==null?void 0:e.markers)!=null?l:[]).filter(d=>d.labelVisible),i=new Set(a.map(d=>d.id));for(let[d,u]of this._labelNodes)i.has(d)||(u.remove(),this._labelNodes.delete(d));for(let d of a){if(!this._labelNodes.has(d.id)){let c=document.createElement("span");c.className="compact-marker-label",c.dataset.markerId=d.id,c.hidden=!0,this._labels.append(c),this._labelNodes.set(d.id,c)}let u=this._labelNodes.get(d.id);u.dataset.lane=d.lane,Y(u,"--marker-color",_e(d))}if(this._labels.hidden=!!t,!(((s=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:s.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let d=this._labelFonts;d.ready.then(()=>{this._labelFonts===d&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var s,o,d,u;let{width:e,height:t}=this._surface.getBoundingClientRect(),a=Qa(t,(s=this._row)==null?void 0:s.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(a.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let i=Cr((u=(d=this._row)==null?void 0:d.markers)!=null?u:[],e,c=>this._labelMeasure.measureText(c).width),n=JSON.stringify([e,t,a.above,a.below,this._labelMeasure.font,i.map(c=>[c.id,c.lane,c.mode,c.width])]),l=this._labelAnimated&&!this._snapLabels&&n===this._labelLayoutKey;for(let c of this._labelNodes.values())c.hidden=!0;for(let c of i){let p=this._labelNodes.get(c.id);p.hidden=c.mode==="hidden",p.dataset.mode=c.mode,p.textContent!==c.text&&(p.textContent=c.text),Y(p,"transition",l?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),Y(p,"left",`${c.left}px`),Y(p,"width",`${c.width}px`)}this._labelLayoutKey=n,this._snapLabels=!1}}});var qi=si(()=>{Qr();ai();Mt();Ir(vt,yt);for(let[r,e]of[["sensor-bar-card-plus",vt],["sensor-bar-card-plus-feature",yt]])customElements.get(r)||customElements.define(r,e);window.customCards=window.customCards||[];window.customCards.some(r=>r.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(r=>r.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:ti,configurable:!0})});export default qi();
