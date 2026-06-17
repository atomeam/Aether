import React from 'react';
import { useAetherSocket } from '../hooks/useAetherSocket';
import { Activity, Wifi, WifiOff, AlertCircle, TrendingUp, Server } from 'lucide-react';
import { useCrew } from '../contexts/CrewContext';

interface AgentTelemetryProps {
  crew: string;
  roomId: string;
  agentId: string;
}

export default function AgentTelemetry({ crew, roomId, agentId }: AgentTelemetryProps) {
  const { connectionState, events, reconnect } = useAetherSocket(roomId);
  const { crews, updateCrewStatus } = useCrew();

  const crewInfo = crews.find(c => c.agentId === agentId);
  const isTrading = crew === 'trading';
  const isInfrastructure = crew === 'infrastructure';

  const getConnectionIndicator = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-[8px] font-mono uppercase">Connected</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
            <span className="text-yellow-400 text-[8px] font-mono uppercase">Connecting</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-red-400 text-[8px] font-mono uppercase">Error</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-gray-400 text-[8px] font-mono uppercase">Disconnected</span>
          </div>
        );
    }
  };

  const getEventColor = (type: string, level?: string) => {
    // Priority: level (from unified schema) then type (legacy)
    if (level === 'critical') return 'text-red-500';
    if (level === 'error') return 'text-red-400';
    if (level === 'warn') return 'text-yellow-400';
    if (level === 'info') return 'text-blue-400';
    
    // Legacy type-based coloring
    switch (type) {
      case 'connected':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'ci_failure':
        return 'text-red-500';
      case 'ci_success':
        return 'text-green-500';
      case 'circuit_breaker':
        return 'text-orange-500';
      case 'heartbeat':
        return 'text-blue-400';
      default:
        return 'text-white/60';
    }
  };

  const getCrewIcon = () => {
    if (isTrading) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (isInfrastructure) return <Server className="w-4 h-4 text-purple-400" />;
    return <Activity className="w-4 h-4 text-blue-400" />;
  };

  const getCrewColor = () => {
    if (isTrading) return 'emerald';
    if (isInfrastructure) return 'purple';
    return 'blue';
  };

  const crewColor = getCrewColor();

  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-2 bg-${crewColor}-500/10 rounded-sm`}>
            {getCrewIcon()}
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90">
              {isTrading ? 'Trade Monitor' : isInfrastructure ? 'CI Medic' : 'Agent'} Telemetry
            </h2>
            <p className="text-[7px] text-white/30 uppercase tracking-widest">
              {agentId} • {crew.toUpperCase()} Real-time Stream
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[7px] font-mono text-white/40">
            Status: <span className={crewInfo?.status === 'running' ? 'text-green-400' : 'text-yellow-400'}>
              {crewInfo?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          {getConnectionIndicator()}
          {connectionState !== 'connected' && (
            <button
              onClick={reconnect}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[7px] uppercase tracking-widest transition-all cursor-pointer"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="h-64 overflow-y-auto space-y-1 pr-4 custom-scrollbar bg-black/20 p-4 rounded-lg border border-white/5">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <WifiOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-[8px] uppercase tracking-[0.3em]">Waiting for events...</span>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className={`font-mono text-[8px] whitespace-pre-wrap flex gap-3 border-l-2 pl-3 py-1 ${
                event.level === 'critical' || event.type === 'ci_failure' || event.type === 'circuit_breaker' 
                  ? 'border-red-500/50 bg-red-500/5' :
                event.level === 'error' || event.type === 'error'
                  ? 'border-red-400/50 bg-red-400/5' :
                event.level === 'warn' || event.type === 'warning'
                  ? 'border-yellow-500/50 bg-yellow-500/5' :
                event.level === 'info' || event.type === 'heartbeat'
                  ? 'border-blue-500/50 bg-blue-500/5' :
                'border-white/10'
              }`}
            >
              <span className="opacity-30 shrink-0">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
              <span className={getEventColor(event.type, event.level)}>
                {(event.level || event.type || 'unknown').toUpperCase()}
              </span>
              <span className="text-white/40">
                {event.payload?.message || JSON.stringify(event.payload).substring(0, 100)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[7px] text-white/20 font-mono">
        <span>Room: {roomId}</span>
        <span>Events: {events.length}/50</span>
      </div>
    </div>
  );
}