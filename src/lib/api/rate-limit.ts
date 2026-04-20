// Token-bucket rate limiter (in-memory, per worker instance)
// In production, use Cloudflare KV / Durable Objects for distributed limiting.

interface Bucket {
  tokens: number;
  lastRefill: number; // seconds
}

const buckets = new Map<string, Bucket>();

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens/second
}

const PRESETS: Record<string, RateLimitConfig> = {
  default: { maxTokens: 60, refillRate: 1 }, // 60/min
  auth: { maxTokens: 10, refillRate: 0.167 }, // 10/min
  payment: { maxTokens: 20, refillRate: 0.333 }, // 20/min
  admin: { maxTokens: 120, refillRate: 2 }, // 120/min
};

export function checkRateLimit(
  key: string,
  preset: keyof typeof PRESETS = "default",
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const cfg = PRESETS[preset];
  const now = Date.now() / 1000;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: cfg.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  const refilled = Math.min(cfg.maxTokens, bucket.tokens + elapsed * cfg.refillRate);
  bucket.lastRefill = now;

  if (refilled < 1) {
    bucket.tokens = refilled; // still update tokens so refill math stays accurate
    const retryAfter = Math.ceil((1 - refilled) / cfg.refillRate);
    return { allowed: false, remaining: 0, retryAfter };
  }

  bucket.tokens = refilled - 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}

export function getRateLimitKey(ip: string, apiKey?: string): string {
  return apiKey ? `ak:${apiKey.slice(-8)}` : `ip:${ip}`;
}
