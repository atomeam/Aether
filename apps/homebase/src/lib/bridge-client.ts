import { z } from 'zod';

import type { AppEnv } from './env.js';
import type { AuditEventSummary, FeedResult, TaskSummary } from '../types.js';

const taskItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    state: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional()
  })
  .passthrough();

const auditItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    event: z.string().optional(),
    actor: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    timestamp: z.string().optional()
  })
  .passthrough();

const healthSchema = z.object({
  status: z.string(),
  version: z.string(),
  timestamp: z.union([z.string(), z.number()]),
  uptime: z.number().optional()
});

export interface BridgeClient {
  getTasks(): Promise<FeedResult<TaskSummary>>;
  getAuditEvents(): Promise<FeedResult<AuditEventSummary>>;
  checkHealth(): Promise<{ status: string; version: string; timestamp: string; uptime?: number }>;
}

interface BridgeClientOptions {
  timeoutMs?: number;
}

interface JsonResponse {
  endpoint: string;
  payload: unknown;
}

function resolveEndpoint(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.tasks)) {
      return candidate.tasks;
    }
    if (Array.isArray(candidate.items)) {
      return candidate.items;
    }
    if (Array.isArray(candidate.events)) {
      return candidate.events;
    }
    if (Array.isArray(candidate.data)) {
      return candidate.data;
    }
  }

  throw new Error('Response payload does not contain a list.');
}

function buildTaskStub(endpoint: string, error: string): FeedResult<TaskSummary> {
  return {
    source: 'stub',
    endpoint,
    error,
    items: [
      {
        id: 'stub-task-1',
        title: 'Tasks feed unavailable (stub)',
        status: 'unknown',
        updatedAt: new Date().toISOString()
      }
    ]
  };
}

function buildAuditStub(endpoint: string, error: string): FeedResult<AuditEventSummary> {
  return {
    source: 'stub',
    endpoint,
    error,
    items: [
      {
        id: 'stub-event-1',
        type: 'deploy_event_feed_unavailable',
        actor: 'system',
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function createBridgeClient(env: AppEnv, options: BridgeClientOptions = {}): BridgeClient {
  const timeoutMs = options.timeoutMs ?? 3000;

  async function requestJson(path: string, baseUrl?: string): Promise<JsonResponse> {
    const base = baseUrl ?? env.BRIDGE_BASE_URL;
    const endpoint = resolveEndpoint(base, path);
    const headers = new Headers({
      Accept: 'application/json'
    });

    if (env.BRIDGE_API_TOKEN && base === env.BRIDGE_BASE_URL) {
      headers.set('Authorization', `Bearer ${env.BRIDGE_API_TOKEN}`);
    }

    if (env.ATOMIND_DEVIN_SECRET && base === env.ATOMIND_BASE_URL) {
      headers.set('Authorization', `Bearer ${env.ATOMIND_DEVIN_SECRET}`);
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON response from Bridge endpoint.');
    }

    return {
      endpoint,
      payload: await response.json()
    };
  }

  return {
    async getTasks() {
      const endpoint = resolveEndpoint(env.BRIDGE_BASE_URL, env.BRIDGE_TASKS_PATH);

      try {
        const { payload } = await requestJson(env.BRIDGE_TASKS_PATH);
        const rawItems = extractCollection(payload);
        const parsedItems = z.array(taskItemSchema).parse(rawItems);

        return {
          source: 'live',
          endpoint,
          items: parsedItems.map((item, index) => ({
            id: String(item.id ?? `task-${index + 1}`),
            title: item.title ?? item.name ?? 'Untitled task',
            status: item.status ?? item.state ?? 'unknown',
            updatedAt: item.updatedAt ?? item.updated_at
          }))
        };
      } catch (error) {
        return buildTaskStub(endpoint, error instanceof Error ? error.message : String(error));
      }
    },

    async getAuditEvents() {
      const endpoint = resolveEndpoint(env.BRIDGE_BASE_URL, env.BRIDGE_AUDIT_EVENTS_PATH);

      try {
        const { payload } = await requestJson(env.BRIDGE_AUDIT_EVENTS_PATH);
        const rawItems = extractCollection(payload);
        const parsedItems = z.array(auditItemSchema).parse(rawItems);

        return {
          source: 'live',
          endpoint,
          items: parsedItems.map((item, index) => ({
            id: String(item.id ?? `event-${index + 1}`),
            type: item.type ?? item.event ?? 'unknown_event',
            actor: item.actor,
            createdAt: item.createdAt ?? item.created_at ?? item.timestamp
          }))
        };
      } catch (error) {
        return buildAuditStub(endpoint, error instanceof Error ? error.message : String(error));
      }
    },

    async checkHealth() {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/health');

      try {
        const { payload } = await requestJson('/api/a-to-mind/health', env.ATOMIND_BASE_URL);
        const healthData = healthSchema.parse(payload);
        
        return {
          status: healthData.status,
          version: healthData.version,
          timestamp: healthData.timestamp,
          uptime: healthData.uptime
        };
      } catch (error) {
        throw new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
}
