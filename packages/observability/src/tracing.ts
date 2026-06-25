/**
 * @aether/observability - Distributed Tracing
 * 
 * Distributed tracing implementation supporting span creation,
 * context propagation, and trace collection.
 */

import type {
  TraceSpan,
  TraceContext,
  Trace,
  SpanLog,
  SpanStatus,
  Tracer,
} from './types';

// ============================================================================
// ID Generation
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
}

// ============================================================================
// Span Implementation
// ============================================================================

export class Span implements TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
  status: SpanStatus;
  service: string;

  private finished: boolean = false;

  constructor(
    operationName: string,
    service: string,
    traceId?: string,
    parentSpanId?: string,
  ) {
    this.traceId = traceId || generateId();
    this.spanId = generateId();
    this.parentSpanId = parentSpanId;
    this.operationName = operationName;
    this.service = service;
    this.startTime = Date.now();
    this.endTime = this.startTime;
    this.duration = 0;
    this.tags = {};
    this.logs = [];
    this.status = 'ok';
  }

  setTag(key: string, value: string | number | boolean): void {
    this.tags[key] = value;
  }

  setTags(tags: Record<string, string | number | boolean>): void {
    this.tags = { ...this.tags, ...tags };
  }

  log(fields: Record<string, string | number | boolean>): void {
    this.logs.push({
      timestamp: Date.now(),
      fields,
    });
  }

  setStatus(status: SpanStatus): void {
    this.status = status;
  }

  finish(): void {
    if (this.finished) {
      return;
    }
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.finished = true;
  }

  getContext(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
    };
  }
}

// ============================================================================
// Tracer Implementation
// ============================================================================

export class DistributedTracer implements Tracer {
  private service: string;
  private sampleRate: number;
  private activeSpans: Map<string, Span> = new Map();
  private completedTraces: Map<string, Trace> = new Map();
  private currentTraceId?: string;

  constructor(service: string, sampleRate: number = 1.0) {
    this.service = service;
    this.sampleRate = Math.max(0, Math.min(1, sampleRate));
  }

  startSpan(operationName: string, parentContext?: TraceContext): TraceSpan {
    // Check if we should sample this trace
    if (Math.random() > this.sampleRate) {
      // Return a no-op span if not sampled
      const noopSpan = new Span(operationName, this.service);
      noopSpan.finish();
      return noopSpan;
    }

    const traceId = parentContext?.traceId || this.currentTraceId || generateId();
    const parentSpanId = parentContext?.spanId;

    // Set current trace ID for child spans
    if (!this.currentTraceId) {
      this.currentTraceId = traceId;
    }

    const span = new Span(operationName, this.service, traceId, parentSpanId);
    this.activeSpans.set(span.spanId, span);

    return span;
  }

  inject(context: TraceContext, carrier: any): void {
    if (typeof carrier === 'object' && carrier !== null) {
      carrier['trace-id'] = context.traceId;
      carrier['span-id'] = context.spanId;
      if (context.baggage) {
        carrier['trace-baggage'] = JSON.stringify(context.baggage);
      }
    }
  }

  extract(carrier: any): TraceContext | null {
    if (typeof carrier === 'object' && carrier !== null) {
      const traceId = carrier['trace-id'];
      const spanId = carrier['span-id'];
      const baggageStr = carrier['trace-baggage'];

      if (traceId && spanId) {
        const context: TraceContext = {
          traceId,
          spanId,
        };

        if (baggageStr) {
          try {
            context.baggage = JSON.parse(baggageStr);
          } catch (e) {
            // Ignore parse errors
          }
        }

        return context;
      }
    }
    return null;
  }

  finishSpan(span: TraceSpan): void {
    if (span instanceof Span) {
      span.finish();
      this.activeSpans.delete(span.spanId);
      this.addToTrace(span);
    }
  }

  private addToTrace(span: TraceSpan): void {
    let trace = this.completedTraces.get(span.traceId);

    if (!trace) {
      trace = {
        traceId: span.traceId,
        spans: [],
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        service: this.service,
        tags: {},
      };
      this.completedTraces.set(span.traceId, trace);
    }

    trace.spans.push(span);
    trace.endTime = Math.max(trace.endTime, span.endTime);
    trace.duration = trace.endTime - trace.startTime;

    // If this is the last active span for this trace, clear current trace ID
    if (this.currentTraceId === span.traceId) {
      const hasActiveSpans = Array.from(this.activeSpans.values()).some(
        s => s.traceId === span.traceId,
      );
      if (!hasActiveSpans) {
        this.currentTraceId = undefined;
      }
    }
  }

  getTrace(traceId: string): Trace | null {
    return this.completedTraces.get(traceId) || null;
  }

  getAllTraces(): Trace[] {
    return Array.from(this.completedTraces.values());
  }

  clearTraces(): void {
    this.completedTraces.clear();
    this.activeSpans.clear();
    this.currentTraceId = undefined;
  }

  // Convenience method for async operations
  async traceAsync<T>(
    operationName: string,
    fn: (span: Span) => Promise<T>,
    parentContext?: TraceContext,
  ): Promise<T> {
    const span = this.startSpan(operationName, parentContext) as Span;
    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      span.setTag('error.message', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.finishSpan(span);
    }
  }

  // Convenience method for sync operations
  traceSync<T>(
    operationName: string,
    fn: (span: Span) => T,
    parentContext?: TraceContext,
  ): T {
    const span = this.startSpan(operationName, parentContext) as Span;
    try {
      const result = fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      span.setTag('error.message', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.finishSpan(span);
    }
  }
}

// ============================================================================
// Global Tracer Instance
// ============================================================================

export const globalTracer = new DistributedTracer('default-service');

// Convenience functions for global tracer
export function startSpan(operationName: string, parentContext?: TraceContext): TraceSpan {
  return globalTracer.startSpan(operationName, parentContext);
}

export function injectContext(context: TraceContext, carrier: any): void {
  globalTracer.inject(context, carrier);
}

export function extractContext(carrier: any): TraceContext | null {
  return globalTracer.extract(carrier);
}

export function finishSpan(span: TraceSpan): void {
  globalTracer.finishSpan(span);
}

export function getTrace(traceId: string): Trace | null {
  return globalTracer.getTrace(traceId);
}

export function getAllTraces(): Trace[] {
  return globalTracer.getAllTraces();
}

export async function traceAsync<T>(
  operationName: string,
  fn: (span: Span) => Promise<T>,
  parentContext?: TraceContext,
): Promise<T> {
  return globalTracer.traceAsync(operationName, fn, parentContext);
}

export function traceSync<T>(
  operationName: string,
  fn: (span: Span) => T,
  parentContext?: TraceContext,
): T {
  return globalTracer.traceSync(operationName, fn, parentContext);
}

// ============================================================================
// Context Manager for Async Operations
// ============================================================================

export class AsyncContext {
  private static context: TraceContext | null = null;

  static set(context: TraceContext): void {
    this.context = context;
  }

  static get(): TraceContext | null {
    return this.context;
  }

  static clear(): void {
    this.context = null;
  }

  static async run<T>(context: TraceContext, fn: () => Promise<T>): Promise<T> {
    const previous = this.context;
    this.context = context;
    try {
      return await fn();
    } finally {
      this.context = previous;
    }
  }
}
