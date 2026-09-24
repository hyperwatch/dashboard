import { useHref, useLocation } from 'react-router-dom';
import { useInstance } from '../lib/InstanceContext';

function isCurrent(instance, current) {
  if (current && instance.name === current) return true;
  try {
    return new URL(instance.url).origin === window.location.origin;
  } catch {
    return false;
  }
}

// Links to the sibling instances described in /dashboard.json, keeping the
// current page and its settings (query string). Each instance serves its own
// dashboard. useLocation re-renders the links on every navigation.
export default function InstanceSwitcher() {
  const { name, instances } = useInstance();
  const { pathname, search } = useLocation();
  const here = useHref({ pathname, search }); // includes the /dashboard basename

  if (instances.length === 0) return null;

  return (
    <div className="px-2 py-2 border-b border-border">
      <div className="text-[9px] text-text-dim uppercase tracking-widest px-1 pb-1">
        Instance
      </div>
      <div className="flex flex-col gap-0.5">
        {instances.map((instance) => (
          <a
            key={instance.name}
            href={`${instance.url.replace(/\/$/, '')}${here}`}
            title={instance.url}
            className={`block px-2 py-1 rounded text-[11px] transition-colors ${
              isCurrent(instance, name)
                ? 'bg-cyan/20 text-cyan'
                : 'text-text-dim hover:text-text hover:bg-bg-card/50'
            }`}
          >
            {instance.label || instance.name}
          </a>
        ))}
      </div>
    </div>
  );
}
