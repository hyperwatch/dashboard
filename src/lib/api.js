// All requests go to the origin serving the dashboard (a Hyperwatch process),
// on bare paths. In development, Vite proxies them to HYPERWATCH_URL.
export function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  return url.pathname + url.search;
}

// Hyperwatch renamed fields of /addresses (identity → lastIdentity,
// agent → lastAgent) and /identities (agent → lastAgent) in hyperwatch#600.
// Rows from either version get the names the dashboard reads: identity and
// agent.
export function withLastFields(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) =>
    row && typeof row === 'object'
      ? {
          ...row,
          identity: row.identity ?? row.lastIdentity,
          agent: row.agent ?? row.lastAgent,
        }
      : row
  );
}
