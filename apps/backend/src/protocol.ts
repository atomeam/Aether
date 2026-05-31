/**
 * Aether Protocol - Event Envelope & Logging
 * 
 * Implements Aether Runtime Protocol v0.1
 * https://github.com/atomeam/Aether/blob/main/PROTOCOL.md
 */

import { S3Api } from '@cloudflare/workers-js-client';

/**
 * Event Source - according to PROTOCOL.md
 */
export type EventSource = 'aether' | 'aether-bridge' | 'homebase';

/**
 * Aether Event Envelope - PROTOCOL.md Section 2
 */
export interface AetherEvent<T = unknown> {
  // Identity
  id: string;
  ts: string;
  
  // Distributed Tracing
  trace_id: string;
  session_id?: string;
  
  // Provenance
  source: EventSource;
  version: string;
  
  // Causation Graph
  causation_id?: string;
  correlation_id?: string;
  
  // Payload
  type: string;
  payload: T;
}

/**
 * Create a new event ID
 */
export function createEventId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new trace ID
 */
export function createTraceId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new AetherEvent
 */
export function createAetherEvent<T>(
  source: EventSource,
  type: string,
  payload: T,
  opts?: {
    trace_id?: string;
    session_id?: string;
    causation_id?: string;
    correlation_id?: string;
  }
): AetherEvent<T> {
  return {
    id: createEventId(),
    ts: new Date().toISOString(),
    trace_id: opts?.trace_id || createTraceId(),
    session_id: opts?.session_id,
    source,
    version: '2026-05-21',
    causation_id: opts?.causation_id,
    correlation_id: opts?.correlation_id,
    type,
    payload,
  };
}

/**
 * Log Types - PROTOCOL.md Section 4
 */
export type LogType = 
  | 'job_dispatched'
  | 'job_received'
  | 'execution_complete'
  | 'execution_failed'
  | 'error'
  | 'dlq';

/**
 * Get log path per PROTOCOL.md: logs/{type}/{yyyy}/{mm}/{dd}/{trace_id}_{event_id}.json
 */
export function getLogPath(type: LogType, trace_id: string, event_id: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = now.getUTCDate().toString().padStart(2, '0');
  
  return `logs/${type}/${yyyy}/${mm}/${dd}/${trace_id}_${event_id}.json`;
}

/**
 * Write structured log to R2 - PROTOCOL.md Section 4
 */
export async function writeR2Log(
  r2: R2Bucket,
  type: LogType,
  event: AetherEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  const path = getLogPath(type, event.trace_id, event.id);
  
  const logEntry = {
    ...event,
    metadata,
    written_at: new Date().toISOString(),
  };
  
  await r2.put(path, JSON.stringify(logEntry), {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

/**
 * Read log from R2
 */
export async function readR2Log(
  r2: R2Bucket,
  path: string
): Promise<AetherEvent | null> {
  const object = await r2.get(path);
  if (!object) return null;
  
  const text = await object.text();
  try {
    return JSON.parse(text) as AetherEvent;
  } catch {
    return null;
  }
}

/**
 * Queue Job - PROTOCOL.md Section 3
 */
export interface CuratorJob {
  id: string;
  event_id: string;
  eventType: string;
  pageId: string;
  databaseId?: string;
  sessionId?: string;
  trace_id: string;
  payload: unknown;
  receivedAt: string;
  retry_count?: number;
  dead_letter?: boolean;
}

/**
 * Trace propagation header - PROTOCOL.md Section 6
 */
export const TRACE_HEADER = 'X-Aether-Trace-ID';
export const CAUSATION_HEADER = 'X-Aether-Causation-ID';

/**
 * Extract trace ID from request headers
 */
export function getTraceId(request: Request): string | null {
  return request.headers.get(TRACE_HEADER);
}

/**
 * Standard trace headers for outbound requests
 */
export function getTraceHeaders(trace_id: string, causation_id?: string): Record<string, string> {
  const headers: Record<string, string> = {
    [TRACE_HEADER]: trace_id,
  };
  if (causation_id) {
    headers[CAUSATION_HEADER] = causation_id;
  }
  return headers;
}