import type { AgentStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  standby: 'bg-yellow-500',
  'on-ice': 'bg-blue-400',
  offline: 'bg-gray-500',
  unknown: 'bg-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  standby: 'Standby',
  'on-ice': 'On Ice',
  offline: 'Offline',
  unknown: 'Unknown',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

interface Props {
  agent: AgentStatus;
}

export function AgentCard({ agent }: Props) {
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.unknown;
  const statusLabel = STATUS_LABELS[agent.status] || agent.status;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-gray-700 hover:bg-gray-900/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${statusColor} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
          <h3 className="font-semibold text-gray-100">{agent.name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          agent.status === 'active' ? 'border-green-700 text-green-400 bg-green-950' :
          agent.status === 'standby' ? 'border-yellow-700 text-yellow-400 bg-yellow-950' :
          agent.status === 'on-ice' ? 'border-blue-700 text-blue-400 bg-blue-950' :
          'border-gray-700 text-gray-400 bg-gray-900'
        }`}>
          {statusLabel}
        </span>
      </div>

      {/* Lane */}
      <p className="text-sm text-gray-400 mb-2">{agent.lane}</p>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="text-xs bg-gray-800/50 rounded-lg px-3 py-2 mb-3 text-gray-300 border border-gray-800">
          <span className="text-gray-500">Task:</span> {agent.currentTask}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span>📦</span>
          <span>{agent.prsShipped} PRs</span>
        </div>
        <div className="flex items-center gap-1">
          <span>✅</span>
          <span>{agent.tasksCompleted} tasks</span>
        </div>
        <div className="ml-auto text-gray-600">
          {timeAgo(agent.lastHeartbeat)}
        </div>
      </div>

      {/* Leverage Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Utilization</span>
          <span className="text-gray-400">{agent.leverage}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              agent.leverage >= 60 ? 'bg-green-500' :
              agent.leverage >= 30 ? 'bg-yellow-500' :
              agent.leverage > 0 ? 'bg-gray-500' : 'bg-gray-700'
            }`}
            style={{ width: `${agent.leverage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
