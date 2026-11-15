const { test, expect } = require('@playwright/test');

const hosts = ['Card', 'Entity', 'Feature'];
const destinations = ['bar', 'baseline-above', 'baseline-below'];
const pathFor = destination => destination === 'bar' ? ['bar', 'paint'] : ['baseline', destination.slice(9), 'paint'];
const set = (config, path, value) => {
  let target = config;
  for (const key of path.slice(0, -1)) target = target[key] ??= {};
  target[path.at(-1)] = value;
};

async function mount(page, source, host, destination, paint, parentPaint, presets) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  const config = { type: host === 'Feature' ? 'custom:sensor-bar-card-plus-feature' : 'custom:sensor-bar-card-plus',
    scale: { min: 0, max: 100 }, bar: { animated: false }, baseline: { at: 50 }, future: { keep: true },
    ...(host === 'Feature' ? {} : { entities: [{ entity: 'sensor.power', future: true }] }),
  };
  const scope = host === 'Entity' ? config.entities[0] : config;
  if (parentPaint !== undefined) set(config, pathFor(destination), parentPaint);
  if (paint !== undefined) set(scope, pathFor(destination), paint);
  await page.evaluate(async ({ config, host, destination, presets }) => {
    const tag = host === 'Feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const runtime = document.createElement(tag);
    const states = { 'sensor.power': { entity_id: 'sensor.power', state: destination === 'baseline-below' ? '20' : '80', attributes: {} } };
    const hass = { states, ...(presets ? { connection: {
      connected: true,
      sendMessagePromise: async () => ({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: presets } }] }] }),
      subscribeEvents: async () => () => {}, addEventListener() {}, removeEventListener() {},
    } } : {}) };
    const parent = document.createElement('section');
    parent.style.cssText = 'width:420px;--accent-color:#09aabb';
    parent.append(editor, runtime);
    document.getElementById('mount').append(parent);
    window.__paintEvents = [];
    window.__paintConfig = structuredClone(config);
    parent.addEventListener('config-changed', event => {
      window.__paintEvents.push(structuredClone(event.detail.config));
      window.__paintConfig = structuredClone(event.detail.config);
      editor.setConfig(event.detail.config);
      runtime.setConfig(event.detail.config);
      runtime.hass = hass;
    });
    editor.setConfig(config);
    runtime.setConfig(config);
    if (host === 'Feature') editor.context = runtime.context = { entity_id: 'sensor.power' };
    editor.hass = runtime.hass = hass;
    await editor.updateComplete;
    await runtime.updateComplete;
  }, { config, host, destination, presets });
  return page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
}

async function openPaint(editor, host, destination) {
  const entity = host === 'Entity';
  if (entity) {
    const toggle = editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]');
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  }
  if (destination !== 'bar') {
    const group = editor.locator(entity ? '#entity-0-group-baseline' : '#card-group-baseline');
    if (await group.getAttribute('aria-expanded') === 'false') await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(group.locator('..').locator(':scope > .override-group-body')).toBeVisible();
  }
  const id = destination === 'bar' ? (entity ? 'entity-0-paint-editor' : 'card-paint-editor')
    : `${entity ? 'entity-0-' : ''}${destination}-paint-editor`;
  const paint = editor.locator(`#${id}`);
  if (!await paint.evaluate(node => node.open)) await paint.locator(':scope > summary').click();
  await expect(paint).toHaveJSProperty('open', true);
  return paint;
}

const savedPaint = (page, host, destination) => page.evaluate(({ host, path }) => {
  const config = host === 'Entity' ? window.__paintConfig.entities[0] : window.__paintConfig;
  return path.reduce((value, key) => value?.[key], config);
}, { host, path: pathFor(destination) });

function layer(page, host, destination) {
  const runtime = page.locator(host === 'Feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus');
  return runtime.locator(`.bar-paint-layer[data-layer="${destination === 'bar' ? 'base' : destination}"]`);
}

for (const source of ['src', 'dist']) for (const host of hosts) for (const destination of destinations) {
  test(`${host} ${destination} shares preset confirmation, active no-op and None (${source})`, async ({ page }) => {
    const presets = {
      warm: { fill_style: 'gradient', opacity: 35,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
      cool: { fill_style: 'solid', color: '#123456' },
    };
    const editor = await mount(page, source, host, destination,
      host === 'Entity' ? { opacity: 60 } : { preset: 'warm', opacity: 60 },
      host === 'Entity' ? { preset: 'warm' } : undefined, presets);
    const paint = await openPaint(editor, host, destination);
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset).toBeVisible();
    await expect(preset).toHaveValue('warm');
    await expect(paint.locator('[data-paint-property="fill_style"]')).toHaveValue('gradient');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.6');
    const before = await savedPaint(page, host, destination);
    const events = await page.evaluate(() => window.__paintEvents.length);
    await preset.selectOption('warm');
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events);
    expect(await savedPaint(page, host, destination)).toEqual(before);
    page.once('dialog', dialog => dialog.dismiss());
    await preset.selectOption('cool');
    await expect(preset).toHaveValue('warm');
    expect(await savedPaint(page, host, destination)).toEqual(before);
    page.once('dialog', dialog => dialog.accept());
    await preset.selectOption('cool');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ preset: 'cool' });
    await expect(layer(page, host, destination)).toHaveCSS('background-image',
      'linear-gradient(to right, rgb(18, 52, 86) 0%, rgb(18, 52, 86) 100%)');
    await paint.locator('[data-paint-property="opacity"]').fill('0');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0');
    await preset.selectOption('');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ opacity: 0 });
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0');
  });

  test(`${host} ${destination} visible palettes, edits, sampling and reset (${source})`, async ({ page }) => {
    const initial = { fill_style: 'gradient', color: '#123456',
      segments: [{ from: '0%', to: '100%', color: '#112233' }],
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] };
    const editor = await mount(page, source, host, destination, initial);
    let paint = await openPaint(editor, host, destination);
    expect(await page.evaluate(() => window.__paintEvents)).toEqual([]);
    await expect(editor.locator('[id$="-color-enabled"]')).toHaveCount(0);
    await expect(paint.locator('[data-paint-source="color"]')).toHaveText('Local');
    for (const palette of ['segments', 'gradient-stops']) {
      if (host !== 'Entity') {
        const group = paint.locator(`[data-action="toggle-card-group"][data-group$="${palette}"]`);
        await group.click();
        await expect(group).toHaveAttribute('aria-expanded', 'true');
        await expect(group.locator('..').locator(':scope > .override-group-body')).toBeVisible();
      } else if (destination === 'bar') {
        const group = paint.locator(`button[data-action="toggle-override-group"][data-group="${palette}"]`);
        await group.click();
        await expect(group).toHaveAttribute('aria-expanded', 'true');
      }
      const input = paint.locator(`[data-kind="${host === 'Entity' ? 'entity-' : ''}${palette === 'segments' ? 'segment-from' : 'gradient-pos'}"]`).first();
      await expect(input).toBeVisible();
      await input.fill(palette === 'segments' ? '5%' : '10');
      await input.press('Tab');
      await expect.poll(() => savedPaint(page, host, destination)).toMatchObject(palette === 'segments'
        ? { segments: [{ from: '5%', to: '100%', color: '#112233' }] }
        : { gradient_stops: [{ pos: 10, color: '#000000' }, { pos: 100, color: '#ffffff' }] });
    }
    await paint.locator('[data-paint-property="opacity"]').fill('40');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.4');
    await expect(paint.locator('.paint-editor-swatch')).toHaveCSS('opacity', '0.4');
    await paint.locator('[data-paint-property="solid_fill"]').check();
    const gray = destination === 'baseline-below' ? 28 : 198;
    await expect(layer(page, host, destination)).toHaveCSS('background-image',
      `linear-gradient(to right, rgb(${gray}, ${gray}, ${gray}) 0%, rgb(${gray}, ${gray}, ${gray}) 100%)`);
    await paint.locator('[data-action="clear-paint-property"][data-property="opacity"]').click();
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '1');
    page.once('dialog', dialog => dialog.accept());
    await paint.locator('[data-action="reset-paint"]').click();
    await expect.poll(() => savedPaint(page, host, destination)).toBeUndefined();
    paint = await openPaint(editor, host, destination);
    await expect(paint.locator('[data-action="reset-paint"]')).toBeDisabled();
    if (destination !== 'bar') await expect(layer(page, host, destination)).toHaveCSS('display', 'none');
    expect(await page.evaluate(() => window.__paintConfig.future)).toEqual({ keep: true });
  });

  if (destination !== 'bar') test(`${host} ${destination} defaults and reset remain accessible while disabled (${source})`, async ({ page }) => {
    const inherited = host === 'Entity' ? { fill_style: 'solid', color: '#ee5500', opacity: 35 } : undefined;
    const editor = await mount(page, source, host, destination, null, inherited);
    let paint = await openPaint(editor, host, destination);
    const reset = paint.locator('[data-action="reset-paint"]');
    await expect(reset).toBeVisible();
    await expect(reset).toBeEnabled();
    await expect(paint.getByLabel('Enable Paint', { exact: true })).not.toBeChecked();
    await expect(paint.locator('[data-paint-property="fill_style"]')).not.toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await reset.click();
    await expect.poll(() => savedPaint(page, host, destination)).toBeUndefined();
    paint = await openPaint(editor, host, destination);
    if (host === 'Entity') {
      await expect(paint.getByLabel('Enable Paint', { exact: true })).toBeChecked();
      await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.35');
    } else {
      await paint.getByLabel('Enable Paint', { exact: true }).check();
      await expect.poll(() => savedPaint(page, host, destination)).toEqual({});
      paint = await openPaint(editor, host, destination);
      await expect(paint.locator('[data-paint-property="fill_style"]')).toHaveValue('solid');
      await expect(paint.locator('[data-paint-source="color"]')).toHaveText('Default');
      await expect(layer(page, host, destination)).toHaveCSS('background-image',
        'linear-gradient(to right, rgb(9, 170, 187) 0%, rgb(9, 170, 187) 100%)');
      await expect(layer(page, host, destination)).toHaveCSS('opacity', '1');
    }
    await paint.locator('[data-paint-property="fill_style"]').selectOption('bands');
    if (host !== 'Entity') {
      const disclosure = paint.locator('button[data-group$="-segments"]');
      await disclosure.click();
      await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    }
    const firstBoundary = paint.locator(`[data-kind="${host === 'Entity' ? 'entity-' : ''}segment-from"]`).first();
    await expect(firstBoundary).toBeVisible();
    await expect(firstBoundary).toHaveValue('0%');
    await expect(layer(page, host, destination)).toHaveCSS('display', 'block');
  });
}
