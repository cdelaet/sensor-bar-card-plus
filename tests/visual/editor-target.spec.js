const { test, expect } = require('@playwright/test');
test('standalone Target root/entity controls, labels and focus retain their appearance', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.setConfig({ entities: ['sensor.a'], target: { at: { entity: { id: 'sensor.t', attribute: 'limit' }, fixed: 70 }, shape: 'triangle', direction: 'outward', color: 'red', label: { show: true, text: 'Goal', show_unit: false, precision: 1 }, when_exceeded: { fill_color: 'var(--accent-color)' } } });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator('#card-group-marker-target').click();
  await expect(editor.locator('.card-subgroup[data-group="marker-target"]')).toHaveScreenshot('target-root.png');
  const rootValue = editor.locator('#target-value');
  await expect(rootValue).toHaveAttribute('type', 'text'); await expect(rootValue).toHaveValue('70');
  await rootValue.fill('25%');
  expect((await editor.evaluate(el => el._draftConfig)).target.at).toEqual({ entity: { id: 'sensor.t', attribute: 'limit' }, percent: 25 });
  await rootValue.fill('70');
  expect((await editor.evaluate(el => el._draftConfig)).target.at).toEqual({ entity: { id: 'sensor.t', attribute: 'limit' }, fixed: 70 });
  await editor.locator('#target-label-text').fill('Target energy'); await expect(editor.locator('#target-label-text')).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click(); await editor.locator('#entity-0-group-target').click();
  await expect(editor.locator('.override-group:not(.card-subgroup)[data-group="target"]')).toHaveScreenshot('target-entity.png');
  const inherit = editor.locator('#entity-0-target-inherit'), show = editor.locator('#entity-0-target-show');
  await expect(inherit).toBeChecked(); await expect(show).toBeChecked(); await expect(show).not.toBeDisabled();
  const cardTarget = (await editor.evaluate(el => el._draftConfig)).target;
  await show.uncheck();
  expect((await editor.evaluate(el => el._draftConfig)).entities[0].target.enabled).toBe(false);
  await expect(inherit).not.toBeChecked(); await expect(show).not.toBeDisabled();
  await inherit.check();
  expect((await editor.evaluate(el => el._draftConfig)).entities[0].target).toBeUndefined();
  expect((await editor.evaluate(el => el._draftConfig)).target).toEqual(cardTarget);
  await expect(inherit).toBeChecked(); await expect(show).toBeChecked();
  const entityValue = editor.locator('#entity-0-target-value');
  await expect(entityValue).toHaveAttribute('type', 'text'); await expect(entityValue).toHaveValue('70');
  await entityValue.fill('35%');
  expect((await editor.evaluate(el => el._draftConfig)).entities[0].target.at).toEqual({ entity: { id: 'sensor.t', attribute: 'limit' }, percent: 35 });
  await expect(entityValue).toBeFocused();
  await editor.locator('#entity-0-target-label-text').fill('Local goal'); await expect(editor.locator('#entity-0-target-label-text')).toBeFocused();
});

test('directional Target sources and markers edit independently and emit canonical config', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.setConfig({ entities: ['sensor.a'], target: {
      at: 60,
      when_above: { at: { fixed: 75 }, marker: { color: '#aa2211', shape: 'triangle', label: { show: true, text: 'Upper' } } },
      when_below: { at: { percent: 20 }, marker: { color: '#1166cc', shape: 'diamond', label: { show: true, text: 'Lower' } } },
    } });
    window.__targetEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__targetEvents.push(structuredClone(event.detail.config));
      editor.setConfig(event.detail.config);
    });
    document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator('#card-group-marker-target').click();
  await expect(editor.locator('#target-above-value')).toHaveValue('75');
  await expect(editor.locator('#target-below-value')).toHaveValue('20%');
  await expect(editor.locator('#target-above-marker-color')).toHaveValue('#aa2211');
  await expect(editor.locator('#target-below-marker-color')).toHaveValue('#1166cc');

  await editor.locator('#target-above-value').fill('80');
  await editor.locator('#target-above-value').press('Tab');
  await editor.locator('#target-below-marker-color').fill('#2244dd');
  await editor.locator('#target-below-marker-color').press('Tab');
  await editor.locator('#target-above-marker-label-text').fill('High limit');
  const config = await editor.evaluate(element => element._draftConfig);
  expect(config.target.at).toBe(60);
  expect(config.target.when_above).toMatchObject({
    at: { fixed: 80 }, marker: { color: '#aa2211', shape: 'triangle', label: { show: true, text: 'High limit' } },
  });
  expect(config.target.when_below).toMatchObject({
    at: { percent: 20 }, marker: { color: '#2244dd', shape: 'diamond', label: { show: true, text: 'Lower' } },
  });
  expect(await page.evaluate(() => window.__targetEvents.at(-1).target)).toMatchObject({
    when_above: config.target.when_above,
    when_below: config.target.when_below,
  });
});
