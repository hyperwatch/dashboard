import { filters, periods, useView } from '../lib/ViewContext';

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[10px] rounded-full capitalize cursor-pointer transition-colors ${
        active ? 'bg-cyan/20 text-cyan' : 'text-text-dim hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

// The switches of an aggregator page, at the right of its heading line like
// in Hyperwatch's HTML interface: the identity filter (when the page has
// one), then the period, separated by |
export default function Switches({ identityFilter = false }) {
  const { filter, setFilter, period, setPeriod } = useView();

  return (
    <div className="flex items-center gap-1 ml-auto">
      {identityFilter && (
        <>
          {filters.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Pill>
          ))}
          <span className="text-text-dim mx-1">|</span>
        </>
      )}
      {periods.map((p) => (
        <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
          {p}
        </Pill>
      ))}
    </div>
  );
}
