const { test, expect } = require('@playwright/test');

function sensor(state, {
  friendly_name,
  icon = 'mdi:flash',
  unit_of_measurement = 'W',
} = {}) {
  return {
    state: String(state),
    attributes: {
      friendly_name,
      icon,
      unit_of_measurement,
    },
  };
}

const baseStates = {
  'sensor.main_positive': sensor(95, { friendly_name: 'Main positive' }),
  'sensor.main_negative': sensor(-95, { friendly_name: 'Main negative', icon: 'mdi:minus-circle-outline' }),
  'sensor.full_width': sensor(120, { friendly_name: 'Full width' }),
  'sensor.target_dynamic': sensor(60, { friendly_name: 'Dynamic target', icon: 'mdi:bullseye-arrow' }),
  'sensor.baseline_dynamic': sensor(25, { friendly_name: 'Dynamic baseline', icon: 'mdi:vector-line' }),
  'sensor.textual': {
    state: 'unavailable',
    attributes: {
      friendly_name: 'Textual state',
      icon: 'mdi:message-alert-outline',
    },
  },
};

const gradientStops = [
  { pos: 0, color: '#2563eb' },
  { pos: 45, color: '#06b6d4' },
  { pos: 75, color: '#f59e0b' },
  { pos: 100, color: '#dc2626' },
];

const severity = [
  { from: 0, to: 25, color: '#ef4444' },
  { from: 25, to: 50, color: '#f59e0b' },
  { from: 50, to: 75, color: '#84cc16' },
  { from: 75, to: 100, color: '#14b8a6' },
];

async function render(page, { width = 720, config, states = baseStates }) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ width, config, states }) => {
    await window.__sbcpRenderCard({ width, config, states });
  }, { width, config, states });
  return page.locator('#mount');
}

test('glyph-only markers preserve row geometry and below labels use only needed clearance', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Marker lanes',
      label_position: 'off',
      min: 0,
      max: 100,
      entities: [
        { entity: 'sensor.no_marker' },
        {
          entity: 'sensor.above_glyph',
          peak: { enabled: true },
        },
        {
          entity: 'sensor.below_glyph',
          target: { at: { fixed: 55 } },
        },
        {
          entity: 'sensor.both_glyphs',
          target: { at: { fixed: 55 } },
          peak: { enabled: true },
        },
        {
          entity: 'sensor.below_labeled',
          target: { at: { fixed: 55 }, label: { show: true } },
        },
        {
          entity: 'sensor.below_multiple_labeled',
          target: { at: { fixed: 55 }, label: { show: true } },
          floor: { enabled: true, label: { show: true } },
          markers: [
            { at: 30, lane: 'below', color: '#336699', label: { show: true } },
            { at: 70, lane: 'below', color: '#996633', label: { show: true } },
          ],
        },
        {
          entity: 'sensor.both_labeled',
          target: { at: { fixed: 55 }, label: { show: true } },
          peak: { enabled: true, label: { show: true } },
        },
        { entity: 'sensor.following' },
      ],
    },
    states: {
      'sensor.no_marker': sensor(42, { friendly_name: 'No marker' }),
      'sensor.above_glyph': sensor(42, { friendly_name: 'Above glyph' }),
      'sensor.below_glyph': sensor(42, { friendly_name: 'Below glyph' }),
      'sensor.both_glyphs': sensor(42, { friendly_name: 'Both glyphs' }),
      'sensor.below_labeled': sensor(42, { friendly_name: 'Below labeled' }),
      'sensor.below_multiple_labeled': sensor(42, { friendly_name: 'Multiple below labels' }),
      'sensor.both_labeled': sensor(42, { friendly_name: 'Both labeled' }),
      'sensor.following': sensor(42, { friendly_name: 'Following' }),
    },
  });

  const result = await page.evaluate(() => {
    const rows = [...document.querySelector('sensor-bar-card-plus').shadowRoot.querySelectorAll('.row[data-entity]')];
    return rows.map((row) => {
      const mainLine = row.querySelector('.main-line');
      const rowRect = row.getBoundingClientRect();
      const mainRect = mainLine.getBoundingClientRect();
      const labels = [...row.querySelectorAll('.target-value-label, .peak-value-label, .floor-value-label, .generic-value-label')];
      return {
        entity: row.dataset.entity,
        above: mainLine.dataset.markerLaneAbove,
        below: mainLine.dataset.markerLaneBelow,
        labelAbove: row.dataset.markerLabelLaneAbove,
        labelBelow: row.dataset.markerLabelLaneBelow,
        marginBottom: getComputedStyle(row).marginBottom,
        rowHeight: rowRect.height,
        mainHeight: mainRect.height,
        mainOffset: mainRect.top - rowRect.top,
        lastLabelBottom: labels.length ? Math.max(...labels.map((label) => label.getBoundingClientRect().bottom)) : null,
        rowTop: rowRect.top,
        rowBottom: rowRect.bottom,
      };
    });
  });

  const baseline = result[0];
  for (const row of result.slice(1, 4)) {
    expect(row.rowHeight).toBe(baseline.rowHeight);
    expect(row.mainHeight).toBe(baseline.mainHeight);
    expect(row.mainOffset).toBe(baseline.mainOffset);
    expect(row.marginBottom).toBe('10px');
    expect(row.labelAbove).toBe('false');
    expect(row.labelBelow).toBe('false');
  }
  expect(result[1].above).toBe('true');
  expect(result[2].below).toBe('true');
  expect(result[3].above).toBe('true');
  expect(result[3].below).toBe('true');

  expect(result[4].labelBelow).toBe('true');
  expect(result[4].marginBottom).toBe('13px');
  expect(result[5].labelBelow).toBe('true');
  expect(result[5].marginBottom).toBe('13px');
  expect(result[6].labelAbove).toBe('true');
  expect(result[6].labelBelow).toBe('true');
  expect(result[6].marginBottom).toBe('13px');
  expect(result[4].mainOffset).toBe(baseline.mainOffset);
  expect(result[5].mainOffset).toBe(baseline.mainOffset);
  expect(result[6].mainOffset).toBe(baseline.mainOffset);
  expect(result[4].lastLabelBottom).toBeLessThanOrEqual(result[5].rowTop + 0.5);
  expect(result[5].lastLabelBottom).toBeLessThanOrEqual(result[6].rowTop + 0.5);
  expect(result[6].lastLabelBottom).toBeLessThanOrEqual(result[7].rowTop + 0.5);
});

test('above marker labels overlay without moving above, Hero, or narrow top-value content', async ({ page }) => {
  for (const scenario of [
    { position: 'above', width: 720, selector: '.above-line' },
    { position: 'hero', width: 720, selector: '.hero-line' },
    { position: 'left', width: 720, selector: '.value-right' },
    { position: 'left', width: 320, selector: '.top-right-value', forceTopValue: true },
  ]) {
    await render(page, {
      width: scenario.width,
      config: {
        type: 'custom:sensor-bar-card-plus',
        title: 'Above marker overlay',
        label_position: scenario.position,
        label_width: 180,
        min: 0,
        max: 100,
        entities: [
          { entity: 'sensor.no_marker' },
          { entity: 'sensor.with_above_label', peak: { enabled: true, label: { show: true } } },
        ],
      },
      states: {
        'sensor.no_marker': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.with_above_label': sensor(42, { friendly_name: 'Production sensor content' }),
      },
    });

    const result = await page.evaluate(({ selector, forceTopValue }) => {
      const card = document.querySelector('sensor-bar-card-plus');
      const rows = [...card.shadowRoot.querySelectorAll('.row[data-entity]')];
      if (forceTopValue) {
        rows.forEach((row) => card._forceMinimumBarShareTopValue(row, 'left'));
        card._applyTopRightValueLayout();
      }
      return rows.map((row) => {
        const content = row.querySelector(selector);
        const mainLine = row.querySelector('.main-line');
        const barTrack = row.querySelector('.bar-track');
        const label = row.querySelector('.peak-value-label');
        const contentRect = content?.getBoundingClientRect();
        const barRect = barTrack.getBoundingClientRect();
        const labelRect = label?.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        return {
          contentTop: contentRect ? contentRect.top - rowRect.top : null,
          contentBottom: contentRect ? contentRect.bottom - rowRect.top : null,
          barTop: barRect.top - rowRect.top,
          mainTop: mainLine.getBoundingClientRect().top - rowRect.top,
          rowHeight: rowRect.height,
          contentZIndex: content ? getComputedStyle(content).zIndex : null,
          labelZIndex: label ? getComputedStyle(label).zIndex : null,
          labelVisibility: label ? getComputedStyle(label).visibility : null,
          labelOverlapsContent: !!labelRect && labelRect.top < contentRect.bottom && labelRect.bottom > contentRect.top,
          topValueActive: row.querySelector('.top-right-value')?.dataset.active ?? null,
        };
      });
    }, { selector: scenario.selector, forceTopValue: scenario.forceTopValue === true });

    expect(result[0].contentTop).not.toBeNull();
    expect(result[1].contentTop).toBe(result[0].contentTop);
    expect(result[1].contentBottom).toBe(result[0].contentBottom);
    expect(result[1].barTop).toBe(result[0].barTop);
    expect(result[1].mainTop).toBe(result[0].mainTop);
    expect(result[1].rowHeight).toBe(result[0].rowHeight);
    expect(result[1].contentZIndex).toBe('10');
    expect(result[1].labelZIndex).toBe('8');
    expect(result[1].labelVisibility).toBe('visible');
    if (!scenario.forceTopValue && scenario.selector !== '.value-right') {
      expect(result[1].labelOverlapsContent).toBe(true);
    }
    if (scenario.forceTopValue) {
      expect(result[0].topValueActive).toBe('true');
      expect(result[1].topValueActive).toBe('true');
    }

    const marker = page.locator('sensor-bar-card-plus .row[data-entity="sensor.with_above_label"] .peak-marker .peak-inset');
    await marker.hover();
    const hoverState = await page.evaluate(({ selector }) => {
      const row = document.querySelector('sensor-bar-card-plus').shadowRoot
        .querySelector('.row[data-entity="sensor.with_above_label"]');
      return {
        hovered: row.querySelector('.peak-value-label').dataset.markerHovered ?? null,
        labelZIndex: getComputedStyle(row.querySelector('.peak-value-label')).zIndex,
        contentZIndex: getComputedStyle(row.querySelector(selector)).zIndex,
        sensorNameZIndex: row.querySelector('.label-left')
          ? getComputedStyle(row.querySelector('.label-left')).zIndex : null,
      };
    }, { selector: scenario.selector });
    expect(hoverState).toEqual({
      hovered: 'true',
      labelZIndex: '9',
      contentZIndex: '10',
      sensorNameZIndex: scenario.position === 'left' ? '10' : null,
    });
    await page.mouse.move(2, 2);
    await expect.poll(() => page.evaluate(() => {
      const row = document.querySelector('sensor-bar-card-plus').shadowRoot
        .querySelector('.row[data-entity="sensor.with_above_label"]');
      return row.querySelector('.peak-value-label').dataset.markerHovered ?? null;
    })).toBeNull();
  }
});

test('marker labels use a compact card surface and move 1px toward their bars without changing row geometry', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      entities: [
        { entity: 'sensor.baseline' },
        { entity: 'sensor.above_label', peak: { enabled: true, label: { show: true } } },
        {
          entity: 'sensor.below_label',
          target: { at: { fixed: 50 }, label: { show: true } },
          floor: { enabled: true, label: { show: true } },
        },
        { entity: 'sensor.after' },
      ],
    },
    states: {
      'sensor.baseline': sensor(42, { friendly_name: 'Baseline' }),
      'sensor.above_label': sensor(42, { friendly_name: 'Above' }),
      'sensor.below_label': sensor(42, { friendly_name: 'Below' }),
      'sensor.after': sensor(42, { friendly_name: 'After' }),
    },
  });

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const root = card.shadowRoot;
    const rows = ['sensor.baseline', 'sensor.above_label', 'sensor.below_label'].map((entity) =>
      root.querySelector(`.row[data-entity="${entity}"]`));
    const geometry = (row) => {
      const main = row.querySelector('.main-line').getBoundingClientRect();
      const track = row.querySelector('.bar-track').getBoundingClientRect();
      return { rowHeight: row.getBoundingClientRect().height, mainHeight: main.height, trackHeight: track.height };
    };
    const aboveLabel = rows[1].querySelector('.peak-value-label');
    const belowLabel = rows[2].querySelector('.target-value-label');
    const floorLabel = rows[2].querySelector('.floor-value-label');
    const trackAbove = rows[1].querySelector('.bar-track').getBoundingClientRect();
    const trackBelow = rows[2].querySelector('.bar-track').getBoundingClientRect();
    const style = getComputedStyle(belowLabel);
    return {
      geometry: rows.map(geometry),
      aboveGap: trackAbove.top - aboveLabel.getBoundingClientRect().bottom,
      belowGap: belowLabel.getBoundingClientRect().top - trackBelow.bottom,
      floorGap: floorLabel.getBoundingClientRect().top - trackBelow.bottom,
      aboveMargin: getComputedStyle(aboveLabel).marginBottom,
      belowMargin: style.marginTop,
      floorMargin: getComputedStyle(floorLabel).marginTop,
      background: style.backgroundColor,
      padding: style.padding,
      radius: style.borderRadius,
      border: style.borderTopWidth,
      shadow: style.boxShadow,
      lineHeight: style.lineHeight,
      rowClearance: getComputedStyle(rows[2]).marginBottom,
      markerLaneSize: getComputedStyle(root.querySelector('.card')).getPropertyValue('--sbcp-marker-label-lane-size').trim(),
    };
  });

  expect(metrics.geometry[1]).toEqual(metrics.geometry[0]);
  expect(metrics.geometry[2]).toEqual(metrics.geometry[0]);
  expect(metrics.aboveGap).toBe(2);
  expect(metrics.belowGap).toBe(2);
  expect(metrics.floorGap).toBe(2);
  expect(metrics.aboveMargin).toBe('2px');
  expect(metrics.belowMargin).toBe('2px');
  expect(metrics.floorMargin).toBe('2px');
  expect(metrics.background).toBe('rgb(255, 255, 255)');
  expect(metrics.padding).toBe('0px 2px');
  expect(metrics.radius).toBe('2px');
  expect(metrics.border).toBe('0px');
  expect(metrics.shadow).toBe('none');
  expect(metrics.lineHeight).toBe('12px');
  expect(metrics.rowClearance).toBe('13px');
  expect(metrics.markerLaneSize).toBe('15px');
});

test('built-in hover promotes only its own overlapping label and restores stacking on leave', async ({ page }) => {
  await render(page, {
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.builtins',
        target: { at: { fixed: 54 }, label: { show: true } },
        floor: { enabled: true, label: { show: true } },
      }],
    },
    states: { 'sensor.builtins': sensor(50, { friendly_name: 'Built-in markers' }) },
  });
  const card = page.locator('sensor-bar-card-plus');
  const targetGlyph = card.locator('.target-marker .marker-shape-svg path[data-shape="diamond"]');
  await targetGlyph.hover();
  const hovered = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return {
      target: row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      floor: row.querySelector('.floor-value-label').dataset.markerHovered ?? null,
      targetZ: getComputedStyle(row.querySelector('.target-value-label')).zIndex,
      floorZ: getComputedStyle(row.querySelector('.floor-value-label')).zIndex,
      targetRect: row.querySelector('.target-value-label').getBoundingClientRect().toJSON(),
      floorRect: row.querySelector('.floor-value-label').getBoundingClientRect().toJSON(),
      trackRect: row.querySelector('.bar-track').getBoundingClientRect().toJSON(),
      rowHeight: row.getBoundingClientRect().height,
    };
  });
  expect(hovered.target).toBe('true');
  expect(hovered.floor).toBeNull();
  expect(hovered.targetZ).toBe('9');
  expect(hovered.floorZ).toBe('8');
  expect(hovered.targetRect.left).toBeLessThan(hovered.floorRect.right);
  expect(hovered.targetRect.right).toBeGreaterThan(hovered.floorRect.left);
  await page.mouse.move(2, 2);
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return [row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      getComputedStyle(row.querySelector('.target-value-label')).zIndex,
      getComputedStyle(row.querySelector('.floor-value-label')).zIndex];
  })).toEqual([null, '8', '8']);

  await card.locator('.floor-marker .floor-inset').hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return [row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      row.querySelector('.floor-value-label').dataset.markerHovered ?? null,
      getComputedStyle(row.querySelector('.floor-value-label')).zIndex];
  })).toEqual([null, 'true', '9']);
  await page.mouse.move(2, 2);
});

test('generic marker hover is per-ID, keeps nodes/geometry stable, and clears on unresolved source updates', async ({ page }) => {
  await render(page, {
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      markers: [
        { at: { fixed: 48 }, lane: 'below', shape: 'circle', label: { show: true } },
        { at: { entity: 'sensor.marker_b' }, lane: 'below', shape: 'diamond', label: { show: true } },
      ],
      entities: [{ entity: 'sensor.generic_row' }],
    },
    states: {
      'sensor.generic_row': sensor(40, { friendly_name: 'Generic row' }),
      'sensor.marker_b': sensor(52, { friendly_name: 'Marker B', unit_of_measurement: 'kW' }),
    },
  });
  const card = page.locator('sensor-bar-card-plus');
  const markerA = card.locator('.generic-marker[data-marker-id="generic-0"] .marker-shape-svg path[data-shape="circle"]');
  const markerB = card.locator('.generic-marker[data-marker-id="generic-1"] .marker-shape-svg path[data-shape="diamond"]');
  const stableBefore = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    const track = row.querySelector('.bar-track');
    const labels = [...row.querySelectorAll('.generic-value-label')];
    window.__markerHoverRefs = {
      markers: [...row.querySelectorAll('.generic-marker')],
      labels,
      rects: [row.getBoundingClientRect().toJSON(), row.querySelector('.main-line').getBoundingClientRect().toJSON(), track.getBoundingClientRect().toJSON(), ...labels.map((label) => label.getBoundingClientRect().toJSON())],
    };
    return { ids: labels.map((label) => label.dataset.markerId), overlap: labels[0].getBoundingClientRect().right > labels[1].getBoundingClientRect().left };
  });
  expect(stableBefore.ids).toEqual(['generic-0', 'generic-1']);
  expect(stableBefore.overlap).toBe(true);

  await markerA.hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return [...row.querySelectorAll('.generic-value-label')].map((label) => [label.dataset.markerHovered ?? null, getComputedStyle(label).zIndex]);
  })).toEqual([['true', '9'], [null, '8']]);

  await markerB.hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return [...row.querySelectorAll('.generic-value-label')].map((label) => [label.dataset.markerHovered ?? null, getComputedStyle(label).zIndex]);
  })).toEqual([[null, '8'], ['true', '9']]);
  expect(await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    const labels = [...row.querySelectorAll('.generic-value-label')];
    return [row.getBoundingClientRect().toJSON(), row.querySelector('.main-line').getBoundingClientRect().toJSON(),
      row.querySelector('.bar-track').getBoundingClientRect().toJSON(), ...labels.map((label) => label.getBoundingClientRect().toJSON())];
  })).toEqual(await page.evaluate(() => window.__markerHoverRefs.rects));

  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.hass = { states: {
      ...card._hass.states,
      'sensor.marker_b': { state: 'unavailable', attributes: { friendly_name: 'Marker B', unit_of_measurement: 'kW' } },
    } };
  });
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    const marker = row.querySelector('.generic-marker[data-marker-id="generic-1"]');
    const label = row.querySelector('.generic-value-label[data-marker-id="generic-1"]');
    return { display: marker.style.display, visibility: getComputedStyle(label).visibility, hover: label.dataset.markerHovered ?? null };
  })).toEqual({ display: 'none', visibility: 'hidden', hover: null });

  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.hass = { states: {
      ...card._hass.states,
      'sensor.marker_b': { state: '52', attributes: { friendly_name: 'Marker B', unit_of_measurement: 'kW' } },
    } };
  });
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return getComputedStyle(row.querySelector('.generic-value-label[data-marker-id="generic-1"]')).visibility;
  })).toBe('visible');

  await page.mouse.move(2, 2);
  const stableAfter = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    const before = window.__markerHoverRefs;
    const markers = [...row.querySelectorAll('.generic-marker')];
    const labels = [...row.querySelectorAll('.generic-value-label')];
    return {
      sameMarkers: markers.every((marker, index) => marker === before.markers[index]),
      sameLabels: labels.every((label, index) => label === before.labels[index]),
      rects: [row.getBoundingClientRect().toJSON(), row.querySelector('.main-line').getBoundingClientRect().toJSON(), row.querySelector('.bar-track').getBoundingClientRect().toJSON(), ...labels.map((label) => label.getBoundingClientRect().toJSON())],
      promoted: labels.some((label) => label.dataset.markerHovered === 'true'),
    };
  });
  expect(stableAfter.sameMarkers).toBe(true);
  expect(stableAfter.sameLabels).toBe(true);
  expect(stableAfter.rects).toEqual(await page.evaluate(() => window.__markerHoverRefs.rects));
  expect(stableAfter.promoted).toBe(false);
});

test('disconnecting and reconnecting the card clears and restores marker hover through lifecycle callbacks', async ({ page }) => {
  await render(page, {
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      markers: [{ at: { fixed: 50 }, lane: 'below', shape: 'circle', label: { show: true } }],
      entities: [{ entity: 'sensor.hover_lifecycle' }],
    },
    states: { 'sensor.hover_lifecycle': sensor(40, { friendly_name: 'Hover lifecycle' }) },
  });
  const marker = page.locator('sensor-bar-card-plus .generic-marker[data-marker-id="generic-0"] .marker-shape-svg path[data-shape="circle"]');
  await marker.hover();
  expect(await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    window.__hoverLifecycleCard = card;
    const label = card.shadowRoot.querySelector('.generic-value-label[data-marker-id="generic-0"]');
    window.__hoverLifecycleLabel = label;
    return { active: !!card._markerHover, promoted: label.dataset.markerHovered ?? null };
  })).toEqual({ active: true, promoted: 'true' });

  await page.evaluate(() => window.__hoverLifecycleCard.remove());
  expect(await page.evaluate(() => ({
    connected: window.__hoverLifecycleCard.isConnected,
    active: !!window.__hoverLifecycleCard._markerHover,
    promoted: window.__hoverLifecycleLabel.dataset.markerHovered ?? null,
  }))).toEqual({ connected: false, active: false, promoted: null });

  await page.mouse.move(2, 2);
  await page.evaluate(async () => {
    document.querySelector('#mount').appendChild(window.__hoverLifecycleCard);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  expect(await page.evaluate(() => {
    const card = window.__hoverLifecycleCard;
    return {
      connected: card.isConnected,
      sameCard: document.querySelector('sensor-bar-card-plus') === card,
      sameLabel: card.shadowRoot.querySelector('.generic-value-label[data-marker-id="generic-0"]') === window.__hoverLifecycleLabel,
      active: !!card._markerHover,
      promoted: window.__hoverLifecycleLabel.dataset.markerHovered ?? null,
    };
  })).toEqual({ connected: true, sameCard: true, sameLabel: true, active: false, promoted: null });

  await marker.hover();
  expect(await page.evaluate(() => ({
    active: !!window.__hoverLifecycleCard._markerHover,
    promoted: window.__hoverLifecycleLabel.dataset.markerHovered ?? null,
  }))).toEqual({ active: true, promoted: 'true' });
});

test('Floor shares the below lane with Target and renders extrema labels', async ({ page }) => {
  const mount = await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Peak and Floor',
      label_position: 'off',
      formatting: { decimal: 1 },
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.floor_marker',
        target: { at: { fixed: 60 }, label: { show: true } },
        peak: { enabled: true, label: { show: true, decimal: 0 } },
        floor: { enabled: true, label: { show: true, decimal: 1 } },
      }],
    },
    states: {
      'sensor.floor_marker': sensor(42, { friendly_name: 'Peak and Floor' }),
    },
  });

  const result = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.floor_marker"]');
    const mainLine = row.querySelector('.main-line');
    return {
      above: mainLine.dataset.markerLaneAbove,
      below: mainLine.dataset.markerLaneBelow,
      peakLane: row.querySelector('.peak-marker')?.dataset.lane,
      floorLane: row.querySelector('.floor-marker')?.dataset.lane,
      targetLane: row.querySelector('.target-marker')?.dataset.lane,
      peakLabel: row.querySelector('.peak-value-label')?.textContent.trim(),
      floorLabel: row.querySelector('.floor-value-label')?.textContent.trim(),
      targetLabel: row.querySelector('.target-value-label')?.textContent.trim(),
      peakShape: row.querySelector('.peak-marker')?.dataset.shape,
      floorShape: row.querySelector('.floor-marker')?.dataset.shape,
    };
  });

  expect(result).toEqual({
    above: 'true',
    below: 'true',
    peakLane: 'above',
    floorLane: 'below',
    targetLane: 'below',
    peakLabel: '42 W',
    floorLabel: '42.0 W',
    targetLabel: '60.0 W',
    peakShape: 'triangle',
    floorShape: 'triangle',
  });
  await expect(mount).toHaveScreenshot('floor-markers.png');
});

test('generic reference markers share both lanes with built-in markers', async ({ page }) => {
  const mount = await render(page, {
    width: 620,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Reference markers',
      label_position: 'off',
      min: 0,
      max: 100,
      formatting: { decimal: 0 },
      target: { at: 25, label: { show: true } },
      peak: { enabled: true, label: { show: true } },
      floor: { enabled: true, label: { show: true } },
      markers: [
        { at: '65%', lane: 'above', shape: 'arrow', color: '#4488CC', label: { show: true } },
        { at: { entity: 'sensor.reference_high' }, lane: 'above', shape: 'pin', color: '#F59E0B', label: { show: true, decimal: 1 } },
        { at: { fixed: -20 }, lane: 'below', shape: 'circle', color: '#DC2626', label: { show: true } },
        { at: { entity: 'sensor.reference_low', fixed: 80 }, lane: 'below', shape: 'chevron', color: '#14B8A6', label: { show: true, unit: false } },
      ],
      entities: [{ entity: 'sensor.reference_row' }],
    },
    states: {
      'sensor.reference_row': sensor(42, { friendly_name: 'Grid power' }),
      'sensor.reference_high': sensor(85, { friendly_name: 'High reference', unit_of_measurement: 'kW' }),
      'sensor.reference_low': sensor(12, { friendly_name: 'Low reference', unit_of_measurement: 'kW' }),
    },
  });

  const result = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.reference_row"]');
    const mainLine = row.querySelector('.main-line');
    return {
      lanes: [mainLine.dataset.markerLaneAbove, mainLine.dataset.markerLaneBelow],
      generic: [...row.querySelectorAll('.generic-marker')].map((marker) => ({
        id: marker.dataset.markerId,
        shape: marker.dataset.shape,
        lane: marker.dataset.lane,
        left: marker.style.left,
      })),
      labels: [...row.querySelectorAll('.generic-value-label')].map((label) => label.textContent.trim()),
      builtins: ['.target-marker', '.peak-marker', '.floor-marker'].map((selector) => Boolean(row.querySelector(selector))),
    };
  });

  expect(result.lanes).toEqual(['true', 'true']);
  expect(result.generic).toEqual([
    { id: 'generic-0', shape: 'arrow', lane: 'above', left: '65%' },
    { id: 'generic-1', shape: 'pin', lane: 'above', left: '85%' },
    { id: 'generic-2', shape: 'circle', lane: 'below', left: '0%' },
    { id: 'generic-3', shape: 'chevron', lane: 'below', left: '12%' },
  ]);
  expect(result.labels).toEqual(['65 W', '85.0 W', '-20 W', '12']);
  expect(result.builtins).toEqual([true, true, true]);
  await expect(mount).toHaveScreenshot('generic-reference-markers.png');
});

test('generic marker DOM identity survives unresolved and resolved source updates', async ({ page }) => {
  await render(page, {
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Dynamic reference lifecycle',
      label_position: 'off',
      min: 0,
      max: 100,
      formatting: { decimal: 0 },
      markers: [{ at: { entity: 'sensor.dynamic_limit' }, lane: 'below', label: { show: true } }],
      entities: [
        { entity: 'sensor.reference_row' },
        { entity: 'sensor.following_row' },
      ],
    },
    states: {
      'sensor.reference_row': sensor(20, { friendly_name: 'Reference row' }),
      'sensor.following_row': sensor(80, { friendly_name: 'Following row' }),
      'sensor.dynamic_limit': sensor('unavailable'),
    },
  });

  const readMarker = () => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.reference_row"]');
    const marker = row.querySelector('.generic-marker[data-marker-id="generic-0"]');
    const label = row.querySelector('.generic-value-label[data-marker-id="generic-0"]');
    const rowRect = row.getBoundingClientRect();
    const nextRow = card.shadowRoot.querySelector('.row[data-entity="sensor.following_row"]');
    return {
      sameNode: window.__genericMarkerNode === marker,
      connected: marker?.isConnected ?? false,
      display: marker?.style.display ?? null,
      position: marker?.style.left ?? null,
      labelVisibility: label?.style.visibility ?? null,
      label: label?.textContent.trim() ?? null,
      belowOccupied: row.querySelector('.main-line')?.dataset.markerLaneBelow ?? null,
      labelLaneBelow: row.dataset.markerLabelLaneBelow ?? null,
      rowHeight: rowRect.height,
      mainOffset: row.querySelector('.main-line').getBoundingClientRect().top - rowRect.top,
      rowMarginBottom: getComputedStyle(row).marginBottom,
      clearanceToNextRow: nextRow.getBoundingClientRect().top - rowRect.bottom,
    };
  });
  const retainMarker = () => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    window.__genericMarkerNode = card.shadowRoot.querySelector('.generic-marker[data-marker-id="generic-0"]');
  });
  const updateLimit = async (state) => {
    await page.evaluate((nextState) => {
      const card = document.querySelector('sensor-bar-card-plus');
      card.hass = {
        states: {
          'sensor.reference_row': window.__sbcpCreateState(20, {
            friendly_name: 'Reference row',
            unit_of_measurement: 'W',
          }),
          'sensor.dynamic_limit': window.__sbcpCreateState(nextState),
        },
      };
    }, state);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };

  await retainMarker();
  expect(await readMarker()).toEqual({
    sameNode: true,
    connected: true,
    display: 'none',
    position: '0%',
    labelVisibility: 'hidden',
    label: '',
    belowOccupied: 'true',
    labelLaneBelow: 'true',
    rowHeight: 42,
    mainOffset: 2,
    rowMarginBottom: '13px',
    clearanceToNextRow: 13,
  });

  await updateLimit(35);
  expect(await readMarker()).toEqual({
    sameNode: true,
    connected: true,
    display: '',
    position: '35%',
    labelVisibility: 'visible',
    label: '35 W',
    belowOccupied: 'true',
    labelLaneBelow: 'true',
    rowHeight: 42,
    mainOffset: 2,
    rowMarginBottom: '13px',
    clearanceToNextRow: 13,
  });

  await updateLimit('unknown');
  expect(await readMarker()).toEqual({
    sameNode: true,
    connected: true,
    display: 'none',
    position: '35%',
    labelVisibility: 'hidden',
    label: '35 W',
    belowOccupied: 'true',
    labelLaneBelow: 'true',
    rowHeight: 42,
    mainOffset: 2,
    rowMarginBottom: '13px',
    clearanceToNextRow: 13,
  });

  await updateLimit(72);
  expect(await readMarker()).toEqual({
    sameNode: true,
    connected: true,
    display: '',
    position: '72%',
    labelVisibility: 'visible',
    label: '72 W',
    belowOccupied: 'true',
    labelLaneBelow: 'true',
    rowHeight: 42,
    mainOffset: 2,
    rowMarginBottom: '13px',
    clearanceToNextRow: 13,
  });
});

test('target marker defaults to diamond and supports explicit triangle overrides', async ({ page }) => {
  const mount = await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Target shapes',
      label_position: 'off',
      min: 0,
      max: 100,
      target: { at: { fixed: 60 }, label: { show: true } },
      entities: [
        { entity: 'sensor.default_target' },
        { entity: 'sensor.triangle_target', target: { shape: 'triangle' } },
      ],
    },
    states: {
      'sensor.default_target': sensor(42, { friendly_name: 'Default diamond' }),
      'sensor.triangle_target': sensor(42, { friendly_name: 'Explicit triangle' }),
    },
  });

  const shapes = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    return [...card.shadowRoot.querySelectorAll('.target-marker')].map((marker) => ({
      entity: marker.closest('.row')?.dataset.entity,
      shape: marker.dataset.shape,
      lane: marker.dataset.lane,
    }));
  });

  expect(shapes).toEqual([
    { entity: 'sensor.default_target', shape: 'diamond', lane: 'below' },
    { entity: 'sensor.triangle_target', shape: 'triangle', lane: 'below' },
  ]);
  await expect(mount).toHaveScreenshot('target-shapes.png');
});

test('shared marker renderer reuses the marker node for all six shapes', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Shared marker renderer',
      label_position: 'off',
      target: 60,
      entities: [{ entity: 'sensor.default_target' }],
    },
    states: {
      'sensor.default_target': sensor(42, { friendly_name: 'Target' }),
    },
  });

  const result = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const marker = card.shadowRoot.querySelector('.target-marker');
    const shapes = ['circle', 'diamond', 'triangle', 'chevron', 'arrow', 'pin'];
    const sameMarker = shapes.map((shape) => {
      card._patchMarker(marker, {
        type: 'target',
        lane: 'below',
        shape,
        visible: true,
        position: 60,
        color: '#123456',
      });
      const svg = marker.querySelector('.marker-shape-svg');
      return {
        shape: marker.dataset.shape,
        path: !!svg?.querySelector(`path[data-shape="${shape}"]`),
        svgDisplay: getComputedStyle(svg).display,
        triangleDisplay: getComputedStyle(marker.querySelector('.target-inset')).display,
      };
    });
    return sameMarker;
  });

  expect(result).toEqual([
    { shape: 'circle', path: true, svgDisplay: 'block', triangleDisplay: 'none' },
    { shape: 'diamond', path: true, svgDisplay: 'block', triangleDisplay: 'none' },
    { shape: 'triangle', path: false, svgDisplay: 'none', triangleDisplay: 'block' },
    { shape: 'chevron', path: true, svgDisplay: 'block', triangleDisplay: 'none' },
    { shape: 'arrow', path: true, svgDisplay: 'block', triangleDisplay: 'none' },
    { shape: 'pin', path: true, svgDisplay: 'block', triangleDisplay: 'none' },
  ]);
});

test('marker shapes preserve inward direction, numeric anchoring, and lane fit', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Marker geometry',
      label_position: 'off',
      target: 60,
      peak: { enabled: true },
      entities: [{ entity: 'sensor.default_target' }],
    },
    states: {
      'sensor.default_target': sensor(42, { friendly_name: 'Target' }),
    },
  });

  const geometry = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const target = card.shadowRoot.querySelector('.target-marker');
    const peak = card.shadowRoot.querySelector('.peak-marker');
    const shapes = ['circle', 'diamond', 'triangle', 'chevron', 'arrow', 'pin'];
    const verticalScale = (transform) => {
      if (transform === 'none') return 1;
      const values = transform.match(/^matrix\(([^)]+)\)$/)?.[1].split(',').map(Number);
      return values?.[3] ?? 1;
    };
    const read = (marker, type, lane, shape) => {
      card._patchMarker(marker, {
        type,
        lane,
        shape,
        visible: true,
        position: 60,
        color: '#123456',
      });
      const svg = marker.querySelector('.marker-shape-svg');
      const inset = marker.querySelector(`.${type}-inset`);
      const svgStyle = getComputedStyle(svg);
      const insetStyle = getComputedStyle(inset);
      const trackRect = marker.closest('.bar-track').getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const transform = svgStyle.transform === 'none'
        ? [1, 0, 0, 1, 0, 0]
        : svgStyle.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
      const pathGroupTransform = getComputedStyle(svg.querySelector('.marker-shape-paths')).transform;
      const pathGroupMatrix = pathGroupTransform === 'none'
        ? [1, 0, 0, 1, 0, 0]
        : pathGroupTransform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
      const chevronPath = shape === 'chevron' ? svg.querySelector('path[data-shape="chevron"]') : null;
      const chevronBox = chevronPath?.getBBox();
      const shapePath = svg.querySelector(`path[data-shape="${shape}"]`);
      const shapePathRect = shapePath?.getBoundingClientRect();
      return {
        shape,
        left: marker.getBoundingClientRect().left,
        leftStyle: marker.style.left,
        scaleX: transform[0],
        scaleY: transform[3],
        pathScaleY: pathGroupMatrix[3],
        transformOrigin: svgStyle.transformOrigin,
        svgDisplay: svgStyle.display,
        svgHeight: svg.getBoundingClientRect().height,
        edgeDelta: lane === 'above' ? svgRect.top - trackRect.top : trackRect.bottom - svgRect.bottom,
        chevronBox: chevronBox ? { x: chevronBox.x, y: chevronBox.y, width: chevronBox.width, height: chevronBox.height } : null,
        shapeWidth: shapePathRect?.width ?? null,
        shapeHeight: shapePathRect?.height ?? null,
        borderTop: insetStyle.borderTopWidth,
        borderBottom: insetStyle.borderBottomWidth,
      };
    };

    return {
      below: shapes.map((shape) => read(target, 'target', 'below', shape)),
      above: shapes.map((shape) => read(peak, 'peak', 'above', shape)),
    };
  });

  const svgShapes = new Set(['circle', 'diamond', 'chevron', 'arrow', 'pin']);
  const reducedShapes = new Set(['diamond', 'chevron', 'arrow', 'pin']);
  const belowAnchor = geometry.below[0].left;
  const aboveAnchor = geometry.above[0].left;

  for (const entry of geometry.below) {
    expect(entry.leftStyle).toBe('60%');
    expect(Math.abs(entry.left - belowAnchor)).toBeLessThan(0.01);
    if (svgShapes.has(entry.shape)) {
      expect(entry.svgDisplay).toBe('block');
      expect(entry.edgeDelta, `${entry.shape}: ${JSON.stringify(entry)}`).toBeCloseTo(0, 2);
      expect(entry.scaleX).toBeCloseTo(entry.shape === 'circle' ? 0.64 : reducedShapes.has(entry.shape) ? 0.75 : 1, 2);
      expect(entry.scaleY).toBeCloseTo(entry.shape === 'circle' ? 0.64 : reducedShapes.has(entry.shape) ? 0.75 : 1, 2);
      expect(entry.pathScaleY).toBeCloseTo(['chevron', 'arrow', 'pin'].includes(entry.shape) ? -1 : 1, 2);
      expect(entry.svgHeight).toBeCloseTo(entry.shape === 'circle' ? 10.24 : reducedShapes.has(entry.shape) ? 12 : 16, 1);
      expect(entry.transformOrigin).toContain('16px');
    }
  }
  for (const entry of geometry.above) {
    expect(entry.leftStyle).toBe('60%');
    expect(Math.abs(entry.left - aboveAnchor)).toBeLessThan(0.01);
    if (svgShapes.has(entry.shape)) {
      expect(entry.svgDisplay).toBe('block');
      expect(entry.edgeDelta, `${entry.shape}: ${JSON.stringify(entry)}`).toBeCloseTo(0, 2);
      expect(entry.scaleX).toBeCloseTo(entry.shape === 'circle' ? 0.64 : reducedShapes.has(entry.shape) ? 0.75 : 1, 2);
      expect(entry.scaleY).toBeCloseTo(entry.shape === 'circle' ? 0.64 : reducedShapes.has(entry.shape) ? 0.75 : 1, 2);
      expect(entry.pathScaleY).toBe(1);
      expect(entry.svgHeight).toBeCloseTo(entry.shape === 'circle' ? 10.24 : reducedShapes.has(entry.shape) ? 12 : 16, 1);
      expect(entry.transformOrigin).toContain('0px');
    }
  }

  expect(geometry.below.find((entry) => entry.shape === 'chevron')?.chevronBox).toEqual({ x: 2, y: 2, width: 12, height: 12 });
  for (const lane of ['below', 'above']) {
    const circle = geometry[lane].find((entry) => entry.shape === 'circle');
    const chevron = geometry[lane].find((entry) => entry.shape === 'chevron');
    expect(circle.shapeWidth).toBeCloseTo(8.96, 1);
    expect(circle.shapeHeight).toBeCloseTo(8.96, 1);
    expect(chevron.shapeWidth).toBeCloseTo(9, 1);
    expect(chevron.shapeHeight).toBeCloseTo(9, 1);
  }

  expect(geometry.below.find((entry) => entry.shape === 'triangle')).toEqual(expect.objectContaining({
    borderTop: '0px',
    borderBottom: '11px',
  }));
  expect(geometry.above.find((entry) => entry.shape === 'triangle')).toEqual(expect.objectContaining({
    borderTop: '11px',
    borderBottom: '0px',
  }));
});

test('marker endpoint clipping remains provided by the bar track', async ({ page }) => {
  await render(page, {
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      target: 0,
      peak: { enabled: true },
      entities: [{ entity: 'sensor.endpoint' }],
    },
    states: { 'sensor.endpoint': sensor(100, { friendly_name: 'Endpoint' }) },
  });

  const result = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.endpoint"]');
    const track = row.querySelector('.bar-track');
    return {
      overflow: getComputedStyle(track).overflow,
      left: row.querySelector('.target-marker')?.style.left,
      right: row.querySelector('.peak-marker')?.style.left,
    };
  });

  expect(result).toEqual({ overflow: 'hidden', left: '0%', right: '100%' });
});

const scenarios = [
  {
    name: 'normal-no-baseline',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Normal no baseline',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: 0,
      max: 120,
      entities: [{ entity: 'sensor.main_positive', name: 'No baseline' }],
    },
  },
  {
    name: 'full-width-fill',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Full width fill',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: 0,
      max: 120,
      entities: [{ entity: 'sensor.full_width', name: 'Full width value' }],
    },
  },
  {
    name: 'baseline-below-value',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Baseline below value',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      entities: [{ entity: 'sensor.main_positive', name: 'Above baseline' }],
    },
  },
  {
    name: 'baseline-above-value',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Baseline above value',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      entities: [{ entity: 'sensor.main_negative', name: 'Below baseline' }],
    },
  },
  {
    name: 'off-center-baseline',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Off-center baseline',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -140,
      max: 140,
      baseline: { at: 70 },
      entities: [
        { entity: 'sensor.main_negative', name: 'Below 75% baseline' },
        { entity: 'sensor.main_positive', name: 'Above 75% baseline' },
      ],
    },
  },
  {
    name: 'dynamic-baseline-fallback',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Dynamic baseline fallback',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      entities: [
        {
          entity: 'sensor.main_positive',
          name: 'Fallback baseline',
          baseline: {
            at: {
              entity: 'sensor.missing_baseline',
              value: 15,
            },
          },
        },
        {
          entity: 'sensor.main_positive',
          name: 'Dynamic baseline',
          baseline: 'sensor.baseline_dynamic',
        },
      ],
    },
  },
  {
    name: 'above-baseline-color',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Above baseline color',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: {
        at: 0,
        above: '#34d399',
      },
      entities: [
        { entity: 'sensor.main_negative', name: 'Inherited below' },
        { entity: 'sensor.main_positive', name: 'Override above' },
      ],
    },
  },
  {
    name: 'below-baseline-color',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Below baseline color',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: {
        at: 0,
        below: '#ef4444',
      },
      entities: [
        { entity: 'sensor.main_negative', name: 'Override below' },
        { entity: 'sensor.main_positive', name: 'Inherited above' },
      ],
    },
  },
  {
    name: 'both-baseline-colors',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Both baseline colors',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: {
        at: 0,
        above: { color: '#34d399' },
        below: { color: '#ef4444' },
      },
      entities: [
        { entity: 'sensor.main_negative', name: 'Below override' },
        { entity: 'sensor.main_positive', name: 'Above override' },
      ],
    },
  },
  {
    name: 'severity-left-edge',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Severity left edge',
      color_mode: 'severity',
      severity,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 120 },
      entities: [{ entity: 'sensor.main_negative', name: 'Touches left edge' }],
    },
  },
  {
    name: 'gradient-right-edge',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Gradient right edge',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: -120 },
      entities: [{ entity: 'sensor.main_positive', name: 'Touches right edge' }],
    },
  },
  {
    name: 'override-left-edge',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Override left edge',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: {
        at: 120,
        below: '#ef4444',
      },
      entities: [{ entity: 'sensor.main_negative', name: 'Override touches left' }],
    },
  },
  {
    name: 'override-right-edge',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Override right edge',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: {
        at: -120,
        above: '#34d399',
      },
      entities: [{ entity: 'sensor.main_positive', name: 'Override touches right' }],
    },
  },
  {
    name: 'baseline-target',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Baseline target',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      target: 60,
      target_color: '#111827',
      show_target_label: true,
      above_target_color: '#dc2626',
      entities: [{ entity: 'sensor.main_positive', name: 'Target above baseline' }],
    },
  },
  {
    name: 'normal-above-target',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Normal above target',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: 0,
      max: 120,
      target: 60,
      target_color: '#111827',
      show_target_label: true,
      above_target_color: '#dc2626',
      entities: [{ entity: 'sensor.main_positive', name: 'No baseline target overlay' }],
    },
  },
  {
    name: 'baseline-peak',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Baseline peak',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      show_peak: true,
      peak_color: '#7c3aed',
      entities: [{ entity: 'sensor.main_positive', name: 'Peak above baseline' }],
    },
  },
  {
    name: 'severity',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Severity',
      color_mode: 'severity',
      severity,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      entities: [
        { entity: 'sensor.main_negative', name: 'Severity below' },
        { entity: 'sensor.main_positive', name: 'Severity above' },
      ],
    },
  },
  {
    name: 'severity-gradient',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Severity gradient',
      color_mode: 'severity_gradient',
      severity,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [
        { entity: 'sensor.main_negative', name: 'Severity gradient below' },
        { entity: 'sensor.main_positive', name: 'Severity gradient above' },
      ],
    },
  },
  {
    name: 'gradient',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Gradient',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [
        { entity: 'sensor.main_negative', name: 'Gradient below' },
        { entity: 'sensor.main_positive', name: 'Gradient above' },
      ],
    },
  },
  {
    name: 'single',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Single',
      color_mode: 'single',
      color: '#2563eb',
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [
        { entity: 'sensor.main_negative', name: 'Single below' },
        { entity: 'sensor.main_positive', name: 'Single above' },
      ],
    },
  },
  {
    name: 'left-labels',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Left labels',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [
        { entity: 'sensor.main_negative', name: 'Left below' },
        { entity: 'sensor.main_positive', name: 'Left above' },
      ],
    },
  },
  {
    name: 'above-labels',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Above labels',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'above',
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [{ entity: 'sensor.main_positive', name: 'Above layout' }],
    },
  },
  {
    name: 'inside-labels',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Inside labels',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'inside',
      height: 52,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [{ entity: 'sensor.main_positive', name: 'Inside layout' }],
    },
  },
  {
    name: 'hero-labels',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Hero labels',
      bar: {
        fill_style: 'gradient',
        gradient_stops: gradientStops,
      },
      layout: {
        label: {
          position: 'hero',
        },
      },
      animated: false,
      scale: {
        min: { fixed: -120 },
        max: { fixed: 120 },
      },
      baseline: { at: { fixed: 0 } },
      entities: [
        { entity: 'sensor.main_positive', name: 'Solar production', icon: 'mdi:solar-power' },
        { entity: 'sensor.main_negative', name: 'Grid export', icon: 'mdi:transmission-tower-export', bar: { fill_style: 'band_gradient' } },
      ],
    },
  },
  {
    name: 'hero-labels-narrow',
    width: 320,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Hero labels narrow',
      bar: {
        fill_style: 'gradient',
        gradient_stops: gradientStops,
      },
      layout: {
        height: 38,
        label: {
          position: 'hero',
        },
      },
      animated: false,
      scale: {
        min: { fixed: -120 },
        max: { fixed: 120 },
      },
      baseline: { at: { fixed: 0 } },
      entities: [
        { entity: 'sensor.main_positive', name: 'Extremely long solar production label', icon: 'mdi:solar-power' },
        { entity: 'sensor.main_negative', name: 'Very long grid export corridor label', icon: 'mdi:transmission-tower-export' },
      ],
    },
  },
  {
    name: 'hero-labels-small-height',
    width: 320,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Hero labels small height',
      bar: {
        fill_style: 'gradient',
        gradient_stops: gradientStops,
      },
      layout: {
        height: 24,
        label: {
          position: 'hero',
        },
      },
      animated: false,
      scale: {
        min: { fixed: -120 },
        max: { fixed: 120 },
      },
      entities: [
        { entity: 'sensor.main_positive', name: 'Compact solar production label', icon: 'mdi:solar-power' },
        { entity: 'sensor.main_negative', name: 'Compact grid export label', icon: 'mdi:transmission-tower-export' },
      ],
    },
  },
  {
    name: 'compact-narrow',
    width: 320,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Compact narrow',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 90,
      animated: false,
      min: -120,
      max: 120,
      baseline: 0,
      entities: [{ entity: 'sensor.main_positive', name: 'Compact left label baseline row' }],
    },
  },
  {
    name: 'very-small-interval',
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Very small interval',
      color_mode: 'severity_gradient',
      severity,
      label_position: 'left',
      label_width: 170,
      animated: false,
      min: -100,
      max: 100,
      baseline: { at: 0 },
      entities: [{ entity: 'sensor.tiny_positive', name: 'Tiny above baseline' }],
    },
    states: {
      ...baseStates,
      'sensor.tiny_positive': sensor(1, { friendly_name: 'Tiny positive' }),
    },
  },
];

for (const scenario of scenarios) {
  test(`visual regression: ${scenario.name}`, async ({ page }) => {
    const mount = await render(page, scenario);
    await expect(mount).toHaveScreenshot(`${scenario.name}.png`);
  });
}

test('visual regression: baseline-severity-mid-transition', async ({ page }) => {
  const config = {
    type: 'custom:sensor-bar-card-plus',
    title: 'Baseline severity transition',
    color_mode: 'severity',
    severity,
    label_position: 'left',
    label_width: 170,
    animated: true,
    min: -120,
    max: 120,
    baseline: { at: 0 },
    entities: [{ entity: 'sensor.transitioning', name: 'Transitioning severity' }],
  };

  const mount = await render(page, {
    config,
    states: {
      'sensor.transitioning': sensor(-95, { friendly_name: 'Transitioning severity', icon: 'mdi:swap-horizontal' }),
    },
  });

  await page.evaluate(async () => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.hass = {
      states: {
        'sensor.transitioning': window.__sbcpCreateState(95, {
          friendly_name: 'Transitioning severity',
          icon: 'mdi:swap-horizontal',
          unit_of_measurement: 'W',
        }),
      },
    };
    await new Promise((resolve) => setTimeout(resolve, 250));
  });

  await expect(mount).toHaveScreenshot('baseline-severity-mid-transition.png');
});

test('visual regression: normal-above-target-mid-transition-downward', async ({ page }) => {
  const config = {
    type: 'custom:sensor-bar-card-plus',
    title: 'Normal above target transition',
    color_mode: 'gradient',
    gradient_stops: gradientStops,
    label_position: 'left',
    label_width: 170,
    animated: true,
    min: 0,
    max: 120,
    target: 60,
    target_color: '#111827',
    show_target_label: true,
    above_target_color: '#dc2626',
    entities: [{ entity: 'sensor.transitioning', name: 'Transitioning above target' }],
  };

  const mount = await render(page, {
    config,
    states: {
      'sensor.transitioning': sensor(95, { friendly_name: 'Transitioning above target', icon: 'mdi:swap-horizontal' }),
    },
  });

  await page.evaluate(async () => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.hass = {
      states: {
        'sensor.transitioning': window.__sbcpCreateState(30, {
          friendly_name: 'Transitioning above target',
          icon: 'mdi:swap-horizontal',
          unit_of_measurement: 'W',
        }),
      },
    };
    await new Promise((resolve) => setTimeout(resolve, 250));
  });

  await expect(mount).toHaveScreenshot('normal-above-target-mid-transition-downward.png');
});

for (const [name, colorMode] of [
  ['baseline-gradient-mid-transition', 'gradient'],
  ['baseline-severity-gradient-mid-transition', 'severity_gradient'],
]) {
  test(`visual regression: ${name}`, async ({ page }) => {
    const config = {
      type: 'custom:sensor-bar-card-plus',
      title: name,
      color_mode: colorMode,
      gradient_stops: colorMode === 'gradient' ? gradientStops : undefined,
      severity: colorMode === 'severity_gradient' ? severity : undefined,
      label_position: 'left',
      label_width: 170,
      animated: true,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      entities: [{ entity: 'sensor.transitioning', name: 'Transitioning semantic fill' }],
    };

    const mount = await render(page, {
      config,
      states: {
        'sensor.transitioning': sensor(-95, { friendly_name: 'Transitioning semantic fill', icon: 'mdi:swap-horizontal' }),
      },
    });

    await page.evaluate(async () => {
      const card = document.querySelector('sensor-bar-card-plus');
      card.hass = {
        states: {
          'sensor.transitioning': window.__sbcpCreateState(95, {
            friendly_name: 'Transitioning semantic fill',
            icon: 'mdi:swap-horizontal',
            unit_of_measurement: 'W',
          }),
        },
      };
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    await expect(mount).toHaveScreenshot(`${name}.png`);
  });
}

test('ha-card wrapper stays stable across config and hass updates', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');

  const result = await page.evaluate(async ({ states, gradientStops }) => {
    const card = await window.__sbcpRenderCard({
      width: 720,
      states,
      config: {
        type: 'custom:sensor-bar-card-plus',
        title: 'Card mod stability',
        color_mode: 'gradient',
        gradient_stops: gradientStops,
        label_position: 'left',
        label_width: 170,
        animated: true,
        min: -120,
        max: 120,
        baseline: { at: 0 },
        card_mod: {
          style: {
            '.': 'ha-card { background-color: rgba(200,169,110,0.12) !important; }',
          },
        },
        entities: [{ entity: 'sensor.main_positive', name: 'Stable wrapper' }],
      },
    });

    const initialHaCard = card.shadowRoot.querySelector('ha-card');

    card.setConfig({
      type: 'custom:sensor-bar-card-plus',
      title: 'Card mod stability updated',
      color_mode: 'gradient',
      gradient_stops: gradientStops,
      label_position: 'left',
      label_width: 170,
      animated: true,
      min: -120,
      max: 120,
      baseline: { at: 0 },
      card_mod: {
        style: `
          ha-card {
            background-color: rgba(200,169,110,0.12) !important;
          }
        `,
      },
      entities: [{ entity: 'sensor.main_positive', name: 'Stable wrapper' }],
    });

    card.hass = {
      states: {
        ...states,
        'sensor.main_positive': window.__sbcpCreateState(40, {
          friendly_name: 'Main positive',
          icon: 'mdi:flash',
          unit_of_measurement: 'W',
        }),
      },
    };

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return {
      sameHaCard: initialHaCard === card.shadowRoot.querySelector('ha-card'),
      haCardCount: card.shadowRoot.querySelectorAll('ha-card').length,
      preservedCardModString: typeof card._config.card_mod?.style === 'string',
    };
  }, { states: baseStates, gradientStops });

  expect(result.sameHaCard).toBe(true);
  expect(result.haCardCount).toBe(1);
  expect(result.preservedCardModString).toBe(true);
});

test('visual regression: above-label-responsive-stack', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 2200 });
  await page.goto('/tests/visual/fixtures/harness.html');

  await page.evaluate(async () => {
    const mount = document.getElementById('mount');
    mount.style.width = '492px';
    mount.style.display = 'flex';
    mount.style.flexDirection = 'column';
    mount.style.gap = '18px';
    mount.innerHTML = '';

    const states = {
      'sensor.sbcp_hero_shot_solar': window.__sbcpCreateState(7.2, {
        friendly_name: 'Solar Production South Roof',
        icon: 'mdi:solar-power',
        unit_of_measurement: 'kW',
      }),
    };

    const gradientStops = [
      { pos: 0, color: '#0c4a6e' },
      { pos: 34, color: '#0ea5e9' },
      { pos: 68, color: '#22c55e' },
      { pos: 100, color: '#facc15' },
    ];
    const solarIconSvg = `
      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
        <circle cx="18" cy="6" r="3.2"></circle>
        <path d="M3 13h9l2.25 8H5.25L3 13Zm3.2 2 1.15 4h4.2l-1.15-4H6.2Zm7.4 0H21v2h-6.85l-.55-2ZM8 3h7v2H8V3Zm-3.5 4.2 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1ZM2 9h3v2H2V9Z"></path>
      </svg>`;

    const decorateHarnessIcons = () => {
      document.querySelectorAll('sensor-bar-card-plus').forEach((card) => {
        card.shadowRoot?.querySelectorAll('ha-icon').forEach((icon) => {
          if (icon.dataset.sbcpVisualIcon === 'true') return;
          if (icon.getAttribute('icon') !== 'mdi:solar-power') return;
          icon.dataset.sbcpVisualIcon = 'true';
          icon.style.display = 'block';
          icon.style.width = '20px';
          icon.style.height = '20px';
          icon.style.lineHeight = '0';
          icon.style.color = 'currentColor';
          icon.innerHTML = solarIconSvg;
        });
      });
    };

    const makeCardConfig = (name) => ({
      type: 'custom:sensor-bar-card-plus',
      layout: {
        height: 40,
        label: {
          position: 'above',
        },
      },
      formatting: {
        decimal: 1,
      },
      scale: {
        min: { fixed: 0 },
        max: { fixed: 10 },
      },
      bar: {
        needle: true,
        fill_style: 'gradient',
        gradient_stops: gradientStops,
      },
      entities: [
        {
          entity: 'sensor.sbcp_hero_shot_solar',
          name,
          icon: 'mdi:solar-power',
          scale: {
            min: { fixed: 0 },
            max: { fixed: 10 },
          },
        },
      ],
    });

    const addSection = (columns, heading, name) => {
      const section = document.createElement('section');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = '8px';

      const title = document.createElement('div');
      title.textContent = heading;
      title.style.fontSize = '12px';
      title.style.fontWeight = '700';
      title.style.letterSpacing = '0.08em';
      title.style.textTransform = 'uppercase';
      title.style.color = '#94a3b8';
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      grid.style.gap = '12px';

      for (let index = 0; index < columns; index += 1) {
        const card = document.createElement('sensor-bar-card-plus');
        card.setConfig(makeCardConfig(name));
        card.hass = { states };
        grid.appendChild(card);
      }

      section.appendChild(grid);
      mount.appendChild(section);
    };

    addSection(1, '1 card full width', 'Solar Production South Roof');
    addSection(2, '2 cards in a row', 'Solar Production');
    addSection(3, '3 cards in a row', 'Solar Production');
    addSection(4, '4 cards in a row', 'Solar Production');
    addSection(5, '5 cards in a row', 'Solar Production');
    addSection(6, '6 cards in a row', 'Solar Production');

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    decorateHarnessIcons();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  await expect(page.locator('#mount')).toHaveScreenshot('above-label-responsive-stack.png');
});

test('visual regression: inside-label-responsive-stack', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 2200 });
  await page.goto('/tests/visual/fixtures/harness.html');

  await page.evaluate(async () => {
    const mount = document.getElementById('mount');
    mount.style.width = '492px';
    mount.style.display = 'flex';
    mount.style.flexDirection = 'column';
    mount.style.gap = '18px';
    mount.innerHTML = '';

    const states = {
      'sensor.sbcp_hero_shot_solar': window.__sbcpCreateState(7.2, {
        friendly_name: 'Solar Production South Roof',
        icon: 'mdi:solar-power',
        unit_of_measurement: 'kW',
      }),
    };

    const gradientStops = [
      { pos: 0, color: '#0c4a6e' },
      { pos: 34, color: '#0ea5e9' },
      { pos: 68, color: '#22c55e' },
      { pos: 100, color: '#facc15' },
    ];
    const solarIconSvg = `
      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
        <circle cx="18" cy="6" r="3.2"></circle>
        <path d="M3 13h9l2.25 8H5.25L3 13Zm3.2 2 1.15 4h4.2l-1.15-4H6.2Zm7.4 0H21v2h-6.85l-.55-2ZM8 3h7v2H8V3Zm-3.5 4.2 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1ZM2 9h3v2H2V9Z"></path>
      </svg>`;

    const decorateHarnessIcons = () => {
      document.querySelectorAll('sensor-bar-card-plus').forEach((card) => {
        card.shadowRoot?.querySelectorAll('ha-icon').forEach((icon) => {
          if (icon.dataset.sbcpVisualIcon === 'true') return;
          if (icon.getAttribute('icon') !== 'mdi:solar-power') return;
          icon.dataset.sbcpVisualIcon = 'true';
          icon.style.display = 'block';
          icon.style.width = '20px';
          icon.style.height = '20px';
          icon.style.lineHeight = '0';
          icon.style.color = 'currentColor';
          icon.innerHTML = solarIconSvg;
        });
      });
    };

    const makeCardConfig = (name) => ({
      type: 'custom:sensor-bar-card-plus',
      layout: {
        height: 40,
        label: {
          position: 'inside',
        },
      },
      formatting: {
        decimal: 1,
      },
      scale: {
        min: { fixed: 0 },
        max: { fixed: 10 },
      },
      bar: {
        needle: true,
        fill_style: 'gradient',
        gradient_stops: gradientStops,
      },
      entities: [
        {
          entity: 'sensor.sbcp_hero_shot_solar',
          name,
          icon: 'mdi:solar-power',
          scale: {
            min: { fixed: 0 },
            max: { fixed: 10 },
          },
        },
      ],
    });

    const addSection = (columns, heading, name) => {
      const section = document.createElement('section');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = '8px';

      const title = document.createElement('div');
      title.textContent = heading;
      title.style.fontSize = '12px';
      title.style.fontWeight = '700';
      title.style.letterSpacing = '0.08em';
      title.style.textTransform = 'uppercase';
      title.style.color = '#94a3b8';
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      grid.style.gap = '12px';

      for (let index = 0; index < columns; index += 1) {
        const card = document.createElement('sensor-bar-card-plus');
        card.setConfig(makeCardConfig(name));
        card.hass = { states };
        grid.appendChild(card);
      }

      section.appendChild(grid);
      mount.appendChild(section);
    };

    addSection(1, '1 card full width', 'Solar Production South Roof');
    addSection(2, '2 cards in a row', 'Solar Production');
    addSection(3, '3 cards in a row', 'Solar Production');
    addSection(4, '4 cards in a row', 'Solar Production');
    addSection(5, '5 cards in a row', 'Solar Production');
    addSection(6, '6 cards in a row', 'Solar Production');

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    decorateHarnessIcons();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  await expect(page.locator('#mount')).toHaveScreenshot('inside-label-responsive-stack.png');
});

test('off mode keeps narrow long values inside the row before hiding the unit', async ({ page }) => {
  const mount = await render(page, {
    width: 260,
    config: {
      type: 'custom:sensor-bar-card-plus',
      title: 'Narrow off values',
      layout: {
        label: {
          position: 'off',
        },
      },
      formatting: {
        decimal: 2,
        unit: 'kilowatt-hours equivalent',
      },
      scale: {
        min: { fixed: -100 },
        max: { fixed: 2000000 },
      },
      target: {
        at: { fixed: 60 },
        label: { show: true },
      },
      peak: {
        enabled: true,
      },
      entities: [
        { entity: 'sensor.long_value' },
        { entity: 'sensor.zero_value' },
        { entity: 'sensor.negative_value' },
        { entity: 'sensor.unavailable_value' },
      ],
    },
    states: {
      'sensor.long_value': sensor(1234567.89, { friendly_name: 'Long value' }),
      'sensor.zero_value': sensor(0, { friendly_name: 'Zero value' }),
      'sensor.negative_value': sensor(-95, { friendly_name: 'Negative value' }),
      'sensor.unavailable_value': {
        state: 'unavailable',
        attributes: { friendly_name: 'Unavailable value' },
      },
    },
  });

  const result = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const rows = [...card.shadowRoot.querySelectorAll('.row[data-entity]')];
    return rows.map((row) => {
      const mainLine = row.querySelector('.main-line');
      const value = row.querySelector('.value-right');
      const number = row.querySelector('.value-right-number');
      const unit = row.querySelector('.unit');
      const target = row.querySelector('.target-marker');
      const peak = row.querySelector('.peak-marker');
      const mainRect = mainLine.getBoundingClientRect();
      const valueRect = value.getBoundingClientRect();
      return {
        entity: row.dataset.entity,
        valueRight: valueRect.right,
        mainRight: mainRect.right,
        hideUnit: value.dataset.hideUnit,
        numberText: number?.textContent || '',
        unitText: unit?.textContent || '',
        targetVisible: target?.style.display !== 'none',
        peakVisible: !!peak,
      };
    });
  });

  expect(result).toEqual(expect.arrayContaining([
    expect.objectContaining({
      entity: 'sensor.long_value',
      hideUnit: 'true',
      numberText: '1,234,567.89',
      unitText: '',
      targetVisible: true,
      peakVisible: true,
    }),
    expect.objectContaining({ entity: 'sensor.zero_value', numberText: '0.00' }),
    expect.objectContaining({ entity: 'sensor.negative_value', numberText: '-95.00' }),
    expect.objectContaining({ entity: 'sensor.unavailable_value', numberText: 'unavailable' }),
  ]));

  for (const row of result) {
    expect(row.valueRight).toBeLessThanOrEqual(row.mainRight + 0.5);
  }

  await expect(mount).toHaveScreenshot('off-mode-narrow-long-unit.png');
});

test('presentation update path keeps target recovery and peak maximum intact', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  const result = await page.evaluate(async () => {
    const card = await window.__sbcpRenderCard({
      width: 720,
      config: {
        type: 'custom:sensor-bar-card-plus',
        title: 'Presentation updates',
        layout: {
          label: {
            position: 'off',
          },
        },
        formatting: {
          decimal: 1,
        },
        scale: {
          min: { fixed: 0 },
          max: { fixed: 100 },
        },
        target: {
          at: { entity: 'sensor.presentation_target' },
          label: { show: true },
        },
        peak: {
          enabled: true,
        },
        entities: [{ entity: 'sensor.presentation_value' }],
      },
      states: {
        'sensor.presentation_value': window.__sbcpCreateState(20, {
          friendly_name: 'Presentation value',
          unit_of_measurement: 'W',
        }),
        'sensor.presentation_target': window.__sbcpCreateState(60, {
          friendly_name: 'Presentation target',
          unit_of_measurement: 'W',
        }),
      },
    });

    const waitForUpdate = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const readPresentation = () => {
      const row = card.shadowRoot.querySelector('.row[data-entity="sensor.presentation_value"]');
      const value = row.querySelector('.value-right');
      const target = row.querySelector('.target-marker');
      const targetLabel = row.querySelector('.target-value-label');
      const peak = row.querySelector('.peak-marker');
      return {
        value: value.querySelector('.value-right-number')?.textContent || '',
        targetDisplay: target.style.display,
        targetLabelVisibility: targetLabel?.style.visibility || '',
        targetLabelText: targetLabel?.textContent || '',
        peakLeft: peak?.style.left || '',
      };
    };

    const initial = readPresentation();
    card.hass = {
      states: {
        'sensor.presentation_value': window.__sbcpCreateState(80, {
          friendly_name: 'Presentation value',
          unit_of_measurement: 'W',
        }),
        'sensor.presentation_target': window.__sbcpCreateState('unavailable', {
          friendly_name: 'Presentation target',
          unit_of_measurement: 'W',
        }),
      },
    };
    await waitForUpdate();
    const unavailableTarget = readPresentation();

    card.hass = {
      states: {
        'sensor.presentation_value': window.__sbcpCreateState(40, {
          friendly_name: 'Presentation value',
          unit_of_measurement: 'W',
        }),
        'sensor.presentation_target': window.__sbcpCreateState(60, {
          friendly_name: 'Presentation target',
          unit_of_measurement: 'W',
        }),
      },
    };
    await waitForUpdate();
    const recoveredTarget = readPresentation();

    return { initial, unavailableTarget, recoveredTarget };
  });

  expect(result.initial).toEqual({
    value: '20.0',
    targetDisplay: '',
    targetLabelVisibility: 'visible',
    targetLabelText: '60.0 W',
    peakLeft: '20%',
  });
  expect(result.unavailableTarget).toEqual({
    value: '80.0',
    targetDisplay: 'none',
    targetLabelVisibility: 'hidden',
    targetLabelText: '60.0 W',
    peakLeft: '80%',
  });
  expect(result.recoveredTarget).toEqual({
    value: '40.0',
    targetDisplay: '',
    targetLabelVisibility: 'visible',
    targetLabelText: '60.0 W',
    peakLeft: '80%',
  });
});

test('target label precision override stays separate from primary precision', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  const result = await page.evaluate(async () => {
    const card = await window.__sbcpRenderCard({
      width: 320,
      config: {
        type: 'custom:sensor-bar-card-plus',
        layout: { label: { position: 'off' } },
        formatting: { decimal: 2 },
        scale: { min: { fixed: 0 }, max: { fixed: 100 } },
        target: {
          at: { entity: 'sensor.precision_target' },
          label: { show: true, decimal: 1 },
        },
        peak: { enabled: true },
        entities: [{ entity: 'sensor.precision_value' }],
      },
      states: {
        'sensor.precision_value': window.__sbcpCreateState(42, {
          friendly_name: 'Precision value',
          unit_of_measurement: 'W',
        }),
        'sensor.precision_target': window.__sbcpCreateState(55.25, {
          friendly_name: 'Precision target',
          unit_of_measurement: 'W',
        }),
      },
    });

    const waitForUpdate = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const readPresentation = () => {
      const row = card.shadowRoot.querySelector('.row[data-entity="sensor.precision_value"]');
      return {
        value: row.querySelector('.value-right-number')?.textContent || '',
        target: row.querySelector('.target-value-label')?.textContent || '',
        targetDisplay: row.querySelector('.target-marker')?.style.display || '',
        targetLeft: row.querySelector('.target-marker')?.style.left || '',
        peakLeft: row.querySelector('.peak-marker')?.style.left || '',
      };
    };

    const initial = readPresentation();
    card.hass = {
      states: {
        'sensor.precision_value': window.__sbcpCreateState(42, {
          friendly_name: 'Precision value',
          unit_of_measurement: 'W',
        }),
        'sensor.precision_target': window.__sbcpCreateState('unavailable', {
          friendly_name: 'Precision target',
          unit_of_measurement: 'W',
        }),
      },
    };
    await waitForUpdate();
    const unavailable = readPresentation();

    card.hass = {
      states: {
        'sensor.precision_value': window.__sbcpCreateState(42, {
          friendly_name: 'Precision value',
          unit_of_measurement: 'W',
        }),
        'sensor.precision_target': window.__sbcpCreateState(55.25, {
          friendly_name: 'Precision target',
          unit_of_measurement: 'W',
        }),
      },
    };
    await waitForUpdate();
    const recovered = readPresentation();

    return { initial, unavailable, recovered };
  });

  expect(result.initial).toEqual({
    value: '42.00',
    target: '55.3 W',
    targetDisplay: '',
    targetLeft: '55.25%',
    peakLeft: '42%',
  });
  expect(result.unavailable).toEqual({
    value: '42.00',
    target: '55.3 W',
    targetDisplay: 'none',
    targetLeft: '55.25%',
    peakLeft: '42%',
  });
  expect(result.recovered).toEqual({
    value: '42.00',
    target: '55.3 W',
    targetDisplay: '',
    targetLeft: '55.25%',
    peakLeft: '42%',
  });
});
