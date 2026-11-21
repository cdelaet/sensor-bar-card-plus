const { test, expect } = require('@playwright/test');
const { snapshotName } = require('./snapshot-name.cjs');

async function mountEditor(page) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
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

test('Bar Appearance controls retain inherited behavior inside the Bar section', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('#card-paint-editor > summary').click();
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
  await editor.locator('#entity-0-paint-editor > summary').click();
  await expect(editor.locator('#entity-0-bar-fill-style')).toHaveValue('band_gradient');
  await expect(editor.locator('#entity-0-bar-solid-fill')).toBeChecked();
  await editor.locator('[data-kind="entity-bar-color-text-fallback"]').fill('blue');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset.kind)).toBe('entity-bar-color-text-fallback');
  await editor.locator('#entity-0-bar-inherit').check();
  await expect(editor.locator('[data-kind="entity-bar-color-text-fallback"]')).toHaveValue('red');
  await expect(editor.locator('#entity-0-paint-editor')).toHaveAttribute('open');
});

test('Bar root and Bar Appearance override preserve their controls', async ({ page }) => {
  const editor = await mountEditor(page);
  await page.mouse.move(0, 0);
  await expect(editor.locator('.section').filter({ has: page.getByRole('heading', { name: 'Bar', exact: true }) })).toHaveScreenshot(snapshotName('editor-bar-appearance-root.png'));
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-bar').click();
  await editor.evaluate(element => element.shadowRoot.activeElement?.blur());
  await page.mouse.move(0, 0);
  await expect(editor.getByRole('group', { name: 'Bar Appearance', exact: true })).toHaveScreenshot(snapshotName('editor-bar-appearance-override.png'));
});

test('Entity Bar disclosure orders inheritance, direction, animation, Paint, Baseline and Needle', async ({ page }) => {
  const editor = await mountEditor(page);
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  const bar = editor.locator('#entity-0-group-bar');
  await expect(bar).toHaveAttribute('aria-expanded', 'false');
  await expect(bar.locator('..').locator(':scope > .override-group-body')).toBeHidden();
  await bar.click();
  await expect(bar).toHaveAttribute('aria-expanded', 'true');
  await expect(bar.locator('..').locator(':scope > .override-group-body')).toBeVisible();
  expect(await editor.evaluate(element => {
    const selectors = ['#entity-0-bar-inherit', '#entity-0-bar-direction', '#entity-0-bar-animated',
      '#entity-0-paint-editor', '#entity-0-group-baseline', '#entity-0-group-needle'];
    const nodes = selectors.map(selector => element.shadowRoot.querySelector(selector));
    return nodes.every(Boolean) && nodes.every((node, index) => index === 0
      || !!(nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
  const actions = editor.locator('#entity-0-group-actions');
  await actions.click();
  await expect(actions.locator('.override-group-summary')).toHaveText('Inherited');
});
