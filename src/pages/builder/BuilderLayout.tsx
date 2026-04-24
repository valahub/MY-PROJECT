import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import {
  LayoutDashboard,
  FilePlus,
  Sparkles,
  Eye,
  Blocks,
  Route as RouteIcon,
  LayoutPanelLeft,
  Bot,
  Rocket,
  ShieldCheck,
} from "lucide-react";

const BUILDER_NAV: NavItem[] = [
  { title: "Builder Dashboard", href: "/builder/dashboard", icon: LayoutDashboard },
  { title: "Create Project", href: "/builder/create", icon: FilePlus },
  { title: "Prompt Builder", href: "/builder/prompt", icon: Sparkles },
  { title: "Live Preview", href: "/builder/preview", icon: Eye },
  { title: "Components", href: "/builder/components", icon: Blocks },
  { title: "Pages / Routes", href: "/builder/pages", icon: RouteIcon },
  { title: "Layout Manager", href: "/builder/layout", icon: LayoutPanelLeft },
  { title: "AI Assistant", href: "/builder/assistant", icon: Bot },
  { title: "Export / Deploy", href: "/builder/export", icon: Rocket },
  { title: "Builder Admin", href: "/builder/admin", icon: ShieldCheck },
];

export default function BuilderLayout() {
  const { roles, user, loading } = useAuth();
  const location = useLocation();

  const items = useMemo(
    () => syncSidebar(BUILDER_NAV as SyncableNavItem[], roles) as NavItem[],
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
    authHealer.log("permission_denied", "unauthenticated_builder_access", {
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
    authHealer.log("permission_denied", "role_blocked_builder_route", {
      path: location.pathname,
      have: roles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout
      navItems={items}
      panelName="Vala Builder"
      userEmail={user.email ?? undefined}
    />
  );
}
