import { NavLink, useSearchParams } from 'react-router-dom';
import { useInstance } from '../lib/InstanceContext';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/addresses', label: 'Addresses' },
  { to: '/signatures', label: 'Signatures' },
  { to: '/identities', label: 'Identities' },
  // Only when the instance runs the matching Hyperwatch module
  { to: '/fingerprint', label: 'Fingerprint', module: 'fingerprint' },
  { to: '/firewall', label: 'Firewall', module: 'firewall' },
  { to: '/logs', label: 'Logs' },
  { to: '/nodes', label: 'Nodes' },
  { to: '/status', label: 'Status' },
];

const viewParams = ['filter', 'tw'];

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
