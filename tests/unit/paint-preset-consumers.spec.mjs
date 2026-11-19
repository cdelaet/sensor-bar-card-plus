import { expect, it, vi } from 'vitest';
import { createDomEditorFixture } from '../support/dom-editor-fixture.mjs';

const entity = 'sensor.power';
const preset = { bar: { paint: { preset: 'warm' } } };
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

function createHass(window, color) {
  const stops = [];
  const callbacks = [];
  const dashboard = window.JSON.parse(JSON.stringify({ views: [{ cards: [{
    type: 'custom:sensor-bar-card-plus',
    preset_library: { paint: { warm: { fill_style: 'solid', color } } },
  }] }] }));
  const connection = {
    subscribeEvents: vi.fn(async callback => {
      callbacks.push(callback);
      const stop = vi.fn();
      stops.push(stop);
      return stop;
    }),
    sendMessagePromise: vi.fn(async () => dashboard),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return { states: {}, connection, stops, callbacks };
}

it('shares runtime subscriptions while preserving Card master and entity eligibility', async () => {
  const { window } = await createDomEditorFixture();
  window.history.replaceState({}, '', '/dashboard-a/view');
  const hass = createHass(window, 'red');
  const card = window.document.createElement('sensor-bar-card-plus');
  const feature = window.document.createElement('sensor-bar-card-plus-feature');
  for (const host of [card, feature]) vi.spyOn(host, '_render').mockImplementation(() => {});
  vi.spyOn(card, '_setupResizeObserver').mockImplementation(() => {});
  vi.spyOn(card, '_update').mockImplementation(() => {});
  vi.spyOn(card, '_logDiagnostics').mockImplementation(() => {});
  card.setConfig({ entity, preset_library: {} });
  feature.setConfig({ entity });
  window.document.body.append(card, feature);

  const resolvePaint = vi.spyOn(card, '_refreshPaintPresetResolutions');
  card.hass = feature.hass = hass;
  expect(resolvePaint).toHaveBeenCalledOnce();
  expect(card._paintPresetRegistry.status).toBe('loading');
  expect(feature._paintPresetHandle).toBeNull();

  feature.setConfig({ entity, ...preset });
  expect(feature._paintPresetRegistry).toBe(card._paintPresetRegistry);
  await settle();
  const ready = card._paintPresetRegistry;
  expect(ready).toMatchObject({ status: 'ready', presets: { warm: { color: 'red' } } });
  expect(feature._paintPresetRegistry).toBe(ready);
  expect(hass.connection.sendMessagePromise).toHaveBeenCalledOnce();
  expect(hass.connection.subscribeEvents).toHaveBeenCalledOnce();
  expect(hass.connection.addEventListener).toHaveBeenCalledTimes(2);

  resolvePaint.mockClear();
  card._syncPaintPresetRegistry();
  hass.callbacks[0]({ event_type: 'lovelace_updated' });
  await settle();
  expect(card._paintPresetRegistry).toBe(ready);
  expect(resolvePaint).not.toHaveBeenCalled();

  card.setConfig({ entities: [{ entity, ...preset }] });
  expect(card._paintPresetRegistry).toBe(ready);
  card.setConfig({ entity });
  expect(card._paintPresetRegistry.status).toBe('loading');
  expect(hass.stops[0]).not.toHaveBeenCalled();
  feature.setConfig({ entity });
  expect(feature._paintPresetRegistry.status).toBe('loading');
  expect(hass.stops[0]).toHaveBeenCalledOnce();
  expect(hass.connection.removeEventListener).toHaveBeenCalledTimes(2);
  card.remove();
  feature.remove();
});

it('attaches editors without a preset and follows dashboard, connection and attachment changes', async () => {
  const { editor: card, window } = await createDomEditorFixture();
  const feature = await window.customElements.get('sensor-bar-card-plus-feature').getConfigElement();
  // Browser regressions exercise Paint controls and pointer ordering.
  vi.spyOn(card, '_syncPaintEditors').mockImplementation(() => {});
  vi.spyOn(feature, '_requestRender').mockImplementation(() => {});
  window.document.body.append(feature);
  card.setConfig({ entity });
  feature.setConfig({ entity });
  window.history.replaceState({}, '', '/dashboard-a/view');
  const first = createHass(window, 'red');
  const second = createHass(window, 'blue');

  const syncMaster = vi.spyOn(card, '_syncPresetMasterControls');
  card.hass = feature.hass = first;
  expect(syncMaster).toHaveBeenCalledOnce();
  expect(card._paintPresetRegistry).toBe(feature._paintPresetRegistry);
  await settle();
  const initialHandle = card._paintPresetHandle;
  expect(card._paintPresetRegistry).toMatchObject({ dashboardPath: 'dashboard-a', status: 'ready' });
  expect(syncMaster).toHaveBeenCalledTimes(2);
  expect(first.connection.subscribeEvents).toHaveBeenCalledOnce();
  expect(card.shadowRoot.querySelector('#preset-master')).toBeNull();

  window.history.replaceState({}, '', '/dashboard-b/view');
  card.hass = first;
  expect(card._paintPresetHandle).toBe(initialHandle);
  expect(card._paintPresetRegistry).toMatchObject({ dashboardPath: 'dashboard-b', status: 'loading' });
  expect(feature._paintPresetRegistry.dashboardPath).toBe('dashboard-a');
  expect(first.stops[0]).not.toHaveBeenCalled();
  feature.hass = first;
  expect(first.stops[0]).toHaveBeenCalledOnce();
  expect(card._paintPresetRegistry).toBe(feature._paintPresetRegistry);
  await settle();
  expect(first.connection.sendMessagePromise.mock.calls.map(([message]) => message.url_path))
    .toEqual(['dashboard-a', 'dashboard-b']);

  let resolveOldRead;
  first.connection.sendMessagePromise.mockImplementationOnce(() => new Promise(resolve => { resolveOldRead = resolve; }));
  first.callbacks[1]({ event_type: 'lovelace_updated' });
  card.hass = feature.hass = second;
  expect(first.stops[1]).toHaveBeenCalledOnce();
  first.callbacks[1]({ event_type: 'lovelace_updated' });
  resolveOldRead(window.JSON.parse('{}'));
  await settle();
  expect(first.connection.sendMessagePromise).toHaveBeenCalledTimes(3);
  expect(card._paintPresetRegistry).toBe(feature._paintPresetRegistry);
  expect(card._paintPresetRegistry.presets.warm.color).toBe('blue');

  card.remove();
  expect(card._paintPresetRegistry.status).toBe('loading');
  expect(second.stops[0]).not.toHaveBeenCalled();
  feature.remove();
  expect(second.stops[0]).toHaveBeenCalledOnce();
  window.document.body.append(card, feature);
  expect(card._paintPresetHandle).not.toBe(initialHandle);
  expect(card._paintPresetRegistry).toBe(feature._paintPresetRegistry);
  await settle();
  expect(second.connection.subscribeEvents).toHaveBeenCalledTimes(2);

  card.hass = feature.hass = { states: {} };
  for (const editor of [card, feature]) {
    expect(editor._paintPresetRegistry).toMatchObject({ status: 'empty', diagnostic: { code: 'connection_unavailable' } });
  }
  expect(second.stops[1]).toHaveBeenCalledOnce();
  feature.remove();
});
