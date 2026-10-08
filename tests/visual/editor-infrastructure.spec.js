const { test, expect } = require('@playwright/test');

async function mountEditor(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({
      entity: 'sensor.power', title: 'Power',
      scale: { min: { fixed: 0, entity: 'sensor.minimum' }, max: 100 },
      bar: { fill_style: 'gradient', gradient_stops: [{ pos: 0, color: '#00ff00' }, { pos: 100, color: '#ff0000' }] },
      target: { at: 65, color: 'var(--primary-color)', label: { show: true, text: 'Target & reserve', precision: 1 } },
    });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
  });
  return page.locator('sensor-bar-card-plus-editor');
}

test('editor drafts, focus and disclosures survive echo and a structural render', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('#card-group-gradient-stops').click();
  await editor.locator('#gradient-draft-pos').fill('45');
  const title = editor.locator('#title');
  await title.fill('Edited Power');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('title');
  await expect(editor.locator('#gradient-draft-pos')).toHaveValue('45');
  await editor.locator('#card-group-marker-target').click();
  await expect(editor.locator('#gradient-draft-pos')).toHaveValue('45');
  await expect(editor.locator('#card-group-gradient-stops')).toHaveAttribute('aria-expanded', 'true');
  await editor.locator('#gradient-draft-pos').press('Enter');
  await expect(editor.locator('input[data-kind="gradient-pos"]')).toHaveCount(3);
  await expect(editor.locator('input[data-kind="gradient-pos"]').nth(1)).toHaveValue('45');
});

test('standalone shared controls retain their pre-extraction appearance', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('#card-group-marker-target').click();
  await expect(editor.locator('.section').filter({ has: page.getByRole('heading', { name: 'Scale', exact: true }) })).toHaveScreenshot('editor-scale-controls.png');
  await expect(editor.locator('.card-subgroup[data-group="marker-target"]')).toHaveScreenshot('editor-target-controls.png');
});
