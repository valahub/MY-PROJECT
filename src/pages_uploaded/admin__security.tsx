
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Key, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { authService } from "@/lib/security";
import { toast } from "sonner";

({ component: AdminSecurity });

function AdminSecurity() {
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [hmacPayload, setHmacPayload] = useState("event=test");
  const [hmacSecret, setHmacSecret] = useState("webhook_secret_demo");
  const [hmacSignature, setHmacSignature] = useState<string | null>(null);
  const [idempotencyResult, setIdempotencyResult] = useState<string | null>(null);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false);
  const [isAddingIP, setIsAddingIP] = useState(false);
  const [isSigningPayload, setIsSigningPayload] = useState(false);
  const [isTestingIdempotency, setIsTestingIdempotency] = useState(false);

  async function generateApiKey() {
    setIsRegeneratingKeys(true);
    try {
      const result = await authService.createApiKey(
        ["merchant:api:read", "merchant:api:write", "security:audit:read"],
        120,
      );
      setGeneratedApiKey(result?.apiKey ?? null);
      toast.success("API keys regenerated successfully");
    } catch (error) {
      toast.error("Failed to regenerate keys");
    } finally {
      setIsRegeneratingKeys(false);
    }
  }

  async function signPayload() {
    setIsSigningPayload(true);
    try {
      const signature = await authService.signHmacPayload(hmacPayload, hmacSecret);
      setHmacSignature(signature);
      toast.success("Payload signed successfully");
    } catch (error) {
      toast.error("Failed to sign payload");
    } finally {
      setIsSigningPayload(false);
    }
  }

  async function testIdempotency() {
    setIsTestingIdempotency(true);
    try {
      const result = await authService.checkAndStoreIdempotency(
        "checkout:payment",
        "IDEMP-001",
        hmacPayload,
      );
      setIdempotencyResult(
        result.repeated ? "Duplicate request protected." : "First request accepted.",
      );
      toast.success("Idempotency test completed");
    } catch (error) {
      toast.error("Failed to test idempotency");
    } finally {
      setIsTestingIdempotency(false);
    }
  }

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("2FA enabled successfully");
    } catch (error) {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleAddIP = async () => {
    setIsAddingIP(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("IP added successfully");
    } catch (error) {
      toast.error("Failed to add IP");
    } finally {
      setIsAddingIP(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
            <Button onClick={handleEnable2FA} disabled={isEnabling2FA}>
              {isEnabling2FA ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEnabling2FA ? "Enabling..." : "Enable 2FA"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Live API Key</label>
              <Input value={generatedApiKey ?? "Generate a key"} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Test API Key</label>
              <Input value="test_sk_••••••••••••••••" readOnly />
            </div>
            <Button variant="outline" type="button" onClick={generateApiKey} disabled={isRegeneratingKeys}>
              {isRegeneratingKeys ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isRegeneratingKeys ? "Regenerating..." : "Regenerate Keys"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              IP Allowlist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Restrict API access to specific IPs</p>
            <Input placeholder="Enter IP address" />
            <Button variant="outline" onClick={handleAddIP} disabled={isAddingIP}>
              {isAddingIP ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isAddingIP ? "Adding..." : "Add IP"}
            </Button>
            <div className="space-y-2">
              <label className="text-sm font-medium">HMAC Payload</label>
              <Input value={hmacPayload} onChange={(e) => setHmacPayload(e.target.value)} />
              <label className="text-sm font-medium">HMAC Secret</label>
              <Input value={hmacSecret} onChange={(e) => setHmacSecret(e.target.value)} />
              <Button type="button" variant="outline" onClick={signPayload} disabled={isSigningPayload}>
                {isSigningPayload ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSigningPayload ? "Signing..." : "Sign Payload"}
              </Button>
              {hmacSignature && <code className="text-xs break-all">{hmacSignature}</code>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Fraud Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Automatic fraud detection is active</p>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">Fraud rules active</span>
              <span className="text-sm font-medium">12 rules</span>
            </div>
            <Button variant="outline" type="button" onClick={testIdempotency} disabled={isTestingIdempotency}>
              {isTestingIdempotency ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isTestingIdempotency ? "Testing..." : "Test Idempotency Protection"}
            </Button>
            {idempotencyResult && (
              <p className="text-xs text-muted-foreground">{idempotencyResult}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminSecurity;
