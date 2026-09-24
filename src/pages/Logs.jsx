import { useRef, useEffect } from 'react';
import usePolling from '../hooks/usePolling';
import useWebSocket from '../hooks/useWebSocket';
import { useApi } from '../lib/InstanceContext';
import LogEntry from '../components/LogEntry';
import useUrlState from '../hooks/useUrlState';

export default function Logs() {
  const { apiUrl, path } = useApi();
  const [node, setNode] = useUrlState('node', 'main');
  const { data: nodes } = usePolling(apiUrl('/nodes.json'), 30000);
  const { entries, connected, paused, setPaused, resume, clear } = useWebSocket(
    path(`/logs/${node}`),
    { historyUrl: path(`/history/${node}.json`) }
  );
  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    if (!paused && stickRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, paused]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
          Live Logs
        </h2>
        {nodes && (
          <div className="flex gap-1">
            {nodes.map((n) => (
              <button
                key={n}
                onClick={() => setNode(n)}
                className={`px-2 py-0.5 text-[10px] rounded-full cursor-pointer transition-colors ${
                  node === n
                    ? 'bg-cyan/20 text-cyan'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <span
          className={`text-[10px] ${connected ? 'text-green' : 'text-red'}`}
        >
          {connected ? '●' : '●'}
        </span>
        <div className="flex gap-1.5 ml-auto">
          <button
            onClick={() => (paused ? resume() : setPaused(true))}
            className={`px-2 py-0.5 rounded text-[10px] border border-border ${
              paused
                ? 'bg-yellow/20 text-yellow'
                : 'bg-bg-card text-text-dim hover:text-text'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clear}
            className="px-2 py-0.5 rounded text-[10px] border border-border bg-bg-card text-text-dim hover:text-text"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-bg-card rounded border border-border p-2 min-h-0"
      >
        {entries.length === 0 ? (
          <div className="text-text-dim text-center py-12">
            {connected ? 'Waiting for logs…' : 'Connecting…'}
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="text-xs leading-5 text-text">
              <LogEntry entry={entry} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
