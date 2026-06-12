/**
 * @aether/automation - Action executor tests
 * 
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeAction,
  executeActions,
  executeActionsParallel,
  registerActionHandler,
} from './action-executor';
import type { Action } from './types';

describe('executeAction', () => {
  beforeEach(() => {
    // Clear any custom handlers before each test
    vi.clearAllMocks();
  });

  it('should execute transform action successfully', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'transform',
      config: {
        transform: (data: unknown) => ({ result: data }),
      },
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: { test: 'data' },
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.output).toEqual({ result: { test: 'data' } });
  });

  it('should handle transform action failure', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'transform',
      config: {
        transform: () => {
          throw new Error('Transform failed');
        },
      },
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Transform failed');
  });

  it('should execute custom action successfully', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'custom',
      config: {
        handler: async () => ({
          success: true,
          output: { custom: 'result' },
          status: 'completed' as const,
        }),
      },
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ custom: 'result' });
  });

  it('should handle unknown action type', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'unknown' as any,
      config: {},
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No handler registered');
  });

  it('should retry on failure with backoff', async () => {
    let attemptCount = 0;
    const action: Action = {
      id: 'action-1',
      type: 'custom',
      config: {
        handler: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return {
            success: true,
            output: { result: 'success' },
            status: 'completed' as const,
          };
        },
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 10,
        maxBackoffMs: 100,
      },
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(true);
    expect(attemptCount).toBe(3);
  });

  it('should respect max retries', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'custom',
      config: {
        handler: async () => {
          throw new Error('Always fails');
        },
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 10,
        maxBackoffMs: 100,
      },
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('failed after retries');
  });

  it('should handle timeout', async () => {
    const action: Action = {
      id: 'action-1',
      type: 'custom',
      config: {
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return {
            success: true,
            output: {},
            status: 'completed' as const,
          };
        },
      },
      timeoutMs: 100,
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Action timeout');
  });
});

describe('executeActions', () => {
  it('should execute actions in sequence', async () => {
    const actions: Action[] = [
      {
        id: 'action-1',
        type: 'transform',
        config: { transform: () => ({ step: 1 }) },
      },
      {
        id: 'action-2',
        type: 'transform',
        config: { transform: () => ({ step: 2 }) },
      },
    ];

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const results = await executeActions(actions, context);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
  });

  it('should stop on error when configured', async () => {
    const actions: Action[] = [
      {
        id: 'action-1',
        type: 'transform',
        config: { transform: () => ({ step: 1 }) },
      },
      {
        id: 'action-2',
        type: 'transform',
        config: { transform: () => {
          throw new Error('Failed');
        }},
      },
      {
        id: 'action-3',
        type: 'transform',
        config: { transform: () => ({ step: 3 }) },
      },
    ];

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const results = await executeActions(actions, context, { stopOnError: true });

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
  });

  it('should continue on error when configured', async () => {
    const actions: Action[] = [
      {
        id: 'action-1',
        type: 'transform',
        config: { transform: () => ({ step: 1 }) },
      },
      {
        id: 'action-2',
        type: 'transform',
        config: { transform: () => {
          throw new Error('Failed');
        }},
      },
      {
        id: 'action-3',
        type: 'transform',
        config: { transform: () => ({ step: 3 }) },
      },
    ];

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const results = await executeActions(actions, context, { stopOnError: false });

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
});

describe('executeActionsParallel', () => {
  it('should execute actions in parallel', async () => {
    const actions: Action[] = [
      {
        id: 'action-1',
        type: 'transform',
        config: { transform: () => ({ step: 1 }) },
      },
      {
        id: 'action-2',
        type: 'transform',
        config: { transform: () => ({ step: 2 }) },
      },
    ];

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const results = await executeActionsParallel(actions, context);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
  });
});

describe('registerActionHandler', () => {
  it('should register custom action handler', async () => {
    registerActionHandler('my_custom', async () => ({
      success: true,
      output: { custom: 'result' },
      status: 'completed' as const,
    }));

    const action: Action = {
      id: 'action-1',
      type: 'my_custom',
      config: {},
    };

    const context = {
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      input: {},
    };

    const result = await executeAction(action, context);

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ custom: 'result' });
  });
});
