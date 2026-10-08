const { test, expect } = require('@playwright/test');
async function mount(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({ entities: [{ entity: 'sensor.a' }], bar: { fill_style: 'gradient', needle: { show: true, color: 'var(--accent-color)' } },
      baseline: { enabled: false, at: { entity: 'sensor.b', fixed: 0 }, above: { color: 'red' }, below: { color: '#123456' } },
    });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  return page.locator('sensor-bar-card-plus-editor');
}
for (const section of ['needle', 'baseline']) test(`standalone ${section} root/entity controls and focus retain their appearance`, async ({ page }) => {
  const editor = await mount(page);
  if (section === 'baseline') await editor.locator('#card-group-baseline').click();
  const root = section === 'baseline' ? editor.locator('.card-subgroup[data-group="baseline"]')
    : editor.locator('.inline-row').filter({ has: page.locator('#bar-needle-mode') });
  await expect(root).toHaveScreenshot(`${section}-root.png`);
  const control = editor.locator(section === 'baseline' ? '#baseline-value' : '[data-field="bar-needle-color-text-fallback"]');
  await control.fill(section === 'baseline' ? '12.5' : 'red');
  await expect(control).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator(`#entity-0-group-${section}`).click();
  await expect(editor.locator(`.override-group:not(.card-subgroup)[data-group="${section}"]`)).toHaveScreenshot(`${section}-entity.png`);
});
