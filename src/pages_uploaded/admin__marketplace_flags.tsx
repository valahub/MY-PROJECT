
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Loader2, AlertTriangle, Shield, RefreshCw, Gavel, MessageSquare, X, Check, FileText, Clock, Zap, Lock, AlertOctagon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type ReportFlag, type ReportFlagCreateInput, type SecurityIncident } from "@/lib/api/admin-services";

({ component: AdminMarketplaceFlags, head: () => ({ meta: [{ title: "Marketplace Flags — Admin — ERP Vala" }] }) });

function AdminMarketplaceFlags() {
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<ReportFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<ReportFlag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kpi, setKpi] = useState({ open: 0, underReview: 0, actionTaken: 0, dismissed: 0, escalated: 0 });
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [securityKpi, setSecurityKpi] = useState({ detected: 0, blocked: 0, patchRequested: 0, resolved: 0, forceTakedown: 0 });
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [flagInput, setFlagInput] = useState<ReportFlagCreateInput>({
    itemId: "",
    reporterId: "",
    severity: "medium",
    reason: "",
    description: "",
    evidence: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setFlags(marketplaceService.getReportFlags());
      setKpi(marketplaceService.getFlagKPI());
      setSecurityIncidents(marketplaceService.getSecurityIncidents());
      setSecurityKpi(marketplaceService.getSecurityIncidentKPI());
    } catch (error) {
      toast.error("Failed to load flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id: string) => {
    try {
      await marketplaceService.reviewFlag(id, "admin");
      toast.success("Flag moved to review");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to review flag");
    }
  };

  const handleTakeDown = async (id: string) => {
    const notes = prompt("Enter internal notes:");
    if (!notes) return;
    try {
      await marketplaceService.takeDownItemFromFlag(id, notes, "admin");
      toast.success("Item taken down");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to take down item");
    }
  };

  const handleWarnAuthor = async (id: string) => {
    const notes = prompt("Enter internal notes:");
    if (!notes) return;
    try {
      await marketplaceService.warnAuthorFromFlag(id, notes, "admin");
      toast.success("Author warned");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to warn author");
    }
  };

  const handleDismiss = async (id: string) => {
    const reason = prompt("Enter dismissal reason:");
    if (!reason) return;
    try {
      await marketplaceService.dismissFlag(id, reason, "admin");
      toast.success("Flag dismissed");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss flag");
    }
  };

  const handleEscalate = async (id: string) => {
    const reason = prompt("Enter escalation reason:");
    if (!reason) return;
    try {
      await marketplaceService.escalateFlag(id, reason, "admin");
      toast.success("Flag escalated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to escalate flag");
    }
  };

  const handleAddNotes = async (id: string) => {
    const notes = prompt("Enter internal notes:");
    if (!notes) return;
    try {
      await marketplaceService.addInternalNotes(id, notes, "admin");
      toast.success("Notes added");
      loadData();
    } catch (error) {
      toast.error("Failed to add notes");
    }
  };

  const handleCreateFlag = async () => {
    try {
      await marketplaceService.createReportFlag(flagInput, "admin");
      toast.success("Flag created");
      setIsCreating(false);
      setFlagInput({
        itemId: "",
        reporterId: "",
        severity: "medium",
        reason: "",
        description: "",
        evidence: [],
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create flag");
    }
  };

  const handleAutoGenerate = async () => {
    setIsProcessing(true);
    try {
      await marketplaceService.autoGenerateFlags();
      toast.success("System flags generated");
      loadData();
    } catch (error) {
      toast.error("Failed to generate system flags");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestFix = async (id: string) => {
    const deadlineHours = prompt("Enter deadline in hours (default 24):", "24");
    if (!deadlineHours) return;
    try {
      await marketplaceService.requestFixFromAuthor(id, parseInt(deadlineHours), "admin");
      toast.success("Fix requested from author");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request fix");
    }
  };

  const handleSubmitFix = async (id: string) => {
    try {
      await marketplaceService.submitAuthorFix(id, "admin");
      toast.success("Fix submitted and retest triggered");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit fix");
    }
  };

  const handleIgnoreFix = async (id: string) => {
    try {
      await marketplaceService.ignoreAuthorFix(id, "admin");
      toast.success("Fix ignored and escalated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ignore fix");
    }
  };

  const handleSmartDismiss = async (id: string) => {
    try {
      const check = await marketplaceService.smartDismissCheck(id);
      if (!check.canDismiss) {
        toast.error(check.reason);
        return;
      }
      const reason = prompt("Enter dismissal reason:");
      if (!reason) return;
      await marketplaceService.dismissFlag(id, reason, "admin");
      toast.success("Flag dismissed");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss flag");
    }
  };

  const handleRequestPatch = async (id: string) => {
    try {
      await marketplaceService.requestSecurityPatch(id, "admin");
      toast.success("Security patch requested");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request patch");
    }
  };

  const handleSubmitPatch = async (id: string) => {
    try {
      await marketplaceService.submitSecurityPatch(id, "admin");
      toast.success("Patch submitted and retest triggered");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit patch");
    }
  };

  const handleForceTakedown = async (id: string) => {
    if (!confirm("Are you sure you want to force takedown? This will permanently remove the item and ban the author.")) return;
    try {
      await marketplaceService.forceTakedown(id, "admin");
      toast.success("Force takedown executed");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to force takedown");
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

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-yellow-600";
      case "under_review": return "text-blue-600";
      case "action_taken": return "text-green-600";
      case "dismissed": return "text-gray-600";
      case "escalated": return "text-orange-600";
      case "awaiting_fix": return "text-purple-600";
      case "fixed": return "text-emerald-600";
      case "ignored": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      case "critical": return "bg-red-900 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSLATimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const remaining = deadlineDate.getTime() - now.getTime();
    if (remaining <= 0) return "EXPIRED";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours < 1) return "CRITICAL";
    return `${hours}h remaining`;
  };

  const items = marketplaceService.listItems();
  const authors = marketplaceService.listAuthors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Flags</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoGenerate} disabled={isProcessing || loading}>
            <Shield className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
            {isProcessing ? "Generating..." : "Auto-Generate System Flags"}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Create Flag
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Open" value={kpi.open.toString()} icon={AlertTriangle} />
        <StatCard title="Under Review" value={kpi.underReview.toString()} icon={Eye} />
        <StatCard title="Action Taken" value={kpi.actionTaken.toString()} icon={Check} />
        <StatCard title="Dismissed" value={kpi.dismissed.toString()} icon={X} />
        <StatCard title="Escalated" value={kpi.escalated.toString()} icon={MessageSquare} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Detected" value={securityKpi.detected.toString()} icon={AlertOctagon} />
        <StatCard title="Blocked" value={securityKpi.blocked.toString()} icon={Lock} />
        <StatCard title="Patch Requested" value={securityKpi.patchRequested.toString()} icon={Zap} />
        <StatCard title="Resolved" value={securityKpi.resolved.toString()} icon={Check} />
        <StatCard title="Force Takedown" value={securityKpi.forceTakedown.toString()} icon={Gavel} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Flags</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No report flags</p>
          ) : (
            <div className="space-y-2">
              {flags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{flag.itemName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(flag.severity)}`}>
                        {flag.severity.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(flag.status)}`}>
                        {flag.status.toUpperCase()}
                      </span>
                      {flag.isSystemGenerated && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600">SYSTEM</span>}
                      {flag.actionLocked && <Lock className="h-3 w-3 text-red-600" />}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{getTimeAgo(flag.createdAt)}</span>
                      <span>Reporter: {flag.reporterName}</span>
                      <span>Trust: {flag.reporterTrustScore.toFixed(0)}%</span>
                      <span>Warnings: {flag.warningCount}</span>
                      <span>Impact: {flag.userImpactScore.toFixed(0)}</span>
                      <span>Priority: {flag.priorityScore.toFixed(0)}</span>
                      {flag.slaDeadline && (
                        <span className={getSLATimeRemaining(flag.slaDeadline) === "EXPIRED" || getSLATimeRemaining(flag.slaDeadline) === "CRITICAL" ? "text-red-600 font-bold" : ""}>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {getSLATimeRemaining(flag.slaDeadline)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-medium">Reason:</span> {flag.reason}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {flag.status === "open" && (
                      <Button size="sm" variant="outline" onClick={() => handleReview(flag.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {flag.status === "under_review" || flag.status === "escalated" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleTakeDown(flag.id)}>
                          <Gavel className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleWarnAuthor(flag.id)}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSmartDismiss(flag.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRequestFix(flag.id)}>
                          <Zap className="h-3 w-3" />
                        </Button>
                      </>
                    ) : null}
                    {flag.status === "awaiting_fix" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSubmitFix(flag.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleIgnoreFix(flag.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {flag.status !== "action_taken" && flag.status !== "dismissed" && flag.status !== "awaiting_fix" && (
                      <Button size="sm" variant="outline" onClick={() => handleEscalate(flag.id)}>
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleAddNotes(flag.id)}>
                      <FileText className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedFlag(flag)}>
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
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            Critical Security Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No security incidents</p>
          ) : (
            <div className="space-y-2">
              {securityIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded bg-red-50 border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-red-900">{incident.itemName}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-white">
                        CRITICAL
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-white">
                        {incident.vulnerabilityType.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{getTimeAgo(incident.createdAt)}</span>
                      <span>Author: {incident.authorName}</span>
                      {incident.endpoint && <span>Endpoint: {incident.endpoint}</span>}
                      <span className="text-red-600 font-bold">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {getSLATimeRemaining(incident.patchDeadline)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-medium">Description:</span> {incident.description}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {incident.status === "blocked" && (
                      <Button size="sm" variant="outline" onClick={() => handleRequestPatch(incident.id)}>
                        <Zap className="h-3 w-3" />
                      </Button>
                    )}
                    {incident.status === "patch_requested" && (
                      <Button size="sm" variant="outline" onClick={() => handleSubmitPatch(incident.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {(incident.status === "patch_requested" || incident.status === "retesting") && (
                      <Button size="sm" variant="outline" onClick={() => handleForceTakedown(incident.id)}>
                        <Gavel className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Details</DialogTitle>
          </DialogHeader>
          {selectedFlag && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-sm font-medium">{selectedFlag.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{selectedFlag.authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reporter</label>
                <p className="text-sm">{selectedFlag.reporterName} ({selectedFlag.reporterEmail})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Severity</label>
                <p className="text-sm">{selectedFlag.severity.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-sm font-medium ${getStatusColor(selectedFlag.status)}`}>
                  {selectedFlag.status.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="text-sm">{selectedFlag.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{selectedFlag.description}</p>
              </div>
              {selectedFlag.evidence && selectedFlag.evidence.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Evidence</label>
                  <ul className="text-sm list-disc list-inside">
                    {selectedFlag.evidence.map((evidence, index) => (
                      <li key={index}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedFlag.internalNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                  <p className="text-sm">{selectedFlag.internalNotes}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warning Count</label>
                <p className="text-sm">{selectedFlag.warningCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reporter Trust Score</label>
                <p className="text-sm">{selectedFlag.reporterTrustScore.toFixed(0)}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">System Generated</label>
                <p className="text-sm">{selectedFlag.isSystemGenerated ? "Yes" : "No"}</p>
              </div>
              {selectedFlag.actionTaken && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action Taken</label>
                  <p className="text-sm">{selectedFlag.actionTaken}</p>
                </div>
              )}
              {selectedFlag.dismissalReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dismissal Reason</label>
                  <p className="text-sm">{selectedFlag.dismissalReason}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{formatDateTime(selectedFlag.createdAt)}</p>
              </div>
              {selectedFlag.reviewedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reviewed At</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.reviewedAt)}</p>
                </div>
              )}
              {selectedFlag.actionedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actioned At</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.actionedAt)}</p>
                </div>
              )}
              {selectedFlag.dismissedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dismissed At</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.dismissedAt)}</p>
                </div>
              )}
              {selectedFlag.fixDeadline && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fix Deadline</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.fixDeadline)}</p>
                </div>
              )}
              {selectedFlag.fixRequestedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fix Requested At</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.fixRequestedAt)}</p>
                </div>
              )}
              {selectedFlag.fixCompletedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fix Completed At</label>
                  <p className="text-sm">{formatDateTime(selectedFlag.fixCompletedAt)}</p>
                </div>
              )}
              {selectedFlag.versionIssue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version Issue</label>
                  <p className="text-sm">{selectedFlag.versionIssue}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">User Impact Score</label>
                <p className="text-sm">{selectedFlag.userImpactScore.toFixed(0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority Score</label>
                <p className="text-sm">{selectedFlag.priorityScore.toFixed(0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Action Locked</label>
                <p className="text-sm">{selectedFlag.actionLocked ? "Yes" : "No"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-600" />
              Security Incident Details
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-sm font-medium">{selectedIncident.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{selectedIncident.authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reporter</label>
                <p className="text-sm">{selectedIncident.reporterName} ({selectedIncident.reporterEmail})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Severity</label>
                <p className="text-sm font-bold text-red-600">CRITICAL</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vulnerability Type</label>
                <p className="text-sm">{selectedIncident.vulnerabilityType.toUpperCase()}</p>
              </div>
              {selectedIncident.endpoint && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                  <p className="text-sm font-mono">{selectedIncident.endpoint}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-sm font-medium ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{selectedIncident.description}</p>
              </div>
              {selectedIncident.evidence.requestPayload && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Payload</label>
                  <p className="text-sm font-mono text-xs bg-gray-100 p-2 rounded">{selectedIncident.evidence.requestPayload}</p>
                </div>
              )}
              {selectedIncident.evidence.endpointLogs && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint Logs</label>
                  <p className="text-sm font-mono text-xs bg-gray-100 p-2 rounded">{selectedIncident.evidence.endpointLogs}</p>
                </div>
              )}
              {selectedIncident.evidence.reproductionSteps && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reproduction Steps</label>
                  <p className="text-sm">{selectedIncident.evidence.reproductionSteps}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Patch Deadline</label>
                <p className="text-sm font-bold text-red-600">{formatDateTime(selectedIncident.patchDeadline)}</p>
              </div>
              {selectedIncident.patchRequestedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Patch Requested At</label>
                  <p className="text-sm">{formatDateTime(selectedIncident.patchRequestedAt)}</p>
                </div>
              )}
              {selectedIncident.patchSubmittedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Patch Submitted At</label>
                  <p className="text-sm">{formatDateTime(selectedIncident.patchSubmittedAt)}</p>
                </div>
              )}
              {selectedIncident.retestResults && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Retest Results</label>
                  <p className="text-sm">{selectedIncident.retestResults}</p>
                </div>
              )}
              {selectedIncident.affectedUsers && selectedIncident.affectedUsers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affected Users</label>
                  <ul className="text-sm list-disc list-inside">
                    {selectedIncident.affectedUsers.map((user, index) => (
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Global Scan Triggered</label>
                <p className="text-sm">{selectedIncident.globalScanTriggered ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Developer Penalty Applied</label>
                <p className="text-sm">{selectedIncident.developerPenaltyApplied ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Forensic Log</label>
                <div className="text-sm space-y-1">
                  <p>Reported by: {selectedIncident.forensicLog.reportedBy}</p>
                  <p>Reviewed by: {selectedIncident.forensicLog.reviewedBy}</p>
                  <p>Approved by: {selectedIncident.forensicLog.approvedBy}</p>
                  <p>Detected: {formatDateTime(selectedIncident.forensicLog.timestamps.detected)}</p>
                  <p>Blocked: {formatDateTime(selectedIncident.forensicLog.timestamps.blocked)}</p>
                  {selectedIncident.forensicLog.timestamps.resolved && (
                    <p>Resolved: {formatDateTime(selectedIncident.forensicLog.timestamps.resolved)}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{formatDateTime(selectedIncident.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreating} onOpenChange={() => setIsCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Item</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={flagInput.itemId}
                onChange={(e) => setFlagInput({ ...flagInput, itemId: e.target.value })}
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
                value={flagInput.reporterId}
                onChange={(e) => setFlagInput({ ...flagInput, reporterId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Severity</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={flagInput.severity}
                onChange={(e) => setFlagInput({ ...flagInput, severity: e.target.value as "low" | "medium" | "high" | "critical" })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical (Security)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reason</label>
              <Input
                value={flagInput.reason}
                onChange={(e) => setFlagInput({ ...flagInput, reason: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Input
                value={flagInput.description}
                onChange={(e) => setFlagInput({ ...flagInput, description: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateFlag} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Create Flag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceFlags;
