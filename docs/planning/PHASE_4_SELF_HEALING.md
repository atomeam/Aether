# Phase 4: Self-Healing & Error Recovery

## Overview
Implement automatic error recovery and self-healing mechanisms for the relay system.

## Current State
- File-based error logging
- Manual error review
- No automatic retry logic
- No self-healing mechanisms

## Target State
- D1-based error logging
- Automatic retry with exponential backoff
- Self-healing for common errors
- Error classification and routing

## Implementation Steps

### Step 1: Update Error Logging to D1

**File:** `apps/backend/server.ts`

```typescript
// Log errors to D1 instead of file
async function logError(env: Env, error: Error, context: any) {
  const timestamp = new Date().toISOString();
  const errorType = classifyError(error);
  
  await env.RELAY_DB.prepare(
    "INSERT INTO relay_errors (timestamp, level, source, message, stack, task_id, context, error_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    timestamp,
    'error',
    context.source || 'relay_system',
    error.message,
    error.stack || null,
    context.task_id || null,
    JSON.stringify(context),
    errorType
  ).run();
}

// Error classification
function classifyError(error: Error): string {
  if (error.message.includes('timeout')) return 'timeout';
  if (error.message.includes('network')) return 'network';
  if (error.message.includes('auth')) return 'auth';
  if (error.message.includes('rate limit')) return 'rate_limit';
  return 'unknown';
}
```

### Step 2: Implement Retry Logic with Exponential Backoff

**File:** `apps/backend/server.ts`

```typescript
// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: any
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === RETRY_CONFIG.maxRetries) {
        await logError(env, lastError, { ...context, attempt });
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}
```

### Step 3: Implement Self-Healing for Common Errors

**File:** `apps/backend/server.ts`

```typescript
// Self-healing strategies
const HEALING_STRATEGIES = {
  timeout: async (context: any) => {
    console.log('Healing timeout error: increasing timeout');
    context.timeout = (context.timeout || 5000) * 2;
    return context;
  },
  network: async (context: any) => {
    console.log('Healing network error: retrying with alternative endpoint');
    context.useAlternativeEndpoint = true;
    return context;
  },
  auth: async (context: any) => {
    console.log('Healing auth error: refreshing token');
    context.token = await refreshToken();
    return context;
  },
  rate_limit: async (context: any) => {
    console.log('Healing rate limit error: backing off');
    await sleep(60000); // Wait 1 minute
    return context;
  },
};

async function healError(error: Error, context: any): Promise<any> {
  const errorType = classifyError(error);
  const strategy = HEALING_STRATEGIES[errorType];
  
  if (strategy) {
    return await strategy(context);
  }
  
  return context;
}
```

### Step 4: Implement Circuit Breaker Pattern

**File:** `apps/backend/server.ts`

```typescript
// Circuit breaker state
const circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: null,
  threshold: 5,
  timeout: 60000, // 1 minute
};

async function executeWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  context: any
): Promise<T> {
  // Check if circuit is open
  if (circuitBreakerState.isOpen) {
    const timeSinceLastFailure = Date.now() - (circuitBreakerState.lastFailureTime || 0);
    
    if (timeSinceLastFailure < circuitBreakerState.timeout) {
      throw new Error('Circuit breaker is open');
    } else {
      // Attempt to close circuit
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failureCount = 0;
    }
  }
  
  try {
    const result = await fn();
    
    // Reset failure count on success
    circuitBreakerState.failureCount = 0;
    return result;
  } catch (error) {
    circuitBreakerState.failureCount++;
    circuitBreakerState.lastFailureTime = Date.now();
    
    // Open circuit if threshold reached
    if (circuitBreakerState.failureCount >= circuitBreakerState.threshold) {
      circuitBreakerState.isOpen = true;
      console.log('Circuit breaker opened due to repeated failures');
    }
    
    throw error;
  }
}
```

### Step 5: Update D1 Schema for Error Logging

**File:** `apps/relay/migrations/0002_error_logging.sql`

```sql
-- Add error_type column to relay_errors table
ALTER TABLE relay_errors ADD COLUMN error_type TEXT;

-- Add index on error_type
CREATE INDEX IF NOT EXISTS idx_relay_errors_error_type ON relay_errors(error_type);

-- Add healing_attempts column
ALTER TABLE relay_errors ADD COLUMN healing_attempts INTEGER DEFAULT 0;

-- Add healed_at column
ALTER TABLE relay_errors ADD COLUMN healed_at TEXT;
```

### Step 6: Implement Error Dashboard

**File:** `apps/backend/server.ts`

```typescript
// GET /relay/errors/dashboard - Error dashboard
app.get('/relay/errors/dashboard', async (req, res) => {
  const errors = await env.RELAY_DB.prepare(
    "SELECT error_type, COUNT(*) as count, MAX(timestamp) as last_occurrence FROM relay_errors GROUP BY error_type"
  ).all();
  
  const totalErrors = await env.RELAY_DB.prepare(
    "SELECT COUNT(*) as total FROM relay_errors"
  ).first();
  
  const healedErrors = await env.RELAY_DB.prepare(
    "SELECT COUNT(*) as total FROM relay_errors WHERE healed_at IS NOT NULL"
  ).first();
  
  res.json({
    total_errors: totalErrors.total,
    healed_errors: healedErrors.total,
    healing_rate: (healedErrors.total / totalErrors.total) * 100,
    errors_by_type: errors.results,
  });
});
```

### Step 7: Run Migration

```bash
cd apps/relay
wrangler d1 migrations apply relay-db --remote
```

### Step 8: Test Self-Healing

1. Trigger timeout error
2. Verify timeout healing strategy applied
3. Verify retry with increased timeout
4. Trigger network error
5. Verify network healing strategy applied
6. Verify circuit breaker opens after repeated failures
7. Verify circuit breaker closes after timeout

## Migration Checklist

- [ ] Update error logging to D1
- [ ] Implement retry logic with exponential backoff
- [ ] Implement self-healing strategies
- [ ] Implement circuit breaker pattern
- [ ] Update D1 schema
- [ ] Implement error dashboard
- [ ] Run migration
- [ ] Test self-healing mechanisms
- [ ] Test circuit breaker
- [ ] Test error dashboard
- [ ] Remove file-based error logging
- [ ] Update documentation

## Rollback Plan

If self-healing fails:
1. Keep file-based error logging
2. Disable retry logic
3. Disable self-healing strategies
4. Disable circuit breaker
5. Revert to manual error handling

## Benefits

1. **Automatic recovery** - System heals itself from common errors
2. **Reduced manual intervention** - Less need for manual error handling
3. **Better reliability** - Retry logic improves success rate
4. **Circuit breaker** - Prevents cascading failures
5. **Error visibility** - Dashboard shows error patterns

## Estimated Time

- Error logging update: 30 minutes
- Retry logic: 1 hour
- Self-healing strategies: 1 hour
- Circuit breaker: 1 hour
- D1 schema update: 30 minutes
- Error dashboard: 30 minutes
- Testing: 1 hour
- Total: ~5.5 hours

## Next Steps

1. Get approval for implementation
2. Implement self-healing mechanisms
3. Test thoroughly
4. Deploy to production
5. Monitor error rates and healing success
