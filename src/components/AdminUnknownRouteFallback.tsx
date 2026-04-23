// Catch-all for any unknown /admin/* path. Logs the blocked attempt and
// redirects to /unauthorized instead of the generic NotFound page.
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { authHealer } from "@/lib/auth/auth-healer";

export default function AdminUnknownRouteFallback() {
  const location = useLocation();

  useEffect(() => {
    authHealer.log("redirect_fallback", "unknown admin route", {
      path: location.pathname,
      reason: "no_admin_route_match",
    });
  }, [location.pathname]);

  return <Navigate to="/unauthorized" replace />;
}
