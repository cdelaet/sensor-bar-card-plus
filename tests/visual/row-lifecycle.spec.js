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

test('container-only resize works after repeated same-instance reconnects and presence recovery', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(() => {
    const NativeObserver = window.ResizeObserver;
    window.__activeCardObservers = new Set();
    window.__cardObserverCallbacks = new Map();
    window.ResizeObserver = class extends NativeObserver {
      constructor(callback) { super(callback); window.__cardObserverCallbacks.set(this, callback); }
      observe(target, options) { window.__activeCardObservers.add(this); super.observe(target, options); }
      disconnect() { window.__activeCardObservers.delete(this); super.disconnect(); }
    };
    window.__invokeRetiredObservers = () => {
      const card = window.__reconnectedCard;
      const original = card._applyCompactTier;
      let calls = 0;
      card._applyCompactTier = () => { calls++; };
      window.__cardObserverCallbacks.forEach((callback, observer) => {
        if (!window.__activeCardObservers.has(observer)) callback([]);
      });
      card._applyCompactTier = original;
      return calls;
    };
  });
  const states = { [ids[0]]: state(0, 90), 'sensor.min': { state: '0' }, 'sensor.max': { state: '200' } };
  await page.evaluate(async states => {
    window.__reconnectedCard = await window.__sbcpRenderCard({ width: 720, config: {
      layout: { label: { position: 'left' } }, bar: { animated: false },
      scale: { min: { entity: 'sensor.min' }, max: { entity: 'sensor.max' } },
      entities: [{ entity: 'sensor.a', name: 'Peak owner', peak: { enabled: true } },
        { entity: 'sensor.a', name: 'Floor owner', floor: { enabled: true } }, { entity: 'sensor.b' }],
    }, states });
  }, states);
  const resize = async (width, height) => {
    await page.evaluate(width => { document.querySelector('#mount').style.width = `${width}px`; }, width);
    await expect.poll(() => page.locator('sensor-bar-card-plus .bar-track').first()
      .evaluate(node => node.getBoundingClientRect().height)).toBe(height);
    expect(await page.evaluate(() => window.__activeCardObservers.size)).toBe(1);
  };
  await resize(180, 24); // Prove initial observation before any reconnect.
  await resize(720, 38);
  for (let cycle = 0; cycle < 2; cycle++) {
    const detached = await page.evaluate(async () => {
      const card = window.__reconnectedCard;
      const rows = card.shadowRoot.querySelector('.rows');
      const html = rows.innerHTML;
      card.remove();
      document.querySelector('#mount').style.width = '180px';
      for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
      return { observers: window.__activeCardObservers.size, unchanged: rows.innerHTML === html,
        retiredCalls: window.__invokeRetiredObservers() };
    });
    expect(detached).toEqual({ observers: 0, unchanged: true, retiredCalls: 0 });
    await page.evaluate(async () => {
      document.querySelector('#mount').style.width = '720px';
      document.querySelector('#mount').appendChild(window.__reconnectedCard);
      for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
    });
    expect(await page.evaluate(() => window.__invokeRetiredObservers())).toBe(0);
    await resize(180, 24); // No config, HA update, or window resize.
    await resize(720, 38);
  }
  const windowListenerCalls = await page.evaluate(() => {
    const card = window.__reconnectedCard;
    const original = card._schedulePostLayoutDensityPass;
    let calls = 0;
    card._schedulePostLayoutDensityPass = () => { calls++; };
    window.dispatchEvent(new Event('resize'));
    card._schedulePostLayoutDensityPass = original;
    window.__reconnectedRows = card._config.entities;
    window.__reconnectedScales = card._rowScales;
    return calls;
  });
  expect(windowListenerCalls).toBe(1);
  await update(page, { ...states, [ids[0]]: state(0, 20) });
  await update(page, { 'sensor.min': { state: '300' }, 'sensor.max': { state: '200' } });
  await expect(page.locator('sensor-bar-card-plus .rows')).toContainText('Entity not found: sensor.a');
  await update(page, { [ids[0]]: state(0, 70), [ids[1]]: state(1), 'sensor.min': { state: '300' }, 'sensor.max': { state: '200' } });
  expect(await page.locator('sensor-bar-card-plus').evaluate(card => ({
    sameCard: card === window.__reconnectedCard,
    sameRows: card._config.entities === window.__reconnectedRows,
    sameScales: card._rowScales === window.__reconnectedScales,
    indices: [...card.shadowRoot.querySelectorAll('.row')].map(row => row.dataset.rowIndex),
    peak: card.shadowRoot.querySelector('.peak-marker').style.left,
    floor: card.shadowRoot.querySelectorAll('.row')[1].querySelector('.floor-marker').style.left,
  }))).toEqual({ sameCard: true, sameRows: true, sameScales: true, indices: ['0', '1', '2'], peak: '45%', floor: '10%' });
  await resize(180, 24);
  await resize(720, 38);
});

for (const stage of ['outer', 'inner']) for (const reconnect of [false, true]) {
  test(`disconnect invalidates queued ${stage} layout work${reconnect ? ' even after reconnect' : ''}`, async ({ page }) => {
    await render(page, [configRow(ids[0], 0)], { [ids[0]]: state(0) });
    const result = await page.locator('sensor-bar-card-plus').evaluate((card, { stage, reconnect }) => {
      const nativeRAF = window.requestAnimationFrame;
      const pending = [];
      const mutations = [];
      const originals = new Map(['_applyRowDensity', '_applyAdaptiveRowHeight', '_positionGenericMarkerLabels']
        .map(key => [key, card[key]]));
      window.requestAnimationFrame = callback => { pending.push(callback); return pending.length; };
      originals.forEach((method, key) => { card[key] = function(...args) { mutations.push(key); return method.apply(this, args); }; });
      try {
        card._runPostLayoutPasses([...card.shadowRoot.querySelectorAll('.row')]);
        if (stage === 'inner') pending.shift()();
        const stale = pending.shift();
        mutations.length = 0;
        card.remove();
        if (reconnect) document.querySelector('#mount').appendChild(card);
        const html = card.shadowRoot.innerHTML;
        stale(); // Work captured before disconnect must not become valid again.
        return { mutations, unchanged: card.shadowRoot.innerHTML === html };
      } finally {
        window.requestAnimationFrame = nativeRAF;
        originals.forEach((method, key) => { card[key] = method; });
      }
    }, { stage, reconnect });
    expect(result.mutations).toEqual([]);
    expect(result.unchanged).toBe(true);
  });
}

for (const order of ['normal', 'reverse']) {
  test(`${order} initialization retains the latest HA state and later patches normally`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    const rows = [configRow(ids[0], 0)];
    const latest = { [ids[0]]: state(0, 70) };
    const early = await page.evaluate(({ order, rows, latest }) => {
      const card = document.createElement('sensor-bar-card-plus');
      document.querySelector('#mount').appendChild(card);
      const config = { layout: { label: { position: 'above' } }, bar: { animated: false }, entities: rows };
      if (order === 'normal') card.setConfig(config);
      card.hass = { states: {} };
      card.hass = { states: { 'sensor.a': { ...latest['sensor.a'], state: '50' } } };
      const hass = { states: latest };
      card.hass = hass;
      const inert = card.shadowRoot.querySelector('.rows').children.length === 0;
      if (order === 'reverse') card.setConfig(config);
      card.addEventListener('hass-more-info', e => { window.__clickedEntity = e.detail.entityId; });
      window.__initializedRow = card.shadowRoot.querySelector('.row');
      return { inert, retained: card._hass === hass };
    }, { order, rows, latest });
    expect(early.retained).toBe(true);
    if (order === 'reverse') expect(early.inert).toBe(true);
    await checkRows(page, rows, latest);
    const later = { [ids[0]]: state(0, 80) };
    await update(page, later);
    await checkRows(page, rows, later);
    expect(await page.locator('sensor-bar-card-plus .row').evaluate(row => row === window.__initializedRow)).toBe(true);
  });
}
