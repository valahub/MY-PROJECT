import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import { MessageSquare, Users, ShieldCheck } from "lucide-react";

const CHAT_NAV: NavItem[] = [
  { title: "Chat (User)", href: "/chat/dashboard", icon: MessageSquare },
  { title: "Chat Manager", href: "/chat/manager", icon: Users },
  { title: "Chat Admin", href: "/chat/admin", icon: ShieldCheck },
];

export default function ChatLayout() {
  const { roles, user, loading } = useAuth();
  const location = useLocation();

  const items = useMemo(
    () => syncSidebar(CHAT_NAV as SyncableNavItem[], roles) as NavItem[],
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
    authHealer.log("permission_denied", "unauthenticated_chat_access", {
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
    authHealer.log("permission_denied", "role_blocked_chat_route", {
      path: location.pathname,
      have: roles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout
      navItems={items}
      panelName="Chat Panel"
      userEmail={user.email ?? undefined}
    />
  );
}
