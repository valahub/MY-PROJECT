
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Copy, Loader2, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import {
  activateLicenseDevice,
  deactivateLicenseDevice,
  getCustomerLicenses,
  getUiErrorMessage,
  type CustomerLicense,
} from "@/lib/ui-actions-api";
import { toast } from "sonner";

({ component: CustomerLicenses });

function CustomerLicenses() {
  const [licenses, setLicenses] = useState<CustomerLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [deviceNames, setDeviceNames] = useState<Record<string, string>>({});

  const loadLicenses = async () => {
    try {
      setLicenses(await getCustomerLicenses());
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load licenses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLicenses();
  }, []);

  const runActivate = async (licenseId: string) => {
    if (pendingKey) return;
    const deviceName = deviceNames[licenseId] ?? "";
    if (!deviceName.trim()) return;
    setPendingKey(`activate-${licenseId}`);
    try {
      setLicenses(await activateLicenseDevice(licenseId, deviceName));
      setDeviceNames((prev) => ({ ...prev, [licenseId]: "" }));
      toast.success("Device activated.");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Activation failed."));
    } finally {
      setPendingKey(null);
    }
  };

  const runDeactivate = async (licenseId: string, deviceId: string) => {
    if (pendingKey) return;
    setPendingKey(`deactivate-${deviceId}`);
    try {
      setLicenses(await deactivateLicenseDevice(licenseId, deviceId));
      toast.success("Device deactivated.");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Deactivation failed."));
    } finally {
      setPendingKey(null);
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard?.writeText(key);
      toast.success("License key copied.");
    } catch {
      toast.error("Could not copy key.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Licenses</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading licenses...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Licenses</h1>
      {licenses.map((lic) => (
        <Card key={lic.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{lic.product}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 text-xs">{lic.key}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyKey(lic.key)}
                  disabled={pendingKey !== null}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <StatusBadge status={lic.status} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Activations</p>
                <p className="text-sm font-medium">
                  {lic.devices.length}/{lic.maxActivations}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="text-sm font-medium">{lic.expires}</p>
              </div>
            </div>
            {lic.devices.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Activated Devices</p>
                {lic.devices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{d.activated}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive text-xs"
                        disabled={pendingKey !== null}
                        onClick={() => runDeactivate(lic.id, d.id)}
                      >
                        {pendingKey === `deactivate-${d.id}` && (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        )}
                        Deactivate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <div className="flex gap-2">
                <Input
                  value={deviceNames[lic.id] ?? ""}
                  onChange={(e) =>
                    setDeviceNames((prev) => ({ ...prev, [lic.id]: e.target.value }))
                  }
                  placeholder="Device name"
                  className="h-8 max-w-48 text-xs"
                  disabled={pendingKey !== null || lic.devices.length >= lic.maxActivations}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pendingKey !== null ||
                    lic.devices.length >= lic.maxActivations ||
                    !(deviceNames[lic.id] ?? "").trim()
                  }
                  onClick={() => runActivate(lic.id)}
                >
                  {pendingKey === `activate-${lic.id}` && (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  )}
                  Activate New Device
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default CustomerLicenses;
