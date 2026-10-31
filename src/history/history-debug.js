// Temporary browser-local diagnostics. No samples or state values are logged.
let sequence = 0;
export const HISTORY_DEBUG_TRACE = Symbol('history-debug-trace');

export function historyDebugEnabled() {
  try { return globalThis.window?.localStorage?.getItem('sbcp.history.debug') === '1'; }
  catch { return false; }
}

export function historyDebugId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${++sequence}`;
}

export function historyDebugTime() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function historyDebugLog(event, details = {}) {
  try { globalThis.console?.debug?.('[SBCP history]', { timestamp: new Date().toISOString(), event, ...details }); }
  catch { /* Diagnostics must never affect history resolution. */ }
}
