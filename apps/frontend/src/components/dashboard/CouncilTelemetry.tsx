import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AgentAction {
  id: string;
  agent_id: string;
  action_taken: string;
  status: string;
  timestamp: string;
  details: string;
}

interface AgentMetrics {
  agentId: string;
  actions24h: number;
  successRate: number;
  avgExecutionTime: number;
  lastActivity: string;
}

export default function CouncilTelemetry() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keyboard shortcut for audit log (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAuditLog(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Fetch real agent actions from D1
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('https://aether-api.atomicmoonbeam88.workers.dev/api/activity/recent');
        const data = await response.json();
        setActions(data.actions || []);
        setLoading(false);
      } catch (e) {
        console.error('Failed to fetch telemetry:', e);
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Calculate per-agent metrics
  useEffect(() => {
    if (actions.length === 0) return;

    const agentMap = new Map<string, AgentMetrics>();

    actions.forEach(action => {
      const existing = agentMap.get(action.agent_id) || {
        agentId: action.agent_id,
        actions24h: 0,
        successRate: 0,
        avgExecutionTime: 0,
        lastActivity: action.timestamp
      };

      existing.actions24h++;
      if (action.status === 'completed') {
        existing.successRate = ((existing.successRate * (existing.actions24h - 1)) + 1) / existing.actions24h;
      }
      existing.lastActivity = action.timestamp;

      agentMap.set(action.agent_id, existing);
    });

    setMetrics(Array.from(agentMap.values()));
  }, [actions]);

  const formatAgentId = (id: string) => {
    const mapping: Record<string, string> = {
      's1_curator': 'S1_CURATOR',
      's2_architect': 'S2_ARCHITECT',
      's3_warden': 'S3_WARDEN',
      's4_optimizer': 'S4_OPTIMIZER',
      's5_evolution': 'S5_EVOLUTION',
      'system': 'SYSTEM',
      'profit_engine': 'PROFIT_ENGINE'
    };
    return mapping[id] || id.toUpperCase();
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-400" />;
      default: return <AlertTriangle className="w-3 h-3 text-amber-400" />;
    }
  };

  const getAgentColor = (agentId: string) => {
    const colors: Record<string, string> = {
      's1_curator': 'text-cyan-400',
      's2_architect': 'text-purple-400',
      's3_warden': 'text-emerald-400',
      's4_optimizer': 'text-amber-400',
      's5_evolution': 'text-rose-400',
      'system': 'text-slate-400',
      'profit_engine': 'text-blue-400'
    };
    return colors[agentId] || 'text-slate-400';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Council Telemetry</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {actions.length} actions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live
          </span>
          <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-500">Ctrl+Shift+A</kbd>
        </div>
      </div>

      {/* Council Health Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {['s1_curator', 's2_architect', 's3_warden', 's4_optimizer', 's5_evolution'].map(agentId => {
          const agentMetrics = metrics.find(m => m.agentId === agentId);
          const agentActions = actions.filter(a => a.agent_id === agentId);
          const recentAction = agentActions[0];

          return (
            <div
              key={agentId}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800 transition-colors"
            >
              <div className={`text-xs font-mono font-bold mb-1 ${getAgentColor(agentId)}`}>
                {formatAgentId(agentId)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {agentMetrics?.actions24h || 0}
              </div>
              <div className="text-xs text-slate-400">
                {recentAction ? formatTimestamp(recentAction.timestamp) : 'No activity'}
              </div>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${agentMetrics?.successRate > 0.9 ? 'bg-emerald-400' : agentMetrics?.successRate > 0.7 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${(agentMetrics?.successRate || 0) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal-style Live Stream */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-xs">
        <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-800 pb-2">
          <span className="text-emerald-400">●</span>
          <span>LIVE AGENT STREAM</span>
          <span className="ml-auto">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="text-slate-500">Loading telemetry...</div>
          ) : actions.length === 0 ? (
            <div className="text-slate-500">No recent agent activity</div>
          ) : (
            actions.slice(0, 10).map((action, idx) => (
              <div key={action.id} className="flex items-center gap-2 text-slate-300 hover:bg-slate-900/50 px-2 py-1 rounded">
                <span className="text-slate-500">[{new Date(action.timestamp).toLocaleTimeString()}]</span>
                <span className={getAgentColor(action.agent_id)}>
                  [{formatAgentId(action.agent_id)}]
                </span>
                <span className="text-slate-400">{formatAction(action.action_taken)}</span>
                <span className="ml-auto flex items-center gap-1">
                  {getStatusIcon(action.status)}
                  <span className={action.status === 'completed' ? 'text-emerald-400' : action.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>
                    {action.status.toUpperCase()}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Audit Log</h3>
              <button
                onClick={() => setShowAuditLog(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[60vh]">
              <div className="space-y-1">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 text-slate-300 hover:bg-slate-900/50 px-2 py-1 rounded">
                    <span className="text-slate-500">{new Date(action.timestamp).toLocaleString()}</span>
                    <span className={getAgentColor(action.agent_id)}>
                      [{formatAgentId(action.agent_id)}]
                    </span>
                    <span className="text-slate-400">{formatAction(action.action_taken)}</span>
                    <span className="ml-auto">{getStatusIcon(action.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
