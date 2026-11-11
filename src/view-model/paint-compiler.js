import { colorModeToFillStyle, getFiniteNumber, parsePercentLiteral } from '../config/normalize.js';
import { toScalePct } from './scale-projection.js';

function resolveCssGradientStops(stops) {
  let previousPosition = -Infinity;
  return stops.map((stop) => {
    previousPosition = Math.max(previousPosition, stop.p);
    return { ...stop, p: previousPosition };
  });
}

function projectGradientStops(stops, scaleDirection) {
  if (scaleDirection !== 'reverse') return stops.map(stop => ({ ...stop }));

  // CSS fixes decreasing stop positions by moving each stop to the previous
  // stop's position. Resolve that semantic ordering before reflecting it.
  return resolveCssGradientStops(stops)
    .map(stop => ({ ...stop, p: 100 - stop.p }))
    .reverse();
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

export function getSeverityInterpolationStops(paint, minValue = 0, maxValue = 100, preserveCssColors = false) {
  const bands = getSegmentsForRendering(paint, minValue, maxValue);
  const sorted = bands
    .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s.from < s.to && s?.color)
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

export function getBandsGradientCss(bands, _fallbackColor = '#4a9eff', scaleDirection = 'normal') {
  const sorted = bands
    .filter(s => Number.isFinite(s?.from) && Number.isFinite(s?.to) && s.from < s.to && s?.color)
    .sort((a, b) => a.from - b.from);

  if (!sorted.length) return null;

  // Keep the released v1.8 semantics: each authored Segment contributes only
  // its own flat-color endpoints. CSS interpolates gaps and extends the edge
  // colors beyond the first and last Segment.
  const stops = [];
  for (const band of sorted) {
    stops.push({ color: band.color, p: band.from }, { color: band.color, p: band.to });
  }

  const projectedStops = scaleDirection === 'reverse'
    ? projectGradientStops(stops, scaleDirection)
    : stops;
  return `linear-gradient(to right, ${projectedStops.map(stop => `${stop.color} ${stop.p}%`).join(', ')})`;
}

export function getSeverityBandGradientCss(paint, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  return getBandsGradientCss(getSegmentsForRendering(paint, minValue, maxValue), paint?.color ?? '#4a9eff', scaleDirection);
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

export function getSoftBandGradientStops(paint, minValue = 0, maxValue = 100) {
  const bands = getSegmentsForRendering(paint, minValue, maxValue);
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

export function getSoftBandGradientCss(paint, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  const stops = projectGradientStops(getSoftBandGradientStops(paint, minValue, maxValue), scaleDirection);
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

export function getEffectiveFillStyle(paint) {
  return paint?.fill_style
    ?? colorModeToFillStyle(paint?.color_mode)
    ?? 'bands';
}

export function segmentsNeedBoundaryResolution(segments) {
  return Array.isArray(segments) && segments.some((segment) => (
    (segment?.from && typeof segment.from === 'object' && !Array.isArray(segment.from))
    || (segment?.to && typeof segment.to === 'object' && !Array.isArray(segment.to))
  ));
}

export function getSegmentsForRendering(paint, minValue = 0, maxValue = 100) {
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) ? maxValue : 100;
  const rawSegments = (Array.isArray(paint?.segments) ? paint.segments : [])
    .filter((segment) => !segment?.invalidBoundary);
  if (paint?.segment_space === 'scale' || segmentsNeedBoundaryResolution(rawSegments)) {
    const resolvedSegments = rawSegments
      .map((segment) => ({
        from: resolveSegmentBoundaryPct(segment.from, safeMin, safeMax),
        to: resolveSegmentBoundaryPct(segment.to, safeMin, safeMax),
        color: segment.color,
        label: segment.label ?? null,
      }))
      .filter((segment) => Number.isFinite(segment.from) && segment.color);

    return inferSegmentEndValues(resolvedSegments, 100)
      .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to)
        && segment.from < segment.to && segment.color);
  }

  return inferSegmentEndValues(rawSegments, 100)
    .filter((segment) => Number.isFinite(segment.from) && Number.isFinite(segment.to)
      && segment.from < segment.to && segment.color);
}

export function getColor(pct, paint, minValue = 0, maxValue = 100) {
  const fillStyle = getEffectiveFillStyle(paint);
  if (fillStyle === 'solid') return paint.color;

  if (fillStyle === 'gradient' || fillStyle === 'band_gradient' || fillStyle === 'soft_bands') {
    let stops;
    if (fillStyle === 'band_gradient') {
      stops = getSeverityInterpolationStops(paint, minValue, maxValue);
    } else if (fillStyle === 'soft_bands') {
      stops = resolveCssGradientStops(getSoftBandGradientStops(paint, minValue, maxValue))
        .map((stop) => {
          const rgb = hexToRgb(stop.color);
          return rgb ? { p: stop.p, ...rgb } : null;
        })
        .filter(Boolean);
    } else if (paint.gradient_stops && paint.gradient_stops.length >= 2) {
      stops = paint.gradient_stops.map(s => {
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
    if (!stops || !stops.length) return paint.color;
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
  for (const s of getSegmentsForRendering(paint, minValue, maxValue)) {
    if (pct >= s.from && pct <= s.to) return s.color;
  }
  return paint.color;
}

export function buildFullScaleGradientStyle(stops, scaleDirection = 'normal') {
  if (!Array.isArray(stops) || !stops.length) return null;
  const cssStops = projectGradientStops(stops, scaleDirection).map((stop) => {
    const cssColor = stop.color ?? rgbToCss(stop);
    return cssColor ? `${cssColor} ${stop.p}%` : null;
  }).filter(Boolean);
  if (!cssStops.length) return null;
  return `background:linear-gradient(to right,${cssStops.join(',')});background-repeat:no-repeat;`;
}

export function getGradientInterpolationStops(paint, minValue = 0, maxValue = 100) {
  const fillStyle = getEffectiveFillStyle(paint);
  if (fillStyle === 'band_gradient') {
    // Painting accepts CSS colors directly; numeric color sampling still needs RGB.
    return getSeverityInterpolationStops(paint, minValue, maxValue, true);
  }

  if (fillStyle === 'soft_bands') {
    return getSoftBandGradientStops(paint, minValue, maxValue)
      .map((stop) => {
        const rgb = hexToRgb(stop.color);
        return rgb ? { p: stop.p, ...rgb } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.p - b.p);
  }

  if (paint.gradient_stops && paint.gradient_stops.length >= 2) {
    return paint.gradient_stops
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

export function getBasePaintGradient(color, paint, minValue = 0, maxValue = 100, scaleDirection = 'normal') {
  const fillStyle = getEffectiveFillStyle(paint);
  if (paint.solid_fill) {
    return buildSolidGradientStyle(color);
  }

  if (fillStyle === 'bands') {
    return getSeverityBandGradientCss(paint, minValue, maxValue, scaleDirection);
  }

  if (fillStyle === 'soft_bands') {
    return getSoftBandGradientCss(paint, minValue, maxValue, scaleDirection);
  }

  if (fillStyle === 'gradient' || fillStyle === 'band_gradient') {
    const stops = getGradientInterpolationStops(paint, minValue, maxValue);
    return buildFullScaleGradientStyle(stops, scaleDirection)?.replace(/^background:/, '').replace(/;background-repeat:no-repeat;$/, '');
  }

  return buildSolidGradientStyle(color);
}

/** Compile fill paint over the full Scale. samplePercent is a semantic Scale
 * percentage; direction changes CSS placement, never the sampled color.
 * Configuration inheritance, overlays and reveal geometry belong to callers.
 */
export function compilePaint(paint, {
  minValue = 0, maxValue = 100, scaleDirection = 'normal', samplePercent = 0,
} = {}) {
  const color = getColor(samplePercent, paint, minValue, maxValue);
  return {
    color,
    gradient: getBasePaintGradient(color, paint, minValue, maxValue, scaleDirection),
  };
}
