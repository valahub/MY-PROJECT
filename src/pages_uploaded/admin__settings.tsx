
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Edit, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminSettings });

function AdminSettings() {
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [isConfiguringTax, setIsConfiguringTax] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("General settings saved successfully");
    } catch (error) {
      toast.error("Failed to save general settings");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveBilling = async () => {
    setIsSavingBilling(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Billing settings saved successfully");
    } catch (error) {
      toast.error("Failed to save billing settings");
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handleConfigureTax = async () => {
    setIsConfiguringTax(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Tax rules configured successfully");
    } catch (error) {
      toast.error("Failed to configure tax rules");
    } finally {
      setIsConfiguringTax(false);
    }
  };

  const handleEditTemplate = async (template: string) => {
    setEditingTemplate(template);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`"${template}" template updated`);
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setEditingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name</label>
                <Input defaultValue="ERP Vala" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Support Email</label>
                <Input defaultValue="support@erpvala.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Currency</label>
                <Input defaultValue="USD" />
              </div>
              <Button onClick={handleSaveGeneral} disabled={isSavingGeneral}>
                {isSavingGeneral ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSavingGeneral ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Prefix</label>
                <Input defaultValue="INV-" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Grace Period (days)</label>
                <Input type="number" defaultValue="3" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-retry Failed Payments</label>
                <Input defaultValue="Enabled — 3 retries" readOnly />
              </div>
              <Button onClick={handleSaveBilling} disabled={isSavingBilling}>
                {isSavingBilling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSavingBilling ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="taxes" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure automatic tax calculations for supported regions.
              </p>
              <div className="space-y-2">
                {[
                  "United States — Sales Tax",
                  "European Union — VAT",
                  "United Kingdom — VAT",
                  "Canada — GST/HST",
                  "Australia — GST",
                ].map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{r}</span>
                    <span className="text-xs text-green-600 font-medium">Enabled</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={handleConfigureTax} disabled={isConfiguringTax}>
                {isConfiguringTax ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="mr-2 h-4 w-4" />
                )}
                {isConfiguringTax ? "Configuring..." : "Configure Tax Rules"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="emails" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Payment Receipt",
                "Subscription Created",
                "Subscription Canceled",
                "Payment Failed",
                "License Activated",
                "Invoice Generated",
              ].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">{t}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(t)}
                    disabled={editingTemplate === t}
                  >
                    {editingTemplate === t ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Edit className="mr-2 h-3 w-3" />
                    )}
                    {editingTemplate === t ? "Editing..." : "Edit Template"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
