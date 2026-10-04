const { test, expect } = require('@playwright/test');

const variants = [
  { id: 'short', name: 'Power', value: '7.2', unit: 'kW' },
  { id: 'name', name: 'Solar Production South Roof and Garage Auxiliary Supply', value: '7.2', unit: 'kW' },
  { id: 'number', name: 'Power', value: '-1234567890123.45', unit: 'kW' },
  { id: 'unit', name: 'Power', value: '7.2', unit: 'kilowatt-hours equivalent per household' },
  { id: 'combined', name: 'Solar Production South Roof and Garage Auxiliary Supply', value: '-1234567890123.45', unit: 'kilowatt-hours equivalent per household' },
  { id: 'missing', name: 'Power', value: '7.2', unit: 'kW', missingIcon: true },
  { id: 'disabled', name: 'Power', value: '7.2', unit: 'kW', icon: false },
];

async function render(page, mode, rows = variants) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ mode, rows }) => {
    const entities = rows.flatMap((v) => [false, true].map((explicit) => ({
      entity: `sensor.${v.id}_${explicit}`, name: v.name,
      ...(v.icon === false ? { icon: false } : {}),
      ...(explicit ? { layout: { height: 24 } } : {}),
    })));
    const states = Object.fromEntries(rows.flatMap((v) => [false, true].map((explicit) => [
      `sensor.${v.id}_${explicit}`,
      { state: v.value, attributes: { unit_of_measurement: v.unit, ...(v.missingIcon ? {} : { icon: 'mdi:flash' }) } },
    ])));
    await window.__sbcpRenderCard({ width: 720, config: {
      layout: { label: { position: mode } }, formatting: { decimal: 2 },
      scale: { min: -2000000000000, max: 2000000000000 }, bar: { animated: false }, entities,
    }, states });
    // The harness's HA icon stub has no painted content; use a fixed-size SVG.
    document.querySelector('sensor-bar-card-plus').shadowRoot.querySelectorAll('ha-icon').forEach((icon) => {
      icon.style.cssText = 'display:block;width:20px;height:20px';
      icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M12 0 2 12h7l-1 8 10-12h-7z"/></svg>';
    });
  }, { mode, rows });
}

async function measure(page, width) {
  return page.locator('sensor-bar-card-plus').evaluate(async (card, width) => {
    if (width !== undefined) document.querySelector('#mount').style.width = `${width}px`;
    // Allow ResizeObserver and the coalesced two-stage layout pass to complete.
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
    const box = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const visible = (node) => !!node && getComputedStyle(node).display !== 'none'
      && getComputedStyle(node).visibility !== 'hidden' && node.getBoundingClientRect().width > 0;
    return [...card.shadowRoot.querySelectorAll('.row')].map((row) => {
      const main = row.querySelector('.main-line');
      const track = row.querySelector('.bar-track');
      const name = row.querySelector('.above-bar-label-name,.inside-name,.label-left-text');
      const topValue = row.querySelector('.row-stack').dataset.topValue === 'true';
      const value = topValue ? row.querySelector('.top-right-value')
        : row.querySelector('.above-bar-label-value,.inside-value,.value-right,.hero-value');
      const number = value.querySelector('.inside-number,.value-right-number');
      const unit = value.querySelector('.inside-unit,.unit');
      const icon = row.querySelector('.icon-wrap');
      const inner = row.querySelector('.bar-inner-label');
      return {
        entity: row.dataset.entity, row: box(row), main: box(main), track: box(track),
        density: main.dataset.rowDensity, explicit: row.dataset.heightExplicit === 'true',
        name: visible(name) ? box(name) : null, value: visible(value) ? box(value) : null,
        number: visible(number) ? box(number) : null,
        numberClipped: visible(number) && number.scrollWidth > number.clientWidth + 1,
        text: number.textContent, unit: visible(unit), icon: visible(icon),
        unitClipped: visible(unit) && unit.scrollWidth > unit.clientWidth + 1,
        insideFullWidth: inner ? card._measureInsideValueMarkupWidth(value,
          decodeURIComponent(value.dataset.display), decodeURIComponent(value.dataset.unit), false) : null,
        insidePadding: inner ? parseFloat(getComputedStyle(inner).paddingLeft)
          + parseFloat(getComputedStyle(inner).paddingRight) : null,
        iconSpace: icon ? card._getLeftModeIconWidth(icon, main) + card._getLeftModeGap(main) : 0,
        iconName: icon?.querySelector('ha-icon')?.getAttribute('icon'),
        insideDensity: row.querySelector('.bar-inner-label')?.dataset.insideDensity,
        topValue, minimumRail: card._getLeftModeBarMinWidth(main),
        heroFit: row.querySelector('.hero-line')?.dataset.heroValueFit,
        fontSize: parseFloat(getComputedStyle(value).fontSize),
        flags: { ...value.dataset },
      };
    });
  }, width);
}

for (const mode of ['above', 'inside', 'off']) {
  test(`${mode} adversarial rows stay contained across density boundaries and recover`, async ({ page }) => {
    await render(page, mode);
    const initial = await measure(page, 720);
    // Card thresholds and row thresholds (card width minus 40px), ±1px.
    const widths = [361, 360, 359, 341, 340, 339, 286, 285, 284, 281, 280, 279,
      231, 230, 229, 221, 220, 219, 191, 190, 189, 181, 180, 179, 160, 140, 120, 100];
    for (const width of [...widths, ...widths.slice().reverse(), 720]) {
      const rows = await measure(page, width);
      for (const row of rows) {
        const context = `${mode} ${width}px ${row.entity}`;
        expect(row.track.width, context).toBeGreaterThan(0);
        expect(row.track.left, context).toBeGreaterThanOrEqual(row.main.left - 0.25);
        expect(row.track.right, context).toBeLessThanOrEqual(row.main.right + 0.25);
        expect(row.track.height, context).toBe(row.explicit ? 24
          : row.density === 'compressed' ? 24 : row.density === 'dense' ? 28 : 38);
        if (row.value) {
          expect(row.value.right, context).toBeLessThanOrEqual(row.main.right + 0.25);
          expect(row.value.left, context).toBeGreaterThanOrEqual(row.main.left - 0.25);
        }
        if (mode === 'inside' && row.name && row.value) {
          expect(row.name.right, context).toBeLessThanOrEqual(row.value.left + 0.25);
          expect(row.numberClipped, context).toBe(false);
        }
        if (row.entity.startsWith('sensor.disabled')) expect(row.icon, context).toBe(false);
        if (row.entity.startsWith('sensor.missing')) expect(row.iconName, context).toBe('mdi:eye');
        if (mode === 'off') expect(row.name, context).toBeNull();
        if (!row.entity.includes('number') && !row.entity.includes('combined') && width >= 120) {
          expect(row.number, context).not.toBeNull();
          expect(row.numberClipped, context).toBe(false);
        }
      }
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].row.top).toBeGreaterThanOrEqual(rows[i - 1].row.bottom);
      }
    }
    expect(await measure(page, 720)).toEqual(initial);
  });
}

test('Above fitting preserves a wide unit and is independent of previous hidden name/unit', async ({ page }) => {
  await render(page, 'above');
  const wide = await measure(page, 720);
  for (const row of wide.filter((row) => /short|missing|disabled/.test(row.entity))) {
    expect(row.name).not.toBeNull();
    expect(row.unit).toBe(true);
  }
  await measure(page, 140);
  const recovered = await measure(page, 720);
  // Re-running responsive sizing at identical geometry must be idempotent.
  await page.locator('sensor-bar-card-plus').evaluate((card) => card._runPostLayoutPasses());
  expect(await measure(page)).toEqual(recovered);
  expect(recovered).toEqual(wide);
  for (const width of [320, 240, 200, 140]) {
    const rows = await measure(page, width);
    await page.locator('sensor-bar-card-plus').evaluate((card) => card._runPostLayoutPasses());
    expect(await measure(page)).toEqual(rows);
  }
});

test('Inside keeps a fully fitting long reading before name and matches its expanded value budget', async ({ page }) => {
  await render(page, 'inside', variants.filter((v) => v.id === 'number' || v.id === 'name'));
  for (const width of [420, 360, 340, 280, 240, 220, 240, 360, 720]) {
    for (const row of await measure(page, width)) {
      if (row.entity.includes('number') && width >= 240) {
        expect(row.number, `${width}px`).not.toBeNull();
        expect(row.numberClipped, `${width}px`).toBe(false);
      }
      if (row.entity.includes('name')) expect(row.numberClipped, `${width}px`).toBe(false);
    }
  }
});

test('Inside content density changes at its measured value-relative boundaries', async ({ page }) => {
  await render(page, 'inside', [{ id: 'relative', name: 'Power', value: '7.2',
    unit: 'kilowatt-hours equivalent per household with calibration correction', icon: false }]);
  const natural = await page.locator('sensor-bar-card-plus').evaluate((card) => {
    const value = card.shadowRoot.querySelector('.inside-value');
    return card._measureInsideValueMarkupWidth(value, '7.20', decodeURIComponent(value.dataset.unit), false);
  });
  for (const [extra, before, after] of [
    [128, 'compact', 'normal'], [92, 'tight', 'compact'],
    [56, 'dense', 'tight'], [12, 'compressed', 'dense'],
  ]) {
    // Keep this content-relative boundary above card/main-row density changes.
    expect(natural + extra + 40).toBeGreaterThan(360);
    for (const [delta, expected] of [[-1, before], [0, after], [1, after]]) {
      const rows = await measure(page, natural + extra + 40 + delta);
      for (const row of rows) expect(row.insideDensity).toBe(expected);
    }
  }
});

for (const mode of ['above', 'inside', 'off', 'left', 'hero']) {
  test(`${mode} 24px adjacent rows preserve marker-label reservations`, async ({ page }) => {
    await render(page, mode, variants.filter((v) => ['name', 'unit', 'disabled'].includes(v.id)));
    await page.locator('sensor-bar-card-plus').evaluate((card) => {
      card.setConfig({ ...card._config, layout: { height: 24, label: { position: card._config.entities[0].layout.label.position } },
        bar: { animated: false }, entities: card._config.entities.map((entity) => ({
          entity: entity.entity, name: entity.name, icon: entity.icon,
          markers: [
            { at: '25%', lane: 'above', label: { show: true, text: 'Reference above', show_value: false } },
            { at: '75%', lane: 'below', label: { show: true, text: 'Reference below', show_value: false } },
          ],
        })),
      });
      card.hass = { states: { ...card._hass.states } };
    });
    for (const width of [720, 320, 180, 140, 180, 720]) {
      await measure(page, width);
      const rows = await page.locator('sensor-bar-card-plus').evaluate((card) => {
        const visible = (n) => getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0;
        const box = (n) => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
        return [...card.shadowRoot.querySelectorAll('.row')].map((row) => ({
          trackHeight: row.querySelector('.bar-track').getBoundingClientRect().height,
          track: box(row.querySelector('.bar-track')),
          heroHeader: row.querySelector('.hero-header') ? box(row.querySelector('.hero-header')) : null,
          heroMargin: row.querySelector('.hero-header')
            ? parseFloat(getComputedStyle(row.querySelector('.hero-header')).marginBottom) : null,
          labels: [...row.querySelectorAll('.generic-value-label')].filter(visible).map(box),
          contents: [...row.querySelectorAll('.above-bar-label-name,.above-bar-label-value,.inside-name,.inside-value,.value-right,.icon-wrap,.label-left,.top-right-value,.hero-header')].filter(visible).map(box),
        }));
      });
      const overlaps = (a, b) => a.left < b.right - 0.25 && a.right > b.left + 0.25
        && a.top < b.bottom - 0.25 && a.bottom > b.top + 0.25;
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].trackHeight).toBe(24);
        expect(rows[i].labels).toHaveLength(2);
        if (mode === 'hero') {
          // Hero uses its existing header margin rather than a separate above-label lane.
          expect(rows[i].track.top - rows[i].heroHeader.bottom).toBeCloseTo(2 + rows[i].heroMargin, 1);
          expect(rows[i].labels[0].bottom).toBeCloseTo(rows[i].track.top - 1, 1);
          expect(rows[i].labels[1].top).toBeCloseTo(rows[i].track.bottom + 2, 1);
        }
        for (const label of rows[i].labels) {
          for (const content of [...(mode === 'hero' ? [] : rows[i].contents), ...(rows[i + 1]?.contents ?? [])]) {
            expect(overlaps(label, content), `${mode} ${width}px`).toBe(false);
          }
          for (const next of rows[i + 1]?.labels ?? []) expect(overlaps(label, next)).toBe(false);
        }
      }
    }
  });
}

test('Off releases hidden long-unit space back to the rail', async ({ page }) => {
  await render(page, 'off', variants.filter((v) => v.id === 'short' || v.id === 'unit'));
  for (const width of [320, 260, 180]) {
    const rows = await measure(page, width);
    for (const explicit of [false, true]) {
      const normal = rows.find((row) => row.entity === `sensor.short_${explicit}`);
      const long = rows.find((row) => row.entity === `sensor.unit_${explicit}`);
      expect(long.unit).toBe(false);
      expect(long.numberClipped).toBe(false);
      expect(long.track.width, `${width}px`).toBeGreaterThanOrEqual(normal.track.width);
    }
  }
});

test('Inside compacts pill padding before hiding a number that fits the rail interior', async ({ page }) => {
  await render(page, 'inside', [{ id: 'padding', name: 'Power', value: '123456789012345678901234.56',
    unit: 'kilowatt-hours equivalent per household' }]);
  await measure(page, 260);
  const width = await page.locator('sensor-bar-card-plus').evaluate((card) => {
    const value = card.shadowRoot.querySelector('.inside-value');
    const inner = value.closest('.bar-inner-label');
    value.dataset.valueFit = 'normal';
    const numberWidth = card._measureInsideValueMarkupWidth(value, decodeURIComponent(value.dataset.display),
      decodeURIComponent(value.dataset.unit), true);
    return numberWidth + parseFloat(getComputedStyle(inner).paddingLeft)
      + parseFloat(getComputedStyle(inner).paddingRight) + 40 - 1;
  });
  // Keep the same card font tier so only the padding budget changes.
  expect(width).toBeGreaterThan(220);
  expect(width).toBeLessThan(280);
  for (const next of [width, 260, width, 720]) {
    for (const row of await measure(page, next)) {
      expect(row.number).not.toBeNull();
      expect(row.numberClipped).toBe(false);
      if (next === width) {
        expect(row.flags.valueFit).toBe('compact');
        expect(row.icon).toBe(false);
        expect(row.name).toBeNull();
      }
    }
  }
});

test('Above sacrifices competing name before a complete reading across shrink and grow', async ({ page }) => {
  await render(page, 'above', variants.filter((v) => v.id === 'number'));
  for (const width of [320, 280, 260, 220, 260, 280, 320, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.numberClipped, `${width}px`).toBe(false);
      expect(row.icon, `${width}px independent lower icon`).toBe(true);
      if (row.name) expect(row.name.right).toBeLessThanOrEqual(row.value.left + 0.25);
    }
  }
});

test('Inside sacrifices icon and name before a complete reading including padding', async ({ page }) => {
  await render(page, 'inside', [{ id: 'priority', name: 'Useful identifying sensor name', value: '7.2',
    unit: 'kilowatt-hours equivalent' }]);
  for (const width of [340, 310, 300, 290, 250, 240, 230, 240, 250, 290, 310, 340, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.number).not.toBeNull();
      expect(row.numberClipped).toBe(false);
      expect(row.insideFullWidth).toBeLessThanOrEqual(row.track.width - row.insidePadding + 0.25);
      if (width === 240) {
        expect(row.icon).toBe(false);
        expect(row.name).toBeNull();
        expect(row.insideFullWidth).toBeGreaterThan(row.main.width - row.iconSpace - row.insidePadding);
      }
      if (row.name) expect(row.name.right).toBeLessThanOrEqual(row.value.left + 0.25);
    }
  }
});

test('Inside exhausts lower-priority content before losing a physically fitting number', async ({ page }) => {
  await render(page, 'inside', variants.filter((v) => v.id === 'number'));
  for (const width of [320, 240, 220, 210, 200, 210, 220, 240, 320, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.number, `${width}px`).not.toBeNull();
      expect(row.numberClipped, `${width}px`).toBe(false);
      if (row.name) expect(row.name.right).toBeLessThanOrEqual(row.value.left + 0.25);
    }
  }
});

test('Off gives icon space to the complete reading while preserving the minimum rail', async ({ page }) => {
  await render(page, 'off', [{ id: 'priority', name: 'Power', value: '12345.67', unit: 'kWh/m²/year' }]);
  for (const width of [320, 260, 250, 240, 250, 260, 320, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.numberClipped).toBe(false);
      expect(row.track.width).toBeGreaterThanOrEqual(row.minimumRail - 0.25);
      if (width === 250 || width === 240) expect(row.icon).toBe(false);
    }
  }
});

test('Hero tries existing smaller complete-reading typography before removing unit', async ({ page }) => {
  await render(page, 'hero', [{ id: 'priority', name: 'Power', value: '12345.67', unit: 'kWh/m²/year' }]);
  for (const width of [720, 420, 380, 320, 380, 420, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.number).not.toBeNull();
      expect(row.numberClipped).toBe(false);
      expect(row.icon).toBe(false);
      if (width === 420) {
        expect(row.heroFit).toBe('tight');
        expect(row.fontSize).toBeLessThan(30);
      }
      if (row.name) expect(row.name.right).toBeLessThanOrEqual(row.value.left + 0.25);
    }
  }
});

test('Left retains its independent top reading across shrink and grow', async ({ page }) => {
  await render(page, 'left', [{ id: 'priority', name: 'Power', value: '12345.67', unit: 'kWh/m²/year' }]);
  for (const width of [720, 420, 320, 240, 200, 240, 320, 420, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.numberClipped).toBe(false);
      if (width <= 420) expect(row.topValue).toBe(true);
    }
  }
});

test('Narrower typography can restore Hero name without degrading the reading', async ({ page }) => {
  await render(page, 'hero', [{ id: 'restore', name: 'Power', value: '12.3', unit: 'kWh/m' }]);
  const widths = [340, 320, 312, 311, 310, 305, 310, 311, 312, 320, 340, 720];
  for (const width of widths) {
    for (const row of await measure(page, width)) {
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.numberClipped).toBe(false);
      if (width === 340) expect(row.name).toBeNull();
      if (width === 320) expect(row.name).not.toBeNull();
      if (row.name) expect(row.name.right).toBeLessThanOrEqual(row.value.left + 0.25);
    }
  }
});

test('Left sacrifices icon when it can preserve useful identification beside the rail', async ({ page }) => {
  await render(page, 'left', [{ id: 'identify', name: 'X', value: '7.2', unit: 'kW' }]);
  for (const width of [160, 120, 115, 120, 160, 720]) {
    for (const row of await measure(page, width)) {
      expect(row.name, `${width}px`).not.toBeNull();
      expect(row.unit, `${width}px`).toBe(true);
      expect(row.unitClipped, `${width}px`).toBe(false);
      expect(row.numberClipped).toBe(false);
      if (width === 115) {
        expect(row.icon).toBe(false);
        expect(row.topValue).toBe(true);
      }
    }
  }
});

const leftConvergenceRows = [
  { id: 'min', name: 'Min Helper', value: '0', unit: 'W' },
  { id: 'baseline', name: 'Baseline Helper', value: '0', unit: 'W' },
  { id: 'max', name: 'Max Helper', value: '100', unit: 'W' },
  { id: 'clamp_left', name: 'Clamp Left', value: '-42.7', unit: 'W' },
  { id: 'clamp_right', name: 'Clamp Right', value: '42.7', unit: 'W' },
  { id: 'long', name: 'Longer Production Auxiliary Supply', value: '1234567.8', unit: 'W' },
  { id: 'reading', name: 'Power', value: '12345.67', unit: 'kWh/m²/year' },
  { id: 'identify', name: 'X', value: '7.2', unit: 'kW' },
];

async function renderLeftConvergence(page, width) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ rows, width }) => {
    await window.__sbcpRenderCard({ width, config: {
      layout: { label: { position: 'left' } }, formatting: { decimal: 1 },
      scale: { min: 0, max: 100 }, bar: { animated: false },
      entities: rows.flatMap((v) => [false, true].map((explicit) => ({
        entity: `sensor.${v.id}_${explicit}`, name: v.name,
        formatting: { decimal: ['min', 'baseline', 'max'].includes(v.id) ? 0 : v.id === 'reading' ? 2 : 1 },
        ...(explicit ? { layout: { height: 24 } } : {}),
        markers: ['above', 'below'].map((lane) => ({ at: 50, lane, shape: 'pin',
          label: { show: true, text: lane, show_value: false, show_unit: false } })),
      }))),
    }, states: Object.fromEntries(rows.flatMap((v) => [false, true].map((explicit) => [
      `sensor.${v.id}_${explicit}`,
      { state: v.value, attributes: { unit_of_measurement: v.unit, icon: 'mdi:flash' } },
    ]))) });
  }, { rows: leftConvergenceRows, width });
}

async function settleLeftConvergence(page, width) {
  return page.locator('sensor-bar-card-plus').evaluate(async (card, width) => {
    if (width !== undefined) document.querySelector('#mount').style.width = `${width}px`;
    const visible = (node) => !!node && getComputedStyle(node).display !== 'none'
      && getComputedStyle(node).visibility !== 'hidden' && node.getBoundingClientRect().width > 0;
    const box = (node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const read = () => [...card.shadowRoot.querySelectorAll('.row')].map((row) => {
      const main = row.querySelector('.main-line');
      const track = row.querySelector('.bar-track');
      const top = row.querySelector('.row-stack').dataset.topValue === 'true';
      const value = row.querySelector(top ? '.top-right-value' : '.value-right');
      const name = row.querySelector('.label-left-text');
      const number = value.querySelector('.value-right-number');
      const unit = value.querySelector('.unit');
      const budget = card._estimateLeftModeWidthBudget(row);
      return {
        entity: row.dataset.entity, explicit: row.dataset.heightExplicit === 'true',
        top, name: visible(name), truncated: visible(name) && name.scrollWidth > name.clientWidth + 1,
        icon: visible(row.querySelector('.icon-wrap')), unit: visible(unit),
        number: visible(number), numberClipped: number.scrollWidth > number.clientWidth + 1,
        unitClipped: visible(unit) && unit.scrollWidth > unit.clientWidth + 1,
        text: number.textContent, main: box(main), rail: box(track), value: box(value),
        density: main.dataset.leftDensity,
        flags: { ...row.querySelector('.row-stack').dataset, ...main.dataset,
          label: { ...row.querySelector('.label-left').dataset } },
        budget: { label: budget.labelWidth, icon: budget.iconWidth, value: budget.valueWidth, gap: budget.gap },
        minimumRail: budget.barMinWidth,
      };
    });
    // Stable geometry alone can precede an outstanding nested rAF. Require six
    // consecutive stable frames AND an idle coalesced density scheduler.
    let previous = '', stable = 0;
    for (let frame = 0; frame < 120; frame++) {
      await new Promise(requestAnimationFrame);
      const rows = read();
      const signature = JSON.stringify(rows);
      stable = signature === previous && !card._densityPassScheduled && !card._densityPassDirty ? stable + 1 : 0;
      previous = signature;
      if (stable >= 6) return rows;
    }
    throw new Error('Left responsive geometry did not settle');
  }, width);
}

for (const finalWidth of [115, 360, 450, 460, 470, 720]) {
  test(`Left converges at ${finalWidth}px across resize histories and speeds`, async ({ page }) => {
    await renderLeftConvergence(page, finalWidth);
    const direct = await settleLeftConvergence(page);
    const paths = [
      [720, finalWidth], [360, finalWidth], [720, 300, finalWidth], [360, 720, finalWidth],
      [720, 430, 480, 430, 480, 430, finalWidth],
    ];
    for (const widths of paths) {
      await renderLeftConvergence(page, widths[0]);
      await settleLeftConvergence(page);
      for (const width of widths.slice(1)) await settleLeftConvergence(page, width);
      expect(await settleLeftConvergence(page), widths.join(' → ')).toEqual(direct);
    }
    for (const coalesced of [false, true]) {
      await renderLeftConvergence(page, 720);
      await settleLeftConvergence(page);
      await page.evaluate(async ({ finalWidth, coalesced }) => {
        for (const width of [360, 480, 430, 720, 360, finalWidth]) {
          document.querySelector('#mount').style.width = `${width}px`;
          if (!coalesced) await new Promise(requestAnimationFrame);
        }
      }, { finalWidth, coalesced });
      expect(await settleLeftConvergence(page), `rapid, coalesced=${coalesced}`).toEqual(direct);
    }
    for (const row of direct) {
      expect(row.rail.height).toBe(row.explicit ? 24
        : row.density === 'compressed' ? 24 : row.density === 'dense' ? 28 : 38);
      expect(row.rail.width).toBeGreaterThanOrEqual(row.minimumRail);
      expect(row.rail.right).toBeLessThanOrEqual(row.main.right + 0.25);
      if (finalWidth >= 360 || row.entity.includes('identify')) {
        expect(row.unit).toBe(true);
        expect(row.number).toBe(true);
        expect(row.numberClipped).toBe(false);
        expect(row.unitClipped).toBe(false);
      }
      if (finalWidth === 360 && !row.entity.includes('identify')) expect(row.top).toBe(true);
      if (finalWidth === 720) expect(row.top).toBe(false);
      if (finalWidth === 115 && row.entity.includes('identify')) {
        expect(row.name).toBe(true);
        expect(row.icon).toBe(false);
        expect(row.top).toBe(true);
      }
    }
    if ([450, 460, 470].includes(finalWidth)) {
      const helpers = direct.filter((row) => /min_|baseline_|max_|clamp_/.test(row.entity));
      expect(new Set(helpers.map((row) => row.top)).size).toBe(1);
      expect(helpers[0].top).toBe(finalWidth < 460);
      // Equivalent geometry with deliberately conflicting prior placement must
      // also converge; this isolates history from all content measurements.
      await page.locator('sensor-bar-card-plus').evaluate((card) => {
        [...card.shadowRoot.querySelectorAll('.row')].forEach((row, index) => {
          card._leftModeResponsiveHistory.set(row.dataset.entity, index % 2 === 0);
        });
        card._runPostLayoutPasses();
      });
      expect(await settleLeftConvergence(page)).toEqual(direct);
    }
  });
}
