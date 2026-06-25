/**
 * @aether/pub-sub - Pub/Sub System
 */

export class PubSub {
  private subscribers: Map<string, Set<Function>> = new Map();
  
  subscribe(topic: string, callback: Function): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(callback);
    return () => this.unsubscribe(topic, callback);
  }
  
  publish(topic: string, data: any): void {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }
  
  unsubscribe(topic: string, callback: Function): void {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }
}

export const pubSub = new PubSub();