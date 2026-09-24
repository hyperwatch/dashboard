import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatNumber } from '../lib/format';
import { useFirewallLists, useFirewallEdit } from '../lib/firewall';
import useUrlState from '../hooks/useUrlState';

const TYPE_LABELS = { ip: 'IP', user_agent: 'User-Agent' };

function typeLabel(list) {
  return list.type === 'user_agent'
    ? `${TYPE_LABELS.user_agent} (${list.match || 'eq'})`
    : TYPE_LABELS[list.type];
}

// Sync status of a Cloudflare-linked list, from `pending` (null = never synced)
function SyncStatus({ list, long = false }) {
  if (!list.cloudflare) {
    return <span className="text-[10px] text-text-dim">local only</span>;
  }
  const pending = list.pending;
  const count = pending ? pending.added.length + pending.removed.length : 0;
  return (
    <span className="inline-flex items-center gap-2 text-[10px]">
      <span className="text-text-dim">
        {long ? `Cloudflare rule ${list.cloudflare.rule_id}` : 'Cloudflare'}
      </span>
      {pending === null ? (
        <span className="text-yellow">never synced</span>
      ) : count ? (
        <span className="text-yellow">
          {pending.added.length ? `+${pending.added.length}` : ''}
          {pending.added.length && pending.removed.length ? ' ' : ''}
          {pending.removed.length ? `−${pending.removed.length}` : ''} to sync
        </span>
      ) : (
        <span className="text-green">in sync</span>
      )}
    </span>
  );
}

function ListModal({ list, onClose, onChange }) {
  const edit = useFirewallEdit();
  const [filter, setFilter] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function run(op, body) {
    setBusy(true);
    setError(null);
    try {
      await edit(list.id, op, body);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
      onChange();
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    // Keep the input as typed for user agents; only IPs are safe to trim
    const v = list.type === 'ip' ? value.trim() : value;
    if (!v) return;
    if (
      await run('add', {
        value: v,
        reason: reason.trim() || undefined,
        source: 'dashboard',
      })
    ) {
      setValue('');
      setReason('');
    }
  }

  async function handleRemove(v) {
    setConfirmRemove(null);
    await run('remove', { value: v });
  }

  const unsynced = new Set(list.pending?.added || []);
  const needle = filter.trim().toLowerCase();
  const entries = needle
    ? list.entries.filter((e) =>
        [e.value, e.reason, e.source].some(
          (f) => f && f.toLowerCase().includes(needle)
        )
      )
    : list.entries;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-lg p-5 w-full max-w-3xl shadow-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text font-mono">
              {list.id}
            </h3>
            <StatusBadge value={list.action} />
            <span className="text-[11px] text-text-dim">{typeLabel(list)}</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="text-xs mb-3 space-y-1">
          <SyncStatus list={list} long />
          {list.cloudflare && (
            <div className="text-[10px] text-text-dim">
              Edits apply here right away. Run{' '}
              <code className="text-text">hyperwatch firewall sync up</code> to
              push them to Cloudflare.
            </div>
          )}
          {list.pending?.removed.length > 0 && (
            <div className="text-[10px] text-yellow">
              Removed here, still in Cloudflare until the next sync up:{' '}
              <span className="font-mono break-all">
                {list.pending.removed.join(', ')}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={list.type === 'ip' ? 'IP or CIDR' : 'User-Agent'}
            className="flex-1 min-w-0 bg-bg border border-border rounded px-2 py-1 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:border-cyan"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-48 bg-bg border border-border rounded px-2 py-1 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-cyan"
          />
          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="px-3 py-1 text-xs rounded bg-cyan/20 text-cyan hover:bg-cyan/30 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-default"
          >
            Add
          </button>
        </form>
        {error && <div className="text-red text-xs mb-2">{error}</div>}

        <div className="flex items-center gap-2 mb-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter entries"
            className="flex-1 bg-bg border border-border rounded px-2 py-1 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-cyan"
          />
          <span className="text-[10px] text-text-dim tabular-nums">
            {needle ? `${entries.length} / ` : ''}
            {list.entries.length} entries
          </span>
        </div>

        <div className="overflow-auto min-h-0 rounded border border-border">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-bg-sidebar sticky top-0">
                {['Value', 'Reason', 'Added', 'Source', ''].map((h, i) => (
                  <th
                    key={i}
                    className="px-2 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-text-dim border-b border-border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.value}
                  className="border-b border-border/50 align-top"
                >
                  <td
                    className={`px-2 py-1 font-mono text-text ${list.type === 'ip' ? 'whitespace-nowrap' : 'break-all min-w-[18rem]'}`}
                  >
                    {entry.value}
                    {unsynced.has(entry.value) && (
                      <span className="ml-2 text-[10px] text-yellow font-sans">
                        not synced
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-text-dim">
                    {entry.reason || ''}
                  </td>
                  <td className="px-2 py-1 text-text-dim whitespace-nowrap">
                    {entry.added || ''}
                  </td>
                  <td className="px-2 py-1 text-text-dim">
                    {entry.source || ''}
                  </td>
                  <td className="px-2 py-1 text-right whitespace-nowrap">
                    {confirmRemove === entry.value ? (
                      <>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-1.5 text-[10px] text-text-dim hover:text-text cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRemove(entry.value)}
                          disabled={busy}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-red text-white hover:bg-red/80 cursor-pointer disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(entry.value)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-red/20 text-red hover:bg-red/30 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-4 text-center text-text-dim"
                  >
                    No entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Firewall() {
  const { apiUrl } = useApi();
  const [sort, setSort] = useUrlState('sort', 'count15m');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedList = searchParams.get('list');
  const { lists, error, loading, refresh } = useFirewallLists(5000);
  const { data: hits } = usePolling(
    apiUrl('/firewall.json', { limit: 100 }),
    5000
  );

  // Every list, with its hit counts (lists without hits have no aggregator entry)
  const rows = useMemo(() => {
    if (!lists) return null;
    const counts = new Map((hits || []).map((h) => [h.list, h]));
    return lists
      .map((list) => ({
        ...list,
        list: list.id,
        entryCount: list.entries.length,
        count15m: counts.get(list.id)?.count15m || 0,
        count24h: counts.get(list.id)?.count24h || 0,
      }))
      .sort((a, b) => b[sort] - a[sort]);
  }, [lists, hits, sort]);

  const columns = [
    {
      key: 'list',
      label: 'List',
      render: (v) => <span className="font-mono">{v}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (v, row) => (
        <span className="text-text-dim">{typeLabel(row)}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => <StatusBadge value={v} />,
    },
    {
      key: 'entryCount',
      label: 'Entries',
      sortable: true,
      render: (v) => formatNumber(v),
    },
    {
      key: 'cloudflare',
      label: 'Cloudflare',
      render: (v, row) => <SyncStatus list={row} />,
    },
    { key: 'count15m', label: '15m', sortable: true },
    { key: 'count24h', label: '24h', sortable: true },
  ];

  const handleClose = useCallback(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('list');
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const handleRowClick = useCallback(
    (row) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('list', row.id);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selected = lists?.find((l) => l.id === selectedList);

  return (
    <div>
      <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">
        Firewall
      </h2>
      {error && (
        <div className="text-red mb-4">
          Error: {error}{' '}
          <button onClick={refresh} className="underline text-cyan">
            retry
          </button>
        </div>
      )}
      {loading && !rows ? (
        <div className="text-text-dim animate-pulse">Loading…</div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          sort={sort}
          onSort={setSort}
          onRowClick={handleRowClick}
        />
      )}
      {selected && (
        <ListModal list={selected} onClose={handleClose} onChange={refresh} />
      )}
    </div>
  );
}
