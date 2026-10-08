const { test, expect } = require('@playwright/test');
const path = require('path');
const textOnly = text => ({ show: true, text, show_value: false, show_unit: false });
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const feature = page => page.locator('sensor-bar-card-plus-feature');
const markerConfig = color => ({
  scale: { min: 0, max: 100 }, bar: { animated: false, color: '#abcdef' },
  target: { at: 20, ...(color === undefined ? {} : { color }), label: { show: true, text: 'Target', precision: 1 } },
  peak: { enabled: true, ...(color === undefined ? {} : { color }), label: textOnly('High') },
  floor: { enabled: true, ...(color === undefined ? {} : { color }), label: { show: true } },
  markers: [{ at: 80, lane: 'above', ...(color === undefined ? {} : { color }), label: { show: true, show_unit: false } }],
});
async function mount(page, source, height, position, config, extraStates = {}) {
  if (source === 'dist') await page.route('**/src/sensor-bar-card-plus.js', route => route.fulfill({ path: path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js'), contentType: 'text/javascript' }));
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ config, height, position, extraStates }) => {
    const states = { 'sensor.power': { state: '50', attributes: { unit_of_measurement: 'W' } }, ...extraStates };
    const card = document.createElement('sensor-bar-card-plus');
    card.style.setProperty('--some-theme-color', '#aa55ff');
    card.setConfig({ ...config, entities: ['sensor.power'], layout: { label: { position: 'off' } } });
    card.hass = { states }; document.querySelector('#mount').append(card);
    await window.__sbcpRenderFeature({ config, height, position, width: 640, context: { entity_id: 'sensor.power' }, states });
    document.querySelector('.feature-host').style.setProperty('--some-theme-color', '#aa55ff');
  }, { config, height, position, extraStates });
  await frames(page);
}
async function colors(page) {
  return page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus'), element = document.querySelector('sensor-bar-card-plus-feature');
    const root = element.shadowRoot, standalone = card.shadowRoot;
    return element._row.markers.filter(marker => marker.labelVisible).map(marker => {
      const glyphSelector = marker.type === 'generic' ? `.generic-marker[data-marker-id="${marker.id}"]` : `.${marker.type}-marker`;
      const labelSelector = marker.type === 'generic' ? `.generic-value-label[data-marker-id="${marker.id}"]` : `.${marker.type}-value-label`;
      const node = root.querySelector(`.compact-marker-label[data-marker-id="${marker.id}"]`);
      return { id: marker.id, color: getComputedStyle(node).color, glyph: root.querySelector(glyphSelector).style.getPropertyValue('--marker-color'),
        glyphPaint: getComputedStyle(root.querySelector(`${glyphSelector} svg`)).color,
        variable: node.style.getPropertyValue('--marker-color'), canonical: getComputedStyle(standalone.querySelector(labelSelector)).color,
        expected: card._getEffectiveMarkerColor(marker), hidden: node.hidden, text: node.textContent };
    });
  });
}
for (const source of ['src', 'dist']) for (const [height, position] of [[42, 'bottom'], [36, 'inline']]) {
  for (const color of [undefined, 'red', '#ff8800', 'rgb(10, 120, 200)', 'var(--some-theme-color)']) {
    test(`Label color ${position} ${source}: all marker types match standalone and glyphs (${color ?? 'defaults'})`, async ({ page }) => {
      await mount(page, source, height, position, markerConfig(color));
      const results = await colors(page);
      expect(results.map(item => item.id)).toEqual(['target', 'floor', 'peak', 'generic-0']);
      for (const item of results) {
        expect(item.color).toBe(item.canonical);
        expect(item.variable).toBe(item.expected);
        expect(item.glyph).toBe(item.expected);
        expect(item.glyphPaint).toBe(item.color);
        expect(item.hidden).toBe(false);
      }
      expect(results.map(item => item.text)).toEqual(['Target 20.0 W', '50 W', 'High', '80']);
    });
  }
  test(`Label color ${position} ${source}: independent references, label-only and dynamic content`, async ({ page }) => {
    await mount(page, source, height, position, { bar: { animated: false }, markers: [
      { at: 10, lane: 'above', shape: 'diamond', direction: 'outward', color: 'red', label: textOnly('Low') },
      { at: 50, lane: 'above', shape: 'circle', color: '#00aa55', label: { show: true, text: 'Energy', precision: 1 } },
      { at: 90, lane: 'below', shape: 'pin', color: 'rgb(10, 120, 200)', label: textOnly('High') },
      { at: 40, lane: 'below', show_marker: false, color: 'orange', label: { show: true, entity: 'sensor.label' } },
    ] }, { 'sensor.label': { state: 'Charging', attributes: {} } });
    let results = await colors(page);
    expect(new Set(results.map(item => item.color)).size).toBe(4);
    for (const item of results) expect(item.color).toBe(item.canonical);
    const node = feature(page).locator('.compact-marker-label[data-marker-id="generic-3"]');
    await expect(node).toHaveCSS('color', 'rgb(255, 165, 0)');
    const accessible = await feature(page).locator('#surface').getAttribute('aria-label');
    expect(accessible).toContain('label Charging');
    await expect(feature(page).locator('.generic-marker[data-marker-id="generic-3"] svg')).toHaveCSS('display', 'none');
    await feature(page).evaluate(async el => { el.hass = { states: { ...el.hass.states, 'sensor.label': { state: 'Ready', attributes: {} } } }; await el.updateComplete; });
    await frames(page); await expect(node).toHaveText('Ready'); await expect(node).toHaveCSS('color', 'rgb(255, 165, 0)');
    expect(await feature(page).locator('#surface').getAttribute('aria-label')).toContain('label Ready');
    await expect(feature(page).locator('#labels')).toHaveAttribute('aria-hidden', 'true');
    expect(await feature(page).locator('button, input, [tabindex]').count()).toBe(0);
    // Both source and dist compare to the same two runtime baselines.
    await expect(feature(page)).toHaveScreenshot(`marker-label-colors-${position}.png`);
  });
  test(`Label color ${position} ${source}: degradation, theme and config changes preserve association`, async ({ page }) => {
    await mount(page, source, height, position, { bar: { animated: false }, markers: [
      { at: 50, lane: 'above', show_marker: false, color: 'var(--some-theme-color)', label: { show: true, text: 'Energy Target', precision: 2 } },
    ] });
    const node = feature(page).locator('.compact-marker-label');
    await node.evaluate(el => window.__colorNode = el);
    const result = await feature(page).evaluate(async el => {
      const node = el.shadowRoot.querySelector('.compact-marker-label'), canvas = document.createElement('canvas').getContext('2d');
      canvas.font = getComputedStyle(el.shadowRoot.querySelector('#labels')).font;
      const value = el._row.markers.find(marker => marker.id === 'generic-0').label.number + ' W';
      const width = Math.ceil((canvas.measureText(value).width + 4) * 64) / 64;
      const measurements = [];
      for (const size of [width, width - 1, 640]) {
        el.parentElement.style.width = `${size}px`;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        measurements.push({ mode: node.dataset.mode, color: getComputedStyle(node).color,
          rail: el.shadowRoot.querySelector('.bar-track').getBoundingClientRect().height, font: getComputedStyle(node).fontSize });
      }
      return measurements;
    });
    expect(result.map(item => item.mode)).toEqual(['value', 'hidden', 'full']);
    for (const item of result) expect(item).toMatchObject({ color: 'rgb(170, 85, 255)', rail: height - 10, font: '9px' });
    await feature(page).evaluate(el => el.parentElement.style.setProperty('--some-theme-color', 'red'));
    await expect(node).toHaveCSS('color', 'rgb(255, 0, 0)');
    await feature(page).evaluate(async el => { el.setConfig({ ...el._config, markers: [{ ...el._config.markers[0], color: '#ff8800' }] }); await el.updateComplete; });
    await frames(page); await expect(node).toHaveCSS('color', 'rgb(255, 136, 0)');
    expect(await node.evaluate(el => el === window.__colorNode)).toBe(true);
  });
}
