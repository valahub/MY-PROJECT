
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserCog, Shield, Lock, Key, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminRolesPage,
  head: () => ({ meta: [{ title: "Roles & Permissions — Admin — ERP Vala" }] }),
});

const roles = [
  { id: "RL-001", name: "Super Admin", users: 2, permissions: "All (43)", scope: "Global" },
  { id: "RL-002", name: "Platform Admin", users: 5, permissions: "38 / 43", scope: "Global" },
  {
    id: "RL-003",
    name: "Merchant Owner",
    users: 124,
    permissions: "All merchant",
    scope: "Per-merchant",
  },
  {
    id: "RL-004",
    name: "Merchant Staff",
    users: 287,
    permissions: "12 / 25",
    scope: "Per-merchant",
  },
  {
    id: "RL-005",
    name: "Support Agent",
    users: 18,
    permissions: "Read-only + tickets",
    scope: "Global",
  },
  { id: "RL-006", name: "Customer", users: 12450, permissions: "Self-service only", scope: "Self" },
];

const modulePermissions = [
  { module: "products", read: true, write: true, delete: false },
  { module: "subscriptions", read: true, write: true, delete: false },
  { module: "licenses", read: true, write: true, delete: false },
  { module: "billing", read: true, write: false, delete: false },
  { module: "settings", read: true, write: false, delete: false },
  { module: "users", read: true, write: false, delete: false },
];

function AdminRolesPage() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRole = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Role created successfully");
    } catch (error) {
      toast.error("Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <Button onClick={handleCreateRole} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? "Creating..." : "Create Role"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Roles" value="12" icon={UserCog} />
        <StatCard title="Permissions" value="43" icon={Key} />
        <StatCard title="Locked Modules" value="6" icon={Lock} />
        <StatCard title="API Scopes" value="18" icon={Shield} />
      </div>

      <DataTable
        title="System Roles"
        columns={[
          { header: "Role", accessorKey: "name" },
          { header: "Users", accessorKey: "users" },
          { header: "Permissions", accessorKey: "permissions" },
          { header: "Scope", accessorKey: "scope" },
        ]}
        data={roles}
      />

      <Card>
        <CardHeader>
          <CardTitle>Module-Level Access (Merchant Staff)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 border-b pb-2 text-xs font-medium text-muted-foreground">
              <span>Module</span>
              <span>Read</span>
              <span>Write</span>
              <span>Delete</span>
            </div>
            {modulePermissions.map((p) => (
              <div key={p.module} className="grid grid-cols-4 gap-4 items-center py-2">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded w-fit">{p.module}</code>
                <Switch defaultChecked={p.read} />
                <Switch defaultChecked={p.write} />
                <Switch defaultChecked={p.delete} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
