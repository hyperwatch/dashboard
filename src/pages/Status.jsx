import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  {
    key: 'status',
    label: 'Status',
    render: (v) => <StatusBadge value={v} />,
  },
  { key: 'count15m', label: '15m' },
  { key: 'count24h', label: '24h' },
];

export default function Status() {
  const { apiUrl } = useApi();
  const url = apiUrl('/status.json');
  const { data, error, loading, retry } = usePolling(url, 10000);

  return (
    <div>
      <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">
        Pipeline Status
      </h2>
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
        <DataTable data={data} columns={columns} />
      )}
    </div>
  );
}
