import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AppRole } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
}

const ALL_ROLES: AppRole[] = ["admin", "merchant", "author", "customer", "support"];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRole, setPendingRole] = useState<Record<string, AppRole>>({});

  async function load() {
    setLoading(true);
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, AppRole[]>();
    (roleRows ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      roleMap.set(r.user_id, arr);
    });

    setUsers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        roles: roleMap.get(p.id) ?? [],
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addRole(userId: string, role: AppRole) {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Granted "${role}"`);
    await load();
  }

  async function removeRole(userId: string, role: AppRole) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Revoked "${role}"`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users & Roles</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Promote users to admin, merchant, author, customer, or support.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[260px]">Grant role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                        {u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeRole(u.id, r)}
                            title="Click to revoke"
                          >
                            {r} ✕
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={pendingRole[u.id]}
                          onValueChange={(v) =>
                            setPendingRole((p) => ({ ...p, [u.id]: v as AppRole }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          disabled={!pendingRole[u.id]}
                          onClick={() => {
                            const role = pendingRole[u.id];
                            if (role) {
                              void addRole(u.id, role);
                              setPendingRole((p) => {
                                const { [u.id]: _, ...rest } = p;
                                return rest;
                              });
                            }
                          }}
                        >
                          Grant
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
