const { run } = require("../utils/exec");
const alert = require("./alert");
const permissionControl = require("./permissionControl");

// Server Manager Role Permissions
const SERVER_MANAGER_PERMISSIONS = {
  // Can manage
  domains: { add: true, edit: true, delete: true, ssl: true, dns: false },
  files: { upload: true, edit: true, delete: true, permissions: true, system: false },
  databases: { create: true, users: true, backup: true, restore: true, root: false },
  mail: { create: true, edit: true, quota: true, forward: true },
  applications: { install: true, monitor: true, custom: false },
  security: { view: true, edit: false, firewall: false, ipBlock: false },
  tools: { view: true, safe: true, restart: false, phpCore: false },
  extensions: { view: true, install: false, uninstall: false },
  users: { create: true, edit: true, roles: { admin: false, owner: false, server_manager: false, deployer: true, operator: true, developer: true } },
  logs: { read: true, filter: true, download: true }
};

// Plan Limits (configurable per plan)
const PLAN_LIMITS = {
  basic: { maxDomains: 5, maxDatabases: 3, maxStorageGB: 10, maxUsers: 5 },
  pro: { maxDomains: 20, maxDatabases: 10, maxStorageGB: 50, maxUsers: 20 },
  enterprise: { maxDomains: 999, maxDatabases: 999, maxStorageGB: 1000, maxUsers: 999 }
};

// Current usage tracking
const currentUsage = {
  domains: 0,
  databases: 0,
  storageGB: 0,
  users: 0
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  cpuHigh: 80,
  diskLow: 10,
  memoryHigh: 85
};

// Action Control Layer
async function checkActionControl(role, module, action, userId = null) {
  try {
    // Check role
    if (role !== "server_manager" && role !== "admin" && role !== "owner") {
      throw new Error("Permission denied. Only Server Manager, Admin, and Owner can perform this action");
    }
    
    // If admin or owner, allow all
    if (role === "admin" || role === "owner") {
      return { allowed: true };
    }
    
    // Check module permission for server_manager
    if (!SERVER_MANAGER_PERMISSIONS[module]) {
      throw new Error("Module not found in permissions");
    }
    
    const modulePerms = SERVER_MANAGER_PERMISSIONS[module];
    
    // Check specific action permission
    if (modulePerms[action] === false) {
      throw new Error(`Action '${action}' is not allowed for Server Manager in module '${module}'`);
    }
    
    // Check plan limits
    await checkPlanLimits(module, action);
    
    // Log action
    logManagerAction("action_checked", `Action control check passed: ${module}.${action} by user ${userId}`);
    
    return { allowed: true };
  } catch (err) {
    logManagerAction("action_denied", `Action control check failed: ${module}.${action} - ${err}`);
    alert.warning(`Action denied: ${err}`);
    throw err;
  }
}

// Check Plan Limits
async function checkPlanLimits(module, action, plan = "basic") {
  try {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    
    if (module === "domains" && action === "add") {
      if (currentUsage.domains >= limits.maxDomains) {
        throw new Error(`Domain limit reached (${limits.maxDomains}). Please upgrade your plan.`);
      }
    }
    
    if (module === "databases" && action === "create") {
      if (currentUsage.databases >= limits.maxDatabases) {
        throw new Error(`Database limit reached (${limits.maxDatabases}). Please upgrade your plan.`);
      }
    }
    
    if (module === "files" && action === "upload") {
      if (currentUsage.storageGB >= limits.maxStorageGB) {
        throw new Error(`Storage limit reached (${limits.maxStorageGB}GB). Please upgrade your plan.`);
      }
    }
    
    if (module === "users" && action === "create") {
      if (currentUsage.users >= limits.maxUsers) {
        throw new Error(`User limit reached (${limits.maxUsers}). Please upgrade your plan.`);
      }
    }
    
    return { allowed: true };
  } catch (err) {
    alert.critical(`Plan limit exceeded: ${err}`);
    throw err;
  }
}

// Get Dashboard Data
async function getDashboardData(plan = "basic") {
  try {
    // Get real-time metrics
    const cpuUsage = await run("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    const memoryUsage = await run("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
    const diskUsage = await run("df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1");
    const networkIn = await run("cat /proc/net/dev | grep eth0 | awk '{print $2}'");
    const networkOut = await run("cat /proc/net/dev | grep eth0 | awk '{print $10}'");
    
    // Get active services
    const serviceManager = require("./serviceManager");
    const services = await serviceManager.getServices();
    const activeServices = services.filter(s => s.status === "running").length;
    
    // Get recent alerts
    const recentAlerts = await getRecentAlerts();
    
    // Get plan limits
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    
    // Check for warnings
    const warnings = [];
    if (parseFloat(cpuUsage) > ALERT_THRESHOLDS.cpuHigh) {
      warnings.push({ type: "cpu_high", message: `High CPU usage: ${cpuUsage}%` });
    }
    if (parseFloat(diskUsage) > (100 - ALERT_THRESHOLDS.diskLow)) {
      warnings.push({ type: "disk_low", message: `Low disk space: ${100 - parseFloat(diskUsage)}% remaining` });
    }
    if (parseFloat(memoryUsage) > ALERT_THRESHOLDS.memoryHigh) {
      warnings.push({ type: "memory_high", message: `High memory usage: ${memoryUsage}%` });
    }
    
    return {
      metrics: {
        cpu: parseFloat(cpuUsage) || 0,
        memory: parseFloat(memoryUsage) || 0,
        disk: parseFloat(diskUsage) || 0,
        network: { in: networkIn, out: networkOut }
      },
      services: {
        active: activeServices,
        total: services.length
      },
      alerts: recentAlerts,
      warnings,
      limits,
      usage: currentUsage
    };
  } catch (err) {
    alert.warning(`Failed to get dashboard data: ${err}`);
    throw err;
  }
}

// Get Plan Limits
async function getPlanLimits(plan = "basic") {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
}

// Get Current Usage
async function getCurrentUsage() {
  try {
    // Count domains
    const domainManager = require("./domainManager");
    const domains = await domainManager.getDomains();
    currentUsage.domains = domains.length;
    
    // Count databases
    const databaseManager = require("./databaseManager");
    const databases = await databaseManager.getDatabases();
    currentUsage.databases = databases.length;
    
    // Calculate storage
    const diskUsage = await run("du -sh /var/www | awk '{print $1}'");
    currentUsage.storageGB = parseFloat(diskUsage) || 0;
    
    // Count users (excluding system users)
    const userManager = require("./userManager");
    const users = await userManager.getUsers();
    currentUsage.users = users.length;
    
    return currentUsage;
  } catch (err) {
    alert.warning(`Failed to get current usage: ${err}`);
    return currentUsage;
  }
}

// Get Recent Alerts
async function getRecentAlerts(limit = 10) {
  try {
    // Get alerts from alert system
    const alertLogs = await alert.getAlerts(limit);
    return alertLogs;
  } catch (err) {
    return [];
  }
}

// Self-Heal Auto Control
async function autoHealControl() {
  try {
    const dashboard = await getDashboardData();
    
    // Service crash auto restart (if allowed)
    if (dashboard.services.active < dashboard.services.total) {
      const serviceManager = require("./serviceManager");
      await serviceManager.autoHealServices();
      logManagerAction("auto_heal", "Auto-heal triggered for services");
    }
    
    // High load notify
    if (dashboard.metrics.cpu > ALERT_THRESHOLDS.cpuHigh) {
      alert.critical(`High CPU usage detected: ${dashboard.metrics.cpu}%`);
      logManagerAction("high_load", `High CPU alert: ${dashboard.metrics.cpu}%`);
    }
    
    // Low disk notify
    if (dashboard.metrics.disk > (100 - ALERT_THRESHOLDS.diskLow)) {
      alert.critical(`Low disk space detected: ${100 - dashboard.metrics.disk}% remaining`);
      logManagerAction("low_disk", `Low disk alert: ${100 - dashboard.metrics.disk}% remaining`);
    }
    
    // Failed task retry (would be integrated with task queue)
    await retryFailedTasks();
    
  } catch (err) {
    alert.warning(`Auto-heal control failed: ${err}`);
  }
}

// Retry Failed Tasks
async function retryFailedTasks() {
  try {
    const appManager = require("./appManager");
    const queue = await appManager.getInstallQueue();
    
    const failedJobs = queue.filter(j => j.status === "failed");
    
    for (const job of failedJobs) {
      const retryCount = job.retryCount || 0;
      if (retryCount < 3) {
        logManagerAction("task_retry", `Retrying failed job: ${job.jobId} (attempt ${retryCount + 1}/3)`);
        await appManager.retryInstall(job.jobId);
      }
    }
  } catch (err) {
    // App manager might not be available
  }
}

// Manager-Specific Domain Operations
async function managerAddDomain(domain, rootPath, sslEnabled, userId, role, plan = "basic") {
  try {
    await checkActionControl(role, "domains", "add", userId);
    
    const domainManager = require("./domainManager");
    const result = await domainManager.addDomain(domain, rootPath, "srv-prod-01", sslEnabled);
    
    // Update usage
    await getCurrentUsage();
    
    logManagerAction("domain_added", `Domain added by manager: ${domain} by user ${userId}`);
    
    return result;
  } catch (err) {
    alert.warning(`Manager add domain failed: ${err}`);
    throw err;
  }
}

// Manager-Specific Database Operations
async function managerCreateDatabase(dbName, engine, username, password, userId, role, plan = "basic") {
  try {
    await checkActionControl(role, "databases", "create", userId);
    
    const databaseManager = require("./databaseManager");
    const result = await databaseManager.createDatabase(dbName, engine, username, password);
    
    // Update usage
    await getCurrentUsage();
    
    logManagerAction("db_created", `Database created by manager: ${dbName} by user ${userId}`);
    
    return result;
  } catch (err) {
    alert.warning(`Manager create database failed: ${err}`);
    throw err;
  }
}

// Get Manager Logs
async function getManagerLogs(limit = 100) {
  try {
    const logs = await getManagerAuditLogs(limit);
    return logs;
  } catch (err) {
    alert.warning(`Failed to get manager logs: ${err}`);
    return [];
  }
}

// Security: Validate Inputs
function validateInput(input, type) {
  const sanitized = input.trim();
  
  // Prevent command injection
  if (/[;&|`$()]/.test(sanitized)) {
    throw new Error("Invalid input: potential command injection detected");
  }
  
  // Type-specific validation
  if (type === "domain") {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(sanitized)) {
      throw new Error("Invalid domain format");
    }
  }
  
  if (type === "path") {
    if (!sanitized.startsWith("/var/www/")) {
      throw new Error("Invalid path: must be under /var/www/");
    }
  }
  
  return sanitized;
}

// Block Root Commands
function blockRootCommand(command) {
  const dangerousCommands = [
    "rm -rf /",
    "dd if=",
    ":(){:|:&};:",
    "mkfs",
    "fdisk",
    "reboot",
    "shutdown",
    "init 0",
    "kill -9 -1"
  ];
  
  for (const dangerous of dangerousCommands) {
    if (command.includes(dangerous)) {
      throw new Error("Dangerous command blocked: root-level operation not allowed");
    }
  }
  
  return true;
}

// Log Manager Action
function logManagerAction(type, message) {
  const log = {
    type,
    message,
    timestamp: new Date().toISOString(),
    role: "server_manager"
  };
  
  // Add to alert system for tracking
  alert.info(`[Manager] ${message}`);
}

// Get Manager Audit Logs
async function getManagerAuditLogs(limit = 100) {
  try {
    // This would typically come from a database
    // For now, return recent alert logs
    return await alert.getAlerts(limit);
  } catch (err) {
    return [];
  }
}

// Get Usage Trends (last 24h)
async function getUsageTrends() {
  try {
    // This would typically come from a metrics database
    // For now, return current metrics with timestamp
    const dashboard = await getDashboardData();
    
    return {
      cpu: { current: dashboard.metrics.cpu, trend: "stable" },
      memory: { current: dashboard.metrics.memory, trend: "stable" },
      disk: { current: dashboard.metrics.disk, trend: "stable" },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {};
  }
}

// Check Module Access
function checkModuleAccess(role, module) {
  if (role === "admin" || role === "owner") {
    return true;
  }
  
  if (role === "server_manager") {
    return SERVER_MANAGER_PERMISSIONS[module] !== undefined;
  }
  
  return false;
}

// Get Allowed Actions for Module
function getAllowedActions(role, module) {
  if (role === "admin" || role === "owner") {
    return "all";
  }
  
  if (role === "server_manager" && SERVER_MANAGER_PERMISSIONS[module]) {
    return SERVER_MANAGER_PERMISSIONS[module];
  }
  
  return {};
}

// Exports
exports.checkActionControl = checkActionControl;
exports.checkPlanLimits = checkPlanLimits;
exports.getDashboardData = getDashboardData;
exports.getPlanLimits = getPlanLimits;
exports.getCurrentUsage = getCurrentUsage;
exports.getRecentAlerts = getRecentAlerts;
exports.autoHealControl = autoHealControl;
exports.managerAddDomain = managerAddDomain;
exports.managerCreateDatabase = managerCreateDatabase;
exports.getManagerLogs = getManagerLogs;
exports.validateInput = validateInput;
exports.blockRootCommand = blockRootCommand;
exports.getUsageTrends = getUsageTrends;
exports.checkModuleAccess = checkModuleAccess;
exports.getAllowedActions = getAllowedActions;
exports.SERVER_MANAGER_PERMISSIONS = SERVER_MANAGER_PERMISSIONS;
exports.PLAN_LIMITS = PLAN_LIMITS;
