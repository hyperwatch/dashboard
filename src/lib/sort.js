// Sort keys are scoped to a time window (count15m / count24h, execTime15m /
// execTime24h). The window toggle swaps which columns are rendered, so the
// active sort has to follow it -- otherwise the table is ordered by values it
// is not displaying.
const windowSuffix = /(15m|24h)$/;

export function applyTimeWindow(sort, timeWindow) {
  return windowSuffix.test(sort)
    ? sort.replace(windowSuffix, timeWindow)
    : sort;
}
