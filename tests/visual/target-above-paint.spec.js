const { test, expect } = require('@playwright/test');
const { openTarget, mount } = require('./target-test-utils.cjs');

const saved = page => page.evaluate(() => window.__targetConfig);
const targetLayer = runtime => runtime.locator('.bar-paint-layer[data-layer="above-target"]');
const belowTargetLayer = runtime => runtime.locator('.bar-paint-layer[data-layer="below-target"]');

for (const source of ['src', 'dist']) for (const host of ['Card', 'Entity', 'Feature']) {
  test(`${host}/${source}: sustained typing, disclosure and focus survive echoes and replacements`, async ({ page }) => {
    const { editor } = await mount(page, source, host);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    await openTarget(editor, host, ['shared']);
    await expect(editor.locator(`#${prefix}target-shape`)).not.toBeVisible();
    await expect(editor.locator(`#${prefix}target-label-text`)).not.toBeVisible();
    await expect(editor.locator(`#card-group-${prefix}target-below`)).toHaveAttribute('aria-expanded', 'false');
    await expect(editor.locator('[id*="independent-threshold"], [id*="target-above-fill"]')).toHaveCount(0);
    await openTarget(editor, host);
    const input = editor.locator(`#${prefix}target-value`);
    await input.evaluate(node => { window.__thresholdNode = node; });
    await input.focus(); await input.press('ControlOrMeta+A'); await input.press('Backspace');
    for (const key of '75') {
      await page.keyboard.type(key);
      await expect(input).toBeFocused();
      expect(await input.evaluate(node => node === window.__thresholdNode)).toBe(true);
    }
    const label = editor.locator(`#${prefix}target-label-text`);
    await label.evaluate(node => { window.__labelNode = node; });
    await label.focus(); await label.press('ControlOrMeta+A');
    for (const key of 'Upper goal') {
      await page.keyboard.type(key);
      await expect(label).toBeFocused();
      expect(await label.evaluate(node => node === window.__labelNode)).toBe(true);
    }
    const edited = await saved(page), scope = host === 'Entity' ? edited.entities[0] : edited;
    expect(scope.target.at).toEqual({ fixed: 75, entity: 'sensor.goal', ...(host === 'Entity' ? {} : { future: true }) });
    expect(scope.target.label.text).toBe('Upper goal');
    await expect(label.locator('..').locator('[data-target-source]')).toHaveText(host === 'Entity' ? 'Override' : 'Local');
    const eventCount = await page.evaluate(() => window.__targetEvents.length);
    await page.evaluate(({ host }) => {
      const next = structuredClone(window.__targetConfig), target = host === 'Entity' ? next.entities[0].target : next.target;
      target.at = { fixed: 45 }; target.color = 'blue'; target.label = { show: true, text: 'External', precision: 2 };
      window.__replaceTarget(next);
    }, { host });
    await expect(input).toHaveValue('45'); await expect(label).toHaveValue('External');
    expect(await input.evaluate(node => node === window.__thresholdNode)).toBe(true);
    expect(await label.evaluate(node => node === window.__labelNode)).toBe(true);
    await expect(label).toBeFocused();
    await expect(editor.locator(`#${prefix}target-color`).locator('..').locator('input[type="text"]')).toHaveCount(1);
    await expect(editor.locator(`#${prefix}target-color-text-fallback`)).toHaveValue('blue');
    await expect(editor.locator(`#card-group-${prefix}target-labels`)).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => window.__targetEvents.length)).toBe(eventCount);
    expect((await saved(page)).future).toEqual({ keep: true });
  });

  test(`${host}/${source}: null beats legacy aliases and entity canonical Paint keeps canonical activation`, async ({ page }) => {
    const config = { baseline: { at: 90 }, target: { at: 60, when_exceeded: { fill_color: 'red' }, when_above: { paint: null } } };
    const { editor, runtime } = await mount(page, source, host, config, 40);
    await expect(targetLayer(runtime)).toHaveCSS('display', 'none');
    await expect(runtime.locator('.target-marker')).toHaveCount(1);
    await expect(runtime.locator('.target-marker')).toHaveCSS('display', 'block');
    await page.evaluate(() => { const next = structuredClone(window.__targetConfig); delete next.target.when_above; window.__replaceTarget(next); });
    await expect(targetLayer(runtime)).toHaveCSS('display', 'block');
    await expect(targetLayer(runtime)).toHaveCSS('background-image', 'linear-gradient(to right, rgb(255, 0, 0) 0%, rgb(255, 0, 0) 100%)');
    if (host === 'Entity') {
      await page.evaluate(() => { const next = structuredClone(window.__targetConfig); next.entities[0].target = { when_above: { paint: { color: 'blue' } } }; window.__replaceTarget(next); });
    } else {
      await page.evaluate(() => { const next = structuredClone(window.__targetConfig); next.target.when_above = { paint: { color: 'blue' } }; window.__replaceTarget(next); });
    }
    await expect(targetLayer(runtime)).toHaveCSS('display', 'none');
    await openTarget(editor, host, ['above']);
    const paint = editor.locator(`#${host === 'Entity' ? 'entity-0-' : ''}target-above-paint-editor`);
    await paint.locator(':scope > summary').click();
    page.once('dialog', dialog => dialog.accept());
    await paint.locator('[data-action="reset-paint"]').click();
    await expect(targetLayer(runtime)).toHaveCSS('display', host === 'Entity' ? 'block' : 'none');
    expect((await saved(page)).target.at).toBe(60);
  });

  test(`${host}/${source}: shared-source-only updates patch one marker and clear/recover paint`, async ({ page }) => {
    const { runtime } = await mount(page, source, host);
    await expect(targetLayer(runtime)).toHaveCSS('display', 'block');
    await runtime.locator('.target-marker').evaluate(node => { window.__singleTargetMarker = node; });
    const update = value => page.evaluate(value => {
      const next = { ...window.__targetHass, states: { ...window.__targetHass.states, 'sensor.goal': { state: value, attributes: {} } } };
      window.__targetHass = next; document.querySelector('sensor-bar-card-plus, sensor-bar-card-plus-feature').hass = next;
    }, value);
    await update('90');
    await expect(targetLayer(runtime)).toHaveCSS('display', 'none');
    await expect(runtime.locator('.target-marker')).toHaveCSS('left', /.+/);
    expect(await runtime.locator('.target-marker').evaluate(node => node.style.left)).toBe('90%');
    await update('50');
    await expect(targetLayer(runtime)).toHaveCSS('display', 'block');
    expect(await runtime.locator('.target-marker').evaluate(node => node === window.__singleTargetMarker)).toBe(true);
    await expect(runtime.locator('.target-marker')).toHaveCount(1);
    await expect(runtime.locator('[data-layer="below-target"]')).toHaveCount(1);
    await expect(belowTargetLayer(runtime)).toHaveCSS('display', 'none');
    await expect(targetLayer(runtime)).toHaveCSS('opacity', '0.4');
    await expect(runtime.locator('.target-marker')).toHaveCSS('opacity', '1');
  });

  test(`${host}/${source}: Above palette edits stay isolated from Bar, Baseline and parent scope`, async ({ page }) => {
    const { editor } = await mount(page, source, host, { baseline: { at: 30, above: { paint: { color: 'green' } }, below: { paint: { color: 'blue' } } },
      bar: { animated: false, paint: { fill_style: 'gradient', opacity: 75,
        gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }] } } });
    const before = await saved(page);
    await openTarget(editor, host, ['above']);
    const paint = editor.locator(`#${host === 'Entity' ? 'entity-0-' : ''}target-above-paint-editor`);
    await paint.locator(':scope > summary').click();
    if (host !== 'Entity') await paint.locator('button[data-group="target-above-gradient-stops"]').click();
    const input = paint.locator('[data-kind="gradient-pos"], [data-kind="entity-gradient-pos"]').first();
    await input.fill('10'); await input.press('Tab');
    const after = await saved(page), scope = host === 'Entity' ? after.entities[0] : after;
    expect(scope.target.when_above.paint.gradient_stops).toEqual([{ pos: 10, color: '#000000' }, { pos: 100, color: '#ffffff' }]);
    expect(after.bar).toEqual(before.bar); expect(after.baseline).toEqual(before.baseline);
    if (host === 'Entity') expect(after.target).toEqual(before.target);
    else if (host === 'Card') expect(after.entities).toEqual(before.entities);
  });

  test(`${host}/${source}: activation preserves mounted Paint, disclosure and scroll`, async ({ page }) => {
    const { editor } = await mount(page, source, host, { target: { at: 60, when_above: { paint: null } } });
    await openTarget(editor, host, ['above']);
    const paint = editor.locator(`#${host === 'Entity' ? 'entity-0-' : ''}target-above-paint-editor`);
    await paint.locator(':scope > summary').click();
    const checkbox = paint.getByLabel('Enable Paint', { exact: true });
    await editor.evaluate(node => {
      const container = node.parentElement; container.style.height = '500px'; container.style.overflow = 'auto';
      const before = document.createElement('div'); before.style.height = '850px';
      const after = document.createElement('div'); after.style.height = '1600px';
      container.prepend(before); container.append(after); window.__targetScroll = container;
    });
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.evaluate(node => { window.__targetActivation = node; window.__targetPaintNode = node.closest('.paint-editor'); });
    const scroll = await page.evaluate(() => window.__targetScroll.scrollTop);
    for (const enabled of [true, false, true]) {
      await checkbox.setChecked(enabled);
      await expect(paint.locator('[data-paint-property="fill_style"]'))[enabled ? 'toBeVisible' : 'toBeHidden']();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await checkbox.evaluate(node => node === window.__targetActivation && node.closest('.paint-editor') === window.__targetPaintNode)).toBe(true);
      expect(Math.abs(await page.evaluate(() => window.__targetScroll.scrollTop) - scroll)).toBeLessThanOrEqual(1);
      await expect(paint).toHaveJSProperty('open', true);
      await expect(editor.locator(`#card-group-${host === 'Entity' ? 'entity-0-' : ''}target-above`)).toHaveAttribute('aria-expanded', 'true');
    }
  });

  test(`${host}/${source}: Below Paint uses its own collapsible destination and shared threshold`, async ({ page }) => {
    const target = { at: 60, when_above: { paint: { color: 'blue' } },
      when_below: { paint: { color: 'red', opacity: 45 } } };
    const { editor, runtime } = await mount(page, source, host, { target }, 20);
    await expect(belowTargetLayer(runtime)).toHaveCSS('display', 'block');
    await expect(belowTargetLayer(runtime)).toHaveCSS('opacity', '0.45');
    await expect(runtime.locator('.target-marker')).toHaveCount(1);
    await expect(targetLayer(runtime)).toHaveCSS('display', 'none');
    await page.evaluate(() => {
      window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states,
        'sensor.power': { ...window.__targetHass.states['sensor.power'], state: '70' } } };
      const card = document.querySelector('sensor-bar-card-plus, sensor-bar-card-plus-feature'); card.hass = window.__targetHass;
    });
    await expect(belowTargetLayer(runtime)).toHaveCSS('display', 'none');

    await openTarget(editor, host, ['below']);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    const group = editor.locator(`#card-group-${prefix}target-below`);
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    const paint = editor.locator(`#${prefix}target-below-paint-editor`);
    await expect(paint).toHaveCount(1);
    await paint.locator(':scope > summary').click();
    const color = paint.locator(`#${prefix}target-below-paint-color`);
    await color.fill('#008000');
    const config = await saved(page), scope = host === 'Entity' ? config.entities[0] : config;
    expect(scope.target.when_below.paint.color).toBe('#008000');
    expect(scope.target.when_below.paint.opacity).toBe(host === 'Entity' ? undefined : 45);
    expect((host === 'Entity' ? config.target : scope.target).when_above.paint.color).toBe('blue');
  });

  test(`${host}/${source}: Below-only preset selection renders without an Above preset (${source})`, async ({ page }) => {
    const { editor, runtime } = await mount(page, source, host, {
      target: { at: 60, when_below: { paint: {} } },
    }, 20, 240, { warm: { fill_style: 'solid', color: '#d02070' } });
    await openTarget(editor, host, ['below']);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    const paint = editor.locator(`#${prefix}target-below-paint-editor`);
    await paint.locator(':scope > summary').click();
    const preset = paint.locator('[data-paint-preset="true"]');
    await expect(preset.locator('option[value="warm"]')).toHaveCount(1);
    page.once('dialog', dialog => dialog.accept());
    await preset.selectOption('warm');
    const layer = runtime.locator('.bar-paint-layer[data-layer="below-target"]');
    await expect(layer).toHaveCSS('display', 'block');
    await expect(layer).toHaveCSS('background-image',
      'linear-gradient(to right, rgb(208, 32, 112) 0%, rgb(208, 32, 112) 100%)');
    expect((await saved(page)).target.when_above?.paint?.preset).toBeUndefined();
  });
}

for (const source of ['src', 'dist']) for (const scaleDirection of ['normal', 'reverse']) {
  test(`Needle Target Paint renders only the violating threshold-to-value interval (${source}, ${scaleDirection} Scale)`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', {
      bar: { needle: true }, scale: { direction: scaleDirection },
      target: { at: 60, when_above: { paint: { color: '#d02070' } }, when_below: { paint: { color: '#2080d0' } } },
    }, 50);
    const above = runtime.locator('.bar-paint-layer[data-layer="above-target"]');
    const below = runtime.locator('.bar-paint-layer[data-layer="below-target"]');
    const update = value => page.evaluate(value => {
      const card = document.querySelector('sensor-bar-card-plus');
      window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states,
        'sensor.power': { ...window.__targetHass.states['sensor.power'], state: String(value) } } };
      card.hass = window.__targetHass;
    }, value);
    const clips = scaleDirection === 'normal'
      ? { below: /inset\(0px 40% 0px 50%/, above: /inset\(0px 30% 0px 60%/ }
      : { below: /inset\(0px 50% 0px 40%/, above: /inset\(0px 60% 0px 30%/ };

    await expect(above).toHaveCSS('clip-path', scaleDirection === 'normal'
      ? /inset\(0px 50% 0px 60%/ : /inset\(0px 60% 0px 50%/);
    await expect(below).toHaveCSS('display', 'block');
    await expect(below).toHaveCSS('clip-path', clips.below);
    await expect(below).toHaveCSS('background-image', /rgb\(32, 128, 208\)/);
    await update(60);
    await expect(above).toHaveCSS('clip-path', scaleDirection === 'normal'
      ? /inset\(0px 40% 0px 60%/ : /inset\(0px 60% 0px 40%/);
    await expect(below).toHaveCSS('clip-path', scaleDirection === 'normal'
      ? /inset\(0px 40% 0px 60%/ : /inset\(0px 60% 0px 40%/);
    await update(70);
    await expect(above).toHaveCSS('display', 'block');
    await expect(above).toHaveCSS('clip-path', clips.above);
    await expect(above).toHaveCSS('background-image', /rgb\(208, 32, 112\)/);
    await expect(below).toHaveCSS('clip-path', scaleDirection === 'normal'
      ? /inset\(0px 40% 0px 70%/ : /inset\(0px 70% 0px 40%/);
  });

  test(`legacy upper Target Paint follows strict Needle violation gating (${source}, ${scaleDirection} Scale)`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', {
      bar: { needle: true }, scale: { direction: scaleDirection },
      target: { at: 60, when_exceeded: { fill_color: '#d02070' } },
    }, 40);
    const layer = runtime.locator('.bar-paint-layer[data-layer="above-target"]');
    await expect(layer).toHaveCSS('clip-path', /inset\(0px 60%(?: 0px 60%)?\)/);
    await page.evaluate(() => {
      const card = document.querySelector('sensor-bar-card-plus');
      window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states,
        'sensor.power': { ...window.__targetHass.states['sensor.power'], state: '80' } } };
      card.hass = window.__targetHass;
    });
    await expect(layer).toHaveCSS('display', 'block');
    await expect(layer).toHaveCSS('clip-path', scaleDirection === 'normal'
      ? /inset\(0px 20% 0px 60%/ : /inset\(0px 60% 0px 20%/);
    await expect(layer).toHaveCSS('background-image', /rgb\(208, 32, 112\)/);
  });
}

for (const source of ['src', 'dist']) {
  test(`Needle Target Paint shares needle timing and easing and follows its moving edge (${source})`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', {
      bar: { needle: true, animated: true },
      target: { at: 60, when_above: { paint: { color: '#d02070' } }, when_below: { paint: { color: '#2080d0' } } },
    }, 50);
    const timing = await runtime.evaluate(node => {
      const root = node.shadowRoot, needle = getComputedStyle(root.querySelector('.needle-marker'));
      const above = getComputedStyle(root.querySelector('[data-layer="above-target"]'));
      const below = getComputedStyle(root.querySelector('[data-layer="below-target"]'));
      return [needle.transitionDuration, needle.transitionTimingFunction,
        above.transitionProperty, above.transitionDuration, above.transitionTimingFunction,
        below.transitionProperty, below.transitionDuration, below.transitionTimingFunction];
    });
    expect(timing).toEqual([
      '0.6s', 'cubic-bezier(0.4, 0, 0.2, 1)', 'clip-path', '0.6s', 'cubic-bezier(0.4, 0, 0.2, 1)',
      'clip-path', '0.6s', 'cubic-bezier(0.4, 0, 0.2, 1)',
    ]);

    await page.evaluate(() => {
      const card = document.querySelector('sensor-bar-card-plus');
      window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states,
        'sensor.power': { ...window.__targetHass.states['sensor.power'], state: '80' } } };
      card.hass = window.__targetHass;
    });
    await page.waitForTimeout(300);
    const movingEdges = await runtime.evaluate(node => {
      const root = node.shadowRoot, width = root.querySelector('.bar-track').getBoundingClientRect().width;
      const needle = Number.parseFloat(getComputedStyle(root.querySelector('.needle-marker')).left) / width * 100;
      const read = (selector, movingStart = false) => {
        const clip = getComputedStyle(root.querySelector(selector)).clipPath;
        const insets = clip.match(/inset\([^ ]+ ([^ ]+) [^ ]+ ([^ )]+)/);
        return movingStart ? Number.parseFloat(insets[2]) : 100 - Number.parseFloat(insets[1]);
      };
      return { needle, above: read('[data-layer="above-target"]'), below: read('[data-layer="below-target"]', true) };
    });
    expect(movingEdges.needle).toBeGreaterThan(60);
    expect(movingEdges.needle).toBeLessThan(80);
    expect(Math.abs(movingEdges.needle - movingEdges.above)).toBeLessThan(1);
    expect(Math.abs(movingEdges.needle - movingEdges.below)).toBeLessThan(1);
  });

  test(`Needle Target Paint and Fill Paint do not transition when their existing animation setting is disabled (${source})`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', {
      bar: { needle: true, animated: false },
      target: { at: 60, when_above: { paint: { color: '#d02070' } } },
    }, 80);
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('transition-duration', '0s');
  });

  test(`Fill Target Paint retains its existing non-animated clipping (${source})`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', {
      bar: { animated: true }, target: { at: 60, when_above: { paint: { color: '#d02070' } } },
    }, 80);
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('transition-duration', '0s');
  });
}
