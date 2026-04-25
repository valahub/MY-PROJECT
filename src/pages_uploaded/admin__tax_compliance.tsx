
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, AlertTriangle, Shield, Clock, FileText, Check, ArrowUpRight, History } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type ComplianceAlert, type TaxDeadline, type ComplianceReport, type ComplianceHistory, type ComplianceScore } from "@/lib/api/admin-services";

({ component: AdminTaxCompliance, head: () => ({ meta: [{ title: "Tax Compliance — Admin — ERP Vala" }] }) });

function AdminTaxCompliance() {
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [history, setHistory] = useState<ComplianceHistory[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      setComplianceScore(marketplaceService.getComplianceScore());
      setAlerts(marketplaceService.getComplianceAlerts());
      marketplaceService.updateDeadlineStatuses();
      setDeadlines(marketplaceService.getTaxDeadlines());
      setReports(marketplaceService.getComplianceReports());
      setHistory(marketplaceService.getComplianceHistory());
    } catch (error) {
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await marketplaceService.resolveAlert(alertId, "admin");
      toast.success("Alert resolved");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resolve alert");
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      await marketplaceService.escalateAlert(alertId, "admin");
      toast.success("Alert escalated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to escalate alert");
    }
  };

  const handleGenerateReport = async (period: string, countryCode: string, reportType: "vat" | "gst" | "sales_tax" | "1099") => {
    try {
      await marketplaceService.generateComplianceReport(period, countryCode, reportType, "admin");
      toast.success("Report generated");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "escalated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-orange-600";
      case "critical": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tax & Compliance</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsViewingHistory(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Tax Regions" value={marketplaceService.getTaxRegionsCount().toString()} icon={Shield} />
        <StatCard title="Tax Collected (MTD)" value={formatCurrency(marketplaceService.getTaxCollectedMTD())} icon={FileText} />
        <StatCard title="Compliance Score" value={`${complianceScore?.overallScore || 0}%`} icon={Shield} />
        <StatCard title="Pending Alerts" value={alerts.filter((a) => a.status === "pending").length.toString()} icon={AlertTriangle} />
      </div>

      {complianceScore && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Overall Score</label>
                <p className={`text-3xl font-bold ${getRiskLevelColor(complianceScore.riskLevel)}`}>
                  {complianceScore.overallScore}%
                </p>
                <p className="text-sm text-muted-foreground">Risk Level: {complianceScore.riskLevel.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Factors</label>
                <div className="space-y-1 mt-1">
                  {complianceScore.factors.map((factor, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{factor.factor}:</span> {factor.score.toFixed(0)}% (weight: {(factor.weight * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{alert.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    {alert.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Due: {formatDate(alert.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {alert.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEscalateAlert(alert.id)}>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedAlert(alert)}>
                      <FileText className="h-3 w-3" />
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
          <CardTitle>Tax Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {deadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines configured</p>
          ) : (
            <div className="space-y-2">
              {deadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{deadline.country}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{deadline.countryCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        deadline.status === "overdue" ? "bg-red-100 text-red-800" :
                        deadline.status === "due_soon" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {deadline.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{deadline.filingType}</span>
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(deadline.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports generated</p>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{report.country}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{report.countryCode}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{report.reportType.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        report.filingStatus === "accepted" ? "bg-green-100 text-green-800" :
                        report.filingStatus === "submitted" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {report.filingStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Period: {report.period}</span>
                      <span>Net Tax: {formatCurrency(report.netTax)}</span>
                      <span>Transactions: {report.transactionCount}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-sm font-medium">{selectedAlert.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Action Required</label>
                <p className="text-sm">{selectedAlert.actionRequired}</p>
              </div>
              {selectedAlert.region && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <p className="text-sm">{selectedAlert.region}</p>
                </div>
              )}
              {selectedAlert.dueDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="text-sm">{formatDate(selectedAlert.dueDate)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{formatDate(selectedAlert.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <p className="text-sm font-medium">{selectedReport.country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Report Type</label>
                <p className="text-sm">{selectedReport.reportType.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Period</label>
                <p className="text-sm">{selectedReport.period}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Sales</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedReport.totalSales)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Tax Collected</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedReport.totalTaxCollected)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Tax Refunded</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedReport.totalTaxRefunded)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Net Tax</label>
                  <p className="text-sm font-bold">{formatCurrency(selectedReport.netTax)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Count</label>
                <p className="text-sm">{selectedReport.transactionCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Filing Status</label>
                <p className="text-sm">{selectedReport.filingStatus.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Generated At</label>
                <p className="text-sm">{formatDate(selectedReport.generatedAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingHistory} onOpenChange={() => setIsViewingHistory(false)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compliance History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {entry.entityType.toUpperCase()}: {entry.entityId}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Description:</span> {entry.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Performed by: {entry.performedBy}
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

export default AdminTaxCompliance;
