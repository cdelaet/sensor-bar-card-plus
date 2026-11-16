const { test, expect } = require('@playwright/test');

const hosts = ['Card', 'Entity', 'Feature'];
const destinations = ['bar', 'baseline-above', 'baseline-below', 'target-above', 'target-below'];
const pathFor = destination => destination === 'bar' ? ['bar', 'paint']
  : destination === 'target-above' ? ['target', 'when_above', 'paint']
    : destination === 'target-below' ? ['target', 'when_below', 'paint']
      : ['baseline', destination.slice(9), 'paint'];
const set = (config, path, value) => {
  let target = config;
  for (const key of path.slice(0, -1)) target = target[key] ??= {};
  target[path.at(-1)] = value;
};

async function mount(page, source, host, destination, paint, parentPaint, presets) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  const config = { type: host === 'Feature' ? 'custom:sensor-bar-card-plus-feature' : 'custom:sensor-bar-card-plus',
    scale: { min: 0, max: 100 }, bar: { animated: false }, baseline: { at: 50 }, target: { at: 60 }, future: { keep: true },
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
    const states = { 'sensor.power': { entity_id: 'sensor.power', state: ['baseline-below', 'target-below'].includes(destination) ? '20' : '80', attributes: {} } };
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
    const bar = editor.locator('#entity-0-group-bar');
    if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
    await expect(bar).toHaveAttribute('aria-expanded', 'true');
    await expect(bar.locator('..').locator(':scope > .override-group-body')).toBeVisible();
  }
  if (destination !== 'bar') {
    const target = destination.startsWith('target-');
    const group = editor.locator(target ? (entity ? '#entity-0-group-target' : '#card-group-marker-target') : (entity ? '#entity-0-group-baseline' : '#card-group-baseline'));
    if (await group.getAttribute('aria-expanded') === 'false') await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(group.locator('..').locator(':scope > .override-group-body')).toBeVisible();
  }
  if (destination.startsWith('target-')) {
    const direction = destination.slice('target-'.length);
    const targetSection = editor.locator(`#card-group-${entity ? 'entity-0-' : ''}target-${direction}`);
    if (await targetSection.getAttribute('aria-expanded') === 'false') await targetSection.click();
    await expect(targetSection).toHaveAttribute('aria-expanded', 'true');
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
  return runtime.locator(`.bar-paint-layer[data-layer="${destination === 'bar' ? 'base' : destination === 'target-above' ? 'above-target' : destination === 'target-below' ? 'below-target' : destination}"]`);
}

for (const source of ['src', 'dist']) for (const host of hosts) for (const destination of destinations) {
  test(`${host} ${destination} distinguishes inherited, None and named preset selection (${source})`, async ({ page }) => {
    const presets = {
      warm: { fill_style: 'gradient', opacity: 35,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
      cool: { fill_style: 'solid', color: '#123456' },
    };
    const editor = await mount(page, source, host, destination,
      host === 'Entity' ? { opacity: 60 } : { preset: 'warm', opacity: 60 },
      host === 'Entity' ? { preset: 'warm' } : undefined, presets);
    const paint = await openPaint(editor, host, destination);
    if (destination.startsWith('target-')) await paint.evaluate(node => { window.__targetPresetPaintNode = node; });
    await expect(paint.locator('[data-action="reset-paint"]')).toHaveText(host === 'Entity'
      ? 'Reset to Card paint settings' : 'Reset to default paint settings');
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset).toBeVisible();
    await expect(preset).toHaveValue(host === 'Entity' ? '__paint_preset_inherited__' : 'warm');
    await expect(paint.locator('[data-paint-property="fill_style"]')).toHaveValue('gradient');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.6');
    let before;
    if (host === 'Entity') {
      page.once('dialog', dialog => dialog.dismiss());
      await preset.selectOption('warm');
      await expect(preset).toHaveValue('__paint_preset_inherited__');
      expect(await savedPaint(page, host, destination)).toEqual({ opacity: 60 });
      page.once('dialog', dialog => dialog.accept());
      await preset.selectOption('warm');
      await expect.poll(() => savedPaint(page, host, destination)).toEqual({ preset: 'warm' });
      await expect(preset).toHaveValue('warm');
      await paint.locator('[data-paint-property="opacity"]').fill('60');
      before = await savedPaint(page, host, destination);
    } else {
      before = await savedPaint(page, host, destination);
      const events = await page.evaluate(() => window.__paintEvents.length);
      await preset.selectOption('warm');
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events);
      expect(await savedPaint(page, host, destination)).toEqual(before);
    }
    const localEvents = await page.evaluate(() => window.__paintEvents.length);
    await preset.selectOption('warm');
    expect(await page.evaluate(() => window.__paintEvents.length)).toBe(localEvents);
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
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ preset: null, opacity: 0 });
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0');
    if (destination.startsWith('target-')) expect(await paint.evaluate(node => node === window.__targetPresetPaintNode)).toBe(true);
  });

  test(`${host} ${destination} None explicitly suppresses presets and refreshes effective Paint (${source})`, async ({ page }) => {
    const editor = await mount(page, source, host, destination, { preset: 'warm' },
      host === 'Entity' ? { fill_style: 'solid', color: '#08aabb', opacity: 80 } : undefined,
      { warm: { fill_style: 'solid', color: '#ee1234', opacity: 40 } });
    const paint = await openPaint(editor, host, destination);
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset).toHaveValue('warm');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.4');
    await preset.focus();
    await preset.selectOption('');
    await preset.press('Tab');
    expect((await savedPaint(page, host, destination))?.preset).toBeNull();
    await expect(preset).toHaveValue('');
    await expect(paint.locator('[data-paint-property="opacity"]')).toHaveValue(host === 'Entity' ? '80' : '100');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', host === 'Entity' ? '0.8' : '1');
    await expect(paint.locator('.paint-editor-description')).not.toContainText('warm');
    const previewPaint = await paint.locator('.paint-editor-swatch').evaluate(node => getComputedStyle(node).backgroundImage);
    await expect(layer(page, host, destination)).toHaveCSS('background-image', previewPaint);
  });

  test(`${host} ${destination} None retains authored properties and resolves the inherited preset (${source})`, async ({ page }) => {
    const authored = { fill_style: 'solid', color: '#11aa44', opacity: 65, solid_fill: true,
      segments: [{ from: '0%', to: '100%', color: '#123456' }],
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] };
    const editor = await mount(page, source, host, destination, { preset: 'warm', ...authored },
      host === 'Entity' ? { preset: 'parent' } : undefined,
      { warm: { fill_style: 'gradient', color: '#ee1234', opacity: 40 },
        parent: { fill_style: 'solid', color: '#08aabb', opacity: 80 } });
    const paint = await openPaint(editor, host, destination);
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset).toHaveValue('warm');
    await preset.focus(); await preset.selectOption(''); await preset.press('Tab');
    expect(await savedPaint(page, host, destination)).toEqual({ ...authored, preset: null });
    await expect(preset).toHaveValue('');
    await expect(paint.locator('input[type="color"][data-paint-property="color"]')).toHaveValue('#11aa44');
    await expect(paint.locator('[data-paint-property="opacity"]')).toHaveValue('65');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.65');
    await expect(layer(page, host, destination)).toHaveCSS('background-image',
      'linear-gradient(to right, rgb(17, 170, 68) 0%, rgb(17, 170, 68) 100%)');
    await expect(paint.locator('.paint-editor-description')).not.toContainText('warm');
  });

  if (host === 'Entity') test(`${host} ${destination} keeps Inherited, None and named references distinct (${source})`, async ({ page }) => {
    const parent = { preset: 'Hot-to-Cold' };
    const presets = {
      'Temperature Colors': { fill_style: 'solid', color: '#11aa44' },
      'Hot-to-Cold': { fill_style: 'gradient', opacity: 40,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
    };
    const editor = await mount(page, source, host, destination,
      { preset: 'Temperature Colors', color: '#aa2244', opacity: 70 }, parent, presets);
    const paint = await openPaint(editor, host, destination);
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset.locator('option').nth(0)).toHaveAttribute('value', '__paint_preset_inherited__');
    await expect(preset.locator('option').nth(0)).toHaveText('Inherited (Hot-to-Cold)');
    await expect(preset.locator('option').nth(1)).toHaveAttribute('value', '');
    await expect(preset.locator('option').nth(1)).toHaveText('None');
    await expect(preset).toHaveValue('Temperature Colors');

    // Inherited removes only the local reference and keeps its property values.
    await preset.selectOption('__paint_preset_inherited__');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ color: '#aa2244', opacity: 70 });
    await expect(preset).toHaveValue('__paint_preset_inherited__');
    await expect(paint.locator('[data-paint-property="opacity"]')).toHaveValue('70');

    // None writes null and keeps local fields as the Card preset changes.
    await preset.selectOption('');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ color: '#aa2244', opacity: 70, preset: null });
    await expect(preset).toHaveValue('');
    const updated = await page.evaluate(() => structuredClone(window.__paintConfig));
    set(updated, pathFor(destination), { preset: 'Temperature Colors' });
    await page.evaluate(async next => {
      window.__paintConfig = structuredClone(next);
      const editor = document.querySelector('sensor-bar-card-plus-editor');
      const runtime = document.querySelector('sensor-bar-card-plus');
      editor.setConfig(next); runtime.setConfig(next);
      await Promise.all([editor.updateComplete, runtime.updateComplete]);
    }, updated);
    await expect(preset).toHaveValue('');
    await expect(paint.locator('[data-paint-property="opacity"]')).toHaveValue('70');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.7');

    // Selecting the now-inherited name creates a local reference.
    page.once('dialog', dialog => dialog.accept());
    await preset.selectOption('Temperature Colors');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ preset: 'Temperature Colors' });
    const changedAgain = await page.evaluate(() => structuredClone(window.__paintConfig));
    set(changedAgain, pathFor(destination), parent);
    await page.evaluate(async next => {
      window.__paintConfig = structuredClone(next);
      const editor = document.querySelector('sensor-bar-card-plus-editor');
      const runtime = document.querySelector('sensor-bar-card-plus');
      editor.setConfig(next); runtime.setConfig(next);
      await Promise.all([editor.updateComplete, runtime.updateComplete]);
    }, changedAgain);
    await expect(preset).toHaveValue('Temperature Colors');
    await expect(layer(page, host, destination)).toHaveCSS('background-image',
      'linear-gradient(to right, rgb(17, 170, 68) 0%, rgb(17, 170, 68) 100%)');
  });

  if (host === 'Entity') test(`${host} ${destination} Inherited preserves local properties and follows Card preset changes (${source})`, async ({ page }) => {
    const parent = { preset: 'Hot-to-Cold', color: '#778899' };
    const authored = { preset: 'Temperature Colors', color: '#aa2244', opacity: 70 };
    const editor = await mount(page, source, host, destination, authored, parent, {
      'Temperature Colors': { fill_style: 'solid', color: '#11aa44' },
      'Hot-to-Cold': { fill_style: 'gradient', opacity: 40,
        gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] },
    });
    const paint = await openPaint(editor, host, destination);
    const preset = paint.locator('[data-paint-preset="true"]');
    await preset.focus();
    await paint.evaluate(node => { window.__inheritedPresetNodes = [node,
      node.querySelector('[data-paint-preset="true"]'), node.querySelector('[data-paint-property="opacity"]')]; });
    await preset.selectOption('__paint_preset_inherited__');
    await expect.poll(() => savedPaint(page, host, destination)).toEqual({ color: '#aa2244', opacity: 70 });
    await expect(preset).toBeFocused();
    expect(await paint.evaluate(node => node === window.__inheritedPresetNodes[0]
      && window.__inheritedPresetNodes.every(item => item?.isConnected))).toBe(true);
    const next = await page.evaluate(() => structuredClone(window.__paintConfig));
    set(next, pathFor(destination), { preset: 'Temperature Colors', color: '#778899' });
    await page.evaluate(async config => {
      window.__paintConfig = structuredClone(config);
      const editor = document.querySelector('sensor-bar-card-plus-editor');
      const runtime = document.querySelector('sensor-bar-card-plus');
      editor.setConfig(config); runtime.setConfig(config);
      await Promise.all([editor.updateComplete, runtime.updateComplete]);
    }, next);
    await expect(preset).toHaveValue('__paint_preset_inherited__');
    await expect(preset.locator('option').first()).toHaveText('Inherited (Temperature Colors)');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.7');
  });

  if (host === 'Card') test(`${host} ${destination} None preserves mounted controls, disclosures, focus and scroll (${source})`, async ({ page }) => {
    const authored = { fill_style: 'gradient', color: '#11aa44', opacity: 65, solid_fill: false,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }] };
    const editor = await mount(page, source, host, destination, { preset: 'warm', ...authored }, undefined,
      { warm: { fill_style: 'solid', color: '#ee1234' } });
    const paint = await openPaint(editor, host, destination);
    const disclosure = paint.locator('button[data-group$="gradient-stops"]');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    const preset = paint.locator('[data-paint-preset="true"]');
    await editor.evaluate(node => {
      const container = node.parentElement; container.style.height = '500px'; container.style.overflow = 'auto';
      const before = document.createElement('div'); before.style.height = '850px';
      const after = document.createElement('div'); after.style.height = '1600px';
      container.prepend(before); container.append(after); window.__noneScrollContainer = container;
    });
    await preset.scrollIntoViewIfNeeded();
    await preset.focus();
    await paint.evaluate(node => { window.__noneMounted = [node,
      node.querySelector('[data-paint-preset="true"]'), node.querySelector('[data-paint-property="opacity"]'),
      node.querySelector('button[data-group$="gradient-stops"]'), node.querySelector('[data-kind="gradient-pos"]')]; });
    const before = await page.evaluate(() => ({ scroll: window.__noneScrollContainer.scrollTop,
      top: window.__noneMounted[1].getBoundingClientRect().top, events: window.__paintEvents.length }));
    await preset.selectOption('');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await paint.evaluate(node => node === window.__noneMounted[0] && window.__noneMounted.every(node => node?.isConnected))).toBe(true);
    await expect(preset).toBeFocused();
    await expect(preset).toHaveValue('');
    await expect(paint).toHaveJSProperty('open', true);
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(disclosure.locator('..').locator(':scope > .override-group-body')).toBeVisible();
    const after = await page.evaluate(() => ({ scroll: window.__noneScrollContainer.scrollTop,
      top: window.__noneMounted[1].getBoundingClientRect().top, events: window.__paintEvents.length }));
    expect(Math.abs(after.scroll - before.scroll)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
    expect(after.events).toBe(before.events + 1);
    expect(await savedPaint(page, host, destination)).toEqual({ ...authored, preset: null });
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.65');
    await expect(layer(page, host, destination)).toHaveCSS('background-image',
      'linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)');
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
    const gray = ['baseline-below', 'target-below'].includes(destination) ? 28 : 198;
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

// Focused follow-up: status must come from effective provenance, including after
// native edits, rather than palette shape or equality with the default palette.
for (const source of ['src', 'dist']) for (const host of hosts) for (const destination of destinations) {
  test(`Paint status stays consistent for ${host} ${destination} (${source})`, async ({ page }) => {
    const shared = { fill_style: 'gradient', color: '#123456', opacity: 35, solid_fill: false,
      segments: [{ from: '0%', to: '30%', color: '#4CAF50' }, { from: '30%', to: '70%', color: '#FF9800' }, { from: '70%', to: '100%', color: '#F44336' }],
      gradient_stops: [{ pos: 0, color: '#4CAF50' }, { pos: 50, color: '#FF9800' }, { pos: 100, color: '#F44336' }] };
    let editor = await mount(page, source, host, destination, {}, undefined, { shared });
    await editor.evaluate(node => { node.style.setProperty('--secondary-text-color', '#556677'); node.style.setProperty('--accent-color', '#09aabb'); });
    let paint = await openPaint(editor, host, destination);
    const assertSource = async (property, text) => {
      const meta = paint.locator(`[data-paint-source="${property}"]`);
      await expect(meta).toHaveText(text);
      await expect(meta).toHaveCSS('color', text === 'Override' ? 'rgb(9, 170, 187)' : 'rgb(85, 102, 119)');
      await expect(paint.locator(`[data-action="clear-paint-property"][data-property="${property}"]`))
        [text === 'Local' || text === 'Override' ? 'toBeVisible' : 'toBeHidden']();
    };
    const properties = ['fill_style', 'color', 'solid_fill', 'opacity', 'segments', 'gradient_stops'];
    for (const property of properties) await assertSource(property, 'Default');
    const summary = palette => paint.locator(`button[data-group$="${palette}"]`).locator('.override-group-summary');
    if (host !== 'Entity') await expect(summary('segments')).toHaveText('Default bands');
    await paint.locator('[data-paint-property="fill_style"]').selectOption('gradient');
    await expect(paint.locator('[data-palette-inactive="gradient-stops"]')).toBeHidden();
    if (host === 'Entity' && destination.startsWith('baseline-')) {
      await expect(editor.locator('#entity-0-group-baseline').locator('..')).not.toHaveClass(/is-inactive/);
    }
    if (host !== 'Entity') {
      await expect(summary('gradient-stops')).toHaveText('Default gradient');
      await expect(paint.locator('button[data-group$="gradient-stops"]').locator('..')).not.toHaveClass(/is-inactive/);
      const disclosure = paint.locator('button[data-group$="gradient-stops"]');
      await disclosure.click();
      await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
      await expect(disclosure.locator('..').locator(':scope > .override-group-body')).toBeVisible();
    }
    await paint.locator('[data-paint-property="opacity"]').fill('75');
    await assertSource('opacity', 'Local');
    await paint.locator('[data-action="clear-paint-property"][data-property="opacity"]').click();
    await assertSource('opacity', 'Default');
    page.once('dialog', dialog => dialog.accept());
    await paint.locator('[data-paint-preset="true"]').selectOption('shared');
    for (const property of properties) await assertSource(property, 'Preset');
    if (host !== 'Entity') {
      await expect(summary('segments')).toHaveText('Preset · 3 segments');
      await expect(summary('gradient-stops')).toHaveText('Preset · 3 stops');
    }
    await paint.locator('[data-paint-property="opacity"]').fill('75');
    await assertSource('opacity', 'Override');
    await expect(layer(page, host, destination)).toHaveCSS('opacity', '0.75');
    await paint.locator('[data-action="clear-paint-property"][data-property="opacity"]').click();
    await assertSource('opacity', 'Preset');
    if (host === 'Entity') {
      editor = await mount(page, source, host, destination, {}, { preset: 'shared' }, { shared });
      await editor.evaluate(node => { node.style.setProperty('--secondary-text-color', '#556677'); node.style.setProperty('--accent-color', '#09aabb'); });
      paint = await openPaint(editor, host, destination);
      for (const property of properties) await assertSource(property, 'Inherited');
      await paint.locator('[data-paint-property="opacity"]').fill('75');
      await assertSource('opacity', 'Override');
      await paint.locator('[data-action="clear-paint-property"][data-property="opacity"]').click();
      await assertSource('opacity', 'Inherited');
    }
  });
}

for (const source of ['src', 'dist']) for (const destination of destinations.slice(1)) {
  test(`Paint activation retains Feature controls and scroll for ${destination} (${source})`, async ({ page }) => {
    const editor = await mount(page, source, 'Feature', destination, null);
    const paint = await openPaint(editor, 'Feature', destination);
    const checkbox = paint.getByLabel('Enable Paint', { exact: true });
    await editor.evaluate(node => {
      const container = node.parentElement;
      container.style.height = '500px';
      container.style.overflow = 'auto';
      const before = document.createElement('div'); before.style.height = '850px';
      const after = document.createElement('div'); after.style.height = '1600px';
      container.prepend(before); container.append(after);
      window.__scrollContainer = container;
      window.__mountedPaint = node.shadowRoot.querySelector('.paint-editor');
    });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.evaluate(node => { window.__paintCheckbox = node; });
    const before = await page.evaluate(() => ({ scroll: window.__scrollContainer.scrollTop,
      top: window.__paintCheckbox.getBoundingClientRect().top }));
    for (const enabled of [true, false, true]) {
      const events = await page.evaluate(() => window.__paintEvents.length);
      await checkbox.setChecked(enabled);
      await expect.poll(() => savedPaint(page, 'Feature', destination)).toEqual(enabled ? {} : null);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await checkbox.evaluate(node => node === window.__paintCheckbox)).toBe(true);
      expect(await editor.evaluate(node => node.shadowRoot.querySelector('.paint-editor') === window.__mountedPaint)).toBe(true);
      if (enabled) await paint.evaluate(node => {
        const groups = [...node.querySelectorAll('.override-group-toggle')];
        if (!window.__mountedPaletteGroups) window.__mountedPaletteGroups = groups;
        else if (!groups.every((group, index) => group === window.__mountedPaletteGroups[index])) throw Error('Paint disclosures were replaced');
      });
      expect(await page.evaluate(() => window.__paintEvents.length)).toBe(events + 1);
      const after = await page.evaluate(() => ({ scroll: window.__scrollContainer.scrollTop,
        top: window.__paintCheckbox.getBoundingClientRect().top }));
      expect(Math.abs(after.scroll - before.scroll)).toBeLessThanOrEqual(1);
      expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
      await expect(paint.locator('[data-paint-property="fill_style"]'))[enabled ? 'toBeVisible' : 'toBeHidden']();
    }
    const disclosure = paint.locator('button[data-group$="gradient-stops"]');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(disclosure.locator('..').locator(':scope > .override-group-body')).toBeVisible();
    await expect(paint.locator('[data-kind="gradient-pos"]').first()).toBeVisible();
  });
}

for (const source of ['src', 'dist']) test(`Entity Bar None uses the same default Paint in the editor and runtime (${source})`, async ({ page }) => {
  const presets = {
    'Hot-to-Cold': { fill_style: 'gradient', opacity: 40,
      gradient_stops: [{ pos: 0, color: '#112233' }, { pos: 100, color: '#445566' }] },
  };
  const editor = await mount(page, source, 'Entity', 'bar', { opacity: 65 }, { preset: 'Hot-to-Cold' }, presets);
  const paint = await openPaint(editor, 'Entity', 'bar');
  const preset = paint.locator('[data-paint-preset="true"]');
  const inherit = editor.locator('#entity-0-bar-inherit');
  await expect(inherit).not.toBeChecked();
  await editor.evaluate(node => {
    const container = node.parentElement; container.style.height = '500px'; container.style.overflow = 'auto';
    const before = document.createElement('div'); before.style.height = '850px';
    const after = document.createElement('div'); after.style.height = '1600px';
    container.prepend(before); container.append(after); window.__entityNoneScroll = container;
  });
  await preset.scrollIntoViewIfNeeded();
  await preset.focus();
  await paint.evaluate(node => { window.__entityNoneMounted = [node,
    node.querySelector('[data-paint-preset="true"]'), node.querySelector('[data-paint-property="fill_style"]'),
    node.querySelector('[data-paint-property="opacity"]'), node.querySelector('.paint-editor-swatch')]; });
  const beforeNone = await page.evaluate(() => ({ scroll: window.__entityNoneScroll.scrollTop,
    top: window.__entityNoneMounted[1].getBoundingClientRect().top, events: window.__paintEvents.length }));
  await preset.selectOption('');
  await expect.poll(() => savedPaint(page, 'Entity', 'bar')).toEqual({ opacity: 65, preset: null });
  await expect(preset).toBeFocused();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const afterNone = await page.evaluate(() => ({
    options: [...document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor [data-paint-preset="true"]').options].map(option => option.textContent),
    editorPaint: getComputedStyle(document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor .paint-editor-swatch')).backgroundImage,
    editorOpacity: getComputedStyle(document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor .paint-editor-swatch')).opacity,
    runtimePaint: getComputedStyle(document.querySelector('sensor-bar-card-plus')
      .shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]')).backgroundImage,
    runtimeOpacity: getComputedStyle(document.querySelector('sensor-bar-card-plus')
      .shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]')).opacity,
    inherit: document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-bar-inherit').checked,
    summary: document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-group-bar-summary').textContent,
    fillStyle: document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor [data-paint-property="fill_style"]').value,
    selectedPreset: document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor [data-paint-preset="true"]').value,
    opacitySource: document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor [data-paint-source="opacity"]').textContent,
    events: window.__paintEvents.length,
    scroll: window.__entityNoneScroll.scrollTop,
    top: window.__entityNoneMounted[1].getBoundingClientRect().top,
    mounted: window.__entityNoneMounted.every(node => node?.isConnected)
      && window.__entityNoneMounted[0] === document.querySelector('sensor-bar-card-plus-editor').shadowRoot.querySelector('#entity-0-paint-editor'),
  }));
  const fillStyle = paint.locator('[data-paint-property="fill_style"]');
  await fillStyle.selectOption('bands');
  await expect.poll(() => savedPaint(page, 'Entity', 'bar')).toEqual({ opacity: 65, preset: null, fill_style: 'bands' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const afterBands = await page.evaluate(() => ({
    editorPaint: getComputedStyle(document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor .paint-editor-swatch')).backgroundImage,
    editorOpacity: getComputedStyle(document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor .paint-editor-swatch')).opacity,
    runtimePaint: getComputedStyle(document.querySelector('sensor-bar-card-plus')
      .shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]')).backgroundImage,
    runtimeOpacity: getComputedStyle(document.querySelector('sensor-bar-card-plus')
      .shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]')).opacity,
    events: window.__paintEvents.length,
    mounted: window.__entityNoneMounted.every(node => node?.isConnected)
      && window.__entityNoneMounted[0] === document.querySelector('sensor-bar-card-plus-editor').shadowRoot.querySelector('#entity-0-paint-editor'),
  }));
  const hasDefaultPalette = value => ['rgb(76, 175, 80)', 'rgb(255, 152, 0)', 'rgb(244, 67, 54)']
    .every(color => value.includes(color));
  expect({
    unavailableEmptyName: afterNone.options.some(option => option.includes('(empty name) (unavailable)')),
    editorShowsDefaultPalette: hasDefaultPalette(afterNone.editorPaint),
    runtimeShowsDefaultPaletteAfterNone: hasDefaultPalette(afterNone.runtimePaint),
    runtimeMatchesEditorAfterNone: afterNone.runtimePaint === afterNone.editorPaint,
    runtimeOpacityAfterNone: afterNone.runtimeOpacity,
    editorOpacityAfterNone: afterNone.editorOpacity,
    inheritedCheckbox: afterNone.inherit,
    barSummary: afterNone.summary,
    fillStyleAfterNone: afterNone.fillStyle,
    selectedPresetAfterNone: afterNone.selectedPreset,
    opacitySourceAfterNone: afterNone.opacitySource,
    noneConfigEcho: afterNone.events - beforeNone.events,
    noneScrollStable: Math.abs(afterNone.scroll - beforeNone.scroll) <= 1 && Math.abs(afterNone.top - beforeNone.top) <= 1,
    mountedAfterNone: afterNone.mounted,
    editorShowsDefaultPaletteAfterBands: hasDefaultPalette(afterBands.editorPaint),
    runtimeShowsDefaultPaletteAfterBands: hasDefaultPalette(afterBands.runtimePaint),
    runtimeMatchesEditorAfterBands: afterBands.runtimePaint === afterBands.editorPaint,
    runtimeOpacityAfterBands: afterBands.runtimeOpacity,
    editorOpacityAfterBands: afterBands.editorOpacity,
    bandsConfigEcho: afterBands.events - afterNone.events,
    mountedAfterBands: afterBands.mounted,
  }).toEqual({
    unavailableEmptyName: false,
    editorShowsDefaultPalette: true,
    runtimeShowsDefaultPaletteAfterNone: true,
    runtimeMatchesEditorAfterNone: true,
    runtimeOpacityAfterNone: '0.65',
    editorOpacityAfterNone: '0.65',
    inheritedCheckbox: false,
    barSummary: 'Custom row settings',
    fillStyleAfterNone: 'bands',
    selectedPresetAfterNone: '',
    opacitySourceAfterNone: 'Local',
    noneConfigEcho: 1,
    noneScrollStable: true,
    mountedAfterNone: true,
    editorShowsDefaultPaletteAfterBands: true,
    runtimeShowsDefaultPaletteAfterBands: true,
    runtimeMatchesEditorAfterBands: true,
    runtimeOpacityAfterBands: '0.65',
    editorOpacityAfterBands: '0.65',
    bandsConfigEcho: 1,
    mountedAfterBands: true,
  });
});

for (const source of ['src', 'dist']) test(`Entity Bar inheritance clears local Paint and restores the Card preset (${source})`, async ({ page }) => {
  const presets = {
    night: { fill_style: 'gradient', opacity: 40,
      gradient_stops: [{ pos: 0, color: '#112233' }, { pos: 100, color: '#445566' }] },
  };
  const localStops = [{ pos: 0, color: '#cc1122' }, { pos: 100, color: '#dd3344' }];
  const editor = await mount(page, source, 'Entity', 'bar', {
    segments: [{ from: '0%', to: '100%', color: '#123456' }], gradient_stops: localStops, opacity: 65,
  }, { preset: 'night' }, presets);
  const paint = await openPaint(editor, 'Entity', 'bar');
  const inherit = editor.locator('#entity-0-bar-inherit');
  const summary = editor.locator('#entity-0-group-bar-summary');
  const before = await page.evaluate(() => ({
    config: structuredClone(window.__paintConfig.entities[0]),
    checked: document.querySelector('sensor-bar-card-plus-editor').shadowRoot.querySelector('#entity-0-bar-inherit').checked,
    summary: document.querySelector('sensor-bar-card-plus-editor').shadowRoot.querySelector('#entity-0-group-bar-summary').textContent,
    entityPaint: getComputedStyle(document.querySelector('sensor-bar-card-plus-editor').shadowRoot
      .querySelector('#entity-0-paint-editor .paint-editor-swatch')).backgroundImage,
  }));
  await inherit.click();
  await expect.poll(() => page.evaluate(() => window.__paintEvents.length)).toBe(1);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const after = await page.evaluate(() => {
    const editor = document.querySelector('sensor-bar-card-plus-editor');
    const runtime = document.querySelector('sensor-bar-card-plus');
    const paint = editor.shadowRoot.querySelector('#entity-0-paint-editor');
    return {
      config: structuredClone(window.__paintConfig.entities[0]),
      checked: editor.shadowRoot.querySelector('#entity-0-bar-inherit').checked,
      summary: editor.shadowRoot.querySelector('#entity-0-group-bar-summary').textContent,
      selectedPreset: paint.querySelector('[data-paint-preset="true"]').value,
      fillStyle: paint.querySelector('[data-paint-property="fill_style"]').value,
      opacity: paint.querySelector('[data-paint-property="opacity"]').value,
      gradientStopsSource: paint.querySelector('[data-paint-source="gradient_stops"]').textContent,
      editorPaint: getComputedStyle(paint.querySelector('.paint-editor-swatch')).backgroundImage,
      runtimePaint: getComputedStyle(runtime.shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]')).backgroundImage,
      unrelatedEntityData: [window.__paintConfig.entities[0].name, window.__paintConfig.entities[0].future],
    };
  });
  const includesCardPreset = value => ['rgb(17, 34, 51)', 'rgb(68, 85, 102)'].every(color => value.includes(color));
  expect({
    initialLocalBar: before.config.bar,
    initiallyUnchecked: before.checked === false,
    initialSummary: before.summary,
    initialPaintWasLocal: before.entityPaint.includes('rgb(204, 17, 34)'),
    resultingConfig: after.config,
    localBarRemoved: !Object.hasOwn(after.config, 'bar'),
    inheritanceChecked: after.checked,
    inheritedSummary: after.summary,
    selectedPreset: after.selectedPreset,
    fillStyle: after.fillStyle,
    opacity: after.opacity,
    gradientStopsSource: after.gradientStopsSource,
    editorShowsCardPreset: includesCardPreset(after.editorPaint),
    runtimeShowsCardPreset: includesCardPreset(after.runtimePaint),
    editorMatchesRuntime: after.editorPaint === after.runtimePaint,
    unrelatedEntityData: after.unrelatedEntityData,
  }).toEqual({
    initialLocalBar: { paint: { segments: [{ from: '0%', to: '100%', color: '#123456' }], gradient_stops: localStops, opacity: 65 } },
    initiallyUnchecked: true,
    initialSummary: 'Custom row settings',
    initialPaintWasLocal: true,
    resultingConfig: { entity: 'sensor.power', future: true },
    localBarRemoved: true,
    inheritanceChecked: true,
    inheritedSummary: 'Inherited',
    selectedPreset: '__paint_preset_inherited__',
    fillStyle: 'gradient',
    opacity: '40',
    gradientStopsSource: 'Inherited',
    editorShowsCardPreset: true,
    runtimeShowsCardPreset: true,
    editorMatchesRuntime: true,
    unrelatedEntityData: [undefined, true],
  });
});

for (const source of ['src', 'dist']) test(`Target None retains local gradient stops with a legacy Needle Bar (${source})`, async ({ page }) => {
  const { mount: mountTarget, openTarget } = require('./target-test-utils.cjs');
  const config = { title: 'Animated sensor preview', entities: [{ entity: 'sensor.sbcp_playground_sensor', name: 'Sensor' }],
    scale: { min: { entity: 'sensor.sbcp_playground_scale_min' }, max: { entity: 'sensor.sbcp_playground_scale_max' } },
    target: { enabled: true, at: { fixed: 1, entity: 'sensor.sbcp_playground_target' }, color: '#f5ec00', label: { show: true },
      when_above: { paint: { preset: 'Hot-to-Cold', solid_fill: false,
        gradient_stops: [{ pos: 0, color: '#ff2600' }, { pos: 50, color: '#ff40ff' }, { pos: 100, color: '#0433ff' }] },
        marker: { color: '#77bb41', shape: 'triangle', direction: 'inward' }, at: { fixed: 70 } },
      when_below: { paint: { preset: 'Temperature Colors' }, marker: { color: '#008cb4', direction: 'outward', shape: 'triangle' }, at: { fixed: 30 } } },
    peak: { enabled: true }, layout: { label: { position: 'left', width: 150 } }, bar: { fill_style: 'gradient', needle: { show: true } } };
  const { editor, runtime } = await mountTarget(page, source, 'Card', config, 90, 420, {
    'Temperature Colors': { segments: [{ from: 5, to: 10, color: '#3949AB' }, { from: 10, to: 15, color: '#1E88E5' }] },
    'Hot-to-Cold': { fill_style: 'gradient', gradient_stops: [{ pos: 0, color: '#ff2600' }, { pos: 50, color: '#77bb41' }, { pos: 100, color: '#0433ff' }] },
  });
  await page.evaluate(() => {
    const states = { 'sensor.sbcp_playground_sensor': '90', 'sensor.sbcp_playground_scale_min': '0',
      'sensor.sbcp_playground_scale_max': '100', 'sensor.sbcp_playground_target': '50' };
    window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states,
      ...Object.fromEntries(Object.entries(states).map(([key, state]) => [key, { state, attributes: {} }])) } };
    document.querySelector('sensor-bar-card-plus').hass = window.__targetHass;
    document.querySelector('sensor-bar-card-plus-editor').hass = window.__targetHass;
  });
  await openTarget(editor, 'Card', ['above']);
  const paint = editor.locator('#target-above-paint-editor');
  await paint.locator(':scope > summary').click();
  const preset = paint.locator('[data-paint-preset="true"]');
  await expect(preset).toHaveValue('Hot-to-Cold');
  await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
  await preset.focus(); await preset.selectOption(''); await preset.press('Tab');
  expect((await page.evaluate(() => window.__targetConfig)).target.when_above.paint.preset).toBeNull();
  await expect(preset).toHaveValue('');
});
