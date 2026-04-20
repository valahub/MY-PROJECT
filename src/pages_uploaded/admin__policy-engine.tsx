
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Scale, Plus, CheckCircle, PlayCircle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminPolicyEnginePage,
  head: () => ({ meta: [{ title: "Policy Engine — Admin — ERP Vala" }] }),
});

const policies = [
  {
    id: "POL-001",
    name: "Auto dunning on 3 failed payments",
    domain: "billing",
    trigger: "payment.failed × 3",
    action: "Suspend subscription + send dunning email",
    evaluations: 842,
    lastFired: "2024-01-18 09:12",
    status: "active",
  },
  {
    id: "POL-002",
    name: "Block high-risk checkout",
    domain: "security",
    trigger: "trust_score < 30",
    action: "Hold order + notify fraud team",
    evaluations: 5421,
    lastFired: "2024-01-18 14:55",
    status: "active",
  },
  {
    id: "POL-003",
    name: "Auto-apply tax exemption for verified nonprofits",
    domain: "billing",
    trigger: "customer.tax_exempt = true",
    action: "Zero-rate invoice line items",
    evaluations: 34,
    lastFired: "2024-01-17 11:00",
    status: "active",
  },
  {
    id: "POL-004",
    name: "Escalate support ticket if unresolved > 48h",
    domain: "flows",
    trigger: "ticket.age > 48h AND status = open",
    action: "Reassign to Tier-2 + alert manager",
    evaluations: 128,
    lastFired: "2024-01-18 08:30",
    status: "active",
  },
  {
    id: "POL-005",
    name: "Rate-limit merchant API keys on abuse",
    domain: "security",
    trigger: "api_calls > 10 000/min",
    action: "Throttle to 1 000/min + notify merchant",
    evaluations: 2,
    lastFired: "2024-01-16 22:45",
    status: "active",
  },
  {
    id: "POL-006",
    name: "Warn on upcoming trial expiry",
    domain: "flows",
    trigger: "trial.days_left ≤ 3",
    action: "Send in-app notification + email",
    evaluations: 310,
    lastFired: "2024-01-18 06:00",
    status: "active",
  },
  {
    id: "POL-007",
    name: "Block refund if already refunded once",
    domain: "billing",
    trigger: "refund_count ≥ 1",
    action: "Reject refund request + flag for review",
    evaluations: 18,
    lastFired: "2024-01-15 13:20",
    status: "draft",
  },
];

const domainColors: Record<string, string> = {
  billing: "text-blue-600",
  security: "text-destructive",
  flows: "text-emerald-600",
};

function AdminPolicyEnginePage() {
  const [isViewingAudit, setIsViewingAudit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleViewAuditLog = async () => {
    setIsViewingAudit(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Policy audit log loaded");
    } catch (error) {
      toast.error("Failed to load audit log");
    } finally {
      setIsViewingAudit(false);
    }
  };

  const handleNewPolicy = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Policy wizard opened");
    } catch (error) {
      toast.error("Failed to open policy wizard");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Policy Engine</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewAuditLog} disabled={isViewingAudit}>
            {isViewingAudit ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isViewingAudit ? "Loading..." : "Policy Audit Log"}
          </Button>
          <Button onClick={handleNewPolicy} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Policy"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Policies"
          value="6"
          icon={Scale}
          change="1 in draft"
          changeType="neutral"
        />
        <StatCard
          title="Evaluations (24h)"
          value="8,755"
          icon={PlayCircle}
          change="Across all domains"
          changeType="positive"
        />
        <StatCard
          title="Actions Fired (24h)"
          value="312"
          icon={CheckCircle}
          change="3.6% trigger rate"
          changeType="positive"
        />
        <StatCard
          title="Domains"
          value="3"
          icon={Scale}
          change="Billing · Security · Flows"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Policies Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Trigger</p>
              <p className="text-xs text-muted-foreground">
                Every event (payment, login, API call, ticket) is evaluated against all active
                policy trigger conditions in real time.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Evaluate</p>
              <p className="text-xs text-muted-foreground">
                Conditions use a rule DSL (field · operator · value). Multiple conditions can be
                combined with AND / OR logic and time-window aggregations.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Act</p>
              <p className="text-xs text-muted-foreground">
                Matched policies execute configurable actions: suspend, notify, throttle, escalate,
                or call a webhook. All executions are logged for audit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Policy Rules"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Name", accessorKey: "name" },
          {
            header: "Domain",
            accessorKey: "domain",
            cell: ({ row }) => (
              <span className={`text-sm font-medium ${domainColors[row.original.domain] ?? ""}`}>
                {row.original.domain}
              </span>
            ),
          },
          {
            header: "Trigger",
            accessorKey: "trigger",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.trigger}</code>
            ),
          },
          { header: "Action", accessorKey: "action" },
          { header: "Evaluations", accessorKey: "evaluations" },
          { header: "Last Fired", accessorKey: "lastFired" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={policies}
      />
    </div>
  );
}
