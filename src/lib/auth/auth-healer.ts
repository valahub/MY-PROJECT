// Auth self-healing core: audit trail + safe recovery helpers.
// Pure logic module — no UI. Safe to import from contexts/components/hooks.

import { supabase } from "@/integrations/supabase/client";

export type AuthEventKind =
  | "session_loaded"
  | "session_missing"
  | "session_corrupt"
  | "session_cleared"
  | "token_refreshed"
  | "token_refresh_failed"
  | "signed_in"
  | "signed_out"
  | "roles_loaded"
  | "roles_failed"
  | "roles_retry"
  | "stuck_loading"
  | "recover_invoked"
  | "recover_success"
  | "recover_failed"
  | "permission_denied"
  | "redirect_fallback";

export interface AuthEvent {
  id: string;
  at: string;
  kind: AuthEventKind;
  message?: string;
  meta?: Record<string, unknown>;
}

const MAX_EVENTS = 500;
const STORAGE_KEY = "auth_healer_log_v1";

class AuthHealer {
  private events: AuthEvent[] = [];

  constructor() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.events = parsed.slice(0, MAX_EVENTS);
      }
    } catch {
      // ignore parse errors — start fresh
    }
  }

  private persist(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events.slice(0, MAX_EVENTS)));
      }
    } catch {
      // storage may be full / disabled
    }
  }

  log(kind: AuthEventKind, message?: string, meta?: Record<string, unknown>): AuthEvent {
    const evt: AuthEvent = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      kind,
      message,
      meta,
    };
    this.events.unshift(evt);
    if (this.events.length > MAX_EVENTS) this.events.length = MAX_EVENTS;
    this.persist();
    // Also surface to console for traceability
    if (kind === "session_corrupt" || kind === "recover_failed" || kind === "token_refresh_failed") {
      console.warn(`[auth-healer] ${kind}`, message ?? "", meta ?? "");
    }
    return evt;
  }

  list(limit = 100): AuthEvent[] {
    return this.events.slice(0, Math.max(1, Math.min(limit, MAX_EVENTS)));
  }

  /**
   * Best-effort safe recovery:
   *  1. Try a token refresh.
   *  2. If refresh fails, sign out locally (clears storage), so next render is a clean state.
   * Returns true if a usable session exists after the attempt.
   */
  async recover(): Promise<boolean> {
    this.log("recover_invoked");
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) {
        this.log("recover_success", "session refreshed");
        return true;
      }
      this.log("token_refresh_failed", error?.message);
    } catch (err) {
      this.log(
        "token_refresh_failed",
        err instanceof Error ? err.message : "unknown refresh error",
      );
    }
    try {
      await supabase.auth.signOut({ scope: "local" });
      this.log("session_cleared", "local session cleared after failed refresh");
      return false;
    } catch (err) {
      this.log("recover_failed", err instanceof Error ? err.message : "signOut failed");
      return false;
    }
  }

  /**
   * Detect obviously corrupt cached supabase session entries in localStorage and purge them.
   * Returns true if anything was purged.
   */
  purgeCorruptStorage(): boolean {
    if (typeof localStorage === "undefined") return false;
    let purged = false;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith("sb-") && !key.includes("supabase.auth")) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          JSON.parse(raw);
        } catch {
          localStorage.removeItem(key);
          purged = true;
          this.log("session_corrupt", `purged unparseable storage key`, { key });
        }
      }
    } catch {
      // ignore
    }
    return purged;
  }
}

export const authHealer = new AuthHealer();
