import { describe, it, expect, beforeEach } from "vitest";
import { syncSidebar } from "@/lib/auth/sidebar-sync";
import { authHealer } from "@/lib/auth/auth-healer";
import { isRoleAllowed, findRouteRule } from "@/lib/auth/route-permissions";
import type { AppRole } from "@/contexts/AuthContext";

const Icon = () => null as unknown as React.ReactElement;

const ALL_ITEMS = [
  { title: "Admin home", href: "/admin", icon: Icon },
  { title: "Auth observability", href: "/admin/auth-observability", icon: Icon },
  { title: "Server", href: "/admin/server", icon: Icon, children: [
    { title: "Server dashboard", href: "/admin/server/dashboard" },
    { title: "Server management", href: "/admin/server/management" },
  ]},
  { title: "Merchant dashboard", href: "/merchant/dashboard", icon: Icon },
  { title: "Customer dashboard", href: "/customer/dashboard", icon: Icon },
  { title: "Support dashboard", href: "/support/dashboard", icon: Icon },
];

function logCount(): number {
  return authHealer.list(500).length;
}

describe("sidebar auto-sync ↔ route-permission map", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it("hides admin items for a customer and keeps allowed ones", () => {
    const before = logCount();
    const out = syncSidebar(ALL_ITEMS, ["customer"] as AppRole[]);
    const hrefs = out.map((i) => i.href);
    expect(hrefs).toContain("/customer/dashboard");
    expect(hrefs).not.toContain("/admin");
    expect(hrefs).not.toContain("/admin/auth-observability");
    expect(hrefs).not.toContain("/merchant/dashboard");
    expect(hrefs).not.toContain("/support/dashboard");
    // audit log entry was emitted
    expect(logCount()).toBeGreaterThan(before);
    const lastHide = authHealer.list(20).find((e) => e.kind === "redirect_fallback");
    expect(lastHide).toBeTruthy();
    expect(Array.isArray((lastHide!.meta as { hidden?: unknown }).hidden)).toBe(true);
  });

  it("admin sees all dashboard routes", () => {
    const out = syncSidebar(ALL_ITEMS, ["admin"] as AppRole[]);
    expect(out.map((i) => i.href)).toEqual(expect.arrayContaining([
      "/admin", "/admin/auth-observability", "/admin/server",
      "/merchant/dashboard", "/customer/dashboard", "/support/dashboard",
    ]));
  });

  it("merchant cannot see /admin or /support but sees own dashboard", () => {
    const out = syncSidebar(ALL_ITEMS, ["merchant"] as AppRole[]);
    const hrefs = out.map((i) => i.href);
    expect(hrefs).toContain("/merchant/dashboard");
    expect(hrefs).not.toContain("/admin");
    expect(hrefs).not.toContain("/support/dashboard");
  });

  it("support sees /support and /admin/server (shared rule) but NOT /admin root", () => {
    const out = syncSidebar(ALL_ITEMS, ["support"] as AppRole[]);
    const hrefs = out.map((i) => i.href);
    expect(hrefs).toContain("/support/dashboard");
    expect(hrefs).toContain("/admin/server");
    expect(hrefs).not.toContain("/admin");
  });

  it("collapses parent when no children pass authorization", () => {
    const out = syncSidebar(
      [{ title: "Admin", href: "/admin", icon: Icon, children: [
        { title: "Roles", href: "/admin/roles" },
        { title: "Secrets", href: "/admin/secrets" },
      ] }],
      ["customer"] as AppRole[],
    );
    expect(out).toHaveLength(0);
  });
});

describe("route-permission engine", () => {
  it.each<[string, AppRole, boolean]>([
    ["/admin/dashboard", "admin", true],
    ["/admin/dashboard", "customer", false],
    ["/merchant/dashboard", "merchant", true],
    ["/merchant/dashboard", "customer", false],
    ["/customer/dashboard", "customer", true],
    ["/customer/dashboard", "merchant", false],
    ["/support/dashboard", "support", true],
    ["/support/dashboard", "customer", false],
    ["/admin/server/dashboard", "support", true],
    ["/admin/auth-observability", "support", false],
  ])("isRoleAllowed(%s, %s) === %s", (path, role, expected) => {
    expect(isRoleAllowed(path, [role])).toBe(expected);
  });

  it("longest-prefix wins (admin/server beats /admin)", () => {
    const r = findRouteRule("/admin/server/dashboard");
    expect(r?.prefix).toBe("/admin/server");
  });

  it("empty roles array is denied for any protected route", () => {
    expect(isRoleAllowed("/admin", [])).toBe(false);
    expect(isRoleAllowed("/merchant", [])).toBe(false);
  });
});
