const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const alert = require("../engine/alert");
const permissionControl = require("../engine/permissionControl");

const logSources = {
  nginx: {
    access: "/var/log/nginx/access.log",
    error: "/var/log/nginx/error.log"
  },
  database: {
    postgresql: "/var/log/postgresql/postgresql-14-main.log",
    mysql: "/var/log/mysql/error.log"
  },
  auth: {
    auth: "/var/log/auth.log",
    secure: "/var/log/secure"
  },
  cron: {
    cron: "/var/log/cron.log"
  },
  mail: {
    maillog: "/var/log/maillog",
    mail: "/var/log/mail.log"
  },
  app: {
    api: "/var/log/app/api.log",
    worker: "/var/log/app/worker.log"
  },
  system: {
    syslog: "/var/log/syslog",
    messages: "/var/log/messages"
  }
};

const logBuffer = [];
const MAX_BUFFER_SIZE = 1000;
const LOG_RETENTION_DAYS = 7;
const alertHistory = [];
const securityLogs = [];
const activeStreams = new Map();
const streamPaused = new Map();

// Real-time log stream with pause/resume
async function streamLogs(source, callback, streamId = null) {
  const logPath = logSources[source];
  if (!logPath || !fs.existsSync(logPath)) {
    callback(`Log file not found: ${logPath}`);
    return;
  }

  const tail = spawn("tail", ["-f", logPath]);
  const id = streamId || `${source}-${Date.now()}`;
  
  activeStreams.set(id, tail);
  streamPaused.set(id, false);
  
  tail.stdout.on("data", (data) => {
    if (streamPaused.get(id)) return;
    
    const logLine = data.toString();
    const maskedLine = maskSensitiveData(logLine);
    addToBuffer(source, maskedLine);
    callback(maskedLine);
  });

  tail.stderr.on("data", (data) => {
    callback(`Error: ${data.toString()}`);
  });

  tail.on("close", () => {
    activeStreams.delete(id);
    streamPaused.delete(id);
    callback("Log stream closed");
  });

  return { tail, id };
}

// Pause/Resume stream
function pauseStream(streamId) {
  if (streamPaused.has(streamId)) {
    streamPaused.set(streamId, true);
    return { success: true, message: "Stream paused" };
  }
  return { success: false, message: "Stream not found" };
}

function resumeStream(streamId) {
  if (streamPaused.has(streamId)) {
    streamPaused.set(streamId, false);
    return { success: true, message: "Stream resumed" };
  }
  return { success: false, message: "Stream not found" };
}

// Stop stream
function stopStream(streamId) {
  const tail = activeStreams.get(streamId);
  if (tail) {
    tail.kill();
    activeStreams.delete(streamId);
    streamPaused.delete(streamId);
    return { success: true, message: "Stream stopped" };
  }
  return { success: false, message: "Stream not found" };
}

// Mask sensitive data
function maskSensitiveData(line) {
  let masked = line;
  
  // Mask passwords
  masked = masked.replace(/password["\s:=]+[^\s"']+/gi, 'password="*****"');
  masked = masked.replace(/passwd["\s:=]+[^\s"']+/gi, 'passwd="*****"');
  masked = masked.replace(/pwd["\s:=]+[^\s"']+/gi, 'pwd="*****"');
  
  // Mask API keys/tokens
  masked = masked.replace(/api[_-]?key["\s:=]+[^\s"']+/gi, 'api_key="*****"');
  masked = masked.replace(/token["\s:=]+[^\s"']+/gi, 'token="*****"');
  masked = masked.replace(/bearer["\s:=]+[^\s"']+/gi, 'bearer="*****"');
  masked = masked.replace(/authorization["\s:=]+[^\s"']+/gi, 'authorization="*****"');
  
  // Mask credit card numbers (basic pattern)
  masked = masked.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****');
  
  // Mask email addresses (optional)
  // masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
  
  return masked;
}

function addToBuffer(source, logLine) {
  const logEntry = {
    id: `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source,
    line: logLine,
    timestamp: new Date().toISOString(),
    type: detectLogType(logLine)
  };

  logBuffer.push(logEntry);
  
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Check for error spikes
  if (logEntry.type === "error") {
    checkErrorSpike(source);
    // Trigger alert on ERROR
    alert.error(`Error detected in ${source}: ${logLine.substring(0, 100)}`);
  }

  // Security log tracking
  if (source === "auth" || source === "secure") {
    trackSecurityLogs(logLine);
  }
}

function detectLogType(line) {
  const lower = line.toLowerCase();
  if (lower.includes("error") || lower.includes("fail") || lower.includes("critical")) {
    return "error";
  } else if (lower.includes("warn") || lower.includes("warning")) {
    return "warn";
  }
  return "info";
}

async function checkErrorSpike(source) {
  const recentErrors = logBuffer.filter(
    l => l.source === source && l.type === "error" && 
    Date.now() - new Date(l.timestamp).getTime() < 60000
  );

  if (recentErrors.length > 10) {
    alert.critical(`Error spike detected in ${source}: ${recentErrors.length} errors in last minute`);
    alertHistory.push({
      type: "error_spike",
      source,
      count: recentErrors.length,
      timestamp: new Date().toISOString()
    });
  }
}

function trackSecurityLogs(line) {
  const lower = line.toLowerCase();
  
  if (lower.includes("failed login") || lower.includes("invalid user")) {
    const ipMatch = line.match(/from (\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      securityLogs.push({
        type: "failed_login",
        ip: ipMatch[1],
        timestamp: new Date().toISOString(),
        line
      });
      
      // Check for repeated failed attempts
      const recentFailures = securityLogs.filter(
        l => l.type === "failed_login" && l.ip === ipMatch[1] &&
        Date.now() - new Date(l.timestamp).getTime() < 300000
      );
      
      if (recentFailures.length > 5) {
        alert.critical(`Brute force attack detected from IP: ${ipMatch[1]}`);
      }
    }
  }

  if (lower.includes("accepted")) {
    const ipMatch = line.match(/from (\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      securityLogs.push({
        type: "successful_login",
        ip: ipMatch[1],
        timestamp: new Date().toISOString(),
        line
      });
    }
  }
}

async function getLogs(filters = {}, role = "admin") {
  // Permission control
  if (role !== "admin" && role !== "server_manager" && role !== "developer") {
    throw new Error("Permission denied. Only Admin, Server Manager, and Developer can view logs");
  }
  
  // Developer can only see app logs
  if (role === "developer" && filters.service && !["app", "api", "worker"].includes(filters.service)) {
    throw new Error("Permission denied. Developer can only view application logs");
  }
  
  let filteredLogs = [...logBuffer];

  if (filters.type) {
    filteredLogs = filteredLogs.filter(l => l.type === filters.type);
  }

  if (filters.service) {
    filteredLogs = filteredLogs.filter(l => l.source === filters.service);
  }

  if (filters.startTime) {
    filteredLogs = filteredLogs.filter(l => new Date(l.timestamp) >= new Date(filters.startTime));
  }

  if (filters.endTime) {
    filteredLogs = filteredLogs.filter(l => new Date(l.timestamp) <= new Date(filters.endTime));
  }

  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    filteredLogs = filteredLogs.filter(l => l.line.toLowerCase().includes(keyword));
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    logs: filteredLogs.slice(start, end),
    total: filteredLogs.length,
    page,
    limit
  };
}

async function downloadLogs(source, format = "log", timeRange = "24h", role = "admin") {
  // Permission control
  if (role !== "admin" && role !== "server_manager") {
    throw new Error("Permission denied. Only Admin and Server Manager can download logs");
  }
  
  const logPath = logSources[source];
  if (!logPath || !fs.existsSync(logPath)) {
    throw new Error(`Log file not found: ${logPath}`);
  }

  let content = fs.readFileSync(logPath, "utf8");
  
  // Filter by time range
  const now = Date.now();
  let startTime;
  
  if (timeRange === "1h") {
    startTime = now - 3600000; // 1 hour
  } else if (timeRange === "24h") {
    startTime = now - 86400000; // 24 hours
  } else if (timeRange === "7d") {
    startTime = now - 604800000; // 7 days
  } else if (timeRange.startsWith("custom:")) {
    startTime = parseInt(timeRange.split(":")[1]);
  }
  
  if (startTime) {
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      // Try to extract timestamp from log line
      const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/);
      if (timestampMatch) {
        const lineTime = new Date(timestampMatch[0]).getTime();
        return lineTime >= startTime;
      }
      return true; // Keep line if no timestamp found
    });
    content = filteredLines.join('\n');
  }
  
  // Format conversion
  let formattedContent = content;
  let filename = `${source}-logs-${Date.now()}`;
  
  if (format === "csv") {
    const lines = content.split('\n');
    const csvLines = lines.map(line => {
      const entry = parseLogLine(line, source);
      return `"${entry.id}","${entry.source}","${entry.level}","${entry.timestamp}","${entry.message.replace(/"/g, '""')}"`;
    });
    formattedContent = "id,source,level,timestamp,message\n" + csvLines.join('\n');
    filename += ".csv";
  } else if (format === "txt") {
    formattedContent = content;
    filename += ".txt";
  } else {
    formattedContent = content;
    filename += ".log";
  }
  
  return {
    filename,
    content: formattedContent,
    size: formattedContent.length,
    lines: formattedContent.split('\n').length
  };
}

// Parse log line for CSV format
function parseLogLine(line, source) {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source,
    level: detectLogType(line).toUpperCase(),
    timestamp: new Date().toISOString(),
    message: line.trim()
  };
}

async function clearLogs(source) {
  const logPath = logSources[source];
  if (!logPath || !fs.existsSync(logPath)) {
    throw new Error(`Log file not found: ${logPath}`);
  }

  fs.writeFileSync(logPath, "");
  alert.info(`Cleared logs for ${source}`);
}

async function rotateLogs() {
  try {
    await spawn("logrotate", ["-f", "/etc/logrotate.conf"]);
    alert.info("Log rotation completed");
  } catch (err) {
    alert.warning(`Log rotation failed: ${err}`);
  }
}

// Auto-delete old logs (retention policy)
async function cleanupOldLogs() {
  try {
    const cutoffDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    
    // Clean up buffer
    const beforeCleanup = logBuffer.length;
    for (let i = logBuffer.length - 1; i >= 0; i--) {
      if (new Date(logBuffer[i].timestamp) < cutoffDate) {
        logBuffer.splice(i, 1);
      }
    }
    
    // Clean up security logs
    for (let i = securityLogs.length - 1; i >= 0; i--) {
      if (new Date(securityLogs[i].timestamp) < cutoffDate) {
        securityLogs.splice(i, 1);
      }
    }
    
    // Clean up alert history
    for (let i = alertHistory.length - 1; i >= 0; i--) {
      if (new Date(alertHistory[i].timestamp) < cutoffDate) {
        alertHistory.splice(i, 1);
      }
    }
    
    const afterCleanup = logBuffer.length;
    alert.info(`Log cleanup completed: removed ${beforeCleanup - afterCleanup} old entries`);
  } catch (err) {
    alert.warning(`Log cleanup failed: ${err}`);
  }
}

// Error analytics
async function getErrorAnalytics() {
  const errorsByService = {};
  const warningsByService = {};
  const criticalErrors = [];
  
  logBuffer.forEach(log => {
    if (log.type === "error") {
      errorsByService[log.source] = (errorsByService[log.source] || 0) + 1;
      
      // Check for critical errors
      if (log.line.toLowerCase().includes("critical") || 
          log.line.toLowerCase().includes("fatal") ||
          log.line.toLowerCase().includes("panic")) {
        criticalErrors.push({
          id: log.id,
          source: log.source,
          line: log.line,
          timestamp: log.timestamp
        });
      }
    } else if (log.type === "warn") {
      warningsByService[log.source] = (warningsByService[log.source] || 0) + 1;
    }
  });
  
  // Check for warning spikes
  const warningSpikes = [];
  Object.keys(warningsByService).forEach(service => {
    const recentWarnings = logBuffer.filter(
      l => l.source === service && l.type === "warn" &&
      Date.now() - new Date(l.timestamp).getTime() < 300000 // 5 minutes
    );
    
    if (recentWarnings.length > 20) {
      warningSpikes.push({
        service,
        count: recentWarnings.length,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return {
    errorsByService,
    warningsByService,
    criticalErrors,
    warningSpikes,
    totalErrors: Object.values(errorsByService).reduce((a, b) => a + b, 0),
    totalWarnings: Object.values(warningsByService).reduce((a, b) => a + b, 0)
  };
}

async function getLogDetails(logId) {
  return logBuffer[logId] || null;
}

async function getPerformanceMetrics() {
  const metrics = {
    cpu: await getCPUMetrics(),
    ram: await getRAMMetrics(),
    disk: await getDiskMetrics(),
    network: await getNetworkMetrics()
  };
  return metrics;
}

async function getCPUMetrics() {
  const os = require("os");
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuUsage = (loadAvg[0] / cpus.length) * 100;
  
  return {
    usage: Math.min(cpuUsage, 100),
    loadAverage: loadAvg,
    cores: cpus.length,
    timestamp: new Date().toISOString()
  };
}

async function getRAMMetrics() {
  const os = require("os");
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usage = (usedMem / totalMem) * 100;
  
  return {
    total: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
    free: (freeMem / 1024 / 1024 / 1024).toFixed(2),
    usage: usage.toFixed(2),
    timestamp: new Date().toISOString()
  };
}

async function getDiskMetrics() {
  const { run } = require("../utils/exec");
  try {
    const diskInfo = await run("df -h / | tail -1");
    const parts = diskInfo.split(/\s+/);
    const total = parts[1];
    const used = parts[2];
    const available = parts[3];
    const usage = parseInt(parts[4]);
    
    return {
      total,
      used,
      available,
      usage,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { total: "0", used: "0", available: "0", usage: 0, timestamp: new Date().toISOString() };
  }
}

async function getNetworkMetrics() {
  const { run } = require("../utils/exec");
  try {
    const networkInfo = await run("cat /proc/net/dev | tail -2");
    const lines = networkInfo.split('\n');
    const eth0 = lines[0].split(/\s+/);
    
    return {
      interface: "eth0",
      rx: eth0[2],
      tx: eth0[10],
      connections: await run("netstat -an | grep ESTABLISHED | wc -l").then(r => parseInt(r.trim())),
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { interface: "eth0", rx: "0", tx: "0", connections: 0, timestamp: new Date().toISOString() };
  }
}

async function getGraphData(metric, timeRange = "1h") {
  const data = [];
  const now = Date.now();
  const interval = 60000; // 1 minute
  const points = timeRange === "1h" ? 60 : timeRange === "24h" ? 1440 : 60;

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    let value = 0;

    if (metric === "cpu") {
      const metrics = await getCPUMetrics();
      value = metrics.usage;
    } else if (metric === "ram") {
      const metrics = await getRAMMetrics();
      value = parseFloat(metrics.usage);
    } else if (metric === "network") {
      const metrics = await getNetworkMetrics();
      value = metrics.connections;
    }

    data.push({
      timestamp: new Date(timestamp).toISOString(),
      value
    });
  }

  return data;
}

async function getAlertHistory() {
  return alertHistory;
}

async function getSecurityLogs() {
  return securityLogs;
}

exports.loop = async () => {
  // Background log processing
  const errorCount = logBuffer.filter(l => l.type === "error").length;
  if (errorCount > 50) {
    alert.critical(`High error count in buffer: ${errorCount}`);
  }
  
  // Auto cleanup old logs
  await cleanupOldLogs();
  
  // Self-heal: check for missing log sources
  await checkLogSources();
};

// Self-heal: check for missing log sources and reload
async function checkLogSources() {
  for (const [source, paths] of Object.entries(logSources)) {
    for (const [type, logPath] of Object.entries(paths)) {
      if (!fs.existsSync(logPath)) {
        // Try to create the log file
        try {
          const dir = path.dirname(logPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(logPath, "");
          alert.info(`Created missing log file: ${logPath}`);
        } catch (err) {
          alert.warning(`Failed to create log file ${logPath}: ${err}`);
        }
      }
    }
  }
}

// Self-heal: reconnect failed streams
async function reconnectFailedStreams() {
  for (const [streamId, tail] of activeStreams.entries()) {
    if (tail.killed) {
      // Attempt to reconnect
      const source = streamId.split('-')[0];
      alert.info(`Attempting to reconnect stream for ${source}`);
      // Reconnection would be handled by the client re-initiating the stream
    }
  }
}

// Self-heal: alert on high error rate
async function checkHighErrorRate() {
  const analytics = await getErrorAnalytics();
  if (analytics.totalErrors > 100) {
    alert.critical(`High error rate detected: ${analytics.totalErrors} total errors`);
  }
  
  if (analytics.warningSpikes.length > 0) {
    analytics.warningSpikes.forEach(spike => {
      alert.warning(`Warning spike in ${spike.service}: ${spike.count} warnings in 5 minutes`);
    });
  }
}

exports.streamLogs = streamLogs;
exports.pauseStream = pauseStream;
exports.resumeStream = resumeStream;
exports.stopStream = stopStream;
exports.getLogs = getLogs;
exports.downloadLogs = downloadLogs;
exports.clearLogs = clearLogs;
exports.rotateLogs = rotateLogs;
exports.cleanupOldLogs = cleanupOldLogs;
exports.getLogDetails = getLogDetails;
exports.getPerformanceMetrics = getPerformanceMetrics;
exports.getGraphData = getGraphData;
exports.getAlertHistory = getAlertHistory;
exports.getSecurityLogs = getSecurityLogs;
exports.getLogSources = () => logSources;
exports.getErrorAnalytics = getErrorAnalytics;
exports.checkLogSources = checkLogSources;
exports.reconnectFailedStreams = reconnectFailedStreams;
exports.checkHighErrorRate = checkHighErrorRate;
exports.maskSensitiveData = maskSensitiveData;
