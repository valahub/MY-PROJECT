import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10">
        <Link to="/">
          <Logo size={40} />
        </Link>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">
            One platform for SaaS billing & a code marketplace.
          </h2>
          <p className="text-muted-foreground">
            Subscriptions, licenses, author payouts, and admin controls — all in one place.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ERP Vala
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Link to="/">
              <Logo size={36} />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
