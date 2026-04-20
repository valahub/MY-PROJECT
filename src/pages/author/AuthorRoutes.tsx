import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const nav = [{ to: "/author", label: "Overview" }];

export default function AuthorRoutes() {
  return (
    <ProtectedRoute requireRoles={["author", "admin"]}>
      <Routes>
        <Route element={<DashboardShell role="author" navItems={nav} title="Author" />}>
          <Route
            index
            element={
              <PlaceholderDashboard
                title="Author overview"
                description="Sell your code & digital products on the marketplace."
                comingSoon={[
                  "Upload products (Phase 3)",
                  "Earnings & payouts (Phase 4)",
                  "Reviews, badges, followers (later)",
                ]}
              />
            }
          />
          <Route path="*" element={<Navigate to="/author" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
