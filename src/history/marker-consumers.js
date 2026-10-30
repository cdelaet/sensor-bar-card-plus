// Equivalent markers in a host share an identity even if rows are reordered.
export function historicalMarkerId(row, marker) {
  return JSON.stringify([row.entity, row.attribute ?? null, marker, row[`${marker}_marker`]?.window_spec]);
}

export function historicalMarkerConsumers(rows) {
  const consumers = rows.flatMap((row) => ['peak', 'floor'].flatMap((marker) => {
    const config = row?.[`${marker}_marker`];
    if (!config?.show || config.window_invalid || !config.window_spec
      || typeof row.entity !== 'string' || !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(row.entity)) return [];
    return [{ id: historicalMarkerId(row, marker), spec: {
      source: { entityId: row.entity, attribute: row.attribute ?? null },
      calculation: marker === 'peak' ? 'max' : 'min', window: config.window_spec,
    } }];
  }));
  return [...new Map(consumers.map((consumer) => [consumer.id, consumer])).values()];
}

export function historicalMarkerResults(runtime, row) {
  return Object.fromEntries(['peak', 'floor'].map((marker) => [marker,
    row?.[`${marker}_marker`]?.window_invalid
      ? { value: null, status: 'invalid' }
      : runtime.getResult(historicalMarkerId(row, marker)) ?? { value: null, status: 'pending' },
  ]));
}
