const { test, expect } = require('@playwright/test');

async function mountEditor(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({
      entities: [{ entity: 'sensor.power', scale: { min: { entity: 'sensor.minimum' } }, formatting: { decimal: 0 } }],
      scale: { min: 10, max: 100 }, formatting: { unit: 'W', decimal: 2 },
    });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
  });
  return page.locator('sensor-bar-card-plus-editor');
}

test('Scale and Formatting preserve focused fields and inherited override presentation', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('#scale-max').fill('120');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('scale-max');
  await editor.locator('#formatting-unit').fill('kW');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('formatting-unit');
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-scale').click();
  await expect(editor.locator('#entity-0-min')).toHaveValue('');
  await expect(editor.locator('#entity-0-max')).toHaveValue('120');
  await editor.locator('#entity-0-group-formatting').click();
  await expect(editor.locator('#entity-0-formatting-unit')).toHaveValue('kW');
  await editor.locator('#entity-0-formatting-unit').fill('Wh');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('entity-0-formatting-unit');
  await editor.locator('#entity-0-formatting-inherit').check();
  await expect(editor.locator('#entity-0-formatting-unit')).toHaveValue('kW');
  await expect(editor.locator('#entity-0-group-formatting')).toHaveAttribute('aria-expanded', 'true');
});

test('Formatting root and override controls retain their pre-extraction appearance', async ({ page }) => {
  const editor = await mountEditor(page);
  await expect(editor.locator('.section').filter({ has: page.getByRole('heading', { name: 'Formatting', exact: true }) })).toHaveScreenshot('editor-formatting-root.png');
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-formatting').click();
  await expect(editor.locator('.override-group[data-group="formatting"]')).toHaveScreenshot('editor-formatting-override.png');
});
