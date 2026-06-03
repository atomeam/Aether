import React, { useState, useEffect } from 'react';
import { Server, Database, Globe, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, Cpu, HardDrive, Network } from 'lucide-react';

interface InfrastructureMetric {
  id: string;
  name: string;
  type: 'server' | 'database' | 'api' | 'network';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  lastCheck: string;
  region: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
  timestamp: string;
  resolved: boolean;
}

interface AIRecommendation {
  id: string;
  type: 'optimization' | 'security' | 'scaling' | 'cost';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionItems: string[];
}

export default function InfrastructureMonitor() {
  const [metrics, setMetrics] = useState<InfrastructureMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRemediation, setAutoRemediation] = useState(true);

  useEffect(() => {
    // Simulate infrastructure data
    const mockMetrics: InfrastructureMetric[] = [
      {
        id: 'srv-001',
        name: 'Web Server - US East',
        type: 'server',
        status: 'healthy',
        cpu: 45,
        memory: 62,
        disk: 78,
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
        region: 'us-east-1'
      },
      {
        id: 'db-001',
        name: 'Primary Database',
        type: 'database',
        status: 'warning',
        cpu: 85,
        memory: 92,
        disk: 88,
        uptime: 99.8,
        lastCheck: new Date().toISOString(),
        region: 'us-east-1'
      },
      {
        id: 'api-001',
        name: 'API Gateway',
        type: 'api',
        status: 'healthy',
        cpu: 32,
        memory: 45,
        disk: 55,
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
        region: 'us-west-2'
      },
      {
        id: 'srv-002',
        name: 'Worker Server - EU',
        type: 'server',
        status: 'healthy',
        cpu: 28,
        memory: 41,
        disk: 62,
        uptime: 99.7,
        lastCheck: new Date().toISOString(),
        region: 'eu-west-1'
      },
      {
        id: 'net-001',
        name: 'Load Balancer',
        type: 'network',
        status: 'healthy',
        cpu: 15,
        memory: 22,
        disk: 35,
        uptime: 100,
        lastCheck: new Date().toISOString(),
        region: 'global'
      }
    ];

    const mockAlerts: Alert[] = [
      {
        id: 'alt-001',
        severity: 'warning',
        message: 'Database CPU usage above 80% threshold',
        source: 'db-001',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        resolved: false
      },
      {
        id: 'alt-002',
        severity: 'critical',
        message: 'Disk space critical on Primary Database',
        source: 'db-001',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        resolved: false
      }
    ];

    const mockRecommendations: AIRecommendation[] = [
      {
        id: 'rec-001',
        type: 'scaling',
        title: 'Scale Database Cluster',
        description: 'Database CPU and memory usage consistently above 80%. Consider adding read replicas or scaling up the instance.',
        impact: 'high',
        confidence: 92,
        actionItems: [
          'Add 2 read replicas to distribute load',
          'Increase instance size from db.t3.medium to db.t3.large',
          'Enable connection pooling to reduce overhead'
        ]
      },
      {
        id: 'rec-002',
        type: 'optimization',
        title: 'Optimize Query Performance',
        description: 'Slow queries detected in Primary Database. Index optimization could improve performance by 40%.',
        impact: 'medium',
        confidence: 87,
        actionItems: [
          'Add composite index on frequently queried columns',
          'Implement query result caching',
          'Review and optimize N+1 queries'
        ]
      },
      {
        id: 'rec-003',
        type: 'cost',
        title: 'Reduce Infrastructure Costs',
        description: 'Worker Server EU has low utilization. Consider downsizing or implementing auto-scaling.',
        impact: 'medium',
        confidence: 78,
        actionItems: [
          'Enable auto-scaling based on CPU metrics',
          'Downsize from t3.medium to t3.small during off-hours',
          'Implement spot instances for non-critical workloads'
        ]
      }
    ];

    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setRecommendations(mockRecommendations);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      case 'offline': return 'text-gray-400';
      default: return 'text-white/60';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'api': return <Globe className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'critical': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  const handleAutoRemediation = async (alertId: string) => {
    // Simulate auto-remediation
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  if (loading) {
    return (
      <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          <span className="text-sm">Loading infrastructure data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Infrastructure Monitor</h2>
            <p className="text-sm text-white/60">Autonomous Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Auto-Remediation: {autoRemediation ? 'ON' : 'OFF'}</span>
          </div>
          <button
            onClick={() => setAutoRemediation(!autoRemediation)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Zap className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Overall Health */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white/60">Total Resources</span>
          </div>
          <div className="text-2xl font-bold">{metrics.length}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/60">Healthy</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.filter(m => m.status === 'healthy').length}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/60">Warnings</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{metrics.filter(m => m.status === 'warning').length}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-white/60">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{metrics.filter(m => m.status === 'critical').length}</div>
        </div>
      </div>

      {/* Infrastructure Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Infrastructure Metrics</h3>
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {getTypeIcon(metric.type)}
                  </div>
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-sm text-white/40">{metric.region}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                    <span className="text-sm capitalize">{metric.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-white/40">CPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          metric.cpu > 80 ? 'bg-red-400' : metric.cpu > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${metric.cpu}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{metric.cpu}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white/40">Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          metric.memory > 80 ? 'bg-red-400' : metric.memory > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${metric.memory}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{metric.memory}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-white/40">Disk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          metric.disk > 80 ? 'bg-red-400' : metric.disk > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${metric.disk}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{metric.disk}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white/40">Uptime</span>
                  </div>
                  <div className="text-xs font-mono">{metric.uptime}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {alerts.filter(a => !a.resolved).length === 0 ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-emerald-400">No active alerts</p>
            </div>
          ) : (
            alerts.filter(a => !a.resolved).map((alert) => (
              <div key={alert.id} className={`p-4 border rounded-xl ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-white/40">{alert.source} • {new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  {autoRemediation && (
                    <button
                      onClick={() => handleAutoRemediation(alert.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Auto-Fix
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h3 className="text-lg font-bold mb-4">AI-Powered Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    rec.type === 'optimization' ? 'bg-blue-500/10' :
                    rec.type === 'security' ? 'bg-red-500/10' :
                    rec.type === 'scaling' ? 'bg-purple-500/10' :
                    'bg-emerald-500/10'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-white/40 capitalize">{rec.type} • {rec.confidence}% confidence</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  rec.impact === 'high' ? 'bg-red-500 text-white' :
                  rec.impact === 'medium' ? 'bg-yellow-500 text-black' :
                  'bg-emerald-500 text-black'
                }`}>
                  {rec.impact.toUpperCase()} IMPACT
                </div>
              </div>
              <p className="text-sm text-white/60 mb-3">{rec.description}</p>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Suggested Actions:</div>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, i) => (
                    <li key={i} className="text-sm text-white/40 flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}