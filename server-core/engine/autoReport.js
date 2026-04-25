const os = require("os");
const { run } = require("../utils/exec");
const alert = require("./alert");
const serviceWatcher = require("../watcher/serviceWatcher");

const stats = {
  uptimeStart: Date.now(),
  errorsFixed: 0,
  servicesRestarted: 0,
  threatsBlocked: 0
};

exports.increment = (type) => {
  if (stats[type] !== undefined) {
    stats[type]++;
  }
};

exports.generateDailyReport = async () => {
  const uptime = Date.now() - stats.uptimeStart;
  const uptimeHours = uptime / (1000 * 60 * 60);
  const uptimePercent = (uptimeHours / 24) * 100;
  
  const load = os.loadavg()[0];
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;
  
  const serviceStatus = serviceWatcher.getStatus();
  
  const report = `
=== DAILY SYSTEM REPORT ===
Generated: ${new Date().toISOString()}

UPTIME: ${uptimePercent.toFixed(1)}% (${uptimeHours.toFixed(1)} hours)
CPU Load: ${load.toFixed(2)}
Memory Usage: ${memUsage.toFixed(1)}%

ERRORS FIXED: ${stats.errorsFixed}
SERVICES RESTARTED: ${stats.servicesRestarted}
THREATS BLOCKED: ${stats.threatsBlocked}

SERVICE STATUS:
${Object.entries(serviceStatus.retryMap).map(([svc, count]) => 
  `- ${svc}: ${count} retries`
).join('\n')}

CRITICAL SERVICES:
${Object.entries(serviceStatus.criticalMap).filter(([_, critical]) => critical).map(([svc]) => 
  `- ${svc}: CRITICAL`
).join('\n') || 'None'}
`;

  alert.critical(report);
  
  // Reset daily stats
  stats.uptimeStart = Date.now();
  stats.errorsFixed = 0;
  stats.servicesRestarted = 0;
  stats.threatsBlocked = 0;
  
  return report;
};

exports.getStats = () => {
  return stats;
};
