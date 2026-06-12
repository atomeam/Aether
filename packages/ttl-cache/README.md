# @aether/ttl-cache

Time-to-Live (TTL) cache with expiration.

## Installation

```bash
npm install @aether/ttl-cache
```

## Usage

```typescript
import { createTTLCache } from '@aether/ttl-cache';

const cache = createTTLCache<string, number>(60000); // 60 second TTL

cache.set('key1', 42);
cache.set('key2', 100, 30000); // 30 second TTL

cache.get('key1'); // 42 (if not expired)
cache.has('key1'); // true (if not expired)
cache.delete('key1');
cache.cleanup(); // Remove expired entries
cache.size; // Current size (after cleanup)
cache.clear();
```

## API

### get(key)
Get value from cache. Returns undefined if not found or expired.

### set(key, value, ttl?)
Set value in cache with optional TTL.

### has(key)
Check if key exists and is not expired.

### delete(key)
Delete key from cache.

### clear()
Clear all entries.

### cleanup()
Remove expired entries.

### size
Get current cache size (after cleanup).