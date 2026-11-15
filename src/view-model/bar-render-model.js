import * as paintCompiler from './paint-compiler.js';
import { projectScaleInterval, projectScalePercent, toScalePct } from './scale-projection.js';

export {
  inferSegmentEndValues,
  hexToRgb,
  getBandsGradientCss,
  getSoftBandBlendWidthPct,
  pushGradientColorStop,
  resolveSegmentBoundaryPct,
  segmentsNeedBoundaryResolution,
  buildFullScaleGradientStyle,
  rgbToCss,
  buildSolidGradientStyle,
} from './paint-compiler.js';
export { toScalePct } from './scale-projection.js';

// Pure calculations over normalized appearance and resolved scale positions.
// Entity resolution, history and DOM lifetime belong to the presentation adapter.

export function getRevealTransitionDuration(previousGeometry, nextGeometry) {
  if (!previousGeometry || !nextGeometry
    || !Number.isFinite(previousGeometry.valuePercent)
    || !Number.isFinite(nextGeometry.valuePercent)) {
    return 600;
  }

  const previousBaseline = Number.isFinite(previousGeometry.baselinePercent)
    ? previousGeometry.baselinePercent
    : 0;
  const nextBaseline = Number.isFinite(nextGeometry.baselinePercent)
    ? nextGeometry.baselinePercent
    : 0;
  const delta = Math.max(
    Math.abs(nextGeometry.valuePercent - previousGeometry.valuePercent),
    Math.abs(nextBaseline - previousBaseline),
  );
  const ordinaryDuration = Math.round(Math.min(600, Math.max(150, 600 - 15 * Math.max(0, delta - 5))));
  const crossesBaseline = Number.isFinite(previousGeometry.baselinePercent)
    && Number.isFinite(nextGeometry.baselinePercent)
    && (previousGeometry.valuePercent - previousGeometry.baselinePercent)
      * (nextGeometry.valuePercent - nextGeometry.baselinePercent) < 0;

  return crossesBaseline ? Math.min(ordinaryDuration, 300) : ordinaryDuration;
}

function ordinaryPaint(config) {
  return config?.bar?.paint ? { ...config.bar.paint, segment_space: config.bar.segment_space } : config?.bar;
}

export function getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100, preserveCssColors = false) {
  return paintCompiler.getSeverityInterpolationStops(ordinaryPaint(ecfg), minValue, maxValue, preserveCssColors);
}

export function getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  return paintCompiler.getSeverityBandGradientCss(ordinaryPaint(ecfg), minValue, maxValue, scaleDirection);
}

export function getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
  return paintCompiler.getSoftBandGradientStops(ordinaryPaint(ecfg), minValue, maxValue);
}

export function getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  return paintCompiler.getSoftBandGradientCss(ordinaryPaint(ecfg), minValue, maxValue, scaleDirection);
}

export function getEffectiveFillStyle(ecfg) {
  return paintCompiler.getEffectiveFillStyle(ordinaryPaint(ecfg));
}

export function getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
  return paintCompiler.getSegmentsForRendering(ordinaryPaint(ecfg), minValue, maxValue);
}

export function getColor(pct, ecfg, minValue = 0, maxValue = 100) {
  return paintCompiler.getColor(pct, ordinaryPaint(ecfg), minValue, maxValue);
}

export function getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
  return paintCompiler.getGradientInterpolationStops(ordinaryPaint(ecfg), minValue, maxValue);
}

export function getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  return paintCompiler.getBasePaintGradient(color, ordinaryPaint(ecfg), minValue, maxValue, scaleDirection);
}

export function getOverlayGradient(startPct, endPct, color) {
  if (!color) return null;
  const start = Math.min(100, Math.max(0, startPct));
  const end = Math.min(100, Math.max(0, endPct));
  if (end <= start) return null;
  return `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;
}

export function getNormalizedPercent(valuePct, baselinePct = null) {
  const clampedValue = Math.min(100, Math.max(0, valuePct));
  if (!Number.isFinite(baselinePct)) {
    return {
      usesBaseline: false,
      start: 0,
      end: clampedValue,
      positive: true,
      baseline: null,
      hidden: clampedValue <= 0,
    };
  }

  const clampedBaseline = Math.min(100, Math.max(0, baselinePct));
  return {
    usesBaseline: true,
    start: Math.min(clampedValue, clampedBaseline),
    end: Math.max(clampedValue, clampedBaseline),
    positive: clampedValue >= clampedBaseline,
    baseline: clampedBaseline,
    hidden: clampedValue === clampedBaseline,
  };
}

export function getEndpointSemantics(geometry) {
  if (geometry?.endpointSemantics) {
    return geometry.endpointSemantics;
  }
  if (!geometry?.usesBaseline) {
    return {
      left: 'scale',
      right: 'value',
    };
  }

  return geometry.positive
    ? { left: 'baseline', right: 'value' }
    : { left: 'value', right: 'baseline' };
}

export function getRevealCornerRadii(geometry) {
  const endpoints = getEndpointSemantics(geometry);
  const isRounded = (endpointType) => endpointType === 'value' || endpointType === 'range' || endpointType === 'scale';
  const leftRadius = isRounded(endpoints.left) ? '6px' : '0';
  const rightRadius = isRounded(endpoints.right) ? '6px' : '0';
  return `${leftRadius} ${rightRadius} ${rightRadius} ${leftRadius}`;
}

export function getAboveTargetOverlayInterval(targetPct = null, scaleDirection = 'normal') {
  if (!Number.isFinite(targetPct)) return null;
  const interval = projectScaleInterval(targetPct, 100, scaleDirection);
  if (!interval || interval.start >= interval.end) return null;
  return interval;
}

export function getAboveTargetLayerGeometry(targetPct = null, scaleDirection = 'normal') {
  const interval = getAboveTargetOverlayInterval(targetPct, scaleDirection);
  if (!interval) return null;

  return {
    start: interval.start,
    end: interval.end,
    hidden: false,
  };
}

function getBaselinePaintGradients(ecfg, baselinePct, scaleDirection) {
  const clampedBaseline = Number.isFinite(baselinePct)
    ? Math.min(100, Math.max(0, baselinePct))
    : null;

  const below = projectScaleInterval(0, clampedBaseline, scaleDirection);
  const above = projectScaleInterval(clampedBaseline, 100, scaleDirection);
  return {
    below: below ? getOverlayGradient(below.start, below.end, ecfg.baseline?.below?.color) : null,
    above: above ? getOverlayGradient(above.start, above.end, ecfg.baseline?.above?.color) : null,
  };
}

function getBaselinePaintLayer(side, ecfg, baselinePct, minValue, maxValue, scaleDirection, samplePercent) {
  const direction = ecfg?.baseline?.[side];
  if (!direction || direction.paint === null) return null;
  const interval = side === 'below'
    ? projectScaleInterval(0, baselinePct, scaleDirection)
    : projectScaleInterval(baselinePct, 100, scaleDirection);
  if (!interval) return null;
  if (direction.paint && typeof direction.paint === 'object') {
    const { gradient } = paintCompiler.compilePaint(direction.paint, {
      minValue, maxValue, scaleDirection, samplePercent,
    });
    if (!gradient) return null;
    const opacity = direction.paint.opacity ?? 100;
    return {
      paintStyle: `display:block;inset:0;background-image:${gradient};background-repeat:no-repeat;background-size:100% 100%;${opacity === 100 ? '' : `opacity:${opacity / 100};`}`,
      revealStyle: getStaticLayerRevealStyle({ start: interval.start, end: interval.end, hidden: false }),
    };
  }
  const legacy = getBaselinePaintGradients(ecfg, baselinePct, scaleDirection)[side];
  return legacy ? { paintStyle: getFullScaleBackgroundStyle([legacy]), revealStyle: 'display:block;' } : null;
}

function getFullScaleBackgroundStyle(gradients) {
  const layers = gradients.filter(Boolean);
  if (!layers.length) return 'display:none;';
  return `display:block;inset:0;background-image:${layers.join(',')};background-repeat:no-repeat;background-size:100% 100%;`;
}

// Compatibility form for callers that still need one composed background.
export function getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  const baseline = getBaselinePaintGradients(ecfg, baselinePct, scaleDirection);
  return getFullScaleBackgroundStyle([
    baseline.below, baseline.above,
    getBasePaintGradient(color, ecfg, minValue, maxValue, scaleDirection),
  ]);
}

export function getRevealShapeStyle(geometry, h) {
  const heightValue = typeof h === 'number' ? `${h}px` : h;
  const start = Math.min(100, Math.max(0, geometry?.start ?? 0));
  const end = Math.min(100, Math.max(0, geometry?.end ?? 0));

  if (geometry?.hidden) {
    return `display:none;height:${heightValue};clip-path:inset(0 100% 0 0 round 0);`;
  }

  const topInset = '0';
  const rightInset = `${Math.max(0, 100 - end)}%`;
  const bottomInset = '0';
  const leftInset = `${start}%`;
  const radii = getRevealCornerRadii(geometry);
  return `display:block;height:${heightValue};clip-path:inset(${topInset} ${rightInset} ${bottomInset} ${leftInset} round ${radii});`;
}

export function getStaticLayerRevealStyle(geometry) {
  if (!geometry?.hidden && Number.isFinite(geometry?.start) && Number.isFinite(geometry?.end) && geometry.end > geometry.start) {
    const start = Math.min(100, Math.max(0, geometry.start));
    const end = Math.min(100, Math.max(0, geometry.end));
    return `display:block;clip-path:inset(0 ${Math.max(0, 100 - end)}% 0 ${start}% round 0);`;
  }
  return 'display:none;clip-path:inset(0 100% 0 0 round 0);';
}

function intersectInterval(left, right) {
  if (!left || !right) return null;
  const start = Math.max(left.start, right.start);
  const end = Math.min(left.end, right.end);
  return end > start ? { start, end, hidden: false } : null;
}

function getTargetPaintLayer(side, geometry, ecfg, targetPercent, samplePercent, minValue, maxValue, scaleDirection, needleActive, orderingInvalid) {
  const paint = ecfg?.target_paints?.[side];
  if (!paint || !Number.isFinite(targetPercent) || orderingInvalid) return null;
  const legacyUpper = side === 'above' && ecfg?.target_paints_legacy_above === true;
  if (!needleActive && !legacyUpper
    && (side === 'above' ? !(samplePercent > targetPercent) : !(samplePercent < targetPercent))) return null;
  const interval = side === 'above'
    ? projectScaleInterval(targetPercent, 100, scaleDirection)
    : projectScaleInterval(0, targetPercent, scaleDirection);
  const visible = needleActive || legacyUpper ? interval : intersectInterval(interval, geometry);
  if (!visible) return null;
  const compiled = paintCompiler.compilePaint(paint, { minValue, maxValue, scaleDirection, samplePercent });
  const opacity = paint.opacity ?? 100;
  const paintStyle = getFullScaleBackgroundStyle([compiled.gradient]);
  return {
    id: `target-${side}`,
    zIndex: 2,
    visible: true,
    paintStyle: opacity === 100 ? paintStyle : `${paintStyle}opacity:${opacity / 100};`,
    revealStyle: getStaticLayerRevealStyle(visible),
  };
}

export function getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, scaleDirection = 'normal', samplePercent = 0, targetThresholds = {}, needleActive = false) {
  const basePaintStyle = getFullScaleBackgroundStyle([
    paintCompiler.compilePaint(ordinaryPaint(ecfg), { color, minValue, maxValue, scaleDirection, samplePercent }).gradient,
  ]);
  const opacity = ecfg?.bar?.paint?.opacity ?? 100;
  const baseLayer = {
    id: 'base',
    zIndex: 1,
    visible: true,
    paintStyle: opacity === 100 ? basePaintStyle : `${basePaintStyle}opacity:${opacity / 100};`,
    revealStyle: 'display:block;',
  };

  // At equal z-indices, later nodes paint on top: Baseline-above covers
  // ordinary fill, and Baseline-below covers both, matching background order.
  // Keep inactive nodes too, allowing source recovery without rebuilding the bar.
  const baselineLayers = ['above', 'below'].map(side => {
    const layer = getBaselinePaintLayer(side, ecfg, baselinePct, minValue, maxValue, scaleDirection, samplePercent);
    return {
      id: `baseline-${side}`,
      zIndex: 1,
      visible: !!layer,
      paintStyle: layer?.paintStyle ?? 'display:none;',
      revealStyle: layer?.revealStyle ?? 'display:none;',
    };
  });

  const aboveTargetGeometry = getAboveTargetLayerGeometry(targetPct, scaleDirection);
  const hasAboveTargetDestination = Object.prototype.hasOwnProperty.call(ecfg?.target_paints ?? {}, 'above');
  const aboveTargetLayer = {
    id: 'above-target',
    zIndex: 2,
    visible: !!(ecfg?.bar?.above_target_color && aboveTargetGeometry && !hasAboveTargetDestination),
    paintStyle: ecfg?.bar?.above_target_color && !hasAboveTargetDestination
      ? `display:block;inset:0;background:${ecfg.bar.above_target_color};`
      : 'display:none;',
    revealStyle: aboveTargetGeometry
      ? getStaticLayerRevealStyle(aboveTargetGeometry)
      : getStaticLayerRevealStyle({ start: 0, end: 0, hidden: true }),
  };

  const targetOrderingInvalid = targetThresholds.orderingInvalid === true;
  const targetAboveLayer = getTargetPaintLayer('above', geometry, ecfg, targetThresholds.above, samplePercent,
    minValue, maxValue, scaleDirection, needleActive, targetOrderingInvalid);
  const targetBelowLayer = getTargetPaintLayer('below', geometry, ecfg, targetThresholds.below, samplePercent,
    minValue, maxValue, scaleDirection, needleActive, targetOrderingInvalid);

  return [baseLayer, ...baselineLayers, aboveTargetLayer,
    targetBelowLayer ?? { id: 'target-below', zIndex: 2, visible: false, paintStyle: 'display:none;', revealStyle: 'display:none;' },
    targetAboveLayer ?? { id: 'target-above', zIndex: 2, visible: false, paintStyle: 'display:none;', revealStyle: 'display:none;' }];
}

export function getFillRenderState(
  scalePercent, h, ecfg, color, targetScalePercent = null, baselineScalePercent = null,
  minValue = 0, maxValue = 100, needleActive = false,
  scaleDirection = ecfg?.scale?.direction ?? 'normal',
  barDirection = ecfg?.bar?.direction ?? 'normal',
  targetThresholds = {},
) {
  const valuePosition = projectScalePercent(scalePercent, scaleDirection);
  const baselinePosition = projectScalePercent(baselineScalePercent, scaleDirection);
  let geometry;
  if (needleActive) {
    geometry = getNormalizedPercent(100, null);
  } else if (!Number.isFinite(scalePercent)) {
    geometry = {
      usesBaseline: Number.isFinite(baselinePosition),
      start: 0,
      end: 0,
      positive: true,
      baseline: baselinePosition,
      hidden: true,
      endpointSemantics: { left: 'scale', right: 'value' },
    };
  } else if (Number.isFinite(baselinePosition)) {
    const positive = scalePercent >= baselineScalePercent;
    geometry = {
      usesBaseline: true,
      start: Math.min(valuePosition, baselinePosition),
      end: Math.max(valuePosition, baselinePosition),
      positive,
      baseline: baselinePosition,
      hidden: valuePosition === baselinePosition,
      endpointSemantics: valuePosition <= baselinePosition
        ? { left: 'value', right: 'baseline' }
        : { left: 'baseline', right: 'value' },
    };
  } else {
    const reverse = barDirection === 'reverse';
    geometry = {
      usesBaseline: false,
      start: reverse ? valuePosition : 0,
      end: reverse ? 100 : valuePosition,
      positive: true,
      baseline: null,
      hidden: reverse ? valuePosition >= 100 : valuePosition <= 0,
      endpointSemantics: reverse
        ? { left: 'value', right: 'scale' }
        : { left: 'scale', right: 'value' },
    };
  }
  const paintLayers = getFillPaintLayers(
    geometry, h, ecfg, color, targetScalePercent, baselineScalePercent,
    minValue, maxValue, scaleDirection, scalePercent, targetThresholds, needleActive,
  );
  return {
    geometry,
    paintLayers,
    paintStyle: paintLayers[0]?.paintStyle ?? 'display:none;',
    revealStyle: getRevealShapeStyle(geometry, h),
  };
}

export function getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null, scaleDirection = ecfg?.scale?.direction ?? 'normal') {
  const needle = ecfg?.bar?.needle;
  if (!needle?.show) {
    return {
      show: false,
      pct: null,
      color: needle?.color ?? '#ffffff',
      borderColor: getNeedleBorderColor(needle?.color ?? '#ffffff'),
      edge: 'middle',
    };
  }
  if (Number.isFinite(baselinePct)) {
    return {
      show: false,
      pct: null,
      color: needle.color ?? '#ffffff',
      borderColor: getNeedleBorderColor(needle.color ?? '#ffffff'),
      edge: 'middle',
    };
  }
  if (!Number.isFinite(rawValue)) {
    return {
      show: false,
      pct: null,
      color: needle.color ?? '#ffffff',
      borderColor: getNeedleBorderColor(needle.color ?? '#ffffff'),
      edge: 'middle',
    };
  }

  const scalePercent = Math.min(100, Math.max(0, toScalePct(rawValue, minValue, maxValue)));
  const pct = projectScalePercent(scalePercent, scaleDirection);
  return {
    show: true,
    pct,
    color: needle.color ?? '#ffffff',
    borderColor: getNeedleBorderColor(needle.color ?? '#ffffff'),
    edge: pct <= 0 ? 'left' : (pct >= 100 ? 'right' : 'middle'),
  };
}

export function parseColorToRgb(color) {
  const value = String(color || '').trim();
  if (!value) return null;

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const full = hex.length === 3
      ? hex.split('').map(c => c + c).join('')
      : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(p => p.trim());
    if (parts.length >= 3) {
      return {
        r: Math.max(0, Math.min(255, parseFloat(parts[0]))),
        g: Math.max(0, Math.min(255, parseFloat(parts[1]))),
        b: Math.max(0, Math.min(255, parseFloat(parts[2]))),
      };
    }
  }

  return null;
}

export function rgbToHsl({ r, g, b }) {
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

export function getMarkerContrastColor(color) {
  const rgb = parseColorToRgb(color);
  if (!rgb) return '#f3f4f6';

  const { h, s, l } = rgbToHsl(rgb);
  const contrastL = Math.abs(l - 90) >= Math.abs(l - 10) ? 90 : 10;
  const contrastS = Math.max(40, Math.min(100, s));
  return `hsl(${Math.round(h)} ${Math.round(contrastS)}% ${Math.round(contrastL)}%)`;
}

export function getEffectiveMarkerColor(marker) {
  return marker?.color ?? '#888888';
}

export function getNeedleBorderColor(color) {
  return getMarkerContrastColor(color);
}

/** Build physical-bar presentation from resolved row data and normalized appearance.
 * Height is supplied by the adapter; entity resolution and history remain outside.
 */
export function buildBarRenderModel(row, appearance, { height, color = getColor(row.percent, appearance, row.min, row.max) } = {}) {
  const baselinePercent = row.baselinePercent;
  const baselinePositionPercent = row.baselinePositionPercent
    ?? projectScalePercent(baselinePercent, appearance.scale?.direction ?? 'normal');
  const baselineAt = appearance.baseline?.at;
  const baselineConfigured = appearance.baseline?.enabled !== false && (
    Number.isFinite(baselinePercent)
    || Boolean(baselineAt?.entity)
    || baselineAt?.fixed !== null && baselineAt?.fixed !== undefined
    || Number.isFinite(baselineAt?.percent)
  );
  return {
    animated: appearance.bar.animated,
    fill: getFillRenderState(
      row.numericValue === null
        ? (Number.isFinite(baselinePercent) ? 0 : null)
        : row.percent,
      height, appearance, color, row.targetPercent, baselinePercent,
      row.min, row.max, row.needle.show,
      appearance.scale?.direction ?? 'normal', appearance.bar?.direction ?? 'normal',
      { above: row.targetAbovePercent, below: row.targetBelowPercent, orderingInvalid: row.targetOrderingInvalid },
    ),
    baseline: {
      configured: baselineConfigured,
      percent: baselinePositionPercent,
      positionPercent: baselinePositionPercent,
      scalePercent: baselinePercent,
    },
    needle: {
      ...row.needle,
      configured: appearance.bar?.needle?.show && !Number.isFinite(baselinePercent),
    },
    markers: row.markers,
  };
}
