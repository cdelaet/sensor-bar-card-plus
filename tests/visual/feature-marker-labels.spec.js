const { test, expect } = require('@playwright/test');
const { PNG } = require('playwright-core/lib/utilsBundle');
const state = (value, unit = 'W') => ({ state: String(value), attributes: { unit_of_measurement: unit } });
const entity = 'sensor.power';
const feature = page => page.locator('sensor-bar-card-plus-feature').first();
const label = (page, id) => feature(page).locator(`.compact-marker-label[data-marker-id="${id}"]`);
const textOnly = text => ({ show: true, text, show_value: false, show_unit: false });
const frames = async page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function mount(page, config, options = {}) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(({ config, options }) => window.__sbcpRenderFeature({
    config, context: { entity_id: 'sensor.power' }, states: { 'sensor.power': { state: '50', attributes: { unit_of_measurement: 'W' } } },
    ...options,
  }), { config, options });
}

for (const [height, position] of [[42, 'bottom'], [36, 'inline']]) {
  for (const lanes of [[], ['above'], ['below'], ['above', 'below']]) {
    test(`${position}: exact geometry for ${lanes.join('+') || 'no'} label lanes`, async ({ page }) => {
      await mount(page, { bar: { needle: true, animated: false }, markers: lanes.map((lane, index) => ({ at: 25 + index * 50, lane, label: textOnly(index ? 'Low' : 'High') })) }, { height, position });
      const result = await feature(page).evaluate(element => {
        const root = element.shadowRoot;
        const origin = root.querySelector('#surface').getBoundingClientRect();
        const rail = root.querySelector('.bar-track').getBoundingClientRect();
        return { height: origin.height, rail: [rail.y - origin.y, rail.height], labels: [...root.querySelectorAll('.compact-marker-label')].map(node => {
          const rect = node.getBoundingClientRect();
          const css = getComputedStyle(node);
          return { lane: node.dataset.lane, y: rect.y - origin.y, height: rect.height, font: css.fontSize, line: css.lineHeight };
        }) };
      });
      expect(result.height).toBe(height);
      expect(result.rail).toEqual([lanes.includes('above') ? 10 : 0, height - lanes.length * 10]);
      for (const item of result.labels) expect(item).toEqual({ lane: item.lane, y: item.lane === 'above' ? 0 : height - 9, height: 9, font: '9px', line: '9px' });
    });
  }

  test(`${position}: Target, Peak, Floor and generic labels reuse formatted models`, async ({ page }) => {
    await mount(page, { bar: { needle: true, animated: false },
      target: { at: 20, label: { show: true, text: 'Target', precision: 1 } },
      peak: { enabled: true, label: textOnly('High') }, floor: { enabled: true, label: { show: true } },
      markers: [
        { at: 0, lane: 'above', label: textOnly('gyp') },
        { at: 80, lane: 'above', label: { show: true, text: 'Energy', precision: 1 } },
        { at: 100, lane: 'below', label: textOnly('Low') },
      ],
    }, { height, position, width: 640 });
    const result = await feature(page).evaluate(element => ({
      labels: [...element.shadowRoot.querySelectorAll('.compact-marker-label')].map(node => ({ id: node.dataset.markerId, text: node.textContent, hidden: node.hidden })),
      expected: element._row.markers.filter(marker => marker.labelVisible).map(marker => ({ id: marker.id, text: marker.label.text, hidden: false })),
      accessible: element.shadowRoot.querySelector('#surface').getAttribute('aria-label'),
    }));
    expect(result.labels).toEqual(result.expected);
    expect(result.accessible).toContain('Target at 20 W; label Target 20.0 W');
    expect(result.accessible).toContain('Peak at 50 W; label High');
    expect(result.accessible).toContain('Floor at 50 W; label 50 W');
    expect(result.accessible).toContain('Reference marker at 80 W; label Energy 80.0 W');
  });

  test(`${position}: independent numeric/text label updates, unavailable content and label-only anchors`, async ({ page }) => {
    await mount(page, { bar: { animated: false }, markers: [
      { at: 25, lane: 'above', show_marker: false, label: { show: true, entity: 'sensor.label', precision: 1 } },
      { at: 75, lane: 'below', label: textOnly('Low') },
    ] }, { height, position, states: { [entity]: state(50), 'sensor.label': state(99.9, 'kWh') } });
    await expect(label(page, 'generic-0')).toHaveText('99.9 kWh');
    const result = await feature(page).evaluate(async element => {
      const root = element.shadowRoot;
      const node = root.querySelector('[data-marker-id="generic-0"].compact-marker-label');
      const track = root.querySelector('.bar-track');
      const snapshots = [];
      for (const value of ['Charging', 'unknown', 'unavailable', '42.7']) {
        element.hass = { states: { ...element.hass.states, 'sensor.label': { state: value, attributes: { unit_of_measurement: value === 'Charging' ? '' : 'kWh' } } } };
        await element.updateComplete;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        snapshots.push({ value, text: node.textContent, hidden: node.hidden, rail: track.getBoundingClientRect().height });
      }
      return { snapshots, persistent: node === root.querySelector('[data-marker-id="generic-0"].compact-marker-label') && track === root.querySelector('.bar-track'),
        glyph: getComputedStyle(root.querySelector('.generic-marker[data-marker-id="generic-0"] .marker-shape-svg')).display,
        anchor: root.querySelector('.generic-marker[data-marker-id="generic-0"]').style.left,
        accessible: root.querySelector('#surface').getAttribute('aria-label') };
    });
    expect(result.snapshots).toEqual([
      { value: 'Charging', text: 'Charging', hidden: false, rail: height - 20 },
      { value: 'unknown', text: 'Charging', hidden: true, rail: height - 20 },
      { value: 'unavailable', text: 'Charging', hidden: true, rail: height - 20 },
      { value: '42.7', text: '42.7 kWh', hidden: false, rail: height - 20 },
    ]);
    expect(result.persistent).toBe(true);
    expect(result.glyph).toBe('none');
    expect(result.anchor).toBe('25%');
    expect(result.accessible).toContain('Reference marker at 25 W; label 42.7 kWh');
  });
}

for (const [height, lanes, expectedRail] of [[36, 2, 16], [42, 2, 22], [36, 1, 26], [42, 1, 32], [36, 0, 36], [42, 0, 42]]) {
  test(`${expectedRail}px rail: caps every glyph with both label lanes and preserves direction`, async ({ page }) => {
    const shapes = ['triangle', 'diamond', 'circle', 'chevron', 'arrow', 'pin'];
    const glyphs = [];
    let result;
    for (let batch = 0; batch < shapes.length; batch += 2) {
      await mount(page, {
        bar: { needle: { show: true, color: '#ff00ff' }, animated: false }, target: { at: 50, shape: 'triangle', label: { show: lanes === 2 } },
        peak: { enabled: true, label: { show: lanes > 0 } }, floor: { enabled: true, label: { show: lanes === 2 } },
        markers: shapes.slice(batch, batch + 2).flatMap((shape, index) => ['above', 'below'].map(lane => ({
          at: index * 15 + 10, shape, lane, direction: index % 2 ? 'outward' : 'inward', label: { show: false },
        }))),
      }, { height });
      result = await feature(page).evaluate(element => {
        const root = element.shadowRoot;
        return { rail: root.querySelector('.bar-track').getBoundingClientRect().height,
          separation: root.querySelector('.floor-inset').getBoundingClientRect().top
            - root.querySelector('.peak-inset').getBoundingClientRect().bottom,
          glyphs: [...root.querySelectorAll('.target-marker, .peak-marker, .floor-marker, .generic-marker')].filter(node => getComputedStyle(node).display !== 'none').map(node => {
            const glyph = node.querySelector(node.dataset.shape === 'triangle' ? '[class$="-inset"]' : 'svg');
            const rect = glyph.getBoundingClientRect();
            const outset = node.querySelector('[class$="-outset"]').getBoundingClientRect();
            return { shape: node.dataset.shape, width: rect.width, height: rect.height, outset: outset.width,
              z: Number(getComputedStyle(node).zIndex), needleZ: Number(getComputedStyle(root.querySelector('.needle-layer')).zIndex),
              edge: node.dataset.lane === 'above' ? rect.top - node.getBoundingClientRect().top : node.getBoundingClientRect().bottom - rect.bottom };
          }) };
      });
      expect(result.rail).toBe(expectedRail);
      expect(result.glyphs).toHaveLength(7);
      glyphs.push(...result.glyphs);
    }
    for (const glyph of glyphs) {
      const compact = lanes === 2;
      const size = compact ? 8 : glyph.shape === 'triangle' ? 14 : glyph.shape === 'circle' ? 10.24 : 12;
      expect(glyph.width).toBeCloseTo(size, 3);
      expect(glyph.height).toBeCloseTo(glyph.shape === 'triangle' ? compact ? 11 * 8 / 14 : 11 : size, 3);
      expect(glyph.edge).toBeCloseTo(0);
      if (glyph.shape === 'triangle') expect(glyph.outset).toBeCloseTo(compact ? 8 : 10);
      expect(glyph.z).toBeGreaterThan(glyph.needleZ);
    }
    if (lanes === 2) {
      expect(result.separation).toBeGreaterThan(3);
      const png = PNG.sync.read(await feature(page).locator('.bar-track').screenshot());
      const center = (Math.floor(expectedRail / 2) * png.width + Math.round(png.width / 2)) * 4;
      await feature(page).locator('.needle-marker').evaluate(node => { node.style.visibility = 'hidden'; });
      const withoutNeedle = PNG.sync.read(await feature(page).locator('.bar-track').screenshot());
      await feature(page).locator('.needle-marker').evaluate(node => { node.style.visibility = ''; });
      // Shadows tint the narrow central gap; magenta must remain visibly distinct
      // from both the glyph shadows and the same rail rendered without the Needle.
      expect(png.data[center]).toBeGreaterThan(png.data[center + 1] + 100);
      expect(png.data[center + 2]).toBeGreaterThan(png.data[center + 1] + 100);
      expect(png.data[center + 2]).toBeGreaterThan(withoutNeedle.data[center + 2] + 100);
    }
  });
}

test('measured full → value/unit → hidden degradation survives resize and zero-width recovery', async ({ page }) => {
  await mount(page, { bar: { animated: false }, markers: [
    { at: 50, lane: 'above', label: { show: true, text: 'Energy Target', precision: 2 } },
    { at: 50, lane: 'below', label: textOnly('gyp Target Energy') },
  ] });
  const result = await feature(page).evaluate(async element => {
    const root = element.shadowRoot;
    const node = root.querySelector('.compact-marker-label');
    const labels = root.querySelector('#labels');
    const context = document.createElement('canvas').getContext('2d');
    context.font = getComputedStyle(labels).font;
    const value = element._row.markers.find(marker => marker.id === 'generic-0').label.number + ' W';
    const width = Math.ceil((context.measureText(value).width + 4) * 64) / 64;
    const modes = [];
    for (const size of [width, width - 1, 0, 640]) {
      element.parentElement.style.width = `${size}px`;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      modes.push({ hidden: node.hidden, mode: node.dataset.mode, text: node.textContent, rail: root.querySelector('.bar-track').getBoundingClientRect().height });
    }
    return { modes, value, persistent: node === root.querySelector('.compact-marker-label'), accessible: root.querySelector('#surface').getAttribute('aria-label') };
  });
  expect(result.modes.map(item => item.mode)).toEqual(['value', 'hidden', 'hidden', 'full']);
  expect(result.modes[0].text).toBe(result.value);
  expect(result.modes.every(item => item.rail === 22)).toBe(true);
  expect(result.persistent).toBe(true);
  expect(result.accessible).toContain('label Energy Target 50.00 W');
});

test('close and coincident labels use non-overlapping slots, clamp endpoints and keep glyph anchors', async ({ page }) => {
  await mount(page, { bar: { animated: false }, target: { at: 50, label: { show: true, text: 'Target' } },
    floor: { enabled: true, label: { show: true } }, peak: { enabled: true, label: { show: true } },
    markers: [0, 50].map(at => ({ at, lane: 'below', label: { show: true, text: 'Energy', precision: 2 } })),
  }, { width: 96, height: 36, position: 'inline' });
  const result = await feature(page).evaluate(element => {
    const root = element.shadowRoot;
    const left = root.querySelector('#surface').getBoundingClientRect().left;
    return { visible: [...root.querySelectorAll('.compact-marker-label')].filter(node => !node.hidden).map(node => {
      const rect = node.getBoundingClientRect();
      return { lane: node.dataset.lane, left: rect.left - left, right: rect.right - left };
    }), hidden: root.querySelectorAll('.compact-marker-label[hidden]').length,
      anchors: [...root.querySelectorAll('.generic-marker')].map(node => node.style.left),
      accessible: root.querySelector('#surface').getAttribute('aria-label') };
  });
  expect(result.hidden).toBeGreaterThan(0);
  expect(result.anchors).toEqual(['0%', '50%']);
  for (const lane of ['above', 'below']) {
    const labels = result.visible.filter(item => item.lane === lane).sort((a, b) => a.left - b.left);
    labels.forEach((item, index) => {
      expect(item.left).toBeGreaterThanOrEqual(0);
      expect(item.right).toBeLessThanOrEqual(96);
      if (index) expect(item.left).toBeGreaterThanOrEqual(labels[index - 1].right + 4 - 0.01);
    });
  }
  expect(result.accessible).toContain('Target at 50 W; label Target 50 W');
  expect(result.accessible).toContain('Floor at 50 W; label 50 W');
});

test('labels stay passive, add no tab stops and preserve primary unavailable/recovery', async ({ page }) => {
  await mount(page, { bar: { animated: false }, markers: [{ at: 50, lane: 'above', label: textOnly('gyp') }] }, { height: 36 });
  await feature(page).evaluate(element => {
    window.labelClicks = 0;
    element.parentElement.addEventListener('click', () => window.labelClicks++);
  });
  await label(page, 'generic-0').click({ force: true });
  expect(await page.evaluate(() => window.labelClicks)).toBe(1);
  const result = await feature(page).evaluate(async element => {
    const root = element.shadowRoot;
    const node = root.querySelector('.compact-marker-label');
    const before = node;
    element.hass = { states: { 'sensor.power': { state: 'unavailable', attributes: {} } } };
    await element.updateComplete;
    const hidden = root.querySelector('#labels').hidden;
    element.hass = { states: { 'sensor.power': { state: '50', attributes: { unit_of_measurement: 'W' } } } };
    await element.updateComplete;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { hidden, visible: !root.querySelector('#labels').hidden && !node.hidden, persistent: node === before,
      ariaHidden: root.querySelector('#labels').getAttribute('aria-hidden'), pointer: getComputedStyle(node).pointerEvents,
      controls: root.querySelectorAll('button, input, [tabindex]').length, motion: getComputedStyle(node).transitionDuration };
  });
  expect(result).toEqual({ hidden: true, visible: true, persistent: true, ariaHidden: 'true', pointer: 'none', controls: 0, motion: '0s' });
});

for (const [animated, reducedMotion] of [[true, 'no-preference'], [false, 'no-preference'], [true, 'reduce']]) {
  test(`stable label motion follows animated=${animated}, reduced-motion=${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await mount(page, { bar: { animated }, markers: [{ at: { entity: 'sensor.anchor' }, lane: 'above', label: textOnly('High') }] },
      { states: { [entity]: state(50), 'sensor.anchor': state(20) } });
    await frames(page);
    await expect(label(page, 'generic-0')).toHaveCSS('transition-duration', '0s');
    await feature(page).evaluate(async element => {
      element.hass = { states: { ...element.hass.states, 'sensor.anchor': { state: '75', attributes: {} } } };
      await element.updateComplete;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await expect(label(page, 'generic-0')).toHaveCSS('transition-duration', animated && reducedMotion !== 'reduce' ? '0.6s' : '0s');
    await feature(page).evaluate(element => { element.parentElement.style.width = '80px'; });
    await frames(page);
    await expect(label(page, 'generic-0')).toHaveCSS('transition-duration', '0s');
  });
}

test('observer/font lifecycle, config and entity changes keep only current persistent labels', async ({ page }) => {
  await mount(page, { peak: { enabled: true, label: textOnly('High') }, markers: [{ at: 25, label: textOnly('Low') }] });
  const result = await feature(page).evaluate(async element => {
    const root = element.shadowRoot;
    const generic = root.querySelector('.compact-marker-label[data-marker-id="generic-0"]');
    const host = element.parentElement;
    const observer = element._labelObserver;
    element.remove();
    const stopped = !element._labelObserver && !element._labelFonts && !element._labelFrame;
    host.append(element);
    await element.updateComplete;
    const restarted = !!element._labelObserver && observer !== element._labelObserver;
    element.context = { entity_id: 'sensor.other' };
    element.hass = { states: { 'sensor.other': { state: '75', attributes: { unit_of_measurement: 'W' } } } };
    element.setConfig({ markers: [{ at: 80, lane: 'above', label: { show: true, text: 'Energy', show_value: false, show_unit: false } }] });
    await element.updateComplete;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const replaced = { count: root.querySelectorAll('.compact-marker-label').length, same: generic === root.querySelector('.compact-marker-label'),
      text: generic.textContent, lane: generic.dataset.lane, rail: root.querySelector('.bar-track').getBoundingClientRect().height,
      accessible: root.querySelector('#surface').getAttribute('aria-label') };
    element.setConfig({});
    await element.updateComplete;
    return { stopped, restarted, replaced, cleared: !element._labelObserver && !element._labelFonts && element._labelNodes.size === 0,
      rail: root.querySelector('.bar-track').getBoundingClientRect().height };
  });
  expect(result.stopped).toBe(true);
  expect(result.restarted).toBe(true);
  expect(result.replaced).toMatchObject({ count: 1, same: true, text: 'Energy', lane: 'above', rail: 32 });
  expect(result.replaced.accessible).toContain('sensor.other');
  expect(result.cleared).toBe(true);
  expect(result.rail).toBe(42);
});

for (const [height, position] of [[42, 'bottom'], [36, 'inline']]) {
  for (const fillStyle of ['solid', 'bands', 'soft_bands', 'gradient', 'band_gradient']) {
    test(`${position}: both label lanes coexist with ${fillStyle}, Needle and dynamic Baseline`, async ({ page }) => {
      await mount(page, { scale: { min: -100, max: 100 },
        bar: { needle: true, animated: false, fill_style: fillStyle, color: '#abcdef',
          gradient_stops: [{ pos: 0, color: '#ff0000' }, { pos: 100, color: '#00ff00' }],
          segments: [{ from: -100, to: 0, color: '#ff0000' }, { from: 0, to: 100, color: '#00ff00' }] },
        baseline: { at: { entity: 'sensor.baseline' }, below: { color: '#ff0000' } },
        target: { at: 75, label: { show: true, text: 'Target' } },
        markers: [{ at: -50, lane: 'above', label: textOnly('Energy gyp') }],
      }, { height, position, width: 320, states: { [entity]: state(50), 'sensor.baseline': state('unavailable') } });
      await expect(feature(page).locator('.needle-marker')).toBeVisible();
      await expect(feature(page).locator('.compact-marker-label')).toHaveCount(2);
      const result = await feature(page).evaluate(async element => {
        const root = element.shadowRoot;
        const labels = [...root.querySelectorAll('.compact-marker-label')];
        element.hass = { states: { ...element.hass.states, 'sensor.baseline': { state: '0', attributes: {} } } };
        await element.updateComplete;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return { rail: root.querySelector('.bar-track').getBoundingClientRect().height,
          paint: getComputedStyle(root.querySelector('[data-layer="base"]')).backgroundImage,
          needle: !!root.querySelector('.needle-marker'), baseline: root.querySelector('.baseline-indicator').style.left,
          clip: root.querySelector('.bar-fill-reveal').style.clipPath,
          persistent: labels.every((node, index) => node === root.querySelectorAll('.compact-marker-label')[index]),
          labelsVisible: labels.every(node => !node.hidden) };
      });
      expect(result.rail).toBe(height - 20);
      expect(result.paint).toContain('linear-gradient');
      expect(result.needle).toBe(false);
      expect(result.baseline).toBe('50%');
      expect(result.clip).toContain('25% 0px 50%');
      expect(result.persistent).toBe(true);
      expect(result.labelsVisible).toBe(true);
    });
  }
}

test('font completion remeasures labels and lane geometry never depends on changing characters', async ({ page }) => {
  await mount(page, { markers: [{ at: 50, lane: 'above', label: { show: true, entity: 'sensor.label' } }] },
    { height: 36, states: { [entity]: state(50), 'sensor.label': state('gyp', '') } });
  const result = await feature(page).evaluate(async element => {
    let passes = 0;
    const original = element._layoutLabels.bind(element);
    element._layoutLabels = () => { passes++; original(); };
    document.fonts.dispatchEvent(new Event('loadingdone'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const fontPasses = passes;
    const rails = [];
    for (const value of ['High', 'Low', 'Energy', 'Target', '99.9 W', 'gyp', 'ÁÉÅgjpqy']) {
      element.hass = { states: { ...element.hass.states, 'sensor.label': { state: value, attributes: {} } } };
      await element.updateComplete;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      rails.push(element.shadowRoot.querySelector('.bar-track').getBoundingClientRect().height);
    }
    return { fontPasses, rails };
  });
  expect(result.fontPasses).toBe(1);
  expect(result.rails).toEqual([26, 26, 26, 26, 26, 26, 26]);
});
