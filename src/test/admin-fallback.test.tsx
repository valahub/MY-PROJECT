/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminUnknownRouteFallback from "@/components/AdminUnknownRouteFallback";
import Unauthorized from "@/pages/Unauthorized";
import { authHealer } from "@/lib/auth/auth-healer";
import { AuthProvider } from "@/contexts/AuthContext";

function logsFor(kind: string) {
  return authHealer.list(50).filter((e) => e.kind === kind);
}

describe("/admin/* unknown route fallback", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it("redirects unknown /admin/* to /unauthorized and logs the attempt", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/this-does-not-exist"]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/*" element={<AdminUnknownRouteFallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Access denied/i)).toBeInTheDocument();
    const fallbacks = logsFor("redirect_fallback");
    expect(fallbacks.some((e) => e.message === "unknown admin route")).toBe(true);
    const last = fallbacks.find((e) => e.message === "unknown admin route")!;
    expect((last.meta as { path?: string }).path).toBe("/admin/this-does-not-exist");
  });
});
