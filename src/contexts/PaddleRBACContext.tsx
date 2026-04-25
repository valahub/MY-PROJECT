// Paddle RBAC Context - Global State for Permissions
// Integrates with AuthContext to provide permission checking across the app

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { paddleRBACManager, paddleRBACApiService } from "@/lib/paddle-rbac";
import type { RoleEntity, RolePermissions, PermissionAction, Module } from "@/lib/paddle-rbac";

export interface PaddleRBACContextValue {
  userRoleId: string | null;
  userRole: RoleEntity | null;
  rolePermissions: RolePermissions | null;
  planActive: boolean;
  userStatus: "active" | "suspended";
  loading: boolean;
  hasPermission: (permissionKey: string, action?: PermissionAction) => boolean;
  hasModuleAccess: (module: Module, action?: PermissionAction) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PaddleRBACContext = createContext<PaddleRBACContextValue | undefined>(undefined);

export function PaddleRBACProvider({ children }: { children: ReactNode }) {
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<RoleEntity | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [planActive, setPlanActive] = useState(true);
  const [userStatus, setUserStatus] = useState<"active" | "suspended">("active");
  const [loading, setLoading] = useState(true);

  // Load user permissions on mount
  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the authenticated user's session
      // For now, we'll use a default user ID for demonstration
      const userId = "user-demo-1";
      
      // Get user from Paddle RBAC manager
      const user = paddleRBACManager["users"].get(userId);
      
      if (user) {
        setUserRoleId(user.roleId);
        setPlanActive(user.planActive);
        setUserStatus(user.status);
        
        // Get role details
        const role = paddleRBACManager.getRole(user.roleId);
        if (role) {
          setUserRole(role);
          
          // Get role permissions
          const permissions = paddleRBACManager.getRolePermissions(user.roleId);
          setRolePermissions(permissions);
        }
      } else {
        // Create default user if not exists
        const defaultRole = Array.from(paddleRBACManager.getAllRoles()).find(r => r.name === "User");
        if (defaultRole) {
          paddleRBACManager["users"].set(userId, {
            id: userId,
            email: "demo@example.com",
            roleId: defaultRole.id,
            planActive: true,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          setUserRoleId(defaultRole.id);
          setUserRole(defaultRole);
          setPlanActive(true);
          setUserStatus("active");
          
          const permissions = paddleRBACManager.getRolePermissions(defaultRole.id);
          setRolePermissions(permissions);
        }
      }
    } catch (error) {
      console.error("Failed to load user permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  const hasPermission = (permissionKey: string, action: PermissionAction = "read"): boolean => {
    if (!userRoleId || !planActive || userStatus === "suspended") return false;
    
    // Check plan gate restrictions
    const blockedPermissions = [
      "marketplace.product.publish",
      "paddle.payment.process",
      "paddle.payout.manage",
      "paddle.refund.process",
    ];
    
    if (!planActive && blockedPermissions.includes(permissionKey)) {
      return false;
    }
    
    return paddleRBACManager.hasPermission("user-demo-1", permissionKey, action);
  };

  const hasModuleAccess = (module: Module, action: PermissionAction = "read"): boolean => {
    if (!userRoleId || !planActive || userStatus === "suspended") return false;
    return paddleRBACManager.hasModuleAccess("user-demo-1", module, action);
  };

  const value: PaddleRBACContextValue = {
    userRoleId,
    userRole,
    rolePermissions,
    planActive,
    userStatus,
    loading,
    hasPermission,
    hasModuleAccess,
    refreshPermissions,
  };

  return <PaddleRBACContext.Provider value={value}>{children}</PaddleRBACContext.Provider>;
}

export function usePaddleRBAC() {
  const ctx = useContext(PaddleRBACContext);
  if (!ctx) throw new Error("usePaddleRBAC must be used within PaddleRBACProvider");
  return ctx;
}
