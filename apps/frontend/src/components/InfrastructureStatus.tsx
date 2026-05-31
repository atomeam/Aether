import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Database, GitBranch, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCcw, Clock, Zap, Globe, Shield, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface WorkerStatus {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  region: string;
  requestsPerMinute: number;
  errorRate: number;
  lastDeployment: string;
  version: string;
}

interface D1Migration {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  timestamp: number;
  duration?: number;
}

interface RoutingRule {
  id: string;
  source: string;
  destination: string;
  priority: number;
  status: 'ACTIVE' | 'DISABLED';
  matchRate: number;
}

const InfrastructureStatus = () => {
  const [workers, setWorkers] = useState<WorkerStatus[]>([
    {
      id: 'worker-1',
      name: 'notion-worker',
      status: 'HEALTHY',
      region: 'us-east-1',
      requestsPerMinute: 1250,
      errorRate: 0.02,
      lastDeployment: '2026-05-28T10:30:00Z',
      version: 'v1.2.3'
    },
    {
      id: 'worker-2',
      name: 'bridge-worker',
      status: 'HEALTHY',
      region: 'us-west-2',
      requestsPerMinute: 890,
      errorRate: 0.01,
      lastDeployment: '2026-05-28T09:15:00Z',
      version: 'v0.15.3'
    },
    {
      id: 'worker-3',
      name: 'analytics-worker',
      status: 'DEGRADED',
      region: 'eu-west-1',
      requestsPerMinute: 450,
      errorRate: 0.15,
      lastDeployment: '2026-05-27T16:45:00Z',
      version: 'v2.0.1'
    }
  ]);

  const [migrations, setMigrations] = useState<D1Migration[]>([
    {
      id: 'mig-001',
      name: 'add_audit_events_table',
      status: 'COMPLETED',
      timestamp: Date.now() - 3600000,
      duration: 2.3
    },
    {
      id: 'mig-002',
      name: 'add_processed_slack_events',
      status: 'COMPLETED',
      timestamp: Date.now() - 7200000,
      duration: 1.8
    },
    {
      id: 'mig-003',
      name: 'add_sync_status_index',
      status: 'RUNNING',
      timestamp: Date.now() - 300000
    }
  ]);

  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([
    {
      id: 'rule-1',
      source: '/api/notion/*',
      destination: 'notion-worker',
      priority: 1,
      status: 'ACTIVE',
      matchRate: 98.5
    },
    {
      id: 'rule-2',
      source: '/api/bridge/*',
      destination: 'bridge-worker',
      priority: 1,
      status: 'ACTIVE',
      matchRate: 99.2
    },
    {
      id: 'rule-3',
      source: '/api/analytics/*',
      destination: 'analytics-worker',
      priority: 2,
      status: 'ACTIVE',
      matchRate: 85.3
    },
    {
      id: 'rule-4',
      source: '/api/legacy/*',
      destination: 'legacy-worker',
      priority: 3,
      status: 'DISABLED',
      matchRate: 0
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'workers' | 'migrations' | 'routing'>('workers');
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setWorkers(prev => prev.map(worker => ({
        ...worker,
        requestsPerMinute: worker.requestsPerMinute + Math.floor((Math.random() - 0.5) * 100),
        errorRate: Math.max(0, Math.min(1, worker.errorRate + (Math.random() - 0.5) * 0.01))
      })));

      // Update running migration
      setMigrations(prev => prev.map(mig => {
        if (mig.status === 'RUNNING') {
          const shouldComplete = Math.random() > 0.7;
          return shouldComplete 
            ? { ...mig, status: 'COMPLETED', duration: Math.random() * 3 + 1 }
            : mig;
        }
        return mig;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getStatusColor = (status: WorkerStatus['status'] | D1Migration['status']) => {
    switch (status) {
      case 'HEALTHY':
      case 'COMPLETED':
      case 'ACTIVE':
        return 'text-green-400';
      case 'DEGRADED':
      case 'PENDING':
      case 'RUNNING':
        return 'text-yellow-400';
      case 'OFFLINE':
      case 'FAILED':
      case 'DISABLED':
        return 'text-red-400';
    }
  };

  const getStatusIcon = (status: WorkerStatus['status'] | D1Migration['status']) => {
    switch (status) {
      case 'HEALTHY':
      case 'COMPLETED':
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'DEGRADED':
      case 'PENDING':
      case 'RUNNING':
        return <RefreshCcw className="w-4 h-4 animate-spin" />;
      case 'OFFLINE':
      case 'FAILED':
      case 'DISABLED':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Infrastructure Status</h2>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Live Worker & Service Grid</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ opacity: isLive ? [0.4, 0.8, 0.4] : 0.2 }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("w-2 h-2 rounded-full", isLive ? "bg-green-400" : "bg-white/20")} 
          />
          <button 
            onClick={() => setIsLive(!isLive)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[8px] uppercase tracking-widest transition-all cursor-pointer"
          >
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        {[
          { id: 'workers' as const, label: 'Workers', icon: Server },
          { id: 'migrations' as const, label: 'D1 Migrations', icon: Database },
          { id: 'routing' as const, label: 'Routing Rules', icon: GitBranch }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[8px] uppercase tracking-widest transition-all cursor-pointer",
              selectedTab === tab.id 
                ? "text-blue-400 border-b-2 border-blue-400" 
                : "text-white/30 hover:text-white/60"
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'workers' && (
          <motion.div
            key="workers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {workers.map(worker => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white/[0.01] border border-white/5 rounded-sm hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(worker.status)}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/80">{worker.name}</div>
                      <div className="text-[7px] text-white/20 font-mono">{worker.region} • {worker.version}</div>
                    </div>
                  </div>
                  <div className={cn("text-[8px] font-black uppercase tracking-wider", getStatusColor(worker.status))}>
                    {worker.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[7px] text-white/20 uppercase tracking-wider mb-1">
                      <Activity className="w-3 h-3" />
                      Requests/min
                    </div>
                    <div className="text-[12px] font-mono text-white/80">{worker.requestsPerMinute.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[7px] text-white/20 uppercase tracking-wider mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      Error Rate
                    </div>
                    <div className={cn("text-[12px] font-mono", worker.errorRate > 0.1 ? "text-red-400" : "text-white/80")}>
                      {(worker.errorRate * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[7px] text-white/20 uppercase tracking-wider mb-1">
                      <Clock className="w-3 h-3" />
                      Last Deploy
                    </div>
                    <div className="text-[12px] font-mono text-white/80">{formatTimeAgo(new Date(worker.lastDeployment).getTime())}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {selectedTab === 'migrations' && (
          <motion.div
            key="migrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {migrations.map(migration => (
              <motion.div
                key={migration.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white/[0.01] border border-white/5 rounded-sm hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(migration.status)}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/80">{migration.name}</div>
                      <div className="text-[7px] text-white/20 font-mono">{migration.id}</div>
                    </div>
                  </div>
                  <div className={cn("text-[8px] font-black uppercase tracking-wider", getStatusColor(migration.status))}>
                    {migration.status}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[7px] text-white/20 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(migration.timestamp)}
                  </div>
                  {migration.duration && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {migration.duration.toFixed(1)}s
                    </div>
                  )}
                </div>

                {migration.status === 'RUNNING' && (
                  <div className="mt-3 h-[2px] w-full bg-white/5 relative overflow-hidden">
                    <motion.div
                      animate={{ width: ['0%', '70%', '90%', '95%'] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute inset-y-0 left-0 bg-yellow-400"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {selectedTab === 'routing' && (
          <motion.div
            key="routing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {routingRules.map(rule => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-white/[0.01] border border-white/5 rounded-sm hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(rule.status)}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/80">{rule.source}</div>
                      <div className="text-[7px] text-white/20 font-mono">Priority: {rule.priority}</div>
                    </div>
                  </div>
                  <div className={cn("text-[8px] font-black uppercase tracking-wider", getStatusColor(rule.status))}>
                    {rule.status}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1">Destination</div>
                    <div className="text-[10px] font-mono text-white/60">{rule.destination}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1">Match Rate</div>
                    <div className="text-[10px] font-mono text-white/60">{rule.matchRate.toFixed(1)}%</div>
                  </div>
                  <div className="w-16">
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rule.matchRate}%` }}
                        className={cn("absolute inset-y-0 left-0", rule.matchRate > 90 ? "bg-green-400" : rule.matchRate > 70 ? "bg-yellow-400" : "bg-red-400")}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Health Summary */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-sm">
            <Globe className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[7px] text-white/20 uppercase tracking-wider">Regions</div>
              <div className="text-[10px] font-mono text-white/80">3 Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-sm">
            <Shield className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-[7px] text-white/20 uppercase tracking-wider">Health</div>
              <div className="text-[10px] font-mono text-green-400">94.2%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-sm">
            <Cpu className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[7px] text-white/20 uppercase tracking-wider">Total RPS</div>
              <div className="text-[10px] font-mono text-white/80">2,590</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-sm">
            <Database className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-[7px] text-white/20 uppercase tracking-wider">D1 Queries</div>
              <div className="text-[10px] font-mono text-white/80">12.4K/min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureStatus;