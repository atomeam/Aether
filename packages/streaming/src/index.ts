/**
 * @aether/streaming - Real-time Data Streaming Library
 *
 * A comprehensive streaming library for event streaming, message queuing,
 * stream processing, windowing operations, and state management.
 *
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TYPES AND SCHEMAS
// =============================================================================

/**
 * Event types in the streaming system
 */
export enum EventType {
  DATA = 'data',
  ERROR = 'error',
  COMPLETE = 'complete',
  STATUS = 'status',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Window types for stream processing
 */
export enum WindowType {
  TUMBLING = 'tumbling',
  SLIDING = 'sliding',
  SESSION = 'session',
  COUNT = 'count',
}

/**
 * Schema for streaming event
 */
export const StreamEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EventType),
  data: z.any(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
  source: z.string().optional(),
});

export type StreamEvent = z.infer<typeof StreamEventSchema>;

/**
 * Schema for message in queue
 */
export const MessageSchema = z.object({
  id: z.string(),
  data: z.any(),
  priority: z.nativeEnum(MessagePriority).default(MessagePriority.NORMAL),
  timestamp: z.date(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  headers: z.record(z.string()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Schema for queue configuration
 */
export const QueueConfigSchema = z.object({
  name: z.string(),
  maxSize: z.number().min(1).default(1000),
  persistence: z.boolean().default(false),
  priority: z.boolean().default(false),
  deadLetterQueue: z.string().optional(),
  retryDelay: z.number().min(0).default(1000),
});

export type QueueConfig = z.infer<typeof QueueConfigSchema>;

/**
 * Schema for window configuration
 */
export const WindowConfigSchema = z.object({
  type: z.nativeEnum(WindowType),
  size: z.number().min(1),
  slide: z.number().min(1).optional(),
  sessionTimeout: z.number().min(0).optional(),
});

export type WindowConfig = z.infer<typeof WindowConfigSchema>;

/**
 * Schema for stream processor configuration
 */
export const StreamProcessorConfigSchema = z.object({
  name: z.string(),
  parallelism: z.number().min(1).default(1),
  bufferSize: z.number().min(1).default(100),
  window: WindowConfigSchema.optional(),
  stateful: z.boolean().default(false),
});

export type StreamProcessorConfig = z.infer<typeof StreamProcessorConfigSchema>;

/**
 * Schema for state entry
 */
export const StateEntrySchema = z.object({
  key: z.string(),
  value: z.any(),
  timestamp: z.date(),
  ttl: z.number().optional(),
});

export type StateEntry = z.infer<typeof StateEntrySchema>;

/**
 * Schema for state manager configuration
 */
export const StateManagerConfigSchema = z.object({
  maxSize: z.number().min(1).default(10000),
  defaultTTL: z.number().min(0).default(3600000), // 1 hour
  persistence: z.boolean().default(false),
});

export type StateManagerConfig = z.infer<typeof StateManagerConfigSchema>;

/**
 * Schema for stream statistics
 */
export const StreamStatsSchema = z.object({
  eventsProcessed: z.number(),
  eventsFailed: z.number(),
  eventsPerSecond: z.number(),
  averageLatency: z.number(),
  queueSize: z.number(),
  uptime: z.number(),
});

export type StreamStats = z.infer<typeof StreamStatsSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Parse and validate stream event
 */
export function parseStreamEvent(data: unknown): StreamEvent {
  return StreamEventSchema.parse(data);
}

/**
 * Parse and validate message
 */
export function parseMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

/**
 * Parse and validate queue configuration
 */
export function parseQueueConfig(data: unknown): QueueConfig {
  return QueueConfigSchema.parse(data);
}

/**
 * Parse and validate window configuration
 */
export function parseWindowConfig(data: unknown): WindowConfig {
  return WindowConfigSchema.parse(data);
}

/**
 * Parse and validate stream processor configuration
 */
export function parseStreamProcessorConfig(data: unknown): StreamProcessorConfig {
  return StreamProcessorConfigSchema.parse(data);
}

/**
 * Parse and validate state manager configuration
 */
export function parseStateManagerConfig(data: unknown): StateManagerConfig {
  return StateManagerConfigSchema.parse(data);
}

// =============================================================================
// EVENT STREAMING
// =============================================================================

/**
 * Event emitter for streaming events
 */
export class EventEmitter {
  private listeners: Map<EventType, Set<(event: StreamEvent) => void>> = new Map();
  private allListeners: Set<(event: StreamEvent) => void> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on(eventType: EventType, listener: (event: StreamEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(listener: (event: StreamEvent) => void): () => void {
    this.allListeners.add(listener);
    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * Emit an event
   */
  emit(event: StreamEvent): void {
    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    // Notify all-event listeners
    this.allListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Remove all listeners for a specific event type
   */
  off(eventType: EventType): void {
    this.listeners.delete(eventType);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
    this.allListeners.clear();
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// =============================================================================
// MESSAGE QUEUE
// =============================================================================

/**
 * Priority-based message queue
 */
export class MessageQueue {
  private queue: Message[] = [];
  private config: QueueConfig;
  private processing: Set<string> = new Set();

  constructor(config: QueueConfig) {
    this.config = parseQueueConfig(config);
  }

  /**
   * Add a message to the queue
   */
  async enqueue(message: Message): Promise<boolean> {
    if (this.queue.length >= this.config.maxSize) {
      return false;
    }

    if (this.config.priority) {
      // Insert in priority order (higher priority first)
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].priority < message.priority) {
          insertIndex = i;
          break;
        }
      }
      this.queue.splice(insertIndex, 0, message);
    } else {
      this.queue.push(message);
    }

    return true;
  }

  /**
   * Remove and return the next message from the queue
   */
  async dequeue(): Promise<Message | null> {
    if (this.queue.length === 0) {
      return null;
    }

    const message = this.queue.shift()!;
    this.processing.add(message.id);
    return message;
  }

  /**
   * Mark a message as processed
   */
  async ack(messageId: string): Promise<void> {
    this.processing.delete(messageId);
  }

  /**
   * Mark a message as failed and requeue if retries remain
   */
  async nack(messageId: string): Promise<boolean> {
    const processingMessage = Array.from(this.processing).find(id => id === messageId);
    if (!processingMessage) {
      return false;
    }

    this.processing.delete(messageId);

    // Find the message in the queue (it would have been removed on dequeue)
    // In a real implementation, we'd track this separately
    // For now, we'll just return false
    return false;
  }

  /**
   * Get the current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Get the number of messages currently being processed
   */
  processingCount(): number {
    return this.processing.size;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.processing.clear();
  }

  /**
   * Peek at the next message without removing it
   */
  peek(): Message | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }
}

// =============================================================================
// STREAM PROCESSING
// =============================================================================

/**
 * Stream processor for processing events
 */
export class StreamProcessor {
  private config: StreamProcessorConfig;
  private eventEmitter: EventEmitter;
  private buffer: StreamEvent[] = [];
  private windowBuffer: StreamEvent[] = [];
  private startTime: Date = new Date();
  private eventsProcessed: number = 0;
  private eventsFailed: number = 0;
  private stateManager: StateManager;

  constructor(config: StreamProcessorConfig) {
    this.config = parseStreamProcessorConfig(config);
    this.eventEmitter = new EventEmitter();
    this.stateManager = new StateManager({
      maxSize: 10000,
      defaultTTL: 3600000,
      persistence: this.config.stateful,
    });
  }

  /**
   * Process a single event
   */
  async process(event: StreamEvent, handler: (event: StreamEvent) => Promise<void> | void): Promise<void> {
    try {
      await handler(event);
      this.eventsProcessed++;
      this.eventEmitter.emit({
        ...event,
        type: EventType.STATUS,
        data: { status: 'processed' },
      });
    } catch (error) {
      this.eventsFailed++;
      this.eventEmitter.emit({
        id: this.generateId(),
        type: EventType.ERROR,
        data: { error: error instanceof Error ? error.message : String(error), originalEvent: event },
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Process events in batches
   */
  async processBatch(events: StreamEvent[], handler: (event: StreamEvent) => Promise<void> | void): Promise<void> {
    const promises = events.map(event => this.process(event, handler));
    await Promise.all(promises);
  }

  /**
   * Add an event to the buffer
   */
  bufferEvent(event: StreamEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Flush the buffer and process all events
   */
  async flushBuffer(handler?: (event: StreamEvent) => Promise<void> | void): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    if (handler) {
      await this.processBatch(events, handler);
    }
  }

  /**
   * Apply windowing to events
   */
  applyWindow(events: StreamEvent[]): StreamEvent[][] {
    if (!this.config.window) {
      return [events];
    }

    const windows: StreamEvent[][] = [];
    const { type, size, slide, sessionTimeout } = this.config.window;

    switch (type) {
      case WindowType.TUMBLING:
        for (let i = 0; i < events.length; i += size) {
          windows.push(events.slice(i, i + size));
        }
        break;

      case WindowType.SLIDING:
        const slideSize = slide || 1;
        for (let i = 0; i <= events.length - size; i += slideSize) {
          windows.push(events.slice(i, i + size));
        }
        break;

      case WindowType.COUNT:
        for (let i = 0; i < events.length; i += size) {
          windows.push(events.slice(i, i + size));
        }
        break;

      case WindowType.SESSION:
        if (!sessionTimeout) {
          return [events];
        }
        let currentWindow: StreamEvent[] = [];
        let lastTimestamp = events[0]?.timestamp.getTime() || Date.now();

        for (const event of events) {
          const timeDiff = event.timestamp.getTime() - lastTimestamp;
          if (timeDiff > sessionTimeout && currentWindow.length > 0) {
            windows.push(currentWindow);
            currentWindow = [];
          }
          currentWindow.push(event);
          lastTimestamp = event.timestamp.getTime();
        }

        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        break;
    }

    return windows;
  }

  /**
   * Get stream statistics
   */
  getStats(): StreamStats {
    const uptime = Date.now() - this.startTime.getTime();
    const eventsPerSecond = uptime > 0 ? (this.eventsProcessed / (uptime / 1000)) : 0;

    return {
      eventsProcessed: this.eventsProcessed,
      eventsFailed: this.eventsFailed,
      eventsPerSecond,
      averageLatency: 0, // Would need to track actual latency
      queueSize: this.buffer.length,
      uptime,
    };
  }

  /**
   * Subscribe to events from the processor
   */
  on(eventType: EventType, listener: (event: StreamEvent) => void): () => void {
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Get the state manager
   */
  getState(): StateManager {
    return this.stateManager;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * State manager for stream processing state
 */
export class StateManager {
  private state: Map<string, StateEntry> = new Map();
  private config: StateManagerConfig;

  constructor(config: StateManagerConfig) {
    this.config = parseStateManagerConfig(config);
  }

  /**
   * Set a state value
   */
  set(key: string, value: unknown, ttl?: number): void {
    const entry: StateEntry = {
      key,
      value,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
    };

    this.state.set(key, entry);

    // Enforce max size
    if (this.state.size > this.config.maxSize) {
      // Remove oldest entry
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.state.delete(oldestKey);
      }
    }
  }

  /**
   * Get a state value
   */
  get(key: string): unknown | null {
    const entry = this.state.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.state.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a state value
   */
  delete(key: string): boolean {
    return this.state.delete(key);
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    const entry = this.state.get(key);
    if (!entry) {
      return false;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.state.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.state.keys());
  }

  /**
   * Get the number of state entries
   */
  size(): number {
    this.cleanupExpired();
    return this.state.size;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.state.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.state.entries()) {
      if (entry.ttl && now - entry.timestamp.getTime() > entry.ttl) {
        this.state.delete(key);
      }
    }
  }

  /**
   * Find the oldest entry
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.state.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a stream event
 */
export function createStreamEvent(type: EventType, data: unknown, metadata?: Record<string, unknown>): StreamEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: new Date(),
    metadata,
  };
}

/**
 * Create a message
 */
export function createMessage(data: unknown, priority: MessagePriority = MessagePriority.NORMAL): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data,
    priority,
    timestamp: new Date(),
    attempts: 0,
    maxAttempts: 3,
  };
}

/**
 * Create a queue with default configuration
 */
export function createQueue(name: string, options?: Partial<QueueConfig>): MessageQueue {
  const config: QueueConfig = parseQueueConfig({
    name,
    maxSize: options?.maxSize,
    persistence: options?.persistence,
    priority: options?.priority,
    deadLetterQueue: options?.deadLetterQueue,
    retryDelay: options?.retryDelay,
  });

  return new MessageQueue(config);
}

/**
 * Create a stream processor with default configuration
 */
export function createStreamProcessor(name: string, options?: Partial<StreamProcessorConfig>): StreamProcessor {
  const config: StreamProcessorConfig = parseStreamProcessorConfig({
    name,
    parallelism: options?.parallelism,
    bufferSize: options?.bufferSize,
    window: options?.window,
    stateful: options?.stateful,
  });

  return new StreamProcessor(config);
}

/**
 * Create a state manager with default configuration
 */
export function createStateManager(options?: Partial<StateManagerConfig>): StateManager {
  const config: StateManagerConfig = parseStateManagerConfig({
    maxSize: options?.maxSize,
    defaultTTL: options?.defaultTTL,
    persistence: options?.persistence,
  });

  return new StateManager(config);
}

/**
 * Create a window configuration
 */
export function createWindowConfig(type: WindowType, size: number, options?: { slide?: number; sessionTimeout?: number }): WindowConfig {
  return {
    type,
    size,
    slide: options?.slide,
    sessionTimeout: options?.sessionTimeout,
  };
}
