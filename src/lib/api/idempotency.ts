// Idempotency key engine — safe replay for payment and checkout endpoints
// Keys expire after 24 h; duplicate requests receive the cached response.

interface IdempotencyRecord {
  key: string;
  status: number;
  body: string;
  headers: Record<string, string>;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const store = new Map<string, IdempotencyRecord>();

export function getIdempotencyRecord(key: string): IdempotencyRecord | undefined {
  const rec = store.get(key);
  if (!rec) return undefined;
  if (Date.now() - rec.createdAt > TTL_MS) {
    store.delete(key);
    return undefined;
  }
  return rec;
}

export async function saveIdempotencyRecord(key: string, response: Response): Promise<Response> {
  // Clone the response so both caller and storage get independent streams
  const clone = response.clone();
  const body = await clone.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });

  store.set(key, { key, status: response.status, body, headers, createdAt: Date.now() });
  return response;
}

export function replayIdempotencyResponse(rec: IdempotencyRecord): Response {
  return new Response(rec.body, {
    status: rec.status,
    headers: { ...rec.headers, "Idempotency-Replayed": "true" },
  });
}

export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key");
}
