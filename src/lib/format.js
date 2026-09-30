export function formatNumber(n) {
  if (n == null) return '—';
  if (typeof n !== 'number') n = Number(n);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}

// A table cell, like in Hyperwatch's HTML tables: thousands separators
// (1,234), empty for 0
export function formatCell(n) {
  const number = Number(n);
  return number ? number.toLocaleString('en-US') : '';
}

export function truncate(str, max = 60) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

// lastSeen is ISO 8601 (UTC). Tables show "2026-09-25 12:51:07", or only the
// time when every row was seen today, like in the logs.
export function allSeenToday(rows) {
  const today = new Date().toISOString().slice(0, 10);
  return rows.every((row) => !row.lastSeen || row.lastSeen.startsWith(today));
}

export function formatLastSeen(iso, timeOnly) {
  if (!iso) return '';
  const time = iso.slice(11, 19);
  return timeOnly ? time : `${iso.slice(0, 10)} ${time}`;
}

// Execution time of a request, in milliseconds: the colors of Hyperwatch's
// log lines
export function execTimeColor(ms) {
  if (!ms) return '';
  return ms <= 100 ? 'text-green' : ms >= 1000 ? 'text-red' : 'text-yellow';
}

export function formatExecTime(ms) {
  return `${Number(ms).toLocaleString('en-US')}ms`;
}

// The agent of a log: its parsed family and version, else the raw User-Agent
// (null when the request had none)
export function formatAgent(agent, userAgent) {
  if (agent?.family && agent.family !== 'Other') {
    const { family, major, minor } = agent;
    if (minor) return `${family}/${major}.${minor}`;
    return major ? `${family}/${major}` : family;
  }
  return userAgent || null;
}

// Hostnames confirmed by a forward DNS lookup end with '+' in aggregators
export function parseHostname(text) {
  const verified = typeof text === 'string' && text.endsWith('+');
  return { value: verified ? text.slice(0, -1) : text, verified };
}

// Regional-indicator flag emoji for a two-letter country code
export function countryFlag(cc) {
  if (!cc || cc.length !== 2) return '';
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}
