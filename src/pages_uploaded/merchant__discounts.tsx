import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({ component: MerchantDiscounts });

const discounts = [
  {
    id: "dsc_001",
    code: "SAVE20",
    type: "Percentage",
    amount: "20%",
    usage: "145/500",
    status: "active",
    expires: "2024-12-31",
  },
  {
    id: "dsc_002",
    code: "WELCOME10",
    type: "Percentage",
    amount: "10%",
    usage: "2340/∞",
    status: "active",
    expires: "—",
  },
  {
    id: "dsc_003",
    code: "FLAT50",
    type: "Flat",
    amount: "$50.00",
    usage: "89/100",
    status: "active",
    expires: "2024-09-30",
  },
  {
    id: "dsc_004",
    code: "BF2023",
    type: "Percentage",
    amount: "40%",
    usage: "1200/1200",
    status: "expired",
    expires: "2023-11-30",
  },
  {
    id: "dsc_005",
    code: "PARTNER25",
    type: "Percentage",
    amount: "25%",
    usage: "34/∞",
    status: "active",
    expires: "—",
  },
];

const columns = [
  { key: "code", header: "Coupon Code" },
  { key: "type", header: "Type" },
  { key: "amount", header: "Discount" },
  { key: "usage", header: "Usage" },
  { key: "status", header: "Status", render: (d: any) => <StatusBadge status={d.status} /> },
  { key: "expires", header: "Expires" },
];

function MerchantDiscounts() {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (discount: any) => {
    setDeletingId(discount.id);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Discount ${discount.code} deleted`);
    } catch (error) {
      toast.error("Failed to delete discount");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discounts</h1>
        <Link to="/merchant/discounts/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={discounts}
        searchKey="code"
        onEdit={(d) => {
          toast.info(`Editing ${d.code} (mock)`);
          navigate({ to: "/merchant/discounts/create" });
        }}
        onDelete={(d) => handleDelete(d)}
        getItemLabel={(d) => d.code}
        data-deleting={deletingId ?? undefined}
      />
    </div>
  );
}

export default MerchantDiscounts;
