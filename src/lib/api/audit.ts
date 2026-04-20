// Immutable, append-only audit log (in-memory, max 10 000 entries)
// In production, stream to an external immutable log store.

export interface AuditEntry {
  id: string;
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  ip: string;
  userAgent: string;
  status: number;
  latencyMs: number;
  action?: string;
  resource?: string;
}

const MAX_ENTRIES = 10_000;
const log: AuditEntry[] = [];

export function appendAuditEntry(entry: AuditEntry): void {
  log.push(Object.freeze({ ...entry }));
  if (log.length > MAX_ENTRIES) log.shift();
}

export function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
}): { entries: AuditEntry[]; total: number } {
  let filtered = log.slice().reverse(); // newest-first

  if (params.userId) {
    filtered = filtered.filter((e) => e.userId === params.userId);
  }
  if (params.action) {
    filtered = filtered.filter((e) => e.action?.includes(params.action!));
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const start = (page - 1) * limit;

  return { entries: filtered.slice(start, start + limit), total: filtered.length };
}
