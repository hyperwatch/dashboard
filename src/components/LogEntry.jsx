export function formatAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') return address;
  if (address.hostname) return address.hostname;
  return address.value || null;
}

export function matchAddress(entry, address) {
  const a = entry.address;
  if (!a) return false;
  if (typeof a === 'string') return a === address;
  return a.value === address;
}

import { execTimeColor } from '../lib/format';
import { useRequestDetail } from '../lib/RequestDetailContext';

export default function LogEntry({ entry }) {
  const { selected, open } = useRequestDetail();
  if (typeof entry === 'string') return <span>{entry}</span>;

  const time = entry.request?.time?.slice(11, -5);
  const addr = formatAddress(entry.address);
  const identity = entry.identity;
  const method = entry.request?.method;
  const url = entry.request?.url?.split('?')[0];
  const status = entry.response?.status;
  const execTime = entry.executionTime;
  const agentObj = entry.agent;
  const agent =
    agentObj?.family && agentObj.family !== 'Other'
      ? `${agentObj.family}/${agentObj.major || 0}.${agentObj.minor || 0}`
      : null;

  const parts = [];
  if (time)
    parts.push(
      <span key="t" className="text-text-dim">
        {time}
      </span>
    );
  if (identity)
    parts.push(
      <span key="i" className="text-magenta">
        {identity}
      </span>
    );
  if (addr)
    parts.push(
      <span key="a" className="text-cyan">
        {addr}
      </span>
    );
  if (method || url || status) {
    parts.push(
      <span key="r">
        &quot;{method} {url} {status}&quot;
      </span>
    );
  }
  if (execTime) {
    parts.push(
      <span key="e" className={execTimeColor(execTime)}>
        {execTime}ms
      </span>
    );
  }
  if (agent)
    parts.push(
      <span key="g" className="text-text-dim">
        {agent}
      </span>
    );

  if (parts.length === 0) return <span>{JSON.stringify(entry)}</span>;

  // Click to open the request detail panel
  return (
    <span
      data-log-entry
      onClick={() => open(entry)}
      className={`block -mx-1 px-1 rounded cursor-pointer ${
        entry === selected ? 'bg-cyan/15' : 'hover:bg-cyan/5'
      }`}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          {part}
        </span>
      ))}
    </span>
  );
}
