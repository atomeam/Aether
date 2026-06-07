/**
 * MCP Tool List Component
 * Displays a list of available MCP tools with filtering
 */

import React from 'react';
import { MCPTool, MCPToolCategory } from './types';
import { Zap, Play, ChevronRight } from 'lucide-react';

interface MCPToolListProps {
  tools: MCPTool[];
  selectedTool: string | null;
  onToolSelect: (toolName: string) => void;
  categoryColors: Record<MCPToolCategory, string>;
}

export default function MCPToolList({ tools, selectedTool, onToolSelect, categoryColors }: MCPToolListProps) {
  if (tools.length === 0) {
    return (
      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
        <div className="text-center text-white/40 text-sm">No tools found</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {tools.map(tool => (
        <button
          key={tool.name}
          onClick={() => onToolSelect(tool.name)}
          className={`w-full p-4 border rounded-lg text-left transition-all ${
            selectedTool === tool.name
              ? 'border-[#c4a661] bg-[#c4a661]/10'
              : 'border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-4 h-4 ${categoryColors[tool.category]}`} />
                <h3 className="text-sm font-medium text-white truncate">{tool.name}</h3>
              </div>
              <p className="text-xs text-white/60 line-clamp-2">{tool.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-medium uppercase ${categoryColors[tool.category]}`}>
                  {tool.category}
                </span>
                <span className="text-[10px] text-white/40">{tool.method}</span>
                {tool.parameters.length > 0 && (
                  <span className="text-[10px] text-white/40">
                    {tool.parameters.length} param{tool.parameters.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${
              selectedTool === tool.name ? 'rotate-90 text-[#c4a661]' : ''
            }`} />
          </div>
        </button>
      ))}
    </div>
  );
}
