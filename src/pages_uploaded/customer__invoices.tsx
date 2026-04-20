
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: CustomerInvoices });

const invoices = [
  {
    id: "INV-2024-001",
    product: "Pro Plan",
    amount: "$29.00",
    status: "paid",
    issued: "Jul 1, 2024",
    paid: "Jul 1, 2024",
  },
  {
    id: "INV-2024-002",
    product: "API Add-on",
    amount: "$49.00",
    status: "pending",
    issued: "Jul 18, 2024",
    paid: "—",
  },
  {
    id: "INV-2024-003",
    product: "Pro Plan",
    amount: "$29.00",
    status: "paid",
    issued: "Jun 1, 2024",
    paid: "Jun 1, 2024",
  },
  {
    id: "INV-2024-004",
    product: "Pro Plan",
    amount: "$29.00",
    status: "paid",
    issued: "May 1, 2024",
    paid: "May 1, 2024",
  },
  {
    id: "INV-2024-005",
    product: "Enterprise License",
    amount: "$499.00",
    status: "paid",
    issued: "Feb 20, 2024",
    paid: "Feb 20, 2024",
  },
];

function CustomerInvoices() {
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const handleDownloadPDF = async (invoiceId: string) => {
    setDownloadingInvoice(invoiceId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Invoice ${invoiceId} downloaded`);
    } catch (error) {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const columns = [
    { key: "id", header: "Invoice #" },
    { key: "product", header: "Product" },
    { key: "amount", header: "Amount" },
    { key: "status", header: "Status", render: (i: any) => <StatusBadge status={i.status} /> },
    { key: "issued", header: "Issued" },
    {
      key: "actions",
      header: "",
      render: (i: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDownloadPDF(i.id)}
          disabled={downloadingInvoice === i.id}
        >
          {downloadingInvoice === i.id ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Download className="mr-1 h-3 w-3" />
          )}
          {downloadingInvoice === i.id ? "Downloading..." : "PDF"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Invoices</h1>
      <DataTable columns={columns} data={invoices} searchKey="id" />
    </div>
  );
}

export default CustomerInvoices;
