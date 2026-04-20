import { Link } from "react-router-dom";
import { ITEMS } from "@/lib/marketplace-data";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

({ component: PortfolioPage });

function PortfolioPage() {
  const items = ITEMS.filter((i) => i.author === "PixelStack");
  const columns = [
    { key: "title", header: "Item" },
    { key: "category", header: "Category" },
    { key: "price", header: "Price", render: (i: any) => `$${i.price}` },
    { key: "sales", header: "Sales", render: (i: any) => i.sales.toLocaleString() },
    { key: "rating", header: "Rating", render: (i: any) => `${i.rating} ★ (${i.reviews})` },
    { key: "status", header: "Status", render: (i: any) => <StatusBadge status="active" /> },
    { key: "lastUpdate", header: "Updated" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <Link to="/marketplace/author/upload">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> New Item
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={items}
        searchKey="title"
        onEdit={(i) => {
          toast.info(`Edit ${i.title} (mock)`);
        }}
        onDelete={(i) => {
          toast.success(`Removed ${i.title}`);
        }}
        getItemLabel={(i) => i.title}
      />
    </div>
  );
}

export default PortfolioPage;
