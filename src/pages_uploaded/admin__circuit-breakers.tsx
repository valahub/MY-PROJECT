
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { circuitBreakerRegistry, type CircuitSnapshot } from "@/lib/circuit-breaker";
import { ShieldOff, ShieldCheck, ShieldAlert, RotateCcw, Ban, Activity, Clock, Loader2 } from "lucide-react";

({
  component: AdminCircuitBreakersPage,
  head: () => ({ meta: [{ title: "Circuit Breakers — Admin — ERP Vala" }] }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function stateToVariant(state: string): string {
  switch (state) {
    case "closed":
      return "active";
    case "half-open":
      return "pending";
    case "open":
      return "blocked";
    case "—":
      return "paused";
    default:
      return "inactive";
  }
}

function stateIcon(state: string) {
  switch (state) {
    case "closed":
      return <ShieldCheck className="h-4 w-4 text-success" />;
    case "half-open":
      return <ShieldAlert className="h-4 w-4 text-accent" />;
    case "open":
      return <ShieldOff className="h-4 w-4 text-primary" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatRetryAfter(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Cooldown expired";
  const s = Math.ceil(diff / 1_000);
  if (s < 60) return `${s}s`;
  return `${Math.ceil(s / 60)}m`;
}

// ── Mock event log (populated from registry listener + synthetic history) ─────

interface CBEvent {
  id: string;
  circuitId: string;
  from: string;
  to: string;
  reason: string;
  timestamp: number;
}

let _eventSeq = 0;

// ── Page component ────────────────────────────────────────────────────────────

function AdminCircuitBreakersPage() {
  const [snapshots, setSnapshots] = useState<CircuitSnapshot[]>(() =>
    circuitBreakerRegistry.getAllSnapshots(),
  );
  const [events, setEvents] = useState<CBEvent[]>(() => [
    {
      id: "init-1",
      circuitId: "api-gateway",
      from: "—",
      to: "closed",
      reason: "Registered at startup",
      timestamp: Date.now() - 3_600_000,
    },
    {
      id: "init-2",
      circuitId: "payment-gateway",
      from: "—",
      to: "closed",
      reason: "Registered at startup",
      timestamp: Date.now() - 3_600_000,
    },
    {
      id: "init-3",
      circuitId: "database-primary",
      from: "—",
      to: "closed",
      reason: "Registered at startup",
      timestamp: Date.now() - 3_600_000,
    },
    {
      id: "init-4",
      circuitId: "job-queue",
      from: "—",
      to: "closed",
      reason: "Registered at startup",
      timestamp: Date.now() - 3_600_000,
    },
  ]);
  const [resetting, setResetting] = useState<string | null>(null);

  // Subscribe to state changes
  useEffect(() => {
    const prevStates = new Map<string, string>(
      circuitBreakerRegistry.getAllSnapshots().map((s) => [s.id, s.state]),
    );

    const unsub = circuitBreakerRegistry.subscribe((snap) => {
      const prev = prevStates.get(snap.id) ?? "—";
      if (prev !== snap.state) {
        const ev: CBEvent = {
          id: `${++_eventSeq}`,
          circuitId: snap.id,
          from: prev,
          to: snap.state,
          reason:
            snap.state === "open"
              ? snap.lastError || "Failure threshold reached"
              : snap.state === "half-open"
                ? "Cooldown elapsed — probing"
                : "Recovered successfully",
          timestamp: Date.now(),
        };
        setEvents((prev) => [ev, ...prev].slice(0, 50));
        prevStates.set(snap.id, snap.state);
      }
      setSnapshots(circuitBreakerRegistry.getAllSnapshots());
    });

    return unsub;
  }, []);

  const handleReset = useCallback(async (id: string) => {
    setResetting(id);
    await new Promise((r) => setTimeout(r, 400));
    circuitBreakerRegistry.reset(id);
    setSnapshots(circuitBreakerRegistry.getAllSnapshots());
    setResetting(null);
  }, []);

  const handleResetAll = useCallback(async () => {
    setResetting("__all__");
    await new Promise((r) => setTimeout(r, 500));
    circuitBreakerRegistry.resetAll();
    setSnapshots(circuitBreakerRegistry.getAllSnapshots());
    setResetting(null);
  }, []);

  const openCount = snapshots.filter((s) => s.state === "open").length;
  const halfOpenCount = snapshots.filter((s) => s.state === "half-open").length;
  const closedCount = snapshots.filter((s) => s.state === "closed").length;
  const trippedToday = events.filter(
    (e) => e.to === "open" && e.timestamp > Date.now() - 86_400_000,
  ).length;

  const tableRows = events.map((e) => ({
    ...e,
    timestampStr: new Date(e.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Circuit Breakers</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          disabled={resetting === "__all__"}
        >
          {resetting === "__all__" ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          )}
          {resetting === "__all__" ? "Resetting…" : "Reset All"}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open"
          value={String(openCount)}
          icon={ShieldOff}
          change={openCount > 0 ? "Calls rejected" : "None open"}
          changeType={openCount > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Half-Open"
          value={String(halfOpenCount)}
          icon={ShieldAlert}
          change="Probing recovery"
          changeType={halfOpenCount > 0 ? "neutral" : "positive"}
        />
        <StatCard
          title="Closed"
          value={String(closedCount)}
          icon={ShieldCheck}
          change="Normal operation"
          changeType="positive"
        />
        <StatCard
          title="Tripped Today"
          value={String(trippedToday)}
          icon={Ban}
          change="State → OPEN events"
          changeType={trippedToday > 0 ? "negative" : "neutral"}
        />
      </div>

      {/* Per-breaker cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {snapshots.map((snap) => (
          <Card key={snap.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {stateIcon(snap.state)}
                  <span className="font-mono text-sm">{snap.id}</span>
                </div>
                <StatusBadge status={stateToVariant(snap.state)} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Failures</p>
                  <p
                    className={`font-mono font-medium ${snap.failureCount > 0 ? "text-primary" : "text-success"}`}
                  >
                    {snap.failureCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Calls</p>
                  <p className="font-mono font-medium">{snap.totalCalls.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rejected</p>
                  <p
                    className={`font-mono font-medium ${snap.rejectedCalls > 0 ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {snap.rejectedCalls}
                  </p>
                </div>
              </div>

              {snap.state !== "closed" && (
                <div className="rounded-md bg-muted/50 p-2 text-xs space-y-1">
                  {snap.openedAt && (
                    <p className="text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Opened: {new Date(snap.openedAt).toLocaleTimeString()}
                    </p>
                  )}
                  {snap.retryAfter && snap.state === "open" && (
                    <p className="text-muted-foreground">
                      Retry in:{" "}
                      <span className="font-medium text-foreground">
                        {formatRetryAfter(snap.retryAfter)}
                      </span>
                    </p>
                  )}
                  {snap.lastError && (
                    <p className="text-muted-foreground truncate">Error: {snap.lastError}</p>
                  )}
                </div>
              )}

              {snap.state !== "closed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={resetting === snap.id}
                  onClick={() => handleReset(snap.id)}
                >
                  {resetting === snap.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1 h-3 w-3" />
                  )}
                  {resetting === snap.id ? "Resetting…" : "Force Reset"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event log table */}
      <DataTable
        title="State Change Events"
        columns={[
          {
            header: "Circuit",
            accessorKey: "circuitId",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.circuitId}</span>,
          },
          {
            header: "From",
            accessorKey: "from",
            cell: ({ row }) => <StatusBadge status={stateToVariant(row.original.from)} />,
          },
          {
            header: "To",
            accessorKey: "to",
            cell: ({ row }) => <StatusBadge status={stateToVariant(row.original.to)} />,
          },
          { header: "Reason", accessorKey: "reason" },
          { header: "Time", accessorKey: "timestampStr" },
        ]}
        data={tableRows}
      />
    </div>
  );
}

export default AdminCircuitBreakersPage;