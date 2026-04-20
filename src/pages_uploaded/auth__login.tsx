import { Link } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { authService } from "@/lib/security";
import { apiClient } from "@/lib/client/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

({
  component: LoginPage,
});

const roleHome: Record<string, string> = {
  admin: "/admin/dashboard",
  merchant: "/merchant/dashboard",
  customer: "/customer/dashboard",
  support: "/support/dashboard",
};

const DEMO_ACCOUNTS: Array<{
  role: "admin" | "merchant" | "customer" | "support";
  label: string;
  email: string;
  password: string;
}> = [
  { role: "admin", label: "Admin", email: "admin@erpvala.com", password: "Admin#123" },
  { role: "merchant", label: "Merchant", email: "merchant@acme.com", password: "Merchant#123" },
  { role: "customer", label: "Customer", email: "john@example.com", password: "Customer#123" },
  { role: "support", label: "Support", email: "support@erpvala.com", password: "Support#123" },
];

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void authService.bootstrap();
  }, []);

  const redirectTarget =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;
  const safeRedirectTarget =
    redirectTarget && /^\/(?!\/)/.test(redirectTarget) ? redirectTarget : null;

  async function finalizeLogin(role: string) {
    const defaultHome = roleHome[role] ?? "/";
    const target = safeRedirectTarget || defaultHome;
    window.location.assign(target);
  }

  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setDemoLoadingRole(account.role);
    setMessage(null);
    setEmail(account.email);
    setPassword(account.password);
    const result = await authService.login({
      email: account.email,
      password: account.password,
      deviceLabel: typeof navigator !== "undefined" ? navigator.platform : "web",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      ipAddress: "127.0.0.1",
    });
    if (!result.success || !result.user) {
      setMessage(result.reason ?? "Demo login failed.");
      setDemoLoadingRole(null);
      return;
    }
    await finalizeLogin(result.user.role);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await authService.login({
      email,
      password,
      totpCode: totpCode || undefined,
      backupCode: backupCode || undefined,
      deviceLabel: typeof navigator !== "undefined" ? navigator.platform : "web",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      ipAddress: "127.0.0.1",
    });
    setLoading(false);

    if (!result.success || !result.user) {
      setMessage(result.reason ?? "Login failed.");
      return;
    }

    try {
      await apiClient.auth.login(email, password);
    } catch {
      // Backend API client is a stub; ignore so demo/local login still proceeds.
    }

    await finalizeLogin(result.user.role);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">One-click demo login</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.role}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin(account)}
              disabled={demoLoadingRole !== null || loading}
            >
              {demoLoadingRole === account.role ? "Signing in..." : account.label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Seeded mock accounts — works without any backend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
          />
        </div>
        <div>
          <label className="text-sm">TOTP (if enabled)</label>
          <Input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="123456"
          />
        </div>
        <div>
          <label className="text-sm">Backup Code (optional)</label>
          <Input value={backupCode} onChange={(e) => setBackupCode(e.target.value)} />
        </div>
        {message && <p className="text-xs text-destructive">{message}</p>}
        <Button className="w-full" disabled={loading || demoLoadingRole !== null}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Need an account? <Link to="/auth/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
