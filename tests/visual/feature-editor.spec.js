const { test, expect } = require('@playwright/test');
const path = require('path');

const type = 'custom:sensor-bar-card-plus-feature';
async function mountEditor(page, { source = 'src', width = 360, context = { entity_id: 'sensor.parent' }, config = { type } } = {}) {
  if (source === 'dist') {
    await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  }
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ width, context, config }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature');
    const Feature = customElements.get('sensor-bar-card-plus-feature');
    const editor = Feature.getConfigElement();
    window.__featureEditorEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__featureEditorEvents.push({ config: structuredClone(event.detail.config), bubbles: event.bubbles, composed: event.composed });
      editor.setConfig(event.detail.config);
    });
    editor.setConfig(config);
    editor.context = context;
    editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`;
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { width, context, config });
  return page.locator('sensor-bar-card-plus-feature-editor');
}
const configOf = editor => editor.evaluate(element => structuredClone(element._config));

for (const source of ['src', 'dist']) test(`public discovery and inherited/explicit entity UX (${source})`, async ({ page }) => {
  const editor = await mountEditor(page, { source });
  expect(await page.evaluate(() => window.customCardFeatures.find(feature => feature.type === 'sensor-bar-card-plus-feature').configurable)).toBe(true);
  await expect(editor.getByRole('status')).toHaveText('Using parent card entity: sensor.parent');
  expect(await page.evaluate(() => window.__featureEditorEvents)).toHaveLength(0);
  await editor.locator('#formatting-unit').fill('W');
  expect((await configOf(editor)).entity).toBeUndefined();
  await editor.getByLabel('Use explicit entity').check();
  await editor.getByLabel('Entity override', { exact: true }).fill('input_number.override');
  await expect(editor.getByRole('status')).toHaveText('Using explicit entity: input_number.override');
  await editor.evaluate(element => { element.context = { entity_id: 'sensor.changed_parent' }; });
  await expect(editor.getByRole('status')).toHaveText('Using explicit entity: input_number.override');
  await editor.getByLabel('Use explicit entity').uncheck();
  await expect(editor.getByRole('status')).toHaveText('Using parent card entity: sensor.changed_parent');
  expect((await configOf(editor)).entity).toBeUndefined();
  const before = await page.evaluate(() => window.__featureEditorEvents.length);
  await editor.evaluate(element => { element.context = { entity_id: 'sensor.last_parent' }; });
  await expect(editor.getByRole('status')).toHaveText('Using parent card entity: sensor.last_parent');
  expect(await page.evaluate(() => window.__featureEditorEvents.length)).toBe(before);
  expect(await page.evaluate(() => window.__featureEditorEvents.every(event => event.bubbles && event.composed))).toBe(true);
});

test('shared fields preserve raw advanced config, focused nodes and config echoes', async ({ page }) => {
  const config = {
    type, future_option: { preserve: true }, unit: 'Wh', color_mode: 'gradient',
    scale: { min: { fixed: 0, entity: 'sensor.minimum', extra: true }, max: 100 },
    bar: { fill_style: 'gradient', color: 'red', animated: false, extra: true, segments: [{ from: 50, to: 100, color: 'red' }, { from: 0, to: 50, color: 'blue' }] },
    markers: [{ at: 75, extra: true }, { at: 25 }], target: { at: '75%' },
  };
  const editor = await mountEditor(page, { config });
  await editor.evaluate(element => { element._originalMinNode = element.shadowRoot.querySelector('#scale-min'); });
  await editor.locator('#scale-min').fill('12');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('scale-min');
  expect(await editor.evaluate(element => element._originalMinNode === element.shadowRoot.querySelector('#scale-min'))).toBe(true);
  await editor.getByLabel('Min entity', { exact: true }).fill('sensor.new_minimum');
  await editor.locator('#formatting-unit').fill('kW');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id)).toBe('formatting-unit');
  await editor.locator('#formatting-decimal').fill('0');
  await editor.locator('[data-field="bar-color-text-fallback"]').fill('var(--accent-color)');
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset.field)).toBe('bar-color-text-fallback');
  await editor.locator('#bar-fill-style').selectOption('bands');
  await editor.locator('#bar-solid-fill').check();
  const saved = await configOf(editor);
  expect(saved.scale.min).toEqual({ fixed: 12, entity: 'sensor.new_minimum', extra: true });
  expect(saved.bar).toEqual({ ...config.bar, fill_style: 'bands', color: 'var(--accent-color)', solid_fill: true });
  expect(saved.formatting).toEqual({ unit: 'kW', decimal: 0 });
  expect(saved.unit).toBeUndefined();
  expect(saved.color_mode).toBeUndefined();
  expect(saved.markers).toEqual(config.markers);
  expect(saved.target).toEqual(config.target);
  expect(saved.future_option).toEqual(config.future_option);
  expect(saved.entity).toBeUndefined();
  await expect(editor.locator('#title, #layout-height, [data-action="add-entity"], sensor-bar-card-plus-feature')).toHaveCount(0);
});

test('Area/no-parent entity requirement and narrow layout stay usable', async ({ page }) => {
  const editor = await mountEditor(page, { width: 240, context: { area_id: 'kitchen' } });
  await expect(editor.getByRole('status')).toHaveText('An entity is required. Select an entity below.');
  expect(await page.evaluate(() => window.__featureEditorEvents)).toHaveLength(0);
  await editor.getByLabel('Entity override', { exact: true }).fill('sensor.custom');
  await expect(editor.getByRole('status')).toHaveText('Using explicit entity: sensor.custom');
  await editor.getByLabel('Use explicit entity').uncheck();
  await expect(editor.getByRole('status')).toContainText('An entity is required');
  await editor.getByRole('status').click();
  await expect(editor.locator('#scale-min')).toBeVisible();
  expect(await editor.evaluate(element => Array.from(element.shadowRoot.querySelectorAll('.section, input, select')).every(node => {
    const host = element.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return rect.left >= host.left - 1 && rect.right <= host.right + 1;
  }))).toBe(true);
  await expect(editor).toHaveScreenshot('feature-editor-required-narrow.png');
});

test('HA picker value-changed shape supports explicit and Scale sources', async ({ page }) => {
  await page.addInitScript(() => {
    customElements.define('ha-entity-picker', class extends HTMLElement {});
  });
  const editor = await mountEditor(page, { context: {} });
  await editor.locator('ha-entity-picker[data-kind="feature-entity-source"]').evaluate(picker => {
    picker.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.custom_picker_id' } }));
  });
  await expect(editor.getByRole('status')).toHaveText('Using explicit entity: sensor.custom_picker_id');
  await editor.locator('ha-entity-picker[data-kind="scale-max-entity-source"]').evaluate(picker => {
    picker.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.maximum' } }));
  });
  expect((await configOf(editor)).scale.max).toEqual({ entity: 'sensor.maximum' });
  expect(await editor.locator('ha-entity-picker[data-kind="scale-max-entity-source"]').evaluate(picker => picker.allowCustomEntity && picker.hass.states != null)).toBe(true);
  await editor.locator('ha-entity-picker[data-kind="feature-entity-source"]').evaluate(picker => {
    picker.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: '' } }));
  });
  expect((await configOf(editor)).entity).toBeUndefined();
});

test('late HA picker loading and CSS-to-hex typing preserve focus', async ({ page }) => {
  const editor = await mountEditor(page, { config: { type, bar: { color: 'red' } } });
  const fallback = editor.locator('[data-field="bar-color-text-fallback"]');
  await fallback.fill('#ff0000');
  await expect(fallback).toBeFocused();
  await editor.locator('#formatting-unit').fill('W');
  await expect(fallback).toHaveCount(0);
  await expect(editor.locator('#formatting-unit')).toBeFocused();
  await page.evaluate(() => { customElements.define('ha-entity-picker', class extends HTMLElement {}); });
  await expect(editor.locator('ha-entity-picker[data-kind="scale-min-entity-source"]')).toHaveCount(1);
  await expect(editor.locator('#formatting-unit')).toBeFocused();
  expect((await configOf(editor)).bar.color).toBe('#ff0000');
  const eventCount = await page.evaluate(() => window.__featureEditorEvents.length);
  await editor.evaluate(element => element.setConfig({ ...element._config, formatting: { unit: 'kW' }, future: true }));
  await expect(editor.locator('#formatting-unit')).toHaveValue('kW');
  await expect(editor.locator('#formatting-unit')).toBeFocused();
  expect(await page.evaluate(() => window.__featureEditorEvents.length)).toBe(eventCount);
});

test('Feature editor inherited composition has a focused visual baseline', async ({ page }) => {
  const editor = await mountEditor(page, { config: { type, scale: { min: 0, max: 100 }, formatting: { unit: 'W', decimal: 1 }, bar: { fill_style: 'gradient', color: 'var(--accent-color)' } } });
  await expect(editor).toHaveScreenshot('feature-editor-inherited.png');
});
