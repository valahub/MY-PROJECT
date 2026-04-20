
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

({
  component: SupportEscalationsPage,
  head: () => ({ meta: [{ title: "Escalations — Support — ERP Vala" }] }),
});

const escalations = [
  {
    id: "ESC-001",
    ticket: "TK-003",
    subject: "Subscription not auto-renewing",
    customer: "bob@corp.com",
    escalatedBy: "Sarah",
    reason: "Technical issue requires engineering",
    priority: "critical",
    status: "active",
    escalatedAt: "2024-01-18 13:30",
  },
  {
    id: "ESC-002",
    ticket: "TK-006",
    subject: "License key not working on Mac",
    customer: "sam@test.com",
    escalatedBy: "Mike",
    reason: "Repeated failure, potential platform bug",
    priority: "high",
    status: "active",
    escalatedAt: "2024-01-18 10:00",
  },
  {
    id: "ESC-003",
    ticket: "TK-001",
    subject: "Cannot activate license",
    customer: "john@example.com",
    escalatedBy: "Sarah",
    reason: "Customer VIP, needs immediate resolution",
    priority: "high",
    status: "pending",
    escalatedAt: "2024-01-18 15:00",
  },
];

function SupportEscalationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Escalations</h1>
      <DataTable
        columns={[
          { accessorKey: "ticket", header: "Ticket" },
          { accessorKey: "subject", header: "Subject" },
          { accessorKey: "customer", header: "Customer" },
          { accessorKey: "reason", header: "Reason" },
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
          { accessorKey: "escalatedAt", header: "Escalated" },
        ]}
        data={escalations}
      />
    </div>
  );
}
