const { test, expect } = require('@playwright/test');
const path = require('path');

async function mount(page, source, host, config = {}) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ host, config }) => {
    const tag = host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor';
    await customElements.whenDefined(tag);
    const editor = document.createElement(tag);
    window.__numericEvents = [];
    editor.addEventListener('config-changed', event => {
      window.__numericEvents.push(structuredClone(event.detail.config));
      editor.setConfig(event.detail.config);
    });
    editor.setConfig({ ...config, ...(host === 'feature' ? { type: 'custom:sensor-bar-card-plus-feature' } : { entities: ['sensor.a'] }) });
    editor.context = { entity_id: 'sensor.a' }; editor.hass = { states: {} };
    document.querySelector('#mount').append(editor); await editor.updateComplete;
  }, { host, config });
  return page.locator(host === 'feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
}
const saved = editor => editor.evaluate(el => structuredClone(el._draftConfig ?? el._config));

for (const source of ['src', 'dist']) for (const host of ['feature', 'standalone']) test(`Reference numeric draft ${host} ${source}: backspace 50 to empty, echo and replace with 75`, async ({ page }) => {
  const editor = await mount(page, source, host);
  await editor.locator('#card-group-generic-markers').click();
  await editor.getByRole('button', { name: 'Add reference marker', exact: true }).click();
  const row = editor.locator('.generic-marker-item').first();
  const mode = row.locator('[data-kind="generic-marker-source-mode"]');
  await mode.selectOption('percent');
  const input = row.locator('[data-kind="generic-marker-percent"]');
  await expect(input).toHaveValue('50'); await input.focus(); await input.press('ArrowRight'); await input.press('ArrowRight');
  await input.press('Backspace'); await expect(input).toHaveValue('5');
  const before = await saved(editor), count = await page.evaluate(() => window.__numericEvents.length);
  await input.evaluate(node => window.__numericInput = node);
  await input.press('Backspace');
  await expect(mode).toHaveValue('percent'); await expect(input).toHaveValue(''); await expect(input).toBeFocused();
  await expect(row).toHaveAttribute('data-expanded', 'true');
  expect(await saved(editor)).toEqual(before); expect(await page.evaluate(() => window.__numericEvents.length)).toBe(count);
  expect(await input.evaluate(node => node === window.__numericInput)).toBe(true);
  await editor.evaluate(async el => { el.setConfig(el._draftConfig ?? el._config); el.hass = { states: {} }; await el.updateComplete; });
  await expect(input).toHaveValue(''); await expect(mode).toHaveValue('percent'); await expect(input).toBeFocused();
  await input.press('7'); await input.press('5'); await expect(input).toHaveValue('75');
  expect((await saved(editor)).markers[0].at).toBe('75%');
  await input.fill(''); await echoAndRender(editor); await expect(input).toHaveValue(''); await expect(input).toBeFocused();
  const foreignEvents = await page.evaluate(() => window.__numericEvents.length);
  await editor.evaluate(async el => { el.setConfig({ ...(el._draftConfig ?? el._config), markers: [{ at: '35%' }] }); await el.updateComplete; });
  await expect(mode).toHaveValue('percent'); await expect(input).toHaveValue('35');
  expect(await page.evaluate(() => window.__numericEvents.length)).toBe(foreignEvents);
});

const initial = {
  scale: { min: -100, max: 100 }, target: { at: { fixed: 30 }, label: { precision: 1 } },
  baseline: { at: { fixed: 20 } }, peak: { enabled: true, label: { precision: 1 } },
  floor: { enabled: true, label: { precision: 1 } }, formatting: { decimal: 2 },
  markers: [{ at: { fixed: 50 }, label: { precision: 1 } }],
  bar: { fill_style: 'bands', segments: [{ from: 0, to: 50, color: '#abc' }, { from: 50, to: 100, color: '#def' }], gradient_stops: [{ pos: 0, color: '#abc' }, { pos: 100, color: '#def' }] },
  future: { keep: true, unset: undefined },
};
async function echoAndRender(editor) {
  await editor.evaluate(async el => {
    el.setConfig(el._draftConfig ?? el._config); el.hass = { states: {} };
    await el.updateComplete;
    el._structureSignature = undefined; el._render();
  });
}
async function replaceNumber(editor, page, selector, value, read) {
  const input = editor.locator(selector); await input.fill('');
  const before = await saved(editor), count = await page.evaluate(() => window.__numericEvents.length);
  await echoAndRender(editor);
  await expect(input).toHaveValue(''); await expect(input).toBeFocused();
  expect(await saved(editor)).toEqual(before); expect(await page.evaluate(() => window.__numericEvents.length)).toBe(count);
  await input.fill(value); expect(await editor.evaluate(read)).toBe(Number(value));
}
for (const source of ['src', 'dist']) for (const host of ['feature', 'standalone']) test(`Ordinary numeric drafts ${host} ${source}: fixed, Scale and precision survive echo/render and commit`, async ({ page }) => {
  const editor = await mount(page, source, host, initial);
  for (const group of ['marker-target', 'marker-peak', 'marker-floor', 'baseline', 'generic-markers']) await editor.locator(`#card-group-${group}`).click();
  await editor.locator('.generic-marker-toggle').click();
  const cases = [
    ['#scale-min', '-75', el => el._createSectionContext().source({ type: 'card' }, 'min').fixed],
    ['#scale-max', '125', el => el._createSectionContext().source({ type: 'card' }, 'max').fixed],
    ['#target-value', '75', el => el._createSectionContext().source({ type: 'card' }, 'target').fixed],
    ['#baseline-value', '25', el => el._createSectionContext().source({ type: 'card' }, 'baseline').fixed],
    ['#formatting-decimal', '3', el => (el._draftConfig ?? el._config).formatting.decimal],
    ['#target-label-precision', '3', el => (el._draftConfig ?? el._config).target.label.precision],
    ['#peak-label-precision', '3', el => (el._draftConfig ?? el._config).peak.label.precision],
    ['#floor-label-precision', '3', el => (el._draftConfig ?? el._config).floor.label.precision],
    ['[data-kind="generic-marker-fixed"]', '75', el => (el._draftConfig ?? el._config).markers[0].at.fixed],
    ['[data-kind="generic-marker-label-precision"]', '3', el => (el._draftConfig ?? el._config).markers[0].label.precision],
  ];
  for (const [selector, value, read] of cases) await replaceNumber(editor, page, selector, value, read);
  await editor.locator('[data-kind="generic-marker-source-mode"]').selectOption('entity-fallback');
  await replaceNumber(editor, page, '[data-kind="generic-marker-fallback"]', '85', el => (el._draftConfig ?? el._config).markers[0].at.fixed);
  const input = editor.locator('#scale-min'); await input.fill('');
  const before = await saved(editor); await input.press('-');
  expect(await input.evaluate(el => el.validity.badInput)).toBe(true);
  expect(await saved(editor)).toEqual(before); await input.press('Tab'); expect(await saved(editor)).toEqual(before);
  // Genuine foreign replacement discards the owned empty/bad-input draft.
  await editor.evaluate(async el => { el.setConfig({ ...(el._draftConfig ?? el._config), scale: { min: 90, max: 100 } }); await el.updateComplete; });
  await expect(input).toHaveValue('90');
  expect((await saved(editor)).future).toEqual({ keep: true, unset: undefined });
});

for (const source of ['src', 'dist']) test(`Standalone numeric drafts ${source}: Layout and entity overrides use the same rule`, async ({ page }) => {
  const editor = await mount(page, source, 'standalone', { ...initial, layout: { height: 32, label: { position: 'hero', width: 160 }, hero: { value_size: 80 } } });
  for (const [selector, value, read] of [
    ['#layout-height', '36', el => el._draftConfig.layout.height],
    ['#layout-label-width', '180', el => el._draftConfig.layout.label.width],
    ['#layout-hero-value-size', '44', el => el._draftConfig.layout.hero.value_size],
  ]) await replaceNumber(editor, page, selector, value, read);
  await editor.locator('[data-action="toggle-entity-overrides"]').click();
  await editor.locator('#entity-0-group-scale').click();
  await replaceNumber(editor, page, '#entity-0-min', '-25', el => el._createSectionContext().source({ type: 'entity', index: 0 }, 'min').fixed);
  await editor.locator('#entity-0-group-formatting').click();
  await replaceNumber(editor, page, '#entity-0-formatting-decimal', '4', el => el._draftConfig.entities[0].formatting.decimal);
  // An intentional blank blur retains established inheritance cleanup.
  const decimal = editor.locator('#entity-0-formatting-decimal'); await decimal.press('Tab'); await decimal.fill(''); await decimal.press('Tab');
  expect((await saved(editor)).entities[0].formatting).toBeUndefined();
});

for (const source of ['src', 'dist']) test(`Built-in percentages ${source}: owned drafts, explicit clear and foreign replacement`, async ({ page }) => {
  const editor = await mount(page, source, 'feature', initial);
  for (const [key, group] of [['target', 'marker-target'], ['baseline', 'baseline']]) {
    await editor.locator(`#card-group-${group}`).click(); await editor.locator(`#${key}-source-mode`).selectOption('percent');
    const input = editor.locator(`#${key}-percent`);
    const before = await saved(editor); await input.fill(''); await echoAndRender(editor);
    expect(await saved(editor)).toEqual(before); await expect(input).toHaveValue(''); await expect(input).toBeFocused();
    await expect(editor.locator(`#${key}-source-mode`)).toHaveValue('percent');
    await input.fill('75'); expect((await saved(editor))[key].at.percent).toBe(75);
    await input.fill(''); await editor.locator(`[data-action="${key}-clear-percent"]`).click();
    expect((await saved(editor))[key]?.at?.percent).toBeUndefined();
  }
});

for (const source of ['src', 'dist']) for (const host of ['feature', 'standalone']) test(`Palette numeric drafts ${host} ${source}: invalid boundary, Auto end and Gradient position`, async ({ page }) => {
  const editor = await mount(page, source, host, initial);
  await editor.locator('#card-group-segments').click(); const from = editor.locator('[data-kind="segment-from"]').first();
  for (const value of ['', '-', '.', '-.']) {
    const before = await saved(editor), count = await page.evaluate(() => window.__numericEvents.length);
    await from.fill(value); await from.press('Tab'); await echoAndRender(editor);
    expect(await saved(editor)).toEqual(before); expect(await page.evaluate(() => window.__numericEvents.length)).toBe(count); await expect(from).toHaveValue(value);
  }
  await from.fill('-10'); await from.press('Tab'); expect((await saved(editor)).bar.segments[0].from).toBe(-10);
  const to = editor.locator('[data-kind="segment-to"]').last(), beforeEnd = await saved(editor);
  await to.fill(''); expect(await saved(editor)).toEqual(beforeEnd); await to.press('Tab');
  if (host === 'feature') expect((await saved(editor)).bar.segments[1].to).toBeUndefined();
  else expect(await saved(editor)).toEqual(beforeEnd);
  await editor.locator('#bar-fill-style').selectOption('gradient'); await editor.locator('#card-group-gradient-stops').click();
  const pos = editor.locator('[data-kind="gradient-pos"]').first(), beforePos = await saved(editor);
  await pos.fill(''); await pos.press('Tab'); await echoAndRender(editor); await expect(pos).toHaveValue(''); expect(await saved(editor)).toEqual(beforePos);
  await pos.fill('25'); await pos.press('Tab'); expect((await saved(editor)).bar.gradient_stops[0].pos).toBe(25);
});
