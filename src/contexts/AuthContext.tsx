import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authHealer } from "@/lib/auth/auth-healer";

export type AppRole =
  | "admin"
  | "merchant"
  | "author"
  | "customer"
  | "support"
  // Influencer module roles
  | "influencer"
  | "creator"
  | "brand"
  | "campaign_manager"
  | "influencer_admin"
  // Vala Builder module roles
  | "builder_user"
  | "builder_manager"
  | "builder_admin";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  recover: () => Promise<boolean>;
  hasRole: (role: AppRole) => boolean;
  primaryRole: AppRole | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "support",
  "merchant",
  "author",
  "influencer_admin",
  "campaign_manager",
  "brand",
  "creator",
  "influencer",
  "builder_admin",
  "builder_manager",
  "builder_user",
  "customer",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);

  // Self-healing role fetch with bounded retry/backoff.
  const fetchRoles = async (uid: string | undefined, attempt = 1): Promise<void> => {
    if (!uid) {
      if (mountedRef.current) setRoles([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) throw error;
      const next = (data ?? []).map((r) => r.role as AppRole);
      if (mountedRef.current) setRoles(next);
      authHealer.log("roles_loaded", undefined, { count: next.length });
    } catch (err) {
      authHealer.log("roles_failed", err instanceof Error ? err.message : String(err), {
        attempt,
      });
      if (attempt < 3) {
        const delay = 400 * attempt;
        authHealer.log("roles_retry", `retrying in ${delay}ms`, { attempt });
        setTimeout(() => {
          if (mountedRef.current) void fetchRoles(uid, attempt + 1);
        }, delay);
      } else if (mountedRef.current) {
        // Safe-deny fallback
        setRoles([]);
      }
    }
  };

  const recover = async (): Promise<boolean> => {
    const ok = await authHealer.recover();
    if (!ok) {
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setRoles([]);
      }
    }
    return ok;
  };

  useEffect(() => {
    mountedRef.current = true;

    // Purge unparseable cached supabase entries before initialising.
    authHealer.purgeCorruptStorage();

    // Safety watchdog: never get stuck on the loading splash.
    const stuckTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        authHealer.log("stuck_loading", "auth bootstrap exceeded 8s — forcing ready");
        setLoading(false);
      }
    }, 8_000);

    // Set listener FIRST (per Supabase guidance)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "TOKEN_REFRESHED") authHealer.log("token_refreshed");
      if (event === "SIGNED_IN") authHealer.log("signed_in", undefined, { uid: newSession?.user?.id });
      if (event === "SIGNED_OUT") authHealer.log("signed_out");

      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks inside the listener.
        setTimeout(() => {
          if (mountedRef.current) void fetchRoles(newSession.user.id);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    // Then check existing session — with corruption recovery.
    supabase.auth
      .getSession()
      .then(async ({ data: { session: existing }, error }) => {
        if (error) {
          authHealer.log("session_corrupt", error.message);
          await authHealer.recover();
          if (mountedRef.current) setLoading(false);
          return;
        }
        if (!mountedRef.current) return;
        setSession(existing);
        setUser(existing?.user ?? null);
        if (existing?.user) {
          authHealer.log("session_loaded", undefined, { uid: existing.user.id });
          void fetchRoles(existing.user.id).finally(() => {
            if (mountedRef.current) setLoading(false);
          });
        } else {
          authHealer.log("session_missing");
          setLoading(false);
        }
      })
      .catch(async (err) => {
        authHealer.log(
          "session_corrupt",
          err instanceof Error ? err.message : "getSession threw",
        );
        await authHealer.recover();
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
      clearTimeout(stuckTimer);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryRole =
    ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  const value: AuthContextValue = {
    session,
    user,
    roles,
    loading,
    primaryRole,
    hasRole: (role) => roles.includes(role),
    refreshRoles: () => fetchRoles(user?.id),
    recover,
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        authHealer.log("recover_failed", err instanceof Error ? err.message : "signOut failed");
        // Force-clear local state even if remote signOut fails.
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setRoles([]);
        }
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  support: "/support",
  merchant: "/merchant",
  author: "/author",
  customer: "/customer",
  influencer: "/influencer",
  creator: "/influencer",
  brand: "/influencer",
  campaign_manager: "/influencer",
  influencer_admin: "/influencer",
  builder_user: "/builder",
  builder_manager: "/builder",
  builder_admin: "/builder",
};
