
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Loader2, DollarSign, Users, TrendingUp, Play, Pause, AlertTriangle, RefreshCw, Download, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type Payout, type PayoutCreateInput, type PayoutLedger } from "@/lib/api/admin-services";

({ component: AdminMarketplacePayouts, head: () => ({ meta: [{ title: "Marketplace Payouts — Admin — ERP Vala" }] }) });

function AdminMarketplacePayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [ledger, setLedger] = useState<PayoutLedger[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [kpi, setKpi] = useState({ totalPending: 0, totalProcessed: 0, authorsPaidYTD: 0, avgPayout: 0 });
  const [payoutInput, setPayoutInput] = useState<PayoutCreateInput>({
    authorId: "",
    method: { type: "paypal" },
    amount: 0,
    currency: "USD",
    periodStart: "",
    periodEnd: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setPayouts(marketplaceService.getPayouts());
      setLedger(marketplaceService.getPayoutLedger());
      setKpi(marketplaceService.getPayoutKPI());
    } catch (error) {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessPayout = async (id: string) => {
    try {
      await marketplaceService.processPayout(id, "admin");
      toast.success("Payout processing started");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process payout");
    }
  };

  const handleHoldPayout = async (id: string) => {
    const reason = prompt("Enter hold reason:");
    if (!reason) return;
    try {
      await marketplaceService.holdPayout(id, reason, "admin");
      toast.success("Payout placed on hold");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to hold payout");
    }
  };

  const handleBulkProcess = async () => {
    setIsProcessing(true);
    try {
      const result = await marketplaceService.bulkProcessPendingPayouts("admin");
      toast.success(`Processed ${result.success} payouts, ${result.failed} failed`);
      loadData();
    } catch (error) {
      toast.error("Failed to bulk process payouts");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const result = await marketplaceService.reconcilePayouts();
      toast.success(`Reconciliation complete: ${result.mismatches} mismatches, ${result.duplicates} duplicates`);
      loadData();
    } catch (error) {
      toast.error("Failed to reconcile payouts");
    } finally {
      setIsReconciling(false);
    }
  };

  const handleCreatePayout = async () => {
    try {
      await marketplaceService.createPayout(payoutInput, "admin");
      toast.success("Payout created");
      setIsCreating(false);
      setPayoutInput({
        authorId: "",
        method: { type: "paypal" },
        amount: 0,
        currency: "USD",
        periodStart: "",
        periodEnd: "",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create payout");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600";
      case "processing": return "text-blue-600";
      case "paid": return "text-green-600";
      case "failed": return "text-red-600";
      case "on_hold": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const authors = marketplaceService.listAuthors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Author Payouts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkProcess} disabled={isProcessing || loading}>
            <Play className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            {isProcessing ? "Processing..." : "Process All Pending"}
          </Button>
          <Button variant="outline" onClick={handleReconcile} disabled={isReconciling || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isReconciling ? "animate-spin" : ""}`} />
            {isReconciling ? "Reconciling..." : "Reconcile"}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Create Payout
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pending" value={formatCurrency(kpi.totalPending, "USD")} icon={DollarSign} />
        <StatCard title="Total Processed" value={formatCurrency(kpi.totalProcessed, "USD")} icon={TrendingUp} />
        <StatCard title="Authors Paid YTD" value={kpi.authorsPaidYTD.toString()} icon={Users} />
        <StatCard title="Avg Payout" value={formatCurrency(kpi.avgPayout, "USD")} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts</p>
          ) : (
            <div className="space-y-2">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payout.authorName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(payout.status)}`}>
                        {payout.status.toUpperCase()}
                      </span>
                      {payout.holdReason && <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600">{payout.holdReason}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{payout.authorEmail}</span>
                      <span>{payout.method.type.toUpperCase()}</span>
                      <span>{formatCurrency(payout.amount, payout.currency)}</span>
                      <span>Net: {formatCurrency(payout.netAmount, payout.currency)}</span>
                      <span>Requested: {formatDate(payout.requestedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {payout.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleProcessPayout(payout.id)}>
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleHoldPayout(payout.id)}>
                          <Pause className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedPayout(payout)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledger entries</p>
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.type.toUpperCase()}</p>
                      <span className={entry.amount >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(entry.amount, entry.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{entry.description}</span>
                      <span>Balance: {formatCurrency(entry.balance, entry.currency)}</span>
                      <span>{formatDateTime(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm font-medium">{selectedPayout.authorName}</p>
                <p className="text-xs text-muted-foreground">{selectedPayout.authorEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Method</label>
                <p className="text-sm">{selectedPayout.method.type.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-sm font-medium">{formatCurrency(selectedPayout.amount, selectedPayout.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fees</label>
                <p className="text-xs text-muted-foreground">
                  Platform: {formatCurrency(selectedPayout.platformFee, selectedPayout.currency)} | 
                  Gateway: {formatCurrency(selectedPayout.gatewayFee, selectedPayout.currency)} | 
                  Tax: {formatCurrency(selectedPayout.taxDeduction, selectedPayout.currency)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Net Amount</label>
                <p className="text-sm font-medium">{formatCurrency(selectedPayout.netAmount, selectedPayout.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Period</label>
                <p className="text-sm">{formatDate(selectedPayout.periodStart)} - {formatDate(selectedPayout.periodEnd)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-sm font-medium ${getStatusColor(selectedPayout.status)}`}>
                  {selectedPayout.status.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                <p className="text-sm">{selectedPayout.transactionId}</p>
              </div>
              {selectedPayout.gatewayTransactionId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gateway Transaction ID</label>
                  <p className="text-sm">{selectedPayout.gatewayTransactionId}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requested At</label>
                <p className="text-sm">{formatDateTime(selectedPayout.requestedAt)}</p>
              </div>
              {selectedPayout.processedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processed At</label>
                  <p className="text-sm">{formatDateTime(selectedPayout.processedAt)}</p>
                </div>
              )}
              {selectedPayout.paidAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Paid At</label>
                  <p className="text-sm">{formatDateTime(selectedPayout.paidAt)}</p>
                </div>
              )}
              {selectedPayout.failedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Failed At</label>
                  <p className="text-sm">{formatDateTime(selectedPayout.failedAt)}</p>
                </div>
              )}
              {selectedPayout.failureReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Failure Reason</label>
                  <p className="text-sm text-red-600">{selectedPayout.failureReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreating} onOpenChange={() => setIsCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Author</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={payoutInput.authorId}
                onChange={(e) => setPayoutInput({ ...payoutInput, authorId: e.target.value })}
              >
                <option value="">Select author...</option>
                {authors.filter((a) => a.status === "verified").map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name} ({author.email}) - Pending: {formatCurrency(author.pendingPayout, "USD")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Method</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={payoutInput.method.type}
                onChange={(e) => setPayoutInput({ ...payoutInput, method: { type: e.target.value as "paypal" | "wire" | "payoneer" } })}
              >
                <option value="paypal">PayPal</option>
                <option value="wire">Wire Transfer</option>
                <option value="payoneer">Payoneer</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <Input
                type="number"
                value={payoutInput.amount}
                onChange={(e) => setPayoutInput({ ...payoutInput, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Currency</label>
              <Input
                value={payoutInput.currency}
                onChange={(e) => setPayoutInput({ ...payoutInput, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period Start</label>
              <Input
                type="date"
                value={payoutInput.periodStart}
                onChange={(e) => setPayoutInput({ ...payoutInput, periodStart: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period End</label>
              <Input
                type="date"
                value={payoutInput.periodEnd}
                onChange={(e) => setPayoutInput({ ...payoutInput, periodEnd: e.target.value })}
              />
            </div>
            <Button onClick={handleCreatePayout} className="w-full">
              <DollarSign className="mr-2 h-4 w-4" />
              Create Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplacePayouts;
