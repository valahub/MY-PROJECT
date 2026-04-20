
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Settings, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminSubscriptions });

const subscriptions = [
  {
    id: "sub_001",
    customer: "John Doe",
    product: "Pro Plan",
    status: "active",
    amount: "$29/mo",
    nextBill: "2024-08-15",
    started: "2024-01-15",
  },
  {
    id: "sub_002",
    customer: "Jane Smith",
    product: "Enterprise License",
    status: "active",
    amount: "$499/yr",
    nextBill: "2025-02-20",
    started: "2024-02-20",
  },
  {
    id: "sub_003",
    customer: "Bob Wilson",
    product: "Pro Plan",
    status: "past_due",
    amount: "$29/mo",
    nextBill: "2024-07-10",
    started: "2023-07-10",
  },
  {
    id: "sub_004",
    customer: "Alice Brown",
    product: "API Access",
    status: "trialing",
    amount: "$49/mo",
    nextBill: "2024-08-01",
    started: "2024-07-18",
  },
  {
    id: "sub_005",
    customer: "Charlie Davis",
    product: "Team Plan",
    status: "canceled",
    amount: "$79/mo",
    nextBill: "—",
    started: "2024-03-05",
  },
  {
    id: "sub_006",
    customer: "Eva Green",
    product: "Pro Plan",
    status: "paused",
    amount: "$29/mo",
    nextBill: "—",
    started: "2024-04-12",
  },
];

const columns = [
  { key: "customer", header: "Customer" },
  { key: "product", header: "Product" },
  { key: "status", header: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
  { key: "amount", header: "Amount" },
  { key: "nextBill", header: "Next Billing" },
  { key: "started", header: "Started" },
];

function AdminSubscriptions() {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Subscription ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load subscription details");
    } finally {
      setViewingId(null);
    }
  };

  const handleManage = async (id: string) => {
    setManagingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Managing subscription ${id}`);
    } catch (error) {
      toast.error("Failed to open subscription management");
    } finally {
      setManagingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }
    setCancelingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Subscription ${id} canceled successfully`);
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <DataTable
        columns={[
          { key: "customer", header: "Customer" },
          { key: "product", header: "Product" },
          { key: "status", header: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
          { key: "amount", header: "Amount" },
          { key: "nextBill", header: "Next Billing" },
          { key: "started", header: "Started" },
          {
            key: "actions",
            header: "",
            render: (s: any) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(s.id)}
                  disabled={viewingId === s.id}
                >
                  {viewingId === s.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManage(s.id)}
                  disabled={managingId === s.id}
                >
                  {managingId === s.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Settings className="h-3 w-3" />
                  )}
                </Button>
                {s.status === "active" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancel(s.id)}
                    disabled={cancelingId === s.id}
                  >
                    {cancelingId === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={subscriptions}
        searchKey="customer"
      />
    </div>
  );
}

export default AdminSubscriptions;
