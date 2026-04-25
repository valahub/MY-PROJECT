// Pricing RBAC
// Admin/merchant only for create/edit/archive operations

import { securityManager, useSecurity } from '../dashboard/security-layer';

// ============================================
// PRICING PERMISSIONS
// ============================================

export type PricingPermission = 'create' | 'edit' | 'archive' | 'restore' | 'view' | 'delete';

export interface PricingRolePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canView: boolean;
  canDelete: boolean;
}

// ============================================
// ROLE PERMISSIONS
// ============================================

const ROLE_PERMISSIONS: Record<string, PricingRolePermissions> = {
  superadmin: {
    canCreate: true,
    canEdit: true,
    canArchive: true,
    canRestore: true,
    canView: true,
    canDelete: true,
  },
  admin: {
    canCreate: true,
    canEdit: true,
    canArchive: true,
    canRestore: true,
    canView: true,
    canDelete: false,
  },
  merchant: {
    canCreate: true,
    canEdit: true,
    canArchive: true,
    canRestore: true,
    canView: true,
    canDelete: false,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canArchive: false,
    canRestore: false,
    canView: true,
    canDelete: false,
  },
};

// ============================================
// PRICING RBAC MANAGER
// ============================================

export class PricingRBACManager {
  // ============================================
  // CHECK PERMISSION
  // ============================================

  hasPermission(role: string, permission: PricingPermission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;

    switch (permission) {
      case 'create':
        return permissions.canCreate;
      case 'edit':
        return permissions.canEdit;
      case 'archive':
        return permissions.canArchive;
      case 'restore':
        return permissions.canRestore;
      case 'view':
        return permissions.canView;
      case 'delete':
        return permissions.canDelete;
      default:
        return false;
    }
  }

  // ============================================
  // GET ALL PERMISSIONS FOR ROLE
  // ============================================

  getPermissions(role: string): PricingRolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
  }

  // ============================================
  // CHECK IF USER CAN PERFORM ACTION
  // ============================================

  canPerformAction(userId: string, permission: PricingPermission): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const role = payload.role;

      return this.hasPermission(role, permission);
    } catch {
      return false;
    }
  }

  // ============================================
  // CHECK IF USER CAN MODIFY PLAN
  // ============================================

  canModifyPlan(userId: string, planId: string): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const role = payload.role;
      const userMerchantId = payload.merchantId;

      // Superadmin can modify any plan
      if (role === 'superadmin') return true;

      // Admin can modify any plan
      if (role === 'admin') return true;

      // Merchant can only modify their own plans
      if (role === 'merchant') {
        // In production, this would check if plan belongs to merchant
        // For now, assume merchant can modify if they have edit permission
        return this.hasPermission(role, 'edit');
      }

      return false;
    } catch {
      return false;
    }
  }

  // ============================================
  // SECURE API ENDPOINTS
  // ============================================

  secureEndpoint(endpoint: string, requiredPermission: PricingPermission): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    // Map endpoints to permissions
    const endpointPermissions: Record<string, PricingPermission> = {
      '/api/pricing/create': 'create',
      '/api/pricing/update': 'edit',
      '/api/pricing/archive': 'archive',
      '/api/pricing/restore': 'restore',
      '/api/pricing/delete': 'delete',
    };

    const permission = endpointPermissions[endpoint];
    if (!permission) return true; // Unknown endpoint, allow by default

    return this.canPerformAction('', permission);
  }
}

// Export singleton instance
export const pricingRBACManager = new PricingRBACManager();

// ============================================
// REACT HOOK FOR PRICING RBAC
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function usePricingRBAC() {
  const { isAuthenticated, userRole, merchantId } = useSecurity();
  const [permissions, setPermissions] = useState<PricingRolePermissions>({
    canCreate: false,
    canEdit: false,
    canArchive: false,
    canRestore: false,
    canView: false,
    canDelete: false,
  });

  useEffect(() => {
    if (userRole) {
      setPermissions(pricingRBACManager.getPermissions(userRole));
    }
  }, [userRole]);

  const hasPermission = useCallback((permission: PricingPermission): boolean => {
    if (!userRole) return false;
    return pricingRBACManager.hasPermission(userRole, permission);
  }, [userRole]);

  const canCreate = useCallback((): boolean => {
    return hasPermission('create');
  }, [hasPermission]);

  const canEdit = useCallback((): boolean => {
    return hasPermission('edit');
  }, [hasPermission]);

  const canArchive = useCallback((): boolean => {
    return hasPermission('archive');
  }, [hasPermission]);

  const canRestore = useCallback((): boolean => {
    return hasPermission('restore');
  }, [hasPermission]);

  const canView = useCallback((): boolean => {
    return hasPermission('view');
  }, [hasPermission]);

  const canDelete = useCallback((): boolean => {
    return hasPermission('delete');
  }, [hasPermission]);

  const canModifyPlan = useCallback((planId: string): boolean => {
    if (!isAuthenticated) return false;
    return pricingRBACManager.canModifyPlan('', planId);
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    userRole,
    merchantId,
    permissions,
    hasPermission,
    canCreate,
    canEdit,
    canArchive,
    canRestore,
    canView,
    canDelete,
    canModifyPlan,
  };
}

// ============================================
// PERMISSION GATE COMPONENT
// ============================================

import { ReactNode } from 'react';

interface PricingPermissionGateProps {
  permission: PricingPermission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PricingPermissionGate({ permission, children, fallback = null }: PricingPermissionGateProps) {
  const { hasPermission } = usePricingRBAC();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ROLE GATE COMPONENT
// ============================================

interface PricingRoleGateProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PricingRoleGate({ allowedRoles, children, fallback = null }: PricingRoleGateProps) {
  const { userRole } = usePricingRBAC();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
