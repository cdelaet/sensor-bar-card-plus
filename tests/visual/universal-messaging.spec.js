const { test, expect } = require('./visual-test.cjs');

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

for (const source of ['src', 'dist']) {
test(`repeated entity rows retain scoped diagnostics and recover after structured source correction (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  const invalidConfig = {
    scale: { min: 0, max: 100 },
    target: { at: 120 },
    baseline: { at: 130 },
    markers: [{ at: { entity: 'sensor.marker', attribute: 'position' }, show_marker: false }],
    entities: [
      { entity: 'sensor.shared', attribute: 'temperature', scale: { min: 0, max: 50 }, target: { at: 60 }, baseline: { at: 70 }, bar: { color: 'red' } },
      { entity: 'sensor.shared', attribute: 'humidity', scale: { min: 0, max: 200 }, target: { at: 250 }, baseline: { at: 300 }, bar: { color: 'blue' } },
    ],
  };
  await page.evaluate(async config => {
    const states = { 'sensor.shared': window.__sbcpCreateState(25, { temperature: 25, humidity: 45 }) };
    await window.__sbcpRenderCard({ width: 360, config, states });
  }, invalidConfig);
  const card = page.locator('sensor-bar-card-plus');

  const scoped = await page.evaluate(() => document.querySelector('sensor-bar-card-plus')._diagnostics.warnings
    .map(({ code, path, entity }) => ({ code, path, entity })));
  expect(scoped.filter(item => item.code === 'source.invalid_entity_source')).toEqual([
    { code: 'source.invalid_entity_source', path: 'markers[0].at', entity: null },
  ]);
  expect(scoped.some(item => item.code === 'markers.invalid_source' || item.code === 'entities.duplicate_entity')).toBe(false);
  expect(scoped.some(item => item.code === 'target.outside_scale' || item.code === 'baseline.outside_scale')).toBe(false);
  await expect(card.locator('.sbcp-message')).toHaveCount(1);

  const clipping = await card.evaluate(element => [...element.shadowRoot.querySelectorAll('.row[data-entity]')].map(row => ({
    target: row.querySelector('.target-marker')?.style.left,
    baseline: row.querySelector('.baseline-indicator')?.style.left,
  })));
  expect(clipping).toEqual([
    { target: '100%', baseline: '100%' },
    { target: '100%', baseline: '100%' },
  ]);

  await page.evaluate(() => document.querySelector('sensor-bar-card-plus').setConfig({
    scale: { min: 0, max: 100 },
    target: { at: 120 },
    baseline: { at: 130 },
    markers: [{ at: { entity: { id: 'sensor.marker', attribute: 'position' } }, show_marker: false }],
    entities: [
      { entity: 'sensor.shared', attribute: 'temperature', scale: { min: 0, max: 50 }, target: { at: 60 }, baseline: { at: 70 }, bar: { color: 'red' } },
      { entity: 'sensor.shared', attribute: 'humidity', scale: { min: 0, max: 200 }, target: { at: 250 }, baseline: { at: 300 }, bar: { color: 'blue' } },
    ],
  }));
  await expect(card.locator('.sbcp-messages')).toBeHidden();
});
}

for (const source of ['src', 'dist']) {
test(`valid out-of-Scale Target and Baseline values stay quiet and clip in Card, Entity, and Tile Feature scopes (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  const config = {
    scale: { min: 0, max: 100 },
    target: { at: 120 },
    baseline: { at: 130 },
    entities: [
      { entity: 'sensor.row_a', scale: { min: 0, max: 50 }, target: { at: 60 }, baseline: { at: 70 } },
      { entity: 'sensor.row_b', scale: { min: 0, max: 200 }, target: { at: 250 }, baseline: { at: 300 } },
    ],
  };
  await page.evaluate(async config => {
    const states = {
      'sensor.row_a': window.__sbcpCreateState(25),
      'sensor.row_b': window.__sbcpCreateState(100),
      'sensor.feature': window.__sbcpCreateState(50),
    };
    await window.__sbcpRenderCard({ width: 360, config, states });
    await window.__sbcpRenderFeature({ width: 360, config: { ...config, entities: undefined }, states,
      context: { entity_id: 'sensor.feature' } });
  }, config);

  const result = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const feature = document.querySelector('sensor-bar-card-plus-feature');
    const outOfScaleWarnings = diagnostics => diagnostics.warnings.filter(({ code }) => (
      code === 'target.outside_scale' || code === 'baseline.outside_scale'
    ));
    return {
      cardWarnings: outOfScaleWarnings(card._diagnostics),
      cardRows: [...card.shadowRoot.querySelectorAll('.row[data-entity]')].map(row => ({
        target: row.querySelector('.target-marker')?.style.left,
        baseline: row.querySelector('.baseline-indicator')?.style.left,
      })),
      featureWarnings: outOfScaleWarnings(feature._diagnostics),
      featureTarget: feature._row.markers.find(marker => marker.type === 'target')?.position,
      featureBaseline: feature._row.baselinePositionPercent,
    };
  });
  expect(result.cardWarnings).toEqual([]);
  expect(result.cardRows).toEqual([
    { target: '100%', baseline: '100%' },
    { target: '100%', baseline: '100%' },
  ]);
  expect(result.featureWarnings).toEqual([]);
  expect(result.featureTarget).toBe(100);
  expect(result.featureBaseline).toBe(100);
  await expect(page.locator('sensor-bar-card-plus .sbcp-messages')).toBeHidden();
  await expect(page.locator('sensor-bar-card-plus-feature .sbcp-messages')).toBeHidden();
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
test(`history status messages retain severity, deduplicate, recover, and match between Card and Feature (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async () => {
    const config = {
      scale: { min: 0, max: 100 },
      peak: { enabled: true, window: 'today' },
      floor: { enabled: true, window: '24h' },
    };
    const states = { 'sensor.history': window.__sbcpCreateState(40) };
    const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.history'] }, states });
    const feature = await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.history' } });
    const results = {
      peak: { value: 80, status: 'partial', provenance: { coverage: { reason: 'missing intervals' } } },
      floor: { value: 20, status: 'stale' },
    };
    const updateHistory = async () => {
      for (const host of [card, feature]) {
        host._historicalRuntime.getResult = id => results[JSON.parse(id)[2]];
      }
      card._update();
      feature._requestUpdate();
      await feature.updateComplete;
    };
    window.__updateHistory = async next => { Object.assign(results, next); await updateHistory(); };
    await updateHistory();
    window.__historyHosts = { card, feature };
  });

  const card = page.locator('sensor-bar-card-plus');
  const feature = page.locator('sensor-bar-card-plus-feature');
  for (const host of [card, feature]) {
    const area = host.locator('.sbcp-messages');
    await expect(area).toBeVisible();
    await expect(area.locator('.sbcp-message')).toHaveCount(2);
    await expect(area.locator('.sbcp-message-count[data-severity="warning"] span:last-child')).toHaveText('2');
    await expect(area.locator('.sbcp-message-count[data-severity="info"] span:last-child')).toHaveText('0');
    await expect(area.locator('.sbcp-message-count[data-severity="error"] span:last-child')).toHaveText('0');
    await expect(area).toContainText('sensor.history · Peak marker · Configured window: today');
    await expect(area).toContainText('Required history intervals are missing');
    await expect(area).toContainText('may miss the true extremum');
    await expect(area).toContainText('sensor.history · Floor marker · Configured window: 24h');
    await expect(area).toContainText('cached value from the last successful refresh');
    await expect(host.locator('.history-status-badge, .history-indicator')).toHaveCount(0);
    await expect(host.locator('.peak-marker')).not.toHaveAttribute('data-history-status', /.+/);
    await expect(host.locator('.floor-marker')).not.toHaveAttribute('data-sbcp-tooltip', /.+/);
  }
  const initial = await card.locator('.sbcp-message').allTextContents();
  expect(await feature.locator('.sbcp-message').allTextContents()).toEqual(initial);
  await page.evaluate(async () => window.__updateHistory({}));
  for (const host of [card, feature]) await expect(host.locator('.sbcp-message')).toHaveCount(2);

  for (const host of [card, feature]) {
    await host.locator('.sbcp-disclosure-toggle').click();
    await expect(host.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
  }
  await page.evaluate(async () => window.__updateHistory({
    peak: { value: null, status: 'pending' },
    floor: { value: null, status: 'unavailable' },
  }));
  for (const host of [card, feature]) {
    const area = host.locator('.sbcp-messages');
    await expect(area.locator('.sbcp-message')).toHaveCount(2);
    await expect(area.locator('.sbcp-message-count[data-severity="info"] span:last-child')).toHaveText('1');
    await expect(area.locator('.sbcp-message-count[data-severity="error"] span:last-child')).toHaveText('1');
    await expect(host.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(area.locator('.sbcp-disclosure-panel')).toBeVisible();
  }

  await page.evaluate(async () => {
    const { card: cardHost, feature: featureHost } = window.__historyHosts;
    const states = { 'sensor.history': window.__sbcpCreateState(45) };
    cardHost.hass = { ...cardHost.hass, states };
    featureHost.hass = { ...featureHost.hass, states };
    cardHost._update();
    featureHost._requestUpdate();
    await featureHost.updateComplete;
  });
  await expect(card.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(feature.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');

  await page.evaluate(async () => window.__updateHistory({
    peak: { value: 80, status: 'available' },
    floor: { value: 20, status: 'available' },
  }));
  for (const host of [card, feature]) {
    await expect(host.locator('.sbcp-messages')).toBeHidden();
    await expect(host.locator('.history-status-badge, .history-indicator')).toHaveCount(0);
  }
  await page.evaluate(async () => window.__updateHistory({
    peak: { value: 80, status: 'partial', provenance: { coverage: { reason: 'missing intervals' } } },
    floor: { value: 20, status: 'stale' },
  }));
  for (const host of [card, feature]) {
    await expect(host.locator('.sbcp-messages')).toBeVisible();
    await expect(host.locator('.sbcp-disclosure-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(host.locator('.sbcp-disclosure-panel')).toBeVisible();
    await expect(host.locator('.sbcp-message')).toHaveCount(2);
  }
});
}

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
test(`multiple empty dashboard Paint libraries are valid without preset references (${source})`, async ({ page }) => {
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
  await expect(area).toBeHidden();
  await expect.poll(() => page.locator('sensor-bar-card-plus').evaluate(element => element._paintPresetRegistry))
    .toMatchObject({ status: 'ready', libraryCount: 2, conflicts: {} });
});
}
