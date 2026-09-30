import { useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { useApi, useInstance } from '../lib/InstanceContext';
import { truncate } from '../lib/format';
import { useView } from '../lib/ViewContext';
import { lastSeenColumn, periodColumns } from '../lib/columns';
import DataTable from '../components/DataTable';
import SignaturePanel from '../components/SignaturePanel';
import Switches from '../components/Switches';
import { FirewallBadge } from '../components/FirewallActions';
import { useFirewallLookup, userAgentFromHeaders } from '../lib/firewall';
import useUrlState from '../hooks/useUrlState';

// Addresses and headers are lists joined by <br>, shown one per line
const lines = (text) => (text ? text.split('<br>') : []);

const signatureColumn = { key: 'signature', label: 'Signature' };

const identityColumn = {
  key: 'identity',
  label: 'Identity',
  render: (v) =>
    v ? <span className="text-magenta">{truncate(v, 30)}</span> : '',
};

// Up to 10 addresses seen in the last 24 hours
const addressesColumn = {
  key: 'addresses',
  label: 'Addresses',
  render: (v) => lines(v).map((address) => <div key={address}>{address}</div>),
};

const lastAddressColumn = {
  key: 'lastAddress',
  label: 'Latest address',
  render: (v) => (v ? <span className="text-cyan">{v}</span> : ''),
};

// No agent column: the User-Agent header is among the headers
const headersColumn = {
  key: 'headers',
  label: 'Headers',
  render: (v) => (
    <div className="whitespace-normal break-all min-w-80">
      {lines(v).map((header, i) => {
        const index = header.indexOf(':');
        return (
          <div key={i}>
            <span className="text-text-dim">{header.slice(0, index + 1)}</span>
            {header.slice(index + 1)}
          </div>
        );
      })}
    </div>
  ),
};

export default function Signatures() {
  const { apiUrl } = useApi();
  const { modules } = useInstance();
  const { period } = useView();
  const [sort, setSort] = useUrlState('sort', `count${period}`);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const handleClose = useCallback(() => setSelectedSignature(null), []);
  const handleRowClick = useCallback((row) => setSelectedSignature(row), []);
  const url = apiUrl('/signatures.json', { sort, limit: 100 });
  const { data, error, loading, retry } = usePolling(url, 5000);
  // Signatures can't be firewalled; show whether their User-Agent is on a list.
  // Refreshed on every poll, so edits made in the panel show up.
  const firewall = useFirewallLookup(
    'user_agent',
    data?.map((s) => userAgentFromHeaders(s.headers)),
    data
  );
  const firewallColumn = {
    key: 'firewall',
    label: '',
    render: (v, row) => (
      <FirewallBadge match={firewall[userAgentFromHeaders(row.headers)]} />
    ),
  };
  const columns = [
    signatureColumn,
    identityColumn,
    { key: `addressCount${period}`, label: 'Address count', sortable: true },
    addressesColumn,
    lastAddressColumn,
    headersColumn,
    ...periodColumns(period),
    lastSeenColumn(data),
    ...(modules.firewall ? [firewallColumn] : []),
  ];

  return (
    <div className="relative h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
            Signatures
          </h2>
          <Switches />
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
          />
        )}
      </div>
      {selectedSignature && (
        <SignaturePanel row={selectedSignature} onClose={handleClose} />
      )}
    </div>
  );
}
