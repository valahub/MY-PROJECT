// Auto-sync engine: regenerates a sidebar nav tree based on the user's roles.
// - Removes any item whose href has no matching route rule that allows the role.
// - Removes children that fail authorization; collapses parents whose children all fail.
// - Logs mismatches via authHealer.

import { authHealer } from "./auth-healer";
import { findRouteRule, isRoleAllowed } from "./route-permissions";
import type { AppRole } from "@/contexts/AuthContext";

export interface SyncableNavChild {
  title: string;
  href: string;
}

export interface SyncableNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SyncableNavChild[];
}

interface SyncOptions {
  /** Set of route paths known to exist in the router. */
  knownRoutes?: Set<string>;
  /** When true, allow everything (used for demo-role sessions). */
  bypass?: boolean;
}

function isAuthorized(href: string, roles: AppRole[]): boolean {
  // Routes without an explicit rule fall back to "allowed" so we don't accidentally hide
  // generic admin pages while the rule list is still being built out.
  const rule = findRouteRule(href);
  if (!rule) return true;
  return isRoleAllowed(href, roles);
}

function isKnown(href: string, knownRoutes?: Set<string>): boolean {
  if (!knownRoutes || knownRoutes.size === 0) return true;
  return knownRoutes.has(href);
}

export function syncSidebar(
  items: SyncableNavItem[],
  roles: AppRole[],
  options: SyncOptions = {},
): SyncableNavItem[] {
  const { knownRoutes, bypass = false } = options;
  if (bypass) return items;

  const dropped: string[] = [];
  const result: SyncableNavItem[] = [];

  for (const item of items) {
    const itemAuthorized = isAuthorized(item.href, roles);
    const itemKnown = isKnown(item.href, knownRoutes);

    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children.filter((child) => {
        const ok = isAuthorized(child.href, roles) && isKnown(child.href, knownRoutes);
        if (!ok) dropped.push(child.href);
        return ok;
      });
      // Keep parent if either parent itself is allowed OR at least one child remains.
      if (filteredChildren.length === 0 && !itemAuthorized) {
        dropped.push(item.href);
        continue;
      }
      result.push({ ...item, children: filteredChildren });
      continue;
    }

    if (!itemAuthorized || !itemKnown) {
      dropped.push(item.href);
      continue;
    }
    result.push(item);
  }

  if (dropped.length > 0) {
    authHealer.log("redirect_fallback", "sidebar items hidden by auto-sync", {
      hidden: dropped,
      roles,
    });
  }
  return result;
}
