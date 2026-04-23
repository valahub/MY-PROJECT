/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import Unauthorized from "@/pages/Unauthorized";
import AdminUnknownRouteFallback from "@/components/AdminUnknownRouteFallback";
import { authHealer } from "@/lib/auth/auth-healer";
import { AuthProvider } from "@/contexts/AuthContext";
import { syncSidebar, type SyncableNavItem } from "@/lib/auth/sidebar-sync";
import type { AppRole } from "@/contexts/AuthContext";

const Icon = () => null as unknown as React.ReactElement;

function MiniSidebar({ role }: { role: AppRole }) {
  const items: SyncableNavItem[] = [
    { title: "My dashboard", href: `/${role}/dashboard`, icon: Icon },
    { title: "Admin", href: "/admin", icon: Icon },
    { title: "Server", href: "/admin/server", icon: Icon },
  ];
  const synced = syncSidebar(items, [role]);
  return (
    <nav data-testid="sidebar">
      {synced.map((i) => (
        <Link key={i.href} to={i.href}>{i.title}</Link>
      ))}
    </nav>
  );
}

describe("E2E: role-based sidebar visibility → click protected → /unauthorized", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it("customer sees only their dashboard link; admin items are hidden", () => {
    render(
      <MemoryRouter initialEntries={["/customer/dashboard"]}>
        <AuthProvider>
          <MiniSidebar role="customer" />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("My dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Server")).not.toBeInTheDocument();
  });

  it("admin sees all dashboard links", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <MiniSidebar role="admin" />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Server")).toBeInTheDocument();
  });

  it("clicking a protected admin link as non-admin lands on /unauthorized 403 page with audit log", async () => {
    // Render a router that simulates the production guard chain:
    //   /admin/* (no role match) → AdminUnknownRouteFallback → Navigate /unauthorized
    render(
      <MemoryRouter initialEntries={["/start"]}>
        <AuthProvider>
          <Routes>
            <Route path="/start" element={<Link to="/admin/secrets">Go to admin secrets</Link>} />
            <Route path="/admin/*" element={<AdminUnknownRouteFallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Go to admin secrets"));
    // Dedicated 403 page rendered
    expect(await screen.findByText(/HTTP 403 · FORBIDDEN/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Access denied/i })).toBeInTheDocument();
    // a11y/status hints
    const region = screen.getByRole("alert");
    expect(region.getAttribute("data-status")).toBe("403");
    expect(document.title).toMatch(/403/);
    const meta = document.querySelector('meta[name="x-status-code"]') as HTMLMetaElement | null;
    expect(meta?.content).toBe("403");
    // Audit trail captured both the redirect and the page view
    const fallbacks = authHealer.list(50).filter((e) => e.kind === "redirect_fallback");
    expect(fallbacks.some((e) => e.message === "unknown admin route")).toBe(true);
    const denials = authHealer.list(50).filter((e) => e.kind === "permission_denied");
    expect(denials.some((e) => e.message === "unauthorized_page_view")).toBe(true);
  });
});
