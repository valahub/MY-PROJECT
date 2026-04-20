
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminMerchants });

const merchants = [
  {
    id: "mer_001",
    name: "Acme Software",
    email: "billing@acme.com",
    status: "active",
    products: 12,
    revenue: "$45,200",
    created: "2024-01-15",
  },
  {
    id: "mer_002",
    name: "CloudStack Inc",
    email: "admin@cloudstack.io",
    status: "active",
    products: 8,
    revenue: "$32,100",
    created: "2024-02-20",
  },
  {
    id: "mer_003",
    name: "DevTools Pro",
    email: "hello@devtools.pro",
    status: "active",
    products: 24,
    revenue: "$78,500",
    created: "2023-11-05",
  },
  {
    id: "mer_004",
    name: "SaaS Builder",
    email: "team@saasbuilder.com",
    status: "pending",
    products: 3,
    revenue: "$8,400",
    created: "2024-06-10",
  },
  {
    id: "mer_005",
    name: "Widget Corp",
    email: "info@widget.co",
    status: "inactive",
    products: 0,
    revenue: "$0",
    created: "2024-03-22",
  },
  {
    id: "mer_006",
    name: "DataFlow",
    email: "admin@dataflow.io",
    status: "active",
    products: 15,
    revenue: "$52,300",
    created: "2023-09-14",
  },
  {
    id: "mer_007",
    name: "API Hub",
    email: "support@apihub.dev",
    status: "active",
    products: 6,
    revenue: "$19,800",
    created: "2024-04-01",
  },
  {
    id: "mer_008",
    name: "FormStack",
    email: "billing@formstack.io",
    status: "active",
    products: 9,
    revenue: "$28,700",
    created: "2024-01-28",
  },
];

const columns = [
  { key: "name", header: "Merchant" },
  { key: "email", header: "Email" },
  { key: "status", header: "Status", render: (m: any) => <StatusBadge status={m.status} /> },
  { key: "products", header: "Products" },
  { key: "revenue", header: "Revenue" },
  { key: "created", header: "Created" },
];

function AdminMerchants() {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMerchant = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Merchant added successfully");
    } catch (error) {
      toast.error("Failed to add merchant");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Merchants</h1>
        <Button onClick={handleAddMerchant} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Merchant"}
        </Button>
      </div>
      <DataTable columns={columns} data={merchants} searchKey="name" />
    </div>
  );
}

export default AdminMerchants;
