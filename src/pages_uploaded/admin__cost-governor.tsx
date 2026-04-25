
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, TrendingDown, Cpu, Zap, AlertTriangle, Loader2, Settings, Search, Play, StopCircle, CheckCircle, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { costGovernorService, type WasteItem, type WasteActionRequest, type CostGovernorKPI } from "@/lib/api/admin-services";

({
  component: AdminCostGovernorPage,
  head: () => ({ meta: [{ title: "Auto Cost Governor — Admin — ERP Vala" }] }),
});

function AdminCostGovernorPage() {
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [selectedWasteItem, setSelectedWasteItem] = useState<WasteItem | null>(null);
  const [selectedActionRequest, setSelectedActionRequest] = useState<WasteActionRequest | null>(null);
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [actionRequests, setActionRequests] = useState<WasteActionRequest[]>([]);
  const [kpi, setKpi] = useState<CostGovernorKPI | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setWasteItems(costGovernorService.listWasteItems());
      setActionRequests(costGovernorService.listActionRequests());
      setKpi(costGovernorService.getKPI());
    } catch (error) {
      toast.error("Failed to load cost governor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await costGovernorService.scanForWaste();
      toast.success("Waste scan completed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to run waste scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleStartAutoScan = () => {
    costGovernorService.startAutoScan();
    setIsAutoScanning(true);
    toast.success("Auto scan started");
  };

  const handleStopAutoScan = () => {
    costGovernorService.stopAutoScan();
    setIsAutoScanning(false);
    toast.success("Auto scan stopped");
  };

  const handleCreateAction = async (wasteItemId: string, action: string) => {
    try {
      await costGovernorService.createActionRequest(wasteItemId, action as any, "admin");
      toast.success("Action request created");
      loadData();
    } catch (error) {
      toast.error("Failed to create action request");
    }
  };

  const handleApproveAction = async (requestId: string) => {
    try {
      await costGovernorService.approveActionRequest(requestId, "admin");
      toast.success("Action approved");
      loadData();
    } catch (error) {
      toast.error("Failed to approve action");
    }
  };

  const handleRejectAction = async (requestId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await costGovernorService.rejectActionRequest(requestId, "admin", reason);
      toast.success("Action rejected");
      loadData();
    } catch (error) {
      toast.error("Failed to reject action");
    }
  };

  const handleExecuteAction = async (requestId: string) => {
    try {
      await costGovernorService.executeAction(requestId);
      toast.success("Action executed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to execute action");
    }
  };

  const handleRollbackAction = async (requestId: string) => {
    try {
      await costGovernorService.rollbackAction(requestId);
      toast.success("Action rolled back successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to rollback action");
    }
  };

  const handleAddIgnoreRule = async (resourceId: string) => {
    const reason = prompt("Enter ignore reason:");
    if (!reason) return;

    try {
      costGovernorService.addIgnoreRule(resourceId, reason, 2592000, "admin");
      toast.success("Ignore rule added");
      loadData();
    } catch (error) {
      toast.error("Failed to add ignore rule");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auto Cost Governor</h1>
        <div className="flex gap-2">
          {!isAutoScanning ? (
            <Button variant="outline" onClick={handleStartAutoScan}>
              <Play className="mr-2 h-4 w-4" />
              Start Auto Scan
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStopAutoScan}>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Auto Scan
            </Button>
          )}
          <Button onClick={handleRunScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isScanning ? "Scanning..." : "Run Waste Scan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Waste Items" value={kpi?.totalWasteItems?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Total Monthly Waste" value={formatCurrency(kpi?.totalMonthlyWaste || 0)} icon={DollarSign} />
        <StatCard title="Compute Waste" value={formatCurrency(kpi?.computeWaste || 0)} icon={Cpu} />
        <StatCard title="Storage Waste" value={formatCurrency(kpi?.storageWaste || 0)} icon={Zap} />
        <StatCard title="Database Waste" value={formatCurrency(kpi?.databaseWaste || 0)} icon={Cpu} />
        <StatCard title="Orphan Waste" value={formatCurrency(kpi?.orphanWaste || 0)} icon={AlertTriangle} />
        <StatCard title="Critical Severity" value={kpi?.criticalSeverity?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Auto-Fix Eligible" value={kpi?.autoFixEligible?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Pending Actions" value={kpi?.pendingActions?.toString() || "0"} icon={Cpu} />
        <StatCard title="Completed Actions" value={kpi?.completedActions?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Total Savings" value={formatCurrency(kpi?.totalSavings || 0)} icon={TrendingDown} />
        <StatCard title="Projected Savings" value={formatCurrency(kpi?.projectedSavings || 0)} icon={TrendingDown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Governance Guardrails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Budget Alerts</p>
              <p className="text-xs text-muted-foreground">
                Notify at 80% and 95% of monthly budget. Auto-pause non-critical background jobs at
                100%.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto-Fix Scope</p>
              <p className="text-xs text-muted-foreground">
                Low-risk optimisations (idle resources, orphaned assets) execute automatically.
                Structural changes (resize, delete) require human approval.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Rollback Safety</p>
              <p className="text-xs text-muted-foreground">
                All resource changes are logged and reversible. A 24-hour soft-delete grace period
                applies before permanent removal.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Blast Radius Limit</p>
              <p className="text-xs text-muted-foreground">
                No single automated action may affect more than 20% of a service's compute capacity
                without explicit approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Waste Items"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Resource ID", accessorKey: "resourceId" },
          { header: "Resource Type", accessorKey: "resourceType" },
          {
            header: "Waste Type",
            accessorKey: "wasteType",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              <span className="font-medium">{row.original.wasteType.toUpperCase()}</span>
            ),
          },
          {
            header: "Severity",
            accessorKey: "severity",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              <span className={
                row.original.severity === "critical" ? "text-red-600" :
                row.original.severity === "medium" ? "text-yellow-600" :
                "text-green-600"
              }>
                {row.original.severity.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Monthly Waste",
            accessorKey: "monthlyWasteCost",
            cell: ({ row }: { row: { original: WasteItem } }) => formatCurrency(row.original.monthlyWasteCost),
          },
          {
            header: "Impact %",
            accessorKey: "impactPercentage",
            cell: ({ row }: { row: { original: WasteItem } }) => `${row.original.impactPercentage.toFixed(1)}%`,
          },
          {
            header: "Suggested Action",
            accessorKey: "suggestedAction",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              <span className="font-medium">{row.original.suggestedAction.toUpperCase()}</span>
            ),
          },
          {
            header: "Auto-Fix",
            accessorKey: "autoFixEligible",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              row.original.autoFixEligible ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              <span className={
                row.original.status === "active" ? "text-green-600" :
                row.original.status === "fixed" ? "text-blue-600" :
                "text-muted-foreground"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: WasteItem } }) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleCreateAction(row.original.id, row.original.suggestedAction)}>
                  <Zap className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddIgnoreRule(row.original.resourceId)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ),
          },
        ]}
        data={wasteItems}
      />

      <DataTable
        title="Action Requests"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Waste Item ID", accessorKey: "wasteItemId" },
          {
            header: "Action",
            accessorKey: "action",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => (
              <span className="font-medium">{row.original.action.toUpperCase()}</span>
            ),
          },
          {
            header: "Approval Status",
            accessorKey: "approvalStatus",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => (
              <span className={
                row.original.approvalStatus === "approved" || row.original.approvalStatus === "auto_approved" ? "text-green-600" :
                row.original.approvalStatus === "rejected" ? "text-red-600" :
                "text-yellow-600"
              }>
                {row.original.approvalStatus.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          {
            header: "Action Status",
            accessorKey: "actionStatus",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => (
              <span className={
                row.original.actionStatus === "completed" ? "text-green-600" :
                row.original.actionStatus === "failed" ? "text-red-600" :
                row.original.actionStatus === "rolled_back" ? "text-orange-600" :
                "text-blue-600"
              }>
                {row.original.actionStatus.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          {
            header: "Savings Before",
            accessorKey: "savingsBefore",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => formatCurrency(row.original.savingsBefore),
          },
          {
            header: "Savings After",
            accessorKey: "savingsAfter",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => formatCurrency(row.original.savingsAfter),
          },
          {
            header: "Actual Savings",
            accessorKey: "actualSavings",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => formatCurrency(row.original.actualSavings),
          },
          {
            header: "Created At",
            accessorKey: "createdAt",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => formatDate(row.original.createdAt),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: WasteActionRequest } }) => (
              <div className="flex gap-2">
                {row.original.approvalStatus === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleApproveAction(row.original.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectAction(row.original.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {row.original.approvalStatus === "approved" && row.original.actionStatus === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleExecuteAction(row.original.id)}>
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                {row.original.actionStatus === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => handleRollbackAction(row.original.id)}>
                    <Zap className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={actionRequests}
      />

      <Dialog open={!!selectedWasteItem} onOpenChange={() => setSelectedWasteItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Waste Item Details</DialogTitle>
          </DialogHeader>
          {selectedWasteItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm">{selectedWasteItem.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource ID</label>
                  <p className="text-sm">{selectedWasteItem.resourceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource Type</label>
                  <p className="text-sm">{selectedWasteItem.resourceType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Waste Type</label>
                  <p className="text-sm">{selectedWasteItem.wasteType.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <p className="text-sm">{selectedWasteItem.severity.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Waste Cost</label>
                  <p className="text-sm">{formatCurrency(selectedWasteItem.monthlyWasteCost)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impact Percentage</label>
                  <p className="text-sm">{selectedWasteItem.impactPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Suggested Action</label>
                  <p className="text-sm">{selectedWasteItem.suggestedAction.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm">{selectedWasteItem.reason}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPU Utilization</label>
                  <p className="text-sm">{selectedWasteItem.cpuUtilization}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Memory Utilization</label>
                  <p className="text-sm">{selectedWasteItem.memoryUtilization}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Access Frequency</label>
                  <p className="text-sm">{selectedWasteItem.accessFrequency} req/day</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Accessed</label>
                  <p className="text-sm">{formatDate(selectedWasteItem.lastAccessedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detected At</label>
                  <p className="text-sm">{formatDate(selectedWasteItem.detectedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedActionRequest} onOpenChange={() => setSelectedActionRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Request Details</DialogTitle>
          </DialogHeader>
          {selectedActionRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm">{selectedActionRequest.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Waste Item ID</label>
                  <p className="text-sm">{selectedActionRequest.wasteItemId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <p className="text-sm">{selectedActionRequest.action.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Requested By</label>
                  <p className="text-sm">{selectedActionRequest.requestedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approval Status</label>
                  <p className="text-sm">{selectedActionRequest.approvalStatus.replace("_", " ").toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                  <p className="text-sm">{selectedActionRequest.approvedBy || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action Status</label>
                  <p className="text-sm">{selectedActionRequest.actionStatus.replace("_", " ").toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Savings Before</label>
                  <p className="text-sm">{formatCurrency(selectedActionRequest.savingsBefore)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Savings After</label>
                  <p className="text-sm">{formatCurrency(selectedActionRequest.savingsAfter)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actual Savings</label>
                  <p className="text-sm">{formatCurrency(selectedActionRequest.actualSavings)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{formatDate(selectedActionRequest.createdAt)}</p>
                </div>
                {selectedActionRequest.executedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Executed At</label>
                    <p className="text-sm">{formatDate(selectedActionRequest.executedAt)}</p>
                  </div>
                )}
                {selectedActionRequest.rollbackAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rolled Back At</label>
                    <p className="text-sm">{formatDate(selectedActionRequest.rollbackAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCostGovernorPage;
