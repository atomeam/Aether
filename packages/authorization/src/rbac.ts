/**
 * @aether/authorization - RBAC (Role-Based Access Control) Module
 * 
 * Role-based access control implementation with role hierarchy,
 * permission management, and user-role assignments
 */

import {
  Role,
  Permission,
  UserRole,
  RoleNotFoundError,
  PermissionNotFoundError
} from './types.js';
import { RoleSchema, PermissionSchema, UserRoleSchema } from './schemas.js';

export class RBACManager {
  private roles: Map<string, Role>;
  private permissions: Map<string, Permission>;
  private userRoles: Map<string, Set<string>>; // userId -> roleIds
  private rolePermissions: Map<string, Set<string>>; // roleId -> permissionIds

  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    this.rolePermissions = new Map();
  }

  // ============================================================================
  // Role Management
  // ============================================================================

  /**
   * Create a new role
   */
  createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const newRole: Role = {
      ...role,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validated = RoleSchema.parse(newRole);
    this.roles.set(validated.id, validated);
    this.rolePermissions.set(validated.id, new Set(validated.permissions));

    return validated;
  }

  /**
   * Get a role by ID
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get a role by name
   */
  getRoleByName(name: string): Role | null {
    for (const role of this.roles.values()) {
      if (role.name === name) {
        return role;
      }
    }
    return null;
  }

  /**
   * Update a role
   */
  updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Role | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    const updated: Role = {
      ...role,
      ...updates,
      id: roleId,
      createdAt: role.createdAt,
      updatedAt: new Date()
    };

    const validated = RoleSchema.parse(updated);
    this.roles.set(roleId, validated);

    // Update permissions cache if changed
    if (updates.permissions) {
      this.rolePermissions.set(roleId, new Set(updates.permissions));
    }

    return validated;
  }

  /**
   * Delete a role
   */
  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    this.roles.delete(roleId);
    this.rolePermissions.delete(roleId);

    // Remove role from all users
    for (const [userId, roleIds] of this.userRoles.entries()) {
      roleIds.delete(roleId);
    }

    return true;
  }

  /**
   * List all roles
   */
  listRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Create a new permission
   */
  createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Permission {
    const newPermission: Permission = {
      ...permission,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validated = PermissionSchema.parse(newPermission);
    this.permissions.set(validated.id, validated);

    return validated;
  }

  /**
   * Get a permission by ID
   */
  getPermission(permissionId: string): Permission | null {
    return this.permissions.get(permissionId) || null;
  }

  /**
   * Get a permission by name
   */
  getPermissionByName(name: string): Permission | null {
    for (const permission of this.permissions.values()) {
      if (permission.name === name) {
        return permission;
      }
    }
    return null;
  }

  /**
   * Update a permission
   */
  updatePermission(permissionId: string, updates: Partial<Omit<Permission, 'id' | 'createdAt'>>): Permission | null {
    const permission = this.permissions.get(permissionId);
    if (!permission) return null;

    const updated: Permission = {
      ...permission,
      ...updates,
      id: permissionId,
      createdAt: permission.createdAt,
      updatedAt: new Date()
    };

    const validated = PermissionSchema.parse(updated);
    this.permissions.set(permissionId, validated);

    return validated;
  }

  /**
   * Delete a permission
   */
  deletePermission(permissionId: string): boolean {
    const permission = this.permissions.get(permissionId);
    if (!permission) return false;

    this.permissions.delete(permissionId);

    // Remove permission from all roles
    for (const [roleId, permissionIds] of this.rolePermissions.entries()) {
      permissionIds.delete(permissionId);
    }

    // Update role objects
    for (const role of this.roles.values()) {
      role.permissions = role.permissions.filter(p => p !== permissionId);
    }

    return true;
  }

  /**
   * List all permissions
   */
  listPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  // ============================================================================
  // User-Role Management
  // ============================================================================

  /**
   * Assign a role to a user
   */
  assignRoleToUser(userId: string, roleId: string, assignedBy?: string, expiresAt?: Date): UserRole {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new RoleNotFoundError(`Role ${roleId} not found`);
    }

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }

    this.userRoles.get(userId)!.add(roleId);

    const userRole: UserRole = {
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
      expiresAt
    };

    return UserRoleSchema.parse(userRole);
  }

  /**
   * Remove a role from a user
   */
  removeRoleFromUser(userId: string, roleId: string): boolean {
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) return false;

    return userRoleSet.delete(roleId);
  }

  /**
   * Get all roles for a user
   */
  getUserRoles(userId: string): Role[] {
    const roleIds = this.userRoles.get(userId);
    if (!roleIds) return [];

    const roles: Role[] = [];
    for (const roleId of roleIds) {
      const role = this.roles.get(roleId);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Get all users for a role
   */
  getRoleUsers(roleId: string): string[] {
    const users: string[] = [];
    for (const [userId, roleIds] of this.userRoles.entries()) {
      if (roleIds.has(roleId)) {
        users.push(userId);
      }
    }
    return users;
  }

  /**
   * Check if user has a specific role
   */
  userHasRole(userId: string, roleId: string): boolean {
    const roleIds = this.userRoles.get(userId);
    return roleIds?.has(roleId) || false;
  }

  /**
   * Check if user has a role by name
   */
  userHasRoleByName(userId: string, roleName: string): boolean {
    const role = this.getRoleByName(roleName);
    if (!role) return false;
    return this.userHasRole(userId, role.id);
  }

  // ============================================================================
  // Permission Checking
  // ============================================================================

  /**
   * Check if a role has a specific permission
   */
  roleHasPermission(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    // Check direct permissions
    if (role.permissions.includes(permissionId)) {
      return true;
    }

    // Check inherited permissions
    if (role.inheritsFrom) {
      for (const inheritedRoleId of role.inheritsFrom) {
        if (this.roleHasPermission(inheritedRoleId, permissionId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a role has a permission by name
   */
  roleHasPermissionByName(roleId: string, permissionName: string): boolean {
    const permission = this.getPermissionByName(permissionName);
    if (!permission) return false;
    return this.roleHasPermission(roleId, permission.id);
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getRolePermissions(roleId: string): Permission[] {
    const permissions = new Set<string>();
    this.collectRolePermissions(roleId, permissions);

    const result: Permission[] = [];
    for (const permissionId of permissions) {
      const permission = this.permissions.get(permissionId);
      if (permission) {
        result.push(permission);
      }
    }

    return result;
  }

  /**
   * Recursively collect role permissions
   */
  private collectRolePermissions(roleId: string, permissions: Set<string>, visited = new Set<string>()): void {
    if (visited.has(roleId)) return;
    visited.add(roleId);

    const role = this.roles.get(roleId);
    if (!role) return;

    // Add direct permissions
    for (const permissionId of role.permissions) {
      permissions.add(permissionId);
    }

    // Add inherited permissions
    if (role.inheritsFrom) {
      for (const inheritedRoleId of role.inheritsFrom) {
        this.collectRolePermissions(inheritedRoleId, permissions, visited);
      }
    }
  }

  /**
   * Check if a user has a specific permission
   */
  userHasPermission(userId: string, permissionId: string): boolean {
    const roleIds = this.userRoles.get(userId);
    if (!roleIds) return false;

    for (const roleId of roleIds) {
      if (this.roleHasPermission(roleId, permissionId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a user has a permission by name
   */
  userHasPermissionByName(userId: string, permissionName: string): boolean {
    const permission = this.getPermissionByName(permissionName);
    if (!permission) return false;
    return this.userHasPermission(userId, permission.id);
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(userId: string): Permission[] {
    const permissions = new Set<string>();
    const roleIds = this.userRoles.get(userId);

    if (roleIds) {
      for (const roleId of roleIds) {
        const rolePermissions = this.getRolePermissions(roleId);
        for (const permission of rolePermissions) {
          permissions.add(permission.id);
        }
      }
    }

    const result: Permission[] = [];
    for (const permissionId of permissions) {
      const permission = this.permissions.get(permissionId);
      if (permission) {
        result.push(permission);
      }
    }

    return result;
  }

  /**
   * Add a permission to a role
   */
  addPermissionToRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    const permission = this.permissions.get(permissionId);

    if (!role || !permission) return false;

    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);
      role.updatedAt = new Date();
      this.rolePermissions.get(roleId)?.add(permissionId);
      return true;
    }

    return false;
  }

  /**
   * Remove a permission from a role
   */
  removePermissionFromRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    const index = role.permissions.indexOf(permissionId);
    if (index !== -1) {
      role.permissions.splice(index, 1);
      role.updatedAt = new Date();
      this.rolePermissions.get(roleId)?.delete(permissionId);
      return true;
    }

    return false;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.roles.clear();
    this.permissions.clear();
    this.userRoles.clear();
    this.rolePermissions.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalRBACManager: RBACManager | null = null;

export function setupRBACManager(): RBACManager {
  globalRBACManager = new RBACManager();
  return globalRBACManager;
}

export function getRBACManager(): RBACManager | null {
  return globalRBACManager;
}

export function createRBACManager(): RBACManager {
  return new RBACManager();
}
