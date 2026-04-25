
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Plus, DollarSign, Shield, FileText, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type TaxRule, type TaxRuleCreateInput, type CommissionTier, type StateTaxRule, type TaxRegion } from "@/lib/api/admin-services";

({ component: AdminMarketplaceTaxRules, head: () => ({ meta: [{ title: "Marketplace Tax Rules — Admin — ERP Vala" }] }) });

function AdminMarketplaceTaxRules() {
  const [loading, setLoading] = useState(true);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [stateTaxRules, setStateTaxRules] = useState<StateTaxRule[]>([]);
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [isCreatingTax, setIsCreatingTax] = useState(false);
  const [isCreatingTier, setIsCreatingTier] = useState(false);
  const [isCreatingStateTax, setIsCreatingStateTax] = useState(false);
  const [taxInput, setTaxInput] = useState<TaxRuleCreateInput>({
    country: "",
    countryCode: "",
    type: "vat",
    rate: 0,
    reverseCharge: false,
    roundingRule: "round_half_up",
  });
  const [tierInput, setTierInput] = useState({
    name: "non_exclusive" as "non_exclusive" | "exclusive" | "elite",
    rate: 37.5,
    minSales: 0,
    minRevenue: 0,
  });
  const [stateTaxInput, setStateTaxInput] = useState({
    countryCode: "",
    stateCode: "",
    stateName: "",
    taxRate: 0,
    zipCodes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setTaxRules(marketplaceService.getTaxRules());
      setCommissionTiers(marketplaceService.getCommissionTiers());
      setStateTaxRules(marketplaceService.getStateTaxRules());
      setTaxRegions(marketplaceService.getTaxRegions());
    } catch (error) {
      toast.error("Failed to load tax rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTaxRule = async () => {
    try {
      await marketplaceService.createTaxRule(taxInput, "admin");
      toast.success("Tax rule created");
      setIsCreatingTax(false);
      setTaxInput({
        country: "",
        countryCode: "",
        type: "vat",
        rate: 0,
        reverseCharge: false,
        roundingRule: "round_half_up",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tax rule");
    }
  };

  const handleCreateCommissionTier = async () => {
    try {
      await marketplaceService.createCommissionTier(tierInput.name, tierInput.rate, tierInput.minSales, tierInput.minRevenue, "admin");
      toast.success("Commission tier created");
      setIsCreatingTier(false);
      setTierInput({
        name: "non_exclusive",
        rate: 37.5,
        minSales: 0,
        minRevenue: 0,
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create commission tier");
    }
  };

  const handleCreateStateTaxRule = async () => {
    try {
      const zipCodesArray = stateTaxInput.zipCodes ? stateTaxInput.zipCodes.split(",").map(z => z.trim()) : undefined;
      await marketplaceService.createStateTaxRule(
        stateTaxInput.countryCode,
        stateTaxInput.stateCode,
        stateTaxInput.stateName,
        stateTaxInput.taxRate,
        zipCodesArray,
        "admin"
      );
      toast.success("State tax rule created");
      setIsCreatingStateTax(false);
      setStateTaxInput({
        countryCode: "",
        stateCode: "",
        stateName: "",
        taxRate: 0,
        zipCodes: "",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create state tax rule");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tax & Commission Rules</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreatingTax(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tax Rule
          </Button>
          <Button onClick={() => setIsCreatingTier(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Commission Tier
          </Button>
          <Button onClick={() => setIsCreatingStateTax(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add State Tax Rule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Tax Rules" value={taxRules.filter((r) => r.status === "active").length.toString()} icon={Shield} />
        <StatCard title="Commission Tiers" value={commissionTiers.length.toString()} icon={DollarSign} />
        <StatCard title="Countries Covered" value={new Set(taxRules.map((r) => r.countryCode)).size.toString()} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : taxRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tax rules configured</p>
          ) : (
            <div className="space-y-2">
              {taxRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rule.country}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{rule.countryCode}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{rule.type.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${rule.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {rule.status.toUpperCase()}
                      </span>
                      {rule.reverseCharge && <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">REVERSE CHARGE</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Rate: {rule.rate}%</span>
                      {rule.stateTax && <span>State Tax: {rule.stateTax}%</span>}
                      {rule.digitalServiceTax && <span>DST: {rule.digitalServiceTax}%</span>}
                      <span>Version: {rule.version}</span>
                      <span>Rounding: {rule.roundingRule}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          {commissionTiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commission tiers configured</p>
          ) : (
            <div className="space-y-2">
              {commissionTiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tier.name.replace("_", " ").toUpperCase()}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{tier.rate}%</span>
                      {tier.autoUpgrade && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">AUTO UPGRADE</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Min Sales: {tier.minSales}</span>
                      <span>Min Revenue: {formatCurrency(tier.minRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>State Tax Rules (US)</CardTitle>
        </CardHeader>
        <CardContent>
          {stateTaxRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No state tax rules configured</p>
          ) : (
            <div className="space-y-2">
              {stateTaxRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rule.stateName}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{rule.countryCode}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{rule.stateCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {rule.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Rate: {rule.taxRate}%</span>
                      {rule.zipCodes && rule.zipCodes.length > 0 && (
                        <span>Zip Codes: {rule.zipCodes.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreatingTax} onOpenChange={() => setIsCreatingTax(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tax Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country</label>
              <Input
                value={taxInput.country}
                onChange={(e) => setTaxInput({ ...taxInput, country: e.target.value })}
                placeholder="e.g., United States"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country Code</label>
              <Input
                value={taxInput.countryCode}
                onChange={(e) => setTaxInput({ ...taxInput, countryCode: e.target.value.toUpperCase() })}
                placeholder="e.g., US"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tax Type</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={taxInput.type}
                onChange={(e) => setTaxInput({ ...taxInput, type: e.target.value as "vat" | "gst" | "sales_tax" | "digital_service_tax" })}
              >
                <option value="vat">VAT</option>
                <option value="gst">GST</option>
                <option value="sales_tax">Sales Tax</option>
                <option value="digital_service_tax">Digital Service Tax</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={taxInput.rate}
                onChange={(e) => setTaxInput({ ...taxInput, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">State Tax (%)</label>
              <Input
                type="number"
                step="0.01"
                value={taxInput.stateTax || ""}
                onChange={(e) => setTaxInput({ ...taxInput, stateTax: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Digital Service Tax (%)</label>
              <Input
                type="number"
                step="0.01"
                value={taxInput.digitalServiceTax || ""}
                onChange={(e) => setTaxInput({ ...taxInput, digitalServiceTax: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reverseCharge"
                checked={taxInput.reverseCharge}
                onChange={(e) => setTaxInput({ ...taxInput, reverseCharge: e.target.checked })}
              />
              <label htmlFor="reverseCharge" className="text-sm">Enable Reverse Charge (B2B)</label>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rounding Rule</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={taxInput.roundingRule}
                onChange={(e) => setTaxInput({ ...taxInput, roundingRule: e.target.value as TaxRule["roundingRule"] })}
              >
                <option value="round_half_up">Round Half Up</option>
                <option value="round_half_down">Round Half Down</option>
                <option value="round_up">Round Up</option>
                <option value="round_down">Round Down</option>
              </select>
            </div>
            <Button onClick={handleCreateTaxRule} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Tax Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingTier} onOpenChange={() => setIsCreatingTier(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Commission Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tier Name</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={tierInput.name}
                onChange={(e) => setTierInput({ ...tierInput, name: e.target.value as "non_exclusive" | "exclusive" | "elite" })}
              >
                <option value="non_exclusive">Non-Exclusive (37.5%)</option>
                <option value="exclusive">Exclusive (50%)</option>
                <option value="elite">Elite (70%)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Commission Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                value={tierInput.rate}
                onChange={(e) => setTierInput({ ...tierInput, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Minimum Sales</label>
              <Input
                type="number"
                value={tierInput.minSales}
                onChange={(e) => setTierInput({ ...tierInput, minSales: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Minimum Revenue</label>
              <Input
                type="number"
                step="0.01"
                value={tierInput.minRevenue}
                onChange={(e) => setTierInput({ ...tierInput, minRevenue: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={handleCreateCommissionTier} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Commission Tier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingStateTax} onOpenChange={() => setIsCreatingStateTax(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create State Tax Rule (US)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country Code</label>
              <Input
                value={stateTaxInput.countryCode}
                onChange={(e) => setStateTaxInput({ ...stateTaxInput, countryCode: e.target.value.toUpperCase() })}
                placeholder="e.g., US"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">State Code</label>
              <Input
                value={stateTaxInput.stateCode}
                onChange={(e) => setStateTaxInput({ ...stateTaxInput, stateCode: e.target.value.toUpperCase() })}
                placeholder="e.g., CA"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">State Name</label>
              <Input
                value={stateTaxInput.stateName}
                onChange={(e) => setStateTaxInput({ ...stateTaxInput, stateName: e.target.value })}
                placeholder="e.g., California"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tax Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={stateTaxInput.taxRate}
                onChange={(e) => setStateTaxInput({ ...stateTaxInput, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Zip Codes (comma-separated)</label>
              <Input
                value={stateTaxInput.zipCodes}
                onChange={(e) => setStateTaxInput({ ...stateTaxInput, zipCodes: e.target.value })}
                placeholder="e.g., 90210, 90211"
              />
            </div>
            <Button onClick={handleCreateStateTaxRule} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create State Tax Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceTaxRules;
