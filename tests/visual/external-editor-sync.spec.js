const { test, expect } = require('@playwright/test');
const d = require('./acceptance/editor-driver.cjs');

async function mount(page, host, source, options = {}) {
  const { config: suppliedConfig, ...mountOptions } = options;
  const config = suppliedConfig ?? d.seed(host);
  config.bar.fill_style = 'bands';
  config.bar.segments = [
    { from: 10, to: 15, color: '#112233' },
    { from: 40, to: 60, color: '#445566' },
  ];
  config.bar.gradient_stops = [
    { pos: 0, color: 'red' },
    { pos: 100, color: 'blue' },
  ];
  config.bar.color = 'var(--primary-color)';
  const editor = await d.mount(page, host, config, { source, ...mountOptions });
  if (host === 'feature') await editor.evaluate(async el => { el.context = {}; await el.updateComplete; });
  if (mountOptions.openSegments !== false) await d.openSection(editor, { section: 'Segments' });
  return editor;
}

async function editSegmentDraft(editor) {
  await editor.locator('#segment-draft-from').fill('20');
  await editor.locator('#segment-draft-to').fill('40');
  await editor.locator('#segment-draft-color-text-fallback').fill('#aabbcc');
  const add = editor.locator('#card-paint-editor button[data-action="add-segment"]');
  await add.scrollIntoViewIfNeeded();
  return add;
}

async function pressWithUpdate(page, editor, add, update) {
  const box = await add.boundingBox();
  const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const initial = await add.evaluate(button => {
    const rect = button.getBoundingClientRect();
    window.__externalPointerTarget = button;
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const beforeEvents = await d.count(page);
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await update();
  const during = await editor.evaluate(el => {
    const original = window.__externalPointerTarget;
    const button = el.shadowRoot.querySelector('#card-paint-editor button[data-action="add-segment"]');
    const rect = button?.getBoundingClientRect();
    return { sameNode: button === original, originalConnected: original.isConnected,
      x: rect?.x, y: rect?.y, width: rect?.width, height: rect?.height };
  });
  await page.mouse.up();
  await expect.poll(() => d.count(page)).toBe(beforeEvents + 1);
  await expect.poll(async () => {
    const rows = (await d.saved(page)).bar.segments ?? [];
    return rows.some(row => row.from === 20 && row.to === 40 && row.color === '#aabbcc');
  }).toBe(true);
  return { initial, during, eventDelta: (await d.count(page)) - beforeEvents };
}

async function installRegistry(page, editor) {
  await editor.evaluate(el => {
    window.__registryDashboard = {};
    const connection = {
      connected: true,
      sendMessagePromise: async () => structuredClone(window.__registryDashboard),
      subscribeEvents: async callback => { window.__registryListener = callback; return () => {}; },
      addEventListener() {}, removeEventListener() {},
    };
    el.hass = { ...el.hass, connection };
  });
  await expect.poll(() => page.evaluate(() => typeof window.__registryListener)).toBe('function');
  await expect(editor.locator('#card-paint-editor .paint-registry-status')).toBeVisible();
}

for (const source of ['src', 'dist']) for (const host of ['standalone', 'feature']) {
  test(`external hass refresh preserves Add Segment activation (${host}, ${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const add = await editSegmentDraft(editor);
    const result = await pressWithUpdate(page, editor, add, async () => {
      await editor.evaluate(el => {
        el.hass = { ...el.hass, states: { 'sensor.power': { state: '51', attributes: {} } } };
      });
    });
    expect(result.during).toMatchObject({ sameNode: true, originalConnected: true, y: result.initial.y });
    expect(result.eventDelta).toBe(1);
  });

  test(`preset registry refresh preserves Add Segment activation (${host}, ${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const add = await editSegmentDraft(editor);
    await installRegistry(page, editor);
    const result = await pressWithUpdate(page, editor, add, async () => {
      await editor.evaluate(() => {
        window.__registryDashboard = { sbcp_fragments: { paint_presets: { warm: { fill_style: 'solid', color: 'red' } } } };
        window.__registryListener({ event_type: 'lovelace_updated' });
      });
      await expect.poll(() => editor.evaluate(el => !!el._paintPresetRegistry?.presets?.warm)).toBe(true);
    });
    expect(result.during).toMatchObject({ sameNode: true, originalConnected: true, y: result.initial.y });
    expect(result.eventDelta).toBe(1);
    await expect(editor.locator('#card-paint-editor .paint-registry-status')).toBeHidden();
    await expect(editor.locator('#card-paint-editor select[data-paint-preset] option[value="warm"]')).toHaveCount(1);
  });

  test(`custom-element readiness preserves Add Segment activation (${host}, ${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const add = await editSegmentDraft(editor);
    const result = await pressWithUpdate(page, editor, add, async () => {
      await editor.evaluate(() => {
        const tag = window.__acceptance.host === 'feature' ? 'ha-entity-picker' : 'ha-entity-attribute-picker';
        customElements.define(tag, class extends HTMLElement {});
      });
    });
    expect(result.during).toMatchObject({ sameNode: true, originalConnected: true, y: result.initial.y });
    expect(result.eventDelta).toBe(1);
    const tag = host === 'feature' ? 'ha-entity-picker' : 'ha-entity-attribute-picker';
    await expect.poll(() => editor.locator(tag).count()).toBeGreaterThan(0);
  });
}

for (const source of ['src', 'dist']) {
  test(`Feature context refresh waits for Add Segment activation (${source})`, async ({ page }) => {
    const editor = await mount(page, 'feature', source);
    const add = await editSegmentDraft(editor);
    const result = await pressWithUpdate(page, editor, add, async () => {
      await editor.evaluate(el => { el.context = { entity_id: 'sensor.external' }; });
    });
    expect(result.during).toMatchObject({ sameNode: true, originalConnected: true, y: result.initial.y });
    expect(result.eventDelta).toBe(1);
    await editor.evaluate(el => el.updateComplete);
    await expect(editor.locator('#card-paint-editor')).toHaveJSProperty('open', true);
  });

  for (const host of ['standalone', 'feature']) {
    test(`external hass update preserves incomplete CSS color draft (${host}, ${source})`, async ({ page }) => {
      const editor = await mount(page, host, source);
      const color = editor.locator('#bar-color-text-fallback');
      await color.fill('var(');
      await color.focus();
      const beforeEvents = await d.count(page);
      const result = await editor.evaluate(async el => {
        const before = el.shadowRoot.querySelector('#bar-color-text-fallback');
        el.hass = { ...el.hass, states: { 'sensor.power': { state: '52', attributes: {} } } };
        if (el.updateComplete) await el.updateComplete;
        const after = el.shadowRoot.querySelector('#bar-color-text-fallback');
        return { sameNode: before === after, value: after?.value,
          focused: el.shadowRoot.activeElement === after, invalid: after?.getAttribute('aria-invalid') };
      });
      expect(result).toEqual({ sameNode: true, value: 'var(', focused: true, invalid: 'true' });
      expect(await d.count(page)).toBe(beforeEvents);
    });
  }

  test(`Feature context refresh retains incomplete numeric draft (${source})`, async ({ page }) => {
    const editor = await mount(page, 'feature', source);
    await d.openSection(editor, { section: 'Target' });
    const field = editor.locator('#target-value');
    await field.fill('.');
    await field.focus();
    const beforeEvents = await d.count(page);
    const result = await editor.evaluate(async el => {
      const before = el.shadowRoot.querySelector('#target-value');
      el.context = { entity_id: 'sensor.external' };
      await el.updateComplete;
      const after = el.shadowRoot.querySelector('#target-value');
      return { sameNode: before === after, value: after?.value,
        focused: el.shadowRoot.activeElement === after, badInput: after?.validity?.badInput };
    });
    expect(result).toMatchObject({ sameNode: false, value: '.', focused: true });
    expect(await d.count(page)).toBe(beforeEvents);
  });

  for (const group of ['segments', 'gradient-stops']) for (const nested of [false, true]) {
    test(`Feature context render preserves expanded ${group} focus and scroll (${source}, ${nested ? 'nested' : 'page'})`, async ({ page }) => {
      const editor = await mount(page, 'feature', source, { tall: true, nested });
      const details = editor.locator('#card-paint-editor');
      if (!(await details.evaluate(node => node.open))) await details.locator(':scope > summary').click();
      const disclosure = editor.locator(`#card-group-${group}`);
      if (await disclosure.getAttribute('aria-expanded') !== 'true') await disclosure.click();
      const field = group === 'segments'
        ? editor.locator('#card-paint-editor input[data-kind="segment-from"][data-index="0"]')
        : editor.locator('#card-paint-editor input[data-kind="gradient-pos"][data-index="0"]');
      await field.scrollIntoViewIfNeeded();
      await field.focus();
      const beforeEvents = await d.count(page);
      const before = await page.evaluate(() => ({ page: scrollY, nested: document.querySelector('#mount').scrollTop }));
      await field.evaluate(node => { window.__externalFocusNode = node; });
      const result = await editor.evaluate(async el => {
        el.context = { entity_id: 'sensor.external' };
        await el.updateComplete;
        const old = window.__externalFocusNode;
        const selector = old.dataset.kind === 'segment-from'
          ? '#card-paint-editor input[data-kind="segment-from"][data-index="0"]'
          : '#card-paint-editor input[data-kind="gradient-pos"][data-index="0"]';
        const replacement = el.shadowRoot.querySelector(selector);
        return { replaced: replacement !== old, focused: el.shadowRoot.activeElement === replacement,
          detailsOpen: el.shadowRoot.querySelector('#card-paint-editor').open,
          expanded: el.shadowRoot.querySelector(`#card-group-${old.dataset.kind === 'segment-from' ? 'segments' : 'gradient-stops'}`)?.getAttribute('aria-expanded'),
          page: scrollY, nested: document.querySelector('#mount').scrollTop };
      });
      expect(result).toMatchObject({ replaced: true, focused: true, detailsOpen: true, expanded: 'true', ...before });
      expect(await d.count(page)).toBe(beforeEvents);
    });
  }

  test(`Card attribute-picker readiness preserves CSS draft, focus and page scroll (${source})`, async ({ page }) => {
    const config = d.seed('standalone');
    config.entities[0].attribute = 'unit_of_measurement';
    const editor = await mount(page, 'standalone', source, { config, tall: true, openSegments: false });
    await editor.evaluate(el => { el.shadowRoot.querySelector('#card-paint-editor').open = true; });
    const color = editor.locator('#bar-color-text-fallback');
    await color.evaluate(input => {
      input.focus(); input.value = 'var('; input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await color.scrollIntoViewIfNeeded();
    await color.evaluate(input => { window.__externalFocusNode = input; });
    const before = await page.evaluate(() => scrollY);
    const beforeEvents = await d.count(page);
    const beforeReady = await editor.evaluate(el => ({ defined: !!customElements.get('ha-entity-attribute-picker'),
      attrInputs: el.shadowRoot.querySelectorAll('input[data-kind$="-attribute"]').length }));
    expect(beforeReady).toMatchObject({ defined: false });
    expect(beforeReady.attrInputs).toBeGreaterThan(0);
    await editor.evaluate(async () => {
      customElements.define('ha-entity-attribute-picker', class extends HTMLElement {});
      await Promise.resolve(); await Promise.resolve();
    });
    await expect.poll(() => editor.locator('ha-entity-attribute-picker').count()).toBeGreaterThan(0);
    const replacement = editor.locator('#bar-color-text-fallback');
    await expect(replacement).toHaveValue('var(');
    await expect(replacement).toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => replacement.evaluate(node => node.getRootNode().activeElement === node)).toBe(true);
    expect(await replacement.evaluate(node => node !== window.__externalFocusNode)).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    expect(await d.count(page)).toBe(beforeEvents);
  });

  test(`Feature entity-picker readiness preserves CSS draft, focus and nested scroll (${source})`, async ({ page }) => {
    const editor = await mount(page, 'feature', source, { tall: true, nested: true, openSegments: false });
    await editor.evaluate(el => { el.shadowRoot.querySelector('#card-paint-editor').open = true; });
    const color = editor.locator('#bar-color-text-fallback');
    await color.evaluate(input => {
      input.focus(); input.value = 'var('; input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await color.scrollIntoViewIfNeeded();
    await color.evaluate(input => { window.__externalFocusNode = input; });
    const before = await page.evaluate(() => document.querySelector('#mount').scrollTop);
    const beforeEvents = await d.count(page);
    await editor.evaluate(async () => {
      customElements.define('ha-entity-picker', class extends HTMLElement {});
      await Promise.resolve(); await Promise.resolve();
    });
    const pending = await editor.evaluate(el => {
      const node = el.shadowRoot.querySelector('#bar-color-text-fallback');
      return { sameNode: node === window.__externalFocusNode, focused: el.shadowRoot.activeElement === node,
        value: node.value, invalid: node.getAttribute('aria-invalid'),
        pickerCount: el.shadowRoot.querySelectorAll('ha-entity-picker').length };
    });
    expect(pending).toEqual({ sameNode: true, focused: true, value: 'var(', invalid: 'true', pickerCount: 0 });
    expect(await page.evaluate(() => document.querySelector('#mount').scrollTop)).toBe(before);
    await editor.evaluate(el => el.shadowRoot.querySelector('#bar-opacity')?.focus({ preventScroll: true }));
    await expect.poll(() => editor.locator('ha-entity-picker').count()).toBeGreaterThan(0);
    await expect(editor.locator('#bar-color-text-fallback')).toHaveValue('var(');
    await expect(editor.locator('#bar-color-text-fallback')).toHaveAttribute('aria-invalid', 'true');
    expect(await editor.evaluate(el => el.shadowRoot.activeElement?.id)).toBe('bar-opacity');
    expect(await page.evaluate(() => document.querySelector('#mount').scrollTop)).toBe(before);
    expect(await d.count(page)).toBe(beforeEvents);
  });
}
