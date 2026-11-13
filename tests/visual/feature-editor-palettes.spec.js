const { expandFeatureGroups } = require('./feature-editor-test-utils.cjs');
const { test, expect } = require('@playwright/test');
async function mount(page, source, style, width) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ style, width }) => {
    await customElements.whenDefined('sensor-bar-card-plus-feature');
    const editor = await customElements.get('sensor-bar-card-plus-feature').getConfigElement();
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
    const section = editor.locator(`.card-subgroup[data-group="${style === 'bands' ? 'segments' : 'gradient-stops'}"]`);
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
    if (segment) {
      await expect(section.locator('.segment-preview-track')).toHaveAttribute('aria-label', 'Authored Segment coverage preview');
      await expect(section.locator('[data-preview-kind="undefined"]')).toHaveCount(2);
    } else {
      await expect(section.locator('.gradient-preview-track')).toHaveAttribute('style', /linear-gradient/);
    }
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

test('unchanged refresh preserves authored focus and selection; external replacement cancels the palette session', async ({ page }) => {
  const editor = await mount(page, 'src', 'bands', 360);
  const position = editor.locator('input[data-kind="segment-from"]').first();
  await position.fill('65%');
  await position.evaluate(node => node.setSelectionRange(1, 3));
  await position.evaluate(node => { window.__activePaletteControl = node; });
  const eventsBeforeRefresh = await page.evaluate(() => window.__paletteEvents.length);

  await editor.evaluate(element => {
    element.hass = { states: { 'sensor.unrelated': { state: '1' } } };
    element.context = { entity_id: 'sensor.unrelated' };
    element.setConfig(element._config);
  });
  await expect(position).toBeFocused();
  expect(await position.evaluate(node => node === window.__activePaletteControl)).toBe(true);
  expect(await position.evaluate(node => [node.selectionStart, node.selectionEnd])).toEqual([1, 3]);
  expect(await page.evaluate(() => window.__paletteEvents.length)).toBe(eventsBeforeRefresh);

  const replacement = await saved(editor);
  replacement.bar.segments.splice(1, 0, { from: '30%', to: '50%', color: '#abcdef' });
  await editor.evaluate((element, config) => element.setConfig(config), replacement);
  const rebuiltPosition = editor.locator('input[data-kind="segment-from"]').first();
  await expect(rebuiltPosition).toHaveValue('60%');
  expect(await rebuiltPosition.evaluate(node => node === window.__activePaletteControl)).toBe(false);
  expect(await page.evaluate(() => window.__paletteEvents.length)).toBe(eventsBeforeRefresh);

  await editor.evaluate(element => {
    const stale = window.__activePaletteControl;
    stale.value = '99%';
    for (const type of ['keydown', 'change', 'blur']) {
      element._handleField({ type, key: 'Enter', target: stale, preventDefault() {} });
    }
  });
  expect((await saved(editor)).bar.segments).toEqual(replacement.bar.segments);
  expect(await page.evaluate(() => window.__paletteEvents.length)).toBe(eventsBeforeRefresh);
});
