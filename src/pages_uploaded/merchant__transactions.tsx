
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

({ component: MerchantTransactions });

const transactions = [
  {
    id: "txn_001",
    customer: "John Doe",
    email: "john@example.com",
    type: "Payment",
    amount: "$29.00",
    status: "completed",
    method: "Visa •••• 4242",
    date: "2024-07-15",
  },
  {
    id: "txn_002",
    customer: "Jane Smith",
    email: "jane@co.com",
    type: "Payment",
    amount: "$499.00",
    status: "completed",
    method: "Mastercard •••• 5555",
    date: "2024-07-14",
  },
  {
    id: "txn_003",
    customer: "Bob Wilson",
    email: "bob@io.com",
    type: "Refund",
    amount: "-$29.00",
    status: "refunded",
    method: "Visa •••• 1234",
    date: "2024-07-13",
  },
  {
    id: "txn_004",
    customer: "Alice Brown",
    email: "alice@dev.com",
    type: "Payment",
    amount: "$49.00",
    status: "pending",
    method: "PayPal",
    date: "2024-07-12",
  },
  {
    id: "txn_005",
    customer: "Charlie Davis",
    email: "charlie@io.com",
    type: "Payment",
    amount: "$79.00",
    status: "completed",
    method: "Visa •••• 9876",
    date: "2024-07-11",
  },
];

const columns = [
  { key: "id", header: "ID" },
  { key: "customer", header: "Customer" },
  { key: "type", header: "Type" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status", render: (t: any) => <StatusBadge status={t.status} /> },
  { key: "method", header: "Method" },
  { key: "date", header: "Date" },
];

function MerchantTransactions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable columns={columns} data={transactions} searchKey="customer" />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <DataTable
            columns={columns}
            data={transactions.filter((t) => t.type === "Payment")}
            searchKey="customer"
          />
        </TabsContent>
        <TabsContent value="refunds" className="mt-4">
          <DataTable
            columns={columns}
            data={transactions.filter((t) => t.type === "Refund")}
            searchKey="customer"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MerchantTransactions;
