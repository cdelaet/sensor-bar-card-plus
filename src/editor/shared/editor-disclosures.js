import { escapeAttribute } from './editor-controls.js';

// Canonical root disclosure markup; each host owns its local expanded Set.
export function renderCardGroup({ group, title, summary, content, inactive = false }, expanded) {
    return `
      <div class="override-group card-subgroup${inactive ? ' is-inactive' : ''}" data-group="${group}" data-expanded="${expanded ? 'true' : 'false'}">
        <button
          type="button"
          id="card-group-${group}"
          class="override-group-toggle"
          data-action="toggle-card-group"
          data-group="${group}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <span id="card-group-${group}-title" class="override-group-title">${expanded ? '▾' : '▸'} ${title}</span>
          <span id="card-group-${group}-summary" class="override-group-summary">${escapeAttribute(summary)}</span>
        </button>
        <div class="override-group-body" style="display:${expanded ? 'grid' : 'none'};">
          ${content}
        </div>
      </div>
    `;
}

export function renderMarkersSection({ renderGroup, target, peak, floor, references }) {
  return `	        <div class="section">
          <div class="section-head">
	            <h3>Markers</h3>
	            <div class="section-note">Configure Target, Peak, Floor, and custom reference markers.</div>
	          </div>
	          <div class="field-grid">
            ${renderGroup({ group: 'marker-target', title: 'Target', ...target })}
            ${renderGroup({ group: 'marker-peak', title: 'Peak', ...peak })}
            ${renderGroup({ group: 'marker-floor', title: 'Floor', ...floor })}
            ${renderGroup({ group: 'generic-markers', title: 'Generic Reference Markers', ...references })}
          </div>
	        </div>`;
}
