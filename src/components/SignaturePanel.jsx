import { useRef, useEffect, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { formatNumber } from '../lib/format';
import LogEntry from './LogEntry';
import FirewallActions from './FirewallActions';
import { userAgentFromHeaders } from '../lib/firewall';
import { useApi } from '../lib/InstanceContext';

function matchSignature(entry, signature) {
  return entry.signature?.id === signature;
}

export default function SignaturePanel({ row, onClose }) {
  const { path } = useApi();
  const signature = row.signature;
  const userAgent = userAgentFromHeaders(row.headers);
  const panelRef = useRef(null);

  const historyUrl = path(
    `/history/main.json?signature=${encodeURIComponent(signature)}&limit=100`
  );
  const filterFn = useCallback(
    (entry) => matchSignature(entry, signature),
    [signature]
  );

  const { entries, connected } = useWebSocket(path('/logs/main'), {
    maxEntries: 200,
    historyUrl,
    filter: filterFn,
  });

  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    if (stickRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

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
          <span className="text-text-dim text-xs font-mono break-all">
            {signature}
          </span>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text ml-2 flex-shrink-0 cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="text-xs space-y-0.5">
          {row.identity && (
            <div>
              <span className="text-magenta">{row.identity}</span>
            </div>
          )}
          {row.agent && (
            <div>
              <span className="text-text">{row.agent}</span>
            </div>
          )}
        </div>
        {row.headers && (
          <div className="mt-2 text-[11px] font-mono bg-bg-card rounded p-2 space-y-0.5">
            {row.headers.split('<br>').map((line, i) => {
              const idx = line.indexOf(':');
              if (idx === -1) return <div key={i}>{line}</div>;
              return (
                <div key={i}>
                  <span className="text-text-dim">{line.slice(0, idx)}:</span>
                  <span className="text-text">{line.slice(idx + 1)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
          <div>
            <div className="text-text-dim">Latest address</div>
            <div className="text-cyan">{row.lastAddress || '—'}</div>
          </div>
          <div>
            <div className="text-text-dim">Addresses 15m / 24h</div>
            <div className="tabular-nums">
              {formatNumber(row.addressCount15m)} /{' '}
              {formatNumber(row.addressCount24h)}
            </div>
          </div>
          <div>
            <div className="text-text-dim">15m</div>
            <div className="tabular-nums">{formatNumber(row.count15m)}</div>
          </div>
          <div>
            <div className="text-text-dim">24h</div>
            <div className="tabular-nums">{formatNumber(row.count24h)}</div>
          </div>
        </div>
      </div>

      {userAgent ? (
        <FirewallActions
          type="user_agent"
          value={userAgent}
          label="this User-Agent"
        />
      ) : (
        <div className="px-3 py-2 border-b border-border text-[10px] text-text-dim">
          No User-Agent in this signature, nothing to add to a firewall list
        </div>
      )}

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
