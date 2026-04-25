
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Loader2, Check, X, AlertTriangle, Shield, FileText, Download, Play, ChevronRight, ChevronLeft, SkipForward, Ban } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { reviewQueueService, marketplaceService, type ReviewQueueItem, type QualityScan, type ReviewLog } from "@/lib/api/admin-services";

({ component: AdminReviewQueue, head: () => ({ meta: [{ title: "Review Queue — Admin — ERP Vala" }] }) });

function AdminReviewQueue() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [stats, setStats] = useState({ pending: 0, softRejected: 0, rejected: 0, approved: 0 });
  const [filterStatus, setFilterStatus] = useState<"pending" | "soft_rejected" | "rejected" | "approved" | "all">("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const queueData = reviewQueueService.getQueue(filterStatus === "all" ? {} : { status: filterStatus });
      setQueue(queueData);
      const statsData = reviewQueueService.getQueueStats();
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const handleRunQualityScan = async (itemId: string) => {
    try {
      await reviewQueueService.runQualityScan(itemId, "admin");
      toast.success("Quality scan completed");
      loadData();
    } catch (error) {
      toast.error("Failed to run quality scan");
    }
  };

  const handleApprove = async (itemId: string) => {
    if (!notes && filterStatus !== "all") {
      toast.error("Notes are required for approval");
      return;
    }

    setIsProcessing(true);
    try {
      await reviewQueueService.approveItem(itemId, "admin", "Admin User", notes);
      toast.success("Item approved successfully");
      setNotes("");
      const nextItem = reviewQueueService.getNextItem(itemId);
      setSelectedItem(nextItem);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve item");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSoftReject = async (itemId: string) => {
    if (!notes) {
      toast.error("Notes are required for soft reject");
      return;
    }

    setIsProcessing(true);
    try {
      await reviewQueueService.softRejectItem(itemId, "admin", "Admin User", notes);
      toast.success("Item soft rejected");
      setNotes("");
      const nextItem = reviewQueueService.getNextItem(itemId);
      setSelectedItem(nextItem);
      loadData();
    } catch (error) {
      toast.error("Failed to soft reject item");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (itemId: string, banAuthor: boolean = false) => {
    if (!notes) {
      toast.error("Notes are required for reject");
      return;
    }

    setIsProcessing(true);
    try {
      await reviewQueueService.rejectItem(itemId, "admin", "Admin User", notes, banAuthor);
      toast.success(banAuthor ? "Item rejected and author banned" : "Item rejected");
      setNotes("");
      const nextItem = reviewQueueService.getNextItem(itemId);
      setSelectedItem(nextItem);
      loadData();
    } catch (error) {
      toast.error("Failed to reject item");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSelection = (itemId: string) => {
    reviewQueueService.toggleSelection(itemId);
    loadData();
  };

  const handleBulkApprove = async () => {
    const selected = reviewQueueService.getSelectedItems();
    if (selected.length === 0) {
      toast.error("No items selected");
      return;
    }

    const notes = prompt("Enter notes for bulk approval:");
    if (!notes) return;

    setIsProcessing(true);
    try {
      await reviewQueueService.bulkApprove(selected.map((q) => q.itemId), "admin", "Admin User", notes);
      toast.success(`Approved ${selected.length} items`);
      reviewQueueService.clearSelection();
      loadData();
    } catch (error) {
      toast.error("Failed to bulk approve");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSoftReject = async () => {
    const selected = reviewQueueService.getSelectedItems();
    if (selected.length === 0) {
      toast.error("No items selected");
      return;
    }

    const notes = prompt("Enter notes for bulk soft reject:");
    if (!notes) return;

    setIsProcessing(true);
    try {
      await reviewQueueService.bulkSoftReject(selected.map((q) => q.itemId), "admin", "Admin User", notes);
      toast.success(`Soft rejected ${selected.length} items`);
      reviewQueueService.clearSelection();
      loadData();
    } catch (error) {
      toast.error("Failed to bulk soft reject");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    const selected = reviewQueueService.getSelectedItems();
    if (selected.length === 0) {
      toast.error("No items selected");
      return;
    }

    const notes = prompt("Enter notes for bulk reject:");
    const banAuthor = confirm("Ban authors of rejected items?");
    if (!notes) return;

    setIsProcessing(true);
    try {
      await reviewQueueService.bulkReject(selected.map((q) => q.itemId), "admin", "Admin User", notes, banAuthor);
      toast.success(`Rejected ${selected.length} items${banAuthor ? " (authors banned)" : ""}`);
      reviewQueueService.clearSelection();
      loadData();
    } catch (error) {
      toast.error("Failed to bulk reject");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextItem = () => {
    if (selectedItem) {
      const next = reviewQueueService.getNextItem(selectedItem.itemId);
      setSelectedItem(next);
    }
  };

  const handlePreviousItem = () => {
    const pendingItems = reviewQueueService.getQueue({ status: "pending" });
    if (selectedItem) {
      const currentIndex = pendingItems.findIndex((q) => q.itemId === selectedItem.itemId);
      if (currentIndex > 0) {
        setSelectedItem(pendingItems[currentIndex - 1]);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const getQualityScanStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "failed": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkApprove} disabled={isProcessing}>
            <Check className="mr-2 h-4 w-4" />
            Bulk Approve
          </Button>
          <Button variant="outline" onClick={handleBulkSoftReject} disabled={isProcessing}>
            <X className="mr-2 h-4 w-4" />
            Bulk Soft Reject
          </Button>
          <Button variant="outline" onClick={handleBulkReject} disabled={isProcessing}>
            <Ban className="mr-2 h-4 w-4" />
            Bulk Reject
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={stats.pending.toString()} icon={AlertTriangle} />
        <StatCard title="Soft Rejected" value={stats.softRejected.toString()} icon={FileText} />
        <StatCard title="Rejected" value={stats.rejected.toString()} icon={X} />
        <StatCard title="Approved" value={stats.approved.toString()} icon={Check} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === "soft_rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("soft_rejected")}
            >
              Soft Rejected
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("rejected")}
            >
              Rejected
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("approved")}
            >
              Approved
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Queue Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items in queue</p>
                ) : (
                  queue.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedItem?.itemId === item.itemId ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelection(item.itemId);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">{item.authorName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              item.status === "soft_rejected" ? "bg-orange-100 text-orange-800" :
                              item.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {item.status.replace("_", " ")}
                            </span>
                            {item.qualityScan && (
                              <span className={`text-xs ${getQualityScanStatusColor(item.qualityScan.status)}`}>
                                {item.qualityScan.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedItem ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Item Details</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handlePreviousItem} disabled={!selectedItem}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleNextItem}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleNextItem()}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="text-sm font-medium">{selectedItem.itemName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Author</label>
                    <p className="text-sm">{selectedItem.authorName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-sm">{selectedItem.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price</label>
                    <p className="text-sm font-mono">{formatCurrency(selectedItem.price, selectedItem.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                    <p className="text-sm">{formatDate(selectedItem.submittedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedItem.status.replace("_", " ")}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Quality Scan</h3>
                  {selectedItem.qualityScan ? (
                    <div className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${getQualityScanStatusColor(selectedItem.qualityScan.status)}`}>
                          {selectedItem.qualityScan.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedItem.qualityScan.scannedAt)}
                        </span>
                      </div>
                      <p className="text-sm">{selectedItem.qualityScan.scanResult}</p>
                      {selectedItem.qualityScan.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Issues:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {selectedItem.qualityScan.issues.map((issue, idx) => (
                              <li key={idx}>{issue.replace("_", " ")}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRunQualityScan(selectedItem.itemId)}>
                        <Play className="mr-2 h-3 w-3" />
                        Run Quality Scan
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-3 w-3" />
                        Download .zip
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Review Actions</h3>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add reviewer notes (required for reject/soft reject)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(selectedItem.itemId)}
                        disabled={isProcessing || (selectedItem.qualityScan?.status === "failed")}
                        className="flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve & Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSoftReject(selectedItem.itemId)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Soft Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(selectedItem.itemId)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                {selectedItem.reviewLogs.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Review History</h3>
                    <div className="space-y-2">
                      {selectedItem.reviewLogs.map((log) => (
                        <div key={log.id} className="p-2 border rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{log.reviewerName}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.action.replace("_", " ")}: {log.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select an item to review</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReviewQueue;
