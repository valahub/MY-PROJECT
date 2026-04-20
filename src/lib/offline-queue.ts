// Offline Queue
// Persists user-triggered actions to localStorage when the device is offline
// (or when an API call fails due to connectivity).  When the device comes back
// online the queue can be flushed by calling `offlineQueue.flush()`.
//
// Conflict resolution strategies:
//   last-write-wins — keep retrying; update the attempt counter each time
//   server-wins     — discard the queued action on any error
//   fail            — remove the action and invoke the conflict callback

export type ConflictStrategy = "last-write-wins" | "server-wins" | "fail";

export interface QueuedAction {
  id: string;
  actionType: string;
  payload: unknown;
  idempotencyKey?: string;
  enqueuedAt: number;
  attempts: number;
  conflictStrategy: ConflictStrategy;
}

const STORAGE_KEY = "vala_offline_queue";

function generateId(): string {
  // crypto.randomUUID is available in modern browsers + Workers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function load(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(queue: QueuedAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage quota exceeded — drop the oldest item and retry once
    const trimmed = queue.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export const offlineQueue = {
  /** Add an action to the queue. Deduplicates by idempotency key if provided. */
  enqueue(action: Omit<QueuedAction, "id" | "enqueuedAt" | "attempts">): QueuedAction {
    const queue = load();
    const filtered = action.idempotencyKey
      ? queue.filter((q) => q.idempotencyKey !== action.idempotencyKey)
      : queue;
    const record: QueuedAction = {
      ...action,
      id: generateId(),
      enqueuedAt: Date.now(),
      attempts: 0,
    };
    filtered.push(record);
    save(filtered);
    return record;
  },

  /** Remove a single item by id. */
  dequeue(id: string): void {
    save(load().filter((q) => q.id !== id));
  },

  /** Return a snapshot of the current queue. */
  getQueue(): QueuedAction[] {
    return load();
  },

  /** Returns true when the queue contains at least one item. */
  hasPending(): boolean {
    return load().length > 0;
  },

  /**
   * Process each queued action in order.
   * @param processor  Async handler for a single action; should throw on failure.
   * @param onConflict Called when a `fail` strategy action errors.
   */
  async flush(
    processor: (action: QueuedAction) => Promise<void>,
    onConflict?: (action: QueuedAction, error: unknown) => void,
  ): Promise<void> {
    if (!navigator.onLine) return;

    const queue = load();
    for (const action of queue) {
      try {
        await processor(action);
        this.dequeue(action.id);
      } catch (err) {
        switch (action.conflictStrategy) {
          case "last-write-wins":
            save(
              load().map((item) =>
                item.id === action.id ? { ...item, attempts: item.attempts + 1 } : item,
              ),
            );
            break;
          case "server-wins":
            this.dequeue(action.id);
            break;
          case "fail":
            this.dequeue(action.id);
            onConflict?.(action, err);
            break;
        }
      }
    }
  },

  /** Remove all queued items. */
  clear(): void {
    save([]);
  },
};

// Suppress unused import warning — uuid is not actually imported above since
// we use crypto.randomUUID directly.
