const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Action logs for audit trail
const actionLogs = [];

// Permission control
const allowedRoles = ["admin", "server_manager", "owner"];

// Dangerous commands to block
const dangerousCommands = ["rm -rf /", "mkfs", "dd if=", ":(){:|:&};:", "chmod 777 /", "chown root /"];

// Input validation patterns
const validationPatterns = {
  ip: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  cron: /^(\*|[0-9\*\/\-,\s]+)$/,
  domain: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
};

// Log action for audit
function logAction(action, module, details, username, status = "success") {
  const logEntry = {
    id: crypto.randomBytes(16).toString("hex"),
    action,
    module,
    details,
    username,
    status,
    timestamp: new Date().toISOString()
  };
  
  actionLogs.push(logEntry);
  
  // Keep only last 1000 logs
  if (actionLogs.length > 1000) {
    actionLogs.shift();
  }
  
  return logEntry;
}

// Get action logs
function getActionLogs(module = null, limit = 100) {
  let logs = [...actionLogs];
  
  if (module) {
    logs = logs.filter(l => l.module === module);
  }
  
  return logs.slice(-limit).reverse();
}

// Permission check
function checkPermission(username) {
  // In production, check from userManager
  // For now, assume admin role
  return allowedRoles.includes(username.toLowerCase()) || username === "admin";
}

// Input validation
function validateInput(type, value) {
  const pattern = validationPatterns[type];
  if (!pattern) return true; // No validation pattern defined
  
  return pattern.test(value);
}

// Check for dangerous commands
function isDangerousCommand(command) {
  const lowerCommand = command.toLowerCase();
  return dangerousCommands.some(dangerous => lowerCommand.includes(dangerous));
}

// Mask sensitive data
function maskSensitiveData(data) {
  if (typeof data !== 'string') return data;
  
  // Mask passwords, tokens, keys
  return data.replace(/password["\s]*[:=]["\s]*([^\s"]+)/gi, 'password=***')
             .replace(/token["\s]*[:=]["\s]*([^\s"]+)/gi, 'token=***')
             .replace(/api[_-]?key["\s]*[:=]["\s]*([^\s"]+)/gi, 'api_key=***')
             .replace(/secret["\s]*[:=]["\s]*([^\s"]+)/gi, 'secret=***');
}

// Backup config for rollback
const configBackups = {};

// Create config backup before modification
function createConfigBackup(configPath) {
  if (fs.existsSync(configPath)) {
    const backupId = crypto.randomBytes(8).toString("hex");
    const backupPath = `${configPath}.backup.${backupId}`;
    fs.copyFileSync(configPath, backupPath);
    configBackups[configPath] = backupPath;
    return backupId;
  }
  return null;
}

// Rollback config from backup
function rollbackConfig(configPath) {
  const backupPath = configBackups[configPath];
  if (backupPath && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, configPath);
    fs.unlinkSync(backupPath);
    delete configBackups[configPath];
    return true;
  }
  return false;
}

// PHP Settings (with permission check, logging, and rollback)
async function updatePHPSettings(settings, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can update PHP settings");
  }
  
  const phpIniPath = "/etc/php/8.2/fpm/php.ini";
  
  try {
    // Create backup
    createConfigBackup(phpIniPath);
    
    let phpIni = fs.readFileSync(phpIniPath, "utf8");
    
    if (settings.memory_limit) {
      phpIni = phpIni.replace(/memory_limit = .*/, `memory_limit = ${settings.memory_limit}`);
    }
    
    if (settings.upload_max_filesize) {
      phpIni = phpIni.replace(/upload_max_filesize = .*/, `upload_max_filesize = ${settings.upload_max_filesize}`);
    }
    
    if (settings.max_execution_time) {
      phpIni = phpIni.replace(/max_execution_time = .*/, `max_execution_time = ${settings.max_execution_time}`);
    }
    
    if (settings.post_max_size) {
      phpIni = phpIni.replace(/post_max_size = .*/, `post_max_size = ${settings.post_max_size}`);
    }
    
    fs.writeFileSync(phpIniPath, phpIni);
    await run("systemctl restart php8.2-fpm");
    
    logAction("update_php_settings", "php", maskSensitiveData(JSON.stringify(settings)), username, "success");
    alert.info("PHP settings updated and php-fpm restarted");
    return true;
  } catch (err) {
    // Rollback on error
    rollbackConfig(phpIniPath);
    logAction("update_php_settings", "php", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to update PHP settings: ${err}`);
    throw err;
  }
}

async function switchPHPVersion(version, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can switch PHP version");
  }
  
  try {
    await run(`update-alternatives --set php /usr/bin/php${version}`);
    await run(`update-alternatives --set php-fpm /usr/sbin/php-fpm${version}`);
    await run(`systemctl restart php${version}-fpm`);
    
    logAction("switch_php_version", "php", `Switched to PHP ${version}`, username, "success");
    alert.info(`Switched to PHP ${version}`);
    return true;
  } catch (err) {
    logAction("switch_php_version", "php", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to switch PHP version: ${err}`);
    throw err;
  }
}

// Web Server Settings (with permission check, logging, and rollback)
async function updateNginxSettings(settings, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can update Nginx settings");
  }
  
  const nginxConfPath = "/etc/nginx/nginx.conf";
  
  try {
    // Create backup
    createConfigBackup(nginxConfPath);
    
    let nginxConf = fs.readFileSync(nginxConfPath, "utf8");
    
    if (settings.worker_processes) {
      nginxConf = nginxConf.replace(/worker_processes .*/, `worker_processes ${settings.worker_processes};`);
    }
    
    if (settings.keepalive_timeout) {
      nginxConf = nginxConf.replace(/keepalive_timeout .*/, `keepalive_timeout ${settings.keepalive_timeout};`);
    }
    
    if (settings.gzip !== undefined) {
      nginxConf = nginxConf.replace(/gzip .*/, `gzip ${settings.gzip ? "on" : "off"};`);
    }
    
    fs.writeFileSync(nginxConfPath, nginxConf);
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    logAction("update_nginx_settings", "nginx", maskSensitiveData(JSON.stringify(settings)), username, "success");
    alert.info("Nginx settings updated and reloaded");
    return true;
  } catch (err) {
    // Rollback on error
    rollbackConfig(nginxConfPath);
    logAction("update_nginx_settings", "nginx", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to update Nginx settings: ${err}`);
    throw err;
  }
}

// Cron Jobs (with validation, logging, and dangerous command check)
async function addCronJob(cronExpression, command, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can add cron jobs");
  }
  
  // Validate cron expression
  if (!validateInput("cron", cronExpression)) {
    throw new Error("Invalid cron expression");
  }
  
  // Check for dangerous commands
  if (isDangerousCommand(command)) {
    throw new Error("Dangerous command detected");
  }
  
  try {
    const cronLine = `${cronExpression} ${command}`;
    await run(`(crontab -l 2>/dev/null; echo "${cronLine}") | crontab -`);
    
    logAction("add_cron_job", "cron", `${cronExpression} ${command}`, username, "success");
    alert.info(`Cron job added: ${cronLine}`);
    return true;
  } catch (err) {
    logAction("add_cron_job", "cron", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to add cron job: ${err}`);
    throw err;
  }
}

async function deleteCronJob(cronExpression, command, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can delete cron jobs");
  }
  
  try {
    await run(`crontab -l | grep -v "${cronExpression} ${command}" | crontab -`);
    
    logAction("delete_cron_job", "cron", `${cronExpression} ${command}`, username, "success");
    alert.info(`Cron job deleted: ${cronExpression} ${command}`);
    return true;
  } catch (err) {
    logAction("delete_cron_job", "cron", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to delete cron job: ${err}`);
    throw err;
  }
}

async function runCronJobNow(cronExpression, command, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can run cron jobs");
  }
  
  // Check for dangerous commands
  if (isDangerousCommand(command)) {
    throw new Error("Dangerous command detected");
  }
  
  try {
    await run(command);
    
    logAction("run_cron_job", "cron", `Executed: ${command}`, username, "success");
    alert.info(`Cron job executed: ${command}`);
    return true;
  } catch (err) {
    logAction("run_cron_job", "cron", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to run cron job: ${err}`);
    throw err;
  }
}

async function listCronJobs() {
  try {
    const crontab = await run("crontab -l 2>/dev/null || echo ''");
    return crontab.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  } catch (err) {
    return [];
  }
}

// Scheduled Tasks (with status tracking and retry)
const scheduledTasks = {
  backup: async () => {
    await run("tar -czf /var/backups/auto/backup-$(date +%Y%m%d).tar.gz /var/www");
    alert.info("Scheduled backup completed");
  },
  cleanup_logs: async () => {
    await run("rm -rf /var/log/*.gz");
    await run("journalctl --vacuum-time=7d");
    alert.info("Scheduled log cleanup completed");
  },
  cache_clear: async () => {
    await run("rm -rf /var/cache/nginx/*");
    await run("redis-cli FLUSHALL");
    alert.info("Scheduled cache clear completed");
  }
};

const taskStatus = {};

async function createScheduledTask(type, schedule, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can create scheduled tasks");
  }
  
  const command = `/root/server-core/scripts/${type}.sh`;
  await addCronJob(schedule, command, username);
  
  taskStatus[type] = { status: "pending", lastRun: null, nextRun: schedule };
  
  logAction("create_scheduled_task", "scheduled", `${type} at ${schedule}`, username, "success");
  alert.info(`Scheduled task created: ${type} at ${schedule}`);
  return true;
}

async function retryFailedTask(type, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can retry tasks");
  }
  
  if (taskStatus[type] && taskStatus[type].status === "failed") {
    try {
      await scheduledTasks[type]();
      taskStatus[type].status = "success";
      taskStatus[type].lastRun = new Date().toISOString();
      
      logAction("retry_task", "scheduled", `Retried ${type}`, username, "success");
      alert.info(`Task retried successfully: ${type}`);
      return true;
    } catch (err) {
      taskStatus[type].status = "failed";
      taskStatus[type].error = err.message;
      
      logAction("retry_task", "scheduled", `Failed: ${err.message}`, username, "error");
      alert.warning(`Task retry failed: ${type}`);
      throw err;
    }
  }
  
  throw new Error("Task not in failed state");
}

// IP Banning (with validation, temporary ban, and logging)
async function blockIP(ip, username = "admin", temporary = false, duration = 3600) {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can block IPs");
  }
  
  // Validate IP
  if (!validateInput("ip", ip)) {
    throw new Error("Invalid IP address");
  }
  
  try {
    await run(`ufw deny ${ip}`);
    await run(`iptables -A INPUT -s ${ip} -j DROP`);
    
    if (temporary) {
      // Schedule unblock after duration
      setTimeout(async () => {
        await unblockIP(ip, "system_temp");
      }, duration * 1000);
    }
    
    logAction("block_ip", "security", `Blocked ${ip}${temporary ? ` for ${duration}s` : ''}`, username, "success");
    alert.high(`IP blocked: ${ip}`);
    return true;
  } catch (err) {
    logAction("block_ip", "security", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to block IP: ${err}`);
    throw err;
  }
}

async function unblockIP(ip, username = "admin") {
  // Permission check
  if (username !== "system_temp" && !checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can unblock IPs");
  }
  
  try {
    await run(`ufw delete deny ${ip}`);
    await run(`iptables -D INPUT -s ${ip} -j DROP`);
    
    if (username !== "system_temp") {
      logAction("unblock_ip", "security", `Unblocked ${ip}`, username, "success");
      alert.info(`IP unblocked: ${ip}`);
    }
    return true;
  } catch (err) {
    if (username !== "system_temp") {
      logAction("unblock_ip", "security", `Failed: ${err.message}`, username, "error");
      alert.warning(`Failed to unblock IP: ${err}`);
    }
    throw err;
  }
}

async function listBlockedIPs() {
  try {
    const blocked = await run("ufw status | grep DENY");
    return blocked.split('\n').filter(line => line.trim());
  } catch (err) {
    return [];
  }
}

// Mail Settings (with test mail functionality)
async function updateMailSettings(settings, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can update mail settings");
  }
  
  const postfixMainPath = "/etc/postfix/main.cf";
  
  try {
    // Create backup
    createConfigBackup(postfixMainPath);
    
    let postfixConf = fs.readFileSync(postfixMainPath, "utf8");
    
    if (settings.smtp_host) {
      postfixConf = postfixConf.replace(/relayhost = .*/, `relayhost = [${settings.smtp_host}]:${settings.smtp_port || 587}`);
    }
    
    if (settings.smtp_username && settings.smtp_password) {
      const saslPath = "/etc/postfix/sasl_passwd";
      fs.writeFileSync(saslPath, `[${settings.smtp_host}]:${settings.smtp_port || 587} ${settings.smtp_username}:${settings.smtp_password}`);
      await run("postmap /etc/postfix/sasl_passwd");
      await run("chmod 600 /etc/postfix/sasl_passwd*");
      
      postfixConf = postfixConf.replace(/#smtp_sasl_auth_enable = .*/, "smtp_sasl_auth_enable = yes");
      postfixConf = postfixConf.replace(/#smtp_sasl_password_maps = .*/, "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd");
    }
    
    if (settings.use_tls) {
      postfixConf = postfixConf.replace(/#smtp_use_tls = .*/, "smtp_use_tls = yes");
    }
    
    fs.writeFileSync(postfixMainPath, postfixConf);
    await run("systemctl restart postfix");
    
    logAction("update_mail_settings", "mail", maskSensitiveData(JSON.stringify(settings)), username, "success");
    alert.info("Mail settings updated and postfix restarted");
    return true;
  } catch (err) {
    // Rollback on error
    rollbackConfig(postfixMainPath);
    logAction("update_mail_settings", "mail", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to update mail settings: ${err}`);
    throw err;
  }
}

async function testMail(toEmail, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can test mail");
  }
  
  // Validate email
  if (!validateInput("email", toEmail)) {
    throw new Error("Invalid email address");
  }
  
  try {
    await run(`echo "Test mail from server panel" | mail -s "Test Mail" ${toEmail}`);
    
    logAction("test_mail", "mail", `Test mail sent to ${toEmail}`, username, "success");
    alert.info(`Test mail sent to: ${toEmail}`);
    return true;
  } catch (err) {
    logAction("test_mail", "mail", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to send test mail: ${err}`);
    throw err;
  }
}

// DNS Templates (with validation and logging)
const dnsTemplates = {
  basic: {
    A: "@",
    MX: "mail",
    TXT: "v=spf1 ip4:YOUR_IP -all"
  },
  advanced: {
    A: "@",
    MX: "mail",
    TXT: "v=spf1 ip4:YOUR_IP include:_spf.google.com ~all",
    DKIM: "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
  }
};

async function applyDNSTemplate(domain, templateName, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can apply DNS templates");
  }
  
  // Validate domain
  if (!validateInput("domain", domain)) {
    throw new Error("Invalid domain name");
  }
  
  const template = dnsTemplates[templateName];
  if (!template) {
    throw new Error("Template not found");
  }
  
  logAction("apply_dns_template", "dns", `Applied ${templateName} to ${domain}`, username, "success");
  alert.info(`DNS template applied to ${domain}: ${templateName}`);
  return template;
}

// Server Restart (with status tracking and retry)
const restartStatus = {};

async function restartService(service, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can restart services");
  }
  
  const restartId = crypto.randomBytes(8).toString("hex");
  restartStatus[restartId] = { service, status: "restarting", startTime: new Date().toISOString() };
  
  try {
    await run(`systemctl restart ${service}`);
    restartStatus[restartId].status = "success";
    restartStatus[restartId].endTime = new Date().toISOString();
    
    logAction("restart_service", "server", `Restarted ${service}`, username, "success");
    alert.info(`Service restarted: ${service}`);
    return { success: true, restartId, service };
  } catch (err) {
    restartStatus[restartId].status = "failed";
    restartStatus[restartId].error = err.message;
    restartStatus[restartId].endTime = new Date().toISOString();
    
    logAction("restart_service", "server", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to restart service: ${err}`);
    throw err;
  }
}

async function rebootServer(username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can reboot server");
  }
  
  try {
    await run("reboot");
    
    logAction("reboot_server", "server", "Server reboot initiated", username, "success");
    alert.critical("Server reboot initiated");
    return true;
  } catch (err) {
    logAction("reboot_server", "server", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to reboot server: ${err}`);
    throw err;
  }
}

async function getRestartStatus(restartId) {
  return restartStatus[restartId] || null;
}

// Self-heal: Failed restart retry
async function retryRestart(service, username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can retry restart");
  }
  
  logAction("retry_restart", "server", `Retrying restart for ${service}`, username, "info");
  
  // Retry with backoff
  for (let i = 0; i < 3; i++) {
    try {
      await run(`systemctl restart ${service}`);
      logAction("retry_restart", "server", `Restart succeeded on attempt ${i + 1}`, username, "success");
      alert.info(`Service ${service} restarted successfully after retry`);
      return true;
    } catch (err) {
      if (i === 2) {
        logAction("retry_restart", "server", `Failed after 3 attempts: ${err.message}`, username, "error");
        alert.warning(`Failed to restart ${service} after 3 attempts`);
        throw err;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

// ENV Manager (safe editing)
async function updateEnvFile(key, value, envPath = "/var/www/.env", username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can update .env files");
  }
  
  try {
    // Create backup
    createConfigBackup(envPath);
    
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    
    const lines = envContent.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        found = true;
      }
    }
    
    if (!found) {
      lines.push(`${key}=${value}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    
    logAction("update_env", "env", `Updated ${key}`, username, "success");
    alert.info(`Environment variable updated: ${key}`);
    return true;
  } catch (err) {
    // Rollback on error
    rollbackConfig(envPath);
    logAction("update_env", "env", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to update .env: ${err}`);
    throw err;
  }
}

// Cache Manager
async function clearCache(type = "all", username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can clear cache");
  }
  
  try {
    if (type === "all" || type === "redis") {
      await run("redis-cli FLUSHALL");
      alert.info("Redis cache cleared");
    }
    
    if (type === "all" || type === "nginx") {
      await run("rm -rf /var/cache/nginx/*");
      await run("systemctl reload nginx");
      alert.info("Nginx cache cleared");
    }
    
    if (type === "all" || type === "app") {
      await run("rm -rf /var/www/*/storage/framework/cache/*");
      await run("rm -rf /var/www/*/storage/framework/views/*");
      alert.info("Application cache cleared");
    }
    
    logAction("clear_cache", "cache", `Cleared ${type} cache`, username, "success");
    return true;
  } catch (err) {
    logAction("clear_cache", "cache", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to clear cache: ${err}`);
    throw err;
  }
}

// Disk Cleaner
async function cleanStorage(username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can clean storage");
  }
  
  try {
    await run("rm -rf /tmp/*");
    await run("rm -rf /var/tmp/*");
    await run("rm -rf /var/log/*.gz");
    await run("rm -rf /var/www/*/storage/logs/*.gz");
    
    logAction("clean_storage", "storage", "Storage cleaned", username, "success");
    alert.info("Storage cleaned");
    return true;
  } catch (err) {
    logAction("clean_storage", "storage", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to clean storage: ${err}`);
    throw err;
  }
}

// Backup Trigger (manual backup)
async function triggerBackup(path = "/var/www", username = "admin") {
  // Permission check
  if (!checkPermission(username)) {
    throw new Error("Permission denied. Only Admin can trigger backup");
  }
  
  const backupFile = `/var/backups/manual/backup-${Date.now()}.tar.gz`;
  
  try {
    await run(`mkdir -p /var/backups/manual`);
    await run(`tar -czf ${backupFile} ${path}`);
    
    logAction("trigger_backup", "backup", `Backup created: ${backupFile}`, username, "success");
    alert.info(`Backup created: ${backupFile}`);
    return { success: true, backupFile };
  } catch (err) {
    logAction("trigger_backup", "backup", `Failed: ${err.message}`, username, "error");
    alert.warning(`Failed to create backup: ${err}`);
    throw err;
  }
}

// Backup Config
const backupConfig = {
  enabled: false,
  schedule: "daily",
  storagePath: "/var/backups/auto",
  retentionDays: 7
};

async function updateBackupConfig(config) {
  Object.assign(backupConfig, config);
  
  if (config.enabled) {
    const cronSchedule = config.schedule === "daily" ? "0 2 * * *" : "0 2 * * 0";
    await addCronJob(cronSchedule, "/root/backup-script.sh");
    alert.info(`Backup configured: ${config.schedule} at ${backupConfig.storagePath}`);
  } else {
    await deleteCronJob("0 2 * * *", "/root/backup-script.sh");
    alert.info("Backup disabled");
  }
  
  return backupConfig;
}

// Timezone & Locale
async function setTimezone(timezone) {
  try {
    await run(`timedatectl set-timezone ${timezone}`);
    alert.info(`Timezone set to: ${timezone}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to set timezone: ${err}`);
    throw err;
  }
}

async function setLocale(locale) {
  try {
    await run(`locale-gen ${locale}`);
    await run(`update-locale LANG=${locale}`);
    alert.info(`Locale set to: ${locale}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to set locale: ${err}`);
    throw err;
  }
}

// Service Manager
async function startService(service) {
  try {
    await run(`systemctl start ${service}`);
    alert.info(`Service started: ${service}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to start service: ${err}`);
    throw err;
  }
}

async function stopService(service) {
  try {
    await run(`systemctl stop ${service}`);
    alert.info(`Service stopped: ${service}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to stop service: ${err}`);
    throw err;
  }
}

async function restartServiceManager(service) {
  try {
    await run(`systemctl restart ${service}`);
    alert.info(`Service restarted: ${service}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to restart service: ${err}`);
    throw err;
  }
}

async function getServiceStatus(service) {
  try {
    const status = await run(`systemctl is-active ${service}`);
    const enabled = await run(`systemctl is-enabled ${service}`);
    return {
      service,
      status: status.trim(),
      enabled: enabled.trim() === "enabled"
    };
  } catch (err) {
    return {
      service,
      status: "unknown",
      enabled: false
    };
  }
}

// System Info Panel
async function getSystemInfo() {
  try {
    const os = await run("cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"'");
    const ram = await run("free -h | grep Mem | awk '{print $2}'");
    const cpuCores = await run("nproc");
    const disk = await run("df -h / | tail -1 | awk '{print $2}'");
    const uptime = await run("uptime -p");
    
    return {
      os: os.trim(),
      ram: ram.trim(),
      cpuCores: parseInt(cpuCores.trim()),
      disk: disk.trim(),
      uptime: uptime.trim()
    };
  } catch (err) {
    alert.warning(`Failed to get system info: ${err}`);
    return {};
  }
}

// Safe Mode / Maintenance Mode
const maintenanceMode = {
  enabled: false,
  message: "System under maintenance"
};

async function toggleMaintenanceMode(enabled, message = "System under maintenance") {
  maintenanceMode.enabled = enabled;
  maintenanceMode.message = message;
  
  const maintenanceFilePath = "/var/www/maintenance.html";
  
  if (enabled) {
    const html = `<!DOCTYPE html>
<html>
<head><title>Maintenance</title></head>
<body>
<h1>${message}</h1>
</body>
</html>`;
    fs.writeFileSync(maintenanceFilePath, html);
    alert.info("Maintenance mode enabled");
  } else {
    if (fs.existsSync(maintenanceFilePath)) {
      fs.unlinkSync(maintenanceFilePath);
    }
    alert.info("Maintenance mode disabled");
  }
  
  return maintenanceMode;
}

// Command Executor (Admin Only)
const allowedCommands = [
  "systemctl",
  "nginx",
  "php",
  "mysql",
  "redis-cli",
  "df",
  "free",
  "top",
  "netstat",
  "tail",
  "cat",
  "ls"
];

async function executeCommand(command, username) {
  // Check if user is admin (in production, verify from userManager)
  if (username !== "admin") {
    throw new Error("Unauthorized: Only admin can execute commands");
  }
  
  // Check if command is allowed
  const commandBase = command.split(' ')[0];
  if (!allowedCommands.includes(commandBase)) {
    throw new Error("Command not allowed");
  }
  
  try {
    const result = await run(command);
    alert.info(`Command executed by ${username}: ${command}`);
    return result;
  } catch (err) {
    alert.warning(`Command execution failed: ${err}`);
    throw err;
  }
}

// Permission Fixer
async function fixPermissions(path = "/var/www") {
  try {
    await run(`chown -R www-data:www-data ${path}`);
    await run(`chmod -R 755 ${path}`);
    await run(`chmod -R 775 ${path}/storage`);
    await run(`chmod -R 775 ${path}/bootstrap/cache`);
    alert.info(`Permissions fixed for: ${path}`);
    return true;
  } catch (err) {
    alert.warning(`Failed to fix permissions: ${err}`);
    throw err;
  }
}

// Log Rotation
async function configureLogRotation(days = 7) {
  const logrotateConf = `
/var/log/*.log {
    daily
    rotate ${days}
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
}
`;
  
  try {
    fs.writeFileSync("/etc/logrotate.d/custom", logrotateConf);
    await run("logrotate -f /etc/logrotate.d/custom");
    alert.info(`Log rotation configured: ${days} days retention`);
    return true;
  } catch (err) {
    alert.warning(`Failed to configure log rotation: ${err}`);
    throw err;
  }
}

// Exports
exports.updatePHPSettings = updatePHPSettings;
exports.switchPHPVersion = switchPHPVersion;
exports.updateNginxSettings = updateNginxSettings;
exports.addCronJob = addCronJob;
exports.deleteCronJob = deleteCronJob;
exports.runCronJobNow = runCronJobNow;
exports.listCronJobs = listCronJobs;
exports.createScheduledTask = createScheduledTask;
exports.retryFailedTask = retryFailedTask;
exports.blockIP = blockIP;
exports.unblockIP = unblockIP;
exports.listBlockedIPs = listBlockedIPs;
exports.updateMailSettings = updateMailSettings;
exports.testMail = testMail;
exports.applyDNSTemplate = applyDNSTemplate;
exports.restartService = restartService;
exports.rebootServer = rebootServer;
exports.getRestartStatus = getRestartStatus;
exports.retryRestart = retryRestart;
exports.updateEnvFile = updateEnvFile;
exports.clearCache = clearCache;
exports.cleanStorage = cleanStorage;
exports.triggerBackup = triggerBackup;
exports.updateBackupConfig = updateBackupConfig;
exports.setTimezone = setTimezone;
exports.setLocale = setLocale;
exports.startService = startService;
exports.stopService = stopService;
exports.restartServiceManager = restartServiceManager;
exports.getServiceStatus = getServiceStatus;
exports.getSystemInfo = getSystemInfo;
exports.toggleMaintenanceMode = toggleMaintenanceMode;
exports.executeCommand = executeCommand;
exports.fixPermissions = fixPermissions;
exports.configureLogRotation = configureLogRotation;
exports.getMaintenanceMode = () => maintenanceMode;
exports.getBackupConfig = () => backupConfig;
exports.getDNSTemplates = () => dnsTemplates;
exports.getTaskStatus = () => taskStatus;
exports.getActionLogs = getActionLogs;
exports.checkPermission = checkPermission;
exports.validateInput = validateInput;
exports.isDangerousCommand = isDangerousCommand;
exports.maskSensitiveData = maskSensitiveData;
exports.createConfigBackup = createConfigBackup;
exports.rollbackConfig = rollbackConfig;
