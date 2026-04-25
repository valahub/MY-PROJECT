
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";

({ component: AdminMerchants });

const columns = [
  { key: "name", header: "Merchant" },
  { key: "email", header: "Email" },
  { key: "status", header: "Status", render: (m: any) => <StatusBadge status={m.status} /> },
  { key: "productsCount", header: "Products" },
  { key: "revenue", header: "Revenue", render: (m: any) => `$${m.revenue.toLocaleString()}` },
  { key: "createdAt", header: "Created", render: (m: any) => new Date(m.createdAt).toLocaleDateString() },
];

function AdminMerchants() {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newMerchant, setNewMerchant] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
  });

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getMerchants({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setMerchants(data);
    } catch (error) {
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, [searchQuery, statusFilter]);

  const handleAddMerchant = async () => {
    if (!newMerchant.name || !newMerchant.email || !newMerchant.password || !newMerchant.businessName) {
      toast.error("Please fill all fields");
      return;
    }

    setIsAdding(true);
    try {
      await marketplaceService.createMerchant(newMerchant);
      toast.success("Merchant added successfully");
      setShowAddDialog(false);
      setNewMerchant({ name: "", email: "", password: "", businessName: "" });
      loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to add merchant");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (merchantId: string, newStatus: string) => {
    try {
      await marketplaceService.updateMerchantStatus(
        merchantId,
        newStatus as any,
        "admin" // In real implementation, use actual admin ID
      );
      toast.success("Merchant status updated");
      loadMerchants();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (merchantId: string) => {
    if (!confirm("Are you sure you want to delete this merchant?")) return;

    try {
      await marketplaceService.deleteMerchant(merchantId, "admin");
      toast.success("Merchant deleted successfully");
      loadMerchants();
    } catch (error) {
      toast.error("Failed to delete merchant");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Merchants</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Merchant
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={merchants}
          searchKey="name"
          onRowClick={(merchant) => {
            // Handle row click to show details
            console.log("View merchant:", merchant);
          }}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Merchant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newMerchant.name}
                onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                placeholder="Merchant name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newMerchant.email}
                onChange={(e) => setNewMerchant({ ...newMerchant, email: e.target.value })}
                placeholder="merchant@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newMerchant.password}
                onChange={(e) => setNewMerchant({ ...newMerchant, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={newMerchant.businessName}
                onChange={(e) => setNewMerchant({ ...newMerchant, businessName: e.target.value })}
                placeholder="Business name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMerchant} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Merchant"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMerchants;
