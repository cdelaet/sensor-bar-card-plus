const { test, expect } = require('@playwright/test');
async function mount(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.setConfig({ entities: [{ entity: 'sensor.a' }], bar: { fill_style: 'gradient', needle: { show: true, color: 'var(--accent-color)' } },
      baseline: { enabled: false, at: { entity: { id: 'sensor.b', attribute: 'reading' }, fixed: 0 }, above: { color: 'red' }, below: { color: '#123456' } },
    });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  return page.locator('sensor-bar-card-plus-editor');
}
for (const section of ['needle', 'baseline']) test(`standalone ${section} root/entity controls and focus retain their appearance`, async ({ page }) => {
  const editor = await mount(page);
  if (section === 'baseline') await editor.locator('#card-group-baseline').click();
  if (section === 'needle') await editor.locator('#card-group-needle').click();
  const root = editor.locator(`.card-subgroup[data-group="${section}"]`);
  if (section === 'needle') await editor.evaluate(element => element.shadowRoot.activeElement?.blur());
  await page.mouse.move(0, 0);
  await expect(root).toHaveScreenshot(`${section}-root.png`);
  const control = editor.locator(section === 'baseline' ? '#baseline-value' : '[data-field="bar-needle-color-text-fallback"]');
  if (section === 'baseline') {
    await expect(control).toHaveAttribute('type', 'text'); await expect(control).toHaveValue('0');
    await control.fill('25%');
    expect((await editor.evaluate(el => el._draftConfig)).baseline.at).toEqual({ entity: { id: 'sensor.b', attribute: 'reading' }, percent: 25 });
    await control.fill('0');
    expect((await editor.evaluate(el => el._draftConfig)).baseline.at).toEqual({ entity: { id: 'sensor.b', attribute: 'reading' }, fixed: 0 });
  } else {
    await control.fill('red');
  }
  await expect(control).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator(`#entity-0-group-${section}`).click();
  await editor.evaluate(element => element.shadowRoot.activeElement?.blur());
  await page.mouse.move(0, 0);
  await expect(editor.locator(`.override-group:not(.card-subgroup)[data-group="${section}"]`)).toHaveScreenshot(`${section}-entity.png`);
  if (section === 'baseline') {
    const entityValue = editor.locator('#entity-0-baseline-value');
    await expect(entityValue).toHaveAttribute('type', 'text'); await expect(entityValue).toHaveValue('0');
    await entityValue.fill('35%');
    expect((await editor.evaluate(el => el._draftConfig)).entities[0].baseline.at).toEqual({ entity: { id: 'sensor.b', attribute: 'reading' }, percent: 35 });
    await expect(entityValue).toBeFocused();
  }
});
