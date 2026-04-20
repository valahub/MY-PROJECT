
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

({ component: AuthorRefunds });

const REFUNDS = [
  {
    id: "rf_001",
    item: "NovaPress SaaS Theme",
    buyer: "Buyer4912",
    reason: "Not as described",
    amount: 59,
    requested: "2024-12-14",
    status: "pending",
  },
  {
    id: "rf_002",
    item: "WP Booking Engine",
    buyer: "Buyer8821",
    reason: "Compatibility issue",
    amount: 35,
    requested: "2024-12-12",
    status: "pending",
  },
  {
    id: "rf_003",
    item: "WC Multi-Vendor",
    buyer: "Buyer1102",
    reason: "Bug — checkout broken",
    amount: 89,
    requested: "2024-12-08",
    status: "approved",
  },
  {
    id: "rf_004",
    item: "NovaPress SaaS Theme",
    buyer: "Buyer7723",
    reason: "Changed mind",
    amount: 59,
    requested: "2024-12-04",
    status: "rejected",
  },
];

function AuthorRefunds() {
  const cols = [
    { key: "item", header: "Item" },
    { key: "buyer", header: "Buyer" },
    { key: "reason", header: "Reason" },
    { key: "amount", header: "Amount", render: (r: any) => `$${r.amount}` },
    { key: "requested", header: "Requested" },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${r.status === "approved" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: any) =>
        r.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => toast.success(`Approved refund for ${r.item}`)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => toast.info("Disputed — escalated to platform")}
            >
              Dispute
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Refunds & Disputes</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Pending" value="2" icon={AlertCircle} />
        <StatCard title="Approved (30d)" value="6" icon={CheckCircle2} />
        <StatCard title="Disputed" value="1" icon={XCircle} />
        <StatCard
          title="Refund Rate"
          value="1.4%"
          change="-0.3%"
          changeType="positive"
          icon={DollarSign}
        />
      </div>
      <DataTable columns={cols} data={REFUNDS} searchKey="item" />
    </div>
  );
}

export default AuthorRefunds;
