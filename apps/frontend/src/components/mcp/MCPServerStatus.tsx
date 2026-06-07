/**
 * MCP Server Status Component
 * Displays the connection status and health of the MCP server
 */

import React from 'react';
import { Server, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MCPServerStatusProps {
  status: any;
  loading: boolean;
}

export default function MCPServerStatus({ status, loading }: MCPServerStatusProps) {
  if (loading) {
    return (
      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-white/60">Checking server status...</span>
        </div>
      </div>
    );
  }

  if (!status || !status.connected) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/[0.02] rounded-lg">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">
            Server disconnected: {status?.error || 'Connection failed'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-500/20 bg-green-500/[0.02] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Server Connected</span>
        </div>
        <span className="text-xs text-white/40">
          {new Date(status.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stack Status */}
        {status.stack && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Server className="w-3 h-3" />
              <span>Stack Status</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Status</span>
                <span className={`font-medium ${status.stack.status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.stack.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Backend</span>
                <span className="font-medium text-white/90">{status.stack.backend || 'Unknown'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Agent Status */}
        {status.agents && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Zap className="w-3 h-3" />
              <span>Agent Status</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Curator</span>
                <span className={`font-medium ${status.agents.curator === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.agents.curator || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Executor</span>
                <span className={`font-medium ${status.agents.executor === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.agents.executor || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">MCP Server</span>
                <span className={`font-medium ${status.agents.mcpServer === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.agents.mcpServer || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
