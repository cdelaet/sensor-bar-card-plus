const { test, expect } = require('@playwright/test');
const path = require('path');

async function mount(page, source, host, nested = false, picker = false) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  if (picker) await page.addInitScript(() => customElements.define('ha-entity-picker', class extends HTMLElement {}));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ host, nested }) => {
    const tag = host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor';
    await customElements.whenDefined(tag);
    const editor = document.createElement(tag);
    window.__identityEvents = [];
    editor.addEventListener('config-changed', e => { window.__identityEvents.push(structuredClone(e.detail.config)); editor.setConfig(e.detail.config); });
    editor.setConfig({ type: `custom:${host === 'feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus'}`, entities: ['sensor.parent'], markers: Array.from({ length: 3 }, () => ({ at: { fixed: 50 } })) });
    if (host === 'feature') editor.context = { entity_id: 'sensor.parent' };
    editor.hass = { states: {} };
    const mount = document.querySelector('#mount'); mount.style.width = '240px';
    if (nested) { mount.style.height = '500px'; mount.style.overflow = 'auto'; }
    const before = document.createElement('div'); before.style.height = '850px';
    mount.append(before, editor); await editor.updateComplete;
  }, { host, nested });
  const editor = page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  await editor.locator('#card-group-generic-markers').click();
  for (let index = 0; index < 3; index++) await rows(editor).nth(index).locator('.generic-marker-toggle').click();
  return editor;
}
const rows = editor => editor.locator('.card-subgroup[data-group="generic-markers"] .generic-marker-item');
const field = (row, name) => row.locator(`[data-kind="generic-marker-${name}"]`);
const scroll = (page, nested) => page.evaluate(nested => nested ? document.querySelector('#mount').scrollTop : scrollY, nested);
async function ownership(editor, row, nested) {
  const id = await row.getAttribute('data-marker-ui-id');
  await expect(row).toHaveAttribute('data-expanded', 'true');
  expect(await editor.evaluate(el => el.shadowRoot.activeElement?.closest('.generic-marker-item')?.dataset.markerUiId)).toBe(id);
  expect(await field(row, 'source-mode').evaluate((el, nested) => { const r = el.getBoundingClientRect(), box = document.querySelector('#mount').getBoundingClientRect(); return r.top >= (nested ? box.top : 0) && r.bottom <= (nested ? box.bottom : innerHeight); }, nested)).toBe(true);
}
for (const source of ['src', 'dist']) for (const host of ['feature', 'standalone']) for (const nested of [false, true]) test(`Reference identity ${source} ${host} ${nested ? 'dialog' : 'page'}: three duplicate markers, sources, echo and numeric draft`, async ({ page }) => {
  const editor = await mount(page, source, host, nested);
  const ids = await rows(editor).evaluateAll(nodes => nodes.map(n => n.dataset.markerUiId));
  expect(new Set(ids).size).toBe(3);
  for (const index of [1, 2]) {
    const row = rows(editor).nth(index), sourceControl = field(row, 'source-mode');
    await sourceControl.evaluate(el => el.scrollIntoView({ block: 'center' })); await sourceControl.focus();
    const before = await scroll(page, nested);
    await row.evaluate(el => { window.__identityRow = el; window.__identitySource = el.querySelector('[data-kind="generic-marker-source-mode"]'); });
    for (const mode of ['percent', 'fixed', 'entity', 'percent']) {
      await sourceControl.selectOption(mode);
      await expect(sourceControl).toHaveValue(mode);
      await expect(sourceControl).toBeFocused();
      expect(await row.evaluate(el => el === window.__identityRow)).toBe(true);
      expect(await sourceControl.evaluate(el => el === window.__identitySource)).toBe(true);
      expect(await rows(editor).evaluateAll(nodes => nodes.map(n => n.dataset.markerUiId))).toEqual(ids);
      await ownership(editor, row, nested);
      expect(Math.abs(await scroll(page, nested) - before)).toBeLessThan(50);
    }
    const percent = field(row, 'percent');
    await expect(percent).toHaveValue('50');
    await percent.focus();
    await percent.press('ArrowRight'); await percent.press('ArrowRight');
    await percent.press('Backspace'); await percent.press('Backspace');
    await expect(percent).toHaveValue('');
    const events = await page.evaluate(() => window.__identityEvents.length);
    await editor.evaluate(async el => { el.setConfig(el._config); el.hass = { states: {} }; await el.updateComplete; });
    await expect(percent).toHaveValue(''); await expect(percent).toBeFocused();
    await ownership(editor, row, nested);
    expect(await page.evaluate(() => window.__identityEvents.length)).toBe(events);
    await percent.press('7'); await percent.press('5');
    await expect(percent).toHaveValue('75'); await expect(percent).toBeFocused();
    await ownership(editor, row, nested);
    expect((await saved(editor)).markers[index].at).toBe('75%');
    expect((await saved(editor)).markers[0]).toEqual({ at: { fixed: 50 } });
  }
});
const saved = editor => editor.evaluate(el => structuredClone(el._draftConfig ?? el._config));
for (const source of ['src', 'dist']) for (const host of ['feature', 'standalone']) for (const picker of [false, true]) test(`Reference identity ${source} ${host} ${picker ? 'picker' : 'fallback'}: fields, add/remove/reorder and owned drafts`, async ({ page }) => {
  const editor = await mount(page, source, host, true, picker);
  const ids = await rows(editor).evaluateAll(nodes => nodes.map(n => n.dataset.markerUiId));
  let row = editor.locator(`.generic-marker-item[data-marker-ui-id="${ids[1]}"]`);
  await row.evaluate(el => window.__identityRow = el);
  for (const [name, value] of [['shape', 'diamond'], ['direction', 'outward'], ['lane', 'above']]) {
    const control = field(row, name); await control.focus(); await control.selectOption(value); await expect(control).toBeFocused();
    expect(await row.getAttribute('data-marker-ui-id')).toBe(ids[1]);
  }
  const color = field(row, 'color');
  await color.focus();
  await color.evaluate(el => { el.value = '#123456'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(color).toBeFocused();
  await field(row, 'label-show').check(); await field(row, 'show-marker').uncheck();
  await field(row, 'label-text').fill('Second'); await expect(field(row, 'label-text')).toBeFocused();
  await field(row, 'fixed').fill('60'); await expect(field(row, 'fixed')).toBeFocused();
  const labelEntity = field(row, 'label-entity');
  if (picker) await labelEntity.evaluate(el => el.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.label' } })));
  else await labelEntity.fill('sensor.label');
  expect((await saved(editor)).markers[1]).toMatchObject({ at: { fixed: 60 }, shape: 'diamond', direction: 'outward', lane: 'above', color: '#123456', show_marker: false, label: { text: 'Second', show: true, entity: 'sensor.label' } });
  expect((await saved(editor)).markers[0]).toEqual({ at: { fixed: 50 } });
  expect(await row.evaluate(el => el === window.__identityRow)).toBe(true);
  const sourceControl = field(row, 'source-mode'); await sourceControl.focus(); await sourceControl.selectOption('percent');
  await field(row, 'percent').fill('');
  await editor.getByRole('button', { name: 'Add reference marker', exact: true }).focus();
  await editor.getByRole('button', { name: 'Add reference marker', exact: true }).press('Enter');
  await expect(rows(editor)).toHaveCount(4);
  expect(await rows(editor).evaluateAll(nodes => nodes.slice(0, 3).map(n => n.dataset.markerUiId))).toEqual(ids);
  await expect(field(row, 'percent')).toHaveValue('');
  await rows(editor).first().getByRole('button', { name: 'Remove marker', exact: true }).focus();
  await rows(editor).first().getByRole('button', { name: 'Remove marker', exact: true }).press('Enter');
  await expect(rows(editor)).toHaveCount(3); await expect(rows(editor).first()).toHaveAttribute('data-marker-ui-id', ids[1]);
  await expect(rows(editor).nth(1)).toHaveAttribute('data-marker-ui-id', ids[2]);
  await expect(row).toHaveAttribute('data-expanded', 'true');
  await row.getByRole('button', { name: 'Move marker down' }).focus();
  await row.getByRole('button', { name: 'Move marker down' }).press('Enter');
  await expect(rows(editor).nth(1)).toHaveAttribute('data-marker-ui-id', ids[1]);
  await expect(row.getByRole('button', { name: 'Move marker down' })).toBeFocused();
  await expect(field(row, 'percent')).toHaveValue('');
  await sourceControl.focus(); await sourceControl.selectOption('fixed');
  await expect(field(row, 'fixed')).toHaveValue('50');
  await field(row, 'fixed').fill('80'); await expect(field(row, 'fixed')).toBeFocused();
  expect((await saved(editor)).markers[1]).toMatchObject({ at: { fixed: 80 }, label: { text: 'Second', entity: 'sensor.label' } });
  expect(await row.evaluate(el => el === window.__identityRow)).toBe(true);
  await row.locator('.generic-marker-toggle').press('Enter'); await expect(row).toHaveAttribute('data-expanded', 'false');
  await row.locator('.generic-marker-toggle').press('Enter'); await expect(row).toHaveAttribute('data-expanded', 'true');
  expect(await row.evaluate(el => el === window.__identityRow)).toBe(true);
});
for (const source of ['src', 'dist']) test(`Reference identity ${source} standalone: entity scope keeps its own duplicate-marker rows`, async ({ page }) => {
  const editor = await mount(page, source, 'standalone');
  await editor.evaluate(el => el.setConfig({ entities: [{ entity: 'sensor.parent', markers: Array.from({ length: 3 }, () => ({ at: { fixed: 50 } })) }], markers: [{ at: { fixed: 20 } }] }));
  await editor.locator('[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-markers').click();
  const list = editor.locator('.entity-shell[data-entity-shell-index="0"] .override-group[data-group="markers"]');
  await list.locator('.generic-marker-toggle').nth(1).click();
  const row = list.locator('.generic-marker-item').nth(1), mode = field(row, 'source-mode');
  const id = await row.getAttribute('data-marker-ui-id');
  await row.evaluate(el => window.__identityRow = el);
  await mode.focus(); await mode.selectOption('percent');
  await expect(mode).toBeFocused(); await expect(field(row, 'percent')).toHaveValue('50');
  await field(row, 'percent').fill('75'); await expect(field(row, 'percent')).toBeFocused();
  await expect(row).toHaveAttribute('data-marker-ui-id', id);
  expect(await row.evaluate(el => el === window.__identityRow)).toBe(true);
  expect((await saved(editor)).entities[0].markers[1].at).toBe('75%');
  expect((await saved(editor)).markers).toEqual([{ at: { fixed: 20 } }]);
});
