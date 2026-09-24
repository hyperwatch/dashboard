// All requests go to the origin serving the dashboard (a Hyperwatch process),
// on bare paths. In development, Vite proxies them to HYPERWATCH_URL.
export function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  return url.pathname + url.search;
}
