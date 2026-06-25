/**
 * @aether/tracing - Distributed Tracing
 */

export class Tracing {
  startSpan(name: string): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36)}`;
    console.log(`[TRACE] Start: ${name} (${spanId})`);
    return spanId;
  }
  
  endSpan(spanId: string): void {
    console.log(`[TRACE] End: ${spanId}`);
  }
}

export const tracing = new Tracing();