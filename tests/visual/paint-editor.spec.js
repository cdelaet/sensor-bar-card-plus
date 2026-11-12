const { test, expect } = require('@playwright/test');

async function mount(page, host, source, width = 360) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, width }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const config = { extra: { keep: true }, bar: { fill_style: 'bands', color: '#123456', solid_fill: false,
      segments: [{ from: '0%', to: '100%', color: '#abcdef' }],
      gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }], future: true } };
    if (host === 'Card') config.entities = ['sensor.power'];
    else config.type = 'custom:sensor-bar-card-plus-feature';
    window.__paintOriginal = structuredClone(config); window.__paintEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__paintEvents.push(structuredClone(event.detail.config)); editor.setConfig(event.detail.config);
    });
    editor.setConfig(config);
    editor.hass = { states: {} };
    if (host !== 'Card') editor.context = { entity_id: 'sensor.power' };
    document.querySelector('#mount').style.width = `${width}px`;
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host, width });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}
async function mountWithPaintPresets(page, host, source, presets, config = { bar: { paint: {} } }, width = 300) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host, presets, config, width }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    let dashboard = { sbcp_fragments: { paint_presets: presets } };
    let listener;
    const connection = {
      sendMessagePromise: async () => structuredClone(dashboard),
      subscribeEvents: async callback => { listener = callback; return async () => { listener = null; }; },
      addEventListener() {}, removeEventListener() {},
    };
    window.__paintEvents = [];
    window.__updatePaintRegistry = async next => {
      dashboard = { sbcp_fragments: { paint_presets: next } };
      listener?.({ event_type: 'lovelace_updated' });
    };
    editor.addEventListener('config-changed', event => {
      window.__paintEvents.push(structuredClone(event.detail.config));
      editor.setConfig(event.detail.config);
    });
    editor.setConfig(structuredClone(config));
    editor.hass = { states: {}, connection };
    if (host !== 'Card') editor.context = { entity_id: 'sensor.power' };
    document.querySelector('#mount').style.width = `${width}px`;
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host, presets, config, width });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}
const saved = editor => editor.evaluate(el => structuredClone(el._draftConfig ?? el._config));

for (const source of ['src', 'dist']) test(`Feature controls synchronize from effective preset paint (${source})`, async ({ page }) => {
  const editor = await mountWithPaintPresets(page, 'Feature', source, {
    vivid: { fill_style: 'gradient', color: 'red', solid_fill: true },
  }, { bar: { paint: { preset: 'vivid' } }, type: 'custom:sensor-bar-card-plus-feature' });
  await editor.locator('#card-paint-editor summary').click();
  await expect(editor.locator('#bar-fill-style')).toHaveValue('gradient');
  await expect(editor.locator('#bar-color-text-fallback')).toHaveValue('red');
  await expect(editor.locator('#bar-solid-fill')).toBeChecked();
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} reconciles preset palette rows without replacing unchanged controls (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night', opacity: 37 } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [{ from: '10%', to: '100%', color: '#aa0000' }],
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    await editor.locator('#card-group-gradient-stops').click();
    const segmentRows = editor.locator('input[data-kind="segment-from"]');
    const gradientRows = editor.locator('input[data-kind="gradient-pos"]');
    await expect(segmentRows).toHaveCount(1);
    await expect(segmentRows.first()).toHaveValue('10%');
    await expect(gradientRows).toHaveCount(2);
    await editor.evaluate(el => {
      window.__stableSegmentControl = el.shadowRoot.querySelector('input[data-kind="segment-from"]');
      window.__stablePaintControl = el.shadowRoot.querySelector('#bar-opacity');
    });
    const eventCount = await page.evaluate(() => window.__paintEvents.length);

    await page.evaluate(() => window.__updatePaintRegistry({ night: {
      fill_style: 'bands',
      segments: [{ from: '10%', to: '55%', color: '#aa0000' }, { from: '55%', to: '100%', color: '#00aa00' }],
      gradient_stops: [{ pos: 0, color: '#000000' }],
    } }));
    await expect(segmentRows).toHaveCount(2);
    await expect(segmentRows.nth(0)).toHaveValue('10%');
    await expect(segmentRows.nth(1)).toHaveValue('55%');
    await expect(gradientRows).toHaveCount(1);
    expect(await editor.evaluate(el => el.shadowRoot.querySelector('input[data-kind="segment-from"]') === window.__stableSegmentControl)).toBe(true);
    expect(await editor.evaluate(el => el.shadowRoot.querySelector('#bar-opacity') === window.__stablePaintControl)).toBe(true);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);

    await page.evaluate(() => window.__updatePaintRegistry({ night: {
      fill_style: 'bands', segments: [{ from: '20%', to: '100%', color: '#0000aa' }], gradient_stops: [],
    } }));
    await expect(segmentRows).toHaveCount(1);
    await expect(segmentRows.first()).toHaveValue('20%');
    await expect(gradientRows).toHaveCount(0);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [], gradient_stops: [] } }));
    await expect(segmentRows).toHaveCount(0);
    await expect(gradientRows).toHaveCount(0);
    await expect(editor.locator('#card-group-segments-summary')).not.toContainText('1 segment');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} keeps gradient drafts isolated after editing and reinserting original content (${source})`, async ({ page }) => {
    const config = {
      bar: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#aa0000' }, { pos: 40, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
      ] },
      ...(host === 'Card' ? { entities: ['sensor.power'] } : { type: 'custom:sensor-bar-card-plus-feature' }),
    };
    const editor = await mount(page, host, source);
    await editor.evaluate((el, next) => el.setConfig(next), config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();

    const positions = editor.locator('input[data-kind="gradient-pos"]');
    await positions.nth(1).fill('45');
    await positions.nth(1).press('Enter');
    await expect.poll(() => saved(editor)).toMatchObject({ bar: { gradient_stops: [
      { pos: 0, color: '#aa0000' }, { pos: 45, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
    ] } });
    await editor.locator('#gradient-draft-pos').fill('40');
    await editor.locator('#gradient-draft-color').fill('#00aa00');
    await editor.locator('button[data-action="add-gradient-stop"]').click();
    await expect(positions).toHaveCount(4);

    await editor.evaluate(el => {
      const controls = [...el.shadowRoot.querySelectorAll('input[data-kind="gradient-pos"]')];
      window.__insertedGreenStop = controls.find(node => node.value === '40'
        && node.closest('.gradient-stop-row').querySelector('input[data-kind="gradient-color"]').value === '#00aa00');
      window.__editedGreenStop = controls.find(node => node.value === '45'
        && node.closest('.gradient-stop-row').querySelector('input[data-kind="gradient-color"]').value === '#00aa00');
    });
    const getAuthoredIds = () => positions.evaluateAll(controls => controls.map(node => node.closest('.gradient-stop-row').dataset.paletteId));
    const idsBeforeRefresh = await getAuthoredIds();
    expect(new Set(idsBeforeRefresh).size).toBe(4);
    await editor.evaluate(() => {
      window.__insertedGreenStop.focus();
      window.__insertedGreenStop.value = '42';
      window.__insertedGreenStop.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const eventsBeforeRefresh = await page.evaluate(() => window.__paintEvents.length);
    const configBeforeRefresh = await saved(editor);
    await editor.evaluate(el => { el.hass = { states: { 'sensor.power': { state: '1', attributes: {} } } }; });

    expect(await editor.evaluate(() => window.__insertedGreenStop.value)).toBe('42');
    expect(await editor.evaluate(() => window.__editedGreenStop.value)).toBe('45');
    expect(await editor.evaluate(() => window.__insertedGreenStop.closest('.gradient-stop-row')
      .querySelector('input[data-kind="gradient-color"]').value)).toBe('#00aa00');
    const idsAfterRefresh = await getAuthoredIds();
    expect(new Set(idsAfterRefresh).size).toBe(4);
    expect(idsAfterRefresh).toEqual(idsBeforeRefresh);
    expect(await saved(editor)).toEqual(configBeforeRefresh);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventsBeforeRefresh);
  });

  test(`${host} keeps duplicate-start segment drafts unique through palette structure changes (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [
        { from: '10%', to: '30%', color: '#aa0000' },
        { from: '10%', to: '60%', color: '#00aa00' },
        { from: '10%', to: '90%', color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    await editor.evaluate(el => {
      const row = [...el.shadowRoot.querySelectorAll('.segment-editor-row')]
        .find(item => item.querySelector('input[data-kind="segment-color"]')?.value === '#00aa00');
      const input = row.querySelector('input[data-kind="segment-to"]');
      window.__sameStartDraftControl = input;
      input.focus();
      input.value = '65%';
      input.setSelectionRange(2, 4);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const getRows = () => editor.locator('.segment-editor-row');
    const getIds = () => getRows().evaluateAll(rows => rows.map(row => row.dataset.paletteId));
    const assertUniqueIds = async count => {
      const ids = await getIds();
      expect(ids).toHaveLength(count);
      expect(new Set(ids).size).toBe(count);
    };
    await assertUniqueIds(3);

    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '10%', to: '90%', color: '#0000aa' },
      { from: '10%', to: '75%', color: '#ffff00' },
      { from: '10%', to: '60%', color: '#00aa00' },
      { from: '10%', to: '30%', color: '#aa0000' },
    ] } }));
    await assertUniqueIds(4);
    const editedEnd = () => getRows().locator('input[data-kind="segment-to"]').evaluateAll(nodes =>
      nodes.find(node => node === window.__sameStartDraftControl)?.value);
    await expect.poll(editedEnd).toBe('65%');
    expect(await editor.evaluate(el => window.__sameStartDraftControl.closest('.segment-editor-row')
      .querySelector('input[data-kind="segment-color"]').value)).toBe('#00aa00');

    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '10%', to: '60%', color: '#00aa00' },
      { from: '10%', to: '90%', color: '#0000aa' },
      { from: '10%', to: '75%', color: '#ffff00' },
    ] } }));
    await assertUniqueIds(3);
    await expect.poll(editedEnd).toBe('65%');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
  });

  for (const focusedIndex of [0, 1, 2]) {
    test(`${host} invalidates the ${['first', 'middle', 'final'][focusedIndex]} duplicate segment edit (${source})`, async ({ page }) => {
      const config = { bar: { paint: { preset: 'night' } } };
      if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
      const duplicate = { from: '10%', to: '30%', color: '#aa0000' };
      const editor = await mountWithPaintPresets(page, host, source, {
        night: { fill_style: 'bands', segments: [duplicate, duplicate, duplicate,
          { from: '70%', to: '100%', color: '#0000aa' }] },
      }, config);
      await editor.locator('#card-paint-editor summary').click();
      await editor.locator('#card-group-segments').click();
      const ends = editor.locator('input[data-kind="segment-to"]');
      const unrelated = ends.nth(3);
      const unrelatedInput = await unrelated.elementHandle();
      await unrelated.evaluate(node => { node.value = '95%'; node.dispatchEvent(new Event('input', { bubbles: true })); });
      const staleInput = await ends.nth(focusedIndex).elementHandle();
      await staleInput.evaluate(node => {
        node.focus();
        node.value = '25%';
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.evaluate(duplicateRow => window.__updatePaintRegistry({ night: {
        fill_style: 'bands', segments: [duplicateRow, duplicateRow,
          { from: '70%', to: '100%', color: '#0000aa' }],
      } }), duplicate);
      await expect(ends).toHaveCount(3);
      expect(await staleInput.evaluate(node => node.isConnected)).toBe(false);
      expect(await ends.evaluateAll(nodes => nodes.map(node => node.value))).toEqual(['30%', '30%', '95%']);
      expect(await unrelatedInput.evaluate(node => node.isConnected)).toBe(true);
      const ids = await editor.locator('.segment-editor-row').evaluateAll(rows => rows.map(row => row.dataset.paletteId));
      expect(new Set(ids).size).toBe(3);

      await editor.evaluate((el, node) => {
        const staleEvent = { target: node, key: 'Enter', preventDefault() {}, stopPropagation() {} };
        if (el._handleKeydown) el._handleKeydown(staleEvent);
        else el._handleField({ ...staleEvent, type: 'keydown' });
        if (el._handleChange) el._handleChange({ target: node });
        else el._handleField({ type: 'change', target: node });
        node.blur();
      }, staleInput);
      expect(await saved(editor)).toEqual(config);
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
    });
  }

  for (const focusedIndex of [0, 1, 2]) {
    test(`${host} invalidates the ${['first', 'middle', 'final'][focusedIndex]} duplicate gradient stop edit (${source})`, async ({ page }) => {
      const config = { bar: { paint: { preset: 'night' } } };
      if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
      const duplicate = { pos: 40, color: '#00aa00' };
      const editor = await mountWithPaintPresets(page, host, source, {
        night: { fill_style: 'gradient', gradient_stops: [duplicate, duplicate, duplicate,
          { pos: 100, color: '#0000aa' }] },
      }, config);
      await editor.locator('#card-paint-editor summary').click();
      await editor.locator('#card-group-gradient-stops').click();
      const positions = editor.locator('input[data-kind="gradient-pos"]');
      const unrelated = positions.nth(3);
      const unrelatedInput = await unrelated.elementHandle();
      await unrelated.evaluate(node => { node.value = '95'; node.dispatchEvent(new Event('input', { bubbles: true })); });
      const staleInput = await positions.nth(focusedIndex).elementHandle();
      await staleInput.evaluate(node => {
        node.focus();
        node.value = '42';
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.evaluate(duplicateRow => window.__updatePaintRegistry({ night: {
        fill_style: 'gradient', gradient_stops: [duplicateRow, duplicateRow, { pos: 100, color: '#0000aa' }],
      } }), duplicate);
      await expect(positions).toHaveCount(3);
      expect(await staleInput.evaluate(node => node.isConnected)).toBe(false);
      expect(await positions.evaluateAll(nodes => nodes.map(node => node.value))).toEqual(['40', '40', '95']);
      expect(await unrelatedInput.evaluate(node => node.isConnected)).toBe(true);
      const ids = await positions.evaluateAll(nodes => nodes.map(node => node.closest('.gradient-stop-row').dataset.paletteId));
      expect(new Set(ids).size).toBe(3);

      await editor.evaluate((el, node) => {
        const staleEvent = { target: node, key: 'Enter', preventDefault() {}, stopPropagation() {} };
        if (el._handleKeydown) el._handleKeydown(staleEvent);
        else el._handleField({ ...staleEvent, type: 'keydown' });
        if (el._handleChange) el._handleChange({ target: node });
        else el._handleField({ type: 'change', target: node });
        node.blur();
      }, staleInput);
      expect(await saved(editor)).toEqual(config);
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
    });
  }

  test(`${host} preserves a focused segment draft while preset rows change (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [{ from: '10%', to: '100%', color: '#aa0000' }] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const start = editor.locator('input[data-kind="segment-from"]').first();
    await start.focus();
    await start.evaluate(node => { node.value = '37%'; node.setSelectionRange(2, 3); node.dispatchEvent(new Event('input', { bubbles: true })); });
    await editor.evaluate(el => { window.__focusedSegmentStart = el.shadowRoot.querySelector('input[data-kind="segment-from"]'); });
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '10%', to: '55%', color: '#aa0000' }, { from: '55%', to: '100%', color: '#00aa00' },
    ] } }));
    await expect(editor.locator('input[data-kind="segment-from"]')).toHaveCount(2);
    await expect(start).toBeFocused();
    await expect(start).toHaveValue('37%');
    expect(await start.evaluate(node => [node.selectionStart, node.selectionEnd])).toEqual([2, 3]);
    expect(await editor.evaluate(el => el.shadowRoot.querySelector('input[data-kind="segment-from"]') === window.__focusedSegmentStart)).toBe(true);
    await start.evaluate(node => { node.dispatchEvent(new Event('change', { bubbles: true })); node.blur(); });
    await expect.poll(async () => (await saved(editor)).bar.paint.segments?.[0]?.from).toBe('37%');
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} keeps duplicate-start segment drafts with the uniquely matched row (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [
        { from: '10%', to: '30%', color: '#aa0000' },
        { from: '10%', to: '60%', color: '#00aa00' },
        { from: '70%', to: '100%', color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const ends = editor.locator('input[data-kind="segment-to"]');
    await ends.nth(0).evaluate(node => { node.focus(); node.value = '25%'; node.setSelectionRange(2, 3); node.dispatchEvent(new Event('input', { bubbles: true })); });
    await editor.evaluate(el => { window.__duplicateDraftEnd = el.shadowRoot.querySelectorAll('input[data-kind="segment-to"]')[0]; });
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '70%', to: '100%', color: '#0000aa' },
      { from: '10%', to: '60%', color: '#00aa00' },
      { from: '10%', to: '30%', color: '#aa0000' },
    ] } }));
    const ownedIndex = await ends.evaluateAll(nodes => nodes.findIndex(node => node === window.__duplicateDraftEnd));
    const ownedEnd = ends.nth(ownedIndex);
    await expect(ownedEnd).toHaveValue('25%');
    expect(ownedIndex).toBeGreaterThanOrEqual(0);
    expect(await ownedEnd.evaluate(node => [node.selectionStart, node.selectionEnd])).toEqual([2, 3]);
    expect(await saved(editor)).toEqual(config);
  });

  test(`${host} rejects a gradient event after switching paint source (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#aa0000' }, { pos: 60, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();
    const position = editor.locator('input[data-kind="gradient-pos"]').nth(1);
    await position.evaluate(node => { node.focus(); node.value = '45'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    const oldControl = await position.elementHandle();
    const mode = editor.locator('#bar-paint-mode');
    await mode.evaluate(node => { node.value = 'manual'; node.dispatchEvent(new Event('change', { bubbles: true })); });
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    expect(await saved(editor)).not.toHaveProperty('bar.paint.gradient_stops');
    await editor.evaluate((el, node) => el._handleChange
      ? el._handleChange({ target: node }) : el._handleField({ type: 'change', target: node }), oldControl);
    expect(await saved(editor)).not.toHaveProperty('bar.paint.gradient_stops');
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  });

  test(`${host} rejects a pending palette event after external config replacement (${source})`, async ({ page }) => {
    const config = { bar: { fill_style: 'gradient', gradient_stops: [
      { pos: 0, color: '#aa0000' }, { pos: 60, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
    ] } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mount(page, host, source);
    await editor.evaluate((el, next) => el.setConfig(next), config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();
    const oldControl = await editor.locator('input[data-kind="gradient-pos"]').nth(1).elementHandle();
    await oldControl.evaluate(node => { node.focus(); node.value = '45'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    const replacement = host === 'Card' ? { bar: { fill_style: 'solid', color: '#123456' } }
      : { type: 'custom:sensor-bar-card-plus-feature', bar: { fill_style: 'solid', color: '#123456' } };
    const eventsBefore = await page.evaluate(() => window.__paintEvents.length);
    await editor.evaluate((el, next) => el.setConfig(next), replacement);
    await expect.poll(() => saved(editor)).toEqual(replacement);
    await editor.evaluate((el, node) => el._handleChange
      ? el._handleChange({ target: node }) : el._handleField({ type: 'change', target: node }), oldControl);
    expect(await saved(editor)).toEqual(replacement);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventsBefore);
  });

  test(`${host} rejects commits from a removed focused preset gradient stop (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#aa0000' }, { pos: 45, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();
    const positions = editor.locator('input[data-kind="gradient-pos"]');
    await expect(positions).toHaveCount(3);
    const removed = positions.nth(1);
    await removed.fill('55');
    const removedHandle = await removed.elementHandle();
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'gradient', gradient_stops: [
      { pos: 0, color: '#aa0000' }, { pos: 100, color: '#0000aa' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.gradient_stops.length)).toBe(2);
    await expect(positions).toHaveCount(2);
    expect(await removedHandle.evaluate(node => node.isConnected)).toBe(false);
    await editor.evaluate((el, node) => el._handleChange
      ? el._handleChange({ target: node }) : el._handleField({ type: 'change', target: node }), removedHandle);
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  });

  test(`${host} keeps a gradient draft and color node with its stop through insertion, removal, and reorder (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#aa0000' }, { pos: 60, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();
    const positions = editor.locator('input[data-kind="gradient-pos"]');
    const originalPosition = positions.nth(1);
    const originalColor = editor.locator('input[data-kind="gradient-color"]').nth(1);
    await editor.evaluate(el => {
      window.__originPosition = el.shadowRoot.querySelectorAll('input[data-kind="gradient-pos"]')[1];
      window.__originColor = el.shadowRoot.querySelectorAll('input[data-kind="gradient-color"]')[1];
    });
    await originalPosition.evaluate(node => { node.focus(); node.value = '45'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'gradient', gradient_stops: [
      { pos: 100, color: '#0000aa' }, { pos: 30, color: '#ffff00' },
      { pos: 60, color: '#00aa00' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.gradient_stops[0].pos)).toBe(100);
    await expect(positions).toHaveCount(3);
    const originIndex = await positions.evaluateAll(nodes => nodes.findIndex(node => node === window.__originPosition));
    expect(originIndex).toBeGreaterThanOrEqual(0);
    const originRow = positions.nth(originIndex);
    await expect(originRow).toHaveValue('45');
    expect(await originRow.evaluate(node => node === window.__originPosition)).toBe(true);
    expect(await originRow.evaluate(node => node.closest('.gradient-stop-row').querySelector('input[data-kind="gradient-color"]') === window.__originColor)).toBe(true);
    expect(await editor.evaluate(() => window.__originColor.value)).toBe('#00aa00');
    expect(await saved(editor)).toEqual(config);
    await originRow.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__paintEvents.length)).toBe(1);
    expect((await saved(editor)).bar.paint.gradient_stops.find(stop => stop.color === '#00aa00')).toMatchObject({ pos: 45, color: '#00aa00' });
  });

  test(`${host} keeps typing mounted across preset gradient row-count changes (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'gradient', gradient_stops: [
        { pos: 0, color: '#aa0000' }, { pos: 60, color: '#00aa00' }, { pos: 100, color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-gradient-stops').click();
    const position = editor.locator('input[data-kind="gradient-pos"]').nth(1);
    await position.fill('4');
    await editor.evaluate(el => { window.__typingPosition = el.shadowRoot.querySelectorAll('input[data-kind="gradient-pos"]')[1]; });
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'gradient', gradient_stops: [
      { pos: 0, color: '#aa0000' }, { pos: 60, color: '#00aa00' },
      { pos: 80, color: '#ffff00' }, { pos: 100, color: '#0000aa' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.gradient_stops.length)).toBe(4);
    await expect(position).toBeFocused();
    expect(await position.evaluate(node => node === window.__typingPosition)).toBe(true);
    await position.pressSequentially('5');
    await expect(position).toHaveValue('45');
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
    await position.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__paintEvents.length)).toBe(1);
    expect((await saved(editor)).bar.paint.gradient_stops[1]).toMatchObject({ pos: 45, color: '#00aa00' });
  });

  test(`${host} rejects commits from a removed preset segment row (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [
        { from: '0%', to: '30%', color: '#aa0000' },
        { from: '30%', to: '65%', color: '#00aa00' },
        { from: '65%', to: '100%', color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const starts = editor.locator('input[data-kind="segment-from"]');
    await expect(starts).toHaveCount(3);
    await starts.nth(2).focus();
    await starts.nth(2).evaluate(node => { node.value = '72%'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '0%', to: '50%', color: '#aa0000' },
      { from: '50%', to: '100%', color: '#00aa00' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.segments.length)).toBe(2);
    await expect(starts).toHaveCount(3);
    await starts.nth(2).press('Enter');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
    await starts.nth(2).evaluate(node => node.blur());
    await expect(starts).toHaveCount(2);
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} removes obsolete Undefined segment gaps and actions (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [{ from: '10%', to: '90%', color: '#aa0000' }] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const gaps = editor.locator('.segment-undefined-row');
    await expect(gaps).toHaveCount(2);
    await expect(gaps.locator('button[data-action$="from-undefined"]')).toHaveCount(2);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '0%', to: '100%', color: '#aa0000' },
    ] } }));
    await expect(gaps).toHaveCount(0);
    await expect(editor.locator('button[data-action$="from-undefined"]')).toHaveCount(0);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '10%', to: '90%', color: '#aa0000' },
    ] } }));
    await expect(gaps).toHaveCount(2);
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} ignores an obsolete Undefined gap action while rows are deferred (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [{ from: '10%', to: '90%', color: '#aa0000' }] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const start = editor.locator('input[data-kind="segment-from"]').first();
    const staleAction = await editor.locator('.segment-undefined-row button[data-action$="from-undefined"]').first().elementHandle();
    await start.focus();
    await start.evaluate(node => { node.value = '11%'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '0%', to: '100%', color: '#aa0000' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.segments[0].to)).toBe('100%');
    await staleAction.evaluate(button => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
    await start.evaluate(node => { node.dispatchEvent(new Event('change', { bubbles: true })); node.blur(); });
    await expect(editor.locator('.segment-undefined-row')).toHaveCount(0);
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} keeps focused boundary drafts with their segment during preset reorder (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'night' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [
        { from: '0%', to: '30%', color: '#aa0000' },
        { from: { fixed: 40 }, to: { fixed: 60 }, color: '#00aa00' },
        { from: '70%', to: '100%', color: '#0000aa' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const ends = editor.locator('input[data-kind="segment-to"]');
    await expect(ends).toHaveCount(3);
    await editor.evaluate(el => {
      window.__firstSegmentEnd = el.shadowRoot.querySelectorAll('input[data-kind="segment-to"]')[0];
    });
    await ends.nth(0).fill('25%');
    await editor.evaluate(() => {
      window.__firstSegmentSelection = [window.__firstSegmentEnd.selectionStart, window.__firstSegmentEnd.selectionEnd, window.__firstSegmentEnd.selectionDirection];
    });
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '70%', to: '100%', color: '#0000aa' },
      { from: { fixed: 40 }, to: { fixed: 60 }, color: '#00aa00' },
      { from: '0%', to: '30%', color: '#aa0000' },
    ] } }));
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.segments[0].from)).toBe('70%');
    await expect(ends.nth(0)).toHaveValue('100%');
    await expect(ends.nth(2)).toHaveValue('25%');
    expect(await editor.evaluate(el => el.shadowRoot.activeElement === window.__firstSegmentEnd)).toBe(true);
    expect(await ends.nth(2).evaluate(node => node === window.__firstSegmentEnd)).toBe(true);
    expect(await ends.nth(2).evaluate(node => [node.selectionStart, node.selectionEnd, node.selectionDirection])).toEqual(
      await editor.evaluate(() => window.__firstSegmentSelection));
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
    expect(await saved(editor)).toEqual(config);
  });
}

for (const source of ['src', 'dist']) for (const commit of ['blur', 'enter']) test(`Feature keeps row-count bookkeeping current while a boundary is edited and commits by ${commit} (${source})`, async ({ page }) => {
  const config = { type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { preset: 'night' } } };
  const editor = await mountWithPaintPresets(page, 'Feature', source, {
    night: { fill_style: 'bands', segments: [
      { from: '0%', to: '30%', color: '#aa0000' },
      { from: '40%', to: '60%', color: '#00aa00' },
      { from: '70%', to: '100%', color: '#0000aa' },
    ] },
  }, config);
  await editor.locator('#card-paint-editor summary').click();
  await editor.locator('#card-group-segments').click();
  const firstEnd = editor.locator('input[data-kind="segment-to"]').first();
  await firstEnd.fill('2');
  await editor.evaluate(el => { window.__focusedEnd = el.shadowRoot.querySelector('input[data-kind="segment-to"]'); });
  const eventCount = await page.evaluate(() => window.__paintEvents.length);
  await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
    { from: '0%', to: '30%', color: '#aa0000' },
    { from: '40%', to: '60%', color: '#00aa00' },
  ] } }));
  await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.night.segments.length)).toBe(2);
  await expect(firstEnd).toHaveCount(1);
  await expect(firstEnd).toHaveValue('2');
  expect(await firstEnd.evaluate(node => node === window.__focusedEnd)).toBe(true);
  await firstEnd.press('End');
  await firstEnd.pressSequentially('5');
  await expect(firstEnd).toHaveValue('25');
  expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
  if (commit === 'enter') await firstEnd.press('Enter');
  else await firstEnd.evaluate(node => node.blur());
  await expect.poll(() => page.evaluate(() => window.__paintEvents.length)).toBe(eventCount + 1);
  expect((await saved(editor)).bar.paint.segments).toHaveLength(2);
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} formats canonical absolute segment boundaries (${source})`, async ({ page }) => {
    const config = { bar: { paint: { preset: 'numeric' } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      numeric: { fill_style: 'bands', segments: [
        { from: { fixed: 25 }, to: { fixed: 75 }, color: '#123456' },
      ] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    await expect(editor.locator('.segment-editor-row input[data-kind="segment-from"]')).toHaveValue('25');
    await expect(editor.locator('.segment-editor-row input[data-kind="segment-to"]')).toHaveValue('75');
    expect(await saved(editor)).toEqual(config);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} keeps explicit local segments over preset palette updates (${source})`, async ({ page }) => {
    const local = [{ from: '25%', to: '100%', color: '#123456' }];
    const config = { bar: { paint: { preset: 'night', segments: local } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', segments: [{ from: '0%', to: '100%', color: '#aa0000' }] },
    }, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const starts = editor.locator('input[data-kind="segment-from"]');
    await expect(starts).toHaveCount(1);
    await expect(starts.first()).toHaveValue('25%');
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
      { from: '0%', to: '40%', color: '#aa0000' },
      { from: '40%', to: '100%', color: '#00aa00' },
    ] } }));
    await expect(starts).toHaveCount(1);
    await expect(starts.first()).toHaveValue('25%');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
  });
}

for (const source of ['src', 'dist']) {
  test(`Card preserves legacy Solid inference beside an unrelated preset entity (${source})`, async ({ page }) => {
    const config = { entities: [
      { entity: 'sensor.preset', bar: { paint: { preset: 'night' } } },
      { entity: 'sensor.power', color: '#123456' },
    ] };
    const editor = await mountWithPaintPresets(page, 'Card', source, {
      night: { fill_style: 'bands', segments: [{ from: '0%', to: '100%', color: '#aa0000' }] },
    }, config);
    await editor.locator('button[data-action="toggle-entity-overrides"][data-index="1"]').click();
    await editor.locator('#entity-1-paint-editor summary').click();
    await expect(editor.locator('#entity-1-bar-fill-style')).toHaveValue('solid');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
  });

  test(`Feature preserves legacy Solid inference for color-only paint (${source})`, async ({ page }) => {
    const config = { type: 'custom:sensor-bar-card-plus-feature', color: '#123456' };
    const editor = await mountWithPaintPresets(page, 'Feature', source, {}, config);
    await editor.locator('#card-paint-editor summary').click();
    await expect(editor.locator('#bar-fill-style')).toHaveValue('solid');
    expect(await saved(editor)).toEqual(config);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} clears palette drafts and cached rows when paint returns to inherited (${source})`, async ({ page }) => {
    const config = { bar: { paint: { fill_style: 'bands', color: '#123456', segments: [
      { from: '0%', to: '100%', color: '#abcdef' },
    ] } } };
    if (host === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
    const editor = await mountWithPaintPresets(page, host, source, {}, config);
    await editor.locator('#card-paint-editor summary').click();
    await editor.locator('#card-group-segments').click();
    const start = editor.locator('input[data-kind="segment-from"]').first();
    await start.fill('15%');
    await start.press('Tab');
    await expect.poll(async () => (await saved(editor)).bar.paint.segments?.[0]?.from).toBe('15%');
    await editor.locator('[data-paint-mode="true"]').selectOption('inherit');
    const configAfterClear = await saved(editor);
    expect(configAfterClear.bar?.paint?.segments).toBeUndefined();
    await expect(editor.locator('#card-group-segments-summary')).toHaveText('Default bands');
    await expect(editor.locator('input[data-kind="segment-from"]')).toHaveCount(3);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBeGreaterThan(0);
  });
}

for (const source of ['src', 'dist']) test(`Feature setConfig replaces the effective preset palette without localizing it (${source})`, async ({ page }) => {
  const initial = { type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { preset: 'night' } } };
  const editor = await mountWithPaintPresets(page, 'Feature', source, {
    night: { fill_style: 'bands', segments: [{ from: '10%', to: '100%', color: '#aa0000' }] },
    day: { fill_style: 'gradient', gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 50, color: '#888888' }, { pos: 100, color: '#ffffff' }] },
  }, initial);
  await editor.locator('#card-paint-editor summary').click();
  await editor.evaluate(el => el.setConfig({ type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { preset: 'day' } } }));
  await expect(editor.locator('#bar-fill-style')).toHaveValue('gradient');
  await expect(editor.locator('input[data-kind="gradient-pos"]')).toHaveCount(3);
  await expect(editor.locator('input[data-kind="gradient-pos"]').nth(1)).toHaveValue('50');
  expect(await saved(editor)).toEqual({ type: 'custom:sensor-bar-card-plus-feature', bar: { paint: { preset: 'day' } } });
  expect(await page.evaluate(() => window.__paintEvents.length)).toBe(0);
});

for (const source of ['src', 'dist']) test(`Card registry updates reconcile inherited entity palettes (${source})`, async ({ page }) => {
  const editor = await mountWithPaintPresets(page, 'Card', source, {
    night: { fill_style: 'bands', segments: [{ from: '10%', to: '100%', color: '#aa0000' }] },
  }, { bar: { paint: { preset: 'night' } }, entities: ['sensor.power'] });
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  const childPaint = editor.locator('#entity-0-paint-editor');
  await childPaint.locator('summary').click();
  await editor.locator('#card-paint-editor summary').click();
  await editor.locator('#card-group-segments').click();
  const entityRows = editor.locator('input[data-kind="entity-segment-from"][data-index="0"]');
  await expect(entityRows).toHaveCount(1);
  const events = await page.evaluate(() => window.__paintEvents.length);
  await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'bands', segments: [
    { from: '10%', to: '55%', color: '#aa0000' }, { from: '55%', to: '100%', color: '#00aa00' },
  ] } }));
  await expect(entityRows).toHaveCount(2);
  await expect(childPaint.locator('.paint-editor-description')).toContainText('2 segments');
  expect(await saved(editor)).toEqual({ bar: { paint: { preset: 'night' } }, entities: ['sensor.power'] });
  expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events);
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} selects dashboard paint by reference and refreshes live without losing drafts (${source})`, async ({ page }) => {
    const editor = await mountWithPaintPresets(page, host, source, {
      night: { fill_style: 'bands', color: '#123456', segments: [{ from: '10%', to: '90%', color: '#345678' }],
        gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }] },
      soft: { fill_style: 'soft_bands', color: '#abcdef' },
    }, { bar: { paint: { opacity: 35, future: true } } });
    const paint = editor.locator('#card-paint-editor');
    await paint.locator('summary').click();
    const mode = paint.locator('[data-paint-mode="true"]');
    await expect(mode.locator('option')).toContainText(['Inherited paint', 'Manual paint', 'night', 'soft']);
    await mode.selectOption('preset:night');
    expect((await saved(editor)).bar.paint).toEqual({ opacity: 35, future: true, preset: 'night' });
    await expect(paint.locator('.paint-editor-description')).toContainText('Preset · night · Bands · 1 segment');
    await expect(paint.locator('[data-paint-source="opacity"]')).toHaveText('Override');
    await editor.locator('#card-group-segments').click();
    await expect(editor.locator('input[data-kind="segment-from"]').first()).toHaveValue('10%');
    await editor.locator('#card-group-gradient-stops').click();
    await expect(editor.locator('input[data-kind="gradient-pos"]').first()).toHaveValue('0');
    const opacity = paint.locator('#bar-opacity');
    await opacity.focus();
    await opacity.fill('37.0');
    const eventCount = await page.evaluate(() => window.__paintEvents.length);
    await page.evaluate(() => window.__updatePaintRegistry({ night: { fill_style: 'solid', color: '#00aa88' }, soft: { fill_style: 'soft_bands', color: '#abcdef' }, added: { fill_style: 'gradient' } }));
    await expect(mode.locator('option[value="preset:added"]')).toHaveCount(1);
    await expect(opacity).toHaveValue('37.0');
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(eventCount);
    await opacity.fill('0'); await opacity.press('Tab');
    expect((await saved(editor)).bar.paint.opacity).toBe(0);
    await paint.locator('button[data-action="clear-paint-property"][data-property="opacity"]').click();
    expect((await saved(editor)).bar.paint).toEqual({ future: true, preset: 'night' });
    await editor.locator('#bar-color').fill('#abcdef');
    expect((await saved(editor)).bar.paint.color).toBe('#abcdef');
    await expect(paint.locator('[data-paint-source="color"]')).toHaveText('Override');
    await paint.locator('button[data-action="clear-paint-property"][data-property="color"]').click();
    expect((await saved(editor)).bar.paint.color).toBeUndefined();
    const roundTrip = await saved(editor);
    await editor.evaluate((node, value) => node.setConfig(structuredClone(value)), roundTrip);
    expect(await saved(editor)).toEqual(roundTrip);
    expect(await page.evaluate(() => window.__paintEvents.length)).toBeGreaterThan(eventCount);
  });
}

for (const source of ['src', 'dist']) test(`Card entity inherits preset paint while opacity overrides stay local (${source})`, async ({ page }) => {
  const editor = await mountWithPaintPresets(page, 'Card', source, {
    night: { fill_style: 'solid', color: '#123456' },
  }, { bar: { paint: { preset: 'night', opacity: 35 } }, entities: ['sensor.power'] });
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  const child = editor.locator('#entity-0-paint-editor');
  await expect(child.locator('.paint-editor-description')).toContainText('Inherited · Preset · night · Solid');
  await child.locator('summary').click();
  await editor.locator('#card-paint-editor summary').click();
  const opacity = child.locator('#entity-0-bar-opacity');
  await expect(opacity).toHaveValue('35');
  const rootOpacity = editor.locator('#bar-opacity');
  await rootOpacity.fill('60'); await rootOpacity.press('Tab');
  await expect(opacity).toHaveValue('60');
  await opacity.fill('0'); await opacity.press('Tab');
  expect((await saved(editor)).entities[0].bar.paint.opacity).toBe(0);
  await rootOpacity.fill('70'); await rootOpacity.press('Tab');
  await expect(opacity).toHaveValue('0');
  await child.locator('button[data-action="clear-paint-property"][data-property="opacity"]').click();
  await expect(opacity).toHaveValue('70');
  expect((await saved(editor)).entities[0].bar).toBeUndefined();
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} reports an unavailable dashboard preset and preserves its reference (${source})`, async ({ page }) => {
    const editor = await mountWithPaintPresets(page, host, source, { known: { fill_style: 'solid', color: 'red' } }, {
      bar: { paint: { preset: 'missing', opacity: 0 } },
    });
    const paint = editor.locator('#card-paint-editor');
    await paint.locator('summary').click();
    await expect(paint.locator('.paint-preset-feedback')).toContainText('Preset “missing” was not found');
    expect((await saved(editor)).bar.paint).toEqual({ preset: 'missing', opacity: 0 });
    await expect(paint.locator('#bar-opacity')).toHaveValue('0');
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} explains an invalid dashboard paint definition (${source})`, async ({ page }) => {
    const editor = await mountWithPaintPresets(page, host, source, {
      broken: { fill_style: 'not-a-fill-style', color: '#123456' },
    }, { bar: { paint: { preset: 'broken' } } });
    const paint = editor.locator('#card-paint-editor');
    await paint.locator('summary').click();
    await expect(paint.locator('.paint-preset-feedback')).toContainText('Preset “broken” is invalid');
    expect((await saved(editor)).bar.paint.preset).toBe('broken');
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} Paint disclosure, styles and round-trips (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const paint = editor.locator('#card-paint-editor');
    await expect(paint).not.toHaveAttribute('open');
    await expect(paint.locator('.paint-editor-description')).toHaveText('Bands · 1 segment');
    await expect(paint.locator('.paint-editor-swatch')).toHaveCSS('background-image', /linear-gradient/);
    await expect(editor.locator('#bar-fill-style')).toHaveCount(1);
    await expect(editor.locator('#bar-fill-style')).toBeHidden();
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
    await paint.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(editor.locator('#bar-fill-style')).toBeVisible();
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await editor.locator('#bar-fill-style').selectOption(style);
      await expect(editor.locator('#bar-fill-style')).toHaveValue(style);
      await expect(paint).toHaveAttribute('open');
      await expect(paint.locator('.paint-editor-description')).toContainText({ solid: 'Solid', gradient: 'Gradient', bands: 'Bands', soft_bands: 'Soft bands', band_gradient: 'Band gradient' }[style]);
      const config = await saved(editor), original = await page.evaluate(() => window.__paintOriginal);
      expect(config.bar).toEqual({ ...original.bar, fill_style: style });
      expect(config.extra).toEqual(original.extra);
    }
    await editor.locator('#bar-solid-fill').check();
    expect((await saved(editor)).bar.solid_fill).toBe(true);
    await expect(paint.locator('.paint-editor-description')).toContainText('Sampled color');
    // Structural palette updates preserve the parent disclosure and manual data.
    await editor.locator('#card-group-gradient-stops').click();
    await editor.locator('#gradient-draft-pos').fill('50');
    await editor.locator('button[data-action="add-gradient-stop"]').click();
    await expect(paint).toHaveAttribute('open');
    expect((await saved(editor)).bar.gradient_stops).toHaveLength(3);
    await editor.locator('#card-group-segments').click();
    await editor.locator('#segment-draft-from').fill('100%');
    await editor.locator('#segment-draft-to').fill('120%');
    await editor.locator('button[data-action="add-segment"]').click();
    expect((await saved(editor)).bar.segments).toHaveLength(2);
    const roundTrip = await saved(editor);
    await editor.evaluate(el => { el.setConfig(structuredClone(el._draftConfig ?? el._config)); });
    expect(await saved(editor)).toEqual(roundTrip);
    await paint.locator('summary').click();
    await expect(editor.locator('#bar-fill-style')).toBeHidden();
    expect(await saved(editor)).toEqual(roundTrip);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} edits canonical Paint opacity at narrow width (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source, 240);
    const paint = editor.locator('#card-paint-editor');
    const opacity = paint.locator('#bar-opacity');
    await expect(paint).not.toHaveAttribute('open');
    await expect(opacity).toBeHidden();
    await expect(paint.locator('.paint-editor-description')).not.toContainText('opacity');
    await paint.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(opacity).toBeVisible();
    await expect(opacity).toHaveValue('100');
    await expect(opacity).toHaveAttribute('min', '0');
    await expect(opacity).toHaveAttribute('max', '100');
    await expect(opacity).toHaveAttribute('step', 'any');

    for (const value of ['37', '0', '100']) {
      await opacity.fill(value);
      await opacity.press('Tab');
      expect((await saved(editor)).bar.paint.opacity).toBe(Number(value));
    }
    const roundTrip = await saved(editor);
    await editor.evaluate((el, config) => el.setConfig(structuredClone(config)), roundTrip);
    expect(await saved(editor)).toEqual(roundTrip);
    expect(await opacity.evaluate(node => {
      const paintBox = node.closest('.paint-editor').getBoundingClientRect();
      const bounds = node.getBoundingClientRect();
      return bounds.width > 0 && bounds.left >= paintBox.left && bounds.right <= paintBox.right;
    })).toBe(true);
    expect(await page.evaluate(() => window.__paintEvents)).toHaveLength(3);
  });
}

for (const host of ['Card', 'Feature']) for (const width of [240, 360]) {
  test(`${host} Paint fits ${width}px collapsed and expanded`, async ({ page }) => {
    const editor = await mount(page, host, 'src', width);
    const paint = editor.locator('#card-paint-editor');
    await expect(paint).toHaveScreenshot(`paint-${host.toLowerCase()}-${width}-collapsed.png`);
    await paint.locator('summary').click();
    await editor.locator('#card-group-segments').click();
    await editor.locator('#card-group-gradient-stops').click();
    expect(await paint.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('input, select, button')].every(control => {
        const rect = control.getBoundingClientRect();
        return !rect.width || (rect.left >= bounds.left && rect.right <= bounds.right);
      });
    })).toBe(true);
    expect(await paint.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await editor.evaluate(el => el.shadowRoot.activeElement?.blur());
    await page.mouse.move(0, 0);
    await expect(paint).toHaveScreenshot(`paint-${host.toLowerCase()}-${width}-expanded.png`);
  });
}

test('Card row Paint inherits without promotion, promotes on edit and clears only its owned appearance', async ({ page }) => {
  const editor = await mount(page, 'Card', 'src');
  await editor.locator('button[data-action="toggle-entity-overrides"]').click();
  const paint = editor.locator('#entity-0-paint-editor');
  await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
  await paint.locator('summary').click();
  expect((await saved(editor)).entities).toEqual(['sensor.power']);
  await expect(editor.locator('#entity-0-bar-color')).toHaveValue('#123456');
  await editor.locator('#entity-0-bar-fill-style').selectOption('solid');
  await expect(paint.locator('.paint-editor-description')).toHaveText('Solid · #123456');
  expect((await saved(editor)).entities).toEqual([{ entity: 'sensor.power', bar: { fill_style: 'solid' } }]);
  await editor.locator('#entity-0-bar-inherit').check();
  await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
  expect((await saved(editor)).entities[0].bar).toBeUndefined();
  expect((await saved(editor)).bar).toEqual((await page.evaluate(() => window.__paintOriginal)).bar);
  await expect(paint).toHaveAttribute('open');
});

for (const host of ['Card', 'Feature']) test(`${host} swatch follows dynamic Scale bounds without rebuilding controls`, async ({ page }) => {
  const editor = await mount(page, host, 'src');
  await editor.evaluate(async el => {
    const config = structuredClone(el._draftConfig ?? el._config);
    config.scale = { max: { entity: 'sensor.maximum' } };
    config.bar.segments = [{ from: 0, to: 50, color: '#123456' }, { from: 50, to: 100, color: '#abcdef' }];
    el.setConfig(config);
    el.hass = { states: { 'sensor.maximum': { state: '100', attributes: {} } } };
    await el.updateComplete;
  });
  const swatch = editor.locator('#card-paint-editor .paint-editor-swatch');
  const initial = await swatch.evaluate(node => { window.__swatchNode = node; return node.style.backgroundImage; });
  await editor.evaluate(async el => {
    el.hass = { states: { 'sensor.maximum': { state: '200', attributes: {} } } };
    await el.updateComplete;
  });
  expect(await swatch.evaluate(node => node.style.backgroundImage)).not.toBe(initial);
  expect(await swatch.evaluate(node => node === window.__swatchNode)).toBe(true);
  expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} swatches composite translucent and opaque paint once (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    await editor.evaluate(el => el.style.setProperty('--card-background-color', '#fff'));
    const swatch = editor.locator('#card-paint-editor .paint-editor-swatch');
    for (const [paint, expected] of [
      [{ fill_style: 'solid', color: 'rgba(255, 0, 0, 0.5)' }, 'rgba(255, 0, 0, 0.5)'],
      [{ fill_style: 'solid', color: 'rgba(0, 255, 0, 0.25)' }, 'rgba(0, 255, 0, 0.25)'],
      [{ fill_style: 'bands', solid_fill: true, color: 'rgba(255, 0, 0, 0.5)',
        segments: [{ from: '0%', to: '100%', color: 'rgba(0, 0, 255, 0.25)' }] }, 'rgba(0, 0, 255, 0.25)'],
      [{ fill_style: 'solid', color: '#123456' }, '#123456'],
    ]) {
      await editor.evaluate(async (el, paint) => {
        el.setConfig({ ...(el._draftConfig ?? el._config), bar: paint });
        await el.updateComplete;
      }, paint);
      await swatch.scrollIntoViewIfNeeded();
      // Compare actual browser pixels against a single CSS color layer over white.
      // The reference is test-only and does not use the paint compiler.
      await page.evaluate(color => {
        document.querySelector('#swatch-reference')?.remove();
        const backdrop = document.createElement('div');
        backdrop.id = 'swatch-reference';
        backdrop.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;background:white;z-index:9999';
        const layer = document.createElement('div');
        layer.style.cssText = 'width:100%;height:100%';
        layer.style.backgroundColor = color;
        backdrop.append(layer); document.body.append(backdrop);
      }, expected);
      const bounds = await swatch.boundingBox();
      const actualPixels = await page.screenshot({ clip: { x: Math.floor(bounds.x + bounds.width / 2), y: Math.floor(bounds.y + bounds.height / 2), width: 2, height: 2 } });
      const expectedPixels = await page.screenshot({ clip: { x: 1, y: 1, width: 2, height: 2 } });
      expect(actualPixels.equals(expectedPixels)).toBe(true);
    }
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} promotes null bar on an explicit paint edit (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const original = await saved(editor);
    for (const [property, value] of [['fill_style', 'gradient'], ['color', '#abcdef'], ['solid_fill', true]]) {
      await editor.evaluate(async (el, config) => { el.setConfig({ ...config, bar: null }); await el.updateComplete; }, original);
      expect((await saved(editor)).bar).toBeNull();
      const events = await page.evaluate(() => window.__paintEvents.length);
      const paint = editor.locator('#card-paint-editor');
      if (!await paint.evaluate(node => node.open)) await paint.locator('summary').click();
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events);
      if (property === 'fill_style') await editor.locator('#bar-fill-style').selectOption(value);
      else if (property === 'solid_fill') await editor.locator('#bar-solid-fill').check();
      else await editor.locator('#bar-color').evaluate((node, value) => {
        node.value = value; node.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events + 1);
      expect(await saved(editor)).toEqual({ ...original, bar: { paint: { [property]: value } } });
    }
  });
}

for (const source of ['src', 'dist']) for (const width of [240, 360]) {
  test(`Card entity Paint navigation and editing at ${width}px (${source})`, async ({ page }) => {
    const editor = await mount(page, 'Card', source, width);
    const original = await saved(editor);
    const overrides = editor.locator('button[data-action="toggle-entity-overrides"]');
    await overrides.focus(); await page.keyboard.press('Space');
    const group = editor.getByRole('group', { name: 'Bar Appearance', exact: true });
    const paint = group.locator('#entity-0-paint-editor');
    await expect(editor.locator('#entity-0-group-bar')).toHaveCount(0);
    await expect(group.locator('#entity-0-bar-direction')).toBeVisible();
    await expect(paint.locator('summary')).toBeVisible();
    await expect(paint).not.toHaveAttribute('open');
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
    const geometry = await group.evaluate(el => {
      const panel = el.closest('.override-panel'), bounds = el.getBoundingClientRect();
      const style = getComputedStyle(panel), panelBounds = panel.getBoundingClientRect();
      return { width: bounds.width, available: panel.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        paintWidth: el.querySelector('.paint-editor').getBoundingClientRect().width,
        inset: bounds.left - panelBounds.left - parseFloat(style.borderLeftWidth) - parseFloat(style.paddingLeft) };
    });
    expect(geometry.width).toBeCloseTo(geometry.available, 0);
    expect(geometry.paintWidth).toBeCloseTo(geometry.width, 0);
    expect(geometry.inset).toBeCloseTo(0, 0);
    if (source === 'src') await expect(group).toHaveScreenshot(`entity-paint-${width}-collapsed.png`);
    const direction = group.locator('#entity-0-bar-direction');
    await direction.selectOption('reverse');
    expect((await saved(editor)).entities[0]).toEqual({ entity: 'sensor.power', bar: { direction: 'reverse' } });
    await direction.focus(); await page.keyboard.press('Tab');
    await expect(paint.locator('summary')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(paint).toHaveAttribute('open');
    for (const name of ['segments', 'gradient-stops']) {
      const toggle = paint.locator(`#entity-0-group-${name}`);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.focus(); await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(1);
    expect(await group.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('input, select, button')].every(control => {
        const rect = control.getBoundingClientRect();
        return !rect.width || (rect.left >= bounds.left && rect.right <= bounds.right);
      });
    })).toBe(true);
    expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const id of ['paint-editor', 'bar-direction', 'bar-fill-style', 'bar-color', 'bar-solid-fill', 'bar-opacity']) {
      await expect(editor.locator(`#entity-0-${id}`)).toHaveCount(1);
    }
    if (source === 'src') {
      await editor.evaluate(el => el.shadowRoot.activeElement?.blur()); await page.mouse.move(0, 0);
      await expect(group).toHaveScreenshot(`entity-paint-${width}-expanded.png`);
    }
    await paint.locator('#entity-0-bar-fill-style').selectOption('gradient');
    await paint.locator('#entity-0-bar-color').evaluate(node => {
      node.value = '#abcdef'; node.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await paint.locator('#entity-0-bar-solid-fill').check();
    expect((await saved(editor)).entities[0]).toEqual({ entity: 'sensor.power', bar: { direction: 'reverse', fill_style: 'gradient', color: '#abcdef', solid_fill: true } });
    expect((await saved(editor)).bar).toEqual(original.bar);
    const edited = await saved(editor);
    await editor.evaluate(el => el.setConfig(structuredClone(el._draftConfig)));
    expect(await saved(editor)).toEqual(edited);
    await expect(paint).toHaveAttribute('open');
    await group.locator('#entity-0-bar-inherit').check();
    expect((await saved(editor)).entities[0].bar).toBeUndefined();
    await expect(direction).toHaveValue('inherit');
    await expect(paint.locator('.paint-editor-description')).toHaveText('Inherited · Bands · 1 segment');
    await paint.locator('summary').focus(); await page.keyboard.press('Space');
    await expect(paint).not.toHaveAttribute('open');
  });
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} grouped/mixed paint saves and reopens (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source, 240);
    await editor.evaluate(async el => {
      const config = structuredClone(el._draftConfig ?? el._config);
      config.bar.paint = { color: null, opacity: 35, future: { keep: true } };
      config.bar.segments[0].metadata = { keep: true };
      config.bar.gradient_stops[0].metadata = { keep: true };
      window.__groupedOriginal = structuredClone(config);
      el.setConfig(config); await el.updateComplete;
    });
    const paint = editor.locator('#card-paint-editor');
    await paint.locator('summary').click();
    await expect(editor.locator('#bar-color')).toHaveValue('#123456');
    for (const style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      await editor.locator('#bar-fill-style').selectOption(style);
      expect((await saved(editor)).bar.paint.fill_style).toBe(style);
      expect((await saved(editor)).bar.fill_style).toBeUndefined();
    }
    await editor.locator('#bar-solid-fill').check(); await editor.locator('#bar-solid-fill').uncheck();
    expect((await saved(editor)).bar.paint.solid_fill).toBe(false);
    await editor.locator('#bar-color').evaluate(node => { node.value = '#4a9eff'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    expect((await saved(editor)).bar.paint.color).toBe('#4a9eff');
    expect((await saved(editor)).bar.color).toBeUndefined();
    await editor.locator('#card-group-segments').click();
    const from = editor.locator('input[data-kind="segment-from"]').first();
    await from.fill('10%'); await from.press('Enter');
    expect((await saved(editor)).bar.paint.segments[0]).toMatchObject({ from: '10%', metadata: { keep: true } });
    await editor.locator('button[data-action="remove-segment"]').first().click();
    expect((await saved(editor)).bar.paint.segments).toEqual([]);
    await editor.locator('#bar-fill-style').selectOption('gradient');
    await editor.locator('#card-group-gradient-stops').click();
    const pos = editor.locator('input[data-kind="gradient-pos"]').first();
    await pos.fill('25'); await pos.press('Enter');
    expect((await saved(editor)).bar.paint.gradient_stops[0]).toMatchObject({ pos: 25, metadata: { keep: true } });
    const config = await saved(editor);
    expect(config.bar.paint.opacity).toBe(35); expect(config.bar.paint.future).toEqual({ keep: true });
    expect(config.bar.future).toBe(true);
    expect(config.bar.gradient_stops).toBeUndefined(); expect(config.bar.segments).toBeUndefined();
    await editor.evaluate(async el => {
      const next = document.createElement(el.tagName.toLowerCase());
      next.setConfig(structuredClone(el._draftConfig ?? el._config)); next.hass = { states: {} };
      if (el._context) next.context = el._context;
      el.replaceWith(next); await next.updateComplete;
    });
    await editor.locator('#card-paint-editor > summary').click();
    await expect(editor.locator('#bar-fill-style')).toHaveValue('gradient');
    await expect(editor.locator('#bar-solid-fill')).not.toBeChecked();
    expect(await saved(editor)).toEqual(config);
  });
}
