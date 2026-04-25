const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Extension registry with installation commands
const extensions = {
  "backup-manager": {
    name: "Backup Manager",
    version: "1.0.0",
    latestVersion: "1.2.0",
    description: "Manual and automated backup system",
    dependencies: ["tar", "rsync"],
    install: installBackupManager,
    uninstall: uninstallBackupManager,
    status: checkBackupManagerStatus,
    update: updateBackupManager,
    source: "official" // official, community, custom
  },
  "git-deploy": {
    name: "Git Deploy",
    version: "1.0.0",
    latestVersion: "1.5.0",
    description: "Git repository deployment with webhooks",
    dependencies: ["git"],
    install: installGitDeploy,
    uninstall: uninstallGitDeploy,
    status: checkGitDeployStatus,
    update: updateGitDeploy,
    source: "official"
  },
  "imunifyav": {
    name: "ImunifyAV",
    version: "1.0.0",
    latestVersion: "2.0.0",
    description: "Malware scanning and protection",
    dependencies: ["clamav"],
    install: installImunifyAV,
    uninstall: uninstallImunifyAV,
    status: checkImunifyAVStatus,
    update: updateImunifyAV,
    source: "official"
  },
  "docker-manager": {
    name: "Docker Manager",
    version: "1.0.0",
    latestVersion: "2.0.0",
    description: "Docker container management",
    dependencies: ["docker"],
    install: installDockerManager,
    uninstall: uninstallDockerManager,
    status: checkDockerManagerStatus,
    update: updateDockerManager,
    source: "official"
  },
  "nodejs-toolkit": {
    name: "Node.js Toolkit",
    version: "1.0.0",
    latestVersion: "1.8.0",
    description: "Node.js version management with NVM and PM2",
    dependencies: ["curl"],
    install: installNodejsToolkit,
    uninstall: uninstallNodejsToolkit,
    status: checkNodejsToolkitStatus,
    update: updateNodejsToolkit,
    source: "official"
  },
  "letsencrypt": {
    name: "Let's Encrypt",
    version: "1.0.0",
    latestVersion: "1.5.0",
    description: "Free SSL certificate management",
    dependencies: ["certbot"],
    install: installLetsEncrypt,
    uninstall: uninstallLetsEncrypt,
    status: checkLetsEncryptStatus,
    update: updateLetsEncrypt,
    source: "official"
  },
  "redis-manager": {
    name: "Redis Manager",
    version: "1.0.0",
    latestVersion: "1.3.0",
    description: "Redis cache management",
    dependencies: ["redis-server"],
    install: installRedisManager,
    uninstall: uninstallRedisManager,
    status: checkRedisManagerStatus,
    update: updateRedisManager,
    source: "official"
  },
  "queue-worker": {
    name: "Queue Worker Manager",
    version: "1.0.0",
    latestVersion: "1.2.0",
    description: "Laravel/Node queue worker management",
    dependencies: ["supervisor"],
    install: installQueueWorker,
    uninstall: uninstallQueueWorker,
    status: checkQueueWorkerStatus,
    update: updateQueueWorker,
    source: "official"
  },
  "supervisor-manager": {
    name: "Supervisor Manager",
    version: "1.0.0",
    latestVersion: "1.4.0",
    description: "Background process management",
    dependencies: ["supervisor"],
    install: installSupervisorManager,
    uninstall: uninstallSupervisorManager,
    status: checkSupervisorManagerStatus,
    update: updateSupervisorManager,
    source: "official"
  },
  "monitoring": {
    name: "Monitoring Extension",
    version: "1.0.0",
    latestVersion: "2.0.0",
    description: "CPU/RAM/Disk live monitoring graphs",
    dependencies: ["htop", "iotop"],
    install: installMonitoring,
    uninstall: uninstallMonitoring,
    status: checkMonitoringStatus,
    update: updateMonitoring,
    source: "official"
  },
  "file-permission": {
    name: "File Permission Tool",
    version: "1.0.0",
    latestVersion: "1.2.0",
    description: "Automatic file permission fixing",
    dependencies: [],
    install: installFilePermission,
    uninstall: uninstallFilePermission,
    status: checkFilePermissionStatus,
    update: updateFilePermission,
    source: "official"
  },
  "phpmyadmin": {
    name: "phpMyAdmin",
    version: "1.0.0",
    latestVersion: "5.2.0",
    description: "Database GUI access",
    dependencies: ["php", "mysql"],
    install: installPhpMyAdmin,
    uninstall: uninstallPhpMyAdmin,
    status: checkPhpMyAdminStatus,
    update: updatePhpMyAdmin,
    source: "official"
  },
  "mail-server": {
    name: "Mail Server",
    version: "1.0.0",
    latestVersion: "2.0.0",
    description: "Full mail server installation",
    dependencies: ["postfix", "dovecot"],
    install: installMailServer,
    uninstall: uninstallMailServer,
    status: checkMailServerStatus,
    update: updateMailServer,
    source: "official"
  },
  "cdn-cache": {
    name: "CDN/Cache Extension",
    version: "1.0.0",
    latestVersion: "1.3.0",
    description: "Caching layer with Varnish",
    dependencies: ["varnish"],
    install: installCdnCache,
    uninstall: uninstallCdnCache,
    status: checkCdnCacheStatus,
    update: updateCdnCache,
    source: "official"
  }
};

// Installed extensions tracking with DB-like storage
const installedExtensions = {};

// Extension logs
const extensionLogs = [];

// Resource usage tracking per extension
const extensionResourceUsage = {};

// Install progress tracking
const installProgress = {};

// Permission control
const allowedSources = ["official", "community"];

// Dependency checker
async function checkDependencies(extensionKey) {
  const ext = extensions[extensionKey];
  if (!ext) return { success: false, message: "Extension not found" };

  const missing = [];
  for (const dep of ext.dependencies) {
    try {
      await run(`which ${dep}`);
    } catch (err) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    return { success: false, message: `Missing dependencies: ${missing.join(", ")}` };
  }

  // Check RAM
  const memInfo = await run("free -m | grep Mem | awk '{print $2}'");
  const ramGB = parseInt(memInfo.trim()) / 1024;
  if (ramGB < 2) {
    return { success: false, message: "Insufficient RAM (minimum 2GB required)" };
  }

  // Check disk space
  const diskInfo = await run("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'");
  const diskUsage = parseInt(diskInfo.trim());
  if (diskUsage > 90) {
    return { success: false, message: "Insufficient disk space" };
  }

  return { success: true };
}

// Security: Verify package source
function verifyPackageSource(extensionKey) {
  const ext = extensions[extensionKey];
  if (!ext) return false;
  
  return allowedSources.includes(ext.source);
}

// Security: Block unknown sources
function blockUnknownSource(extensionKey) {
  const ext = extensions[extensionKey];
  if (!ext) return true; // Block if not found
  
  if (!allowedSources.includes(ext.source)) {
    return true; // Block unknown source
  }
  
  return false;
}

// Log extension action
function logExtensionAction(extensionKey, action, details = "", status = "success") {
  const logEntry = {
    id: crypto.randomBytes(16).toString("hex"),
    extensionKey,
    extensionName: extensions[extensionKey]?.name || extensionKey,
    action,
    details,
    status,
    timestamp: new Date().toISOString()
  };
  
  extensionLogs.push(logEntry);
  
  // Keep only last 1000 logs
  if (extensionLogs.length > 1000) {
    extensionLogs.shift();
  }
  
  return logEntry;
}

// Get extension logs
function getExtensionLogs(extensionKey = null, limit = 100) {
  let logs = [...extensionLogs];
  
  if (extensionKey) {
    logs = logs.filter(l => l.extensionKey === extensionKey);
  }
  
  return logs.slice(-limit).reverse();
}

// Get extension status with badge color
function getExtensionStatusBadge(extensionKey) {
  const ext = extensions[extensionKey];
  if (!ext) return { status: "unknown", color: "gray" };
  
  const installed = !!installedExtensions[extensionKey];
  
  if (!installed) {
    return { status: "not_installed", color: "gray", label: "Not Installed" };
  }
  
  const installData = installedExtensions[extensionKey];
  
  if (installData.status === "updating") {
    return { status: "updating", color: "blue", label: "Updating" };
  }
  
  if (installData.status === "failed") {
    return { status: "failed", color: "red", label: "Failed" };
  }
  
  if (installData.enabled === false) {
    return { status: "disabled", color: "yellow", label: "Disabled" };
  }
  
  return { status: "installed", color: "green", label: "Installed" };
}

// Enable/Disable extension without uninstall
function toggleExtension(extensionKey, enabled, role = "admin") {
  // Permission check
  if (role !== "admin" && role !== "server_manager") {
    throw new Error("Permission denied. Only Admin and Server Manager can enable/disable extensions");
  }
  
  if (!installedExtensions[extensionKey]) {
    throw new Error("Extension not installed");
  }
  
  installedExtensions[extensionKey].enabled = enabled;
  installedExtensions[extensionKey].enabledAt = enabled ? new Date().toISOString() : null;
  
  logExtensionAction(extensionKey, enabled ? "enable" : "disable", `Extension ${enabled ? "enabled" : "disabled"}`, "success");
  
  return installedExtensions[extensionKey];
}

// Get resource usage for extension
async function getExtensionResourceUsage(extensionKey) {
  if (!installedExtensions[extensionKey]) {
    return null;
  }
  
  // Get CPU and RAM usage (simplified)
  try {
    const cpuUsage = await run("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'");
    const memUsage = await run("free | grep Mem | awk '{print $3/$2 * 100.0}'");
    
    return {
      extensionKey,
      cpu: parseFloat(cpuUsage) || 0,
      memory: parseFloat(memUsage) || 0,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      extensionKey,
      cpu: 0,
      memory: 0,
      timestamp: new Date().toISOString(),
      error: err.message
    };
  }
}

// Marketplace sync (fetch new modules from server)
async function syncMarketplace() {
  // In production, this would fetch from a remote server
  // For now, we return the local registry
  logExtensionAction("marketplace", "sync", "Marketplace synced", "success");
  
  return Object.keys(extensions).map(key => ({
    key,
    ...extensions[key],
    installed: !!installedExtensions[key],
    status: getExtensionStatusBadge(key)
  }));
}

// Auto install flow with progress tracking
async function installExtensionWithProgress(extensionKey, role = "admin") {
  // Permission check
  if (role !== "admin") {
    throw new Error("Permission denied. Only Admin can install extensions");
  }
  
  // Security check
  if (blockUnknownSource(extensionKey)) {
    throw new Error("Extension source not allowed");
  }
  
  const installId = crypto.randomBytes(16).toString("hex");
  installProgress[installId] = {
    extensionKey,
    stage: "checking_dependencies",
    progress: 0,
    status: "in_progress"
  };
  
  try {
    // Stage 1: Check dependencies
    installProgress[installId].stage = "checking_dependencies";
    installProgress[installId].progress = 10;
    
    const depCheck = await checkDependencies(extensionKey);
    if (!depCheck.success) {
      throw new Error(depCheck.message);
    }
    
    // Stage 2: Download package
    installProgress[installId].stage = "downloading";
    installProgress[installId].progress = 30;
    
    // Stage 3: Install service
    installProgress[installId].stage = "installing";
    installProgress[installId].progress = 50;
    
    const ext = extensions[extensionKey];
    if (!ext) {
      throw new Error("Extension not found");
    }
    
    if (installedExtensions[extensionKey]) {
      throw new Error("Extension already installed");
    }
    
    await ext.install();
    
    // Stage 4: Enable service
    installProgress[installId].stage = "enabling";
    installProgress[installId].progress = 80;
    
    // Stage 5: Update status
    installProgress[installId].stage = "completing";
    installProgress[installId].progress = 100;
    
    installedExtensions[extensionKey] = {
      version: ext.version,
      installedAt: new Date().toISOString(),
      status: "installed",
      enabled: true,
      enabledAt: new Date().toISOString()
    };
    
    installProgress[installId].status = "completed";
    
    logExtensionAction(extensionKey, "install", "Extension installed successfully", "success");
    alert.info(`${ext.name} installed successfully`);
    
    return { success: true, installId, extension: installedExtensions[extensionKey] };
  } catch (err) {
    installProgress[installId].status = "failed";
    installProgress[installId].error = err.message;
    
    logExtensionAction(extensionKey, "install", `Install failed: ${err.message}`, "error");
    alert.warning(`Failed to install ${extensions[extensionKey]?.name}: ${err}`);
    
    throw err;
  }
}

// Get install progress
function getInstallProgress(installId) {
  return installProgress[installId] || null;
}

// Self-heal: Failed install retry
async function retryInstall(extensionKey, role = "admin") {
  const ext = extensions[extensionKey];
  if (!ext) {
    throw new Error("Extension not found");
  }
  
  // Check if previous install failed
  const installData = installedExtensions[extensionKey];
  if (installData && installData.status === "failed") {
    // Clean up previous failed install
    try {
      await ext.uninstall();
    } catch (err) {
      // Ignore cleanup errors
    }
    delete installedExtensions[extensionKey];
  }
  
  logExtensionAction(extensionKey, "retry_install", "Retrying install", "info");
  
  return await installExtensionWithProgress(extensionKey, role);
}

// Self-heal: Broken extension auto disable
async function autoDisableBrokenExtensions() {
  const brokenExtensions = [];
  
  for (const [key, data] of Object.entries(installedExtensions)) {
    if (data.status === "failed" || data.enabled === false) {
      continue;
    }
    
    const ext = extensions[key];
    if (ext && ext.status) {
      try {
        const isRunning = await ext.status();
        if (!isRunning) {
          data.enabled = false;
          data.disabledReason = "service_not_running";
          logExtensionAction(key, "auto_disable", "Auto-disabled due to broken service", "warning");
          alert.warning(`Extension ${ext.name} auto-disabled due to broken service`);
          brokenExtensions.push(key);
        }
      } catch (err) {
        data.enabled = false;
        data.disabledReason = "status_check_failed";
        logExtensionAction(key, "auto_disable", `Auto-disabled: ${err.message}`, "warning");
        brokenExtensions.push(key);
      }
    }
  }
  
  return brokenExtensions;
}

// Self-heal: Missing service re-init
async function reinitMissingServices() {
  const reinitialized = [];
  
  for (const [key, data] of Object.entries(installedExtensions)) {
    if (!data.enabled) continue;
    
    const ext = extensions[key];
    if (ext && ext.status) {
      try {
        const isRunning = await ext.status();
        if (!isRunning) {
          // Try to restart the service
          await run(`systemctl restart ${key}`);
          logExtensionAction(key, "reinit", "Service re-initialized", "success");
          alert.info(`Extension ${ext.name} service re-initialized`);
          reinitialized.push(key);
        }
      } catch (err) {
        logExtensionAction(key, "reinit_failed", `Re-init failed: ${err.message}`, "error");
      }
    }
  }
  
  return reinitialized;
}

// Generic install function (with permission check)
async function installExtension(extensionKey, role = "admin") {
  // Permission check
  if (role !== "admin") {
    throw new Error("Permission denied. Only Admin can install extensions");
  }
  
  return await installExtensionWithProgress(extensionKey, role);
}

// Generic uninstall function (with permission check)
async function uninstallExtension(extensionKey, role = "admin") {
  // Permission check
  if (role !== "admin") {
    throw new Error("Permission denied. Only Admin can uninstall extensions");
  }
  
  const ext = extensions[extensionKey];
  if (!ext) {
    throw new Error("Extension not found");
  }

  if (!installedExtensions[extensionKey]) {
    throw new Error("Extension not installed");
  }

  alert.info(`Uninstalling ${ext.name}...`);

  try {
    await ext.uninstall();
    delete installedExtensions[extensionKey];
    logExtensionAction(extensionKey, "uninstall", "Extension uninstalled successfully", "success");
    alert.info(`${ext.name} uninstalled successfully`);
    return true;
  } catch (err) {
    logExtensionAction(extensionKey, "uninstall", `Uninstall failed: ${err.message}`, "error");
    alert.warning(`Failed to uninstall ${ext.name}: ${err}`);
    throw err;
  }
}

// Generic status function
async function getExtensionStatus(extensionKey) {
  const ext = extensions[extensionKey];
  if (!ext) {
    return { installed: false, running: false };
  }

  const isInstalled = !!installedExtensions[extensionKey];
  let isRunning = false;

  if (isInstalled && ext.status) {
    isRunning = await ext.status();
  }

  return {
    installed: isInstalled,
    running: isRunning,
    version: installedExtensions[extensionKey]?.version || ext.version,
    latestVersion: ext.latestVersion,
    needsUpdate: installedExtensions[extensionKey]?.version !== ext.latestVersion,
    enabled: installedExtensions[extensionKey]?.enabled !== false,
    badge: getExtensionStatusBadge(extensionKey)
  };
}

// Generic update function (with permission check)
async function updateExtension(extensionKey, role = "admin") {
  // Permission check
  if (role !== "admin" && role !== "server_manager") {
    throw new Error("Permission denied. Only Admin and Server Manager can update extensions");
  }
  
  const ext = extensions[extensionKey];
  if (!ext) {
    throw new Error("Extension not found");
  }

  if (!installedExtensions[extensionKey]) {
    throw new Error("Extension not installed");
  }

  // Set status to updating
  installedExtensions[extensionKey].status = "updating";
  logExtensionAction(extensionKey, "update_start", "Starting update", "info");
  
  alert.info(`Updating ${ext.name}...`);

  try {
    await ext.update();
    installedExtensions[extensionKey].version = ext.latestVersion;
    installedExtensions[extensionKey].status = "installed";
    logExtensionAction(extensionKey, "update", "Extension updated successfully", "success");
    alert.info(`${ext.name} updated successfully`);
    return true;
  } catch (err) {
    installedExtensions[extensionKey].status = "failed";
    logExtensionAction(extensionKey, "update", `Update failed: ${err.message}`, "error");
    alert.warning(`Failed to update ${ext.name}: ${err}`);
    throw err;
  }
}

// ==================== EXTENSION SPECIFIC IMPLEMENTATIONS ====================

// Backup Manager
async function installBackupManager() {
  await run("apt-get update -y");
  await run("apt-get install -y tar rsync");
  await run("mkdir -p /var/backups/auto");
  alert.info("Backup Manager installed");
}

async function uninstallBackupManager() {
  await run("rm -rf /var/backups/auto");
  alert.info("Backup Manager uninstalled");
}

async function checkBackupManagerStatus() {
  try {
    await run("which tar");
    await run("which rsync");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateBackupManager() {
  await run("apt-get install --only-upgrade tar rsync");
}

async function createBackup(source, destination) {
  await run(`tar -czf ${destination} ${source}`);
  alert.info(`Backup created: ${destination}`);
}

async function restoreBackup(backupFile, destination) {
  await run(`tar -xzf ${backupFile} -C ${destination}`);
  alert.info(`Backup restored: ${backupFile}`);
}

// Git Deploy
async function installGitDeploy() {
  await run("apt-get update -y");
  await run("apt-get install -y git");
  await run("mkdir -p /var/www/git-deploy");
  alert.info("Git Deploy installed");
}

async function uninstallGitDeploy() {
  await run("apt-get remove -y git");
  await run("rm -rf /var/www/git-deploy");
  alert.info("Git Deploy uninstalled");
}

async function checkGitDeployStatus() {
  try {
    await run("which git");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateGitDeploy() {
  await run("apt-get install --only-upgrade git");
}

async function cloneRepo(repoUrl, destination, branch = "main") {
  await run(`git clone -b ${branch} ${repoUrl} ${destination}`);
  alert.info(`Repository cloned: ${repoUrl}`);
}

async function pullRepo(destination) {
  await run(`cd ${destination} && git pull`);
  alert.info(`Repository pulled: ${destination}`);
}

// ImunifyAV
async function installImunifyAV() {
  await run("apt-get update -y");
  await run("apt-get install -y clamav clamav-daemon");
  await run("systemctl start clamav-daemon");
  alert.info("ImunifyAV installed");
}

async function uninstallImunifyAV() {
  await run("systemctl stop clamav-daemon");
  await run("apt-get remove -y clamav clamav-daemon");
  alert.info("ImunifyAV uninstalled");
}

async function checkImunifyAVStatus() {
  try {
    const status = await run("systemctl is-active clamav-daemon");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateImunifyAV() {
  await run("apt-get install --only-upgrade clamav clamav-daemon");
}

async function scanMalware(path) {
  await run(`clamscan -r ${path}`);
  alert.info(`Malware scan completed: ${path}`);
}

async function cleanInfected(path) {
  await run(`clamscan -r --remove ${path}`);
  alert.info(`Infected files cleaned: ${path}`);
}

// Docker Manager
async function installDockerManager() {
  await run("apt-get update -y");
  await run("apt-get install -y docker.io docker-compose");
  await run("systemctl start docker");
  await run("systemctl enable docker");
  alert.info("Docker Manager installed");
}

async function uninstallDockerManager() {
  await run("systemctl stop docker");
  await run("apt-get remove -y docker.io docker-compose");
  alert.info("Docker Manager uninstalled");
}

async function checkDockerManagerStatus() {
  try {
    const status = await run("systemctl is-active docker");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateDockerManager() {
  await run("apt-get install --only-upgrade docker.io docker-compose");
}

async function runContainer(image, name) {
  await run(`docker run -d --name ${name} ${image}`);
  alert.info(`Container started: ${name}`);
}

async function stopContainer(name) {
  await run(`docker stop ${name}`);
  alert.info(`Container stopped: ${name}`);
}

async function getContainerLogs(name) {
  return await run(`docker logs ${name}`);
}

async function listImages() {
  return await run("docker images");
}

// Node.js Toolkit
async function installNodejsToolkit() {
  await run("curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash");
  await run("export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && nvm install 18");
  await run("npm install -g pm2");
  alert.info("Node.js Toolkit installed");
}

async function uninstallNodejsToolkit() {
  await run("npm uninstall -g pm2");
  await run("rm -rf ~/.nvm");
  alert.info("Node.js Toolkit uninstalled");
}

async function checkNodejsToolkitStatus() {
  try {
    await run("which node");
    await run("which pm2");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateNodejsToolkit() {
  await run("export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && nvm install --lts");
}

async function npmInstall(path) {
  await run(`cd ${path} && npm install`);
  alert.info(`npm install completed: ${path}`);
}

async function startAppWithPM2(path, name) {
  await run(`cd ${path} && pm2 start ${path} --name ${name}`);
  alert.info(`App started with PM2: ${name}`);
}

// Let's Encrypt
async function installLetsEncrypt() {
  await run("apt-get update -y");
  await run("apt-get install -y certbot python3-certbot-nginx");
  alert.info("Let's Encrypt installed");
}

async function uninstallLetsEncrypt() {
  await run("apt-get remove -y certbot python3-certbot-nginx");
  alert.info("Let's Encrypt uninstalled");
}

async function checkLetsEncryptStatus() {
  try {
    await run("which certbot");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateLetsEncrypt() {
  await run("apt-get install --only-upgrade certbot python3-certbot-nginx");
}

async function issueSSL(domain) {
  await run(`certbot --nginx -d ${domain}`);
  alert.info(`SSL issued for: ${domain}`);
}

async function renewSSL() {
  await run("certbot renew");
  alert.info("SSL renewed");
}

// Redis Manager
async function installRedisManager() {
  await run("apt-get update -y");
  await run("apt-get install -y redis-server");
  await run("systemctl start redis-server");
  await run("systemctl enable redis-server");
  alert.info("Redis Manager installed");
}

async function uninstallRedisManager() {
  await run("systemctl stop redis-server");
  await run("apt-get remove -y redis-server");
  alert.info("Redis Manager uninstalled");
}

async function checkRedisManagerStatus() {
  try {
    const status = await run("systemctl is-active redis-server");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateRedisManager() {
  await run("apt-get install --only-upgrade redis-server");
}

async function flushRedisCache() {
  await run("redis-cli FLUSHALL");
  alert.info("Redis cache flushed");
}

// Queue Worker Manager
async function installQueueWorker() {
  await run("apt-get update -y");
  await run("apt-get install -y supervisor");
  await run("systemctl start supervisor");
  await run("systemctl enable supervisor");
  alert.info("Queue Worker Manager installed");
}

async function uninstallQueueWorker() {
  await run("systemctl stop supervisor");
  await run("apt-get remove -y supervisor");
  alert.info("Queue Worker Manager uninstalled");
}

async function checkQueueWorkerStatus() {
  try {
    const status = await run("systemctl is-active supervisor");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateQueueWorker() {
  await run("apt-get install --only-upgrade supervisor");
}

async function startQueueWorker(name, command) {
  const config = `[program:${name}]
command=${command}
autostart=true
autorestart=true
user=www-data
`;
  await run(`echo '${config}' > /etc/supervisor/conf.d/${name}.conf`);
  await run("supervisorctl reread");
  await run("supervisorctl update");
  await run(`supervisorctl start ${name}`);
  alert.info(`Queue worker started: ${name}`);
}

async function restartQueueWorker(name) {
  await run(`supervisorctl restart ${name}`);
  alert.info(`Queue worker restarted: ${name}`);
}

// Supervisor Manager
async function installSupervisorManager() {
  await run("apt-get update -y");
  await run("apt-get install -y supervisor");
  await run("systemctl start supervisor");
  await run("systemctl enable supervisor");
  alert.info("Supervisor Manager installed");
}

async function uninstallSupervisorManager() {
  await run("systemctl stop supervisor");
  await run("apt-get remove -y supervisor");
  alert.info("Supervisor Manager uninstalled");
}

async function checkSupervisorManagerStatus() {
  try {
    const status = await run("systemctl is-active supervisor");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateSupervisorManager() {
  await run("apt-get install --only-upgrade supervisor");
}

async function addProcess(name, command) {
  const config = `[program:${name}]
command=${command}
autostart=true
autorestart=true
`;
  await run(`echo '${config}' > /etc/supervisor/conf.d/${name}.conf`);
  await run("supervisorctl reread");
  await run("supervisorctl update");
  alert.info(`Process added: ${name}`);
}

// Monitoring Extension
async function installMonitoring() {
  await run("apt-get update -y");
  await run("apt-get install -y htop iotop");
  alert.info("Monitoring Extension installed");
}

async function uninstallMonitoring() {
  await run("apt-get remove -y htop iotop");
  alert.info("Monitoring Extension uninstalled");
}

async function checkMonitoringStatus() {
  try {
    await run("which htop");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateMonitoring() {
  await run("apt-get install --only-upgrade htop iotop");
}

// File Permission Tool
async function installFilePermission() {
  await run("mkdir -p /var/www");
  alert.info("File Permission Tool installed");
}

async function uninstallFilePermission() {
  alert.info("File Permission Tool uninstalled");
}

async function checkFilePermissionStatus() {
  return true;
}

async function updateFilePermission() {
  alert.info("File Permission Tool updated");
}

async function fixPermissions(path) {
  await run(`chown -R www-data:www-data ${path}`);
  await run(`chmod -R 755 ${path}`);
  alert.info(`Permissions fixed: ${path}`);
}

// phpMyAdmin
async function installPhpMyAdmin() {
  await run("apt-get update -y");
  await run("apt-get install -y phpmyadmin php-mbstring php-zip php-gd php-json php-curl");
  await run("phpenmod mbstring");
  alert.info("phpMyAdmin installed");
}

async function uninstallPhpMyAdmin() {
  await run("apt-get remove -y phpmyadmin");
  alert.info("phpMyAdmin uninstalled");
}

async function checkPhpMyAdminStatus() {
  try {
    await run("which phpmyadmin");
    return true;
  } catch (err) {
    return false;
  }
}

async function updatePhpMyAdmin() {
  await run("apt-get install --only-upgrade phpmyadmin");
}

// Mail Server
async function installMailServer() {
  await run("apt-get update -y");
  await run("apt-get install -y postfix dovecot-core dovecot-imapd");
  await run("systemctl start postfix");
  await run("systemctl start dovecot");
  await run("systemctl enable postfix");
  await run("systemctl enable dovecot");
  alert.info("Mail Server installed");
}

async function uninstallMailServer() {
  await run("systemctl stop postfix");
  await run("systemctl stop dovecot");
  await run("apt-get remove -y postfix dovecot-core dovecot-imapd");
  alert.info("Mail Server uninstalled");
}

async function checkMailServerStatus() {
  try {
    const postfix = await run("systemctl is-active postfix");
    const dovecot = await run("systemctl is-active dovecot");
    return postfix.includes("active") && dovecot.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateMailServer() {
  await run("apt-get install --only-upgrade postfix dovecot-core dovecot-imapd");
}

// CDN/Cache Extension
async function installCdnCache() {
  await run("apt-get update -y");
  await run("apt-get install -y varnish");
  await run("systemctl start varnish");
  await run("systemctl enable varnish");
  alert.info("CDN/Cache Extension installed");
}

async function uninstallCdnCache() {
  await run("systemctl stop varnish");
  await run("apt-get remove -y varnish");
  alert.info("CDN/Cache Extension uninstalled");
}

async function checkCdnCacheStatus() {
  try {
    const status = await run("systemctl is-active varnish");
    return status.includes("active");
  } catch (err) {
    return false;
  }
}

async function updateCdnCache() {
  await run("apt-get install --only-upgrade varnish");
}

// Extension Marketplace
async function getExtensionList() {
  return Object.keys(extensions).map(key => ({
    key,
    ...extensions[key],
    installed: !!installedExtensions[key],
    status: getExtensionStatusBadge(key)
  }));
}

// Exports
exports.installExtension = installExtension;
exports.installExtensionWithProgress = installExtensionWithProgress;
exports.uninstallExtension = uninstallExtension;
exports.getExtensionStatus = getExtensionStatus;
exports.updateExtension = updateExtension;
exports.getExtensionList = getExtensionList;
exports.checkDependencies = checkDependencies;
exports.getExtensionLogs = getExtensionLogs;
exports.getExtensionStatusBadge = getExtensionStatusBadge;
exports.toggleExtension = toggleExtension;
exports.getExtensionResourceUsage = getExtensionResourceUsage;
exports.syncMarketplace = syncMarketplace;
exports.getInstallProgress = getInstallProgress;
exports.retryInstall = retryInstall;
exports.autoDisableBrokenExtensions = autoDisableBrokenExtensions;
exports.reinitMissingServices = reinitMissingServices;
exports.verifyPackageSource = verifyPackageSource;
exports.blockUnknownSource = blockUnknownSource;

// Backup Manager exports
exports.createBackup = createBackup;
exports.restoreBackup = restoreBackup;

// Git Deploy exports
exports.cloneRepo = cloneRepo;
exports.pullRepo = pullRepo;

// ImunifyAV exports
exports.scanMalware = scanMalware;
exports.cleanInfected = cleanInfected;

// Docker Manager exports
exports.runContainer = runContainer;
exports.stopContainer = stopContainer;
exports.getContainerLogs = getContainerLogs;
exports.listImages = listImages;

// Node.js Toolkit exports
exports.npmInstall = npmInstall;
exports.startAppWithPM2 = startAppWithPM2;

// Let's Encrypt exports
exports.issueSSL = issueSSL;
exports.renewSSL = renewSSL;

// Redis Manager exports
exports.flushRedisCache = flushRedisCache;

// Queue Worker exports
exports.startQueueWorker = startQueueWorker;
exports.restartQueueWorker = restartQueueWorker;

// Supervisor exports
exports.addProcess = addProcess;

// File Permission exports
exports.fixPermissions = fixPermissions;
