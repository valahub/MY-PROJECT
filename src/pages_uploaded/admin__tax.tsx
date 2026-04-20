
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Globe, Calculator, FileCheck, AlertTriangle, Loader2, Plus, Eye } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminTaxPage,
  head: () => ({ meta: [{ title: "Tax & Compliance — Admin — ERP Vala" }] }),
});

const taxRules = [
  {
    id: "TX-001",
    country: "United States",
    type: "Sales Tax",
    rate: "Varies by state",
    status: "active",
    lastUpdated: "2024-01-15",
  },
  {
    id: "TX-002",
    country: "United Kingdom",
    type: "VAT",
    rate: "20%",
    status: "active",
    lastUpdated: "2024-01-10",
  },
  {
    id: "TX-003",
    country: "Germany",
    type: "VAT",
    rate: "19%",
    status: "active",
    lastUpdated: "2024-01-08",
  },
  {
    id: "TX-004",
    country: "France",
    type: "VAT",
    rate: "20%",
    status: "active",
    lastUpdated: "2024-01-08",
  },
  {
    id: "TX-005",
    country: "Canada",
    type: "GST/HST",
    rate: "5-15%",
    status: "active",
    lastUpdated: "2024-01-05",
  },
  {
    id: "TX-006",
    country: "Australia",
    type: "GST",
    rate: "10%",
    status: "active",
    lastUpdated: "2024-01-03",
  },
  {
    id: "TX-007",
    country: "India",
    type: "GST",
    rate: "18%",
    status: "active",
    lastUpdated: "2024-01-01",
  },
  {
    id: "TX-008",
    country: "Japan",
    type: "Consumption Tax",
    rate: "10%",
    status: "active",
    lastUpdated: "2024-01-01",
  },
];

const complianceAlerts = [
  {
    id: "CA-001",
    title: "EU DAC7 reporting deadline approaching",
    severity: "high",
    due: "2024-01-31",
  },
  {
    id: "CA-002",
    title: "UK Making Tax Digital update required",
    severity: "medium",
    due: "2024-02-15",
  },
  {
    id: "CA-003",
    title: "US 1099-K threshold change effective",
    severity: "high",
    due: "2024-03-01",
  },
];

function AdminTaxPage() {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleAddTaxRule = async () => {
    setIsAddingRule(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Tax rule added successfully");
    } catch (error) {
      toast.error("Failed to add tax rule");
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleReviewAlert = async (id: string) => {
    setReviewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Alert ${id} reviewed`);
    } catch (error) {
      toast.error("Failed to review alert");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tax & Compliance</h1>
        <Button onClick={handleAddTaxRule} disabled={isAddingRule}>
          {isAddingRule ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAddingRule ? "Adding..." : "Add Tax Rule"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tax Regions"
          value="42"
          icon={Globe}
          change="+3 this month"
          changeType="neutral"
        />
        <StatCard
          title="Tax Collected (MTD)"
          value="$28,450"
          icon={Calculator}
          change="+12.3% vs last month"
          changeType="positive"
        />
        <StatCard
          title="Compliance Score"
          value="98%"
          icon={FileCheck}
          change="Excellent"
          changeType="positive"
        />
        <StatCard
          title="Pending Alerts"
          value="3"
          icon={AlertTriangle}
          change="Action required"
          changeType="negative"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`h-4 w-4 ${alert.severity === "high" ? "text-destructive" : "text-accent"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {alert.due}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReviewAlert(alert.id)}
                  disabled={reviewingId === alert.id}
                >
                  {reviewingId === alert.id ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-3 w-3" />
                  )}
                  {reviewingId === alert.id ? "Reviewing..." : "Review"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Tax Rules by Country"
        columns={[
          { header: "Country", accessorKey: "country" },
          { header: "Tax Type", accessorKey: "type" },
          { header: "Rate", accessorKey: "rate" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Last Updated", accessorKey: "lastUpdated" },
        ]}
        data={taxRules}
      />
    </div>
  );
}

export default AdminTaxPage;
