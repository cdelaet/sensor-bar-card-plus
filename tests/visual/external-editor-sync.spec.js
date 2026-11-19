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

async function publishPresets(editor, presets) {
  await editor.evaluate((el, presets) => {
    window.__registryDashboard = { sbcp_fragments: { paint_presets: presets } };
    window.__registryListener({ event_type: 'lovelace_updated' });
  }, presets);
  await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets)).toEqual(presets);
}

async function mountFeatureExtremum(page, source, key, { showTargetPaint = false } = {}) {
  const config = d.seed('feature');
  config[key].enabled = false;
  config.target.when_above = { paint: { preset: 'warm' } };
  const editor = await mount(page, 'feature', source, { config, openSegments: false });
  await d.openSection(editor, { section: 'Bar Appearance' });
  await installRegistry(page, editor);
  await publishPresets(editor, { warm: { fill_style: 'solid', color: 'red' } });
  if (showTargetPaint) await d.openSection(editor, { section: 'Target', name: 'target-above-paint-preset' });
  await editor.locator(`#card-group-marker-${key}`).click();
  const checkbox = editor.locator(`#${key}-show`);
  await expect(checkbox).not.toBeChecked();
  await checkbox.scrollIntoViewIfNeeded();
  await checkbox.focus();
  return { editor, checkbox };
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
  test(`Feature preset warning waits for a held Peak checkbox (${source})`, async ({ page }) => {
    const { editor, checkbox } = await mountFeatureExtremum(page, source, 'peak', { showTargetPaint: true });
    const warning = editor.locator('#target-above-paint-editor .paint-preset-feedback');
    await expect(warning).toBeHidden();
    const beforeEvents = await d.count(page);
    const box = await checkbox.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const before = await checkbox.evaluate(node => {
      window.__pressedExtremum = { node, focus: node.getRootNode().activeElement };
      return { top: node.getBoundingClientRect().top, scroll: scrollY };
    });

    await publishPresets(editor, { alternate: { fill_style: 'solid', color: 'blue' } });
    const during = await checkbox.evaluate(node => ({
      sameNode: node === window.__pressedExtremum.node,
      sameFocus: node.getRootNode().activeElement === window.__pressedExtremum.focus,
      top: node.getBoundingClientRect().top, scroll: scrollY, checked: node.checked,
    }));
    const visibleWhileHeld = await warning.isVisible();
    await page.mouse.up();

    expect(during).toEqual({ ...before, sameNode: true, sameFocus: true, checked: false });
    expect(visibleWhileHeld).toBe(false);
    await expect(warning).toHaveText(/Preset .warm. was not found/);
    await expect(checkbox).toBeChecked();
    expect((await d.saved(page)).peak.enabled).toBe(true);
    expect(await d.count(page)).toBe(beforeEvents + 1);
    expect(await checkbox.evaluate(node => ({
      sameNode: node === window.__pressedExtremum.node,
      sameFocus: node.getRootNode().activeElement === window.__pressedExtremum.focus,
      scroll: scrollY,
    }))).toEqual({ sameNode: true, sameFocus: true, scroll: before.scroll });

    await publishPresets(editor, { warm: { fill_style: 'solid', color: 'blue' } });
    await expect(warning).toBeHidden();
    await expect(checkbox).toBeChecked();
    expect(await d.count(page)).toBe(beforeEvents + 1);
  });

  test(`Feature preset response during capture preserves the Floor toggle (${source})`, async ({ page }) => {
    const { editor, checkbox } = await mountFeatureExtremum(page, source, 'floor');
    const beforeEvents = await d.count(page);
    await checkbox.evaluate(node => {
      const root = node.getRootNode();
      const record = event => ({ checked: node.checked, trusted: event.isTrusted, scroll: scrollY });
      const reply = new Promise(resolve => node.addEventListener('click', event => {
        window.__floorClick = { node, focus: root.activeElement, ...record(event) };
        resolve({ sbcp_fragments: { paint_presets: { warm: { fill_style: 'solid', color: 'blue' } } } });
      }, { capture: true, once: true }));
      for (const type of ['input', 'change']) node.addEventListener(type, event => {
        window[`__floor_${type}`] = record(event);
      }, { once: true });
      root.host.hass.connection.sendMessagePromise = () => reply;
      window.__registryListener({ event_type: 'lovelace_updated' });
    });
    await checkbox.click();
    await expect.poll(() => editor.evaluate(el => el._paintPresetRegistry.presets.warm?.color)).toBe('blue');
    const trace = await checkbox.evaluate(node => ({
      click: { checked: window.__floorClick.checked, trusted: window.__floorClick.trusted },
      input: window.__floor_input?.checked, change: window.__floor_change?.checked,
      sameNode: node === window.__floorClick.node,
      sameFocus: node.getRootNode().activeElement === window.__floorClick.focus,
      sameScroll: scrollY === window.__floorClick.scroll,
    }));

    expect(trace).toEqual({ click: { checked: true, trusted: true }, input: true,
      change: true, sameNode: true, sameFocus: true, sameScroll: true });
    await expect(checkbox).toBeChecked();
    expect((await d.saved(page)).floor.enabled).toBe(true);
    expect(await d.count(page)).toBe(beforeEvents + 1);
  });

  test(`Feature disconnect discards a deferred preset sync (${source})`, async ({ page }) => {
    const { editor } = await mountFeatureExtremum(page, source, 'peak', { showTargetPaint: true });
    const beforeEvents = await d.count(page);
    const warning = editor.locator('#target-above-paint-editor .paint-preset-feedback');
    const oldWarning = await warning.elementHandle();
    await expect(warning).toBeHidden();
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.textContent = 'Outside editor';
      button.style.cssText = 'position:fixed;top:0;right:0;z-index:10';
      document.body.append(button);
    });
    const outside = page.getByRole('button', { name: 'Outside editor' });
    // Let the checkbox's ordinary blur sync finish before testing registry teardown.
    await outside.focus();
    await editor.evaluate(el => el.updateComplete);
    const box = await outside.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await publishPresets(editor, { alternate: { fill_style: 'solid', color: 'blue' } });
    await expect(warning).toBeHidden();
    await editor.evaluate(el => {
      const sync = el._syncControls.bind(el);
      el._syncControls = (...args) => { window.__detachedPresetSync = true; return sync(...args); };
      el.remove();
    });
    await outside.evaluate(node => node.addEventListener('click', event => { window.__outsideRelease = event.isTrusted; }));
    await page.mouse.up();
    expect(await page.evaluate(() => window.__outsideRelease)).toBe(true);
    expect(await page.evaluate(() => window.__detachedPresetSync)).toBeUndefined();
    expect(await oldWarning.evaluate(node => node.hidden)).toBe(true);
    expect(await d.count(page)).toBe(beforeEvents);
  });

  for (const timing of ['after close', 'during capture', 'before a deferred rebuild']) {
    test(`stale Card icon selection is rejected ${timing} (${source})`, async ({ page }) => {
      const config = d.seed('standalone');
      config.entities = [{ entity: 'sensor.power', icon: 'mdi:flash' }, { entity: 'sensor.other', icon: 'mdi:water' }];
      await page.addInitScript(() => {
        customElements.define('ha-icon-picker', class extends HTMLElement {
          constructor() {
            super();
            const root = this.attachShadow({ mode: 'open' });
            root.innerHTML = '<input aria-label="Icon picker">';
            const input = root.querySelector('input');
            input.addEventListener('keydown', event => {
              if (event.key !== 'Enter') return;
              const value = input.value;
              const commit = () => this.dispatchEvent(new CustomEvent('value-changed', { detail: { value } }));
              if (this.deferSelection) window.completeIconSelection = commit;
              else commit();
            });
          }
          set value(value) { this.shadowRoot.querySelector('input').value = value ?? ''; }
        });
      });
      const editor = await mount(page, 'standalone', source, { config, openSegments: false });
      const picker = editor.locator('ha-icon-picker[data-kind="entity-icon-picker"][data-index="0"]');
      const original = await picker.elementHandle();
      const replacement = { ...config, entities: [config.entities[1]] };
      const before = await d.count(page);
      await original.evaluate((node, { timing, replacement }) => {
        node.deferSelection = timing !== 'during capture';
        const host = node.getRootNode().host;
        if (!node.deferSelection) node.addEventListener('value-changed', () => {
          window.__acceptance.saved = structuredClone(replacement);
          host.setConfig(replacement);
          window.iconDetachedDuringCapture = !node.isConnected;
        }, { capture: true, once: true });
      }, { timing, replacement });

      const input = picker.locator('input');
      await input.fill('mdi:star');
      await input.press('Enter');
      if (timing === 'during capture') {
        expect(await page.evaluate(() => window.iconDetachedDuringCapture)).toBe(true);
      } else {
        const disclosure = editor.locator('#card-group-marker-peak');
        if (timing === 'before a deferred rebuild') {
          await disclosure.scrollIntoViewIfNeeded();
          const box = await disclosure.boundingBox();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
        }
        await d.foreign(editor, replacement);
        expect(await original.evaluate(node => node.isConnected)).toBe(timing === 'before a deferred rebuild');
        await page.evaluate(() => window.completeIconSelection());
        if (timing === 'before a deferred rebuild') await page.mouse.up();
      }

      expect(await d.count(page)).toBe(before);
      expect((await d.saved(page)).entities).toEqual(replacement.entities);
      await expect(input).toHaveValue('mdi:water');
      // An ordinary entity edit keeps the same icon control and retargets it.
      await editor.locator('input[data-kind="entity-input"][data-index="0"]').fill('sensor.updated');
      await input.fill('mdi:leaf');
      await input.press('Enter');
      expect(await d.count(page)).toBe(before + 2);
      expect((await d.saved(page)).entities).toEqual([{ entity: 'sensor.updated', icon: 'mdi:leaf' }]);
    });
  }

  for (const nested of [false, true]) {
    test(`deferred Card picker readiness restores the completed text selection (${source}, ${nested ? 'nested' : 'page'})`, async ({ page }) => {
      const config = d.seed('standalone');
      config.entities[0].attribute = 'unit_of_measurement';
      const editor = await mount(page, 'standalone', source, { config, tall: true, nested, openSegments: false });
      await d.openSection(editor, { section: 'Bar Appearance' });
      const color = editor.locator('#bar-color-text-fallback');
      await color.fill('var(');
      await color.scrollIntoViewIfNeeded();
      const beforeEvents = await d.count(page);
      const before = await color.evaluate(input => {
        window.__externalFocusNode = input;
        const rect = input.getBoundingClientRect();
        input.addEventListener('click', event => {
          window.__externalSelection = { trusted: event.isTrusted, start: input.selectionStart,
            end: input.selectionEnd, direction: input.selectionDirection };
        }, { once: true });
        return { x: rect.x, y: rect.y + rect.height / 2, width: rect.width,
          page: scrollY, nested: document.querySelector('#mount').scrollTop };
      });
      expect(nested ? before.nested : before.page).toBeGreaterThan(0);
      await page.mouse.move(before.x + before.width - 12, before.y);
      await page.mouse.down();
      await editor.evaluate(() => customElements.define('ha-entity-attribute-picker', class extends HTMLElement {}));
      await expect(editor.locator('ha-entity-attribute-picker')).toHaveCount(0);
      expect(await color.evaluate(node => node === window.__externalFocusNode)).toBe(true);
      await page.mouse.move(before.x + 2, before.y, { steps: 5 });
      await page.mouse.up();

      const selection = await page.evaluate(() => window.__externalSelection);
      expect(selection).toMatchObject({ trusted: true, start: 0, end: 4 });
      await expect(editor.locator('ha-entity-attribute-picker').first()).toBeAttached();
      expect(await color.evaluate(input => ({
        replaced: input !== window.__externalFocusNode && !window.__externalFocusNode.isConnected,
        focused: input.getRootNode().activeElement === input,
        start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection,
        value: input.value, invalid: input.getAttribute('aria-invalid'),
        page: scrollY, nested: document.querySelector('#mount').scrollTop,
      }))).toEqual({ replaced: true, focused: true, start: 0, end: 4, direction: selection.direction, value: 'var(', invalid: 'true',
        page: before.page, nested: before.nested });
      expect(await d.count(page)).toBe(beforeEvents);
    });
  }

  test(`foreign Card title update preserves a pending disclosure click (${source})`, async ({ page }) => {
    const editor = await mount(page, 'standalone', source, { openSegments: false });
    await d.openSection(editor, { section: 'Bar Appearance' });
    const disclosure = editor.locator('#card-group-segments');
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await disclosure.scrollIntoViewIfNeeded();
    const box = await disclosure.boundingBox();
    const original = await disclosure.elementHandle();
    const beforeEvents = await d.count(page);
    const config = await d.saved(page);
    config.title = 'Updated externally';
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await d.foreign(editor, config);
    const retained = await disclosure.evaluate((node, old) => node === old, original);
    await page.mouse.up();

    expect({ retained, expanded: await disclosure.getAttribute('aria-expanded') })
      .toEqual({ retained: true, expanded: 'true' });
    await expect(editor.locator('#title')).toHaveValue('Updated externally');
    expect(await d.count(page)).toBe(beforeEvents);
  });

  test(`foreign Card entity replacement invalidates a pressed row action (${source})`, async ({ page }) => {
    const editor = await mount(page, 'standalone', source, { openSegments: false });
    const remove = editor.locator('[data-action="remove-entity"][data-index="0"]');
    await remove.scrollIntoViewIfNeeded();
    const box = await remove.boundingBox();
    const original = await remove.elementHandle();
    const beforeEvents = await d.count(page);
    const config = await d.saved(page);
    config.entities.shift();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await d.foreign(editor, config);
    const detached = await original.evaluate(node => !node.isConnected);
    await page.mouse.up();

    expect(detached).toBe(true);
    await expect(editor.locator('.entity-subtitle')).toHaveText(['sensor.other']);
    expect(await d.count(page)).toBe(beforeEvents);
  });

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
      await color.evaluate(input => input.setSelectionRange(1, 3));
      const beforeEvents = await d.count(page);
      const result = await editor.evaluate(async el => {
        const before = el.shadowRoot.querySelector('#bar-color-text-fallback');
        el.hass = { ...el.hass, states: { 'sensor.power': { state: '52', attributes: {} } } };
        if (el.updateComplete) await el.updateComplete;
        const after = el.shadowRoot.querySelector('#bar-color-text-fallback');
        return { sameNode: before === after, value: after?.value,
          focused: el.shadowRoot.activeElement === after, invalid: after?.getAttribute('aria-invalid'),
          selection: [after?.selectionStart, after?.selectionEnd] };
      });
      expect(result).toEqual({ sameNode: true, value: 'var(', focused: true, invalid: 'true', selection: [1, 3] });
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
