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

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} swatches composite translucent and opaque paint once (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    await editor.evaluate(el => el.style.setProperty('--card-background-color', '#fff'));
    const swatch = editor.locator('#card-paint-editor .paint-editor-swatch');
    for (const [paint, expected] of [
      [{ fill_style: 'solid', color: 'rgba(255, 0, 0, 0.5)' }, 'rgba(255, 0, 0, 0.5)'],
      [{ fill_style: 'solid', color: 'rgba(0, 255, 0, 0.25)' }, 'rgba(0, 255, 0, 0.25)'],
      [{ fill_style: 'bands', solid_fill: true, color: 'rgba(255, 0, 0, 0.5)',
        segments: [{ from: '0%', to: '100%', color: 'rgba(0, 0, 255, 0.25)' }] }, 'rgba(0, 0, 255, 0.25)'],
      [{ fill_style: 'solid', color: '#123456' }, '#123456'],
    ]) {
      await editor.evaluate(async (el, paint) => {
        el.setConfig({ ...(el._draftConfig ?? el._config), bar: paint });
        await el.updateComplete;
      }, paint);
      await swatch.scrollIntoViewIfNeeded();
      // Compare actual browser pixels against a single CSS color layer over white.
      // The reference is test-only and does not use the paint compiler.
      await page.evaluate(color => {
        document.querySelector('#swatch-reference')?.remove();
        const backdrop = document.createElement('div');
        backdrop.id = 'swatch-reference';
        backdrop.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;background:white;z-index:9999';
        const layer = document.createElement('div');
        layer.style.cssText = 'width:100%;height:100%';
        layer.style.backgroundColor = color;
        backdrop.append(layer); document.body.append(backdrop);
      }, expected);
      const bounds = await swatch.boundingBox();
      const actualPixels = await page.screenshot({ clip: { x: Math.floor(bounds.x + bounds.width / 2), y: Math.floor(bounds.y + bounds.height / 2), width: 2, height: 2 } });
      const expectedPixels = await page.screenshot({ clip: { x: 1, y: 1, width: 2, height: 2 } });
      expect(actualPixels.equals(expectedPixels)).toBe(true);
    }
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} promotes null bar on an explicit paint edit (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const original = await saved(editor);
    for (const [property, value] of [['fill_style', 'gradient'], ['color', '#abcdef'], ['solid_fill', true]]) {
      await editor.evaluate(async (el, config) => { el.setConfig({ ...config, bar: null }); await el.updateComplete; }, original);
      expect((await saved(editor)).bar).toBeNull();
      const events = await page.evaluate(() => window.__paintEvents.length);
      const paint = editor.locator('#card-paint-editor');
      if (!await paint.evaluate(node => node.open)) await paint.locator('summary').click();
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events);
      if (property === 'fill_style') await editor.locator('#bar-fill-style').selectOption(value);
      else if (property === 'solid_fill') await editor.locator('#bar-solid-fill').check();
      else await editor.locator('#bar-color').evaluate((node, value) => {
        node.value = value; node.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events + 1);
      expect(await saved(editor)).toEqual({ ...original, bar: { paint: { [property]: value } } });
    }
  });
}

for (const source of ['src', 'dist']) for (const width of [240, 360]) {
  test(`Card entity Paint navigation and editing at ${width}px (${source})`, async ({ page }) => {
    const editor = await mount(page, 'Card', source, width);
    const original = await saved(editor);
    const overrides = editor.locator('button[data-action="toggle-entity-overrides"]');
    await overrides.focus(); await page.keyboard.press('Space');
    const group = editor.getByRole('group', { name: 'Bar Appearance', exact: true });
    const paint = group.locator('#entity-0-paint-editor');
    await expect(editor.locator('#entity-0-group-bar')).toHaveCount(0);
    await expect(group.locator('#entity-0-bar-direction')).toBeVisible();
    await expect(paint.locator('summary')).toBeVisible();
    await expect(paint).not.toHaveAttribute('open');
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
    const geometry = await group.evaluate(el => {
      const panel = el.closest('.override-panel'), bounds = el.getBoundingClientRect();
      const style = getComputedStyle(panel), panelBounds = panel.getBoundingClientRect();
      return { width: bounds.width, available: panel.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        paintWidth: el.querySelector('.paint-editor').getBoundingClientRect().width,
        inset: bounds.left - panelBounds.left - parseFloat(style.borderLeftWidth) - parseFloat(style.paddingLeft) };
    });
    expect(geometry.width).toBeCloseTo(geometry.available, 0);
    expect(geometry.paintWidth).toBeCloseTo(geometry.width, 0);
    expect(geometry.inset).toBeCloseTo(0, 0);
    if (source === 'src') await expect(group).toHaveScreenshot(`entity-paint-${width}-collapsed.png`);
    const direction = group.locator('#entity-0-bar-direction');
    await direction.selectOption('reverse');
    expect((await saved(editor)).entities[0]).toEqual({ entity: 'sensor.power', bar: { direction: 'reverse' } });
    await direction.focus(); await page.keyboard.press('Tab');
    await expect(paint.locator('summary')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(paint).toHaveAttribute('open');
    for (const name of ['segments', 'gradient-stops']) {
      const toggle = paint.locator(`#entity-0-group-${name}`);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.focus(); await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(1);
    expect(await group.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('input, select, button')].every(control => {
        const rect = control.getBoundingClientRect();
        return !rect.width || (rect.left >= bounds.left && rect.right <= bounds.right);
      });
    })).toBe(true);
    expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const id of ['paint-editor', 'bar-direction', 'bar-fill-style', 'bar-color', 'bar-solid-fill']) {
      await expect(editor.locator(`#entity-0-${id}`)).toHaveCount(1);
    }
    if (source === 'src') {
      await editor.evaluate(el => el.shadowRoot.activeElement?.blur()); await page.mouse.move(0, 0);
      await expect(group).toHaveScreenshot(`entity-paint-${width}-expanded.png`);
    }
    await paint.locator('#entity-0-bar-fill-style').selectOption('gradient');
    await paint.locator('#entity-0-bar-color').evaluate(node => {
      node.value = '#abcdef'; node.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await paint.locator('#entity-0-bar-solid-fill').check();
    expect((await saved(editor)).entities[0]).toEqual({ entity: 'sensor.power', bar: { direction: 'reverse', fill_style: 'gradient', color: '#abcdef', solid_fill: true } });
    expect((await saved(editor)).bar).toEqual(original.bar);
    const edited = await saved(editor);
    await editor.evaluate(el => el.setConfig(structuredClone(el._draftConfig)));
    expect(await saved(editor)).toEqual(edited);
    await expect(paint).toHaveAttribute('open');
    await group.locator('#entity-0-bar-inherit').check();
    expect((await saved(editor)).entities[0].bar).toBeUndefined();
    await expect(direction).toHaveValue('inherit');
    await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
    await paint.locator('summary').focus(); await page.keyboard.press('Space');
    await expect(paint).not.toHaveAttribute('open');
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} grouped/mixed paint saves and reopens (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source, 240);
    await editor.evaluate(async el => {
      const config = structuredClone(el._draftConfig ?? el._config);
      config.bar.paint = { color: null, opacity: 35, future: { keep: true } };
      config.bar.segments[0].metadata = { keep: true };
      config.bar.gradient_stops[0].metadata = { keep: true };
      window.__groupedOriginal = structuredClone(config);
      el.setConfig(config); await el.updateComplete;
    });
    const paint = editor.locator('#card-paint-editor');
    await paint.locator('summary').click();
    await expect(editor.locator('#bar-color')).toHaveValue('#123456');
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await editor.locator('#bar-fill-style').selectOption(style);
      expect((await saved(editor)).bar.paint.fill_style).toBe(style);
      expect((await saved(editor)).bar.fill_style).toBeUndefined();
    }
    await editor.locator('#bar-solid-fill').check(); await editor.locator('#bar-solid-fill').uncheck();
    expect((await saved(editor)).bar.paint.solid_fill).toBe(false);
    await editor.locator('#bar-color').evaluate(node => { node.value = '#4a9eff'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    expect((await saved(editor)).bar.paint.color).toBe('#4a9eff');
    expect((await saved(editor)).bar.color).toBeUndefined();
    await editor.locator('#card-group-segments').click();
    const from = editor.locator('input[data-kind="segment-from"]').first();
    await from.fill('10%'); await from.press('Enter');
    expect((await saved(editor)).bar.paint.segments[0]).toMatchObject({ from: '10%', metadata: { keep: true } });
    await editor.locator('button[data-action="remove-segment"]').first().click();
    expect((await saved(editor)).bar.paint.segments).toEqual([]);
    await editor.locator('#bar-fill-style').selectOption('gradient');
    await editor.locator('#card-group-gradient-stops').click();
    const pos = editor.locator('input[data-kind="gradient-pos"]').first();
    await pos.fill('25'); await pos.press('Enter');
    expect((await saved(editor)).bar.paint.gradient_stops[0]).toMatchObject({ pos: 25, metadata: { keep: true } });
    const config = await saved(editor);
    expect(config.bar.paint.opacity).toBe(35); expect(config.bar.paint.future).toEqual({ keep: true });
    expect(config.bar.future).toBe(true);
    expect(config.bar.gradient_stops).toBeUndefined(); expect(config.bar.segments).toBeUndefined();
    await editor.evaluate(async el => {
      const next = document.createElement(el.tagName.toLowerCase());
      next.setConfig(structuredClone(el._draftConfig ?? el._config)); next.hass = { states: {} };
      if (el._context) next.context = el._context;
      el.replaceWith(next); await next.updateComplete;
    });
    await editor.locator('#card-paint-editor > summary').click();
    await expect(editor.locator('#bar-fill-style')).toHaveValue('gradient');
    await expect(editor.locator('#bar-solid-fill')).not.toBeChecked();
    expect(await saved(editor)).toEqual(config);
  });
}
