const { test, expect } = require('@playwright/test');
const { d, mountPaletteEditor, focusAndMeasure, expectFocusAndViewport } = require('./palette-keyboard-focus-driver.cjs');

for (const source of ['src', 'dist']) for (const scope of ['root', 'entity']) for (const kind of ['segment', 'gradient']) {
  test(`Card/Entity ${kind} draft Escape preserves focus and viewport (${source}, ${scope})`, async ({ page }) => {
    const editor = await mountPaletteEditor(page, source, scope, kind === 'segment' ? 'Segments' : 'Gradient Stops');
    const prefix = scope === 'entity' ? 'entity-0-' : '';
    const field = kind === 'segment' ? 'segment-draft-from' : 'gradient-draft-pos';
    const control = editor.locator(`#${prefix}${field}`);
    const initialValue = await control.inputValue();
    const savedBefore = await d.saved(page);
    const eventsBefore = await d.count(page);
    await editor.locator('#title').evaluate(element => { window.__unaffectedControl = element; });
    const viewportBefore = await focusAndMeasure(page, control);

    await control.fill(kind === 'segment' ? '25%' : '25');
    await page.keyboard.press('Escape');

    await expect(control).toHaveValue(initialValue);
    await expectFocusAndViewport(editor, page, control, viewportBefore);
    expect(await d.saved(page)).toEqual(savedBefore);
    expect(await d.count(page)).toBe(eventsBefore);
  });
}
