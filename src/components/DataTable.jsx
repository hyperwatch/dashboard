import { formatNumber } from '../lib/format';

const numericFields = new Set([
  'count15m',
  'count1h',
  'count24h',
  'addressCount15m',
  'addressCount24h',
  'signatureCount15m',
  'signatureCount24h',
  '2xx15m',
  '2xx24h',
  '4xx15m',
  '4xx24h',
  'score',
  'cfCount24h',
  'execTime',
]);

function isNumeric(key) {
  return numericFields.has(key) || /^count\d/.test(key);
}

function defaultRowKey(row, i) {
  return row.id || row.signature || row.address || row.list || i;
}

export default function DataTable({
  data,
  columns,
  sort,
  onSort,
  onRowClick,
  rowKey,
}) {
  if (!data || data.length === 0) {
    return <div className="text-text-dim text-center py-12">No data</div>;
  }

  // Keys must be unique, otherwise React mismatches rows when the sort changes
  // and the table renders stale values. Disambiguate repeats as a safety net.
  const getKey = rowKey || defaultRowKey;
  const seen = new Map();

  // Derive columns from data if not provided
  const cols = columns || Object.keys(data[0]).filter((k) => k !== 'activity');

  return (
    <div className="overflow-auto rounded border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-sidebar sticky top-0 z-10">
            {cols.map((col) => {
              const key = typeof col === 'string' ? col : col.key;
              const label = typeof col === 'string' ? col : col.label;
              const sortable = typeof col === 'object' && col.sortable;
              const sortKey = (typeof col === 'object' && col.sortKey) || key;
              const active = sort === sortKey;

              return (
                <th
                  key={key}
                  onClick={sortable ? () => onSort?.(sortKey) : undefined}
                  className={`px-2 py-1 text-left text-[10px] font-bold uppercase tracking-wider select-none whitespace-nowrap border-b border-border ${
                    sortable ? 'cursor-pointer hover:text-text' : ''
                  } ${active ? 'text-cyan' : 'text-text-dim'}`}
                >
                  {label}
                  {active ? (
                    <span className="text-cyan ml-1">↓</span>
                  ) : sortable ? (
                    <span className="text-text-dim/30 ml-1">↕</span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const base = String(getKey(row, i));
            const seenCount = seen.get(base) || 0;
            seen.set(base, seenCount + 1);

            return (
              <tr
                key={seenCount ? `${base}#${seenCount}` : base}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`group border-b border-border/50 hover:bg-bg-card/50 transition-colors${onRowClick ? ' cursor-pointer' : ''}`}
              >
                {cols.map((col) => {
                  const key = typeof col === 'string' ? col : col.key;
                  const render = typeof col === 'object' && col.render;
                  const value = row[key];

                  return (
                    <td
                      key={key}
                      className={`px-2 py-0.5 whitespace-nowrap ${
                        isNumeric(key)
                          ? 'text-right tabular-nums min-w-[4ch]'
                          : ''
                      }`}
                    >
                      {render
                        ? render(value, row)
                        : isNumeric(key)
                          ? formatNumber(value)
                          : value != null
                            ? String(value)
                            : '—'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
