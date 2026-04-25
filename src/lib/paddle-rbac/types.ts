// Paddle RBAC - Central Role & Permission System
// Single Source of Truth for all modules

// ============================================
// ROLE TYPES
// ============================================

export type RoleType = 'system' | 'custom';

export type RoleStatus = 'active' | 'suspended';

export type SystemRole = 
  | 'super_admin'
  | 'platform_admin'
  | 'module_admin'
  | 'manager'
  | 'user';

export type CustomRole = 
  | 'reseller'
  | 'influencer'
  | 'developer'
  | 'affiliate'
  | 'partner'
  | 'franchise'
  | 'sales_team'
  | 'creator';

export type Role = SystemRole | CustomRole;

// ============================================
// PERMISSION TYPES
// ============================================

export type PermissionAction = 'read' | 'write' | 'delete' | 'admin';

export type Module = 
  | 'system'
  | 'marketplace'
  | 'paddle'
  | 'server'
  | 'developer'
  | 'partner'
  | 'support'
  | 'chat'
  | 'productivity'
  | 'influencer'
  | 'ai_builder';

export type PermissionKey = string; // Flexible to support both module.action and module:action formats

// ============================================
// ROLE ENTITY
// ============================================

export interface RoleEntity {
  id: string;
  name: string;
  type: RoleType;
  status: RoleStatus;
  isLocked: boolean; // System roles cannot be deleted
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PERMISSION ENTITY
// ============================================

export interface PermissionEntity {
  id: string;
  key: PermissionKey;
  module: Module;
  description: string;
  createdAt: string;
}

// ============================================
// ROLE PERMISSION ENTITY
// ============================================

export interface RolePermissionEntity {
  roleId: string;
  permissionId: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER ENTITY (extended)
// ============================================

export interface UserEntity {
  id: string;
  email: string;
  name?: string;
  roleId: string;
  planActive: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API SCOPE ENTITY
// ============================================

export interface ApiScopeEntity {
  id: string;
  scopeKey: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// AUDIT LOG ENTITY
// ============================================

export interface AuditLogEntity {
  id: string;
  action: string;
  userId: string;
  roleId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface AuditLogCreateInput {
  action: string;
  userId: string;
  roleId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// ============================================
// PERMISSION GRANT (runtime)
// ============================================

export interface PermissionGrant {
  module: Module;
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

// ============================================
// ROLE PERMISSIONS (runtime)
// ============================================

export interface RolePermissions {
  roleId: string;
  roleName: string;
  permissions: Map<string, PermissionGrant>;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateRoleInput {
  name: string;
  type: RoleType;
  permissions?: Array<{
    permissionId: string;
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  }>;
}

export interface UpdateRoleInput {
  name?: string;
  status?: RoleStatus;
}

export interface AssignPermissionsInput {
  roleId: string;
  permissions: Array<{
    permissionId: string;
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  }>;
}

export interface UpdateUserRoleInput {
  userId: string;
  roleId: string;
}

export interface UpdateApiScopeInput {
  scopeKey: string;
  enabled: boolean;
}

// ============================================
// PLAN GATE RESTRICTIONS
// ============================================

export interface PlanGateRestriction {
  permissionKey: PermissionKey;
  blockedWhenPlanInactive: boolean;
}

// ============================================
// SYNC EVENT
// ============================================

export interface SyncEvent {
  type: 'role_created' | 'role_updated' | 'role_deleted' | 'permission_assigned' | 'permission_revoked';
  roleId: string;
  userId?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ============================================
// CONFLICT WARNING
// ============================================

export interface PermissionConflict {
  roleId: string;
  permissionId: string;
  conflictType: 'overlap' | 'denied_by_plan' | 'missing';
  message: string;
}

// ============================================
// EXPORT/IMPORT TYPES
// ============================================

export interface RoleExport {
  role: RoleEntity;
  permissions: RolePermissionEntity[];
  exportedAt: string;
  exportedBy: string;
}

export interface RoleImport {
  role: Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>;
  permissions: Array<Omit<RolePermissionEntity, 'roleId' | 'createdAt' | 'updatedAt'>>;
}
