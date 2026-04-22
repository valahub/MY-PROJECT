// Detects repeated login failures within a time window.
// Behaviour:
//   - Track failures keyed by identifier (email).
//   - When threshold reached within window → trigger one auto-recovery (clear
//     corrupt session + retry hook), then lockdown for `lockoutMs`.

import { authHealer } from "./auth-healer";
import { supabase } from "@/integrations/supabase/client";

interface LoopState {
  failures: number[]; // timestamps (ms)
  lockedUntil: number; // 0 = not locked
  recoveredOnce: boolean;
}

const STORAGE_KEY = "auth_login_loop_v1";
const WINDOW_MS = 60_000; // 1 minute
const THRESHOLD = 4; // failures in window before action
const LOCKOUT_MS = 30_000; // 30s soft-lock

function readAll(): Record<string, LoopState> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, LoopState>) : {};
  } catch {
    return {};
  }
}

function writeAll(state: Record<string, LoopState>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function keyFor(identifier: string): string {
  return identifier.trim().toLowerCase() || "_anon";
}

function getState(identifier: string): LoopState {
  const all = readAll();
  return (
    all[keyFor(identifier)] ?? {
      failures: [],
      lockedUntil: 0,
      recoveredOnce: false,
    }
  );
}

function saveState(identifier: string, state: LoopState): void {
  const all = readAll();
  all[keyFor(identifier)] = state;
  writeAll(all);
}

export interface LoopCheckResult {
  locked: boolean;
  retryAfterMs: number;
  failures: number;
  /** True if caller should attempt a one-shot recovery flow before retrying. */
  shouldRecover: boolean;
}

export const loginLoopDetector = {
  check(identifier: string): LoopCheckResult {
    const now = Date.now();
    const state = getState(identifier);
    if (state.lockedUntil > now) {
      return {
        locked: true,
        retryAfterMs: state.lockedUntil - now,
        failures: state.failures.length,
        shouldRecover: false,
      };
    }
    return {
      locked: false,
      retryAfterMs: 0,
      failures: state.failures.filter((t) => now - t < WINDOW_MS).length,
      shouldRecover: false,
    };
  },

  /** Record a failed login attempt. Returns next-step guidance. */
  recordFailure(identifier: string, reason?: string): LoopCheckResult {
    const now = Date.now();
    const state = getState(identifier);
    // prune
    state.failures = state.failures.filter((t) => now - t < WINDOW_MS);
    state.failures.push(now);
    authHealer.log("token_refresh_failed", reason ?? "login_failed", {
      identifier: keyFor(identifier),
      failuresInWindow: state.failures.length,
    });

    let shouldRecover = false;
    if (state.failures.length >= THRESHOLD) {
      if (!state.recoveredOnce) {
        // Trigger one-shot recovery hint; caller decides what to do.
        state.recoveredOnce = true;
        shouldRecover = true;
        authHealer.log(
          "recover_invoked",
          "login-loop threshold reached — one-shot recovery hint",
          { identifier: keyFor(identifier), failures: state.failures.length },
        );
      } else {
        // Already recovered once and still failing → lock down.
        state.lockedUntil = now + LOCKOUT_MS;
        authHealer.log("permission_denied", "login lockout engaged", {
          identifier: keyFor(identifier),
          lockoutMs: LOCKOUT_MS,
        });
      }
    }
    saveState(identifier, state);
    return {
      locked: state.lockedUntil > now,
      retryAfterMs: Math.max(0, state.lockedUntil - now),
      failures: state.failures.length,
      shouldRecover,
    };
  },

  /** Run safe corruption purge + sign-out so the next login starts clean. */
  async performRecovery(): Promise<void> {
    try {
      authHealer.purgeCorruptStorage();
      await supabase.auth.signOut({ scope: "local" });
      authHealer.log("session_cleared", "login-loop one-shot recovery executed");
    } catch (err) {
      authHealer.log(
        "recover_failed",
        err instanceof Error ? err.message : "performRecovery threw",
      );
    }
  },

  reset(identifier: string): void {
    const all = readAll();
    delete all[keyFor(identifier)];
    writeAll(all);
  },
};
