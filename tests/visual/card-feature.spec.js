const { test, expect } = require('@playwright/test');

const state = (value, attributes = {}) => ({ state: String(value), attributes });
const entity = 'sensor.power';
async function mount(page, options = {}) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(options => window.__sbcpRenderFeature({
    context: { entity_id: 'sensor.power' }, states: { 'sensor.power': { state: '70', attributes: { friendly_name: 'Power', unit_of_measurement: 'W' } } },
    ...options,
  }), options);
}
const feature = page => page.locator('sensor-bar-card-plus-feature').first();

for (const fillStyle of ['solid', 'bands', 'soft_bands', 'gradient', 'band_gradient']) {
  test(`feature reuses ${fillStyle} paint and Segment coordinates without standalone content`, async ({ page }) => {
    await mount(page, { config: {
      bar: { fill_style: fillStyle, color: '#abcdef', animated: false,
        gradient_stops: [{ pos: 0, color: '#ff0000' }, { pos: 100, color: '#0000ff' }],
        segments: [{ from: 0, to: 40, color: '#ff0000' }, { from: 40, to: 100, color: '#0000ff' }] },
      target: { at: 75, label: { show: true } },
      markers: [{ at: '25%', shape: 'pin', label: { show: true } }],
      title: 'Excluded', layout: { label: { position: 'hero' } },
    } });
    const result = await feature(page).evaluate(element => {
      const root = element.shadowRoot;
      const track = root.querySelector('.bar-track');
      return {
        height: track.getBoundingClientRect().height,
        width: track.getBoundingClientRect().width,
        paint: getComputedStyle(root.querySelector('[data-layer="base"]')).backgroundImage,
        clip: root.querySelector('.bar-fill-reveal').style.clipPath,
        target: getComputedStyle(root.querySelector('.target-marker')).left,
        reference: getComputedStyle(root.querySelector('.generic-marker')).left,
        label: root.querySelector('[role="img"]').getAttribute('aria-label'),
        excluded: root.querySelectorAll('ha-card, ha-icon, .row, .hero-header, .bar-inner-label, .target-value-label, .generic-value-label').length,
      };
    });
    expect(result.height).toBe(42);
    expect(result.width).toBe(640);
    expect(result.paint).toContain('linear-gradient');
    if (fillStyle === 'solid') expect(result.paint).toContain('rgb(171, 205, 239)');
    else expect(result.paint).toContain('rgb(255, 0, 0)');
    if (fillStyle === 'bands') expect(result.paint).toContain('40%');
    expect(result.clip).toContain('30%');
    expect(result.target).toBe('480px');
    expect(result.reference).toBe('160px');
    expect(result.label).toContain('Power (sensor.power): 70 W');
    expect(result.label).toContain('Range 0 to 100 W');
    expect(result.excluded).toBe(0);
  });
}

for (const order of [
  ['config', 'hass', 'context', 'color', 'position'],
  ['context', 'color', 'position', 'hass', 'config'],
  ['hass', 'config', 'position', 'context', 'color'],
]) {
  test(`public feature inputs reconcile in order ${order.join(' → ')}`, async ({ page }) => {
    await mount(page, { order, separateUpdates: true, color: '#ff00ff', position: 'inline' });
    await expect(feature(page).locator('#surface')).toHaveAttribute('data-state', 'numeric');
    await expect(feature(page).locator('#bar')).toBeVisible();
    expect(await feature(page).evaluate(element => [element.color, element.position])).toEqual(['#ff00ff', 'inline']);
  });
}

for (const [width, height, position] of [[640, 42, 'bottom'], [96, 24, 'inline'], [64, 16, 'inline'], [0, 24, 'inline']]) {
  test(`feature fits ${width}px × ${height}px ${position} placement and recovers after resize`, async ({ page }) => {
    await mount(page, { width, height, position, config: {
      bar: { needle: true, animated: false }, target: { at: 100 },
      peak: { enabled: true }, floor: { enabled: true }, markers: [{ at: '0%', shape: 'circle' }],
    } });
    const result = await feature(page).evaluate(async element => {
      const track = element.shadowRoot.querySelector('.bar-track');
      const needle = element.shadowRoot.querySelector('.needle-marker');
      const before = [track.getBoundingClientRect().width, track.getBoundingClientRect().height];
      element.parentElement.style.width = '240px';
      element.parentElement.style.setProperty('--feature-height', '32px');
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        before, after: [track.getBoundingClientRect().width, track.getBoundingClientRect().height],
        persistent: track === element.shadowRoot.querySelector('.bar-track') && needle === element.shadowRoot.querySelector('.needle-marker'),
        overflow: getComputedStyle(track).overflow,
        scrollWidth: element.parentElement.scrollWidth,
        needle: parseFloat(getComputedStyle(needle).left),
      };
    });
    expect(result.before).toEqual([width, height]);
    expect(result.after).toEqual([240, 32]);
    expect(result.persistent).toBe(true);
    expect(result.overflow).toBe('hidden');
    expect(result.scrollWidth).toBe(240);
    expect(result.needle).toBeCloseTo(168);
  });
}

test('explicit numeric override works on a switch and in area context', async ({ page }) => {
  await mount(page, { context: { entity_id: 'switch.pump' }, config: { entity }, states: { [entity]: state(42), 'switch.pump': state('on') } });
  const result = await feature(page).evaluate(async element => {
    const track = element.shadowRoot.querySelector('.bar-track');
    element.context = { area_id: 'kitchen' };
    await element.updateComplete;
    const explicit = element._row.numericValue;
    const persistent = element.shadowRoot.querySelector('.bar-track') === track;
    element.setConfig({});
    await element.updateComplete;
    const unconfigured = element.shadowRoot.querySelector('#status').textContent;
    element.context = { entity_id: 'sensor.power' };
    await element.updateComplete;
    return { explicit, persistent, unconfigured, inherited: element._row.numericValue, savedEntity: element._config.entity };
  });
  expect(result).toEqual({ explicit: 42, persistent: true, unconfigured: 'Configure an entity', inherited: 42, savedEntity: undefined });
});

for (const value of ['unknown', 'unavailable', 'on', 'missing']) {
  test(`feature hides misleading paint for ${value} and recovers with stable nodes`, async ({ page }) => {
    await mount(page, { config: { bar: { needle: true }, peak: { enabled: true } } });
    const result = await feature(page).evaluate(async (element, value) => {
      const track = element.shadowRoot.querySelector('.bar-track');
      element.hass = { states: value === 'missing' ? {} : { 'sensor.power': { state: value, attributes: {} } } };
      await element.updateComplete;
      const invalid = {
        hidden: element.shadowRoot.querySelector('#bar').hidden,
        status: element.shadowRoot.querySelector('#status').textContent,
        label: element.shadowRoot.querySelector('#surface').getAttribute('aria-label'),
      };
      element.hass = { states: { 'sensor.power': { state: '25', attributes: {} } } };
      await element.updateComplete;
      return {
        invalid, numeric: element._row.numericValue,
        visible: !element.shadowRoot.querySelector('#bar').hidden,
        persistent: track === element.shadowRoot.querySelector('.bar-track'),
        initialMotion: getComputedStyle(element.shadowRoot.querySelector('.needle-marker')).transitionDuration,
      };
    }, value);
    expect(result.invalid.hidden).toBe(true);
    expect(result.invalid.status).toBe(value === 'unknown' ? 'Unknown' : value === 'unavailable' ? 'Unavailable' : value === 'missing' ? 'Entity not found' : 'Not numeric');
    expect(result.invalid.label).toContain(entity);
    expect(result.invalid.label).toContain(result.invalid.status);
    expect(result.numeric).toBe(25);
    expect(result.visible).toBe(true);
    expect(result.persistent).toBe(true);
    expect(result.initialMotion).toBe('0s');
  });
}

test('Baseline, Target overlay, Needle suppression and source recovery use shared geometry', async ({ page }) => {
  await mount(page, { config: {
    scale: { min: -20, max: 20 }, baseline: { at: { entity: 'sensor.baseline' }, below: { color: '#ff0000' } },
    bar: { needle: true, animated: false, above_target_color: '#00ff00' }, target: { at: 5 },
  }, states: { [entity]: state(10), 'sensor.baseline': state(0) } });
  const result = await feature(page).evaluate(async element => {
    const root = element.shadowRoot;
    const before = {
      clip: root.querySelector('.bar-fill-reveal').style.clipPath,
      baseline: getComputedStyle(root.querySelector('.baseline-indicator')).left,
      needle: root.querySelector('.needle-marker') !== null,
      overlay: root.querySelector('[data-layer="above-target"]').style.clipPath,
    };
    element.hass = { states: { 'sensor.power': { state: '-10', attributes: {} }, 'sensor.baseline': { state: 'unknown', attributes: {} } } };
    await element.updateComplete;
    const unresolvedNeedle = getComputedStyle(root.querySelector('.needle-marker')).display;
    element.hass = { states: { 'sensor.power': { state: '-10', attributes: {} }, 'sensor.baseline': { state: '0', attributes: {} } } };
    await element.updateComplete;
    return { before, unresolvedNeedle, after: root.querySelector('.bar-fill-reveal').style.clipPath, needleSuppressed: !root.querySelector('.needle-marker') };
  });
  expect(result.before.clip).toContain('25% 0px 50%');
  expect(result.before.baseline).toBe('320px');
  expect(result.before.needle).toBe(false);
  expect(result.before.overlay).toContain('62.5%');
  expect(result.unresolvedNeedle).toBe('block');
  expect(result.after).toContain('50% 0px 25%');
  expect(result.needleSuppressed).toBe(true);
});

test('coexisting standalone card and same-entity features keep extrema and scale history isolated', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  const result = await page.evaluate(async () => {
    await window.__sbcpRenderCard({ config: { entity: 'sensor.power' }, states: { 'sensor.power': window.__sbcpCreateState(60) } });
    const config = { entity: 'sensor.power', bar: { animated: false }, peak: { enabled: true }, floor: { enabled: true },
      scale: { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } } };
    const a = await window.__sbcpRenderFeature({ config, states: { 'sensor.power': window.__sbcpCreateState(80), 'sensor.min': window.__sbcpCreateState(0), 'sensor.max': window.__sbcpCreateState(100) } });
    const b = await window.__sbcpRenderFeature({ config, states: { 'sensor.power': window.__sbcpCreateState(20), 'sensor.min': window.__sbcpCreateState(-20), 'sensor.max': window.__sbcpCreateState(60) } });
    const nodes = [a, b].map(element => [...element.shadowRoot.querySelectorAll('#bar *')]);
    const nextHass = { states: { 'sensor.power': window.__sbcpCreateState(40), 'sensor.min': window.__sbcpCreateState(90), 'sensor.max': window.__sbcpCreateState(10) } };
    a.hass = nextHass;
    b.hass = nextHass;
    await Promise.all([a.updateComplete, b.updateComplete]);
    return {
      features: [a, b].map((element, index) => ({
        scale: element._scaleHistory, peak: element._extrema.peak.value, floor: element._extrema.floor.value,
        persistent: nodes[index].every((node, i) => node === element.shadowRoot.querySelectorAll('#bar *')[i]),
        peakLeft: getComputedStyle(element.shadowRoot.querySelector('.peak-marker')).left,
        floorLeft: getComputedStyle(element.shadowRoot.querySelector('.floor-marker')).left,
      })),
      standalone: document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.value-right').textContent,
    };
  });
  expect(result.features).toEqual([
    { scale: { min: 0, max: 100 }, peak: 80, floor: 40, persistent: true, peakLeft: '512px', floorLeft: '256px' },
    { scale: { min: -20, max: 60 }, peak: 40, floor: 20, persistent: true, peakLeft: '480px', floorLeft: '320px' },
  ]);
  expect(result.standalone).toContain('60');
});

test('config and inherited entity replacements reconcile scale, glyph structure and accessibility', async ({ page }) => {
  await mount(page, { config: { peak: { enabled: true }, bar: { needle: true } } });
  const result = await feature(page).evaluate(async element => {
    const oldTrack = element.shadowRoot.querySelector('.bar-track');
    element.setConfig({ scale: { min: -50, max: 50 }, baseline: { at: 0 }, bar: { animated: false } });
    element.context = { entity_id: 'sensor.other' };
    element.hass = { states: { 'sensor.other': { state: '-25', attributes: { friendly_name: 'Other', unit_of_measurement: 'W' } } } };
    await element.updateComplete;
    return {
      replaced: oldTrack !== element.shadowRoot.querySelector('.bar-track'),
      label: element.shadowRoot.querySelector('#surface').getAttribute('aria-label'),
      clip: element.shadowRoot.querySelector('.bar-fill-reveal').style.clipPath,
      needle: element.shadowRoot.querySelector('.needle-marker'),
      peak: getComputedStyle(element.shadowRoot.querySelector('.peak-marker')).display,
      extrema: element._extrema,
    };
  });
  expect(result.replaced).toBe(true);
  expect(result.label).toContain('Other (sensor.other): -25 W');
  expect(result.label).toContain('Range -50 to 50 W');
  expect(result.clip).toContain('50% 0px 25%');
  expect(result.needle).toBeNull();
  expect(result.peak).toBe('none');
  expect(result.extrema).toEqual({});
});

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`feature respects ${reducedMotion} motion preference and keeps marker nodes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await mount(page, { config: { bar: { needle: true }, target: { at: 50 }, markers: [{ at: '25%' }] } });
    const result = await feature(page).evaluate(async element => {
      const root = element.shadowRoot;
      const needle = root.querySelector('.needle-marker');
      const marker = root.querySelector('.generic-marker');
      element.hass = { states: { 'sensor.power': { state: '30', attributes: {} } } };
      await element.updateComplete;
      const styles = ['.bar-fill-reveal', '.needle-marker', '.target-marker', '.generic-marker'].map(selector => getComputedStyle(root.querySelector(selector)).transitionDuration);
      const beforeStyle = root.querySelector('.bar-fill-reveal').getAttribute('style');
      element.color = '#abcdef';
      element.position = 'inline';
      element.context = element.context;
      element.hass = element.hass;
      await element.updateComplete;
      return { styles, stableStyle: beforeStyle === root.querySelector('.bar-fill-reveal').getAttribute('style'), persistent: needle === root.querySelector('.needle-marker') && marker === root.querySelector('.generic-marker') };
    });
    expect(result.styles).toEqual(reducedMotion === 'reduce' ? ['0s', '0s', '0s', '0s'] : ['0.15s', '0.6s', '0.6s', '0.6s']);
    expect(result.persistent).toBe(true);
    expect(result.stableStyle).toBe(true);
  });
}

test('theme changes remain inherited and passive glyphs leave parent interaction available', async ({ page }) => {
  await mount(page, { config: { baseline: { at: 50 }, target: { at: 75 } } });
  const result = await feature(page).evaluate(async element => {
    const root = element.shadowRoot;
    const track = root.querySelector('.bar-track');
    const baseline = root.querySelector('.baseline-indicator');
    const before = getComputedStyle(track).backgroundColor;
    element.parentElement.style.setProperty('--feature-color', '#ff0000');
    element.parentElement.style.setProperty('--secondary-background-color', '#ffffff');
    element.parentElement.style.setProperty('--primary-text-color', '#000000');
    element.parentElement.style.setProperty('--feature-border-radius', '4px');
    const after = getComputedStyle(track).backgroundColor;
    element.color = '#00ff00';
    await element.updateComplete;
    const assignedColor = element.style.getPropertyValue('--feature-color');
    element.color = undefined;
    await element.updateComplete;
    let clicks = 0;
    element.parentElement.addEventListener('click', () => clicks++);
    root.querySelector('.target-marker').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    return {
      changed: before !== after, baseline: getComputedStyle(baseline).backgroundColor,
      radius: getComputedStyle(track).borderRadius,
      assignedColor, inheritedColor: getComputedStyle(element).getPropertyValue('--feature-color'),
      pointerEvents: getComputedStyle(root.querySelector('.target-marker .marker-shape-svg path[data-shape="diamond"]')).pointerEvents,
      clicks, controls: root.querySelectorAll('button, input, [tabindex]').length,
    };
  });
  expect(result).toEqual({ changed: true, baseline: 'rgb(0, 0, 0)', radius: '4px', assignedColor: '#00ff00', inheritedColor: '#ff0000', pointerEvents: 'none', clicks: 1, controls: 0 });
});

test('reloading the resource in the browser preserves elements and discovery entries', async ({ page }) => {
  await mount(page);
  const result = await page.evaluate(async () => {
    const ctor = customElements.get('sensor-bar-card-plus-feature');
    await import('/src/sensor-bar-card-plus.js?reload=feature-test');
    return {
      sameConstructor: ctor === customElements.get('sensor-bar-card-plus-feature'),
      cards: window.customCards.filter(card => card.type === 'sensor-bar-card-plus').length,
      features: window.customCardFeatures.filter(feature => feature.type === 'sensor-bar-card-plus-feature').length,
      visible: !document.querySelector('sensor-bar-card-plus-feature').shadowRoot.querySelector('#bar').hidden,
    };
  });
  expect(result).toEqual({ sameConstructor: true, cards: 1, features: 1, visible: true });
});

test('same-instance reconnect retains history and nodes while a new instance starts fresh', async ({ page }) => {
  await mount(page, { config: { entity, peak: { enabled: true }, floor: { enabled: true } }, states: { [entity]: state(80) } });
  const result = await feature(page).evaluate(async element => {
    const host = element.parentElement;
    const track = element.shadowRoot.querySelector('.bar-track');
    element.remove();
    element.hass = { states: { 'sensor.power': { state: '20', attributes: {} } } };
    await element.updateComplete;
    host.append(element);
    await element.updateComplete;
    const fresh = document.createElement('sensor-bar-card-plus-feature');
    fresh.setConfig(element._config);
    fresh.hass = element.hass;
    host.append(fresh);
    await fresh.updateComplete;
    return { retainedPeak: element._extrema.peak.value, retainedFloor: element._extrema.floor.value, freshPeak: fresh._extrema.peak.value, persistent: track === element.shadowRoot.querySelector('.bar-track') };
  });
  expect(result).toEqual({ retainedPeak: 80, retainedFloor: 20, freshPeak: 20, persistent: true });
});

test('cosmetic inputs do not advance duration-reset history without a new numeric sample', async ({ page }) => {
  await mount(page, { config: { entity, peak: { enabled: true, reset: '1h' } }, states: { [entity]: state(80) } });
  const result = await feature(page).evaluate(async element => {
    element.hass = { states: { 'sensor.power': { state: '20', attributes: {} } } };
    await element.updateComplete;
    const originalNow = Date.now;
    const later = originalNow() + 2 * 60 * 60 * 1000;
    Date.now = () => later;
    try {
      element.color = '#ff0000';
      element.position = 'inline';
      element.context = { entity_id: 'switch.unrelated' };
      await element.updateComplete;
      const retained = element._extrema.peak.value;
      element.hass = { states: { 'sensor.power': { state: '20', attributes: {} } } };
      await element.updateComplete;
      return { retained, reset: element._extrema.peak.value };
    } finally {
      Date.now = originalNow;
    }
  });
  expect(result).toEqual({ retained: 80, reset: 20 });
});
