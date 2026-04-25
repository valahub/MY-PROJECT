import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthorDashboard from "./AuthorDashboard";
import AuthorUploadItem from "./AuthorUploadItem";
import AuthorMyItems from "./AuthorMyItems";
import AuthorEditItem from "./AuthorEditItem";

const nav = [
  { to: "/author", label: "Dashboard" },
  { to: "/author/items", label: "My Items" },
  { to: "/author/upload", label: "Upload Item" },
];

export default function AuthorRoutes() {
  return (
    <ProtectedRoute requireRoles={["author", "admin"]}>
      <Routes>
        <Route element={<DashboardShell role="author" navItems={nav} title="Author" />}>
          <Route index element={<AuthorDashboard />} />
          <Route path="items" element={<AuthorMyItems />} />
          <Route path="upload" element={<AuthorUploadItem />} />
          <Route path="items/:id/edit" element={<AuthorEditItem />} />
          <Route path="*" element={<Navigate to="/author" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
