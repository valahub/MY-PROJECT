
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, ArrowUpDown, RefreshCw, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminBillingPage,
  head: () => ({ meta: [{ title: "Billing — Admin — ERP Vala" }] }),
});

const invoices = [
  {
    id: "INV-2024-001",
    merchant: "Acme Corp",
    customer: "john@example.com",
    amount: "$299.00",
    status: "paid",
    issued: "2024-01-15",
    due: "2024-01-30",
  },
  {
    id: "INV-2024-002",
    merchant: "Beta Inc",
    customer: "jane@startup.io",
    amount: "$49.00",
    status: "paid",
    issued: "2024-01-14",
    due: "2024-01-29",
  },
  {
    id: "INV-2024-003",
    merchant: "Gamma LLC",
    customer: "bob@corp.com",
    amount: "$149.00",
    status: "pending",
    issued: "2024-01-13",
    due: "2024-01-28",
  },
  {
    id: "INV-2024-004",
    merchant: "Acme Corp",
    customer: "alice@web.com",
    amount: "$99.00",
    status: "past_due",
    issued: "2024-01-05",
    due: "2024-01-20",
  },
  {
    id: "INV-2024-005",
    merchant: "Delta Co",
    customer: "mike@dev.com",
    amount: "$599.00",
    status: "paid",
    issued: "2024-01-12",
    due: "2024-01-27",
  },
];

const retryQueue = [
  {
    id: "RTY-001",
    invoice: "INV-2024-004",
    customer: "alice@web.com",
    amount: "$99.00",
    attempts: 2,
    nextRetry: "2024-01-19 09:00",
    status: "pending",
  },
  {
    id: "RTY-002",
    invoice: "INV-2024-006",
    customer: "sam@test.com",
    amount: "$29.00",
    attempts: 3,
    nextRetry: "Grace period",
    status: "past_due",
  },
];

function AdminBillingPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Billing data exported successfully");
    } catch (error) {
      toast.error("Failed to export billing data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Button variant="outline" onClick={handleExportAll} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export All"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue (MTD)"
          value="$124,500"
          icon={DollarSign}
          change="+18.2% vs last month"
          changeType="positive"
        />
        <StatCard title="Invoices Issued" value="892" icon={Receipt} />
        <StatCard
          title="Pending Payments"
          value="34"
          icon={ArrowUpDown}
          change="$8,450 outstanding"
          changeType="neutral"
        />
        <StatCard
          title="Retry Queue"
          value="2"
          icon={RefreshCw}
          change="Auto-retrying"
          changeType="neutral"
        />
      </div>

      <DataTable
        title="Invoices"
        columns={[
          { header: "Invoice", accessorKey: "id" },
          { header: "Merchant", accessorKey: "merchant" },
          { header: "Customer", accessorKey: "customer" },
          { header: "Amount", accessorKey: "amount" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Issued", accessorKey: "issued" },
          { header: "Due", accessorKey: "due" },
        ]}
        data={invoices}
      />

      <DataTable
        title="Payment Retry Queue"
        columns={[
          { header: "Invoice", accessorKey: "invoice" },
          { header: "Customer", accessorKey: "customer" },
          { header: "Amount", accessorKey: "amount" },
          { header: "Attempts", accessorKey: "attempts" },
          { header: "Next Retry", accessorKey: "nextRetry" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={retryQueue}
      />
    </div>
  );
}
