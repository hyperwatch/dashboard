import { useState } from 'react';
import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import { truncate } from '../lib/format';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

function scoreBadge(score) {
  if (score == null) return '—';
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return (
    <StatusBadge
      value={`${score} ${level}`}
      className={
        level === 'high'
          ? 'bg-red/20 text-red'
          : level === 'medium'
            ? 'bg-orange/20 text-orange'
            : 'bg-green/20 text-green'
      }
    />
  );
}

function flagsPills(flags) {
  if (!flags || (Array.isArray(flags) && flags.length === 0)) return '—';
  const list = Array.isArray(flags) ? flags : String(flags).split(',');
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((f, i) => (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 rounded text-xs bg-magenta/20 text-magenta"
        >
          {f.trim()}
        </span>
      ))}
    </div>
  );
}

const columns = [
  { key: 'signature', label: 'Signature', render: (v) => truncate(v, 40) },
  { key: 'identity', label: 'Identity', render: (v) => truncate(v, 30) },
  { key: 'score', label: 'Score', sortable: true, render: scoreBadge },
  { key: 'flags', label: 'Flags', render: flagsPills },
  { key: 'agent', label: 'Agent', render: (v) => truncate(v, 40) },
  { key: 'count15m', label: '15m', sortable: true },
  { key: 'count1h', label: '1h', sortable: true },
  { key: 'count24h', label: '24h', sortable: true },
];

export default function Fingerprint() {
  const { apiUrl } = useApi();
  const [sort, setSort] = useState('count15m');
  const url = apiUrl('/fingerprint.json', { sort, limit: 100 });
  const { data, error, loading, retry } = usePolling(url, 5000);

  return (
    <div>
      <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">
        Fingerprint
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
        <DataTable data={data} columns={columns} sort={sort} onSort={setSort} />
      )}
    </div>
  );
}
