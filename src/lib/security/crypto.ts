import type { PasswordHashRecord } from "./types";

const encoder = new TextEncoder();

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

export function randomId(prefix: string): string {
  return `${prefix}_${bytesToBase64Url(randomBytes(16))}`;
}

export function randomToken(bytes = 32): string {
  return bytesToBase64Url(randomBytes(bytes));
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashPassword(
  password: string,
  salt: string = bytesToBase64Url(randomBytes(16)),
): Promise<PasswordHashRecord> {
  const iterations = 310_000;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(base64UrlToBytes(salt)),
      iterations,
    },
    keyMaterial,
    256,
  );

  return {
    algorithm: "pbkdf2-sha256",
    iterations,
    salt,
    hash: bytesToBase64Url(new Uint8Array(bits)),
  };
}

export async function verifyPassword(
  password: string,
  record: PasswordHashRecord,
): Promise<boolean> {
  const computed = await hashPassword(password, record.salt);
  return computed.hash === record.hash && computed.iterations === record.iterations;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptAesGcm(plaintext: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoder.encode(plaintext),
  );
  const payload = new Uint8Array(iv.length + encrypted.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(encrypted), iv.length);
  return bytesToBase64Url(payload);
}

export async function decryptAesGcm(cipherText: string, secret: string): Promise<string> {
  const payload = base64UrlToBytes(cipherText);
  const iv = payload.slice(0, 12);
  const encrypted = payload.slice(12);
  const key = await deriveAesKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encrypted),
  );
  return new TextDecoder().decode(decrypted);
}

export async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifyHmacSha256(
  message: string,
  secret: string,
  signature: string,
): Promise<boolean> {
  const expected = await hmacSha256(message, secret);
  return expected === signature;
}

export async function signJwt(payload: object, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = bytesToBase64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(signingInput, secret);
  return `${signingInput}.${signature}`;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Uint8Array {
  const cleaned = base32.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

async function totpCodeForWindow(secret: string, counter: number, digits: number): Promise<string> {
  const keyBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(4, counter, false);

  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  const otp = binCode % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}

export async function verifyTotpCode(
  secret: string,
  code: string,
  periodSeconds = 30,
  allowedWindow = 1,
): Promise<boolean> {
  const nowCounter = Math.floor(Date.now() / 1000 / periodSeconds);
  const normalizedCode = code.trim();
  for (let offset = -allowedWindow; offset <= allowedWindow; offset += 1) {
    const candidate = await totpCodeForWindow(secret, nowCounter + offset, 6);
    if (candidate === normalizedCode) return true;
  }
  return false;
}
