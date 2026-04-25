
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Loader2, DollarSign, AlertTriangle, TrendingUp, Check, X, ArrowUp, RefreshCw, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type Refund, type RefundCreateInput } from "@/lib/api/admin-services";

({ component: AdminMarketplaceRefunds, head: () => ({ meta: [{ title: "Marketplace Refunds — Admin — ERP Vala" }] }) });

function AdminMarketplaceRefunds() {
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kpi, setKpi] = useState({ pending: 0, escalated: 0, approved30d: 0, refundVolume: 0 });
  const [refundInput, setRefundInput] = useState<RefundCreateInput>({
    orderId: "",
    itemId: "",
    buyerId: "",
    reason: "",
    amount: 0,
    currency: "USD",
    buyerMessage: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setRefunds(marketplaceService.getRefunds());
      setKpi(marketplaceService.getRefundKPI());
    } catch (error) {
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    const reason = prompt("Enter approval reason:");
    if (!reason) return;
    try {
      await marketplaceService.approveRefund(id, reason, "admin");
      toast.success("Refund approved and executed");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve refund");
    }
  };

  const handleDeny = async (id: string) => {
    const reason = prompt("Enter denial reason:");
    if (!reason) return;
    try {
      await marketplaceService.denyRefund(id, reason, "admin");
      toast.success("Refund denied");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deny refund");
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      await marketplaceService.escalateRefund(id, "admin");
      toast.success("Refund escalated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to escalate refund");
    }
  };

  const handleAddAuthorResponse = async (id: string) => {
    const response = prompt("Enter author response:");
    if (!response) return;
    try {
      await marketplaceService.addAuthorResponse(id, response, "admin");
      toast.success("Author response added");
      loadData();
    } catch (error) {
      toast.error("Failed to add response");
    }
  };

  const handleCreateRefund = async () => {
    try {
      await marketplaceService.createRefund(refundInput, "admin");
      toast.success("Refund created");
      setIsCreating(false);
      setRefundInput({
        orderId: "",
        itemId: "",
        buyerId: "",
        reason: "",
        amount: 0,
        currency: "USD",
        buyerMessage: "",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create refund");
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
      case "under_review": return "text-blue-600";
      case "escalated": return "text-orange-600";
      case "approved": return "text-green-600";
      case "denied": return "text-red-600";
      case "refunded": return "text-green-700";
      default: return "text-gray-600";
    }
  };

  const items = marketplaceService.listItems();
  const orders = marketplaceService.listOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Refunds Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Create Refund
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={kpi.pending.toString()} icon={AlertTriangle} />
        <StatCard title="Escalated" value={kpi.escalated.toString()} icon={ArrowUp} />
        <StatCard title="Approved (30d)" value={kpi.approved30d.toString()} icon={Check} />
        <StatCard title="Refund Volume" value={formatCurrency(kpi.refundVolume, "USD")} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refunds</p>
          ) : (
            <div className="space-y-2">
              {refunds.map((refund) => (
                <div key={refund.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{refund.itemName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(refund.status)}`}>
                        {refund.status.toUpperCase()}
                      </span>
                      {refund.fraudFlag && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">FRAUD FLAG</span>}
                      {refund.isDispute && <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600">DISPUTE</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{refund.buyerEmail}</span>
                      <span>Author: {refund.authorName}</span>
                      <span>{formatCurrency(refund.amount, refund.currency)}</span>
                      <span>Refunded: {formatCurrency(refund.refundedAmount, refund.currency)}</span>
                      <span>Requested: {formatDate(refund.requestedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {refund.status === "pending" || refund.status === "under_review" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(refund.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeny(refund.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEscalate(refund.id)}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                      </>
                    ) : null}
                    {refund.status === "pending" || refund.status === "under_review" || refund.status === "escalated" ? (
                      <Button size="sm" variant="outline" onClick={() => handleAddAuthorResponse(refund.id)}>
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => setSelectedRefund(refund)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-sm font-medium">{selectedRefund.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Buyer</label>
                <p className="text-sm">{selectedRefund.buyerEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{selectedRefund.authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-sm font-medium">{formatCurrency(selectedRefund.amount, selectedRefund.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Refunded Amount</label>
                <p className="text-sm">{formatCurrency(selectedRefund.refundedAmount, selectedRefund.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="text-sm">{selectedRefund.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-sm font-medium ${getStatusColor(selectedRefund.status)}`}>
                  {selectedRefund.status.toUpperCase()}
                </p>
              </div>
              {selectedRefund.buyerMessage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Buyer Message</label>
                  <p className="text-sm">{selectedRefund.buyerMessage}</p>
                </div>
              )}
              {selectedRefund.authorResponse && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author Response</label>
                  <p className="text-sm">{selectedRefund.authorResponse}</p>
                </div>
              )}
              {selectedRefund.adminDecision && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Decision</label>
                  <p className="text-sm">{selectedRefund.adminDecision}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requested At</label>
                <p className="text-sm">{formatDateTime(selectedRefund.requestedAt)}</p>
              </div>
              {selectedRefund.reviewedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reviewed At</label>
                  <p className="text-sm">{formatDateTime(selectedRefund.reviewedAt)}</p>
                </div>
              )}
              {selectedRefund.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                  <p className="text-sm">{formatDateTime(selectedRefund.approvedAt)}</p>
                </div>
              )}
              {selectedRefund.deniedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Denied At</label>
                  <p className="text-sm">{formatDateTime(selectedRefund.deniedAt)}</p>
                </div>
              )}
              {selectedRefund.refundedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Refunded At</label>
                  <p className="text-sm">{formatDateTime(selectedRefund.refundedAt)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreating} onOpenChange={() => setIsCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Order</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={refundInput.orderId}
                onChange={(e) => setRefundInput({ ...refundInput, orderId: e.target.value })}
              >
                <option value="">Select order...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id} - {order.customerEmail} - {formatCurrency(order.amount, order.currency)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Item</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={refundInput.itemId}
                onChange={(e) => setRefundInput({ ...refundInput, itemId: e.target.value })}
              >
                <option value="">Select item...</option>
                {items.filter((i) => i.status === "approved").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {formatCurrency(item.price, item.currency)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Buyer ID</label>
              <Input
                value={refundInput.buyerId}
                onChange={(e) => setRefundInput({ ...refundInput, buyerId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reason</label>
              <Input
                value={refundInput.reason}
                onChange={(e) => setRefundInput({ ...refundInput, reason: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <Input
                type="number"
                value={refundInput.amount}
                onChange={(e) => setRefundInput({ ...refundInput, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Currency</label>
              <Input
                value={refundInput.currency}
                onChange={(e) => setRefundInput({ ...refundInput, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Buyer Message</label>
              <Input
                value={refundInput.buyerMessage}
                onChange={(e) => setRefundInput({ ...refundInput, buyerMessage: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateRefund} className="w-full">
              <DollarSign className="mr-2 h-4 w-4" />
              Create Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceRefunds;
