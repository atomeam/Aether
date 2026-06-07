/**
 * MCP Dashboard Component
 * Main dashboard for interacting with Aether MCP server tools
 */

import React, { useState } from 'react';
import { Server, Zap, Activity, RefreshCw, AlertTriangle, Search, Filter } from 'lucide-react';
import { MCP_TOOLS, MCPToolCategory, MCPToolInvocation } from './types';
import { mcpApi } from './api';
import MCPServerStatus from './MCPServerStatus';
import MCPToolList from './MCPToolList';
import MCPToolExecutor from './MCPToolExecutor';
import MCPToolHistory from './MCPToolHistory';
import { useOptimizedPolling, useSSEWithVisibility } from '../../hooks/useOptimizedPolling';

const CATEGORY_COLORS: Record<MCPToolCategory, string> = {
  system: 'text-blue-400',
  agents: 'text-purple-400',
  monitoring: 'text-green-400',
  workflows: 'text-orange-400',
  alerts: 'text-red-400',
  queues: 'text-yellow-400',
  learning: 'text-cyan-400',
  chaos: 'text-pink-400',
  journal: 'text-indigo-400',
};

export default function MCPDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<MCPToolCategory | 'all'>('all');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invocations, setInvocations] = useState<MCPToolInvocation[]>([]);

  // Optimized polling for server status with Page Visibility API and request deduplication
  const { data: serverStatus, loading, manualRefresh: refreshServerStatus } = useOptimizedPolling({
    url: '/api/stack',
    interval: 10000,
    deduplicate: true,
    onError: (err) => console.error('Failed to fetch server status:', err)
  });

  // SSE for real-time updates (fallback to polling if SSE not available)
  const { data: sseData, mode: updateMode } = useSSEWithVisibility('/api/events', {
    onMessage: (data) => {
      // Handle real-time updates from server
      console.log('[MCP Dashboard] Real-time update:', data);
      // You can update state here based on SSE data
    },
    onError: (err) => {
      console.log('[MCP Dashboard] SSE not available, using polling fallback');
    }
  });

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
  };

  const handleToolInvocation = (toolName: string, parameters: Record<string, any>, result: any) => {
    const invocation: MCPToolInvocation = {
      toolName,
      parameters,
      result,
      status: result.success ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    };
    setInvocations(prev => [invocation, ...prev].slice(0, 50)); // Keep last 50
  };

  const filteredTools = MCP_TOOLS.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: (MCPToolCategory | 'all')[] = ['all', ...Object.keys(CATEGORY_COLORS) as MCPToolCategory[]];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#c4a661]/10 rounded-lg">
            <Server className="w-6 h-6 text-[#c4a661]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">MCP Server Dashboard</h1>
            <p className="text-sm text-white/60">Aether Model Context Protocol Tools</p>
          </div>
        </div>
        <button
          onClick={refreshServerStatus}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          title={`Refresh server status (${updateMode === 'sse' ? 'SSE active' : 'Polling'})`}
        >
          <RefreshCw className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Server Status */}
      <MCPServerStatus status={serverStatus} loading={loading} />

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-white/40" />
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-[#c4a661] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {category === 'all' ? 'All Tools' : category}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#c4a661]/50"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#c4a661]" />
            Available Tools ({filteredTools.length})
          </h2>
          <MCPToolList
            tools={filteredTools}
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            categoryColors={CATEGORY_COLORS}
          />
        </div>

        {/* Tool Executor */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#c4a661]" />
            Tool Executor
          </h2>
          {selectedTool ? (
            <MCPToolExecutor
              tool={MCP_TOOLS.find(t => t.name === selectedTool)!}
              onInvocation={handleToolInvocation}
            />
          ) : (
            <div className="p-6 border border-white/5 bg-white/[0.01] rounded-lg">
              <div className="flex items-center gap-2 text-white/40">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Select a tool to execute</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invocation History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#c4a661]" />
          Recent Invocations ({invocations.length})
        </h2>
        <MCPToolHistory invocations={invocations} onToolSelect={handleToolSelect} />
      </div>
    </div>
  );
}
