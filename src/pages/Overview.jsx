import usePolling from '../hooks/usePolling';
import { useApi } from '../lib/InstanceContext';
import { formatNumber, truncate } from '../lib/format';
import StatCard from '../components/StatCard';
import Sparkline from '../components/Sparkline';
import PieChart from '../components/PieChart';

const COLORS = [
  '#4cdeea',
  '#e44cd0',
  '#4cea7a',
  '#eae44c',
  '#ea944c',
  '#ea4c4c',
  '#7a4cea',
  '#4c94ea',
];

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return COLORS[((h % COLORS.length) + COLORS.length) % COLORS.length];
}

export default function Overview() {
  const { apiUrl } = useApi();
  const { data: addresses } = usePolling(
    apiUrl('/addresses.json', { sort: 'count15m', limit: 5 }),
    5000
  );
  const { data: firewall } = usePolling(
    apiUrl('/firewall.json', { sort: 'count15m', limit: 5 }),
    5000
  );
  const { data: status } = usePolling(apiUrl('/status.json'), 10000);
  const { data: addressesRaw } = usePolling(
    apiUrl('/addresses.json', { sort: 'count15m', limit: 5, raw: true }),
    5000
  );
  const { data: identities } = usePolling(
    apiUrl('/identities.json', { sort: 'count15m', limit: 20 }),
    5000
  );

  const totalRequests15m =
    addresses?.reduce((sum, a) => sum + (a.count15m || 0), 0) || 0;
  const totalRequests24h =
    addresses?.reduce((sum, a) => sum + (a.count24h || 0), 0) || 0;
  const firewallBlocks15m =
    firewall?.reduce((sum, f) => sum + (f.count15m || 0), 0) || 0;
  const pipelineCount = status?.length || 0;

  // Extract sparkline data from raw addresses response
  const sparklineData = addressesRaw?.[0]?.activity?.map((v) => v ?? 0) || [];

  // Aggregate identities by name for pie chart
  const identityChartData = (() => {
    if (!identities) return [];
    const byName = {};
    for (const id of identities) {
      if (!id.identity) continue;
      const name = id.identity;
      byName[name] = (byName[name] || 0) + (id.count15m || 0);
    }
    const sorted = Object.entries(byName)
      .map(([label, value]) => ({ label, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 8);
    const rest = sorted.slice(8).reduce((sum, d) => sum + d.value, 0);
    if (rest > 0) top.push({ label: 'Other', value: rest });
    return top;
  })();

  return (
    <div>
      <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">
        Overview
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Top Addresses (15m)"
          value={totalRequests15m}
          color="text-cyan"
        >
          {sparklineData.length > 0 && (
            <Sparkline
              data={sparklineData}
              color="#4cdeea"
              width={140}
              height={24}
            />
          )}
        </StatCard>
        <StatCard
          label="Top Addresses (24h)"
          value={totalRequests24h}
          color="text-magenta"
        />
        <StatCard
          label="Firewall Hits (15m)"
          value={firewallBlocks15m}
          color="text-red"
        />
        <StatCard
          label="Pipeline Modules"
          value={pipelineCount}
          color="text-green"
        />
      </div>

      {/* Identities pie chart */}
      {identityChartData.length > 0 && (
        <div className="bg-bg-card rounded border border-border p-3 mb-6">
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Identities (15m)
          </h3>
          <PieChart data={identityChartData} width={160} height={160} />
        </div>
      )}

      {/* Top addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-bg-card rounded border border-border p-3">
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Top Addresses (15m)
          </h3>
          {addresses ? (
            <div className="flex flex-col gap-1">
              {addresses.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate mr-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: hashColor(a.address) }}
                    />
                    <span className="text-text truncate">{a.address}</span>
                  </span>
                  <span className="text-cyan tabular-nums font-bold">
                    {formatNumber(a.count15m)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-dim animate-pulse">Loading…</div>
          )}
        </div>

        <div className="bg-bg-card rounded border border-border p-3">
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Top Firewall Lists (15m)
          </h3>
          {firewall ? (
            <div className="flex flex-col gap-1">
              {firewall.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-text truncate mr-3">
                    {truncate(f.list, 40)}
                  </span>
                  <span className="text-red tabular-nums font-bold">
                    {formatNumber(f.count15m)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-dim animate-pulse">Loading…</div>
          )}
        </div>
      </div>
    </div>
  );
}
