import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildUrl } from './api';

// The dashboard is served by a Hyperwatch process (the "instance") and talks
// to it on bare paths, same origin.

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

const InstanceContext = createContext({ modules: {} });

export function InstanceProvider({ children }) {
  const [modules, setModules] = useState({});

  useEffect(() => {
    Promise.all(
      Object.entries(OPTIONAL).map(async ([name, path]) => [
        name,
        (await fetchJson(path)) !== null,
      ])
    ).then((entries) => setModules(Object.fromEntries(entries)));
  }, []);

  const value = useMemo(() => ({ modules }), [modules]);

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
