# @aether/streaming

Real-time data streaming library for the Aether ecosystem.

## Features

- **Event Streaming**: Publish-subscribe event system with type-safe event handlers
- **Message Queuing**: Priority-based message queues with retry logic and dead letter queues
- **Stream Processing**: Process events in batches with configurable parallelism
- **Windowing Operations**: Tumbling, sliding, session, and count-based windows
- **State Management**: In-memory state store with TTL and size limits
- **TypeScript Support**: Full TypeScript types and Zod schemas for runtime validation

## Installation

```bash
npm install @aether/streaming
```

## Quick Start

```typescript
import { EventEmitter, EventType, createStreamEvent } from '@aether/streaming';

// Create an event emitter
const emitter = new EventEmitter();

// Subscribe to events
const unsubscribe = emitter.on(EventType.DATA, (event) => {
  console.log('Received data:', event.data);
});

// Emit an event
emitter.emit(createStreamEvent(EventType.DATA, { value: 123 }));

// Unsubscribe when done
unsubscribe();
```

## Event Streaming

### Basic Event Emission

```typescript
import { EventEmitter, EventType, createStreamEvent } from '@aether/streaming';

const emitter = new EventEmitter();

// Subscribe to specific event type
emitter.on(EventType.DATA, (event) => {
  console.log('Data event:', event.data);
});

// Subscribe to all events
emitter.onAll((event) => {
  console.log('All events:', event.type, event.data);
});

// Emit events
emitter.emit(createStreamEvent(EventType.DATA, { message: 'Hello' }));
emitter.emit(createStreamEvent(EventType.ERROR, { error: 'Something went wrong' }));
```

### Event with Metadata

```typescript
const event = createStreamEvent(
  EventType.DATA,
  { value: 123 },
  { source: 'sensor-1', location: 'room-a' }
);

emitter.emit(event);
```

## Message Queuing

### Basic Queue

```typescript
import { MessageQueue, createQueue, createMessage, MessagePriority } from '@aether/streaming';

const queue = createQueue('my-queue', {
  maxSize: 1000,
  priority: true,
});

// Enqueue messages
await queue.enqueue(createMessage({ task: 'task-1' }, MessagePriority.NORMAL));
await queue.enqueue(createMessage({ task: 'task-2' }, MessagePriority.HIGH));

// Dequeue messages
const message = await queue.dequeue();
if (message) {
  console.log('Processing:', message.data);
  await queue.ack(message.id);
}
```

### Priority Queue

```typescript
const queue = createQueue('priority-queue', { priority: true });

await queue.enqueue(createMessage({ id: 1 }, MessagePriority.LOW));
await queue.enqueue(createMessage({ id: 2 }, MessagePriority.CRITICAL));
await queue.enqueue(createMessage({ id: 3 }, MessagePriority.NORMAL));

// Messages are dequeued in priority order
const message = await queue.dequeue(); // CRITICAL
```

### Queue Operations

```typescript
// Peek at next message without removing
const next = queue.peek();

// Get queue size
const size = queue.size();

// Get processing count
const processing = queue.processingCount();

// Clear queue
queue.clear();
```

## Stream Processing

### Basic Processing

```typescript
import { StreamProcessor, createStreamProcessor, EventType, createStreamEvent } from '@aether/streaming';

const processor = createStreamProcessor('my-processor', {
  parallelism: 4,
  bufferSize: 100,
});

// Process a single event
const event = createStreamEvent(EventType.DATA, { value: 123 });
await processor.process(event, async (event) => {
  console.log('Processing:', event.data);
});

// Process batch of events
const events = [
  createStreamEvent(EventType.DATA, { value: 1 }),
  createStreamEvent(EventType.DATA, { value: 2 }),
  createStreamEvent(EventType.DATA, { value: 3 }),
];

await processor.processBatch(events, async (event) => {
  console.log('Batch processing:', event.data);
});
```

### Event Buffering

```typescript
const processor = createStreamProcessor('buffered-processor', {
  bufferSize: 100,
});

// Buffer events
processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 1 }));
processor.bufferEvent(createStreamEvent(EventType.DATA, { value: 2 }));

// Flush buffer manually
await processor.flushBuffer(async (event) => {
  console.log('Flushed:', event.data);
});
```

### Windowing Operations

```typescript
import { WindowType, createWindowConfig } from '@aether/streaming';

// Tumbling window
const processor = createStreamProcessor('tumbling-processor', {
  window: createWindowConfig(WindowType.TUMBLING, 100),
});

const windows = processor.applyWindow(events);
// Returns arrays of 100 events each

// Sliding window
const slidingProcessor = createStreamProcessor('sliding-processor', {
  window: createWindowConfig(WindowType.SLIDING, 100, { slide: 10 }),
});

// Session window
const sessionProcessor = createStreamProcessor('session-processor', {
  window: createWindowConfig(WindowType.SESSION, 100, { sessionTimeout: 5000 }),
});
```

### Stream Statistics

```typescript
const stats = processor.getStats();
console.log('Events processed:', stats.eventsProcessed);
console.log('Events failed:', stats.eventsFailed);
console.log('Events per second:', stats.eventsPerSecond);
console.log('Queue size:', stats.queueSize);
console.log('Uptime:', stats.uptime);
```

## State Management

### Basic State Operations

```typescript
import { StateManager, createStateManager } from '@aether/streaming';

const state = createStateManager({
  maxSize: 10000,
  defaultTTL: 3600000, // 1 hour
});

// Set value
state.set('user:123', { name: 'John', age: 30 });

// Get value
const user = state.get('user:123');
console.log(user); // { name: 'John', age: 30 }

// Check if key exists
if (state.has('user:123')) {
  console.log('User exists');
}

// Delete value
state.delete('user:123');

// Get all keys
const keys = state.keys();

// Get size
const size = state.size();

// Clear all state
state.clear();
```

### TTL Expiration

```typescript
// Set value with custom TTL (5 seconds)
state.set('temp:123', { value: 'temporary' }, 5000);

// Value will be automatically removed after TTL expires
setTimeout(() => {
  console.log(state.has('temp:123')); // false
}, 6000);
```

### Stateful Stream Processing

```typescript
const processor = createStreamProcessor('stateful-processor', {
  stateful: true,
});

const state = processor.getState();

// Use state in processing
await processor.process(event, async (event) => {
  const count = state.get('count') || 0;
  state.set('count', count + 1);
  console.log('Processed', count + 1, 'events');
});
```

## Complete Example

```typescript
import {
  EventEmitter,
  MessageQueue,
  StreamProcessor,
  StateManager,
  EventType,
  MessagePriority,
  WindowType,
  createStreamEvent,
  createMessage,
  createQueue,
  createStreamProcessor,
  createStateManager,
  createWindowConfig,
} from '@aether/streaming';

// Setup event emitter
const emitter = new EventEmitter();

// Setup message queue
const queue = createQueue('event-queue', {
  maxSize: 1000,
  priority: true,
});

// Setup stream processor
const processor = createStreamProcessor('event-processor', {
  parallelism: 4,
  bufferSize: 100,
  window: createWindowConfig(WindowType.TUMBLING, 50),
  stateful: true,
});

// Setup state manager
const state = processor.getState();

// Subscribe to events
emitter.on(EventType.DATA, async (event) => {
  // Enqueue for processing
  await queue.enqueue(createMessage(event, MessagePriority.NORMAL));
});

// Process messages from queue
async function processQueue() {
  while (true) {
    const message = await queue.dequeue();
    if (message) {
      try {
        await processor.process(
          message.data as StreamEvent,
          async (event) => {
            // Update state
            const count = state.get('processed') || 0;
            state.set('processed', count + 1);

            console.log('Processed event:', event.data);
          }
        );
        await queue.ack(message.id);
      } catch (error) {
        console.error('Processing error:', error);
        await queue.nack(message.id);
      }
    }
  }
}

// Start processing
processQueue();

// Emit events
emitter.emit(createStreamEvent(EventType.DATA, { sensor: 'temp', value: 23.5 }));
emitter.emit(createStreamEvent(EventType.DATA, { sensor: 'humidity', value: 65 }));
```

## API Reference

### Types

- `EventType` - Enum of event types (DATA, ERROR, COMPLETE, STATUS)
- `MessagePriority` - Enum of message priorities (LOW, NORMAL, HIGH, CRITICAL)
- `WindowType` - Enum of window types (TUMBLING, SLIDING, SESSION, COUNT)
- `StreamEvent` - Streaming event structure
- `Message` - Message structure for queues
- `QueueConfig` - Queue configuration
- `WindowConfig` - Window configuration
- `StreamProcessorConfig` - Stream processor configuration
- `StateEntry` - State entry structure
- `StateManagerConfig` - State manager configuration
- `StreamStats` - Stream statistics

### Classes

- `EventEmitter` - Event emitter for pub-sub pattern
- `MessageQueue` - Priority-based message queue
- `StreamProcessor` - Stream processor with windowing and state
- `StateManager` - In-memory state store with TTL

### Functions

- `parseStreamEvent()` - Validate stream event
- `parseMessage()` - Validate message
- `parseQueueConfig()` - Validate queue configuration
- `parseWindowConfig()` - Validate window configuration
- `parseStreamProcessorConfig()` - Validate processor configuration
- `parseStateManagerConfig()` - Validate state manager configuration
- `createStreamEvent()` - Create a stream event
- `createMessage()` - Create a message
- `createQueue()` - Create a message queue
- `createStreamProcessor()` - Create a stream processor
- `createStateManager()` - Create a state manager
- `createWindowConfig()` - Create a window configuration

## License

MIT
