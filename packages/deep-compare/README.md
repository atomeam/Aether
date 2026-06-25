# @aether/deep-compare

Deep comparison and diff utilities.

## Installation

```bash
npm install @aether/deep-compare
```

## Usage

```typescript
import { deepCompare } from '@aether/deep-compare';

// Deep equality
deepCompare.equals({ a: 1 }, { a: 1 }); // true
deepCompare.equals({ a: 1 }, { a: 2 }); // false

// Deep diff
const diff = deepCompare.diff(
  { a: 1, b: { c: 2 } },
  { a: 1, b: { c: 3 }, d: 4 }
);
// { b: { from: { c: 2 }, to: { c: 3 } }, d: { from: undefined, to: 4 } }
```

## API

### equals(a, b)
Deep equality check.

### diff(a, b)
Get deep diff between two values.