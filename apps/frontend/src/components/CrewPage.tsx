/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  Radio, 
  RadioResponse,
  CircleDot,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Brain,
  Zap,
  Gauge,
  Server,
  WifiOff,
  Loader2
} from 'lucide-react';

import { cn } from '../lib/utils';

// Bridge API URL - live worker is default, localhost override
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || 'https://aether.atomicmoonbeam88.workers.dev';

// Explicit Bridge UI state machine
type BridgeUiState = 'checking' | 'bridge-offline' | 'bindings-missing' | 'data-empty' | 'operational';

// Normalize bindings to uppercase shape
function normalizeBindings(bindings: Record<string, boolean>): Record<string, boolean> {
  return {
    DB: !!bindings.DB || !!bindings.db || !!bindings.DB,
    STATE: !!bindings.STATE || !!bindings.state,
    STATE_CACHE: !!bindings.STATE_CACHE || !!bindings.state_cache,
    MYBROWSER: !!bindings.MYBROWSER || !!bindings.mybrowser,
  };
}

// Actor status derived from runtime calls
type ActorStatus = 'online' | 'waiting' | 'error' | 'offline';

// Computed actor status based on bridge health
function computeActorStatus(bridgeState: BridgeUiState, actorId: string): ActorStatus {
  if (bridgeState === 'bridge-offline') {
    if (actorId === 'Cloudflare Worker') return 'offline';
    if (actorId === 'Proposals') return 'offline';
    if (actorId === 'Lessons') return 'offline';
  }
  if (bridgeState === 'bindings-missing') {
    if (actorId === 'Cloudflare Worker') return 'error';
  }
  if (bridgeState === 'data-empty') {
    if (actorId === 'Proposals') return 'waiting';
    if (actorId === 'Lessons') return 'waiting';
  }
  if (bridgeState === 'operational') {
    return 'online';
  }
  return 'waiting';
}

// Actor registry - the crew members (status derived from runtime)
const BASE_ACTORS: { id: string; name: string; role: string; capabilities: string[] }[] = [
  { id: 'atom-bomb', name: 'Atom Bomb', role: 'Orchestrator', capabilities: ['Review', 'Approve', 'Reject'] },
  { id: 'notion', name: 'Notion', role: 'Source of Truth', capabilities: ['Wiki', 'Artifacts', 'Drift Detection'] },
  { id: 'openhands', name: 'OpenHands', role: 'Agent Executor', capabilities: ['Code', 'Artifact Apply', 'PR Open'] },
  { id: 'cloudflare-worker', name: 'Cloudflare Worker', role: 'Runtime Bridge', capabilities: ['/health', '/proposals', '/lessons'] },
  { id: 'backend', name: 'Aether Backend', role: 'API Server', capabilities: ['/api/build', '/api/stack'] },
  { id: 'frontend', name: 'Aether Frontend', role: 'UI', capabilities: ['#/crew', '/', '/api/agents'] },
  { id: 'curator', name: 'Curator', role: 'Security Gate', capabilities: ['Allow-list', 'Rate Limit', '422 on denial'] },
  { id: 'proposals', name: 'Proposals', role: 'Queue', capabilities: ['Enqueue', 'Dequeue', 'Prioritize'] },
  { id: 'lessons', name: 'Lessons', role: 'Memory', capabilities: ['Log', 'Query', 'Index'] },
];

// Next action registry - what each actor should do next
const CREW_ACTIONS: NextAction[] = [
  { id: '1', action: 'Review', target: 'Atom Bomb', reason: 'Verify PRs only - no unverified artifacts', priority: 1 },
  { id: '2', action: 'Maintain', target: 'Notion', reason: 'Source of truth and catch drift', priority: 2 },
  { id: '3', action: 'Apply', target: 'OpenHands', reason: 'Apply artifacts and open PRs', priority: 3 },
  { id: '4', action: 'Report', target: 'Cloudflare Worker', reason: 'Report runtime state from /health', priority: 4 },
  { id: '5', action: 'Write', target: 'Backend', reason: 'Write proposals:snapshot and lessons:index to KV', priority: 5 },
  { id: '6', action: 'Render', target: 'Frontend', reason: 'Render /crew and show live state', priority: 6 },
  { id: '7', action: 'Gate', target: 'Curator', reason: 'Stay read-only until v0.3.0 gated writes', priority: 7 },
  { id: '8', action: 'Expose', target: 'Proposals', reason: 'Queue through /proposals', priority: 8 },
  { id: '9', action: 'Store', target: 'Lessons', reason: 'Memory through /lessons', priority: 9 },
];

// Types for Bridge API responses
interface BridgeHealth {
  ok: boolean;
  service: string;
  version: string;
  ts: string;
  bindings: Record<string, boolean>;
}

interface Proposal {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  actor?: string;
  timestamp: string;
  priority?: number;
}

interface Lesson {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  outcome?: 'success' | 'failure' | 'partial';
}

interface Actor {
  id: string;
  name: string;
  role: string;
  status: ActorStatus;
  lastSeen: string;
  capabilities?: string[];
}

interface NextAction {
  id: string;
  action: string;
  target: string;
  reason: string;
  priority: number;
}

// Status badge component
const StatusBadge = ({ status, label }: { status: string; label?: string }) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    active: { 
      bg: 'bg-green-500/20 border-green-500/40', 
      text: 'text-green-400',
      icon: <CircleDot className="w-3 h-3 animate-pulse" />
    },
    idle: { 
      bg: 'bg-yellow-500/20 border-yellow-500/40', 
      text: 'text-yellow-400',
      icon: <CircleDot className="w-3 h-3" />
    },
    error: { 
      bg: 'bg-red-500/20 border-red-500/40', 
      text: 'text-red-400',
      icon: <AlertCircle className="w-3 h-3" />
    },
    offline: { 
      bg: 'bg-white/10 border-white/20', 
      text: 'text-white/40',
      icon: <CircleDot className="w-3 h-3" />
    },
    pending: {
      bg: 'bg-blue-500/20 border-blue-500/40',
      text: 'text-blue-400',
      icon: <Clock className="w-3 h-3" />
    },
    completed: {
      bg: 'bg-green-500/20 border-green-500/40',
      text: 'text-green-400',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    failed: {
      bg: 'bg-red-500/20 border-red-500/40',
      text: 'text-red-400',
      icon: <AlertCircle className="w-3 h-3" />
    },
  };
  
  const config = statusConfig[status] || statusConfig.idle;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider border rounded-full",
      config.bg, config.text
    )}>
      {config.icon}
      {label || status}
    </span>
  );
};

// Bridge status card
const BridgeStatus = ({ health, error }: { health?: BridgeHealth; error?: string }) => {
  if (error) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <Server className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-wider">Bridge</span>
        </div>
        <p className="text-[10px] text-red-400/80">Down: {error}</p>
      </div>
    );
  }
  
  if (!health) {
    return (
      <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
        <div className="flex items-center gap-2 text-white/40 mb-2">
          <Server className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">Bridge</span>
        </div>
        <p className="text-[10px] text-white/40">Checking...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border border-green-500/30 bg-green-500/5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-green-400">
          <Server className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-wider">Bridge</span>
        </div>
        <StatusBadge status="active" />
      </div>
      <div className="text-[9px] text-white/60 space-y-1">
        <p>Worker: {health.worker}</p>
        <p>Updated: {new Date(health.timestamp).toLocaleTimeString()}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-green-500/20">
        <p className="text-[8px] text-white/40 uppercase tracking-wider mb-2">Bindings</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(health.bindings).map(([key, value]) => (
            <span key={key} className={cn(
              "text-[8px] font-mono px-2 py-0.5 rounded border",
              value 
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            )}>
              {key}: {value ? 'ok' : 'missing'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Actor card
const ActorCard = ({ actor }: { actor: Actor }) => {
  return (
    <div className="p-3 border border-white/10 bg-white/[0.02] rounded-lg hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase text-white/80">{actor.name}</span>
        <StatusBadge status={actor.status} />
      </div>
      <p className="text-[8px] text-white/40 uppercase tracking-wider mb-2">{actor.role}</p>
      <p className="text-[7px] text-white/30">Last seen: {new Date(actor.lastSeen).toLocaleTimeString()}</p>
      {actor.capabilities && actor.capabilities.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {actor.capabilities.slice(0, 3).map(cap => (
            <span key={cap} className="text-[7px] text-white/30 px-1.5 py-0.5 bg-white/5 rounded">
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Proposal/Lesson item
const ProposalItem = ({ proposal, onClick }: { proposal: Proposal | Lesson; onClick?: () => void }) => {
  const isProposal = 'status' in proposal;
  
  return (
    <button 
      onClick={onClick}
      className="w-full p-3 border border-white/10 bg-white/[0.02] rounded-lg hover:border-gold/30 hover:bg-gold/5 transition-all text-left group"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium text-white/80 truncate flex-1">
          {'title' in proposal ? proposal.title : 'Untitled'}
        </span>
        {'status' in proposal && <StatusBadge status={proposal.status} />}
        {'outcome' in proposal && proposal.outcome && <StatusBadge status={proposal.outcome} label={proposal.outcome} />}
      </div>
      <div className="flex items-center gap-2 text-[7px] text-white/30">
        <Clock className="w-3 h-3" />
        <span>{new Date(proposal.timestamp).toLocaleString()}</span>
        {isProposal && 'actor' in proposal && proposal.actor && (
          <>
            <span>•</span>
            <span>{proposal.actor}</span>
          </>
        )}
        {!isProposal && 'category' in proposal && (
          <>
            <span>•</span>
            <span className="uppercase">{proposal.category}</span>
          </>
        )}
      </div>
    </button>
  );
};

// Next action item
const NextActionItem = ({ action }: { action: NextAction }) => {
  return (
    <div className="p-3 border border-blue-500/20 bg-blue-500/5 rounded-lg hover:border-blue-500/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] font-medium text-blue-400 uppercase">{action.action}</span>
        </div>
        <span className="text-[8px] text-white/40 bg-white/10 px-2 py-0.5 rounded">P{action.priority}</span>
      </div>
      <p className="text-[8px] text-white/60 mb-1">{action.target}</p>
      <p className="text-[7px] text-white/30 italic">{action.reason}</p>
    </div>
  );
};

// Main CrewPage component
export default function CrewPage() {
  const [bridgeHealth, setBridgeHealth] = useState<BridgeHealth | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  // Use actor registry as the source of truth
  const [actors] = useState<Actor[]>(CREW_ACTORS);
  const [nextActions] = useState<NextAction[]>(CREW_ACTIONS);
  const [loading, setLoading] = useState(true);

  // Fetch bridge status
  const fetchBridgeHealth = useCallback(async () => {
    try {
      const cacheBust = `?_=${Date.now()}`;
      const res = await fetch(`${BRIDGE_URL}/health${cacheBust}`, { 
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        // Support both old { status, worker, timestamp, bindings } and new { ok, service, version, ts, bindings } shapes
        const normalized = {
          ok: data.ok ?? data.status === 'ok',
          service: data.service || data.worker || 'aether-bridge',
          version: data.version || 'unknown',
          ts: data.ts || data.timestamp || new Date().toISOString(),
          bindings: data.bindings || {},
        };
        setBridgeHealth(normalized);
        setBridgeError(null);
      } else {
        setBridgeError(`HTTP ${res.status}`);
      }
    } catch (e) {
      setBridgeError(e instanceof Error ? e.message : 'Connection failed');
    }
  }, []);

  // Fetch proposals from bridge
  const fetchProposals = useCallback(async () => {
    try {
      const cacheBust = `?_=${Date.now()}`;
      const res = await fetch(`${BRIDGE_URL}/proposals${cacheBust}`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        // Support both old array and new { proposals: [] } shape
        const arr = Array.isArray(data) ? data : (data?.proposals || []);
        setProposals(Array.isArray(arr) ? arr : []);
      }
    } catch {
      setProposals([]);
    }
  }, []);

  // Fetch lessons from bridge
  const fetchLessons = useCallback(async () => {
    try {
      const cacheBust = `?_=${Date.now()}`;
      const res = await fetch(`${BRIDGE_URL}/lessons${cacheBust}`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        // Support both old array and new { lessons: [] } shape
        const arr = Array.isArray(data) ? data : (data?.lessons || []);
        setLessons(Array.isArray(arr) ? arr : []);
      }
    } catch {
      setLessons([]);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBridgeHealth(), fetchProposals(), fetchLessons()]);
      setLoading(false);
    };
    load();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchBridgeHealth();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchBridgeHealth, fetchProposals, fetchLessons]);

  // Compute bridge UI state from health response
  const bridgeUiState = useMemo((): BridgeUiState => {
    if (loading) return 'checking';
    if (bridgeError || !bridgeHealth?.ok) return 'bridge-offline';
    
    const bindings = bridgeHealth?.bindings ? normalizeBindings(bridgeHealth.bindings) : {};
    const hasMissing = !bindings.DB || !bindings.STATE || !bindings.STATE_CACHE || !bindings.MYBROWSER;
    
    if (hasMissing) return 'bindings-missing';
    if (proposals.length === 0 && lessons.length === 0) return 'data-empty';
    if (proposals.length > 0 || lessons.length > 0) return 'operational';
    
    return 'data-empty';
  }, [bridgeHealth, bridgeError, loading, proposals.length, lessons.length]);

  // Compute actor status from bridge state
  const actorsWithStatus = useMemo(() => {
    return BASE_ACTORS.map(actor => ({
      ...actor,
      status: computeActorStatus(bridgeUiState, actor.name) as ActorStatus,
      lastSeen: new Date().toISOString(),
    }));
  }, [bridgeUiState]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/10 rounded-lg">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider">Crew</h1>
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Actor coordination & status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bridgeUiState === 'checking' ? (
              <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            ) : bridgeUiState === 'bridge-offline' ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : bridgeUiState === 'bindings-missing' ? (
              <AlertCircle className="w-4 h-4 text-orange-400" />
            ) : (
              <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            )}
            <span className="text-[8px] font-mono text-white/40 uppercase">
              {bridgeUiState.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Bridge Status */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">System Status</h2>
          <BridgeStatus health={bridgeHealth} error={bridgeError} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actors */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">Actors</h2>
            <div className="space-y-2">
              {actorsWithStatus.map(actor => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </section>

          {/* Next Actions */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">Next Actions</h2>
            <div className="space-y-2">
              {nextActions.map(action => (
                <NextActionItem key={action.id} action={action} />
              ))}
            </div>
          </section>
        </div>

        {/* Proposals */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">Proposals</h2>
          {proposals.length === 0 ? (
            <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
              <p className="text-[10px] text-white/40 italic">Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {proposals.slice(0, 10).map(proposal => (
                <ProposalItem key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </section>

        {/* Lessons */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">Lessons</h2>
          {lessons.length === 0 ? (
            <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
              <p className="text-[10px] text-white/40 italic">Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lessons.slice(0, 10).map(lesson => (
                <ProposalItem key={lesson.id} proposal={lesson} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}