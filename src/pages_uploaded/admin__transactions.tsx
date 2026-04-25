import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Download, Loader2, DollarSign, TrendingUp, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionType = "payment" | "refund" | "chargeback";
type TransactionStatus = "completed" | "pending" | "failed" | "refunded";

interface Transaction {
  id: string;
  customerName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod: string;
  createdAt: string;
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Refund form state
  const [refundAmount, setRefundAmount] = useState(0);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getTransactions({
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setTransactions(data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, statusFilter, searchQuery]);

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      const transaction = marketplaceService.getTransactionDetails(id);
      if (transaction) {
        setSelectedTransaction(transaction);
        setShowViewDialog(true);
      } else {
        toast.error("Transaction not found");
      }
    } catch (error) {
      toast.error("Failed to load transaction details");
    } finally {
      setViewingId(null);
    }
  };

  const handleRefundDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount);
    setShowRefundDialog(true);
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    setRefundingId(selectedTransaction.id);
    try {
      await marketplaceService.refundTransaction(selectedTransaction.id, refundAmount, "admin");
      toast.success(`Refund of $${refundAmount} processed successfully`);
      setShowRefundDialog(false);
      setSelectedTransaction(null);
      loadTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setRefundingId(null);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await marketplaceService.retryTransaction(id, "admin");
      toast.success(`Transaction ${id} retried successfully`);
      loadTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry transaction");
    } finally {
      setRetryingId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Transactions exported successfully");
    } catch (error) {
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getTypeLabel = (type: TransactionType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by transaction ID or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="chargeback">Chargeback</SelectItem>
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "id", header: "Transaction ID" },
          { key: "customerName", header: "Customer" },
          {
            key: "type",
            header: "Type",
            render: (t: Transaction) => getTypeLabel(t.type),
          },
          {
            key: "amount",
            header: "Amount",
            render: (t: Transaction) => (
              <span className={t.type === "refund" || t.type === "chargeback" ? "text-red-600" : ""}>
                {formatAmount(t.amount)}
              </span>
            ),
          },
          { key: "status", header: "Status", render: (t: Transaction) => <StatusBadge status={t.status} /> },
          {
            key: "paymentMethod",
            header: "Method",
            render: (t: Transaction) => t.paymentMethod,
          },
          {
            key: "createdAt",
            header: "Date",
            render: (t: Transaction) => formatDate(t.createdAt),
          },
          {
            key: "actions",
            header: "",
            render: (t: Transaction) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleView(t.id)} disabled={viewingId === t.id}>
                  {viewingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                </Button>
                {t.type === "payment" && t.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => handleRefundDialog(t)}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                {t.type === "payment" && t.status === "failed" && (
                  <Button size="sm" variant="outline" onClick={() => handleRetry(t.id)} disabled={retryingId === t.id}>
                    {retryingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={transactions}
        searchKey="id"
        pageSize={50}
      />

      {/* View Transaction Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedTransaction.transaction.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p><StatusBadge status={selectedTransaction.transaction.status} /></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedTransaction.transaction.type || "payment"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">{formatAmount(selectedTransaction.transaction.amount || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedTransaction.customer?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedTransaction.product?.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedTransaction.paymentMethod?.type || "card"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last 4</Label>
                  <p className="font-mono text-sm">{selectedTransaction.paymentMethod?.last4 || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{formatDate(selectedTransaction.transaction.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subscription</Label>
                  <p className="font-medium">{selectedTransaction.subscription?.id || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">Original Amount</p>
                <p className="text-lg font-bold">{formatAmount(selectedTransaction.amount)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  max={selectedTransaction.amount}
                  min={0}
                  step={0.01}
                />
                <p className="text-xs text-muted-foreground">
                  {refundAmount < selectedTransaction.amount ? "Partial refund" : "Full refund"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} disabled={refundingId !== null}>
              {refundingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              {refundingId ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminTransactions;
