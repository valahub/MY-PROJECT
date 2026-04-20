
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Key, Monitor, CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminLicensesPage,
  head: () => ({ meta: [{ title: "Licenses — Admin — ERP Vala" }] }),
});

const licenses = [
  {
    id: "LIC-001",
    key: "XXXX-XXXX-XXXX-A1B2",
    product: "CRM Pro",
    merchant: "Acme Corp",
    customer: "john@example.com",
    devices: "2/5",
    status: "active",
    expires: "2025-01-15",
  },
  {
    id: "LIC-002",
    key: "XXXX-XXXX-XXXX-C3D4",
    product: "Analytics Suite",
    merchant: "Beta Inc",
    customer: "jane@startup.io",
    devices: "1/3",
    status: "active",
    expires: "2024-12-01",
  },
  {
    id: "LIC-003",
    key: "XXXX-XXXX-XXXX-E5F6",
    product: "Billing Tool",
    merchant: "Gamma LLC",
    customer: "bob@corp.com",
    devices: "3/3",
    status: "active",
    expires: "2024-06-30",
  },
  {
    id: "LIC-004",
    key: "XXXX-XXXX-XXXX-G7H8",
    product: "POS System",
    merchant: "Delta Co",
    customer: "alice@web.com",
    devices: "0/1",
    status: "expired",
    expires: "2024-01-01",
  },
  {
    id: "LIC-005",
    key: "XXXX-XXXX-XXXX-I9J0",
    product: "CRM Pro",
    merchant: "Acme Corp",
    customer: "mike@dev.com",
    devices: "1/5",
    status: "disabled",
    expires: "2024-03-15",
  },
];

function AdminLicensesPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("License data exported successfully");
    } catch (error) {
      toast.error("Failed to export license data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">License Management</h1>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Licenses" value="4,567" icon={Key} />
        <StatCard
          title="Active"
          value="3,890"
          icon={CheckCircle}
          change="85.2%"
          changeType="positive"
        />
        <StatCard title="Expired" value="432" icon={XCircle} change="9.5%" changeType="negative" />
        <StatCard title="Total Activations" value="12,345" icon={Monitor} />
      </div>

      <DataTable
        title="All Licenses"
        columns={[
          {
            header: "Key",
            accessorKey: "key",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.key}</span>,
          },
          { header: "Product", accessorKey: "product" },
          { header: "Merchant", accessorKey: "merchant" },
          { header: "Customer", accessorKey: "customer" },
          { header: "Devices", accessorKey: "devices" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Expires", accessorKey: "expires" },
        ]}
        data={licenses}
      />
    </div>
  );
}

export default AdminLicensesPage;
