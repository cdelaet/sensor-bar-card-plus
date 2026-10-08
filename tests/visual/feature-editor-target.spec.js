const { expandFeatureGroups, featureGroup } = require('./feature-editor-test-utils.cjs');
const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source, width, percentage = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ width, percentage }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const config = { type: 'custom:sensor-bar-card-plus-feature', future: { keep: true },
      target: { at: percentage ? '70%' : { entity: 'sensor.t', value: 70, future: true }, color: 'red', shape: 'triangle', direction: 'outward',
        label: { show: true, text: 'Target energy', show_value: true, show_unit: true, precision: 1, entity: 'sensor.unsupported', future: true },
        when_exceeded: { fill_color: 'var(--accent-color)', future: true }, future: true },
      baseline: { at: '50%', above: { color: 'red' } }, peak: { enabled: true }, floor: { enabled: true }, markers: [{ at: 25, future: true }],
      bar: { fill_style: 'gradient', needle: true, animated: false, segments: [{ from: 50, color: 'red' }, { from: 0, color: 'blue' }], gradient_stops: [{ pos: 100, color: 'red' }, { pos: 0, color: 'blue' }] } };
    window.__targetOriginal = structuredClone(config); window.__targetEvents = [];
    editor.addEventListener('config-changed', event => { window.__targetEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config); });
    editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`; document.querySelector('#mount').append(editor); await editor.updateComplete;
  }, { width, percentage });
  const editor = page.locator('sensor-bar-card-plus-feature-editor');
  await expandFeatureGroups(editor);
  return editor;
}
const saved = editor => editor.evaluate(el => structuredClone(el._config));
for (const source of ['src', 'dist']) for (const width of [360, 240]) test(`Feature Target ${width}px (${source}): fields, preservation, focus and echo`, async ({ page }) => {
  const editor = await mount(page, source, width), original = await page.evaluate(() => window.__targetOriginal);
  expect(await page.evaluate(() => window.__targetEvents)).toHaveLength(0);
  const section = featureGroup(editor, 'marker-target');
  await expect(section).toHaveScreenshot(`feature-target-${width}.png`);
  expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(section.locator('#target-direction option')).toHaveText(['Inward', 'Outward']);
  await expect(section.locator('#target-shape option')).toHaveText(['diamond', 'triangle']);
  await editor.locator('#target-mode').selectOption('enabled');
  await editor.locator('#target-shape').selectOption('diamond'); await editor.locator('#target-direction').selectOption('inward');
  await editor.locator('[data-field="target-color-text-fallback"]').fill('var(--primary-color)');
  await expect(editor.locator('[data-field="target-color-text-fallback"]')).toBeFocused();
  const fallback = editor.locator('#target-value'); await fallback.evaluate(node => { window.__targetFallbackNode = node; });
  const count = await page.evaluate(() => window.__targetEvents.length);
  await fallback.fill('75'); await expect(fallback).toBeFocused();
  expect(await page.evaluate(() => window.__targetEvents.length)).toBe(count + 1);
  expect(await fallback.evaluate(node => node === window.__targetFallbackNode)).toBe(true);
  await editor.getByLabel('Target entity', { exact: true }).fill('sensor.changed');
  const label = editor.locator('#target-label-text'); await label.evaluate(node => { window.__targetLabelNode = node; });
  await label.fill('Goal energy'); await expect(label).toBeFocused(); expect(await label.evaluate(node => node === window.__targetLabelNode)).toBe(true);
  await editor.locator('#target-label-show').uncheck(); await editor.locator('#target-label-show-value').uncheck(); await editor.locator('#target-label-show-unit').uncheck();
  await editor.locator('#target-label-precision').fill('2'); await expect(editor.locator('#target-label-precision')).toBeFocused();
  const edited = await saved(editor);
  expect(edited.target.label).toEqual({ ...original.target.label, text: 'Goal energy', show: false, show_value: false, show_unit: false, precision: 2 });
  expect(edited.target.at).toEqual({ value: 75, entity: 'sensor.changed', future: true });
  expect(edited.target.future).toBe(true);
  await editor.locator('#target-above-fill-enabled').uncheck(); expect((await saved(editor)).target.when_exceeded).toEqual({ future: true });
  await editor.locator('#target-above-fill-color').evaluate(el => { el.value = '#334455'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect((await saved(editor)).target.when_exceeded).toEqual({ future: true });
  await editor.locator('#target-above-fill-enabled').check(); expect((await saved(editor)).target.when_exceeded).toEqual({ fill_color: '#334455', future: true });
  await editor.locator('#target-mode').selectOption('disabled');
  const before = await saved(editor);
  for (const key of ['baseline', 'bar', 'peak', 'floor', 'markers', 'future']) expect(before[key]).toEqual(original[key]);
  await editor.locator('#bar-needle-mode').selectOption('disabled'); await editor.locator('#baseline-mode').selectOption('enabled');
  await editor.locator('#bar-fill-style').selectOption('bands'); await editor.locator('#bar-color').evaluate(el => { el.value = '#445566'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect((await saved(editor)).target).toEqual(before.target);
  const echoCount = await page.evaluate(() => window.__targetEvents.length);
  await editor.evaluate(el => { el.context = { entity_id: 'sensor.changed_parent' }; el.hass = { states: {} }; el.setConfig(el._config); });
  expect(await page.evaluate(() => window.__targetEvents.length)).toBe(echoCount); expect((await saved(editor)).target).toEqual(before.target);
  expect((await saved(editor)).entity).toBeUndefined();
  await fallback.fill(''); await editor.getByLabel('Target entity', { exact: true }).fill('');
  expect((await saved(editor)).target.at).toEqual({ future: true });
});
for (const source of ['src', 'dist']) test(`Feature Target percentage and HA picker (${source})`, async ({ page }) => {
  await page.addInitScript(() => { customElements.define('ha-entity-picker', class extends HTMLElement {}); });
  const editor = await mount(page, source, 240, true);
  await expect(editor.locator('#target-value')).toHaveValue(''); await expect(editor.locator('#target-percent')).toHaveCount(1);
  await expect(editor.locator('[data-kind="target-label-entity"]')).toHaveCount(0);
  await editor.locator('#target-label-text').fill('Percentage goal'); await editor.locator('#target-mode').selectOption('enabled');
  await editor.locator('#formatting-unit').fill('W'); expect((await saved(editor)).target.at).toBe('70%');
  const picker = editor.locator('ha-entity-picker[data-kind="target-entity-source"]');
  await picker.evaluate(el => { el.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.changed' } })); });
  expect((await saved(editor)).target.at).toEqual({ percent: 70, entity: 'sensor.changed' });
  await picker.evaluate(el => { el.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: undefined } })); });
  expect((await saved(editor)).target.at).toEqual({ percent: 70 });
  expect((await saved(editor)).target.label.entity).toBe('sensor.unsupported');
});
