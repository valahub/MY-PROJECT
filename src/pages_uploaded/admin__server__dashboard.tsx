import AdminServerPage from "./admin__server";

// Server Dashboard sub-route: opens the Server module with the Dashboard section preselected.
// Uses URL hash so the existing internal sidebar can sync if needed; for now we render the full module.
export default function AdminServerDashboardPage() {
  return <AdminServerPage initialSection="dashboard" />;
}
