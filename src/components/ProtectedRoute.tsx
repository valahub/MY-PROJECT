import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { useSelfHeal } from "@/hooks/use-self-heal";
import { authHealer } from "@/lib/auth/auth-healer";

interface Props {
  children: React.ReactNode;
  requireRoles?: AppRole[];
}

export function ProtectedRoute({ children, requireRoles }: Props) {
  const { user, roles, loading, recover } = useAuth();
  const location = useLocation();

  // Watchdog: if `loading` stays true too long, attempt recovery (refresh / clean signout).
  useSelfHeal({
    phase: loading ? "loading" : "ready",
    stuckPhase: "loading",
    stuckThresholdMs: 10_000,
    onStuck: () => {
      authHealer.log("stuck_loading", "ProtectedRoute stuck — invoking recover()");
      void recover();
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (requireRoles && !requireRoles.some((r) => roles.includes(r))) {
    authHealer.log("permission_denied", location.pathname, { required: requireRoles, have: roles });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
