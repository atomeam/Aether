# @aether/array-utils

Array utility functions for common operations.

## Installation

```bash
npm install @aether/array-utils
```

## Usage

```typescript
import { arrayUtils } from '@aether/array-utils';

// Chunk array
const chunks = arrayUtils.chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// Remove duplicates
const unique = arrayUtils.unique([1, 2, 2, 3]);
// [1, 2, 3]

// Shuffle array
const shuffled = arrayUtils.shuffle([1, 2, 3, 4, 5]);

// Sample random elements
const sample = arrayUtils.sample([1, 2, 3, 4, 5], 2);
```

## API

### chunk(array, size)
Splits array into chunks of specified size.

### unique(array)
Removes duplicate values from array.

### shuffle(array)
Returns a shuffled copy of the array.

### sample(array, count)
Returns random elements from array.