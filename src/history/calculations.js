function compareObservations(a, b) {
  return a.timestamp - b.timestamp || (a.order ?? 0) - (b.order ?? 0);
}

export function normalizeObservations(observations) {
  if (!Array.isArray(observations)) throw new TypeError('Observations must be an array');
  return observations.filter((observation) => observation
    && Number.isFinite(observation.timestamp))
    .map((observation, index) => ({
      ...observation,
      order: observation.order ?? index,
      orderKnown: observation.orderKnown === true,
    }))
    .sort(compareObservations);
}

export function collapseEqualTimestamps(observations) {
  const effective = [];
  for (let index = 0; index < observations.length;) {
    let end = index + 1;
    while (end < observations.length && observations[end].timestamp === observations[index].timestamp) end += 1;
    if (end === index + 1) {
      effective.push(observations[index]);
      index = end;
      continue;
    }
    const group = observations.slice(index, end);
    if (group.length === 1 || group.every((sample) => sample.value === group[0].value && sample.state === group[0].state)) {
      effective.push(group.at(-1));
    } else if (group.every((sample) => sample.orderKnown)
      && new Set(group.map((sample) => sample.orderDomain ?? sample.origin ?? 'unknown')).size === 1
      && new Set(group.map((sample) => sample.order)).size === group.length) {
      effective.push(group.at(-1));
    } else {
      effective.push({
        ...group.at(-1), value: null, ambiguous: true, orderKnown: false,
        state: null,
      });
    }
    index = end;
  }
  return effective;
}

// A minute bucket describes effective states, including a value established
// before the bucket. The original observation is retained for provenance.
export function aggregateMinuteBuckets(observations, window, { ordered = false } = {}) {
  if (!Number.isFinite(window?.start) || !Number.isFinite(window?.end) || window.end <= window.start
    || window.start % 60000 !== 0) throw new TypeError('A minute-aligned start and positive window are required');
  const transitions = collapseEqualTimestamps(ordered ? observations : normalizeObservations(observations));
  const buckets = [];
  let index = 0, active = null;
  while (index < transitions.length && transitions[index].timestamp < window.start) active = transitions[index++];
  for (let start = window.start; start < window.end; start += 60000) {
    const end = Math.min(start + 60000, window.end);
    const bucket = { start, end, min: null, max: null, startState: active, endState: null, ambiguous: false, numericCount: 0 };
    const add = (state) => {
      if (!state) return;
      if (state.ambiguous) bucket.ambiguous = true;
      if (!Number.isFinite(state.value)) return;
      if (!bucket.min || state.value < bucket.min.value) bucket.min = state;
      if (!bucket.max || state.value > bucket.max.value) bucket.max = state;
    };
    let position = start;
    while (index < transitions.length && transitions[index].timestamp < end) {
      const next = transitions[index++];
      if (next.timestamp > position) add(active);
      active = next;
      position = next.timestamp;
      if (Number.isFinite(next.value)) bucket.numericCount += 1;
      if (next.timestamp === start) bucket.startState = active;
    }
    if (position < end) add(active);
    bucket.endState = active;
    buckets.push(bucket);
  }
  return buckets;
}

// Advance an existing history using only transitions after its old endpoint.
// The caller has already checked ordering and supplies complete equal-time groups.
export function advanceMinuteBuckets(previous, transitions, window) {
  const buckets = previous.filter(bucket => bucket.end > window.start).map((bucket, index, selected) =>
    index === selected.length - 1 ? { ...bucket } : bucket);
  let active = previous.at(-1)?.endState ?? null;
  let cursor = previous.at(-1)?.end ?? window.start;
  let index = 0;
  while (index < transitions.length && transitions[index].timestamp < window.start) active = transitions[index++];
  cursor = Math.max(cursor, window.start);

  const currentBucket = () => {
    let bucket = buckets.at(-1);
    const start = Math.floor(cursor / 60000) * 60000;
    if (!bucket || bucket.start !== start) {
      bucket = { start, end: cursor, min: null, max: null, startState: active, endState: active, ambiguous: false, numericCount: 0 };
      buckets.push(bucket);
    }
    return bucket;
  };
  const advanceTo = (end) => {
    while (cursor < end) {
      const bucket = currentBucket();
      const next = Math.min(end, bucket.start + 60000);
      if (active?.ambiguous) bucket.ambiguous = true;
      if (Number.isFinite(active?.value)) {
        if (!bucket.min || active.value < bucket.min.value) bucket.min = active;
        if (!bucket.max || active.value > bucket.max.value) bucket.max = active;
      }
      cursor = next;
      bucket.end = cursor;
      bucket.endState = active;
    }
  };
  for (; index < transitions.length && transitions[index].timestamp < window.end; index += 1) {
    const next = transitions[index];
    advanceTo(next.timestamp);
    active = next;
    const bucket = currentBucket();
    if (Number.isFinite(next.value)) bucket.numericCount += 1;
    if (next.timestamp === bucket.start) bucket.startState = next;
    bucket.endState = next;
  }
  advanceTo(window.end);
  return buckets;
}

export function calculateMinuteExtrema(buckets, window, acquiredWindow = null) {
  if (!Number.isFinite(window?.start) || !Number.isFinite(window?.end) || window.end <= window.start
    || window.start % 60000 !== 0) throw new TypeError('A minute-aligned start and positive window are required');
  let first = null, last = null, contiguous = true, ambiguous = false, numericCount = 0;
  let min = null, max = null;
  for (const bucket of buckets) {
    if (bucket.start < window.start || bucket.end > window.end) continue;
    if (!first) first = bucket;
    if (last && last.end !== bucket.start) contiguous = false;
    last = bucket;
    numericCount += bucket.numericCount;
    ambiguous ||= bucket.ambiguous;
    if (bucket.min && (!min || bucket.min.value < min.value)) min = bucket.min;
    if (bucket.max && (!max || bucket.max.value > max.value)) max = bucket.max;
  }
  const boundsCovered = (!acquiredWindow || (acquiredWindow.start <= window.start && acquiredWindow.end >= window.end))
    && first?.start === window.start && last?.end === window.end && contiguous;
  const boundary = first?.startState;
  const boundaryIncluded = Boolean(boundary && boundary.timestamp < window.start);
  const sampleCount = numericCount + (boundaryIncluded && Number.isFinite(boundary.value) ? 1 : 0);
  const result = (calculation, best) => ({
    value: ambiguous ? null : best?.value ?? null, calculation, sampleCount,
    selectedObservation: ambiguous ? null : best && best.timestamp < window.start
      ? { ...best, boundaryEffective: true, transitionInWindow: false } : best,
    boundaryIncluded, orderingAmbiguous: ambiguous, requestedBoundsCovered: boundsCovered,
    status: ambiguous || !boundsCovered ? 'partial' : best ? 'available' : 'unavailable',
  });
  return { min: result('min', min), max: result('max', max) };
}

export function calculateMinuteBuckets(buckets, calculation, window, acquiredWindow = null) {
  if (!['max', 'min'].includes(calculation)) throw new TypeError('Unsupported extrema calculation');
  return calculateMinuteExtrema(buckets, window, acquiredWindow)[calculation];
}
