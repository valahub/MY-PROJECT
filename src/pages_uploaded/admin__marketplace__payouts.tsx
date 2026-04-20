
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Clock, CheckCircle2, Loader2, Download, RefreshCw, Camera } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  acquireMarketplaceEditLock,
  batchProcessMarketplacePayouts,
  checkMarketplacePayoutEligibility,
  exportMarketplaceManagerData,
  getMarketplacePayouts,
  getUiErrorMessage,
  reconcileMarketplacePayouts,
  releaseMarketplaceEditLock,
  snapshotMarketplaceManagerState,
  updateMarketplacePayoutStatus,
  type MarketplacePayout,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: PayoutsManager });

function PayoutsManager() {
  const [payouts, setPayouts] = useState<MarketplacePayout[]>([]);
  const [lastReconcileMismatches, setLastReconcileMismatches] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  useEffect(() => {
    void getMarketplacePayouts()
      .then(setPayouts)
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load payouts.")));
  }, []);

  const updatePayoutAction = useSelfHealingAction(
    async (payload: { id: string; status: "paid" | "held" }, signal) => {
      if (signal.aborted) throw new Error("Payout update aborted");
      return updateMarketplacePayoutStatus(payload.id, payload.status);
    },
    {
      id: "admin-marketplace-payout-update",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: setPayouts,
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not update payout.")),
    },
  );

  const processAllAction = useSelfHealingAction(
    async (_payload: { process: true }, signal) => {
      if (signal.aborted) throw new Error("Batch payout action aborted");
      return batchProcessMarketplacePayouts();
    },
    {
      id: "admin-marketplace-payout-process-all",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: setPayouts,
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not queue batch payout.")),
    },
  );

  const columns = [
    { key: "author", header: "Author" },
    { key: "method", header: "Method" },
    {
      key: "amount",
      header: "Amount",
      render: (p: any) => <span className="font-semibold">${p.amount.toLocaleString()}</span>,
    },
    { key: "period", header: "Period" },
    { key: "requested", header: "Requested" },
    {
      key: "status",
      header: "Status",
      render: (p: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${p.status === "paid" ? "bg-success/15 text-success" : p.status === "processing" ? "bg-info/15 text-info" : "bg-accent/15 text-accent"}`}
        >
          {p.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p: any) =>
        p.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-success hover:bg-success/90 text-white h-7"
              disabled={updatePayoutAction.isLoading}
              onClick={async () => {
                try {
                  const eligibility = await checkMarketplacePayoutEligibility(p.author);
                  if (!eligibility.eligible) {
                    toast.warning(`Cannot pay ${p.author}: ${eligibility.holdReason}`);
                    return;
                  }
                  await acquireMarketplaceEditLock("payout", p.id, "admin.marketplace");
                  await updatePayoutAction.trigger({ id: p.id, status: "paid" });
                  toast.success(`Payout to ${p.author} processed`);
                } catch (error) {
                  toast.error(getUiErrorMessage(error, "Failed to process payout."));
                } finally {
                  void releaseMarketplaceEditLock("payout", p.id, "admin.marketplace");
                }
              }}
            >
              Pay
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={updatePayoutAction.isLoading}
              onClick={() =>
                void updatePayoutAction
                  .trigger({ id: p.id, status: "held" })
                  .then(() => toast.info(`Payout held for review`))
              }
            >
              Hold
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Author Payouts</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Total Pending" value="$84,250" icon={Clock} />
        <StatCard title="Processed (Dec)" value="$184,500" icon={CheckCircle2} />
        <StatCard title="Authors Paid YTD" value="412" icon={Users} />
        <StatCard title="Avg Payout" value="$847" icon={DollarSign} />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true);
            try {
              const result = await exportMarketplaceManagerData("payouts");
              toast.success(`Exported ${result.count} payouts`);
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
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
        <Button
          variant="outline"
          disabled={isReconciling}
          onClick={async () => {
            setIsReconciling(true);
            try {
              const report = await reconcileMarketplacePayouts();
              setLastReconcileMismatches(report.filter((row) => row.mismatch).length);
              toast.success(`Reconciled ${report.length} payout rows`);
            } catch (error) {
              toast.error(getUiErrorMessage(error, "Reconciliation failed."));
            } finally {
              setIsReconciling(false);
            }
          }}
        >
          {isReconciling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isReconciling ? "Reconciling..." : "Reconcile"}
        </Button>
        <Button
          variant="outline"
          disabled={isSnapshotting}
          onClick={async () => {
            setIsSnapshotting(true);
            try {
              const snapshot = await snapshotMarketplaceManagerState("Payouts review checkpoint");
              toast.success(`Snapshot ${snapshot.id} created`);
            } catch (error) {
              toast.error(getUiErrorMessage(error, "Snapshot failed."));
            } finally {
              setIsSnapshotting(false);
            }
          }}
        >
          {isSnapshotting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {isSnapshotting ? "Snapshotting..." : "Snapshot"}
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90"
          disabled={processAllAction.isLoading}
          onClick={() =>
            void processAllAction.trigger({ process: true }).then(() => {
              toast.success("Batch payout queued for 412 authors");
            })
          }
        >
          Process all pending
        </Button>
      </div>

      {lastReconcileMismatches > 0 && (
        <div className="text-xs text-destructive">
          Reconciliation warning: {lastReconcileMismatches} payout(s) have ledger mismatches.
        </div>
      )}

      <DataTable columns={columns} data={payouts} searchKey="author" />
    </div>
  );
}

export default PayoutsManager;
