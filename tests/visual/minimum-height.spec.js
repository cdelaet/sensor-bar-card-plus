const { test, expect } = require('@playwright/test');

const valueLabel = { show: true };
const textLabel = (text) => ({ show: true, text, show_value: false, show_unit: false });
const builtins = {
  target: { at: 45, label: valueLabel },
  peak: { enabled: true, label: valueLabel },
  floor: { enabled: true, label: valueLabel },
};

async function renderRows(page, entities, { width = 720, position = 'off' } = {}) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ entities, width, position }) => {
    const states = (value) => Object.fromEntries(entities.map(({ entity }) => [entity, {
      state: String(value),
      attributes: { friendly_name: 'Power', icon: 'mdi:flash', unit_of_measurement: 'W' },
    }]));
    const card = await window.__sbcpRenderCard({
      width,
      config: {
        layout: { height: 24, label: { position } },
        scale: { min: 0, max: 100 },
        bar: { animated: false },
        entities,
      },
      states: states(15),
    });
    // Exercise the update path and separate Peak (75), Floor (15), and Target (45).
    card.hass = { states: states(75) };
    card.hass = { states: states(50) };
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { entities, width, position });
  await expect(page.locator('sensor-bar-card-plus .row[data-entity]')).toHaveCount(entities.length);
}

async function readGeometry(page) {
  return page.locator('sensor-bar-card-plus').evaluate((card) => {
    const root = card.shadowRoot;
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const visible = (node) => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility === 'visible' && node.getBoundingClientRect().height > 0;
    };
    return {
      card: box(root.querySelector('ha-card')),
      rows: [...root.querySelectorAll('.row[data-entity]')].map((row) => {
        const track = row.querySelector('.bar-track');
        const markers = [...track.querySelectorAll('.target-marker, .peak-marker, .floor-marker, .generic-marker')].filter(visible);
        return {
          entity: row.dataset.entity,
          row: box(row),
          main: box(row.querySelector('.main-line')),
          track: box(track),
          trackOverflow: getComputedStyle(track).overflow,
          markers: markers.map((marker) => ({
            id: marker.dataset.markerId ?? marker.className.replace('-marker', ''),
            lane: marker.dataset.lane,
            shape: marker.dataset.shape,
            direction: marker.dataset.direction,
            hiddenShape: marker.dataset.showMarker === 'false',
            percent: parseFloat(marker.style.left),
            anchor: box(marker),
            // Triangle outsets are intentionally clipped by the track; test the painted inset.
            glyphs: [...marker.querySelectorAll('[class$="-inset"], .marker-shape-svg path[data-shape]')]
              .filter(visible).map(box),
          })),
          labels: [...row.querySelectorAll('.target-value-label, .peak-value-label, .floor-value-label, .generic-value-label')]
            .map((label) => ({
              id: label.dataset.markerId ?? (label.classList.contains('target-value-label') ? 'target'
                : label.classList.contains('floor-value-label') ? 'floor' : 'peak'),
              lane: label.dataset.lane ?? (label.classList.contains('peak-value-label') ? 'above' : 'below'),
              visible: visible(label),
              text: label.textContent.trim(),
              box: box(label),
              // Check every clipping ancestor, not just containment in the outer card.
              clips: [...(function* () {
                for (let node = label.parentElement; node; node = node.parentElement) yield node;
              })()].map((node) => ({
                box: box(node),
                x: getComputedStyle(node).overflowX,
                y: getComputedStyle(node).overflowY,
              })).filter(({ x, y }) => /hidden|clip|auto|scroll/.test(`${x} ${y}`)),
            })),
          contents: [...row.querySelectorAll('.label-left-text, .value-right-text, .top-right-value, .above-bar-label-value, .inside-name, .inside-value, .icon-wrap')]
            .filter(visible).map((node) => ({ box: box(node), inside: node.matches('.inside-name, .inside-value') })),
          values: [...row.querySelectorAll('.value-right, .top-right-value, .above-bar-label-value, .inside-value, .hero-value')]
            .filter(visible).map((node) => node.textContent.trim()),
          topValueActive: row.querySelector('.top-right-value')?.dataset.active ?? null,
          hero: row.querySelector('.hero-header') ? box(row.querySelector('.hero-header')) : null,
          indicators: [...track.querySelectorAll('.baseline-indicator, .needle-marker')].filter(visible)
            .map((node) => ({
              className: node.className, percent: parseFloat(node.style.left), box: box(node),
              layer: box(node.parentElement), overflow: getComputedStyle(node.parentElement).overflow,
            })),
        };
      }),
    };
  });
}

function expectContained(inner, outer) {
  expect(inner.left).toBeGreaterThanOrEqual(outer.left - 0.25);
  expect(inner.right).toBeLessThanOrEqual(outer.right + 0.25);
  expect(inner.top).toBeGreaterThanOrEqual(outer.top - 0.25);
  expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + 0.25);
}

function overlaps(a, b) {
  return a.left < b.right - 0.25 && a.right > b.left + 0.25
    && a.top < b.bottom - 0.25 && a.bottom > b.top + 0.25;
}

function expectSafeRails(geometry) {
  geometry.rows.forEach((row, index) => {
    expect(row.main.height).toBe(24);
    expect(row.track.height).toBe(24);
    expect(row.track.width).toBeGreaterThan(0);
    expect(row.trackOverflow).toBe('hidden');
    expectContained(row.track, geometry.card);
    for (const marker of row.markers) {
      expect(Number.isFinite(marker.percent)).toBe(true);
      expect(marker.anchor.height).toBe(24);
      expect(marker.anchor.left).toBeCloseTo(row.track.left + row.track.width * marker.percent / 100, 1);
      expect(marker.glyphs).toHaveLength(marker.hiddenShape ? 0 : 1);
      for (const glyph of marker.glyphs) {
        expect(Object.values(glyph).every(Number.isFinite)).toBe(true);
        expect(glyph.width).toBeGreaterThan(0);
        expect(glyph.height).toBeGreaterThan(0);
        // Fixtures use interior positions: endpoint clipping is a separate, intentional behavior.
        expectContained(glyph, row.track);
        const center = (glyph.top + glyph.bottom) / 2;
        if (marker.lane === 'above') expect(center).toBeLessThan(row.track.top + row.track.height / 2);
        else expect(center).toBeGreaterThan(row.track.top + row.track.height / 2);
      }
    }
    const glyphsAbove = row.markers.filter(({ lane }) => lane === 'above').flatMap(({ glyphs }) => glyphs);
    const glyphsBelow = row.markers.filter(({ lane }) => lane === 'below').flatMap(({ glyphs }) => glyphs);
    for (const above of glyphsAbove) {
      for (const below of glyphsBelow) expect(overlaps(above, below)).toBe(false);
    }
    for (const label of row.labels) {
      expect(label.visible).toBe(true);
      expect(label.text).not.toBe('');
      expectContained(label.box, geometry.card);
      expect(label.box.left).toBeGreaterThanOrEqual(row.track.left - 0.25);
      expect(label.box.right).toBeLessThanOrEqual(row.track.right + 0.25);
      const marker = row.markers.find(({ id }) => id === label.id);
      expect(marker).toBeDefined();
      expect(marker.lane).toBe(label.lane);
      const center = (label.box.left + label.box.right) / 2;
      const clampedAnchor = Math.max(row.track.left + label.box.width / 2,
        Math.min(row.track.right - label.box.width / 2, marker.anchor.left));
      expect(center).toBeCloseTo(clampedAnchor, 1);
      if (label.lane === 'above') expect(label.box.bottom).toBeLessThanOrEqual(row.track.top);
      else expect(label.box.top).toBeGreaterThanOrEqual(row.track.bottom);
      for (const clip of label.clips) {
        if (/hidden|clip|auto|scroll/.test(clip.x)) {
          expect(label.box.left).toBeGreaterThanOrEqual(clip.box.left - 0.25);
          expect(label.box.right).toBeLessThanOrEqual(clip.box.right + 0.25);
        }
        if (/hidden|clip|auto|scroll/.test(clip.y)) {
          expect(label.box.top).toBeGreaterThanOrEqual(clip.box.top - 0.25);
          expect(label.box.bottom).toBeLessThanOrEqual(clip.box.bottom + 0.25);
        }
      }
      const previous = geometry.rows[index - 1];
      const next = geometry.rows[index + 1];
      if (previous) {
        expect(label.box.top).toBeGreaterThanOrEqual(previous.row.bottom);
        for (const previousLabel of previous.labels) expect(overlaps(label.box, previousLabel.box)).toBe(false);
      }
      if (next) expect(label.box.bottom).toBeLessThanOrEqual(next.row.top);
    }
    for (const indicator of row.indicators) {
      expectContained(indicator.layer, row.track);
      expect(indicator.overflow).toBe('hidden');
      // Baseline/Needle intentionally clip at an endpoint; their visible stripe must remain.
      expect(Math.min(indicator.box.right, row.track.right) - Math.max(indicator.box.left, row.track.left)).toBeGreaterThan(0);
      expect(indicator.box.top).toBe(row.track.top);
      expect(indicator.box.bottom).toBe(row.track.bottom);
      expect(Number.isFinite(indicator.percent)).toBe(true);
    }
  });
}

test('24px rails support built-ins, both full lanes, hidden glyph capacity, and all generic shapes', async ({ page }) => {
  await renderRows(page, [
    { entity: 'sensor.builtins', ...builtins, baseline: { at: 30 } },
    {
      entity: 'sensor.mixed', ...builtins, bar: { needle: { show: true } },
      markers: [
        { at: 15, lane: 'above', shape: 'triangle', label: textLabel('A') },
        { at: 35, lane: 'above', show_marker: false, label: textLabel('B') },
        { at: 55, lane: 'above', shape: 'pin', direction: 'outward', label: textLabel('C') },
        { at: 95, lane: 'above', label: textLabel('Overflow above') },
        { at: 65, lane: 'below', shape: 'arrow', label: textLabel('D') },
        { at: 85, lane: 'below', shape: 'chevron', direction: 'outward', label: textLabel('E') },
        { at: 95, lane: 'below', label: textLabel('Overflow below') },
      ],
    },
    {
      entity: 'sensor.generic',
      markers: ['circle', 'diamond', 'triangle', 'arrow', 'pin', 'chevron', 'triangle', 'circle']
        .map((shape, index) => ({ at: [5, 35, 65, 95][index % 4], lane: index < 4 ? 'above' : 'below', shape, label: valueLabel })),
    },
  ]);
  const geometry = await readGeometry(page);
  expectSafeRails(geometry);
  const [builtInRow, mixed, generic] = geometry.rows;
  expect(builtInRow.markers.map(({ id, lane, percent }) => [id, lane, percent])).toEqual([
    ['peak', 'above', 75], ['target', 'below', 45], ['floor', 'below', 15],
  ]);
  expect(builtInRow.labels).toHaveLength(3);
  expect(mixed.markers.filter(({ lane }) => lane === 'above')).toHaveLength(4);
  expect(mixed.markers.filter(({ lane }) => lane === 'below')).toHaveLength(4);
  expect(mixed.labels).toHaveLength(8);
  expect(mixed.markers.filter(({ id }) => id.startsWith('generic')).map(({ id, lane }) => [id, lane])).toEqual([
    ['generic-0', 'above'], ['generic-1', 'above'], ['generic-2', 'above'], ['generic-4', 'below'], ['generic-5', 'below'],
  ]);
  expect(mixed.labels.find(({ id }) => id === 'generic-1').text).toBe('B');
  expect(generic.markers).toHaveLength(8);
  expect(generic.markers.map(({ shape }) => shape)).toEqual(['circle', 'diamond', 'triangle', 'arrow', 'pin', 'chevron', 'triangle', 'circle']);
  expect(generic.labels).toHaveLength(8);
  expect(builtInRow.indicators.map(({ className }) => className)).toEqual(['baseline-indicator']);
  expect(mixed.indicators.map(({ className }) => className)).toEqual(['needle-marker']);
});

test('24px opposing inward markers at exactly 50% retain painted-glyph clearance', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    const entities = [
      {
        entity: 'sensor.aligned_pins',
        markers: ['above', 'below'].map((lane) => ({ at: 50, lane, shape: 'pin', direction: 'inward' })),
      },
      { entity: 'sensor.aligned_peak_target', peak: { enabled: true }, target: { at: 50 } },
      { entity: 'sensor.aligned_peak_floor', peak: { enabled: true }, floor: { enabled: true } },
    ];
    await window.__sbcpRenderCard({
      width: 720,
      config: {
        layout: { height: 24, label: { position: 'off' } },
        scale: { min: 0, max: 100 },
        bar: { animated: false },
        entities,
      },
      // Render extrema at 50 too; the pressure fixture's 15 → 75 updates would separate them.
      states: Object.fromEntries(entities.map(({ entity }) => [entity, { state: '50', attributes: {} }])),
    });
  });
  const { rows } = await readGeometry(page);
  expect(rows).toHaveLength(3);
  const expected = [
    { shapes: ['pin', 'pin'], clearance: 0.75 },
    { shapes: ['triangle', 'diamond'], clearance: 1.75 },
    { shapes: ['triangle', 'triangle'], clearance: 2 },
  ];
  rows.forEach((row, index) => {
    expect(row.track.height).toBe(24);
    expect(row.markers).toHaveLength(2);
    const above = row.markers.find(({ lane }) => lane === 'above');
    const below = row.markers.find(({ lane }) => lane === 'below');
    expect([above.shape, below.shape]).toEqual(expected[index].shapes);
    for (const marker of [above, below]) {
      expect(marker.percent).toBe(50);
      expect(marker.direction).toBe('inward');
      expect(marker.anchor.left).toBe(row.track.left + row.track.width / 2);
      expect(marker.glyphs).toHaveLength(1);
      expectContained(marker.glyphs[0], row.track);
    }
    expect(above.anchor.left).toBe(below.anchor.left);
    const upper = above.glyphs[0];
    const lower = below.glyphs[0];
    // Measure the filled SVG path, not its 12px viewport; CSS triangles use the border box.
    // These shapes have no SVG stroke. Decorative blurred shadows have no hard glyph boundary.
    expect(upper.left).toBeLessThan(lower.right);
    expect(upper.right).toBeGreaterThan(lower.left);
    expect(upper.bottom).toBeLessThan(lower.top);
    expect(lower.top - upper.bottom).toBeCloseTo(expected[index].clearance, 5);
  });
});

// Shared glyph/capacity geometry is established above. These cases exercise the
// distinct surrounding content: Left inline/stacked, Above header, Inside overlay, Hero typography.
for (const position of ['left', 'above', 'inside', 'hero']) {
  test(`24px marker lanes remain usable with ${position} layout content`, async ({ page }) => {
    await renderRows(page, [
      {
        entity: 'sensor.pressure', ...builtins,
        markers: [
          { at: 90, lane: 'above', shape: 'pin', label: textLabel('High') },
          { at: 65, lane: 'below', shape: 'circle', show_marker: false, label: textLabel('Ref') },
        ],
      },
      { entity: 'sensor.neighbor', ...builtins },
    ], { position });
    for (const width of [720, 320]) {
      await page.locator('#mount').evaluate((mount, width) => { mount.style.width = `${width}px`; }, width);
      await expect.poll(async () => (await readGeometry(page)).card.width).toBe(width);
      // Wait for the card's scheduled density/label positioning passes after ResizeObserver.
      await expect.poll(async () => {
        const geometry = await readGeometry(page);
        return geometry.rows.every((row) => row.labels.every((label) => {
          const marker = row.markers.find(({ id }) => id === label.id);
          const center = (label.box.left + label.box.right) / 2;
          return Math.abs(center - Math.max(row.track.left + label.box.width / 2,
            Math.min(row.track.right - label.box.width / 2, marker.anchor.left))) < 0.1;
        }));
      }).toBe(true);
      const geometry = await readGeometry(page);
      expectSafeRails(geometry);
      for (const row of geometry.rows) {
        expect(row.values).toHaveLength(1);
        expect(row.values[0]).toContain('50');
        if (position === 'left') expect(row.topValueActive).toBe(width === 320 ? 'true' : 'false');
        for (const content of row.contents) {
          expectContained(content.box, geometry.card);
          if (content.inside) expectContained(content.box, row.track);
          // Hero line boxes include font descent space overlapping the label band;
          // the snapshot checks painted typography instead of treating that box as ink.
          if (position !== 'hero') {
            for (const label of row.labels) expect(overlaps(label.box, content.box)).toBe(false);
          }
        }
        if (position === 'above' || position === 'hero') expect(row.row.height).toBeGreaterThan(24);
        if (position === 'hero') expect(row.hero.bottom).toBeLessThan(row.track.top);
      }
      expect(geometry.rows[0].labels).toHaveLength(5);
    }
    if (position === 'inside' || position === 'hero') {
      await expect(page.locator('#mount')).toHaveScreenshot(`minimum-height-${position}.png`);
    }
  });
}

test('24px Needle endpoint clipping preserves a visible full-height stripe', async ({ page }) => {
  await renderRows(page, [{ entity: 'sensor.needle', bar: { needle: { show: true } } }]);
  for (const value of [0, 100]) {
    await page.locator('sensor-bar-card-plus').evaluate((card, value) => {
      card.hass = { states: { 'sensor.needle': { state: String(value), attributes: { unit_of_measurement: 'W' } } } };
    }, value);
    const geometry = await readGeometry(page);
    expectSafeRails(geometry);
    const needle = geometry.rows[0].indicators[0];
    expect(needle.percent).toBe(value);
    if (value === 0) {
      expect(needle.box.left).toBeLessThan(geometry.rows[0].track.left);
      expect(needle.box.right - geometry.rows[0].track.left).toBeCloseTo(needle.box.width / 2, 1);
    } else expect(needle.box.right).toBe(geometry.rows[0].track.right);
  }
});
