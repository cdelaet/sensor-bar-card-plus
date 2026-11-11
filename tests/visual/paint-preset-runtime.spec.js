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
