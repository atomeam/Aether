/**
 * @aether/event-emitter - Event Emitter
 */

export type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();
  
  on(event: string, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    return () => this.off(event, handler);
  }
  
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }
  
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }
  
  once(event: string, handler: EventHandler): () => void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }
  
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

export const eventEmitter = new EventEmitter();