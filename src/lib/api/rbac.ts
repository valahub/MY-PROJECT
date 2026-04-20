// Role-based access control
import type { Role } from "./types";

// Hierarchy: higher index = more privilege
const ROLE_HIERARCHY: Role[] = ["customer", "support", "merchant", "admin"];

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

// null = public (no auth required)
export const PERMISSIONS = {
  "auth:logout": "customer" as Role,
  "users:read_self": "customer" as Role,
  "users:update_self": "customer" as Role,
  "users:list": "admin" as Role,
  "users:update_status": "admin" as Role,
  "merchant:kyc": "merchant" as Role,
  "merchant:read_profile": "merchant" as Role,
  "merchant:update_profile": "merchant" as Role,
  "products:create": "merchant" as Role,
  "products:update": "merchant" as Role,
  "products:delete": "merchant" as Role,
  "products:publish": "merchant" as Role,
  "categories:create": "admin" as Role,
  "categories:update": "admin" as Role,
  "categories:delete": "admin" as Role,
  "plans:create": "merchant" as Role,
  "plans:update": "merchant" as Role,
  "plans:delete": "merchant" as Role,
  "checkout:create": "customer" as Role,
  "checkout:read": "customer" as Role,
  "orders:create": "customer" as Role,
  "orders:read": "customer" as Role,
  "payments:intent": "customer" as Role,
  "payments:confirm": "customer" as Role,
  "payments:read": "customer" as Role,
  "payments:refund": "support" as Role,
  "invoices:read": "customer" as Role,
  "discounts:create": "merchant" as Role,
  "discounts:list": "merchant" as Role,
  "webhooks:register": "merchant" as Role,
  "webhooks:logs": "merchant" as Role,
  "api-keys:create": "merchant" as Role,
  "api-keys:list": "merchant" as Role,
  "api-keys:delete": "merchant" as Role,
  "admin:logs": "admin" as Role,
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function canAccess(userRole: Role | undefined, permission: Permission): boolean {
  const required = PERMISSIONS[permission];
  if (!userRole) return false;
  return hasRole(userRole, required);
}
