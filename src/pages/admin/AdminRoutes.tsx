import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { PlaceholderDashboard } from "@/components/PlaceholderDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminUsers from "./AdminUsers";
import AdminRoles from "./AdminRoles";
import AdminAuditLogs from "./AdminAuditLogs";
import AdminProducts from "@/pages_uploaded/admin__products";
import AdminSubscriptions from "@/pages_uploaded/admin__subscriptions";
import AdminLicenses from "@/pages_uploaded/admin__licenses";
import AdminTransactions from "@/pages_uploaded/admin__transactions";
import AdminBilling from "@/pages_uploaded/admin__billing";
import AdminDunning from "@/pages_uploaded/admin__dunning";
import AdminProration from "@/pages_uploaded/admin__proration";
import AdminEntitlements from "@/pages_uploaded/admin__entitlements";
import AdminCurrency from "@/pages_uploaded/admin__currency";
import AdminCustomers from "@/pages_uploaded/admin__customers";
import AdminMarketplace from "@/pages_uploaded/admin__marketplace";
import AdminReviewQueue from "@/pages_uploaded/admin__review_queue";
import AdminMarketplaceItems from "@/pages_uploaded/admin__marketplace_items";
import AdminMarketplaceAuthors from "@/pages_uploaded/admin__marketplace_authors";
import AdminMarketplaceLevels from "@/pages_uploaded/admin__marketplace_levels";
import AdminMarketplaceCategories from "@/pages_uploaded/admin__marketplace_categories";
import AdminMarketplaceFeatured from "@/pages_uploaded/admin__marketplace_featured";
import AdminMarketplacePayouts from "@/pages_uploaded/admin__marketplace_payouts";
import AdminMarketplaceRefunds from "@/pages_uploaded/admin__marketplace_refunds";
import AdminMarketplaceTakedowns from "@/pages_uploaded/admin__marketplace_takedowns";
import AdminMarketplaceTopItems from "@/pages_uploaded/admin__marketplace_top_items";
import AdminMarketplaceFlags from "@/pages_uploaded/admin__marketplace_flags";
import AdminMarketplaceTaxRules from "@/pages_uploaded/admin__marketplace_tax_rules";
import AdminMarketplaceSettings from "@/pages_uploaded/admin__marketplace_settings";
import AdminTaxCompliance from "@/pages_uploaded/admin__tax_compliance";
import AdminCompliance from "@/pages_uploaded/admin__compliance";
import AdminFraudML from "@/pages_uploaded/admin__fraud_ml";

const nav = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/roles", label: "Roles & Permissions" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/licenses", label: "Licenses" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/billing", label: "Billing" },
  { to: "/admin/dunning", label: "Dunning" },
  { to: "/admin/proration", label: "Proration" },
  { to: "/admin/entitlements", label: "Entitlements" },
  { to: "/admin/currency", label: "Currency" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/tax", label: "Tax & Compliance" },
  { to: "/admin/compliance", label: "Legal & Compliance" },
  { to: "/admin/fraud-ml", label: "Fraud ML" },
  { to: "/admin/marketplace", label: "Marketplace" },
  { to: "/admin/marketplace/queue", label: "Review Queue" },
  { to: "/admin/marketplace/items", label: "Items" },
  { to: "/admin/marketplace/authors", label: "Authors" },
  { to: "/admin/marketplace/levels", label: "Levels" },
  { to: "/admin/marketplace/categories", label: "Categories" },
  { to: "/admin/marketplace/featured", label: "Featured" },
  { to: "/admin/marketplace/payouts", label: "Payouts" },
  { to: "/admin/marketplace/refunds", label: "Refunds" },
  { to: "/admin/marketplace/takedowns", label: "Takedowns" },
  { to: "/admin/marketplace/top-items", label: "Top Items" },
  { to: "/admin/marketplace/flags", label: "Flags" },
  { to: "/admin/marketplace/tax-rules", label: "Tax Rules" },
  { to: "/admin/marketplace/settings", label: "Settings" },
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
                  "Audit logs, fraud, dunning (later)",
                ]}
              />
            }
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="licenses" element={<AdminLicenses />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="dunning" element={<AdminDunning />} />
          <Route path="proration" element={<AdminProration />} />
          <Route path="entitlements" element={<AdminEntitlements />} />
          <Route path="currency" element={<AdminCurrency />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="tax" element={<AdminTaxCompliance />} />
          <Route path="compliance" element={<AdminCompliance />} />
          <Route path="fraud-ml" element={<AdminFraudML />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="marketplace/queue" element={<AdminReviewQueue />} />
          <Route path="marketplace/items" element={<AdminMarketplaceItems />} />
          <Route path="marketplace/authors" element={<AdminMarketplaceAuthors />} />
          <Route path="marketplace/levels" element={<AdminMarketplaceLevels />} />
          <Route path="marketplace/categories" element={<AdminMarketplaceCategories />} />
          <Route path="marketplace/featured" element={<AdminMarketplaceFeatured />} />
          <Route path="marketplace/payouts" element={<AdminMarketplacePayouts />} />
          <Route path="marketplace/refunds" element={<AdminMarketplaceRefunds />} />
          <Route path="marketplace/takedowns" element={<AdminMarketplaceTakedowns />} />
          <Route path="marketplace/top-items" element={<AdminMarketplaceTopItems />} />
          <Route path="marketplace/flags" element={<AdminMarketplaceFlags />} />
          <Route path="marketplace/tax-rules" element={<AdminMarketplaceTaxRules />} />
          <Route path="marketplace/settings" element={<AdminMarketplaceSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
