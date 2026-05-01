// Role-Based Access Control (RBAC) for Dashboard
// Restricts endpoints based on merchant/admin roles

// ============================================
// ROLE DEFINITIONS
// ============================================

export type UserRole = 'merchant' | 'admin' | 'superadmin';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewRevenue: boolean;
  canViewCustomers: boolean;
  canViewSubscriptions: boolean;
  canViewAlerts: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
  canManageUsers: boolean;
  canManageMerchants: boolean;
  canExportData: boolean;
  canAccessAPI: boolean;
  canViewAuditLogs: boolean;
  canManageIntegrations: boolean;
}

// ============================================
// PERMISSIONS BY ROLE
// ============================================

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  merchant: {
    canViewDashboard: true,
    canViewRevenue: true,
    canViewCustomers: true,
    canViewSubscriptions: true,
    canViewAlerts: true,
    canViewSettings: true,
    canEditSettings: true,
    canManageUsers: false,
    canManageMerchants: false,
    canExportData: true,
    canAccessAPI: true,
    canViewAuditLogs: false,
    canManageIntegrations: true,
  },
  admin: {
    canViewDashboard: true,
    canViewRevenue: true,
    canViewCustomers: true,
    canViewSubscriptions: true,
    canViewAlerts: true,
    canViewSettings: true,
    canEditSettings: true,
    canManageUsers: true,
    canManageMerchants: false,
    canExportData: true,
    canAccessAPI: true,
    canViewAuditLogs: true,
    canManageIntegrations: true,
  },
  superadmin: {
    canViewDashboard: true,
    canViewRevenue: true,
    canViewCustomers: true,
    canViewSubscriptions: true,
    canViewAlerts: true,
    canViewSettings: true,
    canEditSettings: true,
    canManageUsers: true,
    canManageMerchants: true,
    canExportData: true,
    canAccessAPI: true,
    canViewAuditLogs: true,
    canManageIntegrations: true,
  },
};

// ============================================
// ENDPOINT PERMISSIONS
// ============================================

export interface EndpointPermission {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredRoles: UserRole[];
  requiredPermissions?: (keyof RolePermissions)[];
}

const ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  // Dashboard
  { path: '/api/dashboard/metrics', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/dashboard/revenue', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/dashboard/subscriptions', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/dashboard/alerts', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  
  // Customers
  { path: '/api/customers', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/customers', method: 'POST', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/customers/:id', method: 'PUT', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/customers/:id', method: 'DELETE', requiredRoles: ['admin', 'superadmin'] },
  
  // Subscriptions
  { path: '/api/subscriptions', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/subscriptions', method: 'POST', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/subscriptions/:id', method: 'PUT', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/subscriptions/:id', method: 'DELETE', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  
  // Settings
  { path: '/api/settings', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'] },
  { path: '/api/settings', method: 'PUT', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canEditSettings'] },
  
  // Users (admin only)
  { path: '/api/users', method: 'GET', requiredRoles: ['admin', 'superadmin'], requiredPermissions: ['canManageUsers'] },
  { path: '/api/users', method: 'POST', requiredRoles: ['admin', 'superadmin'], requiredPermissions: ['canManageUsers'] },
  { path: '/api/users/:id', method: 'PUT', requiredRoles: ['admin', 'superadmin'], requiredPermissions: ['canManageUsers'] },
  { path: '/api/users/:id', method: 'DELETE', requiredRoles: ['superadmin'], requiredPermissions: ['canManageUsers'] },
  
  // Merchants (superadmin only)
  { path: '/api/merchants', method: 'GET', requiredRoles: ['superadmin'], requiredPermissions: ['canManageMerchants'] },
  { path: '/api/merchants', method: 'POST', requiredRoles: ['superadmin'], requiredPermissions: ['canManageMerchants'] },
  { path: '/api/merchants/:id', method: 'PUT', requiredRoles: ['superadmin'], requiredPermissions: ['canManageMerchants'] },
  { path: '/api/merchants/:id', method: 'DELETE', requiredRoles: ['superadmin'], requiredPermissions: ['canManageMerchants'] },
  
  // Audit Logs
  { path: '/api/audit-logs', method: 'GET', requiredRoles: ['admin', 'superadmin'], requiredPermissions: ['canViewAuditLogs'] },
  
  // Integrations
  { path: '/api/integrations', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canManageIntegrations'] },
  { path: '/api/integrations', method: 'POST', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canManageIntegrations'] },
  { path: '/api/integrations/:id', method: 'PUT', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canManageIntegrations'] },
  { path: '/api/integrations/:id', method: 'DELETE', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canManageIntegrations'] },
  
  // Export
  { path: '/api/export/:type', method: 'GET', requiredRoles: ['merchant', 'admin', 'superadmin'], requiredPermissions: ['canExportData'] },
];

// ============================================
// RBAC MANAGER
// ============================================

export class RBACManager {
  // Check if role has permission
  hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
    return ROLE_PERMISSIONS[role][permission];
  }

  // Get all permissions for a role
  getPermissions(role: UserRole): RolePermissions {
    return { ...ROLE_PERMISSIONS[role] };
  }

  // Check if role can access endpoint
  canAccessEndpoint(role: UserRole, path: string, method: string): boolean {
    const endpoint = ENDPOINT_PERMISSIONS.find(
      (ep) => this.matchPath(ep.path, path) && ep.method === method.toUpperCase()
    );

    if (!endpoint) {
      // If endpoint not defined, default to deny
      return false;
    }

    // Check if role is in required roles
    if (!endpoint.requiredRoles.includes(role)) {
      return false;
    }

    // Check if role has required permissions
    if (endpoint.requiredPermissions) {
      const hasAllPermissions = endpoint.requiredPermissions.every((perm) =>
        this.hasPermission(role, perm)
      );
      if (!hasAllPermissions) {
        return false;
      }
    }

    return true;
  }

  // Match path with parameters (e.g., /api/customers/:id matches /api/customers/123)
  private matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      // If pattern part is a parameter (starts with :), it matches anything
      if (patternPart.startsWith(':')) {
        continue;
      }

      // Otherwise, exact match required
      if (patternPart !== pathPart) {
        return false;
      }
    }

    return true;
  }

  // Get allowed endpoints for a role
  getAllowedEndpoints(role: UserRole): EndpointPermission[] {
    return ENDPOINT_PERMISSIONS.filter((endpoint) => {
      if (!endpoint.requiredRoles.includes(role)) {
        return false;
      }

      if (endpoint.requiredPermissions) {
        const hasAllPermissions = endpoint.requiredPermissions.every((perm) =>
          this.hasPermission(role, perm)
        );
        return hasAllPermissions;
      }

      return true;
    });
  }

  // Check if user can perform action on resource
  canPerformAction(
    role: UserRole,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'admin'
  ): boolean {
    // Map resources to permissions
    const resourcePermissionMap: Record<string, keyof RolePermissions> = {
      dashboard: 'canViewDashboard',
      revenue: 'canViewRevenue',
      customers: 'canViewCustomers',
      subscriptions: 'canViewSubscriptions',
      alerts: 'canViewAlerts',
      settings: 'canViewSettings',
      users: 'canManageUsers',
      merchants: 'canManageMerchants',
      audit_logs: 'canViewAuditLogs',
      integrations: 'canManageIntegrations',
    };

    const permission = resourcePermissionMap[resource];
    if (!permission) {
      return false;
    }

    // For delete action, require admin or superadmin
    if (action === 'delete' && role === 'merchant') {
      return false;
    }

    // For admin action, require admin or superadmin
    if (action === 'admin' && role === 'merchant') {
      return false;
    }

    return this.hasPermission(role, permission);
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();

// ============================================
// REACT HOOK FOR RBAC
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function useRBAC() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);

  // Get user role from token
  const getUserRole = useCallback((): UserRole | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.role as UserRole;
    } catch {
      return null;
    }
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!userRole) return false;
    return rbacManager.hasPermission(userRole, permission);
  }, [userRole]);

  // Check if user can access endpoint
  const canAccessEndpoint = useCallback((path: string, method: string): boolean => {
    if (!userRole) return false;
    return rbacManager.canAccessEndpoint(userRole, path, method);
  }, [userRole]);

  // Check if user can perform action
  const canPerformAction = useCallback((
    resource: string,
    action: 'read' | 'write' | 'delete' | 'admin'
  ): boolean => {
    if (!userRole) return false;
    return rbacManager.canPerformAction(userRole, resource, action);
  }, [userRole]);

  // Get all permissions
  const getAllPermissions = useCallback((): RolePermissions | null => {
    if (!userRole) return null;
    return rbacManager.getPermissions(userRole);
  }, [userRole]);

  // Get allowed endpoints
  const getAllowedEndpoints = useCallback((): EndpointPermission[] => {
    if (!userRole) return [];
    return rbacManager.getAllowedEndpoints(userRole);
  }, [userRole]);

  // Initialize on mount
  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    if (role) {
      setPermissions(rbacManager.getPermissions(role));
    }
  }, [getUserRole]);

  return {
    userRole,
    permissions,
    hasPermission,
    canAccessEndpoint,
    canPerformAction,
    getAllPermissions,
    getAllowedEndpoints,
  };
}

// ============================================
// PERMISSION GATE COMPONENT
// ============================================

import { ReactNode } from 'react';

interface PermissionGateProps {
  permission: keyof RolePermissions;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useRBAC();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ROLE GATE COMPONENT
// ============================================

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { userRole } = useRBAC();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ROUTE GUARD HOOK
// ============================================

export function useRouteGuard(requiredRole?: UserRole, requiredPermissions?: (keyof RolePermissions)[]) {
  const { userRole, hasPermission } = useRBAC();

  const isAuthorized = useCallback((): boolean => {
    if (!userRole) return false;

    if (requiredRole && userRole !== requiredRole) {
      return false;
    }

    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every((perm) => hasPermission(perm));
      if (!hasAllPermissions) {
        return false;
      }
    }

    return true;
  }, [userRole, requiredRole, requiredPermissions, hasPermission]);

  return {
    isAuthorized: isAuthorized(),
    userRole,
  };
}
