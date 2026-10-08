(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/render/bar-styles.js
  function getBarAnimationStyles(selector) {
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
  var barTrackStyles, barMarkerStyles;
  var init_bar_styles = __esm({
    "src/render/bar-styles.js"() {
      barTrackStyles = `
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
      barMarkerStyles = `
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

`;
    }
  });

  // src/utils/extrema.js
  function getLocalBoundaryTimestamp(date, unit) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    if (unit === "quarterly") {
      return new Date(year, month, day, hour, Math.floor(date.getMinutes() / 15) * 15, 0, 0).getTime();
    }
    if (unit === "hourly") {
      return new Date(year, month, day, hour, 0, 0, 0).getTime();
    }
    if (unit === "daily") {
      return new Date(year, month, day, 0, 0, 0, 0).getTime();
    }
    if (unit === "weekly") {
      const daysSinceMonday = (date.getDay() + 6) % 7;
      return new Date(year, month, day - daysSinceMonday, 0, 0, 0, 0).getTime();
    }
    if (unit === "monthly") {
      return new Date(year, month, 1, 0, 0, 0, 0).getTime();
    }
    if (unit === "yearly") {
      return new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    }
    return null;
  }
  function normalizeReset(value) {
    if (value === void 0) value = "never";
    if (typeof value !== "string") return { kind: "never" };
    const normalized = value.trim().toLowerCase();
    if (normalized === "never") return { kind: "never" };
    if (CALENDAR_RESETS.has(normalized)) {
      return { kind: "calendar", unit: normalized };
    }
    const durationMatch = normalized.match(/^(\d+)(m|h)$/);
    if (!durationMatch) return { kind: "never" };
    const amount = Number(durationMatch[1]);
    const unit = durationMatch[2];
    if (!Number.isInteger(amount) || amount < 1 || unit === "m" && amount > 59 || unit === "h" && amount > 23) {
      return { kind: "never" };
    }
    return unit === "m" ? { kind: "duration", minutes: amount } : { kind: "duration", hours: amount };
  }
  function isValidReset(value) {
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    if (normalized === "never" || CALENDAR_RESETS.has(normalized)) return true;
    const match = normalized.match(/^(\d+)(m|h)$/);
    if (!match) return false;
    const amount = Number(match[1]);
    return Number.isInteger(amount) && amount >= 1 && (match[2] === "m" ? amount <= 59 : amount <= 23);
  }
  function getResetWindowKey(reset, timestamp) {
    if ((reset == null ? void 0 : reset.kind) !== "calendar") return null;
    const boundary = getLocalBoundaryTimestamp(new Date(timestamp), reset.unit);
    return Number.isFinite(boundary) ? String(boundary) : null;
  }
  function getDurationMs(reset) {
    if ((reset == null ? void 0 : reset.kind) !== "duration") return null;
    if (Number.isInteger(reset.minutes)) return reset.minutes * 60 * 1e3;
    if (Number.isInteger(reset.hours)) return reset.hours * 60 * 60 * 1e3;
    return null;
  }
  function initializeExtremum(sample, reset, timestamp) {
    if ((reset == null ? void 0 : reset.kind) === "duration") {
      return {
        value: sample,
        startedAtMs: Number.isFinite(timestamp) ? timestamp : null,
        windowKey: null
      };
    }
    if ((reset == null ? void 0 : reset.kind) === "calendar") {
      return {
        value: sample,
        startedAtMs: null,
        windowKey: getResetWindowKey(reset, timestamp)
      };
    }
    return {
      value: sample,
      startedAtMs: null,
      windowKey: null
    };
  }
  function updateExtremum(previous, sample, reset, direction, timestamp) {
    if (!Number.isFinite(sample)) return previous != null ? previous : null;
    const durationMs = getDurationMs(reset);
    if (!previous) return initializeExtremum(sample, reset, timestamp);
    if (durationMs !== null && Number.isFinite(previous.startedAtMs) && Number.isFinite(timestamp) && timestamp - previous.startedAtMs >= durationMs) {
      return initializeExtremum(sample, reset, timestamp);
    }
    if ((reset == null ? void 0 : reset.kind) === "calendar") {
      const windowKey = getResetWindowKey(reset, timestamp);
      if (windowKey !== null && windowKey !== previous.windowKey) {
        return initializeExtremum(sample, reset, timestamp);
      }
    }
    const shouldReplace = direction === "min" ? sample < previous.value : sample > previous.value;
    return shouldReplace ? { ...previous, value: sample } : previous;
  }
  var CALENDAR_RESETS;
  var init_extrema = __esm({
    "src/utils/extrema.js"() {
      CALENDAR_RESETS = /* @__PURE__ */ new Set([
        "quarterly",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly"
      ]);
    }
  });

  // src/config/normalize.js
  function normalizeResolvableValue(value, entityValue, percentValue = null) {
    const normalized = {
      fixed: value != null ? value : null,
      entity: entityValue != null ? entityValue : null
    };
    if (Number.isFinite(percentValue)) {
      normalized.percent = percentValue;
    }
    return normalized;
  }
  function looksLikeEntityId(value) {
    return typeof value === "string" && /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(value.trim());
  }
  function parsePercentLiteral(value) {
    if (typeof value !== "string") return null;
    const match = value.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
    if (!match) return null;
    const percent = parseFloat(match[1]);
    return Number.isFinite(percent) ? percent : null;
  }
  function getFiniteNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  }
  function normalizeStructuredResolvableValue(input, inheritedResolvable = null, defaultValue = null, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    const { allowPercent = false } = options;
    const inherited = inheritedResolvable != null ? inheritedResolvable : normalizeResolvableValue(defaultValue, null);
    if (input === void 0) {
      return { ...inherited };
    }
    if (input === null) {
      return normalizeResolvableValue(null, null);
    }
    if (typeof input === "object" && !Array.isArray(input)) {
      const value = (_b = (_a = input.fixed) != null ? _a : input.value) != null ? _b : null;
      const entity = (_c = input.entity) != null ? _c : null;
      const percent = allowPercent ? getFiniteNumber(input.percent) : null;
      return normalizeResolvableValue(value, entity, percent);
    }
    if (looksLikeEntityId(input)) {
      return normalizeResolvableValue(
        (_e = (_d = inherited.fixed) != null ? _d : defaultValue) != null ? _e : null,
        input,
        (_f = inherited.percent) != null ? _f : null
      );
    }
    if (allowPercent) {
      const percent = parsePercentLiteral(input);
      if (Number.isFinite(percent)) {
        return normalizeResolvableValue(null, null, percent);
      }
    }
    return normalizeResolvableValue(input, null);
  }
  function hasConfiguredMarkerSource(source) {
    var _a;
    return !!source && (getFiniteNumber((_a = source.fixed) != null ? _a : source.value) !== null || Number.isFinite(source.percent) || !!source.entity);
  }
  function applyGenericMarkerCapacity(markers, config) {
    var _a, _b, _c, _d;
    const occupied = {
      above: ((_a = config == null ? void 0 : config.peak_marker) == null ? void 0 : _a.show) === true ? 1 : 0,
      below: (((_b = config == null ? void 0 : config.floor_marker) == null ? void 0 : _b.show) === true ? 1 : 0) + (((_c = config == null ? void 0 : config.target_marker) == null ? void 0 : _c.enabled) !== false && hasConfiguredMarkerSource((_d = config == null ? void 0 : config.target_marker) == null ? void 0 : _d.source) ? 1 : 0)
    };
    return markers.map((marker) => {
      const accepted = marker.valid && occupied[marker.lane] < 4;
      if (accepted) occupied[marker.lane] += 1;
      return { ...marker, accepted };
    });
  }
  function normalizeGenericMarkerList(input, capacityConfig = null) {
    if (!Array.isArray(input)) {
      return { markers: [], invalidList: input !== void 0 };
    }
    const markers = input.map((rawMarker, index) => {
      var _a;
      if (!rawMarker || typeof rawMarker !== "object" || Array.isArray(rawMarker)) {
        return { id: `generic-${index}`, index, valid: false, accepted: false, malformed: true };
      }
      const rawAt = rawMarker.at;
      const hasUnsupportedPercentField = rawAt && typeof rawAt === "object" && Object.prototype.hasOwnProperty.call(rawAt, "percent");
      const atInput = typeof rawAt === "string" ? rawAt.trim() : rawAt;
      const source = normalizeStructuredResolvableValue(atInput, null, null, { allowPercent: true });
      const explicitEntity = rawAt && typeof rawAt === "object" && rawAt.entity !== void 0 ? rawAt.entity : typeof atInput === "string" && looksLikeEntityId(atInput) ? atInput : null;
      const invalidEntity = explicitEntity !== null && explicitEntity !== void 0 && explicitEntity !== "" && !looksLikeEntityId(explicitEntity);
      const invalidFixed = rawAt && typeof rawAt === "object" && rawAt.fixed !== void 0 && rawAt.fixed !== null && getFiniteNumber(rawAt.fixed) === null;
      const hasSource = !!source.entity || getFiniteNumber(source.fixed) !== null || Number.isFinite(source.percent);
      const invalidPercentage = Number.isFinite(source.percent) && (source.percent < 0 || source.percent > 100);
      const validSource = rawAt !== void 0 && rawAt !== null && !hasUnsupportedPercentField && !invalidEntity && !invalidFixed && hasSource && !invalidPercentage;
      const lane = rawMarker.lane === void 0 ? "below" : rawMarker.lane;
      const validLane = lane === "above" || lane === "below";
      const supportedShapes = ["circle", "diamond", "triangle", "chevron", "arrow", "pin"];
      const validShape = rawMarker.shape === void 0 || supportedShapes.includes(rawMarker.shape);
      const direction = normalizeMarkerDirection(rawMarker.direction);
      const invalidDirection = rawMarker.direction !== void 0 && !["inward", "outward"].includes(
        typeof rawMarker.direction === "string" ? rawMarker.direction.trim().toLowerCase() : ""
      );
      const label = rawMarker.label && typeof rawMarker.label === "object" && !Array.isArray(rawMarker.label) ? rawMarker.label : {};
      const labelConfig = normalizeMarkerLabelConfig(label);
      const labelEntityInput = label.entity;
      const labelEntity = typeof labelEntityInput === "string" ? labelEntityInput.trim() : "";
      const invalidLabelEntity = labelEntityInput !== void 0 && labelEntityInput !== null && labelEntityInput !== "" && !looksLikeEntityId(labelEntity);
      const validLabelEntity = labelEntity && looksLikeEntityId(labelEntity) ? labelEntity : null;
      const showMarker = typeof rawMarker.show_marker === "boolean" ? rawMarker.show_marker : true;
      return {
        id: `generic-${index}`,
        index,
        source: {
          ...source,
          entity: typeof source.entity === "string" ? source.entity.trim() : source.entity
        },
        lane: validLane ? lane : null,
        shape: validShape ? (_a = rawMarker.shape) != null ? _a : "circle" : "circle",
        direction,
        invalidDirection,
        showMarker,
        invalidShowMarker: rawMarker.show_marker !== void 0 && typeof rawMarker.show_marker !== "boolean",
        color: typeof rawMarker.color === "string" && rawMarker.color.trim() ? rawMarker.color : "#888888",
        label: {
          show: label.show === true,
          text: labelConfig.label_text,
          entity: validLabelEntity,
          showValue: labelConfig.label_show_value,
          showUnit: labelConfig.label_show_unit,
          precision: labelConfig.label_precision,
          invalidShow: labelConfig.label_invalid_show,
          invalidText: labelConfig.label_invalid_text,
          invalidShowValue: labelConfig.label_invalid_show_value,
          invalidShowUnit: labelConfig.label_invalid_show_unit,
          invalidPrecision: labelConfig.label_invalid_precision,
          invalidPrecisionKey: labelConfig.label_precision_key,
          unsupportedUnit: labelConfig.label_unsupported_unit,
          invalidEntity: invalidLabelEntity
        },
        valid: validSource && validLane,
        invalidSource: !validSource,
        invalidPercentage,
        unsupportedPercentField: hasUnsupportedPercentField,
        invalidLane: !validLane,
        invalidShape: !validShape,
        accepted: false
      };
    });
    return { markers: applyGenericMarkerCapacity(markers, capacityConfig), invalidList: false };
  }
  function normalizeBaselineDirectionConfig(input, inheritedDirection = null) {
    var _a;
    const inherited = inheritedDirection != null ? inheritedDirection : { color: null };
    if (input === void 0) {
      return { ...inherited };
    }
    if (input === null) {
      return { color: null };
    }
    if (typeof input === "object" && !Array.isArray(input)) {
      return {
        color: (_a = input.color) != null ? _a : null
      };
    }
    return {
      color: input
    };
  }
  function normalizeOptionalEnabled(value) {
    return value === true ? true : value === false ? false : null;
  }
  function normalizeBaselineConfig(entityConfig, cardConfig) {
    var _a;
    const cardBaseline = cardConfig == null ? void 0 : cardConfig.baseline;
    const rawBaseline = entityConfig == null ? void 0 : entityConfig.baseline;
    const inherited = {
      enabled: normalizeOptionalEnabled(cardBaseline == null ? void 0 : cardBaseline.enabled),
      at: (cardBaseline == null ? void 0 : cardBaseline.at) ? { ...cardBaseline.at } : normalizeResolvableValue(null, null),
      above: normalizeBaselineDirectionConfig(void 0, cardBaseline == null ? void 0 : cardBaseline.above),
      below: normalizeBaselineDirectionConfig(void 0, cardBaseline == null ? void 0 : cardBaseline.below)
    };
    if (rawBaseline === void 0) {
      return inherited;
    }
    if (rawBaseline === null) {
      return {
        enabled: null,
        at: normalizeResolvableValue(null, null),
        above: { color: null },
        below: { color: null }
      };
    }
    if (typeof rawBaseline !== "object" || Array.isArray(rawBaseline)) {
      return {
        enabled: inherited.enabled,
        at: normalizeStructuredResolvableValue(rawBaseline, inherited.at, null),
        above: inherited.above,
        below: inherited.below
      };
    }
    return {
      enabled: (_a = normalizeOptionalEnabled(rawBaseline.enabled)) != null ? _a : inherited.enabled,
      at: normalizeStructuredResolvableValue(rawBaseline.at, inherited.at, null, { allowPercent: true }),
      above: normalizeBaselineDirectionConfig(rawBaseline.above, inherited.above),
      below: normalizeBaselineDirectionConfig(rawBaseline.below, inherited.below)
    };
  }
  function inferSegmentEndValues(segments, fallbackEnd = null) {
    const sorted = [...segments].sort((a, b) => a.from - b.from);
    return sorted.map((segment, index) => {
      var _a;
      let to = Number.isFinite(segment.to) ? segment.to : null;
      if (!Number.isFinite(to) && index < sorted.length - 1) {
        to = sorted[index + 1].from;
      }
      if (!Number.isFinite(to) && Number.isFinite(fallbackEnd)) {
        to = fallbackEnd;
      }
      return {
        from: segment.from,
        to,
        color: segment.color,
        label: (_a = segment.label) != null ? _a : null
      };
    });
  }
  function normalizeSeverityToSegments(input) {
    if (!Array.isArray(input)) return null;
    const segments = input.filter((segment) => Number.isFinite(segment == null ? void 0 : segment.from) && (segment == null ? void 0 : segment.color)).map((segment) => {
      var _a;
      return {
        from: segment.from,
        to: Number.isFinite(segment == null ? void 0 : segment.to) ? segment.to : null,
        color: segment.color,
        label: (_a = segment.label) != null ? _a : null
      };
    });
    return inferSegmentEndValues(segments, 100);
  }
  function normalizeSegmentBoundary(input, legacySegmentSpace = null) {
    var _a;
    if (input === void 0) return { value: null, issue: null };
    if (input === null) return { value: null, issue: "malformed" };
    if (input && typeof input === "object" && !Array.isArray(input)) {
      if (input.entity !== void 0 && input.entity !== null && input.entity !== "") {
        return { value: null, issue: "entity" };
      }
      if (Object.prototype.hasOwnProperty.call(input, "percent")) {
        const percent = getFiniteNumber(input.percent);
        return Number.isFinite(percent) ? { value: normalizeResolvableValue(null, null, percent), issue: null } : { value: null, issue: "malformed" };
      }
      const fixed = getFiniteNumber((_a = input.fixed) != null ? _a : input.value);
      return Number.isFinite(fixed) ? { value: normalizeResolvableValue(fixed, null), issue: null } : { value: null, issue: "malformed" };
    }
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (looksLikeEntityId(trimmed)) return { value: null, issue: "entity" };
      if (trimmed.includes("%")) {
        const percent = parsePercentLiteral(trimmed);
        return Number.isFinite(percent) ? { value: normalizeResolvableValue(null, null, percent), issue: null } : { value: null, issue: "malformed_percent" };
      }
    }
    const numeric = getFiniteNumber(input);
    if (!Number.isFinite(numeric)) return { value: null, issue: "malformed" };
    return legacySegmentSpace === "percent" ? { value: normalizeResolvableValue(null, null, numeric), issue: null } : { value: normalizeResolvableValue(numeric, null), issue: null };
  }
  function normalizeGaugeSegments(input, options = {}) {
    if (!Array.isArray(input)) return null;
    const { legacySegmentSpace = null } = options;
    const segments = input.map((segment) => {
      var _a, _b;
      const from = (segment == null ? void 0 : segment.from) === void 0 ? { value: null, issue: "malformed" } : normalizeSegmentBoundary(segment.from, legacySegmentSpace);
      const to = (segment == null ? void 0 : segment.to) === void 0 ? { value: null, issue: null } : segment.to === null ? { value: null, issue: null } : normalizeSegmentBoundary(segment.to, legacySegmentSpace);
      if (!(segment == null ? void 0 : segment.color)) {
        return null;
      }
      return {
        from: from.value,
        to: to.value,
        invalidBoundary: (_a = from.issue) != null ? _a : to.issue,
        color: segment.color,
        label: (_b = segment.label) != null ? _b : null
      };
    }).filter(Boolean);
    return segments.map((segment, index) => {
      var _a;
      const nextValid = segments.slice(index + 1).find((candidate) => !candidate.invalidBoundary);
      return {
        from: segment.from ? { ...segment.from } : null,
        to: segment.to ? { ...segment.to } : (nextValid == null ? void 0 : nextValid.from) ? { ...nextValid.from } : null,
        ...segment.invalidBoundary ? { invalidBoundary: segment.invalidBoundary } : {},
        color: segment.color,
        label: (_a = segment.label) != null ? _a : null
      };
    });
  }
  function normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const cardScale = cardConfig == null ? void 0 : cardConfig.scale;
    const entityScale = entityConfig == null ? void 0 : entityConfig.scale;
    const entityKey = `${key}_entity`;
    const cardBound = cardScale == null ? void 0 : cardScale[key];
    const inherited = cardBound ? normalizeResolvableValue(
      (_b = (_a = cardBound.fixed) != null ? _a : cardBound.value) != null ? _b : null,
      (_c = cardBound.entity) != null ? _c : null
    ) : normalizeResolvableValue(
      (_d = cardConfig == null ? void 0 : cardConfig[key]) != null ? _d : defaultValue,
      (_e = cardConfig == null ? void 0 : cardConfig[entityKey]) != null ? _e : null
    );
    const inheritedFixedExplicit = cardBound ? cardBound.fixed_explicit !== false && cardBound.fixed !== null && cardBound.fixed !== void 0 : (cardConfig == null ? void 0 : cardConfig[key]) !== null && (cardConfig == null ? void 0 : cardConfig[key]) !== void 0;
    const withFixedExplicit = (bound, explicit) => {
      Object.defineProperty(bound, "fixed_explicit", { value: explicit });
      return bound;
    };
    if ((entityScale == null ? void 0 : entityScale[key]) !== void 0) {
      const input = entityScale[key];
      const fixedExplicit = looksLikeEntityId(input) ? inheritedFixedExplicit : typeof input === "object" && input !== null ? ((_f = input.fixed) != null ? _f : input.value) !== null && ((_g = input.fixed) != null ? _g : input.value) !== void 0 : input !== null;
      return withFixedExplicit(normalizeStructuredResolvableValue(
        entityScale[key],
        inherited,
        defaultValue
      ), fixedExplicit);
    }
    const entityOverride = entityConfig[entityKey];
    const hasEntityOverride = entityOverride !== void 0 && entityOverride !== null;
    const value = (_i = (_h = entityConfig[key]) != null ? _h : hasEntityOverride ? null : inherited.fixed) != null ? _i : inherited.entity ? null : defaultValue;
    const entity = (_j = entityOverride != null ? entityOverride : inherited.entity) != null ? _j : null;
    return withFixedExplicit(
      normalizeResolvableValue(value, entity),
      entityConfig[key] !== null && entityConfig[key] !== void 0 || !hasEntityOverride && inheritedFixedExplicit
    );
  }
  function normalizeScaleConfig(entityConfig, cardConfig) {
    return {
      min: normalizeScaleBound(entityConfig, cardConfig, "min", 0),
      max: normalizeScaleBound(entityConfig, cardConfig, "max", 100)
    };
  }
  function fillStyleToColorMode(fillStyle) {
    switch (fillStyle) {
      case "solid":
        return "single";
      case "gradient":
        return "gradient";
      case "bands":
        return "severity";
      case "soft_bands":
        return "severity";
      case "band_gradient":
        return "severity_gradient";
      default:
        return null;
    }
  }
  function colorModeToFillStyle(colorMode) {
    switch (colorMode) {
      case "single":
        return "solid";
      case "gradient":
        return "gradient";
      case "severity":
        return "bands";
      case "severity_gradient":
        return "band_gradient";
      default:
        return null;
    }
  }
  function hasOwnConfigValue(config, key) {
    return config !== null && config !== void 0 && Object.prototype.hasOwnProperty.call(config, key);
  }
  function hasExplicitColor(config) {
    const values = [
      hasOwnConfigValue(config, "color") ? config.color : void 0,
      hasOwnConfigValue(config == null ? void 0 : config.bar, "color") ? config.bar.color : void 0
    ];
    return values.some((value) => value !== void 0 && value !== null);
  }
  function getPaintExplicitness(config) {
    const bar = config == null ? void 0 : config.bar;
    const explicitPaintKeys = [
      [config, "color_mode"],
      [bar, "color_mode"],
      [bar, "fill_style"],
      [config, "severity"],
      [config, "segments"],
      [bar, "segments"],
      [config, "gradient_stops"],
      [bar, "gradient_stops"],
      [bar, "solid_fill"]
    ];
    return {
      color: hasExplicitColor(config),
      paint: explicitPaintKeys.some(([source, key]) => hasOwnConfigValue(source, key))
    };
  }
  function normalizeBarModeConfig(barConfig = null, flatColorMode = null) {
    var _a, _b, _c, _d, _e, _f;
    const fillStyle = (_a = barConfig == null ? void 0 : barConfig.fill_style) != null ? _a : null;
    const colorMode = (_c = (_b = barConfig == null ? void 0 : barConfig.color_mode) != null ? _b : flatColorMode) != null ? _c : null;
    const normalizedColorMode = (_e = (_d = fillStyleToColorMode(fillStyle)) != null ? _d : colorMode) != null ? _e : "severity";
    return {
      fill_style: (_f = fillStyle != null ? fillStyle : colorModeToFillStyle(normalizedColorMode)) != null ? _f : "bands",
      color_mode: normalizedColorMode
    };
  }
  function resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig, { scopeExplicitness = null, inheritedExplicitness = null, isCardScope = false } = {}) {
    const colorOnlyScope = (scopeExplicitness == null ? void 0 : scopeExplicitness.color) === true && scopeExplicitness.paint !== true;
    const inheritedPaintIsExplicit = (inheritedExplicitness == null ? void 0 : inheritedExplicitness.paint) === true;
    if (colorOnlyScope && (isCardScope || !inheritedPaintIsExplicit)) {
      return normalizeBarModeConfig({ fill_style: "solid" }, null);
    }
    if ((entityBar == null ? void 0 : entityBar.fill_style) !== void 0 || (entityBar == null ? void 0 : entityBar.color_mode) !== void 0 || entityConfig.color_mode !== void 0) {
      return normalizeBarModeConfig(entityBar, entityConfig.color_mode);
    }
    if ((cardBar == null ? void 0 : cardBar.fill_style) !== void 0 || (cardBar == null ? void 0 : cardBar.color_mode) !== void 0 || (cardConfig == null ? void 0 : cardConfig.color_mode) !== void 0) {
      return normalizeBarModeConfig(cardBar, cardConfig == null ? void 0 : cardConfig.color_mode);
    }
    return normalizeBarModeConfig(null, null);
  }
  function normalizeGradientStops(input) {
    if (!Array.isArray(input)) return input != null ? input : null;
    return input.map((stop) => {
      if (!stop || typeof stop !== "object" || Array.isArray(stop)) {
        return stop;
      }
      const percentPos = parsePercentLiteral(stop.pos);
      const numericPos = Number.isFinite(percentPos) ? percentPos : getFiniteNumber(stop.pos);
      return {
        ...stop,
        pos: Number.isFinite(numericPos) ? numericPos : stop.pos
      };
    });
  }
  function normalizeNeedleConfig(input, inheritedNeedle = null) {
    var _a, _b, _c, _d;
    const base = inheritedNeedle ? { show: (_a = inheritedNeedle.show) != null ? _a : false, color: (_b = inheritedNeedle.color) != null ? _b : "#ffffff" } : { show: false, color: "#ffffff" };
    if (input === void 0) {
      return { ...base };
    }
    if (typeof input === "boolean") {
      return {
        show: input,
        color: "#ffffff"
      };
    }
    if (input && typeof input === "object" && !Array.isArray(input)) {
      return {
        show: (_c = input.show) != null ? _c : base.show,
        color: (_d = input.color) != null ? _d : base.color
      };
    }
    return { ...base };
  }
  function normalizeBarConfig(entityConfig, cardConfig, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
    const scopeExplicitness = (_a = options.scopeExplicitness) != null ? _a : getPaintExplicitness(entityConfig);
    const inheritedExplicitness = (_c = (_b = options.inheritedExplicitness) != null ? _b : cardConfig == null ? void 0 : cardConfig[PAINT_EXPLICITNESS]) != null ? _c : getPaintExplicitness(cardConfig);
    const isCardScope = (_d = options.isCardScope) != null ? _d : cardConfig == null;
    const cardBar = cardConfig == null ? void 0 : cardConfig.bar;
    const entityBar = entityConfig == null ? void 0 : entityConfig.bar;
    const inheritedSegmentSpace = hasOwnConfigValue(cardBar, EXPLICIT_SEGMENT_SPACE) ? cardBar[EXPLICIT_SEGMENT_SPACE] : ["percent", "scale"].includes(cardBar == null ? void 0 : cardBar.segment_space) ? cardBar.segment_space : null;
    const explicitSegmentSpace = ["percent", "scale"].includes(entityBar == null ? void 0 : entityBar.segment_space) ? entityBar.segment_space : inheritedSegmentSpace;
    const entityStructuredSegments = entityBar == null ? void 0 : entityBar.segments;
    const entityTopLevelSegments = entityConfig.segments;
    const entityLegacySeverity = entityConfig.severity;
    const cardStructuredSegments = (_e = cardBar == null ? void 0 : cardBar.segments) != null ? _e : null;
    const cardTopLevelSegments = (_f = cardConfig == null ? void 0 : cardConfig.segments) != null ? _f : null;
    const cardLegacySeverity = (_g = cardConfig == null ? void 0 : cardConfig.severity) != null ? _g : null;
    let segments = null;
    let segment_space = (cardBar == null ? void 0 : cardBar.segment_space) === "percent" || (cardBar == null ? void 0 : cardBar.segment_space) === "scale" ? cardBar.segment_space : null;
    if (entityStructuredSegments !== void 0 && entityStructuredSegments !== null) {
      segment_space = explicitSegmentSpace;
      segments = normalizeGaugeSegments(entityStructuredSegments, { legacySegmentSpace: segment_space });
    } else if (entityTopLevelSegments !== void 0 && entityTopLevelSegments !== null) {
      segments = normalizeGaugeSegments(entityTopLevelSegments);
    } else if (entityLegacySeverity !== void 0 && entityLegacySeverity !== null) {
      segments = normalizeSeverityToSegments(entityLegacySeverity);
      segment_space = "percent";
    } else if (cardStructuredSegments !== null && cardStructuredSegments !== void 0) {
      segments = cardStructuredSegments.map((segment) => ({ ...segment }));
    } else if (cardTopLevelSegments !== null && cardTopLevelSegments !== void 0) {
      segments = normalizeGaugeSegments(cardTopLevelSegments);
    } else if (cardLegacySeverity !== null && cardLegacySeverity !== void 0) {
      segments = normalizeSeverityToSegments(cardLegacySeverity);
      segment_space = "percent";
    }
    const structuredAboveTargetColor = (entityConfig == null ? void 0 : entityConfig.target) && typeof entityConfig.target === "object" && !Array.isArray(entityConfig.target) ? (_h = entityConfig.target.when_exceeded) == null ? void 0 : _h.fill_color : void 0;
    const inheritedStructuredAboveTargetColor = (cardConfig == null ? void 0 : cardConfig.target) && typeof cardConfig.target === "object" && !Array.isArray(cardConfig.target) ? (_i = cardConfig.target.when_exceeded) == null ? void 0 : _i.fill_color : void 0;
    const normalizedMode = resolveNormalizedBarMode(
      entityBar,
      entityConfig,
      cardBar,
      cardConfig,
      { scopeExplicitness, inheritedExplicitness, isCardScope }
    );
    const normalizedBar = {
      fill_style: normalizedMode.fill_style,
      color_mode: normalizedMode.color_mode,
      needle: normalizeNeedleConfig(entityBar == null ? void 0 : entityBar.needle, cardBar == null ? void 0 : cardBar.needle),
      solid_fill: (_k = (_j = entityBar == null ? void 0 : entityBar.solid_fill) != null ? _j : cardBar == null ? void 0 : cardBar.solid_fill) != null ? _k : false,
      color: (_o = (_n = (_m = (_l = entityBar == null ? void 0 : entityBar.color) != null ? _l : entityConfig.color) != null ? _m : cardBar == null ? void 0 : cardBar.color) != null ? _n : cardConfig == null ? void 0 : cardConfig.color) != null ? _o : "#4a9eff",
      gradient_stops: normalizeGradientStops(
        (_s = (_r = (_q = (_p = entityBar == null ? void 0 : entityBar.gradient_stops) != null ? _p : entityConfig.gradient_stops) != null ? _q : cardBar == null ? void 0 : cardBar.gradient_stops) != null ? _r : cardConfig == null ? void 0 : cardConfig.gradient_stops) != null ? _s : null
      ),
      severity: segments,
      segments,
      segment_space,
      animated: (_w = (_v = (_u = (_t = entityBar == null ? void 0 : entityBar.animated) != null ? _t : entityConfig.animated) != null ? _u : cardBar == null ? void 0 : cardBar.animated) != null ? _v : cardConfig == null ? void 0 : cardConfig.animated) != null ? _w : true,
      above_target_color: (_A = (_z = (_y = (_x = structuredAboveTargetColor != null ? structuredAboveTargetColor : entityConfig.above_target_color) != null ? _x : cardBar == null ? void 0 : cardBar.above_target_color) != null ? _y : inheritedStructuredAboveTargetColor) != null ? _z : cardConfig == null ? void 0 : cardConfig.above_target_color) != null ? _A : null
    };
    Object.defineProperty(normalizedBar, EXPLICIT_SEGMENT_SPACE, { value: explicitSegmentSpace });
    return normalizedBar;
  }
  function clampSupportedRowHeight(height) {
    return Math.max(24, height);
  }
  function normalizeLabelPosition(position, fallback = "left") {
    const normalized = typeof position === "string" ? position.trim().toLowerCase() : "";
    return ["left", "above", "inside", "off", "hero"].includes(normalized) ? normalized : fallback;
  }
  function normalizeHeroSize(size, fallback = "medium") {
    const normalized = typeof size === "string" ? size.trim().toLowerCase() : "";
    return ["small", "medium", "large"].includes(normalized) ? normalized : fallback;
  }
  function normalizeHeroFontSize(value) {
    if (!Number.isFinite(value)) return null;
    return Math.min(112, Math.max(12, value));
  }
  function normalizeLayoutConfig(entityConfig, cardConfig) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    const cardLayout = cardConfig == null ? void 0 : cardConfig.layout;
    const entityLayout = entityConfig == null ? void 0 : entityConfig.layout;
    const entityLabel = entityLayout == null ? void 0 : entityLayout.label;
    const entityHero = entityLayout == null ? void 0 : entityLayout.hero;
    const cardLabel = cardLayout == null ? void 0 : cardLayout.label;
    const cardHero = cardLayout == null ? void 0 : cardLayout.hero;
    const isCardLevelNormalization = !cardConfig;
    const rawHeight = (_d = (_c = (_b = (_a = entityLayout == null ? void 0 : entityLayout.height) != null ? _a : entityConfig.height) != null ? _b : cardLayout == null ? void 0 : cardLayout.height) != null ? _c : cardConfig == null ? void 0 : cardConfig.height) != null ? _d : 38;
    const heightExplicit = (entityLayout == null ? void 0 : entityLayout.height) !== void 0 || entityConfig._height_explicit === true || !isCardLevelNormalization && entityConfig.height !== void 0 || (cardLayout == null ? void 0 : cardLayout.height_explicit) === true || (cardConfig == null ? void 0 : cardConfig._height_explicit) === true;
    const labelPosition = normalizeLabelPosition(
      (_h = (_g = (_f = (_e = entityLabel == null ? void 0 : entityLabel.position) != null ? _e : entityConfig.label_position) != null ? _f : cardLabel == null ? void 0 : cardLabel.position) != null ? _g : cardLayout == null ? void 0 : cardLayout.label_position) != null ? _h : cardConfig == null ? void 0 : cardConfig.label_position,
      "left"
    );
    const heroFontSize = labelPosition === "hero" ? normalizeHeroFontSize((_i = entityHero == null ? void 0 : entityHero.value_size) != null ? _i : cardHero == null ? void 0 : cardHero.value_size) : null;
    return {
      label: {
        position: labelPosition,
        width: (_n = (_m = (_l = (_k = (_j = entityLabel == null ? void 0 : entityLabel.width) != null ? _j : entityConfig.label_width) != null ? _k : cardLabel == null ? void 0 : cardLabel.width) != null ? _l : cardLayout == null ? void 0 : cardLayout.label_width) != null ? _m : cardConfig == null ? void 0 : cardConfig.label_width) != null ? _n : 100
      },
      hero: {
        size: normalizeHeroSize(
          (_y = (_x = (_w = (_v = (_u = (_t = (_s = (_r = (_q = (_p = (_o = entityHero == null ? void 0 : entityHero.size) != null ? _o : entityLabel == null ? void 0 : entityLabel.hero_size) != null ? _p : entityLabel == null ? void 0 : entityLabel.heroSize) != null ? _q : entityConfig.hero_size) != null ? _r : entityConfig.heroSize) != null ? _s : cardHero == null ? void 0 : cardHero.size) != null ? _t : cardLabel == null ? void 0 : cardLabel.hero_size) != null ? _u : cardLabel == null ? void 0 : cardLabel.heroSize) != null ? _v : cardLayout == null ? void 0 : cardLayout.hero_size) != null ? _w : cardLayout == null ? void 0 : cardLayout.heroSize) != null ? _x : cardConfig == null ? void 0 : cardConfig.hero_size) != null ? _y : cardConfig == null ? void 0 : cardConfig.heroSize,
          "medium"
        ),
        value_size: heroFontSize
      },
      height: clampSupportedRowHeight(rawHeight),
      height_explicit: heightExplicit
    };
  }
  function normalizeFormattingConfig(entityConfig, cardConfig) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const cardFormatting = cardConfig == null ? void 0 : cardConfig.formatting;
    const entityFormatting = entityConfig == null ? void 0 : entityConfig.formatting;
    return {
      decimal: (_d = (_c = (_b = (_a = entityFormatting == null ? void 0 : entityFormatting.decimal) != null ? _a : entityConfig.decimal) != null ? _b : cardFormatting == null ? void 0 : cardFormatting.decimal) != null ? _c : cardConfig == null ? void 0 : cardConfig.decimal) != null ? _d : null,
      unit: (_h = (_g = (_f = (_e = entityFormatting == null ? void 0 : entityFormatting.unit) != null ? _e : entityConfig.unit) != null ? _f : cardFormatting == null ? void 0 : cardFormatting.unit) != null ? _g : cardConfig == null ? void 0 : cardConfig.unit) != null ? _h : null
    };
  }
  function normalizeTargetMarkerShape(value) {
    const normalized = String(value != null ? value : "").trim().toLowerCase();
    return normalized === "triangle" || normalized === "diamond" ? normalized : "diamond";
  }
  function normalizeMarkerDirection(value) {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    return normalized === "outward" ? "outward" : "inward";
  }
  function normalizeMarkerLabelConfig(rawLabel, inherited = {}) {
    var _a, _b, _c;
    const label = rawLabel && typeof rawLabel === "object" && !Array.isArray(rawLabel) ? rawLabel : {};
    const hasText = Object.prototype.hasOwnProperty.call(label, "text");
    const textValue = hasText ? typeof label.text === "string" ? label.text.replace(/\s+/g, " ").trim() : inherited.label_text : inherited.label_text;
    const hasPrecision = Object.prototype.hasOwnProperty.call(label, "precision");
    const hasDecimal = Object.prototype.hasOwnProperty.call(label, "decimal");
    const precisionValue = hasPrecision ? label.precision : label.decimal;
    const precisionSet = hasPrecision || hasDecimal;
    const precision = precisionSet ? getFiniteNumber(precisionValue) : (_a = inherited.label_precision) != null ? _a : null;
    const precisionInvalid = precisionSet && precisionValue !== null && precisionValue !== "" && !(Number.isInteger(precision) && precision >= 0);
    return {
      label_text: textValue != null ? textValue : null,
      label_show_value: typeof label.show_value === "boolean" ? label.show_value : (_b = inherited.label_show_value) != null ? _b : true,
      label_show_unit: typeof label.show_unit === "boolean" ? label.show_unit : (_c = inherited.label_show_unit) != null ? _c : true,
      label_precision: precisionInvalid ? null : precision,
      label_invalid_show: label.show !== void 0 && typeof label.show !== "boolean",
      label_invalid_text: hasText && typeof label.text !== "string",
      label_invalid_show_value: label.show_value !== void 0 && typeof label.show_value !== "boolean",
      label_invalid_show_unit: label.show_unit !== void 0 && typeof label.show_unit !== "boolean",
      label_invalid_precision: precisionInvalid,
      label_precision_key: precisionInvalid ? hasPrecision ? "precision" : "decimal" : void 0,
      label_unsupported_unit: Object.prototype.hasOwnProperty.call(label, "unit")
    };
  }
  function builtinMarkerLabelFields(options) {
    const fields = {};
    if (options.label_text !== null && options.label_text !== void 0) fields.label_text = options.label_text;
    if (options.label_show_value === false) fields.label_show_value = false;
    if (options.label_show_unit === false) fields.label_show_unit = false;
    if (options.label_precision !== null && options.label_precision !== void 0) fields.label_precision = options.label_precision;
    if (options.label_invalid_text) fields.label_invalid_text = true;
    if (options.label_invalid_show_value) fields.label_invalid_show_value = true;
    if (options.label_invalid_show_unit) fields.label_invalid_show_unit = true;
    if (options.label_invalid_show) fields.label_invalid_show = true;
    if (options.label_invalid_precision) fields.label_invalid_precision = true;
    if (options.label_invalid_precision && options.label_precision_key) fields.label_precision_key = options.label_precision_key;
    if (options.label_unsupported_unit) fields.label_unsupported_unit = true;
    return fields;
  }
  function isInvalidMarkerDirection(value) {
    return value !== void 0 && !["inward", "outward"].includes(
      typeof value === "string" ? value.trim().toLowerCase() : ""
    );
  }
  function normalizeTargetMarkerConfig(entityConfig, cardConfig) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I;
    const cardTarget = cardConfig == null ? void 0 : cardConfig.target_marker;
    const rawTarget = entityConfig == null ? void 0 : entityConfig.target;
    const legacyCardTarget = (cardConfig == null ? void 0 : cardConfig.target) && typeof cardConfig.target === "object" && !Array.isArray(cardConfig.target) ? null : (_a = cardConfig == null ? void 0 : cardConfig.target) != null ? _a : null;
    const inheritedTarget = cardTarget ? {
      ...cardTarget,
      shape: normalizeTargetMarkerShape(cardTarget.shape),
      direction: normalizeMarkerDirection(cardTarget.direction)
    } : {
      enabled: null,
      source: normalizeResolvableValue(null, null),
      color: (_b = cardConfig == null ? void 0 : cardConfig.target_color) != null ? _b : "#888",
      show_label: (_c = cardConfig == null ? void 0 : cardConfig.show_target_label) != null ? _c : false,
      ...builtinMarkerLabelFields(normalizeMarkerLabelConfig((_d = cardConfig == null ? void 0 : cardConfig.target) == null ? void 0 : _d.label)),
      label_decimal: (_j = (_i = (_f = (_e = cardConfig == null ? void 0 : cardConfig.target) == null ? void 0 : _e.label) == null ? void 0 : _f.precision) != null ? _i : (_h = (_g = cardConfig == null ? void 0 : cardConfig.target) == null ? void 0 : _g.label) == null ? void 0 : _h.decimal) != null ? _j : null,
      shape: "diamond",
      direction: "inward"
    };
    if (rawTarget && typeof rawTarget === "object" && !Array.isArray(rawTarget)) {
      const labelOptions = normalizeMarkerLabelConfig(rawTarget.label, inheritedTarget);
      const normalizedTarget2 = {
        enabled: (_l = (_k = normalizeOptionalEnabled(rawTarget.enabled)) != null ? _k : inheritedTarget.enabled) != null ? _l : null,
        source: normalizeStructuredResolvableValue(rawTarget.at, inheritedTarget.source, null, { allowPercent: true }),
        color: (_n = (_m = rawTarget.color) != null ? _m : entityConfig.target_color) != null ? _n : inheritedTarget.color,
        show_label: (_q = (_p = (_o = rawTarget.label) == null ? void 0 : _o.show) != null ? _p : entityConfig.show_target_label) != null ? _q : inheritedTarget.show_label,
        shape: Object.prototype.hasOwnProperty.call(rawTarget, "shape") ? normalizeTargetMarkerShape(rawTarget.shape) : inheritedTarget.shape,
        direction: Object.prototype.hasOwnProperty.call(rawTarget, "direction") ? normalizeMarkerDirection(rawTarget.direction) : inheritedTarget.direction,
        ...isInvalidMarkerDirection(rawTarget.direction) ? { direction_invalid: true } : {},
        ...builtinMarkerLabelFields(labelOptions)
      };
      const labelDecimal2 = labelOptions.label_precision;
      if (labelDecimal2 !== null && labelDecimal2 !== void 0) {
        normalizedTarget2.label_decimal = labelDecimal2;
        normalizedTarget2.label_precision = labelDecimal2;
      }
      return normalizedTarget2;
    }
    const value = (_v = (_u = (_s = entityConfig.target) != null ? _s : (_r = inheritedTarget.source) == null ? void 0 : _r.fixed) != null ? _u : (_t = inheritedTarget.source) == null ? void 0 : _t.value) != null ? _v : legacyCardTarget;
    const entity = (_z = (_y = (_x = entityConfig.target_entity) != null ? _x : (_w = inheritedTarget.source) == null ? void 0 : _w.entity) != null ? _y : cardConfig == null ? void 0 : cardConfig.target_entity) != null ? _z : null;
    const percent = entityConfig.target === void 0 && entityConfig.target_entity === void 0 ? (_B = (_A = inheritedTarget.source) == null ? void 0 : _A.percent) != null ? _B : null : null;
    const normalizedTarget = {
      enabled: (_C = inheritedTarget.enabled) != null ? _C : null,
      source: normalizeResolvableValue(value, entity, percent),
      color: (_F = (_E = (_D = entityConfig.target_color) != null ? _D : inheritedTarget.color) != null ? _E : cardConfig == null ? void 0 : cardConfig.target_color) != null ? _F : "#888",
      show_label: (_I = (_H = (_G = entityConfig.show_target_label) != null ? _G : inheritedTarget.show_label) != null ? _H : cardConfig == null ? void 0 : cardConfig.show_target_label) != null ? _I : false,
      shape: inheritedTarget.shape,
      direction: inheritedTarget.direction,
      ...builtinMarkerLabelFields(inheritedTarget)
    };
    const labelDecimal = normalizedTarget.label_precision;
    if (labelDecimal !== null && labelDecimal !== void 0) {
      normalizedTarget.label_decimal = labelDecimal;
    }
    return normalizedTarget;
  }
  function getRawExtremumConfig(config, key) {
    const value = config == null ? void 0 : config[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
    const markerValue = config == null ? void 0 : config[`${key}_marker`];
    return markerValue && typeof markerValue === "object" && !Array.isArray(markerValue) ? markerValue : null;
  }
  function normalizeLabelConfig(rawConfig, inheritedConfig) {
    var _a, _b, _c;
    const rawLabel = rawConfig == null ? void 0 : rawConfig.label;
    const hasRawLabel = rawLabel && typeof rawLabel === "object" && !Array.isArray(rawLabel);
    const options = normalizeMarkerLabelConfig(rawLabel, inheritedConfig);
    return {
      show: hasRawLabel && typeof rawLabel.show === "boolean" ? rawLabel.show : (_a = inheritedConfig.show_label) != null ? _a : false,
      text: options.label_text,
      invalidShow: options.label_invalid_show,
      showValue: options.label_show_value,
      showUnit: options.label_show_unit,
      precision: options.label_invalid_precision ? null : (_c = (_b = options.label_precision) != null ? _b : inheritedConfig.label_decimal) != null ? _c : null,
      invalidText: options.label_invalid_text,
      invalidShowValue: options.label_invalid_show_value,
      invalidShowUnit: options.label_invalid_show_unit,
      invalidPrecision: options.label_invalid_precision,
      precisionKey: options.label_precision_key,
      unsupportedUnit: options.label_unsupported_unit
    };
  }
  function normalizeExtremumMarkerConfig(entityConfig, cardConfig, key, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const { legacy = false, defaultColor = "#888888" } = options;
    const cardMarker = cardConfig == null ? void 0 : cardConfig[`${key}_marker`];
    const rawMarker = getRawExtremumConfig(entityConfig, key);
    const inherited = cardMarker != null ? cardMarker : {
      show: legacy ? (_a = cardConfig == null ? void 0 : cardConfig.show_peak) != null ? _a : false : false,
      color: legacy ? (_b = cardConfig == null ? void 0 : cardConfig.peak_color) != null ? _b : defaultColor : defaultColor,
      show_label: false,
      label_decimal: null,
      label_text: null,
      label_show_value: true,
      label_show_unit: true,
      label_precision: null,
      reset: { kind: "never" },
      direction: "inward"
    };
    const hasReset = rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, "reset");
    const rawReset = hasReset ? rawMarker.reset : void 0;
    const reset = hasReset ? normalizeReset(rawReset) : (_c = inherited.reset) != null ? _c : { kind: "never" };
    const rawLabel = rawMarker == null ? void 0 : rawMarker.label;
    const label = normalizeLabelConfig(rawMarker, inherited);
    const normalized = {
      show: (_f = (_e = (_d = rawMarker == null ? void 0 : rawMarker.enabled) != null ? _d : legacy ? entityConfig.show_peak : void 0) != null ? _e : inherited.show) != null ? _f : false,
      color: (_i = (_h = (_g = rawMarker == null ? void 0 : rawMarker.color) != null ? _g : legacy ? entityConfig.peak_color : void 0) != null ? _h : inherited.color) != null ? _i : defaultColor,
      direction: rawMarker && Object.prototype.hasOwnProperty.call(rawMarker, "direction") ? normalizeMarkerDirection(rawMarker.direction) : normalizeMarkerDirection(inherited.direction),
      ...isInvalidMarkerDirection(rawMarker == null ? void 0 : rawMarker.direction) ? { direction_invalid: true } : {}
    };
    const inheritedAdvanced = cardMarker && (Object.prototype.hasOwnProperty.call(cardMarker, "show_label") || Object.prototype.hasOwnProperty.call(cardMarker, "label_decimal") || Object.prototype.hasOwnProperty.call(cardMarker, "label_text") || Object.prototype.hasOwnProperty.call(cardMarker, "label_show_value") || Object.prototype.hasOwnProperty.call(cardMarker, "label_show_unit") || Object.prototype.hasOwnProperty.call(cardMarker, "label_precision") || Object.prototype.hasOwnProperty.call(cardMarker, "reset"));
    const hasAdvancedConfig = key === "floor" || hasReset || rawLabel !== void 0 || inheritedAdvanced;
    if (hasAdvancedConfig) {
      normalized.show_label = label.show;
      normalized.label_decimal = label.precision;
      normalized.reset = reset;
    }
    Object.assign(normalized, builtinMarkerLabelFields({
      label_text: label.text,
      label_show_value: label.showValue === true ? void 0 : label.showValue,
      label_show_unit: label.showUnit === true ? void 0 : label.showUnit,
      label_precision: label.precision,
      label_invalid_text: label.invalidText,
      label_invalid_show: label.invalidShow,
      label_invalid_show_value: label.invalidShowValue,
      label_invalid_show_unit: label.invalidShowUnit,
      label_invalid_precision: label.invalidPrecision,
      label_precision_key: label.precisionKey,
      label_unsupported_unit: label.unsupportedUnit
    }));
    if (hasReset && !isValidReset(rawReset)) {
      normalized.reset_invalid = true;
    }
    return normalized;
  }
  function normalizePeakMarkerConfig(entityConfig, cardConfig) {
    return normalizeExtremumMarkerConfig(entityConfig, cardConfig, "peak", { legacy: true, defaultColor: "#888888" });
  }
  function normalizeFloorMarkerConfig(entityConfig, cardConfig) {
    return normalizeExtremumMarkerConfig(entityConfig, cardConfig, "floor", { defaultColor: "#888888" });
  }
  function normalizeEntityConfig(entityConfig, cardConfig) {
    var _a, _b, _c;
    const normalizedEntity = {
      ...entityConfig,
      _normalized: true,
      entity: entityConfig.entity,
      name: (_a = entityConfig.name) != null ? _a : null,
      icon: entityConfig.icon
    };
    normalizedEntity.layout = normalizeLayoutConfig(entityConfig, cardConfig);
    normalizedEntity.scale = normalizeScaleConfig(entityConfig, cardConfig);
    normalizedEntity.bar = normalizeBarConfig(entityConfig, cardConfig, {
      scopeExplicitness: getPaintExplicitness(entityConfig),
      inheritedExplicitness: (_b = cardConfig == null ? void 0 : cardConfig[PAINT_EXPLICITNESS]) != null ? _b : getPaintExplicitness(cardConfig),
      isCardScope: false
    });
    normalizedEntity.baseline = normalizeBaselineConfig(entityConfig, cardConfig);
    normalizedEntity.formatting = normalizeFormattingConfig(entityConfig, cardConfig);
    normalizedEntity.target_marker = normalizeTargetMarkerConfig(entityConfig, cardConfig);
    normalizedEntity.peak_marker = normalizePeakMarkerConfig(entityConfig, cardConfig);
    normalizedEntity.floor_marker = normalizeFloorMarkerConfig(entityConfig, cardConfig);
    const normalizedMarkers = entityConfig.markers === void 0 ? {
      markers: applyGenericMarkerCapacity((_c = cardConfig == null ? void 0 : cardConfig.generic_markers) != null ? _c : [], normalizedEntity),
      invalidList: (cardConfig == null ? void 0 : cardConfig.generic_markers_invalid) === true
    } : normalizeGenericMarkerList(entityConfig.markers, normalizedEntity);
    normalizedEntity.generic_markers = normalizedMarkers.markers;
    normalizedEntity.generic_markers_invalid = normalizedMarkers.invalidList;
    normalizedEntity.min = normalizedEntity.scale.min.fixed;
    normalizedEntity.min_entity = normalizedEntity.scale.min.entity;
    normalizedEntity.max = normalizedEntity.scale.max.fixed;
    normalizedEntity.max_entity = normalizedEntity.scale.max.entity;
    normalizedEntity.height = normalizedEntity.layout.height;
    normalizedEntity.label_position = normalizedEntity.layout.label.position;
    normalizedEntity.label_width = normalizedEntity.layout.label.width;
    normalizedEntity.color_mode = normalizedEntity.bar.color_mode;
    normalizedEntity.fill_style = normalizedEntity.bar.fill_style;
    normalizedEntity.solid_fill = normalizedEntity.bar.solid_fill;
    normalizedEntity.color = normalizedEntity.bar.color;
    normalizedEntity.gradient_stops = normalizedEntity.bar.gradient_stops;
    normalizedEntity.severity = normalizedEntity.bar.severity;
    normalizedEntity.animated = normalizedEntity.bar.animated;
    normalizedEntity.above_target_color = normalizedEntity.bar.above_target_color;
    normalizedEntity.decimal = normalizedEntity.formatting.decimal;
    normalizedEntity.unit = normalizedEntity.formatting.unit;
    normalizedEntity.target = normalizedEntity.target_marker.source.fixed;
    normalizedEntity.target_entity = normalizedEntity.target_marker.source.entity;
    normalizedEntity.target_color = normalizedEntity.target_marker.color;
    normalizedEntity.show_target_label = normalizedEntity.target_marker.show_label;
    normalizedEntity.show_peak = normalizedEntity.peak_marker.show;
    normalizedEntity.peak_color = normalizedEntity.peak_marker.color;
    return normalizedEntity;
  }
  function normalizeCardConfig(rawConfig) {
    var _a;
    const cardPaintExplicitness = getPaintExplicitness(rawConfig);
    const baseConfig = {
      title: "",
      label_position: "left",
      color_mode: "severity",
      color: "#4a9eff",
      animated: true,
      show_peak: false,
      peak_color: "#888888",
      target: null,
      target_entity: null,
      target_color: "#888",
      show_target_label: false,
      above_target_color: null,
      baseline: null,
      decimal: null,
      gradient_stops: null,
      min: 0,
      min_entity: null,
      max: 100,
      max_entity: null,
      height: 38,
      label_width: 100,
      severity: [
        { from: 0, to: 33, color: "#4CAF50" },
        { from: 33, to: 75, color: "#FF9800" },
        { from: 75, to: 100, color: "#F44336" }
      ],
      ...rawConfig
    };
    baseConfig._height_explicit = ((_a = rawConfig == null ? void 0 : rawConfig.layout) == null ? void 0 : _a.height) !== void 0 || (rawConfig == null ? void 0 : rawConfig.height) !== void 0;
    if (baseConfig.entity && !baseConfig.entities) {
      baseConfig.entities = [{
        entity: baseConfig.entity,
        ...baseConfig.name !== void 0 ? { name: baseConfig.name } : {}
      }];
    }
    baseConfig.entities = baseConfig.entities.map(
      (e) => typeof e === "string" ? { entity: e } : e
    );
    const normalizedCard = {
      ...baseConfig,
      _normalized: true
    };
    Object.defineProperty(normalizedCard, PAINT_EXPLICITNESS, {
      value: cardPaintExplicitness,
      enumerable: false
    });
    normalizedCard.layout = normalizeLayoutConfig(baseConfig, null);
    normalizedCard.scale = normalizeScaleConfig(rawConfig, null);
    normalizedCard.bar = normalizeBarConfig(baseConfig, null, {
      scopeExplicitness: cardPaintExplicitness,
      inheritedExplicitness: null,
      isCardScope: true
    });
    normalizedCard.baseline = normalizeBaselineConfig(baseConfig, null);
    normalizedCard.formatting = normalizeFormattingConfig(baseConfig, null);
    normalizedCard.target_marker = normalizeTargetMarkerConfig(baseConfig, null);
    normalizedCard.peak_marker = normalizePeakMarkerConfig(baseConfig, null);
    normalizedCard.floor_marker = normalizeFloorMarkerConfig(baseConfig, null);
    const normalizedMarkers = normalizeGenericMarkerList(baseConfig.markers, normalizedCard);
    normalizedCard.generic_markers = normalizedMarkers.markers;
    normalizedCard.generic_markers_invalid = normalizedMarkers.invalidList;
    normalizedCard.entities = baseConfig.entities.map(
      (entityCfg) => normalizeEntityConfig(entityCfg, normalizedCard)
    );
    return normalizedCard;
  }
  var PAINT_EXPLICITNESS, EXPLICIT_SEGMENT_SPACE;
  var init_normalize = __esm({
    "src/config/normalize.js"() {
      init_extrema();
      PAINT_EXPLICITNESS = /* @__PURE__ */ Symbol("sbcp.paintExplicitness");
      EXPLICIT_SEGMENT_SPACE = /* @__PURE__ */ Symbol("sbcp.explicitSegmentSpace");
    }
  });

  // src/config/resolve.js
  function getEntityNumericValue(hass, entityId) {
    var _a;
    if (!entityId || !((_a = hass == null ? void 0 : hass.states) == null ? void 0 : _a[entityId])) return null;
    const raw = hass.states[entityId].state;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  }
  function getNumericValue(hass, value, entityId = null) {
    const entityValue = getEntityNumericValue(hass, entityId);
    if (entityValue !== null) return entityValue;
    if (value === null || value === void 0 || value === "") return null;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : null;
  }
  function resolvePercentValue(percent, minValue, maxValue) {
    if (!Number.isFinite(percent)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    return safeMin + percent / 100 * (safeMax - safeMin);
  }
  function getNormalizedResolvableNumericValue(hass, resolvable, minValue = null, maxValue = null) {
    var _a;
    if (!resolvable) return null;
    const entityValue = getEntityNumericValue(hass, resolvable.entity);
    if (entityValue !== null) return entityValue;
    const fixedValue = getNumericValue(hass, (_a = resolvable.fixed) != null ? _a : resolvable.value, null);
    if (fixedValue !== null) return fixedValue;
    if (Number.isFinite(resolvable.percent)) {
      return resolvePercentValue(resolvable.percent, minValue, maxValue);
    }
    return null;
  }
  function getResolvedScale(hass, scale, previousScale = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const isValid = (bounds) => Number.isFinite(bounds == null ? void 0 : bounds.min) && Number.isFinite(bounds == null ? void 0 : bounds.max) && bounds.min < bounds.max;
    const fixed = {
      min: getNumericValue(null, (_c = (_a = scale == null ? void 0 : scale.min) == null ? void 0 : _a.fixed) != null ? _c : (_b = scale == null ? void 0 : scale.min) == null ? void 0 : _b.value),
      max: getNumericValue(null, (_f = (_d = scale == null ? void 0 : scale.max) == null ? void 0 : _d.fixed) != null ? _f : (_e = scale == null ? void 0 : scale.max) == null ? void 0 : _e.value)
    };
    if (((_g = scale == null ? void 0 : scale.min) == null ? void 0 : _g.entity) && ((_h = scale == null ? void 0 : scale.max) == null ? void 0 : _h.entity)) {
      const dynamic = {
        min: getEntityNumericValue(hass, scale.min.entity),
        max: getEntityNumericValue(hass, scale.max.entity)
      };
      if (isValid(dynamic)) return dynamic;
      if (Number.isFinite(dynamic.min) && Number.isFinite(dynamic.max) && isValid(previousScale)) {
        return previousScale;
      }
      return scale.min.fixed_explicit !== false && scale.max.fixed_explicit !== false && isValid(fixed) ? fixed : { min: 0, max: 100 };
    }
    const resolved = {
      min: (_i = getNormalizedResolvableNumericValue(hass, scale == null ? void 0 : scale.min)) != null ? _i : 0,
      max: (_j = getNormalizedResolvableNumericValue(hass, scale == null ? void 0 : scale.max)) != null ? _j : 100
    };
    if (isValid(resolved)) return resolved;
    const fallback = {
      min: (_k = fixed.min) != null ? _k : 0,
      max: (_l = fixed.max) != null ? _l : 100
    };
    return isValid(fallback) ? fallback : { min: 0, max: 100 };
  }
  var init_resolve = __esm({
    "src/config/resolve.js"() {
      init_normalize();
    }
  });

  // src/config/validate.js
  function createDiagnostic(code, message, path, entity = null) {
    return { code, message, path, entity };
  }
  function getStaticFixedValue(resolvable) {
    var _a;
    if (!resolvable || resolvable.entity || Number.isFinite(resolvable.percent)) {
      return null;
    }
    return getFiniteNumber((_a = resolvable.fixed) != null ? _a : resolvable.value);
  }
  function addWarning(diagnostics, code, message, path, entity = null) {
    diagnostics.warnings.push(createDiagnostic(code, message, path, entity));
  }
  function validateScaleBounds(diagnostics, scale, path, entity = null) {
    var _a, _b;
    if (((_a = scale == null ? void 0 : scale.min) == null ? void 0 : _a.entity) && ((_b = scale == null ? void 0 : scale.max) == null ? void 0 : _b.entity)) {
      const hasFixed = (bound) => {
        var _a2, _b2;
        return bound.fixed_explicit !== false && ((_a2 = bound.fixed) != null ? _a2 : bound.value) !== null && ((_b2 = bound.fixed) != null ? _b2 : bound.value) !== void 0;
      };
      if (hasFixed(scale.min) !== hasFixed(scale.max)) {
        addWarning(
          diagnostics,
          "scale.orphan_fixed_fallback",
          "Both dynamic scale bounds require a complete fixed fallback pair. The single fixed fallback will not be used if the dynamic pair becomes unavailable.",
          `${path}.scale`,
          entity
        );
      }
    }
    const min = getStaticFixedValue(scale == null ? void 0 : scale.min);
    const max = getStaticFixedValue(scale == null ? void 0 : scale.max);
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      addWarning(diagnostics, "scale.min_gt_max", "Scale minimum is greater than maximum.", path, entity);
    }
    return { min, max };
  }
  function validateTargetRange(diagnostics, config, scaleBounds, path, entity = null) {
    var _a;
    const target = getStaticFixedValue((_a = config == null ? void 0 : config.target_marker) == null ? void 0 : _a.source);
    if (!Number.isFinite(target)) return;
    const { min, max } = scaleBounds;
    if (Number.isFinite(min) && Number.isFinite(max) && (target < min || target > max)) {
      addWarning(diagnostics, "target.outside_scale", "Fixed target value is outside the fixed scale range.", path, entity);
    }
  }
  function validateBaselineRange(diagnostics, config, scaleBounds, path, entity = null) {
    var _a;
    const baseline = getStaticFixedValue((_a = config == null ? void 0 : config.baseline) == null ? void 0 : _a.at);
    if (!Number.isFinite(baseline)) return;
    const { min, max } = scaleBounds;
    if (Number.isFinite(min) && Number.isFinite(max) && (baseline < min || baseline > max)) {
      addWarning(diagnostics, "baseline.outside_scale", "Fixed baseline value is outside the fixed scale range.", path, entity);
    }
  }
  function hasConfiguredResolvableValue(resolvable) {
    var _a;
    return !!resolvable && (Number.isFinite(getFiniteNumber((_a = resolvable.fixed) != null ? _a : resolvable.value)) || Number.isFinite(resolvable.percent) || !!resolvable.entity);
  }
  function validateBaselineSuppressesNeedle(diagnostics, config, path, entity = null) {
    var _a, _b, _c, _d;
    const needleEnabled = ((_b = (_a = config == null ? void 0 : config.bar) == null ? void 0 : _a.needle) == null ? void 0 : _b.show) === true;
    const baselineConfigured = ((_c = config == null ? void 0 : config.baseline) == null ? void 0 : _c.enabled) !== false && hasConfiguredResolvableValue((_d = config == null ? void 0 : config.baseline) == null ? void 0 : _d.at);
    if (needleEnabled && baselineConfigured) {
      addWarning(
        diagnostics,
        "baseline-suppresses-needle",
        "Baseline rendering suppresses the needle marker.",
        path,
        entity
      );
    }
  }
  function validateExtremumReset(diagnostics, config, path, entity = null) {
    var _a;
    for (const marker of ["peak_marker", "floor_marker"]) {
      if ((_a = config == null ? void 0 : config[marker]) == null ? void 0 : _a.reset_invalid) {
        addWarning(
          diagnostics,
          `${marker}.invalid_reset`,
          "Invalid marker reset; using never.",
          `${path}.${marker}.reset`,
          entity
        );
      }
    }
  }
  function validateMarkerDirections(diagnostics, config, path, entity = null) {
    var _a;
    for (const marker of ["target_marker", "peak_marker", "floor_marker"]) {
      if ((_a = config == null ? void 0 : config[marker]) == null ? void 0 : _a.direction_invalid) {
        addWarning(
          diagnostics,
          `${marker}.invalid_direction`,
          "Invalid marker direction; using inward.",
          `${path}.${marker === "target_marker" ? "target" : marker.replace("_marker", "")}.direction`,
          entity
        );
      }
    }
  }
  function validateBuiltinMarkerLabels(diagnostics, config, path, entity = null) {
    var _a;
    for (const [key, publicKey] of [["target_marker", "target"], ["peak_marker", "peak"], ["floor_marker", "floor"]]) {
      const marker = config == null ? void 0 : config[key];
      const labelPath = `${path}.${publicKey}.label`;
      if (marker == null ? void 0 : marker.label_invalid_show) addWarning(diagnostics, "markers.invalid_label_show", "Marker label show must be a boolean; using the existing fallback.", `${labelPath}.show`, entity);
      if (marker == null ? void 0 : marker.label_invalid_text) addWarning(diagnostics, "markers.invalid_label_text", "Marker label text must be a string; ignoring it.", `${labelPath}.text`, entity);
      if (marker == null ? void 0 : marker.label_invalid_show_value) addWarning(diagnostics, "markers.invalid_label_show_value", "Marker label show_value must be a boolean; using the inherited or default value.", `${labelPath}.show_value`, entity);
      if (marker == null ? void 0 : marker.label_invalid_show_unit) addWarning(diagnostics, "markers.invalid_label_show_unit", "Marker label show_unit must be a boolean; using the inherited or default value.", `${labelPath}.show_unit`, entity);
      if (marker == null ? void 0 : marker.label_invalid_precision) addWarning(diagnostics, "markers.invalid_label_precision", "Marker label precision must be a non-negative integer; using the inherited or row precision.", `${labelPath}.${(_a = marker.label_precision_key) != null ? _a : "precision"}`, entity);
      if (marker == null ? void 0 : marker.label_unsupported_unit) addWarning(diagnostics, "markers.unsupported_label_unit", "Marker label unit is no longer supported; use show_unit instead.", `${labelPath}.unit`, entity);
    }
  }
  function validateGenericMarkers(diagnostics, markers, invalidList, path, entity = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (invalidList) {
      addWarning(diagnostics, "markers.invalid_list", "Markers must be a list; ignoring the malformed value.", path, entity);
    }
    for (const marker of markers != null ? markers : []) {
      const markerPath = `${path}[${marker.index}]`;
      if (marker.malformed) {
        addWarning(diagnostics, "markers.invalid_item", "Marker must be an object; ignoring this item.", markerPath, entity);
        continue;
      }
      if (marker.invalidSource && !marker.invalidPercentage && !marker.unsupportedPercentField) {
        addWarning(diagnostics, "markers.invalid_source", "Marker requires a valid fixed value, percentage, or entity source.", `${markerPath}.at`, entity);
      }
      if (marker.invalidPercentage) {
        addWarning(diagnostics, "markers.invalid_percentage", "Marker percentage must be between 0 and 100 inclusive.", `${markerPath}.at`, entity);
      }
      if (marker.unsupportedPercentField) {
        addWarning(diagnostics, "markers.invalid_source", 'Use a percentage string such as "35%" instead of an at.percent field.', `${markerPath}.at`, entity);
      }
      if (marker.invalidLane) {
        addWarning(diagnostics, "markers.invalid_lane", "Marker lane must be above or below; ignoring this marker.", `${markerPath}.lane`, entity);
      }
      if (marker.invalidShape) {
        addWarning(diagnostics, "markers.invalid_shape", "Invalid marker shape; using circle.", `${markerPath}.shape`, entity);
      }
      if (marker.invalidDirection) {
        addWarning(diagnostics, "markers.invalid_direction", "Invalid marker direction; using inward.", `${markerPath}.direction`, entity);
      }
      if (marker.invalidShowMarker) addWarning(diagnostics, "markers.invalid_show_marker", "Marker show_marker must be a boolean; using true.", `${markerPath}.show_marker`, entity);
      if ((_a = marker.label) == null ? void 0 : _a.invalidEntity) addWarning(diagnostics, "markers.invalid_label_entity", "Marker label entity must be a valid entity ID; ignoring it.", `${markerPath}.label.entity`, entity);
      if ((_b = marker.label) == null ? void 0 : _b.invalidShow) addWarning(diagnostics, "markers.invalid_label_show", "Marker label show must be a boolean; using the existing fallback.", `${markerPath}.label.show`, entity);
      if ((_c = marker.label) == null ? void 0 : _c.invalidText) addWarning(diagnostics, "markers.invalid_label_text", "Marker label text must be a string; ignoring it.", `${markerPath}.label.text`, entity);
      if ((_d = marker.label) == null ? void 0 : _d.invalidShowValue) addWarning(diagnostics, "markers.invalid_label_show_value", "Marker label show_value must be a boolean; using the inherited or default value.", `${markerPath}.label.show_value`, entity);
      if ((_e = marker.label) == null ? void 0 : _e.invalidShowUnit) addWarning(diagnostics, "markers.invalid_label_show_unit", "Marker label show_unit must be a boolean; using the inherited or default value.", `${markerPath}.label.show_unit`, entity);
      if ((_f = marker.label) == null ? void 0 : _f.invalidPrecision) addWarning(diagnostics, "markers.invalid_label_precision", "Marker label precision must be a non-negative integer; using the inherited or row precision.", `${markerPath}.label.${(_g = marker.label.invalidPrecisionKey) != null ? _g : "precision"}`, entity);
      if ((_h = marker.label) == null ? void 0 : _h.unsupportedUnit) addWarning(diagnostics, "markers.unsupported_label_unit", "Marker label unit is no longer supported; use show_unit instead.", `${markerPath}.label.unit`, entity);
      if (marker.valid && !marker.accepted) {
        addWarning(diagnostics, "markers.excess_capacity", "This marker is not rendered because its lane already has four markers.", markerPath, entity);
      }
    }
  }
  function getStaticSegmentBound(boundary) {
    var _a;
    if (!boundary || boundary.entity || Number.isFinite(boundary.percent)) return null;
    return getFiniteNumber((_a = boundary.fixed) != null ? _a : boundary.value);
  }
  function validateSegments(diagnostics, segments, scaleBounds, path, entity = null) {
    if (!Array.isArray(segments) || !segments.length) return;
    const staticSegments = [];
    const { min, max } = scaleBounds;
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const from = getStaticSegmentBound(segment == null ? void 0 : segment.from);
      const to = getStaticSegmentBound(segment == null ? void 0 : segment.to);
      const segmentPath = `${path}.segments[${index}]`;
      if ((segment == null ? void 0 : segment.invalidBoundary) === "entity") {
        addWarning(diagnostics, "segments.unsupported_entity_boundary", "Entity-backed segment boundaries are not supported; ignoring this segment.", segmentPath, entity);
        continue;
      }
      if ((segment == null ? void 0 : segment.invalidBoundary) === "malformed_percent") {
        addWarning(diagnostics, "segments.invalid_percentage", "Malformed percentage segment boundary; ignoring this segment.", segmentPath, entity);
        continue;
      }
      if (segment == null ? void 0 : segment.invalidBoundary) {
        addWarning(diagnostics, "segments.invalid_boundary", 'Segment boundary must be a numeric value or a percentage such as "35%"; ignoring this segment.', segmentPath, entity);
        continue;
      }
      if (Number.isFinite(from) && Number.isFinite(to) && from > to) {
        addWarning(diagnostics, "segments.from_gt_to", "Segment start is greater than segment end.", segmentPath, entity);
      }
      if (Number.isFinite(min) && Number.isFinite(max)) {
        if (Number.isFinite(from) && (from < min || from > max)) {
          addWarning(diagnostics, "segments.outside_scale", "Segment boundary is outside the fixed scale range.", segmentPath, entity);
        }
        if (Number.isFinite(to) && (to < min || to > max)) {
          addWarning(diagnostics, "segments.outside_scale", "Segment boundary is outside the fixed scale range.", segmentPath, entity);
        }
      }
      if (Number.isFinite(from) && Number.isFinite(to)) {
        staticSegments.push({ from, to, path: segmentPath });
      }
    }
    const sorted = [...staticSegments].sort((a, b) => a.from - b.from);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (current.from < previous.to) {
        addWarning(diagnostics, "segments.overlap", "Fixed segments overlap.", current.path, entity);
      }
    }
  }
  function validateGradientStops(diagnostics, stops, path, entity = null) {
    var _a;
    if (!Array.isArray(stops)) return;
    const seenPositions = /* @__PURE__ */ new Set();
    for (let index = 0; index < stops.length; index += 1) {
      const pos = getFiniteNumber((_a = stops[index]) == null ? void 0 : _a.pos);
      const stopPath = `${path}.gradient_stops[${index}]`;
      if (Number.isFinite(pos) && (pos < 0 || pos > 100)) {
        addWarning(
          diagnostics,
          "gradient_stops.outside_range",
          "Gradient stop position is outside 0..100.",
          stopPath,
          entity
        );
      }
      if (Number.isFinite(pos)) {
        if (seenPositions.has(pos)) {
          addWarning(
            diagnostics,
            "duplicate-gradient-stop-position",
            "Multiple gradient stops use the same position value.",
            stopPath,
            entity
          );
        } else {
          seenPositions.add(pos);
        }
      }
    }
  }
  function validateConfigScope(diagnostics, config, path, entity = null) {
    var _a, _b;
    const scaleBounds = validateScaleBounds(diagnostics, config == null ? void 0 : config.scale, path, entity);
    validateTargetRange(diagnostics, config, scaleBounds, path, entity);
    validateBaselineRange(diagnostics, config, scaleBounds, path, entity);
    validateBaselineSuppressesNeedle(diagnostics, config, path, entity);
    validateExtremumReset(diagnostics, config, path, entity);
    validateMarkerDirections(diagnostics, config, path, entity);
    validateBuiltinMarkerLabels(diagnostics, config, path, entity);
    validateSegments(diagnostics, (_a = config == null ? void 0 : config.bar) == null ? void 0 : _a.segments, scaleBounds, `${path}.bar`, entity);
    validateGradientStops(diagnostics, (_b = config == null ? void 0 : config.bar) == null ? void 0 : _b.gradient_stops, `${path}.bar`, entity);
  }
  function validateNormalizedConfig(config) {
    var _a, _b;
    const diagnostics = {
      warnings: [],
      errors: []
    };
    if (!config || typeof config !== "object") {
      return diagnostics;
    }
    validateConfigScope(diagnostics, config, "card");
    validateGenericMarkers(diagnostics, config.generic_markers, config.generic_markers_invalid, "markers");
    const seenEntities = /* @__PURE__ */ new Set();
    const entities = Array.isArray(config.entities) ? config.entities : [];
    for (let index = 0; index < entities.length; index += 1) {
      const entityConfig = entities[index];
      const entityId = (_a = entityConfig == null ? void 0 : entityConfig.entity) != null ? _a : null;
      const path = `entities[${index}]`;
      if (!entityId) {
        addWarning(diagnostics, "entities.missing_entity", "Entity row is missing an entity id.", path, null);
        continue;
      }
      if (seenEntities.has(entityId)) {
        addWarning(diagnostics, "entities.duplicate_entity", "Duplicate entity id in the same card config.", path, entityId);
      } else {
        seenEntities.add(entityId);
      }
      validateConfigScope(diagnostics, entityConfig, path, entityId);
      if (Object.prototype.hasOwnProperty.call(entityConfig, "markers")) {
        validateGenericMarkers(
          diagnostics,
          entityConfig.generic_markers,
          entityConfig.generic_markers_invalid,
          `${path}.markers`,
          entityId
        );
      } else {
        const inheritedOverflow = ((_b = entityConfig.generic_markers) != null ? _b : []).filter(
          (marker) => {
            var _a2, _b2;
            return marker.valid && !marker.accepted && ((_b2 = (_a2 = config.generic_markers) == null ? void 0 : _a2[marker.index]) == null ? void 0 : _b2.accepted) === true;
          }
        );
        if (inheritedOverflow.length) {
          validateGenericMarkers(diagnostics, inheritedOverflow, false, `${path}.markers`, entityId);
        }
      }
    }
    return diagnostics;
  }
  var init_validate = __esm({
    "src/config/validate.js"() {
      init_normalize();
    }
  });

  // src/utils/format.js
  function formatNumericDisplay(rawVal, decimal = null) {
    if (!Number.isFinite(rawVal)) return String(rawVal);
    if (decimal !== null) {
      return rawVal.toLocaleString(void 0, {
        minimumFractionDigits: decimal,
        maximumFractionDigits: decimal
      });
    }
    return rawVal.toLocaleString();
  }
  function isTightUnit(unit) {
    return ["h", "m", "s"].includes(String(unit || "").trim());
  }
  function formatDisplayWithUnit(display, unit) {
    if (!unit) return String(display);
    const cleanUnit = String(unit);
    return `${display}${isTightUnit(cleanUnit) ? "" : " "}${cleanUnit}`;
  }
  function createNumericPresentation(value, unit, decimal = null) {
    const number = formatNumericDisplay(value, decimal);
    const cleanUnit = unit ? String(unit) : "";
    return {
      value,
      number,
      unit: cleanUnit,
      text: formatDisplayWithUnit(number, cleanUnit)
    };
  }
  function createMarkerLabelPresentation(value, unit, precision = null, options = {}) {
    const semanticText = typeof options.text === "string" ? options.text : "";
    const number = options.showValue === false || value === null || value === void 0 || value === "" ? "" : Number.isFinite(value) ? formatNumericDisplay(value, precision) : String(value);
    const cleanUnit = options.showUnit === false ? "" : String(unit != null ? unit : "").trim();
    const text = [semanticText, number, cleanUnit].filter(Boolean).join(" ");
    return {
      value: Number.isFinite(value) ? value : null,
      semanticText,
      number,
      unit: cleanUnit,
      showValue: options.showValue !== false,
      showUnit: options.showUnit !== false,
      text
    };
  }
  function createTextPresentation(text) {
    const value = String(text);
    return {
      value: null,
      number: value,
      unit: "",
      text: value
    };
  }
  var init_format = __esm({
    "src/utils/format.js"() {
    }
  });

  // src/view-model/marker-view-model.js
  function hasConfiguredSource(source) {
    if (!source) return false;
    return source.entity !== null && source.entity !== void 0 && source.entity !== "" || source.fixed !== null && source.fixed !== void 0 && source.fixed !== "" || Number.isFinite(source.percent);
  }
  function normalizeMarkerShape(value, fallback = "circle") {
    return MARKER_SHAPES.has(value) ? value : fallback;
  }
  function createMarkerModel({
    id,
    type,
    value = null,
    position = null,
    lane,
    visible = false,
    color = null,
    label = null,
    labelVisible = false,
    shape = "circle",
    direction = "inward",
    showMarker = true
  }) {
    return {
      id,
      type,
      value,
      position,
      lane,
      visible: visible === true,
      color,
      label,
      labelVisible: labelVisible === true,
      shape: normalizeMarkerShape(shape),
      direction,
      showMarker: showMarker !== false
    };
  }
  function hasMarkerLabelContent(label) {
    return !!(typeof (label == null ? void 0 : label.text) === "string" && label.text.trim()) || (label == null ? void 0 : label.showValue) !== false || (label == null ? void 0 : label.showUnit) !== false;
  }
  function getMarkerLaneOccupancy(entityConfig) {
    var _a;
    const targetConfig = entityConfig == null ? void 0 : entityConfig.target_marker;
    const peakConfig = entityConfig == null ? void 0 : entityConfig.peak_marker;
    const floorConfig = entityConfig == null ? void 0 : entityConfig.floor_marker;
    const genericMarkers = ((_a = entityConfig == null ? void 0 : entityConfig.generic_markers) != null ? _a : []).filter((marker) => marker.accepted);
    return {
      below: (targetConfig == null ? void 0 : targetConfig.enabled) !== false && hasConfiguredSource(targetConfig == null ? void 0 : targetConfig.source) || (floorConfig == null ? void 0 : floorConfig.show) === true || genericMarkers.some((marker) => marker.lane === "below"),
      above: (peakConfig == null ? void 0 : peakConfig.show) === true || genericMarkers.some((marker) => marker.lane === "above")
    };
  }
  function getMarkerLabelLaneOccupancy(entityConfig) {
    var _a;
    const targetConfig = entityConfig == null ? void 0 : entityConfig.target_marker;
    const peakConfig = entityConfig == null ? void 0 : entityConfig.peak_marker;
    const floorConfig = entityConfig == null ? void 0 : entityConfig.floor_marker;
    const genericMarkers = ((_a = entityConfig == null ? void 0 : entityConfig.generic_markers) != null ? _a : []).filter((marker) => marker.accepted);
    return {
      below: (targetConfig == null ? void 0 : targetConfig.enabled) !== false && hasConfiguredSource(targetConfig == null ? void 0 : targetConfig.source) && (targetConfig == null ? void 0 : targetConfig.show_label) === true && hasMarkerLabelContent({ text: targetConfig.label_text, showValue: targetConfig.label_show_value, showUnit: targetConfig.label_show_unit }) || (floorConfig == null ? void 0 : floorConfig.show) === true && (floorConfig == null ? void 0 : floorConfig.show_label) === true && hasMarkerLabelContent({ text: floorConfig.label_text, showValue: floorConfig.label_show_value, showUnit: floorConfig.label_show_unit }) || genericMarkers.some((marker) => {
        var _a2;
        return marker.lane === "below" && ((_a2 = marker.label) == null ? void 0 : _a2.show) === true && hasMarkerLabelContent(marker.label);
      }),
      above: (peakConfig == null ? void 0 : peakConfig.show) === true && (peakConfig == null ? void 0 : peakConfig.show_label) === true && hasMarkerLabelContent({ text: peakConfig.label_text, showValue: peakConfig.label_show_value, showUnit: peakConfig.label_show_unit }) || genericMarkers.some((marker) => {
        var _a2;
        return marker.lane === "above" && ((_a2 = marker.label) == null ? void 0 : _a2.show) === true && hasMarkerLabelContent(marker.label);
      })
    };
  }
  function buildMarkerModels({
    entityConfig,
    targetValue = null,
    targetPosition = null,
    targetPresentation = null,
    targetLabelPresentation = null,
    targetVisible = Number.isFinite(targetPosition),
    peakValue = null,
    peakPosition = null,
    peakPresentation = null,
    peakLabelPresentation = null,
    peakVisible = Number.isFinite(peakPosition),
    floorValue = null,
    floorPosition = null,
    floorPresentation = null,
    floorLabelPresentation = null,
    floorVisible = Number.isFinite(floorPosition),
    genericMarkers = []
  }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const targetConfig = entityConfig == null ? void 0 : entityConfig.target_marker;
    const peakConfig = entityConfig == null ? void 0 : entityConfig.peak_marker;
    const floorConfig = entityConfig == null ? void 0 : entityConfig.floor_marker;
    const targetEnabled = (targetConfig == null ? void 0 : targetConfig.enabled) !== false;
    return [
      createMarkerModel({
        id: "target",
        type: "target",
        value: targetValue,
        position: targetPosition,
        lane: "below",
        visible: targetEnabled && targetVisible,
        color: (_a = targetConfig == null ? void 0 : targetConfig.color) != null ? _a : null,
        label: targetLabelPresentation != null ? targetLabelPresentation : targetPresentation,
        labelVisible: targetEnabled && (targetConfig == null ? void 0 : targetConfig.show_label) === true && hasMarkerLabelContent({ text: targetConfig.label_text, showValue: targetConfig.label_show_value, showUnit: targetConfig.label_show_unit }),
        shape: (_b = targetConfig == null ? void 0 : targetConfig.shape) != null ? _b : "diamond",
        direction: (_c = targetConfig == null ? void 0 : targetConfig.direction) != null ? _c : "inward"
      }),
      createMarkerModel({
        id: "floor",
        type: "floor",
        value: floorValue,
        position: floorPosition,
        lane: "below",
        visible: (floorConfig == null ? void 0 : floorConfig.show) === true && floorVisible,
        color: (_d = floorConfig == null ? void 0 : floorConfig.color) != null ? _d : null,
        label: floorLabelPresentation != null ? floorLabelPresentation : floorPresentation,
        labelVisible: (floorConfig == null ? void 0 : floorConfig.show) === true && (floorConfig == null ? void 0 : floorConfig.show_label) === true && hasMarkerLabelContent({ text: floorConfig.label_text, showValue: floorConfig.label_show_value, showUnit: floorConfig.label_show_unit }),
        shape: "triangle",
        direction: (_e = floorConfig == null ? void 0 : floorConfig.direction) != null ? _e : "inward"
      }),
      createMarkerModel({
        id: "peak",
        type: "peak",
        value: peakValue,
        position: peakPosition,
        lane: "above",
        visible: (peakConfig == null ? void 0 : peakConfig.show) === true && peakVisible,
        color: (_f = peakConfig == null ? void 0 : peakConfig.color) != null ? _f : null,
        label: peakLabelPresentation != null ? peakLabelPresentation : peakPresentation,
        labelVisible: (peakConfig == null ? void 0 : peakConfig.show) === true && (peakConfig == null ? void 0 : peakConfig.show_label) === true && hasMarkerLabelContent({ text: peakConfig.label_text, showValue: peakConfig.label_show_value, showUnit: peakConfig.label_show_unit }),
        shape: "triangle",
        direction: (_g = peakConfig == null ? void 0 : peakConfig.direction) != null ? _g : "inward"
      }),
      ...genericMarkers.map((marker) => createMarkerModel({
        id: marker.id,
        type: "generic",
        value: marker.value,
        position: marker.position,
        lane: marker.lane,
        visible: marker.visible,
        color: marker.color,
        label: marker.label,
        labelVisible: marker.labelVisible && hasMarkerLabelContent(marker.label),
        shape: marker.shape,
        direction: marker.direction,
        showMarker: marker.showMarker
      }))
    ];
  }
  var MARKER_SHAPES;
  var init_marker_view_model = __esm({
    "src/view-model/marker-view-model.js"() {
      MARKER_SHAPES = /* @__PURE__ */ new Set(["circle", "diamond", "triangle", "chevron", "arrow", "pin"]);
    }
  });

  // src/view-model/row-view-model.js
  function getDefaultEntityIcon(stateObj, entityId = "") {
    var _a, _b, _c;
    const deviceClass = String((_b = (_a = stateObj == null ? void 0 : stateObj.attributes) == null ? void 0 : _a.device_class) != null ? _b : "").trim();
    if (deviceClass) {
      const deviceClassIcons = {
        apparent_power: "mdi:flash",
        battery: "mdi:battery",
        carbon_dioxide: "mdi:molecule-co2",
        current: "mdi:current-ac",
        energy: "mdi:lightning-bolt",
        gas: "mdi:meter-gas",
        humidity: "mdi:water-percent",
        monetary: "mdi:cash",
        power: "mdi:flash",
        pressure: "mdi:gauge",
        temperature: "mdi:thermometer",
        voltage: "mdi:sine-wave",
        water: "mdi:water",
        weight: "mdi:weight",
        wind_speed: "mdi:weather-windy"
      };
      if (deviceClassIcons[deviceClass]) {
        return deviceClassIcons[deviceClass];
      }
    }
    const domain = String(entityId || "").split(".")[0];
    const domainIcons = {
      sensor: "mdi:eye",
      binary_sensor: "mdi:radiobox-marked",
      switch: "mdi:toggle-switch-variant",
      light: "mdi:lightbulb"
    };
    return (_c = domainIcons[domain]) != null ? _c : null;
  }
  function toScalePct(value, minValue, maxValue) {
    if (!Number.isFinite(value)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const range = safeMax - safeMin || 1;
    return Math.min(100, Math.max(0, (value - safeMin) / range * 100));
  }
  function parseColorToRgb(color) {
    const value = String(color || "").trim();
    if (!value) return null;
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16)
      };
    }
    const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(",").map((part) => part.trim());
      if (parts.length >= 3) {
        return {
          r: Math.max(0, Math.min(255, parseFloat(parts[0]))),
          g: Math.max(0, Math.min(255, parseFloat(parts[1]))),
          b: Math.max(0, Math.min(255, parseFloat(parts[2])))
        };
      }
    }
    return null;
  }
  function getNeedleBorderColor(color) {
    const rgb = parseColorToRgb(color);
    if (!rgb) return "#000000";
    const toLinear = (channel) => {
      const srgb = channel / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
    return luminance < 0.22 ? "#ffffff" : "#000000";
  }
  function getNeedleState(entityConfig, numericValue, minValue, maxValue, baselinePercent) {
    var _a, _b, _c;
    const needle = (_a = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _a.needle;
    if (!(needle == null ? void 0 : needle.show) || Number.isFinite(baselinePercent) || !Number.isFinite(numericValue)) {
      const color2 = (_b = needle == null ? void 0 : needle.color) != null ? _b : "#ffffff";
      return {
        show: false,
        percent: null,
        pct: null,
        color: color2,
        borderColor: getNeedleBorderColor(color2),
        edge: "middle"
      };
    }
    const color = (_c = needle.color) != null ? _c : "#ffffff";
    const percent = Math.min(100, Math.max(0, toScalePct(numericValue, minValue, maxValue)));
    return {
      show: true,
      percent,
      pct: percent,
      color,
      borderColor: getNeedleBorderColor(color),
      edge: percent <= 0 ? "left" : percent >= 100 ? "right" : "middle"
    };
  }
  function getExtremumState(numericValue, minValue, maxValue, tracker, direction, enabled) {
    if (!enabled) {
      return {
        value: null,
        percent: null,
        display: null,
        visible: false
      };
    }
    const existingValue = getFiniteNumber(tracker == null ? void 0 : tracker.value);
    if (!Number.isFinite(existingValue) && !Number.isFinite(numericValue)) {
      return {
        value: null,
        percent: null,
        visible: false
      };
    }
    const value = Number.isFinite(existingValue) ? Number.isFinite(numericValue) ? direction === "min" ? Math.min(existingValue, numericValue) : Math.max(existingValue, numericValue) : existingValue : numericValue;
    return {
      value,
      percent: toScalePct(value, minValue, maxValue),
      visible: true
    };
  }
  function buildRowViewModel(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha;
    const {
      hass,
      cardConfig,
      entityConfig,
      entityState,
      peaks,
      extrema,
      previousScale
    } = options;
    void cardConfig;
    const entityId = (_a = entityConfig == null ? void 0 : entityConfig.entity) != null ? _a : null;
    const rawState = (_b = entityState == null ? void 0 : entityState.state) != null ? _b : "";
    const numericValue = getFiniteNumber(rawState);
    const rawUnit = (_d = (_c = entityState == null ? void 0 : entityState.attributes) == null ? void 0 : _c.unit_of_measurement) != null ? _d : "";
    const configuredUnit = (_e = entityConfig == null ? void 0 : entityConfig.formatting) == null ? void 0 : _e.unit;
    const targetUnit = (_f = configuredUnit != null ? configuredUnit : rawUnit) != null ? _f : "";
    const displayUnit = numericValue !== null ? targetUnit : "";
    const { min: safeMin, max: safeMax } = getResolvedScale(hass, entityConfig == null ? void 0 : entityConfig.scale, previousScale);
    const percent = numericValue !== null ? toScalePct(numericValue, safeMin, safeMax) : 0;
    const decimal = (_h = (_g = entityConfig == null ? void 0 : entityConfig.formatting) == null ? void 0 : _g.decimal) != null ? _h : null;
    const primaryPresentation = numericValue === null ? createTextPresentation(rawState) : createNumericPresentation(numericValue, displayUnit, decimal);
    const targetValue = ((_i = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _i.enabled) === false ? null : getNormalizedResolvableNumericValue(hass, (_j = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _j.source, safeMin, safeMax);
    const targetPercent = targetValue !== null ? toScalePct(targetValue, safeMin, safeMax) : null;
    const targetVisible = targetValue !== null;
    const targetDecimal = (_l = (_k = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _k.label_decimal) != null ? _l : decimal;
    const targetPresentation = targetValue !== null ? createNumericPresentation(targetValue, targetUnit, targetDecimal) : null;
    const targetLabelPresentation = targetValue !== null ? createMarkerLabelPresentation(targetValue, targetUnit, (_n = (_m = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _m.label_precision) != null ? _n : targetDecimal, {
      text: (_o = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _o.label_text,
      showValue: (_p = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _p.label_show_value,
      showUnit: (_q = entityConfig == null ? void 0 : entityConfig.target_marker) == null ? void 0 : _q.label_show_unit
    }) : null;
    const baselineValue = ((_r = entityConfig == null ? void 0 : entityConfig.baseline) == null ? void 0 : _r.enabled) === false ? null : getNormalizedResolvableNumericValue(hass, (_s = entityConfig == null ? void 0 : entityConfig.baseline) == null ? void 0 : _s.at, safeMin, safeMax);
    const baselinePercent = Number.isFinite(baselineValue) ? toScalePct(baselineValue, safeMin, safeMax) : null;
    const baselineVisible = Number.isFinite(baselineValue);
    const legacyPeak = Number.isFinite(getFiniteNumber(peaks == null ? void 0 : peaks[entityId])) ? { value: getFiniteNumber(peaks == null ? void 0 : peaks[entityId]) } : null;
    const peakState = getExtremumState(
      numericValue,
      safeMin,
      safeMax,
      (_t = extrema == null ? void 0 : extrema.peak) != null ? _t : legacyPeak,
      "max",
      ((_u = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _u.show) === true
    );
    const floorState = getExtremumState(
      numericValue,
      safeMin,
      safeMax,
      extrema == null ? void 0 : extrema.floor,
      "min",
      ((_v = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _v.show) === true
    );
    const peakDecimal = (_x = (_w = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _w.label_decimal) != null ? _x : decimal;
    const floorDecimal = (_z = (_y = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _y.label_decimal) != null ? _z : decimal;
    const peakLabelPrecision = (_B = (_A = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _A.label_precision) != null ? _B : peakDecimal;
    const floorLabelPrecision = (_D = (_C = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _C.label_precision) != null ? _D : floorDecimal;
    const peakPresentation = peakState.visible ? createNumericPresentation(peakState.value, targetUnit, peakDecimal) : null;
    const floorPresentation = floorState.visible ? createNumericPresentation(floorState.value, targetUnit, floorDecimal) : null;
    const peakLabelPresentation = peakState.visible ? createMarkerLabelPresentation(peakState.value, targetUnit, peakLabelPrecision, {
      text: (_E = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _E.label_text,
      showValue: (_F = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _F.label_show_value,
      showUnit: (_G = entityConfig == null ? void 0 : entityConfig.peak_marker) == null ? void 0 : _G.label_show_unit
    }) : null;
    const floorLabelPresentation = floorState.visible ? createMarkerLabelPresentation(floorState.value, targetUnit, floorLabelPrecision, {
      text: (_H = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _H.label_text,
      showValue: (_I = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _I.label_show_value,
      showUnit: (_J = entityConfig == null ? void 0 : entityConfig.floor_marker) == null ? void 0 : _J.label_show_unit
    }) : null;
    const genericMarkers = ((_K = entityConfig == null ? void 0 : entityConfig.generic_markers) != null ? _K : []).filter((marker) => marker.accepted).map((marker) => {
      var _a2, _b2, _c2, _d2, _e2;
      const value = getNormalizedResolvableNumericValue(hass, marker.source, safeMin, safeMax);
      const visible = Number.isFinite(value);
      const markerPrecision = (_a2 = marker.label.precision) != null ? _a2 : decimal;
      const labelStateObj = marker.label.entity ? (_b2 = hass == null ? void 0 : hass.states) == null ? void 0 : _b2[marker.label.entity] : null;
      const rawLabelState = labelStateObj == null ? void 0 : labelStateObj.state;
      const cleanLabelState = typeof rawLabelState === "string" ? rawLabelState.trim() : "";
      const usableLabelState = labelStateObj && cleanLabelState && !["unknown", "unavailable"].includes(cleanLabelState.toLowerCase());
      const labelValue = marker.label.entity ? usableLabelState ? (_c2 = getFiniteNumber(cleanLabelState)) != null ? _c2 : cleanLabelState : null : value;
      const labelUnit = marker.label.entity ? usableLabelState ? (_e2 = (_d2 = labelStateObj == null ? void 0 : labelStateObj.attributes) == null ? void 0 : _d2.unit_of_measurement) != null ? _e2 : "" : "" : targetUnit;
      const label = marker.label.show ? createMarkerLabelPresentation(labelValue, labelUnit, markerPrecision, {
        text: marker.label.text,
        showValue: marker.label.showValue,
        showUnit: marker.label.showUnit
      }) : null;
      return {
        id: marker.id,
        value,
        position: visible ? toScalePct(value, safeMin, safeMax) : null,
        lane: marker.lane,
        visible,
        color: marker.color,
        shape: marker.shape,
        direction: marker.direction,
        showMarker: marker.showMarker,
        label,
        labelVisible: marker.label.show
      };
    });
    const markers = buildMarkerModels({
      entityConfig,
      targetValue,
      targetPosition: targetPercent,
      targetPresentation,
      targetLabelPresentation,
      targetVisible,
      peakValue: peakState.value,
      peakPosition: peakState.percent,
      peakPresentation,
      peakLabelPresentation,
      peakVisible: peakState.visible,
      floorValue: floorState.value,
      floorPosition: floorState.percent,
      floorPresentation,
      floorLabelPresentation,
      floorVisible: floorState.visible,
      genericMarkers
    });
    return {
      entityId,
      name: (_N = (_M = entityConfig == null ? void 0 : entityConfig.name) != null ? _M : (_L = entityState == null ? void 0 : entityState.attributes) == null ? void 0 : _L.friendly_name) != null ? _N : entityId,
      icon: (entityConfig == null ? void 0 : entityConfig.icon) === false ? false : (_Q = (_P = entityConfig == null ? void 0 : entityConfig.icon) != null ? _P : (_O = entityState == null ? void 0 : entityState.attributes) == null ? void 0 : _O.icon) != null ? _Q : getDefaultEntityIcon(entityState, entityId),
      state: rawState,
      numericValue,
      rawUnit,
      min: safeMin,
      max: safeMax,
      percent,
      displayValue: primaryPresentation.number,
      displayUnit: primaryPresentation.unit,
      primaryPresentation,
      unit: primaryPresentation.unit,
      barColor: (_S = (_R = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _R.color) != null ? _S : null,
      fillStyle: (_U = (_T = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _T.fill_style) != null ? _U : null,
      target: targetValue,
      targetPercent,
      targetDisplay: (_V = targetPresentation == null ? void 0 : targetPresentation.text) != null ? _V : null,
      targetPresentation,
      targetLabelPresentation,
      targetVisible,
      baseline: baselineValue,
      baselinePercent,
      baselineVisible,
      peak: peakState.value,
      peakPercent: peakState.percent,
      peakDisplay: (_W = peakPresentation == null ? void 0 : peakPresentation.number) != null ? _W : null,
      peakPresentation,
      peakLabelPresentation,
      peakVisible: peakState.visible,
      floor: floorState.value,
      floorPercent: floorState.percent,
      floorDisplay: (_X = floorPresentation == null ? void 0 : floorPresentation.number) != null ? _X : null,
      floorPresentation,
      floorLabelPresentation,
      floorVisible: floorState.visible,
      markers,
      markerLaneOccupancy: getMarkerLaneOccupancy(entityConfig),
      markerLabelLaneOccupancy: getMarkerLabelLaneOccupancy(entityConfig),
      segments: (_Z = (_Y = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _Y.segments) != null ? _Z : null,
      gradientStops: (_$ = (__ = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : __.gradient_stops) != null ? _$ : null,
      needle: getNeedleState(entityConfig, numericValue, safeMin, safeMax, baselinePercent),
      classes: {
        labelPosition: (_ca = (_ba = (_aa = entityConfig == null ? void 0 : entityConfig.layout) == null ? void 0 : _aa.label) == null ? void 0 : _ba.position) != null ? _ca : "left",
        animated: ((_da = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _da.animated) !== false
      },
      attributes: {
        entity: entityId,
        baseHeight: (_fa = (_ea = entityConfig == null ? void 0 : entityConfig.layout) == null ? void 0 : _ea.height) != null ? _fa : 38,
        heightExplicit: ((_ga = entityConfig == null ? void 0 : entityConfig.layout) == null ? void 0 : _ga.height_explicit) === true,
        barAnimated: ((_ha = entityConfig == null ? void 0 : entityConfig.bar) == null ? void 0 : _ha.animated) !== false
      }
    };
  }
  var init_row_view_model = __esm({
    "src/view-model/row-view-model.js"() {
      init_resolve();
      init_normalize();
      init_format();
      init_marker_view_model();
    }
  });

  // src/utils/dom.js
  function escapeHtml(value) {
    if (value == null) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setStyleIfChanged(el, prop, value) {
    var _a, _b;
    if (!(el == null ? void 0 : el.style)) return false;
    const nextValue = value == null ? "" : String(value);
    if (prop.startsWith("--")) {
      const currentValue2 = typeof el.style.getPropertyValue === "function" ? el.style.getPropertyValue(prop) : (_a = el.style[prop]) != null ? _a : "";
      if (currentValue2 === nextValue) return false;
      if (typeof el.style.setProperty === "function") {
        el.style.setProperty(prop, nextValue);
      } else {
        el.style[prop] = nextValue;
      }
      return true;
    }
    const currentValue = (_b = el.style[prop]) != null ? _b : "";
    if (currentValue === nextValue) return false;
    el.style[prop] = nextValue;
    return true;
  }
  function setStyleTextIfChanged(el, value) {
    var _a;
    if (!(el == null ? void 0 : el.style)) return false;
    const nextValue = value == null ? "" : String(value);
    const currentValue = (_a = el.style.cssText) != null ? _a : "";
    if (currentValue === nextValue) return false;
    el.style.cssText = nextValue;
    return true;
  }
  function setDatasetIfChanged(el, key, value) {
    var _a;
    if (!(el == null ? void 0 : el.dataset)) return false;
    const nextValue = value == null ? "" : String(value);
    const currentValue = (_a = el.dataset[key]) != null ? _a : "";
    if (currentValue === nextValue) return false;
    el.dataset[key] = nextValue;
    return true;
  }
  function setClassNameIfChanged(el, value) {
    var _a;
    if (!el) return false;
    const nextValue = value == null ? "" : String(value);
    if (((_a = el.className) != null ? _a : "") === nextValue) return false;
    el.className = nextValue;
    return true;
  }
  var init_dom = __esm({
    "src/utils/dom.js"() {
    }
  });

  // src/view-model/bar-render-model.js
  function getRevealTransitionDuration(previousGeometry, nextGeometry) {
    if (!previousGeometry || !nextGeometry || !Number.isFinite(previousGeometry.valuePercent) || !Number.isFinite(nextGeometry.valuePercent)) {
      return 600;
    }
    const previousBaseline = Number.isFinite(previousGeometry.baselinePercent) ? previousGeometry.baselinePercent : 0;
    const nextBaseline = Number.isFinite(nextGeometry.baselinePercent) ? nextGeometry.baselinePercent : 0;
    const delta = Math.max(
      Math.abs(nextGeometry.valuePercent - previousGeometry.valuePercent),
      Math.abs(nextBaseline - previousBaseline)
    );
    const ordinaryDuration = Math.round(Math.min(600, Math.max(150, 600 - 15 * Math.max(0, delta - 5))));
    const crossesBaseline = Number.isFinite(previousGeometry.baselinePercent) && Number.isFinite(nextGeometry.baselinePercent) && (previousGeometry.valuePercent - previousGeometry.baselinePercent) * (nextGeometry.valuePercent - nextGeometry.baselinePercent) < 0;
    return crossesBaseline ? Math.min(ordinaryDuration, 300) : ordinaryDuration;
  }
  function inferSegmentEndValues2(segments, fallbackEnd = null) {
    const sorted = [...segments].sort((a, b) => a.from - b.from);
    return sorted.map((segment, index) => {
      var _a;
      let to = Number.isFinite(segment.to) ? segment.to : null;
      if (!Number.isFinite(to) && index < sorted.length - 1) {
        to = sorted[index + 1].from;
      }
      if (!Number.isFinite(to) && Number.isFinite(fallbackEnd)) {
        to = fallbackEnd;
      }
      return {
        from: segment.from,
        to,
        color: segment.color,
        label: (_a = segment.label) != null ? _a : null
      };
    });
  }
  function hexToRgb(color) {
    if (!color || typeof color !== "string") return null;
    const hex = color.replace("#", "").trim();
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16)
    };
  }
  function getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100, preserveCssColors = false) {
    const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands.filter((s) => Number.isFinite(s == null ? void 0 : s.from) && Number.isFinite(s == null ? void 0 : s.to) && (s == null ? void 0 : s.color)).sort((a, b) => a.from - b.from);
    if (!sorted.length) return [];
    const stops = [];
    for (let i = 0; i < sorted.length; i++) {
      const band = sorted[i];
      const rgb = hexToRgb(band.color);
      if (!rgb && !preserveCssColors) continue;
      let anchor;
      if (i === 0) {
        anchor = band.from;
      } else if (i === sorted.length - 1) {
        anchor = band.to;
      } else {
        anchor = band.from + (band.to - band.from) / 2;
      }
      if (!stops.length || stops[stops.length - 1].p !== anchor) {
        stops.push({ p: anchor, ...rgb != null ? rgb : { color: band.color } });
      }
    }
    return stops;
  }
  function getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands.filter((s) => Number.isFinite(s == null ? void 0 : s.from) && Number.isFinite(s == null ? void 0 : s.to) && (s == null ? void 0 : s.color)).sort((a, b) => a.from - b.from);
    if (!sorted.length) return null;
    const stops = [];
    for (const band of sorted) {
      stops.push(`${band.color} ${band.from}%`, `${band.color} ${band.to}%`);
    }
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }
  function getSoftBandBlendWidthPct() {
    return 1.5;
  }
  function pushGradientColorStop(stops, pos, color) {
    if (!Array.isArray(stops) || !color) return;
    const clampedPos = Math.min(100, Math.max(0, pos));
    const last = stops[stops.length - 1];
    if (last && last.color === color && Math.abs(last.p - clampedPos) < 1e-4) return;
    stops.push({ p: clampedPos, color });
  }
  function getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
    const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
    const sorted = bands.filter((s) => Number.isFinite(s == null ? void 0 : s.from) && Number.isFinite(s == null ? void 0 : s.to) && (s == null ? void 0 : s.color)).sort((a, b) => a.from - b.from);
    if (!sorted.length) return [];
    const blendWidth = getSoftBandBlendWidthPct();
    const blendHalf = blendWidth / 2;
    const stops = [];
    pushGradientColorStop(stops, sorted[0].from, sorted[0].color);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const boundary = current.to;
      const currentWidth = current.to - current.from;
      const nextWidth = next.to - next.from;
      const soften = currentWidth >= blendWidth && nextWidth >= blendWidth;
      if (soften) {
        pushGradientColorStop(stops, Math.max(current.from, boundary - blendHalf), current.color);
        pushGradientColorStop(stops, Math.min(next.to, boundary + blendHalf), next.color);
      } else {
        pushGradientColorStop(stops, boundary, current.color);
        pushGradientColorStop(stops, boundary, next.color);
      }
    }
    pushGradientColorStop(stops, sorted[sorted.length - 1].to, sorted[sorted.length - 1].color);
    return stops;
  }
  function getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
    const stops = getSoftBandGradientStops(ecfg, minValue, maxValue);
    if (!stops.length) return null;
    return `linear-gradient(to right, ${stops.map((stop) => `${stop.color} ${stop.p}%`).join(", ")})`;
  }
  function resolveSegmentBoundaryPct(boundary, minValue, maxValue) {
    if (boundary === null || boundary === void 0) return null;
    if (typeof boundary === "object" && !Array.isArray(boundary)) {
      const fixed2 = getFiniteNumber(boundary.fixed);
      if (Number.isFinite(fixed2)) {
        return toScalePct2(fixed2, minValue, maxValue);
      }
      if (Number.isFinite(boundary.percent)) {
        return boundary.percent;
      }
      return null;
    }
    const percent = parsePercentLiteral(boundary);
    if (Number.isFinite(percent)) {
      return percent;
    }
    const fixed = getFiniteNumber(boundary);
    return Number.isFinite(fixed) ? toScalePct2(fixed, minValue, maxValue) : null;
  }
  function getEffectiveFillStyle(ecfg) {
    var _a, _b, _c, _d;
    return (_d = (_c = (_a = ecfg == null ? void 0 : ecfg.bar) == null ? void 0 : _a.fill_style) != null ? _c : colorModeToFillStyle((_b = ecfg == null ? void 0 : ecfg.bar) == null ? void 0 : _b.color_mode)) != null ? _d : "bands";
  }
  function segmentsNeedBoundaryResolution(segments) {
    return Array.isArray(segments) && segments.some((segment) => (segment == null ? void 0 : segment.from) && typeof segment.from === "object" && !Array.isArray(segment.from) || (segment == null ? void 0 : segment.to) && typeof segment.to === "object" && !Array.isArray(segment.to));
  }
  function getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
    var _a, _b;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const rawSegments = (Array.isArray((_a = ecfg.bar) == null ? void 0 : _a.segments) ? ecfg.bar.segments : []).filter((segment) => !(segment == null ? void 0 : segment.invalidBoundary));
    if (((_b = ecfg.bar) == null ? void 0 : _b.segment_space) === "scale" || segmentsNeedBoundaryResolution(rawSegments)) {
      const resolvedSegments = rawSegments.map((segment) => {
        var _a2;
        return {
          from: resolveSegmentBoundaryPct(segment.from, safeMin, safeMax),
          to: resolveSegmentBoundaryPct(segment.to, safeMin, safeMax),
          color: segment.color,
          label: (_a2 = segment.label) != null ? _a2 : null
        };
      }).filter((segment) => Number.isFinite(segment.from) && segment.color);
      return inferSegmentEndValues2(resolvedSegments, 100).filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
    }
    return inferSegmentEndValues2(rawSegments, 100).filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
  }
  function getColor(pct, ecfg, minValue = 0, maxValue = 100) {
    const fillStyle = getEffectiveFillStyle(ecfg);
    if (fillStyle === "solid") return ecfg.bar.color;
    if (fillStyle === "gradient" || fillStyle === "band_gradient" || fillStyle === "soft_bands") {
      let stops;
      if (fillStyle === "band_gradient") {
        stops = getSeverityInterpolationStops(ecfg, minValue, maxValue);
      } else if (fillStyle === "soft_bands") {
        stops = getSoftBandGradientStops(ecfg, minValue, maxValue).map((stop) => {
          const rgb = hexToRgb(stop.color);
          return rgb ? { p: stop.p, ...rgb } : null;
        }).filter(Boolean);
      } else if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
        stops = ecfg.bar.gradient_stops.map((s) => {
          const hex = s.color.replace("#", "");
          const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
          return { p: s.pos, r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
        });
        stops.sort((a, b) => a.p - b.p);
      } else {
        stops = [
          { p: 0, r: 76, g: 175, b: 80 },
          { p: 50, r: 255, g: 152, b: 0 },
          { p: 100, r: 244, g: 67, b: 54 }
        ];
      }
      if (!stops || !stops.length) return ecfg.bar.color;
      let lo = stops[0], hi = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (pct >= stops[i].p && pct <= stops[i + 1].p) {
          lo = stops[i];
          hi = stops[i + 1];
          break;
        }
      }
      const t = lo.p === hi.p ? 0 : (pct - lo.p) / (hi.p - lo.p);
      return `rgb(${Math.round(lo.r + t * (hi.r - lo.r))},${Math.round(lo.g + t * (hi.g - lo.g))},${Math.round(lo.b + t * (hi.b - lo.b))})`;
    }
    for (const s of getSegmentsForRendering(ecfg, minValue, maxValue)) {
      if (pct >= s.from && pct <= s.to) return s.color;
    }
    return ecfg.bar.color;
  }
  function buildFullScaleGradientStyle(stops) {
    if (!Array.isArray(stops) || !stops.length) return null;
    const cssStops = stops.map((stop) => {
      var _a;
      const cssColor = (_a = stop.color) != null ? _a : rgbToCss(stop);
      return cssColor ? `${cssColor} ${stop.p}%` : null;
    }).filter(Boolean);
    if (!cssStops.length) return null;
    return `background:linear-gradient(to right,${cssStops.join(",")});background-repeat:no-repeat;`;
  }
  function getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
    const fillStyle = getEffectiveFillStyle(ecfg);
    if (fillStyle === "band_gradient") {
      return getSeverityInterpolationStops(ecfg, minValue, maxValue, true);
    }
    if (fillStyle === "soft_bands") {
      return getSoftBandGradientStops(ecfg, minValue, maxValue).map((stop) => {
        const rgb = hexToRgb(stop.color);
        return rgb ? { p: stop.p, ...rgb } : null;
      }).filter(Boolean).sort((a, b) => a.p - b.p);
    }
    if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
      return ecfg.bar.gradient_stops.map((s) => {
        const rgb = hexToRgb(s.color);
        return rgb ? { p: s.pos, ...rgb } : null;
      }).filter(Boolean).sort((a, b) => a.p - b.p);
    }
    return [
      { p: 0, r: 76, g: 175, b: 80 },
      { p: 50, r: 255, g: 152, b: 0 },
      { p: 100, r: 244, g: 67, b: 54 }
    ];
  }
  function rgbToCss(rgb) {
    if (!rgb) return null;
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }
  function buildSolidGradientStyle(color) {
    return `linear-gradient(to right,${color} 0%,${color} 100%)`;
  }
  function getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100) {
    var _a;
    const fillStyle = getEffectiveFillStyle(ecfg);
    if (ecfg.bar.solid_fill) {
      return buildSolidGradientStyle(color);
    }
    if (fillStyle === "bands") {
      return getSeverityBandGradientCss(ecfg, minValue, maxValue);
    }
    if (fillStyle === "soft_bands") {
      return getSoftBandGradientCss(ecfg, minValue, maxValue);
    }
    if (fillStyle === "gradient" || fillStyle === "band_gradient") {
      const stops = getGradientInterpolationStops(ecfg, minValue, maxValue);
      return (_a = buildFullScaleGradientStyle(stops)) == null ? void 0 : _a.replace(/^background:/, "").replace(/;background-repeat:no-repeat;$/, "");
    }
    return buildSolidGradientStyle(color);
  }
  function getOverlayGradient(startPct, endPct, color) {
    if (!color) return null;
    const start = Math.min(100, Math.max(0, startPct));
    const end = Math.min(100, Math.max(0, endPct));
    if (end <= start) return null;
    return `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;
  }
  function toScalePct2(value, minValue, maxValue) {
    if (!Number.isFinite(value)) return null;
    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
    const range = safeMax - safeMin || 1;
    return Math.min(100, Math.max(0, (value - safeMin) / range * 100));
  }
  function getNormalizedPercent(valuePct, baselinePct = null) {
    const clampedValue = Math.min(100, Math.max(0, valuePct));
    if (!Number.isFinite(baselinePct)) {
      return {
        usesBaseline: false,
        start: 0,
        end: clampedValue,
        positive: true,
        baseline: null,
        hidden: clampedValue <= 0
      };
    }
    const clampedBaseline = Math.min(100, Math.max(0, baselinePct));
    return {
      usesBaseline: true,
      start: Math.min(clampedValue, clampedBaseline),
      end: Math.max(clampedValue, clampedBaseline),
      positive: clampedValue >= clampedBaseline,
      baseline: clampedBaseline,
      hidden: clampedValue === clampedBaseline
    };
  }
  function getEndpointSemantics(geometry) {
    if (geometry == null ? void 0 : geometry.endpointSemantics) {
      return geometry.endpointSemantics;
    }
    if (!(geometry == null ? void 0 : geometry.usesBaseline)) {
      return {
        left: "scale",
        right: "value"
      };
    }
    return geometry.positive ? { left: "baseline", right: "value" } : { left: "value", right: "baseline" };
  }
  function getRevealCornerRadii(geometry) {
    const endpoints = getEndpointSemantics(geometry);
    const isRounded = (endpointType) => endpointType === "value" || endpointType === "range" || endpointType === "scale";
    const leftRadius = isRounded(endpoints.left) ? "6px" : "0";
    const rightRadius = isRounded(endpoints.right) ? "6px" : "0";
    return `${leftRadius} ${rightRadius} ${rightRadius} ${leftRadius}`;
  }
  function getAboveTargetOverlayInterval(targetPct = null) {
    if (!Number.isFinite(targetPct)) return null;
    const start = Math.min(100, Math.max(0, targetPct));
    if (start >= 100) return null;
    return {
      start,
      end: 100
    };
  }
  function getAboveTargetLayerGeometry(targetPct = null) {
    const interval = getAboveTargetOverlayInterval(targetPct);
    if (!interval) return null;
    return {
      start: interval.start,
      end: interval.end,
      hidden: false
    };
  }
  function getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    var _a, _b, _c, _d, _e, _f;
    const layers = [];
    const basePaint = getBasePaintGradient(color, ecfg, minValue, maxValue);
    const clampedBaseline = Number.isFinite(baselinePct) ? Math.min(100, Math.max(0, baselinePct)) : null;
    if (Number.isFinite(clampedBaseline)) {
      const belowColor = (_c = (_b = (_a = ecfg.baseline) == null ? void 0 : _a.below) == null ? void 0 : _b.color) != null ? _c : null;
      const aboveColor = (_f = (_e = (_d = ecfg.baseline) == null ? void 0 : _d.above) == null ? void 0 : _e.color) != null ? _f : null;
      const belowOverlay = getOverlayGradient(0, clampedBaseline, belowColor);
      const aboveOverlay = getOverlayGradient(clampedBaseline, 100, aboveColor);
      if (belowOverlay) layers.push(belowOverlay);
      if (aboveOverlay) layers.push(aboveOverlay);
    }
    if (basePaint) layers.push(basePaint);
    if (!layers.length) return "display:none;";
    return `display:block;inset:0;background-image:${layers.join(",")};background-repeat:no-repeat;background-size:100% 100%;`;
  }
  function getRevealShapeStyle(geometry, h) {
    var _a, _b;
    const heightValue = typeof h === "number" ? `${h}px` : h;
    const start = Math.min(100, Math.max(0, (_a = geometry == null ? void 0 : geometry.start) != null ? _a : 0));
    const end = Math.min(100, Math.max(0, (_b = geometry == null ? void 0 : geometry.end) != null ? _b : 0));
    if (geometry == null ? void 0 : geometry.hidden) {
      return `display:none;height:${heightValue};clip-path:inset(0 100% 0 0 round 0);`;
    }
    const topInset = "0";
    const rightInset = `${Math.max(0, 100 - end)}%`;
    const bottomInset = "0";
    const leftInset = `${start}%`;
    const radii = getRevealCornerRadii(geometry);
    return `display:block;height:${heightValue};clip-path:inset(${topInset} ${rightInset} ${bottomInset} ${leftInset} round ${radii});`;
  }
  function getStaticLayerRevealStyle(geometry) {
    if (!(geometry == null ? void 0 : geometry.hidden) && Number.isFinite(geometry == null ? void 0 : geometry.start) && Number.isFinite(geometry == null ? void 0 : geometry.end) && geometry.end > geometry.start) {
      const start = Math.min(100, Math.max(0, geometry.start));
      const end = Math.min(100, Math.max(0, geometry.end));
      return `display:block;clip-path:inset(0 ${Math.max(0, 100 - end)}% 0 ${start}% round 0);`;
    }
    return "display:none;clip-path:inset(0 100% 0 0 round 0);";
  }
  function getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
    var _a, _b;
    const basePaintStyle = getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue);
    const baseLayer = {
      id: "base",
      zIndex: 1,
      visible: true,
      paintStyle: basePaintStyle,
      revealStyle: "display:block;"
    };
    const aboveTargetGeometry = getAboveTargetLayerGeometry(targetPct);
    const aboveTargetLayer = {
      id: "above-target",
      zIndex: 2,
      visible: !!(((_a = ecfg == null ? void 0 : ecfg.bar) == null ? void 0 : _a.above_target_color) && aboveTargetGeometry),
      paintStyle: ((_b = ecfg == null ? void 0 : ecfg.bar) == null ? void 0 : _b.above_target_color) ? `display:block;inset:0;background:${ecfg.bar.above_target_color};` : "display:none;",
      revealStyle: aboveTargetGeometry ? getStaticLayerRevealStyle(aboveTargetGeometry) : getStaticLayerRevealStyle({ start: 0, end: 0, hidden: true })
    };
    return [baseLayer, aboveTargetLayer];
  }
  function getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
    var _a, _b;
    const geometry = needleActive ? getNormalizedPercent(100, null) : getNormalizedPercent(pct, baselinePct);
    const paintLayers = getFillPaintLayers(geometry, h, ecfg, color, targetPct, baselinePct, minValue, maxValue);
    return {
      geometry,
      paintLayers,
      paintStyle: (_b = (_a = paintLayers[0]) == null ? void 0 : _a.paintStyle) != null ? _b : "display:none;",
      revealStyle: getRevealShapeStyle(geometry, h)
    };
  }
  function getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const needle = (_a = ecfg == null ? void 0 : ecfg.bar) == null ? void 0 : _a.needle;
    if (!(needle == null ? void 0 : needle.show)) {
      return {
        show: false,
        pct: null,
        color: (_b = needle == null ? void 0 : needle.color) != null ? _b : "#ffffff",
        borderColor: getNeedleBorderColor2((_c = needle == null ? void 0 : needle.color) != null ? _c : "#ffffff"),
        edge: "middle"
      };
    }
    if (Number.isFinite(baselinePct)) {
      return {
        show: false,
        pct: null,
        color: (_d = needle.color) != null ? _d : "#ffffff",
        borderColor: getNeedleBorderColor2((_e = needle.color) != null ? _e : "#ffffff"),
        edge: "middle"
      };
    }
    if (!Number.isFinite(rawValue)) {
      return {
        show: false,
        pct: null,
        color: (_f = needle.color) != null ? _f : "#ffffff",
        borderColor: getNeedleBorderColor2((_g = needle.color) != null ? _g : "#ffffff"),
        edge: "middle"
      };
    }
    const pct = Math.min(100, Math.max(0, toScalePct2(rawValue, minValue, maxValue)));
    return {
      show: true,
      pct,
      color: (_h = needle.color) != null ? _h : "#ffffff",
      borderColor: getNeedleBorderColor2((_i = needle.color) != null ? _i : "#ffffff"),
      edge: pct <= 0 ? "left" : pct >= 100 ? "right" : "middle"
    };
  }
  function parseColorToRgb2(color) {
    const value = String(color || "").trim();
    if (!value) return null;
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16)
      };
    }
    const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        return {
          r: Math.max(0, Math.min(255, parseFloat(parts[0]))),
          g: Math.max(0, Math.min(255, parseFloat(parts[1]))),
          b: Math.max(0, Math.min(255, parseFloat(parts[2])))
        };
      }
    }
    return null;
  }
  function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) {
      return { h: 0, s: 0, l: l * 100 };
    }
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  function getMarkerContrastColor(color) {
    const rgb = parseColorToRgb2(color);
    if (!rgb) return "#f3f4f6";
    const { h, s, l } = rgbToHsl(rgb);
    const contrastL = Math.abs(l - 90) >= Math.abs(l - 10) ? 90 : 10;
    const contrastS = Math.max(40, Math.min(100, s));
    return `hsl(${Math.round(h)} ${Math.round(contrastS)}% ${Math.round(contrastL)}%)`;
  }
  function getEffectiveMarkerColor(marker) {
    var _a;
    return (_a = marker == null ? void 0 : marker.color) != null ? _a : "#888888";
  }
  function getNeedleBorderColor2(color) {
    const rgb = parseColorToRgb2(color);
    if (!rgb) return "#000000";
    const toLinear = (channel) => {
      const srgb = channel / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
    return luminance < 0.22 ? "#ffffff" : "#000000";
  }
  function buildBarRenderModel(row, appearance, { height, color = getColor(row.percent, appearance, row.min, row.max) } = {}) {
    var _a, _b, _c, _d;
    const baselinePercent = row.baselinePercent;
    const baselineAt = (_a = appearance.baseline) == null ? void 0 : _a.at;
    const baselineConfigured = ((_b = appearance.baseline) == null ? void 0 : _b.enabled) !== false && (Number.isFinite(baselinePercent) || Boolean(baselineAt == null ? void 0 : baselineAt.entity) || (baselineAt == null ? void 0 : baselineAt.fixed) !== null && (baselineAt == null ? void 0 : baselineAt.fixed) !== void 0 || Number.isFinite(baselineAt == null ? void 0 : baselineAt.percent));
    return {
      animated: appearance.bar.animated,
      fill: getFillRenderState(row.percent, height, appearance, color, row.targetPercent, baselinePercent, row.min, row.max, row.needle.show),
      baseline: { configured: baselineConfigured, percent: baselinePercent },
      needle: {
        ...row.needle,
        configured: ((_d = (_c = appearance.bar) == null ? void 0 : _c.needle) == null ? void 0 : _d.show) && !Number.isFinite(baselinePercent)
      },
      markers: row.markers
    };
  }
  var init_bar_render_model = __esm({
    "src/view-model/bar-render-model.js"() {
      init_normalize();
    }
  });

  // src/render/bar-renderer.js
  function renderMarker(marker) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!marker) return "";
    const position = Number.isFinite(marker.position) ? marker.position : 0;
    const color = getEffectiveMarkerColor(marker);
    const contrastColor = getMarkerContrastColor(color);
    const display = marker.visible ? "" : "none";
    const defaultShape = marker.type === "target" ? "diamond" : marker.type === "generic" ? "circle" : "triangle";
    const shape = normalizeMarkerShape(marker.shape, defaultShape);
    const lane = (_a = marker.lane) != null ? _a : marker.type === "peak" ? "above" : "below";
    const shapePaths = `<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;
    if (marker.type === "generic") {
      const triangleClasses = lane === "above" ? ["peak-inset", "peak-outset"] : ["target-inset", "target-outset"];
      return `
    <div class="generic-marker" data-marker-id="${escapeHtml(marker.id)}" data-shape="${shape}" data-lane="${lane}" data-direction="${(_b = marker.direction) != null ? _b : "inward"}" data-show-marker="${marker.showMarker === false ? "false" : "true"}" style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="${triangleClasses[0]}"></div>
      <div class="${triangleClasses[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${(_c = marker.direction) != null ? _c : "inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
    </div>`;
    }
    if (marker.type === "target" || marker.type === "floor") {
      const markerClass = `${marker.type}-marker`;
      return `
    <div class="${markerClass}" data-shape="${shape}" data-lane="${lane}" data-direction="${(_d = marker.direction) != null ? _d : "inward"}" style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="${marker.type}-inset"></div>
      <div class="${marker.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${(_e = marker.direction) != null ? _e : "inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
    </div>`;
    }
    return `
    <div class="peak-marker" data-shape="${shape}" data-lane="${lane}" data-direction="${(_f = marker.direction) != null ? _f : "inward"}" style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${(_g = marker.direction) != null ? _g : "inward"}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
    </div>`;
  }
  function patchMarker(markerEl, marker) {
    var _a, _b, _c, _d, _e;
    if (!markerEl || !marker) return;
    const defaultShape = marker.type === "generic" ? "circle" : marker.type === "peak" || marker.type === "floor" ? "triangle" : "diamond";
    const shape = normalizeMarkerShape(marker.shape, defaultShape);
    setDatasetIfChanged(markerEl, "shape", shape);
    setDatasetIfChanged(markerEl, "lane", (_a = marker.lane) != null ? _a : marker.type === "peak" ? "above" : "below");
    setDatasetIfChanged(markerEl, "direction", (_b = marker.direction) != null ? _b : "inward");
    if (marker.type === "generic") {
      setDatasetIfChanged(markerEl, "showMarker", marker.showMarker === false ? "false" : "true");
    }
    const shapeSvg = (_c = markerEl.querySelector) == null ? void 0 : _c.call(markerEl, ".marker-shape-svg");
    if (shapeSvg) {
      setDatasetIfChanged(shapeSvg, "shape", shape);
      setDatasetIfChanged(shapeSvg, "lane", (_d = marker.lane) != null ? _d : marker.type === "peak" ? "above" : "below");
      setDatasetIfChanged(shapeSvg, "direction", (_e = marker.direction) != null ? _e : "inward");
    }
    setStyleIfChanged(markerEl, "display", marker.visible ? "" : "none");
    if (marker.visible && Number.isFinite(marker.position)) {
      setStyleIfChanged(markerEl, "left", `${marker.position}%`);
    }
    const markerColor = getEffectiveMarkerColor(marker);
    setStyleIfChanged(markerEl, "--marker-color", markerColor);
    setStyleIfChanged(markerEl, "--marker-contrast-color", getMarkerContrastColor(markerColor));
  }
  function patchBar(root2, model, { revealDuration = 600 } = {}) {
    var _a, _b, _c;
    const fillReveal = root2.querySelector(".bar-fill-reveal");
    const baselineIndicator = root2.querySelector(".baseline-indicator");
    const paintLayer = root2.querySelector('.bar-paint-layer[data-layer="base"]');
    if (fillReveal) {
      setStyleTextIfChanged(fillReveal, `${model.fill.revealStyle};--sbcp-reveal-duration:${revealDuration}ms`);
      setClassNameIfChanged(fillReveal, `bar-fill-reveal${model.animated ? "" : " no-anim"}`);
    }
    if (baselineIndicator) {
      setStyleIfChanged(baselineIndicator, "display", Number.isFinite(model.baseline.percent) ? "block" : "none");
      if (Number.isFinite(model.baseline.percent)) {
        setStyleIfChanged(baselineIndicator, "left", `${model.baseline.percent}%`);
      }
    }
    if (paintLayer) {
      const baseLayerState = model.fill.paintLayers.find((layer) => layer.id === "base");
      if (baseLayerState) {
        setStyleTextIfChanged(paintLayer, `z-index:${baseLayerState.zIndex};${baseLayerState.paintStyle}${baseLayerState.revealStyle}`);
      }
    }
    const aboveTargetLayer = root2.querySelector('.bar-paint-layer[data-layer="above-target"]');
    if (aboveTargetLayer) {
      const aboveTargetState = model.fill.paintLayers.find((layer) => layer.id === "above-target");
      if (aboveTargetState) {
        setStyleTextIfChanged(aboveTargetLayer, `z-index:${aboveTargetState.zIndex};${aboveTargetState.paintStyle}${aboveTargetState.revealStyle}`);
      }
    }
    const needleEl = root2.querySelector(".needle-marker");
    if (needleEl) {
      setStyleIfChanged(needleEl, "display", model.needle.show ? "block" : "none");
      setStyleIfChanged(needleEl, "left", `${(_a = model.needle.pct) != null ? _a : 0}%`);
      setStyleIfChanged(needleEl, "--needle-color", model.needle.color);
      setStyleIfChanged(needleEl, "--needle-border-color", model.needle.borderColor);
      setDatasetIfChanged(needleEl, "edge", model.needle.edge);
    }
    const markers = model.markers;
    const getMarker = (id) => {
      var _a2;
      return (_a2 = markers.find((marker) => marker.id === id || marker.type === id)) != null ? _a2 : null;
    };
    patchMarker(root2.querySelector(".target-marker"), getMarker("target"));
    patchMarker(root2.querySelector(".peak-marker"), getMarker("peak"));
    patchMarker(root2.querySelector(".floor-marker"), getMarker("floor"));
    ((_c = (_b = root2.querySelectorAll) == null ? void 0 : _b.call(root2, ".generic-marker[data-marker-id]")) != null ? _c : []).forEach((markerEl) => {
      patchMarker(markerEl, getMarker(markerEl.dataset.markerId));
    });
  }
  function renderBar(model, { insideContent = "" } = {}) {
    var _a;
    const fillState = model.fill;
    const baselinePct = model.baseline.percent;
    const needleState = model.needle;
    const baselineIndicator = model.baseline.configured ? `<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(baselinePct) ? `left:${baselinePct}%;display:block;` : "display:none;"}"></div>` : "";
    const getMarker = (type) => {
      var _a2;
      return (_a2 = model.markers.find((marker) => marker.id === type || marker.type === type)) != null ? _a2 : null;
    };
    const peakMarker = renderMarker(getMarker("peak"));
    const targetMarker = renderMarker(getMarker("target"));
    const floorMarker = renderMarker(getMarker("floor"));
    const genericMarkers = model.markers.filter((marker) => marker.type === "generic").map(renderMarker).join("");
    const needleMarker = needleState.configured ? `
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${needleState.edge}" style="left:${(_a = needleState.pct) != null ? _a : 0}%;--needle-color:${needleState.color};--needle-border-color:${needleState.borderColor};display:${needleState.show ? "block" : "none"};"></div>
      </div>` : "";
    const paintLayers = fillState.paintLayers.map((layer) => `
                  <div class="bar-paint-layer" data-layer="${layer.id}" style="z-index:${layer.zIndex};${layer.paintStyle}${layer.revealStyle}"></div>`).join("");
    return `<div class="bar-track">
                <div class="bar-fill-reveal${model.animated ? "" : " no-anim"}" style="${fillState.revealStyle}">
${paintLayers}
                </div>
                ${baselineIndicator}
                ${insideContent}
                ${peakMarker}
                ${targetMarker}
                ${floorMarker}
                ${genericMarkers}
                ${needleMarker}
              </div>`;
  }
  var init_bar_renderer = __esm({
    "src/render/bar-renderer.js"() {
      init_marker_view_model();
      init_bar_render_model();
      init_dom();
    }
  });

  // src/card/SensorBarCard.js
  var SensorBarCard;
  var init_SensorBarCard = __esm({
    "src/card/SensorBarCard.js"() {
      init_bar_styles();
      init_normalize();
      init_resolve();
      init_validate();
      init_row_view_model();
      init_marker_view_model();
      init_dom();
      init_format();
      init_extrema();
      init_bar_render_model();
      init_bar_renderer();
      SensorBarCard = class extends HTMLElement {
        static getConfigElement() {
          return document.createElement("sensor-bar-card-plus-editor");
        }
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this._baseDomReady = false;
          this._config = {};
          this._diagnostics = { warnings: [], errors: [] };
          this._lastDiagnosticsSignature = null;
          this._hass = null;
          this._extrema = /* @__PURE__ */ new WeakMap();
          this._rowScales = /* @__PURE__ */ new WeakMap();
          this._rowGeneration = 0;
          this._rowPresence = [];
          this._leftModeResponsiveHistory = /* @__PURE__ */ new WeakMap();
          this._rendered = false;
          this._resizeObserver = null;
          this._densityPassScheduled = false;
          this._densityPassDirty = false;
          this._densityPassFrame = null;
          this._densityPassRetries = 0;
          this._boundWindowResize = () => this._schedulePostLayoutDensityPass();
          this._markerHover = null;
          this._boundMarkerPointerOver = (event) => this._handleMarkerPointerOver(event);
          this._boundMarkerPointerOut = (event) => this._handleMarkerPointerOut(event);
          this._ensureBaseDom();
        }
        connectedCallback() {
          window.addEventListener("resize", this._boundWindowResize, { passive: true });
          this._setupResizeObserver();
          this._schedulePostLayoutDensityPass();
        }
        disconnectedCallback() {
          this._rowGeneration += 1;
          window.removeEventListener("resize", this._boundWindowResize);
          this._clearMarkerHover();
          this._disconnectResizeObserver();
          if (this._densityPassFrame) {
            cancelAnimationFrame(this._densityPassFrame);
            this._densityPassFrame = null;
          }
          this._densityPassScheduled = false;
          this._densityPassDirty = false;
        }
        setConfig(config) {
          var _a;
          if (!config.entities && !config.entity) {
            throw new Error("You must define entities or entity");
          }
          this._rendered = false;
          this._rowGeneration += 1;
          const previousConfig = this._config;
          this._config = this.normalizeCardConfig(config);
          this._rowScales = /* @__PURE__ */ new WeakMap();
          this._reconcileRowHistory((_a = previousConfig == null ? void 0 : previousConfig.entities) != null ? _a : []);
          this._diagnostics = validateNormalizedConfig(this._config);
          this._logDiagnostics();
          this._render();
        }
        _reconcileRowHistory(previousRows) {
          var _a, _b, _c, _d;
          const canonical = (value, key = "") => {
            if (Array.isArray(value)) return value.map(canonical);
            if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().filter((name) => !["severity", "segment_space", "label_precision_key"].includes(name)).map((name) => [name, canonical(value[name], name)]));
            if (key === "fixed") return getNumericValue(null, value);
            if (/color/i.test(key) && typeof value === "string" && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim())) {
              const hex = value.trim().slice(1).toLowerCase();
              return `#${hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex}`;
            }
            return value;
          };
          const signature = (row) => {
            var _a2;
            return JSON.stringify(canonical({
              entity: row.entity,
              name: row.name,
              icon: (_a2 = row.icon) != null ? _a2 : null,
              layout: row.layout,
              scale: Object.fromEntries(["min", "max"].map((key) => [key, {
                ...row.scale[key],
                fixed_explicit: row.scale[key].fixed_explicit !== false
              }])),
              bar: row.bar,
              baseline: row.baseline,
              formatting: row.formatting,
              target_marker: row.target_marker,
              peak_marker: row.peak_marker,
              floor_marker: row.floor_marker,
              generic_markers: row.generic_markers
            }));
          };
          const unmatchedOld = new Set(previousRows);
          const matches = /* @__PURE__ */ new Map();
          const oldSignatures = new Map(previousRows.map((row) => [row, signature(row)]));
          for (const row of this._config.entities) {
            const key = signature(row);
            const previous = [...unmatchedOld].find((old) => oldSignatures.get(old) === key);
            if (!previous) continue;
            matches.set(row, previous);
            unmatchedOld.delete(previous);
          }
          const unmatchedNew = this._config.entities.filter((row) => !matches.has(row));
          for (const row of unmatchedNew) {
            const old = [...unmatchedOld].filter((previous) => previous.entity === row.entity);
            const next = unmatchedNew.filter((current) => current.entity === row.entity);
            if (old.length !== 1 || next.length !== 1) continue;
            matches.set(row, old[0]);
            unmatchedOld.delete(old[0]);
          }
          const extrema = /* @__PURE__ */ new WeakMap();
          const responsive = /* @__PURE__ */ new WeakMap();
          for (const [row, previous] of matches) {
            const stored = this._extrema.get(previous);
            const retained = {};
            for (const key of ["peak", "floor"]) {
              const before = previous[`${key}_marker`];
              const after = row[`${key}_marker`];
              if ((stored == null ? void 0 : stored[key]) && (before == null ? void 0 : before.show) === true && (after == null ? void 0 : after.show) === true && JSON.stringify(before.reset) === JSON.stringify(after.reset)) {
                retained[key] = { ...stored[key] };
              }
            }
            if (retained.peak || retained.floor) extrema.set(row, retained);
            if (((_b = (_a = previous.layout) == null ? void 0 : _a.label) == null ? void 0 : _b.position) === "left" && ((_d = (_c = row.layout) == null ? void 0 : _c.label) == null ? void 0 : _d.position) === "left" && this._leftModeResponsiveHistory.has(previous)) {
              responsive.set(row, this._leftModeResponsiveHistory.get(previous));
            }
          }
          this._extrema = extrema;
          this._leftModeResponsiveHistory = responsive;
        }
        _logDiagnostics() {
          var _a;
          const diagnostics = (_a = this._diagnostics) != null ? _a : { warnings: [], errors: [] };
          const signature = JSON.stringify(diagnostics);
          if (signature === this._lastDiagnosticsSignature) return;
          this._lastDiagnosticsSignature = signature;
          diagnostics.warnings.forEach((diagnostic) => {
            console.warn(`[sensor-bar-card-plus] ${diagnostic.message}`, diagnostic);
          });
          diagnostics.errors.forEach((diagnostic) => {
            console.warn(`[sensor-bar-card-plus] ${diagnostic.message}`, diagnostic);
          });
        }
        // The normalized model is internal only. It preserves today's flat YAML
        // while giving future work one structured compatibility layer to build on.
        normalizeCardConfig(rawConfig) {
          return normalizeCardConfig(rawConfig);
        }
        normalizeEntityConfig(entityConfig, cardConfig) {
          return normalizeEntityConfig(entityConfig, cardConfig);
        }
        // Internal resolvable shape preserves today's flat `value + *_entity`
        // behavior while canonicalizing the normalized form to `fixed + entity`.
        normalizeResolvableValue(value, entityValue, percentValue = null) {
          return normalizeResolvableValue(value, entityValue, percentValue);
        }
        _looksLikeEntityId(value) {
          return looksLikeEntityId(value);
        }
        _parsePercentLiteral(value) {
          return parsePercentLiteral(value);
        }
        _getFiniteNumber(value) {
          return getFiniteNumber(value);
        }
        normalizeStructuredResolvableValue(input, inheritedResolvable = null, defaultValue = null, options = {}) {
          return normalizeStructuredResolvableValue(input, inheritedResolvable, defaultValue, options);
        }
        normalizeBaselineDirectionConfig(input, inheritedDirection = null) {
          return normalizeBaselineDirectionConfig(input, inheritedDirection);
        }
        normalizeBaselineConfig(entityConfig, cardConfig) {
          return normalizeBaselineConfig(entityConfig, cardConfig);
        }
        inferSegmentEndValues(segments, fallbackEnd = null) {
          return inferSegmentEndValues2(segments, fallbackEnd);
        }
        normalizeSeverityToSegments(input) {
          return normalizeSeverityToSegments(input);
        }
        _hasResolvableMagnitude(resolvable) {
          return !!resolvable && (Number.isFinite(this._getFiniteNumber(resolvable.fixed)) || Number.isFinite(resolvable.percent));
        }
        normalizeGaugeSegments(input) {
          return normalizeGaugeSegments(input);
        }
        normalizeScaleBound(entityConfig, cardConfig, key, defaultValue) {
          return normalizeScaleBound(entityConfig, cardConfig, key, defaultValue);
        }
        normalizeScaleConfig(entityConfig, cardConfig) {
          return normalizeScaleConfig(entityConfig, cardConfig);
        }
        _fillStyleToColorMode(fillStyle) {
          return fillStyleToColorMode(fillStyle);
        }
        _colorModeToFillStyle(colorMode) {
          return colorModeToFillStyle(colorMode);
        }
        _normalizeBarModeConfig(barConfig = null, flatColorMode = null) {
          return normalizeBarModeConfig(barConfig, flatColorMode);
        }
        _resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig) {
          return resolveNormalizedBarMode(entityBar, entityConfig, cardBar, cardConfig);
        }
        _normalizeGradientStops(input) {
          return normalizeGradientStops(input);
        }
        normalizeNeedleConfig(input, inheritedNeedle = null) {
          return normalizeNeedleConfig(input, inheritedNeedle);
        }
        normalizeBarConfig(entityConfig, cardConfig) {
          return normalizeBarConfig(entityConfig, cardConfig);
        }
        normalizeLayoutConfig(entityConfig, cardConfig) {
          return normalizeLayoutConfig(entityConfig, cardConfig);
        }
        _clampSupportedRowHeight(height) {
          return clampSupportedRowHeight(height);
        }
        normalizeFormattingConfig(entityConfig, cardConfig) {
          return normalizeFormattingConfig(entityConfig, cardConfig);
        }
        normalizeTargetMarkerConfig(entityConfig, cardConfig) {
          return normalizeTargetMarkerConfig(entityConfig, cardConfig);
        }
        normalizePeakMarkerConfig(entityConfig, cardConfig) {
          return normalizePeakMarkerConfig(entityConfig, cardConfig);
        }
        _normalizeOptionalEnabled(value) {
          return normalizeOptionalEnabled(value);
        }
        set hass(hass) {
          const oldHass = this._hass;
          this._hass = hass;
          if (!this._config.entities) return;
          if (!oldHass) {
            this._update();
            return;
          }
          if (this._shouldUpdate(oldHass, hass)) {
            this._update(oldHass);
          }
        }
        // Merge global config with per-entity overrides
        _resolve(entityCfg) {
          var _a, _b, _c, _d, _e, _f, _g;
          const ecfg = (entityCfg == null ? void 0 : entityCfg._normalized) ? entityCfg : this.normalizeEntityConfig(entityCfg, this._config);
          const stateObj = (_c = (_b = (_a = this._hass) == null ? void 0 : _a.states) == null ? void 0 : _b[ecfg.entity]) != null ? _c : null;
          return {
            ...ecfg,
            icon: ecfg.icon === false ? false : (_f = (_e = ecfg.icon) != null ? _e : (_d = stateObj == null ? void 0 : stateObj.attributes) == null ? void 0 : _d.icon) != null ? _f : this._getDefaultEntityIcon(stateObj, ecfg.entity),
            name: (_g = ecfg.name) != null ? _g : null
          };
        }
        _getStateTimestamp(stateObj) {
          var _a;
          const rawTimestamp = (_a = stateObj == null ? void 0 : stateObj.last_updated) != null ? _a : stateObj == null ? void 0 : stateObj.last_changed;
          const timestamp = rawTimestamp instanceof Date ? rawTimestamp.getTime() : Date.parse(String(rawTimestamp != null ? rawTimestamp : ""));
          return Number.isFinite(timestamp) ? timestamp : Date.now();
        }
        _updateExtrema(entityCfg, normalizedEntity, stateObj) {
          var _a, _b, _c;
          const sample = getFiniteNumber(stateObj == null ? void 0 : stateObj.state);
          if (!Number.isFinite(sample)) return;
          const current = (_a = this._extrema.get(entityCfg)) != null ? _a : {};
          const timestamp = this._getStateTimestamp(stateObj);
          for (const key of ["peak", "floor"]) {
            const marker = normalizedEntity == null ? void 0 : normalizedEntity[`${key}_marker`];
            if ((marker == null ? void 0 : marker.show) !== true) {
              delete current[key];
              continue;
            }
            current[key] = updateExtremum(
              (_b = current[key]) != null ? _b : null,
              sample,
              (_c = marker.reset) != null ? _c : { kind: "never" },
              key === "floor" ? "min" : "max",
              timestamp
            );
          }
          if (current.peak || current.floor) {
            this._extrema.set(entityCfg, current);
          } else {
            this._extrema.delete(entityCfg);
          }
        }
        _getDefaultEntityIcon(stateObj, entityId = "") {
          var _a, _b, _c;
          const deviceClass = String((_b = (_a = stateObj == null ? void 0 : stateObj.attributes) == null ? void 0 : _a.device_class) != null ? _b : "").trim();
          if (deviceClass) {
            const deviceClassIcons = {
              apparent_power: "mdi:flash",
              battery: "mdi:battery",
              carbon_dioxide: "mdi:molecule-co2",
              current: "mdi:current-ac",
              energy: "mdi:lightning-bolt",
              gas: "mdi:meter-gas",
              humidity: "mdi:water-percent",
              monetary: "mdi:cash",
              power: "mdi:flash",
              pressure: "mdi:gauge",
              temperature: "mdi:thermometer",
              voltage: "mdi:sine-wave",
              water: "mdi:water",
              weight: "mdi:weight",
              wind_speed: "mdi:weather-windy"
            };
            if (deviceClassIcons[deviceClass]) {
              return deviceClassIcons[deviceClass];
            }
          }
          const domain = String(entityId || "").split(".")[0];
          const domainIcons = {
            sensor: "mdi:eye",
            binary_sensor: "mdi:radiobox-marked",
            switch: "mdi:toggle-switch-variant",
            light: "mdi:lightbulb"
          };
          return (_c = domainIcons[domain]) != null ? _c : null;
        }
        _shouldUpdate(oldHass, newHass) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
          if (!this._config || !this._config.entities) return true;
          for (const entityCfg of this._config.entities) {
            const ecfg = this._resolve(entityCfg);
            const entitiesToWatch = [
              entityCfg.entity,
              (_b = (_a = ecfg.scale) == null ? void 0 : _a.min) == null ? void 0 : _b.entity,
              (_d = (_c = ecfg.scale) == null ? void 0 : _c.max) == null ? void 0 : _d.entity,
              (_f = (_e = ecfg.baseline) == null ? void 0 : _e.at) == null ? void 0 : _f.entity,
              (_h = (_g = ecfg.target_marker) == null ? void 0 : _g.source) == null ? void 0 : _h.entity,
              ...((_i = ecfg.generic_markers) != null ? _i : []).filter((marker) => marker.accepted).flatMap((marker) => {
                var _a2, _b2;
                return [(_a2 = marker.source) == null ? void 0 : _a2.entity, (_b2 = marker.label) == null ? void 0 : _b2.entity];
              })
            ].filter(Boolean);
            for (const ent of entitiesToWatch) {
              const oldState = (_j = oldHass.states[ent]) != null ? _j : null;
              const newState = (_k = newHass.states[ent]) != null ? _k : null;
              if (oldState !== newState) {
                return true;
              }
            }
          }
          return false;
        }
        _setStyleIfChanged(el, prop, value) {
          return setStyleIfChanged(el, prop, value);
        }
        _setStyleTextIfChanged(el, value) {
          return setStyleTextIfChanged(el, value);
        }
        _setTextIfChanged(el, value) {
          var _a;
          if (!el) return false;
          const nextValue = value == null ? "" : String(value);
          if (((_a = el.textContent) != null ? _a : "") === nextValue) return false;
          el.textContent = nextValue;
          return true;
        }
        _setDatasetIfChanged(el, key, value) {
          return setDatasetIfChanged(el, key, value);
        }
        _setClassNameIfChanged(el, value) {
          return setClassNameIfChanged(el, value);
        }
        _repositionAllTargetLabels() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".row[data-entity]").forEach((row) => {
            this._positionTargetLabel(row);
            this._positionMarkerValueLabel(row, ".peak-value-label", ".peak-marker");
            this._positionMarkerValueLabel(row, ".floor-value-label", ".floor-marker");
            this._positionGenericMarkerLabels(row);
          });
        }
        _positionGenericMarkerLabels(row) {
          var _a, _b;
          ((_b = (_a = row.querySelectorAll) == null ? void 0 : _a.call(row, ".generic-value-label[data-marker-id]")) != null ? _b : []).forEach((label) => {
            const id = label.dataset.markerId;
            this._positionMarkerValueLabel(
              row,
              `.generic-value-label[data-marker-id="${id}"]`,
              `.generic-marker[data-marker-id="${id}"]`
            );
          });
        }
        _positionTargetLabel(row) {
          this._positionMarkerValueLabel(row, ".target-value-label", ".target-marker");
        }
        _getMarkerLabel(markerEl) {
          var _a;
          const row = markerEl == null ? void 0 : markerEl.closest(".row");
          if (!row) return null;
          if (markerEl.matches(".generic-marker[data-marker-id]")) {
            const markerId = markerEl.dataset.markerId;
            return (_a = [...row.querySelectorAll(".generic-value-label[data-marker-id]")].find((label) => label.dataset.markerId === markerId)) != null ? _a : null;
          }
          const labelSelector = markerEl.matches(".target-marker") ? ".target-value-label" : markerEl.matches(".peak-marker") ? ".peak-value-label" : markerEl.matches(".floor-marker") ? ".floor-value-label" : null;
          return labelSelector ? row.querySelector(labelSelector) : null;
        }
        _getGenericMarkerForLabel(labelEl) {
          var _a, _b;
          const row = labelEl == null ? void 0 : labelEl.closest(".row");
          const markerId = (_a = labelEl == null ? void 0 : labelEl.dataset) == null ? void 0 : _a.markerId;
          if (!row || !markerId) return null;
          return (_b = [...row.querySelectorAll(".generic-marker[data-marker-id]")].find((marker) => marker.dataset.markerId === markerId)) != null ? _b : null;
        }
        _setMarkerHover(markerEl) {
          var _a;
          const label = this._getMarkerLabel(markerEl);
          if (!label || markerEl.style.display === "none" || getComputedStyle(label).visibility !== "visible") {
            this._clearMarkerHover(markerEl);
            return;
          }
          if (((_a = this._markerHover) == null ? void 0 : _a.label) === label) return;
          this._clearMarkerHover();
          label.dataset.markerHovered = "true";
          this._markerHover = { marker: markerEl, label };
        }
        _clearMarkerHover(markerEl = null) {
          if (!this._markerHover || markerEl && this._markerHover.marker !== markerEl) return;
          delete this._markerHover.label.dataset.markerHovered;
          this._markerHover = null;
        }
        _handleMarkerPointerOver(event) {
          var _a, _b, _c;
          if (event.pointerType === "touch") return;
          const target = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, '.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');
          const markerEl = ((_c = target == null ? void 0 : target.matches) == null ? void 0 : _c.call(target, ".generic-value-label")) ? this._getGenericMarkerForLabel(target) : target;
          if (markerEl) this._setMarkerHover(markerEl);
        }
        _handleMarkerPointerOut(event) {
          var _a, _b;
          if (event.pointerType === "touch") return;
          const target = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, '.generic-value-label[data-show-marker="false"], .generic-marker, .target-marker, .peak-marker, .floor-marker');
          if (!target || target.contains(event.relatedTarget)) return;
          const markerEl = target.matches(".generic-value-label") ? this._getGenericMarkerForLabel(target) : target;
          if (!markerEl) return;
          this._clearMarkerHover(markerEl);
        }
        _positionMarkerValueLabel(row, labelSelector, markerSelector) {
          const track = row.querySelector(".bar-track");
          const label = row.querySelector(labelSelector);
          const marker = row.querySelector(markerSelector);
          if (!track || !label || !marker) return;
          if (marker.style.display === "none" || !label.textContent.trim()) {
            this._setStyleIfChanged(label, "visibility", "hidden");
            return;
          }
          const trackRect = track.getBoundingClientRect();
          const maxLabelWidth = Math.max(0, Math.floor(trackRect.width - 4));
          this._setStyleIfChanged(label, "maxWidth", `${maxLabelWidth}px`);
          const labelRect = label.getBoundingClientRect();
          const markerPercent = parseFloat(marker.style.left);
          if (!Number.isFinite(markerPercent) || trackRect.width <= 0 || labelRect.width <= 0 || maxLabelWidth <= 10) {
            this._setStyleIfChanged(label, "visibility", "hidden");
            return;
          }
          const markerX = markerPercent / 100 * trackRect.width;
          const halfLabel = labelRect.width / 2;
          const clampedX = Math.max(halfLabel, Math.min(trackRect.width - halfLabel, markerX));
          this._setStyleIfChanged(label, "left", `${clampedX}px`);
          this._setStyleIfChanged(label, "transform", "translateX(-50%)");
          this._setStyleIfChanged(label, "visibility", "visible");
        }
        _getEntityNumericValue(entityId) {
          return getEntityNumericValue(this._hass, entityId);
        }
        _getNumericValue(value, entityId = null) {
          return getNumericValue(this._hass, value, entityId);
        }
        _resolvePercentValue(percent, minValue, maxValue) {
          return resolvePercentValue(percent, minValue, maxValue);
        }
        _getNormalizedResolvableNumericValue(resolvable, minValue = null, maxValue = null) {
          return getNormalizedResolvableNumericValue(this._hass, resolvable, minValue, maxValue);
        }
        _hexToRgb(color) {
          return hexToRgb(color);
        }
        _getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
          return getSeverityInterpolationStops(ecfg, minValue, maxValue);
        }
        _getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
          return getSeverityBandGradientCss(ecfg, minValue, maxValue);
        }
        _getSoftBandBlendWidthPct() {
          return getSoftBandBlendWidthPct();
        }
        _pushGradientColorStop(stops, pos, color) {
          return pushGradientColorStop(stops, pos, color);
        }
        _getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
          return getSoftBandGradientStops(ecfg, minValue, maxValue);
        }
        _getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
          return getSoftBandGradientCss(ecfg, minValue, maxValue);
        }
        _resolveSegmentBoundaryPct(boundary, minValue, maxValue) {
          return resolveSegmentBoundaryPct(boundary, minValue, maxValue);
        }
        _getEffectiveFillStyle(ecfg) {
          return getEffectiveFillStyle(ecfg);
        }
        _segmentsNeedBoundaryResolution(segments) {
          return segmentsNeedBoundaryResolution(segments);
        }
        _getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
          return getSegmentsForRendering(ecfg, minValue, maxValue);
        }
        _getColor(pct, ecfg, minValue = 0, maxValue = 100) {
          return getColor(pct, ecfg, minValue, maxValue);
        }
        _buildFullScaleGradientStyle(stops) {
          return buildFullScaleGradientStyle(stops);
        }
        _getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
          return getGradientInterpolationStops(ecfg, minValue, maxValue);
        }
        _rgbToCss(rgb) {
          return rgbToCss(rgb);
        }
        _buildSolidGradientStyle(color) {
          return buildSolidGradientStyle(color);
        }
        _getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100) {
          return getBasePaintGradient(color, ecfg, minValue, maxValue);
        }
        _getOverlayGradient(startPct, endPct, color) {
          return getOverlayGradient(startPct, endPct, color);
        }
        _toScalePct(value, minValue, maxValue) {
          return toScalePct2(value, minValue, maxValue);
        }
        _getRevealTransitionDuration(previousGeometry, nextGeometry) {
          return getRevealTransitionDuration(previousGeometry, nextGeometry);
        }
        _resolveBaselinePct(ecfg, safeMin, safeMax) {
          var _a, _b;
          if (((_a = ecfg.baseline) == null ? void 0 : _a.enabled) === false) return null;
          const baselineValue = this._getNormalizedResolvableNumericValue((_b = ecfg.baseline) == null ? void 0 : _b.at, safeMin, safeMax);
          if (!Number.isFinite(baselineValue)) return null;
          return this._toScalePct(baselineValue, safeMin, safeMax);
        }
        _formatNumericDisplay(rawVal, decimal = null) {
          return formatNumericDisplay(rawVal, decimal);
        }
        _getNormalizedPercent(valuePct, baselinePct = null) {
          return getNormalizedPercent(valuePct, baselinePct);
        }
        _getEndpointSemantics(geometry) {
          return getEndpointSemantics(geometry);
        }
        _getRevealCornerRadii(geometry) {
          return getRevealCornerRadii(geometry);
        }
        _getAboveTargetOverlayInterval(targetPct = null) {
          return getAboveTargetOverlayInterval(targetPct);
        }
        _getAboveTargetLayerGeometry(targetPct = null) {
          return getAboveTargetLayerGeometry(targetPct);
        }
        _getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
          return getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue);
        }
        _getRevealShapeStyle(geometry, h) {
          return getRevealShapeStyle(geometry, h);
        }
        _getStaticLayerRevealStyle(geometry) {
          return getStaticLayerRevealStyle(geometry);
        }
        _getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
          return getFillPaintLayers(geometry, h, ecfg, color, targetPct, baselinePct, minValue, maxValue);
        }
        _getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
          return getFillRenderState(pct, h, ecfg, color, targetPct, baselinePct, minValue, maxValue, needleActive);
        }
        _getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null) {
          return getNeedleRenderState(rawValue, ecfg, minValue, maxValue, baselinePct);
        }
        _ensureBaseDom() {
          if (this._baseDomReady) return;
          if (this.shadowRoot.querySelector("ha-card")) {
            this._baseDomReady = true;
            return;
          }
          this.shadowRoot.innerHTML = `
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
${barTrackStyles}
${getBarAnimationStyles('.row[data-bar-animated="false"]')}
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
${barMarkerStyles}
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
    `;
          this.shadowRoot.addEventListener("pointerover", this._boundMarkerPointerOver);
          this.shadowRoot.addEventListener("pointerout", this._boundMarkerPointerOut);
          this._baseDomReady = true;
        }
        _render() {
          const cfg = this._config;
          this._ensureBaseDom();
          const titleEl = this.shadowRoot.querySelector(".card-title");
          if (titleEl) {
            if (cfg.title) {
              titleEl.textContent = cfg.title;
              titleEl.style.display = "";
            } else {
              titleEl.textContent = "";
              titleEl.style.display = "none";
            }
          }
          this._setupResizeObserver();
          this._update();
          this._schedulePostLayoutDensityPass();
        }
        _setupResizeObserver() {
          if (!this.isConnected || this._resizeObserver) return;
          const surface = this.shadowRoot.querySelector("ha-card");
          const card = this.shadowRoot.querySelector(".card");
          if (!surface || !card) return;
          const observer = new ResizeObserver(() => {
            if (!this.isConnected || this._resizeObserver !== observer) return;
            this._applyCompactTier();
            this._schedulePostLayoutDensityPass();
          });
          this._resizeObserver = observer;
          this._applyCompactTier();
          observer.observe(surface);
          observer.observe(this);
        }
        _disconnectResizeObserver() {
          if (!this._resizeObserver) return;
          this._resizeObserver.disconnect();
          this._resizeObserver = null;
        }
        _isReliableWidth(width, minWidth = 16) {
          return Number.isFinite(width) && width >= minWidth;
        }
        _getHeroLabelReservedWidth(headerEl, labelEl, labelHidden) {
          var _a, _b, _c;
          if (labelHidden || !headerEl || !labelEl) return 0;
          const headerWidth = Math.floor((_b = (_a = headerEl.getBoundingClientRect) == null ? void 0 : _a.call(headerEl).width) != null ? _b : 0);
          const naturalLabelWidth = Math.ceil(labelEl.scrollWidth || ((_c = labelEl.getBoundingClientRect) == null ? void 0 : _c.call(labelEl).width) || 0);
          if (!this._isReliableWidth(headerWidth, 8) || !Number.isFinite(naturalLabelWidth) || naturalLabelWidth <= 0) {
            return 0;
          }
          return Math.min(naturalLabelWidth, headerWidth * 0.45);
        }
        _classifyCompactTier(width, currentTier = "normal") {
          if (!this._isReliableWidth(width)) return currentTier || "normal";
          if (width < 180) return "compressed";
          if (width < 220) return "dense";
          if (width < 280) return "tight";
          if (width < 360) return "compact";
          return "normal";
        }
        _classifyLeftDensity(width, currentDensity = "normal", naturalLabelWidth = Number.POSITIVE_INFINITY) {
          if (!this._isReliableWidth(width)) return currentDensity || "normal";
          const densities = ["normal", "compact", "tight", "dense", "compressed"];
          let density = "normal";
          if (width < 170) density = "compressed";
          else if (width < 210) density = "dense";
          else if (width < 255) density = "tight";
          else if (width < 320) density = "compact";
          const currentIndex = densities.indexOf(density);
          const relaxBy = Number.isFinite(naturalLabelWidth) ? naturalLabelWidth <= 44 && width >= 205 ? 2 : naturalLabelWidth <= 72 && width >= 185 ? 1 : 0 : 0;
          return densities[Math.max(0, currentIndex - relaxBy)];
        }
        _classifyRowDensity(width, currentDensity = "normal") {
          if (!this._isReliableWidth(width)) return currentDensity || "normal";
          if (width < 150) return "compressed";
          if (width < 190) return "dense";
          if (width < 245) return "tight";
          if (width < 300) return "compact";
          return "normal";
        }
        _schedulePostLayoutDensityPass() {
          if (!this.isConnected) return;
          if (this._densityPassScheduled) {
            this._densityPassDirty = true;
            return;
          }
          this._densityPassScheduled = true;
          this._densityPassFrame = requestAnimationFrame(() => {
            var _a, _b;
            this._densityPassScheduled = false;
            this._densityPassFrame = null;
            const runAgain = this._densityPassDirty;
            this._densityPassDirty = false;
            if (!this.isConnected) return;
            const surface = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector("ha-card");
            const width = (_b = surface == null ? void 0 : surface.getBoundingClientRect().width) != null ? _b : 0;
            if (!this._isReliableWidth(width)) {
              if (this._densityPassRetries < 4) {
                this._densityPassRetries += 1;
                this._schedulePostLayoutDensityPass();
              }
              return;
            }
            this._densityPassRetries = 0;
            this._applyCompactTier();
            this._runPostLayoutPasses();
            if (runAgain) {
              this._schedulePostLayoutDensityPass();
            }
          });
        }
        _applyCompactTier() {
          if (!this.shadowRoot) return;
          const surface = this.shadowRoot.querySelector("ha-card");
          const card = this.shadowRoot.querySelector(".card");
          if (!surface || !card) return;
          const width = surface.getBoundingClientRect().width;
          if (!this._isReliableWidth(width)) {
            this._schedulePostLayoutDensityPass();
            if (!card.dataset.compact) card.dataset.compact = "normal";
            return;
          }
          card.dataset.compact = this._classifyCompactTier(width, card.dataset.compact);
        }
        _applyLeftModeDensity() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach((mainLine) => {
            const width = mainLine.getBoundingClientRect().width;
            if (!this._isReliableWidth(width)) {
              this._schedulePostLayoutDensityPass();
              if (!mainLine.dataset.leftDensity) mainLine.dataset.leftDensity = "normal";
              return;
            }
            const labelText = mainLine.querySelector(".label-left-text");
            const text = ((labelText == null ? void 0 : labelText.textContent) || "").trim();
            const naturalLabelWidth = labelText ? this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth : Number.POSITIVE_INFINITY;
            const density = this._classifyLeftDensity(width, mainLine.dataset.leftDensity, naturalLabelWidth);
            mainLine.dataset.leftDensity = density;
          });
        }
        _applyInsideLabelDensity() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".bar-inner-label").forEach((innerLabel) => {
            var _a, _b, _c, _d, _e, _f;
            const track = innerLabel.closest(".bar-track");
            const mainLine = innerLabel.closest(".main-line");
            const nameEl = innerLabel.querySelector(".inside-name");
            const valueEl = innerLabel.querySelector(".inside-value");
            if (!track || !nameEl || !valueEl) return;
            const display = this._decodeDataAttr(valueEl.dataset.display || valueEl.textContent || "");
            const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
            valueEl.dataset.valueFit = "normal";
            innerLabel.dataset.valueFit = "normal";
            const fullWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, false);
            const numberWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, true);
            const rowWidth = (_b = (_a = mainLine == null ? void 0 : mainLine.getBoundingClientRect) == null ? void 0 : _a.call(mainLine).width) != null ? _b : 0;
            const rowDensity = this._isReliableWidth(rowWidth) ? this._classifyRowDensity(rowWidth, (_c = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _c.rowDensity) : ((_d = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _d.rowDensity) || "normal";
            const iconWrap = (_f = (_e = mainLine == null ? void 0 : mainLine.querySelector) == null ? void 0 : _e.call(mainLine, ".icon-wrap")) != null ? _f : null;
            const iconReserve = iconWrap ? this._getLeftModeIconWidth(iconWrap, mainLine) + this._getLeftModeGap(mainLine) : 0;
            const minimum = this._getLeftModeBarMinWidth(mainLine);
            const withIconWidth = this._isReliableWidth(rowWidth) ? Math.max(minimum, rowWidth - iconReserve) : track.getBoundingClientRect().width;
            const withoutIconWidth = this._isReliableWidth(rowWidth) ? Math.max(minimum, rowWidth) : withIconWidth + iconReserve;
            const nameText = (nameEl.textContent || "").trim();
            const nameWidth = this._measureTextWidthWithStyles(nameEl, nameText) || nameEl.scrollWidth;
            const candidate = (trackWidth) => {
              const density = rowDensity === "compressed" ? "compressed" : this._classifyInsideDensity(trackWidth, fullWidth);
              innerLabel.dataset.insideDensity = density;
              innerLabel.dataset.valueFit = "normal";
              valueEl.dataset.valueFit = "normal";
              const padding = this._getNumericStyleValue(innerLabel, "padding-left", 0) + this._getNumericStyleValue(innerLabel, "padding-right", 0);
              let cap = Math.max(0, trackWidth - padding);
              const hideUnit = !!unit && fullWidth > cap;
              let readingWidth = hideUnit ? numberWidth : fullWidth;
              let valueFit = "normal";
              if (readingWidth > cap) {
                valueFit = "compact";
                innerLabel.dataset.valueFit = valueFit;
                valueEl.dataset.valueFit = valueFit;
                cap = Math.max(0, trackWidth - this._getNumericStyleValue(innerLabel, "padding-left", 0) - this._getNumericStyleValue(innerLabel, "padding-right", 0));
                readingWidth = this._measureInsideValueMarkupWidth(valueEl, display, unit, true);
              }
              const hideValue = readingWidth > cap;
              const gap = hideValue ? 0 : this._getNumericStyleValue(innerLabel, "gap", 0);
              const nameShare = density === "compact" ? 0.56 : density === "tight" ? 0.48 : 0.6;
              const availableNameWidth = Math.max(
                0,
                Math.min(cap * nameShare, cap - (hideValue ? 0 : Math.ceil(readingWidth)) - gap)
              );
              let hideName = density === "dense" || density === "compressed";
              if (nameText && nameWidth > 0) {
                const usefulWidth = this._getInsideUsefulNameWidth(nameEl, nameText, nameWidth);
                const visibleChars = this._measureVisibleLabelCharacters(nameEl, nameText, availableNameWidth);
                hideName = availableNameWidth < usefulWidth || nameWidth > availableNameWidth + 1 && visibleChars < Math.min(4, nameText.length);
              }
              return {
                density,
                valueFit,
                hideUnit,
                hideValue,
                hideName,
                rank: hideValue ? 3 : valueFit === "compact" ? 2 : hideUnit ? 1 : 0
              };
            };
            let hideIcon = rowDensity === "dense" || rowDensity === "compressed";
            let chosen = candidate(hideIcon ? withoutIconWidth : withIconWidth);
            if (iconWrap && !hideIcon) {
              const withoutIcon = candidate(withoutIconWidth);
              if (withoutIcon.rank < chosen.rank || withoutIcon.rank === chosen.rank && chosen.hideName && !withoutIcon.hideName) {
                hideIcon = true;
                chosen = withoutIcon;
              }
            }
            innerLabel.dataset.insideDensity = chosen.density;
            innerLabel.dataset.valueFit = chosen.valueFit;
            innerLabel.dataset.hideName = chosen.hideName ? "true" : "false";
            valueEl.dataset.valueFit = chosen.valueFit;
            valueEl.dataset.hideUnit = chosen.hideUnit ? "true" : "false";
            valueEl.dataset.hideValue = chosen.hideValue ? "true" : "false";
            if (mainLine) mainLine.dataset.hideInsideIcon = hideIcon ? "true" : "false";
          });
        }
        _classifyInsideDensity(trackWidth, valueWidth) {
          if (trackWidth < Math.max(72, valueWidth + 12)) return "compressed";
          if (trackWidth < valueWidth + 56) return "dense";
          if (trackWidth < valueWidth + 92) return "tight";
          if (trackWidth < valueWidth + 128) return "compact";
          return "normal";
        }
        _applyRowDensity() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".main-line").forEach((mainLine) => {
            const width = mainLine.getBoundingClientRect().width;
            if (!this._isReliableWidth(width)) {
              this._schedulePostLayoutDensityPass();
              if (!mainLine.dataset.rowDensity) mainLine.dataset.rowDensity = "normal";
              return;
            }
            mainLine.dataset.rowDensity = this._classifyRowDensity(width, mainLine.dataset.rowDensity);
          });
        }
        _applyAboveLabelDensity() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".above-line, .hero-line").forEach((aboveLine) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
            const label = aboveLine.querySelector(".above-bar-label, .hero-header");
            if (!label) return;
            const isHeroLine = aboveLine.classList.contains("hero-line");
            const width = isHeroLine ? this._getHeroDensityWidth(aboveLine) : label.getBoundingClientRect().width;
            let density = "normal";
            if (width < 90) density = "xs";
            else if (width < 110) density = "compressed";
            else if (width < 150) density = "dense";
            else if (width < 210) density = "tight";
            else if (width < 280) density = "compact";
            if (isHeroLine) {
              aboveLine.dataset.heroDensity = density;
              label.dataset.hideName = density === "dense" || density === "compressed" || density === "xs" ? "true" : "false";
              aboveLine.dataset.hideHeroIcon = density === "compressed" || density === "xs" ? "true" : "false";
              return;
            }
            aboveLine.dataset.aboveDensity = density;
            const labelText = typeof label.querySelector === "function" ? label.querySelector(".above-bar-label-name") : null;
            const valueEl = typeof label.querySelector === "function" ? label.querySelector(".above-bar-label-value") : null;
            const display = this._decodeDataAttr(((_a = valueEl == null ? void 0 : valueEl.dataset) == null ? void 0 : _a.display) || "");
            const unit = this._decodeDataAttr(((_b = valueEl == null ? void 0 : valueEl.dataset) == null ? void 0 : _b.unit) || "");
            const row = (_c = aboveLine.closest) == null ? void 0 : _c.call(aboveLine, ".row");
            const mainLine = (_d = row == null ? void 0 : row.querySelector) == null ? void 0 : _d.call(row, ".main-line.above-mode");
            const rowDensity = ((_e = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _e.rowDensity) || "normal";
            const iconWrap = (_g = (_f = mainLine == null ? void 0 : mainLine.querySelector) == null ? void 0 : _f.call(mainLine, ".icon-wrap")) != null ? _g : null;
            const iconRect = (_h = iconWrap == null ? void 0 : iconWrap.getBoundingClientRect) == null ? void 0 : _h.call(iconWrap);
            const iconStyle = iconWrap && typeof getComputedStyle === "function" ? getComputedStyle(iconWrap) : null;
            const mainIconVisible = !!iconWrap && rowDensity !== "compressed" && (iconStyle == null ? void 0 : iconStyle.display) !== "none" && ((_i = iconRect == null ? void 0 : iconRect.width) != null ? _i : 0) > 0 && ((_j = iconRect == null ? void 0 : iconRect.height) != null ? _j : 0) > 0;
            let hideName = density === "dense" || density === "compressed";
            let hideSpacer = !mainIconVisible;
            if (labelText && valueEl && display) {
              const rowStack = (_k = aboveLine.closest) == null ? void 0 : _k.call(aboveLine, ".row-stack");
              const lineWidth = (_o = (_n = (_l = rowStack == null ? void 0 : rowStack.getBoundingClientRect) == null ? void 0 : _l.call(rowStack).width) != null ? _n : (_m = aboveLine.getBoundingClientRect) == null ? void 0 : _m.call(aboveLine).width) != null ? _o : width;
              const spacerEl = typeof aboveLine.querySelector === "function" ? aboveLine.querySelector(".above-icon-spacer") : null;
              const spacerWidth = mainIconVisible ? iconRect.width : 0;
              const lineGap = spacerEl ? this._getNumericStyleValue(aboveLine, "gap", 0) : 0;
              const labelGap = this._getNumericStyleValue(aboveLine, "--sbcp-main-gap", this._getLeftModeGap(aboveLine));
              const fullValueWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
              const valueOnlyWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, true) + 2);
              const text = (labelText.textContent || "").trim();
              const spacerReserve = mainIconVisible && spacerWidth > 0 ? spacerWidth + lineGap : 0;
              const nameWidth = this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth || 0;
              const withNameBudget = Math.max(0, lineWidth - spacerReserve - labelGap);
              const fitsWithName = (valueWidth, budget = withNameBudget) => {
                const visibleWidth = Math.max(0, budget - valueWidth);
                const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
                return !this._shouldHideLeftLabel(text, nameWidth, visibleWidth, visibleChars);
              };
              const availableValueOnly = Math.max(0, lineWidth);
              let hideUnit = false;
              if (fullValueWidth <= withNameBudget && fitsWithName(fullValueWidth)) {
                hideName = false;
                hideSpacer = !mainIconVisible;
              } else if (fullValueWidth <= availableValueOnly) {
                hideName = !fitsWithName(fullValueWidth, lineWidth - labelGap);
                hideSpacer = true;
              } else if (valueOnlyWidth <= withNameBudget && fitsWithName(valueOnlyWidth)) {
                hideName = false;
                hideUnit = !!unit;
                hideSpacer = !mainIconVisible;
              } else if (fitsWithName(valueOnlyWidth, lineWidth - labelGap)) {
                hideName = false;
                hideSpacer = true;
                hideUnit = !!unit;
              } else {
                hideName = true;
                hideSpacer = true;
                hideUnit = !!unit && fullValueWidth > availableValueOnly;
              }
              valueEl.dataset.hideUnit = hideUnit ? "true" : "false";
            } else if (valueEl) {
              valueEl.dataset.hideUnit = "false";
            }
            label.dataset.hideName = hideName ? "true" : "false";
            aboveLine.dataset.hideAboveIcon = hideSpacer ? "true" : "false";
          });
        }
        _getHeroDensityWidth(heroLine) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          const row = (_a = heroLine == null ? void 0 : heroLine.closest) == null ? void 0 : _a.call(heroLine, ".row");
          const rowStack = (_b = heroLine == null ? void 0 : heroLine.closest) == null ? void 0 : _b.call(heroLine, ".row-stack");
          const mainLine = (_c = rowStack == null ? void 0 : rowStack.querySelector) == null ? void 0 : _c.call(rowStack, ".main-line.hero-mode");
          const barWrap = (_d = mainLine == null ? void 0 : mainLine.querySelector) == null ? void 0 : _d.call(mainLine, ".bar-wrap");
          const candidates = [
            (_e = row == null ? void 0 : row.getBoundingClientRect) == null ? void 0 : _e.call(row).width,
            (_f = rowStack == null ? void 0 : rowStack.getBoundingClientRect) == null ? void 0 : _f.call(rowStack).width,
            (_g = mainLine == null ? void 0 : mainLine.getBoundingClientRect) == null ? void 0 : _g.call(mainLine).width,
            (_h = barWrap == null ? void 0 : barWrap.getBoundingClientRect) == null ? void 0 : _h.call(barWrap).width,
            (_i = heroLine == null ? void 0 : heroLine.getBoundingClientRect) == null ? void 0 : _i.call(heroLine).width
          ];
          for (const width of candidates) {
            if (this._isReliableWidth(width, 8)) return width;
          }
          return 0;
        }
        _measureHeroValueWidth(heroLine, valueEl, valueFit = "normal", hideUnit = false) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
          const layer = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".measure-layer");
          if (!layer || !heroLine || !valueEl) return 0;
          const display = this._decodeDataAttr(valueEl.dataset.display || valueEl.textContent || "");
          const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
          if (!display) return 0;
          const wrapper = document.createElement("div");
          wrapper.className = "hero-line";
          wrapper.dataset.heroSize = heroLine.dataset.heroSize || "medium";
          wrapper.dataset.heroDensity = heroLine.dataset.heroDensity || "normal";
          wrapper.dataset.heroValueFit = valueFit;
          wrapper.dataset.hideHeroUnit = hideUnit ? "true" : "false";
          wrapper.style.display = "inline-block";
          this._setStyleIfChanged(
            wrapper,
            "--sbcp-hero-base-size",
            ((_c = (_b = heroLine.style) == null ? void 0 : _b.getPropertyValue) == null ? void 0 : _c.call(_b, "--sbcp-hero-base-size")) || null
          );
          const measureValue = document.createElement("span");
          measureValue.className = "hero-value";
          measureValue.dataset.display = valueEl.dataset.display || "";
          measureValue.dataset.unit = valueEl.dataset.unit || "";
          measureValue.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
          measureValue.style.display = "inline-flex";
          measureValue.style.flex = "0 0 auto";
          measureValue.style.width = "auto";
          measureValue.style.minWidth = "0";
          measureValue.style.maxWidth = "none";
          measureValue.style.justifyContent = "flex-start";
          measureValue.style.justifySelf = "start";
          measureValue.style.overflow = "visible";
          const text = measureValue.querySelector(".value-right-text");
          if (text) {
            text.style.display = "inline-flex";
            text.style.flex = "0 0 auto";
            text.style.width = "auto";
            text.style.minWidth = "0";
            text.style.maxWidth = "none";
            text.style.justifyContent = "flex-start";
            text.style.overflow = "visible";
          }
          const number = measureValue.querySelector(".value-right-number");
          if (number) {
            number.style.flex = "0 0 auto";
            number.style.minWidth = "0";
            number.style.overflow = "visible";
            number.style.textOverflow = "clip";
          }
          const unitGroup = measureValue.querySelector(".unit-group");
          if (unitGroup) {
            unitGroup.style.flex = "0 0 auto";
            unitGroup.style.minWidth = "0";
            unitGroup.style.overflow = "visible";
          }
          wrapper.appendChild(measureValue);
          layer.replaceChildren(wrapper);
          return Math.max(
            Math.ceil((_e = (_d = measureValue.getBoundingClientRect) == null ? void 0 : _d.call(measureValue).width) != null ? _e : 0),
            Math.ceil(measureValue.scrollWidth || 0),
            Math.ceil((_h = (_g = (_f = text == null ? void 0 : text.getBoundingClientRect) == null ? void 0 : _f.call(text).width) != null ? _g : text == null ? void 0 : text.scrollWidth) != null ? _h : 0),
            Math.ceil((_k = (_j = (_i = number == null ? void 0 : number.getBoundingClientRect) == null ? void 0 : _i.call(number).width) != null ? _j : number == null ? void 0 : number.scrollWidth) != null ? _k : 0),
            Math.ceil((_n = (_m = (_l = unitGroup == null ? void 0 : unitGroup.getBoundingClientRect) == null ? void 0 : _l.call(unitGroup).width) != null ? _m : unitGroup == null ? void 0 : unitGroup.scrollWidth) != null ? _n : 0)
          );
        }
        _applyHeroValueFit() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".hero-line").forEach((heroLine) => {
            var _a, _b;
            const headerEl = heroLine.querySelector(".hero-header");
            const labelEl = heroLine.querySelector(".hero-label");
            const valueEl = heroLine.querySelector(".hero-value");
            const unitGroup = heroLine.querySelector(".unit-group");
            if (!headerEl || !valueEl) return;
            heroLine.dataset.hideHeroUnit = "false";
            heroLine.dataset.heroValueFit = "normal";
            delete headerEl.dataset.priorityHideName;
            const headerWidth = Math.floor((_b = (_a = headerEl.getBoundingClientRect) == null ? void 0 : _a.call(headerEl).width) != null ? _b : 0);
            if (!this._isReliableWidth(headerWidth, 8)) {
              this._schedulePostLayoutDensityPass();
              return;
            }
            const hasUnit = !!unitGroup && unitGroup.textContent.trim().length > 0;
            const labelHiddenByDensity = headerEl.dataset.hideName === "true";
            const visibleLabelGap = !labelHiddenByDensity && labelEl ? this._getNumericStyleValue(headerEl, "column-gap", 0) : 0;
            const valueWidth = (valueFit = "normal", hideUnit = false) => this._measureHeroValueWidth(heroLine, valueEl, valueFit, hideUnit);
            const availableWithLabel = Math.max(0, headerWidth - visibleLabelGap - 4);
            const availableWithoutLabel = Math.max(0, headerWidth - 4);
            if (!this._isReliableWidth(availableWithoutLabel, 8)) {
              heroLine.dataset.hideHeroUnit = hasUnit ? "true" : "false";
              heroLine.dataset.heroValueFit = "minimum";
              this._schedulePostLayoutDensityPass();
              return;
            }
            if (valueWidth("normal", false) <= availableWithLabel) return;
            if (!labelHiddenByDensity && labelEl) {
              headerEl.dataset.priorityHideName = "true";
              if (valueWidth("normal", false) <= availableWithoutLabel) return;
            }
            if (hasUnit) {
              for (const fit of ["tight", "minimum"]) {
                const readingWidth = valueWidth(fit, false);
                if (readingWidth <= availableWithoutLabel) {
                  heroLine.dataset.heroValueFit = fit;
                  if (!labelHiddenByDensity && labelEl) {
                    const text = (labelEl.textContent || "").trim();
                    const nameWidth = this._measureTextWidthWithStyles(labelEl, text);
                    const availableName = Math.max(0, availableWithLabel - readingWidth);
                    if (!this._shouldHideLeftLabel(
                      text,
                      nameWidth,
                      availableName,
                      this._measureVisibleLabelCharacters(labelEl, text, availableName)
                    )) {
                      delete headerEl.dataset.priorityHideName;
                    }
                  }
                  return;
                }
              }
              heroLine.dataset.hideHeroUnit = "true";
              if (valueWidth("normal", true) <= availableWithoutLabel) return;
            }
            heroLine.dataset.heroValueFit = "tight";
            if (valueWidth("tight", hasUnit) <= availableWithoutLabel) return;
            heroLine.dataset.heroValueFit = "minimum";
            if (valueWidth("minimum", hasUnit) <= availableWithoutLabel) return;
            heroLine.dataset.heroValueFit = "hidden";
          });
        }
        _measureValueMarkupWidth(valueEl, display, unit, hideUnit) {
          var _a;
          const layer = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".measure-layer");
          if (!layer || !valueEl) return 0;
          const clone = valueEl.cloneNode(false);
          clone.removeAttribute("data-hide-unit");
          clone.style.removeProperty("--sbcp-value-extra-width");
          clone.style.width = "auto";
          clone.style.minWidth = "0";
          clone.style.maxWidth = "none";
          clone.style.flex = "0 0 auto";
          clone.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
          layer.replaceChildren(clone);
          return clone.scrollWidth;
        }
        _measureInsideValueMarkupWidth(valueEl, display, unit, hideUnit = false) {
          var _a;
          const layer = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".measure-layer");
          if (!layer || !valueEl) return (valueEl == null ? void 0 : valueEl.scrollWidth) || 0;
          const clone = valueEl.cloneNode(false);
          clone.style.width = "auto";
          clone.style.minWidth = "0";
          clone.style.maxWidth = "none";
          clone.style.flex = "0 0 auto";
          clone.style.overflow = "visible";
          clone.style.textOverflow = "clip";
          clone.style.whiteSpace = "nowrap";
          clone.innerHTML = this._formatInsideValueMarkup(display, unit, hideUnit);
          clone.removeAttribute("data-hide-value");
          const wrapper = document.createElement("div");
          wrapper.className = "bar-inner-label";
          wrapper.style.cssText = "position:static;display:block;padding:0";
          wrapper.appendChild(clone);
          layer.replaceChildren(wrapper);
          return clone.getBoundingClientRect().width;
        }
        _measureTextWidthWithStyles(sourceEl, text) {
          var _a;
          const layer = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".measure-layer");
          if (!layer || !sourceEl) return 0;
          const clone = sourceEl.cloneNode(false);
          clone.textContent = text;
          clone.style.width = "auto";
          clone.style.minWidth = "0";
          clone.style.maxWidth = "none";
          clone.style.flex = "0 0 auto";
          clone.style.overflow = "visible";
          clone.style.textOverflow = "clip";
          clone.style.whiteSpace = "nowrap";
          layer.replaceChildren(clone);
          return clone.scrollWidth;
        }
        _measureVisibleLabelCharacters(labelTextEl, text, visibleWidth) {
          if (!labelTextEl || !text || !Number.isFinite(visibleWidth) || visibleWidth <= 0) return 0;
          const ellipsisWidth = this._measureTextWidthWithStyles(labelTextEl, "...");
          const availableTextWidth = Math.max(0, visibleWidth - ellipsisWidth);
          if (availableTextWidth <= 0) return 0;
          let low = 0;
          let high = text.length;
          while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            const width = this._measureTextWidthWithStyles(labelTextEl, text.slice(0, mid));
            if (width <= availableTextWidth) {
              low = mid;
            } else {
              high = mid - 1;
            }
          }
          return low;
        }
        _shouldHideLeftLabel(text, fullWidth, visibleWidth, visibleChars) {
          if (!text) return false;
          if (!Number.isFinite(fullWidth) || !Number.isFinite(visibleWidth)) return false;
          const truncated = fullWidth > visibleWidth + 1;
          return truncated && visibleChars < 5;
        }
        _getInsideUsefulNameWidth(labelTextEl, text, fullWidth = NaN) {
          if (!text) return 0;
          const naturalWidth = Number.isFinite(fullWidth) && fullWidth > 0 ? fullWidth : this._measureTextWidthWithStyles(labelTextEl, text);
          const usefulChars = text.slice(0, Math.min(5, text.length));
          const usefulWidth = this._measureTextWidthWithStyles(labelTextEl, usefulChars) + this._measureTextWidthWithStyles(labelTextEl, "...");
          const minUsefulWidth = Math.max(36, Math.min(44, usefulWidth || 0));
          return Math.min(naturalWidth || minUsefulWidth, minUsefulWidth);
        }
        _applyValueWidthReservation() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".value-right").forEach((valueEl) => {
            var _a, _b, _c, _d, _e;
            const display = this._decodeDataAttr(valueEl.dataset.display || "");
            const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
            if (!display) {
              valueEl.style.setProperty("--sbcp-value-extra-width", "0px");
              return;
            }
            const getStyle = typeof globalThis.getComputedStyle === "function" && globalThis.getComputedStyle.bind(globalThis) || typeof window !== "undefined" && typeof window.getComputedStyle === "function" && window.getComputedStyle.bind(window) || ((_c = (_b = (_a = valueEl == null ? void 0 : valueEl.ownerDocument) == null ? void 0 : _a.defaultView) == null ? void 0 : _b.getComputedStyle) == null ? void 0 : _c.bind(valueEl.ownerDocument.defaultView));
            if (!getStyle) return;
            const style = getStyle(valueEl);
            const baseWidth = parseFloat(style.getPropertyValue("--sbcp-value-width")) || valueEl.clientWidth || 0;
            const fullWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
            const mainLine = valueEl.closest(".main-line");
            let desiredWidth = fullWidth;
            if (mainLine == null ? void 0 : mainLine.classList.contains("off-mode")) {
              const barWrap = mainLine.querySelector(".bar-wrap");
              const iconWrap = mainLine.querySelector(".icon-wrap");
              mainLine.dataset.hideOffIcon = "false";
              const gap = parseFloat(getStyle(mainLine).gap) || 0;
              const rowWidth = (_e = (_d = mainLine.getBoundingClientRect) == null ? void 0 : _d.call(mainLine).width) != null ? _e : 0;
              const minimumRail = parseFloat(getStyle(barWrap).minWidth) || 0;
              const iconVisible = iconWrap && getStyle(iconWrap).display !== "none";
              const iconWidth = iconVisible ? this._getLeftModeIconWidth(iconWrap, mainLine) : 0;
              const withoutIcon = Math.max(0, rowWidth - minimumRail - gap);
              const withIcon = withoutIcon - (iconVisible ? iconWidth + gap : 0);
              const numberWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, true) + 2);
              const hideIcon = iconVisible && (fullWidth > withIcon && fullWidth <= withoutIcon || numberWidth > withIcon && numberWidth <= withoutIcon);
              mainLine.dataset.hideOffIcon = hideIcon ? "true" : "false";
              const availableWidth = hideIcon ? withoutIcon : withIcon;
              if (availableWidth > 0) {
                const readableWidth = fullWidth <= availableWidth ? fullWidth : numberWidth;
                desiredWidth = Math.min(readableWidth, availableWidth);
              }
            }
            const extraWidth = Math.max(0, desiredWidth - baseWidth);
            valueEl.style.setProperty("--sbcp-value-extra-width", `${extraWidth}px`);
          });
        }
        _applyValueVisibility() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".value-right, .top-right-value, .above-bar-label-value").forEach((valueEl) => {
            var _a, _b, _c, _d;
            const display = this._decodeDataAttr(valueEl.dataset.display || "");
            const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
            let hideUnit = valueEl.dataset.hideUnit === "true";
            const isAboveValue = (_a = valueEl.classList) == null ? void 0 : _a.contains("above-bar-label-value");
            if (!isAboveValue && display) {
              const availableWidth = (_d = (_c = (_b = valueEl.getBoundingClientRect) == null ? void 0 : _b.call(valueEl).width) != null ? _c : valueEl.clientWidth) != null ? _d : 0;
              const fullValueWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
              hideUnit = !!unit && availableWidth > 0 ? fullValueWidth > availableWidth : false;
              valueEl.dataset.hideUnit = hideUnit ? "true" : "false";
            }
            if (valueEl.innerHTML !== this._formatRightValueMarkup(display, unit, hideUnit)) {
              valueEl.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
            }
          });
          this.shadowRoot.querySelectorAll(".inside-value").forEach((valueEl) => {
            const display = this._decodeDataAttr(valueEl.dataset.display || "");
            const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
            const hideUnit = valueEl.dataset.hideUnit === "true";
            const hideValue = valueEl.dataset.hideValue === "true";
            if (!hideValue && !display) return;
            if (!valueEl.dataset.hideUnit) valueEl.dataset.hideUnit = "false";
            if (!valueEl.dataset.hideValue) valueEl.dataset.hideValue = "false";
            const nextMarkup = this._formatInsideValueMarkup(display, unit, hideUnit);
            if (valueEl.innerHTML !== nextMarkup) {
              valueEl.innerHTML = nextMarkup;
            }
          });
        }
        _getMinimumBarShare() {
          return 0.5;
        }
        _getMinimumBarShareHysteresis() {
          return 0.02;
        }
        _getTopValueEnableShare() {
          return this._getMinimumBarShare() - this._getMinimumBarShareHysteresis();
        }
        _getTopValueDisableShare() {
          return this._getMinimumBarShare() + this._getMinimumBarShareHysteresis();
        }
        _getNumericStyleValue(el, propertyName, fallback = 0) {
          if (!el) return fallback;
          try {
            const value = parseFloat(getComputedStyle(el).getPropertyValue(propertyName));
            return Number.isFinite(value) ? value : fallback;
          } catch (_err) {
            return fallback;
          }
        }
        _getLeftModeGap(mainLine) {
          var _a;
          const computedGap = this._getNumericStyleValue(mainLine, "gap", NaN);
          if (Number.isFinite(computedGap)) return computedGap;
          const density = ((_a = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _a.rowDensity) || "normal";
          if (density === "tight") return 7;
          if (density === "dense" || density === "compressed") return 6;
          return 8;
        }
        _getLeftModeBarMinWidth(mainLine) {
          var _a;
          const computedMin = this._getNumericStyleValue(mainLine, "--sbcp-bar-min-width", NaN);
          if (Number.isFinite(computedMin)) return computedMin;
          const density = ((_a = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _a.leftDensity) || "normal";
          if (density === "compact") return 52;
          if (density === "tight") return 48;
          if (density === "dense") return 44;
          if (density === "compressed") return 40;
          return 56;
        }
        _getLeftModeIconWidth(iconWrap, mainLine) {
          var _a, _b;
          const measured = (_a = iconWrap == null ? void 0 : iconWrap.getBoundingClientRect) == null ? void 0 : _a.call(iconWrap).width;
          if (this._isReliableWidth(measured, 1)) return measured;
          const computed = this._getNumericStyleValue(iconWrap || mainLine, "--sbcp-icon-width", NaN);
          if (Number.isFinite(computed)) return computed;
          const density = ((_b = mainLine == null ? void 0 : mainLine.dataset) == null ? void 0 : _b.leftDensity) || "normal";
          if (density === "compact") return 26;
          if (density === "tight") return 24;
          if (density === "dense") return 23;
          if (density === "compressed") return 22;
          return 28;
        }
        _getReservedInlineValueWidth(valueEl) {
          var _a, _b, _c;
          if (!valueEl) return 0;
          const display = this._decodeDataAttr(valueEl.dataset.display || "");
          const unit = this._decodeDataAttr(valueEl.dataset.unit || "");
          const baseWidth = this._getNumericStyleValue(valueEl, "--sbcp-value-width", valueEl.clientWidth || 0);
          const inlineExtra = parseFloat(((_b = (_a = valueEl.style) == null ? void 0 : _a.getPropertyValue) == null ? void 0 : _b.call(_a, "--sbcp-value-extra-width")) || ((_c = valueEl.style) == null ? void 0 : _c["--sbcp-value-extra-width"]) || "0");
          const extraWidth = Number.isFinite(inlineExtra) ? inlineExtra : this._getNumericStyleValue(valueEl, "--sbcp-value-extra-width", 0);
          const reservedWidth = Math.max(0, baseWidth + extraWidth);
          if (!display) return reservedWidth;
          const fullMarkupWidth = Math.ceil(this._measureValueMarkupWidth(valueEl, display, unit, false) + 2);
          return Math.max(reservedWidth, fullMarkupWidth);
        }
        _getStableLeftLabelMetrics(row, rowWidth = null) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          const mainLine = row == null ? void 0 : row.querySelector(".main-line");
          const labelWrap = row == null ? void 0 : row.querySelector(".label-left");
          const labelText = row == null ? void 0 : row.querySelector(".label-left-text");
          if (!mainLine || !labelWrap || !labelText) return null;
          const width = (_b = rowWidth != null ? rowWidth : (_a = mainLine.getBoundingClientRect) == null ? void 0 : _a.call(mainLine).width) != null ? _b : 0;
          const text = (labelText.textContent || "").trim();
          const naturalWidth = this._measureTextWidthWithStyles(labelText, text) || labelText.scrollWidth || 0;
          const density = ((_c = mainLine.dataset) == null ? void 0 : _c.leftDensity) || "normal";
          const labelShares = { normal: 0.25, compact: 0.22, tight: 0.19, dense: 0.16, compressed: 0.14 };
          const entityConfig = (_e = (_d = this._config) == null ? void 0 : _d.entities) == null ? void 0 : _e.find((item) => {
            var _a2;
            return item.entity === ((_a2 = row.dataset) == null ? void 0 : _a2.entity);
          });
          const configuredWidth = entityConfig ? (_i = (_h = (_g = (_f = this._resolve(entityConfig)) == null ? void 0 : _f.layout) == null ? void 0 : _g.label) == null ? void 0 : _h.width) != null ? _i : 100 : 100;
          const maximumWidth = width > 0 ? Math.min(configuredWidth, width * ((_j = labelShares[density]) != null ? _j : labelShares.normal)) : Math.min(naturalWidth, configuredWidth);
          return { text, naturalWidth, maximumWidth, labelWidth: maximumWidth, labelText };
        }
        _estimateLeftModeWidthBudget(row) {
          var _a, _b, _c;
          const mainLine = row == null ? void 0 : row.querySelector(".main-line");
          if (!mainLine) return null;
          const rowWidth = (_b = (_a = mainLine.getBoundingClientRect) == null ? void 0 : _a.call(mainLine).width) != null ? _b : 0;
          if (!this._isReliableWidth(rowWidth)) return null;
          const labelWrap = row.querySelector(".label-left");
          const iconWrap = row.querySelector(".icon-wrap");
          const valueEl = row.querySelector(".value-right");
          const labelMetrics = this._getStableLeftLabelMetrics(row, rowWidth);
          const labelWidth = (_c = labelMetrics == null ? void 0 : labelMetrics.labelWidth) != null ? _c : 0;
          const iconWidth = iconWrap ? this._getLeftModeIconWidth(iconWrap, mainLine) : 0;
          const valueWidth = this._getReservedInlineValueWidth(valueEl);
          const gap = this._getLeftModeGap(mainLine);
          const barMinWidth = this._getLeftModeBarMinWidth(mainLine);
          const baseLabelVisible = !!labelWrap;
          const hasIcon = !!iconWrap;
          const labelGapCount = hasIcon ? 2 : 1;
          const labelAvailableWidth = Math.max(
            0,
            rowWidth - (hasIcon ? iconWidth : 0) - barMinWidth - labelGapCount * gap
          );
          const candidateLabelWidth = Math.min(labelWidth, labelAvailableWidth);
          const labelSacrificial = !labelMetrics || this._shouldHideLeftLabel(
            labelMetrics.text,
            labelMetrics.naturalWidth,
            candidateLabelWidth,
            this._measureVisibleLabelCharacters(labelMetrics.labelText, labelMetrics.text, candidateLabelWidth)
          );
          const withoutIconLabelWidth = Math.min(labelWidth, Math.max(0, rowWidth - barMinWidth - gap));
          const labelSacrificialWithoutIcon = !labelMetrics || this._shouldHideLeftLabel(
            labelMetrics.text,
            labelMetrics.naturalWidth,
            withoutIconLabelWidth,
            this._measureVisibleLabelCharacters(labelMetrics.labelText, labelMetrics.text, withoutIconLabelWidth)
          );
          return {
            rowWidth,
            gap,
            barMinWidth,
            labelSacrificialWithoutIcon,
            labelWidth: this._isReliableWidth(labelWidth, 0) ? labelWidth : 0,
            iconWidth: this._isReliableWidth(iconWidth, 0) ? iconWidth : 0,
            valueWidth: this._isReliableWidth(valueWidth, 0) ? valueWidth : 0,
            baseLabelVisible,
            labelSacrificial,
            hasIcon,
            mainLine,
            iconWrap,
            valueEl,
            rowStack: row.querySelector(".row-stack")
          };
        }
        _predictLeftModeBarShareForState(row, state, budget = null) {
          const effectiveBudget = budget || this._estimateLeftModeWidthBudget(row);
          if (!effectiveBudget) return null;
          const showLabel = effectiveBudget.baseLabelVisible && !state.hideLabel;
          const showIcon = effectiveBudget.hasIcon && !state.hideIcon;
          const showInlineValue = !state.topValue;
          const visibleItems = 1 + (showIcon ? 1 : 0) + (showLabel ? 1 : 0) + (showInlineValue ? 1 : 0);
          const gapCount = Math.max(0, visibleItems - 1);
          const reservedWidth = (showIcon ? effectiveBudget.iconWidth : 0) + (showLabel ? effectiveBudget.labelWidth : 0) + (showInlineValue ? effectiveBudget.valueWidth : 0) + gapCount * effectiveBudget.gap;
          const remainingWidth = Math.max(0, effectiveBudget.rowWidth - reservedWidth);
          const fits = remainingWidth >= effectiveBudget.barMinWidth;
          const predictedBarWidth = fits ? remainingWidth : effectiveBudget.barMinWidth;
          return {
            rowWidth: effectiveBudget.rowWidth,
            barWidth: predictedBarWidth,
            share: predictedBarWidth / effectiveBudget.rowWidth,
            showLabel,
            showIcon,
            showInlineValue,
            reservedWidth,
            gapCount,
            fits
          };
        }
        _getLeftModeCandidateStates(budget) {
          const states = [];
          if (budget && !budget.labelSacrificial) {
            states.push(
              { hideLabel: false, topValue: false, hideIcon: false },
              { hideLabel: false, topValue: true, hideIcon: false }
            );
          }
          if (budget && !budget.labelSacrificialWithoutIcon) {
            states.push(
              { hideLabel: false, topValue: false, hideIcon: true },
              { hideLabel: false, topValue: true, hideIcon: true }
            );
          }
          states.push(
            { hideLabel: true, topValue: false, hideIcon: false },
            { hideLabel: true, topValue: false, hideIcon: true },
            { hideLabel: true, topValue: true, hideIcon: true }
          );
          return states;
        }
        _chooseFallbackPredictedLeftModeState(row, states, budget) {
          let fallback = null;
          for (const state of states) {
            const predicted = this._predictLeftModeBarShareForState(row, state, budget);
            if (!predicted) continue;
            fallback = { ...state, predicted };
          }
          return fallback;
        }
        _chooseLeftModeResponsiveState(row, settled = true) {
          var _a, _b, _c, _d;
          const budget = this._estimateLeftModeWidthBudget(row);
          if (!budget) return null;
          const minimumBarShare = this._getMinimumBarShare();
          const states = this._getLeftModeCandidateStates(budget);
          const entityCfg = (_b = this._config.entities) == null ? void 0 : _b[Number((_a = row == null ? void 0 : row.dataset) == null ? void 0 : _a.rowIndex)];
          const previousTopValue = entityCfg && this._leftModeResponsiveHistory.has(entityCfg) ? this._leftModeResponsiveHistory.get(entityCfg) : ((_d = (_c = budget.rowStack) == null ? void 0 : _c.dataset) == null ? void 0 : _d.forceTopValue) === "true";
          const topStates = states.filter((state) => state.topValue);
          const enableShare = this._getTopValueEnableShare();
          const disableShare = this._getTopValueDisableShare();
          for (const state of states) {
            const threshold = state.topValue || settled ? minimumBarShare : previousTopValue ? disableShare : enableShare;
            const predicted = this._predictLeftModeBarShareForState(row, state, budget);
            if ((predicted == null ? void 0 : predicted.fits) && predicted.share >= threshold) return { ...state, predicted };
          }
          return this._chooseFallbackPredictedLeftModeState(row, topStates, budget);
        }
        _applyLeftModeResponsiveState(row, state) {
          var _a, _b;
          const mainLine = row == null ? void 0 : row.querySelector(".main-line");
          const rowStack = row == null ? void 0 : row.querySelector(".row-stack");
          const leftLabel = row == null ? void 0 : row.querySelector(".label-left");
          if (!mainLine || !rowStack) return;
          const entityCfg = (_b = this._config.entities) == null ? void 0 : _b[Number((_a = row == null ? void 0 : row.dataset) == null ? void 0 : _a.rowIndex)];
          if (entityCfg) this._leftModeResponsiveHistory.set(entityCfg, (state == null ? void 0 : state.topValue) === true);
          delete rowStack.dataset.forceTopValue;
          delete mainLine.dataset.hideLeftIcon;
          if (leftLabel) delete leftLabel.dataset.priorityHidden;
          if ((state == null ? void 0 : state.hideLabel) && leftLabel) {
            leftLabel.dataset.priorityHidden = "true";
          }
          if (state == null ? void 0 : state.topValue) {
            rowStack.dataset.forceTopValue = "true";
          }
          if (state == null ? void 0 : state.hideIcon) {
            mainLine.dataset.hideLeftIcon = "true";
          }
        }
        _getMeasuredBarShare(row) {
          const mainLine = row == null ? void 0 : row.querySelector(".main-line");
          const track = row == null ? void 0 : row.querySelector(".bar-track");
          if (!mainLine || !track) return null;
          const rowWidth = mainLine.getBoundingClientRect().width;
          const barWidth = track.getBoundingClientRect().width;
          if (!this._isReliableWidth(rowWidth) || !this._isReliableWidth(barWidth, 1)) return null;
          return { rowWidth, barWidth, share: barWidth / rowWidth, mainLine, track };
        }
        _clearMinimumBarShareOverrides(row) {
          const mainLine = row == null ? void 0 : row.querySelector(".main-line");
          const rowStack = row == null ? void 0 : row.querySelector(".row-stack");
          const leftLabel = row == null ? void 0 : row.querySelector(".label-left");
          const aboveLabel = row == null ? void 0 : row.querySelector(".above-bar-label");
          const innerLabel = row == null ? void 0 : row.querySelector(".bar-inner-label");
          const aboveLine = row == null ? void 0 : row.querySelector(".above-line");
          if (rowStack) delete rowStack.dataset.forceTopValue;
          if (leftLabel) delete leftLabel.dataset.priorityHidden;
          if (aboveLabel) delete aboveLabel.dataset.priorityHideName;
          if (innerLabel) delete innerLabel.dataset.priorityHideName;
          if (!mainLine) return;
          delete mainLine.dataset.hideLeftIcon;
          delete mainLine.dataset.hideAboveIcon;
          delete mainLine.dataset.priorityHideInsideIcon;
        }
        _hideMinimumBarShareLabel(row, mode) {
          if (mode === "left") {
            const leftLabel = row.querySelector(".label-left");
            if (leftLabel) leftLabel.dataset.priorityHidden = "true";
            return;
          }
          if (mode === "above") {
            const aboveLabel = row.querySelector(".above-bar-label");
            if (aboveLabel) aboveLabel.dataset.priorityHideName = "true";
            return;
          }
          if (mode === "inside") {
            const innerLabel = row.querySelector(".bar-inner-label");
            if (innerLabel) innerLabel.dataset.priorityHideName = "true";
          }
        }
        _forceMinimumBarShareTopValue(row, mode) {
          if (mode !== "left") return;
          const rowStack = row.querySelector(".row-stack");
          if (rowStack) rowStack.dataset.forceTopValue = "true";
        }
        _hideMinimumBarShareIcon(row, mode) {
          const mainLine = row.querySelector(".main-line");
          if (!mainLine) return;
          if (mode === "left") {
            mainLine.dataset.hideLeftIcon = "true";
            return;
          }
          if (mode === "above") {
            mainLine.dataset.hideAboveIcon = "true";
            const aboveLine = row.querySelector(".above-line");
            if (aboveLine) aboveLine.dataset.hideAboveIcon = "true";
            return;
          }
          if (mode === "inside") {
            mainLine.dataset.priorityHideInsideIcon = "true";
          }
        }
        _getLabelSacrificeMetrics(row, mode, measurement) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          const rowWidth = (_d = (_c = measurement == null ? void 0 : measurement.rowWidth) != null ? _c : (_b = (_a = row == null ? void 0 : row.querySelector(".main-line")) == null ? void 0 : _a.getBoundingClientRect) == null ? void 0 : _b.call(_a).width) != null ? _d : 0;
          if (!this._isReliableWidth(rowWidth)) return null;
          if (mode === "left") {
            const labelWrap = row.querySelector(".label-left");
            const labelText = row.querySelector(".label-left-text");
            if (!labelWrap || !labelText) return null;
            const text = (labelText.textContent || "").trim();
            const visibleWidth = labelText.clientWidth;
            const fullWidth = labelText.scrollWidth;
            const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
            const labelWidth = (_f = (_e = labelWrap.getBoundingClientRect) == null ? void 0 : _e.call(labelWrap).width) != null ? _f : visibleWidth;
            return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
          }
          if (mode === "above") {
            const labelText = row.querySelector(".above-bar-label-name");
            if (!labelText) return null;
            const text = (labelText.textContent || "").trim();
            const visibleWidth = labelText.clientWidth;
            const fullWidth = labelText.scrollWidth;
            const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
            const labelWidth = (_h = (_g = labelText.getBoundingClientRect) == null ? void 0 : _g.call(labelText).width) != null ? _h : visibleWidth;
            return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
          }
          if (mode === "inside") {
            const labelText = row.querySelector(".inside-name");
            if (!labelText) return null;
            const text = (labelText.textContent || "").trim();
            const visibleWidth = labelText.clientWidth;
            const fullWidth = labelText.scrollWidth;
            const visibleChars = this._measureVisibleLabelCharacters(labelText, text, visibleWidth);
            const labelWidth = (_j = (_i = labelText.getBoundingClientRect) == null ? void 0 : _i.call(labelText).width) != null ? _j : visibleWidth;
            return { text, visibleWidth, fullWidth, visibleChars, labelWidth, rowWidth };
          }
          return null;
        }
        _isLabelWorthSacrificing(row, mode, measurement) {
          const metrics = this._getLabelSacrificeMetrics(row, mode, measurement);
          if (!metrics || !metrics.text) return false;
          return this._shouldHideLeftLabel(metrics.text, metrics.fullWidth, metrics.visibleWidth, metrics.visibleChars);
        }
        _ensureMinimumBarShare(rows = null, leftWidths = null) {
          if (!this.shadowRoot) return;
          const targetRows = rows || this.shadowRoot.querySelectorAll(".row[data-entity]");
          const minimumBarShare = this._getMinimumBarShare();
          targetRows.forEach((row) => {
            const mainLine = row.querySelector(".main-line");
            if (!mainLine) return;
            const mode = mainLine.classList.contains("left-mode") ? "left" : mainLine.classList.contains("above-mode") ? "above" : mainLine.classList.contains("inside-mode") ? "inside" : "other";
            if (mode === "other") return;
            if (mode === "left") {
              const settled = !leftWidths || leftWidths.get(mainLine) === mainLine.getBoundingClientRect().width;
              const state = this._chooseLeftModeResponsiveState(row, settled);
              if (state) this._applyLeftModeResponsiveState(row, state);
              if (!settled) this._schedulePostLayoutDensityPass();
              return;
            }
            this._clearMinimumBarShareOverrides(row);
            let measurement = this._getMeasuredBarShare(row);
            if (!measurement || measurement.share >= minimumBarShare) return;
            if (this._isLabelWorthSacrificing(row, mode, measurement)) {
              this._hideMinimumBarShareLabel(row, mode);
              measurement = this._getMeasuredBarShare(row);
              if (!measurement || measurement.share >= minimumBarShare) return;
            }
            this._forceMinimumBarShareTopValue(row, mode);
            this._applyTopRightValueLayout();
            measurement = this._getMeasuredBarShare(row);
            if (!measurement || measurement.share >= minimumBarShare) return;
            this._hideMinimumBarShareIcon(row, mode);
          });
        }
        _shouldUseTopValueRow(mainLine) {
          var _a, _b, _c;
          if (!((_a = mainLine == null ? void 0 : mainLine.classList) == null ? void 0 : _a.contains("left-mode"))) return false;
          return ((_c = (_b = mainLine.closest) == null ? void 0 : _b.call(mainLine, ".row-stack")) == null ? void 0 : _c.dataset.forceTopValue) === "true";
        }
        _getAdaptiveDensityForMainLine(mainLine) {
          var _a;
          if (!mainLine) return "normal";
          if ((_a = mainLine.classList) == null ? void 0 : _a.contains("left-mode")) {
            return mainLine.dataset.leftDensity || "normal";
          }
          return mainLine.dataset.rowDensity || "normal";
        }
        _getAdaptiveDefaultHeightForDensity(density) {
          if (density === "compressed") return 24;
          if (density === "dense") return 28;
          return 38;
        }
        _getEffectiveRowHeight(baseHeight, heightExplicit, mainLine) {
          if (heightExplicit) return this._clampSupportedRowHeight(baseHeight);
          return this._clampSupportedRowHeight(this._getAdaptiveDefaultHeightForDensity(this._getAdaptiveDensityForMainLine(mainLine)));
        }
        _applyAdaptiveRowHeight() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".row[data-entity]").forEach((row) => {
            const mainLine = row.querySelector(".main-line");
            const rowStack = row.querySelector(".row-stack");
            if (!mainLine) return;
            const baseHeight = parseFloat(row.dataset.baseHeight || "38") || 38;
            const explicit = row.dataset.heightExplicit === "true";
            const effectiveHeight = this._getEffectiveRowHeight(baseHeight, explicit, mainLine);
            row.style.setProperty("--sbcp-row-height", `${effectiveHeight}px`);
            if (rowStack) rowStack.style.setProperty("--sbcp-row-height", `${effectiveHeight}px`);
            mainLine.style.height = `${effectiveHeight}px`;
            const labelLeft = mainLine.querySelector(".label-left");
            if (labelLeft) labelLeft.style.height = `${effectiveHeight}px`;
            const iconWrap = mainLine.querySelector(".icon-wrap");
            if (iconWrap) {
              iconWrap.style.height = `${effectiveHeight}px`;
              iconWrap.style.minHeight = `${effectiveHeight}px`;
            }
            const track = mainLine.querySelector(".bar-track");
            if (track) track.style.height = `${effectiveHeight}px`;
            const inlineValue = mainLine.querySelector(".value-right");
            if (inlineValue) inlineValue.style.height = `${effectiveHeight}px`;
          });
        }
        _applyTopRightValueLayout() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach((mainLine) => {
            var _a, _b, _c, _d, _e;
            const rowStack = mainLine.closest(".row-stack");
            const inlineValue = mainLine.querySelector(".value-right");
            const topValue = rowStack == null ? void 0 : rowStack.querySelector(".top-right-value");
            if (!rowStack || !inlineValue || !topValue) return;
            const active = this._shouldUseTopValueRow(mainLine);
            rowStack.dataset.topValue = active ? "true" : "false";
            topValue.dataset.active = active ? "true" : "false";
            const display = this._decodeDataAttr(inlineValue.dataset.display || "");
            const unit = this._decodeDataAttr(inlineValue.dataset.unit || "");
            topValue.dataset.display = inlineValue.dataset.display || "";
            topValue.dataset.unit = inlineValue.dataset.unit || "";
            topValue.dataset.hideUnit = "false";
            const availableWidth = (_e = (_d = (_c = (_a = rowStack.getBoundingClientRect) == null ? void 0 : _a.call(rowStack).width) != null ? _c : (_b = topValue.getBoundingClientRect) == null ? void 0 : _b.call(topValue).width) != null ? _d : topValue.clientWidth) != null ? _e : 0;
            const fullValueWidth = display ? Math.ceil(this._measureValueMarkupWidth(topValue, display, unit, false) + 2) : 0;
            const hideUnit = !!unit && availableWidth > 0 && fullValueWidth > availableWidth;
            topValue.dataset.hideUnit = hideUnit ? "true" : "false";
            topValue.innerHTML = this._formatRightValueMarkup(display, unit, hideUnit);
          });
        }
        _applyLeftLabelUsefulness() {
          if (!this.shadowRoot) return;
          this.shadowRoot.querySelectorAll(".main-line.left-mode").forEach((mainLine) => {
            var _a;
            const labelWrap = mainLine.querySelector(".label-left");
            const labelText = mainLine.querySelector(".label-left-text");
            if (!labelWrap || !labelText) return;
            const row = ((_a = mainLine.closest) == null ? void 0 : _a.call(mainLine, ".row")) || {
              dataset: {},
              querySelector: (selector) => selector === ".main-line" ? mainLine : selector === ".label-left" ? labelWrap : selector === ".label-left-text" ? labelText : null
            };
            const metrics = this._getStableLeftLabelMetrics(row);
            if (!metrics) return;
            const visibleChars = this._measureVisibleLabelCharacters(metrics.labelText, metrics.text, metrics.labelWidth);
            labelWrap.dataset.hidden = this._shouldHideLeftLabel(
              metrics.text,
              metrics.naturalWidth,
              metrics.labelWidth,
              visibleChars
            ) ? "true" : "false";
          });
        }
        _runPostLayoutPasses(rows = null) {
          const generation = this._rowGeneration;
          requestAnimationFrame(() => {
            var _a;
            if (!this.isConnected || generation !== this._rowGeneration) return;
            this._applyRowDensity();
            this._applyLeftModeDensity();
            this._applyAboveLabelDensity();
            this._applyHeroValueFit();
            this._applyInsideLabelDensity();
            this._applyValueWidthReservation();
            const leftWidths = new Map(
              [...((_a = this.shadowRoot) == null ? void 0 : _a.querySelectorAll(".main-line.left-mode")) || []].map((mainLine) => [mainLine, mainLine.getBoundingClientRect().width])
            );
            requestAnimationFrame(() => {
              var _a2;
              if (!this.isConnected || generation !== this._rowGeneration) return;
              this._applyAdaptiveRowHeight();
              this._applyValueVisibility();
              this._applyLeftLabelUsefulness();
              this._applyTopRightValueLayout();
              this._ensureMinimumBarShare(rows, leftWidths);
              this._applyTopRightValueLayout();
              this._applyLeftLabelUsefulness();
              const targetRows = rows || ((_a2 = this.shadowRoot) == null ? void 0 : _a2.querySelectorAll(".row[data-entity]")) || [];
              targetRows.forEach((row) => {
                this._positionTargetLabel(row);
                this._positionMarkerValueLabel(row, ".peak-value-label", ".peak-marker");
                this._positionMarkerValueLabel(row, ".floor-value-label", ".floor-marker");
                this._positionGenericMarkerLabels(row);
              });
            });
          });
        }
        _isTightUnit(unit) {
          return isTightUnit(unit);
        }
        _encodeDataAttr(value) {
          return encodeURIComponent(String(value != null ? value : ""));
        }
        _decodeDataAttr(value) {
          const raw = String(value != null ? value : "");
          try {
            return decodeURIComponent(raw);
          } catch (_err) {
            return raw;
          }
        }
        _parseColorToRgb(color) {
          return parseColorToRgb2(color);
        }
        _rgbToHsl({ r, g, b }) {
          return rgbToHsl({ r, g, b });
        }
        _getMarkerContrastColor(color) {
          return getMarkerContrastColor(color);
        }
        _getEffectiveMarkerColor(marker) {
          return getEffectiveMarkerColor(marker);
        }
        _getMarkerLabelColorStyle(marker) {
          const color = this._getEffectiveMarkerColor(marker);
          return `--marker-color:${color};--marker-contrast-color:${this._getMarkerContrastColor(color)};`;
        }
        _getNeedleBorderColor(color) {
          return getNeedleBorderColor2(color);
        }
        _formatDisplayWithUnit(display, unit) {
          return formatDisplayWithUnit(display, unit);
        }
        _formatRightValueMarkup(display, unit, hideUnit = false) {
          const escapedDisplay = escapeHtml(display);
          if (!unit || hideUnit) {
            return `<span class="value-right-text"><span class="value-right-number">${escapedDisplay}</span></span>`;
          }
          const cleanUnit = String(unit);
          const escapedUnit = escapeHtml(cleanUnit);
          const tightUnit = this._isTightUnit(cleanUnit);
          const textClass = tightUnit ? "value-right-text tight-unit" : "value-right-text has-unit";
          return `<span class="${textClass}"><span class="value-right-number">${escapedDisplay}</span><span class="unit-group"><span class="unit">${escapedUnit}</span></span></span>`;
        }
        _formatAboveValueMarkup(display, unit, hideUnit = false) {
          return `<span class="above-bar-label-value" data-display="${this._encodeDataAttr(display)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="${hideUnit ? "true" : "false"}">${this._formatRightValueMarkup(display, unit, hideUnit)}</span>`;
        }
        _formatInsideValueMarkup(display, unit, hideUnit = false) {
          const escapedDisplay = escapeHtml(display);
          if (!unit || hideUnit) return `<span class="inside-value-text"><span class="inside-number">${escapedDisplay}</span></span>`;
          const cleanUnit = String(unit);
          const escapedUnit = escapeHtml(cleanUnit);
          const unitModeClass = this._isTightUnit(cleanUnit) ? "tight-unit" : "has-unit";
          return `<span class="inside-value-text ${unitModeClass}"><span class="inside-number">${escapedDisplay}</span><span class="inside-unit">${escapedUnit}</span></span>`;
        }
        _getRowMarkerModels(rowViewModel, ecfg, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor) {
          if (rowViewModel == null ? void 0 : rowViewModel.markers) {
            return rowViewModel.markers.map((marker) => {
              var _a, _b;
              if (marker.type === "target") {
                return {
                  ...marker,
                  position: targetPct === void 0 ? marker.position : targetPct,
                  visible: targetPct !== null && targetPct !== void 0,
                  color: targetColor || marker.color,
                  label: (_a = marker.label) != null ? _a : targetDisplay === null ? null : { text: targetDisplay }
                };
              }
              if (marker.type === "floor") {
                return marker;
              }
              if (marker.type !== "peak") return marker;
              return {
                ...marker,
                position: peakPct === void 0 ? marker.position : peakPct,
                visible: peakPct !== null && peakPct !== void 0 && ecfg.peak_marker.show === true,
                color: peakColor || marker.color,
                label: (_b = marker.label) != null ? _b : peakDisplay === null ? null : { text: peakDisplay }
              };
            });
          }
          const markers = buildMarkerModels({
            entityConfig: ecfg,
            targetPosition: targetPct,
            targetPresentation: targetDisplay === null ? null : { text: targetDisplay },
            targetVisible: Number.isFinite(targetPct),
            peakPosition: peakPct,
            peakPresentation: peakDisplay === null ? null : { number: peakDisplay },
            peakVisible: Number.isFinite(peakPct)
          });
          const targetMarker = this._getMarkerModel(markers, "target");
          const peakMarker = this._getMarkerModel(markers, "peak");
          if (targetMarker && targetColor) targetMarker.color = targetColor;
          if (peakMarker && peakColor) peakMarker.color = peakColor;
          return markers;
        }
        _getMarkerModel(markers, type) {
          var _a;
          return (_a = markers.find((marker) => marker.id === type || marker.type === type)) != null ? _a : null;
        }
        _renderMarker(marker) {
          return renderMarker(marker);
        }
        _patchMarker(markerEl, marker) {
          if (markerEl && marker && !marker.visible) this._clearMarkerHover(markerEl);
          return patchMarker(markerEl, marker);
        }
        _patchMarkerLabelAppearance(labelEl, marker) {
          if (!labelEl || !marker) return;
          const markerColor = this._getEffectiveMarkerColor(marker);
          this._setStyleIfChanged(labelEl, "--marker-color", markerColor);
          this._setStyleIfChanged(labelEl, "--marker-contrast-color", this._getMarkerContrastColor(markerColor));
        }
        _buildRowViewModel(entityCfg, ecfg, stateObj) {
          var _a;
          const rowViewModel = buildRowViewModel({
            hass: this._hass,
            cardConfig: this._config,
            entityConfig: ecfg,
            entityState: stateObj,
            extrema: (_a = this._extrema.get(entityCfg)) != null ? _a : null,
            previousScale: this._rowScales.get(entityCfg)
          });
          this._rowScales.set(entityCfg, { min: rowViewModel.min, max: rowViewModel.max });
          return rowViewModel;
        }
        _buildRow(entityCfg, stateDisplay, unit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor, minValue, maxValue, rowIndex = ((_b) => (_b = ((_a) => (_a = this._config.entities) == null ? void 0 : _a.indexOf(entityCfg))()) != null ? _b : -1)()) {
          var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
          const ecfg = this._resolve(entityCfg);
          const stateObj = (_c = (_b2 = (_a2 = this._hass) == null ? void 0 : _a2.states) == null ? void 0 : _b2[entityCfg.entity]) != null ? _c : null;
          if (stateObj) this._updateExtrema(entityCfg, ecfg, stateObj);
          const rowViewModel = stateObj ? this._buildRowViewModel(entityCfg, ecfg, stateObj) : null;
          const layout = ecfg.layout;
          const bar = ecfg.bar;
          const safeMin = Number.isFinite(minValue) ? minValue : 0;
          const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
          const baselinePct = (_d = rowViewModel == null ? void 0 : rowViewModel.baselinePercent) != null ? _d : this._resolveBaselinePct(ecfg, safeMin, safeMax);
          const lp = layout.label.position;
          const h = (_f = (_e = rowViewModel == null ? void 0 : rowViewModel.attributes) == null ? void 0 : _e.baseHeight) != null ? _f : layout.height;
          const name = (_j = (_i = (_g = rowViewModel == null ? void 0 : rowViewModel.name) != null ? _g : ecfg.name) != null ? _i : (_h = stateObj == null ? void 0 : stateObj.attributes) == null ? void 0 : _h.friendly_name) != null ? _j : entityCfg.entity;
          const escapedEntityId = escapeHtml((_k = rowViewModel == null ? void 0 : rowViewModel.entityId) != null ? _k : entityCfg.entity);
          const escapedName = escapeHtml(name);
          const markerModels = this._getRowMarkerModels(rowViewModel, ecfg, peakPct, peakDisplay, targetPct, targetDisplay, peakColor, targetColor);
          const targetMarkerModel = this._getMarkerModel(markerModels, "target");
          const peakMarkerModel = this._getMarkerModel(markerModels, "peak");
          const floorMarkerModel = this._getMarkerModel(markerModels, "floor");
          const genericMarkerModels = markerModels.filter((marker) => marker.type === "generic");
          const markerLaneOccupancy = (_l = rowViewModel == null ? void 0 : rowViewModel.markerLaneOccupancy) != null ? _l : getMarkerLaneOccupancy(ecfg);
          const markerLabelLaneOccupancy = (_m = rowViewModel == null ? void 0 : rowViewModel.markerLabelLaneOccupancy) != null ? _m : getMarkerLabelLaneOccupancy(ecfg);
          const rawValue = (_n = rowViewModel == null ? void 0 : rowViewModel.numericValue) != null ? _n : this._getFiniteNumber(stateDisplay);
          const needleState = (_o = rowViewModel == null ? void 0 : rowViewModel.needle) != null ? _o : this._getNeedleRenderState(rawValue, ecfg, safeMin, safeMax, baselinePct);
          const barModel = buildBarRenderModel({
            percent: pct,
            min: safeMin,
            max: safeMax,
            targetPercent: targetPct,
            baselinePercent: baselinePct,
            needle: needleState,
            markers: markerModels
          }, ecfg, { height: "var(--sbcp-row-height)", color });
          const targetValueLabel = (targetMarkerModel == null ? void 0 : targetMarkerModel.labelVisible) ? `
      <div class="target-value-label" style="left:${Number.isFinite(targetMarkerModel.position) ? targetMarkerModel.position : 0}%;visibility:${targetMarkerModel.visible && ((_p = targetMarkerModel.label) == null ? void 0 : _p.text) ? "visible" : "hidden"};${this._getMarkerLabelColorStyle(targetMarkerModel)}">
        ${((_q = targetMarkerModel.label) == null ? void 0 : _q.text) ? escapeHtml(targetMarkerModel.label.text) : ""}
      </div>` : "";
          const peakValueLabel = (peakMarkerModel == null ? void 0 : peakMarkerModel.labelVisible) ? `
      <div class="peak-value-label" style="left:${Number.isFinite(peakMarkerModel.position) ? peakMarkerModel.position : 0}%;visibility:${peakMarkerModel.visible && ((_r = peakMarkerModel.label) == null ? void 0 : _r.text) ? "visible" : "hidden"};${this._getMarkerLabelColorStyle(peakMarkerModel)}">
        ${peakMarkerModel.visible && ((_s = peakMarkerModel.label) == null ? void 0 : _s.text) ? escapeHtml(peakMarkerModel.label.text) : ""}
      </div>` : "";
          const floorValueLabel = (floorMarkerModel == null ? void 0 : floorMarkerModel.labelVisible) ? `
      <div class="floor-value-label" style="left:${Number.isFinite(floorMarkerModel.position) ? floorMarkerModel.position : 0}%;visibility:${floorMarkerModel.visible && ((_t = floorMarkerModel.label) == null ? void 0 : _t.text) ? "visible" : "hidden"};${this._getMarkerLabelColorStyle(floorMarkerModel)}">
        ${floorMarkerModel.visible && ((_u = floorMarkerModel.label) == null ? void 0 : _u.text) ? escapeHtml(floorMarkerModel.label.text) : ""}
      </div>` : "";
          const genericValueLabels = genericMarkerModels.filter((marker) => marker.labelVisible).map((marker) => {
            var _a3, _b3;
            return `
      <div class="generic-value-label" data-marker-id="${escapeHtml(marker.id)}" data-lane="${marker.lane}" data-show-marker="${marker.showMarker === false ? "false" : "true"}" style="left:${Number.isFinite(marker.position) ? marker.position : 0}%;visibility:${marker.visible && ((_a3 = marker.label) == null ? void 0 : _a3.text) ? "visible" : "hidden"};${this._getMarkerLabelColorStyle(marker)}">
        ${marker.visible && ((_b3 = marker.label) == null ? void 0 : _b3.text) ? escapeHtml(marker.label.text) : ""}
      </div>`;
          }).join("");
          const aboveLabel = lp === "above" ? `
      <div class="above-line">
        ${ecfg.icon && ecfg.icon !== false ? `<div class="above-icon-spacer"></div>` : ""}
        <div class="above-bar-label">
          <span class="above-bar-label-name label-left-text">${escapedName}</span>
          ${this._formatAboveValueMarkup(stateDisplay, unit, false)}
        </div>
      </div>` : "";
          const heroSize = (_v = layout.hero.size) != null ? _v : "small";
          const heroFontSize = layout.hero.value_size;
          const heroHeader = lp === "hero" ? `
      <div class="hero-line" data-hero-size="${heroSize}"${Number.isFinite(heroFontSize) ? ` style="--sbcp-hero-base-size:${heroFontSize}px"` : ""}>
        <div class="hero-header">
          <span class="hero-label label-left-text">${escapedName}</span>
          <span class="hero-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}">${this._formatRightValueMarkup(stateDisplay, unit, false)}</span>
        </div>
      </div>` : "";
          const innerLabel = lp === "inside" ? `
      <div class="bar-inner-label">
        <span class="inside-name">${escapedName}</span>
        <span class="inside-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" data-hide-value="false">${this._formatInsideValueMarkup(stateDisplay, unit, false)}</span>
      </div>` : "";
          const leftLabel = lp === "left" ? `<div class="label-left" style="flex:0 1 min(${layout.label.width}px, var(--sbcp-left-label-share));max-width:min(${layout.label.width}px, var(--sbcp-left-label-share));"><span class="label-left-text">${escapedName}</span></div>` : "";
          const rightValue = lp !== "inside" && lp !== "above" && lp !== "hero" ? `<div class="value-right" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>` : "";
          const topRightValue = lp === "left" ? `<div class="top-right-value" data-display="${this._encodeDataAttr(stateDisplay)}" data-unit="${this._encodeDataAttr(unit)}" data-hide-unit="false" data-active="false">${this._formatRightValueMarkup(stateDisplay, unit, false)}</div>` : "";
          const escapedIcon = ecfg.icon && ecfg.icon !== false ? escapeHtml(ecfg.icon) : "";
          const mainIcon = escapedIcon && lp !== "hero" ? `<div class="icon-wrap"><ha-icon icon="${escapedIcon}"></ha-icon></div>` : "";
          return `
      <div class="row" data-row-index="${rowIndex}" data-entity="${escapedEntityId}" data-base-height="${h}" data-height-explicit="${((_x = (_w = rowViewModel == null ? void 0 : rowViewModel.attributes) == null ? void 0 : _w.heightExplicit) != null ? _x : layout.height_explicit) ? "true" : "false"}" data-bar-animated="${((_z = (_y = rowViewModel == null ? void 0 : rowViewModel.attributes) == null ? void 0 : _y.barAnimated) != null ? _z : bar.animated) ? "true" : "false"}" data-marker-label-lane-above="${markerLabelLaneOccupancy.above ? "true" : "false"}" data-marker-label-lane-below="${markerLabelLaneOccupancy.below ? "true" : "false"}">
        <div class="row-stack" style="--sbcp-row-height:${h}px;">
          ${aboveLabel}
          ${heroHeader}
          ${topRightValue}
          <div class="main-line ${lp}-mode" data-marker-lane-above="${markerLaneOccupancy.above ? "true" : "false"}" data-marker-lane-below="${markerLaneOccupancy.below ? "true" : "false"}" style="height:${h}px;">
            ${mainIcon}
            ${leftLabel}
            <div class="bar-wrap">
              ${renderBar(barModel, { insideContent: innerLabel })}
              ${peakValueLabel}
              ${targetValueLabel}
              ${floorValueLabel}
              ${genericValueLabels}
            </div>
            ${rightValue}
          </div>
        </div>
      </div>`;
        }
        _patchRow(row, entityCfg, stateObj, previousHass = null) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          if (!row || !stateObj) return;
          const ecfg = this._resolve(entityCfg);
          this._updateExtrema(entityCfg, ecfg, stateObj);
          const previousScale = this._rowScales.get(entityCfg);
          const rowViewModel = this._buildRowViewModel(entityCfg, ecfg, stateObj);
          const safeMin = rowViewModel.min;
          const safeMax = rowViewModel.max;
          const pct = rowViewModel.percent;
          const color = this._getColor(pct, ecfg, safeMin, safeMax);
          const display = rowViewModel.primaryPresentation.number;
          const displayUnit = rowViewModel.primaryPresentation.unit;
          const liveBaselinePct = rowViewModel.baselinePercent;
          const barModel = buildBarRenderModel(rowViewModel, ecfg, { height: "var(--sbcp-row-height)", color });
          const previousStateObj = (_b = (_a = previousHass == null ? void 0 : previousHass.states) == null ? void 0 : _a[entityCfg.entity]) != null ? _b : null;
          const previousViewModel = previousStateObj ? buildRowViewModel({
            hass: previousHass,
            cardConfig: this._config,
            entityConfig: ecfg,
            entityState: previousStateObj,
            extrema: (_c = this._extrema.get(entityCfg)) != null ? _c : null,
            previousScale
          }) : null;
          const revealDuration = this._getRevealTransitionDuration(
            previousViewModel && Number.isFinite(previousViewModel.numericValue) ? { valuePercent: previousViewModel.percent, baselinePercent: previousViewModel.baselinePercent } : null,
            Number.isFinite(rowViewModel.numericValue) ? { valuePercent: pct, baselinePercent: liveBaselinePct } : null
          );
          const hoveredMarker = (_d = this._markerHover) == null ? void 0 : _d.marker;
          if (hoveredMarker && row.contains(hoveredMarker)) {
            const marker = barModel.markers.find((candidate) => candidate.type === "generic" ? hoveredMarker.dataset.markerId === candidate.id : hoveredMarker.matches(`.${candidate.type}-marker`));
            if (marker && !marker.visible) this._clearMarkerHover(hoveredMarker);
          }
          patchBar(row, barModel, { revealDuration });
          this._setDatasetIfChanged(row, "baseHeight", rowViewModel.attributes.baseHeight);
          this._setDatasetIfChanged(row, "heightExplicit", rowViewModel.attributes.heightExplicit ? "true" : "false");
          this._setDatasetIfChanged(row, "barAnimated", rowViewModel.attributes.barAnimated ? "true" : "false");
          const valueEl = row.querySelector(".value-right");
          if (valueEl) {
            valueEl.dataset.display = this._encodeDataAttr(display);
            valueEl.dataset.unit = this._encodeDataAttr(displayUnit);
            valueEl.dataset.hideUnit = "false";
            valueEl.innerHTML = this._formatRightValueMarkup(display, displayUnit, false);
          }
          const topValueEl = row.querySelector(".top-right-value");
          if (topValueEl) {
            topValueEl.dataset.display = this._encodeDataAttr(display);
            topValueEl.dataset.unit = this._encodeDataAttr(displayUnit);
            topValueEl.dataset.hideUnit = "false";
            topValueEl.innerHTML = this._formatRightValueMarkup(display, displayUnit, false);
          }
          const innerLabel = row.querySelector(".bar-inner-label");
          if (innerLabel) {
            const valueSpan = innerLabel.querySelector(".inside-value");
            if (valueSpan) {
              valueSpan.dataset.display = this._encodeDataAttr(display);
              valueSpan.dataset.unit = this._encodeDataAttr(displayUnit);
              valueSpan.dataset.hideUnit = "false";
              valueSpan.dataset.hideValue = "false";
              valueSpan.innerHTML = this._formatInsideValueMarkup(display, displayUnit, false);
            }
          }
          const heroHeader = row.querySelector(".hero-header");
          if (heroHeader) {
            const heroLine = row.querySelector(".hero-line");
            this._setStyleIfChanged(
              heroLine,
              "--sbcp-hero-base-size",
              Number.isFinite(ecfg.layout.hero.value_size) ? `${ecfg.layout.hero.value_size}px` : null
            );
            heroHeader.innerHTML = `<span class="hero-label label-left-text">${escapeHtml(rowViewModel.name)}</span><span class="hero-value" data-display="${this._encodeDataAttr(display)}" data-unit="${this._encodeDataAttr(displayUnit)}">${this._formatRightValueMarkup(display, displayUnit, false)}</span>`;
          }
          const aboveLabel = heroHeader ? null : row.querySelector(".above-bar-label");
          if (aboveLabel) {
            aboveLabel.innerHTML = `<span class="above-bar-label-name label-left-text">${escapeHtml(rowViewModel.name)}</span>${this._formatAboveValueMarkup(display, displayUnit, false)}`;
          }
          const targetLabelEl = row.querySelector(".target-value-label");
          const peakLabelEl = row.querySelector(".peak-value-label");
          const floorLabelEl = row.querySelector(".floor-value-label");
          const markerModels = (_e = rowViewModel.markers) != null ? _e : [];
          ((_g = (_f = row.querySelectorAll) == null ? void 0 : _f.call(row, ".generic-marker[data-marker-id]")) != null ? _g : []).forEach((markerEl) => {
            var _a2, _b2, _c2, _d2, _e2;
            const markerId = markerEl.dataset.markerId;
            const marker = this._getMarkerModel(markerModels, markerId);
            const labelEl = [...(_b2 = (_a2 = row.querySelectorAll) == null ? void 0 : _a2.call(row, ".generic-value-label[data-marker-id]")) != null ? _b2 : []].find((label) => label.dataset.markerId === markerId);
            if (!labelEl) return;
            this._setDatasetIfChanged(labelEl, "showMarker", (marker == null ? void 0 : marker.showMarker) === false ? "false" : "true");
            this._patchMarkerLabelAppearance(labelEl, marker);
            if ((marker == null ? void 0 : marker.labelVisible) && marker.visible && ((_c2 = marker.label) == null ? void 0 : _c2.text)) {
              this._setTextIfChanged(labelEl, (_e2 = (_d2 = marker.label) == null ? void 0 : _d2.text) != null ? _e2 : null);
              this._setStyleIfChanged(labelEl, "visibility", "visible");
              this._setStyleIfChanged(labelEl, "left", `${Number.isFinite(marker.position) ? marker.position : 0}%`);
            } else {
              this._setStyleIfChanged(labelEl, "visibility", "hidden");
            }
          });
          const targetMarkerModel = this._getMarkerModel(markerModels, "target");
          this._patchMarkerLabelAppearance(targetLabelEl, targetMarkerModel);
          if (targetLabelEl) {
            if ((targetMarkerModel == null ? void 0 : targetMarkerModel.labelVisible) && targetMarkerModel.visible && ((_h = targetMarkerModel.label) == null ? void 0 : _h.text)) {
              this._setTextIfChanged(targetLabelEl, (_j = (_i = targetMarkerModel.label) == null ? void 0 : _i.text) != null ? _j : null);
            } else {
              this._setStyleIfChanged(targetLabelEl, "visibility", "hidden");
            }
          }
          const patchValueLabel = (labelEl, markerType) => {
            var _a2, _b2, _c2;
            if (!labelEl) return;
            const marker = this._getMarkerModel(markerModels, markerType);
            this._patchMarkerLabelAppearance(labelEl, marker);
            if ((marker == null ? void 0 : marker.labelVisible) && marker.visible && ((_a2 = marker.label) == null ? void 0 : _a2.text)) {
              this._setTextIfChanged(labelEl, (_c2 = (_b2 = marker.label) == null ? void 0 : _b2.text) != null ? _c2 : null);
              this._setStyleIfChanged(labelEl, "visibility", "visible");
              this._setStyleIfChanged(labelEl, "left", `${Number.isFinite(marker.position) ? marker.position : 0}%`);
            } else {
              this._setStyleIfChanged(labelEl, "visibility", "hidden");
            }
          };
          patchValueLabel(peakLabelEl, "peak");
          patchValueLabel(floorLabelEl, "floor");
        }
        _update(previousHass = null) {
          var _a, _b, _c, _d;
          if (!this._hass || !this._config) return;
          const rowsEl = this.shadowRoot.querySelector(".rows");
          if (!rowsEl) return;
          const entities = this._config.entities;
          const presence = entities.map((entityCfg) => !!this._hass.states[entityCfg.entity]);
          const presenceChanged = presence.some((present, index) => present !== this._rowPresence[index]);
          if (!this._rendered || presenceChanged) {
            this._rowGeneration += 1;
            this._rowPresence = presence;
            let html = "";
            for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
              const entityCfg = entities[entityIndex];
              const stateObj = this._hass.states[entityCfg.entity];
              if (!stateObj) {
                html += `<div class="row" data-row-index="${entityIndex}"><span style="color:var(--error-color,red);font-size:12px;">Entity not found: ${escapeHtml(entityCfg.entity)}</span></div>`;
                continue;
              }
              const ecfg = this._resolve(entityCfg);
              this._updateExtrema(entityCfg, ecfg, stateObj);
              const rowViewModel = this._buildRowViewModel(entityCfg, ecfg, stateObj);
              const safeMin = rowViewModel.min;
              const safeMax = rowViewModel.max;
              const pct = rowViewModel.percent;
              const color = this._getColor(pct, ecfg, safeMin, safeMax);
              const display = rowViewModel.primaryPresentation.number;
              const displayUnit = rowViewModel.primaryPresentation.unit;
              const targetPct = rowViewModel.targetPercent;
              const targetDisplay = (_b = (_a = rowViewModel.targetPresentation) == null ? void 0 : _a.text) != null ? _b : null;
              const peakPct = rowViewModel.peakPercent;
              const peakDisplay = (_d = (_c = rowViewModel.peakPresentation) == null ? void 0 : _c.number) != null ? _d : null;
              html += this._buildRow(entityCfg, display, displayUnit, pct, color, peakPct, peakDisplay, targetPct, targetDisplay, ecfg.peak_marker.color, ecfg.target_marker.color, safeMin, safeMax, entityIndex);
            }
            this._clearMarkerHover();
            rowsEl.innerHTML = html;
            this._rendered = true;
            const builtRows = rowsEl.querySelectorAll(".row[data-entity]");
            builtRows.forEach((row) => {
              const entityCfg = entities[Number(row.dataset.rowIndex)];
              const stateObj = entityCfg ? this._hass.states[entityCfg.entity] : null;
              if (entityCfg && stateObj) {
                this._patchRow(row, entityCfg, stateObj);
              }
            });
            this._runPostLayoutPasses(builtRows);
            builtRows.forEach((row) => {
              row.addEventListener("click", () => {
                const entityId = row.dataset.entity;
                const event = new CustomEvent("hass-more-info", { composed: true, detail: { entityId } });
                this.dispatchEvent(event);
              });
            });
            return;
          }
          const rows = rowsEl.querySelectorAll(".row[data-entity]");
          for (const row of rows) {
            const entityCfg = entities[Number(row.dataset.rowIndex)];
            if (!entityCfg) continue;
            const stateObj = this._hass.states[entityCfg.entity];
            if (!stateObj) continue;
            this._patchRow(row, entityCfg, stateObj, previousHass);
          }
          this._runPostLayoutPasses(rows);
        }
      };
    }
  });

  // src/editor/shared/editor-config.js
  function cloneContainer(value) {
    return Array.isArray(value) ? [...value] : { ...value != null ? value : {} };
  }
  function cloneDeep(value) {
    if (Array.isArray(value)) {
      return value.map((entry) => cloneDeep(entry));
    }
    if (isObject(value)) {
      const clone = {};
      for (const [key, entry] of Object.entries(value)) {
        clone[key] = cloneDeep(entry);
      }
      return clone;
    }
    return value;
  }
  function serializeConfig(value) {
    const normalize = (input) => {
      if (Array.isArray(input)) {
        return input.map((entry) => normalize(entry));
      }
      if (isObject(input)) {
        return Object.keys(input).sort().reduce((acc, key) => {
          acc[key] = normalize(input[key]);
          return acc;
        }, {});
      }
      return input;
    };
    return JSON.stringify(normalize(value != null ? value : null));
  }
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function setPathValue(target, path, value) {
    if (!path.length) {
      return value;
    }
    const root2 = cloneContainer(target != null ? target : {});
    let cursor = root2;
    let sourceCursor = target;
    for (let index = 0; index < path.length - 1; index++) {
      const key = path[index];
      const nextSource = isObject(sourceCursor == null ? void 0 : sourceCursor[key]) || Array.isArray(sourceCursor == null ? void 0 : sourceCursor[key]) ? sourceCursor[key] : {};
      cursor[key] = cloneContainer(nextSource);
      cursor = cursor[key];
      sourceCursor = nextSource;
    }
    cursor[path[path.length - 1]] = value;
    return root2;
  }
  function deletePathValue(target, path) {
    if (!path.length || !isObject(target)) {
      return target;
    }
    const [key, ...rest] = path;
    if (!(key in target)) {
      return target;
    }
    const cloned = cloneContainer(target);
    if (!rest.length) {
      delete cloned[key];
      return cloned;
    }
    const nextValue = deletePathValue(cloned[key], rest);
    if (nextValue === cloned[key]) {
      return target;
    }
    if (isObject(nextValue) && !Object.keys(nextValue).length) {
      delete cloned[key];
      return cloned;
    }
    cloned[key] = nextValue;
    return cloned;
  }
  function getPathValue(target, path) {
    let cursor = target;
    for (const key of path) {
      if (cursor == null) return void 0;
      cursor = cursor[key];
    }
    return cursor;
  }
  function hasPath(target, path) {
    let cursor = target;
    for (const key of path) {
      if (!isObject(cursor) && !Array.isArray(cursor)) return false;
      if (!(key in cursor)) return false;
      cursor = cursor[key];
    }
    return true;
  }
  function normalizeTextValue(value) {
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }
  function normalizeOptionalEnabled2(value) {
    return value === true ? true : value === false ? false : null;
  }
  function normalizeNumberValue(value) {
    if (value === "" || value === null || value === void 0) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function normalizeDecimalValue(value) {
    if (value === "" || value === null || value === void 0) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return null;
    }
    return parsed;
  }
  function getScopedPath(scope, keyPath) {
    const normalizedPath = Array.isArray(keyPath) ? keyPath : [keyPath];
    if (!scope || scope.type === "card") {
      return normalizedPath;
    }
    if (scope.type === "entity") {
      return ["entities", scope.index, ...normalizedPath];
    }
    return normalizedPath;
  }
  function normalizePath(keyPath) {
    return Array.isArray(keyPath) ? keyPath : [keyPath];
  }
  function removePathsFromTarget(target, keyPaths = []) {
    return keyPaths.reduce((nextTarget, keyPath) => deletePathValue(nextTarget, normalizePath(keyPath)), target);
  }
  function pruneEmptyObjectsInTarget(target, keyPath) {
    let nextTarget = target;
    const normalizedPath = normalizePath(keyPath);
    for (let index = normalizedPath.length; index > 0; index--) {
      const currentPath = normalizedPath.slice(0, index);
      const currentValue = getPathValue(nextTarget, currentPath);
      if (!isObject(currentValue) || Object.keys(currentValue).length) {
        break;
      }
      nextTarget = deletePathValue(nextTarget, currentPath);
    }
    return nextTarget;
  }
  function hasExplicitOverrideValue(value) {
    return value !== "" && value !== void 0 && value !== null;
  }
  function hasResolvableOverride(parts) {
    return hasExplicitOverrideValue(parts == null ? void 0 : parts.fixed) || hasExplicitOverrideValue(parts == null ? void 0 : parts.entity);
  }
  function getEffectiveDisplayValue(context, scope, canonicalPath, fallbackPaths = []) {
    const valuesToTry = [canonicalPath, ...fallbackPaths];
    for (const path of valuesToTry) {
      const value = context.read(scope, path);
      if (value !== void 0 && value !== null && value !== "") {
        return value;
      }
    }
    if ((scope == null ? void 0 : scope.type) === "entity") {
      for (const path of valuesToTry) {
        const value = context.read({ type: "card" }, path);
        if (value !== void 0 && value !== null && value !== "") {
          return value;
        }
      }
    }
    return "";
  }
  var init_editor_config = __esm({
    "src/editor/shared/editor-config.js"() {
    }
  });

  // src/editor/shared/editor-controls.js
  function renderEntityInput(entry, index) {
    if (customElements.get("ha-entity-picker")) {
      return `<ha-entity-picker data-kind="entity-picker" data-index="${index}"></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="entity-input" data-index="${index}" value="${escapeAttribute(entry.entity)}" placeholder="sensor.example" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }
  function renderEntitySourceInput(kind, index, value, placeholder = "sensor.example", extraDataset = {}) {
    const extraAttrs = Object.entries(extraDataset).map(([key, entry]) => `data-${key}="${escapeAttribute(entry)}"`).join(" ");
    if (customElements.get("ha-entity-picker")) {
      return `<ha-entity-picker data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ""}></ha-entity-picker>`;
    }
    return `<input type="text" data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ""} value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">`;
  }
  function renderBuiltinMarkerLabelControls(scope, key, title, options) {
    var _a;
    const isEntity = (scope == null ? void 0 : scope.type) === "entity";
    const prefix = isEntity ? `entity-${scope.index}-${key}` : key;
    const attr = isEntity ? `data-kind="entity-${key}-label-` : `data-field="${key}-label-`;
    const suffix = isEntity ? `" data-index="${scope.index}"` : '"';
    return `
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show" type="checkbox" ${attr}show${suffix}${options.show ? " checked" : ""}>
        <label for="${prefix}-label-show">Show ${title} label</label>
      </div></div>
      <div class="field-row"><label for="${prefix}-label-text">${title} label text</label>
        <input id="${prefix}-label-text" type="text" ${attr}text${suffix} value="${escapeAttribute((_a = options.text) != null ? _a : "")}" placeholder="optional semantic text">
      </div>
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show-value" type="checkbox" ${attr}show-value${suffix}${options.showValue ? " checked" : ""}>
        <label for="${prefix}-label-show-value">Show value</label>
      </div></div>
      <div class="field-row"><div class="toggle">
        <input id="${prefix}-label-show-unit" type="checkbox" ${attr}show-unit${suffix}${options.showUnit ? " checked" : ""}>
        <label for="${prefix}-label-show-unit">Show unit</label>
      </div></div>
      <div class="field-row"><label for="${prefix}-label-precision">${title} label precision</label>
        <input id="${prefix}-label-precision" type="number" min="0" step="1" ${attr}precision${suffix} value="${escapeAttribute(options.precision)}" placeholder="inherit primary precision">
      </div>`;
  }
  function renderResetOptions(value) {
    const selected = normalizeTextValue(value).trim().toLowerCase() || "never";
    const options = [
      "never",
      "quarterly",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      ...Array.from({ length: 59 }, (_, index) => `${index + 1}m`),
      ...Array.from({ length: 23 }, (_, index) => `${index + 1}h`)
    ];
    return options.map((option) => `<option value="${option}"${selected === option ? " selected" : ""}>${option}</option>`).join("");
  }
  function escapeAttribute(value) {
    return normalizeTextValue(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function isHexColorValue(value) {
    return typeof value === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  }
  function expandHexColor(value) {
    if (!isHexColorValue(value)) {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.length === 7) {
      return normalized;
    }
    return `#${normalized.slice(1).split("").map((char) => char + char).join("")}`;
  }
  function normalizeColorComparisonValue(value) {
    var _a;
    const normalizedText = normalizeTextValue(value).trim().toLowerCase();
    if (!normalizedText) {
      return "";
    }
    return (_a = expandHexColor(normalizedText)) != null ? _a : normalizedText;
  }
  function getColorPickerValue(value, fallbackHex = "#000000") {
    var _a, _b;
    return (_b = (_a = expandHexColor(value)) != null ? _a : expandHexColor(fallbackHex)) != null ? _b : "#000000";
  }
  function normalizeEditorColorValue(value, preserveText = false) {
    const text = normalizeTextValue(value);
    return preserveText && text.trim() ? text : text.trim();
  }
  function normalizeScalePercentageInput(value) {
    const number = normalizeNumberValue(value);
    return number !== null && number >= 0 && number <= 100 ? number : null;
  }
  function renderScalePercentageInput(id, routing, value) {
    return `<input id="${id}" type="number" min="0" max="100" step="any" ${routing} value="${escapeAttribute(value)}">%`;
  }
  function getMarkerSourceMode(source) {
    if (Number.isFinite(source.percent)) return "percent";
    if (source.entity) return source.fixed !== "" && source.fixed !== void 0 ? "entity-fallback" : "entity";
    return "fixed";
  }
  function renderMarkerPercentageControls(key, mode, percent) {
    return `<div class="field-row">
      <label for="${key}-source-mode">Source</label>
      <select id="${key}-source-mode" data-field="${key}-source-mode">
        ${[["fixed", "Fixed"], ["entity", "Entity"], ["entity-fallback", "Entity with fixed fallback"], ["percent", "Percentage"]].map(([value, title]) => `<option value="${value}"${mode === value ? " selected" : ""}>${title}</option>`).join("")}
      </select>
    </div>
    <div class="field-row">
      <label for="${key}-percent">Scale percentage</label>
      ${renderScalePercentageInput(`${key}-percent`, `data-field="${key}-percent"`, percent)}
      <button type="button" data-action="${key}-clear-percent">Clear percentage</button>
      <div class="section-note">Percentage uses the current scale. Entity and fixed values take precedence when present.</div>
    </div>`;
  }
  function renderColorInput({ id, field = null, kind = null, index = null, value = "", fallbackHex = "#000000", placeholder = "", extraDataset = {}, cssText = false, label = "Color" }) {
    const controlValue = normalizeTextValue(value).trim();
    const pickerValue = getColorPickerValue(controlValue, fallbackHex);
    const extraAttrs = Object.entries(extraDataset).map(([key, entry]) => `data-${key}="${escapeAttribute(entry)}"`).join(" ");
    const baseAttrs = field ? `data-field="${field}"${extraAttrs ? ` ${extraAttrs}` : ""}` : `data-kind="${kind}" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ""}`;
    const fallbackAttrs = field ? `data-field="${field}-text-fallback"${extraAttrs ? ` ${extraAttrs}` : ""}` : `data-kind="${kind}-text-fallback" data-index="${index}"${extraAttrs ? ` ${extraAttrs}` : ""}`;
    return `
      <div class="field-grid">
        <input id="${id}" type="color" ${baseAttrs} value="${escapeAttribute(pickerValue)}">
        ${cssText || controlValue && !isHexColorValue(controlValue) ? `<input${cssText ? ` id="${id}-text-fallback" data-css-color="true" aria-label="${escapeAttribute(label)} (CSS value)"` : ""} type="text" ${fallbackAttrs} value="${escapeAttribute(cssText ? value : controlValue)}" placeholder="${escapeAttribute(placeholder || "CSS color value")}">` : ""}
      </div>
    `;
  }
  var init_editor_controls = __esm({
    "src/editor/shared/editor-controls.js"() {
      init_editor_config();
    }
  });

  // src/editor/shared/editor-styles.js
  var editorStyles;
  var init_editor_styles = __esm({
    "src/editor/shared/editor-styles.js"() {
      editorStyles = `
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
	      `;
    }
  });

  // src/editor/shared/editor-disclosures.js
  function renderCardGroup({ group, title, summary, content, inactive = false }, expanded) {
    return `
      <div class="override-group card-subgroup${inactive ? " is-inactive" : ""}" data-group="${group}" data-expanded="${expanded ? "true" : "false"}">
        <button
          type="button"
          id="card-group-${group}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${group}"
          aria-expanded="${expanded ? "true" : "false"}"
        >
          <span id="card-group-${group}-title" class="override-group-title">${expanded ? "\u25BE" : "\u25B8"} ${title}</span>
          <span id="card-group-${group}-summary" class="override-group-summary">${escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? "grid" : "none"};">
          ${content}
        </div>
      </div>
    `;
  }
  function renderMarkersSection({ renderGroup, target, peak, floor, references }) {
    return `	        <div class="section">
          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Configure Target, Peak, Floor, and custom reference markers.</div>
	          </div>
	          <div class="field-grid">
            ${renderGroup({ group: "marker-target", title: "Target", ...target })}
            ${renderGroup({ group: "marker-peak", title: "Peak", ...peak })}
            ${renderGroup({ group: "marker-floor", title: "Floor", ...floor })}
            ${renderGroup({ group: "generic-markers", title: "Generic Reference Markers", ...references })}
          </div>
	        </div>`;
  }
  var init_editor_disclosures = __esm({
    "src/editor/shared/editor-disclosures.js"() {
      init_editor_controls();
    }
  });

  // src/editor/shared/editor-numeric-drafts.js
  var NumericInputDrafts;
  var init_editor_numeric_drafts = __esm({
    "src/editor/shared/editor-numeric-drafts.js"() {
      init_editor_config();
      NumericInputDrafts = class {
        constructor() {
          this.values = /* @__PURE__ */ new Map();
        }
        reset() {
          this.values.clear();
        }
        handle(event, rendering = false) {
          var _a, _b, _c, _d, _e, _f;
          const input = event.target;
          if (rendering && (input == null ? void 0 : input.type) === "number") return true;
          const route = (_d = (_c = (_a = input == null ? void 0 : input.dataset) == null ? void 0 : _a.field) != null ? _c : (_b = input == null ? void 0 : input.dataset) == null ? void 0 : _b.kind) != null ? _d : "";
          if (route === "generic-marker-source-mode" && input.id) {
            for (const suffix of ["fixed", "fallback", "percent"]) this.values.delete(input.id.replace(/source-mode$/, suffix));
          }
          if ((input == null ? void 0 : input.type) !== "number" || !input.id || /^(?:entity-)?gradient-/.test(route) || /^(?:target|baseline)-percent$/.test(route)) return false;
          if (input.isConnected === false) return true;
          const value = input.value;
          const percentage = route === "generic-marker-percent";
          const precision = /(?:precision|decimal)$/.test(route);
          const number = precision ? normalizeDecimalValue(value) : normalizeNumberValue(value);
          const complete = number !== null && !((_e = input.validity) == null ? void 0 : _e.badInput) && (!/(?:layout-height|override-height)$/.test(route) || number >= 24);
          const clear = event.type === "change" && value === "" && !((_f = input.validity) == null ? void 0 : _f.badInput) && !percentage;
          if (complete || clear) {
            this.values.delete(input.id);
            return false;
          }
          this.values.set(input.id, value);
          return true;
        }
        captureFocus(root2) {
          const input = root2.activeElement;
          return input && this.values.has(input.id) ? input.id : null;
        }
        apply(root2, focusId = null) {
          var _a, _b, _c, _d, _e, _f;
          for (const [id, value] of this.values) {
            const input = (_b = (_a = root2.getElementById) == null ? void 0 : _a.call(root2, id)) != null ? _b : root2.querySelector(`#${id}`);
            if (!input) {
              this.values.delete(id);
              continue;
            }
            if (input !== root2.activeElement) input.value = value;
          }
          if (focusId) (_f = (_e = (_d = (_c = root2.getElementById) == null ? void 0 : _c.call(root2, focusId)) != null ? _d : root2.querySelector(`#${focusId}`)) == null ? void 0 : _e.focus) == null ? void 0 : _f.call(_e, { preventScroll: true });
        }
      };
    }
  });

  // src/editor/sections/scale.js
  function getScaleParts(context, scope, key, effective = false) {
    return context.source(scope, key, effective);
  }
  function getScaleFixedValue(context, key) {
    return getScaleParts(context, { type: "card" }, key).fixed;
  }
  function getScaleEntityValue(context, key) {
    return getScaleParts(context, { type: "card" }, key).entity;
  }
  function setScalePart(context, scope, key, part, value) {
    return context.setSource(scope, key, part, value);
  }
  function hasScaleOverride(context, scope) {
    const explicit = (value) => value !== "" && value !== void 0 && value !== null;
    return ["min", "max"].some((key) => {
      const parts = getScaleParts(context, scope, key);
      return explicit(parts == null ? void 0 : parts.fixed) || explicit(parts == null ? void 0 : parts.entity);
    });
  }
  function getScaleOverrideSummary(context, scope) {
    const parts = [];
    const min = getScaleParts(context, scope, "min");
    const max = getScaleParts(context, scope, "max");
    if (min.entity) parts.push("Min entity");
    else if (min.fixed !== "" && min.fixed !== void 0) parts.push(`Min ${min.fixed}`);
    if (max.entity) parts.push("Max entity");
    else if (max.fixed !== "" && max.fixed !== void 0) parts.push(`Max ${max.fixed}`);
    return parts.length ? parts.join(" \u2022 ") : "Inherited";
  }
  function clearScaleOverride(context, scope) {
    return context.mutate(scope, (target) => {
      let nextTarget = deletePathValue(target, ["scale", "min"]);
      nextTarget = deletePathValue(nextTarget, ["scale", "max"]);
      nextTarget = deletePathValue(nextTarget, ["min"]);
      nextTarget = deletePathValue(nextTarget, ["max"]);
      nextTarget = deletePathValue(nextTarget, ["min_entity"]);
      nextTarget = deletePathValue(nextTarget, ["max_entity"]);
      return pruneEmptyObjectsInTarget(nextTarget, ["scale"]);
    }, { rerender: true });
  }
  function handleScaleField(context, { field, kind, index, value }) {
    if (field === "scale-min" || field === "scale-max") {
      setScalePart(context, { type: "card" }, field.slice(6), "fixed", value);
      return true;
    }
    if (kind === "scale-min-entity-source" || kind === "scale-max-entity-source") {
      setScalePart(context, { type: "card" }, kind.split("-")[1], "entity", value);
      return true;
    }
    const scope = { type: "entity", index: Number(index) };
    if (kind === "entity-scale-inherit") {
      if (value) clearScaleOverride(context, scope);
      return true;
    }
    if (["entity-override-min", "entity-override-max", "entity-override-min-entity-source", "entity-override-max-entity-source"].includes(kind)) {
      setScalePart(context, scope, kind.split("-")[2], kind.endsWith("-entity-source") ? "entity" : "fixed", value);
      return true;
    }
    return false;
  }
  function renderScaleSection(context, scope) {
    if ((scope == null ? void 0 : scope.type) === "entity") {
      const index = scope.index;
      const minParts = getScaleParts(context, scope, "min", true);
      const maxParts = getScaleParts(context, scope, "max", true);
      const scaleInherited = !hasScaleOverride(context, scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-scale-inherit" type="checkbox" data-kind="entity-scale-inherit" data-index="${index}"${scaleInherited ? " checked" : ""}>
	                          <label for="entity-${index}-scale-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="section-note">Fixed values are used as fallback when entity values are unavailable.</div>
                      <div class="field-row">
                        <label for="entity-${index}-min">Min fallback</label>
                        <input id="entity-${index}-min" type="number" step="any" data-kind="entity-override-min" data-index="${index}" value="${escapeAttribute(minParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Min entity</label>
                        ${renderEntitySourceInput("entity-override-min-entity-source", index, minParts.entity, "inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-max">Max fallback</label>
                        <input id="entity-${index}-max" type="number" step="any" data-kind="entity-override-max" data-index="${index}" value="${escapeAttribute(maxParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Max entity</label>
                        ${renderEntitySourceInput("entity-override-max-entity-source", index, maxParts.entity, "inherit card default")}
                      </div>
	                          `;
    }
    const scaleMin = getScaleFixedValue(context, "min");
    const scaleMax = getScaleFixedValue(context, "max");
    const scaleMinEntity = getScaleEntityValue(context, "min");
    const scaleMaxEntity = getScaleEntityValue(context, "max");
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Scale</h3>
	            <div class="section-note">Entity values take precedence. Fixed values are used as fallback.</div>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="scale-min">Min fallback</label>
              <input id="scale-min" type="number" step="any" data-field="scale-min" value="${escapeAttribute(scaleMin)}">
            </div>
            <div class="field-row">
              <label>Min entity</label>
              ${renderEntitySourceInput("scale-min-entity-source", "card", scaleMinEntity)}
            </div>
            <div class="field-row">
              <label for="scale-max">Max fallback</label>
              <input id="scale-max" type="number" step="any" data-field="scale-max" value="${escapeAttribute(scaleMax)}">
            </div>
            <div class="field-row">
              <label>Max entity</label>
              ${renderEntitySourceInput("scale-max-entity-source", "card", scaleMaxEntity)}
            </div>
          </div>
	        </div>`;
  }
  var init_scale = __esm({
    "src/editor/sections/scale.js"() {
      init_editor_config();
      init_editor_controls();
    }
  });

  // src/editor/sections/formatting.js
  function getFormattingValue(context, scope, key) {
    var _a, _b;
    return (_b = (_a = context.read(scope, ["formatting", key])) != null ? _a : context.read(scope, [key])) != null ? _b : "";
  }
  function getEffectiveFormattingValue(context, scope, key) {
    const paths = [["formatting", key], [key]];
    for (const path of paths) {
      const value = context.read(scope, path);
      if (value !== void 0 && value !== null && value !== "") return value;
    }
    if ((scope == null ? void 0 : scope.type) === "entity") {
      for (const path of paths) {
        const value = context.read({ type: "card" }, path);
        if (value !== void 0 && value !== null && value !== "") return value;
      }
    }
    return "";
  }
  function setFormattingUnit(context, scope, rawValue) {
    const value = normalizeTextValue(rawValue).trim();
    return context.mutate(scope, (target) => {
      let nextTarget = value ? setPathValue(target, ["formatting", "unit"], value) : deletePathValue(target, ["formatting", "unit"]);
      nextTarget = deletePathValue(nextTarget, ["unit"]);
      return pruneEmptyObjectsInTarget(nextTarget, ["formatting"]);
    });
  }
  function setFormattingDecimal(context, scope, rawValue) {
    const value = normalizeDecimalValue(rawValue);
    const empty = rawValue === "" || rawValue === null || rawValue === void 0;
    if (!empty && value === null) return false;
    return context.mutate(scope, (target) => {
      let nextTarget = empty ? deletePathValue(target, ["formatting", "decimal"]) : setPathValue(target, ["formatting", "decimal"], value);
      nextTarget = deletePathValue(nextTarget, ["decimal"]);
      return pruneEmptyObjectsInTarget(nextTarget, ["formatting"]);
    });
  }
  function clearFormattingOverride(context, scope) {
    return context.mutate(scope, (target) => {
      const nextTarget = removePathsFromTarget(target, [["formatting", "unit"], ["formatting", "decimal"], ["unit"], ["decimal"]]);
      return pruneEmptyObjectsInTarget(nextTarget, ["formatting"]);
    }, { rerender: true });
  }
  function hasFormattingOverride(context, scope) {
    var _a;
    const value = (_a = context.read(scope, ["formatting"])) != null ? _a : {};
    if (isObject(value) && (Object.prototype.hasOwnProperty.call(value, "unit") || Object.prototype.hasOwnProperty.call(value, "decimal"))) return true;
    return context.read(scope, ["unit"]) !== void 0 || context.read(scope, ["decimal"]) !== void 0;
  }
  function getFormattingSummary(context, scope) {
    const parts = [];
    const unit = getFormattingValue(context, scope, "unit");
    const decimal = getFormattingValue(context, scope, "decimal");
    if (unit !== "") parts.push(`Unit ${unit}`);
    if (decimal !== "") parts.push(`${decimal} ${Number(decimal) === 1 ? "decimal" : "decimals"}`);
    return parts.length ? parts.join(" \u2022 ") : "Inherited";
  }
  function handleFormattingField(context, { field, kind, index, value }) {
    if (field === "formatting-unit" || field === "formatting-decimal") {
      const setter = field === "formatting-unit" ? setFormattingUnit : setFormattingDecimal;
      setter(context, { type: "card" }, value);
      return true;
    }
    const scope = { type: "entity", index: Number(index) };
    if (kind === "entity-formatting-inherit") {
      if (value) clearFormattingOverride(context, scope);
      return true;
    }
    if (kind === "entity-formatting-unit" || kind === "entity-formatting-decimal") {
      const setter = kind === "entity-formatting-unit" ? setFormattingUnit : setFormattingDecimal;
      setter(context, scope, value);
      return true;
    }
    return false;
  }
  function renderFormattingSection(context, scope) {
    if ((scope == null ? void 0 : scope.type) === "entity") {
      const index = scope.index;
      const formattingInherited = !hasFormattingOverride(context, scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-formatting-inherit" type="checkbox" data-kind="entity-formatting-inherit" data-index="${index}"${formattingInherited ? " checked" : ""}>
                          <label for="entity-${index}-formatting-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-unit">Unit</label>
                        <input id="entity-${index}-formatting-unit" type="text" data-kind="entity-formatting-unit" data-index="${index}" value="${escapeAttribute(getEffectiveFormattingValue(context, scope, "unit"))}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-formatting-decimal">Decimals</label>
                        <input id="entity-${index}-formatting-decimal" type="number" min="0" step="1" data-kind="entity-formatting-decimal" data-index="${index}" value="${escapeAttribute(getEffectiveFormattingValue(context, scope, "decimal"))}" placeholder="inherit card default">
                      </div>
	                          `;
    }
    const formattingUnit = getFormattingValue(context, { type: "card" }, "unit");
    const formattingDecimal = getFormattingValue(context, { type: "card" }, "decimal");
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Formatting</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="formatting-unit">Unit</label>
              <input id="formatting-unit" type="text" data-field="formatting-unit" value="${escapeAttribute(formattingUnit)}">
            </div>
            <div class="field-row">
              <label for="formatting-decimal">Decimals</label>
              <input id="formatting-decimal" type="number" min="0" step="1" data-field="formatting-decimal" value="${escapeAttribute(formattingDecimal)}">
            </div>
          </div>
	        </div>`;
  }
  var init_formatting = __esm({
    "src/editor/sections/formatting.js"() {
      init_editor_config();
      init_editor_controls();
    }
  });

  // src/editor/sections/bar-appearance.js
  function getFillStyleFromColorMode(colorMode) {
    switch (colorMode) {
      case "single":
        return "solid";
      case "gradient":
        return "gradient";
      case "severity":
        return "bands";
      case "severity_gradient":
        return "band_gradient";
      default:
        return "bands";
    }
  }
  function getFillStyleValue(context, scope) {
    var _a;
    const fillStyle = context.read(scope, ["bar", "fill_style"]);
    if (fillStyle) return fillStyle;
    const colorMode = (_a = context.read(scope, ["bar", "color_mode"])) != null ? _a : context.read(scope, ["color_mode"]);
    return getFillStyleFromColorMode(colorMode);
  }
  function getEffectiveFillStyleValue(context, scope) {
    if ((scope == null ? void 0 : scope.type) === "entity") {
      return normalizeBarConfig(context.read(scope, []), context.read({ type: "card" }, []), { isCardScope: false }).fill_style;
    }
    return normalizeBarConfig(context.read({ type: "card" }, []), null, { isCardScope: true }).fill_style;
  }
  function getBarColorValue(context, scope) {
    var _a, _b;
    return (_b = (_a = context.read(scope, ["bar", "color"])) != null ? _a : context.read(scope, ["color"])) != null ? _b : "#4a9eff";
  }
  function getEffectiveBarColorValue(context, scope) {
    const paths = [["bar", "color"], ["color"]];
    for (const path of paths) {
      const value = context.read(scope, path);
      if (value !== void 0 && value !== null && value !== "") return value || "#4a9eff";
    }
    if ((scope == null ? void 0 : scope.type) === "entity") {
      for (const path of paths) {
        const value = context.read({ type: "card" }, path);
        if (value !== void 0 && value !== null && value !== "") return value || "#4a9eff";
      }
    }
    return "#4a9eff";
  }
  function setAppearanceValue(context, scope, key, value, deprecatedKeys = []) {
    const options = { deprecatedKeys, prunePaths: [["bar"]] };
    return context.mutate(scope, (target) => {
      let nextTarget = value === void 0 ? deletePathValue(target, ["bar", key]) : setPathValue(target, ["bar", key], value);
      nextTarget = removePathsFromTarget(nextTarget, deprecatedKeys);
      return pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
    }, options);
  }
  function setBarFillStyle(context, scope, rawValue) {
    const value = normalizeTextValue(rawValue).trim();
    return setAppearanceValue(context, scope, "fill_style", value || void 0, [["color_mode"]]);
  }
  function setBarColor(context, scope, rawValue, options = {}) {
    const value = normalizeEditorColorValue(rawValue, options.cssText);
    const remove = !value || normalizeColorComparisonValue(value) === normalizeColorComparisonValue("#4a9eff");
    return setAppearanceValue(context, scope, "color", remove ? void 0 : value, [["color"]]);
  }
  function getBarSolidFillValue(context, scope) {
    return !!context.read(scope, ["bar", "solid_fill"]);
  }
  function getEffectiveBarSolidFillValue(context, scope) {
    if ((scope == null ? void 0 : scope.type) !== "entity") return getBarSolidFillValue(context, scope);
    const localValue = context.read(scope, ["bar", "solid_fill"]);
    if (localValue !== void 0) return !!localValue;
    return getBarSolidFillValue(context, { type: "card" });
  }
  function setBarSolidFill(context, scope, value) {
    return setAppearanceValue(context, scope, "solid_fill", value ? true : void 0);
  }
  function getBarAnimatedValue(context, scope) {
    return !!normalizeBarConfig(context.read(scope, []), (scope == null ? void 0 : scope.type) === "entity" ? context.read({ type: "card" }, []) : null).animated;
  }
  function setBarAnimated(context, scope, value) {
    var _a;
    const fallback = (_a = context.read(scope, ["animated"])) != null ? _a : (scope == null ? void 0 : scope.type) === "entity" ? normalizeBarConfig(context.read({ type: "card" }, []), null).animated : true;
    return setAppearanceValue(context, scope, "animated", value ? fallback ? void 0 : true : false);
  }
  function clearBarAppearanceOverride(context, scope) {
    return context.mutate(scope, (target) => {
      const nextTarget = removePathsFromTarget(target, [
        ["bar", "fill_style"],
        ["bar", "color"],
        ["bar", "solid_fill"],
        ["color_mode"],
        ["color"]
      ]);
      return pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
    }, { rerender: true });
  }
  function hasBarAppearanceOverride(context, scope) {
    var _a;
    const bar = (_a = context.read(scope, ["bar"])) != null ? _a : {};
    if (isObject(bar) && (Object.prototype.hasOwnProperty.call(bar, "fill_style") || Object.prototype.hasOwnProperty.call(bar, "color") || Object.prototype.hasOwnProperty.call(bar, "solid_fill"))) return true;
    return context.read(scope, ["color_mode"]) !== void 0 || context.read(scope, ["color"]) !== void 0;
  }
  function getBarAppearanceSummary(context, scope) {
    var _a;
    const parts = [];
    const fillStyle = getFillStyleValue(context, scope);
    const color = (_a = context.read(scope, ["bar", "color"])) != null ? _a : context.read(scope, ["color"]);
    if (fillStyle && fillStyle !== "bands") parts.push(fillStyle.replace(/_/g, " "));
    if (color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue("#4a9eff")) parts.push("Custom color");
    return parts.length ? parts.join(" \u2022 ") : "Inherited";
  }
  function handleBarAppearanceField(context, { field, kind, index, value }, options = {}) {
    if (options.animation && field === "bar-animated") {
      setBarAnimated(context, { type: "card" }, value);
      return true;
    }
    const rootSetters = { "bar-fill-style": setBarFillStyle, "bar-color": setBarColor, "bar-solid-fill": setBarSolidFill };
    if (Object.prototype.hasOwnProperty.call(rootSetters, field)) {
      rootSetters[field](context, { type: "card" }, value, options);
      return true;
    }
    const scope = { type: "entity", index: Number(index) };
    if (kind === "entity-bar-inherit") {
      if (value) clearBarAppearanceOverride(context, scope);
      return true;
    }
    const rowSetters = { "entity-bar-fill-style": setBarFillStyle, "entity-bar-color": setBarColor, "entity-bar-solid-fill": setBarSolidFill };
    if (Object.prototype.hasOwnProperty.call(rowSetters, kind)) {
      rowSetters[kind](context, scope, value);
      return true;
    }
    return false;
  }
  function renderBarAppearanceSection(context, scope, renderChildren = () => "", options = {}) {
    if ((scope == null ? void 0 : scope.type) === "entity") {
      const index = scope.index;
      const barAppearanceInherited = !hasBarAppearanceOverride(context, scope);
      return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-bar-inherit" type="checkbox" data-kind="entity-bar-inherit" data-index="${index}"${barAppearanceInherited ? " checked" : ""}>
                          <label for="entity-${index}-bar-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-fill-style">Fill style</label>
                        <select id="entity-${index}-bar-fill-style" data-kind="entity-bar-fill-style" data-index="${index}" value="${escapeAttribute(getEffectiveFillStyleValue(context, scope))}">
                          <option value="bands"${getEffectiveFillStyleValue(context, scope) === "bands" ? " selected" : ""}>bands</option>
                          <option value="solid"${getEffectiveFillStyleValue(context, scope) === "solid" ? " selected" : ""}>solid</option>
                          <option value="gradient"${getEffectiveFillStyleValue(context, scope) === "gradient" ? " selected" : ""}>gradient</option>
                          <option value="soft_bands"${getEffectiveFillStyleValue(context, scope) === "soft_bands" ? " selected" : ""}>soft_bands</option>
                          <option value="band_gradient"${getEffectiveFillStyleValue(context, scope) === "band_gradient" ? " selected" : ""}>band_gradient</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-bar-solid-fill" type="checkbox" data-kind="entity-bar-solid-fill" data-index="${index}"${getEffectiveBarSolidFillValue(context, scope) ? " checked" : ""}>
                          <label for="entity-${index}-bar-solid-fill">Solid fill</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-bar-color">Bar color</label>
                        ${renderColorInput({
        id: `entity-${index}-bar-color`,
        kind: "entity-bar-color",
        index,
        value: getEffectiveBarColorValue(context, scope),
        fallbackHex: "#4a9eff",
        placeholder: "inherit card default"
      })}
                      </div>
	                          `;
    }
    const fillStyle = getEffectiveFillStyleValue(context, { type: "card" });
    const barColor = getBarColorValue(context, { type: "card" });
    const barSolidFill = getBarSolidFillValue(context, { type: "card" });
    return `	        <div class="section">
	          <div class="section-head">
	            <h3>Bar Appearance</h3>
	            <div class="section-note">Choose the bar rendering mode and base bar colors.</div>
	          </div>
          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-fill-style">Fill style</label>
              <select id="bar-fill-style" data-field="bar-fill-style" value="${escapeAttribute(fillStyle)}">
                <option value="solid"${fillStyle === "solid" ? " selected" : ""}>solid</option>
                <option value="gradient"${fillStyle === "gradient" ? " selected" : ""}>gradient</option>
                <option value="bands"${fillStyle === "bands" ? " selected" : ""}>bands</option>
                <option value="band_gradient"${fillStyle === "band_gradient" ? " selected" : ""}>band_gradient</option>
                <option value="soft_bands"${fillStyle === "soft_bands" ? " selected" : ""}>soft_bands</option>
              </select>
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="bar-solid-fill" type="checkbox" data-field="bar-solid-fill"${barSolidFill ? " checked" : ""}>
                <label for="bar-solid-fill">Solid fill</label>
              </div>
            </div>
            ${options.animation ? `<div class="field-row"><div class="toggle">
              <input id="bar-animated" type="checkbox" data-field="bar-animated"${getBarAnimatedValue(context, scope) ? " checked" : ""}>
              <label for="bar-animated">Animated</label>
            </div></div>` : ""}<div class="field-row">
              <label for="bar-color">Bar color</label>
              ${renderColorInput({
      cssText: options.cssText,
      label: "Bar color",
      id: "bar-color",
      field: "bar-color",
      value: barColor,
      fallbackHex: "#4a9eff",
      placeholder: "#4a9eff"
    })}
            </div>
          </div>${renderChildren()}
	        </div>`;
  }
  var init_bar_appearance = __esm({
    "src/editor/sections/bar-appearance.js"() {
      init_normalize();
      init_editor_config();
      init_editor_controls();
    }
  });

  // src/editor/shared/palette-section.js
  var PaletteSection;
  var init_palette_section = __esm({
    "src/editor/shared/palette-section.js"() {
      init_bar_appearance();
      init_editor_config();
      PaletteSection = class {
        constructor(context, ui, array) {
          this.context = context;
          this.ui = ui;
          this.array = array;
        }
        get shadowRoot() {
          return this.ui.root();
        }
        fillStyle(scope) {
          return getEffectiveFillStyleValue(this.context, scope);
        }
        _getShadowElementById(id) {
          var _a, _b, _c, _d;
          return (_d = (_b = (_a = this.shadowRoot) == null ? void 0 : _a.getElementById) == null ? void 0 : _b.call(_a, id)) != null ? _d : (_c = this.shadowRoot) == null ? void 0 : _c.querySelector(`#${id}`);
        }
        _renderListRows(items, renderItem) {
          return items.map(renderItem).join("");
        }
        handle(event, mode = event.type) {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          const target = event.target;
          if (mode === "input" && (target == null ? void 0 : target.type) === "checkbox") return false;
          const rawKind = (_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.kind;
          const kind = rawKind == null ? void 0 : rawKind.replace(/-text-fallback$/, "");
          const action = (_b = target == null ? void 0 : target.dataset) == null ? void 0 : _b.action;
          const segment = !!this._getScopedSegmentsValue;
          const prefix = segment ? "segment" : "gradient";
          const isEntity = (_c = mode === "click" ? action : kind) == null ? void 0 : _c.includes("entity-");
          const scope = isEntity ? { type: "entity", index: Number(target.dataset.index) } : { type: "card" };
          const local = kind == null ? void 0 : kind.replace(/^entity-/, "");
          const index = Number(isEntity ? target.dataset[segment ? "segmentIndex" : "stopIndex"] : (_d = target == null ? void 0 : target.dataset) == null ? void 0 : _d.index);
          const rows = () => segment ? this._getScopedSegmentsValue(scope) : this._getScopedGradientStopsValue(scope);
          const write = (next2, options, operation) => segment ? this._setScopedSegments(scope, next2, options, operation) : this._setScopedGradientStops(scope, next2, options, operation);
          const commit = () => segment ? this._commitSegmentDraft(scope) : this._commitGradientStopDraft(scope);
          const refresh = () => segment ? this._refreshSegmentUi(scope) : this._refreshGradientDraftUi(scope);
          if (mode === "click") {
            if (![
              "add-segment",
              "remove-segment",
              "add-entity-segment",
              "remove-entity-segment",
              "add-gradient-stop",
              "remove-gradient-stop",
              "add-entity-gradient-stop",
              "remove-entity-gradient-stop"
            ].includes(action) || !action.includes(prefix)) return false;
            if (action.startsWith("add-")) {
              this.ui.focus(`#${isEntity ? `entity-${scope.index}-` : ""}${prefix}-draft-${segment ? "from" : "pos"}`);
              commit();
            } else {
              write(rows().filter((_, i) => i !== index), { rerender: true, ...segment ? { sort: true } : {} }, { type: "remove", index });
            }
            return true;
          }
          if (kind === `entity-${segment ? "segments" : "gradient-stops"}-inherit`) {
            if (target.checked) segment ? this._clearSegmentsOverride(scope) : this._clearGradientStopsOverride(scope);
            return true;
          }
          if (!(local == null ? void 0 : local.startsWith(`${prefix}-`))) return false;
          const draft = local.startsWith(`${prefix}-draft-`);
          const field = local.slice((draft ? `${prefix}-draft-` : `${prefix}-`).length);
          const value = (_f = (_e = event.detail) == null ? void 0 : _e.value) != null ? _f : target.value;
          if (mode === "keydown") {
            if (event.key === "Escape" && draft) {
              (_g = event.preventDefault) == null ? void 0 : _g.call(event);
              if (segment) this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
              else this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), this._createGradientStopDraftState(scope));
              this.ui.render();
            } else if (event.key === "Enter") {
              (_h = event.preventDefault) == null ? void 0 : _h.call(event);
              if (draft) commit();
              else if (segment && ["from", "to"].includes(field)) this._commitSegmentBoundaryEdit(scope, index, field, value, target);
              else if (!segment && field === "pos") this._commitGradientStopPosEdit(scope, index, value, target);
            }
            return true;
          }
          if (draft) {
            if (segment) this._setSegmentDraftField(scope, field, value);
            else this._setGradientStopsDraftField(scope, field, value);
            return true;
          }
          if (segment && ["from", "to"].includes(field) || !segment && field === "pos") {
            if (mode === "input") {
              if (segment) {
                this._setSegmentBoundaryText(scope, index, field, value);
                refresh();
              } else this._setGradientStopPosText(scope, index, value);
            } else if (mode === "change") {
              if (segment) this._commitSegmentBoundaryEdit(scope, index, field, value, target);
              else this._commitGradientStopPosEdit(scope, index, value, target);
            }
            return true;
          }
          const current = rows();
          const next = current.map((row, i) => {
            var _a2, _b2;
            return i !== index ? row : segment ? { ...row, color: value } : { ...row, pos: (_a2 = this._normalizeGradientStopPosValue(row == null ? void 0 : row.pos)) != null ? _a2 : 0, color: field === "color" ? value : (_b2 = row == null ? void 0 : row.color) != null ? _b2 : "#4a9eff" };
          });
          if (segment || serializeConfig(next) !== serializeConfig(this._sanitizeGradientStopsForEmit(current))) {
            write(next, segment ? { sort: false } : {}, { type: "edit", index, field: "color", value });
          }
          return true;
        }
      };
    }
  });

  // src/editor/sections/segments.js
  var SegmentsSection;
  var init_segments = __esm({
    "src/editor/sections/segments.js"() {
      init_editor_config();
      init_editor_controls();
      init_normalize();
      init_resolve();
      init_bar_render_model();
      init_palette_section();
      SegmentsSection = class extends PaletteSection {
        constructor(context, ui, array) {
          super(context, ui, array);
          this.reset();
        }
        reset() {
          this._segmentDrafts = /* @__PURE__ */ new Map();
          this._segmentUiRows = /* @__PURE__ */ new Map();
          this._segmentBoundaryTexts = /* @__PURE__ */ new Map();
        }
        _setSegments(segments, options = {}) {
          return this._setScopedSegments({ type: "card" }, segments, options);
        }
        _clearSegmentsOverride(scope) {
          this._segmentDrafts.delete(this._getSegmentsScopeKey(scope));
          this._segmentUiRows.delete(this._getSegmentsScopeKey(scope));
          this._clearSegmentScopeTextState(scope);
          return this.context.mutate(scope, (target) => {
            let nextTarget = deletePathValue(target, ["bar", "segments"]);
            nextTarget = deletePathValue(nextTarget, ["segments"]);
            nextTarget = deletePathValue(nextTarget, ["severity"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, { rerender: true });
        }
        _getSegmentsValue() {
          return this._getScopedSegmentsValue({ type: "card" });
        }
        _getSegmentsScopeKey(scope = { type: "card" }) {
          return (scope == null ? void 0 : scope.type) === "entity" ? `entity:${scope.index}` : "card";
        }
        _getSegmentBoundaryTextKey(scope, segmentIndex, field) {
          return `${this._getSegmentsScopeKey(scope)}:${segmentIndex}:${field}`;
        }
        _getSegmentBoundaryText(scope = { type: "card" }, segmentIndex, field, fallbackValue = "") {
          const key = this._getSegmentBoundaryTextKey(scope, segmentIndex, field);
          if (this._segmentBoundaryTexts.has(key)) {
            return this._segmentBoundaryTexts.get(key);
          }
          return this._formatSegmentBoundaryValue(fallbackValue);
        }
        _setSegmentBoundaryText(scope, segmentIndex, field, rawValue) {
          this._segmentBoundaryTexts.set(
            this._getSegmentBoundaryTextKey(scope, segmentIndex, field),
            normalizeTextValue(rawValue)
          );
        }
        _clearSegmentBoundaryText(scope, segmentIndex, field) {
          this._segmentBoundaryTexts.delete(this._getSegmentBoundaryTextKey(scope, segmentIndex, field));
        }
        _clearSegmentScopeTextState(scope) {
          const prefix = `${this._getSegmentsScopeKey(scope)}:`;
          for (const key of this._segmentBoundaryTexts.keys()) {
            if (key.startsWith(prefix)) {
              this._segmentBoundaryTexts.delete(key);
            }
          }
        }
        _getSegmentsUiRows(scope = { type: "card" }) {
          const key = this._getSegmentsScopeKey(scope);
          if (this._segmentUiRows.has(key)) {
            return cloneDeep(this._segmentUiRows.get(key));
          }
          return null;
        }
        _setSegmentsUiRows(scope, rows) {
          this._segmentUiRows.set(this._getSegmentsScopeKey(scope), cloneDeep(rows));
        }
        _getSegmentDraftState(scope = { type: "card" }) {
          const key = this._getSegmentsScopeKey(scope);
          if (!this._segmentDrafts.has(key)) {
            this._segmentDrafts.set(key, this._createSegmentDraftState(scope));
          }
          return cloneDeep(this._segmentDrafts.get(key));
        }
        _setSegmentDraftState(scope, nextDraft, options = {}) {
          var _a, _b, _c;
          this._segmentDrafts.set(this._getSegmentsScopeKey(scope), {
            from: (_a = nextDraft == null ? void 0 : nextDraft.from) != null ? _a : "",
            to: (_b = nextDraft == null ? void 0 : nextDraft.to) != null ? _b : "",
            color: (_c = nextDraft == null ? void 0 : nextDraft.color) != null ? _c : this._getSegmentDraftColorDefault(scope)
          });
          if (options == null ? void 0 : options.refreshOnly) {
            this._refreshSegmentUi(scope);
            return;
          }
          this.ui.render();
        }
        _setSegmentDraftField(scope, field, rawValue) {
          const currentDraft = this._getSegmentDraftState(scope);
          const nextValue = field === "color" ? normalizeEditorColorValue(rawValue, this.array.cssText) : normalizeTextValue(rawValue);
          this._setSegmentDraftState(scope, {
            ...currentDraft,
            [field]: nextValue
          }, { refreshOnly: true });
        }
        _isSegmentFillStyle(fillStyle) {
          return ["bands", "soft_bands", "band_gradient"].includes(fillStyle);
        }
        _getDefaultSegments() {
          return [
            { from: "0%", to: "33%", color: "#4CAF50" },
            { from: "33%", to: "75%", color: "#FF9800" },
            { from: "75%", to: "100%", color: "#F44336" }
          ];
        }
        _getStoredScopedSegments(scope = { type: "card" }) {
          const structuredValue = this.context.read(scope, ["bar", "segments"]);
          if (structuredValue !== void 0) {
            return structuredValue;
          }
          const legacySegments = this.context.read(scope, ["segments"]);
          if (legacySegments !== void 0) {
            return legacySegments;
          }
          const legacySeverity = this.context.read(scope, ["severity"]);
          if (legacySeverity !== void 0) {
            return legacySeverity;
          }
          return null;
        }
        _parseSegmentBoundaryInput(rawValue) {
          const normalizedValue = normalizeTextValue(rawValue).trim();
          if (!normalizedValue) {
            return null;
          }
          const percentMatch = normalizedValue.match(/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%\s*$/);
          const percent = percentMatch ? parseFloat(percentMatch[1]) : null;
          if (Number.isFinite(percent)) {
            return `${percent}%`;
          }
          const numericValue = normalizeNumberValue(normalizedValue);
          return numericValue === null ? null : numericValue;
        }
        _formatSegmentBoundaryValue(value) {
          if (typeof value === "string") {
            return value;
          }
          if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
          }
          if (isObject(value)) {
            if (Number.isFinite(value.percent)) {
              return `${value.percent}%`;
            }
            if (Number.isFinite(this._getFiniteNumber(value.fixed))) {
              return String(this._getFiniteNumber(value.fixed));
            }
          }
          return "";
        }
        _getSegmentDraftColorDefault(scope = { type: "card" }) {
          var _a;
          const segments = this._getScopedSegmentsValue(scope);
          if (segments.length) {
            return normalizeTextValue((_a = segments[segments.length - 1]) == null ? void 0 : _a.color).trim() || "#4a9eff";
          }
          return "#4CAF50";
        }
        _getNewSegmentDefaults(scope = { type: "card" }) {
          var _a;
          const segments = this._getScopedSegmentsValue(scope);
          const previous = segments[segments.length - 1];
          const previousTo = (_a = previous == null ? void 0 : previous.to) != null ? _a : null;
          return {
            from: previousTo != null ? previousTo : "0%",
            to: "100%",
            color: "#4a9eff"
          };
        }
        _createSegmentDraftState(scope = { type: "card" }) {
          var _a;
          const defaults = this._getNewSegmentDefaults(scope);
          const formattedFrom = this._formatSegmentBoundaryValue(defaults.from);
          const formattedTo = this._formatSegmentBoundaryValue(defaults.to);
          const draftFrom = formattedFrom === "100%" || formattedFrom === "100" ? "" : formattedFrom;
          const draftTo = draftFrom ? formattedTo : "";
          return {
            from: draftFrom,
            to: draftTo,
            color: (_a = defaults.color) != null ? _a : this._getSegmentDraftColorDefault(scope)
          };
        }
        _normalizeSegmentForEditorComparison(segment) {
          if (!isObject(segment)) {
            return null;
          }
          const from = this._formatSegmentBoundaryValue(segment.from).trim();
          const to = this._formatSegmentBoundaryValue(segment.to).trim();
          const color = normalizeColorComparisonValue(segment.color);
          if (!from || !to || !color) {
            return null;
          }
          return { from, to, color };
        }
        _segmentsEqualForEditor(leftSegments, rightSegments) {
          const left = Array.isArray(leftSegments) ? leftSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean) : [];
          const right = Array.isArray(rightSegments) ? rightSegments.map((segment) => this._normalizeSegmentForEditorComparison(segment)).filter(Boolean) : [];
          if (left.length !== right.length) {
            return false;
          }
          return left.every((segment, index) => segment.from === right[index].from && segment.to === right[index].to && segment.color === right[index].color);
        }
        _getFallbackSegments(scope = { type: "card" }) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const cardStoredSegments = this._getStoredScopedSegments({ type: "card" });
            if (cardStoredSegments !== null) {
              return cloneDeep(this._getScopedSegmentsValue({ type: "card" }));
            }
          }
          if (!this._isSegmentFillStyle(this.fillStyle(scope))) {
            return [];
          }
          return cloneDeep(this._getDefaultSegments());
        }
        _parseSegmentBoundaryText(rawValue) {
          const normalizedValue = normalizeTextValue(rawValue).trim();
          if (!normalizedValue) {
            return { state: "empty", value: null };
          }
          const parsed = this._parseSegmentBoundaryInput(normalizedValue);
          if (parsed === null) {
            return { state: "invalid", value: null };
          }
          return { state: "valid", value: parsed };
        }
        _compareSegmentBoundaries(left, right) {
          const leftValue = this._getSegmentPreviewBoundaryValue(left);
          const rightValue = this._getSegmentPreviewBoundaryValue(right);
          if (leftValue === null || rightValue === null) {
            return null;
          }
          if (leftValue < rightValue) return -1;
          if (leftValue > rightValue) return 1;
          return 0;
        }
        _buildSegmentValidationRows(scope = { type: "card" }) {
          var _a;
          const rows = (_a = this._getSegmentsUiRows(scope)) != null ? _a : this._getScopedSegmentsValue(scope);
          return rows.map((segment, index) => {
            const rawFrom = this._getSegmentBoundaryText(scope, index, "from", segment == null ? void 0 : segment.from);
            const rawTo = this._getSegmentBoundaryText(scope, index, "to", segment == null ? void 0 : segment.to);
            const parsedFrom = this._parseSegmentBoundaryText(rawFrom);
            const parsedTo = this._parseSegmentBoundaryText(rawTo);
            return {
              index,
              rawFrom,
              rawTo,
              parsedFrom,
              parsedTo
            };
          });
        }
        _getAutomaticEndInputRows(scope) {
          return this._getScopedSegmentsValue(scope).map((row, index) => {
            const from = this._getSegmentBoundaryText(scope, index, "from", row == null ? void 0 : row.from);
            const to = this._getSegmentBoundaryText(scope, index, "to", row == null ? void 0 : row.to);
            return { ...row, from, ...to.trim() ? { to } : { to: void 0 } };
          });
        }
        _resolveAutomaticEndRows(scope, rows) {
          var _a, _b, _c, _d;
          const card = this.context.read({ type: "card" }, []);
          const local = (scope == null ? void 0 : scope.type) === "entity" ? this.context.read(scope, []) : {};
          const rootScale = normalizeScaleConfig(card, null);
          const scale = getResolvedScale((_b = (_a = this.ui).hass) == null ? void 0 : _b.call(_a), (scope == null ? void 0 : scope.type) === "entity" ? normalizeScaleConfig(local, { scale: rootScale }) : rootScale);
          const segments = normalizeGaugeSegments(rows.map((row, index) => ({ ...row, to: typeof row.to === "string" && !row.to.trim() ? void 0 : row.to, label: index })), { legacySegmentSpace: (_d = (_c = this.array).segmentSpace) == null ? void 0 : _d.call(_c) });
          return getSegmentsForRendering({ bar: { segments } }, scale.min, scale.max);
        }
        _getAutomaticEndValidationMessage(scope, rows, index) {
          const row = rows[index];
          if (!row) return "";
          const from = this._parseSegmentBoundaryText(row.from);
          const to = this._parseSegmentBoundaryText(row.to);
          if (from.state !== "valid" || to.state === "invalid") return "Enter valid from/to values.";
          const resolved = this._resolveAutomaticEndRows(scope, rows);
          const candidate = resolved.find((segment) => segment.label === index);
          if (!candidate || candidate.from >= candidate.to) return "From must be below To.";
          for (const other of resolved) {
            if (other.label === index || other.from >= other.to) continue;
            if (candidate.from === other.from) return "Duplicate segment start.";
            if (candidate.from < other.to && candidate.to > other.from) return "Segments overlap.";
          }
          return "";
        }
        _getSegmentRowValidationMessage(scope = { type: "card" }, segmentIndex) {
          if (this.array.autoEnds) return this._getAutomaticEndValidationMessage(scope, this._getAutomaticEndInputRows(scope), segmentIndex);
          const rows = this._buildSegmentValidationRows(scope);
          const row = rows[segmentIndex];
          if (!row) {
            return "";
          }
          if (row.parsedFrom.state === "invalid" || row.parsedTo.state === "invalid" || row.parsedFrom.state === "empty" || row.parsedTo.state === "empty") {
            return "Enter valid from/to values.";
          }
          if (this._compareSegmentBoundaries(row.parsedFrom.value, row.parsedTo.value) !== -1) {
            return "From must be below To.";
          }
          const candidateFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
          const candidateTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
          for (const other of rows) {
            if (other.index === segmentIndex) continue;
            if (other.parsedFrom.state !== "valid" || other.parsedTo.state !== "valid") continue;
            const otherFrom = this._getSegmentPreviewBoundaryValue(other.parsedFrom.value);
            const otherTo = this._getSegmentPreviewBoundaryValue(other.parsedTo.value);
            if (candidateFrom === otherFrom) {
              return "Duplicate segment start.";
            }
            if (candidateFrom < otherTo && candidateTo > otherFrom) {
              return "Segments overlap.";
            }
          }
          return "";
        }
        _getValidSegmentDraft(scope = { type: "card" }) {
          const draft = this._getSegmentDraftState(scope);
          if (this.array.autoEnds) {
            if (!draft.color.trim() || !CSS.supports("color", draft.color)) return null;
            const rows2 = [...this._getAutomaticEndInputRows(scope), draft];
            if (this._getAutomaticEndValidationMessage(scope, rows2, rows2.length - 1)) return null;
            const from = this._parseSegmentBoundaryInput(draft.from), to = this._parseSegmentBoundaryInput(draft.to);
            return { from, ...draft.to.trim() ? { to } : {}, color: draft.color };
          }
          const parsedFrom = this._parseSegmentBoundaryText(draft.from);
          const parsedTo = this._parseSegmentBoundaryText(draft.to);
          const color = normalizeTextValue(draft.color).trim();
          if (parsedFrom.state !== "valid" || parsedTo.state !== "valid" || !color) {
            return null;
          }
          if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
            return null;
          }
          const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
          const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
          const rows = this._buildSegmentValidationRows(scope);
          for (const row of rows) {
            if (row.parsedFrom.state !== "valid" || row.parsedTo.state !== "valid") continue;
            const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
            const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
            if (candidateFrom === otherFrom || candidateFrom < otherTo && candidateTo > otherFrom) {
              return null;
            }
          }
          return {
            from: parsedFrom.value,
            to: parsedTo.value,
            color
          };
        }
        _canAddSegment(scope = { type: "card" }) {
          return !!this._getValidSegmentDraft(scope);
        }
        _getSegmentDraftValidationMessage(scope = { type: "card" }) {
          const draft = this._getSegmentDraftState(scope);
          if (this.array.autoEnds) {
            if (!draft.from.trim()) return "Enter a start value to add a segment.";
            if (!draft.color.trim() || !CSS.supports("color", draft.color)) return "Enter a valid CSS color.";
            const rows2 = [...this._getAutomaticEndInputRows(scope), draft];
            return this._getAutomaticEndValidationMessage(scope, rows2, rows2.length - 1);
          }
          const parsedFrom = this._parseSegmentBoundaryText(draft.from);
          const parsedTo = this._parseSegmentBoundaryText(draft.to);
          const color = normalizeTextValue(draft.color).trim();
          if (!normalizeTextValue(draft.from).trim() && !normalizeTextValue(draft.to).trim()) {
            return "";
          }
          if (parsedFrom.state !== "valid" || parsedTo.state !== "valid") {
            return "Enter valid from/to values.";
          }
          if (this._compareSegmentBoundaries(parsedFrom.value, parsedTo.value) !== -1) {
            return "From must be below To.";
          }
          if (!color) {
            return "Choose a color to add a segment.";
          }
          const candidateFrom = this._getSegmentPreviewBoundaryValue(parsedFrom.value);
          const candidateTo = this._getSegmentPreviewBoundaryValue(parsedTo.value);
          const rows = this._buildSegmentValidationRows(scope);
          for (const row of rows) {
            if (row.parsedFrom.state !== "valid" || row.parsedTo.state !== "valid") continue;
            const otherFrom = this._getSegmentPreviewBoundaryValue(row.parsedFrom.value);
            const otherTo = this._getSegmentPreviewBoundaryValue(row.parsedTo.value);
            if (candidateFrom === otherFrom) {
              return "Duplicate segment start.";
            }
            if (candidateFrom < otherTo && candidateTo > otherFrom) {
              return "Segments overlap.";
            }
          }
          return "";
        }
        _getSegmentPreviewBoundaryValue(value) {
          if (typeof value === "string") {
            const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))%$/);
            if (match) {
              const parsed = parseFloat(match[1]);
              return Number.isFinite(parsed) ? parsed : null;
            }
          }
          if (typeof value === "number" && Number.isFinite(value)) {
            return value;
          }
          if (isObject(value)) {
            if (Number.isFinite(value.percent)) {
              return value.percent;
            }
            const fixedValue = this._getFiniteNumber(value.fixed);
            if (Number.isFinite(fixedValue)) {
              return fixedValue;
            }
          }
          return null;
        }
        _sortSegmentsForEditor(segments) {
          if (!Array.isArray(segments)) {
            return [];
          }
          return cloneDeep(segments).sort((left, right) => {
            const leftFrom = this._getSegmentPreviewBoundaryValue(left == null ? void 0 : left.from);
            const rightFrom = this._getSegmentPreviewBoundaryValue(right == null ? void 0 : right.from);
            if (leftFrom === null && rightFrom === null) return 0;
            if (leftFrom === null) return 1;
            if (rightFrom === null) return -1;
            return leftFrom - rightFrom;
          });
        }
        _getSegmentPreviewRows(scope = { type: "card" }) {
          var _a;
          if (this.array.autoEnds) {
            const draft = this._getValidSegmentDraft(scope);
            return this._resolveAutomaticEndRows(scope, [...this._getAutomaticEndInputRows(scope), ...draft ? [draft] : []]);
          }
          const baseSegments = (_a = this._getSegmentsUiRows(scope)) != null ? _a : this._getScopedSegmentsValue(scope);
          const previewSegments = this._sortSegmentsForEditor(baseSegments);
          const validDraft = this._getValidSegmentDraft(scope);
          if (validDraft) {
            previewSegments.push(validDraft);
          }
          return this._sortSegmentsForEditor(previewSegments).filter((segment) => {
            const from = this._getSegmentPreviewBoundaryValue(segment == null ? void 0 : segment.from);
            const to = this._getSegmentPreviewBoundaryValue(segment == null ? void 0 : segment.to);
            return from !== null && to !== null && typeof (segment == null ? void 0 : segment.color) === "string" && segment.color.trim();
          });
        }
        _buildEditorSegmentPreviewStyle(scope = { type: "card" }) {
          const segments = this._getSegmentPreviewRows(scope);
          if (!segments.length) {
            return "";
          }
          const fillStyle = this.fillStyle(scope);
          const stops = [];
          segments.forEach((segment) => {
            const from = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.from)));
            const to = Math.max(0, Math.min(100, this._getSegmentPreviewBoundaryValue(segment.to)));
            stops.push(`${segment.color} ${from}%`, `${segment.color} ${to}%`);
          });
          if (fillStyle === "bands") {
            return `background:linear-gradient(to right,${stops.join(",")});background-repeat:no-repeat;`;
          }
          return `background:linear-gradient(to right,${stops.join(",")});background-repeat:no-repeat;`;
        }
        _getSegmentPreviewDomIds(scope = { type: "card" }) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            return {
              previewId: `entity-${scope.index}-segment-preview`,
              trackId: `entity-${scope.index}-segment-preview-track`
            };
          }
          return {
            previewId: "card-segment-preview",
            trackId: "card-segment-preview-track"
          };
        }
        _renderSegmentPreview(scope = { type: "card" }) {
          var _a;
          const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
          const segments = this._getSegmentPreviewRows(scope);
          const markers = [];
          segments.forEach((segment) => {
            const from = this._getSegmentPreviewBoundaryValue(segment.from);
            const to = this._getSegmentPreviewBoundaryValue(segment.to);
            if (from !== null) markers.push(from);
            if (to !== null) markers.push(to);
          });
          const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
          return `
      <div id="${previewId}" class="gradient-preview segment-preview">
        <div id="${trackId}" class="gradient-preview-track segment-preview-track" style="${escapeAttribute((_a = this._buildEditorSegmentPreviewStyle(scope)) != null ? _a : "")}">
          ${uniqueMarkers.map((marker, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${escapeAttribute(String(marker))}%"
              title="${escapeAttribute(`${marker}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `;
        }
        _refreshSegmentPreview(scope = { type: "card" }) {
          var _a;
          const { previewId, trackId } = this._getSegmentPreviewDomIds(scope);
          const track = this._getShadowElementById(trackId);
          if (!track) {
            return;
          }
          track.setAttribute("style", (_a = this._buildEditorSegmentPreviewStyle(scope)) != null ? _a : "");
          const segments = this._getSegmentPreviewRows(scope);
          const markers = [];
          segments.forEach((segment) => {
            const from = this._getSegmentPreviewBoundaryValue(segment.from);
            const to = this._getSegmentPreviewBoundaryValue(segment.to);
            if (from !== null) markers.push(from);
            if (to !== null) markers.push(to);
          });
          const uniqueMarkers = [...new Set(markers)].sort((left, right) => left - right);
          track.innerHTML = uniqueMarkers.map((marker, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${escapeAttribute(String(marker))}%"
        title="${escapeAttribute(`${marker}%`)}"
      ></span>
    `).join("");
        }
        _getSegmentDomIds(scope = { type: "card" }) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            return {
              hintPrefix: `entity-${scope.index}-segment-row-hint-`,
              draftHintId: `entity-${scope.index}-segment-draft-hint`,
              addSelector: `button[data-action="add-entity-segment"][data-index="${scope.index}"]`
            };
          }
          return {
            hintPrefix: "segment-row-hint-",
            draftHintId: "segment-draft-hint",
            addSelector: 'button[data-action="add-segment"]'
          };
        }
        _refreshSegmentUi(scope = { type: "card" }) {
          var _a, _b;
          this._refreshSegmentPreview(scope);
          if (!this.shadowRoot) {
            return;
          }
          const { hintPrefix, draftHintId, addSelector } = this._getSegmentDomIds(scope);
          const addButton = this.shadowRoot.querySelector(addSelector);
          if (addButton) {
            addButton.disabled = !this._canAddSegment(scope);
          }
          const rows = (_a = this._getSegmentsUiRows(scope)) != null ? _a : this._getScopedSegmentsValue(scope);
          rows.forEach((_, index) => {
            var _a2;
            const hint = this._getShadowElementById(`${hintPrefix}${index}`);
            const message = this._getSegmentRowValidationMessage(scope, index);
            if (hint) {
              hint.textContent = message;
              (_a2 = hint.setAttribute) == null ? void 0 : _a2.call(hint, "style", message ? "" : "display:none");
            }
          });
          const draftHint = this._getShadowElementById(draftHintId);
          if (draftHint) {
            const message = this._getSegmentDraftValidationMessage(scope);
            draftHint.textContent = message;
            (_b = draftHint.setAttribute) == null ? void 0 : _b.call(draftHint, "style", message ? "" : "display:none");
          }
        }
        _commitSegmentDraft(scope = { type: "card" }) {
          var _a;
          const draftSegment = this._getValidSegmentDraft(scope);
          if (!draftSegment) {
            this._refreshSegmentUi(scope);
            return false;
          }
          const committedSegments = (_a = this._getSegmentsUiRows(scope)) != null ? _a : this._getScopedSegmentsValue(scope);
          const nextSegments = this._sortSegmentsForEditor([...committedSegments, draftSegment]);
          const applied = this._setScopedSegments(scope, nextSegments, { rerender: true }, { type: "add", item: draftSegment });
          if (applied !== false) {
            this._segmentDrafts.set(this._getSegmentsScopeKey(scope), this._createSegmentDraftState(scope));
          }
          return applied;
        }
        _commitSegmentBoundaryEdit(scope = { type: "card" }, segmentIndex, field, rawValue, inputEl = null) {
          var _a, _b, _c, _d, _e;
          this._setSegmentBoundaryText(scope, segmentIndex, field, rawValue);
          const parsed = this._parseSegmentBoundaryText(rawValue);
          if (parsed.state !== "valid" && !(this.array.autoEnds && field === "to" && parsed.state === "empty")) {
            (_a = inputEl == null ? void 0 : inputEl.setCustomValidity) == null ? void 0 : _a.call(inputEl, "Enter a valid boundary value.");
            this._refreshSegmentUi(scope);
            return false;
          }
          if (this.array.patchOnly) {
            const message2 = this._getSegmentRowValidationMessage(scope, segmentIndex);
            if (message2) {
              (_b = inputEl == null ? void 0 : inputEl.setCustomValidity) == null ? void 0 : _b.call(inputEl, message2);
              (_c = inputEl == null ? void 0 : inputEl.reportValidity) == null ? void 0 : _c.call(inputEl);
              this._refreshSegmentUi(scope);
              return false;
            }
          }
          const normalizedText = normalizeTextValue(rawValue).trim();
          const parsedValue = this._parseSegmentBoundaryInput(rawValue);
          const nextValue = this.array.autoEnds && field === "to" && !normalizedText ? void 0 : parsedValue === null ? normalizedText : parsedValue;
          const currentSegments = (_d = this._getSegmentsUiRows(scope)) != null ? _d : this._getScopedSegmentsValue(scope);
          const nextSegments = currentSegments.map((segment, currentIndex) => currentIndex === segmentIndex ? { ...segment, [field]: nextValue } : segment);
          this._clearSegmentBoundaryText(scope, segmentIndex, field);
          const applied = this._setScopedSegments(scope, nextSegments, { rerender: true }, { type: "edit", index: segmentIndex, field, value: nextValue });
          const message = this._getSegmentRowValidationMessage(scope, segmentIndex);
          if (inputEl == null ? void 0 : inputEl.setCustomValidity) {
            inputEl.setCustomValidity(message || "");
            if (message) {
              (_e = inputEl.reportValidity) == null ? void 0 : _e.call(inputEl);
            }
          }
          return applied;
        }
        _getScopedSegmentsValue(scope) {
          if (this.array.rows) return this.array.rows(scope, this);
          const uiRows = this._getSegmentsUiRows(scope);
          if (uiRows !== null) {
            return cloneDeep(uiRows);
          }
          const storedSegments = this._getStoredScopedSegments(scope);
          if (storedSegments !== null) {
            return this._sortSegmentsForEditor(storedSegments);
          }
          return this._sortSegmentsForEditor(this._getFallbackSegments(scope));
        }
        _hasSegmentsOverride(scope) {
          return this._getStoredScopedSegments(scope) !== null;
        }
        _getSegmentsSummary(scope) {
          const segments = this._getScopedSegmentsValue(scope);
          if (!Array.isArray(segments) || segments.length === 0) {
            return "Inherited";
          }
          if ((scope == null ? void 0 : scope.type) !== "entity" && !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(this.fillStyle(scope))) {
            return "Default bands";
          }
          return `${segments.length} segments`;
        }
        _setScopedSegments(scope, rows, options = {}, operation) {
          return this.array.write(scope, rows, options, operation);
        }
        render(scope = { type: "card" }, renderGroup = ({ content }) => content) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const entitySegments = this._getScopedSegmentsValue(scope);
            const segmentsInherited = !this._hasSegmentsOverride(scope);
            return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-segments-inherit" type="checkbox" data-kind="entity-segments-inherit" data-index="${index}"${segmentsInherited ? " checked" : ""}>
                          <label for="entity-${index}-segments-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this._isSegmentFillStyle(this.fillStyle(scope)) ? "" : '<div class="section-note">Only used with segment-based fill styles.</div>'}
                      ${this._renderSegmentPreview(scope)}
                      <div class="field-row">
                        <label>Segments</label>
                        <div class="list">
                          ${this._renderListRows(entitySegments, (segment, segmentIndex) => {
              var _a;
              return `
                            <div class="segment-editor-row">
                            <div class="list-row triple segment-row">
                              <input type="text" data-kind="entity-segment-from" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, "from", segment == null ? void 0 : segment.from))}" placeholder="0%">
                              <input type="text" data-kind="entity-segment-to" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute(this._getSegmentBoundaryText(scope, segmentIndex, "to", segment == null ? void 0 : segment.to))}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-color" data-index="${index}" data-segment-index="${segmentIndex}" value="${escapeAttribute((_a = segment == null ? void 0 : segment.color) != null ? _a : "#4a9eff")}">
                              <button type="button" data-action="remove-entity-segment" data-index="${index}" data-segment-index="${segmentIndex}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                            <div id="entity-${index}-segment-row-hint-${segmentIndex}" class="section-note"${this._getSegmentRowValidationMessage(scope, segmentIndex) ? "" : ' style="display:none"'}>${escapeAttribute(this._getSegmentRowValidationMessage(scope, segmentIndex))}</div>
                            </div>
                          `;
            })}
                          <div class="segment-draft">
                            <div class="list-row triple segment-row">
                              <input id="entity-${index}-segment-draft-from" type="text" data-kind="entity-segment-draft-from" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).from)}" placeholder="0%">
                              <input id="entity-${index}-segment-draft-to" type="text" data-kind="entity-segment-draft-to" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).to)}" placeholder="100%">
                              <input type="color" data-kind="entity-segment-draft-color" data-index="${index}" value="${escapeAttribute(this._getSegmentDraftState(scope).color || "#4a9eff")}">
                              <button type="button" data-action="add-entity-segment" data-index="${index}"${this._canAddSegment(scope) ? "" : " disabled"}>Add</button>
                            </div>
                            <div id="entity-${index}-segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage(scope) ? "" : ' style="display:none"'}>${escapeAttribute(this._getSegmentDraftValidationMessage(scope))}</div>
                          </div>
                        </div>
                      </div>
	                          `;
          }
          const fillStyle = this.fillStyle(scope);
          const segments = this._getScopedSegmentsValue(scope);
          const defaultSegmentsVisible = !this._hasSegmentsOverride(scope) && this._isSegmentFillStyle(fillStyle);
          return `	        <div class="section">
	          <div class="section-head">
	            <h3>Segments</h3>
	            <div class="section-note">Segments define colored value ranges.</div>
	          </div>
	          ${renderGroup({
            group: "segments",
            title: "Segments",
            summary: this._getSegmentsSummary({ type: "card" }),
            inactive: !this._isSegmentFillStyle(fillStyle),
            content: `
	              ${this._isSegmentFillStyle(fillStyle) ? "" : '<div class="section-note">Only used with segment-based fill styles.</div>'}
                ${this._renderSegmentPreview({ type: "card" })}
	              <div class="field-row">
	                <label>Segments</label>
	                <div class="list">
	                  ${defaultSegmentsVisible ? '<div class="section-note">Default bands</div>' : ""}
	                  ${this._renderListRows(segments, (segment, index) => {
              var _a, _b;
              return `
	                    <div class="segment-editor-row">
	                    <div class="list-row triple segment-row">
	                      <input type="text"${this.array.autoEnds ? ` aria-label="Segment ${index + 1} start"` : ""} data-kind="segment-from" data-index="${index}" value="${escapeAttribute(this._getSegmentBoundaryText({ type: "card" }, index, "from", segment == null ? void 0 : segment.from))}" placeholder="0%">
	                      <input type="text"${this.array.autoEnds ? ` aria-label="Segment ${index + 1} end (blank = Auto)"` : ""} data-kind="segment-to" data-index="${index}" value="${escapeAttribute(this._getSegmentBoundaryText({ type: "card" }, index, "to", segment == null ? void 0 : segment.to))}" placeholder="${this.array.autoEnds ? "Auto" : "100%"}">
	                      ${this.array.cssText ? renderColorInput({ id: `segment-color-${index}`, kind: "segment-color", index, value: (_a = segment == null ? void 0 : segment.color) != null ? _a : "#4a9eff", fallbackHex: "#4a9eff", cssText: true, label: `Segment ${index + 1} color` }) : `<input type="color" data-kind="segment-color" data-index="${index}" value="${escapeAttribute((_b = segment == null ? void 0 : segment.color) != null ? _b : "#4a9eff")}">`}
	                      <button type="button" data-action="remove-segment" data-index="${index}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
                      <div id="segment-row-hint-${index}" class="section-note"${this._getSegmentRowValidationMessage({ type: "card" }, index) ? "" : ' style="display:none"'}>${escapeAttribute(this._getSegmentRowValidationMessage({ type: "card" }, index))}</div>
                      </div>
	                  `;
            })}
                    <div class="segment-draft">
                      <div class="list-row triple segment-row">
                        <input id="segment-draft-from" type="text"${this.array.autoEnds ? ' aria-label="New segment start"' : ""} data-kind="segment-draft-from" value="${escapeAttribute(this._getSegmentDraftState({ type: "card" }).from)}" placeholder="0%">
                        <input id="segment-draft-to" type="text"${this.array.autoEnds ? ' aria-label="New segment end (blank = Auto)"' : ""} data-kind="segment-draft-to" value="${escapeAttribute(this._getSegmentDraftState({ type: "card" }).to)}" placeholder="${this.array.autoEnds ? "Auto" : "100%"}">
                        ${this.array.cssText ? renderColorInput({ id: "segment-draft-color", kind: "segment-draft-color", value: this._getSegmentDraftState({ type: "card" }).color || "#4a9eff", fallbackHex: "#4a9eff", cssText: true, label: "New segment color" }) : `<input type="color" data-kind="segment-draft-color" value="${escapeAttribute(this._getSegmentDraftState({ type: "card" }).color || "#4a9eff")}">`}
                        <button type="button" data-action="add-segment"${this._canAddSegment({ type: "card" }) ? "" : " disabled"}>Add</button>
                      </div>
                      <div id="segment-draft-hint" class="section-note"${this._getSegmentDraftValidationMessage({ type: "card" }) ? "" : ' style="display:none"'}>${escapeAttribute(this._getSegmentDraftValidationMessage({ type: "card" }))}</div>
                    </div>
	                </div>
	              </div>
	            `
          })}
	        </div>`;
        }
      };
    }
  });

  // src/editor/sections/gradient-stops.js
  var GradientStopsSection;
  var init_gradient_stops = __esm({
    "src/editor/sections/gradient-stops.js"() {
      init_normalize();
      init_editor_config();
      init_editor_controls();
      init_palette_section();
      GradientStopsSection = class extends PaletteSection {
        constructor(context, ui, array) {
          super(context, ui, array);
          this.reset();
        }
        reset() {
          this._gradientStopsDrafts = /* @__PURE__ */ new Map();
          this._gradientStopsUiRows = /* @__PURE__ */ new Map();
          this._gradientStopPosTexts = /* @__PURE__ */ new Map();
          this._gradientStopValidationMessages = /* @__PURE__ */ new Map();
        }
        _setGradientStops(stops, options = {}) {
          return this._setScopedGradientStops({ type: "card" }, stops, options);
        }
        _getDefaultGradientStops() {
          return [
            { pos: 0, color: "#4CAF50" },
            { pos: 50, color: "#FF9800" },
            { pos: 100, color: "#F44336" }
          ];
        }
        _normalizeGradientStopPosValue(rawValue) {
          const percent = parsePercentLiteral(rawValue);
          const numericValue = Number.isFinite(percent) ? percent : normalizeNumberValue(rawValue);
          if (numericValue === null || !Number.isFinite(numericValue)) {
            return null;
          }
          if (numericValue < 0 || numericValue > 100) {
            return null;
          }
          return numericValue;
        }
        _sanitizeGradientStopsForEmit(stops) {
          if (!Array.isArray(stops)) {
            return [];
          }
          return stops.map((stop) => {
            if (!isObject(stop)) {
              return null;
            }
            const pos = this._normalizeGradientStopPosValue(stop.pos);
            const color = normalizeTextValue(stop.color).trim();
            if (pos === null || !color) {
              return null;
            }
            return {
              ...stop,
              pos,
              color
            };
          }).filter(Boolean).sort((left, right) => left.pos - right.pos);
        }
        _getGradientStopDraftColorDefault(scope = { type: "card" }) {
          var _a;
          const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
          if (committedStops.length) {
            return (_a = committedStops[committedStops.length - 1].color) != null ? _a : "#4CAF50";
          }
          return this._getDefaultGradientStops()[0].color;
        }
        _getNextSuggestedGradientStopPos(scope = { type: "card" }) {
          const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
          if (!committedStops.length) {
            return 0;
          }
          const highest = committedStops[committedStops.length - 1];
          if (highest.pos >= 100) {
            return "";
          }
          let suggestedPos;
          if (committedStops.length === 1) {
            suggestedPos = highest.pos + 25;
          } else {
            const previous = committedStops[committedStops.length - 2];
            suggestedPos = highest.pos + (highest.pos - previous.pos);
          }
          const clampedPos = Math.min(100, Math.max(0, suggestedPos));
          if (committedStops.some((stop) => stop.pos === clampedPos)) {
            return "";
          }
          return clampedPos;
        }
        _getGradientStopsDraftKey(scope) {
          return (scope == null ? void 0 : scope.type) === "entity" ? `entity:${scope.index}` : "card";
        }
        _getGradientStopPosTextKey(scope, stopIndex) {
          return `${this._getGradientStopsDraftKey(scope)}:pos:${stopIndex}`;
        }
        _getGradientStopPosText(scope = { type: "card" }, stopIndex, fallbackValue = "") {
          const key = this._getGradientStopPosTextKey(scope, stopIndex);
          if (this._gradientStopPosTexts.has(key)) {
            return this._gradientStopPosTexts.get(key);
          }
          if (fallbackValue === "" || fallbackValue === null || fallbackValue === void 0) {
            return "";
          }
          return String(fallbackValue);
        }
        _setGradientStopPosText(scope, stopIndex, rawValue) {
          this._gradientStopPosTexts.set(
            this._getGradientStopPosTextKey(scope, stopIndex),
            normalizeTextValue(rawValue)
          );
        }
        _clearGradientStopPosText(scope, stopIndex) {
          this._gradientStopPosTexts.delete(this._getGradientStopPosTextKey(scope, stopIndex));
        }
        _clearGradientStopScopeTextState(scope) {
          const prefix = `${this._getGradientStopsDraftKey(scope)}:pos:`;
          for (const key of this._gradientStopPosTexts.keys()) {
            if (key.startsWith(prefix)) {
              this._gradientStopPosTexts.delete(key);
            }
          }
          for (const key of this._gradientStopValidationMessages.keys()) {
            if (key.startsWith(prefix)) {
              this._gradientStopValidationMessages.delete(key);
            }
          }
        }
        _getGradientStopsUiRows(scope = { type: "card" }) {
          const key = this._getGradientStopsDraftKey(scope);
          if (this._gradientStopsUiRows.has(key)) {
            return cloneDeep(this._gradientStopsUiRows.get(key));
          }
          return null;
        }
        _setGradientStopsUiRows(scope, stops) {
          this._gradientStopsUiRows.set(this._getGradientStopsDraftKey(scope), cloneDeep(stops));
        }
        _getStoredScopedGradientStops(scope = { type: "card" }) {
          const structuredValue = this.context.read(scope, ["bar", "gradient_stops"]);
          if (structuredValue !== void 0) {
            return structuredValue;
          }
          const legacyValue = this.context.read(scope, ["gradient_stops"]);
          if (legacyValue !== void 0) {
            return legacyValue;
          }
          return null;
        }
        _getFallbackGradientStops(scope = { type: "card" }) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const inheritedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue({ type: "card" }));
            return inheritedStops.length ? inheritedStops : this._getDefaultGradientStops();
          }
          return this._getDefaultGradientStops();
        }
        _createGradientStopDraftState(scope = { type: "card" }) {
          const suggestedPos = this._getNextSuggestedGradientStopPos(scope);
          return {
            pos: suggestedPos === "" ? "" : String(suggestedPos),
            color: this._getGradientStopDraftColorDefault(scope)
          };
        }
        _getGradientStopsDraftState(scope = { type: "card" }) {
          const key = this._getGradientStopsDraftKey(scope);
          if (!this._gradientStopsDrafts.has(key)) {
            this._gradientStopsDrafts.set(key, this._createGradientStopDraftState(scope));
          }
          return cloneDeep(this._gradientStopsDrafts.get(key));
        }
        _setGradientStopsDraftState(scope, nextDraft, options = {}) {
          var _a, _b;
          this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
            pos: (_a = nextDraft == null ? void 0 : nextDraft.pos) != null ? _a : "",
            color: (_b = nextDraft == null ? void 0 : nextDraft.color) != null ? _b : this._getGradientStopDraftColorDefault(scope)
          });
          if (options == null ? void 0 : options.refreshOnly) {
            this._refreshGradientDraftUi(scope);
            return;
          }
          this.ui.render();
        }
        _setGradientStopsDraftField(scope, field, rawValue) {
          const currentDraft = this._getGradientStopsDraftState(scope);
          const nextValue = field === "color" ? normalizeTextValue(rawValue).trim() : normalizeTextValue(rawValue);
          this._setGradientStopsDraftState(scope, {
            ...currentDraft,
            [field]: nextValue
          }, { refreshOnly: field === "pos" });
        }
        _getValidGradientDraftStop(scope = { type: "card" }) {
          const draft = this._getGradientStopsDraftState(scope);
          const pos = this._normalizeGradientStopPosValue(draft.pos);
          const color = normalizeTextValue(draft.color).trim();
          if (pos === null || !color) {
            return null;
          }
          return { pos, color };
        }
        _hasGradientStopDuplicate(scope = { type: "card" }, candidatePos, excludeIndex = null) {
          if (this.array.patchOnly) return this._getScopedGradientStopsValue(scope).some((stop, index) => index !== excludeIndex && this._normalizeGradientStopPosValue(stop == null ? void 0 : stop.pos) === candidatePos);
          return this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope)).some((stop, index) => index !== excludeIndex && stop.pos === candidatePos);
        }
        _canAddGradientStop(scope = { type: "card" }) {
          const draftStop = this._getValidGradientDraftStop(scope);
          if (!draftStop) {
            return false;
          }
          return !this._hasGradientStopDuplicate(scope, draftStop.pos);
        }
        _getGradientDraftValidationMessage(scope = { type: "card" }) {
          const draft = this._getGradientStopsDraftState(scope);
          const normalizedPosText = normalizeTextValue(draft.pos).trim();
          const normalizedColor = normalizeTextValue(draft.color).trim();
          if (!normalizedPosText) {
            return "Enter a position to add a stop.";
          }
          if (this._normalizeGradientStopPosValue(draft.pos) === null) {
            return "Enter a value from 0 to 100.";
          }
          if (!normalizedColor) {
            return "Choose a color to add a stop.";
          }
          if (this._hasGradientStopDuplicate(scope, this._normalizeGradientStopPosValue(draft.pos))) {
            return "Position already exists.";
          }
          return "";
        }
        _isDefaultGradientStops(stops) {
          const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
          const defaultStops = this._getDefaultGradientStops();
          if (sanitizedStops.length !== defaultStops.length) {
            return false;
          }
          return sanitizedStops.every((stop, index) => stop.pos === defaultStops[index].pos && normalizeColorComparisonValue(stop.color) === normalizeColorComparisonValue(defaultStops[index].color));
        }
        _clearGradientStopsOverride(scope) {
          var _a;
          const previousUiRowsJson = serializeConfig((_a = this._getGradientStopsUiRows(scope)) != null ? _a : []);
          this._gradientStopsDrafts.delete(this._getGradientStopsDraftKey(scope));
          this._gradientStopsUiRows.delete(this._getGradientStopsDraftKey(scope));
          this._clearGradientStopScopeTextState(scope);
          const applied = this.context.mutate(scope, (target) => {
            let nextTarget = deletePathValue(target, ["bar", "gradient_stops"]);
            nextTarget = deletePathValue(nextTarget, ["gradient_stops"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, { rerender: true });
          if (applied === false && previousUiRowsJson !== serializeConfig([])) {
            this.ui.render();
          }
          return applied;
        }
        _getGradientStopsValue() {
          return this._getScopedGradientStopsValue({ type: "card" });
        }
        _commitGradientStopDraft(scope = { type: "card" }) {
          const draftStop = this._getValidGradientDraftStop(scope);
          if (!draftStop || this._hasGradientStopDuplicate(scope, draftStop.pos)) {
            this._refreshGradientDraftUi(scope);
            return false;
          }
          const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
          const nextStops = [...committedStops, draftStop].sort((left, right) => left.pos - right.pos);
          const applied = this._setScopedGradientStops(scope, nextStops, { rerender: true }, { type: "add", item: draftStop });
          if (applied !== false) {
            this._gradientStopsDrafts.set(this._getGradientStopsDraftKey(scope), {
              pos: (() => {
                const suggestion = this._getNextSuggestedGradientStopPos(scope);
                return suggestion === "" ? "" : String(suggestion);
              })(),
              color: draftStop.color
            });
          }
          return applied;
        }
        _getGradientPreviewDomIds(scope = { type: "card" }) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            return {
              previewId: `entity-${scope.index}-gradient-preview`,
              trackId: `entity-${scope.index}-gradient-preview-track`,
              hintId: `entity-${scope.index}-gradient-draft-hint`,
              addSelector: `button[data-action="add-entity-gradient-stop"][data-index="${scope.index}"]`,
              draftInputId: `entity-${scope.index}-gradient-draft-pos`
            };
          }
          return {
            previewId: "card-gradient-preview",
            trackId: "card-gradient-preview-track",
            hintId: "gradient-draft-hint",
            addSelector: 'button[data-action="add-gradient-stop"]',
            draftInputId: "gradient-draft-pos"
          };
        }
        _refreshGradientDraftUi(scope = { type: "card" }) {
          var _a, _b, _c;
          if (!this.shadowRoot) {
            return;
          }
          const getById = (_b = (_a = this.shadowRoot.getElementById) == null ? void 0 : _a.bind(this.shadowRoot)) != null ? _b : ((id) => {
            var _a2, _b2, _c2;
            return (_c2 = (_b2 = (_a2 = this.shadowRoot).querySelector) == null ? void 0 : _b2.call(_a2, `#${id}`)) != null ? _c2 : null;
          });
          const { previewId, trackId, hintId, addSelector, draftInputId } = this._getGradientPreviewDomIds(scope);
          const addButton = this.shadowRoot.querySelector(addSelector);
          if (addButton) {
            addButton.disabled = !this._canAddGradientStop(scope);
          }
          const draftInput = getById(draftInputId);
          if (draftInput && typeof draftInput.closest !== "function") {
            this.ui.render();
            return;
          }
          const draftContainer = draftInput == null ? void 0 : draftInput.closest(".gradient-stop-draft");
          const nextMessage = this._getGradientDraftValidationMessage(scope);
          const existingHint = getById(hintId);
          if (nextMessage) {
            if (existingHint) {
              existingHint.textContent = nextMessage;
            } else if (draftContainer) {
              const hint = document.createElement("div");
              hint.id = hintId;
              hint.className = "section-note";
              hint.textContent = nextMessage;
              draftContainer.appendChild(hint);
            }
          } else if (existingHint) {
            existingHint.remove();
          }
          const preview = getById(previewId);
          const track = getById(trackId);
          if (!preview || !track) {
            return;
          }
          track.setAttribute("style", (_c = this._getGradientPreviewStyle(scope)) != null ? _c : "");
          const markerStops = this._buildGradientPreviewEffectiveStops(scope);
          const renderedStops = markerStops.length ? markerStops : this._getDefaultGradientStops();
          track.innerHTML = renderedStops.map((stop, index) => `
      <span
        id="${previewId}-stop-${index}"
        class="gradient-preview-stop"
        style="left:${escapeAttribute(String(stop.pos))}%"
        title="${escapeAttribute(`${stop.pos}%`)}"
      ></span>
    `).join("");
        }
        _commitGradientStopPosEdit(scope = { type: "card" }, stopIndex, rawValue, inputEl = null) {
          const nextPos = this._normalizeGradientStopPosValue(rawValue);
          if (nextPos === null || this._hasGradientStopDuplicate(scope, nextPos, stopIndex)) {
            if (inputEl == null ? void 0 : inputEl.setCustomValidity) {
              inputEl.setCustomValidity(nextPos === null ? "Enter a value from 0 to 100." : "Position already exists.");
              if (inputEl.reportValidity) {
                inputEl.reportValidity();
              }
            }
            return false;
          }
          if (inputEl == null ? void 0 : inputEl.setCustomValidity) {
            inputEl.setCustomValidity("");
          }
          const currentStops = this._getScopedGradientStopsValue(scope);
          const nextStops = currentStops.map((stop, currentStopIndex) => currentStopIndex === stopIndex ? { ...stop, pos: nextPos } : stop);
          this._clearGradientStopPosText(scope, stopIndex);
          return this._setScopedGradientStops(scope, nextStops, { rerender: true }, { type: "edit", index: stopIndex, field: "pos", value: nextPos });
        }
        _getScopedGradientStopsValue(scope) {
          if (this.array.rows) return this.array.rows(scope, this);
          const localRows = this._getGradientStopsUiRows(scope);
          if (Array.isArray(localRows)) {
            return localRows;
          }
          const storedStops = this._getStoredScopedGradientStops(scope);
          if (storedStops !== null) {
            return this._sanitizeGradientStopsForEmit(storedStops);
          }
          return cloneDeep(this._getFallbackGradientStops(scope));
        }
        _hasGradientStopsOverride(scope) {
          if (this._getStoredScopedGradientStops(scope) !== null) {
            return true;
          }
          const localRows = this._getGradientStopsUiRows(scope);
          if (!Array.isArray(localRows)) {
            return false;
          }
          return serializeConfig(this._sanitizeGradientStopsForEmit(localRows)) !== serializeConfig(this._sanitizeGradientStopsForEmit(this._getFallbackGradientStops(scope)));
        }
        _getGradientStopsSummary(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasGradientStopsOverride(scope)) {
            return "Inherited";
          }
          const gradientStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
          if (this.fillStyle(scope) !== "gradient") {
            return "Inactive fill style";
          }
          if (!gradientStops.length) {
            return (scope == null ? void 0 : scope.type) === "entity" ? "Inherited" : "Default gradient";
          }
          if (this._isDefaultGradientStops(gradientStops)) {
            return "Default gradient";
          }
          return `${gradientStops.length} stops`;
        }
        _buildGradientPreviewEffectiveStops(scope = { type: "card" }) {
          const committedStops = this._sanitizeGradientStopsForEmit(this._getScopedGradientStopsValue(scope));
          const draftStop = this._getValidGradientDraftStop(scope);
          const previewStops = [...committedStops];
          if (draftStop && !this._hasGradientStopDuplicate(scope, draftStop.pos)) {
            previewStops.push(draftStop);
          }
          return previewStops.sort((left, right) => left.pos - right.pos);
        }
        _buildEditorGradientPreviewStyle(stops) {
          if (!Array.isArray(stops) || !stops.length) {
            return "";
          }
          const cssStops = stops.map((stop) => {
            var _a;
            const color = normalizeTextValue(stop.color).trim();
            const pos = this._normalizeGradientStopPosValue((_a = stop.p) != null ? _a : stop.pos);
            if (!color || pos === null) {
              return null;
            }
            return `${color} ${pos}%`;
          }).filter(Boolean);
          if (!cssStops.length) {
            return "";
          }
          return `background:linear-gradient(to right,${cssStops.join(",")});background-repeat:no-repeat;`;
        }
        _getGradientPreviewStyle(scope = { type: "card" }) {
          const previewStops = this._buildGradientPreviewEffectiveStops(scope);
          const resolvedStops = previewStops.length >= 2 ? previewStops.map((stop) => ({ p: stop.pos, color: stop.color })) : this._getDefaultGradientStops().map((stop) => ({ p: stop.pos, color: stop.color }));
          return this._buildEditorGradientPreviewStyle(resolvedStops);
        }
        _renderGradientPreview(scope = { type: "card" }, options = {}) {
          var _a, _b, _c;
          const previewId = (_a = options.previewId) != null ? _a : "gradient-preview";
          const trackId = (_b = options.trackId) != null ? _b : `${previewId}-track`;
          const effectiveStops = this._buildGradientPreviewEffectiveStops(scope);
          const markerStops = effectiveStops.length ? effectiveStops : this._getDefaultGradientStops();
          return `
      <div id="${previewId}" class="gradient-preview">
        <div id="${trackId}" class="gradient-preview-track" style="${escapeAttribute((_c = this._getGradientPreviewStyle(scope)) != null ? _c : "")}">
          ${markerStops.map((stop, index) => `
            <span
              id="${previewId}-stop-${index}"
              class="gradient-preview-stop"
              style="left:${escapeAttribute(String(stop.pos))}%"
              title="${escapeAttribute(`${stop.pos}%`)}"
            ></span>
          `).join("")}
        </div>
      </div>
    `;
        }
        _setScopedGradientStops(scope, rows, options = {}, operation) {
          return this.array.write(scope, rows, options, operation);
        }
        render(scope = { type: "card" }, renderGroup = ({ content }) => content) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const entityGradientStops = this._getScopedGradientStopsValue(scope);
            const entityGradientDraft = this._getGradientStopsDraftState(scope);
            const entityGradientDraftMessage = this._getGradientDraftValidationMessage(scope);
            const gradientStopsInherited = !this._hasGradientStopsOverride(scope);
            return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-gradient-stops-inherit" type="checkbox" data-kind="entity-gradient-stops-inherit" data-index="${index}"${gradientStopsInherited ? " checked" : ""}>
                          <label for="entity-${index}-gradient-stops-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      ${this.fillStyle(scope) !== "gradient" ? '<div class="section-note">Only used with Gradient fill style</div>' : ""}
                      ${this._renderGradientPreview(scope, {
              previewId: `entity-${index}-gradient-preview`,
              trackId: `entity-${index}-gradient-preview-track`
            })}
                      <div class="field-row">
                        <label>Gradient stops</label>
                        <div class="list gradient-stop-list">
                          ${this._renderListRows(entityGradientStops, (stop, stopIndex) => {
              var _a, _b;
              return `
                            <div class="list-row gradient-stop-row">
                              <input type="number" min="0" max="100" step="any" data-kind="entity-gradient-pos" data-index="${index}" data-stop-index="${stopIndex}" value="${escapeAttribute(this._getGradientStopPosText(scope, stopIndex, (_a = stop == null ? void 0 : stop.pos) != null ? _a : ""))}" placeholder="0">
                              ${renderColorInput({
                id: `entity-${index}-gradient-color-${stopIndex}`,
                kind: "entity-gradient-color",
                index,
                value: (_b = stop == null ? void 0 : stop.color) != null ? _b : "#4a9eff",
                fallbackHex: "#4CAF50",
                placeholder: "CSS color value",
                extraDataset: { "stop-index": stopIndex }
              })}
                              <button type="button" data-action="remove-entity-gradient-stop" data-index="${index}" data-stop-index="${stopIndex}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
                            </div>
                          `;
            })}
                          <div class="gradient-stop-draft">
                            <div class="list-row gradient-stop-row">
                              <input id="entity-${index}-gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="entity-gradient-draft-pos" data-index="${index}" value="${escapeAttribute(entityGradientDraft.pos)}" placeholder="0">
                              ${renderColorInput({
              id: `entity-${index}-gradient-draft-color`,
              kind: "entity-gradient-draft-color",
              index,
              value: entityGradientDraft.color,
              fallbackHex: "#4CAF50",
              placeholder: "CSS color value"
            })}
                              <button type="button" data-action="add-entity-gradient-stop" data-index="${index}"${this._canAddGradientStop(scope) ? "" : " disabled"}>Add</button>
                            </div>
                            ${entityGradientDraftMessage ? `<div id="entity-${index}-gradient-draft-hint" class="section-note">${escapeAttribute(entityGradientDraftMessage)}</div>` : ""}
                          </div>
                        </div>
                      </div>
	                          `;
          }
          const gradientStops = this._getScopedGradientStopsValue(scope);
          const gradientDraft = this._getGradientStopsDraftState(scope);
          const gradientDraftMessage = this._getGradientDraftValidationMessage(scope);
          const gradientStopsSummary = this._getGradientStopsSummary(scope);
          const gradientStopsInactive = this.fillStyle(scope) !== "gradient";
          return `	        <div class="section">
	          <div class="section-head">
	            <h3>Gradient Stops</h3>
	            <div class="section-note">Gradient stops define a smooth color transition from 0 to 100%.</div>
	          </div>
	          ${renderGroup({
            group: "gradient-stops",
            title: "Gradient Stops",
            summary: gradientStopsSummary,
            inactive: gradientStopsInactive,
            content: `
	              ${gradientStopsInactive ? '<div class="section-note">Only used with Gradient fill style</div>' : ""}
	              ${this._renderGradientPreview({ type: "card" }, {
              previewId: "card-gradient-preview",
              trackId: "card-gradient-preview-track"
            })}
	              <div class="field-row">
	                <label>Gradient stops</label>
	                <div class="list gradient-stop-list">
	                  ${this._renderListRows(gradientStops, (stop, index) => {
              var _a, _b;
              return `
	                    <div class="list-row gradient-stop-row">
	                      <input type="number" min="0" max="100" step="any" data-kind="gradient-pos" data-index="${index}" value="${escapeAttribute(this._getGradientStopPosText({ type: "card" }, index, (_a = stop == null ? void 0 : stop.pos) != null ? _a : ""))}" placeholder="0">
	                      ${renderColorInput({
                id: `gradient-color-${index}`,
                kind: "gradient-color",
                index,
                value: (_b = stop == null ? void 0 : stop.color) != null ? _b : "#4a9eff",
                fallbackHex: "#4CAF50",
                placeholder: "CSS color value"
              })}
	                      <button type="button" data-action="remove-gradient-stop" data-index="${index}" aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                    </div>
	                  `;
            })}
	                  <div class="gradient-stop-draft">
	                    <div class="list-row gradient-stop-row">
	                      <input id="gradient-draft-pos" type="number" min="0" max="100" step="any" data-kind="gradient-draft-pos" value="${escapeAttribute(gradientDraft.pos)}" placeholder="0">
	                      ${renderColorInput({
              id: "gradient-draft-color",
              kind: "gradient-draft-color",
              index: "card",
              value: gradientDraft.color,
              fallbackHex: "#4CAF50",
              placeholder: "CSS color value"
            })}
	                      <button type="button" data-action="add-gradient-stop"${this._canAddGradientStop({ type: "card" }) ? "" : " disabled"}>Add</button>
	                    </div>
	                    ${gradientDraftMessage ? `<div id="gradient-draft-hint" class="section-note">${escapeAttribute(gradientDraftMessage)}</div>` : ""}
	                  </div>
	                </div>
	              </div>
	            `
          })}
	        </div>`;
        }
      };
    }
  });

  // src/editor/sections/needle.js
  var NeedleSection;
  var init_needle = __esm({
    "src/editor/sections/needle.js"() {
      init_editor_config();
      init_editor_controls();
      NeedleSection = class {
        constructor(context, options = {}) {
          this.options = options;
          this.context = context;
        }
        _setNeedle(value) {
          return this._setScopedNeedleMode({ type: "card" }, value ? "enabled" : "disabled");
        }
        _getScopedNeedleConfig(scope) {
          var _a;
          const rawNeedle = this.context.read(scope, ["bar", "needle"]);
          const defaultColor = "#ffffff";
          let mode = (scope == null ? void 0 : scope.type) === "entity" ? "inherit" : "disabled";
          let color = "";
          if (typeof rawNeedle === "boolean") {
            mode = rawNeedle ? "enabled" : "disabled";
          } else if (isObject(rawNeedle)) {
            if (rawNeedle.show === true) {
              mode = "enabled";
            } else if (rawNeedle.show === false) {
              mode = "disabled";
            } else if ((scope == null ? void 0 : scope.type) !== "entity") {
              mode = "disabled";
            }
            color = (_a = rawNeedle.color) != null ? _a : "";
          }
          if (color === defaultColor) {
            color = "";
          }
          return { mode, color };
        }
        _hasNeedleOverride(scope) {
          return this.context.read(scope, ["bar", "needle"]) !== void 0;
        }
        _getEffectiveScopedNeedleConfig(scope) {
          const localNeedle = this._getScopedNeedleConfig(scope);
          if ((scope == null ? void 0 : scope.type) !== "entity") {
            return localNeedle;
          }
          if (!this._hasNeedleOverride(scope)) {
            return this._getScopedNeedleConfig({ type: "card" });
          }
          const inheritedNeedle = this._getScopedNeedleConfig({ type: "card" });
          return {
            mode: localNeedle.mode === "inherit" ? inheritedNeedle.mode : localNeedle.mode,
            color: localNeedle.color || inheritedNeedle.color
          };
        }
        _setScopedNeedleMode(scope, mode) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const existingNeedle = getPathValue(nextTarget, ["bar", "needle"]);
            const existingColor = isObject(existingNeedle) ? existingNeedle.color : void 0;
            nextTarget = deletePathValue(nextTarget, ["bar", "needle"]);
            if ((scope == null ? void 0 : scope.type) === "entity" && mode === "inherit") {
              nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
              return nextTarget;
            }
            if (mode === "disabled") {
              if ((scope == null ? void 0 : scope.type) === "entity") {
                nextTarget = setPathValue(nextTarget, ["bar", "needle"], { show: false });
              }
              nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
              return nextTarget;
            }
            const nextNeedle = { show: true };
            if (existingColor && existingColor !== "#ffffff") {
              nextNeedle.color = existingColor;
            }
            nextTarget = setPathValue(nextTarget, ["bar", "needle"], nextNeedle);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, { needleEdit: { field: "mode", value: mode } });
        }
        _setScopedNeedleColor(scope, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const current = this._getScopedNeedleConfig(scope);
            const hasCustomColor = normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue("#ffffff");
            nextTarget = deletePathValue(nextTarget, ["bar", "needle", "color"]);
            if ((scope == null ? void 0 : scope.type) !== "entity" && current.mode === "disabled") {
              nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar", "needle"]);
              nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
              return nextTarget;
            }
            const showValue = current.mode === "enabled" ? true : current.mode === "disabled" ? false : void 0;
            const nextNeedle = {};
            if (showValue !== void 0) {
              nextNeedle.show = showValue;
            }
            if (hasCustomColor) {
              nextNeedle.color = normalizedValue;
            }
            if (Object.keys(nextNeedle).length) {
              nextTarget = setPathValue(nextTarget, ["bar", "needle"], nextNeedle);
            } else {
              nextTarget = deletePathValue(nextTarget, ["bar", "needle"]);
            }
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar", "needle"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, { needleEdit: { field: "color", value: normalizedValue } });
        }
        _getNeedleValue() {
          return this._getScopedNeedleConfig({ type: "card" }).mode === "enabled";
        }
        _removeScopedNeedle(scope) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = deletePathValue(target, ["bar", "needle"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          });
        }
        _getNeedleSummary(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasNeedleOverride(scope)) return "Inherited";
          const needle = this._getScopedNeedleConfig(scope);
          if (needle.mode === "disabled") return needle.color ? "Disabled \u2022 Custom color" : "Disabled";
          if (needle.mode === "enabled") return needle.color ? "Enabled \u2022 Custom color" : "Enabled";
          if (needle.color) return "Custom color";
          return "Inherited";
        }
        handleField({ field, kind, index, value }) {
          const scope = (kind == null ? void 0 : kind.startsWith("entity-")) ? { type: "entity", index: Number(index) } : { type: "card" };
          const control = field != null ? field : kind == null ? void 0 : kind.replace(/^entity-/, "");
          if (kind === "entity-needle-inherit") {
            if (value) this._removeScopedNeedle(scope);
            return true;
          }
          if (["bar-needle-mode", "needle-mode"].includes(control)) {
            this._setScopedNeedleMode(scope, value);
            return true;
          }
          if (["bar-needle-color", "needle-color"].includes(control)) {
            this._setScopedNeedleColor(scope, value);
            return true;
          }
          return false;
        }
        render(scope = { type: "card" }, renderGroup = ({ content }) => content) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const needleInherited = !this._hasNeedleOverride(scope);
            const entityNeedle = this._getEffectiveScopedNeedleConfig(scope);
            return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-needle-inherit" type="checkbox" data-kind="entity-needle-inherit" data-index="${index}"${needleInherited ? " checked" : ""}>
                          <label for="entity-${index}-needle-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-mode">Needle mode</label>
	                        <select id="entity-${index}-needle-mode" data-kind="entity-needle-mode" data-index="${index}" value="${escapeAttribute(entityNeedle.mode)}">
                          <option value="enabled"${entityNeedle.mode === "enabled" ? " selected" : ""}>enabled</option>
                          <option value="disabled"${entityNeedle.mode === "disabled" ? " selected" : ""}>disabled</option>
                        </select>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-needle-color">Needle color</label>
	                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Needle color",
              id: `entity-${index}-needle-color`,
              kind: "entity-needle-color",
              index,
              value: entityNeedle.color,
              fallbackHex: "#ffffff",
              placeholder: "#ffffff"
            })}
	                      </div>
	                          `;
          }
          const cardNeedle = this._getScopedNeedleConfig(scope);
          return `          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="bar-needle-mode">Needle enabled</label>
              <select id="bar-needle-mode" data-field="bar-needle-mode" value="${escapeAttribute(cardNeedle.mode)}">
                <option value="disabled"${cardNeedle.mode === "disabled" ? " selected" : ""}>disabled</option>
                <option value="enabled"${cardNeedle.mode === "enabled" ? " selected" : ""}>enabled</option>
              </select>
            </div>
            <div class="field-row">
              <label for="bar-needle-color">Needle color</label>
              ${renderColorInput({
            cssText: this.options.cssText,
            label: "Needle color",
            id: "bar-needle-color",
            field: "bar-needle-color",
            value: cardNeedle.color,
            fallbackHex: "#ffffff",
            placeholder: "#ffffff"
          })}
            </div>
          </div>`;
        }
      };
    }
  });

  // src/editor/sections/baseline.js
  var BaselineSection;
  var init_baseline = __esm({
    "src/editor/sections/baseline.js"() {
      init_editor_config();
      init_editor_controls();
      BaselineSection = class {
        constructor(context, options = {}) {
          this.options = options;
          this.context = context;
          this.reset();
        }
        reset() {
          this._baselineColorDrafts = /* @__PURE__ */ new Map();
          this._sourceMode = void 0;
          this._percentageDraft = void 0;
        }
        _getBaselineColorDraftKey(scope = { type: "card" }, direction = "above") {
          const scopeKey = (scope == null ? void 0 : scope.type) === "entity" ? `entity:${scope.index}` : "card";
          return `${scopeKey}:${direction}`;
        }
        _setBaselineColorDraft(scope, direction, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          const key = this._getBaselineColorDraftKey(scope, direction);
          if (normalizedValue) {
            this._baselineColorDrafts.set(key, normalizedValue);
          } else {
            this._baselineColorDrafts.delete(key);
          }
        }
        _getBaselineColorDraft(scope, direction) {
          var _a;
          return (_a = this._baselineColorDrafts.get(this._getBaselineColorDraftKey(scope, direction))) != null ? _a : "";
        }
        _isBaselineDirectionalColorEnabled(scope, direction) {
          return !!normalizeTextValue(this._getBaselineDirectionalColorValue(scope, direction)).trim();
        }
        _setBaselineDirectionalColorEnabled(scope, direction, value) {
          const currentValue = normalizeEditorColorValue(this._getBaselineDirectionalColorValue(scope, direction), this.options.cssText);
          if (!value) {
            if (currentValue) {
              this._setBaselineColorDraft(scope, direction, currentValue);
            }
            return this._removeColor(scope, ["baseline", direction, "color"], {
              prunePaths: [["baseline", direction], ["baseline"]]
            });
          }
          const nextValue = this._getBaselineColorDraft(scope, direction) || normalizeEditorColorValue(this._getEffectiveBaselineDirectionalColorValue(scope, direction), this.options.cssText) || currentValue || "#000000";
          return this._setColor(scope, ["baseline", direction, "color"], nextValue, {
            prunePaths: [["baseline", direction], ["baseline"]]
          });
        }
        _getSourceMode() {
          var _a;
          return (_a = this._sourceMode) != null ? _a : getMarkerSourceMode(this.context.source({ type: "card" }, "baseline"));
        }
        _handlePercentageField(control, value, scope) {
          if (!this.options.percentSources) return false;
          if (control === "baseline-source-mode") {
            this._sourceMode = value;
            this._percentageDraft = void 0;
            this.context.setSource(scope, "baseline", "mode", value);
            return true;
          }
          if (control !== "baseline-percent") return false;
          const percent = normalizeScalePercentageInput(value);
          this._percentageDraft = percent === null ? value : void 0;
          if (percent !== null) this.context.setSource(scope, "baseline", "percent", percent);
          return true;
        }
        _getBaselineResolvableValue(scope) {
          return this.context.source(scope, "baseline");
        }
        _getEffectiveBaselineResolvableValue(scope) {
          return this.context.source(scope, "baseline", true);
        }
        _getBaselineMode(scope) {
          const enabled = this.context.read(scope, ["baseline", "enabled"]);
          if ((scope == null ? void 0 : scope.type) === "entity") {
            if (enabled === false) return "disabled";
            if (enabled === true || this._hasBaselineOverride(scope)) return "enabled";
            return "inherit";
          }
          if (enabled === true) return "enabled";
          if (enabled === false) return "disabled";
          return "auto";
        }
        _getEffectiveBaselineMode(scope) {
          const mode = this._getBaselineMode(scope);
          if ((scope == null ? void 0 : scope.type) !== "entity" || mode !== "inherit") {
            return mode;
          }
          const cardMode = this._getBaselineMode({ type: "card" });
          if (cardMode === "disabled") return "disabled";
          if (cardMode === "enabled") return "enabled";
          const cardBaseline = this._getBaselineResolvableValue({ type: "card" });
          return hasResolvableOverride(cardBaseline) || !!this._getBaselineDirectionalColorValue({ type: "card" }, "above") || !!this._getBaselineDirectionalColorValue({ type: "card" }, "below") ? "enabled" : "disabled";
        }
        _setBaselineMode(scope, mode) {
          if ((scope == null ? void 0 : scope.type) === "entity" && mode === "inherit") {
            return this._clearBaselineOverride(scope);
          }
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            if (mode === "auto") {
              nextTarget = deletePathValue(nextTarget, ["baseline", "enabled"]);
            } else {
              nextTarget = setPathValue(nextTarget, ["baseline", "enabled"], mode === "enabled");
            }
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["baseline"]);
            return nextTarget;
          }, { baselineEdit: { path: ["enabled"], value: mode === "auto" ? void 0 : mode === "enabled" } });
        }
        _setBaselineDirectionalColor(scope, direction, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          this._setBaselineColorDraft(scope, direction, normalizedValue);
          const path = ["baseline", direction, "color"];
          if (!normalizedValue) {
            return this._removeColor(scope, path, {
              prunePaths: [["baseline", direction], ["baseline"]]
            });
          }
          if (!this._isBaselineDirectionalColorEnabled(scope, direction)) {
            return this._setBaselineDirectionalColorEnabled(scope, direction, true);
          }
          return this.context.mutate(scope, (target) => {
            return setPathValue(target, path, normalizedValue);
          }, { baselineEdit: { path: [direction, "color"], value: normalizedValue } });
        }
        _getBaselineDirectionalColorValue(scope, direction) {
          var _a;
          return (_a = this.context.read(scope, ["baseline", direction, "color"])) != null ? _a : "";
        }
        _getEffectiveBaselineDirectionalColorValue(scope, direction) {
          var _a;
          const value = this.context.read(scope, ["baseline", direction, "color"]);
          if (value !== void 0 && value !== null && value !== "") return value;
          return (scope == null ? void 0 : scope.type) === "entity" ? (_a = this.context.read({ type: "card" }, ["baseline", direction, "color"])) != null ? _a : "" : "";
        }
        _clearBaselineOverride(scope) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const rawBaseline = getPathValue(nextTarget, ["baseline"]);
            if (isObject(rawBaseline)) {
              nextTarget = deletePathValue(nextTarget, ["baseline", "enabled"]);
              nextTarget = deletePathValue(nextTarget, ["baseline", "at"]);
              nextTarget = deletePathValue(nextTarget, ["baseline", "above", "color"]);
              nextTarget = deletePathValue(nextTarget, ["baseline", "below", "color"]);
            } else {
              nextTarget = deletePathValue(nextTarget, ["baseline"]);
            }
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["baseline", "above"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["baseline", "below"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["baseline"]);
            return nextTarget;
          }, { rerender: true });
        }
        _removeBaseline(scope) {
          return this.context.mutate(scope, (target) => deletePathValue(target, ["baseline"]), { rerender: true });
        }
        _hasBaselineOverride(scope) {
          const baselineValue = this.context.read(scope, ["baseline"]);
          if (isObject(baselineValue) && Object.keys(baselineValue).length) {
            return true;
          }
          return !isObject(baselineValue) && baselineValue !== void 0 && baselineValue !== null && baselineValue !== "";
        }
        _getBaselineOverrideSummary(scope) {
          const mode = this._getBaselineMode(scope);
          if (mode === "disabled") return "Disabled";
          const parts = [];
          const baseline = this._getBaselineResolvableValue(scope);
          if (baseline.fixed !== "" && baseline.fixed !== void 0) parts.push(`Baseline ${baseline.fixed}`);
          if (baseline.entity) parts.push("Entity");
          if (this._getBaselineDirectionalColorValue(scope, "above")) parts.push("Above");
          if (this._getBaselineDirectionalColorValue(scope, "below")) parts.push("Below");
          return parts.length ? parts.join(" \u2022 ") : "Inherited";
        }
        _getCardBaselineSummary() {
          const mode = this._getBaselineMode({ type: "card" });
          if (mode === "disabled") return "Disabled";
          const baseline = this._getBaselineResolvableValue({ type: "card" });
          const origin = baseline.entity || (baseline.fixed !== "" && baseline.fixed !== void 0 ? baseline.fixed : "");
          const modeLabel = mode === "enabled" ? "Enabled" : "Auto";
          return origin !== "" ? `${modeLabel} \xB7 ${origin}` : modeLabel;
        }
        _setBaselineResolvablePart(scope, part, value) {
          return this.context.setSource(scope, "baseline", part, value);
        }
        _setColor(scope, path, value, options = {}) {
          return this.context.mutate(scope, (target) => {
            var _a;
            let next = value === void 0 ? deletePathValue(target, path) : setPathValue(target, path, value);
            for (const prunePath of (_a = options.prunePaths) != null ? _a : []) next = pruneEmptyObjectsInTarget(next, prunePath);
            return next;
          }, { ...options, baselineEdit: { path: path.slice(1), value } });
        }
        _removeColor(scope, path, options) {
          return this._setColor(scope, path, void 0, options);
        }
        handleField({ field, kind, index, value }) {
          const scope = (kind == null ? void 0 : kind.startsWith("entity-")) ? { type: "entity", index: Number(index) } : { type: "card" };
          const control = field != null ? field : kind == null ? void 0 : kind.replace(/^entity-/, "");
          if (this._handlePercentageField(control, value, scope)) return true;
          if (kind === "entity-baseline-inherit") {
            if (value) this._clearBaselineOverride(scope);
            return true;
          }
          if (control === "baseline-mode") {
            this._setBaselineMode(scope, value);
            return true;
          }
          if (control === "baseline-value") {
            this._setBaselineResolvablePart(scope, "fixed", value);
            return true;
          }
          if (control === "baseline-entity-source") {
            this._setBaselineResolvablePart(scope, "entity", value);
            return true;
          }
          for (const direction of ["above", "below"]) {
            if (control === `baseline-${direction}-color`) {
              this._setBaselineDirectionalColor(scope, direction, value);
              return true;
            }
            if (control === `baseline-${direction}-color-enabled`) {
              this._setBaselineDirectionalColorEnabled(scope, direction, value);
              return true;
            }
          }
          return false;
        }
        handleClick(target) {
          var _a, _b;
          if (this.options.percentSources && ((_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.action) === "baseline-clear-percent") {
            this._percentageDraft = void 0;
            this.context.setSource({ type: "card" }, "baseline", "percent", null);
            return true;
          }
          if (((_b = target == null ? void 0 : target.dataset) == null ? void 0 : _b.action) !== "remove-baseline") return false;
          this._removeBaseline(target.dataset.scopeType === "entity" ? { type: "entity", index: Number(target.dataset.index) } : { type: "card" });
          return true;
        }
        render(scope = { type: "card" }, renderGroup = ({ content }) => content) {
          var _a, _b;
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const baselineInherited = !this._hasBaselineOverride(scope);
            const baselineParts = this._getEffectiveBaselineResolvableValue(scope);
            const baselineMode2 = this._getEffectiveBaselineMode(scope);
            return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-baseline-inherit" type="checkbox" data-kind="entity-baseline-inherit" data-index="${index}"${baselineInherited ? " checked" : ""}>
	                          <label for="entity-${index}-baseline-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <button type="button" data-action="remove-baseline" data-scope-type="entity" data-index="${index}" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-mode">Baseline mode</label>
                        <select id="entity-${index}-baseline-mode" data-kind="entity-baseline-mode" data-index="${index}" value="${escapeAttribute(baselineMode2)}">
                          <option value="enabled"${baselineMode2 === "enabled" ? " selected" : ""}>enabled</option>
                          <option value="disabled"${baselineMode2 === "disabled" ? " selected" : ""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-value">Baseline fallback</label>
                        <input id="entity-${index}-baseline-value" type="number" step="any" data-kind="entity-baseline-value" data-index="${index}" value="${escapeAttribute(baselineParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label>Baseline entity</label>
                        ${renderEntitySourceInput("entity-baseline-entity-source", index, baselineParts.entity, "inherit card default")}
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-baseline-above-color-enabled" type="checkbox" data-kind="entity-baseline-above-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, "above") ? " checked" : ""}>
                          <label for="entity-${index}-baseline-above-color-enabled">Above-baseline color enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-baseline-above-color">Above-baseline color</label>
                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Baseline color",
              id: `entity-${index}-baseline-above-color`,
              kind: "entity-baseline-above-color",
              index,
              value: this._getEffectiveBaselineDirectionalColorValue(scope, "above"),
              fallbackHex: "#000000",
              placeholder: "inherit card default"
            })}
                      </div>
	                      <div class="field-row">
                          <div class="toggle">
                            <input id="entity-${index}-baseline-below-color-enabled" type="checkbox" data-kind="entity-baseline-below-color-enabled" data-index="${index}"${this._isBaselineDirectionalColorEnabled(scope, "below") ? " checked" : ""}>
                            <label for="entity-${index}-baseline-below-color-enabled">Below-baseline color enabled</label>
                          </div>
                        </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-baseline-below-color">Below-baseline color</label>
	                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Baseline color",
              id: `entity-${index}-baseline-below-color`,
              kind: "entity-baseline-below-color",
              index,
              value: this._getEffectiveBaselineDirectionalColorValue(scope, "below"),
              fallbackHex: "#000000",
              placeholder: "inherit card default"
            })}
	                      </div>
	                          `;
          }
          const baseline = this._getBaselineResolvableValue(scope);
          const baselineMode = this._getBaselineMode(scope);
          const baselineAboveColor = this._getBaselineDirectionalColorValue(scope, "above");
          const baselineBelowColor = this._getBaselineDirectionalColorValue(scope, "below");
          return `
          ${renderGroup({
            group: "baseline",
            title: "Baseline",
            summary: this._getCardBaselineSummary(),
            content: `
          <div class="field-grid">
            <div class="field-row">
              <button type="button" data-action="remove-baseline" data-scope-type="card" aria-label="Remove Baseline" title="Remove Baseline">\u{1F5D1}</button>
            </div>
            <div class="field-row">
              <label for="baseline-mode">Baseline mode</label>
              <select id="baseline-mode" data-field="baseline-mode" value="${escapeAttribute(baselineMode)}">
                <option value="auto"${baselineMode === "auto" ? " selected" : ""}>auto</option>
                <option value="enabled"${baselineMode === "enabled" ? " selected" : ""}>enabled</option>
                <option value="disabled"${baselineMode === "disabled" ? " selected" : ""}>disabled</option>
              </select>
            </div>
            <div class="field-row">
              <div class="section-note">Auto shows the baseline when a baseline value is configured.</div>
            </div>
            ${this.options.percentSources ? renderMarkerPercentageControls("baseline", this._getSourceMode(), (_b = (_a = this._percentageDraft) != null ? _a : baseline.percent) != null ? _b : "") : ""}<div class="field-row">
              <label for="baseline-value">Baseline fallback</label>
              <input id="baseline-value" type="number" step="any" data-field="baseline-value" value="${escapeAttribute(baseline.fixed)}">
            </div>
            <div class="field-row">
              <label>Baseline entity</label>
              ${renderEntitySourceInput("baseline-entity-source", "card", baseline.entity)}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-above-color-enabled" type="checkbox" data-field="baseline-above-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: "card" }, "above") ? " checked" : ""}>
                <label for="baseline-above-color-enabled">Above-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-above-color">Above-baseline color</label>
              ${renderColorInput({
              cssText: this.options.cssText,
              label: "Baseline color",
              id: "baseline-above-color",
              field: "baseline-above-color",
              value: baselineAboveColor,
              fallbackHex: "#000000"
            })}
            </div>
            <div class="field-row">
              <div class="toggle">
                <input id="baseline-below-color-enabled" type="checkbox" data-field="baseline-below-color-enabled"${this._isBaselineDirectionalColorEnabled({ type: "card" }, "below") ? " checked" : ""}>
                <label for="baseline-below-color-enabled">Below-baseline color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="baseline-below-color">Below-baseline color</label>
              ${renderColorInput({
              cssText: this.options.cssText,
              label: "Baseline color",
              id: "baseline-below-color",
              field: "baseline-below-color",
              value: baselineBelowColor,
              fallbackHex: "#000000"
            })}
            </div>
          </div>`
          })}
`;
        }
      };
    }
  });

  // src/editor/shared/editor-marker-controls.js
  function normalizeMarkerLabelField(field, value) {
    if (field === "text") return normalizeTextValue(value).replace(/\s+/g, " ").trim();
    if (field === "entity") return normalizeTextValue(value).trim();
    if (["show", "showValue", "showUnit", "show_value", "show_unit"].includes(field)) return value === true;
    return normalizeDecimalValue(value);
  }
  function getBuiltinMarkerLabelOptions(context, scope, key, show) {
    var _a;
    const marker = context.read(scope, [key]);
    const label = isObject(marker == null ? void 0 : marker.label) ? marker.label : {};
    const cardLabel = (scope == null ? void 0 : scope.type) === "entity" ? (_a = context.read({ type: "card" }, [key, "label"])) != null ? _a : {} : {};
    const own = (name) => Object.prototype.hasOwnProperty.call(label, name);
    const inheritedValue = (name, fallback) => {
      var _a2;
      return own(name) ? label[name] : (_a2 = cardLabel[name]) != null ? _a2 : fallback;
    };
    const precision = inheritedValue("precision", inheritedValue("decimal", ""));
    return {
      show,
      text: inheritedValue("text", ""),
      showValue: inheritedValue("show_value", true) !== false,
      showUnit: inheritedValue("show_unit", true) !== false,
      precision: precision === null ? "" : precision
    };
  }
  function setBuiltinMarkerLabelField(context, scope, key, field, value) {
    const publicField = field === "showValue" ? "show_value" : field === "showUnit" ? "show_unit" : field === "precision" ? "precision" : field;
    const isText = field === "text";
    const normalized = normalizeMarkerLabelField(field, value);
    if (field === "precision" && value !== "" && normalized === null) return false;
    return context.mutate(scope, (target) => {
      var _a, _b, _c, _d;
      let next = cloneDeep(target);
      if (key === "target" && field === "show") next = deletePathValue(next, ["show_target_label"]);
      const marker = isObject(getPathValue(next, [key])) ? cloneDeep(getPathValue(next, [key])) : {};
      const label = isObject(marker.label) ? cloneDeep(marker.label) : {};
      const inheritedLabel = (scope == null ? void 0 : scope.type) === "entity" ? (_a = context.read({ type: "card" }, [key, "label"])) != null ? _a : {} : {};
      const inheritedValue = field === "precision" ? (_c = (_b = inheritedLabel.precision) != null ? _b : inheritedLabel.decimal) != null ? _c : null : (_d = inheritedLabel[publicField]) != null ? _d : field === "show" ? false : field === "showValue" || field === "showUnit" ? true : void 0;
      if (normalized === null || isText && !normalized) {
        if (isText && (scope == null ? void 0 : scope.type) === "entity" && typeof inheritedLabel.text === "string" && inheritedLabel.text.trim()) {
          label[publicField] = "";
        } else {
          delete label[publicField];
        }
      } else if ((scope == null ? void 0 : scope.type) === "entity" && normalized === inheritedValue) {
        delete label[publicField];
      } else if ((field === "show" || field === "showValue" || field === "showUnit") && (scope == null ? void 0 : scope.type) !== "entity" && normalized === (field === "show" ? false : true)) {
        delete label[publicField];
      } else {
        label[publicField] = normalized;
      }
      if (field === "precision") delete label.decimal;
      if (Object.keys(label).length) marker.label = label;
      else delete marker.label;
      if (Object.keys(marker).length) next = setPathValue(next, [key], marker);
      else next = deletePathValue(next, [key]);
      return next;
    }, { markerEdit: { key, path: ["label", publicField], value: normalized, field } });
  }
  function getEffectiveMarkerDirection(context, scope, key) {
    const canonical = context.read(scope, [key, "direction"]);
    const local = canonical !== void 0 ? canonical : context.read(scope, [`${key}_marker`, "direction"]);
    if ((scope == null ? void 0 : scope.type) === "entity" && local === void 0) {
      return getEffectiveMarkerDirection(context, { type: "card" }, key);
    }
    return normalizeMarkerDirection(local);
  }
  function setMarkerDirection(context, scope, key, rawValue) {
    const direction = normalizeMarkerDirection(rawValue);
    const cardDirection = getEffectiveMarkerDirection(context, { type: "card" }, key);
    const value = (scope == null ? void 0 : scope.type) !== "entity" && direction === "inward" || (scope == null ? void 0 : scope.type) === "entity" && direction === cardDirection ? void 0 : direction;
    return context.mutate(
      scope,
      (target) => pruneEmptyObjectsInTarget(value === void 0 ? deletePathValue(target, [key, "direction"]) : setPathValue(target, [key, "direction"], value), [key]),
      { prunePaths: [[key]], markerEdit: { key, path: ["direction"], value: direction } }
    );
  }
  var init_editor_marker_controls = __esm({
    "src/editor/shared/editor-marker-controls.js"() {
      init_normalize();
      init_editor_config();
    }
  });

  // src/editor/sections/target.js
  var TargetSection;
  var init_target = __esm({
    "src/editor/sections/target.js"() {
      init_normalize();
      init_editor_config();
      init_editor_controls();
      init_editor_marker_controls();
      TargetSection = class {
        constructor(context, options = {}) {
          this.options = options;
          this.context = context;
          this.reset();
        }
        reset() {
          this._targetAboveFillDrafts = /* @__PURE__ */ new Map();
          this._sourceMode = void 0;
          this._percentageDraft = void 0;
        }
        _getCardTargetMarkerSummary() {
          const mode = this._getTargetMode({ type: "card" });
          if (mode === "disabled") return "Disabled";
          const target = this._getTargetResolvableValue({ type: "card" });
          const parts = [];
          if (mode === "enabled") parts.push("Enabled");
          const hasTargetValue = target.fixed !== "" && target.fixed !== void 0 || !!target.entity;
          if (target.fixed !== "" && target.fixed !== void 0) parts.push(String(target.fixed));
          if (target.entity) parts.push(target.entity);
          if (hasTargetValue || this._hasTargetShape({ type: "card" })) {
            parts.push(this._getEffectiveTargetShapeValue({ type: "card" }) === "triangle" ? "Triangle" : "Diamond");
          }
          return parts.length ? parts.join(" \xB7 ") : "Automatic";
        }
        _getSourceMode() {
          var _a;
          return (_a = this._sourceMode) != null ? _a : getMarkerSourceMode(this.context.source({ type: "card" }, "target"));
        }
        _handlePercentageField(control, value, scope) {
          if (!this.options.percentSources) return false;
          if (control === "target-source-mode") {
            this._sourceMode = value;
            this._percentageDraft = void 0;
            this.context.setSource(scope, "target", "mode", value);
            return true;
          }
          if (control !== "target-percent") return false;
          const percent = normalizeScalePercentageInput(value);
          this._percentageDraft = percent === null ? value : void 0;
          if (percent !== null) this.context.setSource(scope, "target", "percent", percent);
          return true;
        }
        _getTargetResolvableValue(scope) {
          return this.context.source(scope, "target");
        }
        _getEffectiveTargetResolvableValue(scope) {
          return this.context.source(scope, "target", true);
        }
        _getTargetMode(scope) {
          const enabled = this.context.read(scope, ["target", "enabled"]);
          if ((scope == null ? void 0 : scope.type) === "entity") {
            if (enabled === false) return "disabled";
            if (enabled === true || this._hasTargetOverride(scope)) return "enabled";
            return "inherit";
          }
          if (enabled === true) return "enabled";
          if (enabled === false) return "disabled";
          return "auto";
        }
        _getTargetShapeValue(scope) {
          var _a;
          return (_a = this.context.read(scope, ["target", "shape"])) != null ? _a : "";
        }
        _hasTargetShape(scope) {
          const target = this.context.read(scope, ["target"]);
          return isObject(target) && Object.prototype.hasOwnProperty.call(target, "shape");
        }
        _getEffectiveTargetShapeValue(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasTargetShape(scope)) {
            return this._getEffectiveTargetShapeValue({ type: "card" });
          }
          return normalizeTargetMarkerShape(this._getTargetShapeValue(scope));
        }
        _setTargetShape(scope, rawValue) {
          const normalizedShape = normalizeTargetMarkerShape(rawValue);
          if ((scope == null ? void 0 : scope.type) !== "entity" && normalizedShape === "diamond") {
            return this._remove(scope, ["target", "shape"], {
              prunePaths: [["target"]]
            });
          }
          return this._setText(scope, ["target", "shape"], normalizedShape, {
            prunePaths: [["target"]]
          });
        }
        _getEffectiveTargetMode(scope) {
          const mode = this._getTargetMode(scope);
          if ((scope == null ? void 0 : scope.type) !== "entity" || mode !== "inherit") {
            return mode;
          }
          const cardMode = this._getTargetMode({ type: "card" });
          if (cardMode === "disabled") return "disabled";
          if (cardMode === "enabled") return "enabled";
          const cardTarget = this._getTargetResolvableValue({ type: "card" });
          return hasResolvableOverride(cardTarget) || this._hasCustomTargetColor({ type: "card" }) || this._getTargetLabelShowValue({ type: "card" }) || !!this._getTargetAboveFillColorValue({ type: "card" }) ? "enabled" : "disabled";
        }
        _setTargetMode(scope, mode) {
          if ((scope == null ? void 0 : scope.type) === "entity" && mode === "inherit") {
            return this._clearTargetOverride(scope);
          }
          if (mode === "auto") {
            return this._remove(scope, ["target", "enabled"], {
              prunePaths: [["target"]]
            });
          }
          return this._write(scope, ["target", "enabled"], mode === "enabled", {
            prunePaths: [["target"]]
          });
        }
        _setTargetResolvablePart(scope, part, rawValue) {
          return this.context.setSource(scope, "target", part, rawValue);
        }
        _clearTargetOverride(scope) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const rawTarget = getPathValue(nextTarget, ["target"]);
            if (isObject(rawTarget)) {
              nextTarget = deletePathValue(nextTarget, ["target", "enabled"]);
              nextTarget = deletePathValue(nextTarget, ["target", "at"]);
              nextTarget = deletePathValue(nextTarget, ["target", "color"]);
              nextTarget = deletePathValue(nextTarget, ["target", "shape"]);
              nextTarget = deletePathValue(nextTarget, ["target", "direction"]);
              nextTarget = deletePathValue(nextTarget, ["target", "label", "show"]);
              nextTarget = deletePathValue(nextTarget, ["target", "label", "decimal"]);
              nextTarget = deletePathValue(nextTarget, ["target", "when_exceeded", "fill_color"]);
            } else {
              nextTarget = deletePathValue(nextTarget, ["target"]);
            }
            nextTarget = deletePathValue(nextTarget, ["target_entity"]);
            nextTarget = deletePathValue(nextTarget, ["target_color"]);
            nextTarget = deletePathValue(nextTarget, ["show_target_label"]);
            nextTarget = deletePathValue(nextTarget, ["above_target_color"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["target", "label"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["target", "when_exceeded"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["target"]);
            return nextTarget;
          }, { rerender: true });
        }
        _getTargetColorValue(scope) {
          var _a, _b;
          return (_b = (_a = this.context.read(scope, ["target", "color"])) != null ? _a : this.context.read(scope, ["target_color"])) != null ? _b : "";
        }
        _getEffectiveTargetColorValue(scope) {
          return this._effectiveDisplay(scope, ["target", "color"], [["target_color"]]);
        }
        _hasCustomTargetColor(scope) {
          const color = this._getTargetColorValue(scope);
          return !!color && normalizeColorComparisonValue(color) !== normalizeColorComparisonValue("#888");
        }
        _setTargetColor(scope, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          if (!normalizedValue || normalizeColorComparisonValue(normalizedValue) === normalizeColorComparisonValue("#888")) {
            return this._remove(scope, ["target", "color"], {
              deprecatedKeys: [["target_color"]],
              prunePaths: [["target"]]
            });
          }
          return this._setText(scope, ["target", "color"], normalizedValue, {
            deprecatedKeys: [["target_color"]],
            prunePaths: [["target"]]
          });
        }
        _getTargetLabelShowValue(scope) {
          const structuredValue = this.context.read(scope, ["target", "label", "show"]);
          if (structuredValue !== void 0) {
            return !!structuredValue;
          }
          return !!this.context.read(scope, ["show_target_label"]);
        }
        _getEffectiveTargetLabelShowValue(scope) {
          const structuredValue = this.context.read(scope, ["target", "label", "show"]);
          if (structuredValue !== void 0) {
            return !!structuredValue;
          }
          const legacyValue = this.context.read(scope, ["show_target_label"]);
          if (legacyValue !== void 0) {
            return !!legacyValue;
          }
          if ((scope == null ? void 0 : scope.type) === "entity") {
            return this._getTargetLabelShowValue({ type: "card" });
          }
          return false;
        }
        _setTargetLabelShow(scope, value) {
          if (!value) {
            return this._remove(scope, ["target", "label", "show"], {
              deprecatedKeys: [["show_target_label"]],
              prunePaths: [["target", "label"], ["target"]]
            });
          }
          return this._write(scope, ["target", "label", "show"], true, {
            deprecatedKeys: [["show_target_label"]],
            prunePaths: [["target", "label"], ["target"]]
          });
        }
        _getTargetLabelDecimalValue(scope) {
          var _a, _b;
          return (_b = (_a = this.context.read(scope, ["target", "label", "precision"])) != null ? _a : this.context.read(scope, ["target", "label", "decimal"])) != null ? _b : "";
        }
        _getEffectiveTargetLabelDecimalValue(scope) {
          const local = this._getTargetLabelDecimalValue(scope);
          return local !== "" && local !== null && local !== void 0 ? local : (scope == null ? void 0 : scope.type) === "entity" ? this._getTargetLabelDecimalValue({ type: "card" }) : "";
        }
        _setTargetLabelDecimal(scope, rawValue) {
          const normalizedValue = normalizeDecimalValue(rawValue);
          if (rawValue === "" || rawValue === null || rawValue === void 0) {
            return this._remove(scope, ["target", "label", "decimal"], {
              prunePaths: [["target", "label"], ["target"]]
            });
          }
          if (normalizedValue === null) {
            return false;
          }
          return this._write(scope, ["target", "label", "decimal"], normalizedValue, {
            prunePaths: [["target", "label"], ["target"]]
          });
        }
        _getTargetAboveFillColorValue(scope) {
          var _a, _b;
          return (_b = (_a = this.context.read(scope, ["target", "when_exceeded", "fill_color"])) != null ? _a : this.context.read(scope, ["above_target_color"])) != null ? _b : "";
        }
        _getTargetAboveFillDraftKey(scope = { type: "card" }) {
          return (scope == null ? void 0 : scope.type) === "entity" ? `entity:${scope.index}` : "card";
        }
        _setTargetAboveFillDraft(scope, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          const key = this._getTargetAboveFillDraftKey(scope);
          if (normalizedValue) {
            this._targetAboveFillDrafts.set(key, normalizedValue);
          } else {
            this._targetAboveFillDrafts.delete(key);
          }
        }
        _getTargetAboveFillDraft(scope) {
          var _a;
          return (_a = this._targetAboveFillDrafts.get(this._getTargetAboveFillDraftKey(scope))) != null ? _a : "";
        }
        _getEffectiveTargetAboveFillColorValue(scope) {
          return this._effectiveDisplay(scope, ["target", "when_exceeded", "fill_color"], [["above_target_color"]]);
        }
        _setTargetAboveFillColor(scope, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          this._setTargetAboveFillDraft(scope, normalizedValue);
          if (!this._isTargetAboveFillEnabled(scope)) {
            return false;
          }
          if (!normalizedValue) {
            return this._remove(scope, ["target", "when_exceeded", "fill_color"], {
              deprecatedKeys: [["above_target_color"]],
              prunePaths: [["target", "when_exceeded"], ["target"]]
            });
          }
          return this._setText(scope, ["target", "when_exceeded", "fill_color"], normalizedValue, {
            deprecatedKeys: [["above_target_color"]],
            prunePaths: [["target", "when_exceeded"], ["target"]]
          });
        }
        _isTargetAboveFillEnabled(scope) {
          return !!normalizeTextValue(this._getTargetAboveFillColorValue(scope)).trim();
        }
        _setTargetAboveFillEnabled(scope, value) {
          const currentValue = normalizeEditorColorValue(this._getTargetAboveFillColorValue(scope), this.options.cssText);
          if (!value) {
            if (currentValue) {
              this._setTargetAboveFillDraft(scope, currentValue);
            }
            return this._remove(scope, ["target", "when_exceeded", "fill_color"], {
              deprecatedKeys: [["above_target_color"]],
              prunePaths: [["target", "when_exceeded"], ["target"]]
            });
          }
          const nextValue = this._getTargetAboveFillDraft(scope) || normalizeEditorColorValue(this._getEffectiveTargetAboveFillColorValue(scope), this.options.cssText) || currentValue || "#000000";
          return this._setText(scope, ["target", "when_exceeded", "fill_color"], nextValue, {
            deprecatedKeys: [["above_target_color"]],
            prunePaths: [["target", "when_exceeded"], ["target"]]
          });
        }
        _hasTargetOverride(scope) {
          const targetValue = this.context.read(scope, ["target"]);
          if (isObject(targetValue) && Object.keys(targetValue).length) {
            return true;
          }
          if (!isObject(targetValue) && targetValue !== void 0 && targetValue !== null && targetValue !== "") {
            return true;
          }
          return ["target_entity", "target_color", "show_target_label", "above_target_color"].some((key) => {
            const value = this.context.read(scope, [key]);
            return value !== void 0 && value !== null && value !== "" && value !== false;
          }) || this._getTargetLabelDecimalValue(scope) !== "";
        }
        _getTargetOverrideSummary(scope) {
          const mode = this._getTargetMode(scope);
          if (mode === "disabled") return "Disabled";
          const parts = [];
          const target = this._getTargetResolvableValue(scope);
          if (target.fixed !== "" && target.fixed !== void 0) parts.push(`Target ${target.fixed}`);
          if (target.entity) parts.push("Entity");
          if (this._hasTargetShape(scope)) {
            parts.push(this._getEffectiveTargetShapeValue(scope) === "triangle" ? "Triangle" : "Diamond");
          }
          if (this._hasCustomTargetColor(scope)) parts.push("Custom color");
          if (this._getTargetLabelShowValue(scope)) parts.push("Label");
          const labelDecimal = this._getTargetLabelDecimalValue(scope);
          if (labelDecimal !== "") parts.push(`Label ${labelDecimal} ${Number(labelDecimal) === 1 ? "decimal" : "decimals"}`);
          if (this._getTargetAboveFillColorValue(scope)) parts.push("Above");
          return parts.length ? parts.join(" \u2022 ") : "Inherited";
        }
        _write(scope, path, value, options = {}) {
          var _a;
          return this.context.mutate(scope, (target) => {
            var _a2, _b;
            let next = value === void 0 ? deletePathValue(target, path) : setPathValue(target, path, value);
            next = removePathsFromTarget(next, (_a2 = options.deprecatedKeys) != null ? _a2 : []);
            for (const prunePath of (_b = options.prunePaths) != null ? _b : []) next = pruneEmptyObjectsInTarget(next, prunePath);
            return next;
          }, { ...options, targetEdit: { path: path.slice(1), value, deprecatedKeys: (_a = options.deprecatedKeys) != null ? _a : [] } });
        }
        _remove(scope, path, options) {
          return this._write(scope, path, void 0, options);
        }
        _setText(scope, path, rawValue, options) {
          return this._write(scope, path, normalizeEditorColorValue(rawValue, this.options.cssText) || void 0, options);
        }
        _effectiveDisplay(scope, path, fallbacks) {
          return getEffectiveDisplayValue(this.context, scope, path, fallbacks);
        }
        _getEffectiveMarkerDirection(scope, key) {
          return getEffectiveMarkerDirection(this.context, scope, key);
        }
        _setMarkerDirection(scope, key, value) {
          return setMarkerDirection(this.context, scope, key, value);
        }
        _getBuiltinMarkerLabelOptions(scope, key) {
          return getBuiltinMarkerLabelOptions(this.context, scope, key, this._getEffectiveTargetLabelShowValue(scope));
        }
        _renderBuiltinMarkerLabelControls(scope, key, title) {
          return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key));
        }
        _setBuiltinMarkerLabelField(scope, key, field, value) {
          return setBuiltinMarkerLabelField(this.context, scope, key, field, value);
        }
        handleField({ field, kind, index, value }) {
          const scope = (kind == null ? void 0 : kind.startsWith("entity-")) ? { type: "entity", index: Number(index) } : { type: "card" };
          const control = field != null ? field : kind == null ? void 0 : kind.replace(/^entity-/, "");
          if (this._handlePercentageField(control, value, scope)) return true;
          if (control === "target-inherit") {
            if (value) this._clearTargetOverride(scope);
            return true;
          }
          if (control === "target-mode") {
            this._setTargetMode(scope, value);
            return true;
          }
          if (control === "target-value") {
            this._setTargetResolvablePart(scope, "fixed", value);
            return true;
          }
          if (control === "target-entity-source") {
            this._setTargetResolvablePart(scope, "entity", value);
            return true;
          }
          if (control === "target-shape") {
            this._setTargetShape(scope, value);
            return true;
          }
          if (control === "target-direction") {
            this._setMarkerDirection(scope, "target", value);
            return true;
          }
          if (control === "target-color") {
            this._setTargetColor(scope, value);
            return true;
          }
          const label = control == null ? void 0 : control.match(/^target-label-(show|text|show-value|show-unit|precision)$/);
          if (label) {
            const option = label[1];
            this._setBuiltinMarkerLabelField(scope, "target", option === "show-value" ? "showValue" : option === "show-unit" ? "showUnit" : option, value);
            return true;
          }
          if (control === "target-above-fill-enabled") {
            this._setTargetAboveFillEnabled(scope, value);
            return true;
          }
          if (control === "target-above-fill-color") {
            this._setTargetAboveFillColor(scope, value);
            return true;
          }
          return false;
        }
        handleClick(target) {
          var _a;
          if (this.options.percentSources && ((_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.action) === "target-clear-percent") {
            this._percentageDraft = void 0;
            this.context.setSource({ type: "card" }, "target", "percent", null);
            return true;
          }
          return false;
        }
        render(scope = { type: "card" }) {
          var _a, _b;
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const targetInherited = !this._hasTargetOverride(scope);
            const targetParts = this._getEffectiveTargetResolvableValue(scope);
            const targetMode2 = this._getEffectiveTargetMode(scope);
            const targetShape2 = this._getEffectiveTargetShapeValue(scope);
            const targetDirection2 = this._getEffectiveMarkerDirection(scope, "target");
            return `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-inherit" type="checkbox" data-kind="entity-target-inherit" data-index="${index}"${targetInherited ? " checked" : ""}>
                          <label for="entity-${index}-target-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-mode">Target mode</label>
	                        <select id="entity-${index}-target-mode" data-kind="entity-target-mode" data-index="${index}" value="${escapeAttribute(targetMode2)}">
                          <option value="enabled"${targetMode2 === "enabled" ? " selected" : ""}>enabled</option>
                          <option value="disabled"${targetMode2 === "disabled" ? " selected" : ""}>disabled</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-value">Target fallback</label>
                        <input id="entity-${index}-target-value" type="number" step="any" data-kind="entity-target-value" data-index="${index}" value="${escapeAttribute(targetParts.fixed)}" placeholder="inherit card default">
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-shape">Target shape</label>
                        <select id="entity-${index}-target-shape" data-kind="entity-target-shape" data-index="${index}" value="${escapeAttribute(targetShape2)}">
                          <option value="diamond"${targetShape2 === "diamond" ? " selected" : ""}>diamond</option>
                          <option value="triangle"${targetShape2 === "triangle" ? " selected" : ""}>triangle</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-direction">Direction</label>
                        <select id="entity-${index}-target-direction" data-kind="entity-target-direction" data-index="${index}" value="${targetDirection2}">
                          <option value="inward"${targetDirection2 === "inward" ? " selected" : ""}>Inward</option>
                          <option value="outward"${targetDirection2 === "outward" ? " selected" : ""}>Outward</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label>Target entity</label>
                        ${renderEntitySourceInput("entity-target-entity-source", index, targetParts.entity, "inherit card default")}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-target-color">Target color</label>
                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Target color",
              id: `entity-${index}-target-color`,
              kind: "entity-target-color",
              index,
              value: this._getEffectiveTargetColorValue(scope),
              fallbackHex: "#888",
              placeholder: "inherit card default"
            })}
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(scope, "target", "Target")}
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-target-above-fill-enabled" type="checkbox" data-kind="entity-target-above-fill-enabled" data-index="${index}"${this._isTargetAboveFillEnabled(scope) ? " checked" : ""}>
	                          <label for="entity-${index}-target-above-fill-enabled">Above-target color enabled</label>
	                        </div>
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-target-above-fill">Above-target color</label>
	                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Target color",
              id: `entity-${index}-target-above-fill`,
              kind: "entity-target-above-fill-color",
              index,
              value: this._getEffectiveTargetAboveFillColorValue(scope),
              fallbackHex: "#000000",
              placeholder: "inherit card default"
            })}
	                      </div>
	                          `;
          }
          const target = this._getTargetResolvableValue(scope);
          const targetMode = this._getTargetMode(scope);
          const targetShape = this._getEffectiveTargetShapeValue(scope);
          const targetDirection = this._getEffectiveMarkerDirection(scope, "target");
          const targetColor = this._getTargetColorValue(scope);
          const targetAboveFillColor = this._getTargetAboveFillColorValue(scope);
          return `
            <div class="field-grid">
            <div class="field-row">
              <label for="target-mode">Target mode</label>
              <select id="target-mode" data-field="target-mode" value="${escapeAttribute(targetMode)}">
                <option value="auto"${targetMode === "auto" ? " selected" : ""}>auto</option>
                <option value="enabled"${targetMode === "enabled" ? " selected" : ""}>enabled</option>
                <option value="disabled"${targetMode === "disabled" ? " selected" : ""}>disabled</option>
              </select>
            </div>
            ${this.options.percentSources ? renderMarkerPercentageControls("target", this._getSourceMode(), (_b = (_a = this._percentageDraft) != null ? _a : target.percent) != null ? _b : "") : ""}<div class="field-row">
              <label for="target-value">Target fallback</label>
              <input id="target-value" type="number" step="any" data-field="target-value" value="${escapeAttribute(target.fixed)}">
            </div>
            <div class="field-row">
              <label for="target-shape">Target shape</label>
              <select id="target-shape" data-field="target-shape" value="${escapeAttribute(targetShape)}">
                <option value="diamond"${targetShape === "diamond" ? " selected" : ""}>diamond</option>
                <option value="triangle"${targetShape === "triangle" ? " selected" : ""}>triangle</option>
              </select>
            </div>
            <div class="field-row">
              <label for="target-direction">Direction</label>
              <select id="target-direction" data-field="target-direction" value="${targetDirection}">
                <option value="inward"${targetDirection === "inward" ? " selected" : ""}>Inward</option>
                <option value="outward"${targetDirection === "outward" ? " selected" : ""}>Outward</option>
              </select>
            </div>
            <div class="field-row">
              <label>Target entity</label>
              ${renderEntitySourceInput("target-entity-source", "card", target.entity)}
            </div>
            <div class="field-row">
              <label for="target-color">Target color</label>
              ${renderColorInput({
            cssText: this.options.cssText,
            label: "Target color",
            id: "target-color",
            field: "target-color",
            value: targetColor,
            fallbackHex: "#888",
            placeholder: "#888"
          })}
            </div>
            ${this._renderBuiltinMarkerLabelControls({ type: "card" }, "target", "Target")}
            <div class="field-row">
              <div class="toggle">
                <input id="target-above-fill-enabled" type="checkbox" data-field="target-above-fill-enabled"${this._isTargetAboveFillEnabled({ type: "card" }) ? " checked" : ""}>
                <label for="target-above-fill-enabled">Above-target color enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="target-above-fill-color">Above-target color</label>
              ${renderColorInput({
            cssText: this.options.cssText,
            label: "Target color",
            id: "target-above-fill-color",
            field: "target-above-fill-color",
            value: targetAboveFillColor,
            fallbackHex: "#000000"
          })}
            </div>
            </div>`;
        }
      };
    }
  });

  // src/editor/sections/extrema.js
  var ExtremaSection;
  var init_extrema2 = __esm({
    "src/editor/sections/extrema.js"() {
      init_editor_config();
      init_editor_controls();
      init_editor_marker_controls();
      ExtremaSection = class {
        constructor(context, options = {}) {
          this.options = options;
          this.context = context;
        }
        _getScopedPeakConfig(scope) {
          var _a, _b;
          const rawPeak = this.context.read(scope, ["peak"]);
          const rawPeakMarker = this.context.read(scope, ["peak_marker"]);
          const rawLegacyShow = this.context.read(scope, ["show_peak"]);
          const rawLegacyColor = this.context.read(scope, ["peak_color"]);
          const defaultColor = "#888";
          let mode = (scope == null ? void 0 : scope.type) === "entity" ? "inherit" : "disabled";
          let color = "";
          if (isObject(rawPeak)) {
            if (rawPeak.enabled === true) {
              mode = "enabled";
            } else if (rawPeak.enabled === false) {
              mode = "disabled";
            }
            color = (_a = rawPeak.color) != null ? _a : color;
          }
          if (isObject(rawPeakMarker)) {
            if (rawPeakMarker.show === true) {
              mode = "enabled";
            } else if (rawPeakMarker.show === false) {
              mode = "disabled";
            } else if ((scope == null ? void 0 : scope.type) !== "entity") {
              mode = "disabled";
            }
            color = (_b = rawPeakMarker.color) != null ? _b : color;
          }
          if (rawLegacyShow === true) {
            mode = "enabled";
          } else if (rawLegacyShow === false) {
            mode = "disabled";
          }
          color = color || rawLegacyColor || "";
          if (color && normalizeColorComparisonValue(color) === normalizeColorComparisonValue(defaultColor)) {
            color = "";
          }
          return { mode, color };
        }
        _getEffectiveScopedPeakConfig(scope) {
          const localPeak = this._getScopedPeakConfig(scope);
          if ((scope == null ? void 0 : scope.type) !== "entity") {
            return localPeak;
          }
          if (!this._hasPeakOverride(scope)) {
            return this._getScopedPeakConfig({ type: "card" });
          }
          const inheritedPeak = this._getScopedPeakConfig({ type: "card" });
          return {
            mode: localPeak.mode === "inherit" ? inheritedPeak.mode : localPeak.mode,
            color: localPeak.color || inheritedPeak.color
          };
        }
        _hasPeakOverride(scope) {
          var _a, _b;
          const peakValue = (_a = this.context.read(scope, ["peak"])) != null ? _a : {};
          if (isObject(peakValue) && (Object.prototype.hasOwnProperty.call(peakValue, "enabled") || Object.prototype.hasOwnProperty.call(peakValue, "color") || Object.prototype.hasOwnProperty.call(peakValue, "reset") || Object.prototype.hasOwnProperty.call(peakValue, "label") || Object.prototype.hasOwnProperty.call(peakValue, "direction"))) {
            return true;
          }
          const peakMarkerValue = (_b = this.context.read(scope, ["peak_marker"])) != null ? _b : {};
          if (isObject(peakMarkerValue) && (Object.prototype.hasOwnProperty.call(peakMarkerValue, "show") || Object.prototype.hasOwnProperty.call(peakMarkerValue, "color") || Object.prototype.hasOwnProperty.call(peakMarkerValue, "direction"))) {
            return true;
          }
          return this.context.read(scope, ["show_peak"]) !== void 0 || this.context.read(scope, ["peak_color"]) !== void 0;
        }
        _getPeakSummary(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasPeakOverride(scope)) return "Inherited";
          const peak = this._getScopedPeakConfig(scope);
          if (peak.mode === "disabled") return peak.color ? "Disabled \u2022 Custom color" : "Disabled";
          if (peak.mode === "enabled") return peak.color ? "Enabled \u2022 Custom color" : "Enabled";
          if (peak.color) return "Custom color";
          return "Inherited";
        }
        _clearPeakOverride(scope) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = deletePathValue(target, ["peak", "enabled"]);
            nextTarget = deletePathValue(nextTarget, ["peak", "color"]);
            nextTarget = deletePathValue(nextTarget, ["peak", "reset"]);
            nextTarget = deletePathValue(nextTarget, ["peak", "label"]);
            nextTarget = deletePathValue(nextTarget, ["peak", "direction"]);
            nextTarget = deletePathValue(nextTarget, ["show_peak"]);
            nextTarget = deletePathValue(nextTarget, ["peak_color"]);
            nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["peak"]);
            return nextTarget;
          }, { rerender: true });
        }
        _setScopedPeakEnabled(scope, value) {
          const boolValue = !!value;
          const defaultColor = "#888";
          return this.context.mutate(scope, (target) => {
            var _a, _b, _c;
            let nextTarget = cloneDeep(target);
            const currentPeak = isObject(getPathValue(nextTarget, ["peak"])) ? cloneDeep(getPathValue(nextTarget, ["peak"])) : {};
            const currentColor = (_c = (_b = (_a = currentPeak.color) != null ? _a : isObject(getPathValue(nextTarget, ["peak_marker"])) ? getPathValue(nextTarget, ["peak_marker", "color"]) : void 0) != null ? _b : getPathValue(nextTarget, ["peak_color"])) != null ? _c : defaultColor;
            if ((scope == null ? void 0 : scope.type) === "entity" || boolValue) {
              currentPeak.enabled = boolValue;
            } else {
              delete currentPeak.enabled;
            }
            if (currentColor && normalizeColorComparisonValue(currentColor) !== normalizeColorComparisonValue(defaultColor)) {
              currentPeak.color = currentColor;
            } else {
              delete currentPeak.color;
            }
            if (Object.keys(currentPeak).length) {
              nextTarget = setPathValue(nextTarget, ["peak"], currentPeak);
            } else {
              nextTarget = deletePathValue(nextTarget, ["peak"]);
            }
            nextTarget = deletePathValue(nextTarget, ["show_peak"]);
            nextTarget = deletePathValue(nextTarget, ["peak_color"]);
            nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["peak"]);
            return nextTarget;
          }, { extremumEdit: { key: "peak", path: ["enabled"], value: boolValue } });
        }
        _setScopedPeakColor(scope, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          const defaultColor = "#888";
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const currentPeak = isObject(getPathValue(nextTarget, ["peak"])) ? cloneDeep(getPathValue(nextTarget, ["peak"])) : {};
            const currentConfig = this._getScopedPeakConfig(scope);
            delete currentPeak.color;
            if (normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor)) {
              currentPeak.color = normalizedValue;
            }
            if ((scope == null ? void 0 : scope.type) === "entity") {
              if (currentConfig.mode === "enabled") currentPeak.enabled = true;
              if (currentConfig.mode === "disabled") currentPeak.enabled = false;
            } else if (currentConfig.mode === "enabled") {
              currentPeak.enabled = true;
            }
            if (Object.keys(currentPeak).length) {
              nextTarget = setPathValue(nextTarget, ["peak"], currentPeak);
            } else {
              nextTarget = deletePathValue(nextTarget, ["peak"]);
            }
            nextTarget = deletePathValue(nextTarget, ["show_peak"]);
            nextTarget = deletePathValue(nextTarget, ["peak_color"]);
            nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            nextTarget = pruneEmptyObjectsInTarget(nextTarget, ["peak"]);
            return nextTarget;
          }, { extremumEdit: { key: "peak", path: ["color"], value: normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor) ? normalizedValue : void 0 } });
        }
        _getScopedMarkerExtras(scope, key) {
          var _a, _b, _c, _d;
          const raw = this.context.read(scope, [key]);
          const marker = isObject(raw) ? raw : {};
          const label = isObject(marker.label) ? marker.label : {};
          return {
            reset: Object.prototype.hasOwnProperty.call(marker, "reset") ? normalizeTextValue(marker.reset).trim().toLowerCase() : null,
            labelShow: typeof label.show === "boolean" ? label.show : null,
            labelText: typeof label.text === "string" ? label.text.replace(/\s+/g, " ").trim() : null,
            labelShowValue: typeof label.show_value === "boolean" ? label.show_value : null,
            labelShowUnit: typeof label.show_unit === "boolean" ? label.show_unit : null,
            labelPrecision: ((_a = label.precision) != null ? _a : label.decimal) === void 0 || ((_b = label.precision) != null ? _b : label.decimal) === null || ((_c = label.precision) != null ? _c : label.decimal) === "" ? null : normalizeNumberValue((_d = label.precision) != null ? _d : label.decimal)
          };
        }
        _hasExtremumOverride(scope, key) {
          const marker = this.context.read(scope, [key]);
          if (!isObject(marker)) return false;
          return ["enabled", "color", "reset", "label", "direction"].some((field) => Object.prototype.hasOwnProperty.call(marker, field));
        }
        _getEffectiveMarkerExtras(scope, key) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
          const local = this._getScopedMarkerExtras(scope, key);
          if ((scope == null ? void 0 : scope.type) !== "entity") {
            return {
              reset: (_a = local.reset) != null ? _a : "never",
              labelShow: (_b = local.labelShow) != null ? _b : false,
              labelText: local.labelText,
              labelShowValue: (_c = local.labelShowValue) != null ? _c : true,
              labelShowUnit: (_d = local.labelShowUnit) != null ? _d : true,
              labelPrecision: local.labelPrecision
            };
          }
          const card = this._getScopedMarkerExtras({ type: "card" }, key);
          if (!this._hasExtremumOverride(scope, key)) {
            return {
              reset: (_e = card.reset) != null ? _e : "never",
              labelShow: (_f = card.labelShow) != null ? _f : false,
              labelText: card.labelText,
              labelShowValue: (_g = card.labelShowValue) != null ? _g : true,
              labelShowUnit: (_h = card.labelShowUnit) != null ? _h : true,
              labelPrecision: card.labelPrecision
            };
          }
          return {
            reset: (_j = (_i = local.reset) != null ? _i : card.reset) != null ? _j : "never",
            labelShow: (_l = (_k = local.labelShow) != null ? _k : card.labelShow) != null ? _l : false,
            labelText: Object.prototype.hasOwnProperty.call((_m = this.context.read(scope, [key, "label"])) != null ? _m : {}, "text") ? local.labelText : card.labelText,
            labelShowValue: (_o = (_n = local.labelShowValue) != null ? _n : card.labelShowValue) != null ? _o : true,
            labelShowUnit: (_q = (_p = local.labelShowUnit) != null ? _p : card.labelShowUnit) != null ? _q : true,
            labelPrecision: (_r = local.labelPrecision) != null ? _r : card.labelPrecision
          };
        }
        _getScopedFloorConfig(scope) {
          const raw = this.context.read(scope, ["floor"]);
          const marker = isObject(raw) ? raw : {};
          let mode = (scope == null ? void 0 : scope.type) === "entity" ? "inherit" : "disabled";
          if (marker.enabled === true) mode = "enabled";
          if (marker.enabled === false) mode = "disabled";
          const color = marker.color && normalizeColorComparisonValue(marker.color) !== normalizeColorComparisonValue("#888888") ? marker.color : "";
          return { mode, color };
        }
        _getEffectiveScopedFloorConfig(scope) {
          const local = this._getScopedFloorConfig(scope);
          const extras = this._getEffectiveMarkerExtras(scope, "floor");
          if ((scope == null ? void 0 : scope.type) !== "entity") return { ...local, ...extras };
          if (!this._hasExtremumOverride(scope, "floor")) {
            return { ...this._getScopedFloorConfig({ type: "card" }), ...extras };
          }
          const card = this._getEffectiveScopedFloorConfig({ type: "card" });
          return {
            mode: local.mode === "inherit" ? card.mode : local.mode,
            color: local.color || card.color,
            ...extras
          };
        }
        _getFloorSummary(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasExtremumOverride(scope, "floor")) return "Inherited";
          const floor = this._getEffectiveScopedFloorConfig(scope);
          if (floor.mode === "enabled") return floor.color ? "Enabled \u2022 Custom color" : "Enabled";
          if (floor.color) return "Disabled \u2022 Custom color";
          return "Disabled";
        }
        _getMarkerResetSummary(key) {
          var _a;
          const scope = { type: "card" };
          const marker = key === "peak" ? this._getScopedPeakConfig(scope) : this._getEffectiveScopedFloorConfig(scope);
          const enabled = marker.mode === "enabled";
          const reset = (_a = this._getEffectiveMarkerExtras(scope, key).reset) != null ? _a : "never";
          return `${enabled ? "Enabled" : "Disabled"} \xB7 ${reset === "never" ? "no reset" : `${reset} reset`}`;
        }
        _setScopedExtremumEnabled(scope, key, value) {
          const boolValue = !!value;
          const defaultColor = "#888888";
          return this.context.mutate(scope, (target) => {
            var _a;
            let nextTarget = cloneDeep(target);
            const current = isObject(getPathValue(nextTarget, [key])) ? cloneDeep(getPathValue(nextTarget, [key])) : {};
            const currentColor = (_a = current.color) != null ? _a : defaultColor;
            if ((scope == null ? void 0 : scope.type) === "entity" || boolValue) current.enabled = boolValue;
            else delete current.enabled;
            if (currentColor && normalizeColorComparisonValue(currentColor) !== normalizeColorComparisonValue(defaultColor)) {
              current.color = currentColor;
            } else delete current.color;
            if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
            else nextTarget = deletePathValue(nextTarget, [key]);
            return nextTarget;
          }, { extremumEdit: { key, path: ["enabled"], value: boolValue } });
        }
        _setScopedExtremumColor(scope, key, rawValue) {
          const normalizedValue = normalizeEditorColorValue(rawValue, this.options.cssText);
          const defaultColor = "#888888";
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const current = isObject(getPathValue(nextTarget, [key])) ? cloneDeep(getPathValue(nextTarget, [key])) : {};
            delete current.color;
            if (normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor)) {
              current.color = normalizedValue;
            }
            const mode = this._getScopedFloorConfig(scope).mode;
            if (key === "floor" && ((scope == null ? void 0 : scope.type) === "entity" && mode !== "inherit" || (scope == null ? void 0 : scope.type) !== "entity" && mode === "enabled")) {
              current.enabled = mode === "enabled";
            }
            if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
            else nextTarget = deletePathValue(nextTarget, [key]);
            if (key === "peak") {
              nextTarget = deletePathValue(nextTarget, ["show_peak"]);
              nextTarget = deletePathValue(nextTarget, ["peak_color"]);
              nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            }
            return nextTarget;
          }, { extremumEdit: { key, path: ["color"], value: normalizedValue && normalizeColorComparisonValue(normalizedValue) !== normalizeColorComparisonValue(defaultColor) ? normalizedValue : void 0 } });
        }
        _setScopedExtremumReset(scope, key, value) {
          const normalized = normalizeTextValue(value).trim().toLowerCase();
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const current = isObject(getPathValue(nextTarget, [key])) ? cloneDeep(getPathValue(nextTarget, [key])) : {};
            if (normalized && ((scope == null ? void 0 : scope.type) === "entity" || normalized !== "never")) current.reset = normalized;
            else delete current.reset;
            if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
            else nextTarget = deletePathValue(nextTarget, [key]);
            if (key === "peak") {
              nextTarget = deletePathValue(nextTarget, ["show_peak"]);
              nextTarget = deletePathValue(nextTarget, ["peak_color"]);
              nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            }
            return nextTarget;
          }, { extremumEdit: { key, path: ["reset"], value: normalized } });
        }
        _setScopedExtremumLabelShow(scope, key, value) {
          const enabled = !!value;
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const current = isObject(getPathValue(nextTarget, [key])) ? cloneDeep(getPathValue(nextTarget, [key])) : {};
            const label = isObject(current.label) ? cloneDeep(current.label) : {};
            if ((scope == null ? void 0 : scope.type) === "entity" || enabled) label.show = enabled;
            else delete label.show;
            if (Object.keys(label).length) current.label = label;
            else delete current.label;
            if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
            else nextTarget = deletePathValue(nextTarget, [key]);
            if (key === "peak") {
              nextTarget = deletePathValue(nextTarget, ["show_peak"]);
              nextTarget = deletePathValue(nextTarget, ["peak_color"]);
              nextTarget = deletePathValue(nextTarget, ["peak_marker"]);
            }
            return nextTarget;
          }, { extremumEdit: { key, path: ["label", "show"], value: enabled } });
        }
        _setScopedExtremumLabelDecimal(scope, key, value) {
          const decimal = normalizeNumberValue(value);
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const current = isObject(getPathValue(nextTarget, [key])) ? cloneDeep(getPathValue(nextTarget, [key])) : {};
            const label = isObject(current.label) ? cloneDeep(current.label) : {};
            if (decimal !== null) label.decimal = decimal;
            else delete label.decimal;
            if (Object.keys(label).length) current.label = label;
            else delete current.label;
            if (Object.keys(current).length) nextTarget = setPathValue(nextTarget, [key], current);
            else nextTarget = deletePathValue(nextTarget, [key]);
            return nextTarget;
          }, { extremumEdit: { key, path: ["label", "decimal"], value: decimal } });
        }
        _clearFloorOverride(scope) {
          return this.context.mutate(scope, (target) => {
            let nextTarget = cloneDeep(target);
            const floor = isObject(getPathValue(nextTarget, ["floor"])) ? cloneDeep(getPathValue(nextTarget, ["floor"])) : {};
            ["enabled", "color", "reset", "label", "direction"].forEach((key) => delete floor[key]);
            if (Object.keys(floor).length) nextTarget = setPathValue(nextTarget, ["floor"], floor);
            else nextTarget = deletePathValue(nextTarget, ["floor"]);
            nextTarget = deletePathValue(nextTarget, ["floor_marker"]);
            return nextTarget;
          }, { rerender: true });
        }
        _setPeakShow(value) {
          return this._setScopedPeakEnabled({ type: "card" }, value);
        }
        _getPeakShowValue() {
          return this._getScopedPeakConfig({ type: "card" }).mode === "enabled";
        }
        _getMarkerConfig(scope, key) {
          return key === "peak" ? this._getEffectiveScopedPeakConfig(scope) : this._getEffectiveScopedFloorConfig(scope);
        }
        _getBuiltinMarkerLabelOptions(scope, key) {
          return getBuiltinMarkerLabelOptions(this.context, scope, key, this._getEffectiveMarkerExtras(scope, key).labelShow);
        }
        _renderBuiltinMarkerLabelControls(scope, key, title) {
          return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key));
        }
        _getEffectiveMarkerDirection(scope, key) {
          return getEffectiveMarkerDirection(this.context, scope, key);
        }
        render(scope = { type: "card" }, key = "peak") {
          const title = key === "peak" ? "Peak" : "Floor";
          const defaultColor = key === "peak" ? "#888" : "#888888";
          const marker = { ...this._getMarkerConfig(scope, key), ...this._getEffectiveMarkerExtras(scope, key) };
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const index = scope.index;
            const inherited = !(key === "peak" ? this._hasPeakOverride(scope) : this._hasExtremumOverride(scope, key));
            const indent = key === "peak" ? "	" : "";
            return `
${indent}                      <div class="field-row">
${indent}                        <div class="toggle">
${indent}                          <input id="entity-${index}-${key}-inherit" type="checkbox" data-kind="entity-${key}-inherit" data-index="${index}"${inherited ? " checked" : ""}>
                          <label for="entity-${index}-${key}-inherit">Inherit card settings</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <div class="toggle">
                          <input id="entity-${index}-${key}-enabled" type="checkbox" data-kind="entity-${key}-enabled" data-index="${index}"${marker.mode === "enabled" ? " checked" : ""}>
                          <label for="entity-${index}-${key}-enabled">${title} enabled</label>
                        </div>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-color">${title} color</label>
                        ${renderColorInput({
              cssText: this.options.cssText,
              label: "Marker color",
              id: `entity-${index}-${key}-color`,
              kind: `entity-${key}-color`,
              index,
              value: marker.color,
              fallbackHex: defaultColor,
              placeholder: "inherit card default"
            })}
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-reset">${title} reset</label>
                        <select id="entity-${index}-${key}-reset" data-kind="entity-${key}-reset" data-index="${index}" value="${escapeAttribute(marker.reset)}">
                          ${renderResetOptions(marker.reset)}
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-${key}-direction">Direction</label>
                        <select id="entity-${index}-${key}-direction" data-kind="entity-${key}-direction" data-index="${index}" value="${this._getEffectiveMarkerDirection(scope, key)}">
                          <option value="inward"${this._getEffectiveMarkerDirection(scope, key) === "inward" ? " selected" : ""}>Inward</option>
                          <option value="outward"${this._getEffectiveMarkerDirection(scope, key) === "outward" ? " selected" : ""}>Outward</option>
                        </select>
                      </div>
                      ${this._renderBuiltinMarkerLabelControls(scope, key, title)}
${indent}                          `;
          }
          return `
            <div class="field-grid">
            <div class="field-row">
              <div class="toggle">
                <input id="${key}-show" type="checkbox" data-field="${key}-show"${marker.mode === "enabled" ? " checked" : ""}>
                <label for="${key}-show">${title} enabled</label>
              </div>
            </div>
            <div class="field-row">
              <label for="${key}-color">${title} color</label>
              ${renderColorInput({
            cssText: this.options.cssText,
            label: "Marker color",
            id: `${key}-color`,
            field: `${key}-color`,
            value: marker.color,
            fallbackHex: defaultColor,
            placeholder: defaultColor
          })}
            </div>
            <div class="field-row">
              <label for="${key}-reset">${title} reset</label>
              <select id="${key}-reset" data-field="${key}-reset" value="${escapeAttribute(marker.reset)}">
                ${renderResetOptions(marker.reset)}
              </select>
            </div>
            <div class="field-row">
              <label for="${key}-direction">Direction</label>
              <select id="${key}-direction" data-field="${key}-direction" value="${this._getEffectiveMarkerDirection({ type: "card" }, key)}">
                <option value="inward"${this._getEffectiveMarkerDirection({ type: "card" }, key) === "inward" ? " selected" : ""}>Inward</option>
                <option value="outward"${this._getEffectiveMarkerDirection({ type: "card" }, key) === "outward" ? " selected" : ""}>Outward</option>
              </select>
            </div>
            ${this._renderBuiltinMarkerLabelControls({ type: "card" }, key, title)}
            </div>`;
        }
        handleField({ field, kind, index, value }) {
          const scope = (kind == null ? void 0 : kind.startsWith("entity-")) ? { type: "entity", index: Number(index) } : { type: "card" };
          const control = field != null ? field : kind == null ? void 0 : kind.replace(/^entity-/, "");
          const match = control == null ? void 0 : control.match(/^(peak|floor)-(.*)$/);
          if (!match) return false;
          const [, key, option] = match;
          if (option === "inherit") {
            if (value) key === "peak" ? this._clearPeakOverride(scope) : this._clearFloorOverride(scope);
            return true;
          }
          if (option === "show" || option === "enabled") {
            key === "peak" ? this._setScopedPeakEnabled(scope, value) : this._setScopedExtremumEnabled(scope, key, value);
            return true;
          }
          if (option === "color") {
            key === "peak" ? this._setScopedPeakColor(scope, value) : this._setScopedExtremumColor(scope, key, value);
            return true;
          }
          if (option === "reset") {
            this._setScopedExtremumReset(scope, key, value);
            return true;
          }
          if (option === "direction") {
            setMarkerDirection(this.context, scope, key, value);
            return true;
          }
          const label = option.match(/^label-(show|text|show-value|show-unit|precision)$/);
          if (label) {
            const name = label[1];
            setBuiltinMarkerLabelField(this.context, scope, key, name === "show-value" ? "showValue" : name === "show-unit" ? "showUnit" : name, value);
            return true;
          }
          return false;
        }
      };
    }
  });

  // src/editor/sections/reference-markers.js
  function getReferenceMarkerSource(marker) {
    var _a, _b, _c;
    const at = marker == null ? void 0 : marker.at;
    if (typeof at === "string" && /^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s*$/.test(at)) {
      return { mode: "percent", percent: at.replace(/%/g, "").trim() };
    }
    if (typeof at === "string" && /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(at.trim())) {
      return { mode: "entity", entity: at.trim(), fixed: "" };
    }
    const source = isObject(at) ? at : {};
    if (Object.prototype.hasOwnProperty.call(source, "entity")) {
      return {
        mode: source.fixed !== void 0 && source.fixed !== null && source.fixed !== "" ? "entity-fallback" : "entity",
        entity: (_a = source.entity) != null ? _a : "",
        fixed: (_b = source.fixed) != null ? _b : ""
      };
    }
    return { mode: "fixed", fixed: (_c = source.fixed) != null ? _c : "" };
  }
  var ReferenceMarkersSection;
  var init_reference_markers = __esm({
    "src/editor/sections/reference-markers.js"() {
      init_normalize();
      init_editor_config();
      init_editor_controls();
      init_editor_marker_controls();
      ReferenceMarkersSection = class {
        constructor(context, ui, options = {}) {
          this.options = options;
          this.context = context;
          this.ui = ui;
          this._genericMarkerUiIds = /* @__PURE__ */ new Map();
          this._expandedGenericMarkerUiIds = /* @__PURE__ */ new Set();
          this._nextGenericMarkerUiId = 0;
        }
        reset() {
          this._genericMarkerUiIds.clear();
          this._expandedGenericMarkerUiIds.clear();
        }
        _getShadowElementById(id) {
          var _a, _b, _c, _d;
          return (_d = (_b = (_a = this.ui.root()) == null ? void 0 : _a.getElementById) == null ? void 0 : _b.call(_a, id)) != null ? _d : (_c = this.ui.root()) == null ? void 0 : _c.querySelector(`#${id}`);
        }
        render(scope = { type: "card" }) {
          return this._renderGenericMarkersEditor(scope);
        }
        _hasMarkersOverride(scope) {
          return (scope == null ? void 0 : scope.type) === "entity" && this.context.read(scope, ["markers"]) !== void 0;
        }
        _getGenericMarkers(scope, effective = true) {
          const local = this.context.read(scope, ["markers"]);
          if ((scope == null ? void 0 : scope.type) === "entity" && local === void 0 && effective) {
            const cardMarkers = this.context.read({ type: "card" }, ["markers"]);
            return Array.isArray(cardMarkers) ? cloneDeep(cardMarkers) : [];
          }
          return Array.isArray(local) ? cloneDeep(local) : [];
        }
        _getGenericMarkersSummary(scope) {
          if ((scope == null ? void 0 : scope.type) === "entity" && !this._hasMarkersOverride(scope)) return "Inherited";
          const count = this._getGenericMarkers(scope, false).length;
          return count === 0 ? "No reference markers" : `${count} reference marker${count === 1 ? "" : "s"}`;
        }
        _getGenericMarkerScopeKey(scope) {
          return (scope == null ? void 0 : scope.type) === "entity" ? `entity:${scope.index}` : "card";
        }
        _getGenericMarkerUiIds(scope, count) {
          var _a;
          const key = this._getGenericMarkerScopeKey(scope);
          const ids = (_a = this._genericMarkerUiIds.get(key)) != null ? _a : [];
          while (ids.length < count) {
            ids.push(`marker-${++this._nextGenericMarkerUiId}`);
          }
          ids.length = count;
          this._genericMarkerUiIds.set(key, ids);
          return ids;
        }
        _resetGenericMarkerUiScope(scope) {
          var _a;
          const key = this._getGenericMarkerScopeKey(scope);
          const ids = (_a = this._genericMarkerUiIds.get(key)) != null ? _a : [];
          ids.forEach((id) => this._expandedGenericMarkerUiIds.delete(id));
          this._genericMarkerUiIds.delete(key);
        }
        _getGenericMarkerSummary(marker) {
          var _a;
          const source = this._getGenericMarkerSource(marker);
          const lane = (marker == null ? void 0 : marker.lane) === "above" ? "Above" : "Below";
          const shape = (_a = marker == null ? void 0 : marker.shape) != null ? _a : "circle";
          let sourceSummary;
          if (source.mode === "percent") {
            sourceSummary = source.percent === "" ? "Percentage" : `${source.percent}%`;
          } else if (source.mode === "entity" || source.mode === "entity-fallback") {
            sourceSummary = source.entity || "Entity";
          } else {
            sourceSummary = source.fixed === "" ? "Fixed value" : String(source.fixed);
          }
          return `${lane} \xB7 ${shape.charAt(0).toUpperCase()}${shape.slice(1)} \xB7 ${sourceSummary}`;
        }
        _refreshGenericMarkerSummary(scope, markerIndex) {
          const markers = this._getGenericMarkers(scope);
          const marker = markers[markerIndex];
          const uiId = this._getGenericMarkerUiIds(scope, markers.length)[markerIndex];
          const summary = this._getShadowElementById(`generic-${uiId}-summary`);
          if (marker && summary) {
            const text = this._getGenericMarkerSummary(marker);
            summary.textContent = text;
            summary.setAttribute("title", text);
          }
        }
        _getGenericMarkerSource(marker) {
          return this.context.source({ type: "card" }, { type: "reference-marker", marker });
        }
        _renderGenericMarkersEditor(scope) {
          const scopeType = scope.type;
          const scopeIndex = scopeType === "entity" ? scope.index : "card";
          const markers = this._getGenericMarkers(scope);
          const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
          const override = this._hasMarkersOverride(scope);
          const rows = markers.map((marker, markerIndex) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
            const source = this._getGenericMarkerSource(marker);
            const markerUiId = markerUiIds[markerIndex];
            const rowId = `${scopeType}-${scopeIndex}-generic-${markerUiId}`;
            const expanded = this._expandedGenericMarkerUiIds.has(markerUiId);
            const entitySource = source.mode === "entity" || source.mode === "entity-fallback" ? renderEntitySourceInput("generic-marker-entity", scopeIndex, source.entity, "sensor.reference", {
              "scope-type": scopeType,
              "marker-index": markerIndex
            }) : "";
            const labelEntitySource = renderEntitySourceInput(
              "generic-marker-label-entity",
              scopeIndex,
              (_b = (_a = marker == null ? void 0 : marker.label) == null ? void 0 : _a.entity) != null ? _b : "",
              "sensor.information",
              {
                "scope-type": scopeType,
                "marker-index": markerIndex
              }
            );
            return `
        <div class="generic-marker-item" data-marker-ui-id="${markerUiId}" data-expanded="${expanded ? "true" : "false"}">
          <div class="generic-marker-header">
            <button type="button" class="generic-marker-toggle" data-action="toggle-generic-marker" data-marker-ui-id="${markerUiId}" aria-expanded="${expanded ? "true" : "false"}">
              <span class="generic-marker-title">Reference marker ${markerIndex + 1}</span>
              <span id="generic-${markerUiId}-summary" class="generic-marker-summary" title="${escapeAttribute(this._getGenericMarkerSummary(marker))}">${escapeAttribute(this._getGenericMarkerSummary(marker))}</span>
            </button>
            <div class="generic-marker-actions">
              <button type="button" data-action="move-generic-marker-up" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${markerIndex === 0 ? " disabled" : ""} aria-label="Move marker up">\u2191</button>
              <button type="button" data-action="move-generic-marker-down" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${markerIndex === markers.length - 1 ? " disabled" : ""} aria-label="Move marker down">\u2193</button>
              <button type="button" data-action="remove-generic-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" aria-label="Remove marker">Remove</button>
            </div>
          </div>
          <div class="generic-marker-body" style="display:${expanded ? "grid" : "none"};">
            <div class="field-row">
              <label for="${rowId}-source-mode">Source</label>
              <select id="${rowId}-source-mode" data-kind="generic-marker-source-mode" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
              <option value="fixed"${source.mode === "fixed" ? " selected" : ""}>Fixed</option>
              <option value="entity"${source.mode === "entity" ? " selected" : ""}>Entity</option>
              <option value="entity-fallback"${source.mode === "entity-fallback" ? " selected" : ""}>Entity with fixed fallback</option>
              <option value="percent"${source.mode === "percent" ? " selected" : ""}>Percentage</option>
              </select>
            </div>
            ${source.mode === "fixed" ? `
              <div class="field-row">
                <label for="${rowId}-fixed">Fixed value</label>
                <input id="${rowId}-fixed" type="number" step="any" data-kind="generic-marker-fixed" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(source.fixed)}">
              </div>` : ""}
          ${source.mode === "entity" || source.mode === "entity-fallback" ? `
            <div class="field-row">
              <label>Reference marker entity</label>
              ${entitySource}
            </div>` : ""}
          ${source.mode === "entity-fallback" ? `
            <div class="field-row">
              <label for="${rowId}-fallback">Fixed fallback</label>
              <input id="${rowId}-fallback" type="number" step="any" data-kind="generic-marker-fallback" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute(source.fixed)}">
            </div>` : ""}
          ${source.mode === "percent" ? `
            <div class="field-row">
              <label for="${rowId}-percent">Scale percentage</label>
              ${renderScalePercentageInput(`${rowId}-percent`, `data-kind="generic-marker-percent" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"`, source.percent)}
            </div>` : ""}
          <div class="inline-row generic-marker-pair">
            <div class="field-row">
              <label for="${rowId}-lane">Lane</label>
              <select id="${rowId}-lane" data-kind="generic-marker-lane" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
                <option value="above"${(marker == null ? void 0 : marker.lane) === "above" ? " selected" : ""}>Above</option>
                <option value="below"${((_c = marker == null ? void 0 : marker.lane) != null ? _c : "below") === "below" ? " selected" : ""}>Below</option>
              </select>
            </div>
            <div class="field-row">
              <label for="${rowId}-direction">Direction</label>
              <select id="${rowId}-direction" data-kind="generic-marker-direction" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${normalizeMarkerDirection(marker == null ? void 0 : marker.direction)}">
                <option value="inward"${((_d = marker == null ? void 0 : marker.direction) != null ? _d : "inward") === "inward" ? " selected" : ""}>Inward</option>
                <option value="outward"${(marker == null ? void 0 : marker.direction) === "outward" ? " selected" : ""}>Outward</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <label for="${rowId}-shape">Shape</label>
            <select id="${rowId}-shape" data-kind="generic-marker-shape" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}">
              ${["circle", "diamond", "triangle", "chevron", "arrow", "pin"].map((shape) => {
              var _a2;
              return `<option value="${shape}"${((_a2 = marker == null ? void 0 : marker.shape) != null ? _a2 : "circle") === shape ? " selected" : ""}>${shape}</option>`;
            }).join("")}
            </select>
          </div>
          <div class="field-row">
            <label for="${rowId}-color">Color</label>
            ${renderColorInput({
              cssText: this.options.cssText,
              label: "Reference marker color",
              id: `${rowId}-color`,
              kind: "generic-marker-color",
              index: scopeIndex,
              value: (_e = marker == null ? void 0 : marker.color) != null ? _e : "#888888",
              fallbackHex: "#888888",
              placeholder: "#888888",
              extraDataset: { "scope-type": scopeType, "marker-index": markerIndex }
            })}
          </div>
          <div class="field-row"><div class="toggle">
            <input id="${rowId}-show-marker" type="checkbox" data-kind="generic-marker-show-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${(marker == null ? void 0 : marker.show_marker) === false ? "" : " checked"}>
            <label for="${rowId}-show-marker">Show marker shape</label>
          </div></div>
          <div class="field-row"><div class="toggle">
            <input id="${rowId}-label-show" type="checkbox" data-kind="generic-marker-label-show" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${((_f = marker == null ? void 0 : marker.label) == null ? void 0 : _f.show) === true ? " checked" : ""}>
            <label for="${rowId}-label-show">Show label</label>
          </div></div>
          <div class="field-row"><label for="${rowId}-label-text">Label text</label>
            <input id="${rowId}-label-text" type="text" data-kind="generic-marker-label-text" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute((_h = (_g = marker == null ? void 0 : marker.label) == null ? void 0 : _g.text) != null ? _h : "")}" placeholder="optional semantic text">
          </div>
          <div class="field-row">
            <label>Label content entity</label>
            ${labelEntitySource}
          </div>
          <div class="inline-row generic-marker-options">
            <div class="field-row"><div class="toggle">
              <input id="${rowId}-label-show-value" type="checkbox" data-kind="generic-marker-label-show-value" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${((_i = marker == null ? void 0 : marker.label) == null ? void 0 : _i.show_value) === false ? "" : " checked"}>
              <label for="${rowId}-label-show-value">Show value</label>
            </div></div>
            <div class="field-row"><div class="toggle">
              <input id="${rowId}-label-show-unit" type="checkbox" data-kind="generic-marker-label-show-unit" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}"${((_j = marker == null ? void 0 : marker.label) == null ? void 0 : _j.show_unit) === false ? "" : " checked"}>
              <label for="${rowId}-label-show-unit">Show raw unit</label>
            </div></div>
            <div class="field-row generic-marker-precision"><label for="${rowId}-label-precision">Label precision</label>
              <input id="${rowId}-label-precision" type="number" min="0" step="1" data-kind="generic-marker-label-precision" data-scope-type="${scopeType}" data-index="${scopeIndex}" data-marker-index="${markerIndex}" value="${escapeAttribute((_n = (_m = (_k = marker == null ? void 0 : marker.label) == null ? void 0 : _k.precision) != null ? _m : (_l = marker == null ? void 0 : marker.label) == null ? void 0 : _l.decimal) != null ? _n : "")}" placeholder="inherit">
            </div>
          </div>
          </div>
        </div>`;
          }).join("");
          const inheritControl = scopeType === "entity" ? `
      <div class="field-row">
        <div class="toggle">
          <input id="entity-${scopeIndex}-markers-inherit" type="checkbox" data-kind="entity-markers-inherit" data-index="${scopeIndex}"${override ? "" : " checked"}>
          <label for="entity-${scopeIndex}-markers-inherit">Inherit card markers</label>
        </div>
      </div>` : "";
          const overrideNote = scopeType === "entity" && !override ? '<div class="section-note">Enable the override to replace the card marker list. An empty override clears all card markers.</div>' : "";
          return `
      ${inheritControl}
      ${overrideNote}
      ${scopeType === "card" || override ? `
        <div class="section-note">Up to four markers render in each lane, including Peak, Floor, and Target. Excess generic markers remain editable and show a warning. Unresolved markers still reserve a slot and lane.</div>
        <div class="list generic-marker-list">${rows}</div>
        <button type="button" data-action="add-generic-marker" data-scope-type="${scopeType}" data-index="${scopeIndex}">Add reference marker</button>` : ""}
    `;
        }
        _getGenericMarkerScope(target) {
          var _a;
          return ((_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.scopeType) === "entity" ? { type: "entity", index: Number(target.dataset.index) } : { type: "card" };
        }
        _setGenericMarkerList(scope, markers, options = {}) {
          const changed = this.context.mutate(scope, (target) => setPathValue(target, ["markers"], markers), { ...options, rerender: false });
          if (changed && options.rerender) this.ui.render(scope);
          return changed;
        }
        _updateGenericMarker(scope, markerIndex, update, options = {}) {
          var _a;
          const markers = this._getGenericMarkers(scope);
          if (!markers[markerIndex]) return false;
          const marker = isObject(markers[markerIndex]) ? cloneDeep(markers[markerIndex]) : {};
          const nextMarker = (_a = update(marker)) != null ? _a : marker;
          markers[markerIndex] = nextMarker;
          const changed = this._setGenericMarkerList(scope, markers, options);
          if (changed) this._refreshGenericMarkerSummary(scope, markerIndex);
          return changed;
        }
        _setGenericMarkerSourceMode(scope, markerIndex, mode) {
          return this._updateGenericMarker(scope, markerIndex, (marker) => {
            if (mode === "percent") {
              marker.at = "50%";
              return marker;
            }
            const oldAt = isObject(marker.at) ? cloneDeep(marker.at) : {};
            if (mode === "fixed") {
              delete oldAt.entity;
              delete oldAt.percent;
              if (oldAt.fixed === void 0) oldAt.fixed = 50;
            } else {
              delete oldAt.percent;
              if (!oldAt.entity) oldAt.entity = "";
              if (mode === "entity") delete oldAt.fixed;
              if (mode === "entity-fallback" && oldAt.fixed === void 0) oldAt.fixed = 50;
            }
            marker.at = oldAt;
            return marker;
          }, { rerender: true, referenceMarkerEdit: { type: "mode", index: markerIndex, value: mode } });
        }
        _toggleGenericMarkerExpanded(markerUiId) {
          var _a;
          if (this._expandedGenericMarkerUiIds.has(markerUiId)) {
            this._expandedGenericMarkerUiIds.delete(markerUiId);
          } else {
            this._expandedGenericMarkerUiIds.add(markerUiId);
          }
          const row = (_a = this.ui.root()) == null ? void 0 : _a.querySelector(`.generic-marker-item[data-marker-ui-id="${markerUiId}"]`);
          if (row == null ? void 0 : row.querySelector) {
            const expanded = this._expandedGenericMarkerUiIds.has(markerUiId);
            row.setAttribute("data-expanded", String(expanded));
            row.querySelector(".generic-marker-toggle").setAttribute("aria-expanded", String(expanded));
            row.querySelector(".generic-marker-body").style.display = expanded ? "grid" : "none";
          } else this.ui.render();
        }
        // Standalone's historical source writer; Feature supplies its patch-only writer
        // through the existing setSource operation instead.
        _setGenericMarkerSourcePart(scope, markerIndex, part, rawValue) {
          return this._updateGenericMarker(scope, markerIndex, (marker) => {
            var _a;
            const value = part === "entity" ? normalizeTextValue(rawValue).trim() || void 0 : (_a = normalizeNumberValue(rawValue)) != null ? _a : void 0;
            if (part === "percent") {
              marker.at = value === void 0 ? null : `${value}%`;
              return marker;
            }
            const at = isObject(marker.at) ? cloneDeep(marker.at) : {};
            if (value === void 0) delete at[part];
            else at[part] = value;
            marker.at = Object.keys(at).length ? at : null;
            return marker;
          });
        }
        _setGenericMarkerField(scope, markerIndex, kind, value) {
          const field = kind.replace(/^generic-marker-/, "");
          if (field === "source-mode") return this._setGenericMarkerSourceMode(scope, markerIndex, value);
          if (["fixed", "fallback", "entity", "percent"].includes(field)) {
            return this.context.setSource(scope, { type: "reference-marker", index: markerIndex }, field === "fallback" ? "fixed" : field, value);
          }
          let path, normalized;
          if (field === "show-marker") {
            path = ["show_marker"];
            normalized = value === false ? false : void 0;
          } else if (["lane", "shape", "direction"].includes(field)) {
            path = [field];
            normalized = field === "direction" ? normalizeMarkerDirection(value) : value;
          } else if (field === "color") {
            path = ["color"];
            normalized = normalizeEditorColorValue(value, this.options.cssText);
          } else if (field.startsWith("label-")) {
            const labelField = field.slice(6).replace("show-value", "show_value").replace("show-unit", "show_unit");
            if (!["show", "text", "entity", "show_value", "show_unit", "precision"].includes(labelField)) return false;
            path = ["label", labelField];
            normalized = normalizeMarkerLabelField(labelField, value);
            if (["text", "entity"].includes(labelField) && !normalized || normalized === null) normalized = void 0;
          } else return false;
          return this._updateGenericMarker(scope, markerIndex, (marker) => {
            if (path[0] === "label") {
              const label = isObject(marker.label) ? cloneDeep(marker.label) : {};
              if (normalized === void 0) delete label[path[1]];
              else label[path[1]] = normalized;
              if (path[1] === "precision") delete label.decimal;
              marker.label = label;
            } else if (normalized === void 0) delete marker[path[0]];
            else marker[path[0]] = normalized;
            return marker;
          }, { referenceMarkerEdit: { type: "field", index: markerIndex, path, value: normalized } });
        }
        handleField({ target, kind, value }) {
          if (kind === "entity-markers-inherit") {
            const scope = { type: "entity", index: Number(target.dataset.index) };
            this._resetGenericMarkerUiScope(scope);
            if (value) this.context.mutate(scope, (config) => deletePathValue(config, ["markers"]), { rerender: true });
            else this._setGenericMarkerList(scope, this._getGenericMarkers(scope), { rerender: true });
            return true;
          }
          if (!(kind == null ? void 0 : kind.startsWith("generic-marker-"))) return false;
          this._setGenericMarkerField(this._getGenericMarkerScope(target), Number(target.dataset.markerIndex), kind, value);
          return true;
        }
        handleClick(target) {
          var _a;
          const action = (_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.action;
          if (target == null ? void 0 : target.disabled) return false;
          if (action === "toggle-generic-marker") {
            this._toggleGenericMarkerExpanded(target.dataset.markerUiId);
            return true;
          }
          if (action === "add-generic-marker") {
            const scope = this._getGenericMarkerScope(target);
            const markers = this._getGenericMarkers(scope);
            const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
            markers.push({ at: { fixed: 50 } });
            const markerUiId = `marker-${++this._nextGenericMarkerUiId}`;
            markerUiIds.push(markerUiId);
            this._expandedGenericMarkerUiIds.add(markerUiId);
            this._setGenericMarkerList(scope, markers, { rerender: true, referenceMarkerEdit: { type: "add" } });
            return true;
          }
          if (action === "remove-generic-marker" || action === "move-generic-marker-up" || action === "move-generic-marker-down") {
            const scope = this._getGenericMarkerScope(target);
            const markerIndex = Number(target.dataset.markerIndex);
            const markers = this._getGenericMarkers(scope);
            const markerUiIds = this._getGenericMarkerUiIds(scope, markers.length);
            if (action === "remove-generic-marker") {
              markers.splice(markerIndex, 1);
              this._expandedGenericMarkerUiIds.delete(markerUiIds[markerIndex]);
              markerUiIds.splice(markerIndex, 1);
            } else {
              const nextIndex = markerIndex + (action === "move-generic-marker-up" ? -1 : 1);
              if (nextIndex < 0 || nextIndex >= markers.length) return true;
              [markers[markerIndex], markers[nextIndex]] = [markers[nextIndex], markers[markerIndex]];
              [markerUiIds[markerIndex], markerUiIds[nextIndex]] = [markerUiIds[nextIndex], markerUiIds[markerIndex]];
            }
            this._setGenericMarkerList(scope, markers, { rerender: true, referenceMarkerEdit: { type: action === "add-generic-marker" ? "add" : action === "remove-generic-marker" ? "remove" : "move", index: Number(target.dataset.markerIndex), delta: action === "move-generic-marker-up" ? -1 : 1 } });
            return true;
          }
          return false;
        }
        // Reconcile only Reference rows. UI IDs own rows; field routing owns each
        // direct body group. Keep unchanged controls mounted, including Source, so
        // Safari never loses the editing row's viewport anchor during a mode change.
        syncStructure(scope = { type: "card" }) {
          var _a, _b, _c, _d, _e;
          const root2 = this.ui.root();
          const wrapper = root2 == null ? void 0 : root2.querySelector(scope.type === "entity" ? `.entity-shell[data-entity-shell-index="${scope.index}"] .override-group[data-group="markers"]` : '.card-subgroup[data-group="generic-markers"]');
          const list = (_a = wrapper == null ? void 0 : wrapper.querySelector) == null ? void 0 : _a.call(wrapper, ".generic-marker-list");
          if (!(list == null ? void 0 : list.ownerDocument)) return false;
          const markers = this._getGenericMarkers(scope), ids = this._getGenericMarkerUiIds(scope, markers.length);
          const template = list.ownerDocument.createElement("template");
          template.innerHTML = this.render(scope);
          const nextRows = template.content.querySelectorAll(".generic-marker-item");
          const oldRows = new Map(Array.from(list.children, (row) => [row.dataset.markerUiId, row]));
          const active = root2.activeElement;
          const owner = (_b = active == null ? void 0 : active.closest) == null ? void 0 : _b.call(active, ".generic-marker-item");
          const focus = owner && { id: owner.dataset.markerUiId, kind: active.dataset.kind, action: active.dataset.action };
          let cursor = list.firstElementChild;
          for (const next of nextRows) {
            const id = next.dataset.markerUiId;
            const row = (_c = oldRows.get(id)) != null ? _c : next;
            oldRows.delete(id);
            if (row !== next) {
              row.querySelector(".generic-marker-title").textContent = next.querySelector(".generic-marker-title").textContent;
              for (const button of row.querySelectorAll(".generic-marker-actions button")) {
                const updated = next.querySelector(`[data-action="${button.dataset.action}"]`);
                button.dataset.markerIndex = updated.dataset.markerIndex;
                button.disabled = updated.disabled;
              }
              const body = row.querySelector(".generic-marker-body");
              const groupKey = (group) => {
                var _a2;
                return (_a2 = group.querySelector("[data-kind]")) == null ? void 0 : _a2.dataset.kind;
              };
              const groups = new Map(Array.from(body.children, (group) => [groupKey(group), group]));
              let fieldCursor = body.firstElementChild;
              for (const nextGroup of Array.from(next.querySelector(".generic-marker-body").children)) {
                const field = groupKey(nextGroup);
                const group = (_d = groups.get(field)) != null ? _d : nextGroup;
                const oldControl = group.querySelector("[data-kind]"), newControl = nextGroup.querySelector("[data-kind]");
                const mounted = (oldControl == null ? void 0 : oldControl.tagName) === (newControl == null ? void 0 : newControl.tagName) ? group : nextGroup;
                groups.delete(field);
                if (mounted !== fieldCursor) body.insertBefore(mounted, fieldCursor);
                if (mounted !== group) group.remove();
                fieldCursor = mounted.nextElementSibling;
              }
              for (const group of groups.values()) group.remove();
            }
            const index = ids.indexOf(id);
            for (const control of row.querySelectorAll("[data-marker-index]")) control.dataset.markerIndex = String(index);
            const expanded = this._expandedGenericMarkerUiIds.has(id);
            row.setAttribute("data-expanded", String(expanded));
            row.querySelector(".generic-marker-toggle").setAttribute("aria-expanded", String(expanded));
            row.querySelector(".generic-marker-body").style.display = expanded ? "grid" : "none";
            if (row !== cursor) list.insertBefore(row, cursor);
            cursor = row.nextElementSibling;
          }
          for (const row of oldRows.values()) row.remove();
          if (focus && active !== root2.activeElement) {
            const row = list.querySelector(`[data-marker-ui-id="${focus.id}"]`);
            const control = focus.kind ? row == null ? void 0 : row.querySelector(`[data-kind="${focus.kind}"]`) : focus.action ? row == null ? void 0 : row.querySelector(`[data-action="${focus.action}"]`) : null;
            (_e = control == null ? void 0 : control.focus) == null ? void 0 : _e.call(control, { preventScroll: true });
          }
          return true;
        }
        // Hosts call this during their existing synchronization pass. It does not
        // replace nodes, observe DOM or persist display defaults.
        syncControls(hass, replaced = false, scope = { type: "card" }) {
          const root2 = this.ui.root();
          const prefix = `${scope.type}-${scope.type === "entity" ? scope.index : "card"}-generic-`;
          if (!root2) return;
          const markers = this._getGenericMarkers(scope), ids = this._getGenericMarkerUiIds(scope, markers.length);
          markers.forEach((marker, index) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
            const source = this._getGenericMarkerSource(marker), label = (_a = marker == null ? void 0 : marker.label) != null ? _a : {};
            const values = {
              "source-mode": source.mode,
              fixed: (_b = source.fixed) != null ? _b : "",
              fallback: (_c = source.fixed) != null ? _c : "",
              percent: (_d = source.percent) != null ? _d : "",
              lane: (_e = marker == null ? void 0 : marker.lane) != null ? _e : "below",
              shape: (_f = marker == null ? void 0 : marker.shape) != null ? _f : "circle",
              direction: normalizeMarkerDirection(marker == null ? void 0 : marker.direction),
              color: getColorPickerValue(marker == null ? void 0 : marker.color, "#888888"),
              "color-text-fallback": (_g = marker == null ? void 0 : marker.color) != null ? _g : "#888888",
              "label-text": (_h = label.text) != null ? _h : "",
              "label-precision": (_j = (_i = label.precision) != null ? _i : label.decimal) != null ? _j : ""
            };
            for (const [field, value] of Object.entries(values)) {
              const control = root2.querySelector(`#${prefix}${ids[index]}-${field}`);
              if (control && (control !== root2.activeElement || replaced)) control.value = String(value);
            }
            for (const [field, checked] of [
              ["show-marker", (marker == null ? void 0 : marker.show_marker) !== false],
              ["label-show", label.show === true],
              ["label-show-value", label.show_value !== false],
              ["label-show-unit", label.show_unit !== false]
            ]) {
              const control = root2.querySelector(`#${prefix}${ids[index]}-${field}`);
              if (control) control.checked = checked;
            }
            for (const [field, value, title] of [["entity", (_k = source.entity) != null ? _k : "", "Reference marker entity"], ["label-entity", (_l = label.entity) != null ? _l : "", "Label content entity"]]) {
              for (const tag of ["input", "ha-entity-picker"]) for (const control of Array.from(root2.querySelectorAll(`${tag}[data-kind="generic-marker-${field}"]`)).filter((control2) => Number(control2.dataset.markerIndex) === index && control2.dataset.scopeType === scope.type && String(control2.dataset.index) === String(scope.type === "entity" ? scope.index : "card"))) {
                control.id = `${prefix}${ids[index]}-${field}`;
                control.setAttribute("aria-label", title);
                if (control !== root2.activeElement || replaced) control.value = value;
                if (tag === "ha-entity-picker") {
                  control.hass = hass;
                  control.label = title;
                  control.allowCustomEntity = true;
                }
              }
            }
            this._refreshGenericMarkerSummary(scope, index);
          });
        }
      };
    }
  });

  // src/editor/SensorBarCardPlusEditor.js
  var SensorBarCardPlusEditor;
  var init_SensorBarCardPlusEditor = __esm({
    "src/editor/SensorBarCardPlusEditor.js"() {
      init_normalize();
      init_resolve();
      init_editor_config();
      init_editor_controls();
      init_editor_styles();
      init_editor_disclosures();
      init_editor_numeric_drafts();
      init_scale();
      init_formatting();
      init_bar_appearance();
      init_segments();
      init_gradient_stops();
      init_needle();
      init_baseline();
      init_target();
      init_extrema2();
      init_reference_markers();
      init_editor_marker_controls();
      SensorBarCardPlusEditor = class extends HTMLElement {
        get _gradientStopValidationMessages() {
          return this._gradientStopsSection._gradientStopValidationMessages;
        }
        get _gradientStopPosTexts() {
          return this._gradientStopsSection._gradientStopPosTexts;
        }
        get _gradientStopsUiRows() {
          return this._gradientStopsSection._gradientStopsUiRows;
        }
        get _gradientStopsDrafts() {
          return this._gradientStopsSection._gradientStopsDrafts;
        }
        get _segmentBoundaryTexts() {
          return this._segmentsSection._segmentBoundaryTexts;
        }
        get _segmentUiRows() {
          return this._segmentsSection._segmentUiRows;
        }
        get _segmentDrafts() {
          return this._segmentsSection._segmentDrafts;
        }
        get _baselineColorDrafts() {
          return this._baselineSection._baselineColorDrafts;
        }
        get _targetAboveFillDrafts() {
          return this._targetSection._targetAboveFillDrafts;
        }
        get _genericMarkerUiIds() {
          return this._referenceMarkersSection._genericMarkerUiIds;
        }
        get _expandedGenericMarkerUiIds() {
          return this._referenceMarkersSection._expandedGenericMarkerUiIds;
        }
        get _nextGenericMarkerUiId() {
          return this._referenceMarkersSection._nextGenericMarkerUiId;
        }
        set _nextGenericMarkerUiId(value) {
          this._referenceMarkersSection._nextGenericMarkerUiId = value;
        }
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this._segmentsSection = new SegmentsSection(this._createSectionContext(), this._paletteUi(), {
            write: (scope, rows, options) => this._setScopedSegments(scope, rows, options)
          });
          this._gradientStopsSection = new GradientStopsSection(this._createSectionContext(), this._paletteUi(), {
            write: (scope, rows, options) => this._setScopedGradientStops(scope, rows, options)
          });
          this._needleSection = new NeedleSection(this._createSectionContext());
          this._baselineSection = new BaselineSection(this._createSectionContext());
          this._targetSection = new TargetSection(this._createSectionContext());
          this._extremaSection = new ExtremaSection(this._createSectionContext());
          this._referenceMarkersSection = new ReferenceMarkersSection(this._createSectionContext(), {
            ...this._paletteUi(),
            render: (scope = { type: "card" }) => {
              let synced;
              this._isRendering = true;
              try {
                synced = this._referenceMarkersSection.syncStructure(scope);
              } finally {
                this._isRendering = false;
              }
              if (!synced) {
                this._render();
                return;
              }
              this._referenceMarkersSection.syncControls(this._hass, false, scope);
              this._syncEntityPickers();
              this._numericDrafts.apply(this.shadowRoot);
            }
          });
          this._config = {};
          this._numericDrafts = new NumericInputDrafts();
          this._draftConfig = {};
          this._hass = null;
          this._isRendering = false;
          this._renderScheduled = false;
          this._lastRenderedConfigJson = null;
          this._lastEmittedConfigJson = null;
          this._shadowListenersAttached = false;
          this._expandedEntityOverrides = /* @__PURE__ */ new Set();
          this._expandedOverrideGroups = /* @__PURE__ */ new Set();
          this._expandedCardGroups = /* @__PURE__ */ new Set();
          this._targetSection.reset();
          this._baselineSection.reset();
          this._pendingFocusSelector = null;
          this._boundHandleClick = (event) => this._handleClick(event);
          this._boundHandleChange = (event) => this._handleChange(event);
          this._boundHandleInput = (event) => this._handleInput(event);
          this._boundHandleValueChanged = (event) => this._handleValueChanged(event);
          this._boundHandleKeydown = (event) => this._handleKeydown(event);
        }
        setConfig(config) {
          var _a;
          const nextConfig = this._cloneDeep(config != null ? config : {});
          const nextConfigJson = this._serializeConfig(nextConfig);
          const currentConfigJson = this._serializeConfig(this._config);
          const currentDraftJson = this._serializeConfig(this._draftConfig);
          if (nextConfigJson === currentConfigJson) {
            return;
          }
          if (nextConfigJson === currentDraftJson) {
            this._config = nextConfig;
            return;
          }
          if (nextConfigJson === this._lastEmittedConfigJson) {
            this._config = nextConfig;
            return;
          }
          if (this._getEmittedConfigJson(nextConfig) === this._getEmittedConfigJson(this._draftConfig)) {
            this._config = nextConfig;
            return;
          }
          const shouldRender = !((_a = this.shadowRoot) == null ? void 0 : _a.innerHTML) || nextConfigJson !== this._lastRenderedConfigJson;
          this._lastEmittedConfigJson = null;
          this._config = nextConfig;
          this._draftConfig = this._cloneDeep(nextConfig);
          this._segmentsSection.reset();
          this._gradientStopsSection.reset();
          this._targetSection.reset();
          this._baselineSection.reset();
          this._referenceMarkersSection.reset();
          this._numericDrafts.reset();
          if (shouldRender) {
            this._render();
          }
        }
        set hass(hass) {
          var _a;
          this._hass = hass;
          if (!((_a = this.shadowRoot) == null ? void 0 : _a.innerHTML)) {
            this._render();
            return;
          }
          this._syncEntityPickers();
        }
        _cloneContainer(value) {
          return cloneContainer(value);
        }
        _cloneDeep(value) {
          return cloneDeep(value);
        }
        _serializeConfig(value) {
          return serializeConfig(value);
        }
        _getEmittedConfigJson(config) {
          return this._serializeConfig(config);
        }
        _isObject(value) {
          return isObject(value);
        }
        _setPathValue(target, path, value) {
          return setPathValue(target, path, value);
        }
        _deletePathValue(target, path) {
          return deletePathValue(target, path);
        }
        _getPathValue(target, path) {
          return getPathValue(target, path);
        }
        _hasPath(target, path) {
          return hasPath(target, path);
        }
        _normalizeTextValue(value) {
          return normalizeTextValue(value);
        }
        _normalizeOptionalEnabled(value) {
          return normalizeOptionalEnabled2(value);
        }
        _normalizeNumberValue(value) {
          return normalizeNumberValue(value);
        }
        _normalizeDecimalValue(value) {
          return normalizeDecimalValue(value);
        }
        _preferStructuredPath(structuredPath, legacyPath = null) {
          if (this._hasPath(this._draftConfig, structuredPath.slice(0, -1))) {
            return structuredPath;
          }
          if (this._hasPath(this._draftConfig, structuredPath)) {
            return structuredPath;
          }
          if (legacyPath && this._hasPath(this._draftConfig, legacyPath)) {
            return legacyPath;
          }
          return structuredPath;
        }
        _getEntitiesValue() {
          var _a, _b;
          if (Array.isArray(this._draftConfig.entities)) {
            return this._draftConfig.entities.map((entry) => {
              var _a2, _b2, _c;
              return typeof entry === "string" ? { entity: entry } : {
                entity: (_a2 = entry == null ? void 0 : entry.entity) != null ? _a2 : "",
                name: (_b2 = entry == null ? void 0 : entry.name) != null ? _b2 : "",
                icon: (_c = entry == null ? void 0 : entry.icon) != null ? _c : ""
              };
            });
          }
          if (this._draftConfig.entity) {
            return [{
              entity: this._draftConfig.entity,
              name: (_a = this._draftConfig.name) != null ? _a : "",
              icon: (_b = this._draftConfig.icon) != null ? _b : ""
            }];
          }
          return [];
        }
        _getRawEntityRows() {
          if (Array.isArray(this._draftConfig.entities)) {
            return this._cloneDeep(this._draftConfig.entities);
          }
          if (this._draftConfig.entity !== void 0) {
            const hasTopLevelIdentity = this._draftConfig.name !== void 0 || this._draftConfig.icon !== void 0;
            if (!hasTopLevelIdentity) {
              return [this._draftConfig.entity];
            }
            return [{
              entity: this._draftConfig.entity,
              ...this._draftConfig.name !== void 0 ? { name: this._draftConfig.name } : {},
              ...this._draftConfig.icon !== void 0 ? { icon: this._draftConfig.icon } : {}
            }];
          }
          return [];
        }
        _buildEntityConfigEntries(entities) {
          const usesShorthand = !Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== void 0;
          const source = Array.isArray(this._draftConfig.entities) ? this._draftConfig.entities : this._draftConfig.entity !== void 0 ? [{
            entity: this._draftConfig.entity,
            ...this._draftConfig.name !== void 0 ? { name: this._draftConfig.name } : {},
            ...this._draftConfig.icon !== void 0 ? { icon: this._draftConfig.icon } : {}
          }] : [];
          const entries = entities.map((entry, index) => {
            const rawEntry = source[index];
            if (this._isObject(rawEntry)) {
              const mergedEntry = {
                ...rawEntry,
                entity: entry.entity
              };
              const normalizedName2 = this._normalizeTextValue(entry.name).trim();
              if (normalizedName2) {
                mergedEntry.name = normalizedName2;
              } else {
                delete mergedEntry.name;
              }
              const rawIconValue = entry == null ? void 0 : entry.icon;
              const normalizedIcon2 = typeof rawIconValue === "string" ? rawIconValue.trim() : rawIconValue;
              if (normalizedIcon2 === false) {
                mergedEntry.icon = false;
              } else if (typeof normalizedIcon2 === "string" && normalizedIcon2) {
                mergedEntry.icon = normalizedIcon2;
              } else if (rawEntry.icon === false) {
                mergedEntry.icon = false;
              } else {
                delete mergedEntry.icon;
              }
              return mergedEntry;
            }
            const nextEntry = {
              entity: entry.entity
            };
            const normalizedName = this._normalizeTextValue(entry.name).trim();
            if (normalizedName) {
              nextEntry.name = normalizedName;
            }
            const normalizedIcon = typeof (entry == null ? void 0 : entry.icon) === "string" ? entry.icon.trim() : entry == null ? void 0 : entry.icon;
            if (normalizedIcon === false) {
              nextEntry.icon = false;
            } else if (typeof normalizedIcon === "string" && normalizedIcon) {
              nextEntry.icon = normalizedIcon;
            }
            return nextEntry;
          });
          if (!usesShorthand) {
            return entries.map((entry) => {
              if (this._isObject(entry) && Object.keys(entry).length === 1 && entry.entity !== void 0) {
                return entry.entity;
              }
              return entry;
            });
          }
          return entries;
        }
        _updateConfig(nextConfig) {
          this._draftConfig = this._cloneDeep(nextConfig);
        }
        _emitConfigChanged() {
          const emittedConfig = this._cleanupEditorEmittedConfig(this._cloneDeep(this._draftConfig));
          const nextConfigJson = this._serializeConfig(emittedConfig);
          if (nextConfigJson === this._lastEmittedConfigJson) {
            return false;
          }
          this._lastEmittedConfigJson = nextConfigJson;
          this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: emittedConfig },
            bubbles: true,
            composed: true
          }));
          return true;
        }
        _scheduleRender() {
          if (this._renderScheduled || this._isRendering) return;
          this._renderScheduled = true;
          setTimeout(() => {
            this._renderScheduled = false;
            this._render();
          }, 0);
        }
        _applyUserConfig(nextConfig, options = {}) {
          const { rerender = false } = options;
          const nextConfigJson = this._serializeConfig(nextConfig);
          const currentDraftJson = this._serializeConfig(this._draftConfig);
          if (nextConfigJson === currentDraftJson) {
            return false;
          }
          this._updateConfig(nextConfig);
          this._emitConfigChanged();
          this._refreshDerivedEditorUi();
          if (rerender) {
            this._scheduleRender();
          }
          return true;
        }
        _getShadowElementById(id) {
          var _a, _b, _c, _d, _e, _f;
          if (!this.shadowRoot) {
            return null;
          }
          return (_f = (_e = (_b = (_a = this.shadowRoot).getElementById) == null ? void 0 : _b.call(_a, id)) != null ? _e : (_d = (_c = this.shadowRoot).querySelector) == null ? void 0 : _d.call(_c, `#${id}`)) != null ? _f : null;
        }
        _setElementChecked(id, checked) {
          const element = this._getShadowElementById(id);
          if (element) {
            element.checked = !!checked;
          }
        }
        _setElementText(id, value) {
          const element = this._getShadowElementById(id);
          if (element) {
            element.textContent = value;
          }
        }
        _refreshDerivedEditorUi() {
          if (!this.shadowRoot) {
            return;
          }
          this._refreshCardDerivedUi();
          this._refreshEntityDerivedUi();
        }
        _refreshCardDerivedUi() {
          this._setElementText("card-group-marker-target-summary", this._getCardTargetMarkerSummary());
          this._setElementText("card-group-marker-peak-summary", this._getMarkerResetSummary("peak"));
          this._setElementText("card-group-marker-floor-summary", this._getMarkerResetSummary("floor"));
          this._setElementText("card-group-baseline-summary", this._getCardBaselineSummary());
          this._setElementText("card-group-generic-markers-summary", this._getGenericMarkersSummary({ type: "card" }));
          this._setElementText("card-group-segments-summary", this._getSegmentsSummary({ type: "card" }));
          this._setElementText("card-group-gradient-stops-summary", this._getGradientStopsSummary({ type: "card" }));
          this._setElementChecked("target-above-fill-enabled", this._isTargetAboveFillEnabled({ type: "card" }));
          this._setElementChecked("baseline-above-color-enabled", this._isBaselineDirectionalColorEnabled({ type: "card" }, "above"));
          this._setElementChecked("baseline-below-color-enabled", this._isBaselineDirectionalColorEnabled({ type: "card" }, "below"));
          this._refreshSegmentUi({ type: "card" });
        }
        _refreshEntityDerivedUi() {
          const count = this._getEntitiesValue().length;
          for (let index = 0; index < count; index += 1) {
            const scope = { type: "entity", index };
            this._setElementChecked(`entity-${index}-scale-inherit`, !this._hasResolvableOverride(this._getResolvableScopedValue(scope, "min")) && !this._hasResolvableOverride(this._getResolvableScopedValue(scope, "max")));
            this._setElementChecked(`entity-${index}-target-inherit`, !this._hasTargetOverride(scope));
            this._setElementChecked(`entity-${index}-baseline-inherit`, !this._hasBaselineOverride(scope));
            this._setElementChecked(`entity-${index}-needle-inherit`, !this._hasNeedleOverride(scope));
            this._setElementChecked(`entity-${index}-peak-inherit`, !this._hasPeakOverride(scope));
            this._setElementChecked(`entity-${index}-floor-inherit`, !this._hasExtremumOverride(scope, "floor"));
            this._setElementChecked(`entity-${index}-markers-inherit`, !this._hasMarkersOverride(scope));
            this._setElementChecked(`entity-${index}-bar-inherit`, !this._hasEntityBarAppearanceOverride(scope));
            this._setElementChecked(`entity-${index}-segments-inherit`, !this._hasSegmentsOverride(scope));
            this._setElementChecked(`entity-${index}-gradient-stops-inherit`, !this._hasGradientStopsOverride(scope));
            this._setElementChecked(`entity-${index}-layout-inherit`, !this._hasLayoutOverride(scope));
            this._setElementChecked(`entity-${index}-formatting-inherit`, !this._hasFormattingOverride(scope));
            this._setElementChecked(`entity-${index}-target-above-fill-enabled`, this._isTargetAboveFillEnabled(scope));
            this._setElementChecked(`entity-${index}-baseline-above-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, "above"));
            this._setElementChecked(`entity-${index}-baseline-below-color-enabled`, this._isBaselineDirectionalColorEnabled(scope, "below"));
            this._setElementText(`entity-${index}-group-scale-summary`, this._getScaleOverrideSummary(scope));
            this._setElementText(`entity-${index}-group-target-summary`, this._getTargetOverrideSummary(scope));
            this._setElementText(`entity-${index}-group-baseline-summary`, this._getBaselineOverrideSummary(scope));
            this._setElementText(`entity-${index}-group-needle-summary`, this._getNeedleSummary(scope));
            this._setElementText(`entity-${index}-group-peak-summary`, this._getPeakSummary(scope));
            this._setElementText(`entity-${index}-group-floor-summary`, this._getFloorSummary(scope));
            this._setElementText(`entity-${index}-group-markers-summary`, this._getGenericMarkersSummary(scope));
            this._setElementText(`entity-${index}-group-bar-summary`, this._getBarAppearanceSummary(scope));
            this._setElementText(`entity-${index}-group-segments-summary`, this._getSegmentsSummary(scope));
            this._setElementText(`entity-${index}-group-gradient-stops-summary`, this._getGradientStopsSummary(scope));
            this._setElementText(`entity-${index}-group-layout-summary`, this._getLayoutSummary(scope));
            this._setElementText(`entity-${index}-group-formatting-summary`, this._getFormattingSummary(scope));
            this._refreshSegmentUi(scope);
          }
        }
        _queuePostRenderFocus(selector) {
          this._pendingFocusSelector = selector || null;
        }
        _applyPendingFocus() {
          if (!this._pendingFocusSelector || !this.shadowRoot) {
            return;
          }
          const selector = this._pendingFocusSelector;
          this._pendingFocusSelector = null;
          setTimeout(() => {
            var _a, _b;
            const element = (_b = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector) == null ? void 0 : _b.call(_a, selector);
            if (!element || typeof element.focus !== "function") {
              return;
            }
            try {
              element.focus({ preventScroll: true });
            } catch (_error) {
              element.focus();
            }
          }, 0);
        }
        _setValueAtPath(path, value, options = {}) {
          const nextConfig = value === void 0 ? this._deletePathValue(this._draftConfig, path) : this._setPathValue(this._draftConfig, path, value);
          return this._applyUserConfig(nextConfig, options);
        }
        _setTitle(value) {
          this._setValueAtPath(["title"], value);
        }
        _setEntityField(index, key, value) {
          const normalizedValue = this._normalizeTextValue(value);
          if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== void 0 && index === 0) {
            if (!normalizedValue.trim()) {
              return this._setValueAtPath([key], void 0);
            }
            return this._setValueAtPath([key], normalizedValue.trim());
          }
          const nextConfig = this._withEntityScopeConfig((entries) => {
            var _a;
            const rawEntry = entries[index];
            const nextEntry = this._isObject(rawEntry) ? this._cloneDeep(rawEntry) : { entity: (_a = rawEntry == null ? void 0 : rawEntry.entity) != null ? _a : "" };
            if (!normalizedValue.trim()) {
              delete nextEntry[key];
            } else {
              nextEntry[key] = normalizedValue.trim();
            }
            entries[index] = nextEntry;
            return entries;
          });
          return this._applyUserConfig(nextConfig);
        }
        _cleanupEntityIdentityForEmit(target) {
          if (!this._isObject(target)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const normalizedName = this._normalizeTextValue(nextTarget.name).trim();
          if (!normalizedName) {
            delete nextTarget.name;
          } else {
            nextTarget.name = normalizedName;
          }
          if (nextTarget.icon === false) {
            return nextTarget;
          }
          const normalizedIcon = this._normalizeTextValue(nextTarget.icon).trim();
          if (!normalizedIcon) {
            delete nextTarget.icon;
          } else {
            nextTarget.icon = normalizedIcon;
          }
          return nextTarget;
        }
        _cleanupNeedleForEmit(target, scope = { type: "card" }) {
          var _a;
          if (!this._isObject(target) || !this._isObject(target.bar)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const rawNeedle = (_a = nextTarget.bar) == null ? void 0 : _a.needle;
          if (rawNeedle === void 0) {
            return nextTarget;
          }
          const defaultColor = this._normalizeColorComparisonValue("#ffffff");
          let nextNeedle = null;
          if (rawNeedle === true) {
            nextNeedle = { show: true };
          } else if (rawNeedle === false) {
            nextNeedle = (scope == null ? void 0 : scope.type) === "entity" ? { show: false } : null;
          } else if (this._isObject(rawNeedle)) {
            const color = this._normalizeTextValue(rawNeedle.color).trim();
            if (rawNeedle.show === true) {
              nextNeedle = { show: true };
            } else if (rawNeedle.show === false) {
              nextNeedle = (scope == null ? void 0 : scope.type) === "entity" ? { show: false } : null;
            } else if ((scope == null ? void 0 : scope.type) === "entity" && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
              nextNeedle = {};
            }
            if (nextNeedle && color && this._normalizeColorComparisonValue(color) !== defaultColor) {
              nextNeedle.color = color;
            }
          } else {
            nextNeedle = null;
          }
          if (nextNeedle) {
            nextTarget.bar.needle = nextNeedle;
          } else {
            delete nextTarget.bar.needle;
            if (!Object.keys(nextTarget.bar).length) {
              delete nextTarget.bar;
            }
          }
          return nextTarget;
        }
        _cleanupResolvableValueForEmit(value) {
          if (this._isObject(value) || value === null || typeof value === "string" && this._normalizeNumberValue(value) === null) {
            return this._cloneDeep(value);
          }
          const fixed = this._normalizeNumberValue(value);
          return fixed === null ? null : { fixed };
        }
        _cleanupScaleForEmit(target) {
          if (!this._isObject(target) || !this._isObject(target.scale)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextScale = this._cloneDeep(nextTarget.scale);
          ["min", "max"].forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(nextScale, key)) {
              return;
            }
            const cleanedValue = this._cleanupResolvableValueForEmit(nextScale[key]);
            if (cleanedValue || nextScale[key] === null) {
              nextScale[key] = cleanedValue;
              delete nextTarget[key];
              delete nextTarget[`${key}_entity`];
            } else {
              delete nextScale[key];
            }
          });
          if (Object.keys(nextScale).length) {
            nextTarget.scale = nextScale;
          } else {
            delete nextTarget.scale;
          }
          return nextTarget;
        }
        _cleanupFormattingForEmit(target) {
          if (!this._isObject(target) || !this._isObject(target.formatting)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextFormatting = this._cloneDeep(nextTarget.formatting);
          const unit = this._normalizeTextValue(nextFormatting.unit).trim();
          const decimal = this._normalizeDecimalValue(nextFormatting.decimal);
          if (unit) {
            nextFormatting.unit = unit;
            delete nextTarget.unit;
          } else {
            delete nextFormatting.unit;
          }
          if (decimal !== null) {
            nextFormatting.decimal = decimal;
            delete nextTarget.decimal;
          } else {
            delete nextFormatting.decimal;
          }
          if (Object.keys(nextFormatting).length) {
            nextTarget.formatting = nextFormatting;
          } else {
            delete nextTarget.formatting;
          }
          return nextTarget;
        }
        _cleanupLayoutForEmit(target) {
          if (!this._isObject(target) || !this._isObject(target.layout)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextLayout = this._cloneDeep(nextTarget.layout);
          const nextLabel = this._isObject(nextLayout.label) ? this._cloneDeep(nextLayout.label) : null;
          const nextHero = this._isObject(nextLayout.hero) ? this._cloneDeep(nextLayout.hero) : null;
          const height = this._normalizeNumberValue(nextLayout.height);
          const width = this._normalizeNumberValue(nextLabel == null ? void 0 : nextLabel.width);
          const valueSize = this._normalizeHeroValueSizeValue(nextHero == null ? void 0 : nextHero.value_size);
          const position = this._normalizeTextValue(nextLabel == null ? void 0 : nextLabel.position).trim();
          if (height !== null && height >= 24) {
            nextLayout.height = height;
            delete nextTarget.height;
          } else {
            delete nextLayout.height;
          }
          if (nextLabel) {
            if (position) {
              nextLabel.position = position;
              delete nextTarget.label_position;
            } else {
              delete nextLabel.position;
            }
            if (width !== null) {
              nextLabel.width = width;
              delete nextTarget.label_width;
            } else {
              delete nextLabel.width;
            }
            if (Object.keys(nextLabel).length) {
              nextLayout.label = nextLabel;
            } else {
              delete nextLayout.label;
            }
          }
          if (nextHero) {
            if (valueSize !== null) {
              nextHero.value_size = valueSize;
            } else {
              delete nextHero.value_size;
            }
            if (Object.keys(nextHero).length) {
              nextLayout.hero = nextHero;
            } else {
              delete nextLayout.hero;
            }
          }
          if (Object.keys(nextLayout).length) {
            nextTarget.layout = nextLayout;
          } else {
            delete nextTarget.layout;
          }
          return nextTarget;
        }
        _cleanupTargetForEmit(target, scope = { type: "card" }) {
          var _a;
          if (!this._isObject(target) || !this._isObject(target.target)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextMarker = this._cloneDeep(nextTarget.target);
          const cleanedAt = this._cleanupResolvableValueForEmit(nextMarker.at);
          const color = this._normalizeTextValue(nextMarker.color).trim();
          const label = this._cleanBuiltinMarkerLabelForEmit(nextMarker.label, scope, "target");
          const fillColor = this._normalizeTextValue((_a = nextMarker.when_exceeded) == null ? void 0 : _a.fill_color).trim();
          const hasShape = Object.prototype.hasOwnProperty.call(nextMarker, "shape");
          const shape = hasShape ? normalizeTargetMarkerShape(nextMarker.shape) : null;
          const direction = Object.prototype.hasOwnProperty.call(nextMarker, "direction") ? normalizeMarkerDirection(nextMarker.direction) : null;
          if (typeof nextMarker.enabled !== "boolean") {
            delete nextMarker.enabled;
          }
          if (cleanedAt || nextMarker.at === null) {
            nextMarker.at = cleanedAt;
            delete nextTarget.target_entity;
          } else {
            delete nextMarker.at;
          }
          if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue("#888")) {
            nextMarker.color = color;
            delete nextTarget.target_color;
          } else {
            delete nextMarker.color;
          }
          if (Object.keys(label).length) {
            nextMarker.label = label;
            if (label.show === true) delete nextTarget.show_target_label;
          } else {
            delete nextMarker.label;
            delete nextTarget.show_target_label;
          }
          if (fillColor) {
            nextMarker.when_exceeded = {
              ...this._isObject(nextMarker.when_exceeded) ? nextMarker.when_exceeded : {},
              fill_color: fillColor
            };
            delete nextTarget.above_target_color;
          } else {
            delete nextMarker.when_exceeded;
          }
          if ((scope == null ? void 0 : scope.type) === "card" && shape === "diamond") {
            delete nextMarker.shape;
          } else if (shape) {
            nextMarker.shape = shape;
          } else {
            delete nextMarker.shape;
          }
          if (direction === "inward" && ((scope == null ? void 0 : scope.type) !== "entity" || direction === this._getEffectiveMarkerDirection({ type: "card" }, "target"))) {
            delete nextMarker.direction;
          } else if (direction) {
            nextMarker.direction = direction;
          }
          if (Object.keys(nextMarker).length) {
            nextTarget.target = nextMarker;
          } else {
            delete nextTarget.target;
          }
          return nextTarget;
        }
        _cleanupBaselineForEmit(target) {
          if (!this._isObject(target) || !this._isObject(target.baseline)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextBaseline = this._cloneDeep(nextTarget.baseline);
          const cleanedAt = this._cleanupResolvableValueForEmit(nextBaseline.at);
          if (typeof nextBaseline.enabled !== "boolean") {
            delete nextBaseline.enabled;
          }
          if (cleanedAt || nextBaseline.at === null) {
            nextBaseline.at = cleanedAt;
          } else {
            delete nextBaseline.at;
          }
          ["above", "below"].forEach((direction) => {
            if (!this._isObject(nextBaseline[direction])) {
              delete nextBaseline[direction];
              return;
            }
            const color = this._normalizeTextValue(nextBaseline[direction].color).trim();
            if (color) {
              nextBaseline[direction] = { ...nextBaseline[direction], color };
            } else {
              delete nextBaseline[direction];
            }
          });
          if (Object.keys(nextBaseline).length) {
            nextTarget.baseline = nextBaseline;
          } else {
            delete nextTarget.baseline;
          }
          return nextTarget;
        }
        _cleanupPeakForEmit(target, scope = { type: "card" }) {
          if (!this._isObject(target) || !this._isObject(target.peak)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextPeak = this._cloneDeep(nextTarget.peak);
          const color = this._normalizeTextValue(nextPeak.color).trim();
          const direction = Object.prototype.hasOwnProperty.call(nextPeak, "direction") ? normalizeMarkerDirection(nextPeak.direction) : null;
          if (typeof nextPeak.enabled !== "boolean") {
            delete nextPeak.enabled;
          }
          if ((scope == null ? void 0 : scope.type) !== "entity" && nextPeak.reset === "never") {
            delete nextPeak.reset;
          }
          if (direction === "inward" && ((scope == null ? void 0 : scope.type) !== "entity" || direction === this._getEffectiveMarkerDirection({ type: "card" }, "peak"))) {
            delete nextPeak.direction;
          } else if (direction) {
            nextPeak.direction = direction;
          }
          if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue("#888")) {
            nextPeak.color = color;
            delete nextTarget.peak_color;
          } else {
            delete nextPeak.color;
          }
          nextPeak.label = this._cleanBuiltinMarkerLabelForEmit(nextPeak.label, scope, "peak");
          if (!Object.keys(nextPeak.label).length) delete nextPeak.label;
          if (Object.keys(nextPeak).length) {
            nextTarget.peak = nextPeak;
          } else {
            delete nextTarget.peak;
          }
          return nextTarget;
        }
        _cleanupFloorForEmit(target, scope = { type: "card" }) {
          if (!this._isObject(target) || !this._isObject(target.floor)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextFloor = this._cloneDeep(nextTarget.floor);
          const color = this._normalizeTextValue(nextFloor.color).trim();
          const direction = Object.prototype.hasOwnProperty.call(nextFloor, "direction") ? normalizeMarkerDirection(nextFloor.direction) : null;
          if (typeof nextFloor.enabled !== "boolean") delete nextFloor.enabled;
          if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue("#888888")) {
            nextFloor.color = color;
          } else {
            delete nextFloor.color;
          }
          if (this._isObject(nextFloor.label)) {
            nextFloor.label = this._cleanBuiltinMarkerLabelForEmit(nextFloor.label, scope, "floor");
            if (!Object.keys(nextFloor.label).length) delete nextFloor.label;
          }
          if ((scope == null ? void 0 : scope.type) !== "entity" && nextFloor.reset === "never" || nextFloor.reset === void 0 || nextFloor.reset === null || nextFloor.reset === "") {
            delete nextFloor.reset;
          }
          if (direction === "inward" && ((scope == null ? void 0 : scope.type) !== "entity" || direction === this._getEffectiveMarkerDirection({ type: "card" }, "floor"))) {
            delete nextFloor.direction;
          } else if (direction) {
            nextFloor.direction = direction;
          }
          if (Object.keys(nextFloor).length) nextTarget.floor = nextFloor;
          else delete nextTarget.floor;
          return nextTarget;
        }
        _cleanBuiltinMarkerLabelForEmit(rawLabel, scope, key) {
          var _a, _b, _c;
          const label = this._isObject(rawLabel) ? this._cloneDeep(rawLabel) : {};
          const cardLabel = (scope == null ? void 0 : scope.type) === "entity" ? (_a = this._getScopedValue({ type: "card" }, [key, "label"])) != null ? _a : {} : {};
          if (label.show === false && (scope == null ? void 0 : scope.type) !== "entity") delete label.show;
          if (label.show === false && (scope == null ? void 0 : scope.type) === "entity" && cardLabel.show !== true) delete label.show;
          if (label.show_value === true && ((scope == null ? void 0 : scope.type) !== "entity" || cardLabel.show_value !== false)) delete label.show_value;
          if (label.show_unit === true && ((scope == null ? void 0 : scope.type) !== "entity" || cardLabel.show_unit !== false)) delete label.show_unit;
          if (typeof label.text === "string") {
            label.text = label.text.replace(/\s+/g, " ").trim();
            if (!label.text && (scope == null ? void 0 : scope.type) !== "entity") delete label.text;
          }
          const precision = this._normalizeDecimalValue((_b = label.precision) != null ? _b : label.decimal);
          delete label.decimal;
          if (precision === null) delete label.precision;
          else if ((scope == null ? void 0 : scope.type) === "entity" && precision === ((_c = cardLabel.precision) != null ? _c : cardLabel.decimal)) delete label.precision;
          else label.precision = precision;
          return label;
        }
        _cleanupBarForEmit(target, scope = { type: "card" }, cardConfig = null, inheritedSegmentSpace = null) {
          if (!this._isObject(target) || !this._isObject(target.bar)) {
            return target;
          }
          const nextTarget = this._cloneDeep(target);
          const nextBar = this._cloneDeep(nextTarget.bar);
          const scopedSegmentSpace = ["percent", "scale"].includes(nextBar.segment_space) ? nextBar.segment_space : (scope == null ? void 0 : scope.type) === "entity" && ["percent", "scale"].includes(inheritedSegmentSpace) ? inheritedSegmentSpace : null;
          const legacySegmentSpace = scopedSegmentSpace;
          if (legacySegmentSpace === "percent" && Array.isArray(nextBar.segments)) {
            const asLegacyPercent = (boundary) => {
              if (typeof boundary === "number" && Number.isFinite(boundary)) return `${boundary}%`;
              if (typeof boundary === "string" && boundary.trim() !== "" && !boundary.includes("%") && Number.isFinite(Number(boundary.trim()))) {
                return `${Number(boundary.trim())}%`;
              }
              return boundary;
            };
            nextBar.segments = nextBar.segments.map((segment) => ({
              ...segment,
              from: asLegacyPercent(segment == null ? void 0 : segment.from),
              ...Object.prototype.hasOwnProperty.call(segment != null ? segment : {}, "to") ? { to: asLegacyPercent(segment.to) } : {}
            }));
          }
          delete nextBar.segment_space;
          const fillStyle = this._normalizeTextValue(nextBar.fill_style).trim();
          const color = this._normalizeTextValue(nextBar.color).trim();
          const segments = Array.isArray(nextBar.segments) ? nextBar.segments : null;
          const gradientStops = Array.isArray(nextBar.gradient_stops) ? nextBar.gradient_stops : null;
          if (fillStyle) {
            const withoutLocalFillStyle = this._cloneDeep(nextTarget);
            delete withoutLocalFillStyle.bar.fill_style;
            const inheritedStyle = normalizeBarConfig(
              withoutLocalFillStyle,
              (scope == null ? void 0 : scope.type) === "entity" ? cardConfig : null,
              { isCardScope: (scope == null ? void 0 : scope.type) !== "entity" }
            ).fill_style;
            if (fillStyle === "bands" && inheritedStyle === "bands") delete nextBar.fill_style;
            else nextBar.fill_style = fillStyle;
            delete nextTarget.color_mode;
          } else {
            delete nextBar.fill_style;
          }
          if (color && this._normalizeColorComparisonValue(color) !== this._normalizeColorComparisonValue("#4a9eff")) {
            nextBar.color = color;
            delete nextTarget.color;
          } else {
            delete nextBar.color;
          }
          if (nextBar.solid_fill === true) {
            nextBar.solid_fill = true;
          } else {
            delete nextBar.solid_fill;
          }
          if (segments && (!segments.length || legacySegmentSpace || !this._segmentsEqualForEditor(segments, this._getDefaultSegments()))) {
            nextBar.segments = segments;
            delete nextTarget.segments;
            delete nextTarget.severity;
          } else {
            delete nextBar.segments;
          }
          if (gradientStops && (!gradientStops.length || gradientStops.length >= 2 && !this._isDefaultGradientStops(gradientStops))) {
            nextBar.gradient_stops = this._sanitizeGradientStopsForEmit(gradientStops);
            delete nextTarget.gradient_stops;
          } else {
            delete nextBar.gradient_stops;
          }
          if (Object.keys(nextBar).length) {
            nextTarget.bar = nextBar;
          } else {
            delete nextTarget.bar;
          }
          return nextTarget;
        }
        _getEditorKnownKeyOrder(path = []) {
          const pathKey = path.join(".");
          switch (pathKey) {
            case "":
              return ["type", "title", "entities", "scale", "target", "baseline", "peak", "floor", "layout", "formatting", "bar"];
            case "entities.*":
              return ["entity", "name", "icon", "scale", "target", "baseline", "peak", "floor", "layout", "formatting", "bar"];
            case "scale":
              return ["min", "max"];
            case "scale.min":
            case "scale.max":
            case "target.at":
            case "baseline.at":
              return ["fixed", "entity"];
            case "target":
              return ["enabled", "at", "shape", "color", "label", "when_exceeded"];
            case "target.label":
              return ["show", "decimal"];
            case "target.when_exceeded":
              return ["fill_color"];
            case "baseline":
              return ["enabled", "at", "above", "below"];
            case "baseline.above":
            case "baseline.below":
              return ["color"];
            case "peak":
              return ["enabled", "color", "reset", "label"];
            case "floor":
              return ["enabled", "color", "reset", "label"];
            case "peak.label":
            case "floor.label":
              return ["show", "decimal"];
            case "layout":
              return ["height", "label", "hero"];
            case "layout.label":
              return ["position", "hero_size", "width"];
            case "layout.hero":
              return ["size", "value_size"];
            case "formatting":
              return ["unit", "decimal"];
            case "bar":
              return ["fill_style", "color", "solid_fill", "needle", "segments", "gradient_stops"];
            case "bar.needle":
              return ["show", "color"];
            default:
              return null;
          }
        }
        _orderEditorConfigKeys(value, path = []) {
          var _a;
          if (Array.isArray(value)) {
            const nextPath = path[0] === "entities" ? ["entities", "*"] : path;
            return value.map((entry) => this._orderEditorConfigKeys(entry, nextPath));
          }
          if (!this._isObject(value)) {
            return value;
          }
          const orderedValue = {};
          const knownOrder = (_a = this._getEditorKnownKeyOrder(path)) != null ? _a : [];
          const seenKeys = /* @__PURE__ */ new Set();
          knownOrder.forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(value, key)) {
              return;
            }
            orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
            seenKeys.add(key);
          });
          Object.keys(value).forEach((key) => {
            if (seenKeys.has(key)) {
              return;
            }
            orderedValue[key] = this._orderEditorConfigKeys(value[key], [...path, key]);
          });
          return orderedValue;
        }
        _cleanupEditorEmittedConfig(config) {
          var _a;
          if (!this._isObject(config)) {
            return config;
          }
          const inheritedSegmentSpace = (_a = config.bar) == null ? void 0 : _a.segment_space;
          let nextConfig = this._cleanupEntityIdentityForEmit(config);
          nextConfig = this._cleanupScaleForEmit(nextConfig);
          nextConfig = this._cleanupTargetForEmit(nextConfig, { type: "card" });
          nextConfig = this._cleanupBaselineForEmit(nextConfig);
          nextConfig = this._cleanupPeakForEmit(nextConfig, { type: "card" });
          nextConfig = this._cleanupFloorForEmit(nextConfig, { type: "card" });
          nextConfig = this._cleanupGenericMarkersForEmit(nextConfig);
          nextConfig = this._cleanupLayoutForEmit(nextConfig);
          nextConfig = this._cleanupFormattingForEmit(nextConfig);
          nextConfig = this._cleanupNeedleForEmit(nextConfig, { type: "card" });
          nextConfig = this._cleanupBarForEmit(nextConfig, { type: "card" });
          if (Array.isArray(nextConfig.entities)) {
            nextConfig.entities = nextConfig.entities.map((entry, index) => {
              if (!this._isObject(entry)) {
                return entry;
              }
              let cleanedEntry = this._cleanupEntityIdentityForEmit(entry);
              cleanedEntry = this._cleanupScaleForEmit(cleanedEntry);
              cleanedEntry = this._cleanupTargetForEmit(cleanedEntry, { type: "entity", index });
              cleanedEntry = this._cleanupBaselineForEmit(cleanedEntry);
              cleanedEntry = this._cleanupPeakForEmit(cleanedEntry, { type: "entity", index });
              cleanedEntry = this._cleanupFloorForEmit(cleanedEntry, { type: "entity", index });
              cleanedEntry = this._cleanupGenericMarkersForEmit(cleanedEntry);
              cleanedEntry = this._cleanupLayoutForEmit(cleanedEntry);
              cleanedEntry = this._cleanupFormattingForEmit(cleanedEntry);
              cleanedEntry = this._cleanupNeedleForEmit(cleanedEntry, { type: "entity" });
              cleanedEntry = this._cleanupBarForEmit(cleanedEntry, { type: "entity", index }, nextConfig, inheritedSegmentSpace);
              return cleanedEntry;
            });
          }
          const meaning = (raw) => {
            const normalized = normalizeCardConfig({ ...raw, ...!raw.entities && !raw.entity ? { entities: [] } : {} });
            const featureKeys = ["layout", "scale", "bar", "baseline", "formatting", "target_marker", "peak_marker", "floor_marker", "generic_markers"];
            const scope = (value) => ({
              ...Object.fromEntries(featureKeys.map((key) => [key, value[key]])),
              scale: Object.fromEntries(["min", "max"].map((key) => [key, {
                ...value.scale[key],
                fixed_explicit: value.scale[key].fixed_explicit !== false
              }]))
            });
            const canonical = (value, key = "") => {
              if (Array.isArray(value)) return value.map((entry) => canonical(entry));
              if (this._isObject(value)) return Object.fromEntries(Object.entries(value).filter(([name]) => !["severity", "segment_space", "label_precision_key"].includes(name) && !/invalid/i.test(name)).map(([name, entry]) => [name, canonical(entry, name)]));
              if (key === "fixed") return getNumericValue(null, value);
              if (/color/i.test(key) && typeof value === "string") return this._normalizeColorComparisonValue(value);
              return value;
            };
            return this._serializeConfig(canonical({ card: scope(normalized), entities: normalized.entities.map((row) => ({
              entity: row.entity,
              name: row.name,
              icon: row.icon,
              ...scope(row)
            })) }));
          };
          try {
            if (meaning(config) !== meaning(nextConfig)) nextConfig = this._cloneDeep(config);
          } catch (_error) {
            nextConfig = this._cloneDeep(config);
          }
          return this._orderEditorConfigKeys(nextConfig);
        }
        _getScopedPath(scope, keyPath) {
          return getScopedPath(scope, keyPath);
        }
        _normalizePath(keyPath) {
          return normalizePath(keyPath);
        }
        _getEntityRawEntries() {
          if (Array.isArray(this._draftConfig.entities)) {
            return this._draftConfig.entities.map((entry) => this._isObject(entry) ? this._cloneDeep(entry) : { entity: entry });
          }
          if (this._draftConfig.entity !== void 0) {
            return [{
              entity: this._draftConfig.entity,
              ...this._draftConfig.name !== void 0 ? { name: this._draftConfig.name } : {},
              ...this._draftConfig.icon !== void 0 ? { icon: this._draftConfig.icon } : {}
            }];
          }
          return [];
        }
        _withEntityScopeConfig(mutator) {
          const rawEntries = this._getEntityRawEntries();
          const nextEntries = mutator(rawEntries.map((entry) => this._cloneDeep(entry)));
          let nextConfig = this._setPathValue(this._draftConfig, ["entities"], nextEntries);
          if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== void 0) {
            nextConfig = this._deletePathValue(nextConfig, ["entity"]);
            if (this._draftConfig.name !== void 0) {
              nextConfig = this._deletePathValue(nextConfig, ["name"]);
            }
            if (this._draftConfig.icon !== void 0) {
              nextConfig = this._deletePathValue(nextConfig, ["icon"]);
            }
          }
          return nextConfig;
        }
        _setEntityRowsRaw(nextRows, options = {}) {
          var _a;
          const normalizedRows = this._cloneDeep(nextRows);
          if (Array.isArray(this._draftConfig.entities) || this._draftConfig.entity === void 0 || normalizedRows.length !== 1) {
            let nextConfig2 = this._setPathValue(this._draftConfig, ["entities"], normalizedRows);
            if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== void 0) {
              nextConfig2 = this._deletePathValue(nextConfig2, ["entity"]);
              nextConfig2 = this._deletePathValue(nextConfig2, ["name"]);
              nextConfig2 = this._deletePathValue(nextConfig2, ["icon"]);
            }
            return this._applyUserConfig(nextConfig2, options);
          }
          const [row] = normalizedRows;
          if (typeof row === "string") {
            let nextConfig2 = this._setPathValue(this._draftConfig, ["entity"], row);
            nextConfig2 = this._deletePathValue(nextConfig2, ["name"]);
            nextConfig2 = this._deletePathValue(nextConfig2, ["icon"]);
            return this._applyUserConfig(nextConfig2, options);
          }
          let nextConfig = this._setPathValue(this._draftConfig, ["entity"], (_a = row == null ? void 0 : row.entity) != null ? _a : "");
          if (row && Object.prototype.hasOwnProperty.call(row, "name")) {
            nextConfig = this._setPathValue(nextConfig, ["name"], row.name);
          } else {
            nextConfig = this._deletePathValue(nextConfig, ["name"]);
          }
          if (row && Object.prototype.hasOwnProperty.call(row, "icon")) {
            nextConfig = this._setPathValue(nextConfig, ["icon"], row.icon);
          } else {
            nextConfig = this._deletePathValue(nextConfig, ["icon"]);
          }
          return this._applyUserConfig(nextConfig, options);
        }
        _moveEntityRow(index, direction) {
          const rows = this._getRawEntityRows();
          const nextIndex = index + direction;
          if (index < 0 || index >= rows.length || nextIndex < 0 || nextIndex >= rows.length) {
            return false;
          }
          const nextRows = this._cloneDeep(rows);
          [nextRows[index], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[index]];
          return this._setEntityRowsRaw(nextRows, { rerender: true });
        }
        _duplicateEntityRow(index) {
          const rows = this._getRawEntityRows();
          if (index < 0 || index >= rows.length) {
            return false;
          }
          const sourceRow = this._cloneDeep(rows[index]);
          const duplicateRow = typeof sourceRow === "string" ? { entity: sourceRow } : this._cloneDeep(sourceRow);
          if (this._isObject(duplicateRow) && typeof duplicateRow.name === "string" && duplicateRow.name.trim()) {
            duplicateRow.name = `${duplicateRow.name.trim()} copy`;
          }
          const nextRows = this._cloneDeep(rows);
          nextRows.splice(index + 1, 0, duplicateRow);
          return this._setEntityRowsRaw(nextRows, { rerender: true });
        }
        _removeEntityRow(index) {
          const rows = this._getRawEntityRows();
          if (rows.length <= 1 || index < 0 || index >= rows.length) {
            return false;
          }
          const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
          return this._setEntityRowsRaw(nextRows, { rerender: true });
        }
        _getScopedValue(scope, keyPath) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const entry = this._getEntityRawEntries()[scope.index];
            return this._getPathValue(entry, this._normalizePath(keyPath));
          }
          return this._getPathValue(this._draftConfig, this._getScopedPath(scope, keyPath));
        }
        _removeScopedValue(scope, keyPath, options = {}) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const nextConfig = this._withEntityScopeConfig((entries) => {
              var _a, _b;
              const entry = this._isObject(entries[scope.index]) ? { ...entries[scope.index] } : { entity: (_b = (_a = entries[scope.index]) == null ? void 0 : _a.entity) != null ? _b : "" };
              entries[scope.index] = this._deletePathValue(entry, this._normalizePath(keyPath));
              return entries;
            });
            return this._applyUserConfig(nextConfig, options);
          }
          return this._setValueAtPath(this._getScopedPath(scope, keyPath), void 0, options);
        }
        _applyScopedMutation(scope, mutator, options = {}) {
          if ((scope == null ? void 0 : scope.type) === "entity") {
            const nextConfig2 = this._withEntityScopeConfig((entries) => {
              var _a;
              const rawEntry = entries[scope.index];
              const entry = this._isObject(rawEntry) ? this._cloneDeep(rawEntry) : { entity: (_a = rawEntry == null ? void 0 : rawEntry.entity) != null ? _a : "" };
              entries[scope.index] = mutator(entry);
              return entries;
            });
            return this._applyUserConfig(nextConfig2, options);
          }
          const nextConfig = mutator(this._cloneDeep(this._draftConfig));
          return this._applyUserConfig(nextConfig, options);
        }
        _setScopedValue(scope, keyPath, value, options = {}) {
          return this._applyScopedMutation(scope, (target) => this._setPathValue(target, this._normalizePath(keyPath), value), options);
        }
        _removePathsFromTarget(target, keyPaths = []) {
          return removePathsFromTarget(target, keyPaths);
        }
        _pruneEmptyObjectsInTarget(target, keyPath) {
          return pruneEmptyObjectsInTarget(target, keyPath);
        }
        _setCanonicalScopedValue(scope, canonicalPath, value, options = {}) {
          const { deprecatedKeys = [], prunePaths = [] } = options;
          return this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._setPathValue(target, this._normalizePath(canonicalPath), value);
            nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
            const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
            pathsToPrune.forEach((path) => {
              if (path.length) {
                nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
              }
            });
            return nextTarget;
          }, options);
        }
        _removeCanonicalScopedValue(scope, canonicalPath, options = {}) {
          const { deprecatedKeys = [], prunePaths = [] } = options;
          return this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._deletePathValue(target, this._normalizePath(canonicalPath));
            nextTarget = this._removePathsFromTarget(nextTarget, deprecatedKeys);
            const pathsToPrune = [this._normalizePath(canonicalPath).slice(0, -1), ...prunePaths.map((path) => this._normalizePath(path))];
            pathsToPrune.forEach((path) => {
              if (path.length) {
                nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
              }
            });
            return nextTarget;
          }, options);
        }
        _setScopedNumericOverride(scope, keyPath, rawValue, options = {}) {
          const normalizedValue = this._normalizeNumberValue(rawValue);
          if (rawValue === "" || rawValue === null || rawValue === void 0) {
            return this._removeScopedValue(scope, keyPath, options);
          }
          if (normalizedValue === null) {
            return false;
          }
          return this._setScopedValue(scope, keyPath, normalizedValue, options);
        }
        _setScopedTextOverride(scope, keyPath, rawValue, options = {}) {
          const normalizedValue = this._normalizeTextValue(rawValue).trim();
          if (!normalizedValue) {
            return this._removeScopedValue(scope, keyPath, options);
          }
          return this._setScopedValue(scope, keyPath, normalizedValue, options);
        }
        _setCanonicalScopedNumericOverride(scope, canonicalPath, rawValue, options = {}) {
          const normalizedValue = this._normalizeNumberValue(rawValue);
          if (rawValue === "" || rawValue === null || rawValue === void 0 || normalizedValue === null) {
            return this._removeCanonicalScopedValue(scope, canonicalPath, options);
          }
          return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
        }
        _setCanonicalScopedTextOverride(scope, canonicalPath, rawValue, options = {}) {
          const normalizedValue = this._normalizeTextValue(rawValue).trim();
          if (!normalizedValue) {
            return this._removeCanonicalScopedValue(scope, canonicalPath, options);
          }
          return this._setCanonicalScopedValue(scope, canonicalPath, normalizedValue, options);
        }
        _getResolvablePartsFromTarget(target, field, options = {}) {
          var _a, _b, _c, _d, _e, _f;
          const canonicalBasePath = (_a = options.canonicalBasePath) != null ? _a : ["scale", field];
          const legacyFixedPath = (_b = options.legacyFixedPath) != null ? _b : [field];
          const legacyEntityPath = (_c = options.legacyEntityPath) != null ? _c : [`${field}_entity`];
          const structuredValue = this._getPathValue(target, canonicalBasePath);
          const legacyFixedValue = this._getPathValue(target, legacyFixedPath);
          const legacyEntityValue = this._getPathValue(target, legacyEntityPath);
          if (structuredValue !== void 0) {
            const source = normalizeStructuredResolvableValue(structuredValue, (_d = options.inheritedSource) != null ? _d : null, null, {
              allowPercent: ["target", "baseline"].includes(canonicalBasePath[0])
            });
            return {
              fixed: (_e = source.fixed) != null ? _e : "",
              entity: (_f = source.entity) != null ? _f : "",
              ...Number.isFinite(source.percent) ? { percent: source.percent } : {}
            };
          }
          return {
            fixed: !this._isObject(legacyFixedValue) && legacyFixedValue !== void 0 ? legacyFixedValue : "",
            entity: legacyEntityValue != null ? legacyEntityValue : ""
          };
        }
        _getResolvableScopedValue(scope, field, options = {}) {
          const target = (scope == null ? void 0 : scope.type) === "entity" ? this._getEntityRawEntries()[scope.index] : this._draftConfig;
          return this._getResolvablePartsFromTarget(target != null ? target : {}, field, options);
        }
        _getEffectiveResolvableScopedValue(scope, field, options = {}) {
          var _a, _b;
          const localValue = this._getResolvableScopedValue(scope, field, options);
          if ((scope == null ? void 0 : scope.type) !== "entity") {
            return localValue;
          }
          const inheritedValue = this._getResolvableScopedValue({ type: "card" }, field, options);
          const target = this._getEntityRawEntries()[scope.index];
          if (this._getPathValue(target, (_a = options.canonicalBasePath) != null ? _a : ["scale", field]) !== void 0) {
            return this._getResolvablePartsFromTarget(target, field, {
              ...options,
              inheritedSource: { fixed: inheritedValue.fixed === "" ? null : inheritedValue.fixed, entity: inheritedValue.entity || null, percent: (_b = inheritedValue.percent) != null ? _b : null }
            });
          }
          return {
            fixed: this._hasExplicitOverrideValue(localValue.fixed) ? localValue.fixed : inheritedValue.fixed,
            entity: this._hasExplicitOverrideValue(localValue.entity) ? localValue.entity : inheritedValue.entity
          };
        }
        _setCanonicalResolvablePart(scope, field, part, rawValue, options = {}) {
          var _a, _b, _c, _d;
          const canonicalBasePath = (_a = options.canonicalBasePath) != null ? _a : ["scale", field];
          const legacyFixedPath = (_b = options.legacyFixedPath) != null ? _b : [field];
          const legacyEntityPath = (_c = options.legacyEntityPath) != null ? _c : [`${field}_entity`];
          const prunePaths = (_d = options.prunePaths) != null ? _d : [canonicalBasePath, canonicalBasePath.slice(0, -1)];
          const normalizedValue = part === "fixed" ? this._normalizeNumberValue(rawValue) : this._normalizeTextValue(rawValue).trim();
          return this._applyScopedMutation(scope, (target) => {
            const currentParts = this._getResolvablePartsFromTarget(target != null ? target : {}, field, {
              canonicalBasePath,
              legacyFixedPath,
              legacyEntityPath
            });
            const nextParts = { ...currentParts };
            if (part === "fixed") {
              if (rawValue === "" || rawValue === null || rawValue === void 0 || normalizedValue === null) {
                delete nextParts.fixed;
              } else {
                nextParts.fixed = normalizedValue;
              }
            } else if (!normalizedValue) {
              delete nextParts.entity;
            } else {
              nextParts.entity = normalizedValue;
            }
            let nextTarget = this._cloneDeep(target);
            nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
            const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
            if (!this._isObject(legacyFixedValue)) {
              nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
            }
            nextTarget = this._deletePathValue(nextTarget, canonicalBasePath);
            const hasFixed = nextParts.fixed !== void 0 && nextParts.fixed !== null && nextParts.fixed !== "";
            const hasEntity = nextParts.entity !== void 0 && nextParts.entity !== null && nextParts.entity !== "";
            const hasPercent = Number.isFinite(nextParts.percent);
            if (hasFixed || hasEntity || hasPercent) {
              const nextValue = {};
              if (hasFixed) nextValue.fixed = nextParts.fixed;
              if (hasEntity) nextValue.entity = nextParts.entity;
              if (hasPercent) nextValue.percent = nextParts.percent;
              nextTarget = this._setPathValue(nextTarget, canonicalBasePath, nextValue);
            }
            prunePaths.forEach((path) => {
              if (path.length) {
                nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
              }
            });
            return nextTarget;
          }, options);
        }
        _clearCanonicalResolvableValue(scope, field, options = {}) {
          var _a, _b, _c, _d;
          const canonicalBasePath = (_a = options.canonicalBasePath) != null ? _a : ["scale", field];
          const legacyFixedPath = (_b = options.legacyFixedPath) != null ? _b : [field];
          const legacyEntityPath = (_c = options.legacyEntityPath) != null ? _c : [`${field}_entity`];
          const prunePaths = (_d = options.prunePaths) != null ? _d : [canonicalBasePath, canonicalBasePath.slice(0, -1)];
          return this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._deletePathValue(target, canonicalBasePath);
            nextTarget = this._deletePathValue(nextTarget, legacyEntityPath);
            const legacyFixedValue = this._getPathValue(nextTarget, legacyFixedPath);
            if (!this._isObject(legacyFixedValue)) {
              nextTarget = this._deletePathValue(nextTarget, legacyFixedPath);
            }
            prunePaths.forEach((path) => {
              if (path.length) {
                nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, path);
              }
            });
            return nextTarget;
          }, options);
        }
        _getScopedDisplayValue(scope, canonicalPath, fallbackPaths = []) {
          const valuesToTry = [canonicalPath, ...fallbackPaths];
          for (const path of valuesToTry) {
            const value = this._getScopedValue(scope, path);
            if (value !== void 0 && value !== null && value !== "") {
              return value;
            }
          }
          return "";
        }
        _getEffectiveScopedDisplayValue(...args) {
          return getEffectiveDisplayValue(this._createSectionContext(), ...args);
        }
        _paletteUi() {
          return {
            root: () => this.shadowRoot,
            render: () => this._render(),
            focus: (selector) => this._queuePostRenderFocus(selector)
          };
        }
        _applySectionMutation(scope, mutation, options) {
          var _a;
          if (((_a = options == null ? void 0 : options.needleEdit) == null ? void 0 : _a.field) !== "mode" || options.needleEdit.value === "disabled" || (scope == null ? void 0 : scope.type) === "entity" && options.needleEdit.value === "inherit") {
            return this._applyScopedMutation(scope, mutation, options);
          }
          return this._applyScopedMutation(scope, (target) => {
            let nextTarget = mutation(target);
            const baselineEnabled = this._getPathValue(nextTarget, ["baseline", "enabled"]);
            const baselineParts = this._getResolvablePartsFromTarget(nextTarget != null ? nextTarget : {}, "baseline", {
              canonicalBasePath: ["baseline", "at"],
              legacyFixedPath: ["baseline"],
              legacyEntityPath: ["baseline", "at", "entity"]
            });
            const baselineActive = baselineEnabled === true || baselineEnabled !== false && this._hasResolvableOverride(baselineParts);
            if (baselineActive) {
              nextTarget = this._deletePathValue(nextTarget, ["baseline"]);
            }
            return nextTarget;
          }, options);
        }
        _createSectionContext() {
          return {
            read: (scope, path) => this._getScopedValue(scope, path),
            mutate: (scope, mutation, options) => this._applySectionMutation(scope, mutation, options),
            source: (scope, key, effective = false) => {
              if ((key == null ? void 0 : key.type) === "reference-marker") return getReferenceMarkerSource(key.marker);
              const options = ["baseline", "target"].includes(key) ? { canonicalBasePath: [key, "at"], legacyFixedPath: [key], legacyEntityPath: key === "target" ? ["target_entity"] : ["baseline", "at", "entity"] } : {};
              return effective ? this._getEffectiveResolvableScopedValue(scope, key, options) : this._getResolvableScopedValue(scope, key, options);
            },
            setSource: (scope, key, part, value) => (key == null ? void 0 : key.type) === "reference-marker" ? this._referenceMarkersSection._setGenericMarkerSourcePart(scope, key.index, part, value) : key === "baseline" ? this._persistBaselineSourcePart(scope, part, value) : this._setCanonicalResolvablePart(scope, key, part, value, key === "target" ? { canonicalBasePath: ["target", "at"], legacyFixedPath: ["target"], legacyEntityPath: ["target_entity"], prunePaths: [["target", "at"], ["target"]] } : {})
          };
        }
        _renderScaleSection(scope) {
          return renderScaleSection(this._createSectionContext(), scope);
        }
        _renderFormattingSection(scope) {
          return renderFormattingSection(this._createSectionContext(), scope);
        }
        _getScopedFormattingValue(scope, key) {
          return getFormattingValue(this._createSectionContext(), scope, key);
        }
        _getEffectiveScopedFormattingValue(scope, key) {
          return getEffectiveFormattingValue(this._createSectionContext(), scope, key);
        }
        _setScopedFormattingUnit(scope, rawValue) {
          return setFormattingUnit(this._createSectionContext(), scope, rawValue);
        }
        _setScopedFormattingDecimal(scope, rawValue) {
          return setFormattingDecimal(this._createSectionContext(), scope, rawValue);
        }
        _clearFormattingOverride(scope) {
          return clearFormattingOverride(this._createSectionContext(), scope);
        }
        _hasFormattingOverride(scope) {
          return hasFormattingOverride(this._createSectionContext(), scope);
        }
        _getScopedLayoutValue(scope, key) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          if (key === "height") {
            return (_b = (_a = this._getScopedValue(scope, ["layout", "height"])) != null ? _a : this._getScopedValue(scope, ["height"])) != null ? _b : "";
          }
          if (key === "position") {
            return (_d = (_c = this._getScopedValue(scope, ["layout", "label", "position"])) != null ? _c : this._getScopedValue(scope, ["label_position"])) != null ? _d : "";
          }
          if (key === "width") {
            return (_f = (_e = this._getScopedValue(scope, ["layout", "label", "width"])) != null ? _e : this._getScopedValue(scope, ["label_width"])) != null ? _f : "";
          }
          if (key === "hero_size") {
            return (_h = (_g = this._getScopedValue(scope, ["layout", "hero", "size"])) != null ? _g : this._getScopedValue(scope, ["layout", "label", "hero_size"])) != null ? _h : "";
          }
          if (key === "value_size") {
            return (_i = this._getScopedValue(scope, ["layout", "hero", "value_size"])) != null ? _i : "";
          }
          return "";
        }
        _getEffectiveScopedLayoutValue(scope, key) {
          if (key === "height") {
            return this._getEffectiveScopedDisplayValue(scope, ["layout", "height"], [["height"]]);
          }
          if (key === "position") {
            return this._getEffectiveScopedDisplayValue(scope, ["layout", "label", "position"], [["label_position"]]);
          }
          if (key === "width") {
            return this._getEffectiveScopedDisplayValue(scope, ["layout", "label", "width"], [["label_width"]]);
          }
          if (key === "hero_size") {
            return this._getEffectiveScopedDisplayValue(scope, ["layout", "hero", "size"], [["layout", "label", "hero_size"]]);
          }
          if (key === "value_size") {
            return this._getEffectiveScopedDisplayValue(scope, ["layout", "hero", "value_size"]);
          }
          return "";
        }
        _setScopedLayoutLabelPosition(scope, value) {
          if (!value) {
            return this._removeCanonicalScopedValue(scope, ["layout", "label", "position"], {
              deprecatedKeys: [["label_position"]],
              prunePaths: [["layout", "label"], ["layout"]],
              rerender: true
            });
          }
          const didSet = this._setCanonicalScopedValue(scope, ["layout", "label", "position"], value, {
            deprecatedKeys: [["label_position"]],
            prunePaths: [["layout", "label"], ["layout"]],
            rerender: true
          });
          if (!didSet || value === "hero") return didSet;
          this._removeCanonicalScopedValue(scope, ["layout", "label", "hero_size"], {
            prunePaths: [["layout", "label"], ["layout"]],
            rerender: true
          });
          this._removeCanonicalScopedValue(scope, ["layout", "hero"], {
            prunePaths: [["layout"]],
            rerender: true
          });
          return true;
        }
        _setLayoutLabelPosition(value) {
          return this._setScopedLayoutLabelPosition({ type: "card" }, value);
        }
        _setScopedLayoutHeroSize(scope, value) {
          if (!value) {
            return this._removeCanonicalScopedValue(scope, ["layout", "hero", "size"], {
              deprecatedKeys: [["layout", "label", "hero_size"]],
              prunePaths: [["layout", "hero"], ["layout"]]
            });
          }
          return this._setCanonicalScopedValue(scope, ["layout", "hero", "size"], value, {
            deprecatedKeys: [["layout", "label", "hero_size"]],
            prunePaths: [["layout", "hero"], ["layout"]]
          });
        }
        _setLayoutHeroSize(value) {
          return this._setScopedLayoutHeroSize({ type: "card" }, value);
        }
        _normalizeHeroValueSizeValue(value) {
          const numericValue = this._normalizeNumberValue(value);
          if (numericValue === null) return null;
          return Math.min(112, Math.max(12, numericValue));
        }
        _setScopedLayoutHeroValueSize(scope, value) {
          if (value === "" || value === null || value === void 0) {
            return this._removeCanonicalScopedValue(scope, ["layout", "hero", "value_size"], {
              prunePaths: [["layout", "hero"], ["layout"]]
            });
          }
          const valueSize = this._normalizeHeroValueSizeValue(value);
          if (valueSize === null) return false;
          return this._setCanonicalScopedValue(scope, ["layout", "hero", "value_size"], valueSize, {
            prunePaths: [["layout", "hero"], ["layout"]]
          });
        }
        _setLayoutHeroValueSize(value) {
          return this._setScopedLayoutHeroValueSize({ type: "card" }, value);
        }
        _setScopedLayoutHeight(scope, value) {
          const numericValue = this._normalizeNumberValue(value);
          if (value === "" || value === null || value === void 0) {
            return this._removeCanonicalScopedValue(scope, ["layout", "height"], {
              deprecatedKeys: [["height"]],
              prunePaths: [["layout"]]
            });
          }
          if (numericValue === null || numericValue < 24) {
            return false;
          }
          return this._setCanonicalScopedValue(scope, ["layout", "height"], numericValue, {
            deprecatedKeys: [["height"]],
            prunePaths: [["layout"]]
          });
        }
        _setLayoutHeight(value) {
          return this._setScopedLayoutHeight({ type: "card" }, value);
        }
        _setScopedLayoutLabelWidth(scope, value) {
          const numericValue = this._normalizeNumberValue(value);
          if (value === "" || value === null || value === void 0) {
            return this._removeCanonicalScopedValue(scope, ["layout", "label", "width"], {
              deprecatedKeys: [["label_width"]],
              prunePaths: [["layout", "label"], ["layout"]]
            });
          }
          if (numericValue === null) {
            return false;
          }
          return this._setCanonicalScopedValue(scope, ["layout", "label", "width"], numericValue, {
            deprecatedKeys: [["label_width"]],
            prunePaths: [["layout", "label"], ["layout"]]
          });
        }
        _clearLayoutOverride(scope) {
          return this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._deletePathValue(target, ["layout", "height"]);
            nextTarget = this._deletePathValue(nextTarget, ["layout", "label", "position"]);
            nextTarget = this._deletePathValue(nextTarget, ["layout", "label", "hero_size"]);
            nextTarget = this._deletePathValue(nextTarget, ["layout", "label", "width"]);
            nextTarget = this._deletePathValue(nextTarget, ["layout", "hero"]);
            nextTarget = this._deletePathValue(nextTarget, ["height"]);
            nextTarget = this._deletePathValue(nextTarget, ["label_position"]);
            nextTarget = this._deletePathValue(nextTarget, ["label_width"]);
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["layout", "label"]);
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["layout"]);
            return nextTarget;
          }, { rerender: true });
        }
        _hasLayoutOverride(scope) {
          var _a, _b;
          const layoutValue = (_a = this._getScopedValue(scope, ["layout"])) != null ? _a : {};
          const labelValue = this._isObject(layoutValue) ? (_b = layoutValue.label) != null ? _b : {} : {};
          if (this._isObject(layoutValue) && (Object.prototype.hasOwnProperty.call(layoutValue, "height") || this._isObject(labelValue) && (Object.prototype.hasOwnProperty.call(labelValue, "position") || Object.prototype.hasOwnProperty.call(labelValue, "hero_size") || Object.prototype.hasOwnProperty.call(labelValue, "width")))) {
            return true;
          }
          if (this._isObject(layoutValue) && this._isObject(layoutValue.hero) && Object.keys(layoutValue.hero).length) {
            return true;
          }
          return this._getScopedValue(scope, ["height"]) !== void 0 || this._getScopedValue(scope, ["label_position"]) !== void 0 || this._getScopedValue(scope, ["label_width"]) !== void 0;
        }
        _setScaleBound(key, value) {
          return setScalePart(this._createSectionContext(), { type: "card" }, key, "fixed", value);
        }
        _clearScaleOverride(scope) {
          return clearScaleOverride(this._createSectionContext(), scope);
        }
        _setBarFillStyle(value) {
          return this._setScopedBarFillStyle({ type: "card" }, value);
        }
        _setBarColor(value) {
          return this._setScopedBarColor({ type: "card" }, value);
        }
        _setGradientStops(...args) {
          return this._gradientStopsSection._setGradientStops(...args);
        }
        _setSegments(...args) {
          return this._segmentsSection._setSegments(...args);
        }
        _getDefaultGradientStops(...args) {
          return this._gradientStopsSection._getDefaultGradientStops(...args);
        }
        _normalizeGradientStopPosValue(...args) {
          return this._gradientStopsSection._normalizeGradientStopPosValue(...args);
        }
        _sanitizeGradientStopsForEmit(...args) {
          return this._gradientStopsSection._sanitizeGradientStopsForEmit(...args);
        }
        _getGradientStopDraftColorDefault(...args) {
          return this._gradientStopsSection._getGradientStopDraftColorDefault(...args);
        }
        _getNextSuggestedGradientStopPos(...args) {
          return this._gradientStopsSection._getNextSuggestedGradientStopPos(...args);
        }
        _getGradientStopsDraftKey(...args) {
          return this._gradientStopsSection._getGradientStopsDraftKey(...args);
        }
        _getGradientStopPosTextKey(...args) {
          return this._gradientStopsSection._getGradientStopPosTextKey(...args);
        }
        _getGradientStopPosText(...args) {
          return this._gradientStopsSection._getGradientStopPosText(...args);
        }
        _setGradientStopPosText(...args) {
          return this._gradientStopsSection._setGradientStopPosText(...args);
        }
        _clearGradientStopPosText(...args) {
          return this._gradientStopsSection._clearGradientStopPosText(...args);
        }
        _clearGradientStopScopeTextState(...args) {
          return this._gradientStopsSection._clearGradientStopScopeTextState(...args);
        }
        _getGradientStopsUiRows(...args) {
          return this._gradientStopsSection._getGradientStopsUiRows(...args);
        }
        _setGradientStopsUiRows(...args) {
          return this._gradientStopsSection._setGradientStopsUiRows(...args);
        }
        _getStoredScopedGradientStops(...args) {
          return this._gradientStopsSection._getStoredScopedGradientStops(...args);
        }
        _getFallbackGradientStops(...args) {
          return this._gradientStopsSection._getFallbackGradientStops(...args);
        }
        _createGradientStopDraftState(...args) {
          return this._gradientStopsSection._createGradientStopDraftState(...args);
        }
        _getGradientStopsDraftState(...args) {
          return this._gradientStopsSection._getGradientStopsDraftState(...args);
        }
        _setGradientStopsDraftState(...args) {
          return this._gradientStopsSection._setGradientStopsDraftState(...args);
        }
        _setGradientStopsDraftField(...args) {
          return this._gradientStopsSection._setGradientStopsDraftField(...args);
        }
        _getValidGradientDraftStop(...args) {
          return this._gradientStopsSection._getValidGradientDraftStop(...args);
        }
        _hasGradientStopDuplicate(...args) {
          return this._gradientStopsSection._hasGradientStopDuplicate(...args);
        }
        _canAddGradientStop(...args) {
          return this._gradientStopsSection._canAddGradientStop(...args);
        }
        _getGradientDraftValidationMessage(...args) {
          return this._gradientStopsSection._getGradientDraftValidationMessage(...args);
        }
        _isDefaultGradientStops(...args) {
          return this._gradientStopsSection._isDefaultGradientStops(...args);
        }
        _setScopedGradientStops(scope, stops, options = {}) {
          var _a;
          const sanitizedStops = this._sanitizeGradientStopsForEmit(stops);
          const shouldRemove = sanitizedStops.length < 2 || this._isDefaultGradientStops(sanitizedStops);
          const previousUiRowsJson = this._serializeConfig((_a = this._getGradientStopsUiRows(scope)) != null ? _a : []);
          this._clearGradientStopScopeTextState(scope);
          this._setGradientStopsUiRows(scope, sanitizedStops);
          const applied = this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._deletePathValue(target, ["gradient_stops"]);
            nextTarget = this._deletePathValue(nextTarget, ["bar", "gradient_stops"]);
            if (!shouldRemove) {
              nextTarget = this._setPathValue(nextTarget, ["bar", "gradient_stops"], sanitizedStops);
            }
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, options);
          if (applied === false && (options == null ? void 0 : options.rerender) && this._serializeConfig(sanitizedStops) !== previousUiRowsJson) {
            this._render();
          }
          if (applied !== false && !(options == null ? void 0 : options.rerender)) {
            this._refreshGradientDraftUi(scope);
          }
          return applied;
        }
        _clearGradientStopsOverride(...args) {
          return this._gradientStopsSection._clearGradientStopsOverride(...args);
        }
        _setScopedSegments(scope, segments, options = {}) {
          const nextSegments = (options == null ? void 0 : options.sort) === false ? this._cloneDeep(segments) : this._sortSegmentsForEditor(segments);
          const fallbackSegments = this._getFallbackSegments(scope);
          const shouldRemove = !Array.isArray(nextSegments) || !nextSegments.length || fallbackSegments.length > 0 && this._segmentsEqualForEditor(nextSegments, fallbackSegments);
          this._setSegmentsUiRows(scope, nextSegments);
          const applied = this._applyScopedMutation(scope, (target) => {
            let nextTarget = this._deletePathValue(target, ["bar", "segments"]);
            nextTarget = this._deletePathValue(nextTarget, ["segments"]);
            nextTarget = this._deletePathValue(nextTarget, ["severity"]);
            if (!shouldRemove) {
              nextTarget = this._setPathValue(nextTarget, ["bar", "segments"], nextSegments);
            }
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["bar"]);
            return nextTarget;
          }, options);
          if (applied !== false) {
            this._refreshSegmentUi(scope);
          }
          return applied;
        }
        _clearSegmentsOverride(...args) {
          return this._segmentsSection._clearSegmentsOverride(...args);
        }
        _setNeedle(...args) {
          return this._needleSection._setNeedle(...args);
        }
        _getScopedPeakConfig(...args) {
          return this._extremaSection._getScopedPeakConfig(...args);
        }
        _getEffectiveScopedPeakConfig(...args) {
          return this._extremaSection._getEffectiveScopedPeakConfig(...args);
        }
        _hasPeakOverride(...args) {
          return this._extremaSection._hasPeakOverride(...args);
        }
        _getPeakSummary(...args) {
          return this._extremaSection._getPeakSummary(...args);
        }
        _clearPeakOverride(...args) {
          return this._extremaSection._clearPeakOverride(...args);
        }
        _setScopedPeakEnabled(...args) {
          return this._extremaSection._setScopedPeakEnabled(...args);
        }
        _setScopedPeakColor(...args) {
          return this._extremaSection._setScopedPeakColor(...args);
        }
        _getScopedMarkerExtras(...args) {
          return this._extremaSection._getScopedMarkerExtras(...args);
        }
        _hasExtremumOverride(...args) {
          return this._extremaSection._hasExtremumOverride(...args);
        }
        _getEffectiveMarkerExtras(...args) {
          return this._extremaSection._getEffectiveMarkerExtras(...args);
        }
        _getScopedFloorConfig(...args) {
          return this._extremaSection._getScopedFloorConfig(...args);
        }
        _getEffectiveScopedFloorConfig(...args) {
          return this._extremaSection._getEffectiveScopedFloorConfig(...args);
        }
        _getFloorSummary(...args) {
          return this._extremaSection._getFloorSummary(...args);
        }
        _getMarkerResetSummary(...args) {
          return this._extremaSection._getMarkerResetSummary(...args);
        }
        _getCardTargetMarkerSummary(...args) {
          return this._targetSection._getCardTargetMarkerSummary(...args);
        }
        _setScopedExtremumEnabled(...args) {
          return this._extremaSection._setScopedExtremumEnabled(...args);
        }
        _setScopedExtremumColor(...args) {
          return this._extremaSection._setScopedExtremumColor(...args);
        }
        _setScopedExtremumReset(...args) {
          return this._extremaSection._setScopedExtremumReset(...args);
        }
        _setScopedExtremumLabelShow(...args) {
          return this._extremaSection._setScopedExtremumLabelShow(...args);
        }
        _setScopedExtremumLabelDecimal(...args) {
          return this._extremaSection._setScopedExtremumLabelDecimal(...args);
        }
        _getBuiltinMarkerLabelOptions(scope, key) {
          const show = key === "target" ? this._getEffectiveTargetLabelShowValue(scope) : this._getEffectiveMarkerExtras(scope, key).labelShow;
          return getBuiltinMarkerLabelOptions(this._createSectionContext(), scope, key, show);
        }
        _renderBuiltinMarkerLabelControls(scope, key, title) {
          return renderBuiltinMarkerLabelControls(scope, key, title, this._getBuiltinMarkerLabelOptions(scope, key));
        }
        _setBuiltinMarkerLabelField(...args) {
          return setBuiltinMarkerLabelField(this._createSectionContext(), ...args);
        }
        _clearFloorOverride(...args) {
          return this._extremaSection._clearFloorOverride(...args);
        }
        _setFixedMarkerValue(rootKey, enabled, value) {
          const numericValue = this._normalizeNumberValue(value);
          if (!enabled || numericValue === null) {
            return this._removeCanonicalScopedValue({ type: "card" }, [rootKey, "at", "fixed"], {
              deprecatedKeys: rootKey === "target" ? [["target_entity"]] : [],
              prunePaths: [[rootKey, "at"], [rootKey]]
            });
          }
          return this._setCanonicalScopedValue({ type: "card" }, [rootKey, "at", "fixed"], numericValue, {
            deprecatedKeys: rootKey === "target" ? [["target_entity"]] : [],
            prunePaths: [[rootKey, "at"], [rootKey]]
          });
        }
        _setPeakShow(...args) {
          return this._extremaSection._setPeakShow(...args);
        }
        _readFixedMarker(rootKey) {
          const rawValue = this._draftConfig[rootKey];
          if (this._isObject(rawValue)) {
            const fixed = this._isObject(rawValue == null ? void 0 : rawValue.at) ? rawValue.at.fixed : rawValue == null ? void 0 : rawValue.at;
            return {
              enabled: fixed !== void 0 && fixed !== null && fixed !== "",
              value: fixed != null ? fixed : ""
            };
          }
          return {
            enabled: rawValue !== void 0 && rawValue !== null && rawValue !== "",
            value: rawValue != null ? rawValue : ""
          };
        }
        _getGradientStopsValue(...args) {
          return this._gradientStopsSection._getGradientStopsValue(...args);
        }
        _getSegmentsValue(...args) {
          return this._segmentsSection._getSegmentsValue(...args);
        }
        _getSegmentsScopeKey(...args) {
          return this._segmentsSection._getSegmentsScopeKey(...args);
        }
        _getSegmentBoundaryTextKey(...args) {
          return this._segmentsSection._getSegmentBoundaryTextKey(...args);
        }
        _getSegmentBoundaryText(...args) {
          return this._segmentsSection._getSegmentBoundaryText(...args);
        }
        _setSegmentBoundaryText(...args) {
          return this._segmentsSection._setSegmentBoundaryText(...args);
        }
        _clearSegmentBoundaryText(...args) {
          return this._segmentsSection._clearSegmentBoundaryText(...args);
        }
        _clearSegmentScopeTextState(...args) {
          return this._segmentsSection._clearSegmentScopeTextState(...args);
        }
        _getSegmentsUiRows(...args) {
          return this._segmentsSection._getSegmentsUiRows(...args);
        }
        _setSegmentsUiRows(...args) {
          return this._segmentsSection._setSegmentsUiRows(...args);
        }
        _getSegmentDraftState(...args) {
          return this._segmentsSection._getSegmentDraftState(...args);
        }
        _setSegmentDraftState(...args) {
          return this._segmentsSection._setSegmentDraftState(...args);
        }
        _setSegmentDraftField(...args) {
          return this._segmentsSection._setSegmentDraftField(...args);
        }
        _isSegmentFillStyle(...args) {
          return this._segmentsSection._isSegmentFillStyle(...args);
        }
        _getDefaultSegments(...args) {
          return this._segmentsSection._getDefaultSegments(...args);
        }
        _getStoredScopedSegments(...args) {
          return this._segmentsSection._getStoredScopedSegments(...args);
        }
        _parseSegmentBoundaryInput(...args) {
          return this._segmentsSection._parseSegmentBoundaryInput(...args);
        }
        _formatSegmentBoundaryValue(...args) {
          return this._segmentsSection._formatSegmentBoundaryValue(...args);
        }
        _getSegmentDraftColorDefault(...args) {
          return this._segmentsSection._getSegmentDraftColorDefault(...args);
        }
        _getNewSegmentDefaults(...args) {
          return this._segmentsSection._getNewSegmentDefaults(...args);
        }
        _createSegmentDraftState(...args) {
          return this._segmentsSection._createSegmentDraftState(...args);
        }
        _normalizeSegmentForEditorComparison(...args) {
          return this._segmentsSection._normalizeSegmentForEditorComparison(...args);
        }
        _segmentsEqualForEditor(...args) {
          return this._segmentsSection._segmentsEqualForEditor(...args);
        }
        _getFallbackSegments(...args) {
          return this._segmentsSection._getFallbackSegments(...args);
        }
        _parseSegmentBoundaryText(...args) {
          return this._segmentsSection._parseSegmentBoundaryText(...args);
        }
        _compareSegmentBoundaries(...args) {
          return this._segmentsSection._compareSegmentBoundaries(...args);
        }
        _buildSegmentValidationRows(...args) {
          return this._segmentsSection._buildSegmentValidationRows(...args);
        }
        _getSegmentRowValidationMessage(...args) {
          return this._segmentsSection._getSegmentRowValidationMessage(...args);
        }
        _getValidSegmentDraft(...args) {
          return this._segmentsSection._getValidSegmentDraft(...args);
        }
        _canAddSegment(...args) {
          return this._segmentsSection._canAddSegment(...args);
        }
        _getSegmentDraftValidationMessage(...args) {
          return this._segmentsSection._getSegmentDraftValidationMessage(...args);
        }
        _getSegmentPreviewBoundaryValue(...args) {
          return this._segmentsSection._getSegmentPreviewBoundaryValue(...args);
        }
        _sortSegmentsForEditor(...args) {
          return this._segmentsSection._sortSegmentsForEditor(...args);
        }
        _getSegmentPreviewRows(...args) {
          return this._segmentsSection._getSegmentPreviewRows(...args);
        }
        _buildEditorSegmentPreviewStyle(...args) {
          return this._segmentsSection._buildEditorSegmentPreviewStyle(...args);
        }
        _getSegmentPreviewDomIds(...args) {
          return this._segmentsSection._getSegmentPreviewDomIds(...args);
        }
        _renderSegmentPreview(...args) {
          return this._segmentsSection._renderSegmentPreview(...args);
        }
        _refreshSegmentPreview(...args) {
          return this._segmentsSection._refreshSegmentPreview(...args);
        }
        _getSegmentDomIds(...args) {
          return this._segmentsSection._getSegmentDomIds(...args);
        }
        _refreshSegmentUi(...args) {
          return this._segmentsSection._refreshSegmentUi(...args);
        }
        _commitSegmentDraft(...args) {
          return this._segmentsSection._commitSegmentDraft(...args);
        }
        _commitSegmentBoundaryEdit(...args) {
          return this._segmentsSection._commitSegmentBoundaryEdit(...args);
        }
        _commitGradientStopDraft(...args) {
          return this._gradientStopsSection._commitGradientStopDraft(...args);
        }
        _getGradientPreviewDomIds(...args) {
          return this._gradientStopsSection._getGradientPreviewDomIds(...args);
        }
        _refreshGradientDraftUi(...args) {
          return this._gradientStopsSection._refreshGradientDraftUi(...args);
        }
        _commitGradientStopPosEdit(...args) {
          return this._gradientStopsSection._commitGradientStopPosEdit(...args);
        }
        _getFillStyleValue() {
          return getEffectiveFillStyleValue(this._createSectionContext(), { type: "card" });
        }
        _getFillStyleFromColorMode(colorMode) {
          return getFillStyleFromColorMode(colorMode);
        }
        _getScopedFillStyleValue(scope) {
          return getFillStyleValue(this._createSectionContext(), scope);
        }
        _getEffectiveScopedFillStyleValue(scope) {
          return getEffectiveFillStyleValue(this._createSectionContext(), scope);
        }
        _setScopedBarFillStyle(scope, rawValue) {
          return setBarFillStyle(this._createSectionContext(), scope, rawValue);
        }
        _getScopedBarColorValue(scope) {
          return getBarColorValue(this._createSectionContext(), scope);
        }
        _getEffectiveScopedBarColorValue(scope) {
          return getEffectiveBarColorValue(this._createSectionContext(), scope);
        }
        _setScopedBarColor(scope, rawValue) {
          return setBarColor(this._createSectionContext(), scope, rawValue);
        }
        _getScopedBarSolidFillValue(scope) {
          return getBarSolidFillValue(this._createSectionContext(), scope);
        }
        _getEffectiveScopedBarSolidFillValue(scope) {
          return getEffectiveBarSolidFillValue(this._createSectionContext(), scope);
        }
        _setScopedBarSolidFill(scope, value) {
          return setBarSolidFill(this._createSectionContext(), scope, value);
        }
        _clearEntityBarAppearance(scope) {
          return clearBarAppearanceOverride(this._createSectionContext(), scope);
        }
        _hasEntityBarAppearanceOverride(scope) {
          return hasBarAppearanceOverride(this._createSectionContext(), scope);
        }
        _getScopedNeedleConfig(...args) {
          return this._needleSection._getScopedNeedleConfig(...args);
        }
        _hasNeedleOverride(...args) {
          return this._needleSection._hasNeedleOverride(...args);
        }
        _getEffectiveScopedNeedleConfig(...args) {
          return this._needleSection._getEffectiveScopedNeedleConfig(...args);
        }
        _setScopedNeedleMode(...args) {
          return this._needleSection._setScopedNeedleMode(...args);
        }
        _setScopedNeedleColor(...args) {
          return this._needleSection._setScopedNeedleColor(...args);
        }
        _getNeedleValue(...args) {
          return this._needleSection._getNeedleValue(...args);
        }
        _getPeakShowValue(...args) {
          return this._extremaSection._getPeakShowValue(...args);
        }
        _getScaleFixedValue(key, fallbackKey) {
          return getScaleFixedValue(this._createSectionContext(), key);
        }
        _getScaleEntityValue(key) {
          return getScaleEntityValue(this._createSectionContext(), key);
        }
        _getTargetResolvableValue(...args) {
          return this._targetSection._getTargetResolvableValue(...args);
        }
        _getEffectiveTargetResolvableValue(...args) {
          return this._targetSection._getEffectiveTargetResolvableValue(...args);
        }
        _getTargetMode(...args) {
          return this._targetSection._getTargetMode(...args);
        }
        _getTargetShapeValue(...args) {
          return this._targetSection._getTargetShapeValue(...args);
        }
        _getEffectiveMarkerDirection(...args) {
          return getEffectiveMarkerDirection(this._createSectionContext(), ...args);
        }
        _setMarkerDirection(...args) {
          return setMarkerDirection(this._createSectionContext(), ...args);
        }
        _hasTargetShape(...args) {
          return this._targetSection._hasTargetShape(...args);
        }
        _getEffectiveTargetShapeValue(...args) {
          return this._targetSection._getEffectiveTargetShapeValue(...args);
        }
        _setTargetShape(...args) {
          return this._targetSection._setTargetShape(...args);
        }
        _getEffectiveTargetMode(...args) {
          return this._targetSection._getEffectiveTargetMode(...args);
        }
        _setTargetMode(...args) {
          return this._targetSection._setTargetMode(...args);
        }
        _setTargetResolvablePart(...args) {
          return this._targetSection._setTargetResolvablePart(...args);
        }
        _clearTargetOverride(...args) {
          return this._targetSection._clearTargetOverride(...args);
        }
        _getTargetColorValue(...args) {
          return this._targetSection._getTargetColorValue(...args);
        }
        _getEffectiveTargetColorValue(...args) {
          return this._targetSection._getEffectiveTargetColorValue(...args);
        }
        _hasCustomTargetColor(...args) {
          return this._targetSection._hasCustomTargetColor(...args);
        }
        _setTargetColor(...args) {
          return this._targetSection._setTargetColor(...args);
        }
        _getTargetLabelShowValue(...args) {
          return this._targetSection._getTargetLabelShowValue(...args);
        }
        _getEffectiveTargetLabelShowValue(...args) {
          return this._targetSection._getEffectiveTargetLabelShowValue(...args);
        }
        _setTargetLabelShow(...args) {
          return this._targetSection._setTargetLabelShow(...args);
        }
        _getTargetLabelDecimalValue(...args) {
          return this._targetSection._getTargetLabelDecimalValue(...args);
        }
        _getEffectiveTargetLabelDecimalValue(...args) {
          return this._targetSection._getEffectiveTargetLabelDecimalValue(...args);
        }
        _setTargetLabelDecimal(...args) {
          return this._targetSection._setTargetLabelDecimal(...args);
        }
        _getTargetAboveFillColorValue(...args) {
          return this._targetSection._getTargetAboveFillColorValue(...args);
        }
        _getTargetAboveFillDraftKey(...args) {
          return this._targetSection._getTargetAboveFillDraftKey(...args);
        }
        _setTargetAboveFillDraft(...args) {
          return this._targetSection._setTargetAboveFillDraft(...args);
        }
        _getTargetAboveFillDraft(...args) {
          return this._targetSection._getTargetAboveFillDraft(...args);
        }
        _getBaselineColorDraftKey(...args) {
          return this._baselineSection._getBaselineColorDraftKey(...args);
        }
        _setBaselineColorDraft(...args) {
          return this._baselineSection._setBaselineColorDraft(...args);
        }
        _getBaselineColorDraft(...args) {
          return this._baselineSection._getBaselineColorDraft(...args);
        }
        _getEffectiveTargetAboveFillColorValue(...args) {
          return this._targetSection._getEffectiveTargetAboveFillColorValue(...args);
        }
        _setTargetAboveFillColor(...args) {
          return this._targetSection._setTargetAboveFillColor(...args);
        }
        _isTargetAboveFillEnabled(...args) {
          return this._targetSection._isTargetAboveFillEnabled(...args);
        }
        _setTargetAboveFillEnabled(...args) {
          return this._targetSection._setTargetAboveFillEnabled(...args);
        }
        _isBaselineDirectionalColorEnabled(...args) {
          return this._baselineSection._isBaselineDirectionalColorEnabled(...args);
        }
        _setBaselineDirectionalColorEnabled(...args) {
          return this._baselineSection._setBaselineDirectionalColorEnabled(...args);
        }
        _hasTargetOverride(...args) {
          return this._targetSection._hasTargetOverride(...args);
        }
        _getBaselineResolvableValue(...args) {
          return this._baselineSection._getBaselineResolvableValue(...args);
        }
        _getEffectiveBaselineResolvableValue(...args) {
          return this._baselineSection._getEffectiveBaselineResolvableValue(...args);
        }
        _getBaselineMode(...args) {
          return this._baselineSection._getBaselineMode(...args);
        }
        _getEffectiveBaselineMode(...args) {
          return this._baselineSection._getEffectiveBaselineMode(...args);
        }
        _setBaselineMode(...args) {
          return this._baselineSection._setBaselineMode(...args);
        }
        _persistBaselineSourcePart(scope, part, rawValue) {
          const normalizedValue = part === "fixed" ? this._normalizeNumberValue(rawValue) : this._normalizeTextValue(rawValue).trim();
          return this._applyScopedMutation(scope, (target) => {
            const currentParts = this._getResolvablePartsFromTarget(target != null ? target : {}, "baseline", {
              canonicalBasePath: ["baseline", "at"],
              legacyFixedPath: ["baseline"],
              legacyEntityPath: ["baseline", "at", "entity"]
            });
            const nextParts = { ...currentParts };
            if (part === "fixed") {
              if (rawValue === "" || rawValue === null || rawValue === void 0 || normalizedValue === null) {
                delete nextParts.fixed;
              } else {
                nextParts.fixed = normalizedValue;
              }
            } else if (!normalizedValue) {
              delete nextParts.entity;
            } else {
              nextParts.entity = normalizedValue;
            }
            let nextTarget = this._cloneDeep(target);
            nextTarget = this._deletePathValue(nextTarget, ["baseline", "at"]);
            const hasFixed = nextParts.fixed !== void 0 && nextParts.fixed !== null && nextParts.fixed !== "";
            const hasEntity = nextParts.entity !== void 0 && nextParts.entity !== null && nextParts.entity !== "";
            if (hasFixed || hasEntity) {
              const nextValue = {};
              if (hasFixed) nextValue.fixed = nextParts.fixed;
              if (hasEntity) nextValue.entity = nextParts.entity;
              nextTarget = this._setPathValue(nextTarget, ["baseline", "at"], nextValue);
            }
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["baseline", "at"]);
            nextTarget = this._pruneEmptyObjectsInTarget(nextTarget, ["baseline"]);
            return nextTarget;
          });
        }
        _setBaselineResolvablePart(...args) {
          return this._baselineSection._setBaselineResolvablePart(...args);
        }
        _removeScopedNeedle(...args) {
          return this._needleSection._removeScopedNeedle(...args);
        }
        _setBaselineDirectionalColor(...args) {
          return this._baselineSection._setBaselineDirectionalColor(...args);
        }
        _getBaselineDirectionalColorValue(...args) {
          return this._baselineSection._getBaselineDirectionalColorValue(...args);
        }
        _getEffectiveBaselineDirectionalColorValue(...args) {
          return this._baselineSection._getEffectiveBaselineDirectionalColorValue(...args);
        }
        _clearBaselineOverride(...args) {
          return this._baselineSection._clearBaselineOverride(...args);
        }
        _removeBaseline(...args) {
          return this._baselineSection._removeBaseline(...args);
        }
        _hasBaselineOverride(...args) {
          return this._baselineSection._hasBaselineOverride(...args);
        }
        _isEntityOverrideExpanded(index) {
          return this._expandedEntityOverrides.has(index);
        }
        _toggleEntityOverrideExpanded(index) {
          if (this._expandedEntityOverrides.has(index)) {
            this._expandedEntityOverrides.delete(index);
          } else {
            this._expandedEntityOverrides.add(index);
          }
          this._render();
        }
        _syncExpandedEntityOverrides(entityCount) {
          const nextExpanded = /* @__PURE__ */ new Set();
          this._expandedEntityOverrides.forEach((index) => {
            if (index < entityCount) nextExpanded.add(index);
          });
          this._expandedEntityOverrides = nextExpanded;
          const nextGroups = /* @__PURE__ */ new Set();
          this._expandedOverrideGroups.forEach((key) => {
            const [indexText, group] = String(key).split(":");
            const index = Number(indexText);
            if (Number.isInteger(index) && index < entityCount && group) {
              nextGroups.add(`${index}:${group}`);
            }
          });
          this._expandedOverrideGroups = nextGroups;
        }
        _isCardGroupExpanded(group) {
          return this._expandedCardGroups.has(group);
        }
        _toggleCardGroupExpanded(group) {
          if (this._expandedCardGroups.has(group)) {
            this._expandedCardGroups.delete(group);
          } else {
            this._expandedCardGroups.add(group);
          }
          this._render();
        }
        _toggleGenericMarkerExpanded(...args) {
          return this._referenceMarkersSection._toggleGenericMarkerExpanded(...args);
        }
        _getOverrideGroupKey(index, group) {
          return `${index}:${group}`;
        }
        _isOverrideGroupExpanded(index, group) {
          return this._expandedOverrideGroups.has(this._getOverrideGroupKey(index, group));
        }
        _toggleOverrideGroupExpanded(index, group) {
          const key = this._getOverrideGroupKey(index, group);
          if (this._expandedOverrideGroups.has(key)) {
            this._expandedOverrideGroups.delete(key);
          } else {
            this._expandedOverrideGroups.add(key);
          }
          this._render();
        }
        _hasExplicitOverrideValue(...args) {
          return hasExplicitOverrideValue(...args);
        }
        _hasResolvableOverride(...args) {
          return hasResolvableOverride(...args);
        }
        _getScaleOverrideSummary(scope) {
          return getScaleOverrideSummary(this._createSectionContext(), scope);
        }
        _getLayoutSummary(scope) {
          const parts = [];
          const height = this._getScopedLayoutValue(scope, "height");
          const position = this._getScopedLayoutValue(scope, "position");
          const width = this._getScopedLayoutValue(scope, "width");
          if (height !== "") parts.push(`Height ${height}`);
          if (position !== "") parts.push(`${position}`);
          if (width !== "") parts.push(`Width ${width}`);
          return parts.length ? parts.join(" \u2022 ") : "Inherited";
        }
        _getTargetOverrideSummary(...args) {
          return this._targetSection._getTargetOverrideSummary(...args);
        }
        _getBaselineOverrideSummary(...args) {
          return this._baselineSection._getBaselineOverrideSummary(...args);
        }
        _getCardBaselineSummary(...args) {
          return this._baselineSection._getCardBaselineSummary(...args);
        }
        _getBarAppearanceSummary(scope) {
          return getBarAppearanceSummary(this._createSectionContext(), scope);
        }
        _getScopedSegmentsValue(...args) {
          return this._segmentsSection._getScopedSegmentsValue(...args);
        }
        _hasSegmentsOverride(...args) {
          return this._segmentsSection._hasSegmentsOverride(...args);
        }
        _getSegmentsSummary(...args) {
          return this._segmentsSection._getSegmentsSummary(...args);
        }
        _getEffectiveFillStyleValue(scope) {
          return getEffectiveFillStyleValue(this._createSectionContext(), scope);
        }
        _getScopedGradientStopsValue(...args) {
          return this._gradientStopsSection._getScopedGradientStopsValue(...args);
        }
        _hasGradientStopsOverride(...args) {
          return this._gradientStopsSection._hasGradientStopsOverride(...args);
        }
        _getGradientStopsSummary(...args) {
          return this._gradientStopsSection._getGradientStopsSummary(...args);
        }
        _buildGradientPreviewEffectiveStops(...args) {
          return this._gradientStopsSection._buildGradientPreviewEffectiveStops(...args);
        }
        _buildEditorGradientPreviewStyle(...args) {
          return this._gradientStopsSection._buildEditorGradientPreviewStyle(...args);
        }
        _getGradientPreviewStyle(...args) {
          return this._gradientStopsSection._getGradientPreviewStyle(...args);
        }
        _renderGradientPreview(...args) {
          return this._gradientStopsSection._renderGradientPreview(...args);
        }
        _getNeedleSummary(...args) {
          return this._needleSection._getNeedleSummary(...args);
        }
        _getFormattingSummary(scope) {
          return getFormattingSummary(this._createSectionContext(), scope);
        }
        _renderOverrideGroup({ index, group, title, summary, content }) {
          const expanded = this._isOverrideGroupExpanded(index, group);
          return `
      <div class="override-group" data-group="${group}" data-expanded="${expanded ? "true" : "false"}">
        <button
          type="button"
          id="entity-${index}-group-${group}"
          class="override-group-toggle"
          data-action="toggle-override-group"
          data-index="${index}"
          data-group="${group}"
          aria-expanded="${expanded ? "true" : "false"}"
        >
          <span
            id="entity-${index}-group-${group}-title"
            class="override-group-title"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${expanded ? "\u25BE" : "\u25B8"} ${title}</span>
          <span
            id="entity-${index}-group-${group}-summary"
            class="override-group-summary"
            data-action="toggle-override-group"
            data-index="${index}"
            data-group="${group}"
          >${this._escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? "grid" : "none"};">
          ${content}
        </div>
      </div>
    `;
        }
        _renderCardGroup(options) {
          return renderCardGroup(options, this._isCardGroupExpanded(options.group));
        }
        _renderEntityInput(entry, index) {
          return renderEntityInput(entry, index);
        }
        _renderEntitySourceInput(kind, index, value, placeholder = "sensor.example", extraDataset = {}) {
          return renderEntitySourceInput(kind, index, value, placeholder, extraDataset);
        }
        _hasMarkersOverride(...args) {
          return this._referenceMarkersSection._hasMarkersOverride(...args);
        }
        _getGenericMarkers(...args) {
          return this._referenceMarkersSection._getGenericMarkers(...args);
        }
        _getGenericMarkersSummary(...args) {
          return this._referenceMarkersSection._getGenericMarkersSummary(...args);
        }
        _getGenericMarkerScopeKey(...args) {
          return this._referenceMarkersSection._getGenericMarkerScopeKey(...args);
        }
        _getGenericMarkerUiIds(...args) {
          return this._referenceMarkersSection._getGenericMarkerUiIds(...args);
        }
        _resetGenericMarkerUiScope(...args) {
          return this._referenceMarkersSection._resetGenericMarkerUiScope(...args);
        }
        _getGenericMarkerSummary(...args) {
          return this._referenceMarkersSection._getGenericMarkerSummary(...args);
        }
        _refreshGenericMarkerSummary(...args) {
          return this._referenceMarkersSection._refreshGenericMarkerSummary(...args);
        }
        _getGenericMarkerSource(...args) {
          return this._referenceMarkersSection._getGenericMarkerSource(...args);
        }
        _renderGenericMarkersEditor(...args) {
          return this._referenceMarkersSection._renderGenericMarkersEditor(...args);
        }
        _getGenericMarkerScope(...args) {
          return this._referenceMarkersSection._getGenericMarkerScope(...args);
        }
        _setGenericMarkerList(...args) {
          return this._referenceMarkersSection._setGenericMarkerList(...args);
        }
        _updateGenericMarker(...args) {
          return this._referenceMarkersSection._updateGenericMarker(...args);
        }
        _setGenericMarkerSourceMode(...args) {
          return this._referenceMarkersSection._setGenericMarkerSourceMode(...args);
        }
        _setGenericMarkerField(...args) {
          return this._referenceMarkersSection._setGenericMarkerField(...args);
        }
        _cleanupGenericMarkersForEmit(target) {
          if (!this._isObject(target) || !Array.isArray(target.markers)) return target;
          const nextTarget = this._cloneDeep(target);
          nextTarget.markers = nextTarget.markers.map((rawMarker) => {
            var _a;
            if (!this._isObject(rawMarker)) return rawMarker;
            const marker = this._cloneDeep(rawMarker);
            if (marker.show_marker === true) delete marker.show_marker;
            if (this._isObject(marker.at)) {
              const at = this._cloneDeep(marker.at);
              const fixed = this._normalizeNumberValue(at.fixed);
              const entity = this._normalizeTextValue(at.entity).trim();
              if (fixed !== null) at.fixed = fixed;
              else delete at.fixed;
              if (entity) at.entity = entity;
              else delete at.entity;
              if (Object.keys(at).length) marker.at = at;
              else delete marker.at;
            }
            if (marker.lane === "below") delete marker.lane;
            if (marker.shape === "circle") delete marker.shape;
            if (marker.direction === "inward") delete marker.direction;
            if (this._normalizeColorComparisonValue(marker.color) === this._normalizeColorComparisonValue("#888888")) delete marker.color;
            if (this._isObject(marker.label)) {
              const label = this._cloneDeep(marker.label);
              if (label.show === false) delete label.show;
              if (label.show_value === true) delete label.show_value;
              if (label.show_unit === true) delete label.show_unit;
              if (typeof label.text === "string") {
                label.text = label.text.replace(/\s+/g, " ").trim();
                if (!label.text) delete label.text;
              }
              const precision = this._normalizeDecimalValue((_a = label.precision) != null ? _a : label.decimal);
              delete label.decimal;
              if (precision === null) delete label.precision;
              else label.precision = precision;
              delete label.unit;
              if (Object.keys(label).length) marker.label = label;
              else delete marker.label;
            }
            return marker;
          });
          return nextTarget;
        }
        _renderResetOptions(value) {
          return renderResetOptions(value);
        }
        _escapeAttribute(value) {
          return escapeAttribute(value);
        }
        _isHexColorValue(value) {
          return isHexColorValue(value);
        }
        _expandHexColor(value) {
          return expandHexColor(value);
        }
        _normalizeColorComparisonValue(value) {
          return normalizeColorComparisonValue(value);
        }
        _getColorPickerValue(value, fallbackHex = "#000000") {
          return getColorPickerValue(value, fallbackHex);
        }
        _renderColorInput(options) {
          return renderColorInput(options);
        }
        _renderListRows(items, renderItem) {
          return items.map((item, index) => renderItem(item, index)).join("");
        }
        _render() {
          var _a;
          if (!this.shadowRoot || this._isRendering) return;
          const numericFocus = this._numericDrafts.captureFocus(this.shadowRoot);
          this._isRendering = true;
          try {
            const entities = this._getEntitiesValue();
            const fillStyle = this._getFillStyleValue();
            const layoutLabelPosition = this._getScopedLayoutValue({ type: "card" }, "position") || "left";
            const layoutHeroSize = this._getScopedLayoutValue({ type: "card" }, "hero_size") || "medium";
            const layoutHeroValueSize = this._getScopedLayoutValue({ type: "card" }, "value_size");
            const layoutHeight = this._getScopedLayoutValue({ type: "card" }, "height");
            const layoutLabelWidth = this._getScopedLayoutValue({ type: "card" }, "width");
            this._syncExpandedEntityOverrides(entities.length);
            this.shadowRoot.innerHTML = `
	      <style>${editorStyles}</style>
	      <div class="editor">
	        <div class="section">
	          <div class="section-head">
	            <h3>Basics</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="title">Title</label>
              <input id="title" type="text" data-field="title" value="${this._escapeAttribute((_a = this._draftConfig.title) != null ? _a : "")}">
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
	                ${this._renderListRows(entities, (entry, index) => {
              var _a2, _b;
              return `
	                  <div class="entity-shell" data-entity-shell-index="${index}">
	                    <div class="entity-main">
	                      <div class="entity-header">
	                        <div class="entity-header-main">
	                          <div class="entity-title">Entity ${index + 1}</div>
	                          <div class="entity-subtitle">${this._escapeAttribute(entry.entity || "Configure entity")}</div>
	                        </div>
	                        <div class="entity-actions">
	                          <button type="button" data-action="move-entity-up" data-index="${index}"${index === 0 ? " disabled" : ""} aria-label="Move entity ${index + 1} up">\u2191</button>
	                          <button type="button" data-action="move-entity-down" data-index="${index}"${index === entities.length - 1 ? " disabled" : ""} aria-label="Move entity ${index + 1} down">\u2193</button>
	                          <button type="button" data-action="duplicate-entity" data-index="${index}">Duplicate</button>
	                          <button type="button" data-action="remove-entity" data-index="${index}"${entities.length <= 1 ? " disabled" : ""} aria-label="Remove" title="Remove">\u{1F5D1}</button>
	                        </div>
	                      </div>
	                      <div class="entity-fields">
	                        ${this._renderEntityInput(entry, index)}
	                        <input type="text" data-kind="entity-name" data-index="${index}" value="${this._escapeAttribute((_a2 = entry.name) != null ? _a2 : "")}" placeholder="Name">
	                        <input type="text" data-kind="entity-icon" data-index="${index}" value="${this._escapeAttribute((_b = entry.icon) != null ? _b : "")}" placeholder="mdi:flash" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false">
	                      </div>
	                    </div>
	                    <button type="button" class="override-toggle" data-action="toggle-entity-overrides" data-index="${index}" aria-expanded="${this._isEntityOverrideExpanded(index) ? "true" : "false"}">
	                      ${this._isEntityOverrideExpanded(index) ? "\u25BE" : "\u25B8"} Overrides
	                    </button>
                    <div class="override-panel" style="display:${this._isEntityOverrideExpanded(index) ? "grid" : "none"};">
                      <div class="section-note">Overrides replace card defaults only for this entity.</div>
                      ${(() => {
                const scope = { type: "entity", index };
                const targetInherited = !this._hasTargetOverride(scope);
                const layoutInherited = !this._hasLayoutOverride(scope);
                const peakInherited = !this._hasPeakOverride(scope);
                const floorInherited = !this._hasExtremumOverride(scope, "floor");
                const scaleGroup = this._renderOverrideGroup({
                  index,
                  group: "scale",
                  title: "Scale",
                  summary: this._getScaleOverrideSummary(scope),
                  content: this._renderScaleSection(scope)
                });
                const layoutGroup = this._renderOverrideGroup({
                  index,
                  group: "layout",
                  title: "Layout",
                  summary: this._getLayoutSummary(scope),
                  content: `
	                      <div class="field-row">
	                        <div class="toggle">
	                          <input id="entity-${index}-layout-inherit" type="checkbox" data-kind="entity-layout-inherit" data-index="${index}"${layoutInherited ? " checked" : ""}>
                          <label for="entity-${index}-layout-inherit">Inherit card settings</label>
                        </div>
                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-height">Row height</label>
	                        <input id="entity-${index}-height" type="number" min="24" step="1" data-kind="entity-override-height" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, "height"))}" placeholder="inherit card default">
	                      </div>
	                      <div class="field-row">
	                        <label for="entity-${index}-label-position">Label position</label>
	                        <select id="entity-${index}-label-position" data-kind="entity-layout-label-position" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, "position"))}">
                          <option value=""${this._getEffectiveScopedLayoutValue(scope, "position") === "" ? " selected" : ""}>inherit card default</option>
                          <option value="left"${this._getEffectiveScopedLayoutValue(scope, "position") === "left" ? " selected" : ""}>left</option>
                          <option value="above"${this._getEffectiveScopedLayoutValue(scope, "position") === "above" ? " selected" : ""}>above</option>
                          <option value="inside"${this._getEffectiveScopedLayoutValue(scope, "position") === "inside" ? " selected" : ""}>inside</option>
                          <option value="hero"${this._getEffectiveScopedLayoutValue(scope, "position") === "hero" ? " selected" : ""}>hero</option>
                          <option value="off"${this._getEffectiveScopedLayoutValue(scope, "position") === "off" ? " selected" : ""}>off</option>
                        </select>
                      </div>
                      ${(this._getEffectiveScopedLayoutValue(scope, "position") || "") === "hero" ? `
                      <div class="field-row">
                        <label for="entity-${index}-label-hero-size">Hero size</label>
                        <select id="entity-${index}-label-hero-size" data-kind="entity-layout-label-hero-size" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, "hero_size") || "medium")}">
                          <option value="small"${(this._getEffectiveScopedLayoutValue(scope, "hero_size") || "medium") === "small" ? " selected" : ""}>small</option>
                          <option value="medium"${(this._getEffectiveScopedLayoutValue(scope, "hero_size") || "medium") === "medium" ? " selected" : ""}>medium</option>
                          <option value="large"${(this._getEffectiveScopedLayoutValue(scope, "hero_size") || "medium") === "large" ? " selected" : ""}>large</option>
                        </select>
                      </div>
                      <div class="field-row">
                        <label for="entity-${index}-hero-value-size">Maximum font size</label>
                        <input id="entity-${index}-hero-value-size" type="number" min="12" max="112" step="1" data-kind="entity-layout-hero-value-size" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, "value_size"))}" placeholder="use Hero size preset">
                        <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
                      </div>
                      ` : ""}
	                      <div class="field-row">
	                        <label for="entity-${index}-label-width">Label width</label>
	                        <input id="entity-${index}-label-width" type="number" step="1" data-kind="entity-layout-label-width" data-index="${index}" value="${this._escapeAttribute(this._getEffectiveScopedLayoutValue(scope, "width"))}" placeholder="inherit card default">
	                      </div>
	                          `
                });
                const barGroup = this._renderOverrideGroup({
                  index,
                  group: "bar",
                  title: "Bar Appearance",
                  summary: this._getBarAppearanceSummary(scope),
                  content: renderBarAppearanceSection(this._createSectionContext(), scope)
                });
                const needleGroup = this._renderOverrideGroup({
                  index,
                  group: "needle",
                  title: "Needle",
                  summary: this._getNeedleSummary(scope),
                  content: this._needleSection.render(scope)
                });
                const formattingGroup = this._renderOverrideGroup({
                  index,
                  group: "formatting",
                  title: "Formatting",
                  summary: this._getFormattingSummary(scope),
                  content: this._renderFormattingSection(scope)
                });
                const peakGroup = this._renderOverrideGroup({
                  index,
                  group: "peak",
                  title: "Peak",
                  summary: this._getPeakSummary(scope),
                  content: this._extremaSection.render(scope, "peak")
                });
                const floorGroup = this._renderOverrideGroup({
                  index,
                  group: "floor",
                  title: "Floor",
                  summary: this._getFloorSummary(scope),
                  content: this._extremaSection.render(scope, "floor")
                });
                const markersGroup = this._renderOverrideGroup({
                  index,
                  group: "markers",
                  title: "Reference markers",
                  summary: this._getGenericMarkersSummary(scope),
                  content: this._renderGenericMarkersEditor(scope)
                });
                const segmentsGroup = this._renderOverrideGroup({
                  index,
                  group: "segments",
                  title: "Segments",
                  summary: this._getSegmentsSummary(scope),
                  content: this._segmentsSection.render(scope)
                });
                const gradientStopsGroup = this._renderOverrideGroup({
                  index,
                  group: "gradient-stops",
                  title: "Gradient Stops",
                  summary: this._getGradientStopsSummary(scope),
                  content: this._gradientStopsSection.render(scope)
                });
                const baselineGroup = this._renderOverrideGroup({
                  index,
                  group: "baseline",
                  title: "Baseline",
                  summary: this._getBaselineOverrideSummary(scope),
                  content: this._baselineSection.render(scope)
                });
                const targetGroup = this._renderOverrideGroup({
                  index,
                  group: "target",
                  title: "Target",
                  summary: this._getTargetOverrideSummary(scope),
                  content: this._targetSection.render(scope)
                });
                return `
                          ${scaleGroup}
                          ${targetGroup}
                          ${peakGroup}
                          ${floorGroup}
                          ${markersGroup}
                          ${barGroup}
                          ${baselineGroup}
                          ${needleGroup}
	                          ${segmentsGroup}
	                          ${gradientStopsGroup}
	                          ${layoutGroup}
	                          ${formattingGroup}
	                        `;
              })()}
	                    </div>
                  </div>
                `;
            })}
                <button type="button" data-action="add-entity">Add entity</button>
              </div>
          </div>
	        </div>

${this._renderScaleSection({ type: "card" })}

${renderMarkersSection({
              renderGroup: (options) => this._renderCardGroup(options),
              target: { summary: this._getCardTargetMarkerSummary(), content: this._targetSection.render({ type: "card" }) },
              peak: { summary: this._getMarkerResetSummary("peak"), content: this._extremaSection.render({ type: "card" }, "peak") },
              floor: { summary: this._getMarkerResetSummary("floor"), content: this._extremaSection.render({ type: "card" }, "floor") },
              references: { summary: this._getGenericMarkersSummary({ type: "card" }), content: this._renderGenericMarkersEditor({ type: "card" }) }
            })}

${renderBarAppearanceSection(this._createSectionContext(), { type: "card" }, () => `${this._baselineSection.render({ type: "card" }, (options) => this._renderCardGroup(options))}${this._needleSection.render({ type: "card" })}`)}

${this._segmentsSection.render({ type: "card" }, (options) => this._renderCardGroup(options))}

${this._gradientStopsSection.render({ type: "card" }, (options) => this._renderCardGroup(options))}

	        <div class="section">
	          <div class="section-head">
	            <h3>Layout</h3>
	          </div>
	          <div class="inline-row editor-grid">
            <div class="field-row">
              <label for="layout-height">Row height</label>
              <input id="layout-height" type="number" min="24" step="1" data-field="layout-height" value="${this._escapeAttribute(layoutHeight)}">
            </div>
            <div class="field-row">
              <label for="layout-label-position">Label position</label>
              <select id="layout-label-position" data-field="layout-label-position" value="${this._escapeAttribute(layoutLabelPosition)}">
                <option value="left"${layoutLabelPosition === "left" ? " selected" : ""}>left</option>
                <option value="above"${layoutLabelPosition === "above" ? " selected" : ""}>above</option>
                <option value="inside"${layoutLabelPosition === "inside" ? " selected" : ""}>inside</option>
                <option value="hero"${layoutLabelPosition === "hero" ? " selected" : ""}>hero</option>
                <option value="off"${layoutLabelPosition === "off" ? " selected" : ""}>off</option>
              </select>
            </div>
            ${layoutLabelPosition === "hero" ? `
            <div class="field-row">
              <label for="layout-label-hero-size">Hero size</label>
              <select id="layout-label-hero-size" data-field="layout-label-hero-size" value="${this._escapeAttribute(layoutHeroSize)}">
                <option value="small"${layoutHeroSize === "small" ? " selected" : ""}>small</option>
                <option value="medium"${layoutHeroSize === "medium" ? " selected" : ""}>medium</option>
                <option value="large"${layoutHeroSize === "large" ? " selected" : ""}>large</option>
              </select>
            </div>
            <div class="field-row">
              <label for="layout-hero-value-size">Maximum font size</label>
              <input id="layout-hero-value-size" type="number" min="12" max="112" step="1" data-field="layout-hero-value-size" value="${this._escapeAttribute(layoutHeroValueSize)}" placeholder="use Hero size preset">
              <div class="section-note">The hero value may render smaller when needed to fit. A custom value overrides the Hero size preset.</div>
            </div>
            ` : ""}
            <div class="field-row">
              <label for="layout-label-width">Label width</label>
              <input id="layout-label-width" type="number" step="1" data-field="layout-label-width" value="${this._escapeAttribute(layoutLabelWidth)}">
            </div>
          </div>
	        </div>

${this._renderFormattingSection({ type: "card" })}
      </div>
    `;
            this._bindShadowListeners();
            this._syncEntityPickers();
            this._numericDrafts.apply(this.shadowRoot, numericFocus);
            this._lastRenderedConfigJson = this._serializeConfig(this._draftConfig);
            this._applyPendingFocus();
          } finally {
            this._isRendering = false;
          }
        }
        _bindShadowListeners() {
          if (!this.shadowRoot || this._shadowListenersAttached) return;
          this.shadowRoot.addEventListener("click", this._boundHandleClick);
          this.shadowRoot.addEventListener("change", this._boundHandleChange);
          this.shadowRoot.addEventListener("input", this._boundHandleInput);
          this.shadowRoot.addEventListener("value-changed", this._boundHandleValueChanged);
          this.shadowRoot.addEventListener("keydown", this._boundHandleKeydown);
          this._shadowListenersAttached = true;
        }
        _syncEntityPickers() {
          if (!this.shadowRoot) return;
          const entities = this._getEntitiesValue();
          const syncPicker = (picker) => {
            var _a, _b, _c, _d;
            const kind = picker.dataset.kind;
            const indexValue = picker.dataset.index;
            const index = Number(indexValue);
            picker.hass = this._hass;
            picker.allowCustomEntity = true;
            if (kind === "entity-picker") {
              const entry = entities[index];
              picker.value = (_a = entry == null ? void 0 : entry.entity) != null ? _a : "";
              picker.label = `Entity ${index + 1}`;
              return;
            }
            if (kind === "scale-min-entity-source") {
              picker.value = this._getScaleEntityValue("min");
              picker.label = "Min entity";
              return;
            }
            if (kind === "scale-max-entity-source") {
              picker.value = this._getScaleEntityValue("max");
              picker.label = "Max entity";
              return;
            }
            if (kind === "baseline-entity-source") {
              picker.value = this._getBaselineResolvableValue({ type: "card" }).entity;
              picker.label = "Baseline entity";
              return;
            }
            if (kind === "target-entity-source") {
              picker.value = this._getTargetResolvableValue({ type: "card" }).entity;
              picker.label = "Target entity";
              return;
            }
            if (kind === "entity-override-min-entity-source") {
              picker.value = this._getEffectiveResolvableScopedValue({ type: "entity", index }, "min").entity;
              picker.label = `Entity ${index + 1} min entity`;
              return;
            }
            if (kind === "entity-override-max-entity-source") {
              picker.value = this._getEffectiveResolvableScopedValue({ type: "entity", index }, "max").entity;
              picker.label = `Entity ${index + 1} max entity`;
              return;
            }
            if (kind === "entity-baseline-entity-source") {
              picker.value = this._getEffectiveBaselineResolvableValue({ type: "entity", index }).entity;
              picker.label = `Entity ${index + 1} baseline entity`;
              return;
            }
            if (kind === "entity-target-entity-source") {
              picker.value = this._getEffectiveTargetResolvableValue({ type: "entity", index }).entity;
              picker.label = `Entity ${index + 1} target entity`;
              return;
            }
            if (kind === "generic-marker-entity") {
              const scope = this._getGenericMarkerScope(picker);
              const marker = this._getGenericMarkers(scope)[Number(picker.dataset.markerIndex)];
              picker.value = (_b = this._getGenericMarkerSource(marker).entity) != null ? _b : "";
              picker.label = "Reference marker entity";
            }
            if (kind === "generic-marker-label-entity") {
              const scope = this._getGenericMarkerScope(picker);
              const marker = this._getGenericMarkers(scope)[Number(picker.dataset.markerIndex)];
              picker.value = (_d = (_c = marker == null ? void 0 : marker.label) == null ? void 0 : _c.entity) != null ? _d : "";
              picker.label = "Label content entity";
            }
          };
          [
            'ha-entity-picker[data-kind="entity-picker"]',
            'ha-entity-picker[data-kind="scale-min-entity-source"]',
            'ha-entity-picker[data-kind="scale-max-entity-source"]',
            'ha-entity-picker[data-kind="baseline-entity-source"]',
            'ha-entity-picker[data-kind="target-entity-source"]',
            'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
            'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
            'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
            'ha-entity-picker[data-kind="entity-target-entity-source"]',
            'ha-entity-picker[data-kind="generic-marker-entity"]',
            'ha-entity-picker[data-kind="generic-marker-label-entity"]'
          ].forEach((selector) => {
            this.shadowRoot.querySelectorAll(selector).forEach(syncPicker);
          });
          if (customElements.whenDefined) {
            customElements.whenDefined("ha-entity-picker").then(() => {
              [
                'ha-entity-picker[data-kind="entity-picker"]',
                'ha-entity-picker[data-kind="scale-min-entity-source"]',
                'ha-entity-picker[data-kind="scale-max-entity-source"]',
                'ha-entity-picker[data-kind="baseline-entity-source"]',
                'ha-entity-picker[data-kind="target-entity-source"]',
                'ha-entity-picker[data-kind="entity-override-min-entity-source"]',
                'ha-entity-picker[data-kind="entity-override-max-entity-source"]',
                'ha-entity-picker[data-kind="entity-baseline-entity-source"]',
                'ha-entity-picker[data-kind="entity-target-entity-source"]',
                'ha-entity-picker[data-kind="generic-marker-entity"]',
                'ha-entity-picker[data-kind="generic-marker-label-entity"]'
              ].forEach((selector) => {
                var _a;
                (_a = this.shadowRoot) == null ? void 0 : _a.querySelectorAll(selector).forEach(syncPicker);
              });
            }).catch(() => {
            });
          }
        }
        _handleClick(event) {
          var _a, _b, _c, _d, _e, _f;
          if (this._segmentsSection.handle(event, "click") || this._gradientStopsSection.handle(event, "click")) return;
          const target = (_c = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, "[data-action]")) != null ? _c : event.target;
          const action = (_d = target == null ? void 0 : target.dataset) == null ? void 0 : _d.action;
          if (!action) return;
          if (target == null ? void 0 : target.disabled) return;
          if (["move-entity-up", "move-entity-down", "duplicate-entity", "remove-entity"].includes(action)) this._numericDrafts.reset();
          if (action === "add-entity") {
            const nextEntities = [...this._getEntitiesValue(), { entity: "" }];
            const nextEntries = this._buildEntityConfigEntries(nextEntities);
            this._queuePostRenderFocus(`[data-kind="entity-picker"][data-index="${nextEntities.length - 1}"], [data-kind="entity-input"][data-index="${nextEntities.length - 1}"]`);
            if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
              let nextConfig = this._setPathValue(this._draftConfig, ["entities"], nextEntries);
              if (!Array.isArray(this._draftConfig.entities) && this._draftConfig.entity !== void 0) {
                nextConfig = this._deletePathValue(nextConfig, ["entity"]);
                if (this._draftConfig.name !== void 0) {
                  nextConfig = this._deletePathValue(nextConfig, ["name"]);
                }
                if (this._draftConfig.icon !== void 0) {
                  nextConfig = this._deletePathValue(nextConfig, ["icon"]);
                }
              }
              this._applyUserConfig(nextConfig, { rerender: true });
            } else {
              this._setValueAtPath(["entity"], (_f = (_e = nextEntities[0]) == null ? void 0 : _e.entity) != null ? _f : "", { rerender: true });
            }
            return;
          }
          if (action === "move-entity-up") {
            this._moveEntityRow(Number(target.dataset.index), -1);
            return;
          }
          if (action === "move-entity-down") {
            this._moveEntityRow(Number(target.dataset.index), 1);
            return;
          }
          if (action === "duplicate-entity") {
            const sourceIndex = Number(target.dataset.index);
            this._queuePostRenderFocus(`[data-kind="entity-name"][data-index="${sourceIndex + 1}"], [data-kind="entity-picker"][data-index="${sourceIndex + 1}"], [data-kind="entity-input"][data-index="${sourceIndex + 1}"]`);
            this._duplicateEntityRow(sourceIndex);
            return;
          }
          if (action === "toggle-entity-overrides") {
            this._toggleEntityOverrideExpanded(Number(target.dataset.index));
            return;
          }
          if (action === "toggle-override-group") {
            this._toggleOverrideGroupExpanded(Number(target.dataset.index), target.dataset.group);
            return;
          }
          if (action === "toggle-card-group") {
            this._toggleCardGroupExpanded(target.dataset.group);
            return;
          }
          if (action === "remove-entity") {
            this._removeEntityRow(Number(target.dataset.index));
            return;
          }
          if (this._baselineSection.handleClick(target)) return;
          this._referenceMarkersSection.handleClick(target);
        }
        _handleChange(event) {
          var _a, _b;
          if (this._numericDrafts.handle(event, this._isRendering)) return;
          if (this._segmentsSection.handle(event, "change") || this._gradientStopsSection.handle(event, "change")) return;
          const kind = (_b = (_a = event.target) == null ? void 0 : _a.dataset) == null ? void 0 : _b.kind;
          this._handleFieldEvent(event);
        }
        _handleInput(event) {
          var _a;
          if (this._numericDrafts.handle(event, this._isRendering)) return;
          if (this._segmentsSection.handle(event, "input") || this._gradientStopsSection.handle(event, "input")) return;
          const target = event.target;
          if (!target) return;
          if (target.tagName === "HA-ENTITY-PICKER") return;
          if (target.tagName === "INPUT" && target.type === "checkbox") return;
          const kind = (_a = target.dataset) == null ? void 0 : _a.kind;
          this._handleFieldEvent(event);
        }
        _handleValueChanged(event) {
          var _a;
          if (((_a = event.target) == null ? void 0 : _a.tagName) === "HA-ENTITY-PICKER") {
            this._handleFieldEvent(event);
          }
        }
        _handleKeydown(event) {
          this._segmentsSection.handle(event, "keydown") || this._gradientStopsSection.handle(event, "keydown");
        }
        _handleFieldEvent(event) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
          if (this._segmentsSection.handle(event, "field") || this._gradientStopsSection.handle(event, "field")) return;
          const target = event.target;
          const rawField = (_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.field;
          const rawKind = (_b = target == null ? void 0 : target.dataset) == null ? void 0 : _b.kind;
          const field = (rawField == null ? void 0 : rawField.endsWith("-text-fallback")) ? rawField.slice(0, -14) : rawField;
          const kind = (rawKind == null ? void 0 : rawKind.endsWith("-text-fallback")) ? rawKind.slice(0, -14) : rawKind;
          const detailValue = (_c = event.detail) == null ? void 0 : _c.value;
          const value = detailValue != null ? detailValue : (target == null ? void 0 : target.type) === "checkbox" ? target.checked : target == null ? void 0 : target.value;
          if (this._referenceMarkersSection.handleField({ target, kind, value })) return;
          if (field === "title") return void this._setTitle(value);
          if (handleFormattingField(this._createSectionContext(), { field, value })) return;
          if (field === "layout-label-position") return void this._setLayoutLabelPosition(value);
          if (field === "layout-label-hero-size") return void this._setLayoutHeroSize(value);
          if (field === "layout-hero-value-size") return void this._setLayoutHeroValueSize(value);
          if (field === "layout-height") return void this._setLayoutHeight(value);
          if (field === "layout-label-width") return void this._setScopedLayoutLabelWidth({ type: "card" }, value);
          if (handleScaleField(this._createSectionContext(), { field, value })) return;
          if (handleBarAppearanceField(this._createSectionContext(), { field, value })) return;
          if (this._needleSection.handleField({ field, kind, index: (_d = target.dataset) == null ? void 0 : _d.index, value }) || this._baselineSection.handleField({ field, kind, index: (_e = target.dataset) == null ? void 0 : _e.index, value }) || this._targetSection.handleField({ field, kind, index: (_f = target.dataset) == null ? void 0 : _f.index, value }) || this._extremaSection.handleField({ field, kind, index: (_g = target.dataset) == null ? void 0 : _g.index, value })) return;
          if (kind === "entity-picker" || kind === "entity-input") {
            const index = Number(target.dataset.index);
            const nextEntities = this._getEntitiesValue().map((entry, entryIndex) => entryIndex === index ? { ...entry, entity: this._normalizeTextValue(value) } : entry);
            const nextEntries = this._buildEntityConfigEntries(nextEntities);
            if (Array.isArray(this._draftConfig.entities) || nextEntries.length > 1 || !this._draftConfig.entity) {
              this._setValueAtPath(["entities"], nextEntries);
            } else {
              this._setValueAtPath(["entity"], (_i = (_h = nextEntities[0]) == null ? void 0 : _h.entity) != null ? _i : "");
            }
            return;
          }
          if (kind === "entity-name") {
            return void this._setEntityField(Number(target.dataset.index), "name", value);
          }
          if (kind === "entity-icon") {
            return void this._setEntityField(Number(target.dataset.index), "icon", value);
          }
          if (handleScaleField(this._createSectionContext(), { kind: (kind == null ? void 0 : kind.startsWith("scale-")) ? kind : void 0, value })) return;
          if (handleScaleField(this._createSectionContext(), { kind, index: (_j = target == null ? void 0 : target.dataset) == null ? void 0 : _j.index, value })) return;
          if (kind === "entity-override-height") {
            return void this._setScopedLayoutHeight({ type: "entity", index: Number(target.dataset.index) }, value);
          }
          if (kind === "entity-layout-inherit") {
            if (value) {
              return void this._clearLayoutOverride({ type: "entity", index: Number(target.dataset.index) });
            }
            return;
          }
          if (kind === "entity-layout-label-position") {
            return void this._setScopedLayoutLabelPosition({ type: "entity", index: Number(target.dataset.index) }, value);
          }
          if (kind === "entity-layout-label-hero-size") {
            return void this._setScopedLayoutHeroSize({ type: "entity", index: Number(target.dataset.index) }, value);
          }
          if (kind === "entity-layout-hero-value-size") {
            return void this._setScopedLayoutHeroValueSize({ type: "entity", index: Number(target.dataset.index) }, value);
          }
          if (kind === "entity-layout-label-width") {
            return void this._setScopedLayoutLabelWidth({ type: "entity", index: Number(target.dataset.index) }, value);
          }
          if (handleFormattingField(this._createSectionContext(), { kind, index: (_k = target == null ? void 0 : target.dataset) == null ? void 0 : _k.index, value })) return;
          if (kind === "entity-bar-inherit" && handleBarAppearanceField(this._createSectionContext(), { kind, index: target.dataset.index, value })) return;
          if (handleBarAppearanceField(this._createSectionContext(), { kind, index: target.dataset.index, value })) return;
        }
      };
    }
  });

  // src/feature/marker-label-layout.js
  function getFeatureLabelGeometry(height, occupancy = {}) {
    const above = occupancy.above ? 10 : 0;
    const below = occupancy.below ? 10 : 0;
    const railHeight = Math.max(0, height - above - below);
    return { above, below, railHeight, aboveY: 0, belowY: height - 9, compactGlyphs: above > 0 || below > 0 };
  }
  function layoutFeatureMarkerLabels(markers, width, measureText) {
    const layouts = [];
    for (const lane of ["above", "below"]) {
      const entries = markers.filter((marker) => {
        var _a, _b;
        return marker.lane === lane && marker.visible && marker.labelVisible && Number.isFinite(marker.position) && ((_b = (_a = marker.label) == null ? void 0 : _a.text) == null ? void 0 : _b.trim());
      }).map((marker) => ({ marker, anchor: Math.max(0, Math.min(100, marker.position)) * width / 100 })).sort((a, b) => a.anchor - b.anchor);
      entries.forEach(({ marker, anchor }, index) => {
        var _a;
        const left = index ? (entries[index - 1].anchor + anchor) / 2 + 2 : 0;
        const right = index + 1 < entries.length ? (anchor + entries[index + 1].anchor) / 2 - 2 : width;
        const available = Math.max(0, right - left);
        const label = marker.label;
        let text = label.text;
        let mode = "full";
        let size = measureText(text) + 4;
        if (size > available) {
          text = [label.showValue !== false ? label.number : "", label.showUnit !== false ? label.unit : ""].filter(Boolean).join(" ");
          mode = "value";
          size = text ? measureText(text) + 4 : Infinity;
          if (!text && !label.number && !label.unit) {
            const characters = Array.from((_a = label.semanticText) != null ? _a : "");
            while (characters.length >= 3) {
              text = `${characters.join("").trimEnd()}\u2026`;
              size = measureText(text) + 4;
              if (size <= available) {
                mode = "text";
                break;
              }
              characters.pop();
            }
          }
        }
        if (!text || size > available || width <= 0) {
          layouts.push({ id: marker.id, lane, mode: "hidden", text: "", left: 0, width: 0 });
        } else {
          layouts.push({
            id: marker.id,
            lane,
            mode,
            text,
            left: Math.max(left, Math.min(anchor - size / 2, right - size)),
            width: size
          });
        }
      });
    }
    return layouts;
  }
  var init_marker_label_layout = __esm({
    "src/feature/marker-label-layout.js"() {
    }
  });

  // src/feature/SensorBarCardPlusFeature.js
  function supportsSensorBarFeature(_hass, context) {
    return looksLikeEntityId(context == null ? void 0 : context.entity_id) || typeof (context == null ? void 0 : context.area_id) === "string" && context.area_id.trim().length > 0;
  }
  var SensorBarCardPlusFeature;
  var init_SensorBarCardPlusFeature = __esm({
    "src/feature/SensorBarCardPlusFeature.js"() {
      init_normalize();
      init_validate();
      init_row_view_model();
      init_bar_render_model();
      init_bar_renderer();
      init_bar_styles();
      init_extrema();
      init_format();
      init_dom();
      init_marker_label_layout();
      SensorBarCardPlusFeature = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this._extrema = {};
          this._scaleHistory = null;
          this._previousRow = null;
          this._labelNodes = /* @__PURE__ */ new Map();
          this._onLabelResize = () => this._scheduleLabelLayout(true);
          this._updateComplete = Promise.resolve();
        }
        static getStubConfig() {
          return { type: "custom:sensor-bar-card-plus-feature" };
        }
        static getConfigElement() {
          return document.createElement("sensor-bar-card-plus-feature-editor");
        }
        setConfig(config) {
          if (!config || typeof config !== "object" || Array.isArray(config)) {
            throw new Error("Invalid Sensor Bar Card Plus feature configuration");
          }
          if (config.entities !== void 0) {
            throw new Error("The feature displays one entity; use entity instead of entities");
          }
          if (config.entity != null && config.entity !== "" && !looksLikeEntityId(config.entity)) {
            throw new Error("Feature entity must be a valid entity id");
          }
          const key = JSON.stringify(config);
          if (key === this._configKey) return;
          this._configKey = key;
          this._config = { ...config, ...typeof config.entity === "string" ? { entity: config.entity.trim() } : {} };
          this._configChanged = true;
          this._requestUpdate();
        }
        set hass(value) {
          this._hass = value;
          this._requestUpdate();
        }
        get hass() {
          return this._hass;
        }
        set context(value) {
          this._context = value;
          this._requestUpdate();
        }
        get context() {
          return this._context;
        }
        set color(value) {
          this._color = value;
          this._requestUpdate();
        }
        get color() {
          return this._color;
        }
        set position(value) {
          this._position = value;
          this._requestUpdate();
        }
        get position() {
          return this._position;
        }
        get updateComplete() {
          return this._updateComplete;
        }
        connectedCallback() {
          this._requestUpdate();
        }
        disconnectedCallback() {
          this._stopLabelLayout();
        }
        _requestUpdate() {
          if (this._updateScheduled) return;
          this._updateScheduled = true;
          this._updateComplete = Promise.resolve().then(() => {
            this._updateScheduled = false;
            this._reconcile();
          });
        }
        _reconcile() {
          var _a, _b, _c, _d, _e, _f, _g;
          const entity = ((_a = this._config) == null ? void 0 : _a.entity) || ((_b = this._context) == null ? void 0 : _b.entity_id) || null;
          if (this._configChanged || entity !== this._entity) {
            this._entity = entity;
            this._configChanged = false;
            this._extrema = {};
            this._scaleHistory = null;
            this._sampleState = null;
            this._previousRow = null;
            this._structureKey = null;
            this._labelLayoutKey = null;
            this._normalized = this._config ? normalizeCardConfig({
              ...this._config,
              type: "custom:sensor-bar-card-plus",
              entity: void 0,
              entities: entity ? [{ entity }] : []
            }) : null;
            this._diagnostics = validateNormalizedConfig(this._normalized);
          }
          const state = (_d = (_c = this._hass) == null ? void 0 : _c.states) == null ? void 0 : _d[entity];
          let row = null;
          let status = !this._config ? "Not configured" : !entity ? "Configure an entity" : !this._hass ? "Waiting for Home Assistant" : !state ? "Entity not found" : null;
          if (state && ((_e = this._normalized) == null ? void 0 : _e.entities[0])) {
            const appearance = this._normalized.entities[0];
            const sample = getFiniteNumber(state.state);
            if (sample !== null && (state !== this._sampleState || sample !== this._sampleValue)) {
              this._sampleState = state;
              this._sampleValue = sample;
              const rawTimestamp = (_f = state.last_updated) != null ? _f : state.last_changed;
              const parsedTimestamp = rawTimestamp instanceof Date ? rawTimestamp.getTime() : Date.parse(String(rawTimestamp != null ? rawTimestamp : ""));
              const timestamp = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
              for (const key of ["peak", "floor"]) {
                const marker = appearance[`${key}_marker`];
                if (marker.show) {
                  this._extrema[key] = updateExtremum(this._extrema[key], sample, (_g = marker.reset) != null ? _g : { kind: "never" }, key === "peak" ? "max" : "min", timestamp);
                }
              }
            }
            row = buildRowViewModel({
              hass: this._hass,
              entityConfig: appearance,
              entityState: state,
              extrema: this._extrema,
              previousScale: this._scaleHistory
            });
            this._scaleHistory = { min: row.min, max: row.max };
            if (row.numericValue === null) {
              status = state.state === "unknown" ? "Unknown" : state.state === "unavailable" ? "Unavailable" : "Not numeric";
            }
          }
          this._row = row;
          this._status = status;
          this._render(row, status);
          this._previousRow = status ? null : row;
        }
        _ensureDom() {
          if (this._surface) return;
          this.shadowRoot.innerHTML = `
      <style>
        ${barTrackStyles}
        ${barMarkerStyles}
        ${getBarAnimationStyles('.surface[data-bar-animated="false"]')}
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
          color: var(--primary-text-color, currentColor); white-space: nowrap; overflow: hidden;
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
      </div>`;
          this._surface = this.shadowRoot.querySelector("#surface");
          this._bar = this.shadowRoot.querySelector("#bar");
          this._labels = this.shadowRoot.querySelector("#labels");
          this._statusEl = this.shadowRoot.querySelector("#status");
        }
        _render(row, status) {
          var _a, _b;
          this._ensureDom();
          if (typeof this._color === "string" && this._color) this.style.setProperty("--feature-color", this._color);
          else this.style.removeProperty("--feature-color");
          this._bar.hidden = Boolean(status);
          this._statusEl.hidden = !status;
          this._statusEl.textContent = status != null ? status : "";
          this._surface.dataset.state = status ? "unavailable" : "numeric";
          const occupancy = (_a = row == null ? void 0 : row.markerLabelLaneOccupancy) != null ? _a : {};
          const geometry = getFeatureLabelGeometry(0, occupancy);
          setStyleIfChanged(this._surface, "--label-above", `${geometry.above}px`);
          setStyleIfChanged(this._surface, "--label-below", `${geometry.below}px`);
          this._syncLabels(row, status);
          const name = (row == null ? void 0 : row.name) || this._entity || "Sensor Bar Card Plus";
          const markerDescription = ((_b = row == null ? void 0 : row.markers) != null ? _b : []).filter((marker) => marker.visible && (marker.showMarker || marker.labelVisible)).map((marker) => {
            var _a2;
            const type = marker.type === "generic" ? "Reference marker" : `${marker.type[0].toUpperCase()}${marker.type.slice(1)}`;
            const anchor = `${formatNumericDisplay(marker.value)}${row.displayUnit ? ` ${row.displayUnit}` : ""}`;
            return `${type} at ${anchor}${marker.labelVisible && ((_a2 = marker.label) == null ? void 0 : _a2.text) ? `; label ${marker.label.text}` : ""}.`;
          }).join(" ");
          this._surface.setAttribute("aria-label", status ? `${name}${this._entity && name !== this._entity ? ` (${this._entity})` : ""}: ${status}${row ? ` (${row.state})` : ""}` : `${name} (${this._entity}): ${row.primaryPresentation.text}. Range ${formatNumericDisplay(row.min)} to ${formatNumericDisplay(row.max)}${row.displayUnit ? ` ${row.displayUnit}` : ""}.${markerDescription ? ` ${markerDescription}` : ""}`);
          if (status) return;
          const model = buildBarRenderModel(row, this._normalized.entities[0], { height: "var(--sbcp-row-height)" });
          model.animated = model.animated && Boolean(this._previousRow);
          this._surface.dataset.barAnimated = model.animated ? "true" : "false";
          const renderKey = JSON.stringify(model);
          const structureKey = JSON.stringify([model.baseline.configured, model.needle.configured, model.markers.map((marker) => [marker.type, marker.id])]);
          if (structureKey !== this._structureKey) {
            this._bar.innerHTML = renderBar(model);
            this._structureKey = structureKey;
          } else if (renderKey !== this._barRenderKey) {
            patchBar(this._bar, model, { revealDuration: getRevealTransitionDuration(
              this._previousRow ? { valuePercent: this._previousRow.percent, baselinePercent: this._previousRow.baselinePercent } : null,
              { valuePercent: row.percent, baselinePercent: row.baselinePercent }
            ) });
          }
          this._barRenderKey = renderKey;
          this._labelAnimated = model.animated;
          this._scheduleLabelLayout();
        }
        _syncLabels(row, status) {
          var _a, _b, _c;
          const markers = ((_a = row == null ? void 0 : row.markers) != null ? _a : []).filter((marker) => marker.labelVisible);
          const ids = new Set(markers.map((marker) => marker.id));
          for (const [id, node] of this._labelNodes) {
            if (!ids.has(id)) {
              node.remove();
              this._labelNodes.delete(id);
            }
          }
          for (const marker of markers) {
            if (!this._labelNodes.has(marker.id)) {
              const node = document.createElement("span");
              node.className = "compact-marker-label";
              node.dataset.markerId = marker.id;
              node.hidden = true;
              this._labels.append(node);
              this._labelNodes.set(marker.id, node);
            }
            this._labelNodes.get(marker.id).dataset.lane = marker.lane;
          }
          this._labels.hidden = Boolean(status);
          const required = ((_b = row == null ? void 0 : row.markerLabelLaneOccupancy) == null ? void 0 : _b.above) || ((_c = row == null ? void 0 : row.markerLabelLaneOccupancy) == null ? void 0 : _c.below);
          if (!required) {
            this._stopLabelLayout();
            this._surface.dataset.compactGlyphs = "false";
          } else if (this.isConnected && !this._labelObserver) {
            this._labelObserver = new ResizeObserver(this._onLabelResize);
            this._labelObserver.observe(this._surface);
            this._labelFonts = document.fonts;
            this._labelFonts.addEventListener("loadingdone", this._onLabelResize);
            const fonts = this._labelFonts;
            fonts.ready.then(() => {
              if (this._labelFonts === fonts) this._scheduleLabelLayout(true);
            });
          }
        }
        _stopLabelLayout() {
          var _a, _b;
          (_a = this._labelObserver) == null ? void 0 : _a.disconnect();
          this._labelObserver = null;
          (_b = this._labelFonts) == null ? void 0 : _b.removeEventListener("loadingdone", this._onLabelResize);
          this._labelFonts = null;
          if (this._labelFrame) cancelAnimationFrame(this._labelFrame);
          this._labelFrame = null;
          this._labelLayoutKey = null;
        }
        _scheduleLabelLayout(snap = false) {
          if (!this._labelObserver) return;
          this._snapLabels = this._snapLabels || snap;
          if (this._labelFrame) return;
          this._labelFrame = requestAnimationFrame(() => {
            this._labelFrame = null;
            this._layoutLabels();
          });
        }
        _layoutLabels() {
          var _a, _b, _c, _d;
          const { width, height } = this._surface.getBoundingClientRect();
          const geometry = getFeatureLabelGeometry(height, (_a = this._row) == null ? void 0 : _a.markerLabelLaneOccupancy);
          this._surface.dataset.compactGlyphs = String(geometry.compactGlyphs);
          (_b = this._labelMeasure) != null ? _b : this._labelMeasure = document.createElement("canvas").getContext("2d");
          this._labelMeasure.font = getComputedStyle(this._labels).font;
          const layouts = layoutFeatureMarkerLabels((_d = (_c = this._row) == null ? void 0 : _c.markers) != null ? _d : [], width, (text) => this._labelMeasure.measureText(text).width);
          const key = JSON.stringify([
            width,
            height,
            geometry.above,
            geometry.below,
            this._labelMeasure.font,
            layouts.map((label) => [label.id, label.lane, label.mode, label.width])
          ]);
          const animate = this._labelAnimated && !this._snapLabels && key === this._labelLayoutKey;
          for (const node of this._labelNodes.values()) node.hidden = true;
          for (const label of layouts) {
            const node = this._labelNodes.get(label.id);
            node.hidden = label.mode === "hidden";
            node.dataset.mode = label.mode;
            if (node.textContent !== label.text) node.textContent = label.text;
            setStyleIfChanged(node, "transition", animate ? "left 0.6s cubic-bezier(0.4,0,0.2,1)" : "none");
            setStyleIfChanged(node, "left", `${label.left}px`);
            setStyleIfChanged(node, "width", `${label.width}px`);
          }
          this._labelLayoutKey = key;
          this._snapLabels = false;
        }
      };
    }
  });

  // src/feature/feature-editor-config.js
  function getFeatureScaleSource(config, key) {
    var _a, _b, _c, _d, _e;
    const bound = (_a = config.scale) == null ? void 0 : _a[key];
    if (bound !== void 0) {
      const source = normalizeStructuredResolvableValue(bound);
      return { fixed: (_b = source.fixed) != null ? _b : "", entity: (_c = source.entity) != null ? _c : "" };
    }
    return { fixed: (_d = config[key]) != null ? _d : "", entity: (_e = config[`${key}_entity`]) != null ? _e : "" };
  }
  function patchSource(config, base, bound, part, value, empty, allowPercent = false) {
    const patch = (target, path) => empty ? deletePathValue(target, path) : setPathValue(target, path, value);
    if (isObject(bound)) {
      if (part === "fixed" && empty) return deletePathValue(deletePathValue(config, [...base, "fixed"]), [...base, "value"]);
      const storedPart = part === "fixed" && bound.fixed === void 0 && bound.value !== void 0 ? "value" : part;
      return patch(config, [...base, storedPart]);
    }
    if (bound !== void 0 && bound !== null) {
      const percent = allowPercent ? parsePercentLiteral(bound) : null;
      const storedPart = looksLikeEntityId(bound) ? "entity" : Number.isFinite(percent) ? "percent" : "fixed";
      if (part === storedPart) return patch(config, base);
      if (empty) return config;
      return setPathValue(config, base, { [storedPart]: storedPart === "percent" ? percent : bound, [part]: value });
    }
    return empty ? config : setPathValue(config, [...base, part], value);
  }
  function patchFeatureScaleSource(config, key, part, rawValue) {
    var _a;
    const value = part === "fixed" ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
    const empty = part === "fixed" ? value === null : !value;
    const bound = (_a = config.scale) == null ? void 0 : _a[key];
    if (bound === void 0 && (config[key] !== void 0 || config[`${key}_entity`] !== void 0)) {
      const path = [part === "fixed" ? key : `${key}_entity`];
      return empty ? deletePathValue(config, path) : setPathValue(config, path, value);
    }
    return patchSource(config, ["scale", key], bound, part, value, empty);
  }
  function getFeatureBaselineSource(config) {
    var _a, _b;
    const raw = config.baseline;
    if (!isObject(raw)) return { fixed: raw != null ? raw : "", entity: "" };
    const source = normalizeStructuredResolvableValue(raw.at, null, null, { allowPercent: true });
    return { fixed: (_a = source.fixed) != null ? _a : "", entity: (_b = source.entity) != null ? _b : "", ...Number.isFinite(source.percent) ? { percent: source.percent } : {} };
  }
  function patchFeatureBaselineSource(config, part, rawValue) {
    var _a;
    if (part === "mode") return patchFeatureMarkerSourceMode(config, "baseline", rawValue);
    if (part === "percent") return patchFeatureMarkerPercentage(config, "baseline", rawValue);
    const value = part === "fixed" ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
    const empty = part === "fixed" ? value === null : !value;
    const raw = config.baseline;
    if (!isObject(raw) && raw !== void 0 && raw !== null) {
      if (part === "fixed") return empty ? deletePathValue(config, ["baseline"]) : setPathValue(config, ["baseline"], value);
      if (empty) return config;
      config = setPathValue(config, ["baseline"], { at: raw });
    }
    return patchSource(config, ["baseline", "at"], (_a = config.baseline) == null ? void 0 : _a.at, part, value, empty, true);
  }
  function getFeatureTargetSource(config) {
    var _a, _b, _c;
    const raw = config.target;
    if (isObject(raw) && raw.at !== void 0) {
      const source = normalizeStructuredResolvableValue(raw.at, null, null, { allowPercent: true });
      return { fixed: (_a = source.fixed) != null ? _a : "", entity: (_b = source.entity) != null ? _b : "", ...Number.isFinite(source.percent) ? { percent: source.percent } : {} };
    }
    return { fixed: isObject(raw) ? "" : raw != null ? raw : "", entity: (_c = config.target_entity) != null ? _c : "" };
  }
  function promoteFeatureTarget(config) {
    if (isObject(config.target)) return config;
    const raw = config.target, entity = config.target_entity;
    const at = entity !== void 0 ? { ...raw !== void 0 && raw !== null ? { fixed: raw } : {}, entity } : raw;
    return setPathValue(config, ["target"], at === void 0 || at === null ? {} : { at });
  }
  function patchFeatureTargetSource(config, part, rawValue) {
    if (part === "mode") return patchFeatureMarkerSourceMode(config, "target", rawValue);
    if (part === "percent") return patchFeatureMarkerPercentage(config, "target", rawValue);
    const value = part === "fixed" ? normalizeNumberValue(rawValue) : normalizeTextValue(rawValue).trim();
    const empty = part === "fixed" ? value === null : !value;
    const raw = config.target;
    if ((!isObject(raw) || raw.at === void 0) && (raw !== void 0 && !isObject(raw) || config.target_entity !== void 0)) {
      if (part === "entity") return empty ? deletePathValue(config, ["target_entity"]) : setPathValue(config, ["target_entity"], value);
      if (!isObject(raw)) return empty ? deletePathValue(config, ["target"]) : setPathValue(config, ["target"], value);
      if (empty) return config;
      return setPathValue(config, ["target", "at"], { entity: config.target_entity, fixed: value });
    }
    let next = patchSource(config, ["target", "at"], raw == null ? void 0 : raw.at, part, value, empty, true);
    if (part === "entity") next = deletePathValue(next, ["target_entity"]);
    return next;
  }
  function patchFeatureMarkerSourceMode(config, key, mode) {
    var _a;
    if (!["fixed", "entity", "entity-fallback", "percent"].includes(mode)) return config;
    const read = key === "target" ? getFeatureTargetSource : getFeatureBaselineSource;
    const source = read(config), raw = (_a = config[key]) == null ? void 0 : _a.at;
    let next = key === "target" ? promoteFeatureTarget(config) : isObject(config.baseline) ? config : setPathValue(config, ["baseline"], { at: config.baseline });
    let at = isObject(raw) ? { ...raw } : {};
    for (const field of ["fixed", "value", "entity", "percent"]) delete at[field];
    if (mode === "percent") {
      const percent = Number.isFinite(source.percent) ? source.percent : 50;
      at = isObject(raw) ? { ...at, percent } : `${percent}%`;
    } else {
      if (mode !== "entity") at.fixed = source.fixed !== "" && source.fixed !== void 0 ? source.fixed : 50;
      if (mode !== "fixed") at.entity = source.entity || "";
      if (!isObject(raw) && mode === "fixed") at = at.fixed;
      if (!isObject(raw) && mode === "entity" && at.entity) at = at.entity;
    }
    next = setPathValue(next, [key, "at"], at);
    return key === "target" ? deletePathValue(next, ["target_entity"]) : next;
  }
  function patchFeatureMarkerPercentage(config, key, rawValue) {
    var _a, _b;
    const clear = rawValue === null;
    const value = normalizeScalePercentageInput(rawValue);
    if (!clear && value === null) return config;
    const at = (_a = config[key]) == null ? void 0 : _a.at, base = [key, "at"];
    if (isObject(at)) return clear ? deletePathValue(config, [...base, "percent"]) : setPathValue(config, [...base, "percent"], value);
    if (Number.isFinite(parsePercentLiteral(at))) return clear ? deletePathValue(config, base) : setPathValue(config, base, `${value}%`);
    if (clear) return config;
    const next = key === "target" ? promoteFeatureTarget(config) : isObject(config.baseline) ? config : setPathValue(config, ["baseline"], { at: config.baseline });
    return patchSource(next, base, (_b = next[key]) == null ? void 0 : _b.at, "percent", value, false, true);
  }
  var init_feature_editor_config = __esm({
    "src/feature/feature-editor-config.js"() {
      init_normalize();
      init_editor_config();
      init_editor_controls();
    }
  });

  // src/feature/feature-editor-palettes.js
  function palettePath(config, kind) {
    var _a;
    const paths = [["bar", kind], [kind], ...kind === "segments" ? [["severity"]] : []];
    return (_a = paths.find((path) => getPathValue(config, path) !== void 0)) != null ? _a : paths[0];
  }
  function displayBoundary(value) {
    var _a;
    if (!isObject(value)) return value;
    if (Number.isFinite(value.percent)) return `${value.percent}%`;
    return (_a = value.fixed) != null ? _a : value.value;
  }
  function createFeaturePaletteArray(context, kind) {
    let section;
    const rawRows = () => {
      const config = context.read({ type: "card" }, []);
      const stored = getPathValue(config, palettePath(config, kind));
      if (stored !== void 0) return Array.isArray(stored) ? stored : [];
      return kind === "segments" ? section._getFallbackSegments({ type: "card" }) : section._getDefaultGradientStops();
    };
    return {
      patchOnly: true,
      autoEnds: kind === "segments",
      cssText: kind === "segments",
      segmentSpace: () => {
        var _a, _b;
        const config = context.read({ type: "card" }, []);
        const path = palettePath(config, kind);
        return path[0] === "severity" ? "percent" : path[0] === "bar" ? (_b = (_a = config.bar) == null ? void 0 : _a.segment_space) != null ? _b : null : null;
      },
      rows(_scope, controller) {
        section = controller;
        return rawRows().map((row) => {
          var _a;
          return kind === "segments" ? { ...row, from: displayBoundary(row == null ? void 0 : row.from), to: displayBoundary(row == null ? void 0 : row.to) } : { ...row, pos: (_a = controller._normalizeGradientStopPosValue(row == null ? void 0 : row.pos)) != null ? _a : row == null ? void 0 : row.pos };
        });
      },
      write(scope, _displayRows, _options, operation) {
        if (!operation) throw new Error("Feature palette writes require an explicit item operation");
        const applied = context.mutate(scope, (config) => {
          const path = palettePath(config, kind);
          const rows = [...rawRows()];
          if (operation.type === "edit") {
            if (operation.index < 0 || operation.index >= rows.length) return config;
            const row = { ...rows[operation.index], [operation.field]: operation.value };
            if (operation.value === void 0) delete row[operation.field];
            rows[operation.index] = row;
          } else if (operation.type === "add") rows.push(cloneDeep(operation.item));
          else if (operation.type === "remove") rows.splice(operation.index, 1);
          else throw new Error("Unsupported palette operation");
          return setPathValue(config, path, rows);
        });
        if (applied !== false && operation.type !== "edit") {
          if (kind === "segments") section._clearSegmentScopeTextState(scope);
          else section._clearGradientStopScopeTextState(scope);
        }
        return applied;
      }
    };
  }
  var init_feature_editor_palettes = __esm({
    "src/feature/feature-editor-palettes.js"() {
      init_editor_config();
    }
  });

  // src/feature/feature-editor-reference-markers.js
  function getFeatureReferenceMarkerSource(marker) {
    const at = marker == null ? void 0 : marker.at;
    if (typeof at === "number") return getReferenceMarkerSource({ at: { fixed: at } });
    if (isObject(at) && at.fixed === void 0 && at.value !== void 0) return getReferenceMarkerSource({ at: { ...at, fixed: at.value } });
    return getReferenceMarkerSource(marker);
  }
  function patchFeatureReferenceMarkerSource(config, index, part, rawValue) {
    var _a;
    if (!Array.isArray(config.markers) || !config.markers[index]) return config;
    const base = ["markers", index, "at"], at = (_a = config.markers[index]) == null ? void 0 : _a.at;
    const value = part === "entity" ? normalizeTextValue(rawValue).trim() : normalizeNumberValue(rawValue);
    const empty = part === "entity" ? !value : value === null;
    if (part === "percent") return setPathValue(config, base, empty ? null : `${value}%`);
    const marker = patchSource(config.markers[index], ["at"], at, part, value, empty);
    return setPathValue(config, ["markers", index], marker);
  }
  function patchFeatureReferenceMarker(config, operation) {
    var _a;
    const rows = Array.isArray(config.markers) ? [...config.markers] : [];
    const { type, index, path, value } = operation;
    if (type === "add") rows.push({ at: { fixed: 50 } });
    else {
      if (index < 0 || index >= rows.length || !Number.isInteger(index)) return config;
      if (type === "remove") rows.splice(index, 1);
      else if (type === "move") {
        const next = index + operation.delta;
        if (next < 0 || next >= rows.length) return config;
        [rows[index], rows[next]] = [rows[next], rows[index]];
      } else if (type === "field") {
        let marker = value === void 0 ? deletePathValue(rows[index], path) : setPathValue(rows[index], path, value);
        if (path[0] === "label" && path[1] === "precision") marker = deletePathValue(marker, ["label", "decimal"]);
        rows[index] = path[0] === "label" ? pruneEmptyObjectsInTarget(marker, ["label"]) : marker;
      } else if (type === "mode") {
        let at;
        if (value === "percent") at = "50%";
        else {
          const source = getFeatureReferenceMarkerSource(rows[index]);
          at = isObject((_a = rows[index]) == null ? void 0 : _a.at) ? cloneDeep(rows[index].at) : { ...source.entity ? { entity: source.entity } : {}, ...source.fixed !== "" && source.fixed !== void 0 ? { fixed: source.fixed } : {} };
          delete at.percent;
          if (value === "fixed") {
            delete at.entity;
            if (at.fixed === void 0 && at.value === void 0) at.fixed = 50;
          } else {
            if (!at.entity) at.entity = "";
            if (value === "entity") {
              delete at.fixed;
              delete at.value;
            }
            if (value === "entity-fallback" && at.fixed === void 0 && at.value === void 0) at.fixed = 50;
          }
        }
        rows[index] = setPathValue(rows[index], ["at"], at);
      }
    }
    return setPathValue(config, ["markers"], rows);
  }
  var init_feature_editor_reference_markers = __esm({
    "src/feature/feature-editor-reference-markers.js"() {
      init_reference_markers();
      init_editor_config();
      init_feature_editor_config();
    }
  });

  // src/feature/feature-editor-extrema.js
  function patchFeatureExtremumField(config, { key, path, value, field }) {
    if (path[0] === "reset" && value && !isValidReset(value)) return config;
    if (field === "text" && !value || value === null || path[0] === "reset" && !value) value = void 0;
    let next = value === void 0 ? deletePathValue(config, [key, ...path]) : setPathValue(config, [key, ...path], value);
    if (field === "precision") next = deletePathValue(next, [key, "label", "decimal"]);
    if (key === "peak" && path[0] === "enabled") {
      next = deletePathValue(next, ["show_peak"]);
      if (isObject(config.peak_marker)) next = setPathValue(next, ["peak_marker", "show"], value);
    }
    if (key === "peak" && path[0] === "color") {
      next = deletePathValue(next, ["peak_color"]);
      next = deletePathValue(next, ["peak_marker", "color"]);
      next = pruneEmptyObjectsInTarget(next, ["peak_marker"]);
    }
    return pruneEmptyObjectsInTarget(next, [key, ...path.slice(0, -1)]);
  }
  var init_feature_editor_extrema = __esm({
    "src/feature/feature-editor-extrema.js"() {
      init_editor_config();
      init_extrema();
    }
  });

  // src/feature/feature-editor-target.js
  function patchFeatureTargetField(config, { path, value, deprecatedKeys = [], field }) {
    if (field === "text" && !value || value === null) value = void 0;
    let next = value === void 0 ? config : promoteFeatureTarget(config);
    next = value === void 0 ? deletePathValue(next, ["target", ...path]) : setPathValue(next, ["target", ...path], value);
    next = removePathsFromTarget(next, deprecatedKeys);
    if (field === "show") next = deletePathValue(next, ["show_target_label"]);
    if (field === "precision") next = deletePathValue(next, ["target", "label", "decimal"]);
    return pruneEmptyObjectsInTarget(next, ["target", ...path.slice(0, -1)]);
  }
  var init_feature_editor_target = __esm({
    "src/feature/feature-editor-target.js"() {
      init_editor_config();
      init_feature_editor_config();
    }
  });

  // src/feature/feature-editor-needle-baseline.js
  function patchFeatureNeedle(config, { field, value }) {
    var _a;
    const path = ["bar", "needle"];
    const raw = (_a = config.bar) == null ? void 0 : _a.needle;
    if (field === "mode") {
      const show = value === "enabled";
      if (raw === void 0 && !show) return config;
      return setPathValue(config, isObject(raw) ? [...path, "show"] : path, show);
    }
    const clear = !value || normalizeColorComparisonValue(value) === normalizeColorComparisonValue("#ffffff");
    if (clear) return pruneEmptyObjectsInTarget(deletePathValue(config, [...path, "color"]), path);
    const needle = isObject(raw) ? raw : typeof raw === "boolean" ? { show: raw } : {};
    return setPathValue(config, path, { ...needle, color: value });
  }
  function patchFeatureBaselineField(config, { path, value }) {
    const raw = config.baseline;
    if (!isObject(raw) && raw !== void 0 && raw !== null) {
      if (value === void 0) return config;
      config = setPathValue(config, ["baseline"], { at: raw });
    }
    const ownedPath = ["baseline", ...path];
    let next = value === void 0 ? deletePathValue(config, ownedPath) : setPathValue(config, ownedPath, value);
    if (value === void 0) {
      if (path.length > 1) next = pruneEmptyObjectsInTarget(next, ["baseline", path[0]]);
      next = pruneEmptyObjectsInTarget(next, ["baseline"]);
    }
    return next;
  }
  var init_feature_editor_needle_baseline = __esm({
    "src/feature/feature-editor-needle-baseline.js"() {
      init_editor_config();
      init_editor_controls();
    }
  });

  // src/feature/SensorBarCardPlusFeatureEditor.js
  var root, SensorBarCardPlusFeatureEditor;
  var init_SensorBarCardPlusFeatureEditor = __esm({
    "src/feature/SensorBarCardPlusFeatureEditor.js"() {
      init_editor_config();
      init_editor_controls();
      init_editor_styles();
      init_editor_disclosures();
      init_editor_numeric_drafts();
      init_scale();
      init_formatting();
      init_bar_appearance();
      init_feature_editor_config();
      init_segments();
      init_gradient_stops();
      init_feature_editor_palettes();
      init_needle();
      init_baseline();
      init_target();
      init_extrema2();
      init_reference_markers();
      init_feature_editor_reference_markers();
      init_feature_editor_extrema();
      init_feature_editor_target();
      init_feature_editor_needle_baseline();
      root = { type: "card" };
      SensorBarCardPlusFeatureEditor = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this._config = {};
          this._context = {};
          this._chooseEntity = false;
          this._renderEpoch = 0;
          this._updateComplete = Promise.resolve();
          this._cssColorDrafts = /* @__PURE__ */ new Map();
          this._numericDrafts = new NumericInputDrafts();
          this._expandedCardGroups = /* @__PURE__ */ new Set();
          const context = this._createSectionContext();
          const options = { cssText: true, percentSources: true };
          this._needleSection = new NeedleSection(context, options);
          this._baselineSection = new BaselineSection(context, options);
          this._targetSection = new TargetSection(context, options);
          this._extremaSection = new ExtremaSection(context, options);
          const ui = {
            root: () => this.shadowRoot,
            render: () => {
              this._paletteRenderRequested = true;
              this._requestRender();
            },
            focus: (selector) => {
              this._pendingPaletteFocus = selector;
            },
            hass: () => this._hass
          };
          this._referenceMarkersSection = new ReferenceMarkersSection(context, { root: ui.root, render: () => this._requestRender() }, options);
          this._segmentsSection = new SegmentsSection(context, ui, createFeaturePaletteArray(context, "segments"));
          this._gradientStopsSection = new GradientStopsSection(context, ui, createFeaturePaletteArray(context, "gradient_stops"));
          for (const type of ["click", "keydown"]) this.shadowRoot.addEventListener(type, (event) => {
            var _a, _b, _c, _d, _e;
            if (type === "click") {
              const target = (_c = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, "[data-action]")) != null ? _c : event.target;
              if (((_d = target == null ? void 0 : target.dataset) == null ? void 0 : _d.action) === "toggle-card-group") {
                this._toggleCardGroup(target.dataset.group);
                return;
              }
              if (this._baselineSection.handleClick(target) || this._targetSection.handleClick(target)) {
                this._requestRender();
                return;
              }
              if (this._referenceMarkersSection.handleClick(target)) {
                if (((_e = target == null ? void 0 : target.dataset) == null ? void 0 : _e.action) === "add-generic-marker") {
                  const markers = this._referenceMarkersSection._getGenericMarkers(root);
                  this._pendingReferenceFocusId = this._referenceMarkersSection._getGenericMarkerUiIds(root, markers.length).at(-1);
                }
                this._requestRender();
                return;
              }
            }
            this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event);
          });
          const handleField = (event) => this._handleField(event);
          for (const type of ["input", "change", "value-changed"]) this.shadowRoot.addEventListener(type, handleField);
          this.shadowRoot.addEventListener("focusout", () => this._requestRender());
          customElements.whenDefined("ha-entity-picker").then(() => {
            if (this.isConnected) this._requestRender();
          });
        }
        setConfig(config) {
          if (!isObject(config)) throw new Error("Invalid Sensor Bar Card Plus feature configuration");
          if (serializeConfig(config) !== serializeConfig(this._config)) {
            this._paletteRenderRequested || (this._paletteRenderRequested = ["bar.segments", "bar.gradient_stops", "segments", "severity", "gradient_stops"].some((path) => serializeConfig(getPathValue(config, path.split("."))) !== serializeConfig(getPathValue(this._config, path.split(".")))));
            this._config = cloneDeep(config);
            this._cssColorDrafts.clear();
            this._numericDrafts.reset();
            this._baselineSection.reset();
            this._targetSection.reset();
            this._referenceMarkersSection.reset();
            this._segmentsSection.reset();
            this._gradientStopsSection.reset();
            this._chooseEntity = false;
            this._configReplaced = true;
          }
          this._requestRender();
        }
        set hass(value) {
          this._hass = value;
          this._requestRender();
        }
        get hass() {
          return this._hass;
        }
        set context(value) {
          this._context = value != null ? value : {};
          this._requestRender();
        }
        get context() {
          return this._context;
        }
        get updateComplete() {
          return this._updateComplete;
        }
        get _explicitEntity() {
          return typeof this._config.entity === "string" ? this._config.entity.trim() : "";
        }
        get _effectiveEntity() {
          return this._explicitEntity || this._context.entity_id || "";
        }
        get _showEntityPicker() {
          return !!this._explicitEntity || this._chooseEntity || !this._context.entity_id;
        }
        connectedCallback() {
          this._requestRender();
        }
        disconnectedCallback() {
          this._renderEpoch += 1;
          this._renderScheduled = false;
        }
        _requestRender() {
          if (this._renderScheduled) return;
          this._renderScheduled = true;
          const epoch = this._renderEpoch;
          this._updateComplete = Promise.resolve().then(() => {
            if (epoch !== this._renderEpoch) return;
            this._renderScheduled = false;
            this._render();
          });
        }
        _createSectionContext() {
          return {
            read: (_scope, path) => getPathValue(this._config, path),
            mutate: (_scope, mutation, options) => this._mutate((config) => {
              var _a, _b, _c, _d;
              return (options == null ? void 0 : options.referenceMarkerEdit) ? patchFeatureReferenceMarker(config, options.referenceMarkerEdit) : (options == null ? void 0 : options.needleEdit) ? patchFeatureNeedle(config, options.needleEdit) : (options == null ? void 0 : options.baselineEdit) ? patchFeatureBaselineField(config, options.baselineEdit) : (options == null ? void 0 : options.targetEdit) || ((_a = options == null ? void 0 : options.markerEdit) == null ? void 0 : _a.key) === "target" ? patchFeatureTargetField(config, (_b = options.targetEdit) != null ? _b : options.markerEdit) : (options == null ? void 0 : options.extremumEdit) || ["peak", "floor"].includes((_c = options == null ? void 0 : options.markerEdit) == null ? void 0 : _c.key) ? patchFeatureExtremumField(config, (_d = options.extremumEdit) != null ? _d : options.markerEdit) : mutation(config);
            }),
            source: (_scope, key) => (key == null ? void 0 : key.type) === "reference-marker" ? getFeatureReferenceMarkerSource(key.marker) : key === "baseline" ? getFeatureBaselineSource(this._config) : key === "target" ? getFeatureTargetSource(this._config) : getFeatureScaleSource(this._config, key),
            setSource: (_scope, key, part, value) => this._mutate((config) => (key == null ? void 0 : key.type) === "reference-marker" ? patchFeatureReferenceMarkerSource(config, key.index, part, value) : key === "baseline" ? patchFeatureBaselineSource(config, part, value) : key === "target" ? patchFeatureTargetSource(config, part, value) : patchFeatureScaleSource(config, key, part, value))
          };
        }
        _mutate(mutation) {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          const next = mutation(this._config);
          if (serializeConfig(next) === serializeConfig(this._config)) return false;
          if (((_b = (_a = next.bar) == null ? void 0 : _a.segments) == null ? void 0 : _b.length) !== ((_d = (_c = this._config.bar) == null ? void 0 : _c.segments) == null ? void 0 : _d.length) || ((_e = next.segments) == null ? void 0 : _e.length) !== ((_f = this._config.segments) == null ? void 0 : _f.length) || ((_g = next.severity) == null ? void 0 : _g.length) !== ((_h = this._config.severity) == null ? void 0 : _h.length)) {
            for (const key of this._cssColorDrafts.keys()) if (key.startsWith("segment-")) this._cssColorDrafts.delete(key);
          }
          this._config = next;
          this._requestRender();
          this.dispatchEvent(new CustomEvent("config-changed", {
            bubbles: true,
            composed: true,
            detail: { config: cloneDeep(next) }
          }));
          return true;
        }
        _handleField(event) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          const target = event.target;
          if (this._configReplaced || (target == null ? void 0 : target.isConnected) === false) return;
          if ((target == null ? void 0 : target.tagName) === "HA-ENTITY-PICKER" && event.type !== "value-changed") return;
          if (this._numericDrafts.handle(event, this._isRendering)) return;
          const field = (_b = (_a = target == null ? void 0 : target.dataset) == null ? void 0 : _a.field) == null ? void 0 : _b.replace(/-text-fallback$/, "");
          const kind = (_d = (_c = target == null ? void 0 : target.dataset) == null ? void 0 : _c.kind) == null ? void 0 : _d.replace(/-text-fallback$/, "");
          const value = event.type === "value-changed" ? (_e = event.detail) == null ? void 0 : _e.value : (target == null ? void 0 : target.type) === "checkbox" ? target.checked : target == null ? void 0 : target.value;
          if ((target == null ? void 0 : target.type) === "color") this._cssColorDrafts.delete(`${target.id}-text-fallback`);
          if (((_f = target == null ? void 0 : target.dataset) == null ? void 0 : _f.cssColor) === "true") {
            const valid = !value.trim() || CSS.supports("color", value);
            (_g = target.setCustomValidity) == null ? void 0 : _g.call(target, valid ? "" : "Enter a valid CSS color.");
            target.setAttribute("aria-invalid", valid ? "false" : "true");
            if (valid) this._cssColorDrafts.delete(target.id);
            else this._cssColorDrafts.set(target.id, value);
            if (!valid && kind !== "segment-draft-color") return;
          }
          if (field === "feature-entity-override") {
            this._chooseEntity = !!value;
            if (!value) this._mutate((config) => deletePathValue(config, ["entity"]));
            this._requestRender();
            return;
          }
          if (kind === "feature-entity-source") {
            const entity = typeof value === "string" ? value.trim() : "";
            this._chooseEntity = false;
            this._mutate((config) => entity ? setPathValue(config, ["entity"], entity) : deletePathValue(config, ["entity"]));
            this._requestRender();
            return;
          }
          if (kind == null ? void 0 : kind.startsWith("generic-marker-")) {
            const markerId = (_j = (_i = (_h = target.closest) == null ? void 0 : _h.call(target, ".generic-marker-item")) == null ? void 0 : _i.dataset) == null ? void 0 : _j.markerUiId;
            const ids = this._referenceMarkersSection._getGenericMarkerUiIds(root, this._referenceMarkersSection._getGenericMarkers(root).length);
            if (markerId && markerId !== ids[Number(target.dataset.markerIndex)]) return;
          }
          if (this._referenceMarkersSection.handleField({ target, kind, value })) return;
          if (this._segmentsSection.handle(event) || this._gradientStopsSection.handle(event)) {
            this._requestRender();
            return;
          }
          if (this._needleSection.handleField({ field, kind, value }) || this._baselineSection.handleField({ field, kind, value }) || this._targetSection.handleField({ field, kind, value }) || this._extremaSection.handleField({ field, kind, value })) return;
          const context = this._createSectionContext();
          if (handleScaleField(context, { field, kind, value })) return;
          if (handleFormattingField(context, { field, kind, value })) return;
          handleBarAppearanceField(context, { field, kind, value }, { animation: true, cssText: true });
        }
        _entityDescription() {
          if (this._explicitEntity) return `Using explicit entity: ${this._explicitEntity}`;
          if (this._context.entity_id) return `Using parent card entity: ${this._context.entity_id}`;
          return "An entity is required. Select an entity below.";
        }
        _renderEntitySection() {
          return `<div class="section">
      <div class="section-head"><h3>Entities</h3></div>
      <div id="feature-entity-status" class="section-note" role="status">${escapeAttribute(this._entityDescription())}</div>
      ${this._context.entity_id || this._explicitEntity ? `<div class="toggle">
        <input id="feature-entity-override" type="checkbox" data-field="feature-entity-override"${this._explicitEntity || this._chooseEntity ? " checked" : ""}>
        <label for="feature-entity-override">Use explicit entity</label>
      </div>` : ""}
      ${this._showEntityPicker ? `<div class="field-row">
        <label for="feature-entity">Entity override</label>
        ${renderEntitySourceInput("feature-entity-source", "feature", this._explicitEntity)}
      </div>` : ""}
    </div>`;
        }
        _renderCardGroup(options) {
          return renderCardGroup(options, this._expandedCardGroups.has(options.group));
        }
        _toggleCardGroup(group) {
          if (this._expandedCardGroups.has(group)) this._expandedCardGroups.delete(group);
          else this._expandedCardGroups.add(group);
          this._syncDisclosures();
        }
        _syncDisclosures() {
          var _a;
          const summaries = {
            "marker-target": this._targetSection._getCardTargetMarkerSummary(),
            "marker-peak": this._extremaSection._getMarkerResetSummary("peak"),
            "marker-floor": this._extremaSection._getMarkerResetSummary("floor"),
            "generic-markers": this._referenceMarkersSection._getGenericMarkersSummary(root),
            baseline: this._baselineSection._getCardBaselineSummary(),
            segments: this._segmentsSection._getSegmentsSummary(root),
            "gradient-stops": this._gradientStopsSection._getGradientStopsSummary(root)
          };
          for (const [group, summary] of Object.entries(summaries)) {
            const button = this.shadowRoot.querySelector(`#card-group-${group}`);
            const wrapper = (_a = button == null ? void 0 : button.closest) == null ? void 0 : _a.call(button, ".override-group");
            const expanded = this._expandedCardGroups.has(group);
            button == null ? void 0 : button.setAttribute("aria-expanded", String(expanded));
            wrapper == null ? void 0 : wrapper.setAttribute("data-expanded", String(expanded));
            const title = this.shadowRoot.querySelector(`#card-group-${group}-title`);
            if (title == null ? void 0 : title.textContent) title.textContent = `${expanded ? "\u25BE" : "\u25B8"} ${title.textContent.slice(2)}`;
            const label = this.shadowRoot.querySelector(`#card-group-${group}-summary`);
            if (label) label.textContent = summary;
            const body = wrapper == null ? void 0 : wrapper.querySelector(".override-group-body");
            if (body) body.style.display = expanded ? "grid" : "none";
          }
          for (const row of this.shadowRoot.querySelectorAll(".generic-marker-item")) {
            const expanded = this._referenceMarkersSection._expandedGenericMarkerUiIds.has(row.dataset.markerUiId);
            row.setAttribute("data-expanded", String(expanded));
            row.querySelector(".generic-marker-toggle").setAttribute("aria-expanded", String(expanded));
            row.querySelector(".generic-marker-body").style.display = expanded ? "grid" : "none";
          }
        }
        _captureFocus() {
          var _a, _b, _c, _d, _e;
          const active = this.shadowRoot.activeElement;
          if (!active) return null;
          const markerId = (_c = (_b = (_a = active.closest) == null ? void 0 : _a.call(active, ".generic-marker-item")) == null ? void 0 : _b.dataset) == null ? void 0 : _c.markerUiId;
          const selector = active.id ? `#${active.id}` : active.dataset.field ? `[data-field="${active.dataset.field}"]` : active.dataset.kind ? `[data-kind="${active.dataset.kind}"]` : markerId && active.dataset.action ? `.generic-marker-item[data-marker-ui-id="${markerId}"] [data-action="${active.dataset.action}"]` : active.dataset.action ? `[data-action="${active.dataset.action}"]` : null;
          const item = (_e = (_d = active.dataset.segmentIndex) != null ? _d : active.dataset.stopIndex) != null ? _e : active.dataset.index;
          const rowSelector = selector && active.dataset.kind && item !== void 0 ? `${selector}[data-${active.dataset.segmentIndex !== void 0 ? "segment-index" : active.dataset.stopIndex !== void 0 ? "stop-index" : "index"}="${item}"]` : selector;
          return rowSelector ? { selector: rowSelector, start: active.selectionStart, end: active.selectionEnd } : null;
        }
        _render() {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          const fillStyle = getEffectiveFillStyleValue(this._createSectionContext(), root);
          const segmentRows = this._segmentsSection._getScopedSegmentsValue(root);
          const gradientRows = this._gradientStopsSection._getScopedGradientStopsValue(root);
          const markers = this._referenceMarkersSection._getGenericMarkers(root);
          const markerIds = this._referenceMarkersSection._getGenericMarkerUiIds(root, markers.length);
          const markerSignature = JSON.stringify(markers.map((marker, index) => [markerIds[index], this._referenceMarkersSection._getGenericMarkerSource(marker).mode]));
          const signature = JSON.stringify([
            !!(this._context.entity_id || this._explicitEntity),
            this._showEntityPicker,
            fillStyle,
            segmentRows.length,
            gradientRows.length,
            !isHexColorValue(this._gradientStopsSection._getGradientStopsDraftState(root).color),
            ...gradientRows.map((row) => !isHexColorValue(row.color)),
            !!customElements.get("ha-entity-picker")
          ]);
          const activeField = (_b = (_a = this.shadowRoot.activeElement) == null ? void 0 : _a.dataset) == null ? void 0 : _b.field;
          const activeKind = (_d = (_c = this.shadowRoot.activeElement) == null ? void 0 : _c.dataset) == null ? void 0 : _d.kind;
          const defer = (activeKind == null ? void 0 : activeKind.endsWith("-text-fallback")) || (activeField == null ? void 0 : activeField.endsWith("-text-fallback")) || activeField === "feature-entity-override" && !this._context.entity_id && !this._explicitEntity || ((_f = (_e = this.shadowRoot.activeElement) == null ? void 0 : _e.validity) == null ? void 0 : _f.badInput) && this._numericDrafts.captureFocus(this.shadowRoot);
          let replaceReferences = false;
          if (markerSignature !== this._referenceStructureSignature && !defer) {
            this._isRendering = true;
            try {
              replaceReferences = !this._referenceMarkersSection.syncStructure(root);
            } finally {
              this._isRendering = false;
            }
          }
          if ((signature !== this._structureSignature || this._paletteRenderRequested || replaceReferences) && !defer) {
            const focus = this._captureFocus();
            const context = this._createSectionContext();
            this._isRendering = true;
            try {
              this.shadowRoot.innerHTML = `<style>${editorStyles}
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
        ${renderScaleSection(context, root)}
        ${renderMarkersSection({
                renderGroup: (options) => this._renderCardGroup(options),
                target: { summary: this._targetSection._getCardTargetMarkerSummary(), content: this._targetSection.render(root) },
                peak: { summary: this._extremaSection._getMarkerResetSummary("peak"), content: this._extremaSection.render(root, "peak") },
                floor: { summary: this._extremaSection._getMarkerResetSummary("floor"), content: this._extremaSection.render(root, "floor") },
                references: { summary: this._referenceMarkersSection._getGenericMarkersSummary(root), content: this._referenceMarkersSection.render(root) }
              })}
        ${renderBarAppearanceSection(context, root, () => `${this._baselineSection.render(root, (options) => this._renderCardGroup(options))}${this._needleSection.render(root)}`, { animation: true, cssText: true })}
        ${this._segmentsSection.render(root, (options) => this._renderCardGroup(options))}
        ${this._gradientStopsSection.render(root, (options) => this._renderCardGroup(options))}
        ${renderFormattingSection(context, root)}
      </div>`;
            } finally {
              this._isRendering = false;
            }
            this._structureSignature = signature;
            this._paletteRenderRequested = false;
            this._syncControls();
            const active = focus && this.shadowRoot.querySelector(focus.selector);
            (_g = active == null ? void 0 : active.focus) == null ? void 0 : _g.call(active, { preventScroll: true });
            if ((active == null ? void 0 : active.type) === "text" && focus.start != null) (_h = active.setSelectionRange) == null ? void 0 : _h.call(active, focus.start, focus.end);
          } else {
            this._syncControls();
          }
          if (!defer) this._referenceStructureSignature = markerSignature;
          if (this._pendingPaletteFocus) {
            (_j = (_i = this.shadowRoot.querySelector(this._pendingPaletteFocus)) == null ? void 0 : _i.focus) == null ? void 0 : _j.call(_i, { preventScroll: true });
            this._pendingPaletteFocus = null;
          }
          if (this._pendingReferenceFocusId) {
            const heading = this.shadowRoot.querySelector(`.generic-marker-item[data-marker-ui-id="${this._pendingReferenceFocusId}"] .generic-marker-toggle`);
            heading == null ? void 0 : heading.focus({ preventScroll: true });
            heading == null ? void 0 : heading.scrollIntoView({ block: "nearest", inline: "nearest" });
            this._pendingReferenceFocusId = null;
          }
          this._configReplaced = false;
        }
        _syncControls() {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
          const context = this._createSectionContext();
          const color = getBarColorValue(context, root);
          const values = {
            "scale-min": getFeatureScaleSource(this._config, "min").fixed,
            "scale-max": getFeatureScaleSource(this._config, "max").fixed,
            "bar-fill-style": getEffectiveFillStyleValue(context, root),
            "bar-color": getColorPickerValue(color, "#4a9eff"),
            "bar-color-text-fallback": color,
            "bar-needle-mode": this._needleSection._getScopedNeedleConfig(root).mode,
            "bar-needle-color": getColorPickerValue(this._needleSection._getScopedNeedleConfig(root).color, "#ffffff"),
            "bar-needle-color-text-fallback": this._needleSection._getScopedNeedleConfig(root).color,
            "baseline-mode": this._baselineSection._getBaselineMode(root),
            "baseline-value": getFeatureBaselineSource(this._config).fixed,
            "baseline-source-mode": this._baselineSection._getSourceMode(),
            "baseline-percent": (_b = (_a = this._baselineSection._percentageDraft) != null ? _a : getFeatureBaselineSource(this._config).percent) != null ? _b : "",
            "baseline-above-color": getColorPickerValue(this._baselineSection._getBaselineDirectionalColorValue(root, "above"), "#000000"),
            "baseline-above-color-text-fallback": this._baselineSection._getBaselineDirectionalColorValue(root, "above"),
            "baseline-below-color": getColorPickerValue(this._baselineSection._getBaselineDirectionalColorValue(root, "below"), "#000000"),
            "baseline-below-color-text-fallback": this._baselineSection._getBaselineDirectionalColorValue(root, "below"),
            "target-mode": this._targetSection._getTargetMode(root),
            "target-value": getFeatureTargetSource(this._config).fixed,
            "target-source-mode": this._targetSection._getSourceMode(),
            "target-percent": (_d = (_c = this._targetSection._percentageDraft) != null ? _c : getFeatureTargetSource(this._config).percent) != null ? _d : "",
            "target-shape": this._targetSection._getEffectiveTargetShapeValue(root),
            "target-direction": this._targetSection._getEffectiveMarkerDirection(root, "target"),
            "target-color": getColorPickerValue(this._targetSection._getTargetColorValue(root), "#888"),
            "target-color-text-fallback": this._targetSection._getTargetColorValue(root),
            "target-above-fill-color": getColorPickerValue(this._targetSection._getTargetAboveFillColorValue(root), "#000000"),
            "target-above-fill-color-text-fallback": this._targetSection._getTargetAboveFillColorValue(root),
            "target-label-text": this._targetSection._getBuiltinMarkerLabelOptions(root, "target").text,
            "target-label-precision": this._targetSection._getBuiltinMarkerLabelOptions(root, "target").precision,
            "formatting-unit": getFormattingValue(context, root, "unit"),
            "formatting-decimal": getFormattingValue(context, root, "decimal")
          };
          for (const key of ["peak", "floor"]) {
            const marker = this._extremaSection._getMarkerConfig(root, key);
            const label = this._extremaSection._getBuiltinMarkerLabelOptions(root, key);
            Object.assign(values, {
              [`${key}-color`]: getColorPickerValue(marker.color, "#888888"),
              [`${key}-color-text-fallback`]: marker.color,
              [`${key}-reset`]: this._extremaSection._getEffectiveMarkerExtras(root, key).reset,
              [`${key}-direction`]: this._extremaSection._getEffectiveMarkerDirection(root, key),
              [`${key}-label-text`]: label.text,
              [`${key}-label-precision`]: label.precision
            });
            for (const [suffix, checked] of [
              ["show", marker.mode === "enabled"],
              ["label-show", label.show],
              ["label-show-value", label.showValue],
              ["label-show-unit", label.showUnit]
            ]) {
              const control = this.shadowRoot.querySelector(`#${key}-${suffix}`);
              if (control) control.checked = checked;
            }
          }
          for (const [field, value] of Object.entries(values)) {
            const control = this.shadowRoot.querySelector(`[data-field="${field}"]`);
            if (control && (control !== this.shadowRoot.activeElement || this._configReplaced)) control.value = String(value);
            if (field === "bar-color-text-fallback") control == null ? void 0 : control.setAttribute("aria-label", "Bar color (CSS value)");
          }
          for (const section of [this._segmentsSection, this._gradientStopsSection]) {
            const segment = section === this._segmentsSection;
            const rows = segment ? section._getScopedSegmentsValue(root) : section._getScopedGradientStopsValue(root);
            for (const field of segment ? ["from", "to", "color", "color-text-fallback"] : ["pos", "color"]) {
              for (const control of this.shadowRoot.querySelectorAll(`input[data-kind="${segment ? "segment" : "gradient"}-${field}"]`)) {
                const index = Number(control.dataset.index), row = rows[index];
                const value = segment && !field.startsWith("color") ? section._getSegmentBoundaryText(root, index, field, row == null ? void 0 : row[field]) : !segment && field === "pos" ? section._getGradientStopPosText(root, index, (_e = row == null ? void 0 : row.pos) != null ? _e : "") : row == null ? void 0 : row.color;
                if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = segment && control.type === "color" ? getColorPickerValue(value, "#4a9eff") : value != null ? value : "";
              }
            }
            if (segment || this._configReplaced) {
              const draft = segment ? section._getSegmentDraftState(root) : section._getGradientStopsDraftState(root);
              for (const field of Object.keys(draft)) for (const suffix of ["", "-text-fallback"]) for (const control of this.shadowRoot.querySelectorAll(`input[data-kind="${segment ? "segment" : "gradient"}-draft-${field}${suffix}"]`)) {
                if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = field === "color" && control.type === "color" ? getColorPickerValue(draft[field], "#4CAF50") : draft[field];
              }
            }
            if (segment) section._refreshSegmentUi(root);
            else if ((_f = this.shadowRoot.querySelector("#gradient-draft-pos")) == null ? void 0 : _f.closest) section._refreshGradientDraftUi(root);
          }
          for (const direction of ["above", "below"]) {
            const control = this.shadowRoot.querySelector(`#baseline-${direction}-color-enabled`);
            if (control) control.checked = this._baselineSection._isBaselineDirectionalColorEnabled(root, direction);
          }
          this._referenceMarkersSection.syncControls(this._hass, this._configReplaced);
          const targetLabel = this._targetSection._getBuiltinMarkerLabelOptions(root, "target");
          for (const [id, checked] of [
            ["target-label-show", targetLabel.show],
            ["target-label-show-value", targetLabel.showValue],
            ["target-label-show-unit", targetLabel.showUnit],
            ["target-above-fill-enabled", this._targetSection._isTargetAboveFillEnabled(root)]
          ]) {
            const control = this.shadowRoot.querySelector(`#${id}`);
            if (control) control.checked = checked;
          }
          const solid = this.shadowRoot.querySelector("#bar-solid-fill");
          if (solid) solid.checked = getBarSolidFillValue(context, root);
          const animated = this.shadowRoot.querySelector("#bar-animated");
          if (animated) animated.checked = getBarAnimatedValue(context, root);
          const override = this.shadowRoot.querySelector("#feature-entity-override");
          if (override) override.checked = !!this._explicitEntity || this._chooseEntity;
          const status = this.shadowRoot.querySelector("#feature-entity-status");
          if (status) status.textContent = this._entityDescription();
          for (const [kind, value, label, id] of [
            ["feature-entity-source", this._explicitEntity, "Entity override", "feature-entity"],
            ["scale-min-entity-source", getFeatureScaleSource(this._config, "min").entity, "Min entity", "feature-scale-min-entity"],
            ["baseline-entity-source", getFeatureBaselineSource(this._config).entity, "Baseline entity", "feature-baseline-entity"],
            ["target-entity-source", getFeatureTargetSource(this._config).entity, "Target entity", "feature-target-entity"],
            ["scale-max-entity-source", getFeatureScaleSource(this._config, "max").entity, "Max entity", "feature-scale-max-entity"]
          ]) {
            for (const tag of ["input", "ha-entity-picker"]) {
              for (const control of this.shadowRoot.querySelectorAll(`${tag}[data-kind="${kind}"]`)) {
                control.id = id;
                control.setAttribute("aria-label", label);
                if (kind === "feature-entity-source") {
                  control.setAttribute("aria-describedby", "feature-entity-status");
                  control.setAttribute("aria-required", this._effectiveEntity ? "false" : "true");
                }
                if (control !== this.shadowRoot.activeElement || this._configReplaced) control.value = value;
                if (tag === "ha-entity-picker") {
                  control.hass = this._hass;
                  control.label = label;
                  control.allowCustomEntity = true;
                }
              }
            }
          }
          this._syncDisclosures();
          this._numericDrafts.apply(this.shadowRoot);
          for (const control of this.shadowRoot.querySelectorAll('input[data-css-color="true"]')) {
            const draft = this._cssColorDrafts.get(control.id);
            if (draft !== void 0) control.value = draft;
            control.setAttribute("aria-invalid", draft === void 0 ? "false" : "true");
            (_g = control.setCustomValidity) == null ? void 0 : _g.call(control, draft === void 0 ? "" : "Enter a valid CSS color.");
            const inputLabel = (_j = (_i = (_h = this.shadowRoot.querySelector(`#${control.id.replace(/-text-fallback$/, "")}`)) == null ? void 0 : _h.labels) == null ? void 0 : _i[0]) == null ? void 0 : _j.textContent;
            if (inputLabel) control.setAttribute("aria-label", `${inputLabel} (CSS value)`);
          }
        }
      };
    }
  });

  // src/sensor-bar-card-plus.js
  var require_sensor_bar_card_plus = __commonJS({
    "src/sensor-bar-card-plus.js"() {
      init_SensorBarCard();
      init_SensorBarCardPlusEditor();
      init_SensorBarCardPlusFeature();
      init_SensorBarCardPlusFeatureEditor();
      for (const [name, element] of [
        ["sensor-bar-card-plus", SensorBarCard],
        ["sensor-bar-card-plus-editor", SensorBarCardPlusEditor],
        ["sensor-bar-card-plus-feature", SensorBarCardPlusFeature],
        ["sensor-bar-card-plus-feature-editor", SensorBarCardPlusFeatureEditor]
      ]) {
        if (!customElements.get(name)) customElements.define(name, element);
      }
      window.customCards = window.customCards || [];
      if (!window.customCards.some((card) => card.type === "sensor-bar-card-plus")) {
        window.customCards.push({
          type: "sensor-bar-card-plus",
          name: "Sensor Bar Card Plus",
          description: "Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features."
        });
      }
      window.customCardFeatures = window.customCardFeatures || [];
      if (!window.customCardFeatures.some((feature) => feature.type === "sensor-bar-card-plus-feature")) {
        window.customCardFeatures.push({
          type: "sensor-bar-card-plus-feature",
          name: "Sensor Bar Card Plus",
          isSupported: supportsSensorBarFeature,
          configurable: true
        });
      }
    }
  });
  require_sensor_bar_card_plus();
})();
