const { test, expect } = require('@playwright/test');
const d = require('./editor-driver.cjs');

for (const source of ['src', 'dist']) test(`a second pointer cancellation cannot finish Segment Add (${source})`, async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'The two-pointer trace uses Chromium CDP touch input');
  const context = await browser.newContext({ hasTouch: true, baseURL: 'http://127.0.0.1:4173', viewport: { width: 900, height: 720 } });
  try {
    const page = await context.newPage(), config = d.seed('standalone');
    config.bar.fill_style = 'bands'; config.bar.color = 'red';
    config.bar.segments = [{ from: 10, to: 15, color: '#112233' }, { from: 40, to: 60, color: '#445566' }];
    const editor = await d.mount(page, 'standalone', config, { source });
    await d.openSection(editor, { section: 'Segments' });
    const palette = editor.locator('#card-group-segments').locator('xpath=..');
    const from = editor.locator('#segment-draft-from'), to = editor.locator('#segment-draft-to');
    const color = editor.locator('#segment-draft-color-text-fallback');
    const add = palette.locator('button[data-action="add-segment"]');
    await from.fill('20'); await to.fill('40'); await color.fill('#aabbcc');
    await from.focus(); await add.scrollIntoViewIfNeeded();
    await add.evaluate(button => { window.__pendingAdd = button; window.__pointerTrace = []; });
    await editor.evaluate(el => {
      const trace = (type, event) => window.__pointerTrace.push({
        type, pointerId: event?.pointerId, pointerType: event?.pointerType,
      });
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click']) {
        document.addEventListener(type, event => trace(type, event), true);
      }
      el.shadowRoot.addEventListener('focusout', event => trace('focusout', event), true);
      const sync = el._syncPaintEditors.bind(el);
      el.__pointerSyncCount = 0;
      el._syncPaintEditors = (...args) => { el.__pointerSyncCount += 1; trace('sync'); return sync(...args); };
    });

    const beforeEvents = await d.count(page), box = await add.boundingBox(), beforeY = box.y;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await editor.evaluate(el => el.__pointerSyncCount)).toBe(0);

    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
      { x: 12, y: 12, id: 8, radiusX: 2, radiusY: 2, force: 1 },
    ] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    const afterSecondaryCancel = await editor.evaluate(el => ({
      syncs: el.__pointerSyncCount,
      sameButton: el.shadowRoot.querySelector('button[data-action="add-segment"]') === window.__pendingAdd,
      buttonY: el.shadowRoot.querySelector('button[data-action="add-segment"]').getBoundingClientRect().y,
      trace: window.__pointerTrace,
    }));
    expect(afterSecondaryCancel.syncs).toBe(0);
    expect(afterSecondaryCancel.sameButton).toBe(true);
    expect(afterSecondaryCancel.buttonY).toBe(beforeY);

    await page.mouse.up();
    await expect.poll(() => d.count(page)).toBe(beforeEvents + 1);
    expect(d.read(await d.saved(page), 'bar.segments')).toEqual([
      { from: 10, to: 15, color: '#112233' },
      { from: 20, to: 40, color: '#aabbcc' },
      { from: 40, to: 60, color: '#445566' },
    ]);
    const final = await editor.evaluate(el => ({ syncs: el.__pointerSyncCount, trace: window.__pointerTrace }));
    const cancel = final.trace.findIndex(event => event.type === 'pointercancel');
    const up = final.trace.findIndex(event => event.type === 'pointerup');
    const click = final.trace.findIndex(event => event.type === 'click');
    const firstSync = final.trace.findIndex(event => event.type === 'sync');
    expect(cancel).toBeGreaterThan(-1);
    expect(up).toBeGreaterThan(cancel);
    expect(click).toBeGreaterThan(up);
    expect(firstSync).toBeGreaterThan(click);
    expect(final.syncs).toBeGreaterThan(0);
    await cdp.detach();
  } finally { await context.close(); }
});

for (const source of ['src', 'dist']) test(`a no-click touch transaction cannot capture later keyboard focusout (${source})`, async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'The no-click multi-touch trace uses Chromium CDP input');
  const context = await browser.newContext({ hasTouch: true, baseURL: 'http://127.0.0.1:4173', viewport: { width: 900, height: 720 } });
  try {
    const page = await context.newPage(), config = d.seed('standalone');
    config.bar.paint = { fill_style: 'solid', color: 'var(--primary-color)', solid_fill: false };
    const editor = await d.mount(page, 'standalone', config, { source });
    await d.openSection(editor, { section: 'Bar Appearance', scope: 'root' });
    const color = editor.locator('#bar-color-text-fallback');
    const checkbox = editor.locator('#bar-solid-fill');
    await color.focus();
    const box = await checkbox.boundingBox();
    await editor.evaluate(el => {
      window.__pointerTrace = [];
      const log = event => window.__pointerTrace.push({
        type: event.type, target: event.target?.id || event.target?.tagName,
        pointerId: event.pointerId, pointerType: event.pointerType,
      });
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click']) document.addEventListener(type, log, true);
      el.shadowRoot.addEventListener('focusout', log, true);
      const sync = el._syncPaintEditors.bind(el);
      el.__pointerSyncCount = 0;
      el._syncPaintEditors = (...args) => { el.__pointerSyncCount += 1; log({ type: 'sync' }); return sync(...args); };
    });

    const cdp = await context.newCDPSession(page);
    const first = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1, radiusX: 3, radiusY: 3, force: 1 };
    const second = { x: 12, y: 12, id: 2, radiusX: 3, radiusY: 3, force: 1 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [first] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const afterTouch = await editor.evaluate(el => ({ syncs: el.__pointerSyncCount, trace: window.__pointerTrace }));
    expect(afterTouch.trace.some(event => event.type === 'click')).toBe(false);
    expect(afterTouch.trace.some(event => event.type === 'pointercancel')).toBe(false);
    expect(afterTouch.syncs).toBe(0);

    await page.keyboard.press('Tab');
    await expect(editor.locator('#bar-opacity')).toBeFocused();
    await expect.poll(() => editor.evaluate(el => el.__pointerSyncCount)).toBe(1);
    const afterKeyboard = await editor.evaluate(el => ({ syncs: el.__pointerSyncCount, trace: window.__pointerTrace }));
    expect(afterKeyboard.syncs).toBe(1);
    expect(afterKeyboard.trace.findIndex(event => event.type === 'focusout'))
      .toBeLessThan(afterKeyboard.trace.findIndex(event => event.type === 'sync'));
    await cdp.detach();
  } finally { await context.close(); }
});
