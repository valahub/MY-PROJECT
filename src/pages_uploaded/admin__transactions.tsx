
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminTransactions });

const transactions = [
  {
    id: "txn_001",
    customer: "John Doe",
    type: "Payment",
    amount: "$29.00",
    status: "completed",
    method: "Visa •••• 4242",
    date: "2024-07-15",
  },
  {
    id: "txn_002",
    customer: "Jane Smith",
    type: "Payment",
    amount: "$499.00",
    status: "completed",
    method: "Mastercard •••• 5555",
    date: "2024-07-14",
  },
  {
    id: "txn_003",
    customer: "Bob Wilson",
    type: "Refund",
    amount: "-$29.00",
    status: "refunded",
    method: "Visa •••• 1234",
    date: "2024-07-13",
  },
  {
    id: "txn_004",
    customer: "Alice Brown",
    type: "Payment",
    amount: "$49.00",
    status: "pending",
    method: "PayPal",
    date: "2024-07-12",
  },
  {
    id: "txn_005",
    customer: "Charlie Davis",
    type: "Payment",
    amount: "$79.00",
    status: "completed",
    method: "Visa •••• 9876",
    date: "2024-07-11",
  },
  {
    id: "txn_006",
    customer: "Eva Green",
    type: "Chargeback",
    amount: "-$29.00",
    status: "pending",
    method: "Amex •••• 3782",
    date: "2024-07-10",
  },
  {
    id: "txn_007",
    customer: "Frank Lee",
    type: "Payment",
    amount: "$99.00",
    status: "completed",
    method: "Visa •••• 4242",
    date: "2024-07-09",
  },
  {
    id: "txn_008",
    customer: "Grace Kim",
    type: "Payment",
    amount: "$29.00",
    status: "completed",
    method: "Mastercard •••• 8888",
    date: "2024-07-08",
  },
];

const columns = [
  { key: "id", header: "Transaction ID" },
  { key: "customer", header: "Customer" },
  { key: "type", header: "Type" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status", render: (t: any) => <StatusBadge status={t.status} /> },
  { key: "method", header: "Method" },
  { key: "date", header: "Date" },
];

function AdminTransactions() {
  const [isExporting, setIsExporting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Transactions exported successfully");
    } catch (error) {
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Transaction ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load transaction details");
    } finally {
      setViewingId(null);
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm("Are you sure you want to refund this transaction?")) {
      return;
    }
    setRefundingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Transaction ${id} refunded successfully`);
    } catch (error) {
      toast.error("Failed to refund transaction");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>
      <DataTable
        columns={[
          { key: "id", header: "Transaction ID" },
          { key: "customer", header: "Customer" },
          { key: "type", header: "Type" },
          { key: "amount", header: "Amount" },
          { key: "status", header: "Status", render: (t: any) => <StatusBadge status={t.status} /> },
          { key: "method", header: "Method" },
          { key: "date", header: "Date" },
          {
            key: "actions",
            header: "",
            render: (t: any) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(t.id)}
                  disabled={viewingId === t.id}
                >
                  {viewingId === t.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                {t.status === "completed" && t.type === "Payment" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefund(t.id)}
                    disabled={refundingId === t.id}
                  >
                    {refundingId === t.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={transactions}
        searchKey="customer"
      />
    </div>
  );
}
