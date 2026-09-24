import { formatNumber } from '../lib/format';

const COLORS = [
  '#4cdeea',
  '#e44cd0',
  '#4cea7a',
  '#eae44c',
  '#ea944c',
  '#ea4c4c',
  '#7a4cea',
  '#4c94ea',
];

export default function PieChart({ data = [], width = 200, height = 200 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return null;

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 4;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const segment = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color || COLORS[i % COLORS.length]}
              strokeWidth={r * 0.6}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return segment;
        })}
      </svg>
      <div className="flex flex-col gap-0.5 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: d.color || COLORS[i % COLORS.length] }}
            />
            <span className="text-text-dim truncate">{d.label}</span>
            <span className="text-text tabular-nums font-bold ml-auto">
              {formatNumber(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
