import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Clock, XCircle, Loader2, Settings, Eye, SkipForward, Ban } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type DunningStage = "retry_day_1" | "retry_day_3" | "retry_day_7" | "grace_period" | "auto_cancel";
type DunningStatus = "pending" | "past_due" | "recovered" | "canceled";

interface DunningQueueItem {
  id: string;
  customerName: string;
  invoiceId: string;
  amount: number;
  attemptCount: number;
  maxAttempts: number;
  stage: DunningStage;
  nextRetryDate: string;
  status: DunningStatus;
}

function AdminDunningPage() {
  const [retryQueue, setRetryQueue] = useState<DunningQueueItem[]>([]);
  const [kpi, setKpi] = useState<{
    inRetryCount: number;
    inRetryAmount: number;
    gracePeriodCount: number;
    recovered30d: number;
    autoCanceledCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [forceRetryingId, setForceRetryingId] = useState<string | null>(null);
  const [skippingStageId, setSkippingStageId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const loadRetryQueue = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getDunningQueue();
      setRetryQueue(data);
    } catch (error) {
      toast.error("Failed to load retry queue");
    } finally {
      setLoading(false);
    }
  };

  const loadKPI = async () => {
    try {
      const kpiData = marketplaceService.getDunningKPIs();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load KPI data");
    }
  };

  useEffect(() => {
    loadRetryQueue();
    loadKPI();
  }, [stageFilter, statusFilter, searchQuery]);

  const handleForceRetry = async (id: string) => {
    setForceRetryingId(id);
    try {
      await marketplaceService.forceRetry(id, "admin");
      toast.success(`Force retry triggered for ${id}`);
      loadRetryQueue();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to force retry");
    } finally {
      setForceRetryingId(null);
    }
  };

  const handleSkipStage = async (id: string) => {
    setSkippingStageId(id);
    try {
      await marketplaceService.updateDunningStage(id, "grace_period", "admin");
      toast.success(`Stage skipped for ${id}`);
      loadRetryQueue();
    } catch (error: any) {
      toast.error(error.message || "Failed to skip stage");
    } finally {
      setSkippingStageId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to auto-cancel this subscription?")) return;
    setCancelingId(id);
    try {
      await marketplaceService.autoCancelDunning(id, "admin");
      toast.success(`Subscription canceled for ${id}`);
      loadRetryQueue();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel");
    } finally {
      setCancelingId(null);
    }
  };

  const handleView = async (id: string) => {
    try {
      const entry = marketplaceService.getDunningQueue().find((item) => item.id === id);
      if (entry) {
        setSelectedEntry(entry);
        setShowViewDialog(true);
      } else {
        toast.error("Entry not found");
      }
    } catch (error) {
      toast.error("Failed to load entry details");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatStage = (stage: DunningStage) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dunning Management</h1>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="In Retry"
            value={kpi.inRetryCount.toString()}
            icon={RefreshCw}
            change={formatAmount(kpi.inRetryAmount) + " at risk"}
            changeType="neutral"
          />
          <StatCard
            title="Grace Period"
            value={kpi.gracePeriodCount.toString()}
            icon={Clock}
            change="3-day grace window"
            changeType="neutral"
          />
          <StatCard
            title="Recovered (30d)"
            value={formatAmount(kpi.recovered30d)}
            icon={AlertTriangle}
            changeType="positive"
          />
          <StatCard
            title="Auto Canceled"
            value={kpi.autoCanceledCount.toString()}
            icon={XCircle}
            change="After max attempts"
            changeType="negative"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by customer or invoice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />
        <Select
          value={stageFilter}
          onValueChange={setStageFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="retry_day_1">Retry Day 1</SelectItem>
            <SelectItem value="retry_day_3">Retry Day 3</SelectItem>
            <SelectItem value="retry_day_7">Retry Day 7</SelectItem>
            <SelectItem value="grace_period">Grace Period</SelectItem>
            <SelectItem value="auto_cancel">Auto Cancel</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="recovered">Recovered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        title="Dunning Queue"
        columns={[
          { key: "customerName", header: "Customer" },
          { key: "invoiceId", header: "Invoice" },
          {
            key: "amount",
            header: "Amount",
            render: (rq: DunningQueueItem) => formatAmount(rq.amount),
          },
          { key: "attemptCount", header: "Attempts" },
          { key: "stage", header: "Stage", render: (rq: DunningQueueItem) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{formatStage(rq.stage)}</code> },
          {
            key: "nextRetryDate",
            header: "Next Retry",
            render: (rq: DunningQueueItem) => rq.nextRetryDate ? formatDate(rq.nextRetryDate) : "N/A",
          },
          { key: "status", header: "Status", render: (rq: DunningQueueItem) => <StatusBadge status={rq.status} /> },
          {
            key: "actions",
            header: "",
            render: (rq: DunningQueueItem) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleView(rq.id)}>
                  <Eye className="h-3 w-3" />
                </Button>
                {rq.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleForceRetry(rq.id)} disabled={forceRetryingId === rq.id}>
                    {forceRetryingId === rq.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                )}
                {rq.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleSkipStage(rq.id)} disabled={skippingStageId === rq.id}>
                    {skippingStageId === rq.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SkipForward className="h-3 w-3" />}
                  </Button>
                )}
                {(rq.status === "pending" || rq.status === "past_due") && (
                  <Button size="sm" variant="outline" onClick={() => handleCancel(rq.id)} disabled={cancelingId === rq.id}>
                    {cancelingId === rq.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={retryQueue}
        searchKey="invoiceId"
        pageSize={50}
      />

      {/* View Entry Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dunning Queue Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Invoice ID</span>
                  <p className="font-mono text-sm">{selectedEntry.invoiceId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Status</span>
                  <p><StatusBadge status={selectedEntry.status} /></p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Customer</span>
                  <p className="font-medium">{selectedEntry.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <p className="font-medium">{formatAmount(selectedEntry.amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Stage</span>
                  <p className="font-medium">{formatStage(selectedEntry.stage)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Attempts</span>
                  <p className="font-medium">{selectedEntry.attemptCount} / {selectedEntry.maxAttempts}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Next Retry</span>
                  <p className="font-medium">{selectedEntry.nextRetryDate ? formatDate(selectedEntry.nextRetryDate) : "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDunningPage;
