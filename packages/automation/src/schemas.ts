/**
 * @aether/automation - Zod validation schemas
 * 
 * @version 1.0.0
 */

import { z } from 'zod';
import {
  TriggerTypeSchema,
  TriggerSchema,
  ActionTypeSchema,
  ActionSchema,
  ConditionOperatorSchema,
  ConditionSchema,
  ConditionGroupSchema,
  WorkflowStatusSchema,
  ExecutionStatusSchema,
  WorkflowSchema,
  ExecutionSchema,
  ErrorTypeSchema,
  AutomationErrorSchema,
} from './types';

// Re-export all schemas for convenience
export {
  TriggerTypeSchema,
  TriggerSchema,
  ActionTypeSchema,
  ActionSchema,
  ConditionOperatorSchema,
  ConditionSchema,
  ConditionGroupSchema,
  WorkflowStatusSchema,
  ExecutionStatusSchema,
  WorkflowSchema,
  ExecutionSchema,
  ErrorTypeSchema,
  AutomationErrorSchema,
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Parse and validate a trigger
 */
export function parseTrigger(data: unknown) {
  return TriggerSchema.parse(data);
}

/**
 * Safely parse a trigger
 */
export function safeParseTrigger(data: unknown) {
  return TriggerSchema.safeParse(data);
}

/**
 * Parse and validate an action
 */
export function parseAction(data: unknown) {
  return ActionSchema.parse(data);
}

/**
 * Safely parse an action
 */
export function safeParseAction(data: unknown) {
  return ActionSchema.safeParse(data);
}

/**
 * Parse and validate a condition
 */
export function parseCondition(data: unknown) {
  return ConditionSchema.parse(data);
}

/**
 * Safely parse a condition
 */
export function safeParseCondition(data: unknown) {
  return ConditionSchema.safeParse(data);
}

/**
 * Parse and validate a condition group
 */
export function parseConditionGroup(data: unknown) {
  return ConditionGroupSchema.parse(data);
}

/**
 * Safely parse a condition group
 */
export function safeParseConditionGroup(data: unknown) {
  return ConditionGroupSchema.safeParse(data);
}

/**
 * Parse and validate a workflow
 */
export function parseWorkflow(data: unknown) {
  return WorkflowSchema.parse(data);
}

/**
 * Safely parse a workflow
 */
export function safeParseWorkflow(data: unknown) {
  return WorkflowSchema.safeParse(data);
}

/**
 * Parse and validate an execution
 */
export function parseExecution(data: unknown) {
  return ExecutionSchema.parse(data);
}

/**
 * Safely parse an execution
 */
export function safeParseExecution(data: unknown) {
  return ExecutionSchema.safeParse(data);
}

/**
 * Parse and validate an automation error
 */
export function parseAutomationError(data: unknown) {
  return AutomationErrorSchema.parse(data);
}

/**
 * Safely parse an automation error
 */
export function safeParseAutomationError(data: unknown) {
  return AutomationErrorSchema.safeParse(data);
}
