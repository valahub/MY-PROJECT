
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Trash2, FileText, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: CustomerPrivacyPage,
  head: () => ({ meta: [{ title: "Privacy & Data — ERP Vala" }] }),
});

function CustomerPrivacyPage() {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleExportJson = async () => {
    setIsExportingJson(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("JSON export requested. Check your email in 15 minutes.");
    } catch (error) {
      toast.error("Failed to request JSON export");
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("CSV export requested. Check your email in 15 minutes.");
    } catch (error) {
      toast.error("Failed to request CSV export");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    setIsDeletingAccount(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Account deletion requested. Data will be deleted within 30 days.");
    } catch (error) {
      toast.error("Failed to request account deletion");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Privacy & Data</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download a complete copy of your personal data including subscriptions, invoices,
              licenses, and account history. Available in JSON or CSV.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportJson}
                disabled={isExportingJson || isExportingCsv}
              >
                {isExportingJson ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {isExportingJson ? "Requesting..." : "Request JSON Export"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCsv}
                disabled={isExportingJson || isExportingCsv}
              >
                {isExportingCsv ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {isExportingCsv ? "Requesting..." : "Request CSV Export"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Exports are typically ready within 15 minutes and emailed to you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone
              and complies with GDPR Article 17 (Right to Erasure).
            </p>
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              All active subscriptions will be canceled and licenses revoked. Data deletion
              completes within 30 days.
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
              {isDeletingAccount ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isDeletingAccount ? "Requesting..." : "Request Account Deletion"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Consent & Marketing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Product updates", desc: "New features and improvements", on: true },
            { name: "Marketing emails", desc: "Promotions, offers, and newsletters", on: false },
            {
              name: "Usage analytics",
              desc: "Help us improve by sharing anonymous usage data",
              on: true,
            },
            {
              name: "Third-party data sharing",
              desc: "Partner integrations and ad personalization",
              on: false,
            },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Switch defaultChecked={p.on} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Legal Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="#"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
          >
            <span className="text-sm">Terms of Service</span>
            <span className="text-xs text-muted-foreground">v3.2 · Updated Jan 2024</span>
          </a>
          <a
            href="#"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
          >
            <span className="text-sm">Privacy Policy</span>
            <span className="text-xs text-muted-foreground">v2.8 · Updated Jan 2024</span>
          </a>
          <a
            href="#"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
          >
            <span className="text-sm">Data Processing Agreement (DPA)</span>
            <span className="text-xs text-muted-foreground">v1.5 · Updated Dec 2023</span>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
