const { test, expect } = require('./visual-test.cjs');

test('card and feature report unavailable history without legacy marker diagnostics', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const config = { peak: { enabled: true, window: 'today' }, floor: { enabled: true, window: '24h' } };
    const states = { 'sensor.power': { state: '40', attributes: {} } };
    const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, states });
    const feature = await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.power' } });
    for (const host of [card, feature]) {
      host._historicalRuntime.getResult = id => JSON.parse(id)[2] === 'peak'
        ? { value: null, status: 'unavailable', provenance: { coverage: { reason: 'Statistics metadata is unavailable' } } }
        : { value: null, status: 'unavailable', provenance: { coverage: { reason: 'Statistics and entity units are incompatible' } } };
    }
    card._update(); feature._requestUpdate(); await feature.updateComplete;
  });
  for (const host of [page.locator('sensor-bar-card-plus'), page.locator('sensor-bar-card-plus-feature')]) {
    const messages = host.locator('.sbcp-messages');
    await expect(messages).toBeVisible();
    await expect(messages).toContainText('sensor.power · Peak marker · Configured window: today');
    await expect(messages).toContainText('sensor.power · Floor marker · Configured window: 24h');
    await expect(messages.locator('.sbcp-message[data-severity="error"]')).toHaveCount(2);
    await expect(host.locator('.peak-marker')).toBeHidden();
    await expect(host.locator('.floor-marker')).toBeHidden();
    await expect(host.locator('.history-status-badge, .history-indicator')).toHaveCount(0);
    await expect(host.locator('[data-history-status], [data-history-edge]')).toHaveCount(0);
  }
});

test('invalid configured windows produce one error message with their configured value', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const config = { peak: { enabled: true, window: '1441m' } };
    const states = { 'sensor.power': { state: '40', attributes: {} } };
    await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, states });
    await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.power' } });
  });
  for (const host of [page.locator('sensor-bar-card-plus'), page.locator('sensor-bar-card-plus-feature')]) {
    const messages = host.locator('.sbcp-messages');
    await expect(messages.locator('.sbcp-message')).toHaveCount(1);
    await expect(messages.locator('.sbcp-message[data-severity="error"]')).toHaveCount(1);
    await expect(messages).toContainText('sensor.power · Peak marker · Configured window: 1441m');
    await expect(messages).toContainText('invalid or unsupported');
    await expect(messages).toContainText('Peak marker is unavailable');
  }
});

for (const fillStyle of ['solid', 'bands', 'soft_bands', 'gradient', 'band_gradient']) {
  test(`shared ${fillStyle} bars render and patch in adapter DOM without a card`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    const result = await page.evaluate(async fillStyle => {
      const { normalizeCardConfig } = await import('/src/config/normalize.js');
      const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
      const { buildBarRenderModel } = await import('/src/view-model/bar-render-model.js');
      const { renderBar, patchBar } = await import('/src/render/bar-renderer.js');
      const { barTrackStyles, barMarkerStyles, getBarAnimationStyles } = await import('/src/render/bar-styles.js');
      const entityConfig = baseline => normalizeCardConfig({ entities: [{
        entity: 'sensor.power', scale: { min: -20, max: 20 },
        ...(baseline ? { baseline: { at: { entity: 'sensor.baseline' } } } : {}),
        bar: { fill_style: fillStyle, needle: true, animated: !baseline, segments: [
          { from: -20, to: 0, color: '#ff0000' },
          { from: 0, to: 20, color: '#0000ff' },
        ] },
        target: { at: 5 }, peak: { enabled: true }, floor: { enabled: true },
        markers: [{ id: 'reference', at: 0, shape: 'pin' }],
      }] }).entities[0];
      const makeModel = (config, value, baselineState = '0') => buildBarRenderModel(buildRowViewModel({
        entityConfig: config,
        entityState: { state: String(value), attributes: {} },
        hass: { states: { 'sensor.baseline': { state: baselineState, attributes: {} } } },
        extrema: { peak: { value: 15 }, floor: { value: -15 } },
      }), config, { height: 'var(--sbcp-row-height)' });
      const hosts = [true, false].map((baseline, index) => {
        const host = document.createElement('div');
        host.style.cssText = `width:400px;--sbcp-row-height:${index ? 42 : 28}px`;
        document.body.append(host);
        const root = host.attachShadow({ mode: 'open' });
        const config = entityConfig(baseline);
        root.innerHTML = `<style>${barTrackStyles}${barMarkerStyles}${getBarAnimationStyles('[data-bar-animated="false"]')}</style><div data-bar-animated="${!baseline}">${renderBar(makeModel(config, 10))}</div>`;
        return { root, config, container: root.querySelector('[data-bar-animated]') };
      });
      const { root, config, container } = hosts[0];
      const nodes = [...container.querySelectorAll('*')];
      const needleHost = hosts[1];
      const needleNodes = [...needleHost.container.querySelectorAll('*')];
      const otherHtml = hosts[1].container.innerHTML;
      const read = selector => {
        const node = root.querySelector(selector);
        const style = getComputedStyle(node);
        return { left: style.left, transition: style.transitionDuration, display: style.display };
      };
      const initial = {
        heights: hosts.map(({ root }) => root.querySelector('.bar-track').getBoundingClientRect().height),
        baseline: read('.baseline-indicator'),
        target: read('.target-marker'),
        needle: getComputedStyle(needleHost.root.querySelector('.needle-marker')).transitionDuration,
        needleAppearance: (() => {
          const style = getComputedStyle(needleHost.root.querySelector('.needle-marker'));
          return {
            width: style.width,
            backgroundImage: style.backgroundImage,
            backgroundColor: style.backgroundColor,
            filter: style.filter,
            left: needleHost.root.querySelector('.needle-marker').style.left,
          };
        })(),
        trackSize: (() => {
          const { width, height } = needleHost.root.querySelector('.bar-track').getBoundingClientRect();
          return { width, height };
        })(),
        generic: read('.generic-marker'),
        paint: getComputedStyle(root.querySelector('.bar-paint-layer')).backgroundImage,
      };
      patchBar(container, makeModel(config, -10, 'unknown'), { revealDuration: 300 });
      const unavailable = read('.baseline-indicator').display;
      patchBar(container, makeModel(config, -10, '0'), { revealDuration: 300 });
      const isolated = needleHost.container.innerHTML === otherHtml;
      const movedModel = makeModel(needleHost.config, -10, '0');
      movedModel.needle.pct = 25;
      patchBar(needleHost.container, movedModel, { revealDuration: 300 });
      const movedNeedle = needleHost.root.querySelector('.needle-marker').style.left;
      const updatedTrack = needleHost.root.querySelector('.bar-track').getBoundingClientRect();
      return {
        initial, unavailable,
        recovered: read('.baseline-indicator').display,
        movedNeedle,
        updatedTrackSize: { width: updatedTrack.width, height: updatedTrack.height },
        clip: root.querySelector('.bar-fill-reveal').style.clipPath,
        duration: root.querySelector('.bar-fill-reveal').style.getPropertyValue('--sbcp-reveal-duration'),
        stable: nodes.every((node, index) => node === container.querySelectorAll('*')[index]),
        needleStable: needleNodes.every((node, index) => node === needleHost.container.querySelectorAll('*')[index]),
        isolated,
        cards: document.querySelectorAll('sensor-bar-card-plus').length,
        labels: root.querySelectorAll('.bar-inner-label, .target-value-label, .generic-value-label').length,
      };
    }, fillStyle);
    expect(result.initial.heights).toEqual([28, 42]);
    expect(result.initial.baseline.left).toBe('200px');
    expect(result.initial.target.left).toBe('250px');
    expect(result.initial.generic.left).toBe('200px');
    expect(result.initial.baseline.transition).toBe('0s');
    expect(result.initial.target.transition).toBe('0s');
    expect(result.initial.needle).toBe('0.6s');
    expect(result.initial.needleAppearance.width).toBe('6px');
    expect(result.initial.needleAppearance.backgroundImage).toBe('none');
    expect(result.initial.needleAppearance.filter).toContain('drop-shadow');
    expect(result.initial.needleAppearance.left).not.toBe(result.movedNeedle);
    expect(result.initial.trackSize).toEqual(result.updatedTrackSize);
    expect(result.initial.paint).toContain('linear-gradient');
    expect(result.unavailable).toBe('none');
    expect(result.recovered).toBe('block');
    expect(result.clip).toContain('50% 0px 25%');
    expect(result.duration).toBe('300ms');
    expect(result.stable).toBe(true);
    expect(result.needleStable).toBe(true);
    expect(result.isolated).toBe(true);
    expect(result.cards).toBe(0);
    expect(result.labels).toBe(0);
  });
}

for (const markerType of ['target', 'generic']) {
  test(`card-owned ${markerType} hover survives an unresolved marker in another row`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    const result = await page.evaluate(async markerType => {
      const rowConfig = suffix => ({
        entity: `sensor.${suffix}`,
        ...(markerType === 'target'
          ? { target: { at: { entity: `sensor.marker_${suffix}` }, label: { show: true } } }
          : { markers: [{ at: { entity: `sensor.marker_${suffix}` }, label: { show: true } }] }),
      });
      const states = {
        'sensor.a': window.__sbcpCreateState(42),
        'sensor.b': window.__sbcpCreateState(65),
        'sensor.marker_a': window.__sbcpCreateState(50),
        'sensor.marker_b': window.__sbcpCreateState('unknown'),
      };
      await window.__sbcpRenderCard({ width: 640, config: { entities: [rowConfig('a'), rowConfig('b')] }, states });
      const card = document.querySelector('sensor-bar-card-plus');
      const row = card.shadowRoot.querySelector('.row[data-entity="sensor.a"]');
      const marker = row.querySelector(`.${markerType}-marker`);
      const label = row.querySelector(`.${markerType}-value-label`);
      card._setMarkerHover(marker);
      const initial = label.dataset.markerHovered;
      card.hass = { ...card.hass, states: { ...states, 'sensor.b': window.__sbcpCreateState(66) } };
      const preserved = label.dataset.markerHovered;
      card.hass = { ...card.hass, states: { ...states, 'sensor.marker_a': window.__sbcpCreateState('unknown') } };
      return { initial, preserved, cleared: label.dataset.markerHovered === undefined };
    }, markerType);
    expect(result).toEqual({ initial: 'true', preserved: 'true', cleared: true });
  });
}
