var te=(r,e,t)=>()=>{if(t)throw t[0];try{return r&&(e=r(r=0)),e}catch(a){throw t=[a],a}};var Ii=(r,e)=>()=>{try{return e||r((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function Zr(r,e){Sa=[r,e]}function Ma(){if(!Sa||Ti.some((r,e)=>customElements.get(r)!==Sa[e]))throw new Error(ka);if(st&&lt.some((r,e)=>customElements.get(r)!==st[e]))throw new Error(ka)}async function Li(){if(!Kr)throw new Error("Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.");let r=new URL(Vi,import.meta.url);r.searchParams.set("sbcp_build",Wi),Jr++&&r.searchParams.set("sbcp_retry","1");let e;try{e=await import(r.href)}catch(a){throw new Error(Di)}if(e.buildIdentity!==Kr)throw new Error(Xr);Ma();let t=[e.SensorBarCardPlusEditor,e.SensorBarCardPlusFeatureEditor];if(t.some(a=>typeof a!="function"||!(a.prototype instanceof HTMLElement))||t[0]===t[1])throw new Error(Xr);if(lt.some((a,i)=>{let n=customElements.get(a);return n&&(!st||n!==st[i]||n!==t[i])}))throw new Error(ka);for(let a=0;a<lt.length;a++)customElements.get(lt[a])||customElements.define(lt[a],t[a]);st=t}async function Ft(r){if(Ma(),!Nt){if(Jr>=2)throw Yr;Nt=Li().catch(e=>{throw Yr=e,Nt=void 0,e})}return await Nt,Ma(),document.createElement(r)}var Kr,Vi,Wi,lt,Ti,Xr,ka,Di,Sa,st,Nt,Jr,Yr,zt=te(()=>{Kr="25308167aa2bc1ee6b49e1482ede0716a7124ff2894d80d272feb9dbe9048069",Vi="./sensor-bar-card-plus-editor.js",Wi="7503b1a6ad328ab2d2fb3778453d86e7bb526424f180f500e5699b1aff6250c1",lt=["sensor-bar-card-plus-editor","sensor-bar-card-plus-feature-editor"],Ti=["sensor-bar-card-plus","sensor-bar-card-plus-feature"],Xr="Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.",ka="Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.",Di="Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.",Jr=0});function It(r){return`
        ${r} .bar-fill-reveal,
        ${r} .needle-marker,
        ${r} .target-marker,
        ${r} .peak-marker,
        ${r} .floor-marker,
        ${r} .generic-marker,
        ${r} .baseline-indicator {
          transition: none;
        }
`}var Pt,At,Ra=te(()=>{Pt=`
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
`,At=`
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

`});function Bi(r,e){if(!(r instanceof Date)||Number.isNaN(r.getTime()))return null;let t=r.getFullYear(),a=r.getMonth(),i=r.getDate(),n=r.getHours();if(e==="quarterly")return new Date(t,a,i,n,Math.floor(r.getMinutes()/15)*15,0,0).getTime();if(e==="hourly")return new Date(t,a,i,n,0,0,0).getTime();if(e==="daily")return new Date(t,a,i,0,0,0,0).getTime();if(e==="weekly"){let l=(r.getDay()+6)%7;return new Date(t,a,i-l,0,0,0,0).getTime()}return e==="monthly"?new Date(t,a,1,0,0,0,0).getTime():e==="yearly"?new Date(t,0,1,0,0,0,0).getTime():null}function Cr(r){if(r===void 0&&(r="never"),typeof r!="string")return{kind:"never"};let e=r.trim().toLowerCase();if(e==="never")return{kind:"never"};if(Qr.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let a=Number(t[1]),i=t[2];return!Number.isInteger(a)||a<1||i==="m"&&a>59||i==="h"&&a>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:a}:{kind:"duration",hours:a}}function ei(r){if(typeof r!="string")return!1;let e=r.trim().toLowerCase();if(e==="never"||Qr.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let a=Number(t[1]);return Number.isInteger(a)&&a>=1&&(t[2]==="m"?a<=59:a<=23)}function ti(r,e){if((r==null?void 0:r.kind)!=="calendar")return null;let t=Bi(new Date(e),r.unit);return Number.isFinite(t)?String(t):null}function qi(r){return(r==null?void 0:r.kind)!=="duration"?null:Number.isInteger(r.minutes)?r.minutes*60*1e3:Number.isInteger(r.hours)?r.hours*60*60*1e3:null}function $a(r,e,t){return(e==null?void 0:e.kind)==="duration"?{value:r,startedAtMs:Number.isFinite(t)?t:null,windowKey:null}:(e==null?void 0:e.kind)==="calendar"?{value:r,startedAtMs:null,windowKey:ti(e,t)}:{value:r,startedAtMs:null,windowKey:null}}function Vt(r,e,t,a,i){if(!Number.isFinite(e))return r!=null?r:null;let n=qi(t);if(!r||n!==null&&Number.isFinite(r.startedAtMs)&&Number.isFinite(i)&&i-r.startedAtMs>=n)return $a(e,t,i);if((t==null?void 0:t.kind)==="calendar"){let s=ti(t,i);if(s!==null&&s!==r.windowKey)return $a(e,t,i)}return(a==="min"?e<r.value:e>r.value)?{...r,value:e}:r}var Qr,Wt=te(()=>{Qr=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function Dt(r){return typeof r=="string"&&r!==""?r:null}function ii(r){return r!=null&&r!==""&&typeof r!="string"}function J(r,e,t=null,a=null){let i={fixed:r!=null?r:null,entity:e!=null?e:null};Number.isFinite(t)&&(i.percent=t);let n=Dt(a);return n!==null&&(i.attribute=n),ii(a)&&(i.attribute_invalid=!0),i}function ne(r){return typeof r=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(r.trim())}function fe(r){if(typeof r!="string")return null;let e=r.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function D(r){if(typeof r=="number")return Number.isFinite(r)?r:null;if(typeof r=="string"){let e=r.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function ce(r,e=null,t=null,a={}){var l,s,o,u,d;let{allowPercent:i=!1}=a,n=e!=null?e:J(t,null);if(r===void 0)return{...n};if(r===null)return J(null,null);if(typeof r=="object"&&!Array.isArray(r)){let c=(s=(l=r.fixed)!=null?l:r.value)!=null?s:null,b=r.entity,p=null,h=null,m=!1;if(b!=null&&b!=="")if(typeof b=="string")p=b.trim(),p&&!ne(p)&&(p=null,m=!0);else if(b&&typeof b=="object"&&!Array.isArray(b)){let y=Object.keys(b),v=b.id,g=Object.prototype.hasOwnProperty.call(b,"attribute");typeof v!="string"||!ne(v.trim())||g&&(typeof b.attribute!="string"||!b.attribute.trim())||y.some(x=>!["id","attribute"].includes(x))?m=!0:(p=v.trim(),g&&(h=b.attribute.trim()))}else m=!0;Object.prototype.hasOwnProperty.call(r,"attribute")&&(m=!0,p=null,h=null);let _=i?D(r.percent):null,f=J(c,p,_,h);return m&&(f.entity_invalid=!0),f}if(ne(r))return J((u=(o=n.fixed)!=null?o:t)!=null?u:null,r,(d=n.percent)!=null?d:null);if(i){let c=fe(r);if(Number.isFinite(c))return J(null,null,c)}return J(r,null)}function Oi(r){var e;return!!r&&(D((e=r.fixed)!=null?e:r.value)!==null||Number.isFinite(r.percent)||!!r.entity)}function ni(r,e){var a,i,n,l;let t={above:((a=e==null?void 0:e.peak_marker)==null?void 0:a.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&Oi((l=e==null?void 0:e.target_marker)==null?void 0:l.source)?1:0)};return r.map(s=>{let o=s.valid&&t[s.lane]<4;return o&&(t[s.lane]+=1),{...s,accepted:o}})}function li(r,e=null){if(!Array.isArray(r))return{markers:[],invalidList:r!==void 0};let t=r.map((a,i)=>{var T;if(!a||typeof a!="object"||Array.isArray(a))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let n=a.at,l=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),s=typeof n=="string"?n.trim():n,o=ce(s,null,null,{allowPercent:!0}),u=n&&typeof n=="object"&&n.entity!==void 0?o.entity:typeof s=="string"&&ne(s)?s:null,d=o.entity_invalid===!0||u!=null&&u!==""&&!ne(u),c=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&D(n.fixed)===null,b=!!o.entity||D(o.fixed)!==null||Number.isFinite(o.percent),p=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),h=n!=null&&!l&&!d&&!c&&b&&!p,m=a.lane===void 0?"below":a.lane,_=m==="above"||m==="below",f=["circle","diamond","triangle","chevron","arrow","pin"],y=a.shape===void 0||f.includes(a.shape),v=ct(a.direction),g=a.direction!==void 0&&!["inward","outward"].includes(typeof a.direction=="string"?a.direction.trim().toLowerCase():""),x=a.label&&typeof a.label=="object"&&!Array.isArray(a.label)?a.label:{},S=Ot(x),M=x.entity,w=M&&typeof M=="object"&&!Array.isArray(M)?M:null,k=typeof M=="string"?M.trim():typeof(w==null?void 0:w.id)=="string"?w.id.trim():"",F=w==null?void 0:w.attribute,$=M!=null&&M!==""&&!ne(k)||w&&(Object.keys(w).some(P=>!["id","attribute"].includes(P))||Object.prototype.hasOwnProperty.call(w,"attribute")&&(typeof F!="string"||!F.trim()))||Object.prototype.hasOwnProperty.call(x,"attribute"),R=k&&ne(k)&&!$?k:null,A=typeof a.show_marker=="boolean"?a.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:_?m:null,shape:y&&(T=a.shape)!=null?T:"circle",direction:v,invalidDirection:g,showMarker:A,invalidShowMarker:a.show_marker!==void 0&&typeof a.show_marker!="boolean",color:typeof a.color=="string"&&a.color.trim()?a.color:"#888888",label:{show:x.show===!0,text:S.label_text,entity:R,...Dt(F)!==null?{attribute:Dt(F)}:{},showValue:S.label_show_value,showUnit:S.label_show_unit,precision:S.label_precision,invalidShow:S.label_invalid_show,invalidText:S.label_invalid_text,invalidShowValue:S.label_invalid_show_value,invalidShowUnit:S.label_invalid_show_unit,invalidPrecision:S.label_invalid_precision,invalidPrecisionKey:S.label_precision_key,unsupportedUnit:S.label_unsupported_unit,invalidEntity:$},valid:h&&_,invalidSource:!h,invalidPercentage:p,unsupportedPercentField:l,invalidLane:!_,invalidShape:!y,accepted:!1}});return{markers:ni(t,e),invalidList:!1}}function ge(r,e=null){var a;let t=e!=null?e:{color:null};return r===void 0?{...t}:r===null?{color:null}:typeof r=="object"&&!Array.isArray(r)?{color:(a=r.color)!=null?a:null}:{color:r}}function ut(r){return r===!0?!0:r===!1?!1:null}function Ht(r,e){var n;let t=e==null?void 0:e.baseline,a=r==null?void 0:r.baseline,i={enabled:ut(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:J(null,null),above:ge(void 0,t==null?void 0:t.above),below:ge(void 0,t==null?void 0:t.below)};return a===void 0?i:a===null?{enabled:null,at:J(null,null),above:{color:null},below:{color:null}}:typeof a!="object"||Array.isArray(a)?{enabled:i.enabled,at:ce(a,i.at,null),above:i.above,below:i.below}:{enabled:(n=ut(a.enabled))!=null?n:i.enabled,at:ce(a.at,i.at,null,{allowPercent:!0}),above:ge(a.above,i.above),below:ge(a.below,i.below)}}function Hi(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function Lt(r){if(!Array.isArray(r))return null;let e=r.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var a;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(a=t.label)!=null?a:null}});return Hi(e,100)}function ai(r,e=null){var a;if(r===void 0)return{value:null,issue:null};if(r===null)return{value:null,issue:"malformed"};if(r&&typeof r=="object"&&!Array.isArray(r)){if(r.entity!==void 0&&r.entity!==null&&r.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(r,"percent")){let n=D(r.percent);return Number.isFinite(n)?{value:J(null,null,n),issue:null}:{value:null,issue:"malformed"}}let i=D((a=r.fixed)!=null?a:r.value);return Number.isFinite(i)?{value:J(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof r=="string"){let i=r.trim();if(ne(i))return{value:null,issue:"entity"};if(i.includes("%")){let n=fe(i);return Number.isFinite(n)?{value:J(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=D(r);return Number.isFinite(t)?e==="percent"?{value:J(null,null,t),issue:null}:{value:J(t,null),issue:null}:{value:null,issue:"malformed"}}function ot(r,e={}){if(!Array.isArray(r))return null;let{legacySegmentSpace:t=null}=e,a=r.map(i=>{var s,o;let n=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:ai(i.from,t),l=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:ai(i.to,t);return i!=null&&i.color?{from:n.value,to:l.value,invalidBoundary:(s=n.issue)!=null?s:l.issue,color:i.color,label:(o=i.label)!=null?o:null}:null}).filter(Boolean);return a.map((i,n)=>{var s;let l=a.slice(n+1).find(o=>!o.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:l!=null&&l.from?{...l.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(s=i.label)!=null?s:null}})}function Bt(r,e,t,a){var m,_,f,y,v,g,x,S,M,w,k,F;let i=e==null?void 0:e.scale,n=r==null?void 0:r.scale,l=`${t}_entity`,s=i==null?void 0:i[t],o=s?Object.prototype.hasOwnProperty.call(s,"fixed_explicit")?J((_=(m=s.fixed)!=null?m:s.value)!=null?_:null,(f=s.entity)!=null?f:null,(y=s.percent)!=null?y:null,s.attribute):ce(s):J((v=e==null?void 0:e[t])!=null?v:a,(g=e==null?void 0:e[l])!=null?g:null),u=s?s.fixed_explicit!==!1&&s.fixed!==null&&s.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,d=($,R)=>(Object.defineProperty($,"fixed_explicit",{value:R}),$);if((n==null?void 0:n[t])!==void 0){let $=n[t],R=ne($)?u:typeof $=="object"&&$!==null?((x=$.fixed)!=null?x:$.value)!==null&&((S=$.fixed)!=null?S:$.value)!==void 0:$!==null;return d(ce(n[t],o,a),R)}let c=r[l],b=c!=null,p=(w=(M=r[t])!=null?M:b?null:o.fixed)!=null?w:o.entity?null:a,h=(k=c!=null?c:o.entity)!=null?k:null;return d(J(p,h,(F=o.percent)!=null?F:null,o.attribute),r[t]!==null&&r[t]!==void 0||!b&&u)}function Ut(r,e){var s,o;let t=(s=r==null?void 0:r.scale)==null?void 0:s.direction,a=(o=e==null?void 0:e.scale)==null?void 0:o.direction,i=u=>u==="normal"||u==="reverse",n=t!==void 0,l=i(t)?t:i(a)?a:"normal";return{min:Bt(r,e,"min",0),max:Bt(r,e,"max",100),direction:l,...n&&!i(t)?{direction_invalid:!0}:{}}}function Fa(r){switch(r){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function ht(r){switch(r){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function qt(r,e){return r!=null&&Object.prototype.hasOwnProperty.call(r,e)}function Ui(r){return[qt(r,"color")?r.color:void 0,qt(r==null?void 0:r.bar,"color")?r.bar.color:void 0].some(t=>t!=null)}function dt(r){let e=r==null?void 0:r.bar,t=[[r,"color_mode"],[e,"color_mode"],[e,"fill_style"],[r,"severity"],[r,"segments"],[e,"segments"],[r,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Ui(r),paint:t.some(([a,i])=>qt(a,i))}}function we(r=null,e=null){var n,l,s,o,u,d;let t=(n=r==null?void 0:r.fill_style)!=null?n:null,a=(s=(l=r==null?void 0:r.color_mode)!=null?l:e)!=null?s:null,i=(u=(o=Fa(t))!=null?o:a)!=null?u:"severity";return{fill_style:(d=t!=null?t:ht(i))!=null?d:"bands",color_mode:i}}function Pa(r,e,t,a,{scopeExplicitness:i=null,inheritedExplicitness:n=null,isCardScope:l=!1}={}){let s=(i==null?void 0:i.color)===!0&&i.paint!==!0,o=(n==null?void 0:n.paint)===!0;return s&&(l||!o)?we({fill_style:"solid"},null):(r==null?void 0:r.fill_style)!==void 0||(r==null?void 0:r.color_mode)!==void 0||e.color_mode!==void 0?we(r,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(a==null?void 0:a.color_mode)!==void 0?we(t,a==null?void 0:a.color_mode):we(null,null)}function Aa(r){return Array.isArray(r)?r.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=fe(e.pos),a=Number.isFinite(t)?t:D(e.pos);return{...e,pos:Number.isFinite(a)?a:e.pos}}):r!=null?r:null}function Ia(r,e=null){var a,i,n,l;let t=e?{show:(a=e.show)!=null?a:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return r===void 0?{...t}:typeof r=="boolean"?{show:r,color:"#ffffff"}:r&&typeof r=="object"&&!Array.isArray(r)?{show:(n=r.show)!=null?n:t.show,color:(l=r.color)!=null?l:t.color}:{...t}}function jt(r,e,t={}){var S,M,w,k,F,$,R,A,T,P,V,W,B,O,G,L,q,K,E,I,U,z,H,X,j,ae,ee;let a=(S=t.scopeExplicitness)!=null?S:dt(r),i=(w=(M=t.inheritedExplicitness)!=null?M:e==null?void 0:e[za])!=null?w:dt(e),n=(k=t.isCardScope)!=null?k:e==null,l=e==null?void 0:e.bar,s=r==null?void 0:r.bar,o=qt(l,Na)?l[Na]:["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:null,u=["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:o,d=s==null?void 0:s.segments,c=r.segments,b=r.severity,p=(F=l==null?void 0:l.segments)!=null?F:null,h=($=e==null?void 0:e.segments)!=null?$:null,m=(R=e==null?void 0:e.severity)!=null?R:null,_=null,f=(l==null?void 0:l.segment_space)==="percent"||(l==null?void 0:l.segment_space)==="scale"?l.segment_space:null;d!=null?(f=u,_=ot(d,{legacySegmentSpace:f})):c!=null?_=ot(c):b!=null?(_=Lt(b),f="percent"):p!=null?_=p.map(ie=>({...ie})):h!=null?_=ot(h):m!=null&&(_=Lt(m),f="percent");let y=r!=null&&r.target&&typeof r.target=="object"&&!Array.isArray(r.target)?(A=r.target.when_exceeded)==null?void 0:A.fill_color:void 0,v=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(T=e.target.when_exceeded)==null?void 0:T.fill_color:void 0,g=Pa(s,r,l,e,{scopeExplicitness:a,inheritedExplicitness:i,isCardScope:n}),x={direction:["normal","reverse"].includes(s==null?void 0:s.direction)?s.direction:["normal","reverse"].includes(l==null?void 0:l.direction)?l.direction:"normal",...(s==null?void 0:s.direction)!==void 0&&!["normal","reverse"].includes(s.direction)?{direction_invalid:!0}:{},fill_style:g.fill_style,color_mode:g.color_mode,needle:Ia(s==null?void 0:s.needle,l==null?void 0:l.needle),solid_fill:(V=(P=s==null?void 0:s.solid_fill)!=null?P:l==null?void 0:l.solid_fill)!=null?V:!1,color:(G=(O=(B=(W=s==null?void 0:s.color)!=null?W:r.color)!=null?B:l==null?void 0:l.color)!=null?O:e==null?void 0:e.color)!=null?G:"#4a9eff",gradient_stops:Aa((E=(K=(q=(L=s==null?void 0:s.gradient_stops)!=null?L:r.gradient_stops)!=null?q:l==null?void 0:l.gradient_stops)!=null?K:e==null?void 0:e.gradient_stops)!=null?E:null),severity:_,segments:_,segment_space:f,animated:(H=(z=(U=(I=s==null?void 0:s.animated)!=null?I:r.animated)!=null?U:l==null?void 0:l.animated)!=null?z:e==null?void 0:e.animated)!=null?H:!0,above_target_color:(ee=(ae=(j=(X=y!=null?y:r.above_target_color)!=null?X:l==null?void 0:l.above_target_color)!=null?j:v)!=null?ae:e==null?void 0:e.above_target_color)!=null?ee:null};return Object.defineProperty(x,Na,{value:u}),x}function Va(r){return Math.max(24,r)}function ji(r,e="left"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function Ei(r,e="medium"){let t=typeof r=="string"?r.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Gi(r){return Number.isFinite(r)?Math.min(112,Math.max(12,r)):null}function Et(r,e){var p,h,m,_,f,y,v,g,x,S,M,w,k,F,$,R,A,T,P,V,W,B,O,G,L;let t=e==null?void 0:e.layout,a=r==null?void 0:r.layout,i=a==null?void 0:a.label,n=a==null?void 0:a.hero,l=t==null?void 0:t.label,s=t==null?void 0:t.hero,o=!e,u=(_=(m=(h=(p=a==null?void 0:a.height)!=null?p:r.height)!=null?h:t==null?void 0:t.height)!=null?m:e==null?void 0:e.height)!=null?_:38,d=(a==null?void 0:a.height)!==void 0||r._height_explicit===!0||!o&&r.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,c=ji((g=(v=(y=(f=i==null?void 0:i.position)!=null?f:r.label_position)!=null?y:l==null?void 0:l.position)!=null?v:t==null?void 0:t.label_position)!=null?g:e==null?void 0:e.label_position,"left"),b=c==="hero"?Gi((x=n==null?void 0:n.value_size)!=null?x:s==null?void 0:s.value_size):null;return{label:{position:c,width:(F=(k=(w=(M=(S=i==null?void 0:i.width)!=null?S:r.label_width)!=null?M:l==null?void 0:l.width)!=null?w:t==null?void 0:t.label_width)!=null?k:e==null?void 0:e.label_width)!=null?F:100},hero:{size:Ei((L=(G=(O=(B=(W=(V=(P=(T=(A=(R=($=n==null?void 0:n.size)!=null?$:i==null?void 0:i.hero_size)!=null?R:i==null?void 0:i.heroSize)!=null?A:r.hero_size)!=null?T:r.heroSize)!=null?P:s==null?void 0:s.size)!=null?V:l==null?void 0:l.hero_size)!=null?W:l==null?void 0:l.heroSize)!=null?B:t==null?void 0:t.hero_size)!=null?O:t==null?void 0:t.heroSize)!=null?G:e==null?void 0:e.hero_size)!=null?L:e==null?void 0:e.heroSize,"medium"),value_size:b},height:Va(u),height_explicit:d}}function Gt(r,e){var i,n,l,s,o,u,d,c;let t=e==null?void 0:e.formatting,a=r==null?void 0:r.formatting;return{decimal:(s=(l=(n=(i=a==null?void 0:a.decimal)!=null?i:r.decimal)!=null?n:t==null?void 0:t.decimal)!=null?l:e==null?void 0:e.decimal)!=null?s:null,unit:(c=(d=(u=(o=a==null?void 0:a.unit)!=null?o:r.unit)!=null?u:t==null?void 0:t.unit)!=null?d:e==null?void 0:e.unit)!=null?c:null}}function ri(r){let e=String(r!=null?r:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function ct(r){return(typeof r=="string"?r.trim().toLowerCase():"")==="outward"?"outward":"inward"}function Ot(r,e={}){var c,b,p;let t=r&&typeof r=="object"&&!Array.isArray(r)?r:{},a=Object.prototype.hasOwnProperty.call(t,"text"),i=a&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),l=Object.prototype.hasOwnProperty.call(t,"decimal"),s=n?t.precision:t.decimal,o=n||l,u=o?D(s):(c=e.label_precision)!=null?c:null,d=o&&s!==null&&s!==""&&!(Number.isInteger(u)&&u>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(b=e.label_show_value)!=null?b:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(p=e.label_show_unit)!=null?p:!0,label_precision:d?null:u,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:a&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:d,label_precision_key:d?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function Tt(r){let e={};return r.label_text!==null&&r.label_text!==void 0&&(e.label_text=r.label_text),r.label_show_value===!1&&(e.label_show_value=!1),r.label_show_unit===!1&&(e.label_show_unit=!1),r.label_precision!==null&&r.label_precision!==void 0&&(e.label_precision=r.label_precision),r.label_invalid_text&&(e.label_invalid_text=!0),r.label_invalid_show_value&&(e.label_invalid_show_value=!0),r.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),r.label_invalid_show&&(e.label_invalid_show=!0),r.label_invalid_precision&&(e.label_invalid_precision=!0),r.label_invalid_precision&&r.label_precision_key&&(e.label_precision_key=r.label_precision_key),r.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function si(r){return r!==void 0&&!["inward","outward"].includes(typeof r=="string"?r.trim().toLowerCase():"")}function Kt(r,e){var b,p,h,m,_,f,y,v,g,x,S,M,w,k,F,$,R,A,T,P,V,W,B,O,G,L,q,K,E,I,U,z,H,X,j,ae,ee;let t=e==null?void 0:e.target_marker,a=r==null?void 0:r.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(b=e==null?void 0:e.target)!=null?b:null,n=t?{...t,shape:ri(t.shape),direction:ct(t.direction)}:{enabled:null,source:J(null,null),color:(p=e==null?void 0:e.target_color)!=null?p:"#888",show_label:(h=e==null?void 0:e.show_target_label)!=null?h:!1,...Tt(Ot((m=e==null?void 0:e.target)==null?void 0:m.label)),label_decimal:(x=(g=(f=(_=e==null?void 0:e.target)==null?void 0:_.label)==null?void 0:f.precision)!=null?g:(v=(y=e==null?void 0:e.target)==null?void 0:y.label)==null?void 0:v.decimal)!=null?x:null,shape:"diamond",direction:"inward"};if(a&&typeof a=="object"&&!Array.isArray(a)){let ie=Ot(a.label,n),le={enabled:(M=(S=ut(a.enabled))!=null?S:n.enabled)!=null?M:null,source:ce(a.at,n.source,null,{allowPercent:!0}),color:(k=(w=a.color)!=null?w:r.target_color)!=null?k:n.color,show_label:(R=($=(F=a.label)==null?void 0:F.show)!=null?$:r.show_target_label)!=null?R:n.show_label,shape:Object.prototype.hasOwnProperty.call(a,"shape")?ri(a.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(a,"direction")?ct(a.direction):n.direction,...si(a.direction)?{direction_invalid:!0}:{},...Tt(ie)},se=ie.label_precision;return se!=null&&(le.label_decimal=se,le.label_precision=se),le}let l=(W=(V=(T=r.target)!=null?T:(A=n.source)==null?void 0:A.fixed)!=null?V:(P=n.source)==null?void 0:P.value)!=null?W:i,s=(L=(G=(O=r.target_entity)!=null?O:(B=n.source)==null?void 0:B.entity)!=null?G:e==null?void 0:e.target_entity)!=null?L:null,o=r.target===void 0&&r.target_entity===void 0&&(K=(q=n.source)==null?void 0:q.percent)!=null?K:null,u=r.target===void 0&&r.target_entity===void 0&&(I=(E=n.source)==null?void 0:E.attribute)!=null?I:null,d={enabled:(U=n.enabled)!=null?U:null,source:J(l,s,o,u),color:(X=(H=(z=r.target_color)!=null?z:n.color)!=null?H:e==null?void 0:e.target_color)!=null?X:"#888",show_label:(ee=(ae=(j=r.show_target_label)!=null?j:n.show_label)!=null?ae:e==null?void 0:e.show_target_label)!=null?ee:!1,shape:n.shape,direction:n.direction,...Tt(n)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Ki(r,e){let t=r==null?void 0:r[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let a=r==null?void 0:r[`${e}_marker`];return a&&typeof a=="object"&&!Array.isArray(a)?a:null}function Xi(r,e){var n,l,s;let t=r==null?void 0:r.label,a=t&&typeof t=="object"&&!Array.isArray(t),i=Ot(t,e);return{show:a&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(s=(l=i.label_precision)!=null?l:e.label_decimal)!=null?s:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function oi(r,e,t,a={}){var f,y,v,g,x,S,M,w,k;let{legacy:i=!1,defaultColor:n="#888888"}=a,l=e==null?void 0:e[`${t}_marker`],s=Ki(r,t),o=l!=null?l:{show:i&&(f=e==null?void 0:e.show_peak)!=null?f:!1,color:i&&(y=e==null?void 0:e.peak_color)!=null?y:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},u=s&&Object.prototype.hasOwnProperty.call(s,"reset"),d=u?s.reset:void 0,c=u?Cr(d):(v=o.reset)!=null?v:{kind:"never"},b=s==null?void 0:s.label,p=Xi(s,o),h={show:(S=(x=(g=s==null?void 0:s.enabled)!=null?g:i?r.show_peak:void 0)!=null?x:o.show)!=null?S:!1,color:(k=(w=(M=s==null?void 0:s.color)!=null?M:i?r.peak_color:void 0)!=null?w:o.color)!=null?k:n,direction:s&&Object.prototype.hasOwnProperty.call(s,"direction")?ct(s.direction):ct(o.direction),...si(s==null?void 0:s.direction)?{direction_invalid:!0}:{}},m=l&&(Object.prototype.hasOwnProperty.call(l,"show_label")||Object.prototype.hasOwnProperty.call(l,"label_decimal")||Object.prototype.hasOwnProperty.call(l,"label_text")||Object.prototype.hasOwnProperty.call(l,"label_show_value")||Object.prototype.hasOwnProperty.call(l,"label_show_unit")||Object.prototype.hasOwnProperty.call(l,"label_precision")||Object.prototype.hasOwnProperty.call(l,"reset"));return(t==="floor"||u||b!==void 0||m)&&(h.show_label=p.show,h.label_decimal=p.precision,h.reset=c),Object.assign(h,Tt({label_text:p.text,label_show_value:p.showValue===!0?void 0:p.showValue,label_show_unit:p.showUnit===!0?void 0:p.showUnit,label_precision:p.precision,label_invalid_text:p.invalidText,label_invalid_show:p.invalidShow,label_invalid_show_value:p.invalidShowValue,label_invalid_show_unit:p.invalidShowUnit,label_invalid_precision:p.invalidPrecision,label_precision_key:p.precisionKey,label_unsupported_unit:p.unsupportedUnit})),u&&!ei(d)&&(h.reset_invalid=!0),h}function Xt(r,e){return oi(r,e,"peak",{legacy:!0,defaultColor:"#888888"})}function ui(r,e){return oi(r,e,"floor",{defaultColor:"#888888"})}function Wa(r,e){var i,n,l;let t={...r,_normalized:!0,entity:r.entity,name:(i=r.name)!=null?i:null,icon:r.icon};if(r.attribute!==void 0){let s=Dt(r.attribute);s!==null?t.attribute=s:delete t.attribute,ii(r.attribute)?t.attribute_invalid=!0:delete t.attribute_invalid}t.layout=Et(r,e),t.scale=Ut(r,e),t.bar=jt(r,e,{scopeExplicitness:dt(r),inheritedExplicitness:(n=e==null?void 0:e[za])!=null?n:dt(e),isCardScope:!1}),t.baseline=Ht(r,e),t.formatting=Gt(r,e),t.target_marker=Kt(r,e),t.peak_marker=Xt(r,e),t.floor_marker=ui(r,e);let a=r.markers===void 0?{markers:ni((l=e==null?void 0:e.generic_markers)!=null?l:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:li(r.markers,t);return t.generic_markers=a.markers,t.generic_markers_invalid=a.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Yt(r){var n;let e=dt(r),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...r};t._height_explicit=((n=r==null?void 0:r.layout)==null?void 0:n.height)!==void 0||(r==null?void 0:r.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.attribute!==void 0?{attribute:t.attribute}:{},...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(l=>typeof l=="string"?{entity:l}:l);let a={...t,_normalized:!0};Object.defineProperty(a,za,{value:e,enumerable:!1}),a.layout=Et(t,null),a.scale=Ut(r,null),a.bar=jt(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),a.baseline=Ht(t,null),a.formatting=Gt(t,null),a.target_marker=Kt(t,null),a.peak_marker=Xt(t,null),a.floor_marker=ui(t,null);let i=li(t.markers,a);return a.generic_markers=i.markers,a.generic_markers_invalid=i.invalidList,a.entities=t.entities.map(l=>Wa(l,a)),a}var za,Na,_e=te(()=>{Wt();za=Symbol("sbcp.paintExplicitness"),Na=Symbol("sbcp.explicitSegmentSpace")});function pt(r,e=null){var n;if(!r)return{stateObj:null,value:void 0,found:!1,available:!1,attributeFound:!1};let t=!["unknown","unavailable"].includes(String((n=r.state)!=null?n:"").trim().toLowerCase());if(typeof e!="string"||e==="")return{stateObj:r,value:r.state,found:!0,available:t,attributeFound:!0};let a=r.attributes,i=a!=null&&Object.prototype.hasOwnProperty.call(a,e);return{stateObj:r,value:i?a[e]:void 0,found:!0,available:t,attributeFound:i}}function bt(r,e,t=null){var i,n;let a=e&&(n=(i=r==null?void 0:r.states)==null?void 0:i[e])!=null?n:null;return pt(a,t)}function ke(r,e,t=null){let a=bt(r,e,t);if(!a.found||!a.available||!a.attributeFound)return null;let i=a.value,n=parseFloat(i);return Number.isFinite(n)?n:null}function Se(r,e,t=null){let a=ke(r,t);if(a!==null)return a;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function Ta(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return a+r/100*(i-a)}function he(r,e,t=null,a=null){var l;if(!e)return null;let i=ke(r,e.entity,e.attribute);if(i!==null)return i;let n=Se(r,(l=e.fixed)!=null?l:e.value,null);return n!==null?n:Number.isFinite(e.percent)?Ta(e.percent,t,a):null}function di(r,e,t=null){var s,o,u,d,c,b,p,h,m,_,f,y;let a=v=>Number.isFinite(v==null?void 0:v.min)&&Number.isFinite(v==null?void 0:v.max)&&v.min<v.max,i={min:Se(null,(u=(s=e==null?void 0:e.min)==null?void 0:s.fixed)!=null?u:(o=e==null?void 0:e.min)==null?void 0:o.value),max:Se(null,(b=(d=e==null?void 0:e.max)==null?void 0:d.fixed)!=null?b:(c=e==null?void 0:e.max)==null?void 0:c.value)};if((p=e==null?void 0:e.min)!=null&&p.entity&&((h=e==null?void 0:e.max)!=null&&h.entity)){let v={min:ke(r,e.min.entity,e.min.attribute),max:ke(r,e.max.entity,e.max.attribute)};return a(v)?v:Number.isFinite(v.min)&&Number.isFinite(v.max)&&a(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&a(i)?i:{min:0,max:100}}let n={min:(m=he(r,e==null?void 0:e.min))!=null?m:0,max:(_=he(r,e==null?void 0:e.max))!=null?_:100};if(a(n))return n;let l={min:(f=i.min)!=null?f:0,max:(y=i.max)!=null?y:100};return a(l)?l:{min:0,max:100}}var Jt=te(()=>{_e()});function Yi(r,e,t,a=null){return{code:r,message:e,path:t,entity:a}}function Zt(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:D((e=r.fixed)!=null?e:r.value)}function N(r,e,t,a,i=null){r.warnings.push(Yi(e,t,a,i))}function mt(r,e,t,a=null){e!=null&&e.attribute_invalid&&N(r,"source.invalid_attribute","Attribute must be a non-empty string; using the entity state.",t,a)}function ft(r,e,t,a=null){e!=null&&e.entity_invalid&&N(r,"source.invalid_entity_source","Entity source must be an entity ID or `{ id: entity_id, attribute: attribute_name }`; sibling `attribute` is not supported.",t,a)}function Ji(r,e,t,a=null){var l,s;if((l=e==null?void 0:e.min)!=null&&l.entity&&((s=e==null?void 0:e.max)!=null&&s.entity)){let o=u=>{var d,c;return u.fixed_explicit!==!1&&((d=u.fixed)!=null?d:u.value)!==null&&((c=u.fixed)!=null?c:u.value)!==void 0};o(e.min)!==o(e.max)&&N(r,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,a)}let i=Zt(e==null?void 0:e.min),n=Zt(e==null?void 0:e.max);return Number.isFinite(i)&&Number.isFinite(n)&&i>n&&N(r,"scale.min_gt_max","Scale minimum is greater than maximum.",t,a),{min:i,max:n}}function Zi(r,e,t,a,i=null){var o;let n=Zt((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&N(r,"target.outside_scale","Fixed target value is outside the fixed scale range.",a,i)}function Qi(r,e,t,a,i=null){var o;let n=Zt((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(n))return;let{min:l,max:s}=t;Number.isFinite(l)&&Number.isFinite(s)&&(n<l||n>s)&&N(r,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",a,i)}function Ci(r){var e;return!!r&&(Number.isFinite(D((e=r.fixed)!=null?e:r.value))||Number.isFinite(r.percent)||!!r.entity)}function en(r,e,t,a=null){var l,s,o,u;let i=((s=(l=e==null?void 0:e.bar)==null?void 0:l.needle)==null?void 0:s.show)===!0,n=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&Ci((u=e==null?void 0:e.baseline)==null?void 0:u.at);i&&n&&N(r,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,a)}function tn(r,e,t,a=null){var i;for(let n of["peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.reset_invalid&&N(r,`${n}.invalid_reset`,"Invalid marker reset; using never.",`${t}.${n}.reset`,a)}function an(r,e,t,a=null){var i;for(let n of["target_marker","peak_marker","floor_marker"])(i=e==null?void 0:e[n])!=null&&i.direction_invalid&&N(r,`${n}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${n==="target_marker"?"target":n.replace("_marker","")}.direction`,a)}function rn(r,e,t,a=null){var i;for(let[n,l]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let s=e==null?void 0:e[n],o=`${t}.${l}.label`;s!=null&&s.label_invalid_show&&N(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,a),s!=null&&s.label_invalid_text&&N(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,a),s!=null&&s.label_invalid_show_value&&N(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,a),s!=null&&s.label_invalid_show_unit&&N(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,a),s!=null&&s.label_invalid_precision&&N(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(i=s.label_precision_key)!=null?i:"precision"}`,a),s!=null&&s.label_unsupported_unit&&N(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,a)}}function Da(r,e,t,a,i=null){var n,l,s,o,u,d,c,b;t&&N(r,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",a,i);for(let p of e!=null?e:[]){let h=`${a}[${p.index}]`;if(p.malformed){N(r,"markers.invalid_item","Marker must be an object; ignoring this item.",h,i);continue}ft(r,p.source,`${h}.at`,i),p.invalidSource&&!p.invalidPercentage&&!p.unsupportedPercentField&&N(r,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${h}.at`,i),p.invalidPercentage&&N(r,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${h}.at`,i),p.unsupportedPercentField&&N(r,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${h}.at`,i),p.invalidLane&&N(r,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${h}.lane`,i),p.invalidShape&&N(r,"markers.invalid_shape","Invalid marker shape; using circle.",`${h}.shape`,i),p.invalidDirection&&N(r,"markers.invalid_direction","Invalid marker direction; using inward.",`${h}.direction`,i),p.invalidShowMarker&&N(r,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${h}.show_marker`,i),(n=p.label)!=null&&n.invalidEntity&&N(r,"markers.invalid_label_entity","Marker label entity must be an entity ID or `{ id, attribute }`; sibling `label.attribute` is not supported.",`${h}.label.entity`,i),(l=p.label)!=null&&l.invalidShow&&N(r,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${h}.label.show`,i),(s=p.label)!=null&&s.invalidText&&N(r,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${h}.label.text`,i),(o=p.label)!=null&&o.invalidShowValue&&N(r,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${h}.label.show_value`,i),(u=p.label)!=null&&u.invalidShowUnit&&N(r,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${h}.label.show_unit`,i),(d=p.label)!=null&&d.invalidPrecision&&N(r,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${h}.label.${(c=p.label.invalidPrecisionKey)!=null?c:"precision"}`,i),(b=p.label)!=null&&b.unsupportedUnit&&N(r,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${h}.label.unit`,i),p.valid&&!p.accepted&&N(r,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",h,i)}}function ci(r){var e;return!r||r.entity||Number.isFinite(r.percent)?null:D((e=r.fixed)!=null?e:r.value)}function nn(r,e,t,a,i=null){if(!Array.isArray(e)||!e.length)return;let n=[],{min:l,max:s}=t;for(let u=0;u<e.length;u+=1){let d=e[u],c=ci(d==null?void 0:d.from),b=ci(d==null?void 0:d.to),p=`${a}.segments[${u}]`;if((d==null?void 0:d.invalidBoundary)==="entity"){N(r,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",p,i);continue}if((d==null?void 0:d.invalidBoundary)==="malformed_percent"){N(r,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",p,i);continue}if(d!=null&&d.invalidBoundary){N(r,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',p,i);continue}Number.isFinite(c)&&Number.isFinite(b)&&c>b&&N(r,"segments.from_gt_to","Segment start is greater than segment end.",p,i),Number.isFinite(l)&&Number.isFinite(s)&&(Number.isFinite(c)&&(c<l||c>s)&&N(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,i),Number.isFinite(b)&&(b<l||b>s)&&N(r,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,i)),Number.isFinite(c)&&Number.isFinite(b)&&n.push({from:c,to:b,path:p})}let o=[...n].sort((u,d)=>u.from-d.from);for(let u=1;u<o.length;u+=1){let d=o[u-1],c=o[u];c.from<d.to&&N(r,"segments.overlap","Fixed segments overlap.",c.path,i)}}function ln(r,e,t,a=null){var n;if(!Array.isArray(e))return;let i=new Set;for(let l=0;l<e.length;l+=1){let s=D((n=e[l])==null?void 0:n.pos),o=`${t}.gradient_stops[${l}]`;Number.isFinite(s)&&(s<0||s>100)&&N(r,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,a),Number.isFinite(s)&&(i.has(s)?N(r,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,a):i.add(s))}}function hi(r,e,t,a=null){var n,l,s,o,u,d,c,b,p,h,m,_;(n=e==null?void 0:e.scale)!=null&&n.direction_invalid&&N(r,"scale.invalid_direction","Scale direction must be `normal` or `reverse`; using the inherited or default direction.",`${t}.scale.direction`,a),(l=e==null?void 0:e.bar)!=null&&l.direction_invalid&&N(r,"bar.invalid_direction","Bar direction must be `normal` or `reverse`; using the inherited or default direction.",`${t}.bar.direction`,a),mt(r,e,`${t}.attribute`,a),mt(r,(s=e==null?void 0:e.scale)==null?void 0:s.min,`${t}.scale.min.attribute`,a),mt(r,(o=e==null?void 0:e.scale)==null?void 0:o.max,`${t}.scale.max.attribute`,a),mt(r,(u=e==null?void 0:e.baseline)==null?void 0:u.at,`${t}.baseline.at.attribute`,a),mt(r,(d=e==null?void 0:e.target_marker)==null?void 0:d.source,`${t}.target.at.attribute`,a),ft(r,(c=e==null?void 0:e.scale)==null?void 0:c.min,`${t}.scale.min`,a),ft(r,(b=e==null?void 0:e.scale)==null?void 0:b.max,`${t}.scale.max`,a),ft(r,(p=e==null?void 0:e.baseline)==null?void 0:p.at,`${t}.baseline.at`,a),ft(r,(h=e==null?void 0:e.target_marker)==null?void 0:h.source,`${t}.target.at`,a);let i=Ji(r,e==null?void 0:e.scale,t,a);Zi(r,e,i,t,a),Qi(r,e,i,t,a),en(r,e,t,a),tn(r,e,t,a),an(r,e,t,a),rn(r,e,t,a),nn(r,(m=e==null?void 0:e.bar)==null?void 0:m.segments,i,`${t}.bar`,a),ln(r,(_=e==null?void 0:e.bar)==null?void 0:_.gradient_stops,`${t}.bar`,a)}function Qt(r){var i,n;let e={warnings:[],errors:[]};if(!r||typeof r!="object")return e;hi(e,r,"card"),Da(e,r.generic_markers,r.generic_markers_invalid,"markers");let t=new Set,a=Array.isArray(r.entities)?r.entities:[];for(let l=0;l<a.length;l+=1){let s=a[l],o=(i=s==null?void 0:s.entity)!=null?i:null,u=`entities[${l}]`;if(!o){N(e,"entities.missing_entity","Entity row is missing an entity id.",u,null);continue}if(t.has(o)?N(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",u,o):t.add(o),hi(e,s,u,o),Object.prototype.hasOwnProperty.call(s,"markers"))Da(e,s.generic_markers,s.generic_markers_invalid,`${u}.markers`,o);else{let d=((n=s.generic_markers)!=null?n:[]).filter(c=>{var b,p;return c.valid&&!c.accepted&&((p=(b=r.generic_markers)==null?void 0:b[c.index])==null?void 0:p.accepted)===!0});d.length&&Da(e,d,!1,`${u}.markers`,o)}}return e}var La=te(()=>{_e()});function re(r,e="normal"){if(!Number.isFinite(r))return null;let t=Math.min(100,Math.max(0,r));return e==="reverse"?100-t:t}function Ct(r,e,t="normal"){let a=re(r,t),i=re(e,t);return!Number.isFinite(a)||!Number.isFinite(i)?null:{start:Math.min(a,i),end:Math.max(a,i)}}var Ba=te(()=>{});function pe(r,e=null){return Number.isFinite(r)?e!==null?r.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):r.toLocaleString():String(r)}function qa(r){return["h","m","s"].includes(String(r||"").trim())}function Oa(r,e){if(!e)return String(r);let t=String(e);return`${r}${qa(t)?"":" "}${t}`}function _t(r,e,t=null){let a=pe(r,t),i=e?String(e):"";return{value:r,number:a,unit:i,text:Oa(a,i)}}function vt(r,e,t=null,a={}){let i=typeof a.text=="string"?a.text:"",n=a.showValue===!1||r===null||r===void 0||r===""?"":Number.isFinite(r)?pe(r,t):String(r),l=a.showUnit===!1?"":String(e!=null?e:"").trim(),s=[i,n,l].filter(Boolean).join(" ");return{value:Number.isFinite(r)?r:null,semanticText:i,number:n,unit:l,showValue:a.showValue!==!1,showUnit:a.showUnit!==!1,text:s}}function pi(r){let e=String(r);return{value:null,number:e,unit:"",text:e}}var ea=te(()=>{});function bi(r){return r?r.entity!==null&&r.entity!==void 0&&r.entity!==""||r.fixed!==null&&r.fixed!==void 0&&r.fixed!==""||Number.isFinite(r.percent):!1}function aa(r,e="circle"){return sn.has(r)?r:e}function ta({id:r,type:e,value:t=null,position:a=null,lane:i,visible:n=!1,color:l=null,label:s=null,labelVisible:o=!1,shape:u="circle",direction:d="inward",showMarker:c=!0}){return{id:r,type:e,value:t,position:a,lane:i,visible:n===!0,color:l,label:s,labelVisible:o===!0,shape:aa(u),direction:d,showMarker:c!==!1}}function de(r){return!!(typeof(r==null?void 0:r.text)=="string"&&r.text.trim())||(r==null?void 0:r.showValue)!==!1||(r==null?void 0:r.showUnit)!==!1}function ra(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&bi(e==null?void 0:e.source)||(a==null?void 0:a.show)===!0||i.some(l=>l.lane==="below"),above:(t==null?void 0:t.show)===!0||i.some(l=>l.lane==="above")}}function ia(r){var n;let e=r==null?void 0:r.target_marker,t=r==null?void 0:r.peak_marker,a=r==null?void 0:r.floor_marker,i=((n=r==null?void 0:r.generic_markers)!=null?n:[]).filter(l=>l.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&bi(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&de({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(a==null?void 0:a.show)===!0&&(a==null?void 0:a.show_label)===!0&&de({text:a.label_text,showValue:a.label_show_value,showUnit:a.label_show_unit})||i.some(l=>{var s;return l.lane==="below"&&((s=l.label)==null?void 0:s.show)===!0&&de(l.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&de({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||i.some(l=>{var s;return l.lane==="above"&&((s=l.label)==null?void 0:s.show)===!0&&de(l.label)})}}function na({entityConfig:r,targetValue:e=null,targetPosition:t=null,targetPresentation:a=null,targetLabelPresentation:i=null,targetVisible:n=Number.isFinite(t),peakValue:l=null,peakPosition:s=null,peakPresentation:o=null,peakLabelPresentation:u=null,peakVisible:d=Number.isFinite(s),floorValue:c=null,floorPosition:b=null,floorPresentation:p=null,floorLabelPresentation:h=null,floorVisible:m=Number.isFinite(b),genericMarkers:_=[]}){var x,S,M,w,k,F,$;let f=r==null?void 0:r.target_marker,y=r==null?void 0:r.peak_marker,v=r==null?void 0:r.floor_marker,g=(f==null?void 0:f.enabled)!==!1;return[ta({id:"target",type:"target",value:e,position:t,lane:"below",visible:g&&n,color:(x=f==null?void 0:f.color)!=null?x:null,label:i!=null?i:a,labelVisible:g&&(f==null?void 0:f.show_label)===!0&&de({text:f.label_text,showValue:f.label_show_value,showUnit:f.label_show_unit}),shape:(S=f==null?void 0:f.shape)!=null?S:"diamond",direction:(M=f==null?void 0:f.direction)!=null?M:"inward"}),ta({id:"floor",type:"floor",value:c,position:b,lane:"below",visible:(v==null?void 0:v.show)===!0&&m,color:(w=v==null?void 0:v.color)!=null?w:null,label:h!=null?h:p,labelVisible:(v==null?void 0:v.show)===!0&&(v==null?void 0:v.show_label)===!0&&de({text:v.label_text,showValue:v.label_show_value,showUnit:v.label_show_unit}),shape:"triangle",direction:(k=v==null?void 0:v.direction)!=null?k:"inward"}),ta({id:"peak",type:"peak",value:l,position:s,lane:"above",visible:(y==null?void 0:y.show)===!0&&d,color:(F=y==null?void 0:y.color)!=null?F:null,label:u!=null?u:o,labelVisible:(y==null?void 0:y.show)===!0&&(y==null?void 0:y.show_label)===!0&&de({text:y.label_text,showValue:y.label_show_value,showUnit:y.label_show_unit}),shape:"triangle",direction:($=y==null?void 0:y.direction)!=null?$:"inward"}),..._.map(R=>ta({id:R.id,type:"generic",value:R.value,position:R.position,lane:R.lane,visible:R.visible,color:R.color,label:R.label,labelVisible:R.labelVisible&&de(R.label),shape:R.shape,direction:R.direction,showMarker:R.showMarker}))]}var sn,la=te(()=>{sn=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function on(r,e=""){var n,l,s;let t=String((l=(n=r==null?void 0:r.attributes)==null?void 0:n.device_class)!=null?l:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let a=String(e||"").split(".")[0];return(s={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[a])!=null?s:null}function ve(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function un(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function mi(r){let e=un(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function dn(r,e,t,a,i,n){var d,c,b;let l=(d=r==null?void 0:r.bar)==null?void 0:d.needle;if(!(l!=null&&l.show)||Number.isFinite(i)||!Number.isFinite(e)){let p=(c=l==null?void 0:l.color)!=null?c:"#ffffff";return{show:!1,percent:null,pct:null,color:p,borderColor:mi(p),edge:"middle"}}let s=(b=l.color)!=null?b:"#ffffff",o=ve(e,t,a),u=re(o,n);return{show:!0,percent:o,pct:u,positionPercent:u,color:s,borderColor:mi(s),edge:u<=0?"left":u>=100?"right":"middle"}}function fi(r,e,t,a,i,n){if(!n)return{value:null,percent:null,display:null,visible:!1};let l=D(a==null?void 0:a.value);if(!Number.isFinite(l)&&!Number.isFinite(r))return{value:null,percent:null,visible:!1};let s=Number.isFinite(l)?Number.isFinite(r)?i==="min"?Math.min(l,r):Math.max(l,r):l:r;return{value:s,percent:ve(s,e,t),visible:!0}}function yt(r){var ie,le,se,me,$t,Pe,Ae,Ie,Ve,We,Te,De,Le,Be,qe,Oe,He,Ue,je,Ee,Ge,Ke,Xe,Ye,Je,Ze,Qe,Ce,et,tt,at,Q,rt,it,cr,hr,pr,br,mr,fr,_r,vr,yr,xr,gr,wr,kr,Sr,Mr,Rr,$r,Nr,Fr,zr,Pr,Ar,Ir,Vr,Wr,Tr,Dr,Lr,Br,qr;let{hass:e,cardConfig:t,entityConfig:a,entityState:i,peaks:n,extrema:l,previousScale:s}=r,o=(ie=a==null?void 0:a.entity)!=null?ie:null,u=pt(i,a==null?void 0:a.attribute),d=u.found&&!u.available?(le=u.stateObj)==null?void 0:le.state:null,c=d!=null?d:u.available&&u.attributeFound?u.value:"",b=typeof c=="string"||typeof c=="number"||typeof c=="boolean"?c:"",p=u.available&&u.attributeFound?D(u.value):null,h=(me=(se=i==null?void 0:i.attributes)==null?void 0:se.unit_of_measurement)!=null?me:"",m=($t=a==null?void 0:a.formatting)==null?void 0:$t.unit,_=(Pe=m!=null?m:h)!=null?Pe:"",f=p!==null?_:"",{min:y,max:v}=di(e,a==null?void 0:a.scale,s),g=(Ie=(Ae=a==null?void 0:a.scale)==null?void 0:Ae.direction)!=null?Ie:"normal",x=p!==null?ve(p,y,v):0,S=p!==null?re(x,g):null,M=(We=(Ve=a==null?void 0:a.formatting)==null?void 0:Ve.decimal)!=null?We:null,w=p===null?pi(b):_t(p,f,M),k=((Te=a==null?void 0:a.target_marker)==null?void 0:Te.enabled)===!1?null:he(e,(De=a==null?void 0:a.target_marker)==null?void 0:De.source,y,v),F=k!==null?ve(k,y,v):null,$=re(F,g),R=k!==null,A=(Be=(Le=a==null?void 0:a.target_marker)==null?void 0:Le.label_decimal)!=null?Be:M,T=k!==null?_t(k,_,A):null,P=k!==null?vt(k,_,(Oe=(qe=a==null?void 0:a.target_marker)==null?void 0:qe.label_precision)!=null?Oe:A,{text:(He=a==null?void 0:a.target_marker)==null?void 0:He.label_text,showValue:(Ue=a==null?void 0:a.target_marker)==null?void 0:Ue.label_show_value,showUnit:(je=a==null?void 0:a.target_marker)==null?void 0:je.label_show_unit}):null,V=((Ee=a==null?void 0:a.baseline)==null?void 0:Ee.enabled)===!1?null:he(e,(Ge=a==null?void 0:a.baseline)==null?void 0:Ge.at,y,v),W=Number.isFinite(V)?ve(V,y,v):null,B=re(W,g),O=Number.isFinite(V),G=Number.isFinite(D(n==null?void 0:n[o]))?{value:D(n==null?void 0:n[o])}:null,L=fi(p,y,v,(Ke=l==null?void 0:l.peak)!=null?Ke:G,"max",((Xe=a==null?void 0:a.peak_marker)==null?void 0:Xe.show)===!0),q=fi(p,y,v,l==null?void 0:l.floor,"min",((Ye=a==null?void 0:a.floor_marker)==null?void 0:Ye.show)===!0),K=(Ze=(Je=a==null?void 0:a.peak_marker)==null?void 0:Je.label_decimal)!=null?Ze:M,E=(Ce=(Qe=a==null?void 0:a.floor_marker)==null?void 0:Qe.label_decimal)!=null?Ce:M,I=(tt=(et=a==null?void 0:a.peak_marker)==null?void 0:et.label_precision)!=null?tt:K,U=(Q=(at=a==null?void 0:a.floor_marker)==null?void 0:at.label_precision)!=null?Q:E,z=L.visible?_t(L.value,_,K):null,H=q.visible?_t(q.value,_,E):null,X=L.visible?vt(L.value,_,I,{text:(rt=a==null?void 0:a.peak_marker)==null?void 0:rt.label_text,showValue:(it=a==null?void 0:a.peak_marker)==null?void 0:it.label_show_value,showUnit:(cr=a==null?void 0:a.peak_marker)==null?void 0:cr.label_show_unit}):null,j=q.visible?vt(q.value,_,U,{text:(hr=a==null?void 0:a.floor_marker)==null?void 0:hr.label_text,showValue:(pr=a==null?void 0:a.floor_marker)==null?void 0:pr.label_show_value,showUnit:(br=a==null?void 0:a.floor_marker)==null?void 0:br.label_show_unit}):null,ae=((mr=a==null?void 0:a.generic_markers)!=null?mr:[]).filter(Y=>Y.accepted).map(Y=>{var Hr,Ur,jr,Er,Gr;let nt=he(e,Y.source,y,v),ga=Number.isFinite(nt),Fi=(Hr=Y.label.precision)!=null?Hr:M,ue=Y.label.entity?bt(e,Y.label.entity,Y.label.attribute):null,wa=ue==null?void 0:ue.value,xe=typeof wa=="string"?wa.trim():wa,Or=(ue==null?void 0:ue.found)&&ue.available&&ue.attributeFound&&xe!==null&&xe!==void 0&&xe!==""&&!["unknown","unavailable"].includes(String(xe).trim().toLowerCase()),zi=Y.label.entity?Or?(Ur=D(xe))!=null?Ur:String(xe):null:nt,Pi=Y.label.entity?Or&&(Gr=(Er=(jr=ue.stateObj)==null?void 0:jr.attributes)==null?void 0:Er.unit_of_measurement)!=null?Gr:"":_,Ai=Y.label.show?vt(zi,Pi,Fi,{text:Y.label.text,showValue:Y.label.showValue,showUnit:Y.label.showUnit}):null;return{id:Y.id,value:nt,scalePercent:ga?ve(nt,y,v):null,position:ga?re(ve(nt,y,v),g):null,lane:Y.lane,visible:ga,color:Y.color,shape:Y.shape,direction:Y.direction,showMarker:Y.showMarker,label:Ai,labelVisible:Y.label.show}}),ee=na({entityConfig:a,targetValue:k,targetPosition:$,targetPresentation:T,targetLabelPresentation:P,targetVisible:R,peakValue:L.value,peakPosition:re(L.percent,g),peakPresentation:z,peakLabelPresentation:X,peakVisible:L.visible,floorValue:q.value,floorPosition:re(q.percent,g),floorPresentation:H,floorLabelPresentation:j,floorVisible:q.visible,genericMarkers:ae});return{entityId:o,name:(vr=(_r=a==null?void 0:a.name)!=null?_r:(fr=i==null?void 0:i.attributes)==null?void 0:fr.friendly_name)!=null?vr:o,icon:(a==null?void 0:a.icon)===!1?!1:(gr=(xr=a==null?void 0:a.icon)!=null?xr:(yr=i==null?void 0:i.attributes)==null?void 0:yr.icon)!=null?gr:on(i,o),state:b,numericValue:p,rawUnit:h,min:y,max:v,percent:x,positionPercent:S,displayValue:w.number,displayUnit:w.unit,primaryPresentation:w,unit:w.unit,barColor:(kr=(wr=a==null?void 0:a.bar)==null?void 0:wr.color)!=null?kr:null,fillStyle:(Mr=(Sr=a==null?void 0:a.bar)==null?void 0:Sr.fill_style)!=null?Mr:null,target:k,targetPercent:F,targetPositionPercent:$,targetDisplay:(Rr=T==null?void 0:T.text)!=null?Rr:null,targetPresentation:T,targetLabelPresentation:P,targetVisible:R,baseline:V,baselinePercent:W,baselinePositionPercent:B,baselineVisible:O,peak:L.value,peakPercent:L.percent,peakDisplay:($r=z==null?void 0:z.number)!=null?$r:null,peakPresentation:z,peakLabelPresentation:X,peakVisible:L.visible,floor:q.value,floorPercent:q.percent,floorDisplay:(Nr=H==null?void 0:H.number)!=null?Nr:null,floorPresentation:H,floorLabelPresentation:j,floorVisible:q.visible,markers:ee,markerLaneOccupancy:ra(a),markerLabelLaneOccupancy:ia(a),segments:(zr=(Fr=a==null?void 0:a.bar)==null?void 0:Fr.segments)!=null?zr:null,gradientStops:(Ar=(Pr=a==null?void 0:a.bar)==null?void 0:Pr.gradient_stops)!=null?Ar:null,needle:dn(a,p,y,v,W,g),classes:{labelPosition:(Wr=(Vr=(Ir=a==null?void 0:a.layout)==null?void 0:Ir.label)==null?void 0:Vr.position)!=null?Wr:"left",animated:((Tr=a==null?void 0:a.bar)==null?void 0:Tr.animated)!==!1},attributes:{entity:o,baseHeight:(Lr=(Dr=a==null?void 0:a.layout)==null?void 0:Dr.height)!=null?Lr:38,heightExplicit:((Br=a==null?void 0:a.layout)==null?void 0:Br.height_explicit)===!0,barAnimated:((qr=a==null?void 0:a.bar)==null?void 0:qr.animated)!==!1}}}var Ha=te(()=>{Jt();_e();Ba();ea();la()});function C(r){return r==null?"":String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Z(r,e,t){var n,l;if(!(r!=null&&r.style))return!1;let a=t==null?"":String(t);return e.startsWith("--")?(typeof r.style.getPropertyValue=="function"?r.style.getPropertyValue(e):(n=r.style[e])!=null?n:"")===a?!1:(typeof r.style.setProperty=="function"?r.style.setProperty(e,a):r.style[e]=a,!0):((l=r.style[e])!=null?l:"")===a?!1:(r.style[e]=a,!0)}function Me(r,e){var i;if(!(r!=null&&r.style))return!1;let t=e==null?"":String(e);return((i=r.style.cssText)!=null?i:"")===t?!1:(r.style.cssText=t,!0)}function oe(r,e,t){var n;if(!(r!=null&&r.dataset))return!1;let a=t==null?"":String(t);return((n=r.dataset[e])!=null?n:"")===a?!1:(r.dataset[e]=a,!0)}function sa(r,e){var a;if(!r)return!1;let t=e==null?"":String(e);return((a=r.className)!=null?a:"")===t?!1:(r.className=t,!0)}var oa=te(()=>{});function _i(r){let e=-1/0;return r.map(t=>(e=Math.max(e,t.p),{...t,p:e}))}function Ua(r,e){return e!=="reverse"?r.map(t=>({...t})):_i(r).map(t=>({...t,p:100-t.p})).reverse()}function ba(r,e){if(!r||!e||!Number.isFinite(r.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(r.baselinePercent)?r.baselinePercent:0,a=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,i=Math.max(Math.abs(e.valuePercent-r.valuePercent),Math.abs(a-t)),n=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,i-5))));return Number.isFinite(r.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(r.valuePercent-r.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(n,300):n}function ua(r,e=null){let t=[...r].sort((a,i)=>a.from-i.from);return t.map((a,i)=>{var l;let n=Number.isFinite(a.to)?a.to:null;return!Number.isFinite(n)&&i<t.length-1&&(n=t[i+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:a.from,to:n,color:a.color,label:(l=a.label)!=null?l:null}})}function $e(r){if(!r||typeof r!="string")return null;let e=r.replace("#","").trim(),t=e.length===3?e.split("").map(a=>a+a).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function ma(r,e=0,t=100,a=!1){let n=Ne(r,e,t).filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&s.from<s.to&&(s==null?void 0:s.color)).sort((s,o)=>s.from-o.from);if(!n.length)return[];let l=[];for(let s=0;s<n.length;s++){let o=n[s],u=$e(o.color);if(!u&&!a)continue;let d;s===0?d=o.from:s===n.length-1?d=o.to:d=o.from+(o.to-o.from)/2,(!l.length||l[l.length-1].p!==d)&&l.push({p:d,...u!=null?u:{color:o.color}})}return l}function cn(r,e="#4a9eff",t="normal"){let a=r.filter(l=>Number.isFinite(l==null?void 0:l.from)&&Number.isFinite(l==null?void 0:l.to)&&l.from<l.to&&(l==null?void 0:l.color)).sort((l,s)=>l.from-s.from);if(!a.length)return null;let i=[];for(let l of a)i.push({color:l.color,p:l.from},{color:l.color,p:l.to});return`linear-gradient(to right, ${(t==="reverse"?Ua(i,t):i).map(l=>`${l.color} ${l.p}%`).join(", ")})`}function ja(r,e=0,t=100,a="normal"){var i,n;return cn(Ne(r,e,t),(n=(i=r.bar)==null?void 0:i.color)!=null?n:"#4a9eff",a)}function Ea(){return 1.5}function be(r,e,t){if(!Array.isArray(r)||!t)return;let a=Math.min(100,Math.max(0,e)),i=r[r.length-1];i&&i.color===t&&Math.abs(i.p-a)<1e-4||r.push({p:a,color:t})}function gt(r,e=0,t=100){let i=Ne(r,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,u)=>o.from-u.from);if(!i.length)return[];let n=Ea(),l=n/2,s=[];be(s,i[0].from,i[0].color);for(let o=0;o<i.length-1;o++){let u=i[o],d=i[o+1],c=u.to,b=u.to-u.from,p=d.to-d.from;b>=n&&p>=n?(be(s,Math.max(u.from,c-l),u.color),be(s,Math.min(d.to,c+l),d.color)):(be(s,c,u.color),be(s,c,d.color))}return be(s,i[i.length-1].to,i[i.length-1].color),s}function Ga(r,e=0,t=100,a="normal"){let i=Ua(gt(r,e,t),a);return i.length?`linear-gradient(to right, ${i.map(n=>`${n.color} ${n.p}%`).join(", ")})`:null}function da(r,e,t){if(r==null)return null;if(typeof r=="object"&&!Array.isArray(r)){let n=D(r.fixed);return Number.isFinite(n)?xt(n,e,t):Number.isFinite(r.percent)?r.percent:null}let a=fe(r);if(Number.isFinite(a))return a;let i=D(r);return Number.isFinite(i)?xt(i,e,t):null}function wt(r){var e,t,a,i;return(i=(a=(e=r==null?void 0:r.bar)==null?void 0:e.fill_style)!=null?a:ht((t=r==null?void 0:r.bar)==null?void 0:t.color_mode))!=null?i:"bands"}function Ka(r){return Array.isArray(r)&&r.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Ne(r,e=0,t=100){var l,s;let a=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,n=(Array.isArray((l=r.bar)==null?void 0:l.segments)?r.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((s=r.bar)==null?void 0:s.segment_space)==="scale"||Ka(n)){let o=n.map(u=>{var d;return{from:da(u.from,a,i),to:da(u.to,a,i),color:u.color,label:(d=u.label)!=null?d:null}}).filter(u=>Number.isFinite(u.from)&&u.color);return ua(o,100).filter(u=>Number.isFinite(u.from)&&Number.isFinite(u.to)&&u.from<u.to&&u.color)}return ua(n,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.from<o.to&&o.color)}function Xa(r,e,t=0,a=100){let i=wt(e);if(i==="solid")return e.bar.color;if(i==="gradient"||i==="band_gradient"||i==="soft_bands"){let n;if(i==="band_gradient"?n=ma(e,t,a):i==="soft_bands"?n=_i(gt(e,t,a)).map(u=>{let d=$e(u.color);return d?{p:u.p,...d}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(n=e.bar.gradient_stops.map(u=>{let d=u.color.replace("#",""),c=d.length===3?d.split("").map(b=>b+b).join(""):d;return{p:u.pos,r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}}),n.sort((u,d)=>u.p-d.p)):n=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!n||!n.length)return e.bar.color;let l=n[0],s=n[n.length-1];for(let u=0;u<n.length-1;u++)if(r>=n[u].p&&r<=n[u+1].p){l=n[u],s=n[u+1];break}let o=l.p===s.p?0:(r-l.p)/(s.p-l.p);return`rgb(${Math.round(l.r+o*(s.r-l.r))},${Math.round(l.g+o*(s.g-l.g))},${Math.round(l.b+o*(s.b-l.b))})`}for(let n of Ne(e,t,a))if(r>=n.from&&r<=n.to)return n.color;return e.bar.color}function Ya(r,e="normal"){if(!Array.isArray(r)||!r.length)return null;let t=Ua(r,e).map(a=>{var n;let i=(n=a.color)!=null?n:Za(a);return i?`${i} ${a.p}%`:null}).filter(Boolean);return t.length?`background:linear-gradient(to right,${t.join(",")});background-repeat:no-repeat;`:null}function Ja(r,e=0,t=100){let a=wt(r);return a==="band_gradient"?ma(r,e,t,!0):a==="soft_bands"?gt(r,e,t).map(i=>{let n=$e(i.color);return n?{p:i.p,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):r.bar.gradient_stops&&r.bar.gradient_stops.length>=2?r.bar.gradient_stops.map(i=>{let n=$e(i.color);return n?{p:i.pos,...n}:null}).filter(Boolean).sort((i,n)=>i.p-n.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function Za(r){return r?`rgb(${r.r},${r.g},${r.b})`:null}function ca(r){return`linear-gradient(to right,${r} 0%,${r} 100%)`}function Qa(r,e,t=0,a=100,i="normal"){var l;let n=wt(e);if(e.bar.solid_fill)return ca(r);if(n==="bands")return ja(e,t,a,i);if(n==="soft_bands")return Ga(e,t,a,i);if(n==="gradient"||n==="band_gradient"){let s=Ja(e,t,a);return(l=Ya(s,i))==null?void 0:l.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return ca(r)}function ha(r,e,t){if(!t)return null;let a=Math.min(100,Math.max(0,r)),i=Math.min(100,Math.max(0,e));return i<=a?null:`linear-gradient(to right,transparent 0%,transparent ${a}%,${t} ${a}%,${t} ${i}%,transparent ${i}%,transparent 100%)`}function xt(r,e,t){if(!Number.isFinite(r))return null;let a=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-a||1;return Math.min(100,Math.max(0,(r-a)/n*100))}function Ca(r,e=null){let t=Math.min(100,Math.max(0,r));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let a=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,a),end:Math.max(t,a),positive:t>=a,baseline:a,hidden:t===a}}function er(r){return r!=null&&r.endpointSemantics?r.endpointSemantics:r!=null&&r.usesBaseline?r.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function tr(r){let e=er(r),t=n=>n==="value"||n==="range"||n==="scale",a=t(e.left)?"6px":"0",i=t(e.right)?"6px":"0";return`${a} ${i} ${i} ${a}`}function ar(r=null,e="normal"){if(!Number.isFinite(r))return null;let t=Ct(r,100,e);return!t||t.start>=t.end?null:t}function rr(r=null,e="normal"){let t=ar(r,e);return t?{start:t.start,end:t.end,hidden:!1}:null}function ir(r,e,t=null,a=null,i=0,n=100,l="normal"){var d,c,b,p,h,m;let s=[],o=Qa(e,r,i,n,l),u=Number.isFinite(a)?Math.min(100,Math.max(0,a)):null;if(Number.isFinite(u)){let _=(b=(c=(d=r.baseline)==null?void 0:d.below)==null?void 0:c.color)!=null?b:null,f=(m=(h=(p=r.baseline)==null?void 0:p.above)==null?void 0:h.color)!=null?m:null,y=Ct(0,u,l),v=Ct(u,100,l),g=y?ha(y.start,y.end,_):null,x=v?ha(v.start,v.end,f):null;g&&s.push(g),x&&s.push(x)}return o&&s.push(o),s.length?`display:block;inset:0;background-image:${s.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function nr(r,e){var d,c;let t=typeof e=="number"?`${e}px`:e,a=Math.min(100,Math.max(0,(d=r==null?void 0:r.start)!=null?d:0)),i=Math.min(100,Math.max(0,(c=r==null?void 0:r.end)!=null?c:0));if(r!=null&&r.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let n="0",l=`${Math.max(0,100-i)}%`,s="0",o=`${a}%`,u=tr(r);return`display:block;height:${t};clip-path:inset(${n} ${l} ${s} ${o} round ${u});`}function pa(r){if(!(r!=null&&r.hidden)&&Number.isFinite(r==null?void 0:r.start)&&Number.isFinite(r==null?void 0:r.end)&&r.end>r.start){let e=Math.min(100,Math.max(0,r.start)),t=Math.min(100,Math.max(0,r.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function lr(r,e,t,a,i=null,n=null,l=0,s=100,o="normal"){var p,h;let d={id:"base",zIndex:1,visible:!0,paintStyle:ir(t,a,i,n,l,s,o),revealStyle:"display:block;"},c=rr(i,o),b={id:"above-target",zIndex:2,visible:!!((p=t==null?void 0:t.bar)!=null&&p.above_target_color&&c),paintStyle:(h=t==null?void 0:t.bar)!=null&&h.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:pa(c||{start:0,end:0,hidden:!0})};return[d,b]}function sr(r,e,t,a,i=null,n=null,l=0,s=100,o=!1,u=(b=>(b=(c=>(c=t==null?void 0:t.scale)==null?void 0:c.direction)())!=null?b:"normal")(),d=(h=>(h=(p=>(p=t==null?void 0:t.bar)==null?void 0:p.direction)())!=null?h:"normal")()){var v,g;let m=re(r,u),_=re(n,u),f;if(o)f=Ca(100,null);else if(!Number.isFinite(r))f={usesBaseline:Number.isFinite(_),start:0,end:0,positive:!0,baseline:_,hidden:!0,endpointSemantics:{left:"scale",right:"value"}};else if(Number.isFinite(_)){let x=r>=n;f={usesBaseline:!0,start:Math.min(m,_),end:Math.max(m,_),positive:x,baseline:_,hidden:m===_,endpointSemantics:m<=_?{left:"value",right:"baseline"}:{left:"baseline",right:"value"}}}else{let x=d==="reverse";f={usesBaseline:!1,start:x?m:0,end:x?100:m,positive:!0,baseline:null,hidden:x?m>=100:m<=0,endpointSemantics:x?{left:"value",right:"scale"}:{left:"scale",right:"value"}}}let y=lr(f,e,t,a,i,n,l,s,u);return{geometry:f,paintLayers:y,paintStyle:(g=(v=y[0])==null?void 0:v.paintStyle)!=null?g:"display:none;",revealStyle:nr(f,e)}}function vi(r,e,t=0,a=100,i=null,n=(s=>(s=(l=>(l=e==null?void 0:e.scale)==null?void 0:l.direction)())!=null?s:"normal")()){var c,b,p,h,m,_,f,y,v;let o=(c=e==null?void 0:e.bar)==null?void 0:c.needle;if(!(o!=null&&o.show))return{show:!1,pct:null,color:(b=o==null?void 0:o.color)!=null?b:"#ffffff",borderColor:Re((p=o==null?void 0:o.color)!=null?p:"#ffffff"),edge:"middle"};if(Number.isFinite(i))return{show:!1,pct:null,color:(h=o.color)!=null?h:"#ffffff",borderColor:Re((m=o.color)!=null?m:"#ffffff"),edge:"middle"};if(!Number.isFinite(r))return{show:!1,pct:null,color:(_=o.color)!=null?_:"#ffffff",borderColor:Re((f=o.color)!=null?f:"#ffffff"),edge:"middle"};let u=Math.min(100,Math.max(0,xt(r,t,a))),d=re(u,n);return{show:!0,pct:d,color:(y=o.color)!=null?y:"#ffffff",borderColor:Re((v=o.color)!=null?v:"#ffffff"),edge:d<=0?"left":d>=100?"right":"middle"}}function fa(r){let e=String(r||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],n=i.length===3?i.split("").map(l=>l+l).join(""):i;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let a=e.match(/^rgba?\(([^)]+)\)$/i);if(a){let i=a[1].split(",").map(n=>n.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function or({r,g:e,b:t}){let a=r/255,i=e/255,n=t/255,l=Math.max(a,i,n),s=Math.min(a,i,n),o=(l+s)/2;if(l===s)return{h:0,s:0,l:o*100};let u=l-s,d=o>.5?u/(2-l-s):u/(l+s),c;switch(l){case a:c=((i-n)/u+(i<n?6:0))/6;break;case i:c=((n-a)/u+2)/6;break;default:c=((a-i)/u+4)/6;break}return{h:c*360,s:d*100,l:o*100}}function kt(r){let e=fa(r);if(!e)return"#f3f4f6";let{h:t,s:a,l:i}=or(e),n=Math.abs(i-90)>=Math.abs(i-10)?90:10,l=Math.max(40,Math.min(100,a));return`hsl(${Math.round(t)} ${Math.round(l)}% ${Math.round(n)}%)`}function ye(r){var e;return(e=r==null?void 0:r.color)!=null?e:"#888888"}function Re(r){let e=fa(r);if(!e)return"#000000";let t=i=>{let n=i/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function St(r,e,{height:t,color:a=Xa(r.percent,e,r.min,r.max)}={}){var o,u,d,c,b,p,h,m,_,f,y;let i=r.baselinePercent,n=(d=r.baselinePositionPercent)!=null?d:re(i,(u=(o=e.scale)==null?void 0:o.direction)!=null?u:"normal"),l=(c=e.baseline)==null?void 0:c.at,s=((b=e.baseline)==null?void 0:b.enabled)!==!1&&(Number.isFinite(i)||!!(l!=null&&l.entity)||(l==null?void 0:l.fixed)!==null&&(l==null?void 0:l.fixed)!==void 0||Number.isFinite(l==null?void 0:l.percent));return{animated:e.bar.animated,fill:sr(r.numericValue===null?Number.isFinite(i)?0:null:r.percent,t,e,a,r.targetPercent,i,r.min,r.max,r.needle.show,(h=(p=e.scale)==null?void 0:p.direction)!=null?h:"normal",(_=(m=e.bar)==null?void 0:m.direction)!=null?_:"normal"),baseline:{configured:s,percent:n,positionPercent:n,scalePercent:i},needle:{...r.needle,configured:((y=(f=e.bar)==null?void 0:f.needle)==null?void 0:y.show)&&!Number.isFinite(i)},markers:r.markers}}var _a=te(()=>{_e();Ba()});function Fe(r){var u,d,c,b,p,h,m;if(!r)return"";let e=Number.isFinite(r.position)?r.position:0,t=ye(r),a=kt(t),i=r.visible?"":"none",n=r.type==="target"?"diamond":r.type==="generic"?"circle":"triangle",l=aa(r.shape,n),s=(u=r.lane)!=null?u:r.type==="peak"?"above":"below",o=`<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;if(r.type==="generic"){let _=s==="above"?["peak-inset","peak-outset"]:["target-inset","target-outset"];return`
    <div class="generic-marker" data-marker-id="${C(r.id)}" data-shape="${l}" data-lane="${s}" data-direction="${(d=r.direction)!=null?d:"inward"}" data-show-marker="${r.showMarker===!1?"false":"true"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${_[0]}"></div>
      <div class="${_[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(c=r.direction)!=null?c:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}return r.type==="target"||r.type==="floor"?`
    <div class="${`${r.type}-marker`}" data-shape="${l}" data-lane="${s}" data-direction="${(b=r.direction)!=null?b:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="${r.type}-inset"></div>
      <div class="${r.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(p=r.direction)!=null?p:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`:`
    <div class="peak-marker" data-shape="${l}" data-lane="${s}" data-direction="${(h=r.direction)!=null?h:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${a};display:${i};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${l}" data-lane="${s}" data-direction="${(m=r.direction)!=null?m:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}function ze(r,e){var l,s,o,u,d;if(!r||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",a=aa(e.shape,t);oe(r,"shape",a),oe(r,"lane",(l=e.lane)!=null?l:e.type==="peak"?"above":"below"),oe(r,"direction",(s=e.direction)!=null?s:"inward"),e.type==="generic"&&oe(r,"showMarker",e.showMarker===!1?"false":"true");let i=(o=r.querySelector)==null?void 0:o.call(r,".marker-shape-svg");i&&(oe(i,"shape",a),oe(i,"lane",(u=e.lane)!=null?u:e.type==="peak"?"above":"below"),oe(i,"direction",(d=e.direction)!=null?d:"inward")),Z(r,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&Z(r,"left",`${e.position}%`);let n=ye(e);Z(r,"--marker-color",n),Z(r,"--marker-contrast-color",kt(n))}function va(r,e,{revealDuration:t=600}={}){var d,c,b,p;let a=r.querySelector(".bar-fill-reveal"),i=r.querySelector(".baseline-indicator"),n=r.querySelector('.bar-paint-layer[data-layer="base"]');if(a&&(Me(a,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),sa(a,`bar-fill-reveal${e.animated?"":" no-anim"}`)),i){let h=(d=e.baseline.positionPercent)!=null?d:e.baseline.percent;Z(i,"display",Number.isFinite(h)?"block":"none"),Number.isFinite(h)&&Z(i,"left",`${h}%`)}if(n){let h=e.fill.paintLayers.find(m=>m.id==="base");h&&Me(n,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let l=r.querySelector('.bar-paint-layer[data-layer="above-target"]');if(l){let h=e.fill.paintLayers.find(m=>m.id==="above-target");h&&Me(l,`z-index:${h.zIndex};${h.paintStyle}${h.revealStyle}`)}let s=r.querySelector(".needle-marker");s&&(Z(s,"display",e.needle.show?"block":"none"),Z(s,"left",`${(c=e.needle.pct)!=null?c:0}%`),Z(s,"--needle-color",e.needle.color),Z(s,"--needle-border-color",e.needle.borderColor),oe(s,"edge",e.needle.edge));let o=e.markers,u=h=>{var m;return(m=o.find(_=>_.id===h||_.type===h))!=null?m:null};ze(r.querySelector(".target-marker"),u("target")),ze(r.querySelector(".peak-marker"),u("peak")),ze(r.querySelector(".floor-marker"),u("floor")),((p=(b=r.querySelectorAll)==null?void 0:b.call(r,".generic-marker[data-marker-id]"))!=null?p:[]).forEach(h=>{ze(h,u(h.dataset.markerId))})}function ya(r,{insideContent:e=""}={}){var p,h;let t=r.fill,a=(p=r.baseline.positionPercent)!=null?p:r.baseline.percent,i=r.needle,n=r.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(a)?`left:${a}%;display:block;`:"display:none;"}"></div>`:"",l=m=>{var _;return(_=r.markers.find(f=>f.id===m||f.type===m))!=null?_:null},s=Fe(l("peak")),o=Fe(l("target")),u=Fe(l("floor")),d=r.markers.filter(m=>m.type==="generic").map(Fe).join(""),c=i.configured?`
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${i.edge}" style="left:${(h=i.pct)!=null?h:0}%;--needle-color:${i.color};--needle-border-color:${i.borderColor};display:${i.show?"block":"none"};"></div>
      </div>`:"",b=t.paintLayers.map(m=>`
                  <div class="bar-paint-layer" data-layer="${m.id}" style="z-index:${m.zIndex};${m.paintStyle}${m.revealStyle}"></div>`).join("");return`<div class="bar-track">
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
              </div>`}var ur=te(()=>{la();_a();oa()});function gi(r,e,t){if(!bn.includes(t))return{action:"none"};let a=e&&typeof e=="object"&&!Array.isArray(e)?e:null;return a&&Object.prototype.hasOwnProperty.call(a,t)?a[t]:Object.prototype.hasOwnProperty.call(r!=null?r:{},t)?r[t]:mn[t]}function xi(r){return(r==null?void 0:r.action)!=="none"}function xa(r,e){var a,i,n;let t=typeof r.composedPath=="function"?r.composedPath():[r.target];for(let l of t){if(!l||l===e)break;if(l.nodeType!==1)continue;let s=(a=l.tagName)==null?void 0:a.toLowerCase(),o=(i=l.getAttribute)==null?void 0:i.call(l,"role");if((n=l.matches)!=null&&n.call(l,'button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="link"],[role="slider"],[role="switch"],[role="checkbox"],[role="radio"]')||s!=null&&s.startsWith("ha-")&&l.tabIndex>=0||o&&["button","link","slider","switch","checkbox","radio"].includes(o))return!0}return r.defaultPrevented===!0}function wi(r,{resolveAction:e,dispatchAction:t,label:a}={}){if(!r||typeof r.addEventListener!="function"||typeof r.setAttribute!="function"||typeof r.removeAttribute!="function"||typeof e!="function"||typeof t!="function")return()=>{};let i=w=>e(w),n=w=>xi(i(w)),l=n("tap_action");l?(r.setAttribute("role","button"),r.setAttribute("tabindex","0"),a&&r.setAttribute("aria-label",a)):(r.removeAttribute("role"),r.removeAttribute("tabindex"),r.removeAttribute("aria-label"));let s=null,o=null,u=null,d=!1,c=!1,b=null,p=0,h=()=>{o!==null&&clearTimeout(o),o=null},m=()=>{u!==null&&clearTimeout(u),u=null,d=!1},_=()=>{b!==null&&clearTimeout(b),b=null,c=!1},f=()=>{_(),c=!0,b=setTimeout(_,0)},y=w=>{let k=i(w);xi(k)&&t({config:k,action:fn[w]})},v=w=>{w.button!==void 0&&w.button!==0||xa(w,r)||(_(),s={id:w.pointerId,held:!1,startedAt:w.timeStamp},h(),o=setTimeout(()=>{s&&(s.held=!0,m(),y("hold_action"))},yi))},g=w=>{if(!s||s.id!==void 0&&w.pointerId!==s.id)return;let k=s;if(w.timeStamp-k.startedAt>=yi&&!k.held&&(k.held=!0,m(),y("hold_action")),s=null,h(),f(),!(k.held||xa(w,r))){if(n("double_tap_action")){d?(m(),y("double_tap_action")):(d=!0,u=setTimeout(()=>{d=!1,u=null,y("tap_action")},_n));return}y("tap_action")}},x=()=>{s!=null&&s.held&&f(),s=null,h()},S=w=>{!l||w.repeat||xa(w,r)||w.key!=="Enter"&&w.key!==" "||(w.preventDefault(),_(),p=Date.now()+500,y("tap_action"))},M=w=>{if(c){_();return}w.detail!==0||Date.now()<p||xa(w,r)||y("tap_action")};return r.addEventListener("pointerdown",v),r.addEventListener("pointerup",g),r.addEventListener("pointercancel",x),r.addEventListener("lostpointercapture",x),r.addEventListener("keydown",S),r.addEventListener("click",M),()=>{h(),m(),_(),r.removeEventListener("pointerdown",v),r.removeEventListener("pointerup",g),r.removeEventListener("pointercancel",x),r.removeEventListener("lostpointercapture",x),r.removeEventListener("keydown",S),r.removeEventListener("click",M)}}var bn,mn,fn,yi,_n,ki=te(()=>{bn=Object.freeze(["tap_action","hold_action","double_tap_action"]),mn=Object.freeze({tap_action:Object.freeze({action:"more-info"}),hold_action:Object.freeze({action:"none"}),double_tap_action:Object.freeze({action:"none"})}),fn=Object.freeze({tap_action:"tap",hold_action:"hold",double_tap_action:"double_tap"}),yi=500,_n=250});var Mt,Si=te(()=>{zt();Ra();_e();Jt();La();Ha();la();oa();ea();Wt();_a();ur();ki();Mt=class extends HTMLElement{static async getConfigElement(){return Ft("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._actionConfig={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._extrema=new WeakMap,this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._rowActionCleanup=[],this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._rowGeneration+=1,this._clearRowActionHandlers(),window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var a;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._clearRowActionHandlers(),this._rowGeneration+=1;let t=this._config;this._actionConfig=e,this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((a=t==null?void 0:t.entities)!=null?a:[]),this._diagnostics=Qt(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var d,c,b,p;let t=(h,m="")=>{if(Array.isArray(h))return h.map(t);if(h&&typeof h=="object")return Object.fromEntries(Object.keys(h).sort().filter(_=>!["severity","segment_space","label_precision_key"].includes(_)).map(_=>[_,t(h[_],_)]));if(m==="fixed")return Se(null,h);if(/color/i.test(m)&&typeof h=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(h.trim())){let _=h.trim().slice(1).toLowerCase();return`#${_.length===3?_.split("").map(f=>f+f).join(""):_}`}return h},a=h=>{var m;return JSON.stringify(t({entity:h.entity,name:h.name,icon:(m=h.icon)!=null?m:null,layout:h.layout,scale:{direction:h.scale.direction,...Object.fromEntries(["min","max"].map(_=>[_,{...h.scale[_],fixed_explicit:h.scale[_].fixed_explicit!==!1}]))},bar:h.bar,baseline:h.baseline,formatting:h.formatting,target_marker:h.target_marker,peak_marker:h.peak_marker,floor_marker:h.floor_marker,generic_markers:h.generic_markers}))},i=new Set(e),n=new Map,l=new Map(e.map(h=>[h,a(h)]));for(let h of this._config.entities){let m=a(h),_=[...i].find(f=>l.get(f)===m);_&&(n.set(h,_),i.delete(_))}let s=this._config.entities.filter(h=>!n.has(h));for(let h of s){let m=[...i].filter(f=>f.entity===h.entity),_=s.filter(f=>f.entity===h.entity);m.length!==1||_.length!==1||(n.set(h,m[0]),i.delete(m[0]))}let o=new WeakMap,u=new WeakMap;for(let[h,m]of n){let _=this._extrema.get(m),f={};for(let y of["peak","floor"]){let v=m[`${y}_marker`],g=h[`${y}_marker`];_!=null&&_[y]&&(v==null?void 0:v.show)===!0&&(g==null?void 0:g.show)===!0&&JSON.stringify(v.reset)===JSON.stringify(g.reset)&&(f[y]={..._[y]})}(f.peak||f.floor)&&o.set(h,f),((c=(d=m.layout)==null?void 0:d.label)==null?void 0:c.position)==="left"&&((p=(b=h.layout)==null?void 0:b.label)==null?void 0:p.position)==="left"&&this._leftModeResponsiveHistory.has(m)&&u.set(h,this._leftModeResponsiveHistory.get(m))}this._extrema=o,this._leftModeResponsiveHistory=u}_clearRowActionHandlers(){this._rowActionCleanup.forEach(e=>e()),this._rowActionCleanup=[]}_logDiagnostics(){var a;let e=(a=this._diagnostics)!=null?a:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}),e.errors.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}))}normalizeCardConfig(e){return Yt(e)}normalizeEntityConfig(e,t){return Wa(e,t)}normalizeResolvableValue(e,t,a=null){return J(e,t,a)}_looksLikeEntityId(e){return ne(e)}_parsePercentLiteral(e){return fe(e)}_getFiniteNumber(e){return D(e)}normalizeStructuredResolvableValue(e,t=null,a=null,i={}){return ce(e,t,a,i)}normalizeBaselineDirectionConfig(e,t=null){return ge(e,t)}normalizeBaselineConfig(e,t){return Ht(e,t)}inferSegmentEndValues(e,t=null){return ua(e,t)}normalizeSeverityToSegments(e){return Lt(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return ot(e)}normalizeScaleBound(e,t,a,i){return Bt(e,t,a,i)}normalizeScaleConfig(e,t){return Ut(e,t)}_fillStyleToColorMode(e){return Fa(e)}_colorModeToFillStyle(e){return ht(e)}_normalizeBarModeConfig(e=null,t=null){return we(e,t)}_resolveNormalizedBarMode(e,t,a,i){return Pa(e,t,a,i)}_normalizeGradientStops(e){return Aa(e)}normalizeNeedleConfig(e,t=null){return Ia(e,t)}normalizeBarConfig(e,t){return jt(e,t)}normalizeLayoutConfig(e,t){return Et(e,t)}_clampSupportedRowHeight(e){return Va(e)}normalizeFormattingConfig(e,t){return Gt(e,t)}normalizeTargetMarkerConfig(e,t){return Kt(e,t)}normalizePeakMarkerConfig(e,t){return Xt(e,t)}_normalizeOptionalEnabled(e){return ut(e)}set hass(e){let t=this._hass;if(this._hass=e,!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var i,n,l,s,o,u,d;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),a=(l=(n=(i=this._hass)==null?void 0:i.states)==null?void 0:n[t.entity])!=null?l:null;return{...t,icon:t.icon===!1?!1:(u=(o=t.icon)!=null?o:(s=a==null?void 0:a.attributes)==null?void 0:s.icon)!=null?u:this._getDefaultEntityIcon(a,t.entity),name:(d=t.name)!=null?d:null}}_getStateTimestamp(e){var i;let t=(i=e==null?void 0:e.last_updated)!=null?i:e==null?void 0:e.last_changed,a=t instanceof Date?t.getTime():Date.parse(String(t!=null?t:""));return Number.isFinite(a)?a:Date.now()}_updateExtrema(e,t,a){var o,u,d;let i=pt(a,t==null?void 0:t.attribute),n=i.available&&i.attributeFound?D(i.value):null;if(!Number.isFinite(n))return;let l=(o=this._extrema.get(e))!=null?o:{},s=this._getStateTimestamp(a);for(let c of["peak","floor"]){let b=t==null?void 0:t[`${c}_marker`];if((b==null?void 0:b.show)!==!0){delete l[c];continue}l[c]=Vt((u=l[c])!=null?u:null,n,(d=b.reset)!=null?d:{kind:"never"},c==="floor"?"min":"max",s)}l.peak||l.floor?this._extrema.set(e,l):this._extrema.delete(e)}_getDefaultEntityIcon(e,t=""){var l,s,o;let a=String((s=(l=e==null?void 0:e.attributes)==null?void 0:l.device_class)!=null?s:"").trim();if(a){let u={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(u[a])return u[a]}let i=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[i])!=null?o:null}_shouldUpdate(e,t){var a,i,n,l,s,o,u,d,c,b,p;if(!this._config||!this._config.entities)return!0;for(let h of this._config.entities){let m=this._resolve(h),_=[h.entity,(i=(a=m.scale)==null?void 0:a.min)==null?void 0:i.entity,(l=(n=m.scale)==null?void 0:n.max)==null?void 0:l.entity,(o=(s=m.baseline)==null?void 0:s.at)==null?void 0:o.entity,(d=(u=m.target_marker)==null?void 0:u.source)==null?void 0:d.entity,...((c=m.generic_markers)!=null?c:[]).filter(f=>f.accepted).flatMap(f=>{var y,v;return[(y=f.source)==null?void 0:y.entity,(v=f.label)==null?void 0:v.entity]})].filter(Boolean);for(let f of _){let y=(b=e.states[f])!=null?b:null,v=(p=t.states[f])!=null?p:null;if(y!==v)return!0}}return!1}_setStyleIfChanged(e,t,a){return Z(e,t,a)}_setStyleTextIfChanged(e,t){return Me(e,t)}_setTextIfChanged(e,t){var i;if(!e)return!1;let a=t==null?"":String(t);return((i=e.textContent)!=null?i:"")===a?!1:(e.textContent=a,!0)}_setDatasetIfChanged(e,t,a){return oe(e,t,a)}_setClassNameIfChanged(e,t){return sa(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,a;((a=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?a:[]).forEach(i=>{let n=i.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${n}"]`,`.generic-marker[data-marker-id="${n}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var i;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let n=e.dataset.markerId;return(i=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(l=>l.dataset.markerId===n))!=null?i:null}let a=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return a?t.querySelector(a):null}_getGenericMarkerForLabel(e){var i,n;let t=e==null?void 0:e.closest(".row"),a=(i=e==null?void 0:e.dataset)==null?void 0:i.markerId;return!t||!a?null:(n=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(l=>l.dataset.markerId===a))!=null?n:null}_setMarkerHover(e){var a;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((a=this._markerHover)==null?void 0:a.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var i,n,l;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),a=(l=t==null?void 0:t.matches)!=null&&l.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._setMarkerHover(a)}_handleMarkerPointerOut(e){var i,n;if(e.pointerType==="touch")return;let t=(n=(i=e.target)==null?void 0:i.closest)==null?void 0:n.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let a=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;a&&this._clearMarkerHover(a)}_positionMarkerValueLabel(e,t,a){let i=e.querySelector(".bar-track"),n=e.querySelector(t),l=e.querySelector(a);if(!i||!n||!l)return;if(l.style.display==="none"||!n.textContent.trim()){this._setStyleIfChanged(n,"visibility","hidden");return}let s=i.getBoundingClientRect(),o=Math.max(0,Math.floor(s.width-4));this._setStyleIfChanged(n,"maxWidth",`${o}px`);let u=n.getBoundingClientRect(),d=parseFloat(l.style.left);if(!Number.isFinite(d)||s.width<=0||u.width<=0||o<=10){this._setStyleIfChanged(n,"visibility","hidden");return}let c=d/100*s.width,b=u.width/2,p=Math.max(b,Math.min(s.width-b,c));this._setStyleIfChanged(n,"left",`${p}px`),this._setStyleIfChanged(n,"transform","translateX(-50%)"),this._setStyleIfChanged(n,"visibility","visible")}_getEntityNumericValue(e){return ke(this._hass,e)}_getNumericValue(e,t=null){return Se(this._hass,e,t)}_resolvePercentValue(e,t,a){return Ta(e,t,a)}_getNormalizedResolvableNumericValue(e,t=null,a=null){return he(this._hass,e,t,a)}_hexToRgb(e){return $e(e)}_getSeverityInterpolationStops(e,t=0,a=100){return ma(e,t,a)}_getSeverityBandGradientCss(e,t=0,a=100){return ja(e,t,a)}_getSoftBandBlendWidthPct(){return Ea()}_pushGradientColorStop(e,t,a){return be(e,t,a)}_getSoftBandGradientStops(e,t=0,a=100){return gt(e,t,a)}_getSoftBandGradientCss(e,t=0,a=100){return Ga(e,t,a)}_resolveSegmentBoundaryPct(e,t,a){return da(e,t,a)}_getEffectiveFillStyle(e){return wt(e)}_segmentsNeedBoundaryResolution(e){return Ka(e)}_getSegmentsForRendering(e,t=0,a=100){return Ne(e,t,a)}_getColor(e,t,a=0,i=100){return Xa(e,t,a,i)}_buildFullScaleGradientStyle(e){return Ya(e)}_getGradientInterpolationStops(e,t=0,a=100){return Ja(e,t,a)}_rgbToCss(e){return Za(e)}_buildSolidGradientStyle(e){return ca(e)}_getBasePaintGradient(e,t,a=0,i=100){return Qa(e,t,a,i)}_getOverlayGradient(e,t,a){return ha(e,t,a)}_toScalePct(e,t,a){return xt(e,t,a)}_getRevealTransitionDuration(e,t){return ba(e,t)}_resolveBaselinePct(e,t,a){var n,l;if(((n=e.baseline)==null?void 0:n.enabled)===!1)return null;let i=this._getNormalizedResolvableNumericValue((l=e.baseline)==null?void 0:l.at,t,a);return Number.isFinite(i)?this._toScalePct(i,t,a):null}_formatNumericDisplay(e,t=null){return pe(e,t)}_getNormalizedPercent(e,t=null){return Ca(e,t)}_getEndpointSemantics(e){return er(e)}_getRevealCornerRadii(e){return tr(e)}_getAboveTargetOverlayInterval(e=null){return ar(e)}_getAboveTargetLayerGeometry(e=null){return rr(e)}_getFullScalePaintStyle(e,t,a=null,i=null,n=0,l=100){return ir(e,t,a,i,n,l)}_getRevealShapeStyle(e,t){return nr(e,t)}_getStaticLayerRevealStyle(e){return pa(e)}_getFillPaintLayers(e,t,a,i,n=null,l=null,s=0,o=100){return lr(e,t,a,i,n,l,s,o)}_getFillRenderState(e,t,a,i,n=null,l=null,s=0,o=100,u=!1){return sr(e,t,a,i,n,l,s,o,u)}_getNeedleRenderState(e,t,a=0,i=100,n=null){return vi(e,t,a,i,n)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
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
${Pt}
${It('.row[data-bar-animated="false"]')}
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
${At}
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
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==a||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=a,this._applyCompactTier(),a.observe(e),a.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,a){var l,s,o;if(a||!e||!t)return 0;let i=Math.floor((s=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?s:0),n=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(i,8)||!Number.isFinite(n)||n<=0?0:Math.min(n,i*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",a=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let i=["normal","compact","tight","dense","compressed"],n="normal";e<170?n="compressed":e<210?n="dense":e<255?n="tight":e<320&&(n="compact");let l=i.indexOf(n),s=Number.isFinite(a)?a<=44&&e>=205?2:a<=72&&e>=185?1:0:0;return i[Math.max(0,l-s)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var i,n;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(i=this.shadowRoot)==null?void 0:i.querySelector("ha-card"),a=(n=t==null?void 0:t.getBoundingClientRect().width)!=null?n:0;if(!this._isReliableWidth(a)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let a=e.getBoundingClientRect().width;if(!this._isReliableWidth(a)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(a,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let a=e.querySelector(".label-left-text"),i=((a==null?void 0:a.textContent)||"").trim(),n=a?this._measureTextWidthWithStyles(a,i)||a.scrollWidth:Number.POSITIVE_INFINITY,l=this._classifyLeftDensity(t,e.dataset.leftDensity,n);e.dataset.leftDensity=l})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var S,M,w,k,F,$;let t=e.closest(".bar-track"),a=e.closest(".main-line"),i=e.querySelector(".inside-name"),n=e.querySelector(".inside-value");if(!t||!i||!n)return;let l=this._decodeDataAttr(n.dataset.display||n.textContent||""),s=this._decodeDataAttr(n.dataset.unit||"");n.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(n,l,s,!1),u=this._measureInsideValueMarkupWidth(n,l,s,!0),d=(M=(S=a==null?void 0:a.getBoundingClientRect)==null?void 0:S.call(a).width)!=null?M:0,c=this._isReliableWidth(d)?this._classifyRowDensity(d,(w=a==null?void 0:a.dataset)==null?void 0:w.rowDensity):((k=a==null?void 0:a.dataset)==null?void 0:k.rowDensity)||"normal",b=($=(F=a==null?void 0:a.querySelector)==null?void 0:F.call(a,".icon-wrap"))!=null?$:null,p=b?this._getLeftModeIconWidth(b,a)+this._getLeftModeGap(a):0,h=this._getLeftModeBarMinWidth(a),m=this._isReliableWidth(d)?Math.max(h,d-p):t.getBoundingClientRect().width,_=this._isReliableWidth(d)?Math.max(h,d):m+p,f=(i.textContent||"").trim(),y=this._measureTextWidthWithStyles(i,f)||i.scrollWidth,v=R=>{let A=c==="compressed"?"compressed":this._classifyInsideDensity(R,o);e.dataset.insideDensity=A,e.dataset.valueFit="normal",n.dataset.valueFit="normal";let T=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),P=Math.max(0,R-T),V=!!s&&o>P,W=V?u:o,B="normal";W>P&&(B="compact",e.dataset.valueFit=B,n.dataset.valueFit=B,P=Math.max(0,R-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),W=this._measureInsideValueMarkupWidth(n,l,s,!0));let O=W>P,G=O?0:this._getNumericStyleValue(e,"gap",0),q=Math.max(0,Math.min(P*(A==="compact"?.56:A==="tight"?.48:.6),P-(O?0:Math.ceil(W))-G)),K=A==="dense"||A==="compressed";if(f&&y>0){let E=this._getInsideUsefulNameWidth(i,f,y),I=this._measureVisibleLabelCharacters(i,f,q);K=q<E||y>q+1&&I<Math.min(4,f.length)}return{density:A,valueFit:B,hideUnit:V,hideValue:O,hideName:K,rank:O?3:B==="compact"?2:V?1:0}},g=c==="dense"||c==="compressed",x=v(g?_:m);if(b&&!g){let R=v(_);(R.rank<x.rank||R.rank===x.rank&&x.hideName&&!R.hideName)&&(g=!0,x=R)}e.dataset.insideDensity=x.density,e.dataset.valueFit=x.valueFit,e.dataset.hideName=x.hideName?"true":"false",n.dataset.valueFit=x.valueFit,n.dataset.hideUnit=x.hideUnit?"true":"false",n.dataset.hideValue=x.hideValue?"true":"false",a&&(a.dataset.hideInsideIcon=g?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var v,g,x,S,M,w,k,F,$,R,A,T,P,V,W;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let a=e.classList.contains("hero-line"),i=a?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,n="normal";if(i<90?n="xs":i<110?n="compressed":i<150?n="dense":i<210?n="tight":i<280&&(n="compact"),a){e.dataset.heroDensity=n,t.dataset.hideName=n==="dense"||n==="compressed"||n==="xs"?"true":"false",e.dataset.hideHeroIcon=n==="compressed"||n==="xs"?"true":"false";return}e.dataset.aboveDensity=n;let l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((v=s==null?void 0:s.dataset)==null?void 0:v.display)||""),u=this._decodeDataAttr(((g=s==null?void 0:s.dataset)==null?void 0:g.unit)||""),d=(x=e.closest)==null?void 0:x.call(e,".row"),c=(S=d==null?void 0:d.querySelector)==null?void 0:S.call(d,".main-line.above-mode"),b=((M=c==null?void 0:c.dataset)==null?void 0:M.rowDensity)||"normal",p=(k=(w=c==null?void 0:c.querySelector)==null?void 0:w.call(c,".icon-wrap"))!=null?k:null,h=(F=p==null?void 0:p.getBoundingClientRect)==null?void 0:F.call(p),m=p&&typeof getComputedStyle=="function"?getComputedStyle(p):null,_=!!p&&b!=="compressed"&&(m==null?void 0:m.display)!=="none"&&(($=h==null?void 0:h.width)!=null?$:0)>0&&((R=h==null?void 0:h.height)!=null?R:0)>0,f=n==="dense"||n==="compressed",y=!_;if(l&&s&&o){let B=(A=e.closest)==null?void 0:A.call(e,".row-stack"),O=(W=(V=(T=B==null?void 0:B.getBoundingClientRect)==null?void 0:T.call(B).width)!=null?V:(P=e.getBoundingClientRect)==null?void 0:P.call(e).width)!=null?W:i,G=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,L=_?h.width:0,q=G?this._getNumericStyleValue(e,"gap",0):0,K=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),E=Math.ceil(this._measureValueMarkupWidth(s,o,u,!1)+2),I=Math.ceil(this._measureValueMarkupWidth(s,o,u,!0)+2),U=(l.textContent||"").trim(),z=_&&L>0?L+q:0,H=this._measureTextWidthWithStyles(l,U)||l.scrollWidth||0,X=Math.max(0,O-z-K),j=(ie,le=X)=>{let se=Math.max(0,le-ie),me=this._measureVisibleLabelCharacters(l,U,se);return!this._shouldHideLeftLabel(U,H,se,me)},ae=Math.max(0,O),ee=!1;E<=X&&j(E)?(f=!1,y=!_):E<=ae?(f=!j(E,O-K),y=!0):I<=X&&j(I)?(f=!1,ee=!!u,y=!_):j(I,O-K)?(f=!1,y=!0,ee=!!u):(f=!0,y=!0,ee=!!u&&E>ae),s.dataset.hideUnit=ee?"true":"false"}else s&&(s.dataset.hideUnit="false");t.dataset.hideName=f?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var s,o,u,d,c,b,p,h,m;let t=(s=e==null?void 0:e.closest)==null?void 0:s.call(e,".row"),a=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),i=(u=a==null?void 0:a.querySelector)==null?void 0:u.call(a,".main-line.hero-mode"),n=(d=i==null?void 0:i.querySelector)==null?void 0:d.call(i,".bar-wrap"),l=[(c=t==null?void 0:t.getBoundingClientRect)==null?void 0:c.call(t).width,(b=a==null?void 0:a.getBoundingClientRect)==null?void 0:b.call(a).width,(p=i==null?void 0:i.getBoundingClientRect)==null?void 0:p.call(i).width,(h=n==null?void 0:n.getBoundingClientRect)==null?void 0:h.call(n).width,(m=e==null?void 0:e.getBoundingClientRect)==null?void 0:m.call(e).width];for(let _ of l)if(this._isReliableWidth(_,8))return _;return 0}_measureHeroValueWidth(e,t,a="normal",i=!1){var p,h,m,_,f,y,v,g,x,S,M,w,k,F;let n=(p=this.shadowRoot)==null?void 0:p.querySelector(".measure-layer");if(!n||!e||!t)return 0;let l=this._decodeDataAttr(t.dataset.display||t.textContent||""),s=this._decodeDataAttr(t.dataset.unit||"");if(!l)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=a,o.dataset.hideHeroUnit=i?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((m=(h=e.style)==null?void 0:h.getPropertyValue)==null?void 0:m.call(h,"--sbcp-hero-base-size"))||null);let u=document.createElement("span");u.className="hero-value",u.dataset.display=t.dataset.display||"",u.dataset.unit=t.dataset.unit||"",u.innerHTML=this._formatRightValueMarkup(l,s,i),u.style.display="inline-flex",u.style.flex="0 0 auto",u.style.width="auto",u.style.minWidth="0",u.style.maxWidth="none",u.style.justifyContent="flex-start",u.style.justifySelf="start",u.style.overflow="visible";let d=u.querySelector(".value-right-text");d&&(d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.overflow="visible");let c=u.querySelector(".value-right-number");c&&(c.style.flex="0 0 auto",c.style.minWidth="0",c.style.overflow="visible",c.style.textOverflow="clip");let b=u.querySelector(".unit-group");return b&&(b.style.flex="0 0 auto",b.style.minWidth="0",b.style.overflow="visible"),o.appendChild(u),n.replaceChildren(o),Math.max(Math.ceil((f=(_=u.getBoundingClientRect)==null?void 0:_.call(u).width)!=null?f:0),Math.ceil(u.scrollWidth||0),Math.ceil((g=(v=(y=d==null?void 0:d.getBoundingClientRect)==null?void 0:y.call(d).width)!=null?v:d==null?void 0:d.scrollWidth)!=null?g:0),Math.ceil((M=(S=(x=c==null?void 0:c.getBoundingClientRect)==null?void 0:x.call(c).width)!=null?S:c==null?void 0:c.scrollWidth)!=null?M:0),Math.ceil((F=(k=(w=b==null?void 0:b.getBoundingClientRect)==null?void 0:w.call(b).width)!=null?k:b==null?void 0:b.scrollWidth)!=null?F:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var p,h;let t=e.querySelector(".hero-header"),a=e.querySelector(".hero-label"),i=e.querySelector(".hero-value"),n=e.querySelector(".unit-group");if(!t||!i)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let l=Math.floor((h=(p=t.getBoundingClientRect)==null?void 0:p.call(t).width)!=null?h:0);if(!this._isReliableWidth(l,8)){this._schedulePostLayoutDensityPass();return}let s=!!n&&n.textContent.trim().length>0,o=t.dataset.hideName==="true",u=!o&&a?this._getNumericStyleValue(t,"column-gap",0):0,d=(m="normal",_=!1)=>this._measureHeroValueWidth(e,i,m,_),c=Math.max(0,l-u-4),b=Math.max(0,l-4);if(!this._isReliableWidth(b,8)){e.dataset.hideHeroUnit=s?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(d("normal",!1)<=c)&&!(!o&&a&&(t.dataset.priorityHideName="true",d("normal",!1)<=b))){if(s){for(let m of["tight","minimum"]){let _=d(m,!1);if(_<=b){if(e.dataset.heroValueFit=m,!o&&a){let f=(a.textContent||"").trim(),y=this._measureTextWidthWithStyles(a,f),v=Math.max(0,c-_);this._shouldHideLeftLabel(f,y,v,this._measureVisibleLabelCharacters(a,f,v))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",d("normal",!0)<=b)return}e.dataset.heroValueFit="tight",!(d("tight",s)<=b)&&(e.dataset.heroValueFit="minimum",!(d("minimum",s)<=b)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,a,i){var s;let n=(s=this.shadowRoot)==null?void 0:s.querySelector(".measure-layer");if(!n||!e)return 0;let l=e.cloneNode(!1);return l.removeAttribute("data-hide-unit"),l.style.removeProperty("--sbcp-value-extra-width"),l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.innerHTML=this._formatRightValueMarkup(t,a,i),n.replaceChildren(l),l.scrollWidth}_measureInsideValueMarkupWidth(e,t,a,i=!1){var o;let n=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!n||!e)return(e==null?void 0:e.scrollWidth)||0;let l=e.cloneNode(!1);l.style.width="auto",l.style.minWidth="0",l.style.maxWidth="none",l.style.flex="0 0 auto",l.style.overflow="visible",l.style.textOverflow="clip",l.style.whiteSpace="nowrap",l.innerHTML=this._formatInsideValueMarkup(t,a,i),l.removeAttribute("data-hide-value");let s=document.createElement("div");return s.className="bar-inner-label",s.style.cssText="position:static;display:block;padding:0",s.appendChild(l),n.replaceChildren(s),l.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var n;let a=(n=this.shadowRoot)==null?void 0:n.querySelector(".measure-layer");if(!a||!e)return 0;let i=e.cloneNode(!1);return i.textContent=t,i.style.width="auto",i.style.minWidth="0",i.style.maxWidth="none",i.style.flex="0 0 auto",i.style.overflow="visible",i.style.textOverflow="clip",i.style.whiteSpace="nowrap",a.replaceChildren(i),i.scrollWidth}_measureVisibleLabelCharacters(e,t,a){if(!e||!t||!Number.isFinite(a)||a<=0)return 0;let i=this._measureTextWidthWithStyles(e,"..."),n=Math.max(0,a-i);if(n<=0)return 0;let l=0,s=t.length;for(;l<s;){let o=Math.ceil((l+s)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=n?l=o:s=o-1}return l}_shouldHideLeftLabel(e,t,a,i){return!e||!Number.isFinite(t)||!Number.isFinite(a)?!1:t>a+1&&i<5}_getInsideUsefulNameWidth(e,t,a=NaN){if(!t)return 0;let i=Number.isFinite(a)&&a>0?a:this._measureTextWidthWithStyles(e,t),n=t.slice(0,Math.min(5,t.length)),l=this._measureTextWidthWithStyles(e,n)+this._measureTextWidthWithStyles(e,"..."),s=Math.max(36,Math.min(44,l||0));return Math.min(i||s,s)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var c,b,p,h,m;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let i=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((p=(b=(c=e==null?void 0:e.ownerDocument)==null?void 0:c.defaultView)==null?void 0:b.getComputedStyle)==null?void 0:p.bind(e.ownerDocument.defaultView));if(!i)return;let n=i(e),l=parseFloat(n.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,s=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2),o=e.closest(".main-line"),u=s;if(o!=null&&o.classList.contains("off-mode")){let _=o.querySelector(".bar-wrap"),f=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(i(o).gap)||0,v=(m=(h=o.getBoundingClientRect)==null?void 0:h.call(o).width)!=null?m:0,g=parseFloat(i(_).minWidth)||0,x=f&&i(f).display!=="none",S=x?this._getLeftModeIconWidth(f,o):0,M=Math.max(0,v-g-y),w=M-(x?S+y:0),k=Math.ceil(this._measureValueMarkupWidth(e,t,a,!0)+2),F=x&&(s>w&&s<=M||k>w&&k<=M);o.dataset.hideOffIcon=F?"true":"false";let $=F?M:w;if($>0){let R=s<=$?s:k;u=Math.min(R,$)}}let d=Math.max(0,u-l);e.style.setProperty("--sbcp-value-extra-width",`${d}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var l,s,o,u;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!((l=e.classList)==null?void 0:l.contains("above-bar-label-value"))&&t){let d=(u=(o=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?o:e.clientWidth)!=null?u:0,c=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);i=a&&d>0?c>d:!1,e.dataset.hideUnit=i?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,a,i)&&(e.innerHTML=this._formatRightValueMarkup(t,a,i))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let l=this._formatInsideValueMarkup(t,a,i);e.innerHTML!==l&&(e.innerHTML=l)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,a=0){if(!e)return a;try{let i=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(i)?i:a}catch(i){return a}}_getLeftModeGap(e){var i;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.rowDensity)||"normal";return a==="tight"?7:a==="dense"||a==="compressed"?6:8}_getLeftModeBarMinWidth(e){var i;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let a=((i=e==null?void 0:e.dataset)==null?void 0:i.leftDensity)||"normal";return a==="compact"?52:a==="tight"?48:a==="dense"?44:a==="compressed"?40:56}_getLeftModeIconWidth(e,t){var l,s;let a=(l=e==null?void 0:e.getBoundingClientRect)==null?void 0:l.call(e).width;if(this._isReliableWidth(a,1))return a;let i=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(i))return i;let n=((s=t==null?void 0:t.dataset)==null?void 0:s.leftDensity)||"normal";return n==="compact"?26:n==="tight"?24:n==="dense"?23:n==="compressed"?22:28}_getReservedInlineValueWidth(e){var u,d,c;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),a=this._decodeDataAttr(e.dataset.unit||""),i=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),n=parseFloat(((d=(u=e.style)==null?void 0:u.getPropertyValue)==null?void 0:d.call(u,"--sbcp-value-extra-width"))||((c=e.style)==null?void 0:c["--sbcp-value-extra-width"])||"0"),l=Number.isFinite(n)?n:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),s=Math.max(0,i+l);if(!t)return s;let o=Math.ceil(this._measureValueMarkupWidth(e,t,a,!1)+2);return Math.max(s,o)}_getStableLeftLabelMetrics(e,t=null){var h,m,_,f,y,v,g,x,S,M;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".label-left-text");if(!a||!i||!n)return null;let l=(m=t!=null?t:(h=a.getBoundingClientRect)==null?void 0:h.call(a).width)!=null?m:0,s=(n.textContent||"").trim(),o=this._measureTextWidthWithStyles(n,s)||n.scrollWidth||0,u=((_=a.dataset)==null?void 0:_.leftDensity)||"normal",d={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},c=(y=(f=this._config)==null?void 0:f.entities)==null?void 0:y.find(w=>{var k;return w.entity===((k=e.dataset)==null?void 0:k.entity)}),b=c&&(S=(x=(g=(v=this._resolve(c))==null?void 0:v.layout)==null?void 0:g.label)==null?void 0:x.width)!=null?S:100,p=l>0?Math.min(b,l*((M=d[u])!=null?M:d.normal)):Math.min(o,b);return{text:s,naturalWidth:o,maximumWidth:p,labelWidth:p,labelText:n}}_estimateLeftModeWidthBudget(e){var x,S,M;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let a=(S=(x=t.getBoundingClientRect)==null?void 0:x.call(t).width)!=null?S:0;if(!this._isReliableWidth(a))return null;let i=e.querySelector(".label-left"),n=e.querySelector(".icon-wrap"),l=e.querySelector(".value-right"),s=this._getStableLeftLabelMetrics(e,a),o=(M=s==null?void 0:s.labelWidth)!=null?M:0,u=n?this._getLeftModeIconWidth(n,t):0,d=this._getReservedInlineValueWidth(l),c=this._getLeftModeGap(t),b=this._getLeftModeBarMinWidth(t),p=!!i,h=!!n,m=h?2:1,_=Math.max(0,a-(h?u:0)-b-m*c),f=Math.min(o,_),y=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,f,this._measureVisibleLabelCharacters(s.labelText,s.text,f)),v=Math.min(o,Math.max(0,a-b-c)),g=!s||this._shouldHideLeftLabel(s.text,s.naturalWidth,v,this._measureVisibleLabelCharacters(s.labelText,s.text,v));return{rowWidth:a,gap:c,barMinWidth:b,labelSacrificialWithoutIcon:g,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(u,0)?u:0,valueWidth:this._isReliableWidth(d,0)?d:0,baseLabelVisible:p,labelSacrificial:y,hasIcon:h,mainLine:t,iconWrap:n,valueEl:l,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,a=null){let i=a||this._estimateLeftModeWidthBudget(e);if(!i)return null;let n=i.baseLabelVisible&&!t.hideLabel,l=i.hasIcon&&!t.hideIcon,s=!t.topValue,o=1+(l?1:0)+(n?1:0)+(s?1:0),u=Math.max(0,o-1),d=(l?i.iconWidth:0)+(n?i.labelWidth:0)+(s?i.valueWidth:0)+u*i.gap,c=Math.max(0,i.rowWidth-d),b=c>=i.barMinWidth,p=b?c:i.barMinWidth;return{rowWidth:i.rowWidth,barWidth:p,share:p/i.rowWidth,showLabel:n,showIcon:l,showInlineValue:s,reservedWidth:d,gapCount:u,fits:b}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,a){let i=null;for(let n of t){let l=this._predictLeftModeBarShareForState(e,n,a);l&&(i={...n,predicted:l})}return i}_chooseLeftModeResponsiveState(e,t=!0){var c,b,p,h;let a=this._estimateLeftModeWidthBudget(e);if(!a)return null;let i=this._getMinimumBarShare(),n=this._getLeftModeCandidateStates(a),l=(b=this._config.entities)==null?void 0:b[Number((c=e==null?void 0:e.dataset)==null?void 0:c.rowIndex)],s=l&&this._leftModeResponsiveHistory.has(l)?this._leftModeResponsiveHistory.get(l):((h=(p=a.rowStack)==null?void 0:p.dataset)==null?void 0:h.forceTopValue)==="true",o=n.filter(m=>m.topValue),u=this._getTopValueEnableShare(),d=this._getTopValueDisableShare();for(let m of n){let _=m.topValue||t?i:s?d:u,f=this._predictLeftModeBarShareForState(e,m,a);if(f!=null&&f.fits&&f.share>=_)return{...m,predicted:f}}return this._chooseFallbackPredictedLeftModeState(e,o,a)}_applyLeftModeResponsiveState(e,t){var s,o;let a=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".row-stack"),n=e==null?void 0:e.querySelector(".label-left");if(!a||!i)return;let l=(o=this._config.entities)==null?void 0:o[Number((s=e==null?void 0:e.dataset)==null?void 0:s.rowIndex)];l&&this._leftModeResponsiveHistory.set(l,(t==null?void 0:t.topValue)===!0),delete i.dataset.forceTopValue,delete a.dataset.hideLeftIcon,n&&delete n.dataset.priorityHidden,t!=null&&t.hideLabel&&n&&(n.dataset.priorityHidden="true"),t!=null&&t.topValue&&(i.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(a.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".bar-track");if(!t||!a)return null;let i=t.getBoundingClientRect().width,n=a.getBoundingClientRect().width;return!this._isReliableWidth(i)||!this._isReliableWidth(n,1)?null:{rowWidth:i,barWidth:n,share:n/i,mainLine:t,track:a}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".row-stack"),i=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".above-bar-label"),l=e==null?void 0:e.querySelector(".bar-inner-label"),s=e==null?void 0:e.querySelector(".above-line");a&&delete a.dataset.forceTopValue,i&&delete i.dataset.priorityHidden,n&&delete n.dataset.priorityHideName,l&&delete l.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let a=e.querySelector(".label-left");a&&(a.dataset.priorityHidden="true");return}if(t==="above"){let a=e.querySelector(".above-bar-label");a&&(a.dataset.priorityHideName="true");return}if(t==="inside"){let a=e.querySelector(".bar-inner-label");a&&(a.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let a=e.querySelector(".row-stack");a&&(a.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let a=e.querySelector(".main-line");if(a){if(t==="left"){a.dataset.hideLeftIcon="true";return}if(t==="above"){a.dataset.hideAboveIcon="true";let i=e.querySelector(".above-line");i&&(i.dataset.hideAboveIcon="true");return}t==="inside"&&(a.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,a){var n,l,s,o,u,d,c,b,p,h;let i=(o=(s=a==null?void 0:a.rowWidth)!=null?s:(l=(n=e==null?void 0:e.querySelector(".main-line"))==null?void 0:n.getBoundingClientRect)==null?void 0:l.call(n).width)!=null?o:0;if(!this._isReliableWidth(i))return null;if(t==="left"){let m=e.querySelector(".label-left"),_=e.querySelector(".label-left-text");if(!m||!_)return null;let f=(_.textContent||"").trim(),y=_.clientWidth,v=_.scrollWidth,g=this._measureVisibleLabelCharacters(_,f,y),x=(d=(u=m.getBoundingClientRect)==null?void 0:u.call(m).width)!=null?d:y;return{text:f,visibleWidth:y,fullWidth:v,visibleChars:g,labelWidth:x,rowWidth:i}}if(t==="above"){let m=e.querySelector(".above-bar-label-name");if(!m)return null;let _=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,v=this._measureVisibleLabelCharacters(m,_,f),g=(b=(c=m.getBoundingClientRect)==null?void 0:c.call(m).width)!=null?b:f;return{text:_,visibleWidth:f,fullWidth:y,visibleChars:v,labelWidth:g,rowWidth:i}}if(t==="inside"){let m=e.querySelector(".inside-name");if(!m)return null;let _=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,v=this._measureVisibleLabelCharacters(m,_,f),g=(h=(p=m.getBoundingClientRect)==null?void 0:p.call(m).width)!=null?h:f;return{text:_,visibleWidth:f,fullWidth:y,visibleChars:v,labelWidth:g,rowWidth:i}}return null}_isLabelWorthSacrificing(e,t,a){let i=this._getLabelSacrificeMetrics(e,t,a);return!i||!i.text?!1:this._shouldHideLeftLabel(i.text,i.fullWidth,i.visibleWidth,i.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let a=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),i=this._getMinimumBarShare();a.forEach(n=>{let l=n.querySelector(".main-line");if(!l)return;let s=l.classList.contains("left-mode")?"left":l.classList.contains("above-mode")?"above":l.classList.contains("inside-mode")?"inside":"other";if(s==="other")return;if(s==="left"){let u=!t||t.get(l)===l.getBoundingClientRect().width,d=this._chooseLeftModeResponsiveState(n,u);d&&this._applyLeftModeResponsiveState(n,d),u||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(n);let o=this._getMeasuredBarShare(n);!o||o.share>=i||this._isLabelWorthSacrificing(n,s,o)&&(this._hideMinimumBarShareLabel(n,s),o=this._getMeasuredBarShare(n),!o||o.share>=i)||(this._forceMinimumBarShareTopValue(n,s),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(n),!(!o||o.share>=i)&&this._hideMinimumBarShareIcon(n,s))})}_shouldUseTopValueRow(e){var t,a,i;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((i=(a=e.closest)==null?void 0:a.call(e,".row-stack"))==null?void 0:i.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,a){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(a)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),a=e.querySelector(".row-stack");if(!t)return;let i=parseFloat(e.dataset.baseHeight||"38")||38,n=e.dataset.heightExplicit==="true",l=this._getEffectiveRowHeight(i,n,t);e.style.setProperty("--sbcp-row-height",`${l}px`),a&&a.style.setProperty("--sbcp-row-height",`${l}px`),t.style.height=`${l}px`;let s=t.querySelector(".label-left");s&&(s.style.height=`${l}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${l}px`,o.style.minHeight=`${l}px`);let u=t.querySelector(".bar-track");u&&(u.style.height=`${l}px`);let d=t.querySelector(".value-right");d&&(d.style.height=`${l}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var c,b,p,h,m;let t=e.closest(".row-stack"),a=e.querySelector(".value-right"),i=t==null?void 0:t.querySelector(".top-right-value");if(!t||!a||!i)return;let n=this._shouldUseTopValueRow(e);t.dataset.topValue=n?"true":"false",i.dataset.active=n?"true":"false";let l=this._decodeDataAttr(a.dataset.display||""),s=this._decodeDataAttr(a.dataset.unit||"");i.dataset.display=a.dataset.display||"",i.dataset.unit=a.dataset.unit||"",i.dataset.hideUnit="false";let o=(m=(h=(p=(c=t.getBoundingClientRect)==null?void 0:c.call(t).width)!=null?p:(b=i.getBoundingClientRect)==null?void 0:b.call(i).width)!=null?h:i.clientWidth)!=null?m:0,u=l?Math.ceil(this._measureValueMarkupWidth(i,l,s,!1)+2):0,d=!!s&&o>0&&u>o;i.dataset.hideUnit=d?"true":"false",i.innerHTML=this._formatRightValueMarkup(l,s,d)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var s;let t=e.querySelector(".label-left"),a=e.querySelector(".label-left-text");if(!t||!a)return;let i=((s=e.closest)==null?void 0:s.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?a:null},n=this._getStableLeftLabelMetrics(i);if(!n)return;let l=this._measureVisibleLabelCharacters(n.labelText,n.text,n.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(n.text,n.naturalWidth,n.labelWidth,l)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var i;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let a=new Map([...((i=this.shadowRoot)==null?void 0:i.querySelectorAll(".main-line.left-mode"))||[]].map(n=>[n,n.getBoundingClientRect().width]));requestAnimationFrame(()=>{var l;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,a),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((l=this.shadowRoot)==null?void 0:l.querySelectorAll(".row[data-entity]"))||[]).forEach(s=>{this._positionTargetLabel(s),this._positionMarkerValueLabel(s,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(s,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(s)})})})}_isTightUnit(e){return qa(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(a){return t}}_parseColorToRgb(e){return fa(e)}_rgbToHsl({r:e,g:t,b:a}){return or({r:e,g:t,b:a})}_getMarkerContrastColor(e){return kt(e)}_getEffectiveMarkerColor(e){return ye(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return Re(e)}_formatDisplayWithUnit(e,t){return Oa(e,t)}_formatRightValueMarkup(e,t,a=!1){let i=C(e);if(!t||a)return`<span class="value-right-text"><span class="value-right-number">${i}</span></span>`;let n=String(t),l=C(n);return`<span class="${this._isTightUnit(n)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${i}</span><span class="unit-group"><span class="unit">${l}</span></span></span>`}_formatAboveValueMarkup(e,t,a=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${a?"true":"false"}">${this._formatRightValueMarkup(e,t,a)}</span>`}_formatInsideValueMarkup(e,t,a=!1){let i=C(e);if(!t||a)return`<span class="inside-value-text"><span class="inside-number">${i}</span></span>`;let n=String(t),l=C(n);return`<span class="inside-value-text ${this._isTightUnit(n)?"tight-unit":"has-unit"}"><span class="inside-number">${i}</span><span class="inside-unit">${l}</span></span>`}_getRowMarkerModels(e,t,a,i,n,l,s,o){if(e!=null&&e.markers)return e.markers.map(b=>{var p,h;return b.type==="target"?{...b,position:b.position,visible:n!=null,color:o||b.color,label:(p=b.label)!=null?p:l===null?null:{text:l}}:b.type==="floor"||b.type!=="peak"?b:{...b,position:b.position,visible:a!=null&&t.peak_marker.show===!0,color:s||b.color,label:(h=b.label)!=null?h:i===null?null:{text:i}}});let u=na({entityConfig:t,targetPosition:n,targetPresentation:l===null?null:{text:l},targetVisible:Number.isFinite(n),peakPosition:a,peakPresentation:i===null?null:{number:i},peakVisible:Number.isFinite(a)}),d=this._getMarkerModel(u,"target"),c=this._getMarkerModel(u,"peak");return d&&o&&(d.color=o),c&&s&&(c.color=s),u}_getMarkerModel(e,t){var a;return(a=e.find(i=>i.id===t||i.type===t))!=null?a:null}_renderMarker(e){return Fe(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),ze(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let a=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",a),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(a))}_buildRowViewModel(e,t,a){var n;let i=yt({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:a,extrema:(n=this._extrema.get(e))!=null?n:null,previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:i.min,max:i.max}),i}_buildRow(e,t,a,i,n,l,s,o,u,d,c,b,p,h=(_=>(_=(m=>(m=this._config.entities)==null?void 0:m.indexOf(e))())!=null?_:-1)()){var Pe,Ae,Ie,Ve,We,Te,De,Le,Be,qe,Oe,He,Ue,je,Ee,Ge,Ke,Xe,Ye,Je,Ze,Qe,Ce,et,tt,at;let f=this._resolve(e),y=(Ie=(Ae=(Pe=this._hass)==null?void 0:Pe.states)==null?void 0:Ae[e.entity])!=null?Ie:null;y&&this._updateExtrema(e,f,y);let v=y?this._buildRowViewModel(e,f,y):null,g=f.layout,x=f.bar,S=Number.isFinite(b)?b:0,M=Number.isFinite(p)?p:100,w=(Ve=v==null?void 0:v.baselinePercent)!=null?Ve:this._resolveBaselinePct(f,S,M),k=g.label.position,F=(Te=(We=v==null?void 0:v.attributes)==null?void 0:We.baseHeight)!=null?Te:g.height,$=(qe=(Be=(De=v==null?void 0:v.name)!=null?De:f.name)!=null?Be:(Le=y==null?void 0:y.attributes)==null?void 0:Le.friendly_name)!=null?qe:e.entity,R=C((Oe=v==null?void 0:v.entityId)!=null?Oe:e.entity),A=C($),T=this._getRowMarkerModels(v,f,l,s,o,u,d,c),P=this._getMarkerModel(T,"target"),V=this._getMarkerModel(T,"peak"),W=this._getMarkerModel(T,"floor"),B=T.filter(Q=>Q.type==="generic"),O=(He=v==null?void 0:v.markerLaneOccupancy)!=null?He:ra(f),G=(Ue=v==null?void 0:v.markerLabelLaneOccupancy)!=null?Ue:ia(f),L=(je=v==null?void 0:v.numericValue)!=null?je:this._getFiniteNumber(t),q=(Ee=v==null?void 0:v.needle)!=null?Ee:this._getNeedleRenderState(L,f,S,M,w),K=St({percent:i,min:S,max:M,targetPercent:o,baselinePercent:w,needle:q,markers:T},f,{height:"var(--sbcp-row-height)",color:n}),E=P!=null&&P.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite(P.position)?P.position:0}%;visibility:${P.visible&&((Ge=P.label)!=null&&Ge.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(P)}">
        ${(Ke=P.label)!=null&&Ke.text?C(P.label.text):""}
      </div>`:"",I=V!=null&&V.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(V.position)?V.position:0}%;visibility:${V.visible&&((Xe=V.label)!=null&&Xe.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(V)}">
        ${V.visible&&((Ye=V.label)!=null&&Ye.text)?C(V.label.text):""}
      </div>`:"",U=W!=null&&W.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(W.position)?W.position:0}%;visibility:${W.visible&&((Je=W.label)!=null&&Je.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(W)}">
        ${W.visible&&((Ze=W.label)!=null&&Ze.text)?C(W.label.text):""}
      </div>`:"",z=B.filter(Q=>Q.labelVisible).map(Q=>{var rt,it;return`
      <div class="generic-value-label" data-marker-id="${C(Q.id)}" data-lane="${Q.lane}" data-show-marker="${Q.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(Q.position)?Q.position:0}%;visibility:${Q.visible&&((rt=Q.label)!=null&&rt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(Q)}">
        ${Q.visible&&((it=Q.label)!=null&&it.text)?C(Q.label.text):""}
      </div>`}).join(""),H=k==="above"?`
      <div class="above-line">
        ${f.icon&&f.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${A}</span>
          ${this._formatAboveValueMarkup(t,a,!1)}
        </div>
      </div>`:"",X=(Qe=g.hero.size)!=null?Qe:"small",j=g.hero.value_size,ae=k==="hero"?`
      <div class="hero-line" data-hero-size="${X}"${Number.isFinite(j)?` style="--sbcp-hero-base-size:${j}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${A}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}">${this._formatRightValueMarkup(t,a,!1)}</span>
        </div>
      </div>`:"",ee=k==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${A}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,a,!1)}</span>
      </div>`:"",ie=k==="left"?`<div class="label-left" style="flex:0 1 min(${g.label.width}px, var(--sbcp-left-label-share));max-width:min(${g.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${A}</span></div>`:"",le=k!=="inside"&&k!=="above"&&k!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",se=k==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(a)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,a,!1)}</div>`:"",me=f.icon&&f.icon!==!1?C(f.icon):"",$t=me&&k!=="hero"?`<div class="icon-wrap"><ha-icon icon="${me}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${h}" data-entity="${R}" data-base-height="${F}" data-height-explicit="${((et=(Ce=v==null?void 0:v.attributes)==null?void 0:Ce.heightExplicit)!=null?et:g.height_explicit)?"true":"false"}" data-bar-animated="${((at=(tt=v==null?void 0:v.attributes)==null?void 0:tt.barAnimated)!=null?at:x.animated)?"true":"false"}" data-marker-label-lane-above="${G.above?"true":"false"}" data-marker-label-lane-below="${G.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${F}px;">
          ${H}
          ${ae}
          ${se}
          <div class="main-line ${k}-mode" data-marker-lane-above="${O.above?"true":"false"}" data-marker-lane-below="${O.below?"true":"false"}" style="height:${F}px;">
            ${$t}
            ${ie}
            <div class="bar-wrap">
              ${ya(K,{insideContent:ee})}
              ${I}
              ${E}
              ${U}
              ${z}
            </div>
            ${le}
          </div>
        </div>
      </div>`}_patchRow(e,t,a,i=null){var P,V,W,B,O,G,L,q,K,E;if(!e||!a)return;let n=this._resolve(t);this._updateExtrema(t,n,a);let l=this._rowScales.get(t),s=this._buildRowViewModel(t,n,a),o=s.min,u=s.max,d=s.percent,c=this._getColor(d,n,o,u),b=s.primaryPresentation.number,p=s.primaryPresentation.unit,h=s.baselinePercent,m=St(s,n,{height:"var(--sbcp-row-height)",color:c}),_=(V=(P=i==null?void 0:i.states)==null?void 0:P[t.entity])!=null?V:null,f=_?yt({hass:i,cardConfig:this._config,entityConfig:n,entityState:_,extrema:(W=this._extrema.get(t))!=null?W:null,previousScale:l}):null,y=this._getRevealTransitionDuration(f&&Number.isFinite(f.numericValue)?{valuePercent:f.percent,baselinePercent:f.baselinePercent}:null,Number.isFinite(s.numericValue)?{valuePercent:d,baselinePercent:h}:null),v=(B=this._markerHover)==null?void 0:B.marker;if(v&&e.contains(v)){let I=m.markers.find(U=>U.type==="generic"?v.dataset.markerId===U.id:v.matches(`.${U.type}-marker`));I&&!I.visible&&this._clearMarkerHover(v)}va(e,m,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",s.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",s.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",s.attributes.barAnimated?"true":"false");let g=e.querySelector(".value-right");g&&(g.dataset.display=this._encodeDataAttr(b),g.dataset.unit=this._encodeDataAttr(p),g.dataset.hideUnit="false",g.innerHTML=this._formatRightValueMarkup(b,p,!1));let x=e.querySelector(".top-right-value");x&&(x.dataset.display=this._encodeDataAttr(b),x.dataset.unit=this._encodeDataAttr(p),x.dataset.hideUnit="false",x.innerHTML=this._formatRightValueMarkup(b,p,!1));let S=e.querySelector(".bar-inner-label");if(S){let I=S.querySelector(".inside-value");I&&(I.dataset.display=this._encodeDataAttr(b),I.dataset.unit=this._encodeDataAttr(p),I.dataset.hideUnit="false",I.dataset.hideValue="false",I.innerHTML=this._formatInsideValueMarkup(b,p,!1))}let M=e.querySelector(".hero-header");if(M){let I=e.querySelector(".hero-line");this._setStyleIfChanged(I,"--sbcp-hero-base-size",Number.isFinite(n.layout.hero.value_size)?`${n.layout.hero.value_size}px`:null),M.innerHTML=`<span class="hero-label label-left-text">${C(s.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(b)}" data-unit="${this._encodeDataAttr(p)}">${this._formatRightValueMarkup(b,p,!1)}</span>`}let w=M?null:e.querySelector(".above-bar-label");w&&(w.innerHTML=`<span class="above-bar-label-name label-left-text">${C(s.name)}</span>${this._formatAboveValueMarkup(b,p,!1)}`);let k=e.querySelector(".target-value-label"),F=e.querySelector(".peak-value-label"),$=e.querySelector(".floor-value-label"),R=(O=s.markers)!=null?O:[];((L=(G=e.querySelectorAll)==null?void 0:G.call(e,".generic-marker[data-marker-id]"))!=null?L:[]).forEach(I=>{var X,j,ae,ee,ie;let U=I.dataset.markerId,z=this._getMarkerModel(R,U),H=[...(j=(X=e.querySelectorAll)==null?void 0:X.call(e,".generic-value-label[data-marker-id]"))!=null?j:[]].find(le=>le.dataset.markerId===U);H&&(this._setDatasetIfChanged(H,"showMarker",(z==null?void 0:z.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(H,z),z!=null&&z.labelVisible&&z.visible&&((ae=z.label)!=null&&ae.text)?(this._setTextIfChanged(H,(ie=(ee=z.label)==null?void 0:ee.text)!=null?ie:null),this._setStyleIfChanged(H,"visibility","visible"),this._setStyleIfChanged(H,"left",`${Number.isFinite(z.position)?z.position:0}%`)):this._setStyleIfChanged(H,"visibility","hidden"))});let A=this._getMarkerModel(R,"target");this._patchMarkerLabelAppearance(k,A),k&&(A!=null&&A.labelVisible&&A.visible&&((q=A.label)!=null&&q.text)?this._setTextIfChanged(k,(E=(K=A.label)==null?void 0:K.text)!=null?E:null):this._setStyleIfChanged(k,"visibility","hidden"));let T=(I,U)=>{var H,X,j;if(!I)return;let z=this._getMarkerModel(R,U);this._patchMarkerLabelAppearance(I,z),z!=null&&z.labelVisible&&z.visible&&((H=z.label)!=null&&H.text)?(this._setTextIfChanged(I,(j=(X=z.label)==null?void 0:X.text)!=null?j:null),this._setStyleIfChanged(I,"visibility","visible"),this._setStyleIfChanged(I,"left",`${Number.isFinite(z.position)?z.position:0}%`)):this._setStyleIfChanged(I,"visibility","hidden")};T(F,"peak"),T($,"floor")}_update(e=null){var s,o,u,d;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let a=this._config.entities,i=a.map(c=>!!this._hass.states[c.entity]),n=i.some((c,b)=>c!==this._rowPresence[b]);if(!this._rendered||n){this._rowGeneration+=1,this._rowPresence=i;let c="";for(let p=0;p<a.length;p++){let h=a[p],m=this._hass.states[h.entity];if(!m){c+=`<div class="row" data-row-index="${p}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${C(h.entity)}</span></div>`;continue}let _=this._resolve(h);this._updateExtrema(h,_,m);let f=this._buildRowViewModel(h,_,m),y=f.min,v=f.max,g=f.percent,x=this._getColor(g,_,y,v),S=f.primaryPresentation.number,M=f.primaryPresentation.unit,w=f.targetPercent,k=(o=(s=f.targetPresentation)==null?void 0:s.text)!=null?o:null,F=f.peakPercent,$=(d=(u=f.peakPresentation)==null?void 0:u.number)!=null?d:null;c+=this._buildRow(h,S,M,g,x,F,$,w,k,_.peak_marker.color,_.target_marker.color,y,v,p)}this._clearMarkerHover(),this._clearRowActionHandlers(),t.innerHTML=c,this._rendered=!0;let b=t.querySelectorAll(".row[data-entity]");b.forEach(p=>{let h=a[Number(p.dataset.rowIndex)],m=h?this._hass.states[h.entity]:null;h&&m&&this._patchRow(p,h,m)}),this._runPostLayoutPasses(b),b.forEach(p=>{var y,v;let h=Number(p.dataset.rowIndex),m=p.dataset.entity,f=wi(p,{resolveAction:g=>{var S;let x=Array.isArray((S=this._actionConfig)==null?void 0:S.entities)?this._actionConfig.entities[h]:null;return gi(this._actionConfig,x,g)},label:(v=(y=p.getAttribute)==null?void 0:y.call(p,"aria-label"))!=null?v:m,dispatchAction:({config:g,action:x})=>{let S={...this._actionConfig,entity:m,[x==="double_tap"?"double_tap_action":`${x}_action`]:g},M=new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:S,action:x}});this.dispatchEvent(M)}});this._rowActionCleanup.push(f)});return}let l=t.querySelectorAll(".row[data-entity]");for(let c of l){let b=a[Number(c.dataset.rowIndex)];if(!b)continue;let p=this._hass.states[b.entity];p&&this._patchRow(c,b,p,e)}this._runPostLayoutPasses(l)}}});function dr(r,e={}){let t=e.above?10:0,a=e.below?10:0,i=Math.max(0,r-t-a);return{above:t,below:a,railHeight:i,aboveY:0,belowY:r-9,compactGlyphs:t>0||a>0}}function Mi(r,e,t){let a=[];for(let i of["above","below"]){let n=r.filter(l=>{var s,o;return l.lane===i&&l.visible&&l.labelVisible&&Number.isFinite(l.position)&&((o=(s=l.label)==null?void 0:s.text)==null?void 0:o.trim())}).map(l=>({marker:l,anchor:Math.max(0,Math.min(100,l.position))*e/100})).sort((l,s)=>l.anchor-s.anchor);n.forEach(({marker:l,anchor:s},o)=>{var _;let u=o?(n[o-1].anchor+s)/2+2:0,d=o+1<n.length?(s+n[o+1].anchor)/2-2:e,c=Math.max(0,d-u),b=l.label,p=b.text,h="full",m=t(p)+4;if(m>c&&(p=[b.showValue!==!1?b.number:"",b.showUnit!==!1?b.unit:""].filter(Boolean).join(" "),h="value",m=p?t(p)+4:1/0,!p&&!b.number&&!b.unit)){let f=Array.from((_=b.semanticText)!=null?_:"");for(;f.length>=3;){if(p=`${f.join("").trimEnd()}\u2026`,m=t(p)+4,m<=c){h="text";break}f.pop()}}!p||m>c||e<=0?a.push({id:l.id,lane:i,mode:"hidden",text:"",left:0,width:0}):a.push({id:l.id,lane:i,mode:h,text:p,left:Math.max(u,Math.min(s-m/2,d-m)),width:m})})}return a}var Ri=te(()=>{});function $i(r,e){return ne(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var Rt,Ni=te(()=>{zt();_e();Jt();La();Ha();_a();ur();Ra();Wt();ea();oa();Ri();Rt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._extrema={},this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static async getConfigElement(){return Ft("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!ne(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._requestUpdate()}get hass(){return this._hass}set context(e){this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._requestUpdate()}disconnectedCallback(){this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var s,o,u,d,c,b,p,h,m;let e=((s=this._config)==null?void 0:s.entity)||((o=this._context)==null?void 0:o.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._extrema={},this._scaleHistory=null,this._sampleState=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?Yt({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e,...this._config.attribute!==void 0?{attribute:this._config.attribute}:{}}]:[]}):null,this._diagnostics=Qt(this._normalized));let t=bt(this._hass,e,(c=(d=(u=this._normalized)==null?void 0:u.entities)==null?void 0:d[0])==null?void 0:c.attribute),a=t.stateObj,i=null,n=this._config?e?this._hass?a?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured",l=null;if(a&&((b=this._normalized)!=null&&b.entities[0])){let _=this._normalized.entities[0],f=t.available&&t.attributeFound?D(t.value):null;if(f!==null&&(a!==this._sampleState||f!==this._sampleValue)){this._sampleState=a,this._sampleValue=f;let y=(p=a.last_updated)!=null?p:a.last_changed,v=y instanceof Date?y.getTime():Date.parse(String(y!=null?y:"")),g=Number.isFinite(v)?v:Date.now();for(let x of["peak","floor"]){let S=_[`${x}_marker`];S.show&&(this._extrema[x]=Vt(this._extrema[x],f,(h=S.reset)!=null?h:{kind:"never"},x==="peak"?"max":"min",g))}}if(i=yt({hass:this._hass,entityConfig:_,entityState:a,extrema:this._extrema,previousScale:this._scaleHistory}),this._scaleHistory={min:i.min,max:i.max},i.numericValue===null){let y=String((m=i.state)!=null?m:"").trim(),v=/^[+-]?(?:nan|infinity)$/i.test(y);a.state==="unknown"?n="Unknown":a.state==="unavailable"?n="Unavailable":y&&!v?l=i.primaryPresentation.text:n="Not numeric"}}this._row=i,this._status=n,this._textValue=l,this._render(i,n),this._previousRow=n||l!==null?null:i}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${Pt}
        ${At}
        ${It('.surface[data-bar-animated="false"]')}
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
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var c,b,p;this._ensureDom();let a=t?null:this._textValue;typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!(t||a!==null),this._statusEl.hidden=!t&&a===null,this._statusEl.textContent=(c=t!=null?t:a)!=null?c:"",this._surface.dataset.state=t?"unavailable":a!==null?"text":"numeric";let i=(b=e==null?void 0:e.markerLabelLaneOccupancy)!=null?b:{},n=dr(0,i);Z(this._surface,"--label-above",`${n.above}px`),Z(this._surface,"--label-below",`${n.below}px`),this._syncLabels(e,t||a!==null);let l=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",s=((p=e==null?void 0:e.markers)!=null?p:[]).filter(h=>h.visible&&(h.showMarker||h.labelVisible)).map(h=>{var f;let m=h.type==="generic"?"Reference marker":`${h.type[0].toUpperCase()}${h.type.slice(1)}`,_=`${pe(h.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${m} at ${_}${h.labelVisible&&((f=h.label)!=null&&f.text)?`; label ${h.label.text}`:""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${l}${this._entity&&l!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:a!==null?`${l}${this._entity&&l!==this._entity?` (${this._entity})`:""}: ${a}`:`${l} (${this._entity}): ${e.primaryPresentation.text}. Range ${pe(e.min)} to ${pe(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${s?` ${s}`:""}`),t||a!==null)return;let o=St(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});o.animated=o.animated&&!!this._previousRow,this._surface.dataset.barAnimated=o.animated?"true":"false";let u=JSON.stringify(o),d=JSON.stringify([o.baseline.configured,o.needle.configured,o.markers.map(h=>[h.type,h.id])]);d!==this._structureKey?(this._bar.innerHTML=ya(o),this._structureKey=d):u!==this._barRenderKey&&va(this._bar,o,{revealDuration:ba(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=u,this._labelAnimated=o.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var l,s,o;let a=((l=e==null?void 0:e.markers)!=null?l:[]).filter(u=>u.labelVisible),i=new Set(a.map(u=>u.id));for(let[u,d]of this._labelNodes)i.has(u)||(d.remove(),this._labelNodes.delete(u));for(let u of a){if(!this._labelNodes.has(u.id)){let c=document.createElement("span");c.className="compact-marker-label",c.dataset.markerId=u.id,c.hidden=!0,this._labels.append(c),this._labelNodes.set(u.id,c)}let d=this._labelNodes.get(u.id);d.dataset.lane=u.lane,Z(d,"--marker-color",ye(u))}if(this._labels.hidden=!!t,!(((s=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:s.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let u=this._labelFonts;u.ready.then(()=>{this._labelFonts===u&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var s,o,u,d;let{width:e,height:t}=this._surface.getBoundingClientRect(),a=dr(t,(s=this._row)==null?void 0:s.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(a.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let i=Mi((d=(u=this._row)==null?void 0:u.markers)!=null?d:[],e,c=>this._labelMeasure.measureText(c).width),n=JSON.stringify([e,t,a.above,a.below,this._labelMeasure.font,i.map(c=>[c.id,c.lane,c.mode,c.width])]),l=this._labelAnimated&&!this._snapLabels&&n===this._labelLayoutKey;for(let c of this._labelNodes.values())c.hidden=!0;for(let c of i){let b=this._labelNodes.get(c.id);b.hidden=c.mode==="hidden",b.dataset.mode=c.mode,b.textContent!==c.text&&(b.textContent=c.text),Z(b,"transition",l?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),Z(b,"left",`${c.left}px`),Z(b,"width",`${c.width}px`)}this._labelLayoutKey=n,this._snapLabels=!1}}});var vn=Ii(()=>{Si();Ni();zt();Zr(Mt,Rt);for(let[r,e]of[["sensor-bar-card-plus",Mt],["sensor-bar-card-plus-feature",Rt]])customElements.get(r)||customElements.define(r,e);window.customCards=window.customCards||[];window.customCards.some(r=>r.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(r=>r.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:$i,configurable:!0})});export default vn();
