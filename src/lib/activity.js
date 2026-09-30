import { useMemo } from 'react';
import usePolling from '../hooks/usePolling';
import { buildUrl } from './api';

// Requests per bucket of a raw aggregator entry's speed ({ windowSize, size,
// counters }, times in seconds), oldest first, over the whole period: like
// Hyperwatch's Speed.compute(), without the current, unfinished bucket, and
// with zeros before the entry was first seen, so that every entry covers the
// same time.
export function activityPoints(speed, now = Math.floor(Date.now() / 1000)) {
  if (!speed) return [];
  const { windowSize, size, counters = {} } = speed;
  const current = now - (now % windowSize);
  const points = [];
  for (let n = size - 1; n >= 1; n--) {
    points.push(counters[current - n * windowSize] || 0);
  }
  return points;
}

const speedKeys = { '15m': 'per_minute', '24h': 'per_hour' };

export function periodSpeed(entry, period) {
  return entry.speed?.[speedKeys[period]];
}

// The activity of an aggregator's entries over the period, by identifier
// (what the entries are grouped by): a Map of identifier → points. Formatted
// rows don't have the counters, only ?raw=true entries do, so this is a
// second request: it takes the params of the rows' one, to get the same
// entries. Raw entries are large and buckets at least a minute wide, so it is
// polled less often.
export function useActivity(path, params, period) {
  const url = buildUrl(path, { ...params, raw: true });
  const { data } = usePolling(url, 30000);
  return useMemo(
    () =>
      new Map(
        (Array.isArray(data) ? data : []).map((entry) => [
          entry.identifier,
          activityPoints(periodSpeed(entry, period)),
        ])
      ),
    [data, period]
  );
}
