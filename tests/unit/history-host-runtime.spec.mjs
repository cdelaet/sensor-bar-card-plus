import { describe, expect, it, vi } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
import { HistoricalHostRuntime } from '../../src/history/host-runtime.js';

const entity = 'sensor.temperature';
const spec = (calculation = 'max', source = entity) => ({ source: { entityId: source }, calculation,
  window: { kind: 'rolling', duration: { amount: 1, unit: 'hour' } } });

function connectionFixture() {
  const listeners = new Map();
  const subscriptions = [];
  const connection = {
    connected: true,
    addEventListener: vi.fn((name, callback) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); }),
    removeEventListener: vi.fn((name, callback) => listeners.get(name)?.delete(callback)),
    subscribeMessage: vi.fn(async (callback, message, options) => {
      const subscription = { callback, active: true, unsubscribe: vi.fn(() => { subscription.active = false; }) };
      subscriptions.push(subscription);
      expect(message).toEqual({ type: 'subscribe_events', event_type: 'state_changed' });
      expect(options).toEqual({ resubscribe: false });
      return subscription.unsubscribe;
    }),
    emit(name) { for (const listener of listeners.get(name) ?? []) listener(connection); },
    change(id, state) { for (const sub of subscriptions) if (sub.active) sub.callback({ data: { entity_id: id, new_state: state } }); },
    listeners,
    subscriptions,
  };
  const callWS = vi.fn(async (request) => Object.fromEntries(request.entity_ids.map((id) => [id, [
    { s: '5', lu: (Date.now() - 10_000) / 1000 },
  ]])));
  const hass = { connection, connected: true, callWS, config: { time_zone: 'UTC' }, locale: { language: 'en-GB' }, states: {} };
  return { connection, hass, callWS };
}

function hosts() {
  const { card: Card, feature: Feature } = loadCardClass();
  const card = () => {
    const element = new Card();
    element._render = () => {}; element._logDiagnostics = () => {};
    element._setupResizeObserver = () => {}; element._schedulePostLayoutDensityPass = () => {};
    element._attachRowActionHandlers = () => {};
    element.setConfig({ entity });
    return element;
  };
  const feature = () => {
    const element = new Feature();
    element._render = () => {};
    element.setConfig({ entity });
    return element;
  };
  return { card, feature };
}

const register = (host, id = 'peak', valueSpec = spec(), callback = vi.fn()) => {
  host._historicalRuntime.setConsumers([{ id, spec: valueSpec }], callback);
  return callback;
};
const awaitValue = async (host, id = 'peak', value = 5) => vi.waitFor(() => expect(host._historicalRuntime.getResult(id)?.value).toBe(value));
const state = (value, timestamp = Date.now() - 1000) => ({ state: String(value), attributes: {}, last_updated: new Date(timestamp).toISOString() });

describe('historical runtime host integration', () => {
  it('shares one subscription, acquisition and journal across two cards and disposes independently', async () => {
    const { card } = hosts(); const a = card(); const b = card(); const { connection, hass, callWS } = connectionFixture();
    a.hass = hass; b.hass = hass; register(a); register(b, 'floor', spec('min'));
    a.connectedCallback(); b.connectedCallback();
    await awaitValue(a); await awaitValue(b, 'floor');
    expect(a._historicalRuntime.hub).toBe(b._historicalRuntime.hub);
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(callWS).toHaveBeenCalledTimes(1);
    const service = a._historicalRuntime.hub.service;
    expect(service.journals.size).toBe(1);
    a.disconnectedCallback();
    expect(connection.subscriptions[0].active).toBe(true);
    expect(service.consumers.size).toBe(1);
    b.disconnectedCallback();
    expect(service.consumers.size).toBe(0);
    expect(connection.subscriptions[0].active).toBe(false);
    expect(connection.listeners.get('ready').size).toBe(0);
    expect(connection.listeners.get('disconnected').size).toBe(0);
  });

  it('shares the same service between card and feature and keeps existing presentation untouched', async () => {
    const { card, feature } = hosts(); const a = card(); const b = feature(); const { hass, connection, callWS } = connectionFixture();
    a.hass = hass; b.hass = hass; register(a); register(b, 'floor', spec('min'));
    a.connectedCallback(); b.connectedCallback();
    await awaitValue(a); await awaitValue(b, 'floor');
    expect(a._historicalRuntime.hub).toBe(b._historicalRuntime.hub);
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(callWS).toHaveBeenCalledTimes(1);
    expect(b._extrema).toEqual({});
    a.disconnectedCallback(); b.disconnectedCallback();
  });

  it('delivers numeric and unavailable transitions once and ignores duplicate snapshots and unrelated events', async () => {
    const { card, feature } = hosts(); const a = card(); const b = feature(); const { hass, connection, callWS } = connectionFixture();
    a.hass = hass; b.hass = hass; register(a); register(b, 'floor', spec('min'));
    a.connectedCallback(); b.connectedCallback(); await awaitValue(a); await awaitValue(b, 'floor');
    const service = a._historicalRuntime.hub.service;
    const ingest = vi.spyOn(service, 'ingestLiveState');
    const newState = state(9);
    connection.change('sensor.unrelated', newState); connection.change(entity, newState); connection.change(entity, newState);
    a.hass = { ...hass, states: { [entity]: newState } }; b.hass = { ...hass, states: { [entity]: newState } };
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(a._historicalRuntime.getResult('peak').value).toBe(9);
    connection.change(entity, state('unavailable', Date.now() - 500));
    expect(ingest).toHaveBeenCalledTimes(2);
    expect([...service.journals.values()][0].observations.at(-1).value).toBeNull();
    expect(callWS).toHaveBeenCalledTimes(1);
    a.disconnectedCallback(); b.disconnectedCallback();
  });

  it('invalidates once on interruption and revalidates shared consumers after subscription recovery', async () => {
    const { card, feature } = hosts(); const a = card(); const b = feature(); const { hass, connection, callWS } = connectionFixture();
    a.hass = hass; b.hass = hass; register(a); register(b, 'floor', spec('min'));
    a.connectedCallback(); b.connectedCallback(); await awaitValue(a); await awaitValue(b, 'floor');
    connection.connected = false; connection.emit('disconnected'); connection.emit('disconnected');
    expect(a._historicalRuntime.getResult('peak').status).toBe('stale');
    connection.connected = true; connection.emit('ready'); connection.emit('ready');
    await vi.waitFor(() => expect(callWS).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(a._historicalRuntime.getResult('peak').freshness.stale).toBe(false));
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
    expect(connection.subscriptions.filter((item) => item.active)).toHaveLength(1);
    a.disconnectedCallback(); b.disconnectedCallback();
  });

  it('reattaches cleanly and removes consumers on entity configuration changes', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    a.hass = hass; register(a); a.connectedCallback(); await awaitValue(a);
    a.disconnectedCallback(); a.connectedCallback(); await awaitValue(a);
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
    a.setConfig({ entity: 'sensor.other' });
    expect(a._historicalRuntime.entries.size).toBe(0);
    expect(a._historicalRuntime.getResult('peak')).toBeNull();
    register(a, 'peak', spec('max', 'sensor.other')); await awaitValue(a);
    a.disconnectedCallback();
  });

  it('replaces the connection without retaining callbacks or listeners on the old one', async () => {
    const { card } = hosts(); const a = card(); const old = connectionFixture(); const next = connectionFixture();
    a.hass = old.hass; const callback = register(a); a.connectedCallback(); await awaitValue(a);
    a.hass = next.hass; await awaitValue(a);
    expect(old.connection.listeners.get('ready').size).toBe(0);
    const count = callback.mock.calls.length;
    old.connection.change(entity, state(99));
    expect(callback).toHaveBeenCalledTimes(count);
    expect(next.connection.subscribeMessage).toHaveBeenCalledTimes(1);
    a.disconnectedCallback();
  });

  it('retains live updates during Recorder acquisition and suppresses delivery after disposal', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    let finish;
    hass.callWS = vi.fn((request) => new Promise((resolve) => { finish = () => resolve({ [entity]: [{ s: '5', lu: (Date.now() - 10_000) / 1000 }] }); }));
    a.hass = hass; const callback = register(a); a.connectedCallback();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    connection.change(entity, state(9)); finish(); await awaitValue(a, 'peak', 9);
    a.disconnectedCallback(); const calls = callback.mock.calls.length;
    connection.change(entity, state(20)); await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(calls);
  });

  it('disposes an in-flight subscription and suppresses obsolete acquisition callbacks', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    let finish; const unsubscribe = vi.fn();
    connection.subscribeMessage = vi.fn(() => new Promise((resolve) => { finish = () => resolve(unsubscribe); }));
    a.hass = hass; const callback = register(a); a.connectedCallback(); a.disconnectedCallback();
    finish(); await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce());
    expect(callback).not.toHaveBeenCalled();
    expect(connection.listeners.get('ready').size).toBe(0);
  });
  it('updates specifications without recreating unchanged consumers or listeners', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection, callWS } = connectionFixture();
    a.hass = hass; register(a); a.connectedCallback(); await awaitValue(a);
    const consumer = a._historicalRuntime.entries.get('peak');
    register(a); register(a);
    expect(a._historicalRuntime.entries.get('peak')).toBe(consumer);
    expect(callWS).toHaveBeenCalledTimes(1);
    a._historicalRuntime.setConsumers([{ id: 'peak', spec: { ...spec(), window: { kind: 'rolling', duration: { amount: 2, unit: 'hour' } } } }]);
    await vi.waitFor(() => expect(callWS).toHaveBeenCalledTimes(2));
    expect(a._historicalRuntime.entries.get('peak')).not.toBe(consumer);
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    a._historicalRuntime.setConsumers([]);
    expect(a._historicalRuntime.hub).toBeNull();
    expect(connection.subscriptions[0].active).toBe(false);
    a.disconnectedCallback();
  });

  it('cleans up old feature consumers after a context entity changes and on reattachment', async () => {
    const { feature } = hosts(); const a = feature(); const { hass, connection } = connectionFixture();
    a.setConfig({}); a.context = { entity_id: entity }; a.hass = hass; register(a); a.connectedCallback();
    await awaitValue(a);
    a.disconnectedCallback(); a.connectedCallback(); await awaitValue(a);
    a.context = { entity_id: 'sensor.other' };
    expect(a._historicalRuntime.entries.size).toBe(0);
    expect(connection.subscriptions.at(-1).active).toBe(false);
    register(a, 'peak', spec('max', 'sensor.other')); await awaitValue(a);
    a.disconnectedCallback();
  });

  it('suppresses a delayed Recorder response after detach or specification replacement', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    const pending = [];
    hass.callWS = vi.fn((request) => new Promise((resolve) => pending.push({ request, resolve })));
    a.hass = hass; const callback = register(a); a.connectedCallback();
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    a._historicalRuntime.setConsumers([{ id: 'peak', spec: spec('max', 'sensor.other') }], callback);
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1].resolve({ 'sensor.other': [{ s: '8', lu: (Date.now() - 10_000) / 1000 }] });
    await awaitValue(a, 'peak', 8);
    pending[0].resolve({ [entity]: [{ s: '99', lu: (Date.now() - 10_000) / 1000 }] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(a._historicalRuntime.getResult('peak').value).toBe(8);
    a._historicalRuntime.setConsumers([{ id: 'peak', spec: spec() }], callback);
    await vi.waitFor(() => expect(pending).toHaveLength(3));
    a.disconnectedCallback(); const calls = callback.mock.calls.length;
    pending[2].resolve({ [entity]: [{ s: '77', lu: (Date.now() - 10_000) / 1000 }] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callback).toHaveBeenCalledTimes(calls);
    expect(connection.listeners.get('ready').size).toBe(0);
  });

  it('marks snapshot-only updates stale without querying Recorder for every update', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection, callWS } = connectionFixture();
    delete connection.subscribeMessage;
    a.hass = hass; register(a); a.connectedCallback(); await awaitValue(a);
    const next = state(9);
    a.hass = { ...hass, states: { [entity]: next } };
    expect(a._historicalRuntime.getResult('peak').status).toBe('stale');
    a.hass = { ...hass, states: { [entity]: next } };
    expect(callWS).toHaveBeenCalledTimes(1);
    a.disconnectedCallback();
  });

  it('keeps historical consumers across presentation-only configuration edits', async () => {
    const { card, feature } = hosts(); const a = card(); const b = feature(); const { hass, callWS, connection } = connectionFixture();
    a.hass = hass; b.hass = hass; register(a); register(b, 'floor', spec('min'));
    a.connectedCallback(); b.connectedCallback(); await awaitValue(a); await awaitValue(b, 'floor');
    const aEntry = a._historicalRuntime.entries.get('peak'); const bEntry = b._historicalRuntime.entries.get('floor');
    a.setConfig({ entity, title: 'Updated' }); b.setConfig({ entity, bar: { animated: false } });
    expect(a._historicalRuntime.entries.get('peak')).toBe(aEntry);
    expect(b._historicalRuntime.entries.get('floor')).toBe(bEntry);
    expect(callWS).toHaveBeenCalledTimes(1);
    expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    a.disconnectedCallback(); b.disconnectedCallback();
  });

  it('ignores late events from an obsolete connection subscription after reconnect', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    a.hass = hass; register(a); a.connectedCallback(); await awaitValue(a);
    const oldSubscription = connection.subscriptions[0];
    connection.connected = false; connection.emit('disconnected');
    connection.connected = true; connection.emit('ready');
    await vi.waitFor(() => expect(connection.subscriptions).toHaveLength(2));
    await vi.waitFor(() => expect(a._historicalRuntime.getResult('peak')?.freshness.stale).toBe(false));
    oldSubscription.callback({ data: { entity_id: entity, new_state: state(99) } });
    expect(a._historicalRuntime.getResult('peak').value).toBe(5);
    a.disconnectedCallback();
  });

  it('retains a relevant event delivered before the subscription acknowledgement', async () => {
    const { card } = hosts(); const a = card(); const { hass, connection } = connectionFixture();
    let acknowledge; let deliver; let finishHistory;
    connection.subscribeMessage = vi.fn((callback) => {
      deliver = callback;
      return new Promise((resolve) => { acknowledge = () => resolve(vi.fn()); });
    });
    hass.callWS = vi.fn(() => new Promise((resolve) => { finishHistory = () => resolve({
      [entity]: [{ s: '5', lu: (Date.now() - 10_000) / 1000 }],
    }); }));
    a.hass = hass; register(a); a.connectedCallback();
    deliver({ data: { entity_id: entity, new_state: state(12) } });
    acknowledge();
    await vi.waitFor(() => expect(finishHistory).toBeTypeOf('function'));
    finishHistory();
    await awaitValue(a, 'peak', 12);
    a.disconnectedCallback();
  });

  it('reconciles buffered events on subscription rejection and retries once for both hosts', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      let rejectFirst; let deliverFirst;
      connection.subscribeMessage = vi.fn((callback) => {
        if (connection.subscribeMessage.mock.calls.length === 1) {
          deliverFirst = callback;
          return new Promise((_, reject) => { rejectFirst = reject; });
        }
        return Promise.resolve(vi.fn());
      });
      const a = new HistoricalHostRuntime(); const b = new HistoricalHostRuntime();
      a.setHass(hass); b.setHass(hass);
      a.setConsumers([{ id: 'peak', spec: spec() }]); b.setConsumers([{ id: 'floor', spec: spec('min') }]);
      a.attach(); b.attach();
      const order = [];
      const ingest = a.hub.service.ingestLiveState.bind(a.hub.service);
      vi.spyOn(a.hub.service, 'ingestLiveState').mockImplementation((args) => { order.push('live'); return ingest(args); });
      const getHistory = callWS.getMockImplementation();
      callWS.mockImplementation((request) => { order.push('recorder'); return getHistory(request); });
      deliverFirst({ data: { entity_id: entity, new_state: state(12) } });
      rejectFirst(new Error('temporary'));
      await vi.advanceTimersByTimeAsync(0);
      expect(callWS).toHaveBeenCalledTimes(1);
      expect(order.slice(0, 2)).toEqual(['live', 'recorder']);
      expect(a.getResult('peak').value).toBe(12);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      expect(b.getResult('floor').value).toBe(5);
      connection.emit('ready'); connection.emit('ready');
      await vi.advanceTimersByTimeAsync(1000);
      expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
      expect(a.getResult('peak').status).toBe('stale');
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(2);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      expect(a.getResult('peak').value).toBe(12);
      a.detach(); b.detach();
    } finally { vi.useRealTimers(); }
  });

  it('retries failed Recorder recovery without another disconnect and preserves stale status', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      const a = new HistoricalHostRuntime(); const b = new HistoricalHostRuntime();
      a.setHass(hass); b.setHass(hass);
      a.setConsumers([{ id: 'peak', spec: spec() }]); b.setConsumers([{ id: 'floor', spec: spec('min') }]);
      a.attach(); b.attach(); await vi.advanceTimersByTimeAsync(0);
      callWS.mockRejectedValueOnce(new Error('temporary Recorder error'));
      callWS.mockRejectedValueOnce(new Error('temporary Recorder error'));
      connection.connected = false; connection.emit('disconnected');
      connection.connected = true; connection.emit('ready');
      await vi.advanceTimersByTimeAsync(0);
      expect(callWS).toHaveBeenCalledTimes(2);
      expect(a.getResult('peak').status).toBe('stale');
      expect(a.getResult('peak').provenance.error).toBeTruthy();
      await vi.advanceTimersByTimeAsync(999);
      expect(callWS).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(callWS).toHaveBeenCalledTimes(3);
      expect(a.getResult('peak').status).toBe('stale');
      await vi.advanceTimersByTimeAsync(1999);
      expect(callWS).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      expect(callWS).toHaveBeenCalledTimes(4);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      expect(b.getResult('floor').freshness.stale).toBe(false);
      a.detach(); b.detach();
    } finally { vi.useRealTimers(); }
  });

  it('coalesces uncertain snapshots, stops on permission denial, and recovers history', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      connection.subscribeMessage = vi.fn().mockRejectedValue({ code: 'unauthorized' });
      const a = new HistoricalHostRuntime(); const b = new HistoricalHostRuntime();
      const peak = vi.fn(); const floor = vi.fn();
      a.setHass(hass); b.setHass(hass);
      a.setConsumers([{ id: 'peak', spec: spec() }], peak);
      b.setConsumers([{ id: 'floor', spec: spec('min') }], floor);
      a.attach(); b.attach();
      await vi.advanceTimersByTimeAsync(0);
      const one = state(8); const two = state(9);
      const merge = vi.spyOn(a.hub.service, '_mergeIntoConsumer');
      peak.mockClear(); floor.mockClear();
      a.setHass({ ...hass, states: { [entity]: one } });
      expect(merge).toHaveBeenCalledTimes(1);
      expect(peak.mock.calls.at(-1)[1].value).toBe(8);
      expect(floor.mock.calls.at(-1)[1].value).toBe(5);
      a.setHass({ ...hass, states: { [entity]: two } });
      a.setHass({ ...hass, states: { [entity]: two } });
      expect(a.getResult('peak').status).toBe('stale');
      expect(callWS).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(2);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      expect(a.getResult('peak').status).toBe('partial');
      await vi.advanceTimersByTimeAsync(5000);
      expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
      expect(callWS).toHaveBeenCalledTimes(2);
      a.detach();
      expect(b.hub).not.toBeNull();
      b.detach();
    } finally { vi.useRealTimers(); }
  });

  it('cancels shared retries on disconnect, replacement and final disposal', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const first = connectionFixture(); const replacement = connectionFixture();
      first.connection.subscribeMessage = vi.fn().mockRejectedValue(new Error('offline'));
      replacement.connection.subscribeMessage = vi.fn().mockRejectedValue(new Error('offline'));
      const a = new HistoricalHostRuntime(); const b = new HistoricalHostRuntime();
      a.setHass(first.hass); b.setHass(first.hass);
      a.setConsumers([{ id: 'peak', spec: spec() }]); b.setConsumers([{ id: 'floor', spec: spec('min') }]);
      a.attach(); b.attach(); await vi.advanceTimersByTimeAsync(0);
      first.connection.connected = false; first.connection.emit('disconnected');
      await vi.advanceTimersByTimeAsync(5000);
      expect(first.connection.subscribeMessage).toHaveBeenCalledTimes(1);
      a.setHass(replacement.hass); b.detach(); await vi.advanceTimersByTimeAsync(0);
      expect(replacement.connection.subscribeMessage).toHaveBeenCalledTimes(1);
      a.detach();
      await vi.advanceTimersByTimeAsync(5000);
      expect(first.connection.subscribeMessage).toHaveBeenCalledTimes(1);
      expect(replacement.connection.subscribeMessage).toHaveBeenCalledTimes(1);
      expect(replacement.callWS).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });

  it('recovers a failed snapshot revalidation and cancels retries after disposal', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      delete connection.subscribeMessage;
      const a = new HistoricalHostRuntime();
      a.setHass(hass); a.setConsumers([{ id: 'peak', spec: spec() }]); a.attach();
      await vi.advanceTimersByTimeAsync(0);
      callWS.mockRejectedValueOnce(new Error('offline'));
      a.setHass({ ...hass, states: { [entity]: state(9) } });
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(2);
      expect(a.getResult('peak').status).toBe('stale');
      await vi.advanceTimersByTimeAsync(2000);
      expect(callWS).toHaveBeenCalledTimes(3);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      callWS.mockRejectedValueOnce(new Error('offline'));
      a.setHass({ ...hass, states: { [entity]: state(11) } });
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(4);
      a.detach();
      await vi.advanceTimersByTimeAsync(5000);
      expect(callWS).toHaveBeenCalledTimes(4);
    } finally { vi.useRealTimers(); }
  });

  it('does not repeatedly retry a known Recorder authorization denial', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      delete connection.subscribeMessage;
      callWS.mockRejectedValue({ code: 'unauthorized' });
      const a = new HistoricalHostRuntime();
      a.setHass(hass); a.setConsumers([{ id: 'peak', spec: spec() }]); a.attach();
      await vi.advanceTimersByTimeAsync(0);
      a.setHass({ ...hass, states: { [entity]: state(8) } });
      a.setHass({ ...hass, states: { [entity]: state(9) } });
      await vi.advanceTimersByTimeAsync(10000);
      expect(callWS).toHaveBeenCalledTimes(1);
      a.detach();
    } finally { vi.useRealTimers(); }
  });

  it('coalesces snapshots arriving during recovery without a concurrent acquisition', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection, callWS } = connectionFixture();
      delete connection.subscribeMessage;
      const a = new HistoricalHostRuntime();
      a.setHass(hass); a.setConsumers([{ id: 'peak', spec: spec() }]); a.attach();
      await vi.advanceTimersByTimeAsync(0);
      let finish;
      callWS.mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve({
        [entity]: [{ s: '5', lu: (Date.now() - 10000) / 1000 }],
      }); }));
      a.setHass({ ...hass, states: { [entity]: state(7) } });
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(2);
      a.setHass({ ...hass, states: { [entity]: state(8) } });
      a.setHass({ ...hass, states: { [entity]: state(9) } });
      await vi.advanceTimersByTimeAsync(2000);
      expect(callWS).toHaveBeenCalledTimes(2);
      finish(); await vi.advanceTimersByTimeAsync(0);
      expect(a.getResult('peak').status).toBe('stale');
      await vi.advanceTimersByTimeAsync(1000);
      expect(callWS).toHaveBeenCalledTimes(3);
      expect(a.getResult('peak').freshness.stale).toBe(false);
      expect(a.getResult('peak').value).toBe(9);
      a.detach();
    } finally { vi.useRealTimers(); }
  });

  it('backs off repeated subscription failures without parallel attempts', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-13T10:00:00Z'));
    try {
      const { hass, connection } = connectionFixture();
      connection.subscribeMessage = vi.fn().mockRejectedValue(new Error('temporary'));
      const a = new HistoricalHostRuntime();
      a.setHass(hass); a.setConsumers([{ id: 'peak', spec: spec() }]); a.attach();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
      connection.emit('ready'); connection.emit('ready');
      await vi.advanceTimersByTimeAsync(1999);
      expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(connection.subscribeMessage).toHaveBeenCalledTimes(3);
      a.detach();
    } finally { vi.useRealTimers(); }
  });

});
