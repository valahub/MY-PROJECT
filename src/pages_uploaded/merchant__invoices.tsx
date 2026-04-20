
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

({ component: MerchantInvoices });

const invoices = [
  {
    id: "INV-2024-001",
    customer: "John Doe",
    amount: "$29.00",
    status: "paid",
    issued: "2024-07-01",
    due: "2024-07-15",
  },
  {
    id: "INV-2024-002",
    customer: "Jane Smith",
    amount: "$499.00",
    status: "paid",
    issued: "2024-07-01",
    due: "2024-07-15",
  },
  {
    id: "INV-2024-003",
    customer: "Bob Wilson",
    amount: "$29.00",
    status: "past_due",
    issued: "2024-06-01",
    due: "2024-06-15",
  },
  {
    id: "INV-2024-004",
    customer: "Alice Brown",
    amount: "$49.00",
    status: "pending",
    issued: "2024-07-18",
    due: "2024-08-01",
  },
  {
    id: "INV-2024-005",
    customer: "Frank Lee",
    amount: "$999.00",
    status: "paid",
    issued: "2024-04-01",
    due: "2024-04-15",
  },
  {
    id: "INV-2024-006",
    customer: "Eva Green",
    amount: "$29.00",
    status: "paid",
    issued: "2024-07-01",
    due: "2024-07-15",
  },
];

function MerchantInvoices() {
  const [viewingInvoice, setViewingInvoice] = useState<string | null>(null);

  const handleViewInvoice = async (invoiceId: string) => {
    setViewingInvoice(invoiceId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Invoice ${invoiceId} viewed`);
    } catch (error) {
      toast.error("Failed to view invoice");
    } finally {
      setViewingInvoice(null);
    }
  };

  const columns = [
    { key: "id", header: "Invoice #" },
    { key: "customer", header: "Customer" },
    { key: "amount", header: "Amount" },
    { key: "status", header: "Status", render: (i: any) => <StatusBadge status={i.status} /> },
    { key: "issued", header: "Issued" },
    { key: "due", header: "Due Date" },
    {
      key: "actions",
      header: "",
      render: (i: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewInvoice(i.id)}
          disabled={viewingInvoice === i.id}
        >
          {viewingInvoice === i.id ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          {viewingInvoice === i.id ? "Loading..." : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <DataTable columns={columns} data={invoices} searchKey="customer" />
    </div>
  );
}

export default MerchantInvoices;
