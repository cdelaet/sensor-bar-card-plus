const { test, expect } = require('@playwright/test');

async function mount(page, source, host, segments) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, segments }) => {
    const feature = host === 'Feature';
    const editor = await customElements.get(feature ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus').getConfigElement();
    const config = feature
      ? { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.power', bar: { fill_style: 'gradient', ...(segments === undefined ? {} : { segments }) } }
      : host === 'Entity'
        ? { bar: { fill_style: 'gradient', ...(segments === undefined ? {} : { segments }) },
          entities: [{ entity: 'sensor.power', bar: { fill_style: 'gradient' } }] }
        : { bar: { fill_style: 'gradient', ...(segments === undefined ? {} : { segments }) }, entities: ['sensor.power'] };
    editor.setConfig(config);
    if (feature) editor.context = { entity_id: 'sensor.power' };
    window.__paletteConfig = structuredClone(config);
    window.__paletteEvents = [];
    editor.addEventListener('config-changed', event => window.__paletteEvents.push(structuredClone(event.detail.config)));
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host, segments });
  const editor = page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  if (host === 'Entity') {
    await editor.locator('[data-action="toggle-entity-overrides"]').first().click();
    const bar = editor.locator('#entity-0-group-bar');
    if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
  }
  const prefix = host === 'Entity' ? 'entity-0' : 'card';
  const root = editor.locator(`#${prefix}-paint-editor`);
  await root.locator(':scope > summary').click();
  await root.locator(`#${prefix}-group-segments`).click();
  await root.locator(`#${prefix}-group-gradient-stops`).click();
  return { editor, root, prefix };
}

for (const source of ['src', 'dist']) {
  for (const host of ['Card', 'Feature']) {
    test(`${host} displays default Segments with every Fill style without authoring them (${source})`, async ({ page }) => {
      const { editor, root, prefix } = await mount(page, source, host);
      const rows = root.locator('input[data-kind$="segment-from"]');
      const preview = root.locator('.segment-preview-interval[data-preview-kind="segment"]');
      await expect(rows).toHaveCount(3);
      await expect(preview).toHaveCount(3);
      await expect(root.locator(`button[data-group$="segments"] .override-group-summary`)).toHaveText('Default bands');
      await expect(root.locator('input[data-kind$="gradient-pos"]')).toHaveCount(3);
      await expect.poll(() => preview.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor))).toEqual([
        'rgb(76, 175, 80)', 'rgb(255, 152, 0)', 'rgb(244, 67, 54)',
      ]);

      for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
        await editor.evaluate((element, { host, fill_style }) => {
          const next = structuredClone(element._config);
          if (host === 'Feature') next.bar.fill_style = fill_style;
          else if (host === 'Entity') next.entities[0].bar.fill_style = fill_style;
          else next.bar.fill_style = fill_style;
          element.setConfig(next);
        }, { host, fill_style });
        await expect(rows).toHaveCount(3);
        await expect(preview).toHaveCount(3);
      }
      expect(await page.evaluate(() => window.__paletteEvents)).toEqual([]);
      const saved = await editor.evaluate(element => structuredClone(element._config));
      if (host === 'Feature') expect(saved.bar.segments).toBeUndefined();
      else if (host === 'Entity') expect(saved.bar.segments).toBeUndefined();
      else expect(saved.bar.segments).toBeUndefined();
      if (!(await root.evaluate(element => element.hasAttribute('open')))) await root.locator(':scope > summary').click();
      const segmentsGroup = root.locator(`#${prefix}-group-segments`);
      if (await segmentsGroup.getAttribute('aria-expanded') === 'false') await segmentsGroup.click();
      const colorInput = root.locator(`#${host === 'Entity' ? `${prefix}-` : ''}segment-color-0-text-fallback`);
      await colorInput.fill('#123456');
      await colorInput.press('Tab');
      await expect.poll(() => page.evaluate(() => window.__paletteEvents.length)).toBe(1);
      const edited = await page.evaluate(() => window.__paletteEvents.at(-1));
      const editedSegments = host === 'Entity' ? edited.entities[0].bar.segments : edited.bar.segments;
      expect(editedSegments[0].color).toBe('#123456');
      expect(editedSegments).toHaveLength(3);
    });

    test(`${host} keeps explicitly empty Segments empty (${source})`, async ({ page }) => {
      const { root } = await mount(page, source, host, []);
      await expect(root.locator('input[data-kind$="segment-from"]')).toHaveCount(0);
      await expect(root.locator('.segment-preview-interval[data-preview-kind="segment"]')).toHaveCount(0);
      expect(await page.evaluate(() => window.__paletteEvents)).toEqual([]);
    });
  }

  test(`Entity Segment rows display the inherited palette with Gradient selected (${source})`, async ({ page }) => {
    const inherited = [
      { from: '0%', to: '40%', color: '#123456' },
      { from: '40%', to: '100%', color: '#abcdef' },
    ];
    const { root } = await mount(page, source, 'Entity', inherited);
    await expect(root.locator('input[data-kind$="segment-from"]')).toHaveCount(2);
    await expect(root.locator('.segment-preview-interval[data-preview-kind="segment"]')).toHaveCount(2);
    await expect(root.locator('button[data-group$="segments"] .override-group-summary')).toHaveText('Inherited · 2 segments');
    await expect(root.locator('#entity-0-segment-color-0-text-fallback')).toHaveValue('#123456');
    expect(await page.evaluate(() => window.__paletteEvents)).toEqual([]);
  });
}
