var H=(i,e,t)=>()=>{if(t)throw t[0];try{return i&&(e=i(i=0)),e}catch(r){throw t=[r],r}};var $n=(i,e)=>()=>{try{return e||i((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};function Ra(i,e){Dr=[i,e]}function Vr(){if(!Dr||An.some((i,e)=>customElements.get(i)!==Dr[e]))throw new Error(qr);if(ct&&dt.some((i,e)=>customElements.get(i)!==ct[e]))throw new Error(qr)}async function Pn(){if(!xa)throw new Error("Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.");let i=new URL(Fn,import.meta.url);i.searchParams.set("sbcp_build",In),Ma++&&i.searchParams.set("sbcp_retry","1");let e;try{e=await import(i.href)}catch(r){throw new Error(Tn)}if(e.buildIdentity!==xa)throw new Error(ka);Vr();let t=[e.SensorBarCardPlusEditor,e.SensorBarCardPlusFeatureEditor];if(t.some(r=>typeof r!="function"||!(r.prototype instanceof HTMLElement))||t[0]===t[1])throw new Error(ka);if(dt.some((r,a)=>{let n=customElements.get(r);return n&&(!ct||n!==ct[a]||n!==t[a])}))throw new Error(qr);for(let r=0;r<dt.length;r++)customElements.get(dt[r])||customElements.define(dt[r],t[r]);ct=t}async function Dt(i){if(Vr(),!qt){if(Ma>=2)throw Sa;qt=Pn().catch(e=>{throw Sa=e,qt=void 0,e})}return await qt,Vr(),document.createElement(i)}var xa,Fn,In,dt,An,ka,qr,Tn,Dr,ct,qt,Ma,Sa,Vt=H(()=>{xa="448c71962e19eeb64371eafdc4211223f544dc9f4fc931842d3bf03584b7c8cf",Fn="./sensor-bar-card-plus-editor.js",In="7092e354f4ade6258a84f3dcc7e0a5930327454adf9b2027d85adacb65f5a5f3",dt=["sensor-bar-card-plus-editor","sensor-bar-card-plus-feature-editor"],An=["sensor-bar-card-plus","sensor-bar-card-plus-feature"],ka="Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.",qr="Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.",Tn="Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.",Ma=0});function Bt(i){return`
        ${i} .bar-fill-reveal,
        ${i} .needle-marker,
        ${i} .target-marker,
        ${i} .peak-marker,
        ${i} .floor-marker,
        ${i} .generic-marker,
        ${i} .baseline-indicator {
          transition: none;
        }
`}var Lt,Ot,Lr=H(()=>{Lt=`
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
`,Ot=`
        :is(.peak-marker, .floor-marker)[data-history-status="partial"]::after,
        :is(.peak-marker, .floor-marker)[data-history-status="stale"]::after {
          position: absolute; left: 6px; top: 2px; color: var(--marker-color);
          background: var(--card-background-color, #fff); border-radius: 2px;
          font: bold 10px/1 sans-serif; pointer-events: none;
        }
        :is(.peak-marker, .floor-marker)[data-history-edge="end"]::after { left: -12px; }
        .floor-marker[data-history-status]::after { top: auto; bottom: 2px; }
        :is(.peak-marker, .floor-marker)[data-history-status="partial"]::after { content: '!'; }
        :is(.peak-marker, .floor-marker)[data-history-status="stale"]::after { content: '~'; }
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

`});function Na(i){if(typeof i!="string")return!1;let e=i.trim().toLowerCase();if(e==="never"||zn.has(e))return!0;let t=e.match(/^(\d+)(m|h)$/);if(!t)return!1;let r=Number(t[1]);return Number.isInteger(r)&&r>=1&&(t[2]==="m"?r<=59:r<=23)}var zn,$a=H(()=>{zn=new Set(["quarterly","hourly","daily","weekly","monthly","yearly"])});function Fa(i,e){var t=e[typeof i=="string"?i.toUpperCase():i];return typeof t=="number"?t:1}function Ia(i,e,t){if(i){var r=i.toLowerCase().split(/[-_]/),a=r[0],n=a,s;if(r[1]&&r[1].length===4?(n+="_"+r[1],s=r[2]):s=r[1],s||(s=e[n]||e[a]),s)return Fa(s.match(/^\d+$/)?Number(s):s,t)}return 1}var Aa=H(()=>{});var Wn,Ta,Pa=H(()=>{Wn={en:"US",hi:"IN",deva:"IN",te:"IN",mr:"IN",ta:"IN",gu:"IN",kn:"IN",or:"IN",ml:"IN",pa:"IN",bho:"IN",awa:"IN",as:"IN",mwr:"IN",mai:"IN",mag:"IN",bgc:"IN",hne:"IN",dcc:"IN",bn:"BD",beng:"BD",rkt:"BD",dz:"BT",tibt:"BT",tn:"BW",am:"ET",ethi:"ET",om:"ET",quc:"GT",id:"ID",jv:"ID",su:"ID",mad:"ID",ms_arab:"ID",he:"IL",hebr:"IL",jam:"JM",ja:"JP",jpan:"JP",km:"KH",khmr:"KH",ko:"KR",kore:"KR",lo:"LA",laoo:"LA",mh:"MH",my:"MM",mymr:"MM",mt:"MT",ne:"NP",fil:"PH",ceb:"PH",ilo:"PH",ur:"PK",pa_arab:"PK",lah:"PK",ps:"PK",sd:"PK",skr:"PK",gn:"PY",th:"TH",thai:"TH",tts:"TH",zh_hant:"TW",hant:"TW",sm:"WS",zu:"ZA",sn:"ZW",arq:"DZ",ar:"EG",arab:"EG",arz:"EG",fa:"IR",az_arab:"IR",dv:"MV",thaa:"MV"},Ta=Wn});var qn,za,Wa=H(()=>{qn={AG:0,ATG:0,28:0,AS:0,ASM:0,16:0,BD:0,BGD:0,50:0,BR:0,BRA:0,76:0,BS:0,BHS:0,44:0,BT:0,BTN:0,64:0,BW:0,BWA:0,72:0,BZ:0,BLZ:0,84:0,CA:0,CAN:0,124:0,CO:0,COL:0,170:0,DM:0,DMA:0,212:0,DO:0,DOM:0,214:0,ET:0,ETH:0,231:0,GT:0,GTM:0,320:0,GU:0,GUM:0,316:0,HK:0,HKG:0,344:0,HN:0,HND:0,340:0,ID:0,IDN:0,360:0,IL:0,ISR:0,376:0,IN:0,IND:0,356:0,JM:0,JAM:0,388:0,JP:0,JPN:0,392:0,KE:0,KEN:0,404:0,KH:0,KHM:0,116:0,KR:0,KOR:0,410:0,LA:0,LA0:0,418:0,MH:0,MHL:0,584:0,MM:0,MMR:0,104:0,MO:0,MAC:0,446:0,MT:0,MLT:0,470:0,MX:0,MEX:0,484:0,MZ:0,MOZ:0,508:0,NI:0,NIC:0,558:0,NP:0,NPL:0,524:0,PA:0,PAN:0,591:0,PE:0,PER:0,604:0,PH:0,PHL:0,608:0,PK:0,PAK:0,586:0,PR:0,PRI:0,630:0,PT:0,PRT:0,620:0,PY:0,PRY:0,600:0,SA:0,SAU:0,682:0,SG:0,SGP:0,702:0,SV:0,SLV:0,222:0,TH:0,THA:0,764:0,TT:0,TTO:0,780:0,TW:0,TWN:0,158:0,UM:0,UMI:0,581:0,US:0,USA:0,840:0,VE:0,VEN:0,862:0,VI:0,VIR:0,850:0,WS:0,WSM:0,882:0,YE:0,YEM:0,887:0,ZA:0,ZAF:0,710:0,ZW:0,ZWE:0,716:0,AE:6,ARE:6,784:6,AF:6,AFG:6,4:6,BH:6,BHR:6,48:6,DJ:6,DJI:6,262:6,DZ:6,DZA:6,12:6,EG:6,EGY:6,818:6,IQ:6,IRQ:6,368:6,IR:6,IRN:6,364:6,JO:6,JOR:6,400:6,KW:6,KWT:6,414:6,LY:6,LBY:6,434:6,OM:6,OMN:6,512:6,QA:6,QAT:6,634:6,SD:6,SDN:6,729:6,SY:6,SYR:6,760:6,MV:5,MDV:5,462:5},za=qn});function Or(i){return Ia(i,Ta,za)}var qa=H(()=>{Aa();Pa();Wa()});function Er(i){if(typeof i!="string")return null;let e=i.trim().toLowerCase(),t={today:["day",0],yesterday:["day",-1],this_week:["week",0],"this week":["week",0],last_week:["week",-1],"last week":["week",-1],this_month:["month",0],"this month":["month",0],last_month:["month",-1],"last month":["month",-1],this_year:["year",0],last_year:["year",-1],quarterly:["quarter_hour",0],hourly:["hour",0],daily:["day",0],weekly:["week",0],monthly:["month",0],yearly:["year",0]},r=Object.prototype.hasOwnProperty.call(t,e)?t[e]:null;if(r)return r[1]===0?{kind:"calendar",period:r[0]}:{kind:"shifted_calendar",period:r[0],shift:{amount:-1,unit:r[0]}};let a=/^(\d+)(m|h|d|w)$/.exec(e);if(!a||!Number.isSafeInteger(Number(a[1]))||Number(a[1])<1)return null;let n={m:"minute",h:"hour",d:"day",w:"week"}[a[2]],s={amount:Number(a[1]),unit:n};return Number.isFinite(Ha(s))?{kind:"rolling",duration:s}:null}function Br(i,e){let t=i instanceof Date?i.getTime():typeof i=="number"?i:Date.parse(String(i!=null?i:""));if(!Number.isFinite(t))throw new TypeError(`${e} must be a valid timestamp`);return t}function On(i){try{return new Intl.DateTimeFormat("en-CA",{timeZone:i,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"})}catch(e){throw new TypeError(`Invalid IANA time zone: ${i}`)}}function ht(i,e,t){let r=Object.fromEntries(t.formatToParts(new Date(i)).filter(a=>a.type!=="literal").map(a=>[a.type,Number(a.value)]));return{year:r.year,month:r.month,day:r.day,hour:r.hour===24?0:r.hour,minute:r.minute,second:r.second}}function Ht(i){return Date.UTC(i.year,i.month-1,i.day,i.hour,i.minute,i.second)}function Bn(i,e){return i.year===e.year&&i.month===e.month&&i.day===e.day&&i.hour===e.hour&&i.minute===e.minute&&i.second===e.second}function Da(i,e){return Ht(i)-Ht(e)}function Et(i,e,t,{after:r=null,reference:a=null}={}){var u;let n=Ht(i),s=new Set;for(let d=-36;d<=36;d+=6){let c=n+d*pt,h=ht(c,e,t);s.add(Ht(h)-c)}let l=[...s].map(d=>n-d).filter(d=>Bn(ht(d,e,t),i)).sort((d,c)=>d-c);if(l.length){if(Number.isFinite(r))return(u=l.find(d=>d>r))!=null?u:l.at(-1);if(Number.isFinite(a)){let d=l.filter(c=>c<=a);if(d.length)return d.at(-1)}return l[0]}let o=[...s].map(d=>n-d).map(d=>({candidate:d,local:ht(d,e,t)})).filter(({local:d})=>Da(d,i)>=0).sort((d,c)=>Da(d.local,c.local)||d.candidate-c.candidate);if(o.length)return o[0].candidate;throw new RangeError("Could not resolve local time in the configured time zone")}function Va(i,e){return new Date(Date.UTC(i,e,0)).getUTCDate()}function Hr(i,e,t){if(t==="quarter_hour"||t==="hour"||t==="day"||t==="week"){let r=t==="quarter_hour"?e*15:0,a=t==="hour"?e:0,n=t==="day"?e:t==="week"?e*7:0,s=new Date(Date.UTC(i.year,i.month-1,i.day,i.hour+a+n*24,i.minute+r,i.second));return{year:s.getUTCFullYear(),month:s.getUTCMonth()+1,day:s.getUTCDate(),hour:s.getUTCHours(),minute:s.getUTCMinutes(),second:s.getUTCSeconds()}}if(t==="month"){let r=i.year*12+(i.month-1)+e,a=Math.floor(r/12),n=(r%12+12)%12+1;return{...i,year:a,month:n,day:Math.min(i.day,Va(a,n))}}if(t==="year"){let r=i.year+e;return{...i,year:r,day:Math.min(i.day,Va(r,i.month))}}throw new TypeError(`Unsupported calendar unit: ${t}`)}function La(i,e,t){let r={...i};if(e==="quarter_hour"&&(r.minute=Math.floor(r.minute/15)*15),e==="hour"&&(r.minute=0),(e==="quarter_hour"||e==="hour")&&(r.second=0),e==="day"&&(r.hour=0,r.minute=0,r.second=0),e==="week"){let a=new Date(Date.UTC(r.year,r.month-1,r.day)).getUTCDay(),n=t%7,s=(a-n+7)%7;Object.assign(r,Hr({...r,hour:0,minute:0,second:0},-s,"day"))}return e==="month"&&(r.day=1,r.hour=0,r.minute=0,r.second=0),e==="year"&&(r.month=1,r.day=1,r.hour=0,r.minute=0,r.second=0),r}function Ba(i,e){return Hr(i,1,e)}function En(i,e,t,r,a){return t==="quarter_hour"?i+900*1e3:t==="hour"?i+pt:Et(Ba(e,t),r,a,{after:i})}function Hn(i,e=null,t=null){if(Number.isInteger(t)&&t>=0&&t<=6)return t;let r=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(String(e!=null?e:"").toLowerCase());if(r>=0)return r;if((e==null||e==="language")&&typeof i=="string"){try{let a=typeof Intl.Locale=="function"?new Intl.Locale(i):null;if(!a)return Or(i)%7;let n=typeof a.getWeekInfo=="function"?a.getWeekInfo():a.weekInfo,s=n==null?void 0:n.firstDay;if(Number.isInteger(s)&&s>=1&&s<=7)return s%7}catch(a){}return Or(i)%7}return 1}function jn(i,e,t,r,a,n){return i==="rolling"?`rolling:${e}:${a}`:i==="calendar"?`calendar:${e}:${t}:${a}`:i==="shifted_calendar"?`shifted:${e}:${n.amount}:${n.unit}:${t}:${r}:${a}`:`absolute:${t}:${r}`}function Ea(i,e={}){var p,b,m,v,f,y,_;if(!i||typeof i!="object")throw new TypeError("A time-window specification is required");let t=Br((p=e.now)!=null?p:Date.now(),"now"),r=e.timeZone;if(typeof r!="string"||!r.trim())throw new TypeError("timeZone must be an IANA time-zone name");let a=On(r),n=(b=e.locale)!=null?b:"en-US",s=Hn(n,e.firstWeekday,e.weekStartsOn),l=i.kind,o,u,d;if(l==="absolute"){if(o=Br(i.start,"start"),u=Br(i.end,"end"),u<=o)throw new RangeError("Absolute window end must be after start");d={kind:l,partial:u>t}}else if(l==="rolling"){let x=Number.isFinite(i.durationMs)?i.durationMs:Ha(i.duration);if(!Number.isFinite(x)||x<=0)throw new RangeError("Rolling duration must be positive");o=t-x,u=t,d={kind:l,durationMs:x,partial:!1}}else if(l==="calendar"||l==="shifted_calendar"){let x=(m=i.period)!=null?m:i.unit;if(!Vn.has(x))throw new TypeError(`Unsupported calendar period: ${x}`);let g=ht(t,r,a),w=La(g,x,s),S=l==="shifted_calendar"?i.shift:{amount:0,unit:x};if(!S||!Number.isInteger(S.amount)||!Ln.has(S.unit))throw new TypeError("shift must contain an integer amount and supported calendar unit");let k=Hr(w,S.amount,S.unit);if(o=Et(k,r,a,{...l==="calendar"&&S.amount===0?{reference:t}:{}}),l==="calendar"&&S.amount===0)u=t;else if(x==="quarter_hour"||x==="hour")u=o+(x==="hour"?pt:900*1e3);else{let R=Ba(k,x);u=Et(R,r,a,{after:o})}d={kind:l,period:x,shift:l==="shifted_calendar"?{...S}:null,weekStartsOn:x==="week"?s:null,partial:l==="calendar"&&S.amount===0}}else throw new TypeError(`Unsupported time-window kind: ${l}`);if(l==="calendar"&&u===o&&o===t&&(u+=1),!(u>o))throw new RangeError("Resolved time window must have a positive duration");let c=(v=i.period)!=null?v:i.unit,h=l==="calendar"||l==="shifted_calendar"?(()=>{let x=La(ht(t,r,a),c,s),g=Et(x,r,a,{reference:t});return En(g,x,c,r,a)})():null;return{start:o,end:u,timeZone:r,interval:"[start,end)",cacheKey:jn(l,(_=(y=(f=d.period)!=null?f:i.period)!=null?y:i.unit)!=null?_:d.durationMs,o,u,r,d.shift),semantics:{...d,future:!(l==="calendar"&&o===t&&u===t+1)&&(o>t||u>t),rolloverAt:h}}}function Ha(i){if(!i||typeof i!="object"||!Number.isFinite(i.amount)||i.amount<=0)return null;let e={millisecond:1,second:1e3,minute:6e4,hour:pt,day:Oa,week:Dn};return e[i.unit]?i.amount*e[i.unit]:null}var pt,Oa,Dn,Vn,Ln,jr=H(()=>{qa();pt=3600*1e3,Oa=24*pt,Dn=7*Oa,Vn=new Set(["quarter_hour","hour","day","week","month","year"]),Ln=new Set(["quarter_hour","hour","day","week","month","year"])});function Ut(i){return typeof i=="string"&&i!==""?i:null}function Ka(i){return i!=null&&i!==""&&typeof i!="string"}function G(i,e,t=null,r=null){let a={fixed:i!=null?i:null,entity:e!=null?e:null};Number.isFinite(t)&&(a.percent=t);let n=Ut(r);return n!==null&&(a.attribute=n),Ka(r)&&(a.attribute_invalid=!0),a}function ne(i){return typeof i=="string"&&/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(i.trim())}function ge(i){if(typeof i!="string")return null;let e=i.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);if(!e)return null;let t=parseFloat(e[1]);return Number.isFinite(t)?t:null}function B(i){if(typeof i=="number")return Number.isFinite(i)?i:null;if(typeof i=="string"){let e=i.trim();if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}return null}function me(i,e=null,t=null,r={}){var s,l,o,u,d;let{allowPercent:a=!1}=r,n=e!=null?e:G(t,null);if(i===void 0)return{...n};if(i===null)return G(null,null);if(typeof i=="object"&&!Array.isArray(i)){let c=(l=(s=i.fixed)!=null?s:i.value)!=null?l:null,h=i.entity,p=null,b=null,m=!1;if(h!=null&&h!=="")if(typeof h=="string")p=h.trim(),p&&!ne(p)&&(p=null,m=!0);else if(h&&typeof h=="object"&&!Array.isArray(h)){let y=Object.keys(h),_=h.id,x=Object.prototype.hasOwnProperty.call(h,"attribute");typeof _!="string"||!ne(_.trim())||x&&(typeof h.attribute!="string"||!h.attribute.trim())||y.some(g=>!["id","attribute"].includes(g))?m=!0:(p=_.trim(),x&&(b=h.attribute.trim()))}else m=!0;Object.prototype.hasOwnProperty.call(i,"attribute")&&(m=!0,p=null,b=null);let v=a?B(i.percent):null,f=G(c,p,v,b);return m&&(f.entity_invalid=!0),f}if(ne(i))return G((u=(o=n.fixed)!=null?o:t)!=null?u:null,i,(d=n.percent)!=null?d:null);if(a){let c=ge(i);if(Number.isFinite(c))return G(null,null,c)}return G(i,null)}function Un(i){var e;return!!i&&(B((e=i.fixed)!=null?e:i.value)!==null||Number.isFinite(i.percent)||!!i.entity)}function Ga(i,e){var r,a,n,s;let t={above:((r=e==null?void 0:e.peak_marker)==null?void 0:r.show)===!0?1:0,below:(((a=e==null?void 0:e.floor_marker)==null?void 0:a.show)===!0?1:0)+(((n=e==null?void 0:e.target_marker)==null?void 0:n.enabled)!==!1&&Un((s=e==null?void 0:e.target_marker)==null?void 0:s.source)?1:0)};return i.map(l=>{let o=l.valid&&t[l.lane]<4;return o&&(t[l.lane]+=1),{...l,accepted:o}})}function Ja(i,e=null){if(!Array.isArray(i))return{markers:[],invalidList:i!==void 0};let t=i.map((r,a)=>{var I;if(!r||typeof r!="object"||Array.isArray(r))return{id:`generic-${a}`,index:a,valid:!1,accepted:!1,malformed:!0};let n=r.at,s=n&&typeof n=="object"&&Object.prototype.hasOwnProperty.call(n,"percent"),l=typeof n=="string"?n.trim():n,o=me(l,null,null,{allowPercent:!0}),u=n&&typeof n=="object"&&n.entity!==void 0?o.entity:typeof l=="string"&&ne(l)?l:null,d=o.entity_invalid===!0||u!=null&&u!==""&&!ne(u),c=n&&typeof n=="object"&&n.fixed!==void 0&&n.fixed!==null&&B(n.fixed)===null,h=!!o.entity||B(o.fixed)!==null||Number.isFinite(o.percent),p=Number.isFinite(o.percent)&&(o.percent<0||o.percent>100),b=n!=null&&!s&&!d&&!c&&h&&!p,m=r.lane===void 0?"below":r.lane,v=m==="above"||m==="below",f=["circle","diamond","triangle","chevron","arrow","pin"],y=r.shape===void 0||f.includes(r.shape),_=vt(r.direction),x=r.direction!==void 0&&!["inward","outward"].includes(typeof r.direction=="string"?r.direction.trim().toLowerCase():""),g=r.label&&typeof r.label=="object"&&!Array.isArray(r.label)?r.label:{},w=Yt(g),S=g.entity,k=S&&typeof S=="object"&&!Array.isArray(S)?S:null,R=typeof S=="string"?S.trim():typeof(k==null?void 0:k.id)=="string"?k.id.trim():"",M=k==null?void 0:k.attribute,N=S!=null&&S!==""&&!ne(R)||k&&(Object.keys(k).some(P=>!["id","attribute"].includes(P))||Object.prototype.hasOwnProperty.call(k,"attribute")&&(typeof M!="string"||!M.trim()))||Object.prototype.hasOwnProperty.call(g,"attribute"),$=R&&ne(R)&&!N?R:null,F=typeof r.show_marker=="boolean"?r.show_marker:!0;return{id:`generic-${a}`,index:a,source:{...o,entity:typeof o.entity=="string"?o.entity.trim():o.entity},lane:v?m:null,shape:y&&(I=r.shape)!=null?I:"circle",direction:_,invalidDirection:x,showMarker:F,invalidShowMarker:r.show_marker!==void 0&&typeof r.show_marker!="boolean",color:typeof r.color=="string"&&r.color.trim()?r.color:"#888888",label:{show:g.show===!0,text:w.label_text,entity:$,...Ut(M)!==null?{attribute:Ut(M)}:{},showValue:w.label_show_value,showUnit:w.label_show_unit,precision:w.label_precision,invalidShow:w.label_invalid_show,invalidText:w.label_invalid_text,invalidShowValue:w.label_invalid_show_value,invalidShowUnit:w.label_invalid_show_unit,invalidPrecision:w.label_invalid_precision,invalidPrecisionKey:w.label_precision_key,unsupportedUnit:w.label_unsupported_unit,invalidEntity:N},valid:b&&v,invalidSource:!b,invalidPercentage:p,unsupportedPercentField:s,invalidLane:!v,invalidShape:!y,accepted:!1}});return{markers:Ga(t,e),invalidList:!1}}function Se(i,e=null){var r;let t=e!=null?e:{color:null};return i===void 0?{...t}:i===null?{color:null}:typeof i=="object"&&!Array.isArray(i)?{color:(r=i.color)!=null?r:null}:{color:i}}function bt(i){return i===!0?!0:i===!1?!1:null}function Zt(i,e){var n;let t=e==null?void 0:e.baseline,r=i==null?void 0:i.baseline,a={enabled:bt(t==null?void 0:t.enabled),at:t!=null&&t.at?{...t.at}:G(null,null),above:Se(void 0,t==null?void 0:t.above),below:Se(void 0,t==null?void 0:t.below)};return r===void 0?a:r===null?{enabled:null,at:G(null,null),above:{color:null},below:{color:null}}:typeof r!="object"||Array.isArray(r)?{enabled:a.enabled,at:me(r,a.at,null),above:a.above,below:a.below}:{enabled:(n=bt(r.enabled))!=null?n:a.enabled,at:me(r.at,a.at,null,{allowPercent:!0}),above:Se(r.above,a.above),below:Se(r.below,a.below)}}function Kn(i,e=null){let t=[...i].sort((r,a)=>r.from-a.from);return t.map((r,a)=>{var s;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&a<t.length-1&&(n=t[a+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(s=r.label)!=null?s:null}})}function Kt(i){if(!Array.isArray(i))return null;let e=i.filter(t=>Number.isFinite(t==null?void 0:t.from)&&(t==null?void 0:t.color)).map(t=>{var r;return{from:t.from,to:Number.isFinite(t==null?void 0:t.to)?t.to:null,color:t.color,label:(r=t.label)!=null?r:null}});return Kn(e,100)}function ja(i,e=null){var r;if(i===void 0)return{value:null,issue:null};if(i===null)return{value:null,issue:"malformed"};if(i&&typeof i=="object"&&!Array.isArray(i)){if(i.entity!==void 0&&i.entity!==null&&i.entity!=="")return{value:null,issue:"entity"};if(Object.prototype.hasOwnProperty.call(i,"percent")){let n=B(i.percent);return Number.isFinite(n)?{value:G(null,null,n),issue:null}:{value:null,issue:"malformed"}}let a=B((r=i.fixed)!=null?r:i.value);return Number.isFinite(a)?{value:G(a,null),issue:null}:{value:null,issue:"malformed"}}if(typeof i=="string"){let a=i.trim();if(ne(a))return{value:null,issue:"entity"};if(a.includes("%")){let n=ge(a);return Number.isFinite(n)?{value:G(null,null,n),issue:null}:{value:null,issue:"malformed_percent"}}}let t=B(i);return Number.isFinite(t)?e==="percent"?{value:G(null,null,t),issue:null}:{value:G(t,null),issue:null}:{value:null,issue:"malformed"}}function mt(i,e={}){if(!Array.isArray(i))return null;let{legacySegmentSpace:t=null}=e,r=i.map(a=>{var l,o;let n=(a==null?void 0:a.from)===void 0?{value:null,issue:"malformed"}:ja(a.from,t),s=(a==null?void 0:a.to)===void 0?{value:null,issue:null}:a.to===null?{value:null,issue:null}:ja(a.to,t);return a!=null&&a.color?{from:n.value,to:s.value,invalidBoundary:(l=n.issue)!=null?l:s.issue,color:a.color,label:(o=a.label)!=null?o:null}:null}).filter(Boolean);return r.map((a,n)=>{var l;let s=r.slice(n+1).find(o=>!o.invalidBoundary);return{from:a.from?{...a.from}:null,to:a.to?{...a.to}:s!=null&&s.from?{...s.from}:null,...a.invalidBoundary?{invalidBoundary:a.invalidBoundary}:{},color:a.color,label:(l=a.label)!=null?l:null}})}function Gt(i,e,t,r){var m,v,f,y,_,x,g,w,S,k,R,M;let a=e==null?void 0:e.scale,n=i==null?void 0:i.scale,s=`${t}_entity`,l=a==null?void 0:a[t],o=l?Object.prototype.hasOwnProperty.call(l,"fixed_explicit")?G((v=(m=l.fixed)!=null?m:l.value)!=null?v:null,(f=l.entity)!=null?f:null,(y=l.percent)!=null?y:null,l.attribute):me(l):G((_=e==null?void 0:e[t])!=null?_:r,(x=e==null?void 0:e[s])!=null?x:null),u=l?l.fixed_explicit!==!1&&l.fixed!==null&&l.fixed!==void 0:(e==null?void 0:e[t])!==null&&(e==null?void 0:e[t])!==void 0,d=(N,$)=>(Object.defineProperty(N,"fixed_explicit",{value:$}),N);if((n==null?void 0:n[t])!==void 0){let N=n[t],$=ne(N)?u:typeof N=="object"&&N!==null?((g=N.fixed)!=null?g:N.value)!==null&&((w=N.fixed)!=null?w:N.value)!==void 0:N!==null;return d(me(n[t],o,r),$)}let c=i[s],h=c!=null,p=(k=(S=i[t])!=null?S:h?null:o.fixed)!=null?k:o.entity?null:r,b=(R=c!=null?c:o.entity)!=null?R:null;return d(G(p,b,(M=o.percent)!=null?M:null,o.attribute),i[t]!==null&&i[t]!==void 0||!h&&u)}function Xt(i,e){var l,o;let t=(l=i==null?void 0:i.scale)==null?void 0:l.direction,r=(o=e==null?void 0:e.scale)==null?void 0:o.direction,a=u=>u==="normal"||u==="reverse",n=t!==void 0,s=a(t)?t:a(r)?r:"normal";return{min:Gt(i,e,"min",0),max:Gt(i,e,"max",100),direction:s,...n&&!a(t)?{direction_invalid:!0}:{}}}function Kr(i){switch(i){case"solid":return"single";case"gradient":return"gradient";case"bands":return"severity";case"soft_bands":return"severity";case"band_gradient":return"severity_gradient";default:return null}}function _t(i){switch(i){case"single":return"solid";case"gradient":return"gradient";case"severity":return"bands";case"severity_gradient":return"band_gradient";default:return null}}function Jt(i,e){return i!=null&&Object.prototype.hasOwnProperty.call(i,e)}function Gn(i){return[Jt(i,"color")?i.color:void 0,Jt(i==null?void 0:i.bar,"color")?i.bar.color:void 0].some(t=>t!=null)}function ft(i){let e=i==null?void 0:i.bar,t=[[i,"color_mode"],[e,"color_mode"],[e,"fill_style"],[i,"severity"],[i,"segments"],[e,"segments"],[i,"gradient_stops"],[e,"gradient_stops"],[e,"solid_fill"]];return{color:Gn(i),paint:t.some(([r,a])=>Jt(r,a))}}function Me(i=null,e=null){var n,s,l,o,u,d;let t=(n=i==null?void 0:i.fill_style)!=null?n:null,r=(l=(s=i==null?void 0:i.color_mode)!=null?s:e)!=null?l:null,a=(u=(o=Kr(t))!=null?o:r)!=null?u:"severity";return{fill_style:(d=t!=null?t:_t(a))!=null?d:"bands",color_mode:a}}function Jr(i,e,t,r,{scopeExplicitness:a=null,inheritedExplicitness:n=null,isCardScope:s=!1}={}){let l=(a==null?void 0:a.color)===!0&&a.paint!==!0,o=(n==null?void 0:n.paint)===!0;return l&&(s||!o)?Me({fill_style:"solid"},null):(i==null?void 0:i.fill_style)!==void 0||(i==null?void 0:i.color_mode)!==void 0||e.color_mode!==void 0?Me(i,e.color_mode):(t==null?void 0:t.fill_style)!==void 0||(t==null?void 0:t.color_mode)!==void 0||(r==null?void 0:r.color_mode)!==void 0?Me(t,r==null?void 0:r.color_mode):Me(null,null)}function Yr(i){return Array.isArray(i)?i.map(e=>{if(!e||typeof e!="object"||Array.isArray(e))return e;let t=ge(e.pos),r=Number.isFinite(t)?t:B(e.pos);return{...e,pos:Number.isFinite(r)?r:e.pos}}):i!=null?i:null}function Zr(i,e=null){var r,a,n,s;let t=e?{show:(r=e.show)!=null?r:!1,color:(a=e.color)!=null?a:"#ffffff"}:{show:!1,color:"#ffffff"};return i===void 0?{...t}:typeof i=="boolean"?{show:i,color:"#ffffff"}:i&&typeof i=="object"&&!Array.isArray(i)?{show:(n=i.show)!=null?n:t.show,color:(s=i.color)!=null?s:t.color}:{...t}}function Qt(i,e,t={}){var w,S,k,R,M,N,$,F,I,P,L,W,O,q,D,T,j,Y,V,E,z,U,X,Z,Q,ie,C;let r=(w=t.scopeExplicitness)!=null?w:ft(i),a=(k=(S=t.inheritedExplicitness)!=null?S:e==null?void 0:e[Gr])!=null?k:ft(e),n=(R=t.isCardScope)!=null?R:e==null,s=e==null?void 0:e.bar,l=i==null?void 0:i.bar,o=Jt(s,Ur)?s[Ur]:["percent","scale"].includes(s==null?void 0:s.segment_space)?s.segment_space:null,u=["percent","scale"].includes(l==null?void 0:l.segment_space)?l.segment_space:o,d=l==null?void 0:l.segments,c=i.segments,h=i.severity,p=(M=s==null?void 0:s.segments)!=null?M:null,b=(N=e==null?void 0:e.segments)!=null?N:null,m=($=e==null?void 0:e.severity)!=null?$:null,v=null,f=(s==null?void 0:s.segment_space)==="percent"||(s==null?void 0:s.segment_space)==="scale"?s.segment_space:null;d!=null?(f=u,v=mt(d,{legacySegmentSpace:f})):c!=null?v=mt(c):h!=null?(v=Kt(h),f="percent"):p!=null?v=p.map(se=>({...se})):b!=null?v=mt(b):m!=null&&(v=Kt(m),f="percent");let y=i!=null&&i.target&&typeof i.target=="object"&&!Array.isArray(i.target)?(F=i.target.when_exceeded)==null?void 0:F.fill_color:void 0,_=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?(I=e.target.when_exceeded)==null?void 0:I.fill_color:void 0,x=Jr(l,i,s,e,{scopeExplicitness:r,inheritedExplicitness:a,isCardScope:n}),g={direction:["normal","reverse"].includes(l==null?void 0:l.direction)?l.direction:["normal","reverse"].includes(s==null?void 0:s.direction)?s.direction:"normal",...(l==null?void 0:l.direction)!==void 0&&!["normal","reverse"].includes(l.direction)?{direction_invalid:!0}:{},fill_style:x.fill_style,color_mode:x.color_mode,needle:Zr(l==null?void 0:l.needle,s==null?void 0:s.needle),solid_fill:(L=(P=l==null?void 0:l.solid_fill)!=null?P:s==null?void 0:s.solid_fill)!=null?L:!1,color:(D=(q=(O=(W=l==null?void 0:l.color)!=null?W:i.color)!=null?O:s==null?void 0:s.color)!=null?q:e==null?void 0:e.color)!=null?D:"#4a9eff",gradient_stops:Yr((V=(Y=(j=(T=l==null?void 0:l.gradient_stops)!=null?T:i.gradient_stops)!=null?j:s==null?void 0:s.gradient_stops)!=null?Y:e==null?void 0:e.gradient_stops)!=null?V:null),severity:v,segments:v,segment_space:f,animated:(X=(U=(z=(E=l==null?void 0:l.animated)!=null?E:i.animated)!=null?z:s==null?void 0:s.animated)!=null?U:e==null?void 0:e.animated)!=null?X:!0,above_target_color:(C=(ie=(Q=(Z=y!=null?y:i.above_target_color)!=null?Z:s==null?void 0:s.above_target_color)!=null?Q:_)!=null?ie:e==null?void 0:e.above_target_color)!=null?C:null};return Object.defineProperty(g,Ur,{value:u}),g}function Xr(i){return Math.max(24,i)}function Jn(i,e="left"){let t=typeof i=="string"?i.trim().toLowerCase():"";return["left","above","inside","off","hero"].includes(t)?t:e}function Yn(i,e="medium"){let t=typeof i=="string"?i.trim().toLowerCase():"";return["small","medium","large"].includes(t)?t:e}function Zn(i){return Number.isFinite(i)?Math.min(112,Math.max(12,i)):null}function Ct(i,e){var p,b,m,v,f,y,_,x,g,w,S,k,R,M,N,$,F,I,P,L,W,O,q,D,T;let t=e==null?void 0:e.layout,r=i==null?void 0:i.layout,a=r==null?void 0:r.label,n=r==null?void 0:r.hero,s=t==null?void 0:t.label,l=t==null?void 0:t.hero,o=!e,u=(v=(m=(b=(p=r==null?void 0:r.height)!=null?p:i.height)!=null?b:t==null?void 0:t.height)!=null?m:e==null?void 0:e.height)!=null?v:38,d=(r==null?void 0:r.height)!==void 0||i._height_explicit===!0||!o&&i.height!==void 0||(t==null?void 0:t.height_explicit)===!0||(e==null?void 0:e._height_explicit)===!0,c=Jn((x=(_=(y=(f=a==null?void 0:a.position)!=null?f:i.label_position)!=null?y:s==null?void 0:s.position)!=null?_:t==null?void 0:t.label_position)!=null?x:e==null?void 0:e.label_position,"left"),h=c==="hero"?Zn((g=n==null?void 0:n.value_size)!=null?g:l==null?void 0:l.value_size):null;return{label:{position:c,width:(M=(R=(k=(S=(w=a==null?void 0:a.width)!=null?w:i.label_width)!=null?S:s==null?void 0:s.width)!=null?k:t==null?void 0:t.label_width)!=null?R:e==null?void 0:e.label_width)!=null?M:100},hero:{size:Yn((T=(D=(q=(O=(W=(L=(P=(I=(F=($=(N=n==null?void 0:n.size)!=null?N:a==null?void 0:a.hero_size)!=null?$:a==null?void 0:a.heroSize)!=null?F:i.hero_size)!=null?I:i.heroSize)!=null?P:l==null?void 0:l.size)!=null?L:s==null?void 0:s.hero_size)!=null?W:s==null?void 0:s.heroSize)!=null?O:t==null?void 0:t.hero_size)!=null?q:t==null?void 0:t.heroSize)!=null?D:e==null?void 0:e.hero_size)!=null?T:e==null?void 0:e.heroSize,"medium"),value_size:h},height:Xr(u),height_explicit:d}}function er(i,e){var a,n,s,l,o,u,d,c;let t=e==null?void 0:e.formatting,r=i==null?void 0:i.formatting;return{decimal:(l=(s=(n=(a=r==null?void 0:r.decimal)!=null?a:i.decimal)!=null?n:t==null?void 0:t.decimal)!=null?s:e==null?void 0:e.decimal)!=null?l:null,unit:(c=(d=(u=(o=r==null?void 0:r.unit)!=null?o:i.unit)!=null?u:t==null?void 0:t.unit)!=null?d:e==null?void 0:e.unit)!=null?c:null}}function Ua(i){let e=String(i!=null?i:"").trim().toLowerCase();return e==="triangle"||e==="diamond"?e:"diamond"}function vt(i){return(typeof i=="string"?i.trim().toLowerCase():"")==="outward"?"outward":"inward"}function Yt(i,e={}){var c,h,p;let t=i&&typeof i=="object"&&!Array.isArray(i)?i:{},r=Object.prototype.hasOwnProperty.call(t,"text"),a=r&&typeof t.text=="string"?t.text.replace(/\s+/g," ").trim():e.label_text,n=Object.prototype.hasOwnProperty.call(t,"precision"),s=Object.prototype.hasOwnProperty.call(t,"decimal"),l=n?t.precision:t.decimal,o=n||s,u=o?B(l):(c=e.label_precision)!=null?c:null,d=o&&l!==null&&l!==""&&!(Number.isInteger(u)&&u>=0);return{label_text:a!=null?a:null,label_show_value:typeof t.show_value=="boolean"?t.show_value:(h=e.label_show_value)!=null?h:!0,label_show_unit:typeof t.show_unit=="boolean"?t.show_unit:(p=e.label_show_unit)!=null?p:!0,label_precision:d?null:u,label_invalid_show:t.show!==void 0&&typeof t.show!="boolean",label_invalid_text:r&&typeof t.text!="string",label_invalid_show_value:t.show_value!==void 0&&typeof t.show_value!="boolean",label_invalid_show_unit:t.show_unit!==void 0&&typeof t.show_unit!="boolean",label_invalid_precision:d,label_precision_key:d?n?"precision":"decimal":void 0,label_unsupported_unit:Object.prototype.hasOwnProperty.call(t,"unit")}}function jt(i){let e={};return i.label_text!==null&&i.label_text!==void 0&&(e.label_text=i.label_text),i.label_show_value===!1&&(e.label_show_value=!1),i.label_show_unit===!1&&(e.label_show_unit=!1),i.label_precision!==null&&i.label_precision!==void 0&&(e.label_precision=i.label_precision),i.label_invalid_text&&(e.label_invalid_text=!0),i.label_invalid_show_value&&(e.label_invalid_show_value=!0),i.label_invalid_show_unit&&(e.label_invalid_show_unit=!0),i.label_invalid_show&&(e.label_invalid_show=!0),i.label_invalid_precision&&(e.label_invalid_precision=!0),i.label_invalid_precision&&i.label_precision_key&&(e.label_precision_key=i.label_precision_key),i.label_unsupported_unit&&(e.label_unsupported_unit=!0),e}function Ya(i){return i!==void 0&&!["inward","outward"].includes(typeof i=="string"?i.trim().toLowerCase():"")}function tr(i,e){var h,p,b,m,v,f,y,_,x,g,w,S,k,R,M,N,$,F,I,P,L,W,O,q,D,T,j,Y,V,E,z,U,X,Z,Q,ie,C;let t=e==null?void 0:e.target_marker,r=i==null?void 0:i.target,a=e!=null&&e.target&&typeof e.target=="object"&&!Array.isArray(e.target)?null:(h=e==null?void 0:e.target)!=null?h:null,n=t?{...t,shape:Ua(t.shape),direction:vt(t.direction)}:{enabled:null,source:G(null,null),color:(p=e==null?void 0:e.target_color)!=null?p:"#888",show_label:(b=e==null?void 0:e.show_target_label)!=null?b:!1,...jt(Yt((m=e==null?void 0:e.target)==null?void 0:m.label)),label_decimal:(g=(x=(f=(v=e==null?void 0:e.target)==null?void 0:v.label)==null?void 0:f.precision)!=null?x:(_=(y=e==null?void 0:e.target)==null?void 0:y.label)==null?void 0:_.decimal)!=null?g:null,shape:"diamond",direction:"inward"};if(r&&typeof r=="object"&&!Array.isArray(r)){let se=Yt(r.label,n),ue={enabled:(S=(w=bt(r.enabled))!=null?w:n.enabled)!=null?S:null,source:me(r.at,n.source,null,{allowPercent:!0}),color:(R=(k=r.color)!=null?k:i.target_color)!=null?R:n.color,show_label:($=(N=(M=r.label)==null?void 0:M.show)!=null?N:i.show_target_label)!=null?$:n.show_label,shape:Object.prototype.hasOwnProperty.call(r,"shape")?Ua(r.shape):n.shape,direction:Object.prototype.hasOwnProperty.call(r,"direction")?vt(r.direction):n.direction,...Ya(r.direction)?{direction_invalid:!0}:{},...jt(se)},oe=se.label_precision;return oe!=null&&(ue.label_decimal=oe,ue.label_precision=oe),ue}let s=(W=(L=(I=i.target)!=null?I:(F=n.source)==null?void 0:F.fixed)!=null?L:(P=n.source)==null?void 0:P.value)!=null?W:a,l=(T=(D=(q=i.target_entity)!=null?q:(O=n.source)==null?void 0:O.entity)!=null?D:e==null?void 0:e.target_entity)!=null?T:null,o=i.target===void 0&&i.target_entity===void 0&&(Y=(j=n.source)==null?void 0:j.percent)!=null?Y:null,u=i.target===void 0&&i.target_entity===void 0&&(E=(V=n.source)==null?void 0:V.attribute)!=null?E:null,d={enabled:(z=n.enabled)!=null?z:null,source:G(s,l,o,u),color:(Z=(X=(U=i.target_color)!=null?U:n.color)!=null?X:e==null?void 0:e.target_color)!=null?Z:"#888",show_label:(C=(ie=(Q=i.show_target_label)!=null?Q:n.show_label)!=null?ie:e==null?void 0:e.show_target_label)!=null?C:!1,shape:n.shape,direction:n.direction,...jt(n)},c=d.label_precision;return c!=null&&(d.label_decimal=c),d}function Xn(i,e){let t=i==null?void 0:i[e];if(t&&typeof t=="object"&&!Array.isArray(t))return t;let r=i==null?void 0:i[`${e}_marker`];return r&&typeof r=="object"&&!Array.isArray(r)?r:null}function Qn(i,e){var n,s,l;let t=i==null?void 0:i.label,r=t&&typeof t=="object"&&!Array.isArray(t),a=Yt(t,e);return{show:r&&typeof t.show=="boolean"?t.show:(n=e.show_label)!=null?n:!1,text:a.label_text,invalidShow:a.label_invalid_show,showValue:a.label_show_value,showUnit:a.label_show_unit,precision:a.label_invalid_precision?null:(l=(s=a.label_precision)!=null?s:e.label_decimal)!=null?l:null,invalidText:a.label_invalid_text,invalidShowValue:a.label_invalid_show_value,invalidShowUnit:a.label_invalid_show_unit,invalidPrecision:a.label_invalid_precision,precisionKey:a.label_precision_key,unsupportedUnit:a.label_unsupported_unit}}function Za(i,e,t,r={}){var x,g,w,S,k,R,M,N,$;let{legacy:a=!1,defaultColor:n="#888888"}=r,s=e==null?void 0:e[`${t}_marker`],l=Xn(i,t),o=s!=null?s:{show:a&&(x=e==null?void 0:e.show_peak)!=null?x:!1,color:a&&(g=e==null?void 0:e.peak_color)!=null?g:n,show_label:!1,label_decimal:null,label_text:null,label_show_value:!0,label_show_unit:!0,label_precision:null,window:"today",window_spec:Er("today"),direction:"inward"},u=l&&Object.prototype.hasOwnProperty.call(l,"reset"),d=l&&Object.prototype.hasOwnProperty.call(l,"window"),c=d?l.window:u?l.reset:(w=o.window)!=null?w:"today",h=!d&&u&&!Na(c),p=!d&&u&&typeof c=="string"&&c.trim().toLowerCase()==="never"?"today":typeof c=="string"?c.trim().toLowerCase():c,b=h?null:Er(p),m=l==null?void 0:l.label,v=Qn(l,o),f={show:(R=(k=(S=l==null?void 0:l.enabled)!=null?S:a?i.show_peak:void 0)!=null?k:o.show)!=null?R:!1,color:($=(N=(M=l==null?void 0:l.color)!=null?M:a?i.peak_color:void 0)!=null?N:o.color)!=null?$:n,direction:l&&Object.prototype.hasOwnProperty.call(l,"direction")?vt(l.direction):vt(o.direction),...Ya(l==null?void 0:l.direction)?{direction_invalid:!0}:{},window:p,window_spec:b,...!b||!d&&!u&&o.window_invalid?{window_invalid:!0}:{},...h?{window_invalid_source:"reset"}:{}},y=s&&(Object.prototype.hasOwnProperty.call(s,"show_label")||Object.prototype.hasOwnProperty.call(s,"label_decimal")||Object.prototype.hasOwnProperty.call(s,"label_text")||Object.prototype.hasOwnProperty.call(s,"label_show_value")||Object.prototype.hasOwnProperty.call(s,"label_show_unit")||Object.prototype.hasOwnProperty.call(s,"label_precision"));return(t==="floor"||u||d||m!==void 0||y)&&(f.show_label=v.show,f.label_decimal=v.precision),Object.assign(f,jt({label_text:v.text,label_show_value:v.showValue===!0?void 0:v.showValue,label_show_unit:v.showUnit===!0?void 0:v.showUnit,label_precision:v.precision,label_invalid_text:v.invalidText,label_invalid_show:v.invalidShow,label_invalid_show_value:v.invalidShowValue,label_invalid_show_unit:v.invalidShowUnit,label_invalid_precision:v.invalidPrecision,label_precision_key:v.precisionKey,label_unsupported_unit:v.unsupportedUnit})),f}function rr(i,e){return Za(i,e,"peak",{legacy:!0,defaultColor:"#888888"})}function Xa(i,e){return Za(i,e,"floor",{defaultColor:"#888888"})}function Qa(i){for(let e of["peak","floor"]){if(!i[e]||typeof i[e]!="object"||Array.isArray(i[e]))continue;let{reset:t,...r}=i[e];i[e]={...r,window:i[`${e}_marker`].window}}}function Qr(i,e){var a,n,s;let t={...i,_normalized:!0,entity:i.entity,name:(a=i.name)!=null?a:null,icon:i.icon};if(i.attribute!==void 0){let l=Ut(i.attribute);l!==null?t.attribute=l:delete t.attribute,Ka(i.attribute)?t.attribute_invalid=!0:delete t.attribute_invalid}t.layout=Ct(i,e),t.scale=Xt(i,e),t.bar=Qt(i,e,{scopeExplicitness:ft(i),inheritedExplicitness:(n=e==null?void 0:e[Gr])!=null?n:ft(e),isCardScope:!1}),t.baseline=Zt(i,e),t.formatting=er(i,e),t.target_marker=tr(i,e),t.peak_marker=rr(i,e),t.floor_marker=Xa(i,e),Qa(t);let r=i.markers===void 0?{markers:Ga((s=e==null?void 0:e.generic_markers)!=null?s:[],t),invalidList:(e==null?void 0:e.generic_markers_invalid)===!0}:Ja(i.markers,t);return t.generic_markers=r.markers,t.generic_markers_invalid=r.invalidList,t.min=t.scale.min.fixed,t.min_entity=t.scale.min.entity,t.max=t.scale.max.fixed,t.max_entity=t.scale.max.entity,t.height=t.layout.height,t.label_position=t.layout.label.position,t.label_width=t.layout.label.width,t.color_mode=t.bar.color_mode,t.fill_style=t.bar.fill_style,t.solid_fill=t.bar.solid_fill,t.color=t.bar.color,t.gradient_stops=t.bar.gradient_stops,t.severity=t.bar.severity,t.animated=t.bar.animated,t.above_target_color=t.bar.above_target_color,t.decimal=t.formatting.decimal,t.unit=t.formatting.unit,t.target=t.target_marker.source.fixed,t.target_entity=t.target_marker.source.entity,t.target_color=t.target_marker.color,t.show_target_label=t.target_marker.show_label,t.show_peak=t.peak_marker.show,t.peak_color=t.peak_marker.color,t}function ir(i){var n;let e=ft(i),t={title:"",label_position:"left",color_mode:"severity",color:"#4a9eff",animated:!0,show_peak:!1,peak_color:"#888888",target:null,target_entity:null,target_color:"#888",show_target_label:!1,above_target_color:null,baseline:null,decimal:null,gradient_stops:null,min:0,min_entity:null,max:100,max_entity:null,height:38,label_width:100,severity:[{from:0,to:33,color:"#4CAF50"},{from:33,to:75,color:"#FF9800"},{from:75,to:100,color:"#F44336"}],...i};t._height_explicit=((n=i==null?void 0:i.layout)==null?void 0:n.height)!==void 0||(i==null?void 0:i.height)!==void 0,t.entity&&!t.entities&&(t.entities=[{entity:t.entity,...t.attribute!==void 0?{attribute:t.attribute}:{},...t.name!==void 0?{name:t.name}:{}}]),t.entities=t.entities.map(s=>typeof s=="string"?{entity:s}:s);let r={...t,_normalized:!0};Object.defineProperty(r,Gr,{value:e,enumerable:!1}),r.layout=Ct(t,null),r.scale=Xt(i,null),r.bar=Qt(t,null,{scopeExplicitness:e,inheritedExplicitness:null,isCardScope:!0}),r.baseline=Zt(t,null),r.formatting=er(t,null),r.target_marker=tr(t,null),r.peak_marker=rr(t,null),r.floor_marker=Xa(t,null),Qa(r);let a=Ja(t.markers,r);return r.generic_markers=a.markers,r.generic_markers_invalid=a.invalidList,r.entities=t.entities.map(s=>Qr(s,r)),r}var Gr,Ur,he=H(()=>{$a();jr();Gr=Symbol("sbcp.paintExplicitness"),Ur=Symbol("sbcp.explicitSegmentSpace")});function Cr(i,e=null){var n;if(!i)return{stateObj:null,value:void 0,found:!1,available:!1,attributeFound:!1};let t=!["unknown","unavailable"].includes(String((n=i.state)!=null?n:"").trim().toLowerCase());if(typeof e!="string"||e==="")return{stateObj:i,value:i.state,found:!0,available:t,attributeFound:!0};let r=i.attributes,a=r!=null&&Object.prototype.hasOwnProperty.call(r,e);return{stateObj:i,value:a?r[e]:void 0,found:!0,available:t,attributeFound:a}}function yt(i,e,t=null){var a,n;let r=e&&(n=(a=i==null?void 0:i.states)==null?void 0:a[e])!=null?n:null;return Cr(r,t)}function Re(i,e,t=null){let r=yt(i,e,t);if(!r.found||!r.available||!r.attributeFound)return null;let a=r.value,n=parseFloat(a);return Number.isFinite(n)?n:null}function Ne(i,e,t=null){let r=Re(i,t);if(r!==null)return r;if(e==null||e==="")return null;let a=parseFloat(e);return Number.isFinite(a)?a:null}function ei(i,e,t){if(!Number.isFinite(i))return null;let r=Number.isFinite(e)?e:0,a=Number.isFinite(t)?t:100;return r+i/100*(a-r)}function be(i,e,t=null,r=null){var s;if(!e)return null;let a=Re(i,e.entity,e.attribute);if(a!==null)return a;let n=Ne(i,(s=e.fixed)!=null?s:e.value,null);return n!==null?n:Number.isFinite(e.percent)?ei(e.percent,t,r):null}function Ca(i,e,t=null){var l,o,u,d,c,h,p,b,m,v,f,y;let r=_=>Number.isFinite(_==null?void 0:_.min)&&Number.isFinite(_==null?void 0:_.max)&&_.min<_.max,a={min:Ne(null,(u=(l=e==null?void 0:e.min)==null?void 0:l.fixed)!=null?u:(o=e==null?void 0:e.min)==null?void 0:o.value),max:Ne(null,(h=(d=e==null?void 0:e.max)==null?void 0:d.fixed)!=null?h:(c=e==null?void 0:e.max)==null?void 0:c.value)};if((p=e==null?void 0:e.min)!=null&&p.entity&&((b=e==null?void 0:e.max)!=null&&b.entity)){let _={min:Re(i,e.min.entity,e.min.attribute),max:Re(i,e.max.entity,e.max.attribute)};return r(_)?_:Number.isFinite(_.min)&&Number.isFinite(_.max)&&r(t)?t:e.min.fixed_explicit!==!1&&e.max.fixed_explicit!==!1&&r(a)?a:{min:0,max:100}}let n={min:(m=be(i,e==null?void 0:e.min))!=null?m:0,max:(v=be(i,e==null?void 0:e.max))!=null?v:100};if(r(n))return n;let s={min:(f=a.min)!=null?f:0,max:(y=a.max)!=null?y:100};return r(s)?s:{min:0,max:100}}var ar=H(()=>{he()});function Cn(i,e,t,r=null){return{code:i,message:e,path:t,entity:r}}function nr(i){var e;return!i||i.entity||Number.isFinite(i.percent)?null:B((e=i.fixed)!=null?e:i.value)}function A(i,e,t,r,a=null){i.warnings.push(Cn(e,t,r,a))}function gt(i,e,t,r=null){e!=null&&e.attribute_invalid&&A(i,"source.invalid_attribute","Attribute must be a non-empty string; using the entity state.",t,r)}function wt(i,e,t,r=null){e!=null&&e.entity_invalid&&A(i,"source.invalid_entity_source","Entity source must be an entity ID or `{ id: entity_id, attribute: attribute_name }`; sibling `attribute` is not supported.",t,r)}function es(i,e,t,r=null){var s,l;if((s=e==null?void 0:e.min)!=null&&s.entity&&((l=e==null?void 0:e.max)!=null&&l.entity)){let o=u=>{var d,c;return u.fixed_explicit!==!1&&((d=u.fixed)!=null?d:u.value)!==null&&((c=u.fixed)!=null?c:u.value)!==void 0};o(e.min)!==o(e.max)&&A(i,"scale.orphan_fixed_fallback","Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",`${t}.scale`,r)}let a=nr(e==null?void 0:e.min),n=nr(e==null?void 0:e.max);return Number.isFinite(a)&&Number.isFinite(n)&&a>n&&A(i,"scale.min_gt_max","Scale minimum is greater than maximum.",t,r),{min:a,max:n}}function ts(i,e,t,r,a=null){var o;let n=nr((o=e==null?void 0:e.target_marker)==null?void 0:o.source);if(!Number.isFinite(n))return;let{min:s,max:l}=t;Number.isFinite(s)&&Number.isFinite(l)&&(n<s||n>l)&&A(i,"target.outside_scale","Fixed target value is outside the fixed scale range.",r,a)}function rs(i,e,t,r,a=null){var o;let n=nr((o=e==null?void 0:e.baseline)==null?void 0:o.at);if(!Number.isFinite(n))return;let{min:s,max:l}=t;Number.isFinite(s)&&Number.isFinite(l)&&(n<s||n>l)&&A(i,"baseline.outside_scale","Fixed baseline value is outside the fixed scale range.",r,a)}function is(i){var e;return!!i&&(Number.isFinite(B((e=i.fixed)!=null?e:i.value))||Number.isFinite(i.percent)||!!i.entity)}function as(i,e,t,r=null){var s,l,o,u;let a=((l=(s=e==null?void 0:e.bar)==null?void 0:s.needle)==null?void 0:l.show)===!0,n=((o=e==null?void 0:e.baseline)==null?void 0:o.enabled)!==!1&&is((u=e==null?void 0:e.baseline)==null?void 0:u.at);a&&n&&A(i,"baseline-suppresses-needle","Baseline rendering suppresses the needle marker.",t,r)}function ns(i,e,t,r=null){var a;for(let n of["peak_marker","floor_marker"])(a=e==null?void 0:e[n])!=null&&a.window_invalid&&A(i,`${n}.invalid_window`,"Invalid historical marker window; marker is unavailable.",`${t}.${n}.window`,r)}function ss(i,e,t,r=null){var a;for(let n of["target_marker","peak_marker","floor_marker"])(a=e==null?void 0:e[n])!=null&&a.direction_invalid&&A(i,`${n}.invalid_direction`,"Invalid marker direction; using inward.",`${t}.${n==="target_marker"?"target":n.replace("_marker","")}.direction`,r)}function ls(i,e,t,r=null){var a;for(let[n,s]of[["target_marker","target"],["peak_marker","peak"],["floor_marker","floor"]]){let l=e==null?void 0:e[n],o=`${t}.${s}.label`;l!=null&&l.label_invalid_show&&A(i,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${o}.show`,r),l!=null&&l.label_invalid_text&&A(i,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${o}.text`,r),l!=null&&l.label_invalid_show_value&&A(i,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${o}.show_value`,r),l!=null&&l.label_invalid_show_unit&&A(i,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${o}.show_unit`,r),l!=null&&l.label_invalid_precision&&A(i,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${o}.${(a=l.label_precision_key)!=null?a:"precision"}`,r),l!=null&&l.label_unsupported_unit&&A(i,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${o}.unit`,r)}}function ti(i,e,t,r,a=null){var n,s,l,o,u,d,c,h;t&&A(i,"markers.invalid_list","Markers must be a list; ignoring the malformed value.",r,a);for(let p of e!=null?e:[]){let b=`${r}[${p.index}]`;if(p.malformed){A(i,"markers.invalid_item","Marker must be an object; ignoring this item.",b,a);continue}wt(i,p.source,`${b}.at`,a),p.invalidSource&&!p.invalidPercentage&&!p.unsupportedPercentField&&A(i,"markers.invalid_source","Marker requires a valid fixed value, percentage, or entity source.",`${b}.at`,a),p.invalidPercentage&&A(i,"markers.invalid_percentage","Marker percentage must be between 0 and 100 inclusive.",`${b}.at`,a),p.unsupportedPercentField&&A(i,"markers.invalid_source",'Use a percentage string such as "35%" instead of an at.percent field.',`${b}.at`,a),p.invalidLane&&A(i,"markers.invalid_lane","Marker lane must be above or below; ignoring this marker.",`${b}.lane`,a),p.invalidShape&&A(i,"markers.invalid_shape","Invalid marker shape; using circle.",`${b}.shape`,a),p.invalidDirection&&A(i,"markers.invalid_direction","Invalid marker direction; using inward.",`${b}.direction`,a),p.invalidShowMarker&&A(i,"markers.invalid_show_marker","Marker show_marker must be a boolean; using true.",`${b}.show_marker`,a),(n=p.label)!=null&&n.invalidEntity&&A(i,"markers.invalid_label_entity","Marker label entity must be an entity ID or `{ id, attribute }`; sibling `label.attribute` is not supported.",`${b}.label.entity`,a),(s=p.label)!=null&&s.invalidShow&&A(i,"markers.invalid_label_show","Marker label show must be a boolean; using the existing fallback.",`${b}.label.show`,a),(l=p.label)!=null&&l.invalidText&&A(i,"markers.invalid_label_text","Marker label text must be a string; ignoring it.",`${b}.label.text`,a),(o=p.label)!=null&&o.invalidShowValue&&A(i,"markers.invalid_label_show_value","Marker label show_value must be a boolean; using the inherited or default value.",`${b}.label.show_value`,a),(u=p.label)!=null&&u.invalidShowUnit&&A(i,"markers.invalid_label_show_unit","Marker label show_unit must be a boolean; using the inherited or default value.",`${b}.label.show_unit`,a),(d=p.label)!=null&&d.invalidPrecision&&A(i,"markers.invalid_label_precision","Marker label precision must be a non-negative integer; using the inherited or row precision.",`${b}.label.${(c=p.label.invalidPrecisionKey)!=null?c:"precision"}`,a),(h=p.label)!=null&&h.unsupportedUnit&&A(i,"markers.unsupported_label_unit","Marker label unit is no longer supported; use show_unit instead.",`${b}.label.unit`,a),p.valid&&!p.accepted&&A(i,"markers.excess_capacity","This marker is not rendered because its lane already has four markers.",b,a)}}function en(i){var e;return!i||i.entity||Number.isFinite(i.percent)?null:B((e=i.fixed)!=null?e:i.value)}function os(i,e,t,r,a=null){if(!Array.isArray(e)||!e.length)return;let n=[],{min:s,max:l}=t;for(let u=0;u<e.length;u+=1){let d=e[u],c=en(d==null?void 0:d.from),h=en(d==null?void 0:d.to),p=`${r}.segments[${u}]`;if((d==null?void 0:d.invalidBoundary)==="entity"){A(i,"segments.unsupported_entity_boundary","Entity-backed segment boundaries are not supported; ignoring this segment.",p,a);continue}if((d==null?void 0:d.invalidBoundary)==="malformed_percent"){A(i,"segments.invalid_percentage","Malformed percentage segment boundary; ignoring this segment.",p,a);continue}if(d!=null&&d.invalidBoundary){A(i,"segments.invalid_boundary",'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.',p,a);continue}Number.isFinite(c)&&Number.isFinite(h)&&c>h&&A(i,"segments.from_gt_to","Segment start is greater than segment end.",p,a),Number.isFinite(s)&&Number.isFinite(l)&&(Number.isFinite(c)&&(c<s||c>l)&&A(i,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,a),Number.isFinite(h)&&(h<s||h>l)&&A(i,"segments.outside_scale","Segment boundary is outside the fixed scale range.",p,a)),Number.isFinite(c)&&Number.isFinite(h)&&n.push({from:c,to:h,path:p})}let o=[...n].sort((u,d)=>u.from-d.from);for(let u=1;u<o.length;u+=1){let d=o[u-1],c=o[u];c.from<d.to&&A(i,"segments.overlap","Fixed segments overlap.",c.path,a)}}function us(i,e,t,r=null){var n;if(!Array.isArray(e))return;let a=new Set;for(let s=0;s<e.length;s+=1){let l=B((n=e[s])==null?void 0:n.pos),o=`${t}.gradient_stops[${s}]`;Number.isFinite(l)&&(l<0||l>100)&&A(i,"gradient_stops.outside_range","Gradient stop position is outside 0..100.",o,r),Number.isFinite(l)&&(a.has(l)?A(i,"duplicate-gradient-stop-position","Multiple gradient stops use the same position value.",o,r):a.add(l))}}function tn(i,e,t,r=null){var n,s,l,o,u,d,c,h,p,b,m,v;(n=e==null?void 0:e.scale)!=null&&n.direction_invalid&&A(i,"scale.invalid_direction","Scale direction must be `normal` or `reverse`; using the inherited or default direction.",`${t}.scale.direction`,r),(s=e==null?void 0:e.bar)!=null&&s.direction_invalid&&A(i,"bar.invalid_direction","Bar direction must be `normal` or `reverse`; using the inherited or default direction.",`${t}.bar.direction`,r),gt(i,e,`${t}.attribute`,r),gt(i,(l=e==null?void 0:e.scale)==null?void 0:l.min,`${t}.scale.min.attribute`,r),gt(i,(o=e==null?void 0:e.scale)==null?void 0:o.max,`${t}.scale.max.attribute`,r),gt(i,(u=e==null?void 0:e.baseline)==null?void 0:u.at,`${t}.baseline.at.attribute`,r),gt(i,(d=e==null?void 0:e.target_marker)==null?void 0:d.source,`${t}.target.at.attribute`,r),wt(i,(c=e==null?void 0:e.scale)==null?void 0:c.min,`${t}.scale.min`,r),wt(i,(h=e==null?void 0:e.scale)==null?void 0:h.max,`${t}.scale.max`,r),wt(i,(p=e==null?void 0:e.baseline)==null?void 0:p.at,`${t}.baseline.at`,r),wt(i,(b=e==null?void 0:e.target_marker)==null?void 0:b.source,`${t}.target.at`,r);let a=es(i,e==null?void 0:e.scale,t,r);ts(i,e,a,t,r),rs(i,e,a,t,r),as(i,e,t,r),ns(i,e,t,r),ss(i,e,t,r),ls(i,e,t,r),os(i,(m=e==null?void 0:e.bar)==null?void 0:m.segments,a,`${t}.bar`,r),us(i,(v=e==null?void 0:e.bar)==null?void 0:v.gradient_stops,`${t}.bar`,r)}function sr(i){var a,n;let e={warnings:[],errors:[]};if(!i||typeof i!="object")return e;tn(e,i,"card"),ti(e,i.generic_markers,i.generic_markers_invalid,"markers");let t=new Set,r=Array.isArray(i.entities)?i.entities:[];for(let s=0;s<r.length;s+=1){let l=r[s],o=(a=l==null?void 0:l.entity)!=null?a:null,u=`entities[${s}]`;if(!o){A(e,"entities.missing_entity","Entity row is missing an entity id.",u,null);continue}if(t.has(o)?A(e,"entities.duplicate_entity","Duplicate entity id in the same card config.",u,o):t.add(o),tn(e,l,u,o),Object.prototype.hasOwnProperty.call(l,"markers"))ti(e,l.generic_markers,l.generic_markers_invalid,`${u}.markers`,o);else{let d=((n=l.generic_markers)!=null?n:[]).filter(c=>{var h,p;return c.valid&&!c.accepted&&((p=(h=i.generic_markers)==null?void 0:h[c.index])==null?void 0:p.accepted)===!0});d.length&&ti(e,d,!1,`${u}.markers`,o)}}return e}var ri=H(()=>{he()});function ae(i,e="normal"){if(!Number.isFinite(i))return null;let t=Math.min(100,Math.max(0,i));return e==="reverse"?100-t:t}function lr(i,e,t="normal"){let r=ae(i,t),a=ae(e,t);return!Number.isFinite(r)||!Number.isFinite(a)?null:{start:Math.min(r,a),end:Math.max(r,a)}}var ii=H(()=>{});function fe(i,e=null){return Number.isFinite(i)?e!==null?i.toLocaleString(void 0,{minimumFractionDigits:e,maximumFractionDigits:e}):i.toLocaleString():String(i)}function ai(i){return["h","m","s"].includes(String(i||"").trim())}function ni(i,e){if(!e)return String(i);let t=String(e);return`${i}${ai(t)?"":" "}${t}`}function xt(i,e,t=null){let r=fe(i,t),a=e?String(e):"";return{value:i,number:r,unit:a,text:ni(r,a)}}function kt(i,e,t=null,r={}){let a=typeof r.text=="string"?r.text:"",n=r.showValue===!1||i===null||i===void 0||i===""?"":Number.isFinite(i)?fe(i,t):String(i),s=r.showUnit===!1?"":String(e!=null?e:"").trim(),l=[a,n,s].filter(Boolean).join(" ");return{value:Number.isFinite(i)?i:null,semanticText:a,number:n,unit:s,showValue:r.showValue!==!1,showUnit:r.showUnit!==!1,text:l}}function rn(i){let e=String(i);return{value:null,number:e,unit:"",text:e}}var or=H(()=>{});function an(i){return i?i.entity!==null&&i.entity!==void 0&&i.entity!==""||i.fixed!==null&&i.fixed!==void 0&&i.fixed!==""||Number.isFinite(i.percent):!1}function dr(i,e="circle"){return ds.has(i)?i:e}function ur({id:i,type:e,value:t=null,position:r=null,lane:a,visible:n=!1,color:s=null,label:l=null,labelVisible:o=!1,shape:u="circle",direction:d="inward",showMarker:c=!0}){return{id:i,type:e,value:t,position:r,lane:a,visible:n===!0,color:s,label:l,labelVisible:o===!0,shape:dr(u),direction:d,showMarker:c!==!1}}function pe(i){return!!(typeof(i==null?void 0:i.text)=="string"&&i.text.trim())||(i==null?void 0:i.showValue)!==!1||(i==null?void 0:i.showUnit)!==!1}function cr(i){var n;let e=i==null?void 0:i.target_marker,t=i==null?void 0:i.peak_marker,r=i==null?void 0:i.floor_marker,a=((n=i==null?void 0:i.generic_markers)!=null?n:[]).filter(s=>s.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&an(e==null?void 0:e.source)||(r==null?void 0:r.show)===!0||a.some(s=>s.lane==="below"),above:(t==null?void 0:t.show)===!0||a.some(s=>s.lane==="above")}}function hr(i){var n;let e=i==null?void 0:i.target_marker,t=i==null?void 0:i.peak_marker,r=i==null?void 0:i.floor_marker,a=((n=i==null?void 0:i.generic_markers)!=null?n:[]).filter(s=>s.accepted);return{below:(e==null?void 0:e.enabled)!==!1&&an(e==null?void 0:e.source)&&(e==null?void 0:e.show_label)===!0&&pe({text:e.label_text,showValue:e.label_show_value,showUnit:e.label_show_unit})||(r==null?void 0:r.show)===!0&&(r==null?void 0:r.show_label)===!0&&pe({text:r.label_text,showValue:r.label_show_value,showUnit:r.label_show_unit})||a.some(s=>{var l;return s.lane==="below"&&((l=s.label)==null?void 0:l.show)===!0&&pe(s.label)}),above:(t==null?void 0:t.show)===!0&&(t==null?void 0:t.show_label)===!0&&pe({text:t.label_text,showValue:t.label_show_value,showUnit:t.label_show_unit})||a.some(s=>{var l;return s.lane==="above"&&((l=s.label)==null?void 0:l.show)===!0&&pe(s.label)})}}function pr({entityConfig:i,targetValue:e=null,targetPosition:t=null,targetPresentation:r=null,targetLabelPresentation:a=null,targetVisible:n=Number.isFinite(t),peakValue:s=null,peakPosition:l=null,peakPresentation:o=null,peakLabelPresentation:u=null,peakVisible:d=Number.isFinite(l),peakStatus:c=null,floorValue:h=null,floorPosition:p=null,floorPresentation:b=null,floorLabelPresentation:m=null,floorVisible:v=Number.isFinite(p),floorStatus:f=null,genericMarkers:y=[]}){var S,k,R,M,N,$,F;let _=i==null?void 0:i.target_marker,x=i==null?void 0:i.peak_marker,g=i==null?void 0:i.floor_marker,w=(_==null?void 0:_.enabled)!==!1;return[ur({id:"target",type:"target",value:e,position:t,lane:"below",visible:w&&n,color:(S=_==null?void 0:_.color)!=null?S:null,label:a!=null?a:r,labelVisible:w&&(_==null?void 0:_.show_label)===!0&&pe({text:_.label_text,showValue:_.label_show_value,showUnit:_.label_show_unit}),shape:(k=_==null?void 0:_.shape)!=null?k:"diamond",direction:(R=_==null?void 0:_.direction)!=null?R:"inward"}),{...ur({id:"floor",type:"floor",value:h,position:p,lane:"below",visible:(g==null?void 0:g.show)===!0&&v,color:(M=g==null?void 0:g.color)!=null?M:null,label:m!=null?m:b,labelVisible:(g==null?void 0:g.show)===!0&&(g==null?void 0:g.show_label)===!0&&pe({text:g.label_text,showValue:g.label_show_value,showUnit:g.label_show_unit}),shape:"triangle",direction:(N=g==null?void 0:g.direction)!=null?N:"inward"}),historyStatus:f},{...ur({id:"peak",type:"peak",value:s,position:l,lane:"above",visible:(x==null?void 0:x.show)===!0&&d,color:($=x==null?void 0:x.color)!=null?$:null,label:u!=null?u:o,labelVisible:(x==null?void 0:x.show)===!0&&(x==null?void 0:x.show_label)===!0&&pe({text:x.label_text,showValue:x.label_show_value,showUnit:x.label_show_unit}),shape:"triangle",direction:(F=x==null?void 0:x.direction)!=null?F:"inward"}),historyStatus:c},...y.map(I=>ur({id:I.id,type:"generic",value:I.value,position:I.position,lane:I.lane,visible:I.visible,color:I.color,label:I.label,labelVisible:I.labelVisible&&pe(I.label),shape:I.shape,direction:I.direction,showMarker:I.showMarker}))]}var ds,mr=H(()=>{ds=new Set(["circle","diamond","triangle","chevron","arrow","pin"])});function cs(i,e=""){var n,s,l;let t=String((s=(n=i==null?void 0:i.attributes)==null?void 0:n.device_class)!=null?s:"").trim();if(t){let o={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(o[t])return o[t]}let r=String(e||"").split(".")[0];return(l={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[r])!=null?l:null}function we(i,e,t){if(!Number.isFinite(i))return null;let r=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(i-r)/n*100))}function hs(i){let e=String(i||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let a=t[1],n=a.length===3?a.split("").map(s=>s+s).join(""):a;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let r=e.match(/^rgba?\(([^)]+)\)$/i);if(r){let a=r[1].split(",").map(n=>n.trim());if(a.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(a[0]))),g:Math.max(0,Math.min(255,parseFloat(a[1]))),b:Math.max(0,Math.min(255,parseFloat(a[2])))}}return null}function nn(i){let e=hs(i);if(!e)return"#000000";let t=a=>{let n=a/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function ps(i,e,t,r,a,n){var d,c,h;let s=(d=i==null?void 0:i.bar)==null?void 0:d.needle;if(!(s!=null&&s.show)||Number.isFinite(a)||!Number.isFinite(e)){let p=(c=s==null?void 0:s.color)!=null?c:"#ffffff";return{show:!1,percent:null,pct:null,color:p,borderColor:nn(p),edge:"middle"}}let l=(h=s.color)!=null?h:"#ffffff",o=we(e,t,r),u=ae(o,n);return{show:!0,percent:o,pct:u,positionPercent:u,color:l,borderColor:nn(l),edge:u<=0?"left":u>=100?"right":"middle"}}function sn(i,e,t,r){var n;let a=r&&["available","partial","stale"].includes(t==null?void 0:t.status)?B(t==null?void 0:t.value):null;return{value:a,percent:Number.isFinite(a)?we(a,i,e):null,visible:Number.isFinite(a),status:(n=t==null?void 0:t.status)!=null?n:"pending"}}function St(i){var ie,C,se,ue,oe,ye,Wt,We,qe,De,Ve,Le,Oe,Be,Ee,He,je,Ue,Ke,Ge,Je,Ye,Ze,Xe,Qe,Ce,et,tt,rt,it,at,nt,st,ee,lt,ot,Hi,ji,Ui,Ki,Gi,Ji,Yi,Zi,Xi,Qi,Ci,ea,ta,ra,ia,aa,na,sa,la,oa,ua,da,ca,ha,pa,ma,ba;let{hass:e,cardConfig:t,entityConfig:r,entityState:a,historicalExtrema:n,previousScale:s}=i,l=(ie=r==null?void 0:r.entity)!=null?ie:null,o=Cr(a,r==null?void 0:r.attribute),u=o.found&&!o.available?(C=o.stateObj)==null?void 0:C.state:null,d=u!=null?u:o.available&&o.attributeFound?o.value:"",c=typeof d=="string"||typeof d=="number"||typeof d=="boolean"?d:"",h=o.available&&o.attributeFound?B(o.value):null,p=(ue=(se=a==null?void 0:a.attributes)==null?void 0:se.unit_of_measurement)!=null?ue:"",b=(oe=r==null?void 0:r.formatting)==null?void 0:oe.unit,m=(ye=b!=null?b:p)!=null?ye:"",v=h!==null?m:"",{min:f,max:y}=Ca(e,r==null?void 0:r.scale,s),_=(We=(Wt=r==null?void 0:r.scale)==null?void 0:Wt.direction)!=null?We:"normal",x=h!==null?we(h,f,y):0,g=h!==null?ae(x,_):null,w=(De=(qe=r==null?void 0:r.formatting)==null?void 0:qe.decimal)!=null?De:null,S=h===null?rn(c):xt(h,v,w),k=((Ve=r==null?void 0:r.target_marker)==null?void 0:Ve.enabled)===!1?null:be(e,(Le=r==null?void 0:r.target_marker)==null?void 0:Le.source,f,y),R=k!==null?we(k,f,y):null,M=ae(R,_),N=k!==null,$=(Be=(Oe=r==null?void 0:r.target_marker)==null?void 0:Oe.label_decimal)!=null?Be:w,F=k!==null?xt(k,m,$):null,I=k!==null?kt(k,m,(He=(Ee=r==null?void 0:r.target_marker)==null?void 0:Ee.label_precision)!=null?He:$,{text:(je=r==null?void 0:r.target_marker)==null?void 0:je.label_text,showValue:(Ue=r==null?void 0:r.target_marker)==null?void 0:Ue.label_show_value,showUnit:(Ke=r==null?void 0:r.target_marker)==null?void 0:Ke.label_show_unit}):null,P=((Ge=r==null?void 0:r.baseline)==null?void 0:Ge.enabled)===!1?null:be(e,(Je=r==null?void 0:r.baseline)==null?void 0:Je.at,f,y),L=Number.isFinite(P)?we(P,f,y):null,W=ae(L,_),O=Number.isFinite(P),q=sn(f,y,n==null?void 0:n.peak,((Ye=r==null?void 0:r.peak_marker)==null?void 0:Ye.show)===!0),D=sn(f,y,n==null?void 0:n.floor,((Ze=r==null?void 0:r.floor_marker)==null?void 0:Ze.show)===!0),T=(Qe=(Xe=r==null?void 0:r.peak_marker)==null?void 0:Xe.label_decimal)!=null?Qe:w,j=(et=(Ce=r==null?void 0:r.floor_marker)==null?void 0:Ce.label_decimal)!=null?et:w,Y=(rt=(tt=r==null?void 0:r.peak_marker)==null?void 0:tt.label_precision)!=null?rt:T,V=(at=(it=r==null?void 0:r.floor_marker)==null?void 0:it.label_precision)!=null?at:j,E=q.visible?xt(q.value,m,T):null,z=D.visible?xt(D.value,m,j):null,U=q.visible?kt(q.value,m,Y,{text:(nt=r==null?void 0:r.peak_marker)==null?void 0:nt.label_text,showValue:(st=r==null?void 0:r.peak_marker)==null?void 0:st.label_show_value,showUnit:(ee=r==null?void 0:r.peak_marker)==null?void 0:ee.label_show_unit}):null,X=D.visible?kt(D.value,m,V,{text:(lt=r==null?void 0:r.floor_marker)==null?void 0:lt.label_text,showValue:(ot=r==null?void 0:r.floor_marker)==null?void 0:ot.label_show_value,showUnit:(Hi=r==null?void 0:r.floor_marker)==null?void 0:Hi.label_show_unit}):null,Z=((ji=r==null?void 0:r.generic_markers)!=null?ji:[]).filter(K=>K.accepted).map(K=>{var va,_a,ya,ga,wa;let ut=be(e,K.source,f,y),zr=Number.isFinite(ut),Sn=(va=K.label.precision)!=null?va:w,ce=K.label.entity?yt(e,K.label.entity,K.label.attribute):null,Wr=ce==null?void 0:ce.value,ke=typeof Wr=="string"?Wr.trim():Wr,fa=(ce==null?void 0:ce.found)&&ce.available&&ce.attributeFound&&ke!==null&&ke!==void 0&&ke!==""&&!["unknown","unavailable"].includes(String(ke).trim().toLowerCase()),Mn=K.label.entity?fa?(_a=B(ke))!=null?_a:String(ke):null:ut,Rn=K.label.entity?fa&&(wa=(ga=(ya=ce.stateObj)==null?void 0:ya.attributes)==null?void 0:ga.unit_of_measurement)!=null?wa:"":m,Nn=K.label.show?kt(Mn,Rn,Sn,{text:K.label.text,showValue:K.label.showValue,showUnit:K.label.showUnit}):null;return{id:K.id,value:ut,scalePercent:zr?we(ut,f,y):null,position:zr?ae(we(ut,f,y),_):null,lane:K.lane,visible:zr,color:K.color,shape:K.shape,direction:K.direction,showMarker:K.showMarker,label:Nn,labelVisible:K.label.show}}),Q=pr({entityConfig:r,targetValue:k,targetPosition:M,targetPresentation:F,targetLabelPresentation:I,targetVisible:N,peakValue:q.value,peakPosition:ae(q.percent,_),peakPresentation:E,peakLabelPresentation:U,peakVisible:q.visible,peakStatus:q.status,floorValue:D.value,floorPosition:ae(D.percent,_),floorPresentation:z,floorLabelPresentation:X,floorVisible:D.visible,floorStatus:D.status,genericMarkers:Z});return{entityId:l,name:(Gi=(Ki=r==null?void 0:r.name)!=null?Ki:(Ui=a==null?void 0:a.attributes)==null?void 0:Ui.friendly_name)!=null?Gi:l,icon:(r==null?void 0:r.icon)===!1?!1:(Zi=(Yi=r==null?void 0:r.icon)!=null?Yi:(Ji=a==null?void 0:a.attributes)==null?void 0:Ji.icon)!=null?Zi:cs(a,l),state:c,numericValue:h,rawUnit:p,min:f,max:y,percent:x,positionPercent:g,displayValue:S.number,displayUnit:S.unit,primaryPresentation:S,unit:S.unit,barColor:(Qi=(Xi=r==null?void 0:r.bar)==null?void 0:Xi.color)!=null?Qi:null,fillStyle:(ea=(Ci=r==null?void 0:r.bar)==null?void 0:Ci.fill_style)!=null?ea:null,target:k,targetPercent:R,targetPositionPercent:M,targetDisplay:(ta=F==null?void 0:F.text)!=null?ta:null,targetPresentation:F,targetLabelPresentation:I,targetVisible:N,baseline:P,baselinePercent:L,baselinePositionPercent:W,baselineVisible:O,peak:q.value,peakPercent:q.percent,peakDisplay:(ra=E==null?void 0:E.number)!=null?ra:null,peakPresentation:E,peakLabelPresentation:U,peakVisible:q.visible,peakStatus:q.status,floor:D.value,floorPercent:D.percent,floorDisplay:(ia=z==null?void 0:z.number)!=null?ia:null,floorPresentation:z,floorLabelPresentation:X,floorVisible:D.visible,floorStatus:D.status,markers:Q,markerLaneOccupancy:cr(r),markerLabelLaneOccupancy:hr(r),segments:(na=(aa=r==null?void 0:r.bar)==null?void 0:aa.segments)!=null?na:null,gradientStops:(la=(sa=r==null?void 0:r.bar)==null?void 0:sa.gradient_stops)!=null?la:null,needle:ps(r,h,f,y,L,_),classes:{labelPosition:(da=(ua=(oa=r==null?void 0:r.layout)==null?void 0:oa.label)==null?void 0:ua.position)!=null?da:"left",animated:((ca=r==null?void 0:r.bar)==null?void 0:ca.animated)!==!1},attributes:{entity:l,baseHeight:(pa=(ha=r==null?void 0:r.layout)==null?void 0:ha.height)!=null?pa:38,heightExplicit:((ma=r==null?void 0:r.layout)==null?void 0:ma.height_explicit)===!0,barAnimated:((ba=r==null?void 0:r.bar)==null?void 0:ba.animated)!==!1}}}var si=H(()=>{ar();he();ii();or();mr()});function te(i){return i==null?"":String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function J(i,e,t){var n,s;if(!(i!=null&&i.style))return!1;let r=t==null?"":String(t);return e.startsWith("--")?(typeof i.style.getPropertyValue=="function"?i.style.getPropertyValue(e):(n=i.style[e])!=null?n:"")===r?!1:(typeof i.style.setProperty=="function"?i.style.setProperty(e,r):i.style[e]=r,!0):((s=i.style[e])!=null?s:"")===r?!1:(i.style[e]=r,!0)}function $e(i,e){var a;if(!(i!=null&&i.style))return!1;let t=e==null?"":String(e);return((a=i.style.cssText)!=null?a:"")===t?!1:(i.style.cssText=t,!0)}function le(i,e,t){var n;if(!(i!=null&&i.dataset))return!1;let r=t==null?"":String(t);return((n=i.dataset[e])!=null?n:"")===r?!1:(i.dataset[e]=r,!0)}function br(i,e){var r;if(!i)return!1;let t=e==null?"":String(e);return((r=i.className)!=null?r:"")===t?!1:(i.className=t,!0)}var fr=H(()=>{});function ms(i){var r,a,n;let e=(n=(a=(r=i==null?void 0:i.lu)!=null?r:i==null?void 0:i.last_updated)!=null?a:i==null?void 0:i.lc)!=null?n:i==null?void 0:i.last_changed;if(typeof e=="number"&&Number.isFinite(e))return e>1e12?e:e*1e3;let t=Date.parse(String(e!=null?e:""));return Number.isFinite(t)?t:null}function li(i){var e;return(e=i==null?void 0:i.s)!=null?e:i==null?void 0:i.state}function bs(i){var e,t;return(t=(e=i==null?void 0:i.a)!=null?e:i==null?void 0:i.attributes)!=null?t:null}function fs(i,e){var a;let t=String((a=li(i))!=null?a:"").trim();if(t.toLowerCase()==="unknown"||t.toLowerCase()==="unavailable")return null;if(!e)return B(li(i));let r=bs(i);return!r||!Object.prototype.hasOwnProperty.call(r,e)?null:B(r[e])}function ln(i){if(!Array.isArray(i)||!i.length)throw new TypeError("At least one history source is required");return i.map(e=>{var a,n,s;let t=typeof e=="string"?e:(a=e==null?void 0:e.entityId)!=null?a:e==null?void 0:e.entity,r=typeof e=="object"&&e&&(n=e.attribute)!=null?n:null;if(typeof t!="string"||!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(t))throw new TypeError(`Invalid history entity ID: ${t}`);if(r!==null&&(typeof r!="string"||!r.trim()))throw new TypeError("History source attribute must be a non-empty string");return{entityId:t.trim(),attribute:(s=r==null?void 0:r.trim())!=null?s:null}})}function vs(i,e,t,r=Date.now()){var s,l,o,u,d,c;if(!i||typeof i!="object"||Array.isArray(i))throw new TypeError("Home Assistant returned an invalid history response");let a=ln(e),n=new Map;for(let h of a){let p=i[h.entityId];if(p!==void 0&&!Array.isArray(p))throw new TypeError(`Home Assistant returned an invalid history list for ${h.entityId}`);let b=(p!=null?p:[]).map((_,x)=>{var w;let g=ms(_);return g===null||g>=t.end||g>r?null:{entityId:h.entityId,attribute:h.attribute,timestamp:g,value:fs(_,h.attribute),state:(w=li(_))!=null?w:null,boundaryEffective:g<t.start,transitionInWindow:g>=t.start&&g<t.end,order:x,orderKnown:!0,origin:"recorder"}}).filter(Boolean).sort((_,x)=>_.timestamp-x.timestamp||_.order-x.order),m=(s=b.filter(_=>_.timestamp<=t.start).at(-1))!=null?s:null,v=(o=(l=b[0])==null?void 0:l.timestamp)!=null?o:null,f=(d=(u=b.at(-1))==null?void 0:u.timestamp)!=null?d:null,y=re(h);n.set(y,{source:h,observations:b,status:b.some(_=>Number.isFinite(_.value))?"available":"unavailable",retrievedAt:r,observedThrough:f,requestedWindow:{start:t.start,end:t.end},coverage:{complete:!1,kind:"unknown",reason:"Recorder history does not report retention or interval completeness",requested:{start:t.start,end:t.end},observed:{firstTimestamp:v,lastTimestamp:f},boundaryState:{requested:!0,found:m!==null,timestamp:(c=m==null?void 0:m.timestamp)!=null?c:null},futureInterval:t.end>r}})}return n}function re(i){var e;return`${i.entityId}\0${(e=i.attribute)!=null?e:""}`}async function on(i,e,t,r=Date.now){if(typeof(i==null?void 0:i.callWS)!="function")throw new TypeError("Home Assistant callWS is required");let a=ln(e),n=[...new Set(a.map(l=>l.entityId))].sort(),s=await i.callWS({type:"history/history_during_period",start_time:new Date(t.start).toISOString(),end_time:new Date(t.end).toISOString(),entity_ids:n,include_start_time_state:!0,significant_changes_only:!1,minimal_response:a.every(l=>!l.attribute),no_attributes:a.every(l=>!l.attribute)});return vs(s,a,t,r())}var oi=H(()=>{he()});function vr(i){var r,a,n;let e=typeof i=="string"?i:(r=i==null?void 0:i.entityId)!=null?r:i==null?void 0:i.entity,t=typeof i=="object"&&i&&(a=i.attribute)!=null?a:null;if(typeof e!="string"||!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(e.trim()))throw new TypeError(`Invalid history entity ID: ${e}`);if(t!==null&&(typeof t!="string"||!t.trim()))throw new TypeError("History source attribute must be a non-empty string");return{entityId:e.trim(),attribute:(n=t==null?void 0:t.trim())!=null?n:null}}function de(i,e={}){var t,r;return{...i,observations:((t=i.observations)!=null?t:[]).map(a=>({...a})),coverage:{...(r=i.coverage)!=null?r:{}},requestedWindow:i.requestedWindow?{...i.requestedWindow}:null,acquiredWindow:i.acquiredWindow?{...i.acquiredWindow}:null,...e}}function _s(i){var r;let e=(r=i==null?void 0:i.last_updated)!=null?r:i==null?void 0:i.last_changed,t=e instanceof Date?e.getTime():Date.parse(String(e!=null?e:""));return Number.isFinite(t)?t:null}function ys(i,e){var t,r;return!i||["unknown","unavailable"].includes(String((t=i.state)!=null?t:"").trim().toLowerCase())?null:e?B((r=i.attributes)==null?void 0:r[e]):B(i.state)}function gs(i,e){return i.timestamp-e.timestamp||i.order-e.order}function ui(...i){var t;let e=new Map;for(let r of i.flat()){let a=r.origin==="live"?`live:${r.order}`:`recorder:${(t=r.orderDomain)!=null?t:""}:${r.timestamp}:${r.order}:${String(r.value)}:${String(r.state)}`;e.has(a)||e.set(a,r)}return[...e.values()].sort(gs)}function Mt(i,e={}){let t=i!=null&&i.connection&&typeof i.connection=="object"?i.connection:i;if(!t||typeof t!="object")throw new TypeError("A Home Assistant connection is required");return di.has(t)||di.set(t,new ci(e)),di.get(t)}var ci,di,hi=H(()=>{he();oi();ci=class{constructor({provider:e=on,now:t=Date.now,ttlMs:r=3e4,maxEntries:a=128,maxObservations:n=5e4,maxConsumerObservations:s=1e4,maxConsumers:l=256,requestTimeoutMs:o=3e4}={}){if(typeof e!="function")throw new TypeError("provider must be a function");this.provider=e,this.now=t,this.ttlMs=r,this.maxEntries=a,this.maxObservations=n,this.maxConsumerObservations=s,this.maxConsumers=l,this.requestTimeoutMs=o,this.cache=new Map,this.inflight=new Map,this.generations=new Map,this.queue=[],this.flushScheduled=!1,this.consumers=new Map,this.journals=new Map,this.acceptedFlights=new Map,this.nextFlightId=0,this.nextConsumerId=0,this.liveSequence=0}request({hass:e,sources:t,window:r,force:a=!1}){if(!r||typeof r.cacheKey!="string"||!Number.isFinite(r.start)||!Number.isFinite(r.end)||r.end<=r.start)throw new TypeError("A resolved positive-duration time window is required");if(!Array.isArray(t))throw new TypeError("History sources must be an array");let n=[...new Map(t.map(l=>{let o=vr(l);return[re(o),o]})).values()],s=n.map(l=>this._requestSource(e,l,r,a));return Promise.all(s).then(l=>new Map(l.map((o,u)=>[re(n[u]),this._decorateForActiveConsumers(n[u],r,o)])))}_cacheKey(e,t){return`${re(e)}${t.cacheKey}`}_covers(e,t){let r=e==null?void 0:e.acquiredWindow;return!r||r.start>t.start?!1:r.end>=t.end}_requestSource(e,t,r,a){var b;let n=this._cacheKey(t,r),s=this._touch(n);if(!a&&s&&!s.stale&&this.now()-s.fetchedAt<this.ttlMs&&this._covers(s,r))return Promise.resolve(de(s,{cache:"hit",stale:!1,requestedWindow:{start:r.start,end:r.end}}));let l=(b=this.generations.get(n))!=null?b:0,o=re(t),u=this.queue.find(m=>m.cacheKey===n&&m.generation===l&&re(m.source)===o);if(u)return u.window={...u.window,start:Math.min(u.window.start,r.start),end:Math.max(u.window.end,r.end)},u.promise.then(m=>de(m,{requestedWindow:{start:r.start,end:r.end}}));let d=[...this.inflight.values()].find(m=>m.cacheKey===n&&m.generation===l&&m.sourceKey===o&&m.window.start<=r.start&&m.window.end>=r.end);if(d)return d.promise.then(m=>de(m,{requestedWindow:{start:r.start,end:r.end}}));let c,h=new Promise(m=>{c=m}),p={id:++this.nextFlightId,hass:e,source:t,sourceKey:o,window:{...r},requestedWindow:{start:r.start,end:r.end},cacheKey:n,generation:l,resolve:c,promise:h,startedAt:this.now()};return this.inflight.set(p.id,p),this.queue.push(p),this._scheduleFlush(),h.then(m=>de(m,{requestedWindow:{start:r.start,end:r.end}}))}_scheduleFlush(){this.flushScheduled||(this.flushScheduled=!0,Promise.resolve().then(()=>this._flush()))}async _flush(){this.flushScheduled=!1;let e=this.queue.splice(0),t=new Map;for(let r of e){let a=`${r.window.cacheKey}\0${r.window.timeZone}`;t.has(a)||t.set(a,[]),t.get(a).push(r)}await Promise.all([...t.values()].map(async r=>{var o,u,d,c,h,p,b,m,v,f,y,_,x,g;let a={...r[0].window,start:Math.min(...r.map(w=>w.window.start)),end:Math.max(...r.map(w=>w.window.end))},n=[...new Map(r.map(w=>[w.sourceKey,w.source])).values()],s,l=null;try{let w=this.provider(r[0].hass,n,a,this.now);if(Number.isFinite(this.requestTimeoutMs)&&this.requestTimeoutMs>0){let S;try{s=await Promise.race([w,new Promise((k,R)=>{S=setTimeout(()=>R(new Error("Recorder history request timed out")),this.requestTimeoutMs)})])}finally{clearTimeout(S)}}else s=await w}catch(w){l=w}for(let w of r){let S=(o=this.generations.get(w.cacheKey))!=null?o:0,k=this.acceptedFlights.get(w.cacheKey),R=w.id<((u=k==null?void 0:k.id)!=null?u:0),M=s==null?void 0:s.get(w.sourceKey),N=this.journals.get(w.cacheKey),$=(d=this.cache.get(w.cacheKey))!=null?d:N!=null&&N.recordMetadata?{...N.recordMetadata,observations:N.observations}:null,F;if(R)F=k!=null&&k.record?de(k.record,{cache:"superseded"}):{source:w.source,observations:[],status:"stale",stale:!0,coverage:{complete:!1,kind:"unknown",reason:"Superseded acquisition"}};else if(l&&S===w.generation)F=$?de($,{status:"stale",stale:!0,error:l,cache:"stale"}):{source:w.source,observations:[],status:"unavailable",stale:!1,retrievedAt:this.now(),observedThrough:null,requestedWindow:w.requestedWindow,acquiredWindow:null,error:l,coverage:{complete:!1,kind:"unknown",reason:"History provider request failed",requested:w.requestedWindow}},$&&this.cache.has(w.cacheKey)&&this.cache.set(w.cacheKey,F);else if(S!==w.generation)F=$?de($,{stale:!0,cache:"superseded"}):M?{...M,status:"stale",stale:!0,coverage:{...M.coverage,reason:"Superseded by an invalidation"}}:{source:w.source,observations:[],status:"stale",stale:!0,retrievedAt:this.now(),observedThrough:null,requestedWindow:w.requestedWindow,acquiredWindow:{start:a.start,end:a.end},coverage:{complete:!1,kind:"unknown",reason:"Superseded by an invalidation"}};else if(!M)F={source:w.source,observations:[],status:"unavailable",stale:!1,retrievedAt:this.now(),observedThrough:null,requestedWindow:w.requestedWindow,acquiredWindow:null,coverage:{complete:!1,kind:"unknown",reason:"History response omitted the requested source",requested:w.requestedWindow}};else{let I=[...this.journals.entries()].filter(([T])=>T.startsWith(`${w.sourceKey}`)).flatMap(([,T])=>T.observations.filter(j=>j.origin==="live")),P=(c=$==null?void 0:$.observations.filter(T=>T.origin==="live"))!=null?c:[],L=((h=M.observations)!=null?h:[]).map(T=>({...T,orderDomain:`recorder:${w.id}`})),W=ui(L,P,I).map(T=>({...T,boundaryEffective:T.timestamp<w.requestedWindow.start,transitionInWindow:T.timestamp>=w.requestedWindow.start&&T.timestamp<w.requestedWindow.end})),O=(p=W.filter(T=>T.timestamp<=w.requestedWindow.start).at(-1))!=null?p:null,q=(m=(b=W.at(-1))==null?void 0:b.timestamp)!=null?m:null,D=W.filter(T=>T.origin==="live").reduce((T,j)=>Math.max(T,j.timestamp),-1/0);F={...M,observations:W,requestedWindow:w.requestedWindow,acquiredWindow:{start:a.start,end:Math.min(a.end,this.now())},fetchedAt:this.now(),requestStartedAt:w.startedAt,acquisitionId:w.id,liveThrough:Number.isFinite(D)?D:null,observedThrough:q,coverage:{...M.coverage,recorderObserved:{...(f=(v=M.coverage)==null?void 0:v.observed)!=null?f:{}},requested:{...w.requestedWindow},acquisitionRequest:{start:a.start,end:a.end},observed:{...(_=(y=M.coverage)==null?void 0:y.observed)!=null?_:{}},liveObserved:Number.isFinite(D)?{firstTimestamp:W.filter(T=>T.origin==="live").reduce((T,j)=>Math.min(T,j.timestamp),1/0),lastTimestamp:D}:{firstTimestamp:null,lastTimestamp:null},boundaryState:{requested:!0,found:O!==null,timestamp:(x=O==null?void 0:O.timestamp)!=null?x:null,origin:(g=O==null?void 0:O.origin)!=null?g:null},futureInterval:w.requestedWindow.end>this.now(),...Number.isFinite(D)?{liveObservedThrough:D}:{}},cache:"miss",stale:!1},this._store(w.cacheKey,F)}!R&&S===w.generation&&this.acceptedFlights.set(w.cacheKey,{id:w.id,record:F}),w.resolve(de(F)),this.inflight.delete(w.id),[...this.inflight.values()].some(I=>I.cacheKey===w.cacheKey)||(this.generations.delete(w.cacheKey),this.acceptedFlights.delete(w.cacheKey)),!R&&S===w.generation&&this._notify(w.cacheKey,F)}}))}_touch(e){let t=this.cache.get(e);return t?(this.cache.delete(e),this.cache.set(e,t),t):null}_store(e,t){var n,s,l,o,u,d,c,h;if(t.observations.length>this.maxObservations){this.cache.delete(e);return}let a=this.cache.get(e);if(a){let p=(o=(l=(n=a.requestedWindow)==null?void 0:n.end)!=null?l:(s=a.acquiredWindow)==null?void 0:s.end)!=null?o:-1/0,b=(h=(c=(u=t.requestedWindow)==null?void 0:u.end)!=null?c:(d=t.acquiredWindow)==null?void 0:d.end)!=null?h:-1/0;if(p>b||p===b&&Number.isFinite(a.requestStartedAt)&&Number.isFinite(t.requestStartedAt)&&a.requestStartedAt>t.requestStartedAt)return}for(this.cache.delete(e),this.cache.set(e,t);this.cache.size>this.maxEntries||this._observationCount()>this.maxObservations;)this.cache.delete(this.cache.keys().next().value)}_observationCount(){let e=0;for(let t of this.cache.values())e+=t.observations.length;return e}_consumerRecord(e,t,r=!0){var o,u,d,c,h,p,b,m,v,f,y,_,x;let a=(o=t.observations)!=null?o:[];if(r&&t.acquiredWindow){let g=t.acquiredWindow,w=[...this.consumers.values()].filter(k=>k.journal===e.journal).map(k=>k.window),S=Number.isFinite(t.acquisitionId)&&Number.isFinite((u=e.recordMetadata)==null?void 0:u.acquisitionId)&&t.acquisitionId<e.recordMetadata.acquisitionId;if(S)a=a.filter(k=>k.origin==="live"),t={...t,...e.recordMetadata,requestedWindow:t.requestedWindow};else if(!t.stale&&!t.error){let k=a.filter(M=>M.origin!=="live"&&M.timestamp<g.start).reduce((M,N)=>Math.max(M,N.timestamp),-1/0),R=w.every(M=>M.start>=g.start);e.observations=e.observations.filter(M=>M.origin==="live"||!(M.timestamp>=g.start&&M.timestamp<g.end||R&&M.timestamp===k)),w.every(M=>g.start<=M.start&&g.end>=M.end)&&a.length<=this.maxConsumerObservations&&(e.overflow=!1)}S||(e.recordMetadata={...t,observations:[],coverage:{...(d=t.coverage)!=null?d:{}}})}r&&this._mergeIntoConsumer(e,a);let n=e.observations.map(g=>({...g})),s=n.filter(g=>g.origin==="live").reduce((g,w)=>Math.max(g,w.timestamp),-1/0),l=(c=e.recordMetadata)!=null?c:{};return de({...l,...t,acquiredWindow:(p=(h=t.acquiredWindow)!=null?h:l.acquiredWindow)!=null?p:null,fetchedAt:(m=(b=t.fetchedAt)!=null?b:l.fetchedAt)!=null?m:null,retrievedAt:(f=(v=t.retrievedAt)!=null?v:l.retrievedAt)!=null?f:null,coverage:{...(y=l.coverage)!=null?y:{},...(_=t.coverage)!=null?_:{}}},{observations:n,liveThrough:Number.isFinite(s)?s:null,observedThrough:Number.isFinite(t.observedThrough)&&Number.isFinite(s)?Math.max(t.observedThrough,s):Number.isFinite(s)?s:(x=t.observedThrough)!=null?x:null,coverage:{...t.coverage,boundaryState:(()=>{var w,S,k;let g=(w=n.filter(R=>R.timestamp<=e.window.start).at(-1))!=null?w:null;return{requested:!0,found:g!==null,timestamp:(S=g==null?void 0:g.timestamp)!=null?S:null,origin:(k=g==null?void 0:g.origin)!=null?k:null}})(),liveOverflow:e.overflow,liveObservedThrough:Number.isFinite(s)?s:null,...e.overflow?{reason:"Active observation buffer limit reached; extrema are incomplete"}:{}}})}_mergeIntoConsumer(e,t){var u;e.observations=ui(e.observations,t);let r=[...this.consumers.values()].filter(d=>d.journal===e.journal).map(d=>d.window.start),a=Math.min(e.window.start,...r),n=e.observations.filter(d=>d.timestamp<a),s=e.observations.filter(d=>d.timestamp>=a),l=(u=n.at(-1))==null?void 0:u.timestamp,o=n.filter(d=>d.timestamp===l);if(e.observations=[...o,...s],e.observations.length>this.maxConsumerObservations){let d=this.maxConsumerObservations>0?o.slice(-this.maxConsumerObservations):[],c=Math.max(0,this.maxConsumerObservations-d.length);e.observations=[...d,...c?s.slice(-c):[]],e.overflow=!0}}_decorateForActiveConsumers(e,t,r){let a=de(r,{requestedWindow:{start:t.start,end:t.end},coverage:{...r.coverage,requested:{start:t.start,end:t.end},acquisitionRequest:r.acquiredWindow?{...r.acquiredWindow}:null}}),n=re(e),s=[...this.consumers.values()].find(l=>l.sourceKey===n&&l.window.cacheKey===t.cacheKey);return s?this._consumerRecord(s,a):a}subscribe(e,t,r){var h,p;if(typeof r!="function")throw new TypeError("A consumer callback is required");if(this.consumers.size>=this.maxConsumers)throw new RangeError("Active history consumer limit reached");let a=vr(e),n=this._cacheKey(a,t),s=this.journals.get(n);s||(s={observations:[],overflow:!1,recordMetadata:null,refs:0},this.journals.set(n,s)),s.refs+=1;let l={id:++this.nextConsumerId,source:a,sourceKey:re(a),window:t,callback:r,journalKey:n,journal:s,get observations(){return this.journal.observations},set observations(b){this.journal.observations=b},get overflow(){return this.journal.overflow},set overflow(b){this.journal.overflow=b},get recordMetadata(){return this.journal.recordMetadata},set recordMetadata(b){this.journal.recordMetadata=b}},o=this._cacheKey(a,t),u=this.cache.get(o);u&&(!s.recordMetadata||((h=u.acquisitionId)!=null?h:0)>((p=s.recordMetadata.acquisitionId)!=null?p:0))&&this._consumerRecord(l,u),this.consumers.set(l.id,l);let d=()=>{--l.journal.refs===0&&this.journals.delete(l.journalKey)},c=()=>{this.consumers.delete(l.id)&&d()};return c.updateWindow=b=>{var f,y;let m=this._cacheKey(a,b);if(m!==l.journalKey){d();let _=this.journals.get(m);_||(_={observations:[],overflow:!1,recordMetadata:null,refs:0},this.journals.set(m,_)),_.refs+=1,l.journalKey=m,l.journal=_}l.window=b;let v=this.cache.get(this._cacheKey(a,b));v&&(!l.recordMetadata||((f=v.acquisitionId)!=null?f:0)>((y=l.recordMetadata.acquisitionId)!=null?y:0))&&this._consumerRecord(l,v)},c.merge=b=>this._consumerRecord(l,b),c}_notify(e,t,r=!0){let[a,n]=e.split(""),s=new Set;for(let l of this.consumers.values())if(!(l.sourceKey!==a||l.window.cacheKey!==n))try{let o=this._consumerRecord(l,t,r&&!s.has(l.journal));s.add(l.journal),l.callback(o)}catch(o){}}ingestLiveState({source:e,state:t,timestamp:r=null}){var d,c,h,p,b,m,v,f;let a=vr(e),n=Number.isFinite(r)?r:_s(t);if(!Number.isFinite(n)||n>this.now())return 0;let s=ys(t,a.attribute),l={entityId:a.entityId,attribute:a.attribute,timestamp:n,value:s,state:(d=t==null?void 0:t.state)!=null?d:null,boundaryEffective:!1,transitionInWindow:!1,order:1e12+ ++this.liveSequence,orderKnown:!0,orderDomain:"live",origin:"live"},o=0,u=new Set;for(let y of this.consumers.values())if(y.sourceKey===re(a)){u.has(y.journal)||(this._mergeIntoConsumer(y,[l]),u.add(y.journal));try{y.callback(this._consumerRecord(y,{source:a,observations:y.observations,status:"partial",stale:((c=y.recordMetadata)==null?void 0:c.stale)===!0,error:(p=(h=y.recordMetadata)==null?void 0:h.error)!=null?p:null,retrievedAt:(m=(b=y.recordMetadata)==null?void 0:b.retrievedAt)!=null?m:null,observedThrough:n,requestedWindow:{start:y.window.start,end:y.window.end},coverage:{complete:!1,kind:"unknown",reason:"Live samples are reconciled with Recorder asynchronously"}},!1))}catch(_){}o+=1}for(let y of this.cache.values())re(y.source)===re(a)&&(y.observations=ui(y.observations,[l]),y.liveThrough=Math.max((v=y.liveThrough)!=null?v:-1/0,n),y.observedThrough=Math.max((f=y.observedThrough)!=null?f:-1/0,n),y.coverage={...y.coverage,liveObservedThrough:y.liveThrough});for(;this._observationCount()>this.maxObservations&&this.cache.size;)this.cache.delete(this.cache.keys().next().value);return o}invalidate({sources:e=null,windowKey:t=null}={}){var n;let r=e?new Set(e.map(s=>re(vr(s)))):null,a=new Set([...this.cache.keys(),...this.journals.keys(),...[...this.inflight.values()].map(s=>s.cacheKey)]);for(let s of a){let[l,o]=s.split("");if(r&&!r.has(l)||t&&o!==t)continue;this.cache.delete(s);let u=this.journals.get(s);u!=null&&u.recordMetadata&&(u.recordMetadata={...u.recordMetadata,stale:!0,status:"stale",coverage:{...u.recordMetadata.coverage,complete:!1,reason:"History invalidated; Recorder revalidation is required"}},this._notify(s,{...u.recordMetadata,observations:u.observations},!1)),[...this.inflight.values()].some(d=>d.cacheKey===s)?this.generations.set(s,((n=this.generations.get(s))!=null?n:0)+1):this.generations.delete(s)}}clear(){this.invalidate(),this.cache.clear(),this.consumers.clear(),this.journals.clear(),this.acceptedFlights.clear()}},di=new WeakMap});function ws(i,e){var t,r;return i.timestamp-e.timestamp||((t=i.order)!=null?t:0)-((r=e.order)!=null?r:0)}function xs(i){if(!Array.isArray(i))throw new TypeError("Observations must be an array");return i.filter(e=>e&&Number.isFinite(e.timestamp)).map((e,t)=>{var r;return{...e,order:(r=e.order)!=null?r:t,orderKnown:e.orderKnown===!0}}).sort(ws)}function ks(i){let e=[];for(let t=0;t<i.length;){let r=t+1;for(;r<i.length&&i[r].timestamp===i[t].timestamp;)r+=1;let a=i.slice(t,r);a.length===1||a.every(n=>n.value===a[0].value&&n.state===a[0].state)||a.every(n=>n.orderKnown)&&new Set(a.map(n=>{var s,l;return(l=(s=n.orderDomain)!=null?s:n.origin)!=null?l:"unknown"})).size===1&&new Set(a.map(n=>n.order)).size===a.length?e.push(a.at(-1)):e.push({...a.at(-1),value:null,ambiguous:!0,orderKnown:!1,state:null}),t=r}return e}function Ss(i,e,t=null,r=null){if(!e||!Number.isFinite(e.start)||!Number.isFinite(e.end)||e.end<=e.start)throw new TypeError("A valid absolute observation window is required");let a=ks(xs(i)),n=!t||Number.isFinite(t.start)&&t.start<=e.start,s=!t||Number.isFinite(t.end)&&t.end>=e.end,l=n&&s,o=null;for(let d of a){if(d.timestamp>e.start)break;o=d}let u=a.filter(d=>d.timestamp>=e.start&&d.timestamp<e.end);return o&&o.timestamp<e.start&&u.unshift({...o,boundaryEffective:!0,transitionInWindow:!1}),{observations:u,requestedBoundsCovered:l,orderingAmbiguous:u.some(d=>d.ambiguous===!0)}}function pi(i,e,t,r={}){if(!["max","min"].includes(e))throw new TypeError(`Unsupported historical calculation: ${e}`);let a=Ss(i,t,r.acquiredWindow,r.liveThrough),n=a.observations,s=n.filter(o=>Number.isFinite(o.value));if(a.orderingAmbiguous)return{value:null,status:"partial",calculation:e,sampleCount:s.length,boundaryIncluded:n.some(o=>o.boundaryEffective===!0),selectedObservation:null,orderingAmbiguous:!0,requestedBoundsCovered:a.requestedBoundsCovered};if(!s.length)return{value:null,status:a.requestedBoundsCovered?"unavailable":"partial",calculation:e,sampleCount:0,boundaryIncluded:n.some(o=>o.boundaryEffective===!0),selectedObservation:null,orderingAmbiguous:!1,requestedBoundsCovered:a.requestedBoundsCovered};let l=s.reduce((o,u)=>!o||(e==="max"?u.value>o.value:u.value<o.value)?u:o,null);return{value:l.value,status:a.requestedBoundsCovered?"available":"partial",calculation:e,sampleCount:s.length,boundaryIncluded:n.some(o=>o.boundaryEffective===!0),selectedObservation:l,orderingAmbiguous:!1,requestedBoundsCovered:a.requestedBoundsCovered}}var un=H(()=>{});function Rt(i){var s,l,o,u,d;if(!i||typeof i!="object")throw new TypeError("A historical value specification is required");let e=(s=i.provider)!=null?s:_r;if(e!==_r)throw new TypeError(`Unsupported historical provider: ${e}`);let t=(l=i.source)!=null?l:{entityId:i.entityId,attribute:i.attribute},r=(o=t==null?void 0:t.entityId)!=null?o:t==null?void 0:t.entity,a=(u=t==null?void 0:t.attribute)!=null?u:null;if(typeof r!="string"||!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(r.trim()))throw new TypeError(`Invalid historical source entity ID: ${r}`);if(a!==null&&(typeof a!="string"||!a.trim()))throw new TypeError("Historical source attribute must be a non-empty string");let n=i.calculation;if(!Ms.has(n))throw new TypeError(`Unsupported historical calculation: ${n}`);if(!i.window||typeof i.window!="object")throw new TypeError("A time-window specification is required");return{provider:e,source:{entityId:r.trim(),attribute:(d=a==null?void 0:a.trim())!=null?d:null},calculation:n,window:i.window}}function ve({value:i=null,status:e,spec:t,window:r=null,record:a=null,calculation:n=null,now:s}){var d,c,h,p,b,m,v,f,y,_,x,g;let l=(d=n==null?void 0:n.selectedObservation)!=null?d:null,o=(c=a==null?void 0:a.status)!=null?c:null,u=e;return e||(a!=null&&a.stale?u="stale":(h=a==null?void 0:a.coverage)!=null&&h.liveOverflow||n!=null&&n.orderingAmbiguous||(n==null?void 0:n.requestedBoundsCovered)===!1?u="partial":Number.isFinite(i)?((p=a==null?void 0:a.coverage)==null?void 0:p.kind)==="incomplete"?u="partial":u="available":u="unavailable"),{value:Number.isFinite(i)&&!((b=a==null?void 0:a.coverage)!=null&&b.liveOverflow)&&!(n!=null&&n.orderingAmbiguous)?i:null,status:u,source:{provider:t.provider,...t.source},calculation:t.calculation,window:r?{start:r.start,end:r.end,timeZone:r.timeZone,interval:r.interval,semantics:{...r.semantics}}:null,freshness:{retrievedAt:(m=a==null?void 0:a.retrievedAt)!=null?m:null,ageMs:Number.isFinite(a==null?void 0:a.retrievedAt)?Math.max(0,s-a.retrievedAt):null,observedThrough:(v=a==null?void 0:a.observedThrough)!=null?v:null,stale:(a==null?void 0:a.stale)===!0,cache:(f=a==null?void 0:a.cache)!=null?f:null},provenance:{sampleCount:(y=n==null?void 0:n.sampleCount)!=null?y:0,selectedTimestamp:(_=l==null?void 0:l.timestamp)!=null?_:null,boundaryIncluded:(x=n==null?void 0:n.boundaryIncluded)!=null?x:!1,coverage:a!=null&&a.coverage?{...a.coverage}:null,providerStatus:o,error:(g=a==null?void 0:a.error)!=null?g:null}}}var _r,Ms,yr,dn=H(()=>{un();hi();jr();_r="recorder_history",Ms=new Set(["max","min"]);yr=class{constructor({service:e=null,serviceOptions:t={},now:r=Date.now}={}){this.service=e,this.serviceOptions=t,this.now=r}_context(e,t){var o,u,d,c,h,p,b,m,v;let r=t==null?void 0:t.hass;if(!r)throw new TypeError("Home Assistant context is required");let a=(u=t==null?void 0:t.timeZone)!=null?u:(o=r.config)==null?void 0:o.time_zone,n=(c=t==null?void 0:t.locale)!=null?c:(d=r.locale)==null?void 0:d.language,s=Ea(e.window,{now:(h=t==null?void 0:t.now)!=null?h:this.now(),timeZone:a,locale:n,firstWeekday:(b=t==null?void 0:t.firstWeekday)!=null?b:(p=r.locale)==null?void 0:p.first_weekday,weekStartsOn:t==null?void 0:t.weekStartsOn}),l=(m=this.service)!=null?m:Mt(r,this.serviceOptions);return{hass:r,window:s,service:l,now:(v=t==null?void 0:t.now)!=null?v:this.now()}}pending(e){let t=Rt(e);return ve({status:"pending",spec:t,now:this.now()})}async resolve(e,t={}){var a,n;let r;try{r=Rt(e);let{hass:s,window:l,service:o,now:u}=this._context(r,t),c=(await o.request({hass:s,sources:[r.source],window:l})).get(`${r.source.entityId}\0${(a=r.source.attribute)!=null?a:""}`),h=c?pi(c.observations,r.calculation,l,{acquiredWindow:c.acquiredWindow,liveThrough:c.liveThrough}):{value:null,status:"unavailable",sampleCount:0,boundaryIncluded:!1};return ve({value:h.value,spec:r,window:l,record:c,calculation:h,now:u})}catch(s){let l=r!=null?r:{provider:_r,source:{entityId:"",attribute:null},calculation:(n=e==null?void 0:e.calculation)!=null?n:null};return ve({status:"invalid",spec:l,now:this.now(),record:{error:s,coverage:null}})}}watch(e,t,r){var _;if(typeof r!="function")throw new TypeError("A value update callback is required");let a,n;try{a=Rt(e),n=this._context(a,t)}catch(x){return r(ve({status:"invalid",spec:a!=null?a:{provider:_r,source:{entityId:"",attribute:null},calculation:(_=e==null?void 0:e.calculation)!=null?_:null},now:this.now(),record:{error:x}})),()=>{}}let s=!0,l=0,o=null,u=null,d=n.window,c=n,h=null,p=()=>{var x;return this._context(a,{...t,now:(x=t==null?void 0:t.now)!=null?x:this.now()})},b=()=>{u!==null&&clearTimeout(u),u=null},m=(x,g=null)=>{var M;if(!s||!x||g!==null&&g!==l)return;c=p(),d=c.window,o==null||o.updateWindow(d),h=x;let w=pi(h.observations,a.calculation,d,{acquiredWindow:h.acquiredWindow,liveThrough:h.liveThrough}),S=((M=h.coverage)==null?void 0:M.liveOverflow)===!0,k=S||w.orderingAmbiguous?null:w.value,R=h.stale?"stale":S||w.orderingAmbiguous||!w.requestedBoundsCovered?"partial":void 0;r(ve({value:k,status:R,spec:a,window:d,record:h,calculation:w,now:this.now()})),v(h)},v=(x=h)=>{var k,R;if(b(),!["calendar","shifted_calendar","rolling"].includes(d.semantics.kind))return;let g=this.now(),w=[Math.floor(g/6e4)*6e4+6e4];if(((k=x==null?void 0:x.observations)!=null?k:[]).some(M=>M.origin==="live"&&M.timestamp===d.end&&M.timestamp<=g)&&w.push(g+1),["calendar","shifted_calendar"].includes(d.semantics.kind)){let M=d.semantics.rolloverAt;Number.isFinite(M)&&M>g&&w.push(M+1)}if(d.semantics.kind==="rolling"){let M=((R=x==null?void 0:x.observations)!=null?R:[]).filter(N=>N.timestamp>d.start&&N.timestamp<d.end).reduce((N,$)=>Math.min(N,$.timestamp),1/0);Number.isFinite(M)&&w.push(M+d.semantics.durationMs+1)}let S=Math.min(...w.filter(M=>M>g));!Number.isFinite(S)||S<=g||(u=setTimeout(()=>{if(!s)return;let M=d.cacheKey,N=p();if(N.window.cacheKey!==M&&["calendar","shifted_calendar"].includes(N.window.semantics.kind)){f(!1);return}c=N,d=N.window,o==null||o.updateWindow(d),h?m(h):v(null)},Math.min(S-g+1,2147483647)))},f=(x=!1)=>{if(!s)return Promise.resolve(null);c=p(),d=c.window;let g=++l;if(o)o.updateWindow(d);else try{o=c.service.subscribe(a.source,d,w=>m(w))}catch(w){return r(ve({status:"unavailable",spec:a,window:d,record:{error:w,observations:[],coverage:{complete:!1,kind:"unknown"}},now:this.now()})),Promise.resolve(null)}return!(h!=null&&h.stale)&&!(h!=null&&h.error)&&r(ve({status:"pending",spec:a,window:d,now:this.now()})),v(h),c.service.request({hass:c.hass,sources:[a.source],window:d,force:x}).then(w=>{var k;let S=w.get(`${a.source.entityId}\0${(k=a.source.attribute)!=null?k:""}`);return g===l&&m(S,g),S!=null?S:null}).catch(w=>(s&&g===l&&r(ve({status:"unavailable",spec:a,window:d,record:{error:w,observations:[],coverage:{complete:!1,kind:"unknown"}},now:this.now()})),null))},y=()=>{s&&(s=!1,l+=1,b(),o==null||o(),o=null,h=null)};return y.refresh=()=>f(!0),f(!1),y}ingestLiveState(e,t,r,a=null){var s;return((s=this.service)!=null?s:Mt(e,this.serviceOptions)).ingestLiveState({source:t,state:r,timestamp:a})}}});function bi(i){var e;return["unauthorized","forbidden","invalid_auth"].includes(String((e=i==null?void 0:i.code)!=null?e:"").toLowerCase())}function fi(i){try{Promise.resolve(i==null?void 0:i()).catch(()=>{})}catch(e){}}var vi,gr,mi,_i,Fe,yi=H(()=>{hi();oi();dn();vi=new WeakMap,gr=1e3,mi=6e4;_i=class{constructor(e,t){var r,a;this.connection=e,this.service=Mt(t),this.hosts=new Set,this.sourceMap=new Map,this.lastStates=new Map,this.pendingEvents=[],this.pendingOverflow=!1,this.subscriptionTimer=null,this.subscriptionDelay=gr,this.subscribing=!1,this.subscriptionPermanent=!1,this.recoveryTimer=null,this.recoveryDelay=gr,this.recoveryFlight=null,this.dirtySources=new Map,this.deniedSources=new Set,this.generation=0,this.connectionEpoch=0,this.online=e.connected!==!1&&t.connected!==!1,this.ready=!1,this.unsubscribe=null,this.onDisconnect=()=>this.disconnect(),this.onReady=()=>this.reconnect(),(r=e.addEventListener)==null||r.call(e,"disconnected",this.onDisconnect),(a=e.addEventListener)==null||a.call(e,"ready",this.onReady),this.online&&this.subscribe()}updateSources(){let e=new Map;for(let t of this.hosts)for(let r of t.entries.values())e.set(re(r.spec.source),r.spec.source);this.sourceMap=e;for(let t of this.lastStates.keys())e.has(t)||this.lastStates.delete(t);for(let t of this.dirtySources.keys())e.has(t)||this.dirtySources.delete(t);for(let t of this.deniedSources)e.has(t)||this.deniedSources.delete(t);!this.dirtySources.size&&this.recoveryTimer!==null&&(clearTimeout(this.recoveryTimer),this.recoveryTimer=null)}cancelTimers(){this.subscriptionTimer!==null&&clearTimeout(this.subscriptionTimer),this.recoveryTimer!==null&&clearTimeout(this.recoveryTimer),this.subscriptionTimer=null,this.recoveryTimer=null}markDirty(e,t=!0){var n;let r=re(e);if(!this.sourceMap.has(r)||this.deniedSources.has(r))return;let a=this.dirtySources.get(r);this.dirtySources.set(r,{source:e,version:((n=a==null?void 0:a.version)!=null?n:0)+(t?1:0)}),this.scheduleRecovery()}acquisitionFailed(e,t){let r=re(e);bi(t)?(this.deniedSources.add(r),this.dirtySources.delete(r)):this.markDirty(e,!1)}scheduleRecovery(){!this.online||!this.hosts.size||!this.dirtySources.size||this.recoveryTimer!==null||this.recoveryFlight||(this.recoveryTimer=setTimeout(()=>{this.recoveryTimer=null,this.recover()},this.recoveryDelay))}recover(){if(!this.online||!this.hosts.size||this.recoveryFlight||!this.dirtySources.size)return;let e=new Map([...this.dirtySources].map(([n,s])=>[n,s.version])),t=new Map;for(let n of this.hosts)for(let s of n.entries.values()){let l=re(s.spec.source);!e.has(l)||!s.stop||[...this.service.inflight.values()].some(o=>o.sourceKey===l)||(t.has(l)||t.set(l,[]),t.get(l).push(Promise.resolve().then(()=>{var o,u;return(u=(o=s.stop)==null?void 0:o.refresh())!=null?u:null})))}let r=this.connectionEpoch,a=Promise.all([...t].map(async([n,s])=>[n,await Promise.all(s)]));this.recoveryFlight=a,a.then(n=>{var l,o;if(!this.online||r!==this.connectionEpoch)return;let s=!1;for(let[u,d]of e){let c=this.dirtySources.get(u);if(!c||c.version!==d)continue;let h=(o=(l=n.find(([p])=>p===u))==null?void 0:l[1])!=null?o:[];h.some(p=>bi(p==null?void 0:p.error))?(this.deniedSources.add(u),this.dirtySources.delete(u)):!h.length||h.some(p=>!p||p.stale||p.error||!p.acquiredWindow)?s=!0:this.dirtySources.delete(u)}this.recoveryDelay=s?Math.min(this.recoveryDelay*2,mi):gr}).catch(()=>{this.recoveryDelay=Math.min(this.recoveryDelay*2,mi)}).finally(()=>{this.recoveryFlight===a&&(this.recoveryFlight=null,this.scheduleRecovery())})}scheduleSubscriptionRetry(){!this.online||!this.hosts.size||this.subscriptionPermanent||this.subscribing||this.subscriptionTimer!==null||(this.subscriptionTimer=setTimeout(()=>{this.subscriptionTimer=null,this.subscribe()},this.subscriptionDelay),this.subscriptionDelay=Math.min(this.subscriptionDelay*2,mi))}disconnect(){this.online&&(this.online=!1,this.ready=!1,this.generation+=1,this.connectionEpoch+=1,this.cancelTimers(),this.subscribing=!1,this.recoveryFlight=null,this.dirtySources.clear(),this.deniedSources.clear(),fi(this.unsubscribe),this.unsubscribe=null,this.lastStates.clear(),this.pendingEvents=[],this.pendingOverflow=!1,this.service.invalidate({sources:[...this.sourceMap.values()]}))}reconnect(){this.online||(this.online=!0,this.subscribe())}subscribe(){if(this.subscribing||!this.online)return;this.subscribing=!0;let e=++this.generation,t=a=>{var l,o,u;if(!this.online||e!==this.generation)return;let n=(l=a==null?void 0:a.data)==null?void 0:l.entity_id,s=(u=(o=a==null?void 0:a.data)==null?void 0:o.new_state)!=null?u:a!=null&&a.time_fired?{state:"unavailable",attributes:{},last_updated:a.time_fired}:null;!n||!s||![...this.sourceMap.values()].some(d=>d.entityId===n)||(this.ready?this.deliver(n,s):this.pendingEvents.length<this.service.maxConsumerObservations?this.pendingEvents.push({entity:n,state:s}):this.pendingOverflow=!0)},r;try{typeof this.connection.subscribeMessage=="function"?r=this.connection.subscribeMessage(t,{type:"subscribe_events",event_type:"state_changed"},{resubscribe:!1}):typeof this.connection.subscribeEvents=="function"&&(r=this.connection.subscribeEvents(t,"state_changed"))}catch(a){r=Promise.reject(a)}if(!r){this.subscribing=!1,this.subscriptionPermanent=!0,this.ready=!0;for(let a of this.hosts)a.activate(!0);return}Promise.resolve(r).then(a=>{if(!this.online||e!==this.generation||!this.hosts.size){fi(a);return}this.unsubscribe=a,this.subscribing=!1,this.subscriptionPermanent=!1,this.subscriptionDelay=gr;let n=this.ready;(n||this.pendingOverflow)&&this.service.invalidate({sources:[...this.sourceMap.values()]}),this.ready=!0;for(let s of this.hosts)s.activate(!n);for(let{entity:s,state:l}of this.pendingEvents)this.deliver(s,l);if(this.pendingEvents=[],n||this.pendingOverflow)for(let s of this.sourceMap.values())this.markDirty(s);this.pendingOverflow=!1}).catch(a=>{if(!this.online||e!==this.generation)return;this.generation+=1,this.subscribing=!1,this.subscriptionPermanent=bi(a);let n=!this.ready;(n||this.pendingEvents.length||this.pendingOverflow)&&this.service.invalidate({sources:[...this.sourceMap.values()]}),this.ready=!0;for(let s of this.hosts)s.activate(n);for(let{entity:s,state:l}of this.pendingEvents)this.deliver(s,l);this.pendingEvents=[],this.pendingOverflow=!1,this.scheduleSubscriptionRetry()})}deliver(e,t,r=!1){var a;for(let[n,s]of this.sourceMap){if(s.entityId!==e)continue;let l=JSON.stringify([t.last_updated,t.last_changed,t.state,s.attribute?(a=t.attributes)==null?void 0:a[s.attribute]:null]);this.lastStates.get(n)!==l&&(this.lastStates.set(n,l),r&&(this.service.invalidate({sources:[s]}),this.markDirty(s)),this.service.ingestLiveState({source:s,state:t}))}}update(e){var r;let t=typeof this.connection.connected=="boolean"?this.connection.connected:e.connected;if(t===!1?this.disconnect():t===!0&&!this.online&&this.reconnect(),this.online&&this.ready&&!this.unsubscribe)for(let a of new Set([...this.sourceMap.values()].map(n=>n.entityId))){let n=(r=e.states)==null?void 0:r[a];n&&this.deliver(a,n,!0)}}close(){var e,t,r,a;this.online=!1,this.ready=!1,this.generation+=1,this.connectionEpoch+=1,this.cancelTimers(),this.subscribing=!1,this.dirtySources.clear(),this.deniedSources.clear(),fi(this.unsubscribe),this.unsubscribe=null,(t=(e=this.connection).removeEventListener)==null||t.call(e,"disconnected",this.onDisconnect),(a=(r=this.connection).removeEventListener)==null||a.call(r,"ready",this.onReady),this.lastStates.clear(),this.pendingEvents=[],vi.delete(this.connection)}},Fe=class{constructor(){this.entries=new Map,this.results=new Map,this.attached=!1,this.hass=null,this.hub=null,this.onChange=null}setConsumers(e,t=this.onChange){var a;let r=new Map;for(let{id:n,spec:s}of e){if(typeof n!="string"||!n||r.has(n))throw new TypeError("Historical consumer IDs must be unique strings");let l=Rt(s),o=JSON.stringify(l),u=this.entries.get(n);r.set(n,(u==null?void 0:u.signature)===o?u:{id:n,spec:l,signature:o,stop:null})}for(let[n,s]of this.entries)r.get(n)!==s&&((a=s.stop)==null||a.call(s),this.results.delete(n));this.entries=r,this.onChange=t,this.sync()}getResult(e){var t;return(t=this.results.get(e))!=null?t:null}setHass(e){var r,a;let t=(r=this.hass)==null?void 0:r.connection;this.hass=e;for(let n of this.entries.values())n.context&&(n.context.hass=e);t!==(e==null?void 0:e.connection)&&this.leave(),this.sync(),(a=this.hub)==null||a.update(e)}attach(){this.attached=!0,this.sync()}detach(){this.attached=!1,this.leave()}sync(){var e;if(!this.attached||!this.entries.size||!((e=this.hass)!=null&&e.connection)||typeof this.hass.connection!="object"){this.leave();return}if(!this.hub){let t=this.hass.connection,r=vi.get(t);r||(r=new _i(t,this.hass),vi.set(t,r)),this.hub=r,r.hosts.add(this)}this.hub.updateSources(),this.hub.ready&&this.activate(!1)}activate(e){var r;if(!this.attached||!((r=this.hub)!=null&&r.online)||!this.hub.ready)return;let t=new yr({service:this.hub.service});for(let a of this.entries.values()){if(a.starting)continue;if(a.stop){e&&a.stop.refresh();continue}let n={hass:this.hass};a.context=n;let s=a,l=this.hub;a.starting=!0;let o=t.watch(a.spec,n,u=>{var d,c,h;if(this.attached&&this.entries.get(a.id)===s&&this.hub){this.results.set(a.id,u),(d=u.provenance)!=null&&d.error&&((c=this.hub)!=null&&c.online)&&this.hub.acquisitionFailed(a.spec.source,u.provenance.error);try{(h=this.onChange)==null||h.call(this,a.id,u)}catch(p){}}});a.starting=!1,this.attached&&this.entries.get(a.id)===s&&this.hub===l?a.stop=o:o()}}leave(){var t;for(let r of this.entries.values())(t=r.stop)==null||t.call(r),r.stop=null,r.context=null;if(this.results.clear(),!this.hub)return;let e=this.hub;this.hub=null,e.hosts.delete(this),e.hosts.size?e.updateSources():e.close()}}});function cn(i,e){var t,r;return JSON.stringify([i.entity,(t=i.attribute)!=null?t:null,e,(r=i[`${e}_marker`])==null?void 0:r.window_spec])}function wr(i){let e=i.flatMap(t=>["peak","floor"].flatMap(r=>{var n;let a=t==null?void 0:t[`${r}_marker`];return!(a!=null&&a.show)||a.window_invalid||!a.window_spec||typeof t.entity!="string"||!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(t.entity)?[]:[{id:cn(t,r),spec:{source:{entityId:t.entity,attribute:(n=t.attribute)!=null?n:null},calculation:r==="peak"?"max":"min",window:a.window_spec}}]}));return[...new Map(e.map(t=>[t.id,t])).values()]}function Nt(i,e){return Object.fromEntries(["peak","floor"].map(t=>{var r,a;return[t,(r=e==null?void 0:e[`${t}_marker`])!=null&&r.window_invalid?{value:null,status:"invalid"}:(a=i.getResult(cn(e,t)))!=null?a:{value:null,status:"pending"}]}))}var gi=H(()=>{});function hn(i){let e=-1/0;return i.map(t=>(e=Math.max(e,t.p),{...t,p:e}))}function wi(i,e){return e!=="reverse"?i.map(t=>({...t})):hn(i).map(t=>({...t,p:100-t.p})).reverse()}function Nr(i,e){if(!i||!e||!Number.isFinite(i.valuePercent)||!Number.isFinite(e.valuePercent))return 600;let t=Number.isFinite(i.baselinePercent)?i.baselinePercent:0,r=Number.isFinite(e.baselinePercent)?e.baselinePercent:0,a=Math.max(Math.abs(e.valuePercent-i.valuePercent),Math.abs(r-t)),n=Math.round(Math.min(600,Math.max(150,600-15*Math.max(0,a-5))));return Number.isFinite(i.baselinePercent)&&Number.isFinite(e.baselinePercent)&&(i.valuePercent-i.baselinePercent)*(e.valuePercent-e.baselinePercent)<0?Math.min(n,300):n}function xr(i,e=null){let t=[...i].sort((r,a)=>r.from-a.from);return t.map((r,a)=>{var s;let n=Number.isFinite(r.to)?r.to:null;return!Number.isFinite(n)&&a<t.length-1&&(n=t[a+1].from),!Number.isFinite(n)&&Number.isFinite(e)&&(n=e),{from:r.from,to:n,color:r.color,label:(s=r.label)!=null?s:null}})}function Ae(i){if(!i||typeof i!="string")return null;let e=i.replace("#","").trim(),t=e.length===3?e.split("").map(r=>r+r).join(""):e;return/^[0-9a-fA-F]{6}$/.test(t)?{r:parseInt(t.slice(0,2),16),g:parseInt(t.slice(2,4),16),b:parseInt(t.slice(4,6),16)}:null}function $r(i,e=0,t=100,r=!1){let n=Te(i,e,t).filter(l=>Number.isFinite(l==null?void 0:l.from)&&Number.isFinite(l==null?void 0:l.to)&&l.from<l.to&&(l==null?void 0:l.color)).sort((l,o)=>l.from-o.from);if(!n.length)return[];let s=[];for(let l=0;l<n.length;l++){let o=n[l],u=Ae(o.color);if(!u&&!r)continue;let d;l===0?d=o.from:l===n.length-1?d=o.to:d=o.from+(o.to-o.from)/2,(!s.length||s[s.length-1].p!==d)&&s.push({p:d,...u!=null?u:{color:o.color}})}return s}function Rs(i,e="#4a9eff",t="normal"){let r=i.filter(s=>Number.isFinite(s==null?void 0:s.from)&&Number.isFinite(s==null?void 0:s.to)&&s.from<s.to&&(s==null?void 0:s.color)).sort((s,l)=>s.from-l.from);if(!r.length)return null;let a=[];for(let s of r)a.push({color:s.color,p:s.from},{color:s.color,p:s.to});return`linear-gradient(to right, ${(t==="reverse"?wi(a,t):a).map(s=>`${s.color} ${s.p}%`).join(", ")})`}function xi(i,e=0,t=100,r="normal"){var a,n;return Rs(Te(i,e,t),(n=(a=i.bar)==null?void 0:a.color)!=null?n:"#4a9eff",r)}function ki(){return 1.5}function _e(i,e,t){if(!Array.isArray(i)||!t)return;let r=Math.min(100,Math.max(0,e)),a=i[i.length-1];a&&a.color===t&&Math.abs(a.p-r)<1e-4||i.push({p:r,color:t})}function Ft(i,e=0,t=100){let a=Te(i,e,t).filter(o=>Number.isFinite(o==null?void 0:o.from)&&Number.isFinite(o==null?void 0:o.to)&&(o==null?void 0:o.color)).sort((o,u)=>o.from-u.from);if(!a.length)return[];let n=ki(),s=n/2,l=[];_e(l,a[0].from,a[0].color);for(let o=0;o<a.length-1;o++){let u=a[o],d=a[o+1],c=u.to,h=u.to-u.from,p=d.to-d.from;h>=n&&p>=n?(_e(l,Math.max(u.from,c-s),u.color),_e(l,Math.min(d.to,c+s),d.color)):(_e(l,c,u.color),_e(l,c,d.color))}return _e(l,a[a.length-1].to,a[a.length-1].color),l}function Si(i,e=0,t=100,r="normal"){let a=wi(Ft(i,e,t),r);return a.length?`linear-gradient(to right, ${a.map(n=>`${n.color} ${n.p}%`).join(", ")})`:null}function kr(i,e,t){if(i==null)return null;if(typeof i=="object"&&!Array.isArray(i)){let n=B(i.fixed);return Number.isFinite(n)?$t(n,e,t):Number.isFinite(i.percent)?i.percent:null}let r=ge(i);if(Number.isFinite(r))return r;let a=B(i);return Number.isFinite(a)?$t(a,e,t):null}function It(i){var e,t,r,a;return(a=(r=(e=i==null?void 0:i.bar)==null?void 0:e.fill_style)!=null?r:_t((t=i==null?void 0:i.bar)==null?void 0:t.color_mode))!=null?a:"bands"}function Mi(i){return Array.isArray(i)&&i.some(e=>(e==null?void 0:e.from)&&typeof e.from=="object"&&!Array.isArray(e.from)||(e==null?void 0:e.to)&&typeof e.to=="object"&&!Array.isArray(e.to))}function Te(i,e=0,t=100){var s,l;let r=Number.isFinite(e)?e:0,a=Number.isFinite(t)?t:100,n=(Array.isArray((s=i.bar)==null?void 0:s.segments)?i.bar.segments:[]).filter(o=>!(o!=null&&o.invalidBoundary));if(((l=i.bar)==null?void 0:l.segment_space)==="scale"||Mi(n)){let o=n.map(u=>{var d;return{from:kr(u.from,r,a),to:kr(u.to,r,a),color:u.color,label:(d=u.label)!=null?d:null}}).filter(u=>Number.isFinite(u.from)&&u.color);return xr(o,100).filter(u=>Number.isFinite(u.from)&&Number.isFinite(u.to)&&u.from<u.to&&u.color)}return xr(n,100).filter(o=>Number.isFinite(o.from)&&Number.isFinite(o.to)&&o.from<o.to&&o.color)}function Ri(i,e,t=0,r=100){let a=It(e);if(a==="solid")return e.bar.color;if(a==="gradient"||a==="band_gradient"||a==="soft_bands"){let n;if(a==="band_gradient"?n=$r(e,t,r):a==="soft_bands"?n=hn(Ft(e,t,r)).map(u=>{let d=Ae(u.color);return d?{p:u.p,...d}:null}).filter(Boolean):e.bar.gradient_stops&&e.bar.gradient_stops.length>=2?(n=e.bar.gradient_stops.map(u=>{let d=u.color.replace("#",""),c=d.length===3?d.split("").map(h=>h+h).join(""):d;return{p:u.pos,r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}}),n.sort((u,d)=>u.p-d.p)):n=[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}],!n||!n.length)return e.bar.color;let s=n[0],l=n[n.length-1];for(let u=0;u<n.length-1;u++)if(i>=n[u].p&&i<=n[u+1].p){s=n[u],l=n[u+1];break}let o=s.p===l.p?0:(i-s.p)/(l.p-s.p);return`rgb(${Math.round(s.r+o*(l.r-s.r))},${Math.round(s.g+o*(l.g-s.g))},${Math.round(s.b+o*(l.b-s.b))})`}for(let n of Te(e,t,r))if(i>=n.from&&i<=n.to)return n.color;return e.bar.color}function Ni(i,e="normal"){if(!Array.isArray(i)||!i.length)return null;let t=wi(i,e).map(r=>{var n;let a=(n=r.color)!=null?n:Fi(r);return a?`${a} ${r.p}%`:null}).filter(Boolean);return t.length?`background:linear-gradient(to right,${t.join(",")});background-repeat:no-repeat;`:null}function $i(i,e=0,t=100){let r=It(i);return r==="band_gradient"?$r(i,e,t,!0):r==="soft_bands"?Ft(i,e,t).map(a=>{let n=Ae(a.color);return n?{p:a.p,...n}:null}).filter(Boolean).sort((a,n)=>a.p-n.p):i.bar.gradient_stops&&i.bar.gradient_stops.length>=2?i.bar.gradient_stops.map(a=>{let n=Ae(a.color);return n?{p:a.pos,...n}:null}).filter(Boolean).sort((a,n)=>a.p-n.p):[{p:0,r:76,g:175,b:80},{p:50,r:255,g:152,b:0},{p:100,r:244,g:67,b:54}]}function Fi(i){return i?`rgb(${i.r},${i.g},${i.b})`:null}function Sr(i){return`linear-gradient(to right,${i} 0%,${i} 100%)`}function Ii(i,e,t=0,r=100,a="normal"){var s;let n=It(e);if(e.bar.solid_fill)return Sr(i);if(n==="bands")return xi(e,t,r,a);if(n==="soft_bands")return Si(e,t,r,a);if(n==="gradient"||n==="band_gradient"){let l=$i(e,t,r);return(s=Ni(l,a))==null?void 0:s.replace(/^background:/,"").replace(/;background-repeat:no-repeat;$/,"")}return Sr(i)}function Mr(i,e,t){if(!t)return null;let r=Math.min(100,Math.max(0,i)),a=Math.min(100,Math.max(0,e));return a<=r?null:`linear-gradient(to right,transparent 0%,transparent ${r}%,${t} ${r}%,${t} ${a}%,transparent ${a}%,transparent 100%)`}function $t(i,e,t){if(!Number.isFinite(i))return null;let r=Number.isFinite(e)?e:0,n=(Number.isFinite(t)?t:100)-r||1;return Math.min(100,Math.max(0,(i-r)/n*100))}function Ai(i,e=null){let t=Math.min(100,Math.max(0,i));if(!Number.isFinite(e))return{usesBaseline:!1,start:0,end:t,positive:!0,baseline:null,hidden:t<=0};let r=Math.min(100,Math.max(0,e));return{usesBaseline:!0,start:Math.min(t,r),end:Math.max(t,r),positive:t>=r,baseline:r,hidden:t===r}}function Ti(i){return i!=null&&i.endpointSemantics?i.endpointSemantics:i!=null&&i.usesBaseline?i.positive?{left:"baseline",right:"value"}:{left:"value",right:"baseline"}:{left:"scale",right:"value"}}function Pi(i){let e=Ti(i),t=n=>n==="value"||n==="range"||n==="scale",r=t(e.left)?"6px":"0",a=t(e.right)?"6px":"0";return`${r} ${a} ${a} ${r}`}function zi(i=null,e="normal"){if(!Number.isFinite(i))return null;let t=lr(i,100,e);return!t||t.start>=t.end?null:t}function Wi(i=null,e="normal"){let t=zi(i,e);return t?{start:t.start,end:t.end,hidden:!1}:null}function qi(i,e,t=null,r=null,a=0,n=100,s="normal"){var d,c,h,p,b,m;let l=[],o=Ii(e,i,a,n,s),u=Number.isFinite(r)?Math.min(100,Math.max(0,r)):null;if(Number.isFinite(u)){let v=(h=(c=(d=i.baseline)==null?void 0:d.below)==null?void 0:c.color)!=null?h:null,f=(m=(b=(p=i.baseline)==null?void 0:p.above)==null?void 0:b.color)!=null?m:null,y=lr(0,u,s),_=lr(u,100,s),x=y?Mr(y.start,y.end,v):null,g=_?Mr(_.start,_.end,f):null;x&&l.push(x),g&&l.push(g)}return o&&l.push(o),l.length?`display:block;inset:0;background-image:${l.join(",")};background-repeat:no-repeat;background-size:100% 100%;`:"display:none;"}function Di(i,e){var d,c;let t=typeof e=="number"?`${e}px`:e,r=Math.min(100,Math.max(0,(d=i==null?void 0:i.start)!=null?d:0)),a=Math.min(100,Math.max(0,(c=i==null?void 0:i.end)!=null?c:0));if(i!=null&&i.hidden)return`display:none;height:${t};clip-path:inset(0 100% 0 0 round 0);`;let n="0",s=`${Math.max(0,100-a)}%`,l="0",o=`${r}%`,u=Pi(i);return`display:block;height:${t};clip-path:inset(${n} ${s} ${l} ${o} round ${u});`}function Rr(i){if(!(i!=null&&i.hidden)&&Number.isFinite(i==null?void 0:i.start)&&Number.isFinite(i==null?void 0:i.end)&&i.end>i.start){let e=Math.min(100,Math.max(0,i.start)),t=Math.min(100,Math.max(0,i.end));return`display:block;clip-path:inset(0 ${Math.max(0,100-t)}% 0 ${e}% round 0);`}return"display:none;clip-path:inset(0 100% 0 0 round 0);"}function Vi(i,e,t,r,a=null,n=null,s=0,l=100,o="normal"){var p,b;let d={id:"base",zIndex:1,visible:!0,paintStyle:qi(t,r,a,n,s,l,o),revealStyle:"display:block;"},c=Wi(a,o),h={id:"above-target",zIndex:2,visible:!!((p=t==null?void 0:t.bar)!=null&&p.above_target_color&&c),paintStyle:(b=t==null?void 0:t.bar)!=null&&b.above_target_color?`display:block;inset:0;background:${t.bar.above_target_color};`:"display:none;",revealStyle:Rr(c||{start:0,end:0,hidden:!0})};return[d,h]}function Li(i,e,t,r,a=null,n=null,s=0,l=100,o=!1,u=(h=>(h=(c=>(c=t==null?void 0:t.scale)==null?void 0:c.direction)())!=null?h:"normal")(),d=(b=>(b=(p=>(p=t==null?void 0:t.bar)==null?void 0:p.direction)())!=null?b:"normal")()){var _,x;let m=ae(i,u),v=ae(n,u),f;if(o)f=Ai(100,null);else if(!Number.isFinite(i))f={usesBaseline:Number.isFinite(v),start:0,end:0,positive:!0,baseline:v,hidden:!0,endpointSemantics:{left:"scale",right:"value"}};else if(Number.isFinite(v)){let g=i>=n;f={usesBaseline:!0,start:Math.min(m,v),end:Math.max(m,v),positive:g,baseline:v,hidden:m===v,endpointSemantics:m<=v?{left:"value",right:"baseline"}:{left:"baseline",right:"value"}}}else{let g=d==="reverse";f={usesBaseline:!1,start:g?m:0,end:g?100:m,positive:!0,baseline:null,hidden:g?m>=100:m<=0,endpointSemantics:g?{left:"value",right:"scale"}:{left:"scale",right:"value"}}}let y=Vi(f,e,t,r,a,n,s,l,u);return{geometry:f,paintLayers:y,paintStyle:(x=(_=y[0])==null?void 0:_.paintStyle)!=null?x:"display:none;",revealStyle:Di(f,e)}}function pn(i,e,t=0,r=100,a=null,n=(l=>(l=(s=>(s=e==null?void 0:e.scale)==null?void 0:s.direction)())!=null?l:"normal")()){var c,h,p,b,m,v,f,y,_;let o=(c=e==null?void 0:e.bar)==null?void 0:c.needle;if(!(o!=null&&o.show))return{show:!1,pct:null,color:(h=o==null?void 0:o.color)!=null?h:"#ffffff",borderColor:Ie((p=o==null?void 0:o.color)!=null?p:"#ffffff"),edge:"middle"};if(Number.isFinite(a))return{show:!1,pct:null,color:(b=o.color)!=null?b:"#ffffff",borderColor:Ie((m=o.color)!=null?m:"#ffffff"),edge:"middle"};if(!Number.isFinite(i))return{show:!1,pct:null,color:(v=o.color)!=null?v:"#ffffff",borderColor:Ie((f=o.color)!=null?f:"#ffffff"),edge:"middle"};let u=Math.min(100,Math.max(0,$t(i,t,r))),d=ae(u,n);return{show:!0,pct:d,color:(y=o.color)!=null?y:"#ffffff",borderColor:Ie((_=o.color)!=null?_:"#ffffff"),edge:d<=0?"left":d>=100?"right":"middle"}}function Fr(i){let e=String(i||"").trim();if(!e)return null;let t=e.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let a=t[1],n=a.length===3?a.split("").map(s=>s+s).join(""):a;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16)}}let r=e.match(/^rgba?\(([^)]+)\)$/i);if(r){let a=r[1].split(",").map(n=>n.trim());if(a.length>=3)return{r:Math.max(0,Math.min(255,parseFloat(a[0]))),g:Math.max(0,Math.min(255,parseFloat(a[1]))),b:Math.max(0,Math.min(255,parseFloat(a[2])))}}return null}function Oi({r:i,g:e,b:t}){let r=i/255,a=e/255,n=t/255,s=Math.max(r,a,n),l=Math.min(r,a,n),o=(s+l)/2;if(s===l)return{h:0,s:0,l:o*100};let u=s-l,d=o>.5?u/(2-s-l):u/(s+l),c;switch(s){case r:c=((a-n)/u+(a<n?6:0))/6;break;case a:c=((n-r)/u+2)/6;break;default:c=((r-a)/u+4)/6;break}return{h:c*360,s:d*100,l:o*100}}function At(i){let e=Fr(i);if(!e)return"#f3f4f6";let{h:t,s:r,l:a}=Oi(e),n=Math.abs(a-90)>=Math.abs(a-10)?90:10,s=Math.max(40,Math.min(100,r));return`hsl(${Math.round(t)} ${Math.round(s)}% ${Math.round(n)}%)`}function xe(i){var e;return(e=i==null?void 0:i.color)!=null?e:"#888888"}function Ie(i){let e=Fr(i);if(!e)return"#000000";let t=a=>{let n=a/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};return .2126*t(e.r)+.7152*t(e.g)+.0722*t(e.b)<.22?"#ffffff":"#000000"}function Tt(i,e,{height:t,color:r=Ri(i.percent,e,i.min,i.max)}={}){var o,u,d,c,h,p,b,m,v,f,y;let a=i.baselinePercent,n=(d=i.baselinePositionPercent)!=null?d:ae(a,(u=(o=e.scale)==null?void 0:o.direction)!=null?u:"normal"),s=(c=e.baseline)==null?void 0:c.at,l=((h=e.baseline)==null?void 0:h.enabled)!==!1&&(Number.isFinite(a)||!!(s!=null&&s.entity)||(s==null?void 0:s.fixed)!==null&&(s==null?void 0:s.fixed)!==void 0||Number.isFinite(s==null?void 0:s.percent));return{animated:e.bar.animated,fill:Li(i.numericValue===null?Number.isFinite(a)?0:null:i.percent,t,e,r,i.targetPercent,a,i.min,i.max,i.needle.show,(b=(p=e.scale)==null?void 0:p.direction)!=null?b:"normal",(v=(m=e.bar)==null?void 0:m.direction)!=null?v:"normal"),baseline:{configured:l,percent:n,positionPercent:n,scalePercent:a},needle:{...i.needle,configured:((y=(f=e.bar)==null?void 0:f.needle)==null?void 0:y.show)&&!Number.isFinite(a)},markers:i.markers}}var Ir=H(()=>{he();ii()});function Pe(i){var h,p,b,m,v,f,y;if(!i)return"";let e=Number.isFinite(i.position)?i.position:0,t=xe(i),r=At(t),a=i.visible?"":"none",n=i.type==="target"?"diamond":i.type==="generic"?"circle":"triangle",s=dr(i.shape,n),l=(h=i.lane)!=null?h:i.type==="peak"?"above":"below",o=["partial","stale"].includes(i.historyStatus)?i.historyStatus:"",u=o==="partial"?"Partial history":o==="stale"?"Stale history":"",d=o?` data-history-status="${o}" data-history-edge="${e>90?"end":"start"}" title="${u}"`:"",c=`<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;if(i.type==="generic"){let _=l==="above"?["peak-inset","peak-outset"]:["target-inset","target-outset"];return`
    <div class="generic-marker" data-marker-id="${te(i.id)}" data-shape="${s}" data-lane="${l}" data-direction="${(p=i.direction)!=null?p:"inward"}" data-show-marker="${i.showMarker===!1?"false":"true"}" style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${a};">
      <div class="${_[0]}"></div>
      <div class="${_[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(b=i.direction)!=null?b:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${c}</svg>
    </div>`}return i.type==="target"||i.type==="floor"?`
    <div class="${`${i.type}-marker`}" data-shape="${s}" data-lane="${l}" data-direction="${(m=i.direction)!=null?m:"inward"}"${d} style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${a};">
      <div class="${i.type}-inset"></div>
      <div class="${i.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(v=i.direction)!=null?v:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${c}</svg>
    </div>`:`
    <div class="peak-marker" data-shape="${s}" data-lane="${l}" data-direction="${(f=i.direction)!=null?f:"inward"}"${d} style="left:${e}%;--marker-color:${t};--marker-contrast-color:${r};display:${a};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${s}" data-lane="${l}" data-direction="${(y=i.direction)!=null?y:"inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${c}</svg>
    </div>`}function ze(i,e){var s,l,o,u,d,c;if(!i||!e)return;let t=e.type==="generic"?"circle":e.type==="peak"||e.type==="floor"?"triangle":"diamond",r=dr(e.shape,t);if(le(i,"shape",r),le(i,"lane",(s=e.lane)!=null?s:e.type==="peak"?"above":"below"),le(i,"direction",(l=e.direction)!=null?l:"inward"),e.type==="peak"||e.type==="floor"){let h=["partial","stale"].includes(e.historyStatus)?e.historyStatus:"";le(i,"historyStatus",h),le(i,"historyEdge",e.position>90?"end":"start"),(o=i.setAttribute)==null||o.call(i,"title",h==="partial"?"Partial history":h==="stale"?"Stale history":"")}e.type==="generic"&&le(i,"showMarker",e.showMarker===!1?"false":"true");let a=(u=i.querySelector)==null?void 0:u.call(i,".marker-shape-svg");a&&(le(a,"shape",r),le(a,"lane",(d=e.lane)!=null?d:e.type==="peak"?"above":"below"),le(a,"direction",(c=e.direction)!=null?c:"inward")),J(i,"display",e.visible?"":"none"),e.visible&&Number.isFinite(e.position)&&J(i,"left",`${e.position}%`);let n=xe(e);J(i,"--marker-color",n),J(i,"--marker-contrast-color",At(n))}function Ar(i,e,{revealDuration:t=600}={}){var d,c,h,p;let r=i.querySelector(".bar-fill-reveal"),a=i.querySelector(".baseline-indicator"),n=i.querySelector('.bar-paint-layer[data-layer="base"]');if(r&&($e(r,`${e.fill.revealStyle};--sbcp-reveal-duration:${t}ms`),br(r,`bar-fill-reveal${e.animated?"":" no-anim"}`)),a){let b=(d=e.baseline.positionPercent)!=null?d:e.baseline.percent;J(a,"display",Number.isFinite(b)?"block":"none"),Number.isFinite(b)&&J(a,"left",`${b}%`)}if(n){let b=e.fill.paintLayers.find(m=>m.id==="base");b&&$e(n,`z-index:${b.zIndex};${b.paintStyle}${b.revealStyle}`)}let s=i.querySelector('.bar-paint-layer[data-layer="above-target"]');if(s){let b=e.fill.paintLayers.find(m=>m.id==="above-target");b&&$e(s,`z-index:${b.zIndex};${b.paintStyle}${b.revealStyle}`)}let l=i.querySelector(".needle-marker");l&&(J(l,"display",e.needle.show?"block":"none"),J(l,"left",`${(c=e.needle.pct)!=null?c:0}%`),J(l,"--needle-color",e.needle.color),J(l,"--needle-border-color",e.needle.borderColor),le(l,"edge",e.needle.edge));let o=e.markers,u=b=>{var m;return(m=o.find(v=>v.id===b||v.type===b))!=null?m:null};ze(i.querySelector(".target-marker"),u("target")),ze(i.querySelector(".peak-marker"),u("peak")),ze(i.querySelector(".floor-marker"),u("floor")),((p=(h=i.querySelectorAll)==null?void 0:h.call(i,".generic-marker[data-marker-id]"))!=null?p:[]).forEach(b=>{ze(b,u(b.dataset.markerId))})}function Tr(i,{insideContent:e=""}={}){var p,b;let t=i.fill,r=(p=i.baseline.positionPercent)!=null?p:i.baseline.percent,a=i.needle,n=i.baseline.configured?`<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(r)?`left:${r}%;display:block;`:"display:none;"}"></div>`:"",s=m=>{var v;return(v=i.markers.find(f=>f.id===m||f.type===m))!=null?v:null},l=Pe(s("peak")),o=Pe(s("target")),u=Pe(s("floor")),d=i.markers.filter(m=>m.type==="generic").map(Pe).join(""),c=a.configured?`
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${a.edge}" style="left:${(b=a.pct)!=null?b:0}%;--needle-color:${a.color};--needle-border-color:${a.borderColor};display:${a.show?"block":"none"};"></div>
      </div>`:"",h=t.paintLayers.map(m=>`
                  <div class="bar-paint-layer" data-layer="${m.id}" style="z-index:${m.zIndex};${m.paintStyle}${m.revealStyle}"></div>`).join("");return`<div class="bar-track">
                <div class="bar-fill-reveal${i.animated?"":" no-anim"}" style="${t.revealStyle}">
${h}
                </div>
                ${n}
                ${e}
                ${l}
                ${o}
                ${u}
                ${d}
                ${c}
              </div>`}var Bi=H(()=>{mr();Ir();fr()});function fn(i,e,t){if(!Fs.includes(t))return{action:"none"};let r=e&&typeof e=="object"&&!Array.isArray(e)?e:null;return r&&Object.prototype.hasOwnProperty.call(r,t)?r[t]:Object.prototype.hasOwnProperty.call(i!=null?i:{},t)?i[t]:Is[t]}function bn(i){return(i==null?void 0:i.action)!=="none"}function Pr(i,e){var r,a,n;let t=typeof i.composedPath=="function"?i.composedPath():[i.target];for(let s of t){if(!s||s===e)break;if(s.nodeType!==1)continue;let l=(r=s.tagName)==null?void 0:r.toLowerCase(),o=(a=s.getAttribute)==null?void 0:a.call(s,"role");if((n=s.matches)!=null&&n.call(s,'button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="link"],[role="slider"],[role="switch"],[role="checkbox"],[role="radio"]')||l!=null&&l.startsWith("ha-")&&s.tabIndex>=0||o&&["button","link","slider","switch","checkbox","radio"].includes(o))return!0}return i.defaultPrevented===!0}function vn(i,{resolveAction:e,dispatchAction:t,label:r}={}){if(!i||typeof i.addEventListener!="function"||typeof i.setAttribute!="function"||typeof i.removeAttribute!="function"||typeof e!="function"||typeof t!="function")return()=>{};let a=k=>e(k),n=k=>bn(a(k)),s=n("tap_action");s?(i.setAttribute("role","button"),i.setAttribute("tabindex","0"),r&&i.setAttribute("aria-label",r)):(i.removeAttribute("role"),i.removeAttribute("tabindex"),i.removeAttribute("aria-label"));let l=null,o=null,u=null,d=!1,c=!1,h=null,p=0,b=()=>{o!==null&&clearTimeout(o),o=null},m=()=>{u!==null&&clearTimeout(u),u=null,d=!1},v=()=>{h!==null&&clearTimeout(h),h=null,c=!1},f=()=>{v(),c=!0,h=setTimeout(v,0)},y=k=>{let R=a(k);bn(R)&&t({config:R,action:As[k]})},_=k=>{k.button!==void 0&&k.button!==0||Pr(k,i)||(v(),l={id:k.pointerId,held:!1,startedAt:k.timeStamp},b(),o=setTimeout(()=>{l&&(l.held=!0,m(),y("hold_action"))},mn))},x=k=>{if(!l||l.id!==void 0&&k.pointerId!==l.id)return;let R=l;if(k.timeStamp-R.startedAt>=mn&&!R.held&&(R.held=!0,m(),y("hold_action")),l=null,b(),f(),!(R.held||Pr(k,i))){if(n("double_tap_action")){d?(m(),y("double_tap_action")):(d=!0,u=setTimeout(()=>{d=!1,u=null,y("tap_action")},Ts));return}y("tap_action")}},g=()=>{l!=null&&l.held&&f(),l=null,b()},w=k=>{!s||k.repeat||Pr(k,i)||k.key!=="Enter"&&k.key!==" "||(k.preventDefault(),v(),p=Date.now()+500,y("tap_action"))},S=k=>{if(c){v();return}k.detail!==0||Date.now()<p||Pr(k,i)||y("tap_action")};return i.addEventListener("pointerdown",_),i.addEventListener("pointerup",x),i.addEventListener("pointercancel",g),i.addEventListener("lostpointercapture",g),i.addEventListener("keydown",w),i.addEventListener("click",S),()=>{b(),m(),v(),i.removeEventListener("pointerdown",_),i.removeEventListener("pointerup",x),i.removeEventListener("pointercancel",g),i.removeEventListener("lostpointercapture",g),i.removeEventListener("keydown",w),i.removeEventListener("click",S)}}var Fs,Is,As,mn,Ts,_n=H(()=>{Fs=Object.freeze(["tap_action","hold_action","double_tap_action"]),Is=Object.freeze({tap_action:Object.freeze({action:"more-info"}),hold_action:Object.freeze({action:"none"}),double_tap_action:Object.freeze({action:"none"})}),As=Object.freeze({tap_action:"tap",hold_action:"hold",double_tap_action:"double_tap"}),mn=500,Ts=250});var Pt,yn=H(()=>{Vt();Lr();he();ar();ri();si();mr();fr();or();yi();gi();Ir();Bi();_n();Pt=class extends HTMLElement{static async getConfigElement(){return Dt("sensor-bar-card-plus-editor")}constructor(){super(),this.attachShadow({mode:"open"}),this._baseDomReady=!1,this._config={},this._actionConfig={},this._diagnostics={warnings:[],errors:[]},this._lastDiagnosticsSignature=null,this._hass=null,this._historicalRuntime=new Fe,this._historicalUpdate=()=>{this._historicalUpdateScheduled||(this._historicalUpdateScheduled=!0,Promise.resolve().then(()=>{this._historicalUpdateScheduled=!1,this._historicalRuntime.attached&&this._update()}))},this._rowScales=new WeakMap,this._rowGeneration=0,this._rowPresence=[],this._leftModeResponsiveHistory=new WeakMap,this._rendered=!1,this._rowActionCleanup=[],this._resizeObserver=null,this._densityPassScheduled=!1,this._densityPassDirty=!1,this._densityPassFrame=null,this._densityPassRetries=0,this._boundWindowResize=()=>this._schedulePostLayoutDensityPass(),this._markerHover=null,this._boundMarkerPointerOver=e=>this._handleMarkerPointerOver(e),this._boundMarkerPointerOut=e=>this._handleMarkerPointerOut(e),this._ensureBaseDom()}connectedCallback(){var e;this._historicalRuntime.attach(),window.addEventListener("resize",this._boundWindowResize,{passive:!0}),this._setupResizeObserver(),(e=this._config)!=null&&e.entities&&this._hass&&this._attachRowActionHandlers(this.shadowRoot.querySelectorAll(".row[data-entity]")),this._schedulePostLayoutDensityPass()}disconnectedCallback(){this._historicalRuntime.detach(),this._rowGeneration+=1,this._clearRowActionHandlers(),window.removeEventListener("resize",this._boundWindowResize),this._clearMarkerHover(),this._disconnectResizeObserver(),this._densityPassFrame&&(cancelAnimationFrame(this._densityPassFrame),this._densityPassFrame=null),this._densityPassScheduled=!1,this._densityPassDirty=!1}setConfig(e){var r;if(!e.entities&&!e.entity)throw new Error("You must define entities or entity");this._rendered=!1,this._clearRowActionHandlers(),this._rowGeneration+=1;let t=this._config;this._actionConfig=e,this._config=this.normalizeCardConfig(e),this._rowScales=new WeakMap,this._reconcileRowHistory((r=t==null?void 0:t.entities)!=null?r:[]),this._historicalRuntime.setConsumers(wr(this._config.entities),this._historicalUpdate),this._diagnostics=sr(this._config),this._logDiagnostics(),this._render()}_reconcileRowHistory(e){var u,d,c,h;let t=(p,b="")=>{if(Array.isArray(p))return p.map(t);if(p&&typeof p=="object")return Object.fromEntries(Object.keys(p).sort().filter(m=>!["severity","segment_space","label_precision_key"].includes(m)).map(m=>[m,t(p[m],m)]));if(b==="fixed")return Ne(null,p);if(/color/i.test(b)&&typeof p=="string"&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(p.trim())){let m=p.trim().slice(1).toLowerCase();return`#${m.length===3?m.split("").map(v=>v+v).join(""):m}`}return p},r=p=>{var b;return JSON.stringify(t({entity:p.entity,name:p.name,icon:(b=p.icon)!=null?b:null,layout:p.layout,scale:{direction:p.scale.direction,...Object.fromEntries(["min","max"].map(m=>[m,{...p.scale[m],fixed_explicit:p.scale[m].fixed_explicit!==!1}]))},bar:p.bar,baseline:p.baseline,formatting:p.formatting,target_marker:p.target_marker,peak_marker:p.peak_marker,floor_marker:p.floor_marker,generic_markers:p.generic_markers}))},a=new Set(e),n=new Map,s=new Map(e.map(p=>[p,r(p)]));for(let p of this._config.entities){let b=r(p),m=[...a].find(v=>s.get(v)===b);m&&(n.set(p,m),a.delete(m))}let l=this._config.entities.filter(p=>!n.has(p));for(let p of l){let b=[...a].filter(v=>v.entity===p.entity),m=l.filter(v=>v.entity===p.entity);b.length!==1||m.length!==1||(n.set(p,b[0]),a.delete(b[0]))}let o=new WeakMap;for(let[p,b]of n)((d=(u=b.layout)==null?void 0:u.label)==null?void 0:d.position)==="left"&&((h=(c=p.layout)==null?void 0:c.label)==null?void 0:h.position)==="left"&&this._leftModeResponsiveHistory.has(b)&&o.set(p,this._leftModeResponsiveHistory.get(b));this._leftModeResponsiveHistory=o}_clearRowActionHandlers(){this._rowActionCleanup.forEach(e=>e()),this._rowActionCleanup=[]}_attachRowActionHandlers(e){this._clearRowActionHandlers(),e.forEach(t=>{var l,o;let r=Number(t.dataset.rowIndex),a=t.dataset.entity,s=vn(t,{resolveAction:u=>{var c;let d=Array.isArray((c=this._actionConfig)==null?void 0:c.entities)?this._actionConfig.entities[r]:null;return fn(this._actionConfig,d,u)},label:(o=(l=t.getAttribute)==null?void 0:l.call(t,"aria-label"))!=null?o:a,dispatchAction:({config:u,action:d})=>{let c={...this._actionConfig,entity:a,[d==="double_tap"?"double_tap_action":`${d}_action`]:u},h=new CustomEvent("hass-action",{bubbles:!0,composed:!0,detail:{config:c,action:d}});this.dispatchEvent(h)}});this._rowActionCleanup.push(s)})}_logDiagnostics(){var r;let e=(r=this._diagnostics)!=null?r:{warnings:[],errors:[]},t=JSON.stringify(e);t!==this._lastDiagnosticsSignature&&(this._lastDiagnosticsSignature=t,e.warnings.forEach(a=>{console.warn(`[sensor-bar-card-plus] ${a.message}`,a)}),e.errors.forEach(a=>{console.warn(`[sensor-bar-card-plus] ${a.message}`,a)}))}normalizeCardConfig(e){return ir(e)}normalizeEntityConfig(e,t){return Qr(e,t)}normalizeResolvableValue(e,t,r=null){return G(e,t,r)}_looksLikeEntityId(e){return ne(e)}_parsePercentLiteral(e){return ge(e)}_getFiniteNumber(e){return B(e)}normalizeStructuredResolvableValue(e,t=null,r=null,a={}){return me(e,t,r,a)}normalizeBaselineDirectionConfig(e,t=null){return Se(e,t)}normalizeBaselineConfig(e,t){return Zt(e,t)}inferSegmentEndValues(e,t=null){return xr(e,t)}normalizeSeverityToSegments(e){return Kt(e)}_hasResolvableMagnitude(e){return!!e&&(Number.isFinite(this._getFiniteNumber(e.fixed))||Number.isFinite(e.percent))}normalizeGaugeSegments(e){return mt(e)}normalizeScaleBound(e,t,r,a){return Gt(e,t,r,a)}normalizeScaleConfig(e,t){return Xt(e,t)}_fillStyleToColorMode(e){return Kr(e)}_colorModeToFillStyle(e){return _t(e)}_normalizeBarModeConfig(e=null,t=null){return Me(e,t)}_resolveNormalizedBarMode(e,t,r,a){return Jr(e,t,r,a)}_normalizeGradientStops(e){return Yr(e)}normalizeNeedleConfig(e,t=null){return Zr(e,t)}normalizeBarConfig(e,t){return Qt(e,t)}normalizeLayoutConfig(e,t){return Ct(e,t)}_clampSupportedRowHeight(e){return Xr(e)}normalizeFormattingConfig(e,t){return er(e,t)}normalizeTargetMarkerConfig(e,t){return tr(e,t)}normalizePeakMarkerConfig(e,t){return rr(e,t)}_normalizeOptionalEnabled(e){return bt(e)}set hass(e){let t=this._hass;if(this._hass=e,this._historicalRuntime.setHass(e),!!this._config.entities){if(!t){this._update();return}this._shouldUpdate(t,e)&&this._update(t)}}_resolve(e){var a,n,s,l,o,u,d;let t=e!=null&&e._normalized?e:this.normalizeEntityConfig(e,this._config),r=(s=(n=(a=this._hass)==null?void 0:a.states)==null?void 0:n[t.entity])!=null?s:null;return{...t,icon:t.icon===!1?!1:(u=(o=t.icon)!=null?o:(l=r==null?void 0:r.attributes)==null?void 0:l.icon)!=null?u:this._getDefaultEntityIcon(r,t.entity),name:(d=t.name)!=null?d:null}}_getDefaultEntityIcon(e,t=""){var s,l,o;let r=String((l=(s=e==null?void 0:e.attributes)==null?void 0:s.device_class)!=null?l:"").trim();if(r){let u={apparent_power:"mdi:flash",battery:"mdi:battery",carbon_dioxide:"mdi:molecule-co2",current:"mdi:current-ac",energy:"mdi:lightning-bolt",gas:"mdi:meter-gas",humidity:"mdi:water-percent",monetary:"mdi:cash",power:"mdi:flash",pressure:"mdi:gauge",temperature:"mdi:thermometer",voltage:"mdi:sine-wave",water:"mdi:water",weight:"mdi:weight",wind_speed:"mdi:weather-windy"};if(u[r])return u[r]}let a=String(t||"").split(".")[0];return(o={sensor:"mdi:eye",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb"}[a])!=null?o:null}_shouldUpdate(e,t){var r,a,n,s,l,o,u,d,c,h,p;if(!this._config||!this._config.entities)return!0;for(let b of this._config.entities){let m=this._resolve(b),v=[b.entity,(a=(r=m.scale)==null?void 0:r.min)==null?void 0:a.entity,(s=(n=m.scale)==null?void 0:n.max)==null?void 0:s.entity,(o=(l=m.baseline)==null?void 0:l.at)==null?void 0:o.entity,(d=(u=m.target_marker)==null?void 0:u.source)==null?void 0:d.entity,...((c=m.generic_markers)!=null?c:[]).filter(f=>f.accepted).flatMap(f=>{var y,_;return[(y=f.source)==null?void 0:y.entity,(_=f.label)==null?void 0:_.entity]})].filter(Boolean);for(let f of v){let y=(h=e.states[f])!=null?h:null,_=(p=t.states[f])!=null?p:null;if(y!==_)return!0}}return!1}_setStyleIfChanged(e,t,r){return J(e,t,r)}_setStyleTextIfChanged(e,t){return $e(e,t)}_setTextIfChanged(e,t){var a;if(!e)return!1;let r=t==null?"":String(t);return((a=e.textContent)!=null?a:"")===r?!1:(e.textContent=r,!0)}_setDatasetIfChanged(e,t,r){return le(e,t,r)}_setClassNameIfChanged(e,t){return br(e,t)}_repositionAllTargetLabels(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{this._positionTargetLabel(e),this._positionMarkerValueLabel(e,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(e,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(e)})}_positionGenericMarkerLabels(e){var t,r;((r=(t=e.querySelectorAll)==null?void 0:t.call(e,".generic-value-label[data-marker-id]"))!=null?r:[]).forEach(a=>{let n=a.dataset.markerId;this._positionMarkerValueLabel(e,`.generic-value-label[data-marker-id="${n}"]`,`.generic-marker[data-marker-id="${n}"]`)})}_positionTargetLabel(e){this._positionMarkerValueLabel(e,".target-value-label",".target-marker")}_getMarkerLabel(e){var a;let t=e==null?void 0:e.closest(".row");if(!t)return null;if(e.matches(".generic-marker[data-marker-id]")){let n=e.dataset.markerId;return(a=[...t.querySelectorAll(".generic-value-label[data-marker-id]")].find(s=>s.dataset.markerId===n))!=null?a:null}let r=e.matches(".target-marker")?".target-value-label":e.matches(".peak-marker")?".peak-value-label":e.matches(".floor-marker")?".floor-value-label":null;return r?t.querySelector(r):null}_getGenericMarkerForLabel(e){var a,n;let t=e==null?void 0:e.closest(".row"),r=(a=e==null?void 0:e.dataset)==null?void 0:a.markerId;return!t||!r?null:(n=[...t.querySelectorAll(".generic-marker[data-marker-id]")].find(s=>s.dataset.markerId===r))!=null?n:null}_setMarkerHover(e){var r;let t=this._getMarkerLabel(e);if(!t||e.style.display==="none"||getComputedStyle(t).visibility!=="visible"){this._clearMarkerHover(e);return}((r=this._markerHover)==null?void 0:r.label)!==t&&(this._clearMarkerHover(),t.dataset.markerHovered="true",this._markerHover={marker:e,label:t})}_clearMarkerHover(e=null){!this._markerHover||e&&this._markerHover.marker!==e||(delete this._markerHover.label.dataset.markerHovered,this._markerHover=null)}_handleMarkerPointerOver(e){var a,n,s;if(e.pointerType==="touch")return;let t=(n=(a=e.target)==null?void 0:a.closest)==null?void 0:n.call(a,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker'),r=(s=t==null?void 0:t.matches)!=null&&s.call(t,".generic-value-label")?this._getGenericMarkerForLabel(t):t;r&&this._setMarkerHover(r)}_handleMarkerPointerOut(e){var a,n;if(e.pointerType==="touch")return;let t=(n=(a=e.target)==null?void 0:a.closest)==null?void 0:n.call(a,'.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');if(!t||t.contains(e.relatedTarget))return;let r=t.matches(".generic-value-label")?this._getGenericMarkerForLabel(t):t;r&&this._clearMarkerHover(r)}_positionMarkerValueLabel(e,t,r){let a=e.querySelector(".bar-track"),n=e.querySelector(t),s=e.querySelector(r);if(!a||!n||!s)return;if(s.style.display==="none"||!n.textContent.trim()){this._setStyleIfChanged(n,"visibility","hidden");return}let l=a.getBoundingClientRect(),o=Math.max(0,Math.floor(l.width-4));this._setStyleIfChanged(n,"maxWidth",`${o}px`);let u=n.getBoundingClientRect(),d=parseFloat(s.style.left);if(!Number.isFinite(d)||l.width<=0||u.width<=0||o<=10){this._setStyleIfChanged(n,"visibility","hidden");return}let c=d/100*l.width,h=u.width/2,p=Math.max(h,Math.min(l.width-h,c));this._setStyleIfChanged(n,"left",`${p}px`),this._setStyleIfChanged(n,"transform","translateX(-50%)"),this._setStyleIfChanged(n,"visibility","visible")}_getEntityNumericValue(e){return Re(this._hass,e)}_getNumericValue(e,t=null){return Ne(this._hass,e,t)}_resolvePercentValue(e,t,r){return ei(e,t,r)}_getNormalizedResolvableNumericValue(e,t=null,r=null){return be(this._hass,e,t,r)}_hexToRgb(e){return Ae(e)}_getSeverityInterpolationStops(e,t=0,r=100){return $r(e,t,r)}_getSeverityBandGradientCss(e,t=0,r=100){return xi(e,t,r)}_getSoftBandBlendWidthPct(){return ki()}_pushGradientColorStop(e,t,r){return _e(e,t,r)}_getSoftBandGradientStops(e,t=0,r=100){return Ft(e,t,r)}_getSoftBandGradientCss(e,t=0,r=100){return Si(e,t,r)}_resolveSegmentBoundaryPct(e,t,r){return kr(e,t,r)}_getEffectiveFillStyle(e){return It(e)}_segmentsNeedBoundaryResolution(e){return Mi(e)}_getSegmentsForRendering(e,t=0,r=100){return Te(e,t,r)}_getColor(e,t,r=0,a=100){return Ri(e,t,r,a)}_buildFullScaleGradientStyle(e){return Ni(e)}_getGradientInterpolationStops(e,t=0,r=100){return $i(e,t,r)}_rgbToCss(e){return Fi(e)}_buildSolidGradientStyle(e){return Sr(e)}_getBasePaintGradient(e,t,r=0,a=100){return Ii(e,t,r,a)}_getOverlayGradient(e,t,r){return Mr(e,t,r)}_toScalePct(e,t,r){return $t(e,t,r)}_getRevealTransitionDuration(e,t){return Nr(e,t)}_resolveBaselinePct(e,t,r){var n,s;if(((n=e.baseline)==null?void 0:n.enabled)===!1)return null;let a=this._getNormalizedResolvableNumericValue((s=e.baseline)==null?void 0:s.at,t,r);return Number.isFinite(a)?this._toScalePct(a,t,r):null}_formatNumericDisplay(e,t=null){return fe(e,t)}_getNormalizedPercent(e,t=null){return Ai(e,t)}_getEndpointSemantics(e){return Ti(e)}_getRevealCornerRadii(e){return Pi(e)}_getAboveTargetOverlayInterval(e=null){return zi(e)}_getAboveTargetLayerGeometry(e=null){return Wi(e)}_getFullScalePaintStyle(e,t,r=null,a=null,n=0,s=100){return qi(e,t,r,a,n,s)}_getRevealShapeStyle(e,t){return Di(e,t)}_getStaticLayerRevealStyle(e){return Rr(e)}_getFillPaintLayers(e,t,r,a,n=null,s=null,l=0,o=100){return Vi(e,t,r,a,n,s,l,o)}_getFillRenderState(e,t,r,a,n=null,s=null,l=0,o=100,u=!1){return Li(e,t,r,a,n,s,l,o,u)}_getNeedleRenderState(e,t,r=0,a=100,n=null){return pn(e,t,r,a,n)}_ensureBaseDom(){if(!this._baseDomReady){if(this.shadowRoot.querySelector("ha-card")){this._baseDomReady=!0;return}this.shadowRoot.innerHTML=`
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
${Lt}
${Bt('.row[data-bar-animated="false"]')}
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
${Ot}
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
    `,this.shadowRoot.addEventListener("pointerover",this._boundMarkerPointerOver),this.shadowRoot.addEventListener("pointerout",this._boundMarkerPointerOut),this._baseDomReady=!0}}_render(){let e=this._config;this._ensureBaseDom();let t=this.shadowRoot.querySelector(".card-title");t&&(e.title?(t.textContent=e.title,t.style.display=""):(t.textContent="",t.style.display="none")),this._setupResizeObserver(),this._update(),this._schedulePostLayoutDensityPass()}_setupResizeObserver(){if(!this.isConnected||this._resizeObserver)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let r=new ResizeObserver(()=>{!this.isConnected||this._resizeObserver!==r||(this._applyCompactTier(),this._schedulePostLayoutDensityPass())});this._resizeObserver=r,this._applyCompactTier(),r.observe(e),r.observe(this)}_disconnectResizeObserver(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_isReliableWidth(e,t=16){return Number.isFinite(e)&&e>=t}_getHeroLabelReservedWidth(e,t,r){var s,l,o;if(r||!e||!t)return 0;let a=Math.floor((l=(s=e.getBoundingClientRect)==null?void 0:s.call(e).width)!=null?l:0),n=Math.ceil(t.scrollWidth||((o=t.getBoundingClientRect)==null?void 0:o.call(t).width)||0);return!this._isReliableWidth(a,8)||!Number.isFinite(n)||n<=0?0:Math.min(n,a*.45)}_classifyCompactTier(e,t="normal"){return this._isReliableWidth(e)?e<180?"compressed":e<220?"dense":e<280?"tight":e<360?"compact":"normal":t||"normal"}_classifyLeftDensity(e,t="normal",r=Number.POSITIVE_INFINITY){if(!this._isReliableWidth(e))return t||"normal";let a=["normal","compact","tight","dense","compressed"],n="normal";e<170?n="compressed":e<210?n="dense":e<255?n="tight":e<320&&(n="compact");let s=a.indexOf(n),l=Number.isFinite(r)?r<=44&&e>=205?2:r<=72&&e>=185?1:0:0;return a[Math.max(0,s-l)]}_classifyRowDensity(e,t="normal"){return this._isReliableWidth(e)?e<150?"compressed":e<190?"dense":e<245?"tight":e<300?"compact":"normal":t||"normal"}_schedulePostLayoutDensityPass(){if(this.isConnected){if(this._densityPassScheduled){this._densityPassDirty=!0;return}this._densityPassScheduled=!0,this._densityPassFrame=requestAnimationFrame(()=>{var a,n;this._densityPassScheduled=!1,this._densityPassFrame=null;let e=this._densityPassDirty;if(this._densityPassDirty=!1,!this.isConnected)return;let t=(a=this.shadowRoot)==null?void 0:a.querySelector("ha-card"),r=(n=t==null?void 0:t.getBoundingClientRect().width)!=null?n:0;if(!this._isReliableWidth(r)){this._densityPassRetries<4&&(this._densityPassRetries+=1,this._schedulePostLayoutDensityPass());return}this._densityPassRetries=0,this._applyCompactTier(),this._runPostLayoutPasses(),e&&this._schedulePostLayoutDensityPass()})}}_applyCompactTier(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector("ha-card"),t=this.shadowRoot.querySelector(".card");if(!e||!t)return;let r=e.getBoundingClientRect().width;if(!this._isReliableWidth(r)){this._schedulePostLayoutDensityPass(),t.dataset.compact||(t.dataset.compact="normal");return}t.dataset.compact=this._classifyCompactTier(r,t.dataset.compact)}_applyLeftModeDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.leftDensity||(e.dataset.leftDensity="normal");return}let r=e.querySelector(".label-left-text"),a=((r==null?void 0:r.textContent)||"").trim(),n=r?this._measureTextWidthWithStyles(r,a)||r.scrollWidth:Number.POSITIVE_INFINITY,s=this._classifyLeftDensity(t,e.dataset.leftDensity,n);e.dataset.leftDensity=s})}_applyInsideLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".bar-inner-label").forEach(e=>{var w,S,k,R,M,N;let t=e.closest(".bar-track"),r=e.closest(".main-line"),a=e.querySelector(".inside-name"),n=e.querySelector(".inside-value");if(!t||!a||!n)return;let s=this._decodeDataAttr(n.dataset.display||n.textContent||""),l=this._decodeDataAttr(n.dataset.unit||"");n.dataset.valueFit="normal",e.dataset.valueFit="normal";let o=this._measureInsideValueMarkupWidth(n,s,l,!1),u=this._measureInsideValueMarkupWidth(n,s,l,!0),d=(S=(w=r==null?void 0:r.getBoundingClientRect)==null?void 0:w.call(r).width)!=null?S:0,c=this._isReliableWidth(d)?this._classifyRowDensity(d,(k=r==null?void 0:r.dataset)==null?void 0:k.rowDensity):((R=r==null?void 0:r.dataset)==null?void 0:R.rowDensity)||"normal",h=(N=(M=r==null?void 0:r.querySelector)==null?void 0:M.call(r,".icon-wrap"))!=null?N:null,p=h?this._getLeftModeIconWidth(h,r)+this._getLeftModeGap(r):0,b=this._getLeftModeBarMinWidth(r),m=this._isReliableWidth(d)?Math.max(b,d-p):t.getBoundingClientRect().width,v=this._isReliableWidth(d)?Math.max(b,d):m+p,f=(a.textContent||"").trim(),y=this._measureTextWidthWithStyles(a,f)||a.scrollWidth,_=$=>{let F=c==="compressed"?"compressed":this._classifyInsideDensity($,o);e.dataset.insideDensity=F,e.dataset.valueFit="normal",n.dataset.valueFit="normal";let I=this._getNumericStyleValue(e,"padding-left",0)+this._getNumericStyleValue(e,"padding-right",0),P=Math.max(0,$-I),L=!!l&&o>P,W=L?u:o,O="normal";W>P&&(O="compact",e.dataset.valueFit=O,n.dataset.valueFit=O,P=Math.max(0,$-this._getNumericStyleValue(e,"padding-left",0)-this._getNumericStyleValue(e,"padding-right",0)),W=this._measureInsideValueMarkupWidth(n,s,l,!0));let q=W>P,D=q?0:this._getNumericStyleValue(e,"gap",0),j=Math.max(0,Math.min(P*(F==="compact"?.56:F==="tight"?.48:.6),P-(q?0:Math.ceil(W))-D)),Y=F==="dense"||F==="compressed";if(f&&y>0){let V=this._getInsideUsefulNameWidth(a,f,y),E=this._measureVisibleLabelCharacters(a,f,j);Y=j<V||y>j+1&&E<Math.min(4,f.length)}return{density:F,valueFit:O,hideUnit:L,hideValue:q,hideName:Y,rank:q?3:O==="compact"?2:L?1:0}},x=c==="dense"||c==="compressed",g=_(x?v:m);if(h&&!x){let $=_(v);($.rank<g.rank||$.rank===g.rank&&g.hideName&&!$.hideName)&&(x=!0,g=$)}e.dataset.insideDensity=g.density,e.dataset.valueFit=g.valueFit,e.dataset.hideName=g.hideName?"true":"false",n.dataset.valueFit=g.valueFit,n.dataset.hideUnit=g.hideUnit?"true":"false",n.dataset.hideValue=g.hideValue?"true":"false",r&&(r.dataset.hideInsideIcon=x?"true":"false")})}_classifyInsideDensity(e,t){return e<Math.max(72,t+12)?"compressed":e<t+56?"dense":e<t+92?"tight":e<t+128?"compact":"normal"}_applyRowDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line").forEach(e=>{let t=e.getBoundingClientRect().width;if(!this._isReliableWidth(t)){this._schedulePostLayoutDensityPass(),e.dataset.rowDensity||(e.dataset.rowDensity="normal");return}e.dataset.rowDensity=this._classifyRowDensity(t,e.dataset.rowDensity)})}_applyAboveLabelDensity(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach(e=>{var _,x,g,w,S,k,R,M,N,$,F,I,P,L,W;let t=e.querySelector(".above-bar-label, .hero-header");if(!t)return;let r=e.classList.contains("hero-line"),a=r?this._getHeroDensityWidth(e):t.getBoundingClientRect().width,n="normal";if(a<90?n="xs":a<110?n="compressed":a<150?n="dense":a<210?n="tight":a<280&&(n="compact"),r){e.dataset.heroDensity=n,t.dataset.hideName=n==="dense"||n==="compressed"||n==="xs"?"true":"false",e.dataset.hideHeroIcon=n==="compressed"||n==="xs"?"true":"false";return}e.dataset.aboveDensity=n;let s=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-name"):null,l=typeof t.querySelector=="function"?t.querySelector(".above-bar-label-value"):null,o=this._decodeDataAttr(((_=l==null?void 0:l.dataset)==null?void 0:_.display)||""),u=this._decodeDataAttr(((x=l==null?void 0:l.dataset)==null?void 0:x.unit)||""),d=(g=e.closest)==null?void 0:g.call(e,".row"),c=(w=d==null?void 0:d.querySelector)==null?void 0:w.call(d,".main-line.above-mode"),h=((S=c==null?void 0:c.dataset)==null?void 0:S.rowDensity)||"normal",p=(R=(k=c==null?void 0:c.querySelector)==null?void 0:k.call(c,".icon-wrap"))!=null?R:null,b=(M=p==null?void 0:p.getBoundingClientRect)==null?void 0:M.call(p),m=p&&typeof getComputedStyle=="function"?getComputedStyle(p):null,v=!!p&&h!=="compressed"&&(m==null?void 0:m.display)!=="none"&&((N=b==null?void 0:b.width)!=null?N:0)>0&&(($=b==null?void 0:b.height)!=null?$:0)>0,f=n==="dense"||n==="compressed",y=!v;if(s&&l&&o){let O=(F=e.closest)==null?void 0:F.call(e,".row-stack"),q=(W=(L=(I=O==null?void 0:O.getBoundingClientRect)==null?void 0:I.call(O).width)!=null?L:(P=e.getBoundingClientRect)==null?void 0:P.call(e).width)!=null?W:a,D=typeof e.querySelector=="function"?e.querySelector(".above-icon-spacer"):null,T=v?b.width:0,j=D?this._getNumericStyleValue(e,"gap",0):0,Y=this._getNumericStyleValue(e,"--sbcp-main-gap",this._getLeftModeGap(e)),V=Math.ceil(this._measureValueMarkupWidth(l,o,u,!1)+2),E=Math.ceil(this._measureValueMarkupWidth(l,o,u,!0)+2),z=(s.textContent||"").trim(),U=v&&T>0?T+j:0,X=this._measureTextWidthWithStyles(s,z)||s.scrollWidth||0,Z=Math.max(0,q-U-Y),Q=(se,ue=Z)=>{let oe=Math.max(0,ue-se),ye=this._measureVisibleLabelCharacters(s,z,oe);return!this._shouldHideLeftLabel(z,X,oe,ye)},ie=Math.max(0,q),C=!1;V<=Z&&Q(V)?(f=!1,y=!v):V<=ie?(f=!Q(V,q-Y),y=!0):E<=Z&&Q(E)?(f=!1,C=!!u,y=!v):Q(E,q-Y)?(f=!1,y=!0,C=!!u):(f=!0,y=!0,C=!!u&&V>ie),l.dataset.hideUnit=C?"true":"false"}else l&&(l.dataset.hideUnit="false");t.dataset.hideName=f?"true":"false",e.dataset.hideAboveIcon=y?"true":"false"})}_getHeroDensityWidth(e){var l,o,u,d,c,h,p,b,m;let t=(l=e==null?void 0:e.closest)==null?void 0:l.call(e,".row"),r=(o=e==null?void 0:e.closest)==null?void 0:o.call(e,".row-stack"),a=(u=r==null?void 0:r.querySelector)==null?void 0:u.call(r,".main-line.hero-mode"),n=(d=a==null?void 0:a.querySelector)==null?void 0:d.call(a,".bar-wrap"),s=[(c=t==null?void 0:t.getBoundingClientRect)==null?void 0:c.call(t).width,(h=r==null?void 0:r.getBoundingClientRect)==null?void 0:h.call(r).width,(p=a==null?void 0:a.getBoundingClientRect)==null?void 0:p.call(a).width,(b=n==null?void 0:n.getBoundingClientRect)==null?void 0:b.call(n).width,(m=e==null?void 0:e.getBoundingClientRect)==null?void 0:m.call(e).width];for(let v of s)if(this._isReliableWidth(v,8))return v;return 0}_measureHeroValueWidth(e,t,r="normal",a=!1){var p,b,m,v,f,y,_,x,g,w,S,k,R,M;let n=(p=this.shadowRoot)==null?void 0:p.querySelector(".measure-layer");if(!n||!e||!t)return 0;let s=this._decodeDataAttr(t.dataset.display||t.textContent||""),l=this._decodeDataAttr(t.dataset.unit||"");if(!s)return 0;let o=document.createElement("div");o.className="hero-line",o.dataset.heroSize=e.dataset.heroSize||"medium",o.dataset.heroDensity=e.dataset.heroDensity||"normal",o.dataset.heroValueFit=r,o.dataset.hideHeroUnit=a?"true":"false",o.style.display="inline-block",this._setStyleIfChanged(o,"--sbcp-hero-base-size",((m=(b=e.style)==null?void 0:b.getPropertyValue)==null?void 0:m.call(b,"--sbcp-hero-base-size"))||null);let u=document.createElement("span");u.className="hero-value",u.dataset.display=t.dataset.display||"",u.dataset.unit=t.dataset.unit||"",u.innerHTML=this._formatRightValueMarkup(s,l,a),u.style.display="inline-flex",u.style.flex="0 0 auto",u.style.width="auto",u.style.minWidth="0",u.style.maxWidth="none",u.style.justifyContent="flex-start",u.style.justifySelf="start",u.style.overflow="visible";let d=u.querySelector(".value-right-text");d&&(d.style.display="inline-flex",d.style.flex="0 0 auto",d.style.width="auto",d.style.minWidth="0",d.style.maxWidth="none",d.style.justifyContent="flex-start",d.style.overflow="visible");let c=u.querySelector(".value-right-number");c&&(c.style.flex="0 0 auto",c.style.minWidth="0",c.style.overflow="visible",c.style.textOverflow="clip");let h=u.querySelector(".unit-group");return h&&(h.style.flex="0 0 auto",h.style.minWidth="0",h.style.overflow="visible"),o.appendChild(u),n.replaceChildren(o),Math.max(Math.ceil((f=(v=u.getBoundingClientRect)==null?void 0:v.call(u).width)!=null?f:0),Math.ceil(u.scrollWidth||0),Math.ceil((x=(_=(y=d==null?void 0:d.getBoundingClientRect)==null?void 0:y.call(d).width)!=null?_:d==null?void 0:d.scrollWidth)!=null?x:0),Math.ceil((S=(w=(g=c==null?void 0:c.getBoundingClientRect)==null?void 0:g.call(c).width)!=null?w:c==null?void 0:c.scrollWidth)!=null?S:0),Math.ceil((M=(R=(k=h==null?void 0:h.getBoundingClientRect)==null?void 0:k.call(h).width)!=null?R:h==null?void 0:h.scrollWidth)!=null?M:0))}_applyHeroValueFit(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".hero-line").forEach(e=>{var p,b;let t=e.querySelector(".hero-header"),r=e.querySelector(".hero-label"),a=e.querySelector(".hero-value"),n=e.querySelector(".unit-group");if(!t||!a)return;e.dataset.hideHeroUnit="false",e.dataset.heroValueFit="normal",delete t.dataset.priorityHideName;let s=Math.floor((b=(p=t.getBoundingClientRect)==null?void 0:p.call(t).width)!=null?b:0);if(!this._isReliableWidth(s,8)){this._schedulePostLayoutDensityPass();return}let l=!!n&&n.textContent.trim().length>0,o=t.dataset.hideName==="true",u=!o&&r?this._getNumericStyleValue(t,"column-gap",0):0,d=(m="normal",v=!1)=>this._measureHeroValueWidth(e,a,m,v),c=Math.max(0,s-u-4),h=Math.max(0,s-4);if(!this._isReliableWidth(h,8)){e.dataset.hideHeroUnit=l?"true":"false",e.dataset.heroValueFit="minimum",this._schedulePostLayoutDensityPass();return}if(!(d("normal",!1)<=c)&&!(!o&&r&&(t.dataset.priorityHideName="true",d("normal",!1)<=h))){if(l){for(let m of["tight","minimum"]){let v=d(m,!1);if(v<=h){if(e.dataset.heroValueFit=m,!o&&r){let f=(r.textContent||"").trim(),y=this._measureTextWidthWithStyles(r,f),_=Math.max(0,c-v);this._shouldHideLeftLabel(f,y,_,this._measureVisibleLabelCharacters(r,f,_))||delete t.dataset.priorityHideName}return}}if(e.dataset.hideHeroUnit="true",d("normal",!0)<=h)return}e.dataset.heroValueFit="tight",!(d("tight",l)<=h)&&(e.dataset.heroValueFit="minimum",!(d("minimum",l)<=h)&&(e.dataset.heroValueFit="hidden"))}})}_measureValueMarkupWidth(e,t,r,a){var l;let n=(l=this.shadowRoot)==null?void 0:l.querySelector(".measure-layer");if(!n||!e)return 0;let s=e.cloneNode(!1);return s.removeAttribute("data-hide-unit"),s.style.removeProperty("--sbcp-value-extra-width"),s.style.width="auto",s.style.minWidth="0",s.style.maxWidth="none",s.style.flex="0 0 auto",s.innerHTML=this._formatRightValueMarkup(t,r,a),n.replaceChildren(s),s.scrollWidth}_measureInsideValueMarkupWidth(e,t,r,a=!1){var o;let n=(o=this.shadowRoot)==null?void 0:o.querySelector(".measure-layer");if(!n||!e)return(e==null?void 0:e.scrollWidth)||0;let s=e.cloneNode(!1);s.style.width="auto",s.style.minWidth="0",s.style.maxWidth="none",s.style.flex="0 0 auto",s.style.overflow="visible",s.style.textOverflow="clip",s.style.whiteSpace="nowrap",s.innerHTML=this._formatInsideValueMarkup(t,r,a),s.removeAttribute("data-hide-value");let l=document.createElement("div");return l.className="bar-inner-label",l.style.cssText="position:static;display:block;padding:0",l.appendChild(s),n.replaceChildren(l),s.getBoundingClientRect().width}_measureTextWidthWithStyles(e,t){var n;let r=(n=this.shadowRoot)==null?void 0:n.querySelector(".measure-layer");if(!r||!e)return 0;let a=e.cloneNode(!1);return a.textContent=t,a.style.width="auto",a.style.minWidth="0",a.style.maxWidth="none",a.style.flex="0 0 auto",a.style.overflow="visible",a.style.textOverflow="clip",a.style.whiteSpace="nowrap",r.replaceChildren(a),a.scrollWidth}_measureVisibleLabelCharacters(e,t,r){if(!e||!t||!Number.isFinite(r)||r<=0)return 0;let a=this._measureTextWidthWithStyles(e,"..."),n=Math.max(0,r-a);if(n<=0)return 0;let s=0,l=t.length;for(;s<l;){let o=Math.ceil((s+l)/2);this._measureTextWidthWithStyles(e,t.slice(0,o))<=n?s=o:l=o-1}return s}_shouldHideLeftLabel(e,t,r,a){return!e||!Number.isFinite(t)||!Number.isFinite(r)?!1:t>r+1&&a<5}_getInsideUsefulNameWidth(e,t,r=NaN){if(!t)return 0;let a=Number.isFinite(r)&&r>0?r:this._measureTextWidthWithStyles(e,t),n=t.slice(0,Math.min(5,t.length)),s=this._measureTextWidthWithStyles(e,n)+this._measureTextWidthWithStyles(e,"..."),l=Math.max(36,Math.min(44,s||0));return Math.min(a||l,l)}_applyValueWidthReservation(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".value-right").forEach(e=>{var c,h,p,b,m;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||"");if(!t){e.style.setProperty("--sbcp-value-extra-width","0px");return}let a=typeof globalThis.getComputedStyle=="function"&&globalThis.getComputedStyle.bind(globalThis)||typeof window!="undefined"&&typeof window.getComputedStyle=="function"&&window.getComputedStyle.bind(window)||((p=(h=(c=e==null?void 0:e.ownerDocument)==null?void 0:c.defaultView)==null?void 0:h.getComputedStyle)==null?void 0:p.bind(e.ownerDocument.defaultView));if(!a)return;let n=a(e),s=parseFloat(n.getPropertyValue("--sbcp-value-width"))||e.clientWidth||0,l=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2),o=e.closest(".main-line"),u=l;if(o!=null&&o.classList.contains("off-mode")){let v=o.querySelector(".bar-wrap"),f=o.querySelector(".icon-wrap");o.dataset.hideOffIcon="false";let y=parseFloat(a(o).gap)||0,_=(m=(b=o.getBoundingClientRect)==null?void 0:b.call(o).width)!=null?m:0,x=parseFloat(a(v).minWidth)||0,g=f&&a(f).display!=="none",w=g?this._getLeftModeIconWidth(f,o):0,S=Math.max(0,_-x-y),k=S-(g?w+y:0),R=Math.ceil(this._measureValueMarkupWidth(e,t,r,!0)+2),M=g&&(l>k&&l<=S||R>k&&R<=S);o.dataset.hideOffIcon=M?"true":"false";let N=M?S:k;if(N>0){let $=l<=N?l:R;u=Math.min($,N)}}let d=Math.max(0,u-s);e.style.setProperty("--sbcp-value-extra-width",`${d}px`)})}_applyValueVisibility(){this.shadowRoot&&(this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach(e=>{var s,l,o,u;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),a=e.dataset.hideUnit==="true";if(!((s=e.classList)==null?void 0:s.contains("above-bar-label-value"))&&t){let d=(u=(o=(l=e.getBoundingClientRect)==null?void 0:l.call(e).width)!=null?o:e.clientWidth)!=null?u:0,c=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2);a=r&&d>0?c>d:!1,e.dataset.hideUnit=a?"true":"false"}e.innerHTML!==this._formatRightValueMarkup(t,r,a)&&(e.innerHTML=this._formatRightValueMarkup(t,r,a))}),this.shadowRoot.querySelectorAll(".inside-value").forEach(e=>{let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),a=e.dataset.hideUnit==="true";if(!(e.dataset.hideValue==="true")&&!t)return;e.dataset.hideUnit||(e.dataset.hideUnit="false"),e.dataset.hideValue||(e.dataset.hideValue="false");let s=this._formatInsideValueMarkup(t,r,a);e.innerHTML!==s&&(e.innerHTML=s)}))}_getMinimumBarShare(){return .5}_getMinimumBarShareHysteresis(){return .02}_getTopValueEnableShare(){return this._getMinimumBarShare()-this._getMinimumBarShareHysteresis()}_getTopValueDisableShare(){return this._getMinimumBarShare()+this._getMinimumBarShareHysteresis()}_getNumericStyleValue(e,t,r=0){if(!e)return r;try{let a=parseFloat(getComputedStyle(e).getPropertyValue(t));return Number.isFinite(a)?a:r}catch(a){return r}}_getLeftModeGap(e){var a;let t=this._getNumericStyleValue(e,"gap",NaN);if(Number.isFinite(t))return t;let r=((a=e==null?void 0:e.dataset)==null?void 0:a.rowDensity)||"normal";return r==="tight"?7:r==="dense"||r==="compressed"?6:8}_getLeftModeBarMinWidth(e){var a;let t=this._getNumericStyleValue(e,"--sbcp-bar-min-width",NaN);if(Number.isFinite(t))return t;let r=((a=e==null?void 0:e.dataset)==null?void 0:a.leftDensity)||"normal";return r==="compact"?52:r==="tight"?48:r==="dense"?44:r==="compressed"?40:56}_getLeftModeIconWidth(e,t){var s,l;let r=(s=e==null?void 0:e.getBoundingClientRect)==null?void 0:s.call(e).width;if(this._isReliableWidth(r,1))return r;let a=this._getNumericStyleValue(e||t,"--sbcp-icon-width",NaN);if(Number.isFinite(a))return a;let n=((l=t==null?void 0:t.dataset)==null?void 0:l.leftDensity)||"normal";return n==="compact"?26:n==="tight"?24:n==="dense"?23:n==="compressed"?22:28}_getReservedInlineValueWidth(e){var u,d,c;if(!e)return 0;let t=this._decodeDataAttr(e.dataset.display||""),r=this._decodeDataAttr(e.dataset.unit||""),a=this._getNumericStyleValue(e,"--sbcp-value-width",e.clientWidth||0),n=parseFloat(((d=(u=e.style)==null?void 0:u.getPropertyValue)==null?void 0:d.call(u,"--sbcp-value-extra-width"))||((c=e.style)==null?void 0:c["--sbcp-value-extra-width"])||"0"),s=Number.isFinite(n)?n:this._getNumericStyleValue(e,"--sbcp-value-extra-width",0),l=Math.max(0,a+s);if(!t)return l;let o=Math.ceil(this._measureValueMarkupWidth(e,t,r,!1)+2);return Math.max(l,o)}_getStableLeftLabelMetrics(e,t=null){var b,m,v,f,y,_,x,g,w,S;let r=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".label-left-text");if(!r||!a||!n)return null;let s=(m=t!=null?t:(b=r.getBoundingClientRect)==null?void 0:b.call(r).width)!=null?m:0,l=(n.textContent||"").trim(),o=this._measureTextWidthWithStyles(n,l)||n.scrollWidth||0,u=((v=r.dataset)==null?void 0:v.leftDensity)||"normal",d={normal:.25,compact:.22,tight:.19,dense:.16,compressed:.14},c=(y=(f=this._config)==null?void 0:f.entities)==null?void 0:y.find(k=>{var R;return k.entity===((R=e.dataset)==null?void 0:R.entity)}),h=c&&(w=(g=(x=(_=this._resolve(c))==null?void 0:_.layout)==null?void 0:x.label)==null?void 0:g.width)!=null?w:100,p=s>0?Math.min(h,s*((S=d[u])!=null?S:d.normal)):Math.min(o,h);return{text:l,naturalWidth:o,maximumWidth:p,labelWidth:p,labelText:n}}_estimateLeftModeWidthBudget(e){var g,w,S;let t=e==null?void 0:e.querySelector(".main-line");if(!t)return null;let r=(w=(g=t.getBoundingClientRect)==null?void 0:g.call(t).width)!=null?w:0;if(!this._isReliableWidth(r))return null;let a=e.querySelector(".label-left"),n=e.querySelector(".icon-wrap"),s=e.querySelector(".value-right"),l=this._getStableLeftLabelMetrics(e,r),o=(S=l==null?void 0:l.labelWidth)!=null?S:0,u=n?this._getLeftModeIconWidth(n,t):0,d=this._getReservedInlineValueWidth(s),c=this._getLeftModeGap(t),h=this._getLeftModeBarMinWidth(t),p=!!a,b=!!n,m=b?2:1,v=Math.max(0,r-(b?u:0)-h-m*c),f=Math.min(o,v),y=!l||this._shouldHideLeftLabel(l.text,l.naturalWidth,f,this._measureVisibleLabelCharacters(l.labelText,l.text,f)),_=Math.min(o,Math.max(0,r-h-c)),x=!l||this._shouldHideLeftLabel(l.text,l.naturalWidth,_,this._measureVisibleLabelCharacters(l.labelText,l.text,_));return{rowWidth:r,gap:c,barMinWidth:h,labelSacrificialWithoutIcon:x,labelWidth:this._isReliableWidth(o,0)?o:0,iconWidth:this._isReliableWidth(u,0)?u:0,valueWidth:this._isReliableWidth(d,0)?d:0,baseLabelVisible:p,labelSacrificial:y,hasIcon:b,mainLine:t,iconWrap:n,valueEl:s,rowStack:e.querySelector(".row-stack")}}_predictLeftModeBarShareForState(e,t,r=null){let a=r||this._estimateLeftModeWidthBudget(e);if(!a)return null;let n=a.baseLabelVisible&&!t.hideLabel,s=a.hasIcon&&!t.hideIcon,l=!t.topValue,o=1+(s?1:0)+(n?1:0)+(l?1:0),u=Math.max(0,o-1),d=(s?a.iconWidth:0)+(n?a.labelWidth:0)+(l?a.valueWidth:0)+u*a.gap,c=Math.max(0,a.rowWidth-d),h=c>=a.barMinWidth,p=h?c:a.barMinWidth;return{rowWidth:a.rowWidth,barWidth:p,share:p/a.rowWidth,showLabel:n,showIcon:s,showInlineValue:l,reservedWidth:d,gapCount:u,fits:h}}_getLeftModeCandidateStates(e){let t=[];return e&&!e.labelSacrificial&&t.push({hideLabel:!1,topValue:!1,hideIcon:!1},{hideLabel:!1,topValue:!0,hideIcon:!1}),e&&!e.labelSacrificialWithoutIcon&&t.push({hideLabel:!1,topValue:!1,hideIcon:!0},{hideLabel:!1,topValue:!0,hideIcon:!0}),t.push({hideLabel:!0,topValue:!1,hideIcon:!1},{hideLabel:!0,topValue:!1,hideIcon:!0},{hideLabel:!0,topValue:!0,hideIcon:!0}),t}_chooseFallbackPredictedLeftModeState(e,t,r){let a=null;for(let n of t){let s=this._predictLeftModeBarShareForState(e,n,r);s&&(a={...n,predicted:s})}return a}_chooseLeftModeResponsiveState(e,t=!0){var c,h,p,b;let r=this._estimateLeftModeWidthBudget(e);if(!r)return null;let a=this._getMinimumBarShare(),n=this._getLeftModeCandidateStates(r),s=(h=this._config.entities)==null?void 0:h[Number((c=e==null?void 0:e.dataset)==null?void 0:c.rowIndex)],l=s&&this._leftModeResponsiveHistory.has(s)?this._leftModeResponsiveHistory.get(s):((b=(p=r.rowStack)==null?void 0:p.dataset)==null?void 0:b.forceTopValue)==="true",o=n.filter(m=>m.topValue),u=this._getTopValueEnableShare(),d=this._getTopValueDisableShare();for(let m of n){let v=m.topValue||t?a:l?d:u,f=this._predictLeftModeBarShareForState(e,m,r);if(f!=null&&f.fits&&f.share>=v)return{...m,predicted:f}}return this._chooseFallbackPredictedLeftModeState(e,o,r)}_applyLeftModeResponsiveState(e,t){var l,o;let r=e==null?void 0:e.querySelector(".main-line"),a=e==null?void 0:e.querySelector(".row-stack"),n=e==null?void 0:e.querySelector(".label-left");if(!r||!a)return;let s=(o=this._config.entities)==null?void 0:o[Number((l=e==null?void 0:e.dataset)==null?void 0:l.rowIndex)];s&&this._leftModeResponsiveHistory.set(s,(t==null?void 0:t.topValue)===!0),delete a.dataset.forceTopValue,delete r.dataset.hideLeftIcon,n&&delete n.dataset.priorityHidden,t!=null&&t.hideLabel&&n&&(n.dataset.priorityHidden="true"),t!=null&&t.topValue&&(a.dataset.forceTopValue="true"),t!=null&&t.hideIcon&&(r.dataset.hideLeftIcon="true")}_getMeasuredBarShare(e){let t=e==null?void 0:e.querySelector(".main-line"),r=e==null?void 0:e.querySelector(".bar-track");if(!t||!r)return null;let a=t.getBoundingClientRect().width,n=r.getBoundingClientRect().width;return!this._isReliableWidth(a)||!this._isReliableWidth(n,1)?null:{rowWidth:a,barWidth:n,share:n/a,mainLine:t,track:r}}_clearMinimumBarShareOverrides(e){let t=e==null?void 0:e.querySelector(".main-line"),r=e==null?void 0:e.querySelector(".row-stack"),a=e==null?void 0:e.querySelector(".label-left"),n=e==null?void 0:e.querySelector(".above-bar-label"),s=e==null?void 0:e.querySelector(".bar-inner-label"),l=e==null?void 0:e.querySelector(".above-line");r&&delete r.dataset.forceTopValue,a&&delete a.dataset.priorityHidden,n&&delete n.dataset.priorityHideName,s&&delete s.dataset.priorityHideName,t&&(delete t.dataset.hideLeftIcon,delete t.dataset.hideAboveIcon,delete t.dataset.priorityHideInsideIcon)}_hideMinimumBarShareLabel(e,t){if(t==="left"){let r=e.querySelector(".label-left");r&&(r.dataset.priorityHidden="true");return}if(t==="above"){let r=e.querySelector(".above-bar-label");r&&(r.dataset.priorityHideName="true");return}if(t==="inside"){let r=e.querySelector(".bar-inner-label");r&&(r.dataset.priorityHideName="true")}}_forceMinimumBarShareTopValue(e,t){if(t!=="left")return;let r=e.querySelector(".row-stack");r&&(r.dataset.forceTopValue="true")}_hideMinimumBarShareIcon(e,t){let r=e.querySelector(".main-line");if(r){if(t==="left"){r.dataset.hideLeftIcon="true";return}if(t==="above"){r.dataset.hideAboveIcon="true";let a=e.querySelector(".above-line");a&&(a.dataset.hideAboveIcon="true");return}t==="inside"&&(r.dataset.priorityHideInsideIcon="true")}}_getLabelSacrificeMetrics(e,t,r){var n,s,l,o,u,d,c,h,p,b;let a=(o=(l=r==null?void 0:r.rowWidth)!=null?l:(s=(n=e==null?void 0:e.querySelector(".main-line"))==null?void 0:n.getBoundingClientRect)==null?void 0:s.call(n).width)!=null?o:0;if(!this._isReliableWidth(a))return null;if(t==="left"){let m=e.querySelector(".label-left"),v=e.querySelector(".label-left-text");if(!m||!v)return null;let f=(v.textContent||"").trim(),y=v.clientWidth,_=v.scrollWidth,x=this._measureVisibleLabelCharacters(v,f,y),g=(d=(u=m.getBoundingClientRect)==null?void 0:u.call(m).width)!=null?d:y;return{text:f,visibleWidth:y,fullWidth:_,visibleChars:x,labelWidth:g,rowWidth:a}}if(t==="above"){let m=e.querySelector(".above-bar-label-name");if(!m)return null;let v=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,_=this._measureVisibleLabelCharacters(m,v,f),x=(h=(c=m.getBoundingClientRect)==null?void 0:c.call(m).width)!=null?h:f;return{text:v,visibleWidth:f,fullWidth:y,visibleChars:_,labelWidth:x,rowWidth:a}}if(t==="inside"){let m=e.querySelector(".inside-name");if(!m)return null;let v=(m.textContent||"").trim(),f=m.clientWidth,y=m.scrollWidth,_=this._measureVisibleLabelCharacters(m,v,f),x=(b=(p=m.getBoundingClientRect)==null?void 0:p.call(m).width)!=null?b:f;return{text:v,visibleWidth:f,fullWidth:y,visibleChars:_,labelWidth:x,rowWidth:a}}return null}_isLabelWorthSacrificing(e,t,r){let a=this._getLabelSacrificeMetrics(e,t,r);return!a||!a.text?!1:this._shouldHideLeftLabel(a.text,a.fullWidth,a.visibleWidth,a.visibleChars)}_ensureMinimumBarShare(e=null,t=null){if(!this.shadowRoot)return;let r=e||this.shadowRoot.querySelectorAll(".row[data-entity]"),a=this._getMinimumBarShare();r.forEach(n=>{let s=n.querySelector(".main-line");if(!s)return;let l=s.classList.contains("left-mode")?"left":s.classList.contains("above-mode")?"above":s.classList.contains("inside-mode")?"inside":"other";if(l==="other")return;if(l==="left"){let u=!t||t.get(s)===s.getBoundingClientRect().width,d=this._chooseLeftModeResponsiveState(n,u);d&&this._applyLeftModeResponsiveState(n,d),u||this._schedulePostLayoutDensityPass();return}this._clearMinimumBarShareOverrides(n);let o=this._getMeasuredBarShare(n);!o||o.share>=a||this._isLabelWorthSacrificing(n,l,o)&&(this._hideMinimumBarShareLabel(n,l),o=this._getMeasuredBarShare(n),!o||o.share>=a)||(this._forceMinimumBarShareTopValue(n,l),this._applyTopRightValueLayout(),o=this._getMeasuredBarShare(n),!(!o||o.share>=a)&&this._hideMinimumBarShareIcon(n,l))})}_shouldUseTopValueRow(e){var t,r,a;return(t=e==null?void 0:e.classList)!=null&&t.contains("left-mode")?((a=(r=e.closest)==null?void 0:r.call(e,".row-stack"))==null?void 0:a.dataset.forceTopValue)==="true":!1}_getAdaptiveDensityForMainLine(e){var t;return e?(t=e.classList)!=null&&t.contains("left-mode")?e.dataset.leftDensity||"normal":e.dataset.rowDensity||"normal":"normal"}_getAdaptiveDefaultHeightForDensity(e){return e==="compressed"?24:e==="dense"?28:38}_getEffectiveRowHeight(e,t,r){return t?this._clampSupportedRowHeight(e):this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(r)))}_applyAdaptiveRowHeight(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".row[data-entity]").forEach(e=>{let t=e.querySelector(".main-line"),r=e.querySelector(".row-stack");if(!t)return;let a=parseFloat(e.dataset.baseHeight||"38")||38,n=e.dataset.heightExplicit==="true",s=this._getEffectiveRowHeight(a,n,t);e.style.setProperty("--sbcp-row-height",`${s}px`),r&&r.style.setProperty("--sbcp-row-height",`${s}px`),t.style.height=`${s}px`;let l=t.querySelector(".label-left");l&&(l.style.height=`${s}px`);let o=t.querySelector(".icon-wrap");o&&(o.style.height=`${s}px`,o.style.minHeight=`${s}px`);let u=t.querySelector(".bar-track");u&&(u.style.height=`${s}px`);let d=t.querySelector(".value-right");d&&(d.style.height=`${s}px`)})}_applyTopRightValueLayout(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var c,h,p,b,m;let t=e.closest(".row-stack"),r=e.querySelector(".value-right"),a=t==null?void 0:t.querySelector(".top-right-value");if(!t||!r||!a)return;let n=this._shouldUseTopValueRow(e);t.dataset.topValue=n?"true":"false",a.dataset.active=n?"true":"false";let s=this._decodeDataAttr(r.dataset.display||""),l=this._decodeDataAttr(r.dataset.unit||"");a.dataset.display=r.dataset.display||"",a.dataset.unit=r.dataset.unit||"",a.dataset.hideUnit="false";let o=(m=(b=(p=(c=t.getBoundingClientRect)==null?void 0:c.call(t).width)!=null?p:(h=a.getBoundingClientRect)==null?void 0:h.call(a).width)!=null?b:a.clientWidth)!=null?m:0,u=s?Math.ceil(this._measureValueMarkupWidth(a,s,l,!1)+2):0,d=!!l&&o>0&&u>o;a.dataset.hideUnit=d?"true":"false",a.innerHTML=this._formatRightValueMarkup(s,l,d)})}_applyLeftLabelUsefulness(){this.shadowRoot&&this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach(e=>{var l;let t=e.querySelector(".label-left"),r=e.querySelector(".label-left-text");if(!t||!r)return;let a=((l=e.closest)==null?void 0:l.call(e,".row"))||{dataset:{},querySelector:o=>o===".main-line"?e:o===".label-left"?t:o===".label-left-text"?r:null},n=this._getStableLeftLabelMetrics(a);if(!n)return;let s=this._measureVisibleLabelCharacters(n.labelText,n.text,n.labelWidth);t.dataset.hidden=this._shouldHideLeftLabel(n.text,n.naturalWidth,n.labelWidth,s)?"true":"false"})}_runPostLayoutPasses(e=null){let t=this._rowGeneration;requestAnimationFrame(()=>{var a;if(!this.isConnected||t!==this._rowGeneration)return;this._applyRowDensity(),this._applyLeftModeDensity(),this._applyAboveLabelDensity(),this._applyHeroValueFit(),this._applyInsideLabelDensity(),this._applyValueWidthReservation();let r=new Map([...((a=this.shadowRoot)==null?void 0:a.querySelectorAll(".main-line.left-mode"))||[]].map(n=>[n,n.getBoundingClientRect().width]));requestAnimationFrame(()=>{var s;if(!this.isConnected||t!==this._rowGeneration)return;this._applyAdaptiveRowHeight(),this._applyValueVisibility(),this._applyLeftLabelUsefulness(),this._applyTopRightValueLayout(),this._ensureMinimumBarShare(e,r),this._applyTopRightValueLayout(),this._applyLeftLabelUsefulness(),(e||((s=this.shadowRoot)==null?void 0:s.querySelectorAll(".row[data-entity]"))||[]).forEach(l=>{this._positionTargetLabel(l),this._positionMarkerValueLabel(l,".peak-value-label",".peak-marker"),this._positionMarkerValueLabel(l,".floor-value-label",".floor-marker"),this._positionGenericMarkerLabels(l)})})})}_isTightUnit(e){return ai(e)}_encodeDataAttr(e){return encodeURIComponent(String(e!=null?e:""))}_decodeDataAttr(e){let t=String(e!=null?e:"");try{return decodeURIComponent(t)}catch(r){return t}}_parseColorToRgb(e){return Fr(e)}_rgbToHsl({r:e,g:t,b:r}){return Oi({r:e,g:t,b:r})}_getMarkerContrastColor(e){return At(e)}_getEffectiveMarkerColor(e){return xe(e)}_getMarkerLabelColorStyle(e){let t=this._getEffectiveMarkerColor(e);return`--marker-color:${t};--marker-contrast-color:${this._getMarkerContrastColor(t)};`}_getNeedleBorderColor(e){return Ie(e)}_formatDisplayWithUnit(e,t){return ni(e,t)}_formatRightValueMarkup(e,t,r=!1){let a=te(e);if(!t||r)return`<span class="value-right-text"><span class="value-right-number">${a}</span></span>`;let n=String(t),s=te(n);return`<span class="${this._isTightUnit(n)?"value-right-text tight-unit":"value-right-text has-unit"}"><span class="value-right-number">${a}</span><span class="unit-group"><span class="unit">${s}</span></span></span>`}_formatAboveValueMarkup(e,t,r=!1){return`<span class="above-bar-label-value" data-display="${this._encodeDataAttr(e)}" data-unit="${this._encodeDataAttr(t)}" data-hide-unit="${r?"true":"false"}">${this._formatRightValueMarkup(e,t,r)}</span>`}_formatInsideValueMarkup(e,t,r=!1){let a=te(e);if(!t||r)return`<span class="inside-value-text"><span class="inside-number">${a}</span></span>`;let n=String(t),s=te(n);return`<span class="inside-value-text ${this._isTightUnit(n)?"tight-unit":"has-unit"}"><span class="inside-number">${a}</span><span class="inside-unit">${s}</span></span>`}_getRowMarkerModels(e,t,r,a,n,s,l,o){if(e!=null&&e.markers)return e.markers.map(h=>{var p,b;return h.type==="target"?{...h,position:h.position,visible:n!=null,color:o||h.color,label:(p=h.label)!=null?p:s===null?null:{text:s}}:h.type==="floor"||h.type!=="peak"?h:{...h,position:h.position,visible:r!=null&&t.peak_marker.show===!0,color:l||h.color,label:(b=h.label)!=null?b:a===null?null:{text:a}}});let u=pr({entityConfig:t,targetPosition:n,targetPresentation:s===null?null:{text:s},targetVisible:Number.isFinite(n),peakPosition:r,peakPresentation:a===null?null:{number:a},peakVisible:Number.isFinite(r)}),d=this._getMarkerModel(u,"target"),c=this._getMarkerModel(u,"peak");return d&&o&&(d.color=o),c&&l&&(c.color=l),u}_getMarkerModel(e,t){var r;return(r=e.find(a=>a.id===t||a.type===t))!=null?r:null}_renderMarker(e){return Pe(e)}_patchMarker(e,t){return e&&t&&!t.visible&&this._clearMarkerHover(e),ze(e,t)}_patchMarkerLabelAppearance(e,t){if(!e||!t)return;let r=this._getEffectiveMarkerColor(t);this._setStyleIfChanged(e,"--marker-color",r),this._setStyleIfChanged(e,"--marker-contrast-color",this._getMarkerContrastColor(r))}_buildRowViewModel(e,t,r){let a=St({hass:this._hass,cardConfig:this._config,entityConfig:t,entityState:r,historicalExtrema:Nt(this._historicalRuntime,t),previousScale:this._rowScales.get(e)});return this._rowScales.set(e,{min:a.min,max:a.max}),a}_buildRow(e,t,r,a,n,s,l,o,u,d,c,h,p,b=(v=>(v=(m=>(m=this._config.entities)==null?void 0:m.indexOf(e))())!=null?v:-1)()){var We,qe,De,Ve,Le,Oe,Be,Ee,He,je,Ue,Ke,Ge,Je,Ye,Ze,Xe,Qe,Ce,et,tt,rt,it,at,nt,st;let f=this._resolve(e),y=(De=(qe=(We=this._hass)==null?void 0:We.states)==null?void 0:qe[e.entity])!=null?De:null,_=y?this._buildRowViewModel(e,f,y):null,x=f.layout,g=f.bar,w=Number.isFinite(h)?h:0,S=Number.isFinite(p)?p:100,k=(Ve=_==null?void 0:_.baselinePercent)!=null?Ve:this._resolveBaselinePct(f,w,S),R=x.label.position,M=(Oe=(Le=_==null?void 0:_.attributes)==null?void 0:Le.baseHeight)!=null?Oe:x.height,N=(je=(He=(Be=_==null?void 0:_.name)!=null?Be:f.name)!=null?He:(Ee=y==null?void 0:y.attributes)==null?void 0:Ee.friendly_name)!=null?je:e.entity,$=te((Ue=_==null?void 0:_.entityId)!=null?Ue:e.entity),F=te(N),I=this._getRowMarkerModels(_,f,s,l,o,u,d,c),P=this._getMarkerModel(I,"target"),L=this._getMarkerModel(I,"peak"),W=this._getMarkerModel(I,"floor"),O=I.filter(ee=>ee.type==="generic"),q=(Ke=_==null?void 0:_.markerLaneOccupancy)!=null?Ke:cr(f),D=(Ge=_==null?void 0:_.markerLabelLaneOccupancy)!=null?Ge:hr(f),T=(Je=_==null?void 0:_.numericValue)!=null?Je:this._getFiniteNumber(t),j=(Ye=_==null?void 0:_.needle)!=null?Ye:this._getNeedleRenderState(T,f,w,S,k),Y=Tt({percent:a,min:w,max:S,targetPercent:o,baselinePercent:k,needle:j,markers:I},f,{height:"var(--sbcp-row-height)",color:n}),V=P!=null&&P.labelVisible?`
      <div class="target-value-label" style="left:${Number.isFinite(P.position)?P.position:0}%;visibility:${P.visible&&((Ze=P.label)!=null&&Ze.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(P)}">
        ${(Xe=P.label)!=null&&Xe.text?te(P.label.text):""}
      </div>`:"",E=L!=null&&L.labelVisible?`
      <div class="peak-value-label" style="left:${Number.isFinite(L.position)?L.position:0}%;visibility:${L.visible&&((Qe=L.label)!=null&&Qe.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(L)}">
        ${L.visible&&((Ce=L.label)!=null&&Ce.text)?te(L.label.text):""}
      </div>`:"",z=W!=null&&W.labelVisible?`
      <div class="floor-value-label" style="left:${Number.isFinite(W.position)?W.position:0}%;visibility:${W.visible&&((et=W.label)!=null&&et.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(W)}">
        ${W.visible&&((tt=W.label)!=null&&tt.text)?te(W.label.text):""}
      </div>`:"",U=O.filter(ee=>ee.labelVisible).map(ee=>{var lt,ot;return`
      <div class="generic-value-label" data-marker-id="${te(ee.id)}" data-lane="${ee.lane}" data-show-marker="${ee.showMarker===!1?"false":"true"}" style="left:${Number.isFinite(ee.position)?ee.position:0}%;visibility:${ee.visible&&((lt=ee.label)!=null&&lt.text)?"visible":"hidden"};${this._getMarkerLabelColorStyle(ee)}">
        ${ee.visible&&((ot=ee.label)!=null&&ot.text)?te(ee.label.text):""}
      </div>`}).join(""),X=R==="above"?`
      <div class="above-line">
        ${f.icon&&f.icon!==!1?'<div class="above-icon-spacer"></div>':""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${F}</span>
          ${this._formatAboveValueMarkup(t,r,!1)}
        </div>
      </div>`:"",Z=(rt=x.hero.size)!=null?rt:"small",Q=x.hero.value_size,ie=R==="hero"?`
      <div class="hero-line" data-hero-size="${Z}"${Number.isFinite(Q)?` style="--sbcp-hero-base-size:${Q}px"`:""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${F}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}">${this._formatRightValueMarkup(t,r,!1)}</span>
        </div>
      </div>`:"",C=R==="inside"?`
      <div class="bar-inner-label">
        <span class="inside-name">${F}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(t,r,!1)}</span>
      </div>`:"",se=R==="left"?`<div class="label-left" style="flex:0 1 min(${x.label.width}px, var(--sbcp-left-label-share));max-width:min(${x.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${F}</span></div>`:"",ue=R!=="inside"&&R!=="above"&&R!=="hero"?`<div class="value-right" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false">${this._formatRightValueMarkup(t,r,!1)}</div>`:"",oe=R==="left"?`<div class="top-right-value" data-display="${this._encodeDataAttr(t)}" data-unit="${this._encodeDataAttr(r)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(t,r,!1)}</div>`:"",ye=f.icon&&f.icon!==!1?te(f.icon):"",Wt=ye&&R!=="hero"?`<div class="icon-wrap"><ha-icon icon="${ye}"></ha-icon></div>`:"";return`
      <div class="row" data-row-index="${b}" data-entity="${$}" data-base-height="${M}" data-height-explicit="${((at=(it=_==null?void 0:_.attributes)==null?void 0:it.heightExplicit)!=null?at:x.height_explicit)?"true":"false"}" data-bar-animated="${((st=(nt=_==null?void 0:_.attributes)==null?void 0:nt.barAnimated)!=null?st:g.animated)?"true":"false"}" data-marker-label-lane-above="${D.above?"true":"false"}" data-marker-label-lane-below="${D.below?"true":"false"}">
        <div class="row-stack" style="--sbcp-row-height:${M}px;">
          ${X}
          ${ie}
          ${oe}
          <div class="main-line ${R}-mode" data-marker-lane-above="${q.above?"true":"false"}" data-marker-lane-below="${q.below?"true":"false"}" style="height:${M}px;">
            ${Wt}
            ${se}
            <div class="bar-wrap">
              ${Tr(Y,{insideContent:C})}
              ${E}
              ${V}
              ${z}
              ${U}
            </div>
            ${ue}
          </div>
        </div>
      </div>`}_patchRow(e,t,r,a=null){var P,L,W,O,q,D,T,j,Y;if(!e||!r)return;let n=this._resolve(t),s=this._rowScales.get(t),l=this._buildRowViewModel(t,n,r),o=l.min,u=l.max,d=l.percent,c=this._getColor(d,n,o,u),h=l.primaryPresentation.number,p=l.primaryPresentation.unit,b=l.baselinePercent,m=Tt(l,n,{height:"var(--sbcp-row-height)",color:c}),v=(L=(P=a==null?void 0:a.states)==null?void 0:P[t.entity])!=null?L:null,f=v?St({hass:a,cardConfig:this._config,entityConfig:n,entityState:v,historicalExtrema:Nt(this._historicalRuntime,n),previousScale:s}):null,y=this._getRevealTransitionDuration(f&&Number.isFinite(f.numericValue)?{valuePercent:f.percent,baselinePercent:f.baselinePercent}:null,Number.isFinite(l.numericValue)?{valuePercent:d,baselinePercent:b}:null),_=(W=this._markerHover)==null?void 0:W.marker;if(_&&e.contains(_)){let V=m.markers.find(E=>E.type==="generic"?_.dataset.markerId===E.id:_.matches(`.${E.type}-marker`));V&&!V.visible&&this._clearMarkerHover(_)}Ar(e,m,{revealDuration:y}),this._setDatasetIfChanged(e,"baseHeight",l.attributes.baseHeight),this._setDatasetIfChanged(e,"heightExplicit",l.attributes.heightExplicit?"true":"false"),this._setDatasetIfChanged(e,"barAnimated",l.attributes.barAnimated?"true":"false");let x=e.querySelector(".value-right");x&&(x.dataset.display=this._encodeDataAttr(h),x.dataset.unit=this._encodeDataAttr(p),x.dataset.hideUnit="false",x.innerHTML=this._formatRightValueMarkup(h,p,!1));let g=e.querySelector(".top-right-value");g&&(g.dataset.display=this._encodeDataAttr(h),g.dataset.unit=this._encodeDataAttr(p),g.dataset.hideUnit="false",g.innerHTML=this._formatRightValueMarkup(h,p,!1));let w=e.querySelector(".bar-inner-label");if(w){let V=w.querySelector(".inside-value");V&&(V.dataset.display=this._encodeDataAttr(h),V.dataset.unit=this._encodeDataAttr(p),V.dataset.hideUnit="false",V.dataset.hideValue="false",V.innerHTML=this._formatInsideValueMarkup(h,p,!1))}let S=e.querySelector(".hero-header");if(S){let V=e.querySelector(".hero-line");this._setStyleIfChanged(V,"--sbcp-hero-base-size",Number.isFinite(n.layout.hero.value_size)?`${n.layout.hero.value_size}px`:null),S.innerHTML=`<span class="hero-label label-left-text">${te(l.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(h)}" data-unit="${this._encodeDataAttr(p)}">${this._formatRightValueMarkup(h,p,!1)}</span>`}let k=S?null:e.querySelector(".above-bar-label");k&&(k.innerHTML=`<span class="above-bar-label-name label-left-text">${te(l.name)}</span>${this._formatAboveValueMarkup(h,p,!1)}`);let R=e.querySelector(".target-value-label"),M=e.querySelector(".peak-value-label"),N=e.querySelector(".floor-value-label"),$=(O=l.markers)!=null?O:[];((D=(q=e.querySelectorAll)==null?void 0:q.call(e,".generic-marker[data-marker-id]"))!=null?D:[]).forEach(V=>{var X,Z,Q,ie,C;let E=V.dataset.markerId,z=this._getMarkerModel($,E),U=[...(Z=(X=e.querySelectorAll)==null?void 0:X.call(e,".generic-value-label[data-marker-id]"))!=null?Z:[]].find(se=>se.dataset.markerId===E);U&&(this._setDatasetIfChanged(U,"showMarker",(z==null?void 0:z.showMarker)===!1?"false":"true"),this._patchMarkerLabelAppearance(U,z),z!=null&&z.labelVisible&&z.visible&&((Q=z.label)!=null&&Q.text)?(this._setTextIfChanged(U,(C=(ie=z.label)==null?void 0:ie.text)!=null?C:null),this._setStyleIfChanged(U,"visibility","visible"),this._setStyleIfChanged(U,"left",`${Number.isFinite(z.position)?z.position:0}%`)):this._setStyleIfChanged(U,"visibility","hidden"))});let F=this._getMarkerModel($,"target");this._patchMarkerLabelAppearance(R,F),R&&(F!=null&&F.labelVisible&&F.visible&&((T=F.label)!=null&&T.text)?this._setTextIfChanged(R,(Y=(j=F.label)==null?void 0:j.text)!=null?Y:null):this._setStyleIfChanged(R,"visibility","hidden"));let I=(V,E)=>{var U,X,Z;if(!V)return;let z=this._getMarkerModel($,E);this._patchMarkerLabelAppearance(V,z),z!=null&&z.labelVisible&&z.visible&&((U=z.label)!=null&&U.text)?(this._setTextIfChanged(V,(Z=(X=z.label)==null?void 0:X.text)!=null?Z:null),this._setStyleIfChanged(V,"visibility","visible"),this._setStyleIfChanged(V,"left",`${Number.isFinite(z.position)?z.position:0}%`)):this._setStyleIfChanged(V,"visibility","hidden")};I(M,"peak"),I(N,"floor")}_update(e=null){var l,o,u,d;if(!this._hass||!this._config)return;let t=this.shadowRoot.querySelector(".rows");if(!t)return;let r=this._config.entities,a=r.map(c=>!!this._hass.states[c.entity]),n=a.some((c,h)=>c!==this._rowPresence[h]);if(!this._rendered||n){this._rowGeneration+=1,this._rowPresence=a;let c="";for(let p=0;p<r.length;p++){let b=r[p],m=this._hass.states[b.entity];if(!m){c+=`<div class="row" data-row-index="${p}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${te(b.entity)}</span></div>`;continue}let v=this._resolve(b),f=this._buildRowViewModel(b,v,m),y=f.min,_=f.max,x=f.percent,g=this._getColor(x,v,y,_),w=f.primaryPresentation.number,S=f.primaryPresentation.unit,k=f.targetPercent,R=(o=(l=f.targetPresentation)==null?void 0:l.text)!=null?o:null,M=f.peakPercent,N=(d=(u=f.peakPresentation)==null?void 0:u.number)!=null?d:null;c+=this._buildRow(b,w,S,x,g,M,N,k,R,v.peak_marker.color,v.target_marker.color,y,_,p)}this._clearMarkerHover(),this._clearRowActionHandlers(),t.innerHTML=c,this._rendered=!0;let h=t.querySelectorAll(".row[data-entity]");h.forEach(p=>{let b=r[Number(p.dataset.rowIndex)],m=b?this._hass.states[b.entity]:null;b&&m&&this._patchRow(p,b,m)}),this._runPostLayoutPasses(h),this._attachRowActionHandlers(h);return}let s=t.querySelectorAll(".row[data-entity]");for(let c of s){let h=r[Number(c.dataset.rowIndex)];if(!h)continue;let p=this._hass.states[h.entity];p&&this._patchRow(c,h,p,e)}this._runPostLayoutPasses(s)}}});function Ei(i,e={}){let t=e.above?10:0,r=e.below?10:0,a=Math.max(0,i-t-r);return{above:t,below:r,railHeight:a,aboveY:0,belowY:i-9,compactGlyphs:t>0||r>0}}function gn(i,e,t){let r=[];for(let a of["above","below"]){let n=i.filter(s=>{var l,o;return s.lane===a&&s.visible&&s.labelVisible&&Number.isFinite(s.position)&&((o=(l=s.label)==null?void 0:l.text)==null?void 0:o.trim())}).map(s=>({marker:s,anchor:Math.max(0,Math.min(100,s.position))*e/100})).sort((s,l)=>s.anchor-l.anchor);n.forEach(({marker:s,anchor:l},o)=>{var v;let u=o?(n[o-1].anchor+l)/2+2:0,d=o+1<n.length?(l+n[o+1].anchor)/2-2:e,c=Math.max(0,d-u),h=s.label,p=h.text,b="full",m=t(p)+4;if(m>c&&(p=[h.showValue!==!1?h.number:"",h.showUnit!==!1?h.unit:""].filter(Boolean).join(" "),b="value",m=p?t(p)+4:1/0,!p&&!h.number&&!h.unit)){let f=Array.from((v=h.semanticText)!=null?v:"");for(;f.length>=3;){if(p=`${f.join("").trimEnd()}\u2026`,m=t(p)+4,m<=c){b="text";break}f.pop()}}!p||m>c||e<=0?r.push({id:s.id,lane:a,mode:"hidden",text:"",left:0,width:0}):r.push({id:s.id,lane:a,mode:b,text:p,left:Math.max(u,Math.min(l-m/2,d-m)),width:m})})}return r}var wn=H(()=>{});function xn(i,e){return ne(e==null?void 0:e.entity_id)||typeof(e==null?void 0:e.area_id)=="string"&&e.area_id.trim().length>0}var zt,kn=H(()=>{Vt();he();ar();ri();si();Ir();Bi();Lr();yi();gi();or();fr();wn();zt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._historicalRuntime=new Fe,this._scaleHistory=null,this._previousRow=null,this._labelNodes=new Map,this._onLabelResize=()=>this._scheduleLabelLayout(!0),this._updateComplete=Promise.resolve()}static getStubConfig(){return{type:"custom:sensor-bar-card-plus-feature"}}static async getConfigElement(){return Dt("sensor-bar-card-plus-feature-editor")}setConfig(e){if(!e||typeof e!="object"||Array.isArray(e))throw new Error("Invalid Sensor Bar Card Plus feature configuration");if(e.entities!==void 0)throw new Error("The feature displays one entity; use entity instead of entities");if(e.entity!=null&&e.entity!==""&&!ne(e.entity))throw new Error("Feature entity must be a valid entity id");let t=JSON.stringify(e);t!==this._configKey&&(this._configKey=t,this._config={...e,...typeof e.entity=="string"?{entity:e.entity.trim()}:{}},this._configChanged=!0,this._requestUpdate())}set hass(e){this._hass=e,this._historicalRuntime.setHass(e),this._requestUpdate()}get hass(){return this._hass}set context(e){var t,r;!((t=this._config)!=null&&t.entity)&&((r=this._context)==null?void 0:r.entity_id)!==(e==null?void 0:e.entity_id)&&this._historicalRuntime.setConsumers([]),this._context=e,this._requestUpdate()}get context(){return this._context}set color(e){this._color=e,this._requestUpdate()}get color(){return this._color}set position(e){this._position=e,this._requestUpdate()}get position(){return this._position}get updateComplete(){return this._updateComplete}connectedCallback(){this._historicalRuntime.attach(),this._requestUpdate()}disconnectedCallback(){this._historicalRuntime.detach(),this._stopLabelLayout()}_requestUpdate(){this._updateScheduled||(this._updateScheduled=!0,this._updateComplete=Promise.resolve().then(()=>{this._updateScheduled=!1,this._reconcile()}))}_reconcile(){var l,o,u,d,c,h,p,b,m;let e=((l=this._config)==null?void 0:l.entity)||((o=this._context)==null?void 0:o.entity_id)||null;(this._configChanged||e!==this._entity)&&(this._entity=e,this._configChanged=!1,this._scaleHistory=null,this._previousRow=null,this._structureKey=null,this._labelLayoutKey=null,this._normalized=this._config?ir({...this._config,type:"custom:sensor-bar-card-plus",entity:void 0,entities:e?[{entity:e,...this._config.attribute!==void 0?{attribute:this._config.attribute}:{}}]:[]}):null,this._diagnostics=sr(this._normalized),this._historicalRuntime.setConsumers(wr((d=(u=this._normalized)==null?void 0:u.entities)!=null?d:[]),()=>this._requestUpdate()));let r=yt(this._hass,e,(p=(h=(c=this._normalized)==null?void 0:c.entities)==null?void 0:h[0])==null?void 0:p.attribute).stateObj,a=null,n=this._config?e?this._hass?r?null:"Entity not found":"Waiting for Home Assistant":"Configure an entity":"Not configured",s=null;if(r&&((b=this._normalized)!=null&&b.entities[0])){let v=this._normalized.entities[0];if(a=St({hass:this._hass,entityConfig:v,entityState:r,historicalExtrema:Nt(this._historicalRuntime,v),previousScale:this._scaleHistory}),this._scaleHistory={min:a.min,max:a.max},a.numericValue===null){let f=String((m=a.state)!=null?m:"").trim(),y=/^[+-]?(?:nan|infinity)$/i.test(f);r.state==="unknown"?n="Unknown":r.state==="unavailable"?n="Unavailable":f&&!y?s=a.primaryPresentation.text:n="Not numeric"}}this._row=a,this._status=n,this._textValue=s,this._render(a,n),this._previousRow=n||s!==null?null:a}_ensureDom(){this._surface||(this.shadowRoot.innerHTML=`
      <style>
        ${Lt}
        ${Ot}
        ${Bt('.surface[data-bar-animated="false"]')}
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
      </div>`,this._surface=this.shadowRoot.querySelector("#surface"),this._bar=this.shadowRoot.querySelector("#bar"),this._labels=this.shadowRoot.querySelector("#labels"),this._statusEl=this.shadowRoot.querySelector("#status"))}_render(e,t){var c,h,p;this._ensureDom();let r=t?null:this._textValue;typeof this._color=="string"&&this._color?this.style.setProperty("--feature-color",this._color):this.style.removeProperty("--feature-color"),this._bar.hidden=!!(t||r!==null),this._statusEl.hidden=!t&&r===null,this._statusEl.textContent=(c=t!=null?t:r)!=null?c:"",this._surface.dataset.state=t?"unavailable":r!==null?"text":"numeric";let a=(h=e==null?void 0:e.markerLabelLaneOccupancy)!=null?h:{},n=Ei(0,a);J(this._surface,"--label-above",`${n.above}px`),J(this._surface,"--label-below",`${n.below}px`),this._syncLabels(e,t||r!==null);let s=(e==null?void 0:e.name)||this._entity||"Sensor Bar Card Plus",l=((p=e==null?void 0:e.markers)!=null?p:[]).filter(b=>b.visible&&(b.showMarker||b.labelVisible)).map(b=>{var f;let m=b.type==="generic"?"Reference marker":`${b.type[0].toUpperCase()}${b.type.slice(1)}`,v=`${fe(b.value)}${e.displayUnit?` ${e.displayUnit}`:""}`;return`${m} at ${v}${b.labelVisible&&((f=b.label)!=null&&f.text)?`; label ${b.label.text}`:""}${b.historyStatus==="partial"?"; partial history":b.historyStatus==="stale"?"; stale history":""}.`}).join(" ");if(this._surface.setAttribute("aria-label",t?`${s}${this._entity&&s!==this._entity?` (${this._entity})`:""}: ${t}${e?` (${e.state})`:""}`:r!==null?`${s}${this._entity&&s!==this._entity?` (${this._entity})`:""}: ${r}`:`${s} (${this._entity}): ${e.primaryPresentation.text}. Range ${fe(e.min)} to ${fe(e.max)}${e.displayUnit?` ${e.displayUnit}`:""}.${l?` ${l}`:""}`),t||r!==null)return;let o=Tt(e,this._normalized.entities[0],{height:"var(--sbcp-row-height)"});o.animated=o.animated&&!!this._previousRow,this._surface.dataset.barAnimated=o.animated?"true":"false";let u=JSON.stringify(o),d=JSON.stringify([o.baseline.configured,o.needle.configured,o.markers.map(b=>[b.type,b.id])]);d!==this._structureKey?(this._bar.innerHTML=Tr(o),this._structureKey=d):u!==this._barRenderKey&&Ar(this._bar,o,{revealDuration:Nr(this._previousRow?{valuePercent:this._previousRow.percent,baselinePercent:this._previousRow.baselinePercent}:null,{valuePercent:e.percent,baselinePercent:e.baselinePercent})}),this._barRenderKey=u,this._labelAnimated=o.animated,this._scheduleLabelLayout()}_syncLabels(e,t){var s,l,o;let r=((s=e==null?void 0:e.markers)!=null?s:[]).filter(u=>u.labelVisible),a=new Set(r.map(u=>u.id));for(let[u,d]of this._labelNodes)a.has(u)||(d.remove(),this._labelNodes.delete(u));for(let u of r){if(!this._labelNodes.has(u.id)){let c=document.createElement("span");c.className="compact-marker-label",c.dataset.markerId=u.id,c.hidden=!0,this._labels.append(c),this._labelNodes.set(u.id,c)}let d=this._labelNodes.get(u.id);d.dataset.lane=u.lane,J(d,"--marker-color",xe(u))}if(this._labels.hidden=!!t,!(((l=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:l.above)||((o=e==null?void 0:e.markerLabelLaneOccupancy)==null?void 0:o.below)))this._stopLabelLayout(),this._surface.dataset.compactGlyphs="false";else if(this.isConnected&&!this._labelObserver){this._labelObserver=new ResizeObserver(this._onLabelResize),this._labelObserver.observe(this._surface),this._labelFonts=document.fonts,this._labelFonts.addEventListener("loadingdone",this._onLabelResize);let u=this._labelFonts;u.ready.then(()=>{this._labelFonts===u&&this._scheduleLabelLayout(!0)})}}_stopLabelLayout(){var e,t;(e=this._labelObserver)==null||e.disconnect(),this._labelObserver=null,(t=this._labelFonts)==null||t.removeEventListener("loadingdone",this._onLabelResize),this._labelFonts=null,this._labelFrame&&cancelAnimationFrame(this._labelFrame),this._labelFrame=null,this._labelLayoutKey=null}_scheduleLabelLayout(e=!1){this._labelObserver&&(this._snapLabels=this._snapLabels||e,!this._labelFrame&&(this._labelFrame=requestAnimationFrame(()=>{this._labelFrame=null,this._layoutLabels()})))}_layoutLabels(){var l,o,u,d;let{width:e,height:t}=this._surface.getBoundingClientRect(),r=Ei(t,(l=this._row)==null?void 0:l.markerLabelLaneOccupancy);this._surface.dataset.compactGlyphs=String(r.compactGlyphs),(o=this._labelMeasure)!=null||(this._labelMeasure=document.createElement("canvas").getContext("2d")),this._labelMeasure.font=getComputedStyle(this._labels).font;let a=gn((d=(u=this._row)==null?void 0:u.markers)!=null?d:[],e,c=>this._labelMeasure.measureText(c).width),n=JSON.stringify([e,t,r.above,r.below,this._labelMeasure.font,a.map(c=>[c.id,c.lane,c.mode,c.width])]),s=this._labelAnimated&&!this._snapLabels&&n===this._labelLayoutKey;for(let c of this._labelNodes.values())c.hidden=!0;for(let c of a){let h=this._labelNodes.get(c.id);h.hidden=c.mode==="hidden",h.dataset.mode=c.mode,h.textContent!==c.text&&(h.textContent=c.text),J(h,"transition",s?"left 0.6s cubic-bezier(0.4,0,0.2,1)":"none"),J(h,"left",`${c.left}px`),J(h,"width",`${c.width}px`)}this._labelLayoutKey=n,this._snapLabels=!1}}});var Ps=$n(()=>{yn();kn();Vt();Ra(Pt,zt);for(let[i,e]of[["sensor-bar-card-plus",Pt],["sensor-bar-card-plus-feature",zt]])customElements.get(i)||customElements.define(i,e);window.customCards=window.customCards||[];window.customCards.some(i=>i.type==="sensor-bar-card-plus")||window.customCards.push({type:"sensor-bar-card-plus",name:"Sensor Bar Card Plus",description:"Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."});window.customCardFeatures=window.customCardFeatures||[];window.customCardFeatures.some(i=>i.type==="sensor-bar-card-plus-feature")||window.customCardFeatures.push({type:"sensor-bar-card-plus-feature",name:"Sensor Bar Card Plus",isSupported:xn,configurable:!0})});export default Ps();
