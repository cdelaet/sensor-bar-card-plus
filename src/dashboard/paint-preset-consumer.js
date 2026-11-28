import { dashboardPathFromLocation, subscribeDashboardPaintPresets } from './paint-preset-registry.js';

// The host decides when to subscribe and what to refresh after a snapshot changes.
export function syncPaintPresetConsumer(host, onSnapshot) {
  const path = dashboardPathFromLocation();
  if (host._paintPresetHandle) {
    host._paintPresetHandle.update(host._hass, path);
    return;
  }

  let handle;
  const publish = snapshot => {
    if (!handle || host._paintPresetHandle !== handle || host._paintPresetRegistry === snapshot) return;
    host._paintPresetRegistry = snapshot;
    onSnapshot(handle);
  };
  // Subscription creation notifies synchronously. Apply that snapshot once the
  // handle is installed so immediate and deferred effects have the same owner.
  handle = subscribeDashboardPaintPresets(host._hass, path, publish);
  host._paintPresetHandle = handle;
  try { publish(handle.getSnapshot()); } catch { /* Match the registry's isolation of consumer errors. */ }
}

export function releasePaintPresetConsumer(host, snapshot = { status: 'loading', presets: {} }) {
  const handle = host._paintPresetHandle;
  host._paintPresetHandle = null;
  host._paintPresetRegistry = snapshot;
  handle?.unsubscribe();
}
