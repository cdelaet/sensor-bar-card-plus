const d = require('./editor-driver.cjs');

async function mountPaletteEditor(page, source, scope, section = 'Gradient Stops') {
  const config = d.seed('standalone');
  const stops = [{ pos: 0, color: '#112233' }, { pos: 100, color: '#445566' }];
  config.bar.fill_style = 'gradient';
  config.bar.gradient_stops = structuredClone(stops);
  config.entities[0].bar.fill_style = 'gradient';
  config.entities[0].bar.gradient_stops = structuredClone(stops);
  const editor = await d.mount(page, 'standalone', config, { source, nested: true, tall: true });
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '900px';
    document.body.insertBefore(spacer, document.querySelector('#mount'));
    window.scrollTo(0, 180);
  });
  await d.openSection(editor, { section, scope });
  return editor;
}

function paletteSelector(scope, field) {
  const entity = scope === 'entity';
  const kind = entity ? `entity-gradient-${field}` : `gradient-${field}`;
  return `input[data-kind="${kind}"]${entity ? '[data-index="0"]' : ''}`;
}

async function focusAndMeasure(page, control) {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate(element => {
    window.__keyboardFocusTarget = element;
    element.focus({ preventScroll: true });
  });
  return page.evaluate(() => ({ windowY: window.scrollY, mountTop: document.querySelector('#mount').scrollTop }));
}

async function expectFocusAndViewport(editor, page, control, before) {
  await control.evaluate(element => {
    if (!element.isConnected || element !== window.__keyboardFocusTarget
      || element.getRootNode().activeElement !== element) throw new Error('keyboard focus target was replaced or blurred');
  });
  expect(await page.evaluate(() => ({ windowY: window.scrollY, mountTop: document.querySelector('#mount').scrollTop }))).toEqual(before);
  await editor.locator('#title').evaluate(element => {
    if (element !== window.__unaffectedControl || !element.isConnected) throw new Error('unaffected editor control was replaced');
  });
}

const { expect } = require('@playwright/test');

module.exports = { d, mountPaletteEditor, paletteSelector, focusAndMeasure, expectFocusAndViewport };
