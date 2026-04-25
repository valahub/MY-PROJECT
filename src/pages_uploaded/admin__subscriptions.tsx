import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Settings, X, Loader2, RefreshCw, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "canceled";

interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  status: SubscriptionStatus;
  amount: number;
  nextBillingDate: string;
  startedAt: string;
}

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getSubscriptions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setSubscriptions(data);
    } catch (error) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, searchQuery]);

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      const subscription = marketplaceService.getSubscriptionDetails(id);
      if (subscription) {
        setSelectedSubscription(subscription.subscription as Subscription);
        toast.success(`Subscription ${id} details loaded`);
      } else {
        toast.error("Subscription not found");
      }
    } catch (error) {
      toast.error("Failed to load subscription details");
    } finally {
      setViewingId(null);
    }
  };

  const handleManage = async (id: string) => {
    setManagingId(id);
    try {
      const subscription = marketplaceService.getSubscriptionDetails(id);
      if (subscription) {
        setSelectedSubscription(subscription.subscription as Subscription);
        setShowManageDialog(true);
      }
    } catch (error) {
      toast.error("Failed to load subscription for management");
    } finally {
      setManagingId(null);
    }
  };

  const handleCancel = async (id: string, immediate: boolean = false) => {
    if (!confirm(immediate ? "Are you sure you want to cancel this subscription immediately?" : "Are you sure you want to cancel this subscription at the end of the billing period?")) {
      return;
    }
    setCancelingId(id);
    try {
      await marketplaceService.cancelSubscription(id, !immediate, "admin");
      toast.success(`Subscription ${id} canceled successfully`);
      loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelingId(null);
    }
  };

  const handlePause = async (id: string) => {
    setPausingId(id);
    try {
      await marketplaceService.pauseSubscription(id, "admin");
      toast.success(`Subscription ${id} paused successfully`);
      loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to pause subscription");
    } finally {
      setPausingId(null);
    }
  };

  const handleResume = async (id: string) => {
    setResumingId(id);
    try {
      await marketplaceService.resumeSubscription(id, "admin");
      toast.success(`Subscription ${id} resumed successfully`);
      loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to resume subscription");
    } finally {
      setResumingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      await marketplaceService.updateSubscriptionStatus(id, newStatus, "admin");
      toast.success(`Subscription status changed to ${newStatus}`);
      loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to change subscription status");
    }
  };

  const handleRefresh = async () => {
    loadSubscriptions();
    toast.success("Subscriptions refreshed");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by customer or product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "customerName", header: "Customer" },
          { key: "productName", header: "Product" },
          { key: "status", header: "Status", render: (s: Subscription) => <StatusBadge status={s.status} /> },
          { key: "amount", header: "Amount", render: (s: Subscription) => formatAmount(s.amount) },
          { key: "nextBillingDate", header: "Next Billing", render: (s: Subscription) => formatDate(s.nextBillingDate) },
          { key: "startedAt", header: "Started", render: (s: Subscription) => formatDate(s.startedAt) },
          {
            key: "actions",
            header: "",
            render: (s: Subscription) => (
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
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(s.id)}
                      disabled={pausingId === s.id}
                    >
                      {pausingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Pause className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(s.id, false)}
                      disabled={cancelingId === s.id}
                    >
                      {cancelingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </>
                )}
                {s.status === "paused" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResume(s.id)}
                    disabled={resumingId === s.id}
                  >
                    {resumingId === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={subscriptions}
        searchKey="customerName"
        pageSize={50}
      />

      {/* Manage Subscription Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedSubscription.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedSubscription.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{selectedSubscription.status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">{formatAmount(selectedSubscription.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Billing</Label>
                  <p className="font-medium">{formatDate(selectedSubscription.nextBillingDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Started</Label>
                  <p className="font-medium">{formatDate(selectedSubscription.startedAt)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedSubscription.status === "active" && (
                  <Button onClick={() => handlePause(selectedSubscription.id)} variant="outline" className="flex-1">
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                )}
                {selectedSubscription.status === "paused" && (
                  <Button onClick={() => handleResume(selectedSubscription.id)} variant="outline" className="flex-1">
                    <Play className="mr-2 h-4 w-4" /> Resume
                  </Button>
                )}
                {selectedSubscription.status === "active" && (
                  <Button onClick={() => handleCancel(selectedSubscription.id, true)} variant="destructive" className="flex-1">
                    <X className="mr-2 h-4 w-4" /> Cancel Immediately
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubscriptions;
