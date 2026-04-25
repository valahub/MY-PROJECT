
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Download, Trash2, Clock, FileCheck, BookOpen, Shield, Check, X, History, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type DataRequest, type PolicyVersion, type LegalHold, type ComplianceAudit } from "@/lib/api/admin-services";

({ component: AdminCompliance, head: () => ({ meta: [{ title: "Legal & Compliance — Admin — ERP Vala" }] }) });

function AdminCompliance() {
  const [loading, setLoading] = useState(true);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersion[]>([]);
  const [legalHolds, setLegalHolds] = useState<LegalHold[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAudit[]>([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyVersion | null>(null);
  const [isViewingAudit, setIsViewingAudit] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [requestInput, setRequestInput] = useState({
    userId: "",
    userEmail: "",
    type: "export" as "access" | "delete" | "export",
    region: "global" as "eu" | "us_ca" | "us_other" | "global",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setDataRequests(marketplaceService.getDataRequests());
      marketplaceService.updateSLAStatuses();
      setDataRequests(marketplaceService.getDataRequests());
      setPolicyVersions(marketplaceService.getPolicyVersions());
      setLegalHolds(marketplaceService.getLegalHolds());
      setAuditLogs(marketplaceService.getComplianceAudits());
      setComplianceScore(marketplaceService.getComplianceScore());
    } catch (error) {
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessRequest = async (requestId: string) => {
    try {
      await marketplaceService.processDataRequest(requestId, "admin");
      toast.success("Request processed successfully");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process request");
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      await marketplaceService.rejectDataRequest(requestId, reason, "admin");
      toast.success("Request rejected");
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject request");
    }
  };

  const handleCreateRequest = async () => {
    try {
      await marketplaceService.createDataRequest(
        requestInput.userId,
        requestInput.userEmail,
        requestInput.type,
        requestInput.region,
        "admin"
      );
      toast.success("Data request created");
      setIsCreatingRequest(false);
      setRequestInput({
        userId: "",
        userEmail: "",
        type: "export",
        region: "global",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create request");
    }
  };

  const handleRollbackPolicy = async (policyId: string) => {
    try {
      await marketplaceService.rollbackPolicyVersion(policyId, "admin");
      toast.success("Policy rolled back");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rollback policy");
    }
  };

  const handleReleaseLegalHold = async (holdId: string) => {
    try {
      await marketplaceService.releaseLegalHold(holdId, "admin");
      toast.success("Legal hold released");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to release legal hold");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportRequests = dataRequests.filter((r) => r.type === "export").length;
  const deleteRequests = dataRequests.filter((r) => r.type === "delete").length;
  const pendingRequests = dataRequests.filter((r) => r.status === "pending" || r.status === "processing").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Legal & Compliance Automation</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsViewingAudit(true)}>
            <History className="mr-2 h-4 w-4" />
            Audit Log
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreatingRequest(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Export Requests" value={exportRequests.toString()} icon={Download} />
        <StatCard title="Delete Requests" value={deleteRequests.toString()} icon={Trash2} />
        <StatCard title="Pending Requests" value={pendingRequests.toString()} icon={Clock} />
        <StatCard title="Compliance Score" value={`${complianceScore}%`} icon={FileCheck} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GDPR / CCPA Rights Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Right to Access</p>
              <p className="text-xs text-muted-foreground mt-1">On-demand JSON + CSV export of all personal data.</p>
              <p className="mt-2 text-xs font-medium text-green-600">✓ Automated</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Right to Erasure</p>
              <p className="text-xs text-muted-foreground mt-1">30-day SLA for deletion across all systems and backups.</p>
              <p className="mt-2 text-xs font-medium text-green-600">✓ SLA tracked</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Data Portability</p>
              <p className="text-xs text-muted-foreground mt-1">Machine-readable export: subscriptions, invoices, licenses.</p>
              <p className="mt-2 text-xs font-medium text-green-600">✓ Automated</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Consent Management</p>
              <p className="text-xs text-muted-foreground mt-1">Explicit opt-in tracking for marketing & data processing.</p>
              <p className="mt-2 text-xs font-medium text-green-600">✓ Versioned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GDPR / CCPA Data Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : dataRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data requests</p>
          ) : (
            <div className="space-y-2">
              {dataRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{request.requestId}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{request.userEmail}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{request.type.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      {request.legalHold && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">LEGAL HOLD</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Requested: {formatDate(request.requestedAt)}</span>
                      <span>SLA Due: {formatDate(request.slaDueAt)}</span>
                      <span className={request.slaDaysLeft < 0 ? "text-red-600 font-medium" : ""}>
                        Days Left: {request.slaDaysLeft}
                      </span>
                      {request.completedAt && <span>Completed: {formatDate(request.completedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {request.status === "pending" && !request.legalHold && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleProcessRequest(request.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Version History</CardTitle>
        </CardHeader>
        <CardContent>
          {policyVersions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy versions</p>
          ) : (
            <div className="space-y-2">
              {policyVersions.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{policy.documentType.replace("_", " ").toUpperCase()}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{policy.version}</span>
                      {policy.region && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{policy.region.toUpperCase()}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(policy.status)}`}>
                        {policy.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Published: {formatDate(policy.publishedAt)}</span>
                      <span>By: {policy.publishedBy}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-medium">Changes:</span> {policy.keyChanges.join(", ")}
                    </div>
                  </div>
                  {policy.status === "archived" && (
                    <Button size="sm" variant="outline" onClick={() => handleRollbackPolicy(policy.id)}>
                      <History className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Holds</CardTitle>
        </CardHeader>
        <CardContent>
          {legalHolds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No legal holds</p>
          ) : (
            <div className="space-y-2">
              {legalHolds.map((hold) => (
                <div key={hold.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">User: {hold.userId}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${hold.isActive ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {hold.isActive ? "ACTIVE" : "RELEASED"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">Reason:</span> {hold.reason}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Applied: {formatDate(hold.appliedAt)}</span>
                      <span>By: {hold.appliedBy}</span>
                      {hold.releasedAt && <span>Released: {formatDate(hold.releasedAt)}</span>}
                    </div>
                  </div>
                  {hold.isActive && (
                    <Button size="sm" variant="outline" onClick={() => handleReleaseLegalHold(hold.id)}>
                      Release
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Data Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Request ID</label>
                <p className="text-sm">{selectedRequest.requestId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <p className="text-sm">{selectedRequest.userEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm">{selectedRequest.type.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                <input
                  className="w-full mt-1 p-2 border rounded"
                  placeholder="Enter reason for rejection"
                  id="rejectionReason"
                />
              </div>
              <Button
                onClick={() => {
                  const reason = (document.getElementById("rejectionReason") as HTMLInputElement)?.value;
                  if (reason) handleRejectRequest(selectedRequest.id, reason);
                }}
                className="w-full"
              >
                Reject Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingRequest} onOpenChange={() => setIsCreatingRequest(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Data Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <input
                className="w-full mt-1 p-2 border rounded"
                value={requestInput.userId}
                onChange={(e) => setRequestInput({ ...requestInput, userId: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User Email</label>
              <input
                className="w-full mt-1 p-2 border rounded"
                value={requestInput.userEmail}
                onChange={(e) => setRequestInput({ ...requestInput, userEmail: e.target.value })}
                placeholder="Enter user email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Request Type</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={requestInput.type}
                onChange={(e) => setRequestInput({ ...requestInput, type: e.target.value as "access" | "delete" | "export" })}
              >
                <option value="access">Access</option>
                <option value="export">Export</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Region</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={requestInput.region}
                onChange={(e) => setRequestInput({ ...requestInput, region: e.target.value as "eu" | "us_ca" | "us_other" | "global" })}
              >
                <option value="eu">EU (GDPR)</option>
                <option value="us_ca">California (CCPA)</option>
                <option value="us_other">US Other</option>
                <option value="global">Global</option>
              </select>
            </div>
            <Button onClick={handleCreateRequest} className="w-full">
              Create Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingAudit} onOpenChange={() => setIsViewingAudit(false)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compliance Audit Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs</p>
            ) : (
              auditLogs.map((audit) => (
                <div key={audit.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{audit.action}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(audit.timestamp)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {audit.entityType.toUpperCase()}: {audit.entityId}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Performed by:</span> {audit.performedBy}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCompliance;
