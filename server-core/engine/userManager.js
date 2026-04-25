const crypto = require("crypto");
const { run } = require("../utils/exec");
const alert = require("./alert");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Rate limiting for login attempts
const loginAttempts = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Paddle Role System integration (placeholder for external role system)
// In production, this would connect to Paddle's role management API
let paddleRoles = null;

// Default role definitions (fallback if Paddle not connected)
const defaultRoles = {
  OWNER: {
    id: "owner",
    name: "Owner",
    permissions: {
      domains: ["full"],
      files: ["full"],
      database: ["full"],
      mail: ["full"],
      security: ["full"],
      extensions: ["full"],
      server: ["full"],
      users: ["full"],
      billing: ["full"]
    },
    description: "Full access to all modules"
  },
  ADMIN: {
    id: "admin",
    name: "Admin",
    permissions: {
      domains: ["full"],
      files: ["full"],
      database: ["full"],
      mail: ["full"],
      security: ["full"],
      extensions: ["full"],
      server: ["full"],
      users: ["full"],
      billing: ["view"]
    },
    description: "Full server control except billing"
  },
  DEVELOPER: {
    id: "developer",
    name: "Developer",
    permissions: {
      domains: ["view"],
      files: ["full"],
      database: ["full"],
      mail: ["view"],
      security: [],
      extensions: ["view"],
      server: ["view"],
      users: ["view"],
      billing: []
    },
    description: "Files, Databases, Applications - No security or billing access"
  },
  OPERATOR: {
    id: "operator",
    name: "Operator",
    permissions: {
      domains: ["view"],
      files: ["view"],
      database: ["view"],
      mail: ["view"],
      security: ["view"],
      extensions: ["view"],
      server: ["view", "restart", "logs"],
      users: ["view"],
      billing: []
    },
    description: "Restart services, Logs, Monitoring"
  },
  DEPLOYER: {
    id: "deployer",
    name: "Deployer",
    permissions: {
      domains: ["view", "create"],
      files: ["view", "upload"],
      database: ["view", "create"],
      mail: ["view"],
      security: ["view"],
      extensions: ["view", "install"],
      server: ["view", "restart"],
      users: ["view"],
      billing: []
    },
    description: "Git deploy, Applications, Limited server control"
  }
};

// Get roles (from Paddle or fallback to defaults)
function getRoles() {
  return paddleRoles || defaultRoles;
}

// Connect to Paddle Role System (placeholder)
async function connectPaddleRoles(apiKey) {
  // In production, this would fetch roles from Paddle API
  // For now, we use default roles
  paddleRoles = defaultRoles;
  alert.info("Connected to Paddle Role System (using default roles)");
  return paddleRoles;
}

// Custom roles storage
const customRoles = {};

// Users storage (in production, use database)
const users = {
  admin: {
    username: "admin",
    passwordHash: await hashPassword("admin123"),
    role: "OWNER",
    email: "admin@server.com",
    suspended: false,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    apiKeys: [],
    twoFactorEnabled: false,
    twoFactorSecret: null,
    sshAccess: true,
    roleId: "owner"
  }
};

// Sessions storage with device info
const sessions = {};

// Activity logs
const activityLogs = [];

// Access logs
const accessLogs = [];

// API keys storage
const apiKeys = {};

// User limit
const MAX_USERS = 50;

// Invite tokens storage
const inviteTokens = {};

// Role usage count
const roleUsageCount = {};

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function generateApiKey() {
  return crypto.randomBytes(32).toString("hex");
}

function generateTwoFactorSecret() {
  return crypto.randomBytes(20).toString("base32");
}

function logActivity(username, action, module, details = "") {
  activityLogs.push({
    username,
    action,
    module,
    details,
    timestamp: new Date().toISOString(),
    ip: getCurrentIP()
  });
}

function logAccess(username, resource, action, success) {
  accessLogs.push({
    username,
    resource,
    action,
    success,
    timestamp: new Date().toISOString(),
    ip: getCurrentIP()
  });
}

function getCurrentIP() {
  // In production, get from request
  return "127.0.0.1";
}

// Check login rate limit
function checkLoginRateLimit(username, ip) {
  const key = `${username}:${ip}`;
  const now = Date.now();
  
  if (!loginAttempts[key]) {
    loginAttempts[key] = { count: 0, firstAttempt: now };
  }
  
  const attempts = loginAttempts[key];
  
  // Reset if window expired
  if (now - attempts.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
    loginAttempts[key] = { count: 0, firstAttempt: now };
    return true;
  }
  
  // Check if exceeded
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  return true;
}

// Reset login attempts
function resetLoginAttempts(username, ip) {
  const key = `${username}:${ip}`;
  delete loginAttempts[key];
}

async function createUser(username, password, role, email = null, createLinuxUser = false, createdBy = "admin") {
  // Permission check
  if (createdBy) {
    const creator = users[createdBy];
    if (creator && creator.role !== "OWNER" && creator.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can create users");
    }
  }
  
  // Edge case: duplicate username
  if (users[username]) {
    throw new Error("Username already exists");
  }

  // Edge case: user limit
  if (Object.keys(users).length >= MAX_USERS) {
    throw new Error("Maximum user limit reached");
  }

  // Edge case: invalid role
  const allRoles = getRoles();
  if (!allRoles[role] && !customRoles[role]) {
    throw new Error("Invalid role");
  }

  // Password policy check
  if (!isStrongPassword(password)) {
    throw new Error("Password does not meet strength requirements");
  }

  const user = {
    username,
    passwordHash: await hashPassword(password),
    role,
    email,
    suspended: false,
    createdAt: new Date().toISOString(),
    lastActive: null,
    apiKeys: [],
    twoFactorEnabled: false,
    twoFactorSecret: null,
    sshAccess: false,
    roleId: allRoles[role]?.id || role
  };

  users[username] = user;
  
  // Update role usage count
  roleUsageCount[role] = (roleUsageCount[role] || 0) + 1;

  // Optional: Create Linux user
  if (createLinuxUser) {
    try {
      await run(`useradd -m -s /bin/bash ${username}`);
      await run(`echo "${username}:${password}" | chpasswd`);
      alert.info(`Created Linux user: ${username}`);
    } catch (err) {
      alert.warning(`Failed to create Linux user: ${err}`);
    }
  }

  logActivity(createdBy, "create_user", "users", `Created user ${username} with role ${role}`);
  alert.info(`User created: ${username}`);
  
  return user;
}

async function updateUser(username, updates, updatedBy = "admin") {
  // Permission check
  if (updatedBy) {
    const updater = users[updatedBy];
    if (updater && updater.role !== "OWNER" && updater.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can update users");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  const user = users[username];

  if (updates.password) {
    if (!isStrongPassword(updates.password)) {
      throw new Error("Password does not meet strength requirements");
    }
    user.passwordHash = await hashPassword(updates.password);
  }

  if (updates.role) {
    // Permission check for role change
    if (updatedBy) {
      const updater = users[updatedBy];
      if (updater && updater.role !== "OWNER" && updater.role !== "ADMIN") {
        throw new Error("Permission denied. Only Owner and Admin can change roles");
      }
    }
    
    const allRoles = getRoles();
    if (!allRoles[updates.role] && !customRoles[updates.role]) {
      throw new Error("Invalid role");
    }
    
    // Update role usage count
    roleUsageCount[user.role]--;
    roleUsageCount[updates.role] = (roleUsageCount[updates.role] || 0) + 1;
    
    user.role = updates.role;
    user.roleId = allRoles[updates.role]?.id || updates.role;
    
    logActivity(updatedBy, "role_change", "users", `Changed role of ${username} to ${updates.role}`);
  }

  if (updates.email !== undefined) {
    user.email = updates.email;
  }

  if (updates.sshAccess !== undefined) {
    user.sshAccess = updates.sshAccess;
    await updateSSHAccess(username, updates.sshAccess);
  }

  logActivity(updatedBy, "update_user", "users", `Updated user ${username}`);
  alert.info(`User updated: ${username}`);
  
  return user;
}

async function resetPassword(username, newPassword, resetBy = "admin") {
  // Permission check
  if (resetBy) {
    const resetter = users[resetBy];
    if (resetter && resetter.role !== "OWNER" && resetter.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can reset passwords");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  if (!isStrongPassword(newPassword)) {
    throw new Error("Password does not meet strength requirements");
  }

  users[username].passwordHash = await hashPassword(newPassword);
  
  // Kill all sessions to force re-login
  killAllSessions(username);
  
  logActivity(resetBy, "reset_password", "users", `Reset password for ${username}`);
  alert.info(`Password reset for user: ${username}`);
  
  return users[username];
}

async function suspendUser(username, suspendedBy = "admin") {
  // Permission check
  if (suspendedBy) {
    const suspender = users[suspendedBy];
    if (suspender && suspender.role !== "OWNER" && suspender.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can suspend users");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  // Edge case: cannot suspend Owner
  if (users[username].role === "OWNER") {
    throw new Error("Cannot suspend Owner");
  }

  users[username].suspended = true;
  
  // Kill all sessions
  killAllSessions(username);
  
  logActivity(suspendedBy, "suspend_user", "users", `Suspended user ${username}`);
  alert.warning(`User suspended: ${username}`);
  
  return users[username];
}

async function activateUser(username, activatedBy = "admin") {
  // Permission check
  if (activatedBy) {
    const activator = users[activatedBy];
    if (activator && activator.role !== "OWNER" && activator.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can activate users");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  users[username].suspended = false;
  
  logActivity(activatedBy, "activate_user", "users", `Activated user ${username}`);
  alert.info(`User activated: ${username}`);
  
  return users[username];
}

async function deleteUser(username, deletedBy = "admin") {
  // Permission check
  if (deletedBy) {
    const deleter = users[deletedBy];
    if (deleter && deleter.role !== "OWNER" && deleter.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can delete users");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  // Edge case: cannot delete Owner
  if (users[username].role === "OWNER") {
    throw new Error("Cannot delete Owner");
  }

  // Edge case: cannot delete last admin
  const adminCount = Object.values(users).filter(u => u.role === "OWNER").length;
  if (adminCount <= 1 && users[username].role === "OWNER") {
    throw new Error("Cannot delete last Owner");
  }

  // Kill all sessions
  killAllSessions(username);

  // Delete Linux user if exists
  try {
    await run(`userdel -r ${username}`);
    alert.info(`Deleted Linux user: ${username}`);
  } catch (err) {
    // User might not exist in Linux
  }

  // Update role usage count
  roleUsageCount[users[username].role]--;

  delete users[username];
  
  logActivity(deletedBy, "delete_user", "users", `Deleted user ${username}`);
  alert.warning(`User deleted: ${username}`);
  
  return true;
}

// Soft delete (mark as deleted instead of actual delete)
async function softDeleteUser(username, deletedBy = "admin") {
  // Permission check
  if (deletedBy) {
    const deleter = users[deletedBy];
    if (deleter && deleter.role !== "OWNER" && deleter.role !== "ADMIN") {
      throw new Error("Permission denied. Only Owner and Admin can delete users");
    }
  }
  
  if (!users[username]) {
    throw new Error("User not found");
  }

  users[username].deleted = true;
  users[username].deletedAt = new Date().toISOString();
  users[username].deletedBy = deletedBy;
  
  // Kill all sessions
  killAllSessions(username);
  
  logActivity(deletedBy, "soft_delete_user", "users", `Soft deleted user ${username}`);
  alert.warning(`User soft deleted: ${username}`);
  
  return users[username];
}

function checkPermission(username, module, action) {
  const user = users[username];
  if (!user) return false;

  if (user.suspended) return false;

  const allRoles = getRoles();
  const role = allRoles[user.role] || customRoles[user.role];
  if (!role) return false;

  const modulePermissions = role.permissions[module] || [];
  
  if (modulePermissions.includes("full")) return true;
  if (modulePermissions.includes(action)) return true;
  
  return false;
}

function createSession(username, ip, deviceInfo = {}) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions[sessionId] = {
    username,
    ip,
    deviceInfo,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  users[username].lastActive = new Date().toISOString();
  logActivity(username, "login", "auth", `Login from ${ip} - ${deviceInfo.userAgent || 'Unknown device'}`);
  
  return sessionId;
}

function validateSession(sessionId) {
  const session = sessions[sessionId];
  if (!session) return null;
  
  // Check if user is suspended
  const user = users[session.username];
  if (user && user.suspended) {
    delete sessions[sessionId];
    return null;
  }
  
  session.lastActivity = new Date().toISOString();
  return session;
}

function killSession(sessionId, killedBy = "system") {
  const session = sessions[sessionId];
  if (session) {
    logActivity(killedBy, "logout", "auth", `Session ended for ${session.username}`);
    delete sessions[sessionId];
  }
}

function killAllSessions(username, killedBy = "admin") {
  for (const [sessionId, session] of Object.entries(sessions)) {
    if (session.username === username) {
      delete sessions[sessionId];
    }
  }
  logActivity(killedBy, "logout_all", "auth", `Killed all sessions for ${username}`);
}

function getActiveSessions(username) {
  return Object.values(sessions).filter(s => s.username === username);
}

function getAllSessions() {
  return Object.values(sessions);
}

// Invite user functionality
function generateInviteToken(username, role, expiresHours = 24) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();
  
  inviteTokens[token] = {
    username,
    role,
    expiresAt,
    createdAt: new Date().toISOString(),
    used: false
  };
  
  return token;
}

function validateInviteToken(token) {
  const invite = inviteTokens[token];
  if (!invite) return null;
  
  if (invite.used) return null;
  
  if (new Date() > new Date(invite.expiresAt)) {
    delete inviteTokens[token];
    return null;
  }
  
  return invite;
}

function useInviteToken(token) {
  const invite = inviteTokens[token];
  if (invite) {
    invite.used = true;
    return invite;
  }
  return null;
}

// Search + filter users
function searchUsers(query, filters = {}) {
  let userList = Object.values(users);
  
  // Search by username or email
  if (query) {
    const lowerQuery = query.toLowerCase();
    userList = userList.filter(u => 
      u.username.toLowerCase().includes(lowerQuery) ||
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    );
  }
  
  // Filter by role
  if (filters.role) {
    userList = userList.filter(u => u.role === filters.role);
  }
  
  // Filter by status
  if (filters.status === "active") {
    userList = userList.filter(u => !u.suspended);
  } else if (filters.status === "suspended") {
    userList = userList.filter(u => u.suspended);
  }
  
  // Filter by deleted
  if (filters.deleted === true) {
    userList = userList.filter(u => u.deleted);
  } else if (filters.deleted === false) {
    userList = userList.filter(u => !u.deleted);
  }
  
  return userList.map(u => ({
    username: u.username,
    role: u.role,
    email: u.email,
    suspended: u.suspended,
    createdAt: u.createdAt,
    lastActive: u.lastActive,
    sshAccess: u.sshAccess,
    twoFactorEnabled: u.twoFactorEnabled,
    deleted: u.deleted
  }));
}

// Bulk suspend/activate
async function bulkSuspendUsers(usernames, suspendedBy = "admin") {
  const results = [];
  
  for (const username of usernames) {
    try {
      await suspendUser(username, suspendedBy);
      results.push({ username, success: true });
    } catch (err) {
      results.push({ username, success: false, error: err.message });
    }
  }
  
  return results;
}

async function bulkActivateUsers(usernames, activatedBy = "admin") {
  const results = [];
  
  for (const username of usernames) {
    try {
      await activateUser(username, activatedBy);
      results.push({ username, success: true });
    } catch (err) {
      results.push({ username, success: false, error: err.message });
    }
  }
  
  return results;
}

// Get role usage count
function getRoleUsageCount() {
  return roleUsageCount;
}

// Self-heal functions
async function selfHealUser(username) {
  if (!users[username]) {
    throw new Error("User not found");
  }
  
  const user = users[username];
  const allRoles = getRoles();
  
  // Invalid role fallback
  if (!allRoles[user.role] && !customRoles[user.role]) {
    const oldRole = user.role;
    user.role = "DEVELOPER"; // Fallback to safe role
    user.roleId = "developer";
    logActivity("system", "role_fallback", "users", `Invalid role ${oldRole} for ${username}, fallback to DEVELOPER`);
    alert.warning(`Invalid role detected for ${username}, fallback to DEVELOPER`);
  }
  
  // Missing permission re-sync
  const role = allRoles[user.role] || customRoles[user.role];
  if (role && !user.roleId) {
    user.roleId = role.id || user.role;
  }
  
  return user;
}

async function handleSessionConflict(username, ip) {
  // Check for existing sessions from different IPs
  const existingSessions = getActiveSessions(username);
  const differentIPSessions = existingSessions.filter(s => s.ip !== ip);
  
  if (differentIPSessions.length > 0) {
    // Auto logout old sessions
    for (const session of differentIPSessions) {
      killSession(Object.keys(sessions).find(k => sessions[k] === session), "auto_conflict");
    }
    logActivity("system", "session_conflict", "auth", `Auto-logged out old sessions for ${username} due to IP conflict`);
    alert.info(`Auto-logged out old sessions for ${username} due to IP conflict`);
  }
}

// Login function with rate limiting
async function login(username, password, ip, deviceInfo = {}) {
  // Rate limit check
  if (!checkLoginRateLimit(username, ip)) {
    throw new Error("Too many login attempts. Please try again later.");
  }
  
  const user = users[username];
  if (!user) {
    logAccess(username, "login", "auth", false);
    throw new Error("Invalid credentials");
  }
  
  if (user.suspended) {
    logAccess(username, "login", "auth", false);
    throw new Error("Account suspended");
  }
  
  if (user.deleted) {
    logAccess(username, "login", "auth", false);
    throw new Error("Account deleted");
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    logAccess(username, "login", "auth", false);
    throw new Error("Invalid credentials");
  }
  
  // Reset login attempts on success
  resetLoginAttempts(username, ip);
  
  // Handle session conflict
  await handleSessionConflict(username, ip);
  
  // Create session
  const sessionId = createSession(username, ip, deviceInfo);
  
  logAccess(username, "login", "auth", true);
  
  return {
    sessionId,
    user: {
      username: user.username,
      role: user.role,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled
    }
  };
}

function enableTwoFactor(username) {
  if (!users[username]) {
    throw new Error("User not found");
  }

  const secret = generateTwoFactorSecret();
  users[username].twoFactorSecret = secret;
  users[username].twoFactorEnabled = true;
  
  logActivity(username, "enable_2fa", "security", "2FA enabled");
  alert.info(`2FA enabled for user: ${username}`);
  
  return secret;
}

function disableTwoFactor(username) {
  if (!users[username]) {
    throw new Error("User not found");
  }

  users[username].twoFactorSecret = null;
  users[username].twoFactorEnabled = false;
  
  logActivity(username, "disable_2fa", "security", "2FA disabled");
  alert.info(`2FA disabled for user: ${username}`);
}

function isStrongPassword(password) {
  // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

function createCustomRole(name, baseRole, permissionOverrides) {
  const base = roles[baseRole] || customRoles[baseRole];
  if (!base) {
    throw new Error("Base role not found");
  }

  const newRole = {
    name,
    permissions: JSON.parse(JSON.stringify(base.permissions)),
    description: `Custom role based on ${baseRole}`
  };

  // Apply overrides
  for (const [module, perms] of Object.entries(permissionOverrides)) {
    newRole.permissions[module] = perms;
  }

  customRoles[name] = newRole;
  
  logActivity("admin", "create_role", "users", `Created custom role ${name}`);
  alert.info(`Custom role created: ${name}`);
  
  return newRole;
}

function generateApiKeyForUser(username, accessLevel = "read") {
  if (!users[username]) {
    throw new Error("User not found");
  }

  const apiKey = generateApiKey();
  users[username].apiKeys.push(apiKey);
  
  apiKeys[apiKey] = {
    username,
    accessLevel,
    createdAt: new Date().toISOString()
  };
  
  logActivity(username, "generate_api_key", "api", `Generated API key with ${accessLevel} access`);
  alert.info(`API key generated for user: ${username}`);
  
  return apiKey;
}

function revokeApiKey(apiKey) {
  if (!apiKeys[apiKey]) {
    throw new Error("API key not found");
  }

  const username = apiKeys[apiKey].username;
  users[username].apiKeys = users[username].apiKeys.filter(k => k !== apiKey);
  delete apiKeys[apiKey];
  
  logActivity(username, "revoke_api_key", "api", "API key revoked");
  alert.info(`API key revoked for user: ${username}`);
}

async function updateSSHAccess(username, allow) {
  try {
    if (allow) {
      await run(`usermod -aG ssh ${username}`);
      alert.info(`SSH access granted to ${username}`);
    } else {
      await run(`gpasswd -d ${username} ssh`);
      alert.info(`SSH access revoked from ${username}`);
    }
  } catch (err) {
    alert.warning(`Failed to update SSH access: ${err}`);
  }
}

function getActivityLogs(username = null, limit = 100) {
  let logs = [...activityLogs];
  
  if (username) {
    logs = logs.filter(l => l.username === username);
  }
  
  return logs.slice(-limit).reverse();
}

function getAccessLogs(username = null, limit = 100) {
  let logs = [...accessLogs];
  
  if (username) {
    logs = logs.filter(l => l.username === username);
  }
  
  return logs.slice(-limit).reverse();
}

function getUsers() {
  return Object.values(users).map(u => ({
    username: u.username,
    role: u.role,
    email: u.email,
    suspended: u.suspended,
    createdAt: u.createdAt,
    lastActive: u.lastActive,
    sshAccess: u.sshAccess,
    twoFactorEnabled: u.twoFactorEnabled
  }));
}

function getRoles() {
  return { ...roles, ...customRoles };
}

exports.createUser = createUser;
exports.updateUser = updateUser;
exports.resetPassword = resetPassword;
exports.suspendUser = suspendUser;
exports.activateUser = activateUser;
exports.deleteUser = deleteUser;
exports.softDeleteUser = softDeleteUser;
exports.checkPermission = checkPermission;
exports.createSession = createSession;
exports.validateSession = validateSession;
exports.killSession = killSession;
exports.killAllSessions = killAllSessions;
exports.getActiveSessions = getActiveSessions;
exports.getAllSessions = getAllSessions;
exports.enableTwoFactor = enableTwoFactor;
exports.disableTwoFactor = disableTwoFactor;
exports.isStrongPassword = isStrongPassword;
exports.createCustomRole = createCustomRole;
exports.generateApiKeyForUser = generateApiKeyForUser;
exports.revokeApiKey = revokeApiKey;
exports.updateSSHAccess = updateSSHAccess;
exports.getActivityLogs = getActivityLogs;
exports.getAccessLogs = getAccessLogs;
exports.getUsers = getUsers;
exports.getRoles = getRoles;
exports.connectPaddleRoles = connectPaddleRoles;
exports.logAccess = logAccess;
exports.generateInviteToken = generateInviteToken;
exports.validateInviteToken = validateInviteToken;
exports.useInviteToken = useInviteToken;
exports.searchUsers = searchUsers;
exports.bulkSuspendUsers = bulkSuspendUsers;
exports.bulkActivateUsers = bulkActivateUsers;
exports.getRoleUsageCount = getRoleUsageCount;
exports.selfHealUser = selfHealUser;
exports.handleSessionConflict = handleSessionConflict;
exports.login = login;
exports.checkLoginRateLimit = checkLoginRateLimit;
exports.resetLoginAttempts = resetLoginAttempts;
