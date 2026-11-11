const { test, expect } = require('@playwright/test');

async function mount(page, host, source, width = 360) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, width }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const config = { extra: { keep: true }, bar: { fill_style: 'bands', color: '#123456', solid_fill: false,
      segments: [{ from: '0%', to: '100%', color: '#abcdef' }],
      gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }], future: true } };
    if (host === 'Card') config.entities = ['sensor.power'];
    else config.type = 'custom:sensor-bar-card-plus-feature';
    window.__paintOriginal = structuredClone(config); window.__paintEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__paintEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config);
    });
    editor.setConfig(config);
    editor.hass = { states: {} };
    if (host !== 'Card') editor.context = { entity_id: 'sensor.power' };
    document.querySelector('#mount').style.width = `${width}px`;
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host, width });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}
const saved = editor => editor.evaluate(el => structuredClone(el._draftConfig ?? el._config));

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} Paint disclosure, styles and round-trips (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const paint = editor.locator('#card-paint-editor');
    await expect(paint).not.toHaveAttribute('open');
    await expect(paint.locator('.paint-editor-description')).toHaveText('Bands · 1 segment');
    await expect(paint.locator('.paint-editor-swatch')).toHaveCSS('background-image', /linear-gradient/);
    await expect(editor.locator('#bar-fill-style')).toHaveCount(1);
    await expect(editor.locator('#bar-fill-style')).toBeHidden();
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
    await paint.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(editor.locator('#bar-fill-style')).toBeVisible();
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await editor.locator('#bar-fill-style').selectOption(style);
      await expect(editor.locator('#bar-fill-style')).toHaveValue(style);
      await expect(paint).toHaveAttribute('open');
      await expect(paint.locator('.paint-editor-description')).toContainText({ solid: 'Solid', gradient: 'Gradient', bands: 'Bands', soft_bands: 'Soft bands', band_gradient: 'Band gradient' }[style]);
      const config = await saved(editor), original = await page.evaluate(() => window.__paintOriginal);
      expect(config.bar).toEqual({ ...original.bar, fill_style: style });
      expect(config.extra).toEqual(original.extra);
    }
    await editor.locator('#bar-solid-fill').check();
    expect((await saved(editor)).bar.solid_fill).toBe(true);
    await expect(paint.locator('.paint-editor-description')).toContainText('Sampled color');
    // Structural palette updates preserve the parent disclosure and manual data.
    await editor.locator('#card-group-gradient-stops').click();
    await editor.locator('#gradient-draft-pos').fill('50');
    await editor.locator('button[data-action="add-gradient-stop"]').click();
    await expect(paint).toHaveAttribute('open');
    expect((await saved(editor)).bar.gradient_stops).toHaveLength(3);
    await editor.locator('#card-group-segments').click();
    await editor.locator('#segment-draft-from').fill('100%');
    await editor.locator('#segment-draft-to').fill('120%');
    await editor.locator('button[data-action="add-segment"]').click();
    expect((await saved(editor)).bar.segments).toHaveLength(2);
    const roundTrip = await saved(editor);
    await editor.evaluate(el => { el.setConfig(structuredClone(el._draftConfig ?? el._config)); });
    expect(await saved(editor)).toEqual(roundTrip);
    await paint.locator('summary').click();
    await expect(editor.locator('#bar-fill-style')).toBeHidden();
    expect(await saved(editor)).toEqual(roundTrip);
  });
}

for (const host of ['Card', 'Feature']) for (const width of [240, 360]) {
  test(`${host} Paint fits ${width}px collapsed and expanded`, async ({ page }) => {
    const editor = await mount(page, host, 'src', width);
    const paint = editor.locator('#card-paint-editor');
    await expect(paint).toHaveScreenshot(`paint-${host.toLowerCase()}-${width}-collapsed.png`);
    await paint.locator('summary').click();
    await editor.locator('#card-group-segments').click();
    await editor.locator('#card-group-gradient-stops').click();
    expect(await paint.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('input, select, button')].every(control => {
        const rect = control.getBoundingClientRect();
        return !rect.width || (rect.left >= bounds.left && rect.right <= bounds.right);
      });
    })).toBe(true);
    expect(await paint.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await editor.evaluate(el => el.shadowRoot.activeElement?.blur());
    await page.mouse.move(0, 0);
    await expect(paint).toHaveScreenshot(`paint-${host.toLowerCase()}-${width}-expanded.png`);
  });
}

test('Card row Paint inherits without promotion, promotes on edit and clears only its owned appearance', async ({ page }) => {
  const editor = await mount(page, 'Card', 'src');
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-bar').click();
  const paint = editor.locator('#entity-0-paint-editor');
  await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
  await paint.locator('summary').click();
  expect((await saved(editor)).entities).toEqual(['sensor.power']);
  await expect(editor.locator('#entity-0-bar-color')).toHaveValue('#123456');
  await editor.locator('#entity-0-bar-fill-style').selectOption('solid');
  await expect(paint.locator('.paint-editor-description')).toHaveText('Solid · #123456');
  expect((await saved(editor)).entities).toEqual([{ entity: 'sensor.power', bar: { fill_style: 'solid' } }]);
  await editor.locator('#entity-0-bar-inherit').check();
  await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
  expect((await saved(editor)).entities[0].bar).toBeUndefined();
  expect((await saved(editor)).bar).toEqual((await page.evaluate(() => window.__paintOriginal)).bar);
  await expect(paint).toHaveAttribute('open');
});

for (const host of ['Card', 'Feature']) test(`${host} swatch follows dynamic Scale bounds without rebuilding controls`, async ({ page }) => {
  const editor = await mount(page, host, 'src');
  await editor.evaluate(async el => {
    const config = structuredClone(el._draftConfig ?? el._config);
    config.scale = { max: { entity: 'sensor.maximum' } };
    config.bar.segments = [{ from: 0, to: 50, color: '#123456' }, { from: 50, to: 100, color: '#abcdef' }];
    el.setConfig(config);
    el.hass = { states: { 'sensor.maximum': { state: '100', attributes: {} } } };
    await el.updateComplete;
  });
  const swatch = editor.locator('#card-paint-editor .paint-editor-swatch');
  const initial = await swatch.evaluate(node => { window.__swatchNode = node; return node.style.backgroundImage; });
  await editor.evaluate(async el => {
    el.hass = { states: { 'sensor.maximum': { state: '200', attributes: {} } } };
    await el.updateComplete;
  });
  expect(await swatch.evaluate(node => node.style.backgroundImage)).not.toBe(initial);
  expect(await swatch.evaluate(node => node === window.__swatchNode)).toBe(true);
  expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
});
