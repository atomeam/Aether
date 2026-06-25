# @aether/type-guards

Runtime type guard utilities for TypeScript.

## Installation

```bash
npm install @aether/type-guards
```

## Usage

```typescript
import { typeGuards } from '@aether/type-guards';

// Type guards
if (typeGuards.isString(value)) {
  // value is narrowed to string
}

if (typeGuards.isNumber(value)) {
  // value is narrowed to number
}

if (typeGuards.isArray(value)) {
  // value is narrowed to unknown[]
}

if (typeGuards.isObject(value)) {
  // value is narrowed to Record<string, unknown>
}

// Nil checks
if (typeGuards.isNil(value)) {
  // value is null or undefined
}

// Empty checks
if (typeGuards.isEmpty(value)) {
  // value is empty (null, undefined, '', [], {})
}
```

## API

### isString(value)
Type guard for strings.

### isNumber(value)
Type guard for numbers.

### isBoolean(value)
Type guard for booleans.

### isNull(value)
Type guard for null.

### isUndefined(value)
Type guard for undefined.

### isNil(value)
Type guard for null or undefined.

### isArray(value)
Type guard for arrays.

### isObject(value)
Type guard for plain objects.

### isFunction(value)
Type guard for functions.

### isDate(value)
Type guard for Date objects.

### isPromise(value)
Type guard for Promises.

### isError(value)
Type guard for Error objects.

### isEmpty(value)
Check if value is empty.