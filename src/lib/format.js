export function formatNumber(n) {
  if (n == null) return '—';
  if (typeof n !== 'number') n = Number(n);
  if (isNaN(n)) return '—';
  return n.toLocaleString();
}

export function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m${s}s`;
}

export function truncate(str, max = 60) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

export function formatLastSeen(iso) {
  if (!iso) return '—';
  const now = new Date();
  const date = new Date(iso);
  const today = now.toISOString().slice(0, 10);
  const day = iso.slice(0, 10);
  if (day === today) return iso.slice(11, 19);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === yesterday.toISOString().slice(0, 10)) return 'yesterday';
  const diffDays = Math.floor((now - date) / 86400000);
  return `${diffDays}d ago`;
}

// Exec time thresholds (aligned with pipeline node filters in frontend.js)
export const EXEC_SLOW_MS = 300;
export const EXEC_EXTRA_SLOW_MS = 1000;

export function execTimeColor(val) {
  if (!val) return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  const ms =
    typeof val === 'string' && val.includes('m')
      ? n * 60000
      : typeof val === 'number'
        ? val
        : n * 1000;
  if (ms <= EXEC_SLOW_MS) return 'text-green';
  if (ms >= EXEC_EXTRA_SLOW_MS) return 'text-red';
  return 'text-yellow';
}

// Regional-indicator flag emoji for a two-letter country code
export function countryFlag(cc) {
  if (!cc || cc.length !== 2) return '';
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}
