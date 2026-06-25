/**
 * @aether/authorization - Authorization System
 * 
 * Zod schemas for validation
 */

import { z } from 'zod';

// ============================================================================
// RBAC Schemas
// ============================================================================

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  inheritsFrom: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  resource: z.string().min(1),
  action: z.string().min(1),
  conditions: z.record(z.any()).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const UserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedAt: z.coerce.date(),
  assignedBy: z.string().uuid().optional(),
  expiresAt: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// ABAC Schemas
// ============================================================================

export const AttributeSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object'])
});

export const PolicyConditionSchema = z.object({
  type: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'in', 'notIn', 'greaterThan', 'lessThan', 'regex']),
  attribute: z.string().min(1),
  value: z.any().optional()
});

export const PolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  effect: z.enum(['allow', 'deny']),
  resources: z.array(z.string().min(1)),
  actions: z.array(z.string().min(1)),
  subjects: z.array(z.string().min(1)),
  conditions: z.array(PolicyConditionSchema).optional(),
  priority: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const PolicyEvaluationContextSchema = z.object({
  subject: z.object({
    id: z.string().uuid(),
    roles: z.array(z.string()),
    attributes: z.record(z.any())
  }),
  resource: z.object({
    type: z.string().min(1),
    id: z.string().uuid(),
    attributes: z.record(z.any())
  }),
  action: z.string().min(1),
  environment: z.record(z.any()).optional()
});

// ============================================================================
// Authorization Schemas
// ============================================================================

export const AuthorizationRequestSchema = z.object({
  subject: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
  context: z.record(z.any()).optional()
});

export const AuthorizationResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  policies: z.array(z.string()).optional(),
  matchedPolicies: z.array(PolicySchema).optional(),
  deniedBy: z.string().optional()
});

export const PermissionCheckSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
  allowed: z.boolean(),
  reason: z.string().optional()
});

// ============================================================================
// Audit Schemas
// ============================================================================

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.coerce.date(),
  subject: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
  result: z.enum(['allow', 'deny']),
  reason: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const AuditConfigSchema = z.object({
  enabled: z.boolean().default(true),
  logLevel: z.enum(['all', 'denied', 'none']).default('denied'),
  retentionDays: z.number().int().min(1).optional(),
  includeContext: z.boolean().default(false)
});
