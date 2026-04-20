
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

({
  component: StatementsPage,
});

const STATEMENTS = [
  {
    id: "st_dec24",
    period: "December 2024",
    gross: 12450,
    fees: 2240,
    tax: 980,
    net: 9230,
    status: "available",
  },
  {
    id: "st_nov24",
    period: "November 2024",
    gross: 11200,
    fees: 2010,
    tax: 880,
    net: 8310,
    status: "paid",
  },
  {
    id: "st_oct24",
    period: "October 2024",
    gross: 9840,
    fees: 1770,
    tax: 770,
    net: 7300,
    status: "paid",
  },
  {
    id: "st_sep24",
    period: "September 2024",
    gross: 10240,
    fees: 1840,
    tax: 800,
    net: 7600,
    status: "paid",
  },
  {
    id: "st_aug24",
    period: "August 2024",
    gross: 9120,
    fees: 1640,
    tax: 720,
    net: 6760,
    status: "paid",
  },
];

function StatementsPage() {
  const columns = [
    { key: "period", header: "Period" },
    { key: "gross", header: "Gross", render: (s: any) => `$${s.gross.toLocaleString()}` },
    { key: "fees", header: "Fees", render: (s: any) => `-$${s.fees.toLocaleString()}` },
    { key: "tax", header: "Tax", render: (s: any) => `-$${s.tax.toLocaleString()}` },
    {
      key: "net",
      header: "Net Earnings",
      render: (s: any) => <span className="font-semibold">${s.net.toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (s: any) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${s.status === "paid" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      render: (s: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.success(`Downloading ${s.period} PDF`)}
        >
          <Download className="h-3 w-3 mr-1" /> PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Statements</h1>
      <DataTable columns={columns} data={STATEMENTS} searchKey="period" />
    </div>
  );
}

export default StatementsPage;
