const { test, expect } = require('@playwright/test');

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
        needle: getComputedStyle(hosts[1].root.querySelector('.needle-marker')).transitionDuration,
        generic: read('.generic-marker'),
        paint: getComputedStyle(root.querySelector('.bar-paint-layer')).backgroundImage,
      };
      patchBar(container, makeModel(config, -10, 'unknown'), { revealDuration: 300 });
      const unavailable = read('.baseline-indicator').display;
      patchBar(container, makeModel(config, -10, '0'), { revealDuration: 300 });
      return {
        initial, unavailable,
        recovered: read('.baseline-indicator').display,
        clip: root.querySelector('.bar-fill-reveal').style.clipPath,
        duration: root.querySelector('.bar-fill-reveal').style.getPropertyValue('--sbcp-reveal-duration'),
        stable: nodes.every((node, index) => node === container.querySelectorAll('*')[index]),
        isolated: hosts[1].container.innerHTML === otherHtml,
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
    expect(result.initial.paint).toContain('linear-gradient');
    expect(result.unavailable).toBe('none');
    expect(result.recovered).toBe('block');
    expect(result.clip).toContain('50% 0px 25%');
    expect(result.duration).toBe('300ms');
    expect(result.stable).toBe(true);
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
