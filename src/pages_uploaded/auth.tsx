import { Link, Outlet } from "react-router-dom";

({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">ERP Vala Auth</h1>
          <p className="text-sm text-muted-foreground">
            Secure authentication and account recovery
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link className="rounded-md border px-2 py-1 hover:bg-accent" to="/auth/login">
            Login
          </Link>
          <Link className="rounded-md border px-2 py-1 hover:bg-accent" to="/auth/register">
            Register
          </Link>
          <Link className="rounded-md border px-2 py-1 hover:bg-accent" to="/auth/forgot-password">
            Forgot Password
          </Link>
          <Link className="rounded-md border px-2 py-1 hover:bg-accent" to="/auth/verify-email">
            Verify Email
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
