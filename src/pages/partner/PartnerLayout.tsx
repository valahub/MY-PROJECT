import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import { Handshake, Users, Link as LinkIcon, ShieldCheck } from "lucide-react";

const PARTNER_NAV: NavItem[] = [
  { title: "Partner Home", href: "/partner/dashboard", icon: Handshake },
  { title: "Reseller", href: "/partner/reseller", icon: Users },
  { title: "Affiliate", href: "/partner/affiliate", icon: LinkIcon },
  { title: "Partner Admin", href: "/partner/admin", icon: ShieldCheck },
];

export default function PartnerLayout() {
  const { roles, user, loading } = useAuth();
  const location = useLocation();

  const items = useMemo(
    () => syncSidebar(PARTNER_NAV as SyncableNavItem[], roles) as NavItem[],
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
    authHealer.log("permission_denied", "unauthenticated_partner_access", {
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
    authHealer.log("permission_denied", "role_blocked_partner_route", {
      path: location.pathname,
      have: roles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout
      navItems={items}
      panelName="Partner Panel"
      userEmail={user.email ?? undefined}
    />
  );
}
