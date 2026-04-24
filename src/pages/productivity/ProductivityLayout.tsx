import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import { Briefcase, Users, ShieldCheck } from "lucide-react";

const PRODUCTIVITY_NAV: NavItem[] = [
  { title: "Productivity (User)", href: "/productivity/dashboard", icon: Briefcase },
  { title: "Productivity Manager", href: "/productivity/manager", icon: Users },
  { title: "Productivity Admin", href: "/productivity/admin", icon: ShieldCheck },
];

export default function ProductivityLayout() {
  const { roles, user, loading } = useAuth();
  const location = useLocation();

  const items = useMemo(
    () => syncSidebar(PRODUCTIVITY_NAV as SyncableNavItem[], roles) as NavItem[],
    [roles],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    authHealer.log("permission_denied", "unauthenticated_productivity_access", {
      path: location.pathname,
    });
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (!isRoleAllowed(location.pathname, roles)) {
    authHealer.log("permission_denied", "role_blocked_productivity_route", {
      path: location.pathname,
      have: roles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout
      navItems={items}
      panelName="Productivity"
      userEmail={user.email ?? undefined}
    />
  );
}
