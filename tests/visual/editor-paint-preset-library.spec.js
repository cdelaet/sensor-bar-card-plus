const { test, expect } = require('@playwright/test');

async function mount(page, source, width = 320) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async width => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    const saved = {
      title: 'Power',
      preset_library: {
        paint: { warm: { fill_style: 'gradient', color: '#cc4400', opacity: 72,
          gradient_stops: [{ pos: 0, color: '#111111' }, { pos: 100, color: '#eeeeee' }] } },
        layout: { keep: true },
      },
      bar: { paint: { preset: 'warm' } },
      future: { keep: true },
    };
    window.__presetSaved = structuredClone(saved);
    window.__presetEvents = [];
    editor.addEventListener('config-changed', event => window.__presetEvents.push(structuredClone(event.detail.config)));
    editor.setConfig(saved);
    editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`;
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, width);
  return page.locator('sensor-bar-card-plus-editor');
}

for (const source of ['src', 'dist']) {
  test(`master preset library edits stay local and retain shared paint controls (${source})`, async ({ page }) => {
    const editor = await mount(page, source);
    await editor.locator('#paint-presets > summary').click();
    await expect(editor.locator('.paint-preset-choice')).toHaveCount(1);
    await expect(editor.locator('.paint-preset-swatch')).toBeVisible();
    await editor.locator('#preset-paint-editor > summary').click();
    await expect(editor.locator('#preset-paint-opacity')).toHaveValue('72');
    await editor.locator('#preset-paint-opacity').fill('61');
    await editor.locator('#preset-paint-opacity').dispatchEvent('change');
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.warm.opacity)).toBe(61);
    expect(await editor.evaluate(element => element._config.preset_library.paint.warm.opacity)).toBe(72);

    await editor.locator('#paint-preset-name').fill('  cool  ');
    await editor.locator('[data-action="add-paint-preset"]').click();
    await expect(editor.locator('.paint-preset-choice')).toHaveCount(2);
    await expect(editor.locator('[aria-selected="true"]')).toHaveAttribute('data-preset-name', 'cool');
    expect(await editor.evaluate(element => element._config.preset_library.layout.keep)).toBe(true);
    expect(await editor.evaluate(element => element._config.future.keep)).toBe(true);
    expect(await editor.evaluate(element => element._config.bar.paint.preset)).toBe('warm');
    expect(await page.evaluate(() => window.__presetSaved.preset_library.paint.cool)).toBeUndefined();

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('blue');
    });
    await editor.locator('[data-action="rename-paint-preset"]').click();
    await expect(editor.locator('[aria-selected="true"]')).toHaveAttribute('data-preset-name', 'blue');
    expect(await editor.evaluate(element => element._draftConfig.bar.paint.preset)).toBe('warm');

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    await editor.locator('[data-action="delete-paint-preset"]').click();
    await expect(editor.locator('.paint-preset-choice')).toHaveCount(1);
    await expect(editor.locator('.paint-preset-choice')).toHaveAttribute('data-preset-name', 'warm');
  });

  test(`recurring hass updates preserve preset name input identity, focus and text (${source})`, async ({ page }) => {
    const editor = await mount(page, source);
    await editor.locator('#paint-presets > summary').click();
    const name = editor.locator('#paint-preset-name');
    await name.fill('Copper');
    await name.evaluate(input => {
      input.focus();
      input.setSelectionRange(2, 4);
      window.__presetNameInput = input;
    });
    await editor.evaluate(element => {
      window.__presetHassTimer = window.setInterval(() => {
        element.hass = { ...element.hass, states: { 'sensor.power': { state: String(Date.now()), attributes: {} } } };
      }, 80);
    });
    await page.waitForTimeout(500);
    await editor.evaluate(() => window.clearInterval(window.__presetHassTimer));
    await editor.evaluate(element => {
      const master = { type: 'custom:sensor-bar-card-plus', preset_library: structuredClone(element._draftConfig.preset_library) };
      const duplicate = { type: 'custom:sensor-bar-card-plus', preset_library: {} };
      const dashboard = { views: [{ cards: [master, duplicate] }] };
      element.hass = {
        states: element._hass?.states ?? {},
        connection: {
          connected: true,
          sendMessagePromise: async () => structuredClone(dashboard),
          subscribeEvents: async callback => { window.__presetRegistryListener = callback; return () => {}; },
          addEventListener() {}, removeEventListener() {},
        },
      };
    });
    await expect(editor.locator('.preset-master-warning')).toContainText('2 master Cards');
    await editor.evaluate(() => window.__presetRegistryListener?.({ event_type: 'lovelace_updated' }));
    await page.waitForTimeout(100);

    const state = await name.evaluate(input => ({
      same: input === window.__presetNameInput,
      focused: input.getRootNode().activeElement === input,
      value: input.value,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
    }));
    expect(state).toEqual({ same: true, focused: true, value: 'Copper', selectionStart: 2, selectionEnd: 4 });
  });
}
