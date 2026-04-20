
import { useState, type FormEvent } from "react";
import { authService } from "@/lib/security";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await authService.forgotPassword(email);
      setMessage("If your email exists, a reset token has been generated.");
      setResetToken(result.resetToken ?? null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm">Account Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {message && <p className="text-xs">{message}</p>}
      {resetToken && (
        <div className="rounded-md border p-2">
          <p className="text-xs text-muted-foreground">Reset token (demo)</p>
          <code className="text-xs break-all">{resetToken}</code>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Request reset"}
      </Button>
    </form>
  );
}

export default ForgotPasswordPage;
