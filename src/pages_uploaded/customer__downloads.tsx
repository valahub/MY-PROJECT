
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Package, Loader2, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { toast } from "sonner";

({
  component: CustomerDownloadsPage,
  head: () => ({ meta: [{ title: "Downloads — Customer Portal — ERP Vala" }] }),
});

const downloads = [
  {
    id: "DL-001",
    product: "CRM Pro",
    version: "3.2.1",
    platform: "Windows",
    size: "84.5 MB",
    license: "LIC-A1B2-C3D4",
    status: "active",
    released: "2024-01-15",
  },
  {
    id: "DL-002",
    product: "CRM Pro",
    version: "3.2.1",
    platform: "macOS",
    size: "92.1 MB",
    license: "LIC-A1B2-C3D4",
    status: "active",
    released: "2024-01-15",
  },
  {
    id: "DL-003",
    product: "Analytics Suite",
    version: "2.0.0",
    platform: "Web App",
    size: "—",
    license: "LIC-E5F6-G7H8",
    status: "active",
    released: "2024-01-10",
  },
  {
    id: "DL-004",
    product: "CRM Pro",
    version: "3.1.0",
    platform: "Windows",
    size: "82.3 MB",
    license: "LIC-A1B2-C3D4",
    status: "active",
    released: "2023-12-01",
  },
];

function CustomerDownloadsPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleDownload = async (downloadId: string, productName: string) => {
    setDownloadingId(downloadId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${productName} downloaded successfully`);
    } catch (error) {
      toast.error("Failed to download");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenApp = async (downloadId: string, productName: string) => {
    setOpeningId(downloadId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Opening ${productName}...`);
    } catch (error) {
      toast.error("Failed to open app");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Downloads & Delivery</h1>

      {["CRM Pro", "Analytics Suite"].map((product) => (
        <Card key={product}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-secondary" />
              <CardTitle>{product}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {downloads
                .filter((d) => d.product === product)
                .map((dl) => (
                  <div
                    key={dl.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          v{dl.version} — {dl.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dl.size} · Released {dl.released}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={dl.status} />
                      {dl.size !== "—" && (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(dl.id, dl.product)}
                          disabled={downloadingId === dl.id}
                        >
                          {downloadingId === dl.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-1 h-3 w-3" />
                          )}
                          {downloadingId === dl.id ? "Downloading..." : "Download"}
                        </Button>
                      )}
                      {dl.size === "—" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenApp(dl.id, dl.product)}
                          disabled={openingId === dl.id}
                        >
                          {openingId === dl.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <ExternalLink className="mr-1 h-3 w-3" />
                          )}
                          {openingId === dl.id ? "Opening..." : "Open App"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Download Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Download links are secured with time-limited tokens. Each link expires 24 hours after
            generation. Click a download button above to generate a new secure link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerDownloadsPage;
