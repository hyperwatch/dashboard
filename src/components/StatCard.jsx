import { formatNumber } from '../lib/format';

export default function StatCard({
  label,
  value,
  color = 'text-text',
  children,
}) {
  return (
    <div className="bg-bg-card rounded border border-border p-3 flex flex-col gap-1">
      <div className="text-[10px] text-text-dim uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      {children}
    </div>
  );
}
