// Paddle RBAC Manager - Central Control
// Single Source of Truth for all modules

import type {
  RoleEntity,
  PermissionEntity,
  RolePermissionEntity,
  UserEntity,
  ApiScopeEntity,
  AuditLogEntity,
  RolePermissions,
  PermissionGrant,
  CreateRoleInput,
  UpdateRoleInput,
  AssignPermissionsInput,
  UpdateUserRoleInput,
  UpdateApiScopeInput,
  PlanGateRestriction,
  SyncEvent,
  PermissionConflict,
  RoleExport,
  RoleImport,
} from './types';
import { SEED_SYSTEM_ROLES, SEED_PERMISSIONS, SEED_API_SCOPES } from './schema';

// ============================================
// PLAN GATE RESTRICTIONS
// ============================================

const PLAN_GATE_RESTRICTIONS: PlanGateRestriction[] = [
  { permissionKey: 'marketplace.product.publish', blockedWhenPlanInactive: true },
  { permissionKey: 'paddle.payment.process', blockedWhenPlanInactive: true },
  { permissionKey: 'paddle.payout.manage', blockedWhenPlanInactive: true },
  { permissionKey: 'paddle.refund.process', blockedWhenPlanInactive: true },
];

// ============================================
// PADDLE RBAC MANAGER
// ============================================

export class PaddleRBACManager {
  private roles: Map<string, RoleEntity> = new Map();
  private permissions: Map<string, PermissionEntity> = new Map();
  private rolePermissions: Map<string, RolePermissionEntity> = new Map();
  private users: Map<string, UserEntity> = new Map();
  private apiScopes: Map<string, ApiScopeEntity> = new Map();
  private auditLogs: AuditLogEntity[] = [];
  private syncListeners: Set<(event: SyncEvent) => void> = new Set();

  constructor() {
    this.initializeSeedData();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeSeedData(): void {
    // Seed system roles
    SEED_SYSTEM_ROLES.forEach((role, index) => {
      const id = `role-${index + 1}`;
      this.roles.set(id, {
        id,
        ...role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Seed permissions
    SEED_PERMISSIONS.forEach((perm, index) => {
      const id = `perm-${index + 1}`;
      this.permissions.set(id, {
        id,
        ...perm,
        createdAt: new Date().toISOString(),
      });
    });

    // Seed API scopes
    SEED_API_SCOPES.forEach((scope, index) => {
      const id = `scope-${index + 1}`;
      this.apiScopes.set(id, {
        id,
        ...scope,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Assign all permissions to Super Admin
    const superAdminRole = Array.from(this.roles.values()).find(r => r.name === 'Super Admin');
    if (superAdminRole) {
      const permissions = Array.from(this.permissions.values());
      permissions.forEach(perm => {
        this.rolePermissions.set(
          `${superAdminRole.id}-${perm.id}`,
          {
            roleId: superAdminRole.id,
            permissionId: perm.id,
            read: true,
            write: true,
            delete: true,
            admin: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      });
    }
  }

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  createRole(input: CreateRoleInput): RoleEntity {
    const id = `role-${Date.now()}`;
    const role: RoleEntity = {
      id,
      name: input.name,
      type: input.type,
      status: 'active',
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(id, role);

    // Assign permissions if provided
    if (input.permissions) {
      input.permissions.forEach(perm => {
        this.rolePermissions.set(
          `${id}-${perm.permissionId}`,
          {
            roleId: id,
            permissionId: perm.permissionId,
            read: perm.read,
            write: perm.write,
            delete: perm.delete,
            admin: perm.admin,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      });
    }

    this.logAudit('role_created', 'system', id, { role });
    this.emitSync('role_created', id, { role });

    return role;
  }

  updateRole(roleId: string, input: UpdateRoleInput): RoleEntity | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    if (role.isLocked) {
      throw new Error('Cannot update locked system role');
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (input.name !== undefined && input.name !== role.name) {
      changes.name = { from: role.name, to: input.name };
      role.name = input.name;
    }

    if (input.status !== undefined && input.status !== role.status) {
      changes.status = { from: role.status, to: input.status };
      role.status = input.status;
    }

    role.updatedAt = new Date().toISOString();
    this.roles.set(roleId, role);

    this.logAudit('role_updated', 'system', roleId, { changes });
    this.emitSync('role_updated', roleId, { changes });

    return role;
  }

  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    if (role.isLocked) {
      throw new Error('Cannot delete locked system role');
    }

    // Check if role is in use
    const usersWithRole = Array.from(this.users.values()).filter(u => u.roleId === roleId);
    if (usersWithRole.length > 0) {
      throw new Error(`Cannot delete role: ${usersWithRole.length} users assigned`);
    }

    this.roles.delete(roleId);

    // Delete role permissions
    const keysToDelete: string[] = [];
    for (const key of this.rolePermissions.keys()) {
      if (key.startsWith(`${roleId}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.rolePermissions.delete(key));

    this.logAudit('role_deleted', 'system', roleId);
    this.emitSync('role_deleted', roleId);

    return true;
  }

  getRole(roleId: string): RoleEntity | null {
    return this.roles.get(roleId) || null;
  }

  getAllRoles(): RoleEntity[] {
    return Array.from(this.roles.values());
  }

  getRolesByType(type: 'system' | 'custom'): RoleEntity[] {
    return Array.from(this.roles.values()).filter(r => r.type === type);
  }

  getRoleUsageCount(roleId: string): number {
    return Array.from(this.users.values()).filter(u => u.roleId === roleId).length;
  }

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  getAllPermissions(): PermissionEntity[] {
    return Array.from(this.permissions.values());
  }

  getPermissionsByModule(module: string): PermissionEntity[] {
    return Array.from(this.permissions.values()).filter(p => p.module === module);
  }

  assignPermissions(input: AssignPermissionsInput): boolean {
    const role = this.roles.get(input.roleId);
    if (!role) return false;

    input.permissions.forEach(perm => {
      const key = `${input.roleId}-${perm.permissionId}`;
      const existing = this.rolePermissions.get(key);

      if (existing) {
        existing.read = perm.read;
        existing.write = perm.write;
        existing.delete = perm.delete;
        existing.admin = perm.admin;
        existing.updatedAt = new Date().toISOString();
        this.rolePermissions.set(key, existing);
      } else {
        this.rolePermissions.set(key, {
          roleId: input.roleId,
          permissionId: perm.permissionId,
          read: perm.read,
          write: perm.write,
          delete: perm.delete,
          admin: perm.admin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this.logAudit('permission_assigned', 'system', input.roleId, { permissions: input.permissions });
    this.emitSync('permission_assigned', input.roleId, { permissions: input.permissions });

    return true;
  }

  getRolePermissions(roleId: string): RolePermissions | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    const permissions = new Map<string, PermissionGrant>();
    const rolePerms = Array.from(this.rolePermissions.values()).filter(rp => rp.roleId === roleId);

    rolePerms.forEach(rp => {
      const perm = this.permissions.get(rp.permissionId);
      if (perm) {
        permissions.set(perm.module, {
          module: perm.module as any,
          read: rp.read,
          write: rp.write,
          delete: rp.delete,
          admin: rp.admin,
        });
      }
    });

    return {
      roleId,
      roleName: role.name,
      permissions,
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  updateUserRole(input: UpdateUserRoleInput): boolean {
    const user = this.users.get(input.userId);
    if (!user) return false;

    const oldRoleId = user.roleId;
    user.roleId = input.roleId;
    user.updatedAt = new Date().toISOString();

    this.users.set(input.userId, user);

    this.logAudit('user_role_updated', input.userId, input.roleId, { oldRoleId, newRoleId: input.roleId });
    this.emitSync('role_updated', input.roleId, { userId: input.userId });

    return true;
  }

  getUsersByRole(roleId: string): UserEntity[] {
    return Array.from(this.users.values()).filter(u => u.roleId === roleId);
  }

  // ============================================
  // API SCOPE MANAGEMENT
  // ============================================

  getAllApiScopes(): ApiScopeEntity[] {
    return Array.from(this.apiScopes.values());
  }

  updateApiScope(input: UpdateApiScopeInput): boolean {
    const scope = Array.from(this.apiScopes.values()).find(s => s.scopeKey === input.scopeKey);
    if (!scope) return false;

    scope.enabled = input.enabled;
    scope.updatedAt = new Date().toISOString();

    this.logAudit('api_scope_updated', 'system', scope.id, { scopeKey: input.scopeKey, enabled: input.enabled });

    return true;
  }

  // ============================================
  // PERMISSION CHECKING
  // ============================================

  hasPermission(userId: string, permissionKey: string, action: 'read' | 'write' | 'delete' | 'admin' = 'read'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    // Check if user is suspended
    if (user.status === 'suspended') return false;

    const rolePerms = this.getRolePermissions(user.roleId);
    if (!rolePerms) return false;

    // Find the permission
    const permission = Array.from(this.permissions.values()).find(p => p.key === permissionKey);
    if (!permission) return false;

    const grant = rolePerms.permissions.get(permission.module);
    if (!grant) return false;

    // Check plan gate restrictions
    if (!user.planActive) {
      const restriction = PLAN_GATE_RESTRICTIONS.find(r => r.permissionKey === permissionKey);
      if (restriction && restriction.blockedWhenPlanInactive) {
        return false;
      }
    }

    return grant[action];
  }

  hasModuleAccess(userId: string, module: string, action: 'read' | 'write' | 'delete' | 'admin' = 'read'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    if (user.status === 'suspended') return false;

    const rolePerms = this.getRolePermissions(user.roleId);
    if (!rolePerms) return false;

    const grant = rolePerms.permissions.get(module);
    if (!grant) return false;

    return grant[action];
  }

  // ============================================
  // CONFLICT DETECTION
  // ============================================

  detectConflicts(roleId: string): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const role = this.roles.get(roleId);
    if (!role) return conflicts;

    const rolePerms = this.getRolePermissions(roleId);
    if (!rolePerms) return conflicts;

    // Check for plan gate conflicts
    if (rolePerms.permissions.size > 0) {
      rolePerms.permissions.forEach((grant, module) => {
        const permission = Array.from(this.permissions.values()).find(p => p.module === module);
        if (permission) {
          const restriction = PLAN_GATE_RESTRICTIONS.find(r => r.permissionKey === permission.key);
          if (restriction && restriction.blockedWhenPlanInactive) {
            conflicts.push({
              roleId,
              permissionId: permission.id,
              conflictType: 'denied_by_plan',
              message: `Permission ${permission.key} is blocked when plan is inactive`,
            });
          }
        }
      });
    }

    return conflicts;
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  exportRole(roleId: string, exportedBy: string): RoleExport | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    const rolePerms = Array.from(this.rolePermissions.values()).filter(rp => rp.roleId === roleId);

    return {
      role,
      permissions: rolePerms,
      exportedAt: new Date().toISOString(),
      exportedBy,
    };
  }

  importRole(data: RoleImport, importedBy: string): RoleEntity {
    const id = `role-${Date.now()}`;
    const role: RoleEntity = {
      id,
      ...data.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(id, role);

    data.permissions.forEach(perm => {
      const permissionId = perm.permissionId;
      this.rolePermissions.set(
        `${id}-${permissionId}`,
        {
          roleId: id,
          permissionId,
          read: perm.read,
          write: perm.write,
          delete: perm.delete,
          admin: perm.admin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    });

    this.logAudit('role_imported', importedBy, id, { role });
    this.emitSync('role_created', id, { role });

    return role;
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  private logAudit(action: string, userId: string, roleId?: string, metadata?: Record<string, unknown>): void {
    const log: AuditLogEntity = {
      id: `audit-${Date.now()}`,
      action,
      userId,
      roleId,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.push(log);
  }

  getAuditLogs(filters?: { userId?: string; roleId?: string; action?: string }): AuditLogEntity[] {
    let logs = [...this.auditLogs];

    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters?.roleId) {
      logs = logs.filter(l => l.roleId === filters.roleId);
    }
    if (filters?.action) {
      logs = logs.filter(l => l.action === filters.action);
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================
  // SYNC ENGINE
  // ============================================

  onSync(listener: (event: SyncEvent) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private emitSync(type: SyncEvent['type'], roleId: string, data?: Record<string, unknown>): void {
    const event: SyncEvent = {
      type,
      roleId,
      timestamp: new Date().toISOString(),
      data,
    };

    this.syncListeners.forEach(listener => listener(event));
  }

  forceSync(): void {
    this.emitSync('role_updated', 'system', { force: true });
  }

  // ============================================
  // SELF-HEALING
  // ============================================

  healMissingPermissions(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    const rolePerms = this.getRolePermissions(roleId);
    if (!rolePerms) return false;

    let healed = false;

    // Ensure at least read permissions for assigned modules
    rolePerms.permissions.forEach((grant, module) => {
      if (!grant.read && !grant.write && !grant.delete && !grant.admin) {
        grant.read = true;
        healed = true;
      }
    });

    if (healed) {
      this.logAudit('permissions_healed', 'system', roleId);
      this.emitSync('permission_assigned', roleId);
    }

    return healed;
  }

  healUserRole(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const role = this.roles.get(user.roleId);
    if (!role) {
      // Assign default user role
      const defaultRole = Array.from(this.roles.values()).find(r => r.name === 'User');
      if (defaultRole) {
        user.roleId = defaultRole.id;
        user.updatedAt = new Date().toISOString();
        this.users.set(userId, user);
        this.logAudit('user_role_healed', userId, defaultRole.id);
        return true;
      }
    }

    return false;
  }

  cleanupDuplicateRoles(): number {
    const nameMap = new Map<string, string[]>();
    let cleaned = 0;

    // Find duplicates
    this.roles.forEach((role, id) => {
      const existing = nameMap.get(role.name) || [];
      existing.push(id);
      nameMap.set(role.name, existing);
    });

    // Remove duplicates (keep first, delete rest)
    nameMap.forEach((ids, name) => {
      if (ids.length > 1) {
        ids.slice(1).forEach(id => {
          const role = this.roles.get(id);
          if (role && !role.isLocked) {
            this.roles.delete(id);
            cleaned++;
          }
        });
      }
    });

    if (cleaned > 0) {
      this.logAudit('duplicate_roles_cleaned', 'system', undefined, { count: cleaned });
    }

    return cleaned;
  }
}

// Export singleton instance
export const paddleRBACManager = new PaddleRBACManager();
