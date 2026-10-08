const { test, expect } = require('@playwright/test');

async function mountEditor(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({
      entities: [{ entity: 'sensor.power' }],
      bar: { fill_style: 'gradient', color: 'var(--accent-color)', solid_fill: true },
    });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
  });
  return page.locator('sensor-bar-card-plus-editor');
}

test('Bar Appearance retains inherited controls, focus, echoes and host-owned palette presentation', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('[data-field="bar-color-text-fallback"]').fill('red');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset.field)).toBe('bar-color-text-fallback');
  for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
    await editor.locator('#bar-fill-style').selectOption(style);
    await expect(editor.locator('#bar-fill-style')).toHaveValue(style);
    // Existing host policy refreshes conditional child UI on a structural render.
    await editor.locator('#card-group-segments').click();
    await expect(editor.locator('.card-subgroup[data-group="gradient-stops"]')).toHaveClass(style === 'gradient' ? 'override-group card-subgroup' : 'override-group card-subgroup is-inactive');
    await expect(editor.locator('.card-subgroup[data-group="segments"]')).toHaveClass(['bands', 'soft_bands', 'band_gradient'].includes(style) ? 'override-group card-subgroup' : 'override-group card-subgroup is-inactive');
  }
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-bar').click();
  await expect(editor.locator('#entity-0-bar-fill-style')).toHaveValue('band_gradient');
  await expect(editor.locator('#entity-0-bar-solid-fill')).toBeChecked();
  await editor.locator('[data-kind="entity-bar-color-text-fallback"]').fill('blue');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset.kind)).toBe('entity-bar-color-text-fallback');
  await editor.locator('#entity-0-bar-inherit').check();
  await expect(editor.locator('[data-kind="entity-bar-color-text-fallback"]')).toHaveValue('red');
  await expect(editor.locator('#entity-0-group-bar')).toHaveAttribute('aria-expanded', 'true');
});

test('Bar Appearance root and override retain their pre-extraction appearance', async ({ page }) => {
  const editor = await mountEditor(page);
  await expect(editor.locator('.section').filter({ has: page.getByRole('heading', { name: 'Bar Appearance', exact: true }) })).toHaveScreenshot('editor-bar-appearance-root.png');
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-bar').click();
  await expect(editor.locator('.override-group[data-group="bar"]')).toHaveScreenshot('editor-bar-appearance-override.png');
});
