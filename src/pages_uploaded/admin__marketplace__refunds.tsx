
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  createMarketplaceDisputeTicket,
  getMarketplaceDisputes,
  getMarketplaceRefunds,
  getUiErrorMessage,
  updateMarketplaceRefundStatus,
  type MarketplaceRefundRequest,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: AdminRefunds });

function AdminRefunds() {
  const [refunds, setRefunds] = useState<MarketplaceRefundRequest[]>([]);
  const [openDisputes, setOpenDisputes] = useState(0);

  useEffect(() => {
    void getMarketplaceRefunds()
      .then(setRefunds)
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load refunds.")));

    void getMarketplaceDisputes()
      .then((tickets) =>
        setOpenDisputes(tickets.filter((ticket) => ticket.status === "open").length),
      )
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load disputes.")));
  }, []);

  const updateRefundAction = useSelfHealingAction(
    async (payload: { id: string; status: "approved" | "rejected" }, signal) => {
      if (signal.aborted) throw new Error("Refund update aborted");
      return updateMarketplaceRefundStatus(payload.id, payload.status);
    },
    {
      id: "admin-marketplace-refund-update",
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: setRefunds,
      onError: (error) => toast.error(getUiErrorMessage(error, "Failed to update refund.")),
    },
  );

  const cols = [
    { key: "id", header: "ID" },
    { key: "item", header: "Item" },
    { key: "buyer", header: "Buyer" },
    { key: "author", header: "Author" },
    { key: "reason", header: "Reason" },
    { key: "amount", header: "Amount", render: (r: any) => `$${r.amount}` },
    { key: "requested", header: "Requested" },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${r.status === "approved" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : r.status === "escalated" ? "bg-info/15 text-info" : "bg-accent/15 text-accent"}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: any) =>
        r.status === "pending" || r.status === "escalated" ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-success hover:bg-success/90 text-white h-7"
              disabled={updateRefundAction.isLoading}
              onClick={() =>
                void updateRefundAction
                  .trigger({ id: r.id, status: "approved" })
                  .then(() => toast.success(`Refund ${r.id} approved`))
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={updateRefundAction.isLoading}
              onClick={() =>
                void updateRefundAction
                  .trigger({ id: r.id, status: "rejected" })
                  .then(() => toast.info(`Refund ${r.id} denied`))
              }
            >
              Deny
            </Button>
            {!r.escalated && (
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() =>
                  void createMarketplaceDisputeTicket({
                    refundId: r.id,
                    evidence: `Escalated by admin for ${r.item}`,
                  })
                    .then(() => getMarketplaceDisputes())
                    .then((tickets) => {
                      setOpenDisputes(tickets.filter((ticket) => ticket.status === "open").length);
                      toast.info(`Dispute opened for ${r.id}`);
                    })
                    .catch((error) =>
                      toast.error(getUiErrorMessage(error, "Could not open dispute.")),
                    )
                }
              >
                Escalate
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Refunds Management</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Pending" value="14" icon={AlertCircle} />
        <StatCard
          title="Escalated"
          value={openDisputes.toString()}
          change="Author disputes"
          changeType="negative"
          icon={XCircle}
        />
        <StatCard title="Approved (30d)" value="89" icon={CheckCircle2} />
        <StatCard
          title="Refund Volume"
          value="$4,820"
          change="1.8% of GMV"
          changeType="neutral"
          icon={DollarSign}
        />
      </div>
      <DataTable columns={cols} data={refunds} searchKey="item" />
    </div>
  );
}
