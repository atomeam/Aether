/**
 * Tests for @aether/streaming
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EventType,
  MessagePriority,
  WindowType,
  parseStreamEvent,
  parseMessage,
  parseQueueConfig,
  parseWindowConfig,
  parseStreamProcessorConfig,
  parseStateManagerConfig,
  EventEmitter,
  MessageQueue,
  StreamProcessor,
  StateManager,
  createStreamEvent,
  createMessage,
  createQueue,
  createStreamProcessor,
  createStateManager,
  createWindowConfig,
  type StreamEvent,
  type Message,
  type QueueConfig,
  type StreamProcessorConfig,
  type StateManagerConfig,
} from './index';

describe('@aether/streaming', () => {
  describe('Schema Validation', () => {
    it('should validate stream event', () => {
      const event = {
        id: 'test-id',
        type: EventType.DATA,
        data: { value: 123 },
        timestamp: new Date(),
        metadata: { source: 'test' },
      };

      const result = parseStreamEvent(event);
      expect(result.type).toBe(EventType.DATA);
      expect(result.data).toEqual({ value: 123 });
    });

    it('should validate message', () => {
      const message = {
        id: 'test-id',
        data: { value: 123 },
        priority: MessagePriority.HIGH,
        timestamp: new Date(),
        attempts: 0,
        maxAttempts: 3,
      };

      const result = parseMessage(message);
      expect(result.priority).toBe(MessagePriority.HIGH);
    });

    it('should validate queue config', () => {
      const config = {
        name: 'test-queue',
        maxSize: 500,
        priority: true,
      };

      const result = parseQueueConfig(config);
      expect(result.name).toBe('test-queue');
      expect(result.priority).toBe(true);
    });

    it('should validate window config', () => {
      const config = {
        type: WindowType.TUMBLING,
        size: 100,
        slide: 50,
      };

      const result = parseWindowConfig(config);
      expect(result.type).toBe(WindowType.TUMBLING);
      expect(result.size).toBe(100);
    });

    it('should validate stream processor config', () => {
      const config = {
        name: 'test-processor',
        parallelism: 4,
        bufferSize: 200,
      };

      const result = parseStreamProcessorConfig(config);
      expect(result.name).toBe('test-processor');
      expect(result.parallelism).toBe(4);
    });

    it('should validate state manager config', () => {
      const config = {
        maxSize: 5000,
        defaultTTL: 7200000,
        persistence: true,
      };

      const result = parseStateManagerConfig(config);
      expect(result.maxSize).toBe(5000);
      expect(result.persistence).toBe(true);
    });
  });

  describe('EventEmitter', () => {
    it('should subscribe to event type', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();

      emitter.on(EventType.DATA, listener);
      emitter.emit(createStreamEvent(EventType.DATA, { value: 123 }));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to all events', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();

      emitter.onAll(listener);
      emitter.emit(createStreamEvent(EventType.DATA, { value: 123 }));
      emitter.emit(createStreamEvent(EventType.ERROR, { error: 'test' }));

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe from event type', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();

      const unsubscribe = emitter.on(EventType.DATA, listener);
      unsubscribe();
      emitter.emit(createStreamEvent(EventType.DATA, { value: 123 }));

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const emitter = new EventEmitter();
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      emitter.on(EventType.DATA, errorListener);
      emitter.on(EventType.DATA, normalListener);
      emitter.emit(createStreamEvent(EventType.DATA, { value: 123 }));

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(1);
    });

    it('should get listener count', () => {
      const emitter = new EventEmitter();
      emitter.on(EventType.DATA, vi.fn());
      emitter.on(EventType.DATA, vi.fn());

      expect(emitter.listenerCount(EventType.DATA)).toBe(2);
    });

    it('should remove all listeners for event type', () => {
      const emitter = new EventEmitter();
      emitter.on(EventType.DATA, vi.fn());
      emitter.on(EventType.DATA, vi.fn());

      emitter.off(EventType.DATA);
      expect(emitter.listenerCount(EventType.DATA)).toBe(0);
    });

    it('should remove all listeners', () => {
      const emitter = new EventEmitter();
      emitter.on(EventType.DATA, vi.fn());
      emitter.on(EventType.ERROR, vi.fn());
      emitter.onAll(vi.fn());

      emitter.removeAllListeners();
      expect(emitter.listenerCount(EventType.DATA)).toBe(0);
      expect(emitter.listenerCount(EventType.ERROR)).toBe(0);
    });
  });

  describe('MessageQueue', () => {
    it('should enqueue message', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);
      const message = createMessage({ value: 123 });

      const result = await queue.enqueue(message);
      expect(result).toBe(true);
      expect(queue.size()).toBe(1);
    });

    it('should reject message when queue is full', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue', maxSize: 2 };
      const queue = new MessageQueue(config as QueueConfig);

      await queue.enqueue(createMessage({ value: 1 }));
      await queue.enqueue(createMessage({ value: 2 }));
      const result = await queue.enqueue(createMessage({ value: 3 }));

      expect(result).toBe(false);
    });

    it('should dequeue message', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);
      const message = createMessage({ value: 123 });

      await queue.enqueue(message);
      const dequeued = await queue.dequeue();

      expect(dequeued).not.toBeNull();
      expect(dequeued?.data).toEqual({ value: 123 });
      expect(queue.size()).toBe(0);
    });

    it('should return null when dequeuing empty queue', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);

      const result = await queue.dequeue();
      expect(result).toBeNull();
    });

    it('should handle priority queue', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue', priority: true };
      const queue = new MessageQueue(config as QueueConfig);

      await queue.enqueue(createMessage({ value: 1 }, MessagePriority.LOW));
      await queue.enqueue(createMessage({ value: 2 }, MessagePriority.HIGH));
      await queue.enqueue(createMessage({ value: 3 }, MessagePriority.NORMAL));

      const first = await queue.dequeue();
      const second = await queue.dequeue();
      const third = await queue.dequeue();

      expect(first?.data).toEqual({ value: 2 }); // HIGH
      expect(second?.data).toEqual({ value: 3 }); // NORMAL
      expect(third?.data).toEqual({ value: 1 }); // LOW
    });

    it('should ack message', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);
      const message = createMessage({ value: 123 });

      await queue.enqueue(message);
      const dequeued = await queue.dequeue();
      await queue.ack(dequeued!.id);

      expect(queue.processingCount()).toBe(0);
    });

    it('should peek at next message', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);
      const message = createMessage({ value: 123 });

      await queue.enqueue(message);
      const peeked = queue.peek();

      expect(peeked).not.toBeNull();
      expect(peeked?.data).toEqual({ value: 123 });
      expect(queue.size()).toBe(1); // Should not remove
    });

    it('should clear queue', async () => {
      const config: Partial<QueueConfig> = { name: 'test-queue' };
      const queue = new MessageQueue(config as QueueConfig);

      await queue.enqueue(createMessage({ value: 1 }));
      await queue.enqueue(createMessage({ value: 2 }));
      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.processingCount()).toBe(0);
    });
  });

  describe('StreamProcessor', () => {
    it('should process event', async () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor' };
      const processor = new StreamProcessor(config as StreamProcessorConfig);
      const handler = vi.fn();

      const event = createStreamEvent(EventType.DATA, { value: 123 });
      await processor.process(event, handler);

      expect(handler).toHaveBeenCalledWith(event);
      expect(processor.getStats().eventsProcessed).toBe(1);
    });

    it('should handle processing errors', async () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor' };
      const processor = new StreamProcessor(config as StreamProcessorConfig);
      const handler = vi.fn(() => {
        throw new Error('Processing error');
      });

      const event = createStreamEvent(EventType.DATA, { value: 123 });
      await expect(processor.process(event, handler)).rejects.toThrow('Processing error');
      expect(processor.getStats().eventsFailed).toBe(1);
    });

    it('should process batch of events', async () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor' };
      const processor = new StreamProcessor(config as StreamProcessorConfig);
      const handler = vi.fn();

      const events = [
        createStreamEvent(EventType.DATA, { value: 1 }),
        createStreamEvent(EventType.DATA, { value: 2 }),
        createStreamEvent(EventType.DATA, { value: 3 }),
      ];

      await processor.processBatch(events, handler);

      expect(handler).toHaveBeenCalledTimes(3);
      expect(processor.getStats().eventsProcessed).toBe(3);
    });

    it('should buffer events', () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor', bufferSize: 3 };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 1 }));
      processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 2 }));

      expect(processor.getStats().queueSize).toBe(2);
    });

    it('should flush buffer when full', () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor', bufferSize: 2 };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 1 }));
      processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 2 }));

      expect(processor.getStats().queueSize).toBe(0);
    });

    it('should apply tumbling window', () => {
      const config: Partial<StreamProcessorConfig> = {
        name: 'test-processor',
        window: { type: WindowType.TUMBLING, size: 2 },
      };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const events = [
        createStreamEvent(EventType.DATA, { value: 1 }),
        createStreamEvent(EventType.DATA, { value: 2 }),
        createStreamEvent(EventType.DATA, { value: 3 }),
        createStreamEvent(EventType.DATA, { value: 4 }),
      ];

      const windows = processor.applyWindow(events);

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveLength(2);
      expect(windows[1]).toHaveLength(2);
    });

    it('should apply sliding window', () => {
      const config: Partial<StreamProcessorConfig> = {
        name: 'test-processor',
        window: { type: WindowType.SLIDING, size: 2, slide: 1 },
      };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const events = [
        createStreamEvent(EventType.DATA, { value: 1 }),
        createStreamEvent(EventType.DATA, { value: 2 }),
        createStreamEvent(EventType.DATA, { value: 3 }),
      ];

      const windows = processor.applyWindow(events);

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveLength(2);
      expect(windows[1]).toHaveLength(2);
    });

    it('should apply count window', () => {
      const config: Partial<StreamProcessorConfig> = {
        name: 'test-processor',
        window: { type: WindowType.COUNT, size: 3 },
      };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const events = [
        createStreamEvent(EventType.DATA, { value: 1 }),
        createStreamEvent(EventType.DATA, { value: 2 }),
        createStreamEvent(EventType.DATA, { value: 3 }),
        createStreamEvent(EventType.DATA, { value: 4 }),
      ];

      const windows = processor.applyWindow(events);

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveLength(3);
      expect(windows[1]).toHaveLength(1);
    });

    it('should apply session window', () => {
      const config: Partial<StreamProcessorConfig> = {
        name: 'test-processor',
        window: { type: WindowType.SESSION, size: 10, sessionTimeout: 100 },
      };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const now = Date.now();
      const events = [
        createStreamEvent(EventType.DATA, { value: 1 }),
        createStreamEvent(EventType.DATA, { value: 2 }),
        createStreamEvent(EventType.DATA, { value: 3 }),
      ];

      // Manually set timestamps to test session window
      events[0].timestamp = new Date(now);
      events[1].timestamp = new Date(now + 50);
      events[2].timestamp = new Date(now + 200); // Outside session timeout

      const windows = processor.applyWindow(events);

      expect(windows).toHaveLength(2);
      expect(windows[0]).toHaveLength(2);
      expect(windows[1]).toHaveLength(1);
    });

    it('should get stats', () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor' };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const stats = processor.getStats();

      expect(stats.eventsProcessed).toBe(0);
      expect(stats.eventsFailed).toBe(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should provide state manager', () => {
      const config: Partial<StreamProcessorConfig> = { name: 'test-processor', stateful: true };
      const processor = new StreamProcessor(config as StreamProcessorConfig);

      const state = processor.getState();
      expect(state).toBeInstanceOf(StateManager);
    });
  });

  describe('StateManager', () => {
    it('should set and get value', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 123 });
      const result = state.get('key1');

      expect(result).toEqual({ value: 123 });
    });

    it('should return null for non-existent key', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      const result = state.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete value', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 123 });
      const deleted = state.delete('key1');
      const result = state.get('key1');

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 123 });

      expect(state.has('key1')).toBe(true);
      expect(state.has('non-existent')).toBe(false);
    });

    it('should handle TTL expiration', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100, defaultTTL: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 123 }, 50);

      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          expect(state.has('key1')).toBe(false);
          resolve(null);
        }, 100);
      });
    });

    it('should get all keys', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 1 });
      state.set('key2', { value: 2 });
      state.set('key3', { value: 3 });

      const keys = state.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should get size', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 1 });
      state.set('key2', { value: 2 });

      expect(state.size()).toBe(2);
    });

    it('should clear all state', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 100 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 1 });
      state.set('key2', { value: 2 });
      state.clear();

      expect(state.size()).toBe(0);
    });

    it('should enforce max size', () => {
      const config: Partial<StateManagerConfig> = { maxSize: 3 };
      const state = new StateManager(config as StateManagerConfig);

      state.set('key1', { value: 1 });
      state.set('key2', { value: 2 });
      state.set('key3', { value: 3 });
      state.set('key4', { value: 4 });

      expect(state.size()).toBe(3);
    });
  });

  describe('Utility Functions', () => {
    it('should create stream event', () => {
      const event = createStreamEvent(EventType.DATA, { value: 123 }, { source: 'test' });

      expect(event.type).toBe(EventType.DATA);
      expect(event.data).toEqual({ value: 123 });
      expect(event.metadata).toEqual({ source: 'test' });
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create message', () => {
      const message = createMessage({ value: 123 }, MessagePriority.HIGH);

      expect(message.data).toEqual({ value: 123 });
      expect(message.priority).toBe(MessagePriority.HIGH);
      expect(message.id).toBeDefined();
      expect(message.attempts).toBe(0);
    });

    it('should create queue', () => {
      const queue = createQueue('test-queue', { maxSize: 500, priority: true });

      expect(queue).toBeInstanceOf(MessageQueue);
    });

    it('should create stream processor', () => {
      const processor = createStreamProcessor('test-processor', { parallelism: 4 });

      expect(processor).toBeInstanceOf(StreamProcessor);
    });

    it('should create state manager', () => {
      const state = createStateManager({ maxSize: 5000 });

      expect(state).toBeInstanceOf(StateManager);
    });

    it('should create window config', () => {
      const config = createWindowConfig(WindowType.SLIDING, 100, { slide: 50 });

      expect(config.type).toBe(WindowType.SLIDING);
      expect(config.size).toBe(100);
      expect(config.slide).toBe(50);
    });
  });
});
