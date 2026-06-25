/**
 * Cloudflare-Native Distributed Tracing
 * Uses Cloudflare D1 for persistence instead of JSON files
 * Provides strong consistency, SQL queries, and serverless compatibility
 */

const { persistence } = require('./cloudflare-persistence');

class CloudflareDistributedTracing {
  constructor() {
    this.traceId = null;
    this.spanId = null;
    this.parentSpanId = null;
    
    this.config = {
      sampleRate: 1.0,
      maxTraceAge: 3600000,
      maxSpansPerTrace: 1000
    };
    
    this.stats = {
      totalTraces: 0,
      totalSpans: 0,
      totalErrors: 0,
      sampledTraces: 0
    };
  }

  // Initialize D1 schema
  async initializeSchema() {
    const schema = `
      CREATE TABLE IF NOT EXISTS traces (
        id TEXT PRIMARY KEY,
        operation_name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        status TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE IF NOT EXISTS spans (
        id TEXT PRIMARY KEY,
        trace_id TEXT NOT NULL,
        parent_span_id TEXT,
        operation_name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        status TEXT NOT NULL,
        metadata TEXT,
        error_message TEXT,
        error_stack TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id);
      CREATE INDEX IF NOT EXISTS idx_spans_parent_span_id ON spans(parent_span_id);
    `;
    
    try {
      await persistence.d1Run(schema);
      console.log('✅ D1 schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize D1 schema:', error.message);
    }
  }

  // Start a new trace
  async startTrace(operationName, metadata = {}) {
    if (Math.random() > this.config.sampleRate) {
      console.log(`🔍 Trace sampled out (rate: ${this.config.sampleRate})`);
      return null;
    }
    
    this.traceId = this.generateTraceId();
    this.spanId = this.generateSpanId();
    this.parentSpanId = null;
    
    const trace = {
      id: this.traceId,
      operation_name: operationName,
      start_time: Math.floor(Date.now() / 1000),
      status: 'active',
      metadata: JSON.stringify(metadata)
    };
    
    try {
      await persistence.d1Run(
        'INSERT INTO traces (id, operation_name, start_time, status, metadata) VALUES (?, ?, ?, ?, ?)',
        [trace.id, trace.operation_name, trace.start_time, trace.status, trace.metadata]
      );
      
      this.stats.totalTraces++;
      this.stats.sampledTraces++;
      
      console.log(`🔍 Started trace: ${this.traceId} for ${operationName}`);
      
      return this.traceId;
    } catch (error) {
      console.error('❌ Failed to start trace:', error.message);
      return null;
    }
  }

  // Start a span
  async startSpan(operationName, metadata = {}) {
    if (!this.traceId) {
      console.warn('⚠️  No active trace - span not started');
      return null;
    }
    
    const parentSpanId = this.spanId;
    this.spanId = this.generateSpanId();
    
    const span = {
      id: this.spanId,
      trace_id: this.traceId,
      parent_span_id: parentSpanId,
      operation_name: operationName,
      start_time: Math.floor(Date.now() / 1000),
      status: 'active',
      metadata: JSON.stringify(metadata)
    };
    
    try {
      await persistence.d1Run(
        'INSERT INTO spans (id, trace_id, parent_span_id, operation_name, start_time, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [span.id, span.trace_id, span.parent_span_id, span.operation_name, span.start_time, span.status, span.metadata]
      );
      
      this.stats.totalSpans++;
      
      console.log(`🔍 Started span: ${this.spanId} for ${operationName} (parent: ${parentSpanId})`);
      
      return this.spanId;
    } catch (error) {
      console.error('❌ Failed to start span:', error.message);
      return null;
    }
  }

  // End a span
  async endSpan(spanId, error = null) {
    const endTime = Math.floor(Date.now() / 1000);
    
    try {
      const span = await persistence.d1ExecuteFirst(
        'SELECT * FROM spans WHERE id = ?',
        [spanId]
      );
      
      if (!span) {
        console.warn(`⚠️  Span not found: ${spanId}`);
        return;
      }
      
      const duration = endTime - span.start_time;
      const status = error ? 'error' : 'completed';
      
      await persistence.d1Run(
        'UPDATE spans SET end_time = ?, duration = ?, status = ?, error_message = ?, error_stack = ? WHERE id = ?',
        [endTime, duration, status, error?.message, error?.stack, spanId]
      );
      
      if (error) {
        this.stats.totalErrors++;
      }
      
      // Update parent span ID to current span
      this.spanId = span.parent_span_id;
      
      console.log(`🔍 Ended span: ${spanId} (${duration}s) - ${status}`);
    } catch (error) {
      console.error('❌ Failed to end span:', error.message);
    }
  }

  // End the trace
  async endTrace() {
    if (!this.traceId) {
      console.warn('⚠️  No active trace to end');
      return;
    }
    
    const endTime = Math.floor(Date.now() / 1000);
    
    try {
      const trace = await persistence.d1ExecuteFirst(
        'SELECT * FROM traces WHERE id = ?',
        [this.traceId]
      );
      
      if (trace) {
        const duration = endTime - trace.start_time;
        
        await persistence.d1Run(
          'UPDATE traces SET end_time = ?, duration = ?, status = ? WHERE id = ?',
          [endTime, duration, 'completed', this.traceId]
        );
        
        console.log(`🔍 Ended trace: ${this.traceId} (${duration}s)`);
      }
    } catch (error) {
      console.error('❌ Failed to end trace:', error.message);
    }
    
    this.traceId = null;
    this.spanId = null;
    this.parentSpanId = null;
  }

  // Get trace by ID
  async getTrace(traceId) {
    try {
      const trace = await persistence.d1ExecuteFirst(
        'SELECT * FROM traces WHERE id = ?',
        [traceId]
      );
      
      if (!trace) {
        return null;
      }
      
      const spans = await persistence.d1Execute(
        'SELECT * FROM spans WHERE trace_id = ? ORDER BY start_time',
        [traceId]
      );
      
      return {
        ...trace,
        metadata: JSON.parse(trace.metadata || '{}'),
        spans: spans.results.map(span => ({
          ...span,
          metadata: JSON.parse(span.metadata || '{}')
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get trace:', error.message);
      return null;
    }
  }

  // Get trace statistics
  async getTraceStatistics(traceId) {
    try {
      const trace = await this.getTrace(traceId);
      
      if (!trace) {
        return null;
      }
      
      const spans = trace.spans || [];
      const completedSpans = spans.filter(s => s.status === 'completed');
      const errorSpans = spans.filter(s => s.status === 'error');
      
      return {
        traceId: trace.id,
        operationName: trace.operation_name,
        duration: trace.duration,
        spanCount: spans.length,
        completedSpans: completedSpans.length,
        errorSpans: errorSpans.length,
        errorRate: spans.length > 0 ? (errorSpans.length / spans.length * 100).toFixed(2) : 0,
        metadata: trace.metadata
      };
    } catch (error) {
      console.error('❌ Failed to get trace statistics:', error.message);
      return null;
    }
  }

  // Get system statistics
  getSystemStatistics() {
    return {
      ...this.stats,
      activeTraces: this.traceId ? 1 : 0,
      config: this.config
    };
  }

  // Clear old traces
  async clearOldTraces(maxAgeMs = this.config.maxTraceAge) {
    console.log(`🧹 Clearing traces older than ${maxAgeMs}ms...`);
    
    const cutoffTime = Math.floor((Date.now() - maxAgeMs) / 1000);
    
    try {
      const result = await persistence.d1Run(
        'DELETE FROM spans WHERE start_time < ?',
        [cutoffTime]
      );
      
      const traceResult = await persistence.d1Run(
        'DELETE FROM traces WHERE start_time < ?',
        [cutoffTime]
      );
      
      console.log(`🧹 Cleared ${result.meta.changes} spans and ${traceResult.meta.changes} traces`);
      
      return result.meta.changes + traceResult.meta.changes;
    } catch (error) {
      console.error('❌ Failed to clear old traces:', error.message);
      return 0;
    }
  }

  // Generate trace ID
  generateTraceId() {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate span ID
  generateSpanId() {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  CloudflareDistributedTracing
};
