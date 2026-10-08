(()=>{var U=(n,e,t)=>()=>{if(t)throw t[0];try{return n&&(e=n(n=0)),e}catch(r){throw t=[r],r}};var Ss=(n,e)=>()=>{try{return e||n((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function Pr(n){return`
        ${n} .bar-fill-reveal,
        ${n} .needle-marker,
        ${n} .target-marker,
        ${n} .peak-marker,
        ${n} .floor-marker,
        ${n} .generic-marker,
        ${n} .baseline-indicator {
          transition: none;
        }
`}var Fr,Er,Ni=U(()=>{Fr=`
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
`,Er=`
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

`});function xs(n,e){if(!(n instanceof Date)||Number.isNaN(n.getTime()))return null;let t=n.getFullYear(),r=n.getMonth(),i=n.getDate(),a=n.getHours();if(e==="quarterly")return new Date(t,r,i,a,Math.floor(n.getMinutes()/15)*15,0,0).getTime();if(e==="hourly")return new Date(t,r,i,a,0,0,0).getTime();if(e==="daily")return new Date(t,r,i,0,0,0,0).getTime();if(e==="weekly"){let s=(n.getDay()+6)%7;return new Date(t,r,i-s,0,0,0,0).getTime()}return e==="monthly"?new Date(t,r,1,0,0,0,0).getTime():e==="yearly"?new Date(t,0,1,0,0,0,0).getTime():null}function $n(n){if(n===void 0&&(n="never"),typeof n!="string")return{kind:"never"};let e=n.trim().toLowerCase();if(e==="never")return{kind:"never"};if(kn.has(e))return{kind:"calendar",unit:e};let t=e.match(/^(\d+)(m|h)$/);if(!t)return{kind:"never"};let r=Number(t[1]),i=t[2];return!Number.isInteger(r)||r<1||i==="m"&&r>59||i==="h"&&r>23?{kind:"never"}:i==="m"?{kind:"duration",minutes:r}:{kind:"duration",hours:r}}function Tr(n){if(typeof n!="string")return!1;let e=n.trim().toLowerCase();if(e==="never"||kn.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let r=Number(t[1]);return Number.isInteger(r)&&r>=1&&(t[2]==="m"?r<=59:r<=23)}function Mn(n,e){if((n==null?void 0:n.kind)!=="calendar")return null;let t=xs(new Date(e),n.unit);return Number.isFinite(t)?String(t):null}function ws(n){return(n==null?void 0:n.kind)!=="duration"?null:Number.isInteger(n.minutes)?n.minutes*60*1e3:Number.isInteger(n.hours)?n.hours*60*60*1e3:null}function Ai(n,e,t){return(e==null?void 0:e.kind)==="duration"?{value:n,startedAtMs:Number.isFinite(t)?t:null,windowKey:null}:(e==null?void 0:e.kind)==="calendar"?{value:n,startedAtMs:null,windowKey:Mn(e,t)}:{value:n,startedAtMs:null,windowKey:null}}function Rr(n,e,t,r,i){if(!Number.isFinite(e))return n!=null?n:null;let a=ws(t);if(!n||a!==null&&Number.isFinite(n.startedAtMs)&&Number.isFinite(i)&&i-n.startedAtMs>=a)return Ai(e,t,i);if((t==null?void 0:t.kind)==="calendar"){let l=Mn(t,i);if(l!==null&&l!==n.windowKey)return Ai(e,t,i)}return(r==="min"?e<n.value:e>n.value)?{...n,value:e}:n}var kn,ir=U(()=>{kn=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function ce(n,e,t=null){let r={fixed:n!=null?n:null,entity:e!=null?e:null};return Number.isFinite(t)&&(r.percent=t),r}function ke(n){return typeof n=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(n.trim())}function Me(n){if(typeof n!="string")return null;let e=n.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function J(n){if(typeof n=="number")return Number.isFinite(n)?n:null;if(typeof n=="string"){let e=n.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function $e(n,e=null,t=null,r={}){var s,l,o,d,c,u;let{allowPercent:i=!1}=r,a=e!=null?e:ce(t,null);if(n===void 0)return{...a};if(n===null)return ce(null,null);if(typeof n=="object"&&!Array.isArray(n)){let h=(l=(s=n.fixed)!=null?s:n.value)!=null?l:null,p=(o=n.entity)!=null?o:null,f=i?J(n.percent):null;return ce(h,p,f)}if(ke(n))return ce((c=(d=a.fixed)!=null?d:t)!=null?c:null,n,(u=a.percent)!=null?u:null);if(i){let h=Me(n);if(Number.isFinite(h))return ce(null,null,h)}return ce(n,null)}function ks(n){var e;return!!n&&(J((e=n.fixed)!=null?e:n.value)!==null||Number.isFinite(n.percent)||!!n.entity)}function Fn(n,e){var r,i,a,s;let t={above:((r=e==null?void 0:e.peak_marker)==null?void 0:r.show)===!0?1:0,below:(((i=e==null?void 0:e.floor_marker)==null?void 0:i.show)===!0?1:0)+(((a=e==null?void 0:e.target_marker)==null?void 0:a.enabled)!==!1&&ks((s=e==null?void 0:e.target_marker)==null?void 0:s.source)?1:0)};return n.map(l=>{let o=l.valid&&t[l.lane]<4;return o&&(t[l.lane]+=1),{...l,accepted:o}})}function En(n,e=null){if(!Array.isArray(n))return{markers:[],invalidList:n!==void 0};let t=n.map((r,i)=>{var E;if(!r||typeof r!="object"||Array.isArray(r))return{id:`generic-${i}`,index:i,valid:!1,accepted:!1,malformed:!0};let a=r.at,s=a&&typeof a=="object"&&Object.prototype.hasOwnProperty.call(a,"percent"),l=typeof a=="string"?a.trim():a,o=$e(l,null,null,{allowPercent:!0}),d=a&&typeof a=="object"&&a.entity!==void 0?a.entity:typeof l=="string"&&ke(l)?l:null,c=d!=null&&d!==""&&!ke(d),u=a&&typeof a=="object"&&a.fixed!==void 0&&a.fixed!==null&&J(a.fixed)===null,h=!!o.entity||J(o.fixed)!==null||Number.isFinite(o.percent),p=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),f=a!=null&&!s&&!c&&!u&&h&&!p,b=r.lane===void 0?"below":r.lane,g=b==="above"||b==="below",_=["circle","diamond","triangle","chevron","arrow","pin"],y=r.shape===void 0||_.includes(r.shape),m=ye(r.direction),v=r.direction!==void 0&&!["inward","outward"].includes(typeof r.direction=="string"?r.direction.trim().toLowerCase():""),S=r.label&&typeof r.label=="object"&&!Array.isArray(r.label)?r.label:{},w=Br(S),k=S.entity,M=typeof k=="string"?k.trim():"",$=k!=null&&k!==""&&!ke(M),T=M&&ke(M)?M:null,B=typeof r.show_marker=="boolean"?r.show_marker:!0;return{id:`generic-${i}`,index:i,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:g?b:null,shape:y&&(E=r.shape)!=null?E:"circle",direction:m,invalidDirection:v,showMarker:B,invalidShowMarker:r.show_marker!==void 0&&typeof r.show_marker!="boolean",color:typeof r.color=="string"&&r.color.trim()?r.color:"#888888",label:{show:S.show===!0,text:w.label_text,entity:T,showValue:w.label_show_value,showUnit:w.label_show_unit,precision:w.label_precision,invalidShow:w.label_invalid_show,invalidText:w.label_invalid_text,invalidShowValue:w.label_invalid_show_value,invalidShowUnit:w.label_invalid_show_unit,invalidPrecision:w.label_invalid_precision,invalidPrecisionKey:w.label_precision_key,unsupportedUnit:w.label_unsupported_unit,invalidEntity:$},valid:f&&g,invalidSource:!f,invalidPercentage:p,unsupportedPercentField:s,invalidLane:!g,invalidShape:!y,accepted:!1}});return{markers:Fn(t,e),invalidList:!1}}function Ye(n,e=null){var r;let t=e!=null?e:{color:null};return n===void 0?{...t}:n===null?{color:null}:typeof n=="object"&&!Array.isArray(n)?{color:(r=n.color)!=null?r:null}:{color:n}}function ar(n){return n===!0?!0:n===!1?!1:null}function Gr(n,e){var a;let t=e==null?void 0:e.baseline,r=n==null?void 0:n.baseline,i={enabled:ar(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:ce(null,null),above:Ye(void 0,t==null?void 0:t.above),below:Ye(void 0,t==null?void 0:t.below)};return r===void 0?i:r===null?{enabled:null,at:ce(null,null),above:{color:null},below:{color:null}}:typeof r!="object"||Array.isArray(r)?{enabled:i.enabled,at:$e(r,i.at,null),above:i.above,below:i.below}:{enabled:(a=ar(r.enabled))!=null?a:i.enabled,at:$e(r.at,i.at,null,{allowPercent:!0}),above:Ye(r.above,i.above),below:Ye(r.below,i.below)}}function $s(n,e=null){let t=[...n].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var s;let a=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(a)&&i<t.length-1&&(a=t[i+1].from),!Number.isFinite(a)&&Number.isFinite(e)&&(a=e),{from:r.from,to:a,color:r.color,label:(s=r.label)!=null?s:null}})}function Cr(n){if(!Array.isArray(n))return null;let e=n.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var r;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(r=t.label)!=null?r:null}});return $s(e,100)}function Vn(n,e=null){var r;if(n===void 0)return{value:null,issue:null};if(n===null)return{value:null,issue:"malformed"};if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.entity!==void 0&&n.entity!==null&&n.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(n,"percent")){let a=J(n.percent);return Number.isFinite(a)?{value:ce(null,null,a),issue:null}:{value:null,issue:"malformed"}}let i=J((r=n.fixed)!=null?r:n.value);return Number.isFinite(i)?{value:ce(i,null),issue:null}:{value:null,issue:"malformed"}}if(typeof n=="string"){let i=n.trim();if(ke(i))return{value:null,issue:"entity"};if(i.includes("%")){let a=Me(i);return Number.isFinite(a)?{value:ce(null,null,a),issue:null}:{value:null,issue:"malformed_percent"}}}let t=J(n);return Number.isFinite(t)?e==="percent"?{value:ce(null,null,t),issue:null}:{value:ce(t,null),issue:null}:{value:null,issue:"malformed"}}function Ue(n,e={}){if(!Array.isArray(n))return null;let{legacySegmentSpace:t=null}=e,r=n.map(i=>{var l,o;let a=(i==null?void 0:i.from)===void 0?{value:null,issue:"malformed"}:Vn(i.from,t),s=(i==null?void 0:i.to)===void 0?{value:null,issue:null}:i.to===null?{value:null,issue:null}:Vn(i.to,t);return i!=null&&i.color?{from:a.value,to:s.value,invalidBoundary:(l=a.issue)!=null?l:s.issue,color:i.color,label:(o=i.label)!=null?o:null}:null}).filter(Boolean);return r.map((i,a)=>{var l;let s=r.slice(a+1).find(o=>!o.invalidBoundary);return{from:i.from?{...i.from}:null,to:i.to?{...i.to}:s!=null&&s.from?{...s.from}:null,...i.invalidBoundary?{invalidBoundary:i.invalidBoundary}:{},color:i.color,label:(l=i.label)!=null?l:null}})}function zr(n,e,t,r){var b,g,_,y,m,v,S,w,k,M;let i=e==null?void 0:e.scale,a=n==null?void 0:n.scale,s=`${t}_entity`,l=i==null?void 0:i[t],o=l?ce((g=(b=l.fixed)!=null?b:l.value)!=null?g:null,(_=l.entity)!=null?_:null):ce((y=e==null?void 0:e[t])!=null?y:r,(m=e==null?void 0:e[s])!=null?m:null),d=l?l.fixed_explicit!==!1&&l.fixed!==null&&l.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,c=($,T)=>(Object.defineProperty($,"fixed_explicit",{value:T}),$);if((a==null?void 0:a[t])!==void 0){let $=a[t],T=ke($)?d:typeof $=="object"&&$!==null?((v=$.fixed)!=null?v:$.value)!==null&&((S=$.fixed)!=null?S:$.value)!==void 0:$!==null;return c($e(a[t],o,r),T)}let u=n[s],h=u!=null,p=(k=(w=n[t])!=null?w:h?null:o.fixed)!=null?k:o.entity?null:r,f=(M=u!=null?u:o.entity)!=null?M:null;return c(ce(p,f),n[t]!==null&&n[t]!==void 0||!h&&d)}function We(n,e){return{min:zr(n,e,"min",0),max:zr(n,e,"max",100)}}function Li(n){switch(n){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function sr(n){switch(n){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function Or(n,e){return n!=null&&Object.prototype.hasOwnProperty.call(n,e)}function Ms(n){return[Or(n,"color")?n.color:void 0,Or(n==null?void 0:n.bar,"color")?n.bar.color:void 0].some(t=>t!=null)}function nr(n){let e=n==null?void 0:n.bar,t=[[n,"color_mode"],[e,"color_mode"],[e,"fill_style"],[n,"severity"],[n,"segments"],[e,"segments"],[n,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Ms(n),paint:t.some(([r,i])=>Or(r,i))}}function Ze(n=null,e=null){var a,s,l,o,d,c;let t=(a=n==null?void 0:n.fill_style)!=null?a:null,r=(l=(s=n==null?void 0:n.color_mode)!=null?s:e)!=null?l:null,i=(d=(o=Li(t))!=null?o:r)!=null?d:"severity";return{fill_style:(c=t!=null?t:sr(i))!=null?c:"bands",color_mode:i}}function Ui(n,e,t,r,{scopeExplicitness:i=null,inheritedExplicitness:a=null,isCardScope:s=!1}={}){let l=(i==null?void 0:i.color)===!0&&i.paint!==!0,o=(a==null?void 0:a.paint)===!0;return l&&(s||!o)?Ze({fill_style:"solid"},null):(n==null?void 0:n.fill_style)!==void 0||(n==null?void 0:n.color_mode)!==void 0||e.color_mode!==void 0?Ze(n,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(r==null?void 0:r.color_mode)!==void 0?Ze(t,r==null?void 0:r.color_mode):Ze(null,null)}function qi(n){return Array.isArray(n)?n.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=Me(e.pos),r=Number.isFinite(t)?t:J(e.pos);return{...e,pos:Number.isFinite(r)?r:e.pos}}):n!=null?n:null}function Wi(n,e=null){var r,i,a,s;let t=e?{show:(r=e.show)!=null?r:!1,color:(i=e.color)!=null?i:"#ffffff"}:{show:!1,color:"#ffffff"};return n===void 0?{...t}:typeof n=="boolean"?{show:n,color:"#ffffff"}:n&&typeof n=="object"&&!Array.isArray(n)?{show:(a=n.show)!=null?a:t.show,color:(s=n.color)!=null?s:t.color}:{...t}}function Fe(n,e,t={}){var w,k,M,$,T,B,E,z,C,O,A,I,X,Y,Z,Q,he,se,le,W,ee,H,te,oe,ae,_e,de;let r=(w=t.scopeExplicitness)!=null?w:nr(n),i=(M=(k=t.inheritedExplicitness)!=null?k:e==null?void 0:e[ji])!=null?M:nr(e),a=($=t.isCardScope)!=null?$:e==null,s=e==null?void 0:e.bar,l=n==null?void 0:n.bar,o=Or(s,Ii)?s[Ii]:["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:null,d=["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:o,c=l==null?void 0:l.segments,u=n.segments,h=n.severity,p=(T=s==null?void 0:s.segments)!=null?T:null,f=(B=e==null?void 0:e.segments)!=null?B:null,b=(E=e==null?void 0:e.severity)!=null?E:null,g=null,_=(s==null?void 0:s.segment_space)==="percent"||(s==null?void 0:s.segment_space)==="scale"?s.segment_space:null;c!=null?(_=d,g=Ue(c,{legacySegmentSpace:_})):u!=null?g=Ue(u):h!=null?(g=Cr(h),_="percent"):p!=null?g=p.map(Ve=>({...Ve})):f!=null?g=Ue(f):b!=null&&(g=Cr(b),_="percent");let y=n!=null&&n.target&&typeof n.target=="object"&&!Array.isArray(n.target)?(z=n.target.when_exceeded)==null?void 0:z.fill_color:void 0,m=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(C=e.target.when_exceeded)==null?void 0:C.fill_color:void 0,v=Ui(l,n,s,e,{scopeExplicitness:r,inheritedExplicitness:i,isCardScope:a}),S={fill_style:v.fill_style,color_mode:v.color_mode,needle:Wi(l==null?void 0:l.needle,s==null?void 0:s.needle),solid_fill:(A=(O=l==null?void 0:l.solid_fill)!=null?O:s==null?void 0:s.solid_fill)!=null?A:!1,color:(Z=(Y=(X=(I=l==null?void 0:l.color)!=null?I:n.color)!=null?X:s==null?void 0:s.color)!=null?Y:e==null?void 0:e.color)!=null?Z:"#4a9eff",gradient_stops:qi((le=(se=(he=(Q=l==null?void 0:l.gradient_stops)!=null?Q:n.gradient_stops)!=null?he:s==null?void 0:s.gradient_stops)!=null?se:e==null?void 0:e.gradient_stops)!=null?le:null),severity:g,segments:g,segment_space:_,animated:(te=(H=(ee=(W=l==null?void 0:l.animated)!=null?W:n.animated)!=null?ee:s==null?void 0:s.animated)!=null?H:e==null?void 0:e.animated)!=null?te:!0,above_target_color:(de=(_e=(ae=(oe=y!=null?y:n.above_target_color)!=null?oe:s==null?void 0:s.above_target_color)!=null?ae:m)!=null?_e:e==null?void 0:e.above_target_color)!=null?de:null};return Object.defineProperty(S,Ii,{value:d}),S}function Hi(n){return Math.max(24,n)}function Vs(n,e="left"){let t=typeof n=="string"?n.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function Fs(n,e="medium"){let t=typeof n=="string"?n.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Es(n){return Number.isFinite(n)?Math.min(112,Math.max(12,n)):null}function Nr(n,e){var p,f,b,g,_,y,m,v,S,w,k,M,$,T,B,E,z,C,O,A,I,X,Y,Z,Q;let t=e==null?void 0:e.layout,r=n==null?void 0:n.layout,i=r==null?void 0:r.label,a=r==null?void 0:r.hero,s=t==null?void 0:t.label,l=t==null?void 0:t.hero,o=!e,d=(g=(b=(f=(p=r==null?void 0:r.height)!=null?p:n.height)!=null?f:t==null?void 0:t.height)!=null?b:e==null?void 0:e.height)!=null?g:38,c=(r==null?void 0:r.height)!==void 0||n._height_explicit===!0||!o&&n.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,u=Vs((v=(m=(y=(_=i==null?void 0:i.position)!=null?_:n.label_position)!=null?y:s==null?void 0:s.position)!=null?m:t==null?void 0:t.label_position)!=null?v:e==null?void 0:e.label_position,"left"),h=u==="hero"?Es((S=a==null?void 0:a.value_size)!=null?S:l==null?void 0:l.value_size):null;return{label:{position:u,width:(T=($=(M=(k=(w=i==null?void 0:i.width)!=null?w:n.label_width)!=null?k:s==null?void 0:s.width)!=null?M:t==null?void 0:t.label_width)!=null?$:e==null?void 0:e.label_width)!=null?T:100},hero:{size:Fs((Q=(Z=(Y=(X=(I=(A=(O=(C=(z=(E=(B=a==null?void 0:a.size)!=null?B:i==null?void 0:i.hero_size)!=null?E:i==null?void 0:i.heroSize)!=null?z:n.hero_size)!=null?C:n.heroSize)!=null?O:l==null?void 0:l.size)!=null?A:s==null?void 0:s.hero_size)!=null?I:s==null?void 0:s.heroSize)!=null?X:t==null?void 0:t.hero_size)!=null?Y:t==null?void 0:t.heroSize)!=null?Z:e==null?void 0:e.hero_size)!=null?Q:e==null?void 0:e.heroSize,"medium"),value_size:h},height:Hi(d),height_explicit:c}}function Ar(n,e){var i,a,s,l,o,d,c,u;let t=e==null?void 0:e.formatting,r=n==null?void 0:n.formatting;return{decimal:(l=(s=(a=(i=r==null?void 0:r.decimal)!=null?i:n.decimal)!=null?a:t==null?void 0:t.decimal)!=null?s:e==null?void 0:e.decimal)!=null?l:null,unit:(u=(c=(d=(o=r==null?void 0:r.unit)!=null?o:n.unit)!=null?d:t==null?void 0:t.unit)!=null?c:e==null?void 0:e.unit)!=null?u:null}}function qe(n){let e=String(n!=null?n:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function ye(n){return(typeof n=="string"?n.trim().toLowerCase():"")==="outward"?"outward":"inward"}function Br(n,e={}){var u,h,p;let t=n&&typeof n=="object"&&!Array.isArray(n)?n:{},r=Object.prototype.hasOwnProperty.call(t,"text"),i=r&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,a=Object.prototype.hasOwnProperty.call(t,"precision"),s=Object.prototype.hasOwnProperty.call(t,"decimal"),l=a?t.precision:t.decimal,o=a||s,d=o?J(l):(u=e.label_precision)!=null?u:null,c=o&&l!==null&&l!==""&&!(Number.isInteger(d)&&d>=0);return{label_text:i!=null?i:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(h=e.label_show_value)!=null?h:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(p=e.label_show_unit)!=null?p:!0,label_precision:c?null:d,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:r&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:c,label_precision_key:c?a?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function Dr(n){let e={};return n.label_text!==null&&n.label_text!==void 0&&(e.label_text=n.label_text),n.label_show_value===!1&&(e.label_show_value=!1),n.label_show_unit===!1&&(e.label_show_unit=!1),n.label_precision!==null&&n.label_precision!==void 0&&(e.label_precision=n.label_precision),n.label_invalid_text&&(e.label_invalid_text=!0),n.label_invalid_show_value&&(e.label_invalid_show_value=!0),n.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),n.label_invalid_show&&(e.label_invalid_show=!0),n.label_invalid_precision&&(e.label_invalid_precision=!0),n.label_invalid_precision&&n.label_precision_key&&(e.label_precision_key=n.label_precision_key),n.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function Pn(n){return n!==void 0&&!["inward","outward"].includes(typeof n=="string"?n.trim().toLowerCase():"")}function Ir(n,e){var u,h,p,f,b,g,_,y,m,v,S,w,k,M,$,T,B,E,z,C,O,A,I,X,Y,Z,Q,he,se,le,W,ee,H,te,oe;let t=e==null?void 0:e.target_marker,r=n==null?void 0:n.target,i=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(u=e==null?void 0:e.target)!=null?u:null,a=t?{...t,shape:qe(t.shape),direction:ye(t.direction)}:{enabled:null,source:ce(null,null),color:(h=e==null?void 0:e.target_color)!=null?h:"#888",show_label:(p=e==null?void 0:e.show_target_label)!=null?p:!1,...Dr(Br((f=e==null?void 0:e.target)==null?void 0:f.label)),label_decimal:(v=(m=(g=(b=e==null?void 0:e.target)==null?void 0:b.label)==null?void 0:g.precision)!=null?m:(y=(_=e==null?void 0:e.target)==null?void 0:_.label)==null?void 0:y.decimal)!=null?v:null,shape:"diamond",direction:"inward"};if(r&&typeof r=="object"&&!Array.isArray(r)){let ae=Br(r.label,a),_e={enabled:(w=(S=ar(r.enabled))!=null?S:a.enabled)!=null?w:null,source:$e(r.at,a.source,null,{allowPercent:!0}),color:(M=(k=r.color)!=null?k:n.target_color)!=null?M:a.color,show_label:(B=(T=($=r.label)==null?void 0:$.show)!=null?T:n.show_target_label)!=null?B:a.show_label,shape:Object.prototype.hasOwnProperty.call(r,"shape")?qe(r.shape):a.shape,direction:Object.prototype.hasOwnProperty.call(r,"direction")?ye(r.direction):a.direction,...Pn(r.direction)?{direction_invalid:!0}:{},...Dr(ae)},de=ae.label_precision;return de!=null&&(_e.label_decimal=de,_e.label_precision=de),_e}let s=(A=(O=(z=n.target)!=null?z:(E=a.source)==null?void 0:E.fixed)!=null?O:(C=a.source)==null?void 0:C.value)!=null?A:i,l=(Z=(Y=(X=n.target_entity)!=null?X:(I=a.source)==null?void 0:I.entity)!=null?Y:e==null?void 0:e.target_entity)!=null?Z:null,o=n.target===void 0&&n.target_entity===void 0&&(he=(Q=a.source)==null?void 0:Q.percent)!=null?he:null,d={enabled:(se=a.enabled)!=null?se:null,source:ce(s,l,o),color:(ee=(W=(le=n.target_color)!=null?le:a.color)!=null?W:e==null?void 0:e.target_color)!=null?ee:"#888",show_label:(oe=(te=(H=n.show_target_label)!=null?H:a.show_label)!=null?te:e==null?void 0:e.show_target_label)!=null?oe:!1,shape:a.shape,direction:a.direction,...Dr(a)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Ps(n,e){let t=n==null?void 0:n[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let r=n==null?void 0:n[`${e}_marker`];return r&&typeof r=="object"&&!Array.isArray(r)?r:null}function Ts(n,e){var a,s,l;let t=n==null?void 0:n.label,r=t&&typeof t=="object"&&!Array.isArray(t),i=Br(t,e);return{show:r&&typeof t.show=="boolean"?t.show:(a=e.show_label)!=null?a:!1,text:i.label_text,invalidShow:i.label_invalid_show,showValue:i.label_show_value,showUnit:i.label_show_unit,precision:i.label_invalid_precision?null:(l=(s=i.label_precision)!=null?s:e.label_decimal)!=null?l:null,invalidText:i.label_invalid_text,invalidShowValue:i.label_invalid_show_value,invalidShowUnit:i.label_invalid_show_unit,invalidPrecision:i.label_invalid_precision,precisionKey:i.label_precision_key,unsupportedUnit:i.label_unsupported_unit}}function Tn(n,e,t,r={}){var _,y,m,v,S,w,k,M,$;let{legacy:i=!1,defaultColor:a="#888888"}=r,s=e==null?void 0:e[`${t}_marker`],l=Ps(n,t),o=s!=null?s:{show:i&&(_=e==null?void 0:e.show_peak)!=null?_:!1,color:i&&(y=e==null?void 0:e.peak_color)!=null?y:a,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,reset:{kind:"never"},direction:"inward"},d=l&&Object.prototype.hasOwnProperty.call(l,"reset"),c=d?l.reset:void 0,u=d?$n(c):(m=o.reset)!=null?m:{kind:"never"},h=l==null?void 0:l.label,p=Ts(l,o),f={show:(w=(S=(v=l==null?void 0:l.enabled)!=null?v:i?n.show_peak:void 0)!=null?S:o.show)!=null?w:!1,color:($=(M=(k=l==null?void 0:l.color)!=null?k:i?n.peak_color:void 0)!=null?M:o.color)!=null?$:a,direction:l&&Object.prototype.hasOwnProperty.call(l,"direction")?ye(l.direction):ye(o.direction),...Pn(l==null?void 0:l.direction)?{direction_invalid:!0}:{}},b=s&&(Object.prototype.hasOwnProperty.call(s,"show_label")||Object.prototype.hasOwnProperty.call(s,"label_decimal")||Object.prototype.hasOwnProperty.call(s,"label_text")||Object.prototype.hasOwnProperty.call(s,"label_show_value")||Object.prototype.hasOwnProperty.call(s,"label_show_unit")||Object.prototype.hasOwnProperty.call(s,"label_precision")||Object.prototype.hasOwnProperty.call(s,"reset"));return(t==="floor"||d||h!==void 0||b)&&(f.show_label=p.show,f.label_decimal=p.precision,f.reset=u),Object.assign(f,Dr({label_text:p.text,label_show_value:p.showValue===!0?void 0:p.showValue,label_show_unit:p.showUnit===!0?void 0:p.showUnit,label_precision:p.precision,label_invalid_text:p.invalidText,label_invalid_show:p.invalidShow,label_invalid_show_value:p.invalidShowValue,label_invalid_show_unit:p.invalidShowUnit,label_invalid_precision:p.invalidPrecision,label_precision_key:p.precisionKey,label_unsupported_unit:p.unsupportedUnit})),d&&!Tr(c)&&(f.reset_invalid=!0),f}function Lr(n,e){return Tn(n,e,"peak",{legacy:!0,defaultColor:"#888888"})}function Rn(n,e){return Tn(n,e,"floor",{defaultColor:"#888888"})}function Ki(n,e){var i,a,s;let t={...n,_normalized:!0,entity:n.entity,name:(i=n.name)!=null?i:null,icon:n.icon};t.layout=Nr(n,e),t.scale=We(n,e),t.bar=Fe(n,e,{scopeExplicitness:nr(n),inheritedExplicitness:(a=e==null?void 0:e[ji])!=null?a:nr(e),isCardScope:!1}),t.baseline=Gr(n,e),t.formatting=Ar(n,e),t.target_marker=Ir(n,e),t.peak_marker=Lr(n,e),t.floor_marker=Rn(n,e);let r=n.markers===void 0?{markers:Fn((s=e==null?void 0:e.generic_markers)!=null?s:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:En(n.markers,t);return t.generic_markers=r.markers,t.generic_markers_invalid=r.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function Qe(n){var a;let e=nr(n),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...n};t._height_explicit=((a=n==null?void 0:n.layout)==null?void 0:a.height)!==void 0||(n==null?void 0:n.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(s=>typeof s=="string"?{entity:s}:s);let r={...t,_normalized:!0};Object.defineProperty(r,ji,{value:e,enumerable:!1}),r.layout=Nr(t,null),r.scale=We(n,null),r.bar=Fe(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),r.baseline=Gr(t,null),r.formatting=Ar(t,null),r.target_marker=Ir(t,null),r.peak_marker=Lr(t,null),r.floor_marker=Rn(t,null);let i=En(t.markers,r);return r.generic_markers=i.markers,r.generic_markers_invalid=i.invalidList,r.entities=t.entities.map(s=>Ki(s,r)),r}var ji,Ii,xe=U(()=>{ir();ji=Symbol("sbcp.paintExplicitness"),Ii=Symbol("sbcp.explicitSegmentSpace")});function et(n,e){var i;if(!e||!((i=n==null?void 0:n.states)!=null&&i[e]))return null;let t=n.states[e].state,r=parseFloat(t);return Number.isFinite(r)?r:null}function ze(n,e,t=null){let r=et(n,t);if(r!==null)return r;if(e==null||e==="")return null;let i=parseFloat(e);return Number.isFinite(i)?i:null}function Ji(n,e,t){if(!Number.isFinite(n))return null;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100;return r+n/100*(i-r)}function Oe(n,e,t=null,r=null){var s;if(!e)return null;let i=et(n,e.entity);if(i!==null)return i;let a=ze(n,(s=e.fixed)!=null?s:e.value,null);return a!==null?a:Number.isFinite(e.percent)?Ji(e.percent,t,r):null}function jr(n,e,t=null){var l,o,d,c,u,h,p,f,b,g,_,y;let r=m=>Number.isFinite(m==null?void 0:m.min)&&Number.isFinite(m==null?void 0:m.max)&&m.min<m.max,i={min:ze(null,(d=(l=e==null?void 0:e.min)==null?void 0:l.fixed)!=null?d:(o=e==null?void 0:e.min)==null?void 0:o.value),max:ze(null,(h=(c=e==null?void 0:e.max)==null?void 0:c.fixed)!=null?h:(u=e==null?void 0:e.max)==null?void 0:u.value)};if((p=e==null?void 0:e.min)!=null&&p.entity&&((f=e==null?void 0:e.max)!=null&&f.entity)){let m={min:et(n,e.min.entity),max:et(n,e.max.entity)};return r(m)?m:Number.isFinite(m.min)&&Number.isFinite(m.max)&&r(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&r(i)?i:{min:0,max:100}}let a={min:(b=Oe(n,e==null?void 0:e.min))!=null?b:0,max:(g=Oe(n,e==null?void 0:e.max))!=null?g:100};if(r(a))return a;let s={min:(_=i.min)!=null?_:0,max:(y=i.max)!=null?y:100};return r(s)?s:{min:0,max:100}}var lr=U(()=>{xe()});function Rs(n,e,t,r=null){return{code:n,message:e,path:t,entity:r}}function Ur(n){var e;return!n||n.entity||Number.isFinite(n.percent)?null:J((e=n.fixed)!=null?e:n.value)}function L(n,e,t,r,i=null){n.warnings.push(Rs(e,t,r,i))}function Ds(n,e,t,r=null){var s,l;if((s=e==null?void 0:e.min)!=null&&s.entity&&((l=e==null?void 0:e.max)!=null&&l.entity)){let o=d=>{var c,u;return d.fixed_explicit!==!1&&((c=d.fixed)!=null?c:d.value)!==null&&((u=d.fixed)!=null?u:d.value)!==void 0};o(e.min)!==o(e.max)&&L(n,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,r)}let i=Ur(e==null?void 0:e.min),a=Ur(e==null?void 0:e.max);return Number.isFinite(i)&&Number.isFinite(a)&&i>a&&L(n,"scale.min_gt_max","Scale minimum is greater than maximum.",t,r),{min:i,max:a}}function Cs(n,e,t,r,i=null){var o;let a=Ur((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(a))return;let{min:s,max:l}=t;Number.isFinite(s)&&Number.isFinite(l)&&(a<s||a>l)&&L(n,"target.outside_scale","Fixed target value is outside the fixed scale range.",r,i)}function zs(n,e,t,r,i=null){var o;let a=Ur((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(a))return;let{min:s,max:l}=t;Number.isFinite(s)&&Number.isFinite(l)&&(a<s||a>l)&&L(n,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",r,i)}function Os(n){var e;return!!n&&(Number.isFinite(J((e=n.fixed)!=null?e:n.value))||Number.isFinite(n.percent)||!!n.entity)}function Bs(n,e,t,r=null){var s,l,o,d;let i=((l=(s=e==null?void 0:e.bar)==null?void 0:s.needle)==null?void 0:l.show)===!0,a=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&Os((d=e==null?void 0:e.baseline)==null?void 0:d.at);i&&a&&L(n,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,r)}function Gs(n,e,t,r=null){var i;for(let a of["peak_marker","floor_marker"])(i=e==null?void 0:e[a])!=null&&i.reset_invalid&&L(n,`${a}.invalid_reset`,"Invalid marker reset; using never.",`${t}.${a}.reset`,r)}function Ns(n,e,t,r=null){var i;for(let a of["target_marker","peak_marker","floor_marker"])(i=e==null?void 0:e[a])!=null&&i.direction_invalid&&L(n,`${a}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${a==="target_marker"?"target":a.replace("_marker","")}.direction`,r)}function As(n,e,t,r=null){var i;for(let[a,s]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let l=e==null?void 0:e[a],o=`${t}.${s}.label`;l!=null&&l.label_invalid_show&&L(n,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,r),l!=null&&l.label_invalid_text&&L(n,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,r),l!=null&&l.label_invalid_show_value&&L(n,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,r),l!=null&&l.label_invalid_show_unit&&L(n,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,r),l!=null&&l.label_invalid_precision&&L(n,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(i=l.label_precision_key)!=null?i:"precision"}`,r),l!=null&&l.label_unsupported_unit&&L(n,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,r)}}function Xi(n,e,t,r,i=null){var a,s,l,o,d,c,u,h;t&&L(n,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",r,i);for(let p of e!=null?e:[]){let f=`${r}[${p.index}]`;if(p.malformed){L(n,"markers.invalid_item","Marker must be an object; ignoring this item.",f,i);continue}p.invalidSource&&!p.invalidPercentage&&!p.unsupportedPercentField&&L(n,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${f}.at`,i),p.invalidPercentage&&L(n,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${f}.at`,i),p.unsupportedPercentField&&L(n,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${f}.at`,i),p.invalidLane&&L(n,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${f}.lane`,i),p.invalidShape&&L(n,"markers.invalid_shape","Invalid marker shape; using circle.",`${f}.shape`,i),p.invalidDirection&&L(n,"markers.invalid_direction","Invalid marker direction; using inward.",`${f}.direction`,i),p.invalidShowMarker&&L(n,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${f}.show_marker`,i),(a=p.label)!=null&&a.invalidEntity&&L(n,"markers.invalid_label_entity","Marker label entity must be a valid entity ID; ignoring it.",`${f}.label.entity`,i),(s=p.label)!=null&&s.invalidShow&&L(n,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${f}.label.show`,i),(l=p.label)!=null&&l.invalidText&&L(n,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${f}.label.text`,i),(o=p.label)!=null&&o.invalidShowValue&&L(n,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${f}.label.show_value`,i),(d=p.label)!=null&&d.invalidShowUnit&&L(n,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${f}.label.show_unit`,i),(c=p.label)!=null&&c.invalidPrecision&&L(n,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${f}.label.${(u=p.label.invalidPrecisionKey)!=null?u:"precision"}`,i),(h=p.label)!=null&&h.unsupportedUnit&&L(n,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${f}.label.unit`,i),p.valid&&!p.accepted&&L(n,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",f,i)}}function Dn(n){var e;return!n||n.entity||Number.isFinite(n.percent)?null:J((e=n.fixed)!=null?e:n.value)}function Is(n,e,t,r,i=null){if(!Array.isArray(e)||!e.length)return;let a=[],{min:s,max:l}=t;for(let d=0;d<e.length;d+=1){let c=e[d],u=Dn(c==null?void 0:c.from),h=Dn(c==null?void 0:c.to),p=`${r}.segments[${d}]`;if((c==null?void 0:c.invalidBoundary)==="entity"){L(n,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",p,i);continue}if((c==null?void 0:c.invalidBoundary)==="malformed_percent"){L(n,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",p,i);continue}if(c!=null&&c.invalidBoundary){L(n,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',p,i);continue}Number.isFinite(u)&&Number.isFinite(h)&&u>h&&L(n,"segments.from_gt_to","Segment start is greater than segment end.",p,i),Number.isFinite(s)&&Number.isFinite(l)&&(Number.isFinite(u)&&(u<s||u>l)&&L(n,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,i),Number.isFinite(h)&&(h<s||h>l)&&L(n,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,i)),Number.isFinite(u)&&Number.isFinite(h)&&a.push({from:u,to:h,path:p})}let o=[...a].sort((d,c)=>d.from-c.from);for(let d=1;d<o.length;d+=1){let c=o[d-1],u=o[d];u.from<c.to&&L(n,"segments.overlap","Fixed segments overlap.",u.path,i)}}function Ls(n,e,t,r=null){var a;if(!Array.isArray(e))return;let i=new Set;for(let s=0;s<e.length;s+=1){let l=J((a=e[s])==null?void 0:a.pos),o=`${t}.gradient_stops[${s}]`;Number.isFinite(l)&&(l<0||l>100)&&L(n,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,r),Number.isFinite(l)&&(i.has(l)?L(n,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,r):i.add(l))}}function Cn(n,e,t,r=null){var a,s;let i=Ds(n,e==null?void 0:e.scale,t,r);Cs(n,e,i,t,r),zs(n,e,i,t,r),Bs(n,e,t,r),Gs(n,e,t,r),Ns(n,e,t,r),As(n,e,t,r),Is(n,(a=e==null?void 0:e.bar)==null?void 0:a.segments,i,`${t}.bar`,r),Ls(n,(s=e==null?void 0:e.bar)==null?void 0:s.gradient_stops,`${t}.bar`,r)}function qr(n){var i,a;let e={warnings:[],errors:[]};if(!n||typeof n!="object")return e;Cn(e,n,"card"),Xi(e,n.generic_markers,n.generic_markers_invalid,"markers");let t=new Set,r=Array.isArray(n.entities)?n.entities:[];for(let s=0;s<r.length;s+=1){let l=r[s],o=(i=l==null?void 0:l.entity)!=null?i:null,d=`entities[${s}]`;if(!o){L(e,"entities.missing_entity","Entity row is missing an entity id.",d,null);continue}if(t.has(o)?L(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",d,o):t.add(o),Cn(e,l,d,o),Object.prototype.hasOwnProperty.call(l,"markers"))Xi(e,l.generic_markers,l.generic_markers_invalid,`${d}.markers`,o);else{let c=((a=l.generic_markers)!=null?a:[]).filter(u=>{var h,p;return u.valid&&!u.accepted&&((p=(h=n.generic_markers)==null?void 0:h[u.index])==null?void 0:p.accepted)===!0});c.length&&Xi(e,c,!1,`${d}.markers`,o)}}return e}var Yi=U(()=>{xe()});function Be(n,e=null){return Number.isFinite(n)?e!==null?n.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):n.toLocaleString():String(n)}function Zi(n){return["h","m","s"].includes(String(n||"").trim())}function Qi(n,e){if(!e)return String(n);let t=String(e);return`${n}${Zi(t)?"":" "}${t}`}function or(n,e,t=null){let r=Be(n,t),i=e?String(e):"";return{value:n,number:r,unit:i,text:Qi(r,i)}}function dr(n,e,t=null,r={}){let i=typeof r.text=="string"?r.text:"",a=r.showValue===!1||n===null||n===void 0||n===""?"":Number.isFinite(n)?Be(n,t):String(n),s=r.showUnit===!1?"":String(e!=null?e:"").trim(),l=[i,a,s].filter(Boolean).join(" ");return{value:Number.isFinite(n)?n:null,semanticText:i,number:a,unit:s,showValue:r.showValue!==!1,showUnit:r.showUnit!==!1,text:l}}function zn(n){let e=String(n);return{value:null,number:e,unit:"",text:e}}var Wr=U(()=>{});function On(n){return n?n.entity!==null&&n.entity!==void 0&&n.entity!==""||n.fixed!==null&&n.fixed!==void 0&&n.fixed!==""||Number.isFinite(n.percent):!1}function Kr(n,e="circle"){return js.has(n)?n:e}function Hr({id:n,type:e,value:t=null,position:r=null,lane:i,visible:a=!1,color:s=null,label:l=null,labelVisible:o=!1,shape:d="circle",direction:c="inward",showMarker:u=!0}){return{id:n,type:e,value:t,position:r,lane:i,visible:a===!0,color:s,label:l,labelVisible:o===!0,shape:Kr(d),direction:c,showMarker:u!==!1}}function Re(n){return!!(typeof(n==null?void 0:n.text)=="string"&&n.text.trim())||(n==null?void 0:n.showValue)!==!1||(n==null?void 0:n.showUnit)!==!1}function Jr(n){var a;let e=n==null?void 0:n.target_marker,t=n==null?void 0:n.peak_marker,r=n==null?void 0:n.floor_marker,i=((a=n==null?void 0:n.generic_markers)!=null?a:[]).filter(s=>s.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&On(e==null?void 0:e.source)||(r==null?void 0:r.show)===!0||i.some(s=>s.lane==="below"),above:(t==null?void 0:t.show)===!0||i.some(s=>s.lane==="above")}}function Xr(n){var a;let e=n==null?void 0:n.target_marker,t=n==null?void 0:n.peak_marker,r=n==null?void 0:n.floor_marker,i=((a=n==null?void 0:n.generic_markers)!=null?a:[]).filter(s=>s.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&On(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&Re({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(r==null?void 0:r.show)===!0&&(r==null?void 0:r.show_label)===!0&&Re({text:r.label_text,showValue:r.label_show_value,showUnit:r.label_show_unit})||i.some(s=>{var l;return s.lane==="below"&&((l=s.label)==null?void 0:l.show)===!0&&Re(s.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&Re({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||i.some(s=>{var l;return s.lane==="above"&&((l=s.label)==null?void 0:l.show)===!0&&Re(s.label)})}}function Yr({entityConfig:n,targetValue:e=null,targetPosition:t=null,targetPresentation:r=null,targetLabelPresentation:i=null,targetVisible:a=Number.isFinite(t),peakValue:s=null,peakPosition:l=null,peakPresentation:o=null,peakLabelPresentation:d=null,peakVisible:c=Number.isFinite(l),floorValue:u=null,floorPosition:h=null,floorPresentation:p=null,floorLabelPresentation:f=null,floorVisible:b=Number.isFinite(h),genericMarkers:g=[]}){var S,w,k,M,$,T,B;let _=n==null?void 0:n.target_marker,y=n==null?void 0:n.peak_marker,m=n==null?void 0:n.floor_marker,v=(_==null?void 0:_.enabled)!==!1;return[Hr({id:"target",type:"target",value:e,position:t,lane:"below",visible:v&&a,color:(S=_==null?void 0:_.color)!=null?S:null,label:i!=null?i:r,labelVisible:v&&(_==null?void 0:_.show_label)===!0&&Re({text:_.label_text,showValue:_.label_show_value,showUnit:_.label_show_unit}),shape:(w=_==null?void 0:_.shape)!=null?w:"diamond",direction:(k=_==null?void 0:_.direction)!=null?k:"inward"}),Hr({id:"floor",type:"floor",value:u,position:h,lane:"below",visible:(m==null?void 0:m.show)===!0&&b,color:(M=m==null?void 0:m.color)!=null?M:null,label:f!=null?f:p,labelVisible:(m==null?void 0:m.show)===!0&&(m==null?void 0:m.show_label)===!0&&Re({text:m.label_text,showValue:m.label_show_value,showUnit:m.label_show_unit}),shape:"triangle",direction:($=m==null?void 0:m.direction)!=null?$:"inward"}),Hr({id:"peak",type:"peak",value:s,position:l,lane:"above",visible:(y==null?void 0:y.show)===!0&&c,color:(T=y==null?void 0:y.color)!=null?T:null,label:d!=null?d:o,labelVisible:(y==null?void 0:y.show)===!0&&(y==null?void 0:y.show_label)===!0&&Re({text:y.label_text,showValue:y.label_show_value,showUnit:y.label_show_unit}),shape:"triangle",direction:(B=y==null?void 0:y.direction)!=null?B:"inward"}),...g.map(E=>Hr({id:E.id,type:"generic",value:E.value,position:E.position,lane:E.lane,visible:E.visible,color:E.color,label:E.label,labelVisible:E.labelVisible&&Re(E.label),shape:E.shape,direction:E.direction,showMarker:E.showMarker}))]}var js,Zr=U(()=>{js=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function Us(n,e=""){var a,s,l;let t=String((s=(a=n==null?void 0:n.attributes)==null?void 0:a.device_class)!=null?s:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let r=String(e||"").split(".")[0];return(l={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[r])!=null?l:null}function tt(n,e,t){if(!Number.isFinite(n))return null;let r=Number.isFinite(e)?e:0,a=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(n-r)/a*100))}function qs(n){let e=String(n||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],a=i.length===3?i.split("").map(s=>s+s).join(""):i;return{r:parseInt(a.slice(0,2),16),g:parseInt(a.slice(2,4),16),b:parseInt(a.slice(4,6),16)}}let r=e.match(/^rgba?\(([^)]+)\)$/i);if(r){let i=r[1].split(",").map(a=>a.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function Bn(n){let e=qs(n);if(!e)return"#000000";let t=i=>{let a=i/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function Ws(n,e,t,r,i){var o,d,c;let a=(o=n==null?void 0:n.bar)==null?void 0:o.needle;if(!(a!=null&&a.show)||Number.isFinite(i)||!Number.isFinite(e)){let u=(d=a==null?void 0:a.color)!=null?d:"#ffffff";return{show:!1,percent:null,pct:null,color:u,borderColor:Bn(u),edge:"middle"}}let s=(c=a.color)!=null?c:"#ffffff",l=Math.min(100,Math.max(0,tt(e,t,r)));return{show:!0,percent:l,pct:l,color:s,borderColor:Bn(s),edge:l<=0?"left":l>=100?"right":"middle"}}function Gn(n,e,t,r,i,a){if(!a)return{value:null,percent:null,display:null,visible:!1};let s=J(r==null?void 0:r.value);if(!Number.isFinite(s)&&!Number.isFinite(n))return{value:null,percent:null,visible:!1};let l=Number.isFinite(s)?Number.isFinite(n)?i==="min"?Math.min(s,n):Math.max(s,n):s:n;return{value:l,percent:tt(l,e,t),visible:!0}}function cr(n){var ee,H,te,oe,ae,_e,de,Ve,Ce,Ie,Le,$r,Et,Pt,Tt,Rt,Dt,Ct,zt,Ot,Bt,Gt,Nt,At,It,Lt,jt,Ut,qt,Wt,Ht,Kt,Jt,Xt,Yt,Zt,Qt,er,pe,tr,rr,Ka,Ja,Xa,Ya,Za,Qa,en,tn,rn,an,nn,sn,ln,on,dn,cn,un,hn,fn,pn,mn;let{hass:e,cardConfig:t,entityConfig:r,entityState:i,peaks:a,extrema:s,previousScale:l}=n,o=(ee=r==null?void 0:r.entity)!=null?ee:null,d=(H=i==null?void 0:i.state)!=null?H:"",c=J(d),u=(oe=(te=i==null?void 0:i.attributes)==null?void 0:te.unit_of_measurement)!=null?oe:"",h=(ae=r==null?void 0:r.formatting)==null?void 0:ae.unit,p=(_e=h!=null?h:u)!=null?_e:"",f=c!==null?p:"",{min:b,max:g}=jr(e,r==null?void 0:r.scale,l),_=c!==null?tt(c,b,g):0,y=(Ve=(de=r==null?void 0:r.formatting)==null?void 0:de.decimal)!=null?Ve:null,m=c===null?zn(d):or(c,f,y),v=((Ce=r==null?void 0:r.target_marker)==null?void 0:Ce.enabled)===!1?null:Oe(e,(Ie=r==null?void 0:r.target_marker)==null?void 0:Ie.source,b,g),S=v!==null?tt(v,b,g):null,w=v!==null,k=($r=(Le=r==null?void 0:r.target_marker)==null?void 0:Le.label_decimal)!=null?$r:y,M=v!==null?or(v,p,k):null,$=v!==null?dr(v,p,(Pt=(Et=r==null?void 0:r.target_marker)==null?void 0:Et.label_precision)!=null?Pt:k,{text:(Tt=r==null?void 0:r.target_marker)==null?void 0:Tt.label_text,showValue:(Rt=r==null?void 0:r.target_marker)==null?void 0:Rt.label_show_value,showUnit:(Dt=r==null?void 0:r.target_marker)==null?void 0:Dt.label_show_unit}):null,T=((Ct=r==null?void 0:r.baseline)==null?void 0:Ct.enabled)===!1?null:Oe(e,(zt=r==null?void 0:r.baseline)==null?void 0:zt.at,b,g),B=Number.isFinite(T)?tt(T,b,g):null,E=Number.isFinite(T),z=Number.isFinite(J(a==null?void 0:a[o]))?{value:J(a==null?void 0:a[o])}:null,C=Gn(c,b,g,(Ot=s==null?void 0:s.peak)!=null?Ot:z,"max",((Bt=r==null?void 0:r.peak_marker)==null?void 0:Bt.show)===!0),O=Gn(c,b,g,s==null?void 0:s.floor,"min",((Gt=r==null?void 0:r.floor_marker)==null?void 0:Gt.show)===!0),A=(At=(Nt=r==null?void 0:r.peak_marker)==null?void 0:Nt.label_decimal)!=null?At:y,I=(Lt=(It=r==null?void 0:r.floor_marker)==null?void 0:It.label_decimal)!=null?Lt:y,X=(Ut=(jt=r==null?void 0:r.peak_marker)==null?void 0:jt.label_precision)!=null?Ut:A,Y=(Wt=(qt=r==null?void 0:r.floor_marker)==null?void 0:qt.label_precision)!=null?Wt:I,Z=C.visible?or(C.value,p,A):null,Q=O.visible?or(O.value,p,I):null,he=C.visible?dr(C.value,p,X,{text:(Ht=r==null?void 0:r.peak_marker)==null?void 0:Ht.label_text,showValue:(Kt=r==null?void 0:r.peak_marker)==null?void 0:Kt.label_show_value,showUnit:(Jt=r==null?void 0:r.peak_marker)==null?void 0:Jt.label_show_unit}):null,se=O.visible?dr(O.value,p,Y,{text:(Xt=r==null?void 0:r.floor_marker)==null?void 0:Xt.label_text,showValue:(Yt=r==null?void 0:r.floor_marker)==null?void 0:Yt.label_show_value,showUnit:(Zt=r==null?void 0:r.floor_marker)==null?void 0:Zt.label_show_unit}):null,le=((Qt=r==null?void 0:r.generic_markers)!=null?Qt:[]).filter(fe=>fe.accepted).map(fe=>{var yn,vn,Sn,xn,wn;let Mr=Oe(e,fe.source,b,g),bn=Number.isFinite(Mr),_s=(yn=fe.label.precision)!=null?yn:y,je=fe.label.entity?(vn=e==null?void 0:e.states)==null?void 0:vn[fe.label.entity]:null,_n=je==null?void 0:je.state,Vr=typeof _n=="string"?_n.trim():"",gn=je&&Vr&&!["unknown","unavailable"].includes(Vr.toLowerCase()),gs=fe.label.entity?gn?(Sn=J(Vr))!=null?Sn:Vr:null:Mr,ys=fe.label.entity?gn&&(wn=(xn=je==null?void 0:je.attributes)==null?void 0:xn.unit_of_measurement)!=null?wn:"":p,vs=fe.label.show?dr(gs,ys,_s,{text:fe.label.text,showValue:fe.label.showValue,showUnit:fe.label.showUnit}):null;return{id:fe.id,value:Mr,position:bn?tt(Mr,b,g):null,lane:fe.lane,visible:bn,color:fe.color,shape:fe.shape,direction:fe.direction,showMarker:fe.showMarker,label:vs,labelVisible:fe.label.show}}),W=Yr({entityConfig:r,targetValue:v,targetPosition:S,targetPresentation:M,targetLabelPresentation:$,targetVisible:w,peakValue:C.value,peakPosition:C.percent,peakPresentation:Z,peakLabelPresentation:he,peakVisible:C.visible,floorValue:O.value,floorPosition:O.percent,floorPresentation:Q,floorLabelPresentation:se,floorVisible:O.visible,genericMarkers:le});return{entityId:o,name:(tr=(pe=r==null?void 0:r.name)!=null?pe:(er=i==null?void 0:i.attributes)==null?void 0:er.friendly_name)!=null?tr:o,icon:(r==null?void 0:r.icon)===!1?!1:(Ja=(Ka=r==null?void 0:r.icon)!=null?Ka:(rr=i==null?void 0:i.attributes)==null?void 0:rr.icon)!=null?Ja:Us(i,o),state:d,numericValue:c,rawUnit:u,min:b,max:g,percent:_,displayValue:m.number,displayUnit:m.unit,primaryPresentation:m,unit:m.unit,barColor:(Ya=(Xa=r==null?void 0:r.bar)==null?void 0:Xa.color)!=null?Ya:null,fillStyle:(Qa=(Za=r==null?void 0:r.bar)==null?void 0:Za.fill_style)!=null?Qa:null,target:v,targetPercent:S,targetDisplay:(en=M==null?void 0:M.text)!=null?en:null,targetPresentation:M,targetLabelPresentation:$,targetVisible:w,baseline:T,baselinePercent:B,baselineVisible:E,peak:C.value,peakPercent:C.percent,peakDisplay:(tn=Z==null?void 0:Z.number)!=null?tn:null,peakPresentation:Z,peakLabelPresentation:he,peakVisible:C.visible,floor:O.value,floorPercent:O.percent,floorDisplay:(rn=Q==null?void 0:Q.number)!=null?rn:null,floorPresentation:Q,floorLabelPresentation:se,floorVisible:O.visible,markers:W,markerLaneOccupancy:Jr(r),markerLabelLaneOccupancy:Xr(r),segments:(nn=(an=r==null?void 0:r.bar)==null?void 0:an.segments)!=null?nn:null,gradientStops:(ln=(sn=r==null?void 0:r.bar)==null?void 0:sn.gradient_stops)!=null?ln:null,needle:Ws(r,c,b,g,B),classes:{labelPosition:(cn=(dn=(on=r==null?void 0:r.layout)==null?void 0:on.label)==null?void 0:dn.position)!=null?cn:"left",animated:((un=r==null?void 0:r.bar)==null?void 0:un.animated)!==!1},attributes:{entity:o,baseHeight:(fn=(hn=r==null?void 0:r.layout)==null?void 0:hn.height)!=null?fn:38,heightExplicit:((pn=r==null?void 0:r.layout)==null?void 0:pn.height_explicit)===!0,barAnimated:((mn=r==null?void 0:r.bar)==null?void 0:mn.animated)!==!1}}}var ea=U(()=>{lr();xe();Wr();Zr()});function me(n){return n==null?"":String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ue(n,e,t){var a,s;if(!(n!=null&&n.style))return!1;let r=t==null?"":String(t);return e.startsWith("--")?(typeof n.style.getPropertyValue=="function"?n.style.getPropertyValue(e):(a=n.style[e])!=null?a:"")===r?!1:(typeof n.style.setProperty=="function"?n.style.setProperty(e,r):n.style[e]=r,!0):((s=n.style[e])!=null?s:"")===r?!1:(n.style[e]=r,!0)}function rt(n,e){var i;if(!(n!=null&&n.style))return!1;let t=e==null?"":String(e);return((i=n.style.cssText)!=null?i:"")===t?!1:(n.style.cssText=t,!0)}function Ee(n,e,t){var a;if(!(n!=null&&n.dataset))return!1;let r=t==null?"":String(t);return((a=n.dataset[e])!=null?a:"")===r?!1:(n.dataset[e]=r,!0)}function Qr(n,e){var r;if(!n)return!1;let t=e==null?"":String(e);return((r=n.className)!=null?r:"")===t?!1:(n.className=t,!0)}var ei=U(()=>{});function li(n,e){if(!n||!e||!Number.isFinite(n.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(n.baselinePercent)?n.baselinePercent:0,r=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,i=Math.max(Math.abs(e.valuePercent-n.valuePercent),Math.abs(r-t)),a=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,i-5))));return Number.isFinite(n.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(n.valuePercent-n.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(a,300):a}function ti(n,e=null){let t=[...n].sort((r,i)=>r.from-i.from);return t.map((r,i)=>{var s;let a=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(a)&&i<t.length-1&&(a=t[i+1].from),!Number.isFinite(a)&&Number.isFinite(e)&&(a=e),{from:r.from,to:a,color:r.color,label:(s=r.label)!=null?s:null}})}function at(n){if(!n||typeof n!="string")return null;let e=n.replace("#","").trim(),t=e.length===3?e.split("").map(r=>r+r).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function oi(n,e=0,t=100,r=!1){let a=Ne(n,e,t).filter(l=>Number.isFinite(l==null?void 0:l.from)&&Number.isFinite(l==null?void 0:l.to)&&(l==null?void 0:l.color)).sort((l,o)=>l.from-o.from);if(!a.length)return[];let s=[];for(let l=0;l<a.length;l++){let o=a[l],d=at(o.color);if(!d&&!r)continue;let c;l===0?c=o.from:l===a.length-1?c=o.to:c=o.from+(o.to-o.from)/2,(!s.length||s[s.length-1].p!==c)&&s.push({p:c,...d!=null?d:{color:o.color}})}return s}function ta(n,e=0,t=100){let i=Ne(n,e,t).filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&(s==null?void 0:s.color)).sort((s,l)=>s.from-l.from);if(!i.length)return null;let a=[];for(let s of i)a.push(`${s.color} ${s.from}%`,`${s.color} ${s.to}%`);return`linear-gradient(to right, ${a.join(", ")})`}function ra(){return 1.5}function Ge(n,e,t){if(!Array.isArray(n)||!t)return;let r=Math.min(100,Math.max(0,e)),i=n[n.length-1];i&&i.color===t&&Math.abs(i.p-r)<1e-4||n.push({p:r,color:t})}function hr(n,e=0,t=100){let i=Ne(n,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,d)=>o.from-d.from);if(!i.length)return[];let a=ra(),s=a/2,l=[];Ge(l,i[0].from,i[0].color);for(let o=0;o<i.length-1;o++){let d=i[o],c=i[o+1],u=d.to,h=d.to-d.from,p=c.to-c.from;h>=a&&p>=a?(Ge(l,Math.max(d.from,u-s),d.color),Ge(l,Math.min(c.to,u+s),c.color)):(Ge(l,u,d.color),Ge(l,u,c.color))}return Ge(l,i[i.length-1].to,i[i.length-1].color),l}function ia(n,e=0,t=100){let r=hr(n,e,t);return r.length?`linear-gradient(to right, ${r.map(i=>`${i.color} ${i.p}%`).join(", ")})`:null}function ri(n,e,t){if(n==null)return null;if(typeof n=="object"&&!Array.isArray(n)){let a=J(n.fixed);return Number.isFinite(a)?ur(a,e,t):Number.isFinite(n.percent)?n.percent:null}let r=Me(n);if(Number.isFinite(r))return r;let i=J(n);return Number.isFinite(i)?ur(i,e,t):null}function fr(n){var e,t,r,i;return(i=(r=(e=n==null?void 0:n.bar)==null?void 0:e.fill_style)!=null?r:sr((t=n==null?void 0:n.bar)==null?void 0:t.color_mode))!=null?i:"bands"}function aa(n){return Array.isArray(n)&&n.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Ne(n,e=0,t=100){var s,l;let r=Number.isFinite(e)?e:0,i=Number.isFinite(t)?t:100,a=(Array.isArray((s=n.bar)==null?void 0:s.segments)?n.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((l=n.bar)==null?void 0:l.segment_space)==="scale"||aa(a)){let o=a.map(d=>{var c;return{from:ri(d.from,r,i),to:ri(d.to,r,i),color:d.color,label:(c=d.label)!=null?c:null}}).filter(d=>Number.isFinite(d.from)&&d.color);return ti(o,100).filter(d=>Number.isFinite(d.from)&&Number.isFinite(d.to)&&d.color)}return ti(a,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.color)}function na(n,e,t=0,r=100){let i=fr(e);if(i==="solid")return e.bar.color;if(i==="gradient"||i==="band_gradient"||i==="soft_bands"){let a;if(i==="band_gradient"?a=oi(e,t,r):i==="soft_bands"?a=hr(e,t,r).map(d=>{let c=at(d.color);return c?{p:d.p,...c}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(a=e.bar.gradient_stops.map(d=>{let c=d.color.replace("#",""),u=c.length===3?c.split("").map(h=>h+h).join(""):c;return{p:d.pos,r:parseInt(u.slice(0,2),16),g:parseInt(u.slice(2,4),16),b:parseInt(u.slice(4,6),16)}}),a.sort((d,c)=>d.p-c.p)):a=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!a||!a.length)return e.bar.color;let s=a[0],l=a[a.length-1];for(let d=0;d<a.length-1;d++)if(n>=a[d].p&&n<=a[d+1].p){s=a[d],l=a[d+1];break}let o=s.p===l.p?0:(n-s.p)/(l.p-s.p);return`rgb(${Math.round(s.r+o*(l.r-s.r))},${Math.round(s.g+o*(l.g-s.g))},${Math.round(s.b+o*(l.b-s.b))})`}for(let a of Ne(e,t,r))if(n>=a.from&&n<=a.to)return a.color;return e.bar.color}function sa(n){if(!Array.isArray(n)||!n.length)return null;let e=n.map(t=>{var i;let r=(i=t.color)!=null?i:oa(t);return r?`${r} ${t.p}%`:null}).filter(Boolean);return e.length?`background:linear-gradient(to right,${e.join(",")});background-repeat:no-repeat;`:null}function la(n,e=0,t=100){let r=fr(n);return r==="band_gradient"?oi(n,e,t,!0):r==="soft_bands"?hr(n,e,t).map(i=>{let a=at(i.color);return a?{p:i.p,...a}:null}).filter(Boolean).sort((i,a)=>i.p-a.p):n.bar.gradient_stops&&n.bar.gradient_stops.length>=2?n.bar.gradient_stops.map(i=>{let a=at(i.color);return a?{p:i.pos,...a}:null}).filter(Boolean).sort((i,a)=>i.p-a.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function oa(n){return n?`rgb(${n.r},${n.g},${n.b})`:null}function ii(n){return`linear-gradient(to right,${n} 0%,${n} 100%)`}function da(n,e,t=0,r=100){var a;let i=fr(e);if(e.bar.solid_fill)return ii(n);if(i==="bands")return ta(e,t,r);if(i==="soft_bands")return ia(e,t,r);if(i==="gradient"||i==="band_gradient"){let s=la(e,t,r);return(a=sa(s))==null?void 0:a.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return ii(n)}function ai(n,e,t){if(!t)return null;let r=Math.min(100,Math.max(0,n)),i=Math.min(100,Math.max(0,e));return i<=r?null:`linear-gradient(to right,transparent 0%,transparent ${r}%,${t} ${r}%,${t} ${i}%,transparent ${i}%,transparent 100%)`}function ur(n,e,t){if(!Number.isFinite(n))return null;let r=Number.isFinite(e)?e:0,a=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(n-r)/a*100))}function ni(n,e=null){let t=Math.min(100,Math.max(0,n));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let r=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,r),end:Math.max(t,r),positive:t>=r,baseline:r,hidden:t===r}}function ca(n){return n!=null&&n.endpointSemantics?n.endpointSemantics:n!=null&&n.usesBaseline?n.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function ua(n){let e=ca(n),t=a=>a==="value"||a==="range"||a==="scale",r=t(e.left)?"6px":"0",i=t(e.right)?"6px":"0";return`${r} ${i} ${i} ${r}`}function ha(n=null){if(!Number.isFinite(n))return null;let e=Math.min(100,Math.max(0,n));return e>=100?null:{start:e,end:100}}function fa(n=null){let e=ha(n);return e?{start:e.start,end:e.end,hidden:!1}:null}function pa(n,e,t=null,r=null,i=0,a=100){var d,c,u,h,p,f;let s=[],l=da(e,n,i,a),o=Number.isFinite(r)?Math.min(100,Math.max(0,r)):null;if(Number.isFinite(o)){let b=(u=(c=(d=n.baseline)==null?void 0:d.below)==null?void 0:c.color)!=null?u:null,g=(f=(p=(h=n.baseline)==null?void 0:h.above)==null?void 0:p.color)!=null?f:null,_=ai(0,o,b),y=ai(o,100,g);_&&s.push(_),y&&s.push(y)}return l&&s.push(l),s.length?`display:block;inset:0;background-image:${s.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function ma(n,e){var c,u;let t=typeof e=="number"?`${e}px`:e,r=Math.min(100,Math.max(0,(c=n==null?void 0:n.start)!=null?c:0)),i=Math.min(100,Math.max(0,(u=n==null?void 0:n.end)!=null?u:0));if(n!=null&&n.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let a="0",s=`${Math.max(0,100-i)}%`,l="0",o=`${r}%`,d=ua(n);return`display:block;height:${t};clip-path:inset(${a} ${s} ${l} ${o} round ${d});`}function si(n){if(!(n!=null&&n.hidden)&&Number.isFinite(n==null?void 0:n.start)&&Number.isFinite(n==null?void 0:n.end)&&n.end>n.start){let e=Math.min(100,Math.max(0,n.start)),t=Math.min(100,Math.max(0,n.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function ba(n,e,t,r,i=null,a=null,s=0,l=100){var h,p;let d={id:"base",zIndex:1,visible:!0,paintStyle:pa(t,r,i,a,s,l),revealStyle:"display:block;"},c=fa(i),u={id:"above-target",zIndex:2,visible:!!((h=t==null?void 0:t.bar)!=null&&h.above_target_color&&c),paintStyle:(p=t==null?void 0:t.bar)!=null&&p.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:si(c||{start:0,end:0,hidden:!0})};return[d,u]}function _a(n,e,t,r,i=null,a=null,s=0,l=100,o=!1){var u,h;let d=o?ni(100,null):ni(n,a),c=ba(d,e,t,r,i,a,s,l);return{geometry:d,paintLayers:c,paintStyle:(h=(u=c[0])==null?void 0:u.paintStyle)!=null?h:"display:none;",revealStyle:ma(d,e)}}function Nn(n,e,t=0,r=100,i=null){var l,o,d,c,u,h,p,f,b;let a=(l=e==null?void 0:e.bar)==null?void 0:l.needle;if(!(a!=null&&a.show))return{show:!1,pct:null,color:(o=a==null?void 0:a.color)!=null?o:"#ffffff",borderColor:it((d=a==null?void 0:a.color)!=null?d:"#ffffff"),edge:"middle"};if(Number.isFinite(i))return{show:!1,pct:null,color:(c=a.color)!=null?c:"#ffffff",borderColor:it((u=a.color)!=null?u:"#ffffff"),edge:"middle"};if(!Number.isFinite(n))return{show:!1,pct:null,color:(h=a.color)!=null?h:"#ffffff",borderColor:it((p=a.color)!=null?p:"#ffffff"),edge:"middle"};let s=Math.min(100,Math.max(0,ur(n,t,r)));return{show:!0,pct:s,color:(f=a.color)!=null?f:"#ffffff",borderColor:it((b=a.color)!=null?b:"#ffffff"),edge:s<=0?"left":s>=100?"right":"middle"}}function di(n){let e=String(n||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let i=t[1],a=i.length===3?i.split("").map(s=>s+s).join(""):i;return{r:parseInt(a.slice(0,2),16),g:parseInt(a.slice(2,4),16),b:parseInt(a.slice(4,6),16)}}let r=e.match(/^rgba?\(([^)]+)\)$/i);if(r){let i=r[1].split(",").map(a=>a.trim());if(i.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(i[0]))),g:Math.max(0,Math.min(255,parseFloat(i[1]))),b:Math.max(0,Math.min(255,parseFloat(i[2])))}}return null}function ga({r:n,g:e,b:t}){let r=n/255,i=e/255,a=t/255,s=Math.max(r,i,a),l=Math.min(r,i,a),o=(s+l)/2;if(s===l)return{h:0,s:0,l:o*100};let d=s-l,c=o>.5?d/(2-s-l):d/(s+l),u;switch(s){case r:u=((i-a)/d+(i<a?6:0))/6;break;case i:u=((a-r)/d+2)/6;break;default:u=((r-i)/d+4)/6;break}return{h:u*360,s:c*100,l:o*100}}function pr(n){let e=di(n);if(!e)return"#f3f4f6";let{h:t,s:r,l:i}=ga(e),a=Math.abs(i-90)>=Math.abs(i-10)?90:10,s=Math.max(40,Math.min(100,r));return`hsl(${Math.round(t)} ${Math.round(s)}% ${Math.round(a)}%)`}function He(n){var e;return(e=n==null?void 0:n.color)!=null?e:"#888888"}function it(n){let e=di(n);if(!e)return"#000000";let t=i=>{let a=i/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function mr(n,e,{height:t,color:r=na(n.percent,e,n.min,n.max)}={}){var l,o,d,c;let i=n.baselinePercent,a=(l=e.baseline)==null?void 0:l.at,s=((o=e.baseline)==null?void 0:o.enabled)!==!1&&(Number.isFinite(i)||!!(a!=null&&a.entity)||(a==null?void 0:a.fixed)!==null&&(a==null?void 0:a.fixed)!==void 0||Number.isFinite(a==null?void 0:a.percent));return{animated:e.bar.animated,fill:_a(n.percent,t,e,r,n.targetPercent,i,n.min,n.max,n.needle.show),baseline:{configured:s,percent:i},needle:{...n.needle,configured:((c=(d=e.bar)==null?void 0:d.needle)==null?void 0:c.show)&&!Number.isFinite(i)},markers:n.markers}}var br=U(()=>{xe()});function nt(n){var d,c,u,h,p,f,b;if(!n)return"";let e=Number.isFinite(n.position)?n.position:0,t=He(n),r=pr(t),i=n.visible?"":"none",a=n.type==="target"?"diamond":n.type==="generic"?"circle":"triangle",s=Kr(n.shape,a),l=(d=n.lane)!=null?d:n.type==="peak"?"above":"below",o=`<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;if(n.type==="generic"){let g=l==="above"?["peak-inset","peak-outset"]:["target-inset","target-outset"];return`
    <div class="generic-marker" data-marker-id="${me(n.id)}" data-shape="${s}" data-lane="${l}" data-direction="${(c=n.direction)!=null?c:"inward"}" data-show-marker="${n.showMarker===!1?"false":"true"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${i};">
      <div class="${g[0]}"></div>
      <div class="${g[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(u=n.direction)!=null?u:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}return n.type==="target"||n.type==="floor"?`
    <div class="${`${n.type}-marker`}" data-shape="${s}" data-lane="${l}" data-direction="${(h=n.direction)!=null?h:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${i};">
      <div class="${n.type}-inset"></div>
      <div class="${n.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(p=n.direction)!=null?p:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`:`
    <div class="peak-marker" data-shape="${s}" data-lane="${l}" data-direction="${(f=n.direction)!=null?f:"inward"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${i};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(b=n.direction)!=null?b:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${o}</svg>
    </div>`}function st(n,e){var s,l,o,d,c;if(!n||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",r=Kr(e.shape,t);Ee(n,"shape",r),Ee(n,"lane",(s=e.lane)!=null?s:e.type==="peak"?"above":"below"),Ee(n,"direction",(l=e.direction)!=null?l:"inward"),e.type==="generic"&&Ee(n,"showMarker",e.showMarker===!1?"false":"true");let i=(o=n.querySelector)==null?void 0:o.call(n,".marker-shape-svg");i&&(Ee(i,"shape",r),Ee(i,"lane",(d=e.lane)!=null?d:e.type==="peak"?"above":"below"),Ee(i,"direction",(c=e.direction)!=null?c:"inward")),ue(n,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&ue(n,"left",`${e.position}%`);let a=He(e);ue(n,"--marker-color",a),ue(n,"--marker-contrast-color",pr(a))}function ci(n,e,{revealDuration:t=600}={}){var c,u,h;let r=n.querySelector(".bar-fill-reveal"),i=n.querySelector(".baseline-indicator"),a=n.querySelector('.bar-paint-layer[data-layer="base"]');if(r&&(rt(r,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),Qr(r,`bar-fill-reveal${e.animated?"":" no-anim"}`)),i&&(ue(i,"display",Number.isFinite(e.baseline.percent)?"block":"none"),Number.isFinite(e.baseline.percent)&&ue(i,"left",`${e.baseline.percent}%`)),a){let p=e.fill.paintLayers.find(f=>f.id==="base");p&&rt(a,`z-index:${p.zIndex};${p.paintStyle}${p.revealStyle}`)}let s=n.querySelector('.bar-paint-layer[data-layer="above-target"]');if(s){let p=e.fill.paintLayers.find(f=>f.id==="above-target");p&&rt(s,`z-index:${p.zIndex};${p.paintStyle}${p.revealStyle}`)}let l=n.querySelector(".needle-marker");l&&(ue(l,"display",e.needle.show?"block":"none"),ue(l,"left",`${(c=e.needle.pct)!=null?c:0}%`),ue(l,"--needle-color",e.needle.color),ue(l,"--needle-border-color",e.needle.borderColor),Ee(l,"edge",e.needle.edge));let o=e.markers,d=p=>{var f;return(f=o.find(b=>b.id===p||b.type===p))!=null?f:null};st(n.querySelector(".target-marker"),d("target")),st(n.querySelector(".peak-marker"),d("peak")),st(n.querySelector(".floor-marker"),d("floor")),((h=(u=n.querySelectorAll)==null?void 0:u.call(n,".generic-marker[data-marker-id]"))!=null?h:[]).forEach(p=>{st(p,d(p.dataset.markerId))})}function ui(n,{insideContent:e=""}={}){var p;let t=n.fill,r=n.baseline.percent,i=n.needle,a=n.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(r)?`left:${r}%;display:block;`:"display:none;"}"></div>`:"",s=f=>{var b;return(b=n.markers.find(g=>g.id===f||g.type===f))!=null?b:null},l=nt(s("peak")),o=nt(s("target")),d=nt(s("floor")),c=n.markers.filter(f=>f.type==="generic").map(nt).join(""),u=i.configured?`
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${i.edge}" style="left:${(p=i.pct)!=null?p:0}%;--needle-color:${i.color};--needle-border-color:${i.borderColor};display:${i.show?"block":"none"};"></div>
      </div>`:"",h=t.paintLayers.map(f=>`
                  <div class="bar-paint-layer" data-layer="${f.id}" style="z-index:${f.zIndex};${f.paintStyle}${f.revealStyle}"></div>`).join("");return`<div class="bar-track">
                <div class="bar-fill-reveal${n.animated?"":" no-anim"}" style="${t.revealStyle}">
${h}
                </div>
                ${a}
                ${e}
                ${l}
                ${o}
                ${d}
                ${c}
                ${u}
              </div>`}var ya=U(()=>{Zr();br();ei()});var hi,An=U(()=>{Ni();xe();lr();Yi();ea();Zr();ei();Wr();ir();br();ya();hi=class extends HTMLElement{static getConfigElement(){return document.createElement("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._extrema=new WeakMap,this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._rowGeneration+=1,window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var r;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._rowGeneration+=1;let t=this._config;this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((r=t==null?void 0:t.entities)!=null?r:[]),this._diagnostics=qr(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var c,u,h,p;let t=(f,b="")=>{if(Array.isArray(f))return f.map(t);if(f&&typeof f=="object")return Object.fromEntries(Object.keys(f).sort().filter(g=>!["severity","segment_space","label_precision_key"].includes(g)).map(g=>[g,t(f[g],g)]));if(b==="fixed")return ze(null,f);if(/color/i.test(b)&&typeof f=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(f.trim())){let g=f.trim().slice(1).toLowerCase();return`#${g.length===3?g.split("").map(_=>_+_).join(""):g}`}return f},r=f=>{var b;return JSON.stringify(t({entity:f.entity,name:f.name,icon:(b=f.icon)!=null?b:null,layout:f.layout,scale:Object.fromEntries(["min","max"].map(g=>[g,{...f.scale[g],fixed_explicit:f.scale[g].fixed_explicit!==!1}])),bar:f.bar,baseline:f.baseline,formatting:f.formatting,target_marker:f.target_marker,peak_marker:f.peak_marker,floor_marker:f.floor_marker,generic_markers:f.generic_markers}))},i=new Set(e),a=new Map,s=new Map(e.map(f=>[f,r(f)]));for(let f of this._config.entities){let b=r(f),g=[...i].find(_=>s.get(_)===b);g&&(a.set(f,g),i.delete(g))}let l=this._config.entities.filter(f=>!a.has(f));for(let f of l){let b=[...i].filter(_=>_.entity===f.entity),g=l.filter(_=>_.entity===f.entity);b.length!==1||g.length!==1||(a.set(f,b[0]),i.delete(b[0]))}let o=new WeakMap,d=new WeakMap;for(let[f,b]of a){let g=this._extrema.get(b),_={};for(let y of["peak","floor"]){let m=b[`${y}_marker`],v=f[`${y}_marker`];g!=null&&g[y]&&(m==null?void 0:m.show)===!0&&(v==null?void 0:v.show)===!0&&JSON.stringify(m.reset)===JSON.stringify(v.reset)&&(_[y]={...g[y]})}(_.peak||_.floor)&&o.set(f,_),((u=(c=b.layout)==null?void 0:c.label)==null?void 0:u.position)==="left"&&((p=(h=f.layout)==null?void 0:h.label)==null?void 0:p.position)==="left"&&this._leftModeResponsiveHistory.has(b)&&d.set(f,this._leftModeResponsiveHistory.get(b))}this._extrema=o,this._leftModeResponsiveHistory=d}_logDiagnostics(){var r;let e=(r=this._diagnostics)!=null?r:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}),e.errors.forEach(i=>{console.warn(`[sensor-bar-card-plus] ${i.message}`,i)}))}normalizeCardConfig(e){return Qe(e)}normalizeEntityConfig(e,t){return Ki(e,t)}normalizeResolvableValue(e,t,r=null){return ce(e,t,r)}_looksLikeEntityId(e){return ke(e)}_parsePercentLiteral(e){return Me(e)}_getFiniteNumber(e){return J(e)}normalizeStructuredResolvableValue(e,t=null,r=null,i={}){return $e(e,t,r,i)}normalizeBaselineDirectionConfig(e,t=null){return Ye(e,t)}normalizeBaselineConfig(e,t){return Gr(e,t)}inferSegmentEndValues(e,t=null){return ti(e,t)}normalizeSeverityToSegments(e){return Cr(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return Ue(e)}normalizeScaleBound(e,t,r,i){return zr(e,t,r,i)}normalizeScaleConfig(e,t){return We(e,t)}_fillStyleToColorMode(e){return Li(e)}_colorModeToFillStyle(e){return sr(e)}_normalizeBarModeConfig(e=null,t=null){return Ze(e,t)}_resolveNormalizedBarMode(e,t,r,i){return Ui(e,t,r,i)}_normalizeGradientStops(e){return qi(e)}normalizeNeedleConfig(e,t=null){return Wi(e,t)}normalizeBarConfig(e,t){return Fe(e,t)}normalizeLayoutConfig(e,t){return Nr(e,t)}_clampSupportedRowHeight(e){return Hi(e)}normalizeFormattingConfig(e,t){return Ar(e,t)}normalizeTargetMarkerConfig(e,t){return Ir(e,t)}normalizePeakMarkerConfig(e,t){return Lr(e,t)}_normalizeOptionalEnabled(e){return ar(e)}set hass(e){let t=this._hass;if(this._hass=e,!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var i,a,s,l,o,d,c;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),r=(s=(a=(i=this._hass)==null?void 0:i.states)==null?void 0:a[t.entity])!=null?s:null;return{...t,icon:t.icon===!1?!1:(d=(o=t.icon)!=null?o:(l=r==null?void 0:r.attributes)==null?void 0:l.icon)!=null?d:this._getDefaultEntityIcon(r,t.entity),name:(c=t.name)!=null?c:null}}_getStateTimestamp(e){var i;let t=(i=e==null?void 0:e.last_updated)!=null?i:e==null?void 0:e.last_changed,r=t instanceof Date?t.getTime():Date.parse(String(t!=null?t:""));return Number.isFinite(r)?r:Date.now()}_updateExtrema(e,t,r){var l,o,d;let i=J(r==null?void 0:r.state);if(!Number.isFinite(i))return;let a=(l=this._extrema.get(e))!=null?l:{},s=this._getStateTimestamp(r);for(let c of["peak","floor"]){let u=t==null?void 0:t[`${c}_marker`];if((u==null?void 0:u.show)!==!0){delete a[c];continue}a[c]=Rr((o=a[c])!=null?o:null,i,(d=u.reset)!=null?d:{kind:"never"},c==="floor"?"min":"max",s)}a.peak||a.floor?this._extrema.set(e,a):this._extrema.delete(e)}_getDefaultEntityIcon(e,t=""){var s,l,o;let r=String((l=(s=e==null?void 0:e.attributes)==null?void 0:s.device_class)!=null?l:"").trim();if(r){let d={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(d[r])return d[r]}let i=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[i])!=null?o:null}_shouldUpdate(e,t){var r,i,a,s,l,o,d,c,u,h,p;if(!this._config||!this._config.entities)return!0;for(let f of this._config.entities){let b=this._resolve(f),g=[f.entity,(i=(r=b.scale)==null?void 0:r.min)==null?void 0:i.entity,(s=(a=b.scale)==null?void 0:a.max)==null?void 0:s.entity,(o=(l=b.baseline)==null?void 0:l.at)==null?void 0:o.entity,(c=(d=b.target_marker)==null?void 0:d.source)==null?void 0:c.entity,...((u=b.generic_markers)!=null?u:[]).filter(_=>_.accepted).flatMap(_=>{var y,m;return[(y=_.source)==null?void 0:y.entity,(m=_.label)==null?void 0:m.entity]})].filter(Boolean);for(let _ of g){let y=(h=e.states[_])!=null?h:null,m=(p=t.states[_])!=null?p:null;if(y!==m)return!0}}return!1}_setStyleIfChanged(e,t,r){return ue(e,t,r)}_setStyleTextIfChanged(e,t){return rt(e,t)}_setTextIfChanged(e,t){var i;if(!e)return!1;let r=t==null?"":String(t);return((i=e.textContent)!=null?i:"")===r?!1:(e.textContent=r,!0)}_setDatasetIfChanged(e,t,r){return Ee(e,t,r)}_setClassNameIfChanged(e,t){return Qr(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,r;((r=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?r:[]).forEach(i=>{let a=i.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${a}"]`,`.generic-marker[data-marker-id="${a}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var i;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let a=e.dataset.markerId;return(i=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(s=>s.dataset.markerId===a))!=null?i:null}let r=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return r?t.querySelector(r):null}_getGenericMarkerForLabel(e){var i,a;let t=e==null?void 0:e.closest(".row"),r=(i=e==null?void 0:e.dataset)==null?void 0:i.markerId;return!t||!r?null:(a=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(s=>s.dataset.markerId===r))!=null?a:null}_setMarkerHover(e){var r;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((r=this._markerHover)==null?void 0:r.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var i,a,s;if(e.pointerType==="touch")return;let t=(a=(i=e.target)==null?void 0:i.closest)==null?void 0:a.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),r=(s=t==null?void 0:t.matches)!=null&&s.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;r&&this._setMarkerHover(r)}_handleMarkerPointerOut(e){var i,a;if(e.pointerType==="touch")return;let t=(a=(i=e.target)==null?void 0:i.closest)==null?void 0:a.call(i,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let r=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;r&&this._clearMarkerHover(r)}_positionMarkerValueLabel(e,t,r){let i=e.querySelector(".bar-track"),a=e.querySelector(t),s=e.querySelector(r);if(!i||!a||!s)return;if(s.style.display==="none"||!a.textContent.trim()){this._setStyleIfChanged(a,"visibility","hidden");return}let l=i.getBoundingClientRect(),o=Math.max(0,Math.floor(l.width-4));this._setStyleIfChanged(a,"maxWidth",`${o}px`);let d=a.getBoundingClientRect(),c=parseFloat(s.style.left);if(!Number.isFinite(c)||l.width<=0||d.width<=0||o<=10){this._setStyleIfChanged(a,"visibility","hidden");return}let u=c/100*l.width,h=d.width/2,p=Math.max(h,Math.min(l.width-h,u));this._setStyleIfChanged(a,"left",`${p}px`),this._setStyleIfChanged(a,"transform","translateX(-50%)"),this._setStyleIfChanged(a,"visibility","visible")}_getEntityNumericValue(e){return et(this._hass,e)}_getNumericValue(e,t=null){return ze(this._hass,e,t)}_resolvePercentValue(e,t,r){return Ji(e,t,r)}_getNormalizedResolvableNumericValue(e,t=null,r=null){return Oe(this._hass,e,t,r)}_hexToRgb(e){return at(e)}_getSeverityInterpolationStops(e,t=0,r=100){return oi(e,t,r)}_getSeverityBandGradientCss(e,t=0,r=100){return ta(e,t,r)}_getSoftBandBlendWidthPct(){return ra()}_pushGradientColorStop(e,t,r){return Ge(e,t,r)}_getSoftBandGradientStops(e,t=0,r=100){return hr(e,t,r)}_getSoftBandGradientCss(e,t=0,r=100){return ia(e,t,r)}_resolveSegmentBoundaryPct(e,t,r){return ri(e,t,r)}_getEffectiveFillStyle(e){return fr(e)}_segmentsNeedBoundaryResolution(e){return aa(e)}_getSegmentsForRendering(e,t=0,r=100){return Ne(e,t,r)}_getColor(e,t,r=0,i=100){return na(e,t,r,i)}_buildFullScaleGradientStyle(e){return sa(e)}_getGradientInterpolationStops(e,t=0,r=100){return la(e,t,r)}_rgbToCss(e){return oa(e)}_buildSolidGradientStyle(e){return ii(e)}_getBasePaintGradient(e,t,r=0,i=100){return da(e,t,r,i)}_getOverlayGradient(e,t,r){return ai(e,t,r)}_toScalePct(e,t,r){return ur(e,t,r)}_getRevealTransitionDuration(e,t){return li(e,t)}_resolveBaselinePct(e,t,r){var a,s;if(((a=e.baseline)==null?void 0:a.enabled)===!1)return null;let i=this._getNormalizedResolvableNumericValue((s=e.baseline)==null?void 0:s.at,t,r);return Number.isFinite(i)?this._toScalePct(i,t,r):null}_formatNumericDisplay(e,t=null){return Be(e,t)}_getNormalizedPercent(e,t=null){return ni(e,t)}_getEndpointSemantics(e){return ca(e)}_getRevealCornerRadii(e){return ua(e)}_getAboveTargetOverlayInterval(e=null){return ha(e)}_getAboveTargetLayerGeometry(e=null){return fa(e)}_getFullScalePaintStyle(e,t,r=null,i=null,a=0,s=100){return pa(e,t,r,i,a,s)}_getRevealShapeStyle(e,t){return ma(e,t)}_getStaticLayerRevealStyle(e){return si(e)}_getFillPaintLayers(e,t,r,i,a=null,s=null,l=0,o=100){return ba(e,t,r,i,a,s,l,o)}_getFillRenderState(e,t,r,i,a=null,s=null,l=0,o=100,d=!1){return _a(e,t,r,i,a,s,l,o,d)}_getNeedleRenderState(e,t,r=0,i=100,a=null){return Nn(e,t,r,i,a)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
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
${Fr}
${Pr('.row[data-bar-animated="false"]')}
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
${Er}
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
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let r=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==r||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=r,this._applyCompactTier(),r.observe(e),r.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,r){var s,l,o;if(r||!e||!t)return 0;let i=Math.floor((l=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?l:0),a=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(i,8)||!Number.isFinite(a)||a<=0?0:Math.min(a,i*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",r=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let i=["normal","compact","tight","dense","compressed"],a="normal";e<170?a="compressed":e<210?a="dense":e<255?a="tight":e<320&&(a="compact");let s=i.indexOf(a),l=Number.isFinite(r)?r<=44&&e>=205?2:r<=72&&e>=185?1:0:0;return i[Math.max(0,s-l)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var i,a;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(i=this.shadowRoot)==null?void 0:i.querySelector("ha-card"),r=(a=t==null?void 0:t.getBoundingClientRect().width)!=null?a:0;if(!this._isReliableWidth(r)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let r=e.getBoundingClientRect().width;if(!this._isReliableWidth(r)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(r,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let r=e.querySelector(".label-left-text"),i=((r==null?void 0:r.textContent)||"").trim(),a=r?this._measureTextWidthWithStyles(r,i)||r.scrollWidth:Number.POSITIVE_INFINITY,s=this._classifyLeftDensity(t,e.dataset.leftDensity,a);e.dataset.leftDensity=s})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var w,k,M,$,T,B;let t=e.closest(".bar-track"),r=e.closest(".main-line"),i=e.querySelector(".inside-name"),a=e.querySelector(".inside-value");if(!t||!i||!a)return;let s=this._decodeDataAttr(a.dataset.display||a.textContent||""),l=this._decodeDataAttr(a.dataset.unit||"");a.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(a,s,l,!1),d=this._measureInsideValueMarkupWidth(a,s,l,!0),c=(k=(w=r==null?void 0:r.getBoundingClientRect)==null?void 0:w.call(r).width)!=null?k:0,u=this._isReliableWidth(c)?this._classifyRowDensity(c,(M=r==null?void 0:r.dataset)==null?void 0:M.rowDensity):(($=r==null?void 0:r.dataset)==null?void 0:$.rowDensity)||"normal",h=(B=(T=r==null?void 0:r.querySelector)==null?void 0:T.call(r,".icon-wrap"))!=null?B:null,p=h?this._getLeftModeIconWidth(h,r)+this._getLeftModeGap(r):0,f=this._getLeftModeBarMinWidth(r),b=this._isReliableWidth(c)?Math.max(f,c-p):t.getBoundingClientRect().width,g=this._isReliableWidth(c)?Math.max(f,c):b+p,_=(i.textContent||"").trim(),y=this._measureTextWidthWithStyles(i,_)||i.scrollWidth,m=E=>{let z=u==="compressed"?"compressed":this._classifyInsideDensity(E,o);e.dataset.insideDensity=z,e.dataset.valueFit="normal",a.dataset.valueFit="normal";let C=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),O=Math.max(0,E-C),A=!!l&&o>O,I=A?d:o,X="normal";I>O&&(X="compact",e.dataset.valueFit=X,a.dataset.valueFit=X,O=Math.max(0,E-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),I=this._measureInsideValueMarkupWidth(a,s,l,!0));let Y=I>O,Z=Y?0:this._getNumericStyleValue(e,"gap",0),he=Math.max(0,Math.min(O*(z==="compact"?.56:z==="tight"?.48:.6),O-(Y?0:Math.ceil(I))-Z)),se=z==="dense"||z==="compressed";if(_&&y>0){let le=this._getInsideUsefulNameWidth(i,_,y),W=this._measureVisibleLabelCharacters(i,_,he);se=he<le||y>he+1&&W<Math.min(4,_.length)}return{density:z,valueFit:X,hideUnit:A,hideValue:Y,hideName:se,rank:Y?3:X==="compact"?2:A?1:0}},v=u==="dense"||u==="compressed",S=m(v?g:b);if(h&&!v){let E=m(g);(E.rank<S.rank||E.rank===S.rank&&S.hideName&&!E.hideName)&&(v=!0,S=E)}e.dataset.insideDensity=S.density,e.dataset.valueFit=S.valueFit,e.dataset.hideName=S.hideName?"true":"false",a.dataset.valueFit=S.valueFit,a.dataset.hideUnit=S.hideUnit?"true":"false",a.dataset.hideValue=S.hideValue?"true":"false",r&&(r.dataset.hideInsideIcon=v?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var m,v,S,w,k,M,$,T,B,E,z,C,O,A,I;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let r=e.classList.contains("hero-line"),i=r?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,a="normal";if(i<90?a="xs":i<110?a="compressed":i<150?a="dense":i<210?a="tight":i<280&&(a="compact"),r){e.dataset.heroDensity=a,t.dataset.hideName=a==="dense"||a==="compressed"||a==="xs"?"true":"false",e.dataset.hideHeroIcon=a==="compressed"||a==="xs"?"true":"false";return}e.dataset.aboveDensity=a;let s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((m=l==null?void 0:l.dataset)==null?void 0:m.display)||""),d=this._decodeDataAttr(((v=l==null?void 0:l.dataset)==null?void 0:v.unit)||""),c=(S=e.closest)==null?void 0:S.call(e,".row"),u=(w=c==null?void 0:c.querySelector)==null?void 0:w.call(c,".main-line.above-mode"),h=((k=u==null?void 0:u.dataset)==null?void 0:k.rowDensity)||"normal",p=($=(M=u==null?void 0:u.querySelector)==null?void 0:M.call(u,".icon-wrap"))!=null?$:null,f=(T=p==null?void 0:p.getBoundingClientRect)==null?void 0:T.call(p),b=p&&typeof getComputedStyle=="function"?getComputedStyle(p):null,g=!!p&&h!=="compressed"&&(b==null?void 0:b.display)!=="none"&&((B=f==null?void 0:f.width)!=null?B:0)>0&&((E=f==null?void 0:f.height)!=null?E:0)>0,_=a==="dense"||a==="compressed",y=!g;if(s&&l&&o){let X=(z=e.closest)==null?void 0:z.call(e,".row-stack"),Y=(I=(A=(C=X==null?void 0:X.getBoundingClientRect)==null?void 0:C.call(X).width)!=null?A:(O=e.getBoundingClientRect)==null?void 0:O.call(e).width)!=null?I:i,Z=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,Q=g?f.width:0,he=Z?this._getNumericStyleValue(e,"gap",0):0,se=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),le=Math.ceil(this._measureValueMarkupWidth(l,o,d,!1)+2),W=Math.ceil(this._measureValueMarkupWidth(l,o,d,!0)+2),ee=(s.textContent||"").trim(),H=g&&Q>0?Q+he:0,te=this._measureTextWidthWithStyles(s,ee)||s.scrollWidth||0,oe=Math.max(0,Y-H-se),ae=(Ve,Ce=oe)=>{let Ie=Math.max(0,Ce-Ve),Le=this._measureVisibleLabelCharacters(s,ee,Ie);return!this._shouldHideLeftLabel(ee,te,Ie,Le)},_e=Math.max(0,Y),de=!1;le<=oe&&ae(le)?(_=!1,y=!g):le<=_e?(_=!ae(le,Y-se),y=!0):W<=oe&&ae(W)?(_=!1,de=!!d,y=!g):ae(W,Y-se)?(_=!1,y=!0,de=!!d):(_=!0,y=!0,de=!!d&&le>_e),l.dataset.hideUnit=de?"true":"false"}else l&&(l.dataset.hideUnit="false");t.dataset.hideName=_?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var l,o,d,c,u,h,p,f,b;let t=(l=e==null?void 0:e.closest)==null?void 0:l.call(e,".row"),r=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),i=(d=r==null?void 0:r.querySelector)==null?void 0:d.call(r,".main-line.hero-mode"),a=(c=i==null?void 0:i.querySelector)==null?void 0:c.call(i,".bar-wrap"),s=[(u=t==null?void 0:t.getBoundingClientRect)==null?void 0:u.call(t).width,(h=r==null?void 0:r.getBoundingClientRect)==null?void 0:h.call(r).width,(p=i==null?void 0:i.getBoundingClientRect)==null?void 0:p.call(i).width,(f=a==null?void 0:a.getBoundingClientRect)==null?void 0:f.call(a).width,(b=e==null?void 0:e.getBoundingClientRect)==null?void 0:b.call(e).width];for(let g of s)if(this._isReliableWidth(g,8))return g;return 0}_measureHeroValueWidth(e,t,r="normal",i=!1){var p,f,b,g,_,y,m,v,S,w,k,M,$,T;let a=(p=this.shadowRoot)==null?void 0:p.querySelector(".measure-layer");if(!a||!e||!t)return 0;let s=this._decodeDataAttr(t.dataset.display||t.textContent||""),l=this._decodeDataAttr(t.dataset.unit||"");if(!s)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=r,o.dataset.hideHeroUnit=i?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((b=(f=e.style)==null?void 0:f.getPropertyValue)==null?void 0:b.call(f,"--sbcp-hero-base-size"))||null);let d=document.createElement("span");d.className="hero-value",d.dataset.display=t.dataset.display||"",d.dataset.unit=t.dataset.unit||"",d.innerHTML=this._formatRightValueMarkup(s,l,i),d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.justifySelf="start",d.style.overflow="visible";let c=d.querySelector(".value-right-text");c&&(c.style.display="inline-flex",c.style.flex="0 0 auto",c.style.width="auto",c.style.minWidth="0",c.style.maxWidth="none",c.style.justifyContent="flex-start",c.style.overflow="visible");let u=d.querySelector(".value-right-number");u&&(u.style.flex="0 0 auto",u.style.minWidth="0",u.style.overflow="visible",u.style.textOverflow="clip");let h=d.querySelector(".unit-group");return h&&(h.style.flex="0 0 auto",h.style.minWidth="0",h.style.overflow="visible"),o.appendChild(d),a.replaceChildren(o),Math.max(Math.ceil((_=(g=d.getBoundingClientRect)==null?void 0:g.call(d).width)!=null?_:0),Math.ceil(d.scrollWidth||0),Math.ceil((v=(m=(y=c==null?void 0:c.getBoundingClientRect)==null?void 0:y.call(c).width)!=null?m:c==null?void 0:c.scrollWidth)!=null?v:0),Math.ceil((k=(w=(S=u==null?void 0:u.getBoundingClientRect)==null?void 0:S.call(u).width)!=null?w:u==null?void 0:u.scrollWidth)!=null?k:0),Math.ceil((T=($=(M=h==null?void 0:h.getBoundingClientRect)==null?void 0:M.call(h).width)!=null?$:h==null?void 0:h.scrollWidth)!=null?T:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var p,f;let t=e.querySelector(".hero-header"),r=e.querySelector(".hero-label"),i=e.querySelector(".hero-value"),a=e.querySelector(".unit-group");if(!t||!i)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let s=Math.floor((f=(p=t.getBoundingClientRect)==null?void 0:p.call(t).width)!=null?f:0);if(!this._isReliableWidth(s,8)){this._schedulePostLayoutDensityPass();return}let l=!!a&&a.textContent.trim().length>0,o=t.dataset.hideName==="true",d=!o&&r?this._getNumericStyleValue(t,"column-gap",0):0,c=(b="normal",g=!1)=>this._measureHeroValueWidth(e,i,b,g),u=Math.max(0,s-d-4),h=Math.max(0,s-4);if(!this._isReliableWidth(h,8)){e.dataset.hideHeroUnit=l?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(c("normal",!1)<=u)&&!(!o&&r&&(t.dataset.priorityHideName="true",c("normal",!1)<=h))){if(l){for(let b of["tight","minimum"]){let g=c(b,!1);if(g<=h){if(e.dataset.heroValueFit=b,!o&&r){let _=(r.textContent||"").trim(),y=this._measureTextWidthWithStyles(r,_),m=Math.max(0,u-g);this._shouldHideLeftLabel(_,y,m,this._measureVisibleLabelCharacters(r,_,m))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",c("normal",!0)<=h)return}e.dataset.heroValueFit="tight",!(c("tight",l)<=h)&&(e.dataset.heroValueFit="minimum",!(c("minimum",l)<=h)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,r,i){var l;let a=(l=this.shadowRoot)==null?void 0:l.querySelector(".measure-layer");if(!a||!e)return 0;let s=e.cloneNode(!1);return s.removeAttribute("data-hide-unit"),s.style.removeProperty("--sbcp-value-extra-width"),s.style.width="auto",s.style.minWidth="0",s.style.maxWidth="none",s.style.flex="0 0 auto",s.innerHTML=this._formatRightValueMarkup(t,r,i),a.replaceChildren(s),s.scrollWidth}_measureInsideValueMarkupWidth(e,t,r,i=!1){var o;let a=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!a||!e)return(e==null?void 0:e.scrollWidth)||0;let s=e.cloneNode(!1);s.style.width="auto",s.style.minWidth="0",s.style.maxWidth="none",s.style.flex="0 0 auto",s.style.overflow="visible",s.style.textOverflow="clip",s.style.whiteSpace="nowrap",s.innerHTML=this._formatInsideValueMarkup(t,r,i),s.removeAttribute("data-hide-value");let l=document.createElement("div");return l.className="bar-inner-label",l.style.cssText="position:static;display:block;padding:0",l.appendChild(s),a.replaceChildren(l),s.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var a;let r=(a=this.shadowRoot)==null?void 0:a.querySelector(".measure-layer");if(!r||!e)return 0;let i=e.cloneNode(!1);return i.textContent=t,i.style.width="auto",i.style.minWidth="0",i.style.maxWidth="none",i.style.flex="0 0 auto",i.style.overflow="visible",i.style.textOverflow="clip",i.style.whiteSpace="nowrap",r.replaceChildren(i),i.scrollWidth}_measureVisibleLabelCharacters(e,t,r){if(!e||!t||!Number.isFinite(r)||r<=0)return 0;let i=this._measureTextWidthWithStyles(e,"..."),a=Math.max(0,r-i);if(a<=0)return 0;let s=0,l=t.length;for(;s<l;){let o=Math.ceil((s+l)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=a?s=o:l=o-1}return s}_shouldHideLeftLabel(e,t,r,i){return!e||!Number.isFinite(t)||!Number.isFinite(r)?!1:t>r+1&&i<5}_getInsideUsefulNameWidth(e,t,r=NaN){if(!t)return 0;let i=Number.isFinite(r)&&r>0?r:this._measureTextWidthWithStyles(e,t),a=t.slice(0,Math.min(5,t.length)),s=this._measureTextWidthWithStyles(e,a)+this._measureTextWidthWithStyles(e,"..."),l=Math.max(36,Math.min(44,s||0));return Math.min(i||l,l)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var u,h,p,f,b;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let i=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((p=(h=(u=e==null?void 0:e.ownerDocument)==null?void 0:u.defaultView)==null?void 0:h.getComputedStyle)==null?void 0:p.bind(e.ownerDocument.defaultView));if(!i)return;let a=i(e),s=parseFloat(a.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,l=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2),o=e.closest(".main-line"),d=l;if(o!=null&&o.classList.contains("off-mode")){let g=o.querySelector(".bar-wrap"),_=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(i(o).gap)||0,m=(b=(f=o.getBoundingClientRect)==null?void 0:f.call(o).width)!=null?b:0,v=parseFloat(i(g).minWidth)||0,S=_&&i(_).display!=="none",w=S?this._getLeftModeIconWidth(_,o):0,k=Math.max(0,m-v-y),M=k-(S?w+y:0),$=Math.ceil(this._measureValueMarkupWidth(e,t,r,!0)+2),T=S&&(l>M&&l<=k||$>M&&$<=k);o.dataset.hideOffIcon=T?"true":"false";let B=T?k:M;if(B>0){let E=l<=B?l:$;d=Math.min(E,B)}}let c=Math.max(0,d-s);e.style.setProperty("--sbcp-value-extra-width",`${c}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var s,l,o,d;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!((s=e.classList)==null?void 0:s.contains("above-bar-label-value"))&&t){let c=(d=(o=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?o:e.clientWidth)!=null?d:0,u=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2);i=r&&c>0?u>c:!1,e.dataset.hideUnit=i?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,r,i)&&(e.innerHTML=this._formatRightValueMarkup(t,r,i))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),i=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let s=this._formatInsideValueMarkup(t,r,i);e.innerHTML!==s&&(e.innerHTML=s)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,r=0){if(!e)return r;try{let i=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(i)?i:r}catch(i){return r}}_getLeftModeGap(e){var i;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let r=((i=e==null?void 0:e.dataset)==null?void 0:i.rowDensity)||"normal";return r==="tight"?7:r==="dense"||r==="compressed"?6:8}_getLeftModeBarMinWidth(e){var i;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let r=((i=e==null?void 0:e.dataset)==null?void 0:i.leftDensity)||"normal";return r==="compact"?52:r==="tight"?48:r==="dense"?44:r==="compressed"?40:56}_getLeftModeIconWidth(e,t){var s,l;let r=(s=e==null?void 0:e.getBoundingClientRect)==null?void 0:s.call(e).width;if(this._isReliableWidth(r,1))return r;let i=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(i))return i;let a=((l=t==null?void 0:t.dataset)==null?void 0:l.leftDensity)||"normal";return a==="compact"?26:a==="tight"?24:a==="dense"?23:a==="compressed"?22:28}_getReservedInlineValueWidth(e){var d,c,u;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),i=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),a=parseFloat(((c=(d=e.style)==null?void 0:d.getPropertyValue)==null?void 0:c.call(d,"--sbcp-value-extra-width"))||((u=e.style)==null?void 0:u["--sbcp-value-extra-width"])||"0"),s=Number.isFinite(a)?a:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),l=Math.max(0,i+s);if(!t)return l;let o=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2);return Math.max(l,o)}_getStableLeftLabelMetrics(e,t=null){var f,b,g,_,y,m,v,S,w,k;let r=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".label-left"),a=e==null?void 0:e.querySelector(".label-left-text");if(!r||!i||!a)return null;let s=(b=t!=null?t:(f=r.getBoundingClientRect)==null?void 0:f.call(r).width)!=null?b:0,l=(a.textContent||"").trim(),o=this._measureTextWidthWithStyles(a,l)||a.scrollWidth||0,d=((g=r.dataset)==null?void 0:g.leftDensity)||"normal",c={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},u=(y=(_=this._config)==null?void 0:_.entities)==null?void 0:y.find(M=>{var $;return M.entity===(($=e.dataset)==null?void 0:$.entity)}),h=u&&(w=(S=(v=(m=this._resolve(u))==null?void 0:m.layout)==null?void 0:v.label)==null?void 0:S.width)!=null?w:100,p=s>0?Math.min(h,s*((k=c[d])!=null?k:c.normal)):Math.min(o,h);return{text:l,naturalWidth:o,maximumWidth:p,labelWidth:p,labelText:a}}_estimateLeftModeWidthBudget(e){var S,w,k;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let r=(w=(S=t.getBoundingClientRect)==null?void 0:S.call(t).width)!=null?w:0;if(!this._isReliableWidth(r))return null;let i=e.querySelector(".label-left"),a=e.querySelector(".icon-wrap"),s=e.querySelector(".value-right"),l=this._getStableLeftLabelMetrics(e,r),o=(k=l==null?void 0:l.labelWidth)!=null?k:0,d=a?this._getLeftModeIconWidth(a,t):0,c=this._getReservedInlineValueWidth(s),u=this._getLeftModeGap(t),h=this._getLeftModeBarMinWidth(t),p=!!i,f=!!a,b=f?2:1,g=Math.max(0,r-(f?d:0)-h-b*u),_=Math.min(o,g),y=!l||this._shouldHideLeftLabel(l.text,l.naturalWidth,_,this._measureVisibleLabelCharacters(l.labelText,l.text,_)),m=Math.min(o,Math.max(0,r-h-u)),v=!l||this._shouldHideLeftLabel(l.text,l.naturalWidth,m,this._measureVisibleLabelCharacters(l.labelText,l.text,m));return{rowWidth:r,gap:u,barMinWidth:h,labelSacrificialWithoutIcon:v,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(d,0)?d:0,valueWidth:this._isReliableWidth(c,0)?c:0,baseLabelVisible:p,labelSacrificial:y,hasIcon:f,mainLine:t,iconWrap:a,valueEl:s,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,r=null){let i=r||this._estimateLeftModeWidthBudget(e);if(!i)return null;let a=i.baseLabelVisible&&!t.hideLabel,s=i.hasIcon&&!t.hideIcon,l=!t.topValue,o=1+(s?1:0)+(a?1:0)+(l?1:0),d=Math.max(0,o-1),c=(s?i.iconWidth:0)+(a?i.labelWidth:0)+(l?i.valueWidth:0)+d*i.gap,u=Math.max(0,i.rowWidth-c),h=u>=i.barMinWidth,p=h?u:i.barMinWidth;return{rowWidth:i.rowWidth,barWidth:p,share:p/i.rowWidth,showLabel:a,showIcon:s,showInlineValue:l,reservedWidth:c,gapCount:d,fits:h}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,r){let i=null;for(let a of t){let s=this._predictLeftModeBarShareForState(e,a,r);s&&(i={...a,predicted:s})}return i}_chooseLeftModeResponsiveState(e,t=!0){var u,h,p,f;let r=this._estimateLeftModeWidthBudget(e);if(!r)return null;let i=this._getMinimumBarShare(),a=this._getLeftModeCandidateStates(r),s=(h=this._config.entities)==null?void 0:h[Number((u=e==null?void 0:e.dataset)==null?void 0:u.rowIndex)],l=s&&this._leftModeResponsiveHistory.has(s)?this._leftModeResponsiveHistory.get(s):((f=(p=r.rowStack)==null?void 0:p.dataset)==null?void 0:f.forceTopValue)==="true",o=a.filter(b=>b.topValue),d=this._getTopValueEnableShare(),c=this._getTopValueDisableShare();for(let b of a){let g=b.topValue||t?i:l?c:d,_=this._predictLeftModeBarShareForState(e,b,r);if(_!=null&&_.fits&&_.share>=g)return{...b,predicted:_}}return this._chooseFallbackPredictedLeftModeState(e,o,r)}_applyLeftModeResponsiveState(e,t){var l,o;let r=e==null?void 0:e.querySelector(".main-line"),i=e==null?void 0:e.querySelector(".row-stack"),a=e==null?void 0:e.querySelector(".label-left");if(!r||!i)return;let s=(o=this._config.entities)==null?void 0:o[Number((l=e==null?void 0:e.dataset)==null?void 0:l.rowIndex)];s&&this._leftModeResponsiveHistory.set(s,(t==null?void 0:t.topValue)===!0),delete i.dataset.forceTopValue,delete r.dataset.hideLeftIcon,a&&delete a.dataset.priorityHidden,t!=null&&t.hideLabel&&a&&(a.dataset.priorityHidden="true"),t!=null&&t.topValue&&(i.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(r.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),r=e==null?void 0:e.querySelector(".bar-track");if(!t||!r)return null;let i=t.getBoundingClientRect().width,a=r.getBoundingClientRect().width;return!this._isReliableWidth(i)||!this._isReliableWidth(a,1)?null:{rowWidth:i,barWidth:a,share:a/i,mainLine:t,track:r}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),r=e==null?void 0:e.querySelector(".row-stack"),i=e==null?void 0:e.querySelector(".label-left"),a=e==null?void 0:e.querySelector(".above-bar-label"),s=e==null?void 0:e.querySelector(".bar-inner-label"),l=e==null?void 0:e.querySelector(".above-line");r&&delete r.dataset.forceTopValue,i&&delete i.dataset.priorityHidden,a&&delete a.dataset.priorityHideName,s&&delete s.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let r=e.querySelector(".label-left");r&&(r.dataset.priorityHidden="true");return}if(t==="above"){let r=e.querySelector(".above-bar-label");r&&(r.dataset.priorityHideName="true");return}if(t==="inside"){let r=e.querySelector(".bar-inner-label");r&&(r.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let r=e.querySelector(".row-stack");r&&(r.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let r=e.querySelector(".main-line");if(r){if(t==="left"){r.dataset.hideLeftIcon="true";return}if(t==="above"){r.dataset.hideAboveIcon="true";let i=e.querySelector(".above-line");i&&(i.dataset.hideAboveIcon="true");return}t==="inside"&&(r.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,r){var a,s,l,o,d,c,u,h,p,f;let i=(o=(l=r==null?void 0:r.rowWidth)!=null?l:(s=(a=e==null?void 0:e.querySelector(".main-line"))==null?void 0:a.getBoundingClientRect)==null?void 0:s.call(a).width)!=null?o:0;if(!this._isReliableWidth(i))return null;if(t==="left"){let b=e.querySelector(".label-left"),g=e.querySelector(".label-left-text");if(!b||!g)return null;let _=(g.textContent||"").trim(),y=g.clientWidth,m=g.scrollWidth,v=this._measureVisibleLabelCharacters(g,_,y),S=(c=(d=b.getBoundingClientRect)==null?void 0:d.call(b).width)!=null?c:y;return{text:_,visibleWidth:y,fullWidth:m,visibleChars:v,labelWidth:S,rowWidth:i}}if(t==="above"){let b=e.querySelector(".above-bar-label-name");if(!b)return null;let g=(b.textContent||"").trim(),_=b.clientWidth,y=b.scrollWidth,m=this._measureVisibleLabelCharacters(b,g,_),v=(h=(u=b.getBoundingClientRect)==null?void 0:u.call(b).width)!=null?h:_;return{text:g,visibleWidth:_,fullWidth:y,visibleChars:m,labelWidth:v,rowWidth:i}}if(t==="inside"){let b=e.querySelector(".inside-name");if(!b)return null;let g=(b.textContent||"").trim(),_=b.clientWidth,y=b.scrollWidth,m=this._measureVisibleLabelCharacters(b,g,_),v=(f=(p=b.getBoundingClientRect)==null?void 0:p.call(b).width)!=null?f:_;return{text:g,visibleWidth:_,fullWidth:y,visibleChars:m,labelWidth:v,rowWidth:i}}return null}_isLabelWorthSacrificing(e,t,r){let i=this._getLabelSacrificeMetrics(e,t,r);return!i||!i.text?!1:this._shouldHideLeftLabel(i.text,i.fullWidth,i.visibleWidth,i.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let r=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),i=this._getMinimumBarShare();r.forEach(a=>{let s=a.querySelector(".main-line");if(!s)return;let l=s.classList.contains("left-mode")?"left":s.classList.contains("above-mode")?"above":s.classList.contains("inside-mode")?"inside":"other";if(l==="other")return;if(l==="left"){let d=!t||t.get(s)===s.getBoundingClientRect().width,c=this._chooseLeftModeResponsiveState(a,d);c&&this._applyLeftModeResponsiveState(a,c),d||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(a);let o=this._getMeasuredBarShare(a);!o||o.share>=i||this._isLabelWorthSacrificing(a,l,o)&&(this._hideMinimumBarShareLabel(a,l),o=this._getMeasuredBarShare(a),!o||o.share>=i)||(this._forceMinimumBarShareTopValue(a,l),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(a),!(!o||o.share>=i)&&this._hideMinimumBarShareIcon(a,l))})}_shouldUseTopValueRow(e){var t,r,i;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((i=(r=e.closest)==null?void 0:r.call(e,".row-stack"))==null?void 0:i.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,r){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(r)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),r=e.querySelector(".row-stack");if(!t)return;let i=parseFloat(e.dataset.baseHeight||"38")||38,a=e.dataset.heightExplicit==="true",s=this._getEffectiveRowHeight(i,a,t);e.style.setProperty("--sbcp-row-height",`${s}px`),r&&r.style.setProperty("--sbcp-row-height",`${s}px`),t.style.height=`${s}px`;let l=t.querySelector(".label-left");l&&(l.style.height=`${s}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${s}px`,o.style.minHeight=`${s}px`);let d=t.querySelector(".bar-track");d&&(d.style.height=`${s}px`);let c=t.querySelector(".value-right");c&&(c.style.height=`${s}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var u,h,p,f,b;let t=e.closest(".row-stack"),r=e.querySelector(".value-right"),i=t==null?void 0:t.querySelector(".top-right-value");if(!t||!r||!i)return;let a=this._shouldUseTopValueRow(e);t.dataset.topValue=a?"true":"false",i.dataset.active=a?"true":"false";let s=this._decodeDataAttr(r.dataset.display||""),l=this._decodeDataAttr(r.dataset.unit||"");i.dataset.display=r.dataset.display||"",i.dataset.unit=r.dataset.unit||"",i.dataset.hideUnit="false";let o=(b=(f=(p=(u=t.getBoundingClientRect)==null?void 0:u.call(t).width)!=null?p:(h=i.getBoundingClientRect)==null?void 0:h.call(i).width)!=null?f:i.clientWidth)!=null?b:0,d=s?Math.ceil(this._measureValueMarkupWidth(i,s,l,!1)+2):0,c=!!l&&o>0&&d>o;i.dataset.hideUnit=c?"true":"false",i.innerHTML=this._formatRightValueMarkup(s,l,c)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var l;let t=e.querySelector(".label-left"),r=e.querySelector(".label-left-text");if(!t||!r)return;let i=((l=e.closest)==null?void 0:l.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?r:null},a=this._getStableLeftLabelMetrics(i);if(!a)return;let s=this._measureVisibleLabelCharacters(a.labelText,a.text,a.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(a.text,a.naturalWidth,a.labelWidth,s)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var i;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let r=new Map([...((i=this.shadowRoot)==null?void 0:i.querySelectorAll(".main-line.left-mode"))||[]].map(a=>[a,a.getBoundingClientRect().width]));requestAnimationFrame(()=>{var s;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,r),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((s=this.shadowRoot)==null?void 0:s.querySelectorAll(".row[data-entity]"))||[]).forEach(l=>{this._positionTargetLabel(l),this._positionMarkerValueLabel(l,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(l,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(l)})})})}_isTightUnit(e){return Zi(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(r){return t}}_parseColorToRgb(e){return di(e)}_rgbToHsl({r:e,g:t,b:r}){return ga({r:e,g:t,b:r})}_getMarkerContrastColor(e){return pr(e)}_getEffectiveMarkerColor(e){return He(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return it(e)}_formatDisplayWithUnit(e,t){return Qi(e,t)}_formatRightValueMarkup(e,t,r=!1){let i=me(e);if(!t||r)return`<span class="value-right-text"><span class="value-right-number">${i}</span></span>`;let a=String(t),s=me(a);return`<span class="${this._isTightUnit(a)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${i}</span><span class="unit-group"><span class="unit">${s}</span></span></span>`}_formatAboveValueMarkup(e,t,r=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${r?"true":"false"}">${this._formatRightValueMarkup(e,t,r)}</span>`}_formatInsideValueMarkup(e,t,r=!1){let i=me(e);if(!t||r)return`<span class="inside-value-text"><span class="inside-number">${i}</span></span>`;let a=String(t),s=me(a);return`<span class="inside-value-text ${this._isTightUnit(a)?"tight-unit":"has-unit"}"><span class="inside-number">${i}</span><span class="inside-unit">${s}</span></span>`}_getRowMarkerModels(e,t,r,i,a,s,l,o){if(e!=null&&e.markers)return e.markers.map(h=>{var p,f;return h.type==="target"?{...h,position:a===void 0?h.position:a,visible:a!=null,color:o||h.color,label:(p=h.label)!=null?p:s===null?null:{text:s}}:h.type==="floor"||h.type!=="peak"?h:{...h,position:r===void 0?h.position:r,visible:r!=null&&t.peak_marker.show===!0,color:l||h.color,label:(f=h.label)!=null?f:i===null?null:{text:i}}});let d=Yr({entityConfig:t,targetPosition:a,targetPresentation:s===null?null:{text:s},targetVisible:Number.isFinite(a),peakPosition:r,peakPresentation:i===null?null:{number:i},peakVisible:Number.isFinite(r)}),c=this._getMarkerModel(d,"target"),u=this._getMarkerModel(d,"peak");return c&&o&&(c.color=o),u&&l&&(u.color=l),d}_getMarkerModel(e,t){var r;return(r=e.find(i=>i.id===t||i.type===t))!=null?r:null}_renderMarker(e){return nt(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),st(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let r=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",r),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(r))}_buildRowViewModel(e,t,r){var a;let i=cr({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:r,extrema:(a=this._extrema.get(e))!=null?a:null,previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:i.min,max:i.max}),i}_buildRow(e,t,r,i,a,s,l,o,d,c,u,h,p,f=(g=>(g=(b=>(b=this._config.entities)==null?void 0:b.indexOf(e))())!=null?g:-1)()){var Et,Pt,Tt,Rt,Dt,Ct,zt,Ot,Bt,Gt,Nt,At,It,Lt,jt,Ut,qt,Wt,Ht,Kt,Jt,Xt,Yt,Zt,Qt,er;let _=this._resolve(e),y=(Tt=(Pt=(Et=this._hass)==null?void 0:Et.states)==null?void 0:Pt[e.entity])!=null?Tt:null;y&&this._updateExtrema(e,_,y);let m=y?this._buildRowViewModel(e,_,y):null,v=_.layout,S=_.bar,w=Number.isFinite(h)?h:0,k=Number.isFinite(p)?p:100,M=(Rt=m==null?void 0:m.baselinePercent)!=null?Rt:this._resolveBaselinePct(_,w,k),$=v.label.position,T=(Ct=(Dt=m==null?void 0:m.attributes)==null?void 0:Dt.baseHeight)!=null?Ct:v.height,B=(Gt=(Bt=(zt=m==null?void 0:m.name)!=null?zt:_.name)!=null?Bt:(Ot=y==null?void 0:y.attributes)==null?void 0:Ot.friendly_name)!=null?Gt:e.entity,E=me((Nt=m==null?void 0:m.entityId)!=null?Nt:e.entity),z=me(B),C=this._getRowMarkerModels(m,_,s,l,o,d,c,u),O=this._getMarkerModel(C,"target"),A=this._getMarkerModel(C,"peak"),I=this._getMarkerModel(C,"floor"),X=C.filter(pe=>pe.type==="generic"),Y=(At=m==null?void 0:m.markerLaneOccupancy)!=null?At:Jr(_),Z=(It=m==null?void 0:m.markerLabelLaneOccupancy)!=null?It:Xr(_),Q=(Lt=m==null?void 0:m.numericValue)!=null?Lt:this._getFiniteNumber(t),he=(jt=m==null?void 0:m.needle)!=null?jt:this._getNeedleRenderState(Q,_,w,k,M),se=mr({percent:i,min:w,max:k,targetPercent:o,baselinePercent:M,needle:he,markers:C},_,{height:"var(--sbcp-row-height)",color:a}),le=O!=null&&O.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite(O.position)?O.position:0}%;visibility:${O.visible&&((Ut=O.label)!=null&&Ut.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(O)}">
        ${(qt=O.label)!=null&&qt.text?me(O.label.text):""}
      </div>`:"",W=A!=null&&A.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(A.position)?A.position:0}%;visibility:${A.visible&&((Wt=A.label)!=null&&Wt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(A)}">
        ${A.visible&&((Ht=A.label)!=null&&Ht.text)?me(A.label.text):""}
      </div>`:"",ee=I!=null&&I.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(I.position)?I.position:0}%;visibility:${I.visible&&((Kt=I.label)!=null&&Kt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(I)}">
        ${I.visible&&((Jt=I.label)!=null&&Jt.text)?me(I.label.text):""}
      </div>`:"",H=X.filter(pe=>pe.labelVisible).map(pe=>{var tr,rr;return`
      <div class="generic-value-label" data-marker-id="${me(pe.id)}" data-lane="${pe.lane}" data-show-marker="${pe.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(pe.position)?pe.position:0}%;visibility:${pe.visible&&((tr=pe.label)!=null&&tr.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(pe)}">
        ${pe.visible&&((rr=pe.label)!=null&&rr.text)?me(pe.label.text):""}
      </div>`}).join(""),te=$==="above"?`
      <div class="above-line">
        ${_.icon&&_.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${z}</span>
          ${this._formatAboveValueMarkup(t,r,!1)}
        </div>
      </div>`:"",oe=(Xt=v.hero.size)!=null?Xt:"small",ae=v.hero.value_size,_e=$==="hero"?`
      <div class="hero-line" data-hero-size="${oe}"${Number.isFinite(ae)?` style="--sbcp-hero-base-size:${ae}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${z}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}">${this._formatRightValueMarkup(t,r,!1)}</span>
        </div>
      </div>`:"",de=$==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${z}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,r,!1)}</span>
      </div>`:"",Ve=$==="left"?`<div class="label-left" style="flex:0 1 min(${v.label.width}px, var(--sbcp-left-label-share));max-width:min(${v.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${z}</span></div>`:"",Ce=$!=="inside"&&$!=="above"&&$!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false">${this._formatRightValueMarkup(t,r,!1)}</div>`:"",Ie=$==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,r,!1)}</div>`:"",Le=_.icon&&_.icon!==!1?me(_.icon):"",$r=Le&&$!=="hero"?`<div class="icon-wrap"><ha-icon icon="${Le}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${f}" data-entity="${E}" data-base-height="${T}" data-height-explicit="${((Zt=(Yt=m==null?void 0:m.attributes)==null?void 0:Yt.heightExplicit)!=null?Zt:v.height_explicit)?"true":"false"}" data-bar-animated="${((er=(Qt=m==null?void 0:m.attributes)==null?void 0:Qt.barAnimated)!=null?er:S.animated)?"true":"false"}" data-marker-label-lane-above="${Z.above?"true":"false"}" data-marker-label-lane-below="${Z.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${T}px;">
          ${te}
          ${_e}
          ${Ie}
          <div class="main-line ${$}-mode" data-marker-lane-above="${Y.above?"true":"false"}" data-marker-lane-below="${Y.below?"true":"false"}" style="height:${T}px;">
            ${$r}
            ${Ve}
            <div class="bar-wrap">
              ${ui(se,{insideContent:de})}
              ${W}
              ${le}
              ${ee}
              ${H}
            </div>
            ${Ce}
          </div>
        </div>
      </div>`}_patchRow(e,t,r,i=null){var O,A,I,X,Y,Z,Q,he,se,le;if(!e||!r)return;let a=this._resolve(t);this._updateExtrema(t,a,r);let s=this._rowScales.get(t),l=this._buildRowViewModel(t,a,r),o=l.min,d=l.max,c=l.percent,u=this._getColor(c,a,o,d),h=l.primaryPresentation.number,p=l.primaryPresentation.unit,f=l.baselinePercent,b=mr(l,a,{height:"var(--sbcp-row-height)",color:u}),g=(A=(O=i==null?void 0:i.states)==null?void 0:O[t.entity])!=null?A:null,_=g?cr({hass:i,cardConfig:this._config,entityConfig:a,entityState:g,extrema:(I=this._extrema.get(t))!=null?I:null,previousScale:s}):null,y=this._getRevealTransitionDuration(_&&Number.isFinite(_.numericValue)?{valuePercent:_.percent,baselinePercent:_.baselinePercent}:null,Number.isFinite(l.numericValue)?{valuePercent:c,baselinePercent:f}:null),m=(X=this._markerHover)==null?void 0:X.marker;if(m&&e.contains(m)){let W=b.markers.find(ee=>ee.type==="generic"?m.dataset.markerId===ee.id:m.matches(`.${ee.type}-marker`));W&&!W.visible&&this._clearMarkerHover(m)}ci(e,b,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",l.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",l.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",l.attributes.barAnimated?"true":"false");let v=e.querySelector(".value-right");v&&(v.dataset.display=this._encodeDataAttr(h),v.dataset.unit=this._encodeDataAttr(p),v.dataset.hideUnit="false",v.innerHTML=this._formatRightValueMarkup(h,p,!1));let S=e.querySelector(".top-right-value");S&&(S.dataset.display=this._encodeDataAttr(h),S.dataset.unit=this._encodeDataAttr(p),S.dataset.hideUnit="false",S.innerHTML=this._formatRightValueMarkup(h,p,!1));let w=e.querySelector(".bar-inner-label");if(w){let W=w.querySelector(".inside-value");W&&(W.dataset.display=this._encodeDataAttr(h),W.dataset.unit=this._encodeDataAttr(p),W.dataset.hideUnit="false",W.dataset.hideValue="false",W.innerHTML=this._formatInsideValueMarkup(h,p,!1))}let k=e.querySelector(".hero-header");if(k){let W=e.querySelector(".hero-line");this._setStyleIfChanged(W,"--sbcp-hero-base-size",Number.isFinite(a.layout.hero.value_size)?`${a.layout.hero.value_size}px`:null),k.innerHTML=`<span class="hero-label label-left-text">${me(l.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(h)}" data-unit="${this._encodeDataAttr(p)}">${this._formatRightValueMarkup(h,p,!1)}</span>`}let M=k?null:e.querySelector(".above-bar-label");M&&(M.innerHTML=`<span class="above-bar-label-name label-left-text">${me(l.name)}</span>${this._formatAboveValueMarkup(h,p,!1)}`);let $=e.querySelector(".target-value-label"),T=e.querySelector(".peak-value-label"),B=e.querySelector(".floor-value-label"),E=(Y=l.markers)!=null?Y:[];((Q=(Z=e.querySelectorAll)==null?void 0:Z.call(e,".generic-marker[data-marker-id]"))!=null?Q:[]).forEach(W=>{var oe,ae,_e,de,Ve;let ee=W.dataset.markerId,H=this._getMarkerModel(E,ee),te=[...(ae=(oe=e.querySelectorAll)==null?void 0:oe.call(e,".generic-value-label[data-marker-id]"))!=null?ae:[]].find(Ce=>Ce.dataset.markerId===ee);te&&(this._setDatasetIfChanged(te,"showMarker",(H==null?void 0:H.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(te,H),H!=null&&H.labelVisible&&H.visible&&((_e=H.label)!=null&&_e.text)?(this._setTextIfChanged(te,(Ve=(de=H.label)==null?void 0:de.text)!=null?Ve:null),this._setStyleIfChanged(te,"visibility","visible"),this._setStyleIfChanged(te,"left",`${Number.isFinite(H.position)?H.position:0}%`)):this._setStyleIfChanged(te,"visibility","hidden"))});let z=this._getMarkerModel(E,"target");this._patchMarkerLabelAppearance($,z),$&&(z!=null&&z.labelVisible&&z.visible&&((he=z.label)!=null&&he.text)?this._setTextIfChanged($,(le=(se=z.label)==null?void 0:se.text)!=null?le:null):this._setStyleIfChanged($,"visibility","hidden"));let C=(W,ee)=>{var te,oe,ae;if(!W)return;let H=this._getMarkerModel(E,ee);this._patchMarkerLabelAppearance(W,H),H!=null&&H.labelVisible&&H.visible&&((te=H.label)!=null&&te.text)?(this._setTextIfChanged(W,(ae=(oe=H.label)==null?void 0:oe.text)!=null?ae:null),this._setStyleIfChanged(W,"visibility","visible"),this._setStyleIfChanged(W,"left",`${Number.isFinite(H.position)?H.position:0}%`)):this._setStyleIfChanged(W,"visibility","hidden")};C(T,"peak"),C(B,"floor")}_update(e=null){var l,o,d,c;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let r=this._config.entities,i=r.map(u=>!!this._hass.states[u.entity]),a=i.some((u,h)=>u!==this._rowPresence[h]);if(!this._rendered||a){this._rowGeneration+=1,this._rowPresence=i;let u="";for(let p=0;p<r.length;p++){let f=r[p],b=this._hass.states[f.entity];if(!b){u+=`<div class="row" data-row-index="${p}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${me(f.entity)}</span></div>`;continue}let g=this._resolve(f);this._updateExtrema(f,g,b);let _=this._buildRowViewModel(f,g,b),y=_.min,m=_.max,v=_.percent,S=this._getColor(v,g,y,m),w=_.primaryPresentation.number,k=_.primaryPresentation.unit,M=_.targetPercent,$=(o=(l=_.targetPresentation)==null?void 0:l.text)!=null?o:null,T=_.peakPercent,B=(c=(d=_.peakPresentation)==null?void 0:d.number)!=null?c:null;u+=this._buildRow(f,w,k,v,S,T,B,M,$,g.peak_marker.color,g.target_marker.color,y,m,p)}this._clearMarkerHover(),t.innerHTML=u,this._rendered=!0;let h=t.querySelectorAll(".row[data-entity]");h.forEach(p=>{let f=r[Number(p.dataset.rowIndex)],b=f?this._hass.states[f.entity]:null;f&&b&&this._patchRow(p,f,b)}),this._runPostLayoutPasses(h),h.forEach(p=>{p.addEventListener("click",()=>{let f=p.dataset.entity,b=new CustomEvent("hass-more-info",{composed:!0,detail:{entityId:f}});this.dispatchEvent(b)})});return}let s=t.querySelectorAll(".row[data-entity]");for(let u of s){let h=r[Number(u.dataset.rowIndex)];if(!h)continue;let p=this._hass.states[h.entity];p&&this._patchRow(u,h,p,e)}this._runPostLayoutPasses(s)}}});function _r(n){return Array.isArray(n)?[...n]:{...n!=null?n:{}}}function D(n){if(Array.isArray(n))return n.map(e=>D(e));if(V(n)){let e={};for(let[t,r]of Object.entries(n))e[t]=D(r);return e}return n}function ge(n){let e=t=>Array.isArray(t)?t.map(r=>e(r)):V(t)?Object.keys(t).sort().reduce((r,i)=>(r[i]=e(t[i]),r),{}):t;return JSON.stringify(e(n!=null?n:null))}function V(n){return!!n&&typeof n=="object"&&!Array.isArray(n)}function P(n,e,t){if(!e.length)return t;let r=_r(n!=null?n:{}),i=r,a=n;for(let s=0;s<e.length-1;s++){let l=e[s],o=V(a==null?void 0:a[l])||Array.isArray(a==null?void 0:a[l])?a[l]:{};i[l]=_r(o),i=i[l],a=o}return i[e[e.length-1]]=t,r}function x(n,e){if(!e.length||!V(n))return n;let[t,...r]=e;if(!(t in n))return n;let i=_r(n);if(!r.length)return delete i[t],i;let a=x(i[t],r);return a===i[t]?n:V(a)&&!Object.keys(a).length?(delete i[t],i):(i[t]=a,i)}function q(n,e){let t=n;for(let r of e){if(t==null)return;t=t[r]}return t}function In(n,e){let t=n;for(let r of e){if(!V(t)&&!Array.isArray(t)||!(r in t))return!1;t=t[r]}return!0}function N(n){return typeof n=="string"?n:n==null?"":String(n)}function Ln(n){return n===!0?!0:n===!1?!1:null}function ne(n){if(n===""||n===null||n===void 0)return null;let e=Number(n);return Number.isFinite(e)?e:null}function Te(n){if(n===""||n===null||n===void 0)return null;let e=Number(n);return!Number.isFinite(e)||e<0||!Number.isInteger(e)?null:e}function jn(n,e){let t=Array.isArray(e)?e:[e];return!n||n.type==="card"?t:n.type==="entity"?["entities",n.index,...t]:t}function pi(n){return Array.isArray(n)?n:[n]}function Pe(n,e=[]){return e.reduce((t,r)=>x(t,pi(r)),n)}function G(n,e){let t=n,r=pi(e);for(let i=r.length;i>0;i--){let a=r.slice(0,i),s=q(t,a);if(!V(s)||Object.keys(s).length)break;t=x(t,a)}return t}function fi(n){return n!==""&&n!==void 0&&n!==null}function lt(n){return fi(n==null?void 0:n.fixed)||fi(n==null?void 0:n.entity)}function mi(n,e,t,r=[]){let i=[t,...r];for(let a of i){let s=n.read(e,a);if(s!=null&&s!=="")return s}if((e==null?void 0:e.type)==="entity")for(let a of i){let s=n.read({type:"card"},a);if(s!=null&&s!=="")return s}return""}var re=U(()=>{});function Un(n,e){return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="entity-picker" data-index="${e}"></ha-entity-picker>`:`<input type="text" data-kind="entity-input" data-index="${e}" value="${F(n.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function be(n,e,t,r="sensor.example",i={}){let a=Object.entries(i).map(([s,l])=>`data-${s}="${F(l)}"`).join(" ");return customElements.get("ha-entity-picker")?`<ha-entity-picker data-kind="${n}" data-index="${e}"${a?` ${a}`:""}></ha-entity-picker>`:`<input type="text" data-kind="${n}" data-index="${e}"${a?` ${a}`:""} value="${F(t)}" placeholder="${F(r)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`}function ot(n,e,t,r){var o;let i=(n==null?void 0:n.type)==="entity",a=i?`entity-${n.index}-${e}`:e,s=i?`data-kind="entity-${e}-label-`:`data-field="${e}-label-`,l=i?`" data-index="${n.index}"`:'"';return`
      <div class="field-row"><div class="toggle">
        <input id="${a}-label-show" type="checkbox" ${s}show${l}${r.show?" checked":""}>
        <label for="${a}-label-show">Show ${t} label</label>
      </div></div>
      <div class="field-row"><label for="${a}-label-text">${t} label text</label>
        <input id="${a}-label-text" type="text" ${s}text${l} value="${F((o=r.text)!=null?o:"")}" placeholder="optional semantic text">
      </div>
      <div class="field-row"><div class="toggle">
        <input id="${a}-label-show-value" type="checkbox" ${s}show-value${l}${r.showValue?" checked":""}>
        <label for="${a}-label-show-value">Show value</label>
      </div></div>
      <div class="field-row"><div class="toggle">
        <input id="${a}-label-show-unit" type="checkbox" ${s}show-unit${l}${r.showUnit?" checked":""}>
        <label for="${a}-label-show-unit">Show unit</label>
      </div></div>
      <div class="field-row"><label for="${a}-label-precision">${t} label precision</label>
        <input id="${a}-label-precision" type="number" min="0" step="1" ${s}precision${l} value="${F(r.precision)}" placeholder="inherit primary precision">
      </div>`}function yr(n){let e=N(n).trim().toLowerCase()||"never";return["never","quarterly","hourly","daily","weekly","monthly","yearly",...Array.from({length:59},(r,i)=>`${i+1}m`),...Array.from({length:23},(r,i)=>`${i+1}h`)].map(r=>`<option value="${r}"${e===r?" selected":""}>${r}</option>`).join("")}function F(n){return N(n).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ke(n){return typeof n=="string"&&/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(n.trim())}function gr(n){if(!Ke(n))return null;let e=n.trim().toLowerCase();return e.length===7?e:`#${e.slice(1).split("").map(t=>t+t).join("")}`}function j(n){var t;let e=N(n).trim().toLowerCase();return e?(t=gr(e))!=null?t:e:""}function we(n,e="#000000"){var t,r;return(r=(t=gr(n))!=null?t:gr(e))!=null?r:"#000000"}function ie(n,e=!1){let t=N(n);return e&&t.trim()?t:t.trim()}function dt(n){let e=ne(n);return e!==null&&e>=0&&e<=100?e:null}function va(n,e,t){return`<input id="${n}" type="number" min="0" max="100" step="any" ${e} value="${F(t)}">%`}function bi(n){return Number.isFinite(n.percent)?"percent":n.entity?n.fixed!==""&&n.fixed!==void 0?"entity-fallback":"entity":"fixed"}function _i(n,e,t){return`<div class="field-row">
      <label for="${n}-source-mode">Source</label>
      <select id="${n}-source-mode" data-field="${n}-source-mode">
        ${[["fixed","Fixed"],["entity","Entity"],["entity-fallback","Entity with fixed fallback"],["percent","Percentage"]].map(([r,i])=>`<option value="${r}"${e===r?" selected":""}>${i}</option>`).join("")}
      </select>
    </div>
    <div class="field-row">
      <label for="${n}-percent">Scale percentage</label>
      ${va(`${n}-percent`,`data-field="${n}-percent"`,t)}
      <button type="button" data-action="${n}-clear-percent">Clear percentage</button>
      <div class="section-note">Percentage uses the current scale. Entity and fixed values take precedence when present.</div>
    </div>`}function K({id:n,field:e=null,kind:t=null,index:r=null,value:i="",fallbackHex:a="#000000",placeholder:s="",extraDataset:l={},cssText:o=!1,label:d="Color"}){let c=N(i).trim(),u=we(c,a),h=Object.entries(l).map(([b,g])=>`data-${b}="${F(g)}"`).join(" "),p=e?`data-field="${e}"${h?` ${h}`:""}`:`data-kind="${t}" data-index="${r}"${h?` ${h}`:""}`,f=e?`data-field="${e}-text-fallback"${h?` ${h}`:""}`:`data-kind="${t}-text-fallback" data-index="${r}"${h?` ${h}`:""}`;return`
      <div class="field-grid">
        <input id="${n}" type="color" ${p} value="${F(u)}">
        ${o||c&&!Ke(c)?`<input${o?` id="${n}-text-fallback" data-css-color="true" aria-label="${F(d)} (CSS value)"`:""} type="text" ${f} value="${F(o?i:c)}" placeholder="${F(s||"CSS color value")}">`:""}
      </div>
    `}var ve=U(()=>{re()});var gi,Sa=U(()=>{gi=`
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
	      `});function yi({group:n,title:e,summary:t,content:r,inactive:i=!1},a){return`
      <div class="override-group card-subgroup${i?" is-inactive":""}" data-group="${n}" data-expanded="${a?"true":"false"}">
        <button
          type="button"
          id="card-group-${n}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${n}"
          aria-expanded="${a?"true":"false"}"
        >
          <span id="card-group-${n}-title" class="override-group-title">${a?"\u25BE":"\u25B8"} ${e}</span>
          <span id="card-group-${n}-summary" class="override-group-summary">${F(t)}</span>
        </button>
        <div class="override-group-body" style="display:${a?"grid":"none"};">
          ${r}
        </div>
      </div>
    `}function vi({renderGroup:n,target:e,peak:t,floor:r,references:i}){return`	        <div class="section">
          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Configure Target, Peak, Floor, and custom reference markers.</div>
	          </div>
	          <div class="field-grid">
            ${n({group:"marker-target",title:"Target",...e})}
            ${n({group:"marker-peak",title:"Peak",...t})}
            ${n({group:"marker-floor",title:"Floor",...r})}
            ${n({group:"generic-markers",title:"Generic Reference Markers",...i})}
          </div>
	        </div>`}var xa=U(()=>{ve()});var ct,wa=U(()=>{re();ct=class{constructor(){this.values=new Map}reset(){this.values.clear()}handle(e,t=!1){var u,h,p,f,b,g;let r=e.target;if(t&&(r==null?void 0:r.type)==="number")return!0;let i=(f=(p=(u=r==null?void 0:r.dataset)==null?void 0:u.field)!=null?p:(h=r==null?void 0:r.dataset)==null?void 0:h.kind)!=null?f:"";if(i==="generic-marker-source-mode"&&r.id)for(let _ of["fixed","fallback","percent"])this.values.delete(r.id.replace(/source-mode$/,_));if((r==null?void 0:r.type)!=="number"||!r.id||/^(?:entity-)?gradient-/.test(i)||/^(?:target|baseline)-percent$/.test(i))return!1;if(r.isConnected===!1)return!0;let a=r.value,s=i==="generic-marker-percent",o=/(?:precision|decimal)$/.test(i)?Te(a):ne(a),d=o!==null&&!((b=r.validity)!=null&&b.badInput)&&(!/(?:layout-height|override-height)$/.test(i)||o>=24),c=e.type==="change"&&a===""&&!((g=r.validity)!=null&&g.badInput)&&!s;return d||c?(this.values.delete(r.id),!1):(this.values.set(r.id,a),!0)}captureFocus(e){let t=e.activeElement;return t&&this.values.has(t.id)?t.id:null}apply(e,t=null){var r,i,a,s,l,o;for(let[d,c]of this.values){let u=(i=(r=e.getElementById)==null?void 0:r.call(e,d))!=null?i:e.querySelector(`#${d}`);if(!u){this.values.delete(d);continue}u!==e.activeElement&&(u.value=c)}t&&((o=(l=(s=(a=e.getElementById)==null?void 0:a.call(e,t))!=null?s:e.querySelector(`#${t}`))==null?void 0:l.focus)==null||o.call(l,{preventScroll:!0}))}}});function Je(n,e,t,r=!1){return n.source(e,t,r)}function Si(n,e){return Je(n,{type:"card"},e).fixed}function xi(n,e){return Je(n,{type:"card"},e).entity}function vr(n,e,t,r,i){return n.setSource(e,t,r,i)}function Js(n,e){let t=r=>r!==""&&r!==void 0&&r!==null;return["min","max"].some(r=>{let i=Je(n,e,r);return t(i==null?void 0:i.fixed)||t(i==null?void 0:i.entity)})}function qn(n,e){let t=[],r=Je(n,e,"min"),i=Je(n,e,"max");return r.entity?t.push("Min entity"):r.fixed!==""&&r.fixed!==void 0&&t.push(`Min ${r.fixed}`),i.entity?t.push("Max entity"):i.fixed!==""&&i.fixed!==void 0&&t.push(`Max ${i.fixed}`),t.length?t.join(" \u2022 "):"Inherited"}function ka(n,e){return n.mutate(e,t=>{let r=x(t,["scale","min"]);return r=x(r,["scale","max"]),r=x(r,["min"]),r=x(r,["max"]),r=x(r,["min_entity"]),r=x(r,["max_entity"]),G(r,["scale"])},{rerender:!0})}function ut(n,{field:e,kind:t,index:r,value:i}){if(e==="scale-min"||e==="scale-max")return vr(n,{type:"card"},e.slice(6),"fixed",i),!0;if(t==="scale-min-entity-source"||t==="scale-max-entity-source")return vr(n,{type:"card"},t.split("-")[1],"entity",i),!0;let a={type:"entity",index:Number(r)};return t==="entity-scale-inherit"?(i&&ka(n,a),!0):["entity-override-min","entity-override-max","entity-override-min-entity-source","entity-override-max-entity-source"].includes(t)?(vr(n,a,t.split("-")[2],t.endsWith("-entity-source")?"entity":"fixed",i),!0):!1}function wi(n,e){if((e==null?void 0:e.type)==="entity"){let s=e.index,l=Je(n,e,"min",!0),o=Je(n,e,"max",!0),d=!Js(n,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${s}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${s}"${d?" checked":""}>
	                          <label for="entity-${s}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${s}-min">Min fallback</label>
                        <input id="entity-${s}-min" type="number" step="any" data-kind="entity-override-min" data-index="${s}" value="${F(l.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${be("entity-override-min-entity-source",s,l.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${s}-max">Max fallback</label>
                        <input id="entity-${s}-max" type="number" step="any" data-kind="entity-override-max" data-index="${s}" value="${F(o.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${be("entity-override-max-entity-source",s,o.entity,"inherit card default")}
                      </div>
	                          `}let t=Si(n,"min"),r=Si(n,"max"),i=xi(n,"min"),a=xi(n,"max");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${F(t)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${be("scale-min-entity-source","card",i)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${F(r)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${be("scale-max-entity-source","card",a)}
            </div>
          </div>
	        </div>`}var $a=U(()=>{re();ve()});function De(n,e,t){var r,i;return(i=(r=n.read(e,["formatting",t]))!=null?r:n.read(e,[t]))!=null?i:""}function ki(n,e,t){let r=[["formatting",t],[t]];for(let i of r){let a=n.read(e,i);if(a!=null&&a!=="")return a}if((e==null?void 0:e.type)==="entity")for(let i of r){let a=n.read({type:"card"},i);if(a!=null&&a!=="")return a}return""}function $i(n,e,t){let r=N(t).trim();return n.mutate(e,i=>{let a=r?P(i,["formatting","unit"],r):x(i,["formatting","unit"]);return a=x(a,["unit"]),G(a,["formatting"])})}function Mi(n,e,t){let r=Te(t),i=t===""||t===null||t===void 0;return!i&&r===null?!1:n.mutate(e,a=>{let s=i?x(a,["formatting","decimal"]):P(a,["formatting","decimal"],r);return s=x(s,["decimal"]),G(s,["formatting"])})}function Ma(n,e){return n.mutate(e,t=>{let r=Pe(t,[["formatting","unit"],["formatting","decimal"],["unit"],["decimal"]]);return G(r,["formatting"])},{rerender:!0})}function Va(n,e){var r;let t=(r=n.read(e,["formatting"]))!=null?r:{};return V(t)&&(Object.prototype.hasOwnProperty.call(t,"unit")||Object.prototype.hasOwnProperty.call(t,"decimal"))?!0:n.read(e,["unit"])!==void 0||n.read(e,["decimal"])!==void 0}function Wn(n,e){let t=[],r=De(n,e,"unit"),i=De(n,e,"decimal");return r!==""&&t.push(`Unit ${r}`),i!==""&&t.push(`${i} ${Number(i)===1?"decimal":"decimals"}`),t.length?t.join(" \u2022 "):"Inherited"}function Sr(n,{field:e,kind:t,index:r,value:i}){if(e==="formatting-unit"||e==="formatting-decimal")return(e==="formatting-unit"?$i:Mi)(n,{type:"card"},i),!0;let a={type:"entity",index:Number(r)};return t==="entity-formatting-inherit"?(i&&Ma(n,a),!0):t==="entity-formatting-unit"||t==="entity-formatting-decimal"?((t==="entity-formatting-unit"?$i:Mi)(n,a,i),!0):!1}function Vi(n,e){if((e==null?void 0:e.type)==="entity"){let i=e.index,a=!Va(n,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${i}"${a?" checked":""}>
                          <label for="entity-${i}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-unit">Unit</label>
                        <input id="entity-${i}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${i}" value="${F(ki(n,e,"unit"))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${i}-formatting-decimal">Decimals</label>
                        <input id="entity-${i}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${i}" value="${F(ki(n,e,"decimal"))}" placeholder="inherit card default">
                      </div>
	                          `}let t=De(n,{type:"card"},"unit"),r=De(n,{type:"card"},"decimal");return`	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${F(t)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${F(r)}">
            </div>
          </div>
	        </div>`}var Fa=U(()=>{re();ve()});function Ea(n){switch(n){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return"bands"}}function Pa(n,e){var i;let t=n.read(e,["bar","fill_style"]);if(t)return t;let r=(i=n.read(e,["bar","color_mode"]))!=null?i:n.read(e,["color_mode"]);return Ea(r)}function Se(n,e){return(e==null?void 0:e.type)==="entity"?Fe(n.read(e,[]),n.read({type:"card"},[]),{isCardScope:!1}).fill_style:Fe(n.read({type:"card"},[]),null,{isCardScope:!0}).fill_style}function xr(n,e){var t,r;return(r=(t=n.read(e,["bar","color"]))!=null?t:n.read(e,["color"]))!=null?r:"#4a9eff"}function Ta(n,e){let t=[["bar","color"],["color"]];for(let r of t){let i=n.read(e,r);if(i!=null&&i!=="")return i||"#4a9eff"}if((e==null?void 0:e.type)==="entity")for(let r of t){let i=n.read({type:"card"},r);if(i!=null&&i!=="")return i||"#4a9eff"}return"#4a9eff"}function Ti(n,e,t,r,i=[]){let a={deprecatedKeys:i,prunePaths:[["bar"]]};return n.mutate(e,s=>{let l=r===void 0?x(s,["bar",t]):P(s,["bar",t],r);return l=Pe(l,i),G(l,["bar"])},a)}function Fi(n,e,t){let r=N(t).trim();return Ti(n,e,"fill_style",r||void 0,[["color_mode"]])}function Ei(n,e,t,r={}){let i=ie(t,r.cssText),a=!i||j(i)===j("#4a9eff");return Ti(n,e,"color",a?void 0:i,[["color"]])}function Xe(n,e){return!!n.read(e,["bar","solid_fill"])}function Ra(n,e){if((e==null?void 0:e.type)!=="entity")return Xe(n,e);let t=n.read(e,["bar","solid_fill"]);return t!==void 0?!!t:Xe(n,{type:"card"})}function Pi(n,e,t){return Ti(n,e,"solid_fill",t?!0:void 0)}function Da(n,e){return!!Fe(n.read(e,[]),(e==null?void 0:e.type)==="entity"?n.read({type:"card"},[]):null).animated}function Xs(n,e,t){var i;let r=(i=n.read(e,["animated"]))!=null?i:(e==null?void 0:e.type)==="entity"?Fe(n.read({type:"card"},[]),null).animated:!0;return Ti(n,e,"animated",t?r?void 0:!0:!1)}function Ca(n,e){return n.mutate(e,t=>{let r=Pe(t,[["bar","fill_style"],["bar","color"],["bar","solid_fill"],["color_mode"],["color"]]);return G(r,["bar"])},{rerender:!0})}function za(n,e){var r;let t=(r=n.read(e,["bar"]))!=null?r:{};return V(t)&&(Object.prototype.hasOwnProperty.call(t,"fill_style")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"solid_fill"))?!0:n.read(e,["color_mode"])!==void 0||n.read(e,["color"])!==void 0}function Hn(n,e){var a;let t=[],r=Pa(n,e),i=(a=n.read(e,["bar","color"]))!=null?a:n.read(e,["color"]);return r&&r!=="bands"&&t.push(r.replace(/_/g," ")),i&&j(i)!==j("#4a9eff")&&t.push("Custom color"),t.length?t.join(" \u2022 "):"Inherited"}function ht(n,{field:e,kind:t,index:r,value:i},a={}){if(a.animation&&e==="bar-animated")return Xs(n,{type:"card"},i),!0;let s={"bar-fill-style":Fi,"bar-color":Ei,"bar-solid-fill":Pi};if(Object.prototype.hasOwnProperty.call(s,e))return s[e](n,{type:"card"},i,a),!0;let l={type:"entity",index:Number(r)};if(t==="entity-bar-inherit")return i&&Ca(n,l),!0;let o={"entity-bar-fill-style":Fi,"entity-bar-color":Ei,"entity-bar-solid-fill":Pi};return Object.prototype.hasOwnProperty.call(o,t)?(o[t](n,l,i),!0):!1}function wr(n,e,t=()=>"",r={}){if((e==null?void 0:e.type)==="entity"){let l=e.index,o=!za(n,e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${l}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${l}"${o?" checked":""}>
                          <label for="entity-${l}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-fill-style">Fill style</label>
                        <select id="entity-${l}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${l}" value="${F(Se(n,e))}">
                          <option value="bands"${Se(n,e)==="bands"?" selected":""}>bands</option>
                          <option value="solid"${Se(n,e)==="solid"?" selected":""}>solid</option>
                          <option value="gradient"${Se(n,e)==="gradient"?" selected":""}>gradient</option>
                          <option value="soft_bands"${Se(n,e)==="soft_bands"?" selected":""}>soft_bands</option>
                          <option value="band_gradient"${Se(n,e)==="band_gradient"?" selected":""}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${l}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${l}"${Ra(n,e)?" checked":""}>
                          <label for="entity-${l}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${l}-bar-color">Bar color</label>
                        ${K({id:`entity-${l}-bar-color`,kind:"entity-bar-color",index:l,value:Ta(n,e),fallbackHex:"#4a9eff",placeholder:"inherit card default"})}
                      </div>
	                          `}let i=Se(n,{type:"card"}),a=xr(n,{type:"card"}),s=Xe(n,{type:"card"});return`	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${F(i)}">
                <option value="solid"${i==="solid"?" selected":""}>solid</option>
                <option value="gradient"${i==="gradient"?" selected":""}>gradient</option>
                <option value="bands"${i==="bands"?" selected":""}>bands</option>
                <option value="band_gradient"${i==="band_gradient"?" selected":""}>band_gradient</option>
                <option value="soft_bands"${i==="soft_bands"?" selected":""}>soft_bands</option>
              </select>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="bar-solid-fill" type="checkbox" data-field="bar-solid-fill"${s?" checked":""}>
                <label for="bar-solid-fill">Solid fill</label>
              </div>
            </div>
            ${r.animation?`<div class="field-row"><div class="toggle">
              <input id="bar-animated" type="checkbox" data-field="bar-animated"${Da(n,e)?" checked":""}>
              <label for="bar-animated">Animated</label>
            </div></div>`:""}<div class="field-row">
              <label for="bar-color">Bar color</label>
              ${K({cssText:r.cssText,label:"Bar color",id:"bar-color",field:"bar-color",value:a,fallbackHex:"#4a9eff",placeholder:"#4a9eff"})}
            </div>
          </div>${t()}
	        </div>`}var Ri=U(()=>{xe();re();ve()});var ft,Oa=U(()=>{Ri();re();ft=class{constructor(e,t,r){this.context=e,this.ui=t,this.array=r}get shadowRoot(){return this.ui.root()}fillStyle(e){return Se(this.context,e)}_getShadowElementById(e){var t,r,i,a;return(a=(r=(t=this.shadowRoot)==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?a:(i=this.shadowRoot)==null?void 0:i.querySelector(`#${e}`)}_renderListRows(e,t){return e.map(t).join("")}handle(e,t=e.type){var w,k,M,$,T,B,E,z;let r=e.target;if(t==="input"&&(r==null?void 0:r.type)==="checkbox")return!1;let i=(w=r==null?void 0:r.dataset)==null?void 0:w.kind,a=i==null?void 0:i.replace(/-text-fallback$/,""),s=(k=r==null?void 0:r.dataset)==null?void 0:k.action,l=!!this._getScopedSegmentsValue,o=l?"segment":"gradient",d=(M=t==="click"?s:a)==null?void 0:M.includes("entity-"),c=d?{type:"entity",index:Number(r.dataset.index)}:{type:"card"},u=a==null?void 0:a.replace(/^entity-/,""),h=Number(d?r.dataset[l?"segmentIndex":"stopIndex"]:($=r==null?void 0:r.dataset)==null?void 0:$.index),p=()=>l?this._getScopedSegmentsValue(c):this._getScopedGradientStopsValue(c),f=(C,O,A)=>l?this._setScopedSegments(c,C,O,A):this._setScopedGradientStops(c,C,O,A),b=()=>l?this._commitSegmentDraft(c):this._commitGradientStopDraft(c),g=()=>l?this._refreshSegmentUi(c):this._refreshGradientDraftUi(c);if(t==="click")return!["add-segment","remove-segment","add-entity-segment","remove-entity-segment","add-gradient-stop","remove-gradient-stop","add-entity-gradient-stop","remove-entity-gradient-stop"].includes(s)||!s.includes(o)?!1:(s.startsWith("add-")?(this.ui.focus(`#${d?`entity-${c.index}-`:""}${o}-draft-${l?"from":"pos"}`),b()):f(p().filter((C,O)=>O!==h),{rerender:!0,...l?{sort:!0}:{}},{type:"remove",index:h}),!0);if(a===`entity-${l?"segments":"gradient-stops"}-inherit`)return r.checked&&(l?this._clearSegmentsOverride(c):this._clearGradientStopsOverride(c)),!0;if(!(u!=null&&u.startsWith(`${o}-`)))return!1;let _=u.startsWith(`${o}-draft-`),y=u.slice((_?`${o}-draft-`:`${o}-`).length),m=(B=(T=e.detail)==null?void 0:T.value)!=null?B:r.value;if(t==="keydown")return e.key==="Escape"&&_?((E=e.preventDefault)==null||E.call(e),l?this._segmentDrafts.set(this._getSegmentsScopeKey(c),this._createSegmentDraftState(c)):this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(c),this._createGradientStopDraftState(c)),this.ui.render()):e.key==="Enter"&&((z=e.preventDefault)==null||z.call(e),_?b():l&&["from","to"].includes(y)?this._commitSegmentBoundaryEdit(c,h,y,m,r):!l&&y==="pos"&&this._commitGradientStopPosEdit(c,h,m,r)),!0;if(_)return l?this._setSegmentDraftField(c,y,m):this._setGradientStopsDraftField(c,y,m),!0;if(l&&["from","to"].includes(y)||!l&&y==="pos")return t==="input"?l?(this._setSegmentBoundaryText(c,h,y,m),g()):this._setGradientStopPosText(c,h,m):t==="change"&&(l?this._commitSegmentBoundaryEdit(c,h,y,m,r):this._commitGradientStopPosEdit(c,h,m,r)),!0;let v=p(),S=v.map((C,O)=>{var A,I;return O!==h?C:l?{...C,color:m}:{...C,pos:(A=this._normalizeGradientStopPosValue(C==null?void 0:C.pos))!=null?A:0,color:y==="color"?m:(I=C==null?void 0:C.color)!=null?I:"#4a9eff"}});return(l||ge(S)!==ge(this._sanitizeGradientStopsForEmit(v)))&&f(S,l?{sort:!1}:{},{type:"edit",index:h,field:"color",value:m}),!0}}});var pt,Ba=U(()=>{re();ve();xe();lr();br();Oa();pt=class extends ft{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._segmentDrafts=new Map,this._segmentUiRows=new Map,this._segmentBoundaryTexts=new Map}_setSegments(e,t={}){return this._setScopedSegments({type:"card"},e,t)}_clearSegmentsOverride(e){return this._segmentDrafts.delete(this._getSegmentsScopeKey(e)),this._segmentUiRows.delete(this._getSegmentsScopeKey(e)),this._clearSegmentScopeTextState(e),this.context.mutate(e,t=>{let r=x(t,["bar","segments"]);return r=x(r,["segments"]),r=x(r,["severity"]),r=G(r,["bar"]),r},{rerender:!0})}_getSegmentsValue(){return this._getScopedSegmentsValue({type:"card"})}_getSegmentsScopeKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getSegmentBoundaryTextKey(e,t,r){return`${this._getSegmentsScopeKey(e)}:${t}:${r}`}_getSegmentBoundaryText(e={type:"card"},t,r,i=""){let a=this._getSegmentBoundaryTextKey(e,t,r);return this._segmentBoundaryTexts.has(a)?this._segmentBoundaryTexts.get(a):this._formatSegmentBoundaryValue(i)}_setSegmentBoundaryText(e,t,r,i){this._segmentBoundaryTexts.set(this._getSegmentBoundaryTextKey(e,t,r),N(i))}_clearSegmentBoundaryText(e,t,r){this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(e,t,r))}_clearSegmentScopeTextState(e){let t=`${this._getSegmentsScopeKey(e)}:`;for(let r of this._segmentBoundaryTexts.keys())r.startsWith(t)&&this._segmentBoundaryTexts.delete(r)}_getSegmentsUiRows(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentUiRows.has(t)?D(this._segmentUiRows.get(t)):null}_setSegmentsUiRows(e,t){this._segmentUiRows.set(this._getSegmentsScopeKey(e),D(t))}_getSegmentDraftState(e={type:"card"}){let t=this._getSegmentsScopeKey(e);return this._segmentDrafts.has(t)||this._segmentDrafts.set(t,this._createSegmentDraftState(e)),D(this._segmentDrafts.get(t))}_setSegmentDraftState(e,t,r={}){var i,a,s;if(this._segmentDrafts.set(this._getSegmentsScopeKey(e),{from:(i=t==null?void 0:t.from)!=null?i:"",to:(a=t==null?void 0:t.to)!=null?a:"",color:(s=t==null?void 0:t.color)!=null?s:this._getSegmentDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshSegmentUi(e);return}this.ui.render()}_setSegmentDraftField(e,t,r){let i=this._getSegmentDraftState(e),a=t==="color"?ie(r,this.array.cssText):N(r);this._setSegmentDraftState(e,{...i,[t]:a},{refreshOnly:!0})}_isSegmentFillStyle(e){return["bands","soft_bands","band_gradient"].includes(e)}_getDefaultSegments(){return[{from:"0%",to:"33%",color:"#4CAF50"},{from:"33%",to:"75%",color:"#FF9800"},{from:"75%",to:"100%",color:"#F44336"}]}_getStoredScopedSegments(e={type:"card"}){let t=this.context.read(e,["bar","segments"]);if(t!==void 0)return t;let r=this.context.read(e,["segments"]);if(r!==void 0)return r;let i=this.context.read(e,["severity"]);return i!==void 0?i:null}_parseSegmentBoundaryInput(e){let t=N(e).trim();if(!t)return null;let r=t.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/),i=r?parseFloat(r[1]):null;if(Number.isFinite(i))return`${i}%`;let a=ne(t);return a===null?null:a}_formatSegmentBoundaryValue(e){if(typeof e=="string")return e;if(typeof e=="number"&&Number.isFinite(e))return String(e);if(V(e)){if(Number.isFinite(e.percent))return`${e.percent}%`;if(Number.isFinite(this._getFiniteNumber(e.fixed)))return String(this._getFiniteNumber(e.fixed))}return""}_getSegmentDraftColorDefault(e={type:"card"}){var r;let t=this._getScopedSegmentsValue(e);return t.length?N((r=t[t.length-1])==null?void 0:r.color).trim()||"#4a9eff":"#4CAF50"}_getNewSegmentDefaults(e={type:"card"}){var a;let t=this._getScopedSegmentsValue(e),r=t[t.length-1],i=(a=r==null?void 0:r.to)!=null?a:null;return{from:i!=null?i:"0%",to:"100%",color:"#4a9eff"}}_createSegmentDraftState(e={type:"card"}){var l;let t=this._getNewSegmentDefaults(e),r=this._formatSegmentBoundaryValue(t.from),i=this._formatSegmentBoundaryValue(t.to),a=r==="100%"||r==="100"?"":r;return{from:a,to:a?i:"",color:(l=t.color)!=null?l:this._getSegmentDraftColorDefault(e)}}_normalizeSegmentForEditorComparison(e){if(!V(e))return null;let t=this._formatSegmentBoundaryValue(e.from).trim(),r=this._formatSegmentBoundaryValue(e.to).trim(),i=j(e.color);return!t||!r||!i?null:{from:t,to:r,color:i}}_segmentsEqualForEditor(e,t){let r=Array.isArray(e)?e.map(a=>this._normalizeSegmentForEditorComparison(a)).filter(Boolean):[],i=Array.isArray(t)?t.map(a=>this._normalizeSegmentForEditorComparison(a)).filter(Boolean):[];return r.length!==i.length?!1:r.every((a,s)=>a.from===i[s].from&&a.to===i[s].to&&a.color===i[s].color)}_getFallbackSegments(e={type:"card"}){return(e==null?void 0:e.type)==="entity"&&this._getStoredScopedSegments({type:"card"})!==null?D(this._getScopedSegmentsValue({type:"card"})):this._isSegmentFillStyle(this.fillStyle(e))?D(this._getDefaultSegments()):[]}_parseSegmentBoundaryText(e){let t=N(e).trim();if(!t)return{state:"empty",value:null};let r=this._parseSegmentBoundaryInput(t);return r===null?{state:"invalid",value:null}:{state:"valid",value:r}}_compareSegmentBoundaries(e,t){let r=this._getSegmentPreviewBoundaryValue(e),i=this._getSegmentPreviewBoundaryValue(t);return r===null||i===null?null:r<i?-1:r>i?1:0}_buildSegmentValidationRows(e={type:"card"}){var r;return((r=this._getSegmentsUiRows(e))!=null?r:this._getScopedSegmentsValue(e)).map((i,a)=>{let s=this._getSegmentBoundaryText(e,a,"from",i==null?void 0:i.from),l=this._getSegmentBoundaryText(e,a,"to",i==null?void 0:i.to),o=this._parseSegmentBoundaryText(s),d=this._parseSegmentBoundaryText(l);return{index:a,rawFrom:s,rawTo:l,parsedFrom:o,parsedTo:d}})}_getAutomaticEndInputRows(e){return this._getScopedSegmentsValue(e).map((t,r)=>{let i=this._getSegmentBoundaryText(e,r,"from",t==null?void 0:t.from),a=this._getSegmentBoundaryText(e,r,"to",t==null?void 0:t.to);return{...t,from:i,...a.trim()?{to:a}:{to:void 0}}})}_resolveAutomaticEndRows(e,t){var o,d,c,u;let r=this.context.read({type:"card"},[]),i=(e==null?void 0:e.type)==="entity"?this.context.read(e,[]):{},a=We(r,null),s=jr((d=(o=this.ui).hass)==null?void 0:d.call(o),(e==null?void 0:e.type)==="entity"?We(i,{scale:a}):a),l=Ue(t.map((h,p)=>({...h,to:typeof h.to=="string"&&!h.to.trim()?void 0:h.to,label:p})),{legacySegmentSpace:(u=(c=this.array).segmentSpace)==null?void 0:u.call(c)});return Ne({bar:{segments:l}},s.min,s.max)}_getAutomaticEndValidationMessage(e,t,r){let i=t[r];if(!i)return"";let a=this._parseSegmentBoundaryText(i.from),s=this._parseSegmentBoundaryText(i.to);if(a.state!=="valid"||s.state==="invalid")return"Enter valid from/to values.";let l=this._resolveAutomaticEndRows(e,t),o=l.find(d=>d.label===r);if(!o||o.from>=o.to)return"From must be below To.";for(let d of l)if(!(d.label===r||d.from>=d.to)){if(o.from===d.from)return"Duplicate segment start.";if(o.from<d.to&&o.to>d.from)return"Segments overlap."}return""}_getSegmentRowValidationMessage(e={type:"card"},t){if(this.array.autoEnds)return this._getAutomaticEndValidationMessage(e,this._getAutomaticEndInputRows(e),t);let r=this._buildSegmentValidationRows(e),i=r[t];if(!i)return"";if(i.parsedFrom.state==="invalid"||i.parsedTo.state==="invalid"||i.parsedFrom.state==="empty"||i.parsedTo.state==="empty")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(i.parsedFrom.value,i.parsedTo.value)!==-1)return"From must be below To.";let a=this._getSegmentPreviewBoundaryValue(i.parsedFrom.value),s=this._getSegmentPreviewBoundaryValue(i.parsedTo.value);for(let l of r){if(l.index===t||l.parsedFrom.state!=="valid"||l.parsedTo.state!=="valid")continue;let o=this._getSegmentPreviewBoundaryValue(l.parsedFrom.value),d=this._getSegmentPreviewBoundaryValue(l.parsedTo.value);if(a===o)return"Duplicate segment start.";if(a<d&&s>o)return"Segments overlap."}return""}_getValidSegmentDraft(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.color.trim()||!CSS.supports("color",t.color))return null;let d=[...this._getAutomaticEndInputRows(e),t];if(this._getAutomaticEndValidationMessage(e,d,d.length-1))return null;let c=this._parseSegmentBoundaryInput(t.from),u=this._parseSegmentBoundaryInput(t.to);return{from:c,...t.to.trim()?{to:u}:{},color:t.color}}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),a=N(t.color).trim();if(r.state!=="valid"||i.state!=="valid"||!a||this._compareSegmentBoundaries(r.value,i.value)!==-1)return null;let s=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),o=this._buildSegmentValidationRows(e);for(let d of o){if(d.parsedFrom.state!=="valid"||d.parsedTo.state!=="valid")continue;let c=this._getSegmentPreviewBoundaryValue(d.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(d.parsedTo.value);if(s===c||s<u&&l>c)return null}return{from:r.value,to:i.value,color:a}}_canAddSegment(e={type:"card"}){return!!this._getValidSegmentDraft(e)}_getSegmentDraftValidationMessage(e={type:"card"}){let t=this._getSegmentDraftState(e);if(this.array.autoEnds){if(!t.from.trim())return"Enter a start value to add a segment.";if(!t.color.trim()||!CSS.supports("color",t.color))return"Enter a valid CSS color.";let d=[...this._getAutomaticEndInputRows(e),t];return this._getAutomaticEndValidationMessage(e,d,d.length-1)}let r=this._parseSegmentBoundaryText(t.from),i=this._parseSegmentBoundaryText(t.to),a=N(t.color).trim();if(!N(t.from).trim()&&!N(t.to).trim())return"";if(r.state!=="valid"||i.state!=="valid")return"Enter valid from/to values.";if(this._compareSegmentBoundaries(r.value,i.value)!==-1)return"From must be below To.";if(!a)return"Choose a color to add a segment.";let s=this._getSegmentPreviewBoundaryValue(r.value),l=this._getSegmentPreviewBoundaryValue(i.value),o=this._buildSegmentValidationRows(e);for(let d of o){if(d.parsedFrom.state!=="valid"||d.parsedTo.state!=="valid")continue;let c=this._getSegmentPreviewBoundaryValue(d.parsedFrom.value),u=this._getSegmentPreviewBoundaryValue(d.parsedTo.value);if(s===c)return"Duplicate segment start.";if(s<u&&l>c)return"Segments overlap."}return""}_getSegmentPreviewBoundaryValue(e){if(typeof e=="string"){let t=e.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);if(t){let r=parseFloat(t[1]);return Number.isFinite(r)?r:null}}if(typeof e=="number"&&Number.isFinite(e))return e;if(V(e)){if(Number.isFinite(e.percent))return e.percent;let t=this._getFiniteNumber(e.fixed);if(Number.isFinite(t))return t}return null}_sortSegmentsForEditor(e){return Array.isArray(e)?D(e).sort((t,r)=>{let i=this._getSegmentPreviewBoundaryValue(t==null?void 0:t.from),a=this._getSegmentPreviewBoundaryValue(r==null?void 0:r.from);return i===null&&a===null?0:i===null?1:a===null?-1:i-a}):[]}_getSegmentPreviewRows(e={type:"card"}){var a;if(this.array.autoEnds){let s=this._getValidSegmentDraft(e);return this._resolveAutomaticEndRows(e,[...this._getAutomaticEndInputRows(e),...s?[s]:[]])}let t=(a=this._getSegmentsUiRows(e))!=null?a:this._getScopedSegmentsValue(e),r=this._sortSegmentsForEditor(t),i=this._getValidSegmentDraft(e);return i&&r.push(i),this._sortSegmentsForEditor(r).filter(s=>{let l=this._getSegmentPreviewBoundaryValue(s==null?void 0:s.from),o=this._getSegmentPreviewBoundaryValue(s==null?void 0:s.to);return l!==null&&o!==null&&typeof(s==null?void 0:s.color)=="string"&&s.color.trim()})}_buildEditorSegmentPreviewStyle(e={type:"card"}){let t=this._getSegmentPreviewRows(e);if(!t.length)return"";let r=this.fillStyle(e),i=[];return t.forEach(a=>{let s=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(a.from))),l=Math.max(0,Math.min(100,this._getSegmentPreviewBoundaryValue(a.to)));i.push(`${a.color} ${s}%`,`${a.color} ${l}%`)}),r==="bands"?`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`:`background:linear-gradient(to right,${i.join(",")});background-repeat:no-repeat;`}_getSegmentPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-segment-preview`,trackId:`entity-${e.index}-segment-preview-track`}:{previewId:"card-segment-preview",trackId:"card-segment-preview-track"}}_renderSegmentPreview(e={type:"card"}){var l;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getSegmentPreviewRows(e),a=[];i.forEach(o=>{let d=this._getSegmentPreviewBoundaryValue(o.from),c=this._getSegmentPreviewBoundaryValue(o.to);d!==null&&a.push(d),c!==null&&a.push(c)});let s=[...new Set(a)].sort((o,d)=>o-d);return`
      <div id="${t}" class="gradient-preview segment-preview">
        <div id="${r}" class="gradient-preview-track segment-preview-track" style="${F((l=this._buildEditorSegmentPreviewStyle(e))!=null?l:"")}">
          ${s.map((o,d)=>`
            <span
              id="${t}-stop-${d}"
              class="gradient-preview-stop"
              style="left:${F(String(o))}%"
              title="${F(`${o}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_refreshSegmentPreview(e={type:"card"}){var o;let{previewId:t,trackId:r}=this._getSegmentPreviewDomIds(e),i=this._getShadowElementById(r);if(!i)return;i.setAttribute("style",(o=this._buildEditorSegmentPreviewStyle(e))!=null?o:"");let a=this._getSegmentPreviewRows(e),s=[];a.forEach(d=>{let c=this._getSegmentPreviewBoundaryValue(d.from),u=this._getSegmentPreviewBoundaryValue(d.to);c!==null&&s.push(c),u!==null&&s.push(u)});let l=[...new Set(s)].sort((d,c)=>d-c);i.innerHTML=l.map((d,c)=>`
      <span
        id="${t}-stop-${c}"
        class="gradient-preview-stop"
        style="left:${F(String(d))}%"
        title="${F(`${d}%`)}"
      ></span>
    `).join("")}_getSegmentDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{hintPrefix:`entity-${e.index}-segment-row-hint-`,draftHintId:`entity-${e.index}-segment-draft-hint`,addSelector:`button[data-action="add-entity-segment"][data-index="${e.index}"]`}:{hintPrefix:"segment-row-hint-",draftHintId:"segment-draft-hint",addSelector:'button[data-action="add-segment"]'}}_refreshSegmentUi(e={type:"card"}){var o,d;if(this._refreshSegmentPreview(e),!this.shadowRoot)return;let{hintPrefix:t,draftHintId:r,addSelector:i}=this._getSegmentDomIds(e),a=this.shadowRoot.querySelector(i);a&&(a.disabled=!this._canAddSegment(e)),((o=this._getSegmentsUiRows(e))!=null?o:this._getScopedSegmentsValue(e)).forEach((c,u)=>{var f;let h=this._getShadowElementById(`${t}${u}`),p=this._getSegmentRowValidationMessage(e,u);h&&(h.textContent=p,(f=h.setAttribute)==null||f.call(h,"style",p?"":"display:none"))});let l=this._getShadowElementById(r);if(l){let c=this._getSegmentDraftValidationMessage(e);l.textContent=c,(d=l.setAttribute)==null||d.call(l,"style",c?"":"display:none")}}_commitSegmentDraft(e={type:"card"}){var s;let t=this._getValidSegmentDraft(e);if(!t)return this._refreshSegmentUi(e),!1;let r=(s=this._getSegmentsUiRows(e))!=null?s:this._getScopedSegmentsValue(e),i=this._sortSegmentsForEditor([...r,t]),a=this._setScopedSegments(e,i,{rerender:!0},{type:"add",item:t});return a!==!1&&this._segmentDrafts.set(this._getSegmentsScopeKey(e),this._createSegmentDraftState(e)),a}_commitSegmentBoundaryEdit(e={type:"card"},t,r,i,a=null){var f,b,g,_,y;this._setSegmentBoundaryText(e,t,r,i);let s=this._parseSegmentBoundaryText(i);if(s.state!=="valid"&&!(this.array.autoEnds&&r==="to"&&s.state==="empty"))return(f=a==null?void 0:a.setCustomValidity)==null||f.call(a,"Enter a valid boundary value."),this._refreshSegmentUi(e),!1;if(this.array.patchOnly){let m=this._getSegmentRowValidationMessage(e,t);if(m)return(b=a==null?void 0:a.setCustomValidity)==null||b.call(a,m),(g=a==null?void 0:a.reportValidity)==null||g.call(a),this._refreshSegmentUi(e),!1}let l=N(i).trim(),o=this._parseSegmentBoundaryInput(i),d=this.array.autoEnds&&r==="to"&&!l?void 0:o===null?l:o,u=((_=this._getSegmentsUiRows(e))!=null?_:this._getScopedSegmentsValue(e)).map((m,v)=>v===t?{...m,[r]:d}:m);this._clearSegmentBoundaryText(e,t,r);let h=this._setScopedSegments(e,u,{rerender:!0},{type:"edit",index:t,field:r,value:d}),p=this._getSegmentRowValidationMessage(e,t);return a!=null&&a.setCustomValidity&&(a.setCustomValidity(p||""),p&&((y=a.reportValidity)==null||y.call(a))),h}_getScopedSegmentsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getSegmentsUiRows(e);if(t!==null)return D(t);let r=this._getStoredScopedSegments(e);return r!==null?this._sortSegmentsForEditor(r):this._sortSegmentsForEditor(this._getFallbackSegments(e))}_hasSegmentsOverride(e){return this._getStoredScopedSegments(e)!==null}_getSegmentsSummary(e){let t=this._getScopedSegmentsValue(e);return!Array.isArray(t)||t.length===0?"Inherited":(e==null?void 0:e.type)!=="entity"&&!this._hasSegmentsOverride(e)&&this._isSegmentFillStyle(this.fillStyle(e))?"Default bands":`${t.length} segments`}_setScopedSegments(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let s=e.index,l=this._getScopedSegmentsValue(e),o=!this._hasSegmentsOverride(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${s}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${s}"${o?" checked":""}>
                          <label for="entity-${s}-segments-inherit">Inherit card settings</label>
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
                              <input type="text" data-kind="entity-segment-from" data-index="${s}" data-segment-index="${c}" value="${F(this._getSegmentBoundaryText(e,c,"from",d==null?void 0:d.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${s}" data-segment-index="${c}" value="${F(this._getSegmentBoundaryText(e,c,"to",d==null?void 0:d.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${s}" data-segment-index="${c}" value="${F((u=d==null?void 0:d.color)!=null?u:"#4a9eff")}">
                              <button type="button" data-action="remove-entity-segment" data-index="${s}" data-segment-index="${c}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                            <div id="entity-${s}-segment-row-hint-${c}" class="section-note"${this._getSegmentRowValidationMessage(e,c)?"":' style="display:none"'}>${F(this._getSegmentRowValidationMessage(e,c))}</div>
                            </div>
                          `})}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${s}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${s}" value="${F(this._getSegmentDraftState(e).from)}" placeholder="0%">
                              <input id="entity-${s}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${s}" value="${F(this._getSegmentDraftState(e).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${s}" value="${F(this._getSegmentDraftState(e).color||"#4a9eff")}">
                              <button type="button" data-action="add-entity-segment" data-index="${s}"${this._canAddSegment(e)?"":" disabled"}>Add</button>
                            </div>
                            <div id="entity-${s}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(e)?"":' style="display:none"'}>${F(this._getSegmentDraftValidationMessage(e))}</div>
                          </div>
                        </div>
                      </div>
	                          `}let r=this.fillStyle(e),i=this._getScopedSegmentsValue(e),a=!this._hasSegmentsOverride(e)&&this._isSegmentFillStyle(r);return`	        <div class="section">
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
	                  ${a?'<div class="section-note">Default bands</div>':""}
	                  ${this._renderListRows(i,(s,l)=>{var o,d;return`
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} start"`:""} data-kind="segment-from" data-index="${l}" value="${F(this._getSegmentBoundaryText({type:"card"},l,"from",s==null?void 0:s.from))}" placeholder="0%">
	                      <input type="text"${this.array.autoEnds?` aria-label="Segment ${l+1} end (blank = Auto)"`:""} data-kind="segment-to" data-index="${l}" value="${F(this._getSegmentBoundaryText({type:"card"},l,"to",s==null?void 0:s.to))}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
	                      ${this.array.cssText?K({id:`segment-color-${l}`,kind:"segment-color",index:l,value:(o=s==null?void 0:s.color)!=null?o:"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:`Segment ${l+1} color`}):`<input type="color" data-kind="segment-color" data-index="${l}" value="${F((d=s==null?void 0:s.color)!=null?d:"#4a9eff")}">`}
	                      <button type="button" data-action="remove-segment" data-index="${l}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
                      <div id="segment-row-hint-${l}" class="section-note"${this._getSegmentRowValidationMessage({type:"card"},l)?"":' style="display:none"'}>${F(this._getSegmentRowValidationMessage({type:"card"},l))}</div>
                      </div>
	                  `})}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds?' aria-label="New segment start"':""} data-kind="segment-draft-from" value="${F(this._getSegmentDraftState({type:"card"}).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds?' aria-label="New segment end (blank = Auto)"':""} data-kind="segment-draft-to" value="${F(this._getSegmentDraftState({type:"card"}).to)}" placeholder="${this.array.autoEnds?"Auto":"100%"}">
                        ${this.array.cssText?K({id:"segment-draft-color",kind:"segment-draft-color",value:this._getSegmentDraftState({type:"card"}).color||"#4a9eff",fallbackHex:"#4a9eff",cssText:!0,label:"New segment color"}):`<input type="color" data-kind="segment-draft-color" value="${F(this._getSegmentDraftState({type:"card"}).color||"#4a9eff")}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({type:"card"})?"":" disabled"}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({type:"card"})?"":' style="display:none"'}>${F(this._getSegmentDraftValidationMessage({type:"card"}))}</div>
                    </div>
	                </div>
	              </div>
	            `})}
	        </div>`}}});var mt,Ga=U(()=>{xe();re();ve();Oa();mt=class extends ft{constructor(e,t,r){super(e,t,r),this.reset()}reset(){this._gradientStopsDrafts=new Map,this._gradientStopsUiRows=new Map,this._gradientStopPosTexts=new Map,this._gradientStopValidationMessages=new Map}_setGradientStops(e,t={}){return this._setScopedGradientStops({type:"card"},e,t)}_getDefaultGradientStops(){return[{pos:0,color:"#4CAF50"},{pos:50,color:"#FF9800"},{pos:100,color:"#F44336"}]}_normalizeGradientStopPosValue(e){let t=Me(e),r=Number.isFinite(t)?t:ne(e);return r===null||!Number.isFinite(r)||r<0||r>100?null:r}_sanitizeGradientStopsForEmit(e){return Array.isArray(e)?e.map(t=>{if(!V(t))return null;let r=this._normalizeGradientStopPosValue(t.pos),i=N(t.color).trim();return r===null||!i?null:{...t,pos:r,color:i}}).filter(Boolean).sort((t,r)=>t.pos-r.pos):[]}_getGradientStopDraftColorDefault(e={type:"card"}){var r;let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return t.length?(r=t[t.length-1].color)!=null?r:"#4CAF50":this._getDefaultGradientStops()[0].color}_getNextSuggestedGradientStopPos(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));if(!t.length)return 0;let r=t[t.length-1];if(r.pos>=100)return"";let i;if(t.length===1)i=r.pos+25;else{let s=t[t.length-2];i=r.pos+(r.pos-s.pos)}let a=Math.min(100,Math.max(0,i));return t.some(s=>s.pos===a)?"":a}_getGradientStopsDraftKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGradientStopPosTextKey(e,t){return`${this._getGradientStopsDraftKey(e)}:pos:${t}`}_getGradientStopPosText(e={type:"card"},t,r=""){let i=this._getGradientStopPosTextKey(e,t);return this._gradientStopPosTexts.has(i)?this._gradientStopPosTexts.get(i):r===""||r===null||r===void 0?"":String(r)}_setGradientStopPosText(e,t,r){this._gradientStopPosTexts.set(this._getGradientStopPosTextKey(e,t),N(r))}_clearGradientStopPosText(e,t){this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(e,t))}_clearGradientStopScopeTextState(e){let t=`${this._getGradientStopsDraftKey(e)}:pos:`;for(let r of this._gradientStopPosTexts.keys())r.startsWith(t)&&this._gradientStopPosTexts.delete(r);for(let r of this._gradientStopValidationMessages.keys())r.startsWith(t)&&this._gradientStopValidationMessages.delete(r)}_getGradientStopsUiRows(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsUiRows.has(t)?D(this._gradientStopsUiRows.get(t)):null}_setGradientStopsUiRows(e,t){this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(e),D(t))}_getStoredScopedGradientStops(e={type:"card"}){let t=this.context.read(e,["bar","gradient_stops"]);if(t!==void 0)return t;let r=this.context.read(e,["gradient_stops"]);return r!==void 0?r:null}_getFallbackGradientStops(e={type:"card"}){if((e==null?void 0:e.type)==="entity"){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({type:"card"}));return t.length?t:this._getDefaultGradientStops()}return this._getDefaultGradientStops()}_createGradientStopDraftState(e={type:"card"}){let t=this._getNextSuggestedGradientStopPos(e);return{pos:t===""?"":String(t),color:this._getGradientStopDraftColorDefault(e)}}_getGradientStopsDraftState(e={type:"card"}){let t=this._getGradientStopsDraftKey(e);return this._gradientStopsDrafts.has(t)||this._gradientStopsDrafts.set(t,this._createGradientStopDraftState(e)),D(this._gradientStopsDrafts.get(t))}_setGradientStopsDraftState(e,t,r={}){var i,a;if(this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(i=t==null?void 0:t.pos)!=null?i:"",color:(a=t==null?void 0:t.color)!=null?a:this._getGradientStopDraftColorDefault(e)}),r!=null&&r.refreshOnly){this._refreshGradientDraftUi(e);return}this.ui.render()}_setGradientStopsDraftField(e,t,r){let i=this._getGradientStopsDraftState(e),a=t==="color"?N(r).trim():N(r);this._setGradientStopsDraftState(e,{...i,[t]:a},{refreshOnly:t==="pos"})}_getValidGradientDraftStop(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=this._normalizeGradientStopPosValue(t.pos),i=N(t.color).trim();return r===null||!i?null:{pos:r,color:i}}_hasGradientStopDuplicate(e={type:"card"},t,r=null){return this.array.patchOnly?this._getScopedGradientStopsValue(e).some((i,a)=>a!==r&&this._normalizeGradientStopPosValue(i==null?void 0:i.pos)===t):this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)).some((i,a)=>a!==r&&i.pos===t)}_canAddGradientStop(e={type:"card"}){let t=this._getValidGradientDraftStop(e);return t?!this._hasGradientStopDuplicate(e,t.pos):!1}_getGradientDraftValidationMessage(e={type:"card"}){let t=this._getGradientStopsDraftState(e),r=N(t.pos).trim(),i=N(t.color).trim();return r?this._normalizeGradientStopPosValue(t.pos)===null?"Enter a value from 0 to 100.":i?this._hasGradientStopDuplicate(e,this._normalizeGradientStopPosValue(t.pos))?"Position already exists.":"":"Choose a color to add a stop.":"Enter a position to add a stop."}_isDefaultGradientStops(e){let t=this._sanitizeGradientStopsForEmit(e),r=this._getDefaultGradientStops();return t.length!==r.length?!1:t.every((i,a)=>i.pos===r[a].pos&&j(i.color)===j(r[a].color))}_clearGradientStopsOverride(e){var i;let t=ge((i=this._getGradientStopsUiRows(e))!=null?i:[]);this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(e)),this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(e)),this._clearGradientStopScopeTextState(e);let r=this.context.mutate(e,a=>{let s=x(a,["bar","gradient_stops"]);return s=x(s,["gradient_stops"]),s=G(s,["bar"]),s},{rerender:!0});return r===!1&&t!==ge([])&&this.ui.render(),r}_getGradientStopsValue(){return this._getScopedGradientStopsValue({type:"card"})}_commitGradientStopDraft(e={type:"card"}){let t=this._getValidGradientDraftStop(e);if(!t||this._hasGradientStopDuplicate(e,t.pos))return this._refreshGradientDraftUi(e),!1;let i=[...this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),t].sort((s,l)=>s.pos-l.pos),a=this._setScopedGradientStops(e,i,{rerender:!0},{type:"add",item:t});return a!==!1&&this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(e),{pos:(()=>{let s=this._getNextSuggestedGradientStopPos(e);return s===""?"":String(s)})(),color:t.color}),a}_getGradientPreviewDomIds(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?{previewId:`entity-${e.index}-gradient-preview`,trackId:`entity-${e.index}-gradient-preview-track`,hintId:`entity-${e.index}-gradient-draft-hint`,addSelector:`button[data-action="add-entity-gradient-stop"][data-index="${e.index}"]`,draftInputId:`entity-${e.index}-gradient-draft-pos`}:{previewId:"card-gradient-preview",trackId:"card-gradient-preview-track",hintId:"gradient-draft-hint",addSelector:'button[data-action="add-gradient-stop"]',draftInputId:"gradient-draft-pos"}}_refreshGradientDraftUi(e={type:"card"}){var _,y,m;if(!this.shadowRoot)return;let t=(y=(_=this.shadowRoot.getElementById)==null?void 0:_.bind(this.shadowRoot))!=null?y:(v=>{var S,w,k;return(k=(w=(S=this.shadowRoot).querySelector)==null?void 0:w.call(S,`#${v}`))!=null?k:null}),{previewId:r,trackId:i,hintId:a,addSelector:s,draftInputId:l}=this._getGradientPreviewDomIds(e),o=this.shadowRoot.querySelector(s);o&&(o.disabled=!this._canAddGradientStop(e));let d=t(l);if(d&&typeof d.closest!="function"){this.ui.render();return}let c=d==null?void 0:d.closest(".gradient-stop-draft"),u=this._getGradientDraftValidationMessage(e),h=t(a);if(u){if(h)h.textContent=u;else if(c){let v=document.createElement("div");v.id=a,v.className="section-note",v.textContent=u,c.appendChild(v)}}else h&&h.remove();let p=t(r),f=t(i);if(!p||!f)return;f.setAttribute("style",(m=this._getGradientPreviewStyle(e))!=null?m:"");let b=this._buildGradientPreviewEffectiveStops(e),g=b.length?b:this._getDefaultGradientStops();f.innerHTML=g.map((v,S)=>`
      <span
        id="${r}-stop-${S}"
        class="gradient-preview-stop"
        style="left:${F(String(v.pos))}%"
        title="${F(`${v.pos}%`)}"
      ></span>
    `).join("")}_commitGradientStopPosEdit(e={type:"card"},t,r,i=null){let a=this._normalizeGradientStopPosValue(r);if(a===null||this._hasGradientStopDuplicate(e,a,t))return i!=null&&i.setCustomValidity&&(i.setCustomValidity(a===null?"Enter a value from 0 to 100.":"Position already exists."),i.reportValidity&&i.reportValidity()),!1;i!=null&&i.setCustomValidity&&i.setCustomValidity("");let l=this._getScopedGradientStopsValue(e).map((o,d)=>d===t?{...o,pos:a}:o);return this._clearGradientStopPosText(e,t),this._setScopedGradientStops(e,l,{rerender:!0},{type:"edit",index:t,field:"pos",value:a})}_getScopedGradientStopsValue(e){if(this.array.rows)return this.array.rows(e,this);let t=this._getGradientStopsUiRows(e);if(Array.isArray(t))return t;let r=this._getStoredScopedGradientStops(e);return r!==null?this._sanitizeGradientStopsForEmit(r):D(this._getFallbackGradientStops(e))}_hasGradientStopsOverride(e){if(this._getStoredScopedGradientStops(e)!==null)return!0;let t=this._getGradientStopsUiRows(e);return Array.isArray(t)?ge(this._sanitizeGradientStopsForEmit(t))!==ge(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(e))):!1}_getGradientStopsSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasGradientStopsOverride(e))return"Inherited";let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e));return this.fillStyle(e)!=="gradient"?"Inactive fill style":t.length?this._isDefaultGradientStops(t)?"Default gradient":`${t.length} stops`:(e==null?void 0:e.type)==="entity"?"Inherited":"Default gradient"}_buildGradientPreviewEffectiveStops(e={type:"card"}){let t=this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(e)),r=this._getValidGradientDraftStop(e),i=[...t];return r&&!this._hasGradientStopDuplicate(e,r.pos)&&i.push(r),i.sort((a,s)=>a.pos-s.pos)}_buildEditorGradientPreviewStyle(e){if(!Array.isArray(e)||!e.length)return"";let t=e.map(r=>{var s;let i=N(r.color).trim(),a=this._normalizeGradientStopPosValue((s=r.p)!=null?s:r.pos);return!i||a===null?null:`${i} ${a}%`}).filter(Boolean);return t.length?`background:linear-gradient(to right,${t.join(",")});background-repeat:no-repeat;`:""}_getGradientPreviewStyle(e={type:"card"}){let t=this._buildGradientPreviewEffectiveStops(e),r=t.length>=2?t.map(i=>({p:i.pos,color:i.color})):this._getDefaultGradientStops().map(i=>({p:i.pos,color:i.color}));return this._buildEditorGradientPreviewStyle(r)}_renderGradientPreview(e={type:"card"},t={}){var l,o,d;let r=(l=t.previewId)!=null?l:"gradient-preview",i=(o=t.trackId)!=null?o:`${r}-track`,a=this._buildGradientPreviewEffectiveStops(e),s=a.length?a:this._getDefaultGradientStops();return`
      <div id="${r}" class="gradient-preview">
        <div id="${i}" class="gradient-preview-track" style="${F((d=this._getGradientPreviewStyle(e))!=null?d:"")}">
          ${s.map((c,u)=>`
            <span
              id="${r}-stop-${u}"
              class="gradient-preview-stop"
              style="left:${F(String(c.pos))}%"
              title="${F(`${c.pos}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `}_setScopedGradientStops(e,t,r={},i){return this.array.write(e,t,r,i)}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let o=e.index,d=this._getScopedGradientStopsValue(e),c=this._getGradientStopsDraftState(e),u=this._getGradientDraftValidationMessage(e),h=!this._hasGradientStopsOverride(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${o}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${o}"${h?" checked":""}>
                          <label for="entity-${o}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this.fillStyle(e)!=="gradient"?'<div class="section-note">Only used with Gradient fill style</div>':""}
                      ${this._renderGradientPreview(e,{previewId:`entity-${o}-gradient-preview`,trackId:`entity-${o}-gradient-preview-track`})}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(d,(p,f)=>{var b,g;return`
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${o}" data-stop-index="${f}" value="${F(this._getGradientStopPosText(e,f,(b=p==null?void 0:p.pos)!=null?b:""))}" placeholder="0">
                              ${K({id:`entity-${o}-gradient-color-${f}`,kind:"entity-gradient-color",index:o,value:(g=p==null?void 0:p.color)!=null?g:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value",extraDataset:{"stop-index":f}})}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${o}" data-stop-index="${f}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                          `})}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${o}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${o}" value="${F(c.pos)}" placeholder="0">
                              ${K({id:`entity-${o}-gradient-draft-color`,kind:"entity-gradient-draft-color",index:o,value:c.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${o}"${this._canAddGradientStop(e)?"":" disabled"}>Add</button>
                            </div>
                            ${u?`<div id="entity-${o}-gradient-draft-hint" class="section-note">${F(u)}</div>`:""}
                          </div>
                        </div>
                      </div>
	                          `}let r=this._getScopedGradientStopsValue(e),i=this._getGradientStopsDraftState(e),a=this._getGradientDraftValidationMessage(e),s=this._getGradientStopsSummary(e),l=this.fillStyle(e)!=="gradient";return`	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${t({group:"gradient-stops",title:"Gradient Stops",summary:s,inactive:l,content:`
	              ${l?'<div class="section-note">Only used with Gradient fill style</div>':""}
	              ${this._renderGradientPreview({type:"card"},{previewId:"card-gradient-preview",trackId:"card-gradient-preview-track"})}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(r,(o,d)=>{var c,u;return`
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${d}" value="${F(this._getGradientStopPosText({type:"card"},d,(c=o==null?void 0:o.pos)!=null?c:""))}" placeholder="0">
	                      ${K({id:`gradient-color-${d}`,kind:"gradient-color",index:d,value:(u=o==null?void 0:o.color)!=null?u:"#4a9eff",fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${d}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
	                  `})}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${F(i.pos)}" placeholder="0">
	                      ${K({id:"gradient-draft-color",kind:"gradient-draft-color",index:"card",value:i.color,fallbackHex:"#4CAF50",placeholder:"CSS color value"})}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({type:"card"})?"":" disabled"}>Add</button>
	                    </div>
	                    ${a?`<div id="gradient-draft-hint" class="section-note">${F(a)}</div>`:""}
	                  </div>
	                </div>
	              </div>
	            `})}
	        </div>`}}});var bt,Na=U(()=>{re();ve();bt=class{constructor(e,t={}){this.options=t,this.context=e}_setNeedle(e){return this._setScopedNeedleMode({type:"card"},e?"enabled":"disabled")}_getScopedNeedleConfig(e){var s;let t=this.context.read(e,["bar","needle"]),r="#ffffff",i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",a="";return typeof t=="boolean"?i=t?"enabled":"disabled":V(t)&&(t.show===!0?i="enabled":(t.show===!1||(e==null?void 0:e.type)!=="entity")&&(i="disabled"),a=(s=t.color)!=null?s:""),a===r&&(a=""),{mode:i,color:a}}_hasNeedleOverride(e){return this.context.read(e,["bar","needle"])!==void 0}_getEffectiveScopedNeedleConfig(e){let t=this._getScopedNeedleConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasNeedleOverride(e))return this._getScopedNeedleConfig({type:"card"});let r=this._getScopedNeedleConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_setScopedNeedleMode(e,t){return this.context.mutate(e,r=>{let i=D(r),a=q(i,["bar","needle"]),s=V(a)?a.color:void 0;if(i=x(i,["bar","needle"]),(e==null?void 0:e.type)==="entity"&&t==="inherit")return i=G(i,["bar"]),i;if(t==="disabled")return(e==null?void 0:e.type)==="entity"&&(i=P(i,["bar","needle"],{show:!1})),i=G(i,["bar"]),i;let l={show:!0};return s&&s!=="#ffffff"&&(l.color=s),i=P(i,["bar","needle"],l),i=G(i,["bar"]),i},{needleEdit:{field:"mode",value:t}})}_setScopedNeedleColor(e,t){let r=ie(t,this.options.cssText);return this.context.mutate(e,i=>{let a=D(i),s=this._getScopedNeedleConfig(e),l=r&&j(r)!==j("#ffffff");if(a=x(a,["bar","needle","color"]),(e==null?void 0:e.type)!=="entity"&&s.mode==="disabled")return a=G(a,["bar","needle"]),a=G(a,["bar"]),a;let o=s.mode==="enabled"?!0:s.mode==="disabled"?!1:void 0,d={};return o!==void 0&&(d.show=o),l&&(d.color=r),Object.keys(d).length?a=P(a,["bar","needle"],d):a=x(a,["bar","needle"]),a=G(a,["bar","needle"]),a=G(a,["bar"]),a},{needleEdit:{field:"color",value:r}})}_getNeedleValue(){return this._getScopedNeedleConfig({type:"card"}).mode==="enabled"}_removeScopedNeedle(e){return this.context.mutate(e,t=>{let r=x(t,["bar","needle"]);return r=G(r,["bar"]),r})}_getNeedleSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasNeedleOverride(e))return"Inherited";let t=this._getScopedNeedleConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}handleField({field:e,kind:t,index:r,value:i}){let a=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},s=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");return t==="entity-needle-inherit"?(i&&this._removeScopedNeedle(a),!0):["bar-needle-mode","needle-mode"].includes(s)?(this._setScopedNeedleMode(a,i),!0):["bar-needle-color","needle-color"].includes(s)?(this._setScopedNeedleColor(a,i),!0):!1}render(e={type:"card"},t=({content:r})=>r){if((e==null?void 0:e.type)==="entity"){let i=e.index,a=!this._hasNeedleOverride(e),s=this._getEffectiveScopedNeedleConfig(e);return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${i}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${i}"${a?" checked":""}>
                          <label for="entity-${i}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${i}-needle-mode">Needle mode</label>
	                        <select id="entity-${i}-needle-mode" data-kind="entity-needle-mode" data-index="${i}" value="${F(s.mode)}">
                          <option value="enabled"${s.mode==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${s.mode==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${i}-needle-color">Needle color</label>
	                        ${K({cssText:this.options.cssText,label:"Needle color",id:`entity-${i}-needle-color`,kind:"entity-needle-color",index:i,value:s.color,fallbackHex:"#ffffff",placeholder:"#ffffff"})}
	                      </div>
	                          `}let r=this._getScopedNeedleConfig(e);return`          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${F(r.mode)}">
                <option value="disabled"${r.mode==="disabled"?" selected":""}>disabled</option>
                <option value="enabled"${r.mode==="enabled"?" selected":""}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${K({cssText:this.options.cssText,label:"Needle color",id:"bar-needle-color",field:"bar-needle-color",value:r.color,fallbackHex:"#ffffff",placeholder:"#ffffff"})}
            </div>
          </div>`}}});var _t,Aa=U(()=>{re();ve();_t=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._baselineColorDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getBaselineColorDraftKey(e={type:"card"},t="above"){return`${(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}:${t}`}_setBaselineColorDraft(e,t,r){let i=ie(r,this.options.cssText),a=this._getBaselineColorDraftKey(e,t);i?this._baselineColorDrafts.set(a,i):this._baselineColorDrafts.delete(a)}_getBaselineColorDraft(e,t){var r;return(r=this._baselineColorDrafts.get(this._getBaselineColorDraftKey(e,t)))!=null?r:""}_isBaselineDirectionalColorEnabled(e,t){return!!N(this._getBaselineDirectionalColorValue(e,t)).trim()}_setBaselineDirectionalColorEnabled(e,t,r){let i=ie(this._getBaselineDirectionalColorValue(e,t),this.options.cssText);if(!r)return i&&this._setBaselineColorDraft(e,t,i),this._removeColor(e,["baseline",t,"color"],{prunePaths:[["baseline",t],["baseline"]]});let a=this._getBaselineColorDraft(e,t)||ie(this._getEffectiveBaselineDirectionalColorValue(e,t),this.options.cssText)||i||"#000000";return this._setColor(e,["baseline",t,"color"],a,{prunePaths:[["baseline",t],["baseline"]]})}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:bi(this.context.source({type:"card"},"baseline"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="baseline-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"baseline","mode",t),!0;if(e!=="baseline-percent")return!1;let i=dt(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"baseline","percent",i),!0}_getBaselineResolvableValue(e){return this.context.source(e,"baseline")}_getEffectiveBaselineResolvableValue(e){return this.context.source(e,"baseline",!0)}_getBaselineMode(e){let t=this.context.read(e,["baseline","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasBaselineOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getEffectiveBaselineMode(e){let t=this._getBaselineMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getBaselineMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getBaselineResolvableValue({type:"card"});return lt(i)||this._getBaselineDirectionalColorValue({type:"card"},"above")||this._getBaselineDirectionalColorValue({type:"card"},"below")?"enabled":"disabled"}_setBaselineMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearBaselineOverride(e):this.context.mutate(e,r=>{let i=D(r);return t==="auto"?i=x(i,["baseline","enabled"]):i=P(i,["baseline","enabled"],t==="enabled"),i=G(i,["baseline"]),i},{baselineEdit:{path:["enabled"],value:t==="auto"?void 0:t==="enabled"}})}_setBaselineDirectionalColor(e,t,r){let i=ie(r,this.options.cssText);this._setBaselineColorDraft(e,t,i);let a=["baseline",t,"color"];return i?this._isBaselineDirectionalColorEnabled(e,t)?this.context.mutate(e,s=>P(s,a,i),{baselineEdit:{path:[t,"color"],value:i}}):this._setBaselineDirectionalColorEnabled(e,t,!0):this._removeColor(e,a,{prunePaths:[["baseline",t],["baseline"]]})}_getBaselineDirectionalColorValue(e,t){var r;return(r=this.context.read(e,["baseline",t,"color"]))!=null?r:""}_getEffectiveBaselineDirectionalColorValue(e,t){var i;let r=this.context.read(e,["baseline",t,"color"]);return r!=null&&r!==""?r:(e==null?void 0:e.type)==="entity"&&(i=this.context.read({type:"card"},["baseline",t,"color"]))!=null?i:""}_clearBaselineOverride(e){return this.context.mutate(e,t=>{let r=D(t),i=q(r,["baseline"]);return V(i)?(r=x(r,["baseline","enabled"]),r=x(r,["baseline","at"]),r=x(r,["baseline","above","color"]),r=x(r,["baseline","below","color"])):r=x(r,["baseline"]),r=G(r,["baseline","above"]),r=G(r,["baseline","below"]),r=G(r,["baseline"]),r},{rerender:!0})}_removeBaseline(e){return this.context.mutate(e,t=>x(t,["baseline"]),{rerender:!0})}_hasBaselineOverride(e){let t=this.context.read(e,["baseline"]);return V(t)&&Object.keys(t).length?!0:!V(t)&&t!==void 0&&t!==null&&t!==""}_getBaselineOverrideSummary(e){if(this._getBaselineMode(e)==="disabled")return"Disabled";let r=[],i=this._getBaselineResolvableValue(e);return i.fixed!==""&&i.fixed!==void 0&&r.push(`Baseline ${i.fixed}`),i.entity&&r.push("Entity"),this._getBaselineDirectionalColorValue(e,"above")&&r.push("Above"),this._getBaselineDirectionalColorValue(e,"below")&&r.push("Below"),r.length?r.join(" \u2022 "):"Inherited"}_getCardBaselineSummary(){let e=this._getBaselineMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getBaselineResolvableValue({type:"card"}),r=t.entity||(t.fixed!==""&&t.fixed!==void 0?t.fixed:""),i=e==="enabled"?"Enabled":"Auto";return r!==""?`${i} \xB7 ${r}`:i}_setBaselineResolvablePart(e,t,r){return this.context.setSource(e,"baseline",t,r)}_setColor(e,t,r,i={}){return this.context.mutate(e,a=>{var l;let s=r===void 0?x(a,t):P(a,t,r);for(let o of(l=i.prunePaths)!=null?l:[])s=G(s,o);return s},{...i,baselineEdit:{path:t.slice(1),value:r}})}_removeColor(e,t,r){return this._setColor(e,t,void 0,r)}handleField({field:e,kind:t,index:r,value:i}){let a=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},s=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(s,i,a))return!0;if(t==="entity-baseline-inherit")return i&&this._clearBaselineOverride(a),!0;if(s==="baseline-mode")return this._setBaselineMode(a,i),!0;if(s==="baseline-value")return this._setBaselineResolvablePart(a,"fixed",i),!0;if(s==="baseline-entity-source")return this._setBaselineResolvablePart(a,"entity",i),!0;for(let l of["above","below"]){if(s===`baseline-${l}-color`)return this._setBaselineDirectionalColor(a,l,i),!0;if(s===`baseline-${l}-color-enabled`)return this._setBaselineDirectionalColorEnabled(a,l,i),!0}return!1}handleClick(e){var t,r;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="baseline-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"baseline","percent",null),!0):((r=e==null?void 0:e.dataset)==null?void 0:r.action)!=="remove-baseline"?!1:(this._removeBaseline(e.dataset.scopeType==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}),!0)}render(e={type:"card"},t=({content:r})=>r){var l,o;if((e==null?void 0:e.type)==="entity"){let d=e.index,c=!this._hasBaselineOverride(e),u=this._getEffectiveBaselineResolvableValue(e),h=this._getEffectiveBaselineMode(e);return`
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
                        <select id="entity-${d}-baseline-mode" data-kind="entity-baseline-mode" data-index="${d}" value="${F(h)}">
                          <option value="enabled"${h==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${h==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-baseline-value">Baseline fallback</label>
                        <input id="entity-${d}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${d}" value="${F(u.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${be("entity-baseline-entity-source",d,u.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${d}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${d}"${this._isBaselineDirectionalColorEnabled(e,"above")?" checked":""}>
                          <label for="entity-${d}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${d}-baseline-above-color">Above-baseline color</label>
                        ${K({cssText:this.options.cssText,label:"Baseline color",id:`entity-${d}-baseline-above-color`,kind:"entity-baseline-above-color",index:d,value:this._getEffectiveBaselineDirectionalColorValue(e,"above"),fallbackHex:"#000000",placeholder:"inherit card default"})}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${d}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${d}"${this._isBaselineDirectionalColorEnabled(e,"below")?" checked":""}>
                            <label for="entity-${d}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${d}-baseline-below-color">Below-baseline color</label>
	                        ${K({cssText:this.options.cssText,label:"Baseline color",id:`entity-${d}-baseline-below-color`,kind:"entity-baseline-below-color",index:d,value:this._getEffectiveBaselineDirectionalColorValue(e,"below"),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let r=this._getBaselineResolvableValue(e),i=this._getBaselineMode(e),a=this._getBaselineDirectionalColorValue(e,"above"),s=this._getBaselineDirectionalColorValue(e,"below");return`
          ${t({group:"baseline",title:"Baseline",summary:this._getCardBaselineSummary(),content:`
          <div class="field-grid">
            <div class="field-row">
              <button type="button" data-action="remove-baseline" data-scope-type="card" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${F(i)}">
                <option value="auto"${i==="auto"?" selected":""}>auto</option>
                <option value="enabled"${i==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${i==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            ${this.options.percentSources?_i("baseline",this._getSourceMode(),(o=(l=this._percentageDraft)!=null?l:r.percent)!=null?o:""):""}<div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${F(r.fixed)}">
            </div>
            <div class="field-row">
              <label>Baseline entity</label>
              ${be("baseline-entity-source","card",r.entity)}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({type:"card"},"above")?" checked":""}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${K({cssText:this.options.cssText,label:"Baseline color",id:"baseline-above-color",field:"baseline-above-color",value:a,fallbackHex:"#000000"})}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-below-color-enabled" type="checkbox" data-field="baseline-below-color-enabled"${this._isBaselineDirectionalColorEnabled({type:"card"},"below")?" checked":""}>
                <label for="baseline-below-color-enabled">Below-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-below-color">Below-baseline color</label>
              ${K({cssText:this.options.cssText,label:"Baseline color",id:"baseline-below-color",field:"baseline-below-color",value:s,fallbackHex:"#000000"})}
            </div>
          </div>`})}
`}}});function Ia(n,e){return n==="text"?N(e).replace(/\s+/g," ").trim():n==="entity"?N(e).trim():["show","showValue","showUnit","show_value","show_unit"].includes(n)?e===!0:Te(e)}function gt(n,e,t,r){var c;let i=n.read(e,[t]),a=V(i==null?void 0:i.label)?i.label:{},s=(e==null?void 0:e.type)==="entity"?(c=n.read({type:"card"},[t,"label"]))!=null?c:{}:{},l=u=>Object.prototype.hasOwnProperty.call(a,u),o=(u,h)=>{var p;return l(u)?a[u]:(p=s[u])!=null?p:h},d=o("precision",o("decimal",""));return{show:r,text:o("text",""),showValue:o("show_value",!0)!==!1,showUnit:o("show_unit",!0)!==!1,precision:d===null?"":d}}function yt(n,e,t,r,i){let a=r==="showValue"?"show_value":r==="showUnit"?"show_unit":r==="precision"?"precision":r,s=r==="text",l=Ia(r,i);return r==="precision"&&i!==""&&l===null?!1:n.mutate(e,o=>{var f,b,g,_;let d=D(o);t==="target"&&r==="show"&&(d=x(d,["show_target_label"]));let c=V(q(d,[t]))?D(q(d,[t])):{},u=V(c.label)?D(c.label):{},h=(e==null?void 0:e.type)==="entity"?(f=n.read({type:"card"},[t,"label"]))!=null?f:{}:{},p=r==="precision"?(g=(b=h.precision)!=null?b:h.decimal)!=null?g:null:(_=h[a])!=null?_:r==="show"?!1:r==="showValue"||r==="showUnit"?!0:void 0;return l===null||s&&!l?s&&(e==null?void 0:e.type)==="entity"&&typeof h.text=="string"&&h.text.trim()?u[a]="":delete u[a]:(e==null?void 0:e.type)==="entity"&&l===p||(r==="show"||r==="showValue"||r==="showUnit")&&(e==null?void 0:e.type)!=="entity"&&l===(r!=="show")?delete u[a]:u[a]=l,r==="precision"&&delete u.decimal,Object.keys(u).length?c.label=u:delete c.label,Object.keys(c).length?d=P(d,[t],c):d=x(d,[t]),d},{markerEdit:{key:t,path:["label",a],value:l,field:r}})}function Ae(n,e,t){let r=n.read(e,[t,"direction"]),i=r!==void 0?r:n.read(e,[`${t}_marker`,"direction"]);return(e==null?void 0:e.type)==="entity"&&i===void 0?Ae(n,{type:"card"},t):ye(i)}function vt(n,e,t,r){let i=ye(r),a=Ae(n,{type:"card"},t),s=(e==null?void 0:e.type)!=="entity"&&i==="inward"||(e==null?void 0:e.type)==="entity"&&i===a?void 0:i;return n.mutate(e,l=>G(s===void 0?x(l,[t,"direction"]):P(l,[t,"direction"],s),[t]),{prunePaths:[[t]],markerEdit:{key:t,path:["direction"],value:i}})}var kr=U(()=>{xe();re()});var St,La=U(()=>{xe();re();ve();kr();St=class{constructor(e,t={}){this.options=t,this.context=e,this.reset()}reset(){this._targetAboveFillDrafts=new Map,this._sourceMode=void 0,this._percentageDraft=void 0}_getCardTargetMarkerSummary(){let e=this._getTargetMode({type:"card"});if(e==="disabled")return"Disabled";let t=this._getTargetResolvableValue({type:"card"}),r=[];e==="enabled"&&r.push("Enabled");let i=t.fixed!==""&&t.fixed!==void 0||!!t.entity;return t.fixed!==""&&t.fixed!==void 0&&r.push(String(t.fixed)),t.entity&&r.push(t.entity),(i||this._hasTargetShape({type:"card"}))&&r.push(this._getEffectiveTargetShapeValue({type:"card"})==="triangle"?"Triangle":"Diamond"),r.length?r.join(" \xB7 "):"Automatic"}_getSourceMode(){var e;return(e=this._sourceMode)!=null?e:bi(this.context.source({type:"card"},"target"))}_handlePercentageField(e,t,r){if(!this.options.percentSources)return!1;if(e==="target-source-mode")return this._sourceMode=t,this._percentageDraft=void 0,this.context.setSource(r,"target","mode",t),!0;if(e!=="target-percent")return!1;let i=dt(t);return this._percentageDraft=i===null?t:void 0,i!==null&&this.context.setSource(r,"target","percent",i),!0}_getTargetResolvableValue(e){return this.context.source(e,"target")}_getEffectiveTargetResolvableValue(e){return this.context.source(e,"target",!0)}_getTargetMode(e){let t=this.context.read(e,["target","enabled"]);return(e==null?void 0:e.type)==="entity"?t===!1?"disabled":t===!0||this._hasTargetOverride(e)?"enabled":"inherit":t===!0?"enabled":t===!1?"disabled":"auto"}_getTargetShapeValue(e){var t;return(t=this.context.read(e,["target","shape"]))!=null?t:""}_hasTargetShape(e){let t=this.context.read(e,["target"]);return V(t)&&Object.prototype.hasOwnProperty.call(t,"shape")}_getEffectiveTargetShapeValue(e){return(e==null?void 0:e.type)==="entity"&&!this._hasTargetShape(e)?this._getEffectiveTargetShapeValue({type:"card"}):qe(this._getTargetShapeValue(e))}_setTargetShape(e,t){let r=qe(t);return(e==null?void 0:e.type)!=="entity"&&r==="diamond"?this._remove(e,["target","shape"],{prunePaths:[["target"]]}):this._setText(e,["target","shape"],r,{prunePaths:[["target"]]})}_getEffectiveTargetMode(e){let t=this._getTargetMode(e);if((e==null?void 0:e.type)!=="entity"||t!=="inherit")return t;let r=this._getTargetMode({type:"card"});if(r==="disabled")return"disabled";if(r==="enabled")return"enabled";let i=this._getTargetResolvableValue({type:"card"});return lt(i)||this._hasCustomTargetColor({type:"card"})||this._getTargetLabelShowValue({type:"card"})||this._getTargetAboveFillColorValue({type:"card"})?"enabled":"disabled"}_setTargetMode(e,t){return(e==null?void 0:e.type)==="entity"&&t==="inherit"?this._clearTargetOverride(e):t==="auto"?this._remove(e,["target","enabled"],{prunePaths:[["target"]]}):this._write(e,["target","enabled"],t==="enabled",{prunePaths:[["target"]]})}_setTargetResolvablePart(e,t,r){return this.context.setSource(e,"target",t,r)}_clearTargetOverride(e){return this.context.mutate(e,t=>{let r=D(t),i=q(r,["target"]);return V(i)?(r=x(r,["target","enabled"]),r=x(r,["target","at"]),r=x(r,["target","color"]),r=x(r,["target","shape"]),r=x(r,["target","direction"]),r=x(r,["target","label","show"]),r=x(r,["target","label","decimal"]),r=x(r,["target","when_exceeded","fill_color"])):r=x(r,["target"]),r=x(r,["target_entity"]),r=x(r,["target_color"]),r=x(r,["show_target_label"]),r=x(r,["above_target_color"]),r=G(r,["target","label"]),r=G(r,["target","when_exceeded"]),r=G(r,["target"]),r},{rerender:!0})}_getTargetColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","color"]))!=null?t:this.context.read(e,["target_color"]))!=null?r:""}_getEffectiveTargetColorValue(e){return this._effectiveDisplay(e,["target","color"],[["target_color"]])}_hasCustomTargetColor(e){let t=this._getTargetColorValue(e);return!!t&&j(t)!==j("#888")}_setTargetColor(e,t){let r=ie(t,this.options.cssText);return!r||j(r)===j("#888")?this._remove(e,["target","color"],{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]}):this._setText(e,["target","color"],r,{deprecatedKeys:[["target_color"]],prunePaths:[["target"]]})}_getTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);return t!==void 0?!!t:!!this.context.read(e,["show_target_label"])}_getEffectiveTargetLabelShowValue(e){let t=this.context.read(e,["target","label","show"]);if(t!==void 0)return!!t;let r=this.context.read(e,["show_target_label"]);return r!==void 0?!!r:(e==null?void 0:e.type)==="entity"?this._getTargetLabelShowValue({type:"card"}):!1}_setTargetLabelShow(e,t){return t?this._write(e,["target","label","show"],!0,{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]}):this._remove(e,["target","label","show"],{deprecatedKeys:[["show_target_label"]],prunePaths:[["target","label"],["target"]]})}_getTargetLabelDecimalValue(e){var t,r;return(r=(t=this.context.read(e,["target","label","precision"]))!=null?t:this.context.read(e,["target","label","decimal"]))!=null?r:""}_getEffectiveTargetLabelDecimalValue(e){let t=this._getTargetLabelDecimalValue(e);return t!==""&&t!==null&&t!==void 0?t:(e==null?void 0:e.type)==="entity"?this._getTargetLabelDecimalValue({type:"card"}):""}_setTargetLabelDecimal(e,t){let r=Te(t);return t===""||t===null||t===void 0?this._remove(e,["target","label","decimal"],{prunePaths:[["target","label"],["target"]]}):r===null?!1:this._write(e,["target","label","decimal"],r,{prunePaths:[["target","label"],["target"]]})}_getTargetAboveFillColorValue(e){var t,r;return(r=(t=this.context.read(e,["target","when_exceeded","fill_color"]))!=null?t:this.context.read(e,["above_target_color"]))!=null?r:""}_getTargetAboveFillDraftKey(e={type:"card"}){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_setTargetAboveFillDraft(e,t){let r=ie(t,this.options.cssText),i=this._getTargetAboveFillDraftKey(e);r?this._targetAboveFillDrafts.set(i,r):this._targetAboveFillDrafts.delete(i)}_getTargetAboveFillDraft(e){var t;return(t=this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(e)))!=null?t:""}_getEffectiveTargetAboveFillColorValue(e){return this._effectiveDisplay(e,["target","when_exceeded","fill_color"],[["above_target_color"]])}_setTargetAboveFillColor(e,t){let r=ie(t,this.options.cssText);return this._setTargetAboveFillDraft(e,r),this._isTargetAboveFillEnabled(e)?r?this._setText(e,["target","when_exceeded","fill_color"],r,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]}):!1}_isTargetAboveFillEnabled(e){return!!N(this._getTargetAboveFillColorValue(e)).trim()}_setTargetAboveFillEnabled(e,t){let r=ie(this._getTargetAboveFillColorValue(e),this.options.cssText);if(!t)return r&&this._setTargetAboveFillDraft(e,r),this._remove(e,["target","when_exceeded","fill_color"],{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]});let i=this._getTargetAboveFillDraft(e)||ie(this._getEffectiveTargetAboveFillColorValue(e),this.options.cssText)||r||"#000000";return this._setText(e,["target","when_exceeded","fill_color"],i,{deprecatedKeys:[["above_target_color"]],prunePaths:[["target","when_exceeded"],["target"]]})}_hasTargetOverride(e){let t=this.context.read(e,["target"]);return V(t)&&Object.keys(t).length||!V(t)&&t!==void 0&&t!==null&&t!==""?!0:["target_entity","target_color","show_target_label","above_target_color"].some(r=>{let i=this.context.read(e,[r]);return i!=null&&i!==""&&i!==!1})||this._getTargetLabelDecimalValue(e)!==""}_getTargetOverrideSummary(e){if(this._getTargetMode(e)==="disabled")return"Disabled";let r=[],i=this._getTargetResolvableValue(e);i.fixed!==""&&i.fixed!==void 0&&r.push(`Target ${i.fixed}`),i.entity&&r.push("Entity"),this._hasTargetShape(e)&&r.push(this._getEffectiveTargetShapeValue(e)==="triangle"?"Triangle":"Diamond"),this._hasCustomTargetColor(e)&&r.push("Custom color"),this._getTargetLabelShowValue(e)&&r.push("Label");let a=this._getTargetLabelDecimalValue(e);return a!==""&&r.push(`Label ${a} ${Number(a)===1?"decimal":"decimals"}`),this._getTargetAboveFillColorValue(e)&&r.push("Above"),r.length?r.join(" \u2022 "):"Inherited"}_write(e,t,r,i={}){var a;return this.context.mutate(e,s=>{var o,d;let l=r===void 0?x(s,t):P(s,t,r);l=Pe(l,(o=i.deprecatedKeys)!=null?o:[]);for(let c of(d=i.prunePaths)!=null?d:[])l=G(l,c);return l},{...i,targetEdit:{path:t.slice(1),value:r,deprecatedKeys:(a=i.deprecatedKeys)!=null?a:[]}})}_remove(e,t,r){return this._write(e,t,void 0,r)}_setText(e,t,r,i){return this._write(e,t,ie(r,this.options.cssText)||void 0,i)}_effectiveDisplay(e,t,r){return mi(this.context,e,t,r)}_getEffectiveMarkerDirection(e,t){return Ae(this.context,e,t)}_setMarkerDirection(e,t,r){return vt(this.context,e,t,r)}_getBuiltinMarkerLabelOptions(e,t){return gt(this.context,e,t,this._getEffectiveTargetLabelShowValue(e))}_renderBuiltinMarkerLabelControls(e,t,r){return ot(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(e,t,r,i){return yt(this.context,e,t,r,i)}handleField({field:e,kind:t,index:r,value:i}){let a=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},s=e!=null?e:t==null?void 0:t.replace(/^entity-/,"");if(this._handlePercentageField(s,i,a))return!0;if(s==="target-inherit")return i&&this._clearTargetOverride(a),!0;if(s==="target-mode")return this._setTargetMode(a,i),!0;if(s==="target-value")return this._setTargetResolvablePart(a,"fixed",i),!0;if(s==="target-entity-source")return this._setTargetResolvablePart(a,"entity",i),!0;if(s==="target-shape")return this._setTargetShape(a,i),!0;if(s==="target-direction")return this._setMarkerDirection(a,"target",i),!0;if(s==="target-color")return this._setTargetColor(a,i),!0;let l=s==null?void 0:s.match(/^target-label-(show|text|show-value|show-unit|precision)$/);if(l){let o=l[1];return this._setBuiltinMarkerLabelField(a,"target",o==="show-value"?"showValue":o==="show-unit"?"showUnit":o,i),!0}return s==="target-above-fill-enabled"?(this._setTargetAboveFillEnabled(a,i),!0):s==="target-above-fill-color"?(this._setTargetAboveFillColor(a,i),!0):!1}handleClick(e){var t;return this.options.percentSources&&((t=e==null?void 0:e.dataset)==null?void 0:t.action)==="target-clear-percent"?(this._percentageDraft=void 0,this.context.setSource({type:"card"},"target","percent",null),!0):!1}render(e={type:"card"}){var o,d;if((e==null?void 0:e.type)==="entity"){let c=e.index,u=!this._hasTargetOverride(e),h=this._getEffectiveTargetResolvableValue(e),p=this._getEffectiveTargetMode(e),f=this._getEffectiveTargetShapeValue(e),b=this._getEffectiveMarkerDirection(e,"target");return`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${c}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${c}"${u?" checked":""}>
                          <label for="entity-${c}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${c}-target-mode">Target mode</label>
	                        <select id="entity-${c}-target-mode" data-kind="entity-target-mode" data-index="${c}" value="${F(p)}">
                          <option value="enabled"${p==="enabled"?" selected":""}>enabled</option>
                          <option value="disabled"${p==="disabled"?" selected":""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-value">Target fallback</label>
                        <input id="entity-${c}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${c}" value="${F(h.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-shape">Target shape</label>
                        <select id="entity-${c}-target-shape" data-kind="entity-target-shape" data-index="${c}" value="${F(f)}">
                          <option value="diamond"${f==="diamond"?" selected":""}>diamond</option>
                          <option value="triangle"${f==="triangle"?" selected":""}>triangle</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-direction">Direction</label>
                        <select id="entity-${c}-target-direction" data-kind="entity-target-direction" data-index="${c}" value="${b}">
                          <option value="inward"${b==="inward"?" selected":""}>Inward</option>
                          <option value="outward"${b==="outward"?" selected":""}>Outward</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${be("entity-target-entity-source",c,h.entity,"inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${c}-target-color">Target color</label>
                        ${K({cssText:this.options.cssText,label:"Target color",id:`entity-${c}-target-color`,kind:"entity-target-color",index:c,value:this._getEffectiveTargetColorValue(e),fallbackHex:"#888",placeholder:"inherit card default"})}
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
	                        ${K({cssText:this.options.cssText,label:"Target color",id:`entity-${c}-target-above-fill`,kind:"entity-target-above-fill-color",index:c,value:this._getEffectiveTargetAboveFillColorValue(e),fallbackHex:"#000000",placeholder:"inherit card default"})}
	                      </div>
	                          `}let t=this._getTargetResolvableValue(e),r=this._getTargetMode(e),i=this._getEffectiveTargetShapeValue(e),a=this._getEffectiveMarkerDirection(e,"target"),s=this._getTargetColorValue(e),l=this._getTargetAboveFillColorValue(e);return`
            <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${F(r)}">
                <option value="auto"${r==="auto"?" selected":""}>auto</option>
                <option value="enabled"${r==="enabled"?" selected":""}>enabled</option>
                <option value="disabled"${r==="disabled"?" selected":""}>disabled</option>
              </select>
            </div>
            ${this.options.percentSources?_i("target",this._getSourceMode(),(d=(o=this._percentageDraft)!=null?o:t.percent)!=null?d:""):""}<div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${F(t.fixed)}">
            </div>
            <div class="field-row">
              <label for="target-shape">Target shape</label>
              <select id="target-shape" data-field="target-shape" value="${F(i)}">
                <option value="diamond"${i==="diamond"?" selected":""}>diamond</option>
                <option value="triangle"${i==="triangle"?" selected":""}>triangle</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-direction">Direction</label>
              <select id="target-direction" data-field="target-direction" value="${a}">
                <option value="inward"${a==="inward"?" selected":""}>Inward</option>
                <option value="outward"${a==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${be("target-entity-source","card",t.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${K({cssText:this.options.cssText,label:"Target color",id:"target-color",field:"target-color",value:s,fallbackHex:"#888",placeholder:"#888"})}
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
              ${K({cssText:this.options.cssText,label:"Target color",id:"target-above-fill-color",field:"target-above-fill-color",value:l,fallbackHex:"#000000"})}
            </div>
            </div>`}}});var xt,ja=U(()=>{re();ve();kr();xt=class{constructor(e,t={}){this.options=t,this.context=e}_getScopedPeakConfig(e){var d,c;let t=this.context.read(e,["peak"]),r=this.context.read(e,["peak_marker"]),i=this.context.read(e,["show_peak"]),a=this.context.read(e,["peak_color"]),s="#888",l=(e==null?void 0:e.type)==="entity"?"inherit":"disabled",o="";return V(t)&&(t.enabled===!0?l="enabled":t.enabled===!1&&(l="disabled"),o=(d=t.color)!=null?d:o),V(r)&&(r.show===!0?l="enabled":(r.show===!1||(e==null?void 0:e.type)!=="entity")&&(l="disabled"),o=(c=r.color)!=null?c:o),i===!0?l="enabled":i===!1&&(l="disabled"),o=o||a||"",o&&j(o)===j(s)&&(o=""),{mode:l,color:o}}_getEffectiveScopedPeakConfig(e){let t=this._getScopedPeakConfig(e);if((e==null?void 0:e.type)!=="entity")return t;if(!this._hasPeakOverride(e))return this._getScopedPeakConfig({type:"card"});let r=this._getScopedPeakConfig({type:"card"});return{mode:t.mode==="inherit"?r.mode:t.mode,color:t.color||r.color}}_hasPeakOverride(e){var i,a;let t=(i=this.context.read(e,["peak"]))!=null?i:{};if(V(t)&&(Object.prototype.hasOwnProperty.call(t,"enabled")||Object.prototype.hasOwnProperty.call(t,"color")||Object.prototype.hasOwnProperty.call(t,"reset")||Object.prototype.hasOwnProperty.call(t,"label")||Object.prototype.hasOwnProperty.call(t,"direction")))return!0;let r=(a=this.context.read(e,["peak_marker"]))!=null?a:{};return V(r)&&(Object.prototype.hasOwnProperty.call(r,"show")||Object.prototype.hasOwnProperty.call(r,"color")||Object.prototype.hasOwnProperty.call(r,"direction"))?!0:this.context.read(e,["show_peak"])!==void 0||this.context.read(e,["peak_color"])!==void 0}_getPeakSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasPeakOverride(e))return"Inherited";let t=this._getScopedPeakConfig(e);return t.mode==="disabled"?t.color?"Disabled \u2022 Custom color":"Disabled":t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Custom color":"Inherited"}_clearPeakOverride(e){return this.context.mutate(e,t=>{let r=x(t,["peak","enabled"]);return r=x(r,["peak","color"]),r=x(r,["peak","reset"]),r=x(r,["peak","label"]),r=x(r,["peak","direction"]),r=x(r,["show_peak"]),r=x(r,["peak_color"]),r=x(r,["peak_marker"]),r=G(r,["peak"]),r},{rerender:!0})}_setScopedPeakEnabled(e,t){let r=!!t,i="#888";return this.context.mutate(e,a=>{var d,c,u;let s=D(a),l=V(q(s,["peak"]))?D(q(s,["peak"])):{},o=(u=(c=(d=l.color)!=null?d:V(q(s,["peak_marker"]))?q(s,["peak_marker","color"]):void 0)!=null?c:q(s,["peak_color"]))!=null?u:i;return(e==null?void 0:e.type)==="entity"||r?l.enabled=r:delete l.enabled,o&&j(o)!==j(i)?l.color=o:delete l.color,Object.keys(l).length?s=P(s,["peak"],l):s=x(s,["peak"]),s=x(s,["show_peak"]),s=x(s,["peak_color"]),s=x(s,["peak_marker"]),s=G(s,["peak"]),s},{extremumEdit:{key:"peak",path:["enabled"],value:r}})}_setScopedPeakColor(e,t){let r=ie(t,this.options.cssText),i="#888";return this.context.mutate(e,a=>{let s=D(a),l=V(q(s,["peak"]))?D(q(s,["peak"])):{},o=this._getScopedPeakConfig(e);return delete l.color,r&&j(r)!==j(i)&&(l.color=r),(e==null?void 0:e.type)==="entity"?(o.mode==="enabled"&&(l.enabled=!0),o.mode==="disabled"&&(l.enabled=!1)):o.mode==="enabled"&&(l.enabled=!0),Object.keys(l).length?s=P(s,["peak"],l):s=x(s,["peak"]),s=x(s,["show_peak"]),s=x(s,["peak_color"]),s=x(s,["peak_marker"]),s=G(s,["peak"]),s},{extremumEdit:{key:"peak",path:["color"],value:r&&j(r)!==j(i)?r:void 0}})}_getScopedMarkerExtras(e,t){var s,l,o,d;let r=this.context.read(e,[t]),i=V(r)?r:{},a=V(i.label)?i.label:{};return{reset:Object.prototype.hasOwnProperty.call(i,"reset")?N(i.reset).trim().toLowerCase():null,labelShow:typeof a.show=="boolean"?a.show:null,labelText:typeof a.text=="string"?a.text.replace(/\s+/g," ").trim():null,labelShowValue:typeof a.show_value=="boolean"?a.show_value:null,labelShowUnit:typeof a.show_unit=="boolean"?a.show_unit:null,labelPrecision:((s=a.precision)!=null?s:a.decimal)===void 0||((l=a.precision)!=null?l:a.decimal)===null||((o=a.precision)!=null?o:a.decimal)===""?null:ne((d=a.precision)!=null?d:a.decimal)}}_hasExtremumOverride(e,t){let r=this.context.read(e,[t]);return V(r)?["enabled","color","reset","label","direction"].some(i=>Object.prototype.hasOwnProperty.call(r,i)):!1}_getEffectiveMarkerExtras(e,t){var a,s,l,o,d,c,u,h,p,f,b,g,_,y,m,v,S,w;let r=this._getScopedMarkerExtras(e,t);if((e==null?void 0:e.type)!=="entity")return{reset:(a=r.reset)!=null?a:"never",labelShow:(s=r.labelShow)!=null?s:!1,labelText:r.labelText,labelShowValue:(l=r.labelShowValue)!=null?l:!0,labelShowUnit:(o=r.labelShowUnit)!=null?o:!0,labelPrecision:r.labelPrecision};let i=this._getScopedMarkerExtras({type:"card"},t);return this._hasExtremumOverride(e,t)?{reset:(f=(p=r.reset)!=null?p:i.reset)!=null?f:"never",labelShow:(g=(b=r.labelShow)!=null?b:i.labelShow)!=null?g:!1,labelText:Object.prototype.hasOwnProperty.call((_=this.context.read(e,[t,"label"]))!=null?_:{},"text")?r.labelText:i.labelText,labelShowValue:(m=(y=r.labelShowValue)!=null?y:i.labelShowValue)!=null?m:!0,labelShowUnit:(S=(v=r.labelShowUnit)!=null?v:i.labelShowUnit)!=null?S:!0,labelPrecision:(w=r.labelPrecision)!=null?w:i.labelPrecision}:{reset:(d=i.reset)!=null?d:"never",labelShow:(c=i.labelShow)!=null?c:!1,labelText:i.labelText,labelShowValue:(u=i.labelShowValue)!=null?u:!0,labelShowUnit:(h=i.labelShowUnit)!=null?h:!0,labelPrecision:i.labelPrecision}}_getScopedFloorConfig(e){let t=this.context.read(e,["floor"]),r=V(t)?t:{},i=(e==null?void 0:e.type)==="entity"?"inherit":"disabled";r.enabled===!0&&(i="enabled"),r.enabled===!1&&(i="disabled");let a=r.color&&j(r.color)!==j("#888888")?r.color:"";return{mode:i,color:a}}_getEffectiveScopedFloorConfig(e){let t=this._getScopedFloorConfig(e),r=this._getEffectiveMarkerExtras(e,"floor");if((e==null?void 0:e.type)!=="entity")return{...t,...r};if(!this._hasExtremumOverride(e,"floor"))return{...this._getScopedFloorConfig({type:"card"}),...r};let i=this._getEffectiveScopedFloorConfig({type:"card"});return{mode:t.mode==="inherit"?i.mode:t.mode,color:t.color||i.color,...r}}_getFloorSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasExtremumOverride(e,"floor"))return"Inherited";let t=this._getEffectiveScopedFloorConfig(e);return t.mode==="enabled"?t.color?"Enabled \u2022 Custom color":"Enabled":t.color?"Disabled \u2022 Custom color":"Disabled"}_getMarkerResetSummary(e){var s;let t={type:"card"},i=(e==="peak"?this._getScopedPeakConfig(t):this._getEffectiveScopedFloorConfig(t)).mode==="enabled",a=(s=this._getEffectiveMarkerExtras(t,e).reset)!=null?s:"never";return`${i?"Enabled":"Disabled"} \xB7 ${a==="never"?"no reset":`${a} reset`}`}_setScopedExtremumEnabled(e,t,r){let i=!!r,a="#888888";return this.context.mutate(e,s=>{var c;let l=D(s),o=V(q(l,[t]))?D(q(l,[t])):{},d=(c=o.color)!=null?c:a;return(e==null?void 0:e.type)==="entity"||i?o.enabled=i:delete o.enabled,d&&j(d)!==j(a)?o.color=d:delete o.color,Object.keys(o).length?l=P(l,[t],o):l=x(l,[t]),l},{extremumEdit:{key:t,path:["enabled"],value:i}})}_setScopedExtremumColor(e,t,r){let i=ie(r,this.options.cssText),a="#888888";return this.context.mutate(e,s=>{let l=D(s),o=V(q(l,[t]))?D(q(l,[t])):{};delete o.color,i&&j(i)!==j(a)&&(o.color=i);let d=this._getScopedFloorConfig(e).mode;return t==="floor"&&((e==null?void 0:e.type)==="entity"&&d!=="inherit"||(e==null?void 0:e.type)!=="entity"&&d==="enabled")&&(o.enabled=d==="enabled"),Object.keys(o).length?l=P(l,[t],o):l=x(l,[t]),t==="peak"&&(l=x(l,["show_peak"]),l=x(l,["peak_color"]),l=x(l,["peak_marker"])),l},{extremumEdit:{key:t,path:["color"],value:i&&j(i)!==j(a)?i:void 0}})}_setScopedExtremumReset(e,t,r){let i=N(r).trim().toLowerCase();return this.context.mutate(e,a=>{let s=D(a),l=V(q(s,[t]))?D(q(s,[t])):{};return i&&((e==null?void 0:e.type)==="entity"||i!=="never")?l.reset=i:delete l.reset,Object.keys(l).length?s=P(s,[t],l):s=x(s,[t]),t==="peak"&&(s=x(s,["show_peak"]),s=x(s,["peak_color"]),s=x(s,["peak_marker"])),s},{extremumEdit:{key:t,path:["reset"],value:i}})}_setScopedExtremumLabelShow(e,t,r){let i=!!r;return this.context.mutate(e,a=>{let s=D(a),l=V(q(s,[t]))?D(q(s,[t])):{},o=V(l.label)?D(l.label):{};return(e==null?void 0:e.type)==="entity"||i?o.show=i:delete o.show,Object.keys(o).length?l.label=o:delete l.label,Object.keys(l).length?s=P(s,[t],l):s=x(s,[t]),t==="peak"&&(s=x(s,["show_peak"]),s=x(s,["peak_color"]),s=x(s,["peak_marker"])),s},{extremumEdit:{key:t,path:["label","show"],value:i}})}_setScopedExtremumLabelDecimal(e,t,r){let i=ne(r);return this.context.mutate(e,a=>{let s=D(a),l=V(q(s,[t]))?D(q(s,[t])):{},o=V(l.label)?D(l.label):{};return i!==null?o.decimal=i:delete o.decimal,Object.keys(o).length?l.label=o:delete l.label,Object.keys(l).length?s=P(s,[t],l):s=x(s,[t]),s},{extremumEdit:{key:t,path:["label","decimal"],value:i}})}_clearFloorOverride(e){return this.context.mutate(e,t=>{let r=D(t),i=V(q(r,["floor"]))?D(q(r,["floor"])):{};return["enabled","color","reset","label","direction"].forEach(a=>delete i[a]),Object.keys(i).length?r=P(r,["floor"],i):r=x(r,["floor"]),r=x(r,["floor_marker"]),r},{rerender:!0})}_setPeakShow(e){return this._setScopedPeakEnabled({type:"card"},e)}_getPeakShowValue(){return this._getScopedPeakConfig({type:"card"}).mode==="enabled"}_getMarkerConfig(e,t){return t==="peak"?this._getEffectiveScopedPeakConfig(e):this._getEffectiveScopedFloorConfig(e)}_getBuiltinMarkerLabelOptions(e,t){return gt(this.context,e,t,this._getEffectiveMarkerExtras(e,t).labelShow)}_renderBuiltinMarkerLabelControls(e,t,r){return ot(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_getEffectiveMarkerDirection(e,t){return Ae(this.context,e,t)}render(e={type:"card"},t="peak"){let r=t==="peak"?"Peak":"Floor",i=t==="peak"?"#888":"#888888",a={...this._getMarkerConfig(e,t),...this._getEffectiveMarkerExtras(e,t)};if((e==null?void 0:e.type)==="entity"){let s=e.index,l=!(t==="peak"?this._hasPeakOverride(e):this._hasExtremumOverride(e,t)),o=t==="peak"?"	":"";return`
${o}                      <div class="field-row">
${o}                        <div class="toggle">
${o}                          <input id="entity-${s}-${t}-inherit" type="checkbox" data-kind="entity-${t}-inherit" data-index="${s}"${l?" checked":""}>
                          <label for="entity-${s}-${t}-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${s}-${t}-enabled" type="checkbox" data-kind="entity-${t}-enabled" data-index="${s}"${a.mode==="enabled"?" checked":""}>
                          <label for="entity-${s}-${t}-enabled">${r} enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${s}-${t}-color">${r} color</label>
                        ${K({cssText:this.options.cssText,label:"Marker color",id:`entity-${s}-${t}-color`,kind:`entity-${t}-color`,index:s,value:a.color,fallbackHex:i,placeholder:"inherit card default"})}
                      </div>
                      <div class="field-row">
                        <label for="entity-${s}-${t}-reset">${r} reset</label>
                        <select id="entity-${s}-${t}-reset" data-kind="entity-${t}-reset" data-index="${s}" value="${F(a.reset)}">
                          ${yr(a.reset)}
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${s}-${t}-direction">Direction</label>
                        <select id="entity-${s}-${t}-direction" data-kind="entity-${t}-direction" data-index="${s}" value="${this._getEffectiveMarkerDirection(e,t)}">
                          <option value="inward"${this._getEffectiveMarkerDirection(e,t)==="inward"?" selected":""}>Inward</option>
                          <option value="outward"${this._getEffectiveMarkerDirection(e,t)==="outward"?" selected":""}>Outward</option>
                        </select>
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(e,t,r)}
${o}                          `}return`
            <div class="field-grid">
            <div class="field-row">
              <div class="toggle">
                <input id="${t}-show" type="checkbox" data-field="${t}-show"${a.mode==="enabled"?" checked":""}>
                <label for="${t}-show">${r} enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="${t}-color">${r} color</label>
              ${K({cssText:this.options.cssText,label:"Marker color",id:`${t}-color`,field:`${t}-color`,value:a.color,fallbackHex:i,placeholder:i})}
            </div>
            <div class="field-row">
              <label for="${t}-reset">${r} reset</label>
              <select id="${t}-reset" data-field="${t}-reset" value="${F(a.reset)}">
                ${yr(a.reset)}
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
            </div>`}handleField({field:e,kind:t,index:r,value:i}){let a=t!=null&&t.startsWith("entity-")?{type:"entity",index:Number(r)}:{type:"card"},s=e!=null?e:t==null?void 0:t.replace(/^entity-/,""),l=s==null?void 0:s.match(/^(peak|floor)-(.*)$/);if(!l)return!1;let[,o,d]=l;if(d==="inherit")return i&&(o==="peak"?this._clearPeakOverride(a):this._clearFloorOverride(a)),!0;if(d==="show"||d==="enabled")return o==="peak"?this._setScopedPeakEnabled(a,i):this._setScopedExtremumEnabled(a,o,i),!0;if(d==="color")return o==="peak"?this._setScopedPeakColor(a,i):this._setScopedExtremumColor(a,o,i),!0;if(d==="reset")return this._setScopedExtremumReset(a,o,i),!0;if(d==="direction")return vt(this.context,a,o,i),!0;let c=d.match(/^label-(show|text|show-value|show-unit|precision)$/);if(c){let u=c[1];return yt(this.context,a,o,u==="show-value"?"showValue":u==="show-unit"?"showUnit":u,i),!0}return!1}}});function kt(n){var r,i,a;let e=n==null?void 0:n.at;if(typeof e=="string"&&/^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s*$/.test(e))return{mode:"percent",percent:e.replace(/%/g,"").trim()};if(typeof e=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(e.trim()))return{mode:"entity",entity:e.trim(),fixed:""};let t=V(e)?e:{};return Object.prototype.hasOwnProperty.call(t,"entity")?{mode:t.fixed!==void 0&&t.fixed!==null&&t.fixed!==""?"entity-fallback":"entity",entity:(r=t.entity)!=null?r:"",fixed:(i=t.fixed)!=null?i:""}:{mode:"fixed",fixed:(a=t.fixed)!=null?a:""}}var wt,Di=U(()=>{xe();re();ve();kr();wt=class{constructor(e,t,r={}){this.options=r,this.context=e,this.ui=t,this._genericMarkerUiIds=new Map,this._expandedGenericMarkerUiIds=new Set,this._nextGenericMarkerUiId=0}reset(){this._genericMarkerUiIds.clear(),this._expandedGenericMarkerUiIds.clear()}_getShadowElementById(e){var t,r,i,a;return(a=(r=(t=this.ui.root())==null?void 0:t.getElementById)==null?void 0:r.call(t,e))!=null?a:(i=this.ui.root())==null?void 0:i.querySelector(`#${e}`)}render(e={type:"card"}){return this._renderGenericMarkersEditor(e)}_hasMarkersOverride(e){return(e==null?void 0:e.type)==="entity"&&this.context.read(e,["markers"])!==void 0}_getGenericMarkers(e,t=!0){let r=this.context.read(e,["markers"]);if((e==null?void 0:e.type)==="entity"&&r===void 0&&t){let i=this.context.read({type:"card"},["markers"]);return Array.isArray(i)?D(i):[]}return Array.isArray(r)?D(r):[]}_getGenericMarkersSummary(e){if((e==null?void 0:e.type)==="entity"&&!this._hasMarkersOverride(e))return"Inherited";let t=this._getGenericMarkers(e,!1).length;return t===0?"No reference markers":`${t} reference marker${t===1?"":"s"}`}_getGenericMarkerScopeKey(e){return(e==null?void 0:e.type)==="entity"?`entity:${e.index}`:"card"}_getGenericMarkerUiIds(e,t){var a;let r=this._getGenericMarkerScopeKey(e),i=(a=this._genericMarkerUiIds.get(r))!=null?a:[];for(;i.length<t;)i.push(`marker-${++this._nextGenericMarkerUiId}`);return i.length=t,this._genericMarkerUiIds.set(r,i),i}_resetGenericMarkerUiScope(e){var i;let t=this._getGenericMarkerScopeKey(e);((i=this._genericMarkerUiIds.get(t))!=null?i:[]).forEach(a=>this._expandedGenericMarkerUiIds.delete(a)),this._genericMarkerUiIds.delete(t)}_getGenericMarkerSummary(e){var s;let t=this._getGenericMarkerSource(e),r=(e==null?void 0:e.lane)==="above"?"Above":"Below",i=(s=e==null?void 0:e.shape)!=null?s:"circle",a;return t.mode==="percent"?a=t.percent===""?"Percentage":`${t.percent}%`:t.mode==="entity"||t.mode==="entity-fallback"?a=t.entity||"Entity":a=t.fixed===""?"Fixed value":String(t.fixed),`${r} \xB7 ${i.charAt(0).toUpperCase()}${i.slice(1)} \xB7 ${a}`}_refreshGenericMarkerSummary(e,t){let r=this._getGenericMarkers(e),i=r[t],a=this._getGenericMarkerUiIds(e,r.length)[t],s=this._getShadowElementById(`generic-${a}-summary`);if(i&&s){let l=this._getGenericMarkerSummary(i);s.textContent!==l&&(s.textContent=l),s.setAttribute("title",l)}}_getGenericMarkerSource(e){return this.context.source({type:"card"},{type:"reference-marker",marker:e})}_renderGenericMarkersEditor(e){let t=e.type,r=t==="entity"?e.index:"card",i=this._getGenericMarkers(e),a=this._getGenericMarkerUiIds(e,i.length),s=this._hasMarkersOverride(e),l=i.map((c,u)=>{var y,m,v,S,w,k,M,$,T,B,E,z,C,O;let h=this._getGenericMarkerSource(c),p=a[u],f=`${t}-${r}-generic-${p}`,b=this._expandedGenericMarkerUiIds.has(p),g=h.mode==="entity"||h.mode==="entity-fallback"?be("generic-marker-entity",r,h.entity,"sensor.reference",{"scope-type":t,"marker-index":u}):"",_=be("generic-marker-label-entity",r,(m=(y=c==null?void 0:c.label)==null?void 0:y.entity)!=null?m:"","sensor.information",{"scope-type":t,"marker-index":u});return`
        <div class="generic-marker-item" data-marker-ui-id="${p}" data-expanded="${b?"true":"false"}">
          <div class="generic-marker-header">
            <button type="button" class="generic-marker-toggle" data-action="toggle-generic-marker" data-marker-ui-id="${p}" aria-expanded="${b?"true":"false"}">
              <span class="generic-marker-title">Reference marker ${u+1}</span>
              <span id="generic-${p}-summary" class="generic-marker-summary" title="${F(this._getGenericMarkerSummary(c))}">${F(this._getGenericMarkerSummary(c))}</span>
            </button>
            <div class="generic-marker-actions">
              <button type="button" data-action="move-generic-marker-up" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${u===0?" disabled":""} aria-label="Move marker up">\u2191</button>
              <button type="button" data-action="move-generic-marker-down" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${u===i.length-1?" disabled":""} aria-label="Move marker down">\u2193</button>
              <button type="button" data-action="remove-generic-marker" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" aria-label="Remove marker">Remove</button>
            </div>
          </div>
          <div class="generic-marker-body" style="display:${b?"grid":"none"};">
            <div class="field-row">
              <label for="${f}-source-mode">Source</label>
              <select id="${f}-source-mode" data-kind="generic-marker-source-mode" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
              <option value="fixed"${h.mode==="fixed"?" selected":""}>Fixed</option>
              <option value="entity"${h.mode==="entity"?" selected":""}>Entity</option>
              <option value="entity-fallback"${h.mode==="entity-fallback"?" selected":""}>Entity with fixed fallback</option>
              <option value="percent"${h.mode==="percent"?" selected":""}>Percentage</option>
              </select>
            </div>
            ${h.mode==="fixed"?`
              <div class="field-row">
                <label for="${f}-fixed">Fixed value</label>
                <input id="${f}-fixed" type="number" step="any" data-kind="generic-marker-fixed" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${F(h.fixed)}">
              </div>`:""}
          ${h.mode==="entity"||h.mode==="entity-fallback"?`
            <div class="field-row">
              <label>Reference marker entity</label>
              ${g}
            </div>`:""}
          ${h.mode==="entity-fallback"?`
            <div class="field-row">
              <label for="${f}-fallback">Fixed fallback</label>
              <input id="${f}-fallback" type="number" step="any" data-kind="generic-marker-fallback" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${F(h.fixed)}">
            </div>`:""}
          ${h.mode==="percent"?`
            <div class="field-row">
              <label for="${f}-percent">Scale percentage</label>
              ${va(`${f}-percent`,`data-kind="generic-marker-percent" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"`,h.percent)}
            </div>`:""}
          <div class="inline-row generic-marker-pair">
            <div class="field-row">
              <label for="${f}-lane">Lane</label>
              <select id="${f}-lane" data-kind="generic-marker-lane" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
                <option value="above"${(c==null?void 0:c.lane)==="above"?" selected":""}>Above</option>
                <option value="below"${((v=c==null?void 0:c.lane)!=null?v:"below")==="below"?" selected":""}>Below</option>
              </select>
            </div>
            <div class="field-row">
              <label for="${f}-direction">Direction</label>
              <select id="${f}-direction" data-kind="generic-marker-direction" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${ye(c==null?void 0:c.direction)}">
                <option value="inward"${((S=c==null?void 0:c.direction)!=null?S:"inward")==="inward"?" selected":""}>Inward</option>
                <option value="outward"${(c==null?void 0:c.direction)==="outward"?" selected":""}>Outward</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label for="${f}-shape">Shape</label>
            <select id="${f}-shape" data-kind="generic-marker-shape" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}">
              ${["circle","diamond","triangle","chevron","arrow","pin"].map(A=>{var I;return`<option value="${A}"${((I=c==null?void 0:c.shape)!=null?I:"circle")===A?" selected":""}>${A}</option>`}).join("")}
            </select>
          </div>
          <div class="field-row">
            <label for="${f}-color">Color</label>
            ${K({cssText:this.options.cssText,label:"Reference marker color",id:`${f}-color`,kind:"generic-marker-color",index:r,value:(w=c==null?void 0:c.color)!=null?w:"#888888",fallbackHex:"#888888",placeholder:"#888888",extraDataset:{"scope-type":t,"marker-index":u}})}
          </div>
          <div class="field-row"><div class="toggle">
            <input id="${f}-show-marker" type="checkbox" data-kind="generic-marker-show-marker" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${(c==null?void 0:c.show_marker)===!1?"":" checked"}>
            <label for="${f}-show-marker">Show marker shape</label>
          </div></div>
          <div class="field-row"><div class="toggle">
            <input id="${f}-label-show" type="checkbox" data-kind="generic-marker-label-show" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((k=c==null?void 0:c.label)==null?void 0:k.show)===!0?" checked":""}>
            <label for="${f}-label-show">Show label</label>
          </div></div>
          <div class="field-row"><label for="${f}-label-text">Label text</label>
            <input id="${f}-label-text" type="text" data-kind="generic-marker-label-text" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${F(($=(M=c==null?void 0:c.label)==null?void 0:M.text)!=null?$:"")}" placeholder="optional semantic text">
          </div>
          <div class="field-row">
            <label>Label content entity</label>
            ${_}
          </div>
          <div class="inline-row generic-marker-options">
            <div class="field-row"><div class="toggle">
              <input id="${f}-label-show-value" type="checkbox" data-kind="generic-marker-label-show-value" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((T=c==null?void 0:c.label)==null?void 0:T.show_value)===!1?"":" checked"}>
              <label for="${f}-label-show-value">Show value</label>
            </div></div>
            <div class="field-row"><div class="toggle">
              <input id="${f}-label-show-unit" type="checkbox" data-kind="generic-marker-label-show-unit" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}"${((B=c==null?void 0:c.label)==null?void 0:B.show_unit)===!1?"":" checked"}>
              <label for="${f}-label-show-unit">Show raw unit</label>
            </div></div>
            <div class="field-row generic-marker-precision"><label for="${f}-label-precision">Label precision</label>
              <input id="${f}-label-precision" type="number" min="0" step="1" data-kind="generic-marker-label-precision" data-scope-type="${t}" data-index="${r}" data-marker-index="${u}" value="${F((O=(C=(E=c==null?void 0:c.label)==null?void 0:E.precision)!=null?C:(z=c==null?void 0:c.label)==null?void 0:z.decimal)!=null?O:"")}" placeholder="inherit">
            </div>
          </div>
          </div>
        </div>`}).join("");return`
      ${t==="entity"?`
      <div class="field-row">
        <div class="toggle">
          <input id="entity-${r}-markers-inherit" type="checkbox" data-kind="entity-markers-inherit" data-index="${r}"${s?"":" checked"}>
          <label for="entity-${r}-markers-inherit">Inherit card markers</label>
        </div>
      </div>`:""}
      ${t==="entity"&&!s?'<div class="section-note">Enable the override to replace the card marker list. An empty override clears all card markers.</div>':""}
      ${t==="card"||s?`
        <div class="section-note">Up to four markers render in each lane, including Peak, Floor, and Target. Excess generic markers remain editable and show a warning. Unresolved markers still reserve a slot and lane.</div>
        <div class="list generic-marker-list">${l}</div>
        <button type="button" data-action="add-generic-marker" data-scope-type="${t}" data-index="${r}">Add reference marker</button>`:""}
    `}_getGenericMarkerScope(e){var t;return((t=e==null?void 0:e.dataset)==null?void 0:t.scopeType)==="entity"?{type:"entity",index:Number(e.dataset.index)}:{type:"card"}}_setGenericMarkerList(e,t,r={}){let i=this.context.mutate(e,a=>P(a,["markers"],t),{...r,rerender:!1});return i&&r.rerender&&this.ui.render(e),i}_updateGenericMarker(e,t,r,i={}){var d;let a=this._getGenericMarkers(e);if(!a[t])return!1;let s=V(a[t])?D(a[t]):{},l=(d=r(s))!=null?d:s;a[t]=l;let o=this._setGenericMarkerList(e,a,i);return o&&this._refreshGenericMarkerSummary(e,t),o}_setGenericMarkerSourceMode(e,t,r){return this._updateGenericMarker(e,t,i=>{if(r==="percent")return i.at="50%",i;let a=V(i.at)?D(i.at):{};return r==="fixed"?(delete a.entity,delete a.percent,a.fixed===void 0&&(a.fixed=50)):(delete a.percent,a.entity||(a.entity=""),r==="entity"&&delete a.fixed,r==="entity-fallback"&&a.fixed===void 0&&(a.fixed=50)),i.at=a,i},{rerender:!0,referenceMarkerEdit:{type:"mode",index:t,value:r}})}_toggleGenericMarkerExpanded(e){var r;this._expandedGenericMarkerUiIds.has(e)?this._expandedGenericMarkerUiIds.delete(e):this._expandedGenericMarkerUiIds.add(e);let t=(r=this.ui.root())==null?void 0:r.querySelector(`.generic-marker-item[data-marker-ui-id="${e}"]`);if(t!=null&&t.querySelector){let i=this._expandedGenericMarkerUiIds.has(e);t.setAttribute("data-expanded",String(i)),t.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),t.querySelector(".generic-marker-body").style.display=i?"grid":"none"}else this.ui.render()}_setGenericMarkerSourcePart(e,t,r,i){return this._updateGenericMarker(e,t,a=>{var o;let s=r==="entity"?N(i).trim()||void 0:(o=ne(i))!=null?o:void 0;if(r==="percent")return a.at=s===void 0?null:`${s}%`,a;let l=V(a.at)?D(a.at):{};return s===void 0?delete l[r]:l[r]=s,a.at=Object.keys(l).length?l:null,a})}_setGenericMarkerField(e,t,r,i){let a=r.replace(/^generic-marker-/,"");if(a==="source-mode")return this._setGenericMarkerSourceMode(e,t,i);if(["fixed","fallback","entity","percent"].includes(a))return this.context.setSource(e,{type:"reference-marker",index:t},a==="fallback"?"fixed":a,i);let s,l;if(a==="show-marker")s=["show_marker"],l=i===!1?!1:void 0;else if(["lane","shape","direction"].includes(a))s=[a],l=a==="direction"?ye(i):i;else if(a==="color")s=["color"],l=ie(i,this.options.cssText);else if(a.startsWith("label-")){let o=a.slice(6).replace("show-value","show_value").replace("show-unit","show_unit");if(!["show","text","entity","show_value","show_unit","precision"].includes(o))return!1;s=["label",o],l=Ia(o,i),(["text","entity"].includes(o)&&!l||l===null)&&(l=void 0)}else return!1;return this._updateGenericMarker(e,t,o=>{if(s[0]==="label"){let d=V(o.label)?D(o.label):{};l===void 0?delete d[s[1]]:d[s[1]]=l,s[1]==="precision"&&delete d.decimal,o.label=d}else l===void 0?delete o[s[0]]:o[s[0]]=l;return o},{referenceMarkerEdit:{type:"field",index:t,path:s,value:l}})}handleField({target:e,kind:t,value:r}){if(t==="entity-markers-inherit"){let i={type:"entity",index:Number(e.dataset.index)};return this._resetGenericMarkerUiScope(i),r?this.context.mutate(i,a=>x(a,["markers"]),{rerender:!0}):this._setGenericMarkerList(i,this._getGenericMarkers(i),{rerender:!0}),!0}return t!=null&&t.startsWith("generic-marker-")?(this._setGenericMarkerField(this._getGenericMarkerScope(e),Number(e.dataset.markerIndex),t,r),!0):!1}handleClick(e){var r;let t=(r=e==null?void 0:e.dataset)==null?void 0:r.action;if(e!=null&&e.disabled)return!1;if(t==="toggle-generic-marker")return this._toggleGenericMarkerExpanded(e.dataset.markerUiId),!0;if(t==="add-generic-marker"){let i=this._getGenericMarkerScope(e),a=this._getGenericMarkers(i),s=this._getGenericMarkerUiIds(i,a.length);a.push({at:{fixed:50}});let l=`marker-${++this._nextGenericMarkerUiId}`;return s.push(l),this._expandedGenericMarkerUiIds.add(l),this._setGenericMarkerList(i,a,{rerender:!0,referenceMarkerEdit:{type:"add"}}),!0}if(t==="remove-generic-marker"||t==="move-generic-marker-up"||t==="move-generic-marker-down"){let i=this._getGenericMarkerScope(e),a=Number(e.dataset.markerIndex),s=this._getGenericMarkers(i),l=this._getGenericMarkerUiIds(i,s.length);if(t==="remove-generic-marker")s.splice(a,1),this._expandedGenericMarkerUiIds.delete(l[a]),l.splice(a,1);else{let o=a+(t==="move-generic-marker-up"?-1:1);if(o<0||o>=s.length)return!0;[s[a],s[o]]=[s[o],s[a]],[l[a],l[o]]=[l[o],l[a]]}return this._setGenericMarkerList(i,s,{rerender:!0,referenceMarkerEdit:{type:t==="add-generic-marker"?"add":t==="remove-generic-marker"?"remove":"move",index:Number(e.dataset.markerIndex),delta:t==="move-generic-marker-up"?-1:1}}),!0}return!1}syncStructure(e={type:"card"}){var f,b,g,_,y;let t=this.ui.root(),r=t==null?void 0:t.querySelector(e.type==="entity"?`.entity-shell[data-entity-shell-index="${e.index}"] .override-group[data-group="markers"]`:'.card-subgroup[data-group="generic-markers"]'),i=(f=r==null?void 0:r.querySelector)==null?void 0:f.call(r,".generic-marker-list");if(!(i!=null&&i.ownerDocument))return!1;let a=this._getGenericMarkers(e),s=this._getGenericMarkerUiIds(e,a.length),l=i.ownerDocument.createElement("template");l.innerHTML=this.render(e);let o=l.content.querySelectorAll(".generic-marker-item"),d=new Map(Array.from(i.children,m=>[m.dataset.markerUiId,m])),c=t.activeElement,u=(b=c==null?void 0:c.closest)==null?void 0:b.call(c,".generic-marker-item"),h=u&&{id:u.dataset.markerUiId,kind:c.dataset.kind,action:c.dataset.action},p=i.firstElementChild;for(let m of o){let v=m.dataset.markerUiId,S=(g=d.get(v))!=null?g:m;if(d.delete(v),S!==m){S.querySelector(".generic-marker-title").textContent=m.querySelector(".generic-marker-title").textContent;for(let E of S.querySelectorAll(".generic-marker-actions button")){let z=m.querySelector(`[data-action="${E.dataset.action}"]`);E.dataset.markerIndex=z.dataset.markerIndex,E.disabled=z.disabled}let M=S.querySelector(".generic-marker-body"),$=E=>{var z;return(z=E.querySelector("[data-kind]"))==null?void 0:z.dataset.kind},T=new Map(Array.from(M.children,E=>[$(E),E])),B=M.firstElementChild;for(let E of Array.from(m.querySelector(".generic-marker-body").children)){let z=$(E),C=(_=T.get(z))!=null?_:E,O=C.querySelector("[data-kind]"),A=E.querySelector("[data-kind]"),I=(O==null?void 0:O.tagName)===(A==null?void 0:A.tagName)?C:E;T.delete(z),I!==B&&M.insertBefore(I,B),I!==C&&C.remove(),B=I.nextElementSibling}for(let E of T.values())E.remove()}let w=s.indexOf(v);for(let M of S.querySelectorAll("[data-marker-index]"))M.dataset.markerIndex=String(w);let k=this._expandedGenericMarkerUiIds.has(v);S.setAttribute("data-expanded",String(k)),S.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(k)),S.querySelector(".generic-marker-body").style.display=k?"grid":"none",S!==p&&i.insertBefore(S,p),p=S.nextElementSibling}for(let m of d.values())m.remove();if(h&&c!==t.activeElement){let m=i.querySelector(`[data-marker-ui-id="${h.id}"]`),v=h.kind?m==null?void 0:m.querySelector(`[data-kind="${h.kind}"]`):h.action?m==null?void 0:m.querySelector(`[data-action="${h.action}"]`):null;(y=v==null?void 0:v.focus)==null||y.call(v,{preventScroll:!0})}return!0}syncControls(e,t=!1,r={type:"card"}){let i=this.ui.root(),a=`${r.type}-${r.type==="entity"?r.index:"card"}-generic-`;if(!i)return;let s=this._getGenericMarkers(r),l=this._getGenericMarkerUiIds(r,s.length);s.forEach((o,d)=>{var p,f,b,g,_,y,m,v,S,w,k,M;let c=this._getGenericMarkerSource(o),u=(p=o==null?void 0:o.label)!=null?p:{},h={"source-mode":c.mode,fixed:(f=c.fixed)!=null?f:"",fallback:(b=c.fixed)!=null?b:"",percent:(g=c.percent)!=null?g:"",lane:(_=o==null?void 0:o.lane)!=null?_:"below",shape:(y=o==null?void 0:o.shape)!=null?y:"circle",direction:ye(o==null?void 0:o.direction),color:we(o==null?void 0:o.color,"#888888"),"color-text-fallback":(m=o==null?void 0:o.color)!=null?m:"#888888","label-text":(v=u.text)!=null?v:"","label-precision":(w=(S=u.precision)!=null?S:u.decimal)!=null?w:""};for(let[$,T]of Object.entries(h)){let B=i.querySelector(`#${a}${l[d]}-${$}`);B&&(B!==i.activeElement||t)&&(B.value=String(T))}for(let[$,T]of[["show-marker",(o==null?void 0:o.show_marker)!==!1],["label-show",u.show===!0],["label-show-value",u.show_value!==!1],["label-show-unit",u.show_unit!==!1]]){let B=i.querySelector(`#${a}${l[d]}-${$}`);B&&(B.checked=T)}for(let[$,T,B]of[["entity",(k=c.entity)!=null?k:"","Reference marker entity"],["label-entity",(M=u.entity)!=null?M:"","Label content entity"]])for(let E of["input","ha-entity-picker"])for(let z of Array.from(i.querySelectorAll(`${E}[data-kind="generic-marker-${$}"]`)).filter(C=>Number(C.dataset.markerIndex)===d&&C.dataset.scopeType===r.type&&String(C.dataset.index)===String(r.type==="entity"?r.index:"card")))z.id=`${a}${l[d]}-${$}`,z.setAttribute("aria-label",B),(z!==i.activeElement||t)&&(z.value=T),E==="ha-entity-picker"&&(z.hass=e,z.label=B,z.allowCustomEntity=!0);this._refreshGenericMarkerSummary(r,d)})}}});var Ci,Kn=U(()=>{xe();lr();re();ve();Sa();xa();wa();$a();Fa();Ri();Ba();Ga();Na();Aa();La();ja();Di();kr();Ci=class extends HTMLElement{get _gradientStopValidationMessages(){return this._gradientStopsSection._gradientStopValidationMessages}get _gradientStopPosTexts(){return this._gradientStopsSection._gradientStopPosTexts}get _gradientStopsUiRows(){return this._gradientStopsSection._gradientStopsUiRows}get _gradientStopsDrafts(){return this._gradientStopsSection._gradientStopsDrafts}get _segmentBoundaryTexts(){return this._segmentsSection._segmentBoundaryTexts}get _segmentUiRows(){return this._segmentsSection._segmentUiRows}get _segmentDrafts(){return this._segmentsSection._segmentDrafts}get _baselineColorDrafts(){return this._baselineSection._baselineColorDrafts}get _targetAboveFillDrafts(){return this._targetSection._targetAboveFillDrafts}get _genericMarkerUiIds(){return this._referenceMarkersSection._genericMarkerUiIds}get _expandedGenericMarkerUiIds(){return this._referenceMarkersSection._expandedGenericMarkerUiIds}get _nextGenericMarkerUiId(){return this._referenceMarkersSection._nextGenericMarkerUiId}set _nextGenericMarkerUiId(e){this._referenceMarkersSection._nextGenericMarkerUiId=e}constructor(){super(),this.attachShadow({mode:"open"}),this._segmentsSection=new pt(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedSegments(e,t,r)}),this._gradientStopsSection=new mt(this._createSectionContext(),this._paletteUi(),{write:(e,t,r)=>this._setScopedGradientStops(e,t,r)}),this._needleSection=new bt(this._createSectionContext()),this._baselineSection=new _t(this._createSectionContext()),this._targetSection=new St(this._createSectionContext()),this._extremaSection=new xt(this._createSectionContext()),this._referenceMarkersSection=new wt(this._createSectionContext(),{...this._paletteUi(),render:(e={type:"card"})=>{let t;this._isRendering=!0;try{t=this._referenceMarkersSection.syncStructure(e)}finally{this._isRendering=!1}if(!t){this._render();return}this._referenceMarkersSection.syncControls(this._hass,!1,e),this._syncEntityPickers(),this._numericDrafts.apply(this.shadowRoot)}}),this._config={},this._numericDrafts=new ct,this._draftConfig={},this._hass=null,this._isRendering=!1,this._renderScheduled=!1,this._lastRenderedConfigJson=null,this._lastEmittedConfigJson=null,this._shadowListenersAttached=!1,this._expandedEntityOverrides=new Set,this._expandedOverrideGroups=new Set,this._expandedCardGroups=new Set,this._targetSection.reset(),this._baselineSection.reset(),this._pendingFocusSelector=null,this._boundHandleClick=e=>this._handleClick(e),this._boundHandleChange=e=>this._handleChange(e),this._boundHandleInput=e=>this._handleInput(e),this._boundHandleValueChanged=e=>this._handleValueChanged(e),this._boundHandleKeydown=e=>this._handleKeydown(e)}setConfig(e){var l;let t=this._cloneDeep(e!=null?e:{}),r=this._serializeConfig(t),i=this._serializeConfig(this._config),a=this._serializeConfig(this._draftConfig);if(r===i)return;if(r===a){this._config=t;return}if(r===this._lastEmittedConfigJson){this._config=t;return}if(this._getEmittedConfigJson(t)===this._getEmittedConfigJson(this._draftConfig)){this._config=t;return}let s=!((l=this.shadowRoot)!=null&&l.innerHTML)||r!==this._lastRenderedConfigJson;this._lastEmittedConfigJson=null,this._config=t,this._draftConfig=this._cloneDeep(t),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._targetSection.reset(),this._baselineSection.reset(),this._referenceMarkersSection.reset(),this._numericDrafts.reset(),s&&this._render()}set hass(e){var t;if(this._hass=e,!((t=this.shadowRoot)!=null&&t.innerHTML)){this._render();return}this._syncEntityPickers()}_cloneContainer(e){return _r(e)}_cloneDeep(e){return D(e)}_serializeConfig(e){return ge(e)}_getEmittedConfigJson(e){return this._serializeConfig(e)}_isObject(e){return V(e)}_setPathValue(e,t,r){return P(e,t,r)}_deletePathValue(e,t){return x(e,t)}_getPathValue(e,t){return q(e,t)}_hasPath(e,t){return In(e,t)}_normalizeTextValue(e){return N(e)}_normalizeOptionalEnabled(e){return Ln(e)}_normalizeNumberValue(e){return ne(e)}_normalizeDecimalValue(e){return Te(e)}_preferStructuredPath(e,t=null){return this._hasPath(this._draftConfig,e.slice(0,-1))||this._hasPath(this._draftConfig,e)?e:t&&this._hasPath(this._draftConfig,t)?t:e}_getEntitiesValue(){var e,t;return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(r=>{var i,a,s;return typeof r=="string"?{entity:r}:{entity:(i=r==null?void 0:r.entity)!=null?i:"",name:(a=r==null?void 0:r.name)!=null?a:"",icon:(s=r==null?void 0:r.icon)!=null?s:""}}):this._draftConfig.entity?[{entity:this._draftConfig.entity,name:(e=this._draftConfig.name)!=null?e:"",icon:(t=this._draftConfig.icon)!=null?t:""}]:[]}_getRawEntityRows(){return Array.isArray(this._draftConfig.entities)?this._cloneDeep(this._draftConfig.entities):this._draftConfig.entity!==void 0?this._draftConfig.name!==void 0||this._draftConfig.icon!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[this._draftConfig.entity]:[]}_buildEntityConfigEntries(e){let t=!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0,r=Array.isArray(this._draftConfig.entities)?this._draftConfig.entities:this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[],i=e.map((a,s)=>{let l=r[s];if(this._isObject(l)){let u={...l,entity:a.entity},h=this._normalizeTextValue(a.name).trim();h?u.name=h:delete u.name;let p=a==null?void 0:a.icon,f=typeof p=="string"?p.trim():p;return f===!1?u.icon=!1:typeof f=="string"&&f?u.icon=f:l.icon===!1?u.icon=!1:delete u.icon,u}let o={entity:a.entity},d=this._normalizeTextValue(a.name).trim();d&&(o.name=d);let c=typeof(a==null?void 0:a.icon)=="string"?a.icon.trim():a==null?void 0:a.icon;return c===!1?o.icon=!1:typeof c=="string"&&c&&(o.icon=c),o});return t?i:i.map(a=>this._isObject(a)&&Object.keys(a).length===1&&a.entity!==void 0?a.entity:a)}_updateConfig(e){this._draftConfig=this._cloneDeep(e)}_emitConfigChanged(){let e=this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig)),t=this._serializeConfig(e);return t===this._lastEmittedConfigJson?!1:(this._lastEmittedConfigJson=t,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),!0)}_scheduleRender(){this._renderScheduled||this._isRendering||(this._renderScheduled=!0,setTimeout(()=>{this._renderScheduled=!1,this._render()},0))}_applyUserConfig(e,t={}){let{rerender:r=!1}=t,i=this._serializeConfig(e),a=this._serializeConfig(this._draftConfig);return i===a?!1:(this._updateConfig(e),this._emitConfigChanged(),this._refreshDerivedEditorUi(),r&&this._scheduleRender(),!0)}_getShadowElementById(e){var t,r,i,a,s,l;return this.shadowRoot&&(l=(s=(r=(t=this.shadowRoot).getElementById)==null?void 0:r.call(t,e))!=null?s:(a=(i=this.shadowRoot).querySelector)==null?void 0:a.call(i,`#${e}`))!=null?l:null}_setElementChecked(e,t){let r=this._getShadowElementById(e);r&&(r.checked=!!t)}_setElementText(e,t){let r=this._getShadowElementById(e);r&&(r.textContent=t)}_refreshDerivedEditorUi(){this.shadowRoot&&(this._refreshCardDerivedUi(),this._refreshEntityDerivedUi())}_refreshCardDerivedUi(){this._setElementText("card-group-marker-target-summary",this._getCardTargetMarkerSummary()),this._setElementText("card-group-marker-peak-summary",this._getMarkerResetSummary("peak")),this._setElementText("card-group-marker-floor-summary",this._getMarkerResetSummary("floor")),this._setElementText("card-group-baseline-summary",this._getCardBaselineSummary()),this._setElementText("card-group-generic-markers-summary",this._getGenericMarkersSummary({type:"card"})),this._setElementText("card-group-segments-summary",this._getSegmentsSummary({type:"card"})),this._setElementText("card-group-gradient-stops-summary",this._getGradientStopsSummary({type:"card"})),this._setElementChecked("target-above-fill-enabled",this._isTargetAboveFillEnabled({type:"card"})),this._setElementChecked("baseline-above-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"above")),this._setElementChecked("baseline-below-color-enabled",this._isBaselineDirectionalColorEnabled({type:"card"},"below")),this._refreshSegmentUi({type:"card"})}_refreshEntityDerivedUi(){let e=this._getEntitiesValue().length;for(let t=0;t<e;t+=1){let r={type:"entity",index:t};this._setElementChecked(`entity-${t}-scale-inherit`,!this._hasResolvableOverride(this._getResolvableScopedValue(r,"min"))&&!this._hasResolvableOverride(this._getResolvableScopedValue(r,"max"))),this._setElementChecked(`entity-${t}-target-inherit`,!this._hasTargetOverride(r)),this._setElementChecked(`entity-${t}-baseline-inherit`,!this._hasBaselineOverride(r)),this._setElementChecked(`entity-${t}-needle-inherit`,!this._hasNeedleOverride(r)),this._setElementChecked(`entity-${t}-peak-inherit`,!this._hasPeakOverride(r)),this._setElementChecked(`entity-${t}-floor-inherit`,!this._hasExtremumOverride(r,"floor")),this._setElementChecked(`entity-${t}-markers-inherit`,!this._hasMarkersOverride(r)),this._setElementChecked(`entity-${t}-bar-inherit`,!this._hasEntityBarAppearanceOverride(r)),this._setElementChecked(`entity-${t}-segments-inherit`,!this._hasSegmentsOverride(r)),this._setElementChecked(`entity-${t}-gradient-stops-inherit`,!this._hasGradientStopsOverride(r)),this._setElementChecked(`entity-${t}-layout-inherit`,!this._hasLayoutOverride(r)),this._setElementChecked(`entity-${t}-formatting-inherit`,!this._hasFormattingOverride(r)),this._setElementChecked(`entity-${t}-target-above-fill-enabled`,this._isTargetAboveFillEnabled(r)),this._setElementChecked(`entity-${t}-baseline-above-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"above")),this._setElementChecked(`entity-${t}-baseline-below-color-enabled`,this._isBaselineDirectionalColorEnabled(r,"below")),this._setElementText(`entity-${t}-group-scale-summary`,this._getScaleOverrideSummary(r)),this._setElementText(`entity-${t}-group-target-summary`,this._getTargetOverrideSummary(r)),this._setElementText(`entity-${t}-group-baseline-summary`,this._getBaselineOverrideSummary(r)),this._setElementText(`entity-${t}-group-needle-summary`,this._getNeedleSummary(r)),this._setElementText(`entity-${t}-group-peak-summary`,this._getPeakSummary(r)),this._setElementText(`entity-${t}-group-floor-summary`,this._getFloorSummary(r)),this._setElementText(`entity-${t}-group-markers-summary`,this._getGenericMarkersSummary(r)),this._setElementText(`entity-${t}-group-bar-summary`,this._getBarAppearanceSummary(r)),this._setElementText(`entity-${t}-group-segments-summary`,this._getSegmentsSummary(r)),this._setElementText(`entity-${t}-group-gradient-stops-summary`,this._getGradientStopsSummary(r)),this._setElementText(`entity-${t}-group-layout-summary`,this._getLayoutSummary(r)),this._setElementText(`entity-${t}-group-formatting-summary`,this._getFormattingSummary(r)),this._refreshSegmentUi(r)}}_queuePostRenderFocus(e){this._pendingFocusSelector=e||null}_applyPendingFocus(){if(!this._pendingFocusSelector||!this.shadowRoot)return;let e=this._pendingFocusSelector;this._pendingFocusSelector=null,setTimeout(()=>{var r,i;let t=(i=(r=this.shadowRoot)==null?void 0:r.querySelector)==null?void 0:i.call(r,e);if(!(!t||typeof t.focus!="function"))try{t.focus({preventScroll:!0})}catch(a){t.focus()}},0)}_setValueAtPath(e,t,r={}){let i=t===void 0?this._deletePathValue(this._draftConfig,e):this._setPathValue(this._draftConfig,e,t);return this._applyUserConfig(i,r)}_setTitle(e){this._setValueAtPath(["title"],e)}_setEntityField(e,t,r){let i=this._normalizeTextValue(r);if(!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&e===0)return i.trim()?this._setValueAtPath([t],i.trim()):this._setValueAtPath([t],void 0);let a=this._withEntityScopeConfig(s=>{var d;let l=s[e],o=this._isObject(l)?this._cloneDeep(l):{entity:(d=l==null?void 0:l.entity)!=null?d:""};return i.trim()?o[t]=i.trim():delete o[t],s[e]=o,s});return this._applyUserConfig(a)}_cleanupEntityIdentityForEmit(e){if(!this._isObject(e))return e;let t=this._cloneDeep(e),r=this._normalizeTextValue(t.name).trim();if(r?t.name=r:delete t.name,t.icon===!1)return t;let i=this._normalizeTextValue(t.icon).trim();return i?t.icon=i:delete t.icon,t}_cleanupNeedleForEmit(e,t={type:"card"}){var l;if(!this._isObject(e)||!this._isObject(e.bar))return e;let r=this._cloneDeep(e),i=(l=r.bar)==null?void 0:l.needle;if(i===void 0)return r;let a=this._normalizeColorComparisonValue("#ffffff"),s=null;if(i===!0)s={show:!0};else if(i===!1)s=(t==null?void 0:t.type)==="entity"?{show:!1}:null;else if(this._isObject(i)){let o=this._normalizeTextValue(i.color).trim();i.show===!0?s={show:!0}:i.show===!1?s=(t==null?void 0:t.type)==="entity"?{show:!1}:null:(t==null?void 0:t.type)==="entity"&&o&&this._normalizeColorComparisonValue(o)!==a&&(s={}),s&&o&&this._normalizeColorComparisonValue(o)!==a&&(s.color=o)}else s=null;return s?r.bar.needle=s:(delete r.bar.needle,Object.keys(r.bar).length||delete r.bar),r}_cleanupResolvableValueForEmit(e){if(this._isObject(e)||e===null||typeof e=="string"&&this._normalizeNumberValue(e)===null)return this._cloneDeep(e);let t=this._normalizeNumberValue(e);return t===null?null:{fixed:t}}_cleanupScaleForEmit(e){if(!this._isObject(e)||!this._isObject(e.scale))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.scale);return["min","max"].forEach(i=>{if(!Object.prototype.hasOwnProperty.call(r,i))return;let a=this._cleanupResolvableValueForEmit(r[i]);a||r[i]===null?(r[i]=a,delete t[i],delete t[`${i}_entity`]):delete r[i]}),Object.keys(r).length?t.scale=r:delete t.scale,t}_cleanupFormattingForEmit(e){if(!this._isObject(e)||!this._isObject(e.formatting))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.formatting),i=this._normalizeTextValue(r.unit).trim(),a=this._normalizeDecimalValue(r.decimal);return i?(r.unit=i,delete t.unit):delete r.unit,a!==null?(r.decimal=a,delete t.decimal):delete r.decimal,Object.keys(r).length?t.formatting=r:delete t.formatting,t}_cleanupLayoutForEmit(e){if(!this._isObject(e)||!this._isObject(e.layout))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.layout),i=this._isObject(r.label)?this._cloneDeep(r.label):null,a=this._isObject(r.hero)?this._cloneDeep(r.hero):null,s=this._normalizeNumberValue(r.height),l=this._normalizeNumberValue(i==null?void 0:i.width),o=this._normalizeHeroValueSizeValue(a==null?void 0:a.value_size),d=this._normalizeTextValue(i==null?void 0:i.position).trim();return s!==null&&s>=24?(r.height=s,delete t.height):delete r.height,i&&(d?(i.position=d,delete t.label_position):delete i.position,l!==null?(i.width=l,delete t.label_width):delete i.width,Object.keys(i).length?r.label=i:delete r.label),a&&(o!==null?a.value_size=o:delete a.value_size,Object.keys(a).length?r.hero=a:delete r.hero),Object.keys(r).length?t.layout=r:delete t.layout,t}_cleanupTargetForEmit(e,t={type:"card"}){var h;if(!this._isObject(e)||!this._isObject(e.target))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.target),a=this._cleanupResolvableValueForEmit(i.at),s=this._normalizeTextValue(i.color).trim(),l=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"target"),o=this._normalizeTextValue((h=i.when_exceeded)==null?void 0:h.fill_color).trim(),c=Object.prototype.hasOwnProperty.call(i,"shape")?qe(i.shape):null,u=Object.prototype.hasOwnProperty.call(i,"direction")?ye(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,a||i.at===null?(i.at=a,delete r.target_entity):delete i.at,s&&this._normalizeColorComparisonValue(s)!==this._normalizeColorComparisonValue("#888")?(i.color=s,delete r.target_color):delete i.color,Object.keys(l).length?(i.label=l,l.show===!0&&delete r.show_target_label):(delete i.label,delete r.show_target_label),o?(i.when_exceeded={...this._isObject(i.when_exceeded)?i.when_exceeded:{},fill_color:o},delete r.above_target_color):delete i.when_exceeded,(t==null?void 0:t.type)==="card"&&c==="diamond"?delete i.shape:c?i.shape=c:delete i.shape,u==="inward"&&((t==null?void 0:t.type)!=="entity"||u===this._getEffectiveMarkerDirection({type:"card"},"target"))?delete i.direction:u&&(i.direction=u),Object.keys(i).length?r.target=i:delete r.target,r}_cleanupBaselineForEmit(e){if(!this._isObject(e)||!this._isObject(e.baseline))return e;let t=this._cloneDeep(e),r=this._cloneDeep(t.baseline),i=this._cleanupResolvableValueForEmit(r.at);return typeof r.enabled!="boolean"&&delete r.enabled,i||r.at===null?r.at=i:delete r.at,["above","below"].forEach(a=>{if(!this._isObject(r[a])){delete r[a];return}let s=this._normalizeTextValue(r[a].color).trim();s?r[a]={...r[a],color:s}:delete r[a]}),Object.keys(r).length?t.baseline=r:delete t.baseline,t}_cleanupPeakForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.peak))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.peak),a=this._normalizeTextValue(i.color).trim(),s=Object.prototype.hasOwnProperty.call(i,"direction")?ye(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,(t==null?void 0:t.type)!=="entity"&&i.reset==="never"&&delete i.reset,s==="inward"&&((t==null?void 0:t.type)!=="entity"||s===this._getEffectiveMarkerDirection({type:"card"},"peak"))?delete i.direction:s&&(i.direction=s),a&&this._normalizeColorComparisonValue(a)!==this._normalizeColorComparisonValue("#888")?(i.color=a,delete r.peak_color):delete i.color,i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"peak"),Object.keys(i.label).length||delete i.label,Object.keys(i).length?r.peak=i:delete r.peak,r}_cleanupFloorForEmit(e,t={type:"card"}){if(!this._isObject(e)||!this._isObject(e.floor))return e;let r=this._cloneDeep(e),i=this._cloneDeep(r.floor),a=this._normalizeTextValue(i.color).trim(),s=Object.prototype.hasOwnProperty.call(i,"direction")?ye(i.direction):null;return typeof i.enabled!="boolean"&&delete i.enabled,a&&this._normalizeColorComparisonValue(a)!==this._normalizeColorComparisonValue("#888888")?i.color=a:delete i.color,this._isObject(i.label)&&(i.label=this._cleanBuiltinMarkerLabelForEmit(i.label,t,"floor"),Object.keys(i.label).length||delete i.label),((t==null?void 0:t.type)!=="entity"&&i.reset==="never"||i.reset===void 0||i.reset===null||i.reset==="")&&delete i.reset,s==="inward"&&((t==null?void 0:t.type)!=="entity"||s===this._getEffectiveMarkerDirection({type:"card"},"floor"))?delete i.direction:s&&(i.direction=s),Object.keys(i).length?r.floor=i:delete r.floor,r}_cleanBuiltinMarkerLabelForEmit(e,t,r){var l,o,d;let i=this._isObject(e)?this._cloneDeep(e):{},a=(t==null?void 0:t.type)==="entity"?(l=this._getScopedValue({type:"card"},[r,"label"]))!=null?l:{}:{};i.show===!1&&(t==null?void 0:t.type)!=="entity"&&delete i.show,i.show===!1&&(t==null?void 0:t.type)==="entity"&&a.show!==!0&&delete i.show,i.show_value===!0&&((t==null?void 0:t.type)!=="entity"||a.show_value!==!1)&&delete i.show_value,i.show_unit===!0&&((t==null?void 0:t.type)!=="entity"||a.show_unit!==!1)&&delete i.show_unit,typeof i.text=="string"&&(i.text=i.text.replace(/\s+/g," ").trim(),!i.text&&(t==null?void 0:t.type)!=="entity"&&delete i.text);let s=this._normalizeDecimalValue((o=i.precision)!=null?o:i.decimal);return delete i.decimal,s===null||(t==null?void 0:t.type)==="entity"&&s===((d=a.precision)!=null?d:a.decimal)?delete i.precision:i.precision=s,i}_cleanupBarForEmit(e,t={type:"card"},r=null,i=null){if(!this._isObject(e)||!this._isObject(e.bar))return e;let a=this._cloneDeep(e),s=this._cloneDeep(a.bar),o=["percent","scale"].includes(s.segment_space)?s.segment_space:(t==null?void 0:t.type)==="entity"&&["percent","scale"].includes(i)?i:null;if(o==="percent"&&Array.isArray(s.segments)){let p=f=>typeof f=="number"&&Number.isFinite(f)?`${f}%`:typeof f=="string"&&f.trim()!==""&&!f.includes("%")&&Number.isFinite(Number(f.trim()))?`${Number(f.trim())}%`:f;s.segments=s.segments.map(f=>({...f,from:p(f==null?void 0:f.from),...Object.prototype.hasOwnProperty.call(f!=null?f:{},"to")?{to:p(f.to)}:{}}))}delete s.segment_space;let d=this._normalizeTextValue(s.fill_style).trim(),c=this._normalizeTextValue(s.color).trim(),u=Array.isArray(s.segments)?s.segments:null,h=Array.isArray(s.gradient_stops)?s.gradient_stops:null;if(d){let p=this._cloneDeep(a);delete p.bar.fill_style;let f=Fe(p,(t==null?void 0:t.type)==="entity"?r:null,{isCardScope:(t==null?void 0:t.type)!=="entity"}).fill_style;d==="bands"&&f==="bands"?delete s.fill_style:s.fill_style=d,delete a.color_mode}else delete s.fill_style;return c&&this._normalizeColorComparisonValue(c)!==this._normalizeColorComparisonValue("#4a9eff")?(s.color=c,delete a.color):delete s.color,s.solid_fill===!0?s.solid_fill=!0:delete s.solid_fill,u&&(!u.length||o||!this._segmentsEqualForEditor(u,this._getDefaultSegments()))?(s.segments=u,delete a.segments,delete a.severity):delete s.segments,h&&(!h.length||h.length>=2&&!this._isDefaultGradientStops(h))?(s.gradient_stops=this._sanitizeGradientStopsForEmit(h),delete a.gradient_stops):delete s.gradient_stops,Object.keys(s).length?a.bar=s:delete a.bar,a}_getEditorKnownKeyOrder(e=[]){switch(e.join(".")){case"":return["type","title","entities","scale","target","baseline","peak","floor","layout","formatting","bar"];case"entities.*":return["entity","name","icon","scale","target","baseline","peak","floor","layout","formatting","bar"];case"scale":return["min","max"];case"scale.min":case"scale.max":case"target.at":case"baseline.at":return["fixed","entity"];case"target":return["enabled","at","shape","color","label","when_exceeded"];case"target.label":return["show","decimal"];case"target.when_exceeded":return["fill_color"];case"baseline":return["enabled","at","above","below"];case"baseline.above":case"baseline.below":return["color"];case"peak":return["enabled","color","reset","label"];case"floor":return["enabled","color","reset","label"];case"peak.label":case"floor.label":return["show","decimal"];case"layout":return["height","label","hero"];case"layout.label":return["position","hero_size","width"];case"layout.hero":return["size","value_size"];case"formatting":return["unit","decimal"];case"bar":return["fill_style","color","solid_fill","needle","segments","gradient_stops"];case"bar.needle":return["show","color"];default:return null}}_orderEditorConfigKeys(e,t=[]){var s;if(Array.isArray(e)){let l=t[0]==="entities"?["entities","*"]:t;return e.map(o=>this._orderEditorConfigKeys(o,l))}if(!this._isObject(e))return e;let r={},i=(s=this._getEditorKnownKeyOrder(t))!=null?s:[],a=new Set;return i.forEach(l=>{Object.prototype.hasOwnProperty.call(e,l)&&(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]),a.add(l))}),Object.keys(e).forEach(l=>{a.has(l)||(r[l]=this._orderEditorConfigKeys(e[l],[...t,l]))}),r}_cleanupEditorEmittedConfig(e){var a;if(!this._isObject(e))return e;let t=(a=e.bar)==null?void 0:a.segment_space,r=this._cleanupEntityIdentityForEmit(e);r=this._cleanupScaleForEmit(r),r=this._cleanupTargetForEmit(r,{type:"card"}),r=this._cleanupBaselineForEmit(r),r=this._cleanupPeakForEmit(r,{type:"card"}),r=this._cleanupFloorForEmit(r,{type:"card"}),r=this._cleanupGenericMarkersForEmit(r),r=this._cleanupLayoutForEmit(r),r=this._cleanupFormattingForEmit(r),r=this._cleanupNeedleForEmit(r,{type:"card"}),r=this._cleanupBarForEmit(r,{type:"card"}),Array.isArray(r.entities)&&(r.entities=r.entities.map((s,l)=>{if(!this._isObject(s))return s;let o=this._cleanupEntityIdentityForEmit(s);return o=this._cleanupScaleForEmit(o),o=this._cleanupTargetForEmit(o,{type:"entity",index:l}),o=this._cleanupBaselineForEmit(o),o=this._cleanupPeakForEmit(o,{type:"entity",index:l}),o=this._cleanupFloorForEmit(o,{type:"entity",index:l}),o=this._cleanupGenericMarkersForEmit(o),o=this._cleanupLayoutForEmit(o),o=this._cleanupFormattingForEmit(o),o=this._cleanupNeedleForEmit(o,{type:"entity"}),o=this._cleanupBarForEmit(o,{type:"entity",index:l},r,t),o}));let i=s=>{let l=Qe({...s,...!s.entities&&!s.entity?{entities:[]}:{}}),o=["layout","scale","bar","baseline","formatting","target_marker","peak_marker","floor_marker","generic_markers"],d=u=>({...Object.fromEntries(o.map(h=>[h,u[h]])),scale:Object.fromEntries(["min","max"].map(h=>[h,{...u.scale[h],fixed_explicit:u.scale[h].fixed_explicit!==!1}]))}),c=(u,h="")=>Array.isArray(u)?u.map(p=>c(p)):this._isObject(u)?Object.fromEntries(Object.entries(u).filter(([p])=>!["severity","segment_space","label_precision_key"].includes(p)&&!/invalid/i.test(p)).map(([p,f])=>[p,c(f,p)])):h==="fixed"?ze(null,u):/color/i.test(h)&&typeof u=="string"?this._normalizeColorComparisonValue(u):u;return this._serializeConfig(c({card:d(l),entities:l.entities.map(u=>({entity:u.entity,name:u.name,icon:u.icon,...d(u)}))}))};try{i(e)!==i(r)&&(r=this._cloneDeep(e))}catch(s){r=this._cloneDeep(e)}return this._orderEditorConfigKeys(r)}_getScopedPath(e,t){return jn(e,t)}_normalizePath(e){return pi(e)}_getEntityRawEntries(){return Array.isArray(this._draftConfig.entities)?this._draftConfig.entities.map(e=>this._isObject(e)?this._cloneDeep(e):{entity:e}):this._draftConfig.entity!==void 0?[{entity:this._draftConfig.entity,...this._draftConfig.name!==void 0?{name:this._draftConfig.name}:{},...this._draftConfig.icon!==void 0?{icon:this._draftConfig.icon}:{}}]:[]}_withEntityScopeConfig(e){let t=this._getEntityRawEntries(),r=e(t.map(a=>this._cloneDeep(a))),i=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(i=this._deletePathValue(i,["entity"]),this._draftConfig.name!==void 0&&(i=this._deletePathValue(i,["name"])),this._draftConfig.icon!==void 0&&(i=this._deletePathValue(i,["icon"]))),i}_setEntityRowsRaw(e,t={}){var s;let r=this._cloneDeep(e);if(Array.isArray(this._draftConfig.entities)||this._draftConfig.entity===void 0||r.length!==1){let l=this._setPathValue(this._draftConfig,["entities"],r);return!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(l=this._deletePathValue(l,["entity"]),l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"])),this._applyUserConfig(l,t)}let[i]=r;if(typeof i=="string"){let l=this._setPathValue(this._draftConfig,["entity"],i);return l=this._deletePathValue(l,["name"]),l=this._deletePathValue(l,["icon"]),this._applyUserConfig(l,t)}let a=this._setPathValue(this._draftConfig,["entity"],(s=i==null?void 0:i.entity)!=null?s:"");return i&&Object.prototype.hasOwnProperty.call(i,"name")?a=this._setPathValue(a,["name"],i.name):a=this._deletePathValue(a,["name"]),i&&Object.prototype.hasOwnProperty.call(i,"icon")?a=this._setPathValue(a,["icon"],i.icon):a=this._deletePathValue(a,["icon"]),this._applyUserConfig(a,t)}_moveEntityRow(e,t){let r=this._getRawEntityRows(),i=e+t;if(e<0||e>=r.length||i<0||i>=r.length)return!1;let a=this._cloneDeep(r);return[a[e],a[i]]=[a[i],a[e]],this._setEntityRowsRaw(a,{rerender:!0})}_duplicateEntityRow(e){let t=this._getRawEntityRows();if(e<0||e>=t.length)return!1;let r=this._cloneDeep(t[e]),i=typeof r=="string"?{entity:r}:this._cloneDeep(r);this._isObject(i)&&typeof i.name=="string"&&i.name.trim()&&(i.name=`${i.name.trim()} copy`);let a=this._cloneDeep(t);return a.splice(e+1,0,i),this._setEntityRowsRaw(a,{rerender:!0})}_removeEntityRow(e){let t=this._getRawEntityRows();if(t.length<=1||e<0||e>=t.length)return!1;let r=t.filter((i,a)=>a!==e);return this._setEntityRowsRaw(r,{rerender:!0})}_getScopedValue(e,t){if((e==null?void 0:e.type)==="entity"){let r=this._getEntityRawEntries()[e.index];return this._getPathValue(r,this._normalizePath(t))}return this._getPathValue(this._draftConfig,this._getScopedPath(e,t))}_removeScopedValue(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let i=this._withEntityScopeConfig(a=>{var l,o;let s=this._isObject(a[e.index])?{...a[e.index]}:{entity:(o=(l=a[e.index])==null?void 0:l.entity)!=null?o:""};return a[e.index]=this._deletePathValue(s,this._normalizePath(t)),a});return this._applyUserConfig(i,r)}return this._setValueAtPath(this._getScopedPath(e,t),void 0,r)}_applyScopedMutation(e,t,r={}){if((e==null?void 0:e.type)==="entity"){let a=this._withEntityScopeConfig(s=>{var d;let l=s[e.index],o=this._isObject(l)?this._cloneDeep(l):{entity:(d=l==null?void 0:l.entity)!=null?d:""};return s[e.index]=t(o),s});return this._applyUserConfig(a,r)}let i=t(this._cloneDeep(this._draftConfig));return this._applyUserConfig(i,r)}_setScopedValue(e,t,r,i={}){return this._applyScopedMutation(e,a=>this._setPathValue(a,this._normalizePath(t),r),i)}_removePathsFromTarget(e,t=[]){return Pe(e,t)}_pruneEmptyObjectsInTarget(e,t){return G(e,t)}_setCanonicalScopedValue(e,t,r,i={}){let{deprecatedKeys:a=[],prunePaths:s=[]}=i;return this._applyScopedMutation(e,l=>{let o=this._setPathValue(l,this._normalizePath(t),r);return o=this._removePathsFromTarget(o,a),[this._normalizePath(t).slice(0,-1),...s.map(c=>this._normalizePath(c))].forEach(c=>{c.length&&(o=this._pruneEmptyObjectsInTarget(o,c))}),o},i)}_removeCanonicalScopedValue(e,t,r={}){let{deprecatedKeys:i=[],prunePaths:a=[]}=r;return this._applyScopedMutation(e,s=>{let l=this._deletePathValue(s,this._normalizePath(t));return l=this._removePathsFromTarget(l,i),[this._normalizePath(t).slice(0,-1),...a.map(d=>this._normalizePath(d))].forEach(d=>{d.length&&(l=this._pruneEmptyObjectsInTarget(l,d))}),l},r)}_setScopedNumericOverride(e,t,r,i={}){let a=this._normalizeNumberValue(r);return r===""||r===null||r===void 0?this._removeScopedValue(e,t,i):a===null?!1:this._setScopedValue(e,t,a,i)}_setScopedTextOverride(e,t,r,i={}){let a=this._normalizeTextValue(r).trim();return a?this._setScopedValue(e,t,a,i):this._removeScopedValue(e,t,i)}_setCanonicalScopedNumericOverride(e,t,r,i={}){let a=this._normalizeNumberValue(r);return r===""||r===null||r===void 0||a===null?this._removeCanonicalScopedValue(e,t,i):this._setCanonicalScopedValue(e,t,a,i)}_setCanonicalScopedTextOverride(e,t,r,i={}){let a=this._normalizeTextValue(r).trim();return a?this._setCanonicalScopedValue(e,t,a,i):this._removeCanonicalScopedValue(e,t,i)}_getResolvablePartsFromTarget(e,t,r={}){var c,u,h,p,f,b;let i=(c=r.canonicalBasePath)!=null?c:["scale",t],a=(u=r.legacyFixedPath)!=null?u:[t],s=(h=r.legacyEntityPath)!=null?h:[`${t}_entity`],l=this._getPathValue(e,i),o=this._getPathValue(e,a),d=this._getPathValue(e,s);if(l!==void 0){let g=$e(l,(p=r.inheritedSource)!=null?p:null,null,{allowPercent:["target","baseline"].includes(i[0])});return{fixed:(f=g.fixed)!=null?f:"",entity:(b=g.entity)!=null?b:"",...Number.isFinite(g.percent)?{percent:g.percent}:{}}}return{fixed:!this._isObject(o)&&o!==void 0?o:"",entity:d!=null?d:""}}_getResolvableScopedValue(e,t,r={}){let i=(e==null?void 0:e.type)==="entity"?this._getEntityRawEntries()[e.index]:this._draftConfig;return this._getResolvablePartsFromTarget(i!=null?i:{},t,r)}_getEffectiveResolvableScopedValue(e,t,r={}){var l,o;let i=this._getResolvableScopedValue(e,t,r);if((e==null?void 0:e.type)!=="entity")return i;let a=this._getResolvableScopedValue({type:"card"},t,r),s=this._getEntityRawEntries()[e.index];return this._getPathValue(s,(l=r.canonicalBasePath)!=null?l:["scale",t])!==void 0?this._getResolvablePartsFromTarget(s,t,{...r,inheritedSource:{fixed:a.fixed===""?null:a.fixed,entity:a.entity||null,percent:(o=a.percent)!=null?o:null}}):{fixed:this._hasExplicitOverrideValue(i.fixed)?i.fixed:a.fixed,entity:this._hasExplicitOverrideValue(i.entity)?i.entity:a.entity}}_setCanonicalResolvablePart(e,t,r,i,a={}){var u,h,p,f;let s=(u=a.canonicalBasePath)!=null?u:["scale",t],l=(h=a.legacyFixedPath)!=null?h:[t],o=(p=a.legacyEntityPath)!=null?p:[`${t}_entity`],d=(f=a.prunePaths)!=null?f:[s,s.slice(0,-1)],c=r==="fixed"?this._normalizeNumberValue(i):this._normalizeTextValue(i).trim();return this._applyScopedMutation(e,b=>{let _={...this._getResolvablePartsFromTarget(b!=null?b:{},t,{canonicalBasePath:s,legacyFixedPath:l,legacyEntityPath:o})};r==="fixed"?i===""||i===null||i===void 0||c===null?delete _.fixed:_.fixed=c:c?_.entity=c:delete _.entity;let y=this._cloneDeep(b);y=this._deletePathValue(y,o);let m=this._getPathValue(y,l);this._isObject(m)||(y=this._deletePathValue(y,l)),y=this._deletePathValue(y,s);let v=_.fixed!==void 0&&_.fixed!==null&&_.fixed!=="",S=_.entity!==void 0&&_.entity!==null&&_.entity!=="",w=Number.isFinite(_.percent);if(v||S||w){let k={};v&&(k.fixed=_.fixed),S&&(k.entity=_.entity),w&&(k.percent=_.percent),y=this._setPathValue(y,s,k)}return d.forEach(k=>{k.length&&(y=this._pruneEmptyObjectsInTarget(y,k))}),y},a)}_clearCanonicalResolvableValue(e,t,r={}){var o,d,c,u;let i=(o=r.canonicalBasePath)!=null?o:["scale",t],a=(d=r.legacyFixedPath)!=null?d:[t],s=(c=r.legacyEntityPath)!=null?c:[`${t}_entity`],l=(u=r.prunePaths)!=null?u:[i,i.slice(0,-1)];return this._applyScopedMutation(e,h=>{let p=this._deletePathValue(h,i);p=this._deletePathValue(p,s);let f=this._getPathValue(p,a);return this._isObject(f)||(p=this._deletePathValue(p,a)),l.forEach(b=>{b.length&&(p=this._pruneEmptyObjectsInTarget(p,b))}),p},r)}_getScopedDisplayValue(e,t,r=[]){let i=[t,...r];for(let a of i){let s=this._getScopedValue(e,a);if(s!=null&&s!=="")return s}return""}_getEffectiveScopedDisplayValue(...e){return mi(this._createSectionContext(),...e)}_paletteUi(){return{root:()=>this.shadowRoot,render:()=>this._render(),focus:e=>this._queuePostRenderFocus(e)}}_applySectionMutation(e,t,r){var i;return((i=r==null?void 0:r.needleEdit)==null?void 0:i.field)!=="mode"||r.needleEdit.value==="disabled"||(e==null?void 0:e.type)==="entity"&&r.needleEdit.value==="inherit"?this._applyScopedMutation(e,t,r):this._applyScopedMutation(e,a=>{let s=t(a),l=this._getPathValue(s,["baseline","enabled"]),o=this._getResolvablePartsFromTarget(s!=null?s:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]});return(l===!0||l!==!1&&this._hasResolvableOverride(o))&&(s=this._deletePathValue(s,["baseline"])),s},r)}_createSectionContext(){return{read:(e,t)=>this._getScopedValue(e,t),mutate:(e,t,r)=>this._applySectionMutation(e,t,r),source:(e,t,r=!1)=>{if((t==null?void 0:t.type)==="reference-marker")return kt(t.marker);let i=["baseline","target"].includes(t)?{canonicalBasePath:[t,"at"],legacyFixedPath:[t],legacyEntityPath:t==="target"?["target_entity"]:["baseline","at","entity"]}:{};return r?this._getEffectiveResolvableScopedValue(e,t,i):this._getResolvableScopedValue(e,t,i)},setSource:(e,t,r,i)=>(t==null?void 0:t.type)==="reference-marker"?this._referenceMarkersSection._setGenericMarkerSourcePart(e,t.index,r,i):t==="baseline"?this._persistBaselineSourcePart(e,r,i):this._setCanonicalResolvablePart(e,t,r,i,t==="target"?{canonicalBasePath:["target","at"],legacyFixedPath:["target"],legacyEntityPath:["target_entity"],prunePaths:[["target","at"],["target"]]}:{})}}_renderScaleSection(e){return wi(this._createSectionContext(),e)}_renderFormattingSection(e){return Vi(this._createSectionContext(),e)}_getScopedFormattingValue(e,t){return De(this._createSectionContext(),e,t)}_getEffectiveScopedFormattingValue(e,t){return ki(this._createSectionContext(),e,t)}_setScopedFormattingUnit(e,t){return $i(this._createSectionContext(),e,t)}_setScopedFormattingDecimal(e,t){return Mi(this._createSectionContext(),e,t)}_clearFormattingOverride(e){return Ma(this._createSectionContext(),e)}_hasFormattingOverride(e){return Va(this._createSectionContext(),e)}_getScopedLayoutValue(e,t){var r,i,a,s,l,o,d,c,u;return t==="height"?(i=(r=this._getScopedValue(e,["layout","height"]))!=null?r:this._getScopedValue(e,["height"]))!=null?i:"":t==="position"?(s=(a=this._getScopedValue(e,["layout","label","position"]))!=null?a:this._getScopedValue(e,["label_position"]))!=null?s:"":t==="width"?(o=(l=this._getScopedValue(e,["layout","label","width"]))!=null?l:this._getScopedValue(e,["label_width"]))!=null?o:"":t==="hero_size"?(c=(d=this._getScopedValue(e,["layout","hero","size"]))!=null?d:this._getScopedValue(e,["layout","label","hero_size"]))!=null?c:"":t==="value_size"&&(u=this._getScopedValue(e,["layout","hero","value_size"]))!=null?u:""}_getEffectiveScopedLayoutValue(e,t){return t==="height"?this._getEffectiveScopedDisplayValue(e,["layout","height"],[["height"]]):t==="position"?this._getEffectiveScopedDisplayValue(e,["layout","label","position"],[["label_position"]]):t==="width"?this._getEffectiveScopedDisplayValue(e,["layout","label","width"],[["label_width"]]):t==="hero_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","size"],[["layout","label","hero_size"]]):t==="value_size"?this._getEffectiveScopedDisplayValue(e,["layout","hero","value_size"]):""}_setScopedLayoutLabelPosition(e,t){if(!t)return this._removeCanonicalScopedValue(e,["layout","label","position"],{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});let r=this._setCanonicalScopedValue(e,["layout","label","position"],t,{deprecatedKeys:[["label_position"]],prunePaths:[["layout","label"],["layout"]],rerender:!0});return!r||t==="hero"?r:(this._removeCanonicalScopedValue(e,["layout","label","hero_size"],{prunePaths:[["layout","label"],["layout"]],rerender:!0}),this._removeCanonicalScopedValue(e,["layout","hero"],{prunePaths:[["layout"]],rerender:!0}),!0)}_setLayoutLabelPosition(e){return this._setScopedLayoutLabelPosition({type:"card"},e)}_setScopedLayoutHeroSize(e,t){return t?this._setCanonicalScopedValue(e,["layout","hero","size"],t,{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]}):this._removeCanonicalScopedValue(e,["layout","hero","size"],{deprecatedKeys:[["layout","label","hero_size"]],prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroSize(e){return this._setScopedLayoutHeroSize({type:"card"},e)}_normalizeHeroValueSizeValue(e){let t=this._normalizeNumberValue(e);return t===null?null:Math.min(112,Math.max(12,t))}_setScopedLayoutHeroValueSize(e,t){if(t===""||t===null||t===void 0)return this._removeCanonicalScopedValue(e,["layout","hero","value_size"],{prunePaths:[["layout","hero"],["layout"]]});let r=this._normalizeHeroValueSizeValue(t);return r===null?!1:this._setCanonicalScopedValue(e,["layout","hero","value_size"],r,{prunePaths:[["layout","hero"],["layout"]]})}_setLayoutHeroValueSize(e){return this._setScopedLayoutHeroValueSize({type:"card"},e)}_setScopedLayoutHeight(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","height"],{deprecatedKeys:[["height"]],prunePaths:[["layout"]]}):r===null||r<24?!1:this._setCanonicalScopedValue(e,["layout","height"],r,{deprecatedKeys:[["height"]],prunePaths:[["layout"]]})}_setLayoutHeight(e){return this._setScopedLayoutHeight({type:"card"},e)}_setScopedLayoutLabelWidth(e,t){let r=this._normalizeNumberValue(t);return t===""||t===null||t===void 0?this._removeCanonicalScopedValue(e,["layout","label","width"],{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]}):r===null?!1:this._setCanonicalScopedValue(e,["layout","label","width"],r,{deprecatedKeys:[["label_width"]],prunePaths:[["layout","label"],["layout"]]})}_clearLayoutOverride(e){return this._applyScopedMutation(e,t=>{let r=this._deletePathValue(t,["layout","height"]);return r=this._deletePathValue(r,["layout","label","position"]),r=this._deletePathValue(r,["layout","label","hero_size"]),r=this._deletePathValue(r,["layout","label","width"]),r=this._deletePathValue(r,["layout","hero"]),r=this._deletePathValue(r,["height"]),r=this._deletePathValue(r,["label_position"]),r=this._deletePathValue(r,["label_width"]),r=this._pruneEmptyObjectsInTarget(r,["layout","label"]),r=this._pruneEmptyObjectsInTarget(r,["layout"]),r},{rerender:!0})}_hasLayoutOverride(e){var i,a;let t=(i=this._getScopedValue(e,["layout"]))!=null?i:{},r=this._isObject(t)?(a=t.label)!=null?a:{}:{};return this._isObject(t)&&(Object.prototype.hasOwnProperty.call(t,"height")||this._isObject(r)&&(Object.prototype.hasOwnProperty.call(r,"position")||Object.prototype.hasOwnProperty.call(r,"hero_size")||Object.prototype.hasOwnProperty.call(r,"width")))||this._isObject(t)&&this._isObject(t.hero)&&Object.keys(t.hero).length?!0:this._getScopedValue(e,["height"])!==void 0||this._getScopedValue(e,["label_position"])!==void 0||this._getScopedValue(e,["label_width"])!==void 0}_setScaleBound(e,t){return vr(this._createSectionContext(),{type:"card"},e,"fixed",t)}_clearScaleOverride(e){return ka(this._createSectionContext(),e)}_setBarFillStyle(e){return this._setScopedBarFillStyle({type:"card"},e)}_setBarColor(e){return this._setScopedBarColor({type:"card"},e)}_setGradientStops(...e){return this._gradientStopsSection._setGradientStops(...e)}_setSegments(...e){return this._segmentsSection._setSegments(...e)}_getDefaultGradientStops(...e){return this._gradientStopsSection._getDefaultGradientStops(...e)}_normalizeGradientStopPosValue(...e){return this._gradientStopsSection._normalizeGradientStopPosValue(...e)}_sanitizeGradientStopsForEmit(...e){return this._gradientStopsSection._sanitizeGradientStopsForEmit(...e)}_getGradientStopDraftColorDefault(...e){return this._gradientStopsSection._getGradientStopDraftColorDefault(...e)}_getNextSuggestedGradientStopPos(...e){return this._gradientStopsSection._getNextSuggestedGradientStopPos(...e)}_getGradientStopsDraftKey(...e){return this._gradientStopsSection._getGradientStopsDraftKey(...e)}_getGradientStopPosTextKey(...e){return this._gradientStopsSection._getGradientStopPosTextKey(...e)}_getGradientStopPosText(...e){return this._gradientStopsSection._getGradientStopPosText(...e)}_setGradientStopPosText(...e){return this._gradientStopsSection._setGradientStopPosText(...e)}_clearGradientStopPosText(...e){return this._gradientStopsSection._clearGradientStopPosText(...e)}_clearGradientStopScopeTextState(...e){return this._gradientStopsSection._clearGradientStopScopeTextState(...e)}_getGradientStopsUiRows(...e){return this._gradientStopsSection._getGradientStopsUiRows(...e)}_setGradientStopsUiRows(...e){return this._gradientStopsSection._setGradientStopsUiRows(...e)}_getStoredScopedGradientStops(...e){return this._gradientStopsSection._getStoredScopedGradientStops(...e)}_getFallbackGradientStops(...e){return this._gradientStopsSection._getFallbackGradientStops(...e)}_createGradientStopDraftState(...e){return this._gradientStopsSection._createGradientStopDraftState(...e)}_getGradientStopsDraftState(...e){return this._gradientStopsSection._getGradientStopsDraftState(...e)}_setGradientStopsDraftState(...e){return this._gradientStopsSection._setGradientStopsDraftState(...e)}_setGradientStopsDraftField(...e){return this._gradientStopsSection._setGradientStopsDraftField(...e)}_getValidGradientDraftStop(...e){return this._gradientStopsSection._getValidGradientDraftStop(...e)}_hasGradientStopDuplicate(...e){return this._gradientStopsSection._hasGradientStopDuplicate(...e)}_canAddGradientStop(...e){return this._gradientStopsSection._canAddGradientStop(...e)}_getGradientDraftValidationMessage(...e){return this._gradientStopsSection._getGradientDraftValidationMessage(...e)}_isDefaultGradientStops(...e){return this._gradientStopsSection._isDefaultGradientStops(...e)}_setScopedGradientStops(e,t,r={}){var o;let i=this._sanitizeGradientStopsForEmit(t),a=i.length<2||this._isDefaultGradientStops(i),s=this._serializeConfig((o=this._getGradientStopsUiRows(e))!=null?o:[]);this._clearGradientStopScopeTextState(e),this._setGradientStopsUiRows(e,i);let l=this._applyScopedMutation(e,d=>{let c=this._deletePathValue(d,["gradient_stops"]);return c=this._deletePathValue(c,["bar","gradient_stops"]),a||(c=this._setPathValue(c,["bar","gradient_stops"],i)),c=this._pruneEmptyObjectsInTarget(c,["bar"]),c},r);return l===!1&&(r!=null&&r.rerender)&&this._serializeConfig(i)!==s&&this._render(),l!==!1&&!(r!=null&&r.rerender)&&this._refreshGradientDraftUi(e),l}_clearGradientStopsOverride(...e){return this._gradientStopsSection._clearGradientStopsOverride(...e)}_setScopedSegments(e,t,r={}){let i=(r==null?void 0:r.sort)===!1?this._cloneDeep(t):this._sortSegmentsForEditor(t),a=this._getFallbackSegments(e),s=!Array.isArray(i)||!i.length||a.length>0&&this._segmentsEqualForEditor(i,a);this._setSegmentsUiRows(e,i);let l=this._applyScopedMutation(e,o=>{let d=this._deletePathValue(o,["bar","segments"]);return d=this._deletePathValue(d,["segments"]),d=this._deletePathValue(d,["severity"]),s||(d=this._setPathValue(d,["bar","segments"],i)),d=this._pruneEmptyObjectsInTarget(d,["bar"]),d},r);return l!==!1&&this._refreshSegmentUi(e),l}_clearSegmentsOverride(...e){return this._segmentsSection._clearSegmentsOverride(...e)}_setNeedle(...e){return this._needleSection._setNeedle(...e)}_getScopedPeakConfig(...e){return this._extremaSection._getScopedPeakConfig(...e)}_getEffectiveScopedPeakConfig(...e){return this._extremaSection._getEffectiveScopedPeakConfig(...e)}_hasPeakOverride(...e){return this._extremaSection._hasPeakOverride(...e)}_getPeakSummary(...e){return this._extremaSection._getPeakSummary(...e)}_clearPeakOverride(...e){return this._extremaSection._clearPeakOverride(...e)}_setScopedPeakEnabled(...e){return this._extremaSection._setScopedPeakEnabled(...e)}_setScopedPeakColor(...e){return this._extremaSection._setScopedPeakColor(...e)}_getScopedMarkerExtras(...e){return this._extremaSection._getScopedMarkerExtras(...e)}_hasExtremumOverride(...e){return this._extremaSection._hasExtremumOverride(...e)}_getEffectiveMarkerExtras(...e){return this._extremaSection._getEffectiveMarkerExtras(...e)}_getScopedFloorConfig(...e){return this._extremaSection._getScopedFloorConfig(...e)}_getEffectiveScopedFloorConfig(...e){return this._extremaSection._getEffectiveScopedFloorConfig(...e)}_getFloorSummary(...e){return this._extremaSection._getFloorSummary(...e)}_getMarkerResetSummary(...e){return this._extremaSection._getMarkerResetSummary(...e)}_getCardTargetMarkerSummary(...e){return this._targetSection._getCardTargetMarkerSummary(...e)}_setScopedExtremumEnabled(...e){return this._extremaSection._setScopedExtremumEnabled(...e)}_setScopedExtremumColor(...e){return this._extremaSection._setScopedExtremumColor(...e)}_setScopedExtremumReset(...e){return this._extremaSection._setScopedExtremumReset(...e)}_setScopedExtremumLabelShow(...e){return this._extremaSection._setScopedExtremumLabelShow(...e)}_setScopedExtremumLabelDecimal(...e){return this._extremaSection._setScopedExtremumLabelDecimal(...e)}_getBuiltinMarkerLabelOptions(e,t){let r=t==="target"?this._getEffectiveTargetLabelShowValue(e):this._getEffectiveMarkerExtras(e,t).labelShow;return gt(this._createSectionContext(),e,t,r)}_renderBuiltinMarkerLabelControls(e,t,r){return ot(e,t,r,this._getBuiltinMarkerLabelOptions(e,t))}_setBuiltinMarkerLabelField(...e){return yt(this._createSectionContext(),...e)}_clearFloorOverride(...e){return this._extremaSection._clearFloorOverride(...e)}_setFixedMarkerValue(e,t,r){let i=this._normalizeNumberValue(r);return!t||i===null?this._removeCanonicalScopedValue({type:"card"},[e,"at","fixed"],{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]}):this._setCanonicalScopedValue({type:"card"},[e,"at","fixed"],i,{deprecatedKeys:e==="target"?[["target_entity"]]:[],prunePaths:[[e,"at"],[e]]})}_setPeakShow(...e){return this._extremaSection._setPeakShow(...e)}_readFixedMarker(e){let t=this._draftConfig[e];if(this._isObject(t)){let r=this._isObject(t==null?void 0:t.at)?t.at.fixed:t==null?void 0:t.at;return{enabled:r!=null&&r!=="",value:r!=null?r:""}}return{enabled:t!=null&&t!=="",value:t!=null?t:""}}_getGradientStopsValue(...e){return this._gradientStopsSection._getGradientStopsValue(...e)}_getSegmentsValue(...e){return this._segmentsSection._getSegmentsValue(...e)}_getSegmentsScopeKey(...e){return this._segmentsSection._getSegmentsScopeKey(...e)}_getSegmentBoundaryTextKey(...e){return this._segmentsSection._getSegmentBoundaryTextKey(...e)}_getSegmentBoundaryText(...e){return this._segmentsSection._getSegmentBoundaryText(...e)}_setSegmentBoundaryText(...e){return this._segmentsSection._setSegmentBoundaryText(...e)}_clearSegmentBoundaryText(...e){return this._segmentsSection._clearSegmentBoundaryText(...e)}_clearSegmentScopeTextState(...e){return this._segmentsSection._clearSegmentScopeTextState(...e)}_getSegmentsUiRows(...e){return this._segmentsSection._getSegmentsUiRows(...e)}_setSegmentsUiRows(...e){return this._segmentsSection._setSegmentsUiRows(...e)}_getSegmentDraftState(...e){return this._segmentsSection._getSegmentDraftState(...e)}_setSegmentDraftState(...e){return this._segmentsSection._setSegmentDraftState(...e)}_setSegmentDraftField(...e){return this._segmentsSection._setSegmentDraftField(...e)}_isSegmentFillStyle(...e){return this._segmentsSection._isSegmentFillStyle(...e)}_getDefaultSegments(...e){return this._segmentsSection._getDefaultSegments(...e)}_getStoredScopedSegments(...e){return this._segmentsSection._getStoredScopedSegments(...e)}_parseSegmentBoundaryInput(...e){return this._segmentsSection._parseSegmentBoundaryInput(...e)}_formatSegmentBoundaryValue(...e){return this._segmentsSection._formatSegmentBoundaryValue(...e)}_getSegmentDraftColorDefault(...e){return this._segmentsSection._getSegmentDraftColorDefault(...e)}_getNewSegmentDefaults(...e){return this._segmentsSection._getNewSegmentDefaults(...e)}_createSegmentDraftState(...e){return this._segmentsSection._createSegmentDraftState(...e)}_normalizeSegmentForEditorComparison(...e){return this._segmentsSection._normalizeSegmentForEditorComparison(...e)}_segmentsEqualForEditor(...e){return this._segmentsSection._segmentsEqualForEditor(...e)}_getFallbackSegments(...e){return this._segmentsSection._getFallbackSegments(...e)}_parseSegmentBoundaryText(...e){return this._segmentsSection._parseSegmentBoundaryText(...e)}_compareSegmentBoundaries(...e){return this._segmentsSection._compareSegmentBoundaries(...e)}_buildSegmentValidationRows(...e){return this._segmentsSection._buildSegmentValidationRows(...e)}_getSegmentRowValidationMessage(...e){return this._segmentsSection._getSegmentRowValidationMessage(...e)}_getValidSegmentDraft(...e){return this._segmentsSection._getValidSegmentDraft(...e)}_canAddSegment(...e){return this._segmentsSection._canAddSegment(...e)}_getSegmentDraftValidationMessage(...e){return this._segmentsSection._getSegmentDraftValidationMessage(...e)}_getSegmentPreviewBoundaryValue(...e){return this._segmentsSection._getSegmentPreviewBoundaryValue(...e)}_sortSegmentsForEditor(...e){return this._segmentsSection._sortSegmentsForEditor(...e)}_getSegmentPreviewRows(...e){return this._segmentsSection._getSegmentPreviewRows(...e)}_buildEditorSegmentPreviewStyle(...e){return this._segmentsSection._buildEditorSegmentPreviewStyle(...e)}_getSegmentPreviewDomIds(...e){return this._segmentsSection._getSegmentPreviewDomIds(...e)}_renderSegmentPreview(...e){return this._segmentsSection._renderSegmentPreview(...e)}_refreshSegmentPreview(...e){return this._segmentsSection._refreshSegmentPreview(...e)}_getSegmentDomIds(...e){return this._segmentsSection._getSegmentDomIds(...e)}_refreshSegmentUi(...e){return this._segmentsSection._refreshSegmentUi(...e)}_commitSegmentDraft(...e){return this._segmentsSection._commitSegmentDraft(...e)}_commitSegmentBoundaryEdit(...e){return this._segmentsSection._commitSegmentBoundaryEdit(...e)}_commitGradientStopDraft(...e){return this._gradientStopsSection._commitGradientStopDraft(...e)}_getGradientPreviewDomIds(...e){return this._gradientStopsSection._getGradientPreviewDomIds(...e)}_refreshGradientDraftUi(...e){return this._gradientStopsSection._refreshGradientDraftUi(...e)}_commitGradientStopPosEdit(...e){return this._gradientStopsSection._commitGradientStopPosEdit(...e)}_getFillStyleValue(){return Se(this._createSectionContext(),{type:"card"})}_getFillStyleFromColorMode(e){return Ea(e)}_getScopedFillStyleValue(e){return Pa(this._createSectionContext(),e)}_getEffectiveScopedFillStyleValue(e){return Se(this._createSectionContext(),e)}_setScopedBarFillStyle(e,t){return Fi(this._createSectionContext(),e,t)}_getScopedBarColorValue(e){return xr(this._createSectionContext(),e)}_getEffectiveScopedBarColorValue(e){return Ta(this._createSectionContext(),e)}_setScopedBarColor(e,t){return Ei(this._createSectionContext(),e,t)}_getScopedBarSolidFillValue(e){return Xe(this._createSectionContext(),e)}_getEffectiveScopedBarSolidFillValue(e){return Ra(this._createSectionContext(),e)}_setScopedBarSolidFill(e,t){return Pi(this._createSectionContext(),e,t)}_clearEntityBarAppearance(e){return Ca(this._createSectionContext(),e)}_hasEntityBarAppearanceOverride(e){return za(this._createSectionContext(),e)}_getScopedNeedleConfig(...e){return this._needleSection._getScopedNeedleConfig(...e)}_hasNeedleOverride(...e){return this._needleSection._hasNeedleOverride(...e)}_getEffectiveScopedNeedleConfig(...e){return this._needleSection._getEffectiveScopedNeedleConfig(...e)}_setScopedNeedleMode(...e){return this._needleSection._setScopedNeedleMode(...e)}_setScopedNeedleColor(...e){return this._needleSection._setScopedNeedleColor(...e)}_getNeedleValue(...e){return this._needleSection._getNeedleValue(...e)}_getPeakShowValue(...e){return this._extremaSection._getPeakShowValue(...e)}_getScaleFixedValue(e,t){return Si(this._createSectionContext(),e)}_getScaleEntityValue(e){return xi(this._createSectionContext(),e)}_getTargetResolvableValue(...e){return this._targetSection._getTargetResolvableValue(...e)}_getEffectiveTargetResolvableValue(...e){return this._targetSection._getEffectiveTargetResolvableValue(...e)}_getTargetMode(...e){return this._targetSection._getTargetMode(...e)}_getTargetShapeValue(...e){return this._targetSection._getTargetShapeValue(...e)}_getEffectiveMarkerDirection(...e){return Ae(this._createSectionContext(),...e)}_setMarkerDirection(...e){return vt(this._createSectionContext(),...e)}_hasTargetShape(...e){return this._targetSection._hasTargetShape(...e)}_getEffectiveTargetShapeValue(...e){return this._targetSection._getEffectiveTargetShapeValue(...e)}_setTargetShape(...e){return this._targetSection._setTargetShape(...e)}_getEffectiveTargetMode(...e){return this._targetSection._getEffectiveTargetMode(...e)}_setTargetMode(...e){return this._targetSection._setTargetMode(...e)}_setTargetResolvablePart(...e){return this._targetSection._setTargetResolvablePart(...e)}_clearTargetOverride(...e){return this._targetSection._clearTargetOverride(...e)}_getTargetColorValue(...e){return this._targetSection._getTargetColorValue(...e)}_getEffectiveTargetColorValue(...e){return this._targetSection._getEffectiveTargetColorValue(...e)}_hasCustomTargetColor(...e){return this._targetSection._hasCustomTargetColor(...e)}_setTargetColor(...e){return this._targetSection._setTargetColor(...e)}_getTargetLabelShowValue(...e){return this._targetSection._getTargetLabelShowValue(...e)}_getEffectiveTargetLabelShowValue(...e){return this._targetSection._getEffectiveTargetLabelShowValue(...e)}_setTargetLabelShow(...e){return this._targetSection._setTargetLabelShow(...e)}_getTargetLabelDecimalValue(...e){return this._targetSection._getTargetLabelDecimalValue(...e)}_getEffectiveTargetLabelDecimalValue(...e){return this._targetSection._getEffectiveTargetLabelDecimalValue(...e)}_setTargetLabelDecimal(...e){return this._targetSection._setTargetLabelDecimal(...e)}_getTargetAboveFillColorValue(...e){return this._targetSection._getTargetAboveFillColorValue(...e)}_getTargetAboveFillDraftKey(...e){return this._targetSection._getTargetAboveFillDraftKey(...e)}_setTargetAboveFillDraft(...e){return this._targetSection._setTargetAboveFillDraft(...e)}_getTargetAboveFillDraft(...e){return this._targetSection._getTargetAboveFillDraft(...e)}_getBaselineColorDraftKey(...e){return this._baselineSection._getBaselineColorDraftKey(...e)}_setBaselineColorDraft(...e){return this._baselineSection._setBaselineColorDraft(...e)}_getBaselineColorDraft(...e){return this._baselineSection._getBaselineColorDraft(...e)}_getEffectiveTargetAboveFillColorValue(...e){return this._targetSection._getEffectiveTargetAboveFillColorValue(...e)}_setTargetAboveFillColor(...e){return this._targetSection._setTargetAboveFillColor(...e)}_isTargetAboveFillEnabled(...e){return this._targetSection._isTargetAboveFillEnabled(...e)}_setTargetAboveFillEnabled(...e){return this._targetSection._setTargetAboveFillEnabled(...e)}_isBaselineDirectionalColorEnabled(...e){return this._baselineSection._isBaselineDirectionalColorEnabled(...e)}_setBaselineDirectionalColorEnabled(...e){return this._baselineSection._setBaselineDirectionalColorEnabled(...e)}_hasTargetOverride(...e){return this._targetSection._hasTargetOverride(...e)}_getBaselineResolvableValue(...e){return this._baselineSection._getBaselineResolvableValue(...e)}_getEffectiveBaselineResolvableValue(...e){return this._baselineSection._getEffectiveBaselineResolvableValue(...e)}_getBaselineMode(...e){return this._baselineSection._getBaselineMode(...e)}_getEffectiveBaselineMode(...e){return this._baselineSection._getEffectiveBaselineMode(...e)}_setBaselineMode(...e){return this._baselineSection._setBaselineMode(...e)}_persistBaselineSourcePart(e,t,r){let i=t==="fixed"?this._normalizeNumberValue(r):this._normalizeTextValue(r).trim();return this._applyScopedMutation(e,a=>{let l={...this._getResolvablePartsFromTarget(a!=null?a:{},"baseline",{canonicalBasePath:["baseline","at"],legacyFixedPath:["baseline"],legacyEntityPath:["baseline","at","entity"]})};t==="fixed"?r===""||r===null||r===void 0||i===null?delete l.fixed:l.fixed=i:i?l.entity=i:delete l.entity;let o=this._cloneDeep(a);o=this._deletePathValue(o,["baseline","at"]);let d=l.fixed!==void 0&&l.fixed!==null&&l.fixed!=="",c=l.entity!==void 0&&l.entity!==null&&l.entity!=="";if(d||c){let u={};d&&(u.fixed=l.fixed),c&&(u.entity=l.entity),o=this._setPathValue(o,["baseline","at"],u)}return o=this._pruneEmptyObjectsInTarget(o,["baseline","at"]),o=this._pruneEmptyObjectsInTarget(o,["baseline"]),o})}_setBaselineResolvablePart(...e){return this._baselineSection._setBaselineResolvablePart(...e)}_removeScopedNeedle(...e){return this._needleSection._removeScopedNeedle(...e)}_setBaselineDirectionalColor(...e){return this._baselineSection._setBaselineDirectionalColor(...e)}_getBaselineDirectionalColorValue(...e){return this._baselineSection._getBaselineDirectionalColorValue(...e)}_getEffectiveBaselineDirectionalColorValue(...e){return this._baselineSection._getEffectiveBaselineDirectionalColorValue(...e)}_clearBaselineOverride(...e){return this._baselineSection._clearBaselineOverride(...e)}_removeBaseline(...e){return this._baselineSection._removeBaseline(...e)}_hasBaselineOverride(...e){return this._baselineSection._hasBaselineOverride(...e)}_isEntityOverrideExpanded(e){return this._expandedEntityOverrides.has(e)}_toggleEntityOverrideExpanded(e){this._expandedEntityOverrides.has(e)?this._expandedEntityOverrides.delete(e):this._expandedEntityOverrides.add(e),this._render()}_syncExpandedEntityOverrides(e){let t=new Set;this._expandedEntityOverrides.forEach(i=>{i<e&&t.add(i)}),this._expandedEntityOverrides=t;let r=new Set;this._expandedOverrideGroups.forEach(i=>{let[a,s]=String(i).split(":"),l=Number(a);Number.isInteger(l)&&l<e&&s&&r.add(`${l}:${s}`)}),this._expandedOverrideGroups=r}_isCardGroupExpanded(e){return this._expandedCardGroups.has(e)}_toggleCardGroupExpanded(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._render()}_toggleGenericMarkerExpanded(...e){return this._referenceMarkersSection._toggleGenericMarkerExpanded(...e)}_getOverrideGroupKey(e,t){return`${e}:${t}`}_isOverrideGroupExpanded(e,t){return this._expandedOverrideGroups.has(this._getOverrideGroupKey(e,t))}_toggleOverrideGroupExpanded(e,t){let r=this._getOverrideGroupKey(e,t);this._expandedOverrideGroups.has(r)?this._expandedOverrideGroups.delete(r):this._expandedOverrideGroups.add(r),this._render()}_hasExplicitOverrideValue(...e){return fi(...e)}_hasResolvableOverride(...e){return lt(...e)}_getScaleOverrideSummary(e){return qn(this._createSectionContext(),e)}_getLayoutSummary(e){let t=[],r=this._getScopedLayoutValue(e,"height"),i=this._getScopedLayoutValue(e,"position"),a=this._getScopedLayoutValue(e,"width");return r!==""&&t.push(`Height ${r}`),i!==""&&t.push(`${i}`),a!==""&&t.push(`Width ${a}`),t.length?t.join(" \u2022 "):"Inherited"}_getTargetOverrideSummary(...e){return this._targetSection._getTargetOverrideSummary(...e)}_getBaselineOverrideSummary(...e){return this._baselineSection._getBaselineOverrideSummary(...e)}_getCardBaselineSummary(...e){return this._baselineSection._getCardBaselineSummary(...e)}_getBarAppearanceSummary(e){return Hn(this._createSectionContext(),e)}_getScopedSegmentsValue(...e){return this._segmentsSection._getScopedSegmentsValue(...e)}_hasSegmentsOverride(...e){return this._segmentsSection._hasSegmentsOverride(...e)}_getSegmentsSummary(...e){return this._segmentsSection._getSegmentsSummary(...e)}_getEffectiveFillStyleValue(e){return Se(this._createSectionContext(),e)}_getScopedGradientStopsValue(...e){return this._gradientStopsSection._getScopedGradientStopsValue(...e)}_hasGradientStopsOverride(...e){return this._gradientStopsSection._hasGradientStopsOverride(...e)}_getGradientStopsSummary(...e){return this._gradientStopsSection._getGradientStopsSummary(...e)}_buildGradientPreviewEffectiveStops(...e){return this._gradientStopsSection._buildGradientPreviewEffectiveStops(...e)}_buildEditorGradientPreviewStyle(...e){return this._gradientStopsSection._buildEditorGradientPreviewStyle(...e)}_getGradientPreviewStyle(...e){return this._gradientStopsSection._getGradientPreviewStyle(...e)}_renderGradientPreview(...e){return this._gradientStopsSection._renderGradientPreview(...e)}_getNeedleSummary(...e){return this._needleSection._getNeedleSummary(...e)}_getFormattingSummary(e){return Wn(this._createSectionContext(),e)}_renderOverrideGroup({index:e,group:t,title:r,summary:i,content:a}){let s=this._isOverrideGroupExpanded(e,t);return`
      <div class="override-group" data-group="${t}" data-expanded="${s?"true":"false"}">
        <button
          type="button"
          id="entity-${e}-group-${t}"
          class="override-group-toggle"
          data-action="toggle-override-group"
          data-index="${e}"
          data-group="${t}"
          aria-expanded="${s?"true":"false"}"
        >
          <span
            id="entity-${e}-group-${t}-title"
            class="override-group-title"
            data-action="toggle-override-group"
            data-index="${e}"
            data-group="${t}"
          >${s?"\u25BE":"\u25B8"} ${r}</span>
          <span
            id="entity-${e}-group-${t}-summary"
            class="override-group-summary"
            data-action="toggle-override-group"
            data-index="${e}"
            data-group="${t}"
          >${this._escapeAttribute(i)}</span>
        </button>
        <div class="override-group-body" style="display:${s?"grid":"none"};">
          ${a}
        </div>
      </div>
    `}_renderCardGroup(e){return yi(e,this._isCardGroupExpanded(e.group))}_renderEntityInput(e,t){return Un(e,t)}_renderEntitySourceInput(e,t,r,i="sensor.example",a={}){return be(e,t,r,i,a)}_hasMarkersOverride(...e){return this._referenceMarkersSection._hasMarkersOverride(...e)}_getGenericMarkers(...e){return this._referenceMarkersSection._getGenericMarkers(...e)}_getGenericMarkersSummary(...e){return this._referenceMarkersSection._getGenericMarkersSummary(...e)}_getGenericMarkerScopeKey(...e){return this._referenceMarkersSection._getGenericMarkerScopeKey(...e)}_getGenericMarkerUiIds(...e){return this._referenceMarkersSection._getGenericMarkerUiIds(...e)}_resetGenericMarkerUiScope(...e){return this._referenceMarkersSection._resetGenericMarkerUiScope(...e)}_getGenericMarkerSummary(...e){return this._referenceMarkersSection._getGenericMarkerSummary(...e)}_refreshGenericMarkerSummary(...e){return this._referenceMarkersSection._refreshGenericMarkerSummary(...e)}_getGenericMarkerSource(...e){return this._referenceMarkersSection._getGenericMarkerSource(...e)}_renderGenericMarkersEditor(...e){return this._referenceMarkersSection._renderGenericMarkersEditor(...e)}_getGenericMarkerScope(...e){return this._referenceMarkersSection._getGenericMarkerScope(...e)}_setGenericMarkerList(...e){return this._referenceMarkersSection._setGenericMarkerList(...e)}_updateGenericMarker(...e){return this._referenceMarkersSection._updateGenericMarker(...e)}_setGenericMarkerSourceMode(...e){return this._referenceMarkersSection._setGenericMarkerSourceMode(...e)}_setGenericMarkerField(...e){return this._referenceMarkersSection._setGenericMarkerField(...e)}_cleanupGenericMarkersForEmit(e){if(!this._isObject(e)||!Array.isArray(e.markers))return e;let t=this._cloneDeep(e);return t.markers=t.markers.map(r=>{var a;if(!this._isObject(r))return r;let i=this._cloneDeep(r);if(i.show_marker===!0&&delete i.show_marker,this._isObject(i.at)){let s=this._cloneDeep(i.at),l=this._normalizeNumberValue(s.fixed),o=this._normalizeTextValue(s.entity).trim();l!==null?s.fixed=l:delete s.fixed,o?s.entity=o:delete s.entity,Object.keys(s).length?i.at=s:delete i.at}if(i.lane==="below"&&delete i.lane,i.shape==="circle"&&delete i.shape,i.direction==="inward"&&delete i.direction,this._normalizeColorComparisonValue(i.color)===this._normalizeColorComparisonValue("#888888")&&delete i.color,this._isObject(i.label)){let s=this._cloneDeep(i.label);s.show===!1&&delete s.show,s.show_value===!0&&delete s.show_value,s.show_unit===!0&&delete s.show_unit,typeof s.text=="string"&&(s.text=s.text.replace(/\s+/g," ").trim(),s.text||delete s.text);let l=this._normalizeDecimalValue((a=s.precision)!=null?a:s.decimal);delete s.decimal,l===null?delete s.precision:s.precision=l,delete s.unit,Object.keys(s).length?i.label=s:delete i.label}return i}),t}_renderResetOptions(e){return yr(e)}_escapeAttribute(e){return F(e)}_isHexColorValue(e){return Ke(e)}_expandHexColor(e){return gr(e)}_normalizeColorComparisonValue(e){return j(e)}_getColorPickerValue(e,t="#000000"){return we(e,t)}_renderColorInput(e){return K(e)}_renderListRows(e,t){return e.map((r,i)=>t(r,i)).join("")}_render(){var t;if(!this.shadowRoot||this._isRendering)return;let e=this._numericDrafts.captureFocus(this.shadowRoot);this._isRendering=!0;try{let r=this._getEntitiesValue(),i=this._getFillStyleValue(),a=this._getScopedLayoutValue({type:"card"},"position")||"left",s=this._getScopedLayoutValue({type:"card"},"hero_size")||"medium",l=this._getScopedLayoutValue({type:"card"},"value_size"),o=this._getScopedLayoutValue({type:"card"},"height"),d=this._getScopedLayoutValue({type:"card"},"width");this._syncExpandedEntityOverrides(r.length),this.shadowRoot.innerHTML=`
	      <style>${gi}</style>
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
	                ${this._renderListRows(r,(c,u)=>{var h,p;return`
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
	                        <input type="text" data-kind="entity-icon" data-index="${u}" value="${this._escapeAttribute((p=c.icon)!=null?p:"")}" placeholder="mdi:flash" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">
	                      </div>
	                    </div>
	                    <button type="button" class="override-toggle" data-action="toggle-entity-overrides" data-index="${u}" aria-expanded="${this._isEntityOverrideExpanded(u)?"true":"false"}">
	                      ${this._isEntityOverrideExpanded(u)?"\u25BE":"\u25B8"} Overrides
	                    </button>
                    <div class="override-panel" style="display:${this._isEntityOverrideExpanded(u)?"grid":"none"};">
                      <div class="section-note">Overrides replace card defaults only for this entity.</div>
                      ${(()=>{let f={type:"entity",index:u},b=!this._hasTargetOverride(f),g=!this._hasLayoutOverride(f),_=!this._hasPeakOverride(f),y=!this._hasExtremumOverride(f,"floor"),m=this._renderOverrideGroup({index:u,group:"scale",title:"Scale",summary:this._getScaleOverrideSummary(f),content:this._renderScaleSection(f)}),v=this._renderOverrideGroup({index:u,group:"layout",title:"Layout",summary:this._getLayoutSummary(f),content:`
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${u}-layout-inherit" type="checkbox" data-kind="entity-layout-inherit" data-index="${u}"${g?" checked":""}>
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
	                          `}),S=this._renderOverrideGroup({index:u,group:"bar",title:"Bar Appearance",summary:this._getBarAppearanceSummary(f),content:wr(this._createSectionContext(),f)}),w=this._renderOverrideGroup({index:u,group:"needle",title:"Needle",summary:this._getNeedleSummary(f),content:this._needleSection.render(f)}),k=this._renderOverrideGroup({index:u,group:"formatting",title:"Formatting",summary:this._getFormattingSummary(f),content:this._renderFormattingSection(f)}),M=this._renderOverrideGroup({index:u,group:"peak",title:"Peak",summary:this._getPeakSummary(f),content:this._extremaSection.render(f,"peak")}),$=this._renderOverrideGroup({index:u,group:"floor",title:"Floor",summary:this._getFloorSummary(f),content:this._extremaSection.render(f,"floor")}),T=this._renderOverrideGroup({index:u,group:"markers",title:"Reference markers",summary:this._getGenericMarkersSummary(f),content:this._renderGenericMarkersEditor(f)}),B=this._renderOverrideGroup({index:u,group:"segments",title:"Segments",summary:this._getSegmentsSummary(f),content:this._segmentsSection.render(f)}),E=this._renderOverrideGroup({index:u,group:"gradient-stops",title:"Gradient Stops",summary:this._getGradientStopsSummary(f),content:this._gradientStopsSection.render(f)}),z=this._renderOverrideGroup({index:u,group:"baseline",title:"Baseline",summary:this._getBaselineOverrideSummary(f),content:this._baselineSection.render(f)}),C=this._renderOverrideGroup({index:u,group:"target",title:"Target",summary:this._getTargetOverrideSummary(f),content:this._targetSection.render(f)});return`
                          ${m}
                          ${C}
                          ${M}
                          ${$}
                          ${T}
                          ${S}
                          ${z}
                          ${w}
	                          ${B}
	                          ${E}
	                          ${v}
	                          ${k}
	                        `})()}
	                    </div>
                  </div>
                `})}
                <button type="button" data-action="add-entity">Add entity</button>
              </div>
          </div>
	        </div>

${this._renderScaleSection({type:"card"})}

${vi({renderGroup:c=>this._renderCardGroup(c),target:{summary:this._getCardTargetMarkerSummary(),content:this._targetSection.render({type:"card"})},peak:{summary:this._getMarkerResetSummary("peak"),content:this._extremaSection.render({type:"card"},"peak")},floor:{summary:this._getMarkerResetSummary("floor"),content:this._extremaSection.render({type:"card"},"floor")},references:{summary:this._getGenericMarkersSummary({type:"card"}),content:this._renderGenericMarkersEditor({type:"card"})}})}

${wr(this._createSectionContext(),{type:"card"},()=>`${this._baselineSection.render({type:"card"},c=>this._renderCardGroup(c))}${this._needleSection.render({type:"card"})}`)}

${this._segmentsSection.render({type:"card"},c=>this._renderCardGroup(c))}

${this._gradientStopsSection.render({type:"card"},c=>this._renderCardGroup(c))}

	        <div class="section">
	          <div class="section-head">
	            <h3>Layout</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="layout-height">Row height</label>
              <input id="layout-height" type="number" min="24" step="1" data-field="layout-height" value="${this._escapeAttribute(o)}">
            </div>
            <div class="field-row">
              <label for="layout-label-position">Label position</label>
              <select id="layout-label-position" data-field="layout-label-position" value="${this._escapeAttribute(a)}">
                <option value="left"${a==="left"?" selected":""}>left</option>
                <option value="above"${a==="above"?" selected":""}>above</option>
                <option value="inside"${a==="inside"?" selected":""}>inside</option>
                <option value="hero"${a==="hero"?" selected":""}>hero</option>
                <option value="off"${a==="off"?" selected":""}>off</option>
              </select>
            </div>
            ${a==="hero"?`
            <div class="field-row">
              <label for="layout-label-hero-size">Hero size</label>
              <select id="layout-label-hero-size" data-field="layout-label-hero-size" value="${this._escapeAttribute(s)}">
                <option value="small"${s==="small"?" selected":""}>small</option>
                <option value="medium"${s==="medium"?" selected":""}>medium</option>
                <option value="large"${s==="large"?" selected":""}>large</option>
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
    `,this._bindShadowListeners(),this._syncEntityPickers(),this._numericDrafts.apply(this.shadowRoot,e),this._lastRenderedConfigJson=this._serializeConfig(this._draftConfig),this._applyPendingFocus()}finally{this._isRendering=!1}}_bindShadowListeners(){!this.shadowRoot||this._shadowListenersAttached||(this.shadowRoot.addEventListener("click",this._boundHandleClick),this.shadowRoot.addEventListener("change",this._boundHandleChange),this.shadowRoot.addEventListener("input",this._boundHandleInput),this.shadowRoot.addEventListener("value-changed",this._boundHandleValueChanged),this.shadowRoot.addEventListener("keydown",this._boundHandleKeydown),this._shadowListenersAttached=!0)}_syncEntityPickers(){if(!this.shadowRoot)return;let e=this._getEntitiesValue(),t=r=>{var l,o,d,c;let i=r.dataset.kind,a=r.dataset.index,s=Number(a);if(r.hass=this._hass,r.allowCustomEntity=!0,i==="entity-picker"){let u=e[s];r.value=(l=u==null?void 0:u.entity)!=null?l:"",r.label=`Entity ${s+1}`;return}if(i==="scale-min-entity-source"){r.value=this._getScaleEntityValue("min"),r.label="Min entity";return}if(i==="scale-max-entity-source"){r.value=this._getScaleEntityValue("max"),r.label="Max entity";return}if(i==="baseline-entity-source"){r.value=this._getBaselineResolvableValue({type:"card"}).entity,r.label="Baseline entity";return}if(i==="target-entity-source"){r.value=this._getTargetResolvableValue({type:"card"}).entity,r.label="Target entity";return}if(i==="entity-override-min-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:s},"min").entity,r.label=`Entity ${s+1} min entity`;return}if(i==="entity-override-max-entity-source"){r.value=this._getEffectiveResolvableScopedValue({type:"entity",index:s},"max").entity,r.label=`Entity ${s+1} max entity`;return}if(i==="entity-baseline-entity-source"){r.value=this._getEffectiveBaselineResolvableValue({type:"entity",index:s}).entity,r.label=`Entity ${s+1} baseline entity`;return}if(i==="entity-target-entity-source"){r.value=this._getEffectiveTargetResolvableValue({type:"entity",index:s}).entity,r.label=`Entity ${s+1} target entity`;return}if(i==="generic-marker-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(o=this._getGenericMarkerSource(h).entity)!=null?o:"",r.label="Reference marker entity"}if(i==="generic-marker-label-entity"){let u=this._getGenericMarkerScope(r),h=this._getGenericMarkers(u)[Number(r.dataset.markerIndex)];r.value=(c=(d=h==null?void 0:h.label)==null?void 0:d.entity)!=null?c:"",r.label="Label content entity"}};['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{this.shadowRoot.querySelectorAll(r).forEach(t)}),customElements.whenDefined&&customElements.whenDefined("ha-entity-picker").then(()=>{['ha-entity-picker[data-kind="entity-picker"]','ha-entity-picker[data-kind="scale-min-entity-source"]','ha-entity-picker[data-kind="scale-max-entity-source"]','ha-entity-picker[data-kind="baseline-entity-source"]','ha-entity-picker[data-kind="target-entity-source"]','ha-entity-picker[data-kind="entity-override-min-entity-source"]','ha-entity-picker[data-kind="entity-override-max-entity-source"]','ha-entity-picker[data-kind="entity-baseline-entity-source"]','ha-entity-picker[data-kind="entity-target-entity-source"]','ha-entity-picker[data-kind="generic-marker-entity"]','ha-entity-picker[data-kind="generic-marker-label-entity"]'].forEach(r=>{var i;(i=this.shadowRoot)==null||i.querySelectorAll(r).forEach(t)})}).catch(()=>{})}_handleClick(e){var i,a,s,l,o,d;if(this._segmentsSection.handle(e,"click")||this._gradientStopsSection.handle(e,"click"))return;let t=(s=(a=(i=e.target)==null?void 0:i.closest)==null?void 0:a.call(i,"[data-action]"))!=null?s:e.target,r=(l=t==null?void 0:t.dataset)==null?void 0:l.action;if(r&&!(t!=null&&t.disabled)){if(["move-entity-up","move-entity-down","duplicate-entity","remove-entity"].includes(r)&&this._numericDrafts.reset(),r==="add-entity"){let c=[...this._getEntitiesValue(),{entity:""}],u=this._buildEntityConfigEntries(c);if(this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${c.length-1}"], [data-kind="entity-input"][data-index="${c.length-1}"]`),Array.isArray(this._draftConfig.entities)||u.length>1||!this._draftConfig.entity){let h=this._setPathValue(this._draftConfig,["entities"],u);!Array.isArray(this._draftConfig.entities)&&this._draftConfig.entity!==void 0&&(h=this._deletePathValue(h,["entity"]),this._draftConfig.name!==void 0&&(h=this._deletePathValue(h,["name"])),this._draftConfig.icon!==void 0&&(h=this._deletePathValue(h,["icon"]))),this._applyUserConfig(h,{rerender:!0})}else this._setValueAtPath(["entity"],(d=(o=c[0])==null?void 0:o.entity)!=null?d:"",{rerender:!0});return}if(r==="move-entity-up"){this._moveEntityRow(Number(t.dataset.index),-1);return}if(r==="move-entity-down"){this._moveEntityRow(Number(t.dataset.index),1);return}if(r==="duplicate-entity"){let c=Number(t.dataset.index);this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${c+1}"], [data-kind="entity-picker"][data-index="${c+1}"], [data-kind="entity-input"][data-index="${c+1}"]`),this._duplicateEntityRow(c);return}if(r==="toggle-entity-overrides"){this._toggleEntityOverrideExpanded(Number(t.dataset.index));return}if(r==="toggle-override-group"){this._toggleOverrideGroupExpanded(Number(t.dataset.index),t.dataset.group);return}if(r==="toggle-card-group"){this._toggleCardGroupExpanded(t.dataset.group);return}if(r==="remove-entity"){this._removeEntityRow(Number(t.dataset.index));return}this._baselineSection.handleClick(t)||this._referenceMarkersSection.handleClick(t)}}_handleChange(e){var r,i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"change")||this._gradientStopsSection.handle(e,"change"))return;let t=(i=(r=e.target)==null?void 0:r.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleInput(e){var i;if(this._numericDrafts.handle(e,this._isRendering)||this._segmentsSection.handle(e,"input")||this._gradientStopsSection.handle(e,"input"))return;let t=e.target;if(!t||t.tagName==="HA-ENTITY-PICKER"||t.tagName==="INPUT"&&t.type==="checkbox")return;let r=(i=t.dataset)==null?void 0:i.kind;this._handleFieldEvent(e)}_handleValueChanged(e){var t;((t=e.target)==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&this._handleFieldEvent(e)}_handleKeydown(e){this._segmentsSection.handle(e,"keydown")||this._gradientStopsSection.handle(e,"keydown")}_handleFieldEvent(e){var d,c,u,h,p,f,b,g,_,y,m;if(this._segmentsSection.handle(e,"field")||this._gradientStopsSection.handle(e,"field"))return;let t=e.target,r=(d=t==null?void 0:t.dataset)==null?void 0:d.field,i=(c=t==null?void 0:t.dataset)==null?void 0:c.kind,a=r!=null&&r.endsWith("-text-fallback")?r.slice(0,-14):r,s=i!=null&&i.endsWith("-text-fallback")?i.slice(0,-14):i,l=(u=e.detail)==null?void 0:u.value,o=l!=null?l:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if(!this._referenceMarkersSection.handleField({target:t,kind:s,value:o})){if(a==="title")return void this._setTitle(o);if(!Sr(this._createSectionContext(),{field:a,value:o})){if(a==="layout-label-position")return void this._setLayoutLabelPosition(o);if(a==="layout-label-hero-size")return void this._setLayoutHeroSize(o);if(a==="layout-hero-value-size")return void this._setLayoutHeroValueSize(o);if(a==="layout-height")return void this._setLayoutHeight(o);if(a==="layout-label-width")return void this._setScopedLayoutLabelWidth({type:"card"},o);if(!ut(this._createSectionContext(),{field:a,value:o})&&!ht(this._createSectionContext(),{field:a,value:o})&&!(this._needleSection.handleField({field:a,kind:s,index:(h=t.dataset)==null?void 0:h.index,value:o})||this._baselineSection.handleField({field:a,kind:s,index:(p=t.dataset)==null?void 0:p.index,value:o})||this._targetSection.handleField({field:a,kind:s,index:(f=t.dataset)==null?void 0:f.index,value:o})||this._extremaSection.handleField({field:a,kind:s,index:(b=t.dataset)==null?void 0:b.index,value:o}))){if(s==="entity-picker"||s==="entity-input"){let v=Number(t.dataset.index),S=this._getEntitiesValue().map((k,M)=>M===v?{...k,entity:this._normalizeTextValue(o)}:k),w=this._buildEntityConfigEntries(S);Array.isArray(this._draftConfig.entities)||w.length>1||!this._draftConfig.entity?this._setValueAtPath(["entities"],w):this._setValueAtPath(["entity"],(_=(g=S[0])==null?void 0:g.entity)!=null?_:"");return}if(s==="entity-name")return void this._setEntityField(Number(t.dataset.index),"name",o);if(s==="entity-icon")return void this._setEntityField(Number(t.dataset.index),"icon",o);if(!ut(this._createSectionContext(),{kind:s!=null&&s.startsWith("scale-")?s:void 0,value:o})&&!ut(this._createSectionContext(),{kind:s,index:(y=t==null?void 0:t.dataset)==null?void 0:y.index,value:o})){if(s==="entity-override-height")return void this._setScopedLayoutHeight({type:"entity",index:Number(t.dataset.index)},o);if(s==="entity-layout-inherit")return o?void this._clearLayoutOverride({type:"entity",index:Number(t.dataset.index)}):void 0;if(s==="entity-layout-label-position")return void this._setScopedLayoutLabelPosition({type:"entity",index:Number(t.dataset.index)},o);if(s==="entity-layout-label-hero-size")return void this._setScopedLayoutHeroSize({type:"entity",index:Number(t.dataset.index)},o);if(s==="entity-layout-hero-value-size")return void this._setScopedLayoutHeroValueSize({type:"entity",index:Number(t.dataset.index)},o);if(s==="entity-layout-label-width")return void this._setScopedLayoutLabelWidth({type:"entity",index:Number(t.dataset.index)},o);Sr(this._createSectionContext(),{kind:s,index:(m=t==null?void 0:t.dataset)==null?void 0:m.index,value:o})||s==="entity-bar-inherit"&&ht(this._createSectionContext(),{kind:s,index:t.dataset.index,value:o})||ht(this._createSectionContext(),{kind:s,index:t.dataset.index,value:o})}}}}}}});function Ua(n,e={}){let t=e.above?10:0,r=e.below?10:0,i=Math.max(0,n-t-r);return{above:t,below:r,railHeight:i,aboveY:0,belowY:n-9,compactGlyphs:t>0||r>0}}function Jn(n,e,t){let r=[];for(let i of["above","below"]){let a=n.filter(s=>{var l,o;return s.lane===i&&s.visible&&s.labelVisible&&Number.isFinite(s.position)&&((o=(l=s.label)==null?void 0:l.text)==null?void 0:o.trim())}).map(s=>({marker:s,anchor:Math.max(0,Math.min(100,s.position))*e/100})).sort((s,l)=>s.anchor-l.anchor);a.forEach(({marker:s,anchor:l},o)=>{var g;let d=o?(a[o-1].anchor+l)/2+2:0,c=o+1<a.length?(l+a[o+1].anchor)/2-2:e,u=Math.max(0,c-d),h=s.label,p=h.text,f="full",b=t(p)+4;if(b>u&&(p=[h.showValue!==!1?h.number:"",h.showUnit!==!1?h.unit:""].filter(Boolean).join(" "),f="value",b=p?t(p)+4:1/0,!p&&!h.number&&!h.unit)){let _=Array.from((g=h.semanticText)!=null?g:"");for(;_.length>=3;){if(p=`${_.join("").trimEnd()}\u2026`,b=t(p)+4,b<=u){f="text";break}_.pop()}}!p||b>u||e<=0?r.push({id:s.id,lane:i,mode:"hidden",text:"",left:0,width:0}):r.push({id:s.id,lane:i,mode:f,text:p,left:Math.max(d,Math.min(l-b/2,c-b)),width:b})})}return r}var Xn=U(()=>{});function Yn(n,e){return ke(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var zi,Zn=U(()=>{xe();Yi();ea();br();ya();Ni();ir();Wr();ei();Xn();zi=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._extrema={},this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static getConfigElement(){return document.createElement("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!ke(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._requestUpdate()}get hass(){return this._hass}set context(e){this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._requestUpdate()}disconnectedCallback(){this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var a,s,l,o,d,c,u;let e=((a=this._config)==null?void 0:a.entity)||((s=this._context)==null?void 0:s.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._extrema={},this._scaleHistory=null,this._sampleState=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?Qe({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e}]:[]}):null,this._diagnostics=qr(this._normalized));let t=(o=(l=this._hass)==null?void 0:l.states)==null?void 0:o[e],r=null,i=this._config?e?this._hass?t?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured";if(t&&((d=this._normalized)!=null&&d.entities[0])){let h=this._normalized.entities[0],p=J(t.state);if(p!==null&&(t!==this._sampleState||p!==this._sampleValue)){this._sampleState=t,this._sampleValue=p;let f=(c=t.last_updated)!=null?c:t.last_changed,b=f instanceof Date?f.getTime():Date.parse(String(f!=null?f:"")),g=Number.isFinite(b)?b:Date.now();for(let _ of["peak","floor"]){let y=h[`${_}_marker`];y.show&&(this._extrema[_]=Rr(this._extrema[_],p,(u=y.reset)!=null?u:{kind:"never"},_==="peak"?"max":"min",g))}}r=cr({hass:this._hass,entityConfig:h,entityState:t,extrema:this._extrema,previousScale:this._scaleHistory}),this._scaleHistory={min:r.min,max:r.max},r.numericValue===null&&(i=t.state==="unknown"?"Unknown":t.state==="unavailable"?"Unavailable":"Not numeric")}this._row=r,this._status=i,this._render(r,i),this._previousRow=i?null:r}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${Fr}
        ${Er}
        ${Pr('.surface[data-bar-animated="false"]')}
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
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var c,u;this._ensureDom(),typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!t,this._statusEl.hidden=!t,this._statusEl.textContent=t!=null?t:"",this._surface.dataset.state=t?"unavailable":"numeric";let r=(c=e==null?void 0:e.markerLabelLaneOccupancy)!=null?c:{},i=Ua(0,r);ue(this._surface,"--label-above",`${i.above}px`),ue(this._surface,"--label-below",`${i.below}px`),this._syncLabels(e,t);let a=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",s=((u=e==null?void 0:e.markers)!=null?u:[]).filter(h=>h.visible&&(h.showMarker||h.labelVisible)).map(h=>{var b;let p=h.type==="generic"?"Reference marker":`${h.type[0].toUpperCase()}${h.type.slice(1)}`,f=`${Be(h.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${p} at ${f}${h.labelVisible&&((b=h.label)!=null&&b.text)?`; label ${h.label.text}`:""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${a}${this._entity&&a!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:`${a} (${this._entity}): ${e.primaryPresentation.text}. Range ${Be(e.min)} to ${Be(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${s?` ${s}`:""}`),t)return;let l=mr(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});l.animated=l.animated&&!!this._previousRow,this._surface.dataset.barAnimated=l.animated?"true":"false";let o=JSON.stringify(l),d=JSON.stringify([l.baseline.configured,l.needle.configured,l.markers.map(h=>[h.type,h.id])]);d!==this._structureKey?(this._bar.innerHTML=ui(l),this._structureKey=d):o!==this._barRenderKey&&ci(this._bar,l,{revealDuration:li(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=o,this._labelAnimated=l.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var s,l,o;let r=((s=e==null?void 0:e.markers)!=null?s:[]).filter(d=>d.labelVisible),i=new Set(r.map(d=>d.id));for(let[d,c]of this._labelNodes)i.has(d)||(c.remove(),this._labelNodes.delete(d));for(let d of r){if(!this._labelNodes.has(d.id)){let u=document.createElement("span");u.className="compact-marker-label",u.dataset.markerId=d.id,u.hidden=!0,this._labels.append(u),this._labelNodes.set(d.id,u)}let c=this._labelNodes.get(d.id);c.dataset.lane=d.lane,ue(c,"--marker-color",He(d))}if(this._labels.hidden=!!t,!(((l=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:l.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let d=this._labelFonts;d.ready.then(()=>{this._labelFonts===d&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var l,o,d,c;let{width:e,height:t}=this._surface.getBoundingClientRect(),r=Ua(t,(l=this._row)==null?void 0:l.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(r.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let i=Jn((c=(d=this._row)==null?void 0:d.markers)!=null?c:[],e,u=>this._labelMeasure.measureText(u).width),a=JSON.stringify([e,t,r.above,r.below,this._labelMeasure.font,i.map(u=>[u.id,u.lane,u.mode,u.width])]),s=this._labelAnimated&&!this._snapLabels&&a===this._labelLayoutKey;for(let u of this._labelNodes.values())u.hidden=!0;for(let u of i){let h=this._labelNodes.get(u.id);h.hidden=u.mode==="hidden",h.dataset.mode=u.mode,h.textContent!==u.text&&(h.textContent=u.text),ue(h,"transition",s?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),ue(h,"left",`${u.left}px`),ue(h,"width",`${u.width}px`)}this._labelLayoutKey=a,this._snapLabels=!1}}});function $t(n,e){var r,i,a,s,l;let t=(r=n.scale)==null?void 0:r[e];if(t!==void 0){let o=$e(t);return{fixed:(i=o.fixed)!=null?i:"",entity:(a=o.entity)!=null?a:""}}return{fixed:(s=n[e])!=null?s:"",entity:(l=n[`${e}_entity`])!=null?l:""}}function Mt(n,e,t,r,i,a,s=!1){let l=(o,d)=>a?x(o,d):P(o,d,i);if(V(t)){if(r==="fixed"&&a)return x(x(n,[...e,"fixed"]),[...e,"value"]);let o=r==="fixed"&&t.fixed===void 0&&t.value!==void 0?"value":r;return l(n,[...e,o])}if(t!=null){let o=s?Me(t):null,d=ke(t)?"entity":Number.isFinite(o)?"percent":"fixed";return r===d?l(n,e):a?n:P(n,e,{[d]:d==="percent"?o:t,[r]:i})}return a?n:P(n,[...e,r],i)}function Qn(n,e,t,r){var l;let i=t==="fixed"?ne(r):N(r).trim(),a=t==="fixed"?i===null:!i,s=(l=n.scale)==null?void 0:l[e];if(s===void 0&&(n[e]!==void 0||n[`${e}_entity`]!==void 0)){let o=[t==="fixed"?e:`${e}_entity`];return a?x(n,o):P(n,o,i)}return Mt(n,["scale",e],s,t,i,a)}function Vt(n){var r,i;let e=n.baseline;if(!V(e))return{fixed:e!=null?e:"",entity:""};let t=$e(e.at,null,null,{allowPercent:!0});return{fixed:(r=t.fixed)!=null?r:"",entity:(i=t.entity)!=null?i:"",...Number.isFinite(t.percent)?{percent:t.percent}:{}}}function es(n,e,t){var s;if(e==="mode")return rs(n,"baseline",t);if(e==="percent")return is(n,"baseline",t);let r=e==="fixed"?ne(t):N(t).trim(),i=e==="fixed"?r===null:!r,a=n.baseline;if(!V(a)&&a!==void 0&&a!==null){if(e==="fixed")return i?x(n,["baseline"]):P(n,["baseline"],r);if(i)return n;n=P(n,["baseline"],{at:a})}return Mt(n,["baseline","at"],(s=n.baseline)==null?void 0:s.at,e,r,i,!0)}function Ft(n){var t,r,i;let e=n.target;if(V(e)&&e.at!==void 0){let a=$e(e.at,null,null,{allowPercent:!0});return{fixed:(t=a.fixed)!=null?t:"",entity:(r=a.entity)!=null?r:"",...Number.isFinite(a.percent)?{percent:a.percent}:{}}}return{fixed:V(e)?"":e!=null?e:"",entity:(i=n.target_entity)!=null?i:""}}function Oi(n){if(V(n.target))return n;let e=n.target,t=n.target_entity,r=t!==void 0?{...e!=null?{fixed:e}:{},entity:t}:e;return P(n,["target"],r==null?{}:{at:r})}function ts(n,e,t){if(e==="mode")return rs(n,"target",t);if(e==="percent")return is(n,"target",t);let r=e==="fixed"?ne(t):N(t).trim(),i=e==="fixed"?r===null:!r,a=n.target;if((!V(a)||a.at===void 0)&&(a!==void 0&&!V(a)||n.target_entity!==void 0))return e==="entity"?i?x(n,["target_entity"]):P(n,["target_entity"],r):V(a)?i?n:P(n,["target","at"],{entity:n.target_entity,fixed:r}):i?x(n,["target"]):P(n,["target"],r);let s=Mt(n,["target","at"],a==null?void 0:a.at,e,r,i,!0);return e==="entity"&&(s=x(s,["target_entity"])),s}function rs(n,e,t){var o;if(!["fixed","entity","entity-fallback","percent"].includes(t))return n;let i=(e==="target"?Ft:Vt)(n),a=(o=n[e])==null?void 0:o.at,s=e==="target"?Oi(n):V(n.baseline)?n:P(n,["baseline"],{at:n.baseline}),l=V(a)?{...a}:{};for(let d of["fixed","value","entity","percent"])delete l[d];if(t==="percent"){let d=Number.isFinite(i.percent)?i.percent:50;l=V(a)?{...l,percent:d}:`${d}%`}else t!=="entity"&&(l.fixed=i.fixed!==""&&i.fixed!==void 0?i.fixed:50),t!=="fixed"&&(l.entity=i.entity||""),!V(a)&&t==="fixed"&&(l=l.fixed),!V(a)&&t==="entity"&&l.entity&&(l=l.entity);return s=P(s,[e,"at"],l),e==="target"?x(s,["target_entity"]):s}function is(n,e,t){var o,d;let r=t===null,i=dt(t);if(!r&&i===null)return n;let a=(o=n[e])==null?void 0:o.at,s=[e,"at"];if(V(a))return r?x(n,[...s,"percent"]):P(n,[...s,"percent"],i);if(Number.isFinite(Me(a)))return r?x(n,s):P(n,s,`${i}%`);if(r)return n;let l=e==="target"?Oi(n):V(n.baseline)?n:P(n,["baseline"],{at:n.baseline});return Mt(l,s,(d=l[e])==null?void 0:d.at,"percent",i,!1,!0)}var Bi=U(()=>{xe();re();ve()});function qa(n,e){var r;let t=[["bar",e],[e],...e==="segments"?[["severity"]]:[]];return(r=t.find(i=>q(n,i)!==void 0))!=null?r:t[0]}function as(n){var e;return V(n)?Number.isFinite(n.percent)?`${n.percent}%`:(e=n.fixed)!=null?e:n.value:n}function Wa(n,e){let t,r=()=>{let i=n.read({type:"card"},[]),a=q(i,qa(i,e));return a!==void 0?Array.isArray(a)?a:[]:e==="segments"?t._getFallbackSegments({type:"card"}):t._getDefaultGradientStops()};return{patchOnly:!0,autoEnds:e==="segments",cssText:e==="segments",segmentSpace:()=>{var s,l;let i=n.read({type:"card"},[]),a=qa(i,e);return a[0]==="severity"?"percent":a[0]==="bar"&&(l=(s=i.bar)==null?void 0:s.segment_space)!=null?l:null},rows(i,a){return t=a,r().map(s=>{var l;return e==="segments"?{...s,from:as(s==null?void 0:s.from),to:as(s==null?void 0:s.to)}:{...s,pos:(l=a._normalizeGradientStopPosValue(s==null?void 0:s.pos))!=null?l:s==null?void 0:s.pos}})},write(i,a,s,l){if(!l)throw new Error("Feature palette writes require an explicit item operation");let o=n.mutate(i,d=>{let c=qa(d,e),u=[...r()];if(l.type==="edit"){if(l.index<0||l.index>=u.length)return d;let h={...u[l.index],[l.field]:l.value};l.value===void 0&&delete h[l.field],u[l.index]=h}else if(l.type==="add")u.push(D(l.item));else if(l.type==="remove")u.splice(l.index,1);else throw new Error("Unsupported palette operation");return P(d,c,u)});return o!==!1&&l.type!=="edit"&&(e==="segments"?t._clearSegmentScopeTextState(i):t._clearGradientStopScopeTextState(i)),o}}}var ns=U(()=>{re()});function Ha(n){let e=n==null?void 0:n.at;return typeof e=="number"?kt({at:{fixed:e}}):V(e)&&e.fixed===void 0&&e.value!==void 0?kt({at:{...e,fixed:e.value}}):kt(n)}function ss(n,e,t,r){var d;if(!Array.isArray(n.markers)||!n.markers[e])return n;let i=["markers",e,"at"],a=(d=n.markers[e])==null?void 0:d.at,s=t==="entity"?N(r).trim():ne(r),l=t==="entity"?!s:s===null;if(t==="percent")return P(n,i,l?null:`${s}%`);let o=Mt(n.markers[e],["at"],a,t,s,l);return P(n,["markers",e],o)}function ls(n,e){var l;let t=Array.isArray(n.markers)?[...n.markers]:[],{type:r,index:i,path:a,value:s}=e;if(r==="add")t.push({at:{fixed:50}});else{if(i<0||i>=t.length||!Number.isInteger(i))return n;if(r==="remove")t.splice(i,1);else if(r==="move"){let o=i+e.delta;if(o<0||o>=t.length)return n;[t[i],t[o]]=[t[o],t[i]]}else if(r==="field"){let o=s===void 0?x(t[i],a):P(t[i],a,s);a[0]==="label"&&a[1]==="precision"&&(o=x(o,["label","decimal"])),t[i]=a[0]==="label"?G(o,["label"]):o}else if(r==="mode"){let o;if(s==="percent")o="50%";else{let d=Ha(t[i]);o=V((l=t[i])==null?void 0:l.at)?D(t[i].at):{...d.entity?{entity:d.entity}:{},...d.fixed!==""&&d.fixed!==void 0?{fixed:d.fixed}:{}},delete o.percent,s==="fixed"?(delete o.entity,o.fixed===void 0&&o.value===void 0&&(o.fixed=50)):(o.entity||(o.entity=""),s==="entity"&&(delete o.fixed,delete o.value),s==="entity-fallback"&&o.fixed===void 0&&o.value===void 0&&(o.fixed=50))}t[i]=P(t[i],["at"],o)}}return P(n,["markers"],t)}var os=U(()=>{Di();re();Bi()});function ds(n,{key:e,path:t,value:r,field:i}){if(t[0]==="reset"&&r&&!Tr(r))return n;(i==="text"&&!r||r===null||t[0]==="reset"&&!r)&&(r=void 0);let a=r===void 0?x(n,[e,...t]):P(n,[e,...t],r);return i==="precision"&&(a=x(a,[e,"label","decimal"])),e==="peak"&&t[0]==="enabled"&&(a=x(a,["show_peak"]),V(n.peak_marker)&&(a=P(a,["peak_marker","show"],r))),e==="peak"&&t[0]==="color"&&(a=x(a,["peak_color"]),a=x(a,["peak_marker","color"]),a=G(a,["peak_marker"])),G(a,[e,...t.slice(0,-1)])}var cs=U(()=>{re();ir()});function us(n,{path:e,value:t,deprecatedKeys:r=[],field:i}){(i==="text"&&!t||t===null)&&(t=void 0);let a=t===void 0?n:Oi(n);return a=t===void 0?x(a,["target",...e]):P(a,["target",...e],t),a=Pe(a,r),i==="show"&&(a=x(a,["show_target_label"])),i==="precision"&&(a=x(a,["target","label","decimal"])),G(a,["target",...e.slice(0,-1)])}var hs=U(()=>{re();Bi()});function fs(n,{field:e,value:t}){var l;let r=["bar","needle"],i=(l=n.bar)==null?void 0:l.needle;if(e==="mode"){let o=t==="enabled";return i===void 0&&!o?n:P(n,V(i)?[...r,"show"]:r,o)}if(!t||j(t)===j("#ffffff"))return G(x(n,[...r,"color"]),r);let s=V(i)?i:typeof i=="boolean"?{show:i}:{};return P(n,r,{...s,color:t})}function ps(n,{path:e,value:t}){let r=n.baseline;if(!V(r)&&r!==void 0&&r!==null){if(t===void 0)return n;n=P(n,["baseline"],{at:r})}let i=["baseline",...e],a=t===void 0?x(n,i):P(n,i,t);return t===void 0&&(e.length>1&&(a=G(a,["baseline",e[0]])),a=G(a,["baseline"])),a}var ms=U(()=>{re();ve()});var R,Gi,bs=U(()=>{re();ve();Sa();xa();wa();$a();Fa();Ri();Bi();Ba();Ga();ns();Na();Aa();La();ja();Di();os();cs();hs();ms();R={type:"card"},Gi=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._context={},this._chooseEntity=!1,this._renderEpoch=0,this._updateComplete=Promise.resolve(),this._cssColorDrafts=new Map,this._numericDrafts=new ct,this._expandedCardGroups=new Set;let e=this._createSectionContext(),t={cssText:!0,percentSources:!0};this._needleSection=new bt(e,t),this._baselineSection=new _t(e,t),this._targetSection=new St(e,t),this._extremaSection=new xt(e,t);let r={root:()=>this.shadowRoot,render:()=>{this._paletteRenderRequested=!0,this._requestRender()},focus:a=>{this._pendingPaletteFocus=a},hass:()=>this._hass};this._referenceMarkersSection=new wt(e,{root:r.root,render:()=>this._requestRender()},t),this._segmentsSection=new pt(e,r,Wa(e,"segments")),this._gradientStopsSection=new mt(e,r,Wa(e,"gradient_stops"));for(let a of["click","keydown"])this.shadowRoot.addEventListener(a,s=>{var l,o,d,c,u;if(a==="click"){let h=(d=(o=(l=s.target)==null?void 0:l.closest)==null?void 0:o.call(l,"[data-action]"))!=null?d:s.target;if(((c=h==null?void 0:h.dataset)==null?void 0:c.action)==="toggle-card-group"){this._toggleCardGroup(h.dataset.group);return}if(this._baselineSection.handleClick(h)||this._targetSection.handleClick(h)){this._requestRender();return}if(this._referenceMarkersSection.handleClick(h)){if(((u=h==null?void 0:h.dataset)==null?void 0:u.action)==="add-generic-marker"){let p=this._referenceMarkersSection._getGenericMarkers(R);this._pendingReferenceFocusId=this._referenceMarkersSection._getGenericMarkerUiIds(R,p.length).at(-1)}this._requestRender();return}}this._segmentsSection.handle(s)||this._gradientStopsSection.handle(s)});let i=a=>this._handleField(a);for(let a of["input","change","value-changed"])this.shadowRoot.addEventListener(a,i);this.shadowRoot.addEventListener("focusout",a=>{var s,l;(l=(s=a.target)==null?void 0:s.matches)!=null&&l.call(s,"input, select, ha-entity-picker")&&this._requestRender()}),customElements.whenDefined("ha-entity-picker").then(()=>{this.isConnected&&this._requestRender()})}setConfig(e){if(!V(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");ge(e)!==ge(this._config)&&(this._paletteRenderRequested||(this._paletteRenderRequested=["bar.segments","bar.gradient_stops","segments","severity","gradient_stops"].some(t=>ge(q(e,t.split(".")))!==ge(q(this._config,t.split("."))))),this._config=D(e),this._cssColorDrafts.clear(),this._numericDrafts.reset(),this._baselineSection.reset(),this._targetSection.reset(),this._referenceMarkersSection.reset(),this._segmentsSection.reset(),this._gradientStopsSection.reset(),this._chooseEntity=!1,this._configReplaced=!0),this._requestRender()}set hass(e){this._hass=e,this._requestRender()}get hass(){return this._hass}set context(e){this._context=e!=null?e:{},this._requestRender()}get context(){return this._context}get updateComplete(){return this._updateComplete}get _explicitEntity(){return typeof this._config.entity=="string"?this._config.entity.trim():""}get _effectiveEntity(){return this._explicitEntity||this._context.entity_id||""}get _showEntityPicker(){return!!this._explicitEntity||this._chooseEntity||!this._context.entity_id}connectedCallback(){this._requestRender()}disconnectedCallback(){this._renderEpoch+=1,this._renderScheduled=!1}_requestRender(){if(this._renderScheduled)return;this._renderScheduled=!0;let e=this._renderEpoch;this._updateComplete=Promise.resolve().then(()=>{e===this._renderEpoch&&(this._renderScheduled=!1,this._render())})}_createSectionContext(){return{read:(e,t)=>q(this._config,t),mutate:(e,t,r)=>this._mutate(i=>{var a,s,l,o;return r!=null&&r.referenceMarkerEdit?ls(i,r.referenceMarkerEdit):r!=null&&r.needleEdit?fs(i,r.needleEdit):r!=null&&r.baselineEdit?ps(i,r.baselineEdit):r!=null&&r.targetEdit||((a=r==null?void 0:r.markerEdit)==null?void 0:a.key)==="target"?us(i,(s=r.targetEdit)!=null?s:r.markerEdit):r!=null&&r.extremumEdit||["peak","floor"].includes((l=r==null?void 0:r.markerEdit)==null?void 0:l.key)?ds(i,(o=r.extremumEdit)!=null?o:r.markerEdit):t(i)}),source:(e,t)=>(t==null?void 0:t.type)==="reference-marker"?Ha(t.marker):t==="baseline"?Vt(this._config):t==="target"?Ft(this._config):$t(this._config,t),setSource:(e,t,r,i)=>this._mutate(a=>(t==null?void 0:t.type)==="reference-marker"?ss(a,t.index,r,i):t==="baseline"?es(a,r,i):t==="target"?ts(a,r,i):Qn(a,t,r,i))}}_mutate(e){var r,i,a,s,l,o,d,c;let t=e(this._config);if(ge(t)===ge(this._config))return!1;if(((i=(r=t.bar)==null?void 0:r.segments)==null?void 0:i.length)!==((s=(a=this._config.bar)==null?void 0:a.segments)==null?void 0:s.length)||((l=t.segments)==null?void 0:l.length)!==((o=this._config.segments)==null?void 0:o.length)||((d=t.severity)==null?void 0:d.length)!==((c=this._config.severity)==null?void 0:c.length))for(let u of this._cssColorDrafts.keys())u.startsWith("segment-")&&this._cssColorDrafts.delete(u);return this._config=t,this._requestRender(),this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:D(t)}})),!0}_handleField(e){var l,o,d,c,u,h,p,f,b,g;let t=e.target;if(this._configReplaced||(t==null?void 0:t.isConnected)===!1||(t==null?void 0:t.tagName)==="HA-ENTITY-PICKER"&&e.type!=="value-changed"||this._numericDrafts.handle(e,this._isRendering))return;let r=(o=(l=t==null?void 0:t.dataset)==null?void 0:l.field)==null?void 0:o.replace(/-text-fallback$/,""),i=(c=(d=t==null?void 0:t.dataset)==null?void 0:d.kind)==null?void 0:c.replace(/-text-fallback$/,""),a=e.type==="value-changed"?(u=e.detail)==null?void 0:u.value:(t==null?void 0:t.type)==="checkbox"?t.checked:t==null?void 0:t.value;if((t==null?void 0:t.type)==="color"&&this._cssColorDrafts.delete(`${t.id}-text-fallback`),((h=t==null?void 0:t.dataset)==null?void 0:h.cssColor)==="true"){let _=!a.trim()||CSS.supports("color",a);if((p=t.setCustomValidity)==null||p.call(t,_?"":"Enter a valid CSS color."),t.setAttribute("aria-invalid",_?"false":"true"),_?this._cssColorDrafts.delete(t.id):this._cssColorDrafts.set(t.id,a),!_&&i!=="segment-draft-color")return}if(r==="feature-entity-override"){this._chooseEntity=!!a,a||this._mutate(_=>x(_,["entity"])),this._requestRender();return}if(i==="feature-entity-source"){let _=typeof a=="string"?a.trim():"";this._chooseEntity=!1,this._mutate(y=>_?P(y,["entity"],_):x(y,["entity"])),this._requestRender();return}if(i!=null&&i.startsWith("generic-marker-")){let _=(g=(b=(f=t.closest)==null?void 0:f.call(t,".generic-marker-item"))==null?void 0:b.dataset)==null?void 0:g.markerUiId,y=this._referenceMarkersSection._getGenericMarkerUiIds(R,this._referenceMarkersSection._getGenericMarkers(R).length);if(_&&_!==y[Number(t.dataset.markerIndex)])return}if(this._referenceMarkersSection.handleField({target:t,kind:i,value:a}))return;if(this._segmentsSection.handle(e)||this._gradientStopsSection.handle(e)){this._requestRender();return}if(this._needleSection.handleField({field:r,kind:i,value:a})||this._baselineSection.handleField({field:r,kind:i,value:a})||this._targetSection.handleField({field:r,kind:i,value:a})||this._extremaSection.handleField({field:r,kind:i,value:a}))return;let s=this._createSectionContext();ut(s,{field:r,kind:i,value:a})||Sr(s,{field:r,kind:i,value:a})||ht(s,{field:r,kind:i,value:a},{animation:!0,cssText:!0})}_entityDescription(){return this._explicitEntity?`Using explicit entity: ${this._explicitEntity}`:this._context.entity_id?`Using parent card entity: ${this._context.entity_id}`:"An entity is required. Select an entity below."}_renderEntitySection(){return`<div class="section">
      <div class="section-head"><h3>Entities</h3></div>
      <div id="feature-entity-status" class="section-note" role="status">${F(this._entityDescription())}</div>
      ${this._context.entity_id||this._explicitEntity?`<div class="toggle">
        <input id="feature-entity-override" type="checkbox" data-field="feature-entity-override"${this._explicitEntity||this._chooseEntity?" checked":""}>
        <label for="feature-entity-override">Use explicit entity</label>
      </div>`:""}
      ${this._showEntityPicker?`<div class="field-row">
        <label for="feature-entity">Entity override</label>
        ${be("feature-entity-source","feature",this._explicitEntity)}
      </div>`:""}
    </div>`}_renderCardGroup(e){return yi(e,this._expandedCardGroups.has(e.group))}_toggleCardGroup(e){this._expandedCardGroups.has(e)?this._expandedCardGroups.delete(e):this._expandedCardGroups.add(e),this._syncDisclosures()}_syncDisclosures(){var t;let e={"marker-target":this._targetSection._getCardTargetMarkerSummary(),"marker-peak":this._extremaSection._getMarkerResetSummary("peak"),"marker-floor":this._extremaSection._getMarkerResetSummary("floor"),"generic-markers":this._referenceMarkersSection._getGenericMarkersSummary(R),baseline:this._baselineSection._getCardBaselineSummary(),segments:this._segmentsSection._getSegmentsSummary(R),"gradient-stops":this._gradientStopsSection._getGradientStopsSummary(R)};for(let[r,i]of Object.entries(e)){let a=this.shadowRoot.querySelector(`#card-group-${r}`),s=(t=a==null?void 0:a.closest)==null?void 0:t.call(a,".override-group"),l=this._expandedCardGroups.has(r);a==null||a.setAttribute("aria-expanded",String(l)),s==null||s.setAttribute("data-expanded",String(l));let o=this.shadowRoot.querySelector(`#card-group-${r}-title`);o!=null&&o.textContent&&(o.textContent=`${l?"\u25BE":"\u25B8"} ${o.textContent.slice(2)}`);let d=this.shadowRoot.querySelector(`#card-group-${r}-summary`);d&&(d.textContent=i);let c=s==null?void 0:s.querySelector(".override-group-body");c&&(c.style.display=l?"grid":"none")}for(let r of this.shadowRoot.querySelectorAll(".generic-marker-item")){let i=this._referenceMarkersSection._expandedGenericMarkerUiIds.has(r.dataset.markerUiId);r.setAttribute("data-expanded",String(i)),r.querySelector(".generic-marker-toggle").setAttribute("aria-expanded",String(i)),r.querySelector(".generic-marker-body").style.display=i?"grid":"none"}}_captureFocus(){var s,l,o,d,c;let e=this.shadowRoot.activeElement;if(!e)return null;let t=(o=(l=(s=e.closest)==null?void 0:s.call(e,".generic-marker-item"))==null?void 0:l.dataset)==null?void 0:o.markerUiId,r=e.id?`#${e.id}`:e.dataset.field?`[data-field="${e.dataset.field}"]`:e.dataset.kind?`[data-kind="${e.dataset.kind}"]`:t&&e.dataset.action?`.generic-marker-item[data-marker-ui-id="${t}"] [data-action="${e.dataset.action}"]`:e.dataset.action?`[data-action="${e.dataset.action}"]`:null,i=(c=(d=e.dataset.segmentIndex)!=null?d:e.dataset.stopIndex)!=null?c:e.dataset.index,a=r&&e.dataset.kind&&i!==void 0?`${r}[data-${e.dataset.segmentIndex!==void 0?"segment-index":e.dataset.stopIndex!==void 0?"stop-index":"index"}="${i}"]`:r;return a?{selector:a,start:e.selectionStart,end:e.selectionEnd}:null}_render(){var h,p,f,b,g,_,y,m,v,S;let e=Se(this._createSectionContext(),R),t=this._segmentsSection._getScopedSegmentsValue(R),r=this._gradientStopsSection._getScopedGradientStopsValue(R),i=this._referenceMarkersSection._getGenericMarkers(R),a=this._referenceMarkersSection._getGenericMarkerUiIds(R,i.length),s=JSON.stringify(i.map((w,k)=>[a[k],this._referenceMarkersSection._getGenericMarkerSource(w).mode])),l=JSON.stringify([!!(this._context.entity_id||this._explicitEntity),this._showEntityPicker,e,t.length,r.length,!Ke(this._gradientStopsSection._getGradientStopsDraftState(R).color),...r.map(w=>!Ke(w.color)),!!customElements.get("ha-entity-picker")]),o=(p=(h=this.shadowRoot.activeElement)==null?void 0:h.dataset)==null?void 0:p.field,d=(b=(f=this.shadowRoot.activeElement)==null?void 0:f.dataset)==null?void 0:b.kind,c=(d==null?void 0:d.endsWith("-text-fallback"))||(o==null?void 0:o.endsWith("-text-fallback"))||o==="feature-entity-override"&&!this._context.entity_id&&!this._explicitEntity||((_=(g=this.shadowRoot.activeElement)==null?void 0:g.validity)==null?void 0:_.badInput)&&this._numericDrafts.captureFocus(this.shadowRoot),u=!1;if(s!==this._referenceStructureSignature&&!c){this._isRendering=!0;try{u=!this._referenceMarkersSection.syncStructure(R)}finally{this._isRendering=!1}}if((l!==this._structureSignature||this._paletteRenderRequested||u)&&!c){let w=this._captureFocus(),k=this._createSectionContext();this._isRendering=!0;try{this.shadowRoot.innerHTML=`<style>${gi}
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
        ${wi(k,R)}
        ${vi({renderGroup:$=>this._renderCardGroup($),target:{summary:this._targetSection._getCardTargetMarkerSummary(),content:this._targetSection.render(R)},peak:{summary:this._extremaSection._getMarkerResetSummary("peak"),content:this._extremaSection.render(R,"peak")},floor:{summary:this._extremaSection._getMarkerResetSummary("floor"),content:this._extremaSection.render(R,"floor")},references:{summary:this._referenceMarkersSection._getGenericMarkersSummary(R),content:this._referenceMarkersSection.render(R)}})}
        ${wr(k,R,()=>`${this._baselineSection.render(R,$=>this._renderCardGroup($))}${this._needleSection.render(R)}`,{animation:!0,cssText:!0})}
        ${this._segmentsSection.render(R,$=>this._renderCardGroup($))}
        ${this._gradientStopsSection.render(R,$=>this._renderCardGroup($))}
        ${Vi(k,R)}
      </div>`}finally{this._isRendering=!1}this._structureSignature=l,this._paletteRenderRequested=!1,this._syncControls();let M=w&&this.shadowRoot.querySelector(w.selector);(y=M==null?void 0:M.focus)==null||y.call(M,{preventScroll:!0}),(M==null?void 0:M.type)==="text"&&w.start!=null&&((m=M.setSelectionRange)==null||m.call(M,w.start,w.end))}else this._syncControls();if(c||(this._referenceStructureSignature=s),this._pendingPaletteFocus&&((S=(v=this.shadowRoot.querySelector(this._pendingPaletteFocus))==null?void 0:v.focus)==null||S.call(v,{preventScroll:!0}),this._pendingPaletteFocus=null),this._pendingReferenceFocusId){let w=this.shadowRoot.querySelector(`.generic-marker-item[data-marker-ui-id="${this._pendingReferenceFocusId}"] .generic-marker-toggle`);w==null||w.focus({preventScroll:!0}),w==null||w.scrollIntoView({block:"nearest",inline:"nearest"}),this._pendingReferenceFocusId=null}this._configReplaced=!1}_syncControls(){var d,c,u,h,p,f,b,g,_,y;let e=this._createSectionContext(),t=xr(e,R),r={"scale-min":$t(this._config,"min").fixed,"scale-max":$t(this._config,"max").fixed,"bar-fill-style":Se(e,R),"bar-color":we(t,"#4a9eff"),"bar-color-text-fallback":t,"bar-needle-mode":this._needleSection._getScopedNeedleConfig(R).mode,"bar-needle-color":we(this._needleSection._getScopedNeedleConfig(R).color,"#ffffff"),"bar-needle-color-text-fallback":this._needleSection._getScopedNeedleConfig(R).color,"baseline-mode":this._baselineSection._getBaselineMode(R),"baseline-value":Vt(this._config).fixed,"baseline-source-mode":this._baselineSection._getSourceMode(),"baseline-percent":(c=(d=this._baselineSection._percentageDraft)!=null?d:Vt(this._config).percent)!=null?c:"","baseline-above-color":we(this._baselineSection._getBaselineDirectionalColorValue(R,"above"),"#000000"),"baseline-above-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(R,"above"),"baseline-below-color":we(this._baselineSection._getBaselineDirectionalColorValue(R,"below"),"#000000"),"baseline-below-color-text-fallback":this._baselineSection._getBaselineDirectionalColorValue(R,"below"),"target-mode":this._targetSection._getTargetMode(R),"target-value":Ft(this._config).fixed,"target-source-mode":this._targetSection._getSourceMode(),"target-percent":(h=(u=this._targetSection._percentageDraft)!=null?u:Ft(this._config).percent)!=null?h:"","target-shape":this._targetSection._getEffectiveTargetShapeValue(R),"target-direction":this._targetSection._getEffectiveMarkerDirection(R,"target"),"target-color":we(this._targetSection._getTargetColorValue(R),"#888"),"target-color-text-fallback":this._targetSection._getTargetColorValue(R),"target-above-fill-color":we(this._targetSection._getTargetAboveFillColorValue(R),"#000000"),"target-above-fill-color-text-fallback":this._targetSection._getTargetAboveFillColorValue(R),"target-label-text":this._targetSection._getBuiltinMarkerLabelOptions(R,"target").text,"target-label-precision":this._targetSection._getBuiltinMarkerLabelOptions(R,"target").precision,"formatting-unit":De(e,R,"unit"),"formatting-decimal":De(e,R,"decimal")};for(let m of["peak","floor"]){let v=this._extremaSection._getMarkerConfig(R,m),S=this._extremaSection._getBuiltinMarkerLabelOptions(R,m);Object.assign(r,{[`${m}-color`]:we(v.color,"#888888"),[`${m}-color-text-fallback`]:v.color,[`${m}-reset`]:this._extremaSection._getEffectiveMarkerExtras(R,m).reset,[`${m}-direction`]:this._extremaSection._getEffectiveMarkerDirection(R,m),[`${m}-label-text`]:S.text,[`${m}-label-precision`]:S.precision});for(let[w,k]of[["show",v.mode==="enabled"],["label-show",S.show],["label-show-value",S.showValue],["label-show-unit",S.showUnit]]){let M=this.shadowRoot.querySelector(`#${m}-${w}`);M&&(M.checked=k)}}for(let[m,v]of Object.entries(r)){let S=this.shadowRoot.querySelector(`[data-field="${m}"]`);S&&(S!==this.shadowRoot.activeElement||this._configReplaced)&&(S.value=String(v)),m==="bar-color-text-fallback"&&(S==null||S.setAttribute("aria-label","Bar color (CSS value)"))}for(let m of[this._segmentsSection,this._gradientStopsSection]){let v=m===this._segmentsSection,S=v?m._getScopedSegmentsValue(R):m._getScopedGradientStopsValue(R);for(let w of v?["from","to","color","color-text-fallback"]:["pos","color"])for(let k of this.shadowRoot.querySelectorAll(`input[data-kind="${v?"segment":"gradient"}-${w}"]`)){let M=Number(k.dataset.index),$=S[M],T=v&&!w.startsWith("color")?m._getSegmentBoundaryText(R,M,w,$==null?void 0:$[w]):!v&&w==="pos"?m._getGradientStopPosText(R,M,(p=$==null?void 0:$.pos)!=null?p:""):$==null?void 0:$.color;(k!==this.shadowRoot.activeElement||this._configReplaced)&&(k.value=v&&k.type==="color"?we(T,"#4a9eff"):T!=null?T:"")}if(v||this._configReplaced){let w=v?m._getSegmentDraftState(R):m._getGradientStopsDraftState(R);for(let k of Object.keys(w))for(let M of["","-text-fallback"])for(let $ of this.shadowRoot.querySelectorAll(`input[data-kind="${v?"segment":"gradient"}-draft-${k}${M}"]`))($!==this.shadowRoot.activeElement||this._configReplaced)&&($.value=k==="color"&&$.type==="color"?we(w[k],"#4CAF50"):w[k])}v?m._refreshSegmentUi(R):(f=this.shadowRoot.querySelector("#gradient-draft-pos"))!=null&&f.closest&&m._refreshGradientDraftUi(R)}for(let m of["above","below"]){let v=this.shadowRoot.querySelector(`#baseline-${m}-color-enabled`);v&&(v.checked=this._baselineSection._isBaselineDirectionalColorEnabled(R,m))}this._referenceMarkersSection.syncControls(this._hass,this._configReplaced);let i=this._targetSection._getBuiltinMarkerLabelOptions(R,"target");for(let[m,v]of[["target-label-show",i.show],["target-label-show-value",i.showValue],["target-label-show-unit",i.showUnit],["target-above-fill-enabled",this._targetSection._isTargetAboveFillEnabled(R)]]){let S=this.shadowRoot.querySelector(`#${m}`);S&&(S.checked=v)}let a=this.shadowRoot.querySelector("#bar-solid-fill");a&&(a.checked=Xe(e,R));let s=this.shadowRoot.querySelector("#bar-animated");s&&(s.checked=Da(e,R));let l=this.shadowRoot.querySelector("#feature-entity-override");l&&(l.checked=!!this._explicitEntity||this._chooseEntity);let o=this.shadowRoot.querySelector("#feature-entity-status");o&&(o.textContent=this._entityDescription());for(let[m,v,S,w]of[["feature-entity-source",this._explicitEntity,"Entity override","feature-entity"],["scale-min-entity-source",$t(this._config,"min").entity,"Min entity","feature-scale-min-entity"],["baseline-entity-source",Vt(this._config).entity,"Baseline entity","feature-baseline-entity"],["target-entity-source",Ft(this._config).entity,"Target entity","feature-target-entity"],["scale-max-entity-source",$t(this._config,"max").entity,"Max entity","feature-scale-max-entity"]])for(let k of["input","ha-entity-picker"])for(let M of this.shadowRoot.querySelectorAll(`${k}[data-kind="${m}"]`))M.id=w,M.setAttribute("aria-label",S),m==="feature-entity-source"&&(M.setAttribute("aria-describedby","feature-entity-status"),M.setAttribute("aria-required",this._effectiveEntity?"false":"true")),(M!==this.shadowRoot.activeElement||this._configReplaced)&&(M.value=v),k==="ha-entity-picker"&&(M.hass=this._hass,M.label=S,M.allowCustomEntity=!0);this._syncDisclosures(),this._numericDrafts.apply(this.shadowRoot);for(let m of this.shadowRoot.querySelectorAll('input[data-css-color="true"]')){let v=this._cssColorDrafts.get(m.id);v!==void 0&&(m.value=v),m.setAttribute("aria-invalid",v===void 0?"false":"true"),(b=m.setCustomValidity)==null||b.call(m,v===void 0?"":"Enter a valid CSS color.");let S=(y=(_=(g=this.shadowRoot.querySelector(`#${m.id.replace(/-text-fallback$/,"")}`))==null?void 0:g.labels)==null?void 0:_[0])==null?void 0:y.textContent;S&&m.setAttribute("aria-label",`${S} (CSS value)`)}}}});var Ys=Ss(()=>{An();Kn();Zn();bs();for(let[n,e]of[["sensor-bar-card-plus",hi],["sensor-bar-card-plus-editor",Ci],["sensor-bar-card-plus-feature",zi],["sensor-bar-card-plus-feature-editor",Gi]])customElements.get(n)||customElements.define(n,e);window.customCards=window.customCards||[];window.customCards.some(n=>n.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(n=>n.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:Yn,configurable:!0})});Ys();})();
