
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Settings, Loader2, Plus, Search, X, Shield, LogOut, Key, Users, DollarSign, Globe, Ban, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { customerProfileService, type CustomerProfile, type CustomerProfileKPI, type CustomerProfileFilters } from "@/lib/api/admin-services";

({ component: AdminCustomers, head: () => ({ meta: [{ title: "Customers — Admin — ERP Vala" }] }) });

function AdminCustomers() {
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [kpi, setKpi] = useState<CustomerProfileKPI | null>(null);
  const [filters, setFilters] = useState<CustomerProfileFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = customerProfileService.list(filters, { page: 1, limit: 50 });
      if (response.success && response.data) {
        setCustomers(response.data);
      }
      const kpiData = customerProfileService.getKPI();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleAddCustomer = async () => {
    const name = prompt("Enter customer name:");
    const email = prompt("Enter customer email:");
    const country = prompt("Enter country code (e.g., US, GB, IN):");
    const currency = prompt("Enter currency code (e.g., USD, EUR, INR):") || "USD";

    if (name && email && country) {
      setIsAdding(true);
      try {
        await customerProfileService.create({ name, email, country, currency }, "admin");
        toast.success("Customer added successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to add customer");
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleView = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
  };

  const handleEdit = async (id: string) => {
    const name = prompt("Enter new name:");
    const country = prompt("Enter new country code:");
    const currency = prompt("Enter new currency code:");
    const status = prompt("Enter status (active/suspended/blocked):");

    if (name || country || currency || status) {
      try {
        await customerProfileService.update(id, {
          name: name || undefined,
          country: country || undefined,
          currency: currency || undefined,
          status: (status as "active" | "suspended" | "blocked") || undefined,
        }, "admin");
        toast.success("Customer updated successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to update customer");
      }
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await customerProfileService.suspend(id, "admin");
      toast.success("Customer suspended successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to suspend customer");
    }
  };

  const handleBlock = async (id: string) => {
    try {
      await customerProfileService.block(id, "admin");
      toast.success("Customer blocked successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to block customer");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await customerProfileService.activate(id, "admin");
      toast.success("Customer activated successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to activate customer");
    }
  };

  const handleRevokeSessions = async (id: string) => {
    try {
      await customerProfileService.revokeAllSessions(id, "admin");
      toast.success("All sessions revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke sessions");
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await customerProfileService.resetPassword(id, "admin");
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={kpi?.totalCustomers?.toString() || "0"} icon={Users} />
        <StatCard title="Active Customers" value={kpi?.activeCustomers?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Suspended" value={kpi?.suspendedCustomers?.toString() || "0"} icon={Ban} />
        <StatCard title="Total Revenue" value={formatCurrency(kpi?.totalRevenue || 0, "USD")} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={filters.status === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === "active" ? undefined : "active" })}
            >
              Active Only
            </Button>
            <Button
              variant={filters.status === "suspended" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === "suspended" ? undefined : "suspended" })}
            >
              Suspended
            </Button>
            <Button
              variant={filters.status === "blocked" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, status: filters.status === "blocked" ? undefined : "blocked" })}
            >
              Blocked
            </Button>
            <Button
              variant={filters.hasSubscription === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, hasSubscription: filters.hasSubscription === true ? undefined : true })}
            >
              Has Subscription
            </Button>
            {(filters.search || filters.status !== undefined || filters.hasSubscription !== undefined) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Customer List"
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Email", accessorKey: "email" },
          {
            header: "Subscriptions",
            accessorKey: "subscriptionCount",
            cell: ({ row }: { row: { original: CustomerProfile } }) => (
              <span className="font-medium">{row.original.subscriptionCount}</span>
            ),
          },
          {
            header: "Total Spent",
            accessorKey: "totalSpent",
            cell: ({ row }: { row: { original: CustomerProfile } }) => (
              <span className="font-mono">{formatCurrency(row.original.totalSpent, row.original.totalSpentCurrency)}</span>
            ),
          },
          { header: "Country", accessorKey: "country" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: CustomerProfile } }) => (
              <span className={
                row.original.status === "active" ? "text-green-600" :
                row.original.status === "suspended" ? "text-yellow-600" :
                "text-red-600"
              }>
                {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
              </span>
            ),
          },
          {
            header: "Joined",
            accessorKey: "joinedDate",
            cell: ({ row }: { row: { original: CustomerProfile } }) => formatDate(row.original.joinedDate),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: CustomerProfile } }) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleView(row.original)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(row.original.id)}>
                  <Edit className="h-3 w-3" />
                </Button>
                {row.original.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleSuspend(row.original.id)}>
                    <Ban className="h-3 w-3" />
                  </Button>
                )}
                {row.original.status !== "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleActivate(row.original.id)}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={customers}
      />

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <p className="text-sm">{selectedCustomer.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <p className="text-sm">{selectedCustomer.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{selectedCustomer.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subscriptions</label>
                  <p className="text-sm">{selectedCustomer.subscriptionCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Spent</label>
                  <p className="text-sm">{formatCurrency(selectedCustomer.totalSpent, selectedCustomer.totalSpentCurrency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                  <p className="text-sm">{formatDate(selectedCustomer.joinedDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                  <p className="text-sm">{formatDate(selectedCustomer.lastActive)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Devices</label>
                  <p className="text-sm">{selectedCustomer.deviceCount}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Security Actions</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRevokeSessions(selectedCustomer.id)}>
                    <LogOut className="mr-2 h-3 w-3" />
                    Revoke All Sessions
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleResetPassword(selectedCustomer.id)}>
                    <Key className="mr-2 h-3 w-3" />
                    Reset Password
                  </Button>
                  {selectedCustomer.status === "active" && (
                    <Button size="sm" variant="destructive" onClick={() => handleBlock(selectedCustomer.id)}>
                      <Shield className="mr-2 h-3 w-3" />
                      Block Customer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCustomers;
