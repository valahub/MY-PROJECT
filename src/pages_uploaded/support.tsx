
import { DashboardLayout } from "@/components/DashboardLayout";
import { enforceAuth } from "@/lib/security";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  AlertTriangle,
  Search,
  FileText,
  Settings,
} from "lucide-react";

({
  beforeLoad: enforceAuth({ roles: ["support", "admin"] }),
  component: SupportLayout,
});

const navItems = [
  { title: "Dashboard", href: "/support/dashboard", icon: LayoutDashboard },
  { title: "Tickets", href: "/support/tickets", icon: MessageSquare },
  { title: "Customers", href: "/support/customers", icon: Users },
  { title: "Escalations", href: "/support/escalations", icon: AlertTriangle },
  { title: "Search", href: "/support/search", icon: Search },
  { title: "Logs", href: "/support/logs", icon: FileText },
  { title: "Settings", href: "/support/settings", icon: Settings },
];

function SupportLayout() {
  return (
    <DashboardLayout
      navItems={navItems}
      panelName="Support Panel"
      userEmail="support@erpvala.com"
    />
  );
}

export default SupportLayout;
