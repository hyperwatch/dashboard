import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import { truncate, formatLastSeen } from '../lib/format';
import { useView } from '../lib/ViewContext';
import { applyTimeWindow } from '../lib/sort';
import DataTable from '../components/DataTable';
import SignaturePanel from '../components/SignaturePanel';
import { FirewallBadge } from '../components/FirewallActions';
import { useFirewallLookup, userAgentFromHeaders } from '../lib/firewall';
import useUrlState from '../hooks/useUrlState';

const baseColumns = [
  { key: 'signature', label: 'Signature', render: (v) => truncate(v, 60) },
  {
    key: 'identity',
    label: 'Identity',
    render: (v) =>
      v ? <span className="text-magenta">{truncate(v, 30)}</span> : '',
  },
  { key: 'agent', label: 'Agent', render: (v) => truncate(v, 50) },
  {
    key: 'lastAddress',
    label: 'Latest address',
    render: (v) => (v ? <span className="text-cyan">{v}</span> : '—'),
  },
  {
    key: 'score',
    label: 'Score',
    sortable: true,
    render: (v) => {
      if (!v) return '—';
      const n = parseFloat(v);
      const color =
        n >= 0.8 ? 'text-red' : n <= 0.2 ? 'text-green' : 'text-yellow';
      return <span className={color}>{v}</span>;
    },
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
    { key: 'addressCount15m', label: 'Addresses', sortable: true },
    { key: 'count15m', label: 'Count', sortable: true },
    { key: '2xx15m', label: '2xx', sortable: true },
    { key: '4xx15m', label: '4xx', sortable: true },
    {
      key: 'execTime15m',
      label: 'Exec time',
      sortable: true,
      render: (v) => v || '—',
    },
  ],
  '24h': [
    { key: 'addressCount24h', label: 'Addresses', sortable: true },
    { key: 'count24h', label: 'Count', sortable: true },
    { key: '2xx24h', label: '2xx', sortable: true },
    { key: '4xx24h', label: '4xx', sortable: true },
    {
      key: 'execTime24h',
      label: 'Exec time',
      sortable: true,
      render: (v) => v || '—',
    },
  ],
};

const filters = ['all', 'identified', 'unidentified'];
const timeWindows = ['15m', '24h'];

export default function Signatures() {
  const { apiUrl } = useApi();
  const { filter, setFilter, timeWindow, setTimeWindow } = useView();
  const [sort, setSort] = useUrlState('sort', 'count15m');
  const [selectedSignature, setSelectedSignature] = useState(null);
  const handleClose = useCallback(() => setSelectedSignature(null), []);
  const handleRowClick = useCallback((row) => setSelectedSignature(row), []);
  const activeSort = applyTimeWindow(sort, timeWindow);
  const url = apiUrl('/signatures.json', { sort: activeSort, limit: 100 });
  const { data, error, loading, retry } = usePolling(url, 5000);
  // Signatures can't be firewalled; show whether their User-Agent is on a list.
  // Refreshed on every poll, so edits made in the panel show up.
  const firewall = useFirewallLookup(
    'user_agent',
    data?.map((s) => userAgentFromHeaders(s.headers)),
    data
  );
  const columns = [
    ...baseColumns,
    ...timeColumns[timeWindow],
    {
      key: 'firewall',
      label: '',
      render: (v, row) => (
        <FirewallBadge match={firewall[userAgentFromHeaders(row.headers)]} />
      ),
    },
  ];

  const filtered =
    data && filter !== 'all'
      ? data.filter((s) => (filter === 'identified' ? s.identity : !s.identity))
      : data;

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Signatures
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
            onRowClick={handleRowClick}
          />
        )}
      </div>
      {selectedSignature && (
        <SignaturePanel row={selectedSignature} onClose={handleClose} />
      )}
    </div>
  );
}
