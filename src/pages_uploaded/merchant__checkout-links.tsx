
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: MerchantCheckoutLinks,
});

const links = [
  {
    id: "chk_001",
    name: "Pro Plan Monthly",
    product: "Pro Plan",
    url: "https://checkout.erpvala.com/pro-monthly",
    status: "active",
    conversions: 234,
    created: "2024-01-20",
  },
  {
    id: "chk_002",
    name: "Enterprise Annual",
    product: "Enterprise License",
    url: "https://checkout.erpvala.com/enterprise",
    status: "active",
    conversions: 45,
    created: "2024-02-15",
  },
  {
    id: "chk_003",
    name: "Starter Kit Purchase",
    product: "Starter Kit",
    url: "https://checkout.erpvala.com/starter",
    status: "active",
    conversions: 890,
    created: "2023-12-01",
  },
  {
    id: "chk_004",
    name: "Black Friday Deal",
    product: "Pro Plan",
    url: "https://checkout.erpvala.com/bf-deal",
    status: "disabled",
    conversions: 1200,
    created: "2023-11-20",
  },
];

function MerchantCheckoutLinks() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCopyUrl = async (url: string, id: string) => {
    setCopiedId(id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Checkout link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
      setCopiedId(null);
    }
  };

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Checkout link created successfully");
    } catch (error) {
      toast.error("Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "product", header: "Product" },
    {
      key: "status",
      header: "Status",
      render: (l: any) => <StatusBadge status={l.status === "disabled" ? "inactive" : l.status} />,
    },
    { key: "conversions", header: "Conversions" },
    { key: "created", header: "Created" },
    {
      key: "url",
      header: "",
      render: (l: any) => (
        <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(l.url, l.id)}>
          {copiedId === l.id ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checkout Links</h1>
        <Button onClick={handleCreateLink} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? "Creating..." : "Create Link"}
        </Button>
      </div>
      <DataTable columns={columns} data={links} searchKey="name" />
    </div>
  );
}
