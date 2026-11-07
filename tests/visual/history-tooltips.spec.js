const { test, expect } = require('@playwright/test');

async function mountHistoryHosts(page, peakResult, floorResult = peakResult) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const config = { scale: { min: 0, max: 100 }, peak: { enabled: true }, floor: { enabled: true } };
    const states = { 'sensor.power': { state: '40', attributes: {} } };
    const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, states });
    const feature = await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.power' } });
    window.__tooltipHosts = { card, feature };
  });
  await page.evaluate(({ peakResult, floorResult }) => {
    const { card, feature } = window.__tooltipHosts;
    for (const host of [card, feature]) {
      host._historicalRuntime.getResult = key => JSON.parse(key)[2] === 'peak' ? peakResult : floorResult;
    }
    card._update();
    feature._requestUpdate();
  }, { peakResult, floorResult });
  await page.evaluate(() => window.__tooltipHosts.feature.updateComplete);
}

test('history tooltip waits 150ms, closes on pointer leave, and clamps at a rail edge', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: 0, status: 'partial', provenance: { coverage: { reason: 'missing intervals' } } },
    { value: 100, status: 'stale' });
  const trigger = page.locator('sensor-bar-card-plus .history-indicator').first();
  await expect(trigger).toHaveAttribute('data-sbcp-tooltip', 'Partial history: Required history intervals are missing');
  await expect(trigger).not.toHaveAttribute('title');
  const cardRectBefore = await page.locator('sensor-bar-card-plus').evaluate(node => {
    const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
  });

  await page.evaluate(() => {
    const realSetTimeout = window.setTimeout.bind(window);
    const realClearTimeout = window.clearTimeout.bind(window);
    window.__tooltipTimerCapture = { realSetTimeout, realClearTimeout, callback: null, delay: null };
    window.setTimeout = (callback, delay, ...args) => {
      if (delay === 150) {
        window.__tooltipTimerCapture.callback = () => callback(...args);
        window.__tooltipTimerCapture.delay = delay;
        return -150;
      }
      return realSetTimeout(callback, delay, ...args);
    };
    window.clearTimeout = id => id === -150 ? window.__tooltipTimerCapture.callback = null : realClearTimeout(id);
  });
  await trigger.evaluate(node => node.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' })));
  const tooltip = page.locator('sensor-bar-card-plus').locator('.sbcp-tooltip');
  await expect(tooltip).toBeHidden();
  expect(await page.evaluate(() => window.__tooltipTimerCapture.delay)).toBe(150);
  await page.evaluate(() => {
    const capture = window.__tooltipTimerCapture;
    const callback = capture.callback;
    window.setTimeout = capture.realSetTimeout;
    window.clearTimeout = capture.realClearTimeout;
    callback();
  });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveAttribute('role', 'tooltip');
  await expect(tooltip).toHaveText('Partial history: Required history intervals are missing');
  await expect(trigger).toHaveAttribute('aria-describedby', await tooltip.getAttribute('id'));
  const geometry = await tooltip.evaluate(node => {
    const r = node.getBoundingClientRect();
    const triggerRect = node.getRootNode().querySelector('.history-indicator').getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, triggerLeft: triggerRect.left,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      outsideTrack: !node.closest('.bar-track'),
      scrollWidth: document.documentElement.scrollWidth };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.left).toBeLessThan(geometry.triggerLeft);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.outsideTrack).toBe(true);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  const cardRectAfter = await page.locator('sensor-bar-card-plus').evaluate(node => {
    const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
  });
  expect(cardRectAfter).toEqual(cardRectBefore);
  await trigger.evaluate(node => node.dispatchEvent(new PointerEvent('pointerout', {
    bubbles: true, pointerType: 'mouse', relatedTarget: document.body,
  })));
  await expect(tooltip).toBeHidden();
  await expect(trigger).not.toHaveAttribute('aria-describedby');
});

test('history tooltip stays beside its trigger in a transformed editor-style preview and on a dashboard card', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: 60, status: 'partial' },
    { value: 20, status: 'stale' });
  const card = page.locator('sensor-bar-card-plus');
  await card.evaluate(host => {
    const preview = document.createElement('div');
    preview.dataset.testPreview = 'true';
    Object.assign(preview.style, { transform: 'scale(.78)', transformOrigin: 'top left', width: '700px', margin: '20px 0 0 24px' });
    host.before(preview);
    preview.append(host);
  });

  const previewTrigger = card.locator('.history-indicator').first();
  await previewTrigger.focus();
  const previewTooltip = card.locator('.sbcp-tooltip');
  await expect(previewTooltip).toBeVisible();
  const previewGeometry = await previewTooltip.evaluate(tip => {
    const tipRect = tip.getBoundingClientRect();
    const triggerRect = tip.getRootNode().querySelector('.history-indicator').getBoundingClientRect();
    return { tipRect: { left: tipRect.left, right: tipRect.right, top: tipRect.top, bottom: tipRect.bottom },
      triggerRect: { left: triggerRect.left, right: triggerRect.right, top: triggerRect.top, bottom: triggerRect.bottom },
      topLayer: tip.matches(':popover-open') };
  });
  expect(previewGeometry.topLayer).toBe(true);
  expect(previewGeometry.tipRect.left).toBeLessThan(previewGeometry.triggerRect.right);
  expect(previewGeometry.tipRect.right).toBeGreaterThan(previewGeometry.triggerRect.left);
  expect(Math.min(Math.abs(previewGeometry.tipRect.bottom - previewGeometry.triggerRect.top),
    Math.abs(previewGeometry.tipRect.top - previewGeometry.triggerRect.bottom))).toBeLessThan(12);

  await previewTrigger.evaluate(node => node.blur());
  await expect(previewTooltip).toBeHidden();
  const feature = page.locator('sensor-bar-card-plus-feature');
  await feature.evaluate(host => {
    const preview = document.createElement('div');
    preview.dataset.testPreview = 'true';
    Object.assign(preview.style, { transform: 'scale(.78)', transformOrigin: 'top left', width: '700px', margin: '20px 0 0 24px' });
    host.before(preview);
    preview.append(host);
  });
  const featureTrigger = feature.locator('.history-indicator').first();
  await featureTrigger.focus();
  const featureTooltip = feature.locator('.sbcp-tooltip');
  await expect(featureTooltip).toBeVisible();
  const featureGeometry = await featureTooltip.evaluate(tip => {
    const tipRect = tip.getBoundingClientRect();
    const triggerRect = tip.getRootNode().querySelector('.history-indicator').getBoundingClientRect();
    return { tipRect: { left: tipRect.left, right: tipRect.right, top: tipRect.top, bottom: tipRect.bottom },
      triggerRect: { left: triggerRect.left, right: triggerRect.right, top: triggerRect.top, bottom: triggerRect.bottom },
      topLayer: tip.matches(':popover-open') };
  });
  expect(featureGeometry.topLayer).toBe(true);
  expect(featureGeometry.tipRect.left).toBeLessThan(featureGeometry.triggerRect.right);
  expect(featureGeometry.tipRect.right).toBeGreaterThan(featureGeometry.triggerRect.left);
  expect(Math.min(Math.abs(featureGeometry.tipRect.bottom - featureGeometry.triggerRect.top),
    Math.abs(featureGeometry.tipRect.top - featureGeometry.triggerRect.bottom))).toBeLessThan(12);
  await featureTrigger.evaluate(node => node.blur());
  await expect(featureTooltip).toBeHidden();
  await feature.evaluate(host => { const preview = host.parentElement; preview.before(host); preview.remove(); });
  await card.evaluate(host => {
    const preview = host.parentElement;
    preview.before(host);
    preview.remove();
  });
  const dashboardTrigger = card.locator('.history-indicator').nth(1);
  await dashboardTrigger.focus();
  const dashboardTooltip = card.locator('.sbcp-tooltip');
  await expect(dashboardTooltip).toBeVisible();
  const dashboardGeometry = await dashboardTooltip.evaluate(tip => {
    const tipRect = tip.getBoundingClientRect();
    const triggerRect = tip.getRootNode().querySelectorAll('.history-indicator')[1].getBoundingClientRect();
    return { left: tipRect.left, right: tipRect.right, triggerLeft: triggerRect.left,
      triggerRight: triggerRect.right, viewportWidth: innerWidth };
  });
  expect(dashboardGeometry.left).toBeLessThan(dashboardGeometry.triggerRight);
  expect(dashboardGeometry.right).toBeGreaterThan(dashboardGeometry.triggerLeft);
  expect(dashboardGeometry.left).toBeGreaterThanOrEqual(0);
  expect(dashboardGeometry.right).toBeLessThanOrEqual(dashboardGeometry.viewportWidth);
});

test('actual preview shadow DOM keeps pointer-triggered Card and Feature tooltips visible', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: 60, status: 'partial' },
    { value: 20, status: 'stale' });
  await page.evaluate(() => {
    const preview = document.createElement('div');
    preview.id = 'editor-preview-host';
    const shadow = preview.attachShadow({ mode: 'open' });
    const viewport = document.createElement('div');
    viewport.id = 'preview-viewport';
    Object.assign(viewport.style, {
      position: 'relative', width: '220px', height: '220px', overflow: 'hidden',
      transform: 'translate(18px, 12px) scale(.72)', transformOrigin: 'center center',
    });
    shadow.append(viewport);
    const { card, feature } = window.__tooltipHosts;
    for (const host of [card, feature]) host.style.width = '340px';
    viewport.append(card, feature);
    document.querySelector('#mount').append(preview);
  });

  for (const hostName of ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature']) {
    const host = page.locator(`#editor-preview-host ${hostName}`);
    const trigger = host.locator('.history-indicator').first();
    await trigger.hover();
    const tooltip = host.locator('.sbcp-tooltip');
    await expect(tooltip).toHaveText('Partial history: History is incomplete');
    await expect(tooltip).toBeVisible();
    const result = await tooltip.evaluate(tip => {
      const tipRect = tip.getBoundingClientRect();
      const triggerRect = tip.getRootNode().querySelector('.history-indicator').getBoundingClientRect();
      const viewportRect = document.querySelector('#editor-preview-host').shadowRoot.querySelector('#preview-viewport').getBoundingClientRect();
      const intersection = {
        left: Math.max(tipRect.left, viewportRect.left), right: Math.min(tipRect.right, viewportRect.right),
        top: Math.max(tipRect.top, viewportRect.top), bottom: Math.min(tipRect.bottom, viewportRect.bottom),
      };
      return { left: tipRect.left, right: tipRect.right, top: tipRect.top, bottom: tipRect.bottom,
        trigger: { left: triggerRect.left, right: triggerRect.right, top: triggerRect.top, bottom: triggerRect.bottom },
        intersectionWidth: Math.max(0, intersection.right - intersection.left),
        intersectionHeight: Math.max(0, intersection.bottom - intersection.top),
        width: tipRect.width, height: tipRect.height, hidden: tip.hidden,
        topLayer: tip.matches(':popover-open'), viewport: { left: viewportRect.left, right: viewportRect.right,
          top: viewportRect.top, bottom: viewportRect.bottom },
        controllerTriggerConnected: tip.getRootNode().__sbcpTooltipController?.trigger?.isConnected };
    });
    expect(result.hidden).toBe(false);
    expect(result.topLayer).toBe(true);
    expect(result.controllerTriggerConnected).toBe(true);
    expect(result.intersectionWidth).toBeGreaterThan(0);
    expect(result.intersectionHeight).toBeGreaterThan(0);
    expect(result.left).toBeLessThan(result.trigger.right);
    expect(result.right).toBeGreaterThan(result.trigger.left);
    expect(result.left < result.viewport.left || result.right > result.viewport.right).toBe(true);
    expect(Math.min(Math.abs(result.bottom - result.trigger.top), Math.abs(result.top - result.trigger.bottom))).toBeLessThan(12);
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  }
});

test('history explanations open from keyboard focus and touch in Card and Feature', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: null, status: 'pending' },
    { value: null, status: 'invalid' });
  for (const hostName of ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature']) {
    const host = page.locator(hostName);
    const badge = host.locator('.history-status-badge');
    await expect(badge).toHaveAttribute('tabindex', '0');
    await expect(badge).not.toHaveAttribute('title');
    await badge.focus();
    const tooltip = host.locator('.sbcp-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText('Peak: Historical data is still loading; Floor: Historical window is invalid or unsupported');
    await expect(badge).toHaveAttribute('aria-describedby', await tooltip.getAttribute('id'));
    await badge.evaluate(node => node.blur());
    await expect(tooltip).toBeHidden();
  }
  const featureTrigger = page.locator('sensor-bar-card-plus-feature .history-status-badge');
  await featureTrigger.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 3, isPrimary: true });
  await expect(page.locator('sensor-bar-card-plus-feature .sbcp-tooltip')).toBeVisible();
  await featureTrigger.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 4, isPrimary: true });
  await expect(page.locator('sensor-bar-card-plus-feature .sbcp-tooltip')).toBeHidden();
  await mountHistoryHosts(page,
    { value: 80, status: 'partial' },
    { value: 20, status: 'stale' });
  const staleMarker = page.locator('sensor-bar-card-plus-feature .history-indicator').nth(1);
  await staleMarker.focus();
  await expect(page.locator('sensor-bar-card-plus-feature .sbcp-tooltip')).toHaveText('Stale history: Cached history is stale; refresh failed');
});

test('unavailable history tooltip reuses the reason-specific status summary', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: null, status: 'unavailable', provenance: { coverage: { reason: 'Statistics metadata is unavailable' } } });
  const badge = page.locator('sensor-bar-card-plus .history-status-badge');
  await badge.focus();
  const tooltip = page.locator('sensor-bar-card-plus .sbcp-tooltip');
  await expect(tooltip).toHaveText('Peak and Floor: Long-term statistics are unavailable for this entity');
});

test('one tooltip instance is patched and removed with Card and Feature content', async ({ page }) => {
  await mountHistoryHosts(page,
    { value: 80, status: 'partial' },
    { value: 20, status: 'stale' });
  for (const hostName of ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature']) {
    const host = page.locator(hostName);
    await expect(host.locator('.sbcp-tooltip')).toHaveCount(1);
    await host.locator('.history-indicator').first().focus();
    const tooltip = host.locator('.sbcp-tooltip');
    await expect(tooltip).toBeVisible();
    await host.evaluate(async element => {
      element._historicalRuntime.getResult = () => ({ value: 80, status: 'stale' });
      if (element._update) element._update();
      else { element._requestUpdate(); await element.updateComplete; }
    });
    await expect(host.locator('.sbcp-tooltip')).toHaveCount(1);
    await expect(tooltip).toHaveText('Stale history: Cached history is stale; refresh failed');
    await host.locator('.history-indicator').first().evaluate(node => node.remove());
    await expect(tooltip).toBeHidden();
    await host.evaluate(element => element.remove());
    await expect(tooltip).toHaveCount(0);
  }
});
