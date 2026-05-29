interface Props {
  totalActive: number;
  totalPRs: number;
  totalTasks: number;
  updatedAt: string | null;
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-xl font-bold text-gray-100">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export function StatsBar({ totalActive, totalPRs, totalTasks, updatedAt }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat icon="🟢" label="Active Agents" value={totalActive} />
      <Stat icon="📦" label="PRs Shipped" value={totalPRs} />
      <Stat icon="✅" label="Tasks Done" value={totalTasks} />
      <Stat icon="🕐" label="Last Update" value={
        updatedAt
          ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'never'
      } />
    </div>
  );
}
