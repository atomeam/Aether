# @aether/operations

Retry, circuit breaker, and task queue.

## Features

- Exponential backoff retry
- Circuit breaker (open/closed/half-open)
- Priority task queue

## Usage

```typescript
import { withRetry } from '@aether/operations';
const result = await withRetry(fn, { maxRetries: 3 });