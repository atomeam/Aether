# @aether/lru-cache

Least Recently Used (LRU) cache implementation.

## Installation

```bash
npm install @aether/lru-cache
```

## Usage

```typescript
import { createLRUCache } from '@aether/lru-cache';

const cache = createLRUCache<string, number>(100);

cache.set('key1', 42);
cache.get('key1'); // 42
cache.has('key1'); // true
cache.delete('key1');
cache.size; // 0
cache.clear();
```

## API

### get(key)
Get value from cache. Returns undefined if not found or expired.

### set(key, value)
Set value in cache. Evicts oldest if at capacity.

### has(key)
Check if key exists in cache.

### delete(key)
Delete key from cache.

### clear()
Clear all entries.

### size
Get current cache size.