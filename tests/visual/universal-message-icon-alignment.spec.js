const { test, expect } = require('@playwright/test');

for (const source of ['src', 'dist']) {
  test(`severity icons align with diagnostic context in narrow Card and Tile layouts (${source})`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    await page.evaluate(async () => {
      const config = {
        scale: { min: 0, max: 100 },
        target: { at: 120 },
        bar: { paint: { opacity: -1 } },
        baseline: { above: { paint: { opacity: 140 } } },
        peak: { enabled: true, window: 'today' },
        floor: { enabled: true, window: '24h' },
      };
      const states = { 'sensor.messaging': window.__sbcpCreateState(50) };
      const card = await window.__sbcpRenderCard({ width: 120, config: { ...config, entities: ['sensor.messaging'] }, states });
      const feature = await window.__sbcpRenderFeature({ width: 120, height: 42, config, states,
        context: { entity_id: 'sensor.messaging' } });
      const results = {
        peak: { value: null, status: 'pending' },
        floor: { value: null, status: 'unavailable' },
      };
      for (const host of [card, feature]) host._historicalRuntime.getResult = id => results[JSON.parse(id)[2]];
      card._update();
      feature._requestUpdate();
      await feature.updateComplete;
    });

    const hosts = [page.locator('sensor-bar-card-plus'), page.locator('sensor-bar-card-plus-feature')];
    for (const host of hosts) {
      const area = host.locator('.sbcp-messages');
      for (const severity of ['info', 'warning', 'error']) {
        await expect(area.locator(`.sbcp-message[data-severity="${severity}"]`)).toHaveCount(severity === 'warning' ? 2 : 1);
      }
      await area.locator('.sbcp-disclosure-toggle').click();
      const layout = await area.locator('.sbcp-message').evaluateAll(messages => messages.map(message => {
        const icon = message.querySelector(':scope > .sbcp-message-icon').getBoundingClientRect();
        const context = message.querySelector('.sbcp-message-area').getBoundingClientRect();
        return {
          severity: message.dataset.severity,
          topDelta: Math.round(icon.top - context.top),
          width: Math.round(icon.width),
          height: Math.round(icon.height),
          clientWidth: message.clientWidth,
          scrollWidth: message.scrollWidth,
        };
      }));
    expect(layout.map(item => item.severity).sort()).toEqual(['error', 'info', 'warning', 'warning']);
      for (const item of layout) {
        expect(item.topDelta).toBe(3);
        expect(item.width).toBe(16);
        expect(item.height).toBe(16);
        expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
      }
      const panel = await area.locator('.sbcp-disclosure-panel').evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
      expect(panel.scroll).toBeLessThanOrEqual(panel.client);
    }
  });
}
