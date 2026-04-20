
import { useEffect, useState, type FormEvent } from "react";
import { authService } from "@/lib/security";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryToken =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token")
        : null;
    if (queryToken) setToken(queryToken);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const ok = await authService.resetPassword(token, password);
      setMessage(
        ok ? "Password reset complete. You can now log in." : "Invalid or expired reset token.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm">Reset Token</label>
        <Input value={token} onChange={(e) => setToken(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm">New Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {message && <p className="text-xs">{message}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}

export default ResetPasswordPage;
