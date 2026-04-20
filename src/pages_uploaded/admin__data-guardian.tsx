
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, Wrench, Archive, Database, Loader2, Eye, Search, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminDataGuardianPage,
  head: () => ({ meta: [{ title: "Data Guardian — Admin — ERP Vala" }] }),
});

const anomalies = [
  {
    id: "DG-001",
    table: "invoices",
    anomalyType: "Null FK constraint",
    rowsAffected: 3,
    detectedAt: "2024-01-18 03:14",
    action: "quarantine",
    repairStatus: "repaired",
    status: "resolved",
  },
  {
    id: "DG-002",
    table: "subscriptions",
    anomalyType: "Duplicate primary key",
    rowsAffected: 1,
    detectedAt: "2024-01-17 22:08",
    action: "quarantine",
    repairStatus: "repaired",
    status: "resolved",
  },
  {
    id: "DG-003",
    table: "payments",
    anomalyType: "Unexpected NULL amount",
    rowsAffected: 7,
    detectedAt: "2024-01-17 16:55",
    action: "quarantine",
    repairStatus: "pending",
    status: "quarantined",
  },
  {
    id: "DG-004",
    table: "users",
    anomalyType: "Schema drift detected",
    rowsAffected: 0,
    detectedAt: "2024-01-16 09:30",
    action: "alert",
    repairStatus: "manual-review",
    status: "pending",
  },
  {
    id: "DG-005",
    table: "licenses",
    anomalyType: "Checksum mismatch",
    rowsAffected: 12,
    detectedAt: "2024-01-15 04:00",
    action: "quarantine",
    repairStatus: "repaired",
    status: "resolved",
  },
];

function AdminDataGuardianPage() {
  const [isViewingQuarantine, setIsViewingQuarantine] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleViewQuarantine = async () => {
    setIsViewingQuarantine(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Quarantine view opened");
    } catch (error) {
      toast.error("Failed to open quarantine view");
    } finally {
      setIsViewingQuarantine(false);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Integrity scan completed successfully");
    } catch (error) {
      toast.error("Failed to run integrity scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Anomaly report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfigureRules = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Integrity rules configured successfully");
    } catch (error) {
      toast.error("Failed to configure rules");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Guardian</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewQuarantine} disabled={isViewingQuarantine}>
            {isViewingQuarantine ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isViewingQuarantine ? "Loading..." : "View Quarantine"}
          </Button>
          <Button onClick={handleRunScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isScanning ? "Scanning..." : "Run Integrity Scan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Anomalies (30d)"
          value="23"
          icon={AlertTriangle}
          change="-4 vs prior month"
          changeType="positive"
        />
        <StatCard
          title="Auto-Quarantined"
          value="19"
          icon={Archive}
          change="82% auto-handled"
          changeType="positive"
        />
        <StatCard
          title="Auto-Repaired"
          value="16"
          icon={Wrench}
          change="70% fully healed"
          changeType="positive"
        />
        <StatCard
          title="Data Integrity Score"
          value="99.8%"
          icon={ShieldCheck}
          change="Across all tables"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detection &amp; Repair Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">1. Detect</p>
              <p className="text-xs text-muted-foreground">
                Continuous integrity checks run across all tables: FK constraints, checksums, schema
                drift, and statistical outliers.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">2. Classify</p>
              <p className="text-xs text-muted-foreground">
                Each anomaly is classified by severity (low / medium / critical) and type (data
                corruption, schema drift, orphaned record).
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">3. Quarantine</p>
              <p className="text-xs text-muted-foreground">
                Affected rows are moved to an isolated quarantine table, preventing downstream
                contamination while repairs are staged.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">4. Repair</p>
              <p className="text-xs text-muted-foreground">
                Auto-repair restores from the nearest clean backup or applies correction rules.
                Critical anomalies require human approval before re-insertion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitored Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { table: "users", checks: "PK, email format, schema" },
              { table: "subscriptions", checks: "FK, status enum, dates" },
              { table: "invoices", checks: "FK, amounts, checksum" },
              { table: "payments", checks: "FK, amount > 0, status" },
              { table: "licenses", checks: "Checksum, expiry logic" },
              { table: "webhooks", checks: "URL format, secret hash" },
            ].map((t) => (
              <div key={t.table} className="rounded-lg border p-3">
                <p className="font-mono text-sm font-medium">{t.table}</p>
                <p className="text-xs text-muted-foreground">{t.checks}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Anomaly Log"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Table",
            accessorKey: "table",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.table}</span>,
          },
          { header: "Anomaly Type", accessorKey: "anomalyType" },
          { header: "Rows Affected", accessorKey: "rowsAffected" },
          { header: "Detected", accessorKey: "detectedAt" },
          {
            header: "Action",
            accessorKey: "action",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.action}</code>
            ),
          },
          {
            header: "Repair",
            accessorKey: "repairStatus",
            cell: ({ row }) => <StatusBadge status={row.original.repairStatus} />,
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={anomalies}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Anomaly Report"}
        </Button>
        <Button variant="outline" onClick={handleConfigureRules} disabled={isConfiguring}>
          {isConfiguring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {isConfiguring ? "Configuring..." : "Configure Integrity Rules"}
        </Button>
      </div>
    </div>
  );
}
