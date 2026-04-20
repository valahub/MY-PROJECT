
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useHealthMonitor } from "@/hooks/use-health-monitor";
import { healthCheckManager, DEFAULT_SERVICES, type HealthRecord } from "@/lib/health-check";
import { recoveryOrchestrator, type RecoveryAuditEntry } from "@/lib/recovery-policy";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Radio,
  Loader2,
} from "lucide-react";

({
  component: AdminSystemHealthPage,
  head: () => ({ meta: [{ title: "System Health — Admin — ERP Vala" }] }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusToVariant(status: string): string {
  switch (status) {
    case "healthy":
      return "active";
    case "latency_spike":
      return "pending";
    case "degraded":
      return "past_due";
    case "down":
      return "blocked";
    default:
      return "inactive";
  }
}

function latencyColor(ms: number): string {
  if (ms < 0) return "text-muted-foreground";
  if (ms < 300) return "text-success";
  if (ms < 800) return "text-accent";
  return "text-destructive";
}

function uptimeColor(fraction: number): string {
  if (fraction >= 0.999) return "text-success";
  if (fraction >= 0.99) return "text-accent";
  return "text-primary";
}

function formatUptime(fraction: number): string {
  return `${(fraction * 100).toFixed(2)} %`;
}

function categoryIcon(category: string) {
  switch (category) {
    case "api":
      return <Zap className="h-4 w-4" />;
    case "database":
      return <Activity className="h-4 w-4" />;
    case "queue":
      return <Radio className="h-4 w-4" />;
    case "payments":
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

// ── Sparkline (simple bar strip) ─────────────────────────────────────────────

function LatencySparkline({ history }: { history: number[] }) {
  if (history.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const max = Math.max(...history);
  return (
    <div className="flex items-end gap-0.5 h-5">
      {history.slice(-12).map((v, i) => {
        const pct = max > 0 ? v / max : 0;
        const h = Math.max(2, Math.round(pct * 20));
        const color = v > 800 ? "bg-primary" : v > 300 ? "bg-accent" : "bg-success";
        return <div key={i} className={`w-1 rounded-sm ${color}`} style={{ height: `${h}px` }} />;
      })}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

function AdminSystemHealthPage() {
  const { records, counts } = useHealthMonitor();
  const [recentEvents, setRecentEvents] = useState<RecoveryAuditEntry[]>([]);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [isForcePolling, setIsForcePolling] = useState(false);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = recoveryOrchestrator.subscribe((entry) => {
      setRecentEvents((prev) => [entry, ...prev].slice(0, 20));
    });
    return unsub;
  }, []);

  const handleForcePoll = useCallback(async () => {
    setIsForcePolling(true);
    try {
      DEFAULT_SERVICES.forEach((s) => healthCheckManager.startMonitoring(s.id));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Force poll completed");
    } catch (error) {
      toast.error("Failed to force poll");
    } finally {
      setIsForcePolling(false);
    }
  }, []);

  const handleManualHeal = useCallback(async (serviceId: string) => {
    setTriggering(serviceId);
    try {
      const record = healthCheckManager.getRecord(serviceId);
      if (!record) return;
      const triggerType =
        record.status === "down"
          ? "service_down"
          : record.status === "degraded"
            ? "service_degraded"
            : "latency_spike";
      await recoveryOrchestrator.trigger(triggerType, serviceId);
    } finally {
      setTriggering(null);
    }
  }, []);

  const handleEscalate = useCallback(async (serviceId: string) => {
    setEscalatingId(serviceId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Service ${serviceId} escalated`);
    } catch (error) {
      toast.error("Failed to escalate");
    } finally {
      setEscalatingId(null);
    }
  }, []);

  const servicesTotal = DEFAULT_SERVICES.length;
  const servicesUp = counts.healthy + counts.latency_spike;
  const avgLatency =
    records.size > 0
      ? Math.round(
          Array.from(records.values())
            .filter((r) => r.latencyMs > 0)
            .reduce((acc, r) => acc + r.latencyMs, 0) /
            Math.max(1, Array.from(records.values()).filter((r) => r.latencyMs > 0).length),
        )
      : 0;
  const incidentCount = counts.down + counts.degraded;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForcePoll}
            disabled={isForcePolling}
          >
            {isForcePolling ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isForcePolling ? "Polling..." : "Force Poll"}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Services Up"
          value={`${servicesUp} / ${servicesTotal}`}
          icon={CheckCircle2}
          change={counts.down > 0 ? `${counts.down} down` : "All operational"}
          changeType={counts.down > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Avg Latency"
          value={avgLatency > 0 ? `${avgLatency} ms` : "—"}
          icon={Clock}
          change={avgLatency > 500 ? "Above threshold" : "Within SLO"}
          changeType={avgLatency > 500 ? "negative" : "positive"}
        />
        <StatCard
          title="Active Incidents"
          value={String(incidentCount)}
          icon={AlertTriangle}
          change={incidentCount === 0 ? "No incidents" : "Needs attention"}
          changeType={incidentCount === 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Auto-Fixes Today"
          value={String(recentEvents.filter((e) => e.outcome === "success").length)}
          icon={Activity}
          change="Via recovery policies"
          changeType="neutral"
        />
      </div>

      {/* Per-service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {DEFAULT_SERVICES.map((svc) => {
          const record: HealthRecord = records.get(svc.id) ?? {
            serviceId: svc.id,
            status: "unknown",
            latencyMs: -1,
            lastChecked: null,
            consecutiveFailures: 0,
            message: "Awaiting first heartbeat",
            uptimeFraction: 1,
            latencyHistory: [],
          };
          const isHealing = triggering === svc.id;

          return (
            <Card key={svc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    {categoryIcon(svc.category)}
                    {svc.name}
                  </div>
                  <StatusBadge status={statusToVariant(record.status)} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{record.message}</p>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Latency</p>
                    <p className={`font-mono font-medium ${latencyColor(record.latencyMs)}`}>
                      {record.latencyMs >= 0 ? `${record.latencyMs} ms` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className={`font-mono font-medium ${uptimeColor(record.uptimeFraction)}`}>
                      {formatUptime(record.uptimeFraction)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failures</p>
                    <p
                      className={`font-mono font-medium ${record.consecutiveFailures > 0 ? "text-primary" : "text-success"}`}
                    >
                      {record.consecutiveFailures}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Latency (last 12 checks)</p>
                  <LatencySparkline history={record.latencyHistory} />
                </div>

                {svc.slo && (
                  <div className="rounded-md bg-muted/50 p-2 text-xs space-y-0.5">
                    <p className="font-medium">SLO</p>
                    <p className="text-muted-foreground">
                      Uptime target: {(svc.slo.uptimeFraction * 100).toFixed(2)} % · p50 ≤{" "}
                      {svc.slo.latencyP50Ms} ms · p95 ≤ {svc.slo.latencyP95Ms} ms
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {record.status !== "healthy" && record.status !== "unknown" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isHealing}
                      onClick={() => handleManualHeal(svc.id)}
                    >
                      {isHealing ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Healing…
                        </>
                      ) : (
                        <>
                          <Zap className="mr-1 h-3 w-3" />
                          Trigger Recovery
                        </>
                      )}
                    </Button>
                  )}
                  {record.status === "down" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      disabled={escalatingId === svc.id}
                      onClick={() => handleEscalate(svc.id)}
                    >
                      {escalatingId === svc.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {escalatingId === svc.id ? "Escalating..." : "Escalate"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recovery event feed */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Recovery Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between rounded-lg border p-3 text-xs gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.policyLabel}</p>
                    <p className="text-muted-foreground truncate">{e.message}</p>
                    <p className="text-muted-foreground mt-0.5">
                      Service: <span className="font-mono">{e.serviceId}</span> · action:{" "}
                      <span className="font-mono">{e.action}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={e.outcome} />
                    <span className="text-muted-foreground">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
