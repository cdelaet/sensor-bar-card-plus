import { getSharedObservationService } from './observation-service.js';
import { historySourceKey } from './history-provider.js';
import { HistoricalValueResolver, normalizeValueSpec } from './value-resolver.js';

// A connection owns one event subscription regardless of the number of cards.
const connections = new WeakMap();
const RETRY_INITIAL_MS = 1000;
const RETRY_MAX_MS = 60000;

function authorizationFailure(error) {
  return ['unauthorized', 'forbidden', 'invalid_auth'].includes(String(error?.code ?? '').toLowerCase());
}

export function historicalConfigKey(rows) {
  return JSON.stringify(rows.map((row) => ({
    entity: row.entity, attribute: row.attribute,
    peak: { show: row.peak_marker?.show, reset: row.peak_marker?.reset },
    floor: { show: row.floor_marker?.show, reset: row.floor_marker?.reset },
    markers: row.generic_markers?.map((marker) => ({ id: marker.id, source: marker.source, accepted: marker.accepted })),
  })));
}

function releaseSubscription(unsubscribe) {
  try { Promise.resolve(unsubscribe?.()).catch(() => {}); } catch { /* Connection may already be closed. */ }
}

class ConnectionHistory {
  constructor(connection, hass) {
    this.connection = connection;
    this.service = getSharedObservationService(hass);
    this.hosts = new Set();
    this.sourceMap = new Map();
    this.lastStates = new Map();
    this.pendingEvents = [];
    this.pendingOverflow = false;
    this.subscriptionTimer = null;
    this.subscriptionDelay = RETRY_INITIAL_MS;
    this.subscribing = false;
    this.subscriptionPermanent = false;
    this.recoveryTimer = null;
    this.recoveryDelay = RETRY_INITIAL_MS;
    this.recoveryFlight = null;
    this.dirtySources = new Map();
    this.deniedSources = new Set();
    this.generation = 0;
    this.connectionEpoch = 0;
    this.online = connection.connected !== false && hass.connected !== false;
    this.ready = false;
    this.unsubscribe = null;
    this.onDisconnect = () => this.disconnect();
    this.onReady = () => this.reconnect();
    connection.addEventListener?.('disconnected', this.onDisconnect);
    connection.addEventListener?.('ready', this.onReady);
    if (this.online) this.subscribe();
  }

  updateSources() {
    const sources = new Map();
    for (const host of this.hosts) for (const entry of host.entries.values()) {
      sources.set(historySourceKey(entry.spec.source), entry.spec.source);
    }
    this.sourceMap = sources;
    for (const key of this.lastStates.keys()) if (!sources.has(key)) this.lastStates.delete(key);
    for (const key of this.dirtySources.keys()) if (!sources.has(key)) this.dirtySources.delete(key);
    for (const key of this.deniedSources) if (!sources.has(key)) this.deniedSources.delete(key);
    if (!this.dirtySources.size && this.recoveryTimer !== null) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  cancelTimers() {
    if (this.subscriptionTimer !== null) clearTimeout(this.subscriptionTimer);
    if (this.recoveryTimer !== null) clearTimeout(this.recoveryTimer);
    this.subscriptionTimer = null;
    this.recoveryTimer = null;
  }

  markDirty(source, changed = true) {
    const key = historySourceKey(source);
    if (!this.sourceMap.has(key) || this.deniedSources.has(key)) return;
    const previous = this.dirtySources.get(key);
    this.dirtySources.set(key, { source, version: (previous?.version ?? 0) + (changed ? 1 : 0) });
    this.scheduleRecovery();
  }

  acquisitionFailed(source, error) {
    const key = historySourceKey(source);
    if (authorizationFailure(error)) {
      this.deniedSources.add(key);
      this.dirtySources.delete(key);
    } else this.markDirty(source, false);
  }

  scheduleRecovery() {
    if (!this.online || !this.hosts.size || !this.dirtySources.size
      || this.recoveryTimer !== null || this.recoveryFlight) return;
    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = null;
      this.recover();
    }, this.recoveryDelay);
  }

  recover() {
    if (!this.online || !this.hosts.size || this.recoveryFlight || !this.dirtySources.size) return;
    const versions = new Map([...this.dirtySources].map(([key, item]) => [key, item.version]));
    const requests = new Map();
    for (const host of this.hosts) for (const entry of host.entries.values()) {
      const key = historySourceKey(entry.spec.source);
      if (!versions.has(key) || !entry.stop) continue;
      if ([...this.service.inflight.values()].some((flight) => flight.sourceKey === key)) continue;
      if (!requests.has(key)) requests.set(key, []);
      requests.get(key).push(Promise.resolve().then(() => entry.stop?.refresh() ?? null));
    }
    const generation = this.connectionEpoch;
    const flight = Promise.all([...requests].map(async ([key, promises]) => [key, await Promise.all(promises)]));
    this.recoveryFlight = flight;
    flight.then((results) => {
      if (!this.online || generation !== this.connectionEpoch) return;
      let failed = false;
      for (const [key, version] of versions) {
        const current = this.dirtySources.get(key);
        if (!current || current.version !== version) continue;
        const records = results.find(([resultKey]) => resultKey === key)?.[1] ?? [];
        if (records.some((record) => authorizationFailure(record?.error))) {
          this.deniedSources.add(key);
          this.dirtySources.delete(key);
        } else if (!records.length || records.some((record) => !record || record.stale || record.error || !record.acquiredWindow)) {
          failed = true;
        } else this.dirtySources.delete(key);
      }
      this.recoveryDelay = failed ? Math.min(this.recoveryDelay * 2, RETRY_MAX_MS) : RETRY_INITIAL_MS;
    }).catch(() => { this.recoveryDelay = Math.min(this.recoveryDelay * 2, RETRY_MAX_MS); }).finally(() => {
      if (this.recoveryFlight === flight) {
        this.recoveryFlight = null;
        this.scheduleRecovery();
      }
    });
  }

  scheduleSubscriptionRetry() {
    if (!this.online || !this.hosts.size || this.subscriptionPermanent || this.subscribing
      || this.subscriptionTimer !== null) return;
    this.subscriptionTimer = setTimeout(() => {
      this.subscriptionTimer = null;
      this.subscribe();
    }, this.subscriptionDelay);
    this.subscriptionDelay = Math.min(this.subscriptionDelay * 2, RETRY_MAX_MS);
  }

  disconnect() {
    if (!this.online) return;
    this.online = false;
    this.ready = false;
    this.generation += 1;
    this.connectionEpoch += 1;
    this.cancelTimers();
    this.subscribing = false;
    this.recoveryFlight = null;
    this.dirtySources.clear();
    this.deniedSources.clear();
    releaseSubscription(this.unsubscribe);
    this.unsubscribe = null;
    this.lastStates.clear();
    this.pendingEvents = [];
    this.pendingOverflow = false;
    this.service.invalidate({ sources: [...this.sourceMap.values()] });
  }

  reconnect() {
    if (this.online) return;
    this.online = true;
    this.subscribe();
  }

  subscribe() {
    if (this.subscribing || !this.online) return;
    this.subscribing = true;
    const generation = ++this.generation;
    const deliver = (event) => {
      if (!this.online || generation !== this.generation) return;
      const entity = event?.data?.entity_id;
      const state = event?.data?.new_state ?? (event?.time_fired
        ? { state: 'unavailable', attributes: {}, last_updated: event.time_fired } : null);
      if (!entity || !state || ![...this.sourceMap.values()].some((source) => source.entityId === entity)) return;
      if (this.ready) this.deliver(entity, state);
      else if (this.pendingEvents.length < this.service.maxConsumerObservations) this.pendingEvents.push({ entity, state });
      else this.pendingOverflow = true;
    };
    let request;
    try {
      if (typeof this.connection.subscribeMessage === 'function') {
        request = this.connection.subscribeMessage(deliver,
          { type: 'subscribe_events', event_type: 'state_changed' }, { resubscribe: false });
      } else if (typeof this.connection.subscribeEvents === 'function') {
        request = this.connection.subscribeEvents(deliver, 'state_changed');
      }
    } catch (error) { request = Promise.reject(error); }
    if (!request) {
      this.subscribing = false;
      this.subscriptionPermanent = true;
      this.ready = true;
      for (const host of this.hosts) host.activate(true);
      return;
    }
    Promise.resolve(request).then((unsubscribe) => {
      if (!this.online || generation !== this.generation || !this.hosts.size) {
        releaseSubscription(unsubscribe);
        return;
      }
      this.unsubscribe = unsubscribe;
      this.subscribing = false;
      this.subscriptionPermanent = false;
      this.subscriptionDelay = RETRY_INITIAL_MS;
      const recovering = this.ready;
      if (recovering || this.pendingOverflow) {
        this.service.invalidate({ sources: [...this.sourceMap.values()] });
      }
      this.ready = true;
      for (const host of this.hosts) host.activate(!recovering);
      for (const { entity, state } of this.pendingEvents) this.deliver(entity, state);
      this.pendingEvents = [];
      if (recovering || this.pendingOverflow) for (const source of this.sourceMap.values()) this.markDirty(source);
      this.pendingOverflow = false;
    }).catch((error) => {
      if (!this.online || generation !== this.generation) return;
      this.generation += 1;
      this.subscribing = false;
      this.subscriptionPermanent = authorizationFailure(error);
      const initialFailure = !this.ready;
      if (initialFailure || this.pendingEvents.length || this.pendingOverflow) {
        this.service.invalidate({ sources: [...this.sourceMap.values()] });
      }
      this.ready = true;
      for (const host of this.hosts) host.activate(initialFailure);
      for (const { entity, state } of this.pendingEvents) this.deliver(entity, state);
      this.pendingEvents = [];
      this.pendingOverflow = false;
      this.scheduleSubscriptionRetry();
    });
  }

  deliver(entity, state, uncertain = false) {
    for (const [key, source] of this.sourceMap) {
      if (source.entityId !== entity) continue;
      const signature = JSON.stringify([state.last_updated, state.last_changed, state.state,
        source.attribute ? state.attributes?.[source.attribute] : null]);
      if (this.lastStates.get(key) === signature) continue;
      this.lastStates.set(key, signature);
      if (uncertain) {
        this.service.invalidate({ sources: [source] });
        this.markDirty(source);
      }
      this.service.ingestLiveState({ source, state });
    }
  }

  update(hass) {
    const connected = typeof this.connection.connected === 'boolean' ? this.connection.connected : hass.connected;
    if (connected === false) this.disconnect();
    else if (connected === true && !this.online) this.reconnect();
    if (this.online && this.ready && !this.unsubscribe) {
      for (const entity of new Set([...this.sourceMap.values()].map((source) => source.entityId))) {
        const state = hass.states?.[entity];
        if (state) this.deliver(entity, state, true);
      }
    }
  }

  close() {
    this.online = false;
    this.ready = false;
    this.generation += 1;
    this.connectionEpoch += 1;
    this.cancelTimers();
    this.subscribing = false;
    this.dirtySources.clear();
    this.deniedSources.clear();
    releaseSubscription(this.unsubscribe);
    this.unsubscribe = null;
    this.connection.removeEventListener?.('disconnected', this.onDisconnect);
    this.connection.removeEventListener?.('ready', this.onReady);
    this.lastStates.clear();
    this.pendingEvents = [];
    connections.delete(this.connection);
  }
}

// Internal Phase 2B handoff: setConsumers([{ id, spec }], onChange), getResult(id).
export class HistoricalHostRuntime {
  constructor() {
    this.entries = new Map();
    this.results = new Map();
    this.attached = false;
    this.hass = null;
    this.hub = null;
    this.onChange = null;
  }

  setConsumers(consumers, onChange = this.onChange) {
    const next = new Map();
    for (const { id, spec } of consumers) {
      if (typeof id !== 'string' || !id || next.has(id)) throw new TypeError('Historical consumer IDs must be unique strings');
      const normalized = normalizeValueSpec(spec);
      const signature = JSON.stringify(normalized);
      const old = this.entries.get(id);
      next.set(id, old?.signature === signature ? old : { id, spec: normalized, signature, stop: null });
    }
    for (const [id, old] of this.entries) {
      if (next.get(id) !== old) { old.stop?.(); this.results.delete(id); }
    }
    this.entries = next;
    this.onChange = onChange;
    this.sync();
  }

  getResult(id) { return this.results.get(id) ?? null; }

  setHass(hass) {
    const previousConnection = this.hass?.connection;
    this.hass = hass;
    for (const entry of this.entries.values()) if (entry.context) entry.context.hass = hass;
    if (previousConnection !== hass?.connection) this.leave();
    this.sync();
    this.hub?.update(hass);
  }

  attach() { this.attached = true; this.sync(); }
  detach() { this.attached = false; this.leave(); }

  sync() {
    if (!this.attached || !this.entries.size || !this.hass?.connection || typeof this.hass.connection !== 'object') {
      this.leave();
      return;
    }
    if (!this.hub) {
      const connection = this.hass.connection;
      let hub = connections.get(connection);
      if (!hub) { hub = new ConnectionHistory(connection, this.hass); connections.set(connection, hub); }
      this.hub = hub;
      hub.hosts.add(this);
    }
    this.hub.updateSources();
    if (this.hub.ready) this.activate(false);
  }

  activate(revalidate) {
    if (!this.attached || !this.hub?.online || !this.hub.ready) return;
    const resolver = new HistoricalValueResolver({ service: this.hub.service });
    for (const entry of this.entries.values()) {
      if (entry.starting) continue;
      if (entry.stop) {
        if (revalidate) entry.stop.refresh();
        continue;
      }
      const context = { hass: this.hass };
      entry.context = context;
      const current = entry;
      const hub = this.hub;
      entry.starting = true;
      const stop = resolver.watch(entry.spec, context, (result) => {
        if (this.attached && this.entries.get(entry.id) === current && this.hub) {
          this.results.set(entry.id, result);
          if (result.provenance?.error && this.hub?.online) this.hub.acquisitionFailed(entry.spec.source, result.provenance.error);
          try { this.onChange?.(entry.id, result); } catch { /* Isolate host callbacks. */ }
        }
      });
      entry.starting = false;
      if (this.attached && this.entries.get(entry.id) === current && this.hub === hub) entry.stop = stop;
      else stop();
    }
  }

  leave() {
    for (const entry of this.entries.values()) { entry.stop?.(); entry.stop = null; entry.context = null; }
    this.results.clear();
    if (!this.hub) return;
    const hub = this.hub;
    this.hub = null;
    hub.hosts.delete(this);
    if (!hub.hosts.size) hub.close();
    else hub.updateSources();
  }
}
