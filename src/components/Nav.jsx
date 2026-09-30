import { NavLink, useSearchParams } from 'react-router-dom';
import { useInstance } from '../lib/InstanceContext';

// The order of Hyperwatch's HTML navigation, after the overview. Signatures
// has a page (/signatures) but no link, like there.
const links = [
  { to: '/', label: 'Overview' },
  { to: '/status', label: 'Status' },
  { to: '/addresses', label: 'Addresses' },
  { to: '/identities', label: 'Identities' },
  { to: '/logs', label: 'Logs' },
  { to: '/pipeline', label: 'Pipeline' },
  // Only when the instance runs the matching Hyperwatch module
  { to: '/fingerprint', label: 'Fingerprint', module: 'fingerprint' },
  { to: '/firewall', label: 'Firewall', module: 'firewall' },
];

const viewParams = ['filter', 'period'];

export default function Nav() {
  const [searchParams] = useSearchParams();
  const { modules } = useInstance();
  const preserved = new URLSearchParams();
  for (const key of viewParams) {
    if (searchParams.has(key)) preserved.set(key, searchParams.get(key));
  }
  const qs = preserved.toString();
  const suffix = qs ? `?${qs}` : '';

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      {links
        .filter(({ module }) => !module || modules[module])
        .map(({ to, label }) => (
          <NavLink
            key={to}
            to={`${to}${suffix}`}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-2 py-1 rounded text-[11px] transition-colors ${
                isActive
                  ? 'bg-bg-card text-cyan'
                  : 'text-text-dim hover:text-text hover:bg-bg-card/50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
    </nav>
  );
}
