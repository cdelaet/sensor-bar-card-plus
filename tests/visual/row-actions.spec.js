const { test, expect } = require('@playwright/test');

const state = { state: '42', attributes: { friendly_name: 'Temperature', unit_of_measurement: '°C' } };

async function render(page, config) {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async config => {
    const state = { state: '42', attributes: { friendly_name: 'Temperature', unit_of_measurement: '°C' } };
    await window.__sbcpRenderCard({ config, states: { 'sensor.room': state, 'sensor.outside': state } });
  }, config);
}

async function lastAction(page) {
  return page.evaluate(() => window.__lastHassAction);
}

async function expectLastAction(page, action) {
  await expect.poll(() => page.evaluate(() => window.__lastHassAction?.detail?.action), { timeout: 2000 }).toBe(action);
}

test('omitted action config preserves immediate row tap as HA more-info', async ({ page }) => {
  await render(page, { entity: 'sensor.room' });
  const row = page.locator('.row[data-entity="sensor.room"]');
  await row.click();
  const emitted = await lastAction(page);
  expect(emitted.detail).toEqual({ config: { entity: 'sensor.room', tap_action: { action: 'more-info' } }, action: 'tap' });
  expect(emitted.bubbles).toBe(true);
  expect(emitted.composed).toBe(true);
});

test('actions inherit from card config and row overrides stay isolated', async ({ page }) => {
  await render(page, {
    tap_action: { action: 'toggle', custom_advanced_field: { keep: true } },
    entities: [
      { entity: 'sensor.room' },
      { entity: 'sensor.outside', tap_action: { action: 'url', url_path: '/local/room' } },
    ],
  });
  await page.locator('.row[data-entity="sensor.room"]').click();
  expect((await lastAction(page)).detail).toEqual({
    config: { tap_action: { action: 'toggle', custom_advanced_field: { keep: true } }, entities: [{ entity: 'sensor.room' }, { entity: 'sensor.outside', tap_action: { action: 'url', url_path: '/local/room' } }], entity: 'sensor.room' },
    action: 'tap',
  });
  await page.locator('.row[data-entity="sensor.outside"]').click();
  const second = (await lastAction(page)).detail;
  expect(second.action).toBe('tap');
  expect(second.config.entity).toBe('sensor.outside');
  expect(second.config.tap_action).toEqual({ action: 'url', url_path: '/local/room' });
});

test('none suppresses inherited tap and explicit action fields are preserved in the bridge', async ({ page }) => {
  await render(page, {
    tap_action: { action: 'toggle' },
    entities: [{ entity: 'sensor.room', tap_action: { action: 'none' } }],
  });
  const row = page.locator('.row[data-entity="sensor.room"]');
  await expect(row).not.toHaveAttribute('tabindex', '0');
  await row.click();
  expect(await lastAction(page)).toBeNull();
});

test('hold and double tap dispatch only their matching action', async ({ page }) => {
  await render(page, {
    entity: 'sensor.room',
    tap_action: { action: 'toggle' },
    hold_action: { action: 'perform-action', perform_action: 'light.turn_on', data: { brightness: 10 } },
    double_tap_action: { action: 'navigate', navigation_path: '/lovelace/0' },
  });
  const row = page.locator('.row[data-entity="sensor.room"]');
  await row.click();
  await expectLastAction(page, 'tap');

  await page.evaluate(() => { window.__lastHassAction = null; });
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expectLastAction(page, 'hold');
  expect((await lastAction(page)).detail.config.hold_action).toEqual({ action: 'perform-action', perform_action: 'light.turn_on', data: { brightness: 10 } });

  await page.evaluate(() => { window.__lastHassAction = null; });
  await row.click(); await row.click();
  await expectLastAction(page, 'double_tap');
});

test('a held mouse gesture emits only hold after release and its click window', async ({ page }) => {
  await render(page, {
    entity: 'sensor.room',
    tap_action: { action: 'toggle' },
    hold_action: { action: 'perform-action', perform_action: 'light.turn_on' },
    double_tap_action: { action: 'navigate', navigation_path: '/lovelace/0' },
  });
  await page.evaluate(() => {
    window.__rowActions = [];
    document.querySelector('sensor-bar-card-plus').addEventListener('hass-action', event => {
      window.__rowActions.push(event.detail.action);
    });
  });
  const row = page.locator('.row[data-entity="sensor.room"]');
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__rowActions), { timeout: 2000 }).toEqual(['hold']);
});

test('hold none consumes inherited and row-overridden long presses without disabling tap gestures', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await window.__sbcpRenderCard({
      config: {
        tap_action: { action: 'more-info' },
        hold_action: { action: 'none' },
        entities: [
          { entity: 'sensor.test' },
          {
            entity: 'light.test',
            tap_action: { action: 'toggle' },
            hold_action: { action: 'none' },
            double_tap_action: { action: 'more-info' },
          },
        ],
      },
      states: {
        'sensor.test': { state: '42', attributes: { friendly_name: 'Temperature' } },
        'light.test': { state: 'on', attributes: { friendly_name: 'Toilet light' } },
      },
    });
    window.__rowActions = [];
    document.querySelector('sensor-bar-card-plus').addEventListener('hass-action', event => {
      window.__rowActions.push(event.detail);
    });
  });

  for (const entity of ['sensor.test', 'light.test']) {
    const row = page.locator(`.row[data-entity="${entity}"]`);
    const box = await row.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.__rowActions)).toEqual([]);
  }

  const light = page.locator('.row[data-entity="light.test"]');
  await light.click();
  await expect.poll(() => page.evaluate(() => window.__rowActions.map(event => event.action)), { timeout: 2000 }).toEqual(['tap']);
  expect((await page.evaluate(() => window.__rowActions[0])).config.tap_action).toEqual({ action: 'toggle' });

  await page.evaluate(() => { window.__rowActions = []; });
  await light.click();
  await light.click();
  await expect.poll(() => page.evaluate(() => window.__rowActions.map(event => event.action)), { timeout: 2000 }).toEqual(['double_tap']);
  expect((await page.evaluate(() => window.__rowActions[0])).config.double_tap_action).toEqual({ action: 'more-info' });
});

test('an omitted hold action still consumes a long press', async ({ page }) => {
  await render(page, { entity: 'sensor.room', tap_action: { action: 'more-info' } });
  await page.evaluate(() => {
    window.__rowActions = [];
    document.querySelector('sensor-bar-card-plus').addEventListener('hass-action', event => {
      window.__rowActions.push(event.detail.action);
    });
  });
  const row = page.locator('.row[data-entity="sensor.room"]');
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  expect(await page.evaluate(() => window.__rowActions)).toEqual([]);
});

test('the same card instance uses updated card and row actions without duplicate events', async ({ page }) => {
  await render(page, {
    tap_action: { action: 'more-info' },
    entities: [
      { entity: 'sensor.room', tap_action: { action: 'toggle' } },
      { entity: 'sensor.outside' },
    ],
  });
  await page.evaluate(() => {
    window.__rowActions = [];
    document.querySelector('sensor-bar-card-plus').addEventListener('hass-action', event => {
      window.__rowActions.push(event.detail);
    });
  });
  const card = page.locator('sensor-bar-card-plus');
  const clickEntity = entity => page.locator(`.row[data-entity="${entity}"]`).click();

  await clickEntity('sensor.room');
  expect((await page.evaluate(() => window.__rowActions.at(-1))).config.tap_action).toEqual({ action: 'toggle' });
  await clickEntity('sensor.outside');
  expect((await page.evaluate(() => window.__rowActions.at(-1))).config.tap_action).toEqual({ action: 'more-info' });

  await card.evaluate(element => element.setConfig({
    tap_action: { action: 'url', url_path: '/first' },
    entities: [
      { entity: 'sensor.room', tap_action: { action: 'toggle' } },
      { entity: 'sensor.outside' },
    ],
  }));
  await clickEntity('sensor.outside');
  expect((await page.evaluate(() => window.__rowActions.at(-1))).config.tap_action).toEqual({ action: 'url', url_path: '/first' });

  await card.evaluate(element => element.setConfig({
    tap_action: { action: 'none' },
    entities: [
      { entity: 'sensor.room', tap_action: { action: 'url', url_path: '/row' } },
      { entity: 'sensor.outside' },
    ],
  }));
  const eventCount = await page.evaluate(() => window.__rowActions.length);
  await clickEntity('sensor.room');
  expect((await page.evaluate(() => window.__rowActions.length))).toBe(eventCount + 1);
  expect((await page.evaluate(() => window.__rowActions.at(-1))).config.tap_action).toEqual({ action: 'url', url_path: '/row' });
  await clickEntity('sensor.outside');
  expect((await page.evaluate(() => window.__rowActions.length))).toBe(eventCount + 1);

  await card.evaluate(element => element.setConfig({
    tap_action: { action: 'toggle' },
    hold_action: { action: 'navigate', navigation_path: '/held' },
    double_tap_action: { action: 'perform-action', perform_action: 'light.turn_on' },
    entities: [{ entity: 'sensor.room' }, { entity: 'sensor.outside' }],
  }));
  const row = page.locator('.row[data-entity="sensor.room"]');
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__rowActions.at(-1)?.action), { timeout: 2000 }).toBe('hold');

  await page.evaluate(() => { window.__rowActions = []; });
  await row.click();
  await row.click();
  await expect.poll(() => page.evaluate(() => window.__rowActions.map(event => event.action)), { timeout: 2000 }).toEqual(['double_tap']);
});

test('keyboard activates tap and interactive descendants do not activate the row', async ({ page }) => {
  await render(page, { entity: 'sensor.room', tap_action: { action: 'toggle' } });
  const row = page.locator('.row[data-entity="sensor.room"]');
  await row.focus();
  await page.keyboard.press('Enter');
  expect((await lastAction(page)).detail.action).toBe('tap');
  await page.evaluate(() => { window.__lastHassAction = null; });
  await page.keyboard.press('Space');
  expect((await lastAction(page)).detail.action).toBe('tap');
  await row.evaluate(rowElement => {
    const button = document.createElement('button');
    button.textContent = 'Child control';
    rowElement.append(button);
  });
  await page.evaluate(() => { window.__lastHassAction = null; });
  await row.locator('button').click();
  expect(await lastAction(page)).toBeNull();
});

test('unavailable entities stay actionable and missing warning rows do not', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  await page.evaluate(async () => {
    await window.__sbcpRenderCard({
      config: { entities: [{ entity: 'sensor.offline' }, { entity: 'sensor.missing' }] },
      states: { 'sensor.offline': { state: 'unavailable', attributes: {} } },
    });
  });
  await page.locator('.row[data-entity="sensor.offline"]').click();
  expect((await lastAction(page)).detail.config.entity).toBe('sensor.offline');
  await page.evaluate(() => { window.__lastHassAction = null; });
  await page.locator('.row:not([data-entity])').click();
  expect(await lastAction(page)).toBeNull();
});

test('reconfiguration cancels an unresolved single tap from the previous row DOM', async ({ page }) => {
  await render(page, {
    entity: 'sensor.room',
    double_tap_action: { action: 'navigate', navigation_path: '/lovelace/0' },
  });
  await page.locator('.row[data-entity="sensor.room"]').click();
  await page.evaluate(() => {
    document.querySelector('sensor-bar-card-plus').setConfig({ entity: 'sensor.room', tap_action: { action: 'toggle' } });
  });
  await page.waitForTimeout(500);
  expect(await lastAction(page)).toBeNull();
});
