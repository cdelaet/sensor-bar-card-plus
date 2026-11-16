const { test, expect } = require('@playwright/test');

const invalidConfig = {
  bar: { color: '#00aa00', paint: { color: '#123456', opacity: -1 } },
  baseline: {
    above: { paint: { opacity: 140 } },
    below: { paint: { fill_style: 'not-a-style' } },
  },
  target: {
    when_above: { at: 30, paint: { opacity: -1 } },
    when_below: { at: 40, paint: { fill_style: 'not-a-style' } },
  },
};

const validConfig = {
  bar: { paint: { fill_style: 'solid', color: '#00aa00' } },
  baseline: { above: { paint: { opacity: 80 } } },
  target: { when_above: { at: 40 }, when_below: { at: 30 } },
};

async function mountBoth(page, source) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ invalidConfig }) => {
    const states = { 'sensor.messaging': window.__sbcpCreateState(50) };
    await window.__sbcpRenderCard({ width: 100, config: { ...invalidConfig, entities: [{ entity: 'sensor.messaging' }] }, states });
    await window.__sbcpRenderFeature({ width: 100, height: 42, config: invalidConfig, states,
      context: { entity_id: 'sensor.messaging' } });
  }, { invalidConfig });
}

for (const source of ['src', 'dist']) {
test(`Card and Tile Feature share live diagnostics, keyboard disclosure, recovery, and narrow wrapping (${source})`, async ({ page }) => {
  await mountBoth(page, source);
  const hosts = [page.locator('sensor-bar-card-plus'), page.locator('sensor-bar-card-plus-feature')];
  for (const host of hosts) {
    const area = host.locator('.sbcp-messages');
    await expect(area).toBeVisible();
    await expect(area).toContainText('Paint');
    await expect(area.locator('.sbcp-message-count[data-severity="info"]')).toContainText('0');
    await expect(area.locator('.sbcp-message-count[data-severity="warning"]')).not.toContainText('0');
    await expect(area.locator('.sbcp-message-count[data-severity="error"]')).toContainText('0');
    await expect(area).toContainText('Lower Target threshold is greater than upper Target threshold');
    await expect(area).toContainText('both Target paints are suppressed');
    await expect(area).toContainText('Bar Paint · color');
    await expect(area).toContainText('Grouped paint overrides bar.color.');
    await expect(area).toContainText('Bar Paint · opacity');
    await expect(area).toContainText('Baseline above Paint · opacity');
    await expect(area).toContainText('Baseline below Paint · fill style');
    await expect(area).toContainText('Target above Paint · opacity');
    await expect(area).toContainText('Target below Paint · fill style');
    const duplicateCount = await area.locator('.sbcp-message').evaluateAll(nodes => {
      const keys = nodes.map(node => `${node.querySelector('.sbcp-message-area').textContent}|${node.querySelector('.sbcp-message-explanation').textContent}`);
      return keys.length - new Set(keys).size;
    });
    expect(duplicateCount).toBe(0);

    const button = area.locator('.sbcp-disclosure-toggle');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(area.locator('.sbcp-disclosure-panel')).toBeHidden();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(area.locator('.sbcp-disclosure-panel')).toBeVisible();
    const width = await area.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth,
      panelClient: node.querySelector('.sbcp-disclosure-panel').clientWidth,
      panelScroll: node.querySelector('.sbcp-disclosure-panel').scrollWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);
    expect(width.panelScroll).toBeLessThanOrEqual(width.panelClient);
  }

  const initial = await page.locator('sensor-bar-card-plus .sbcp-messages').evaluate(node => ({
    severities: [...node.querySelectorAll('.sbcp-message')].map(message => message.dataset.severity).sort(),
    text: [...node.querySelectorAll('.sbcp-message-explanation')].map(message => message.textContent).sort(),
  }));
  const featureInitial = await page.locator('sensor-bar-card-plus-feature .sbcp-messages').evaluate(node => ({
    severities: [...node.querySelectorAll('.sbcp-message')].map(message => message.dataset.severity).sort(),
    text: [...node.querySelectorAll('.sbcp-message-explanation')].map(message => message.textContent).sort(),
  }));
  expect(featureInitial).toEqual(initial);

  await page.locator('sensor-bar-card-plus .sbcp-message').first().evaluate(node => { window.__messageNodeBeforeUpdate = node; });
  await page.evaluate(async () => {
    const states = { 'sensor.messaging': window.__sbcpCreateState(60) };
    document.querySelector('sensor-bar-card-plus').hass = { states };
    const feature = document.querySelector('sensor-bar-card-plus-feature');
    feature.hass = { states };
    await feature.updateComplete;
  });
  expect(await page.locator('sensor-bar-card-plus .sbcp-message').first()
    .evaluate(node => node === window.__messageNodeBeforeUpdate)).toBe(true);
  for (const host of hosts) {
    await expect(host.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(host.locator('.sbcp-disclosure-panel')).toBeVisible();
  }

  await page.evaluate(async ({ validConfig }) => {
    const card = document.querySelector('sensor-bar-card-plus');
    const feature = document.querySelector('sensor-bar-card-plus-feature');
    card.setConfig({ ...validConfig, entities: [{ entity: 'sensor.messaging' }] });
    feature.setConfig(validConfig);
    await feature.updateComplete;
  }, { validConfig });
  for (const host of hosts) await expect(host.locator('.sbcp-messages')).toBeHidden();

  await page.evaluate(async () => {
    const unavailable = { 'sensor.messaging': window.__sbcpCreateState('unavailable') };
    document.querySelector('sensor-bar-card-plus').hass = { states: unavailable };
    const feature = document.querySelector('sensor-bar-card-plus-feature');
    feature.hass = { states: unavailable };
    await feature.updateComplete;
  });
  for (const host of hosts) await expect(host.locator('.sbcp-messages')).toBeHidden();

  await page.evaluate(async ({ invalidConfig }) => {
    const card = document.querySelector('sensor-bar-card-plus');
    const feature = document.querySelector('sensor-bar-card-plus-feature');
    card.setConfig({ ...invalidConfig, entities: [{ entity: 'sensor.messaging' }] });
    feature.setConfig(invalidConfig);
    await feature.updateComplete;
  }, { invalidConfig });
  for (const host of hosts) {
    await expect(host.locator('.sbcp-messages')).toBeVisible();
    await expect(host.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(host.locator('.sbcp-disclosure-panel')).toBeVisible();
  }
});
}

test('ordinary sensor unavailability does not create a message by itself', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const config = { entities: [{ entity: 'sensor.offline' }] };
    const states = { 'sensor.offline': window.__sbcpCreateState('unavailable') };
    await window.__sbcpRenderCard({ config, states });
    await window.__sbcpRenderFeature({ config: {}, context: { entity_id: 'sensor.offline' }, states });
  });
  await expect(page.locator('sensor-bar-card-plus .sbcp-messages')).toBeHidden();
  await expect(page.locator('sensor-bar-card-plus-feature .sbcp-messages')).toBeHidden();
});

for (const source of ['src', 'dist']) {
test(`preset messages retain invalid and missing causes and clear after registry recovery (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async () => {
    let dashboard = { views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: {
      paint: { broken: { unsupported: true } },
    } }] }] };
    let eventCallback;
    const connection = {
      connected: true,
      addEventListener() {}, removeEventListener() {},
      sendMessagePromise: async () => dashboard,
      subscribeEvents: async callback => { eventCallback = callback; return () => { eventCallback = null; }; },
    };
    window.__updateMessageRegistry = next => {
      dashboard = next;
      eventCallback?.({ event_type: 'lovelace_updated' });
    };
    const hass = { connection, connected: true, states: {
      'sensor.preset_card': window.__sbcpCreateState(35),
      'sensor.preset_feature': window.__sbcpCreateState(45),
    } };
    await window.__sbcpRenderCard({ hass, config: {
      bar: { paint: { preset: 'broken' } }, entities: [{ entity: 'sensor.preset_card' }],
    } });
    await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.preset_feature' }, config: {
      bar: { paint: { preset: 'missing' } },
    } });
  });

  const cardMessages = page.locator('sensor-bar-card-plus .sbcp-messages');
  const featureMessages = page.locator('sensor-bar-card-plus-feature .sbcp-messages');
  await expect(cardMessages).toContainText('Paint preset “broken” is invalid');
  await expect(cardMessages).toContainText('unsupported preset property');
  await expect(featureMessages).toContainText('Paint preset “missing” was not found');
  await expect(featureMessages).toContainText('Using the inherited paint');

  await page.evaluate(() => window.__updateMessageRegistry({ views: [{ cards: [{
    type: 'custom:sensor-bar-card-plus', preset_library: { paint: {
      broken: { fill_style: 'solid', color: '#22aa66' }, missing: { fill_style: 'solid', color: '#3366aa' },
    } },
  }] }] }));
  await expect(cardMessages).toBeHidden();
  await expect(featureMessages).toBeHidden();
});
}

for (const source of ['src', 'dist']) {
test(`a master Card reports duplicate dashboard masters without any preset references (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async () => {
    const dashboard = { views: [{ cards: [
      { type: 'custom:sensor-bar-card-plus', preset_library: { paint: {} } },
      { type: 'vertical-stack', cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: {} } }] },
    ] }] };
    const connection = {
      connected: true,
      addEventListener() {}, removeEventListener() {},
      sendMessagePromise: async () => dashboard,
      subscribeEvents: async () => () => {},
    };
    const hass = { connection, connected: true, states: { 'sensor.master': window.__sbcpCreateState(25) } };
    await window.__sbcpRenderCard({ hass, config: {
      preset_library: { paint: {} }, entities: [{ entity: 'sensor.master' }],
    } });
  });
  const area = page.locator('sensor-bar-card-plus .sbcp-messages');
  await expect(area).toBeVisible();
  await expect(area).toContainText('Dashboard has 2 master Cards');
  await expect(area).toContainText('preset resolution is disabled');
});
}
