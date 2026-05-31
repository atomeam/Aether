/**
 * Crew Room KV helpers — agent heartbeats, status, and telemetry.
 *
 * Agents (Viktor, OpenHands, Devin, etc.) check in via heartbeat.
 * The Crew Room frontend reads the aggregate snapshot.
 */

import { InstrumentedKV } from './writer';
import { StateKeys, CacheKeys } from './keys';

// ─── Types ───────────────────────────────────────────────────────────

export interface AgentStatus {
  id: string;
  name: string;
  lane: string;
  status: 'active' | 'standby' | 'on-ice' | 'offline';
  leverage: number; // 0-100 utilization percentage
  lastHeartbeat: string; // ISO timestamp
  currentTask: string | null;
  tasksCompleted: number;
  prsShipped: number;
}

export interface CrewSnapshot {
  agents: AgentStatus[];
  totalActive: number;
  totalPRs: number;
  totalTasks: number;
  updatedAt: string;
}

// ─── Default Agent Roster ────────────────────────────────────────────
// Seeded from the 9-agent crew dispatch. Heartbeats override these.

const DEFAULT_AGENTS: AgentStatus[] = [
  { id: 'viktor', name: 'Viktor', lane: 'Aether infra + features', status: 'active', leverage: 60, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'openhands', name: 'OpenHands', lane: 'Tooling + safety net', status: 'standby', leverage: 50, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'devin', name: 'Devin', lane: 'Docs + perf', status: 'active', leverage: 10, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'notion-ai', name: 'Notion AI', lane: 'Coordination + ledger', status: 'active', leverage: 45, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'cf-assistant', name: 'CF Assistant', lane: 'CF API executor', status: 'standby', leverage: 25, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'twin-a', name: 'Twin A', lane: 'Dashboard retarget', status: 'standby', leverage: 0, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'twin-b', name: 'Twin B', lane: 'Loxa public copy', status: 'active', leverage: 0, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'slackbot', name: 'Slackbot', lane: 'NS-check + ops', status: 'active', leverage: 0, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'gemini-api', name: 'Gemini API', lane: 'Active, no asks', status: 'active', leverage: 0, lastHeartbeat: '', currentTask: null, tasksCompleted: 0, prsShipped: 0 },
];

// ─── Crew Manager ────────────────────────────────────────────────────

export class CrewManager {
  constructor(
    private readonly state: InstrumentedKV,
    private readonly cache: InstrumentedKV,
  ) {}

  /** Get full crew snapshot (reads cache first, falls back to building from agent keys) */
  async getSnapshot(): Promise<CrewSnapshot> {
    const cached = await this.cache.getJSON<CrewSnapshot>(CacheKeys.crewSnapshot);
    if (cached && this.isFresh(cached.updatedAt, 30_000)) {
      return cached;
    }

    // Build from individual agent state
    const agents = await this.getAllAgents();
    const snapshot: CrewSnapshot = {
      agents,
      totalActive: agents.filter(a => a.status === 'active').length,
      totalPRs: agents.reduce((sum, a) => sum + a.prsShipped, 0),
      totalTasks: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
      updatedAt: new Date().toISOString(),
    };

    // Cache for 30s
    this.cache.enqueueJSON(CacheKeys.crewSnapshot, snapshot);
    return snapshot;
  }

  /** Get all agents (merge defaults with stored state) */
  async getAllAgents(): Promise<AgentStatus[]> {
    const agents: AgentStatus[] = [];

    for (const def of DEFAULT_AGENTS) {
      const stored = await this.cache.getJSON<AgentStatus>(
        CacheKeys.crewAgent(def.id)
      );
      agents.push(stored ?? def);
    }

    return agents;
  }

  /** Agent heartbeat — update status + current task */
  async heartbeat(
    agentId: string,
    update: Partial<Pick<AgentStatus, 'status' | 'currentTask' | 'lane' | 'leverage' | 'tasksCompleted' | 'prsShipped'>>
  ): Promise<AgentStatus> {
    const existing = await this.cache.getJSON<AgentStatus>(
      CacheKeys.crewAgent(agentId)
    );

    const base = existing ?? DEFAULT_AGENTS.find(a => a.id === agentId) ?? {
      id: agentId,
      name: agentId,
      lane: 'unknown',
      status: 'active' as const,
      leverage: 0,
      lastHeartbeat: '',
      currentTask: null,
      tasksCompleted: 0,
      prsShipped: 0,
    };

    const updated: AgentStatus = {
      ...base,
      ...update,
      lastHeartbeat: new Date().toISOString(),
    };

    await this.cache.putJSON(CacheKeys.crewAgent(agentId), updated);

    // Also update STATE for persistence
    await this.state.putJSON(StateKeys.agentHeartbeat(agentId), {
      ts: updated.lastHeartbeat,
      status: updated.status,
    });

    // Invalidate crew snapshot cache
    await this.cache.delete(CacheKeys.crewSnapshot);

    return updated;
  }

  private isFresh(isoDate: string, maxAgeMs: number): boolean {
    if (!isoDate) return false;
    return Date.now() - new Date(isoDate).getTime() < maxAgeMs;
  }
}
