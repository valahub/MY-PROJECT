// Paddle RBAC - Database Schema Definitions
// Central database schema for roles, permissions, and access control

import type {
  RoleEntity,
  PermissionEntity,
  RolePermissionEntity,
  UserEntity,
  ApiScopeEntity,
  AuditLogEntity,
} from './types';

// ============================================
// TABLE: roles
// ============================================

export const ROLES_TABLE = 'roles';

export interface RolesTable {
  id: string; // UUID
  name: string; // e.g., "Super Admin", "Reseller"
  type: 'system' | 'custom'; // system roles are predefined, custom are user-created
  status: 'active' | 'suspended'; // suspended roles cannot be assigned
  is_locked: boolean; // system roles cannot be deleted
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================
// TABLE: permissions
// ============================================

export const PERMISSIONS_TABLE = 'permissions';

export interface PermissionsTable {
  id: string; // UUID
  key: string; // e.g., "marketplace.product.read"
  module: string; // e.g., "marketplace", "paddle", "server"
  description: string; // e.g., "Read marketplace products"
  created_at: string; // ISO timestamp
}

// ============================================
// TABLE: role_permissions
// ============================================

export const ROLE_PERMISSIONS_TABLE = 'role_permissions';

export interface RolePermissionsTable {
  role_id: string; // FK to roles.id
  permission_id: string; // FK to permissions.id
  read: boolean; // read access
  write: boolean; // write access
  delete: boolean; // delete access
  admin: boolean; // admin access
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================
// TABLE: users (extended)
// ============================================

export const USERS_TABLE = 'users';

export interface UsersTable {
  id: string; // UUID
  email: string; // user email
  name?: string; // user name
  role_id: string; // FK to roles.id
  plan_active: boolean; // is user's subscription plan active
  status: 'active' | 'suspended'; // user status
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================
// TABLE: api_scopes
// ============================================

export const API_SCOPES_TABLE = 'api_scopes';

export interface ApiScopesTable {
  id: string; // UUID
  scope_key: string; // e.g., "read:products", "admin:all"
  enabled: boolean; // is scope enabled
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================
// TABLE: audit_logs
// ============================================

export const AUDIT_LOGS_TABLE = 'audit_logs';

export interface AuditLogsTable {
  id: string; // UUID
  action: string; // e.g., "role_created", "permission_assigned"
  user_id: string; // FK to users.id
  role_id?: string; // FK to roles.id (optional)
  changes?: Record<string, { from: unknown; to: unknown }>; // JSON field
  metadata?: Record<string, unknown>; // JSON field
  ip_address?: string; // user IP address
  timestamp: string; // ISO timestamp
}

// ============================================
// SQL SCHEMA (for reference)
// ============================================

export const SQL_SCHEMA = `
-- Create roles table
CREATE TABLE IF NOT EXISTS ${ROLES_TABLE} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('system', 'custom')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS ${PERMISSIONS_TABLE} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS ${ROLE_PERMISSIONS_TABLE} (
  role_id UUID NOT NULL REFERENCES ${ROLES_TABLE}(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES ${PERMISSIONS_TABLE}(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  write BOOLEAN NOT NULL DEFAULT false,
  delete BOOLEAN NOT NULL DEFAULT false,
  admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create users table (extended)
CREATE TABLE IF NOT EXISTS ${USERS_TABLE} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role_id UUID NOT NULL REFERENCES ${ROLES_TABLE}(id),
  plan_active BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create api_scopes table
CREATE TABLE IF NOT EXISTS ${API_SCOPES_TABLE} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key VARCHAR(255) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS ${AUDIT_LOGS_TABLE} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES ${USERS_TABLE}(id),
  role_id UUID REFERENCES ${ROLES_TABLE}(id),
  changes JSONB,
  metadata JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON ${ROLE_PERMISSIONS_TABLE}(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON ${ROLE_PERMISSIONS_TABLE}(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON ${USERS_TABLE}(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON ${AUDIT_LOGS_TABLE}(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_role_id ON ${AUDIT_LOGS_TABLE}(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON ${AUDIT_LOGS_TABLE}(timestamp);
`;

// ============================================
// SEED DATA (System Roles & Permissions)
// ============================================

export const SEED_SYSTEM_ROLES: Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Super Admin', type: 'system', status: 'active', isLocked: true },
  { name: 'Platform Admin', type: 'system', status: 'active', isLocked: true },
  { name: 'Module Admin', type: 'system', status: 'active', isLocked: true },
  { name: 'Manager', type: 'system', status: 'active', isLocked: true },
  { name: 'User', type: 'system', status: 'active', isLocked: true },
];

export const SEED_PERMISSIONS: Omit<PermissionEntity, 'id' | 'createdAt'>[] = [
  // System permissions
  { key: 'system.read', module: 'system', description: 'Read system settings' },
  { key: 'system.write', module: 'system', description: 'Write system settings' },
  { key: 'system.admin', module: 'system', description: 'Full system admin access' },
  
  // Marketplace permissions
  { key: 'marketplace.product.read', module: 'marketplace', description: 'Read marketplace products' },
  { key: 'marketplace.product.write', module: 'marketplace', description: 'Write marketplace products' },
  { key: 'marketplace.product.publish', module: 'marketplace', description: 'Publish marketplace products' },
  { key: 'marketplace.product.delete', module: 'marketplace', description: 'Delete marketplace products' },
  { key: 'marketplace.order.manage', module: 'marketplace', description: 'Manage marketplace orders' },
  { key: 'marketplace.review.manage', module: 'marketplace', description: 'Manage marketplace reviews' },
  
  // Paddle (Billing) permissions
  { key: 'paddle.billing.read', module: 'paddle', description: 'Read billing information' },
  { key: 'paddle.billing.write', module: 'paddle', description: 'Write billing information' },
  { key: 'paddle.subscription.manage', module: 'paddle', description: 'Manage subscriptions' },
  { key: 'paddle.plan.manage', module: 'paddle', description: 'Manage pricing plans' },
  { key: 'paddle.payment.process', module: 'paddle', description: 'Process payments' },
  { key: 'paddle.refund.process', module: 'paddle', description: 'Process refunds' },
  { key: 'paddle.invoice.read', module: 'paddle', description: 'Read invoices' },
  
  // Server permissions
  { key: 'server.read', module: 'server', description: 'Read server information' },
  { key: 'server.write', module: 'server', description: 'Write server configuration' },
  { key: 'server.domain.manage', module: 'server', description: 'Manage domains' },
  { key: 'server.hosting.manage', module: 'server', description: 'Manage hosting' },
  
  // Developer permissions
  { key: 'developer.project.read', module: 'developer', description: 'Read developer projects' },
  { key: 'developer.project.write', module: 'developer', description: 'Write developer projects' },
  { key: 'developer.task.manage', module: 'developer', description: 'Manage developer tasks' },
  { key: 'developer.bug.manage', module: 'developer', description: 'Manage bug reports' },
  
  // Partner permissions
  { key: 'partner.read', module: 'partner', description: 'Read partner information' },
  { key: 'partner.manage', module: 'partner', description: 'Manage partners' },
  { key: 'partner.commission.read', module: 'partner', description: 'Read partner commissions' },
  { key: 'partner.payout.manage', module: 'partner', description: 'Manage partner payouts' },
  
  // Support permissions
  { key: 'support.ticket.read', module: 'support', description: 'Read support tickets' },
  { key: 'support.ticket.reply', module: 'support', description: 'Reply to support tickets' },
  { key: 'support.remote.access', module: 'support', description: 'Remote access for support' },
  
  // Chat permissions
  { key: 'chat.read', module: 'chat', description: 'Read chat messages' },
  { key: 'chat.write', module: 'chat', description: 'Write chat messages' },
  { key: 'chat.manage', module: 'chat', description: 'Manage chat' },
  
  // Productivity permissions
  { key: 'productivity.task.read', module: 'productivity', description: 'Read productivity tasks' },
  { key: 'productivity.task.write', module: 'productivity', description: 'Write productivity tasks' },
  { key: 'productivity.goal.manage', module: 'productivity', description: 'Manage productivity goals' },
  
  // Influencer permissions
  { key: 'influencer.campaign.read', module: 'influencer', description: 'Read influencer campaigns' },
  { key: 'influencer.campaign.join', module: 'influencer', description: 'Join influencer campaigns' },
  { key: 'influencer.earnings.read', module: 'influencer', description: 'Read influencer earnings' },
  
  // AI Builder permissions
  { key: 'ai_builder.project.generate', module: 'ai_builder', description: 'Generate AI projects' },
  { key: 'ai_builder.project.edit', module: 'ai_builder', description: 'Edit AI projects' },
  { key: 'ai_builder.project.export', module: 'ai_builder', description: 'Export AI projects' },
];

export const SEED_API_SCOPES: Omit<ApiScopeEntity, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { scopeKey: 'read:products', enabled: true },
  { scopeKey: 'write:products', enabled: true },
  { scopeKey: 'read:subscriptions', enabled: true },
  { scopeKey: 'write:subscriptions', enabled: true },
  { scopeKey: 'read:licenses', enabled: true },
  { scopeKey: 'revoke:licenses', enabled: true },
  { scopeKey: 'read:webhooks', enabled: true },
  { scopeKey: 'admin:all', enabled: true },
];
