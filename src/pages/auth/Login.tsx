import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth, ROLE_HOME, type AppRole } from "@/contexts/AuthContext";

const DEMO_ACCOUNTS: Array<{ role: AppRole; label: string; email: string; password: string }> = [
  { role: "admin", label: "Admin", email: "admin@test.com", password: "Test#12345" },
  { role: "merchant", label: "Merchant", email: "merchant@test.com", password: "Test#12345" },
  { role: "author", label: "Author", email: "author@test.com", password: "Test#12345" },
  { role: "customer", label: "Customer", email: "customer@test.com", password: "Test#12345" },
  { role: "support", label: "Support", email: "support@test.com", password: "Test#12345" },
];

// UI-only demo accounts for Server / Development modules.
// These do NOT hit the backend — they set a local demo flag and redirect.
const ROLE_DEMO_ACCOUNTS: Array<{
  key: string;
  label: string;
  id: string;
  password: string;
  redirect: string;
}> = [
  {
    key: "server_manager",
    label: "Server Manager",
    id: "server_manager_demo",
    password: "123456",
    redirect: "/admin/server/dashboard",
  },
  {
    key: "server_viewer",
    label: "Server Viewer",
    id: "server_viewer_demo",
    password: "123456",
    redirect: "/admin/server/dashboard",
  },
  {
    key: "dev_manager",
    label: "Development Manager",
    id: "dev_manager_demo",
    password: "123456",
    redirect: "/admin/development/management",
  },
  {
    key: "developer",
    label: "Developer",
    id: "developer_demo",
    password: "123456",
    redirect: "/admin/development/dashboard",
  },
];

const ROLE_PRIORITY: AppRole[] = ["admin", "support", "merchant", "author", "customer"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshRoles } = useAuth();

  async function resolveRedirect(uid: string | undefined): Promise<string> {
    const requested = params.get("redirect");
    if (requested && /^\/(?!\/)/.test(requested)) return requested;
    if (!uid) return "/customer";
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    const primary = ROLE_PRIORITY.find((r) => roles.includes(r));
    return primary ? ROLE_HOME[primary] : "/customer";
  }

  async function performLogin(e: string, p: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) {
      toast.error(error.message);
      return false;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    const target = await resolveRedirect(uid);
    await refreshRoles();
    toast.success("Signed in");
    navigate(target, { replace: true });
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await performLogin(email, password);
    setLoading(false);
  }

  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setDemoLoading(account.role);
    setEmail(account.email);
    setPassword(account.password);

    // First attempt
    let ok = await performLogin(account.email, account.password);
    if (!ok) {
      // Likely user not seeded yet — invoke seed function then retry
      try {
        toast.message("Seeding demo accounts…");
        await supabase.functions.invoke("seed-test-users");
        ok = await performLogin(account.email, account.password);
      } catch (err) {
        console.error("seed-test-users failed", err);
        toast.error("Could not seed demo accounts.");
      }
    }
    setDemoLoading(null);
  }

  function handleRoleDemoLogin(account: (typeof ROLE_DEMO_ACCOUNTS)[number]) {
    // UI-only simulation — auto-fill, simulate auto login, then redirect.
    setEmail(account.id);
    setPassword(account.password);
    setDemoLoading(account.key);
    try {
      localStorage.setItem(
        "demo_role_session",
        JSON.stringify({
          key: account.key,
          label: account.label,
          id: account.id,
          at: Date.now(),
        }),
      );
    } catch {
      // ignore storage errors
    }
    toast.success(`Signed in as ${account.label}`);
    setTimeout(() => {
      navigate(account.redirect, { replace: true });
      setDemoLoading(null);
    }, 300);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your ERP Vala account.
        </p>
      </div>

      <div className="rounded-md border bg-muted/40 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">One-click demo login</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.role}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin(account)}
              disabled={demoLoading !== null || loading}
            >
              {demoLoading === account.role ? "Signing in..." : account.label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          First click auto-seeds the account if it doesn't exist yet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button className="w-full" disabled={loading || demoLoading !== null}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-foreground font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
