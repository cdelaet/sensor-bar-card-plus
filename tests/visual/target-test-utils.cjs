const { expect } = require('@playwright/test');

async function openTarget(editor, scope = 'Card', parts = ['shared', 'appearance', 'labels']) {
  const entity = scope === 'Entity';
  const open = async control => {
    if (await control.getAttribute('aria-expanded') === 'false') await control.click();
    await expect(control).toHaveAttribute('aria-expanded', 'true');
  };
  if (entity) await open(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));
  await open(editor.locator(entity ? '#entity-0-group-target' : '#card-group-marker-target'));
  for (const part of parts) await open(editor.locator(`#card-group-${entity ? 'entity-0-' : ''}target-${part}`));
}
async function mount(page, source, host, config = {}, value = 80, width = 240, presets = null) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, config, value, width, presets }) => {
    const tag = host === 'Feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement(), runtime = document.createElement(tag);
    const initial = { type: `custom:${tag}`, bar: { animated: false }, future: { keep: true },
      target: { at: { fixed: 60, entity: 'sensor.goal', future: true }, color: 'red', label: { show: true, text: 'Goal' },
        when_above: { paint: { fill_style: 'gradient', opacity: 40,
          gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] } } },
      ...(host === 'Feature' ? {} : { entities: [{ entity: 'sensor.power' }] }), ...config };
    window.__targetEvents = [];
    window.__targetConfig = structuredClone(initial);
    window.__targetHass = { states: { 'sensor.power': { state: String(value), attributes: {} }, 'sensor.goal': { state: '60', attributes: { limit: 60 } } },
      ...(presets ? { connection: {
        connected: true,
        sendMessagePromise: async () => ({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: presets } }] }] }),
        subscribeEvents: async () => () => {}, addEventListener() {}, removeEventListener() {},
      } } : {}) };
    window.__replaceTarget = config => {
      window.__targetConfig = structuredClone(config);
      editor.setConfig(config); runtime.setConfig(config); runtime.hass = window.__targetHass;
    };
    editor.addEventListener('config-changed', event => {
      window.__targetEvents.push(structuredClone(event.detail.config));
      window.__replaceTarget(event.detail.config);
    });
    const container = document.querySelector('#mount'); container.style.width = `${width}px`;
    container.append(editor, runtime);
    window.__replaceTarget(initial);
    if (host === 'Feature') editor.context = runtime.context = { entity_id: 'sensor.power' };
    editor.hass = window.__targetHass;
    await editor.updateComplete; await runtime.updateComplete;
  }, { host, config, value, width, presets });
  return { editor: page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor'),
    runtime: page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus') };
}
module.exports = { openTarget, mount };
