
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: SupportTicketsPage,
  head: () => ({ meta: [{ title: "Tickets — Support — ERP Vala" }] }),
});

const tickets = [
  {
    id: "TK-001",
    subject: "Cannot activate license",
    customer: "john@example.com",
    merchant: "Acme Corp",
    priority: "high",
    status: "pending",
    assignee: "Sarah",
    created: "2024-01-18 14:30",
    updated: "2024-01-18 15:00",
  },
  {
    id: "TK-002",
    subject: "Billing discrepancy on invoice",
    customer: "jane@startup.io",
    merchant: "Beta Inc",
    priority: "medium",
    status: "active",
    assignee: "Mike",
    created: "2024-01-18 13:15",
    updated: "2024-01-18 14:20",
  },
  {
    id: "TK-003",
    subject: "Subscription not auto-renewing",
    customer: "bob@corp.com",
    merchant: "Gamma LLC",
    priority: "high",
    status: "active",
    assignee: "Sarah",
    created: "2024-01-18 12:00",
    updated: "2024-01-18 13:30",
  },
  {
    id: "TK-004",
    subject: "Need invoice copy for Q4",
    customer: "alice@web.com",
    merchant: "Acme Corp",
    priority: "low",
    status: "completed",
    assignee: "Tom",
    created: "2024-01-18 10:45",
    updated: "2024-01-18 11:00",
  },
  {
    id: "TK-005",
    subject: "Refund request for unused month",
    customer: "mike@dev.com",
    merchant: "Delta Co",
    priority: "medium",
    status: "pending",
    assignee: "Unassigned",
    created: "2024-01-18 09:30",
    updated: "2024-01-18 09:30",
  },
  {
    id: "TK-006",
    subject: "License key not working on Mac",
    customer: "sam@test.com",
    merchant: "Acme Corp",
    priority: "high",
    status: "active",
    assignee: "Mike",
    created: "2024-01-17 16:00",
    updated: "2024-01-18 10:00",
  },
];

function SupportTicketsPage() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTicket = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Ticket created successfully");
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Tickets</h1>
        <Button onClick={handleCreateTicket} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isCreating ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
      <DataTable
        columns={[
          { accessorKey: "id", header: "ID" },
          { accessorKey: "subject", header: "Subject" },
          { accessorKey: "customer", header: "Customer" },
          { accessorKey: "merchant", header: "Merchant" },
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
          { accessorKey: "assignee", header: "Assignee" },
          { accessorKey: "updated", header: "Updated" },
        ]}
        data={tickets}
      />
    </div>
  );
}

export default SupportTicketsPage;
