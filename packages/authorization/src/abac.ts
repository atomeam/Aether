/**
 * @aether/authorization - ABAC (Attribute-Based Access Control) Module
 * 
 * Attribute-based access control implementation with policy evaluation,
 * condition matching, and flexible access control
 */

import {
  Policy,
  PolicyCondition,
  PolicyEvaluationContext,
  InvalidPolicyError
} from './types.js';
import { PolicySchema, PolicyConditionSchema, PolicyEvaluationContextSchema } from './schemas.js';

export class ABACManager {
  private policies: Map<string, Policy>;

  constructor() {
    this.policies = new Map();
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  /**
   * Create a new policy
   */
  createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Policy {
    const newPolicy: Policy = {
      ...policy,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validated = PolicySchema.parse(newPolicy);
    this.policies.set(validated.id, validated);

    return validated;
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): Policy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get a policy by name
   */
  getPolicyByName(name: string): Policy | null {
    for (const policy of this.policies.values()) {
      if (policy.name === name) {
        return policy;
      }
    }
    return null;
  }

  /**
   * Update a policy
   */
  updatePolicy(policyId: string, updates: Partial<Omit<Policy, 'id' | 'createdAt'>>): Policy | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updated: Policy = {
      ...policy,
      ...updates,
      id: policyId,
      createdAt: policy.createdAt,
      updatedAt: new Date()
    };

    const validated = PolicySchema.parse(updated);
    this.policies.set(policyId, validated);

    return validated;
  }

  /**
   * Delete a policy
   */
  deletePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * List all policies
   */
  listPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * List policies by effect
   */
  listPoliciesByEffect(effect: 'allow' | 'deny'): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.effect === effect);
  }

  // ============================================================================
  // Policy Evaluation
  // ============================================================================

  /**
   * Evaluate policies for a given context
   */
  evaluate(context: PolicyEvaluationContext): {
    allowed: boolean;
    matchedPolicies: Policy[];
    deniedBy?: string;
  } {
    const validated = PolicyEvaluationContextSchema.parse(context);

    // Get applicable policies
    const applicablePolicies = this.getApplicablePolicies(validated);

    // Sort by priority (higher priority first)
    applicablePolicies.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const matchedPolicies: Policy[] = [];

    // Evaluate policies
    for (const policy of applicablePolicies) {
      if (this.evaluatePolicy(policy, validated)) {
        matchedPolicies.push(policy);

        // Deny takes precedence
        if (policy.effect === 'deny') {
          return {
            allowed: false,
            matchedPolicies,
            deniedBy: policy.id
          };
        }
      }
    }

    // Default deny if no allow policies matched
    const hasAllowMatch = matchedPolicies.some(p => p.effect === 'allow');
    return {
      allowed: hasAllowMatch,
      matchedPolicies
    };
  }

  /**
   * Get applicable policies for a context
   */
  private getApplicablePolicies(context: PolicyEvaluationContext): Policy[] {
    const applicable: Policy[] = [];

    for (const policy of this.policies.values()) {
      if (this.isPolicyApplicable(policy, context)) {
        applicable.push(policy);
      }
    }

    return applicable;
  }

  /**
   * Check if a policy is applicable to a context
   */
  private isPolicyApplicable(policy: Policy, context: PolicyEvaluationContext): boolean {
    // Check subject match
    const subjectMatch = policy.subjects.some(subject => {
      if (subject === '*') return true;
      if (subject === context.subject.id) return true;
      if (subject.startsWith('role:') && context.subject.roles.includes(subject.slice(5))) return true;
      return false;
    });

    if (!subjectMatch) return false;

    // Check resource match
    const resourceMatch = policy.resources.some(resource => {
      if (resource === '*') return true;
      if (resource === context.resource.type) return true;
      if (resource === `${context.resource.type}:${context.resource.id}`) return true;
      return false;
    });

    if (!resourceMatch) return false;

    // Check action match
    const actionMatch = policy.actions.some(action => {
      if (action === '*') return true;
      if (action === context.action) return true;
      return false;
    });

    if (!actionMatch) return false;

    return true;
  }

  /**
   * Evaluate a single policy against a context
   */
  private evaluatePolicy(policy: Policy, context: PolicyEvaluationContext): boolean {
    // If no conditions, policy matches
    if (!policy.conditions || policy.conditions.length === 0) {
      return true;
    }

    // All conditions must match
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
    const value = this.getAttributeValue(condition.attribute, context);

    switch (condition.type) {
      case 'equals':
        return value === condition.value;

      case 'notEquals':
        return value !== condition.value;

      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);

      case 'notContains':
        return typeof value === 'string' && !value.includes(condition.value);

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);

      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(value);

      case 'greaterThan':
        return typeof value === 'number' && value > condition.value;

      case 'lessThan':
        return typeof value === 'number' && value < condition.value;

      case 'regex':
        if (typeof value !== 'string') return false;
        try {
          const regex = new RegExp(condition.value);
          return regex.test(value);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Get attribute value from context
   */
  private getAttributeValue(attribute: string, context: PolicyEvaluationContext): any {
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check if access is allowed
   */
  isAllowed(context: PolicyEvaluationContext): boolean {
    const result = this.evaluate(context);
    return result.allowed;
  }

  /**
   * Check if access is denied
   */
  isDenied(context: PolicyEvaluationContext): boolean {
    const result = this.evaluate(context);
    return !result.allowed;
  }

  /**
   * Get matched policies for a context
   */
  getMatchedPolicies(context: PolicyEvaluationContext): Policy[] {
    const result = this.evaluate(context);
    return result.matchedPolicies;
  }

  /**
   * Clear all policies
   */
  clear(): void {
    this.policies.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalABACManager: ABACManager | null = null;

export function setupABACManager(): ABACManager {
  globalABACManager = new ABACManager();
  return globalABACManager;
}

export function getABACManager(): ABACManager | null {
  return globalABACManager;
}

export function createABACManager(): ABACManager {
  return new ABACManager();
}
