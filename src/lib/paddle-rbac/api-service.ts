// Paddle RBAC API Service Layer
// Backend API endpoints for role management with cache and rate limiting

import { paddleRBACManager } from './manager';
import { rbacCache, standardApiLimiter, sensitiveApiLimiter, bulkApiLimiter } from './';
import type {
  RoleEntity,
  PermissionEntity,
  UserEntity,
  ApiScopeEntity,
  AuditLogEntity,
  CreateRoleInput,
  UpdateRoleInput,
  AssignPermissionsInput,
  UpdateUserRoleInput,
  UpdateApiScopeInput,
  RoleExport,
  RoleImport,
  PermissionConflict,
} from './types';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ============================================
// PADDLE RBAC API SERVICE
// ============================================

export class PaddleRBACApiService {
  private userId: string = 'system'; // Default to system for admin operations

  setUserId(userId: string): void {
    this.userId = userId;
  }

  // ============================================
  // ROLE ENDPOINTS
  // ============================================

  async getRoles(filters?: { type?: 'system' | 'custom'; status?: 'active' | 'suspended' }): Promise<ApiResponse<RoleEntity[]>> {
    const cacheKey = `roles:${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = rbacCache.get<RoleEntity[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // Rate limit check
    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      let roles = paddleRBACManager.getAllRoles();

      if (filters?.type) {
        roles = roles.filter(r => r.type === filters.type);
      }
      if (filters?.status) {
        roles = roles.filter(r => r.status === filters.status);
      }

      // Cache result
      rbacCache.set(cacheKey, roles, 2 * 60 * 1000); // 2 minutes

      return { success: true, data: roles };
    } catch (error) {
      return { success: false, error: 'Failed to fetch roles' };
    }
  }

  async getRole(roleId: string): Promise<ApiResponse<RoleEntity>> {
    const cacheKey = `role:${roleId}`;
    
    const cached = rbacCache.get<RoleEntity>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const role = paddleRBACManager.getRole(roleId);
      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      rbacCache.set(cacheKey, role, 5 * 60 * 1000); // 5 minutes

      return { success: true, data: role };
    } catch (error) {
      return { success: false, error: 'Failed to fetch role' };
    }
  }

  async createRole(input: CreateRoleInput): Promise<ApiResponse<RoleEntity>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const role = paddleRBACManager.createRole(input);
      
      // Invalidate cache
      rbacCache.invalidate('roles:');
      
      return { success: true, data: role, message: 'Role created successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create role' };
    }
  }

  async updateRole(roleId: string, input: UpdateRoleInput): Promise<ApiResponse<RoleEntity>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const role = paddleRBACManager.updateRole(roleId, input);
      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      // Invalidate cache
      rbacCache.invalidate('role:');
      rbacCache.invalidate('roles:');

      return { success: true, data: role, message: 'Role updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update role' };
    }
  }

  async deleteRole(roleId: string): Promise<ApiResponse<void>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const deleted = paddleRBACManager.deleteRole(roleId);
      if (!deleted) {
        return { success: false, error: 'Role not found' };
      }

      // Invalidate cache
      rbacCache.invalidate('role:');
      rbacCache.invalidate('roles:');

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete role' };
    }
  }

  async getRoleUsageCount(roleId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const count = paddleRBACManager.getRoleUsageCount(roleId);
      return { success: true, data: { count } };
    } catch (error) {
      return { success: false, error: 'Failed to fetch role usage count' };
    }
  }

  // ============================================
  // PERMISSION ENDPOINTS
  // ============================================

  async getPermissions(filters?: { module?: string }): Promise<ApiResponse<PermissionEntity[]>> {
    const cacheKey = `permissions:${JSON.stringify(filters)}`;
    
    const cached = rbacCache.get<PermissionEntity[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      let permissions = paddleRBACManager.getAllPermissions();

      if (filters?.module) {
        permissions = paddleRBACManager.getPermissionsByModule(filters.module);
      }

      rbacCache.set(cacheKey, permissions, 5 * 60 * 1000); // 5 minutes

      return { success: true, data: permissions };
    } catch (error) {
      return { success: false, error: 'Failed to fetch permissions' };
    }
  }

  async assignPermissions(input: AssignPermissionsInput): Promise<ApiResponse<void>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const assigned = paddleRBACManager.assignPermissions(input);
      if (!assigned) {
        return { success: false, error: 'Role not found' };
      }

      // Invalidate cache
      rbacCache.invalidate('role-permissions:');

      return { success: true, message: 'Permissions assigned successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign permissions' };
    }
  }

  async getRolePermissions(roleId: string): Promise<ApiResponse<any>> {
    const cacheKey = `role-permissions:${roleId}`;
    
    const cached = rbacCache.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const permissions = paddleRBACManager.getRolePermissions(roleId);
      if (!permissions) {
        return { success: false, error: 'Role not found' };
      }

      rbacCache.set(cacheKey, permissions, 2 * 60 * 1000); // 2 minutes

      return { success: true, data: permissions };
    } catch (error) {
      return { success: false, error: 'Failed to fetch role permissions' };
    }
  }

  // ============================================
  // USER ENDPOINTS
  // ============================================

  async getUsersByRole(roleId: string): Promise<ApiResponse<UserEntity[]>> {
    try {
      const users = paddleRBACManager.getUsersByRole(roleId);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: 'Failed to fetch users by role' };
    }
  }

  async updateUserRole(input: UpdateUserRoleInput): Promise<ApiResponse<void>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const updated = paddleRBACManager.updateUserRole(input);
      if (!updated) {
        return { success: false, error: 'User not found' };
      }

      // Invalidate cache
      rbacCache.invalidate('user:');

      return { success: true, message: 'User role updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update user role' };
    }
  }

  // ============================================
  // API SCOPE ENDPOINTS
  // ============================================

  async getApiScopes(): Promise<ApiResponse<ApiScopeEntity[]>> {
    const cacheKey = 'api-scopes';
    
    const cached = rbacCache.get<ApiScopeEntity[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const scopes = paddleRBACManager.getAllApiScopes();
      
      rbacCache.set(cacheKey, scopes, 5 * 60 * 1000); // 5 minutes

      return { success: true, data: scopes };
    } catch (error) {
      return { success: false, error: 'Failed to fetch API scopes' };
    }
  }

  async updateApiScope(input: UpdateApiScopeInput): Promise<ApiResponse<void>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const updated = paddleRBACManager.updateApiScope(input);
      if (!updated) {
        return { success: false, error: 'API scope not found' };
      }

      // Invalidate cache
      rbacCache.invalidate('api-scopes');

      return { success: true, message: 'API scope updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update API scope' };
    }
  }

  // ============================================
  // AUDIT LOG ENDPOINTS
  // ============================================

  async getAuditLogs(filters?: { userId?: string; roleId?: string; action?: string }): Promise<ApiResponse<AuditLogEntity[]>> {
    const cacheKey = `audit-logs:${JSON.stringify(filters)}`;
    
    const cached = rbacCache.get<AuditLogEntity[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const rateLimit = standardApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const logs = paddleRBACManager.getAuditLogs(filters);
      
      rbacCache.set(cacheKey, logs, 1 * 60 * 1000); // 1 minute (short cache for logs)

      return { success: true, data: logs };
    } catch (error) {
      return { success: false, error: 'Failed to fetch audit logs' };
    }
  }

  // ============================================
  // CONFLICT DETECTION
  // ============================================

  async detectConflicts(roleId: string): Promise<ApiResponse<PermissionConflict[]>> {
    try {
      const conflicts = paddleRBACManager.detectConflicts(roleId);
      return { success: true, data: conflicts };
    } catch (error) {
      return { success: false, error: 'Failed to detect conflicts' };
    }
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  async exportRole(roleId: string, exportedBy: string): Promise<ApiResponse<RoleExport>> {
    const rateLimit = bulkApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const exportData = paddleRBACManager.exportRole(roleId, exportedBy);
      if (!exportData) {
        return { success: false, error: 'Role not found' };
      }

      return { success: true, data: exportData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to export role' };
    }
  }

  async importRole(data: RoleImport, importedBy: string): Promise<ApiResponse<RoleEntity>> {
    const rateLimit = bulkApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const role = paddleRBACManager.importRole(data, importedBy);
      
      // Invalidate cache
      rbacCache.invalidate('role:');
      rbacCache.invalidate('roles:');

      return { success: true, data: role, message: 'Role imported successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to import role' };
    }
  }

  // ============================================
  // SYNC
  // ============================================

  async forceSync(): Promise<ApiResponse<void>> {
    try {
      paddleRBACManager.forceSync();
      
      // Invalidate all cache
      rbacCache.clear();

      return { success: true, message: 'Sync triggered successfully' };
    } catch (error) {
      return { success: false, error: 'Failed to trigger sync' };
    }
  }

  // ============================================
  // SELF-HEALING
  // ============================================

  async healMissingPermissions(roleId: string): Promise<ApiResponse<{ healed: boolean }>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const healed = paddleRBACManager.healMissingPermissions(roleId);
      
      // Invalidate cache
      rbacCache.invalidate('role-permissions:');

      return { success: true, data: { healed }, message: healed ? 'Permissions healed' : 'No healing needed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to heal permissions' };
    }
  }

  async healUserRole(userId: string): Promise<ApiResponse<{ healed: boolean }>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const healed = paddleRBACManager.healUserRole(userId);
      
      // Invalidate cache
      rbacCache.invalidate('user:');

      return { success: true, data: { healed }, message: healed ? 'User role healed' : 'No healing needed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to heal user role' };
    }
  }

  async cleanupDuplicateRoles(): Promise<ApiResponse<{ cleaned: number }>> {
    const rateLimit = sensitiveApiLimiter.check(this.userId);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      const cleaned = paddleRBACManager.cleanupDuplicateRoles();
      
      // Invalidate cache
      rbacCache.invalidate('role:');
      rbacCache.invalidate('roles:');

      return { success: true, data: { cleaned }, message: `Cleaned ${cleaned} duplicate roles` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cleanup duplicate roles' };
    }
  }
}

// Export singleton instance
export const paddleRBACApiService = new PaddleRBACApiService();
