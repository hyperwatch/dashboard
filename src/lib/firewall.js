import { useState, useEffect, useCallback } from 'react';
import { useApi, useInstance } from './InstanceContext';
import usePolling from '../hooks/usePolling';

// Firewall lists live in the Hyperwatch firewall module: typed lists of IPs /
// CIDRs or user agents, each with one action (block, challenge, monitor), some
// linked to a Cloudflare custom rule.

export const ACTION_LABELS = {
  block: 'Blocked',
  challenge: 'Challenged',
  monitor: 'Monitored',
};

export const ACTION_BADGE = {
  block: 'bg-red/20 text-red',
  challenge: 'bg-orange/20 text-orange',
  monitor: 'bg-yellow/20 text-yellow',
};

export const ACTION_BUTTON = {
  block: 'bg-red/20 text-red hover:bg-red/30',
  challenge: 'bg-orange/20 text-orange hover:bg-orange/30',
  monitor: 'bg-yellow/20 text-yellow hover:bg-yellow/30',
};

export function useFirewallLists(interval = 10000) {
  const { path } = useApi();
  const { data, error, loading, retry } = usePolling(
    path('/firewall/lists.json'),
    interval
  );
  return { lists: data?.lists, error, loading, refresh: retry };
}

// Which list each value falls into: { [value]: { list, action, value } | null }.
// `type` is 'ip' or 'user_agent'. Refetches when the set of values changes,
// or when `version` changes (after an edit).
export function useFirewallLookup(type, values, version = 0) {
  const { path } = useApi();
  const { modules } = useInstance();
  const [matches, setMatches] = useState({});
  const key = [...new Set((values || []).filter(Boolean))].sort().join('\n');

  useEffect(() => {
    // No firewall module on this instance: nothing to look up
    if (!key || !modules.firewall) {
      setMatches({});
      return;
    }
    const controller = new AbortController();
    const field = type === 'ip' ? 'addresses' : 'user_agents';
    fetch(path('/firewall/lookup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: key.split('\n') }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data) => setMatches(data[field] || {}))
      .catch((err) => {
        if (err.name !== 'AbortError')
          console.error('Firewall lookup failed:', err);
      });
    return () => controller.abort();
  }, [type, key, version, path, modules.firewall]);

  return matches;
}

export function useFirewallEdit() {
  const { path } = useApi();
  return useCallback(
    async (listId, op, body) => {
      const res = await fetch(
        path(`/firewall/lists/${encodeURIComponent(listId)}/${op}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
    },
    [path]
  );
}

// The User-Agent line of a signature's `headers` column ("Name:value<br>...")
export function userAgentFromHeaders(headers) {
  if (!headers) return null;
  for (const line of headers.split('<br>')) {
    const idx = line.indexOf(':');
    if (
      idx !== -1 &&
      line.slice(0, idx).trim().toLowerCase() === 'user-agent'
    ) {
      return line.slice(idx + 1) || null;
    }
  }
  return null;
}
