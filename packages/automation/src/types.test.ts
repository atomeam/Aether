/**
 * @aether/automation - Type validation tests
 * 
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  TriggerSchema,
  ActionSchema,
  ConditionSchema,
  ConditionGroupSchema,
  WorkflowSchema,
  ExecutionSchema,
  AutomationErrorSchema,
} from './schemas';

describe('TriggerSchema', () => {
  it('should validate a valid trigger', () => {
    const trigger = {
      id: 'trigger-1',
      type: 'webhook',
      config: { path: '/webhook' },
      enabled: true,
    };

    const result = TriggerSchema.parse(trigger);
    expect(result).toEqual(trigger);
  });

  it('should reject invalid trigger type', () => {
    const trigger = {
      id: 'trigger-1',
      type: 'invalid',
      config: {},
    };

    expect(() => TriggerSchema.parse(trigger)).toThrow();
  });

  it('should require id', () => {
    const trigger = {
      type: 'webhook',
      config: {},
    };

    expect(() => TriggerSchema.parse(trigger)).toThrow();
  });
});

describe('ActionSchema', () => {
  it('should validate a valid action', () => {
    const action = {
      id: 'action-1',
      type: 'http_request',
      config: { url: 'https://api.example.com' },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        maxBackoffMs: 30000,
      },
      timeoutMs: 30000,
    };

    const result = ActionSchema.parse(action);
    expect(result).toEqual(action);
  });

  it('should accept action without retry policy', () => {
    const action = {
      id: 'action-1',
      type: 'email',
      config: { to: 'test@example.com' },
    };

    const result = ActionSchema.parse(action);
    expect(result.retryPolicy).toBeUndefined();
  });

  it('should reject invalid action type', () => {
    const action = {
      id: 'action-1',
      type: 'invalid',
      config: {},
    };

    expect(() => ActionSchema.parse(action)).toThrow();
  });
});

describe('ConditionSchema', () => {
  it('should validate a valid condition', () => {
    const condition = {
      id: 'condition-1',
      field: 'user.email',
      operator: 'contains',
      value: '@example.com',
      negate: false,
    };

    const result = ConditionSchema.parse(condition);
    expect(result).toEqual(condition);
  });

  it('should reject invalid operator', () => {
    const condition = {
      id: 'condition-1',
      field: 'user.email',
      operator: 'invalid',
      value: '@example.com',
    };

    expect(() => ConditionSchema.parse(condition)).toThrow();
  });
});

describe('ConditionGroupSchema', () => {
  it('should validate a simple condition group', () => {
    const group = {
      id: 'group-1',
      logic: 'AND' as const,
      conditions: [
        {
          id: 'condition-1',
          field: 'user.email',
          operator: 'contains' as const,
          value: '@example.com',
        },
      ],
    };

    const result = ConditionGroupSchema.parse(group);
    expect(result).toEqual(group);
  });

  it('should validate nested condition groups', () => {
    const group = {
      id: 'group-1',
      logic: 'AND' as const,
      conditions: [
        {
          id: 'condition-1',
          field: 'user.email',
          operator: 'contains' as const,
          value: '@example.com',
        },
        {
          id: 'group-2',
          logic: 'OR' as const,
          conditions: [
            {
              id: 'condition-2',
              field: 'user.role',
              operator: 'equals' as const,
              value: 'admin',
            },
          ],
        },
      ],
    };

    const result = ConditionGroupSchema.parse(group);
    expect(result.conditions).toHaveLength(2);
  });
});

describe('WorkflowSchema', () => {
  it('should validate a valid workflow', () => {
    const workflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      status: 'active' as const,
      triggers: [
        {
          id: 'trigger-1',
          type: 'webhook' as const,
          config: { path: '/webhook' },
        },
      ],
      actions: [
        {
          id: 'action-1',
          type: 'http_request' as const,
          config: { url: 'https://api.example.com' },
        },
      ],
      conditions: {
        id: 'group-1',
        logic: 'AND' as const,
        conditions: [],
      },
      errorHandling: {
        retryOnFailure: true,
        notifyOnFailure: true,
        continueOnError: false,
      },
    };

    const result = WorkflowSchema.parse(workflow);
    expect(result).toEqual(workflow);
  });

  it('should require at least one action', () => {
    const workflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      actions: [],
    };

    expect(() => WorkflowSchema.parse(workflow)).toThrow();
  });
});

describe('ExecutionSchema', () => {
  it('should validate a valid execution', () => {
    const execution = {
      id: 'exec-1',
      workflowId: 'workflow-1',
      status: 'completed' as const,
      triggerType: 'webhook' as const,
      triggerData: { path: '/webhook' },
      input: { userId: '123' },
      output: { result: 'success' },
      startedAt: '2024-01-01T00:00:00.000Z',
      completedAt: '2024-01-01T00:00:01.000Z',
      steps: [
        {
          actionId: 'action-1',
          status: 'completed' as const,
          startedAt: '2024-01-01T00:00:00.000Z',
          completedAt: '2024-01-01T00:00:01.000Z',
        },
      ],
    };

    const result = ExecutionSchema.parse(execution);
    expect(result).toEqual(execution);
  });
});

describe('AutomationErrorSchema', () => {
  it('should validate a valid error', () => {
    const error = {
      type: 'network' as const,
      message: 'Network error occurred',
      code: 'NETWORK_ERROR',
      details: { url: 'https://api.example.com' },
      timestamp: '2024-01-01T00:00:00.000Z',
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      actionId: 'action-1',
    };

    const result = AutomationErrorSchema.parse(error);
    expect(result).toEqual(error);
  });
});
