
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ITEMS } from "@/lib/marketplace-data";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Download, RefreshCw, Camera } from "lucide-react";
import {
  acquireMarketplaceEditLock,
  exportMarketplaceManagerData,
  getUiErrorMessage,
  recordMarketplaceManagerAction,
  releaseMarketplaceEditLock,
  runMarketplaceConsistencyCheck,
  snapshotMarketplaceManagerState,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: AdminItems });

function AdminItems() {
  const [data, setData] = useState(ITEMS.map((i) => ({ ...i, status: "active" as const })));
  const [isExporting, setIsExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const takedownAction = useSelfHealingAction(
    async (payload: { id: string; title: string }, signal) => {
      if (signal.aborted) throw new Error("Takedown aborted");
      await acquireMarketplaceEditLock("item", payload.id, "admin.marketplace");
      try {
        await recordMarketplaceManagerAction({
          action: "item.takedown",
          entity: "item",
          entityId: payload.id,
          details: `${payload.title} removed from listing`,
          idempotencyKey: `item-takedown-${payload.id}-${Date.now()}`,
        });
      } finally {
        await releaseMarketplaceEditLock("item", payload.id, "admin.marketplace");
      }
      return payload.id;
    },
    {
      id: "admin-marketplace-item-takedown",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: (id) => setData((prev) => prev.filter((entry) => entry.id !== id)),
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to take down item.")),
    },
  );

  const columns = [
    { key: "title", header: "Item" },
    { key: "author", header: "Author" },
    { key: "category", header: "Category" },
    { key: "price", header: "Price", render: (i: any) => `$${i.price}` },
    { key: "sales", header: "Sales", render: (i: any) => i.sales.toLocaleString() },
    { key: "rating", header: "Rating", render: (i: any) => `${i.rating} ★` },
    { key: "status", header: "Status", render: (i: any) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">All Items</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              try {
                const result = await exportMarketplaceManagerData("submissions");
                toast.success(`Exported ${result.count} records`);
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
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            variant="outline"
            disabled={isScanning}
            onClick={async () => {
              setIsScanning(true);
              try {
                const findings = await runMarketplaceConsistencyCheck(true);
                toast.success(`Consistency scan: ${findings.length} finding(s)`);
              } catch (error) {
                toast.error(getUiErrorMessage(error, "Consistency check failed."));
              } finally {
                setIsScanning(false);
              }
            }}
          >
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isScanning ? "Scanning..." : "Scan"}
          </Button>
          <Button
            variant="outline"
            disabled={isSnapshotting}
            onClick={async () => {
              setIsSnapshotting(true);
              try {
                const snapshot = await snapshotMarketplaceManagerState("Items moderation checkpoint");
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
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        onEdit={(i) => {
          toast.info(`Edit ${i.title}`);
        }}
        onDelete={(i) => {
          void takedownAction.trigger({ id: i.id, title: i.title }).then(() => {
            toast.warning(`Item ${i.title} taken down`);
          });
        }}
        getItemLabel={(i) => i.title}
      />
    </div>
  );
}

export default AdminItems;
