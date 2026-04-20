import type { ActiveAuthState, SecurityState } from "./types";

const SECURITY_STATE_KEY = "erp-vala.security-state.v1";
const ACTIVE_AUTH_KEY = "erp-vala.active-auth.v1";

const INITIAL_STATE: SecurityState = {
  version: 1,
  users: [],
  sessions: [],
  emailVerificationTokens: [],
  passwordResetTokens: [],
  apiKeys: [],
  rateLimits: [],
  blockedIps: [],
  idempotency: [],
  consentLogs: [],
  auditEvents: [],
};

let cachedState: SecurityState | null = null;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  listeners.forEach((listener) => listener());
}

function resetSecurityState(): SecurityState {
  const cleanState = structuredClone(INITIAL_STATE);
  cachedState = cleanState;
  if (canUseStorage()) {
    localStorage.setItem(SECURITY_STATE_KEY, JSON.stringify(cleanState));
  }
  return cleanState;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeSecurityState(value: unknown): SecurityState | null {
  if (!isObject(value)) return null;

  return {
    version: typeof value.version === "number" ? value.version : INITIAL_STATE.version,
    users: Array.isArray(value.users) ? value.users : [],
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    emailVerificationTokens: Array.isArray(value.emailVerificationTokens)
      ? value.emailVerificationTokens
      : [],
    passwordResetTokens: Array.isArray(value.passwordResetTokens) ? value.passwordResetTokens : [],
    apiKeys: Array.isArray(value.apiKeys) ? value.apiKeys : [],
    rateLimits: Array.isArray(value.rateLimits) ? value.rateLimits : [],
    blockedIps: Array.isArray(value.blockedIps) ? value.blockedIps : [],
    idempotency: Array.isArray(value.idempotency) ? value.idempotency : [],
    consentLogs: Array.isArray(value.consentLogs) ? value.consentLogs : [],
    auditEvents: Array.isArray(value.auditEvents) ? value.auditEvents : [],
  };
}

function isValidActiveAuth(value: unknown): value is ActiveAuthState {
  return (
    isObject(value) &&
    typeof value.userId === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.refreshToken === "string"
  );
}

export function readSecurityState(): SecurityState {
  if (cachedState) return cachedState;
  if (!canUseStorage()) {
    cachedState = structuredClone(INITIAL_STATE);
    return cachedState;
  }

  try {
    const raw = localStorage.getItem(SECURITY_STATE_KEY);
    if (!raw) {
      return resetSecurityState();
    }

    const parsed = sanitizeSecurityState(JSON.parse(raw));
    if (!parsed) {
      localStorage.removeItem(ACTIVE_AUTH_KEY);
      return resetSecurityState();
    }

    cachedState = parsed;
    return cachedState;
  } catch {
    localStorage.removeItem(ACTIVE_AUTH_KEY);
    return resetSecurityState();
  }
}

export function writeSecurityState(nextState: SecurityState): void {
  cachedState = sanitizeSecurityState(nextState) ?? structuredClone(INITIAL_STATE);
  if (canUseStorage()) {
    localStorage.setItem(SECURITY_STATE_KEY, JSON.stringify(cachedState));
  }
  notify();
}

export function mutateSecurityState(mutator: (state: SecurityState) => void): SecurityState {
  const draft = structuredClone(readSecurityState());
  mutator(draft);
  writeSecurityState(draft);
  return draft;
}

export function readActiveAuth(): ActiveAuthState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(ACTIVE_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidActiveAuth(parsed)) {
      localStorage.removeItem(ACTIVE_AUTH_KEY);
      return null;
    }

    const state = readSecurityState();
    const hasUser = state.users.some((user) => user.id === parsed.userId);
    const hasSession = state.sessions.some((session) => session.id === parsed.sessionId);
    if (!hasUser || !hasSession) {
      localStorage.removeItem(ACTIVE_AUTH_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(ACTIVE_AUTH_KEY);
    return null;
  }
}

export function writeActiveAuth(value: ActiveAuthState | null): void {
  if (!canUseStorage()) return;
  if (value === null) {
    localStorage.removeItem(ACTIVE_AUTH_KEY);
  } else {
    localStorage.setItem(ACTIVE_AUTH_KEY, JSON.stringify(value));
  }
  notify();
}

export function subscribeSecurityStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
