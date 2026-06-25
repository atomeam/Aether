# @aether/functional

Functional programming utilities.

## Installation

```bash
npm install @aether/functional
```

## Usage

```typescript
import { functional } from '@aether/functional';

// Pipe functions
const result = functional.pipe(
  (x: number) => x * 2,
  (x: number) => x + 1,
  (x: number) => x.toString()
)(5); // "11"

// Compose functions
const composed = functional.compose(
  (x: string) => parseInt(x),
  (x: number) => x * 2
)("10"); // 20

// Curry function
const curriedAdd = functional.curry((a: number, b: number) => a + b);
const add5 = curriedAdd(5);
add5(3); // 8

// Partial application
const partial = functional.partial(Math.max, 10);
partial(5, 3); // 10

// Memoize
const memoized = functional.memoize((x: number) => x * 2);

// Debounce
const debounced = functional.debounce(fn, 100);

// Throttle
const throttled = functional.throttle(fn, 100);

// Once
const once = functional.once(fn);
```

## API

### pipe(...fns)
Pipe functions left to right.

### compose(...fns)
Compose functions right to left.

### curry(fn)
Curry a function.

### partial(fn, ...args)
Partially apply arguments.

### memoize(fn)
Memoize function results.

### debounce(fn, delay)
Debounce function calls.

### throttle(fn, limit)
Throttle function calls.

### once(fn)
Ensure function runs only once.