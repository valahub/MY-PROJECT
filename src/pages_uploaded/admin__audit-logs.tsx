
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { FileText, User, Shield, Activity, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminAuditLogsPage,
  head: () => ({ meta: [{ title: "Audit Logs — Admin — ERP Vala" }] }),
});

const auditLogs = [
  {
    id: "AUD-001",
    action: "user.login",
    actor: "admin@erpvala.com",
    resource: "Auth",
    details: "Successful login from 203.0.113.1",
    timestamp: "2024-01-18 14:35:00",
  },
  {
    id: "AUD-002",
    action: "product.created",
    actor: "merchant@acme.com",
    resource: "Product PRD-045",
    details: "Created new SaaS product 'CRM Pro'",
    timestamp: "2024-01-18 14:30:00",
  },
  {
    id: "AUD-003",
    action: "subscription.cancelled",
    actor: "john@example.com",
    resource: "Subscription SUB-789",
    details: "Customer cancelled Pro plan",
    timestamp: "2024-01-18 14:25:00",
  },
  {
    id: "AUD-004",
    action: "license.revoked",
    actor: "admin@erpvala.com",
    resource: "License LIC-123",
    details: "Force revoked due to terms violation",
    timestamp: "2024-01-18 14:20:00",
  },
  {
    id: "AUD-005",
    action: "settings.updated",
    actor: "admin@erpvala.com",
    resource: "Platform Settings",
    details: "Updated tax calculation rules",
    timestamp: "2024-01-18 14:15:00",
  },
  {
    id: "AUD-006",
    action: "webhook.configured",
    actor: "merchant@beta.io",
    resource: "Webhook WH-002",
    details: "Added new endpoint for payment events",
    timestamp: "2024-01-18 14:10:00",
  },
  {
    id: "AUD-007",
    action: "payment.refunded",
    actor: "support@erpvala.com",
    resource: "Payment PAY-567",
    details: "Full refund of $49.00 issued",
    timestamp: "2024-01-18 14:05:00",
  },
  {
    id: "AUD-008",
    action: "merchant.approved",
    actor: "admin@erpvala.com",
    resource: "Merchant MCH-012",
    details: "Approved merchant application for Delta Co",
    timestamp: "2024-01-18 14:00:00",
  },
];

function AdminAuditLogsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Button variant="outline" onClick={handleExportLogs} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isExporting ? "Exporting..." : "Export Logs"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Events (24h)" value="2,456" icon={Activity} />
        <StatCard title="Unique Actors" value="89" icon={User} />
        <StatCard title="Security Events" value="12" icon={Shield} />
        <StatCard title="Total Logged" value="1.2M" icon={FileText} />
      </div>

      <DataTable
        title="Activity Log"
        columns={[
          {
            header: "Action",
            accessorKey: "action",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.action}</code>
            ),
          },
          { header: "Actor", accessorKey: "actor" },
          { header: "Resource", accessorKey: "resource" },
          { header: "Details", accessorKey: "details" },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={auditLogs}
      />
    </div>
  );
}
