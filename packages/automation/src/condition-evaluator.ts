/**
 * @aether/automation - Condition evaluation engine
 * 
 * Evaluates conditions and condition groups against data
 * 
 * @version 1.0.0
 */

import type {
  Condition,
  ConditionGroup,
  ConditionOperator,
} from './types';

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: Condition,
  data: Record<string, unknown>
): boolean {
  const actualValue = getNestedValue(data, condition.field);
  const expectedValue = condition.value;
  const operator = condition.operator;

  let result: boolean;

  switch (operator) {
    case 'equals':
      result = actualValue === expectedValue;
      break;

    case 'not_equals':
      result = actualValue !== expectedValue;
      break;

    case 'contains':
      result =
        typeof actualValue === 'string' &&
        typeof expectedValue === 'string' &&
        actualValue.includes(expectedValue);
      break;

    case 'not_contains':
      result =
        typeof actualValue === 'string' &&
        typeof expectedValue === 'string' &&
        !actualValue.includes(expectedValue);
      break;

    case 'greater_than':
      result =
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue > expectedValue;
      break;

    case 'less_than':
      result =
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue < expectedValue;
      break;

    case 'greater_than_or_equal':
      result =
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue >= expectedValue;
      break;

    case 'less_than_or_equal':
      result =
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue <= expectedValue;
      break;

    case 'in':
      result =
        Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      break;

    case 'not_in':
      result =
        Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      break;

    case 'regex':
      result =
        typeof actualValue === 'string' &&
        typeof expectedValue === 'string' &&
        new RegExp(expectedValue).test(actualValue);
      break;

    case 'exists':
      result = actualValue !== undefined && actualValue !== null;
      break;

    case 'not_exists':
      result = actualValue === undefined || actualValue === null;
      break;

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }

  return condition.negate ? !result : result;
}

/**
 * Evaluate a condition group (supports nested groups)
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  data: Record<string, unknown>
): boolean {
  const results = group.conditions.map((condition: Condition | ConditionGroup) => {
    if ('operator' in condition) {
      // It's a Condition
      return evaluateCondition(condition, data);
    } else {
      // It's a nested ConditionGroup
      return evaluateConditionGroup(condition, data);
    }
  });

  const logic = group.logic || 'AND';
  if (logic === 'AND') {
    return results.every((r: boolean) => r === true);
  } else {
    // OR logic
    return results.some((r: boolean) => r === true);
  }
}

/**
 * Check if workflow conditions are met
 */
export function checkWorkflowConditions(
  conditionGroup: ConditionGroup | undefined,
  data: Record<string, unknown>
): boolean {
  if (!conditionGroup) {
    return true; // No conditions means always pass
  }

  return evaluateConditionGroup(conditionGroup, data);
}
