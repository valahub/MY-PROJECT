
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";

({
  component: SupportDashboardPage,
  head: () => ({ meta: [{ title: "Support Dashboard — ERP Vala" }] }),
});

const recentTickets = [
  {
    id: "TK-001",
    subject: "Cannot activate license",
    customer: "john@example.com",
    priority: "high",
    status: "pending",
    created: "2024-01-18 14:30",
  },
  {
    id: "TK-002",
    subject: "Billing discrepancy",
    customer: "jane@startup.io",
    priority: "medium",
    status: "active",
    created: "2024-01-18 13:15",
  },
  {
    id: "TK-003",
    subject: "Subscription not renewing",
    customer: "bob@corp.com",
    priority: "high",
    status: "active",
    created: "2024-01-18 12:00",
  },
  {
    id: "TK-004",
    subject: "Need invoice copy",
    customer: "alice@web.com",
    priority: "low",
    status: "completed",
    created: "2024-01-18 10:45",
  },
  {
    id: "TK-005",
    subject: "Refund request",
    customer: "mike@dev.com",
    priority: "medium",
    status: "pending",
    created: "2024-01-18 09:30",
  },
];

function SupportDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value="23"
          icon={MessageSquare}
          change="+5 today"
          changeType="neutral"
        />
        <StatCard
          title="Avg Response"
          value="2.4h"
          icon={Clock}
          change="-18min vs last week"
          changeType="positive"
        />
        <StatCard
          title="Resolved (24h)"
          value="18"
          icon={CheckCircle}
          change="78% resolution"
          changeType="positive"
        />
        <StatCard
          title="Escalations"
          value="3"
          icon={AlertTriangle}
          change="Needs attention"
          changeType="negative"
        />
      </div>
      <DataTable
        title="Recent Tickets"
        columns={[
          { accessorKey: "id", header: "ID" },
          { accessorKey: "subject", header: "Subject" },
          { accessorKey: "customer", header: "Customer" },
          {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => <StatusBadge status={row.original.priority} />,
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { accessorKey: "created", header: "Created" },
        ]}
        data={recentTickets}
      />
    </div>
  );
}
