// Auth observability — internal admin screen that streams the audit trail
// (auth events, role changes, permission denials, recover events).
// Filterable by event kind / role / route. UI follows existing design tokens
// and primitives only (no new styling).

import { useEffect, useMemo, useState } from "react";
import { authHealer, type AuthEvent } from "@/lib/auth/auth-healer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyAllRoles } from "@/lib/auth/sidebar-verification";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import type { AppRole } from "@/contexts/AuthContext";
import { LayoutDashboard } from "lucide-react";

const KIND_OPTIONS = [
  "all",
  "signed_in",
  "signed_out",
  "session_loaded",
  "session_missing",
  "session_corrupt",
  "session_cleared",
  "token_refreshed",
  "token_refresh_failed",
  "roles_loaded",
  "roles_failed",
  "roles_retry",
  "stuck_loading",
  "recover_invoked",
  "recover_success",
  "recover_failed",
  "permission_denied",
  "redirect_fallback",
] as const;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function severityFor(kind: AuthEvent["kind"]): "default" | "secondary" | "destructive" | "outline" {
  if (kind === "permission_denied" || kind === "session_corrupt" || kind === "recover_failed" || kind === "token_refresh_failed") {
    return "destructive";
  }
  if (kind === "stuck_loading" || kind === "roles_failed" || kind === "roles_retry") {
    return "secondary";
  }
  if (kind === "recover_success" || kind === "signed_in" || kind === "session_loaded" || kind === "roles_loaded" || kind === "token_refreshed") {
    return "default";
  }
  return "outline";
}

export default function AdminAuthObservabilityPage() {
  const [tick, setTick] = useState(0);
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [routeFilter, setRouteFilter] = useState<string>("");

  // Stream: refresh every 1.5s.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const events = useMemo(() => {
    void tick;
    return authHealer.list(300);
  }, [tick]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      if (roleFilter) {
        const meta = (e.meta ?? {}) as Record<string, unknown>;
        const haystack = JSON.stringify(meta).toLowerCase();
        if (!haystack.includes(roleFilter.toLowerCase())) return false;
      }
      if (routeFilter) {
        const meta = (e.meta ?? {}) as Record<string, unknown>;
        const candidates = [
          meta.path,
          meta.url,
          e.message,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .join(" ");
        if (!candidates.includes(routeFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, kindFilter, roleFilter, routeFilter]);

  // Latest sidebar-hidden items derived from `redirect_fallback` events emitted by syncSidebar.
  const hiddenItems = useMemo(() => {
    const seen = new Set<string>();
    const out: { href: string; at: string; roles: string }[] = [];
    for (const e of events) {
      if (e.kind !== "redirect_fallback") continue;
      const meta = (e.meta ?? {}) as { hidden?: unknown; roles?: unknown };
      const hidden = Array.isArray(meta.hidden) ? (meta.hidden as string[]) : [];
      const rolesStr = Array.isArray(meta.roles) ? (meta.roles as string[]).join(",") : "";
      for (const href of hidden) {
        if (seen.has(href)) continue;
        seen.add(href);
        out.push({ href, at: e.at, roles: rolesStr });
        if (out.length >= 30) break;
      }
      if (out.length >= 30) break;
    }
    return out;
  }, [events]);

  // Quick stats for the dashboard navigation observer.
  const stats = useMemo(() => {
    let denied = 0;
    let allowed = 0;
    let hiddenCount = 0;
    for (const e of events) {
      if (e.kind === "permission_denied") denied++;
      if (e.kind === "session_loaded" || e.kind === "signed_in") allowed++;
      if (e.kind === "redirect_fallback") {
        const meta = (e.meta ?? {}) as { hidden?: unknown };
        if (Array.isArray(meta.hidden)) hiddenCount += meta.hidden.length;
      }
    }
    return { denied, allowed, hiddenCount };
  }, [events]);

  // Latest sidebar verification reports (one per role per run).
  const verifications = useMemo(() => {
    const out: { role: string; mismatch: number; at: string; shouldHide: string[]; shouldShow: string[] }[] = [];
    for (const e of events) {
      if (e.kind !== "redirect_fallback") continue;
      if (e.message !== "sidebar_verification") continue;
      const meta = (e.meta ?? {}) as Record<string, unknown>;
      out.push({
        role: String(meta.role ?? "?"),
        mismatch: Number(meta.mismatchCount ?? 0),
        at: e.at,
        shouldHide: Array.isArray(meta.shouldHide) ? (meta.shouldHide as string[]) : [],
        shouldShow: Array.isArray(meta.shouldShow) ? (meta.shouldShow as string[]) : [],
      });
      if (out.length >= 25) break;
    }
    return out;
  }, [events]);

  const dashboardRoutes = [
    "/admin", "/admin/dashboard", "/admin/auth-observability",
    "/merchant/dashboard", "/customer/dashboard", "/support/dashboard",
    "/marketplace/author/dashboard",
  ];

  // Run a verification pass against the canonical dashboard catalog.
  const runVerification = () => {
    const Icon = LayoutDashboard;
    const catalog: SyncableNavItem[] = [
      { title: "Admin", href: "/admin", icon: Icon },
      { title: "Auth obs", href: "/admin/auth-observability", icon: Icon },
      { title: "Server", href: "/admin/server", icon: Icon },
      { title: "Merchant", href: "/merchant/dashboard", icon: Icon },
      { title: "Customer", href: "/customer/dashboard", icon: Icon },
      { title: "Support", href: "/support/dashboard", icon: Icon },
      { title: "Author", href: "/marketplace/author/dashboard", icon: Icon },
    ];
    verifyAllRoles(catalog, (role: AppRole) => syncSidebar(catalog, [role]));
    setTick((t) => t + 1);
  };


  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Permission denials</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.denied}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Allowed sessions</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.allowed}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Sidebar items hidden</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.hiddenCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sidebar auto-sync — items hidden</CardTitle>
        </CardHeader>
        <CardContent>
          {hiddenItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items have been hidden yet.</div>
          ) : (
            <div className="rounded-md border divide-y">
              {hiddenItems.map((h) => (
                <div key={h.href} className="flex items-center justify-between px-3 py-2 text-xs">
                  <code className="font-mono">{h.href}</code>
                  <span className="text-muted-foreground">roles: {h.roles || "—"} · {formatTime(h.at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Auth observability stream</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filtered.length} of {events.length} events</span>
            <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Event kind</label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (<SelectItem key={k} value={k}>{k}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Role contains</label>
              <Input placeholder="admin / merchant / customer / …" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Route contains</label>
              <Input placeholder="/admin/server" value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Quick dashboard filter</label>
              <Select value={routeFilter && dashboardRoutes.includes(routeFilter) ? routeFilter : "__none"} onValueChange={(v) => setRouteFilter(v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">any</SelectItem>
                  {dashboardRoutes.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-2">Time</div>
              <div className="col-span-3">Kind</div>
              <div className="col-span-3">Message</div>
              <div className="col-span-4">Meta</div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No events match the current filters.</div>
              ) : (
                filtered.map((e) => (
                  <div key={e.id} className="grid grid-cols-12 items-start gap-2 border-b px-3 py-2 text-xs last:border-b-0">
                    <div className="col-span-2 font-mono text-muted-foreground">{formatTime(e.at)}</div>
                    <div className="col-span-3"><Badge variant={severityFor(e.kind)}>{e.kind}</Badge></div>
                    <div className="col-span-3 text-foreground">{e.message ?? "—"}</div>
                    <div className="col-span-4 break-all font-mono text-[10px] text-muted-foreground">
                      {e.meta ? JSON.stringify(e.meta) : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

