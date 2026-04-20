import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const nav = [{ to: "/customer", label: "Overview" }];

export default function CustomerRoutes() {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<DashboardShell role="customer" navItems={nav} title="My account" />}>
          <Route
            index
            element={
              <PlaceholderDashboard
                title="Welcome 👋"
                description="Your purchases, licenses, and subscriptions will appear here."
                comingSoon={[
                  "Browse marketplace (Phase 2)",
                  "Downloads & licenses (Phase 4)",
                  "Active subscriptions (Phase 4)",
                ]}
              />
            }
          />
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
