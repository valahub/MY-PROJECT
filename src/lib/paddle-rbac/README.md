# Paddle RBAC - Central Role & Permission System

**ULTRA GOD MODE — ENTERPRISE-LEVEL ACCESS CONTROL**

## Overview

Paddle RBAC is the central, single source of truth for all role and permission management across the entire application. All modules read permissions exclusively from this system — no duplicate role logic exists anywhere.

## Core Principles

- **Paddle = CENTRAL CONTROL** — All modules must read permissions from Paddle only
- **NO duplicate role/permission logic** — No module-level overrides or custom permission systems
- **Extend existing UI only** — No redesign, no new dashboards
- **Dynamic & Enterprise-grade** — Full CRUD, plan-based restrictions, sync engine, self-healing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PADDLE RBAC SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Manager    │  │ API Service  │  │  Middleware  │     │
│  │  (Central)   │◄─┤  (Endpoints) │◄─┤  (Guards)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │   Database    │                        │
│                    │   (Schema)    │                        │
│                    └───────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │  UI     │        │  Cache  │        │  Sync   │
    │ (Admin) │        │ (TTL)   │        │ Engine │
    └─────────┘        └─────────┘        └─────────┘
```

## Database Schema

### Tables

#### `roles`
- `id` (UUID) — Primary key
- `name` (VARCHAR) — Role name (e.g., "Super Admin", "Reseller")
- `type` (ENUM) — `system` or `custom`
- `status` (ENUM) — `active` or `suspended`
- `is_locked` (BOOLEAN) — System roles cannot be deleted
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `permissions`
- `id` (UUID) — Primary key
- `key` (VARCHAR) — Permission key (e.g., "marketplace.product.read")
- `module` (VARCHAR) — Module name (e.g., "marketplace", "paddle")
- `description` (TEXT) — Human-readable description
- `created_at` (TIMESTAMP)

#### `role_permissions`
- `role_id` (UUID) — FK to roles
- `permission_id` (UUID) — FK to permissions
- `read` (BOOLEAN) — Read access
- `write` (BOOLEAN) — Write access
- `delete` (BOOLEAN) — Delete access
- `admin` (BOOLEAN) — Admin access
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `users`
- `id` (UUID) — Primary key
- `email` (VARCHAR) — User email
- `name` (VARCHAR) — User name
- `role_id` (UUID) — FK to roles
- `plan_active` (BOOLEAN) — Is user's subscription plan active
- `status` (ENUM) — `active` or `suspended`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `api_scopes`
- `id` (UUID) — Primary key
- `scope_key` (VARCHAR) — API scope (e.g., "read:products")
- `enabled` (BOOLEAN) — Is scope enabled
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `audit_logs`
- `id` (UUID) — Primary key
- `action` (VARCHAR) — Action performed (e.g., "role_created")
- `user_id` (UUID) — FK to users
- `role_id` (UUID) — FK to roles (optional)
- `changes` (JSONB) — Change details
- `metadata` (JSONB) — Additional metadata
- `ip_address` (VARCHAR) — User IP address
- `timestamp` (TIMESTAMP)

## System Roles

### System Roles (Locked)
1. **Super Admin** — Full system access, all permissions
2. **Platform Admin** — Platform-wide management
3. **Module Admin** — Per-module administration
4. **Manager** — Per-module management
5. **User** — Basic user access

### Custom Roles (Dynamic)
- Reseller
- Influencer
- Developer
- Affiliate
- Partner
- Franchise
- Sales Team
- Creator

## Permission Modules

### Global Permissions
- `system.read` — Read system settings
- `system.write` — Write system settings
- `system.admin` — Full system admin access

### Marketplace
- `marketplace.product.read` — Read products
- `marketplace.product.write` — Write products
- `marketplace.product.publish` — Publish products (plan-gated)
- `marketplace.product.delete` — Delete products
- `marketplace.order.manage` — Manage orders
- `marketplace.review.manage` — Manage reviews

### Paddle (Billing)
- `paddle.billing.read` — Read billing info
- `paddle.billing.write` — Write billing info
- `paddle.subscription.manage` — Manage subscriptions
- `paddle.plan.manage` — Manage pricing plans
- `paddle.payment.process` — Process payments (plan-gated)
- `paddle.refund.process` — Process refunds (plan-gated)
- `paddle.invoice.read` — Read invoices

### Server
- `server.read` — Read server info
- `server.write` — Write server config
- `server.domain.manage` — Manage domains
- `server.hosting.manage` — Manage hosting

### Developer
- `developer.project.read` — Read projects
- `developer.project.write` — Write projects
- `developer.task.manage` — Manage tasks
- `developer.bug.manage` — Manage bug reports

### Partner
- `partner.read` — Read partner info
- `partner.manage` — Manage partners
- `partner.commission.read` — Read commissions
- `partner.payout.manage` — Manage payouts (plan-gated)

### Support
- `support.ticket.read` — Read tickets
- `support.ticket.reply` — Reply to tickets
- `support.remote.access` — Remote access

### Chat
- `chat.read` — Read messages
- `chat.write` — Write messages
- `chat.manage` — Manage chat

### Productivity
- `productivity.task.read` — Read tasks
- `productivity.task.write` — Write tasks
- `productivity.goal.manage` — Manage goals

### Influencer
- `influencer.campaign.read` — Read campaigns
- `influencer.campaign.join` — Join campaigns
- `influencer.earnings.read` — Read earnings

### AI Builder
- `ai_builder.project.generate` — Generate projects
- `ai_builder.project.edit` — Edit projects
- `ai_builder.project.export` — Export projects

## API Endpoints

### Role Management
- `GET /roles` — List all roles (with filters)
- `GET /roles/:id` — Get single role
- `POST /roles/create` — Create new role
- `PUT /roles/update/:id` — Update role
- `DELETE /roles/delete/:id` — Delete role
- `GET /roles/:id/usage` — Get role usage count

### Permission Management
- `GET /permissions` — List all permissions (with filters)
- `PUT /roles/assign-permissions` — Assign permissions to role
- `GET /roles/:id/permissions` — Get role permissions

### User Management
- `GET /users/by-role/:roleId` — Get users by role
- `PUT /users/update-role` — Update user role

### API Scope Management
- `GET /api-scopes` — List all API scopes
- `PUT /api-scopes/update` — Update API scope

### Audit Logs
- `GET /audit-logs` — List audit logs (with filters)

### Advanced Features
- `POST /roles/export/:id` — Export role as JSON
- `POST /roles/import` — Import role from JSON
- `POST /sync/force` — Force sync all modules
- `POST /heal/permissions/:roleId` — Heal missing permissions
- `POST /heal/user/:userId` — Heal user role
- `POST /heal/cleanup-duplicates` — Cleanup duplicate roles
- `GET /conflicts/:roleId` — Detect permission conflicts

## Plan Gate Enforcement

When `user.plan_active == false`, the following permissions are **blocked**:

- `marketplace.product.publish` — Cannot publish products
- `paddle.payment.process` — Cannot process payments
- `paddle.payout.manage` — Cannot manage payouts
- `paddle.refund.process` — Cannot process refunds

All other permissions remain active (read-only access allowed).

## Usage

### Basic Setup

```typescript
import { PaddleRBACProvider } from "@/contexts/PaddleRBACContext";

function App() {
  return (
    <PaddleRBACProvider>
      <YourApp />
    </PaddleRBACProvider>
  );
}
```

### Using the Manager

```typescript
import { paddleRBACManager } from "@/lib/paddle-rbac";

// Create a role
const role = paddleRBACManager.createRole({
  name: "Reseller",
  type: "custom",
});

// Assign permissions
paddleRBACManager.assignPermissions({
  roleId: role.id,
  permissions: [
    { permissionId: "perm-1", read: true, write: true, delete: false, admin: false },
  ],
});

// Check permissions
const hasAccess = paddleRBACManager.hasPermission("user-1", "marketplace.product.read", "read");
```

### Using the API Service

```typescript
import { paddleRBACApiService } from "@/lib/paddle-rbac";

// Get roles
const { data: roles } = await paddleRBACApiService.getRoles({ type: "custom" });

// Create role
const { data: role } = await paddleRBACApiService.createRole({
  name: "New Role",
  type: "custom",
});

// Update role
await paddleRBACApiService.updateRole(role.id, { status: "suspended" });
```

### Using Middleware

```typescript
import { permissionMiddleware, planGateMiddleware } from "@/lib/paddle-rbac";

// Check permission
const result = permissionMiddleware.checkPermission("user-1", "marketplace.product.read", "read");

// Check plan gate
const planResult = planGateMiddleware.checkPlanGate("user-1", "marketplace.product.publish");
```

### Using Route Guards

```typescript
import { PaddleRouteGuard } from "@/components/PaddleRouteGuard";

<PaddleRouteGuard module="marketplace" action="write">
  <ProductUploadPage />
</PaddleRouteGuard>
```

### Using Context in Components

```typescript
import { usePaddleRBAC } from "@/contexts/PaddleRBACContext";

function MyComponent() {
  const { hasPermission, hasModuleAccess, planActive } = usePaddleRBAC();

  if (!hasPermission("marketplace.product.read", "read")) {
    return <div>Access denied</div>;
  }

  return <div>Content</div>;
}
```

## Caching

The system uses short TTL caching for performance:

- **Roles**: 2 minutes
- **Permissions**: 5 minutes
- **Role Permissions**: 2 minutes
- **API Scopes**: 5 minutes
- **Audit Logs**: 1 minute

Cache is automatically invalidated on write operations.

```typescript
import { rbacCache } from "@/lib/paddle-rbac";

// Manual cache operations
rbacCache.set("custom-key", data, 5000);
const cached = rbacCache.get("custom-key");
rbacCache.invalidate("roles:");
rbacCache.clear();
```

## Rate Limiting

Different API endpoints have different rate limits:

- **Sensitive APIs** (create, update, delete): 10 requests/minute
- **Standard APIs** (read operations): 100 requests/minute
- **Bulk Operations** (export, import): 5 requests/minute

```typescript
import { sensitiveApiLimiter, standardApiLimiter, bulkApiLimiter } from "@/lib/paddle-rbac";

const result = sensitiveApiLimiter.check("user-id");
if (!result.allowed) {
  console.log("Rate limit exceeded");
}
```

## Security

### Token Validation

```typescript
import { TokenValidator } from "@/lib/paddle-rbac";

const result = TokenValidator.validateToken(token);
if (result.valid) {
  console.log("User ID:", result.payload?.sub);
  console.log("Role ID:", result.payload?.role_id);
}
```

### Input Sanitization

```typescript
import { SecurityUtils } from "@/lib/paddle-rbac";

const clean = SecurityUtils.sanitizeInput(userInput);
const isValid = SecurityUtils.isValidEmail(email);
const isUUID = SecurityUtils.isValidUUID(uuid);
```

## Self-Healing

The system automatically heals common issues:

- **Missing permissions** — Assigns default read permissions
- **Role mismatch** — Falls back to safe default role
- **Invalid scopes** — Auto-syncs with UI
- **Broken toggles** — Resets to safe state
- **Duplicate roles** — Auto-cleanup

```typescript
// Manual healing
await paddleRBACApiService.healMissingPermissions(roleId);
await paddleRBACApiService.healUserRole(userId);
await paddleRBACApiService.cleanupDuplicateRoles();
```

## Sync Engine

All permission changes trigger automatic sync to all modules:

```typescript
// Force sync
await paddleRBACApiService.forceSync();

// Listen to sync events
paddleRBACManager.onSync((event) => {
  console.log("Sync event:", event.type, event.roleId);
});
```

## UI Pages

### Admin Roles Page (`/admin/roles`)
- Search and filter roles
- Create/edit/delete roles
- Permission toggle grid (Read/Write/Delete/Admin)
- Role usage count
- Lock system roles
- Suspend/activate toggle
- Conflict warnings
- Export/import JSON
- Sync button

### Audit Logs Page (`/admin/audit-logs`)
- View all audit logs
- Search and filter
- Export logs
- Timestamp formatting

## Strict Rules

1. **NO duplicate role system** — All modules must use Paddle RBAC
2. **NO hardcoded permissions** — All permissions must be dynamic
3. **NO module-level overrides** — No custom permission logic outside Paddle
4. **NO UI redesign** — Only extend existing admin dashboard
5. **NO bypassing Paddle** — All permission checks must go through Paddle

## File Structure

```
src/lib/paddle-rbac/
├── types.ts              # TypeScript types and interfaces
├── schema.ts             # Database schema and seed data
├── manager.ts            # Central RBAC manager
├── api-service.ts        # API service layer (with cache & rate limit)
├── middleware.ts         # Permission and plan gate middleware
├── cache.ts              # Caching layer
├── rate-limiter.ts       # Rate limiting
├── security.ts           # Token validation and security utils
├── index.ts              # Main export file
└── README.md             # This file

src/contexts/
└── PaddleRBACContext.tsx # React context for global state

src/components/
└── PaddleRouteGuard.tsx  # React Router integration

src/pages/admin/
├── AdminRoles.tsx        # Roles management UI
└── AdminAuditLogs.tsx    # Audit logs UI
```

## Final Result

✅ Enterprise-level role system  
✅ Fully dynamic permissions  
✅ Plan-based restrictions active  
✅ API + UI + DB fully synced  
✅ All modules controlled centrally  
✅ Zero conflict / zero duplication  
✅ Self-healing and sync engine  
✅ Caching and rate limiting  
✅ Security layer with token validation  
✅ Route guards for React Router  

---

**PADDLE RBAC — ULTRA GOD MODE — FINAL COMPLETE**
