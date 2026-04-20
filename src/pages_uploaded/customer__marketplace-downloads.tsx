import { Link } from "react-router-dom";
import { coverFor } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Key, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  getMarketplacePurchases,
  getUiErrorMessage,
  openMarketplaceInvoice,
  renewMarketplaceSupport,
  requestMarketplaceRefund,
  startMarketplaceDownload,
  type MarketplacePurchaseItem,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({
  component: MarketplaceDownloads,
});

function MarketplaceDownloads() {
  const [purchases, setPurchases] = useState<MarketplacePurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDownloadOrderId, setActiveDownloadOrderId] = useState<string | null>(null);
  const [activeInvoiceOrderId, setActiveInvoiceOrderId] = useState<string | null>(null);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      setPurchases(await getMarketplacePurchases());
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load purchases."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPurchases();
  }, []);

  const renewSupportAction = useSelfHealingAction(
    async (payload: { orderId: string }, signal) => {
      if (signal.aborted) throw new Error("Renew support action aborted");
      return renewMarketplaceSupport(payload.orderId);
    },
    {
      id: "marketplace-downloads-renew-support",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => {
        setPurchases(next);
        toast.success("Support renewed for 6 months");
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to renew support.")),
    },
  );

  const refundAction = useSelfHealingAction(
    async (payload: { orderId: string }, signal) => {
      if (signal.aborted) throw new Error("Refund action aborted");
      return requestMarketplaceRefund(payload.orderId);
    },
    {
      id: "marketplace-downloads-request-refund",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => {
        setPurchases(next);
        toast.success("Refund request submitted");
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to request refund.")),
    },
  );

  const downloadAction = useSelfHealingAction(
    async (payload: { orderId: string }, signal) => {
      if (signal.aborted) throw new Error("Download action aborted");
      return startMarketplaceDownload(payload.orderId);
    },
    {
      id: "marketplace-downloads-start-download",
      retry: { maxAttempts: 2, backoffMs: 500 },
      onSuccess: ({ fileName }) => {
        toast.success(`Download ready: ${fileName}`);
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to start download.")),
    },
  );

  const handleDownload = async (orderId: string) => {
    setActiveDownloadOrderId(orderId);
    try {
      await downloadAction.trigger({ orderId });
    } finally {
      setActiveDownloadOrderId(null);
    }
  };

  const invoiceAction = useSelfHealingAction(
    async (payload: { orderId: string }, signal) => {
      if (signal.aborted) throw new Error("Invoice action aborted");
      return openMarketplaceInvoice(payload.orderId);
    },
    {
      id: "marketplace-downloads-open-invoice",
      retry: { maxAttempts: 2, backoffMs: 500 },
      onSuccess: ({ invoiceNo }) => {
        toast.success(`Invoice ready: ${invoiceNo}`);
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to open invoice.")),
    },
  );

  const handleInvoice = async (orderId: string) => {
    setActiveInvoiceOrderId(orderId);
    try {
      await invoiceAction.trigger({ orderId });
    } finally {
      setActiveInvoiceOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Downloads</h1>
        <p className="text-sm text-muted-foreground">
          Re-download purchased items, view license keys, request refunds.
        </p>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading purchases...
            </CardContent>
          </Card>
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No marketplace purchases yet.
            </CardContent>
          </Card>
        ) : (
          purchases.map((p) => (
            <Card key={p.orderId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div
                    className="h-20 w-28 rounded flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: coverFor(p.itemId) }}
                  >
                    {p.title.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/marketplace/item/$slug"
                      className="font-semibold hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      by {p.author} · Purchased {p.purchaseDate} · {p.invoiceNo}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded ${p.license === "extended" ? "bg-accent/15 text-accent" : "bg-info/15 text-info"}`}
                      >
                        {p.license} license
                      </span>
                      <span className="text-muted-foreground">v{p.version}</span>
                      <span className="text-muted-foreground">Support until {p.supportUntil}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      <Input
                        readOnly
                        value={p.licenseKey}
                        className="h-7 text-xs font-mono max-w-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => {
                          navigator.clipboard?.writeText(p.licenseKey);
                          toast.success("Key copied");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      disabled={downloadAction.isLoading && activeDownloadOrderId === p.orderId}
                      onClick={() => void handleDownload(p.orderId)}
                    >
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={invoiceAction.isLoading && activeInvoiceOrderId === p.orderId}
                      onClick={() => void handleInvoice(p.orderId)}
                    >
                      Invoice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={renewSupportAction.isLoading}
                      onClick={() => void renewSupportAction.trigger({ orderId: p.orderId })}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Renew support
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={refundAction.isLoading || p.refundStatus === "requested"}
                      onClick={() => void refundAction.trigger({ orderId: p.orderId })}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" /> Request refund
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default MarketplaceDownloads;
