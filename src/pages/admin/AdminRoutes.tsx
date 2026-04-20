import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminUsers from "./AdminUsers";

const nav = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users & Roles" },
];

export default function AdminRoutes() {
  return (
    <ProtectedRoute requireRoles={["admin"]}>
      <Routes>
        <Route element={<DashboardShell role="admin" navItems={nav} title="Admin" />}>
          <Route
            index
            element={
              <PlaceholderDashboard
                title="Admin overview"
                description="Platform-wide controls. More modules will appear as later phases ship."
                comingSoon={[
                  "Marketplace approvals (Phase 3)",
                  "Subscriptions & billing (Phase 4)",
                  "Audit logs, fraud, dunning (later)",
                ]}
              />
            }
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
