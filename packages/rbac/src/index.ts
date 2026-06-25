/**
 * @aether/rbac - Role-Based Access Control
 */

export class RBAC {
  private roles: Map<string, string[]> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  
  addRole(role: string, permissions: string[]): void {
    this.roles.set(role, permissions);
  }
  
  assignRole(userId: string, role: string): void {
    const roles = this.userRoles.get(userId) || [];
    roles.push(role);
    this.userRoles.set(userId, roles);
  }
  
  hasPermission(userId: string, permission: string): boolean {
    const roles = this.userRoles.get(userId) || [];
    for (const role of roles) {
      if (this.roles.get(role)?.includes(permission)) {
        return true;
      }
    }
    return false;
  }
}

export const rbac = new RBAC();