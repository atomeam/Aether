/**
 * @aether/automation - Condition evaluator tests
 * 
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateConditionGroup,
  checkWorkflowConditions,
} from './condition-evaluator';
import type { Condition, ConditionGroup } from './types';

describe('evaluateCondition', () => {
  const data = {
    user: {
      name: 'John',
      email: 'john@example.com',
      age: 30,
      role: 'admin',
    },
    status: 'active',
    tags: ['important', 'urgent'],
  };

  it('should evaluate equals condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.name',
      operator: 'equals',
      value: 'John',
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate not_equals condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.name',
      operator: 'not_equals',
      value: 'Jane',
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate contains condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.email',
      operator: 'contains',
      value: '@example.com',
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate not_contains condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.email',
      operator: 'not_contains',
      value: '@gmail.com',
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate greater_than condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.age',
      operator: 'greater_than',
      value: 25,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate less_than condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.age',
      operator: 'less_than',
      value: 35,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate greater_than_or_equal condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.age',
      operator: 'greater_than_or_equal',
      value: 30,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate less_than_or_equal condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.age',
      operator: 'less_than_or_equal',
      value: 30,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate in condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.role',
      operator: 'in',
      value: ['admin', 'moderator'],
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate not_in condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.role',
      operator: 'not_in',
      value: ['user', 'guest'],
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate regex condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.email',
      operator: 'regex',
      value: '^[a-z]+@example\\.com$',
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate exists condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.name',
      operator: 'exists',
      value: null,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate not_exists condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.nonexistent',
      operator: 'not_exists',
      value: null,
    };

    expect(evaluateCondition(condition, data)).toBe(true);
  });

  it('should evaluate negated condition', () => {
    const condition: Condition = {
      id: 'cond-1',
      field: 'user.name',
      operator: 'equals',
      value: 'John',
      negate: true,
    };

    expect(evaluateCondition(condition, data)).toBe(false);
  });
});

describe('evaluateConditionGroup', () => {
  const data = {
    user: {
      name: 'John',
      email: 'john@example.com',
      age: 30,
    },
  };

  it('should evaluate AND group - all true', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'AND',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'John',
        },
        {
          id: 'cond-2',
          field: 'user.age',
          operator: 'greater_than',
          value: 25,
        },
      ],
    };

    expect(evaluateConditionGroup(group, data)).toBe(true);
  });

  it('should evaluate AND group - one false', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'AND',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'John',
        },
        {
          id: 'cond-2',
          field: 'user.age',
          operator: 'greater_than',
          value: 35,
        },
      ],
    };

    expect(evaluateConditionGroup(group, data)).toBe(false);
  });

  it('should evaluate OR group - one true', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'OR',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'Jane',
        },
        {
          id: 'cond-2',
          field: 'user.age',
          operator: 'greater_than',
          value: 25,
        },
      ],
    };

    expect(evaluateConditionGroup(group, data)).toBe(true);
  });

  it('should evaluate OR group - all false', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'OR',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'Jane',
        },
        {
          id: 'cond-2',
          field: 'user.age',
          operator: 'greater_than',
          value: 35,
        },
      ],
    };

    expect(evaluateConditionGroup(group, data)).toBe(false);
  });

  it('should evaluate nested groups', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'AND',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'John',
        },
        {
          id: 'group-2',
          logic: 'OR',
          conditions: [
            {
              id: 'cond-2',
              field: 'user.age',
              operator: 'greater_than',
              value: 35,
            },
            {
              id: 'cond-3',
              field: 'user.email',
              operator: 'contains',
              value: '@example.com',
            },
          ],
        },
      ],
    };

    expect(evaluateConditionGroup(group, data)).toBe(true);
  });
});

describe('checkWorkflowConditions', () => {
  const data = {
    user: {
      name: 'John',
      email: 'john@example.com',
    },
  };

  it('should return true when no conditions', () => {
    expect(checkWorkflowConditions(undefined, data)).toBe(true);
  });

  it('should return true when conditions are met', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'AND',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'John',
        },
      ],
    };

    expect(checkWorkflowConditions(group, data)).toBe(true);
  });

  it('should return false when conditions are not met', () => {
    const group: ConditionGroup = {
      id: 'group-1',
      logic: 'AND',
      conditions: [
        {
          id: 'cond-1',
          field: 'user.name',
          operator: 'equals',
          value: 'Jane',
        },
      ],
    };

    expect(checkWorkflowConditions(group, data)).toBe(false);
  });
});
