import React from 'react';
import { useCrew } from '../contexts/CrewContext';
import { Activity, TrendingUp, Server, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function CrewRegistry() {
  const { crews } = useCrew();

  const getCrewIcon = (crew: string) => {
    if (crew === 'trading') return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (crew === 'infrastructure') return <Server className="w-3 h-3 text-purple-400" />;
    return <Activity className="w-3 h-3 text-blue-400" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'paused':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'paused':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatHeartbeat = (timestamp: string) => {
    const now = new Date();
    const heartbeat = new Date(timestamp);
    const diff = now.getTime() - heartbeat.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-white/60" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/90">
            Crew Registry
          </h3>
        </div>
        <div className="text-[7px] text-white/30 font-mono">
          {crews.length} Active Crews
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {crews.map((crew) => (
          <div
            key={crew.agentId}
            className="p-3 bg-black/20 border border-white/5 rounded-lg hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getCrewIcon(crew.crew)}
                <span className="text-[8px] font-mono text-white/80">
                  {crew.agentId}
                </span>
              </div>
              {getStatusIcon(crew.status)}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-white/30 uppercase">Crew</span>
                <span className="text-[7px] font-mono text-white/60 uppercase">
                  {crew.crew}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-white/30 uppercase">Status</span>
                <span className={`text-[7px] font-mono ${getStatusColor(crew.status)} uppercase`}>
                  {crew.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-white/30 uppercase">Heartbeat</span>
                <span className="text-[7px] font-mono text-white/40">
                  {formatHeartbeat(crew.lastHeartbeat)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}