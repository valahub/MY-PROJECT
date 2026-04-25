const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");

// Whitelisted services
const ALLOWED_SERVICES = [
  "nginx",
  "apache2",
  "postgresql",
  "mysql",
  "mariadb",
  "redis",
  "redis-server",
  "postfix",
  "dovecot",
  "php-fpm",
  "php8.2-fpm",
  "php8.1-fpm",
  "php8.0-fpm",
  "supervisor",
  "fail2ban",
  "ssh",
  "sshd",
  "cron"
];

// Service status storage
const serviceStatus = {};

// Service logs
const serviceLogs = [];

// Retry tracking for auto-heal
const serviceRetries = {};

// Rate limiting for restarts
const restartRateLimit = {};

// Permission check
function checkPermission(role) {
  if (role !== "admin" && role !== "server_manager") {
    throw new Error("Permission denied. Only Admin and Server Manager can control services");
  }
  return true;
}

// Validate service name
function validateService(service) {
  if (!ALLOWED_SERVICES.includes(service)) {
    throw new Error("Service not allowed or not found in whitelist");
  }
  return true;
}

// Get All Services
async function getServices() {
  try {
    const services = [];
    
    for (const service of ALLOWED_SERVICES) {
      const status = await getServiceStatus(service);
      services.push({
        name: service,
        ...status
      });
    }
    
    return services;
  } catch (err) {
    alert.warning(`Failed to get services: ${err}`);
    return [];
  }
}

// Get Service Status
async function getServiceStatus(service) {
  try {
    validateService(service);
    
    const isActive = await run(`systemctl is-active ${service}`);
    const isEnabled = await run(`systemctl is-enabled ${service}`);
    const status = isActive.trim();
    
    let serviceState = "stopped";
    let lastError = null;
    
    if (status === "active") {
      serviceState = "running";
    } else if (status === "inactive") {
      serviceState = "stopped";
    } else if (status === "failed") {
      serviceState = "error";
      lastError = await getServiceError(service);
    } else if (status === "unknown") {
      serviceState = "not_found";
    }
    
    // Update storage
    serviceStatus[service] = {
      name: service,
      status: serviceState,
      enabled: isEnabled.trim() === "enabled",
      lastError,
      lastChecked: new Date().toISOString()
    };
    
    return serviceStatus[service];
  } catch (err) {
    return {
      name: service,
      status: "error",
      enabled: false,
      lastError: err.message,
      lastChecked: new Date().toISOString()
    };
  }
}

// Get Service Error
async function getServiceError(service) {
  try {
    const logs = await run(`journalctl -u ${service} -n 10 --no-pager`);
    const errorLines = logs.split('\n').filter(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed') ||
      line.toLowerCase().includes('fatal')
    );
    
    return errorLines.length > 0 ? errorLines[errorLines.length - 1].trim() : "Unknown error";
  } catch (err) {
    return "Failed to retrieve error logs";
  }
}

// Restart Service
async function restartService(service, username = "admin", role = "admin") {
  try {
    checkPermission(role);
    validateService(service);
    
    // Rate limiting
    const now = Date.now();
    if (restartRateLimit[service] && now - restartRateLimit[service] < 5000) {
      throw new Error("Rate limit exceeded. Please wait 5 seconds before restarting again");
    }
    restartRateLimit[service] = now;
    
    // Log action
    logServiceAction("restart_initiated", `Service restart initiated: ${service} by ${username}`);
    
    // Execute restart
    const result = await run(`systemctl restart ${service}`);
    
    // Check new status
    const newStatus = await getServiceStatus(service);
    
    if (newStatus.status === "running") {
      logServiceAction("restart_success", `Service restarted successfully: ${service} by ${username}`);
      alert.info(`Service restarted: ${service}`);
      
      // Reset retry count on success
      delete serviceRetries[service];
      
      return {
        success: true,
        service,
        newStatus: newStatus.status,
        message: "Service restarted successfully"
      };
    } else {
      // Auto self-heal: retry up to 3 times
      const retryCount = serviceRetries[service] || 0;
      
      if (retryCount < 3) {
        serviceRetries[service] = retryCount + 1;
        logServiceAction("restart_retry", `Service restart retry ${retryCount + 1}/3: ${service}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await restartService(service, username, role);
      } else {
        // Max retries reached
        delete serviceRetries[service];
        logServiceAction("restart_failed", `Service restart failed after 3 retries: ${service}`);
        alert.critical(`Service restart failed after 3 retries: ${service}`);
        
        return {
          success: false,
          service,
          newStatus: newStatus.status,
          message: "Service restart failed after 3 retries",
          lastError: newStatus.lastError
        };
      }
    }
  } catch (err) {
    logServiceAction("restart_error", `Service restart error for ${service}: ${err}`);
    alert.warning(`Failed to restart service: ${err}`);
    
    return {
      success: false,
      service,
      message: err.message
    };
  }
}

// Start Service
async function startService(service, username = "admin", role = "admin") {
  try {
    checkPermission(role);
    validateService(service);
    
    logServiceAction("start_initiated", `Service start initiated: ${service} by ${username}`);
    
    await run(`systemctl start ${service}`);
    
    const newStatus = await getServiceStatus(service);
    
    logServiceAction("start_success", `Service started successfully: ${service} by ${username}`);
    alert.info(`Service started: ${service}`);
    
    return {
      success: true,
      service,
      newStatus: newStatus.status
    };
  } catch (err) {
    logServiceAction("start_error", `Service start error for ${service}: ${err}`);
    alert.warning(`Failed to start service: ${err}`);
    
    return {
      success: false,
      service,
      message: err.message
    };
  }
}

// Stop Service
async function stopService(service, username = "admin", role = "admin") {
  try {
    checkPermission(role);
    validateService(service);
    
    logServiceAction("stop_initiated", `Service stop initiated: ${service} by ${username}`);
    
    await run(`systemctl stop ${service}`);
    
    const newStatus = await getServiceStatus(service);
    
    logServiceAction("stop_success", `Service stopped successfully: ${service} by ${username}`);
    alert.info(`Service stopped: ${service}`);
    
    return {
      success: true,
      service,
      newStatus: newStatus.status
    };
  } catch (err) {
    logServiceAction("stop_error", `Service stop error for ${service}: ${err}`);
    alert.warning(`Failed to stop service: ${err}`);
    
    return {
      success: false,
      service,
      message: err.message
    };
  }
}

// Enable Service
async function enableService(service, username = "admin", role = "admin") {
  try {
    checkPermission(role);
    validateService(service);
    
    await run(`systemctl enable ${service}`);
    
    logServiceAction("service_enabled", `Service enabled: ${service} by ${username}`);
    alert.info(`Service enabled: ${service}`);
    
    return {
      success: true,
      service
    };
  } catch (err) {
    alert.warning(`Failed to enable service: ${err}`);
    throw err;
  }
}

// Disable Service
async function disableService(service, username = "admin", role = "admin") {
  try {
    checkPermission(role);
    validateService(service);
    
    await run(`systemctl disable ${service}`);
    
    logServiceAction("service_disabled", `Service disabled: ${service} by ${username}`);
    alert.info(`Service disabled: ${service}`);
    
    return {
      success: true,
      service
    };
  } catch (err) {
    alert.warning(`Failed to disable service: ${err}`);
    throw err;
  }
}

// Get Service Logs
async function getServiceLogs(service, lines = 50) {
  try {
    validateService(service);
    
    const logs = await run(`journalctl -u ${service} -n ${lines} --no-pager`);
    
    return {
      service,
      logs: logs.split('\n'),
      lines
    };
  } catch (err) {
    alert.warning(`Failed to get service logs: ${err}`);
    return {
      service,
      logs: [],
      error: err.message
    };
  }
}

// Auto Self-Heal Check
async function autoHealServices() {
  try {
    for (const service of ALLOWED_SERVICES) {
      const status = await getServiceStatus(service);
      
      // If service is in error state, attempt auto-heal
      if (status.status === "error" || status.status === "stopped") {
        const retryCount = serviceRetries[service] || 0;
        
        if (retryCount < 3) {
          serviceRetries[service] = retryCount + 1;
          logServiceAction("auto_heal_initiated", `Auto-heal initiated for ${service} (attempt ${retryCount + 1}/3)`);
          
          try {
            await run(`systemctl restart ${service}`);
            const newStatus = await getServiceStatus(service);
            
            if (newStatus.status === "running") {
              logServiceAction("auto_heal_success", `Auto-heal successful for ${service}`);
              alert.info(`Auto-heal successful: ${service}`);
              delete serviceRetries[service];
            }
          } catch (err) {
            logServiceAction("auto_heal_failed", `Auto-heal failed for ${service}: ${err}`);
          }
        } else {
          // Max retries reached, raise alert
          delete serviceRetries[service];
          alert.critical(`Auto-heal failed after 3 retries for ${service}`);
        }
      }
    }
  } catch (err) {
    alert.warning(`Auto-heal check failed: ${err}`);
  }
}

// Quick Action Panel - Add Domain
async function quickAddDomain(domain, rootPath) {
  try {
    const domainManager = require("./domainManager");
    return await domainManager.addDomain(domain, rootPath);
  } catch (err) {
    alert.warning(`Quick add domain failed: ${err}`);
    throw err;
  }
}

// Quick Action Panel - Create Database
async function quickCreateDatabase(dbName, engine, username, password) {
  try {
    const databaseManager = require("./databaseManager");
    return await databaseManager.createDatabase(dbName, engine, username, password);
  } catch (err) {
    alert.warning(`Quick create database failed: ${err}`);
    throw err;
  }
}

// Quick Action Panel - Issue SSL
async function quickIssueSSL(domain) {
  try {
    const domainManager = require("./domainManager");
    return await domainManager.issueSSL(domain);
  } catch (err) {
    alert.warning(`Quick issue SSL failed: ${err}`);
    throw err;
  }
}

// Quick Action Panel - Run Backup
async function quickRunBackup(dbName) {
  try {
    const databaseManager = require("./databaseManager");
    return await databaseManager.backupDatabase(dbName);
  } catch (err) {
    alert.warning(`Quick run backup failed: ${err}`);
    throw err;
  }
}

// Quick Action Panel - Restore Backup
async function quickRestoreBackup(dbName, backupFile) {
  try {
    const databaseManager = require("./databaseManager");
    return await databaseManager.restoreDatabase(dbName, backupFile);
  } catch (err) {
    alert.warning(`Quick restore backup failed: ${err}`);
    throw err;
  }
}

// Log Service Action
function logServiceAction(type, message) {
  serviceLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (serviceLogs.length > 1000) {
    serviceLogs.shift();
  }
}

// Get Service Logs (Audit)
async function getServiceAuditLogs(limit = 100) {
  return serviceLogs.slice(-limit).reverse();
}

// Get Service Metrics
async function getServiceMetrics(service) {
  try {
    validateService(service);
    
    // Get CPU usage
    const cpuUsage = await run(`systemctl show ${service} | grep CPUUsage | cut -d= -f2`);
    
    // Get memory usage
    const memoryUsage = await run(`systemctl show ${service} | grep MemoryCurrent | cut -d= -f2`);
    
    // Get uptime
    const uptime = await run(`systemctl show ${service} | grep ActiveEnterTimestamp | cut -d= -f2`);
    
    return {
      service,
      cpuUsage: cpuUsage.trim() || "0",
      memoryUsage: memoryUsage.trim() || "0",
      uptime: uptime.trim()
    };
  } catch (err) {
    return {
      service,
      cpuUsage: "0",
      memoryUsage: "0",
      uptime: "unknown"
    };
  }
}

// Get All Service Status (for live sync)
async function getAllServiceStatus() {
  try {
    const statusMap = {};
    
    for (const service of ALLOWED_SERVICES) {
      const status = await getServiceStatus(service);
      statusMap[service] = status;
    }
    
    return statusMap;
  } catch (err) {
    alert.warning(`Failed to get all service status: ${err}`);
    return {};
  }
}

// Exports
exports.getServices = getServices;
exports.getServiceStatus = getServiceStatus;
exports.restartService = restartService;
exports.startService = startService;
exports.stopService = stopService;
exports.enableService = enableService;
exports.disableService = disableService;
exports.getServiceLogs = getServiceLogs;
exports.autoHealServices = autoHealServices;
exports.quickAddDomain = quickAddDomain;
exports.quickCreateDatabase = quickCreateDatabase;
exports.quickIssueSSL = quickIssueSSL;
exports.quickRunBackup = quickRunBackup;
exports.quickRestoreBackup = quickRestoreBackup;
exports.getServiceAuditLogs = getServiceAuditLogs;
exports.getServiceMetrics = getServiceMetrics;
exports.getAllServiceStatus = getAllServiceStatus;
exports.ALLOWED_SERVICES = ALLOWED_SERVICES;
