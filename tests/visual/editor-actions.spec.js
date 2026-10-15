const { test, expect } = require('@playwright/test');

test('Actions selectors round-trip without replacing the focused editor control', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    if (!customElements.get('ha-selector')) {
      customElements.define('ha-selector', class extends HTMLElement {
        constructor() { super(); this.tabIndex = 0; }
      });
    }
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.setConfig({
      tap_action: { action: 'toggle', custom_action_data: { keep: true } },
      entities: [
        { entity: 'sensor.one', custom_row_key: 'keep' },
        { entity: 'sensor.two' },
      ],
    });
    editor.addEventListener('config-changed', event => {
      window.__editorConfig = event.detail.config;
      editor.setConfig(event.detail.config);
    });
    document.querySelector('#mount').append(editor);
  });
  const editor = page.locator('sensor-bar-card-plus-editor');
  const cardTap = editor.locator('ha-selector[data-kind="card-action"][data-slot="tap_action"]');
  await cardTap.focus();
  await cardTap.evaluate(element => { element.__keptIdentity = true; });
  await cardTap.evaluate(element => element.dispatchEvent(new CustomEvent('value-changed', {
    detail: { value: { action: 'perform-action', perform_action: 'light.toggle', custom_action_data: { keep: false }, untouched: 42 } },
    bubbles: true,
    composed: true,
  })));
  expect(await cardTap.evaluate(element => element.__keptIdentity)).toBe(true);
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset?.slot)).toBe('tap_action');
  expect(await page.evaluate(() => window.__editorConfig.tap_action)).toEqual({
    action: 'perform-action', perform_action: 'light.toggle', custom_action_data: { keep: false }, untouched: 42,
  });
  expect(await page.evaluate(() => window.__editorConfig.entities[0].custom_row_key)).toBe('keep');

  await editor.locator('button[data-action="toggle-entity-overrides"]').first().click();
  await editor.locator('#entity-0-group-actions').click();
  const rowTap = editor.locator('ha-selector[data-kind="entity-action"][data-index="0"][data-slot="tap_action"]');
  await rowTap.focus();
  await rowTap.evaluate(element => { element.__keptIdentity = true; });
  await rowTap.evaluate(element => element.dispatchEvent(new CustomEvent('value-changed', {
    detail: { value: { action: 'none', reason: 'user choice' } },
    bubbles: true,
    composed: true,
  })));
  expect(await rowTap.evaluate(element => element.__keptIdentity)).toBe(true);
  await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.dataset?.slot)).toBe('tap_action');
  expect(await page.evaluate(() => window.__editorConfig.entities[0].tap_action)).toEqual({ action: 'none', reason: 'user choice' });
  expect(await page.evaluate(() => window.__editorConfig.entities[1].tap_action)).toBeUndefined();
});
