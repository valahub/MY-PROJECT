import { describe, it, expect, beforeEach } from "vitest";
import { verifySidebar, verifyAllRoles } from "@/lib/auth/sidebar-verification";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import type { AppRole } from "@/contexts/AuthContext";

const Icon = () => null as unknown as React.ReactElement;

const CATALOG: SyncableNavItem[] = [
  { title: "Admin", href: "/admin", icon: Icon },
  { title: "Auth obs", href: "/admin/auth-observability", icon: Icon },
  { title: "Server", href: "/admin/server", icon: Icon },
  { title: "Merchant", href: "/merchant/dashboard", icon: Icon },
  { title: "Customer", href: "/customer/dashboard", icon: Icon },
  { title: "Support", href: "/support/dashboard", icon: Icon },
];

describe("sidebar verification harness", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it("reports zero mismatches when the rendered nav matches the role-permission map", () => {
    const rendered = syncSidebar(CATALOG, ["customer"] as AppRole[]);
    const r = verifySidebar(CATALOG, rendered, "customer");
    expect(r.shouldHide).toEqual([]);
    expect(r.shouldShow).toEqual([]);
  });

  it("flags leaked items when the nav exposes routes a role cannot access", () => {
    // Pretend the auto-sync was bypassed and admin items leaked into customer nav.
    const r = verifySidebar(CATALOG, CATALOG, "customer");
    expect(r.shouldHide).toEqual(expect.arrayContaining(["/admin", "/merchant/dashboard", "/support/dashboard"]));
    expect(r.shouldHide.length).toBeGreaterThan(0);
  });

  it("flags missing items when the nav hides routes a role should see", () => {
    // Render only the customer dashboard for an admin — admin should see all the others too.
    const rendered: SyncableNavItem[] = [
      { title: "Customer", href: "/customer/dashboard", icon: Icon },
    ];
    const r = verifySidebar(CATALOG, rendered, "admin");
    expect(r.shouldShow).toEqual(expect.arrayContaining([
      "/admin", "/admin/auth-observability", "/admin/server",
      "/merchant/dashboard", "/support/dashboard",
    ]));
  });

  it("emits one audit entry per role for verifyAllRoles", () => {
    const before = authHealer.list(500).filter((e) => e.message === "sidebar_verification").length;
    verifyAllRoles(CATALOG, (role: AppRole) => syncSidebar(CATALOG, [role]));
    const after = authHealer.list(500).filter((e) => e.message === "sidebar_verification").length;
    expect(after - before).toBe(5); // admin/merchant/author/customer/support
    const last5 = authHealer.list(500).filter((e) => e.message === "sidebar_verification").slice(0, 5);
    for (const e of last5) {
      const meta = e.meta as { role: string; mismatchCount: number };
      expect(typeof meta.role).toBe("string");
      expect(typeof meta.mismatchCount).toBe("number");
    }
  });
});
