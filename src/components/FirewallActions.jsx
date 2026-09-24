import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInstance } from '../lib/InstanceContext';
import ConfirmModal from './ConfirmModal';
import {
  ACTION_LABELS,
  ACTION_BADGE,
  ACTION_BUTTON,
  useFirewallLists,
  useFirewallLookup,
  useFirewallEdit,
} from '../lib/firewall';

const TYPE_LABELS = { ip: 'IP', user_agent: 'User-Agent' };

const ACTIONS = ['monitor', 'challenge', 'block'];

// Firewall status of one IP address or user agent, with buttons to add it to
// a list of the matching type, or take it off the list it is on.
// Nothing to show on instances without the firewall module
export default function FirewallActions(props) {
  const { modules } = useInstance();
  return modules.firewall ? <FirewallListActions {...props} /> : null;
}

function FirewallListActions({ type, value, label = value }) {
  const [version, setVersion] = useState(0);
  const [adding, setAdding] = useState(null); // list being added to
  const [error, setError] = useState(null);
  const { lists, refresh } = useFirewallLists();
  const matches = useFirewallLookup(type, [value], version);
  const edit = useFirewallEdit();
  const match = matches[value];

  async function run(listId, op, body) {
    setError(null);
    try {
      await edit(listId, op, body);
    } catch (err) {
      setError(err.message);
    }
    setVersion((v) => v + 1);
    refresh();
  }

  function handleConfirm(reason) {
    run(adding.id, 'add', {
      value,
      reason: reason || undefined,
      source: 'dashboard',
    });
    setAdding(null);
  }

  const candidates = (lists || []).filter((l) => l.type === type);

  return (
    <div className="px-3 py-2 border-b border-border">
      {match ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded ${ACTION_BADGE[match.action]}`}
          >
            {ACTION_LABELS[match.action] || match.action}
          </span>
          <Link
            to={`/firewall?list=${encodeURIComponent(match.list)}`}
            className="text-[11px] font-mono text-cyan hover:underline"
          >
            {match.list}
          </Link>
          {match.value !== value ? (
            // Matched through a CIDR or a `contains` entry: removing it would
            // affect other values, so leave that to the list page.
            <span className="text-[11px] text-text-dim">
              via{' '}
              <span className="font-mono text-text break-all">
                {match.value}
              </span>
            </span>
          ) : (
            <button
              onClick={() => run(match.list, 'remove', { value })}
              className={`px-2 py-1 text-[10px] rounded cursor-pointer transition-colors ${ACTION_BUTTON[match.action]}`}
            >
              Remove from list
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {type !== 'ip' && (
            <span className="text-[10px] text-text-dim">
              {TYPE_LABELS[type]}:
            </span>
          )}
          {ACTIONS.map((action) => {
            // First list of this type and action, as the firewall matches
            const list = candidates.find((l) => l.action === action);
            const text = action[0].toUpperCase() + action.slice(1);
            // Only Cloudflare-linked block / challenge lists act at the edge
            const localOnly = list && !list.cloudflare && action !== 'monitor';
            return (
              <button
                key={action}
                onClick={() => setAdding(list)}
                disabled={!list}
                title={
                  list
                    ? `Add to ${list.id}${localOnly ? ' (local only: tagged, not enforced at Cloudflare)' : ''}`
                    : `No ${TYPE_LABELS[type]} list with action "${action}" in firewall.json`
                }
                className={`px-2 py-1 text-[10px] rounded transition-colors ${ACTION_BUTTON[action]} disabled:opacity-30 disabled:cursor-default ${list ? 'cursor-pointer' : ''}`}
              >
                {text}
                {localOnly && <span className="opacity-60 ml-1">· local</span>}
              </button>
            );
          })}
        </div>
      )}
      {error && <div className="text-red text-[10px] mt-1">{error}</div>}

      {adding && (
        <ConfirmModal
          title={`Add ${label} to ${adding.id} (${adding.action})?`}
          onConfirm={handleConfirm}
          onCancel={() => setAdding(null)}
        />
      )}
    </div>
  );
}

// Compact table badge for a lookup match
export function FirewallBadge({ match }) {
  if (!match) return null;
  return (
    <span
      title={`${match.list}: ${match.value}`}
      className={`px-1.5 py-0.5 text-[10px] rounded ${ACTION_BADGE[match.action]}`}
    >
      {ACTION_LABELS[match.action] || match.action}
    </span>
  );
}
