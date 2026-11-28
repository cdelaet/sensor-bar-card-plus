const { test, expect } = require('./visual-test.cjs');

async function mount(page, host, source) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const segments = Array.from({ length: 12 }, (_, index) => ({
      from: index * 10,
      to: (index + 1) * 10,
      color: `hsl(${index * 29} 70% 45%)`,
    }));
    const config = { bar: { fill_style: 'band_gradient', segments } };
    if (host === 'Card') config.entities = ['sensor.power'];
    else config.type = 'custom:sensor-bar-card-plus-feature';
    window.__disclosureEvents = 0;
    editor.addEventListener('config-changed', () => { window.__disclosureEvents += 1; });
    editor.setConfig(config);
    if (host === 'Feature') editor.context = { entity_id: 'sensor.power' };
    editor.hass = { states: {} };
    const mount = document.querySelector('#mount');
    mount.style.cssText = 'width:360px;height:500px;overflow:auto;position:relative';
    const before = document.createElement('div');
    before.style.height = '850px';
    const after = document.createElement('div');
    after.style.height = '1600px';
    mount.append(before, editor, after);
    await editor.updateComplete;
  }, { host });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}

async function toggleWithoutMoving(toggle, expanded, keyboard = false) {
  await toggle.evaluate(button => button.scrollIntoView({ block: 'center', inline: 'nearest' }));
  if (keyboard) await toggle.evaluate(button => button.focus({ preventScroll: true }));
  await toggle.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  const before = await toggle.evaluate(button => {
    window.__disclosureBefore = button;
    return { top: button.getBoundingClientRect().top, scrollTop: document.querySelector('#mount').scrollTop };
  });

  if (keyboard) {
    await toggle.press('Enter');
  } else await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', String(expanded));
  const after = await toggle.evaluate(button => ({
    top: button.getBoundingClientRect().top,
    scrollTop: document.querySelector('#mount').scrollTop,
    sameNode: button === window.__disclosureBefore,
    focused: button.getRootNode().activeElement === button,
    display: (button.closest('.override-group')?.querySelector('.override-group-body') ?? button.nextElementSibling).style.display,
  }));
  expect(after.sameNode).toBe(true);
  if (keyboard) expect(after.focused).toBe(true);
  expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1.5);
  expect(after.scrollTop).toBe(before.scrollTop);
  expect(after.display).toBe(expanded ? 'grid' : 'none');
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} disclosures keep their scroll position without changing config (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    const configBefore = await editor.evaluate(el => JSON.stringify(el._config));
    const paint = editor.locator('#card-paint-editor');
    await paint.locator(':scope > summary').click();
    await expect(paint).toHaveAttribute('open', '');
    await paint.evaluate(el => { window.__paintBefore = el; });

    for (const group of ['segments', 'gradient-stops', 'marker-target']) {
      const toggle = editor.locator(`#card-group-${group}`);
      await toggleWithoutMoving(toggle, true, group === 'gradient-stops');
      if (group !== 'marker-target') {
        await expect(paint).toHaveAttribute('open', '');
        expect(await paint.evaluate(el => el === window.__paintBefore)).toBe(true);
      }
      if (group === 'segments') {
        const start = editor.locator('input[data-kind="segment-from"]').first();
        await start.evaluate(input => {
          window.__segmentDraftControl = input;
          input.value = 'unfinished';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await expect(start).toHaveValue('unfinished');
      }
      await toggleWithoutMoving(toggle, false, group === 'gradient-stops');
      if (group === 'segments') {
        expect(await editor.evaluate(el => el.shadowRoot.querySelector('input[data-kind="segment-from"]') === window.__segmentDraftControl)).toBe(true);
        await expect(editor.locator('input[data-kind="segment-from"]').first()).toHaveValue('unfinished');
      }
    }

    if (host === 'Card') {
      const entityToggle = editor.locator('button[data-action="toggle-entity-overrides"][data-index="0"]');
      await toggleWithoutMoving(entityToggle, true);
      const nestedToggle = editor.locator('#entity-0-group-scale');
      await toggleWithoutMoving(nestedToggle, true);
      await toggleWithoutMoving(nestedToggle, false);
      await toggleWithoutMoving(entityToggle, false);
    }

    expect(await editor.evaluate(el => JSON.stringify(el._config))).toBe(configBefore);
    expect(await page.evaluate(() => window.__disclosureEvents)).toBe(0);
  });
}
