const serviceWatcher = require("./watcher/serviceWatcher");
const domainWatcher = require("./watcher/domainWatcher");
const dnsWatcher = require("./watcher/dnsWatcher");
const sslWatcher = require("./watcher/sslWatcher");
const resourceWatcher = require("./watcher/resourceWatcher");
const databaseWatcher = require("./watcher/databaseWatcher");
const trafficWatcher = require("./watcher/trafficWatcher");
const mailWatcher = require("./watcher/mailWatcher");
const metricsWatcher = require("./watcher/metricsWatcher");
const securityWatcher = require("./watcher/securityWatcher");
const cleanupWatcher = require("./watcher/cleanupWatcher");
const backgroundWatcher = require("./watcher/backgroundWatcher");
const logsWatcher = require("./watcher/logsWatcher");
const alert = require("./engine/alert");
const autoReport = require("./engine/autoReport");

alert.info("Ultra Heal Engine Started");

// 3 sec → metrics check
setInterval(async () => {
  try {
    await metricsWatcher.loop();
  } catch (err) {
    alert.critical(`Metrics watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 3000);

// 5 sec → service check
setInterval(async () => {
  try {
    await serviceWatcher.loop();
  } catch (err) {
    alert.critical(`Service watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 5000);

// 10 sec → logs processing
setInterval(async () => {
  try {
    await logsWatcher.loop();
  } catch (err) {
    alert.critical(`Logs watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 10000);

// 30 sec → domain check
setInterval(async () => {
  try {
    await domainWatcher.loop();
  } catch (err) {
    alert.critical(`Domain watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 30000);

// 30 sec → DNS check
setInterval(async () => {
  try {
    await dnsWatcher.loop();
  } catch (err) {
    alert.critical(`DNS watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 30000);

// 5 min → SSL check
setInterval(async () => {
  try {
    await sslWatcher.loop();
  } catch (err) {
    alert.critical(`SSL watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 300000);

// 10 min → resource clean
setInterval(async () => {
  try {
    await resourceWatcher.loop();
  } catch (err) {
    alert.critical(`Resource watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 600000);

// 15 min → cleanup
setInterval(async () => {
  try {
    await cleanupWatcher.loop();
  } catch (err) {
    alert.critical(`Cleanup watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 900000);

// 30 min → background jobs
setInterval(async () => {
  try {
    await backgroundWatcher.loop();
  } catch (err) {
    alert.critical(`Background watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 1800000);

// 1 hr → full health scan
setInterval(async () => {
  try {
    await serviceWatcher.loop();
    await domainWatcher.loop();
    await dnsWatcher.loop();
    await databaseWatcher.loop();
    await trafficWatcher.loop();
    await mailWatcher.loop();
    await resourceWatcher.loop();
    await securityWatcher.loop();
    await metricsWatcher.loop();
    await logsWatcher.rotateLogs();
    await autoReport.generateDailyReport();
  } catch (err) {
    alert.critical(`Full health scan error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 3600000);

// Database watcher - every 30 sec
setInterval(async () => {
  try {
    await databaseWatcher.loop();
  } catch (err) {
    alert.critical(`Database watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 30000);

// Traffic watcher - every 15 sec
setInterval(async () => {
  try {
    await trafficWatcher.loop();
  } catch (err) {
    alert.critical(`Traffic watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 15000);

// Mail watcher - every 20 sec
setInterval(async () => {
  try {
    await mailWatcher.loop();
  } catch (err) {
    alert.critical(`Mail watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 20000);

// Security watcher - every 5 min
setInterval(async () => {
  try {
    await securityWatcher.loop();
  } catch (err) {
    alert.critical(`Security watcher error: ${err}`);
    autoReport.increment("errorsFixed");
  }
}, 300000);

// Initial run
(async () => {
  try {
    await metricsWatcher.loop();
    await serviceWatcher.loop();
    await domainWatcher.loop();
    await dnsWatcher.loop();
    await sslWatcher.loop();
    await resourceWatcher.loop();
    await databaseWatcher.loop();
    await trafficWatcher.loop();
    await mailWatcher.loop();
    await securityWatcher.loop();
    await backgroundWatcher.loop();
    await logsWatcher.loop();
    alert.info("Initial health scan completed");
  } catch (err) {
    alert.critical(`Initial run error: ${err}`);
  }
})();
