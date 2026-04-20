
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/DataTable";
import { Receipt, Globe, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";
import {
  exportMarketplaceManagerData,
  getUiErrorMessage,
  recordMarketplaceManagerAction,
} from "@/lib/ui-actions-api";

({ component: TaxRules });

const RULES = [
  {
    id: "tx_001",
    country: "United Kingdom",
    code: "GB",
    rate: 20,
    type: "VAT",
    reverseCharge: false,
    status: "active",
  },
  {
    id: "tx_002",
    country: "Germany",
    code: "DE",
    rate: 19,
    type: "VAT",
    reverseCharge: true,
    status: "active",
  },
  {
    id: "tx_003",
    country: "Australia",
    code: "AU",
    rate: 10,
    type: "GST",
    reverseCharge: false,
    status: "active",
  },
  {
    id: "tx_004",
    country: "United States",
    code: "US",
    rate: 0,
    type: "Sales Tax",
    reverseCharge: false,
    status: "per-state",
  },
  {
    id: "tx_005",
    country: "India",
    code: "IN",
    rate: 18,
    type: "GST",
    reverseCharge: false,
    status: "active",
  },
  {
    id: "tx_006",
    country: "Canada",
    code: "CA",
    rate: 5,
    type: "GST/HST",
    reverseCharge: false,
    status: "active",
  },
];

function TaxRules() {
  const [isExporting, setIsExporting] = useState(false);

  const saveTaxAction = useSelfHealingAction(
    async (_payload: { save: true }, signal) => {
      if (signal.aborted) throw new Error("Tax save aborted");
      return recordMarketplaceManagerAction({
        action: "tax.rules.save",
        entity: "marketplace.tax",
        entityId: "global",
        details: "Tax and commission rules updated",
      });
    },
    {
      id: "admin-marketplace-tax-save",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to save tax rules.")),
    },
  );

  const cols = [
    { key: "country", header: "Country" },
    { key: "code", header: "Code" },
    { key: "type", header: "Type" },
    { key: "rate", header: "Rate %", render: (r: any) => `${r.rate}%` },
    {
      key: "reverseCharge",
      header: "Reverse-charge B2B",
      render: (r: any) =>
        r.reverseCharge ? (
          <span className="text-success text-xs">Enabled</span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${r.status === "active" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Receipt className="h-6 w-6" /> Tax & Commission Rules
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Per-country tax rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={cols}
            data={RULES}
            searchKey="country"
            onEdit={(r) => toast.info(`Edit ${r.country} rule`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Author commission tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Non-exclusive author</Label>
              <Input type="number" defaultValue="37.5" />
            </div>
            <div>
              <Label>Exclusive author (base)</Label>
              <Input type="number" defaultValue="50" />
            </div>
            <div>
              <Label>Elite Power tier</Label>
              <Input type="number" defaultValue="70" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-medium">Apply EU MOSS reporting</div>
              <div className="text-xs text-muted-foreground">Quarterly VAT submissions</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Withhold author tax (W-8/W-9)</div>
              <div className="text-xs text-muted-foreground">
                30% withholding for missing tax forms
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true);
            try {
              const result = await exportMarketplaceManagerData("authors");
              toast.success(`Tax CSV exported (${result.count} rows)`);
            } catch (error) {
              toast.error(getUiErrorMessage(error, "Export failed."));
            } finally {
              setIsExporting(false);
            }
          }}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export rules"}
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90"
          disabled={saveTaxAction.isLoading}
          onClick={() =>
            void saveTaxAction.trigger({ save: true }).then(() => {
              toast.success("Tax rules saved");
            })
          }
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

export default TaxRules;
