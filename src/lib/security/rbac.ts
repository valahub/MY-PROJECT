import type { Role } from "./types";

export type Permission =
  | "admin:*"
  | "admin:security"
  | "admin:users"
  | "merchant:products:read"
  | "merchant:products:write"
  | "merchant:subscriptions:read"
  | "merchant:subscriptions:write"
  | "merchant:api:read"
  | "merchant:api:write"
  | "customer:self:read"
  | "customer:self:write"
  | "customer:billing:read"
  | "support:tickets:read"
  | "support:tickets:write"
  | "support:customers:read"
  | "security:audit:read";

const rolePermissions: Record<Role, Permission[]> = {
  admin: ["admin:*", "security:audit:read", "admin:security", "admin:users"],
  merchant: [
    "merchant:products:read",
    "merchant:products:write",
    "merchant:subscriptions:read",
    "merchant:subscriptions:write",
    "merchant:api:read",
    "merchant:api:write",
  ],
  customer: ["customer:self:read", "customer:self:write", "customer:billing:read"],
  support: ["support:tickets:read", "support:tickets:write", "support:customers:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "admin") return true;
  return rolePermissions[role].includes(permission);
}

export function canAccessRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role];
}
