import React, { useState } from 'react';
import { Activity, Zap, RefreshCw, Workflow, Database, Cpu, Globe, Shield, BarChart, Brain } from 'lucide-react';
import AutomationDashboard from './AutomationDashboard';
import { MCPDashboard } from './mcp';
import { useOptimizedPolling } from '../hooks/useOptimizedPolling';

interface SimpleDashboardProps {
  onShowKnowledgeHub?: () => void;
}

export default function SimpleDashboard({ onShowKnowledgeHub }: SimpleDashboardProps) {
  const [activeTab, setActiveTab] = useState<'automation' | 'mcp' | 'integrations'>('automation');

  // Optimized polling with Page Visibility API and request deduplication
  const { data: systemStatus, loading, manualRefresh, isVisible } = useOptimizedPolling({
    url: '/api/stack',
    interval: 10000,
    deduplicate: true,
    onError: (err) => console.error('Failed to fetch system status:', err)
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">a-to-mind</h1>
              <p className="text-xs text-white/60">Automation Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Activity className={`w-4 h-4 ${systemStatus ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-white/60">
                {systemStatus ? 'System Online' : 'System Offline'}
              </span>
            </div>
            <button
              onClick={onShowKnowledgeHub}
              className="p-2 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors"
              title="Knowledge Hub"
            >
              <Brain className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={manualRefresh}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              title={isVisible ? 'Refresh' : 'Tab inactive - polling paused'}
            >
              <RefreshCw className={`w-4 h-4 ${!isVisible ? 'opacity-50' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'automation'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Automation
            </div>
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'mcp'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              MCP Tools
            </div>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Integrations
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="text-white/60">Loading system status...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'automation' && <AutomationDashboard />}
            {activeTab === 'mcp' && <MCPDashboard />}
            {activeTab === 'integrations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Database, name: 'PostgreSQL', status: 'Connected' },
                  { icon: Globe, name: 'Cloudflare Workers', status: 'Active' },
                  { icon: Shield, name: 'GitHub', status: 'Connected' },
                  { icon: BarChart, name: 'n8n', status: 'Active' },
                  { icon: Cpu, name: 'OpenAI', status: 'Connected' },
                  { icon: Workflow, name: 'Notion', status: 'Connected' },
                ].map((integration, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <integration.icon className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="font-semibold mb-2">{integration.name}</h3>
                    <p className="text-sm text-green-500">{integration.status}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}