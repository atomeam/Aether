/**
 * MCP Tool History Component
 * Displays recent tool invocations with their results
 */

import React from 'react';
import { MCPToolInvocation } from './types';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

interface MCPToolHistoryProps {
  invocations: MCPToolInvocation[];
  onToolSelect: (toolName: string) => void;
}

export default function MCPToolHistory({ invocations, onToolSelect }: MCPToolHistoryProps) {
  if (invocations.length === 0) {
    return (
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="text-center text-white/40 text-sm">No tool invocations yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {invocations.map((invocation, index) => (
        <div
          key={`${invocation.toolName}-${invocation.timestamp}-${index}`}
          className="p-4 border border-white/5 bg-white/[0.01] rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {invocation.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <button
                  onClick={() => onToolSelect(invocation.toolName)}
                  className="text-sm font-medium text-white hover:text-[#c4a661] transition-colors"
                >
                  {invocation.toolName}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                <span>{new Date(invocation.timestamp).toLocaleString()}</span>
              </div>
              {Object.keys(invocation.parameters).length > 0 && (
                <div className="mt-2 text-xs text-white/60">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 bg-black/30 p-2 rounded font-mono text-[10px] overflow-x-auto">
                    {JSON.stringify(invocation.parameters, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => onToolSelect(invocation.toolName)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Re-run this tool"
            >
              <RotateCcw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
