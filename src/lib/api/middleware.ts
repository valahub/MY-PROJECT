// Request middleware helpers: auth extraction, rate-limit guard, audit logging
import { verifyJwt } from "./jwt";
import { checkRateLimit, getRateLimitKey } from "./rate-limit";
import { unauthorized, tooManyRequests, forbidden, internalError } from "./response";
import { appendAuditEntry } from "./audit";
import type { AuthContext, RequestContext, Role } from "./types";
import { canAccess, type Permission } from "./rbac";
import { store } from "./store";

// ── Context builder ───────────────────────────────────────────────────────────

export function getRequestContext(request: Request): RequestContext {
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";

  return {
    requestId: crypto.randomUUID(),
    ip,
    userAgent: request.headers.get("User-Agent") ?? "unknown",
    startTime: Date.now(),
  };
}

// ── Auth extraction ───────────────────────────────────────────────────────────

export async function extractAuth(request: Request): Promise<AuthContext | null> {
  // 1. Bearer JWT
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyJwt(token);
    if (payload?.type === "access" && !store.revokedTokens.has(payload.jti)) {
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role as Role,
          merchantId: payload.merchantId,
        },
        tokenId: payload.jti,
      };
    }
    return null;
  }

  // 2. API key
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey) {
    const keyId = store.apiKeysByKey.get(apiKey);
    if (keyId) {
      const keyRecord = store.apiKeys.get(keyId);
      if (keyRecord?.active) {
        const user = store.users.get(keyRecord.userId);
        if (user) {
          keyRecord.lastUsedAt = new Date().toISOString();
          return {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              merchantId: user.merchantId,
            },
            tokenId: keyRecord.id,
          };
        }
      }
    }
  }

  return null;
}

// ── Permission guard ──────────────────────────────────────────────────────────

export interface GuardResult {
  auth: AuthContext | null;
  error?: Response;
}

export interface GuardOptions {
  permission?: Permission;
  rateLimitPreset?: "default" | "auth" | "payment" | "admin";
}

export async function guard(
  request: Request,
  ctx: RequestContext,
  options: GuardOptions = {},
): Promise<GuardResult> {
  const { permission, rateLimitPreset = "default" } = options;

  // Rate limit
  const apiKey = request.headers.get("X-API-Key") ?? undefined;
  const rlKey = getRateLimitKey(ctx.ip, apiKey);
  const rl = checkRateLimit(rlKey, rateLimitPreset);
  if (!rl.allowed) return { auth: null, error: tooManyRequests(rl.retryAfter) };

  // Auth
  const auth = await extractAuth(request);

  // Permission check
  if (permission && !canAccess(auth?.user.role, permission)) {
    return { auth, error: auth ? forbidden() : unauthorized() };
  }

  return { auth };
}

// ── Audit wrapper ─────────────────────────────────────────────────────────────

export async function withAudit(
  request: Request,
  ctx: RequestContext,
  auth: AuthContext | null,
  handler: () => Promise<Response>,
  action?: string,
  resource?: string,
): Promise<Response> {
  let response: Response;
  try {
    response = await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    response = internalError(msg);
  }

  appendAuditEntry({
    id: crypto.randomUUID(),
    requestId: ctx.requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    userId: auth?.user.id,
    userEmail: auth?.user.email,
    role: auth?.user.role,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    status: response.status,
    latencyMs: Date.now() - ctx.startTime,
    action,
    resource,
  });

  return response;
}
