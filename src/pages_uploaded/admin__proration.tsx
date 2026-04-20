
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Calculator, TrendingUp, TrendingDown, Eye, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminProrationPage,
  head: () => ({ meta: [{ title: "Proration — Admin — ERP Vala" }] }),
});

const prorations = [
  {
    id: "PRO-001",
    customer: "john@example.com",
    from: "Starter ($29)",
    to: "Pro ($99)",
    type: "upgrade",
    credit: "$14.50",
    charge: "$49.50",
    net: "+$35.00",
    date: "2024-01-18",
  },
  {
    id: "PRO-002",
    customer: "jane@startup.io",
    from: "Pro ($99)",
    to: "Enterprise ($299)",
    type: "upgrade",
    credit: "$66.00",
    charge: "$199.33",
    net: "+$133.33",
    date: "2024-01-17",
  },
  {
    id: "PRO-003",
    customer: "bob@corp.com",
    from: "Pro ($99)",
    to: "Starter ($29)",
    type: "downgrade",
    credit: "$66.00",
    charge: "$19.33",
    net: "-$46.67",
    date: "2024-01-16",
  },
  {
    id: "PRO-004",
    customer: "alice@web.com",
    from: "Enterprise ($299)",
    to: "Pro ($99)",
    type: "downgrade",
    credit: "$199.33",
    charge: "$66.00",
    net: "-$133.33",
    date: "2024-01-15",
  },
];

function AdminProrationPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Proration data exported successfully");
    } catch (error) {
      toast.error("Failed to export proration data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Proration ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load proration details");
    } finally {
      setViewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proration Engine</h1>
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
        <StatCard title="Adjustments (30d)" value="124" icon={ArrowUpDown} />
        <StatCard title="Net Upgrade" value="+$8,420" icon={TrendingUp} changeType="positive" />
        <StatCard title="Net Downgrade" value="-$2,180" icon={TrendingDown} changeType="negative" />
        <StatCard title="Avg Calc Time" value="42ms" icon={Calculator} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proration Formula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            credit = old_price × (days_remaining / billing_cycle_days)
          </div>
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            charge = new_price × (days_remaining / billing_cycle_days)
          </div>
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            net_amount = charge − credit
          </div>
          <p className="text-xs text-muted-foreground">
            All adjustments are calculated to the second of plan change and applied on next invoice.
          </p>
        </CardContent>
      </Card>

      <DataTable
        title="Recent Proration Adjustments"
        columns={[
          { header: "Customer", accessorKey: "customer" },
          { header: "From", accessorKey: "from" },
          { header: "To", accessorKey: "to" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <span
                className={
                  row.original.type === "upgrade"
                    ? "text-success text-xs font-medium"
                    : "text-destructive text-xs font-medium"
                }
              >
                {row.original.type}
              </span>
            ),
          },
          { header: "Credit", accessorKey: "credit" },
          { header: "Charge", accessorKey: "charge" },
          { header: "Net", accessorKey: "net" },
          { header: "Date", accessorKey: "date" },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(row.original.id)}
                disabled={viewingId === row.original.id}
              >
                {viewingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="mr-1 h-3 w-3" />
                )}
                {viewingId === row.original.id ? "Loading..." : "View"}
              </Button>
            ),
          },
        ]}
        data={prorations}
      />
    </div>
  );
}
