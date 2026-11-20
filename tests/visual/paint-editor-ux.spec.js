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

  test(`${destination} palette rows wrap and keep color controls usable (${source})`, async ({ page }) => {
    for (const width of [240, 360, 600]) {
      const { editor, root } = await mount(page, source, destination, false, width);
      for (const selector of ['.segment-editor-row .segment-row', '.authored-gradient-stop-row',
        '.segment-draft .segment-row', '.gradient-stop-draft .gradient-stop-row']) {
        const row = root.locator(selector).first();
        const controls = await row.evaluate(row => {
          const bounds = row.getBoundingClientRect();
          return [...row.querySelectorAll('input, button')].map(control => {
            const rect = control.getBoundingClientRect();
            return { width: rect.width, line: Math.round((rect.top + rect.height / 2 - bounds.top) / 4),
              contained: rect.left >= bounds.left && rect.right <= bounds.right + 0.5 };
          });
        });
        const [picker, text, action] = controls.slice(-3);
        expect(controls.every(control => control.contained && control.width > 0), `${width}px ${selector}`).toBe(true);
        expect(picker.width).toBeGreaterThanOrEqual(30);
        expect(picker.width).toBeLessThanOrEqual(90);
        expect(text.width).toBeGreaterThanOrEqual(60);
        expect(action.width).toBeLessThanOrEqual(48);
        const lines = new Set(controls.map(control => control.line)).size;
        if (width === 240 || width === 360 && destination === 'Entity') expect(lines).toBeGreaterThan(1);
        else expect(lines).toBe(1);
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

      const count = () => page.evaluate(() => window.__uxEvents.length);
      const initialCount = await count();
      await editor.evaluate(node => node.style.setProperty('--palette-test-color', 'rgb(18, 52, 86)'));
      for (const kind of ['segment', 'gradient']) {
        const draftPicker = root.locator(`input[type="color"][data-kind$="${kind}-draft-color"]`);
        const draftText = root.locator(`[data-kind$="${kind}-draft-color-text-fallback"]`);
        const longColor = 'color-mix(in srgb, var(--palette-test-color) 50%, rgb(210 120 30) 50%)';
        await draftText.fill(longColor);
        await expect(draftText).toBeFocused();
        await expect(draftText).toHaveValue(longColor);
        await expect(draftPicker).toHaveValue('#72563a');
        expect(await draftText.evaluate(input => {
          input.scrollLeft = input.scrollWidth;
          return input.scrollLeft;
        })).toBeGreaterThan(0);
        await draftText.fill('rgb(');
        await expect(draftText).toHaveValue('rgb(');
        await expect(draftText).toHaveAttribute('aria-invalid', 'true');
        await draftPicker.evaluate(input => {
          input.value = '#abcdef';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await expect(draftText).toBeFocused();
        await expect(draftText).toHaveValue('#abcdef');
        await expect(draftText).toHaveAttribute('aria-invalid', 'false');
        await draftText.fill('var(--palette-test-color)');
        await expect(draftPicker).toHaveValue('#123456');
        await expect(draftText).toHaveAttribute('aria-invalid', 'false');
      }
      expect(await count()).toBe(initialCount);

      const first = root.locator('.authored-gradient-stop-row').first();
      const picker = first.locator('input[type="color"]');
      const text = first.locator('[data-css-color="true"]');
      await text.fill('rebeccapurple');
      await expect(picker).toHaveValue('#663399');
      await picker.evaluate(input => input.focus());
      expect(await count()).toBe(initialCount + 1);
      await picker.fill('#123456');
      await expect(text).toHaveValue('#123456');
      expect(await count()).toBe(initialCount + 2);
    }
  });
}

for (const source of ['src', 'dist']) for (const destination of ['Card', 'Entity', 'Feature']) {
  test(`${destination} consolidates CSS color controls across reopen and picker edits (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    const tag = destination === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor';
    await page.evaluate(async destination => {
      const feature = destination === 'Feature';
      const registration = customElements.get(feature ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus');
      const editor = await registration.getConfigElement();
      const paint = { fill_style: 'gradient', color: 'var(--initial-color)',
        segments: [{ from: 0, color: 'var(--segment-color)' }, { from: 50, color: '#abc' }],
        gradient_stops: [{ pos: 0, color: 'red' }, { pos: 50, color: 'var(--missing-color)' },
          { pos: 100, color: 'rgb(1, 2, 3)' }] };
      const config = feature ? { type: 'custom:sensor-bar-card-plus-feature', bar: { paint } }
        : destination === 'Entity'
          ? { bar: { paint: { fill_style: 'gradient', color: '#112233' } },
            entities: [{ entity: 'sensor.power', bar: { paint } }] }
          : { bar: { paint }, entities: ['sensor.power'] };
      window.__universalColorEvents = [];
      document.querySelector('#mount').addEventListener('config-changed', event => {
        window.__universalColorEvents.push(structuredClone(event.detail.config));
        event.target.setConfig(event.detail.config);
      });
      editor.setConfig(config);
      if (feature) editor.context = { entity_id: 'sensor.power' };
      editor.hass = { states: {} };
      editor.style.setProperty('--initial-color', 'rgb(18, 52, 86)');
      editor.style.setProperty('--segment-color', 'rgb(18, 52, 86)');
      document.querySelector('#mount').append(editor);
      await editor.updateComplete;
    }, destination);
    let editor = page.locator(tag);
    const initialPrefix = destination === 'Entity' ? 'entity-0-' : '';
    await expect(editor.locator(`#${initialPrefix}gradient-color-0`)).toHaveValue('#ff0000');
    await expect(editor.locator(`#${initialPrefix}gradient-color-0-text-fallback`)).toHaveValue('red');
    await expect(editor.locator(`#${initialPrefix}gradient-color-1`)).toHaveValue('#4caf50');
    await expect(editor.locator(`#${initialPrefix}gradient-color-1-text-fallback`)).toHaveValue('var(--missing-color)');
    await expect(editor.locator(`#${initialPrefix}gradient-color-2`)).toHaveValue('#010203');
    await expect(editor.locator(`#${initialPrefix}gradient-color-2-text-fallback`)).toHaveValue('rgb(1, 2, 3)');
    await expect(editor.locator(`#${initialPrefix}segment-color-0`)).toHaveValue('#123456');
    await expect(editor.locator(`#${destination === 'Entity' ? 'entity-0-bar-color' : 'bar-color'}`)).toHaveValue('#123456');
    expect(await editor.evaluate(() => window.__universalColorEvents.length)).toBe(0);
    if (destination === 'Entity') {
      await editor.locator('[data-action="toggle-entity-overrides"]').first().click();
      const bar = editor.locator('#entity-0-group-bar');
      if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
    }
    const prefix = destination === 'Entity' ? 'entity-0' : 'card';
    const colorId = destination === 'Entity' ? 'entity-0-bar-color' : 'bar-color';
    let paint = editor.locator(`#${prefix}-paint-editor`);
    await paint.locator(':scope > summary').click();
    for (const group of ['segments', 'gradient-stops']) {
      const toggle = paint.locator(`.override-group[data-group="${group}"] .override-group-toggle`);
      if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    }
    await expect(paint.locator(`#${colorId}`)).toHaveValue('#123456');
    await expect(paint.locator(`#${colorId}-text-fallback`)).toHaveValue('var(--initial-color)');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}segment-color-1-text-fallback`)).toHaveValue('#abc');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-1-text-fallback`)).toHaveValue('var(--missing-color)');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-1`)).toHaveValue('#4caf50');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-2-text-fallback`)).toHaveValue('rgb(1, 2, 3)');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-2`)).toHaveValue('#010203');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}segment-color-0-text-fallback`)).toHaveValue('var(--segment-color)');
    const gradientColor = paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-0-text-fallback`);
    await gradientColor.fill('rgb(4, 5, 6)');
    const segmentColor = paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}segment-color-0-text-fallback`);
    await segmentColor.fill('rgb(7, 8, 9)');
    expect(await editor.evaluate((element, destination) => {
      const config = element._config ?? element._draftConfig;
      const paint = destination === 'Entity' ? config.entities[0].bar.paint : config.bar.paint;
      return [paint.gradient_stops[0].color, paint.segments[0].color];
    }, destination)).toEqual(['rgb(4, 5, 6)', 'rgb(7, 8, 9)']);
    const barText = paint.locator(`#${colorId}-text-fallback`);
    const beforeInvalid = await editor.evaluate(element => structuredClone(element._config ?? element._draftConfig));
    await barText.fill('rgb(');
    await expect(barText).toBeFocused();
    await expect(barText).toHaveAttribute('aria-invalid', 'true');
    expect(await editor.evaluate(() => window.__universalColorEvents.length)).toBe(2);
    expect(await editor.evaluate(element => element._config ?? element._draftConfig)).toMatchObject(destination === 'Entity'
      ? { entities: [{ bar: { paint: { color: 'var(--initial-color)' } } }] }
      : { bar: { paint: { color: 'var(--initial-color)' } } });
    expect(beforeInvalid).toBeTruthy();

    await barText.fill('var(--saved-color)');
    const saved = await editor.evaluate(element => structuredClone(element._config ?? element._draftConfig));
    const selector = destination === 'Entity' ? ['entities', 0, 'bar', 'paint'] : ['bar', 'paint'];
    expect(await editor.evaluate((element, path) => path.reduce((value, key) => value?.[key], element._config ?? element._draftConfig).color, selector)).toBe('var(--saved-color)');
    expect(await editor.evaluate(() => window.__universalColorEvents.length)).toBe(3);

    await editor.evaluate(async (oldEditor, { destination, saved }) => {
      const feature = destination === 'Feature';
      const registration = customElements.get(feature ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus');
      const reopened = await registration.getConfigElement();
      reopened.setConfig(saved);
      if (feature) reopened.context = { entity_id: 'sensor.power' };
      reopened.hass = { states: {} };
      oldEditor.replaceWith(reopened);
      await reopened.updateComplete;
    }, { destination, saved });
    editor = page.locator(tag);
    if (destination === 'Entity') {
      await editor.locator('[data-action="toggle-entity-overrides"]').first().click();
      const bar = editor.locator('#entity-0-group-bar');
      if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
    }
    paint = editor.locator(`#${prefix}-paint-editor`);
    await paint.locator(':scope > summary').click();
    for (const group of ['segments', 'gradient-stops']) {
      const toggle = paint.locator(`.override-group[data-group="${group}"] .override-group-toggle`);
      if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    }
    const reopenedText = paint.locator(`#${colorId}-text-fallback`);
    await expect(reopenedText).toHaveValue('var(--saved-color)');
    await reopenedText.fill('rgb(');
    await reopenedText.press('Tab');
    await expect(reopenedText).toHaveAttribute('aria-invalid', 'true');
    expect(await editor.evaluate(() => window.__universalColorEvents.length)).toBe(3);
    const picker = paint.locator(`input[type="color"][data-paint-property="color"]`);
    await picker.evaluate(input => {
      input.value = '#778899';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(reopenedText).toHaveCount(0);
    expect(await editor.evaluate((element, id) => ({
      draft: element._cssColorDrafts.has(`${id}-text-fallback`),
      count: window.__universalColorEvents.length,
    }), colorId)).toEqual({ draft: false, count: 4 });
    expect(await editor.evaluate((element, path) => path.reduce((value, key) => value?.[key], element._config ?? element._draftConfig).color, selector)).toBe('#778899');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}segment-color-1-text-fallback`)).toHaveValue('#abc');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-1-text-fallback`)).toHaveValue('var(--missing-color)');

    await editor.evaluate((element, destination) => {
      const next = structuredClone(element._config ?? element._draftConfig);
      const configPaint = destination === 'Entity' ? next.entities[0].bar.paint : next.bar.paint;
      configPaint.gradient_stops = [{ pos: 0, color: 'var(--replacement-color)' }];
      element.style.setProperty('--replacement-color', 'rgb(18, 52, 86)');
      element.setConfig(next);
    }, destination);
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-0-text-fallback`)).toHaveValue('var(--replacement-color)');
    await expect(paint.locator(`#${destination === 'Entity' ? 'entity-0-' : ''}gradient-color-0`)).toHaveValue('#123456');
    expect(await editor.evaluate(() => window.__universalColorEvents.length)).toBe(4);
  });
}
