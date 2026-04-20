
import { DataTable } from "@/components/DataTable";

({ component: MerchantCustomers });

const customers = [
  {
    id: "cus_001",
    name: "John Doe",
    email: "john@example.com",
    subscriptions: 1,
    ltv: "$348",
    country: "US",
    joined: "2024-01-15",
  },
  {
    id: "cus_002",
    name: "Jane Smith",
    email: "jane@company.co",
    subscriptions: 1,
    ltv: "$499",
    country: "UK",
    joined: "2024-02-20",
  },
  {
    id: "cus_003",
    name: "Bob Wilson",
    email: "bob@startup.io",
    subscriptions: 1,
    ltv: "$261",
    country: "CA",
    joined: "2023-07-10",
  },
  {
    id: "cus_004",
    name: "Alice Brown",
    email: "alice@dev.com",
    subscriptions: 1,
    ltv: "$49",
    country: "DE",
    joined: "2024-07-18",
  },
  {
    id: "cus_005",
    name: "Charlie Davis",
    email: "charlie@tech.io",
    subscriptions: 0,
    ltv: "$237",
    country: "AU",
    joined: "2024-03-05",
  },
  {
    id: "cus_006",
    name: "Eva Green",
    email: "eva@design.co",
    subscriptions: 1,
    ltv: "$116",
    country: "FR",
    joined: "2024-04-12",
  },
  {
    id: "cus_007",
    name: "Frank Lee",
    email: "frank@agency.com",
    subscriptions: 1,
    ltv: "$999",
    country: "US",
    joined: "2024-04-08",
  },
  {
    id: "cus_008",
    name: "Grace Kim",
    email: "grace@studio.io",
    subscriptions: 1,
    ltv: "$499",
    country: "KR",
    joined: "2024-04-18",
  },
];

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "subscriptions", header: "Active Subs" },
  { key: "ltv", header: "LTV" },
  { key: "country", header: "Country" },
  { key: "joined", header: "Joined" },
];

function MerchantCustomers() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>
      <DataTable columns={columns} data={customers} searchKey="name" />
    </div>
  );
}
