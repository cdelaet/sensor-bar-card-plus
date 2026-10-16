var ae=(r,e,t)=>()=>{if(t)throw t[0];try{return r&&(e=r(r=0)),e}catch(a){throw t=[a],a}};var gi=(r,e)=>()=>{try{return e||r((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function Or(r,e){wa=[r,e]}function ka(){if(!wa||Si.some((r,e)=>customElements.get(r)!==wa[e]))throw new Error(ga);if(nt&&it.some((r,e)=>customElements.get(r)!==nt[e]))throw new Error(ga)}async function $i(){if(!Dr)throw new Error("Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.");let r=new URL(wi,import.meta.url);r.searchParams.set("sbcp_build",ki),qr++&&r.searchParams.set("sbcp_retry","1");let e;try{e=await import(r.href)}catch(a){throw new Error(Mi)}if(e.buildIdentity!==Dr)throw new Error(Lr);ka();let t=[e.SensorBarCardPlusEditor,e.SensorBarCardPlusFeatureEditor];if(t.some(a=>typeof a!="function"||!(a.prototype instanceof HTMLElement))||t[0]===t[1])throw new Error(Lr);if(it.some((a,i)=>{let n=customElements.get(a);return n&&(!nt||n!==nt[i]||n!==t[i])}))throw new Error(ga);for(let a=0;a<it.length;a++)customElements.get(it[a])||customElements.define(it[a],t[a]);nt=t}async function Nt(r){if(ka(),!Rt){if(qr>=2)throw Br;Rt=$i().catch(e=>{throw Br=e,Rt=void 0,e})}return await Rt,ka(),document.createElement(r)}var Dr,wi,ki,it,Si,Lr,ga,Mi,wa,nt,Rt,qr,Br,Ft=ae(()=>{Dr="d5a805f1b1f4de724d58b7d65af6a4da27b20597dc5cf9043f17956206b87864",wi="./sensor-bar-card-plus-editor.js",ki="49d10086d83c37e5124fa712bb105fa021c9f958da3510fc2fb29ab6ebd658c3",it=["sensor-bar-card-plus-editor","sensor-bar-card-plus-feature-editor"],Si=["sensor-bar-card-plus","sensor-bar-card-plus-feature"],Lr="Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.",ga="Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.",Mi="Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.",qr=0});function At(r){return`
        ${r} .bar-fill-reveal,
        ${r} .needle-marker,
        ${r} .target-marker,
        ${r} .peak-marker,
        ${r} .floor-marker,
        ${r} .generic-marker,
        ${r} .baseline-indicator {
          transition: none;
        }
`}var zt,Pt,Sa=ae(()=>{zt=`
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
`,Pt=`
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

`});function Ri(r,e){if(!(r instanceof Date)||Number.isNaN(r.getTime()))return null;let t=r.getFullYear(),a=r.getMonth(),i=r.getDate(),n=r.getHours();if(e==="quarterly")return new Date(t,a,i,n,Math.floor(r.getMinutes()/15)*15,0,0).getTime();if(e==="hourly")return new Date(t,a,i,n,0,0,0).getTime();if(e==="daily")return new Date(t,a,i,0,0,0,0).getTime();if(e==="weekly"){let l=(r.getDay()+6)%7;return new Date(t,a,i-l,0,0,0,0).getTime()}return e==="monthly"?new Date(t,a,1,0,0,0,0).getTime():e==="yearly"?new Date(t,0,1,0,0,0,0).getTime():null}function Ur(r){if(r===void 0&&(r="never"),typeof r!="string")return{kind:"never"};let e=r.trim().toLowerCase();if(e==="never")return{kind:"never"};if(Hr.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let a=Number(t[1]),i=t[2];return!Number.isInteger(a)||a<1||i==="m"&&a>59||i==="h"&&a>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:a}:{kind:"duration",hours:a}}function Er(r){if(typeof r!="string")return!1;let e=r.trim().toLowerCase();if(e==="never"||Hr.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let a=Number(t[1]);return Number.isInteger(a)&&a>=1&&(t[2]==="m"?a<=59:a<=23)}function jr(r,e){if((r==null?void 0:r.kind)!=="calendar")return null;let t=Ri(new Date(e),r.unit);return Number.isFinite(t)?String(t):null}function Ni(r){return(r==null?void 0:r.kind)!=="duration"?null:Number.isInteger(r.minutes)?r.minutes*60*1e3:Number.isInteger(r.hours)?r.hours*60*60*1e3:null}function Ma(r,e,t){return(e==null?void 0:e.kind)==="duration"?{value:r,startedAtMs:Number.isFinite(t)?t:null,windowKey:null}:(e==null?void 0:e.kind)==="calendar"?{value:r,startedAtMs:null,windowKey:jr(e,t)}:{value:r,startedAtMs:null,windowKey:null}}function It(r,e,t,a,i){if(!Number.isFinite(e))return r!=null?r:null;let n=Ni(t);if(!r||n!==null&&Number.isFinite(r.startedAtMs)&&Number.isFinite(i)&&i-r.startedAtMs>=n)return Ma(e,t,i);if((t==null?void 0:t.kind)==="calendar"){let s=jr(t,i);if(s!==null&&s!==r.windowKey)return Ma(e,t,i)}return(a==="min"?e<r.value:e>r.value)?{...r,value:e}:r}var Hr,Vt=ae(()=>{Hr=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function Tt(r){return typeof r=="string"&&r!==""?r:null}function Xr(r){return r!=null&&r!==""&&typeof r!="string"}function X(r,e,t=null,a=null){let i={fixed:r!=null?r:null,entity:e!=null?e:null};Number.isFinite(t)&&(i.percent=t);let n=Tt(a);return n!==null&&(i.attribute=n),Xr(a)&&(i.attribute_invalid=!0),i}function ie(r){return typeof r=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(r.trim())}function me(r){if(typeof r!="string")return null;let e=r.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function D(r){if(typeof r=="number")return Number.isFinite(r)?r:null;if(typeof r=="string"){let e=r.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function de(r,e=null,t=null,a={}){var l,s,o,u,d;let{allowPercent:i=!1}=a,n=e!=null?e:X(t,null);if(r===void 0)return{...n};if(r===null)return X(null,null);if(typeof r=="object"&&!Array.isArray(r)){let c=(s=(l=r.fixed)!=null?l:r.value)!=null?s:null,b=r.entity,h=null,p=null,f=!1;if(b!=null&&b!=="")if(typeof b=="string")h=b.trim(),h&&!ie(h)&&(h=null,f=!0);else if(b&&typeof b=="object"&&!Array.isArray(b)){let y=Object.keys(b),_=b.id,g=Object.prototype.hasOwnProperty.call(b,"attribute");typeof _!="string"||!ie(_.trim())||g&&(typeof b.attribute!="string"||!b.attribute.trim())||y.some(x=>!["id","attribute"].includes(x))?f=!0:(h=_.trim(),g&&(p=b.attribute.trim()))}else f=!0;Object.prototype.hasOwnProperty.call(r,"attribute")&&(f=!0,h=null,p=null);let v=i?D(r.percent):null,m=X(c,h,v,p);return f&&(m.entity_invalid=!0),m}if(ie(r))return X((u=(o=n.fixed)!=null?o:t)!=null?u:null,r,(d=n.percent)!=null?d:null);if(i){let c=me(r);if(Number.isFinite(c))return X(null,null,c)}return X(r,null)}function Fi(r){var e;return!!r&&(D((e=r.fixed)!=null?e:r.value)!==null||Number.isFinite(r.percent)||!!r.entity)}function Yr(r,e){var a,i,n,l;let t={above:((a=e==null?void 0:e.peak_marker)==null?void 0:a.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&Fi((l=e==null?void 0:e.target_marker)==null?void 0:l.source)?1:0)};return r.map(s=>{let o=s.valid&&t[s.lane]<4;return o&&(t[s.lane]+=1),{...s,accepted:o}})}function Jr(r,e=null){if(!Array.isArray(r))return{markers:[],invalidList:r!==void 0};let t=r.map((a,i)=>{var L;if(!a||typeof a!="object"||Array.isArray(a))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=a.at,l=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),s=typeof n=="string"?n.trim():n,o=de(s,null,null,{allowPercent:!0}),u=n&&typeof n=="object"&&n.entity!==void 0?o.entity:typeof s=="string"&&ie(s)?s:null,d=o.entity_invalid===!0||u!=null&&u!==""&&!ie(u),c=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&D(n.fixed)===null,b=!!o.entity||D(o.fixed)!==null||Number.isFinite(o.percent),h=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),p=n!=null&&!l&&!d&&!c&&b&&!h,f=a.lane===void 0?"below":a.lane,v=f==="above"||f==="below",m=["circle","diamond","triangle","chevron","arrow","pin"],y=a.shape===void 0||m.includes(a.shape),_=ut(a.direction),g=a.direction!==void 0&&!["inward","outward"].includes(typeof a.direction=="string"?a.direction.trim().toLowerCase():""),x=a.label&&typeof a.label=="object"&&!Array.isArray(a.label)?a.label:{},S=qt(x),k=x.entity,w=k&&typeof k=="object"&&!Array.isArray(k)?k:null,M=typeof k=="string"?k.trim():typeof(w==null?void 0:w.id)=="string"?w.id.trim():"",F=w==null?void 0:w.attribute,R=k!=null&&k!==""&&!ie(M)||w&&(Object.keys(w).some(I=>!["id","attribute"].includes(I))||Object.prototype.hasOwnProperty.call(w,"attribute")&&(typeof F!="string"||!F.trim()))||Object.prototype.hasOwnProperty.call(x,"attribute"),$=M&&ie(M)&&!R?M:null,P=typeof a.show_marker=="boolean"?a.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:v?f:null,shape:y&&(L=a.shape)!=null?L:"circle",direction:_,invalidDirection:g,showMarker:P,invalidShowMarker:a.show_marker!==void 0&&typeof a.show_marker!="boolean",color:typeof a.color=="string"&&a.color.trim()?a.color:"#888888",label:{show:x.show===!0,text:S.label_text,entity:$,...Tt(F)!==null?{attribute:Tt(F)}:{},showValue:S.label_show_value,showUnit:S.label_show_unit,precision:S.label_precision,invalidShow:S.label_invalid_show,invalidText:S.label_invalid_text,invalidShowValue:S.label_invalid_show_value,invalidShowUnit:S.label_invalid_show_unit,invalidPrecision:S.label_invalid_precision,invalidPrecisionKey:S.label_precision_key,unsupportedUnit:S.label_unsupported_unit,invalidEntity:R},valid:p&&v,invalidSource:!p,invalidPercentage:h,unsupportedPercentField:l,invalidLane:!v,invalidShape:!y,accepted:!1}});return{markers:Yr(t,e),invalidList:!1}}function ye(r,e=null){var a;let t=e!=null?e:{color:null};return r===void 0?{...t}:r===null?{color:null}:typeof r=="object"&&!Array.isArray(r)?{color:(a=r.color)!=null?a:null}:{color:r}}function st(r){return r===!0?!0:r===!1?!1:null}function Ot(r,e){var n;let t=e==null?void 0:e.baseline,a=r==null?void 0:r.baseline,i={enabled:st(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:X(null,null),above:ye(void 0,t==null?void 0:t.above),below:ye(void 0,t==null?void 0:t.below)};return a===void 0?i:a===null?{enabled:null,at:X(null,null),above:{color:null},below:{color:null}}:typeof a!="object"||Array.isArray(a)?{enabled:i.enabled,at:de(a,i.at,null),above:i.above,below:i.below}:{enabled:(n=st(a.enabled))!=null?n:i.enabled,at:de(a.at,i.at,null,{allowPercent:!0}),above:ye(a.above,i.above),below:ye(a.below,i.below)}}function zi(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function Dt(r){if(!Array.isArray(r))return null;let e=r.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var a;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(a=t.label)!=null?a:null}});return zi(e,100)}function Gr(r,e=null){var a;if(r===void 0)return{value:null,issue:null};if(r===null)return{value:null,issue:"malformed"};if(r&&typeof r=="object"&&!Array.isArray(r)){if(r.entity!==void 0&&r.entity!==null&&r.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(r,"percent")){let n=D(r.percent);return Number.isFinite(n)?{value:X(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=D((a=r.fixed)!=null?a:r.value);return Number.isFinite(i)?{value:X(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof r=="string"){let i=r.trim();if(ie(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=me(i);return Number.isFinite(n)?{value:X(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=D(r);return Number.isFinite(t)?e==="percent"?{value:X(null,null,t),issue:null}:{value:X(t,null),issue:null}:{value:null,issue:"malformed"}}function lt(r,e={}){if(!Array.isArray(r))return null;let{legacySegmentSpace:t=null}=e,a=r.map(i=>{var s,o;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:Gr(i.from,t),l=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:Gr(i.to,t);return i!=null&&i.color?{from:n.value,to:l.value,invalidBoundary:(s=n.issue)!=null?s:l.issue,color:i.color,label:(o=i.label)!=null?o:null}:null}).filter(Boolean);return a.map((i,n)=>{var s;let l=a.slice(n+1).find(o=>!o.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:l!=null&&l.from?{...l.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(s=i.label)!=null?s:null}})}function Lt(r,e,t,a){var f,v,m,y,_,g,x,S,k,w,M,F;let i=e==null?void 0:e.scale,n=r==null?void 0:r.scale,l=`${t}_entity`,s=i==null?void 0:i[t],o=s?Object.prototype.hasOwnProperty.call(s,"fixed_explicit")?X((v=(f=s.fixed)!=null?f:s.value)!=null?v:null,(m=s.entity)!=null?m:null,(y=s.percent)!=null?y:null,s.attribute):de(s):X((_=e==null?void 0:e[t])!=null?_:a,(g=e==null?void 0:e[l])!=null?g:null),u=s?s.fixed_explicit!==!1&&s.fixed!==null&&s.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,d=(R,$)=>(Object.defineProperty(R,"fixed_explicit",{value:$}),R);if((n==null?void 0:n[t])!==void 0){let R=n[t],$=ie(R)?u:typeof R=="object"&&R!==null?((x=R.fixed)!=null?x:R.value)!==null&&((S=R.fixed)!=null?S:R.value)!==void 0:R!==null;return d(de(n[t],o,a),$)}let c=r[l],b=c!=null,h=(w=(k=r[t])!=null?k:b?null:o.fixed)!=null?w:o.entity?null:a,p=(M=c!=null?c:o.entity)!=null?M:null;return d(X(h,p,(F=o.percent)!=null?F:null,o.attribute),r[t]!==null&&r[t]!==void 0||!b&&u)}function Ht(r,e){return{min:Lt(r,e,"min",0),max:Lt(r,e,"max",100)}}function Ra(r){switch(r){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function dt(r){switch(r){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function Bt(r,e){return r!=null&&Object.prototype.hasOwnProperty.call(r,e)}function Pi(r){return[Bt(r,"color")?r.color:void 0,Bt(r==null?void 0:r.bar,"color")?r.bar.color:void 0].some(t=>t!=null)}function ot(r){let e=r==null?void 0:r.bar,t=[[r,"color_mode"],[e,"color_mode"],[e,"fill_style"],[r,"severity"],[r,"segments"],[e,"segments"],[r,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Pi(r),paint:t.some(([a,i])=>Bt(a,i))}}function xe(r=null,e=null){var n,l,s,o,u,d;let t=(n=r==null?void 0:r.fill_style)!=null?n:null,a=(s=(l=r==null?void 0:r.color_mode)!=null?l:e)!=null?s:null,i=(u=(o=Ra(t))!=null?o:a)!=null?u:"severity";return{fill_style:(d=t!=null?t:dt(i))!=null?d:"bands",color_mode:i}}function Fa(r,e,t,a,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:l=!1}={}){let s=(i==null?void 0:i.color)===!0&&i.paint!==!0,o=(n==null?void 0:n.paint)===!0;return s&&(l||!o)?xe({fill_style:"solid"},null):(r==null?void 0:r.fill_style)!==void 0||(r==null?void 0:r.color_mode)!==void 0||e.color_mode!==void 0?xe(r,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(a==null?void 0:a.color_mode)!==void 0?xe(t,a==null?void 0:a.color_mode):xe(null,null)}function za(r){return Array.isArray(r)?r.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=me(e.pos),a=Number.isFinite(t)?t:D(e.pos);return{...e,pos:Number.isFinite(a)?a:e.pos}}):r!=null?r:null}function Pa(r,e=null){var a,i,n,l;let t=e?{show:(a=e.show)!=null?a:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return r===void 0?{...t}:typeof r=="boolean"?{show:r,color:"#ffffff"}:r&&typeof r=="object"&&!Array.isArray(r)?{show:(n=r.show)!=null?n:t.show,color:(l=r.color)!=null?l:t.color}:{...t}}function Ut(r,e,t={}){var S,k,w,M,F,R,$,P,L,I,T,z,V,B,j,J,Z,O,q,A,H,W,U,G,E,te,Q;let a=(S=t.scopeExplicitness)!=null?S:ot(r),i=(w=(k=t.inheritedExplicitness)!=null?k:e==null?void 0:e[Na])!=null?w:ot(e),n=(M=t.isCardScope)!=null?M:e==null,l=e==null?void 0:e.bar,s=r==null?void 0:r.bar,o=Bt(l,$a)?l[$a]:["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:null,u=["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:o,d=s==null?void 0:s.segments,c=r.segments,b=r.severity,h=(F=l==null?void 0:l.segments)!=null?F:null,p=(R=e==null?void 0:e.segments)!=null?R:null,f=($=e==null?void 0:e.severity)!=null?$:null,v=null,m=(l==null?void 0:l.segment_space)==="percent"||(l==null?void 0:l.segment_space)==="scale"?l.segment_space:null;d!=null?(m=u,v=lt(d,{legacySegmentSpace:m})):c!=null?v=lt(c):b!=null?(v=Dt(b),m="percent"):h!=null?v=h.map(re=>({...re})):p!=null?v=lt(p):f!=null&&(v=Dt(f),m="percent");let y=r!=null&&r.target&&typeof r.target=="object"&&!Array.isArray(r.target)?(P=r.target.when_exceeded)==null?void 0:P.fill_color:void 0,_=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(L=e.target.when_exceeded)==null?void 0:L.fill_color:void 0,g=Fa(s,r,l,e,{scopeExplicitness:a,inheritedExplicitness:i,isCardScope:n}),x={fill_style:g.fill_style,color_mode:g.color_mode,needle:Pa(s==null?void 0:s.needle,l==null?void 0:l.needle),solid_fill:(T=(I=s==null?void 0:s.solid_fill)!=null?I:l==null?void 0:l.solid_fill)!=null?T:!1,color:(j=(B=(V=(z=s==null?void 0:s.color)!=null?z:r.color)!=null?V:l==null?void 0:l.color)!=null?B:e==null?void 0:e.color)!=null?j:"#4a9eff",gradient_stops:za((q=(O=(Z=(J=s==null?void 0:s.gradient_stops)!=null?J:r.gradient_stops)!=null?Z:l==null?void 0:l.gradient_stops)!=null?O:e==null?void 0:e.gradient_stops)!=null?q:null),severity:v,segments:v,segment_space:m,animated:(U=(W=(H=(A=s==null?void 0:s.animated)!=null?A:r.animated)!=null?H:l==null?void 0:l.animated)!=null?W:e==null?void 0:e.animated)!=null?U:!0,above_target_color:(Q=(te=(E=(G=y!=null?y:r.above_target_color)!=null?G:l==null?void 0:l.above_target_color)!=null?E:_)!=null?te:e==null?void 0:e.above_target_color)!=null?Q:null};return Object.defineProperty(x,$a,{value:u}),x}function Aa(r){return Math.max(24,r)}function Ai(r,e="left"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function Ii(r,e="medium"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Vi(r){return Number.isFinite(r)?Math.min(112,Math.max(12,r)):null}function Et(r,e){var h,p,f,v,m,y,_,g,x,S,k,w,M,F,R,$,P,L,I,T,z,V,B,j,J;let t=e==null?void 0:e.layout,a=r==null?void 0:r.layout,i=a==null?void 0:a.label,n=a==null?void 0:a.hero,l=t==null?void 0:t.label,s=t==null?void 0:t.hero,o=!e,u=(v=(f=(p=(h=a==null?void 0:a.height)!=null?h:r.height)!=null?p:t==null?void 0:t.height)!=null?f:e==null?void 0:e.height)!=null?v:38,d=(a==null?void 0:a.height)!==void 0||r._height_explicit===!0||!o&&r.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,c=Ai((g=(_=(y=(m=i==null?void 0:i.position)!=null?m:r.label_position)!=null?y:l==null?void 0:l.position)!=null?_:t==null?void 0:t.label_position)!=null?g:e==null?void 0:e.label_position,"left"),b=c==="hero"?Vi((x=n==null?void 0:n.value_size)!=null?x:s==null?void 0:s.value_size):null;return{label:{position:c,width:(F=(M=(w=(k=(S=i==null?void 0:i.width)!=null?S:r.label_width)!=null?k:l==null?void 0:l.width)!=null?w:t==null?void 0:t.label_width)!=null?M:e==null?void 0:e.label_width)!=null?F:100},hero:{size:Ii((J=(j=(B=(V=(z=(T=(I=(L=(P=($=(R=n==null?void 0:n.size)!=null?R:i==null?void 0:i.hero_size)!=null?$:i==null?void 0:i.heroSize)!=null?P:r.hero_size)!=null?L:r.heroSize)!=null?I:s==null?void 0:s.size)!=null?T:l==null?void 0:l.hero_size)!=null?z:l==null?void 0:l.heroSize)!=null?V:t==null?void 0:t.hero_size)!=null?B:t==null?void 0:t.heroSize)!=null?j:e==null?void 0:e.hero_size)!=null?J:e==null?void 0:e.heroSize,"medium"),value_size:b},height:Aa(u),height_explicit:d}}function jt(r,e){var i,n,l,s,o,u,d,c;let t=e==null?void 0:e.formatting,a=r==null?void 0:r.formatting;return{decimal:(s=(l=(n=(i=a==null?void 0:a.decimal)!=null?i:r.decimal)!=null?n:t==null?void 0:t.decimal)!=null?l:e==null?void 0:e.decimal)!=null?s:null,unit:(c=(d=(u=(o=a==null?void 0:a.unit)!=null?o:r.unit)!=null?u:t==null?void 0:t.unit)!=null?d:e==null?void 0:e.unit)!=null?c:null}}function Kr(r){let e=String(r!=null?r:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function ut(r){return(typeof r=="string"?r.trim().toLowerCase():"")==="outward"?"outward":"inward"}function qt(r,e={}){var c,b,h;let t=r&&typeof r=="object"&&!Array.isArray(r)?r:{},a=Object.prototype.hasOwnProperty.call(t,"text"),i=a&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),l=Object.prototype.hasOwnProperty.call(t,"decimal"),s=n?t.precision:t.decimal,o=n||l,u=o?D(s):(c=e.label_precision)!=null?c:null,d=o&&s!==null&&s!==""&&!(Number.isInteger(u)&&u>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(b=e.label_show_value)!=null?b:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(h=e.label_show_unit)!=null?h:!0,label_precision:d?null:u,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:a&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:d,label_precision_key:d?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function Wt(r){let e={};return r.label_text!==null&&r.label_text!==void 0&&(e.label_text=r.label_text),r.label_show_value===!1&&(e.label_show_value=!1),r.label_show_unit===!1&&(e.label_show_unit=!1),r.label_precision!==null&&r.label_precision!==void 0&&(e.label_precision=r.label_precision),r.label_invalid_text&&(e.label_invalid_text=!0),r.label_invalid_show_value&&(e.label_invalid_show_value=!0),r.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),r.label_invalid_show&&(e.label_invalid_show=!0),r.label_invalid_precision&&(e.label_invalid_precision=!0),r.label_invalid_precision&&r.label_precision_key&&(e.label_precision_key=r.label_precision_key),r.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function Zr(r){return r!==void 0&&!["inward","outward"].includes(typeof r=="string"?r.trim().toLowerCase():"")}function Gt(r,e){var b,h,p,f,v,m,y,_,g,x,S,k,w,M,F,R,$,P,L,I,T,z,V,B,j,J,Z,O,q,A,H,W,U,G,E,te,Q;let t=e==null?void 0:e.target_marker,a=r==null?void 0:r.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(b=e==null?void 0:e.target)!=null?b:null,n=t?{...t,shape:Kr(t.shape),direction:ut(t.direction)}:{enabled:null,source:X(null,null),color:(h=e==null?void 0:e.target_color)!=null?h:"#888",show_label:(p=e==null?void 0:e.show_target_label)!=null?p:!1,...Wt(qt((f=e==null?void 0:e.target)==null?void 0:f.label)),label_decimal:(x=(g=(m=(v=e==null?void 0:e.target)==null?void 0:v.label)==null?void 0:m.precision)!=null?g:(_=(y=e==null?void 0:e.target)==null?void 0:y.label)==null?void 0:_.decimal)!=null?x:null,shape:"diamond",direction:"inward"};if(a&&typeof a=="object"&&!Array.isArray(a)){let re=qt(a.label,n),ne={enabled:(k=(S=st(a.enabled))!=null?S:n.enabled)!=null?k:null,source:de(a.at,n.source,null,{allowPercent:!0}),color:(M=(w=a.color)!=null?w:r.target_color)!=null?M:n.color,show_label:($=(R=(F=a.label)==null?void 0:F.show)!=null?R:r.show_target_label)!=null?$:n.show_label,shape:Object.prototype.hasOwnProperty.call(a,"shape")?Kr(a.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(a,"direction")?ut(a.direction):n.direction,...Zr(a.direction)?{direction_invalid:!0}:{},...Wt(re)},le=re.label_precision;return le!=null&&(ne.label_decimal=le,ne.label_precision=le),ne}let l=(z=(T=(L=r.target)!=null?L:(P=n.source)==null?void 0:P.fixed)!=null?T:(I=n.source)==null?void 0:I.value)!=null?z:i,s=(J=(j=(B=r.target_entity)!=null?B:(V=n.source)==null?void 0:V.entity)!=null?j:e==null?void 0:e.target_entity)!=null?J:null,o=r.target===void 0&&r.target_entity===void 0&&(O=(Z=n.source)==null?void 0:Z.percent)!=null?O:null,u=r.target===void 0&&r.target_entity===void 0&&(A=(q=n.source)==null?void 0:q.attribute)!=null?A:null,d={enabled:(H=n.enabled)!=null?H:null,source:X(l,s,o,u),color:(G=(U=(W=r.target_color)!=null?W:n.color)!=null?U:e==null?void 0:e.target_color)!=null?G:"#888",show_label:(Q=(te=(E=r.show_target_label)!=null?E:n.show_label)!=null?te:e==null?void 0:e.show_target_label)!=null?Q:!1,shape:n.shape,direction:n.direction,...Wt(n)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Wi(r,e){let t=r==null?void 0:r[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let a=r==null?void 0:r[`${e}_marker`];return a&&typeof a=="object"&&!Array.isArray(a)?a:null}function Ti(r,e){var n,l,s;let t=r==null?void 0:r.label,a=t&&typeof t=="object"&&!Array.isArray(t),i=qt(t,e);return{show:a&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(s=(l=i.label_precision)!=null?l:e.label_decimal)!=null?s:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function Qr(r,e,t,a={}){var m,y,_,g,x,S,k,w,M;let{legacy:i=!1,defaultColor:n="#888888"}=a,l=e==null?void 0:e[`${t}_marker`],s=Wi(r,t),o=l!=null?l:{show:i&&(m=e==null?void 0:e.show_peak)!=null?m:!1,color:i&&(y=e==null?void 0:e.peak_color)!=null?y:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},u=s&&Object.prototype.hasOwnProperty.call(s,"reset"),d=u?s.reset:void 0,c=u?Ur(d):(_=o.reset)!=null?_:{kind:"never"},b=s==null?void 0:s.label,h=Ti(s,o),p={show:(S=(x=(g=s==null?void 0:s.enabled)!=null?g:i?r.show_peak:void 0)!=null?x:o.show)!=null?S:!1,color:(M=(w=(k=s==null?void 0:s.color)!=null?k:i?r.peak_color:void 0)!=null?w:o.color)!=null?M:n,direction:s&&Object.prototype.hasOwnProperty.call(s,"direction")?ut(s.direction):ut(o.direction),...Zr(s==null?void 0:s.direction)?{direction_invalid:!0}:{}},f=l&&(Object.prototype.hasOwnProperty.call(l,"show_label")||Object.prototype.hasOwnProperty.call(l,"label_decimal")||Object.prototype.hasOwnProperty.call(l,"label_text")||Object.prototype.hasOwnProperty.call(l,"label_show_value")||Object.prototype.hasOwnProperty.call(l,"label_show_unit")||Object.prototype.hasOwnProperty.call(l,"label_precision")||Object.prototype.hasOwnProperty.call(l,"reset"));return(t==="floor"||u||b!==void 0||f)&&(p.show_label=h.show,p.label_decimal=h.precision,p.reset=c),Object.assign(p,Wt({label_text:h.text,label_show_value:h.showValue===!0?void 0:h.showValue,label_show_unit:h.showUnit===!0?void 0:h.showUnit,label_precision:h.precision,label_invalid_text:h.invalidText,label_invalid_show:h.invalidShow,label_invalid_show_value:h.invalidShowValue,label_invalid_show_unit:h.invalidShowUnit,label_invalid_precision:h.invalidPrecision,label_precision_key:h.precisionKey,label_unsupported_unit:h.unsupportedUnit})),u&&!Er(d)&&(p.reset_invalid=!0),p}function Kt(r,e){return Qr(r,e,"peak",{legacy:!0,defaultColor:"#888888"})}function Cr(r,e){return Qr(r,e,"floor",{defaultColor:"#888888"})}function Ia(r,e){var i,n,l;let t={...r,_normalized:!0,entity:r.entity,name:(i=r.name)!=null?i:null,icon:r.icon};if(r.attribute!==void 0){let s=Tt(r.attribute);s!==null?t.attribute=s:delete t.attribute,Xr(r.attribute)?t.attribute_invalid=!0:delete t.attribute_invalid}t.layout=Et(r,e),t.scale=Ht(r,e),t.bar=Ut(r,e,{scopeExplicitness:ot(r),inheritedExplicitness:(n=e==null?void 0:e[Na])!=null?n:ot(e),isCardScope:!1}),t.baseline=Ot(r,e),t.formatting=jt(r,e),t.target_marker=Gt(r,e),t.peak_marker=Kt(r,e),t.floor_marker=Cr(r,e);let a=r.markers===void 0?{markers:Yr((l=e==null?void 0:e.generic_markers)!=null?l:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:Jr(r.markers,t);return t.generic_markers=a.markers,t.generic_markers_invalid=a.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Xt(r){var n;let e=ot(r),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...r};t._height_explicit=((n=r==null?void 0:r.layout)==null?void 0:n.height)!==void 0||(r==null?void 0:r.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.attribute!==void 0?{attribute:t.attribute}:{},...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(l=>typeof l=="string"?{entity:l}:l);let a={...t,_normalized:!0};Object.defineProperty(a,Na,{value:e,enumerable:!1}),a.layout=Et(t,null),a.scale=Ht(r,null),a.bar=Ut(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),a.baseline=Ot(t,null),a.formatting=jt(t,null),a.target_marker=Gt(t,null),a.peak_marker=Kt(t,null),a.floor_marker=Cr(t,null);let i=Jr(t.markers,a);return a.generic_markers=i.markers,a.generic_markers_invalid=i.invalidList,a.entities=t.entities.map(l=>Ia(l,a)),a}var Na,$a,fe=ae(()=>{Vt();Na=Symbol("sbcp.paintExplicitness"),$a=Symbol("sbcp.explicitSegmentSpace")});function ct(r,e=null){var n;if(!r)return{stateObj:null,value:void 0,found:!1,available:!1,attributeFound:!1};let t=!["unknown","unavailable"].includes(String((n=r.state)!=null?n:"").trim().toLowerCase());if(typeof e!="string"||e==="")return{stateObj:r,value:r.state,found:!0,available:t,attributeFound:!0};let a=r.attributes,i=a!=null&&Object.prototype.hasOwnProperty.call(a,e);return{stateObj:r,value:i?a[e]:void 0,found:!0,available:t,attributeFound:i}}function ht(r,e,t=null){var i,n;let a=e&&(n=(i=r==null?void 0:r.states)==null?void 0:i[e])!=null?n:null;return ct(a,t)}function ge(r,e,t=null){let a=ht(r,e,t);if(!a.found||!a.available||!a.attributeFound)return null;let i=a.value,n=parseFloat(i);return Number.isFinite(n)?n:null}function we(r,e,t=null){let a=ge(r,t);if(a!==null)return a;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function Va(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return a+r/100*(i-a)}function ce(r,e,t=null,a=null){var l;if(!e)return null;let i=ge(r,e.entity,e.attribute);if(i!==null)return i;let n=we(r,(l=e.fixed)!=null?l:e.value,null);return n!==null?n:Number.isFinite(e.percent)?Va(e.percent,t,a):null}function ei(r,e,t=null){var s,o,u,d,c,b,h,p,f,v,m,y;let a=_=>Number.isFinite(_==null?void 0:_.min)&&Number.isFinite(_==null?void 0:_.max)&&_.min<_.max,i={min:we(null,(u=(s=e==null?void 0:e.min)==null?void 0:s.fixed)!=null?u:(o=e==null?void 0:e.min)==null?void 0:o.value),max:we(null,(b=(d=e==null?void 0:e.max)==null?void 0:d.fixed)!=null?b:(c=e==null?void 0:e.max)==null?void 0:c.value)};if((h=e==null?void 0:e.min)!=null&&h.entity&&((p=e==null?void 0:e.max)!=null&&p.entity)){let _={min:ge(r,e.min.entity,e.min.attribute),max:ge(r,e.max.entity,e.max.attribute)};return a(_)?_:Number.isFinite(_.min)&&Number.isFinite(_.max)&&a(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&a(i)?i:{min:0,max:100}}let n={min:(f=ce(r,e==null?void 0:e.min))!=null?f:0,max:(v=ce(r,e==null?void 0:e.max))!=null?v:100};if(a(n))return n;let l={min:(m=i.min)!=null?m:0,max:(y=i.max)!=null?y:100};return a(l)?l:{min:0,max:100}}var Yt=ae(()=>{fe()});function Di(r,e,t,a=null){return{code:r,message:e,path:t,entity:a}}function Jt(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:D((e=r.fixed)!=null?e:r.value)}function N(r,e,t,a,i=null){r.warnings.push(Di(e,t,a,i))}function pt(r,e,t,a=null){e!=null&&e.attribute_invalid&&N(r,"source.invalid_attribute","Attribute must be a non-empty string; using the entity state.",t,a)}function bt(r,e,t,a=null){e!=null&&e.entity_invalid&&N(r,"source.invalid_entity_source","Entity source must be an entity ID or `{ id: entity_id, attribute: attribute_name }`; sibling `attribute` is not supported.",t,a)}function Li(r,e,t,a=null){var l,s;if((l=e==null?void 0:e.min)!=null&&l.entity&&((s=e==null?void 0:e.max)!=null&&s.entity)){let o=u=>{var d,c;return u.fixed_explicit!==!1&&((d=u.fixed)!=null?d:u.value)!==null&&((c=u.fixed)!=null?c:u.value)!==void 0};o(e.min)!==o(e.max)&&N(r,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,a)}let i=Jt(e==null?void 0:e.min),n=Jt(e==null?void 0:e.max);return Number.isFinite(i)&&Number.isFinite(n)&&i>n&&N(r,"scale.min_gt_max","Scale minimum is greater than maximum.",t,a),{min:i,max:n}}function Bi(r,e,t,a,i=null){var o;let n=Jt((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&N(r,"target.outside_scale","Fixed target value is outside the fixed scale range.",a,i)}function qi(r,e,t,a,i=null){var o;let n=Jt((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&N(r,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",a,i)}function Oi(r){var e;return!!r&&(Number.isFinite(D((e=r.fixed)!=null?e:r.value))||Number.isFinite(r.percent)||!!r.entity)}function Hi(r,e,t,a=null){var l,s,o,u;let i=((s=(l=e==null?void 0:e.bar)==null?void 0:l.needle)==null?void 0:s.show)===!0,n=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&Oi((u=e==null?void 0:e.baseline)==null?void 0:u.at);i&&n&&N(r,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,a)}function Ui(r,e,t,a=null){var i;for(let n of["peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.reset_invalid&&N(r,`${n}.invalid_reset`,"Invalid marker reset; using never.",`${t}.${n}.reset`,a)}function Ei(r,e,t,a=null){var i;for(let n of["target_marker","peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.direction_invalid&&N(r,`${n}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${n==="target_marker"?"target":n.replace("_marker","")}.direction`,a)}function ji(r,e,t,a=null){var i;for(let[n,l]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let s=e==null?void 0:e[n],o=`${t}.${l}.label`;s!=null&&s.label_invalid_show&&N(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,a),s!=null&&s.label_invalid_text&&N(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,a),s!=null&&s.label_invalid_show_value&&N(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,a),s!=null&&s.label_invalid_show_unit&&N(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,a),s!=null&&s.label_invalid_precision&&N(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(i=s.label_precision_key)!=null?i:"precision"}`,a),s!=null&&s.label_unsupported_unit&&N(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,a)}}function Wa(r,e,t,a,i=null){var n,l,s,o,u,d,c,b;t&&N(r,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",a,i);for(let h of e!=null?e:[]){let p=`${a}[${h.index}]`;if(h.malformed){N(r,"markers.invalid_item","Marker must be an object; ignoring this item.",p,i);continue}bt(r,h.source,`${p}.at`,i),h.invalidSource&&!h.invalidPercentage&&!h.unsupportedPercentField&&N(r,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${p}.at`,i),h.invalidPercentage&&N(r,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${p}.at`,i),h.unsupportedPercentField&&N(r,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${p}.at`,i),h.invalidLane&&N(r,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${p}.lane`,i),h.invalidShape&&N(r,"markers.invalid_shape","Invalid marker shape; using circle.",`${p}.shape`,i),h.invalidDirection&&N(r,"markers.invalid_direction","Invalid marker direction; using inward.",`${p}.direction`,i),h.invalidShowMarker&&N(r,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${p}.show_marker`,i),(n=h.label)!=null&&n.invalidEntity&&N(r,"markers.invalid_label_entity","Marker label entity must be an entity ID or `{ id, attribute }`; sibling `label.attribute` is not supported.",`${p}.label.entity`,i),(l=h.label)!=null&&l.invalidShow&&N(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${p}.label.show`,i),(s=h.label)!=null&&s.invalidText&&N(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${p}.label.text`,i),(o=h.label)!=null&&o.invalidShowValue&&N(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${p}.label.show_value`,i),(u=h.label)!=null&&u.invalidShowUnit&&N(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${p}.label.show_unit`,i),(d=h.label)!=null&&d.invalidPrecision&&N(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${p}.label.${(c=h.label.invalidPrecisionKey)!=null?c:"precision"}`,i),(b=h.label)!=null&&b.unsupportedUnit&&N(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${p}.label.unit`,i),h.valid&&!h.accepted&&N(r,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",p,i)}}function ti(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:D((e=r.fixed)!=null?e:r.value)}function Gi(r,e,t,a,i=null){if(!Array.isArray(e)||!e.length)return;let n=[],{min:l,max:s}=t;for(let u=0;u<e.length;u+=1){let d=e[u],c=ti(d==null?void 0:d.from),b=ti(d==null?void 0:d.to),h=`${a}.segments[${u}]`;if((d==null?void 0:d.invalidBoundary)==="entity"){N(r,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",h,i);continue}if((d==null?void 0:d.invalidBoundary)==="malformed_percent"){N(r,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",h,i);continue}if(d!=null&&d.invalidBoundary){N(r,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',h,i);continue}Number.isFinite(c)&&Number.isFinite(b)&&c>b&&N(r,"segments.from_gt_to","Segment start is greater than segment end.",h,i),Number.isFinite(l)&&Number.isFinite(s)&&(Number.isFinite(c)&&(c<l||c>s)&&N(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i),Number.isFinite(b)&&(b<l||b>s)&&N(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",h,i)),Number.isFinite(c)&&Number.isFinite(b)&&n.push({from:c,to:b,path:h})}let o=[...n].sort((u,d)=>u.from-d.from);for(let u=1;u<o.length;u+=1){let d=o[u-1],c=o[u];c.from<d.to&&N(r,"segments.overlap","Fixed segments overlap.",c.path,i)}}function Ki(r,e,t,a=null){var n;if(!Array.isArray(e))return;let i=new Set;for(let l=0;l<e.length;l+=1){let s=D((n=e[l])==null?void 0:n.pos),o=`${t}.gradient_stops[${l}]`;Number.isFinite(s)&&(s<0||s>100)&&N(r,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,a),Number.isFinite(s)&&(i.has(s)?N(r,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,a):i.add(s))}}function ai(r,e,t,a=null){var n,l,s,o,u,d,c,b,h,p;pt(r,e,`${t}.attribute`,a),pt(r,(n=e==null?void 0:e.scale)==null?void 0:n.min,`${t}.scale.min.attribute`,a),pt(r,(l=e==null?void 0:e.scale)==null?void 0:l.max,`${t}.scale.max.attribute`,a),pt(r,(s=e==null?void 0:e.baseline)==null?void 0:s.at,`${t}.baseline.at.attribute`,a),pt(r,(o=e==null?void 0:e.target_marker)==null?void 0:o.source,`${t}.target.at.attribute`,a),bt(r,(u=e==null?void 0:e.scale)==null?void 0:u.min,`${t}.scale.min`,a),bt(r,(d=e==null?void 0:e.scale)==null?void 0:d.max,`${t}.scale.max`,a),bt(r,(c=e==null?void 0:e.baseline)==null?void 0:c.at,`${t}.baseline.at`,a),bt(r,(b=e==null?void 0:e.target_marker)==null?void 0:b.source,`${t}.target.at`,a);let i=Li(r,e==null?void 0:e.scale,t,a);Bi(r,e,i,t,a),qi(r,e,i,t,a),Hi(r,e,t,a),Ui(r,e,t,a),Ei(r,e,t,a),ji(r,e,t,a),Gi(r,(h=e==null?void 0:e.bar)==null?void 0:h.segments,i,`${t}.bar`,a),Ki(r,(p=e==null?void 0:e.bar)==null?void 0:p.gradient_stops,`${t}.bar`,a)}function Zt(r){var i,n;let e={warnings:[],errors:[]};if(!r||typeof r!="object")return e;ai(e,r,"card"),Wa(e,r.generic_markers,r.generic_markers_invalid,"markers");let t=new Set,a=Array.isArray(r.entities)?r.entities:[];for(let l=0;l<a.length;l+=1){let s=a[l],o=(i=s==null?void 0:s.entity)!=null?i:null,u=`entities[${l}]`;if(!o){N(e,"entities.missing_entity","Entity row is missing an entity id.",u,null);continue}if(t.has(o)?N(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",u,o):t.add(o),ai(e,s,u,o),Object.prototype.hasOwnProperty.call(s,"markers"))Wa(e,s.generic_markers,s.generic_markers_invalid,`${u}.markers`,o);else{let d=((n=s.generic_markers)!=null?n:[]).filter(c=>{var b,h;return c.valid&&!c.accepted&&((h=(b=r.generic_markers)==null?void 0:b[c.index])==null?void 0:h.accepted)===!0});d.length&&Wa(e,d,!1,`${u}.markers`,o)}}return e}var Ta=ae(()=>{fe()});function he(r,e=null){return Number.isFinite(r)?e!==null?r.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):r.toLocaleString():String(r)}function Da(r){return["h","m","s"].includes(String(r||"").trim())}function La(r,e){if(!e)return String(r);let t=String(e);return`${r}${Da(t)?"":" "}${t}`}function mt(r,e,t=null){let a=he(r,t),i=e?String(e):"";return{value:r,number:a,unit:i,text:La(a,i)}}function ft(r,e,t=null,a={}){let i=typeof a.text=="string"?a.text:"",n=a.showValue===!1||r===null||r===void 0||r===""?"":Number.isFinite(r)?he(r,t):String(r),l=a.showUnit===!1?"":String(e!=null?e:"").trim(),s=[i,n,l].filter(Boolean).join(" ");return{value:Number.isFinite(r)?r:null,semanticText:i,number:n,unit:l,showValue:a.showValue!==!1,showUnit:a.showUnit!==!1,text:s}}function ri(r){let e=String(r);return{value:null,number:e,unit:"",text:e}}var Qt=ae(()=>{});function ii(r){return r?r.entity!==null&&r.entity!==void 0&&r.entity!==""||r.fixed!==null&&r.fixed!==void 0&&r.fixed!==""||Number.isFinite(r.percent):!1}function ea(r,e="circle"){return Xi.has(r)?r:e}function Ct({id:r,type:e,value:t=null,position:a=null,lane:i,visible:n=!1,color:l=null,label:s=null,labelVisible:o=!1,shape:u="circle",direction:d="inward",showMarker:c=!0}){return{id:r,type:e,value:t,position:a,lane:i,visible:n===!0,color:l,label:s,labelVisible:o===!0,shape:ea(u),direction:d,showMarker:c!==!1}}function ue(r){return!!(typeof(r==null?void 0:r.text)=="string"&&r.text.trim())||(r==null?void 0:r.showValue)!==!1||(r==null?void 0:r.showUnit)!==!1}function ta(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&ii(e==null?void 0:e.source)||(a==null?void 0:a.show)===!0||i.some(l=>l.lane==="below"),above:(t==null?void 0:t.show)===!0||i.some(l=>l.lane==="above")}}function aa(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&ii(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&ue({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(a==null?void 0:a.show)===!0&&(a==null?void 0:a.show_label)===!0&&ue({text:a.label_text,showValue:a.label_show_value,showUnit:a.label_show_unit})||i.some(l=>{var s;return l.lane==="below"&&((s=l.label)==null?void 0:s.show)===!0&&ue(l.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&ue({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||i.some(l=>{var s;return l.lane==="above"&&((s=l.label)==null?void 0:s.show)===!0&&ue(l.label)})}}function ra({entityConfig:r,targetValue:e=null,targetPosition:t=null,targetPresentation:a=null,targetLabelPresentation:i=null,targetVisible:n=Number.isFinite(t),peakValue:l=null,peakPosition:s=null,peakPresentation:o=null,peakLabelPresentation:u=null,peakVisible:d=Number.isFinite(s),floorValue:c=null,floorPosition:b=null,floorPresentation:h=null,floorLabelPresentation:p=null,floorVisible:f=Number.isFinite(b),genericMarkers:v=[]}){var x,S,k,w,M,F,R;let m=r==null?void 0:r.target_marker,y=r==null?void 0:r.peak_marker,_=r==null?void 0:r.floor_marker,g=(m==null?void 0:m.enabled)!==!1;return[Ct({id:"target",type:"target",value:e,position:t,lane:"below",visible:g&&n,color:(x=m==null?void 0:m.color)!=null?x:null,label:i!=null?i:a,labelVisible:g&&(m==null?void 0:m.show_label)===!0&&ue({text:m.label_text,showValue:m.label_show_value,showUnit:m.label_show_unit}),shape:(S=m==null?void 0:m.shape)!=null?S:"diamond",direction:(k=m==null?void 0:m.direction)!=null?k:"inward"}),Ct({id:"floor",type:"floor",value:c,position:b,lane:"below",visible:(_==null?void 0:_.show)===!0&&f,color:(w=_==null?void 0:_.color)!=null?w:null,label:p!=null?p:h,labelVisible:(_==null?void 0:_.show)===!0&&(_==null?void 0:_.show_label)===!0&&ue({text:_.label_text,showValue:_.label_show_value,showUnit:_.label_show_unit}),shape:"triangle",direction:(M=_==null?void 0:_.direction)!=null?M:"inward"}),Ct({id:"peak",type:"peak",value:l,position:s,lane:"above",visible:(y==null?void 0:y.show)===!0&&d,color:(F=y==null?void 0:y.color)!=null?F:null,label:u!=null?u:o,labelVisible:(y==null?void 0:y.show)===!0&&(y==null?void 0:y.show_label)===!0&&ue({text:y.label_text,showValue:y.label_show_value,showUnit:y.label_show_unit}),shape:"triangle",direction:(R=y==null?void 0:y.direction)!=null?R:"inward"}),...v.map($=>Ct({id:$.id,type:"generic",value:$.value,position:$.position,lane:$.lane,visible:$.visible,color:$.color,label:$.label,labelVisible:$.labelVisible&&ue($.label),shape:$.shape,direction:$.direction,showMarker:$.showMarker}))]}var Xi,ia=ae(()=>{Xi=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function Yi(r,e=""){var n,l,s;let t=String((l=(n=r==null?void 0:r.attributes)==null?void 0:n.device_class)!=null?l:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let a=String(e||"").split(".")[0];return(s={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[a])!=null?s:null}function ke(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function Ji(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function ni(r){let e=Ji(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function Zi(r,e,t,a,i){var o,u,d;let n=(o=r==null?void 0:r.bar)==null?void 0:o.needle;if(!(n!=null&&n.show)||Number.isFinite(i)||!Number.isFinite(e)){let c=(u=n==null?void 0:n.color)!=null?u:"#ffffff";return{show:!1,percent:null,pct:null,color:c,borderColor:ni(c),edge:"middle"}}let l=(d=n.color)!=null?d:"#ffffff",s=Math.min(100,Math.max(0,ke(e,t,a)));return{show:!0,percent:s,pct:s,color:l,borderColor:ni(l),edge:s<=0?"left":s>=100?"right":"middle"}}function li(r,e,t,a,i,n){if(!n)return{value:null,percent:null,display:null,visible:!1};let l=D(a==null?void 0:a.value);if(!Number.isFinite(l)&&!Number.isFinite(r))return{value:null,percent:null,visible:!1};let s=Number.isFinite(l)?Number.isFinite(r)?i==="min"?Math.min(l,r):Math.max(l,r):l:r;return{value:s,percent:ke(s,e,t),visible:!0}}function _t(r){var G,E,te,Q,re,ne,le,be,Mt,ze,Pe,Ae,Ie,Ve,We,Te,De,Le,Be,qe,Oe,He,Ue,Ee,je,Ge,Ke,Xe,Ye,Je,Ze,Qe,Ce,et,tt,C,at,rt,lr,sr,or,ur,dr,cr,hr,pr,br,mr,fr,_r,vr,yr,xr,gr,wr,kr,Sr,Mr,$r,Rr,Nr,Fr;let{hass:e,cardConfig:t,entityConfig:a,entityState:i,peaks:n,extrema:l,previousScale:s}=r,o=(G=a==null?void 0:a.entity)!=null?G:null,u=ct(i,a==null?void 0:a.attribute),d=u.found&&!u.available?(E=u.stateObj)==null?void 0:E.state:null,c=d!=null?d:u.available&&u.attributeFound?u.value:"",b=typeof c=="string"||typeof c=="number"||typeof c=="boolean"?c:"",h=u.available&&u.attributeFound?D(u.value):null,p=(Q=(te=i==null?void 0:i.attributes)==null?void 0:te.unit_of_measurement)!=null?Q:"",f=(re=a==null?void 0:a.formatting)==null?void 0:re.unit,v=(ne=f!=null?f:p)!=null?ne:"",m=h!==null?v:"",{min:y,max:_}=ei(e,a==null?void 0:a.scale,s),g=h!==null?ke(h,y,_):0,x=(be=(le=a==null?void 0:a.formatting)==null?void 0:le.decimal)!=null?be:null,S=h===null?ri(b):mt(h,m,x),k=((Mt=a==null?void 0:a.target_marker)==null?void 0:Mt.enabled)===!1?null:ce(e,(ze=a==null?void 0:a.target_marker)==null?void 0:ze.source,y,_),w=k!==null?ke(k,y,_):null,M=k!==null,F=(Ae=(Pe=a==null?void 0:a.target_marker)==null?void 0:Pe.label_decimal)!=null?Ae:x,R=k!==null?mt(k,v,F):null,$=k!==null?ft(k,v,(Ve=(Ie=a==null?void 0:a.target_marker)==null?void 0:Ie.label_precision)!=null?Ve:F,{text:(We=a==null?void 0:a.target_marker)==null?void 0:We.label_text,showValue:(Te=a==null?void 0:a.target_marker)==null?void 0:Te.label_show_value,showUnit:(De=a==null?void 0:a.target_marker)==null?void 0:De.label_show_unit}):null,P=((Le=a==null?void 0:a.baseline)==null?void 0:Le.enabled)===!1?null:ce(e,(Be=a==null?void 0:a.baseline)==null?void 0:Be.at,y,_),L=Number.isFinite(P)?ke(P,y,_):null,I=Number.isFinite(P),T=Number.isFinite(D(n==null?void 0:n[o]))?{value:D(n==null?void 0:n[o])}:null,z=li(h,y,_,(qe=l==null?void 0:l.peak)!=null?qe:T,"max",((Oe=a==null?void 0:a.peak_marker)==null?void 0:Oe.show)===!0),V=li(h,y,_,l==null?void 0:l.floor,"min",((He=a==null?void 0:a.floor_marker)==null?void 0:He.show)===!0),B=(Ee=(Ue=a==null?void 0:a.peak_marker)==null?void 0:Ue.label_decimal)!=null?Ee:x,j=(Ge=(je=a==null?void 0:a.floor_marker)==null?void 0:je.label_decimal)!=null?Ge:x,J=(Xe=(Ke=a==null?void 0:a.peak_marker)==null?void 0:Ke.label_precision)!=null?Xe:B,Z=(Je=(Ye=a==null?void 0:a.floor_marker)==null?void 0:Ye.label_precision)!=null?Je:j,O=z.visible?mt(z.value,v,B):null,q=V.visible?mt(V.value,v,j):null,A=z.visible?ft(z.value,v,J,{text:(Ze=a==null?void 0:a.peak_marker)==null?void 0:Ze.label_text,showValue:(Qe=a==null?void 0:a.peak_marker)==null?void 0:Qe.label_show_value,showUnit:(Ce=a==null?void 0:a.peak_marker)==null?void 0:Ce.label_show_unit}):null,H=V.visible?ft(V.value,v,Z,{text:(et=a==null?void 0:a.floor_marker)==null?void 0:et.label_text,showValue:(tt=a==null?void 0:a.floor_marker)==null?void 0:tt.label_show_value,showUnit:(C=a==null?void 0:a.floor_marker)==null?void 0:C.label_show_unit}):null,W=((at=a==null?void 0:a.generic_markers)!=null?at:[]).filter(K=>K.accepted).map(K=>{var Ar,Ir,Vr,Wr,Tr;let $t=ce(e,K.source,y,_),zr=Number.isFinite($t),_i=(Ar=K.label.precision)!=null?Ar:x,oe=K.label.entity?ht(e,K.label.entity,K.label.attribute):null,xa=oe==null?void 0:oe.value,ve=typeof xa=="string"?xa.trim():xa,Pr=(oe==null?void 0:oe.found)&&oe.available&&oe.attributeFound&&ve!==null&&ve!==void 0&&ve!==""&&!["unknown","unavailable"].includes(String(ve).trim().toLowerCase()),vi=K.label.entity?Pr?(Ir=D(ve))!=null?Ir:String(ve):null:$t,yi=K.label.entity?Pr&&(Tr=(Wr=(Vr=oe.stateObj)==null?void 0:Vr.attributes)==null?void 0:Wr.unit_of_measurement)!=null?Tr:"":v,xi=K.label.show?ft(vi,yi,_i,{text:K.label.text,showValue:K.label.showValue,showUnit:K.label.showUnit}):null;return{id:K.id,value:$t,position:zr?ke($t,y,_):null,lane:K.lane,visible:zr,color:K.color,shape:K.shape,direction:K.direction,showMarker:K.showMarker,label:xi,labelVisible:K.label.show}}),U=ra({entityConfig:a,targetValue:k,targetPosition:w,targetPresentation:R,targetLabelPresentation:$,targetVisible:M,peakValue:z.value,peakPosition:z.percent,peakPresentation:O,peakLabelPresentation:A,peakVisible:z.visible,floorValue:V.value,floorPosition:V.percent,floorPresentation:q,floorLabelPresentation:H,floorVisible:V.visible,genericMarkers:W});return{entityId:o,name:(sr=(lr=a==null?void 0:a.name)!=null?lr:(rt=i==null?void 0:i.attributes)==null?void 0:rt.friendly_name)!=null?sr:o,icon:(a==null?void 0:a.icon)===!1?!1:(dr=(ur=a==null?void 0:a.icon)!=null?ur:(or=i==null?void 0:i.attributes)==null?void 0:or.icon)!=null?dr:Yi(i,o),state:b,numericValue:h,rawUnit:p,min:y,max:_,percent:g,displayValue:S.number,displayUnit:S.unit,primaryPresentation:S,unit:S.unit,barColor:(hr=(cr=a==null?void 0:a.bar)==null?void 0:cr.color)!=null?hr:null,fillStyle:(br=(pr=a==null?void 0:a.bar)==null?void 0:pr.fill_style)!=null?br:null,target:k,targetPercent:w,targetDisplay:(mr=R==null?void 0:R.text)!=null?mr:null,targetPresentation:R,targetLabelPresentation:$,targetVisible:M,baseline:P,baselinePercent:L,baselineVisible:I,peak:z.value,peakPercent:z.percent,peakDisplay:(fr=O==null?void 0:O.number)!=null?fr:null,peakPresentation:O,peakLabelPresentation:A,peakVisible:z.visible,floor:V.value,floorPercent:V.percent,floorDisplay:(_r=q==null?void 0:q.number)!=null?_r:null,floorPresentation:q,floorLabelPresentation:H,floorVisible:V.visible,markers:U,markerLaneOccupancy:ta(a),markerLabelLaneOccupancy:aa(a),segments:(yr=(vr=a==null?void 0:a.bar)==null?void 0:vr.segments)!=null?yr:null,gradientStops:(gr=(xr=a==null?void 0:a.bar)==null?void 0:xr.gradient_stops)!=null?gr:null,needle:Zi(a,h,y,_,L),classes:{labelPosition:(Sr=(kr=(wr=a==null?void 0:a.layout)==null?void 0:wr.label)==null?void 0:kr.position)!=null?Sr:"left",animated:((Mr=a==null?void 0:a.bar)==null?void 0:Mr.animated)!==!1},attributes:{entity:o,baseHeight:(Rr=($r=a==null?void 0:a.layout)==null?void 0:$r.height)!=null?Rr:38,heightExplicit:((Nr=a==null?void 0:a.layout)==null?void 0:Nr.height_explicit)===!0,barAnimated:((Fr=a==null?void 0:a.bar)==null?void 0:Fr.animated)!==!1}}}var Ba=ae(()=>{Yt();fe();Qt();ia()});function ee(r){return r==null?"":String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Y(r,e,t){var n,l;if(!(r!=null&&r.style))return!1;let a=t==null?"":String(t);return e.startsWith("--")?(typeof r.style.getPropertyValue=="function"?r.style.getPropertyValue(e):(n=r.style[e])!=null?n:"")===a?!1:(typeof r.style.setProperty=="function"?r.style.setProperty(e,a):r.style[e]=a,!0):((l=r.style[e])!=null?l:"")===a?!1:(r.style[e]=a,!0)}function Se(r,e){var i;if(!(r!=null&&r.style))return!1;let t=e==null?"":String(e);return((i=r.style.cssText)!=null?i:"")===t?!1:(r.style.cssText=t,!0)}function se(r,e,t){var n;if(!(r!=null&&r.dataset))return!1;let a=t==null?"":String(t);return((n=r.dataset[e])!=null?n:"")===a?!1:(r.dataset[e]=a,!0)}function na(r,e){var a;if(!r)return!1;let t=e==null?"":String(e);return((a=r.className)!=null?a:"")===t?!1:(r.className=t,!0)}var la=ae(()=>{});function pa(r,e){if(!r||!e||!Number.isFinite(r.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(r.baselinePercent)?r.baselinePercent:0,a=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,i=Math.max(Math.abs(e.valuePercent-r.valuePercent),Math.abs(a-t)),n=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,i-5))));return Number.isFinite(r.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(r.valuePercent-r.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(n,300):n}function sa(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function $e(r){if(!r||typeof r!="string")return null;let e=r.replace("#","").trim(),t=e.length===3?e.split("").map(a=>a+a).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function ba(r,e=0,t=100,a=!1){let n=Re(r,e,t).filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&(s==null?void 0:s.color)).sort((s,o)=>s.from-o.from);if(!n.length)return[];let l=[];for(let s=0;s<n.length;s++){let o=n[s],u=$e(o.color);if(!u&&!a)continue;let d;s===0?d=o.from:s===n.length-1?d=o.to:d=o.from+(o.to-o.from)/2,(!l.length||l[l.length-1].p!==d)&&l.push({p:d,...u!=null?u:{color:o.color}})}return l}function Qi(r,e="#4a9eff"){let t=r.filter(n=>Number.isFinite(n==null?void 0:n.from)&&Number.isFinite(n==null?void 0:n.to)&&(n==null?void 0:n.color)).sort((n,l)=>n.from-l.from);if(!t.length)return null;let a=[],i=0;for(let n of t)n.from>i&&a.push(`${e} ${i}%`,`${e} ${n.from}%`),a.push(`${n.color} ${n.from}%`,`${n.color} ${n.to}%`),i=Math.max(i,n.to);return i<100&&a.push(`${e} ${i}%`,`${e} 100%`),`linear-gradient(to right, ${a.join(", ")})`}function qa(r,e=0,t=100){var a,i;return Qi(Re(r,e,t),(i=(a=r.bar)==null?void 0:a.color)!=null?i:"#4a9eff")}function Oa(){return 1.5}function pe(r,e,t){if(!Array.isArray(r)||!t)return;let a=Math.min(100,Math.max(0,e)),i=r[r.length-1];i&&i.color===t&&Math.abs(i.p-a)<1e-4||r.push({p:a,color:t})}function yt(r,e=0,t=100){let i=Re(r,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,u)=>o.from-u.from);if(!i.length)return[];let n=Oa(),l=n/2,s=[];pe(s,i[0].from,i[0].color);for(let o=0;o<i.length-1;o++){let u=i[o],d=i[o+1],c=u.to,b=u.to-u.from,h=d.to-d.from;b>=n&&h>=n?(pe(s,Math.max(u.from,c-l),u.color),pe(s,Math.min(d.to,c+l),d.color)):(pe(s,c,u.color),pe(s,c,d.color))}return pe(s,i[i.length-1].to,i[i.length-1].color),s}function Ha(r,e=0,t=100){let a=yt(r,e,t);return a.length?`linear-gradient(to right, ${a.map(i=>`${i.color} ${i.p}%`).join(", ")})`:null}function oa(r,e,t){if(r==null)return null;if(typeof r=="object"&&!Array.isArray(r)){let n=D(r.fixed);return Number.isFinite(n)?vt(n,e,t):Number.isFinite(r.percent)?r.percent:null}let a=me(r);if(Number.isFinite(a))return a;let i=D(r);return Number.isFinite(i)?vt(i,e,t):null}function xt(r){var e,t,a,i;return(i=(a=(e=r==null?void 0:r.bar)==null?void 0:e.fill_style)!=null?a:dt((t=r==null?void 0:r.bar)==null?void 0:t.color_mode))!=null?i:"bands"}function Ua(r){return Array.isArray(r)&&r.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Re(r,e=0,t=100){var l,s;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((l=r.bar)==null?void 0:l.segments)?r.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((s=r.bar)==null?void 0:s.segment_space)==="scale"||Ua(n)){let o=n.map(u=>{var d;return{from:oa(u.from,a,i),to:oa(u.to,a,i),color:u.color,label:(d=u.label)!=null?d:null}}).filter(u=>Number.isFinite(u.from)&&u.color);return sa(o,100).filter(u=>Number.isFinite(u.from)&&Number.isFinite(u.to)&&u.color)}return sa(n,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.color)}function Ea(r,e,t=0,a=100){let i=xt(e);if(i==="solid")return e.bar.color;if(i==="gradient"||i==="band_gradient"||i==="soft_bands"){let n;if(i==="band_gradient"?n=ba(e,t,a):i==="soft_bands"?n=yt(e,t,a).map(u=>{let d=$e(u.color);return d?{p:u.p,...d}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(n=e.bar.gradient_stops.map(u=>{let d=u.color.replace("#",""),c=d.length===3?d.split("").map(b=>b+b).join(""):d;return{p:u.pos,r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}}),n.sort((u,d)=>u.p-d.p)):n=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!n||!n.length)return e.bar.color;let l=n[0],s=n[n.length-1];for(let u=0;u<n.length-1;u++)if(r>=n[u].p&&r<=n[u+1].p){l=n[u],s=n[u+1];break}let o=l.p===s.p?0:(r-l.p)/(s.p-l.p);return`rgb(${Math.round(l.r+o*(s.r-l.r))},${Math.round(l.g+o*(s.g-l.g))},${Math.round(l.b+o*(s.b-l.b))})`}for(let n of Re(e,t,a))if(r>=n.from&&r<=n.to)return n.color;return e.bar.color}function ja(r){if(!Array.isArray(r)||!r.length)return null;let e=r.map(t=>{var i;let a=(i=t.color)!=null?i:Ka(t);return a?`${a} ${t.p}%`:null}).filter(Boolean);return e.length?`background:linear-gradient(to right,${e.join(",")});background-repeat:no-repeat;`:null}function Ga(r,e=0,t=100){let a=xt(r);return a==="band_gradient"?ba(r,e,t,!0):a==="soft_bands"?yt(r,e,t).map(i=>{let n=$e(i.color);return n?{p:i.p,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):r.bar.gradient_stops&&r.bar.gradient_stops.length>=2?r.bar.gradient_stops.map(i=>{let n=$e(i.color);return n?{p:i.pos,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function Ka(r){return r?`rgb(${r.r},${r.g},${r.b})`:null}function ua(r){return`linear-gradient(to right,${r} 0%,${r} 100%)`}function Xa(r,e,t=0,a=100){var n;let i=xt(e);if(e.bar.solid_fill)return ua(r);if(i==="bands")return qa(e,t,a);if(i==="soft_bands")return Ha(e,t,a);if(i==="gradient"||i==="band_gradient"){let l=Ga(e,t,a);return(n=ja(l))==null?void 0:n.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return ua(r)}function da(r,e,t){if(!t)return null;let a=Math.min(100,Math.max(0,r)),i=Math.min(100,Math.max(0,e));return i<=a?null:`linear-gradient(to right,transparent 0%,transparent ${a}%,${t} ${a}%,${t} ${i}%,transparent ${i}%,transparent 100%)`}function vt(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function ca(r,e=null){let t=Math.min(100,Math.max(0,r));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let a=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,a),end:Math.max(t,a),positive:t>=a,baseline:a,hidden:t===a}}function Ya(r){return r!=null&&r.endpointSemantics?r.endpointSemantics:r!=null&&r.usesBaseline?r.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function Ja(r){let e=Ya(r),t=n=>n==="value"||n==="range"||n==="scale",a=t(e.left)?"6px":"0",i=t(e.right)?"6px":"0";return`${a} ${i} ${i} ${a}`}function Za(r=null){if(!Number.isFinite(r))return null;let e=Math.min(100,Math.max(0,r));return e>=100?null:{start:e,end:100}}function Qa(r=null){let e=Za(r);return e?{start:e.start,end:e.end,hidden:!1}:null}function Ca(r,e,t=null,a=null,i=0,n=100){var u,d,c,b,h,p;let l=[],s=Xa(e,r,i,n),o=Number.isFinite(a)?Math.min(100,Math.max(0,a)):null;if(Number.isFinite(o)){let f=(c=(d=(u=r.baseline)==null?void 0:u.below)==null?void 0:d.color)!=null?c:null,v=(p=(h=(b=r.baseline)==null?void 0:b.above)==null?void 0:h.color)!=null?p:null,m=da(0,o,f),y=da(o,100,v);m&&l.push(m),y&&l.push(y)}return s&&l.push(s),l.length?`display:block;inset:0;background-image:${l.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function er(r,e){var d,c;let t=typeof e=="number"?`${e}px`:e,a=Math.min(100,Math.max(0,(d=r==null?void 0:r.start)!=null?d:0)),i=Math.min(100,Math.max(0,(c=r==null?void 0:r.end)!=null?c:0));if(r!=null&&r.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let n="0",l=`${Math.max(0,100-i)}%`,s="0",o=`${a}%`,u=Ja(r);return`display:block;height:${t};clip-path:inset(${n} ${l} ${s} ${o} round ${u});`}function ha(r){if(!(r!=null&&r.hidden)&&Number.isFinite(r==null?void 0:r.start)&&Number.isFinite(r==null?void 0:r.end)&&r.end>r.start){let e=Math.min(100,Math.max(0,r.start)),t=Math.min(100,Math.max(0,r.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function tr(r,e,t,a,i=null,n=null,l=0,s=100){var b,h;let u={id:"base",zIndex:1,visible:!0,paintStyle:Ca(t,a,i,n,l,s),revealStyle:"display:block;"},d=Qa(i),c={id:"above-target",zIndex:2,visible:!!((b=t==null?void 0:t.bar)!=null&&b.above_target_color&&d),paintStyle:(h=t==null?void 0:t.bar)!=null&&h.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:ha(d||{start:0,end:0,hidden:!0})};return[u,c]}function ar(r,e,t,a,i=null,n=null,l=0,s=100,o=!1){var c,b;let u=o?ca(100,null):ca(r,n),d=tr(u,e,t,a,i,n,l,s);return{geometry:u,paintLayers:d,paintStyle:(b=(c=d[0])==null?void 0:c.paintStyle)!=null?b:"display:none;",revealStyle:er(u,e)}}function si(r,e,t=0,a=100,i=null){var s,o,u,d,c,b,h,p,f;let n=(s=e==null?void 0:e.bar)==null?void 0:s.needle;if(!(n!=null&&n.show))return{show:!1,pct:null,color:(o=n==null?void 0:n.color)!=null?o:"#ffffff",borderColor:Me((u=n==null?void 0:n.color)!=null?u:"#ffffff"),edge:"middle"};if(Number.isFinite(i))return{show:!1,pct:null,color:(d=n.color)!=null?d:"#ffffff",borderColor:Me((c=n.color)!=null?c:"#ffffff"),edge:"middle"};if(!Number.isFinite(r))return{show:!1,pct:null,color:(b=n.color)!=null?b:"#ffffff",borderColor:Me((h=n.color)!=null?h:"#ffffff"),edge:"middle"};let l=Math.min(100,Math.max(0,vt(r,t,a)));return{show:!0,pct:l,color:(p=n.color)!=null?p:"#ffffff",borderColor:Me((f=n.color)!=null?f:"#ffffff"),edge:l<=0?"left":l>=100?"right":"middle"}}function ma(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function rr({r,g:e,b:t}){let a=r/255,i=e/255,n=t/255,l=Math.max(a,i,n),s=Math.min(a,i,n),o=(l+s)/2;if(l===s)return{h:0,s:0,l:o*100};let u=l-s,d=o>.5?u/(2-l-s):u/(l+s),c;switch(l){case a:c=((i-n)/u+(i<n?6:0))/6;break;case i:c=((n-a)/u+2)/6;break;default:c=((a-i)/u+4)/6;break}return{h:c*360,s:d*100,l:o*100}}function gt(r){let e=ma(r);if(!e)return"#f3f4f6";let{h:t,s:a,l:i}=rr(e),n=Math.abs(i-90)>=Math.abs(i-10)?90:10,l=Math.max(40,Math.min(100,a));return`hsl(${Math.round(t)} ${Math.round(l)}% ${Math.round(n)}%)`}function _e(r){var e;return(e=r==null?void 0:r.color)!=null?e:"#888888"}function Me(r){let e=ma(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function wt(r,e,{height:t,color:a=Ea(r.percent,e,r.min,r.max)}={}){var s,o,u,d;let i=r.baselinePercent,n=(s=e.baseline)==null?void 0:s.at,l=((o=e.baseline)==null?void 0:o.enabled)!==!1&&(Number.isFinite(i)||!!(n!=null&&n.entity)||(n==null?void 0:n.fixed)!==null&&(n==null?void 0:n.fixed)!==void 0||Number.isFinite(n==null?void 0:n.percent));return{animated:e.bar.animated,fill:ar(r.percent,t,e,a,r.targetPercent,i,r.min,r.max,r.needle.show),baseline:{configured:l,percent:i},needle:{...r.needle,configured:((d=(u=e.bar)==null?void 0:u.needle)==null?void 0:d.show)&&!Number.isFinite(i)},markers:r.markers}}var fa=ae(()=>{fe()});function Ne(r){var u,d,c,b,h,p,f;if(!r)return"";let e=Number.isFinite(r.position)?r.position:0,t=_e(r),a=gt(t),i=r.visible?"":"none",n=r.type==="target"?"diamond":r.type==="generic"?"circle":"triangle",l=ea(r.shape,n),s=(u=r.lane)!=null?u:r.type==="peak"?"above":"below",o=`<g class="marker-shape-paths">
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
    <div class="${`${r.type}-marker`}" data-shape="${l}" data-lane="${s}" data-direction="${(b=r.direction)!=null?b:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${r.type}-inset"></div>
      <div class="${r.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(h=r.direction)!=null?h:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`:`
    <div class="peak-marker" data-shape="${l}" data-lane="${s}" data-direction="${(p=r.direction)!=null?p:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(f=r.direction)!=null?f:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}function Fe(r,e){var l,s,o,u,d;if(!r||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",a=ea(e.shape,t);se(r,"shape",a),se(r,"lane",(l=e.lane)!=null?l:e.type==="peak"?"above":"below"),se(r,"direction",(s=e.direction)!=null?s:"inward"),e.type==="generic"&&se(r,"showMarker",e.showMarker===!1?"false":"true");let i=(o=r.querySelector)==null?void 0:o.call(r,".marker-shape-svg");i&&(se(i,"shape",a),se(i,"lane",(u=e.lane)!=null?u:e.type==="peak"?"above":"below"),se(i,"direction",(d=e.direction)!=null?d:"inward")),Y(r,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&Y(r,"left",`${e.position}%`);let n=_e(e);Y(r,"--marker-color",n),Y(r,"--marker-contrast-color",gt(n))}function _a(r,e,{revealDuration:t=600}={}){var d,c,b;let a=r.querySelector(".bar-fill-reveal"),i=r.querySelector(".baseline-indicator"),n=r.querySelector('.bar-paint-layer[data-layer="base"]');if(a&&(Se(a,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),na(a,`bar-fill-reveal${e.animated?"":" no-anim"}`)),i&&(Y(i,"display",Number.isFinite(e.baseline.percent)?"block":"none"),Number.isFinite(e.baseline.percent)&&Y(i,"left",`${e.baseline.percent}%`)),n){let h=e.fill.paintLayers.find(p=>p.id==="base");h&&Se(n,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let l=r.querySelector('.bar-paint-layer[data-layer="above-target"]');if(l){let h=e.fill.paintLayers.find(p=>p.id==="above-target");h&&Se(l,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let s=r.querySelector(".needle-marker");s&&(Y(s,"display",e.needle.show?"block":"none"),Y(s,"left",`${(d=e.needle.pct)!=null?d:0}%`),Y(s,"--needle-color",e.needle.color),Y(s,"--needle-border-color",e.needle.borderColor),se(s,"edge",e.needle.edge));let o=e.markers,u=h=>{var p;return(p=o.find(f=>f.id===h||f.type===h))!=null?p:null};Fe(r.querySelector(".target-marker"),u("target")),Fe(r.querySelector(".peak-marker"),u("peak")),Fe(r.querySelector(".floor-marker"),u("floor")),((b=(c=r.querySelectorAll)==null?void 0:c.call(r,".generic-marker[data-marker-id]"))!=null?b:[]).forEach(h=>{Fe(h,u(h.dataset.markerId))})}function va(r,{insideContent:e=""}={}){var h;let t=r.fill,a=r.baseline.percent,i=r.needle,n=r.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(a)?`left:${a}%;display:block;`:"display:none;"}"></div>`:"",l=p=>{var f;return(f=r.markers.find(v=>v.id===p||v.type===p))!=null?f:null},s=Ne(l("peak")),o=Ne(l("target")),u=Ne(l("floor")),d=r.markers.filter(p=>p.type==="generic").map(Ne).join(""),c=i.configured?`
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${i.edge}" style="left:${(h=i.pct)!=null?h:0}%;--needle-color:${i.color};--needle-border-color:${i.borderColor};display:${i.show?"block":"none"};"></div>
      </div>`:"",b=t.paintLayers.map(p=>`
                  <div class="bar-paint-layer" data-layer="${p.id}" style="z-index:${p.zIndex};${p.paintStyle}${p.revealStyle}"></div>`).join("");return`<div class="bar-track">
                <div class="bar-fill-reveal${r.animated?"":" no-anim"}" style="${t.revealStyle}">
${b}
                </div>
                ${n}
                ${e}
                ${s}
                ${o}
                ${u}
                ${d}
                ${c}
              </div>`}var ir=ae(()=>{ia();fa();la()});function ui(r,e,t){if(!tn.includes(t))return{action:"none"};let a=e&&typeof e=="object"&&!Array.isArray(e)?e:null;return a&&Object.prototype.hasOwnProperty.call(a,t)?a[t]:Object.prototype.hasOwnProperty.call(r!=null?r:{},t)?r[t]:an[t]}function oi(r){return(r==null?void 0:r.action)!=="none"}function ya(r,e){var a,i,n;let t=typeof r.composedPath=="function"?r.composedPath():[r.target];for(let l of t){if(!l||l===e)break;if(l.nodeType!==1)continue;let s=(a=l.tagName)==null?void 0:a.toLowerCase(),o=(i=l.getAttribute)==null?void 0:i.call(l,"role");if((n=l.matches)!=null&&n.call(l,'button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="link"],[role="slider"],[role="switch"],[role="checkbox"],[role="radio"]')||s!=null&&s.startsWith("ha-")&&l.tabIndex>=0||o&&["button","link","slider","switch","checkbox","radio"].includes(o))return!0}return r.defaultPrevented===!0}function di(r,{resolveAction:e,dispatchAction:t,label:a}={}){if(!r||typeof r.addEventListener!="function"||typeof r.setAttribute!="function"||typeof r.removeAttribute!="function"||typeof e!="function"||typeof t!="function")return()=>{};let i=w=>e(w),n=w=>oi(i(w)),l=n("tap_action");l?(r.setAttribute("role","button"),r.setAttribute("tabindex","0"),a&&r.setAttribute("aria-label",a)):(r.removeAttribute("role"),r.removeAttribute("tabindex"),r.removeAttribute("aria-label"));let s=null,o=null,u=null,d=!1,c=!1,b=null,h=0,p=()=>{o!==null&&clearTimeout(o),o=null},f=()=>{u!==null&&clearTimeout(u),u=null,d=!1},v=()=>{b!==null&&clearTimeout(b),b=null,c=!1},m=()=>{v(),c=!0,b=setTimeout(v,0)},y=w=>{let M=i(w);oi(M)&&t({config:M,action:rn[w]})},_=w=>{w.button!==void 0&&w.button!==0||ya(w,r)||(v(),s={id:w.pointerId,held:!1},p(),o=setTimeout(()=>{s&&(s.held=!0,f(),y("hold_action"))},nn))},g=w=>{if(!s||s.id!==void 0&&w.pointerId!==s.id)return;let M=s;if(s=null,p(),m(),!(M.held||ya(w,r))){if(n("double_tap_action")){d?(f(),y("double_tap_action")):(d=!0,u=setTimeout(()=>{d=!1,u=null,y("tap_action")},ln));return}y("tap_action")}},x=()=>{s!=null&&s.held&&m(),s=null,p()},S=w=>{!l||w.repeat||ya(w,r)||w.key!=="Enter"&&w.key!==" "||(w.preventDefault(),v(),h=Date.now()+500,y("tap_action"))},k=w=>{if(c){v();return}w.detail!==0||Date.now()<h||ya(w,r)||y("tap_action")};return r.addEventListener("pointerdown",_),r.addEventListener("pointerup",g),r.addEventListener("pointercancel",x),r.addEventListener("lostpointercapture",x),r.addEventListener("keydown",S),r.addEventListener("click",k),()=>{p(),f(),v(),r.removeEventListener("pointerdown",_),r.removeEventListener("pointerup",g),r.removeEventListener("pointercancel",x),r.removeEventListener("lostpointercapture",x),r.removeEventListener("keydown",S),r.removeEventListener("click",k)}}var tn,an,rn,nn,ln,ci=ae(()=>{tn=Object.freeze(["tap_action","hold_action","double_tap_action"]),an=Object.freeze({tap_action:Object.freeze({action:"more-info"}),hold_action:Object.freeze({action:"none"}),double_tap_action:Object.freeze({action:"none"})}),rn=Object.freeze({tap_action:"tap",hold_action:"hold",double_tap_action:"double_tap"}),nn=500,ln=250});var kt,hi=ae(()=>{Ft();Sa();fe();Yt();Ta();Ba();ia();la();Qt();Vt();fa();ir();ci();kt=class extends HTMLElement{static async getConfigElement(){return Nt("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._actionConfig={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._extrema=new WeakMap,this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._rowActionCleanup=[],this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._rowGeneration+=1,this._clearRowActionHandlers(),window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var a;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._clearRowActionHandlers(),this._rowGeneration+=1;let t=this._config;this._actionConfig=e,this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((a=t==null?void 0:t.entities)!=null?a:[]),this._diagnostics=Zt(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var d,c,b,h;let t=(p,f="")=>{if(Array.isArray(p))return p.map(t);if(p&&typeof p=="object")return Object.fromEntries(Object.keys(p).sort().filter(v=>!["severity","segment_space","label_precision_key"].includes(v)).map(v=>[v,t(p[v],v)]));if(f==="fixed")return we(null,p);if(/color/i.test(f)&&typeof p=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(p.trim())){let v=p.trim().slice(1).toLowerCase();return`#${v.length===3?v.split("").map(m=>m+m).join(""):v}`}return p},a=p=>{var f;return JSON.stringify(t({entity:p.entity,name:p.name,icon:(f=p.icon)!=null?f:null,layout:p.layout,scale:Object.fromEntries(["min","max"].map(v=>[v,{...p.scale[v],fixed_explicit:p.scale[v].fixed_explicit!==!1}])),bar:p.bar,baseline:p.baseline,formatting:p.formatting,target_marker:p.target_marker,peak_marker:p.peak_marker,floor_marker:p.floor_marker,generic_markers:p.generic_markers}))},i=new Set(e),n=new Map,l=new Map(e.map(p=>[p,a(p)]));for(let p of this._config.entities){let f=a(p),v=[...i].find(m=>l.get(m)===f);v&&(n.set(p,v),i.delete(v))}let s=this._config.entities.filter(p=>!n.has(p));for(let p of s){let f=[...i].filter(m=>m.entity===p.entity),v=s.filter(m=>m.entity===p.entity);f.length!==1||v.length!==1||(n.set(p,f[0]),i.delete(f[0]))}let o=new WeakMap,u=new WeakMap;for(let[p,f]of n){let v=this._extrema.get(f),m={};for(let y of["peak","floor"]){let _=f[`${y}_marker`],g=p[`${y}_marker`];v!=null&&v[y]&&(_==null?void 0:_.show)===!0&&(g==null?void 0:g.show)===!0&&JSON.stringify(_.reset)===JSON.stringify(g.reset)&&(m[y]={...v[y]})}(m.peak||m.floor)&&o.set(p,m),((c=(d=f.layout)==null?void 0:d.label)==null?void 0:c.position)==="left"&&((h=(b=p.layout)==null?void 0:b.label)==null?void 0:h.position)==="left"&&this._leftModeResponsiveHistory.has(f)&&u.set(p,this._leftModeResponsiveHistory.get(f))}this._extrema=o,this._leftModeResponsiveHistory=u}_clearRowActionHandlers(){this._rowActionCleanup.forEach(e=>e()),this._rowActionCleanup=[]}_logDiagnostics(){var a;let e=(a=this._diagnostics)!=null?a:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}),e.errors.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}))}normalizeCardConfig(e){return Xt(e)}normalizeEntityConfig(e,t){return Ia(e,t)}normalizeResolvableValue(e,t,a=null){return X(e,t,a)}_looksLikeEntityId(e){return ie(e)}_parsePercentLiteral(e){return me(e)}_getFiniteNumber(e){return D(e)}normalizeStructuredResolvableValue(e,t=null,a=null,i={}){return de(e,t,a,i)}normalizeBaselineDirectionConfig(e,t=null){return ye(e,t)}normalizeBaselineConfig(e,t){return Ot(e,t)}inferSegmentEndValues(e,t=null){return sa(e,t)}normalizeSeverityToSegments(e){return Dt(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return lt(e)}normalizeScaleBound(e,t,a,i){return Lt(e,t,a,i)}normalizeScaleConfig(e,t){return Ht(e,t)}_fillStyleToColorMode(e){return Ra(e)}_colorModeToFillStyle(e){return dt(e)}_normalizeBarModeConfig(e=null,t=null){return xe(e,t)}_resolveNormalizedBarMode(e,t,a,i){return Fa(e,t,a,i)}_normalizeGradientStops(e){return za(e)}normalizeNeedleConfig(e,t=null){return Pa(e,t)}normalizeBarConfig(e,t){return Ut(e,t)}normalizeLayoutConfig(e,t){return Et(e,t)}_clampSupportedRowHeight(e){return Aa(e)}normalizeFormattingConfig(e,t){return jt(e,t)}normalizeTargetMarkerConfig(e,t){return Gt(e,t)}normalizePeakMarkerConfig(e,t){return Kt(e,t)}_normalizeOptionalEnabled(e){return st(e)}set hass(e){let t=this._hass;if(this._hass=e,!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var i,n,l,s,o,u,d;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),a=(l=(n=(i=this._hass)==null?void 0:i.states)==null?void 0:n[t.entity])!=null?l:null;return{...t,icon:t.icon===!1?!1:(u=(o=t.icon)!=null?o:(s=a==null?void 0:a.attributes)==null?void 0:s.icon)!=null?u:this._getDefaultEntityIcon(a,t.entity),name:(d=t.name)!=null?d:null}}_getStateTimestamp(e){var i;let t=(i=e==null?void 0:e.last_updated)!=null?i:e==null?void 0:e.last_changed,a=t instanceof Date?t.getTime():Date.parse(String(t!=null?t:""));return Number.isFinite(a)?a:Date.now()}_updateExtrema(e,t,a){var o,u,d;let i=ct(a,t==null?void 0:t.attribute),n=i.available&&i.attributeFound?D(i.value):null;if(!Number.isFinite(n))return;let l=(o=this._extrema.get(e))!=null?o:{},s=this._getStateTimestamp(a);for(let c of["peak","floor"]){let b=t==null?void 0:t[`${c}_marker`];if((b==null?void 0:b.show)!==!0){delete l[c];continue}l[c]=It((u=l[c])!=null?u:null,n,(d=b.reset)!=null?d:{kind:"never"},c==="floor"?"min":"max",s)}l.peak||l.floor?this._extrema.set(e,l):this._extrema.delete(e)}_getDefaultEntityIcon(e,t=""){var l,s,o;let a=String((s=(l=e==null?void 0:e.attributes)==null?void 0:l.device_class)!=null?s:"").trim();if(a){let u={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(u[a])return u[a]}let i=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[i])!=null?o:null}_shouldUpdate(e,t){var a,i,n,l,s,o,u,d,c,b,h;if(!this._config||!this._config.entities)return!0;for(let p of this._config.entities){let f=this._resolve(p),v=[p.entity,(i=(a=f.scale)==null?void 0:a.min)==null?void 0:i.entity,(l=(n=f.scale)==null?void 0:n.max)==null?void 0:l.entity,(o=(s=f.baseline)==null?void 0:s.at)==null?void 0:o.entity,(d=(u=f.target_marker)==null?void 0:u.source)==null?void 0:d.entity,...((c=f.generic_markers)!=null?c:[]).filter(m=>m.accepted).flatMap(m=>{var y,_;return[(y=m.source)==null?void 0:y.entity,(_=m.label)==null?void 0:_.entity]})].filter(Boolean);for(let m of v){let y=(b=e.states[m])!=null?b:null,_=(h=t.states[m])!=null?h:null;if(y!==_)return!0}}return!1}_setStyleIfChanged(e,t,a){return Y(e,t,a)}_setStyleTextIfChanged(e,t){return Se(e,t)}_setTextIfChanged(e,t){var i;if(!e)return!1;let a=t==null?"":String(t);return((i=e.textContent)!=null?i:"")===a?!1:(e.textContent=a,!0)}_setDatasetIfChanged(e,t,a){return se(e,t,a)}_setClassNameIfChanged(e,t){return na(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,a;((a=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?a:[]).forEach(i=>{let n=i.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${n}"]`,`.generic-marker[data-marker-id="${n}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var i;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let n=e.dataset.markerId;return(i=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(l=>l.dataset.markerId===n))!=null?i:null}let a=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return a?t.querySelector(a):null}_getGenericMarkerForLabel(e){var i,n;let t=e==null?void 0:e.closest(".row"),a=(i=e==null?void 0:e.dataset)==null?void 0:i.markerId;return!t||!a?null:(n=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(l=>l.dataset.markerId===a))!=null?n:null}_setMarkerHover(e){var a;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((a=this._markerHover)==null?void 0:a.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var i,n,l;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),a=(l=t==null?void 0:t.matches)!=null&&l.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._setMarkerHover(a)}_handleMarkerPointerOut(e){var i,n;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let a=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._clearMarkerHover(a)}_positionMarkerValueLabel(e,t,a){let i=e.querySelector(".bar-track"),n=e.querySelector(t),l=e.querySelector(a);if(!i||!n||!l)return;if(l.style.display==="none"||!n.textContent.trim()){this._setStyleIfChanged(n,"visibility","hidden");return}let s=i.getBoundingClientRect(),o=Math.max(0,Math.floor(s.width-4));this._setStyleIfChanged(n,"maxWidth",`${o}px`);let u=n.getBoundingClientRect(),d=parseFloat(l.style.left);if(!Number.isFinite(d)||s.width<=0||u.width<=0||o<=10){this._setStyleIfChanged(n,"visibility","hidden");return}let c=d/100*s.width,b=u.width/2,h=Math.max(b,Math.min(s.width-b,c));this._setStyleIfChanged(n,"left",`${h}px`),this._setStyleIfChanged(n,"transform","translateX(-50%)"),this._setStyleIfChanged(n,"visibility","visible")}_getEntityNumericValue(e){return ge(this._hass,e)}_getNumericValue(e,t=null){return we(this._hass,e,t)}_resolvePercentValue(e,t,a){return Va(e,t,a)}_getNormalizedResolvableNumericValue(e,t=null,a=null){return ce(this._hass,e,t,a)}_hexToRgb(e){return $e(e)}_getSeverityInterpolationStops(e,t=0,a=100){return ba(e,t,a)}_getSeverityBandGradientCss(e,t=0,a=100){return qa(e,t,a)}_getSoftBandBlendWidthPct(){return Oa()}_pushGradientColorStop(e,t,a){return pe(e,t,a)}_getSoftBandGradientStops(e,t=0,a=100){return yt(e,t,a)}_getSoftBandGradientCss(e,t=0,a=100){return Ha(e,t,a)}_resolveSegmentBoundaryPct(e,t,a){return oa(e,t,a)}_getEffectiveFillStyle(e){return xt(e)}_segmentsNeedBoundaryResolution(e){return Ua(e)}_getSegmentsForRendering(e,t=0,a=100){return Re(e,t,a)}_getColor(e,t,a=0,i=100){return Ea(e,t,a,i)}_buildFullScaleGradientStyle(e){return ja(e)}_getGradientInterpolationStops(e,t=0,a=100){return Ga(e,t,a)}_rgbToCss(e){return Ka(e)}_buildSolidGradientStyle(e){return ua(e)}_getBasePaintGradient(e,t,a=0,i=100){return Xa(e,t,a,i)}_getOverlayGradient(e,t,a){return da(e,t,a)}_toScalePct(e,t,a){return vt(e,t,a)}_getRevealTransitionDuration(e,t){return pa(e,t)}_resolveBaselinePct(e,t,a){var n,l;if(((n=e.baseline)==null?void 0:n.enabled)===!1)return null;let i=this._getNormalizedResolvableNumericValue((l=e.baseline)==null?void 0:l.at,t,a);return Number.isFinite(i)?this._toScalePct(i,t,a):null}_formatNumericDisplay(e,t=null){return he(e,t)}_getNormalizedPercent(e,t=null){return ca(e,t)}_getEndpointSemantics(e){return Ya(e)}_getRevealCornerRadii(e){return Ja(e)}_getAboveTargetOverlayInterval(e=null){return Za(e)}_getAboveTargetLayerGeometry(e=null){return Qa(e)}_getFullScalePaintStyle(e,t,a=null,i=null,n=0,l=100){return Ca(e,t,a,i,n,l)}_getRevealShapeStyle(e,t){return er(e,t)}_getStaticLayerRevealStyle(e){return ha(e)}_getFillPaintLayers(e,t,a,i,n=null,l=null,s=0,o=100){return tr(e,t,a,i,n,l,s,o)}_getFillRenderState(e,t,a,i,n=null,l=null,s=0,o=100,u=!1){return ar(e,t,a,i,n,l,s,o,u)}_getNeedleRenderState(e,t,a=0,i=100,n=null){return si(e,t,a,i,n)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
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
${zt}
${At('.row[data-bar-animated="false"]')}
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
${Pt}
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
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==a||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=a,this._applyCompactTier(),a.observe(e),a.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,a){var l,s,o;if(a||!e||!t)return 0;let i=Math.floor((s=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?s:0),n=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(i,8)||!Number.isFinite(n)||n<=0?0:Math.min(n,i*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",a=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let i=["normal","compact","tight","dense","compressed"],n="normal";e<170?n="compressed":e<210?n="dense":e<255?n="tight":e<320&&(n="compact");let l=i.indexOf(n),s=Number.isFinite(a)?a<=44&&e>=205?2:a<=72&&e>=185?1:0:0;return i[Math.max(0,l-s)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var i,n;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(i=this.shadowRoot)==null?void 0:i.querySelector("ha-card"),a=(n=t==null?void 0:t.getBoundingClientRect().width)!=null?n:0;if(!this._isReliableWidth(a)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=e.getBoundingClientRect().width;if(!this._isReliableWidth(a)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(a,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let a=e.querySelector(".label-left-text"),i=((a==null?void 0:a.textContent)||"").trim(),n=a?this._measureTextWidthWithStyles(a,i)||a.scrollWidth:Number.POSITIVE_INFINITY,l=this._classifyLeftDensity(t,e.dataset.leftDensity,n);e.dataset.leftDensity=l})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var S,k,w,M,F,R;let t=e.closest(".bar-track"),a=e.closest(".main-line"),i=e.querySelector(".inside-name"),n=e.querySelector(".inside-value");if(!t||!i||!n)return;let l=this._decodeDataAttr(n.dataset.display||n.textContent||""),s=this._decodeDataAttr(n.dataset.unit||"");n.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(n,l,s,!1),u=this._measureInsideValueMarkupWidth(n,l,s,!0),d=(k=(S=a==null?void 0:a.getBoundingClientRect)==null?void 0:S.call(a).width)!=null?k:0,c=this._isReliableWidth(d)?this._classifyRowDensity(d,(w=a==null?void 0:a.dataset)==null?void 0:w.rowDensity):((M=a==null?void 0:a.dataset)==null?void 0:M.rowDensity)||"normal",b=(R=(F=a==null?void 0:a.querySelector)==null?void 0:F.call(a,".icon-wrap"))!=null?R:null,h=b?this._getLeftModeIconWidth(b,a)+this._getLeftModeGap(a):0,p=this._getLeftModeBarMinWidth(a),f=this._isReliableWidth(d)?Math.max(p,d-h):t.getBoundingClientRect().width,v=this._isReliableWidth(d)?Math.max(p,d):f+h,m=(i.textContent||"").trim(),y=this._measureTextWidthWithStyles(i,m)||i.scrollWidth,_=$=>{let P=c==="compressed"?"compressed":this._classifyInsideDensity($,o);e.dataset.insideDensity=P,e.dataset.valueFit="normal",n.dataset.valueFit="normal";let L=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),I=Math.max(0,$-L),T=!!s&&o>I,z=T?u:o,V="normal";z>I&&(V="compact",e.dataset.valueFit=V,n.dataset.valueFit=V,I=Math.max(0,$-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),z=this._measureInsideValueMarkupWidth(n,l,s,!0));let B=z>I,j=B?0:this._getNumericStyleValue(e,"gap",0),Z=Math.max(0,Math.min(I*(P==="compact"?.56:P==="tight"?.48:.6),I-(B?0:Math.ceil(z))-j)),O=P==="dense"||P==="compressed";if(m&&y>0){let q=this._getInsideUsefulNameWidth(i,m,y),A=this._measureVisibleLabelCharacters(i,m,Z);O=Z<q||y>Z+1&&A<Math.min(4,m.length)}return{density:P,valueFit:V,hideUnit:T,hideValue:B,hideName:O,rank:B?3:V==="compact"?2:T?1:0}},g=c==="dense"||c==="compressed",x=_(g?v:f);if(b&&!g){let $=_(v);($.rank<x.rank||$.rank===x.rank&&x.hideName&&!$.hideName)&&(g=!0,x=$)}e.dataset.insideDensity=x.density,e.dataset.valueFit=x.valueFit,e.dataset.hideName=x.hideName?"true":"false",n.dataset.valueFit=x.valueFit,n.dataset.hideUnit=x.hideUnit?"true":"false",n.dataset.hideValue=x.hideValue?"true":"false",a&&(a.dataset.hideInsideIcon=g?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var _,g,x,S,k,w,M,F,R,$,P,L,I,T,z;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let a=e.classList.contains("hero-line"),i=a?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,n="normal";if(i<90?n="xs":i<110?n="compressed":i<150?n="dense":i<210?n="tight":i<280&&(n="compact"),a){e.dataset.heroDensity=n,t.dataset.hideName=n==="dense"||n==="compressed"||n==="xs"?"true":"false",e.dataset.hideHeroIcon=n==="compressed"||n==="xs"?"true":"false";return}e.dataset.aboveDensity=n;let l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((_=s==null?void 0:s.dataset)==null?void 0:_.display)||""),u=this._decodeDataAttr(((g=s==null?void 0:s.dataset)==null?void 0:g.unit)||""),d=(x=e.closest)==null?void 0:x.call(e,".row"),c=(S=d==null?void 0:d.querySelector)==null?void 0:S.call(d,".main-line.above-mode"),b=((k=c==null?void 0:c.dataset)==null?void 0:k.rowDensity)||"normal",h=(M=(w=c==null?void 0:c.querySelector)==null?void 0:w.call(c,".icon-wrap"))!=null?M:null,p=(F=h==null?void 0:h.getBoundingClientRect)==null?void 0:F.call(h),f=h&&typeof getComputedStyle=="function"?getComputedStyle(h):null,v=!!h&&b!=="compressed"&&(f==null?void 0:f.display)!=="none"&&((R=p==null?void 0:p.width)!=null?R:0)>0&&(($=p==null?void 0:p.height)!=null?$:0)>0,m=n==="dense"||n==="compressed",y=!v;if(l&&s&&o){let V=(P=e.closest)==null?void 0:P.call(e,".row-stack"),B=(z=(T=(L=V==null?void 0:V.getBoundingClientRect)==null?void 0:L.call(V).width)!=null?T:(I=e.getBoundingClientRect)==null?void 0:I.call(e).width)!=null?z:i,j=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,J=v?p.width:0,Z=j?this._getNumericStyleValue(e,"gap",0):0,O=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),q=Math.ceil(this._measureValueMarkupWidth(s,o,u,!1)+2),A=Math.ceil(this._measureValueMarkupWidth(s,o,u,!0)+2),H=(l.textContent||"").trim(),W=v&&J>0?J+Z:0,U=this._measureTextWidthWithStyles(l,H)||l.scrollWidth||0,G=Math.max(0,B-W-O),E=(re,ne=G)=>{let le=Math.max(0,ne-re),be=this._measureVisibleLabelCharacters(l,H,le);return!this._shouldHideLeftLabel(H,U,le,be)},te=Math.max(0,B),Q=!1;q<=G&&E(q)?(m=!1,y=!v):q<=te?(m=!E(q,B-O),y=!0):A<=G&&E(A)?(m=!1,Q=!!u,y=!v):E(A,B-O)?(m=!1,y=!0,Q=!!u):(m=!0,y=!0,Q=!!u&&q>te),s.dataset.hideUnit=Q?"true":"false"}else s&&(s.dataset.hideUnit="false");t.dataset.hideName=m?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var s,o,u,d,c,b,h,p,f;let t=(s=e==null?void 0:e.closest)==null?void 0:s.call(e,".row"),a=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),i=(u=a==null?void 0:a.querySelector)==null?void 0:u.call(a,".main-line.hero-mode"),n=(d=i==null?void 0:i.querySelector)==null?void 0:d.call(i,".bar-wrap"),l=[(c=t==null?void 0:t.getBoundingClientRect)==null?void 0:c.call(t).width,(b=a==null?void 0:a.getBoundingClientRect)==null?void 0:b.call(a).width,(h=i==null?void 0:i.getBoundingClientRect)==null?void 0:h.call(i).width,(p=n==null?void 0:n.getBoundingClientRect)==null?void 0:p.call(n).width,(f=e==null?void 0:e.getBoundingClientRect)==null?void 0:f.call(e).width];for(let v of l)if(this._isReliableWidth(v,8))return v;return 0}_measureHeroValueWidth(e,t,a="normal",i=!1){var h,p,f,v,m,y,_,g,x,S,k,w,M,F;let n=(h=this.shadowRoot)==null?void 0:h.querySelector(".measure-layer");if(!n||!e||!t)return 0;let l=this._decodeDataAttr(t.dataset.display||t.textContent||""),s=this._decodeDataAttr(t.dataset.unit||"");if(!l)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=a,o.dataset.hideHeroUnit=i?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((f=(p=e.style)==null?void 0:p.getPropertyValue)==null?void 0:f.call(p,"--sbcp-hero-base-size"))||null);let u=document.createElement("span");u.className="hero-value",u.dataset.display=t.dataset.display||"",u.dataset.unit=t.dataset.unit||"",u.innerHTML=this._formatRightValueMarkup(l,s,i),u.style.display="inline-flex",u.style.flex="0 0 auto",u.style.width="auto",u.style.minWidth="0",u.style.maxWidth="none",u.style.justifyContent="flex-start",u.style.justifySelf="start",u.style.overflow="visible";let d=u.querySelector(".value-right-text");d&&(d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.overflow="visible");let c=u.querySelector(".value-right-number");c&&(c.style.flex="0 0 auto",c.style.minWidth="0",c.style.overflow="visible",c.style.textOverflow="clip");let b=u.querySelector(".unit-group");return b&&(b.style.flex="0 0 auto",b.style.minWidth="0",b.style.overflow="visible"),o.appendChild(u),n.replaceChildren(o),Math.max(Math.ceil((m=(v=u.getBoundingClientRect)==null?void 0:v.call(u).width)!=null?m:0),Math.ceil(u.scrollWidth||0),Math.ceil((g=(_=(y=d==null?void 0:d.getBoundingClientRect)==null?void 0:y.call(d).width)!=null?_:d==null?void 0:d.scrollWidth)!=null?g:0),Math.ceil((k=(S=(x=c==null?void 0:c.getBoundingClientRect)==null?void 0:x.call(c).width)!=null?S:c==null?void 0:c.scrollWidth)!=null?k:0),Math.ceil((F=(M=(w=b==null?void 0:b.getBoundingClientRect)==null?void 0:w.call(b).width)!=null?M:b==null?void 0:b.scrollWidth)!=null?F:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var h,p;let t=e.querySelector(".hero-header"),a=e.querySelector(".hero-label"),i=e.querySelector(".hero-value"),n=e.querySelector(".unit-group");if(!t||!i)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let l=Math.floor((p=(h=t.getBoundingClientRect)==null?void 0:h.call(t).width)!=null?p:0);if(!this._isReliableWidth(l,8)){this._schedulePostLayoutDensityPass();return}let s=!!n&&n.textContent.trim().length>0,o=t.dataset.hideName==="true",u=!o&&a?this._getNumericStyleValue(t,"column-gap",0):0,d=(f="normal",v=!1)=>this._measureHeroValueWidth(e,i,f,v),c=Math.max(0,l-u-4),b=Math.max(0,l-4);if(!this._isReliableWidth(b,8)){e.dataset.hideHeroUnit=s?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(d("normal",!1)<=c)&&!(!o&&a&&(t.dataset.priorityHideName="true",d("normal",!1)<=b))){if(s){for(let f of["tight","minimum"]){let v=d(f,!1);if(v<=b){if(e.dataset.heroValueFit=f,!o&&a){let m=(a.textContent||"").trim(),y=this._measureTextWidthWithStyles(a,m),_=Math.max(0,c-v);this._shouldHideLeftLabel(m,y,_,this._measureVisibleLabelCharacters(a,m,_))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",d("normal",!0)<=b)return}e.dataset.heroValueFit="tight",!(d("tight",s)<=b)&&(e.dataset.heroValueFit="minimum",!(d("minimum",s)<=b)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,a,i){var s;let n=(s=this.shadowRoot)==null?void 0:s.querySelector(".measure-layer");if(!n||!e)return 0;let l=e.cloneNode(!1);return l.removeAttribute("data-hide-unit"),l.style.removeProperty("--sbcp-value-extra-width"),l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.innerHTML=this._formatRightValueMarkup(t,a,i),n.replaceChildren(l),l.scrollWidth}_measureInsideValueMarkupWidth(e,t,a,i=!1){var o;let n=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!n||!e)return(e==null?void 0:e.scrollWidth)||0;let l=e.cloneNode(!1);l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.style.overflow="visible",l.style.textOverflow="clip",l.style.whiteSpace="nowrap",l.innerHTML=this._formatInsideValueMarkup(t,a,i),l.removeAttribute("data-hide-value");let s=document.createElement("div");return s.className="bar-inner-label",s.style.cssText="position:static;display:block;padding:0",s.appendChild(l),n.replaceChildren(s),l.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var n;let a=(n=this.shadowRoot)==null?void 0:n.querySelector(".measure-layer");if(!a||!e)return 0;let i=e.cloneNode(!1);return i.textContent=t,i.style.width="auto",i.style.minWidth="0",i.style.maxWidth="none",i.style.flex="0 0 auto",i.style.overflow="visible",i.style.textOverflow="clip",i.style.whiteSpace="nowrap",a.replaceChildren(i),i.scrollWidth}_measureVisibleLabelCharacters(e,t,a){if(!e||!t||!Number.isFinite(a)||a<=0)return 0;let i=this._measureTextWidthWithStyles(e,"..."),n=Math.max(0,a-i);if(n<=0)return 0;let l=0,s=t.length;for(;l<s;){let o=Math.ceil((l+s)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=n?l=o:s=o-1}return l}_shouldHideLeftLabel(e,t,a,i){return!e||!Number.isFinite(t)||!Number.isFinite(a)?!1:t>a+1&&i<5}_getInsideUsefulNameWidth(e,t,a=NaN){if(!t)return 0;let i=Number.isFinite(a)&&a>0?a:this._measureTextWidthWithStyles(e,t),n=t.slice(0,Math.min(5,t.length)),l=this._measureTextWidthWithStyles(e,n)+this._measureTextWidthWithStyles(e,"..."),s=Math.max(36,Math.min(44,l||0));return Math.min(i||s,s)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var c,b,h,p,f;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let i=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((h=(b=(c=e==null?void 0:e.ownerDocument)==null?void 0:c.defaultView)==null?void 0:b.getComputedStyle)==null?void 0:h.bind(e.ownerDocument.defaultView));if(!i)return;let n=i(e),l=parseFloat(n.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,s=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2),o=e.closest(".main-line"),u=s;if(o!=null&&o.classList.contains("off-mode")){let v=o.querySelector(".bar-wrap"),m=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(i(o).gap)||0,_=(f=(p=o.getBoundingClientRect)==null?void 0:p.call(o).width)!=null?f:0,g=parseFloat(i(v).minWidth)||0,x=m&&i(m).display!=="none",S=x?this._getLeftModeIconWidth(m,o):0,k=Math.max(0,_-g-y),w=k-(x?S+y:0),M=Math.ceil(this._measureValueMarkupWidth(e,t,a,!0)+2),F=x&&(s>w&&s<=k||M>w&&M<=k);o.dataset.hideOffIcon=F?"true":"false";let R=F?k:w;if(R>0){let $=s<=R?s:M;u=Math.min($,R)}}let d=Math.max(0,u-l);e.style.setProperty("--sbcp-value-extra-width",`${d}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var l,s,o,u;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!((l=e.classList)==null?void 0:l.contains("above-bar-label-value"))&&t){let d=(u=(o=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?o:e.clientWidth)!=null?u:0,c=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);i=a&&d>0?c>d:!1,e.dataset.hideUnit=i?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,a,i)&&(e.innerHTML=this._formatRightValueMarkup(t,a,i))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let l=this._formatInsideValueMarkup(t,a,i);e.innerHTML!==l&&(e.innerHTML=l)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,a=0){if(!e)return a;try{let i=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(i)?i:a}catch(i){return a}}_getLeftModeGap(e){var i;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.rowDensity)||"normal";return a==="tight"?7:a==="dense"||a==="compressed"?6:8}_getLeftModeBarMinWidth(e){var i;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.leftDensity)||"normal";return a==="compact"?52:a==="tight"?48:a==="dense"?44:a==="compressed"?40:56}_getLeftModeIconWidth(e,t){var l,s;let a=(l=e==null?void 0:e.getBoundingClientRect)==null?void 0:l.call(e).width;if(this._isReliableWidth(a,1))return a;let i=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(i))return i;let n=((s=t==null?void 0:t.dataset)==null?void 0:s.leftDensity)||"normal";return n==="compact"?26:n==="tight"?24:n==="dense"?23:n==="compressed"?22:28}_getReservedInlineValueWidth(e){var u,d,c;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),n=parseFloat(((d=(u=e.style)==null?void 0:u.getPropertyValue)==null?void 0:d.call(u,"--sbcp-value-extra-width"))||((c=e.style)==null?void 0:c["--sbcp-value-extra-width"])||"0"),l=Number.isFinite(n)?n:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),s=Math.max(0,i+l);if(!t)return s;let o=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);return Math.max(s,o)}_getStableLeftLabelMetrics(e,t=null){var p,f,v,m,y,_,g,x,S,k;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".label-left-text");if(!a||!i||!n)return null;let l=(f=t!=null?t:(p=a.getBoundingClientRect)==null?void 0:p.call(a).width)!=null?f:0,s=(n.textContent||"").trim(),o=this._measureTextWidthWithStyles(n,s)||n.scrollWidth||0,u=((v=a.dataset)==null?void 0:v.leftDensity)||"normal",d={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},c=(y=(m=this._config)==null?void 0:m.entities)==null?void 0:y.find(w=>{var M;return w.entity===((M=e.dataset)==null?void 0:M.entity)}),b=c&&(S=(x=(g=(_=this._resolve(c))==null?void 0:_.layout)==null?void 0:g.label)==null?void 0:x.width)!=null?S:100,h=l>0?Math.min(b,l*((k=d[u])!=null?k:d.normal)):Math.min(o,b);return{text:s,naturalWidth:o,maximumWidth:h,labelWidth:h,labelText:n}}_estimateLeftModeWidthBudget(e){var x,S,k;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let a=(S=(x=t.getBoundingClientRect)==null?void 0:x.call(t).width)!=null?S:0;if(!this._isReliableWidth(a))return null;let i=e.querySelector(".label-left"),n=e.querySelector(".icon-wrap"),l=e.querySelector(".value-right"),s=this._getStableLeftLabelMetrics(e,a),o=(k=s==null?void 0:s.labelWidth)!=null?k:0,u=n?this._getLeftModeIconWidth(n,t):0,d=this._getReservedInlineValueWidth(l),c=this._getLeftModeGap(t),b=this._getLeftModeBarMinWidth(t),h=!!i,p=!!n,f=p?2:1,v=Math.max(0,a-(p?u:0)-b-f*c),m=Math.min(o,v),y=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,m,this._measureVisibleLabelCharacters(s.labelText,s.text,m)),_=Math.min(o,Math.max(0,a-b-c)),g=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,_,this._measureVisibleLabelCharacters(s.labelText,s.text,_));return{rowWidth:a,gap:c,barMinWidth:b,labelSacrificialWithoutIcon:g,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(u,0)?u:0,valueWidth:this._isReliableWidth(d,0)?d:0,baseLabelVisible:h,labelSacrificial:y,hasIcon:p,mainLine:t,iconWrap:n,valueEl:l,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,a=null){let i=a||this._estimateLeftModeWidthBudget(e);if(!i)return null;let n=i.baseLabelVisible&&!t.hideLabel,l=i.hasIcon&&!t.hideIcon,s=!t.topValue,o=1+(l?1:0)+(n?1:0)+(s?1:0),u=Math.max(0,o-1),d=(l?i.iconWidth:0)+(n?i.labelWidth:0)+(s?i.valueWidth:0)+u*i.gap,c=Math.max(0,i.rowWidth-d),b=c>=i.barMinWidth,h=b?c:i.barMinWidth;return{rowWidth:i.rowWidth,barWidth:h,share:h/i.rowWidth,showLabel:n,showIcon:l,showInlineValue:s,reservedWidth:d,gapCount:u,fits:b}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,a){let i=null;for(let n of t){let l=this._predictLeftModeBarShareForState(e,n,a);l&&(i={...n,predicted:l})}return i}_chooseLeftModeResponsiveState(e,t=!0){var c,b,h,p;let a=this._estimateLeftModeWidthBudget(e);if(!a)return null;let i=this._getMinimumBarShare(),n=this._getLeftModeCandidateStates(a),l=(b=this._config.entities)==null?void 0:b[Number((c=e==null?void 0:e.dataset)==null?void 0:c.rowIndex)],s=l&&this._leftModeResponsiveHistory.has(l)?this._leftModeResponsiveHistory.get(l):((p=(h=a.rowStack)==null?void 0:h.dataset)==null?void 0:p.forceTopValue)==="true",o=n.filter(f=>f.topValue),u=this._getTopValueEnableShare(),d=this._getTopValueDisableShare();for(let f of n){let v=f.topValue||t?i:s?d:u,m=this._predictLeftModeBarShareForState(e,f,a);if(m!=null&&m.fits&&m.share>=v)return{...f,predicted:m}}return this._chooseFallbackPredictedLeftModeState(e,o,a)}_applyLeftModeResponsiveState(e,t){var s,o;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".row-stack"),n=e==null?void 0:e.querySelector(".label-left");if(!a||!i)return;let l=(o=this._config.entities)==null?void 0:o[Number((s=e==null?void 0:e.dataset)==null?void 0:s.rowIndex)];l&&this._leftModeResponsiveHistory.set(l,(t==null?void 0:t.topValue)===!0),delete i.dataset.forceTopValue,delete a.dataset.hideLeftIcon,n&&delete n.dataset.priorityHidden,t!=null&&t.hideLabel&&n&&(n.dataset.priorityHidden="true"),t!=null&&t.topValue&&(i.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(a.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".bar-track");if(!t||!a)return null;let i=t.getBoundingClientRect().width,n=a.getBoundingClientRect().width;return!this._isReliableWidth(i)||!this._isReliableWidth(n,1)?null:{rowWidth:i,barWidth:n,share:n/i,mainLine:t,track:a}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".row-stack"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".above-bar-label"),l=e==null?void 0:e.querySelector(".bar-inner-label"),s=e==null?void 0:e.querySelector(".above-line");a&&delete a.dataset.forceTopValue,i&&delete i.dataset.priorityHidden,n&&delete n.dataset.priorityHideName,l&&delete l.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let a=e.querySelector(".label-left");a&&(a.dataset.priorityHidden="true");return}if(t==="above"){let a=e.querySelector(".above-bar-label");a&&(a.dataset.priorityHideName="true");return}if(t==="inside"){let a=e.querySelector(".bar-inner-label");a&&(a.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let a=e.querySelector(".row-stack");a&&(a.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let a=e.querySelector(".main-line");if(a){if(t==="left"){a.dataset.hideLeftIcon="true";return}if(t==="above"){a.dataset.hideAboveIcon="true";let i=e.querySelector(".above-line");i&&(i.dataset.hideAboveIcon="true");return}t==="inside"&&(a.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,a){var n,l,s,o,u,d,c,b,h,p;let i=(o=(s=a==null?void 0:a.rowWidth)!=null?s:(l=(n=e==null?void 0:e.querySelector(".main-line"))==null?void 0:n.getBoundingClientRect)==null?void 0:l.call(n).width)!=null?o:0;if(!this._isReliableWidth(i))return null;if(t==="left"){let f=e.querySelector(".label-left"),v=e.querySelector(".label-left-text");if(!f||!v)return null;let m=(v.textContent||"").trim(),y=v.clientWidth,_=v.scrollWidth,g=this._measureVisibleLabelCharacters(v,m,y),x=(d=(u=f.getBoundingClientRect)==null?void 0:u.call(f).width)!=null?d:y;return{text:m,visibleWidth:y,fullWidth:_,visibleChars:g,labelWidth:x,rowWidth:i}}if(t==="above"){let f=e.querySelector(".above-bar-label-name");if(!f)return null;let v=(f.textContent||"").trim(),m=f.clientWidth,y=f.scrollWidth,_=this._measureVisibleLabelCharacters(f,v,m),g=(b=(c=f.getBoundingClientRect)==null?void 0:c.call(f).width)!=null?b:m;return{text:v,visibleWidth:m,fullWidth:y,visibleChars:_,labelWidth:g,rowWidth:i}}if(t==="inside"){let f=e.querySelector(".inside-name");if(!f)return null;let v=(f.textContent||"").trim(),m=f.clientWidth,y=f.scrollWidth,_=this._measureVisibleLabelCharacters(f,v,m),g=(p=(h=f.getBoundingClientRect)==null?void 0:h.call(f).width)!=null?p:m;return{text:v,visibleWidth:m,fullWidth:y,visibleChars:_,labelWidth:g,rowWidth:i}}return null}_isLabelWorthSacrificing(e,t,a){let i=this._getLabelSacrificeMetrics(e,t,a);return!i||!i.text?!1:this._shouldHideLeftLabel(i.text,i.fullWidth,i.visibleWidth,i.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let a=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),i=this._getMinimumBarShare();a.forEach(n=>{let l=n.querySelector(".main-line");if(!l)return;let s=l.classList.contains("left-mode")?"left":l.classList.contains("above-mode")?"above":l.classList.contains("inside-mode")?"inside":"other";if(s==="other")return;if(s==="left"){let u=!t||t.get(l)===l.getBoundingClientRect().width,d=this._chooseLeftModeResponsiveState(n,u);d&&this._applyLeftModeResponsiveState(n,d),u||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(n);let o=this._getMeasuredBarShare(n);!o||o.share>=i||this._isLabelWorthSacrificing(n,s,o)&&(this._hideMinimumBarShareLabel(n,s),o=this._getMeasuredBarShare(n),!o||o.share>=i)||(this._forceMinimumBarShareTopValue(n,s),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(n),!(!o||o.share>=i)&&this._hideMinimumBarShareIcon(n,s))})}_shouldUseTopValueRow(e){var t,a,i;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((i=(a=e.closest)==null?void 0:a.call(e,".row-stack"))==null?void 0:i.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,a){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(a)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),a=e.querySelector(".row-stack");if(!t)return;let i=parseFloat(e.dataset.baseHeight||"38")||38,n=e.dataset.heightExplicit==="true",l=this._getEffectiveRowHeight(i,n,t);e.style.setProperty("--sbcp-row-height",`${l}px`),a&&a.style.setProperty("--sbcp-row-height",`${l}px`),t.style.height=`${l}px`;let s=t.querySelector(".label-left");s&&(s.style.height=`${l}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${l}px`,o.style.minHeight=`${l}px`);let u=t.querySelector(".bar-track");u&&(u.style.height=`${l}px`);let d=t.querySelector(".value-right");d&&(d.style.height=`${l}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var c,b,h,p,f;let t=e.closest(".row-stack"),a=e.querySelector(".value-right"),i=t==null?void 0:t.querySelector(".top-right-value");if(!t||!a||!i)return;let n=this._shouldUseTopValueRow(e);t.dataset.topValue=n?"true":"false",i.dataset.active=n?"true":"false";let l=this._decodeDataAttr(a.dataset.display||""),s=this._decodeDataAttr(a.dataset.unit||"");i.dataset.display=a.dataset.display||"",i.dataset.unit=a.dataset.unit||"",i.dataset.hideUnit="false";let o=(f=(p=(h=(c=t.getBoundingClientRect)==null?void 0:c.call(t).width)!=null?h:(b=i.getBoundingClientRect)==null?void 0:b.call(i).width)!=null?p:i.clientWidth)!=null?f:0,u=l?Math.ceil(this._measureValueMarkupWidth(i,l,s,!1)+2):0,d=!!s&&o>0&&u>o;i.dataset.hideUnit=d?"true":"false",i.innerHTML=this._formatRightValueMarkup(l,s,d)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var s;let t=e.querySelector(".label-left"),a=e.querySelector(".label-left-text");if(!t||!a)return;let i=((s=e.closest)==null?void 0:s.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?a:null},n=this._getStableLeftLabelMetrics(i);if(!n)return;let l=this._measureVisibleLabelCharacters(n.labelText,n.text,n.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(n.text,n.naturalWidth,n.labelWidth,l)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var i;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let a=new Map([...((i=this.shadowRoot)==null?void 0:i.querySelectorAll(".main-line.left-mode"))||[]].map(n=>[n,n.getBoundingClientRect().width]));requestAnimationFrame(()=>{var l;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,a),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((l=this.shadowRoot)==null?void 0:l.querySelectorAll(".row[data-entity]"))||[]).forEach(s=>{this._positionTargetLabel(s),this._positionMarkerValueLabel(s,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(s,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(s)})})})}_isTightUnit(e){return Da(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(a){return t}}_parseColorToRgb(e){return ma(e)}_rgbToHsl({r:e,g:t,b:a}){return rr({r:e,g:t,b:a})}_getMarkerContrastColor(e){return gt(e)}_getEffectiveMarkerColor(e){return _e(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return Me(e)}_formatDisplayWithUnit(e,t){return La(e,t)}_formatRightValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="value-right-text"><span class="value-right-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="${this._isTightUnit(n)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${i}</span><span class="unit-group"><span class="unit">${l}</span></span></span>`}_formatAboveValueMarkup(e,t,a=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${a?"true":"false"}">${this._formatRightValueMarkup(e,t,a)}</span>`}_formatInsideValueMarkup(e,t,a=!1){let i=ee(e);if(!t||a)return`<span class="inside-value-text"><span class="inside-number">${i}</span></span>`;let n=String(t),l=ee(n);return`<span class="inside-value-text ${this._isTightUnit(n)?"tight-unit":"has-unit"}"><span class="inside-number">${i}</span><span class="inside-unit">${l}</span></span>`}_getRowMarkerModels(e,t,a,i,n,l,s,o){if(e!=null&&e.markers)return e.markers.map(b=>{var h,p;return b.type==="target"?{...b,position:n===void 0?b.position:n,visible:n!=null,color:o||b.color,label:(h=b.label)!=null?h:l===null?null:{text:l}}:b.type==="floor"||b.type!=="peak"?b:{...b,position:a===void 0?b.position:a,visible:a!=null&&t.peak_marker.show===!0,color:s||b.color,label:(p=b.label)!=null?p:i===null?null:{text:i}}});let u=ra({entityConfig:t,targetPosition:n,targetPresentation:l===null?null:{text:l},targetVisible:Number.isFinite(n),peakPosition:a,peakPresentation:i===null?null:{number:i},peakVisible:Number.isFinite(a)}),d=this._getMarkerModel(u,"target"),c=this._getMarkerModel(u,"peak");return d&&o&&(d.color=o),c&&s&&(c.color=s),u}_getMarkerModel(e,t){var a;return(a=e.find(i=>i.id===t||i.type===t))!=null?a:null}_renderMarker(e){return Ne(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),Fe(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let a=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",a),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(a))}_buildRowViewModel(e,t,a){var n;let i=_t({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:a,extrema:(n=this._extrema.get(e))!=null?n:null,previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:i.min,max:i.max}),i}_buildRow(e,t,a,i,n,l,s,o,u,d,c,b,h,p=(v=>(v=(f=>(f=this._config.entities)==null?void 0:f.indexOf(e))())!=null?v:-1)()){var ze,Pe,Ae,Ie,Ve,We,Te,De,Le,Be,qe,Oe,He,Ue,Ee,je,Ge,Ke,Xe,Ye,Je,Ze,Qe,Ce,et,tt;let m=this._resolve(e),y=(Ae=(Pe=(ze=this._hass)==null?void 0:ze.states)==null?void 0:Pe[e.entity])!=null?Ae:null;y&&this._updateExtrema(e,m,y);let _=y?this._buildRowViewModel(e,m,y):null,g=m.layout,x=m.bar,S=Number.isFinite(b)?b:0,k=Number.isFinite(h)?h:100,w=(Ie=_==null?void 0:_.baselinePercent)!=null?Ie:this._resolveBaselinePct(m,S,k),M=g.label.position,F=(We=(Ve=_==null?void 0:_.attributes)==null?void 0:Ve.baseHeight)!=null?We:g.height,R=(Be=(Le=(Te=_==null?void 0:_.name)!=null?Te:m.name)!=null?Le:(De=y==null?void 0:y.attributes)==null?void 0:De.friendly_name)!=null?Be:e.entity,$=ee((qe=_==null?void 0:_.entityId)!=null?qe:e.entity),P=ee(R),L=this._getRowMarkerModels(_,m,l,s,o,u,d,c),I=this._getMarkerModel(L,"target"),T=this._getMarkerModel(L,"peak"),z=this._getMarkerModel(L,"floor"),V=L.filter(C=>C.type==="generic"),B=(Oe=_==null?void 0:_.markerLaneOccupancy)!=null?Oe:ta(m),j=(He=_==null?void 0:_.markerLabelLaneOccupancy)!=null?He:aa(m),J=(Ue=_==null?void 0:_.numericValue)!=null?Ue:this._getFiniteNumber(t),Z=(Ee=_==null?void 0:_.needle)!=null?Ee:this._getNeedleRenderState(J,m,S,k,w),O=wt({percent:i,min:S,max:k,targetPercent:o,baselinePercent:w,needle:Z,markers:L},m,{height:"var(--sbcp-row-height)",color:n}),q=I!=null&&I.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite(I.position)?I.position:0}%;visibility:${I.visible&&((je=I.label)!=null&&je.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(I)}">
        ${(Ge=I.label)!=null&&Ge.text?ee(I.label.text):""}
      </div>`:"",A=T!=null&&T.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(T.position)?T.position:0}%;visibility:${T.visible&&((Ke=T.label)!=null&&Ke.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(T)}">
        ${T.visible&&((Xe=T.label)!=null&&Xe.text)?ee(T.label.text):""}
      </div>`:"",H=z!=null&&z.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(z.position)?z.position:0}%;visibility:${z.visible&&((Ye=z.label)!=null&&Ye.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(z)}">
        ${z.visible&&((Je=z.label)!=null&&Je.text)?ee(z.label.text):""}
      </div>`:"",W=V.filter(C=>C.labelVisible).map(C=>{var at,rt;return`
      <div class="generic-value-label" data-marker-id="${ee(C.id)}" data-lane="${C.lane}" data-show-marker="${C.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(C.position)?C.position:0}%;visibility:${C.visible&&((at=C.label)!=null&&at.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(C)}">
        ${C.visible&&((rt=C.label)!=null&&rt.text)?ee(C.label.text):""}
      </div>`}).join(""),U=M==="above"?`
      <div class="above-line">
        ${m.icon&&m.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${P}</span>
          ${this._formatAboveValueMarkup(t,a,!1)}
        </div>
      </div>`:"",G=(Ze=g.hero.size)!=null?Ze:"small",E=g.hero.value_size,te=M==="hero"?`
      <div class="hero-line" data-hero-size="${G}"${Number.isFinite(E)?` style="--sbcp-hero-base-size:${E}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${P}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}">${this._formatRightValueMarkup(t,a,!1)}</span>
        </div>
      </div>`:"",Q=M==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${P}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,a,!1)}</span>
      </div>`:"",re=M==="left"?`<div class="label-left" style="flex:0 1 min(${g.label.width}px, var(--sbcp-left-label-share));max-width:min(${g.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${P}</span></div>`:"",ne=M!=="inside"&&M!=="above"&&M!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",le=M==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",be=m.icon&&m.icon!==!1?ee(m.icon):"",Mt=be&&M!=="hero"?`<div class="icon-wrap"><ha-icon icon="${be}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${p}" data-entity="${$}" data-base-height="${F}" data-height-explicit="${((Ce=(Qe=_==null?void 0:_.attributes)==null?void 0:Qe.heightExplicit)!=null?Ce:g.height_explicit)?"true":"false"}" data-bar-animated="${((tt=(et=_==null?void 0:_.attributes)==null?void 0:et.barAnimated)!=null?tt:x.animated)?"true":"false"}" data-marker-label-lane-above="${j.above?"true":"false"}" data-marker-label-lane-below="${j.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${F}px;">
          ${U}
          ${te}
          ${le}
          <div class="main-line ${M}-mode" data-marker-lane-above="${B.above?"true":"false"}" data-marker-lane-below="${B.below?"true":"false"}" style="height:${F}px;">
            ${Mt}
            ${re}
            <div class="bar-wrap">
              ${va(O,{insideContent:Q})}
              ${A}
              ${q}
              ${H}
              ${W}
            </div>
            ${ne}
          </div>
        </div>
      </div>`}_patchRow(e,t,a,i=null){var I,T,z,V,B,j,J,Z,O,q;if(!e||!a)return;let n=this._resolve(t);this._updateExtrema(t,n,a);let l=this._rowScales.get(t),s=this._buildRowViewModel(t,n,a),o=s.min,u=s.max,d=s.percent,c=this._getColor(d,n,o,u),b=s.primaryPresentation.number,h=s.primaryPresentation.unit,p=s.baselinePercent,f=wt(s,n,{height:"var(--sbcp-row-height)",color:c}),v=(T=(I=i==null?void 0:i.states)==null?void 0:I[t.entity])!=null?T:null,m=v?_t({hass:i,cardConfig:this._config,entityConfig:n,entityState:v,extrema:(z=this._extrema.get(t))!=null?z:null,previousScale:l}):null,y=this._getRevealTransitionDuration(m&&Number.isFinite(m.numericValue)?{valuePercent:m.percent,baselinePercent:m.baselinePercent}:null,Number.isFinite(s.numericValue)?{valuePercent:d,baselinePercent:p}:null),_=(V=this._markerHover)==null?void 0:V.marker;if(_&&e.contains(_)){let A=f.markers.find(H=>H.type==="generic"?_.dataset.markerId===H.id:_.matches(`.${H.type}-marker`));A&&!A.visible&&this._clearMarkerHover(_)}_a(e,f,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",s.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",s.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",s.attributes.barAnimated?"true":"false");let g=e.querySelector(".value-right");g&&(g.dataset.display=this._encodeDataAttr(b),g.dataset.unit=this._encodeDataAttr(h),g.dataset.hideUnit="false",g.innerHTML=this._formatRightValueMarkup(b,h,!1));let x=e.querySelector(".top-right-value");x&&(x.dataset.display=this._encodeDataAttr(b),x.dataset.unit=this._encodeDataAttr(h),x.dataset.hideUnit="false",x.innerHTML=this._formatRightValueMarkup(b,h,!1));let S=e.querySelector(".bar-inner-label");if(S){let A=S.querySelector(".inside-value");A&&(A.dataset.display=this._encodeDataAttr(b),A.dataset.unit=this._encodeDataAttr(h),A.dataset.hideUnit="false",A.dataset.hideValue="false",A.innerHTML=this._formatInsideValueMarkup(b,h,!1))}let k=e.querySelector(".hero-header");if(k){let A=e.querySelector(".hero-line");this._setStyleIfChanged(A,"--sbcp-hero-base-size",Number.isFinite(n.layout.hero.value_size)?`${n.layout.hero.value_size}px`:null),k.innerHTML=`<span class="hero-label label-left-text">${ee(s.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(b)}" data-unit="${this._encodeDataAttr(h)}">${this._formatRightValueMarkup(b,h,!1)}</span>`}let w=k?null:e.querySelector(".above-bar-label");w&&(w.innerHTML=`<span class="above-bar-label-name label-left-text">${ee(s.name)}</span>${this._formatAboveValueMarkup(b,h,!1)}`);let M=e.querySelector(".target-value-label"),F=e.querySelector(".peak-value-label"),R=e.querySelector(".floor-value-label"),$=(B=s.markers)!=null?B:[];((J=(j=e.querySelectorAll)==null?void 0:j.call(e,".generic-marker[data-marker-id]"))!=null?J:[]).forEach(A=>{var G,E,te,Q,re;let H=A.dataset.markerId,W=this._getMarkerModel($,H),U=[...(E=(G=e.querySelectorAll)==null?void 0:G.call(e,".generic-value-label[data-marker-id]"))!=null?E:[]].find(ne=>ne.dataset.markerId===H);U&&(this._setDatasetIfChanged(U,"showMarker",(W==null?void 0:W.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(U,W),W!=null&&W.labelVisible&&W.visible&&((te=W.label)!=null&&te.text)?(this._setTextIfChanged(U,(re=(Q=W.label)==null?void 0:Q.text)!=null?re:null),this._setStyleIfChanged(U,"visibility","visible"),this._setStyleIfChanged(U,"left",`${Number.isFinite(W.position)?W.position:0}%`)):this._setStyleIfChanged(U,"visibility","hidden"))});let P=this._getMarkerModel($,"target");this._patchMarkerLabelAppearance(M,P),M&&(P!=null&&P.labelVisible&&P.visible&&((Z=P.label)!=null&&Z.text)?this._setTextIfChanged(M,(q=(O=P.label)==null?void 0:O.text)!=null?q:null):this._setStyleIfChanged(M,"visibility","hidden"));let L=(A,H)=>{var U,G,E;if(!A)return;let W=this._getMarkerModel($,H);this._patchMarkerLabelAppearance(A,W),W!=null&&W.labelVisible&&W.visible&&((U=W.label)!=null&&U.text)?(this._setTextIfChanged(A,(E=(G=W.label)==null?void 0:G.text)!=null?E:null),this._setStyleIfChanged(A,"visibility","visible"),this._setStyleIfChanged(A,"left",`${Number.isFinite(W.position)?W.position:0}%`)):this._setStyleIfChanged(A,"visibility","hidden")};L(F,"peak"),L(R,"floor")}_update(e=null){var s,o,u,d;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let a=this._config.entities,i=a.map(c=>!!this._hass.states[c.entity]),n=i.some((c,b)=>c!==this._rowPresence[b]);if(!this._rendered||n){this._rowGeneration+=1,this._rowPresence=i;let c="";for(let h=0;h<a.length;h++){let p=a[h],f=this._hass.states[p.entity];if(!f){c+=`<div class="row" data-row-index="${h}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${ee(p.entity)}</span></div>`;continue}let v=this._resolve(p);this._updateExtrema(p,v,f);let m=this._buildRowViewModel(p,v,f),y=m.min,_=m.max,g=m.percent,x=this._getColor(g,v,y,_),S=m.primaryPresentation.number,k=m.primaryPresentation.unit,w=m.targetPercent,M=(o=(s=m.targetPresentation)==null?void 0:s.text)!=null?o:null,F=m.peakPercent,R=(d=(u=m.peakPresentation)==null?void 0:u.number)!=null?d:null;c+=this._buildRow(p,S,k,g,x,F,R,w,M,v.peak_marker.color,v.target_marker.color,y,_,h)}this._clearMarkerHover(),this._clearRowActionHandlers(),t.innerHTML=c,this._rendered=!0;let b=t.querySelectorAll(".row[data-entity]");b.forEach(h=>{let p=a[Number(h.dataset.rowIndex)],f=p?this._hass.states[p.entity]:null;p&&f&&this._patchRow(h,p,f)}),this._runPostLayoutPasses(b),b.forEach(h=>{var y,_;let p=Number(h.dataset.rowIndex),f=h.dataset.entity,m=di(h,{resolveAction:g=>{var S;let x=Array.isArray((S=this._actionConfig)==null?void 0:S.entities)?this._actionConfig.entities[p]:null;return ui(this._actionConfig,x,g)},label:(_=(y=h.getAttribute)==null?void 0:y.call(h,"aria-label"))!=null?_:f,dispatchAction:({config:g,action:x})=>{let S={...this._actionConfig,entity:f,[x==="double_tap"?"double_tap_action":`${x}_action`]:g},k=new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:S,action:x}});this.dispatchEvent(k)}});this._rowActionCleanup.push(m)});return}let l=t.querySelectorAll(".row[data-entity]");for(let c of l){let b=a[Number(c.dataset.rowIndex)];if(!b)continue;let h=this._hass.states[b.entity];h&&this._patchRow(c,b,h,e)}this._runPostLayoutPasses(l)}}});function nr(r,e={}){let t=e.above?10:0,a=e.below?10:0,i=Math.max(0,r-t-a);return{above:t,below:a,railHeight:i,aboveY:0,belowY:r-9,compactGlyphs:t>0||a>0}}function pi(r,e,t){let a=[];for(let i of["above","below"]){let n=r.filter(l=>{var s,o;return l.lane===i&&l.visible&&l.labelVisible&&Number.isFinite(l.position)&&((o=(s=l.label)==null?void 0:s.text)==null?void 0:o.trim())}).map(l=>({marker:l,anchor:Math.max(0,Math.min(100,l.position))*e/100})).sort((l,s)=>l.anchor-s.anchor);n.forEach(({marker:l,anchor:s},o)=>{var v;let u=o?(n[o-1].anchor+s)/2+2:0,d=o+1<n.length?(s+n[o+1].anchor)/2-2:e,c=Math.max(0,d-u),b=l.label,h=b.text,p="full",f=t(h)+4;if(f>c&&(h=[b.showValue!==!1?b.number:"",b.showUnit!==!1?b.unit:""].filter(Boolean).join(" "),p="value",f=h?t(h)+4:1/0,!h&&!b.number&&!b.unit)){let m=Array.from((v=b.semanticText)!=null?v:"");for(;m.length>=3;){if(h=`${m.join("").trimEnd()}\u2026`,f=t(h)+4,f<=c){p="text";break}m.pop()}}!h||f>c||e<=0?a.push({id:l.id,lane:i,mode:"hidden",text:"",left:0,width:0}):a.push({id:l.id,lane:i,mode:p,text:h,left:Math.max(u,Math.min(s-f/2,d-f)),width:f})})}return a}var bi=ae(()=>{});function mi(r,e){return ie(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var St,fi=ae(()=>{Ft();fe();Yt();Ta();Ba();fa();ir();Sa();Vt();Qt();la();bi();St=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._extrema={},this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static async getConfigElement(){return Nt("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!ie(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._requestUpdate()}get hass(){return this._hass}set context(e){this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._requestUpdate()}disconnectedCallback(){this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var s,o,u,d,c,b,h,p,f;let e=((s=this._config)==null?void 0:s.entity)||((o=this._context)==null?void 0:o.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._extrema={},this._scaleHistory=null,this._sampleState=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?Xt({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e,...this._config.attribute!==void 0?{attribute:this._config.attribute}:{}}]:[]}):null,this._diagnostics=Zt(this._normalized));let t=ht(this._hass,e,(c=(d=(u=this._normalized)==null?void 0:u.entities)==null?void 0:d[0])==null?void 0:c.attribute),a=t.stateObj,i=null,n=this._config?e?this._hass?a?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured",l=null;if(a&&((b=this._normalized)!=null&&b.entities[0])){let v=this._normalized.entities[0],m=t.available&&t.attributeFound?D(t.value):null;if(m!==null&&(a!==this._sampleState||m!==this._sampleValue)){this._sampleState=a,this._sampleValue=m;let y=(h=a.last_updated)!=null?h:a.last_changed,_=y instanceof Date?y.getTime():Date.parse(String(y!=null?y:"")),g=Number.isFinite(_)?_:Date.now();for(let x of["peak","floor"]){let S=v[`${x}_marker`];S.show&&(this._extrema[x]=It(this._extrema[x],m,(p=S.reset)!=null?p:{kind:"never"},x==="peak"?"max":"min",g))}}if(i=_t({hass:this._hass,entityConfig:v,entityState:a,extrema:this._extrema,previousScale:this._scaleHistory}),this._scaleHistory={min:i.min,max:i.max},i.numericValue===null){let y=String((f=i.state)!=null?f:"").trim(),_=/^[+-]?(?:nan|infinity)$/i.test(y);a.state==="unknown"?n="Unknown":a.state==="unavailable"?n="Unavailable":y&&!_?l=i.primaryPresentation.text:n="Not numeric"}}this._row=i,this._status=n,this._textValue=l,this._render(i,n),this._previousRow=n||l!==null?null:i}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${zt}
        ${Pt}
        ${At('.surface[data-bar-animated="false"]')}
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
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var c,b,h;this._ensureDom();let a=t?null:this._textValue;typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!(t||a!==null),this._statusEl.hidden=!t&&a===null,this._statusEl.textContent=(c=t!=null?t:a)!=null?c:"",this._surface.dataset.state=t?"unavailable":a!==null?"text":"numeric";let i=(b=e==null?void 0:e.markerLabelLaneOccupancy)!=null?b:{},n=nr(0,i);Y(this._surface,"--label-above",`${n.above}px`),Y(this._surface,"--label-below",`${n.below}px`),this._syncLabels(e,t||a!==null);let l=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",s=((h=e==null?void 0:e.markers)!=null?h:[]).filter(p=>p.visible&&(p.showMarker||p.labelVisible)).map(p=>{var m;let f=p.type==="generic"?"Reference marker":`${p.type[0].toUpperCase()}${p.type.slice(1)}`,v=`${he(p.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${f} at ${v}${p.labelVisible&&((m=p.label)!=null&&m.text)?`; label ${p.label.text}`:""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${l}${this._entity&&l!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:a!==null?`${l}${this._entity&&l!==this._entity?` (${this._entity})`:""}: ${a}`:`${l} (${this._entity}): ${e.primaryPresentation.text}. Range ${he(e.min)} to ${he(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${s?` ${s}`:""}`),t||a!==null)return;let o=wt(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});o.animated=o.animated&&!!this._previousRow,this._surface.dataset.barAnimated=o.animated?"true":"false";let u=JSON.stringify(o),d=JSON.stringify([o.baseline.configured,o.needle.configured,o.markers.map(p=>[p.type,p.id])]);d!==this._structureKey?(this._bar.innerHTML=va(o),this._structureKey=d):u!==this._barRenderKey&&_a(this._bar,o,{revealDuration:pa(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=u,this._labelAnimated=o.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var l,s,o;let a=((l=e==null?void 0:e.markers)!=null?l:[]).filter(u=>u.labelVisible),i=new Set(a.map(u=>u.id));for(let[u,d]of this._labelNodes)i.has(u)||(d.remove(),this._labelNodes.delete(u));for(let u of a){if(!this._labelNodes.has(u.id)){let c=document.createElement("span");c.className="compact-marker-label",c.dataset.markerId=u.id,c.hidden=!0,this._labels.append(c),this._labelNodes.set(u.id,c)}let d=this._labelNodes.get(u.id);d.dataset.lane=u.lane,Y(d,"--marker-color",_e(u))}if(this._labels.hidden=!!t,!(((s=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:s.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let u=this._labelFonts;u.ready.then(()=>{this._labelFonts===u&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var s,o,u,d;let{width:e,height:t}=this._surface.getBoundingClientRect(),a=nr(t,(s=this._row)==null?void 0:s.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(a.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let i=pi((d=(u=this._row)==null?void 0:u.markers)!=null?d:[],e,c=>this._labelMeasure.measureText(c).width),n=JSON.stringify([e,t,a.above,a.below,this._labelMeasure.font,i.map(c=>[c.id,c.lane,c.mode,c.width])]),l=this._labelAnimated&&!this._snapLabels&&n===this._labelLayoutKey;for(let c of this._labelNodes.values())c.hidden=!0;for(let c of i){let b=this._labelNodes.get(c.id);b.hidden=c.mode==="hidden",b.dataset.mode=c.mode,b.textContent!==c.text&&(b.textContent=c.text),Y(b,"transition",l?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),Y(b,"left",`${c.left}px`),Y(b,"width",`${c.width}px`)}this._labelLayoutKey=n,this._snapLabels=!1}}});var sn=gi(()=>{hi();fi();Ft();Or(kt,St);for(let[r,e]of[["sensor-bar-card-plus",kt],["sensor-bar-card-plus-feature",St]])customElements.get(r)||customElements.define(r,e);window.customCards=window.customCards||[];window.customCards.some(r=>r.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(r=>r.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:mi,configurable:!0})});export default sn();
