import {
  decryptAesGcm,
  encryptAesGcm,
  generateTotpSecret,
  hashPassword,
  hmacSha256,
  randomId,
  randomToken,
  sha256,
  signJwt,
  verifyHmacSha256,
  verifyPassword,
  verifyTotpCode,
} from "./crypto";
import { canAccessRole, hasPermission, type Permission } from "./rbac";
import { mutateSecurityState, readActiveAuth, readSecurityState, writeActiveAuth } from "./store";
import type {
  ActiveAuthState,
  ApiKeyRecord,
  AuthUser,
  ConsentLog,
  Role,
  SecurityAuditEvent,
  SecurityEventType,
  SessionRecord,
  UserRecord,
} from "./types";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60;
const EMAIL_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
const MAX_FAILED_ATTEMPTS = 6;
const IP_BLOCK_SECONDS = 15 * 60;
const JWT_SECRET = "erp-vala.jwt.secret.v1";

interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  tenantId: string;
  ipAddress?: string;
  consentType?: string;
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceLabel?: string;
  tenantId?: string;
  totpCode?: string;
  backupCode?: string;
}

interface LoginResult {
  success: boolean;
  reason?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  sessionId?: string;
  user?: AuthUser;
}

interface AuthenticatedState {
  user: UserRecord;
  session: SessionRecord;
}

function now() {
  return new Date();
}

function toIso(date: Date) {
  return date.toISOString();
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function isExpired(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactor.enabled,
  };
}

async function makeAccessToken(
  user: UserRecord,
  sessionId: string,
): Promise<{ token: string; expiresAt: string }> {
  const current = now();
  const expiresAt = addSeconds(current, ACCESS_TOKEN_TTL_SECONDS);
  const token = await signJwt(
    {
      sub: user.id,
      role: user.role,
      tenant: user.tenantId,
      sid: sessionId,
      iat: Math.floor(current.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      typ: "access",
    },
    JWT_SECRET,
  );
  return { token, expiresAt: toIso(expiresAt) };
}

function generateFingerprint(
  userAgent: string,
  ipAddress: string,
  deviceLabel: string,
): Promise<string> {
  return sha256(`${userAgent}|${ipAddress}|${deviceLabel}`);
}

function pushAuditEvent(
  type: SecurityEventType,
  details: string,
  options: { userId?: string; tenantId?: string; ipAddress?: string; sessionId?: string } = {},
) {
  const event: SecurityAuditEvent = {
    id: randomId("audit"),
    type,
    createdAt: toIso(now()),
    details,
    userId: options.userId,
    tenantId: options.tenantId,
    ipAddress: options.ipAddress,
    sessionId: options.sessionId,
  };
  mutateSecurityState((state) => {
    state.auditEvents.unshift(event);
    if (state.auditEvents.length > 1000) {
      state.auditEvents = state.auditEvents.slice(0, 1000);
    }
  });
}

function consumeRateLimitBucket(bucketKey: string, limit: number): boolean {
  let allowed = true;
  mutateSecurityState((state) => {
    const nowIso = toIso(now());
    state.rateLimits = state.rateLimits.filter((bucket) => !isExpired(bucket.resetAt));
    const existing = state.rateLimits.find((bucket) => bucket.key === bucketKey);
    if (!existing) {
      state.rateLimits.push({
        key: bucketKey,
        count: 1,
        resetAt: toIso(addSeconds(now(), 60)),
      });
      return;
    }
    if (existing.resetAt <= nowIso) {
      existing.count = 1;
      existing.resetAt = toIso(addSeconds(now(), 60));
      return;
    }
    if (existing.count >= limit) {
      allowed = false;
      return;
    }
    existing.count += 1;
  });
  return allowed;
}

function isIpBlocked(ipAddress: string): boolean {
  const state = readSecurityState();
  return state.blockedIps.some(
    (record) => record.ip === ipAddress && !isExpired(record.blockedUntil),
  );
}

function blockIp(ipAddress: string, reason: string) {
  mutateSecurityState((state) => {
    state.blockedIps = state.blockedIps.filter(
      (record) => !(record.ip === ipAddress && isExpired(record.blockedUntil)),
    );
    state.blockedIps.push({
      ip: ipAddress,
      reason,
      blockedUntil: toIso(addSeconds(now(), IP_BLOCK_SECONDS)),
    });
  });
}

async function ensureSeedUsers(): Promise<void> {
  if (readSecurityState().users.length > 0) return;

  const seedUsers: Array<{ email: string; password: string; role: Role; tenantId: string }> = [
    {
      email: "admin@erpvala.com",
      password: "Admin#123",
      role: "admin",
      tenantId: "tenant_platform",
    },
    {
      email: "merchant@acme.com",
      password: "Merchant#123",
      role: "merchant",
      tenantId: "tenant_acme",
    },
    {
      email: "john@example.com",
      password: "Customer#123",
      role: "customer",
      tenantId: "tenant_acme",
    },
    {
      email: "support@erpvala.com",
      password: "Support#123",
      role: "support",
      tenantId: "tenant_platform",
    },
  ];

  const users: UserRecord[] = await Promise.all(
    seedUsers.map(async (seed) => ({
      id: randomId("usr"),
      email: seed.email,
      emailVerified: true,
      password: await hashPassword(seed.password),
      role: seed.role,
      tenantId: seed.tenantId,
      twoFactor: { enabled: false, backupCodeHashes: [] },
      createdAt: toIso(now()),
      updatedAt: toIso(now()),
      failedLoginAttempts: 0,
      trustedDeviceFingerprints: [],
    })),
  );

  mutateSecurityState((state) => {
    if (state.users.length > 0) return;
    state.users = users;
  });
}

function findAuthenticatedState(active: ActiveAuthState | null): AuthenticatedState | null {
  if (!active) return null;
  const state = readSecurityState();
  const session = state.sessions.find((item) => item.id === active.sessionId && !item.revokedAt);
  if (!session || isExpired(session.refreshTokenExpiresAt)) return null;
  const user = state.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { user, session };
}

async function verifyTwoFactor(
  user: UserRecord,
  input: { totpCode?: string; backupCode?: string },
): Promise<boolean> {
  if (!user.twoFactor.enabled) return true;
  if (input.totpCode && user.twoFactor.encryptedSecret) {
    const secret = await decryptAesGcm(user.twoFactor.encryptedSecret, user.id);
    return verifyTotpCode(secret, input.totpCode);
  }
  if (input.backupCode) {
    const codeHash = await sha256(input.backupCode.trim());
    let matched = false;
    mutateSecurityState((state) => {
      const targetUser = state.users.find((candidate) => candidate.id === user.id);
      if (!targetUser) return;
      const index = targetUser.twoFactor.backupCodeHashes.findIndex((hash) => hash === codeHash);
      if (index >= 0) {
        targetUser.twoFactor.backupCodeHashes.splice(index, 1);
        targetUser.updatedAt = toIso(now());
        matched = true;
      }
    });
    return matched;
  }
  return false;
}

function currentRequestContext() {
  return {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  };
}

async function createSession(
  user: UserRecord,
  ipAddress: string,
  userAgent: string,
  deviceLabel: string,
): Promise<{
  session: SessionRecord;
  refreshToken: string;
  refreshTokenHash: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}> {
  const refreshToken = randomToken(32);
  const refreshTokenHash = await sha256(refreshToken);
  const fingerprint = await generateFingerprint(userAgent, ipAddress, deviceLabel);
  const suspicious =
    user.trustedDeviceFingerprints.length > 0 &&
    !user.trustedDeviceFingerprints.includes(fingerprint);
  const sessionId = randomId("ses");
  const access = await makeAccessToken(user, sessionId);

  const session: SessionRecord = {
    id: sessionId,
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    refreshTokenHash,
    refreshTokenExpiresAt: toIso(addSeconds(now(), REFRESH_TOKEN_TTL_SECONDS)),
    deviceFingerprint: fingerprint,
    deviceLabel,
    ipAddress,
    userAgent,
    createdAt: toIso(now()),
    lastActiveAt: toIso(now()),
    suspicious,
  };

  if (suspicious) {
    pushAuditEvent("suspicious_device", "Suspicious new device detected", {
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress,
      sessionId: sessionId,
    });
  }

  return {
    session,
    refreshToken,
    refreshTokenHash,
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
  };
}

export const authService = {
  async bootstrap() {
    await ensureSeedUsers();
  },

  async register(
    input: RegisterInput,
  ): Promise<{ success: boolean; verificationToken?: string; reason?: string }> {
    await ensureSeedUsers();
    const email = normalizeEmail(input.email);
    const ipAddress = input.ipAddress ?? "0.0.0.0";

    if (!consumeRateLimitBucket(`register:ip:${ipAddress}`, 10)) {
      return { success: false, reason: "Too many registration attempts. Please try again later." };
    }

    const state = readSecurityState();
    if (state.users.some((user) => user.email === email)) {
      return { success: false, reason: "Email already exists." };
    }

    const userId = randomId("usr");
    const userPassword = await hashPassword(input.password);
    const verifyToken = randomToken(28);
    const verifyTokenHash = await sha256(verifyToken);

    const consent: ConsentLog = {
      id: randomId("consent"),
      userId,
      tenantId: input.tenantId,
      consentType: input.consentType ?? "terms_and_privacy",
      accepted: true,
      ipAddress,
      createdAt: toIso(now()),
    };

    mutateSecurityState((next) => {
      next.users.push({
        id: userId,
        email,
        emailVerified: false,
        password: userPassword,
        role: input.role,
        tenantId: input.tenantId,
        twoFactor: { enabled: false, backupCodeHashes: [] },
        createdAt: toIso(now()),
        updatedAt: toIso(now()),
        failedLoginAttempts: 0,
        trustedDeviceFingerprints: [],
      });
      next.emailVerificationTokens.push({
        id: randomId("ev"),
        userId,
        tokenHash: verifyTokenHash,
        expiresAt: toIso(addSeconds(now(), EMAIL_TOKEN_TTL_SECONDS)),
      });
      next.consentLogs.unshift(consent);
    });

    pushAuditEvent("register", `Registered new ${input.role} account`, {
      userId,
      tenantId: input.tenantId,
      ipAddress,
    });
    pushAuditEvent("consent_logged", "Consent captured during registration", {
      userId,
      tenantId: input.tenantId,
      ipAddress,
    });

    return { success: true, verificationToken: verifyToken };
  },

  async verifyEmail(token: string): Promise<boolean> {
    await ensureSeedUsers();
    const tokenHash = await sha256(token.trim());
    let verifiedUserId: string | undefined;
    mutateSecurityState((state) => {
      const record = state.emailVerificationTokens.find(
        (entry) => entry.tokenHash === tokenHash && !entry.usedAt && !isExpired(entry.expiresAt),
      );
      if (!record) return;
      const user = state.users.find((entry) => entry.id === record.userId);
      if (!user) return;
      user.emailVerified = true;
      user.updatedAt = toIso(now());
      record.usedAt = toIso(now());
      verifiedUserId = user.id;
    });
    if (!verifiedUserId) return false;
    const verifiedUser = readSecurityState().users.find((user) => user.id === verifiedUserId);
    pushAuditEvent("email_verify", "Email verification completed", {
      userId: verifiedUserId,
      tenantId: verifiedUser?.tenantId,
    });
    return true;
  },

  async login(input: LoginInput): Promise<LoginResult> {
    await ensureSeedUsers();
    const email = normalizeEmail(input.email);
    const ipAddress = input.ipAddress ?? "0.0.0.0";
    const userAgent = input.userAgent ?? currentRequestContext().userAgent;
    const deviceLabel = input.deviceLabel ?? "Unknown device";

    if (isIpBlocked(ipAddress)) {
      pushAuditEvent("login_failure", "Blocked IP attempted login", { ipAddress });
      return { success: false, reason: "IP blocked due to suspicious activity." };
    }

    if (!consumeRateLimitBucket(`login:ip:${ipAddress}`, 30)) {
      return { success: false, reason: "Too many requests from this IP." };
    }

    const state = readSecurityState();
    const user = state.users.find((candidate) => candidate.email === email);
    if (!user) {
      pushAuditEvent("login_failure", "Unknown account login attempt", { ipAddress });
      return { success: false, reason: "Invalid email or password." };
    }

    if (user.lockedUntil && !isExpired(user.lockedUntil)) {
      return { success: false, reason: "Account temporarily locked." };
    }

    const passwordOk = await verifyPassword(input.password, user.password);
    if (!passwordOk) {
      let failedAttempts = 0;
      mutateSecurityState((next) => {
        const target = next.users.find((candidate) => candidate.id === user.id);
        if (!target) return;
        target.failedLoginAttempts += 1;
        failedAttempts = target.failedLoginAttempts;
        target.updatedAt = toIso(now());
        if (target.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          target.lockedUntil = toIso(addSeconds(now(), IP_BLOCK_SECONDS));
          blockIp(ipAddress, "Brute force threshold reached");
        }
      });

      pushAuditEvent("login_failure", "Invalid password", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
      });
      return {
        success: false,
        reason:
          failedAttempts >= MAX_FAILED_ATTEMPTS
            ? "Account locked due to repeated failed attempts."
            : "Invalid email or password.",
      };
    }

    if (!user.emailVerified) {
      return { success: false, reason: "Email verification required before login." };
    }

    if (input.tenantId && input.tenantId !== user.tenantId) {
      pushAuditEvent("login_failure", "Cross-tenant login blocked", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
      });
      return { success: false, reason: "Tenant mismatch." };
    }

    if (user.twoFactor.enabled) {
      const twoFactorOk = await verifyTwoFactor(user, {
        totpCode: input.totpCode,
        backupCode: input.backupCode,
      });
      if (!twoFactorOk) {
        pushAuditEvent("login_failure", "2FA challenge failed", {
          userId: user.id,
          tenantId: user.tenantId,
          ipAddress,
        });
        return { success: false, reason: "Invalid 2FA code." };
      }
    }

    const created = await createSession(user, ipAddress, userAgent, deviceLabel);

    mutateSecurityState((next) => {
      const target = next.users.find((entry) => entry.id === user.id);
      if (!target) return;
      target.failedLoginAttempts = 0;
      target.lockedUntil = undefined;
      target.updatedAt = toIso(now());
      if (!target.trustedDeviceFingerprints.includes(created.session.deviceFingerprint)) {
        target.trustedDeviceFingerprints.push(created.session.deviceFingerprint);
      }
      next.sessions.push(created.session);
    });

    const activeAuth: ActiveAuthState = {
      userId: user.id,
      sessionId: created.session.id,
      refreshToken: created.refreshToken,
    };
    writeActiveAuth(activeAuth);

    pushAuditEvent("login_success", "Login successful", {
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress,
      sessionId: created.session.id,
    });

    return {
      success: true,
      accessToken: created.accessToken,
      refreshToken: created.refreshToken,
      accessTokenExpiresAt: created.accessTokenExpiresAt,
      sessionId: created.session.id,
      user: toAuthUser(user),
    };
  },

  async refreshAccessToken(): Promise<{
    success: boolean;
    accessToken?: string;
    accessTokenExpiresAt?: string;
  }> {
    const active = readActiveAuth();
    if (!active) return { success: false };
    const refreshHash = await sha256(active.refreshToken);

    let userId: string | undefined;
    let sessionId: string | undefined;
    mutateSecurityState((state) => {
      const session = state.sessions.find(
        (item) =>
          item.id === active.sessionId &&
          !item.revokedAt &&
          !isExpired(item.refreshTokenExpiresAt) &&
          item.refreshTokenHash === refreshHash,
      );
      if (!session) return;
      userId = session.userId;
      sessionId = session.id;
      session.lastActiveAt = toIso(now());
    });
    if (!userId || !sessionId) {
      writeActiveAuth(null);
      return { success: false };
    }

    const user = readSecurityState().users.find((item) => item.id === userId);
    if (!user) {
      writeActiveAuth(null);
      return { success: false };
    }

    const token = await makeAccessToken(user, sessionId);
    return { success: true, accessToken: token.token, accessTokenExpiresAt: token.expiresAt };
  },

  logout(): void {
    const active = readActiveAuth();
    if (active) {
      mutateSecurityState((state) => {
        const session = state.sessions.find((item) => item.id === active.sessionId);
        if (session && !session.revokedAt) {
          session.revokedAt = toIso(now());
        }
      });
    }
    writeActiveAuth(null);
    if (active) {
      pushAuditEvent("logout", "User logged out", {
        sessionId: active.sessionId,
        userId: active.userId,
      });
    }
  },

  logoutAllDevices(): void {
    const active = readActiveAuth();
    if (!active) return;
    mutateSecurityState((state) => {
      state.sessions.forEach((session) => {
        if (session.userId === active.userId && !session.revokedAt) {
          session.revokedAt = toIso(now());
        }
      });
    });
    writeActiveAuth(null);
    pushAuditEvent("logout", "Logged out from all devices", { userId: active.userId });
  },

  listCurrentUserSessions(): SessionRecord[] {
    const active = readActiveAuth();
    if (!active) return [];
    return readSecurityState()
      .sessions.filter((session) => session.userId === active.userId)
      .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  },

  revokeSession(sessionId: string): boolean {
    const active = readActiveAuth();
    if (!active) return false;
    let revoked = false;
    mutateSecurityState((state) => {
      const target = state.sessions.find(
        (session) => session.id === sessionId && session.userId === active.userId,
      );
      if (!target || target.revokedAt) return;
      target.revokedAt = toIso(now());
      revoked = true;
    });
    if (sessionId === active.sessionId) {
      writeActiveAuth(null);
    }
    return revoked;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; resetToken?: string }> {
    await ensureSeedUsers();
    const normalizedEmail = normalizeEmail(email);
    const user = readSecurityState().users.find((candidate) => candidate.email === normalizedEmail);
    if (!user) return { success: true };

    const token = randomToken(28);
    const tokenHash = await sha256(token);

    mutateSecurityState((state) => {
      state.passwordResetTokens.push({
        id: randomId("pr"),
        userId: user.id,
        tokenHash,
        expiresAt: toIso(addSeconds(now(), PASSWORD_RESET_TTL_SECONDS)),
      });
    });
    pushAuditEvent("password_reset_requested", "Password reset requested", {
      userId: user.id,
      tenantId: user.tenantId,
    });
    return { success: true, resetToken: token };
  },

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenHash = await sha256(token.trim());
    let resetUserId: string | undefined;
    mutateSecurityState((state) => {
      const record = state.passwordResetTokens.find(
        (entry) => entry.tokenHash === tokenHash && !entry.usedAt && !isExpired(entry.expiresAt),
      );
      if (!record) return;
      const user = state.users.find((entry) => entry.id === record.userId);
      if (!user) return;
      record.usedAt = toIso(now());
      resetUserId = user.id;
    });
    if (!resetUserId) return false;

    const newHash = await hashPassword(newPassword);
    mutateSecurityState((state) => {
      const user = state.users.find((entry) => entry.id === resetUserId);
      if (!user) return;
      user.password = newHash;
      user.updatedAt = toIso(now());
      state.sessions.forEach((session) => {
        if (session.userId === user.id && !session.revokedAt) {
          session.revokedAt = toIso(now());
        }
      });
    });
    writeActiveAuth(null);
    const user = readSecurityState().users.find((entry) => entry.id === resetUserId);
    pushAuditEvent("password_reset_completed", "Password reset completed", {
      userId: resetUserId,
      tenantId: user?.tenantId,
    });
    return true;
  },

  async setupTotpForCurrentUser(): Promise<{ secret: string; otpauthUrl: string } | null> {
    const auth = this.getCurrentUser();
    if (!auth) return null;
    const secret = generateTotpSecret();
    const encryptedSecret = await encryptAesGcm(secret, auth.id);
    mutateSecurityState((state) => {
      const user = state.users.find((entry) => entry.id === auth.id);
      if (!user) return;
      user.twoFactor.encryptedSecret = encryptedSecret;
      user.updatedAt = toIso(now());
    });
    const otpauthUrl = `otpauth://totp/ERP%20Vala:${encodeURIComponent(auth.email)}?secret=${secret}&issuer=ERP%20Vala&period=30&digits=6`;
    return { secret, otpauthUrl };
  },

  async confirmTotpForCurrentUser(
    code: string,
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    const auth = this.getCurrentUser();
    if (!auth) return { success: false };

    const state = readSecurityState();
    const user = state.users.find((entry) => entry.id === auth.id);
    if (!user?.twoFactor.encryptedSecret) return { success: false };

    const secret = await decryptAesGcm(user.twoFactor.encryptedSecret, user.id);
    const ok = await verifyTotpCode(secret, code);
    if (!ok) return { success: false };

    const backupCodes = Array.from({ length: 8 }, () => randomToken(8).slice(0, 10).toUpperCase());
    const backupHashes = await Promise.all(backupCodes.map((item) => sha256(item)));

    mutateSecurityState((next) => {
      const target = next.users.find((entry) => entry.id === user.id);
      if (!target) return;
      target.twoFactor.enabled = true;
      target.twoFactor.backupCodeHashes = backupHashes;
      target.updatedAt = toIso(now());
    });

    return { success: true, backupCodes };
  },

  getCurrentUser(): AuthUser | null {
    const authState = findAuthenticatedState(readActiveAuth());
    if (!authState) return null;
    return toAuthUser(authState.user);
  },

  getCurrentUserRole(): Role | null {
    return this.getCurrentUser()?.role ?? null;
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  hasPermission(permission: Permission): boolean {
    const role = this.getCurrentUserRole();
    if (!role) return false;
    return hasPermission(role, permission);
  },

  canAccessRole(roles: Role[]): boolean {
    const role = this.getCurrentUserRole();
    if (!role) return false;
    return canAccessRole(role, roles);
  },

  assertTenantAccess(tenantId: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    if (currentUser.role === "admin" || currentUser.role === "support") return true;
    return currentUser.tenantId === tenantId;
  },

  getAuditEvents() {
    return readSecurityState().auditEvents;
  },

  getSecurityEvents() {
    return readSecurityState().auditEvents.filter((event) =>
      ["login_failure", "suspicious_device", "permission_changed"].includes(event.type),
    );
  },

  trackDataAccess(resource: string, action: string) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    pushAuditEvent("data_access", `Data access: ${action} ${resource}`, {
      userId: currentUser.id,
      tenantId: currentUser.tenantId,
    });
  },

  logPermissionChange(details: string) {
    const currentUser = this.getCurrentUser();
    pushAuditEvent("permission_changed", details, {
      userId: currentUser?.id,
      tenantId: currentUser?.tenantId,
    });
  },

  logConsent(consentType: string, accepted: boolean, ipAddress = "0.0.0.0") {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    const record: ConsentLog = {
      id: randomId("consent"),
      userId: currentUser.id,
      tenantId: currentUser.tenantId,
      consentType,
      accepted,
      ipAddress,
      createdAt: toIso(now()),
    };
    mutateSecurityState((state) => {
      state.consentLogs.unshift(record);
    });
    pushAuditEvent(
      "consent_logged",
      `Consent ${consentType}: ${accepted ? "accepted" : "rejected"}`,
      {
        userId: currentUser.id,
        tenantId: currentUser.tenantId,
        ipAddress,
      },
    );
  },

  async createApiKey(
    scopes: string[],
    rateLimitPerMinute = 120,
  ): Promise<{ id: string; apiKey: string } | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;
    const rawSecret = randomToken(24);
    const keyPrefix = `evk_${randomToken(5).slice(0, 8)}`;
    const apiKey = `${keyPrefix}.${rawSecret}`;
    const secretHash = await sha256(rawSecret);
    const record: ApiKeyRecord = {
      id: randomId("key"),
      ownerUserId: currentUser.id,
      tenantId: currentUser.tenantId,
      keyPrefix,
      secretHash,
      scopes,
      rateLimitPerMinute,
      createdAt: toIso(now()),
    };

    mutateSecurityState((state) => {
      state.apiKeys.push(record);
    });
    pushAuditEvent("api_key_created", `API key created with ${scopes.length} scope(s)`, {
      userId: currentUser.id,
      tenantId: currentUser.tenantId,
    });
    return { id: record.id, apiKey };
  },

  async revokeApiKey(id: string): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    let revoked = false;
    mutateSecurityState((state) => {
      const key = state.apiKeys.find(
        (candidate) => candidate.id === id && candidate.ownerUserId === currentUser.id,
      );
      if (!key || key.revokedAt) return;
      key.revokedAt = toIso(now());
      revoked = true;
    });
    if (revoked) {
      pushAuditEvent("api_key_revoked", "API key revoked", {
        userId: currentUser.id,
        tenantId: currentUser.tenantId,
      });
    }
    return revoked;
  },

  async verifyApiKey(apiKey: string, requiredScope: string, ipAddress: string): Promise<boolean> {
    const [prefix, rawSecret] = apiKey.split(".");
    if (!prefix || !rawSecret) return false;
    const state = readSecurityState();
    const candidate = state.apiKeys.find((key) => key.keyPrefix === prefix && !key.revokedAt);
    if (!candidate) return false;
    if (!candidate.scopes.includes(requiredScope)) return false;
    if (
      !consumeRateLimitBucket(`apikey:${candidate.id}:${ipAddress}`, candidate.rateLimitPerMinute)
    ) {
      return false;
    }
    const secretHash = await sha256(rawSecret);
    if (secretHash !== candidate.secretHash) return false;

    mutateSecurityState((next) => {
      const key = next.apiKeys.find((item) => item.id === candidate.id);
      if (!key) return;
      key.lastUsedAt = toIso(now());
    });

    return true;
  },

  async signHmacPayload(payload: string, secret: string): Promise<string> {
    return hmacSha256(payload, secret);
  },

  async verifyHmacPayload(payload: string, secret: string, signature: string): Promise<boolean> {
    return verifyHmacSha256(payload, secret, signature);
  },

  async checkAndStoreIdempotency(
    scope: string,
    key: string,
    requestBody: string,
  ): Promise<{
    accepted: boolean;
    repeated: boolean;
    responseHash?: string;
  }> {
    const requestHash = await sha256(requestBody);
    const existing = readSecurityState().idempotency.find(
      (item) => item.scope === scope && item.key === key,
    );
    if (!existing) {
      const responseHash = await sha256(`${scope}:${key}:${requestHash}`);
      mutateSecurityState((state) => {
        state.idempotency.push({
          scope,
          key,
          requestHash,
          responseHash,
          createdAt: toIso(now()),
        });
      });
      return { accepted: true, repeated: false, responseHash };
    }

    if (existing.requestHash !== requestHash) {
      return { accepted: false, repeated: true };
    }

    return { accepted: true, repeated: true, responseHash: existing.responseHash };
  },
};
