import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const nav = [{ to: "/merchant", label: "Overview" }];

export default function MerchantRoutes() {
  return (
    <ProtectedRoute requireRoles={["merchant", "admin"]}>
      <Routes>
        <Route element={<DashboardShell role="merchant" navItems={nav} title="Merchant" />}>
          <Route
            index
            element={
              <PlaceholderDashboard
                title="Merchant overview"
                description="SaaS billing tools for your products."
                comingSoon={[
                  "Products & pricing (Phase 4)",
                  "Subscriptions & invoices (Phase 4)",
                  "Webhooks & API keys (later)",
                ]}
              />
            }
          />
          <Route path="*" element={<Navigate to="/merchant" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
