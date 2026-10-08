function createState(state, attrs = {}) {
  return {
    state: String(state),
    attributes: attrs,
  };
}

window.__sbcpRenderCard = async function renderCard(options) {
  const mount = document.getElementById('mount');
  mount.style.width = `${options.width || 720}px`;
  mount.innerHTML = '';

  const card = document.createElement('sensor-bar-card-plus');
  card.setConfig(options.config);
  card.hass = {
    states: options.states,
  };
  mount.appendChild(card);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return card;
};

window.__sbcpCreateState = createState;

// Models the public HA feature inputs and inherited feature/theme variables.
// Callers choose input order; the harness does not depend on Tile's private DOM.
window.__sbcpRenderFeature = async function renderFeature(options = {}) {
  const host = document.createElement('div');
  host.className = 'feature-host';
  host.style.cssText = `width:${options.width ?? 640}px;--feature-height:${options.height ?? 42}px;--feature-border-radius:12px;--feature-button-spacing:12px;--feature-color:#03a9f4;--primary-text-color:#f5f7fa;--secondary-text-color:#9ba4b0;--secondary-background-color:#202830;--primary-color:#03a9f4;`;
  const feature = document.createElement('sensor-bar-card-plus-feature');
  const inputs = {
    config: options.config ?? { type: 'custom:sensor-bar-card-plus-feature' },
    hass: { states: options.states ?? {} },
    context: options.context ?? {},
    color: options.color,
    position: options.position ?? 'bottom',
  };
  for (const input of options.order ?? ['config', 'hass', 'context', 'color', 'position']) {
    if (input === 'config') feature.setConfig(inputs.config);
    else feature[input] = inputs[input];
    if (options.separateUpdates) await feature.updateComplete;
  }
  host.append(feature);
  document.getElementById('mount').append(host);
  await feature.updateComplete;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return feature;
};
