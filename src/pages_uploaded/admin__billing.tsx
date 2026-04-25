import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, ArrowUpDown, RefreshCw, Loader2, Download, Eye, CheckCircle, XCircle } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type InvoiceStatus = "paid" | "pending" | "past_due" | "failed" | "void";

interface Invoice {
  id: string;
  merchantName: string;
  customerName: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
}

interface RetryQueueItem {
  id: string;
  customerName: string;
  invoiceId: string;
  amount: number;
  attemptCount: number;
  stage: string;
  nextRetryDate: string;
  status: string;
}

function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [retryQueue, setRetryQueue] = useState<RetryQueueItem[]>([]);
  const [kpi, setKpi] = useState<{
    revenueMTD: number;
    invoicesIssued: number;
    pendingPayments: number;
    pendingAmount: number;
    retryQueueCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getInvoices({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setInvoices(data);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadKPI = async () => {
    try {
      const kpiData = marketplaceService.getBillingKPIs();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load KPI data");
    }
  };

  const loadRetryQueue = async () => {
    try {
      const data = marketplaceService.getDunningQueue();
      setRetryQueue(data);
    } catch (error) {
      toast.error("Failed to load retry queue");
    }
  };

  useEffect(() => {
    loadInvoices();
    loadKPI();
    loadRetryQueue();
  }, [statusFilter, searchQuery]);

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      const invoice = marketplaceService.getInvoices({ search: id })[0];
      if (invoice) {
        setSelectedInvoice({ invoice });
        setShowViewDialog(true);
      } else {
        toast.error("Invoice not found");
      }
    } catch (error) {
      toast.error("Failed to load invoice details");
    } finally {
      setViewingId(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm("Are you sure you want to mark this invoice as paid?")) return;
    setMarkingPaidId(id);
    try {
      await marketplaceService.markInvoiceAsPaid(id, "admin");
      toast.success(`Invoice ${id} marked as paid`);
      loadInvoices();
      loadKPI();
      loadRetryQueue();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark invoice as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleRetryPayment = async (id: string) => {
    setRetryingId(id);
    try {
      await marketplaceService.retryInvoicePayment(id, "admin");
      toast.success(`Payment retry triggered for invoice ${id}`);
      loadInvoices();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry payment");
    } finally {
      setRetryingId(null);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Invoice ${id} downloaded`);
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Billing data exported successfully");
    } catch (error) {
      toast.error("Failed to export billing data");
    } finally {
      setIsExporting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Button variant="outline" onClick={handleExportAll} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export All"}
        </Button>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue (MTD)"
            value={formatAmount(kpi.revenueMTD)}
            icon={DollarSign}
          />
          <StatCard title="Invoices Issued" value={kpi.invoicesIssued.toString()} icon={Receipt} />
          <StatCard
            title="Pending Payments"
            value={kpi.pendingPayments.toString()}
            icon={ArrowUpDown}
            change={formatAmount(kpi.pendingAmount) + " outstanding"}
            changeType="neutral"
          />
          <StatCard
            title="Retry Queue"
            value={kpi.retryQueueCount.toString()}
            icon={RefreshCw}
            change="Auto-retrying"
            changeType="neutral"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by invoice ID or customer..."
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "id", header: "Invoice ID" },
          { key: "merchantName", header: "Merchant" },
          { key: "customerName", header: "Customer" },
          {
            key: "amount",
            header: "Amount",
            render: (inv: Invoice) => formatAmount(inv.amount),
          },
          { key: "status", header: "Status", render: (inv: Invoice) => <StatusBadge status={inv.status} /> },
          {
            key: "issuedDate",
            header: "Issued",
            render: (inv: Invoice) => formatDate(inv.issuedDate),
          },
          {
            key: "dueDate",
            header: "Due",
            render: (inv: Invoice) => formatDate(inv.dueDate),
          },
          {
            key: "actions",
            header: "",
            render: (inv: Invoice) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleView(inv.id)} disabled={viewingId === inv.id}>
                  {viewingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(inv.id)}>
                  <Download className="h-3 w-3" />
                </Button>
                {(inv.status === "pending" || inv.status === "failed") && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(inv.id)} disabled={markingPaidId === inv.id}>
                    {markingPaidId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  </Button>
                )}
                {(inv.status === "pending" || inv.status === "failed") && (
                  <Button size="sm" variant="outline" onClick={() => handleRetryPayment(inv.id)} disabled={retryingId === inv.id}>
                    {retryingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={invoices}
        searchKey="id"
        pageSize={50}
      />

      <DataTable
        title="Payment Retry Queue"
        columns={[
          { key: "invoiceId", header: "Invoice" },
          { key: "customerName", header: "Customer" },
          {
            key: "amount",
            header: "Amount",
            render: (rq: RetryQueueItem) => formatAmount(rq.amount),
          },
          { key: "attemptCount", header: "Attempts" },
          {
            key: "nextRetryDate",
            header: "Next Retry",
            render: (rq: RetryQueueItem) => rq.nextRetryDate ? formatDate(rq.nextRetryDate) : "N/A",
          },
          { key: "stage", header: "Stage" },
          { key: "status", header: "Status", render: (rq: RetryQueueItem) => <StatusBadge status={rq.status} /> },
        ]}
        data={retryQueue}
        searchKey="invoiceId"
        pageSize={50}
      />

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Invoice ID</span>
                  <p className="font-mono text-sm">{selectedInvoice.invoice.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Status</span>
                  <p><StatusBadge status={selectedInvoice.invoice.status} /></p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Customer</span>
                  <p className="font-medium">{selectedInvoice.customer?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Merchant</span>
                  <p className="font-medium">{selectedInvoice.merchant?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <p className="font-medium">{formatAmount(selectedInvoice.invoice.amount || 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Issued</span>
                  <p className="font-medium">{formatDate(selectedInvoice.invoice.issuedDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Due Date</span>
                  <p className="font-medium">{formatDate(selectedInvoice.invoice.dueDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Subscription</span>
                  <p className="font-medium">{selectedInvoice.subscription?.id || "N/A"}</p>
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

export default AdminBillingPage;
