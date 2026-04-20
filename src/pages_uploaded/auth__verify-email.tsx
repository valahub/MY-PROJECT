
import { useEffect, useState, type FormEvent } from "react";
import { authService } from "@/lib/security";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const [token, setToken] = useState("");
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
      const ok = await authService.verifyEmail(token);
      setMessage(ok ? "Email verified successfully." : "Invalid or expired token.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm">Verification Token</label>
        <Input value={token} onChange={(e) => setToken(e.target.value)} required />
      </div>
      {message && <p className="text-xs">{message}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
    </form>
  );
}

export default VerifyEmailPage;
