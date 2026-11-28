const registriesByConnection = new WeakMap();
const REGISTRY_PATH = 'sbcp_fragments.paint_presets';
const MASTER_TYPE = 'custom:sensor-bar-card-plus';

function findMasters(config) {
  const masters = [];
  const visitCard = card => {
    if (!isRecord(card)) return;
    if (card.type === MASTER_TYPE && Object.hasOwn(card, 'preset_library')) masters.push(card);
    for (const key of ['cards', 'card', 'elements']) {
      const children = card[key];
      if (Array.isArray(children)) children.forEach(visitCard);
      else visitCard(children);
    }
  };
  const visitSection = section => {
    if (!isRecord(section)) return;
    section.cards?.forEach(visitCard);
    section.sections?.forEach(visitSection);
  };
  if (Array.isArray(config?.views)) {
    for (const view of config.views) {
      if (Array.isArray(view?.cards)) view.cards.forEach(visitCard);
      view?.sections?.forEach(visitSection);
      visitCard(view?.header?.card);
      visitCard(view?.footer?.card);
      view?.sidebar?.sections?.forEach(visitSection);
    }
  }
  return masters;
}

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function freezeClone(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeClone));
  if (!isRecord(value)) return value;
  const clone = {};
  for (const key of Object.keys(value)) {
    Object.defineProperty(clone, key, { value: freezeClone(value[key]), enumerable: true });
  }
  return Object.freeze(clone);
}

function freezeSnapshot({ dashboardPath, status, presets, conflicts = {}, libraryCount = 0, diagnostic, revision }) {
  return Object.freeze({
    dashboardPath,
    status,
    presets: freezeClone(presets),
    conflicts: freezeClone(conflicts),
    libraryCount,
    diagnostic: diagnostic ? Object.freeze({ ...diagnostic }) : null,
    revision,
  });
}

function emptySnapshot(dashboardPath = null, code = 'registry_unavailable', message = 'Dashboard paint presets are unavailable.') {
  return freezeSnapshot({ dashboardPath, status: 'empty', presets: {},
    diagnostic: { code, path: REGISTRY_PATH, message }, revision: 0 });
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function readPaintPresets(config) {
  const masters = findMasters(config);
  if (masters.length > 0) {
    const owners = new Map();
    for (const master of masters) {
      const library = master.preset_library;
      const paint = isRecord(library) && Object.hasOwn(library, 'paint') && isRecord(library.paint) ? library.paint : {};
      for (const name of Object.keys(paint)) {
        const definitions = owners.get(name) ?? [];
        definitions.push(paint[name]);
        owners.set(name, definitions);
      }
    }
    const presets = {};
    const conflicts = {};
    for (const [name, definitions] of owners) {
      if (definitions.length > 1) Object.defineProperty(conflicts, name, { value: definitions.length, enumerable: true });
      else Object.defineProperty(presets, name, { value: definitions[0], enumerable: true });
    }
    return { status: 'ready', presets, conflicts, libraryCount: masters.length, diagnostic: null };
  }
  const fragments = config?.sbcp_fragments;
  if (fragments === undefined) return { status: 'empty', presets: {}, diagnostic: {
    code: 'paint_presets_missing', path: REGISTRY_PATH, message: 'Dashboard has no sbcp_fragments.paint_presets registry.',
  } };
  if (!isRecord(fragments)) return { status: 'empty', presets: {}, diagnostic: {
    code: 'paint_fragments_malformed', path: 'sbcp_fragments', message: 'Dashboard sbcp_fragments must be an object.',
  } };
  const presets = fragments.paint_presets;
  if (presets === undefined) return { status: 'empty', presets: {}, diagnostic: {
    code: 'paint_presets_missing', path: REGISTRY_PATH, message: 'Dashboard has no sbcp_fragments.paint_presets registry.',
  } };
  if (!isRecord(presets)) return { status: 'empty', presets: {}, diagnostic: {
    code: 'paint_presets_malformed', path: REGISTRY_PATH, message: 'Dashboard paint_presets must be an object.',
  } };
  return { status: 'ready', presets, libraryCount: 0, diagnostic: null };
}

function report(entry, snapshot) {
  entry.snapshot = snapshot;
  for (const consumer of [...entry.consumers]) consumer.receive(snapshot);
}

function notify(consumer, snapshot) {
  consumer.snapshot = snapshot;
  try { consumer.onChange?.(snapshot); } catch { /* Consumer errors must not interrupt registry updates. */ }
}

function publish(entry, result) {
  const next = {
    dashboardPath: entry.dashboardPath,
    status: result.status,
    presets: result.presets,
    conflicts: result.conflicts ?? {},
    libraryCount: result.libraryCount ?? 0,
    diagnostic: result.diagnostic,
  };
  const current = entry.snapshot;
  if (current.status === next.status
    && current.diagnostic?.code === next.diagnostic?.code
    && current.diagnostic?.message === next.diagnostic?.message
    && current.libraryCount === next.libraryCount
    && stableValue(current.conflicts) === stableValue(next.conflicts)
    && stableValue(current.presets) === stableValue(next.presets)) return;
  report(entry, freezeSnapshot({ ...next, revision: current.revision + 1 }));
}

function releaseEventSubscription(entry) {
  const unsubscribe = entry.eventUnsubscribe;
  entry.eventUnsubscribe = null;
  try { Promise.resolve(unsubscribe?.()).catch(() => {}); } catch { /* Connection may already be closed. */ }
}

function requestRefresh(entry) {
  if (!entry.active || !entry.online || !entry.consumers.size) return Promise.resolve();
  entry.refreshGeneration += 1;
  if (entry.inflight) {
    entry.refreshQueued = true;
    return entry.inflight;
  }
  const generation = entry.refreshGeneration;
  entry.refreshQueued = false;
  const request = (async () => {
    try {
      const config = await entry.connection.sendMessagePromise({
        type: 'lovelace/config', url_path: entry.dashboardPath,
      });
      if (!entry.active || !entry.online || generation !== entry.refreshGeneration) return;
      publish(entry, readPaintPresets(config));
    } catch (error) {
      if (!entry.active || !entry.online || generation !== entry.refreshGeneration) return;
      publish(entry, { status: 'error', presets: {}, diagnostic: {
        code: 'dashboard_config_unavailable', path: REGISTRY_PATH,
        message: String(error?.message ?? error),
      } });
    }
  })();
  entry.inflight = request.finally(() => {
    if (entry.inflight !== wrapped) return;
    entry.inflight = null;
    if (entry.refreshQueued && entry.active && entry.online && entry.consumers.size) void requestRefresh(entry);
  });
  const wrapped = entry.inflight;
  return wrapped;
}

function stopEntry(entry) {
  if (!entry.active) return;
  entry.active = false;
  entry.refreshGeneration += 1;
  entry.eventGeneration += 1;
  releaseEventSubscription(entry);
  entry.connection.removeEventListener?.('disconnected', entry.onDisconnected);
  entry.connection.removeEventListener?.('ready', entry.onReady);
  const dashboards = registriesByConnection.get(entry.connection);
  if (dashboards?.get(entry.dashboardPath) === entry) dashboards.delete(entry.dashboardPath);
  if (!dashboards?.size) registriesByConnection.delete(entry.connection);
}

function startEventSubscription(entry) {
  if (!entry.active || !entry.online || !entry.consumers.size || entry.eventPending || entry.eventUnsubscribe) return;
  if (typeof entry.connection.subscribeEvents !== 'function') return;
  const generation = ++entry.eventGeneration;
  entry.eventPending = true;
  let request;
  try {
    request = entry.connection.subscribeEvents(event => {
      if (!entry.active || !entry.online || generation !== entry.eventGeneration) return;
      if (event?.event_type === 'lovelace_updated') void requestRefresh(entry);
    }, 'lovelace_updated');
  } catch (error) { request = Promise.reject(error); }
  Promise.resolve(request).then(unsubscribe => {
    if (!entry.active || !entry.online || generation !== entry.eventGeneration || !entry.consumers.size) {
      try { Promise.resolve(unsubscribe?.()).catch(() => {}); } catch { /* Connection may already be closed. */ }
      return;
    }
    entry.eventPending = false;
    entry.eventUnsubscribe = unsubscribe;
  }).catch(() => {
    if (generation === entry.eventGeneration) entry.eventPending = false;
  });
}

function setOnline(entry, online) {
  if (!entry.active || entry.online === online) return;
  entry.online = online;
  if (!online) {
    entry.eventGeneration += 1;
    entry.eventPending = false;
    entry.refreshGeneration += 1;
    entry.refreshQueued = false;
    releaseEventSubscription(entry);
    return;
  }
  startEventSubscription(entry);
  void requestRefresh(entry);
}

function getRegistry(connection, dashboardPath, online) {
  let dashboards = registriesByConnection.get(connection);
  if (!dashboards) {
    dashboards = new Map();
    registriesByConnection.set(connection, dashboards);
  }
  let entry = dashboards.get(dashboardPath);
  if (entry) {
    setOnline(entry, online);
    return entry;
  }
  entry = {
    connection, dashboardPath, consumers: new Set(), active: true, online,
    eventGeneration: 0, eventPending: false, eventUnsubscribe: null,
    refreshGeneration: 0, refreshQueued: false, inflight: null,
    snapshot: freezeSnapshot({ dashboardPath, status: 'loading', presets: {}, diagnostic: null, revision: 0 }),
  };
  entry.onDisconnected = () => setOnline(entry, false);
  entry.onReady = () => setOnline(entry, true);
  connection.addEventListener?.('disconnected', entry.onDisconnected);
  connection.addEventListener?.('ready', entry.onReady);
  dashboards.set(dashboardPath, entry);
  if (online) {
    startEventSubscription(entry);
    void requestRefresh(entry);
  }
  return entry;
}

function normalizedDashboardPath(dashboardPath) {
  if (typeof dashboardPath !== 'string') return null;
  const normalized = dashboardPath.split('/').filter(Boolean)[0] ?? '';
  return normalized || null;
}

export function dashboardPathFromLocation(locationLike = globalThis.location) {
  return normalizedDashboardPath(locationLike?.pathname ?? '');
}

export function subscribeDashboardPaintPresets(hass, dashboardPath, onChange) {
  const consumer = {
    onChange,
    entry: null,
    dashboardPath: null,
    snapshot: emptySnapshot(),
    receive(snapshot) { notify(this, snapshot); },
    getSnapshot() { return this.snapshot; },
    update(nextHass, nextDashboardPath = this.dashboardPath ?? dashboardPathFromLocation()) {
      const path = normalizedDashboardPath(nextDashboardPath);
      this.dashboardPath = path;
      const connection = nextHass?.connection;
      const online = Boolean(connection && connection.connected !== false && nextHass?.connected !== false);
      if (!connection || (typeof connection !== 'object' && typeof connection !== 'function')) {
        if (this.entry) this.unsubscribeEntry();
        notify(this, emptySnapshot(path, 'connection_unavailable', 'Home Assistant WebSocket connection is unavailable.'));
        return this.snapshot;
      }
      if (!path) {
        if (this.entry) this.unsubscribeEntry();
        notify(this, emptySnapshot(null, 'dashboard_unavailable', 'Dashboard URL path is unavailable.'));
        return this.snapshot;
      }
      const nextEntry = getRegistry(connection, path, online);
      if (nextEntry !== this.entry) {
        if (this.entry) this.unsubscribeEntry();
        this.entry = nextEntry;
        nextEntry.consumers.add(this);
        notify(this, nextEntry.snapshot);
        if (nextEntry.online && nextEntry.snapshot.status === 'loading') {
          startEventSubscription(nextEntry);
          if (!nextEntry.inflight) void requestRefresh(nextEntry);
        }
      }
      return this.snapshot;
    },
    unsubscribeEntry() {
      const entry = this.entry;
      this.entry = null;
      if (!entry) return;
      entry.consumers.delete(this);
      if (!entry.consumers.size) stopEntry(entry);
    },
    unsubscribe() {
      this.unsubscribeEntry();
      this.onChange = null;
      this.dashboardPath = null;
    },
  };
  consumer.update(hass, dashboardPath);
  return consumer;
}
