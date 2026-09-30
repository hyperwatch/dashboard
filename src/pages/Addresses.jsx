import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { withLastFields } from '../lib/api';
import { useApi, useInstance } from '../lib/InstanceContext';
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
import AddressPanel from '../components/AddressPanel';
import Switches from '../components/Switches';
import { FirewallBadge } from '../components/FirewallActions';
import { useFirewallLookup } from '../lib/firewall';
import useUrlState from '../hooks/useUrlState';

const addressColumn = { key: 'address', label: 'Address' };

// The latest identity falls back to the latest agent, in grey
const lastIdentityColumn = {
  key: 'identity',
  label: 'Latest identity',
  render: (v, row) => {
    if (v) return <span className="text-magenta">{truncate(v, 50)}</span>;
    if (row.agent)
      return (
        <span className="text-text-dim">
          <Agent value={row.agent} />
        </span>
      );
    return '';
  },
};

export default function Addresses() {
  const { apiUrl } = useApi();
  const { modules } = useInstance();
  const { filter, period } = useView();
  const [sort, setSort] = useUrlState('sort', `count${period}`);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const handleClose = useCallback(() => setSelectedAddress(null), []);
  const handleRowClick = useCallback((row) => setSelectedAddress(row), []);
  // The identity filter is applied by Hyperwatch, before the limit
  const params = {
    sort,
    limit: 100,
    filter: filter === 'all' ? undefined : filter,
  };
  const url = apiUrl('/addresses.json', params);
  const { data, error, loading, retry } = usePolling(url, 5000, withLastFields);
  // Refreshed on every poll, so edits made in the panel show up
  const firewall = useFirewallLookup(
    'ip',
    data?.map((a) => a.address),
    data
  );
  // The firewall list of the address, when the instance runs the firewall
  // module
  const firewallColumn = {
    key: 'firewall',
    label: '',
    render: (v, row) => <FirewallBadge match={firewall[row.address]} />,
  };
  const columns = [
    addressColumn,
    hostnameColumn,
    countryColumn,
    lastIdentityColumn,
    ...periodColumns(period),
    lastSeenColumn(data),
    ...(modules.firewall ? [firewallColumn] : []),
  ];

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Addresses
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
            onRowClick={handleRowClick}
            empty={filter === 'all' ? undefined : 'No matching entries.'}
          />
        )}
      </div>
      {selectedAddress && (
        <AddressPanel row={selectedAddress} onClose={handleClose} />
      )}
    </div>
  );
}
