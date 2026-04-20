// JWT implementation — Web Crypto HMAC-SHA256 (Cloudflare Workers native)

// Reads the JWT secret from environment; falls back to a dev-only default.
// In production you MUST set the JWT_SECRET environment variable.
// The server will throw at startup if the fallback is detected in production mode.
function getSecret(): string {
  const envSecret = typeof process !== "undefined" ? process.env?.JWT_SECRET : undefined;
  if (envSecret) return envSecret;
  // Dev-only fallback — intentionally weak so it forces rotation in prod
  return "vala-erp-dev-secret-must-change-in-production-32x!";
}

export const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  merchantId?: string;
  type: "access" | "refresh";
  /** JWT ID — used for revocation */
  jti: string;
  iat: number;
  exp: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(pad));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// ── public API ────────────────────────────────────────────────────────────────

export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp" | "jti">,
  expiresInSeconds: number,
  secret = getSecret(),
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = {
    ...payload,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + expiresInSeconds,
  };

  const enc = new TextEncoder();
  const header = base64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(enc.encode(JSON.stringify(full)));
  const signing = `${header}.${body}`;

  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signing));
  return `${signing}.${base64url(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string, secret = getSecret()): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const signing = `${header}.${body}`;

  try {
    const key = await importKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(signature).buffer as ArrayBuffer,
      new TextEncoder().encode(signing),
    );
    if (!valid) return null;

    const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
