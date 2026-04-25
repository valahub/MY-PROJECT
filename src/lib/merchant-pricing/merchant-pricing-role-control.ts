// Merchant Pricing Role Control
// Owner/Manager/Staff permissions enforcement
// STRICT: Role-based access control at API + UI

import type { MerchantRole, MerchantPricingPermissionCheck } from './merchant-pricing-types';

// ============================================
// ROLE PERMISSIONS
// ============================================

export interface RolePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canView: boolean;
  canDelete: boolean;
  canManageFeatures: boolean;
  canManageTrial: boolean;
}

// ============================================
// MERCHANT PRICING ROLE CONTROL
// ============================================

export class MerchantPricingRoleControl {
  // ============================================
  // GET ROLE PERMISSIONS
  // ============================================

  getRolePermissions(role: MerchantRole): RolePermissions {
    switch (role) {
      case 'owner':
        return {
          canCreate: true,
          canEdit: true,
          canArchive: true,
          canView: true,
          canDelete: true,
          canManageFeatures: true,
          canManageTrial: true,
        };

      case 'manager':
        return {
          canCreate: true,
          canEdit: true,
          canArchive: true,
          canView: true,
          canDelete: false,
          canManageFeatures: true,
          canManageTrial: false,
        };

      case 'staff':
        return {
          canCreate: false,
          canEdit: false,
          canArchive: false,
          canView: true,
          canDelete: false,
          canManageFeatures: false,
          canManageTrial: false,
        };

      default:
        return {
          canCreate: false,
          canEdit: false,
          canArchive: false,
          canView: false,
          canDelete: false,
          canManageFeatures: false,
          canManageTrial: false,
        };
    }
  }

  // ============================================
  // CHECK PERMISSIONS
  // ============================================

  checkPermissions(role: MerchantRole): MerchantPricingPermissionCheck {
    const permissions = this.getRolePermissions(role);

    return {
      canCreate: permissions.canCreate,
      canEdit: permissions.canEdit,
      canArchive: permissions.canArchive,
      canView: permissions.canView,
    };
  }

  // ============================================
  // CAN CREATE
  // ============================================

  canCreate(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canCreate;
  }

  // ============================================
  // CAN EDIT
  // ============================================

  canEdit(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canEdit;
  }

  // ============================================
  // CAN ARCHIVE
  // ============================================

  canArchive(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canArchive;
  }

  // ============================================
  // CAN VIEW
  // ============================================

  canView(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canView;
  }

  // ============================================
  // CAN DELETE
  // ============================================

  canDelete(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canDelete;
  }

  // ============================================
  // CAN MANAGE FEATURES
  // ============================================

  canManageFeatures(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canManageFeatures;
  }

  // ============================================
  // CAN MANAGE TRIAL
  // ============================================

  canManageTrial(role: MerchantRole): boolean {
    return this.getRolePermissions(role).canManageTrial;
  }

  // ============================================
  // VALIDATE ACTION
  // ============================================

  validateAction(role: MerchantRole, action: 'create' | 'edit' | 'archive' | 'view' | 'delete'): {
    allowed: boolean;
    reason?: string;
  } {
    const permissions = this.getRolePermissions(role);

    switch (action) {
      case 'create':
        return {
          allowed: permissions.canCreate,
          reason: permissions.canCreate ? undefined : 'Staff role cannot create pricing plans',
        };

      case 'edit':
        return {
          allowed: permissions.canEdit,
          reason: permissions.canEdit ? undefined : 'Staff role cannot edit pricing plans',
        };

      case 'archive':
        return {
          allowed: permissions.canArchive,
          reason: permissions.canArchive ? undefined : 'Staff role cannot archive pricing plans',
        };

      case 'view':
        return {
          allowed: permissions.canView,
          reason: permissions.canView ? undefined : 'Access denied',
        };

      case 'delete':
        return {
          allowed: permissions.canDelete,
          reason: permissions.canDelete ? undefined : 'Only owner can delete pricing plans',
        };

      default:
        return {
          allowed: false,
          reason: 'Unknown action',
        };
    }
  }

  // ============================================
  // GET ROLE LABEL
  // ============================================

  getRoleLabel(role: MerchantRole): string {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'manager':
        return 'Manager';
      case 'staff':
        return 'Staff';
      default:
        return 'Unknown';
    }
  }

  // ============================================
  // GET ROLE DESCRIPTION
  // ============================================

  getRoleDescription(role: MerchantRole): string {
    switch (role) {
      case 'owner':
        return 'Full control over pricing plans';
      case 'manager':
        return 'Can create, edit, and archive pricing plans';
      case 'staff':
        return 'View-only access to pricing plans';
      default:
        return 'No access';
    }
  }

  // ============================================
  // GET ALL ROLES
  // ============================================

  getAllRoles(): Array<{ value: MerchantRole; label: string; description: string }> {
    return [
      {
        value: 'owner',
        label: this.getRoleLabel('owner'),
        description: this.getRoleDescription('owner'),
      },
      {
        value: 'manager',
        label: this.getRoleLabel('manager'),
        description: this.getRoleDescription('manager'),
      },
      {
        value: 'staff',
        label: this.getRoleLabel('staff'),
        description: this.getRoleDescription('staff'),
      },
    ];
  }
}

// Export singleton instance
export const merchantPricingRoleControl = new MerchantPricingRoleControl();

// ============================================
// REACT HOOK FOR ROLE CONTROL
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingRoleControl() {
  const checkPermissions = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.checkPermissions(role);
  }, []);

  const canCreate = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.canCreate(role);
  }, []);

  const canEdit = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.canEdit(role);
  }, []);

  const canArchive = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.canArchive(role);
  }, []);

  const canView = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.canView(role);
  }, []);

  const canDelete = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.canDelete(role);
  }, []);

  const validateAction = useCallback((role: MerchantRole, action: 'create' | 'edit' | 'archive' | 'view' | 'delete') => {
    return merchantPricingRoleControl.validateAction(role, action);
  }, []);

  const getRoleLabel = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.getRoleLabel(role);
  }, []);

  const getRoleDescription = useCallback((role: MerchantRole) => {
    return merchantPricingRoleControl.getRoleDescription(role);
  }, []);

  const getAllRoles = useCallback(() => {
    return merchantPricingRoleControl.getAllRoles();
  }, []);

  return {
    checkPermissions,
    canCreate,
    canEdit,
    canArchive,
    canView,
    canDelete,
    validateAction,
    getRoleLabel,
    getRoleDescription,
    getAllRoles,
  };
}
