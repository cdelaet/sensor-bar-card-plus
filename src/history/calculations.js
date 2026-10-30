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

function collapseEqualTimestamps(observations) {
  const effective = [];
  for (let index = 0; index < observations.length;) {
    let end = index + 1;
    while (end < observations.length && observations[end].timestamp === observations[index].timestamp) end += 1;
    const group = observations.slice(index, end);
    if (group.length === 1 || group.every((sample) => sample.value === group[0].value && sample.state === group[0].state)) {
      effective.push(group.at(-1));
    } else if (group.every((sample) => sample.orderKnown)
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

function selectWindowDetails(observations, window, acquiredWindow = null, liveThrough = null) {
  if (!window || !Number.isFinite(window.start) || !Number.isFinite(window.end) || window.end <= window.start) {
    throw new TypeError('A valid absolute observation window is required');
  }
  const ordered = collapseEqualTimestamps(normalizeObservations(observations));
  const startCovered = !acquiredWindow || (Number.isFinite(acquiredWindow.start)
    && acquiredWindow.start <= window.start);
  const endCovered = !acquiredWindow || (Number.isFinite(acquiredWindow.end)
    && acquiredWindow.end >= window.end) || (startCovered && Number.isFinite(liveThrough)
      && liveThrough >= window.end);
  const requestedBoundsCovered = startCovered && endCovered;
  let boundary = null;
  for (const observation of ordered) {
    if (observation.timestamp > window.start) break;
    boundary = observation;
  }
  const selected = ordered.filter((observation) => observation.timestamp >= window.start
    && observation.timestamp < window.end);
  if (boundary && boundary.timestamp < window.start) {
    selected.unshift({ ...boundary, boundaryEffective: true, transitionInWindow: false });
  }
  return {
    observations: selected,
    requestedBoundsCovered,
    orderingAmbiguous: selected.some((observation) => observation.ambiguous === true),
  };
}

function selectWindowObservations(observations, window, acquiredWindow = null) {
  return selectWindowDetails(observations, window, acquiredWindow).observations;
}

export function calculateObservationValue(observations, calculation, window, options = {}) {
  if (!['max', 'min'].includes(calculation)) {
    throw new TypeError(`Unsupported historical calculation: ${calculation}`);
  }
  const details = selectWindowDetails(observations, window, options.acquiredWindow, options.liveThrough);
  const selected = details.observations;
  const numeric = selected.filter((observation) => Number.isFinite(observation.value));
  if (details.orderingAmbiguous) {
    return {
      value: null,
      status: 'partial',
      calculation,
      sampleCount: numeric.length,
      boundaryIncluded: selected.some((observation) => observation.boundaryEffective === true),
      selectedObservation: null,
      orderingAmbiguous: true,
      requestedBoundsCovered: details.requestedBoundsCovered,
    };
  }
  if (!numeric.length) {
    return {
      value: null,
      status: details.requestedBoundsCovered ? 'unavailable' : 'partial',
      calculation,
      sampleCount: 0,
      boundaryIncluded: selected.some((observation) => observation.boundaryEffective === true),
      selectedObservation: null,
      orderingAmbiguous: false,
      requestedBoundsCovered: details.requestedBoundsCovered,
    };
  }
  const selectedObservation = numeric.reduce((best, observation) => {
    if (!best) return observation;
    if (calculation === 'max' ? observation.value > best.value : observation.value < best.value) return observation;
    return best;
  }, null);
  return {
    value: selectedObservation.value,
    status: details.requestedBoundsCovered ? 'available' : 'partial',
    calculation,
    sampleCount: numeric.length,
    boundaryIncluded: selected.some((observation) => observation.boundaryEffective === true),
    selectedObservation,
    orderingAmbiguous: false,
    requestedBoundsCovered: details.requestedBoundsCovered,
  };
}

export { selectWindowObservations };
