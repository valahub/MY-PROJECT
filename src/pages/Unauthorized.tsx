import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, ROLE_HOME } from "@/contexts/AuthContext";
import { authHealer } from "@/lib/auth/auth-healer";

/**
 * Dedicated 403 Access Denied page.
 * - Sets a discoverable status hint on document so server-side renderers /
 *   crawlers can detect the 403 (SPA can't set HTTP status, but we publish it
 *   via meta + document.title for tooling and tests).
 * - Logs every visit to the auth audit trail with the originating path.
 */
export default function Unauthorized() {
  const { primaryRole, signOut } = useAuth();
  const location = useLocation();
  const home = primaryRole ? ROLE_HOME[primaryRole] : "/";
  const blockedFrom =
    (location.state as { from?: string } | null)?.from ?? document.referrer ?? "unknown";

  useEffect(() => {
    document.title = "403 — Access denied";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="x-status-code"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "x-status-code";
      document.head.appendChild(meta);
    }
    meta.content = "403";
    authHealer.log("permission_denied", "unauthorized_page_view", {
      from: blockedFrom,
      role: primaryRole,
      status: 403,
    });
    return () => {
      meta?.setAttribute("content", "200");
    };
  }, [blockedFrom, primaryRole]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-6"
      role="alert"
      aria-labelledby="unauthorized-title"
      data-status="403"
    >
      <div className="max-w-md text-center space-y-4">
        <p className="text-xs font-mono text-muted-foreground">HTTP 403 · FORBIDDEN</p>
        <h1 id="unauthorized-title" className="text-3xl font-semibold tracking-tight">
          Access denied
        </h1>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link to={home}>Go to your dashboard</Link>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

