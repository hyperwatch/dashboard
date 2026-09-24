import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import { truncate, formatLastSeen, countryFlag } from '../lib/format';
import { useView } from '../lib/ViewContext';
import { applyTimeWindow } from '../lib/sort';
import DataTable from '../components/DataTable';
import AddressPanel from '../components/AddressPanel';
import { FirewallBadge } from '../components/FirewallActions';
import { useFirewallLookup } from '../lib/firewall';
import useUrlState from '../hooks/useUrlState';

const baseColumns = [
  {
    key: 'address',
    label: 'Address',
    render: (v, row) => <span className="text-cyan">{row.hostname || v}</span>,
  },
  {
    key: 'identity',
    label: 'Identity / Agent',
    render: (v, row) => {
      if (v) return <span className="text-magenta">{truncate(v, 50)}</span>;
      if (row.agent)
        return <span className="text-text-dim">{truncate(row.agent, 50)}</span>;
      return '';
    },
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
    key: 'xbl',
    label: 'XBL',
    render: (v) => (v ? <span className="text-red">x</span> : null),
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
    {
      key: 'signatureCount15m',
      label: 'Signatures',
      sortable: true,
      render: (v) => v || '',
    },
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
    {
      key: 'signatureCount24h',
      label: 'Signatures',
      sortable: true,
      render: (v) => v || '',
    },
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

export default function Addresses() {
  const { apiUrl } = useApi();
  const { filter, setFilter, timeWindow, setTimeWindow } = useView();
  const [sort, setSort] = useUrlState('sort', 'count15m');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const handleClose = useCallback(() => setSelectedAddress(null), []);
  const handleRowClick = useCallback((row) => setSelectedAddress(row), []);
  const activeSort = applyTimeWindow(sort, timeWindow);
  const url = apiUrl('/addresses.json', { sort: activeSort, limit: 100 });
  const { data, error, loading, retry } = usePolling(url, 5000);
  // Refreshed on every poll, so edits made in the panel show up
  const firewall = useFirewallLookup(
    'ip',
    data?.map((a) => a.address),
    data
  );
  // The xbl field only exists when the instance runs the dnsbl module
  const hasXbl = data?.some((a) => 'xbl' in a);
  const columns = [
    ...baseColumns.filter((column) => column.key !== 'xbl' || hasXbl),
    ...timeColumns[timeWindow],
    {
      key: 'firewall',
      label: '',
      render: (v, row) => <FirewallBadge match={firewall[row.address]} />,
    },
  ];

  const filtered =
    data && filter !== 'all'
      ? data.filter((a) => (filter === 'identified' ? a.identity : !a.identity))
      : data;

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Addresses
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
      {selectedAddress && (
        <AddressPanel row={selectedAddress} onClose={handleClose} />
      )}
    </div>
  );
}
