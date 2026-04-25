// Admin Audit Logs Page - Dynamic Paddle RBAC Integration
// View audit logs for role and permission changes

import { useState, useEffect } from 'react';
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { paddleRBACApiService } from "@/lib/paddle-rbac";
import type { AuditLogEntity } from "@/lib/paddle-rbac";

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterUserId, setFilterUserId] = useState<string>("");

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Load audit logs
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await paddleRBACApiService.getAuditLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh logs
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadLogs();
      toast.success("Audit logs refreshed");
    } catch (error) {
      toast.error("Failed to refresh audit logs");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export logs
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported");
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.roleId && log.roleId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesUser = !filterUserId || log.userId === filterUserId;
    return matchesSearch && matchesAction && matchesUser;
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by user ID..."
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <DataTable
        title="Audit Log Entries"
        columns={[
          { header: "Timestamp", accessorKey: "timestamp" },
          { header: "Action", accessorKey: "action" },
          { header: "User ID", accessorKey: "userId" },
          { header: "Role ID", accessorKey: "roleId" },
          { header: "Details", accessorKey: "details" },
        ]}
        data={filteredLogs.map((log) => ({
          id: log.id,
          timestamp: formatTimestamp(log.timestamp),
          action: (
            <Badge variant="outline" className="font-mono text-xs">
              {log.action}
            </Badge>
          ),
          userId: (
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {log.userId}
            </code>
          ),
          roleId: log.roleId ? (
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {log.roleId}
            </code>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
          details: log.metadata ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log(log.metadata);
                toast.info("Metadata logged to console");
              }}
            >
              <FileText className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        }))}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Filtered Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unique Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminAuditLogsPage;
