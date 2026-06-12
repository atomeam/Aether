/**
 * @aether/authorization - Authorization System
 * 
 * TypeScript type definitions for authorization operations
 */

import { z } from 'zod';

// ============================================================================
// RBAC Types
// ============================================================================

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  inheritsFrom?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// ABAC Types
// ============================================================================

export interface Attribute {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'allow' | 'deny';
  resources: string[];
  actions: string[];
  subjects: string[];
  conditions?: PolicyCondition[];
  priority?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  type: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'in' | 'notIn' | 'greaterThan' | 'lessThan' | 'regex';
  attribute: string;
  value?: any;
}

export interface PolicyEvaluationContext {
  subject: {
    id: string;
    roles: string[];
    attributes: Record<string, any>;
  };
  resource: {
    type: string;
    id: string;
    attributes: Record<string, any>;
  };
  action: string;
  environment?: Record<string, any>;
}

// ============================================================================
// Authorization Types
// ============================================================================

export interface AuthorizationRequest {
  subject: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  policies?: string[];
  matchedPolicies?: Policy[];
  deniedBy?: string;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: Date;
  subject: string;
  resource: string;
  action: string;
  result: 'allow' | 'deny';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'all' | 'denied' | 'none';
  retentionDays?: number;
  includeContext?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AccessDeniedError extends AuthorizationError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
    this.name = 'AccessDeniedError';
  }
}

export class RoleNotFoundError extends AuthorizationError {
  constructor(message: string = 'Role not found') {
    super(message, 'ROLE_NOT_FOUND', 404);
    this.name = 'RoleNotFoundError';
  }
}

export class PermissionNotFoundError extends AuthorizationError {
  constructor(message: string = 'Permission not found') {
    super(message, 'PERMISSION_NOT_FOUND', 404);
    this.name = 'PermissionNotFoundError';
  }
}

export class PolicyNotFoundError extends AuthorizationError {
  constructor(message: string = 'Policy not found') {
    super(message, 'POLICY_NOT_FOUND', 404);
    this.name = 'PolicyNotFoundError';
  }
}

export class InvalidPolicyError extends AuthorizationError {
  constructor(message: string = 'Invalid policy definition') {
    super(message, 'INVALID_POLICY', 400);
    this.name = 'InvalidPolicyError';
  }
}
