const { test, expect } = require('@playwright/test');
for (const key of ['peak', 'floor']) test(`standalone ${key} root/entity controls and reset keyboard focus retain appearance`, async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({ entities: ['sensor.a'], peak: { enabled: true, color: 'red', direction: 'outward', reset: '15m', label: { show: true, text: 'Peak energy', precision: 1 } }, floor: { enabled: true, color: 'var(--accent-color)', direction: 'inward', reset: 'weekly', label: { show: true, text: 'Floor energy', decimal: 2 } } });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator(`#card-group-marker-${key}`).click();
  await expect(editor.locator(`.card-subgroup[data-group="marker-${key}"]`)).toHaveScreenshot(`${key}-root.png`);
  await editor.locator(`#${key}-reset`).focus(); await editor.locator(`#${key}-reset`).press('ArrowDown');
  await expect(editor.locator(`#${key}-reset`)).toBeFocused();
  await editor.locator(`#${key}-label-text`).fill('Changed energy'); await expect(editor.locator(`#${key}-label-text`)).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click(); await editor.locator(`#entity-0-group-${key}`).click();
  await expect(editor.locator(`.override-group:not(.card-subgroup)[data-group="${key}"]`)).toHaveScreenshot(`${key}-entity.png`);
  await editor.locator(`#entity-0-${key}-reset`).focus();
  await editor.locator(`#entity-0-${key}-reset`).selectOption('never'); await expect(editor.locator(`#entity-0-${key}-reset`)).toBeFocused();
});
