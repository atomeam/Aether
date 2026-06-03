import React, { useState } from 'react';
import { Server, Activity, Shield, Database, Globe, Zap, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCcw, Play, Pause, Settings, Terminal, FileText, Network, HardDrive, Cpu, MemoryStick, Thermometer, Gauge, TrendingUp, ArrowUpRight, Download, Upload, Trash2, Plus, Edit, Eye, EyeOff, Lock, Unlock, Bell, BellOff } from 'lucide-react';
import DatabaseInspector from './DatabaseInspector';

interface Tool {
  id: string;
  name: string;
  icon: any;
  description: string;
  proOnly: boolean;
  enabled: boolean;
}

interface HealthCheck {
  id: string;
  name: string;
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'pending';
  lastCheck: string;
  responseTime: number;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notifications: boolean;
}

export default function DevOpsToolkit() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userPlan, setUserPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [showDatabaseInspector, setShowDatabaseInspector] = useState(false);

  const tools: Tool[] = [
    {
      id: 'health-checks',
      name: 'Health Checks',
      icon: Activity,
      description: 'Monitor endpoint health and response times',
      proOnly: false,
      enabled: true
    },
    {
      id: 'log-viewer',
      name: 'Log Viewer',
      icon: Terminal,
      description: 'Aggregate and search application logs',
      proOnly: false,
      enabled: true
    },
    {
      id: 'resource-monitor',
      name: 'Resource Monitor',
      icon: Cpu,
      description: 'Track CPU, memory, and disk usage',
      proOnly: false,
      enabled: true
    },
    {
      id: 'database-inspector',
      name: 'Database Inspector',
      icon: Database,
      description: 'S3 Agent: Query performance analysis',
      proOnly: false,
      enabled: true
    },
    {
      id: 'alert-manager',
      name: 'Alert Manager',
      icon: Bell,
      description: 'Configure automated alerting rules',
      proOnly: true,
      enabled: false
    },
    {
      id: 'deployment-tracker',
      name: 'Deployment Tracker',
      icon: Upload,
      description: 'Track deployment status and rollbacks',
      proOnly: true,
      enabled: false
    },
    {
      id: 'backup-manager',
      name: 'Backup Manager',
      icon: Database,
      description: 'Automated database backups and restores',
      proOnly: true,
      enabled: false
    },
    {
      id: 'security-scanner',
      name: 'Security Scanner',
      icon: Shield,
      description: 'Vulnerability scanning and security analysis',
      proOnly: true,
      enabled: false
    },
    {
      id: 'auto-scaling',
      name: 'Auto-Scaling',
      icon: TrendingUp,
      description: 'Automatic resource scaling based on load',
      proOnly: true,
      enabled: false
    }
  ];

  const mockHealthChecks: HealthCheck[] = [
    { id: '1', name: 'API Health', endpoint: '/health', status: 'healthy', lastCheck: '2s ago', responseTime: 45 },
    { id: '2', name: 'Database', endpoint: '/db-health', status: 'healthy', lastCheck: '5s ago', responseTime: 23 },
    { id: '3', name: 'Cache', endpoint: '/cache-health', status: 'healthy', lastCheck: '3s ago', responseTime: 12 },
    { id: '4', name: 'External API', endpoint: '/external/health', status: 'unhealthy', lastCheck: '10s ago', responseTime: 5000 }
  ];

  const mockLogs: LogEntry[] = [
    { id: '1', level: 'info', message: 'Server started on port 3000', timestamp: '2m ago', source: 'server' },
    { id: '2', level: 'warning', message: 'High memory usage detected (85%)', timestamp: '5m ago', source: 'monitor' },
    { id: '3', level: 'error', message: 'Failed to connect to external API', timestamp: '10m ago', source: 'api-client' },
    { id: '4', level: 'info', message: 'User authentication successful', timestamp: '15m ago', source: 'auth' },
    { id: '5', level: 'debug', message: 'Cache miss for key: user_123', timestamp: '20m ago', source: 'cache' }
  ];

  const mockAlertRules: AlertRule[] = [
    { id: '1', name: 'CPU > 80%', condition: 'cpu_usage', threshold: 80, enabled: true, notifications: true },
    { id: '2', name: 'Memory > 90%', condition: 'memory_usage', threshold: 90, enabled: true, notifications: true },
    { id: '3', name: 'Response Time > 500ms', condition: 'response_time', threshold: 500, enabled: false, notifications: false }
  ];

  const getToolIcon = (tool: Tool) => {
    const Icon = tool.icon;
    return <Icon className="w-5 h-5" />;
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-white/40';
      default: return 'text-white/60';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'unhealthy': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <RefreshCcw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default: return null;
    }
  };

  const handleToolClick = (tool: Tool) => {
    if (tool.proOnly && userPlan === 'starter') {
      setShowUpgradeModal(true);
    } else if (tool.enabled) {
      setActiveTool(tool.id);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">DevOps Toolkit</h2>
            <p className="text-sm text-white/60">Modular automation tools for infrastructure management</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300">
          {userPlan.toUpperCase()}
        </div>
      </div>

      {/* Tools Grid */}
      {!activeTool && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`relative p-4 border rounded-xl cursor-pointer transition-all hover:scale-105 ${
                tool.proOnly && userPlan === 'starter'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : tool.enabled
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/5 border-white/10 opacity-50'
              }`}
            >
              {tool.proOnly && userPlan === 'starter' && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-yellow-400" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  tool.enabled ? 'bg-blue-500/20' : 'bg-white/10'
                }`}>
                  {getToolIcon(tool)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{tool.name}</div>
                  <div className="text-xs text-white/40 mt-1">{tool.description}</div>
                </div>
              </div>
              {!tool.enabled && (
                <div className="mt-2 text-xs text-white/40">Coming Soon</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tool Views */}
      {activeTool === 'health-checks' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Health Checks</h3>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {mockHealthChecks.map((check) => (
              <div key={check.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getHealthStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm text-white/40">{check.endpoint}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{check.responseTime}ms</div>
                    <div className="text-xs text-white/40">{check.lastCheck}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'log-viewer' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Log Viewer</h3>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 font-mono text-sm">
            {mockLogs.map((log) => (
              <div key={log.id} className={`p-3 bg-white/5 border border-white/10 rounded-lg ${getLogColor(log.level)}`}>
                <div className="flex items-center gap-3">
                  <span className="text-white/40">[{log.timestamp}]</span>
                  <span className="text-white/40">[{log.source}]</span>
                  <span>{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'resource-monitor' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Resource Monitor</h3>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/60">CPU Usage</span>
              </div>
              <div className="text-3xl font-bold mb-2">23%</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '23%' }} />
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <MemoryStick className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/60">Memory</span>
              </div>
              <div className="text-3xl font-bold mb-2">67%</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '67%' }} />
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/60">Disk</span>
              </div>
              <div className="text-3xl font-bold mb-2">45%</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'database-inspector' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Database Inspector (S3)</h3>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/60 mb-4">S3 Database Inspector is available in the main dashboard DevOps modal</p>
            <button
              onClick={() => {
                setActiveTool(null);
                const event = new CustomEvent('open-database-inspector');
                window.dispatchEvent(event);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
            >
              Open in Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Upgrade Required</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-white/60">This feature is available on Pro and Enterprise plans.</p>
              <button
                onClick={() => {
                  window.location.href = 'mailto:hello@loxa.dev?subject=Pro Plan Upgrade';
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}