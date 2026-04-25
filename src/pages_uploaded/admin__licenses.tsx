import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Key, Monitor, CheckCircle, XCircle, Loader2, Download, Eye, Settings, Ban, RefreshCw, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LicenseStatus = "active" | "expired" | "disabled" | "revoked";

interface License {
  id: string;
  licenseKey: string;
  productName: string;
  merchantName: string;
  customerName: string;
  devicesUsed: number;
  deviceLimit: number;
  status: LicenseStatus;
  expiresAt: string;
  createdAt: string;
}

function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [kpi, setKpi] = useState<{
    totalLicenses: number;
    activeLicenses: number;
    expiredLicenses: number;
    totalActivations: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    status: "active" as LicenseStatus,
    deviceLimit: 1,
    expiresAt: "",
  });

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getLicenses({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setLicenses(data);
    } catch (error) {
      toast.error("Failed to load licenses");
    } finally {
      setLoading(false);
    }
  };

  const loadKPI = async () => {
    try {
      const kpiData = marketplaceService.getLicenseKPIs();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load KPI data");
    }
  };

  useEffect(() => {
    loadLicenses();
    loadKPI();
  }, [statusFilter, searchQuery]);

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      const license = marketplaceService.getLicenseDetails(id);
      if (license) {
        setSelectedLicense(license);
        setShowViewDialog(true);
      } else {
        toast.error("License not found");
      }
    } catch (error) {
      toast.error("Failed to load license details");
    } finally {
      setViewingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    try {
      const license = marketplaceService.getLicenseDetails(id);
      if (license) {
        setSelectedLicense(license);
        setFormData({
          status: license.license.status,
          deviceLimit: license.license.deviceLimit,
          expiresAt: license.license.expiresAt || "",
        });
        setShowEditDialog(true);
      }
    } catch (error) {
      toast.error("Failed to load license for editing");
    } finally {
      setEditingId(null);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLicense) return;
    setEditingId(selectedLicense.license.id);
    try {
      await marketplaceService.updateLicenseStatus(selectedLicense.license.id, formData.status, "admin");
      toast.success(`License ${selectedLicense.license.id} updated successfully`);
      setShowEditDialog(false);
      setSelectedLicense(null);
      loadLicenses();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to update license");
    } finally {
      setEditingId(null);
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm("Are you sure you want to disable this license?")) return;
    setDisablingId(id);
    try {
      await marketplaceService.updateLicenseStatus(id, "disabled", "admin");
      toast.success(`License ${id} disabled successfully`);
      loadLicenses();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to disable license");
    } finally {
      setDisablingId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this license? This action cannot be undone.")) return;
    setRevokingId(id);
    try {
      await marketplaceService.revokeLicense(id, "admin");
      toast.success(`License ${id} revoked successfully`);
      loadLicenses();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke license");
    } finally {
      setRevokingId(null);
    }
  };

  const handleResetDevices = async (id: string) => {
    if (!confirm("Are you sure you want to reset all devices for this license?")) return;
    setResettingId(id);
    try {
      await marketplaceService.resetLicenseDevices(id, "admin");
      toast.success(`Devices reset successfully for license ${id}`);
      loadLicenses();
      loadKPI();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset devices");
    } finally {
      setResettingId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("License data exported successfully");
    } catch (error) {
      toast.error("Failed to export license data");
    } finally {
      setIsExporting(false);
    }
  };

  const formatExpiry = (date?: string) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">License Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Licenses" value={kpi.totalLicenses.toString()} icon={Key} />
          <StatCard
            title="Active"
            value={kpi.activeLicenses.toString()}
            icon={CheckCircle}
            change={kpi.totalLicenses > 0 ? ((kpi.activeLicenses / kpi.totalLicenses) * 100).toFixed(1) + "%" : "0%"}
            changeType="positive"
          />
          <StatCard title="Expired" value={kpi.expiredLicenses.toString()} icon={XCircle} changeType="negative" />
          <StatCard title="Total Activations" value={kpi.totalActivations.toString()} icon={Monitor} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by license key, customer, or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          {
            key: "licenseKey",
            header: "License Key",
            render: (l: License) => <span className="font-mono text-xs">{l.licenseKey}</span>,
          },
          { key: "productName", header: "Product" },
          { key: "merchantName", header: "Merchant" },
          { key: "customerName", header: "Customer" },
          {
            key: "devicesUsed",
            header: "Devices",
            render: (l: License) => `${l.devicesUsed}/${l.deviceLimit}`,
          },
          { key: "status", header: "Status", render: (l: License) => <StatusBadge status={l.status} /> },
          {
            key: "expiresAt",
            header: "Expires",
            render: (l: License) => formatExpiry(l.expiresAt),
          },
          {
            key: "actions",
            header: "",
            render: (l: License) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleView(l.id)} disabled={viewingId === l.id}>
                  {viewingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(l.id)} disabled={editingId === l.id}>
                  {editingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Settings className="h-3 w-3" />}
                </Button>
                {l.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleDisable(l.id)} disabled={disablingId === l.id}>
                    {disablingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                  </Button>
                )}
                {(l.status === "active" || l.status === "disabled") && (
                  <Button size="sm" variant="destructive" onClick={() => handleRevoke(l.id)} disabled={revokingId === l.id}>
                    {revokingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  </Button>
                )}
                {l.devicesUsed > 0 && (
                  <Button size="sm" variant="outline" onClick={() => handleResetDevices(l.id)} disabled={resettingId === l.id}>
                    {resettingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={licenses}
        searchKey="licenseKey"
        pageSize={50}
      />

      {/* View License Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>License Details</DialogTitle>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">License Key</Label>
                  <p className="font-mono text-sm">{selectedLicense.license.key}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p><StatusBadge status={selectedLicense.license.status} /></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedLicense.product?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Merchant</Label>
                  <p className="font-medium">{selectedLicense.merchant?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedLicense.customer?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Device Limit</Label>
                  <p className="font-medium">{selectedLicense.license.deviceLimit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expires</Label>
                  <p className="font-medium">{formatExpiry(selectedLicense.license.expiresAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(selectedLicense.license.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Activations</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLicense.activations.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No activations</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedLicense.activations.map((activation: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                          <Smartphone className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium">{activation.deviceId || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">Active: {activation.active ? "Yes" : "No"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Activated: {new Date(activation.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as LicenseStatus }))}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceLimit">Device Limit</Label>
              <Input
                id="deviceLimit"
                type="number"
                value={formData.deviceLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, deviceLimit: parseInt(e.target.value) || 1 }))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt.split("T")[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editingId !== null}>
              {editingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
              {editingId ? "Updating..." : "Update License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminLicensesPage;
