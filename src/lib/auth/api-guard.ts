// Global API request wrapper.
// - Validates a live Supabase session before every authenticated call.
// - Optionally enforces a role/permission requirement.
// - On unauthorized: logs to authHealer and throws a 403-shaped error WITHOUT making the call.

import { supabase } from "@/integrations/supabase/client";
import { authHealer } from "./auth-healer";
import type { AppRole } from "@/contexts/AuthContext";
import type { PermissionVerb } from "./route-permissions";

export interface GuardedFetchOptions extends RequestInit {
  /** Skip auth entirely (use for genuinely public endpoints). */
  publicEndpoint?: boolean;
  /** Roles that may call this endpoint. Empty = any authenticated user. */
  requireRoles?: AppRole[];
  /** Permission verb used purely for audit metadata. */
  verb?: PermissionVerb;
  /** Logical resource name for audit metadata. */
  resource?: string;
}

export class ApiAuthorizationError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 403, code = "FORBIDDEN") {
    super(message);
    this.name = "ApiAuthorizationError";
    this.status = status;
    this.code = code;
  }
}

async function getRolesForUser(uid: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

/**
 * Wraps `fetch` with token + role validation.
 * Use this for any custom REST/edge call. Supabase JS SDK calls already enforce RLS server-side
 * but you can still call `assertAuthorized` before invoking them when you want consistent client-side
 * audit logs.
 */
export async function guardedFetch(input: RequestInfo | URL, options: GuardedFetchOptions = {}): Promise<Response> {
  const { publicEndpoint, requireRoles, verb, resource, headers, ...rest } = options;
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (!publicEndpoint) {
    await assertAuthorized({ requireRoles, verb, resource, url });
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const merged = new Headers(headers);
    if (token && !merged.has("Authorization")) merged.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...rest, headers: merged });
  }
  return fetch(input, { ...rest, headers });
}

export interface AssertOptions {
  requireRoles?: AppRole[];
  verb?: PermissionVerb;
  resource?: string;
  url?: string;
}

/** Throws ApiAuthorizationError(403) if session/role check fails. Logs every denial. */
export async function assertAuthorized(opts: AssertOptions = {}): Promise<void> {
  const { requireRoles, verb, resource, url } = opts;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    authHealer.log("permission_denied", "no_session", { url, verb, resource });
    throw new ApiAuthorizationError("Not authenticated", 401, "UNAUTHENTICATED");
  }

  if (!requireRoles || requireRoles.length === 0) return;

  let roles: AppRole[] = [];
  try {
    roles = await getRolesForUser(data.session.user.id);
  } catch (err) {
    authHealer.log("roles_failed", err instanceof Error ? err.message : "roles_lookup_failed", {
      url,
      verb,
      resource,
    });
    // Fail closed.
    throw new ApiAuthorizationError("Role lookup failed", 403, "FORBIDDEN");
  }

  const allowed = requireRoles.some((r) => roles.includes(r));
  if (!allowed) {
    authHealer.log("permission_denied", "role_mismatch", {
      url,
      verb,
      resource,
      have: roles,
      need: requireRoles,
    });
    throw new ApiAuthorizationError("Forbidden", 403, "FORBIDDEN");
  }
}
