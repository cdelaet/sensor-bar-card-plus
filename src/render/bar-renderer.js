import { normalizeMarkerShape } from '../view-model/marker-view-model.js';
import { getEffectiveMarkerColor, getMarkerContrastColor } from '../view-model/bar-render-model.js';
import { escapeHtml, setStyleIfChanged, setStyleTextIfChanged, setDatasetIfChanged, setClassNameIfChanged } from '../utils/dom.js';

// Operates inside the adapter's existing DOM. No entity, history or layout state.

export function renderMarker(marker) {
  if (!marker) return '';
  const position = Number.isFinite(marker.position) ? marker.position : 0;
  const color = getEffectiveMarkerColor(marker);
  const contrastColor = getMarkerContrastColor(color);
  const display = marker.visible ? '' : 'none';
  const defaultShape = marker.type === 'target' ? 'diamond' : marker.type === 'generic' ? 'circle' : 'triangle';
  const shape = normalizeMarkerShape(marker.shape, defaultShape);
  const lane = marker.lane ?? (marker.type === 'peak' ? 'above' : 'below');
  const historyStatus = ['partial', 'stale'].includes(marker.historyStatus) ? marker.historyStatus : '';
  const baseLabel = historyStatus === 'partial' ? 'Partial history' : historyStatus === 'stale' ? 'Stale history' : '';
  const historyLabel = escapeHtml(baseLabel && marker.historyReason ? `${baseLabel}: ${marker.historyReason}` : baseLabel);
  const historyAttributes = historyStatus ? ` data-history-status="${historyStatus}" data-history-edge="${position > 90 ? 'end' : 'start'}"` : '';
  const historyIndicator = `<span class="history-indicator"${historyStatus ? ` data-sbcp-tooltip="${historyLabel}" role="img" aria-label="${marker.type === 'peak' ? 'Peak' : 'Floor'}: ${historyLabel}"${marker.visible ? ' tabindex="0"' : ''}` : ' aria-hidden="true"'}>${historyStatus === 'partial' ? '!' : historyStatus === 'stale' ? '~' : ''}</span>`;
  const shapePaths = `<g class="marker-shape-paths">
    <path data-shape="circle" d="M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1Z"></path>
    <path data-shape="diamond" d="M8 1L15 8L8 15L1 8Z"></path>
    <path data-shape="chevron" d="M2 2L8 8L14 2 M2 8L8 14L14 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    <path data-shape="arrow" d="M8 15 L3 3 H6 L8 7 L10 3 H13 Z"></path>
    <path data-shape="pin" fill-rule="evenodd" d="M8 15.5 C7.1 14 3 9.7 3 6 A5 5 0 1 1 13 6 C13 9.7 8.9 14 8 15.5 Z M8 4.2 A1.8 1.8 0 1 0 8 7.8 A1.8 1.8 0 1 0 8 4.2 Z"></path>
  </g>`;

  if (marker.type === 'generic') {
    const triangleClasses = lane === 'above'
      ? ['peak-inset', 'peak-outset']
      : ['target-inset', 'target-outset'];
    return `
    <div class="generic-marker" data-marker-id="${escapeHtml(marker.id)}" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}" data-show-marker="${marker.showMarker === false ? 'false' : 'true'}" style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="${triangleClasses[0]}"></div>
      <div class="${triangleClasses[1]}"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
    </div>`;
  }

  if (marker.type === 'target' || marker.type === 'floor') {
    const markerClass = `${marker.type}-marker`;
    return `
    <div class="${markerClass}" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}"${historyAttributes} style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="${marker.type}-inset"></div>
      <div class="${marker.type}-outset"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
      ${marker.type === 'floor' ? historyIndicator : ''}
    </div>`;
  }

  return `
    <div class="peak-marker" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}"${historyAttributes} style="left:${position}%;--marker-color:${color};--marker-contrast-color:${contrastColor};display:${display};">
      <div class="peak-outset"></div>
      <div class="peak-inset"></div>
      <svg class="marker-shape-svg" data-shape="${shape}" data-lane="${lane}" data-direction="${marker.direction ?? 'inward'}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${shapePaths}</svg>
      ${historyIndicator}
    </div>`;
}

export function patchMarker(markerEl, marker) {
  if (!markerEl || !marker) return;

  const defaultShape = marker.type === 'generic' ? 'circle' : marker.type === 'peak' || marker.type === 'floor' ? 'triangle' : 'diamond';
  const shape = normalizeMarkerShape(marker.shape, defaultShape);
  setDatasetIfChanged(markerEl, 'shape', shape);
  setDatasetIfChanged(markerEl, 'lane', marker.lane ?? (marker.type === 'peak' ? 'above' : 'below'));
  setDatasetIfChanged(markerEl, 'direction', marker.direction ?? 'inward');
  if (marker.type === 'peak' || marker.type === 'floor') {
    const status = ['partial', 'stale'].includes(marker.historyStatus) ? marker.historyStatus : '';
    const base = status === 'partial' ? 'Partial history' : status === 'stale' ? 'Stale history' : '';
    const label = base && marker.historyReason ? `${base}: ${marker.historyReason}` : base;
    setDatasetIfChanged(markerEl, 'historyStatus', status);
    setDatasetIfChanged(markerEl, 'historyEdge', marker.position > 90 ? 'end' : 'start');
    markerEl.removeAttribute?.('title');
    const indicator = markerEl.querySelector?.('.history-indicator');
    if (indicator) {
      indicator.textContent = status === 'partial' ? '!' : status === 'stale' ? '~' : '';
      indicator.removeAttribute('title');
      if (status) {
        indicator.setAttribute('data-sbcp-tooltip', label);
        indicator.setAttribute('role', 'img');
        indicator.setAttribute('aria-label', `${marker.type === 'peak' ? 'Peak' : 'Floor'}: ${label}`);
        indicator.setAttribute('tabindex', marker.visible ? '0' : '-1');
        indicator.removeAttribute('aria-hidden');
      } else {
        indicator.removeAttribute('data-sbcp-tooltip');
        indicator.removeAttribute('role');
        indicator.removeAttribute('aria-label');
        indicator.removeAttribute('tabindex');
        indicator.setAttribute('aria-hidden', 'true');
      }
    }
  }
  if (marker.type === 'generic') {
    setDatasetIfChanged(markerEl, 'showMarker', marker.showMarker === false ? 'false' : 'true');
  }
  const shapeSvg = markerEl.querySelector?.('.marker-shape-svg');
  if (shapeSvg) {
    setDatasetIfChanged(shapeSvg, 'shape', shape);
    setDatasetIfChanged(shapeSvg, 'lane', marker.lane ?? (marker.type === 'peak' ? 'above' : 'below'));
    setDatasetIfChanged(shapeSvg, 'direction', marker.direction ?? 'inward');
  }

  setStyleIfChanged(markerEl, 'display', marker.visible ? '' : 'none');
  if (marker.visible && Number.isFinite(marker.position)) {
    setStyleIfChanged(markerEl, 'left', `${marker.position}%`);
  }
  const markerColor = getEffectiveMarkerColor(marker);
  setStyleIfChanged(markerEl, '--marker-color', markerColor);
  setStyleIfChanged(markerEl, '--marker-contrast-color', getMarkerContrastColor(markerColor));
}

export function renderHistoryStatus(summary) {
  return `<span class="history-status-badge"${summary ? ` data-sbcp-tooltip="${escapeHtml(summary.text)}" role="img" aria-label="${escapeHtml(summary.text)}" tabindex="0"` : ' hidden aria-hidden="true"'}>${summary?.pending ? '…' : '!'}</span>`;
}

export function patchHistoryStatus(root, summary) {
  const badge = root?.querySelector?.('.history-status-badge');
  if (!badge) return;
  badge.hidden = !summary;
  badge.textContent = summary?.pending ? '…' : '!';
  badge.removeAttribute('title');
  if (summary) {
    badge.setAttribute('data-sbcp-tooltip', summary.text);
    badge.setAttribute('aria-label', summary.text);
    badge.removeAttribute('aria-hidden');
    badge.setAttribute('tabindex', '0');
  } else {
    badge.removeAttribute('data-sbcp-tooltip');
    badge.removeAttribute('aria-label');
    badge.setAttribute('aria-hidden', 'true');
    badge.removeAttribute('tabindex');
  }
}

/** Patch persistent bar nodes. The adapter supplies transition timing. */
export function patchBar(root, model, { revealDuration = 600 } = {}) {
  const fillReveal = root.querySelector('.bar-fill-reveal');
  const baselineIndicator = root.querySelector('.baseline-indicator');
  const paintLayer = root.querySelector('.bar-paint-layer[data-layer="base"]');
  if (fillReveal) {
    setStyleTextIfChanged(fillReveal, `${model.fill.revealStyle};--sbcp-reveal-duration:${revealDuration}ms`);
    setClassNameIfChanged(fillReveal, `bar-fill-reveal${model.animated ? '' : ' no-anim'}`);
  }
  if (baselineIndicator) {
    const baselinePosition = model.baseline.positionPercent ?? model.baseline.percent;
    setStyleIfChanged(baselineIndicator, 'display', Number.isFinite(baselinePosition) ? 'block' : 'none');
    if (Number.isFinite(baselinePosition)) {
      setStyleIfChanged(baselineIndicator, 'left', `${baselinePosition}%`);
    }
  }
  if (paintLayer) {
    const baseLayerState = model.fill.paintLayers.find(layer => layer.id === 'base');
    if (baseLayerState) {
      setStyleTextIfChanged(paintLayer, `z-index:${baseLayerState.zIndex};${baseLayerState.paintStyle}${baseLayerState.revealStyle}`);
    }
  }
  const aboveTargetLayer = root.querySelector('.bar-paint-layer[data-layer="above-target"]');
  if (aboveTargetLayer) {
    const aboveTargetState = model.fill.paintLayers.find(layer => layer.id === 'above-target');
    if (aboveTargetState) {
      setStyleTextIfChanged(aboveTargetLayer, `z-index:${aboveTargetState.zIndex};${aboveTargetState.paintStyle}${aboveTargetState.revealStyle}`);
    }
  }
  const needleEl = root.querySelector('.needle-marker');
  if (needleEl) {
    setStyleIfChanged(needleEl, 'display', model.needle.show ? 'block' : 'none');
    setStyleIfChanged(needleEl, 'left', `${model.needle.pct ?? 0}%`);
    setStyleIfChanged(needleEl, '--needle-color', model.needle.color);
    setStyleIfChanged(needleEl, '--needle-border-color', model.needle.borderColor);
    setDatasetIfChanged(needleEl, 'edge', model.needle.edge);
  }
  const markers = model.markers;
  const getMarker = (id) => markers.find(marker => marker.id === id || marker.type === id) ?? null;
  patchMarker(root.querySelector('.target-marker'), getMarker('target'));
  patchMarker(root.querySelector('.peak-marker'), getMarker('peak'));
  patchMarker(root.querySelector('.floor-marker'), getMarker('floor'));
  (root.querySelectorAll?.('.generic-marker[data-marker-id]') ?? []).forEach(markerEl => {
    patchMarker(markerEl, getMarker(markerEl.dataset.markerId));
  });
}

/** The optional inside content is rendered and owned by the card adapter. */
export function renderBar(model, { insideContent = '' } = {}) {
  const fillState = model.fill;
  const baselinePct = model.baseline.positionPercent ?? model.baseline.percent;
  const needleState = model.needle;
  const baselineIndicator = model.baseline.configured
    ? `<div class="baseline-indicator" aria-hidden="true" style="${Number.isFinite(baselinePct) ? `left:${baselinePct}%;display:block;` : 'display:none;'}"></div>`
    : '';
  const getMarker = (type) => model.markers.find(marker => marker.id === type || marker.type === type) ?? null;
  const peakMarker = renderMarker(getMarker('peak'));
  const targetMarker = renderMarker(getMarker('target'));
  const floorMarker = renderMarker(getMarker('floor'));
  const genericMarkers = model.markers.filter(marker => marker.type === 'generic').map(renderMarker).join('');
  const needleMarker = needleState.configured ? `
      <div class="needle-layer">
        <div class="needle-marker" data-edge="${needleState.edge}" style="left:${needleState.pct ?? 0}%;--needle-color:${needleState.color};--needle-border-color:${needleState.borderColor};display:${needleState.show ? 'block' : 'none'};"></div>
      </div>` : '';
  const paintLayers = fillState.paintLayers.map(layer => `
                  <div class="bar-paint-layer" data-layer="${layer.id}" style="z-index:${layer.zIndex};${layer.paintStyle}${layer.revealStyle}"></div>`).join('');
  return `<div class="bar-track">
                <div class="bar-fill-reveal${model.animated ? '' : ' no-anim'}" style="${fillState.revealStyle}">
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
