import { useRef, useEffect, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { formatNumber, countryFlag } from '../lib/format';
import LogEntry, { matchAddress } from './LogEntry';
import { useApi } from '../lib/InstanceContext';

export default function IdentityPanel({ row, onClose }) {
  const { path } = useApi();
  const identity = row.identity;
  const address = row.address;
  const panelRef = useRef(null);

  // Entries are keyed by identity, falling back to the address when the
  // request could not be classified -- scope the logs the same way.
  const historyUrl = identity
    ? path(
        `/history/main.json?identity=${encodeURIComponent(identity)}&limit=100`
      )
    : path(
        `/history/main.json?address=${encodeURIComponent(address)}&limit=100`
      );

  const filterFn = useCallback(
    (entry) =>
      identity ? entry.identity === identity : matchAddress(entry, address),
    [identity, address]
  );

  const { entries, connected } = useWebSocket(path('/logs/main'), {
    maxEntries: 200,
    historyUrl,
    filter: filterFn,
  });

  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    function handleMouseDown(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest('tbody tr') &&
        !e.target.closest('[data-request-detail]')
      )
        onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (stickRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 w-4/5 max-w-[calc(100vw-10rem)] border-l border-border bg-bg-sidebar flex flex-col z-20"
    >
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-start justify-between mb-2">
          {identity ? (
            <span className="text-magenta text-sm font-mono font-bold break-all">
              {identity}
            </span>
          ) : (
            <span className="text-cyan text-sm font-mono font-bold break-all">
              {address}
            </span>
          )}
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text ml-2 flex-shrink-0 cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="text-xs text-text-dim space-y-0.5">
          {row.agent && (
            <div>
              <span className="text-text">{row.agent}</span>
            </div>
          )}
          {identity && (
            <div className="text-cyan">{row.hostname || address}</div>
          )}
          {row.country && (
            <div>
              {countryFlag(row.country)} {row.country}
              {row.city ? `, ${row.city}` : ''}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-text-dim">15m</div>
            <div className="tabular-nums">{formatNumber(row.count15m)}</div>
          </div>
          <div>
            <div className="text-text-dim">24h</div>
            <div className="tabular-nums">{formatNumber(row.count24h)}</div>
          </div>
          <div>
            <div className="text-text-dim">Exec 15m</div>
            <div>{row.execTime15m || '—'}</div>
          </div>
          <div>
            <div className="text-text-dim">Exec 24h</div>
            <div>{row.execTime24h || '—'}</div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
          Logs
        </span>
        <span
          className={`text-[10px] ${connected ? 'text-green' : 'text-red'}`}
        >
          {connected ? '●' : '●'}
        </span>
        <span className="text-[10px] text-text-dim ml-auto">
          oldest → newest
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto px-3 pb-2 min-h-0"
      >
        {entries.length === 0 ? (
          <div className="text-text-dim text-center py-6 text-xs">
            {connected ? 'Waiting for logs…' : 'Connecting…'}
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="text-[11px] leading-5 text-text">
              <LogEntry entry={entry} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
