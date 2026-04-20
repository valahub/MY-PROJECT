import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Upload,
  DollarSign,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  ArrowLeft,
  RefreshCw,
  Users,
  Award,
  Wallet,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

({ component: AuthorLayout });

const NAV = [
  { title: "Dashboard", href: "/marketplace/author/dashboard", icon: LayoutDashboard },
  { title: "Portfolio", href: "/marketplace/author/portfolio", icon: Package },
  { title: "Upload Item", href: "/marketplace/author/upload", icon: Upload },
  { title: "Earnings", href: "/marketplace/author/earnings", icon: DollarSign },
  { title: "Withdraw", href: "/marketplace/author/withdraw", icon: Wallet },
  { title: "Statements", href: "/marketplace/author/statements", icon: FileText },
  { title: "Analytics", href: "/marketplace/author/analytics", icon: BarChart3 },
  { title: "Reviews", href: "/marketplace/author/reviews", icon: Star },
  { title: "Comments", href: "/marketplace/author/comments", icon: MessageSquare },
  { title: "Refunds", href: "/marketplace/author/refunds", icon: RefreshCw },
  { title: "Followers", href: "/marketplace/author/followers", icon: Users },
  { title: "Levels & Badges", href: "/marketplace/author/badges", icon: Award },
  { title: "Settings", href: "/marketplace/author/settings", icon: Settings },
];

function AuthorLayout() {
  const location = useLocation();
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <Link
            to="/marketplace"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Marketplace
          </Link>
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 px-3">
            Author Panel
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => {
              const active = location.pathname === n.href;
              return (
                <Link
                  key={n.href}
                  to={n.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary text-white" : "hover:bg-muted",
                  )}
                >
                  <n.icon className="h-4 w-4" /> {n.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthorLayout;
