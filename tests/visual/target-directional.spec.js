const { test, expect } = require('@playwright/test');
const { mount, openTarget } = require('./target-test-utils.cjs');

const saved = page => page.evaluate(() => window.__targetConfig);
const setStates = (page, states) => page.evaluate(states => {
  const runtime = document.querySelector('sensor-bar-card-plus, sensor-bar-card-plus-feature');
  window.__targetHass = { ...window.__targetHass, states: { ...window.__targetHass.states, ...states } };
  runtime.hass = window.__targetHass;
}, states);
const markers = runtime => runtime.locator('.target-marker');
const marker = (runtime, side) => runtime.locator(`.target-marker[data-marker-id="${side === 'above' ? 'target' : 'target-below'}"]`);
const labels = (runtime, host) => runtime.locator(host === 'Feature' ? '.compact-marker-label' : '.target-value-label');
const position = (runtime, side) => marker(runtime, side).evaluate(node => node.style.left);
const directionalTarget = () => ({
  when_above: { at: { entity: 'sensor.high', fixed: 80 }, marker: { color: 'red', label: { show: true, text: 'High', show_unit: false } }, paint: { color: 'red' } },
  when_below: { at: { entity: { id: 'sensor.goal', attribute: 'limit' } }, marker: { color: 'blue', shape: 'triangle', label: { show: true, text: 'Low', show_unit: false } }, paint: { color: 'blue' } },
});

const directionalClearConfig = () => ({
  at: { fixed: 1, entity: 'sensor.shared_target' },
  when_above: { at: { fixed: 50, entity: 'sensor.sbcp_playground_target' },
    marker: { color: '#d02020', shape: 'triangle' }, paint: { color: '#d02020' } },
  when_below: { at: { fixed: 50, entity: 'sensor.sbcp_playground_target' },
    marker: { color: '#2070d0', shape: 'diamond' }, paint: { color: '#2070d0' } },
});

for (const source of ['src', 'dist']) for (const host of ['Card', 'Entity', 'Feature']) {
  for (const side of ['above', 'below']) for (const order of ['value-first', 'entity-first']) {
    test(`${host}/${source}: clearing ${side} source parts in ${order} order preserves and restores inheritance`, async ({ page }) => {
      const target = directionalClearConfig();
      const config = host === 'Entity' ? {
        target: { at: target.at },
        entities: [{ entity: 'sensor.power', target: { when_above: target.when_above, when_below: target.when_below } }],
      } : { target };
      const { editor, runtime } = await mount(page, source, host, config, 20, 360);
      const prefix = host === 'Entity' ? 'entity-0-' : '';
      await openTarget(editor, host, [side, `${side}-threshold`]);
      const value = editor.locator(`#${prefix}target-${side}-value`);
      const entity = editor.locator(`#${prefix}target-${side}-entity`);
      const clearValue = value.locator('..').getByRole('button', { name: 'Clear', exact: true });
      const sourceAt = configTarget => (host === 'Entity' ? configTarget.entities[0] : configTarget).target?.[`when_${side}`]?.at;
      const dispatchEntityClear = () => entity.evaluate(node => {
        node.focus();
        node.value = '';
        node.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
      const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      await expect(value).toHaveValue('50');
      await expect(entity).toHaveValue('sensor.sbcp_playground_target');
      if (side === 'above') await expect.poll(() => position(runtime, side)).toBe('50%');
      if (order === 'value-first') {
        await clearValue.click();
        await expect.poll(() => page.evaluate(() => window.__targetEvents.length)).toBe(1);
        await settle();
        const afterFirst = await saved(page);
        const firstState = {
          at: sourceAt(afterFirst), value: await value.inputValue(), entity: await entity.inputValue(),
          clearValueHidden: await clearValue.isHidden(),
        };
        await dispatchEntityClear();
        await expect.poll(() => page.evaluate(() => window.__targetEvents.length)).toBe(2);
        await settle();
        const afterBoth = await saved(page);
        expect({
          firstState,
          localAtAfterBoth: sourceAt(afterBoth),
          value: await value.inputValue(),
          entity: await entity.inputValue(),
          source: await editor.locator(`.target-directional-controls[data-target-side="${side}"] .resolvable-source-value [data-target-source="source"]`).first().textContent(),
          markerPosition: await position(runtime, side),
          siblingAt: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side === 'above' ? 'below' : 'above'}`].at,
          marker: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side}`].marker,
          paint: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side}`].paint,
        }).toEqual({
          firstState: { at: { entity: 'sensor.sbcp_playground_target' }, value: '', entity: 'sensor.sbcp_playground_target', clearValueHidden: true },
          localAtAfterBoth: undefined,
          value: '1', entity: 'sensor.shared_target', source: 'Inherited', markerPosition: '1%',
          siblingAt: { fixed: 50, entity: 'sensor.sbcp_playground_target' },
          marker: target[`when_${side}`].marker, paint: target[`when_${side}`].paint,
        });
      } else {
        await dispatchEntityClear();
        await expect.poll(() => page.evaluate(() => window.__targetEvents.length)).toBe(1);
        await settle();
        const afterFirst = await saved(page);
        const firstState = {
          at: sourceAt(afterFirst), value: await value.inputValue(), entity: await entity.inputValue(),
          clearValueHidden: await clearValue.isHidden(),
        };
        await clearValue.click();
        await expect.poll(() => page.evaluate(() => window.__targetEvents.length)).toBe(2);
        await settle();
        const afterBoth = await saved(page);
        expect({
          firstState,
          localAtAfterBoth: sourceAt(afterBoth),
          value: await value.inputValue(),
          entity: await entity.inputValue(),
          source: await editor.locator(`.target-directional-controls[data-target-side="${side}"] .resolvable-source-value [data-target-source="source"]`).first().textContent(),
          markerPosition: await position(runtime, side),
          siblingAt: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side === 'above' ? 'below' : 'above'}`].at,
          marker: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side}`].marker,
          paint: (host === 'Entity' ? afterBoth.entities[0] : afterBoth).target[`when_${side}`].paint,
        }).toEqual({
          firstState: { at: { fixed: 50 }, value: '50', entity: '', clearValueHidden: false },
          localAtAfterBoth: undefined,
          value: '1', entity: 'sensor.shared_target', source: 'Inherited', markerPosition: '1%',
          siblingAt: { fixed: 50, entity: 'sensor.sbcp_playground_target' },
          marker: target[`when_${side}`].marker, paint: target[`when_${side}`].paint,
        });
      }
    });
  }
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Entity', 'Feature']) {
  test(`${host}/${source}: persistent Target membership, labels, source-only inversion and recovery`, async ({ page }, testInfo) => {
    const target = directionalTarget();
    const { runtime } = await mount(page, source, host, host === 'Entity'
      ? { target: {}, entities: [{ entity: 'sensor.power', target }] } : { target }, 90, 360);
    await setStates(page, { 'sensor.goal': { state: '80', attributes: { limit: 80 } } });
    await expect(markers(runtime)).toHaveCount(1);
    await expect(labels(runtime, host)).toHaveCount(1);
    await expect(labels(runtime, host)).toHaveText(['High 80']);
    await marker(runtime, 'above').evaluate(node => { window.__upperMarker = node; window.__barTrack = node.closest('.bar-track'); });
    await labels(runtime, host).first().evaluate(node => { window.__upperLabel = node; });
    await runtime.evaluate(node => { window.__primaryState = node._hass.states['sensor.power']; });

    await setStates(page, { 'sensor.goal': { state: 'unchanged', attributes: { limit: 20 } } });
    await expect(markers(runtime)).toHaveCount(2);
    await expect(labels(runtime, host)).toHaveText(['High 80', 'Low 20']);
    await expect(labels(runtime, host).nth(1)).toBeVisible();
    expect(await position(runtime, 'below')).toBe('20%');
    await expect(marker(runtime, 'below')).toHaveAttribute('data-shape', 'triangle');
    expect(await marker(runtime, 'above').evaluate(node => node === window.__upperMarker && node.closest('.bar-track') === window.__barTrack)).toBe(true);
    expect(await labels(runtime, host).first().evaluate(node => node === window.__upperLabel)).toBe(true);
    expect(await runtime.evaluate(node => node._hass.states['sensor.power'] === window.__primaryState)).toBe(true);
    await marker(runtime, 'below').evaluate(node => { window.__lowerMarker = node; });
    await labels(runtime, host).nth(1).evaluate(node => { window.__lowerLabel = node; });
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
    const reservation = host === 'Feature' ? runtime.locator('.surface') : runtime.locator('.row');
    if (host === 'Feature') await expect(reservation).toHaveCSS('--label-below', '10px');
    else {
      await expect(reservation).toHaveAttribute('data-marker-label-lane-below', 'true');
      await expect(runtime.locator('.main-line')).toHaveAttribute('data-marker-lane-below', 'true');
      const geometry = await runtime.evaluate(node => {
        const root = node.shadowRoot, label = root.querySelector('[data-marker-id="target-below"].target-value-label').getBoundingClientRect();
        const track = root.querySelector('.bar-track').getBoundingClientRect();
        return { below: label.top >= track.top, inside: label.left >= track.left - 1 && label.right <= track.right + 1 };
      });
      expect(geometry).toEqual({ below: true, inside: true });
    }
    await runtime.screenshot({ path: testInfo.outputPath('distinct-targets.png') });

    // Both source objects change; the primary state object is deliberately retained.
    await setStates(page, { 'sensor.high': { state: '10', attributes: {} } });
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'none');
    await expect(runtime.locator('[data-layer="below-target"]')).toHaveCSS('display', 'none');
    await expect(markers(runtime)).toHaveCount(2);
    await expect(marker(runtime, 'above')).toHaveCSS('display', 'block');
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'block');
    await expect.poll(() => runtime.evaluate(node => node._diagnostics.warnings.filter(issue => issue.code === 'target.invalid_ordering'))).toMatchObject([{ above: 10, below: 20 }]);
    await setStates(page, { 'sensor.high': { state: '80', attributes: {} } });
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
    await expect.poll(() => runtime.evaluate(node => node._diagnostics.warnings.filter(issue => issue.code === 'target.invalid_ordering').length)).toBe(0);

    await setStates(page, { 'sensor.goal': { state: 'unavailable', attributes: {} } });
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'none');
    await expect(labels(runtime, host).nth(1)).not.toBeVisible();
    expect(await marker(runtime, 'below').evaluate(node => node === window.__lowerMarker)).toBe(true);
    if (host === 'Feature') await expect(reservation).toHaveCSS('--label-below', '10px');
    else await expect(reservation).toHaveAttribute('data-marker-label-lane-below', 'true');
    await setStates(page, { 'sensor.goal': { state: '80', attributes: { limit: 30 } } });
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'block');
    expect(await position(runtime, 'below')).toBe('30%');
    await expect(labels(runtime, host).nth(1)).toHaveText('Low 30');
    expect(await labels(runtime, host).nth(1).evaluate(node => node === window.__lowerLabel)).toBe(true);
    await expect(labels(runtime, host).nth(1)).toBeVisible();
    expect(await marker(runtime, 'below').evaluate(node => node === window.__lowerMarker)).toBe(true);

    await setStates(page, { 'sensor.goal': { state: '80', attributes: { limit: 80 } } });
    await expect(markers(runtime)).toHaveCount(1);
    await expect(labels(runtime, host)).toHaveCount(1);
    expect(await marker(runtime, 'above').evaluate(node => node === window.__upperMarker)).toBe(true);
    await setStates(page, { 'sensor.goal': { state: '80', attributes: { limit: 40 } } });
    await expect(markers(runtime)).toHaveCount(2);
    await expect(labels(runtime, host)).toHaveText(['High 80', 'Low 40']);
  });

  test(`${host}/${source}: directional typing, caret, Clear and external replacements stay mounted`, async ({ page }, testInfo) => {
    const { editor } = await mount(page, source, host, {}, 80, 360);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    await openTarget(editor, host, ['above']);
    await expect(editor.locator(`#${prefix}target-above-value`)).not.toBeVisible();
    await openTarget(editor, host, ['above', 'above-threshold', 'above-marker', 'above-labels']);
    const input = editor.locator(`#${prefix}target-above-value`), label = editor.locator(`#${prefix}target-above-label-text`);
    await input.evaluate(node => { window.__directionalInput = node; });
    await input.focus(); await input.press('ControlOrMeta+A'); await input.press('Backspace');
    for (const char of '75') {
      await page.keyboard.type(char);
      await expect(input).toBeFocused();
      expect(await input.evaluate(node => node === window.__directionalInput && node.selectionStart === node.value.length)).toBe(true);
    }
    await label.evaluate(node => { window.__directionalLabel = node; });
    await label.focus(); await label.press('ControlOrMeta+A');
    for (const char of 'Upper ABC') {
      await page.keyboard.type(char);
      await expect(label).toBeFocused();
      expect(await label.evaluate(node => node === window.__directionalLabel && node.selectionStart === node.value.length)).toBe(true);
    }
    await editor.evaluate(node => {
      const container = node.parentElement; container.style.height = '500px'; container.style.overflow = 'auto';
      const before = document.createElement('div'); before.style.height = '800px';
      const after = document.createElement('div'); after.style.height = '1600px';
      container.prepend(before); container.append(after); window.__directionScroll = container;
    });
    await label.scrollIntoViewIfNeeded();
    const scrollTop = await page.evaluate(() => window.__directionScroll.scrollTop);
    await label.press('ArrowLeft'); await page.keyboard.type('X');
    await expect(label).toHaveValue('Upper ABXC');
    expect(await label.evaluate(node => node.selectionStart)).toBe(9);
    expect(Math.abs(await page.evaluate(() => window.__directionScroll.scrollTop) - scrollTop)).toBeLessThanOrEqual(1);
    let config = await saved(page), scope = host === 'Entity' ? config.entities[0] : config;
    expect(scope.target.when_above.at).toMatchObject({ fixed: 75, entity: 'sensor.goal', future: true });
    expect(scope.target.when_above.marker.label.text).toBe('Upper ABXC');
    const clear = input.locator('..').getByRole('button', { name: 'Clear', exact: true });
    await clear.click();
    await expect(input).toHaveValue('60');
    expect(await input.evaluate(node => node === window.__directionalInput)).toBe(true);
    config = await saved(page); scope = host === 'Entity' ? config.entities[0] : config;
    expect(scope.target.when_above.at).toBeUndefined();
    expect(scope.target.when_above.marker.label.text).toBe('Upper ABXC');
    await expect(clear).toBeHidden();
    await page.evaluate(host => {
      const next = structuredClone(window.__targetConfig), scope = host === 'Entity' ? next.entities[0] : next;
      scope.target = { ...scope.target, at: 55 };
      window.__replaceTarget(next);
    }, host);
    await expect(input).toHaveValue('55');
    await label.focus();
    const eventCount = await page.evaluate(() => window.__targetEvents.length);
    await page.evaluate(host => {
      const next = structuredClone(window.__targetConfig), scope = host === 'Entity' ? next.entities[0] : next;
      scope.target.when_above = { ...scope.target.when_above, at: { fixed: 45, entity: { id: 'sensor.goal', attribute: 'limit' } },
        marker: { color: 'blue', label: { show: true, text: 'External', precision: 2 } } };
      window.__replaceTarget(next);
    }, host);
    await expect(input).toHaveValue('45'); await expect(label).toHaveValue('External');
    await expect(label).toBeFocused();
    expect(await label.evaluate(node => node === window.__directionalLabel)).toBe(true);
    await expect(editor.locator(`#${prefix}target-above-attribute`)).toHaveValue('limit');
    await expect(editor.locator(`#${prefix}target-above-label-precision`)).toHaveValue('2');
    await expect(editor.locator(`#${prefix}target-above-color-text-fallback`)).toHaveValue('blue');
    expect(await page.evaluate(() => window.__targetEvents.length)).toBe(eventCount);
    await expect(editor.locator(`#card-group-${prefix}target-above-labels`)).toHaveAttribute('aria-expanded', 'true');
    await editor.screenshot({ path: testInfo.outputPath('directional-editor.png') });
  });

  test(`${host}/${source}: coincident preference and directional-only reservations render correctly`, async ({ page }) => {
    const target = directionalTarget(); target.when_below.at = 80; target.when_above.marker.enabled = false;
    const { runtime } = await mount(page, source, host, { target }, 90, 360);
    await expect(markers(runtime)).toHaveCount(1);
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'block');
    await expect(marker(runtime, 'below')).toHaveCSS('--marker-color', 'blue');
    await expect(labels(runtime, host)).toHaveText(['Low 80']);
    await page.evaluate(() => {
      const next = structuredClone(window.__targetConfig);
      next.target = { when_below: { at: { entity: 'sensor.limit' }, marker: { label: { show: true, text: 'Lower' } } } };
      window.__replaceTarget(next);
    });
    await expect(markers(runtime)).toHaveCount(1);
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'none');
    if (host === 'Feature') await expect(runtime.locator('.surface')).toHaveCSS('--label-below', '10px');
    else await expect(runtime.locator('.main-line')).toHaveAttribute('data-marker-lane-below', 'true');
    await setStates(page, { 'sensor.limit': { state: '20', attributes: {} } });
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'block');
    expect(await position(runtime, 'below')).toBe('20%');
    await expect(labels(runtime, host)).toHaveText(['Lower 20']);
    await expect(labels(runtime, host)).toBeVisible();
  });

  test(`${host}/${source}: percentage thresholds re-evaluate ordering after Scale-only changes`, async ({ page }) => {
    const { runtime } = await mount(page, source, host, { scale: { max: { entity: 'sensor.maximum', fixed: 100 } },
      target: { when_above: { at: '60%', paint: { color: 'red' } }, when_below: { at: 50, paint: { color: 'blue' } } } }, 90, 360);
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
    await setStates(page, { 'sensor.maximum': { state: '60', attributes: {} } });
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'none');
    await expect(runtime.locator('[data-layer="below-target"]')).toHaveCSS('display', 'none');
    await expect.poll(() => runtime.evaluate(node => node._diagnostics.warnings.filter(issue => issue.code === 'target.invalid_ordering').length)).toBe(1);
    await setStates(page, { 'sensor.maximum': { state: '100', attributes: {} } });
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
    await expect.poll(() => runtime.evaluate(node => node._diagnostics.warnings.filter(issue => issue.code === 'target.invalid_ordering').length)).toBe(0);
  });

  test(`${host}/${source}: marker appearance, visibility and label overrides leave Paint and sibling intact`, async ({ page }) => {
    const target = directionalTarget(); target.when_below.at = 20;
    const { editor, runtime } = await mount(page, source, host, { target, formatting: { unit: 'W' } }, 90, 360);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    await openTarget(editor, host, ['above', 'above-marker', 'above-appearance', 'above-labels']);
    const before = await saved(page);
    const text = editor.locator(`#${prefix}target-above-label-text`);
    await text.fill('Upper');
    await editor.locator(`#${prefix}target-above-label-show-value`).uncheck();
    await expect(labels(runtime, host).first()).toHaveText('Upper');
    await editor.locator(`#${prefix}target-above-color`).fill('#00ff00');
    await expect(marker(runtime, 'above')).toHaveCSS('--marker-color', '#00ff00');
    await editor.locator(`#${prefix}target-above-shape`).selectOption('triangle');
    await expect(marker(runtime, 'above')).toHaveAttribute('data-shape', 'triangle');
    await editor.locator(`#${prefix}target-above-show`).uncheck();
    await expect(marker(runtime, 'above')).toHaveCSS('display', 'none');
    await expect(marker(runtime, 'below')).toHaveCSS('display', 'block');
    await expect(runtime.locator('[data-layer="above-target"]')).toHaveCSS('display', 'block');
    const after = await saved(page), scope = host === 'Entity' ? after.entities[0] : after;
    expect(scope.target.when_above.marker).toMatchObject({ enabled: false, color: '#00ff00', shape: 'triangle', label: { text: 'Upper', show_value: false } });
    expect(after.target.when_below).toEqual(before.target.when_below);
    expect(after.target.when_above.paint).toEqual(before.target.when_above.paint);
  });

  test(`${host}/${source}: HA source/attribute picker events preserve directional controls`, async ({ page }) => {
    await page.addInitScript(() => {
      customElements.define('ha-entity-picker', class extends HTMLElement { connectedCallback() { this.style.cssText = 'display:block;min-height:25px'; } });
      customElements.define('ha-entity-attribute-picker', class extends HTMLElement { connectedCallback() { this.style.cssText = 'display:block;min-height:25px'; } });
    });
    const { editor } = await mount(page, source, host);
    const prefix = host === 'Entity' ? 'entity-0-' : '';
    await openTarget(editor, host, ['below', 'below-threshold']);
    const picker = editor.locator(`#${prefix}target-below-entity`);
    await picker.evaluate(node => {
      window.__directionPicker = node;
      node.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.goal' } }));
    });
    const attr = editor.locator(`#${prefix}target-below-attribute`);
    await attr.evaluate(node => node.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'limit' } })));
    const next = await saved(page), scope = host === 'Entity' ? next.entities[0] : next;
    expect(scope.target.when_below.at.entity).toEqual({ id: 'sensor.goal', attribute: 'limit' });
    expect(await picker.evaluate(node => node === window.__directionPicker && node.allowCustomEntity && !!node.hass)).toBe(true);
    expect(await attr.evaluate(node => node.entityId)).toBe('sensor.goal');
    await picker.evaluate(node => node.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: '' } })));
    await expect(attr).toBeHidden();
    await picker.evaluate(node => node.dispatchEvent(new CustomEvent('value-changed', { bubbles: true, composed: true, detail: { value: 'sensor.goal' } })));
    await expect(attr).toBeVisible();
  });
}

for (const source of ['src', 'dist']) for (const needle of [false, true]) for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
  test(`directional rendering and ordering across Fill/Needle and directions (${source}, ${needle}, ${scaleDirection}, ${barDirection})`, async ({ page }) => {
    const { runtime } = await mount(page, source, 'Card', { target: directionalTarget(), scale: { direction: scaleDirection },
      bar: { needle, animated: false, direction: barDirection } }, 90, 360);
    const above = runtime.locator('[data-layer="above-target"]'), below = runtime.locator('[data-layer="below-target"]');
    await expect(markers(runtime)).toHaveCount(2);
    expect(await position(runtime, 'above')).toBe(scaleDirection === 'normal' ? '80%' : '20%');
    await expect(above).toHaveCSS('display', 'block');
    await expect(above).toHaveCSS('clip-path', needle ? scaleDirection === 'normal'
      ? /inset\(0px 10% 0px 80%/ : /inset\(0px 80% 0px 10%/
      : scaleDirection === 'normal' ? /inset\(0px 0(?:px|%) 0px 80%/ : /inset\(0px 80% 0px 0(?:px|%)/);
    await setStates(page, { 'sensor.power': { state: '10', attributes: {} } });
    await expect(below).toHaveCSS('display', 'block');
    await setStates(page, { 'sensor.high': { state: '50', attributes: {} } }); // lower is still 60
    await expect(above).toHaveCSS('display', 'none'); await expect(below).toHaveCSS('display', 'none');
    await expect(markers(runtime)).toHaveCount(2);
    await setStates(page, { 'sensor.goal': { state: '60', attributes: { limit: 20 } } });
    await expect(below).toHaveCSS('display', 'block');
    await expect(below).toHaveCSS('clip-path', needle ? scaleDirection === 'normal'
      ? /inset\(0px 80% 0px 10%/ : /inset\(0px 10% 0px 80%/
      : scaleDirection === 'normal' ? /inset\(0px 80% 0px 0(?:px|%)/ : /inset\(0px 0(?:px|%) 0px 80%/);
  });
}

for (const source of ['src', 'dist']) {
  test(`Entity shared and directional controls display whole-source replacement (${source})`, async ({ page }) => {
    const { editor, runtime } = await mount(page, source, 'Entity', { entities: [{ entity: 'sensor.power', target: { at: 25, label: { show: true, text: 'Local', precision: 1, show_value: false, show_unit: false } } }] });
    await openTarget(editor, 'Entity', ['shared', 'above', 'above-threshold']);
    const shared = editor.locator('#entity-0-target-value'), above = editor.locator('#entity-0-target-above-value');
    await expect(shared).toHaveValue('25'); await expect(above).toHaveValue('25');
    await expect(editor.locator('#entity-0-target-entity')).toHaveValue('');
    await expect(editor.locator('#entity-0-target-above-entity')).toHaveValue('');
    expect(await position(runtime, 'above')).toBe('25%');
    await page.evaluate(() => {
      const next = structuredClone(window.__targetConfig); next.entities[0].target.at = 'sensor.local'; window.__replaceTarget(next);
    });
    await expect(shared).toHaveValue(''); await expect(above).toHaveValue('');
    await expect(editor.locator('#entity-0-target-above-entity')).toHaveValue('sensor.local');
    await expect(marker(runtime, 'above')).toHaveCSS('display', 'none');
    await setStates(page, { 'sensor.local': { state: '35', attributes: {} } });
    await expect(marker(runtime, 'above')).toHaveCSS('display', 'block');
    expect(await position(runtime, 'above')).toBe('35%');
    await editor.locator('#entity-0-target-inherit').check();
    expect((await saved(page)).entities[0].target).toBeUndefined();
    await expect(shared).toHaveValue('60');
    await expect(above).toHaveValue('60');
  });
}
