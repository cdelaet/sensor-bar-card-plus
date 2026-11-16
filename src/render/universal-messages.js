const SEVERITIES = ['info', 'warning', 'error'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function iconMarkup(severity) {
  if (severity === 'info') return '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><circle cx="10" cy="10" r="7.5"></circle><path d="M10 9v5m0-8h.01"></path></svg>';
  if (severity === 'error') return '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><circle cx="10" cy="10" r="7.5"></circle><path d="m7 7 6 6m0-6-6 6"></path></svg>';
  return '<svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><path d="M10 2.2 18 17H2z"></path><path d="M10 7v4m0 3h.01"></path></svg>';
}

function fallbackDescription(diagnostic) {
  if (diagnostic.fallback === 'default_opacity') return 'Using 100% opacity.';
  if (diagnostic.fallback === 'inherited') return 'Using the inherited paint.';
  if (diagnostic.fallback === 'default') return 'Using the default paint.';
  if (diagnostic.fallback === 'preset_resolution_disabled') return '';
  if (diagnostic.code === 'paint.legacy_conflict') return '';
  if (diagnostic.code === 'paint.invalid_value' && !String(diagnostic.path ?? '').endsWith('.opacity')) {
    return 'The invalid property falls back independently; other valid Paint properties remain active.';
  }
  if (diagnostic.code === 'target.invalid_ordering') return 'Target markers retain their normal visibility.';
  return '';
}

function diagnosticExplanation(diagnostic) {
  const reference = diagnostic.reference ? `“${diagnostic.reference}”` : '';
  const reason = diagnostic.reason ? ` (${diagnostic.reason.replaceAll('_', ' ')})` : '';
  let cause = diagnostic.message ?? diagnostic.code ?? 'Configuration issue.';
  switch (diagnostic.code) {
    case 'paint_preset_missing':
      cause = `Paint preset ${reference} was not found.`;
      break;
    case 'paint_preset_invalid':
      cause = `Paint preset ${reference} is invalid${reason}.`;
      break;
    case 'paint_preset_reference_invalid':
      cause = 'Paint preset reference must be a non-empty name.';
      break;
    case 'paint_registry_unavailable':
      cause = `Paint preset ${reference} could not be checked${reason}.`;
      break;
    case 'paint_definition_invalid':
      cause = `Paint definition is invalid${reason}.`;
      break;
    case 'paint_opacity_invalid':
      cause = 'Paint opacity is invalid.';
      break;
    case 'inherited_paint_invalid':
      cause = `Inherited Paint is invalid${reason}.`;
      break;
    case 'multiple_preset_masters':
      cause = diagnostic.message ?? 'More than one master Card defines the dashboard Paint library.';
      break;
    default:
      break;
  }
  const fallback = fallbackDescription(diagnostic);
  if (diagnostic.code === 'paint_opacity_invalid') return `${cause} ${fallback || 'Using 100% opacity.'}`;
  return fallback && !cause.toLowerCase().includes(fallback.toLowerCase()) ? `${cause} ${fallback}` : cause;
}

function configurationArea(path = '') {
  const area = String(path)
    .replace(/^card\./, '')
    .replace(/^entities(?:\[[^\]]+\]|\.[^.]+\.[^.]+)\.?/, '')
    .replace(/^target\.when_above/, 'Target above')
    .replace(/^target\.when_below/, 'Target below')
    .replace(/^baseline\.above/, 'Baseline above')
    .replace(/^baseline\.below/, 'Baseline below')
    .replace(/^target$/, 'Target ordering')
    .replace(/^bar/, 'Bar')
    .replace(/\.paint/g, ' Paint')
    .replace(/_/g, ' ')
    .replace(/\./g, ' · ')
    .trim();
  return area || 'Configuration';
}

function normalizeMessages(diagnostics) {
  const messages = [];
  const seen = new Set();
  const cardMessageKeys = new Set();
  const activeHistoryWindows = [...(diagnostics?.warnings ?? []), ...(diagnostics?.errors ?? [])]
    .filter(diagnostic => diagnostic?.code === 'history.marker.invalid');
  for (const [defaultSeverity, entries] of [['warning', diagnostics?.warnings], ['error', diagnostics?.errors]]) {
    for (const diagnostic of entries ?? []) {
      const invalidMarker = diagnostic?.code === 'peak_marker.invalid_window' ? 'peak'
        : diagnostic?.code === 'floor_marker.invalid_window' ? 'floor' : null;
      // Prefer the live Recorder status when it carries the same invalid
      // configured window. Keep config diagnostics when no row status exists.
      if (invalidMarker && activeHistoryWindows.some(active => active.path === `history.${invalidMarker}`
        && active.window === diagnostic.window
        && (diagnostic.entity == null || diagnostic.entity === active.entity))) continue;
      const severity = SEVERITIES.includes(diagnostic?.severity) ? diagnostic.severity : defaultSeverity;
      const area = diagnostic?.area ?? configurationArea(diagnostic?.path);
      const explanation = diagnosticExplanation(diagnostic ?? {});
      const sharedKey = JSON.stringify([severity, diagnostic?.code, area, explanation]);
      if (diagnostic?.entity && cardMessageKeys.has(sharedKey)) continue;
      const key = JSON.stringify([severity, diagnostic?.code, diagnostic?.path, diagnostic?.entity,
        diagnostic?.reference, diagnostic?.reason, diagnostic?.window, area, explanation]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (!diagnostic?.entity) cardMessageKeys.add(sharedKey);
      messages.push({
        key,
        code: diagnostic?.code,
        severity,
        entity: diagnostic?.entity ?? null,
        area,
        explanation,
      });
    }
  }
  return messages;
}

export const disclosureStyles = `
  .sbcp-disclosure { box-sizing: border-box; width: 100%; min-width: 0; }
  .sbcp-disclosure[hidden], .sbcp-disclosure-panel[hidden] { display: none !important; }
  .sbcp-disclosure-toggle {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: var(--secondary-background-color, transparent);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sbcp-disclosure-toggle:focus-visible {
    outline: 2px solid var(--primary-color, currentColor);
    outline-offset: 2px;
  }
  .sbcp-disclosure-panel { min-width: 0; }
  .sbcp-disclosure-chevron {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    margin-left: auto;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg) translateY(-2px);
  }
  .sbcp-disclosure-toggle[aria-expanded="true"] .sbcp-disclosure-chevron {
    transform: rotate(225deg) translateY(-1px);
  }
`;

export const universalMessageStyles = `${disclosureStyles}
  .sbcp-messages {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    margin-top: 8px;
    color: var(--primary-text-color, inherit);
    font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif);
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.4);
  }
  .sbcp-messages .sbcp-disclosure-toggle { font-size: 12px; }
  .sbcp-messages-title {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 12px;
    font-weight: 500;
  }
  .sbcp-message-counts {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-width: 0;
  }
  .sbcp-message-count {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .sbcp-message-count[data-severity="info"] { color: var(--info-color, var(--primary-color, currentColor)); }
  .sbcp-message-count[data-severity="warning"] { color: var(--warning-color, #e0a000); }
  .sbcp-message-count[data-severity="error"] { color: var(--error-color, #db4437); }
  .sbcp-message-icon { display: inline-flex; flex: 0 0 auto; width: 16px; height: 16px; }
  .sbcp-message-icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .sbcp-message-list { display: grid; gap: 6px; min-width: 0; padding: 6px 8px 0; }
  .sbcp-message-list[hidden] { display: none !important; }
  .sbcp-message {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 4px 6px;
    min-width: 0;
    padding: 6px 8px;
    border-radius: 6px;
    background: var(--secondary-background-color, transparent);
  }
  .sbcp-message[data-severity="info"] .sbcp-message-icon { color: var(--info-color, var(--primary-color, currentColor)); }
  .sbcp-message[data-severity="warning"] .sbcp-message-icon { color: var(--warning-color, #e0a000); }
  .sbcp-message[data-severity="error"] .sbcp-message-icon { color: var(--error-color, #db4437); }
  .sbcp-message-content { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
  .sbcp-message-area { color: var(--secondary-text-color, inherit); font-size: 13px; }
  .sbcp-message-explanation { min-width: 0; overflow-wrap: anywhere; font-size: 12px; line-height: 1.4; }
  .sbcp-sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
`;

export function renderUniversalMessageArea() {
  return renderDisclosure({
    id: 'sbcp-message-list', className: 'sbcp-messages', title: 'Messages', hidden: true,
    heading: '<span class="sbcp-messages-title">Messages</span><span class="sbcp-message-counts"></span>',
    panel: '<div class="sbcp-message-list" role="list" aria-label="Active messages"></div>',
  });
}

export function renderDisclosure({ id, className = '', title = '', heading = title, panel = '', expanded = false, hidden = false } = {}) {
  const safeId = escapeHtml(id);
  return `<section class="sbcp-disclosure ${escapeHtml(className)}"${hidden ? ' hidden' : ''}>
    <button class="sbcp-disclosure-toggle" type="button" aria-expanded="${expanded}" aria-controls="${safeId}">
      ${heading}<span class="sbcp-disclosure-chevron" aria-hidden="true"></span>
    </button>
    <div class="sbcp-disclosure-panel" id="${safeId}"${expanded ? '' : ' hidden'}>${panel}</div>
  </section>`;
}

export function initializeDisclosure(root) {
  if (!root || root._sbcpDisclosureButton) return;
  const button = root.querySelector('.sbcp-disclosure-toggle');
  const panel = root.querySelector('.sbcp-disclosure-panel');
  if (!button || !panel) return;
  root._sbcpDisclosureButton = button;
  root._sbcpDisclosurePanel = panel;
  root._sbcpDisclosureExpanded = button.getAttribute('aria-expanded') === 'true';
  button.addEventListener('click', () => {
    root._sbcpDisclosureExpanded = !root._sbcpDisclosureExpanded;
    button.setAttribute('aria-expanded', String(root._sbcpDisclosureExpanded));
    button._sbcpDisclosureLabel?.(root._sbcpDisclosureExpanded);
    panel.hidden = !root._sbcpDisclosureExpanded;
  });
}

export function initializeUniversalMessageArea(area) {
  initializeDisclosure(area);
}

export function syncUniversalMessageArea(area, diagnostics) {
  if (!area) return;
  initializeUniversalMessageArea(area);
  const button = area._sbcpDisclosureButton;
  const list = area.querySelector('.sbcp-message-list');
  const counts = area.querySelector('.sbcp-message-counts');
  if (!button || !list || !counts) return;
  const messages = normalizeMessages(diagnostics);
  area.hidden = messages.length === 0;
  if (!messages.length) {
    area._sbcpMessageSignature = '';
    return;
  }
  const signature = JSON.stringify(messages);
  const grouped = Object.fromEntries(SEVERITIES.map(severity => [severity, messages.filter(message => message.severity === severity).length]));
  const summary = SEVERITIES.filter(severity => grouped[severity] > 0)
    .map(severity => `${grouped[severity]} ${severity === 'info' ? 'information' : `${severity}${grouped[severity] === 1 ? '' : 's'}`}`)
    .join(', ');
  button._sbcpMessageSummary = summary;
  button._sbcpDisclosureLabel = expanded => button.setAttribute('aria-label', `${summary} ${expanded ? 'Hide' : 'Show'} messages`);
  button._sbcpDisclosureLabel(area._sbcpDisclosureExpanded);
  button.setAttribute('aria-expanded', String(area._sbcpDisclosureExpanded));
  const countsMarkup = SEVERITIES.map(severity => `<span class="sbcp-message-count" data-severity="${severity}" aria-label="${severity === 'info' ? 'Information' : severity}: ${grouped[severity]}">
    <span class="sbcp-message-icon" aria-hidden="true">${iconMarkup(severity)}</span><span>${grouped[severity]}</span>
  </span>`).join('');
  if (counts.innerHTML !== countsMarkup) counts.innerHTML = countsMarkup;
  if (area._sbcpMessageSignature === signature) return;
  area._sbcpMessageSignature = signature;
  list.innerHTML = messages.map(message => `<div class="sbcp-message" data-severity="${message.severity}" role="listitem">
    <span class="sbcp-message-icon" aria-hidden="true">${iconMarkup(message.severity)}</span>
    <div class="sbcp-message-content">
      <div class="sbcp-message-area">${message.entity ? `${escapeHtml(message.entity)} · ` : ''}${escapeHtml(message.area)}</div>
      <div class="sbcp-message-explanation">${escapeHtml(message.explanation)}</div>
    </div>
  </div>`).join('');
}
