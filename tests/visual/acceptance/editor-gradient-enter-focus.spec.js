const { test, expect } = require('@playwright/test');
const { d, mountPaletteEditor, paletteSelector, focusAndMeasure, expectFocusAndViewport } = require('./palette-keyboard-focus-driver.cjs');

for (const source of ['src', 'dist']) for (const scope of ['root', 'entity']) {
  test(`Card/Entity Gradient Stop position Enter preserves focus and viewport (${source}, ${scope})`, async ({ page }) => {
    const editor = await mountPaletteEditor(page, source, scope);
    const control = editor.locator(paletteSelector(scope, 'pos')).nth(1);
    const eventsBefore = await d.count(page);
    await editor.locator('#title').evaluate(element => { window.__unaffectedControl = element; });
    const viewportBefore = await focusAndMeasure(page, control);

    await control.fill('60');
    await page.keyboard.press('Enter');

    await expect.poll(() => d.count(page)).toBe(eventsBefore + 1);
    await expectFocusAndViewport(editor, page, control, viewportBefore);
    const path = scope === 'entity' ? 'entities.0.bar.gradient_stops' : 'bar.gradient_stops';
    expect(d.read(await d.saved(page), path)).toEqual([
      { pos: 0, color: '#112233' },
      { pos: 60, color: '#445566' },
    ]);
  });

  test(`Card/Entity reordered Gradient Stop Enter restores focus to the moved stop (${source}, ${scope})`, async ({ page }) => {
    const editor = await mountPaletteEditor(page, source, scope, 'Gradient Stops', [
      { pos: 20, color: '#112233' },
      { pos: 80, color: '#445566' },
    ]);
    const control = editor.locator(paletteSelector(scope, 'pos')).first();
    const eventsBefore = await d.count(page);
    const viewportBefore = await focusAndMeasure(page, control);

    await control.fill('90');
    await page.keyboard.press('Enter');

    await expect.poll(() => d.count(page)).toBe(eventsBefore + 1);
    const moved = editor.locator(paletteSelector(scope, 'pos')).nth(1);
    await expect(moved).toHaveValue('90');
    await expect(moved).toBeFocused();
    expect(await page.evaluate(() => ({ windowY: window.scrollY, mountTop: document.querySelector('#mount').scrollTop }))).toEqual(viewportBefore);
    const path = scope === 'entity' ? 'entities.0.bar.gradient_stops' : 'bar.gradient_stops';
    expect(d.read(await d.saved(page), path)).toEqual([
      { pos: 80, color: '#445566' },
      { pos: 90, color: '#112233' },
    ]);
  });
}
