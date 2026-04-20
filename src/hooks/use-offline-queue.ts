// useOfflineQueue — React bindings for the offline queue
//
// Surfaces queue state and online/offline status as React state, so components
// can show "X pending actions" banners and trigger a flush when the device
// comes back online.

import { useState, useEffect, useCallback } from "react";
import { offlineQueue, type QueuedAction } from "@/lib/offline-queue";

export interface UseOfflineQueueReturn {
  /** Current snapshot of all queued actions */
  queue: QueuedAction[];
  /** True when navigator.onLine is true */
  isOnline: boolean;
  /** Number of pending actions */
  pendingCount: number;
  /** Add an action to the queue */
  enqueue: (action: Omit<QueuedAction, "id" | "enqueuedAt" | "attempts">) => QueuedAction;
  /** Flush the queue using the provided processor */
  flush: (processor: (a: QueuedAction) => Promise<void>) => Promise<void>;
  /** Clear all queued actions */
  clear: () => void;
  /** Refresh the queue snapshot from storage */
  refresh: () => void;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<QueuedAction[]>(() => offlineQueue.getQueue());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const refresh = useCallback((): void => {
    setQueue(offlineQueue.getQueue());
  }, []);

  useEffect(() => {
    const onOnline = (): void => {
      setIsOnline(true);
      refresh();
    };
    const onOffline = (): void => {
      setIsOnline(false);
      refresh();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    refresh();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  const enqueue = useCallback(
    (action: Omit<QueuedAction, "id" | "enqueuedAt" | "attempts">): QueuedAction => {
      const record = offlineQueue.enqueue(action);
      refresh();
      return record;
    },
    [refresh],
  );

  const flush = useCallback(
    async (processor: (a: QueuedAction) => Promise<void>): Promise<void> => {
      await offlineQueue.flush(processor);
      refresh();
    },
    [refresh],
  );

  const clear = useCallback((): void => {
    offlineQueue.clear();
    refresh();
  }, [refresh]);

  return { queue, isOnline, pendingCount: queue.length, enqueue, flush, clear, refresh };
}
