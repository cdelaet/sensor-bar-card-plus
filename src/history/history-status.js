// Translate only known conditions. Provider errors may contain transport details.
export function historyReason(result) {
  const status = result?.status;
  if (status === 'pending') return 'Historical data is still loading';
  if (status === 'invalid') return 'Historical window is invalid or unsupported';
  const coverage = result?.provenance?.coverage;
  const reason = coverage?.reason ?? coverage?.statistics?.reason ?? '';
  const error = result?.provenance?.error;
  const windowError = typeof error?.message === 'string' && /boundaries|whole UTC-hour|whole hours/.test(error.message);
  if (/attributes/.test(reason)) return 'Entity attributes do not support historical statistics';
  if (/metadata/.test(reason)) return 'Long-term statistics are unavailable for this entity';
  if (/min\/max/.test(reason)) return 'Required minimum and maximum statistics are unavailable';
  if (/units are incompatible/.test(reason)) return 'Statistics and Recorder units are incompatible';
  if (/missing|malformed/.test(reason)) return 'Required history intervals are missing';
  if (windowError) return 'Historical window boundaries are unsupported';
  if (status === 'stale') return 'Cached history is stale; refresh failed';
  if (status === 'partial') return 'History is incomplete';
  if (status === 'unavailable') return 'History is temporarily unavailable';
  return null;
}

function historyConsequence(name, item) {
  if (item.status === 'pending') return `${name} marker will be unavailable until history finishes loading.`;
  if (item.status === 'invalid') return `${name} marker is unavailable because its configured history window is unsupported.`;
  if (item.status === 'unavailable') return `${name} marker is unavailable until Recorder history can be read.`;
  if (item.status === 'partial') return item.visible
    ? `${name} marker uses incomplete observations and may miss the true extremum.`
    : `${name} marker is unavailable because no usable observations were returned.`;
  if (item.status === 'stale') return item.visible
    ? `${name} marker uses a cached value from the last successful refresh.`
    : `${name} marker is unavailable because no usable cached value is available.`;
  return '';
}

function configuredWindowLabel(value) {
  if (value === null || value === undefined || value === '') return 'unspecified';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

export function historyDiagnostics(entity, peak, floor) {
  return [['peak', 'Peak', peak], ['floor', 'Floor', floor]].flatMap(([key, name, item]) => {
    if (!item?.enabled || !['pending', 'invalid', 'unavailable', 'partial', 'stale'].includes(item.status)) return [];
    const severity = item.status === 'pending' ? 'info'
      : ['partial', 'stale'].includes(item.status) ? 'warning' : 'error';
    const window = configuredWindowLabel(item.window);
    const reason = item.reason ?? 'History is unavailable';
    return [{
      code: `history.marker.${item.status}`,
      severity,
      path: `history.${key}`,
      entity,
      area: `${name} marker · Configured window: ${window}`,
      window,
      reason,
      message: `${reason}. ${historyConsequence(name, item)}`,
    }];
  });
}
