/**
 * Telemetry Export
 * 
 * Structured event export for external observability.
 */

export interface TelemetryEvent {
  event: string;
  source: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// Export formats
export type ExportFormat = 'json' | 'csv' | 'prometheus';

// Collect common events
export async function collectTelemetry(): Promise<{
  events: TelemetryEvent[];
  summary: Record<string, number>;
}> {
  const events: TelemetryEvent[] = [];
  
  // Curator audit
  try {
    const { getStats } = await import('@aether/curator-audit');
    const audit = await getStats();
    events.push({
      event: 'curator.audit',
      source: 'curator-audit',
      timestamp: Date.now(),
      data: audit,
    });
  } catch {}
  
  // Metrics
  try {
    const { snapshot } = await import('@aether/metrics');
    const metrics = snapshot();
    events.push({
      event: 'metrics.snapshot',
      source: 'metrics',
      timestamp: Date.now(),
      data: { counters: Object.keys(metrics.counters || {}).length },
    });
  } catch {}
  
  // Lessons
  try {
    const { getPatternConfidences } = await import('@aether/lessons');
    const patterns = await getPatternConfidences();
    events.push({
      event: 'lessons.patterns',
      source: 'lessons',
      timestamp: Date.now(),
      data: { count: Object.keys(patterns || {}).length },
    });
  } catch {}
  
  // Workflows
  try {
    const { listWorkflows } = await import('@aether/workflow');
    const workflows = listWorkflows();
    events.push({
      event: 'workflows.list',
      source: 'workflow',
      timestamp: Date.now(),
      data: { count: workflows.length },
    });
  } catch {}
  
  const summary: Record<string, number> = {};
  for (const event of events) {
    summary[event.event] = (summary[event.event] || 0) + 1;
  }
  
  return { events, summary };
}

// Export as Prometheus format
export function exportPrometheus(events: TelemetryEvent[]): string {
  const lines: string[] = [];
  
  for (const event of events) {
    const labels = Object.entries(event.data)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    lines.push(`aether_${event.event}{${labels}} 1`);
  }
  
  return lines.join('\n');
}

// Export as CSV
export function exportCSV(events: TelemetryEvent[]): string {
  const header = 'event,source,timestamp';
  const rows = events.map(e => `${e.event},${e.source},${e.timestamp}`);
  
  return [header, ...rows].join('\n');
}