import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LogoText } from "./Logo";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { authService } from "@/lib/security";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  panelName: string;
  userEmail?: string;
}

export function DashboardLayout({
  navItems,
  panelName,
  userEmail = "user@example.com",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeEmail, setActiveEmail] = useState(userEmail);
  const location = useLocation();

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  useEffect(() => {
    void authService.bootstrap().then(() => {
      const current = authService.getCurrentUser();
      if (current?.email) setActiveEmail(current.email);
    });
  }, []);

  function logout() {
    authService.logout();
    window.location.assign("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — dark navy (#00205C) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 md:relative",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {sidebarOpen ? (
            <span className="text-lg font-bold text-white">ERP Vala</span>
          ) : (
            <span className="text-sm font-bold text-white">EV</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden text-sidebar-foreground hover:text-white md:block"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-sidebar-foreground hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <SidebarItem key={item.href} item={item} isActive={isActive} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-3">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="text-xs text-sidebar-foreground truncate">{activeEmail}</div>
              <button
                onClick={logout}
                className="w-full rounded-md border border-sidebar-border px-2 py-1 text-xs text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-sidebar-accent mx-auto" />
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">{panelName}</span>
          <div className="flex-1" />
          <button
            onClick={() => {
              authService.logoutAllDevices();
              window.location.assign("/auth/login");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Logout all devices
          </button>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Switch Panel
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: (h: string) => boolean;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const active = isActive(item.href);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-sidebar-accent text-white"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">{item.title}</span>}
          {!collapsed && (
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-xs transition-colors",
                  isActive(child.href)
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:text-white",
                )}
              >
                {child.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-white font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}
