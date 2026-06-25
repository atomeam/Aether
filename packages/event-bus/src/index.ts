/**
 * @aether/event-bus - Event Bus
 */

export class EventBus {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, listener: Function): void {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }
  
  emit(event: string, data: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }
  
  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

export const eventBus = new EventBus();