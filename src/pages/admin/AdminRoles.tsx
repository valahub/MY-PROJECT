// Admin Roles Page - Dynamic Paddle RBAC Integration
// Extended from existing UI with dynamic data from Paddle RBAC system

import { useState, useEffect } from 'react';
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserCog,
  Shield,
  Lock,
  Key,
  Loader2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  paddleRBACApiService,
  paddleRBACManager,
} from "@/lib/paddle-rbac";
import type {
  RoleEntity,
  PermissionEntity,
  RolePermissions,
  PermissionConflict,
} from "@/lib/paddle-rbac";

function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [permissions, setPermissions] = useState<PermissionEntity[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleEntity | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [conflicts, setConflicts] = useState<PermissionConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load roles and permissions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        paddleRBACApiService.getRoles(),
        paddleRBACApiService.getPermissions(),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data);
      }
    } catch (error) {
      toast.error("Failed to load roles and permissions");
    } finally {
      setIsLoading(false);
    }
  };

  // Load role permissions when role is selected
  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole.id);
      loadConflicts(selectedRole.id);
    }
  }, [selectedRole]);

  const loadRolePermissions = async (roleId: string) => {
    try {
      const res = await paddleRBACApiService.getRolePermissions(roleId);
      if (res.success && res.data) {
        setRolePermissions(res.data);
      }
    } catch (error) {
      toast.error("Failed to load role permissions");
    }
  };

  const loadConflicts = async (roleId: string) => {
    try {
      const res = await paddleRBACApiService.detectConflicts(roleId);
      if (res.success && res.data) {
        setConflicts(res.data);
      }
    } catch (error) {
      console.error("Failed to detect conflicts");
    }
  };

  // Create role
  const handleCreateRole = async () => {
    setIsCreating(true);
    try {
      const res = await paddleRBACApiService.createRole({
        name: `New Role ${Date.now()}`,
        type: "custom",
      });
      if (res.success) {
        toast.success("Role created successfully");
        loadData();
      } else {
        toast.error(res.error || "Failed to create role");
      }
    } catch (error) {
      toast.error("Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  // Update role status (suspend/activate)
  const handleToggleStatus = async (role: RoleEntity) => {
    if (role.isLocked) {
      toast.error("Cannot modify locked system role");
      return;
    }

    try {
      const newStatus = role.status === "active" ? "suspended" : "active";
      const res = await paddleRBACApiService.updateRole(role.id, { status: newStatus });
      if (res.success) {
        toast.success(`Role ${newStatus === "active" ? "activated" : "suspended"}`);
        loadData();
      } else {
        toast.error(res.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  // Delete role
  const handleDeleteRole = async (role: RoleEntity) => {
    if (role.isLocked) {
      toast.error("Cannot delete locked system role");
      return;
    }

    const usageCount = paddleRBACManager.getRoleUsageCount(role.id);
    if (usageCount > 0) {
      toast.error(`Cannot delete role: ${usageCount} users assigned`);
      return;
    }

    try {
      const res = await paddleRBACApiService.deleteRole(role.id);
      if (res.success) {
        toast.success("Role deleted successfully");
        loadData();
        if (selectedRole?.id === role.id) {
          setSelectedRole(null);
          setRolePermissions(null);
        }
      } else {
        toast.error(res.error || "Failed to delete role");
      }
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  // Force sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await paddleRBACApiService.forceSync();
      if (res.success) {
        toast.success("Sync triggered successfully");
      } else {
        toast.error(res.error || "Failed to trigger sync");
      }
    } catch (error) {
      toast.error("Failed to trigger sync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Export role
  const handleExportRole = async (role: RoleEntity) => {
    try {
      const res = await paddleRBACApiService.exportRole(role.id, "admin");
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `role-${role.name.toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Role exported successfully");
      } else {
        toast.error(res.error || "Failed to export role");
      }
    } catch (error) {
      toast.error("Failed to export role");
    }
  };

  // Import role
  const handleImportRole = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      const res = await paddleRBACApiService.importRole(data, "admin");
      if (res.success) {
        toast.success("Role imported successfully");
        loadData();
      } else {
        toast.error(res.error || "Failed to import role");
      }
    } catch (error) {
      toast.error("Failed to import role");
    }
    event.target.value = "";
  };

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || role.type === filterType;
    const matchesStatus =
      filterStatus === "all" || role.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get role usage count
  const getRoleUsageCount = (roleId: string) => {
    return paddleRBACManager.getRoleUsageCount(roleId);
  };

  // Toggle role selection for bulk actions
  const toggleRoleSelection = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  // Calculate stats
  const totalRoles = roles.length;
  const totalPermissions = permissions.length;
  const lockedRoles = roles.filter((r) => r.isLocked).length;
  const apiScopes = 8; // From seed data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync
          </Button>
          <Button onClick={handleCreateRole} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Create Role"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Roles" value={totalRoles} icon={UserCog} />
        <StatCard title="Permissions" value={totalPermissions} icon={Key} />
        <StatCard title="Locked Roles" value={lockedRoles} icon={Lock} />
        <StatCard title="API Scopes" value={apiScopes} icon={Shield} />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All Types
              </Button>
              <Button
                variant={filterType === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("system")}
              >
                System
              </Button>
              <Button
                variant={filterType === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("custom")}
              >
                Custom
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All Status
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "suspended" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("suspended")}
              >
                Suspended
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} permission conflict(s) detected for{" "}
            {selectedRole?.name}
          </AlertDescription>
        </Alert>
      )}

      {/* Roles Table */}
      <DataTable
        title="System Roles"
        columns={[
          { header: "Role", accessorKey: "name" },
          { header: "Type", accessorKey: "type" },
          { header: "Users", accessorKey: "users" },
          { header: "Status", accessorKey: "status" },
          { header: "Actions", accessorKey: "actions" },
        ]}
        data={filteredRoles.map((role) => ({
          id: role.id,
          name: (
            <div className="flex items-center gap-2">
              {role.name}
              {role.isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
          ),
          type: (
            <Badge variant={role.type === "system" ? "default" : "secondary"}>
              {role.type}
            </Badge>
          ),
          users: getRoleUsageCount(role.id),
          status: (
            <Badge
              variant={role.status === "active" ? "default" : "destructive"}
            >
              {role.status}
            </Badge>
          ),
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRole(role)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(role)}
                disabled={role.isLocked}
              >
                {role.status === "active" ? "Suspend" : "Activate"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportRole(role)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRole(role)}
                disabled={role.isLocked}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ),
        }))}
      />

      {/* Role Permissions */}
      {selectedRole && rolePermissions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Module-Level Access ({selectedRole.name})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={selectedRole.status === "active" ? "default" : "destructive"}>
                  {selectedRole.status}
                </Badge>
                {selectedRole.isLocked && (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>Module</span>
                <span>Read</span>
                <span>Write</span>
                <span>Delete</span>
                <span>Admin</span>
              </div>
              {Array.from(rolePermissions.permissions.entries()).map(
                ([module, grant]) => (
                  <div
                    key={module}
                    className="grid grid-cols-5 gap-4 items-center py-2"
                  >
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded w-fit">
                      {module}
                    </code>
                    <Switch
                      checked={grant.read}
                      disabled={selectedRole.isLocked}
                    />
                    <Switch
                      checked={grant.write}
                      disabled={selectedRole.isLocked}
                    />
                    <Switch
                      checked={grant.delete}
                      disabled={selectedRole.isLocked}
                    />
                    <Switch
                      checked={grant.admin}
                      disabled={selectedRole.isLocked}
                    />
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Scope Control */}
      <Card>
        <CardHeader>
          <CardTitle>API Scope Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            "read:products",
            "write:products",
            "read:subscriptions",
            "write:subscriptions",
            "read:licenses",
            "revoke:licenses",
            "read:webhooks",
            "admin:all",
          ].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-md border p-2">
              <code className="text-xs">{s}</code>
              <Switch defaultChecked={!s.startsWith("admin")} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Import Role */}
      <Card>
        <CardHeader>
          <CardTitle>Import Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleImportRole}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRolesPage;
