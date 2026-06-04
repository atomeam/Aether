/**
 * API client for Crew Room endpoints.
 *
 * Uses mock data when the bridge worker isn't available (dev mode).
 * Automatically switches to live data when bridge responds.
 */

import type { CrewSnapshot, TelemetryResponse, AgentStatus } from './types';

const BASE_URL = import.meta.env.VITE_BRIDGE_URL || '';

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_AGENTS: AgentStatus[] = [
  { id: 'viktor', name: 'Viktor', lane: 'KV writers + Crew Room', status: 'active', leverage: 80, lastHeartbeat: new Date().toISOString(), currentTask: 'Lane A + B: KV writers + Crew Room scaffold', tasksCompleted: 12, prsShipped: 6 },
  { id: 'openhands', name: 'OpenHands', lane: 'Tooling + safety net', status: 'standby', leverage: 50, lastHeartbeat: new Date(Date.now() - 600_000).toISOString(), currentTask: null, tasksCompleted: 8, prsShipped: 3 },
  { id: 'devin', name: 'Devin', lane: 'Self-audit → bundle → lint', status: 'active', leverage: 30, lastHeartbeat: new Date(Date.now() - 300_000).toISOString(), currentTask: 'P1: Self-audit a3c134e', tasksCompleted: 5, prsShipped: 2 },
  { id: 'notion-ai', name: 'Notion AI', lane: 'Coordination + ledger', status: 'active', leverage: 45, lastHeartbeat: new Date(Date.now() - 120_000).toISOString(), currentTask: 'Crew dispatch coordination', tasksCompleted: 15, prsShipped: 0 },
  { id: 'cf-assistant', name: 'CF Assistant', lane: 'CF API executor', status: 'standby', leverage: 25, lastHeartbeat: null, currentTask: null, tasksCompleted: 2, prsShipped: 0 },
  { id: 'twin-a', name: 'Twin A', lane: 'Dashboard retarget', status: 'standby', leverage: 0, lastHeartbeat: null, currentTask: null, tasksCompleted: 0, prsShipped: 0 },
  { id: 'twin-b', name: 'Twin B', lane: 'Loxa public copy', status: 'active', leverage: 15, lastHeartbeat: new Date(Date.now() - 1800_000).toISOString(), currentTask: 'Rename sweep', tasksCompleted: 3, prsShipped: 0 },
  { id: 'slackbot', name: 'Slackbot', lane: 'NS-check + ops', status: 'active', leverage: 10, lastHeartbeat: new Date(Date.now() - 900_000).toISOString(), currentTask: 'Retire a-to-mind.com NS-check', tasksCompleted: 4, prsShipped: 0 },
  { id: 'gemini-api', name: 'Gemini API', lane: 'Active, no asks', status: 'active', leverage: 5, lastHeartbeat: new Date(Date.now() - 3600_000).toISOString(), currentTask: null, tasksCompleted: 1, prsShipped: 0 },
];

const MOCK_SNAPSHOT: CrewSnapshot = {
  ok: true,
  agents: MOCK_AGENTS,
  totalActive: MOCK_AGENTS.filter(a => a.status === 'active').length,
  totalPRs: MOCK_AGENTS.reduce((s, a) => s + a.prsShipped, 0),
  totalTasks: MOCK_AGENTS.reduce((s, a) => s + a.tasksCompleted, 0),
  updatedAt: new Date().toISOString(),
};

// ─── API Functions ───────────────────────────────────────────────────

async function fetchJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } catch {
    return fallback;
  }
}

export async function getCrewSnapshot(): Promise<CrewSnapshot> {
  return fetchJSON('/crew/room', MOCK_SNAPSHOT);
}

export async function getTelemetry(date?: string): Promise<TelemetryResponse> {
  const d = date || new Date().toISOString().slice(0, 10);
  return fetchJSON(`/crew/telemetry?date=${d}`, {
    ok: true,
    date: d,
    telemetry: {
      'aether-bridge': {
        worker: 'aether-bridge', date: d,
        ops: { get: 142, put: 38, delete: 5, list: 3 },
        totalRequests: 287, errors: 2, flushCount: 19, lastFlushAt: new Date().toISOString(),
      },
      'notion-worker': {
        worker: 'notion-worker', date: d,
        ops: { get: 24, put: 12, delete: 0, list: 1 },
        totalRequests: 45, errors: 0, flushCount: 6, lastFlushAt: new Date().toISOString(),
      },
      'aether': null,
    },
  });
}

export async function sendHeartbeat(agentId: string, update: Partial<AgentStatus>): Promise<void> {
  try {
    await fetch(`${BASE_URL}/crew/agents/${agentId}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
  } catch {
    // Silently fail — heartbeat is best-effort
  }
}
