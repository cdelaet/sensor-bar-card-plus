import { describe, expect, it, vi } from 'vitest';
import { dashboardPathFromLocation, subscribeDashboardPaintPresets } from '../../src/dashboard/paint-preset-registry.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function createConnection(config = {}) {
  const listeners = new Map();
  const subscriptions = [];
  let response = config;
  const connection = {
    connected: true,
    sendMessagePromise: vi.fn(() => typeof response === 'function' ? response() : Promise.resolve(response)),
    subscribeEvents: vi.fn((callback, eventType) => {
      const subscription = { callback, eventType, stop: vi.fn() };
      subscriptions.push(subscription);
      return Promise.resolve(subscription.stop);
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

  it('isolates registries between dashboards and Home Assistant connections', async () => {
    const firstConnection = createConnection({ sbcp_fragments: { paint_presets: { one: { color: 'red' } } } });
    const secondConnection = createConnection({ sbcp_fragments: { paint_presets: { two: { color: 'blue' } } } });
    const first = subscribeDashboardPaintPresets(hassFor(firstConnection), 'dashboard-a', vi.fn());
    const otherDashboard = subscribeDashboardPaintPresets(hassFor(firstConnection), 'dashboard-b', vi.fn());
    const otherConnection = subscribeDashboardPaintPresets(hassFor(secondConnection), 'dashboard-a', vi.fn());
    await flush();

    expect(firstConnection.sendMessagePromise).toHaveBeenCalledTimes(2);
    expect(secondConnection.sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(first.getSnapshot().presets).toEqual({ one: { color: 'red' } });
    expect(otherDashboard.getSnapshot().presets).toEqual({ one: { color: 'red' } });
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
