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
      const name = row.querySelector('.above-bar-label-name,.inside-name');
      const value = row.querySelector('.above-bar-label-value,.inside-value,.value-right');
      const number = value.querySelector('.inside-number,.value-right-number');
      const unit = value.querySelector('.inside-unit,.unit');
      const icon = row.querySelector('.icon-wrap');
      return {
        entity: row.dataset.entity, row: box(row), main: box(main), track: box(track),
        density: main.dataset.rowDensity, explicit: row.dataset.heightExplicit === 'true',
        name: visible(name) ? box(name) : null, value: visible(value) ? box(value) : null,
        number: visible(number) ? box(number) : null,
        numberClipped: visible(number) && number.scrollWidth > number.clientWidth + 1,
        text: number.textContent, unit: visible(unit), icon: visible(icon),
        iconName: icon?.querySelector('ha-icon')?.getAttribute('icon'),
        insideDensity: row.querySelector('.bar-inner-label')?.dataset.insideDensity,
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

for (const mode of ['above', 'inside', 'off']) {
  test(`${mode} 24px adjacent rows keep layout content clear of external marker labels`, async ({ page }) => {
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
          labels: [...row.querySelectorAll('.generic-value-label')].filter(visible).map(box),
          contents: [...row.querySelectorAll('.above-bar-label-name,.above-bar-label-value,.inside-name,.inside-value,.value-right,.icon-wrap')].filter(visible).map(box),
        }));
      });
      const overlaps = (a, b) => a.left < b.right - 0.25 && a.right > b.left + 0.25
        && a.top < b.bottom - 0.25 && a.bottom > b.top + 0.25;
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].trackHeight).toBe(24);
        expect(rows[i].labels).toHaveLength(2);
        for (const label of rows[i].labels) {
          for (const content of [...rows[i].contents, ...(rows[i + 1]?.contents ?? [])]) {
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
