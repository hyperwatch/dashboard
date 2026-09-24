import { useRef, useEffect, useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import useWebSocket from '../hooks/useWebSocket';
import { useApi } from '../lib/InstanceContext';
import LogEntry from '../components/LogEntry';

function formatRate(rate) {
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)}k/s`;
  if (rate >= 1) return `${rate.toFixed(1)}/s`;
  if (rate > 0) return `${(rate * 60).toFixed(0)}/m`;
  return '';
}

function formatCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
}

function TreeNode({ node, onSelect }) {
  const isNamed = !!node.name;
  const hasTraffic = node.count > 0;
  const isAnonymous = !node.name && !node.module && !node.fnName && !node.label;
  const isLeaf = !node.children || node.children.length === 0;

  // Hide anonymous leaf nodes (internal plumbing like logs/history sinks)
  if (isAnonymous && isLeaf) return null;

  return (
    <div className="pl-4 border-l border-border">
      <div
        onClick={isNamed ? () => onSelect(node.name) : undefined}
        className={`py-0.5 text-xs flex items-center gap-1.5 ${isNamed ? 'cursor-pointer hover:bg-bg-card/50 rounded px-1 -ml-1' : ''}`}
      >
        {node.name && <span className="text-cyan font-bold">{node.name}</span>}
        <span
          className={
            node.name || node.label ? 'text-text-dim' : 'text-text-dim/50'
          }
        >
          [{node.op}]
        </span>
        {node.module && <span className="text-green">({node.module})</span>}
        {node.fnName && <span className="text-text-dim">.{node.fnName}</span>}
        {node.label && <span className="text-yellow italic">{node.label}</span>}
        {hasTraffic && (
          <span className="ml-auto flex items-center gap-2 tabular-nums text-[10px]">
            <span className="text-text-dim">{formatCount(node.count)}</span>
            {node.rate > 0 && (
              <span
                className={`${node.rate >= 10 ? 'text-yellow' : 'text-green'}`}
              >
                {formatRate(node.rate)}
              </span>
            )}
          </span>
        )}
      </div>
      {node.children?.map((child, i) => (
        <TreeNode key={i} node={child} onSelect={onSelect} />
      ))}
    </div>
  );
}

function NodePanel({ nodeName, onClose }) {
  const { path } = useApi();
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  const { entries, connected } = useWebSocket(path(`/logs/${nodeName}`), {
    maxEntries: 200,
    historyUrl: path(`/history/${nodeName}.json`),
  });

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
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
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
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-cyan font-bold text-sm">{nodeName}</span>
          <span
            className={`text-[10px] ${connected ? 'text-green' : 'text-red'}`}
          >
            ●
          </span>
        </div>
        <span className="text-[10px] text-text-dim ml-auto mr-3">
          oldest → newest
        </span>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text cursor-pointer text-lg leading-none"
        >
          ×
        </button>
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

export default function Nodes() {
  const { apiUrl } = useApi();
  const {
    data: tree,
    error,
    loading,
  } = usePolling(apiUrl('/nodes.json', { view: 'tree' }), 5000);
  const [selectedNode, setSelectedNode] = useState(null);
  const handleClose = useCallback(() => setSelectedNode(null), []);

  return (
    <div className="relative h-full">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
          Pipeline Nodes
        </h2>
      </div>
      {error && <div className="text-red mb-4 text-xs">Error: {error}</div>}
      {loading && !tree ? (
        <div className="text-text-dim animate-pulse">Loading…</div>
      ) : tree ? (
        <div className="bg-bg-card rounded border border-border p-3 overflow-auto">
          {tree.inputs && tree.inputs.length > 0 && (
            <div className="pl-4 border-l border-border mb-1">
              {tree.inputs.map((input) => (
                <div
                  key={input.name}
                  onClick={
                    input.node ? () => setSelectedNode(input.node) : undefined
                  }
                  className={`py-0.5 text-xs flex items-center gap-1.5 ${input.node ? 'cursor-pointer hover:bg-bg-card/50 rounded px-1 -ml-1' : ''}`}
                >
                  <span
                    className={`text-[10px] ${input.status === 'Connected' ? 'text-green' : 'text-red'}`}
                  >
                    ●
                  </span>
                  <span className="text-magenta font-bold">{input.name}</span>
                  <span className="text-text-dim">[input]</span>
                  <span className="ml-auto flex items-center gap-2 tabular-nums text-[10px]">
                    <span className="text-green">
                      {formatCount(input.accepted)}
                    </span>
                    {input.rejected > 0 && (
                      <span className="text-red">
                        {formatCount(input.rejected)} rej
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          <TreeNode node={tree} onSelect={setSelectedNode} />
        </div>
      ) : null}
      {selectedNode && (
        <NodePanel nodeName={selectedNode} onClose={handleClose} />
      )}
    </div>
  );
}
