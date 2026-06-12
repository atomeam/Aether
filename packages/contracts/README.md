# @aether/logger

Structured logging system with execution ledger.

## Exports

- `createTraceLogger` — Create logger with trace ID
- `commitToLedger` — Write execution record
- `readRecords` — Read ledger entries

## Usage

```typescript
import { createTraceLogger, commitToLedger } from '@aether/logger';

const logger = createTraceLogger('trace-123');
logger.info