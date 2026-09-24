const colorMap = {
  // Firewall actions
  block: 'bg-red/20 text-red',
  monitor: 'bg-yellow/20 text-yellow',
  challenge: 'bg-orange/20 text-orange',
  allow: 'bg-green/20 text-green',
  log: 'bg-text-dim/20 text-text-dim',
  // Scores
  high: 'bg-red/20 text-red',
  medium: 'bg-orange/20 text-orange',
  low: 'bg-green/20 text-green',
  // Status
  ok: 'bg-green/20 text-green',
  error: 'bg-red/20 text-red',
  warning: 'bg-yellow/20 text-yellow',
  active: 'bg-cyan/20 text-cyan',
};

export default function StatusBadge({ value, className = '' }) {
  if (value == null) return null;
  const str = String(value).toLowerCase();
  const colors = colorMap[str] || 'bg-magenta/20 text-magenta';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colors} ${className}`}
    >
      {String(value)}
    </span>
  );
}
