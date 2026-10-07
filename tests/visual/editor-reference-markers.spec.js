const { test, expect } = require('@playwright/test');
for (const width of [360, 240]) test(`standalone Reference markers ${width}px retain root/entity appearance, focus and identity`, async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async width => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({ entities: [{ entity: 'sensor.a', markers: [{ at: '35%', shape: 'pin', lane: 'above', label: { show: true, entity: 'sensor.label', decimal: 2 } }] }],
      markers: [{ at: { entity: 'sensor.reference', fixed: 25 }, show_marker: false, shape: 'arrow', direction: 'outward', color: 'var(--accent-color)', label: { show: true, text: 'Reference energy', entity: 'sensor.label', precision: 1 } }, { at: { fixed: 75 }, lane: 'above' }] });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = `${width}px`; document.querySelector('#mount').append(editor);
  }, width);
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator('#card-group-generic-markers').click();
  const root = editor.locator('.card-subgroup[data-group="generic-markers"]');
  await root.locator('[data-action="toggle-generic-marker"]').first().click();
  await expect(root).toHaveScreenshot(`reference-markers-root-${width}.png`);
  const row = root.locator('.generic-marker-item').first(), id = await row.getAttribute('data-marker-ui-id');
  const text = row.locator('[data-kind="generic-marker-label-text"]');
  await text.evaluate(node => { window.__standaloneReferenceText = node; });
  await text.fill('Edited reference'); await expect(text).toBeFocused(); expect(await text.evaluate(node => node === window.__standaloneReferenceText)).toBe(true);
  await row.locator('[data-action="move-generic-marker-down"]').click();
  await expect(root.locator('.generic-marker-item').nth(1)).toHaveAttribute('data-marker-ui-id', id);
  await expect(root.locator('.generic-marker-item').nth(1)).toHaveAttribute('data-expanded', 'true');
  await editor.locator('[data-action="toggle-entity-overrides"]').click(); await editor.locator('#entity-0-group-markers').click();
  const entity = editor.locator('.override-group:not(.card-subgroup)[data-group="markers"]');
  await entity.locator('[data-action="toggle-generic-marker"]').click();
  await expect(entity).toHaveScreenshot(`reference-markers-entity-${width}.png`);
  const percent = entity.locator('[data-kind="generic-marker-percent"]'); await percent.fill('40'); await expect(percent).toBeFocused();
});
