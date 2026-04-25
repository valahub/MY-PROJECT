// Paddle Route Guard - React Router Integration
// Protects routes using Paddle RBAC middleware

import { Navigate } from "react-router-dom";
import { usePaddleRBAC } from "@/contexts/PaddleRBACContext";
import { routeGuardMiddleware } from "@/lib/paddle-rbac";
import type { Module, PermissionAction } from "@/lib/paddle-rbac";

interface PaddleRouteGuardProps {
  children: React.ReactNode;
  permissionKey?: string;
  module?: Module;
  resource?: string;
  action?: PermissionAction;
  requireActivePlan?: boolean;
  fallbackPath?: string;
}

export function PaddleRouteGuard({
  children,
  permissionKey,
  module,
  resource,
  action = "read",
  requireActivePlan = false,
  fallbackPath = "/",
}: PaddleRouteGuardProps) {
  const { userRoleId, planActive, userStatus, loading } = usePaddleRBAC();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check if user is suspended
  if (userStatus === "suspended") {
    return <Navigate to="/suspended" replace />;
  }

  // Check plan gate if required
  if (requireActivePlan && !planActive) {
    return <Navigate to="/upgrade" replace />;
  }

  // Check permission/module access
  if (userRoleId) {
    const config = {
      permissionKey,
      module,
      resource,
      action,
      requireActivePlan,
    };

    const result = routeGuardMiddleware.canAccessRoute(userRoleId, config);

    if (!result.allowed) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}

// HOC for wrapping components with route guard
export function withPaddleRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardConfig: Omit<PaddleRouteGuardProps, "children">
) {
  return function GuardedComponent(props: P) {
    return (
      <PaddleRouteGuard {...guardConfig}>
        <Component {...props} />
      </PaddleRouteGuard>
    );
  };
}
