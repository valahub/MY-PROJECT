
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { FileText, Layers, Clock, CheckCircle, Loader2, Eye, Plus, Edit, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminDocumentsPage,
  head: () => ({ meta: [{ title: "Document Generation — Admin — ERP Vala" }] }),
});

const templates = [
  {
    id: "TPL-001",
    name: "Invoice — Standard",
    type: "invoice",
    format: "PDF",
    lastUpdated: "2024-01-10",
    variables: "12",
    status: "active",
  },
  {
    id: "TPL-002",
    name: "Invoice — Enterprise",
    type: "invoice",
    format: "PDF",
    lastUpdated: "2024-01-12",
    variables: "18",
    status: "active",
  },
  {
    id: "TPL-003",
    name: "Monthly Revenue Report",
    type: "report",
    format: "PDF",
    lastUpdated: "2024-01-05",
    variables: "24",
    status: "active",
  },
  {
    id: "TPL-004",
    name: "License Certificate",
    type: "certificate",
    format: "PDF",
    lastUpdated: "2023-12-20",
    variables: "8",
    status: "active",
  },
  {
    id: "TPL-005",
    name: "Payout Statement",
    type: "statement",
    format: "PDF",
    lastUpdated: "2024-01-08",
    variables: "15",
    status: "active",
  },
  {
    id: "TPL-006",
    name: "Tax Receipt (EU VAT)",
    type: "invoice",
    format: "PDF",
    lastUpdated: "2023-11-15",
    variables: "20",
    status: "draft",
  },
];

const recentGenerations = [
  {
    id: "GEN-001",
    template: "Invoice — Standard",
    requestedBy: "merchant@acme.com",
    resource: "INV-8821",
    renderTime: "0.42s",
    size: "84 KB",
    createdAt: "2024-01-18 14:30",
    status: "completed",
  },
  {
    id: "GEN-002",
    template: "Monthly Revenue Report",
    requestedBy: "scheduler",
    resource: "RPT-2024-01",
    renderTime: "2.1s",
    size: "1.2 MB",
    createdAt: "2024-01-18 06:05",
    status: "completed",
  },
  {
    id: "GEN-003",
    template: "Payout Statement",
    requestedBy: "author@store.com",
    resource: "PAY-2024-01",
    renderTime: "0.88s",
    size: "210 KB",
    createdAt: "2024-01-18 10:20",
    status: "completed",
  },
  {
    id: "GEN-004",
    template: "License Certificate",
    requestedBy: "system",
    resource: "LIC-9042",
    renderTime: "0.31s",
    size: "60 KB",
    createdAt: "2024-01-18 14:35",
    status: "pending",
  },
];

function AdminDocumentsPage() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handlePreviewTemplate = async () => {
    setIsPreviewing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Preview rendered");
    } catch (error) {
      toast.error("Failed to render preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleNewTemplate = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Template created successfully");
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreviewItem = async (id: string, name: string) => {
    setPreviewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Preview of ${name} rendered`);
    } catch (error) {
      toast.error("Failed to render preview");
    } finally {
      setPreviewingId(null);
    }
  };

  const handleEditItem = async (id: string) => {
    setEditingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Editor opened");
    } catch (error) {
      toast.error("Failed to open editor");
    } finally {
      setEditingId(null);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Document Generation</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviewTemplate} disabled={isPreviewing}>
            {isPreviewing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isPreviewing ? "Rendering..." : "Preview Template"}
          </Button>
          <Button onClick={handleNewTemplate} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Template"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Templates"
          value="6"
          icon={Layers}
          change="5 active · 1 draft"
          changeType="neutral"
        />
        <StatCard
          title="Generated (24h)"
          value="1,204"
          icon={FileText}
          change="+8% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Avg Render Time"
          value="0.65s"
          icon={Clock}
          change="Well within SLA"
          changeType="positive"
        />
        <StatCard
          title="Success Rate"
          value="99.8%"
          icon={CheckCircle}
          change="Last 30 days"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Document Templates"
        columns={[
          { header: "Name", accessorKey: "name" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.type}</code>
            ),
          },
          { header: "Format", accessorKey: "format" },
          { header: "Variables", accessorKey: "variables" },
          { header: "Last Updated", accessorKey: "lastUpdated" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreviewItem(row.original.id, row.original.name)}
                  disabled={previewingId === row.original.id}
                >
                  {previewingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {previewingId === row.original.id ? "Rendering..." : "Preview"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditItem(row.original.id)}
                  disabled={editingId === row.original.id}
                >
                  {editingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Edit className="mr-1 h-3 w-3" />
                  )}
                  {editingId === row.original.id ? "Opening..." : "Edit"}
                </Button>
              </div>
            ),
          },
        ]}
        data={templates}
      />

      <DataTable
        title="Recent Generations"
        columns={[
          { header: "Template", accessorKey: "template" },
          { header: "Requested By", accessorKey: "requestedBy" },
          { header: "Resource", accessorKey: "resource" },
          { header: "Render Time", accessorKey: "renderTime" },
          { header: "Size", accessorKey: "size" },
          { header: "Created", accessorKey: "createdAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(row.original.id)}
                disabled={downloadingId === row.original.id}
              >
                {downloadingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Download className="mr-1 h-3 w-3" />
                )}
                {downloadingId === row.original.id ? "Downloading..." : "Download"}
              </Button>
            ),
          },
        ]}
        data={recentGenerations}
      />
    </div>
  );
}
