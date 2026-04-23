// Sidebar verification harness.
// Compares a candidate nav tree against the route-permission map for each role
// and emits a structured audit entry per role with mismatch counts.
//
// "Mismatch" means: an item that the role-permission map says should be visible
// but is missing from the rendered nav, OR an item present in the nav that the
// map says the role should not see.

import { authHealer } from "./auth-healer";
import { isRoleAllowed, findRouteRule } from "./route-permissions";
import type { SyncableNavItem } from "./sidebar-sync";
import type { AppRole } from "@/contexts/AuthContext";

export interface VerificationResult {
  role: AppRole;
  shouldHide: string[];   // present in rendered nav but role can't access
  shouldShow: string[];   // map says role should see, but missing from nav
  total: number;
  visible: number;
}

const ALL_ROLES: AppRole[] = ["admin", "merchant", "author", "customer", "support"];

function flattenHrefs(items: SyncableNavItem[]): string[] {
  const out: string[] = [];
  for (const i of items) {
    out.push(i.href);
    if (i.children) for (const c of i.children) out.push(c.href);
  }
  return out;
}

export function verifySidebar(
  fullCatalog: SyncableNavItem[],
  rendered: SyncableNavItem[],
  role: AppRole,
): VerificationResult {
  const renderedHrefs = new Set(flattenHrefs(rendered));
  const catalogHrefs = flattenHrefs(fullCatalog);

  const shouldHide: string[] = [];
  const shouldShow: string[] = [];

  for (const href of catalogHrefs) {
    const rule = findRouteRule(href);
    // Skip routes with no rule (treated as public).
    if (!rule) continue;
    const allowed = isRoleAllowed(href, [role]);
    const present = renderedHrefs.has(href);
    if (allowed && !present) shouldShow.push(href);
    if (!allowed && present) shouldHide.push(href);
  }

  const result: VerificationResult = {
    role,
    shouldHide,
    shouldShow,
    total: catalogHrefs.length,
    visible: renderedHrefs.size,
  };

  authHealer.log("redirect_fallback", "sidebar_verification", {
    role,
    mismatchCount: shouldHide.length + shouldShow.length,
    shouldHide,
    shouldShow,
    total: result.total,
    visible: result.visible,
    kind: "sidebar_verification",
  });

  return result;
}

/** Run verification for every known role and return the aggregate report. */
export function verifyAllRoles(
  fullCatalog: SyncableNavItem[],
  renderFor: (role: AppRole) => SyncableNavItem[],
): VerificationResult[] {
  return ALL_ROLES.map((role) => verifySidebar(fullCatalog, renderFor(role), role));
}
