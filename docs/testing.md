# Testing

## Overview

AtoMind uses Vitest for unit and integration testing.

## Running Tests

```bash
# All tests
npx turbo run test

# Specific package
npm run test -w @aether/contracts

# With coverage
npx turbo run test -- --coverage

# Watch mode
npx turbo run test -- --watch
```

## Test Structure

```
packages/*/src/__tests__/*.test.ts
apps/backend/tests/*.test.ts
apps/backend/src/agents/*.test.ts
tests/integration/*.test.ts
tests/e2e/*.spec.ts
```

## Writing Tests

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { curateActions } from '../src/index';

describe('curateActions', () => {
  it('should approve valid actions', () => {
    const actions = [{ action: 'ADD', component: { type: 'stat' } }];
    const result = curateActions(actions);
    expect(result.approved).toBe(true);
  });

  it('should reject invalid actions', () => {
    const actions = [{ action: 'ADD', component: { type: 'malicious' } }];
    const result = curateActions(actions);
    expect(result.approved).toBe(false);
  });
});
```

### Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('GET /api/health', () => {
  it('should return healthy', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
```

## Coverage

Coverage thresholds are set in `vitest.config.ts`:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Mocking

### External APIs

```typescript
import { vi } from 'vitest';
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: 'mocked' }),
    },
  })),
}));
```

### Database

```typescript
vi.mock('@aether/kv-writers', () => ({
  writeToKV: vi.fn().mockResolvedValue({ success: true }),
}));