import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const nav = [{ to: "/support", label: "Overview" }];

export default function SupportRoutes() {
  return (
    <ProtectedRoute requireRoles={["support", "admin"]}>
      <Routes>
        <Route element={<DashboardShell role="support" navItems={nav} title="Support" />}>
          <Route
            index
            element={
              <PlaceholderDashboard
                title="Support overview"
                description="Tickets and customer help tools."
                comingSoon={[
                  "Tickets queue (later)",
                  "Customer search (later)",
                  "Escalations (later)",
                ]}
              />
            }
          />
          <Route path="*" element={<Navigate to="/support" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
