import { Link } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { authService, type Role } from "@/lib/security";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

({
  component: RegisterPage,
});

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("tenant_acme");
  const [role, setRole] = useState<Role>("customer");
  const [message, setMessage] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void authService.bootstrap();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setVerificationToken(null);
    try {
      const result = await authService.register({
        email,
        password,
        role,
        tenantId,
        ipAddress: "127.0.0.1",
        consentType: "terms_and_privacy",
      });
      if (!result.success) {
        setMessage(result.reason ?? "Registration failed.");
        return;
      }
      setMessage("Registration successful. Verify your email with the token below.");
      setVerificationToken(result.verificationToken ?? null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm">Role</label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="customer">Customer</option>
          <option value="merchant">Merchant</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="text-sm">Tenant ID</label>
        <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} required />
      </div>
      {message && <p className="text-xs">{message}</p>}
      {verificationToken && (
        <div className="rounded-md border p-2">
          <p className="text-xs text-muted-foreground">Verification token (demo)</p>
          <code className="text-xs break-all">{verificationToken}</code>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Already registered? <Link to="/auth/login">Login</Link>
      </p>
    </form>
  );
}
