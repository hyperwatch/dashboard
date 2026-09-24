import { createContext, useContext, useMemo, useState } from 'react';
import RequestDetailPanel from '../components/RequestDetailPanel';

// The log entry shown in the request detail panel. Any log line can open it,
// wherever it is rendered, and the panel sits above the other side panels.
const RequestDetailContext = createContext({
  selected: null,
  open: () => {},
  close: () => {},
});

export function RequestDetailProvider({ children }) {
  const [selected, setSelected] = useState(null);

  const value = useMemo(
    () => ({ selected, open: setSelected, close: () => setSelected(null) }),
    [selected]
  );

  return (
    <RequestDetailContext.Provider value={value}>
      {children}
      {selected && (
        <RequestDetailPanel entry={selected} onClose={value.close} />
      )}
    </RequestDetailContext.Provider>
  );
}

export function useRequestDetail() {
  return useContext(RequestDetailContext);
}
