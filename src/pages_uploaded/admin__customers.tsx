
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Settings, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminCustomers });

const customers = [
  {
    id: "cus_001",
    name: "John Doe",
    email: "john@example.com",
    subscriptions: 2,
    totalSpent: "$1,240",
    country: "US",
    joined: "2023-06-15",
  },
  {
    id: "cus_002",
    name: "Jane Smith",
    email: "jane@company.co",
    subscriptions: 1,
    totalSpent: "$499",
    country: "UK",
    joined: "2024-02-20",
  },
  {
    id: "cus_003",
    name: "Bob Wilson",
    email: "bob@startup.io",
    subscriptions: 3,
    totalSpent: "$2,870",
    country: "CA",
    joined: "2023-01-10",
  },
  {
    id: "cus_004",
    name: "Alice Brown",
    email: "alice@dev.com",
    subscriptions: 1,
    totalSpent: "$147",
    country: "DE",
    joined: "2024-05-01",
  },
  {
    id: "cus_005",
    name: "Charlie Davis",
    email: "charlie@tech.io",
    subscriptions: 0,
    totalSpent: "$79",
    country: "AU",
    joined: "2024-03-15",
  },
  {
    id: "cus_006",
    name: "Eva Green",
    email: "eva@design.co",
    subscriptions: 1,
    totalSpent: "$348",
    country: "FR",
    joined: "2024-01-22",
  },
  {
    id: "cus_007",
    name: "Frank Lee",
    email: "frank@agency.com",
    subscriptions: 2,
    totalSpent: "$1,596",
    country: "US",
    joined: "2023-08-05",
  },
  {
    id: "cus_008",
    name: "Grace Kim",
    email: "grace@studio.io",
    subscriptions: 1,
    totalSpent: "$290",
    country: "KR",
    joined: "2024-04-18",
  },
];

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "subscriptions", header: "Subscriptions" },
  { key: "totalSpent", header: "Total Spent" },
  { key: "country", header: "Country" },
  { key: "joined", header: "Joined" },
];

function AdminCustomers() {
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);

  const handleAddCustomer = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error("Failed to add customer");
    } finally {
      setIsAdding(false);
    }
  };

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Customer ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load customer details");
    } finally {
      setViewingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Customer ${id} updated successfully`);
    } catch (error) {
      toast.error("Failed to update customer");
    } finally {
      setEditingId(null);
    }
  };

  const handleManage = async (id: string) => {
    setManagingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Managing customer ${id}`);
    } catch (error) {
      toast.error("Failed to open customer management");
    } finally {
      setManagingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={handleAddCustomer} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Customer"}
        </Button>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "subscriptions", header: "Subscriptions" },
          { key: "totalSpent", header: "Total Spent" },
          { key: "country", header: "Country" },
          { key: "joined", header: "Joined" },
          {
            key: "actions",
            header: "",
            render: (c: any) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(c.id)}
                  disabled={viewingId === c.id}
                >
                  {viewingId === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(c.id)}
                  disabled={editingId === c.id}
                >
                  {editingId === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Edit className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManage(c.id)}
                  disabled={managingId === c.id}
                >
                  {managingId === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Settings className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ),
          },
        ]}
        data={customers}
        searchKey="name"
      />
    </div>
  );
}
