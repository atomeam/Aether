import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, GitPullRequest, RefreshCcw, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface SyncEvent {
  id: string;
  timestamp: number;
  type: 'NOTION_TO_GITHUB' | 'GITHUB_TO_NOTION' | 'SYNC_ERROR' | 'CONFLICT';
  notionId?: string;
  githubIssueNumber?: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  title: string;
  errorMessage?: string;
}

interface SyncMetrics {
  totalSyncs: number;
  successRate: number;
  lastSyncTime: number;
  activeConflicts: number;
  pendingUpdates: number;
}

const NotionGitHubSyncView = () => {
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successRate: 100,
    lastSyncTime: Date.now(),
    activeConflicts: 0,
    pendingUpdates: 0
  });
  const [isLive, setIsLive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SyncEvent | null>(null);

  // Simulate real-time sync events
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const eventTypes: SyncEvent['type'][] = ['NOTION_TO_GITHUB', 'GITHUB_TO_NOTION', 'NOTION_TO_GITHUB'];
      const statuses: SyncEvent['status'][] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'PENDING', 'FAILED'];
      
      const newEvent: SyncEvent = {
        id: `sync-${Date.now()}`,
        timestamp: Date.now(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        title: [
          'Update task priority',
          'Add new requirement',
          'Sync status change',
          'Link dependency',
          'Update milestone'
        ][Math.floor(Math.random() * 5)],
        notionId: Math.random() > 0.3 ? `notion-${Math.random().toString(36).substring(7)}` : undefined,
        githubIssueNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 1000) + 1 : undefined,
        errorMessage: Math.random() > 0.9 ? 'Rate limit exceeded' : undefined
      };

      setSyncEvents(prev => [newEvent, ...prev].slice(0, 20));
      
      // Update metrics
      setMetrics(prev => ({
        totalSyncs: prev.totalSyncs + 1,
        successRate: Math.round(((prev.totalSyncs * prev.successRate + (newEvent.status === 'SUCCESS' ? 100 : 0)) / (prev.totalSyncs + 1))),
        lastSyncTime: Date.now(),
        activeConflicts: newEvent.type === 'CONFLICT' ? prev.activeConflicts + 1 : prev.activeConflicts,
        pendingUpdates: newEvent.status === 'PENDING' ? prev.pendingUpdates + 1 : Math.max(0, prev.pendingUpdates - 1)
      }));
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getStatusIcon = (status: SyncEvent['status']) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PENDING': return <RefreshCcw className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getTypeColor = (type: SyncEvent['type']) => {
    switch (type) {
      case 'NOTION_TO_GITHUB': return 'text-blue-400';
      case 'GITHUB_TO_NOTION': return 'text-purple-400';
      case 'SYNC_ERROR': return 'text-red-400';
      case 'CONFLICT': return 'text-orange-400';
    }
  };

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Notion ↔ GitHub Sync</h2>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Canonical Ref Monitor</p>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
            <GitPullRequest className="w-3 h-3" />
            Total Syncs
          </div>
          <div className="text-[14px] font-mono text-white/80">{metrics.totalSyncs}</div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
            <CheckCircle className="w-3 h-3" />
            Success Rate
          </div>
          <div className="text-[14px] font-mono text-green-400">{metrics.successRate}%</div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
            <AlertTriangle className="w-3 h-3" />
            Conflicts
          </div>
          <div className="text-[14px] font-mono text-orange-400">{metrics.activeConflicts}</div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
            <Clock className="w-3 h-3" />
            Last Sync
          </div>
          <div className="text-[14px] font-mono text-white/80">{formatTimeAgo(metrics.lastSyncTime)}</div>
        </div>
      </div>

      {/* Sync Events Timeline */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {syncEvents.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-20">
            <span className="text-[8px] uppercase tracking-[0.3em]">No sync events recorded</span>
          </div>
        )}
        
        {syncEvents.map((event, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className={cn(
              "p-4 bg-white/[0.01] border border-white/5 rounded-sm cursor-pointer transition-all hover:bg-white/[0.03] hover:border-white/10",
              selectedEvent?.id === event.id && "border-purple-500/30 bg-purple-500/5"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(event.status)}
                <span className={cn("text-[9px] font-black uppercase tracking-wider", getTypeColor(event.type))}>
                  {event.type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[7px] text-white/20 font-mono">{formatTimeAgo(event.timestamp)}</span>
            </div>
            
            <div className="text-[10px] text-white/60 mb-2">{event.title}</div>
            
            <div className="flex items-center gap-4 text-[7px] text-white/20 font-mono">
              {event.notionId && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">NOTION:</span>
                  <span>{event.notionId}</span>
                </div>
              )}
              {event.githubIssueNumber && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-2 h-2" />
                  <span className="text-purple-400">GITHUB:</span>
                  <span>#{event.githubIssueNumber}</span>
                </div>
              )}
            </div>

            {event.errorMessage && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-sm">
                <div className="text-[7px] text-red-400 font-mono">{event.errorMessage}</div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Selected Event Detail */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Event Details</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[8px]">
              <div>
                <div className="text-white/20 uppercase tracking-wider mb-1">Event ID</div>
                <div className="font-mono text-white/60">{selectedEvent.id}</div>
              </div>
              <div>
                <div className="text-white/20 uppercase tracking-wider mb-1">Timestamp</div>
                <div className="font-mono text-white/60">{new Date(selectedEvent.timestamp).toISOString()}</div>
              </div>
              <div>
                <div className="text-white/20 uppercase tracking-wider mb-1">Type</div>
                <div className={cn("font-mono", getTypeColor(selectedEvent.type))}>{selectedEvent.type}</div>
              </div>
              <div>
                <div className="text-white/20 uppercase tracking-wider mb-1">Status</div>
                <div className="font-mono text-white/60">{selectedEvent.status}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {selectedEvent.githubIssueNumber && (
                <a
                  href={`https://github.com/issues/${selectedEvent.githubIssueNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Issue
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotionGitHubSyncView;