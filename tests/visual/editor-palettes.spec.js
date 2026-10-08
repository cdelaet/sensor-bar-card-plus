const { test, expect } = require('@playwright/test');
async function mount(page, style) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async style => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({ entities: [{ entity: 'sensor.a' }], bar: { fill_style: style,
      segments: [{ from: '0%', to: '50%', color: '#123456' }],
      gradient_stops: [{ pos: 0, color: 'red' }, { pos: 60, color: '#123456' }],
    } });
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
  }, style);
  return page.locator('sensor-bar-card-plus-editor');
}
for (const [style, group] of [['bands', 'segments'], ['gradient', 'gradient-stops']]) {
  test(`standalone ${group} root/override appearance and draft focus`, async ({ page }) => {
    const editor = await mount(page, style);
    await editor.locator(`#card-group-${group}`).click();
    await expect(editor.locator(`.card-subgroup[data-group="${group}"]`)).toHaveScreenshot(`palette-${group}-root.png`);
    const draft = editor.locator(style === 'bands' ? '#segment-draft-from' : '#gradient-draft-pos');
    await draft.fill(style === 'bands' ? '50%' : '80');
    await draft.press('Enter');
    await expect.poll(() => editor.evaluate(element => element.shadowRoot.activeElement?.id ?? '')).toBe('');
    await editor.locator('button[data-action="toggle-entity-overrides"]').click();
    await editor.locator(`#entity-0-group-${group}`).click();
    await expect(editor.locator(`.override-group:not(.card-subgroup)[data-group="${group}"]`)).toHaveScreenshot(`palette-${group}-override.png`);
  });
}
