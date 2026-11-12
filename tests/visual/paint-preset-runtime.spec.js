const { test, expect } = require('@playwright/test');

for (const source of ['src', 'dist']) {
  test(`dashboard paint preset runtime is shared and patches both hosts (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    await page.evaluate(async () => {
      const states = { 'sensor.paint_runtime': window.__sbcpCreateState(42) };
      const makeConnection = color => {
        const listeners = new Map();
        let eventCallback = null;
        const connection = {
          connected: true,
          fetches: 0,
          eventSubscriptions: 0,
          eventUnsubscriptions: 0,
          presetByDashboard: {},
          addEventListener: (name, callback) => {
            const callbacks = listeners.get(name) ?? new Set();
            callbacks.add(callback);
            listeners.set(name, callbacks);
          },
          removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
          sendMessagePromise: async request => {
            connection.fetches += 1;
            return { sbcp_fragments: { paint_presets: { house: { fill_style: 'solid',
              color: connection.presetByDashboard[request.url_path] ?? color } } } };
          },
          subscribeEvents: async callback => {
            connection.eventSubscriptions += 1;
            eventCallback = callback;
            return async () => { connection.eventUnsubscriptions += 1; eventCallback = null; };
          },
          update: (nextColor, dashboard = 'tests') => {
            connection.presetByDashboard[dashboard] = nextColor;
            eventCallback?.({ event_type: 'lovelace_updated' });
          },
          emit: name => { for (const callback of listeners.get(name) ?? []) callback(); },
          reconnect: () => connection.emit('ready'),
          disconnect: () => connection.emit('disconnected'),
        };
        return connection;
      };
      const connection = makeConnection('#cc2200');
      const hass = { states, connection, connected: true };
      window.__paintRuntime = { connection, hass, makeConnection };
      const config = {
        scale: { min: 0, max: 100 },
        bar: { animated: false, paint: { preset: 'house' } },
        entities: [{ entity: 'sensor.paint_runtime' }],
      };
      await window.__sbcpRenderCard({ config, hass });
      await window.__sbcpRenderFeature({ config: { type: 'custom:sensor-bar-card-plus-feature',
        entity: 'sensor.paint_runtime', scale: config.scale, bar: config.bar },
        context: { entity_id: 'sensor.paint_runtime' }, hass });
    });
    const cardFill = page.locator('sensor-bar-card-plus .bar-paint-layer').first();
    const featureFill = page.locator('sensor-bar-card-plus-feature .bar-paint-layer').first();
    await expect(cardFill).toHaveAttribute('style', /#cc2200/i);
    await expect(featureFill).toHaveAttribute('style', /#cc2200/i);
    const initial = await page.evaluate(() => {
      window.__paintRuntime.card = document.querySelector('sensor-bar-card-plus .bar-paint-layer');
      window.__paintRuntime.feature = document.querySelector('sensor-bar-card-plus-feature .bar-paint-layer');
      return { fetches: window.__paintRuntime.connection.fetches,
        subscriptions: window.__paintRuntime.connection.eventSubscriptions };
    });
    expect(initial.fetches).toBe(1);
    expect(initial.subscriptions).toBe(1);

    await page.evaluate(() => window.__paintRuntime.connection.update('#0055cc'));
    await expect(cardFill).toHaveAttribute('style', /#0055cc/i);
    await expect(featureFill).toHaveAttribute('style', /#0055cc/i);
    const patched = await page.evaluate(() => ({
      cardSame: document.querySelector('sensor-bar-card-plus .bar-paint-layer') === window.__paintRuntime.card,
      featureSame: document.querySelector('sensor-bar-card-plus-feature .bar-paint-layer') === window.__paintRuntime.feature,
      fetches: window.__paintRuntime.connection.fetches,
    }));
    expect(patched.fetches).toBe(2);
    expect(patched.cardSame).toBe(true);
    expect(patched.featureSame).toBe(true);
    const freshStyle = await page.evaluate(async () => {
      const host = document.createElement('sensor-bar-card-plus');
      host.setConfig({ scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'house' } },
        entities: [{ entity: 'sensor.paint_runtime' }] });
      host.hass = window.__paintRuntime.hass;
      document.getElementById('mount').append(host);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const style = host.shadowRoot.querySelector('.bar-paint-layer').getAttribute('style');
      host.remove();
      return style;
    });
    expect(freshStyle).toBe(await cardFill.getAttribute('style'));

    await page.evaluate(() => {
      window.__paintRuntime.connection.presetByDashboard.energy = '#ee8800';
      history.pushState({}, '', '/energy/overview');
      document.querySelector('sensor-bar-card-plus').hass = window.__paintRuntime.hass;
      document.querySelector('sensor-bar-card-plus-feature').context = { entity_id: 'sensor.paint_runtime' };
    });
    await expect(cardFill).toHaveAttribute('style', /#ee8800/i);
    await expect(featureFill).toHaveAttribute('style', /#ee8800/i);

    await page.evaluate(() => {
      const { connection } = window.__paintRuntime;
      connection.disconnect();
      connection.update('#22aa44', 'energy');
      connection.connected = true;
      connection.reconnect();
    });
    await expect(cardFill).toHaveAttribute('style', /#22aa44/i);
    await expect(featureFill).toHaveAttribute('style', /#22aa44/i);

    await page.evaluate(() => {
      const nextConnection = window.__paintRuntime.makeConnection('#8800bb');
      const hass = { ...window.__paintRuntime.hass, connection: nextConnection };
      window.__paintRuntime.replacementConnection = nextConnection;
      document.querySelector('sensor-bar-card-plus').hass = hass;
      document.querySelector('sensor-bar-card-plus-feature').hass = hass;
    });
    await expect(cardFill).toHaveAttribute('style', /#8800bb/i);
    await expect(featureFill).toHaveAttribute('style', /#8800bb/i);
    await expect.poll(() => page.evaluate(() => window.__paintRuntime.replacementConnection.fetches)).toBe(1);

    await page.evaluate(() => {
      window.__paintRuntime.card = document.querySelector('sensor-bar-card-plus .bar-paint-layer');
      window.__paintRuntime.feature = document.querySelector('sensor-bar-card-plus-feature .bar-paint-layer');
      document.querySelector('sensor-bar-card-plus').remove();
      document.querySelector('sensor-bar-card-plus-feature').parentElement.remove();
    });
    await expect.poll(() => page.evaluate(() => window.__paintRuntime.replacementConnection.eventUnsubscriptions)).toBe(1);
  });
}

test('missing runtime preset falls back to normalized inherited paint in Card and Feature', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const connection = {
      connected: true,
      addEventListener() {}, removeEventListener() {},
      sendMessagePromise: async () => ({ sbcp_fragments: { paint_presets: { other: { fill_style: 'solid', color: '#ff0000' } } } }),
      subscribeEvents: async () => () => {},
    };
    const hass = { connection, connected: true, states: { 'sensor.paint_fallback': window.__sbcpCreateState(42) } };
    await window.__sbcpRenderCard({ hass, config: {
      scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'missing', color: '#228844' } },
      entities: [{ entity: 'sensor.paint_fallback' }],
    } });
    await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.paint_fallback' }, config: {
      type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.paint_fallback',
      scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'missing', color: '#228844' } },
    } });
  });
  await expect(page.locator('sensor-bar-card-plus .bar-paint-layer').first()).toHaveAttribute('style', /#228844/i);
  await expect(page.locator('sensor-bar-card-plus-feature .bar-paint-layer').first()).toHaveAttribute('style', /#228844/i);
});

for (const source of ['src', 'dist']) {
  test(`card-level presets inherit into entities without replacing local paint overrides (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    await page.evaluate(async () => {
      const connection = {
        connected: true, addEventListener() {}, removeEventListener() {},
        sendMessagePromise: async () => ({ sbcp_fragments: { paint_presets: {
          house: { fill_style: 'solid', color: '#aa2200' },
        } } }),
        subscribeEvents: async () => () => {},
      };
      const hass = { connected: true, connection, states: {
        'sensor.inherited': window.__sbcpCreateState(40),
        'sensor.override': window.__sbcpCreateState(40),
      } };
      await window.__sbcpRenderCard({ hass, config: {
        scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'house' } },
        entities: [
          { entity: 'sensor.inherited' },
          { entity: 'sensor.override', bar: { paint: { color: '#123456' } } },
        ],
      } });
      await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.inherited' }, config: {
        type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.inherited',
        scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'house' } },
      } });
    });
    const cardLayers = page.locator('sensor-bar-card-plus .bar-paint-layer[data-layer="base"]');
    const featureLayer = page.locator('sensor-bar-card-plus-feature .bar-paint-layer[data-layer="base"]');
    await expect(cardLayers.nth(0)).toHaveAttribute('style', /#aa2200/i);
    await expect(featureLayer).toHaveAttribute('style', /#aa2200/i);
    await expect(cardLayers.nth(1)).toHaveAttribute('style', /#123456/i);
    expect(await cardLayers.nth(0).getAttribute('style')).toBe(await featureLayer.getAttribute('style'));
  });
}

for (const source of ['src', 'dist']) {
  test(`preset resolution leaves unrelated legacy Card entities intact and matches Feature (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    await page.evaluate(async () => {
      const listeners = new Map();
      let eventCallback = null;
      let presetColor = '#aa2200';
      const connection = {
        connected: true,
        addEventListener: (name, callback) => {
          const callbacks = listeners.get(name) ?? new Set(); callbacks.add(callback); listeners.set(name, callbacks);
        },
        removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
        sendMessagePromise: async () => ({ sbcp_fragments: { paint_presets: {
          house: { fill_style: 'solid', color: presetColor },
        } } }),
        subscribeEvents: async callback => { eventCallback = callback; return async () => { eventCallback = null; }; },
        update: color => { presetColor = color; eventCallback?.({ event_type: 'lovelace_updated' }); },
      };
      const hass = { connected: true, connection, states: {
        'sensor.named': window.__sbcpCreateState(40),
        'sensor.legacy': window.__sbcpCreateState(40),
      } };
      const cardConfig = {
        scale: { min: 0, max: 100 }, bar: { animated: false },
        entities: [
          { entity: 'sensor.named', bar: { paint: { preset: 'house' } } },
          { entity: 'sensor.legacy', color: '#123456' },
        ],
      };
      const presetFeatureConfig = { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.named',
        scale: { min: 0, max: 100 }, bar: { animated: false, paint: { preset: 'house' } } };
      const legacyFeatureConfig = { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.legacy',
        scale: { min: 0, max: 100 }, bar: { animated: false, color: '#123456' } };
      await window.__sbcpRenderCard({ hass, config: cardConfig });
      await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.named' }, config: presetFeatureConfig });
      await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.legacy' }, config: legacyFeatureConfig });
      window.__presetIsolation = {
        connection, hass, cardConfig, presetFeatureConfig, legacyFeatureConfig,
        card: document.querySelector('sensor-bar-card-plus'),
        presetFeature: document.querySelector('sensor-bar-card-plus-feature'),
        legacyFeature: [...document.querySelectorAll('sensor-bar-card-plus-feature')].at(-1),
      };
    });

    const card = page.locator('sensor-bar-card-plus');
    const cardRows = card.locator('.bar-paint-layer[data-layer="base"]');
    const presetFeature = page.locator('sensor-bar-card-plus-feature').nth(0).locator('.bar-paint-layer[data-layer="base"]');
    const legacyFeature = page.locator('sensor-bar-card-plus-feature').nth(1).locator('.bar-paint-layer[data-layer="base"]');
    const initialPreset = await cardRows.nth(0).getAttribute('style');
    const initialLegacy = await cardRows.nth(1).getAttribute('style');
    await expect(cardRows.nth(0)).toHaveAttribute('style', /#aa2200/i);
    await expect(presetFeature).toHaveAttribute('style', /#aa2200/i);
    await expect(cardRows.nth(1)).toHaveAttribute('style', /#123456/i);
    await expect(legacyFeature).toHaveAttribute('style', /#123456/i);
    expect(initialLegacy).toMatch(/linear-gradient\(to right,?#123456 0%,#123456 100%\)/i);

    await page.evaluate(() => window.__presetIsolation.connection.update('#0066cc'));
    await expect(cardRows.nth(0)).toHaveAttribute('style', /#0066cc/i);
    await expect(presetFeature).toHaveAttribute('style', /#0066cc/i);
    await expect(cardRows.nth(1)).toHaveAttribute('style', /#123456/i);
    expect(await cardRows.nth(1).getAttribute('style')).toBe(initialLegacy);
    expect(await cardRows.nth(0).getAttribute('style')).not.toBe(initialPreset);

    const freshStyle = await page.evaluate(async () => {
      const runtime = document.createElement('sensor-bar-card-plus');
      runtime.setConfig(structuredClone(window.__presetIsolation.cardConfig));
      runtime.hass = window.__presetIsolation.hass;
      document.querySelector('#mount').append(runtime);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const style = runtime.shadowRoot.querySelectorAll('.bar-paint-layer')[0].getAttribute('style');
      runtime.remove();
      return style;
    });
    expect(freshStyle).toBe(await cardRows.nth(0).getAttribute('style'));
  });
}

for (const source of ['src', 'dist']) {
  test(`missing preset fallback preserves canonical segment coordinates at non-default scales (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    await page.evaluate(async () => {
      const connection = {
        connected: true, addEventListener() {}, removeEventListener() {},
        sendMessagePromise: async () => ({ sbcp_fragments: { paint_presets: {} } }),
        subscribeEvents: async () => () => {},
      };
      const hass = { connected: true, connection, states: { 'sensor.scale': window.__sbcpCreateState(50) } };
      const config = { scale: { min: 0, max: 200, direction: 'reverse' }, bar: { animated: false, paint: { preset: 'missing' } },
        entities: [{ entity: 'sensor.scale' }] };
      await window.__sbcpRenderCard({ hass, config });
      await window.__sbcpRenderFeature({ hass, context: { entity_id: 'sensor.scale' }, config: {
        type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.scale', scale: config.scale, bar: config.bar,
      } });
    });
    const cardStyle = await page.locator('sensor-bar-card-plus .bar-paint-layer[data-layer="base"]').first().getAttribute('style');
    const featureStyle = await page.locator('sensor-bar-card-plus-feature .bar-paint-layer[data-layer="base"]').first().getAttribute('style');
    expect(cardStyle).toBe(featureStyle);
    expect(cardStyle).toMatch(/25%/);
    expect(cardStyle).toMatch(/67%/);
    expect(cardStyle).not.toMatch(/16\.5%|37\.5%/);
  });
}
