
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileText, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: MerchantFilesPage,
  head: () => ({ meta: [{ title: "File Delivery — Merchant — ERP Vala" }] }),
});

const files = [
  {
    id: "FILE-001",
    name: "CRM-Pro-v3.2.1-win.exe",
    product: "CRM Pro",
    version: "3.2.1",
    platform: "Windows",
    size: "84.5 MB",
    downloads: 234,
    uploaded: "2024-01-15",
  },
  {
    id: "FILE-002",
    name: "CRM-Pro-v3.2.1-mac.dmg",
    product: "CRM Pro",
    version: "3.2.1",
    platform: "macOS",
    size: "92.1 MB",
    downloads: 156,
    uploaded: "2024-01-15",
  },
  {
    id: "FILE-003",
    name: "Analytics-Suite-v2.0.0-linux.tar.gz",
    product: "Analytics Suite",
    version: "2.0.0",
    platform: "Linux",
    size: "68.3 MB",
    downloads: 89,
    uploaded: "2024-01-10",
  },
  {
    id: "FILE-004",
    name: "CRM-Pro-v3.1.0-win.exe",
    product: "CRM Pro",
    version: "3.1.0",
    platform: "Windows",
    size: "82.3 MB",
    downloads: 1023,
    uploaded: "2023-12-01",
  },
];

function MerchantFilesPage() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = async () => {
    setIsUploading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">File Delivery</h1>
        <Button onClick={handleUploadFile} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secure File Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Files are delivered via time-limited secure tokens. Customers can only access files for
            products they have an active license or subscription for. Token links expire after 24
            hours.
          </p>
        </CardContent>
      </Card>

      <DataTable
        title="Uploaded Files"
        columns={[
          {
            accessorKey: "name",
            header: "File Name",
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-mono">{row.original.name}</span>
              </div>
            ),
          },
          { accessorKey: "product", header: "Product" },
          { accessorKey: "version", header: "Version" },
          { accessorKey: "platform", header: "Platform" },
          { accessorKey: "size", header: "Size" },
          { accessorKey: "downloads", header: "Downloads" },
          { accessorKey: "uploaded", header: "Uploaded" },
        ]}
        data={files}
      />
    </div>
  );
}

export default MerchantFilesPage;
