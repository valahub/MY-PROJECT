// Route-level authorization middleware specifically for /admin/*.
// Blocks direct URL access for users without an allowed role BEFORE rendering
// any protected admin component. Logs every blocked attempt.
//
// Honors the demo "role" sessions stored in localStorage (`demo_role_session`)
// so the existing demo UI flows continue to work.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authHealer } from "@/lib/auth/auth-healer";
import { findRouteRule } from "@/lib/auth/route-permissions";

function hasDemoRoleSession(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem("demo_role_session");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === "object" && "key" in parsed);
  } catch {
    return false;
  }
}

export function AdminRouteGuard() {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  // Demo flow bypass — UI-only role demo sessions are explicitly allowed.
  if (hasDemoRoleSession()) {
    return <Outlet />;
  }

  if (!user) {
    authHealer.log("permission_denied", "unauthenticated_admin_access", {
      path: location.pathname,
    });
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  const rule = findRouteRule(location.pathname) ?? findRouteRule("/admin");
  const allowedRoles = rule?.roles ?? ["admin"];
  const allowed = allowedRoles.some((r) => roles.includes(r));

  if (!allowed) {
    authHealer.log("permission_denied", "role_blocked_admin_route", {
      path: location.pathname,
      have: roles,
      need: allowedRoles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
