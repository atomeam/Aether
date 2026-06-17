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

// a-to-mind API schemas
const analyzeRequestSchema = z.object({
  text: z.string(),
  type: z.enum(['general', 'sentiment', 'keywords']).default('general')
});

const analyzeResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
  analysis: z.object({
    wordCount: z.number(),
    characterCount: z.number(),
    characterCountNoSpaces: z.number(),
    sentenceCount: z.number(),
    paragraphCount: z.number(),
    averageWordLength: z.number(),
    readingTime: z.number(),
    sentiment: z.string().optional(),
    positiveCount: z.number().optional(),
    negativeCount: z.number().optional(),
    confidence: z.number().optional(),
    keywords: z.array(z.object({ word: z.string(), count: z.number() })).optional()
  }).passthrough()
});

const generateRequestSchema = z.object({
  prompt: z.string(),
  type: z.enum(['summary', 'title', 'hashtags']).default('summary'),
  length: z.enum(['short', 'medium', 'long']).default('medium')
});

const generateResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
  result: z.string()
});

const transformRequestSchema = z.object({
  data: z.string(),
  operation: z.enum(['uppercase', 'lowercase', 'reverse', 'base64_encode', 'base64_decode', 'json_prettify', 'json_minify'])
});

const transformResponseSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  result: z.string()
});

const validateRequestSchema = z.object({
  data: z.string(),
  type: z.enum(['email', 'url', 'phone', 'json'])
});

const validateResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
  validation: z.object({
    valid: z.boolean(),
    errors: z.array(z.string())
  })
});

const extractRequestSchema = z.object({
  text: z.string(),
  type: z.enum(['emails', 'urls', 'phone_numbers', 'hashtags', 'mentions'])
});

const extractResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
  extracted: z.array(z.string()),
  count: z.number()
});

const compareRequestSchema = z.object({
  data1: z.string(),
  data2: z.string(),
  type: z.enum(['text', 'json']).default('text')
});

const compareResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
  comparison: z.object({
    similarity: z.number().optional(),
    commonWords: z.array(z.string()).optional(),
    difference: z.object({
      inText1: z.array(z.string()),
      inText2: z.array(z.string())
    }).optional(),
    equal: z.boolean().optional(),
    keys1: z.array(z.string()).optional(),
    keys2: z.array(z.string()).optional(),
    addedKeys: z.array(z.string()).optional(),
    removedKeys: z.array(z.string()).optional(),
    error: z.string().optional()
  })
});

export interface BridgeClient {
  getTasks(): Promise<FeedResult<TaskSummary>>;
  getAuditEvents(): Promise<FeedResult<AuditEventSummary>>;
  checkHealth(): Promise<{ status: string; version: string; timestamp: string; uptime?: number }>;
  analyzeText(text: string, type?: 'general' | 'sentiment' | 'keywords'): Promise<z.infer<typeof analyzeResponseSchema>>;
  generateContent(prompt: string, type?: 'summary' | 'title' | 'hashtags', length?: 'short' | 'medium' | 'long'): Promise<z.infer<typeof generateResponseSchema>>;
  transformData(data: string, operation: z.infer<typeof transformRequestSchema>['operation']): Promise<z.infer<typeof transformResponseSchema>>;
  validateData(data: string, type: z.infer<typeof validateRequestSchema>['type']): Promise<z.infer<typeof validateResponseSchema>>;
  extractData(text: string, type: z.infer<typeof extractRequestSchema>['type']): Promise<z.infer<typeof extractResponseSchema>>;
  compareData(data1: string, data2: string, type?: 'text' | 'json'): Promise<z.infer<typeof compareResponseSchema>>;
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

  async function requestJsonPost(path: string, body: unknown, baseUrl?: string): Promise<JsonResponse> {
    const base = baseUrl ?? env.BRIDGE_BASE_URL;
    const endpoint = resolveEndpoint(base, path);
    const headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });

    if (env.BRIDGE_API_TOKEN && base === env.BRIDGE_BASE_URL) {
      headers.set('Authorization', `Bearer ${env.BRIDGE_API_TOKEN}`);
    }

    if (env.ATOMIND_DEVIN_SECRET && base === env.ATOMIND_BASE_URL) {
      headers.set('Authorization', `Bearer ${env.ATOMIND_DEVIN_SECRET}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
    },

    async analyzeText(text, type = 'general') {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/analyze');
      const requestBody = analyzeRequestSchema.parse({ text, type });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/analyze', requestBody, env.ATOMIND_BASE_URL);
        return analyzeResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Text analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async generateContent(prompt, type = 'summary', length = 'medium') {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/generate');
      const requestBody = generateRequestSchema.parse({ prompt, type, length });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/generate', requestBody, env.ATOMIND_BASE_URL);
        return generateResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Content generation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async transformData(data, operation) {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/transform');
      const requestBody = transformRequestSchema.parse({ data, operation });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/transform', requestBody, env.ATOMIND_BASE_URL);
        return transformResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Data transformation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async validateData(data, type) {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/validate');
      const requestBody = validateRequestSchema.parse({ data, type });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/validate', requestBody, env.ATOMIND_BASE_URL);
        return validateResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Data validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async extractData(text, type) {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/extract');
      const requestBody = extractRequestSchema.parse({ text, type });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/extract', requestBody, env.ATOMIND_BASE_URL);
        return extractResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Data extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async compareData(data1, data2, type = 'text') {
      const endpoint = resolveEndpoint(env.ATOMIND_BASE_URL, '/api/a-to-mind/compare');
      const requestBody = compareRequestSchema.parse({ data1, data2, type });

      try {
        const { payload } = await requestJsonPost('/api/a-to-mind/compare', requestBody, env.ATOMIND_BASE_URL);
        return compareResponseSchema.parse(payload);
      } catch (error) {
        throw new Error(`Data comparison failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
}
