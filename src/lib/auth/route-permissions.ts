// Single source of truth: route-prefix → required AppRole(s) + permission verbs.
// Used by sidebar auto-sync, route guard, and API wrapper.

import type { AppRole } from "@/contexts/AuthContext";

export type PermissionVerb = "view" | "create" | "edit" | "delete" | "manage";

export interface RouteRule {
  /** Path prefix this rule applies to (longest match wins). */
  prefix: string;
  /** Roles allowed to access. Empty array means "deny all (except admin which is implicit)". */
  roles: AppRole[];
  /** Verbs implicitly granted to allowed roles on this route. */
  verbs?: PermissionVerb[];
}

// Order does NOT matter — matcher picks the longest matching prefix.
export const ROUTE_RULES: RouteRule[] = [
  // ── Admin section ───────────────────────────────────────────────────────────
  { prefix: "/admin/server", roles: ["admin", "support"], verbs: ["view", "manage"] },
  { prefix: "/admin/development", roles: ["admin"], verbs: ["view", "manage"] },
  { prefix: "/admin/auth-observability", roles: ["admin"], verbs: ["view"] },
  { prefix: "/admin/audit-logs", roles: ["admin", "support"], verbs: ["view"] },
  { prefix: "/admin/security", roles: ["admin"], verbs: ["view", "manage"] },
  { prefix: "/admin/secrets", roles: ["admin"], verbs: ["view", "edit"] },
  { prefix: "/admin/roles", roles: ["admin"], verbs: ["view", "edit", "manage"] },
  { prefix: "/admin", roles: ["admin"], verbs: ["view", "create", "edit", "delete", "manage"] },

  // ── Merchant section ────────────────────────────────────────────────────────
  { prefix: "/merchant", roles: ["merchant", "admin"], verbs: ["view", "create", "edit", "delete", "manage"] },

  // ── Author/marketplace authoring ────────────────────────────────────────────
  { prefix: "/marketplace/author", roles: ["author", "admin"], verbs: ["view", "create", "edit"] },

  // ── Customer section ────────────────────────────────────────────────────────
  { prefix: "/customer", roles: ["customer", "admin", "support"], verbs: ["view", "edit"] },

  // ── Support section ─────────────────────────────────────────────────────────
  { prefix: "/support", roles: ["support", "admin"], verbs: ["view", "edit", "manage"] },

  // ── Influencer module ───────────────────────────────────────────────────────
  // Admin sub-area requires elevated influencer roles
  {
    prefix: "/influencer/admin",
    roles: ["influencer_admin", "admin"],
    verbs: ["view", "manage"],
  },
  {
    prefix: "/influencer/manager",
    roles: ["campaign_manager", "influencer_admin", "admin"],
    verbs: ["view", "edit", "manage"],
  },
  {
    prefix: "/influencer",
    roles: [
      "influencer",
      "creator",
      "brand",
      "campaign_manager",
      "influencer_admin",
      "admin",
    ],
    verbs: ["view", "create", "edit"],
  },

  // ── Vala Builder module ─────────────────────────────────────────────────────
  {
    prefix: "/builder/admin",
    roles: ["builder_admin", "admin"],
    verbs: ["view", "manage"],
  },
  {
    prefix: "/builder",
    roles: ["builder_user", "builder_manager", "builder_admin", "admin"],
    verbs: ["view", "create", "edit"],
  },

  // ── Partner module ──────────────────────────────────────────────────────────
  {
    prefix: "/partner/admin",
    roles: ["partner_admin", "admin"],
    verbs: ["view", "manage"],
  },
  {
    prefix: "/partner",
    roles: ["partner", "reseller", "affiliate", "partner_admin", "admin"],
    verbs: ["view", "edit"],
  },

  // ── Chat module ─────────────────────────────────────────────────────────────
  {
    prefix: "/chat/admin",
    roles: ["chat_admin", "admin"],
    verbs: ["view", "manage"],
  },
  {
    prefix: "/chat",
    roles: ["chat_user", "chat_manager", "chat_admin", "admin"],
    verbs: ["view", "create", "edit"],
  },

  // ── Productivity module ─────────────────────────────────────────────────────
  {
    prefix: "/productivity/admin",
    roles: ["productivity_admin", "admin"],
    verbs: ["view", "manage"],
  },
  {
    prefix: "/productivity",
    roles: [
      "productivity_user",
      "productivity_manager",
      "productivity_admin",
      "admin",
    ],
    verbs: ["view", "create", "edit"],
  },
];

const PUBLIC_PREFIXES = [
  "/",
  "/auth",
  "/marketplace",
  "/checkout",
  "/unauthorized",
];

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")),
  );
}

export function findRouteRule(pathname: string): RouteRule | null {
  let best: RouteRule | null = null;
  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!best || rule.prefix.length > best.prefix.length) best = rule;
    }
  }
  return best;
}

export function isRoleAllowed(pathname: string, roles: AppRole[]): boolean {
  const rule = findRouteRule(pathname);
  if (!rule) return true; // unrestricted (public/marketing routes)
  if (roles.length === 0) return false;
  return rule.roles.some((r) => roles.includes(r));
}

export function requiredRolesFor(pathname: string): AppRole[] {
  return findRouteRule(pathname)?.roles ?? [];
}
