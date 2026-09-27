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

test('left responsive history survives unrelated config rebuilds per entity', async ({ page }) => {
  const config = {
    layout: { label: { position: 'left', width: 100 }, height: 38 },
    scale: { min: { fixed: 0 }, max: { fixed: 300 } },
    formatting: { decimal: 1, unit: 'W' },
    bar: { fill_style: 'gradient' },
    entities: [
      { entity: 'sensor.power' },
      { entity: 'sensor.small', layout: { label: { width: 40 } } },
    ],
  };
  const states = {
    'sensor.power': sensor(185, { friendly_name: 'Power' }),
    'sensor.small': sensor(1, { friendly_name: 'Small' }),
  };
  const readRows = () => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    return [...card.shadowRoot.querySelectorAll('.row[data-entity]')].map((row) => {
      const entityId = row.dataset.entity;
      const mainLine = row.querySelector('.main-line');
      const track = row.querySelector('.bar-track');
      const budget = card._estimateLeftModeWidthBudget(row);
      const inlineCandidate = card._predictLeftModeBarShareForState(row, {
        hideLabel: false,
        topValue: false,
        hideIcon: false,
      }, budget);
      return {
        entityId,
        top: row.querySelector('.row-stack').dataset.forceTopValue === 'true',
        mainWidth: mainLine.getBoundingClientRect().width,
        trackWidth: track.getBoundingClientRect().width,
        labelWidth: budget.labelWidth,
        iconWidth: budget.iconWidth,
        valueWidth: budget.valueWidth,
        gap: budget.gap,
        inlineShare: inlineCandidate.share,
        history: card._leftModeResponsiveHistory.get(entityId),
      };
    });
  });

  await render(page, { width: 440, config, states });
  await expect.poll(async () => (await readRows()).map(({ entityId, top }) => [entityId, top]))
    .toEqual([['sensor.power', true], ['sensor.small', false]]);

  await page.evaluate(() => {
    document.querySelector('#mount').style.width = '450px';
  });
  await expect.poll(async () => (await readRows()).map(({ entityId, top }) => [entityId, top]))
    .toEqual([['sensor.power', true], ['sensor.small', false]]);
  const beforeNeedle = await readRows();
  expect(beforeNeedle[0].inlineShare).toBeCloseTo(0.4878, 3);

  const needleOnConfig = { ...config, bar: { ...config.bar, needle: { show: true } } };
  await page.evaluate((nextConfig) => {
    document.querySelector('sensor-bar-card-plus').setConfig(nextConfig);
  }, needleOnConfig);
  await expect.poll(async () => (await readRows()).map(({ entityId, top }) => [entityId, top]))
    .toEqual([['sensor.power', true], ['sensor.small', false]]);
  expect((await readRows()).map(({ mainWidth, trackWidth, labelWidth, iconWidth, valueWidth, gap }) => ({
    mainWidth, trackWidth, labelWidth, iconWidth, valueWidth, gap,
  }))).toEqual(beforeNeedle.map(({ mainWidth, trackWidth, labelWidth, iconWidth, valueWidth, gap }) => ({
    mainWidth, trackWidth, labelWidth, iconWidth, valueWidth, gap,
  })));

  await page.evaluate((nextConfig) => {
    document.querySelector('sensor-bar-card-plus').setConfig(nextConfig);
  }, config);
  await expect.poll(async () => (await readRows()).map(({ entityId, top }) => [entityId, top]))
    .toEqual([['sensor.power', true], ['sensor.small', false]]);

  const noIconConfig = {
    ...config,
    entities: [
      { entity: 'sensor.power', icon: false },
      { entity: 'sensor.small', layout: { label: { width: 40 } } },
    ],
  };
  await page.evaluate((nextConfig) => {
    document.querySelector('sensor-bar-card-plus').setConfig(nextConfig);
  }, noIconConfig);
  await expect.poll(async () => (await readRows()).map(({ entityId, top }) => [entityId, top]))
    .toEqual([['sensor.power', false], ['sensor.small', false]]);
  const afterRelevantChange = await readRows();
  expect(afterRelevantChange[0].iconWidth).toBe(0);
  expect(afterRelevantChange[0].inlineShare).toBeGreaterThan(0.52);

  const onlyPowerConfig = { ...noIconConfig, entities: [noIconConfig.entities[0]] };
  await page.evaluate((nextConfig) => {
    document.querySelector('sensor-bar-card-plus').setConfig(nextConfig);
  }, onlyPowerConfig);
  await expect.poll(() => page.locator('sensor-bar-card-plus').evaluate((card) => [...card._leftModeResponsiveHistory.keys()]))
    .toEqual(['sensor.power']);

  const abovePowerConfig = { ...onlyPowerConfig, layout: { label: { position: 'above' } } };
  await page.evaluate((nextConfig) => {
    document.querySelector('sensor-bar-card-plus').setConfig(nextConfig);
  }, abovePowerConfig);
  await expect.poll(() => page.locator('sensor-bar-card-plus').evaluate((card) => [...card._leftModeResponsiveHistory.keys()]))
    .toEqual([]);

  const freshConfig = { ...config, entities: [{ entity: 'sensor.power' }] };
  await render(page, { width: 450, config: freshConfig, states });
  await expect.poll(async () => (await readRows())[0]?.top).toBe(false);
  expect((await readRows())[0].inlineShare).toBeCloseTo(0.4878, 3);
});

test('marker editor keeps focused inputs mounted and disclosures usable at narrow width', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('sensor-bar-card-plus-editor');
    const editor = document.createElement('sensor-bar-card-plus-editor');
    editor.setConfig({
      target: { at: { fixed: 65 }, shape: 'diamond' },
      peak: { enabled: true, reset: 'hourly' },
      floor: { enabled: true, reset: 'daily' },
      baseline: { at: { fixed: 0 } },
      markers: [{ at: { fixed: 1 }, label: { show: true } }],
    });
    editor.addEventListener('config-changed', (event) => editor.setConfig(event.detail.config));
    document.querySelector('#mount').append(editor);
    document.querySelector('#mount').style.width = '280px';
  });

  const editor = page.locator('sensor-bar-card-plus-editor');
  for (const group of ['marker-target', 'marker-peak', 'marker-floor', 'generic-markers']) {
    await expect(editor.locator(`#card-group-${group}`)).toHaveAttribute('aria-expanded', 'false');
  }
  const baselineToggle = editor.locator('#card-group-baseline');
  await expect(baselineToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(editor.locator('#card-group-baseline-summary')).toHaveText('Auto · 0');
  await baselineToggle.click();
  await expect(baselineToggle).toHaveAttribute('aria-expanded', 'true');
  await editor.locator('#baseline-value').fill('5');
  await expect(editor.locator('#card-group-baseline-summary')).toHaveText('Auto · 5');
  await expect(baselineToggle).toHaveAttribute('aria-expanded', 'true');

  await editor.locator('#card-group-generic-markers').click();
  const markerToggle = editor.locator('.generic-marker-toggle');
  await expect(markerToggle).toHaveAttribute('aria-expanded', 'false');
  await markerToggle.click();
  await expect(markerToggle).toHaveAttribute('aria-expanded', 'true');

  const textInput = editor.locator('input[data-kind="generic-marker-label-text"]');
  await textInput.pressSequentially('Prediction');
  await expect.poll(() => editor.evaluate((element) => element.shadowRoot.activeElement?.dataset.kind)).toBe('generic-marker-label-text');
  await expect(editor.locator('.generic-marker-summary')).toContainText('1');

  const fixedInput = editor.locator('input[data-kind="generic-marker-fixed"]');
  await fixedInput.fill('');
  await fixedInput.pressSequentially('25');
  await expect.poll(() => editor.evaluate((element) => element.shadowRoot.activeElement?.dataset.kind)).toBe('generic-marker-fixed');
  await expect(editor.locator('.generic-marker-summary')).toContainText('25');

  const item = editor.locator('.generic-marker-item');
  const actions = item.locator('.generic-marker-actions');
  const bounds = await item.evaluate((element) => ({
    itemRight: element.getBoundingClientRect().right,
    actionsRight: element.querySelector('.generic-marker-actions').getBoundingClientRect().right,
  }));
  expect(bounds.actionsRight).toBeLessThanOrEqual(bounds.itemRight + 1);
  await expect(actions.locator('button[data-action="move-generic-marker-up"]')).toBeDisabled();
  await expect(actions.locator('button[data-action="move-generic-marker-down"]')).toBeDisabled();
  await expect(actions.locator('button[data-action="remove-generic-marker"]')).toBeEnabled();
});

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
        aboveSpacerCount: row.querySelectorAll('.marker-label-lane-above').length,
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
  for (const row of result) expect(row.aboveSpacerCount).toBe(0);

  expect(result[4].labelBelow).toBe('true');
  expect(result[4].marginBottom).toBe('13px');
  expect(result[5].labelBelow).toBe('true');
  expect(result[5].marginBottom).toBe('23px');
  expect(result[6].labelAbove).toBe('true');
  expect(result[6].labelBelow).toBe('true');
  expect(result[6].marginBottom).toBe('13px');
  expect(result[4].mainOffset).toBe(baseline.mainOffset);
  expect(result[5].mainOffset).toBe(baseline.mainOffset);
  expect(result[6].mainOffset - baseline.mainOffset).toBe(12);
  expect(result[6].rowHeight - baseline.rowHeight).toBe(12);
  expect(result[4].lastLabelBottom).toBeLessThanOrEqual(result[5].rowTop + 0.5);
  expect(result[5].lastLabelBottom).toBeLessThanOrEqual(result[6].rowTop + 0.5);
  expect(result[6].lastLabelBottom).toBeLessThanOrEqual(result[7].rowTop + 0.5);
});

test('adjacent configured label lanes clear only facing rows and preserve compact geometry', async ({ page }) => {
  const entities = [
    { entity: 'sensor.adjacent_a1' },
    { entity: 'sensor.adjacent_a2' },
    { entity: 'sensor.adjacent_below_plain', target: { at: { fixed: 50 }, label: { show: true } } },
    { entity: 'sensor.adjacent_b_plain' },
    { entity: 'sensor.adjacent_c_plain' },
    { entity: 'sensor.adjacent_plain_above', peak: { enabled: true, label: { show: true } } },
    {
      entity: 'sensor.adjacent_many_below',
      target: { at: { fixed: 50 }, label: { show: true } },
      markers: [
        { at: '50%', lane: 'below', label: { show: true } },
        { at: '70%', lane: 'below', label: { show: true } },
      ],
    },
    {
      entity: 'sensor.adjacent_many_above',
      peak: { enabled: true, label: { show: true } },
      markers: [
        { at: '40%', lane: 'above', label: { show: true } },
        { at: '65%', lane: 'above', label: { show: true } },
      ],
    },
    {
      entity: 'sensor.adjacent_glyph_only',
      target: { at: { fixed: 45 } },
      peak: { enabled: true },
    },
    { entity: 'sensor.adjacent_after_glyph', peak: { enabled: true, label: { show: true } } },
    {
      entity: 'sensor.adjacent_dynamic_below',
      markers: [{ at: { entity: 'sensor.adjacent_dynamic_source' }, lane: 'below', label: { show: true } }],
    },
    { entity: 'sensor.adjacent_dynamic_above', peak: { enabled: true, label: { show: true } } },
    { entity: 'sensor.adjacent_last_below', target: { at: { fixed: 35 }, label: { show: true } } },
  ];
  const states = Object.fromEntries(entities.map(({ entity }) => [entity, sensor(42, { friendly_name: entity.split('.').at(-1) })]));
  states['sensor.adjacent_dynamic_source'] = {
    state: 'unavailable',
    attributes: { friendly_name: 'Dynamic reference', unit_of_measurement: 'W' },
  };

  await render(page, {
    width: 720,
    config: { type: 'custom:sensor-bar-card-plus', label_position: 'off', min: 0, max: 100, entities },
    states,
  });

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const rows = [...card.shadowRoot.querySelectorAll('.row[data-entity]')];
    const read = (row) => {
      const rowRect = row.getBoundingClientRect();
      const trackRect = row.querySelector('.bar-track').getBoundingClientRect();
      const above = [...row.querySelectorAll('.peak-value-label, .generic-value-label[data-lane="above"]')]
        .filter((label) => getComputedStyle(label).visibility === 'visible');
      const below = [...row.querySelectorAll('.target-value-label, .floor-value-label, .generic-value-label[data-lane="below"]')]
        .filter((label) => getComputedStyle(label).visibility === 'visible');
      return {
        rowTop: rowRect.top,
        rowBottom: rowRect.bottom,
        rowHeight: rowRect.height,
        rowMarginBottom: getComputedStyle(row).marginBottom,
        main: row.querySelector('.main-line').getBoundingClientRect().toJSON(),
        track: trackRect.toJSON(),
        mainOffset: row.querySelector('.main-line').getBoundingClientRect().top - rowRect.top,
        trackOffset: trackRect.top - rowRect.top,
        above: above.map((label) => label.getBoundingClientRect().toJSON()),
        below: below.map((label) => label.getBoundingClientRect().toJSON()),
        occupancy: [row.dataset.markerLabelLaneAbove, row.dataset.markerLabelLaneBelow],
        responsiveLabelLineHeight: Number.parseFloat(getComputedStyle(card.shadowRoot.querySelector('.card'))
          .getPropertyValue('--sbcp-target-label-font-size')),
      };
    };
    const readPair = (previousIndex, currentIndex) => {
      const previous = read(rows[previousIndex]);
      const current = read(rows[currentIndex]);
      return {
        previous,
        current,
        rowGap: current.rowTop - previous.rowBottom,
        facingLabelGap: previous.below.length && current.above.length
          ? Math.min(...current.above.map((label) => label.top)) - Math.max(...previous.below.map((label) => label.bottom))
          : null,
        belowBarGap: previous.below.length ? Math.min(...previous.below.map((label) => label.top)) - previous.track.bottom : null,
        aboveBarGap: current.above.length ? current.track.top - Math.max(...current.above.map((label) => label.bottom)) : null,
      };
    };
    const firstPair = readPair(0, 1);
    return {
      pairs: {
        noLabels: firstPair,
        belowThenPlain: readPair(2, 3),
        plainThenAbove: readPair(4, 5),
        facingMultiple: readPair(6, 7),
        glyphOnlyThenAbove: readPair(8, 9),
        unresolvedFacing: readPair(10, 11),
      },
      sameRowBelowLabels: read(rows[6]).below,
      lastRow: read(rows[12]),
      laneSize: getComputedStyle(card.shadowRoot.querySelector('.card')).getPropertyValue('--sbcp-marker-label-lane-size').trim(),
    };
  });

  expect(metrics.pairs.noLabels.rowGap).toBe(10);
  expect(metrics.pairs.belowThenPlain.rowGap).toBe(13);
  expect(metrics.pairs.plainThenAbove.rowGap).toBe(10);
  expect(metrics.pairs.facingMultiple.rowGap).toBe(23);
  expect(metrics.pairs.facingMultiple.facingLabelGap).toBe(12);
  expect(metrics.pairs.glyphOnlyThenAbove.rowGap).toBe(10);
  expect(metrics.pairs.unresolvedFacing.rowGap).toBe(23);
  expect(metrics.pairs.unresolvedFacing.previous.occupancy[1]).toBe('true');
  expect(metrics.pairs.unresolvedFacing.previous.below).toHaveLength(0);
  expect(metrics.pairs.belowThenPlain.belowBarGap).toBe(2);
  expect(metrics.pairs.facingMultiple.belowBarGap).toBe(2);
  expect(metrics.pairs.plainThenAbove.aboveBarGap).toBe(1);
  expect(metrics.pairs.facingMultiple.aboveBarGap).toBe(1);
  expect(metrics.sameRowBelowLabels).toHaveLength(3);
  expect(metrics.sameRowBelowLabels[0].left).toBeLessThan(metrics.sameRowBelowLabels[1].right);
  expect(metrics.sameRowBelowLabels[0].right).toBeGreaterThan(metrics.sameRowBelowLabels[1].left);
  expect(metrics.lastRow.rowMarginBottom).toBe('0px');
  expect(metrics.laneSize).toBe('15px');

  const baseline = metrics.pairs.noLabels.previous;
  for (const pair of Object.values(metrics.pairs)) {
    for (const row of [pair.previous, pair.current]) {
      const laneHeight = row.occupancy[0] === 'true' ? row.responsiveLabelLineHeight : 0;
      expect(row.rowHeight).toBe(baseline.rowHeight + laneHeight);
      expect(row.main.width).toBe(baseline.main.width);
      expect(row.main.height).toBe(baseline.main.height);
      expect(row.track.width).toBe(baseline.track.width);
      expect(row.track.height).toBe(baseline.track.height);
      expect(row.mainOffset).toBe(baseline.mainOffset + laneHeight);
      expect(row.trackOffset).toBe(baseline.trackOffset + laneHeight);
    }
  }

  const dynamicPairGeometry = async () => page.evaluate(() => {
    const rows = [...document.querySelector('sensor-bar-card-plus').shadowRoot.querySelectorAll('.row[data-entity]')];
    const previous = rows[10];
    const current = rows[11];
    const belowLabel = previous.querySelector('.generic-value-label').getBoundingClientRect();
    const aboveLabel = current.querySelector('.peak-value-label').getBoundingClientRect();
    return {
      rowGap: current.getBoundingClientRect().top - previous.getBoundingClientRect().bottom,
      facingLabelGap: aboveLabel.top - belowLabel.bottom,
    };
  });
  const card = page.locator('sensor-bar-card-plus');
  for (const state of ['60', 'unavailable']) {
    await page.evaluate((nextState) => {
      const element = document.querySelector('sensor-bar-card-plus');
      element.hass = { states: {
        ...element._hass.states,
        'sensor.adjacent_dynamic_source': {
          state: nextState,
          attributes: { friendly_name: 'Dynamic reference', unit_of_measurement: 'W' },
        },
      } };
    }, state);
    await expect.poll(dynamicPairGeometry).toMatchObject({ rowGap: 23 });
    if (state === '60') {
      await expect.poll(() => card.locator('.row[data-entity="sensor.adjacent_dynamic_below"] .generic-value-label').evaluate((label) => getComputedStyle(label).visibility)).toBe('visible');
      await expect.poll(dynamicPairGeometry).toMatchObject({ rowGap: 23, facingLabelGap: 12 });
    } else {
      await expect.poll(() => card.locator('.row[data-entity="sensor.adjacent_dynamic_below"] .generic-value-label').evaluate((label) => getComputedStyle(label).visibility)).toBe('hidden');
    }
  }

  for (const scenario of [
    { width: 720, position: null },
    { width: 720, position: 'inside' },
    { width: 720, position: 'above' },
    { width: 720, position: 'hero' },
    { width: 220, position: 'left' },
  ]) {
    const config = {
      type: 'custom:sensor-bar-card-plus',
      min: 0,
      max: 100,
      entities: [
        { entity: 'sensor.layout_below', target: { at: { fixed: 45 }, label: { show: true } } },
        { entity: 'sensor.layout_above', peak: { enabled: true, label: { show: true } } },
      ],
    };
    if (scenario.position) config.label_position = scenario.position;
    if (scenario.position === 'left') config.label_width = 130;
    await render(page, {
      width: scenario.width,
      config,
      states: {
        'sensor.layout_below': sensor(42, { friendly_name: 'Layout lower row' }),
        'sensor.layout_above': sensor(58, { friendly_name: 'Layout upper row' }),
      },
    });
    const layoutMetrics = await page.evaluate(() => {
      const rows = [...document.querySelector('sensor-bar-card-plus').shadowRoot.querySelectorAll('.row[data-entity]')];
      const previous = rows[0];
      const current = rows[1];
      const below = previous.querySelector('.target-value-label').getBoundingClientRect();
      const above = current.querySelector('.peak-value-label').getBoundingClientRect();
      const belowTrack = previous.querySelector('.bar-track').getBoundingClientRect();
      const aboveTrack = current.querySelector('.bar-track').getBoundingClientRect();
      return {
        rowGap: current.getBoundingClientRect().top - previous.getBoundingClientRect().bottom,
        facingLabelGap: above.top - below.bottom,
        belowBarGap: below.top - belowTrack.bottom,
        aboveBarGap: aboveTrack.top - above.bottom,
        aboveLineHeight: getComputedStyle(current.querySelector('.peak-value-label')).lineHeight,
        rowHeights: rows.map((row) => row.getBoundingClientRect().height),
        heroHeaderMargins: rows.map((row) => {
          const header = row.querySelector('.hero-header');
          return header ? getComputedStyle(header).marginBottom : null;
        }),
        trackHeights: rows.map((row) => row.querySelector('.bar-track').getBoundingClientRect().height),
        trackWidths: rows.map((row) => row.querySelector('.bar-track').getBoundingClientRect().width),
        topValueActive: current.querySelector('.top-right-value')?.dataset.active ?? null,
      };
    });
    expect(layoutMetrics.rowGap).toBeGreaterThanOrEqual(23);
    expect(layoutMetrics.facingLabelGap).toBeGreaterThanOrEqual(1);
    expect(layoutMetrics.belowBarGap).toBe(2);
    expect(layoutMetrics.aboveBarGap).toBe(1);
    if (scenario.position === 'hero') {
      expect(layoutMetrics.heroHeaderMargins[0]).toBe('0px');
      expect(layoutMetrics.heroHeaderMargins[1]).not.toBe('0px');
      expect(layoutMetrics.rowHeights[1] - layoutMetrics.rowHeights[0])
        .toBeCloseTo(Number.parseFloat(layoutMetrics.heroHeaderMargins[1]), 1);
    } else {
      expect(layoutMetrics.rowHeights[1] - layoutMetrics.rowHeights[0])
        .toBe(Number.parseFloat(layoutMetrics.aboveLineHeight));
    }
    expect(layoutMetrics.trackHeights[0]).toBe(layoutMetrics.trackHeights[1]);
    expect(layoutMetrics.trackWidths[0]).toBe(layoutMetrics.trackWidths[1]);
  }
});

test('above marker labels reserve responsive space while Hero spacing follows label occupancy', async ({ page }) => {
  const observedLabelFontSizes = new Set();
  for (const scenario of [
    { position: null, width: 720, selectors: ['.label-left', '.value-right'] },
    { position: 'left', width: 720, selectors: ['.label-left', '.value-right'] },
    { position: 'off', width: 720, selectors: ['.value-right'] },
    { position: 'inside', width: 720, selectors: ['.bar-inner-label'] },
    { position: 'above', width: 720, selectors: ['.above-line'], contentSelector: '.above-bar-label' },
    { position: 'hero', width: 720, selectors: ['.hero-line'] },
    { position: 'hero', width: 300, selectors: ['.hero-line'] },
    { position: 'hero', width: 240, selectors: ['.hero-line'] },
    { position: 'hero', width: 200, selectors: ['.hero-line'] },
    { position: 'hero', width: 160, selectors: ['.hero-line'] },
    { position: 'left', width: 320, selectors: ['.top-right-value'], forceTopValue: true },
    { position: 'left', width: 220, selectors: ['.top-right-value'], forceTopValue: true },
    { position: 'left', width: 150, selectors: ['.top-right-value'], forceTopValue: true },
    { position: 'inside', width: 320, selectors: ['.bar-inner-label'] },
    { position: 'above', width: 220, selectors: ['.above-line'], contentSelector: '.above-bar-label' },
    { position: 'off', width: 150, selectors: ['.value-right'] },
    { position: 'hero', width: 220, selectors: ['.hero-line'] },
  ]) {
    await render(page, {
      width: scenario.width,
      config: {
        type: 'custom:sensor-bar-card-plus',
        title: 'Above marker label lane',
        label_width: 180,
        min: 0,
        max: 100,
        ...(scenario.position ? { label_position: scenario.position } : {}),
        entities: [
          { entity: 'sensor.no_marker' },
          { entity: 'sensor.unlabeled_above', peak: { enabled: true } },
          {
            entity: 'sensor.with_above_label',
            peak: { enabled: true, label: { show: true } },
            markers: [
              { at: '25%', lane: 'above', label: { show: true, text: 'Low', show_value: false, show_unit: false } },
              { at: { entity: 'sensor.above_dynamic_source' }, lane: 'above', label: { show: true, text: 'High', show_value: false, show_unit: false } },
              { at: '50%', lane: 'below', label: { show: true, text: 'Below', show_value: false, show_unit: false } },
            ],
          },
          {
            entity: 'sensor.empty_above_label',
            peak: { enabled: true, label: { show: true, text: '', show_value: false, show_unit: false } },
          },
          {
            entity: 'sensor.below_only_label',
            target: { at: { fixed: 50 }, label: { show: true } },
          },
        ],
      },
      states: {
        'sensor.no_marker': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.unlabeled_above': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.with_above_label': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.empty_above_label': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.below_only_label': sensor(42, { friendly_name: 'Production sensor content' }),
        'sensor.above_dynamic_source': sensor(75, { friendly_name: 'Dynamic label reference' }),
      },
    });

    const result = await page.evaluate(({ selectors, contentSelector, forceTopValue }) => {
      const card = document.querySelector('sensor-bar-card-plus');
      const rows = [...card.shadowRoot.querySelectorAll('.row[data-entity]')];
      if (forceTopValue) {
        rows.forEach((row) => card._forceMinimumBarShareTopValue(row, 'left'));
        card._applyTopRightValueLayout();
      }
      return rows.map((row) => {
        const contents = selectors.map((selector) => row.querySelector(selector)).filter(Boolean);
        const content = row.querySelector(contentSelector) ?? contents[0];
        const mainLine = row.querySelector('.main-line');
        const barTrack = row.querySelector('.bar-track');
        const label = row.querySelector('.peak-value-label');
        const contentRect = content?.getBoundingClientRect();
        const heroHeaderRect = row.querySelector('.hero-header')?.getBoundingClientRect();
        const barRect = barTrack.getBoundingClientRect();
        const labelRect = label?.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const topValue = row.querySelector('.top-right-value');
        const marker = row.querySelector('.peak-marker');
        const markerRect = marker?.getBoundingClientRect();
        return {
          contentTop: contentRect ? contentRect.top - rowRect.top : null,
          contentBottom: contentRect ? contentRect.bottom - rowRect.top : null,
          heroHeaderBottom: heroHeaderRect ? heroHeaderRect.bottom - rowRect.top : null,
          heroContentTrackGap: heroHeaderRect ? barRect.top - heroHeaderRect.bottom : null,
          barTop: barRect.top - rowRect.top,
          mainTop: mainLine.getBoundingClientRect().top - rowRect.top,
          rowHeight: rowRect.height,
          trackWidth: barRect.width,
          trackHeight: barRect.height,
          markerTrackOffset: markerRect ? {
            left: markerRect.left - barRect.left,
            top: markerRect.top - barRect.top,
          } : null,
          laneCount: row.querySelectorAll('.marker-label-lane-above').length,
          lineHeight: label
            ? getComputedStyle(label).lineHeight
            : `${getComputedStyle(card.shadowRoot.querySelector('.card')).getPropertyValue('--sbcp-target-label-font-size').trim()}`,
          labelTrackGap: labelRect ? barRect.top - labelRect.bottom : null,
          allAboveLabelTrackGaps: [...row.querySelectorAll('.peak-value-label, .generic-value-label[data-lane="above"]')]
            .filter((element) => getComputedStyle(element).visibility === 'visible')
            .map((element) => barRect.top - element.getBoundingClientRect().bottom),
          topValueLabelGap: topValue?.dataset.active === 'true' && labelRect
            ? labelRect.top - topValue.getBoundingClientRect().bottom
            : null,
          contentLabelGap: contentRect && labelRect ? labelRect.top - contentRect.bottom : null,
          mainMarginTop: getComputedStyle(mainLine).marginTop,
          heroHeaderMargin: row.querySelector('.hero-header')
            ? getComputedStyle(row.querySelector('.hero-header')).marginBottom
            : null,
          heroDensity: row.querySelector('.hero-line')?.dataset.heroDensity ?? null,
          heroValueFontSize: row.querySelector('.hero-value')
            ? getComputedStyle(row.querySelector('.hero-value')).fontSize
            : null,
          aboveLabelCount: [...row.querySelectorAll('.peak-value-label, .generic-value-label[data-lane="above"]')]
            .filter((element) => getComputedStyle(element).visibility === 'visible').length,
          belowLabelCount: [...row.querySelectorAll('.target-value-label, .floor-value-label, .generic-value-label[data-lane="below"]')]
            .filter((element) => getComputedStyle(element).visibility === 'visible').length,
          contentZIndexes: contents.map((element) => getComputedStyle(element).zIndex),
          labelZIndex: label ? getComputedStyle(label).zIndex : null,
          labelVisibility: label ? getComputedStyle(label).visibility : null,
          labelOverlapsContent: !!labelRect && labelRect.top < contentRect.bottom && labelRect.bottom > contentRect.top,
          topValueActive: row.querySelector('.top-right-value')?.dataset.active ?? null,
        };
      });
    }, {
      selectors: scenario.selectors,
      contentSelector: scenario.contentSelector ?? null,
      forceTopValue: scenario.forceTopValue === true,
    });

    const [plain, unlabeled, labeled, emptyComposition, belowOnly] = result;
    expect(plain.contentTop).not.toBeNull();
    expect(unlabeled).toMatchObject({
      contentTop: plain.contentTop,
      contentBottom: plain.contentBottom,
      barTop: plain.barTop,
      mainTop: plain.mainTop,
      rowHeight: plain.rowHeight,
      trackWidth: plain.trackWidth,
      trackHeight: plain.trackHeight,
      laneCount: 0,
      mainMarginTop: '0px',
    });
    expect(labeled.markerTrackOffset).toEqual(unlabeled.markerTrackOffset);
    for (const noAboveLabel of [emptyComposition, belowOnly]) {
      expect(noAboveLabel).toMatchObject({
        contentTop: plain.contentTop,
        contentBottom: plain.contentBottom,
        barTop: plain.barTop,
        mainTop: plain.mainTop,
        rowHeight: plain.rowHeight,
        trackWidth: plain.trackWidth,
        trackHeight: plain.trackHeight,
        laneCount: 0,
        mainMarginTop: '0px',
      });
    }
    expect(emptyComposition.aboveLabelCount).toBe(0);
    expect(belowOnly.belowLabelCount).toBe(1);
    const isHero = scenario.position === 'hero';
    if (!isHero) observedLabelFontSizes.add(Number.parseFloat(labeled.lineHeight));
    if (isHero) {
      const retainedHeroMargin = Number.parseFloat(labeled.heroHeaderMargin);
      expect(labeled).toMatchObject({
        contentTop: plain.contentTop,
        heroHeaderBottom: plain.heroHeaderBottom,
        laneCount: 0,
        mainMarginTop: '0px',
      });
      expect(plain.heroHeaderMargin).toBe('0px');
      expect(plain.heroContentTrackGap).toBeCloseTo(2, 1);
      expect(labeled.heroHeaderMargin).not.toBe('0px');
      expect(labeled.heroContentTrackGap).toBeCloseTo(2 + retainedHeroMargin, 1);
      expect(labeled.barTop - plain.barTop).toBeCloseTo(retainedHeroMargin, 1);
      expect(labeled.mainTop - plain.mainTop).toBeCloseTo(retainedHeroMargin, 1);
      expect(labeled.rowHeight - plain.rowHeight).toBeCloseTo(retainedHeroMargin, 1);
      expect(labeled.trackWidth).toBe(plain.trackWidth);
      expect(labeled.trackHeight).toBe(plain.trackHeight);
      expect(labeled.heroDensity).toBe(plain.heroDensity);
      expect(labeled.heroValueFontSize).toBe(plain.heroValueFontSize);
      expect(labeled.labelTrackGap).toBe(1);
      expect(labeled.allAboveLabelTrackGaps.every((gap) => gap === 1)).toBe(true);
    } else {
      const lineHeight = Number.parseFloat(labeled.lineHeight);
      expect(labeled.laneCount).toBe(0);
      expect(labeled.mainMarginTop).toBe(`${lineHeight}px`);
      expect(labeled.rowHeight - plain.rowHeight).toBe(lineHeight);
      expect(labeled.barTop - plain.barTop).toBe(lineHeight);
      expect(labeled.mainTop - plain.mainTop).toBe(lineHeight);
      expect(labeled.labelTrackGap).toBe(1);
      expect(labeled.trackHeight).toBe(plain.trackHeight);
      expect(labeled.labelOverlapsContent).toBe(false);
      if (scenario.position === 'above') expect(labeled.contentLabelGap).toBeGreaterThanOrEqual(2);
      if (scenario.forceTopValue) expect(labeled.topValueLabelGap).toBeCloseTo(2, 0);
    }
    expect(labeled.contentZIndexes.length).toBeGreaterThan(0);
    expect(labeled.contentZIndexes.every((zIndex) => zIndex === '10')).toBe(true);
    expect(labeled.labelZIndex).toBe('8');
    expect(labeled.labelVisibility).toBe('visible');
    expect(labeled.laneCount).toBe(0);
    expect(labeled.aboveLabelCount).toBe(3);
    expect(labeled.belowLabelCount).toBe(1);
    if (scenario.forceTopValue) {
      expect(plain.topValueActive).toBe('true');
      expect(unlabeled.topValueActive).toBe('true');
      expect(labeled.topValueActive).toBe('true');
    }

    if (!scenario.position && scenario.width === 720) {
      const card = page.locator('sensor-bar-card-plus');
      const dynamicRowGeometry = () => page.evaluate(() => {
        const row = document.querySelector('sensor-bar-card-plus').shadowRoot
          .querySelector('.row[data-entity="sensor.with_above_label"]');
        return {
          rowHeight: row.getBoundingClientRect().height,
          trackTop: row.querySelector('.bar-track').getBoundingClientRect().top,
          marginTop: getComputedStyle(row.querySelector('.main-line')).marginTop,
          visibility: getComputedStyle(row.querySelector('.generic-value-label[data-marker-id="generic-1"]')).visibility,
        };
      });
      const beforeDynamicUpdate = await dynamicRowGeometry();
      for (const value of ['unavailable', '55', 'unavailable']) {
        await page.evaluate((nextValue) => {
          const element = document.querySelector('sensor-bar-card-plus');
          element.hass = { states: {
            ...element._hass.states,
            'sensor.above_dynamic_source': {
              state: nextValue,
              attributes: { friendly_name: 'Dynamic label reference', unit_of_measurement: 'W' },
            },
          } };
        }, value);
        const expectedVisibility = value === 'unavailable' ? 'hidden' : 'visible';
        await expect.poll(async () => (await dynamicRowGeometry()).visibility).toBe(expectedVisibility);
        expect(await dynamicRowGeometry()).toMatchObject({
          rowHeight: beforeDynamicUpdate.rowHeight,
          trackTop: beforeDynamicUpdate.trackTop,
          marginTop: beforeDynamicUpdate.marginTop,
        });
      }
    }

    if (isHero) {
      if (scenario.width === 720) {
        const dynamicHeroGeometry = () => page.evaluate(() => {
          const row = document.querySelector('sensor-bar-card-plus').shadowRoot
            .querySelector('.row[data-entity="sensor.with_above_label"]');
          const rowRect = row.getBoundingClientRect();
          const trackRect = row.querySelector('.bar-track').getBoundingClientRect();
          const rect = (element) => {
            const box = element.getBoundingClientRect();
            return [box.left - trackRect.left, box.top - trackRect.top, box.width, box.height];
          };
          return {
            occupancy: row.dataset.markerLabelLaneAbove,
            headerMargin: getComputedStyle(row.querySelector('.hero-header')).marginBottom,
            rowHeight: rowRect.height,
            track: [trackRect.top - rowRect.top, trackRect.width, trackRect.height],
            peakLabel: rect(row.querySelector('.peak-value-label')),
            peakGlyph: rect(row.querySelector('.peak-marker .peak-inset')),
            genericLabel: rect(row.querySelector('.generic-value-label[data-marker-id="generic-0"]')),
          };
        });
        const resolvedGeometry = await dynamicHeroGeometry();
        for (const value of ['unavailable', '75']) {
          await page.evaluate((nextValue) => {
            const element = document.querySelector('sensor-bar-card-plus');
            element.hass = { states: {
              ...element._hass.states,
              'sensor.above_dynamic_source': {
                state: nextValue,
                attributes: { friendly_name: 'Dynamic label reference', unit_of_measurement: 'W' },
              },
            } };
          }, value);
          await expect.poll(dynamicHeroGeometry).toMatchObject({
            occupancy: 'true',
            headerMargin: resolvedGeometry.headerMargin,
            rowHeight: resolvedGeometry.rowHeight,
            track: resolvedGeometry.track,
            peakLabel: resolvedGeometry.peakLabel,
            peakGlyph: resolvedGeometry.peakGlyph,
            genericLabel: resolvedGeometry.genericLabel,
          });
        }
      }
      continue;
    }
    const marker = page.locator('sensor-bar-card-plus .row[data-entity="sensor.with_above_label"] .peak-marker .peak-inset');
    await marker.hover();
    const hoverState = await page.evaluate(({ selectors }) => {
      const row = document.querySelector('sensor-bar-card-plus').shadowRoot
        .querySelector('.row[data-entity="sensor.with_above_label"]');
      const contents = selectors.map((selector) => row.querySelector(selector)).filter(Boolean);
      return {
        hovered: row.querySelector('.peak-value-label').dataset.markerHovered ?? null,
        labelZIndex: getComputedStyle(row.querySelector('.peak-value-label')).zIndex,
        contentZIndexes: contents.map((element) => getComputedStyle(element).zIndex),
      };
    }, { selectors: scenario.selectors });
    expect(hoverState).toEqual({
      hovered: 'true',
      labelZIndex: '11',
      contentZIndexes: Array(scenario.selectors.length).fill('10'),
    });
    await page.mouse.move(2, 2);
    await expect.poll(() => page.evaluate(() => {
      const row = document.querySelector('sensor-bar-card-plus').shadowRoot
        .querySelector('.row[data-entity="sensor.with_above_label"]');
      return row.querySelector('.peak-value-label').dataset.markerHovered ?? null;
    })).toBeNull();
  }
  expect([...observedLabelFontSizes].sort((a, b) => a - b)).toEqual([10, 11, 12]);
});

test('marker labels use a compact card surface with asymmetric offsets and unchanged row geometry', async ({ page }) => {
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
        { entity: 'sensor.generic_above', markers: [{ at: '50%', lane: 'above', label: { show: true } }] },
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
      'sensor.generic_above': sensor(42, { friendly_name: 'Generic above' }),
      'sensor.below_label': sensor(42, { friendly_name: 'Below' }),
      'sensor.after': sensor(42, { friendly_name: 'After' }),
    },
  });

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const root = card.shadowRoot;
    const rows = ['sensor.baseline', 'sensor.above_label', 'sensor.generic_above', 'sensor.below_label'].map((entity) =>
      root.querySelector(`.row[data-entity="${entity}"]`));
    const geometry = (row) => {
      const main = row.querySelector('.main-line').getBoundingClientRect();
      const track = row.querySelector('.bar-track').getBoundingClientRect();
      return { rowHeight: row.getBoundingClientRect().height, mainHeight: main.height, trackHeight: track.height };
    };
    const aboveLabel = rows[1].querySelector('.peak-value-label');
    const genericAboveLabel = rows[2].querySelector('.generic-value-label');
    const belowLabel = rows[3].querySelector('.target-value-label');
    const floorLabel = rows[3].querySelector('.floor-value-label');
    const trackAbove = rows[1].querySelector('.bar-track').getBoundingClientRect();
    const trackGenericAbove = rows[2].querySelector('.bar-track').getBoundingClientRect();
    const trackBelow = rows[3].querySelector('.bar-track').getBoundingClientRect();
    const style = getComputedStyle(belowLabel);
    return {
      geometry: rows.map(geometry),
      aboveGap: trackAbove.top - aboveLabel.getBoundingClientRect().bottom,
      genericAboveGap: trackGenericAbove.top - genericAboveLabel.getBoundingClientRect().bottom,
      belowGap: belowLabel.getBoundingClientRect().top - trackBelow.bottom,
      floorGap: floorLabel.getBoundingClientRect().top - trackBelow.bottom,
      aboveMargin: getComputedStyle(aboveLabel).marginBottom,
      genericAboveMargin: getComputedStyle(genericAboveLabel).marginBottom,
      belowMargin: style.marginTop,
      floorMargin: getComputedStyle(floorLabel).marginTop,
      background: style.backgroundColor,
      padding: style.padding,
      radius: style.borderRadius,
      border: style.borderTopWidth,
      shadow: style.boxShadow,
      textShadow: style.textShadow,
      lineHeight: style.lineHeight,
      rowClearance: getComputedStyle(rows[3]).marginBottom,
      markerLaneSize: getComputedStyle(root.querySelector('.card')).getPropertyValue('--sbcp-marker-label-lane-size').trim(),
    };
  });

  expect(metrics.geometry[1]).toEqual({
    ...metrics.geometry[0],
    rowHeight: metrics.geometry[0].rowHeight + 12,
  });
  expect(metrics.geometry[2]).toEqual({
    ...metrics.geometry[0],
    rowHeight: metrics.geometry[0].rowHeight + 12,
  });
  expect(metrics.geometry[3]).toEqual(metrics.geometry[0]);
  expect(metrics.aboveGap).toBe(1);
  expect(metrics.genericAboveGap).toBe(1);
  expect(metrics.belowGap).toBe(2);
  expect(metrics.floorGap).toBe(2);
  expect(metrics.aboveMargin).toBe('1px');
  expect(metrics.genericAboveMargin).toBe('1px');
  expect(metrics.belowMargin).toBe('2px');
  expect(metrics.floorMargin).toBe('2px');
  expect(metrics.background).toBe('rgb(255, 255, 255)');
  expect(metrics.padding).toBe('0px 2px');
  expect(metrics.radius).toBe('2px');
  expect(metrics.border).toBe('0px');
  expect(metrics.shadow).toBe('none');
  expect(metrics.textShadow).toContain('0px 0px 0.6px');
  expect(metrics.textShadow).toContain('0px 0px 1.2px');
  expect(metrics.lineHeight).toBe('12px');
  expect(metrics.rowClearance).toBe('13px');
  expect(metrics.markerLaneSize).toBe('15px');
});

test('marker labels inherit their own marker color and contrast through normal updates', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'off',
      min: 0,
      max: 100,
      entities: [{
        entity: 'sensor.marker_color_row',
        target: { at: { fixed: 60 }, color: '#F8FAFC', label: { show: true } },
        peak: { enabled: true, reset: 'never', color: '#111827', label: { show: true } },
        floor: { enabled: true, reset: 'never', color: '#808080', label: { show: true } },
        markers: [
          { at: { fixed: 35 }, lane: 'above', shape: 'diamond', color: '#DC2626', label: { show: true } },
          { at: { fixed: 65 }, lane: 'below', shape: 'circle', color: '#2563EB', label: { show: true } },
        ],
      }],
    },
    states: { 'sensor.marker_color_row': sensor(50, { friendly_name: 'Marker color row' }) },
  });

  const readLabels = () => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.marker_color_row"]');
    const labels = [
      ['target', row.querySelector('.target-value-label')],
      ['peak', row.querySelector('.peak-value-label')],
      ['floor', row.querySelector('.floor-value-label')],
      ['generic-0', row.querySelector('.generic-value-label[data-marker-id="generic-0"]')],
      ['generic-1', row.querySelector('.generic-value-label[data-marker-id="generic-1"]')],
    ];
    return {
      row: row.getBoundingClientRect().toJSON(),
      main: row.querySelector('.main-line').getBoundingClientRect().toJSON(),
      track: row.querySelector('.bar-track').getBoundingClientRect().toJSON(),
      labels: labels.map(([id, label]) => ({
        id,
        same: !!label,
        color: label?.style.getPropertyValue('--marker-color').trim(),
        contrast: label?.style.getPropertyValue('--marker-contrast-color').trim(),
        computedColor: label ? getComputedStyle(label).color : null,
        computedContrast: label ? getComputedStyle(label).getPropertyValue('--marker-contrast-color').trim() : null,
        textShadow: label ? getComputedStyle(label).textShadow : null,
        background: label ? getComputedStyle(label).backgroundColor : null,
        padding: label ? getComputedStyle(label).padding : null,
        radius: label ? getComputedStyle(label).borderRadius : null,
        lineHeight: label ? getComputedStyle(label).lineHeight : null,
        rect: label?.getBoundingClientRect().toJSON() ?? null,
      })),
    };
  });

  const initial = await readLabels();
  expect(initial.labels.map(({ id, color }) => [id, color])).toEqual([
    ['target', '#F8FAFC'],
    ['peak', '#111827'],
    ['floor', '#808080'],
    ['generic-0', '#DC2626'],
    ['generic-1', '#2563EB'],
  ]);
  for (const label of initial.labels) {
    expect(label.same).toBe(true);
    expect(label.contrast).not.toBe('');
    expect(label.computedContrast).toBe(label.contrast);
    expect(label.textShadow).toContain('0px 0px 0.6px');
    expect(label.textShadow).toContain('0px 0px 1.2px');
    expect(label.background).toBe('rgb(255, 255, 255)');
    expect(label.padding).toBe('0px 2px');
    expect(label.radius).toBe('2px');
    expect(label.lineHeight).toBe('12px');
  }
  expect(initial.labels[3].color).not.toBe(initial.labels[4].color);

  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    window.__markerColorLabelRefs = [...card.shadowRoot.querySelectorAll('.target-value-label, .peak-value-label, .floor-value-label, .generic-value-label')];
    card.hass = { states: {
      ...card._hass.states,
      'sensor.marker_color_row': window.__sbcpCreateState(50, { friendly_name: 'Marker color row', icon: 'mdi:flash', unit_of_measurement: 'W' }),
    } };
  });
  const afterHass = await readLabels();
  expect(afterHass.labels.map(({ id, color }) => [id, color])).toEqual(initial.labels.map(({ id, color }) => [id, color]));
  expect(afterHass.row).toEqual(initial.row);
  expect(afterHass.main).toEqual(initial.main);
  expect(afterHass.track).toEqual(initial.track);
  expect(afterHass.labels.map(({ rect }) => [rect.width, rect.height])).toEqual(initial.labels.map(({ rect }) => [rect.width, rect.height]));
  expect(await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    return [...card.shadowRoot.querySelectorAll('.target-value-label, .peak-value-label, .floor-value-label, .generic-value-label')]
      .every((label, index) => label === window.__markerColorLabelRefs[index]);
  })).toBe(true);

  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const rowConfig = card._config.entities[0];
    rowConfig.target_marker.color = '#16A34A';
    rowConfig.peak_marker.color = '#0EA5E9';
    rowConfig.floor_marker.color = '#7C3AED';
    rowConfig.generic_markers[0].color = '#F59E0B';
    card.hass = { states: {
      ...card._hass.states,
      'sensor.marker_color_row': window.__sbcpCreateState(50, { friendly_name: 'Marker color row', icon: 'mdi:flash', unit_of_measurement: 'W' }),
    } };
  });
  const afterPatchColorChange = await readLabels();
  expect(afterPatchColorChange.labels.map(({ id, color }) => [id, color])).toEqual([
    ['target', '#16A34A'],
    ['peak', '#0EA5E9'],
    ['floor', '#7C3AED'],
    ['generic-0', '#F59E0B'],
    ['generic-1', '#2563EB'],
  ]);
  expect(afterPatchColorChange.labels.map(({ rect }) => [rect.width, rect.height])).toEqual(initial.labels.map(({ rect }) => [rect.width, rect.height]));
  expect(await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    return [...card.shadowRoot.querySelectorAll('.target-value-label, .peak-value-label, .floor-value-label, .generic-value-label')]
      .every((label, index) => label === window.__markerColorLabelRefs[index]);
  })).toBe(true);
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
  const resting = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return {
      targetZ: getComputedStyle(row.querySelector('.target-value-label')).zIndex,
      floorZ: getComputedStyle(row.querySelector('.floor-value-label')).zIndex,
      valueZ: getComputedStyle(row.querySelector('.value-right')).zIndex,
    };
  });
  expect(resting).toEqual({ targetZ: '8', floorZ: '8', valueZ: '10' });
  await targetGlyph.hover();
  const hovered = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return {
      target: row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      floor: row.querySelector('.floor-value-label').dataset.markerHovered ?? null,
      targetZ: getComputedStyle(row.querySelector('.target-value-label')).zIndex,
      floorZ: getComputedStyle(row.querySelector('.floor-value-label')).zIndex,
      valueZ: getComputedStyle(row.querySelector('.value-right')).zIndex,
      cursor: getComputedStyle(row.querySelector('.target-marker .marker-shape-svg path[data-shape="diamond"]')).cursor,
      targetRect: row.querySelector('.target-value-label').getBoundingClientRect().toJSON(),
      floorRect: row.querySelector('.floor-value-label').getBoundingClientRect().toJSON(),
      trackRect: row.querySelector('.bar-track').getBoundingClientRect().toJSON(),
      rowHeight: row.getBoundingClientRect().height,
    };
  });
  expect(hovered.target).toBe('true');
  expect(hovered.floor).toBeNull();
  expect(hovered.targetZ).toBe('11');
  expect(hovered.floorZ).toBe('8');
  expect(hovered.valueZ).toBe('10');
  expect(hovered.cursor).toBe('none');
  expect(hovered.targetRect.left).toBeLessThan(hovered.floorRect.right);
  expect(hovered.targetRect.right).toBeGreaterThan(hovered.floorRect.left);
  await page.mouse.move(2, 2);
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return [row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      getComputedStyle(row.querySelector('.target-value-label')).zIndex,
      getComputedStyle(row.querySelector('.floor-value-label')).zIndex,
      getComputedStyle(row.querySelector('.target-marker .marker-shape-svg path[data-shape="diamond"]')).cursor];
  })).toEqual([null, '8', '8', 'pointer']);

  const floorGlyph = card.locator('.floor-marker .floor-inset');
  await floorGlyph.hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.builtins"]');
    return [row.querySelector('.target-value-label').dataset.markerHovered ?? null,
      row.querySelector('.floor-value-label').dataset.markerHovered ?? null,
      getComputedStyle(row.querySelector('.floor-value-label')).zIndex,
      getComputedStyle(row.querySelector('.floor-marker .floor-inset')).cursor,
      getComputedStyle(row.querySelector('.value-right')).zIndex];
  })).toEqual([null, 'true', '11', 'none', '10']);
  await page.mouse.move(2, 2);
  await expect.poll(() => floorGlyph.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
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
  const resting = await page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return {
      labels: [...row.querySelectorAll('.generic-value-label')].map((label) => getComputedStyle(label).zIndex),
      value: getComputedStyle(row.querySelector('.value-right')).zIndex,
    };
  });
  expect(resting).toEqual({ labels: ['8', '8'], value: '10' });

  await markerA.hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return {
      labels: [...row.querySelectorAll('.generic-value-label')].map((label) => [label.dataset.markerHovered ?? null, getComputedStyle(label).zIndex]),
      value: getComputedStyle(row.querySelector('.value-right')).zIndex,
      cursor: getComputedStyle(row.querySelector('.generic-marker[data-marker-id="generic-0"] .marker-shape-svg path[data-shape="circle"]')).cursor,
    };
  })).toEqual({ labels: [['true', '11'], [null, '8']], value: '10', cursor: 'none' });

  await markerB.hover();
  await expect.poll(() => page.evaluate(() => {
    const row = document.querySelector('sensor-bar-card-plus').shadowRoot.querySelector('.row[data-entity="sensor.generic_row"]');
    return {
      labels: [...row.querySelectorAll('.generic-value-label')].map((label) => [label.dataset.markerHovered ?? null, getComputedStyle(label).zIndex]),
      value: getComputedStyle(row.querySelector('.value-right')).zIndex,
      cursor: getComputedStyle(row.querySelector('.generic-marker[data-marker-id="generic-1"] .marker-shape-svg path[data-shape="diamond"]')).cursor,
    };
  })).toEqual({ labels: [[null, '8'], ['true', '11']], value: '10', cursor: 'none' });
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
  expect(await markerB.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
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
        { at: { entity: 'sensor.reference_low', fixed: 80 }, lane: 'below', shape: 'chevron', color: '#14B8A6', label: { show: true, show_unit: false } },
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

test('marker semantic labels compose safely and update without changing generic association', async ({ page }) => {
  const config = {
    type: 'custom:sensor-bar-card-plus',
    label_position: 'off',
    min: 0,
    max: 100,
    formatting: { decimal: 1 },
    target: { at: 25, label: { show: true, text: 'Target' } },
    peak: { enabled: true, label: { show: true, text: 'Max' } },
    floor: { enabled: true, label: { show: true, text: 'Min', show_value: false } },
    markers: [
      { at: 10, lane: 'above', label: { show: true, text: 'Prediction', precision: 0 } },
      { at: 30, lane: 'above', label: { show: true, text: 'Previous max', show_unit: false } },
      { at: 60, lane: 'below', label: { show: true, text: 'Trigger', show_value: false } },
      { at: 80, lane: 'below', label: { show: true, text: 'Low', show_value: false, show_unit: false } },
    ],
    entities: [{ entity: 'sensor.semantic_labels' }],
  };
  await render(page, {
    width: 620,
    config,
    states: { 'sensor.semantic_labels': sensor(42, { friendly_name: 'Semantic labels' }) },
  });

  const card = page.locator('sensor-bar-card-plus');
  const initial = await card.evaluate((element) => {
    const row = element.shadowRoot.querySelector('.row[data-entity="sensor.semantic_labels"]');
    window.__semanticGenericNode = row.querySelector('.generic-marker[data-marker-id="generic-0"]');
    return {
      target: row.querySelector('.target-value-label').textContent.trim(),
      peak: row.querySelector('.peak-value-label').textContent.trim(),
      floor: row.querySelector('.floor-value-label').textContent.trim(),
      generic: [...row.querySelectorAll('.generic-value-label')].map((label) => label.textContent.trim()),
      genericHasMarkup: Boolean(row.querySelector('.generic-value-label b, .generic-value-label strong')),
    };
  });
  expect(initial).toEqual({
    target: 'Target 25.0 W',
    peak: 'Max 42.0 W',
    floor: 'Min W',
    generic: ['Prediction 10 W', 'Previous max 30.0', 'Trigger W', 'Low'],
    genericHasMarkup: false,
  });

  await card.evaluate((element) => {
    element.hass = { states: { 'sensor.semantic_labels': { state: '43', attributes: { friendly_name: 'Semantic labels', unit_of_measurement: 'W' } } } };
  });
  const stableAfterHassUpdate = await card.evaluate((element) => {
    const row = element.shadowRoot.querySelector('.row[data-entity="sensor.semantic_labels"]');
    return row.querySelector('.generic-marker[data-marker-id="generic-0"]') === window.__semanticGenericNode;
  });
  expect(stableAfterHassUpdate).toBe(true);

  await card.evaluate((element, nextConfig) => element.setConfig(nextConfig), {
    ...config,
    markers: [{ ...config.markers[0], label: { show: true, text: '<Forecast>', show_value: false, show_unit: false } }, ...config.markers.slice(1)],
  });
  await expect(card.locator('.row[data-entity="sensor.semantic_labels"] .generic-value-label').first()).toHaveText('<Forecast>');
  const markupAfterConfigUpdate = await card.locator('.row[data-entity="sensor.semantic_labels"] .generic-value-label').first().locator('b, strong').count();
  expect(markupAfterConfigUpdate).toBe(0);
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
    const read = (marker, type, lane, shape, direction = 'inward') => {
      card._patchMarker(marker, {
        type,
        lane,
        shape,
        direction,
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
      const insetRect = inset.getBoundingClientRect();
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
      const tipY = shape === 'arrow' ? 15 : shape === 'pin' ? 15.5 : shape === 'chevron' ? 14 : null;
      const tipPoint = tipY === null ? null : Object.assign(svg.createSVGPoint(), { x: 8, y: tipY })
        .matrixTransform(shapePath.getScreenCTM());
      return {
        shape,
        lane,
        direction,
        left: marker.getBoundingClientRect().left,
        leftStyle: marker.style.left,
        scaleX: transform[0],
        scaleY: transform[3],
        pathScaleY: pathGroupMatrix[3],
        transformOrigin: svgStyle.transformOrigin,
        svgDisplay: svgStyle.display,
        svgFilter: svgStyle.filter,
        svgHeight: svg.getBoundingClientRect().height,
        edgeDelta: shape === 'triangle'
          ? (lane === 'above' ? insetRect.top - trackRect.top : trackRect.bottom - insetRect.bottom)
          : (lane === 'above' ? svgRect.top - trackRect.top : trackRect.bottom - svgRect.bottom),
        chevronBox: chevronBox ? { x: chevronBox.x, y: chevronBox.y, width: chevronBox.width, height: chevronBox.height } : null,
        shapeWidth: shapePathRect?.width ?? null,
        shapeHeight: shapePathRect?.height ?? null,
        tipOffsetFromCenter: tipPoint ? tipPoint.y - (svgRect.top + svgRect.height / 2) : null,
        borderTop: insetStyle.borderTopWidth,
        borderBottom: insetStyle.borderBottomWidth,
        borderTopColor: insetStyle.borderTopColor,
        borderBottomColor: insetStyle.borderBottomColor,
        insetHeight: inset.getBoundingClientRect().height,
        insetFilter: insetStyle.filter,
      };
    };

    return {
      below: shapes.map((shape) => read(target, 'target', 'below', shape)),
      above: shapes.map((shape) => read(peak, 'peak', 'above', shape)),
      directions: ['above', 'below'].flatMap((lane) => (
        ['triangle', 'chevron', 'arrow', 'pin'].flatMap((shape) => (
          ['inward', 'outward'].map((direction) => read(
            lane === 'above' ? peak : target,
            lane === 'above' ? 'peak' : 'target',
            lane,
            shape,
            direction
          ))
        ))
      )),
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
      expect(entry.svgFilter).toContain('drop-shadow');
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
      expect(entry.svgFilter).toContain('drop-shadow');
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
  expect(geometry.below.find((entry) => entry.shape === 'triangle').insetFilter).toContain('drop-shadow');
  expect(geometry.above.find((entry) => entry.shape === 'triangle').insetFilter).toContain('drop-shadow');

  for (const entry of geometry.directions) {
    const flipped = (entry.lane === 'above' && entry.direction === 'outward')
      || (entry.lane === 'below' && entry.direction === 'inward');
    expect(entry.leftStyle).toBe('60%');
    expect(entry.edgeDelta).toBeCloseTo(0, 2);
    if (entry.shape === 'triangle') {
      expect(entry.insetHeight).toBeCloseTo(11, 1);
      expect(entry.borderTop).toBe(flipped ? '0px' : '11px');
      expect(entry.borderBottom).toBe(flipped ? '11px' : '0px');
      expect(flipped ? entry.borderBottomColor : entry.borderTopColor).toBe('rgb(18, 52, 86)');
    } else {
      expect(entry.pathScaleY).toBe(flipped ? -1 : 1);
      const expectedHeight = entry.shape === 'chevron' || entry.shape === 'arrow' ? 9 : 10.875;
      expect(entry.shapeHeight).toBeCloseTo(expectedHeight, 1);
      if (entry.shape === 'arrow') expect(entry.shapeWidth).toBeCloseTo(7.5, 1);
      expect(Math.sign(entry.tipOffsetFromCenter)).toBe(flipped ? -1 : 1);
    }
  }
});

test('outward Arrow and Pin hit testing follows painted shapes and leaves the Pin hole inactive', async ({ page }) => {
  await render(page, {
    width: 720,
    config: {
      type: 'custom:sensor-bar-card-plus',
      min: 0,
      max: 100,
      markers: [
        { at: '50%', lane: 'above', shape: 'pin', direction: 'outward', label: { show: true } },
        { at: '75%', lane: 'above', shape: 'arrow', direction: 'outward', label: { show: true } },
      ],
      entities: [{ entity: 'sensor.pin_hit_test' }],
    },
    states: { 'sensor.pin_hit_test': sensor(40, { friendly_name: 'Pin hit test' }) },
  });

  const points = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.pin_hit_test"]');
    const marker = row.querySelector('.generic-marker[data-marker-id="generic-0"]');
    const svg = marker.querySelector('.marker-shape-svg');
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / 16;
    return {
      body: { x: rect.left + 8 * scale, y: rect.top + 14 * scale },
      hole: { x: rect.left + 8 * scale, y: rect.top + 10 * scale },
      transform: getComputedStyle(svg.querySelector('.marker-shape-paths')).transform,
      position: marker.style.left,
      edgeDelta: rect.top - row.querySelector('.bar-track').getBoundingClientRect().top,
    };
  });
  expect(points.position).toBe('50%');
  expect(points.transform).not.toBe('none');
  expect(points.edgeDelta).toBeCloseTo(0, 2);

  await page.mouse.move(points.body.x, points.body.y);
  await expect.poll(() => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.pin_hit_test"]');
    const label = row.querySelector('.generic-value-label[data-marker-id="generic-0"]');
    return {
      active: card._markerHover?.marker?.dataset.markerId ?? null,
      promoted: label.dataset.markerHovered ?? null,
      cursor: getComputedStyle(row.querySelector('.generic-marker[data-marker-id="generic-0"] path[data-shape="pin"]')).cursor,
    };
  })).toEqual({ active: 'generic-0', promoted: 'true', cursor: 'none' });

  await page.mouse.move(points.hole.x, points.hole.y);
  await expect.poll(() => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.pin_hit_test"]');
    const label = row.querySelector('.generic-value-label[data-marker-id="generic-0"]');
    return {
      active: card._markerHover?.marker?.dataset.markerId ?? null,
      promoted: label.dataset.markerHovered ?? null,
    };
  })).toEqual({ active: null, promoted: null });

  const arrowPoint = await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const path = card.shadowRoot.querySelector('.generic-marker[data-marker-id="generic-1"] path[data-shape="arrow"]');
    const point = Object.assign(path.ownerSVGElement.createSVGPoint(), { x: 8, y: 12 })
      .matrixTransform(path.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  await page.mouse.move(arrowPoint.x, arrowPoint.y);
  await expect.poll(() => page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const row = card.shadowRoot.querySelector('.row[data-entity="sensor.pin_hit_test"]');
    const label = row.querySelector('.generic-value-label[data-marker-id="generic-1"]');
    const path = row.querySelector('.generic-marker[data-marker-id="generic-1"] path[data-shape="arrow"]');
    return {
      active: card._markerHover?.marker?.dataset.markerId ?? null,
      promoted: label.dataset.markerHovered ?? null,
      cursor: getComputedStyle(path).cursor,
    };
  })).toEqual({ active: 'generic-1', promoted: 'true', cursor: 'none' });
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

test('left responsive presentation is stable through stateful shrink and grow traversals', async ({ page }) => {
  const mount = await render(page, {
    width: 500,
    config: {
      type: 'custom:sensor-bar-card-plus',
      min: 0,
      max: 100,
      entities: [{ entity: 'sensor.temperature' }],
    },
    states: {
      'sensor.temperature': {
        state: '42',
        attributes: {
          friendly_name: 'Temperature',
          unit_of_measurement: '°C',
          device_class: 'temperature',
        },
      },
    },
  });

  const settleAtWidth = async (width) => {
    await page.evaluate(async (nextWidth) => {
      document.getElementById('mount').style.width = `${nextWidth}px`;
      const card = document.querySelector('sensor-bar-card-plus');
      card._runPostLayoutPasses();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 10))));
      });
    }, width);
    return page.evaluate(() => {
      const card = document.querySelector('sensor-bar-card-plus');
      const row = card.shadowRoot.querySelector('.row[data-entity="sensor.temperature"]');
      const mainLine = row.querySelector('.main-line');
      const label = row.querySelector('.label-left');
      const icon = mainLine.querySelector('.icon-wrap');
      const track = row.querySelector('.bar-track');
      const predicted = card._chooseLeftModeResponsiveState(row)?.predicted;
      return {
        state: [
          getComputedStyle(icon).display !== 'none',
          getComputedStyle(label).display !== 'none',
          row.querySelector('.row-stack').dataset.forceTopValue === 'true',
        ].map((value) => value ? '1' : '0').join(''),
        density: mainLine.dataset.leftDensity,
        predictedShare: predicted?.share ?? null,
        predictedShowIcon: predicted?.showIcon ?? false,
        renderedIcon: !!icon && getComputedStyle(icon).display !== 'none',
        renderedShare: track.getBoundingClientRect().width / mainLine.getBoundingClientRect().width,
      };
    });
  };

  const stateRank = { '110': 0, '111': 1, '100': 2, '000': 3, '001': 4 };
  const shrink = [];
  for (let width = 500; width >= 150; width -= 5) {
    shrink.push({ width, ...(await settleAtWidth(width)) });
  }
  const shrinkStates = [...new Set(shrink.map(({ state }) => state))];
  expect(shrinkStates.map((state) => stateRank[state])).toEqual(
    [...shrinkStates.map((state) => stateRank[state])].sort((a, b) => a - b),
  );
  expect(shrinkStates[0]).toBe('110');
  expect(['000', '001']).toContain(shrinkStates.at(-1));
  if (shrinkStates.at(-1) === '000') {
    expect(shrink.at(-1).predictedShare).toBeGreaterThan(0.52);
  }

  const grow = [];
  for (let width = 150; width <= 500; width += 5) {
    grow.push({ width, ...(await settleAtWidth(width)) });
  }
  const growStates = [...new Set(grow.map(({ state }) => state))];
  const densityAt = (path, width) => path.find((entry) => entry.width === width)?.density;
  for (let width = 320; width <= 370; width += 5) {
    expect(densityAt(shrink, width)).toBe(densityAt(grow, width));
  }
  expect(growStates.map((state) => stateRank[state])).toEqual(
    [...growStates.map((state) => stateRank[state])].sort((a, b) => b - a),
  );
  expect(growStates[0]).toBe(shrinkStates.at(-1));
  expect(growStates.at(-1)).toBe('110');

  const fixedWidthSamples = [];
  for (const width of [280, 286, 294, 305]) {
    const repeated = [];
    for (let pass = 0; pass < 4; pass += 1) {
      repeated.push(await settleAtWidth(width));
    }
    expect(new Set(repeated.map(({ state, density }) => `${state}:${density}`)).size).toBe(1);
    fixedWidthSamples.push(repeated[0]);
  }
  for (let width = 320; width <= 370; width += 5) {
    const repeated = [];
    for (let pass = 0; pass < 3; pass += 1) repeated.push(await settleAtWidth(width));
    expect(new Set(repeated.map(({ density }) => density)).size).toBe(1);
  }

  for (const { predictedShare, renderedShare } of [...shrink, ...grow]) {
    expect(predictedShare).not.toBeNull();
    expect(Math.abs(predictedShare - renderedShare)).toBeLessThan(0.04);
  }
  for (const { predictedShowIcon, renderedIcon } of [...shrink, ...grow]) {
    expect(predictedShowIcon).toBe(renderedIcon);
  }
  expect(fixedWidthSamples.length).toBe(4);

  await expect(mount).toBeVisible();
});

test('left responsive decisions stay row-local across label/value variants and layout updates', async ({ page }) => {
  const mount = await render(page, {
    width: 300,
    config: {
      type: 'custom:sensor-bar-card-plus',
      min: 0,
      max: 100,
      entities: [
        { entity: 'sensor.long_label' },
        { entity: 'sensor.short_label', icon: false },
        { entity: 'sensor.long_value', icon: false },
      ],
    },
    states: {
      'sensor.long_label': {
        state: '42',
        attributes: { friendly_name: 'Living room temperature sensor', device_class: 'temperature', unit_of_measurement: '°C' },
      },
      'sensor.short_label': {
        state: '42',
        attributes: { friendly_name: 'EV', unit_of_measurement: '°C' },
      },
      'sensor.long_value': {
        state: '123456789',
        attributes: { friendly_name: 'Energy', unit_of_measurement: 'kilowatt-hours equivalent' },
      },
    },
  });

  const sampleRows = async (width) => {
    await page.evaluate(async (nextWidth) => {
      document.getElementById('mount').style.width = `${nextWidth}px`;
      const card = document.querySelector('sensor-bar-card-plus');
      card._runPostLayoutPasses();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30))));
      });
    }, width);
    return page.evaluate(() => {
      const card = document.querySelector('sensor-bar-card-plus');
      return [...card.shadowRoot.querySelectorAll('.row[data-entity]')].map((row) => {
        const line = row.querySelector('.main-line');
        const track = row.querySelector('.bar-track');
        const predicted = card._chooseLeftModeResponsiveState(row)?.predicted;
        const icon = line.querySelector('.icon-wrap');
        const iconVisible = !!icon && getComputedStyle(icon).display !== 'none';
        return {
          entity: row.dataset.entity,
          rowWidth: line.getBoundingClientRect().width,
          state: [
            iconVisible,
            getComputedStyle(row.querySelector('.label-left')).display !== 'none',
            row.querySelector('.row-stack').dataset.forceTopValue === 'true',
          ].map((value) => value ? '1' : '0').join(''),
          density: line.dataset.leftDensity,
          predictedShare: predicted?.share ?? null,
          predictedShowIcon: predicted?.showIcon ?? false,
          renderedIcon: !!icon && getComputedStyle(icon).display !== 'none',
          renderedShare: track.getBoundingClientRect().width / line.getBoundingClientRect().width,
        };
      });
    });
  };

  const first = await sampleRows(300);
  expect(first.find((row) => row.entity === 'sensor.short_label')?.state).not.toBe(
    first.find((row) => row.entity === 'sensor.long_label')?.state,
  );
  expect(await page.locator('sensor-bar-card-plus .row[data-entity="sensor.short_label"] .icon-wrap').count()).toBe(0);
  for (const width of [500, 330, 295, 180, 300]) {
    const firstPass = await sampleRows(width);
    const secondPass = await sampleRows(width);
    expect(secondPass.map(({ state, density }) => `${state}:${density}`), `width ${width}: ${JSON.stringify({ firstPass, secondPass })}`)
      .toEqual(firstPass.map(({ state, density }) => `${state}:${density}`));
    for (const row of firstPass) {
      expect(row.predictedShare).not.toBeNull();
      expect(Math.abs(row.predictedShare - row.renderedShare), JSON.stringify(row)).toBeLessThan(0.04);
      expect(row.predictedShowIcon).toBe(row.renderedIcon);
    }
  }

  await page.locator('sensor-bar-card-plus').evaluate((card) => card.setConfig({
    type: 'custom:sensor-bar-card-plus',
    layout: { label: { position: 'above' } },
    min: 0,
    max: 100,
    entities: [
      { entity: 'sensor.long_label' },
      { entity: 'sensor.short_label', icon: false },
      { entity: 'sensor.long_value', icon: false },
    ],
  }));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const switchedRows = await page.locator('sensor-bar-card-plus .row[data-entity]').evaluateAll((rows) => rows.map((row) => ({
    mode: row.querySelector('.main-line').className,
    leftDensity: row.querySelector('.main-line').dataset.leftDensity ?? null,
    forceTopValue: row.querySelector('.row-stack').dataset.forceTopValue ?? null,
    leftLabel: row.querySelector('.label-left'),
    topValue: row.querySelector('.top-right-value'),
  })));
  expect(switchedRows.every((row) => row.mode.includes('above-mode'))).toBe(true);
  expect(switchedRows.every((row) => row.leftDensity === null && row.forceTopValue === null && !row.leftLabel && !row.topValue)).toBe(true);

  await expect(mount).toBeVisible();
});

test('Left responsive layout preserves marker lanes and positions against its final track', async ({ page }) => {
  const mount = await render(page, {
    width: 300,
    config: {
      type: 'custom:sensor-bar-card-plus',
      label_position: 'left',
      label_width: 100,
      min: 0,
      max: 100,
      entities: [
        { entity: 'sensor.left_plain' },
        { entity: 'sensor.left_unlabeled', peak: { enabled: true } },
        {
          entity: 'sensor.left_marked',
          markers: [
            { at: '25%', lane: 'above', label: { show: true, text: 'Above', show_value: false, show_unit: false } },
            { at: { entity: 'sensor.left_unresolved' }, lane: 'above', label: { show: true, text: 'Pending', show_value: false, show_unit: false } },
          ],
        },
      ],
    },
    states: {
      'sensor.left_plain': sensor(42, { friendly_name: 'Living power', unit_of_measurement: 'W' }),
      'sensor.left_unlabeled': sensor(42, { friendly_name: 'Living power', unit_of_measurement: 'W' }),
      'sensor.left_marked': sensor(42, { friendly_name: 'Living power', unit_of_measurement: 'W' }),
    },
  });

  const sample = async (width) => {
    await page.evaluate(async (nextWidth) => {
      document.getElementById('mount').style.width = `${nextWidth}px`;
      const card = document.querySelector('sensor-bar-card-plus');
      card._runPostLayoutPasses();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }, width);
    return page.evaluate(() => {
      const card = document.querySelector('sensor-bar-card-plus');
      return [...card.shadowRoot.querySelectorAll('.row[data-entity]')].map((row) => {
        const track = row.querySelector('.bar-track');
        const mainLine = row.querySelector('.main-line');
        const label = row.querySelector('.generic-value-label[data-lane="above"]');
        const marker = row.querySelector('.generic-marker[data-marker-id="generic-0"]');
        const trackRect = track.getBoundingClientRect();
        const markerRect = marker?.getBoundingClientRect();
        return {
          entity: row.dataset.entity,
          aboveOccupancy: row.dataset.markerLabelLaneAbove,
          topValue: row.querySelector('.row-stack').dataset.forceTopValue ?? null,
          mainWidth: mainLine.getBoundingClientRect().width,
          trackWidth: trackRect.width,
          markerTrackShare: markerRect ? (markerRect.left + markerRect.width / 2 - trackRect.left) / trackRect.width : null,
          labelTrackGap: label && getComputedStyle(label).visibility === 'visible'
            ? trackRect.top - label.getBoundingClientRect().bottom
            : null,
        };
      });
    });
  };

  for (const width of [300, 220, 170]) {
    const rows = await sample(width);
    const [plain, unlabeled, marked] = rows;
    expect(plain.aboveOccupancy).toBe('false');
    expect(unlabeled.aboveOccupancy).toBe('false');
    expect(marked.aboveOccupancy).toBe('true');
    expect(marked.labelTrackGap).toBe(1);
    expect(marked.markerTrackShare).toBeCloseTo(0.25, 2);
    expect(marked.mainWidth).toBe(plain.mainWidth);
    expect(marked.trackWidth).toBe(plain.trackWidth);
  }

  await expect(mount).toBeVisible();
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
