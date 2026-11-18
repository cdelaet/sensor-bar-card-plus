const { test, expect } = require('@playwright/test');

async function mount(page, source, host) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host }) => {
    const feature = host === 'Feature';
    const tag = feature ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const config = {
      ...(feature ? { type: 'custom:sensor-bar-card-plus-feature' } : { entities: [{ entity: 'sensor.power' }] }),
      bar: host === 'Entity'
        ? { needle: { show: true, color: '#d02070' } }
        : { needle: { show: false, color: '#123456' } },
      ...(host === 'Entity' ? { entities: [{ entity: 'sensor.power', bar: { needle: { show: false, color: '#d02070' } } }] } : {}),
    };
    window.__needleCheckboxConfig = structuredClone(config);
    editor.addEventListener('config-changed', event => {
      window.__needleCheckboxConfig = structuredClone(event.detail.config);
      editor.setConfig(event.detail.config);
    });
    editor.setConfig(config);
    if (feature) editor.context = { entity_id: 'sensor.power' };
    editor.hass = { states: {} };
    const frame = document.createElement('section');
    frame.style.cssText = 'height:460px;overflow:auto;width:420px';
    const spacer = document.createElement('div');
    spacer.style.height = '720px';
    frame.append(spacer, editor);
    document.querySelector('#mount').append(frame);
    window.__needleCheckboxFrame = frame;
    await editor.updateComplete;
  }, { host });
  return page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Entity', 'Feature']) {
  test(`${host} Needle checkbox keeps scope, control identity, focus and scroll (${source})`, async ({ page, browserName }) => {
    const editor = await mount(page, source, host);
    if (host === 'Entity') {
      const overrides = editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]');
      if (await overrides.getAttribute('aria-expanded') === 'false') await overrides.click();
      const bar = editor.locator('#entity-0-group-bar');
      if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
    }
    if (host !== 'Feature') {
      const group = editor.locator(host === 'Entity' ? '#entity-0-group-needle' : '#card-group-needle');
      if (await group.getAttribute('aria-expanded') === 'false') await group.click();
    }
    const checkbox = editor.locator(host === 'Entity' ? '#entity-0-needle-mode' : '#bar-needle-mode');
    await expect(checkbox).toHaveAttribute('type', 'checkbox');
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.evaluate(node => { window.__needleCheckboxNode = node; });
    const initialScroll = await page.evaluate(() => window.__needleCheckboxFrame.scrollTop);
    const setNeedleState = async checked => {
      if (browserName === 'webkit') {
        // WebKit pointer activation doesn't focus native checkboxes; use the
        // keyboard path when asserting the focus-preserving interaction.
        await checkbox.focus();
        await page.keyboard.press('Space');
      } else {
        await checkbox.setChecked(checked);
      }
      await expect(checkbox).toBeChecked({ checked });
    };

    await setNeedleState(true);
    await expect(checkbox).toBeFocused();
    expect(await checkbox.evaluate(node => node === window.__needleCheckboxNode)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__needleCheckboxConfig)).toMatchObject(host === 'Entity'
      ? { entities: [{ bar: { needle: { show: true, color: '#d02070' } } }] }
      : { bar: { needle: { show: true, color: '#123456' } } });
    expect(Math.abs(await page.evaluate(() => window.__needleCheckboxFrame.scrollTop) - initialScroll)).toBeLessThanOrEqual(1);

    if (host === 'Entity') {
      const inherit = editor.locator('#entity-0-needle-inherit');
      await inherit.check();
      await expect(checkbox).toBeChecked();
      expect((await page.evaluate(() => window.__needleCheckboxConfig)).entities[0].bar).toBeUndefined();
      await setNeedleState(false);
      expect((await page.evaluate(() => window.__needleCheckboxConfig)).entities[0].bar.needle).toEqual({ show: false });
      expect((await page.evaluate(() => window.__needleCheckboxConfig)).bar.needle).toEqual({ show: true, color: '#d02070' });
    } else {
      await setNeedleState(false);
      await expect(checkbox).toBeFocused();
      if (host === 'Card') expect((await page.evaluate(() => window.__needleCheckboxConfig)).bar?.needle).toBeUndefined();
      else expect((await page.evaluate(() => window.__needleCheckboxConfig)).bar.needle).toEqual({ show: false, color: '#123456' });
    }
    expect(await checkbox.evaluate(node => node === window.__needleCheckboxNode)).toBe(true);
  });
}
