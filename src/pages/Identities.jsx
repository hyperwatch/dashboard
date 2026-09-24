import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import { truncate, formatLastSeen, countryFlag } from '../lib/format';
import { useView } from '../lib/ViewContext';
import { applyTimeWindow } from '../lib/sort';
import DataTable from '../components/DataTable';
import IdentityPanel from '../components/IdentityPanel';
import useUrlState from '../hooks/useUrlState';

const baseColumns = [
  {
    key: 'identity',
    label: 'Identity',
    render: (v) => <span className="text-magenta">{truncate(v, 50)}</span>,
  },
  {
    key: 'agent',
    label: 'Agent',
    render: (v) => <span className="text-text-dim">{truncate(v, 50)}</span>,
  },
  {
    key: 'address',
    label: 'Address',
    render: (v) => <span className="text-cyan">{v}</span>,
  },
  {
    key: 'country',
    label: 'Country',
    render: (v) =>
      v ? (
        <span>
          {countryFlag(v)} {v}
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'lastSeen',
    label: 'Last seen',
    sortable: true,
    sortKey: 'latest',
    render: (v) => <span className="text-text-dim">{formatLastSeen(v)}</span>,
  },
];

const timeColumns = {
  '15m': [
    { key: 'count15m', label: 'Count', sortable: true },
    {
      key: 'execTime15m',
      label: 'Exec time',
      sortable: true,
      render: (v) => v || '—',
    },
  ],
  '24h': [
    { key: 'count24h', label: 'Count', sortable: true },
    {
      key: 'execTime24h',
      label: 'Exec time',
      sortable: true,
      render: (v) => v || '—',
    },
  ],
};

// Entries are aggregated by identity, falling back to address when there is
// none -- the same address can therefore show up on several rows.
const identityKey = (row) => row.identity || row.address;

const filters = ['all', 'identified', 'unidentified'];

const timeWindows = ['15m', '24h'];

export default function Identities() {
  const { apiUrl } = useApi();
  const { filter, setFilter, timeWindow, setTimeWindow } = useView();
  const [sort, setSort] = useUrlState('sort', 'count15m');
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const columns = [...baseColumns, ...timeColumns[timeWindow]];
  const handleClose = useCallback(() => setSelectedIdentity(null), []);
  const handleRowClick = useCallback((row) => setSelectedIdentity(row), []);
  const activeSort = applyTimeWindow(sort, timeWindow);
  const url = apiUrl('/identities.json', { sort: activeSort, limit: 100 });
  const { data, error, loading, retry } = usePolling(url, 5000);

  const filtered =
    data && filter !== 'all'
      ? data.filter((a) => (filter === 'identified' ? a.identity : !a.identity))
      : data;

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Identities
          </h2>
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 text-[10px] rounded-full capitalize cursor-pointer transition-colors ${
                  filter === f
                    ? 'bg-cyan/20 text-cyan'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {timeWindows.map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2 py-0.5 text-[10px] rounded-full cursor-pointer transition-colors ${
                  timeWindow === tw
                    ? 'bg-cyan/20 text-cyan'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="text-red mb-4">
            Error: {error}{' '}
            <button onClick={retry} className="underline text-cyan">
              retry
            </button>
          </div>
        )}
        {loading && !data ? (
          <div className="text-text-dim animate-pulse">Loading…</div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            sort={activeSort}
            onSort={setSort}
            rowKey={identityKey}
            onRowClick={handleRowClick}
          />
        )}
      </div>
      {selectedIdentity && (
        <IdentityPanel row={selectedIdentity} onClose={handleClose} />
      )}
    </div>
  );
}
