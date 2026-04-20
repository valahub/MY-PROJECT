
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, DollarSign, FileText, Globe } from "lucide-react";
import { toast } from "sonner";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";
import { getUiErrorMessage, recordMarketplaceManagerAction } from "@/lib/ui-actions-api";

({
  component: MarketplaceSettings,
});

function MarketplaceSettings() {
  const saveSettingsAction = useSelfHealingAction(
    async (_payload: { save: true }, signal) => {
      if (signal.aborted) throw new Error("Settings save aborted");
      return recordMarketplaceManagerAction({
        action: "settings.update",
        entity: "marketplace.settings",
        entityId: "default",
        details: "Marketplace settings updated from admin panel",
      });
    },
    {
      id: "admin-marketplace-settings-save",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to save settings.")),
    },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" /> Marketplace Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Commission & Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Default platform commission (%)</Label>
            <Input type="number" defaultValue="30" />
          </div>
          <div>
            <Label>Buyer fee (%)</Label>
            <Input type="number" defaultValue="10" />
          </div>
          <div>
            <Label>Extended license multiplier</Label>
            <Input type="number" defaultValue="10" />
          </div>
          <div>
            <Label>Minimum item price (USD)</Label>
            <Input type="number" defaultValue="2" />
          </div>
          <div>
            <Label>Refund clearance window (days)</Label>
            <Input type="number" defaultValue="30" />
          </div>
          <div>
            <Label>Min withdrawal threshold (USD)</Label>
            <Input type="number" defaultValue="100" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Review policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Avg review SLA (hours)</Label>
              <Input type="number" defaultValue="48" />
            </div>
            <div>
              <Label>Max soft-reject cycles</Label>
              <Input type="number" defaultValue="3" />
            </div>
          </div>
          <div>
            <Label>Standard rejection notes (template)</Label>
            <Textarea
              rows={3}
              defaultValue="Thank you for your submission. After review, we cannot accept your item at this time. Please address the issues listed and resubmit."
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require live preview link</div>
              <div className="text-xs text-muted-foreground">
                Authors must provide a working demo URL
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require documentation</div>
              <div className="text-xs text-muted-foreground">PDF or hosted docs link mandatory</div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Display & SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Marketplace name</Label>
            <Input defaultValue="ERP Vala Market" />
          </div>
          <div>
            <Label>Default currency</Label>
            <Input defaultValue="USD" />
          </div>
          <div>
            <Label>Items per page</Label>
            <Input type="number" defaultValue="24" />
          </div>
          <div>
            <Label>Featured slots on homepage</Label>
            <Input type="number" defaultValue="8" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="bg-primary hover:bg-primary/90"
          disabled={saveSettingsAction.isLoading}
          onClick={() =>
            void saveSettingsAction.trigger({ save: true }).then(() => {
              toast.success("Marketplace settings saved");
            })
          }
        >
          Save settings
        </Button>
      </div>
    </div>
  );
}
