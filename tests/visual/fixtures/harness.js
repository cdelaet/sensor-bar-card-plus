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
  card.hass = options.hass ?? { states: options.states };
  mount.appendChild(card);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return card;
};

window.__sbcpCreateState = createState;

// A shared HA connection with deterministic Recorder and live state responses.
window.__sbcpHistoryFixture = (states, values = [80]) => {
  let subscriber = null, subscriptions = 0;
  const listeners = new Map(), requests = [];
  const connection = {
    connected: true,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    subscribeMessage: async callback => { subscriptions += 1; subscriber = callback; return () => { subscriber = null; }; },
  };
  const now = Date.now();
  const rows = entity => {
    const samples = Array.isArray(values) ? values : values[entity] ?? [];
    return samples.map((value, index) => ({ s: String(value), lu: (now - (samples.length - index) * 60000) / 1000 }));
  };
  const hass = { connection, connected: true, states, config: { time_zone: 'UTC' }, locale: { language: navigator.language },
    callWS: async request => { requests.push(request); return Object.fromEntries(request.entity_ids.map(id => [id, rows(id)])); } };
  return { hass, connection, requests, get subscriptions() { return subscriptions; },
    update: (entity, value) => {
      const state = { state: String(value), attributes: {}, last_updated: new Date().toISOString() };
      hass.states = { ...hass.states, [entity]: state };
      subscriber?.({ data: { entity_id: entity, new_state: state } });
    },
    emit: name => listeners.get(name)?.(),
  };
};

// Models the public HA feature inputs and inherited feature/theme variables.
// Callers choose input order; the harness does not depend on Tile's private DOM.
window.__sbcpRenderFeature = async function renderFeature(options = {}) {
  const host = document.createElement('div');
  host.className = 'feature-host';
  host.style.cssText = `width:${options.width ?? 640}px;--feature-height:${options.height ?? 42}px;--feature-border-radius:12px;--feature-button-spacing:12px;--feature-color:#03a9f4;--primary-text-color:#f5f7fa;--secondary-text-color:#9ba4b0;--secondary-background-color:#202830;--primary-color:#03a9f4;`;
  const feature = document.createElement('sensor-bar-card-plus-feature');
  const inputs = {
    config: options.config ?? { type: 'custom:sensor-bar-card-plus-feature' },
    hass: options.hass ?? { states: options.states ?? {} },
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
