const { test, expect } = require('@playwright/test');

test('history diagnostics use the shared message area instead of marker tooltips', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const config = {
      scale: { min: 0, max: 100 },
      peak: { enabled: true, window: 'today' },
      floor: { enabled: true, window: '24h' },
    };
    const states = { 'sensor.power': { state: '40', attributes: {} } };
    const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, states });
    const feature = await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.power' } });
    for (const host of [card, feature]) {
      host._historicalRuntime.getResult = id => JSON.parse(id)[2] === 'peak'
        ? { value: 80, status: 'partial', provenance: { coverage: { reason: 'missing intervals' } } }
        : { value: 20, status: 'stale' };
    }
    card._update();
    feature._requestUpdate();
    await feature.updateComplete;
  });

  for (const host of [page.locator('sensor-bar-card-plus'), page.locator('sensor-bar-card-plus-feature')]) {
    const messages = host.locator('.sbcp-messages');
    await expect(messages).toContainText('Peak marker · Configured window: today');
    await expect(messages).toContainText('Floor marker · Configured window: 24h');
    await expect(messages.locator('.sbcp-message[data-severity="warning"]')).toHaveCount(2);
    await expect(host.locator('.history-status-badge, .history-indicator')).toHaveCount(0);
    for (const marker of ['.peak-marker', '.floor-marker']) {
      await expect(host.locator(marker)).not.toHaveAttribute('data-history-status', /.+/);
      await expect(host.locator(marker)).not.toHaveAttribute('data-sbcp-tooltip', /.+/);
    }
  }
});
