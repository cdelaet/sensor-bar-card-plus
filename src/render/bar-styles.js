// Separate chunks let the standalone card preserve its existing CSS rule order.
// Adapters supply --sbcp-row-height in their own DOM; layout and labels stay outside.
export const barTrackStyles = `
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
`;

export const barMarkerStyles = `
        /* ── Shared marker base ── */
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

`;

// The adapter owns the animation flag and chooses its enclosing selector.
export function getBarAnimationStyles(selector) {
  return `
        ${selector} .bar-fill-reveal,
        ${selector} .needle-marker,
        ${selector} .target-marker,
        ${selector} .peak-marker,
        ${selector} .floor-marker,
        ${selector} .generic-marker,
        ${selector} .baseline-indicator {
          transition: none;
        }
`;
}
