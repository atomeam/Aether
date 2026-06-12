# @aether/collection-utils

Set and Map utility functions.

## Installation

```bash
npm install @aether/collection-utils
```

## Usage

```typescript
import { collectionUtils } from '@aether/collection-utils';

// Set operations
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

collectionUtils.setUnion(setA, setB); // Set {1, 2, 3, 4}
collectionUtils.setIntersection(setA, setB); // Set {2, 3}
collectionUtils.setDifference(setA, setB); // Set {1}
collectionUtils.setSymmetricDifference(setA, setB); // Set {1, 4}
collectionUtils.setIsSubset(setA, setB); // false
collectionUtils.setIsSuperset(setA, setB); // false

// Map operations
const map = new Map([['a', 1], ['b', 2]]);

collectionUtils.mapKeys(map, k => k.toUpperCase()); // Map {A: 1, B: 2}
collectionUtils.mapValues(map, v => v * 2); // Map {a: 2, b: 4}
collectionUtils.mapInvert(map); // Map {1: 'a', 2: 'b'}
collectionUtils.mapFilter(map, (v, k) => v > 1); // Map {b: 2}
```

## API

### setUnion(...sets)
Union of sets.

### setIntersection(...sets)
Intersection of sets.

### setDifference(a, b)
Difference of sets (a - b).

### setSymmetricDifference(a, b)
Symmetric difference of sets.

### setIsSubset(a, b)
Check if a is subset of b.

### setIsSuperset(a, b)
Check if a is superset of b.

### mapKeys(map, fn)
Transform map keys.

### mapValues(map, fn)
Transform map values.

### mapInvert(map)
Invert map (key <-> value).

### mapFilter(map, predicate)
Filter map entries.