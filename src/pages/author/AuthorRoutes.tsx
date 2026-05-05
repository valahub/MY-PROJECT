import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthorDashboard from "./AuthorDashboard";
import AuthorUploadItem from "./AuthorUploadItem";
import AuthorMyItems from "./AuthorMyItems";
import AuthorEditItem from "./AuthorEditItem";
import AuthorSales from "./AuthorSales";
import AuthorEarnings from "./AuthorEarnings";
import AuthorReviews from "./AuthorReviews";
import AuthorProfile from "./AuthorProfile";

const nav = [
  { to: "/author", label: "Dashboard" },
  { to: "/author/items", label: "My Items" },
  { to: "/author/upload", label: "Upload Item" },
  { to: "/author/sales", label: "Sales" },
  { to: "/author/earnings", label: "Earnings" },
  { to: "/author/reviews", label: "Reviews" },
  { to: "/author/profile", label: "Profile" },
];

export default function AuthorRoutes() {
  return (
    <ProtectedRoute requireRoles={["author", "admin"]}>
      <Routes>
        <Route element={<DashboardShell role="author" navItems={nav} title="Author" />}>
          <Route index element={<AuthorDashboard />} />
          <Route path="dashboard" element={<AuthorDashboard />} />
          <Route path="items" element={<AuthorMyItems />} />
          <Route path="products" element={<AuthorMyItems />} />
          <Route path="upload" element={<AuthorUploadItem />} />
          <Route path="products/new" element={<AuthorUploadItem />} />
          <Route path="items/:id/edit" element={<AuthorEditItem />} />
          <Route path="products/:id/edit" element={<AuthorEditItem />} />
          <Route path="sales" element={<AuthorSales />} />
          <Route path="earnings" element={<AuthorEarnings />} />
          <Route path="reviews" element={<AuthorReviews />} />
          <Route path="profile" element={<AuthorProfile />} />
          <Route path="*" element={<Navigate to="/author" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
