import { createContext, useContext, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// The view of aggregator pages, kept in the query string with the parameters
// of Hyperwatch's API: the last 15 minutes, or 24 hours with ?period=24h, and
// all entries, or ?filter=identified / unidentified.
export const periods = ['15m', '24h'];
export const filters = ['all', 'identified', 'unidentified'];

const ViewContext = createContext();

export function ViewProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filters.includes(searchParams.get('filter'))
    ? searchParams.get('filter')
    : 'all';
  const period = searchParams.get('period') === '24h' ? '24h' : '15m';

  const update = useCallback(
    (change) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          change(params);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setFilter = useCallback(
    (next) =>
      update((params) => {
        if (next === 'all') params.delete('filter');
        else params.set('filter', next);
      }),
    [update]
  );
  // Switching period drops the sort, which goes back to the count of the
  // period
  const setPeriod = useCallback(
    (next) =>
      update((params) => {
        params.delete('sort');
        if (next === '24h') params.set('period', next);
        else params.delete('period');
      }),
    [update]
  );

  return (
    <ViewContext.Provider value={{ filter, setFilter, period, setPeriod }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  return useContext(ViewContext);
}
