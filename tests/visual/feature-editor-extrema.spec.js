const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source, width, empty = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ width, empty }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const marker = color => ({ enabled: true, color, direction: 'outward', reset: '15m', future: { keep: true },
      label: { show: true, text: 'Energy', show_value: true, show_unit: true, decimal: 1, entity: 'sensor.unsupported', future: { keep: true } } });
    const config = empty ? { type: 'custom:sensor-bar-card-plus-feature' } : { type: 'custom:sensor-bar-card-plus-feature', future: true,
      peak: marker('var(--accent-color)'), floor: marker('#334455'), target: { at: '70%', future: true }, baseline: { at: '50%', future: true },
      markers: [{ at: 25, future: true }],
      bar: { needle: true, animated: false, fill_style: 'gradient', segments: [{ from: 50, color: 'red' }, { from: 0, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }] } };
    window.__extremaOriginal = structuredClone(config); window.__extremaEvents = [];
    editor.addEventListener('config-changed', event => { window.__extremaEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config); });
    editor.setConfig(config); editor.context = { entity_id: 'sensor.parent' }; editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`; document.querySelector('#mount').append(editor); await editor.updateComplete;
  }, { width, empty });
  return page.locator('sensor-bar-card-plus-feature-editor');
}
const saved = editor => editor.evaluate(el => structuredClone(el._config));
for (const source of ['src', 'dist']) for (const width of [360, 240]) test(`Feature extrema ${width}px (${source}): labels/reset/preservation/focus/echo`, async ({ page }) => {
  const editor = await mount(page, source, width), original = await saved(editor);
  expect(await page.evaluate(() => window.__extremaEvents)).toHaveLength(0);
  expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const key of ['peak', 'floor']) {
    const section = editor.locator('.section').filter({ has: page.getByRole('heading', { name: key === 'peak' ? 'Peak' : 'Floor', exact: true }) });
    await expect(section).toHaveScreenshot(`feature-${key}-${width}.png`);
    const other = key === 'peak' ? 'floor' : 'peak', before = await saved(editor);
    await editor.locator(`#${key}-show`).uncheck(); await editor.locator(`#${key}-show`).check();
    const direction = editor.locator(`#${key}-direction`); await expect(direction.locator('option')).toHaveText(['Inward', 'Outward']);
    await direction.selectOption('inward'); await direction.selectOption('outward');
    const color = editor.locator(`[data-field="${key}-color-text-fallback"]`);
    if (key === 'peak') { await color.fill('var(--primary-color)'); await expect(color).toBeFocused(); await color.press('Tab'); }
    else await editor.locator(`#${key}-color`).evaluate(el => { el.value = '#445566'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const reset = editor.locator(`#${key}-reset`);
    await expect(reset.locator('option')).toHaveCount(89);
    for (const value of ['never', '1m', '59m', '1h', '23h', 'quarterly', 'hourly', 'daily', 'weekly', 'monthly', 'yearly']) {
      await reset.focus(); await reset.selectOption(value); await expect(reset).toBeFocused(); expect((await saved(editor))[key].reset).toBe(value);
    }
    // Headless native selects on this platform do not advance via arrows.
    // Protect focus/traversal; selectOption above covers actual change commits.
    await reset.selectOption('never'); await reset.press('ArrowDown'); await reset.press('Escape'); await expect(reset).toBeFocused();
    await reset.press('Tab'); await expect(direction).toBeFocused();
    const config = await saved(editor), count = await page.evaluate(() => window.__extremaEvents.length);
    for (const invalid of ['0m', '60m', '0h', '24h', '1s']) {
      await reset.evaluate((el, value) => { const option = new Option(value, value); el.add(option); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); option.remove(); }, invalid);
    }
    expect(await saved(editor)).toEqual(config); expect(await page.evaluate(() => window.__extremaEvents.length)).toBe(count);
    const label = editor.locator(`#${key}-label-text`); await label.evaluate(node => { window.__extremaLabelNode = node; });
    const labelCount = await page.evaluate(() => window.__extremaEvents.length);
    await label.fill(`${key} energy`); await expect(label).toBeFocused();
    expect(await page.evaluate(() => window.__extremaEvents.length)).toBe(labelCount + 1);
    expect(await label.evaluate(node => node === window.__extremaLabelNode)).toBe(true);
    await editor.locator(`#${key}-label-show`).uncheck(); await editor.locator(`#${key}-label-show-value`).uncheck(); await editor.locator(`#${key}-label-show-unit`).uncheck();
    const precision = editor.locator(`#${key}-label-precision`);
    const beforeInvalid = await saved(editor), invalidCount = await page.evaluate(() => window.__extremaEvents.length);
    await precision.fill('-1'); await expect(precision).toBeFocused();
    expect(await saved(editor)).toEqual(beforeInvalid); expect(await page.evaluate(() => window.__extremaEvents.length)).toBe(invalidCount);
    await editor.evaluate(async el => { el.setConfig(el._config); el.context = { entity_id: 'sensor.echo_parent' }; await el.updateComplete; });
    await expect(precision).toHaveValue('-1'); await expect(precision).toBeFocused();
    await precision.fill('2'); await expect(precision).toBeFocused();
    expect((await saved(editor))[key].label).toEqual({ show: false, text: `${key} energy`, show_value: false, show_unit: false, precision: 2, entity: 'sensor.unsupported', future: { keep: true } });
    const edited = await saved(editor); expect(edited[other]).toEqual(before[other]);
    for (const name of ['bar', 'target', 'baseline', 'markers', 'future']) expect(edited[name]).toEqual(original[name]);
  }
  const before = await saved(editor);
  for (const [selector, value] of [['#bar-needle-mode', 'disabled'], ['#baseline-mode', 'enabled'], ['#target-mode', 'disabled'], ['#bar-fill-style', 'bands']]) await editor.locator(selector).selectOption(value);
  await editor.locator('#formatting-unit').fill('W');
  expect((await saved(editor)).peak).toEqual(before.peak); expect((await saved(editor)).floor).toEqual(before.floor);
  const count = await page.evaluate(() => window.__extremaEvents.length);
  await editor.evaluate(async el => { el.context = { entity_id: 'sensor.changed' }; el.hass = { states: {} }; el.setConfig(el._config); await el.updateComplete; });
  expect(await page.evaluate(() => window.__extremaEvents.length)).toBe(count); expect((await saved(editor)).entity).toBeUndefined();
});
for (const source of ['src', 'dist']) test(`Feature extrema (${source}): defaults, unsupported reset metadata and foreign replacement`, async ({ page }) => {
  const editor = await mount(page, source, 240, true);
  expect(await saved(editor)).toEqual({ type: 'custom:sensor-bar-card-plus-feature' });
  for (const key of ['peak', 'floor']) {
    await expect(editor.locator(`#${key}-show`)).not.toBeChecked(); await expect(editor.locator(`#${key}-reset`)).toHaveValue('never');
    await editor.locator(`#${key}-show`).check(); await editor.locator(`#${key}-show`).uncheck(); expect((await saved(editor))[key]).toEqual({ enabled: false });
  }
  await editor.evaluate(async el => { el.setConfig({ type: 'custom:sensor-bar-card-plus-feature', peak: { reset: { mode: 'duration', duration: '15m', future: true } }, floor: { reset: { mode: 'calendar', future: true } } }); await el.updateComplete; });
  const raw = await saved(editor);
  await editor.locator('#peak-label-text').fill('Edited'); await editor.locator('#floor-color').evaluate(el => { el.value = '#556677'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect((await saved(editor)).peak.reset).toEqual(raw.peak.reset); expect((await saved(editor)).floor.reset).toEqual(raw.floor.reset);
  await editor.locator('#peak-reset').selectOption('15m'); expect((await saved(editor)).peak.reset).toBe('15m'); expect((await saved(editor)).floor.reset).toEqual(raw.floor.reset);
  await editor.evaluate(async el => { el.setConfig({ type: 'custom:sensor-bar-card-plus-feature', peak: { label: { text: 'Foreign' }, reset: 'daily' } }); await el.updateComplete; });
  await expect(editor.locator('#peak-label-text')).toHaveValue('Foreign'); await expect(editor.locator('#peak-reset')).toHaveValue('daily');
});
