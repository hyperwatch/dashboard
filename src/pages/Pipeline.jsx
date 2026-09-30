import { useRef, useEffect, useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import useWebSocket from '../hooks/useWebSocket';
import { useApi } from '../lib/InstanceContext';
import LogStream from '../components/LogStream';

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

// The address of this instance, for http or ws
function baseAddress(scheme) {
  const secure = window.location.protocol === 'https:' ? 's' : '';
  return `${scheme}${secure}://${window.location.host}`;
}

// Inputs report where they listen as "http://__HOST__/input/log": only the
// client knows the host it reaches the instance on
function fillHost(status) {
  return status.replace(/\b(http|ws):\/\/__HOST__/g, (match, scheme) =>
    baseAddress(scheme)
  );
}

// Log streams label their step "http:/logs/main" or "ws:/logs/main": shown
// as full addresses, the HTTP one linking to the stream
function StreamLabel({ label }) {
  const match = /^(http|ws):\/(.*)$/.exec(label);
  if (!match) return label;
  const [, scheme, path] = match;
  const address = `${baseAddress(scheme)}/${path}`;
  return scheme === 'http' ? (
    <a href={`/${path}`} className="underline">
      {address}
    </a>
  ) : (
    address
  );
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
        {node.name && <strong>{node.name}</strong>}
        {node.op && (
          <span
            className={
              node.name || node.label ? 'text-text-dim' : 'text-text-dim/50'
            }
          >
            [{node.op}]
          </span>
        )}
        {node.module && <span className="text-green">({node.module})</span>}
        {node.fnName && <span className="text-cyan">{node.fnName}</span>}
        {node.label && (
          <span className="text-yellow" onClick={(e) => e.stopPropagation()}>
            <StreamLabel label={node.label} />
          </span>
        )}
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

// An input: its status, what it accepted and rejected in the last 15 minutes,
// then the steps it runs before its logs reach the pipeline
function Input({ input, onSelect }) {
  return (
    <div className="pl-4 border-l border-border">
      <div className="py-0.5 text-xs flex items-center gap-1.5">
        <strong>{input.name}</strong>
        <span className="text-text-dim">[input]</span>
        {input.status && (
          <span className="text-green">({fillHost(input.status)})</span>
        )}
        <span>
          accepted: {input.accepted}, rejected: {input.rejected}
        </span>
      </div>
      {input.tree && <TreeNode node={input.tree} onSelect={onSelect} />}
    </div>
  );
}

function NodePanel({ nodeName, onClose }) {
  const { path } = useApi();
  const panelRef = useRef(null);

  const { entries, connected } = useWebSocket(path(`/logs/${nodeName}`), {
    maxEntries: 200,
    historyUrl: path(`/history/${nodeName}.json`),
  });

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
      <LogStream
        entries={entries}
        connected={connected}
        className="px-3 pb-2 text-[11px]"
      />
    </div>
  );
}

export default function Pipeline() {
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
          Pipeline
        </h2>
      </div>
      {error && <div className="text-red mb-4 text-xs">Error: {error}</div>}
      {loading && !tree ? (
        <div className="text-text-dim animate-pulse">Loading…</div>
      ) : tree ? (
        <div className="bg-bg-card rounded border border-border p-3 overflow-auto">
          {tree.inputs?.length > 0 && (
            <div className="mb-3">
              {tree.inputs.map((input) => (
                <Input
                  key={input.name}
                  input={input}
                  onSelect={setSelectedNode}
                />
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
