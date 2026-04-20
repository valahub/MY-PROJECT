import { redirect } from "@tanstack/react-router";
import { authService } from "./auth";
import type { Role } from "./types";

interface GuardOptions {
  roles?: Role[];
  tenantId?: string;
}

export function enforceAuth({ roles, tenantId }: GuardOptions = {}) {
  return async ({ location }: { location: { href: string } }) => {
    await authService.bootstrap();
    if (!authService.isAuthenticated()) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
    if (roles && !authService.canAccessRole(roles)) {
      throw redirect({ to: "/" });
    }
    if (tenantId && !authService.assertTenantAccess(tenantId)) {
      throw redirect({ to: "/" });
    }
  };
}
