import { memo } from 'react';
import {
  countryFlag,
  execTimeColor,
  formatAgent,
  formatExecTime,
} from '../lib/format';
import { useRequestDetail } from '../lib/RequestDetailContext';
import Hostname from './Hostname';

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

// One log, on one line like in Hyperwatch's log streams:
// time identity hostname country "request" execution time agent
function LogEntry({ entry }) {
  const { selected, open } = useRequestDetail();
  if (typeof entry === 'string') return <span>{entry}</span>;

  const time = entry.request?.time?.slice(11, -5);
  const addr = formatAddress(entry.address);
  const verified = !!entry.address?.hostname && !!entry.hostname?.verified;
  const country = entry.geoip?.country;
  const identity = entry.identity;
  const method = entry.request?.method;
  const url = entry.request?.url?.split('?')[0];
  const status = entry.response?.status;
  const execTime = entry.executionTime;
  const agent = formatAgent(
    entry.agent,
    entry.request?.headers?.['user-agent']
  );

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
  if (addr) parts.push(<Hostname key="a" value={addr} verified={verified} />);
  if (country)
    parts.push(
      <span key="c" className="text-text-dim">
        {countryFlag(country)} {country}
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
        {formatExecTime(execTime)}
      </span>
    );
  }
  if (parts.length === 0) return <span>{JSON.stringify(entry)}</span>;

  parts.push(
    <span key="g" className="text-text-dim">
      {agent || <em>Empty</em>}
    </span>
  );

  // Click to open the request detail panel. The line is cut at the edge, not
  // wrapped.
  return (
    <span
      data-log-entry
      onClick={() => open(entry)}
      className={`block truncate -mx-1 px-1 rounded cursor-pointer ${
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

// Entries don't change: a line is rendered once, however many follow it
export default memo(LogEntry);
