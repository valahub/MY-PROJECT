
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";

({
  component: MerchantSubscriptions,
});

const subscriptions = [
  {
    id: "sub_001",
    customer: "John Doe",
    plan: "Pro Plan — Monthly",
    status: "active",
    mrr: "$29.00",
    nextBill: "2024-08-15",
    started: "2024-01-15",
  },
  {
    id: "sub_002",
    customer: "Jane Smith",
    plan: "Enterprise — Annual",
    status: "active",
    mrr: "$41.58",
    nextBill: "2025-02-20",
    started: "2024-02-20",
  },
  {
    id: "sub_003",
    customer: "Bob Wilson",
    plan: "Pro Plan — Monthly",
    status: "past_due",
    mrr: "$29.00",
    nextBill: "2024-07-10",
    started: "2023-07-10",
  },
  {
    id: "sub_004",
    customer: "Alice Brown",
    plan: "API Add-on — Monthly",
    status: "trialing",
    mrr: "$49.00",
    nextBill: "2024-08-01",
    started: "2024-07-18",
  },
  {
    id: "sub_005",
    customer: "Charlie Davis",
    plan: "Team Plan — Monthly",
    status: "canceled",
    mrr: "$0.00",
    nextBill: "—",
    started: "2024-03-05",
  },
  {
    id: "sub_006",
    customer: "Eva Green",
    plan: "Pro Plan — Monthly",
    status: "paused",
    mrr: "$0.00",
    nextBill: "—",
    started: "2024-04-12",
  },
];

const columns = [
  { key: "customer", header: "Customer" },
  { key: "plan", header: "Plan" },
  { key: "status", header: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
  { key: "mrr", header: "MRR" },
  { key: "nextBill", header: "Next Billing" },
  { key: "started", header: "Started" },
];

function MerchantSubscriptions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <DataTable columns={columns} data={subscriptions} searchKey="customer" />
    </div>
  );
}
