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

export function historyStatusSummary(peak, floor) {
  const entries = [['Peak', peak], ['Floor', floor]].filter(([, item]) => item?.enabled
    && (['pending', 'invalid', 'unavailable'].includes(item.status)
      || (['partial', 'stale'].includes(item.status) && !item.visible)));
  if (!entries.length) return null;
  const reasons = entries.map(([name, item]) => ({ name, reason: item.reason }));
  const text = reasons.length === 2 && reasons[0].reason === reasons[1].reason
    ? `Peak and Floor: ${reasons[0].reason}` : reasons.map(({ name, reason }) => `${name}: ${reason}`).join('; ');
  return { text, pending: entries.every(([, item]) => item.status === 'pending') };
}
