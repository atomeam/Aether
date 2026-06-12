# @aether/object-utils

Object utility functions for common object operations.

## Installation

```bash
npm install @aether/object-utils
```

## Usage

```typescript
import { objectUtils } from '@aether/object-utils';

// Deep clone
const cloned = objectUtils.deepClone({ a: 1, b: { c: 2 } });

// Deep merge
const merged = objectUtils.deepMerge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
);
// { a: 1, b: { c: 2, d: 3 }, e: 4 }

// Omit keys
const omitted = objectUtils.omit({ a: 1, b: 2, c: 3 }, ['b', 'c']);
// { a: 1 }

// Pick keys
const picked = objectUtils.pick({ a: 1, b: 2, c: 3 }, ['a', 'b']);
// { a: 1, b: 2 }
```

## API

### deepClone(obj)
Creates a deep clone of an object.

### deepMerge(target, source)
Deeply merges source object into target.

### omit(obj, keys)
Returns object with specified keys omitted.

### pick(obj, keys)
Returns object with only specified keys.