const { test, expect } = require('@playwright/test');

async function mount(page, source, width = 320, configOverride = null) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ width, configOverride }) => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    const saved = configOverride ?? {
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
  }, { width, configOverride });
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

  test(`preset palette rows and five style previews stay consistent (${source})`, async ({ page }) => {
    const editor = await mount(page, source, 320, {
      preset_library: {
        paint: { bands: {
          fill_style: 'bands',
          segments: [{ from: '0%', to: '50%', color: '#dd1100' }],
          gradient_stops: [{ pos: 0, color: '#1133aa' }, { pos: 100, color: '#22cc66' }],
        } },
        custom: { keep: true },
      },
    });
    await editor.locator('#paint-presets > summary').click();
    await editor.locator('#preset-paint-editor > summary').click();
    await expect(editor.locator('#preset-paint-editor .paint-mode-row')).toHaveCount(0);
    await expect(editor.locator('#preset-paint-editor .paint-property-meta')).toHaveCount(0);
    await expect(editor.locator('#preset-paint-editor .paint-clear-override')).toHaveCount(0);
    await expect(editor.locator('#preset-paint-editor .paint-registry-status')).toBeHidden();

    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await editor.locator('#preset-paint-fill_style').selectOption(style);
      const previews = await editor.evaluate(element => ({
        item: getComputedStyle(element.shadowRoot.querySelector('.paint-preset-swatch')).backgroundImage,
        editor: getComputedStyle(element.shadowRoot.querySelector('#preset-paint-editor .paint-editor-swatch')).backgroundImage,
      }));
      expect(previews.item).toBe(previews.editor);
      if (['bands', 'band_gradient'].includes(style)) expect(previews.item).not.toBe('none');
    }

    if (!await editor.locator('#preset-paint-editor').evaluate(details => details.open)) await editor.locator('#preset-paint-editor > summary').click();
    const solidFill = editor.locator('#preset-paint-editor-body #preset-paint-solid_fill');
    await solidFill.evaluate(input => { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.solid_fill)).toBe(true);
    const changeColor = async (selector, value) => editor.locator(`#preset-paint-editor-body ${selector}`).evaluate((input, next) => {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await changeColor('input[type="color"][data-paint-property="color"]', '#556677');
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.color)).toBe('#556677');
    await changeColor('[data-paint-property="opacity"]', '63');
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.opacity)).toBe(63);

    await changeColor('[data-kind="segment-color"]', '#aa22bb');
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.segments[0].color)).toBe('#aa22bb');

    for (const [selector, value] of [['#segment-draft-from', '50%'], ['#segment-draft-to', '100%'], ['[data-kind="segment-draft-color"]', '#008877']]) {
      await changeColor(selector, value);
    }
    await editor.locator('#preset-paint-editor-body [data-action="add-segment"]').click();
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.segments.length)).toBe(2);
    await expect(editor.locator('#preset-paint-editor-body .segment-editor-row')).toHaveCount(2);
    if (!await editor.locator('#preset-paint-editor').evaluate(details => details.open)) await editor.locator('#preset-paint-editor > summary').click();
    await expect(editor.locator('#preset-paint-editor-body [data-action="remove-segment"]').first()).toBeVisible();
    await editor.locator('#preset-paint-editor-body [data-action="remove-segment"]').first().evaluate(button => button.click());
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.segments.length)).toBe(1);
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.segments[0].color)).toBe('#008877');

    if (!await editor.locator('#preset-paint-editor').evaluate(details => details.open)) await editor.locator('#preset-paint-editor > summary').click();
    await changeColor('[data-kind="gradient-color"][data-index="0"]', '#eeaa00');
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.gradient_stops[0].color)).toBe('#eeaa00');
    await changeColor('#gradient-draft-pos', '50');
    await changeColor('[data-kind="gradient-draft-color"]', '#4455ee');
    await editor.locator('#preset-paint-editor-body [data-action="add-gradient-stop"]').click();
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.gradient_stops.length)).toBe(3);
    await expect(editor.locator('#preset-paint-editor-body .authored-gradient-stop-row')).toHaveCount(3);
    if (!await editor.locator('#preset-paint-editor').evaluate(details => details.open)) await editor.locator('#preset-paint-editor > summary').click();
    await expect(editor.locator('#preset-paint-editor-body [data-action="remove-gradient-stop"]').first()).toBeVisible();
    await editor.locator('#preset-paint-editor-body [data-action="remove-gradient-stop"]').first().evaluate(button => button.click());
    await expect.poll(() => editor.evaluate(element => element._draftConfig.preset_library.paint.bands.gradient_stops.length)).toBe(2);
    expect(await editor.evaluate(element => element._draftConfig.preset_library.custom.keep)).toBe(true);
  });
}
