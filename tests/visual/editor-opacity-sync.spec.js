const { test, expect } = require('./visual-test.cjs');

async function mount(page, host, source, config) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, config }) => {
    const runtime = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(runtime);
    const editor = await customElements.get(runtime).getConfigElement();
    window.__opacityEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__opacityEvents.push(structuredClone(event.detail.config));
      editor.setConfig(event.detail.config);
    });
    editor.setConfig(config);
    editor.context = { entity_id: 'sensor.power' };
    editor.hass = { states: {} };
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host, config });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}

const saved = editor => editor.evaluate(node => structuredClone(node._draftConfig ?? node._config));
const eventCount = page => page.evaluate(() => window.__opacityEvents.length);

for (const source of ['src', 'dist']) {
  for (const host of ['Card', 'Feature']) test(`${host} focused opacity buffer survives refresh and commits (${source})`, async ({ page }) => {
    const config = host === 'Card'
      ? { entities: [{ entity: 'sensor.power' }], bar: { paint: { opacity: 37 } } }
      : { type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { opacity: 37 } } };
    const editor = await mount(page, host, source, config);
    await editor.locator('#card-paint-editor > summary').click();
    const opacity = editor.locator('#bar-opacity');
    await expect(opacity).toHaveValue('37');

    await opacity.focus();
    await opacity.fill('37.0');
    const eventsAfterEdit = await eventCount(page);
    await editor.evaluate(async node => {
      node.hass = { states: { 'sensor.other': { state: '10', attributes: {} } } };
      await node.updateComplete;
    });
    await expect(opacity).toBeFocused();
    await expect(opacity).toHaveValue('37.0');
    expect(await eventCount(page)).toBe(eventsAfterEdit);

    await opacity.press('End');
    await opacity.press('5');
    await expect(opacity).toHaveValue('37.05');
    await opacity.press('Tab');
    expect((await saved(editor)).bar.paint.opacity).toBe(37.05);
  });

  test(`Card opacity sync follows parent changes, local overrides and clearing (${source})`, async ({ page }) => {
    const editor = await mount(page, 'Card', source, {
      entities: [{ entity: 'sensor.power' }], bar: { paint: { opacity: 35 } },
    });
    await editor.locator('#card-paint-editor > summary').click();
    await editor.locator('button[data-action="toggle-entity-overrides"]').click();
    await editor.locator('#entity-0-group-bar').click();
    await editor.locator('#entity-0-paint-editor > summary').click();
    const cardOpacity = editor.locator('#bar-opacity');
    const entityOpacity = editor.locator('#entity-0-bar-opacity');
    await expect(cardOpacity).toHaveValue('35');
    await expect(entityOpacity).toHaveValue('35');

    await entityOpacity.fill('');
    await entityOpacity.press('-');
    expect(await entityOpacity.evaluate(node => node.validity.badInput)).toBe(true);
    await cardOpacity.fill('60');
    await expect(cardOpacity).toHaveValue('60');
    expect(await entityOpacity.evaluate(node => node.validity.badInput)).toBe(true);
    expect((await saved(editor)).bar.paint.opacity).toBe(60);
    expect(await eventCount(page)).toBe(1);

    await entityOpacity.fill('25');
    await expect(entityOpacity).toHaveValue('25');
    expect((await saved(editor)).entities[0].bar.paint.opacity).toBe(25);
    await cardOpacity.fill('75');
    await expect(cardOpacity).toHaveValue('75');
    await expect(entityOpacity).toHaveValue('25');
    await editor.locator('#entity-0-bar-inherit').check();
    await expect(entityOpacity).toHaveValue('75');
    expect((await saved(editor)).entities[0].bar?.paint).toBeUndefined();
    expect(await eventCount(page)).toBe(4);
  });

  test(`Feature opacity sync follows setConfig and preserves an active draft (${source})`, async ({ page }) => {
    const initial = { type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { opacity: 35 } } };
    const editor = await mount(page, 'Feature', source, initial);
    await editor.locator('#card-paint-editor > summary').click();
    const opacity = editor.locator('#bar-opacity');
    await opacity.evaluate(node => { window.__opacityInput = node; });
    await expect(opacity).toHaveValue('35');

    await editor.evaluate(async node => {
      node.setConfig({ ...node._config, bar: { paint: { opacity: 75 } } });
      await node.updateComplete;
    });
    await expect(opacity).toHaveValue('75');
    expect(await opacity.evaluate(node => node === window.__opacityInput)).toBe(true);
    expect((await saved(editor)).bar.paint.opacity).toBe(75);
    expect(await eventCount(page)).toBe(0);

    await opacity.fill('');
    await opacity.press('-');
    expect(await opacity.evaluate(node => node.validity.badInput)).toBe(true);
    await editor.evaluate(async node => {
      node.hass = { states: { 'sensor.other': { state: '10', attributes: {} } } };
      await node.updateComplete;
    });
    expect(await opacity.evaluate(node => node.validity.badInput)).toBe(true);
    expect((await saved(editor)).bar.paint.opacity).toBe(75);
    expect(await eventCount(page)).toBe(0);
  });
}
