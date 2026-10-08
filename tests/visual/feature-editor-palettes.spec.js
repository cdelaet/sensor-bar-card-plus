const { expandFeatureGroups } = require('./feature-editor-test-utils.cjs');
const { test, expect } = require('@playwright/test');
const path = require('path');
async function mount(page, source, style, width) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ style, width }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature-editor');
    const editor = document.createElement('sensor-bar-card-plus-feature-editor');
    const config = { type: 'custom:sensor-bar-card-plus-feature', extra: { keep: true }, target: { at: '80%' }, bar: {
      fill_style: style, animated: false, extra: { keep: true },
      segments: [{ from: '60%', to: '100%', color: '#123456', metadata: { keep: [1, 2] } }, { from: 0, to: 40, color: '#abcdef', flag: true }],
      gradient_stops: [{ pos: '80%', color: 'red', metadata: { keep: [1, 2] } }, { pos: 0, color: '#abcdef', flag: true }],
    } };
    window.__paletteOriginal = structuredClone(config); window.__paletteEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__paletteEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config);
    });
    editor.setConfig(config); editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} };
    document.querySelector('#mount').style.width = `${width}px`; document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { style, width });
  const editor = page.locator('sensor-bar-card-plus-feature-editor');
  await expandFeatureGroups(editor);
  return editor;
}
const saved = editor => editor.evaluate(el => structuredClone(el._config));
for (const source of ['src', 'dist']) for (const style of ['bands', 'gradient']) for (const width of [360, 240]) {
  test(`Feature ${style} palette ${width}px (${source}): raw operations, validation, echo, draft and preview`, async ({ page }) => {
    const editor = await mount(page, source, style, width);
    const original = await page.evaluate(() => window.__paletteOriginal);
    const section = editor.locator('.section').filter({ has: page.getByRole('heading', { name: style === 'bands' ? 'Segments' : 'Gradient Stops', exact: true }) });
    await expect(section).toHaveScreenshot(`feature-${style}-${width}.png`);
    expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const segment = style === 'bands';
    const draft = editor.locator(segment ? '#segment-draft-from' : '#gradient-draft-pos');
    await draft.fill(segment ? '40%' : '50');
    if (segment) await editor.locator('#segment-draft-to').fill('60%');
    await draft.focus();
    const nodeStable = await draft.evaluate(node => { window.__paletteDraftNode = node; return true; });
    expect(nodeStable).toBe(true);
    await editor.evaluate(el => { el.hass = { states: {} }; el.context = { entity_id: 'sensor.changed' }; el.setConfig(el._config); });
    await expect(draft).toHaveValue(segment ? '40%' : '50');
    expect(await draft.evaluate(node => node === window.__paletteDraftNode)).toBe(true);
    await expect(draft).toBeFocused();
    await expect(section.locator('.gradient-preview-track')).toHaveAttribute('style', /linear-gradient/);
    const add = editor.locator(`button[data-action="${segment ? 'add-segment' : 'add-gradient-stop'}"]`);
    await add.click();
    await expect(draft).toBeFocused();
    const key = segment ? 'segments' : 'gradient_stops';
    expect((await saved(editor)).bar[key].slice(0, 2)).toEqual(original.bar[key]);
    expect((await saved(editor)).bar[key]).toHaveLength(3);
    const position = editor.locator(`input[data-kind="${segment ? 'segment-from' : 'gradient-pos'}"]`).first();
    const initial = (await saved(editor)).bar[key][0];
    const before = await page.evaluate(() => window.__paletteEvents.length);
    // Native number inputs cannot retain arbitrary text; use an out-of-range numeric draft there.
    await position.fill(segment ? '-' : '101');
    await position.press('Enter');
    expect((await saved(editor)).bar[key][0]).toEqual(initial);
    expect(await page.evaluate(() => window.__paletteEvents.length)).toBe(before);
    await expect(position).toBeFocused();
    await position.fill(segment ? '65%' : '90');
    await position.press('Enter');
    expect((await saved(editor)).bar[key][0][segment ? 'from' : 'pos']).toBe(segment ? '65%' : 90);
    const color = editor.locator(segment ? 'input[data-kind="segment-color"]' : 'input[data-kind="gradient-color-text-fallback"]').first();
    if (segment) await color.evaluate(el => { el.value = '#334455'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    else { await color.fill('var(--accent-color)'); await expect(color).toBeFocused(); }
    const edited = (await saved(editor)).bar[key][0];
    expect(edited.metadata).toEqual(initial.metadata);
    if (!segment) expect(edited.color).toBe('var(--accent-color)');
    await editor.locator(`button[data-action="${segment ? 'remove-segment' : 'remove-gradient-stop'}"]`).first().click();
    const config = await saved(editor);
    expect(config.bar[key][0]).toEqual(original.bar[key][1]);
    expect(config.bar[key]).toHaveLength(2);
    expect(config.bar[segment ? 'gradient_stops' : 'segments']).toEqual(original.bar[segment ? 'gradient_stops' : 'segments']);
    expect(config.bar.extra).toEqual(original.bar.extra); expect(config.target).toEqual(original.target);
    await editor.locator('#bar-fill-style').selectOption(segment ? 'gradient' : 'bands');
    await expect(editor.locator(segment ? '#gradient-draft-pos' : '#segment-draft-from')).toBeVisible();
    expect((await saved(editor)).bar[key]).toEqual(config.bar[key]);
  });
}
