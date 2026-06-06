import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Zap, Shield, Server, GitBranch, Database, AlertTriangle } from 'lucide-react';

interface SystemStatus {
  status: string;
  backend: string;
  timestamp: string;
}

interface AgentStatus {
  curator: string;
  executor: string;
  mcpServer: string;
  reflector: string;
  circuitBreaker: string;
  curatorAudit: string;
  timestamp: string;
}

interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  timestamp: string;
}

export default function RealtimeDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system status
      const stackRes = await fetch('http://localhost:3000/api/stack');
      const stackData = await stackRes.json();
      setSystemStatus(stackData);

      // Fetch agent status
      const agentsRes = await fetch('http://localhost:3000/api/agents');
      const agentsData = await agentsRes.json();
      setAgentStatus(agentsData);

      // Fetch metrics
      const metricsRes = await fetch('http://localhost:3000/api/metrics');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div className="text-red-400 text-sm">Error: {error}</div>
          </div>
          <button 
            onClick={fetchAllData}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#c4a661]" />
          Realtime System Dashboard
        </h2>
        <button 
          onClick={fetchAllData}
          className="text-white/60 hover:text-white/90 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* System Status Card */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4" />
          System Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-white/40 text-xs mb-1">Status</div>
            <div className={`text-sm font-medium ${systemStatus?.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
              {systemStatus?.status || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Backend</div>
            <div className="text-sm font-medium text-white/90">
              {systemStatus?.backend || 'Unknown'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-white/40 text-xs mb-1">Last Updated</div>
            <div className="text-sm font-medium text-white/60">
              {systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleString() : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Card */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Agent Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-white/40 text-xs mb-1">Curator</div>
            <div className={`text-sm font-medium ${agentStatus?.curator === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
              {agentStatus?.curator || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Executor</div>
            <div className={`text-sm font-medium ${agentStatus?.executor === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
              {agentStatus?.executor || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">MCP Server</div>
            <div className={`text-sm font-medium ${agentStatus?.mcpServer === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
              {agentStatus?.mcpServer || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Reflector</div>
            <div className={`text-sm font-medium ${agentStatus?.reflector === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
              {agentStatus?.reflector || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Circuit Breaker</div>
            <div className={`text-sm font-medium ${agentStatus?.circuitBreaker === 'closed' ? 'text-green-400' : 'text-red-400'}`}>
              {agentStatus?.circuitBreaker || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Curator Audit</div>
            <div className={`text-sm font-medium ${agentStatus?.curatorAudit === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
              {agentStatus?.curatorAudit || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          System Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-white/40 text-xs mb-1">Total Requests</div>
            <div className="text-sm font-medium text-white/90">
              {metrics?.totalRequests?.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Successful</div>
            <div className="text-sm font-medium text-green-400">
              {metrics?.successfulRequests?.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Failed</div>
            <div className="text-sm font-medium text-red-400">
              {metrics?.failedRequests?.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Avg Response</div>
            <div className="text-sm font-medium text-white/90">
              {metrics?.averageResponseTime ? `${metrics.averageResponseTime.toFixed(2)}ms` : '0ms'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => window.open('http://localhost:3000/api/stack', '_blank')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Stack
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/agents', '_blank')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Agents
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/metrics', '_blank')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Metrics
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/health', '_blank')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            Health Check
          </button>
        </div>
      </div>
    </div>
  );
}