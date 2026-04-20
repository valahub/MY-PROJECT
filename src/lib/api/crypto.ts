// Cryptographic utilities — all use the Web Crypto API (Cloudflare Workers native)

/**
 * Hash a password with PBKDF2-SHA256.
 * Returns "<saltHex>:<hashHex>" for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );

  return `${saltHex}:${toHex(new Uint8Array(bits))}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 * Also handles the lightweight "seeded" hashes used during store initialisation.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("seed:")) {
    // seed:<plain> — only used for the default seeded accounts in dev
    return stored === `seed:${password}`;
  }

  const [saltHex, expectedHash] = stored.split(":");
  if (!saltHex || !expectedHash) return false;

  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );

  return toHex(new Uint8Array(bits)) === expectedHash;
}

/** Generate a random API key with the given prefix. */
export function generateApiKey(prefix = "live_sk"): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `${prefix}_${toHex(bytes)}`;
}

/** Generate a 32-byte random secret for webhook signing. */
export function generateWebhookSecret(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** Generate an Envato-style license key: 8-4-4-4-12 uppercase hex blocks. */
export function generateLicenseKey(): string {
  const hex = toHex(crypto.getRandomValues(new Uint8Array(16))).toUpperCase();
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** HMAC-SHA256 sign a payload string with a secret. Returns hex digest. */
export async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(new Uint8Array(sig));
}

/** SHA-256 digest in lowercase hex. */
export async function sha256Hex(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return toHex(new Uint8Array(digest));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
}
