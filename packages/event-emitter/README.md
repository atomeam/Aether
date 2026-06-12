# @aether/event-emitter

Event emitter pattern implementation.

## Installation

```bash
npm install @aether/event-emitter
```

## Usage

```typescript
import { eventEmitter } from '@aether/event-emitter';

// Subscribe
const unsubscribe = eventEmitter.on('data', (data) => {
  console.log('Received:', data);
});

// Emit
eventEmitter.emit('data', { value: 42 });

// Once
eventEmitter.once('init', () => console.log('Initialized'));

// Unsubscribe
unsubscribe();

// Get listener count
eventEmitter.listenerCount('data'); // 1

// Get all event names
eventEmitter.eventNames(); // ['data']

// Remove all listeners
eventEmitter.removeAllListeners('data');
```

## API

### on(event, handler)
Subscribe to event. Returns unsubscribe function.

### off(event, handler)
Unsubscribe from event.

### emit(event, ...args)
Emit event with arguments.

### once(event, handler)
Subscribe to event once.

### removeAllListeners(event?)
Remove all listeners for event or all events.

### listenerCount(event)
Get number of listeners for event.

### eventNames()
Get all registered event names.