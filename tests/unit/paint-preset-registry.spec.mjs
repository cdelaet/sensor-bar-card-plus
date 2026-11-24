import { describe, expect, it, vi } from 'vitest';
import { dashboardPathFromLocation, subscribeDashboardPaintPresets } from '../../src/dashboard/paint-preset-registry.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function createConnection(config = {}, subscribe = ({ stop }) => Promise.resolve(stop)) {
  const listeners = new Map();
  const subscriptions = [];
  let response = config;
  const connection = {
    connected: true,
    sendMessagePromise: vi.fn(message => typeof response === 'function' ? response(message) : Promise.resolve(response)),
    subscribeEvents: vi.fn((callback, eventType) => {
      const subscription = { callback, eventType, stop: vi.fn() };
      subscriptions.push(subscription);
      return subscribe(subscription);
    }),
    addEventListener: vi.fn((type, callback) => {
      const callbacks = listeners.get(type) ?? new Set();
      callbacks.add(callback);
      listeners.set(type, callbacks);
    }),
    removeEventListener: vi.fn((type, callback) => listeners.get(type)?.delete(callback)),
    emit(type, event = {}) { for (const callback of listeners.get(type) ?? []) callback(event); },
    setResponse(next) { response = next; },
    subscriptions,
  };
  return connection;
}

const card = paint => ({ type: 'custom:sensor-bar-card-plus', preset_library: { paint } });
const hassFor = connection => ({ connection, connected: true });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

describe('dashboard paint preset registry', () => {
  it('shares one read and immutable snapshot across consumers of a dashboard connection', async () => {
    const config = { views: [], sbcp_fragments: { paint_presets: { energy: { fill_style: 'solid', color: '#123456' } } } };
    const connection = createConnection(config);
    const firstChanges = vi.fn();
    const secondChanges = vi.fn();
    const first = subscribeDashboardPaintPresets(hassFor(connection), 'energy', firstChanges);
    const second = subscribeDashboardPaintPresets(hassFor(connection), 'energy', secondChanges);
    await flush();

    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(1);
    expect(first.getSnapshot()).toBe(second.getSnapshot());
    expect(first.getSnapshot()).toMatchObject({ status: 'ready', dashboardPath: 'energy', presets: config.sbcp_fragments.paint_presets });
    expect(Object.isFrozen(first.getSnapshot())).toBe(true);
    expect(Object.isFrozen(first.getSnapshot().presets.energy)).toBe(true);
    expect(Object.isFrozen(config.sbcp_fragments.paint_presets.energy)).toBe(false);
    expect(firstChanges).toHaveBeenCalledWith(first.getSnapshot());
    expect(secondChanges).toHaveBeenCalledWith(second.getSnapshot());

    first.unsubscribe();
    expect(connection.subscriptions[0].stop).not.toHaveBeenCalled();
    second.unsubscribe();
    await flush();
    expect(connection.subscriptions[0].stop).toHaveBeenCalledTimes(1);
    expect(connection.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('excludes duplicate __proto__ presets without prototype mutation', async () => {
    const library = JSON.parse('{"paint":{"__proto__":{"fill_style":"solid","color":"#123456"},"unique":{"color":"green"}}}');
    const duplicate = JSON.parse('{"paint":{"__proto__":{"fill_style":"gradient","color":"#abcdef"}}}');
    const connection = createConnection({ views: [
      { cards: [
        { type: 'custom:sensor-bar-card-plus', preset_library: library },
        { type: 'custom:sensor-bar-card-plus', preset_library: duplicate },
      ] },
    ] });
    const handle = subscribeDashboardPaintPresets(hassFor(connection), 'proto', () => {});
    await flush();
    const presets = handle.getSnapshot().presets;

    expect(Object.hasOwn(presets, '__proto__')).toBe(false);
    expect(presets).toEqual({ unique: { color: 'green' } });
    expect(Object.getPrototypeOf(presets)).toBe(Object.prototype);
    expect(handle.getSnapshot().conflicts).toEqual(JSON.parse('{"__proto__":2}'));
    expect(Object.hasOwn(handle.getSnapshot().conflicts, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(handle.getSnapshot().conflicts)).toBe(Object.prototype);
    expect(Object.prototype.polluted).toBeUndefined();
    handle.unsubscribe();
    await flush();
  });

  it('uses the sole saved master library across views and nested cards, preserving unknown categories', async () => {
    const library = { paint: { warm: { fill_style: 'solid', color: '#ff9800', opacity: 80 } }, layout: { future: true } };
    const connection = createConnection({ views: [
      { cards: [{ type: 'vertical-stack', cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: library }] }] },
      { cards: [] },
    ], sbcp_fragments: { paint_presets: { ignored: { color: 'red' } } } });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', vi.fn());
    await flush();
    expect(consumer.getSnapshot()).toMatchObject({ status: 'ready', libraryCount: 1,
      conflicts: {}, presets: library.paint });
    consumer.unsubscribe();
  });

  it('discovers masters in nested sections, headers, footers, and sidebar sections', async () => {
    const locations = [
      { sections: [{ sections: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: {} }] }] }] },
      { header: { card: { type: 'custom:sensor-bar-card-plus', preset_library: {} } } },
      { footer: { card: { type: 'custom:sensor-bar-card-plus', preset_library: {} } } },
      { sidebar: { sections: [{ sections: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: {} }] }] }] } },
    ];
    for (const [index, location] of locations.entries()) {
      const connection = createConnection({ views: [location] });
      const consumer = subscribeDashboardPaintPresets(hassFor(connection), `location-${index}`, vi.fn());
      await flush();
      expect(consumer.getSnapshot()).toMatchObject({ status: 'ready', libraryCount: 1 });
      consumer.unsubscribe();
    }
  });

  it('merges unique names and excludes shared names across separate native Card locations', async () => {
    const connection = createConnection({ views: [{
      header: { card: card({ Thermal: { color: 'red' }, Energy: { color: 'green' } }) },
      sidebar: { sections: [{ cards: [card({ Thermal: { color: 'blue' }, Sunset: { color: 'orange' } })] }] },
    }] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'cross-location-duplicate', vi.fn());
    await flush();
    expect(consumer.getSnapshot().status).toBe('ready');
    expect(consumer.getSnapshot().presets).toEqual({ Energy: { color: 'green' }, Sunset: { color: 'orange' } });
    expect(consumer.getSnapshot().conflicts).toEqual({ Thermal: 2 });
    expect(consumer.getSnapshot()).toMatchObject({ libraryCount: 2, diagnostic: null });
    expect(Object.isFrozen(consumer.getSnapshot().conflicts)).toBe(true);
    consumer.unsubscribe();
  });

  it('counts each defining card for three-way conflicts and treats identical definitions as duplicates', async () => {
    const shared = { color: 'red' };
    const connection = createConnection({ views: [{ cards: [
      card({ Thermal: shared, Energy: { color: 'green' } }),
      card({ Thermal: { color: 'red' }, Sunset: { color: 'orange' } }),
      card({ Thermal: shared }),
    ] }] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'three-owners', vi.fn());
    await flush();
    expect(consumer.getSnapshot().status).toBe('ready');
    expect(consumer.getSnapshot().libraryCount).toBe(3);
    expect(consumer.getSnapshot().presets).toEqual({ Energy: { color: 'green' }, Sunset: { color: 'orange' } });
    expect(consumer.getSnapshot().conflicts).toEqual({ Thermal: 3 });
    consumer.unsubscribe();
  });

  it('accepts multiple empty libraries and discovers definitions in supported nested containers and views', async () => {
    const connection = createConnection({ views: [
      { cards: [card({})] },
      { sections: [{ sections: [{ cards: [{ type: 'vertical-stack', cards: [card({ nested: { color: 'blue' } })] }] }] }] },
      { footer: { card: card({ footer: { color: 'gold' }, nested: { color: 'yellow' } }) }, sidebar: { sections: [{ cards: [card({})] }] } },
    ] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'nested-views', vi.fn());
    await flush();
    expect(consumer.getSnapshot().status).toBe('ready');
    expect(consumer.getSnapshot().libraryCount).toBe(4);
    expect(consumer.getSnapshot().presets).toEqual({ footer: { color: 'gold' } });
    expect(consumer.getSnapshot().conflicts).toEqual({ nested: 2 });
    consumer.unsubscribe();
  });

  it('ignores unrelated library category edits in the Paint-only registry snapshot', async () => {
    const changed = vi.fn();
    const connection = createConnection({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: {}, layout: { version: 1 } } }] }] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'category-changes', changed);
    await flush();
    const snapshot = consumer.getSnapshot();
    const notifications = changed.mock.calls.length;
    connection.setResponse({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: {}, layout: { version: 2 }, future: { enabled: true } } }] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    expect(consumer.getSnapshot()).toBe(snapshot);
    expect(consumer.getSnapshot().revision).toBe(snapshot.revision);

    connection.setResponse({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: { paint: {} } }] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    expect(consumer.getSnapshot()).toBe(snapshot);
    expect(changed).toHaveBeenCalledTimes(notifications);
    consumer.unsubscribe();
  });

  it('uses legacy dashboard presets only when no card-owned library exists', async () => {
    const legacy = createConnection({ views: [{ cards: [] }], sbcp_fragments: { paint_presets: { old: { color: 'red' } } } });
    const legacyConsumer = subscribeDashboardPaintPresets(hassFor(legacy), 'legacy', vi.fn());
    await flush();
    expect(legacyConsumer.getSnapshot()).toMatchObject({ status: 'ready', libraryCount: 0, presets: { old: { color: 'red' } } });
    legacyConsumer.unsubscribe();

    const owned = createConnection({ views: [{ cards: [card({}),
      { type: 'grid', cards: [card({ hidden: { color: 'blue' } })] },
    ] }], sbcp_fragments: { paint_presets: { old: { color: 'red' } } } });
    const consumer = subscribeDashboardPaintPresets(hassFor(owned), 'owned-empty-authoritative', vi.fn());
    await flush();
    expect(consumer.getSnapshot().status).toBe('ready');
    expect(consumer.getSnapshot().libraryCount).toBe(2);
    expect(consumer.getSnapshot().presets).toEqual({ hidden: { color: 'blue' } });
    expect(consumer.getSnapshot().conflicts).toEqual({});
    expect(Object.hasOwn(consumer.getSnapshot().presets, 'old')).toBe(false);
    consumer.unsubscribe();
  });

  it('revisions conflict appearance, disappearance, and owner-count changes after saved updates', async () => {
    const connection = createConnection({ views: [{ cards: [card({ Thermal: { color: 'red' }, Energy: { color: 'green' } })] }] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'conflict-refresh', vi.fn());
    await flush();
    const initial = consumer.getSnapshot();
    connection.setResponse({ views: [{ cards: [card({ Thermal: { color: 'red' }, Energy: { color: 'green' } }),
      card({ Thermal: { color: 'blue' } })] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    const conflict = consumer.getSnapshot();
    expect(conflict.conflicts).toEqual({ Thermal: 2 });
    expect(conflict.presets).toEqual({ Energy: { color: 'green' } });
    expect(conflict.revision).toBeGreaterThan(initial.revision);

    connection.setResponse({ views: [{ cards: [card({ Thermal: { color: 'red' }, Energy: { color: 'green' } }),
      card({ Thermal: { color: 'blue' } }), card({ Thermal: { color: 'gold' } })] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    const three = consumer.getSnapshot();
    expect(three.conflicts).toEqual({ Thermal: 3 });
    expect(three.revision).toBeGreaterThan(conflict.revision);

    connection.setResponse({ views: [{ cards: [card({ Thermal: { color: 'red' }, Energy: { color: 'green' } })] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    expect(consumer.getSnapshot().conflicts).toEqual({});
    expect(consumer.getSnapshot().presets.Thermal).toEqual({ color: 'red' });
    expect(consumer.getSnapshot().revision).toBeGreaterThan(three.revision);
    consumer.unsubscribe();
  });

  it('treats an empty master library as authoritative', async () => {
    const connection = createConnection({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: {} }] }],
      sbcp_fragments: { paint_presets: { legacy: { color: 'red' } } } });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'empty-master', vi.fn());
    await flush();
    expect(consumer.getSnapshot()).toMatchObject({ status: 'ready', libraryCount: 1, presets: {} });
    consumer.unsubscribe();
  });

  it('publishes saved master updates after refresh but ignores unsaved local edits', async () => {
    const saved = { type: 'custom:sensor-bar-card-plus', preset_library: { paint: { warm: { color: 'red' } } } };
    const connection = createConnection({ views: [{ cards: [saved] }] });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'master-updates', vi.fn());
    await flush();
    saved.preset_library.paint.warm.color = 'unsaved';
    expect(consumer.getSnapshot().presets.warm.color).toBe('red');
    connection.setResponse({ views: [{ cards: [{ type: 'custom:sensor-bar-card-plus',
      preset_library: { paint: { warm: { color: 'blue' } } } }] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    expect(consumer.getSnapshot().presets.warm.color).toBe('blue');
    consumer.unsubscribe();
  });

  it('keeps the same snapshot and notification count when a saved library refresh changes nothing', async () => {
    const configuration = { views: [{ cards: [card({ warm: { color: 'red' } })] }] };
    const connection = createConnection(configuration);
    const changed = vi.fn();
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'unchanged-refresh', changed);
    await flush();
    const snapshot = consumer.getSnapshot();
    const notificationCount = changed.mock.calls.length;

    connection.setResponse({ views: [{ cards: [card({ warm: { color: 'red' } })] }] });
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();

    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(consumer.getSnapshot()).toBe(snapshot);
    expect(consumer.getSnapshot().revision).toBe(snapshot.revision);
    expect(changed).toHaveBeenCalledTimes(notificationCount);
    consumer.unsubscribe();
  });

  it('isolates registries between dashboards and Home Assistant connections', async () => {
    const firstConnection = createConnection(({ url_path }) => Promise.resolve({
      views: [{ cards: [card({ [url_path === 'dashboard-a' ? 'one' : 'other']: { color: 'red' } })] }],
    }));
    const secondConnection = createConnection({ views: [{ cards: [card({ two: { color: 'blue' } })] }] });
    const first = subscribeDashboardPaintPresets(hassFor(firstConnection), 'dashboard-a', vi.fn());
    const otherDashboard = subscribeDashboardPaintPresets(hassFor(firstConnection), 'dashboard-b', vi.fn());
    const otherConnection = subscribeDashboardPaintPresets(hassFor(secondConnection), 'dashboard-a', vi.fn());
    await flush();

    expect(firstConnection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(secondConnection.sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(first.getSnapshot().presets).toEqual({ one: { color: 'red' } });
    expect(otherDashboard.getSnapshot().presets).toEqual({ other: { color: 'red' } });
    expect(otherConnection.getSnapshot().presets).toEqual({ two: { color: 'blue' } });
    first.unsubscribe(); otherDashboard.unsubscribe(); otherConnection.unsubscribe();
  });

  it('refetches on lovelace_updated and notifies only when preset data changes', async () => {
    const connection = createConnection({ sbcp_fragments: { paint_presets: { first: { color: 'red' } } } });
    const changed = vi.fn();
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', changed);
    await flush();
    const initialCalls = changed.mock.calls.length;
    connection.setResponse({ sbcp_fragments: { paint_presets: { first: { color: 'blue' } } } });
    connection.subscriptions[0].callback({ event_type: 'other_event' });
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(1);
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();

    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(consumer.getSnapshot().presets.first.color).toBe('blue');
    expect(changed).toHaveBeenCalledTimes(initialCalls + 1);
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(3);
    expect(changed).toHaveBeenCalledTimes(initialCalls + 1);
    consumer.unsubscribe();
  });

  it('resubscribes and refreshes after connection loss and readiness', async () => {
    const connection = createConnection({ sbcp_fragments: { paint_presets: { current: { color: 'red' } } } });
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', vi.fn());
    await flush();
    connection.emit('disconnected');
    await flush();
    expect(connection.subscriptions[0].stop).toHaveBeenCalledTimes(1);

    connection.setResponse({ sbcp_fragments: { paint_presets: { current: { color: 'blue' } } } });
    connection.connected = true;
    connection.emit('ready');
    await flush();
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(2);
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(consumer.getSnapshot().presets.current.color).toBe('blue');
    consumer.unsubscribe();
  });

  it.each(['fulfillment', 'rejection'])('keeps the replacement pending after stale subscription %s', async (settlement) => {
    const pendingConfig = deferred();
    const original = deferred();
    const replacement = deferred();
    const subscribe = vi.fn(({ stop }) => Promise.resolve(stop))
      .mockReturnValueOnce(original.promise)
      .mockReturnValueOnce(replacement.promise);
    const connection = createConnection(() => pendingConfig.promise, subscribe);
    const hass = hassFor(connection);
    const first = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    connection.connected = false;
    connection.emit('disconnected');
    connection.connected = true;
    connection.emit('ready');
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(2);

    const [stale, current] = connection.subscriptions;
    if (settlement === 'fulfillment') original.resolve(stale.stop);
    else original.reject(new Error('Original subscription failed'));
    await flush();
    expect(stale.stop).toHaveBeenCalledTimes(settlement === 'fulfillment' ? 1 : 0);

    // Keep the registry loading so each joining consumer tries to start a listener.
    expect(first.getSnapshot().status).toBe('loading');
    const second = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    const third = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(2);
    expect(connection.addEventListener.mock.calls.map(([type]) => type)).toEqual(['disconnected', 'ready']);

    replacement.resolve(current.stop);
    pendingConfig.resolve({});
    await flush();
    const reads = connection.sendMessagePromise.mock.calls.length;
    const update = { event_type: 'lovelace_updated' };
    stale.callback(update);
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(reads);
    connection.setResponse({ sbcp_fragments: { paint_presets: { current: { color: 'blue' } } } });
    current.callback(update);
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(reads + 1);
    expect(first.getSnapshot().presets.current.color).toBe('blue');
    expect(second.getSnapshot()).toBe(first.getSnapshot());
    expect(third.getSnapshot()).toBe(first.getSnapshot());

    first.unsubscribe();
    second.unsubscribe();
    expect(current.stop).not.toHaveBeenCalled();
    third.unsubscribe();
    expect(current.stop).toHaveBeenCalledTimes(1);
    expect(connection.removeEventListener.mock.calls).toEqual(connection.addEventListener.mock.calls);
  });

  it('allows a joining consumer to retry a failed current subscription while loading', async () => {
    const pendingConfig = deferred();
    const failed = deferred();
    const subscribe = vi.fn(({ stop }) => Promise.resolve(stop)).mockReturnValueOnce(failed.promise);
    const connection = createConnection(() => pendingConfig.promise, subscribe);
    const hass = hassFor(connection);
    const first = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    failed.reject(new Error('Current subscription failed'));
    await flush();
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(1);

    const second = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    const third = subscribeDashboardPaintPresets(hass, 'dashboard-a', vi.fn());
    await flush();
    expect(connection.subscribeEvents).toHaveBeenCalledTimes(2);
    expect(connection.addEventListener).toHaveBeenCalledTimes(2);

    pendingConfig.resolve({});
    await flush();
    first.unsubscribe();
    second.unsubscribe();
    third.unsubscribe();
    expect(connection.subscriptions[1].stop).toHaveBeenCalledTimes(1);
  });

  it('starts empty before Home Assistant is ready and attaches when a connection arrives', async () => {
    const changed = vi.fn();
    const consumer = subscribeDashboardPaintPresets(null, 'dashboard-a', changed);
    expect(consumer.getSnapshot()).toMatchObject({
      status: 'empty', presets: {}, diagnostic: { code: 'connection_unavailable' },
    });
    const connection = createConnection({ sbcp_fragments: { paint_presets: { current: { color: 'green' } } } });
    consumer.update(hassFor(connection));
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(consumer.getSnapshot().presets).toEqual({ current: { color: 'green' } });
    consumer.unsubscribe();
  });

  it('moves a consumer to a replacement connection and ignores its stale response', async () => {
    const pending = deferred();
    const oldConnection = createConnection(() => pending.promise);
    const newConnection = createConnection({ sbcp_fragments: { paint_presets: { current: { color: 'green' } } } });
    const changed = vi.fn();
    const consumer = subscribeDashboardPaintPresets(hassFor(oldConnection), 'dashboard-a', changed);
    consumer.update(hassFor(newConnection), 'dashboard-a');
    await flush();
    const newSnapshot = consumer.getSnapshot();
    pending.resolve({ sbcp_fragments: { paint_presets: { stale: { color: 'red' } } } });
    await flush();

    expect(consumer.getSnapshot()).toBe(newSnapshot);
    expect(consumer.getSnapshot().presets).toEqual({ current: { color: 'green' } });
    expect(changed).not.toHaveBeenCalledWith(expect.objectContaining({ presets: { stale: { color: 'red' } } }));
    expect(oldConnection.subscriptions[0].stop).toHaveBeenCalledTimes(1);
    consumer.unsubscribe();
  });

  it('discards an outdated response and fetches once more after an update arrives in flight', async () => {
    const initial = deferred();
    const latest = deferred();
    let calls = 0;
    const connection = createConnection(() => (++calls === 1 ? initial.promise : latest.promise));
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', vi.fn());
    await flush();
    connection.subscriptions[0].callback({ event_type: 'lovelace_updated' });
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(1);
    initial.resolve({ sbcp_fragments: { paint_presets: { stale: { color: 'red' } } } });
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(consumer.getSnapshot().presets).toEqual({});
    latest.resolve({ sbcp_fragments: { paint_presets: { current: { color: 'blue' } } } });
    await flush();
    expect(consumer.getSnapshot().presets).toEqual({ current: { color: 'blue' } });
    consumer.unsubscribe();
  });

  it.each([
    [{ views: [] }, 'paint_presets_missing'],
    [{ sbcp_fragments: [] }, 'paint_fragments_malformed'],
    [{ sbcp_fragments: { paint_presets: [] } }, 'paint_presets_malformed'],
  ])('returns an empty diagnostic snapshot for missing or malformed registry data', async (config, diagnosticCode) => {
    const connection = createConnection(config);
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', vi.fn());
    await flush();
    expect(consumer.getSnapshot()).toMatchObject({
      status: 'empty', presets: {}, diagnostic: { code: diagnosticCode, path: expect.any(String) },
    });
    consumer.unsubscribe();
  });

  it('cleans up consumers before late responses and supports a fresh subscription afterward', async () => {
    const pending = deferred();
    const connection = createConnection(() => pending.promise);
    const changed = vi.fn();
    const consumer = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', changed);
    const initialNotifications = changed.mock.calls.length;
    consumer.unsubscribe();
    pending.resolve({ sbcp_fragments: { paint_presets: { stale: { color: 'red' } } } });
    await flush();
    expect(changed).toHaveBeenCalledTimes(initialNotifications);

    connection.setResponse({ sbcp_fragments: { paint_presets: { fresh: { color: 'blue' } } } });
    const fresh = subscribeDashboardPaintPresets(hassFor(connection), 'dashboard-a', vi.fn());
    await flush();
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(fresh.getSnapshot().presets).toEqual({ fresh: { color: 'blue' } });
    fresh.unsubscribe();
  });

  it('derives only the dashboard path shape demonstrated by the storage-mode PoC', () => {
    expect(dashboardPathFromLocation({ pathname: '/energy/overview' })).toBe('energy');
    expect(dashboardPathFromLocation({ pathname: '/' })).toBeNull();
  });
});
