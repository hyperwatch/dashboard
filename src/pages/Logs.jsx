import { Fragment } from 'react';
import usePolling from '../hooks/usePolling';
import useWebSocket from '../hooks/useWebSocket';
import { useApi } from '../lib/InstanceContext';
import { nodeLevels } from '../lib/nodes';
import LogStream from '../components/LogStream';
import useUrlState from '../hooks/useUrlState';

const separator = (text) => <span className="text-text-dim"> {text} </span>;

// The navigation between log streams, like in Hyperwatch's HTML interface:
// each level of the path to the current node, separated by ›, then the nodes
// below it. Below main, a level lists all its nodes (·). Nodes on the path
// are highlighted, the current node is bold.
function NodesNav({ tree, node, onSelect }) {
  const levels = nodeLevels(tree, node) || [
    [{ name: node, current: true, onPath: true }],
  ];

  return (
    <div className="px-2 py-1 border-b border-border">
      {levels.map((level, i) => (
        <Fragment key={i}>
          {i > 0 && separator('›')}
          {level.map(({ name, current, onPath }, j) => (
            <Fragment key={name}>
              {j > 0 && separator('·')}
              {current ? (
                <strong>{name}</strong>
              ) : (
                <button
                  onClick={() => onSelect(name)}
                  className={`cursor-pointer hover:text-text ${
                    onPath ? 'text-text' : 'text-text-dim'
                  }`}
                >
                  {name}
                </button>
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default function Logs() {
  const { apiUrl, path } = useApi();
  const [node, setNode] = useUrlState('node', 'main');
  const { data: tree } = usePolling(
    apiUrl('/nodes.json', { view: 'tree' }),
    30000
  );
  const { entries, connected, paused, setPaused, resume, clear } = useWebSocket(
    path(`/logs/${node}`),
    { historyUrl: path(`/history/${node}.json`) }
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
          Logs
        </h2>
        <span
          className={`text-[10px] ${connected ? 'text-green' : 'text-red'}`}
        >
          ●
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

      {/* The nodes stay above the lines, aligned with them */}
      <div className="flex-1 min-h-0 flex flex-col bg-bg-card rounded border border-border">
        <NodesNav tree={tree} node={node} onSelect={setNode} />
        <LogStream
          entries={entries}
          connected={connected}
          className="p-2 text-xs"
        />
      </div>
    </div>
  );
}
