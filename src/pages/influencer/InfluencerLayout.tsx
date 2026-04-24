import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import {
  LayoutDashboard,
  Megaphone,
  FileImage,
  BarChart3,
  Wallet,
  Users,
  ShieldCheck,
} from "lucide-react";

const INFLUENCER_NAV: NavItem[] = [
  { title: "Influencer Home", href: "/influencer/dashboard", icon: LayoutDashboard },
  { title: "Campaigns", href: "/influencer/campaigns", icon: Megaphone },
  { title: "Content / Posts", href: "/influencer/content", icon: FileImage },
  { title: "Analytics", href: "/influencer/analytics", icon: BarChart3 },
  { title: "Earnings / Payouts", href: "/influencer/earnings", icon: Wallet },
  { title: "Influencer Manager", href: "/influencer/manager", icon: Users },
  { title: "Influencer Admin", href: "/influencer/admin", icon: ShieldCheck },
];

export default function InfluencerLayout() {
  const { roles, user, loading } = useAuth();
  const location = useLocation();

  const items = useMemo(
    () => syncSidebar(INFLUENCER_NAV as SyncableNavItem[], roles) as NavItem[],
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
    authHealer.log("permission_denied", "unauthenticated_influencer_access", {
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
    authHealer.log("permission_denied", "role_blocked_influencer_route", {
      path: location.pathname,
      have: roles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout
      navItems={items}
      panelName="Influencer Panel"
      userEmail={user.email ?? undefined}
    />
  );
}
