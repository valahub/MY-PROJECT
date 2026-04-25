
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, Loader2, AlertTriangle, FileText, Gavel, Send, Check, X, RefreshCw, MessageSquare, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type Takedown, type TakedownCreateInput } from "@/lib/api/admin-services";

({ component: AdminMarketplaceTakedowns, head: () => ({ meta: [{ title: "Marketplace Takedowns — Admin — ERP Vala" }] }) });

function AdminMarketplaceTakedowns() {
  const [loading, setLoading] = useState(true);
  const [takedowns, setTakedowns] = useState<Takedown[]>([]);
  const [selectedTakedown, setSelectedTakedown] = useState<Takedown | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kpi, setKpi] = useState({ activeCases: 0, filed30d: 0, itemsRemoved: 0, counterClaims: 0 });
  const [takedownInput, setTakedownInput] = useState<TakedownCreateInput>({
    itemId: "",
    reporterId: "",
    type: "dmca",
    description: "",
    reporterProof: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setTakedowns(marketplaceService.getTakedowns());
      setKpi(marketplaceService.getTakedownKPI());
    } catch (error) {
      toast.error("Failed to load takedowns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvestigate = async (id: string) => {
    try {
      await marketplaceService.investigateTakedown(id, "admin");
      toast.success("Takedown moved to investigation");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to investigate takedown");
    }
  };

  const handleSendNotice = async (id: string) => {
    try {
      await marketplaceService.sendTakedownNotice(id, "admin");
      toast.success("Takedown notice sent to author");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send notice");
    }
  };

  const handleExecuteTakedown = async (id: string) => {
    const reason = prompt("Enter takedown reason:");
    if (!reason) return;
    try {
      await marketplaceService.executeTakedown(id, reason, "admin");
      toast.success("Item taken down");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to execute takedown");
    }
  };

  const handleRejectTakedown = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await marketplaceService.rejectTakedown(id, reason, "admin");
      toast.success("Takedown rejected");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject takedown");
    }
  };

  const handleSubmitCounterClaim = async (id: string) => {
    const statement = prompt("Enter counter claim statement:");
    if (!statement) return;
    const proof = prompt("Enter proof URL (optional):") || "";
    try {
      await marketplaceService.submitCounterClaim(id, statement, proof, "admin");
      toast.success("Counter claim submitted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit counter claim");
    }
  };

  const handleRestoreItem = async (id: string) => {
    try {
      await marketplaceService.restoreItem(id, "admin");
      toast.success("Item restored");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore item");
    }
  };

  const handleCloseTakedown = async (id: string) => {
    try {
      await marketplaceService.closeTakedown(id, "admin");
      toast.success("Takedown closed");
      loadData();
    } catch (error) {
      toast.error("Failed to close takedown");
    }
  };

  const handleCreateTakedown = async () => {
    try {
      await marketplaceService.createTakedown(takedownInput, "admin");
      toast.success("Takedown created");
      setIsCreating(false);
      setTakedownInput({
        itemId: "",
        reporterId: "",
        type: "dmca",
        description: "",
        reporterProof: "",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create takedown");
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
      case "investigating": return "text-blue-600";
      case "notice_sent": return "text-purple-600";
      case "removed": return "text-red-600";
      case "rejected": return "text-gray-600";
      case "counter_claim": return "text-orange-600";
      case "restored": return "text-green-600";
      case "closed": return "text-gray-500";
      default: return "text-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dmca": return "bg-red-100 text-red-800";
      case "trademark": return "bg-blue-100 text-blue-800";
      case "copyright": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const items = marketplaceService.listItems();
  const authors = marketplaceService.listAuthors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DMCA & Takedowns</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Create Takedown
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Cases" value={kpi.activeCases.toString()} icon={AlertTriangle} />
        <StatCard title="Filed (30d)" value={kpi.filed30d.toString()} icon={FileText} />
        <StatCard title="Items Removed" value={kpi.itemsRemoved.toString()} icon={Gavel} />
        <StatCard title="Counter-claims" value={kpi.counterClaims.toString()} icon={Scale} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Takedown Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : takedowns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No takedown cases</p>
          ) : (
            <div className="space-y-2">
              {takedowns.map((takedown) => (
                <div key={takedown.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{takedown.itemName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(takedown.type)}`}>
                        {takedown.type.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(takedown.status)}`}>
                        {takedown.status.toUpperCase()}
                      </span>
                      {takedown.counterClaim && <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600">COUNTER CLAIM</span>}
                      {takedown.violationCount >= 3 && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">REPEAT VIOLATOR</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Reporter: {takedown.reporterName}</span>
                      <span>Author: {takedown.authorName}</span>
                      <span>Deadline: {formatDate(takedown.deadline)}</span>
                      <span>Filed: {formatDate(takedown.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {takedown.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleInvestigate(takedown.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {takedown.status === "investigating" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSendNotice(takedown.id)}>
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExecuteTakedown(takedown.id)}>
                          <Gavel className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectTakedown(takedown.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {takedown.status === "notice_sent" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleExecuteTakedown(takedown.id)}>
                          <Gavel className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectTakedown(takedown.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {takedown.status === "removed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSubmitCounterClaim(takedown.id)}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCloseTakedown(takedown.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {takedown.status === "counter_claim" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleRestoreItem(takedown.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCloseTakedown(takedown.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedTakedown(takedown)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTakedown} onOpenChange={() => setSelectedTakedown(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takedown Details</DialogTitle>
          </DialogHeader>
          {selectedTakedown && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-sm font-medium">{selectedTakedown.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm">{selectedTakedown.type.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reporter</label>
                <p className="text-sm">{selectedTakedown.reporterName} ({selectedTakedown.reporterEmail})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{selectedTakedown.authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-sm font-medium ${getStatusColor(selectedTakedown.status)}`}>
                  {selectedTakedown.status.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{selectedTakedown.description}</p>
              </div>
              {selectedTakedown.reporterProof && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reporter Proof</label>
                  <p className="text-sm">{selectedTakedown.reporterProof}</p>
                </div>
              )}
              {selectedTakedown.authorResponse && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author Response</label>
                  <p className="text-sm">{selectedTakedown.authorResponse}</p>
                </div>
              )}
              {selectedTakedown.authorProof && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author Proof</label>
                  <p className="text-sm">{selectedTakedown.authorProof}</p>
                </div>
              )}
              {selectedTakedown.counterClaimStatement && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Counter Claim Statement</label>
                  <p className="text-sm">{selectedTakedown.counterClaimStatement}</p>
                </div>
              )}
              {selectedTakedown.counterClaimProof && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Counter Claim Proof</label>
                  <p className="text-sm">{selectedTakedown.counterClaimProof}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                <p className="text-sm">{formatDateTime(selectedTakedown.deadline)}</p>
              </div>
              {selectedTakedown.takedownReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Takedown Reason</label>
                  <p className="text-sm">{selectedTakedown.takedownReason}</p>
                </div>
              )}
              {selectedTakedown.actionTimestamp && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action Timestamp</label>
                  <p className="text-sm">{formatDateTime(selectedTakedown.actionTimestamp)}</p>
                </div>
              )}
              {selectedTakedown.restoredAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Restored At</label>
                  <p className="text-sm">{formatDateTime(selectedTakedown.restoredAt)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Violation Count</label>
                <p className="text-sm">{selectedTakedown.violationCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{formatDateTime(selectedTakedown.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreating} onOpenChange={() => setIsCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Takedown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Item</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={takedownInput.itemId}
                onChange={(e) => setTakedownInput({ ...takedownInput, itemId: e.target.value })}
              >
                <option value="">Select item...</option>
                {items.filter((i) => i.status === "approved").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} by {item.authorName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reporter ID</label>
              <Input
                value={takedownInput.reporterId}
                onChange={(e) => setTakedownInput({ ...takedownInput, reporterId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={takedownInput.type}
                onChange={(e) => setTakedownInput({ ...takedownInput, type: e.target.value as "dmca" | "trademark" | "copyright" })}
              >
                <option value="dmca">DMCA</option>
                <option value="trademark">Trademark</option>
                <option value="copyright">Copyright</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Input
                value={takedownInput.description}
                onChange={(e) => setTakedownInput({ ...takedownInput, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reporter Proof URL</label>
              <Input
                value={takedownInput.reporterProof}
                onChange={(e) => setTakedownInput({ ...takedownInput, reporterProof: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateTakedown} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Create Takedown
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceTakedowns;
