import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Server, Zap, Database } from 'lucide-react';

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

export default function SystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stackRes = await fetch('http://localhost:3000/api/stack');
      const stackData = await stackRes.json();
      setSystemStatus(stackData);

      const agentsRes = await fetch('http://localhost:3000/api/agents');
      const agentsData = await agentsRes.json();
      setAgentStatus(agentsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
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
          <div className="text-red-400 text-sm">Error: {error}</div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#c4a661]" />
          System Status
        </h2>
        <button 
          onClick={fetchAllData}
          className="text-white/60 hover:text-white/90 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Backend
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Status</span>
              <span className={`text-xs font-medium ${systemStatus?.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {systemStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Backend</span>
              <span className="text-xs font-medium text-white/90">
                {systemStatus?.backend || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Agents
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Curator</span>
              <span className={`text-xs font-medium ${agentStatus?.curator === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.curator || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Executor</span>
              <span className={`text-xs font-medium ${agentStatus?.executor === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.executor || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">MCP Server</span>
              <span className={`text-xs font-medium ${agentStatus?.mcpServer === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {agentStatus?.mcpServer || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button 
            onClick={() => window.open('http://localhost:3000/api/stack', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Stack
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/agents', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            View Agents
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/health', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            Health Check
          </button>
          <button 
            onClick={() => window.open('http://localhost:3000/api/nexus/registry', '_blank')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            Nexus Registry
          </button>
        </div>
      </div>
    </div>
  );
}