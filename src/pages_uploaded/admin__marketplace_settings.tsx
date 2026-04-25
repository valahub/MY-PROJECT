
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Settings, DollarSign, Clock, Shield, History } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MarketplaceSettings, type MarketplaceSettingsUpdateInput, type SettingsAuditLog } from "@/lib/api/admin-services";

({ component: AdminMarketplaceSettings, head: () => ({ meta: [{ title: "Marketplace Settings — Admin — ERP Vala" }] }) });

function AdminMarketplaceSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<SettingsAuditLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingLogs, setIsViewingLogs] = useState(false);
  const [settingsInput, setSettingsInput] = useState<MarketplaceSettingsUpdateInput>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const currentSettings = marketplaceService.getCurrentSettings();
      setSettings(currentSettings);
      setAuditLogs(marketplaceService.getSettingsAuditLogs());
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSettings = async () => {
    try {
      await marketplaceService.updateSettings(settingsInput, "admin");
      toast.success("Settings updated");
      setIsEditing(false);
      setSettingsInput({});
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    }
  };

  const handleEdit = () => {
    if (settings) {
      setSettingsInput({
        defaultCommission: settings.defaultCommission,
        buyerFee: settings.buyerFee,
        extendedLicenseMultiplier: settings.extendedLicenseMultiplier,
        minimumItemPrice: settings.minimumItemPrice,
        refundClearanceWindow: settings.refundClearanceWindow,
        minWithdrawalThreshold: settings.minWithdrawalThreshold,
        reviewSLA: settings.reviewSLA,
        maxSoftRejectCycles: settings.maxSoftRejectCycles,
        baseCurrency: settings.baseCurrency,
        useLiveRates: settings.useLiveRates,
        taxMode: settings.taxMode,
        applyEU_MOSS: settings.applyEU_MOSS,
        applyWithholdingTax: settings.applyWithholdingTax,
        safeMode: settings.safeMode,
      });
      setIsEditing(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsViewingLogs(true)}>
            <History className="mr-2 h-4 w-4" />
            Audit Logs
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Default Commission" value={`${settings?.defaultCommission || 0}%`} icon={DollarSign} />
        <StatCard title="Buyer Fee" value={`${settings?.buyerFee || 0}%`} icon={DollarSign} />
        <StatCard title="Min Item Price" value={formatCurrency(settings?.minimumItemPrice || 0)} icon={DollarSign} />
        <StatCard title="Settings Version" value={`v${settings?.version || 1}`} icon={Shield} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission & Fees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : settings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Default Commission</label>
                  <p className="text-lg font-bold">{settings.defaultCommission}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Buyer Fee</label>
                  <p className="text-lg font-bold">{settings.buyerFee}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Extended License Multiplier</label>
                  <p className="text-lg font-bold">{settings.extendedLicenseMultiplier}x</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Minimum Item Price</label>
                  <p className="text-lg font-bold">{formatCurrency(settings.minimumItemPrice)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Refund Clearance Window</label>
                  <p className="text-lg font-bold">{settings.refundClearanceWindow} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Withdrawal Threshold</label>
                  <p className="text-lg font-bold">{formatCurrency(settings.minWithdrawalThreshold)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Policy</CardTitle>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Review SLA</label>
                <p className="text-lg font-bold">{settings.reviewSLA} hours</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Soft Reject Cycles</label>
                <p className="text-lg font-bold">{settings.maxSoftRejectCycles}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Tax</CardTitle>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Base Currency</label>
                <p className="text-lg font-bold">{settings.baseCurrency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Use Live Rates</label>
                <p className="text-lg font-bold">{settings.useLiveRates ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax Mode</label>
                <p className="text-lg font-bold">{settings.taxMode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Apply EU MOSS</label>
                <p className="text-lg font-bold">{settings.applyEU_MOSS ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Apply Withholding Tax</label>
                <p className="text-lg font-bold">{settings.applyWithholdingTax ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Safe Mode</label>
                <p className="text-lg font-bold">{settings.safeMode ? "Yes" : "No"}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version Info</CardTitle>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <p className="text-sm">v{settings.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Effective From</label>
                <p className="text-sm">{formatDate(settings.effectiveFrom)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{formatDate(settings.updatedAt)}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marketplace Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Commission & Fees</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Default Commission (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsInput.defaultCommission || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, defaultCommission: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Buyer Fee (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsInput.buyerFee || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, buyerFee: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Extended License Multiplier</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsInput.extendedLicenseMultiplier || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, extendedLicenseMultiplier: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Minimum Item Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settingsInput.minimumItemPrice || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, minimumItemPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Refund Clearance Window (days)</label>
                  <Input
                    type="number"
                    value={settingsInput.refundClearanceWindow || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, refundClearanceWindow: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Withdrawal Threshold</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settingsInput.minWithdrawalThreshold || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, minWithdrawalThreshold: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Review Policy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Review SLA (hours)</label>
                  <Input
                    type="number"
                    value={settingsInput.reviewSLA || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, reviewSLA: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Soft Reject Cycles</label>
                  <Input
                    type="number"
                    value={settingsInput.maxSoftRejectCycles || ""}
                    onChange={(e) => setSettingsInput({ ...settingsInput, maxSoftRejectCycles: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-medium mb-3">Currency & Tax</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Base Currency</label>
                  <select
                    className="w-full mt-1 p-2 border rounded"
                    value={settingsInput.baseCurrency || "USD"}
                    onChange={(e) => setSettingsInput({ ...settingsInput, baseCurrency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="useLiveRates"
                    checked={settingsInput.useLiveRates || false}
                    onChange={(e) => setSettingsInput({ ...settingsInput, useLiveRates: e.target.checked })}
                  />
                  <label htmlFor="useLiveRates" className="text-sm">Use Live Exchange Rates</label>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax Mode</label>
                  <select
                    className="w-full mt-1 p-2 border rounded"
                    value={settingsInput.taxMode || "exclusive"}
                    onChange={(e) => setSettingsInput({ ...settingsInput, taxMode: e.target.value as "inclusive" | "exclusive" })}
                  >
                    <option value="exclusive">Exclusive (tax added)</option>
                    <option value="inclusive">Inclusive (tax included)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="applyEU_MOSS"
                    checked={settingsInput.applyEU_MOSS || false}
                    onChange={(e) => setSettingsInput({ ...settingsInput, applyEU_MOSS: e.target.checked })}
                  />
                  <label htmlFor="applyEU_MOSS" className="text-sm">Apply EU MOSS</label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="applyWithholdingTax"
                    checked={settingsInput.applyWithholdingTax || false}
                    onChange={(e) => setSettingsInput({ ...settingsInput, applyWithholdingTax: e.target.checked })}
                  />
                  <label htmlFor="applyWithholdingTax" className="text-sm">Apply Withholding Tax (W-8/W-9)</label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="safeMode"
                    checked={settingsInput.safeMode !== false}
                    onChange={(e) => setSettingsInput({ ...settingsInput, safeMode: e.target.checked })}
                  />
                  <label htmlFor="safeMode" className="text-sm">Safe Mode (fallback to defaults on error)</label>
                </div>
              </div>
            </div>

            <Button onClick={handleUpdateSettings} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Update Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingLogs} onOpenChange={() => setIsViewingLogs(false)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings Audit Logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Version {log.version}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Changed by: {log.changedBy}</div>
                  <div className="space-y-1">
                    {Object.entries(log.changes).map(([key, change]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium">{key}:</span> {JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceSettings;
