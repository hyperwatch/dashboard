import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildUrl } from './api';

// The dashboard is served by a Hyperwatch process (the "instance") and talks
// to it on bare paths, same origin. The host application can describe sibling
// instances in /dashboard.json ({ name, instances: [{ name, label, url }] });
// they are shown as links in the sidebar. Without it, there is no switcher.
const EMPTY = { name: null, instances: [] };

// Pages backed by optional Hyperwatch modules, shown only when the instance
// answers on their endpoint. One cheap request each, once per page load.
const OPTIONAL = {
  firewall: '/firewall/lists.json',
  fingerprint: '/fingerprint.json?limit=1',
};

async function fetchJson(path) {
  try {
    const res = await fetch(path);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const InstanceContext = createContext({ ...EMPTY, modules: {} });

export function InstanceProvider({ children }) {
  const [config, setConfig] = useState(EMPTY);
  const [modules, setModules] = useState({});

  useEffect(() => {
    fetchJson('/dashboard.json').then(
      (data) => data && setConfig({ ...EMPTY, ...data })
    );
    Promise.all(
      Object.entries(OPTIONAL).map(async ([name, path]) => [
        name,
        (await fetchJson(path)) !== null,
      ])
    ).then((entries) => setModules(Object.fromEntries(entries)));
  }, []);

  const value = useMemo(() => ({ ...config, modules }), [config, modules]);

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstance() {
  return useContext(InstanceContext);
}

// Request helpers for the instance serving the dashboard.
const api = {
  path: (path) => path,
  apiUrl: (path, params) => buildUrl(path, params),
};

export function useApi() {
  return api;
}
