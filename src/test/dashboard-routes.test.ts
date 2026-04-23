/**
 * End-to-end-ish dashboard route mapping tests.
 *
 * Full router-level rendering of every dashboard would require booting Supabase
 * auth in jsdom (flaky). Instead we deterministically assert the role → route
 * authorization contract for every dashboard page that ships in the app.
 * If any role gains/loses access to a dashboard, this test will fail.
 */
import { describe, it, expect } from "vitest";
import { isRoleAllowed } from "@/lib/auth/route-permissions";
import type { AppRole } from "@/contexts/AuthContext";

interface DashboardCase {
  route: string;
  allowed: AppRole[];
  denied: AppRole[];
}

const CASES: DashboardCase[] = [
  {
    route: "/admin/dashboard",
    allowed: ["admin"],
    denied: ["merchant", "customer", "support", "author"],
  },
  {
    route: "/merchant/dashboard",
    allowed: ["merchant", "admin"],
    denied: ["customer", "support", "author"],
  },
  {
    route: "/customer/dashboard",
    allowed: ["customer", "admin", "support"],
    denied: ["merchant", "author"],
  },
  {
    route: "/support/dashboard",
    allowed: ["support", "admin"],
    denied: ["customer", "merchant", "author"],
  },
  {
    route: "/marketplace/author/dashboard",
    allowed: ["author", "admin"],
    denied: ["customer", "merchant", "support"],
  },
  {
    route: "/admin/server/dashboard",
    allowed: ["admin", "support"],
    denied: ["customer", "merchant", "author"],
  },
];

describe("dashboard role-access matrix (E2E contract)", () => {
  for (const c of CASES) {
    for (const role of c.allowed) {
      it(`${role} can access ${c.route}`, () => {
        expect(isRoleAllowed(c.route, [role])).toBe(true);
      });
    }
    for (const role of c.denied) {
      it(`${role} is BLOCKED from ${c.route}`, () => {
        expect(isRoleAllowed(c.route, [role])).toBe(false);
      });
    }
  }
});
