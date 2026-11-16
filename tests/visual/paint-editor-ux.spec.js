const { test, expect } = require('@playwright/test');

const properties = ['gradient_stops', 'segments', 'fill_style', 'color', 'solid_fill', 'opacity'];
const segments = Array.from({ length: 12 }, (_, i) => ({ from: `${i * 8}%`, to: `${(i + 1) * 8}%`, color: '#abcdef' }));
async function mount(page, source, destination, inherited = false, width = 360) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ destination, inherited, segments, width }) => {
    const feature = destination === 'Feature';
    const editor = await customElements.get(feature ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus').getConfigElement();
    const paint = inherited ? { preset: 'night' } : { preset: 'night', fill_style: 'gradient', color: '#123456',
      solid_fill: true, opacity: 45, segments: segments.filter((_, i) => i % 2 === 0).slice(0, 3),
      gradient_stops: [{ pos: 0, color: 'var(--accent-color)' }, { pos: 100, color: '#112233' }] };
    const config = feature ? { type: 'custom:sensor-bar-card-plus-feature', bar: { paint } }
      : destination === 'Entity' ? { bar: { paint: { preset: 'night' } }, entities: [{ entity: 'sensor.power', bar: { paint: inherited ? {} : paint } }] }
        : { bar: { paint }, entities: ['sensor.power'] };
    editor.setConfig(config);
    if (feature) editor.context = { entity_id: 'sensor.power' };
    editor.hass = { states: {}, connection: { connected: true,
      sendMessagePromise: async () => ({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: { night: {
        fill_style: 'bands', color: 'var(--accent-color)', segments,
        gradient_stops: [{ pos: 0, color: '#aabbcc' }, { pos: 100, color: '#ddeeff' }],
      } } } }] }] }),
      subscribeEvents: async () => () => {}, addEventListener() {}, removeEventListener() {},
    } };
    const parent = document.querySelector('#mount');
    parent.style.cssText = `width:${width}px;height:500px;overflow:auto;position:relative`;
    const before = document.createElement('div'); before.style.height = '850px';
    const after = document.createElement('div'); after.style.height = '1600px';
    window.__uxEvents = [];
    parent.addEventListener('config-changed', event => { window.__uxEvents.push(event.detail.config); editor.setConfig(event.detail.config); });
    parent.append(before, editor, after);
    await editor.updateComplete;
  }, { destination, inherited, segments, width });
  const editor = page.locator(destination === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  const prefix = destination === 'Entity' ? 'entity-0' : 'card';
  const root = editor.locator(`#${prefix}-paint-editor`);
  await expect(root.locator('[data-paint-preset] option[value="night"]')).toHaveCount(1);
  if (destination === 'Entity') {
    await editor.locator('[data-action="toggle-entity-overrides"]').first().click();
    const bar = editor.locator('#entity-0-group-bar');
    if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
  }
  await root.locator(':scope > summary').click();
  for (const group of ['segments', 'gradient-stops']) await root.locator(`#${prefix}-group-${group}`).click();
  return { editor, root };
}

for (const source of ['src', 'dist']) for (const destination of ['Card', 'Entity', 'Feature']) {
  test(`${destination} Clear preserves paint DOM, scroll and disclosures for every property (${source})`, async ({ page }) => {
    for (const width of [240, 360]) for (const property of properties) {
      const { root } = await mount(page, source, destination, false, width);
      const clear = root.locator(`[data-action="clear-paint-property"][data-property="${property}"]`);
      await clear.evaluate(button => button.scrollIntoView({ block: 'center' }));
      const keyboard = property === 'gradient_stops' && width === 360;
      if (keyboard) await clear.evaluate(button => button.focus({ preventScroll: true }));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      const before = await root.evaluate(root => {
        window.__uxRoot = root;
        window.__uxOpacity = root.querySelector('[data-paint-property="opacity"]');
        window.__uxColor = root.querySelector('input[type="color"][data-paint-property="color"]');
        window.__uxGroups = [...root.querySelectorAll('.override-group-toggle')];
        return document.querySelector('#mount').scrollTop;
      });
      if (keyboard) await clear.press('Enter');
      else await clear.click();
      await expect(clear).toBeHidden();
      // Let the scheduled host render and browser scroll anchoring run.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await root.evaluate(root => root === window.__uxRoot), property).toBe(true);
      expect(await root.evaluate(root => root.querySelector('[data-paint-property="opacity"]') === window.__uxOpacity), property).toBe(true);
      expect(await root.evaluate(root => root.querySelector('input[type="color"][data-paint-property="color"]') === window.__uxColor), property).toBe(true);
      expect(await root.evaluate(root => [...root.querySelectorAll('.override-group-toggle')].every((node, i) => node === window.__uxGroups[i])), property).toBe(true);
      await expect(root).toHaveAttribute('open', '');
      for (const group of ['segments', 'gradient-stops']) await expect(root.locator(`.override-group[data-group="${group}"] .override-group-toggle`)).toHaveAttribute('aria-expanded', 'true');
      expect(await page.evaluate(() => document.querySelector('#mount').scrollTop), property).toBe(before);
      expect(await page.evaluate(() => window.__uxEvents.length)).toBe(1);
      if (property === 'segments') {
        await expect(root.locator('.override-group[data-group="segments"] .override-group-summary')).toHaveText('Preset · 12 segments');
        await expect(root.locator('input[data-kind$="segment-from"]')).toHaveCount(12);
      }
      if (property === 'gradient_stops') await expect(root.locator('input[data-kind$="gradient-pos"]')).toHaveCount(2);
      if (property === 'color') {
        const css = root.locator('input[data-paint-property="color"][type="text"]');
        await expect(css).toHaveValue('var(--accent-color)');
        await css.fill('#667788');
        await css.press('Tab');
        expect(await page.evaluate(() => window.__uxEvents.at(-1))).toMatchObject(destination === 'Entity'
          ? { entities: [{ bar: { paint: { color: '#667788' } } }] } : { bar: { paint: { color: '#667788' } } });
      }
    }
  });

  test(`${destination} inherited segments describe the effective palette and provenance (${source})`, async ({ page }) => {
    const { root } = await mount(page, source, destination, true);
    await expect(root.locator('.paint-editor-description')).toContainText('12 segments');
    await expect(root.locator('.override-group[data-group="segments"] .override-group-summary')).toContainText('12 segments');
    await expect(root.locator('.override-group[data-group="segments"] .override-group-summary')).toContainText(destination === 'Entity' ? 'Inherited' : 'Preset');
    await expect(root.getByText('Default bands', { exact: true })).toHaveCount(0);
  });

  test(`${destination} palette rows expose full hex values at narrow and wide widths (${source})`, async ({ page }) => {
    for (const width of [240, 360, 600]) {
      const { root } = await mount(page, source, destination, false, width);
      const fallback = root.locator('input[data-kind$="gradient-color-text-fallback"]').first();
      await fallback.fill('#abcdef');
      const hexInputs = root.locator('.segment-row input[data-css-color], .gradient-stop-row input[data-kind$="color-text-fallback"]');
      expect(await hexInputs.count()).toBeGreaterThan(0);
      for (const input of await hexInputs.all()) {
        const metrics = await input.evaluate(input => {
          const style = getComputedStyle(input);
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); ctx.font = style.font;
          return { available: input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
            required: ctx.measureText('#abcdef').width, right: input.getBoundingClientRect().right,
            edge: input.closest('.paint-editor').getBoundingClientRect().right };
        });
        expect(metrics.available, `${width}px hex input`).toBeGreaterThanOrEqual(metrics.required);
        expect(metrics.right, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.edge);
      }
      expect(await root.evaluate(root => root.scrollWidth <= root.clientWidth), `${width}px palette containment`).toBe(true);
      for (const gap of await root.locator('.segment-undefined-row').all()) {
        expect(await gap.evaluate(row => {
          const action = row.querySelector('button').getBoundingClientRect();
          return [...row.querySelectorAll('strong, small')].every(label => {
            const rect = label.getBoundingClientRect();
            return rect.right <= action.left || rect.left >= action.right || rect.bottom <= action.top || rect.top >= action.bottom;
          });
        }), `${width}px Add Segment must not cover its range label`).toBe(true);
      }
      const draft = root.locator('.segment-draft .segment-row');
      if (await draft.count()) expect(await draft.evaluate(row => row.scrollWidth <= row.clientWidth)).toBe(true);
    }
  });
}
