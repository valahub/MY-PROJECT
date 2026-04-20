
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Shield, Smartphone, Monitor, Key, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { authService, type SessionRecord } from "@/lib/security";
import { toast } from "sonner";

({
  component: CustomerSecurityPage,
  head: () => ({ meta: [{ title: "Security — ERP Vala" }] }),
});

function CustomerSecurityPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [isConfirmingTotp, setIsConfirmingTotp] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    void authService.bootstrap().then(() => setSessions(authService.listCurrentUserSessions()));
  }, []);

  const tableRows = sessions.map((session) => ({
    id: session.id,
    device: session.deviceLabel,
    location: session.suspicious ? "Suspicious device" : "Trusted device",
    ip: session.ipAddress,
    lastActive: new Date(session.lastActiveAt).toLocaleString(),
    status: session.revokedAt ? "expired" : "active",
  }));

  async function setupTotp() {
    setIsSettingUpTotp(true);
    try {
      const setup = await authService.setupTotpForCurrentUser();
      if (!setup) {
        setMessage("Login required.");
        toast.error("Login required");
        return;
      }
      setTotpSecret(setup.secret);
      setMessage("TOTP secret created. Add it to your authenticator and confirm below.");
    } catch (error) {
      toast.error("Failed to setup 2FA");
    } finally {
      setIsSettingUpTotp(false);
    }
  }

  async function confirmTotp() {
    setIsConfirmingTotp(true);
    try {
      const result = await authService.confirmTotpForCurrentUser(totpCode);
      if (!result.success) {
        setMessage("Invalid TOTP code.");
        toast.error("Invalid TOTP code");
        return;
      }
      setBackupCodes(result.backupCodes ?? []);
      setMessage("2FA enabled with backup codes.");
      toast.success("2FA enabled successfully");
    } catch (error) {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsConfirmingTotp(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function revokeAll() {
    setIsRevokingAll(true);
    try {
      authService.logoutAllDevices();
      toast.success("All other sessions revoked");
      setTimeout(() => {
        window.location.assign("/auth/login");
      }, 500);
    } catch (error) {
      toast.error("Failed to revoke sessions");
      setIsRevokingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security & Access</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-xs text-muted-foreground">
                  Google Authenticator, 1Password, Authy
                </p>
              </div>
              <Switch checked={Boolean(totpSecret) || backupCodes.length > 0} disabled />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">SMS Backup</p>
                <p className="text-xs text-muted-foreground">+1 (555) ••• ••89</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={setupTotp}
                disabled={isSettingUpTotp}
              >
                {isSettingUpTotp ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {isSettingUpTotp ? "Setting up..." : "Setup Authenticator"}
              </Button>
              {totpSecret && (
                <code className="block rounded bg-muted px-2 py-1 text-xs">{totpSecret}</code>
              )}
              {totpSecret && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter TOTP code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                  />
                  <Button type="button" onClick={confirmTotp} disabled={isConfirmingTotp}>
                    {isConfirmingTotp ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : null}
                    {isConfirmingTotp ? "Confirming..." : "Confirm"}
                  </Button>
                </div>
              )}
              {backupCodes.length > 0 && (
                <div className="rounded-md border p-2">
                  <p className="mb-1 text-xs text-muted-foreground">Backup codes</p>
                  <div className="grid grid-cols-2 gap-1">
                    {backupCodes.map((code) => (
                      <code className="text-xs" key={code}>
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              {message && <p className="text-xs">{message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
            <p className="text-xs text-muted-foreground">Last changed 45 days ago</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Active Sessions & Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                header: "Device",
                accessorKey: "device",
                cell: ({ row }) => (
                  <div className="flex items-center gap-2">
                    {row.original.device.includes("iPhone") ||
                    row.original.device.includes("iPad") ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                    <span className="text-sm">{row.original.device}</span>
                  </div>
                ),
              },
              { header: "Location", accessorKey: "location" },
              {
                header: "IP",
                accessorKey: "ip",
                cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
              },
              { header: "Last Active", accessorKey: "lastActive" },
              {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
            ]}
            data={tableRows}
          />
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={revokeAll}
              disabled={isRevokingAll}
            >
              {isRevokingAll ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              {isRevokingAll ? "Revoking..." : "Revoke All Other Sessions"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
