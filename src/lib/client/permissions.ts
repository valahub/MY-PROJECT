export type ApiUserRole = "admin" | "merchant" | "customer" | "support";

export type ApiRolePermission =
  | "products:manage"
  | "plans:manage"
  | "discounts:manage"
  | "webhooks:manage"
  | "subscriptions:manage"
  | "licenses:manage"
  | "checkout:manage"
  | "analytics:view";

const rolePermissionMap: Record<ApiUserRole, ApiRolePermission[]> = {
  admin: [
    "products:manage",
    "plans:manage",
    "discounts:manage",
    "webhooks:manage",
    "subscriptions:manage",
    "licenses:manage",
    "checkout:manage",
    "analytics:view",
  ],
  merchant: [
    "products:manage",
    "plans:manage",
    "discounts:manage",
    "webhooks:manage",
    "subscriptions:manage",
    "licenses:manage",
    "analytics:view",
  ],
  customer: ["checkout:manage"],
  support: ["subscriptions:manage", "licenses:manage", "analytics:view"],
};

export function getApiPermissionsForRole(role: ApiUserRole): ApiRolePermission[] {
  return rolePermissionMap[role] ?? [];
}
