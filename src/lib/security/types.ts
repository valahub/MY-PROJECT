export type Role = "admin" | "merchant" | "customer" | "support";

export type SecurityEventType =
  | "register"
  | "email_verify"
  | "login_success"
  | "login_failure"
  | "logout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "permission_changed"
  | "api_key_created"
  | "api_key_revoked"
  | "device_bound"
  | "device_unbound"
  | "suspicious_device"
  | "consent_logged"
  | "data_access";

export interface PasswordHashRecord {
  algorithm: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  hash: string;
}

export interface TwoFactorState {
  enabled: boolean;
  encryptedSecret?: string;
  backupCodeHashes: string[];
}

export interface UserRecord {
  id: string;
  email: string;
  emailVerified: boolean;
  password: PasswordHashRecord;
  role: Role;
  tenantId: string;
  twoFactor: TwoFactorState;
  createdAt: string;
  updatedAt: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  trustedDeviceFingerprints: string[];
}

export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  role: Role;
  refreshTokenHash: string;
  refreshTokenExpiresAt: string;
  deviceFingerprint: string;
  deviceLabel: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  revokedAt?: string;
  suspicious: boolean;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
}

export interface ApiKeyRecord {
  id: string;
  ownerUserId: string;
  tenantId: string;
  keyPrefix: string;
  secretHash: string;
  scopes: string[];
  rateLimitPerMinute: number;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface RateLimitBucket {
  key: string;
  count: number;
  resetAt: string;
}

export interface BlockedIpRecord {
  ip: string;
  reason: string;
  blockedUntil: string;
}

export interface IdempotencyRecord {
  key: string;
  scope: string;
  requestHash: string;
  responseHash: string;
  createdAt: string;
}

export interface ConsentLog {
  id: string;
  userId: string;
  tenantId: string;
  consentType: string;
  accepted: boolean;
  ipAddress: string;
  createdAt: string;
}

export interface SecurityAuditEvent {
  id: string;
  type: SecurityEventType;
  createdAt: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  sessionId?: string;
  details: string;
}

export interface SecurityState {
  version: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  emailVerificationTokens: EmailVerificationToken[];
  passwordResetTokens: PasswordResetToken[];
  apiKeys: ApiKeyRecord[];
  rateLimits: RateLimitBucket[];
  blockedIps: BlockedIpRecord[];
  idempotency: IdempotencyRecord[];
  consentLogs: ConsentLog[];
  auditEvents: SecurityAuditEvent[];
}

export interface ActiveAuthState {
  userId: string;
  sessionId: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}
