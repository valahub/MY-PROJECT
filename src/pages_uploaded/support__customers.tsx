
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";

({
  component: SupportCustomersPage,
  head: () => ({ meta: [{ title: "Customers — Support — ERP Vala" }] }),
});

const customers = [
  {
    id: "CUS-001",
    name: "John Doe",
    email: "john@example.com",
    tickets: 3,
    subscriptions: 2,
    lastContact: "2024-01-18",
  },
  {
    id: "CUS-002",
    name: "Jane Smith",
    email: "jane@startup.io",
    tickets: 1,
    subscriptions: 1,
    lastContact: "2024-01-17",
  },
  {
    id: "CUS-003",
    name: "Bob Wilson",
    email: "bob@corp.com",
    tickets: 5,
    subscriptions: 3,
    lastContact: "2024-01-18",
  },
  {
    id: "CUS-004",
    name: "Alice Brown",
    email: "alice@web.com",
    tickets: 2,
    subscriptions: 1,
    lastContact: "2024-01-16",
  },
];

function SupportCustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Lookup</h1>
      <DataTable
        columns={[
          { accessorKey: "name", header: "Name" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "tickets", header: "Total Tickets" },
          { accessorKey: "subscriptions", header: "Subscriptions" },
          { accessorKey: "lastContact", header: "Last Contact" },
        ]}
        data={customers}
      />
    </div>
  );
}
