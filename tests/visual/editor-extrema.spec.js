const { expectEditorLayout } = require('./editor-visual-assertions.cjs');
const { test, expect } = require('./visual-test.cjs');
for (const source of ['src', 'dist']) for (const host of ['standalone', 'feature']) test(`${host} extrema selects, saves, cancels and restores window helpers (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async host => {
    window.__mountWindowHelperEditor = async config => {
      const tag = host === 'feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
      const editorTag = host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor';
      await customElements.whenDefined(tag);
      document.querySelector(editorTag)?.remove();
      const editor = await customElements.get(tag).getConfigElement();
      editor.addEventListener('config-changed', event => {
        window.__windowHelperEvents.push(structuredClone(event.detail.config));
        editor.setConfig(event.detail.config);
      });
      editor.setConfig(structuredClone(config));
      editor.hass = { states: {
        'input_select.shared_window': { state: '15m', attributes: { friendly_name: 'Shared window' } },
        'input_select.floor_window': { state: '48h', attributes: { friendly_name: 'Floor window' } },
        'sensor.not_a_helper': { state: 'today', attributes: {} },
      } };
      document.querySelector('#mount').append(editor);
      await editor.updateComplete;
    };
    const config = host === 'feature'
      ? { type: 'custom:sensor-bar-card-plus-feature', peak: { enabled: true, window: 'today' }, floor: { enabled: true, window: 'yesterday' } }
      : { entities: ['sensor.a'], peak: { enabled: true, window: 'today' }, floor: { enabled: true, window: 'yesterday' } };
    window.__windowHelperInitial = structuredClone(config);
    window.__windowHelperEvents = [];
    await window.__mountWindowHelperEditor(config);
  }, host);

  const editor = page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  for (const key of ['peak', 'floor']) {
    const group = editor.locator(`#card-group-marker-${key}`);
    if (await group.getAttribute('aria-expanded') === 'false') await group.click();
  }
  const peak = editor.locator('#peak-window-entity'), floor = editor.locator('#floor-window-entity');
  const helperOptions = await peak.locator('option').allTextContents();
  expect(helperOptions).toEqual(expect.arrayContaining(['Static window', 'Shared window', 'Floor window']));
  expect(helperOptions.join(' ')).not.toContain('sensor.not_a_helper');
  await expect(peak).toHaveValue('');
  expect(await page.evaluate(() => window.__windowHelperEvents)).toHaveLength(0);

  await peak.selectOption('input_select.shared_window');
  await floor.selectOption('input_select.shared_window');
  let saved = await page.evaluate(() => window.__windowHelperEvents.at(-1));
  expect(saved.peak.window_entity).toBe('input_select.shared_window');
  expect(saved.floor.window_entity).toBe('input_select.shared_window');
  expect(saved.peak.window).toBe('today');
  expect(saved.floor.window).toBe('yesterday');

  // Simulate Cancel by reopening from the unchanged parent config.
  await page.evaluate(config => window.__mountWindowHelperEditor(config), await page.evaluate(() => window.__windowHelperInitial));
  const reopened = page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  const reopenedPeak = reopened.locator('#peak-window-entity'), reopenedFloor = reopened.locator('#floor-window-entity');
  for (const key of ['peak', 'floor']) {
    const group = reopened.locator(`#card-group-marker-${key}`);
    if (await group.getAttribute('aria-expanded') === 'false') await group.click();
  }
  await expect(reopenedPeak).toHaveValue('');
  expect(await page.evaluate(() => window.__windowHelperEvents)).toHaveLength(2);
  await reopenedPeak.selectOption('input_select.shared_window');
  await reopenedFloor.selectOption('input_select.floor_window');
  saved = await page.evaluate(() => structuredClone(window.__windowHelperEvents.at(-1)));
  // Reopen with the parent-echoed saved config to verify persistence.
  await page.evaluate(config => window.__mountWindowHelperEditor(config), saved);
  const persisted = page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  const persistedPeak = persisted.locator('#peak-window-entity'), persistedFloor = persisted.locator('#floor-window-entity');
  await expect(persistedPeak).toHaveValue('input_select.shared_window');
  await expect(persistedFloor).toHaveValue('input_select.floor_window');
  expect(await persisted.evaluate(el => el._config.peak.window_entity)).toBe('input_select.shared_window');
  expect(await persisted.evaluate(el => el._config.floor.window_entity)).toBe('input_select.floor_window');
  if (host === 'standalone') {
    await persisted.locator('button[data-action="toggle-entity-overrides"]').click();
    for (const [key, inheritedHelper, localHelper] of [
      ['peak', 'input_select.shared_window', 'input_select.floor_window'],
      ['floor', 'input_select.floor_window', 'input_select.shared_window'],
    ]) {
      const group = persisted.locator(`#entity-0-group-${key}`);
      if (await group.getAttribute('aria-expanded') === 'false') await group.click();
      const helper = persisted.locator(`#entity-0-${key}-window-entity`);
      const summary = persisted.locator(`#entity-0-group-${key}-summary`);
      const inherit = persisted.locator(`#entity-0-${key}-inherit`);
      await expect(helper).toHaveValue(inheritedHelper);
      await helper.selectOption(localHelper);
      saved = await page.evaluate(() => structuredClone(window.__windowHelperEvents.at(-1)));
      expect(saved.entities[0][key].window_entity).toBe(localHelper);
      await expect(helper).toHaveValue(localHelper);
      await expect(summary).toHaveText('Enabled');
      await expect(inherit).not.toBeChecked();
      await inherit.check();
      await expect(summary).toHaveText('Inherited');
      expect(await persisted.evaluate((el, marker) => el._config.entities[0][marker], key)).toBeUndefined();
      expect(await persisted.evaluate((el, marker) => el._config[marker].window_entity, key)).toBe(inheritedHelper);
    }
  }
});

for (const key of ['peak', 'floor']) test(`standalone ${key} root/entity controls and reset keyboard focus retain appearance`, async ({ page, browserName }) => {
  const browserSuffix = browserName === 'webkit' ? '-webkit' : '';
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.setConfig({ entities: ['sensor.a'], peak: { enabled: true, color: 'red', direction: 'outward', reset: '15m', label: { show: true, text: 'Peak energy', precision: 1 } }, floor: { enabled: true, color: 'var(--accent-color)', direction: 'inward', reset: 'weekly', label: { show: true, text: 'Floor energy', decimal: 2 } } });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px'; document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  await editor.locator(`#card-group-marker-${key}`).click();
  await expectEditorLayout(editor.locator(`.card-subgroup[data-group="marker-${key}"]`), expect);
  await editor.locator(`#${key}-window`).focus(); await editor.locator(`#${key}-window`).press('ArrowDown');
  await expect(editor.locator(`#${key}-window`)).toBeFocused();
  await editor.locator(`#${key}-label-text`).fill('Changed energy'); await expect(editor.locator(`#${key}-label-text`)).toBeFocused();
  await editor.locator('button[data-action="toggle-entity-overrides"]').click(); await editor.locator(`#entity-0-group-${key}`).click();
  const entityGroup = editor.locator(`.override-group:not(.card-subgroup)[data-group="${key}"]`);
  await entityGroup.scrollIntoViewIfNeeded();
  await editor.evaluate(element => element.shadowRoot.activeElement?.blur());
  if (key === 'floor') {
    // The existing floor baseline includes the browser-native number spinner.
    const precision = editor.locator(`#entity-0-${key}-label-precision`);
    const precisionBox = await precision.boundingBox();
    await page.mouse.move(precisionBox.x + precisionBox.width - 8, precisionBox.y + precisionBox.height / 2);
  } else {
    await page.mouse.move(0, 0);
  }
  await expectEditorLayout(entityGroup, expect);
  await editor.locator(`#entity-0-${key}-window`).focus();
  await editor.locator(`#entity-0-${key}-window`).selectOption('today'); await expect(editor.locator(`#entity-0-${key}-window`)).toBeFocused();
});

for (const host of ['standalone', 'feature']) test(`${host} history help follows light and dark theme colors`, async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async host => {
    const tag = host === 'feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    editor.setConfig(host === 'feature'
      ? { type: 'custom:sensor-bar-card-plus-feature', peak: { enabled: true } }
      : { entities: ['sensor.a'], peak: { enabled: true } });
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, host);
  const editor = page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  await editor.locator('#card-group-marker-peak').click();
  const help = editor.locator('.card-subgroup[data-group="marker-peak"] small.section-note')
    .filter({ hasText: 'selected helper option overrides this static window' });
  await expect(help).toBeVisible();
  for (const [background, foreground] of [['#ffffff', '#595959'], ['#1c1c1c', '#bdbdbd']]) {
    await editor.evaluate((element, [bg, fg]) => {
      element.style.setProperty('--card-background-color', bg);
      element.style.setProperty('--secondary-text-color', fg);
      element.style.setProperty('--primary-text-color', fg);
      document.body.style.background = bg;
    }, [background, foreground]);
    const result = await help.evaluate((element, [bg]) => {
      const parse = color => color.match(/[\da-f]{2}/gi).map(part => parseInt(part, 16));
      const text = getComputedStyle(element).color.match(/\d+/g).slice(0, 3).map(Number);
      const luminance = rgb => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
      const a = luminance(text), b = luminance(parse(bg));
      return { contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05),
        fits: element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight };
    }, [background]);
    expect(result.contrast).toBeGreaterThanOrEqual(4.5);
    expect(result.fits).toBe(true);
  }
});
