// useHealthMonitor — React hook that subscribes to the healthCheckManager,
// starts monitoring all registered services on mount, and exposes the current
// health records as component state.
//
// Usage:
//   const { records, isAnyDown, isDegraded } = useHealthMonitor();

import { useEffect, useState, useCallback } from "react";
import {
  healthCheckManager,
  DEFAULT_SERVICES,
  type HealthRecord,
  type HealthStatus,
} from "@/lib/health-check";

export interface UseHealthMonitorResult {
  /** Latest health record for every registered service (map by serviceId) */
  records: Map<string, HealthRecord>;
  /** True if any service is currently "down" */
  isAnyDown: boolean;
  /** True if any service is currently "degraded" or "latency_spike" */
  isAnyDegraded: boolean;
  /** Convenience: number of services in each status category */
  counts: Record<HealthStatus | "unknown", number>;
  /** Manually force a re-read of all current records */
  refresh: () => void;
}

export function useHealthMonitor(): UseHealthMonitorResult {
  const [records, setRecords] = useState<Map<string, HealthRecord>>(() => {
    const map = new Map<string, HealthRecord>();
    healthCheckManager.getAllRecords().forEach((r) => map.set(r.serviceId, r));
    return map;
  });

  const refresh = useCallback(() => {
    const map = new Map<string, HealthRecord>();
    healthCheckManager.getAllRecords().forEach((r) => map.set(r.serviceId, r));
    setRecords(new Map(map));
  }, []);

  useEffect(() => {
    // Start monitoring all default services if not already running
    DEFAULT_SERVICES.forEach((s) => healthCheckManager.startMonitoring(s.id));

    // Subscribe to status-change events
    const unsubscribe = healthCheckManager.subscribe((event) => {
      setRecords((prev) => {
        const next = new Map(prev);
        next.set(event.serviceId, event.currentStatus);
        return next;
      });
    });

    // Initial snapshot
    refresh();

    return () => {
      unsubscribe();
      // We intentionally do NOT stopAll() on unmount — the manager should keep
      // running in the background for the lifetime of the admin session.
    };
  }, [refresh]);

  const counts: Record<HealthStatus | "unknown", number> = {
    healthy: 0,
    degraded: 0,
    down: 0,
    latency_spike: 0,
    unknown: 0,
  };
  let isAnyDown = false;
  let isAnyDegraded = false;

  for (const record of records.values()) {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    if (record.status === "down") isAnyDown = true;
    if (record.status === "degraded" || record.status === "latency_spike") isAnyDegraded = true;
  }

  return { records, isAnyDown, isAnyDegraded, counts, refresh };
}
