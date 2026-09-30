import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { withLastFields } from '../lib/api';
import { useApi } from '../lib/InstanceContext';
import { truncate } from '../lib/format';
import { useView } from '../lib/ViewContext';
import {
  Agent,
  countryColumn,
  hostnameColumn,
  lastSeenColumn,
  periodColumns,
} from '../lib/columns';
import DataTable from '../components/DataTable';
import IdentityPanel from '../components/IdentityPanel';
import Switches from '../components/Switches';
import useUrlState from '../hooks/useUrlState';

// Entries are aggregated by identity, falling back to address when there is
// none -- the same address can therefore show up on several rows.
const identityKey = (row) => row.identity || row.address;

// Unnamed identities show their key (the address), in grey. No address
// column: the hostname column has the last one of the others.
const identityColumn = {
  key: 'identity',
  label: 'Identity',
  render: (v, row) =>
    v ? (
      <span className="text-magenta">{truncate(v, 50)}</span>
    ) : (
      <span className="text-text-dim">{row.address}</span>
    ),
};

const agentColumn = {
  key: 'agent',
  label: 'Agent',
  render: (v) => (
    <span className="text-text-dim">
      <Agent value={v} />
    </span>
  ),
};

export default function Identities() {
  const { apiUrl } = useApi();
  const { filter, period } = useView();
  const [sort, setSort] = useUrlState('sort', `count${period}`);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const handleClose = useCallback(() => setSelectedIdentity(null), []);
  const handleRowClick = useCallback((row) => setSelectedIdentity(row), []);
  // The identity filter is applied by Hyperwatch, before the limit
  const params = {
    sort,
    limit: 100,
    filter: filter === 'all' ? undefined : filter,
  };
  const url = apiUrl('/identities.json', params);
  const { data, error, loading, retry } = usePolling(url, 5000, withLastFields);
  const columns = [
    identityColumn,
    hostnameColumn,
    countryColumn,
    agentColumn,
    ...periodColumns(period),
    lastSeenColumn(data),
  ];

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Identities
          </h2>
          <Switches identityFilter />
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
            data={data}
            columns={columns}
            sort={sort}
            onSort={setSort}
            rowKey={identityKey}
            onRowClick={handleRowClick}
            empty={filter === 'all' ? undefined : 'No matching entries.'}
          />
        )}
      </div>
      {selectedIdentity && (
        <IdentityPanel row={selectedIdentity} onClose={handleClose} />
      )}
    </div>
  );
}
