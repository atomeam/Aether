/**
 * Distributed Tracing System
 * Follow one request across services/agents with trace context propagation
 */

const fs = require('fs');
const path = require('path');

class DistributedTracing {
  constructor() {
    this.traces = new Map();
    this.activeSpans = new Map();
    this.traceId = null;
    this.spanId = null;
    this.parentSpanId = null;
    
    this.config = {
      sampleRate: 1.0, // 100% sampling
      maxTraceAge: 3600000, // 1 hour
      maxSpansPerTrace: 1000
    };
    
    this.stats = {
      totalTraces: 0,
      totalSpans: 0,
      totalErrors: 0,
      sampledTraces: 0
    };
    
    this.dataPath = path.resolve(__dirname, 'traces.json');
    this.loadTraces();
  }

  // Start a new trace
  startTrace(operationName, metadata = {}) {
    if (Math.random() > this.config.sampleRate) {
      console.log(`🔍 Trace sampled out (rate: ${this.config.sampleRate})`);
      return null;
    }
    
    this.traceId = this.generateTraceId();
    this.spanId = this.generateSpanId();
    this.parentSpanId = null;
    
    const trace = {
      traceId: this.traceId,
      operationName,
      startTime: Date.now(),
      spans: [],
      metadata,
      status: 'active'
    };
    
    this.traces.set(this.traceId, trace);
    this.activeSpans.set(this.spanId, {
      spanId: this.spanId,
      parentSpanId: null,
      operationName,
      startTime: Date.now(),
      traceId: this.traceId
    });
    
    this.stats.totalTraces++;
    this.stats.sampledTraces++;
    
    console.log(`🔍 Started trace: ${this.traceId} for ${operationName}`);
    
    return this.traceId;
  }

  // Start a span
  startSpan(operationName, metadata = {}) {
    if (!this.traceId) {
      console.warn('⚠️  No active trace - span not started');
      return null;
    }
    
    const parentSpanId = this.spanId;
    this.spanId = this.generateSpanId();
    
    const span = {
      spanId: this.spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      metadata,
      traceId: this.traceId,
      status: 'active'
    };
    
    this.activeSpans.set(this.spanId, span);
    
    const trace = this.traces.get(this.traceId);
    if (trace) {
      trace.spans.push(span);
    }
    
    this.stats.totalSpans++;
    
    console.log(`🔍 Started span: ${this.spanId} for ${operationName} (parent: ${parentSpanId})`);
    
    return this.spanId;
  }

  // End a span
  endSpan(spanId, error = null) {
    const span = this.activeSpans.get(spanId);
    
    if (!span) {
      console.warn(`⚠️  Span not found: ${spanId}`);
      return;
    }
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = error ? 'error' : 'completed';
    
    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
        code: error.code
      };
      this.stats.totalErrors++;
    }
    
    this.activeSpans.delete(spanId);
    
    // Update parent span ID to current span
    this.spanId = span.parentSpanId;
    
    console.log(`🔍 Ended span: ${spanId} (${span.duration}ms) - ${span.status}`);
  }

  // End the trace
  endTrace() {
    if (!this.traceId) {
      console.warn('⚠️  No active trace to end');
      return;
    }
    
    const trace = this.traces.get(this.traceId);
    
    if (trace) {
      trace.endTime = Date.now();
      trace.duration = trace.endTime - trace.startTime;
      trace.status = 'completed';
      
      // End any remaining active spans
      this.activeSpans.forEach((span, spanId) => {
        this.endSpan(spanId);
      });
      
      console.log(`🔍 Ended trace: ${this.traceId} (${trace.duration}ms) - ${trace.spans.length} spans`);
    }
    
    this.traceId = null;
    this.spanId = null;
    this.parentSpanId = null;
  }

  // Get trace context for propagation
  getTraceContext() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId
    };
  }

  // Set trace context from incoming request
  setTraceContext(context) {
    this.traceId = context.traceId;
    this.spanId = context.spanId;
    this.parentSpanId = context.parentSpanId;
    
    console.log(`🔍 Received trace context: ${this.traceId}`);
  }

  // Get trace by ID
  getTrace(traceId) {
    return this.traces.get(traceId);
  }

  // Get all traces
  getAllTraces() {
    return Array.from(this.traces.values());
  }

  // Get trace statistics
  getTraceStatistics(traceId) {
    const trace = this.traces.get(traceId);
    
    if (!trace) {
      return null;
    }
    
    const spans = trace.spans || [];
    const completedSpans = spans.filter(s => s.status === 'completed');
    const errorSpans = spans.filter(s => s.status === 'error');
    
    return {
      traceId: trace.traceId,
      operationName: trace.operationName,
      duration: trace.duration,
      spanCount: spans.length,
      completedSpans: completedSpans.length,
      errorSpans: errorSpans.length,
      errorRate: spans.length > 0 ? (errorSpans.length / spans.length * 100).toFixed(2) : 0,
      metadata: trace.metadata
    };
  }

  // Get system statistics
  getSystemStatistics() {
    return {
      ...this.stats,
      activeTraces: this.traces.size,
      activeSpans: this.activeSpans.size,
      config: this.config
    };
  }

  // Clear old traces
  clearOldTraces(maxAgeMs = this.config.maxTraceAge) {
    console.log(`🧹 Clearing traces older than ${maxAgeMs}ms...`);
    
    const cutoffTime = Date.now() - maxAgeMs;
    let cleared = 0;
    
    this.traces.forEach((trace, traceId) => {
      if (trace.startTime < cutoffTime) {
        this.traces.delete(traceId);
        cleared++;
      }
    });
    
    console.log(`🧹 Cleared ${cleared} old traces`);
    this.saveTraces();
    
    return cleared;
  }

  // Generate trace ID
  generateTraceId() {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate span ID
  generateSpanId() {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load traces
  loadTraces() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Reconstruct Map from object
      this.traces = new Map();
      Object.entries(parsed.traces || {}).forEach(([id, trace]) => {
        this.traces.set(id, trace);
      });
      
      this.stats = parsed.stats || this.stats;
    }
  }

  // Save traces
  saveTraces() {
    if (this.traces.size > 1000) {
      // Keep only the 1000 most recent traces
      const sortedTraces = Array.from(this.traces.entries())
        .sort((a, b) => b[1].startTime - a[1].startTime)
        .slice(0, 1000);
      
      this.traces = new Map(sortedTraces);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify({
      traces: Object.fromEntries(this.traces),
      stats: this.stats
    }, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tracing = new DistributedTracing();

  switch (command) {
    case 'start':
      const operationName = args[1] || 'test-operation';
      const traceId = tracing.startTrace(operationName);
      console.log(`🔍 Trace started: ${traceId}`);
      break;

    case 'span':
      if (args[1]) {
        const spanId = tracing.startSpan(args[1]);
        console.log(`🔍 Span started: ${spanId}`);
      } else {
        console.error('Usage: node distributed-tracing.js span <operation-name>');
      }
      break;

    case 'end':
      tracing.endTrace();
      console.log('🔍 Trace ended');
      break;

    case 'get':
      if (args[1]) {
        const stats = tracing.getTraceStatistics(args[1]);
        console.log(`📊 Trace Statistics for ${args[1]}:`);
        console.log(JSON.stringify(stats, null, 2));
      } else {
        const allTraces = tracing.getAllTraces();
        console.log('📊 All Traces:');
        console.log(JSON.stringify(allTraces, null, 2));
      }
      break;

    case 'stats':
      const stats = tracing.getSystemStatistics();
      console.log('📊 System Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'clear':
      const maxAge = args[1] ? parseInt(args[1]) : 3600000;
      const cleared = tracing.clearOldTraces(maxAge);
      console.log(`🧹 Cleared ${cleared} traces`);
      break;

    default:
      console.log('🔍 Distributed Tracing System');
      console.log('');
      console.log('Commands:');
      console.log('  start  - Start a new trace');
      console.log('  span   - Start a span');
      console.log('  end    - End the current trace');
      console.log('  get    - Get trace statistics');
      console.log('  stats  - Get system statistics');
      console.log('  clear  - Clear old traces');
      console.log('');
      console.log('Examples:');
      console.log('  node distributed-tracing.js start my-operation');
      console.log('  node distributed-tracing.js span sub-operation');
      console.log('  node distributed-tracing.js end');
      console.log('  node distributed-tracing.js get <trace-id>');
      console.log('  node distributed-tracing.js stats');
      console.log('  node distributed-tracing.js clear 3600000');
      console.log('');
      console.log('Programmatic Usage:');
      console.log('  const tracing = new DistributedTracing();');
      console.log('  const traceId = tracing.startTrace("operation");');
      console.log('  const spanId = tracing.startSpan("sub-operation");');
      console.log('  tracing.endSpan(spanId);');
      console.log('  tracing.endTrace();');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  DistributedTracing
};
