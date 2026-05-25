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
