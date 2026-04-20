
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

({ component: MerchantLicenses });

const licenses = [
  {
    id: "lic_001",
    key: "EVLA-XXXX-XXXX-1234",
    product: "Enterprise License",
    customer: "Jane Smith",
    status: "active",
    activations: "2/5",
    expires: "2025-02-20",
    created: "2024-02-20",
  },
  {
    id: "lic_002",
    key: "EVLA-XXXX-XXXX-5678",
    product: "White Label",
    customer: "Frank Lee",
    status: "active",
    activations: "1/3",
    expires: "2025-04-08",
    created: "2024-04-08",
  },
  {
    id: "lic_003",
    key: "EVLA-XXXX-XXXX-9012",
    product: "Enterprise License",
    customer: "Bob Wilson",
    status: "expired",
    activations: "5/5",
    expires: "2024-06-10",
    created: "2023-06-10",
  },
  {
    id: "lic_004",
    key: "EVLA-XXXX-XXXX-3456",
    product: "Enterprise License",
    customer: "Grace Kim",
    status: "active",
    activations: "0/5",
    expires: "2025-04-18",
    created: "2024-04-18",
  },
  {
    id: "lic_005",
    key: "EVLA-XXXX-XXXX-7890",
    product: "White Label",
    customer: "Alice Brown",
    status: "disabled",
    activations: "0/3",
    expires: "—",
    created: "2024-05-01",
  },
];

const columns = [
  { key: "key", header: "License Key" },
  { key: "product", header: "Product" },
  { key: "customer", header: "Customer" },
  { key: "status", header: "Status", render: (l: any) => <StatusBadge status={l.status} /> },
  { key: "activations", header: "Activations" },
  { key: "expires", header: "Expires" },
];

function MerchantLicenses() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLicense = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("License generated successfully");
    } catch (error) {
      toast.error("Failed to generate license");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Licenses</h1>
        <Button onClick={handleGenerateLicense} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Generate License"}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Licenses</p>
            <p className="text-2xl font-bold">247</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">189</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold">58</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable columns={columns} data={licenses} searchKey="customer" />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <DataTable
            columns={columns}
            data={licenses.filter((l) => l.status === "active")}
            searchKey="customer"
          />
        </TabsContent>
        <TabsContent value="expired" className="mt-4">
          <DataTable
            columns={columns}
            data={licenses.filter((l) => l.status === "expired")}
            searchKey="customer"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
