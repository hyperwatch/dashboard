import { createContext, useContext, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const ViewContext = createContext();

export function ViewProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const timeWindow = searchParams.get('tw') || '15m';

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set(key, value);
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setFilter = useCallback((f) => updateParam('filter', f), [updateParam]);
  const setTimeWindow = useCallback(
    (tw) => updateParam('tw', tw),
    [updateParam]
  );

  return (
    <ViewContext.Provider
      value={{ filter, setFilter, timeWindow, setTimeWindow }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  return useContext(ViewContext);
}
