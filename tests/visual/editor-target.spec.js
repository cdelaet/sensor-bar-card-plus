const { test, expect } = require('@playwright/test');
test('standalone Target root/entity controls, labels and focus retain their appearance', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({ entities: ['sensor.a'], target: { at: { entity: 'sensor.t', fixed: 70 }, shape: 'triangle', direction: 'outward', color: 'red', label: { show: true, text: 'Goal', show_unit: false, precision: 1 }, when_exceeded: { fill_color: 'var(--accent-color)' } } });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator('#card-group-marker-target').click();
  await expect(editor.locator('.card-subgroup[data-group="marker-target"]')).toHaveScreenshot('target-root.png');
  await editor.locator('#target-label-text').fill('Target energy'); await expect(editor.locator('#target-label-text')).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click(); await editor.locator('#entity-0-group-target').click();
  await expect(editor.locator('.override-group:not(.card-subgroup)[data-group="target"]')).toHaveScreenshot('target-entity.png');
  await editor.locator('#entity-0-target-label-text').fill('Local goal'); await expect(editor.locator('#entity-0-target-label-text')).toBeFocused();
});
