import { colorModeToFillStyle, getFiniteNumber, parsePercentLiteral } from '../config/normalize.js';

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

export function inferSegmentEndValues(segments, fallbackEnd = null) {
  const sorted = [...segments].sort((a, b) => a.from - b.from);
  return sorted.map((segment, index) => {
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
      label: segment.label ?? null,
    };
  });
}

export function hexToRgb(color) {
  if (!color || typeof color !== 'string') return null;
  const hex = color.replace('#', '').trim();
  const full = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function getSeverityInterpolationStops(ecfg, minValue = 0, maxValue = 100, preserveCssColors = false) {
  const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
  const sorted = bands
    .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
    .sort((a, b) => a.from - b.from);

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
      anchor = band.from + ((band.to - band.from) / 2);
    }
    if (!stops.length || stops[stops.length - 1].p !== anchor) {
      stops.push({ p: anchor, ...(rgb ?? { color: band.color }) });
    }
  }

  return stops;
}

export function getSeverityBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
  const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
  const sorted = bands
    .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
    .sort((a, b) => a.from - b.from);

  if (!sorted.length) return null;

  const stops = [];
  for (const band of sorted) {
    stops.push(`${band.color} ${band.from}%`, `${band.color} ${band.to}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function getSoftBandBlendWidthPct() {
  return 1.5;
}

export function pushGradientColorStop(stops, pos, color) {
  if (!Array.isArray(stops) || !color) return;
  const clampedPos = Math.min(100, Math.max(0, pos));
  const last = stops[stops.length - 1];
  if (last && last.color === color && Math.abs(last.p - clampedPos) < 0.0001) return;
  stops.push({ p: clampedPos, color });
}

export function getSoftBandGradientStops(ecfg, minValue = 0, maxValue = 100) {
  const bands = getSegmentsForRendering(ecfg, minValue, maxValue);
  const sorted = bands
    .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s?.color)
    .sort((a, b) => a.from - b.from);

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

export function getSoftBandGradientCss(ecfg, minValue = 0, maxValue = 100) {
  const stops = getSoftBandGradientStops(ecfg, minValue, maxValue);
  if (!stops.length) return null;
  return `linear-gradient(to right, ${stops.map((stop) => `${stop.color} ${stop.p}%`).join(', ')})`;
}

export function resolveSegmentBoundaryPct(boundary, minValue, maxValue) {
  if (boundary === null || boundary === undefined) return null;

  if (typeof boundary === 'object' && !Array.isArray(boundary)) {
    const fixed = getFiniteNumber(boundary.fixed);
    if (Number.isFinite(fixed)) {
      return toScalePct(fixed, minValue, maxValue);
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
  return Number.isFinite(fixed) ? toScalePct(fixed, minValue, maxValue) : null;
}

export function getEffectiveFillStyle(ecfg) {
  return ecfg?.bar?.fill_style
    ?? colorModeToFillStyle(ecfg?.bar?.color_mode)
    ?? 'bands';
}

export function segmentsNeedBoundaryResolution(segments) {
  return Array.isArray(segments) && segments.some((segment) => (
    (segment?.from && typeof segment.from === 'object' && !Array.isArray(segment.from))
    || (segment?.to && typeof segment.to === 'object' && !Array.isArray(segment.to))
  ));
}

export function getSegmentsForRendering(ecfg, minValue = 0, maxValue = 100) {
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  const rawSegments = (Array.isArray(ecfg.bar?.segments) ? ecfg.bar.segments : [])
    .filter((segment) => !segment?.invalidBoundary);
  if (ecfg.bar?.segment_space === 'scale' || segmentsNeedBoundaryResolution(rawSegments)) {
    const resolvedSegments = rawSegments
      .map((segment) => ({
        from: resolveSegmentBoundaryPct(segment.from, safeMin, safeMax),
        to: resolveSegmentBoundaryPct(segment.to, safeMin, safeMax),
        color: segment.color,
        label: segment.label ?? null,
      }))
      .filter((segment) => Number.isFinite(segment.from) && segment.color);

    return inferSegmentEndValues(resolvedSegments, 100)
      .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
  }

  return inferSegmentEndValues(rawSegments, 100)
    .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to) && segment.color);
}

export function getColor(pct, ecfg, minValue = 0, maxValue = 100) {
  const fillStyle = getEffectiveFillStyle(ecfg);
  if (fillStyle === 'solid') return ecfg.bar.color;

  if (fillStyle === 'gradient' || fillStyle === 'band_gradient' || fillStyle === 'soft_bands') {
    let stops;
    if (fillStyle === 'band_gradient') {
      stops = getSeverityInterpolationStops(ecfg, minValue, maxValue);
    } else if (fillStyle === 'soft_bands') {
      stops = getSoftBandGradientStops(ecfg, minValue, maxValue)
        .map((stop) => {
          const rgb = hexToRgb(stop.color);
          return rgb ? { p: stop.p, ...rgb } : null;
        })
        .filter(Boolean);
    } else if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
      stops = ecfg.bar.gradient_stops.map(s => {
        const hex = s.color.replace('#','');
        const full = hex.length === 3
          ? hex.split('').map(c => c+c).join('')
          : hex;
        return { p: s.pos, r: parseInt(full.slice(0,2),16), g: parseInt(full.slice(2,4),16), b: parseInt(full.slice(4,6),16) };
      });
      stops.sort((a,b) => a.p - b.p);
    } else {
      stops = [
        { p: 0,   r: 76,  g: 175, b: 80  },
        { p: 50,  r: 255, g: 152, b: 0   },
        { p: 100, r: 244, g: 67,  b: 54  },
      ];
    }
    if (!stops || !stops.length) return ecfg.bar.color;
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (pct >= stops[i].p && pct <= stops[i + 1].p) {
        lo = stops[i]; hi = stops[i + 1]; break;
      }
    }
    const t = lo.p === hi.p ? 0 : (pct - lo.p) / (hi.p - lo.p);
    return `rgb(${Math.round(lo.r + t*(hi.r-lo.r))},${Math.round(lo.g + t*(hi.g-lo.g))},${Math.round(lo.b + t*(hi.b-lo.b))})`;
  }

  // Bands mode
  for (const s of getSegmentsForRendering(ecfg, minValue, maxValue)) {
    if (pct >= s.from && pct <= s.to) return s.color;
  }
  return ecfg.bar.color;
}

export function buildFullScaleGradientStyle(stops) {
  if (!Array.isArray(stops) || !stops.length) return null;
  const cssStops = stops.map((stop) => {
    const cssColor = stop.color ?? rgbToCss(stop);
    return cssColor ? `${cssColor} ${stop.p}%` : null;
  }).filter(Boolean);
  if (!cssStops.length) return null;
  return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
}

export function getGradientInterpolationStops(ecfg, minValue = 0, maxValue = 100) {
  const fillStyle = getEffectiveFillStyle(ecfg);
  if (fillStyle === 'band_gradient') {
    // Painting accepts CSS colors directly; numeric color sampling still needs RGB.
    return getSeverityInterpolationStops(ecfg, minValue, maxValue, true);
  }

  if (fillStyle === 'soft_bands') {
    return getSoftBandGradientStops(ecfg, minValue, maxValue)
      .map((stop) => {
        const rgb = hexToRgb(stop.color);
        return rgb ? { p: stop.p, ...rgb } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.p - b.p);
  }

  if (ecfg.bar.gradient_stops && ecfg.bar.gradient_stops.length >= 2) {
    return ecfg.bar.gradient_stops
      .map((s) => {
        const rgb = hexToRgb(s.color);
        return rgb ? { p: s.pos, ...rgb } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.p - b.p);
  }

  return [
    { p: 0,   r: 76,  g: 175, b: 80  },
    { p: 50,  r: 255, g: 152, b: 0   },
    { p: 100, r: 244, g: 67,  b: 54  },
  ];
}

export function rgbToCss(rgb) {
  if (!rgb) return null;
  return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

export function buildSolidGradientStyle(color) {
  return `linear-gradient(to right,${color} 0%,${color} 100%)`;
}

export function getBasePaintGradient(color, ecfg, minValue = 0, maxValue = 100) {
  const fillStyle = getEffectiveFillStyle(ecfg);
  if (ecfg.bar.solid_fill) {
    return buildSolidGradientStyle(color);
  }

  if (fillStyle === 'bands') {
    return getSeverityBandGradientCss(ecfg, minValue, maxValue);
  }

  if (fillStyle === 'soft_bands') {
    return getSoftBandGradientCss(ecfg, minValue, maxValue);
  }

  if (fillStyle === 'gradient' || fillStyle === 'band_gradient') {
    const stops = getGradientInterpolationStops(ecfg, minValue, maxValue);
    return buildFullScaleGradientStyle(stops)?.replace(/^background:/, '').replace(/;background-repeat:no-repeat;$/, '');
  }

  return buildSolidGradientStyle(color);
}

export function getOverlayGradient(startPct, endPct, color) {
  if (!color) return null;
  const start = Math.min(100, Math.max(0, startPct));
  const end = Math.min(100, Math.max(0, endPct));
  if (end <= start) return null;
  return `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;
}

export function toScalePct(value, minValue, maxValue) {
  if (!Number.isFinite(value)) return null;
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  const range = safeMax - safeMin || 1;
  return Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));
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

export function getAboveTargetOverlayInterval(targetPct = null) {
  if (!Number.isFinite(targetPct)) return null;

  const start = Math.min(100, Math.max(0, targetPct));
  if (start >= 100) return null;

  return {
    start,
    end: 100,
  };
}

export function getAboveTargetLayerGeometry(targetPct = null) {
  const interval = getAboveTargetOverlayInterval(targetPct);
  if (!interval) return null;

  return {
    start: interval.start,
    end: interval.end,
    hidden: false,
  };
}

export function getFullScalePaintStyle(ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
  const layers = [];
  const basePaint = getBasePaintGradient(color, ecfg, minValue, maxValue);
  const clampedBaseline = Number.isFinite(baselinePct)
    ? Math.min(100, Math.max(0, baselinePct))
    : null;

  if (Number.isFinite(clampedBaseline)) {
    const belowColor = ecfg.baseline?.below?.color ?? null;
    const aboveColor = ecfg.baseline?.above?.color ?? null;
    const belowOverlay = getOverlayGradient(0, clampedBaseline, belowColor);
    const aboveOverlay = getOverlayGradient(clampedBaseline, 100, aboveColor);
    if (belowOverlay) layers.push(belowOverlay);
    if (aboveOverlay) layers.push(aboveOverlay);
  }

  if (basePaint) layers.push(basePaint);
  if (!layers.length) return 'display:none;';

  return `display:block;inset:0;background-image:${layers.join(',')};background-repeat:no-repeat;background-size:100% 100%;`;
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

export function getFillPaintLayers(geometry, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100) {
  const basePaintStyle = getFullScalePaintStyle(ecfg, color, targetPct, baselinePct, minValue, maxValue);
  const baseLayer = {
    id: 'base',
    zIndex: 1,
    visible: true,
    paintStyle: basePaintStyle,
    revealStyle: 'display:block;',
  };

  const aboveTargetGeometry = getAboveTargetLayerGeometry(targetPct);
  const aboveTargetLayer = {
    id: 'above-target',
    zIndex: 2,
    visible: !!(ecfg?.bar?.above_target_color && aboveTargetGeometry),
    paintStyle: ecfg?.bar?.above_target_color
      ? `display:block;inset:0;background:${ecfg.bar.above_target_color};`
      : 'display:none;',
    revealStyle: aboveTargetGeometry
      ? getStaticLayerRevealStyle(aboveTargetGeometry)
      : getStaticLayerRevealStyle({ start: 0, end: 0, hidden: true }),
  };

  return [baseLayer, aboveTargetLayer];
}

export function getFillRenderState(pct, h, ecfg, color, targetPct = null, baselinePct = null, minValue = 0, maxValue = 100, needleActive = false) {
  const geometry = needleActive
    ? getNormalizedPercent(100, null)
    : getNormalizedPercent(pct, baselinePct);
  const paintLayers = getFillPaintLayers(geometry, h, ecfg, color, targetPct, baselinePct, minValue, maxValue);
  return {
    geometry,
    paintLayers,
    paintStyle: paintLayers[0]?.paintStyle ?? 'display:none;',
    revealStyle: getRevealShapeStyle(geometry, h),
  };
}

export function getNeedleRenderState(rawValue, ecfg, minValue = 0, maxValue = 100, baselinePct = null) {
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

  const pct = Math.min(100, Math.max(0, toScalePct(rawValue, minValue, maxValue)));
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
  const rgb = parseColorToRgb(color);
  if (!rgb) return '#000000';
  const toLinear = (channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (
    0.2126 * toLinear(rgb.r)
    + 0.7152 * toLinear(rgb.g)
    + 0.0722 * toLinear(rgb.b)
  );
  return luminance < 0.22 ? '#ffffff' : '#000000';
}

/** Build physical-bar presentation from resolved row data and normalized appearance.
 * Height is supplied by the adapter; entity resolution and history remain outside.
 */
export function buildBarRenderModel(row, appearance, { height, color = getColor(row.percent, appearance, row.min, row.max) } = {}) {
  const baselinePercent = row.baselinePercent;
  const baselineAt = appearance.baseline?.at;
  const baselineConfigured = appearance.baseline?.enabled !== false && (
    Number.isFinite(baselinePercent)
    || Boolean(baselineAt?.entity)
    || baselineAt?.fixed !== null && baselineAt?.fixed !== undefined
    || Number.isFinite(baselineAt?.percent)
  );
  return {
    animated: appearance.bar.animated,
    fill: getFillRenderState(row.percent, height, appearance, color, row.targetPercent, baselinePercent, row.min, row.max, row.needle.show),
    baseline: { configured: baselineConfigured, percent: baselinePercent },
    needle: {
      ...row.needle,
      configured: appearance.bar?.needle?.show && !Number.isFinite(baselinePercent),
    },
    markers: row.markers,
  };
}
