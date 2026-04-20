
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileCheck, Clock, Globe, BookOpen, ShieldCheck, Loader2, FileText, Download as DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminCompliancePage,
  head: () => ({ meta: [{ title: "Legal & Compliance — Admin — ERP Vala" }] }),
});

const gdprRequests = [
  {
    id: "REQ-001",
    customer: "john@example.com",
    type: "export",
    requestedAt: "2024-01-18 10:00",
    slaDue: "2024-02-17",
    completedAt: "2024-01-18 10:12",
    slaDaysLeft: "—",
    status: "completed",
  },
  {
    id: "REQ-002",
    customer: "jane@startup.io",
    type: "delete",
    requestedAt: "2024-01-17 14:30",
    slaDue: "2024-02-16",
    completedAt: "—",
    slaDaysLeft: "29",
    status: "pending",
  },
  {
    id: "REQ-003",
    customer: "bob@corp.com",
    type: "export",
    requestedAt: "2024-01-17 09:15",
    slaDue: "2024-02-16",
    completedAt: "2024-01-17 09:22",
    slaDaysLeft: "—",
    status: "completed",
  },
  {
    id: "REQ-004",
    customer: "alice@web.com",
    type: "delete",
    requestedAt: "2024-01-16 16:00",
    slaDue: "2024-02-15",
    completedAt: "2024-01-16 16:45",
    slaDaysLeft: "—",
    status: "completed",
  },
  {
    id: "REQ-005",
    customer: "mike@dev.com",
    type: "export",
    requestedAt: "2024-01-15 11:20",
    slaDue: "2024-02-14",
    completedAt: "—",
    slaDaysLeft: "27",
    status: "pending",
  },
  {
    id: "REQ-006",
    customer: "sara@oldco.com",
    type: "delete",
    requestedAt: "2023-12-20 09:00",
    slaDue: "2024-01-19",
    completedAt: "—",
    slaDaysLeft: "1",
    status: "active",
  },
];

const policyVersions = [
  {
    id: "POL-001",
    document: "Privacy Policy",
    version: "v4.2",
    publishedAt: "2024-01-01",
    changes: "Updated data retention terms + AI processing disclosure",
    status: "active",
  },
  {
    id: "POL-002",
    document: "Terms of Service",
    version: "v8.1",
    publishedAt: "2024-01-01",
    changes: "Revised arbitration clause + EU user rights section",
    status: "active",
  },
  {
    id: "POL-003",
    document: "Cookie Policy",
    version: "v2.5",
    publishedAt: "2023-09-15",
    changes: "Added Google Analytics 4 + Clarity cookie disclosures",
    status: "active",
  },
  {
    id: "POL-004",
    document: "Privacy Policy",
    version: "v4.1",
    publishedAt: "2023-07-01",
    changes: "Initial CCPA addendum",
    status: "archived",
  },
  {
    id: "POL-005",
    document: "Data Processing Agreement",
    version: "v3.0",
    publishedAt: "2024-01-01",
    changes: "Updated SCCs for EU-US data transfers post Schrems II",
    status: "active",
  },
];

const taxCompliance = [
  {
    region: "European Union",
    rule: "VAT OSS",
    rate: "20% (avg)",
    invoiceFormat: "EN 16931",
    autoCalc: "Yes",
    status: "active",
  },
  {
    region: "United Kingdom",
    rule: "UK VAT",
    rate: "20%",
    invoiceFormat: "HMRC standard",
    autoCalc: "Yes",
    status: "active",
  },
  {
    region: "Canada",
    rule: "GST/HST",
    rate: "5–15%",
    invoiceFormat: "CRA standard",
    autoCalc: "Yes",
    status: "active",
  },
  {
    region: "Australia",
    rule: "GST",
    rate: "10%",
    invoiceFormat: "ATO standard",
    autoCalc: "Yes",
    status: "active",
  },
  {
    region: "India",
    rule: "GST",
    rate: "18%",
    invoiceFormat: "GSTIN required",
    autoCalc: "Yes",
    status: "active",
  },
  {
    region: "Brazil",
    rule: "ICMS / ISS",
    rate: "Varies",
    invoiceFormat: "NF-e",
    autoCalc: "Partial",
    status: "pending",
  },
  {
    region: "United States",
    rule: "Sales Tax (nexus)",
    rate: "0–10.5%",
    invoiceFormat: "State-specific",
    autoCalc: "Yes",
    status: "active",
  },
];

const auditReports = [
  {
    id: "RPT-001",
    name: "GDPR Compliance Report — Jan 2024",
    generatedAt: "2024-01-18",
    period: "January 2024",
    status: "ready",
  },
  {
    id: "RPT-002",
    name: "Tax Remittance Summary — Q4 2023",
    generatedAt: "2024-01-05",
    period: "Q4 2023",
    status: "ready",
  },
  {
    id: "RPT-003",
    name: "Data Access Audit — Dec 2023",
    generatedAt: "2024-01-05",
    period: "December 2023",
    status: "ready",
  },
  {
    id: "RPT-004",
    name: "CCPA Opt-Out Log — Q4 2023",
    generatedAt: "2024-01-05",
    period: "Q4 2023",
    status: "ready",
  },
  {
    id: "RPT-005",
    name: "GDPR Compliance Report — Feb 2024",
    generatedAt: "—",
    period: "February 2024",
    status: "pending",
  },
];

function AdminCompliancePage() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExportingAudit, setIsExportingAudit] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Compliance report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportAuditTrail = async () => {
    setIsExportingAudit(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Audit trail exported successfully");
    } catch (error) {
      toast.error("Failed to export audit trail");
    } finally {
      setIsExportingAudit(false);
    }
  };

  const handleDownloadReport = async (id: string) => {
    setDownloadingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Failed to download report");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Legal & Compliance Automation</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
          <Button onClick={handleExportAuditTrail} disabled={isExportingAudit}>
            {isExportingAudit ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="mr-2 h-4 w-4" />
            )}
            {isExportingAudit ? "Exporting..." : "Export Audit Trail"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Export Requests" value="45" icon={Download} />
        <StatCard title="Delete Requests" value="12" icon={Trash2} />
        <StatCard
          title="Pending Requests"
          value="3"
          icon={Clock}
          change="SLA: 30 days"
          changeType="neutral"
        />
        <StatCard title="Compliance Score" value="100%" icon={FileCheck} changeType="positive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GDPR / CCPA Rights Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Right to Access</p>
              <p className="text-xs text-muted-foreground mt-1">
                On-demand JSON + CSV export of all personal data.
              </p>
              <p className="mt-2 text-xs font-medium text-success">✓ Automated</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Right to Erasure</p>
              <p className="text-xs text-muted-foreground mt-1">
                30-day SLA for deletion across all systems and backups.
              </p>
              <p className="mt-2 text-xs font-medium text-success">✓ SLA tracked</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Data Portability</p>
              <p className="text-xs text-muted-foreground mt-1">
                Machine-readable export: subscriptions, invoices, licenses.
              </p>
              <p className="mt-2 text-xs font-medium text-success">✓ Automated</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Consent Management</p>
              <p className="text-xs text-muted-foreground mt-1">
                Explicit opt-in tracking for marketing & data processing.
              </p>
              <p className="mt-2 text-xs font-medium text-success">✓ Versioned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="GDPR / CCPA Privacy Requests"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Customer", accessorKey: "customer" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.type}</code>
            ),
          },
          { header: "Requested", accessorKey: "requestedAt" },
          { header: "SLA Due", accessorKey: "slaDue" },
          { header: "SLA Days Left", accessorKey: "slaDaysLeft" },
          { header: "Completed", accessorKey: "completedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={gdprRequests}
      />

      <DataTable
        title="Policy Version History"
        columns={[
          {
            header: "Document",
            accessorKey: "document",
            cell: ({ row }) => (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {row.original.document}
              </span>
            ),
          },
          { header: "Version", accessorKey: "version" },
          { header: "Published", accessorKey: "publishedAt" },
          { header: "Key Changes", accessorKey: "changes" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={policyVersions}
      />

      <DataTable
        title="Tax & Invoice Compliance by Region"
        columns={[
          {
            header: "Region",
            accessorKey: "region",
            cell: ({ row }) => (
              <span className="flex items-center gap-1.5 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {row.original.region}
              </span>
            ),
          },
          { header: "Rule", accessorKey: "rule" },
          { header: "Rate", accessorKey: "rate" },
          { header: "Invoice Format", accessorKey: "invoiceFormat" },
          { header: "Auto-Calc", accessorKey: "autoCalc" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={taxCompliance}
      />

      <DataTable
        title="Audit-Ready Reports"
        columns={[
          {
            header: "Report",
            accessorKey: "name",
            cell: ({ row }) => (
              <span className="flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {row.original.name}
              </span>
            ),
          },
          { header: "Period", accessorKey: "period" },
          { header: "Generated", accessorKey: "generatedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "Action",
            accessorKey: "id",
            cell: ({ row }) =>
              row.original.status === "ready" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(row.original.id)}
                  disabled={downloadingId === row.original.id}
                >
                  {downloadingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3.5 w-3.5" />
                  )}
                  {downloadingId === row.original.id ? "Downloading..." : "Download"}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Generating…</span>
              ),
          },
        ]}
        data={auditReports}
      />
    </div>
  );
}

export default AdminCompliancePage;
