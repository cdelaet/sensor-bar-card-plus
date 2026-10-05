const { test, expect } = require('@playwright/test');

const ids = ['sensor.a', 'sensor.b', 'sensor.c'];
const configRow = (entity, index) => ({ entity, name: `Row ${index}`, target: { at: 10 + index }, markers: [{ at: 40 + index }], peak: { enabled: true }, floor: { enabled: true } });
const state = (index, value = (index + 1) * 10) => ({ state: String(value), attributes: { friendly_name: `Sensor ${index}`, unit_of_measurement: ['W', 'kWh', '°C'][index], icon: ['mdi:flash', 'mdi:home', 'mdi:thermometer'][index] } });
test('a missing first entity never puts B reading and markers into C identity', async ({ page }) => {
  await render(page, ids.map(configRow), { [ids[1]]: state(1), [ids[2]]: state(2) });
  const c = page.locator('sensor-bar-card-plus .row[data-entity="sensor.c"]');
  await expect(c.locator('.above-bar-label-value')).toContainText('30');
  await expect(c.locator('.above-bar-label-value')).toContainText('°C');
  expect(await c.locator('.peak-marker').evaluate(n => n.style.left)).toBe('30%');
  expect(await c.locator('.floor-marker').evaluate(n => n.style.left)).toBe('30%');
  expect(await c.locator('.generic-marker').evaluate(n => n.style.left)).toBe('42%');
  expect(await c.locator('.target-marker').evaluate(n => n.style.left)).toBe('12%');
});
async function render(page, rows, states) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async ({ rows, states }) => {
    await window.__sbcpRenderCard({ width: 720, config: { layout: { label: { position: 'above' } }, scale: { min: 0, max: 100 }, bar: { animated: false }, entities: rows }, states });
    document.querySelector('sensor-bar-card-plus').addEventListener('hass-more-info', e => { window.__clickedEntity = e.detail.entityId; });
  }, { rows, states });
}
async function update(page, states) {
  await page.evaluate(states => { document.querySelector('sensor-bar-card-plus').hass = { states }; }, states);
}
async function checkRows(page, rows, states) {
  const actual = await page.locator('sensor-bar-card-plus .rows > .row').evaluateAll(nodes => nodes.map(node => ({
    entity: node.dataset.entity, index: node.dataset.rowIndex,
    name: node.querySelector('.above-bar-label-name')?.textContent ?? node.querySelector('.above-bar-label')?.textContent,
    value: node.querySelector('.above-bar-label-value')?.textContent,
    icon: node.querySelector('ha-icon')?.getAttribute('icon'),
    target: node.querySelector('.target-marker')?.style.left,
    generic: node.querySelector('.generic-marker')?.style.left,
    peak: node.querySelector('.peak-marker')?.style.left,
    floor: node.querySelector('.floor-marker')?.style.left,
    text: node.textContent,
  })));
  expect(actual).toHaveLength(rows.length);
  rows.forEach((row, index) => {
    const s = states[row.entity];
    if (!s) { expect(actual[index].text).toContain(`Entity not found: ${row.entity}`); }
    else {
      // Reading/marker assertions precede index assertions to expose wrong-row patching directly.
      expect(actual[index].entity).toBe(row.entity);
      expect(actual[index].name).toContain(row.name);
      expect(actual[index].value).toContain(s.state);
      if (Number.isFinite(Number(s.state))) expect(actual[index].value).toContain(s.attributes.unit_of_measurement);
      else expect(actual[index].value).not.toContain(s.attributes.unit_of_measurement);
      expect(actual[index].icon).toBe(s.attributes.icon);
      expect(actual[index].target).toBe(`${row.target.at}%`);
      expect(actual[index].generic).toBe(`${row.markers[0].at}%`);
      if (Number.isFinite(Number(s.state))) {
        expect(actual[index].peak).toBeTruthy(); expect(actual[index].floor).toBeTruthy();
      }
    }
    expect(actual[index].index).toBe(String(index));
  });
  for (let index = 0; index < rows.length; index++) if (states[rows[index].entity]) {
    await page.locator('sensor-bar-card-plus .rows > .row').nth(index).click();
    expect(await page.evaluate(() => window.__clickedEntity)).toBe(rows[index].entity);
  }
}
for (const missing of [[0], [1], [2], [0, 2], [0, 1, 2]]) {
  test(`missing indices ${missing} recover without mixing row content`, async ({ page }) => {
    const rows = ids.map(configRow), states = Object.fromEntries(ids.filter((_, i) => !missing.includes(i)).map(id => [id, state(ids.indexOf(id))]));
    await render(page, rows, states);
    await checkRows(page, rows, states);
    await update(page, Object.fromEntries(ids.map((id, i) => [id, state(i)])));
    await checkRows(page, rows, Object.fromEntries(ids.map((id, i) => [id, state(i)])));
  });
}
test('only missing row recovers through unavailable and unknown, then absent again', async ({ page }) => {
  const rows = [configRow(ids[0], 0)]; await render(page, rows, {});
  for (const value of ['unavailable', 'unknown', 50, null, 70]) {
    const states = value === null ? {} : { [ids[0]]: state(0, value) };
    await update(page, states); await checkRows(page, rows, states);
  }
});
test('missing row before duplicate primary rows preserves identity through reorder/add/remove', async ({ page }) => {
  let rows = [configRow(ids[0], 0), configRow(ids[1], 1), configRow(ids[1], 2)];
  let states = { [ids[1]]: state(1) }; await render(page, rows, states); await checkRows(page, rows, states);
  for (const next of [[rows[2], rows[0], rows[1]], [rows[0], configRow(ids[2], 3)], [configRow(ids[2], 4)]]) {
    rows = next;
    await page.evaluate(rows => { const card = document.querySelector('sensor-bar-card-plus'); card.setConfig({ layout: { label: { position: 'above' } }, bar: { animated: false }, entities: rows }); }, rows);
    await checkRows(page, rows, states);
    states = { ...states, [ids[2]]: state(2), [ids[0]]: state(0) }; await update(page, states); await checkRows(page, rows, states);
  }
});
test('presence reconstruction preserves normalized rows, extrema and dynamic Scale history', async ({ page }) => {
  await render(page, [configRow(ids[0], 0), configRow(ids[1], 1)], { [ids[0]]: state(0, 90), [ids[1]]: state(1, 20), 'sensor.min': { state: '0' }, 'sensor.max': { state: '200' } });
  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.setConfig({ scale: { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } }, bar: { animated: false }, entities: [{ entity: 'sensor.a', peak: { enabled: true }, floor: { enabled: true } }, { entity: 'sensor.b' }] });
    window.__ownedRows = card._config.entities; window.__ownedScales = card._rowScales;
  });
  await update(page, { [ids[0]]: state(0, 20), 'sensor.min': { state: '300' }, 'sensor.max': { state: '200' } });
  await update(page, { [ids[0]]: state(0, 70), [ids[1]]: state(1, 20), 'sensor.min': { state: '300' }, 'sensor.max': { state: '200' } });
  const result = await page.locator('sensor-bar-card-plus').evaluate(card => ({ same: card._config.entities === window.__ownedRows && card._rowScales === window.__ownedScales, scale: card._rowScales.get(card._config.entities[0]), peak: card.shadowRoot.querySelector('.peak-marker').style.left, floor: card.shadowRoot.querySelector('.floor-marker').style.left }));
  expect(result).toEqual({ same: true, scale: { min: 0, max: 200 }, peak: '45%', floor: '10%' });
});

test('ordinary updates preserve nodes and duplicate Scale caches remain independent through presence recovery', async ({ page }) => {
  const rows = [configRow(ids[0], 0), configRow(ids[1], 1), configRow(ids[1], 2)];
  const states = { [ids[0]]: state(0), [ids[1]]: state(1, 90), 'sensor.min': { state: '0' }, 'sensor.max': { state: '200' } };
  await render(page, rows, states);
  await page.evaluate(() => {
    const card = document.querySelector('sensor-bar-card-plus');
    const rows = card._config.entities.map((row, index) => ({ entity: row.entity, name: row.name, peak: { enabled: index === 1 }, floor: { enabled: index === 2 }, scale: index === 2 ? { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } } : { min: 0, max: 100 } }));
    card.setConfig({ bar: { animated: false }, entities: rows });
    window.__beforeNodes = [...card.shadowRoot.querySelectorAll('.row')];
  });
  await update(page, { ...states, [ids[1]]: state(1, 20) });
  expect(await page.locator('sensor-bar-card-plus').evaluate(card => [...card.shadowRoot.querySelectorAll('.row')].every((node, i) => node === window.__beforeNodes[i]))).toBe(true);
  await update(page, { [ids[1]]: state(1, 70), 'sensor.min': { state: '300' }, 'sensor.max': { state: '200' } });
  await update(page, { ...states, [ids[1]]: state(1, 70), 'sensor.min': { state: '300' } });
  expect(await page.locator('sensor-bar-card-plus').evaluate(card => ({
    scales: card._config.entities.slice(1).map(row => card._rowScales.get(row)),
    peaks: [...card.shadowRoot.querySelectorAll('.peak-marker')].filter(n => getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden').map(n => n.style.left),
    floors: [...card.shadowRoot.querySelectorAll('.floor-marker')].filter(n => getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden').map(n => n.style.left),
  }))).toEqual({ scales: [{ min: 0, max: 100 }, { min: 0, max: 200 }], peaks: ['90%'], floors: ['10%'] });
});
for (const transition of ['presence', 'configuration']) {
  test(`deferred layout work ignores replaced nodes after ${transition} change`, async ({ page }) => {
    await render(page, ids.map(configRow), Object.fromEntries(ids.map((id, i) => [id, state(i)])));
    const result = await page.locator('sensor-bar-card-plus').evaluate((card, transition) => {
      const originalRAF = window.requestAnimationFrame;
      const pending = [];
      const visited = [];
      const originalPosition = card._positionGenericMarkerLabels;
      window.requestAnimationFrame = callback => { pending.push(callback); return pending.length; };
      card._positionGenericMarkerLabels = function(row) { visited.push(row.isConnected); return originalPosition.call(this, row); };
      try {
        const oldNodes = [...card.shadowRoot.querySelectorAll('.row')];
        card._runPostLayoutPasses(oldNodes);
        // Outer work has already captured old nodes before the rebuild.
        pending.shift()();
        if (transition === 'presence') {
          const states = { ...card._hass.states };
          delete states['sensor.a'];
          card.hass = { states };
        } else card.setConfig({ entities: [{ entity: 'sensor.c' }] });
        for (let i = 0; pending.length && i < 30; i++) pending.shift()();
        return { oldDetached: oldNodes.every(row => !row.isConnected), visited, remaining: pending.length };
      } finally {
        window.requestAnimationFrame = originalRAF;
        card._positionGenericMarkerLabels = originalPosition;
      }
    }, transition);
    expect(result.oldDetached).toBe(true);
    expect(result.visited.length).toBeGreaterThan(0);
    expect(result.visited.every(Boolean)).toBe(true);
    expect(result.remaining).toBe(0);
  });
}

test('duplicate Left rows own hysteresis independently and keep it through reorder', async ({ page }) => {
  await render(page, [configRow(ids[0], 0)], { [ids[0]]: state(0) });
  const actual = await page.locator('sensor-bar-card-plus').evaluate(card => {
    const a = { entity: 'sensor.a', name: 'Long identifying name' };
    const b = { entity: 'sensor.a', name: 'Short' };
    card.setConfig({ entities: [a, b] });
    const rows = [...card.shadowRoot.querySelectorAll('.row')];
    card._applyLeftModeResponsiveState(rows[0], { topValue: false });
    card._applyLeftModeResponsiveState(rows[1], { topValue: true });
    const before = card._config.entities.map(row => card._leftModeResponsiveHistory.get(row));
    card.setConfig({ entities: [b, a] });
    return { before, after: card._config.entities.map(row => card._leftModeResponsiveHistory.get(row)) };
  });
  expect(actual).toEqual({ before: [false, true], after: [true, false] });
});
