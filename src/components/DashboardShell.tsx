import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

interface Props {
  role: AppRole;
  navItems: NavItem[];
  title: string;
}

export function DashboardShell({ role, navItems, title }: Props) {
  const { user, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link to="/">
            <Logo size={28} />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Role: {primaryRole ?? role}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await signOut();
              navigate("/auth/login", { replace: true });
            }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 gap-2">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate("/auth/login", { replace: true });
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
