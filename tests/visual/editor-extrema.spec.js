const { test, expect } = require('@playwright/test');
for (const key of ['peak', 'floor']) test(`standalone ${key} root/entity controls and reset keyboard focus retain appearance`, async ({ page }) => {
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
  await expect(editor.locator(`.card-subgroup[data-group="marker-${key}"]`)).toHaveScreenshot(`${key}-root.png`);
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
  await expect(entityGroup).toHaveScreenshot(`${key}-entity.png`);
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
  const help = editor.locator('.card-subgroup[data-group="marker-peak"] small.section-note');
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
