/**
 * @aether/automation - Core types for workflow automation
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TRIGGER TYPES
// =============================================================================

export const TriggerTypeSchema = z.enum([
  'webhook',
  'schedule',
  'event',
  'manual',
  'condition',
]);

export type TriggerType = z.infer<typeof TriggerTypeSchema>;

export const TriggerSchema = z.object({
  id: z.string().min(1),
  type: TriggerTypeSchema,
  config: z.record(z.unknown()),
  enabled: z.boolean().default(true),
});

export type Trigger = z.infer<typeof TriggerSchema>;

export interface TriggerEvent {
  type: TriggerType;
  data: Record<string, unknown>;
  timestamp: string;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export const ActionTypeSchema = z.enum([
  'http_request',
  'email',
  'database',
  'notification',
  'transform',
  'custom',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ActionSchema = z.object({
  id: z.string().min(1),
  type: ActionTypeSchema,
  config: z.record(z.unknown()),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).default(3),
    backoffMs: z.number().int().min(0).default(1000),
    maxBackoffMs: z.number().int().min(0).default(30000),
  }).optional(),
  timeoutMs: z.number().int().min(0).default(30000),
});

export type Action = z.infer<typeof ActionSchema>;

// =============================================================================
// CONDITION TYPES
// =============================================================================

export const ConditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'in',
  'not_in',
  'regex',
  'exists',
  'not_exists',
]);

export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>;

export const ConditionSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.unknown(),
  negate: z.boolean().default(false),
});

export type Condition = z.infer<typeof ConditionSchema>;

// Define ConditionGroup type first for circular reference
export const ConditionGroupSchema = z.object({
  id: z.string().min(1),
  logic: z.enum(['AND', 'OR']).default('AND'),
  conditions: z.array(z.union([ConditionSchema, z.lazy(() => ConditionGroupSchema)])),
}) as z.ZodType<{
  id: string;
  logic?: 'AND' | 'OR';
  conditions: (z.infer<typeof ConditionSchema> | z.infer<typeof ConditionGroupSchema>)[];
}>;

export type ConditionGroup = z.infer<typeof ConditionGroupSchema>;

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export const WorkflowStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'archived',
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const ExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout',
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: WorkflowStatusSchema.default('draft'),
  triggers: z.array(TriggerSchema).default([]),
  actions: z.array(ActionSchema).min(1),
  conditions: ConditionGroupSchema.optional(),
  errorHandling: z.object({
    retryOnFailure: z.boolean().default(true),
    notifyOnFailure: z.boolean().default(true),
    continueOnError: z.boolean().default(false),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// =============================================================================
// EXECUTION TYPES
// =============================================================================

export const ExecutionSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  status: ExecutionStatusSchema.default('pending'),
  triggerType: TriggerTypeSchema.optional(),
  triggerData: z.record(z.unknown()).optional(),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  steps: z.array(z.object({
    actionId: z.string(),
    status: ExecutionStatusSchema,
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    error: z.string().optional(),
    output: z.record(z.unknown()).optional(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Execution = z.infer<typeof ExecutionSchema>;

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export const ErrorTypeSchema = z.enum([
  'validation',
  'execution',
  'timeout',
  'rate_limit',
  'network',
  'unknown',
]);

export type ErrorType = z.infer<typeof ErrorTypeSchema>;

export const AutomationErrorSchema = z.object({
  type: ErrorTypeSchema,
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  workflowId: z.string().optional(),
  executionId: z.string().optional(),
  actionId: z.string().optional(),
});

export type AutomationError = z.infer<typeof AutomationErrorSchema>;
