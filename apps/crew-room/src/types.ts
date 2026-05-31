/** Agent status in the crew room */
export interface AgentStatus {
  id: string;
  name: string;
  lane: string;
  status: 'active' | 'standby' | 'on-ice' | 'offline' | 'unknown';
  leverage: number;
  lastHeartbeat: string | null;
  currentTask: string | null;
  tasksCompleted: number;
  prsShipped: number;
}

/** Full crew snapshot from /crew/room */
export interface CrewSnapshot {
  ok: boolean;
  agents: AgentStatus[];
  totalActive: number;
  totalPRs: number;
  totalTasks: number;
  updatedAt: string | null;
}

/** KV telemetry snapshot from /crew/telemetry */
export interface KVTelemetrySnapshot {
  worker: string;
  date: string;
  ops: {
    get: number;
    put: number;
    delete: number;
    list: number;
  };
  totalRequests: number;
  errors: number;
  flushCount: number;
  lastFlushAt: string;
}

export interface TelemetryResponse {
  ok: boolean;
  date: string;
  telemetry: Record<string, KVTelemetrySnapshot | null>;
}
