const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source, width, percentage = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ width, percentage }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const config = { type: 'custom:sensor-bar-card-plus-feature', future: { keep: true }, target: { at: '80%' }, markers: [{ at: 25 }],
      bar: { fill_style: 'gradient', animated: false, needle: percentage ? { show: false, color: 'var(--accent-color)', future: { keep: true } } : true,
        segments: [{ from: 60, to: 100, color: 'red' }, { from: 0, to: 60, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }],
      },
      baseline: { enabled: false, at: percentage ? '50%' : { entity: 'sensor.b', value: 20, future: { keep: true } }, above: { color: 'red', future: true }, below: { color: 'blue', future: true }, future: { keep: true } },
    };
    window.__physicalOriginal = structuredClone(config); window.__physicalEvents = [];
    editor.addEventListener('config-changed', event => { window.__physicalEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config); });
    editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`; document.querySelector('#mount').append(editor); await editor.updateComplete;
  }, { width, percentage });
  return page.locator('sensor-bar-card-plus-feature-editor');
}
const saved = editor => editor.evaluate(el => structuredClone(el._config));
for (const source of ['src', 'dist']) for (const width of [360, 240]) test(`Feature Needle/Baseline ${width}px (${source}): precedence, raw preservation, focus and echo`, async ({ page }) => {
  const editor = await mount(page, source, width);
  const original = await page.evaluate(() => window.__physicalOriginal);
  expect(await saved(editor)).toEqual(original); expect(await page.evaluate(() => window.__physicalEvents)).toHaveLength(0);
  for (const name of ['Needle', 'Baseline']) {
    await expect(editor.locator('.section').filter({ has: page.getByRole('heading', { name, exact: true }) })).toHaveScreenshot(`feature-${name.toLowerCase()}-${width}.png`);
  }
  expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(editor.getByText('An active, resolved Baseline takes visual precedence over Needle.')).toBeVisible();
  await editor.locator('#baseline-mode').selectOption('enabled');
  expect((await saved(editor)).bar.needle).toBe(true);
  const fallback = editor.locator('#baseline-value');
  await fallback.evaluate(node => { window.__physicalFallbackNode = node; });
  await fallback.fill('30'); await expect(fallback).toBeFocused();
  expect(await fallback.evaluate(node => node === window.__physicalFallbackNode)).toBe(true);
  expect((await saved(editor)).baseline.at).toEqual({ ...original.baseline.at, value: 30 });
  await editor.getByLabel('Baseline entity', { exact: true }).fill('sensor.changed');
  await expect(editor.getByLabel('Baseline entity', { exact: true })).toBeFocused();
  await editor.locator('#bar-needle-mode').selectOption('disabled');
  const baseline = (await saved(editor)).baseline;
  expect((await saved(editor)).bar.needle).toBe(false);
  await editor.locator('#bar-needle-color').evaluate(el => { el.value = '#334455'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect((await saved(editor)).bar.needle).toEqual({ show: false, color: '#334455' });
  await editor.locator('#bar-needle-mode').selectOption('enabled');
  expect((await saved(editor)).baseline).toEqual(baseline);
  expect((await saved(editor)).bar.needle).toEqual({ show: true, color: '#334455' });
  const above = editor.locator('[data-field="baseline-above-color-text-fallback"]');
  await above.fill('var(--accent-color)'); await expect(above).toBeFocused();
  await editor.locator('#baseline-above-color-enabled').uncheck();
  expect((await saved(editor)).baseline.above).toEqual({ future: true });
  await editor.locator('#baseline-above-color-enabled').check();
  expect((await saved(editor)).baseline.above).toEqual({ color: 'var(--accent-color)', future: true });
  await editor.locator('[data-field="baseline-below-color-text-fallback"]').fill('var(--primary-color)');
  await editor.locator('#baseline-mode').selectOption('disabled');
  const count = await page.evaluate(() => window.__physicalEvents.length);
  const before = await saved(editor);
  await editor.evaluate(el => { el.context = { entity_id: 'sensor.changed_parent' }; el.hass = { states: {} }; el.setConfig(el._config); });
  expect(await saved(editor)).toEqual(before); expect(await page.evaluate(() => window.__physicalEvents.length)).toBe(count);
  expect(before.bar.segments).toEqual(original.bar.segments); expect(before.bar.gradient_stops).toEqual(original.bar.gradient_stops);
  expect(before.markers).toEqual(original.markers); expect(before.target).toEqual(original.target); expect(before.future).toEqual(original.future);
  await fallback.fill(''); await editor.getByLabel('Baseline entity', { exact: true }).fill('');
  expect((await saved(editor)).baseline.at).toEqual({ future: { keep: true } });
  await editor.getByRole('button', { name: 'Remove Baseline', exact: true }).click();
  expect((await saved(editor)).baseline).toBeUndefined(); expect((await saved(editor)).bar.needle).toEqual(before.bar.needle);
  await editor.locator('#baseline-mode').selectOption('enabled'); await fallback.fill('40');
  expect((await saved(editor)).baseline).toEqual({ enabled: true, at: { fixed: 40 } });
  expect((await saved(editor)).bar.needle).toEqual(before.bar.needle);
});
for (const source of ['src', 'dist']) test(`Feature percentage Baseline and HA picker (${source})`, async ({ page }) => {
  await page.addInitScript(() => { customElements.define('ha-entity-picker', class extends HTMLElement {}); });
  const editor = await mount(page, source, 240, true);
  await expect(editor.locator('#baseline-value')).toHaveValue('');
  await expect(editor.locator('#baseline-percent')).toHaveCount(0);
  await editor.locator('#baseline-mode').selectOption('enabled');
  await editor.locator('#bar-needle-mode').selectOption('enabled');
  await editor.locator('[data-field="bar-needle-color-text-fallback"]').fill('red');
  await expect(editor.locator('[data-field="bar-needle-color-text-fallback"]')).toBeFocused();
  expect((await saved(editor)).baseline.at).toBe('50%');
  const picker = editor.locator('ha-entity-picker[data-kind="baseline-entity-source"]');
  await picker.evaluate(el => { el.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.c' } })); });
  expect((await saved(editor)).baseline.at).toEqual({ percent: 50, entity: 'sensor.c' });
  await picker.evaluate(el => { el.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: '' } })); });
  expect((await saved(editor)).baseline.at).toEqual({ percent: 50 });
  expect((await saved(editor)).bar.needle).toEqual({ show: true, color: 'red', future: { keep: true } });
});
